'use strict';
// 법정 실행기(court/lib/scenario.js runScenario · static-server · site-host)를 읽기만 써서 시나리오를 기준 2회(· 작업 1회) 돌리고,
// 단계마다 남는 화면 HTML · 저장값(localStorage·sessionStorage) · 토스트 · 창 글자 · 단계 결과를 「기준1=기준2 인 것만」 작업과 맞댄다.
// 작업자 PC 예비 점검 — 판정이 아니다. (#TASK-ES-646 의 실행기를 그대로 가져와 새 세포 태그 제외 한 가지만 더했다.)
// 사용: node scenario-local.cjs <기준 트리> <작업 트리 | -> <out.json> [--dump <저장소 밖 폴더>] <시나리오.json...>
//   작업 트리를 - 로 주면 기준 2회만 돌린다(1단계: 기준에서 흔들리지 않는지).
// 실행마다 달라지는 값(난수 ID · 시각)은 「처음 나온 순서의 번호」로 바꿔 비교한다 — 같은 값은 같은 번호, 다른 값은 다른 번호(일대일 대응 유지, L053).
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const argv = process.argv.slice(2);
const BASE = argv.shift(), WORK = argv.shift(), OUT = argv.shift();
let DUMP = null;
if (argv[0] === '--dump') { argv.shift(); DUMP = argv.shift(); }
const SCS = argv;
const COURT = path.resolve(WORK === '-' ? BASE : WORK, 'court');
const C = p => require(path.join(COURT, 'lib', p));
const { runScenario, validateScenario, loadConfig } = C('scenario.js');
const server = C('static-server.js');
const siteHostLib = C('site-host.js');
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 16);

// 실행마다 달라지는 글자의 꼴. 순서가 중요하다(긴 꼴 먼저).
// #TASK-ES-672: 첫 화면 인사 창의 닫기 단추는 창이 커지며 나타나는 중에 눌려, 실행기가 적는 단추 크기(예: 47x47px 대 46x46px)가 실행마다 1px 갈린다(실측 2회 — 기록 창을 열기 전 단계). 그 단추의 크기 글자만 가린다.
const GREET_CLOSE_SIZE = /(클릭 button#btnAvatarGreetClose "[^"]*" )\d+x\d+px/;
const VOLATILE = [
  // [이름, 꼴, 번호 매김] — 번호 매김이 true 면 같은 값은 같은 번호(일대일 대응 유지), false 면 값·동일성 모두 비교에서 뺀다(시각은 두 시각이 같은 밀리초에 찍혔는지까지 실행마다 달라진다).
  ['ISO', /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?/g, false],
  ['UUID', /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, true],
  ['GUEST', /guest-[a-z0-9]{6,}/g, true],
  ['DEV', /dev_\d{10,}_[a-z0-9]+/g, true],
  ['SCHED', /sched_[a-z0-9]{8,}/g, true],
  ['LAP', /lap_\d{10,}_[a-z0-9]+/g, true],
  ['CUST', /cust_\d{10,}/g, true],
  ['SEED', /"seed":\d+/g, false],
  ['EPOCH', /(?<![0-9])1[6-9]\d{11}(?![0-9])/g, false],
  // 색종이 조각: 위치·회전이 난수이고, 뿌린 뒤 스스로 사라져 갈무리 시점에 따라 있기도 없기도 하다(기준 두 번 사이에서도 갈린 것을 실측). 조각 요소를 통째로 뺀다.
  ['CONFETTI', /<div class="confetti-piece"[^>]*><\/div>/g, false, true],
  // 설정 탭의 「임시 캐시 및 데이터 — 약 N KB 사용 중 (브라우저 추정치)」: 브라우저가 추정한 저장 용량이라 index.html 파일 크기가 달라지면 값이 달라진다(이 PR 은 함수를 세포 파일로 옮겨 index.html 이 작아진다). 동작이 아니라 파일 크기의 반영이므로 뺀다.
  ['CACHESIZE', /약 [0-9.,]+ ?(?:B|KB|MB|GB) 사용 중 \(브라우저 추정치\)/g, false],
  // 돌아가는 스톱워치의 표시(10분의 1초 단위)와 돌아가는 중에 찍은 랩 시간: 갈무리 시점에 따라 0.1초씩 갈린다. 멈춘 때의 값(00:00.0 · 01:00.0)은 시나리오의 단언(textEquals)이 직접 잰다.
  ['SWCLOCK', /(id="swDisplay"[^>]*>)\d{2}:\d{2}\.\d/g, false],
  ['LAPTIME', /(class="sw-lap-time">)\d{2}:\d{2}\.\d/g, false],
  // 랩을 찍을 때 뜨는 토스트 글자 「랩 N (분:초.d) 기록!」의 시간도 같은 이유로 갈린다(토스트 글자는 다음 토스트가 뜰 때까지 화면 HTML 에 남는다).
  ['LAPTOAST', /랩 \d+ \(\d{2}:\d{2}\.\d\) 기록!/g, false],
  // 저장한 기록·일정 옆에 찍히는 「지금 시각」(시:분만 든 글자 마디, 예 >14:37<): 실행이 분 경계를 넘으면 갈린다(기준 두 번 사이에서 14:37 대 14:38 로 갈린 것을 실측). 칸의 value 속성과 스톱워치 표시(10분의 1초가 붙는다)는 이 꼴이 아니라 그대로 비교된다.
  ['HHMM', />\d{1,2}:\d{2}</g, false],
];
// 토스트는 2.2초 뒤 스스로 사라진다 — 보임 표시(show)는 갈무리 시점에 따라 갈리므로 뺀다(글자는 그대로 비교한다, L077).
const SCRIPT_BODY = /(<script\b[^>]*>)[\s\S]*?(<\/script>)/g;
const NEW_CELL_TAG = /<script src="js\/tabs\/records\/pro-record-(?:modal|table|tools|trend-chart|stopwatch|save)\.js"><\/script>/g;
const TOAST_SHOW = /<div class="toast show" id="toast">/g;
// 콘솔 오류 글자에는 앱이 실시간 연결에 붙이는 공개 키(주소의 apikey=… 토큰)가 들어 있다. 결과 파일에 토큰 꼴 글자를 남기지 않는다(커밋 훅 HARDCODED_SECRET 이 막는다 — 처음에는 그대로 실려 훅에 걸렸다).
const TOKEN_LIKE = /eyJ[A-Za-z0-9_-]{8,}(?:\.[A-Za-z0-9_-]+)*/g;
function normalizer() {
  const maps = {};
  const counts = {};
  return {
    apply(text) {
      let s = String(text === undefined || text === null ? '' : text).replace(TOAST_SHOW, '<div class="toast" id="toast">').replace(TOKEN_LIKE, '«토큰 가림»');
      for (const [name, re, numbered, remove] of VOLATILE) {
        const m = maps[name] || (maps[name] = new Map());
        s = s.replace(re, v => { if (!m.has(v)) m.set(v, m.size + 1); counts[name] = (counts[name] || 0) + 1; return remove ? '' : '«' + name + (numbered ? '#' + m.get(v) : '') + '»'; });
      }
      return s;
    },
    summary() { const o = {}; for (const k of Object.keys(maps)) o[k] = { distinct: maps[k].size, replaced: counts[k] || 0 }; return o; },
  };
}

function digestRun(r, label, dumpDir, scenarioId) {
  const N = normalizer();
  const states = (r.states || []).map((st, i) => {
    // 화면 HTML 에는 인라인 <script> 의 소스 글자도 들어 있다. 이번 변경은 그 소스 글자를 고치는 것이므로(동작이 아니라 글자) 스크립트 요소의 안쪽 글자는 빼고 비교한다(태그와 src 는 남긴다).
    // #TASK-ES-672: 이번 변경이 새로 넣은 세포 파일의 <script src> 태그(작업 쪽에만 있다)는 태그째 뺀다 — 그 태그가 있다는 것이 이 PR 의 변경 그 자체다.
    const dom = N.apply(String(st.dom || '').replace(NEW_CELL_TAG, '').replace(SCRIPT_BODY, '$1«스크립트 글자 제외»$2'));
    let ls = {}, ss = {};
    try { ls = JSON.parse(st.localStorage || '{}'); } catch (_) { ls = { '(파싱 실패)': st.localStorage }; }
    try { ss = JSON.parse(st.sessionStorage || '{}'); } catch (_) { ss = { '(파싱 실패)': st.sessionStorage }; }
    const kv = o => { const out = {}; for (const k of Object.keys(o).sort()) out[N.apply(k)] = sha(N.apply(o[k])); return out; };
    if (dumpDir) {
      const d = path.join(dumpDir, scenarioId, label); fs.mkdirSync(d, { recursive: true });
      fs.writeFileSync(path.join(d, String(i + 1).padStart(2, '0') + '.dom.html'), dom, 'utf8');
      const lsN = {}; for (const k of Object.keys(ls).sort()) lsN[N.apply(k)] = N.apply(ls[k]);
      fs.writeFileSync(path.join(d, String(i + 1).padStart(2, '0') + '.localStorage.json'), JSON.stringify(lsN, null, 1), 'utf8');
    }
    return { dom: sha(dom), domBytes: dom.length, localStorage: kv(ls), sessionStorage: kv(ss), toast: N.apply(st.toast), err: N.apply(st.err), modal: sha(N.apply(st.modal)) };
  });
  const steps = (r.steps || []).map(s => ({ i: s.i, name: s.kind + ':' + s.name, ok: !!s.ok, vacuous: !!s.vacuous, detail: N.apply(s.detail).replace(/sha256=[0-9a-f]+/g, 'sha256=…').replace(GREET_CLOSE_SIZE, '$1«크기»') }));
  return {
    summary: { passed: r.passed, provesBehavior: r.provesBehavior, failedStep: r.failedStep, failKind: r.failKind, failReason: r.failReason, toolError: r.toolError,
      nonVacuousExpects: r.nonVacuousExpects, vacuousExpects: r.vacuousExpects, steps: steps.length, states: states.length,
      exceptions: (r.exceptions || []).map(e => N.apply(e.text)), bootExceptions: (r.bootExceptions || []).map(e => N.apply(e.text)),
      consoleErrors: (r.consoleErrors || []).map(e => N.apply(e.text).slice(0, 160) + ' @' + N.apply(e.url).slice(0, 80)).sort(), dialogs: (r.dialogs || []).map(d => d.type + ':' + N.apply(d.message)),
      ms: Date.parse(r.finishedAt) - Date.parse(r.startedAt), volatile: N.summary() },
    steps, states,
  };
}

// a·b 를 맞대되, 기준끼리(b1·b2) 다른 칸은 비교에서 빼고 그 사실을 적는다. 돌려주는 것: { compared, same, diffs[], ignored[] }
function compare(b1, b2, w) {
  const out = { fieldsCompared: 0, fieldsSame: 0, diffs: [], ignoredBecauseBaseDiffers: [] };
  const cell = (name, x1, x2, xw) => {
    if (x1 !== x2) { out.ignoredBecauseBaseDiffers.push(name); return; }
    if (w === null) { out.fieldsCompared++; out.fieldsSame++; return; }
    out.fieldsCompared++;
    if (x1 === xw) out.fieldsSame++; else { out.diffs.push(name); (out.diffValues = out.diffValues || {})[name] = { base: String(x1).slice(0, 300), work: String(xw).slice(0, 300) }; } // #TASK-ES-672: 갈린 칸의 글자를 남긴다(첫 실행에서 단계 결과 글자 한 칸이 갈렸는데 값이 남지 않아 원인을 못 봤다)
  };
  for (const k of ['passed', 'provesBehavior', 'failedStep', 'failKind', 'nonVacuousExpects', 'vacuousExpects', 'steps', 'states']) cell('요약.' + k, b1.summary[k], b2.summary[k], w ? w.summary[k] : null);
  for (const r of [b1, b2, w]) if (r) r.summary.consoleErrorKinds = [...new Set(r.summary.consoleErrors)];
  for (const k of ['exceptions', 'bootExceptions', 'consoleErrorKinds', 'dialogs']) cell('요약.' + k, JSON.stringify(b1.summary[k]), JSON.stringify(b2.summary[k]), w ? JSON.stringify(w.summary[k]) : null);
  const n = Math.max(b1.steps.length, b2.steps.length, w ? w.steps.length : 0);
  for (let i = 0; i < n; i++) {
    const g = (r, f) => (r && r.steps[i] ? r.steps[i][f] : undefined);
    for (const f of ['name', 'ok', 'vacuous', 'detail']) cell('단계' + (i + 1) + '.' + f, g(b1, f), g(b2, f), w ? g(w, f) : null);
  }
  const m = Math.max(b1.states.length, b2.states.length, w ? w.states.length : 0);
  for (let i = 0; i < m; i++) {
    const s1 = b1.states[i] || {}, s2 = b2.states[i] || {}, sw = w ? (w.states[i] || {}) : null;
    for (const f of ['dom', 'toast', 'err', 'modal']) cell('상태' + (i + 1) + '.' + f, s1[f], s2[f], sw ? sw[f] : null);
    for (const store of ['localStorage', 'sessionStorage']) {
      const keys = new Set([...Object.keys(s1[store] || {}), ...Object.keys(s2[store] || {}), ...(sw ? Object.keys(sw[store] || {}) : [])]);
      for (const k of [...keys].sort()) cell('상태' + (i + 1) + '.' + store + '[' + k + ']', (s1[store] || {})[k], (s2[store] || {})[k], sw ? (sw[store] || {})[k] : null);
    }
  }
  return out;
}

(async () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(COURT, 'config.json'), 'utf8'));
  const config = loadConfig(path.join(COURT, 'config.json'));
  const host = siteHostLib.pickSiteHost(cfg);
  const out = {
    tool: 'court/lib/scenario.js runScenario(preserveOnly — 단계마다 화면·저장값 갈무리) · ' + (WORK === '-' ? '기준 2회' : '기준 2회 · 작업 1회') + ' (법정 실행기를 읽기 전용으로 사용)',
    type: '작업자 PC 예비 점검 — 판정 아님',
    measuredAt: new Date().toISOString(),
    baseHead: (() => { try { return require('child_process').execFileSync('git', ['rev-parse', 'HEAD'], { cwd: path.resolve(BASE), encoding: 'utf8' }).trim(); } catch (_) { return null; } })(),
    normalize: VOLATILE.map(v => v[0] + ' ' + String(v[1]) + (v[2] ? ' (번호 매김)' : ' (값·동일성 제외)')).concat(['토스트 보임 표시(class show) 제외', '첫 화면 인사 창 닫기 단추(#btnAvatarGreetClose)를 누른 단계 결과의 단추 크기 글자 제외(창이 커지며 나타나는 중에 눌려 실행마다 1px 갈린다 — 실측 2회)', '화면 HTML 의 <script> 요소 안쪽 글자 제외(태그·src 는 비교)', '이 PR 이 새로 넣은 세포 파일 여섯의 <script src> 태그 제외(작업 쪽에만 있다)', '콘솔 오류는 종류(중복을 뺀 목록)로 비교 — 법정 실행기는 외부 통신을 막고 돌리는데, 막힌 요청의 도착 순서와 실시간 연결 재시도 횟수가 실행 시간에 따라 달라진다(같은 오류가 3번 대 4번으로 갈린 것을 실측). 원래 목록은 runs.*.consoleErrors 에 그대로 둔다']),
    scenarios: {},
  };
  for (const sc of SCS) {
    const scenario = JSON.parse(fs.readFileSync(sc, 'utf8'));
    const v = validateScenario(scenario, config);
    const row = { file: path.basename(sc), stepCount: scenario.steps.length, valid: v, runs: {} };
    const runs = {};
    for (const [label, dir] of [['base', BASE], ['base2', BASE]].concat(WORK === '-' ? [] : [['work', WORK]])) {
      const srv = await server.start(path.resolve(dir), cfg.denyServePrefixes);
      const r = await runScenario({ scenario, siteUrl: siteHostLib.siteUrlFor(host, srv.port), siteRev: label, outDir: null, config, preserveOnly: true });
      runs[label] = digestRun(r, label, DUMP, scenario.id);
      row.runs[label] = runs[label].summary;
      if (!r.passed) row.runs[label].failedDetail = r.failedStep ? (r.steps[r.failedStep - 1] || {}).detail : null;
      try { await srv.close(); } catch (e) { /* 닫기 실패는 무시 */ }
    }
    row.compare = compare(runs.base, runs.base2, runs.work || null);
    row.compareSummary = { fieldsCompared: row.compare.fieldsCompared, fieldsSame: row.compare.fieldsSame, diffs: row.compare.diffs.length, ignoredBecauseBaseDiffers: row.compare.ignoredBecauseBaseDiffers.length };
    out.scenarios[scenario.id] = row;
    console.log(scenario.id, JSON.stringify({ base: row.runs.base.passed, base2: row.runs.base2.passed, work: row.runs.work ? row.runs.work.passed : null, proves: [row.runs.base.provesBehavior, row.runs.base2.provesBehavior, row.runs.work ? row.runs.work.provesBehavior : null], ms: [row.runs.base.ms, row.runs.base2.ms, row.runs.work ? row.runs.work.ms : null], compare: row.compareSummary }));
    if (row.compare.diffs.length) console.log('  차이:', row.compare.diffs.slice(0, 12).join(' | '));
  }
  const rows = Object.values(out.scenarios);
  const labels = WORK === '-' ? ['base', 'base2'] : ['base', 'base2', 'work'];
  out.scenarioCount = rows.length;
  out.allPassed = rows.length > 0 && rows.every(r => labels.every(l => r.runs[l].passed));
  out.allProveBehavior = rows.length > 0 && rows.every(r => labels.every(l => r.runs[l].provesBehavior));
  out.baseRunsAgree = rows.every(r => r.runs.base.passed === r.runs.base2.passed && r.runs.base.failedStep === r.runs.base2.failedStep);
  out.totalFieldsCompared = rows.reduce((a, r) => a + r.compare.fieldsCompared, 0);
  out.totalFieldsSame = rows.reduce((a, r) => a + r.compare.fieldsSame, 0);
  out.totalDiffs = rows.reduce((a, r) => a + r.compare.diffs.length, 0);
  out.totalIgnoredBecauseBaseDiffers = rows.reduce((a, r) => a + r.compare.ignoredBecauseBaseDiffers.length, 0);
  out.totalExceptions = rows.reduce((a, r) => a + labels.reduce((b, l) => b + r.runs[l].exceptions.length, 0), 0);
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
  console.log(JSON.stringify({ scenarioCount: out.scenarioCount, allPassed: out.allPassed, allProveBehavior: out.allProveBehavior, baseRunsAgree: out.baseRunsAgree, compared: out.totalFieldsCompared, same: out.totalFieldsSame, diffs: out.totalDiffs, ignored: out.totalIgnoredBecauseBaseDiffers, exceptions: out.totalExceptions }));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(2); });
