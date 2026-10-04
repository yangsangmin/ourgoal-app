'use strict';
// #TASK-ES-395 EXP 세포(js/avatar/xp.js) 이전 — 옮기기 전후 글자·토큰·누수·실행 검사(작업자 측정, 판정 아님).
//   ① 토큰: 옮긴 선언 8개마다 이전 전 index.html 의 토큰열 = xp.js 의 토큰열(허용 차이: L. 접두, awardXP 의 저장 어댑터 부르는 줄 1개 —
//          어댑터 xpStore 의 만들기 갈래 두 문장을 그 자리에 되끼우면 같아야 한다)
//   ② index.html 줄: 이전 전 줄 열에서 옮긴 줄을 빼고, 새 줄 열에서 허용 줄(가져오기 9 · 안내 주석 3 · <script> 1)을 빼면 두 열이 줄 단위로 같다
//          (호출처·app-scope getter·window 대입 줄 글자 그대로)
//   ③ 누수: xp.js 자유 이름 ⊆ 브라우저 전역, L.<이름> 이 index.html expose 목록에 있다, index.html IIFE 에 옮긴 이름 정의가 가져오기 말고는 0,
//          index.html 이 쓰는 옮긴 이름이 모두 가져와졌다, 가져오기가 IIFE 첫 실행 줄들(다른 문보다 앞) 안에 있다
//   ④ 실행(부품 시험): 같은 상태 사본에 체크인·마일스톤·퀘스트·팀 인증·음수·200건 상한 지급 순서를 기준(이전 전 구간을 그대로 실행)·작업(xp.js) 양쪽에 돌려
//          매 단계 settings.xp·반환값·축하 팝업 DOM·홈 링 알림 인자 deepStrictEqual, 레벨 함수 0~200000 전수 같음
//   ⑤ 능력: xp.award·xp.read 가 capabilities 에 있고 cell=avatar/xp, xp.read 는 저장 칸을 만들지 않으며 프로필이 없어도 던지지 않는다
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-avatar-xp.js <APP_DIR> <BASE_DIR(git archive 사본)> [out.json]
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = path.resolve(process.argv[2]), BASE = path.resolve(process.argv[3]), OUT = process.argv[4];
const rd = (d, rel) => fs.readFileSync(path.join(d, rel), 'utf8').replace(/\r\n/g, '\n');
const MOVED = ['XP_RULES', 'XP_LOG_MAX', 'xpForLevel', 'levelForXP', 'levelProgress', 'triggerAvatarCelebrationPopup', 'awardXP', 'notifyXpGained'];
const IMPORTED = MOVED.filter(n => n !== 'XP_LOG_MAX');
const results = [];
function check(name, fn) {
  try { const detail = fn(); results.push({ name, ok: true, detail: detail || null }); console.log('  ok · ' + name + (detail ? ' — ' + JSON.stringify(detail).slice(0, 300) : '')); }
  catch (e) { process.exitCode = 1; results.push({ name, ok: false, error: String(e && e.message || e).slice(0, 600) }); console.error('  실패 · ' + name + '\n      ' + String(e && e.message || e).slice(0, 600)); }
}
const inlineRange = lines => {
  let s = -1, e = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
  return [s, e];
};
const baseIdx = rd(BASE, 'index.html'), appIdx = rd(APP, 'index.html');
const baseLines = baseIdx.split('\n'), appLines = appIdx.split('\n');
const [bs, be] = inlineRange(baseLines), [as, ae] = inlineRange(appLines);
const baseInline = baseLines.slice(bs, be).join('\n'), appInline = appLines.slice(as, ae).join('\n');
const xpSrc = rd(APP, 'js/avatar/xp.js');
const tokVals = toks => toks.filter(t => t.type !== 'CommentLine' && t.type !== 'CommentBlock' && t.type.label !== 'eof')
  .map(t => (t.type.label === 'name' || t.type.keyword) ? String(t.value) : (t.value !== undefined ? t.type.label + ':' + String(t.value) : t.type.label));
const stripL = vals => { const out = []; for (let i = 0; i < vals.length; i++) { if (vals[i] === 'L' && vals[i + 1] === '.' && /^[A-Za-z_$]/.test(vals[i + 2] || '')) { i++; continue; } out.push(vals[i]); } return out; };
const topDecls = body => { const m = {}; for (const x of body) { if (x.type === 'FunctionDeclaration') m[x.id.name] = x; else if (x.type === 'VariableDeclaration' && x.declarations.length === 1 && x.declarations[0].id.type === 'Identifier') m[x.declarations[0].id.name] = x; } return m; };
const bast = parser.parse(baseInline, { sourceType: 'script', tokens: true });
const xast = parser.parse(xpSrc, { sourceType: 'script', tokens: true });
const bdecl = topDecls(bast.program.body[0].expression.callee.body.body);
const xdecl = topDecls(xast.program.body[0].expression.callee.body.body);
const toksIn = (ast, node) => tokVals(ast.tokens.filter(t => t.start >= node.start && t.end <= node.end));
let allowedTokenDiff = 0;

check('① 토큰: 옮긴 선언 8개 = 이전 전 index.html (허용 차이: L. 접두 · awardXP 의 저장 어댑터 부르는 줄)', () => {
  const rows = [];
  for (const n of MOVED) {
    assert.ok(bdecl[n], '기준 index.html 에 ' + n);
    assert.ok(xdecl[n], 'xp.js 에 ' + n);
    const a = toksIn(bast, bdecl[n]);
    let rawB = toksIn(xast, xdecl[n]);
    let b = stripL(rawB);
    allowedTokenDiff += rawB.length - b.length;
    if (n === 'awardXP') {
      // 어댑터 되끼우기: `var xp = xpStore ( true ) ;` → xpStore 만들기 갈래의 if 문 + `var xp =` + return 식 + `;`
      const store = xdecl.xpStore; assert.ok(store, 'xpStore 선언');
      const stmts = store.body.body; assert.strictEqual(stmts.length, 3, 'xpStore 문 3개(읽기 갈래 if · 만들기 if · return)');
      const ifToks = stripL(toksIn(xast, stmts[1]));
      const retArg = stripL(toksIn(xast, stmts[2].argument));
      const k = b.indexOf('xpStore');
      assert.ok(k > 0, 'awardXP 안 xpStore');
      const want = tokVals(parser.parse('var xp = xpStore(true);', { tokens: true }).tokens);
      assert.deepStrictEqual(b.slice(k - 3, k + 5), want, 'awardXP 첫 문 = var xp = xpStore(true);');
      assert.strictEqual(xdecl.awardXP.body.body[0].start, xast.tokens.find(t => t.start >= xdecl.awardXP.body.start + 1).start, '어댑터 부르는 줄이 awardXP 첫 문');
      const before = b.slice(0, k - 3), after = b.slice(k + 5);
      const re = [...before, ...ifToks, ...want.slice(0, 3), ...retArg, want[want.length - 1], ...after];
      allowedTokenDiff += Math.abs(b.length - re.length);
      b = re;
    }
    const same = a.length === b.length && a.every((v, i) => v === b[i]);
    let at = -1; if (!same) for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break; }
    rows.push({ name: n, tokensBase: a.length, tokensAfter: b.length, same, firstDiff: same ? null : { i: at, base: a.slice(Math.max(0, at - 4), at + 6), after: b.slice(Math.max(0, at - 4), at + 6) } });
  }
  const bad = rows.filter(r => !r.same);
  assert.strictEqual(bad.length, 0, '다른 선언: ' + JSON.stringify(bad));
  return { decls: rows.length, tokens: rows.reduce((s, r) => s + r.tokensBase, 0), allowedTokenDiff, rows: rows.map(r => r.name + ':' + r.tokensBase) };
});

const START = '  /* ============ XP/레벨 시스템 ============ */';
const END = '  window.notifyXpGained = notifyXpGained;';
const WIN = /^  window\.(triggerAvatarCelebrationPopup|xpForLevel|levelForXP|levelProgress|notifyXpGained) = \1;$/;
let removedLines = 0, addedLines = 0;
check('② index.html 줄: 옮긴 줄·허용 줄을 빼면 이전 전과 줄 단위로 같다(호출처·getter·window 대입 줄 그대로)', () => {
  const s = baseLines.indexOf(START), e = baseLines.indexOf(END);
  assert.ok(s > 0 && e > s, '기준 구간');
  const baseKept = baseLines.filter((l, i) => !(i >= s && i <= e && !WIN.test(l)));
  removedLines = baseLines.length - baseKept.length;
  const ALLOWED = [
    l => /^  <script src="js\/avatar\/xp\.js\?v=[0-9a-z-]+"><\/script>$/.test(l),
    l => l.startsWith('  /* [#TASK-ES-395] EXP 세포 가져오기'),
    l => l === '  var _xp = window.OurgoalAvatarParts.xp;',
    l => IMPORTED.some(n => l === '  var ' + n + ' = _xp.' + n + ';'),
    l => l === '  /* ============ XP/레벨 시스템 ============',
    l => l.startsWith('     [#TASK-ES-395] 선언('),
    l => l === '     이 IIFE 맨 위에서 같은 이름으로 가져온다. 아래 window 대입 줄은 원래 자리 그대로다. */',
  ];
  const appKept = appLines.filter(l => !ALLOWED.some(f => f(l)));
  addedLines = appLines.length - appKept.length;
  assert.strictEqual(addedLines, 1 + 1 + 1 + IMPORTED.length + 3, '허용 줄 수(<script> 1 · 주석 1 · _xp 1 · 가져오기 ' + IMPORTED.length + ' · 안내 3)');
  assert.strictEqual(appKept.length, baseKept.length, '줄 수');
  for (let i = 0; i < appKept.length; i++) if (appKept[i] !== baseKept[i]) throw new Error('첫 다른 줄 ' + i + ': 기준 ' + JSON.stringify(baseKept[i].slice(0, 120)) + ' / 작업 ' + JSON.stringify(appKept[i].slice(0, 120)));
  // window 대입 5줄은 원래 순서·원래 이웃(앞: subscriptionState 끝, 뒤: hasUserCustomizedAvatar)
  const wa = appLines.map((l, i) => WIN.test(l) ? i : -1).filter(i => i >= 0);
  assert.strictEqual(wa.length, 5, 'window 대입 5줄');
  assert.ok(appLines[wa[4] + 1].startsWith('  function hasUserCustomizedAvatar('), 'notifyXpGained 대입 다음 줄 그대로');
  return { baseLines: baseLines.length, afterLines: appLines.length, removedLines, addedLines, comparedLines: appKept.length, windowLines: wa.map(i => i + 1) };
});

check('③ 누수·가져오기: xp.js 자유 이름 ⊆ 전역, L.<이름> 노출됨, 옮긴 정의 index.html 에 0, 쓰는 이름 모두 가져옴, 가져오기는 IIFE 머리', () => {
  const GLOBALS = new Set(['window', 'document', 'setTimeout', 'Math', 'module', 'require', 'globalThis']);
  const free = new Set(), usedL = new Set();
  const xa = parser.parse(xpSrc, { sourceType: 'script' });
  traverse(xa, { Identifier(p) {
    const par = p.parent;
    if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) { if (par.object.type === 'Identifier' && par.object.name === 'L') usedL.add(p.node.name); return; }
    if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed) return;
    if (!p.isReferencedIdentifier() && !(p.parentPath.isAssignmentExpression() && par.left === p.node)) return;
    if (p.scope.getBinding(p.node.name)) return;
    free.add(p.node.name);
  } });
  const strayFree = [...free].filter(n => !GLOBALS.has(n));
  assert.deepStrictEqual(strayFree, [], '전역 아닌 자유 이름');
  const nast = parser.parse(appInline, { sourceType: 'script' });
  let iife; traverse(nast, { FunctionExpression(p) { if (!iife) { iife = p; p.stop(); } } });
  const exposed = new Set(), imported = new Map();
  iife.traverse({
    CallExpression(p) { const c = p.node.callee; if (c.type === 'MemberExpression' && c.property.name === 'expose' && p.node.arguments[1] && p.node.arguments[1].properties) for (const pr of p.node.arguments[1].properties) if (pr.kind === 'get') exposed.add(pr.key.name); },
    VariableDeclarator(p) { const i = p.node.init; if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && i.object.name === '_xp') imported.set(p.node.id.name, p.node.loc.start.line); }
  });
  const notExposed = [...usedL].filter(n => !exposed.has(n));
  assert.deepStrictEqual(notExposed, [], 'L.<이름> 미노출');
  const leftDefs = MOVED.filter(n => { const b = iife.scope.bindings[n]; return b && (b.path.isFunctionDeclaration() || (b.path.isVariableDeclarator() && !imported.has(n))); });
  assert.deepStrictEqual(leftDefs, [], 'index.html 에 남은 옮긴 정의');
  const usedNotImported = [];
  iife.traverse({ Identifier(p) {
    const nm = p.node.name; if (!MOVED.includes(nm) || !p.isReferencedIdentifier()) return;
    const par = p.parent; if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) return;
    const b = p.scope.getBinding(nm);
    if (!b || (b.scope === iife.scope && !imported.has(nm))) usedNotImported.push(nm + '@' + p.node.loc.start.line);
  } });
  assert.deepStrictEqual(usedNotImported, [], '가져오지 않고 쓰는 옮긴 이름');
  assert.deepStrictEqual([...imported.keys()].sort(), IMPORTED.slice().sort(), '가져온 이름');
  // 가져오기 줄이 IIFE 본문의 앞쪽(첫 함수 호출·다른 탭 키트보다 앞)에 있다 — var 끌어올림으로 undefined 인 채 불리는 시점 없음
  const body = iife.node.body.body;
  const firstImport = body.findIndex(st => st.type === 'VariableDeclaration' && st.declarations[0].init && st.declarations[0].init.type === 'MemberExpression' && st.declarations[0].init.object.name === '_xp');
  const firstNonVar = body.findIndex(st => !(st.type === 'VariableDeclaration' || (st.type === 'ExpressionStatement' && st.expression.type === 'StringLiteral') || st.type === 'ExpressionStatement' && st.directive));
  assert.ok(firstImport >= 0 && firstImport < firstNonVar, '가져오기 위치 ' + firstImport + ' < 첫 실행 문 ' + firstNonVar);
  return { xpFreeNames: [...free].sort(), usedL: [...usedL].sort(), imported: [...imported.keys()], importLines: [...imported.values()], firstImportStmt: firstImport, firstNonVarStmt: firstNonVar };
});

// ④ 실행 — 기준: 이전 전 구간 원문을 그대로 함수 안에서 실행 / 작업: app-scope.js · capabilities.js · xp.js 를 브라우저처럼 vm 에 읽힘
function fakeDom(log) {
  const mk = tag => { const el = { tagName: tag, id: '', style: { cssText: '' }, innerHTML: '', parentNode: null, onclick: null, remove() { this.parentNode = null; log.push(['remove', this.id]); } }; return el; };
  const body = { appendChild(el) { el.parentNode = body; log.push(['append', el.id, el.style.cssText, el.innerHTML]); } };
  return { body, getElementById(id) { return null; }, createElement: mk };
}
const NOW = '2026-10-05T00:00:00.000Z';
function baseKit(state, log) {
  const s = baseLines.indexOf(START), e = baseLines.indexOf(END);
  const src = baseLines.slice(s, e + 1).join('\n');
  const win = { OurgoalHomeOneScreen: { onXpGained(a, t) { log.push(['ring', a, t]); } } };
  const f = new Function('state', 'nowISO', 'document', 'window', 'setTimeout', '"use strict";\n' + src + '\nreturn { XP_RULES, XP_LOG_MAX, xpForLevel, levelForXP, levelProgress, triggerAvatarCelebrationPopup, awardXP, notifyXpGained };');
  return f(state, () => NOW, fakeDom(log), win, () => 0);
}
function appKit(state, log) {
  const ctx = { console, setTimeout: () => 0 };
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  ctx.document = fakeDom(log);
  ctx.OurgoalHomeOneScreen = { onXpGained(a, t) { log.push(['ring', a, t]); } };
  vm.createContext(ctx);
  for (const f of ['js/core/app-scope.js', 'js/core/capabilities.js', 'js/avatar/xp.js']) vm.runInContext(rd(APP, f), ctx, { filename: f });
  ctx.OurgoalAppScope.expose('index.html', { get state() { return state; }, get nowISO() { return () => NOW; } });
  return { kit: ctx.OurgoalAvatarParts.xp, caps: ctx.OurgoalCapabilities, ctx };
}
const SEQ = [
  ['checkin', 'XP_RULES.checkin', '체크인'],
  ['milestone', 'XP_RULES.milestoneDone', '마일스톤 완료'],
  ['quest1', 30, '데일리 퀘스트: 오늘 한 줄 체크인 (+30 EXP)'],
  ['quest2', 40, '데일리 퀘스트: 핵심 마일스톤 실행 (+40 EXP)'],
  ['quest3', 50, '데일리 퀘스트: 25분 집중 시간기록 (+50 EXP)'],
  ['team', 'XP_RULES.groupCheckin || 15', '팀 인증 완료'],
  ['record', 'XP_RULES.checkin', '기록 추가'],
  ['zero', 0, '0 지급'],
  ['minus', -5, '음수'],
];
const amt = (kit, a) => typeof a === 'number' ? a : (a === 'XP_RULES.checkin' ? kit.XP_RULES.checkin : a === 'XP_RULES.milestoneDone' ? kit.XP_RULES.milestoneDone : (kit.XP_RULES.groupCheckin || 15));
let partSteps = 0;
check('④ 부품 시험: 지급 순서마다 settings.xp·반환값·팝업 DOM·홈 링 알림이 기준과 deepStrictEqual (빈 칸·기존 값·200건 상한)', () => {
  const STARTS = {
    empty: { profile: { settings: {} } },
    existing: { profile: { avatarUrl: 'data:image/png;base64,AA', settings: { xp: { total: 290, log: [{ amount: 10, reason: '체크인', at: '2026-10-01T00:00:00.000Z' }] } } } },
    nearCap: { profile: { settings: { customAvatarUrl: 'u.png', xp: { total: 9990, log: Array.from({ length: 200 }, (_, i) => ({ amount: 1, reason: 'r' + i, at: NOW })) } } } },
  };
  const out = {};
  for (const [k, st] of Object.entries(STARTS)) {
    const sa = JSON.parse(JSON.stringify(st)), sb = JSON.parse(JSON.stringify(st));
    const la = [], lb = [];
    const A = baseKit(sa, la), B = appKit(sb, lb).kit;
    assert.deepStrictEqual(JSON.parse(JSON.stringify(B.XP_RULES)), JSON.parse(JSON.stringify(A.XP_RULES)), 'XP_RULES');
    assert.strictEqual(B.XP_LOG_MAX, A.XP_LOG_MAX, 'XP_LOG_MAX');
    for (const [name, a, reason] of SEQ) {
      const ra = A.awardXP(amt(A, a), reason), rb = B.awardXP(amt(B, a), reason);
      assert.deepStrictEqual(JSON.parse(JSON.stringify(rb)), JSON.parse(JSON.stringify(ra)), k + '/' + name + ' 반환값');
      assert.deepStrictEqual(JSON.parse(JSON.stringify(sb.profile.settings.xp)), JSON.parse(JSON.stringify(sa.profile.settings.xp)), k + '/' + name + ' settings.xp');
      partSteps++;
    }
    assert.deepStrictEqual(lb, la, k + ' 팝업 DOM·홈 링 알림 기록');
    out[k] = { total: sb.profile.settings.xp.total, logLen: sb.profile.settings.xp.log.length, events: lb.length };
  }
  // 프로필 없음: 기준과 같은 오류 종류
  const ea = (() => { try { baseKit({ profile: null }, []).awardXP(10, 'x'); return null; } catch (e) { return e.constructor.name; } })();
  const eb = (() => { try { appKit({ profile: null }, []).kit.awardXP(10, 'x'); return null; } catch (e) { return e.constructor.name; } })();
  assert.strictEqual(eb, ea, '프로필 없을 때 오류 종류');
  return { steps: partSteps, starts: out, noProfileError: ea };
});
check('④-2 레벨 함수 xpForLevel(1~400)·levelForXP·levelProgress(0~200000) 전수 = 기준', () => {
  const A = baseKit({ profile: { settings: {} } }, []), B = appKit({ profile: { settings: {} } }, []).kit;
  for (let l = 1; l <= 400; l++) assert.strictEqual(B.xpForLevel(l), A.xpForLevel(l), 'xpForLevel ' + l);
  let n = 0;
  for (let x = 0; x <= 200000; x++) { assert.strictEqual(B.levelForXP(x), A.levelForXP(x)); if (x % 7 === 0) assert.deepStrictEqual(JSON.parse(JSON.stringify(B.levelProgress(x))), JSON.parse(JSON.stringify(A.levelProgress(x)))); n++; }
  return { xpValues: n };
});
check('⑤ 능력 xp.award·xp.read: cell=avatar/xp, award = 지급과 같은 함수, read 는 저장 칸을 만들지 않고 프로필이 없어도 던지지 않음', () => {
  const st = { profile: { settings: {} } };
  const { kit, caps } = appKit(st, []);
  assert.ok(caps.has('xp.award') && caps.has('xp.read'), '능력 둘');
  const d = caps.describe().filter(m => m.name.startsWith('xp.'));
  assert.ok(d.every(m => m.cell === 'avatar/xp'), 'cell');
  assert.strictEqual(caps.request('xp.award'), kit.awardXP, 'xp.award = awardXP');
  const r0 = caps.call('xp.read');
  assert.strictEqual(st.profile.settings.xp, undefined, 'read 가 칸을 만들지 않음');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r0)), JSON.parse(JSON.stringify(kit.levelProgress(0))), 'read 빈 칸 = levelProgress(0)');
  caps.call('xp.award', 120, '체크인');
  assert.strictEqual(caps.call('xp.read').xp, 120, 'read 합계');
  const noProf = appKit({ profile: null }, []);
  assert.strictEqual(noProf.caps.call('xp.read').level, 1, '프로필 없음 → 레벨 1');
  return { caps: d.map(m => m.name + '(' + m.sideEffect + ')') };
});
check('⑥ 파일 크기: js/avatar/xp.js 800줄 이하', () => { const n = xpSrc.split('\n').length; assert.ok(n <= 800); return { xpJsLines: n }; });

const passed = results.filter(r => r.ok).length;
console.log(`verify-avatar-xp: ${passed}/${results.length}`);
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ task: 'TASK-ES-395', base: BASE.replace(/\\/g, '/').split('/').pop(), passed, total: results.length, results }, null, 2) + '\n', 'utf8');
