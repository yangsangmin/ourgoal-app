'use strict';
// 생성기 「마지막」 모드의 명시적 옵션 둘(relay · keepInline — docs/architecture/CELL-REGISTRY-DESIGN.md 5.9절, #TASK-ES-681) 단위 시험. 작업자 측정, 판정 아님.
// 저장소 밖 임시 폴더에서 생성기를 자식 프로세스로 돌리고 결과를 맞댄다. 저장소의 index.html 은 건드리지 않는다.
//  P     앞선 finalize 단위 시험 45건(finalize-check-662.js — 그 안에서 661 · 657 · 643 · 634 · 619 · B1 과 병합된 PR 재생성이 다시 돈다)을 고친 생성기로 다시 돌린다.
//        실패해도 되는 것은 생성기 파일의 diff 모양을 옛 기준과 맞대는 검사뿐이다(경험칙 L110 — 662 의 D0·B · 661 의 D0·B · 657 의 D1 · 643 의 D0). 출력을 재는 검사는 전부 통과해야 한다.
//  D     생성기 diff(기준 = PIN 커밋)가 두 구간(finalize 의 runFinalize · unwire 의 unwireOnce) 안에만 있다 — 그 밖의 줄은 한 글자도 바뀌지 않았다. 검사기는 기준과 바이트 동일.
//  G*    옵션 없이 돌리면 기준 생성기와 같다: 같은 꾸러미(성공 · 정지)를 기준 생성기(PIN 의 글자)와 고친 생성기로 돌려 index.html · 부팅 파일 · 표준 출력 · 메타 · 오류 글자가 전부 같다.
//  R*    relay 를 채운 꼴: 가져오기 1 + getter 1(expose 문 하나) / 이름 둘이 한 expose 문에 · 여러 줄 / 부팅 파일 머리 주석에 이름과 근거 / 표준 출력 한 줄 · 메타 relayed.
//  K*    keepInline 을 채운 꼴: 남길 문 셋 + 앞의 호출문 하나(+ 그 가져오기 · 손잡이, 손잡이는 부팅 파일에 한 번 더) / 앞에 호출문이 없는 꼴 / 여러 줄에 걸친 남길 문 / CRLF / relay 와 함께(expose 가 앞 · 뒤).
//        남은 인라인 줄은 원래 줄과 바이트 동일 · 순서 동일, 부팅 태그는 남긴 `</script>` 줄 끝.
//  E*    실행 등가(vm): 원래 인라인 IIFE 와 「남긴 인라인 IIFE → 부팅 파일」을 같은 가짜 키트 위에서 돌려 호출 순서 · this · 인자 수 · 상태 선언 값 · 통로 중계 값이 같다.
//  S*    정지(전부 index.html 바이트 그대로 · 부팅 파일 없음): 설정 꼴 · 근거 없음/짧음 · 지정이 하나로 안 정해짐 · 줄 꼴이 「가져오기 1 + getter 1」이 아님 · 설정에 없는 expose · 불리지 않는 가져오기 ·
//        남길 문이 연달아 있지 않음 · 한 줄 나눠 쓰기 · 남길 종류 밖 · 남긴 var 를 부팅 파일로 가는 문이 읽음 · 가져오기를 양쪽이 함께 씀 · 부팅 파일에 호출문 0 …
//  U* · S6x~S8x · E5 · G2 · AU   unwire 의 dropDeadImport(설계 5.10절 — 읽는 곳이 없는 키트 가져오기 줄): 지우는 꼴 둘(손잡이 줄 함께) · 옵션 없는 unwire 는 기준과 동일 ·
//        정지(설정 꼴 · 근거 · 가져오기 꼴이 단순 속성 읽기가 아님 · 참조 · 문자열 · getter · 대입 · eval · new Function · definedIn 없음 · 접근자 정의 · 정의 못 찾음) · 실행 등가(데이터 속성 대 접근자) · 감사.
//  A     감사(성공한 꾸러미 전부 — 생성기와 따로): 원래 문 = 남긴 문 + 옮긴 문(겹침은 함께 쓰는 손잡이뿐) · 남은 인라인 줄은 원래 줄의 부분열 · 블록 밖 줄 그대로 · 부팅 태그 한 번(defer·async 없음).
//  X1    실제 index.html(PIN): 옵션을 줘도 전제 밖의 문이 남아 있어 멈춘다(오류 글자에 종류별 수) — index.html 은 그대로.
//  X2    한 번 돌린 결과에 다시 돌리면 멈춘다.
// 사용: NODE_PATH=<node_modules> node finalize-check-681.js <APP_DIR(작업 트리)> <out.json> [--skip-662]
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), vm = require('vm');
const parser = require('@babel/parser');
const [APP_ARG, OUT] = process.argv.slice(2);
const SKIP662 = process.argv.includes('--skip-662');
const APP = path.resolve(APP_ARG);
const HARNESS = path.join(APP, 'docs', 'design', 'harness', 'module-split');
const GEN = path.join(HARNESS, 'gen-inline-hard.js'), VERIFY = path.join(HARNESS, 'verify-inline-hard.js');
const PIN = 'd7789c89423834a46b6b982c525d68303d3e9368'; // 기준 커밋(#952 병합) — 기준 생성기와 실제 index.html 을 여기서 읽는다(main 이 움직여도 같은 입력)
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'finalize-681-'));
const results = [];
const env = { ...process.env, MODULE_SPLIT_OUT: tmpRoot };
const META = path.join(tmpRoot, 'gen-inline-hard-meta.json');
const T = 'TASK-681-UNIT', BOOT = 'js/app/boot.js', BOOT_TAG = '<script src="js/app/boot.js"></script>';
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
function record(id, title, ok, detail) { results.push({ id, title, ok: !!ok, detail }); console.log((ok ? 'ok  ' : 'FAIL'), id, title, ok ? '' : JSON.stringify(detail).slice(0, 1200)); }
function makeDir(name, text) { const d = path.join(tmpRoot, name); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'index.html'), text, { encoding: 'utf8' }); return d; }
const read = d => fs.readFileSync(path.join(d, 'index.html'), 'utf8');
const bootOf = d => (fs.existsSync(path.join(d, BOOT)) ? fs.readFileSync(path.join(d, BOOT), 'utf8') : null);
function firstDiff(a, b) { const al = String(a).split('\n'), bl = String(b).split('\n'); for (let i = 0; i < Math.max(al.length, bl.length); i++) if (al[i] !== bl[i]) return { line: i + 1, got: al[i], want: bl[i] }; return null; }
const LF = s => s.replace(/\r\n/g, '\n');
const CELL = { file: BOOT, title: 'OurGoal App Boot (부팅 — 구역 함수를 순서대로 부른다)', desc: ['구역 함수를 index.html 에 있던 순서 그대로 부른다.'] };
const cfgFin = extra => Object.assign({ task: T, mode: 'finalize', label: '시험 꾸러미', cells: [Object.assign({}, CELL)] }, extra || {});
const RSN = '주인 세포가 798줄이라 등록 블록을 붙이면 800줄 상한을 넘는다(시험 꾸러미)';
const KRSN = '커밋 훅의 금지 패턴 규칙이 이 줄을 새 파일로 옮기는 것을 막는다(시험 꾸러미)';
const relay = (...names) => ({ relay: names.map(n => ({ name: n, reason: RSN })) });
const keep = (...statements) => ({ keepInline: { statements, reason: KRSN } });

// ── 꾸러미(fixture)
const PRE = ['<!doctype html>', '<html><head><title>fixture</title>', '<script>', '  window.analytics = 1; /* 접속 통계 조각 — 다른 인라인 블록 */', '</script>', '</head><body>',
  '<script src="js/core/app-scope.js"></script><script src="js/a/index.js"></script>', '<script src="js/a/one.js"></script><script src="js/b/two.js"></script>'];
const OPEN = ['<script>', '(function(){', '  "use strict";'];
const CLOSE = ['})();', '</script>'];
const POST = ['', '<script>', '/* ESC 키 처리기 — 다른 인라인 블록 */', "window.addEventListener('keydown', function(e) { if (e.key === 'Escape' && window.closeTop) window.closeTop(); });", '</script>', '</body></html>', ''];
const doc = (body, o) => (o && o.pre || PRE).concat(OPEN, body, CLOSE, o && o.post || POST).join('\n');
// 옵션이 없을 때(기준 생성기와 같은 꼴)의 기대 글자
const docAfterPlain = () => PRE.slice(0, -1).concat([PRE[PRE.length - 1] + BOOT_TAG], POST).join('\n');
// keepInline 뒤의 기대 글자: 블록을 남기고(껍데기 + 남길 줄) `</script>` 줄 끝에 태그
const docAfterKeep = keptLines => PRE.concat(OPEN, keptLines, ['})();', '</script>' + BOOT_TAG], POST).join('\n');
const head1 = n => ' * #' + T + '(시험 꾸러미): index.html 인라인 IIFE 에 마지막까지 남아 있던 문(키트 손잡이 ' + n[0] + '개 · 구역 함수 가져오기 ' + n[1] + '개 · 구역 함수 호출 ' + n[2] + '개)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로, 같은 순서로 옮겼다.';
const HEAD2 = ' * 주석·빈 줄은 옮기지 않았다. index.html 에는 큰 인라인 IIFE 가 더 없고, 그 자리(앞 태그 줄 끝)의 동기 script 태그가 이 파일을 부른다 — defer·async 를 붙이지 않는다(로드 순서가 곧 실행 순서다).';
const head2Keep = k => ' * 주석·빈 줄은 옮기지 않았다. index.html 의 인라인 IIFE 에는 문 ' + k + '개가 줄 그대로 남아 있고(생성기 설정 keepInline — ' + KRSN + '), 그 `</script>` 뒤의 동기 script 태그가 이 파일을 부른다 — 인라인이 먼저 돌고 이 파일이 이어서 돈다. defer·async 를 붙이지 않는다(로드 순서가 곧 실행 순서다).';
const relayHead = names => [' * 통로 중계 ' + names.length + '개(' + names.join(' · ') + ')도 함께 옮겼다 — 등록 기관에 등록할 수 없는 이름의 가져오기 줄과 그 getter 를 담은 expose 문이다(생성기 설정 relay).'].concat(names.map(n => ' *   - ' + n + ': ' + RSN));
const dupHead = names => ' * 인라인에 남은 문과 이 파일이 함께 쓰는 키트 손잡이 ' + names.length + '개(' + names.join(' · ') + ')는 같은 글자로 한 번 더 적었다.';
function bootText(stmts, n, o) {
  const opt = o || {};
  return ['/**', ' * ' + CELL.title, ' *', ' * ' + CELL.desc[0], head1(n)].concat(opt.relay ? relayHead(opt.relay) : [], opt.dup ? [dupHead(opt.dup)] : [],
    [opt.keep ? head2Keep(opt.keep) : HEAD2, ' * 설계: docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5절 X9' + (opt.relay || opt.keep ? ' · 5.9절' : ''), ' */', '(function(){', '  "use strict";'], stmts, ['})();', '']).join('\n');
}

// ── 감사(생성기와 따로): 문 단위 토큰 서명
function iifeOf(text) {
  const ls = LF(text).split('\n'); let s = -1, e = -1;
  for (let i = 0; i < ls.length; i++) if (ls[i].trim() === '<script>' && (ls[i + 1] || '').trim() === '(function(){' && (ls[i + 2] || '').includes('"use strict"')) { s = i; break; }
  if (s < 0) return null;
  for (let i = s + 1; i < ls.length; i++) if (ls[i].startsWith('</script>')) { e = i; break; }
  return { ls, s, e, code: ls.slice(s + 1, e).join('\n') };
}
function stmtSigs(code) {
  const ast = parser.parse(code, { sourceType: 'script', tokens: true });
  const x = ast.program.body[0].expression, body = x.callee.body.body;
  const toks = ast.tokens.filter(t => typeof t.type !== 'string' && t.type.label !== 'eof');
  return body.map(n => toks.filter(t => t.start >= n.start && t.end <= n.end).map(t => (t.type.label || '') + ' ' + (t.value === undefined ? '' : String(t.value))).join('\u0001'));
}
function auditKeep(before, after, boot) {
  const b = iifeOf(before), a = iifeOf(after);
  if (!b || !a) return { ok: false, why: 'IIFE 없음' };
  const orig = stmtSigs(b.code), inl = stmtSigs(a.code), bt = stmtSigs(boot);
  // 남긴 문은 원래 문의 부분열, 옮긴 문도 원래 문의 부분열, 둘을 합치면 원래 문 전부(겹침은 손잡이 꼴 문뿐)
  const pick = (seq) => { const idx = []; let at = 0; for (const sg of seq) { while (at < orig.length && orig[at] !== sg) at++; if (at >= orig.length) return null; idx.push(at); at++; } return idx; };
  const iIdx = pick(inl), bIdx = pick(bt);
  const cover = iIdx && bIdx ? new Set(iIdx.concat(bIdx)).size === orig.length : false;
  const overlap = iIdx && bIdx ? iIdx.filter(i => bIdx.includes(i)) : [];
  const overlapOnlyHandles = overlap.every(i => /^var name _\w+\u0001= \u0001name window/.test(orig[i].replace(/\u0001/g, '\u0001')) || /name window/.test(orig[i].split('\u0001').slice(2, 4).join(' ')));
  // 줄: 새 블록의 줄(마지막 태그 줄 제외)은 원래 블록 줄의 부분열(바이트 동일)
  const nb = a.ls.slice(a.s, a.e), ob = b.ls.slice(b.s, b.e + 1);
  let at = 0, linesOk = true; for (const l of nb) { while (at < ob.length && ob[at] !== l) at++; if (at >= ob.length) { linesOk = false; break; } at++; }
  const tagLine = a.ls[a.e] === '</script>' + BOOT_TAG;
  const outside = a.ls.slice(0, a.s).join('\n') === b.ls.slice(0, b.s).join('\n') && a.ls.slice(a.e + 1).join('\n') === b.ls.slice(b.e + 1).join('\n');
  const tags = LF(after).match(/<script[^>]*src="js\/app\/boot\.js"[^>]*>/g) || [];
  return { ok: !!iIdx && !!bIdx && cover && overlapOnlyHandles && linesOk && tagLine && outside && tags.length === 1 && tags[0] === '<script src="js/app/boot.js">' && !/\r/.test(boot), statements: { orig: orig.length, inline: inl.length, boot: bt.length, overlap: overlap.length }, cover, overlapOnlyHandles, linesOk, tagLine, outside, tags };
}
function auditPlain(before, after, boot) { // 옵션 없이·relay 만: IIFE 블록이 사라지고 앞 줄 끝에 태그, 부팅 파일의 문 = 원래 문 전부(같은 순서)
  const b = iifeOf(before), a = LF(after).split('\n');
  const want = b.ls.slice(0, b.s - 1).concat([b.ls[b.s - 1] + BOOT_TAG], b.ls.slice(b.e + 1));
  const sameHtml = want.length === a.length && want.every((l, i) => l === a[i]);
  const o = stmtSigs(b.code), g = stmtSigs(boot);
  return { ok: sameHtml && JSON.stringify(o) === JSON.stringify(g) && iifeOf(after) === null && !/\r/.test(boot), sameHtml, statements: o.length };
}
const audits = [];
function okCase(id, title, body, cfg, want, extra) {
  const before = doc(body, want.o), d = makeDir(id.toLowerCase(), want.crlf ? before.replace(/\n/g, '\r\n') : before);
  const r = runGen(d, cfg); const got = r.status === 0 ? read(d) : null, boot = bootOf(d);
  const wantHtml = (want.keptLines ? docAfterKeep(want.keptLines) : docAfterPlain()), wantBoot = bootText(want.stmts, want.n, want.head);
  const au = got !== null && boot !== null ? (want.keptLines ? auditKeep(want.crlf ? before.replace(/\n/g, '\r\n') : before, got, boot) : auditPlain(before, got, boot)) : { ok: false };
  audits.push({ id, ok: au.ok, statements: au.statements });
  const more = extra && r.status === 0 ? extra(r, d) : true;
  const htmlOk = got !== null && (want.crlf ? got === wantHtml.replace(/\n/g, '\r\n') : got === wantHtml);
  record(id, title, r.status === 0 && htmlOk && boot === wantBoot && au.ok && more, { status: r.status, err: r.err, htmlDiffAt: got !== null && !htmlOk ? firstDiff(LF(got), wantHtml) : null, bootDiffAt: boot !== null && boot !== wantBoot ? firstDiff(boot, wantBoot) : null, audit: au, more, stdout: (r.stdout || '').split('\n').slice(0, 8) });
  return { r, d, before };
}
function stopCase(id, title, body, cfg, re) {
  const before = typeof body === 'string' ? body : doc(body), d = makeDir(id.toLowerCase(), before);
  const r = runGen(d, cfg);
  record(id, title, r.status !== 0 && re.test(r.err || '') && read(d) === before && bootOf(d) === null, { status: r.status, err: r.err, htmlSame: read(d) === before, bootMade: bootOf(d) !== null });
}

// ── P: 앞선 finalize 단위 시험 전부
if (!SKIP662) {
  const out = path.join(tmpRoot, 'finalize662.json');
  const r = cp.spawnSync(process.execPath, [path.join(HARNESS, 'finalize-check-662.js'), APP, out], { encoding: 'utf8', env: process.env, maxBuffer: 1024 * 1024 * 256 });
  const j = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
  // 실패해도 되는 것은 「생성기 파일의 diff 모양」을 옛 기준과 맞대는 검사뿐이다(L110 — #TASK-ES-670 의 B 와 같은 기준): 662 의 D0 · 661 의 D0 · 657 의 D1 · 643 의 D0, 그리고 그 모양 조건을 겉에서 다시 보는 662 의 B · 661 의 B.
  const f662 = j ? j.results.filter(x => !x.ok).map(x => x.id) : null, b662 = j && ((j.results.find(x => x.id === 'B') || {}).detail || {});
  const f661 = b662 && b662.failed, i657 = b662 && b662.inner657 || {}, f657 = i657.failed, r643 = i657.region643 || {}, f643 = r643.failed, in634 = r643.innerB || {};
  const sub = (arr, allow) => Array.isArray(arr) && arr.every(x => allow.includes(x));
  // 생성기와 무관하게 실패하는 검사 하나: B1 의 T7 은 「작업 트리의 실제 index.html 에서 참조가 남지 않는 _settingsKit 이름」을 골라 철거해 보는데, 재철거 3차(#953)가 그 손잡이를 지운 뒤로는 후보가 없어
  // 「측정불가」로 실패 기록이 된다(고치지 않은 main 에서도 같다 — reports/TASK-ES-681/prev-suite-base.json). 그 한 건은 겉의 B 들(619 · 634 · 643 · 657)에 차례로 실패로 번진다.
  // 그래서 B1 을 따로 한 번 더 돌려 실패가 T7 의 「측정불가」뿐인지 직접 보고, 그때에 한해 번진 B 들을 허용한다.
  const b1Out = path.join(tmpRoot, 'b1.json');
  cp.spawnSync(process.execPath, [path.join(HARNESS, 'unwire-check-b1.js'), APP, b1Out], { encoding: 'utf8', env: process.env, maxBuffer: 1024 * 1024 * 64 });
  const b1 = fs.existsSync(b1Out) ? JSON.parse(fs.readFileSync(b1Out, 'utf8')) : null, b1Res = b1 ? (b1.results || []) : [];
  const b1Failed = b1Res.filter(x => !x.ok).map(x => x.id), t7 = b1Res.find(x => x.id === 'T7');
  const t7Unmeasurable = b1Failed.length === 1 && b1Failed[0] === 'T7' && /측정불가/.test(JSON.stringify(t7 && t7.detail || ''));
  const b1Ok = b1Res.length === 8 && (b1Failed.length === 0 || t7Unmeasurable), spread = t7Unmeasurable; // spread: T7 한 건이 겉의 B 로 번진 경우
  const want634 = spread ? 33 : 34, want619 = spread ? '15/16' : '16/16', wantB1 = spread ? '7/8' : '8/8', bAllow = spread ? ['B'] : [];
  record('P', '앞선 단위 시험 전부(662 45건 → 661 47건 → 657 22건 → 643 67건 → 634 34건 → 619 16건 → B1 8건 · 병합된 PR 재생성 포함)가 고친 생성기에서 생성기 diff 모양 검사 말고 모두 통과한다(모양 검사: 662 D0 · 661 D0 · 657 D1 · 643 D0, 그 조건을 겉에서 다시 보는 662 B · 661 B). 생성기와 무관한 한 건(B1 의 T7 — 지금의 index.html 에 후보가 없어 「측정불가」)과 그것이 번진 겉의 B 는 따로 적는다',
    !!j && j.total === 45 && sub(f662, ['B', 'D0']) && b662.total === 47 && sub(f661, ['B', 'D0']) && i657.total === 22 && sub(f657, ['D1'].concat(bAllow)) && r643.total === 67 && sub(f643, ['D0'].concat(bAllow)) && in634.passed === want634 && in634.total === 34 && in634.ext619 === want619 && in634.b1 === wantB1 && b1Ok,
    { status: r.status, total: j && j.total, failed: f662, finalize662: { total: j && j.total, passed: j && j.passed, failed: f662 }, sweep661: { total: b662 && b662.total, passed: b662 && b662.passed, failed: f661 }, fnArguments657: { total: i657.total, passed: i657.passed, failed: f657 }, region643: { total: r643.total, passed: r643.passed, failed: f643 }, unstate634: in634.passed + '/' + in634.total, unwireExt619: in634.ext619, unwireB1: in634.b1,
      b1Direct: { total: b1Res.length, failed: b1Failed, t7Unmeasurable, t7Note: t7 && !t7.ok ? JSON.stringify(t7.detail).slice(0, 160) : null }, stderrTail: (r.stderr || '').split('\n').slice(-3) });
} else record('P', '앞선 finalize 단위 시험 재실행(--skip-662 로 건너뜀)', false, { skipped: true });

// ── D: 생성기 diff 는 finalize 구간 안에만 있다 · 검사기 바이트 동일
{
  const base = LF(blob(PIN + ':docs/design/harness/module-split/gen-inline-hard.js')).split('\n'), now = LF(fs.readFileSync(GEN, 'utf8')).split('\n');
  // 표지 줄 넷으로 두 구간(runFinalize · unwireOnce)을 가르고, 그 밖의 세 토막(머리 · 사이 · 꼬리)이 기준과 글자가 같은지 본다
  const marks = ls => { const f0 = ls.indexOf('function runFinalize() {'), f1 = ls.findIndex((l, i) => i > f0 && /^\/\/ ── \[B1 · /.test(l)), u0 = ls.indexOf('function unwireOnce(U, doc) {'), u1 = ls.findIndex((l, i) => i > u0 && /^\/\/ ── \[#TASK-ES-634 · /.test(l)); return { f0, f1, u0, u1 }; };
  const mb = marks(base), mn = marks(now);
  const okMarks = m => m.f0 > 0 && m.f1 > m.f0 && m.u0 > m.f1 && m.u1 > m.u0;
  const same = (x, y) => x.length === y.length && x.every((l, i) => l === y[i]);
  const headSame = same(base.slice(0, mb.f0 + 1), now.slice(0, mn.f0 + 1)), midSame = same(base.slice(mb.f1, mb.u0 + 1), now.slice(mn.f1, mn.u0 + 1)), tailSame = same(base.slice(mb.u1), now.slice(mn.u1));
  const verifySame = LF(blob(PIN + ':docs/design/harness/module-split/verify-inline-hard.js')) === LF(fs.readFileSync(VERIFY, 'utf8'));
  record('D', '생성기 diff 는 두 구간(finalize 의 `runFinalize` · unwire 의 `unwireOnce`) 안에만 있다 — 그 밖의 세 토막(머리 · 두 구간 사이 · 꼬리)은 기준과 글자가 같다. 검사기는 기준과 같다',
    okMarks(mb) && okMarks(mn) && headSame && midSame && tailSame && now.length > base.length && verifySame,
    { pin: PIN, baseLines: base.length, nowLines: now.length, added: now.length - base.length, base: mb, now: mn, headSame, midSame, tailSame, finalizeLines: [mb.f1 - mb.f0, mn.f1 - mn.f0], unwireOnceLines: [mb.u1 - mb.u0, mn.u1 - mn.u0], verifySame });
}

// ── 꾸러미 몸통
const B_PLAIN = [
  '  /* ============ 머리 이음매 ============ */',
  '  var _aKit = window.OurgoalAKit;',
  '  var bootOne = _aKit.bootOne;',
  '  var bootTwo = _aKit.bootTwo;',
  '',
  '  bootOne(); /* 원래 자리에서 부른다 */',
  '  bootTwo();',
];
const S_PLAIN = ['  var _aKit = window.OurgoalAKit;', '  var bootOne = _aKit.bootOne;', '  var bootTwo = _aKit.bootTwo;', '  bootOne();', '  bootTwo();'];
const B_RELAY = [
  '  var _aKit = window.OurgoalAKit;',
  '  var _gKit = window.OurgoalGKit;',
  '  /* [#TASK-ES-000] js/g/team.js — 가져오기 1개 */',
  '  var renderTeam = _gKit.renderTeam;',
  '  window.OurgoalAppScope.expose(\'index.html\', {',
  '    get renderTeam(){ return renderTeam; }',
  '  });',
  '  var bootOne = _aKit.bootOne;',
  '  var bootTwo = _aKit.bootTwo;',
  '  bootOne();',
  '  bootTwo(); // 꼬리',
];
const S_RELAY = ['  var _aKit = window.OurgoalAKit;', '  var _gKit = window.OurgoalGKit;', '  var renderTeam = _gKit.renderTeam;', '  window.OurgoalAppScope.expose(\'index.html\', {', '    get renderTeam(){ return renderTeam; }', '  });', '  var bootOne = _aKit.bootOne;', '  var bootTwo = _aKit.bootTwo;', '  bootOne();', '  bootTwo();'];
const B_RELAY2 = [
  '  var _gKit = window.OurgoalGKit;',
  '  var renderTeam = _gKit.renderTeam;',
  '  var renderCrew = _gKit.renderCrew;',
  '  var bootOne = _gKit.bootOne;',
  '  bootOne();',
  '  window.OurgoalAppScope.expose(\'index.html\', { get renderTeam(){ return renderTeam; }, get renderCrew(){ return renderCrew; } });',
];
const S_RELAY2 = B_RELAY2.slice();
// keepInline: 실제 꼴을 줄인 것 — 손잡이 · 가져오기 셋 · 호출문 하나 · 남길 문 셋 · 뒤의 호출문 둘
const B_KEEP = [
  '  /* ============ 머리 ============ */',
  '  var _aKit = window.OurgoalAKit;',
  '  var bootTheme = _aKit.bootTheme;',
  '  var bootAuth = _aKit.bootAuth;',
  '  var bootRest = _aKit.bootRest;',
  '  bootTheme(); /* [#TASK-ES-000] 로드 중 구역 → js/a/one.js 의 bootTheme 로 옮김 — 원래 자리에서 부른다 */',
  '',
  '  /* ============ 서버 연결 ============ */',
  '  var SERVER_URL = \'https://example.invalid\';',
  '  var PUBLIC_KEY = \'public-key-0000\';',
  '  window.OurgoalAppState.define(\'sb\', window.makeClient ? window.makeClient(SERVER_URL, PUBLIC_KEY) : null);',
  '  bootAuth(); /* 원래 자리에서 부른다 */',
  '  // 꼬리 주석',
  '  bootRest();',
];
const KEPT_KEEP = ['  var _aKit = window.OurgoalAKit;', '  var bootTheme = _aKit.bootTheme;', '  bootTheme(); /* [#TASK-ES-000] 로드 중 구역 → js/a/one.js 의 bootTheme 로 옮김 — 원래 자리에서 부른다 */',
  '  var SERVER_URL = \'https://example.invalid\';', '  var PUBLIC_KEY = \'public-key-0000\';', '  window.OurgoalAppState.define(\'sb\', window.makeClient ? window.makeClient(SERVER_URL, PUBLIC_KEY) : null);'];
const S_KEEP = ['  var _aKit = window.OurgoalAKit;', '  var bootAuth = _aKit.bootAuth;', '  var bootRest = _aKit.bootRest;', '  bootAuth();', '  bootRest();'];
const KP = ['var SERVER_URL', 'var PUBLIC_KEY', "window.OurgoalAppState.define('sb'"];
const B_KEEP_NOCALL = [
  '  var _aKit = window.OurgoalAKit;',
  '  var bootAuth = _aKit.bootAuth;',
  '  var SERVER_URL = \'https://example.invalid\';',
  '  window.OurgoalAppState.define(\'sb\',',
  '    window.makeClient ? window.makeClient(SERVER_URL) : null);',
  '  bootAuth();',
];
const B_KEEP_RELAY_BEFORE = [
  '  var _aKit = window.OurgoalAKit;',
  '  var _gKit = window.OurgoalGKit;',
  '  var renderTeam = _gKit.renderTeam;',
  '  window.OurgoalAppScope.expose(\'index.html\', {',
  '    get renderTeam(){ return renderTeam; }',
  '  });',
  '  var bootAuth = _aKit.bootAuth;',
  '  var SERVER_URL = \'https://example.invalid\';',
  '  bootAuth();',
];
const B_KEEP_RELAY_AFTER = [
  '  var _aKit = window.OurgoalAKit;',
  '  var _gKit = window.OurgoalGKit;',
  '  var bootAuth = _aKit.bootAuth;',
  '  var SERVER_URL = \'https://example.invalid\';',
  '  var renderTeam = _gKit.renderTeam;',
  '  window.OurgoalAppScope.expose(\'index.html\', { get renderTeam(){ return renderTeam; } });',
  '  bootAuth();',
];

// ── G: 옵션 없이 돌리면 기준 생성기와 같다
{
  const cases = [['성공: 문만 있는 꼴', B_PLAIN, cfgFin()], ['성공: label 없음 · slot 있음', B_PLAIN, (() => { const c = cfgFin({ slot: 'HO' }); delete c.label; return c; })()],
    ['정지: expose 문과 불리지 않는 가져오기(relay 를 적지 않음)', B_RELAY, cfgFin()], ['정지: 그 밖의 var · 상태 선언(keepInline 을 적지 않음)', B_KEEP, cfgFin()], ['정지: 모르는 칸', B_PLAIN, cfgFin({ defer: true })]];
  const rows = cases.map(([name, body, cfg], i) => {
    const text = doc(body), d1 = makeDir('g-base-' + i, text), d2 = makeDir('g-now-' + i, text);
    const a = runGen(d1, cfg, BASE_GEN), b = runGen(d2, cfg);
    return { name, status: [a.status, b.status], same: a.status === b.status && read(d1) === read(d2) && bootOf(d1) === bootOf(d2) && a.stdout === b.stdout && a.metaText === b.metaText && a.err === b.err, err: b.err };
  });
  record('G1', '옵션 없이 돌리면 기준 생성기(PIN)와 같다 — 성공 둘 · 정지 셋의 index.html · 부팅 파일 · 표준 출력 · 메타 · 오류 글자가 전부 같다(expose 문 · 불리지 않는 가져오기 · 그 밖의 var · 상태 선언은 예전과 같은 글자로 멈춘다)',
    rows.every(r => r.same) && rows[0].status[0] === 0 && rows[2].status[0] !== 0 && /expose 문 1 · 호출되지 않는 가져오기 1/.test(rows[2].err) && /그 밖의 var 2 · 상태 선언\(define\) 1/.test(rows[3].err), rows);
}

// ── R: relay
const r1 = okCase('R1', 'relay: 가져오기 1 + getter 1(expose 문 세 줄) → 부팅 파일로 글자 그대로, 같은 자리 · 머리 주석에 이름과 근거 · 표준 출력 한 줄 · 메타 relayed', B_RELAY, cfgFin(relay('renderTeam')),
  { stmts: S_RELAY, n: [2, 2, 2], head: { relay: ['renderTeam'] } },
  r => r.meta.relayed.length === 1 && r.meta.relayed[0].name === 'renderTeam' && r.meta.relayed[0].reason === RSN && r.meta.relayed[0].movedTo === BOOT && r.meta.relayed[0].importLine === PRE.length + 3 + 4 && r.meta.relayed[0].getterLine === PRE.length + 3 + 6
    && r.meta.statements.imports === 3 && !r.meta.keptInline && (r.stdout.match(/^ {2}relay renderTeam — 가져오기 줄 \d+ · getter 줄 \d+\(expose 문 줄 \d+~\d+\) → js\/app\/boot\.js · 근거: /m) || []).length === 1);
okCase('R2', 'relay: 이름 둘이 한 expose 문(한 줄)에 있고 호출문 뒤에 와도 그대로 옮긴다', B_RELAY2, cfgFin(relay('renderTeam', 'renderCrew')), { stmts: S_RELAY2, n: [1, 1, 1], head: { relay: ['renderTeam', 'renderCrew'] } },
  r => r.meta.relayed.map(x => x.name).join(',') === 'renderTeam,renderCrew' && (r.stdout.match(/^ {2}relay /mg) || []).length === 2);

// ── K: keepInline
const k1 = okCase('K1', 'keepInline: 남길 문 셋 + 그 앞의 호출문 하나(+ 그 가져오기 · 손잡이)를 인라인에 줄 그대로 남기고, 나머지는 부팅 파일로 · 손잡이는 부팅 파일에 한 번 더 · 태그는 남긴 `</script>` 줄 끝', B_KEEP, cfgFin(keep(...KP)),
  { stmts: S_KEEP, n: [1, 2, 2], keptLines: KEPT_KEEP, head: { keep: 6, dup: ['_aKit'] } },
  r => { const k = r.meta.keptInline; return !!k && k.reason === KRSN && k.statements.map(x => x.kind).join(',') === 'var,var,define' && k.before.length === 1 && /호출문/.test(k.before[0].why) && k.pulled.length === 2 && k.duplicatedHandles.map(x => x.name).join(',') === '_aKit'
    && k.inline.statements === 6 && k.inline.bodyLines === 6 && k.boot.statements === 5 && k.inlineCallOrder.join(',') === 'bootTheme' && k.bootCallOrder.join(',') === 'bootAuth,bootRest' && r.meta.removed.shell === 0 && r.meta.removed.lines === B_KEEP.length - 6
    && r.meta.tag.line === PRE.length + 3 + 6 + 2 && r.meta.htmlLinesAfter === r.meta.htmlLinesBefore - (B_KEEP.length - 6) && (r.stdout.match(/^ {2}keepInline 「/mg) || []).length === 3 && (r.stdout.match(/^ {2}keepInline\(함께 남김\) /mg) || []).length === 3 && (r.stdout.match(/^ {2}keepInline\(손잡이 한 번 더\) _aKit/mg) || []).length === 1; });
okCase('K2', 'keepInline: 앞에 호출문이 없으면 지정한 문만 남는다(손잡이 한 번 더 없음) · 여러 줄에 걸친 상태 선언은 그 줄 전부가 남는다', B_KEEP_NOCALL, cfgFin(keep('var SERVER_URL', "window.OurgoalAppState.define('sb'")),
  { stmts: ['  var _aKit = window.OurgoalAKit;', '  var bootAuth = _aKit.bootAuth;', '  bootAuth();'], n: [1, 1, 1], keptLines: B_KEEP_NOCALL.slice(2, 5), head: { keep: 2 } },
  r => r.meta.keptInline.before.length === 0 && r.meta.keptInline.pulled.length === 0 && r.meta.keptInline.duplicatedHandles.length === 0 && r.meta.keptInline.inline.bodyLines === 3);
okCase('K3', 'keepInline: 줄 끝이 CRLF 인 index.html 은 CRLF 그대로, 남은 줄도 바이트가 같다(부팅 파일은 LF)', B_KEEP, cfgFin(keep(...KP)), { stmts: S_KEEP, n: [1, 2, 2], keptLines: KEPT_KEEP, head: { keep: 6, dup: ['_aKit'] }, crlf: true });
okCase('K4', 'keepInline + relay: 남길 문보다 앞에 있는 relay expose 문은 인라인에 남는다(그 가져오기 · 손잡이도) — 메타가 「인라인에 남음」으로 적는다', B_KEEP_RELAY_BEFORE, cfgFin(Object.assign(relay('renderTeam'), keep('var SERVER_URL'))),
  { stmts: ['  var _aKit = window.OurgoalAKit;', '  var bootAuth = _aKit.bootAuth;', '  bootAuth();'], n: [1, 1, 1], keptLines: ['  var _gKit = window.OurgoalGKit;', '  var renderTeam = _gKit.renderTeam;', '  window.OurgoalAppScope.expose(\'index.html\', {', '    get renderTeam(){ return renderTeam; }', '  });', '  var SERVER_URL = \'https://example.invalid\';'], head: { keep: 4 } },
  r => r.meta.relayed[0].movedTo === 'index.html(인라인에 남음)' && /relay expose 문/.test(r.meta.keptInline.before[0].why) && r.meta.keptInline.duplicatedHandles.length === 0);
okCase('K5', 'keepInline + relay: 남길 문보다 뒤에 있는 relay 중계는 부팅 파일로 간다', B_KEEP_RELAY_AFTER, cfgFin(Object.assign(relay('renderTeam'), keep('var SERVER_URL'))),
  { stmts: ['  var _aKit = window.OurgoalAKit;', '  var _gKit = window.OurgoalGKit;', '  var bootAuth = _aKit.bootAuth;', '  var renderTeam = _gKit.renderTeam;', '  window.OurgoalAppScope.expose(\'index.html\', { get renderTeam(){ return renderTeam; } });', '  bootAuth();'], n: [2, 1, 1], keptLines: ['  var SERVER_URL = \'https://example.invalid\';'], head: { relay: ['renderTeam'], keep: 1 } },
  r => r.meta.relayed[0].movedTo === BOOT);

// ── E: 실행 등가(vm)
{
  const runIn = codes => {
    const log = []; const mk = name => function () { log.push('call ' + name + '|this=' + (this === undefined ? 'undefined' : typeof this) + '|args=' + arguments.length); };
    const scope = {};
    const win = { OurgoalAKit: { bootTheme: mk('bootTheme'), bootAuth: function () { log.push('call bootAuth|sb=' + JSON.stringify(win.__state.sb)); }, bootRest: mk('bootRest'), bootOne: mk('bootOne'), bootTwo: mk('bootTwo') },
      OurgoalGKit: { renderTeam: mk('renderTeam'), renderCrew: mk('renderCrew'), bootOne: mk('gBootOne') }, __state: {},
      makeClient: (u, k) => ({ u, k }), OurgoalAppState: { define: (n, v) => { win.__state[n] = v; log.push('define ' + n + '=' + JSON.stringify(v)); } },
      OurgoalAppScope: { scope, expose: (owner, obj) => { log.push('expose ' + owner + ' ' + Object.keys(obj).join(',')); Object.defineProperties(scope, Object.getOwnPropertyDescriptors(obj)); } } };
    let threw = null; const ctx = vm.createContext({ window: win });
    try { for (const c of codes) vm.runInContext(c, ctx); } catch (e) { threw = String(e && e.message || e); }
    let relayVal = null; try { relayVal = typeof scope.renderTeam === 'function' ? scope.renderTeam === win.OurgoalGKit.renderTeam : null; } catch (e) { relayVal = 'threw ' + e.message; }
    return { log, threw, relayVal };
  };
  const eq = (id, title, body, cfg) => {
    const before = doc(body), d = makeDir(id.toLowerCase(), before); const r = runGen(d, cfg);
    const a = runIn([iifeOf(before).code]);
    const after = r.status === 0 ? iifeOf(read(d)) : null;
    const b = r.status === 0 ? runIn((after ? [after.code] : []).concat([bootOf(d)])) : { log: [], threw: 'gen failed: ' + r.err };
    record(id, title, r.status === 0 && a.threw === null && b.threw === null && a.log.length > 0 && JSON.stringify(a) === JSON.stringify(b), { status: r.status, err: r.err, before: a, after: b });
  };
  eq('E1', '실행 등가(vm) — keepInline: 원래 IIFE 와 「남긴 인라인 → 부팅 파일」의 호출 순서 · this · 인자 수 · 상태 선언 값(남긴 var 를 읽은 값) · 다음 호출이 본 값이 같다', B_KEEP, cfgFin(keep(...KP)));
  eq('E2', '실행 등가(vm) — relay: 통로에 올라간 getter 가 같은 순간에 같은 값을 돌려준다(expose 호출 순서 포함)', B_RELAY, cfgFin(relay('renderTeam')));
  eq('E3', '실행 등가(vm) — keepInline + relay(expose 가 남길 문보다 앞): 인라인에 남은 중계와 부팅 파일의 호출이 원래 순서와 같다', B_KEEP_RELAY_BEFORE, cfgFin(Object.assign(relay('renderTeam'), keep('var SERVER_URL'))));
  eq('E4', '실행 등가(vm) — keepInline + relay(expose 가 뒤)', B_KEEP_RELAY_AFTER, cfgFin(Object.assign(relay('renderTeam'), keep('var SERVER_URL'))));
}

// ── S: 정지 — relay
const rl = v => cfgFin({ relay: v });
stopCase('S01', '정지: relay 가 배열이 아니다(true 같은 스위치로 풀리지 않는다)', B_RELAY, rl(true), /relay 는 비지 않은 배열/);
stopCase('S02', '정지: relay 가 빈 배열', B_RELAY, rl([]), /relay 는 비지 않은 배열/);
stopCase('S03', '정지: relay 칸에 모르는 키', B_RELAY, rl([{ name: 'renderTeam', reason: RSN, force: true }]), /relay 에 모르는 칸: force/);
stopCase('S04', '정지: relay name 이 이름 꼴이 아니다', B_RELAY, rl([{ name: 'render Team', reason: RSN }]), /name 이 이름 꼴이 아니다/);
stopCase('S05', '정지: relay 근거 글자가 없다', B_RELAY, rl([{ name: 'renderTeam' }]), /근거\(reason\)가 없거나 짧거나/);
stopCase('S06', '정지: relay 근거 글자가 짧다(10자 미만)', B_RELAY, rl([{ name: 'renderTeam', reason: '상한 때문' }]), /근거\(reason\)가 없거나 짧거나/);
stopCase('S07', '정지: relay 근거 글자가 여러 줄', B_RELAY, rl([{ name: 'renderTeam', reason: '주인 세포가 798줄이라\n등록 블록을 못 붙인다' }]), /근거\(reason\)가 없거나 짧거나/);
stopCase('S08', '정지: relay 에 같은 이름 둘', B_RELAY, rl([{ name: 'renderTeam', reason: RSN }, { name: 'renderTeam', reason: RSN }]), /같은 이름이 둘/);
stopCase('S09', '정지: relay 이름의 가져오기 줄이 없다(쓰이지 않는 허용은 적지 않는다)', B_PLAIN, cfgFin(relay('renderTeam')), /가져오기 줄.*이 IIFE 최상위에 없다: renderTeam/);
stopCase('S10', '정지: relay 이름이 최상위에서 불린다(구역 함수다)', B_PLAIN, cfgFin(relay('bootOne')), /relay 이름이 최상위에서 불린다/);
stopCase('S11', '정지: relay 이름의 getter 가 없다(가져오기만 있다) — 「가져오기 1 + getter 1」이 아니다', B_RELAY.filter((_, i) => i < 4 || i > 6), cfgFin(relay('renderTeam')), /가져오기 1 \+ getter 1」이 아니다: renderTeam — getter 0개/);
stopCase('S12', '정지: relay 이름의 getter 가 둘이다', B_RELAY.concat(['  window.OurgoalAppScope.expose(\'index.html\', { get renderTeam(){ return renderTeam; } });']), cfgFin(relay('renderTeam')), /가져오기 1 \+ getter 1」이 아니다: renderTeam — getter 2개/);
stopCase('S13', '정지: getter 가 다른 이름을 돌려준다 — 설정에 없는 expose 로 보고 예전처럼 멈춘다', B_RELAY.map(l => l.replace('return renderTeam;', 'return bootOne;')), cfgFin(relay('renderTeam')), /전제 미충족.*expose 문 1/);
stopCase('S14', '정지: expose 문에 relay 로 적지 않은 속성이 함께 있다 — 예전처럼 멈춘다', B_RELAY.map(l => l.replace('get renderTeam(){ return renderTeam; }', 'get renderTeam(){ return renderTeam; }, get bootOne(){ return bootOne; }')), cfgFin(relay('renderTeam')), /전제 미충족.*expose 문 1/);
stopCase('S15', '정지: expose 문에 setter 가 있다 — 예전처럼 멈춘다', B_RELAY.map(l => l.replace('get renderTeam(){ return renderTeam; }', 'get renderTeam(){ return renderTeam; }, set renderTeam(v){ renderTeam = v; }')), cfgFin(relay('renderTeam')), /전제 미충족.*expose 문 1/);
stopCase('S16', '정지: expose 의 주인 글자가 index.html 이 아니다 — 예전처럼 멈춘다', B_RELAY.map(l => l.replace("expose('index.html'", "expose('other'")), cfgFin(relay('renderTeam')), /전제 미충족.*expose 문 1/);
stopCase('S17', '정지: relay 를 적어도 설정에 없는 불리지 않는 가져오기는 예전처럼 멈춘다', B_RELAY.concat(['  var orphan = _aKit.orphan;']), cfgFin(relay('renderTeam')), /전제 미충족.*호출되지 않는 가져오기 1/);
stopCase('S18', '정지: relay 이름을 getter 말고 다른 문이 읽는다(인자로 넘김) — 전제 밖의 문으로 멈춘다', B_RELAY.concat(['  window.use(renderTeam);']), cfgFin(relay('renderTeam')), /전제 미충족.*구역 함수가 아닌 호출문 1/);
stopCase('S19', '정지: relay 를 적었는데 그 이름 말고 다른 이름의 getter 만 있는 expose 문 — 예전처럼 멈춘다', B_RELAY2, cfgFin(relay('renderTeam')), /전제 미충족.*expose 문 1/);
// ── S: 정지 — keepInline
const kp = v => cfgFin({ keepInline: v });
stopCase('S31', '정지: keepInline 이 객체가 아니다(true 같은 스위치로 풀리지 않는다)', B_KEEP, kp(true), /keepInline 은 \{ statements, reason \}/);
stopCase('S32', '정지: keepInline 에 모르는 칸', B_KEEP, kp({ statements: KP, reason: KRSN, all: true }), /keepInline 에 모르는 칸: all/);
stopCase('S33', '정지: keepInline.statements 가 비었다', B_KEEP, kp({ statements: [], reason: KRSN }), /statements 는 문의 글자 앞머리/);
stopCase('S34', '정지: 앞머리가 너무 짧다(5자 미만)', B_KEEP, kp({ statements: ['var'], reason: KRSN }), /statements 는 문의 글자 앞머리/);
stopCase('S35', '정지: 같은 앞머리 둘', B_KEEP, kp({ statements: ['var SERVER_URL', 'var SERVER_URL'], reason: KRSN }), /같은 앞머리가 둘/);
stopCase('S36', '정지: keepInline 근거 글자가 없다', B_KEEP, kp({ statements: KP }), /keepInline 의 근거\(reason\)가 없거나 짧거나/);
stopCase('S37', '정지: keepInline 근거 글자가 짧다', B_KEEP, kp({ statements: KP, reason: '훅 때문' }), /keepInline 의 근거\(reason\)가 없거나 짧거나/);
stopCase('S38', '정지: 앞머리에 맞는 문이 없다', B_KEEP, kp({ statements: ['var NOT_HERE'], reason: KRSN }), /문 하나로 정해지지 않는다: 「var NOT_HERE」 — 맞는 최상위 문 0개/);
stopCase('S39', '정지: 앞머리에 맞는 문이 둘이다', B_KEEP, kp({ statements: ['var boot'], reason: KRSN }), /문 하나로 정해지지 않는다: 「var boot」 — 맞는 최상위 문 3개/);
stopCase('S40', '정지: 앞머리 둘이 같은 문을 가리킨다', B_KEEP, kp({ statements: ['var SERVER_URL', "var SERVER_URL = 'https"], reason: KRSN }), /지정 둘이 같은 문을 가리킨다/);
stopCase('S41', '정지: 남길 종류 밖 — 호출문', B_KEEP, kp({ statements: ['bootAuth()'], reason: KRSN }), /남길 수 있는 문은 var 선언.*상태 선언.*뿐이다: 「bootAuth\(\)」/);
stopCase('S42', '정지: 남길 종류 밖 — 손잡이 줄', B_KEEP, kp({ statements: ['var _aKit'], reason: KRSN }), /남길 수 있는 문은 var 선언/);
stopCase('S43', '정지: 남길 종류 밖 — 가져오기 줄', B_KEEP, kp({ statements: ['var bootRest'], reason: KRSN }), /남길 수 있는 문은 var 선언/);
stopCase('S44', '정지: 남길 문이 연달아 있지 않다(사이에 다른 최상위 문)', B_KEEP.slice(0, 9).concat(['  bootAuth();'], B_KEEP.slice(9, 11), ['  bootRest();']), kp({ statements: KP, reason: KRSN }), /남길 문이 연달아 있지 않다/);
stopCase('S45', '정지: 남길 문이 부팅 파일로 가는 문과 한 줄을 나눠 쓴다', B_KEEP.map(l => (/define\('sb'/.test(l) ? l + ' bootAuth();' : l)).filter(l => !/^ {2}bootAuth\(\); \/\*/.test(l)), kp({ statements: KP, reason: KRSN }), /한 줄을 나눠 쓴다/);
stopCase('S46', '정지: 남긴 var 를 부팅 파일로 가는 문이 읽는다', B_KEEP.concat(['  window.OurgoalAppState.define(\'late\', SERVER_URL);']), kp({ statements: KP, reason: KRSN }), /전제 미충족.*상태 선언\(define\) 1/);
stopCase('S47', '정지: 남긴 var 를 부팅 파일로 가는 relay getter 가 아닌 문이 읽는 꼴은 전제에서 걸리고, 가져오기를 인라인에 남는 호출과 부팅 파일로 가는 호출이 함께 쓰면 멈춘다(가져오기 줄은 한 곳에만)', B_KEEP.concat(['  bootTheme();']), kp({ statements: KP, reason: KRSN }), /가져오기 bootTheme 를 인라인에 남는 문과 부팅 파일로 가는 문이 함께 쓴다/);
stopCase('S48', '정지: keepInline 을 적용하면 부팅 파일에 호출문이 하나도 남지 않는다', [B_KEEP[1], B_KEEP[2], B_KEEP[5], B_KEEP[8], B_KEEP[9], B_KEEP[10]], kp({ statements: KP, reason: KRSN }), /부팅 파일에 구역 함수 호출문이 하나도 남지 않는다/);
stopCase('S49', '정지: keepInline 을 적어도 지정하지 않은 그 밖의 var · 상태 선언은 예전처럼 멈춘다', B_KEEP, kp({ statements: ['var SERVER_URL'], reason: KRSN }), /전제 미충족.*그 밖의 var 1 · 상태 선언\(define\) 1/);
stopCase('S50', '정지: finalize 밖의 모드에서는 relay · keepInline 이 모르는 칸이다(sweep)', B_PLAIN, { task: T, mode: 'sweep', label: 'x', relay: [{ name: 'a', reason: RSN }] }, /모르는 칸|relay/);

// ── U: unwire 의 dropDeadImport(설계 5.10절) — 읽는 곳이 없는 키트 가져오기 줄
const DRSN = '설정 탭 세포들은 키트에서 직접 부른다 — index.html 의 이 지역 변수를 읽는 곳이 없다(시험 꾸러미)';
const KITFILE = 'js/core/ui-helpers.js';
const KIT_DATA = ['(function(g){', '  function escapeHtml(s){ return String(s); }', '  function a11ySwitch(el){ return el; }', '  g.OurgoalUiHelpers = {', '    escapeHtml: escapeHtml,', '    a11ySwitch: a11ySwitch,', '    download: function(){}', '  };', '})(window);', ''].join('\n');
const B_DEAD = [
  '  /* ============ 머리 ============ */',
  '  var _ui = window.OurgoalUiHelpers;',
  '  var escapeHtml = _ui.escapeHtml;',
  '  var a11ySwitch = _ui.a11ySwitch;',
  '  var _aKit = window.OurgoalAKit;',
  '  var bootOne = _aKit.bootOne;',
  '  window.use(escapeHtml);',
  '  bootOne();',
];
const cfgUn = u => ({ task: T, slot: 'HO', mode: 'unwire', label: '시험 꾸러미', cells: [{ file: 'js/core/cell-registry.js' }], unwire: u });
const dead = (o) => Object.assign({ kitVar: '_ui', names: [], dropDeadImport: [{ name: 'a11ySwitch', reason: DRSN, definedIn: KITFILE }] }, o || {});
function makeUnDir(name, body, kitText) {
  const d = makeDir(name, doc(body));
  fs.mkdirSync(path.join(d, 'js', 'core'), { recursive: true });
  fs.writeFileSync(path.join(d, 'js', 'core', 'cell-registry.js'), '/* 시험 꾸러미 */\n', { encoding: 'utf8' });
  if (kitText !== null) fs.writeFileSync(path.join(d, KITFILE), kitText === undefined ? KIT_DATA : kitText, { encoding: 'utf8' });
  return d;
}
const unAudits = [];
function unOk(id, title, body, u, gone, extra) {
  const d = makeUnDir(id.toLowerCase(), body); const before = read(d); const r = runGen(d, cfgUn(u)); const got = r.status === 0 ? read(d) : null;
  const want = doc(body.filter(l => !gone.includes(l)));
  const al = got === null ? [] : got.split('\n'), bl = before.split('\n');
  let at = 0, sub = got !== null; for (const l of al) { while (at < bl.length && bl[at] !== l) at++; if (at >= bl.length) { sub = false; break; } at++; }
  unAudits.push({ id, ok: sub && got !== null && bl.length - al.length === gone.length, removed: bl.length - al.length });
  const more = extra && r.status === 0 ? extra(r) : true;
  record(id, title, r.status === 0 && got === want && sub && more, { status: r.status, err: r.err, diffAt: got !== null && got !== want ? firstDiff(got, want) : null, more, stdout: (r.stdout || '').split('\n').slice(0, 5), removed: r.meta && r.meta.removed });
}
function unStop(id, title, body, u, re, kitText) {
  const d = makeUnDir(id.toLowerCase(), body, kitText); const before = read(d); const r = runGen(d, cfgUn(u));
  record(id, title, r.status !== 0 && re.test(r.err || '') && read(d) === before, { status: r.status, err: r.err, htmlSame: read(d) === before });
}
unOk('U1', 'dropDeadImport: 읽는 곳이 없는 가져오기 한 줄만 지운다(names 는 비어도 된다) — 다른 줄은 그대로 · 표준 출력 한 줄 · 메타 removed.deadImports(이름 · 줄 · 키트 · 근거 · 데이터 속성을 다는 파일과 줄)', B_DEAD, dead(), ['  var a11ySwitch = _ui.a11ySwitch;'],
  r => { const x = (r.meta.removed.deadImports || [])[0]; return !!x && x.name === 'a11ySwitch' && x.kit === 'OurgoalUiHelpers' && x.reason === DRSN && x.definedIn === KITFILE && x.definedAtLine === 6 && r.meta.removed.imports.length === 0 && r.meta.deletedLines.length === 1 && (r.stdout.match(/^ {2}dead-import a11ySwitch — 줄 \d+/mg) || []).length === 1; });
unOk('U2', 'dropDeadImport + dropKitVar: 그 손잡이의 가져오기가 그것뿐이면 손잡이 줄도 함께 지운다(X2 — 지운 뒤 참조 0 을 생성기가 확인)', B_DEAD.filter(l => !/escapeHtml/.test(l)), dead({ dropKitVar: true }), ['  var a11ySwitch = _ui.a11ySwitch;', '  var _ui = window.OurgoalUiHelpers;'],
  r => !!r.meta.removed.kitVarLine && r.meta.removed.kitVarLine.name === '_ui' && r.meta.deletedLines.length === 2);
{ // G2: 옵션 없는 unwire 는 기준 생성기와 같다
  const body = B_DEAD.concat(['  window.OurgoalAppScope.expose(\'index.html\', {', '    get escapeHtml(){ return escapeHtml; }', '  });']).filter(l => l !== '  window.use(escapeHtml);');
  const u = { kitVar: '_ui', names: ['escapeHtml'], imports: true, exposeGetters: true, windowAssign: true };
  const d1 = makeUnDir('g2-base', body), d2 = makeUnDir('g2-now', body); const a = runGen(d1, cfgUn(u), BASE_GEN), b = runGen(d2, cfgUn(u));
  const s1 = makeUnDir('g2s-base', B_DEAD), s2 = makeUnDir('g2s-now', B_DEAD); const sa = runGen(s1, cfgUn({ kitVar: '_ui', names: ['escapeHtml'] }), BASE_GEN), sb = runGen(s2, cfgUn({ kitVar: '_ui', names: ['escapeHtml'] }));
  record('G2', 'dropDeadImport 를 적지 않은 unwire 는 기준 생성기(PIN)와 같다 — 성공 하나 · 정지 하나(철거한 이름을 아직 쓰는 곳이 남는다)의 index.html · 표준 출력 · 메타 · 오류 글자가 같다',
    a.status === 0 && b.status === 0 && read(d1) === read(d2) && a.stdout === b.stdout && a.metaText === b.metaText && sa.status !== 0 && sb.status !== 0 && sa.err === sb.err && read(s1) === read(s2), { status: [a.status, b.status, sa.status, sb.status], err: sb.err });
}
const dd = v => ({ kitVar: '_ui', names: [], dropDeadImport: v });
const D1 = { name: 'a11ySwitch', reason: DRSN, definedIn: KITFILE };
unStop('S61', '정지: dropDeadImport 가 배열이 아니다(true 같은 스위치로 풀리지 않는다)', B_DEAD, dd(true), /dropDeadImport 는 비지 않은 배열/);
unStop('S62', '정지: dropDeadImport 칸에 모르는 키', B_DEAD, dd([Object.assign({ force: true }, D1)]), /dropDeadImport 에 모르는 칸: force/);
unStop('S63', '정지: 근거 글자가 없다', B_DEAD, dd([{ name: 'a11ySwitch', definedIn: KITFILE }]), /근거\(reason\)가 없거나 짧거나/);
unStop('S64', '정지: 근거 글자가 짧다', B_DEAD, dd([Object.assign({}, D1, { reason: '안 쓴다' })]), /근거\(reason\)가 없거나 짧거나/);
unStop('S65', '정지: definedIn 이 없다', B_DEAD, dd([{ name: 'a11ySwitch', reason: DRSN }]), /definedIn.*없거나 꼴이 다르다/);
unStop('S66', '정지: definedIn 이 js/ 아래 파일 꼴이 아니다(경로 올라가기)', B_DEAD, dd([Object.assign({}, D1, { definedIn: 'js/../secret.js' })]), /definedIn.*없거나 꼴이 다르다/);
unStop('S67', '정지: 같은 이름 둘', B_DEAD, dd([D1, D1]), /같은 이름이 둘/);
unStop('S68', '정지: 같은 이름이 unwire.names 에도 있다', B_DEAD, { kitVar: '_ui', names: ['a11ySwitch'], dropDeadImport: [D1] }, /unwire\.names 에도 있다/);
unStop('S69', '정지: 그 이름의 가져오기 줄이 없다(쓰이지 않는 허용은 적지 않는다)', B_DEAD.filter(l => !/a11ySwitch/.test(l)), dd([D1]), /가져오기 줄이 IIFE 최상위에 꼭 하나가 아니다: a11ySwitch — 0개/);
unStop('S70', '정지: 오른쪽이 호출이다(부수효과 가능 식)', B_DEAD.map(l => l.replace('_ui.a11ySwitch;', '_ui.makeSwitch();')), dd([D1]), /단순 속성 읽기가 아니다/);
unStop('S71', '정지: 오른쪽이 계산된 속성 읽기다', B_DEAD.map(l => l.replace('_ui.a11ySwitch;', "_ui['a11ySwitch'];")), dd([D1]), /단순 속성 읽기가 아니다/);
unStop('S72', '정지: 오른쪽이 다른 손잡이의 속성이다', B_DEAD.map(l => l.replace('_ui.a11ySwitch;', '_aKit.a11ySwitch;')), dd([D1]), /단순 속성 읽기가 아니다/);
unStop('S73', '정지: 오른쪽 속성 이름이 다르다', B_DEAD.map(l => l.replace('_ui.a11ySwitch;', '_ui.other;')), dd([D1]), /단순 속성 읽기가 아니다/);
unStop('S74', '정지: 가져오기 줄이 다른 글자와 한 줄을 나눠 쓴다', B_DEAD.map(l => l.replace('  var a11ySwitch = _ui.a11ySwitch;', '  var a11ySwitch = _ui.a11ySwitch; window.x = 1;')), dd([D1]), /다른 글자와 한 줄을 나눠 쓴다/);
unStop('S75', '정지: IIFE 최상위 문이 그 이름을 읽는다', B_DEAD.concat(['  window.use(a11ySwitch);']), dd([D1]), /IIFE 안에서 읽거나 쓰는 곳이 있다 — 죽은 가져오기가 아니다: a11ySwitch/);
unStop('S76', '정지: 안쪽 함수가 그 이름을 읽는다', B_DEAD.concat(['  window.later = function(){ return a11ySwitch; };']), dd([D1]), /IIFE 안에서 읽거나 쓰는 곳이 있다/);
unStop('S77', '정지: 그 이름에 다시 대입하는 곳이 있다', B_DEAD.concat(['  window.reset = function(){ a11ySwitch = null; };']), dd([D1]), /IIFE 안에서 읽거나 쓰는 곳이 있다/);
unStop('S78', '정지: 그 이름이 낱말로 든 문자열이 있다(동적 접근일 수 있다)', B_DEAD.concat(["  window.pick = function(k){ return window.OurgoalUiHelpers[k]; }; window.keyName = 'a11ySwitch';"]), dd([D1]), /낱말로 든 문자열이 IIFE 안에 있다/);
unStop('S79', '정지: 그 이름이 든 템플릿 글자가 있다', B_DEAD.concat(['  window.msg = `call a11ySwitch now`;']), dd([D1]), /낱말로 든 문자열이 IIFE 안에 있다/);
unStop('S80', '정지: 그 이름의 getter 가 expose 문에 있다(통로로 나가는 이름이다)', B_DEAD.concat(['  window.OurgoalAppScope.expose(\'index.html\', {', '    get a11ySwitch(){ return window.OurgoalUiHelpers.a11ySwitch; }', '  });']), dd([D1]), /getter·setter 가 IIFE 안에 있다/);
unStop('S81', '정지: 그 이름으로 대입하는 줄이 있다(window 노출일 수 있다)', B_DEAD.concat(['  window.a11ySwitch = window.OurgoalUiHelpers.a11ySwitch;']), dd([D1]), /대입하는 줄이 IIFE 안에 있다/);
unStop('S82', '정지: IIFE 안에 eval 이 있다', B_DEAD.concat(['  window.run = function(s){ return eval(s); };']), dd([D1]), /IIFE 안에 eval 이 있다/);
unStop('S83', '정지: IIFE 안에 new Function 이 있다', B_DEAD.concat(["  window.mk = function(s){ return new Function('return ' + s); };"]), dd([D1]), /IIFE 안에 new Function 이 있다/);
unStop('S84', '정지: definedIn 파일이 없다', B_DEAD, dd([D1]), /definedIn 파일이 없다/, null);
unStop('S85', '정지: definedIn 파일이 그 속성을 getter 로 정의한다(읽기만으로 부수효과가 날 수 있다)', B_DEAD, dd([D1]), /접근자\(get\/set · defineProperty\)로 정의한다/, KIT_DATA.replace('    a11ySwitch: a11ySwitch,', '    get a11ySwitch(){ window.sideEffect = (window.sideEffect || 0) + 1; return a11ySwitch; },'));
unStop('S86', '정지: definedIn 파일이 그 속성을 Object.defineProperty 로 정의한다', B_DEAD, dd([D1]), /접근자\(get\/set · defineProperty\)로 정의한다/, KIT_DATA.replace('    a11ySwitch: a11ySwitch,', '').replace('})(window);', "  Object.defineProperty(g.OurgoalUiHelpers, 'a11ySwitch', { get: function(){ return a11ySwitch; } });\n})(window);"));
unStop('S87', '정지: definedIn 파일에 그 속성을 다는 자리가 없다', B_DEAD, dd([D1]), /데이터 속성으로 다는 자리.*를 찾지 못했다/, KIT_DATA.replace('    a11ySwitch: a11ySwitch,', ''));
stopCase('S88', '정지: unwire 밖의 모드에서는 dropDeadImport 가 모르는 칸이다(finalize)', B_PLAIN, cfgFin({ dropDeadImport: [D1] }), /finalize 설정에 모르는 칸: dropDeadImport/);
{ // E5: 실행 등가(vm) — 데이터 속성이면 그 줄을 지워도 읽기 흔적이 같고, 접근자였다면 달라진다(그래서 접근자면 멈춘다)
  const mkWin = accessor => { const log = []; const kit = { escapeHtml: s => s }; if (accessor) Object.defineProperty(kit, 'a11ySwitch', { get() { log.push('read a11ySwitch'); return () => {}; }, enumerable: true }); else kit.a11ySwitch = () => {};
    return { log, win: { OurgoalUiHelpers: kit, OurgoalAKit: { bootOne() { log.push('call bootOne'); } }, use() { log.push('use'); } } }; };
  const runCode = (code, accessor) => { const w = mkWin(accessor); let threw = null; try { vm.runInContext(code, vm.createContext({ window: w.win })); } catch (e) { threw = String(e.message || e); } return { log: w.log, threw }; };
  const d = makeUnDir('e5', B_DEAD); const before = iifeOf(read(d)).code; const r = runGen(d, cfgUn(dead())); const after = r.status === 0 ? iifeOf(read(d)).code : '';
  const a = runCode(before, false), b = runCode(after, false), a2 = runCode(before, true), b2 = runCode(after, true);
  record('E5', '실행 등가(vm) — dropDeadImport: 그 속성이 데이터 속성이면 지우기 전후의 실행 흔적이 같다. 접근자였다면 지우기 전에만 읽기 흔적이 남는다(= 접근자면 생성기가 멈추는 까닭)',
    r.status === 0 && a.threw === null && b.threw === null && JSON.stringify(a.log) === JSON.stringify(b.log) && a.log.length === 2 && a2.log.includes('read a11ySwitch') && !b2.log.includes('read a11ySwitch'), { status: r.status, err: r.err, data: [a, b], accessor: [a2, b2] });
}
record('AU', '감사(dropDeadImport 성공 꾸러미 — 생성기와 따로): 지운 뒤의 줄은 지우기 전 줄의 부분열(바이트 동일)이고 줄 수 차이 = 지운 줄 수다', unAudits.length === 2 && unAudits.every(a => a.ok), unAudits);

// ── A: 감사
record('A', '감사(성공한 꾸러미 전부 — 생성기와 따로): keepInline 은 「원래 문 = 남긴 문 + 옮긴 문」(겹침은 손잡이뿐) · 남은 인라인 줄은 원래 줄의 부분열(바이트 동일) · 블록 밖 그대로 · 부팅 태그 한 번, 그 밖은 IIFE 블록이 사라지고 부팅 파일의 문 = 원래 문 전부',
  audits.length === 7 && audits.every(a => a.ok), audits);

// ── X1: 실제 index.html(PIN)
{
  const html0 = blobBuf(PIN + ':index.html'), d = makeDir('x1', '');
  fs.writeFileSync(path.join(d, 'index.html'), html0, { encoding: 'utf8' });
  const cfg = cfgFin(Object.assign(relay('renderTeamGoalsScreen'), keep('var SUPABASE_URL', 'var SUPABASE_ANON_KEY', "window.OurgoalAppState.define('sb'")));
  const r = runGen(d, cfg);
  const m = /전제 미충족 — IIFE 최상위에 키트 손잡이·구역 함수 가져오기·구역 함수 호출문 밖의 문이 (\d+)개 있다\(([^)]*)\)/.exec(r.err || '');
  record('X1', '실제 index.html(PIN): relay · keepInline 을 실제 이름으로 줘도 전제 밖의 문이 남아 있어 멈춘다(오류 글자에 종류별 수 — 재철거 3차 · 구역 이전 3차가 먼저다). index.html 은 그대로이고 부팅 파일은 생기지 않는다',
    r.status !== 0 && !!m && Number(m[1]) > 0 && fs.readFileSync(path.join(d, 'index.html')).equals(html0) && bootOf(d) === null, { status: r.status, err: (r.err || '').slice(0, 400), outside: m && Number(m[1]), kinds: m && m[2] });
}
// ── X2: 두 번 돌리면 멈춘다
{
  const d = makeDir('x2', doc(B_KEEP)); const one = runGen(d, cfgFin(keep(...KP))); const html1 = read(d), boot1 = bootOf(d); const two = runGen(d, cfgFin(keep(...KP)));
  record('X2', 'keepInline 으로 한 번 돌린 결과에 다시 돌리면 멈추고(부팅 파일이 이미 있다) index.html · 부팅 파일이 그대로다', one.status === 0 && two.status !== 0 && /부팅 파일이 이미 있다/.test(two.err || '') && read(d) === html1 && bootOf(d) === boot1, { status: [one.status, two.status], err: two.err });
}

const passed = results.filter(r => r.ok).length;
const out = { tool: 'docs/design/harness/module-split/finalize-check-681.js', type: '작업자 측정, 판정 아님', pin: PIN, measuredAt: new Date().toISOString(), total: results.length, passed, failed: results.filter(r => !r.ok).map(r => r.id), results };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 — 못 지워도 그만 */ }
console.log('\n' + passed + '/' + results.length + ' 통과' + (passed === results.length ? '' : ' · 실패: ' + out.failed.join(', ')));
process.exit(passed === results.length ? 0 : 1);
