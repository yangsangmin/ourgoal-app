'use strict';
// 생성기 「빈 구획 쓸기」 모드(mode:"sweep" — docs/architecture/CELL-REGISTRY-DESIGN.md 5절 닫힌 목록 X8, #TASK-ES-661) 단위 시험. 작업자 측정, 판정 아님.
// 저장소 밖 임시 폴더에서 생성기를 자식 프로세스로 돌리고 결과를 맞댄다. 저장소의 index.html 은 건드리지 않는다.
//  B     함수 선언 arguments 시험 22건(fn-arguments-check-657.js — 그 안에서 구역 감싸기 67건 · 상태 이전 34건 · unwire 확장 16건 · B1 8건이 다시 돈다)을 고친 생성기로 다시 돌린다.
//        그 묶음의 D1(생성기 diff 의 새 줄이 #657 의 것뿐인지 보는 모양 비교)과 그 안 643 묶음의 D0(#643 이전 생성기와의 「한 자리 끼워 넣기」 모양 비교)은 생성기에 줄을 더하는 순간 구조적으로 거짓이 된다. 그 둘 말고 실패가 없어야 한다.
//  D0    생성기 diff(기준 = PIN 커밋)가 한 자리에 끼워 넣은 줄뿐이다(기준의 줄은 하나도 바뀌지 않았다). 검사기(verify-inline-hard.js)는 기준과 바이트 동일.
//  G*    기존 경로 무변화: 병합된 PR 셋 — unwire(#920) · unstate(#927) · 옮기기(#930) — 의 기준 트리에 고친 생성기를 그 설정으로 돌린 결과가 병합된 index.html(· 세포 파일)과 바이트 동일.
//  W1~W6 지우는 꼴: 문이 없는 구획의 「옮김」 표지·그 밖의 주석·여러 줄 주석·// 주석·빈 줄 / "all" 은 문이 0 인 구획 전부(연달아 빈 구획 · 마지막 구획 · 구획 주석뿐인 구획) / 제목 배열 / 같은 제목 둘 / CRLF 줄 끝 보존.
//  K1~K3 남기는 꼴: keep 의 글자를 담은 주석 · 그런 주석과 줄을 나눠 쓰는 주석 · 구획 주석과 같은 줄의 주석.
//  P1·P2 제외: 자리 표지가 든 구획 · 1차 이음매 구획("all" 에서는 건너뛰고 skipped 에 적는다).
//  N1~N3 건드리지 않는 것: 문이 있는 구획의 주석·빈 줄 · 첫 구획 주석 앞(머리) · 문 안의 주석과 문 옆 주석.
//  M1·M2 여러 실행: 배열([{ unwire }, { groups }]) 한 번 = 단계를 따로 차례로 돌린 결과 · 뒤 단계가 멈추면 index.html 그대로.
//  S*    정지(전부 index.html 바이트 그대로): 제목 구획에 문이 있음 · 제목 없음 · 제외 구획을 제목으로 가리킴 · 경계에 걸친 주석 · 구획 주석 줄에서 아래로 이어지는 주석 · 한 줄에 구획 주석 둘 ·
//        keep 글자가 안 맞음 · 지울 줄 0 · 빈 구획 0 · 모르는 칸(맨 위·sweep·unwire 단계) · groups 꼴(빠짐·빈 배열·겹침·글자 아님) · keep 꼴 · 빈 배열.
//  A     감사(성공한 꾸러미 전부 + 실제 index.html): 이 시험이 생성기와 따로 다시 파싱해 ① 주석을 뺀 토큰열이 이전과 같고 ② 사라진 줄이 모두 「실행 글자가 없는 줄」이며 ③ 남은 줄의 글자·순서가 그대로인지 본다.
//  R1~R4 실제 index.html(PIN 커밋) 모의 적용 "all": 성공 · 감사 · 구획 주석·자리 표지·문 줄 수 불변 · 이 시험이 따로 센 대상 줄 수와 같음 / 지도 도구 셋(inline-script-map · inline-hard-types · 대조 탐침의 이름 수집)이
//        쓸고 난 사본에서도 돌고 묶음 수·제목이 같음 / 한 번 더 돌리면 「지울 줄 0」으로 멈춤 / keep 하나를 주면 그 줄만 남음.
// (모의 적용 사본의 앱 부팅·지문·시험 전부 비교는 이 파일이 아니라 reports/TASK-ES-661/tools/ 의 측정 스크립트가 잰다.)
// 사용: NODE_PATH=<node_modules> node sweep-check-661.js <APP_DIR(작업 트리)> <out.json> [--skip-657]
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const parser = require('@babel/parser');
const [APP_ARG, OUT] = process.argv.slice(2);
const SKIP657 = process.argv.includes('--skip-657');
const APP = path.resolve(APP_ARG);
const HARNESS = path.join(APP, 'docs', 'design', 'harness', 'module-split');
const GEN = path.join(HARNESS, 'gen-inline-hard.js'), VERIFY = path.join(HARNESS, 'verify-inline-hard.js');
const PIN = 'bb0b2ea61dc900978a8d7da5a6e95b08cf204cea'; // 기준 커밋(#930 병합) — 기준 생성기와 실제 index.html·scripts/** 를 여기서 읽는다(main 이 움직여도 같은 입력)
const MERGED = [ // 병합된 PR 의 병합 커밋(첫 부모 = 그 PR 의 기준 트리)
  { id: 'G648', pr: 920, task: 'TASK-ES-648', mode: 'unwire', commit: 'c6798552d9b1fe55e2de5fb511c4ee37b296b781' },
  { id: 'G649', pr: 927, task: 'TASK-ES-649', mode: 'unstate', commit: '6eeacd5843efc700b0c5a408b035c6313d4ec947' },
  { id: 'G659', pr: 930, task: 'TASK-ES-659', mode: '옮기기', commit: 'bb0b2ea61dc900978a8d7da5a6e95b08cf204cea' },
];
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-661-'));
const results = [];
const env = { ...process.env, MODULE_SPLIT_OUT: tmpRoot };
const META = path.join(tmpRoot, 'gen-inline-hard-meta.json');
const T = 'TASK-661-UNIT';
const writeBytes = (file, buf) => fs.writeFileSync(file, buf, { encoding: 'utf8' }); // Buffer 는 인코딩 인자와 무관하게 바이트 그대로 쓰인다
function blobBuf(spec) { const r = cp.spawnSync('git', ['-C', APP, 'cat-file', '-p', spec], { encoding: 'buffer', maxBuffer: 1024 * 1024 * 64 }); if (r.status !== 0) throw new Error('git cat-file 실패: ' + spec); return r.stdout; }
const blob = spec => blobBuf(spec).toString('utf8');
function runGen(dir, cfg, gen) {
  const cfgFile = path.join(tmpRoot, 'cfg-' + Math.random().toString(16).slice(2) + '.json');
  fs.writeFileSync(cfgFile, JSON.stringify(cfg), { encoding: 'utf8' });
  try { fs.unlinkSync(META); } catch (_) { /* 없으면 그만 */ }
  const r = cp.spawnSync(process.execPath, [gen || GEN, dir, cfgFile], { encoding: 'utf8', env, maxBuffer: 1024 * 1024 * 64 });
  const meta = r.status === 0 && fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : null;
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, meta, err: r.status === 0 ? null : ((r.stderr || '').split(/\r?\n/).find(l => /^Error: /.test(l)) || '').replace(/^Error: /, '') };
}
function record(id, title, ok, detail) { results.push({ id, title, ok: !!ok, detail }); console.log((ok ? 'ok  ' : 'FAIL'), id, title, ok ? '' : JSON.stringify(detail).slice(0, 900)); }
function makeDir(name, text) { const d = path.join(tmpRoot, name); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'index.html'), text, { encoding: 'utf8' }); return d; }
const read = d => fs.readFileSync(path.join(d, 'index.html'), 'utf8');
function firstDiff(a, b) { const al = a.split('\n'), bl = b.split('\n'); for (let i = 0; i < Math.max(al.length, bl.length); i++) if (al[i] !== bl[i]) return { line: i + 1, got: al[i], want: bl[i] }; return null; }
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
const LF = s => s.replace(/\r\n/g, '\n');
const cfgSweep = (sweep, extra) => Object.assign({ task: T, slot: 'HO', mode: 'sweep', cells: [{ file: 'js/core/cell-registry.js' }], sweep }, extra || {});
const cfgWire = unwire => ({ task: T, slot: 'HO', mode: 'unwire', cells: [{ file: 'js/core/cell-registry.js' }], unwire });

// ── 감사(생성기와 따로): 주석을 뺀 토큰열 동일 · 사라진 줄은 실행 글자가 없는 줄뿐 · 남은 줄은 그대로
function scriptOf(text) {
  const ls = text.split('\n').map(l => l.replace(/\r$/, ''));
  let s = -1, e = -1;
  for (let i = 0; i < ls.length; i++) if (ls[i].trim() === '<script>' && (ls[i + 1] || '').trim() === '(function(){' && (ls[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  for (let i = s; i < ls.length; i++) if (ls[i].startsWith('</script>')) { e = i; break; }
  const ast = parser.parse(ls.slice(s, e).join('\n'), { sourceType: 'script', tokens: true });
  const toks = ast.tokens.filter(t => typeof t.type !== 'string' && t.type.label !== 'eof');
  const codeLine = new Set(); for (const t of toks) for (let l = t.loc.start.line + s; l <= t.loc.end.line + s; l++) codeLine.add(l);
  return { ls, s, e, ast, sig: toks.map(t => (t.type.label || '') + ' ' + (t.value === undefined ? '' : String(t.value))), codeLine };
}
function audit(before, after) {
  const b = scriptOf(before), a = scriptOf(after);
  const removed = []; let j = 0;
  for (let i = 0; i < b.ls.length; i++) { if (j < a.ls.length && b.ls[i] === a.ls[j]) j++; else removed.push(i + 1); } // 앞에서부터 맞춘다 — 남은 줄의 글자·순서가 그대로면 after 를 다 쓴다
  const restSame = j === a.ls.length;
  const sameTokens = b.sig.length === a.sig.length && b.sig.every((v, i) => v === a.sig[i]);
  const removedWithCode = removed.filter(l => b.codeLine.has(l));
  const outside = removed.filter(l => l <= b.s || l > b.e);
  const sameEol = (before.includes('\r\n') ? 'CRLF' : 'LF') === (after.includes('\r\n') ? 'CRLF' : 'LF') || !after.includes('\n');
  return { ok: restSame && sameTokens && !removedWithCode.length && !outside.length && sameEol && a.ls.length === b.ls.length - removed.length, removed: removed.length, restSame, sameTokens, removedWithCode, outside, sameEol };
}
const audits = [];
const auditOf = (id, before, after) => { const r = audit(before, after); audits.push({ id, ok: r.ok, removed: r.removed, detail: r.ok ? undefined : r }); return r; };

// ── B: 앞선 단위 시험 전부(657 → 643 → 634 → 619 → B1)
if (!SKIP657) {
  const out = path.join(tmpRoot, 'fnargs657.json');
  const r = cp.spawnSync(process.execPath, [path.join(HARNESS, 'fn-arguments-check-657.js'), APP, out], { encoding: 'utf8', env: process.env, maxBuffer: 1024 * 1024 * 256 });
  const j = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
  const failed = j ? j.results.filter(x => !x.ok).map(x => x.id) : null, inner = j && (j.results.find(x => x.id === 'B') || {}), d1 = j && (j.results.find(x => x.id === 'D1') || {}).detail;
  const d1Structural = !!d1 && d1.removed.length === 1 && d1.modesSectionSame === true; // D1 의 나머지 조건(사라진 줄 하나 · unwire·unstate·region 구간 동일)은 여전히 참이고, 「새 줄이 #657 의 것뿐」만 거짓이다
  record('B', '함수 선언 arguments 시험 22건(#TASK-ES-657 — 구역 감싸기 67건 · 상태 이전 34건 · unwire 확장 16건 · B1 8건 재실행 포함)이 고친 생성기에서 D1 말고 모두 통과하고, 그 안 643 묶음은 D0 말고 모두 통과한다(둘 다 생성기 diff 의 모양 비교)',
    !!j && j.total === 22 && failed.every(id => id === 'D1') && inner.ok === true && d1Structural,
    { status: r.status, total: j && j.total, passed: j && j.passed, failed, region643: inner && inner.detail && { total: inner.detail.total, passed: inner.detail.passed, failed: inner.detail.failed, innerB: inner.detail.innerB }, d1: d1 && { removed: d1.removed.length, modesSectionSame: d1.modesSectionSame, addedCount: d1.addedCount }, stderr: (r.stderr || '').slice(0, 300) });
} else record('B', '앞선 단위 시험 재실행(--skip-657 로 건너뜀)', false, { skipped: true });

// ── D0: 생성기 diff = 한 자리에 끼워 넣은 줄뿐 · 검사기 바이트 동일
{
  const base = LF(blob(PIN + ':docs/design/harness/module-split/gen-inline-hard.js')).split('\n'), now = LF(fs.readFileSync(GEN, 'utf8')).split('\n');
  let a = 0; while (a < base.length && a < now.length && base[a] === now[a]) a++;
  let z = 0; while (z < base.length - a && z < now.length - a && base[base.length - 1 - z] === now[now.length - 1 - z]) z++;
  const inserted = now.length - base.length, block = now.slice(a, a + inserted);
  const verifySame = LF(blob(PIN + ':docs/design/harness/module-split/verify-inline-hard.js')) === LF(fs.readFileSync(VERIFY, 'utf8'));
  record('D0', '생성기 diff 는 한 자리에 끼워 넣은 줄뿐이다(기준 생성기의 줄은 하나도 바뀌지 않았다). 검사기는 기준과 같다',
    inserted > 0 && a + z === base.length && /^\/\/ ── \[#TASK-ES-661 /.test(now[a]) && block.some(l => l === "if (CFG.mode === 'sweep') { runSweep(); return; }") && block.filter(l => /^function /.test(l)).map(l => l.match(/^function (\w+)/)[1]).join(',') === 'runSweep,sweepOnce' && verifySame,
    { pin: PIN, baseLines: base.length, nowLines: now.length, inserted, commonHead: a, commonTail: z, firstInserted: (now[a] || '').slice(0, 60), verifySame });
}

// ── G*: 병합된 PR 셋 — 생성 결과 바이트 동일
for (const m of MERGED) {
  const detail = { pr: m.pr, mode: m.mode, commit: m.commit }; let ok = false;
  const base = extractTree(m.commit + '^1', m.id.toLowerCase() + '-base');
  if (base) {
    const cfg = JSON.parse(blob(m.commit + ':reports/' + m.task + '/proof.json'));
    const r = runGen(base, cfg); detail.genStatus = r.status; detail.stdout = (r.stdout || '').split('\n')[0].slice(0, 120); detail.err = r.err; ok = r.status === 0;
    if (ok) { detail.files = {}; for (const f of ['index.html', ...cfg.cells.map(c => c.file)]) { const gen = fs.readFileSync(path.join(base, f)), head = blobBuf(m.commit + ':' + f); const same = Buffer.compare(gen, head) === 0; detail.files[f] = { same, bytes: gen.length }; if (!same) ok = false; } }
  } else detail.archive = '실패';
  record(m.id, '고친 생성기가 #' + m.pr + '(' + m.task + ', ' + m.mode + ')의 기준 트리에서 같은 설정으로 index.html·세포 파일을 바이트 그대로 다시 만든다', ok, detail);
}

// ── 꾸러미(fixture)
const HEAD = ['<!doctype html>', '<html><head><title>fixture</title></head><body>', '<script src="js/core/app-scope.js"></script>', '<script>', '(function(){', '  "use strict";'];
const TAIL = ['})();', '</script>', '</body></html>', ''];
const doc = body => HEAD.concat(body, TAIL).join('\n');
const hdr = t => '  /* ============ ' + t + ' ============ */';
const moved = (n, f) => '  /* [#TASK-ES-000] ' + n + ' → js/x/' + f + '.js 로 옮김(시험 꾸러미) */';
// 묶음 가(문 있음) · 나(문 없음 — 옮김 표지 둘 · 빈 줄 · 그 밖의 주석 · 여러 줄 주석 · // 주석) · 다(문 있음, 주석·빈 줄 섞임) · 라(문 없음, 마지막)
const BODY = [
  hdr('묶음 가'),                                    // 0
  '  var a = 1; // 문 옆 주석',                      // 1
  '',                                                // 2
  hdr('묶음 나'),                                    // 3
  moved('f1 · f2', 'one'),                           // 4   ← 지움
  '',                                                // 5   ← 지움
  moved('f3', 'two'),                                // 6   ← 지움
  '  /* 그 밖의 주석 — 예전 설명 */',                // 7   ← 지움
  '  /* 여러 줄 주석',                               // 8   ← 지움
  '     둘째 줄',                                    // 9   ← 지움
  '     셋째 줄 */',                                 // 10  ← 지움
  '  // 줄 주석',                                    // 11  ← 지움
  '',                                                // 12  ← 지움
  hdr('묶음 다'),                                    // 13
  moved('g1', 'three'),                              // 14  (문이 있는 구획 — 남는다)
  '',                                                // 15
  '  function keepFn(){',                            // 16
  '    /* 함수 안 주석 */',                          // 17
  '',                                                // 18
  '    return a;',                                   // 19
  '  }',                                             // 20
  '  /* 문 뒤 주석 */',                              // 21
  '',                                                // 22
  hdr('묶음 라'),                                    // 23
  moved('h1', 'four'),                               // 24  ← 지움
  '',                                                // 25  ← 지움
];
const drop = (body, idx) => body.filter((_, i) => !idx.includes(i));
const W_IDX = [4, 5, 6, 7, 8, 9, 10, 11, 12, 24, 25];
function okCase(id, title, body, sweep, expectBody, extra) {
  const before = doc(body), d = makeDir(id.toLowerCase(), before);
  const r = runGen(d, cfgSweep(sweep)); const got = r.status === 0 ? read(d) : null, want = doc(expectBody);
  const au = got !== null ? auditOf(id, before, got) : { ok: false };
  const more = extra ? extra(r) : true;
  record(id, title, r.status === 0 && got === want && au.ok && more, { status: r.status, err: r.err, diffAt: got !== null && got !== want ? firstDiff(got, want) : null, audit: au.ok, deleted: r.meta && r.meta.deleted, kept: r.meta && r.meta.kept, skipped: r.meta && r.meta.emptyGroups && r.meta.emptyGroups.skipped });
  return r;
}
function stopCase(id, title, body, cfg, re) {
  const before = typeof body === 'string' ? body : doc(body), d = makeDir(id.toLowerCase(), before);
  const r = runGen(d, cfg);
  record(id, title, r.status !== 0 && re.test(r.err || '') && read(d) === before, { status: r.status, err: r.err, htmlSame: read(d) === before });
}

// W1: "all" — 문이 없는 구획 둘(가운데 · 마지막)의 주석·빈 줄을 모두 지운다. 구획 주석은 남는다
okCase('W1', '지움: "all" — 문이 없는 구획(가운데 · 마지막)의 「옮김」 표지 · 그 밖의 주석 · 여러 줄 주석 · // 주석 · 빈 줄을 지운다. 구획 주석과 다른 구획은 그대로', BODY, { groups: 'all' }, drop(BODY, W_IDX),
  r => r.meta.mode === 'sweep' && r.meta.deleted.lines === 11 && r.meta.deleted.commentLines === 8 && r.meta.deleted.blankLines === 3 && r.meta.deleted.comments === 6 && r.meta.deleted.commentLinesByKind.moved === 3 && r.meta.deleted.commentLinesByKind.other === 5
    && r.meta.emptyGroups.total === 2 && r.meta.emptyGroups.swept === 2 && r.meta.kept.length === 0 && r.meta.gapLinesBefore.header === 4 && r.meta.gapLinesAfter.header === 4 && r.meta.gapLinesAfter.moved === 1 && r.meta.htmlLinesAfter === r.meta.htmlLinesBefore - 11 && /sweep · groups 2 · lines 11/.test(r.stdout));
// W2: 제목 배열 — 그 구획만
okCase('W2', '지움: 제목 배열 — 가리킨 구획만 지우고 다른 빈 구획은 그대로', BODY, { groups: ['묶음 라'] }, drop(BODY, [24, 25]), r => r.meta.deleted.lines === 2 && r.meta.emptyGroups.total === 2 && r.meta.emptyGroups.swept === 1);
// W3: 연달아 빈 구획 · 구획 주석뿐인 구획 · 세 줄짜리 구획 주석
{
  const body = [hdr('가'), '  var a = 1;', '', '  /* ============ 나 — 세 줄짜리 구획 주석 ============', '     ① 설명 줄', '     ② 설명 줄 */', '', hdr('다'), hdr('라'), moved('x', 'x'), '', '', hdr('마'), '  a = 2;'];
  okCase('W3', '지움: 연달아 있는 빈 구획 · 구획 주석뿐인 구획(지울 줄 0 이어도 대상에 든다) · 여러 줄 구획 주석은 통째로 남는다', body, { groups: 'all' }, drop(body, [6, 9, 10, 11]),
    r => r.meta.emptyGroups.total === 3 && r.meta.emptyGroups.swept === 3 && r.meta.deleted.lines === 4 && r.meta.targets.map(t => t.headerLines).join(',') === '3,1,1' && r.meta.targets.map(t => t.deletedCommentLines + t.deletedBlankLines).join(',') === '1,0,3');
}
// W4: 같은 제목의 구획 주석 둘(둘 다 빈 구획) — 제목 배열이면 둘 다
{
  const body = [hdr('가'), '  var a = 1;', hdr('참고자료'), hdr('참고자료'), moved('x', 'x'), moved('y', 'y'), hdr('끝'), '  a = 2;'];
  okCase('W4', '지움: 같은 제목의 구획 주석이 둘이고 둘 다 문이 없으면 제목 하나로 둘 다 다룬다', body, { groups: ['참고자료'] }, drop(body, [4, 5]), r => r.meta.emptyGroups.swept === 2 && r.meta.deleted.lines === 2);
}
// W5: CRLF 줄 끝 보존
{
  const before = doc(BODY).replace(/\n/g, '\r\n'), d = makeDir('w5', before);
  const r = runGen(d, cfgSweep({ groups: 'all' })); const got = r.status === 0 ? fs.readFileSync(path.join(d, 'index.html'), 'utf8') : null, want = doc(drop(BODY, W_IDX)).replace(/\n/g, '\r\n');
  const au = got !== null ? auditOf('W5', before, got) : { ok: false };
  record('W5', '지움: 줄 끝이 CRLF 인 파일은 CRLF 그대로 쓴다', r.status === 0 && got === want && au.ok && !/[^\r]\n/.test(got), { status: r.status, err: r.err, audit: au.ok });
}
// W6: label 칸은 동작이 없다 · slot 이 없어도 된다
{
  const d1 = makeDir('w6a', doc(BODY)), d2 = makeDir('w6b', doc(BODY));
  const r1 = runGen(d1, cfgSweep({ groups: 'all', label: '읽는 사람용' }, { label: '맨 위 label' })), cfg2 = cfgSweep({ groups: 'all' }); delete cfg2.slot; const r2 = runGen(d2, cfg2);
  record('W6', '지움: label 칸(맨 위 · sweep)은 동작이 없고, slot 칸이 없어도 같은 결과다', r1.status === 0 && r2.status === 0 && read(d1) === doc(drop(BODY, W_IDX)) && read(d2) === read(d1), { status: [r1.status, r2.status], err: [r1.err, r2.err] });
}
// K1: keep — 그 글자를 담은 주석은 남는다
{
  const body = BODY.slice(); body[6] = '  /* [#TASK-ES-000] filterHarmfulWords → js/x/two.js 로 옮김(시험이 이 글자를 붙잡는다) */';
  okCase('K1', '남김: keep 의 글자를 담은 주석은 남고 나머지는 지운다. kept 에 사유가 적힌다', body, { groups: 'all', keep: ['filterHarmfulWords'] }, drop(body, W_IDX.filter(i => i !== 6)),
    r => r.meta.deleted.lines === 10 && r.meta.kept.length === 1 && r.meta.kept[0].why === 'keep: filterHarmfulWords' && r.meta.targets[0].keptComments === 1);
}
// K2: 지키는 주석과 줄을 나눠 쓰는 주석 · 여러 줄 주석이 keep 이면 통째로
{
  const body = BODY.slice(); body[7] = '  /* 그 밖의 주석 */ /* PIN_A 를 담은 주석 */'; body[9] = '     둘째 줄 PIN_B';
  okCase('K2', '남김: 지키는 주석과 한 줄을 나눠 쓰는 주석은 함께 남고(줄 단위로만 지운다), 여러 줄 주석이 keep 이면 세 줄 모두 남는다', body, { groups: ['묶음 나'], keep: ['PIN_A', 'PIN_B'] }, drop(body, [4, 5, 6, 11, 12]),
    r => r.meta.deleted.lines === 5 && r.meta.kept.length === 3 && r.meta.kept.map(k => k.why).sort().join('|') === 'keep: PIN_A|keep: PIN_B|지키는 주석과 같은 줄');
}
// K3: 구획 주석과 같은 줄의 주석
{
  const body = [hdr('가'), '  var a = 1;', hdr('나') + ' // 구획 주석 옆 주석', moved('x', 'x'), '', hdr('다'), '  a = 2;'];
  okCase('K3', '남김: 구획 주석과 같은 줄에 있는 주석은 그 줄째 남는다', body, { groups: 'all' }, drop(body, [3, 4]), r => r.meta.kept.length === 1 && r.meta.kept[0].why === '구획 주석과 같은 줄' && r.meta.deleted.lines === 2);
}
// P1 · P2: 제외 구획
{
  const body = [hdr('가'), '  var a = 1;', hdr('이음매 자리 구획'), '  /* [어려움 이음매 자리 H1] */', '  /* 표지 아래 설명 */', '', '  /* [어려움 이음매 자리 HO 기관] */', '', hdr('나'), moved('x', 'x'), '', hdr('다'), '  a = 2;'];
  okCase('P1', '제외: 자리 표지가 든 구획은 문이 없어도 통째로 건너뛴다(자리 표지 · 그 아래 주석 · 빈 줄 그대로). skipped 에 적힌다', body, { groups: 'all' }, drop(body, [9, 10]),
    r => r.meta.emptyGroups.total === 2 && r.meta.emptyGroups.swept === 1 && r.meta.emptyGroups.skipped.length === 1 && r.meta.emptyGroups.skipped[0].why === '자리 표지가 든 구획' && r.meta.gapLinesAfter.slot === 2);
  const body2 = [hdr('가'), '  var a = 1;', '  /* ============ [#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매 (설명) ============', '     ① 가져오기 */', '  /* 옛 가져오기 설명 */', '', hdr('나'), moved('x', 'x'), '', hdr('다'), '  a = 2;'];
  okCase('P2', '제외: 1차 이음매 구획은 문이 없어도 통째로 건너뛴다', body2, { groups: 'all' }, drop(body2, [7, 8]), r => r.meta.emptyGroups.skipped.length === 1 && r.meta.emptyGroups.skipped[0].why === '1차 이음매 구획' && r.meta.deleted.lines === 2);
}
// N1 · N2 · N3: 건드리지 않는 것
{
  const body = ['  /* 머리 주석 — 첫 구획 주석 앞 */', '', moved('m', 'm'), ''].concat(BODY);
  const r = okCase('N1', '그대로: 첫 구획 주석 앞(머리)의 주석·빈 줄은 다루지 않는다', body, { groups: 'all' }, drop(body, W_IDX.map(i => i + 4)), x => x.meta.deleted.lines === 11);
  const after = r.status === 0 ? read(path.join(tmpRoot, 'n1')).split('\n') : [];
  record('N2', '그대로: 문이 있는 구획의 「옮김」 표지 · 빈 줄 · 문 뒤 주석은 한 줄도 지워지지 않는다', ['  var a = 1; // 문 옆 주석', moved('g1', 'three'), '  /* 문 뒤 주석 */'].every(l => after.includes(l)) && r.meta && r.meta.gapLinesAfter.moved === 2, { has: after.length });
  record('N3', '그대로: 문 안의 주석·빈 줄(함수 본문)과 문 옆 주석은 그대로다', after.join('\n').includes(['  function keepFn(){', '    /* 함수 안 주석 */', '', '    return a;', '  }'].join('\n')), {});
}
// M1 · M2: 여러 실행
{
  const body = [hdr('가'), '  var _aKit = window.OurgoalAKit;', '  var keep = _aKit.keep;', '  keep();', hdr('나'), moved('alpha', 'a'), '  var alpha = _aKit.alpha;', '', hdr('다'), moved('z', 'z'), ''];
  const steps = [{ unwire: { kitVar: '_aKit', names: ['alpha'], exposeGetters: false, windowAssign: false } }, { groups: 'all' }];
  const dMulti = makeDir('m1-multi', doc(body)), dSeq = makeDir('m1-seq', doc(body));
  const m = runGen(dMulti, cfgSweep(steps));
  const seq = [runGen(dSeq, cfgWire(steps[0].unwire)), runGen(dSeq, cfgSweep(steps[1]))];
  const got = m.status === 0 ? read(dMulti) : null, expected = doc(drop(body, [5, 6, 7, 9, 10]));
  const au = got !== null ? audit(doc(drop(body, [6])), got) : { ok: false }; // sweep 단계의 감사(앞 단계 unwire 가 지운 줄을 뺀 문서 기준)
  record('M1', '여러 실행: 배열({ unwire } · sweep) 한 번 = 단계를 따로 차례로 돌린 결과(바이트 동일). unwire 가 가져오기 줄을 지워 문이 0 이 된 구획을 뒤 단계가 쓴다',
    m.status === 0 && seq.every(s => s.status === 0) && got === read(dSeq) && got === expected && au.ok && m.meta.runs.length === 2 && m.meta.runs.map(r => r.step).join(',') === 'unwire,sweep' && m.meta.runs[1].deleted.lines === 4,
    { status: m.status, err: m.err, seq: seq.map(s => [s.status, s.err]), sameSeq: got === read(dSeq), diffAt: got !== null && got !== expected ? firstDiff(got, expected) : null, audit: au.ok });
  const d2 = makeDir('m2', doc(body)); const before = read(d2);
  const bad = runGen(d2, cfgSweep([steps[0], { groups: ['없는 제목'] }]));
  record('M2', '여러 실행 원자성: 뒤 단계가 멈추면 index.html 을 쓰지 않는다(앞 단계의 삭제도 반영되지 않는다)', bad.status !== 0 && /\[sweep 실행 2\/2\] 구획 주석이 0개/.test(bad.err || '') && read(d2) === before, { status: bad.status, err: bad.err });
}
// S*: 정지
stopCase('S1', '정지: 제목 배열이 가리킨 구획에 문이 있다', BODY, cfgSweep({ groups: ['묶음 다'] }), /구획에 문이 1개 있다 — sweep 은 문이 없는 구획만 다룬다: 묶음 다/);
stopCase('S2', '정지: 제목에 맞는 구획 주석이 없다', BODY, cfgSweep({ groups: ['없는 제목'] }), /구획 주석이 0개: 없는 제목/);
stopCase('S3', '정지: 제목 배열이 자리 표지 구획을 가리킨다', [hdr('가'), '  var a = 1;', hdr('자리'), '  /* [어려움 이음매 자리 H1] */', '', hdr('다'), '  a = 2;'], cfgSweep({ groups: ['자리'] }), /sweep 이 다루지 않는 구획이다\(자리 표지가 든 구획\)/);
stopCase('S4', '정지: 구획 경계에 걸친 주석(다음 구획 주석과 줄을 나눠 쓰는 여러 줄 주석)', [hdr('가'), '  var a = 1;', hdr('나'), '  /* 걸친 주석', '     끝 */ ' + hdr('다').trim(), '  a = 2;'], cfgSweep({ groups: 'all' }), /구획 경계에 걸친 주석/);
stopCase('S5', '정지: 구획 주석 줄에서 시작해 아래로 이어지는 주석', [hdr('가'), '  var a = 1;', hdr('나') + ' /* 이어지는', '     주석 */', '', hdr('다'), '  a = 2;'], cfgSweep({ groups: 'all' }), /구획 주석 줄에서 시작해 아래로 이어지는 주석/);
stopCase('S6', '정지: 한 줄에 구획 주석이 둘이다', [hdr('가'), '  var a = 1;', hdr('나') + ' ' + hdr('다').trim(), moved('x', 'x'), hdr('라'), '  a = 2;'], cfgSweep({ groups: 'all' }), /한 줄에 구획 주석이 둘이다/);
stopCase('S7', '정지: keep 의 글자를 담은 주석이 대상 구획에 없다(오타 방지 — 문이 있는 구획의 주석에만 그 글자가 있는 경우 포함)', BODY, cfgSweep({ groups: 'all', keep: ['g1'] }), /sweep\.keep 의 글자를 담은 주석이 대상 구획에 없다: g1/);
stopCase('S8', '정지: 지울 줄이 0(빈 구획이 구획 주석뿐)', [hdr('가'), '  var a = 1;', hdr('나'), hdr('다'), '  a = 2;'], cfgSweep({ groups: 'all' }), /지울 줄이 0/);
stopCase('S9', '정지: 문이 없는 구획이 없다', [hdr('가'), '  var a = 1;', '', moved('x', 'x'), hdr('다'), '  a = 2;'], cfgSweep({ groups: 'all' }), /문이 없는 구획이 없다/);
stopCase('S10', '정지: keep 으로 전부 남으면 지울 줄이 0', [hdr('가'), '  var a = 1;', hdr('나'), moved('PIN_A', 'x'), hdr('다'), '  a = 2;'], cfgSweep({ groups: 'all', keep: ['PIN_A'] }), /지울 줄이 0/);
stopCase('S11', '정지: 맨 위 모르는 칸', BODY, cfgSweep({ groups: 'all' }, { unwire: { kitVar: '_aKit', names: ['a'] } }), /sweep 설정에 모르는 칸: unwire/);
stopCase('S12', '정지: sweep 의 모르는 칸(오타 — headers 를 지우라는 칸 같은 것은 없다)', BODY, cfgSweep({ groups: 'all', headers: true }), /sweep 설정에 모르는 칸: headers/);
stopCase('S13', '정지: groups 가 없다', BODY, cfgSweep({}), /sweep\.groups 는 "all" 이거나 구획 주석 제목의 배열이어야 한다/);
stopCase('S14', '정지: groups 가 빈 배열이다', BODY, cfgSweep({ groups: [] }), /sweep\.groups 는 "all" 이거나/);
stopCase('S15', '정지: groups 에 같은 제목이 두 번', BODY, cfgSweep({ groups: ['묶음 나', '묶음 나'] }), /같은 제목이 두 번/);
stopCase('S16', '정지: groups 의 두 제목이 같은 구획을 가리킨다', BODY, cfgSweep({ groups: ['묶음 나', '음 나'] }), /두 제목이 같은 구획을 가리킨다/);
stopCase('S17', '정지: groups 가 글자("all")도 배열도 아니다 · 줄 번호는 받지 않는다', BODY, cfgSweep({ groups: [4, 12] }), /sweep\.groups 는 "all" 이거나/);
stopCase('S18', '정지: keep 이 배열이 아니다', BODY, cfgSweep({ groups: 'all', keep: 'PIN' }), /sweep\.keep 은 비지 않은 글자의 배열/);
stopCase('S19', '정지: sweep 이 빈 배열이다', BODY, cfgSweep([]), /sweep 배열이 비었다/);
stopCase('S20', '정지: unwire 단계에 다른 칸이 있다', BODY, cfgSweep([{ unwire: { kitVar: '_aKit', names: ['a'] }, groups: 'all' }]), /unwire 단계에는 unwire 칸 하나만 둔다/);
stopCase('S21', '정지: 단일 객체 꼴에서는 unwire 칸을 받지 않는다', BODY, cfgSweep({ unwire: { kitVar: '_aKit', names: ['a'] } }), /sweep 설정에 모르는 칸: unwire/);

// ── R*: 실제 index.html(PIN) 모의 적용
{
  const real = extractTree(PIN, 'real');
  const before = real ? read(real) : null;
  // 이 시험이 따로 센 값(생성기와 다른 방법 — 줄 글자와 토큰 줄만으로): 구획 주석 줄 · 구획 범위 · 문이 걸친 줄
  const independent = text => {
    const sc = scriptOf(text), body = (sc.ast.program.body[0].expression.callee || sc.ast.program.body[0].expression.argument.callee).body;
    const stmtStart = body.body.map(n => n.loc.start.line + sc.s), inStmt = new Set();
    for (const n of body.body.concat(body.directives || [])) for (let l = n.loc.start.line + sc.s; l <= n.loc.end.line + sc.s; l++) inStmt.add(l);
    const last = sc.ast.program.body[0].loc.end.line + sc.s;
    const heads = []; // 문 밖에서 `/* ===` 로 시작하는 줄 = 구획 주석의 첫 줄. 끝 줄은 `*/` 가 나오는 줄
    for (let l = body.loc.start.line + sc.s + 1; l < last; l++) if (!inStmt.has(l) && /^\s*\/\*\s*=+/.test(sc.ls[l - 1])) { let e2 = l; while (!sc.ls[e2 - 1].includes('*/')) e2++; heads.push({ line: l, endLine: e2, title: sc.ls[l - 1] }); l = e2; }
    const groups = heads.map((h, i) => ({ ...h, end: i + 1 < heads.length ? heads[i + 1].line - 1 : last - 1 }));
    let candidates = 0, empty = 0, excluded = 0; const titles = [];
    for (const g of groups) {
      titles.push(g.title.trim());
      if (stmtStart.some(l => l >= g.line && l <= g.end)) continue;
      const lines = sc.ls.slice(g.line - 1, g.end);
      if (lines.some(t => t.includes('[어려움 이음매 자리 ') || t.includes('[#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매'))) { excluded++; continue; }
      empty++; candidates += g.end - g.endLine;
    }
    return { headers: heads.length, headerLines: heads.reduce((a, h) => a + h.endLine - h.line + 1, 0), empty, excluded, candidates, titles, stmtLines: inStmt.size, slotLines: sc.ls.filter(t => /^\s*\/\* \[어려움 이음매 자리 /.test(t)).length, statements: body.body.length };
  };
  const ib = before ? independent(before) : null;
  const r = real ? runGen(real, cfgSweep({ groups: 'all' })) : { status: -1 };
  const after = r.status === 0 ? read(real) : null, ia = after ? independent(after) : null;
  const au = after ? auditOf('R1', before, after) : { ok: false };
  record('R1', '실제 index.html(PIN) 모의 적용 "all": 성공 · 감사(토큰열 동일 · 사라진 줄은 실행 글자 없는 줄뿐 · 남은 줄 그대로) · 지운 줄 수 = 이 시험이 따로 센 대상 줄 수 · 구획 주석·자리 표지·문 줄 수·문 수 불변',
    r.status === 0 && au.ok && r.meta.deleted.lines === ib.candidates && au.removed === ib.candidates && r.meta.emptyGroups.swept === ib.empty && r.meta.emptyGroups.skipped.length === ib.excluded
      && ia.headers === ib.headers && ia.headerLines === ib.headerLines && ia.slotLines === ib.slotLines && ia.stmtLines === ib.stmtLines && ia.statements === ib.statements && JSON.stringify(ia.titles) === JSON.stringify(ib.titles) && ia.candidates === 0
      && r.meta.gapLinesAfter.header === r.meta.gapLinesBefore.header && r.meta.gapLinesAfter.slot === r.meta.gapLinesBefore.slot && r.meta.gapLinesAfter.genHead === r.meta.gapLinesBefore.genHead,
    { pin: PIN, status: r.status, err: r.err, stdout: (r.stdout || '').trim().split('\n'), audit: au, independentBefore: ib && { headers: ib.headers, headerLines: ib.headerLines, empty: ib.empty, excluded: ib.excluded, candidates: ib.candidates, slotLines: ib.slotLines, stmtLines: ib.stmtLines, statements: ib.statements },
      independentAfter: ia && { headers: ia.headers, headerLines: ia.headerLines, empty: ia.empty, candidates: ia.candidates, slotLines: ia.slotLines, stmtLines: ia.stmtLines, statements: ia.statements },
      meta: r.meta && { emptyGroups: { total: r.meta.emptyGroups.total, swept: r.meta.emptyGroups.swept, skipped: r.meta.emptyGroups.skipped }, deleted: r.meta.deleted, kept: r.meta.kept, gapLinesBefore: r.meta.gapLinesBefore, gapLinesAfter: r.meta.gapLinesAfter, vanishedWords: r.meta.vanishedWords.length, htmlLines: [r.meta.htmlLinesBefore, r.meta.htmlLinesAfter] } });
  // R2: 지도 도구가 쓸고 난 사본에서도 돈다(묶음 수·제목 동일)
  {
    const base = extractTree(PIN, 'real-base');
    const tool = (dir, script, args) => cp.spawnSync(process.execPath, [path.join(dir, 'scripts', script), '--root', dir].concat(args || []), { encoding: 'utf8', cwd: dir, env: process.env, maxBuffer: 1024 * 1024 * 64 });
    const mapOf = dir => { const t = tool(dir, 'inline-script-map.js', ['--write']); let j = null; try { j = JSON.parse(fs.readFileSync(path.join(dir, 'docs', 'architecture', 'inline-script-map.json'), 'utf8')); } catch (_) { /* 못 읽으면 null */ } return { status: t.status, stderr: (t.stderr || '').slice(0, 200), groups: j && (j.groups || j.bundles || []).map(g => g.title || g.name || g.id) }; };
    const mb = base ? mapOf(base) : { status: -1 }, mw = after ? mapOf(real) : { status: -1 };
    const tb = base ? tool(base, 'inline-hard-types.js') : { status: -1 }, tw = after ? tool(real, 'inline-hard-types.js') : { status: -1 };
    record('R2', '지도 도구(scripts/inline-script-map.js --write · inline-hard-types.js)가 쓸고 난 사본에서도 돌고, 지도의 묶음 수와 제목 순서가 기준과 같다',
      mb.status === 0 && mw.status === 0 && Array.isArray(mb.groups) && mb.groups.length > 0 && JSON.stringify(mb.groups) === JSON.stringify(mw.groups) && tb.status === 0 && tw.status === 0,
      { map: { status: [mb.status, mw.status], groups: [mb.groups && mb.groups.length, mw.groups && mw.groups.length], stderr: [mb.stderr, mw.stderr] }, types: { status: [tb.status, tw.status], stderr: [(tb.stderr || '').slice(0, 200), (tw.stderr || '').slice(0, 200)] } });
  }
  // R3: 한 번 더 돌리면 멈춘다(남은 빈 구획은 구획 주석뿐)
  if (after) { const again = runGen(real, cfgSweep({ groups: 'all' })); record('R3', '쓸고 난 사본에 한 번 더 돌리면 「지울 줄이 0」으로 멈추고 index.html 은 그대로다', again.status !== 0 && /지울 줄이 0/.test(again.err || '') && read(real) === after, { status: again.status, err: again.err }); }
  else record('R3', '쓸고 난 사본 재실행', false, { skipped: true });
  // R4: keep 하나 — 그 주석만 남는다
  {
    const d = extractTree(PIN, 'real-keep');
    const first = r.meta && r.meta.removedLines.map(l => before.split('\n')[l - 1]).find(t => /로 옮김/.test(t));
    const word = first && (first.match(/\] ([A-Za-z_$][\w$]*)/) || [])[1];
    const k = d && word ? runGen(d, cfgSweep({ groups: 'all', keep: [word] })) : { status: -1 };
    const got = k.status === 0 ? read(d) : null;
    record('R4', '실제 index.html 에 keep 글자 하나를 주면 그 글자를 담은 주석 줄만 더 남고 나머지는 같다', k.status === 0 && k.meta.kept.length >= 1 && k.meta.deleted.lines === r.meta.deleted.lines - k.meta.kept.length && k.meta.kept.every(x => x.why === 'keep: ' + word) && auditOf('R4', before, got).ok && got.split('\n').filter(t => t === first).length === 1,
      { word, status: k.status, err: k.err, kept: k.meta && k.meta.kept.length, deleted: k.meta && k.meta.deleted.lines });
  }
}
// ── A: 감사 모음
record('A', '감사: 성공한 꾸러미와 실제 index.html 전부에서 주석을 뺀 토큰열이 이전과 같고, 사라진 줄은 실행 글자가 없는 줄뿐이며, 남은 줄의 글자·순서가 그대로다(생성기와 따로 다시 파싱)', audits.length >= 12 && audits.every(a => a.ok), { count: audits.length, failed: audits.filter(a => !a.ok), removedByCase: Object.fromEntries(audits.map(a => [a.id, a.removed])) });

const passed = results.filter(r => r.ok).length;
const out = { tool: 'docs/design/harness/module-split/sweep-check-661.js', type: '작업자 측정, 판정 아님', pin: PIN, total: results.length, passed, ok: passed === results.length, results };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log('\n' + passed + '/' + results.length + ' 통과' + (passed === results.length ? '' : ' · 실패: ' + results.filter(r => !r.ok).map(r => r.id).join(', ')));
try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ }
process.exit(passed === results.length ? 0 : 1);
