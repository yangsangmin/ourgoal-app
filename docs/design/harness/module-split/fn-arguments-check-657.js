'use strict';
// 생성기·검사기 「함수 선언 자신의 arguments 허용」(#TASK-ES-657) 단위 시험 — 헌법 v2026.10.11-ARGUMENTS CELL_SPLIT 5호(PR #925). 작업자 측정, 판정 아님.
// 저장소 밖 임시 폴더에서 생성기·검사기를 자식 프로세스로 돌리고 결과를 맞댄다. 저장소의 index.html 은 건드리지 않는다.
//  B    구역 감싸기 시험 67건(region-check-643.js — 그 안에서 상태 이전 34건 · unwire 확장 16건 · B1 8건이 다시 돈다)을 고친 생성기로 다시 돌린다.
//       그 묶음의 D0(「생성기 diff 는 한 자리에 끼워 넣은 줄뿐」 — #643 이전 생성기와의 모양 비교)은 생성기의 다른 자리를 고치는 순간 구조적으로 거짓이 된다. D0 말고 실패가 없어야 한다.
//  D1   생성기 diff(기준 = PIN 커밋): 기준에서 사라진 줄은 한 줄(함수 선언 검사 호출 줄)뿐이고, unwire · unstate · region 구간(머리 주석 다음 ~ 「smoke-test FN_NAMES」 앞)은 글자가 같다.
//  D2   검사기 diff(기준 = PIN 커밋): 기준에서 사라진 줄 목록을 그대로 싣는다(⑤ 검사 두 줄 · OK 문구 한 줄).
//  G*   옮기기 경로 무변화: 병합된 옮기기 PR 넷(#911 · #913 · #917 · #923)의 기준 트리에 고친 생성기를 그 설정으로 돌린 결과가 병합된 index.html · 세포 파일과 바이트 동일.
//  V*   검사기 무변화: 위 넷의 결과에 고친 검사기와 기준 검사기를 돌린 출력(JSON 포함 표준 출력)이 글자 그대로 같고 ok 다.
//  A1   허용: 함수 선언이 자기 본문에서 arguments 를 쓴다 → 옮긴다. 세포의 그 줄은 글자 그대로, 메타 ownArguments 에 수가 적힌다. 검사기 ok · ownArguments 에 실림 · thisArgs 비어 있음.
//  A2   예전과 같음: 안쪽 보통 함수의 arguments·this 는 그 안쪽 함수의 것 → 옮긴다(ownArguments 칸 없음).
//  S1   정지: 함수 선언 최상위 this · S2 정지: 화살표 함수 안 arguments · S3 정지: 화살표 함수 안 this — 「유형 K」로 멈추고 index.html 을 쓰지 않고 세포 파일을 만들지 않는다.
//  S4   그대로: 감싸려는 로드 중 문의 최상위 arguments → 감싸지 않고 원래 자리에 둔다(사유 「최상위 this/arguments」). S5 예전과 같음: var 에 담긴 함수식(그 함수식 자신의 arguments)은 예전에도 옮겼다 — 기준 생성기와 바이트 동일.
//  VS1 · VS2 검사기 정지: 옮긴 함수 안의 보통 함수를 화살표 함수로 바꿔 치기한 꾸러미(이전 전·세포 양쪽) → 화살표 안 arguments · this 를 thisArgs 로 잡아 FAIL.
//  P1   실제 index.html(PIN 커밋): saveGoogleToken 모의 이전 — 생성 성공 · 검사기 ok · ownArguments 에 실림 · 옮긴 줄에서 L. 접두만 걷어 내면 이전 전 줄과 같다 · window 노출 줄은 원래 자리.
// (모의 이전 사본의 시험 전부 비교는 이 파일이 아니라 reports/TASK-ES-657/mock-tests.cjs 가 잰다.)
// 사용: NODE_PATH=<node_modules> node fn-arguments-check-657.js <APP_DIR(작업 트리)> <out.json> [--skip-643]
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const [APP_ARG, OUT] = process.argv.slice(2);
const SKIP643 = process.argv.includes('--skip-643');
const APP = path.resolve(APP_ARG);
const HARNESS = path.join(APP, 'docs', 'design', 'harness', 'module-split');
const GEN = path.join(HARNESS, 'gen-inline-hard.js'), VERIFY = path.join(HARNESS, 'verify-inline-hard.js');
const PIN = '1c40f599db88089cf21d1c8f43dbe9ed684d4b9e'; // 기준 커밋(#925 헌법 개정 병합) — 기준 생성기·검사기와 실제 index.html·js/** 를 여기서 읽는다(main 이 움직여도 같은 입력)
const MERGED = [ // 병합된 옮기기 PR 의 병합 커밋(첫 부모 = 그 PR 의 기준 트리)
  { id: 'G638', pr: 911, task: 'TASK-ES-638', commit: 'b76c29e95e6b74f97156dee4178bd737ef3ec2b9' },
  { id: 'G640', pr: 913, task: 'TASK-ES-640', commit: '9014a386051477b315ad0881d7992d1f0ea0c671' },
  { id: 'G645', pr: 917, task: 'TASK-ES-645', commit: 'c0658b2caadb9585efce894db0fd2af69eed7eca' },
  { id: 'G653', pr: 923, task: 'TASK-ES-653', commit: '529e43709ba65929e4b0e4f4049033d466e3dd2f' },
];
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fnargs-657-'));
const results = [];
const env = { ...process.env, MODULE_SPLIT_OUT: tmpRoot };
const META = path.join(tmpRoot, 'gen-inline-hard-meta.json');
const T = 'TASK-657-UNIT';
const writeBytes = (file, buf) => fs.writeFileSync(file, buf, { encoding: 'utf8' }); // Buffer 는 인코딩 인자와 무관하게 바이트 그대로 쓰인다
function blobBuf(spec) { const r = cp.spawnSync('git', ['-C', APP, 'cat-file', '-p', spec], { encoding: 'buffer', maxBuffer: 1024 * 1024 * 64 }); if (r.status !== 0) throw new Error('git cat-file 실패: ' + spec); return r.stdout; }
const blob = spec => blobBuf(spec).toString('utf8');
const BASE_GEN = path.join(tmpRoot, 'gen-base.js'), BASE_VERIFY = path.join(tmpRoot, 'verify-base.js');
fs.writeFileSync(BASE_GEN, blob(PIN + ':docs/design/harness/module-split/gen-inline-hard.js'), { encoding: 'utf8' });
fs.writeFileSync(BASE_VERIFY, blob(PIN + ':docs/design/harness/module-split/verify-inline-hard.js'), { encoding: 'utf8' });
function runGen(dir, cfg, gen) {
  const cfgFile = path.join(tmpRoot, 'cfg-' + Math.random().toString(16).slice(2) + '.json');
  fs.writeFileSync(cfgFile, JSON.stringify(cfg), { encoding: 'utf8' });
  try { fs.unlinkSync(META); } catch (_) { /* 없으면 그만 */ }
  const r = cp.spawnSync(process.execPath, [gen || GEN, dir, cfgFile], { encoding: 'utf8', env, maxBuffer: 1024 * 1024 * 64 });
  const meta = r.status === 0 && fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : null;
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, meta, cfgFile, err: r.status === 0 ? null : ((r.stderr || '').split(/\r?\n/).find(l => /^Error: /.test(l)) || '').replace(/^Error: /, '') };
}
function runVerify(beforeHtml, dir, cfgFile, verifier) {
  const outDir = fs.mkdtempSync(path.join(tmpRoot, 'v-'));
  const r = cp.spawnSync(process.execPath, [verifier || VERIFY, beforeHtml, dir, cfgFile], { encoding: 'utf8', env: { ...process.env, MODULE_SPLIT_OUT: outDir }, maxBuffer: 1024 * 1024 * 64 });
  const f = path.join(outDir, 'verify-inline-hard.json');
  return { status: r.status, stdout: r.stdout, stderr: (r.stderr || '').slice(0, 300), report: fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null, last: ((r.stdout || '').trim().split('\n').pop() || '') };
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
function lcsDiff(a, b) { // 줄 단위 최장 공통 부분열 — 기준에서 사라진 줄 · 새로 생긴 줄(1-based 줄 번호)
  const n = a.length, m = b.length, w = m + 1, dp = new Uint16Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i * w + j] = a[i] === b[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
  const removed = [], added = []; let i = 0, j = 0;
  while (i < n && j < m) { if (a[i] === b[j]) { i++; j++; } else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) removed.push({ line: ++i, text: a[i - 1] }); else added.push({ line: ++j, text: b[j - 1] }); }
  while (i < n) removed.push({ line: ++i, text: a[i - 1] }); while (j < m) added.push({ line: ++j, text: b[j - 1] });
  return { removed, added };
}
const LF = s => s.replace(/\r\n/g, '\n');

// ── B: 구역 감싸기 시험 67건(그 안에서 634 · 619 · B1)
if (!SKIP643) {
  const out = path.join(tmpRoot, 'region643.json');
  const r = cp.spawnSync(process.execPath, [path.join(HARNESS, 'region-check-643.js'), APP, out], { encoding: 'utf8', env: process.env, maxBuffer: 1024 * 1024 * 256 });
  const j = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
  const failed = j ? j.results.filter(x => !x.ok).map(x => x.id) : null, inner = j && (j.results.find(x => x.id === 'B') || {});
  record('B', '구역 감싸기 시험 67건(#TASK-ES-643 — 상태 이전 34건 · unwire 확장 16건 · B1 8건 재실행 포함)이 고친 생성기에서 D0 말고 모두 통과한다(D0 는 #643 이전 생성기와의 「한 자리 끼워 넣기」 모양 비교라 다른 자리를 고치면 구조적으로 거짓)',
    !!j && j.total === 67 && failed.every(id => id === 'D0') && inner.ok === true,
    { status: r.status, total: j && j.total, passed: j && j.passed, failed, innerB: inner && inner.detail, d0: j && (j.results.find(x => x.id === 'D0') || {}).detail, stderr: (r.stderr || '').slice(0, 300) });
} else record('B', '구역 감싸기 시험 67건 재실행(--skip-643 으로 건너뜀)', false, { skipped: true });

// ── D1 · D2: 생성기 · 검사기 diff
{
  const base = LF(fs.readFileSync(BASE_GEN, 'utf8')).split('\n'), now = LF(fs.readFileSync(GEN, 'utf8')).split('\n');
  const d = lcsDiff(base, now);
  const cut = (ls) => { const a = ls.findIndex(l => l.startsWith("if (CFG.mode === 'unwire')")), b = ls.findIndex(l => l.startsWith('// smoke-test FN_NAMES')); return ls.slice(a, b).join('\n'); };
  const modesSame = cut(base) === cut(now) && cut(base).length > 1000;
  record('D1', '생성기 diff: 기준에서 사라진 줄은 함수 선언 검사 호출 한 줄뿐이고, unwire · unstate · region 구간은 글자가 같다',
    d.removed.length === 1 && /topThisArgs\(st\.get\('body'\)\)/.test(d.removed[0].text) && modesSame && d.added.every(x => /657|fnDeclThisArgs|ownArguments|thisN|argsOwn|argsArrow|^\s*st\.get\('body'\)\.traverse|^\s*Function\(q\)|^\s*return k;|^\s*\}\);$|^\};$|this·arguments|화살표 함수 안|안쪽의 보통 함수|감싸기로 옮기는/.test(x.text)),
    { pin: PIN, baseLines: base.length, nowLines: now.length, removed: d.removed, addedCount: d.added.length, addedLines: d.added.map(x => x.line), modesSectionSame: modesSame });
  const vb = LF(fs.readFileSync(BASE_VERIFY, 'utf8')).split('\n'), vn = LF(fs.readFileSync(VERIFY, 'utf8')).split('\n');
  const v = lcsDiff(vb, vn);
  record('D2', '검사기 diff: 기준에서 사라진 줄은 ⑤ 검사 두 줄과 OK 문구 한 줄뿐이다',
    v.removed.length === 3 && v.removed.filter(x => /let bad = 0;|fp\.get\('body'\)\.traverse/.test(x.text)).length === 2 && v.removed.filter(x => /console\.log\(report\.ok \?/.test(x.text)).length === 1,
    { pin: PIN, baseLines: vb.length, nowLines: vn.length, removed: v.removed.map(x => ({ line: x.line, text: x.text.slice(0, 140) })), addedCount: v.added.length });
}

// ── G* · V*: 병합된 옮기기 PR 넷 — 생성 결과 바이트 동일 · 검사기 출력 동일
for (const m of MERGED) {
  const detail = { pr: m.pr, commit: m.commit }; let ok = false, vok = false; const vdetail = { pr: m.pr };
  const base = extractTree(m.commit + '^1', m.id.toLowerCase() + '-base');
  if (base) {
    const before = path.join(tmpRoot, m.id + '-before.html'); writeBytes(before, blobBuf(m.commit + '^1:index.html'));
    const cfg = JSON.parse(blob(m.commit + ':reports/' + m.task + '/proof.json'));
    const r = runGen(base, cfg); detail.genStatus = r.status; detail.stdout = (r.stdout || '').split('\n')[0]; detail.err = r.err; ok = r.status === 0;
    if (ok) { detail.files = {}; for (const f of ['index.html', ...cfg.cells.map(c => c.file)]) { const gen = fs.readFileSync(path.join(base, f)), head = blobBuf(m.commit + ':' + f); const same = Buffer.compare(gen, head) === 0; detail.files[f] = { same, bytes: gen.length }; if (!same) ok = false; } }
    if (r.status === 0) {
      const a = runVerify(before, base, r.cfgFile), b = runVerify(before, base, r.cfgFile, BASE_VERIFY);
      vdetail.status = [a.status, b.status]; vdetail.stdoutSame = a.stdout === b.stdout; vdetail.ok = a.report && a.report.ok; vdetail.ownArguments = a.report && a.report.ownArguments || null; vdetail.last = a.last.slice(0, 60);
      vok = a.status === 0 && b.status === 0 && a.stdout === b.stdout && !!a.report && a.report.ok === true && a.report.ownArguments === undefined;
    }
  } else detail.archive = '실패';
  record(m.id, '고친 생성기가 #' + m.pr + '(' + m.task + ')의 기준 트리에서 같은 설정으로 index.html·세포 파일을 바이트 그대로 다시 만든다(옮기기·감싸기 경로 무변화)', ok, detail);
  record(m.id.replace('G', 'V'), '고친 검사기와 기준 검사기가 #' + m.pr + ' 결과에 내는 출력이 글자 그대로 같고 ok 다(ownArguments 칸 없음)', vok, vdetail);
}

// ── 꾸러미(fixture) — 일반(옮기기) 모드
const HEAD = ['<!doctype html>', '<html><head><title>fixture</title></head><body>',
  '<script src="js/core/app-scope.js"></script><script src="js/a/index.js"></script>',
  '<script>', '(function(){', '  "use strict";',
  '  var _aKit = window.OurgoalAKit;', '  /* [어려움 이음매 자리 HO 기관] */', '  var keepMe = 1;', ''];
const TAIL = ['})();', '</script>', '</body></html>', ''];
const doc = body => HEAD.concat(['  /* ============ 묶음 가 ============ */'], body, TAIL).join('\n');
const JS = {
  'js/core/app-scope.js': blob(PIN + ':js/core/app-scope.js'),
  'js/a/index.js': "(function(){ window.OurgoalAKit = window.OurgoalAKit || {}; })();\n",
  'scripts/smoke-test.js': "const FN_NAMES = [\n];\n",
};
function makeDir(name, text) {
  const d = path.join(tmpRoot, name); fs.mkdirSync(d, { recursive: true });
  for (const [f, t] of Object.entries(JS)) { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), t, { encoding: 'utf8' }); }
  fs.writeFileSync(path.join(d, 'index.html'), text, { encoding: 'utf8' });
  fs.writeFileSync(path.join(tmpRoot, name + '-before.html'), text, { encoding: 'utf8' });
  return d;
}
const read = (d, f) => fs.readFileSync(path.join(d, f || 'index.html'), 'utf8');
const CELL = 'js/a/moved.js';
const cfgM = take => ({ task: T, slot: 'HO', label: '단위 시험', cells: [{ key: 'movedA', file: CELL, kit: 'OurgoalAKit', kitVar: '_aKit', beforeTag: '<script src="js/a/index.js"></script>', title: 'Fixture Moved', desc: ['꾸러미 옮긴 함수.'], take: [Object.assign({ group: '묶음 가', keepRest: true }, take)] }] });
const before = name => path.join(tmpRoot, name + '-before.html');

// ── A1: 허용 — 함수 선언 자신의 arguments
{
  const body = ['  function pick(a){', '    var second = arguments[1];', '    if(arguments.length > 2) return keepMe + arguments.length;', '    return second || a;', '  }', '  window.pick = pick;'];
  const d = makeDir('a1', doc(body)), r = runGen(d, cfgM({ names: ['pick'] }));
  const cell = r.status === 0 ? read(d, CELL) : '', html = r.status === 0 ? read(d) : '';
  const v = r.status === 0 ? runVerify(before('a1'), d, r.cfgFile) : null;
  record('A1', '허용: 자기 본문에서 arguments 를 쓰는 함수 선언을 옮긴다 — arguments 줄은 글자 그대로, 메타·검사기 ownArguments 에 3곳, thisArgs 비어 있음, 검사기 ok',
    r.status === 0 && cell.includes('    var second = arguments[1];') && cell.includes('    if(arguments.length > 2) return L.keepMe + arguments.length;') && !/L\.arguments/.test(cell) && !html.includes('function pick(a){') && html.includes('  window.pick = pick;')
    && r.meta && JSON.stringify(r.meta.ownArguments) === JSON.stringify([{ name: 'pick', cell: 'movedA', count: 3 }]) && /\n {2}arguments pick — /.test('\n' + r.stdout)
    && v && v.status === 0 && v.report.ok === true && JSON.stringify(v.report.ownArguments) === JSON.stringify([{ name: 'pick', file: CELL, count: 3 }]) && v.report.thisArgs.length === 0 && /함수 선언 자신의 arguments 3곳 허용/.test(v.last),
    { status: r.status, err: r.err, ownArguments: r.meta && r.meta.ownArguments, verify: v && { status: v.status, ok: v.report && v.report.ok, ownArguments: v.report && v.report.ownArguments, thisArgs: v.report && v.report.thisArgs, last: v.last.slice(-60) } });
}
// ── A2: 예전과 같음 — 안쪽 보통 함수의 arguments·this
{
  const body = ['  function nest(a){', '    var g = function(){ return arguments.length; };', '    var h = function(){ return this; };', '    return g(a) + (h() ? 1 : 0);', '  }', '  window.nest = nest;'];
  const d = makeDir('a2', doc(body)), r = runGen(d, cfgM({ names: ['nest'] })), v = r.status === 0 ? runVerify(before('a2'), d, r.cfgFile) : null;
  const d2 = makeDir('a2b', doc(body)), rb = runGen(d2, cfgM({ names: ['nest'] }), BASE_GEN);
  record('A2', '예전과 같음: 안쪽 보통 함수의 arguments·this 는 그 함수의 것 → 옮긴다. ownArguments 칸 없음, 기준 생성기와 결과가 바이트 동일',
    r.status === 0 && r.meta && r.meta.ownArguments === undefined && v && v.report.ok === true && v.report.ownArguments === undefined && rb.status === 0 && read(d) === read(d2) && read(d, CELL) === read(d2, CELL),
    { status: r.status, err: r.err, baseStatus: rb.status, verifyOk: v && v.report && v.report.ok });
  // ── VS1 · VS2: 검사기 정지 — 화살표 함수로 바꿔 치기(이전 전·세포 양쪽을 같게 고쳐 토큰 대조는 그대로 두고 ⑤ 만 걸리게 한다)
  for (const [id, from, to, what] of [['VS1', 'function(){ return arguments.length; }', '() => arguments.length', '화살표 함수 안 arguments'], ['VS2', 'function(){ return this; }', '() => this', '화살표 함수 안 this']]) {
    const t = path.join(tmpRoot, id.toLowerCase()); fs.cpSync(d, t, { recursive: true });
    const cellT = read(t, CELL), befT = fs.readFileSync(before('a2'), 'utf8');
    const okTamper = cellT.includes(from) && befT.includes(from);
    fs.writeFileSync(path.join(t, CELL), cellT.replace(from, to), { encoding: 'utf8' }); fs.writeFileSync(before(id.toLowerCase()), befT.replace(from, to), { encoding: 'utf8' });
    const vv = runVerify(before(id.toLowerCase()), t, r.cfgFile);
    record(id, '검사기 정지: 옮긴 함수 선언 안의 ' + what + ' → thisArgs 에 올라 FAIL(토큰 대조는 그대로 같음)',
      okTamper && vv.status === 1 && vv.report && vv.report.ok === false && vv.report.equivalent === true && JSON.stringify(vv.report.thisArgs) === JSON.stringify(['nest']) && vv.report.ownArguments === undefined && vv.last === 'FAIL',
      { okTamper, status: vv.status, ok: vv.report && vv.report.ok, equivalent: vv.report && vv.report.equivalent, thisArgs: vv.report && vv.report.thisArgs, last: vv.last });
  }
}
// ── S1 · S2 · S3: 정지 — 멈추고 index.html 을 쓰지 않고 세포 파일을 만들지 않는다
for (const [id, what, body] of [
  ['S1', '함수 선언 최상위 this', ['  function usesThis(){', '    var x = this;', '    return x;', '  }']],
  ['S2', '화살표 함수 안 arguments', ['  function arrowArgs(){', '    var g = () => arguments.length;', '    return g();', '  }']],
  ['S3', '화살표 함수 안 this', ['  function arrowThis(){', '    var g = () => this;', '    return g();', '  }']],
  ['S2b', '자기 arguments 와 화살표 함수 안 arguments 가 함께 있음', ['  function both(a){', '    var n = arguments.length;', '    var g = () => arguments[0];', '    return n + g();', '  }']],
]) {
  const text = doc(body), name = /function (\w+)/.exec(body[0])[1];
  const d = makeDir(id.toLowerCase(), text), r = runGen(d, cfgM({ names: [name] }));
  const d2 = makeDir(id.toLowerCase() + '-base', text), rb = runGen(d2, cfgM({ names: [name] }), BASE_GEN);
  record(id, '정지: ' + what + ' → 「유형 K」로 멈춘다. index.html 그대로 · 세포 파일 없음 · 기준 생성기와 같은 사유',
    r.status !== 0 && r.err === '최상위 this/arguments(유형 K) — 옮기지 않는다: ' + name && read(d) === text && !fs.existsSync(path.join(d, CELL)) && rb.status !== 0 && rb.err === r.err,
    { status: r.status, err: r.err, baseErr: rb.err, htmlSame: read(d) === text, cellExists: fs.existsSync(path.join(d, CELL)) });
}
// ── S4: 그대로 — 감싸려는 로드 중 문의 최상위 arguments 는 감싸지 않는다
{
  const body = ['  function plain(){', '    return 1;', '  }', '  if(keepMe){', '    keepMe = arguments.length;', '    keepMe += 1;', '    keepMe += 2;', '  }', '  window.plain = plain;'];
  const text = doc(body), d = makeDir('s4', text), r = runGen(d, cfgM({ all: true }));
  const d2 = makeDir('s4-base', text), rb = runGen(d2, cfgM({ all: true }), BASE_GEN);
  const keep = r.meta && r.meta.plan.find(p => p.action === 'keep' && /최상위 this\/arguments/.test(p.why || ''));
  record('S4', '그대로: 로드 중 문(4줄 이상)의 최상위 arguments → 감싸지 않고 원래 자리(사유 「감쌀 수 없음: 최상위 this/arguments」). 기준 생성기와 결과가 바이트 동일',
    r.status === 0 && !!keep && read(d).includes('    keepMe = arguments.length;') && !read(d, CELL).includes('arguments') && r.meta.ownArguments === undefined && rb.status === 0 && read(d) === read(d2) && read(d, CELL) === read(d2, CELL),
    { status: r.status, err: r.err, keepWhy: keep && keep.why, baseStatus: rb.status });
}
// ── S5: 예전과 같음 — var 에 담긴 함수식(순수 상수)은 그 함수식 자신의 arguments 를 쓰므로 예전에도 옮겼다. 이번 변경이 그 경로를 건드리지 않았는지 본다
{
  const body = ['  function plain(){', '    return 1;', '  }', '  var fnExpr = function(){ return arguments.length; };', '  window.plain = plain;'];
  const text = doc(body), d = makeDir('s5', text), r = runGen(d, cfgM({ names: ['plain', 'fnExpr'] }));
  const d2 = makeDir('s5-base', text), rb = runGen(d2, cfgM({ names: ['plain', 'fnExpr'] }), BASE_GEN);
  const mv = r.meta && r.meta.plan.find(p => p.names.includes('fnExpr'));
  record('S5', '예전과 같음: var 에 담긴 함수식(그 함수식 자신의 arguments)은 예전처럼 옮겨진다 — ownArguments 칸 없음(함수 선언이 아니다), 기준 생성기와 결과가 바이트 동일',
    r.status === 0 && !!mv && mv.action === 'move' && read(d, CELL).includes('  var fnExpr = function(){ return arguments.length; };') && r.meta.ownArguments === undefined && rb.status === 0 && read(d) === read(d2) && read(d, CELL) === read(d2, CELL),
    { status: r.status, err: r.err, action: mv && mv.action, baseStatus: rb.status });
}

// ── P1: 실제 index.html(PIN) — saveGoogleToken 모의 이전
{
  const cfg = JSON.parse(fs.readFileSync(path.join(APP, 'reports', 'TASK-ES-657', 'mock-config.json'), 'utf8'));
  const detail = { pin: PIN }; let ok = false;
  const base = extractTree(PIN, 'p1-base');
  if (base) {
    const bef = path.join(tmpRoot, 'p1-before.html'); writeBytes(bef, blobBuf(PIN + ':index.html'));
    const rb = runGen(extractTree(PIN, 'p1-basegen'), cfg, BASE_GEN); detail.baseGenerator = { status: rb.status, err: rb.err };
    const r = runGen(base, cfg); detail.status = r.status; detail.err = r.err; detail.stdout = (r.stdout || '').split('\n').slice(0, 2);
    if (r.status === 0) {
      const v = runVerify(bef, base, r.cfgFile); const cellFile = cfg.cells[0].file, cell = LF(read(base, cellFile)).split('\n'), bl = LF(fs.readFileSync(bef, 'utf8')).split('\n'), html = read(base);
      const p = r.meta.plan.find(x => x.action === 'move' && x.names.includes('saveGoogleToken')), at = cell.findIndex(l => l.includes('이전 전 index.html ' + p.segment[0] + '~' + p.segment[1] + '줄'));
      const names = r.meta.bridged.map(b => b.n).sort((a, b) => b.length - a.length).join('|'), re = new RegExp('(^|[^A-Za-z0-9_$.])L\\.(' + names + ')(?![A-Za-z0-9_$])', 'g');
      let other = 0, prefixOnly = 0, same = 0;
      for (let i = 0; i <= p.segment[1] - p.segment[0]; i++) { const c = cell[at + 1 + i], b = bl[p.segment[0] - 1 + i]; if (c === b) same++; else if (c.replace(re, (m0, pre, nm) => pre + nm) === b) prefixOnly++; else other++; }
      detail.verify = { status: v.status, ok: v.report && v.report.ok, ownArguments: v.report && v.report.ownArguments, thisArgs: v.report && v.report.thisArgs, last: v.last.slice(-70) };
      detail.meta = { ownArguments: r.meta.ownArguments, exposed: r.meta.exposed, bridged: r.meta.bridged.map(b => b.n), imports: r.meta.imports.map(i => i.n), htmlLines: [r.meta.htmlLinesBefore, r.meta.htmlLinesAfter], files: r.meta.files };
      detail.lines = { segment: p.segment, same, prefixOnly, other };
      detail.windowLineStays = html.includes('    window.saveGoogleToken = saveGoogleToken;'); detail.declGoneFromIndex = !html.includes('  function saveGoogleToken(tokenObj){'); detail.declInCell = cell.includes('  function saveGoogleToken(tokenObj){') && cell.includes('    var optEmail = arguments[1];');
      ok = rb.status !== 0 && /유형 K/.test(rb.err || '') && v.status === 0 && v.report.ok === true && r.meta.ownArguments && r.meta.ownArguments.length === 1 && r.meta.ownArguments[0].name === 'saveGoogleToken' && r.meta.ownArguments[0].count === 1
        && v.report.ownArguments && v.report.ownArguments[0].count === 1 && other === 0 && detail.windowLineStays && detail.declGoneFromIndex && detail.declInCell;
    }
  } else detail.archive = '실패';
  record('P1', '실제 index.html(PIN): saveGoogleToken 모의 이전 — 기준 생성기는 「유형 K」로 멈추고, 고친 생성기는 옮긴다 · 검사기 ok · ownArguments 1곳 · 접두 말고 다른 줄 0 · window 노출 줄은 원래 자리', ok, detail);
}

const passed = results.filter(r => r.ok).length;
const expectedFail = results.filter(r => !r.ok).map(r => r.id);
const out = { tool: 'docs/design/harness/module-split/fn-arguments-check-657.js', type: '작업자 측정, 판정 아님', generator: 'docs/design/harness/module-split/gen-inline-hard.js', verifier: 'docs/design/harness/module-split/verify-inline-hard.js', baseCommit: PIN,
  total: results.length, passed, failed: expectedFail, ok: passed === results.length, results };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log('\n' + passed + '/' + results.length + ' 통과' + (expectedFail.length ? ' · 실패: ' + expectedFail.join(', ') : ''));
try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ }
process.exitCode = out.ok ? 0 : 1;
