'use strict';
// 생성기 「상태 이전 모드」(gen-inline-hard.js mode:"unstate", #TASK-ES-634) 단위 시험 — docs/architecture/CELL-REGISTRY-DESIGN.md 3.3절 · 5절 닫힌 목록 X4·X5·X6. 작업자 측정, 판정 아님.
// 저장소 밖 임시 폴더에서 생성기를 자식 프로세스로 돌리고(법정 recomputeSplit 과 같은 호출 꼴) 결과를 바이트 단위로 맞댄다. 저장소의 index.html 은 건드리지 않는다.
//  B    unwire 확장 시험 16건(unwire-check-ext-619.js — 그 안에서 B1 시험 8건도 다시 돈다)이 그대로 통과: 기존 unwire 경로·옮기기 경로 바이트 무변화.
//  U1   unwire 설정(단일 객체 · 배열)을 고친 생성기와 기준 생성기(PIN 커밋)에 돌린 결과·메타·출력이 같다.
//  T1   S1·R1·R2 한 번에: getter/setter 줄 삭제(쉼표 한 글자) · `var X = 초기값;` → define/defineVar(여러 줄 초기값 포함) · window 복사 줄 세 꼴의 오른쪽 바꿔 쓰기. names 밖은 글자 그대로.
//  S1   expose 문의 속성이 모두 대상이면 문 전체를 지운다. 대상이 없는 expose 문은 쉼표까지 그대로다.
//  R1   초기값 글자 보존: 괄호 · 주석 · 문자열 안의 같은 글자 · 함수식 · `;` 앞 빈칸.
//  K1   define/defineVar 선택: 마지막 노출 문에 set 이 있었는가(getter 만 → define · get+set → defineVar · 앞에는 set 이 있었지만 마지막엔 없음 → define(L047) · 마지막에만 set → defineVar).
//  Z*   정지 조건 각각 — 멈추고 index.html 을 쓰지 않는다.
//  M1   여러 실행: 배열(unstate 단계와 { unwire } 단계 섞음) 한 번 = 단계를 따로 차례로 돌린 결과. M2 원자성 · 빈 배열 · unwire 단계의 다른 칸.
//  V1   모의 기관 등가: 진짜 js/core/app-scope.js 와 설계 3.3 의 API 대로 만든 견본 기관을 vm 에 올려, 바꿔 쓰기 전·후 꾸러미를 실행한 관찰값(통로 읽기·쓰기 · window 복사)이 같다.
//  P1   실제 index.html(PIN 커밋): 통로에 노출된 상태 이름을 전부 뽑아 하나씩 돌려 「지금 옮길 수 있는 이름」과 멈춘 사유를 가른 뒤, 옮길 수 있는 이름 전부를 한 번에 돌린다 — 성공하고 다시 파싱된다.
//  P2   실제 index.html: 그 결과를 줄 단위로 맞대 — 지운 줄은 getter/setter(와 빈 껍데기)뿐, 바뀐 줄은 `var X =` → define 머리 · `;` → `);` · window 복사 오른쪽뿐, 나머지 줄은 순서대로 같다.
//  P3   계획 파일(둘째 출력)을 쓴다: 대상 이름 · 이름별 API · 멈춘 이름과 사유 · 예상 줄 변화. (모의 적용 사본의 앱 부팅은 기관이 없어 재지 않는다 — 측정불가)
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node unstate-check-634.js <APP_DIR(작업 트리)> <out.json> [계획.json]
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), vm = require('vm');
const [APP_ARG, OUT, PLAN_OUT] = process.argv.slice(2);
const APP = path.resolve(APP_ARG);
const HARNESS = path.join(APP, 'docs', 'design', 'harness', 'module-split');
const GEN = path.join(HARNESS, 'gen-inline-hard.js');
const PIN = 'ba02c840'; // 기준 커밋(#904 병합, 키트별 철거 B3~B8 뒤) — 기준 생성기와 실제 index.html 을 여기서 읽는다(main 이 움직여도 같은 입력)
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'unstate-634-'));
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
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, meta, err: r.status === 0 ? null : ((r.stderr || '').split('\n').find(l => /Error/.test(l)) || '').replace(/^Error: /, '') };
}
function makeDir(name, text) { const d = path.join(tmpRoot, name); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'index.html'), text, 'utf8'); return d; }
const read = d => fs.readFileSync(path.join(d, 'index.html'), 'utf8');
function record(id, title, ok, detail) { results.push({ id, title, ok: !!ok, detail }); console.log((ok ? 'ok  ' : 'FAIL'), id, title, ok ? '' : JSON.stringify(detail).slice(0, 700)); }
function firstDiff(a, b) { const al = a.split('\n'), bl = b.split('\n'); for (let i = 0; i < Math.max(al.length, bl.length); i++) if (al[i] !== bl[i]) return { line: i + 1, got: al[i], want: bl[i] }; return null; }
const cfgState = unstate => ({ task: 'TASK-634-UNIT', slot: 'HO', mode: 'unstate', cells: [{ file: 'js/core/app-state.js' }], unstate });
const cfgWire = unwire => ({ task: 'TASK-634-UNIT', slot: 'HO', mode: 'unwire', cells: [{ file: 'js/core/cell-registry.js' }], unwire });
const HEAD = ['<!doctype html>', '<html><head><title>fixture</title></head><body>', '<script src="js/core/app-scope.js"></script>', '<script>', '(function(){', '  "use strict";'];
const TAIL = ['})();', '</script>', '</body></html>', ''];
const doc = body => HEAD.concat(body, TAIL).join('\n');
const patch = (body, drop, swap) => doc(body.map((l, i) => (swap && swap[i] !== undefined ? swap[i] : l)).filter((l, i) => !(drop || []).includes(i)));
const stops = (id, title, body, unstate, re) => { // 멈추고 쓰지 않는가
  const d = makeDir(id.toLowerCase(), doc(body)); const before = read(d); const r = runGen(d, cfgState(unstate));
  record(id, title, r.status !== 0 && re.test(r.stderr) && read(d) === before, { status: r.status, err: r.err, unchanged: read(d) === before });
};

// ── B: 619 시험(그 안에서 B1 8건)
{
  const out = path.join(tmpRoot, 'ext619.json');
  const r = cp.spawnSync(process.execPath, [path.join(HARNESS, 'unwire-check-ext-619.js'), APP, out], { encoding: 'utf8', env: process.env, maxBuffer: 1024 * 1024 * 64 });
  const j = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
  const b1 = j && (j.results.find(x => x.id === 'B') || {}).detail;
  record('B', 'unwire 확장 시험 16건(#TASK-ES-619 — B1 시험 8건 재실행 포함)이 고친 생성기에서 그대로 통과', r.status === 0 && j && j.ok && j.total === 16 && j.passed === 16 && b1 && b1.passed === 8,
    { status: r.status, passed: j && j.passed, total: j && j.total, b1: b1 && (b1.passed + '/' + b1.total), each: j && j.results.map(x => x.id + ':' + (x.ok ? 'ok' : 'FAIL')), a1Files: b1 && b1.a1Files });
}

// 공용 꾸러미
const BODY = [
  '  var _aKit = window.OurgoalAKit;',                                               // 0
  '  var alpha = _aKit.alpha;',                                                      // 1
  "  window.OurgoalAppScope.expose('index.html', {",                                 // 2
  '    get alpha(){ return alpha; },',                                               // 3
  '    get counter(){ return counter; }, set counter(v){ counter = v; },',           // 4
  '    get label(){ return label; },',                                               // 5
  '    get keep(){ return keep; },',                                                 // 6
  '    get themes(){ return themes; }',                                              // 7
  '  });',                                                                           // 8
  '  var counter = 0;',                                                              // 9
  "  var label = 'a (label) b';",                                                    // 10 문자열 안에 자기 이름 글자
  '  var keep = { n: 1 };',                                                          // 11
  '  var themes = [',                                                                // 12
  "    { id: 'a' },",                                                                // 13
  "    { id: 'b' }",                                                                 // 14
  '  ];',                                                                            // 15
  '  function bump(){ return keep.n + 1; }',                                         // 16
  '  window.label = label;',                                                         // 17
  "  if(typeof window !== 'undefined'){ window.counter = counter; }",                // 18
  "  if(typeof window !== 'undefined'){",                                            // 19
  '    window.themes = themes;',                                                     // 20
  '    window.bump = bump;',                                                         // 21
  '  }',                                                                             // 22
  '  window.alpha = alpha;',                                                         // 23
];
const T1_SWAP = {
  6: '    get keep(){ return keep; }',
  9: "  window.OurgoalAppState.defineVar('counter', 0);",
  10: "  window.OurgoalAppState.define('label', 'a (label) b');",
  12: "  window.OurgoalAppState.define('themes', [",
  15: '  ]);',
  17: '  window.label = window.OurgoalAppScope.scope.label;',
  18: "  if(typeof window !== 'undefined'){ window.counter = window.OurgoalAppScope.scope.counter; }",
  20: '    window.themes = window.OurgoalAppScope.scope.themes;',
};
const T1_EXPECTED = patch(BODY, [4, 5, 7], T1_SWAP);

// ── U1: unwire 설정은 기준 생성기와 같은 결과
{
  const cfgs = [cfgWire({ kitVar: '_aKit', names: ['alpha'] }), cfgWire([{ kitVar: '_aKit', imports: false, names: ['alpha'] }, { kitVar: '_aKit', names: ['alpha'], dropKitVar: true }])];
  const out = cfgs.map((c, i) => { const d1 = makeDir('u1-new-' + i, doc(BODY)), d2 = makeDir('u1-base-' + i, doc(BODY)); const a = runGen(d1, c), b = runGen(d2, c, BASE_GEN); return { new: a.status, base: b.status, same: a.status === 0 && b.status === 0 && read(d1) === read(d2) && JSON.stringify(a.meta) === JSON.stringify(b.meta) && a.stdout === b.stdout, err: a.err || b.err }; });
  record('U1', 'unwire 설정(단일 객체 · 배열+dropKitVar): 고친 생성기 = 기준 생성기(index.html · 메타 · 출력 줄)', out.every(o => o.same), out);
}

// ── T1: S1·R1·R2 한 번에
{
  const d = makeDir('t1', doc(BODY)); const r = runGen(d, cfgState({ names: ['counter', 'label', 'themes'] }));
  const got = read(d);
  record('T1', 'S1 getter/setter 줄 삭제 · R1 선언문 → define/defineVar(여러 줄 초기값 포함) · R2 window 복사 세 꼴의 오른쪽 바꿔 쓰기. names 밖(keep · alpha · bump · 손잡이)은 글자 그대로',
    r.status === 0 && got === T1_EXPECTED && r.meta && r.meta.api.counter === 'defineVar' && r.meta.api.label === 'define' && r.meta.api.themes === 'define' && r.meta.deletedLines.length === 3 && r.meta.rewritten.windowCopies.length === 3,
    { status: r.status, err: r.err, api: r.meta && r.meta.api, deleted: r.meta && r.meta.deletedLines, edited: r.meta && r.meta.editedLines, diffAt: got === T1_EXPECTED ? null : firstDiff(got, T1_EXPECTED) });
}
// ── S1: expose 문 전체 삭제 · 대상 없는 expose 문은 그대로
{
  const body = ["  window.OurgoalAppScope.expose('index.html', {", '    get counter(){ return counter; }, set counter(v){ counter = v; }', '  });', "  window.OurgoalAppScope.expose('index.html', {", '    get other(){ return other; },', '  });', '  var counter = 1;', '  var other = 2;', '  function useOther(){ return other; }'];
  const d = makeDir('s1', doc(body)); const r = runGen(d, cfgState({ names: ['counter'] }));
  const expected = patch(body, [0, 1, 2], { 6: "  window.OurgoalAppState.defineVar('counter', 1);" }); // 둘째 expose 문의 끝 쉼표는 손대지 않는다
  record('S1', 'expose 문의 속성이 모두 대상이면 문 전체를 지운다. 대상이 없는 expose 문은 끝 쉼표까지 그대로다', r.status === 0 && read(d) === expected && r.meta.removed.exposeCalls.length === 1 && r.meta.commaFixedLines.length === 0, { status: r.status, err: r.err, diffAt: read(d) === expected ? null : firstDiff(read(d), expected) });
}
// ── R1: 초기값 글자 보존
{
  const body = ["  window.OurgoalAppScope.expose('index.html', {", '    get a1(){ return a1; },', '    get a2(){ return a2; },', '    get a3(){ return a3; },', '    get a4(){ return a4; }, set a4(v){ a4 = v; },', '    get a5(){ return a5; }', '  });',
    '  var a1 = (1, 2);', "  var a2 = /* 주석 a2 */ 'var a2 = 1;';", '  var a3 = function(x){ return x ? { k: [x] } : null; };', '  var a4 = document.getElementById("a4") ;', "  var a5 = window.cfg && window.cfg.on ? 'y' : 'n';"];
  const d = makeDir('r1', doc(body)); const r = runGen(d, cfgState({ names: ['a1', 'a2', 'a3', 'a4', 'a5'] }));
  const expected = patch(body, [0, 1, 2, 3, 4, 5, 6], { 7: "  window.OurgoalAppState.define('a1', (1, 2));", 8: "  window.OurgoalAppState.define('a2', /* 주석 a2 */ 'var a2 = 1;');", 9: "  window.OurgoalAppState.define('a3', function(x){ return x ? { k: [x] } : null; });", 10: "  window.OurgoalAppState.defineVar('a4', document.getElementById(\"a4\") );", 11: "  window.OurgoalAppState.define('a5', window.cfg && window.cfg.on ? 'y' : 'n');" });
  record('R1', '초기값 글자 보존: 괄호 친 식 · 초기값 앞 주석 · 문자열 안의 같은 글자 · 함수식 · `;` 앞 빈칸 · 조건식', r.status === 0 && read(d) === expected, { status: r.status, err: r.err, diffAt: read(d) === expected ? null : firstDiff(read(d), expected) });
}
// ── K1: define / defineVar 선택
{
  const ex = (...props) => ["  window.OurgoalAppScope.expose('index.html', {"].concat(props.map((p, i) => '    ' + p + (i < props.length - 1 ? ',' : '')), ['  });']);
  const G = 'get v(){ return v; }', GS = 'get v(){ return v; }, set v(x){ v = x; }';
  const cases = [['getter 만', [ex(G)], 'define'], ['get+set', [ex(GS)], 'defineVar'], ['앞에는 set, 마지막엔 getter 만(L047)', [ex(GS), ex(G)], 'define'], ['앞에는 getter 만, 마지막에 set', [ex(G), ex(GS)], 'defineVar'], ['마지막 문에서 get 과 set 이 다른 줄', [ex(G), ex('get v(){ return v; }', 'set v(x){ v = x; }')], 'defineVar']];
  const out = cases.map(([why, blocks, want], i) => { const body = [].concat(...blocks, ['  var v = 1;']); const d = makeDir('k1-' + i, doc(body)); const r = runGen(d, cfgState({ names: ['v'] })); return { why, want, got: r.meta && r.meta.api.v, ok: r.status === 0 && r.meta.api.v === want && read(d) === doc(["  window.OurgoalAppState." + want + "('v', 1);"]), err: r.err }; });
  record('K1', 'define/defineVar 는 「지우기 직전 마지막 노출 문에 set 이 있었는가」로 생성기가 정한다(L047)', out.every(o => o.ok), out);
}

// ── Z: 정지 조건
{
  const b = () => BODY.slice();
  let x;
  x = b(); x.splice(16, 0, '  function readCounter(){ return counter + 1; }'); stops('Z01', '정지: 맨이름 참조가 남음(함수 본문이 읽는다)', x, { names: ['counter'] }, /아직 맨이름으로 쓰는 곳이 남는다/);
  x = b(); x.splice(16, 0, '  function setLabel(){ label = "z"; }'); stops('Z02', '정지: 맨이름 대입이 남음(함수 본문이 쓴다)', x, { names: ['label'] }, /아직 맨이름으로 쓰는 곳이 남는다/);
  x = b(); x[10] = "  var label = 'a'; var tail = 1;"; stops('Z03', '정지: 선언문이 다른 문과 한 줄을 나눠 씀', x, { names: ['label'] }, /선언문 label 이\(가\) 다른 글자와 한 줄을 나눠 쓴다/);
  x = b(); x[10] = "  /* 앞 주석 */ var label = 'a';"; stops('Z04', '정지: 선언문이 주석과 한 줄을 나눠 씀', x, { names: ['label'] }, /다른 글자와 한 줄을 나눠 쓴다/);
  x = b(); x[9] = '  var counter = 0, extra = 1;'; stops('Z05', '정지: 선언자가 여럿', x, { names: ['counter'] }, /선언자가 여럿인 선언문이다/);
  x = b(); x[9] = '  var counter = (typeof counter === "number") ? counter : 0;'; stops('Z06', '정지: 초기값에 자기 이름', x, { names: ['counter'] }, /초기값에 자기 이름이 나온다/);
  x = b(); x.splice(10, 0, '  var counter = 5;'); stops('Z07', '정지: 같은 이름의 선언이 여럿', x, { names: ['counter'] }, /선언이 여럿이다/);
  x = b(); x[9] = '  var counter;'; stops('Z08', '정지: 초기값이 없음', x, { names: ['counter'] }, /초기값이 없는 선언이다/);
  x = b(); x.splice(16, 0, '  var hidden = 3;'); stops('Z09', '정지: 통로에 노출되지 않은 이름', x, { names: ['hidden'] }, /통로에 노출되지 않은 이름이다/);
  stops('Z10', '정지: 선언이 없는 이름', b(), { names: ['nothingHere'] }, /IIFE 최상위 선언이 없다/);
  x = b(); x[5] = '    get label(){ return label + "!"; },'; stops('Z11', '정지: getter 본문이 `return X;` 꼴이 아님', x, { names: ['label'] }, /꼴이 아니다 — 지우지 않는다/);
  x = b(); x[4] = '    get counter(){ return counter; }, set counter(v){ counter = v; bump(); },'; stops('Z12', '정지: setter 본문이 `X = v;` 꼴이 아님', x, { names: ['counter'] }, /꼴이 아니다 — 지우지 않는다/);
  x = b(); x[17] = '  /* 주석 */ window.label = label;'; stops('Z13', '정지: window 복사 줄이 다른 글자와 한 줄을 나눠 씀', x, { names: ['label'] }, /window 복사 줄이 다른 글자와 한 줄을 나눠 쓴다/);
  x = b(); x[18] = "  if(typeof window !== 'undefined'){ window.counter = counter; window.bump = bump; }"; stops('Z14', '정지: 한 줄 if 블록의 window 복사가 다른 대입과 한 줄', x, { names: ['counter'] }, /한 줄 if 블록의 window 복사가 다른 글자와 한 줄을 나눠 쓴다/);
  x = b(); x[17] = '  window.label = label, window.label2 = label;'; stops('Z15', '정지: window 복사가 쉼표 연쇄 안', x, { names: ['label'] }, /쉼표 연쇄/);
  x = b(); x[17] = '  window.caption = label;'; stops('Z16', '정지: 다른 이름으로 다는 window 대입(별칭)은 바꿔 쓰지 않고 참조로 남아 멈춘다', x, { names: ['label'] }, /아직 맨이름으로 쓰는 곳이 남는다/);
  x = b(); x[9] = '  let counter = 0;'; stops('Z17', '정지: var 선언이 아님', x, { names: ['counter'] }, /var 선언이 아니다/);
  x = b(); x[9] = '  var /* 사이 주석 */ counter = 0;'; stops('Z18', '정지: `var X =` 사이에 주석', x, { names: ['counter'] }, /사이에 주석이 있다/);
  stops('Z19', '정지: 모르는 칸', b(), { names: ['counter'], moveBodies: true }, /모르는 칸: moveBodies/);
  stops('Z20', '정지: names 가 빔', b(), { names: [] }, /names 가 비었다/);
  // 시점: 선언이 첫 노출보다 앞이고 그 사이에 실행되는 문이 있으면 멈춘다. 조용한 문(선언·함수 선언)만 있으면 돈다.
  const late = mid => ['  var early = 1;'].concat(mid, ["  window.OurgoalAppScope.expose('index.html', {", '    get early(){ return early; }', '  });']);
  stops('Z21', '정지: 선언이 첫 노출보다 앞이고 그 사이에 실행되는 문(호출)이 있음', late(['  boot();']), { names: ['early'] }, /노출 시점이 달라진다/);
  const dq = makeDir('z22', doc(late(['  var quiet = null;', '  function helper(){ return 1; }']))); const rq = runGen(dq, cfgState({ names: ['early'] }));
  record('Z22', '선언이 첫 노출보다 앞이어도 그 사이가 선언·함수 선언뿐이면 옮긴다', rq.status === 0 && read(dq) === doc(["  window.OurgoalAppState.define('early', 1);", '  var quiet = null;', '  function helper(){ return 1; }']), { status: rq.status, err: rq.err });
}

// ── M1·M2: 여러 실행
{
  const steps = [{ names: ['counter'] }, { unwire: { kitVar: '_aKit', names: ['alpha'], dropKitVar: true } }, { names: ['label', 'themes'] }];
  const dMulti = makeDir('m1-multi', doc(BODY)), dSeq = makeDir('m1-seq', doc(BODY));
  const m = runGen(dMulti, cfgState(steps));
  const seq = [runGen(dSeq, cfgState(steps[0])).status, runGen(dSeq, cfgWire(steps[1].unwire)).status, runGen(dSeq, cfgState(steps[2])).status];
  const expected = patch(BODY, [0, 1, 3, 4, 5, 7, 23], T1_SWAP);
  const got = read(dMulti);
  record('M1', '여러 실행: 배열(unstate · { unwire } · unstate) 한 번 = 단계를 따로 차례로 돌린 결과(바이트 동일)', m.status === 0 && seq.every(s => s === 0) && got === read(dSeq) && got === expected && m.meta.runs.length === 3 && m.meta.runs.map(r => r.step).join(',') === 'unstate,unwire,unstate',
    { status: m.status, err: m.err, seq, sameSeq: got === read(dSeq), steps: m.meta && m.meta.runs && m.meta.runs.map(r => r.step), diffAt: got === expected ? null : firstDiff(got, expected) });
  const d2 = makeDir('m2', doc(BODY)); const before = read(d2);
  const bad = runGen(d2, cfgState([{ names: ['counter'] }, { names: ['keep'] }])); // keep 은 bump 가 쓴다 → 2번째 실행 정지
  const empty = runGen(d2, cfgState([]));
  const extra = runGen(d2, cfgState([{ unwire: { kitVar: '_aKit', names: ['alpha'] }, names: ['counter'] }]));
  const single = runGen(d2, cfgState({ unwire: { kitVar: '_aKit', names: ['alpha'] } })); // 단일 객체 꼴에서는 unwire 칸을 받지 않는다
  record('M2', '뒤 실행이 멈추면 쓰지 않고 몇 번째 실행인지 알린다. 빈 배열 · unwire 단계에 다른 칸 · 단일 객체 꼴의 unwire 칸은 멈춘다',
    bad.status !== 0 && /\[unstate 실행 2\/2\]/.test(bad.stderr) && /아직 맨이름으로 쓰는 곳이 남는다/.test(bad.stderr) && empty.status !== 0 && /배열이 비었다/.test(empty.stderr) && extra.status !== 0 && /unwire 칸 하나만/.test(extra.stderr) && single.status !== 0 && /모르는 칸: unwire/.test(single.stderr) && read(d2) === before,
    { bad: bad.err, empty: empty.err, extra: extra.err, single: single.err, unchanged: read(d2) === before });
}

// ── V1: 모의 기관 등가(vm) — 설계 3.3 의 기관 API 계약대로 만든 견본. 진짜 기관(js/core/app-state.js)은 다음 PR 이다.
const SAMPLE_ORGAN = [
  '(function (global) {',
  '  var values = Object.create(null), kinds = Object.create(null);',
  '  function put(name, value, writable) {',
  "    if (typeof name !== 'string' || !name) throw new Error('[OurgoalAppState] name required');",
  "    if (name in kinds) throw new Error('[OurgoalAppState] already defined: ' + name); // 이름 하나에 선언 하나",
  "    values[name] = value; kinds[name] = writable ? 'var' : 'const';",
  '    var d = { get: function () { return values[name]; }, enumerable: true, configurable: true };',
  '    if (writable) d.set = function (v) { values[name] = v; };',
  '    var src = {}; Object.defineProperty(src, name, d);',
  "    global.OurgoalAppScope.expose('core/app-state', src); // 접근자는 그 이름의 첫 define 때 한 번 단다(이미 있던 속성은 다시 정의해 덮는다)",
  '  }',
  '  global.OurgoalAppState = { define: function (n, v) { put(n, v, false); }, defineVar: function (n, v) { put(n, v, true); } };',
  '})(window);'
].join('\n');
function observe(html, withOrgan) {
  const lines = html.split('\n'); const s = lines.indexOf('(function(){'), e = lines.indexOf('})();');
  const code = lines.slice(s, e + 1).join('\n');
  const sb = { }; sb.window = sb; sb.OurgoalAKit = { alpha: function () { return 'A'; } };
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(APP, 'js', 'core', 'app-scope.js'), 'utf8'), sb);
  if (withOrgan) vm.runInContext(SAMPLE_ORGAN, sb);
  vm.runInContext(code, sb);
  const L = sb.OurgoalAppScope.scope, o = {};
  const tryDo = f => { try { return f(); } catch (err) { return 'throw:' + err.constructor.name; } };
  o.read = { counter: L.counter, label: L.label, themes: JSON.stringify(L.themes), keep: JSON.stringify(L.keep), alpha: typeof L.alpha };
  o.window = { label: sb.label, counter: sb.counter, themesSame: sb.themes === L.themes, bump: sb.bump() };
  o.setCounter = tryDo(() => { L.counter = 7; return L.counter; });
  o.setLabelStrict = tryDo(() => vm.runInContext('(function(){ "use strict"; OurgoalAppScope.scope.label = "z"; return OurgoalAppScope.scope.label; })()', sb)); // getter 만 있는 이름에 쓰기 — 전·후 모두 같은 결과여야 한다
  o.mutate = tryDo(() => { L.themes.push({ id: 'c' }); return sb.themes.length; }); // 같은 객체를 가리키는가
  o.descriptor = ['counter', 'label', 'themes'].map(n => { const d = Object.getOwnPropertyDescriptor(L, n); return n + ':' + (d && d.get ? 'get' : '') + (d && d.set ? '+set' : ''); });
  o.windowCounterAfterSet = sb.counter; // 일회 복사라 따라 바뀌지 않는다
  return o;
}
{
  let before = null, after = null, err = null;
  try { before = observe(doc(BODY), false); after = observe(T1_EXPECTED, true); } catch (e2) { err = String(e2 && e2.stack || e2).slice(0, 400); }
  record('V1', '모의 기관 등가: 진짜 app-scope.js + 설계 3.3 계약대로 만든 견본 기관에서, 바꿔 쓰기 전·후 꾸러미의 관찰값(통로 읽기·쓰기 · getter 전용 이름에 쓰기 · window 일회 복사 · 같은 객체)이 같다', !err && JSON.stringify(before) === JSON.stringify(after), { err, before, after });
}

// ── P1·P2·P3: 실제 index.html(PIN 커밋)
{
  const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
  const lines = REAL_HTML.split('\n').map(l => l.replace(/\r$/, ''));
  let s = -1, e = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
  const ast = parser.parse(lines.slice(s, e).join('\n'), { sourceType: 'script', ranges: true });
  let iife = null; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
  const top = iife.get('body').get('body');
  const rootWin = n => { let x = n; while (x && x.type === 'MemberExpression') x = x.object; return !!x && x.type === 'Identifier' && x.name === 'window'; };
  const handles = new Set(), stateNames = [], exposed = new Set();
  for (const st of top) { if (!st.isVariableDeclaration() || st.node.declarations.length !== 1) continue; const d = st.node.declarations[0]; if (d.id.type === 'Identifier' && d.init && d.init.type === 'MemberExpression' && rootWin(d.init) && /^_/.test(d.id.name)) handles.add(d.id.name); }
  for (const st of top) if (st.isVariableDeclaration()) for (const d of st.node.declarations) {
    if (d.id.type !== 'Identifier' || handles.has(d.id.name)) continue;
    if (st.node.declarations.length === 1 && d.init && d.init.type === 'MemberExpression' && !d.init.computed && d.init.object.type === 'Identifier' && handles.has(d.init.object.name)) continue; // 키트 가져오기
    if (!stateNames.includes(d.id.name)) stateNames.push(d.id.name);
  }
  for (const st of top) { const x = st.isExpressionStatement() && st.node.expression; if (x && x.type === 'CallExpression' && x.callee.type === 'MemberExpression' && x.callee.property.name === 'expose' && x.arguments[1] && x.arguments[1].type === 'ObjectExpression') for (const p of x.arguments[1].properties) if (p.type === 'ObjectMethod' && p.key.type === 'Identifier' && stateNames.includes(p.key.name)) exposed.add(p.key.name); }
  const candidates = stateNames.filter(n => exposed.has(n)), notExposed = stateNames.filter(n => !exposed.has(n));
  // 하나씩 돌려 옮길 수 있는 이름과 멈춘 사유를 가른다(생성기 판단 그대로)
  const dTry = makeDir('p1-try', REAL_HTML), movable = [], stopped = [];
  for (const n of candidates) {
    fs.writeFileSync(path.join(dTry, 'index.html'), REAL_HTML, 'utf8');
    const r = runGen(dTry, cfgState({ names: [n] }));
    if (r.status === 0) movable.push(n); else stopped.push({ name: n, reason: (r.err || '').replace(/\r$/, '') });
  }
  const dAll = makeDir('p1-all', REAL_HTML);
  const all = movable.length ? runGen(dAll, cfgState({ names: movable })) : { status: null, err: '옮길 수 있는 이름 0' };
  const after = all.status === 0 ? read(dAll) : null;
  let reparse = null;
  if (after) { try { const al = after.split('\n').map(l => l.replace(/\r$/, '')); let s2 = -1, e2 = -1; for (let i = 0; i < al.length; i++) if (al[i].trim() === '<script>' && (al[i + 1] || '').trim() === '(function(){') { s2 = i + 1; break; } for (let i = s2; i < al.length; i++) if (al[i].startsWith('</script>')) { e2 = i; break; } parser.parse(al.slice(s2, e2).join('\n'), { sourceType: 'script' }); reparse = 'ok'; } catch (e3) { reparse = 'fail: ' + e3.message; } }
  const linesOf = t => t.split('\n').length;
  record('P1', '실제 index.html: 통로에 노출된 상태 이름 ' + candidates.length + '개 중 지금 옮길 수 있는 ' + movable.length + '개를 한 번에 돌려 성공하고 결과가 다시 파싱된다(생성기 사후 토큰 대조 통과)',
    candidates.length > 0 && movable.length > 0 && all.status === 0 && reparse === 'ok' && all.meta.names.length === movable.length,
    { pin: PIN_FULL, stateNames: stateNames.length, exposed: candidates.length, notExposed: notExposed.length, movable: movable.length, stopped: stopped.length, status: all.status, err: all.err, reparse, htmlLines: [linesOf(REAL_HTML), after ? linesOf(after) : null], deleted: all.meta && all.meta.deletedLines.length, edited: all.meta && all.meta.editedLines.length, define: all.meta && Object.values(all.meta.api).filter(v => v === 'define').length, defineVar: all.meta && Object.values(all.meta.api).filter(v => v === 'defineVar').length });

  // P2: 줄 단위 감사(생성기 구현과 다른 방법 — 정규식)
  let audit = { ok: false };
  if (after) {
    const bl = lines, al = after.split('\n').map(l => l.replace(/\r$/, ''));
    const del = new Set(all.meta.deletedLines), comma = new Set(all.meta.commaFixedLines), edited = new Set(all.meta.editedLines), api = all.meta.api;
    const names = new Set(movable), kinds = {}; let j = 0, same = true, bad = null;
    const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (let i = 0; i < bl.length && same; i++) {
      const l = i + 1, t = bl[i].trim();
      if (del.has(l)) {
        const m = /^get ([\w$]+)\(\)\{ return \1; \}(?:, set \1\(v\)\{ \1 = v; \})?,?$/.exec(t);
        const k = m && names.has(m[1]) ? 'accessor' : /^(window\.OurgoalAppScope\.expose\('index\.html', \{|\}\);)$/.test(t) ? 'wrapper' : 'OTHER:' + t.slice(0, 80);
        kinds[k] = (kinds[k] || 0) + 1; continue;
      }
      let want = bl[i];
      if (comma.has(l)) { want = want.replace(/,\s*$/, ''); kinds.comma = (kinds.comma || 0) + 1; }
      if (edited.has(l)) { // 바뀐 줄: `var X =` → define 머리 · 끝의 `;` → `);` · `window.X = X;` 의 오른쪽
        for (const n of names) {
          const head = new RegExp('^(\\s*)var\\s+' + esc(n) + '\\s*=');
          if (head.test(want)) { want = want.replace(head, '$1window.OurgoalAppState.' + api[n] + "('" + n + "',"); kinds.head = (kinds.head || 0) + 1; }
          const copy = new RegExp('(window\\.' + esc(n) + ' = )' + esc(n) + ';');
          if (copy.test(want)) { want = want.replace(copy, '$1window.OurgoalAppScope.scope.' + n + ';'); kinds.copy = (kinds.copy || 0) + 1; }
        }
        if (all.meta.rewritten.declarations.some(d => d.endLine === l)) { if (!/;\s*$/.test(want)) { same = false; bad = { line: l, why: '선언문 끝 줄이 ; 로 끝나지 않는다', text: want }; break; } want = want.replace(/;(\s*)$/, ');$1'); kinds.tail = (kinds.tail || 0) + 1; }
      }
      if (al[j] !== want) { same = false; bad = { line: l, got: al[j], want }; break; }
      j++;
    }
    const decls = all.meta.rewritten.declarations.length, copies = all.meta.rewritten.windowCopies.length;
    audit = { ok: same && j === al.length && Object.keys(kinds).every(k => !k.startsWith('OTHER')) && kinds.head === decls && kinds.tail === decls && (kinds.copy || 0) === copies && kinds.accessor === all.meta.removed.exposeProps.length, kinds, decls, copies, exposeProps: all.meta.removed.exposeProps.length, exposeCalls: all.meta.removed.exposeCalls.length, bad };
  }
  record('P2', '실제 index.html: 지운 줄은 대상 이름의 getter/setter(와 빈 expose 껍데기)뿐, 바뀐 줄은 선언 머리 · 선언 끝 `;` · window 복사 오른쪽뿐, 나머지 줄은 순서대로 같다(정규식 감사)', audit.ok, audit);

  // P3: 계획 파일
  const plan = {
    schema: 'ourgoal.unstate-plan/1', type: '작업자 측정, 판정 아님',
    basis: { pin: PIN_FULL, generator: 'docs/design/harness/module-split/gen-inline-hard.js mode:"unstate" (#TASK-ES-634)', note: '저장소 밖 사본에서 돌린 결과다. 이름으로 지정하므로 main 이 움직여도 쓸 수 있지만, 그때는 이 하네스를 다시 돌려 대상과 줄 수를 다시 잰다. 이 PR 은 저장소 index.html 을 바꾸지 않는다.' },
    howToUse: '상태 기관(js/core/app-state.js)과 로드 줄이 병합된 뒤, 이전 PR 하나 = 설정 { task, slot:"HO", mode:"unstate", cells:[{ file:"js/core/app-state.js" }], unstate:{ names } }. 법정은 PR 하나에 생성기를 한 번 돌린다.',
    notMeasured: ['모의 적용 사본의 앱 부팅·화면 동작(기관 파일이 아직 없다 — 측정불가)', '시험이 이 이름들의 글자(get X(){ return X; } · var X = …)를 단언하는지(이전 PR 이 npm test 로 잰다)', '로그인 뒤 값 변화'],
    totals: all.status === 0 ? { stateNames: stateNames.length, exposed: candidates.length, notExposed: notExposed.length, movable: movable.length, stopped: stopped.length, define: Object.values(all.meta.api).filter(v => v === 'define').length, defineVar: Object.values(all.meta.api).filter(v => v === 'defineVar').length, deletedLines: all.meta.deletedLines.length, editedLines: all.meta.editedLines.length, exposeProps: all.meta.removed.exposeProps.length, exposeCallsRemoved: all.meta.removed.exposeCalls.length, commaFixedLines: all.meta.commaFixedLines.length, windowCopies: all.meta.rewritten.windowCopies.length, htmlLines: [linesOf(REAL_HTML), linesOf(after)] } : null,
    names: movable,
    byName: all.status === 0 ? movable.map(n => ({ name: n, api: all.meta.api[n], declLine: (all.meta.rewritten.declarations.find(d => d.name === n) || {}).line, declEndLine: (all.meta.rewritten.declarations.find(d => d.name === n) || {}).endLine, exposeLines: all.meta.removed.exposeProps.filter(p => p.name === n).map(p => p.line), windowCopyLines: all.meta.rewritten.windowCopies.filter(c => c.name === n).map(c => c.line) })) : [],
    stopped, notExposed
  };
  let planOk = all.status === 0;
  if (PLAN_OUT) { fs.mkdirSync(path.dirname(path.resolve(PLAN_OUT)), { recursive: true }); fs.writeFileSync(PLAN_OUT, JSON.stringify(plan, null, 1) + '\n', 'utf8'); }
  record('P3', '계획 파일: 대상 이름 ' + movable.length + '개 · 이름별 API · 멈춘 이름 ' + stopped.length + '개와 사유 · 예상 줄 변화(모의 적용 사본의 앱 부팅은 기관이 없어 측정불가)', planOk && plan.byName.length === movable.length && stopped.every(x => x.reason), { written: PLAN_OUT || null, totals: plan.totals, stopped });
}

const out = { tool: 'docs/design/harness/module-split/unstate-check-634.js', type: '작업자 측정, 판정 아님', generator: 'docs/design/harness/module-split/gen-inline-hard.js', baseGenerator: PIN_FULL + ':docs/design/harness/module-split/gen-inline-hard.js', realIndexHtml: PIN_FULL + ':index.html', app: APP, measuredAt: new Date().toISOString(), tmp: tmpRoot, results, passed: results.filter(r => r.ok).length, total: results.length, ok: results.every(r => r.ok) };
if (OUT) { fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8'); }
console.log('unstate-check-634', out.passed + '/' + out.total, out.ok ? 'ok' : 'FAIL');
try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ }
process.exit(out.ok ? 0 : 1);
