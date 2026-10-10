'use strict';
// 생성기 unwire 확장(#TASK-ES-619) 단위 시험 — docs/architecture/CELL-REGISTRY-DESIGN.md 5절 닫힌 목록 X1·X2·X3 + 여러 실행. 작업자 측정, 판정 아님.
// 저장소 밖 임시 폴더에서 생성기를 자식 프로세스로 돌리고(법정 recomputeSplit 과 같은 호출 꼴) 결과를 바이트 단위로 맞댄다. 저장소의 index.html 은 건드리지 않는다.
//  B   B1 시험 8건(unwire-check-b1.js)을 그대로 돌려 전부 통과 — 기존 단일 객체 설정·기존 옮기기 경로(A1 시범 재생성) 바이트 무변화 포함.
//  S1  단일 객체 설정: 고친 생성기와 기준 생성기(PIN 커밋의 gen-inline-hard.js)가 같은 index.html·같은 메타·같은 출력 줄을 낸다(작은 꾸러미).
//  M1  여러 실행: 배열 설정 한 번 = 단일 객체 설정을 차례로 돌린 결과(바이트 동일). 뒤 실행은 앞 실행이 지운 결과 위에서 돈다.
//  M2  여러 실행 원자성: 뒤 실행이 멈추면 index.html 을 쓰지 않고, 오류 글에 몇 번째 실행인지 나온다. 빈 배열은 멈춘다.
//  X1a 손잡이 이름꼴: `_ui` 처럼 `_xxxKit` 꼴이 아닌 손잡이의 가져오기 줄을 지운다.
//  X1b 손잡이가 아닌 이름은 멈춘다: 선언 없는 이름 · window 로 시작하지 않는 초기값 · 상태 변수 · 이름이 아닌 글자.
//  X3a sharedLine: 주석과 한 줄을 나눠 쓰는 `window.X = X;` — 대입 글자만 지우고 주석은 남긴다. 플래그가 없으면 예전처럼 멈춘다.
//  X3b sharedLine: 한 줄 if 블록의 두 대입 중 하나만 지운다(앞·뒤 각각). 둘 다 대상이면 줄째 지운다. 플래그가 없으면 예전처럼 멈춘다.
//  X3c sharedLine: 다른 문 뒤에 붙은 대입 — 대입 글자만 지운다. 가져오기를 함께 지울 때 같은 줄의 남은 참조는 잔존 참조로 잡힌다.
//  X3d sharedLine 이어도 멈추는 것: 쉼표 연쇄 · 오른쪽이 이름이 아닌 대입 · 여러 줄 if 블록 안의 나눠 쓴 줄.
//  X2a dropKitVar: 가져오기가 모두 지워져 손잡이 참조가 0 이면 손잡이 줄을 지운다. names 없이 손잡이 줄만 지울 수도 있다.
//  X2b dropKitVar: 손잡이 참조가 남으면 멈춘다.
//  C1  모르는 칸은 멈춘다(닫힌 목록 밖 기능을 플래그 오타로 켤 수 없다).
//  R1  실제 index.html(PIN 커밋): reports/TASK-ES-614/unwire-plan.json 의 16실행을 기준 생성기로 차례로 돌린 결과 = 고친 생성기에 배열 한 번으로 돌린 결과(바이트 동일). 단계마다 두 생성기의 단일 실행 결과도 같다.
//  R2  실제 index.html: R1 뒤에 X3(sharedLine)·X1(`_ui`·`_xp`) 실행을 더 돌려 — 지운 줄은 가져오기·getter·window 대입(과 빈 껍데기)뿐이고, 줄 안에서 지운 글자는 `window.X = X;` 뿐이며, 나머지 줄은 순서대로 같다.
//  R3  실제 index.html: 참조가 남은 손잡이에 dropKitVar 를 주면 멈춘다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node unwire-check-ext-619.js <APP_DIR(작업 트리)> <out.json>
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const [APP_ARG, OUT] = process.argv.slice(2);
const APP = path.resolve(APP_ARG);
const HARNESS = path.join(APP, 'docs', 'design', 'harness', 'module-split');
const GEN = path.join(HARNESS, 'gen-inline-hard.js');
const PIN = 'a3bad12a60644591311c70c3049d2f3e32f024ad'; // 기준 커밋(#889 병합) — 기준 생성기와 실제 index.html 을 여기서 읽는다(main 이 움직여도 같은 입력)
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'unwire-619-'));
const results = [];
const env = { ...process.env, MODULE_SPLIT_OUT: tmpRoot };
const META = path.join(tmpRoot, 'gen-inline-hard-meta.json');

function blob(spec) { // 원시 blob(줄 끝 변환 없음)을 utf8 글자로
  const r = cp.spawnSync('git', ['-C', APP, 'cat-file', '-p', spec], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
  if (r.status !== 0) throw new Error('git cat-file 실패: ' + spec + ' ' + (r.stderr || '').slice(0, 200));
  return r.stdout;
}
const PIN_FULL = cp.spawnSync('git', ['-C', APP, 'rev-parse', PIN + '^{commit}'], { encoding: 'utf8' }).stdout.trim();
const BASE_GEN = path.join(tmpRoot, 'gen-base.js');
fs.writeFileSync(BASE_GEN, blob(PIN_FULL + ':docs/design/harness/module-split/gen-inline-hard.js'), 'utf8');
const REAL_HTML = blob(PIN_FULL + ':index.html');

function runGen(dir, cfg, gen) {
  const cfgFile = path.join(tmpRoot, 'cfg-' + Math.random().toString(16).slice(2) + '.json');
  fs.writeFileSync(cfgFile, JSON.stringify(cfg), 'utf8');
  try { fs.unlinkSync(META); } catch (_) { /* 없으면 그만 */ }
  const r = cp.spawnSync(process.execPath, [gen || GEN, dir, cfgFile], { encoding: 'utf8', env, maxBuffer: 1024 * 1024 * 64 });
  const meta = r.status === 0 && fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : null;
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, meta };
}
function makeDir(name, text) { const d = path.join(tmpRoot, name); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'index.html'), text, 'utf8'); return d; }
const read = d => fs.readFileSync(path.join(d, 'index.html'), 'utf8');
function record(id, title, ok, detail) { results.push({ id, title, ok: !!ok, detail }); console.log((ok ? 'ok  ' : 'FAIL'), id, title, ok ? '' : JSON.stringify(detail).slice(0, 600)); }
function firstDiff(a, b) { const al = a.split('\n'), bl = b.split('\n'); for (let i = 0; i < Math.max(al.length, bl.length); i++) if (al[i] !== bl[i]) return { line: i + 1, got: al[i], want: bl[i] }; return null; }
const cfgOf = unwire => ({ task: 'TASK-619-UNIT', slot: 'HO', mode: 'unwire', cells: [{ file: 'js/core/cell-registry.js' }], unwire });
const HEAD = ['<!doctype html>', '<html><head><title>fixture</title></head><body>', '<script src="js/core/app-scope.js"></script>', '<script>', '(function(){', '  "use strict";'];
const TAIL = ['})();', '</script>', '</body></html>', ''];
const doc = body => HEAD.concat(body, TAIL).join('\n');
const without = (body, drop, swap) => doc(body.map((l, i) => (swap && swap[i] !== undefined ? swap[i] : l)).filter((l, i) => !drop.includes(i)));

// ── B: B1 시험 8건 그대로
{
  const out = path.join(tmpRoot, 'b1.json');
  const r = cp.spawnSync(process.execPath, [path.join(HARNESS, 'unwire-check-b1.js'), APP, out], { encoding: 'utf8', env: process.env, maxBuffer: 1024 * 1024 * 64 });
  const j = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
  record('B', 'B1 시험 8건(단일 객체 설정 · 기존 옮기기 경로 A1 재생성 바이트 대조 포함)이 고친 생성기에서 그대로 통과', r.status === 0 && j && j.ok && j.total === 8 && j.passed === 8,
    { status: r.status, passed: j && j.passed, total: j && j.total, each: j && j.results.map(x => x.id + ':' + (x.ok ? 'ok' : 'FAIL')), a1Files: j && (j.results.find(x => x.id === 'T8') || {}).detail && j.results.find(x => x.id === 'T8').detail.files });
}

// 공용 꾸러미: 키트 둘 + 손잡이 꼴이 아닌 `_ui`
const BODY = [
  '  var _ui = window.OurgoalUiHelpers;',                              // 0
  '  var esc = _ui.esc;',                                              // 1
  '  var dl = _ui.dl;',                                                // 2
  '  var _aKit = window.OurgoalAKit;',                                 // 3
  '  var alpha = _aKit.alpha;',                                        // 4
  '  var beta = _aKit.beta;',                                          // 5
  '  var _bKit = window.OurgoalBKit;',                                 // 6
  '  var gamma = _bKit.gamma;',                                        // 7
  '  var delta = _bKit.delta;',                                        // 8
  "  window.OurgoalAppScope.expose('index.html', {",                   // 9
  '    get alpha(){ return alpha; },',                                 // 10
  '    get gamma(){ return gamma; },',                                 // 11
  '    get esc(){ return esc; },',                                     // 12
  '    get delta(){ return delta; }',                                  // 13
  '  });',                                                             // 14
  '  var state = { n: 1 };',                                           // 15
  '  function useDelta(){ return delta() + state.n; }',                // 16
  '  window.alpha = alpha;',                                           // 17
  "  if(typeof window !== 'undefined'){ window.gamma = gamma; }",      // 18
  '  window.beta = beta;',                                             // 19
  '  window.dl = dl;',                                                 // 20
];

// ── S1: 단일 객체 — 기준 생성기와 같은 글자·메타·출력
{
  const cfg = cfgOf({ kitVar: '_aKit', imports: true, exposeGetters: true, windowAssign: true, names: ['alpha', 'beta'] });
  const d1 = makeDir('s1-new', doc(BODY)), d2 = makeDir('s1-base', doc(BODY));
  const a = runGen(d1, cfg), b = runGen(d2, cfg, BASE_GEN);
  const expected = without(BODY, [4, 5, 10, 17, 19]);
  const ok = a.status === 0 && b.status === 0 && read(d1) === read(d2) && read(d1) === expected && JSON.stringify(a.meta) === JSON.stringify(b.meta) && a.stdout === b.stdout;
  record('S1', '단일 객체 설정: 고친 생성기 = 기준 생성기(index.html · 메타 · 출력 줄 모두 같음)', ok, { newStatus: a.status, baseStatus: b.status, sameHtml: read(d1) === read(d2), sameMeta: JSON.stringify(a.meta) === JSON.stringify(b.meta), sameStdout: a.stdout === b.stdout, stderr: (a.stderr || '').slice(0, 300), diffAt: read(d1) === expected ? null : firstDiff(read(d1), expected) });
}

// ── M1: 여러 실행 = 차례로 돌린 것
{
  const runs = [
    { kitVar: '_aKit', names: ['alpha', 'beta'] },
    { kitVar: '_bKit', names: ['gamma'] },
    { kitVar: '_bKit', imports: false, names: ['delta'] },
  ];
  const dMulti = makeDir('m1-multi', doc(BODY)), dSeq = makeDir('m1-seq', doc(BODY)), dBase = makeDir('m1-base', doc(BODY));
  const m = runGen(dMulti, cfgOf(runs));
  const seq = runs.map(u => runGen(dSeq, cfgOf(u)).status), base = runs.map(u => runGen(dBase, cfgOf(u), BASE_GEN).status);
  // 기대: alpha·beta·gamma 의 세 종류 전부, delta 는 getter 만(가져오기는 남는다 — useDelta 가 쓴다). 새 마지막 속성 esc 의 쉼표를 뗀다.
  const expected = without(BODY, [4, 5, 7, 10, 11, 13, 17, 18, 19], { 12: '    get esc(){ return esc; }' });
  const got = read(dMulti);
  const ok = m.status === 0 && seq.every(s => s === 0) && base.every(s => s === 0) && got === read(dSeq) && got === read(dBase) && got === expected && m.meta && Array.isArray(m.meta.runs) && m.meta.runs.length === 3;
  record('M1', '여러 실행(배열) 한 번 = 단일 객체 설정을 차례로 돌린 결과(고친 생성기 · 기준 생성기 모두와 바이트 동일)', ok, { status: m.status, stderr: (m.stderr || '').slice(0, 300), seq, base, sameSeq: got === read(dSeq), sameBase: got === read(dBase), diffAt: got === expected ? null : firstDiff(got, expected), runs: m.meta && m.meta.runs && m.meta.runs.map(r => r.kitVar + ':' + r.deletedLines.length) });
}

// ── M2: 원자성 · 빈 배열
{
  const d = makeDir('m2', doc(BODY)); const before = read(d);
  const r = runGen(d, cfgOf([{ kitVar: '_aKit', names: ['alpha', 'beta'] }, { kitVar: '_bKit', names: ['delta'] }])); // delta 는 useDelta 가 쓴다 → 2번째 실행 정지
  const e = runGen(d, cfgOf([]));
  record('M2', '뒤 실행이 멈추면 index.html 을 쓰지 않고 몇 번째 실행인지 알린다. 빈 배열은 멈춘다', r.status !== 0 && /\[unwire 실행 2\/2\]/.test(r.stderr) && /아직 쓰는 곳이 남는다/.test(r.stderr) && read(d) === before && e.status !== 0 && /배열이 비었다/.test(e.stderr) && read(d) === before,
    { status: r.status, stderr: (r.stderr || '').split('\n').find(l => /Error/.test(l)), emptyStatus: e.status });
}

// ── X1a: `_ui` 손잡이
{
  const d = makeDir('x1a', doc(BODY));
  const r = runGen(d, cfgOf({ kitVar: '_ui', names: ['esc', 'dl'] }));
  const expected = without(BODY, [1, 2, 12, 20]);
  const b = runGen(makeDir('x1a-base', doc(BODY)), cfgOf({ kitVar: '_ui', names: ['esc', 'dl'] }), BASE_GEN);
  record('X1a', '`_ui` 처럼 `_xxxKit` 꼴이 아닌 손잡이의 가져오기 줄을 지운다(기준 생성기는 같은 설정에서 멈춘다)', r.status === 0 && read(d) === expected && b.status !== 0 && /_xxxKit 꼴이어야 한다/.test(b.stderr), { status: r.status, stderr: (r.stderr || '').slice(0, 300), baseStatus: b.status, diffAt: read(d) === expected ? null : firstDiff(read(d), expected) });
}
// ── X1b: 손잡이가 아닌 이름
{
  const body = BODY.concat(['  var _fakeKit = { alpha: 1 };', '  var _twoKit = window.A, _other = window.B;']);
  const cases = [['_nopeKit', '선언 없음'], ['_fakeKit', 'window 로 시작하지 않는 초기값'], ['state', '상태 변수'], ['_twoKit', '선언자가 둘'], ['window.x', '이름이 아닌 글자']];
  const out = cases.map(([k, why]) => { const d = makeDir('x1b-' + k.replace(/\W/g, ''), doc(body)); const before = read(d); const r = runGen(d, cfgOf({ kitVar: k, imports: false, names: ['alpha'] })); return { kitVar: k, why, stopped: r.status !== 0 && /손잡이여야 한다|이름이 아니다/.test(r.stderr) && read(d) === before }; });
  record('X1b', '손잡이가 아닌 kitVar 는 멈춘다(선언 없음 · window 가 아닌 초기값 · 상태 변수 · 선언자 둘 · 이름이 아닌 글자)', out.every(o => o.stopped), out);
}

// ── X3a: 주석과 한 줄
{
  const body = BODY.slice(); body[17] = '  /* [옮김] alpha → 세포 */ window.alpha = alpha;';
  const u = { kitVar: '_aKit', names: ['alpha'] };
  const d0 = makeDir('x3a-off', doc(body)); const before = read(d0); const off = runGen(d0, cfgOf(u));
  const d = makeDir('x3a-on', doc(body)); const on = runGen(d, cfgOf({ ...u, sharedLine: true }));
  const expected = without(body, [4, 10], { 17: '  /* [옮김] alpha → 세포 */' });
  record('X3a', '주석과 한 줄을 나눠 쓰는 window 대입 — sharedLine 이면 대입 글자만 지우고 주석은 남긴다. 플래그가 없으면 예전처럼 멈춘다', off.status !== 0 && /다른 글자와 한 줄을 나눠 쓴다/.test(off.stderr) && read(d0) === before && on.status === 0 && read(d) === expected && on.meta.inlineEdits.length === 1,
    { offStatus: off.status, onStatus: on.status, stderr: (on.stderr || '').slice(0, 300), inlineEdits: on.meta && on.meta.inlineEdits, diffAt: read(d) === expected ? null : firstDiff(read(d), expected) });
}
// ── X3b: 한 줄 if 블록의 두 대입
{
  const body = BODY.slice(); body[18] = "  if(typeof window !== 'undefined'){ window.gamma = gamma; window.delta = delta; }";
  const mk = (name, u) => { const d = makeDir(name, doc(body)); const r = runGen(d, cfgOf(u)); return { d, r }; };
  const off = mk('x3b-off', { kitVar: '_bKit', names: ['gamma'] });
  const first = mk('x3b-first', { kitVar: '_bKit', names: ['gamma'], sharedLine: true });
  const second = mk('x3b-second', { kitVar: '_bKit', imports: false, names: ['delta'], sharedLine: true });
  const both = mk('x3b-both', { kitVar: '_bKit', imports: false, names: ['gamma', 'delta'], sharedLine: true });
  const eFirst = without(body, [7, 11], { 18: "  if(typeof window !== 'undefined'){ window.delta = delta; }" });
  const eSecond = without(body, [13], { 12: '    get esc(){ return esc; }', 18: "  if(typeof window !== 'undefined'){ window.gamma = gamma; }" });
  const eBoth = without(body, [11, 13, 18], { 12: '    get esc(){ return esc; }' });
  record('X3b', '한 줄 if 블록의 두 window 대입 — 앞 것만 · 뒤 것만 지우면 나머지가 남고, 둘 다 대상이면 줄째 지운다. 플래그가 없으면 예전처럼 멈춘다',
    off.r.status !== 0 && /하나만 지울 수 없다/.test(off.r.stderr) && first.r.status === 0 && read(first.d) === eFirst && second.r.status === 0 && read(second.d) === eSecond && both.r.status === 0 && read(both.d) === eBoth,
    { off: off.r.status, first: [first.r.status, read(first.d) === eFirst ? null : firstDiff(read(first.d), eFirst)], second: [second.r.status, read(second.d) === eSecond ? null : firstDiff(read(second.d), eSecond)], both: [both.r.status, read(both.d) === eBoth ? null : firstDiff(read(both.d), eBoth)], stderr: [first.r.stderr, second.r.stderr, both.r.stderr].map(s => (s || '').split('\n').find(l => /Error/.test(l)) || null) });
}
// ── X3c: 다른 문 뒤에 붙은 대입 · 같은 줄의 남은 참조
{
  const body = BODY.slice(); body[19] = '  var share = function(){ return state.n; }; window.beta = beta;';
  const d = makeDir('x3c', doc(body)); const r = runGen(d, cfgOf({ kitVar: '_aKit', names: ['beta'], sharedLine: true }));
  const expected = without(body, [5], { 19: '  var share = function(){ return state.n; };' });
  const body2 = BODY.slice(); body2[19] = '  var share = function(){ return beta(); }; window.beta = beta;'; // 같은 줄의 다른 문이 beta 를 쓴다
  const d2 = makeDir('x3c-ref', doc(body2)); const before2 = read(d2); const r2 = runGen(d2, cfgOf({ kitVar: '_aKit', names: ['beta'], sharedLine: true }));
  record('X3c', '다른 문 뒤에 붙은 window 대입은 대입 글자만 지운다. 같은 줄의 다른 문이 그 이름을 쓰면 잔존 참조로 멈춘다', r.status === 0 && read(d) === expected && r2.status !== 0 && /아직 쓰는 곳이 남는다/.test(r2.stderr) && read(d2) === before2,
    { status: r.status, stderr: (r.stderr || '').slice(0, 300), diffAt: read(d) === expected ? null : firstDiff(read(d), expected), refStatus: r2.status });
}
// ── X3d: sharedLine 이어도 멈추는 것
{
  const cases = [
    ['쉼표 연쇄', 17, '  window.alpha = alpha, window.beta2 = alpha;', /쉼표 연쇄/],
    ['한 줄 if 블록 안 쉼표 연쇄', 17, "  if(typeof window !== 'undefined'){ window.alpha = alpha, window.a2 = alpha; window.a3 = alpha; }", /쉼표 연쇄/],
    ['오른쪽이 이름이 아님', 17, '  /* 주석 */ window.alpha = function(){ return 1; };', /정의문이라 지우지 않는다/],
  ];
  const out = cases.map(([why, i, line, re], k) => { const body = BODY.slice(); body[i] = line; const d = makeDir('x3d-' + k, doc(body)); const before = read(d); const r = runGen(d, cfgOf({ kitVar: '_aKit', imports: false, names: ['alpha'], sharedLine: true })); return { why, stopped: r.status !== 0 && re.test(r.stderr) && read(d) === before, err: (r.stderr || '').split('\n').find(l => /Error/.test(l)) }; });
  const body = BODY.slice(0, 17).concat(["  if(typeof window !== 'undefined'){", '    window.alpha = alpha; // 꼬리 주석', '    window.beta = beta;', '  }'], BODY.slice(20));
  const d = makeDir('x3d-block', doc(body)); const before = read(d); const r = runGen(d, cfgOf({ kitVar: '_aKit', imports: false, names: ['alpha'], sharedLine: true }));
  out.push({ why: '여러 줄 if 블록 안의 나눠 쓴 줄', stopped: r.status !== 0 && /window 대입 줄에 다른 글자가 있다/.test(r.stderr) && read(d) === before, err: (r.stderr || '').split('\n').find(l => /Error/.test(l)) });
  record('X3d', 'sharedLine 이어도 멈춘다: 쉼표 연쇄 · 오른쪽이 이름이 아닌 대입 · 여러 줄 if 블록 안의 나눠 쓴 줄', out.every(o => o.stopped), out);
}

// ── X2a·X2b: 손잡이 줄
{
  const d = makeDir('x2a', doc(BODY)); const r = runGen(d, cfgOf({ kitVar: '_aKit', names: ['alpha', 'beta'], dropKitVar: true }));
  const expected = without(BODY, [3, 4, 5, 10, 17, 19]);
  const d1 = makeDir('x2a-two', doc(BODY)); const r1 = runGen(d1, cfgOf([{ kitVar: '_aKit', names: ['alpha', 'beta'] }, { kitVar: '_aKit', dropKitVar: true }])); // 손잡이 줄만 지우는 실행(names 없음)
  const d2 = makeDir('x2b', doc(BODY)); const before2 = read(d2); const r2 = runGen(d2, cfgOf({ kitVar: '_aKit', names: ['alpha'], dropKitVar: true })); // beta 가져오기가 남아 손잡이를 쓴다
  const d3 = makeDir('x2b-empty', doc(BODY)); const before3 = read(d3); const r3 = runGen(d3, cfgOf({ kitVar: '_aKit', names: [] })); // 플래그 없이 names 가 비면 예전처럼 멈춘다
  record('X2a', 'dropKitVar: 가져오기가 모두 지워져 참조가 0 이면 손잡이 줄을 지운다. names 없이 손잡이 줄만 지우는 실행도 된다', r.status === 0 && read(d) === expected && r.meta.removed.kitVarLine && r1.status === 0 && read(d1) === expected,
    { status: r.status, stderr: (r.stderr || '').slice(0, 300), kitVarLine: r.meta && r.meta.removed.kitVarLine, twoRuns: r1.status, diffAt: read(d) === expected ? null : firstDiff(read(d), expected) });
  record('X2b', 'dropKitVar: 손잡이 참조가 남으면 멈춘다. 플래그 없이 names 가 비면 예전처럼 멈춘다', r2.status !== 0 && /손잡이 _aKit 을\(를\) IIFE 안에서 아직 쓰는 곳이 남는다/.test(r2.stderr) && read(d2) === before2 && r3.status !== 0 && /names 가 비었다/.test(r3.stderr) && read(d3) === before3,
    { status: r2.status, err: (r2.stderr || '').split('\n').find(l => /Error/.test(l)), emptyStatus: r3.status });
}

// ── C1: 모르는 칸
{
  const d = makeDir('c1', doc(BODY)); const before = read(d);
  const r = runGen(d, cfgOf({ kitVar: '_aKit', names: ['alpha'], deleteComments: true }));
  const r2 = runGen(d, cfgOf({ kitVar: '_aKit', names: ['alpha'], sharedline: true }));
  record('C1', '모르는 칸(deleteComments · 오타 sharedline)은 멈춘다', r.status !== 0 && /모르는 칸: deleteComments/.test(r.stderr) && r2.status !== 0 && /모르는 칸: sharedline/.test(r2.stderr) && read(d) === before, { status: [r.status, r2.status] });
}

// ── R1·R2·R3: 실제 index.html(PIN 커밋)
{
  const plan = JSON.parse(fs.readFileSync(path.join(APP, 'reports', 'TASK-ES-614', 'unwire-plan.json'), 'utf8'));
  const runs = plan.runs.map(r => ({ kitVar: r.kitVar, imports: r.flags.imports, exposeGetters: r.flags.exposeGetters, windowAssign: r.flags.windowAssign, names: r.names }));
  const dBase = makeDir('r1-base', REAL_HTML), dStep = makeDir('r1-step', REAL_HTML), dMulti = makeDir('r1-multi', REAL_HTML);
  const steps = [];
  let stepOk = true;
  for (let i = 0; i < runs.length; i++) {
    fs.writeFileSync(path.join(dStep, 'index.html'), read(dBase), 'utf8');             // 두 생성기가 같은 입력(기준 사슬의 지금 상태)에서 이 실행 하나를 돈다
    const n = runGen(dStep, cfgOf(runs[i])); const b = runGen(dBase, cfgOf(runs[i]), BASE_GEN);
    const same = n.status === 0 && b.status === 0 && read(dStep) === read(dBase) && JSON.stringify(n.meta) === JSON.stringify(b.meta) && n.stdout === b.stdout;
    steps.push({ run: i + 1, kitVar: runs[i].kitVar, names: runs[i].names.length, base: b.status, ext: n.status, same, deleted: b.meta ? b.meta.deletedLines.length : null, expected: plan.runs[i].expectedDeletedLines, err: same ? undefined : ((b.stderr || n.stderr || '').split('\n').find(l => /Error/.test(l)) || null) });
    if (!same) { stepOk = false; break; }
  }
  const m = stepOk ? runGen(dMulti, cfgOf(runs)) : { status: null, stderr: '' };
  const seqText = read(dBase), multiText = m.status === 0 ? read(dMulti) : null;
  const linesOf = t => t.split('\n').length;
  const r1ok = stepOk && m.status === 0 && Buffer.compare(Buffer.from(seqText, 'utf8'), Buffer.from(multiText, 'utf8')) === 0;
  record('R1', '실제 index.html: unwire-plan.json ' + runs.length + '실행을 기준 생성기로 차례로 돌린 결과 = 고친 생성기에 배열 한 번(바이트 동일). 단계마다 두 생성기의 결과·메타·출력도 같다', r1ok,
    { pin: PIN_FULL, runs: runs.length, stepsSame: steps.filter(s => s.same).length, multiStatus: m.status, stderr: (m.stderr || '').split('\n').find(l => /Error/.test(l)) || null, htmlLines: [linesOf(REAL_HTML), linesOf(seqText)], planHtmlLines: plan.totals.htmlLines, bytes: [Buffer.byteLength(seqText, 'utf8'), multiText === null ? null : Buffer.byteLength(multiText, 'utf8')], deletedByRun: steps.map(s => s.deleted), expectedByRun: steps.map(s => s.expected), steps: steps.filter(s => !s.same) });

  // R2: 새 기능을 실제 파일에 — 실행마다 「가져오기까지」를 먼저 해 보고, 잔존 참조로 멈추면 「가져오기는 남김」으로 돈다(어느 쪽이었는지 기록)
  const extra = [];
  const tryRun = (dir, label, base) => {
    const keep = read(dir);
    let u = { ...base, imports: true }; let r = runGen(dir, cfgOf(u));
    if (r.status !== 0 && /아직 쓰는 곳이 남는다/.test(r.stderr)) { fs.writeFileSync(path.join(dir, 'index.html'), keep, 'utf8'); u = { ...base, imports: false }; r = runGen(dir, cfgOf(u)); }
    extra.push({ label, cfg: u, status: r.status, meta: r.meta, err: r.status === 0 ? null : (r.stderr || '').split('\n').find(l => /Error/.test(l)), before: keep, after: r.status === 0 ? read(dir) : keep });
    if (r.status !== 0) fs.writeFileSync(path.join(dir, 'index.html'), keep, 'utf8');
    return r.status === 0;
  };
  const dX = makeDir('r2', seqText);
  const sharedNames = [...new Set(plan.stoppedByGenerator.map(s => s.name))];
  for (const n of sharedNames) tryRun(dX, 'X3 sharedLine ' + n, { kitVar: '_uiKit', sharedLine: true, names: [n] });
  for (const k of plan.notRunnableKitVars) for (const n of k.registeredNames) tryRun(dX, 'X1 ' + k.kitVar + ' ' + n, { kitVar: k.kitVar, names: [n] });
  // 닫힌 목록 검사: 실행마다 이전·이후를 줄 단위로 맞대 — 지워진 줄과 바뀐 줄의 종류를 정규식으로 가른다
  const KIND = (t, kit) => new RegExp('^var [\\w$]+ = ' + kit.replace(/\$/g, '\\$') + '\\.[\\w$]+;$').test(t) ? 'import'
    : /^(get [\w$]+\(\)\{ return [\w$]+; \})(, set [\w$]+\(v\)\{ [\w$]+ = v; \})?,?$/.test(t) ? 'expose'
      : /^window\.[\w$]+ = [\w$]+;$/.test(t) || /^if\(typeof window !== 'undefined'\)\{( window\.[\w$]+ = [\w$]+;)+ \}$/.test(t) ? 'window'
        : /^(if\(typeof window !== 'undefined'\)\{|\}|window\.OurgoalAppScope\.expose\('index\.html', \{|\}\);)$/.test(t) ? 'wrapper' : 'OTHER:' + t.slice(0, 80);
  const audit = extra.filter(x => x.status === 0).map(x => {
    const bl = x.before.split('\n').map(l => l.replace(/\r$/, '')), al = x.after.split('\n').map(l => l.replace(/\r$/, ''));
    const del = new Set(x.meta.deletedLines), comma = new Set(x.meta.commaFixedLines), inl = new Map((x.meta.inlineEdits || []).map(e => [e.line, e]));
    const kinds = {}; let j = 0, same = true, bad = null;
    for (let i = 0; i < bl.length; i++) {
      const l = i + 1;
      if (del.has(l)) { const k = KIND(bl[i].trim(), x.cfg.kitVar); kinds[k] = (kinds[k] || 0) + 1; continue; }
      let want = bl[i];
      if (comma.has(l)) want = want.replace(/,\s*$/, '');
      if (inl.has(l)) { // 줄 안에서 빠진 글자는 `window.X = X;`(와 빈칸)뿐이어야 한다
        const gone = x.cfg.names.map(n => 'window.' + n + ' = ' + n + ';');
        let t = bl[i]; for (const g of gone) t = t.split(g).join('');
        const norm = s => s.replace(/\s+/g, ' ').replace(/\{ \}/, '{}').trim();
        if (norm(t) !== norm(al[j]) || al[j] !== inl.get(l).after) { same = false; bad = { line: l, before: bl[i], after: al[j] }; break; }
        kinds.inline = (kinds.inline || 0) + 1; j++; continue;
      }
      if (al[j] !== want) { same = false; bad = { line: l, got: al[j], want }; break; }
      j++;
    }
    return { label: x.label, imports: x.cfg.imports, kinds, ok: same && j === al.length && Object.keys(kinds).every(k => !k.startsWith('OTHER')), bad };
  });
  const x3ok = extra.filter(x => /^X3/.test(x.label)), x1ok = extra.filter(x => /^X1/.test(x.label));
  record('R2', '실제 index.html: X3(sharedLine) ' + x3ok.filter(x => x.status === 0).length + '/' + x3ok.length + '개 · X1(`_ui`·`_xp`) ' + x1ok.filter(x => x.status === 0).length + '/' + x1ok.length + '개 이름 철거 — 지운 줄은 가져오기·getter·window 대입(과 빈 껍데기)뿐, 줄 안에서 지운 글자는 window 대입뿐, 나머지 줄은 순서대로 같다',
    x3ok.length > 0 && x3ok.every(x => x.status === 0) && x1ok.some(x => x.status === 0) && audit.every(a => a.ok) && audit.some(a => a.kinds.inline) && audit.some(a => a.kinds.import),
    { runs: extra.map(x => ({ label: x.label, imports: x.cfg.imports, status: x.status, err: x.err, deleted: x.meta && x.meta.deletedLines.length, inlineEdits: x.meta && x.meta.inlineEdits })), audit, htmlLinesAfter: linesOf(read(dX)) });

  // R3: 참조가 남은 손잡이
  const d3 = makeDir('r3', seqText); const before3 = read(d3);
  const r3 = runGen(d3, cfgOf({ kitVar: '_settingsKit', dropKitVar: true }));
  record('R3', '실제 index.html: 가져오기가 남아 있는 손잡이(_settingsKit)에 dropKitVar 를 주면 멈추고 쓰지 않는다', r3.status !== 0 && /손잡이 _settingsKit 을\(를\) IIFE 안에서 아직 쓰는 곳이 남는다/.test(r3.stderr) && read(d3) === before3, { status: r3.status, err: ((r3.stderr || '').split('\n').find(l => /Error/.test(l)) || '').slice(0, 200) });
}

const out = { tool: 'docs/design/harness/module-split/unwire-check-ext-619.js', type: '작업자 측정, 판정 아님', generator: 'docs/design/harness/module-split/gen-inline-hard.js', baseGenerator: PIN_FULL + ':docs/design/harness/module-split/gen-inline-hard.js', realIndexHtml: PIN_FULL + ':index.html', app: APP, measuredAt: new Date().toISOString(), tmp: tmpRoot, results, passed: results.filter(r => r.ok).length, total: results.length, ok: results.every(r => r.ok) };
if (OUT) { fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8'); }
console.log('unwire-check-ext-619', out.passed + '/' + out.total, out.ok ? 'ok' : 'FAIL');
try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ }
process.exit(out.ok ? 0 : 1);
