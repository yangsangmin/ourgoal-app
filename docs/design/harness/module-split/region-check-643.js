'use strict';
// 생성기 「연속 구역 감싸기 모드」(gen-inline-hard.js mode:"region", #TASK-ES-643) 단위 시험 — docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5절 닫힌 목록 X7. 작업자 측정, 판정 아님.
// 저장소 밖 임시 폴더에서 생성기를 자식 프로세스로 돌리고(법정 recomputeSplit 과 같은 호출 꼴) 결과를 바이트 단위로 맞댄다. 저장소의 index.html 은 건드리지 않는다.
//  B    상태 이전 시험 34건(unstate-check-634.js — 그 안에서 unwire 확장 16건, 또 그 안에서 B1 8건이 다시 돈다)이 그대로 통과: unstate · unwire · 옮기기 경로 바이트 무변화.
//  D0   생성기 diff 가 한 자리에 끼워 넣은 줄뿐이다(기준 생성기 = PIN 커밋. 기준의 줄은 하나도 바뀌지 않았다).
//  G1   옮기기 경로(감싸기 포함): #911(#TASK-ES-638)의 기준 트리에 고친 생성기를 그 설정으로 돌린 결과가 병합된 index.html · 세포 4개와 바이트 동일.
//  U1   unstate · unwire 설정을 고친 생성기와 기준 생성기(PIN)에 돌린 결과·메타·출력이 같다.
//  M1   M1a~M1e 한 번에(묶음 하나 전체): 호출문·if·try·식 문(3줄 이하) · define 줄 · 지역 var · window 복사 줄 · 주석·빈 줄 — index.html 과 세포 파일을 글자 단위로 기대값과 맞댄다.
//  M1a~M1e 줄 종류 각각 · M2 묶음 일부(from·to 닻, 구획 주석 남음, 블록 속 var 지역화) · M3 여러 묶음(groupTo, 빈 묶음 포함) · M4 세포 둘·구역 셋(가져오기 순서, 밖의 var 는 통로 getter)
//  M6   덮어쓰는 키트는 afterTag · M7 headerPick · M8 줄 끝(CRLF 입력) · M9 같은 입력 = 같은 출력
//  V1   실행 등가: 진짜 js/core/app-scope.js · js/core/app-state.js 를 vm 에 올려 감싸기 전·후 꾸러미를 실행한 기록(호출 순서 · 인자 · 통로 값 · window 값 · 누름 뒤 상태)이 같다.
//  Z*   정지 조건 각각 — 멈추고 index.html 을 쓰지 않고 세포 파일을 만들지 않는다.
//  P1   실제 index.html(PIN 커밋): 구역 계획(reports/TASK-ES-643/region-plan.json 의 설정)을 저장소 밖 사본에 돌린다 — 성공하고 다시 파싱된다.
//  P2   실제 index.html: 결과를 줄 단위로 맞대 — 바뀐 것은 구역 줄 → 부르는 한 줄 · 머리 이음매 자리의 끼운 줄 · script 태그 한 줄뿐, 나머지 줄은 순서대로 같다.
//  P3   실제 index.html: 구역 함수 본문의 줄에서 `L.` 접두만 걷어 내면 이전 전 구역의 줄과 같다(문 순서 = 이전 전 줄 순서) · 세포 파일 800줄 이하 · 돈 근처·결심 대기 줄은 글자 그대로 제자리.
// (모의 적용 사본의 앱 부팅 · 대조 탐침 · npm test 는 이 파일이 아니라 reports/TASK-ES-643/region-mock.cjs 가 잰다.)
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node region-check-643.js <APP_DIR(작업 트리)> <out.json>
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), vm = require('vm');
const [APP_ARG, OUT] = process.argv.slice(2);
const APP = path.resolve(APP_ARG);
const HARNESS = path.join(APP, 'docs', 'design', 'harness', 'module-split');
const GEN = path.join(HARNESS, 'gen-inline-hard.js');
const PIN = 'e5f34779'; // 기준 커밋(#913 감싸기 이전 2차 · #916 지도 갱신 병합) — 기준 생성기와 실제 index.html·js/** 를 여기서 읽는다(main 이 움직여도 같은 입력)
const W911 = 'b76c29e95e6b74f97156dee4178bd737ef3ec2b9'; // #911(#TASK-ES-638 감싸기 이전 1차) 병합 커밋 — 첫 부모가 그 PR 의 기준 트리
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'region-643-'));
const results = [];
const env = { ...process.env, MODULE_SPLIT_OUT: tmpRoot };
const META = path.join(tmpRoot, 'gen-inline-hard-meta.json');
const T = 'TASK-643-UNIT';
const writeBytes = (file, buf) => fs.writeFileSync(file, buf, { encoding: 'utf8' }); // Buffer 는 인코딩 인자와 무관하게 바이트 그대로 쓰인다

function blobBuf(spec) { const r = cp.spawnSync('git', ['-C', APP, 'cat-file', '-p', spec], { encoding: 'buffer', maxBuffer: 1024 * 1024 * 64 }); if (r.status !== 0) throw new Error('git cat-file 실패: ' + spec); return r.stdout; }
const blob = spec => blobBuf(spec).toString('utf8'); // 원시 blob(줄 끝 변환 없음)
const PIN_FULL = cp.spawnSync('git', ['-C', APP, 'rev-parse', PIN + '^{commit}'], { encoding: 'utf8' }).stdout.trim();
const BASE_GEN = path.join(tmpRoot, 'gen-base.js');
fs.writeFileSync(BASE_GEN, blob(PIN_FULL + ':docs/design/harness/module-split/gen-inline-hard.js'), 'utf8');
const REAL_SCOPE = blob(PIN_FULL + ':js/core/app-scope.js'), REAL_STATE = blob(PIN_FULL + ':js/core/app-state.js');

function runGen(dir, cfg, gen) {
  const cfgFile = path.join(tmpRoot, 'cfg-' + Math.random().toString(16).slice(2) + '.json');
  fs.writeFileSync(cfgFile, JSON.stringify(cfg), 'utf8');
  try { fs.unlinkSync(META); } catch (_) { /* 없으면 그만 */ }
  const r = cp.spawnSync(process.execPath, [gen || GEN, dir, cfgFile], { encoding: 'utf8', env, maxBuffer: 1024 * 1024 * 64 });
  const meta = r.status === 0 && fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : null;
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, meta, err: r.status === 0 ? null : ((r.stderr || '').split('\n').find(l => /Error/.test(l)) || '').replace(/^Error: /, '') };
}
function record(id, title, ok, detail) { results.push({ id, title, ok: !!ok, detail }); console.log((ok ? 'ok  ' : 'FAIL'), id, title, ok ? '' : JSON.stringify(detail).slice(0, 900)); }
function firstDiff(a, b) { const al = a.split('\n'), bl = b.split('\n'); for (let i = 0; i < Math.max(al.length, bl.length); i++) if (al[i] !== bl[i]) return { line: i + 1, got: al[i], want: bl[i] }; return null; }
function listFiles(d, rel) { const o = []; for (const e of fs.readdirSync(path.join(d, rel || ''), { withFileTypes: true })) { const r = (rel ? rel + '/' : '') + e.name; if (e.isDirectory()) o.push(...listFiles(d, r)); else o.push(r); } return o.sort(); }

// ── 꾸러미(fixture)
const HEAD = ['<!doctype html>', '<html><head><title>fixture</title></head><body>',
  '<script src="js/core/app-scope.js"></script><script src="js/core/app-state.js"></script><script src="js/a/index.js"></script><script src="js/b/index.js"></script><script src="js/c/index.js"></script>',
  '<script>', '(function(){', '  "use strict";'];
const TAIL = ['})();', '</script>', '</body></html>', ''];
const doc = body => HEAD.concat(body, TAIL).join('\n');
const LN = i => i + HEAD.length + 1; // BODY 색인 → index.html 줄 번호
const JS = {
  'js/core/app-scope.js': REAL_SCOPE, 'js/core/app-state.js': REAL_STATE,
  'js/a/index.js': "(function(){ window.OurgoalAKit = window.OurgoalAKit || {}; window.OurgoalAKit.alpha = function(x){ log('alpha', x); }; window.OurgoalAKit.beta = 7; })();\n",
  'js/b/index.js': "(function(){ window.OurgoalBKit = window.OurgoalBKit || {}; })();\n",
  'js/c/index.js': "(function(){ window.OurgoalCKit = { c: 1 }; })();\n",
};
function makeDir(name, text, extra) {
  const d = path.join(tmpRoot, name); fs.mkdirSync(d, { recursive: true });
  for (const [f, t] of Object.entries(Object.assign({}, JS, extra || {}))) { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), t, 'utf8'); }
  fs.writeFileSync(path.join(d, 'index.html'), text, 'utf8'); return d;
}
const read = (d, f) => fs.readFileSync(path.join(d, f || 'index.html'), 'utf8');
const cellA = (regions, more) => Object.assign({ key: 'bootA', file: 'js/a/boot-a.js', kit: 'OurgoalAKit', kitVar: '_aKit', beforeTag: '<script src="js/a/index.js"></script>', title: 'Fixture Boot A', desc: ['꾸러미 구역 함수.'], regions }, more || {});
const cfgR = (cells, more) => Object.assign({ task: T, slot: 'HO', mode: 'region', label: '단위 시험', cells }, more || {});
const BODY = [
  '',                                                                                           // 0
  '  /* ============ 머리 이음매 ============ */',                                              // 1
  '  var _aKit = window.OurgoalAKit;',                                                          // 2
  '  var alpha = _aKit.alpha;',                                                                 // 3
  '  /* [어려움 이음매 자리 H1] */',                                                            // 4
  '  /* [어려움 이음매 자리 HO 기관] */',                                                       // 5
  "  window.OurgoalAppScope.expose('index.html', {",                                            // 6
  '    get counter(){ return counter; }, set counter(v){ counter = v; },',                      // 7
  '    get shown(){ return shown; }',                                                           // 8
  '  });',                                                                                      // 9
  '',                                                                                           // 10
  '  /* ============ 상태 ============ */',                                                     // 11
  '  var counter = 0;',                                                                         // 12
  '  var shown = false;',                                                                       // 13
  '  function helper(x){ log("helper", x); return x + 1; }',                                    // 14
  '',                                                                                           // 15
  '  /* ============ 시동 A ============ */',                                                   // 16
  '  // 줄 주석 — 따라간다',                                                                    // 17
  "  window.OurgoalAppState.define('btnA', document.getElementById('a'));",                     // 18
  "  var localBtn = document.getElementById('b');",                                             // 19
  '  if(localBtn) localBtn.addEventListener("click", function(){ counter = helper(counter); });', // 20
  '  alpha(1);',                                                                                // 21
  '  try { helper(2); } catch(e){ log("caught", String(e)); }',                                 // 22
  '',                                                                                           // 23
  '  /* 사이 주석 — 따라간다 */',                                                               // 24
  '  window.flag = { counter: counter, shown };',                                               // 25
  '  window.helper = helper;',                                                                  // 26
  "  if(typeof window !== 'undefined'){ window.alphaAlias = alpha; }",                          // 27
  '  /* 뒤 주석 — 남는다 */',                                                                   // 28
  '',                                                                                           // 29
  '  /* ============ 시동 B ============ */',                                                   // 30
  '  log("b1");',                                                                               // 31
  '  var keep = 5;',                                                                            // 32
  '  log("b2", keep);',                                                                         // 33
  '  if(counter > -1){',                                                                        // 34
  '    var deep = counter;',                                                                    // 35
  '    log("deep", deep);',                                                                     // 36
  '  }',                                                                                        // 37
  '  counter += 1;',                                                                            // 38
  '',                                                                                           // 39
  '  /* ============ 꼬리 ============ */',                                                     // 40
  '  log("tail", keep, counter);',                                                              // 41
];
const cellHead = (c, pieces) => ['/**', ' * ' + c.title, ' *', ...c.desc.map(d => ' * ' + d),
  ' * #' + T + '(단위 시험): index.html 인라인 IIFE 의 연속 구역(이전 전 ' + pieces + '줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js mode:"region")로 글자 그대로 옮겼다.',
  ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 구역 안에서만 쓰던 var 는 그 함수의 지역 변수가 됐다.',
  ' * 로드 중 바로 돌던 문들은 순서 그대로 함수 하나로 감싸 index.html 원래 자리에서 부른다. index.html 은 IIFE 머리에서 그 함수를 같은 이름으로 가져온다.',
  ' * 설계: docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5절 · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md',
  ' */', '(function(global) {', "  'use strict';",
  '  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.',
  '  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};',
  '  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다',
  '  var K = global.' + c.kit + ' = global.' + c.kit + ' || {};', ''];
const cellTail = names => ['', ...names.map(n => '  K.' + n + ' = ' + n + ';'), '', "  if (typeof module !== 'undefined' && module.exports) {", '    module.exports = K;', '  }', "})(typeof window !== 'undefined' ? window : globalThis);", ''];
const fnOpen = (n, a, b) => ['  /* ---- 이전 전 index.html ' + a + '~' + b + '줄(#' + T + ' 생성기 표지) ---- */', '  function ' + n + '() { /* [#' + T + '] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */'];
const fnClose = n => '  } /* ' + n + ' */';
const callLine = (n, count, file) => '  ' + n + '(); /* [#' + T + '] 로드 중 구역(주석·빈 줄 포함 ' + count + '줄) → ' + file + ' 의 ' + n + ' 로 옮김 — 원래 자리에서 부른다 */';
const headLine = (files, n) => '  /* [#' + T + '] ' + files.join(' · ') + ' — 구역 함수 가져오기 ' + n + '개 · 통로 노출은 스코프 분석으로 뽑았다 */';

// ── vm 실행기: script 태그 순서대로(파일 → 인라인) 돌리고 기록을 낸다
function runVm(dir) {
  const html = read(dir).replace(/\r\n/g, '\n'), logs = [], els = {};
  const el = id => (els[id] = els[id] || { id, handlers: {}, addEventListener(ev, fn) { (this.handlers[ev] = this.handlers[ev] || []).push(fn); } });
  const win = { console: { warn() {}, log() {} }, document: { getElementById: el } };
  win.window = win; win.globalThis = win; win.log = function () { logs.push(Array.prototype.slice.call(arguments).map(String).join('|')); };
  const ctx = vm.createContext(win);
  const m = /<script>\n([\s\S]*?)\n<\/script>/.exec(html);
  const order = []; const re = /<script src="([^"]+)"><\/script>/g; let x; const headPart = html.slice(0, m.index);
  while ((x = re.exec(headPart))) order.push(x[1]);
  let error = null;
  try { for (const f of order) vm.runInContext(read(dir, f), ctx, { filename: f }); vm.runInContext(m[1], ctx, { filename: 'inline' }); }
  catch (e) { error = String(e && e.message || e); }
  const S = win.OurgoalAppScope && win.OurgoalAppScope.scope, snap = () => ({ counter: S && S.counter, shown: S && S.shown, btnA: S && S.btnA && S.btnA.id, flag: JSON.stringify(win.flag), helperSame: S ? win.helper === S.helper : null, aliasSame: win.alphaAlias === (win.OurgoalAKit && win.OurgoalAKit.alpha) });
  const before = error ? null : snap();
  let clicked = 0; if (!error) for (const id of Object.keys(els).sort()) for (const fn of (els[id].handlers.click || [])) { fn({}); clicked++; }
  return { error, order, logs, before, after: error ? null : snap(), clicked, handlers: Object.keys(els).sort().map(id => id + ':' + Object.keys(els[id].handlers).map(k => k + '=' + els[id].handlers[k].length).join(',')) };
}
// 감싸기 전 꾸러미는 통로에 helper getter 가 없어 helperSame 을 잴 수 없다(감싼 뒤에만 생긴다) — 그 칸과 태그 순서는 빼고 맞댄다
const sameRun = (a, b) => { const strip = r => JSON.stringify(Object.assign({}, r, { order: null, before: Object.assign({}, r.before, { helperSame: null }), after: Object.assign({}, r.after, { helperSame: null }) })); return strip(a) === strip(b); };

// ── B: 634 시험(그 안에서 619 16건, 또 그 안에서 B1 8건)
{
  const out = path.join(tmpRoot, 'unstate634.json');
  const r = cp.spawnSync(process.execPath, [path.join(HARNESS, 'unstate-check-634.js'), APP, out, path.join(tmpRoot, 'unstate634-plan.json')], { encoding: 'utf8', env: process.env, maxBuffer: 1024 * 1024 * 64 });
  const j = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
  const b = j && (j.results.find(x => x.id === 'B') || {}).detail;
  record('B', '상태 이전 시험 34건(#TASK-ES-634 — unwire 확장 16건 · B1 8건 재실행 포함)이 고친 생성기에서 그대로 통과', r.status === 0 && j && j.ok && j.total === 34 && j.passed === 34 && b && b.passed === 16 && /^8\//.test(String(b.b1)),
    { status: r.status, passed: j && j.passed, total: j && j.total, ext619: b && (b.passed + '/' + b.total), b1: b && b.b1, failed: j && j.results.filter(x => !x.ok).map(x => x.id), stderr: (r.stderr || '').slice(0, 300) });
}
// ── D0: 생성기 diff = 한 자리에 끼워 넣은 줄뿐
{
  const base = fs.readFileSync(BASE_GEN, 'utf8').replace(/\r\n/g, '\n').split('\n'), now = fs.readFileSync(GEN, 'utf8').replace(/\r\n/g, '\n').split('\n');
  let a = 0; while (a < base.length && base[a] === now[a]) a++;
  let z = 0; while (z < base.length - a && base[base.length - 1 - z] === now[now.length - 1 - z]) z++;
  const inserted = now.length - base.length;
  record('D0', '생성기 diff 는 한 자리에 끼워 넣은 줄뿐이다(기준 생성기의 줄은 하나도 바뀌지 않았다)', inserted > 0 && a + z === base.length && /^\/\/ ── \[#TASK-ES-643 /.test(now[a]) && now.slice(a, a + inserted).some(l => l === "if (CFG.mode === 'region') { runRegion(); return; }"),
    { pin: PIN_FULL, baseLines: base.length, nowLines: now.length, inserted, commonHead: a, commonTail: z, firstInserted: (now[a] || '').slice(0, 60) });
}
// ── G1: 옮기기 경로(감싸기) — #911 재생성 바이트 동일
{
  const base = path.join(tmpRoot, 'g1-base'); fs.mkdirSync(base);
  const ar = cp.spawnSync('git', ['-c', 'core.autocrlf=false', '-C', APP, 'archive', '--format=tar', W911 + '^1'], { encoding: 'buffer', maxBuffer: 1024 * 1024 * 512 });
  let ok = ar.status === 0; const detail = { archiveStatus: ar.status };
  if (ok) {
    writeBytes(path.join(tmpRoot, 'g1.tar'), ar.stdout);
    const tx = cp.spawnSync('tar', ['-xf', 'g1.tar', '-C', 'g1-base'], { cwd: tmpRoot, encoding: 'utf8' }); ok = tx.status === 0; detail.tarStatus = tx.status;
    if (ok) writeBytes(path.join(base, 'index.html'), blobBuf(W911 + '^1:index.html')); // 원시 blob(LF) — 법정 clone 과 같은 입력
  }
  if (ok) {
    const cfg = JSON.parse(blob(W911 + ':reports/TASK-ES-638/proof.json'));
    const r = runGen(base, cfg); detail.genStatus = r.status; detail.stdout = (r.stdout || '').split('\n')[0]; detail.stderr = (r.stderr || '').slice(0, 200); ok = r.status === 0;
    if (ok) { detail.files = {}; for (const f of ['index.html', ...cfg.cells.map(c => c.file)]) { const gen = fs.readFileSync(path.join(base, f)), head = blobBuf(W911 + ':' + f); const same = Buffer.compare(gen, head) === 0; detail.files[f] = { same, bytes: gen.length }; if (!same) ok = false; } }
  }
  record('G1', '고친 생성기가 #911(감싸기 이전 1차)의 기준 트리에서 같은 설정으로 index.html·세포 4개를 바이트 그대로 다시 만든다(옮기기·감싸기 경로 무변화)', ok, detail);
}
// ── U1: unstate · unwire 설정 — 기준 생성기와 같은 결과
{
  const body = BODY.slice();
  const cfgs = { unstate: { task: T, slot: 'HO', mode: 'unstate', cells: [{ file: 'js/core/app-state.js' }], unstate: { names: ['shown'] } },
    unwire: { task: T, slot: 'HO', mode: 'unwire', cells: [{ file: 'js/core/cell-registry.js' }], unwire: { kitVar: '_aKit', names: ['alpha'], imports: false } } };
  // shown 은 맨이름 참조(25줄)가 있어 unstate 가 멈춘다 — 멈춤도 같아야 한다. alpha 는 window 줄이 다른 이름(alphaAlias)이라 unwire 도 멈춘다.
  const detail = {}; let ok = true;
  for (const k of Object.keys(cfgs)) {
    const d1 = makeDir('u1-' + k + '-new', doc(body)), d2 = makeDir('u1-' + k + '-base', doc(body));
    const r1 = runGen(d1, cfgs[k]), m1 = r1.meta, r2 = runGen(d2, cfgs[k], BASE_GEN);
    const same = r1.status === r2.status && read(d1) === read(d2) && r1.stdout === r2.stdout && JSON.stringify(m1) === JSON.stringify(r2.meta) && r1.err === r2.err;
    detail[k] = { status: [r1.status, r2.status], same, err: r1.err && r1.err.slice(0, 80) }; if (!same) ok = false;
  }
  // 성공하는 꼴도 하나씩: counter 는 맨이름 참조가 많아 못 쓰니, 참조 없는 상태 이름 꾸러미를 따로 만든다
  const body2 = BODY.slice(0, 6).concat(["  window.OurgoalAppScope.expose('index.html', {", '    get lone(){ return lone; }, set lone(v){ lone = v; },', '    get alpha(){ return alpha; }', '  });', '', '  /* ============ 상태 ============ */', '  var lone = 3;', '  window.alpha = alpha;']);
  const ok2cfg = { unstate: { task: T, slot: 'HO', mode: 'unstate', cells: [{ file: 'js/core/app-state.js' }], unstate: { names: ['lone'] } },
    unwire: { task: T, slot: 'HO', mode: 'unwire', cells: [{ file: 'js/core/cell-registry.js' }], unwire: { kitVar: '_aKit', names: ['alpha'], imports: false } } };
  for (const k of Object.keys(ok2cfg)) {
    const d1 = makeDir('u1b-' + k + '-new', doc(body2)), d2 = makeDir('u1b-' + k + '-base', doc(body2));
    const r1 = runGen(d1, ok2cfg[k]), m1 = r1.meta, r2 = runGen(d2, ok2cfg[k], BASE_GEN);
    const same = r1.status === 0 && r2.status === 0 && read(d1) === read(d2) && read(d1) !== doc(body2) && r1.stdout === r2.stdout && JSON.stringify(m1) === JSON.stringify(r2.meta);
    detail[k + 'Ok'] = { status: [r1.status, r2.status], same, err: r1.err && r1.err.slice(0, 80) }; if (!same) ok = false;
  }
  record('U1', 'unstate · unwire 설정을 고친 생성기와 기준 생성기(PIN)에 돌린 결과·메타·출력(성공하는 꼴 · 멈추는 꼴 모두)이 같다', ok, detail);
}

// ── M1: M1a~M1e 한 번에
let M1DIR = null;
{
  const d = makeDir('m1', doc(BODY)), c = cellA([{ name: 'bootA', group: '시동 A' }]), r = runGen(d, cfgR([c]));
  const a = LN(16), b = LN(27);
  const wantCell = cellHead(c, a + '~' + b).concat(fnOpen('bootA', a, b), [
    BODY[16], BODY[17], BODY[18], BODY[19],
    '  if(localBtn) localBtn.addEventListener("click", function(){ L.counter = L.helper(L.counter); });',
    '  L.alpha(1);',
    '  try { L.helper(2); } catch(e){ log("caught", String(e)); }',
    '', BODY[24],
    '  window.flag = { counter: L.counter, shown: L.shown };',
    '  window.helper = L.helper;',
    "  if(typeof window !== 'undefined'){ window.alphaAlias = L.alpha; }",
    fnClose('bootA')], cellTail(['bootA'])).join('\n');
  const head = [headLine([c.file], 1), '  var bootA = _aKit.bootA;', "  window.OurgoalAppScope.expose('index.html', {", '    get alpha(){ return alpha; },', '    get helper(){ return helper; }', '  });'];
  const wantHtml = HEAD.slice(0, 2).concat([HEAD[2].replace(c.beforeTag, '<script src="' + c.file + '"></script>' + c.beforeTag)], HEAD.slice(3), BODY.slice(0, 10), head, BODY.slice(10, 16), [callLine('bootA', 12, c.file)], BODY.slice(28), TAIL).join('\n');
  const okFiles = r.status === 0 && read(d) === wantHtml && read(d, c.file) === wantCell;
  const m = r.meta && r.meta.regions[0];
  const okMeta = !!m && JSON.stringify(m.segment) === JSON.stringify([a, b]) && m.lines === 12 && JSON.stringify(m.locals) === '["localBtn"]' && JSON.stringify(m.bridged) === '["alpha","counter","helper","shown"]' && JSON.stringify(m.headersMoved) === JSON.stringify([a]) && m.edits === 9 && JSON.stringify(r.meta.exposed) === '["alpha","helper"]' && m.statements.map(s => s.kind).join(',') === 'call,var,if,call,try,expr,expr,if';
  record('M1', 'M1a~M1e 한 번에: 묶음 전체를 구역 함수로 — index.html(부르는 한 줄 · 머리 가져오기 · 통로 getter · script 태그)과 세포 파일이 기대 글자와 같다', okFiles && okMeta, { status: r.status, err: r.err, html: r.status === 0 && firstDiff(read(d), wantHtml), cell: r.status === 0 && firstDiff(read(d, c.file), wantCell), meta: m && { segment: m.segment, locals: m.locals, bridged: m.bridged, edits: m.edits, headersMoved: m.headersMoved, kinds: m.statements.map(s => s.kind).join(','), exposed: r.meta.exposed } });
  M1DIR = r.status === 0 ? d : null;
  const cell = r.status === 0 ? read(d, c.file).split('\n') : [];
  record('M1a', '호출문 · if · try · 식 문(3줄 이하 포함 · window 리터럴 대입 포함)이 순서 그대로 본문에 있고 IIFE 이름에만 L. 접두가 붙었다(전역 log · document · String 은 그대로)', cell.includes('  L.alpha(1);') && cell.includes('  try { L.helper(2); } catch(e){ log("caught", String(e)); }') && cell.includes('  window.flag = { counter: L.counter, shown: L.shown };') && !cell.some(l => /L\.(log|document|String|window|localBtn)\b/.test(l)), {});
  record('M1b', '기관 define 줄은 글자 그대로 옮겨진다', cell.includes(BODY[18]), {});
  record('M1c', '구역 안에서만 쓰는 노출 안 된 var 는 선언·참조 모두 접두 없이 지역 변수가 되고 통로 getter 가 생기지 않는다', cell.includes(BODY[19]) && cell.some(l => l.startsWith('  if(localBtn) localBtn.addEventListener(')) && r.status === 0 && !/get localBtn\(/.test(read(d)), {});
  record('M1d', '남은 window 복사 줄은 오른쪽 이름에 L. 접두만 붙어 옮겨진다(`window.X = X;` → `window.X = L.X;` · 한 줄 if 블록 꼴 포함)', cell.includes('  window.helper = L.helper;') && cell.includes("  if(typeof window !== 'undefined'){ window.alphaAlias = L.alpha; }"), {});
  record('M1e', '구역 안 주석·빈 줄과 첫 문의 앞 주석(구획 주석 포함)은 따라가고, 마지막 문 뒤의 주석은 index.html 에 남는다', cell.includes(BODY[16]) && cell.includes(BODY[17]) && cell.includes(BODY[24]) && r.status === 0 && read(d).split('\n').includes(BODY[28]) && !read(d).split('\n').includes(BODY[16]) && !cell.includes(BODY[28]), {});
}
// ── M2: 묶음 일부(from·to) — 구획 주석 남음 · 블록 속 var 지역화 · 대입은 setter
let M2DIR = null;
{
  const d = makeDir('m2', doc(BODY)), c = cellA([{ name: 'bootB', group: '시동 B', from: 'if(counter > -1){', to: 'counter += 1;' }]), r = runGen(d, cfgR([c]));
  const a = LN(34), b = LN(38);
  const wantCell = cellHead(c, a + '~' + b).concat(fnOpen('bootB', a, b), ['  if(L.counter > -1){', '    var deep = L.counter;', '    log("deep", deep);', '  }', '  L.counter += 1;', fnClose('bootB')], cellTail(['bootB'])).join('\n');
  const wantHtml = HEAD.slice(0, 2).concat([HEAD[2].replace(c.beforeTag, '<script src="' + c.file + '"></script>' + c.beforeTag)], HEAD.slice(3), BODY.slice(0, 10), [headLine([c.file], 1), '  var bootB = _aKit.bootB;'], BODY.slice(10, 34), [callLine('bootB', 5, c.file)], BODY.slice(39), TAIL).join('\n');
  const m = r.meta && r.meta.regions[0];
  record('M2', '묶음 일부(from·to 닻): 구획 주석은 남고, 블록 속 var 는 지역 변수가 되고, 이미 setter 가 있는 이름의 대입에는 통로 줄을 더하지 않는다', r.status === 0 && read(d) === wantHtml && read(d, c.file) === wantCell && JSON.stringify(m.locals) === '["deep"]' && m.headersMoved.length === 0 && r.meta.exposed.length === 0,
    { status: r.status, err: r.err, html: r.status === 0 && firstDiff(read(d), wantHtml), cell: r.status === 0 && firstDiff(read(d, c.file), wantCell), meta: m && { locals: m.locals, headersMoved: m.headersMoved } });
  M2DIR = r.status === 0 ? d : null;
}
// ── M3: 여러 묶음(groupTo) — 안쪽 구획 주석과 빈 묶음의 구획 주석이 함께 간다
{
  const body = BODY.slice(0, 16).concat(['  /* ============ 가 ============ */', '  log("g1");', '', '  /* ============ 나 ============ */', '  log("g2");', '  window.x1 = 1;', '', '  /* ============ 빈 묶음 ============ */', '', '  /* ============ 다 ============ */', '  log("g3", counter);', '', '  /* ============ 꼬리 ============ */', '  log("tail");']);
  const d = makeDir('m3', doc(body)), c = cellA([{ name: 'bootSpan', group: '= 가 =', groupTo: '= 다 =' }]), r = runGen(d, cfgR([c]));
  const a = LN(16), b = LN(26), cell = r.status === 0 ? read(d, c.file).split('\n') : [], html = r.status === 0 ? read(d).split('\n') : [];
  const i0 = cell.indexOf(fnOpen('bootSpan', a, b)[1]);
  record('M3', '여러 묶음(groupTo): 가~다 묶음의 문과 안쪽 구획 주석 · 빈 묶음의 구획 주석이 순서 그대로 한 함수로 가고, 원래 자리에는 한 줄만 남는다', r.status === 0 && i0 > 0 && JSON.stringify(cell.slice(i0 + 1, i0 + 12)) === JSON.stringify(body.slice(16, 26).concat(['  log("g3", L.counter);'])) && html.includes(callLine('bootSpan', 11, c.file)) && !html.some(l => /= (가|나|빈 묶음|다) =/.test(l)) && html.includes('  /* ============ 꼬리 ============ */') && r.meta.regions[0].headersMoved.length === 4,
    { status: r.status, err: r.err, body: cell.slice(i0 + 1, i0 + 12), headersMoved: r.meta && r.meta.regions[0].headersMoved });
}
// ── M4: 세포 둘 · 구역 셋 — 가져오기 순서 · 밖에서 선언한 var 는 통로 getter 로 읽는다
let M4DIR = null;
{
  const d = makeDir('m4', doc(BODY));
  const c1 = cellA([{ name: 'bootA', group: '시동 A' }]);
  const c2 = { key: 'bootB', file: 'js/b/boot-b.js', kit: 'OurgoalBKit', kitVar: '_bKit', beforeTag: '<script src="js/b/index.js"></script>', title: 'Fixture Boot B', desc: ['꾸러미 구역 함수 둘.'], regions: [{ name: 'bootTail', group: '꼬리' }, { name: 'bootB', group: '시동 B', from: 'if(counter > -1){', to: 'counter += 1;' }] };
  const r = runGen(d, cfgR([c1, c2])), html = r.status === 0 ? read(d).split('\n') : [], cell2 = r.status === 0 ? read(d, c2.file).split('\n') : [];
  const head = [headLine([c1.file, c2.file], 3), '  var bootA = _aKit.bootA;', '  var _bKit = window.OurgoalBKit;', '  var bootB = _bKit.bootB;', '  var bootTail = _bKit.bootTail;', "  window.OurgoalAppScope.expose('index.html', {", '    get alpha(){ return alpha; },', '    get helper(){ return helper; },', '    get keep(){ return keep; }', '  });'];
  const hi = html.indexOf(head[0]);
  const order = ['bootA', 'bootB', 'bootTail'].map(n => html.findIndex(l => l.startsWith('  ' + n + '();')));
  record('M4', '세포 둘 · 구역 셋: 머리 가져오기(없는 손잡이는 만든다)와 통로 getter(밖에서 선언한 var keep 포함)가 기대 글자와 같고, 부르는 줄은 원래 순서 그대로이며, 세포 안 함수는 줄 순서로 놓인다',
    r.status === 0 && hi > 0 && JSON.stringify(html.slice(hi, hi + head.length)) === JSON.stringify(head) && order.every(x => x > 0) && order[0] < order[1] && order[1] < order[2] && cell2.findIndex(l => l.startsWith('  function bootB()')) < cell2.findIndex(l => l.startsWith('  function bootTail()')) && cell2.includes('  log("tail", L.keep, L.counter);') && cell2.includes('  K.bootB = bootB;') && cell2.includes('  K.bootTail = bootTail;') && html[2] === HEAD[2].replace(c1.beforeTag, '<script src="' + c1.file + '"></script>' + c1.beforeTag).replace(c2.beforeTag, '<script src="' + c2.file + '"></script>' + c2.beforeTag) && JSON.stringify(r.meta.kitVarsAdded) === JSON.stringify([{ kitVar: '_bKit', kit: 'OurgoalBKit' }]),
    { status: r.status, err: r.err, head: html.slice(hi, hi + head.length), order, tagLine: html[2] });
  M4DIR = r.status === 0 ? d : null;
}
// ── M6: 덮어쓰는 키트는 afterTag · M7 headerPick · M8 CRLF · M9 결정적
{
  const cC = { key: 'bootC', file: 'js/c/boot-c.js', kit: 'OurgoalCKit', kitVar: '_cKit', afterTag: '<script src="js/c/index.js"></script>', title: 'Fixture Boot C', desc: ['덮어쓰는 키트.'], regions: [{ name: 'bootTail', group: '꼬리' }] };
  const d = makeDir('m6', doc(BODY)), r = runGen(d, cfgR([cC]));
  record('M6', '키트를 통째로 새로 대입하는 파일이 있으면 afterTag 로 그 태그 뒤(같은 줄)에 세포 태그를 넣는다', r.status === 0 && read(d).split('\n')[2] === HEAD[2] + '<script src="js/c/boot-c.js"></script>', { status: r.status, err: r.err, tagLine: r.status === 0 && read(d).split('\n')[2] });
  const dup = BODY.slice(0, 40).concat(['  /* ============ 꼬리 ============ */', '', '  /* ============ 꼬리 ============ */', '  log("tail", keep, counter);']);
  const d7a = makeDir('m7a', doc(dup)), r7a = runGen(d7a, cfgR([cellA([{ name: 'bootTail', group: '꼬리' }])]));
  const d7b = makeDir('m7b', doc(dup)), r7b = runGen(d7b, cfgR([cellA([{ name: 'bootTail', group: '꼬리', headerPick: 'nonEmpty' }])]));
  record('M7', '같은 제목의 구획 주석이 둘이면 멈추고, headerPick:"nonEmpty" 면 문이 든 묶음 하나를 고른다(빈 묶음의 구획 주석은 남는다)', r7a.status !== 0 && /구획 주석이 2개/.test(r7a.stderr) && r7b.status === 0 && read(d7b).split('\n').filter(l => l === '  /* ============ 꼬리 ============ */').length === 1, { a: r7a.err, b: r7b.status, errB: r7b.err });
  const d8 = makeDir('m8', doc(BODY).replace(/\n/g, '\r\n')), r8 = runGen(d8, cfgR([cellA([{ name: 'bootA', group: '시동 A' }])]));
  const h8 = r8.status === 0 ? read(d8) : '';
  record('M8', 'CRLF 입력: index.html 은 CRLF 그대로, 세포 파일은 LF(옮기기 경로와 같다). 줄 내용은 LF 입력의 결과와 같다', r8.status === 0 && !/[^\r]\n/.test(h8) && M1DIR && h8.replace(/\r\n/g, '\n') === read(M1DIR) && !/\r/.test(read(d8, 'js/a/boot-a.js')) && read(d8, 'js/a/boot-a.js') === read(M1DIR, 'js/a/boot-a.js'), { status: r8.status, err: r8.err });
  const d9 = makeDir('m9', doc(BODY)), r9 = runGen(d9, cfgR([cellA([{ name: 'bootA', group: '시동 A' }])]));
  record('M9', '같은 입력·같은 설정 = 같은 출력(index.html · 세포)', r9.status === 0 && M1DIR && read(d9) === read(M1DIR) && read(d9, 'js/a/boot-a.js') === read(M1DIR, 'js/a/boot-a.js'), { status: r9.status });
}
// ── V1: 실행 등가(vm — 진짜 통로·상태 기관)
{
  const base = runVm(makeDir('v1-base', doc(BODY)));
  const runs = { M1: M1DIR && runVm(M1DIR), M2: M2DIR && runVm(M2DIR), M4: M4DIR && runVm(M4DIR) };
  const ok = !base.error && base.logs.length >= 7 && base.clicked === 1 && base.after.counter !== base.before.counter && Object.values(runs).every(r => r && !r.error && sameRun(r, base));
  record('V1', '실행 등가: 감싸기 전 꾸러미와 감싼 꾸러미 셋(M1 · M2 · M4)을 진짜 통로·상태 기관 위에서 실행한 기록 — 호출 순서·인자, 통로 값, window 값, 걸린 누름 수, 누른 뒤 상태 — 이 같다', ok,
    { base: { error: base.error, logs: base.logs, before: base.before, after: base.after, clicked: base.clicked, handlers: base.handlers }, same: Object.fromEntries(Object.entries(runs).map(([k, r]) => [k, r ? (r.error || sameRun(r, base)) : null])), orderM4: runs.M4 && runs.M4.order });
}

// ── Z: 정지 조건 — 멈추고 쓰지 않는다
const withGroup = (ls, tail) => BODY.slice(0, 16).concat(['  /* ============ 구역 X ============ */'], ls, ['', '  /* ============ 꼬리 ============ */'], tail || ['  log("tail");']);
const RX = (more) => [Object.assign({ name: 'bootX', group: '구역 X' }, more || {})];
function stops(id, title, body, cells, re, opts) {
  opts = opts || {};
  const d = makeDir(id.toLowerCase(), doc(body), opts.extra); const before = read(d), filesBefore = listFiles(d).join(',');
  const r = runGen(d, cfgR(cells, opts.cfg));
  record(id, title, r.status !== 0 && re.test(r.stderr) && read(d) === before && listFiles(d).join(',') === filesBefore, { status: r.status, err: r.err, unchanged: read(d) === before, noNewFiles: listFiles(d).join(',') === filesBefore });
}
stops('Z01', '정지: 구역 안에 함수 선언', withGroup(['  log(1);', '  function inner(){ return 1; }', '  log(2);']), [cellA(RX())], /구역 안에 함수 선언/);
stops('Z02', '정지: 구역 안에 키트 손잡이', withGroup(['  var _zKit = window.OurgoalBKit;']), [cellA(RX())], /구역 안에 키트 손잡이/);
stops('Z03', '정지: 구역 안에 키트 가져오기', withGroup(['  var beta = _aKit.beta;', '  log(beta);']), [cellA(RX())], /구역 안에 키트 가져오기/);
stops('Z04', '정지: 구역 안에 expose 문', withGroup(["  window.OurgoalAppScope.expose('index.html', { get helper(){ return helper; } });"]), [cellA(RX())], /구역 안에 expose 문/);
stops('Z05', '정지: 구역 안에 통로에 노출된 이름의 var 선언(상태 이전이 먼저)', BODY, [cellA([{ name: 'bootX', group: '상태', to: 'var shown = false;' }])], /통로에 노출된 이름의 var 선언/);
stops('Z06', '정지: 구역 안 var 를 구역 밖에서 읽는다', withGroup(['  var keepX = 5;', '  log(keepX);'], ['  log("tail", keepX);']), [cellA(RX())], /구역 밖에서 읽거나 쓴다/);
stops('Z07', '정지: 구역 안 var 를 구역 밖에서 쓴다', withGroup(['  var keepX = 5;', '  log(keepX);'], ['  keepX = 9;']), [cellA(RX())], /구역 밖에서 읽거나 쓴다/);
stops('Z08', '정지: 구역 안 var 를 구역 밖의 함수가 닫아 쓴다', BODY.slice(0, 14).concat(['  function helper(x){ return x + keepX; }', ''], ['  /* ============ 구역 X ============ */', '  var keepX = 5;', '  log(helper(1));', '', '  /* ============ 꼬리 ============ */', '  log("tail");']), [cellA(RX())], /구역 밖에서 읽거나 쓴다/);
stops('Z09', '정지: 구역 안에 let 선언', withGroup(['  let a1 = 1;', '  log(a1);']), [cellA(RX())], /구역 안에 let 선언/);
stops('Z10', '정지: 구역 안에 const 선언', withGroup(['  const a1 = 1;', '  log(a1);']), [cellA(RX())], /구역 안에 const 선언/);
stops('Z11', '정지: 닫힌 목록 밖의 문 종류(for)', withGroup(['  for(var i = 0; i < 1; i++){ log(i); }']), [cellA(RX())], /구역에 넣을 수 없는 문 종류: ForStatement/);
stops('Z12', '정지: 닫힌 목록 밖의 문 종류(블록)', withGroup(['  { log(1); }']), [cellA(RX())], /구역에 넣을 수 없는 문 종류: BlockStatement/);
stops('Z13', '정지: 최상위 this', withGroup(['  log(this);']), [cellA(RX())], /최상위에 this\/arguments/);
stops('Z14', '정지: 최상위 arguments', withGroup(['  log(arguments.length);']), [cellA(RX())], /최상위에 this\/arguments/);
stops('Z15', '정지: 최상위 return', withGroup(['  if(counter > 5) return;', '  log(1);']), [cellA(RX())], /최상위에 return/);
stops('Z16', '정지: 줄 중간에서 시작하는 구역(앞 문과 한 줄)', withGroup(['  log(1); log(2);', '  log(3);']), [cellA(RX({ from: 'log(2);' }))], /줄 중간에서 시작한다/);
stops('Z17', '정지: 줄 중간에서 끝나는 구역(뒤 문과 한 줄)', withGroup(['  log(1); log(2);', '  log(3);']), [cellA(RX({ to: 'log(1);' }))], /줄 중간에서 끝난다/);
stops('Z18', '정지: 구역 경계에 걸친 주석', withGroup(['  log(1); /* 걸친', '     주석 */', '  log(2);']), [cellA(RX({ from: 'log(2);' }))], /경계에 주석이 걸쳐 있다/);
stops('Z19', '정지: 머리 이음매 자리보다 앞에 있는 구역', BODY.slice(0, 2).concat(['  log("early");'], BODY.slice(2)), [cellA([{ name: 'bootX', group: '머리 이음매', to: 'log("early");' }])], /머리 이음매 자리보다 앞에 있다/);
stops('Z20', '정지: 구역 함수 이름이 이미 IIFE 이름이다', withGroup(['  log(1);']), [cellA([{ name: 'helper', group: '구역 X' }])], /구역 함수 이름이 이미 있다/);
stops('Z21', '정지: 구역 함수 이름이 IIFE 안에서 쓰는 전역 이름이다(가져오기 줄이 그 전역을 가린다)', withGroup(['  log(1);']), [cellA([{ name: 'log', group: '구역 X' }])], /구역 함수 이름이 이미 있다/);
stops('Z22', '정지: 세포 파일이 이미 있다(덮어쓰지 않는다)', withGroup(['  log(1);']), [cellA(RX())], /세포 파일이 이미 있다/, { extra: { 'js/a/boot-a.js': '// 이미 있는 파일\n' } });
stops('Z23', '정지: 저장소 js/** 어디에도 없는 키트(새 전역을 만들지 않는다)', withGroup(['  log(1);']), [cellA(RX(), { kit: 'OurgoalNoSuchKit', kitVar: '_nKit' })], /어디에도 없다/);
stops('Z24', '정지: 세포 파일이 800줄을 넘는다', withGroup(Array.from({ length: 790 }, (_, i) => '  log(' + i + ');')), [cellA(RX())], /800줄을 넘는다/);
stops('Z25', '정지: 돈 근처(OurgoalTemplateCredit) — 구역에 넣지 않는다', withGroup(['  log(1);', "  if(window.OurgoalTemplateCredit && typeof window.OurgoalTemplateCredit.init === 'function'){ window.OurgoalTemplateCredit.init({}); }"]), [cellA(RX())], /돈 근처·결심 대기 대상/);
stops('Z26', '정지: 결심 대기(OURGOAL_CONFIG) — 구역에 넣지 않는다', withGroup(['  var OURGOAL_CONFIG = {};', "  if(typeof window !== 'undefined'){ window.OURGOAL_CONFIG = OURGOAL_CONFIG; }"]), [cellA(RX())], /돈 근처·결심 대기 대상/);
stops('Z27', '정지: 설정 맨 위의 모르는 칸', withGroup(['  log(1);']), [cellA(RX())], /region 설정에 모르는 칸: unwire/, { cfg: { unwire: { kitVar: '_aKit', names: ['alpha'] } } });
stops('Z28', '정지: 세포 설정의 모르는 칸(옮기기 경로의 take)', withGroup(['  log(1);']), [cellA(RX(), { take: [{ group: '구역 X', all: true }] })], /cells 에 모르는 칸: take/);
stops('Z29', '정지: 구역 설정의 모르는 칸(줄 번호로 경계를 줄 수 없다)', withGroup(['  log(1);']), [cellA(RX({ lines: [1, 2] }))], /구역 설정에 모르는 칸: lines/);
stops('Z30', '정지: 구획 주석 제목이 없다', withGroup(['  log(1);']), [cellA([{ name: 'bootX', group: '없는 제목' }])], /구획 주석이 0개/);
stops('Z31', '정지: from 닻에 맞는 문이 둘', withGroup(['  log(1);', '  log(1);', '  log(3);']), [cellA(RX({ from: 'log(1);' }))], /닻에 맞는 문이 2개/);
stops('Z32', '정지: to 닻에 맞는 문이 없다', withGroup(['  log(1);']), [cellA(RX({ to: 'log(9);' }))], /닻에 맞는 문이 0개/);
stops('Z33', '정지: to 문이 from 문보다 앞', withGroup(['  log(1);', '  log(2);']), [cellA(RX({ from: 'log(2);', to: 'log(1);' }))], /to 문이 from 문보다 앞/);
stops('Z34', '정지: 서로 겹치는 구역', withGroup(['  log(1);', '  log(2);']), [cellA([{ name: 'bootX', group: '구역 X' }, { name: 'bootY', group: '구역 X', from: 'log(2);' }])], /구역이 서로 겹친다/);
stops('Z35', '정지: 구역이 묶음 중간에서 끝난다(안쪽 구획 주석의 묶음에 문이 남는다)', BODY, [cellA([{ name: 'bootX', group: '시동 A', groupTo: '시동 B', to: 'log("b1");' }])], /묶음 중간에서 끝난다/);
stops('Z36', '정지: 머리 이음매 자리 표지가 없다', withGroup(['  log(1);']), [cellA(RX())], /머리 이음매 자리 표지가 없다/, { cfg: { slot: 'H9' } });
stops('Z37', '정지: 키트 변수 이름이 다른 키트에 쓰였다', withGroup(['  log(1);']), [cellA(RX(), { kit: 'OurgoalBKit' })], /키트 변수 이름이 다른 키트에 쓰였다/);
stops('Z38', '정지: 키트를 통째로 새로 대입하는 파일이 있는데 beforeTag 를 썼다(유형 M)', withGroup(['  log(1);']), [cellA(RX(), { kit: 'OurgoalCKit', kitVar: '_cKit', beforeTag: '<script src="js/c/index.js"></script>' })], /통째로 새로 대입하는 파일이 있다/);
stops('Z39', '정지: 태그가 없다', withGroup(['  log(1);']), [cellA(RX(), { beforeTag: '<script src="js/none.js"></script>' })], /태그가 0개/);
stops('Z40', '정지: beforeTag · afterTag 를 둘 다 적었다', withGroup(['  log(1);']), [cellA(RX(), { afterTag: '<script src="js/a/index.js"></script>' })], /가운데 꼭 하나/);
stops('Z41', '정지: const 에 대입', BODY.slice(0, 14).concat(['  const FIXED = 1;', '  function helper(x){ return x + FIXED; }', ''], ['  /* ============ 구역 X ============ */', '  FIXED = 2;', '', '  /* ============ 꼬리 ============ */', '  log("tail");']), [cellA(RX())], /const 에 대입/);
stops('Z42', '정지: 구조 분해 var', withGroup(['  var { a1, b1 } = window.obj;', '  log(a1, b1);']), [cellA(RX())], /구조 분해/);
stops('Z43', '정지: regions 가 비었다', withGroup(['  log(1);']), [cellA([])], /regions 가 비었다/);
stops('Z44', '정지: 구역에 최상위 문이 없다(빈 묶음)', BODY.slice(0, 16).concat(['  /* ============ 구역 X ============ */', '', '  /* ============ 꼬리 ============ */', '  log("tail");']), [cellA(RX())], /구획 주석이 0개|구역에 최상위 문이 없다/);
stops('Z45', '정지: 세포 파일 경로가 js/ 아래가 아니다', withGroup(['  log(1);']), [cellA(RX(), { file: 'court/boot.js' })], /js\/ 아래 경로가 아니거나/);
{ // 원자성: 세포 둘 가운데 둘째 구역이 멈추면 첫째도 쓰지 않는다
  const body = withGroup(['  log(1);', '  function inner(){ return 1; }']);
  const d = makeDir('z46', doc(body)), before = read(d), files = listFiles(d).join(',');
  const c2 = { key: 'bootB', file: 'js/b/boot-b.js', kit: 'OurgoalBKit', kitVar: '_bKit', beforeTag: '<script src="js/b/index.js"></script>', title: 'B', desc: ['b'], regions: [{ name: 'bootBad', group: '구역 X', from: 'function inner' }] };
  const r = runGen(d, cfgR([cellA([{ name: 'bootTail', group: '꼬리' }]), c2]));
  record('Z46', '정지(원자성): 구역 하나가 멈추면 다른 구역·세포도 쓰지 않는다', r.status !== 0 && /구역 안에 함수 선언/.test(r.stderr) && read(d) === before && listFiles(d).join(',') === files, { status: r.status, err: r.err });
}

// ── P1·P2·P3: 실제 index.html(PIN 커밋) + 구역 계획
{
  const planFile = path.join(APP, 'reports', 'TASK-ES-643', 'region-plan.json');
  const plan = fs.existsSync(planFile) ? JSON.parse(fs.readFileSync(planFile, 'utf8')) : null;
  const d = path.join(tmpRoot, 'p1'); fs.mkdirSync(d);
  const ar = cp.spawnSync('git', ['-c', 'core.autocrlf=false', '-C', APP, 'archive', '--format=tar', PIN_FULL, 'js'], { encoding: 'buffer', maxBuffer: 1024 * 1024 * 512 });
  let ok = !!plan && ar.status === 0; const detail = { plan: !!plan, archiveStatus: ar.status };
  if (ok) { writeBytes(path.join(tmpRoot, 'p1.tar'), ar.stdout); const tx = cp.spawnSync('tar', ['-xf', 'p1.tar', '-C', 'p1'], { cwd: tmpRoot, encoding: 'utf8' }); ok = tx.status === 0; detail.tarStatus = tx.status; }
  const before = blob(PIN_FULL + ':index.html');
  let r = null;
  if (ok) { fs.writeFileSync(path.join(d, 'index.html'), before, 'utf8'); r = runGen(d, plan.config); ok = r.status === 0; detail.status = r.status; detail.err = r.err; detail.stdout = (r.stdout || '').split('\n')[0]; }
  const after = ok ? read(d) : '';
  const TAGN = plan ? plan.config.task : '';
  if (ok) {
    const parser = require('@babel/parser');
    const inline = t => { const m = /<script>\n(\(function\(\)\{\n[\s\S]*?)\n<\/script>/.exec(t.replace(/\r\n/g, '\n')); return m && m[1]; };
    let parsed = true; try { parser.parse(inline(after), { sourceType: 'script' }); for (const f of Object.keys(r.meta.files)) parser.parse(read(d, f), { sourceType: 'script' }); } catch (e) { parsed = false; detail.parseError = String(e.message).slice(0, 200); }
    detail.regions = r.meta.regions.length; detail.htmlLines = [r.meta.htmlLinesBefore, r.meta.htmlLinesAfter]; detail.files = r.meta.files; detail.exposed = r.meta.exposed.length; detail.planRegions = plan.totals.regions;
    ok = parsed && r.meta.regions.length === plan.totals.regions && r.meta.regions.length > 0;
  }
  record('P1', '실제 index.html(PIN): 구역 계획의 설정을 저장소 밖 사본에 돌리면 성공하고 index.html 인라인과 세포 파일이 다시 파싱된다', ok, detail);
  let ok2 = ok, ok3 = ok; const d2 = {}, d3 = {};
  if (ok) {
    const bl = before.split('\n'), al = after.split('\n'), meta = r.meta, esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // P2: 기준 줄에서 다시 만든다 — 구역 줄 → 부르는 줄, 머리 줄 끼움(메타가 적은 자리·줄 수), 태그 줄
    const segs = meta.regions.map(x => ({ a: x.segment[0], b: x.segment[1], x })).sort((p, q) => q.a - p.a);
    const rebuilt = bl.slice(); const callRe = x => new RegExp('^  ' + x.name + '\\(\\); /\\* \\[#' + esc(TAGN) + '\\] 로드 중 구역\\(주석·빈 줄 포함 ' + x.lines + '줄\\) → ' + esc(x.file) + ' 의 ' + x.name + ' 로 옮김 — 원래 자리에서 부른다 \\*/$');
    for (const s of segs) rebuilt.splice(s.a - 1, s.b - s.a + 1, null); // 자리만 비워 둔다
    const headAt = meta.head.insertAfterLine, headN = meta.head.lines;
    const headLines = al.slice(headAt, headAt + headN);
    rebuilt.splice(headAt, 0, ...headLines);
    let diff = 0, callOk = 0, tagOk = 0; const tagLines = new Set(meta.tags.map(t => t.line));
    const order = meta.regions.slice().sort((p, q) => p.segment[0] - q.segment[0]); let ci = 0;
    d2.lengths = [rebuilt.length, al.length];
    for (let i = 0; i < Math.max(rebuilt.length, al.length); i++) {
      if (rebuilt[i] === null) { if (order[ci] && callRe(order[ci]).test(al[i] || '')) callOk++; else diff++; ci++; continue; }
      if (tagLines.has(i + 1)) { let t = al[i] || ''; for (const f of meta.tags.filter(t2 => t2.line === i + 1).map(t2 => t2.file)) t = t.replace('<script src="' + f + '"></script>', ''); if (t === rebuilt[i]) tagOk++; else diff++; continue; }
      if (rebuilt[i] !== al[i]) { diff++; if (!d2.firstDiff) d2.firstDiff = { line: i + 1, got: (al[i] || '').slice(0, 120), want: (rebuilt[i] || '').slice(0, 120) }; }
    }
    const headKinds = headLines.every(l => new RegExp('^  /\\* \\[#' + esc(TAGN) + '\\] ').test(l) || /^  var [A-Za-z_$][\w$]* = _[A-Za-z]\w*\.[A-Za-z_$][\w$]*;$/.test(l) || /^  var _\w+ = window\.\w+;$/.test(l) || l === "  window.OurgoalAppScope.expose('index.html', {" || /^    get ([A-Za-z_$][\w$]*)\(\)\{ return \1; \}(, set \1\(v\)\{ \1 = v; \})?,?$/.test(l) || l === '  });');
    Object.assign(d2, { diff, callLines: callOk, regions: meta.regions.length, tagLines: tagOk, headLines: headN, headKindsOk: headKinds });
    ok2 = diff === 0 && callOk === meta.regions.length && tagOk === tagLines.size && headKinds && rebuilt.length === al.length;
    // P3: 구역 함수 본문 줄에서 L. 접두만 걷어 내면 이전 전 구역의 줄과 같다
    let bodyDiff = 0, changedLines = 0, over800 = 0; const strip = l => l.replace(/([A-Za-z_$][\w$]*): L\.\1(?![\w$])/g, '$1').replace(/(^|[^\w$.])L\.(?=[A-Za-z_$])/g, '$1');
    for (const f of Object.keys(meta.files)) {
      const cl = read(d, f).split('\n'); if (meta.files[f] > 800) over800++;
      for (const x of meta.regions.filter(y => y.file === f)) {
        const i0 = cl.findIndex(l => l.startsWith('  function ' + x.name + '() { /* [#' + TAGN + '] 로드 중 구역')), bodyL = cl.slice(i0 + 1, i0 + 1 + x.lines), orig = bl.slice(x.segment[0] - 1, x.segment[1]);
        if (i0 < 0 || cl[i0 + 1 + x.lines] !== '  } /* ' + x.name + ' */') { bodyDiff++; continue; }
        bodyL.forEach((l, k) => { if (l !== orig[k]) { changedLines++; if (strip(l) !== orig[k] && l.replace(/(^|[^\w$.])L\.(?=[A-Za-z_$])/g, '$1') !== orig[k]) { bodyDiff++; if (!d3.firstDiff) d3.firstDiff = { file: f, region: x.name, got: l.slice(0, 140), want: orig[k].slice(0, 140) }; } } });
      }
    }
    const holdRe = /OurgoalTemplateCredit\.init|OURGOAL_CONFIG/, holdBefore = bl.filter(l => holdRe.test(l)), holdAfter = al.filter(l => holdRe.test(l));
    const cellsHold = Object.keys(meta.files).some(f => /OurgoalTemplateCredit|OURGOAL_CONFIG/.test(read(d, f)));
    Object.assign(d3, { bodyDiff, linesWithPrefix: changedLines, edits: meta.edits, over800, holdLines: [holdBefore.length, holdAfter.length], holdSame: JSON.stringify(holdBefore) === JSON.stringify(holdAfter), cellsTouchHold: cellsHold, statementsAscending: meta.regions.every(x => x.statements.every((s, k) => !k || s.line >= x.statements[k - 1].endLine)) });
    ok3 = bodyDiff === 0 && over800 === 0 && d3.holdSame && holdBefore.length > 0 && !cellsHold && d3.statementsAscending;
  }
  record('P2', '실제 index.html: 바뀐 것은 구역 줄 → 부르는 한 줄 · 머리 이음매 자리의 끼운 줄(가져오기·손잡이·통로 getter 꼴뿐) · script 태그 줄뿐이고 나머지 줄은 순서대로 같다', ok2, d2);
  record('P3', '실제 index.html: 구역 함수 본문 줄에서 L. 접두만 걷어 내면 이전 전 구역의 줄과 같다(문 순서 = 이전 전 줄 순서) · 세포 800줄 이하 · 돈 근처·결심 대기 줄은 글자 그대로 제자리', ok3, d3);
}

const out = { tool: 'docs/design/harness/module-split/region-check-643.js', type: '작업자 측정, 판정 아님', generator: 'docs/design/harness/module-split/gen-inline-hard.js', baseGenerator: PIN_FULL + ':docs/design/harness/module-split/gen-inline-hard.js', measuredAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform }, total: results.length, passed: results.filter(r => r.ok).length, ok: results.every(r => r.ok), results };
if (OUT) { fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8'); }
try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ }
console.log(out.passed + '/' + out.total, out.ok ? 'ALL OK' : 'FAILED');
process.exit(out.ok ? 0 : 1);
