'use strict';
// 법정(court) — 부팅 탐침 + 표준 시나리오(L3 화면 확인).
// 주장과 무관하게 항상 돈다. 기준 커밋(base)에서 되던 것이 작업 커밋(head)에서 안 되면 "되던 기능이 고장 남"이다.
//  - 앱이 뜨는가 / 새로 생긴 미처리 예외가 있는가(문구+스크립트 경로의 개수 비교, 줄번호는 무시) / 새로 생긴 404 가 있는가
//  - court/scenarios/std-*.json 표준 점검 경로가 여전히 통과하는가
// "고장"이라고 말하기 전에 세 가지를 가린다(정상 작업을 고장으로 돌려보내지 않기 위해서다):
//  ① 우연인가 — 차이가 보이면 양쪽을 두 번씩 더 돌려, 매번 그대로일 때만 고장으로 센다.
//  ② 법정 환경 탓인가 — 법정은 외부 통신을 막고 돈다. 이 변경이 새로 부르는 외부 스크립트가 막혀서 난 오류는 실서비스의 고장인지 법정이 알 수 없다.
//  ③ 표준 점검이 낡았는가 — 누를 대상이 여러 개가 되어 법정이 하나를 고를 수 없게 된 것은 기능 고장이 아니라 표준 점검을 고쳐야 하는 일이다.
// 표준 점검(scenarios/std-*.json)의 선택자는 고유 id 로 적는다. 앱이 id 를 주지 않은 대상은 id 가 있는 그릇 안으로 좁혀 적는다
// (예: 목표 탭의 새 목표 버튼 = 목표가 있을 때의 #sAddGoalBtn, 없을 때의 #sanctuaryGoalsView .empty-card 안 단추). 화면 어딘가에 같은 모양의 단추가 하나 더 생겨도 걸리지 않게 하기 위해서다.
// ②·③은 regressions 가 아니라 notChecked 로 내린다 = "법정이 확인하지 못했다"(판정은 최소 확인 부족이어야 한다 — judge.js 가 읽는다).
const fs = require('node:fs');
const path = require('node:path');
const { runScenario, scrubSiteText, BLANK_PATH } = require('../lib/scenario');

const CONFIRM_RUNS = 2; // 차이가 보였을 때 양쪽을 더 돌리는 횟수(처음 1회 + 2회 = 3회)
// 외부 라이브러리를 못 받았을 때 나는 오류의 모양(그 이름이 없다·그것의 기능을 못 부른다). 그 밖의 새 오류는 외부 차단과 상관없이 고장으로 본다.
const MISSING_LIBRARY_ERROR = /^(?:Uncaught\s+)?(?:ReferenceError|TypeError)\b/;

function bootScenario(cfg) {
  return { id: 'court-boot', title: '앱이 뜨고 첫 화면까지 간다', steps: [
    { do: 'goto', path: '/index.html' }, { do: 'waitFor', selector: cfg.bootWaitSelector || 'body *' }, { do: 'wait', ms: 2500 }, { capture: 'boot' },
  ] };
}

// 오류 묶음. 문구 속의 앱 주소(실행마다·커밋마다 바뀌는 호스트와 포트)와 blob: 임시 주소는 고정 글자로 바꾼 뒤 센다.
function bag(list, siteUrl) { const m = new Map(); for (const e of list) { const k = scrubSiteText(e.text, siteUrl) + ' @ ' + scrubSiteText(e.url || '', siteUrl); m.set(k, (m.get(k) || 0) + 1); } return m; }

function diffBags(baseList, headList, baseUrl, headUrl) {
  const b = bag(baseList, baseUrl), h = bag(headList, headUrl), added = [];
  for (const [k, n] of h) { const was = b.get(k) || 0; if (n > was) added.push({ key: k, base: was, head: n }); }
  return added;
}

function new404(baseReq, headReq) {
  const ignore = p => p.startsWith('/api/') || p === '/favicon.ico' || p === BLANK_PATH; // BLANK_PATH = 법정이 브라우저 상표 목록을 읽으려고 일부러 여는 없는 경로
  const b = new Set(baseReq.filter(r => r.status === 404).map(r => r.path));
  return [...new Set(headReq.filter(r => r.status === 404 && !b.has(r.path) && !ignore(r.path)).map(r => r.path))];
}

function loadStdScenarios(dir) {
  const d = dir || path.join(__dirname, '..', 'scenarios');
  let names = []; try { names = fs.readdirSync(d); } catch (_) { names = []; }
  return names.filter(n => /^std-.*\.json$/.test(n)).sort().map(n => JSON.parse(fs.readFileSync(path.join(d, n), 'utf8')));
}

// 부팅 한 번. 그 실행 동안 법정 서버가 받은 요청만 잘라서 같이 돌려준다(기준·작업은 차례로 돌므로 서로 섞이지 않는다).
async function bootOnce(side, sc, config, outDir) {
  const from = side.server.requests.length;
  const r = await runScenario({ scenario: sc, siteUrl: side.url, siteRev: side.sha, outDir, config });
  return { r, passed: r.passed, exceptions: r.bootExceptions.concat(r.exceptions), requests: side.server.requests.slice(from), blocked: r.blockedExternal || [] };
}

// 여러 번 돌린 결과로 "매번 그대로인 차이"만 고른다.
//  새 오류: 작업 커밋의 모든 실행에서, 기준 커밋의 어느 실행보다도 많이 났다 / 새 404: 작업 커밋은 매번, 기준 커밋은 한 번도 / 안 뜸: 기준은 매번 뜨고 작업은 매번 안 뜸
function steadyBootDiff(baseRuns, headRuns, base, head) {
  const steady = [], shaky = [];
  const bBags = baseRuns.map(x => bag(x.exceptions, base.url)), hBags = headRuns.map(x => bag(x.exceptions, head.url));
  for (const key of new Set(hBags.flatMap(m => [...m.keys()]))) {
    const hs = hBags.map(m => m.get(key) || 0), bs = bBags.map(m => m.get(key) || 0);
    if (Math.max(...hs) <= Math.min(...bs)) continue; // 어느 실행에서도 기준보다 많이 난 적이 없다
    (Math.min(...hs) > Math.max(...bs) ? steady : shaky).push({ kind: 'NEW_EXCEPTION', key, text: key.split(' @ ')[0], base: Math.max(...bs), head: Math.min(...hs), runs: { base: bs, head: hs } });
  }
  const b404 = baseRuns.map(x => new Set(x.requests.filter(q => q.status === 404).map(q => q.path)));
  const h404 = headRuns.map((x, i) => new Set(new404(baseRuns[Math.min(i, baseRuns.length - 1)].requests, x.requests)));
  for (const p of new Set(h404.flatMap(s => [...s]))) {
    const always = h404.every(s => s.has(p)) && b404.every(s => !s.has(p));
    (always ? steady : shaky).push({ kind: 'NEW_404', key: p });
  }
  const bUp = baseRuns.map(x => x.passed), hUp = headRuns.map(x => x.passed);
  if (bUp.some(Boolean) && hUp.some(u => !u)) (bUp.every(Boolean) && hUp.every(u => !u) ? steady : shaky).push({ kind: 'BOOT_FAILED', key: 'boot', runs: { base: bUp, head: hUp } });
  return { steady, shaky };
}

// base·head = { url, sha, server } (server.requests 로 404 를 본다)
async function probeBoot(ctx) {
  const { base, head, config, outDir } = ctx;
  const out = { regressions: [], insufficient: [], notChecked: [], toolErrors: [], boot: null, std: [] };
  // notChecked = 법정이 끝까지 확인하지 못한 것 { kind, title, text }. 같은 문장을 insufficient 에도 넣는다(판정서에 반드시 보이게).
  const notChecked = (kind, title, text) => { out.notChecked.push({ kind, title, text }); out.insufficient.push(text); };
  const sc = bootScenario(config);
  const toolFail = x => (x.r.failKind === 'tool' ? (x.r.toolError || (x.r.errors || []).join(' / ') || '도구 오류') : null);
  const B = await bootOnce(base, sc, config, outDir ? path.join(outDir, 'boot-base') : null);
  const H = await bootOnce(head, sc, config, outDir ? path.join(outDir, 'boot-head') : null);
  out.boot = {
    base: { passed: B.passed, exceptions: B.exceptions, toolError: B.r.toolError, blockedExternal: B.blocked },
    head: { passed: H.passed, exceptions: H.exceptions, toolError: H.r.toolError, blockedExternal: H.blocked, captures: H.r.captures, env: H.r.env || null },
    chromeVersion: H.r.chromeVersion || B.r.chromeVersion,
  };
  if (toolFail(B) || toolFail(H)) { out.toolErrors.push('부팅 탐침 도구 오류: ' + (toolFail(B) || toolFail(H))); return out; }
  if (!B.passed && !H.passed) { out.toolErrors.push('기준 커밋과 작업 커밋 모두 첫 화면까지 가지 못했다 — 법정 부팅 설정(bootWaitSelector)을 점검해야 한다'); return out; }

  // ① 차이가 보이면 양쪽을 더 돌려 본다. 매번 그대로인 차이만 고장 후보다.
  const baseRuns = [B], headRuns = [H];
  let diff = steadyBootDiff(baseRuns, headRuns, base, head);
  if (diff.steady.length || diff.shaky.length) {
    for (let i = 0; i < CONFIRM_RUNS; i++) { baseRuns.push(await bootOnce(base, sc, config, null)); headRuns.push(await bootOnce(head, sc, config, null)); }
    const broken = baseRuns.concat(headRuns).map(toolFail).find(Boolean);
    if (broken) { out.toolErrors.push('부팅 탐침 도구 오류(다시 돌려 보는 중): ' + broken); return out; }
    diff = steadyBootDiff(baseRuns, headRuns, base, head);
    out.boot.stability = { runs: baseRuns.length, steady: diff.steady.map(d => d.kind + ' ' + d.key), shaky: diff.shaky.map(d => d.kind + ' ' + d.key) };
    for (const d of diff.shaky) out.insufficient.push('앱을 띄울 때의 차이가 실행마다 달랐다(' + (d.kind === 'NEW_EXCEPTION' ? '오류 “' + d.text + '” 기준 [' + d.runs.base.join(', ') + ']회 / 작업 [' + d.runs.head.join(', ') + ']회' : (d.kind === 'NEW_404' ? '없는 파일 요청 ' + d.key : '첫 화면까지 가는지')) + ') — ' + baseRuns.length + '번씩 돌려 매번 같지 않았으므로 고장으로 세지 않았다.');
  }
  // ② 이 변경이 새로 부르는 외부 스크립트 가운데 법정이 막은 것(작업 커밋에서는 매번 막혔고 기준 커밋에서는 부른 적이 없다)
  const scriptUrls = run => new Set(run.blocked.filter(q => q.type === 'Script').map(q => q.url));
  const baseBlocked = new Set(baseRuns.flatMap(x => [...scriptUrls(x)]));
  const newlyBlocked = [...scriptUrls(headRuns[0])].filter(u => !baseBlocked.has(u) && headRuns.every(x => scriptUrls(x).has(u)));
  const blockedNote = newlyBlocked.length ? ' (참고: 이 변경이 새로 부르는 외부 파일 ' + newlyBlocked.slice(0, 2).join(', ') + ' 을 법정이 막고 있다. 그 때문일 수 있다 — 법정에서 확인하려면 그 파일의 고정 사본을 법정의 대체 응답 목록에 먼저 넣어야 한다)' : '';
  out.boot.newlyBlockedExternal = newlyBlocked;
  for (const d of diff.steady) {
    if (d.kind === 'BOOT_FAILED') out.regressions.push({ kind: d.kind, detail: '기준 커밋에서는 뜨던 앱이 작업 커밋에서는 첫 화면까지 가지 못한다' + (H.r.failedStep ? '(' + H.r.steps[H.r.failedStep - 1].detail + ')' : '') + blockedNote });
    else if (d.kind === 'NEW_404') out.regressions.push({ kind: d.kind, detail: '앱이 찾는 파일이 없어졌다: ' + d.key });
    else if (newlyBlocked.length && MISSING_LIBRARY_ERROR.test(d.text)) {
      notChecked('EXTERNAL_BLOCKED', '법정 환경 한계(외부 차단: ' + newlyBlocked.slice(0, 3).join(', ') + ')', '앱을 띄울 때 새 오류가 났다(' + d.key + '). 이 변경이 새로 부르는 외부 파일을 법정이 막고 있어서 난 오류로 보인다. 법정은 외부 통신을 끊고 심사하므로, 실제 서비스에서도 나는 오류인지는 확인하지 못했다. 법정에서 확인하려면 그 파일의 고정 사본을 법정의 대체 응답 목록(court/config.json 의 stubs 와 court/vendor)에 먼저 넣어야 한다 — 금고 변경이므로 별도 PR 이다.');
    } else out.regressions.push({ kind: d.kind, detail: '앱을 띄우기만 해도 새 오류가 난다: ' + d.key + ' (기준 ' + d.base + '회 → 작업 ' + d.head + '회' + (baseRuns.length > 1 ? ', ' + baseRuns.length + '번씩 돌려 매번 같음' : '') + ')' });
  }

  for (const std of loadStdScenarios(ctx.scenariosDir)) {
    const sb = await runScenario({ scenario: std, siteUrl: base.url, siteRev: base.sha, outDir: outDir ? path.join(outDir, 'std-base') : null, config });
    const sh = await runScenario({ scenario: std, siteUrl: head.url, siteRev: head.sha, outDir: outDir ? path.join(outDir, 'std-head') : null, config });
    const rec = { id: std.id, title: std.title, steps: std.steps, base: { passed: sb.passed, failedStep: sb.failedStep, failKind: sb.failKind, failReason: sb.failReason || null }, head: { passed: sh.passed, failedStep: sh.failedStep, failKind: sh.failKind, failReason: sh.failReason || null, detail: sh.failedStep ? sh.steps[sh.failedStep - 1].detail : '', captures: sh.captures } };
    out.std.push(rec);
    if (sb.failKind === 'tool' || sh.failKind === 'tool') { out.toolErrors.push('표준 시나리오 ' + std.id + ' 도구 오류: ' + (sb.toolError || sh.toolError || (sb.errors || []).concat(sh.errors || []).join(' / '))); continue; }
    // 결과가 갈리면(=돌려보냄 사유가 되면) 우연이 아닌지 양쪽을 두 번씩 더 돌린다. 한 번이라도 다르게 나오면 회귀로 세지 않고 "흔들림"으로 남긴다.
    if (sb.passed !== sh.passed) {
      const sig = r => (r.passed ? 'pass' : 'fail@' + r.failedStep + (r.failReason ? ':' + r.failReason : ''));
      const runs = { base: [sig(sb)], head: [sig(sh)] };
      for (let i = 0; i < CONFIRM_RUNS; i++) {
        runs.base.push(sig(await runScenario({ scenario: std, siteUrl: base.url, siteRev: base.sha, outDir: null, config })));
        runs.head.push(sig(await runScenario({ scenario: std, siteUrl: head.url, siteRev: head.sha, outDir: null, config })));
      }
      rec.stability = runs;
      if (new Set(runs.base).size > 1 || new Set(runs.head).size > 1) { out.insufficient.push('표준 점검 "' + std.title + '" 의 결과가 흔들린다 — 기준 [' + runs.base.join(', ') + '] / 작업 [' + runs.head.join(', ') + ']. 회귀로 세지 않았다.'); continue; }
    }
    if (sb.passed && !sh.passed) {
      // ③ 누를 대상이 여러 개가 된 것은 "없어졌다"와 다르다. 기능은 그대로일 수 있고, 법정이 어느 것을 눌러야 할지 모를 뿐이다.
      if (sh.failKind === 'action' && sh.failReason === 'ambiguous') {
        rec.head.stale = true;
        notChecked('STD_SCENARIO_STALE', '표준 점검 갱신 필요', '표준 점검 "' + std.title + '" 을 작업 커밋에서 끝까지 해 보지 못했다(단계 ' + sh.failedStep + ': ' + rec.head.detail + '). 눌러야 할 대상이 화면에 여러 개라 법정이 하나를 고를 수 없었다. 기능이 고장 났다는 뜻이 아니라 표준 점검이 새 화면에 맞지 않게 됐다는 뜻이다. 이 점검이 보던 동작은 이번에 확인하지 못했다. 표준 점검을 고치는 것은 금고 변경이므로 별도 PR 이다.');
      } else out.regressions.push({ kind: 'STD_SCENARIO_BROKE', detail: '표준 점검 "' + std.title + '" 이 작업 커밋에서 실패(단계 ' + sh.failedStep + '): ' + rec.head.detail + blockedNote });
    } else if (!sb.passed) out.insufficient.push('표준 점검 "' + std.title + '" 이 기준 커밋에서도 실패한다 — 회귀 비교에 쓸 수 없다(법정 시나리오 점검 필요)');
  }
  return out;
}

module.exports = { probeBoot, bootScenario, diffBags, new404, loadStdScenarios, steadyBootDiff };
