'use strict';
// 「index.html 에서 큰 인라인 IIFE 가 사라지면」 도구·시험이 어떻게 반응하는지 잰다(작업자 측정, 판정 아님).
// 모의본 = make-empty-mock.cjs 가 만든 것(IIFE 글자를 그대로 js/app/boot.js 로 빼고 같은 자리에 동기 태그 — 앱은 그대로 뜬다. 달라진 것은 「index.html 안에 그 글자가 없다」뿐).
// 도구마다 기준 작업 폴더와 모의 작업 폴더에서 같은 명령을 돌려 종료 코드와 첫 오류 줄을 적는다. 시험은 run-tests.cjs 가 하나씩 돌린 결과(tests-all.{base,empty}.json)를 맞대고,
// 달라진 파일만 모의 작업 폴더에서 다시 돌려 오류 글자를 뽑는다. 고치지 않는다 — 목록만 만든다.
// 주의: 시험이 깨지는 까닭은 둘이 섞여 있다. ① IIFE 블록 자체를 찾다가 죽는다(구조 의존) ② index.html 에서 글자를 찾는데 그 글자가 지금은 IIFE 안에 있다(글자 의존 —
//   실제로는 그 글자가 세포로 옮겨져 합본(tests/helpers/inline-bundle.js)이 읽는 자리에 가면 풀릴 수 있다. 이 모의본의 js/app/boot.js 는 합본이 읽지 않는다). 그래서 이 목록은 상한이다.
// 사용: node iife-gone-reactions.cjs <작업 트리> <기준 작업 폴더> <모의 작업 폴더> <raw 폴더> <out.json>
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const [WORK_ARG, BASE, MOCK, RAW, OUT] = process.argv.slice(2);
const WORK = path.resolve(WORK_ARG);
const rj = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const run = (cwd, args, timeout) => { const r = cp.spawnSync(process.execPath, args, { cwd, encoding: 'utf8', timeout: timeout || 120000, maxBuffer: 256 * 1024 * 1024 }); return { status: r.status, signal: r.signal || null, out: (r.stdout || ''), err: (r.stderr || '') }; };
const firstErr = t => ((t.err + '\n' + t.out).split(/\r?\n/).find(l => /(^|\s)(Error|TypeError|SyntaxError|RangeError|ReferenceError|AssertionError)\b|못 찾|찾지 못|없음|not ok|FAIL|✗|❌/.test(l)) || '').trim().slice(0, 220);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'iife-gone-662-'));
const cfg = path.join(tmp, 'stop.json'); fs.writeFileSync(cfg, JSON.stringify({ task: 'TASK-662-PROBE', mode: 'sweep', cells: [{ file: 'js/core/cell-registry.js' }], sweep: { groups: ['(없는 제목 — 쓰지 않고 멈추게 하는 탐침)'] } }), { encoding: 'utf8' });
const GEN = path.join(WORK, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js');
const tools = [
  { id: 'inline-script-map', what: 'scripts/inline-script-map.js(지도 — 쓰지 않고 요약만)', args: d => ['scripts/inline-script-map.js', '--root', d] },
  { id: 'inline-hard-types', what: 'scripts/inline-hard-types.js(유형표 — 쓰지 않음)', args: d => ['scripts/inline-hard-types.js', '--root', d] },
  { id: 'inline-hard-test-probe', what: 'scripts/inline-hard-test-probe.js(시험지 선행 실측기 — 묶음 하나만, 쓰지 않음)', args: d => ['scripts/inline-hard-test-probe.js', d, '--only', 'G001'], timeout: 180000 },
  { id: 'cell-registry-compare', what: 'scripts/probes/cell-registry-compare.js(대조 탐침 — 브라우저)', args: (d, tag) => ['scripts/probes/cell-registry-compare.js', d, path.join(tmp, 'crc.' + tag + '.json'), '--fingerprints'], timeout: 180000, json: tag => path.join(tmp, 'crc.' + tag + '.json') },
  { id: 'gen-inline-hard', what: '생성기 gen-inline-hard.js(없는 구획 제목을 준 sweep 설정 — 정상이면 「구획 주석이 0개」로 깨끗이 멈춘다)', args: d => [GEN, d, cfg] },
  { id: 'module-metrics', what: 'scripts/module-metrics.js(공식 지표)', args: () => ['scripts/module-metrics.js'] },
  { id: 'module-guard', what: 'scripts/module-guard.js(모듈 가드)', args: () => ['scripts/module-guard.js'] },
  { id: 'module-specs', what: 'scripts/module-specs.js(신고서 검사 — 쓰지 않음)', args: () => ['scripts/module-specs.js'] },
];
const rows = [];
for (const t of tools) {
  const row = { id: t.id, what: t.what };
  for (const [tag, dir] of [['base', BASE], ['mock', MOCK]]) {
    const r = run(dir, t.args(dir, tag), t.timeout);
    row[tag] = { status: r.status, signal: r.signal, firstError: r.status === 0 ? null : firstErr(r), lastLine: (r.out.trim().split(/\r?\n/).pop() || '').slice(0, 200) };
    if (t.id === 'module-metrics' && r.status === 0) { try { const j = JSON.parse(r.out); row[tag].ratchet = { inlineScriptLines: j.ratchet.inlineScriptLines, indexFunctionDecls: j.ratchet.indexFunctionDecls, windowAssignments: j.ratchet.windowAssignments, crossTabRefs: j.ratchet.crossTabRefs }; row[tag].lastLine = undefined; } catch (_) { /* JSON 이 아니면 그대로 */ } }
    if (t.json && r.status === 0) { try { const j = rj(t.json(tag)); row[tag].counts = j.counts; row[tag].windowNamesSource = j.windowNamesSource; } catch (_) { /* 결과 파일이 없으면 그대로 */ } }
  }
  row.verdict = row.base.status === 0 && row.mock.status === 0 ? '돈다' : row.base.status !== 0 && row.mock.status !== 0 ? (row.base.firstError === row.mock.firstError ? '기준과 같은 사유로 멈춘다' : '기준도 모의도 멈추지만 사유가 다르다') : row.mock.status !== 0 ? '죽는다(기준은 돈다)' : '기준은 멈추고 모의는 돈다';
  rows.push(row);
}
// 시험: 하나씩 돌린 결과 대조 + 달라진 파일 재실행
const tb = rj(path.join(RAW, 'tests-all.base.json')), tm = rj(path.join(RAW, 'tests-all.empty.json'));
const changed = Object.keys(tb).filter(k => !tm[k] || tb[k].exit !== tm[k].exit || tb[k].okLines !== tm[k].okLines);
const env = Object.assign({}, process.env);
const tests = changed.map(f => {
  const r = cp.spawnSync(process.execPath, [f], { cwd: MOCK, env, encoding: 'utf8', timeout: 180000, maxBuffer: 64 * 1024 * 1024 });
  const txt = (r.stderr || '') + '\n' + (r.stdout || '');
  const src = fs.readFileSync(path.join(BASE, f), 'utf8');
  const lines = txt.split(/\r?\n/);
  const pick = re => lines.find(l => re.test(l));
  const msg = (pick(/^[ ]*(✗|✖|❌|not ok)|[[]FAIL[]]|AssertionError [[]|^실패 /) || pick(/^[ ]*(TypeError|ReferenceError|SyntaxError|RangeError|Error):/) || pick(/Error/) || '').trim().slice(0, 240);
  const structural = /IIFE|인라인 스크립트|<script>|\(function\(\)\{|못 찾|찾지 못/.test(msg) || /TypeError|RangeError/.test(msg);
  return { file: f, base: [tb[f].exit, tb[f].okLines], mock: tm[f] ? [tm[f].exit, tm[f].okLines] : null, readsBundle: /inline-bundle/.test(src), readsIndexHtml: /index\.html/.test(src), firstError: msg, kind: tm[f] && tm[f].exit === tb[f].exit ? '종료 코드는 같고 통과 줄 수만 다르다' : structural ? '죽는다(예외 — 구조를 찾다가)' : '단언 실패(글자 의존)' };
});
const out = { tool: 'reports/TASK-ES-662/tools/iife-gone-reactions.cjs', type: '작업자 측정, 판정 아님',
  mock: '기준 커밋의 index.html 에서 큰 인라인 IIFE 블록을 통째로 js/app/boot.js 로 빼고 같은 자리에 동기 태그를 단 모의본(reports/TASK-ES-662/tools/make-empty-mock.cjs). finalize 의 산출이 아니다.',
  limits: '시험 목록은 상한이다 — 글자 의존 시험은 그 글자가 합본이 읽는 세포로 옮겨지면 풀릴 수 있다. 구조 의존/글자 의존 가름은 첫 오류 글자로 한 어림이다. 고치지 않았다.',
  tools: rows, toolsDead: rows.filter(r => /죽는다|사유가 다르다/.test(r.verdict)).map(r => r.id), toolsFine: rows.filter(r => r.verdict === '돈다').map(r => r.id),
  tests: { files: Object.keys(tb).length, nonZeroExit: [Object.keys(tb).filter(k => tb[k].exit !== 0).length, Object.keys(tm).filter(k => tm[k].exit !== 0).length], changedCount: changed.length,
    newlyFailing: tests.filter(t => t.base[0] === 0 && t.mock && t.mock[0] !== 0).length, byKind: tests.reduce((a, t) => (a[t.kind] = (a[t.kind] || 0) + 1, a), {}), list: tests } };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
for (const r of rows) console.log(r.id, '|', r.verdict, '|', r.base.status, r.mock.status, '|', (r.mock.firstError || '').slice(0, 150), r.mock.ratchet ? JSON.stringify([r.base.ratchet, r.mock.ratchet]) : '', r.mock.counts ? JSON.stringify(r.mock.counts).slice(0, 160) : '');
console.log('tests changed', changed.length, JSON.stringify(out.tests.byKind), 'newly failing', out.tests.newlyFailing);
for (const t of tests) console.log(' ', t.file, t.base, t.mock, t.kind, '|', t.firstError.slice(0, 140));
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ }
