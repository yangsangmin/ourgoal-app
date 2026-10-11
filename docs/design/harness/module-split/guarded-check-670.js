'use strict';
// 생성기 region 모드 「잠긴 이름의 명시적 허용」(allowGuarded — #TASK-ES-670, 상민님 2026-10-11 「결심 2 : 승인」) 단위 시험. 작업자 측정, 판정 아님.
// 저장소 밖 임시 폴더에서 생성기를 자식 프로세스로 돌리고 결과를 맞댄다. 저장소의 index.html 은 건드리지 않는다.
//  B     앞선 단위 시험 전부(finalize-check-662.js → 661 → 657 → 643 → 634 → 619 → B1)를 고친 생성기로 다시 돌린다. 출력을 재는 검사는 모두 통과해야 한다.
//        실패해도 되는 것은 「생성기 파일의 diff 모양」을 옛 기준과 맞대는 검사뿐이다(L110): 662 의 D0 · 661 의 D0 · 657 의 D1 · 643 의 D0, 그리고 그 모양 조건을 겉에서 다시 보는 662 의 B · 661 의 B.
//        이 PR 은 region 구간의 줄 셋을 바꿨으므로(한 자리 끼워 넣기가 아니다) 그 여섯이 구조적으로 거짓이 된다.
//  D     생성기 diff(기준 = PIN 커밋): 기준에서 사라진 줄은 셋(모르는 칸 검사 줄 · 잠금 검사 두 줄)뿐이고, region 구간 밖(파일 머리 ~ region 들머리 앞, 「smoke-test FN_NAMES」 ~ 끝)은 글자가 같다. 검사기는 기준과 같다.
//  G650  병합된 구역 이전 PR(#933)의 기준 트리에서 고친 생성기가 같은 설정으로 index.html·세포 다섯을 바이트 그대로 다시 만들고, 표준 출력이 기준 생성기와 같다(guardedAllowed 칸 없음).
//  K1~K3 잠금 기본 동작 불변: 허용 칸이 없으면 OURGOAL_CONFIG · OurgoalTemplateCredit 가 든 구역은 예전과 같은 글자로 멈춘다(기준 생성기의 오류 글자와 같다). index.html 그대로 · 세포 파일 없음.
//  A1~A4 허용: OURGOAL_CONFIG 만 / OurgoalTemplateCredit 만 / 둘 다(구역 둘) — 옮겨지고, 메타 guardedAllowed 와 표준 출력에 이름·근거·구역·줄·접두 수가 적힌다.
//        옮긴 줄은 접두 `L.` 말고 글자가 같다(줄 단위 대조). 「잠긴 낱말을 다른 낱말로 바꾼 같은 꾸러미」를 기준 생성기로 돌린 산출과 낱말만 다르다 — 허용은 잠금만 풀고 바꿔 쓰기 규칙은 그대로다.
//  E1    실행 등가(vm, 진짜 통로 위): 이전 전 인라인과 옮긴 뒤(세포 + 인라인)에서 window.OURGOAL_CONFIG 가 같은 꼴로 한 번 달리고, 부품 init 이 같은 값(sb · getState() · toast)으로 한 번 불린다.
//  S*    정지(전부 index.html 바이트 그대로 · 세포 파일 없음): 한 이름만 허용했는데 구역에 다른 잠긴 이름이 있음 · HOLD 에 없는 이름 · 근거 글자 없음/짧음/여러 줄 · 같은 이름 둘 · 칸의 모르는 키 ·
//        빈 배열 · 배열이 아님 · 어느 구역에도 없는 이름(쓰이지 않는 허용) · 허용한 문에 줄임 속성 확장이 필요함 · 다른 모드(sweep · finalize)에 allowGuarded 칸.
//  R1~R3 실제 index.html(PIN): 허용 없이 두 곳을 구역으로 적으면 기준 생성기와 같은 글자로 멈춤 / 둘 다 허용하면 옮겨짐 — 옮긴 줄에서 접두 말고 다른 줄 0 · 돈 관련 낱말이 든 줄 수가 전후 같음 · 그 줄들은 접두 말고 그대로 /
//        하나만 허용하면 나머지 이름에서 멈춤.
// 사용: NODE_PATH=<node_modules> node guarded-check-670.js <APP_DIR(작업 트리)> <out.json> [--skip-662]
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), vm = require('vm');
const [APP_ARG, OUT] = process.argv.slice(2);
const SKIP = process.argv.includes('--skip-662');
const APP = path.resolve(APP_ARG);
const HARNESS = path.join(APP, 'docs', 'design', 'harness', 'module-split');
const GEN = path.join(HARNESS, 'gen-inline-hard.js'), VERIFY = path.join(HARNESS, 'verify-inline-hard.js');
const PIN = '5c567cd9470ba034303efa9a15eb9b3686f88ebf'; // 기준 커밋(#937 병합) — 기준 생성기와 실제 index.html·js/** 를 여기서 읽는다
const REGION_PR = { pr: 933, task: 'TASK-ES-650', commit: '0b643c58e87b742db8502dac3ca638bb5244c800' };
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'guarded-670-'));
const results = [];
const env = { ...process.env, MODULE_SPLIT_OUT: tmpRoot };
const META = path.join(tmpRoot, 'gen-inline-hard-meta.json');
const T = 'TASK-670-UNIT';
const APPROVAL = '상민님 2026-10-11 「결심 2 : 승인」 — 접두 말고는 한 글자도 바꾸지 않고 옮긴다(단위 시험용 글자)';
const writeBytes = (file, buf) => fs.writeFileSync(file, buf, { encoding: 'utf8' }); // Buffer 는 인코딩 인자와 무관하게 바이트 그대로 쓰인다
function blobBuf(spec) { const r = cp.spawnSync('git', ['-C', APP, 'cat-file', '-p', spec], { encoding: 'buffer', maxBuffer: 1024 * 1024 * 64 }); if (r.status !== 0) throw new Error('git cat-file 실패: ' + spec); return r.stdout; }
const blob = spec => blobBuf(spec).toString('utf8');
const BASE_GEN = path.join(tmpRoot, 'gen-base.js');
fs.writeFileSync(BASE_GEN, blob(PIN + ':docs/design/harness/module-split/gen-inline-hard.js'), { encoding: 'utf8' });
function runGen(dir, cfg, gen) {
  const cfgFile = path.join(tmpRoot, 'cfg-' + Math.random().toString(16).slice(2) + '.json');
  fs.writeFileSync(cfgFile, JSON.stringify(cfg), { encoding: 'utf8' });
  try { fs.unlinkSync(META); } catch (_) { /* 없으면 그만 */ }
  const r = cp.spawnSync(process.execPath, [gen || GEN, dir, cfgFile], { encoding: 'utf8', env, maxBuffer: 1024 * 1024 * 64 });
  const meta = r.status === 0 && fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : null;
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, meta, err: r.status === 0 ? null : ((r.stderr || '').split(/\r?\n/).find(l => /^(Error|TypeError): /.test(l)) || '').replace(/^Error: /, '') };
}
function record(id, title, ok, detail) { results.push({ id, title, ok: !!ok, detail }); console.log((ok ? 'ok  ' : 'FAIL'), id, title, ok ? '' : JSON.stringify(detail).slice(0, 900)); }
function extractTree(commit, name) { // 커밋의 트리를 임시 폴더에 푼다(줄 끝 변환 없음)
  const d = path.join(tmpRoot, name); fs.mkdirSync(d);
  const ar = cp.spawnSync('git', ['-c', 'core.autocrlf=false', '-C', APP, 'archive', '--format=tar', commit], { encoding: 'buffer', maxBuffer: 1024 * 1024 * 512 });
  if (ar.status !== 0) return null;
  writeBytes(path.join(tmpRoot, name + '.tar'), ar.stdout);
  const tx = cp.spawnSync('tar', ['-xf', name + '.tar', '-C', name], { cwd: tmpRoot, encoding: 'utf8' });
  if (tx.status !== 0) return null;
  writeBytes(path.join(d, 'index.html'), blobBuf(commit + ':index.html')); // 원시 blob(LF) — 법정 clone 과 같은 입력
  return d;
}
function lcsDiff(a, b) { // 줄 단위 최장 공통 부분열 — 기준에서 사라진 줄 · 새로 생긴 줄
  const n = a.length, m = b.length, w = m + 1, dp = new Uint16Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i * w + j] = a[i] === b[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
  const removed = [], added = []; let i = 0, j = 0;
  while (i < n && j < m) { if (a[i] === b[j]) { i++; j++; } else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) removed.push({ line: ++i, text: a[i - 1] }); else added.push({ line: ++j, text: b[j - 1] }); }
  while (i < n) removed.push({ line: ++i, text: a[i - 1] }); while (j < m) added.push({ line: ++j, text: b[j - 1] });
  return { removed, added };
}
const LF = s => s.replace(/\r\n/g, '\n');
const MONEY = /credit|subscription|paywall|OURGOAL_CONFIG|광고|구독|결제|크레딧|유료|가격|과금|payment|price|premium/i; // #917(reports/TASK-ES-645/tools/prefix-only-check.cjs)과 같은 낱말

// ── B: 앞선 단위 시험 전부
if (!SKIP) {
  const out = path.join(tmpRoot, 'finalize662.json');
  const r = cp.spawnSync(process.execPath, [path.join(HARNESS, 'finalize-check-662.js'), APP, out], { encoding: 'utf8', env: process.env, maxBuffer: 1024 * 1024 * 256 });
  const j = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
  const f662 = j ? j.results.filter(x => !x.ok).map(x => x.id) : null, b662 = j && ((j.results.find(x => x.id === 'B') || {}).detail || {});
  const f661 = b662 && b662.failed, i657 = b662 && b662.inner657 || {}, f657 = i657.failed, r643 = i657.region643 || {}, f643 = r643.failed, in634 = r643.innerB || {};
  const sub = (arr, allow) => Array.isArray(arr) && arr.every(x => allow.includes(x));
  record('B', '앞선 단위 시험 전부(662 45건 → 661 47건 → 657 22건 → 643 67건 → 634 34건 → 619 16건 → B1 8건)가 고친 생성기에서 생성기 diff 모양 검사 말고 모두 통과한다(모양 검사: 662 D0 · 661 D0 · 657 D1 · 643 D0, 그 조건을 겉에서 다시 보는 662 B · 661 B)',
    !!j && j.total === 45 && sub(f662, ['B', 'D0']) && b662.total === 47 && sub(f661, ['B', 'D0']) && i657.total === 22 && sub(f657, ['D1']) && r643.total === 67 && sub(f643, ['D0']) && in634.passed === 34 && in634.total === 34 && in634.ext619 === '16/16' && in634.b1 === '8/8',
    { status: r.status, finalize662: { total: j && j.total, passed: j && j.passed, failed: f662 }, sweep661: { total: b662 && b662.total, passed: b662 && b662.passed, failed: f661 }, fnArguments657: { total: i657.total, passed: i657.passed, failed: f657 }, region643: { total: r643.total, passed: r643.passed, failed: f643 }, unstate634: in634.passed + '/' + in634.total, unwireExt619: in634.ext619, unwireB1: in634.b1, stderr: (r.stderr || '').slice(0, 300) });
} else record('B', '앞선 단위 시험 재실행(--skip-662 로 건너뜀)', false, { skipped: true });

// ── D: 생성기 diff
{
  const base = LF(fs.readFileSync(BASE_GEN, 'utf8')).split('\n'), now = LF(fs.readFileSync(GEN, 'utf8')).split('\n');
  const d = lcsDiff(base, now);
  const head = ls => ls.slice(0, ls.findIndex(l => l.startsWith("if (CFG.mode === 'region')"))).join('\n'), tail = ls => ls.slice(ls.findIndex(l => l.startsWith('// smoke-test FN_NAMES'))).join('\n');
  const outsideSame = head(base) === head(now) && tail(base) === tail(now) && head(base).length > 1000 && tail(base).length > 1000;
  const verifySame = LF(blob(PIN + ':docs/design/harness/module-split/verify-inline-hard.js')) === LF(fs.readFileSync(VERIFY, 'utf8'));
  const rm = d.removed.map(x => x.text);
  record('D', '생성기 diff: 기준에서 사라진 줄은 셋(region 의 모르는 칸 검사 줄 · 잠금 검사 두 줄)뿐이고, region 구간 밖은 글자가 같다. 검사기는 기준과 같다',
    rm.length === 3 && rm.filter(t => t.includes("fail('region 설정에 모르는 칸: ' + k)")).length === 1 && rm.filter(t => /const held = toks\.find/.test(t)).length === 1 && rm.filter(t => /if \(held\) fail\('구역 '/.test(t)).length === 1 && outsideSame && verifySame && d.added.length > 0,
    { pin: PIN, baseLines: base.length, nowLines: now.length, removed: d.removed.map(x => ({ line: x.line, text: x.text.slice(0, 110) })), addedCount: d.added.length, outsideRegionSame: outsideSame, verifySame });
}

// ── G650: 병합된 구역 이전 PR 재생성 바이트 동일 · 표준 출력 동일
{
  const m = REGION_PR, detail = { pr: m.pr, commit: m.commit }; let ok = false;
  const b1 = extractTree(m.commit + '^1', 'g650-new'), b2 = extractTree(m.commit + '^1', 'g650-base');
  if (b1 && b2) {
    const cfg = JSON.parse(blob(m.commit + ':reports/' + m.task + '/proof.json'));
    const r = runGen(b1, cfg), rb = runGen(b2, cfg, BASE_GEN);
    detail.genStatus = [r.status, rb.status]; detail.err = r.err; detail.stdoutSame = r.stdout === rb.stdout; detail.stdoutFirst = (r.stdout || '').split('\n')[0].slice(0, 140); detail.guardedAllowed = r.meta && r.meta.guardedAllowed;
    ok = r.status === 0 && rb.status === 0 && r.stdout === rb.stdout && r.meta.guardedAllowed === undefined && !/guarded/.test(r.stdout);
    if (ok) { detail.files = {}; for (const f of ['index.html', ...cfg.cells.map(c => c.file)]) { const gen = fs.readFileSync(path.join(b1, f)), head = blobBuf(m.commit + ':' + f); const same = Buffer.compare(gen, head) === 0; detail.files[f] = { same, bytes: gen.length }; if (!same) ok = false; } }
  } else detail.archive = '실패';
  record('G650', '고친 생성기가 #933(TASK-ES-650, 구역 이전)의 기준 트리에서 같은 설정으로 index.html·세포 다섯을 바이트 그대로 다시 만들고 표준 출력이 기준 생성기와 같다(guardedAllowed 칸·guarded 줄 없음)', ok, detail);
}

// ── 꾸러미(fixture)
const REAL_SCOPE = blob(PIN + ':js/core/app-scope.js');
const HEAD = ['<!doctype html>', '<html><head><title>fixture</title></head><body>', '<script src="js/core/app-scope.js"></script><script src="js/a/index.js"></script>', '<script>', '(function(){', '  "use strict";'];
const TAIL = ['})();', '</script>', '</body></html>', ''];
const doc = body => HEAD.concat(body, TAIL).join('\n');
const JS = { 'js/core/app-scope.js': REAL_SCOPE, 'js/a/index.js': "(function(){ window.OurgoalAKit = window.OurgoalAKit || {}; window.OurgoalAKit.alpha = function(x){ window.__log.push('alpha:' + x); }; })();\n" };
function makeDir(name, text) {
  const d = path.join(tmpRoot, name); fs.mkdirSync(d, { recursive: true });
  for (const [f, t] of Object.entries(JS)) { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), t, { encoding: 'utf8' }); }
  fs.writeFileSync(path.join(d, 'index.html'), text, { encoding: 'utf8' }); return d;
}
const read = (d, f) => fs.readFileSync(path.join(d, f || 'index.html'), 'utf8');
const CELL_FILE = 'js/a/boot-a.js';
const cell = regions => ({ key: 'bootA', file: CELL_FILE, kit: 'OurgoalAKit', kitVar: '_aKit', beforeTag: '<script src="js/a/index.js"></script>', title: 'Fixture Boot A', desc: ['꾸러미 구역 함수.'], regions });
const cfgR = (regions, allow, more) => Object.assign({ task: T, slot: 'HO', mode: 'region', label: '단위 시험', cells: [cell(regions)] }, allow ? { allowGuarded: allow } : {}, more || {});
const CONFIG_LINES = ['  var OURGOAL_CONFIG = {};', "  if(typeof window !== 'undefined'){ window.OURGOAL_CONFIG = OURGOAL_CONFIG; }"];
const PART_LINES = ["  if(window.OurgoalTemplateCredit && typeof window.OurgoalTemplateCredit.init === 'function'){", '    window.OurgoalTemplateCredit.init({ sb: sb, getState: function(){ return state; }, toast: toast });', '  }'];
const mkBody = (configLines, partLines) => [
  '  /* ============ 머리 이음매 ============ */', '  var _aKit = window.OurgoalAKit;', '  /* [어려움 이음매 자리 HO 기관] */', '  var alpha = _aKit.alpha;', '',
  '  /* ============ 상태 ============ */', '  var sb = { id: 7 };', '  var state = { n: 3 };', "  var toast = function(m){ window.__log.push('toast:' + m); };",
  "  window.OurgoalAppScope.expose('index.html', {", '    get sb(){ return sb; },', '    get state(){ return state; },', '    get toast(){ return toast; }', '  });', '',
  '  /* ============ 환경설정 ============ */'].concat(configLines, ['', '  /* ============ 부품 연결 ============ */'], partLines, ['', '  /* ============ 꼬리 ============ */', "  alpha('tail');"]);
const BODY = mkBody(CONFIG_LINES, PART_LINES);
const R_CONFIG = { name: 'bootAppConfig', group: '환경설정' }, R_PART = { name: 'bootPartInit', group: '부품 연결' };
const allow = (...names) => names.map(n => ({ name: n, approval: APPROVAL }));
const stripL = l => l.replace(/(^|[^\w$.])L\.(?=[A-Za-z_$])/g, '$1');
const cellBody = text => { const ls = text.split('\n'), out = {}; let cur = null; for (const l of ls) { const m = l.match(/^  function (\w+)\(\) \{ \/\* \[#/); if (m) { cur = m[1]; out[cur] = []; continue; } if (cur && new RegExp('^  \\} /\\* ' + cur + ' \\*/$').test(l)) { cur = null; continue; } if (cur) out[cur].push(l); } return out; };

// K: 잠금 기본 동작 불변
function lockCase(id, title, regions) {
  const before = doc(BODY), d = makeDir(id.toLowerCase(), before), d2 = makeDir(id.toLowerCase() + '-base', before);
  const r = runGen(d, cfgR(regions)), rb = runGen(d2, cfgR(regions), BASE_GEN);
  record(id, title, r.status !== 0 && /돈 근처·결심 대기 대상이 있다 — 구역에서 뺀다/.test(r.err || '') && r.err === rb.err && read(d) === before && !fs.existsSync(path.join(d, CELL_FILE)), { status: [r.status, rb.status], err: r.err, baseErr: rb.err, htmlSame: read(d) === before });
}
lockCase('K1', '잠금 불변: 허용 칸이 없으면 OURGOAL_CONFIG 가 든 구역은 예전과 같은 글자로 멈춘다(기준 생성기와 오류 글자 동일)', [R_CONFIG]);
lockCase('K2', '잠금 불변: 허용 칸이 없으면 OurgoalTemplateCredit 가 든 구역은 예전과 같은 글자로 멈춘다(기준 생성기와 오류 글자 동일)', [R_PART]);
lockCase('K3', '잠금 불변: 두 구역을 함께 적어도 허용 칸이 없으면 첫 잠긴 이름에서 멈춘다(기준 생성기와 오류 글자 동일)', [R_CONFIG, R_PART]);

// A: 허용
function allowCase(id, title, regions, allowList, expect) {
  const before = doc(BODY), d = makeDir(id.toLowerCase(), before);
  const r = runGen(d, cfgR(regions, allowList));
  const detail = { status: r.status, err: r.err };
  let ok = r.status === 0;
  if (ok) {
    const bodies = cellBody(read(d, CELL_FILE)), html = read(d).split('\n');
    detail.guardedAllowed = r.meta.guardedAllowed; detail.guardedLines = r.stdout.split('\n').filter(l => /^  guarded /.test(l)).length;
    for (const [name, lines] of Object.entries(expect.bodies)) { const got = (bodies[name] || []).filter(l => !/^\s*\/\*/.test(l) && l.trim() !== ''); const same = got.length === lines.length && got.every((l, i) => stripL(l) === lines[i]); detail['prefixOnly:' + name] = same; if (!same) { ok = false; detail['got:' + name] = got; } }
    ok = ok && JSON.stringify(r.meta.guardedAllowed.map(g => [g.name, g.approval === APPROVAL, g.hits.map(h => [h.region, h.guardedWords, h.prefixEdits])])) === JSON.stringify(expect.meta) && detail.guardedLines === expect.lines
      && expect.gone.every(t => !html.some(l => l.includes(t))) && Object.keys(expect.bodies).every(n => html.some(l => l.startsWith('  ' + n + '(); /* [#' + T + '] 로드 중 구역')));
  }
  record(id, title, ok, detail);
  return { r, d };
}
const a1 = allowCase('A1', '허용: OURGOAL_CONFIG 만 — 선언과 window 복사 블록이 구역 함수로 간다(선언은 그 함수의 지역 변수 — 접두 0). 메타·출력에 이름·근거·구역·문 줄·낱말 수가 적힌다', [R_CONFIG], allow('OURGOAL_CONFIG'),
  { bodies: { bootAppConfig: CONFIG_LINES }, meta: [['OURGOAL_CONFIG', true, [['bootAppConfig', 1, 0], ['bootAppConfig', 2, 0]]]], lines: 2, gone: ['var OURGOAL_CONFIG = {};'] });
allowCase('A2', '허용: OurgoalTemplateCredit 만 — 초기화 블록이 구역 함수로 간다. 바뀐 글자는 IIFE 이름 셋의 접두 L. 뿐이다', [R_PART], allow('OurgoalTemplateCredit'),
  { bodies: { bootPartInit: PART_LINES }, meta: [['OurgoalTemplateCredit', true, [['bootPartInit', 3, 3]]]], lines: 1, gone: ['window.OurgoalTemplateCredit.init({'] });
const a3 = allowCase('A3', '허용: 둘 다(구역 둘) — 두 구역이 한 세포 파일로 간다', [R_CONFIG, R_PART], allow('OURGOAL_CONFIG', 'OurgoalTemplateCredit'),
  { bodies: { bootAppConfig: CONFIG_LINES, bootPartInit: PART_LINES }, meta: [['OURGOAL_CONFIG', true, [['bootAppConfig', 1, 0], ['bootAppConfig', 2, 0]]], ['OurgoalTemplateCredit', true, [['bootPartInit', 3, 3]]]], lines: 3, gone: ['var OURGOAL_CONFIG = {};', 'window.OurgoalTemplateCredit.init({'] });
{ // A4: 허용은 잠금만 푼다 — 잠긴 낱말을 다른 낱말로 바꾼 꾸러미를 기준 생성기로 돌린 산출과 낱말만 다르다
  const swap = s => s.split('OURGOAL_CONFIG').join('OURGOAL_KONFIG').split('OurgoalTemplateCredit').join('OurgoalTemplateKredit');
  const d = makeDir('a4-neutral', swap(doc(BODY)));
  const rb = runGen(d, cfgR([R_CONFIG, R_PART]), BASE_GEN);
  const same = rb.status === 0 && a3.r.status === 0 && swap(read(a3.d)) === read(d) && swap(read(a3.d, CELL_FILE)) === read(d, CELL_FILE);
  record('A4', '허용은 잠금만 푼다: 잠긴 낱말을 다른 낱말로 바꾼 같은 꾸러미를 기준 생성기(허용 칸 없음)로 돌린 index.html·세포 파일과, 허용해 돌린 산출이 그 낱말 말고 바이트 동일하다', same, { baseStatus: rb.status, baseErr: rb.err });
}

// E1: 실행 등가(vm)
{
  const runIn = (scripts) => {
    const ctx = vm.createContext({}); vm.runInContext('var window = this; window.__log = []; window.OurgoalTemplateCredit = { init: function(o){ window.__log.push(["init", o.sb && o.sb.id, typeof o.getState, o.getState().n, typeof o.toast, Object.keys(o).sort().join(",")]); o.toast("ready"); } };', ctx);
    let threw = null; try { for (const s of scripts) vm.runInContext(s, ctx); } catch (e) { threw = String(e && e.message || e); }
    const cfgInfo = vm.runInContext('JSON.stringify({ type: typeof window.OURGOAL_CONFIG, keys: window.OURGOAL_CONFIG && Object.keys(window.OURGOAL_CONFIG).length, plain: window.OURGOAL_CONFIG && Object.getPrototypeOf(window.OURGOAL_CONFIG) === Object.prototype })', ctx);
    return { threw, log: JSON.stringify(vm.runInContext('window.__log', ctx)), config: cfgInfo };
  };
  const inline = t => { const ls = t.split('\n'), s = ls.indexOf('<script>'), e = ls.indexOf('</script>'); return ls.slice(s + 1, e).join('\n'); };
  const before = runIn([REAL_SCOPE, JS['js/a/index.js'], inline(doc(BODY))]);
  const after = a3.r.status === 0 ? runIn([REAL_SCOPE, JS['js/a/index.js'], read(a3.d, CELL_FILE), inline(read(a3.d))]) : { threw: '생성 실패' };
  record('E1', '실행 등가(vm, 진짜 통로): 이전 전 인라인과 옮긴 뒤(세포 + 인라인)에서 window.OURGOAL_CONFIG 가 같은 꼴(빈 객체)로 달리고 부품 init 이 같은 값(sb · getState() · toast)으로 한 번 불린다',
    !before.threw && !after.threw && before.log === after.log && before.config === after.config && JSON.parse(before.log).length === 3 && /"init",7,"function",3,"function","getState,sb,toast"/.test(before.log), { before, after });
}

// S: 정지
function stopCase(id, title, body, cfg, re) {
  const before = doc(body), d = makeDir(id.toLowerCase(), before);
  const r = runGen(d, cfg);
  record(id, title, r.status !== 0 && re.test(r.err || '') && read(d) === before && !fs.existsSync(path.join(d, CELL_FILE)), { status: r.status, err: r.err, htmlSame: read(d) === before });
}
stopCase('S1', '정지: OURGOAL_CONFIG 만 허용했는데 구역에 OurgoalTemplateCredit 가 있다 — 적지 않은 이름은 예전처럼 멈춘다', BODY, cfgR([R_CONFIG, R_PART], allow('OURGOAL_CONFIG')), /구역 bootPartInit 에 돈 근처·결심 대기 대상이 있다 — 구역에서 뺀다: OurgoalTemplateCredit/);
stopCase('S2', '정지: 잠긴 이름 목록에 없는 이름을 허용 칸에 적었다', BODY, cfgR([R_CONFIG], [{ name: 'SUPABASE_ANON_KEY', approval: APPROVAL }]), /allowGuarded 의 name 은 잠긴 이름\(OurgoalTemplateCredit · OURGOAL_CONFIG\) 가운데 하나여야 한다: SUPABASE_ANON_KEY/);
stopCase('S3', '정지: 승인 근거 글자가 없다', BODY, cfgR([R_CONFIG], [{ name: 'OURGOAL_CONFIG' }]), /approval\(승인 근거 글자 — 10자 이상, 한 줄\)이 없다: OURGOAL_CONFIG/);
stopCase('S4', '정지: 승인 근거 글자가 너무 짧다(「ok」 같은 글자로 풀리지 않는다)', BODY, cfgR([R_CONFIG], [{ name: 'OURGOAL_CONFIG', approval: 'ok' }]), /approval\(승인 근거 글자 — 10자 이상, 한 줄\)이 없다/);
stopCase('S5', '정지: 승인 근거 글자에 줄바꿈이 있다', BODY, cfgR([R_CONFIG], [{ name: 'OURGOAL_CONFIG', approval: '첫 줄 승인 근거\n둘째 줄' }]), /approval\(승인 근거 글자 — 10자 이상, 한 줄\)이 없다/);
stopCase('S6', '정지: 허용 칸에 같은 이름이 두 번 있다', BODY, cfgR([R_CONFIG], allow('OURGOAL_CONFIG', 'OURGOAL_CONFIG')), /allowGuarded 에 같은 이름이 두 번 있다: OURGOAL_CONFIG/);
stopCase('S7', '정지: 허용 칸의 모르는 키', BODY, cfgR([R_CONFIG], [{ name: 'OURGOAL_CONFIG', approval: APPROVAL, rewrite: true }]), /allowGuarded 에 모르는 칸: rewrite/);
stopCase('S8', '정지: allowGuarded 가 빈 배열이다', BODY, cfgR([R_CONFIG], []), /allowGuarded 는 비지 않은 배열이어야 한다/);
stopCase('S9', '정지: allowGuarded 가 배열이 아니다(true 같은 스위치로 풀리지 않는다)', BODY, Object.assign(cfgR([R_CONFIG]), { allowGuarded: true }), /allowGuarded 는 비지 않은 배열이어야 한다/);
stopCase('S10', '정지: 허용한 이름이 어느 구역에도 없다(쓰이지 않는 허용은 적지 않는다)', BODY, cfgR([R_CONFIG], allow('OURGOAL_CONFIG', 'OurgoalTemplateCredit')), /allowGuarded 에 적은 이름이 어느 구역에도 없다\(쓰이지 않는 허용은 적지 않는다\): OurgoalTemplateCredit/);
stopCase('S11', '정지: 허용한 문에 줄임 속성 확장이 필요하다 — 허용 한도는 접두뿐이다', mkBody(CONFIG_LINES, ["  if(window.OurgoalTemplateCredit){ window.OurgoalTemplateCredit.init({ sb, toast }); }"]), cfgR([R_PART], allow('OurgoalTemplateCredit')), /줄임 속성 확장이 필요하다 — 허용 한도는 이름 접두 L\. 뿐이다/);
stopCase('S12', '정지: sweep 설정에 allowGuarded 칸(다른 모드에서는 모르는 칸이다)', BODY, { task: T, mode: 'sweep', cells: [{ file: 'js/core/cell-registry.js' }], sweep: { groups: 'all' }, allowGuarded: allow('OURGOAL_CONFIG') }, /sweep 설정에 모르는 칸: allowGuarded/);
stopCase('S13', '정지: finalize 설정에 allowGuarded 칸', BODY, { task: T, mode: 'finalize', cells: [{ file: 'js/app/boot.js', title: 't', desc: ['d'] }], allowGuarded: allow('OURGOAL_CONFIG') }, /finalize 설정에 모르는 칸: allowGuarded/);

// ── R: 실제 index.html(PIN)
{
  const REAL_REGIONS = [
    { name: 'bootAppConfigUnit', group: '아워골 앱 환경설정', from: 'var OURGOAL_CONFIG = {};', to: "if(typeof window !== 'undefined'){ window.OURGOAL_CONFIG = OURGOAL_CONFIG; }" },
    { name: 'bootTemplatePartInitUnit', group: 'KF-2 #TASK-ES-017', from: 'if(window.OurgoalTemplateCredit', to: 'if(window.OurgoalTemplateCredit' }];
  const realCell = { key: 'bootGuardedUnit', file: 'js/core/boot-guarded-unit.js', kit: 'OurgoalUiHelpers', kitVar: '_uiKit', afterTag: '<script src="js/core/ui-helpers.js"></script>', title: 'Unit Guarded', desc: ['단위 시험용 세포.'], regions: REAL_REGIONS };
  const cfg = allowList => Object.assign({ task: T, slot: 'HO', mode: 'region', label: '단위 시험', cells: [realCell] }, allowList ? { allowGuarded: allowList } : {});
  const t1 = extractTree(PIN, 'r1-new'), t1b = extractTree(PIN, 'r1-base'), t2 = extractTree(PIN, 'r2'), t3 = extractTree(PIN, 'r3');
  const before = t1 ? read(t1) : '';
  const r1 = t1 ? runGen(t1, cfg(null)) : { status: -1 }, r1b = t1b ? runGen(t1b, cfg(null), BASE_GEN) : { status: -1 };
  record('R1', '실제 index.html(PIN): 허용 없이 두 곳을 구역으로 적으면 기준 생성기와 같은 글자로 멈춘다. index.html 그대로 · 세포 파일 없음', r1.status !== 0 && /돈 근처·결심 대기 대상이 있다/.test(r1.err || '') && r1.err === r1b.err && read(t1) === before && !fs.existsSync(path.join(t1, realCell.file)), { err: r1.err, baseErr: r1b.err });
  const r2 = t2 ? runGen(t2, cfg(allow('OURGOAL_CONFIG', 'OurgoalTemplateCredit'))) : { status: -1 };
  const d2 = { status: r2.status, err: r2.err }; let ok2 = r2.status === 0;
  if (ok2) {
    const after = read(t2), cellText = read(t2, realCell.file), bl = before.split('\n'), bodies = cellBody(cellText);
    const segs = r2.meta.regions.map(g => ({ name: g.name, lines: bl.slice(g.segment[0] - 1, g.segment[1]), got: bodies[g.name] || [] }));
    let other = 0, prefixOnly = 0, identical = 0, prefixes = 0, moneyBase = 0, moneyCell = 0, moneySame = true;
    for (const s of segs) { if (s.lines.length !== s.got.length) { other += Math.abs(s.lines.length - s.got.length) + 1; continue; } s.lines.forEach((l, i) => { const g = s.got[i], st = stripL(g); if (g === l) identical++; else if (st === l) { prefixOnly++; prefixes += (g.length - l.length) / 2; } else other++; if (MONEY.test(l)) { moneyBase++; if (st !== l) moneySame = false; } if (MONEY.test(g)) moneyCell++; }); }
    const moneyLines = t => t.split('\n').filter(l => MONEY.test(l)).length;
    const mb = moneyLines(before), ma = moneyLines(after), mc = moneyLines(cellText), headerMoney = cellText.split('\n').slice(0, cellText.split('\n').findIndex(l => l.startsWith('(function(global)'))).filter(l => MONEY.test(l)).length;
    Object.assign(d2, { stdout: r2.stdout.trim().split('\n').map(l => l.slice(0, 150)), guardedAllowed: r2.meta.guardedAllowed.map(g => ({ name: g.name, hits: g.hits })), lines: { identical, prefixOnly, other, prefixes, edits: r2.meta.edits },
      money: { linesInMovedBase: moneyBase, linesInMovedCell: moneyCell, movedLinesSameAfterStrip: moneySame, indexBefore: mb, indexAfter: ma, cellFile: mc, cellHeader: headerMoney, indexPlusCellAfter: ma + mc, sameTotal: mb === ma + mc } });
    ok2 = other === 0 && prefixes === r2.meta.edits && moneyBase === moneyCell && moneySame && headerMoney === 0 && r2.meta.guardedAllowed.length === 2 && r2.meta.regions.length === 2;
  }
  record('R2', '실제 index.html(PIN): 둘 다 허용하면 두 구역이 옮겨진다 — 옮긴 줄에서 접두 L. 말고 다른 줄 0 · 접두 수 = 생성기 바꿔 쓰기 수 · 돈 관련 낱말이 든 옮긴 줄 수가 전후 같고 그 줄들은 접두 말고 그대로 · 세포 머리 설명에 돈 관련 낱말 0', ok2, d2);
  const r3 = t3 ? runGen(t3, cfg(allow('OurgoalTemplateCredit'))) : { status: -1 };
  record('R3', '실제 index.html(PIN): OurgoalTemplateCredit 만 허용하면 OURGOAL_CONFIG 에서 멈춘다. index.html 그대로 · 세포 파일 없음', r3.status !== 0 && /구역 bootAppConfigUnit 에 돈 근처·결심 대기 대상이 있다 — 구역에서 뺀다: OURGOAL_CONFIG/.test(r3.err || '') && read(t3) === before && !fs.existsSync(path.join(t3, realCell.file)), { err: r3.err });
}

const passed = results.filter(r => r.ok).length;
const out = { tool: 'docs/design/harness/module-split/guarded-check-670.js', type: '작업자 측정, 판정 아님', pin: PIN, total: results.length, passed, ok: passed === results.length, results };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log('\n' + passed + '/' + results.length + ' 통과' + (passed === results.length ? '' : ' · 실패: ' + results.filter(r => !r.ok).map(r => r.id).join(', ')));
try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ }
process.exit(passed === results.length ? 0 : 1);
