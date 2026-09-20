'use strict';
// 법정(court) — 부팅 탐침 + 표준 시나리오(L3 화면 확인).
// 주장과 무관하게 항상 돈다. 기준 커밋(base)에서 되던 것이 작업 커밋(head)에서 안 되면 "되던 기능이 고장 남"이다.
//  - 앱이 뜨는가 / 새로 생긴 미처리 예외가 있는가(문구+스크립트 경로의 개수 비교, 줄번호는 무시) / 새로 생긴 404 가 있는가
//  - court/scenarios/std-*.json 표준 점검 경로가 여전히 통과하는가
const fs = require('node:fs');
const path = require('node:path');
const { runScenario } = require('../lib/scenario');

function bootScenario(cfg) {
  return { id: 'court-boot', title: '앱이 뜨고 첫 화면까지 간다', steps: [
    { do: 'goto', path: '/index.html' }, { do: 'waitFor', selector: cfg.bootWaitSelector || 'body *' }, { do: 'wait', ms: 2500 }, { capture: 'boot' },
  ] };
}

function bag(list) { const m = new Map(); for (const e of list) { const k = e.text + ' @ ' + (e.url || ''); m.set(k, (m.get(k) || 0) + 1); } return m; }

function diffBags(baseList, headList) {
  const b = bag(baseList), h = bag(headList), added = [];
  for (const [k, n] of h) { const was = b.get(k) || 0; if (n > was) added.push({ key: k, base: was, head: n }); }
  return added;
}

function new404(baseReq, headReq) {
  const ignore = p => p.startsWith('/api/') || p === '/favicon.ico';
  const b = new Set(baseReq.filter(r => r.status === 404).map(r => r.path));
  return [...new Set(headReq.filter(r => r.status === 404 && !b.has(r.path) && !ignore(r.path)).map(r => r.path))];
}

function loadStdScenarios(dir) {
  const d = dir || path.join(__dirname, '..', 'scenarios');
  let names = []; try { names = fs.readdirSync(d); } catch (_) { names = []; }
  return names.filter(n => /^std-.*\.json$/.test(n)).sort().map(n => JSON.parse(fs.readFileSync(path.join(d, n), 'utf8')));
}

// base·head = { url, sha, server } (server.requests 로 404 를 본다)
async function probeBoot(ctx) {
  const { base, head, config, outDir } = ctx;
  const out = { regressions: [], insufficient: [], toolErrors: [], boot: null, std: [] };
  const sc = bootScenario(config);
  const mark = s => s.requests.length;
  const b0 = mark(base.server), h0 = mark(head.server);
  const B = await runScenario({ scenario: sc, siteUrl: base.url, siteRev: base.sha, outDir: outDir ? path.join(outDir, 'boot-base') : null, config });
  const H = await runScenario({ scenario: sc, siteUrl: head.url, siteRev: head.sha, outDir: outDir ? path.join(outDir, 'boot-head') : null, config });
  out.boot = { base: { passed: B.passed, exceptions: B.bootExceptions.concat(B.exceptions), toolError: B.toolError }, head: { passed: H.passed, exceptions: H.bootExceptions.concat(H.exceptions), toolError: H.toolError, captures: H.captures }, chromeVersion: H.chromeVersion || B.chromeVersion };
  if (B.failKind === 'tool' || H.failKind === 'tool') { out.toolErrors.push('부팅 탐침 도구 오류: ' + (B.toolError || H.toolError || (B.errors || []).concat(H.errors || []).join(' / '))); return out; }
  if (!B.passed && !H.passed) { out.toolErrors.push('기준 커밋과 작업 커밋 모두 첫 화면까지 가지 못했다 — 법정 부팅 설정(bootWaitSelector)을 점검해야 한다'); return out; }
  if (B.passed && !H.passed) out.regressions.push({ kind: 'BOOT_FAILED', detail: '기준 커밋에서는 뜨던 앱이 작업 커밋에서는 첫 화면까지 가지 못한다' });
  for (const a of diffBags(out.boot.base.exceptions, out.boot.head.exceptions)) out.regressions.push({ kind: 'NEW_EXCEPTION', detail: '앱을 띄우기만 해도 새 오류가 난다: ' + a.key + ' (기준 ' + a.base + '회 → 작업 ' + a.head + '회)' });
  for (const p of new404(base.server.requests.slice(b0), head.server.requests.slice(h0))) out.regressions.push({ kind: 'NEW_404', detail: '앱이 찾는 파일이 없어졌다: ' + p });

  for (const std of loadStdScenarios(ctx.scenariosDir)) {
    const sb = await runScenario({ scenario: std, siteUrl: base.url, siteRev: base.sha, outDir: outDir ? path.join(outDir, 'std-base') : null, config });
    const sh = await runScenario({ scenario: std, siteUrl: head.url, siteRev: head.sha, outDir: outDir ? path.join(outDir, 'std-head') : null, config });
    const rec = { id: std.id, title: std.title, steps: std.steps, base: { passed: sb.passed, failedStep: sb.failedStep, failKind: sb.failKind }, head: { passed: sh.passed, failedStep: sh.failedStep, failKind: sh.failKind, detail: sh.failedStep ? sh.steps[sh.failedStep - 1].detail : '', captures: sh.captures } };
    out.std.push(rec);
    if (sb.failKind === 'tool' || sh.failKind === 'tool') { out.toolErrors.push('표준 시나리오 ' + std.id + ' 도구 오류: ' + (sb.toolError || sh.toolError || (sb.errors || []).concat(sh.errors || []).join(' / '))); continue; }
    // 결과가 갈리면(=돌려보냄 사유가 되면) 우연이 아닌지 양쪽을 두 번씩 더 돌린다. 한 번이라도 다르게 나오면 회귀로 세지 않고 "흔들림"으로 남긴다.
    if (sb.passed !== sh.passed) {
      const sig = r => (r.passed ? 'pass' : 'fail@' + r.failedStep);
      const runs = { base: [sig(sb)], head: [sig(sh)] };
      for (let i = 0; i < 2; i++) {
        runs.base.push(sig(await runScenario({ scenario: std, siteUrl: base.url, siteRev: base.sha, outDir: null, config })));
        runs.head.push(sig(await runScenario({ scenario: std, siteUrl: head.url, siteRev: head.sha, outDir: null, config })));
      }
      rec.stability = runs;
      if (new Set(runs.base).size > 1 || new Set(runs.head).size > 1) { out.insufficient.push('표준 점검 "' + std.title + '" 의 결과가 흔들린다 — 기준 [' + runs.base.join(', ') + '] / 작업 [' + runs.head.join(', ') + ']. 회귀로 세지 않았다.'); continue; }
    }
    if (sb.passed && !sh.passed) out.regressions.push({ kind: 'STD_SCENARIO_BROKE', detail: '표준 점검 "' + std.title + '" 이 작업 커밋에서 실패(단계 ' + sh.failedStep + '): ' + rec.head.detail });
    else if (!sb.passed) out.insufficient.push('표준 점검 "' + std.title + '" 이 기준 커밋에서도 실패한다 — 회귀 비교에 쓸 수 없다(법정 시나리오 점검 필요)');
  }
  return out;
}

module.exports = { probeBoot, bootScenario, diffBags, new404, loadStdScenarios };
