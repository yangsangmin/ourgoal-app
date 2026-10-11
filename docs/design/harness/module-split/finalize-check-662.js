'use strict';
// 생성기 「마지막」 모드(mode:"finalize" — docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5절 닫힌 목록 X9, #TASK-ES-662) 단위 시험. 작업자 측정, 판정 아님.
// 저장소 밖 임시 폴더에서 생성기를 자식 프로세스로 돌리고 결과를 맞댄다. 저장소의 index.html 은 건드리지 않는다.
//  B     빈 구획 쓸기 시험 47건(sweep-check-661.js — 그 안에서 함수 선언 arguments 22건 · 구역 감싸기 67건 · 상태 이전 34건 · unwire 확장 16건 · B1 8건, 병합된 unwire·unstate·옮기기 PR 재생성이 다시 돈다)을 고친 생성기로 다시 돌린다.
//        그 묶음의 D0(「생성기 diff 가 한 자리에 끼워 넣은 #661 줄뿐」)과 안쪽 657 의 D1 · 643 의 D0 는 생성기 diff 의 모양 비교라 줄을 더하면 구조적으로 거짓이 된다(경험칙 L110). 그 셋 말고 실패가 없어야 한다.
//  D0    생성기 diff(기준 = PIN 커밋)가 한 자리에 끼워 넣은 줄뿐이다(기준의 줄은 하나도 바뀌지 않았다). 검사기는 기준과 바이트 동일.
//  F1~F6 전제를 채운 꼴: 손잡이 하나·가져오기 둘·호출 둘(주석 · 빈 줄 · 구획 주석 · 자리 표지 섞임) / 손잡이 여럿 · `window.A.b` 손잡이 · 같은 함수를 두 번 부름 · 호출 줄 옆 주석 · 여러 줄에 걸친 문 /
//        CRLF 줄 끝 보존(부팅 파일은 LF) / 다른 인라인 스크립트 블록(앞 · 뒤) 그대로 / label·slot / 지운 자리 뒤의 글자 그대로. 부팅 파일과 index.html 의 글자를 통째로 맞댄다.
//  E1·E2 실행 등가(vm): 이전 인라인 IIFE 글자와 만든 부팅 파일을 같은 가짜 키트 위에서 돌려 호출 순서 · 호출 수 · 각 호출의 this · 인자 수가 같다 / 가져오기 시점 값 고정(부팅 파일이 가져온 뒤 키트 속성을 바꿔 끼워도 가져온 값이 불린다 — IIFE 와 같다).
//  S*    정지(전부 index.html 바이트 그대로 · 부팅 파일 없음): 전제 미충족 종류마다(함수 선언 · expose 문 · 상태 선언 · 그 밖의 var · window 대입 · if · try · 인자 있는 호출 · 키트 경유 호출 · 가져오지 않은 이름 호출 ·
//        호출되지 않는 가져오기 · 쓰이지 않는 손잡이 · 이름이 다른 가져오기 · 계산된 속성 손잡이 · let 선언) · 호출문 없음 · 같은 이름 둘 · 껍데기 줄의 다른 글자(`})();` · `</script>` · `"use strict";`) ·
//        IIFE 밖의 문 · 앞 줄이 script 태그가 아님 · 부팅 파일이 이미 있음 · index.html 에 부팅 파일 글자가 이미 있음 · cells 꼴(둘 · 다른 경로 · 모르는 칸 · title 없음 · desc 에 주석 닫는 글자) · 맨 위 모르는 칸.
//  R1    실제 index.html(PIN 커밋): 전제 미충족으로 멈추고(종류별 수가 오류 글자에 적힌다) index.html 은 그대로 · 부팅 파일 없음.
//  R2    한 번 돌린 결과에 다시 돌리면 멈추고 아무것도 바뀌지 않는다.
//  A     감사(성공한 꾸러미 전부 — 생성기와 따로): 부팅 파일의 토큰열(주석 제외) = 이전 IIFE 스크립트의 토큰열 · 새 index.html = 이전에서 IIFE 블록 줄을 빼고 앞 줄 끝에 태그 한 개를 붙인 것 · 부팅 태그에 defer·async 없음.
//  L     (기록) 법정 모듈 로드 탐침의 loadOne 이 부팅 파일을 단독으로 읽은 결과를 그대로 싣는다 — 부팅 파일은 키트가 있어야 도는 파일이다.
// 사용: NODE_PATH=<node_modules> node finalize-check-662.js <APP_DIR(작업 트리)> <out.json> [--skip-661]
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), vm = require('vm');
const parser = require('@babel/parser');
const [APP_ARG, OUT] = process.argv.slice(2);
const SKIP661 = process.argv.includes('--skip-661');
const APP = path.resolve(APP_ARG);
const HARNESS = path.join(APP, 'docs', 'design', 'harness', 'module-split');
const GEN = path.join(HARNESS, 'gen-inline-hard.js'), VERIFY = path.join(HARNESS, 'verify-inline-hard.js');
const PIN = 'ed20750cc1d0079c4c185cca2afb8a6d1e3192a4'; // 기준 커밋(#932 병합) — 기준 생성기와 실제 index.html 을 여기서 읽는다(main 이 움직여도 같은 입력)
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'finalize-662-'));
const results = [];
const env = { ...process.env, MODULE_SPLIT_OUT: tmpRoot };
const META = path.join(tmpRoot, 'gen-inline-hard-meta.json');
const T = 'TASK-662-UNIT', BOOT = 'js/app/boot.js', BOOT_TAG = '<script src="js/app/boot.js"></script>';
function blobBuf(spec) { const r = cp.spawnSync('git', ['-C', APP, 'cat-file', '-p', spec], { encoding: 'buffer', maxBuffer: 1024 * 1024 * 64 }); if (r.status !== 0) throw new Error('git cat-file 실패: ' + spec); return r.stdout; }
const blob = spec => blobBuf(spec).toString('utf8');
function runGen(dir, cfg) {
  const cfgFile = path.join(tmpRoot, 'cfg-' + Math.random().toString(16).slice(2) + '.json');
  fs.writeFileSync(cfgFile, JSON.stringify(cfg), { encoding: 'utf8' });
  try { fs.unlinkSync(META); } catch (_) { /* 없으면 그만 */ }
  const r = cp.spawnSync(process.execPath, [GEN, dir, cfgFile], { encoding: 'utf8', env, maxBuffer: 1024 * 1024 * 64 });
  const meta = r.status === 0 && fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : null;
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, meta, err: r.status === 0 ? null : ((r.stderr || '').split(/\r?\n/).find(l => /^(Error|TypeError|SyntaxError): /.test(l)) || '').replace(/^Error: /, '') };
}
function record(id, title, ok, detail) { results.push({ id, title, ok: !!ok, detail }); console.log((ok ? 'ok  ' : 'FAIL'), id, title, ok ? '' : JSON.stringify(detail).slice(0, 900)); }
function makeDir(name, text) { const d = path.join(tmpRoot, name); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'index.html'), text, { encoding: 'utf8' }); return d; }
const read = d => fs.readFileSync(path.join(d, 'index.html'), 'utf8');
const bootOf = d => (fs.existsSync(path.join(d, BOOT)) ? fs.readFileSync(path.join(d, BOOT), 'utf8') : null);
function firstDiff(a, b) { const al = String(a).split('\n'), bl = String(b).split('\n'); for (let i = 0; i < Math.max(al.length, bl.length); i++) if (al[i] !== bl[i]) return { line: i + 1, got: al[i], want: bl[i] }; return null; }
const LF = s => s.replace(/\r\n/g, '\n');
const CELL = { file: BOOT, title: 'OurGoal App Boot (부팅 — 구역 함수를 순서대로 부른다)', desc: ['구역 함수를 index.html 에 있던 순서 그대로 부른다.'] };
const cfgFin = extra => Object.assign({ task: T, mode: 'finalize', label: '시험 꾸러미', cells: [Object.assign({}, CELL)] }, extra || {});

// ── 꾸러미(fixture)
const PRE = ['<!doctype html>', '<html><head><title>fixture</title>', '<script>', '  window.analytics = 1; /* 접속 통계 조각 — 다른 인라인 블록 */', '</script>', '</head><body>',
  '<script src="js/core/app-scope.js"></script><script src="js/a/index.js"></script>', '<script src="js/a/one.js"></script><script src="js/b/two.js"></script>'];
const OPEN = ['<script>', '(function(){', '  "use strict";'];
const CLOSE = ['})();', '</script>'];
const POST = ['', '<script>', '/* ESC 키 처리기 — 다른 인라인 블록 */', "window.addEventListener('keydown', function(e) { if (e.key === 'Escape' && window.closeTop) window.closeTop(); });", '</script>', '</body></html>', ''];
const doc = (body, o) => (o && o.pre || PRE).concat(o && o.open || OPEN, body, o && o.close || CLOSE, o && o.post || POST).join('\n');
const docAfter = o => { const pre = (o && o.pre || PRE); return pre.slice(0, -1).concat([pre[pre.length - 1] + BOOT_TAG], o && o.post || POST).join('\n'); };
const bootText = (stmts, n, label) => ['/**', ' * ' + CELL.title, ' *', ' * ' + CELL.desc[0],
  ' * #' + T + '(' + (label || '시험 꾸러미') + '): index.html 인라인 IIFE 에 마지막까지 남아 있던 문(키트 손잡이 ' + n[0] + '개 · 구역 함수 가져오기 ' + n[1] + '개 · 구역 함수 호출 ' + n[2] + '개)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로, 같은 순서로 옮겼다.',
  ' * 주석·빈 줄은 옮기지 않았다. index.html 에는 큰 인라인 IIFE 가 더 없고, 그 자리(앞 태그 줄 끝)의 동기 script 태그가 이 파일을 부른다 — defer·async 를 붙이지 않는다(로드 순서가 곧 실행 순서다).',
  ' * 설계: docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5절 X9', ' */', '(function(){', '  "use strict";'].concat(stmts, ['})();', '']).join('\n');
const BODY1 = [
  '  /* ============ 머리 이음매 ============ */',
  '  var _aKit = window.OurgoalAKit;',
  '  /* [어려움 이음매 자리 HO 기관] */',
  '  /* [#TASK-ES-000] js/a/one.js — 가져오기 2개 */',
  '  var bootOne = _aKit.bootOne;',
  '  var bootTwo = _aKit.bootTwo;',
  '',
  '  /* ============ 묶음 가 ============ */',
  '  /* [#TASK-ES-000] f1 → js/x/one.js 로 옮김(시험 꾸러미) */',
  '  bootOne(); /* [#TASK-ES-000] 로드 중 구역(주석·빈 줄 포함 9줄) → js/a/one.js 의 bootOne 로 옮김 — 원래 자리에서 부른다 */',
  '',
  '  /* ============ 묶음 나 ============ */',
  '  bootTwo();',
  '  // 꼬리 주석',
];
const STM1 = ['  var _aKit = window.OurgoalAKit;', '  var bootOne = _aKit.bootOne;', '  var bootTwo = _aKit.bootTwo;', '  bootOne();', '  bootTwo();'];
const BODY2 = [
  '  var _aKit = window.OurgoalAKit;',
  '  var _xp = window.OurgoalBParts.x;',
  '  var bootOne = _aKit.bootOne;',
  '  var bootX = _xp.bootX;',
  '  var bootTwo =',
  '    _aKit.bootTwo;',
  '  bootOne();',
  '  bootX(); // 줄 주석',
  '  bootTwo();',
  '  bootOne();',
];
const STM2 = ['  var _aKit = window.OurgoalAKit;', '  var _xp = window.OurgoalBParts.x;', '  var bootOne = _aKit.bootOne;', '  var bootX = _xp.bootX;', '  var bootTwo =', '    _aKit.bootTwo;', '  bootOne();', '  bootX();', '  bootTwo();', '  bootOne();'];

// ── 감사(생성기와 따로)
const tokSig = code => parser.parse(code, { sourceType: 'script', tokens: true }).tokens.filter(t => typeof t.type !== 'string' && t.type.label !== 'eof').map(t => (t.type.label || '') + ' ' + (t.value === undefined ? '' : String(t.value)));
function inlineIife(text) { const ls = LF(text).split('\n'); let s = -1, e = -1; for (let i = 0; i < ls.length; i++) if (ls[i].trim() === '<script>' && (ls[i + 1] || '').trim() === '(function(){' && (ls[i + 2] || '').includes('"use strict"')) { s = i; break; } if (s < 0) return null; for (let i = s + 1; i < ls.length; i++) if (ls[i].startsWith('</script>')) { e = i; break; } return { ls, s, e, code: ls.slice(s + 1, e).join('\n') }; }
function audit(before, after, boot) {
  const b = inlineIife(before), a = LF(after).split('\n');
  const want = b.ls.slice(0, b.s - 1).concat([b.ls[b.s - 1] + BOOT_TAG], b.ls.slice(b.e + 1));
  const sameHtml = want.length === a.length && want.every((l, i) => l === a[i]);
  const bs = tokSig(b.code), gs = tokSig(boot);
  const sameTokens = bs.length === gs.length && bs.every((v, i) => v === gs[i]);
  const tags = LF(after).match(/<script[^>]*src="js\/app\/boot\.js"[^>]*>/g) || [];
  return { ok: sameHtml && sameTokens && tags.length === 1 && tags[0] === '<script src="js/app/boot.js">' && inlineIife(after) === null && !/\r/.test(boot), sameHtml, sameTokens, tokens: bs.length, tags, iifeLeft: inlineIife(after) !== null, removedLines: b.e - b.s + 1 };
}
const audits = [];
function okCase(id, title, body, o, stmts, n, extra) {
  const before = doc(body, o), d = makeDir(id.toLowerCase(), before);
  const r = runGen(d, o && o.cfg || cfgFin()); const got = r.status === 0 ? read(d) : null, boot = bootOf(d);
  const wantHtml = docAfter(o), wantBoot = bootText(stmts, n, o && o.label);
  const au = got !== null && boot !== null ? audit(before, got, boot) : { ok: false };
  audits.push({ id, ok: au.ok, removed: au.removedLines, tokens: au.tokens });
  const more = extra && r.status === 0 ? extra(r, d) : true;
  record(id, title, r.status === 0 && got === wantHtml && boot === wantBoot && au.ok && more, { status: r.status, err: r.err, htmlDiffAt: got !== null && got !== wantHtml ? firstDiff(got, wantHtml) : null, bootDiffAt: boot !== null && boot !== wantBoot ? firstDiff(boot, wantBoot) : null, audit: au, meta: r.meta && { statements: r.meta.statements, removed: r.meta.removed, tag: r.meta.tag, callOrder: r.meta.callOrder, files: r.meta.files } });
  return { r, d, before };
}
function stopCase(id, title, body, o, re, prep) {
  const before = typeof body === 'string' ? body : doc(body, o), d = makeDir(id.toLowerCase(), before);
  if (prep) prep(d);
  const hadBoot = bootOf(d);
  const r = runGen(d, o && o.cfg || cfgFin());
  record(id, title, r.status !== 0 && re.test(r.err || '') && read(d) === before && bootOf(d) === hadBoot, { status: r.status, err: r.err, htmlSame: read(d) === before, bootSame: bootOf(d) === hadBoot });
}

// ── B: 앞선 단위 시험 전부(661 → 657 → 643 → 634 → 619 → B1)
if (!SKIP661) {
  const out = path.join(tmpRoot, 'sweep661.json');
  const r = cp.spawnSync(process.execPath, [path.join(HARNESS, 'sweep-check-661.js'), APP, out], { encoding: 'utf8', env: process.env, maxBuffer: 1024 * 1024 * 256 });
  const j = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
  const failed = j ? j.results.filter(x => !x.ok).map(x => x.id) : null, inner = j && (j.results.find(x => x.id === 'B') || {}), d0 = j && (j.results.find(x => x.id === 'D0') || {}).detail;
  record('B', '빈 구획 쓸기 시험 47건(#TASK-ES-661 — 657 22건 · 643 67건 · 634 34건 · 619 16건 · B1 8건 · 병합된 PR 셋 재생성 포함)이 고친 생성기에서 D0 말고 모두 통과하고, 안쪽 657 은 D1 · 643 은 D0 말고 모두 통과한다(셋 다 생성기 diff 의 모양 비교)',
    !!j && j.total === 47 && failed.every(id => id === 'D0') && inner.ok === true && !!d0 && d0.commonHead + d0.commonTail === d0.baseLines && d0.verifySame === true,
    { status: r.status, total: j && j.total, passed: j && j.passed, failed, sweepD0: d0 && { inserted: d0.inserted, commonHead: d0.commonHead, commonTail: d0.commonTail, baseLines: d0.baseLines }, inner657: inner && inner.detail && { total: inner.detail.total, passed: inner.detail.passed, failed: inner.detail.failed, region643: inner.detail.region643 }, stderr: (r.stderr || '').slice(0, 300) });
} else record('B', '앞선 단위 시험 재실행(--skip-661 로 건너뜀)', false, { skipped: true });

// ── D0: 생성기 diff = 한 자리에 끼워 넣은 줄뿐 · 검사기 바이트 동일
{
  const base = LF(blob(PIN + ':docs/design/harness/module-split/gen-inline-hard.js')).split('\n'), now = LF(fs.readFileSync(GEN, 'utf8')).split('\n');
  let a = 0; while (a < base.length && a < now.length && base[a] === now[a]) a++;
  let z = 0; while (z < base.length - a && z < now.length - a && base[base.length - 1 - z] === now[now.length - 1 - z]) z++;
  const inserted = now.length - base.length, block = now.slice(a, a + inserted);
  const verifySame = LF(blob(PIN + ':docs/design/harness/module-split/verify-inline-hard.js')) === LF(fs.readFileSync(VERIFY, 'utf8'));
  record('D0', '생성기 diff 는 한 자리에 끼워 넣은 줄뿐이다(기준 생성기의 줄은 하나도 바뀌지 않았다). 검사기는 기준과 같다',
    inserted > 0 && a + z === base.length && /^\/\/ ── \[#TASK-ES-662 /.test(now[a]) && block.some(l => l === "if (CFG.mode === 'finalize') { runFinalize(); return; }") && block.filter(l => /^function /.test(l)).map(l => l.match(/^function (\w+)/)[1]).join(',') === 'runFinalize' && verifySame,
    { pin: PIN, baseLines: base.length, nowLines: now.length, inserted, commonHead: a, commonTail: z, firstInserted: (now[a] || '').slice(0, 60), verifySame });
}

// ── F: 전제를 채운 꼴
const f1 = okCase('F1', '옮김: 손잡이 하나 · 가져오기 둘 · 호출 둘(구획 주석 · 자리 표지 · 「옮김」 표지 · 호출 줄 옆 주석 · 빈 줄 섞임) → 부팅 파일에 문만 같은 순서로, index.html 은 IIFE 블록이 사라지고 앞 줄 끝에 동기 태그 하나',
  BODY1, null, STM1, [1, 2, 2], r => r.meta.mode === 'finalize' && r.meta.statements.total === 5 && r.meta.removed.lines === BODY1.length + 5 && r.meta.removed.shell === 5 && r.meta.removed.statementLines === 5 && r.meta.removed.commentLines === 7 && r.meta.removed.blankLines === 2
    && r.meta.callOrder.join(',') === 'bootOne,bootTwo' && r.meta.tag.text === BOOT_TAG && r.meta.tag.sync === true && r.meta.tag.line === PRE.length && r.meta.files[BOOT] === 8 + 2 + 5 + 1 && r.meta.htmlLinesAfter === r.meta.htmlLinesBefore - (BODY1.length + 5) && /finalize · handles 1 · imports 2 · calls 2/.test(r.stdout));
okCase('F2', '옮김: 손잡이 둘(`window.A` · `window.A.b`) · 여러 줄에 걸친 가져오기 · 같은 구역 함수를 두 번 부름 · 호출 줄 옆 // 주석 → 문은 글자 그대로(여러 줄 문 포함), 주석만 빠진다', BODY2, null, STM2, [2, 3, 4],
  r => r.meta.handles.map(h => h.name + '=' + h.kit + ':' + h.imports).join(',') === '_aKit=OurgoalAKit:2,_xp=OurgoalBParts.x:1' && r.meta.callOrder.join(',') === 'bootOne,bootX,bootTwo,bootOne');
{ // F3: CRLF
  const before = doc(BODY1).replace(/\n/g, '\r\n'), d = makeDir('f3', before);
  const r = runGen(d, cfgFin()); const got = r.status === 0 ? read(d) : null, boot = bootOf(d);
  const au = got !== null && boot !== null ? audit(before, got, boot) : { ok: false }; audits.push({ id: 'F3', ok: au.ok, removed: au.removedLines, tokens: au.tokens });
  record('F3', '옮김: 줄 끝이 CRLF 인 index.html 은 CRLF 그대로 쓰고, 부팅 파일은 LF 로 쓴다(다른 세포 파일과 같다)', r.status === 0 && got === docAfter().replace(/\n/g, '\r\n') && boot === bootText(STM1, [1, 2, 2]) && au.ok && !/[^\r]\n/.test(got), { status: r.status, err: r.err, audit: au });
}
{ // F4: 다른 인라인 블록 그대로
  const after = f1.r.status === 0 ? read(f1.d) : '';
  record('F4', '그대로: 다른 인라인 스크립트 블록(앞의 접속 통계 조각 · 뒤의 ESC 키 처리기)과 그 밖의 줄은 한 글자도 바뀌지 않는다. 인라인 `<script>` 줄 수는 3 → 2', after.includes(PRE.slice(2, 5).join('\n')) && after.includes(POST.slice(1, 5).join('\n')) && f1.before.split('\n').filter(l => l.trim() === '<script>').length === 3 && after.split('\n').filter(l => l.trim() === '<script>').length === 2, {});
}
okCase('F5', '옮김: label 이 없으면 기본 글자를 쓰고, slot 칸이 있어도 같은 결과다', BODY1, { cfg: (() => { const c = cfgFin({ slot: 'HO' }); delete c.label; return c; })(), label: '인라인 IIFE 마지막 정리' }, STM1, [1, 2, 2]);
okCase('F6', '옮김: IIFE 블록 바로 뒤에 다른 글자(빈 줄 없이 다음 태그)가 와도 그 줄은 그대로다', BODY1, { post: ['<div id="after"></div>', '</body></html>', ''] }, STM1, [1, 2, 2]);

// ── E: 실행 등가(vm)
{
  const runIn = (code, swapAfterImport) => {
    const log = []; const mk = name => function () { log.push(name + '|this=' + (this === undefined ? 'undefined' : typeof this) + '|args=' + arguments.length); };
    const win = { OurgoalAKit: { bootOne: mk('bootOne'), bootTwo: mk('bootTwo') }, OurgoalBParts: { x: { bootX: mk('bootX') } } };
    if (swapAfterImport) { let real = win.OurgoalAKit.bootOne, reads = 0; Object.defineProperty(win.OurgoalAKit, 'bootOne', { get() { reads++; return reads === 1 ? real : mk('SWAPPED'); } }); }
    let threw = null; try { vm.runInContext(code, vm.createContext({ window: win })); } catch (e) { threw = String(e && e.message || e); }
    return { log, threw };
  };
  const d = makeDir('e1', doc(BODY2)); const r = runGen(d, cfgFin());
  const inline = inlineIife(doc(BODY2)).code, boot = bootOf(d) || '';
  const a = runIn(inline), b = runIn(boot);
  record('E1', '실행 등가: 이전 인라인 IIFE 글자와 부팅 파일을 같은 가짜 키트 위에서 돌리면 호출 순서 · 호출 수 · 각 호출의 this(undefined) · 인자 수(0)가 같다', r.status === 0 && !a.threw && !b.threw && a.log.length === 4 && JSON.stringify(a.log) === JSON.stringify(b.log) && a.log.join(',') === 'bootOne|this=undefined|args=0,bootX|this=undefined|args=0,bootTwo|this=undefined|args=0,bootOne|this=undefined|args=0', { inline: a, boot: b });
  const a2 = runIn(inline, true), b2 = runIn(boot, true);
  record('E2', '실행 등가: 가져오기는 머리에서 한 번 값을 잡는다 — 키트 속성이 그 뒤에 바뀌어도 잡아 둔 값이 불린다(인라인 IIFE 와 부팅 파일이 같다. `window.키트.f()` 로 바꿔 쓰지 않은 까닭)', !a2.threw && !b2.threw && JSON.stringify(a2.log) === JSON.stringify(b2.log) && a2.log.every(x => !/SWAPPED/.test(x)) && a2.log.length === 4, { inline: a2, boot: b2 });
}

// ── S: 정지
const H3 = ['  var _aKit = window.OurgoalAKit;', '  var bootOne = _aKit.bootOne;'], C1 = ['  bootOne();'];
const pre = k => new RegExp('finalize 전제 미충족 — IIFE 최상위에 키트 손잡이·구역 함수 가져오기·구역 함수 호출문 밖의 문이 \\d+개 있다\\([^)]*' + k + ' 1');
stopCase('S1', '정지: 함수 선언이 남았다', H3.concat(['  function left(){ return 1; }'], C1), null, pre('함수 선언'));
stopCase('S2', '정지: expose 문이 남았다', H3.concat(["  window.OurgoalAppScope.expose('index.html', {", '    get bootOne(){ return bootOne; }', '  });'], C1), null, pre('expose 문'));
stopCase('S3', '정지: 상태 선언(define) 줄이 남았다', H3.concat(["  window.OurgoalAppState.define('counter', 0);"], C1), null, pre('상태 선언\\(define\\)'));
stopCase('S4', '정지: 그 밖의 var 가 남았다', H3.concat(['  var state = { a: 1 };'], C1), null, pre('그 밖의 var'));
stopCase('S5', '정지: window 대입이 남았다', H3.concat(['  window.bootOne = bootOne;'], C1), null, pre('window 대입'));
stopCase('S6', '정지: if 문이 남았다', H3.concat(["  if(typeof window !== 'undefined'){ window.FLAG = false; }"], C1), null, pre('if 문'));
stopCase('S7', '정지: try 문이 남았다', H3.concat(['  try{ bootOne(); }catch(e){}'], C1), null, pre('try 문'));
stopCase('S8', '정지: 인자를 넘기는 호출문', H3.concat(['  bootOne(1);']), null, pre('구역 함수가 아닌 호출문'));
stopCase('S9', '정지: 키트 경유 호출문(`_aKit.bootOne()` — 가져온 이름으로 부르지 않는다)', H3.concat(C1, ['  _aKit.bootOne();']), null, pre('구역 함수가 아닌 호출문'));
stopCase('S10', '정지: 가져오지 않은 이름을 부른다', H3.concat(C1, ['  other();']), null, pre('구역 함수가 아닌 호출문'));
stopCase('S11', '정지: 호출되지 않는 가져오기(재철거가 먼저다)', H3.concat(['  var dangling = _aKit.dangling;'], C1), null, pre('호출되지 않는 가져오기'));
stopCase('S12', '정지: 쓰이지 않는 손잡이', H3.concat(['  var _bKit = window.OurgoalBKit;'], C1), null, pre('쓰이지 않는 손잡이'));
stopCase('S13', '정지: 이름이 속성과 다른 가져오기', H3.concat(['  var alias = _aKit.bootTwo;', '  alias();'], C1), null, pre('이름이 다른 가져오기'));
stopCase('S14', '정지: 계산된 속성으로 읽는 손잡이 꼴', ["  var _aKit = window['OurgoalAKit'];", '  var bootOne = _aKit.bootOne;'].concat(C1), null, /finalize 전제 미충족/);
stopCase('S15', '정지: let 선언(손잡이·가져오기는 var 만)', ['  let _aKit = window.OurgoalAKit;', '  var bootOne = _aKit.bootOne;'].concat(C1), null, /finalize 전제 미충족/);
stopCase('S16', '정지: 호출문이 하나도 없다(빈 IIFE — 부를 것이 없는 부팅 파일은 만들지 않는다)', ['  /* 주석뿐 */', ''], null, /구역 함수 호출문이 없다/);
stopCase('S17', '정지: 같은 이름의 가져오기가 둘', H3.concat(['  var bootOne = _aKit.bootOne;'], C1), null, /같은 이름의 손잡이·가져오기가 둘이다: bootOne/);
stopCase('S18', '정지: `})();` 줄에 다른 글자가 있다', H3.concat(C1), { close: ['})(); // 끝', '</script>'] }, /`\}\)\(\);` 줄에 다른 글자가 있다/);
stopCase('S19', '정지: `</script>` 줄에 다른 글자가 있다', H3.concat(C1), { close: ['})();', '</script><div id="x"></div>'] }, /`<\/script>` 줄에 다른 글자가 있다/);
stopCase('S20', '정지: `"use strict";` 줄에 다른 글자가 있다', H3.concat(C1), { open: ['<script>', '(function(){', '  "use strict"; var early = 1;'] }, /`"use strict";` 줄에 다른 글자가 있다/);
stopCase('S21', '정지: 스크립트 블록에 IIFE 밖의 문이 있다', H3.concat(C1), { close: ['})();', 'window.tail = 1;', '</script>'] }, /`\}\)\(\);` 줄에 다른 글자가 있다|IIFE 밖의 문이 있다/);
stopCase('S22', '정지: IIFE 가 인자를 넘긴다', H3.concat(C1), { close: ['})(window);', '</script>'] }, /`\}\)\(\);` 줄에 다른 글자가 있다|인자를 받거나/);
stopCase('S23', '정지: `<script>` 앞 줄이 script 태그로 끝나지 않는다(부팅 태그를 붙일 자리가 없다)', H3.concat(C1), { pre: PRE.concat(['<div id="app"></div>']) }, /앞 줄이 script 태그로 끝나지 않는다/);
stopCase('S24', '정지: 부팅 파일이 이미 있다(덮어쓰지 않는다)', H3.concat(C1), null, /부팅 파일이 이미 있다: js\/app\/boot\.js/, d => { fs.mkdirSync(path.join(d, 'js', 'app'), { recursive: true }); fs.writeFileSync(path.join(d, BOOT), '/* 이미 있는 파일 */\n', { encoding: 'utf8' }); });
stopCase('S25', '정지: index.html 에 부팅 파일 글자가 이미 있다', H3.concat(C1), { pre: PRE.slice(0, -1).concat([PRE[PRE.length - 1] + BOOT_TAG]) }, /index\.html 에 이미 부팅 파일 글자가 있다/);
stopCase('S26', '정지: cells 가 둘이다', H3.concat(C1), { cfg: cfgFin({ cells: [Object.assign({}, CELL), { file: 'js/core/cell-registry.js' }] }) }, /cells 는 부팅 파일 하나여야 한다/);
stopCase('S27', '정지: 부팅 파일 경로가 정해진 것과 다르다', H3.concat(C1), { cfg: cfgFin({ cells: [Object.assign({}, CELL, { file: 'js/core/boot.js' })] }) }, /부팅 파일은 js\/app\/boot\.js 로 정해져 있다/);
stopCase('S28', '정지: 세포 설정의 모르는 칸(defer 같은 칸은 없다)', H3.concat(C1), { cfg: cfgFin({ cells: [Object.assign({}, CELL, { defer: true })] }) }, /finalize 세포 설정에 모르는 칸: defer/);
stopCase('S29', '정지: title 이 없다', H3.concat(C1), { cfg: cfgFin({ cells: [{ file: BOOT, desc: ['설명'] }] }) }, /title · desc\(비지 않은 글자의 배열\)가 없다/);
stopCase('S30', '정지: desc 에 주석을 닫는 글자가 있다', H3.concat(C1), { cfg: cfgFin({ cells: [Object.assign({}, CELL, { desc: ['닫는 글자 */ 포함'] })] }) }, /주석을 닫는 글자나 줄바꿈이 있다/);
stopCase('S31', '정지: 맨 위 모르는 칸(다른 모드의 칸을 섞지 않는다)', H3.concat(C1), { cfg: cfgFin({ sweep: { groups: 'all' } }) }, /finalize 설정에 모르는 칸: sweep/);

// ── R1: 실제 index.html(PIN) — 전제 미충족으로 멈춘다
{
  const before = LF(blob(PIN + ':index.html')), d = makeDir('r1', before);
  const r = runGen(d, cfgFin());
  const m = (r.err || '').match(/밖의 문이 (\d+)개 있다\((.*)\)\. 첫 문:/);
  record('R1', '실제 index.html(PIN): 전제 미충족으로 멈추고 종류별 수를 적는다. index.html 은 그대로이고 부팅 파일은 생기지 않는다', r.status !== 0 && !!m && Number(m[1]) > 0 && /함수 선언 1/.test(m[2]) && read(d) === before && bootOf(d) === null,
    { pin: PIN, status: r.status, count: m && Number(m[1]), kinds: m && m[2], htmlSame: read(d) === before });
}
// ── R2: 두 번 돌리면 멈춘다
{
  const d = makeDir('r2', doc(BODY1)); const one = runGen(d, cfgFin()); const html1 = read(d), boot1 = bootOf(d);
  const two = runGen(d, cfgFin());
  record('R2', '한 번 돌린 결과에 다시 돌리면 멈추고(큰 인라인 IIFE 가 더 없다) index.html · 부팅 파일이 그대로다', one.status === 0 && two.status !== 0 && read(d) === html1 && bootOf(d) === boot1, { status: [one.status, two.status], err: two.err });
}
// ── A: 감사 모음
record('A', '감사: 성공한 꾸러미 전부에서 부팅 파일의 토큰열(주석 제외)이 이전 IIFE 스크립트와 같고, 새 index.html 은 「이전 − IIFE 블록 줄 + 앞 줄 끝의 태그 하나」이며, 부팅 태그에 defer·async 가 없다(생성기와 따로 다시 파싱)', audits.length === 5 && audits.every(a => a.ok), { count: audits.length, cases: audits });
// ── L: (기록) 부팅 파일 단독 로드
{
  let res = null, err = null;
  try { const ml = require(path.join(APP, 'court', 'probes', 'module-load.js')); res = ml.loadOne(path.join(f1.d, BOOT)); } catch (e) { err = String(e && e.message || e); }
  record('L', '(기록) 법정 모듈 로드 탐침 loadOne 이 꾸러미의 부팅 파일을 단독으로 읽은 결과를 그대로 싣는다 — 부팅 파일은 키트가 로드된 뒤에만 도는 파일이다(결과가 ok 가 아니어도 이 항목은 실패가 아니다)', res !== null || err !== null, { loadOne: res, threw: err, note: '법정의 기본 탐침 범위(js/*.js)에 js/app/ 이 드는지는 실제 finalize PR 이 잰다' });
}

const passed = results.filter(r => r.ok).length;
const out = { tool: 'docs/design/harness/module-split/finalize-check-662.js', type: '작업자 측정, 판정 아님', pin: PIN, total: results.length, passed, ok: passed === results.length, results };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log('\n' + passed + '/' + results.length + ' 통과' + (passed === results.length ? '' : ' · 실패: ' + results.filter(r => !r.ok).map(r => r.id).join(', ')));
try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ }
process.exit(passed === results.length ? 0 : 1);
