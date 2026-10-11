'use strict';
// 생성기 「마지막」 모드의 명시적 옵션 keepGlobalConst(docs/architecture/CELL-REGISTRY-DESIGN.md 5.9절, #TASK-ES-687) 단위 시험. 작업자 측정, 판정 아님.
// 저장소 밖 임시 폴더에서 생성기를 자식 프로세스로 돌리고 결과를 맞댄다. 저장소의 index.html 은 건드리지 않는다.
//  P     앞선 단위 시험(finalize-check-681.js — relay · keepInline · dropDeadImport 89건)을 고친 생성기로 다시 돌린다. 빠른 판(--skip-prev)은 건너뛴다.
//        그 안의 P(더 앞선 묶음 재실행)는 알려진 한 건(unwire-check-b1.js T7 「측정불가」의 번짐 — 기준에서도 같다) 때문에 그 시험 스스로 가려 본다. 여기서는 681 의 종료 결과(전부 ok)만 본다.
//  D     생성기 diff(기준 = PIN 커밋)가 finalize 의 runFinalize 구간 안에만 있다 — 그 밖의 줄은 한 글자도 바뀌지 않았다. 검사기는 기준과 바이트 동일.
//  G*    옵션 없이 돌리면 기준 생성기와 같다: 같은 꾸러미(옵션 없음 · relay · keepInline · relay+keepInline · 정지 둘)를 기준 생성기(PIN 의 글자)와 고친 생성기로 돌려 index.html · 부팅 파일 · 표준 출력 · 메타 · 오류 글자가 전부 같다.
//  N*    keepGlobalConst 를 채운 꼴: 선언 둘 + 읽는 상태 선언(relay 와 함께) / 읽는 문이 없는 꼴 / 선언 하나 + defineVar / CRLF / 맨 앞·맨 뒤 자리 / 주석 속 같은 이름(걸리지 않는다).
//        남긴 줄은 원래 줄과 바이트 동일 · 순서 동일, 껍데기 없는 최상위 스크립트(`<script>` + 선언 줄 + `</script>`+태그), 나머지 문은 전부 부팅 파일에 원래 차례 그대로. 값 글자는 메타·표준 출력에 없다.
//  E1    실행 등가(vm): 원래 인라인 IIFE 와 「남긴 최상위 스크립트 → 부팅 파일」을 같은 가짜 키트 위에서 돌려 호출 순서 · 상태 선언 값 · 통로 중계 값이 같다. 남긴 이름은 전역이 된다.
//  E2    스크립트 경계(왜 이 옵션인가): 연결 만들기가 「약속」으로 알림을 미뤄 두는 가짜 라이브러리로, 스크립트 사이마다 밀린 약속을 비우는 조건(브라우저와 같다)에서 돌린다.
//        원래 IIFE = 수신기가 알림을 받는다 / keepInline 꼴(연결 만들기는 인라인 · 수신기 걸기는 부팅 파일) = 알림이 수신기보다 먼저 나가 버린다(동작이 달라진다) / keepGlobalConst 꼴 = 원래와 같다.
//  S*    정지(전부 index.html 바이트 그대로 · 부팅 파일 없음): keepInline 과 함께 · 설정 꼴 · 근거 · 지정이 하나로 안 정해짐 · 문자열 상수 선언이 아님 · 이름 꼴 · 한 줄을 혼자 쓰지 않음 · 연달아 있지 않음 ·
//        다시 대입 · 선언보다 앞에서 읽음 · 읽는 문을 readers 에 안 적음(전제 미충족) · readers 가 상태 선언이 아님 · readers 가 이름을 안 읽음 · 같은 전역 이름이 다른 스크립트(코드 · 문자열 · 파싱 못 함)나 index.html 다른 블록에 있음.
//  A     감사(성공한 꾸러미 전부 — 생성기와 따로): 원래 문 = 남긴 선언 + 옮긴 문(겹침 0) · 남긴 블록은 `<script>` + 원래 줄 그대로 + `</script>`+태그 · 블록에 괄호가 하나도 없다(호출 0) · 블록 밖 줄 그대로 · 부팅 태그 한 번(defer·async 없음).
//  X1    실제 index.html(PIN)과 실제 js 폴더: relay + keepGlobalConst 로 성공한다 — 인라인에는 선언 두 줄만(원래 줄과 바이트 동일), 전역 이름 검사 걸림 0. 저장소는 건드리지 않는다(임시 사본).
//  X2    한 번 돌린 결과에 다시 돌리면 멈춘다.   X3    실제 index.html: readers 를 빼면 전제 미충족으로 멈춘다(상태 선언 1).   X4    실제 index.html: relay 를 빼면 멈춘다.
// 사용: NODE_PATH=<node_modules> node finalize-check-687.js <APP_DIR(작업 트리)> <out.json> [--skip-prev]
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), vm = require('vm');
const parser = require('@babel/parser');
const [APP_ARG, OUT] = process.argv.slice(2);
const SKIP_PREV = process.argv.includes('--skip-prev');
const APP = path.resolve(APP_ARG);
const HARNESS = path.join(APP, 'docs', 'design', 'harness', 'module-split');
const GEN = path.join(HARNESS, 'gen-inline-hard.js'), VERIFY = path.join(HARNESS, 'verify-inline-hard.js');
const PIN = '8e3ed7f70c1ae9a46326e3ab076515055103894d'; // 기준 커밋(#958 병합) — 기준 생성기와 실제 index.html 을 여기서 읽는다(main 이 움직여도 같은 입력)
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'finalize-687-'));
const results = [];
const env = { ...process.env, MODULE_SPLIT_OUT: tmpRoot };
const META = path.join(tmpRoot, 'gen-inline-hard-meta.json');
const T = 'TASK-687-UNIT', BOOT = 'js/app/boot.js', BOOT_TAG = '<script src="js/app/boot.js"></script>';
function blobBuf(spec) { const r = cp.spawnSync('git', ['-C', APP, 'cat-file', '-p', spec], { encoding: 'buffer', maxBuffer: 1024 * 1024 * 64 }); if (r.status !== 0) throw new Error('git cat-file 실패: ' + spec); return r.stdout; }
const blob = spec => blobBuf(spec).toString('utf8');
const BASE_GEN = path.join(tmpRoot, 'gen-inline-hard.base.js');
fs.writeFileSync(BASE_GEN, blobBuf(PIN + ':docs/design/harness/module-split/gen-inline-hard.js'), { encoding: 'utf8' });
function runGen(dir, cfg, gen) {
  const cfgFile = path.join(tmpRoot, 'cfg-' + Math.random().toString(16).slice(2) + '.json');
  fs.writeFileSync(cfgFile, JSON.stringify(cfg), { encoding: 'utf8' });
  try { fs.unlinkSync(META); } catch (_) { /* 없으면 그만 */ }
  const r = cp.spawnSync(process.execPath, [gen || GEN, dir, cfgFile], { encoding: 'utf8', env, maxBuffer: 1024 * 1024 * 64 });
  const metaText = r.status === 0 && fs.existsSync(META) ? fs.readFileSync(META, 'utf8') : null;
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, meta: metaText ? JSON.parse(metaText) : null, metaText, err: r.status === 0 ? null : ((r.stderr || '').split(/\r?\n/).find(l => /^(Error|TypeError|SyntaxError): /.test(l)) || '').replace(/^Error: /, '') };
}
function record(id, title, ok, detail) { results.push({ id, title, ok: !!ok, detail }); console.log((ok ? 'ok  ' : 'FAIL'), id, title, ok ? '' : JSON.stringify(detail).slice(0, 1400)); }
function makeDir(name, text, files) { const d = path.join(tmpRoot, name); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'index.html'), text, { encoding: 'utf8' });
  for (const rel of Object.keys(files || {})) { const f = path.join(d, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, files[rel], { encoding: 'utf8' }); } return d; }
const read = d => fs.readFileSync(path.join(d, 'index.html'), 'utf8');
const bootOf = d => (fs.existsSync(path.join(d, BOOT)) ? fs.readFileSync(path.join(d, BOOT), 'utf8') : null);
function firstDiff(a, b) { const al = String(a).split('\n'), bl = String(b).split('\n'); for (let i = 0; i < Math.max(al.length, bl.length); i++) if (al[i] !== bl[i]) return { line: i + 1, got: al[i], want: bl[i] }; return null; }
const LF = s => s.replace(/\r\n/g, '\n');
const CELL = { file: BOOT, title: 'OurGoal App Boot (부팅 — 구역 함수를 순서대로 부른다)', desc: ['구역 함수를 index.html 에 있던 순서 그대로 부른다.'] };
const cfgFin = extra => Object.assign({ task: T, mode: 'finalize', label: '시험 꾸러미', cells: [Object.assign({}, CELL)] }, extra || {});
const RSN = '주인 세포가 798줄이라 등록 블록을 붙이면 800줄 상한을 넘는다(시험 꾸러미)';
const GRSN = '커밋 훅의 금지 패턴 규칙이 이 줄을 새 파일로 옮기는 것을 막는다 — 선언만 제자리에 남긴다(시험 꾸러미)';
const relay = (...names) => ({ relay: names.map(n => ({ name: n, reason: RSN })) });
const kgc = (statements, readers, more) => ({ keepGlobalConst: Object.assign({ statements, reason: GRSN }, readers ? { readers } : {}, more || {}) });

// ── 꾸러미(fixture)
const PRE = ['<!doctype html>', '<html><head><title>fixture</title>', '<script>', '  window.analytics = 1; /* 접속 통계 조각 — 다른 인라인 블록 */', '</script>', '</head><body>',
  '<script src="js/core/app-scope.js"></script><script src="js/a/index.js"></script>', '<script src="js/a/one.js?v=1"></script><script src="/js/b/two.js"></script><script src="https://cdn.example.invalid/lib.js"></script>'];
const OPEN = ['<script>', '(function(){', '  "use strict";'];
const CLOSE = ['})();', '</script>'];
const POST = ['', '<script>', '/* ESC 키 처리기 — 다른 인라인 블록 */', "window.addEventListener('keydown', function(e) { if (e.key === 'Escape' && window.closeTop) window.closeTop(); });", '</script>', '</body></html>', ''];
const doc = (body, o) => (o && o.pre || PRE).concat(OPEN, body, CLOSE, o && o.post || POST).join('\n');
const docAfterPlain = () => PRE.slice(0, -1).concat([PRE[PRE.length - 1] + BOOT_TAG], POST).join('\n');
const docAfterG = (keptLines, o) => (o && o.pre || PRE).concat(['<script>'], keptLines, ['</script>' + BOOT_TAG], o && o.post || POST).join('\n');
const L_URL = "  var SERVER_URL = 'https://example.invalid';", L_KEY = "  var SERVER_PUBLIC_KEY = 'public-key-0000';";
const L_DEF = "  window.OurgoalAppState.define('sb', (window.lib && typeof window.lib.createClient === 'function') ? window.lib.createClient(SERVER_URL, SERVER_PUBLIC_KEY) : null);";
const SP = ['var SERVER_URL', 'var SERVER_PUBLIC_KEY'], RP = ["window.OurgoalAppState.define('sb'"];
// 기본 꾸러미: 손잡이 2 · 중계 1 · 가져오기 3 · 테마 호출 → 선언 둘 → 연결 만들기 → 수신기 걸기 → 나머지
const B1 = ['  var _kit = window.Kit;', '  var _g = window.GKit;', "  window.OurgoalAppScope.expose('index.html', {", '    get relayed(){ return relayed; }', '  });', '  var relayed = _g.relayed;',
  '  var bootTheme = _kit.bootTheme;', '  var bootAuth = _kit.bootAuth;', '  var bootRest = _kit.bootRest;', '', '  /* ===== 구획 주석 ===== */', '  bootTheme(); /* 옮김 표지 */', '', L_URL, L_KEY, L_DEF,
  '  bootAuth(); /* 옮김 표지 */', '  bootRest();'];
const S1 = ['  var _kit = window.Kit;', '  var _g = window.GKit;', "  window.OurgoalAppScope.expose('index.html', {\n    get relayed(){ return relayed; }\n  });", '  var relayed = _g.relayed;',
  '  var bootTheme = _kit.bootTheme;', '  var bootAuth = _kit.bootAuth;', '  var bootRest = _kit.bootRest;', '  bootTheme();', L_DEF, '  bootAuth();', '  bootRest();'];
const head1 = n => ' * #' + T + '(시험 꾸러미): index.html 인라인 IIFE 에 마지막까지 남아 있던 문(키트 손잡이 ' + n[0] + '개 · 구역 함수 가져오기 ' + n[1] + '개 · 구역 함수 호출 ' + n[2] + '개)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로, 같은 순서로 옮겼다.';
const relayHead = names => [' * 통로 중계 ' + names.length + '개(' + names.join(' · ') + ')도 함께 옮겼다 — 등록 기관에 등록할 수 없는 이름의 가져오기 줄과 그 getter 를 담은 expose 문이다(생성기 설정 relay).'].concat(names.map(n => ' *   - ' + n + ': ' + RSN));
const readersHead = (k, names) => ' * 상태 선언 ' + k + '개도 함께 옮겼다 — index.html 에 남긴 전역 상수(' + names.join(' · ') + ')를 읽는 문이다(생성기 설정 keepGlobalConst.readers).';
const head2G = names => ' * 주석·빈 줄은 옮기지 않았다. index.html 에는 큰 인라인 IIFE 가 더 없고, 문자열 상수 선언 ' + names.length + '줄(' + names.join(' · ') + ')만 껍데기 없는 최상위 스크립트에 줄 그대로 남아 있다(생성기 설정 keepGlobalConst — ' + GRSN + '). 그 `</script>` 뒤의 동기 script 태그가 이 파일을 부르고 이 파일의 문이 그 전역 이름을 읽는다 — 나머지 문은 전부 이 파일 한 스크립트 안에서 이어서 돈다. defer·async 를 붙이지 않는다(로드 순서가 곧 실행 순서다).';
function bootTextG(stmts, n, o) {
  return ['/**', ' * ' + CELL.title, ' *', ' * ' + CELL.desc[0], head1(n)].concat(o.relay ? relayHead(o.relay) : [], o.readers ? [readersHead(o.readers, o.names)] : [],
    [head2G(o.names), ' * 설계: docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5절 X9 · 5.9절', ' */', '(function(){', '  "use strict";'], stmts, ['})();', '']).join('\n');
}

// ── 감사(생성기와 따로): 문 단위 토큰 서명
function iifeOf(text) {
  const ls = LF(text).split('\n'); let s = -1, e = -1;
  for (let i = 0; i < ls.length; i++) if (ls[i].trim() === '<script>' && (ls[i + 1] || '').trim() === '(function(){' && (ls[i + 2] || '').includes('"use strict"')) { s = i; break; }
  if (s < 0) return null;
  for (let i = s + 1; i < ls.length; i++) if (ls[i].startsWith('</script>')) { e = i; break; }
  return { ls, s, e, code: ls.slice(s + 1, e).join('\n') };
}
const sigToks = (ast, nodes) => { const toks = ast.tokens.filter(t => typeof t.type !== 'string' && t.type.label !== 'eof'); return nodes.map(n => toks.filter(t => t.start >= n.start && t.end <= n.end).map(t => (t.type.label || '') + ' ' + (t.value === undefined ? '' : String(t.value))).join('\u0001')); };
function stmtSigs(code) { const ast = parser.parse(code, { sourceType: 'script', tokens: true }); return sigToks(ast, ast.program.body[0].expression.callee.body.body); }
function auditG(before, after, boot) {
  const b = iifeOf(before), al = LF(after).split('\n');
  if (!b) return { ok: false, why: '원래 IIFE 없음' };
  const tagAt = al.findIndex(l => l === '</script>' + BOOT_TAG);
  if (tagAt < 0) return { ok: false, why: '태그 줄 없음' };
  let open = tagAt; while (open > 0 && al[open] !== '<script>') open--;
  const keptLines = al.slice(open + 1, tagAt);
  const orig = stmtSigs(b.code), bt = stmtSigs(boot);
  const kAst = parser.parse(keptLines.join('\n'), { sourceType: 'script', tokens: true }), kept = sigToks(kAst, kAst.program.body);
  const pick = seq => { const idx = []; let at = 0; for (const sg of seq) { while (at < orig.length && orig[at] !== sg) at++; if (at >= orig.length) return null; idx.push(at); at++; } return idx; };
  const kIdx = pick(kept), bIdx = pick(bt);
  const cover = !!kIdx && !!bIdx && new Set(kIdx.concat(bIdx)).size === orig.length && kIdx.length + bIdx.length === orig.length;
  const onlyConst = kAst.program.body.length > 0 && kAst.program.body.every(n => n.type === 'VariableDeclaration' && n.declarations.length === 1 && n.declarations[0].init && n.declarations[0].init.type === 'StringLiteral');
  const noParen = !/[()]/.test(keptLines.join('\n'));
  const origBlock = b.ls.slice(b.s, b.e + 1);
  let at = 0, linesOk = true; for (const l of keptLines) { while (at < origBlock.length && origBlock[at] !== l) at++; if (at >= origBlock.length) { linesOk = false; break; } at++; }
  const outside = al.slice(0, open).join('\n') === b.ls.slice(0, b.s).join('\n') && al.slice(tagAt + 1).join('\n') === b.ls.slice(b.e + 1).join('\n');
  const tags = LF(after).match(/<script[^>]*src="js\/app\/boot\.js"[^>]*>/g) || [];
  return { ok: cover && onlyConst && noParen && linesOk && outside && iifeOf(after) === null && tags.length === 1 && tags[0] === '<script src="js/app/boot.js">' && !/\r/.test(boot),
    statements: { orig: orig.length, kept: kept.length, boot: bt.length }, cover, onlyConst, noParen, linesOk, outside, noBigIife: iifeOf(after) === null, tags };
}
const audits = [];
function okCase(id, title, body, cfg, want, extra) {
  const before0 = doc(body, want.o), before = want.crlf ? before0.replace(/\n/g, '\r\n') : before0, d = makeDir(id.toLowerCase(), before, want.files);
  const r = runGen(d, cfg); const got = r.status === 0 ? read(d) : null, boot = bootOf(d);
  const wantHtml0 = docAfterG(want.keptLines, want.o), wantHtml = want.crlf ? wantHtml0.replace(/\n/g, '\r\n') : wantHtml0, wantBoot = bootTextG(want.stmts, want.n, want.head);
  const au = got !== null && boot !== null ? auditG(before, got, boot) : { ok: false };
  audits.push({ id, ok: au.ok, statements: au.statements });
  const noValue = r.status === 0 && !/example\.invalid|public-key-0000/.test((r.stdout || '') + (r.metaText || ''));
  const more = extra && r.status === 0 ? extra(r, d) : true;
  record(id, title, r.status === 0 && got === wantHtml && boot === wantBoot && au.ok && noValue && more, { status: r.status, err: r.err, htmlDiffAt: got !== null && got !== wantHtml ? firstDiff(LF(got), wantHtml0) : null, bootDiffAt: boot !== null && boot !== wantBoot ? firstDiff(boot, wantBoot) : null, audit: au, noValue, more, stdout: (r.stdout || '').split('\n').slice(0, 9) });
  return { r, d, before };
}
function stopCase(id, title, body, cfg, re, o) {
  const before = doc(body, o && o.o), d = makeDir(id.toLowerCase(), before, o && o.files);
  const r = runGen(d, cfg);
  record(id, title, r.status !== 0 && re.test(r.err || '') && read(d) === before && bootOf(d) === null, { status: r.status, err: r.err, want: String(re), htmlSame: read(d) === before, bootMade: bootOf(d) !== null });
}

// ── P: 앞선 단위 시험(681)을 고친 생성기로
if (!SKIP_PREV) {
  const out = path.join(tmpRoot, 'prev-681.json');
  const r = cp.spawnSync(process.execPath, [path.join(HARNESS, 'finalize-check-681.js'), APP, out], { encoding: 'utf8', env: process.env, maxBuffer: 1024 * 1024 * 256 });
  let j = null; try { j = JSON.parse(fs.readFileSync(out, 'utf8')); } catch (_) { /* 없으면 실패로 적는다 */ }
  const failed = j ? j.results.filter(x => !x.ok).map(x => x.id) : null;
  record('P', '앞선 단위 시험 89건(relay · keepInline · dropDeadImport — finalize-check-681.js)이 고친 생성기에서도 전부 통과한다', !!j && j.total === 89 && failed.length === 0, { exit: r.status, total: j && j.total, passed: j && j.passed, failed });
} else record('P', '앞선 단위 시험 재실행(--skip-prev 로 건너뜀)', false, { skipped: true });

// ── D: 생성기 diff 는 runFinalize 구간 안에만 있다 · 검사기 바이트 동일
{
  const base = LF(blob(PIN + ':docs/design/harness/module-split/gen-inline-hard.js')).split('\n'), now = LF(fs.readFileSync(GEN, 'utf8')).split('\n');
  const marks = ls => { const f0 = ls.indexOf('function runFinalize() {'), f1 = ls.findIndex((l, i) => i > f0 && /^\/\/ ── \[B1 · /.test(l)); return { f0, f1 }; };
  const mb = marks(base), mn = marks(now), same = (x, y) => x.length === y.length && x.every((l, i) => l === y[i]);
  const headSame = same(base.slice(0, mb.f0 + 1), now.slice(0, mn.f0 + 1)), tailSame = same(base.slice(mb.f1), now.slice(mn.f1));
  const verifySame = LF(blob(PIN + ':docs/design/harness/module-split/verify-inline-hard.js')) === LF(fs.readFileSync(VERIFY, 'utf8'));
  record('D', '생성기 diff 는 finalize 의 `runFinalize` 구간 안에만 있다 — 그 앞과 뒤의 줄은 기준과 글자가 같다. 검사기는 기준과 같다',
    mb.f0 > 0 && mb.f1 > mb.f0 && mn.f0 === mb.f0 && mn.f1 > mn.f0 && headSame && tailSame && verifySame, { base: mb, now: mn, headSame, tailSame, verifySame, addedLines: (mn.f1 - mn.f0) - (mb.f1 - mb.f0) });
}

// ── G: 옵션 없이는 기준 생성기와 같다
{
  const keepI = { keepInline: { statements: SP.concat(RP), reason: GRSN } };
  const packs = [
    ['옵션 없음(성공)', ['  var _kit = window.Kit;', '  var bootA = _kit.bootA;', '  var bootB = _kit.bootB;', '  /* 주석 */', '  bootA();', '', '  bootB();'], {}],
    ['relay(성공)', S1.filter(l => l !== L_DEF), relay('relayed')],
    ['keepInline(성공)', B1.filter(l => !/relayed|_g =|^\s{2}window\.OurgoalAppScope|^\s{2}\}\);$/.test(l)), keepI],
    ['relay + keepInline(성공)', B1, Object.assign(relay('relayed'), keepI)],
    ['정지: 전제 밖의 문(옵션 없음)', B1, {}],
    ['정지: 모르는 칸', B1, { keepLocalConst: 1 }],
  ];
  const rows = packs.map(([name, body, extra], i) => {
    const before = doc(body), a = makeDir('g-base-' + i, before), b = makeDir('g-new-' + i, before);
    const ra = runGen(a, cfgFin(extra), BASE_GEN), rb = runGen(b, cfgFin(extra));
    return { name, status: [ra.status, rb.status], same: ra.status === rb.status && read(a) === read(b) && bootOf(a) === bootOf(b) && ra.stdout === rb.stdout && ra.metaText === rb.metaText && ra.err === rb.err, err: rb.err };
  });
  record('G1', '옵션(keepGlobalConst)을 적지 않으면 기준 생성기와 결과가 같다 — 꾸러미 6개(성공 4 · 정지 2)의 index.html · 부팅 파일 · 표준 출력 · 메타 · 오류 글자',
    rows.every(r => r.same) && rows.slice(0, 4).every(r => r.status[1] === 0) && rows.slice(4).every(r => r.status[1] !== 0), rows);
}

// ── N: keepGlobalConst 를 채운 꼴
const bootStmts = body => { const code = OPEN.slice(1).concat(body, ['})();']).join('\n'), ast = parser.parse(code, { sourceType: 'script' }); return ast.program.body[0].expression.callee.body.body.map(n => '  ' + code.slice(n.start, n.end)); };
const without = (stmts, lines) => stmts.filter(t => !lines.includes(t));
const n1 = okCase('N1', '선언 둘 + 읽는 상태 선언, relay 와 함께 — 인라인에는 선언 두 줄만(껍데기 없음), 중계 · 테마 호출 · 연결 만들기 · 나머지는 전부 부팅 파일에 원래 차례 그대로. 표준 출력 4줄 · 메타 keptGlobalConst',
  B1, cfgFin(Object.assign(relay('relayed'), kgc(SP, RP))), { keptLines: [L_URL, L_KEY], stmts: without(bootStmts(B1), [L_URL, L_KEY]), n: [2, 3, 3], head: { relay: ['relayed'], readers: 1, names: ['SERVER_URL', 'SERVER_PUBLIC_KEY'] } },
  r => { const k = r.meta.keptGlobalConst, o = r.stdout.split('\n');
    return !!k && JSON.stringify(k.globalNames) === JSON.stringify(['SERVER_URL', 'SERVER_PUBLIC_KEY']) && k.statements.length === 2 && k.statements[0].valueLength === 23 && JSON.stringify(k.statements[0].readBy) === JSON.stringify([k.readers[0].line])
      && k.readers.length === 1 && k.readers[0].movedTo === BOOT && JSON.stringify(k.readers[0].reads) === JSON.stringify(['SERVER_URL', 'SERVER_PUBLIC_KEY']) && k.inline.iifeShell === false && k.inline.shellLines === 2 && k.boot.statements === 11 && k.boot.readers === 1
      && JSON.stringify(k.movedEarlierOver.calls) === JSON.stringify(['bootTheme']) && k.globalNameScan.scripts === 4 && k.globalNameScan.missing === 4 && k.globalNameScan.hits === 0 && r.meta.relayed[0].movedTo === BOOT && r.meta.removed.shell === 3 && r.meta.keptInline === undefined
      && o.filter(l => /^ {2}keepGlobalConst 「/.test(l)).length === 2 && o.filter(l => /^ {2}keepGlobalConst\(읽는 문\)/.test(l)).length === 1 && o.filter(l => /^ {2}keepGlobalConst\(전역 이름 검사\)/.test(l)).length === 1 && o.filter(l => /^ {2}relay /.test(l)).length === 1; });
{
  const body = ['  var _kit = window.Kit;', '  var bootA = _kit.bootA;', L_URL, '  bootA();'];
  okCase('N2', '읽는 문이 없는 선언 하나(readers 칸 없음) — 선언 한 줄만 남고 나머지는 부팅 파일로', body, cfgFin(kgc(['var SERVER_URL'])), { keptLines: [L_URL], stmts: without(bootStmts(body), [L_URL]), n: [1, 1, 1], head: { names: ['SERVER_URL'] } },
    r => r.meta.keptGlobalConst.readers.length === 0 && JSON.stringify(r.meta.keptGlobalConst.statements[0].readBy) === '[]');
  const L_DV = "  window.OurgoalAppState.defineVar('endpoint', SERVER_URL + '/v1');";
  const body3 = ['  var _kit = window.Kit;', '  var bootA = _kit.bootA;', '  var bootB = _kit.bootB;', L_URL, '  bootA();', L_DV, '  bootB();'];
  okCase('N3', '선언 하나 + 읽는 defineVar(선언과 읽는 문 사이에 호출문) — 맨 앞에 있지 않아도 된다', body3, cfgFin(kgc(['var SERVER_URL'], ["window.OurgoalAppState.defineVar('endpoint'"])), { keptLines: [L_URL], stmts: without(bootStmts(body3), [L_URL]), n: [1, 2, 2], head: { readers: 1, names: ['SERVER_URL'] } },
    r => JSON.stringify(r.meta.keptGlobalConst.movedEarlierOver.calls) === '[]' && r.meta.keptGlobalConst.movedEarlierOver.statements === 3);
  okCase('N4', 'CRLF 문서 — 줄 끝 글자를 지킨다(index.html 은 CRLF 그대로, 부팅 파일은 LF)', B1, cfgFin(Object.assign(relay('relayed'), kgc(SP, RP))), { crlf: true, keptLines: [L_URL, L_KEY], stmts: without(bootStmts(B1), [L_URL, L_KEY]), n: [2, 3, 3], head: { relay: ['relayed'], readers: 1, names: ['SERVER_URL', 'SERVER_PUBLIC_KEY'] } });
  const body5 = B1.filter(l => l !== L_URL && l !== L_KEY).concat([L_URL, L_KEY]); // 선언이 맨 뒤 — 읽는 문(연결 만들기)이 선언보다 앞이라 멈춰야 한다 → 정지 꾸러미로 쓴다(S17)
  void body5;
  const files = { 'js/a/one.js': '/* SERVER_URL 은 index.html 이 정한다 — 주석 속 글자 */\n// SERVER_PUBLIC_KEY\nwindow.One = 1;\n', 'js/b/two.js': 'window.Two = { url: "SERVER" + "_URL" };\n' };
  okCase('N5', '같은 이름이 다른 스크립트의 주석에만 있으면 걸리지 않는다(코드와 문자열만 본다) — 읽은 스크립트 2 · 없는 파일 2', B1, cfgFin(Object.assign(relay('relayed'), kgc(SP, RP))),
    { files, keptLines: [L_URL, L_KEY], stmts: without(bootStmts(B1), [L_URL, L_KEY]), n: [2, 3, 3], head: { relay: ['relayed'], readers: 1, names: ['SERVER_URL', 'SERVER_PUBLIC_KEY'] } },
    r => r.meta.keptGlobalConst.globalNameScan.scanned === 2 && r.meta.keptGlobalConst.globalNameScan.missing === 2);
}

// ── E1: 실행 등가(vm) · E2: 스크립트 경계
{
  const mkWin = (async) => {
    const log = [], state = {}, scope = {};
    const win = { __log: log, __state: state, __scope: scope };
    win.OurgoalAppState = { define: (n, v) => { log.push('D:' + n + ':' + (v === null ? 'null' : typeof v)); state[n] = v; }, defineVar: (n, v) => { log.push('DV:' + n); state[n] = v; } };
    win.OurgoalAppScope = { expose: (owner, obj) => { log.push('E:' + owner + ':' + Object.keys(obj).join(',')); Object.defineProperties(scope, Object.getOwnPropertyDescriptors(obj)); } };
    win.GKit = { relayed: function relayedFn() { return 'relayed-value'; } };
    win.__async = !!async; // 가짜 라이브러리는 아래 runScripts 가 「그 창 안에서」 정의한다 — 약속이 그 창의 약속이어야 스크립트 사이에서 비워진다
    win.Kit = { bootTheme: function () { log.push('B:bootTheme:' + arguments.length + ':' + (this === undefined)); }, bootAuth: function () { log.push('B:bootAuth'); if (state.sb) state.sb.on((e, i) => log.push('EV:' + e + ':listener' + i)); }, bootRest: function () { log.push('B:bootRest'); } };
    return win;
  };
  // 스크립트마다 따로 돌리고, 스크립트가 끝날 때마다 밀린 약속을 비운다(microtaskMode: afterEvaluate — 브라우저가 스크립트 사이에서 하는 일과 같다)
  const LIB = "window.lib = { createClient: function (u, k) { window.__log.push('CREATE:' + u + ':' + k); var subs = []; var c = { on: function (f) { subs.push(f); window.__log.push('REG:' + subs.length); } };"
    + " if (window.__async) Promise.resolve().then(function () { window.__log.push('NOTIFY:subs=' + subs.length); subs.forEach(function (f, i) { f('SIGNED_IN', i + 1); }); }); return c; } };";
  const runScripts = (codes, async) => { const win = mkWin(async); win.window = win; const ctx = vm.createContext(win, { microtaskMode: 'afterEvaluate' }); let threw = null;
    try { vm.runInContext(LIB, ctx); for (const c of codes) vm.runInContext(c, ctx); } catch (e) { threw = String(e && e.message || e); }
    return { log: win.__log, threw, relayed: (() => { try { return win.__scope.relayed(); } catch (e) { return 'ERR:' + e.message; } })(), globals: [typeof win.SERVER_URL, typeof win.SERVER_PUBLIC_KEY] }; };
  const inlineOf = html => { const ls = LF(html).split('\n'), tagAt = ls.findIndex(l => l.indexOf('</script>' + BOOT_TAG) === 0); let open = tagAt; while (open > 0 && ls[open] !== '<script>') open--; return ls.slice(open + 1, tagAt).join('\n'); };
  const orig = iifeOf(n1.before).code, gInline = inlineOf(read(n1.d)), gBoot = bootOf(n1.d);
  const a = runScripts([orig], false), b = runScripts([gInline, gBoot], false);
  record('E1', '실행 등가(vm): 원래 IIFE 와 「남긴 최상위 스크립트 → 부팅 파일」의 사건 줄(호출 순서 · this · 인자 수 · 상태 선언 · 연결 만들기 인자)과 통로 중계 값이 같다. 남긴 이름은 전역이 된다(원래는 IIFE 지역)',
    !a.threw && !b.threw && JSON.stringify(a.log) === JSON.stringify(b.log) && a.log.length === 7 && a.relayed === 'relayed-value' && b.relayed === 'relayed-value' && JSON.stringify(a.globals) === '["undefined","undefined"]' && JSON.stringify(b.globals) === '["string","string"]',
    { orig: a, kgc: b });
  // E2: 같은 꾸러미를 keepInline 으로 가른 꼴(연결 만들기는 인라인, 수신기 걸기는 부팅 파일)
  const kd = makeDir('e2-keepinline', n1.before), kr = runGen(kd, cfgFin(Object.assign(relay('relayed'), { keepInline: { statements: SP.concat(RP), reason: GRSN } })));
  const kInline = kr.status === 0 ? iifeOf(read(kd)).code : null, kBoot = bootOf(kd);
  const o2 = runScripts([orig], true), g2 = runScripts([gInline, gBoot], true), k2 = kInline ? runScripts([kInline, kBoot], true) : { log: [], threw: 'keepInline 꾸러미 실패: ' + kr.err };
  const got = l => l.filter(x => /^EV:/.test(x)).length, notify = l => l.find(x => /^NOTIFY:/.test(x));
  record('E2', '스크립트 경계(왜 이 옵션인가): 연결 만들기가 알림을 약속으로 미뤄 두는 라이브러리에서 — 원래 IIFE 는 수신기가 알림을 받고, keepGlobalConst 꼴은 원래와 사건 줄이 같고, keepInline 꼴(연결 만들기는 인라인 · 수신기 걸기는 부팅 파일)은 알림이 수신기보다 먼저 나가 수신기가 못 받는다',
    !o2.threw && !g2.threw && !k2.threw && JSON.stringify(o2.log) === JSON.stringify(g2.log) && got(o2.log) === 1 && notify(o2.log) === 'NOTIFY:subs=1' && got(k2.log) === 0 && notify(k2.log) === 'NOTIFY:subs=0' && JSON.stringify(k2.log) !== JSON.stringify(o2.log),
    { orig: o2.log, keepGlobalConst: g2.log, keepInline: k2.log });
}

// ── S: 정지
{
  const base = Object.assign(relay('relayed'));
  const K = (statements, readers, more) => cfgFin(Object.assign({}, base, kgc(statements, readers, more)));
  const raw = v => cfgFin(Object.assign({}, base, { keepGlobalConst: v }));
  const swap = (from, to) => B1.map(l => (l === from ? to : l));
  stopCase('S01', 'keepInline 과 함께 적으면 멈춘다', B1, cfgFin(Object.assign({}, base, kgc(SP, RP), { keepInline: { statements: SP.concat(RP), reason: GRSN } })), /keepGlobalConst 는 keepInline 과 함께 쓸 수 없다/);
  stopCase('S02', '설정 꼴: 배열', B1, raw(['var SERVER_URL']), /keepGlobalConst 는 \{ statements, readers, reason \} 이어야 한다/);
  stopCase('S03', '설정 꼴: true(스위치)', B1, raw(true), /keepGlobalConst 는 \{ statements, readers, reason \} 이어야 한다/);
  stopCase('S04', '설정 꼴: 모르는 칸', B1, K(SP, RP, { also: 1 }), /keepGlobalConst 에 모르는 칸: also/);
  stopCase('S05', '설정 꼴: statements 가 빈 배열', B1, K([], RP), /keepGlobalConst\.statements 는 문의 글자 앞머리/);
  stopCase('S06', '설정 꼴: statements 앞머리가 짧다(5자 미만)', B1, K(['var '], RP), /keepGlobalConst\.statements 는 문의 글자 앞머리/);
  stopCase('S07', '설정 꼴: readers 가 빈 배열(없으면 칸을 적지 않는다)', B1, K(SP, []), /keepGlobalConst\.readers 는 문의 글자 앞머리/);
  stopCase('S08', '설정 꼴: statements 와 readers 에 같은 앞머리', B1, K(SP, ['var SERVER_URL']), /같은 앞머리가 둘이다/);
  stopCase('S09', '근거가 없다', B1, raw({ statements: SP, readers: RP }), /keepGlobalConst 의 근거\(reason\)가 없거나 짧거나/);
  stopCase('S10', '근거가 짧다(10자 미만)', B1, raw({ statements: SP, readers: RP, reason: '짧다' }), /keepGlobalConst 의 근거\(reason\)가 없거나 짧거나/);
  stopCase('S11', '지정이 맞는 문 0개', B1, K(['var SERVER_HOST', 'var SERVER_PUBLIC_KEY'], RP), /keepGlobalConst\.statements 지정이 문 하나로 정해지지 않는다: 「var SERVER_HOST」 — 맞는 최상위 문 0개/);
  stopCase('S12', '지정이 맞는 문 2개', B1, K(['var SERVER_'], RP), /keepGlobalConst\.statements 지정이 문 하나로 정해지지 않는다: 「var SERVER_」 — 맞는 최상위 문 2개/);
  stopCase('S13', '지정 둘이 같은 문', B1, K(['var SERVER_URL', 'var SERVER_URL ='], RP), /keepGlobalConst 지정 둘이 같은 문을 가리킨다/);
  stopCase('S14', '남길 문이 숫자 리터럴 선언', swap(L_URL, '  var SERVER_URL = 8080;'), K(SP, RP), /문자열 리터럴로 초기화하는 var 선언\(이름 하나\)뿐이다/);
  stopCase('S15', '남길 문이 글자 이어 붙이기(다른 것을 읽는다)', swap(L_URL, "  var SERVER_URL = 'https://' + location.host;"), K(SP, RP), /문자열 리터럴로 초기화하는 var 선언\(이름 하나\)뿐이다/);
  stopCase('S16', '남길 문이 템플릿 글자', swap(L_URL, '  var SERVER_URL = `https://example.invalid`;'), K(SP, RP), /문자열 리터럴로 초기화하는 var 선언\(이름 하나\)뿐이다/);
  stopCase('S17', '남길 문이 호출 결과', swap(L_URL, "  var SERVER_URL = String('x');"), K(SP, RP), /문자열 리터럴로 초기화하는 var 선언\(이름 하나\)뿐이다/);
  stopCase('S18', '남길 문이 초기화 없는 선언', swap(L_URL, '  var SERVER_URL;'), K(SP, RP), /문자열 리터럴로 초기화하는 var 선언\(이름 하나\)뿐이다/);
  stopCase('S19', '남길 문이 이름 둘을 한 번에 선언', B1.filter(l => l !== L_KEY).map(l => (l === L_URL ? "  var SERVER_URL = 'https://example.invalid', SERVER_PUBLIC_KEY = 'public-key-0000';" : l)), K(['var SERVER_URL'], RP), /문자열 리터럴로 초기화하는 var 선언\(이름 하나\)뿐이다/);
  stopCase('S20', '이름이 대문자 상수 꼴이 아니다(전역 이름이 된다)', B1.map(l => l.replace(/SERVER_URL/g, 'serverUrl')), K(['var serverUrl', 'var SERVER_PUBLIC_KEY'], RP), /대문자 상수 꼴\(6자 이상\)이어야 한다 — 전역 이름이 된다: serverUrl/);
  stopCase('S21', '이름이 짧다(5자)', B1.map(l => l.replace(/SERVER_URL/g, 'S_URL')), K(['var S_URL', 'var SERVER_PUBLIC_KEY'], RP), /대문자 상수 꼴\(6자 이상\)이어야 한다 — 전역 이름이 된다: S_URL/);
  stopCase('S22', '선언 줄 뒤에 주석이 있다(줄 그대로 남길 수 없다)', swap(L_URL, L_URL + ' /* 서버 주소 */'), K(SP, RP), /한 줄을 혼자 써야 한다/);
  stopCase('S23', '선언이 두 줄에 걸친다', swap(L_URL, "  var SERVER_URL =\n    'https://example.invalid';"), K(SP, RP), /한 줄을 혼자 써야 한다/);
  stopCase('S24', '선언 둘이 한 줄을 나눠 쓴다', B1.filter(l => l !== L_KEY).map(l => (l === L_URL ? L_URL + L_KEY.trim() : l)), K(SP, RP), /한 줄을 혼자 써야 한다/);
  { const b = B1.slice(); const i = b.indexOf(L_KEY); b.splice(i, 0, '  bootRest();'); b.pop();
    stopCase('S25', '남길 선언이 연달아 있지 않다', b, K(SP, RP), /keepGlobalConst 로 남길 선언이 연달아 있지 않다/); }
  stopCase('S26', 'IIFE 안에서 그 이름에 다시 대입한다(상수가 아니다)', swap(L_DEF, "  window.OurgoalAppState.define('sb', (function(){ SERVER_URL = 'x'; return window.lib.createClient(SERVER_URL, SERVER_PUBLIC_KEY); })());"), K(SP, RP), /다시 대입하거나 다시 선언한다 — 상수가 아니다: SERVER_URL/);
  { const b = B1.filter(l => l !== L_DEF); const i = b.indexOf(L_URL); b.splice(i, 0, L_DEF);
    stopCase('S27', '남길 선언보다 앞의 문이 그 이름을 읽는다(선언을 앞당기면 읽는 값이 달라진다)', b, K(SP, RP), /남길 선언보다 앞의 문이 그 이름을 읽는다/); }
  stopCase('S28', '그 이름을 읽는 문을 readers 에 적지 않았다 — 전제 미충족(상태 선언 1)', B1, K(SP), /finalize 전제 미충족 .*상태 선언\(define\) 1/);
  stopCase('S29', 'readers 에 적은 문이 상태 선언이 아니다(호출문)', B1, K(SP, RP.concat(['bootRest()'])), /keepGlobalConst\.readers 로 적을 수 있는 문은 상태 선언\(define·defineVar\)뿐이다: 「bootRest\(\)」/);
  stopCase('S30', 'readers 에 적은 상태 선언이 남긴 이름을 읽지 않는다(쓰이지 않는 허용)', B1.concat(["  window.OurgoalAppState.define('other', 1);"]), K(SP, RP.concat(["window.OurgoalAppState.define('other'"])), /readers 의 문이 남긴 이름을 하나도 읽지 않는다/);
  stopCase('S31', '같은 이름이 다른 스크립트의 코드에 있다(window.이름)', B1, K(SP, RP), /같은 전역 범위의 다른 글자에 이미 있다 — 전역 이름으로 만들 수 없다: SERVER_URL @ js\/a\/one\.js/, { files: { 'js/a/one.js': 'window.SERVER_URL = "x";\n' } });
  stopCase('S32', '같은 이름이 다른 스크립트의 코드에 있다(맨이름 읽기 · 앞에 / 가 붙은 src)', B1, K(SP, RP), /전역 이름으로 만들 수 없다: SERVER_PUBLIC_KEY @ js\/b\/two\.js/, { files: { 'js/b/two.js': 'function f(){ return typeof SERVER_PUBLIC_KEY; }\n' } });
  stopCase('S33', '같은 이름이 다른 스크립트의 문자열 속에 있다', B1, K(SP, RP), /전역 이름으로 만들 수 없다: SERVER_URL @ js\/a\/one\.js/, { files: { 'js/a/one.js': 'var k = "SERVER_URL"; window.One = window[k];\n' } });
  stopCase('S34', '같은 이름이 든 스크립트를 파싱하지 못한다', B1, K(SP, RP), /SERVER_URL @ js\/a\/one\.js\(파싱하지 못했다/, { files: { 'js/a/one.js': 'window.SERVER_URL = = ;;; (((\n' } });
  stopCase('S35', '같은 이름이 index.html 의 다른 인라인 블록에 있다', B1, K(SP, RP), /SERVER_URL @ index\.html\(인라인 IIFE 블록 밖\)/, { o: { post: ['', '<script>', 'window.addEventListener("load", function(){ window.dbg = typeof SERVER_URL; });', '</script>', '</body></html>', ''] } });
  stopCase('S36', 'relay 없이 — 설정에 없는 expose 문이 있어 전제 미충족', B1, cfgFin(kgc(SP, RP)), /finalize 전제 미충족 .*expose 문 1/);
}

// ── A: 감사(생성기와 따로)
record('A', '감사(성공한 꾸러미 전부): 원래 문 = 남긴 선언 + 옮긴 문(겹침 0) · 남긴 블록은 원래 줄 그대로이고 문자열 상수 선언뿐(괄호 0) · 블록 밖 줄 그대로 · 큰 인라인 IIFE 없음 · 부팅 태그 한 번(defer·async 없음)',
  audits.length === 5 && audits.every(a => a.ok), audits);

// ── X: 실제 index.html(PIN) + 실제 js 폴더(작업 트리의 것 — 이 PR 은 js/ 를 바꾸지 않는다)
{
  const realCfg = extra => ({ task: T, slot: 'HO', mode: 'finalize', label: '시험 — 실제 index.html', cells: [Object.assign({}, CELL)], ...extra });
  const R = { relay: [{ name: 'renderTeamGoalsScreen', reason: RSN }] };
  const G = readers => ({ keepGlobalConst: Object.assign({ statements: ['var SUPABASE_URL', 'var SUPABASE_ANON_KEY'], reason: GRSN }, readers ? { readers: ["window.OurgoalAppState.define('sb'"] } : {}) });
  const realHtml = blob(PIN + ':index.html');
  const mk = name => { const d = makeDir(name, realHtml); fs.cpSync(path.join(APP, 'js'), path.join(d, 'js'), { recursive: true, filter: s => !/[\\/]app[\\/]boot\.js$/.test(s) }); if (fs.existsSync(path.join(APP, 'ui.js'))) fs.copyFileSync(path.join(APP, 'ui.js'), path.join(d, 'ui.js')); return d; };
  const d = mk('x1'), r = runGen(d, realCfg(Object.assign({}, R, G(true))));
  const before = LF(realHtml).split('\n'), after = r.status === 0 ? LF(read(d)).split('\n') : [], boot = bootOf(d);
  const keyRe = /^\s*var SUPABASE_(URL|ANON_KEY) = /, kb = before.filter(l => keyRe.test(l)), tagAt = after.findIndex(l => l === '</script>' + BOOT_TAG);
  const block = tagAt >= 0 ? after.slice(tagAt - 3, tagAt + 1) : [];
  const au = r.status === 0 && boot !== null ? auditG(realHtml, read(d), boot) : { ok: false };
  const k = r.meta && r.meta.keptGlobalConst;
  record('X1', '실제 index.html(PIN)과 실제 js 폴더: relay + keepGlobalConst 로 성공한다 — 인라인에는 선언 두 줄만(원래 줄과 바이트 동일), 연결 만들기 줄은 부팅 파일에, 전역 이름 검사 걸림 0, 부팅 파일에 값 글자 없음',
    r.status === 0 && kb.length === 2 && block.length === 4 && block[0] === '<script>' && block[1] === kb[0] && block[2] === kb[1] && au.ok && !!k && k.globalNameScan.hits === 0 && k.globalNameScan.scanned > 300 && k.readers.length === 1
      && /createClient\(SUPABASE_URL, SUPABASE_ANON_KEY\)/.test(boot) && !/supabase\.co|eyJ[A-Za-z0-9._-]{10,}/.test(boot) && !/supabase\.co|eyJ[A-Za-z0-9._-]{10,}/.test((r.stdout || '') + (r.metaText || '')) && au.statements.kept === 2 && au.statements.boot === au.statements.orig - 2,
    { status: r.status, err: r.err, html: [before.length, after.length], blockLines: block.length, audit: { ok: au.ok, statements: au.statements }, scan: k && k.globalNameScan, bootLines: boot ? boot.split('\n').length - 1 : null, stdout: (r.stdout || '').split('\n').filter(l => /^finalize|^index|^js\/app/.test(l)) });
  const once = r.status === 0 ? read(d) : null, r2 = runGen(d, realCfg(Object.assign({}, R, G(true))));
  record('X2', '한 번 돌린 결과에 다시 돌리면 멈춘다(큰 인라인 IIFE 가 더 없다) — index.html 은 첫 결과 그대로', r.status === 0 && r2.status !== 0 && /옮길 덩어리가 없다/.test((r2.stderr || '') + (r2.stdout || '')) && read(d) === once, { status: r2.status, stderr: (r2.stderr || '').split('\n')[0].slice(0, 160) });
  const d3 = mk('x3'), r3 = runGen(d3, realCfg(Object.assign({}, R, G(false))));
  record('X3', '실제 index.html: readers 를 빼면 전제 미충족으로 멈춘다(상태 선언 1) — index.html 그대로 · 부팅 파일 없음', r3.status !== 0 && /finalize 전제 미충족 .*상태 선언\(define\) 1/.test(r3.err || '') && read(d3) === realHtml && bootOf(d3) === null, { err: r3.err });
  const d4 = mk('x4'), r4 = runGen(d4, realCfg(G(true)));
  record('X4', '실제 index.html: relay 를 빼면 멈춘다(expose 문 · 호출되지 않는 가져오기) — index.html 그대로 · 부팅 파일 없음', r4.status !== 0 && /finalize 전제 미충족 .*expose 문 1/.test(r4.err || '') && read(d4) === realHtml && bootOf(d4) === null, { err: r4.err });
}

const out = { tool: 'docs/design/harness/module-split/finalize-check-687.js', type: '작업자 측정, 판정 아님', pin: PIN, total: results.length, passed: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok).map(r => r.id), results };
if (OUT) { fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true }); fs.writeFileSync(path.resolve(OUT), JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' }); }
try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 무시 */ }
console.log(out.passed + '/' + out.total + ' 통과' + (out.failed.length ? ' · 실패: ' + out.failed.join(' ') : ''));
process.exit(out.failed.length ? 1 : 0);
