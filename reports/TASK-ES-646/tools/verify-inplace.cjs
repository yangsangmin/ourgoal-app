'use strict';
// #TASK-ES-646 — 「제자리 정리」 대조기. 변환기(inplace-split.cjs)의 분류를 다시 쓰지 않고, 정리 전·후 index.html 두 개만 읽어 스스로 잰다.
// 작업자 PC 예비 점검 — 판정이 아니다.
//   (a) 토큰열 대조: 새 진입점의 콜백에서 조각 함수를 부르는 줄을 그 조각 본문으로 되돌려 한 줄로 편 뒤(= 실행 순서), 정리 전 함수의 토큰열과 한 토큰씩 맞댄다.
//       허용하는 차이는 넷뿐이다: ① 이름 앞 「ctx.」 ② 선언 「var X」 → 「ctx.X」 ③ 꾸러미를 만드는 문(var ctx = {…}; · ctx.sheet = sheet; · ctx.F = F;) ④ 조각 함수의 머리·닫는 괄호·부르는 줄.
//       토큰은 원문 글자(따옴표·정규식 포함)로 비교한다. 주석은 따로 순서대로 맞댄다(추가된 [#TASK-ES-646] 주석만 허용).
//   (a') 접두 기대 대조: 정리 전 스코프 분석으로 「어느 이름 자리에 ctx. 가 붙어야 하는가」를 따로 계산해 실제와 맞댄다
//       (여러 조각에 걸친 값은 모든 읽기·쓰기에, 여러 조각이 부르는 함수는 주인 조각 밖에서만, 그 밖의 자리 — 속성 이름·안쪽 지역·바깥 이름 — 에는 붙으면 안 된다).
//   (b) 스코프 분석: 새 함수 여섯 각각에서 함수 밖 이름을 읽는 자리를 모아, 정리 전 함수의 지역 이름이 맨이름으로 새어 나간 곳 0 · 새로 생긴 바깥 의존이 조각 함수 이름뿐임을 본다.
//   (c) 꾸러미 빠짐: ctx.<이름> 으로 쓰는 이름마다 값을 넣는 자리가 있는가(인자 → 꾸러미 만드는 문, 변수 → 바뀐 선언, 함수 → 주인 조각 머리의 등록) · this/arguments 0 · 각 800줄 이하.
//   (d) 저장 경로(executeSave): 토큰열 동일(접두만) · 호출 순서 동일 — 데이터 무손실(GUARD_03) 근거.
// 사용: node reports/TASK-ES-646/tools/verify-inplace.cjs <정리 전 index.html> <정리 후 index.html> [out.json]
const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const [BEFORE, AFTER, OUT] = process.argv.slice(2);
const ENTRY = 'openProTemplateRecordModal';
const TAG = '[#TASK-ES-646]';
const problems = [];
const bad = (kind, detail) => { problems.push({ kind, detail }); };

function load(file) {
  const html = fs.readFileSync(file, 'utf8');
  const lines = html.split('\n').map(l => l.replace(/\r$/, ''));
  let s = -1, e = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
  const code = lines.slice(s, e).join('\n');
  const ast = parser.parse(code, { sourceType: 'script', ranges: true, tokens: true });
  let iife = null; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
  const top = iife.get('body').get('body');
  const isComment = t => typeof t.type === 'string';
  const toks = ast.tokens.filter(t => (isComment(t) || t.type.label !== 'eof')).map(t => ({ start: t.start, end: t.end, comment: isComment(t), label: isComment(t) ? t.type : t.type.label, text: code.slice(t.start, t.end) }));
  const within = (a, b) => toks.filter(t => t.start >= a && t.end <= b);
  return { html, lines, off: s, code, ast, iife, top, toks, within, outside: { before: lines.slice(0, s).join('\n'), after: lines.slice(e).join('\n') } };
}
const A = load(BEFORE), B = load(AFTER);
const topFn = (L, name) => L.top.filter(s => s.isFunctionDeclaration() && s.node.id.name === name);

// ── 정리 전 함수
const oldFns = topFn(A, ENTRY);
if (oldFns.length !== 1) throw new Error('정리 전 ' + ENTRY + ' 선언 수 ' + oldFns.length);
const oldFn = oldFns[0];
const oldLast = oldFn.get('body').get('body').slice(-1)[0];
const oldCb = oldLast.get('expression').get('arguments')[1];
const oldAll = A.within(oldFn.node.start, oldFn.node.end);
const oldCode = oldAll.filter(t => !t.comment), oldComments = oldAll.filter(t => t.comment);

// ── 정리 후: 진입점 + 조각 함수(진입점의 콜백이 부르는 것)
const newFns = topFn(B, ENTRY);
if (newFns.length !== 1) throw new Error('정리 후 ' + ENTRY + ' 선언 수 ' + newFns.length);
const newFn = newFns[0];
const newStmts = newFn.get('body').get('body');
const newLast = newStmts.slice(-1)[0];
const newCb = newLast.get('expression').get('arguments')[1];
const cbStmts = newCb.get('body').get('body');
const src = n => B.code.slice(n.start, n.end);
const isCtxMember = (n, name) => n && n.type === 'MemberExpression' && !n.computed && n.object.type === 'Identifier' && n.object.name === 'ctx' && n.property.type === 'Identifier' && (name === undefined || n.property.name === name);

const added = { ctxCreate: null, sheetAssign: null, registrations: [], pieceCalls: [], headers: [], comments: [] };
// 꾸러미 만드는 문: 진입점 첫 문 var ctx = { k: k, … };
const s0 = newStmts[0].node;
const literalKeys = [];
if (s0.type === 'VariableDeclaration' && s0.kind === 'var' && s0.declarations.length === 1 && s0.declarations[0].id.name === 'ctx' && s0.declarations[0].init && s0.declarations[0].init.type === 'ObjectExpression') {
  for (const p of s0.declarations[0].init.properties) {
    if (!(p.type === 'ObjectProperty' && !p.computed && p.key.type === 'Identifier' && p.value.type === 'Identifier' && p.key.name === p.value.name)) bad('꾸러미 만드는 문', '속성 꼴이 이름: 이름 이 아니다 — ' + src(p));
    else literalKeys.push(p.key.name);
  }
  added.ctxCreate = src(s0);
} else bad('꾸러미 만드는 문', '진입점 첫 문이 var ctx = {…} 가 아니다');

// 콜백 본문: ctx.sheet = sheet; + 조각 호출 + (원래 있던 문)
const pieceOrder = [];
const cbPlan = []; // {type:'sheet'|'piece'|'keep', node, fn}
cbStmts.forEach((st, i) => {
  const n = st.node, e = n.type === 'ExpressionStatement' ? n.expression : null;
  if (i === 0 && e && e.type === 'AssignmentExpression' && e.operator === '=' && isCtxMember(e.left, 'sheet') && e.right.type === 'Identifier' && e.right.name === 'sheet') { cbPlan.push({ type: 'sheet', node: n }); added.sheetAssign = src(n); return; }
  if (e && e.type === 'CallExpression' && e.callee.type === 'Identifier' && e.arguments.length === 1 && e.arguments[0].type === 'Identifier' && e.arguments[0].name === 'ctx' && topFn(B, e.callee.name).length === 1 && !oldFn.scope.hasBinding(e.callee.name, true) && !A.iife.scope.hasOwnBinding(e.callee.name)) {
    cbPlan.push({ type: 'piece', node: n, fn: e.callee.name }); pieceOrder.push(e.callee.name); added.pieceCalls.push(src(n)); return;
  }
  cbPlan.push({ type: 'keep', node: n });
});
if (!added.sheetAssign) bad('꾸러미 만드는 문', '콜백 첫 문이 ctx.sheet = sheet; 가 아니다');
if (new Set(pieceOrder).size !== pieceOrder.length) bad('조각 호출', '같은 조각을 두 번 부른다');

// 조각 함수: function NAME(ctx){ [ctx.F = F; …] 본문 }
const pieces = {};
for (const name of pieceOrder) {
  const f = topFn(B, name)[0];
  const n = f.node;
  if (!(n.params.length === 1 && n.params[0].type === 'Identifier' && n.params[0].name === 'ctx' && !n.async && !n.generator)) bad('조각 머리', name + ' 의 인자가 ctx 하나가 아니다');
  const body = f.get('body').get('body');
  const regs = [];
  let k = 0;
  for (; k < body.length; k++) {
    const e = body[k].node.type === 'ExpressionStatement' ? body[k].node.expression : null;
    if (e && e.type === 'AssignmentExpression' && e.operator === '=' && isCtxMember(e.left) && e.right.type === 'Identifier' && e.right.name === e.left.property.name) regs.push({ name: e.right.name, node: body[k].node }); else break;
  }
  for (const r of regs) { const b = f.scope.getOwnBinding(r.name); if (!(b && b.path.isFunctionDeclaration() && b.path.parentPath.parentPath === f)) bad('등록', name + ' 가 자기 안쪽 함수가 아닌 것을 등록한다: ' + r.name); added.registrations.push({ piece: name, name: r.name }); }
  const innerStart = regs.length ? regs[regs.length - 1].node.end : n.body.start + 1;
  pieces[name] = { path: f, node: n, regs: regs.map(r => r.name), innerStart, innerEnd: n.body.end - 1, lines: n.loc.end.line - n.loc.start.line + 1, firstLine: n.loc.start.line + B.off, lastLine: n.loc.end.line + B.off };
  added.headers.push(B.code.slice(n.start, n.body.start + 1));
}
// 조각이 아닌 새 최상위 함수가 생기지 않았는가
const oldTopNames = new Set(A.top.filter(s => s.isFunctionDeclaration()).map(s => s.node.id.name));
const newTopNames = B.top.filter(s => s.isFunctionDeclaration()).map(s => s.node.id.name);
const extraTop = newTopNames.filter(n => !oldTopNames.has(n) && !pieceOrder.includes(n));
if (extraTop.length) bad('새 최상위 함수', '콜백이 부르지 않는 새 함수: ' + extraTop.join(', '));
const lostTop = [...oldTopNames].filter(n => !newTopNames.includes(n));
if (lostTop.length) bad('사라진 최상위 함수', lostTop.join(', '));

// ── (a) 한 줄로 펴기: 새 토큰에 출처(조각)를 달아 정리 전 순서로 잇는다
const tag = (list, origin) => list.map(t => Object.assign({ origin }, t));
let linear = [];
linear = linear.concat(tag(B.within(newFn.node.start, s0.start), 'entry'));          // function 머리
linear = linear.concat(tag(B.within(s0.end, newCb.node.body.start + 1), 'entry'));   // 머리 ~ 콜백 여는 괄호
for (const step of cbPlan) {
  if (step.type === 'sheet') continue;
  if (step.type === 'keep') linear = linear.concat(tag(B.within(step.node.start, step.node.end), 'entry'));
  if (step.type === 'piece') { const p = pieces[step.fn]; linear = linear.concat(tag(B.within(p.innerStart, p.innerEnd), step.fn)); }
}
linear = linear.concat(tag(B.within(newCb.node.body.end - 1, newFn.node.end), 'entry')); // 콜백 닫는 괄호 ~ 함수 끝
// 조각 머리 주석(여는 괄호 바로 뒤 [#TASK-ES-646] 주석)과 꾸러미 문의 주석은 펴는 범위 밖에 있거나 여기서 걷는다
const newCodeAll = linear.filter(t => !t.comment);
const newCommentsAll = linear.filter(t => t.comment);
const newComments = newCommentsAll.filter(t => { if (t.text.includes(TAG)) { added.comments.push(t.text.slice(0, 60)); return false; } return true; });
// 펴는 범위에 안 들어간 새 토큰 = 추가된 글자. 무엇인지 적는다.
const allNewFnToks = [].concat(B.within(newFn.node.start, newFn.node.end), ...pieceOrder.map(n => B.within(pieces[n].node.start, pieces[n].node.end)));
const linearStarts = new Set(linear.map(t => t.start));
const addedToks = allNewFnToks.filter(t => !linearStarts.has(t.start));
const addedCode = addedToks.filter(t => !t.comment).map(t => t.text).join(' ');
for (const t of addedToks.filter(t => t.comment)) { if (!t.text.includes(TAG)) bad('추가된 주석', '표지 없는 새 주석: ' + t.text.slice(0, 60)); else added.comments.push(t.text.slice(0, 60)); }

// 토큰 맞대기
const DECL_CONV = [];
const prefixedAt = new Map(); // old 코드 토큰 번호 → true
const originAt = [];          // old 코드 토큰 번호 → 조각
let i = 0, j = 0, mismatch = null;
const isCtxPrefix = k => newCodeAll[k] && newCodeAll[k].label === 'name' && newCodeAll[k].text === 'ctx' && newCodeAll[k + 1] && newCodeAll[k + 1].label === '.' && (k === 0 || newCodeAll[k - 1].label !== '.') && newCodeAll[k + 2] && newCodeAll[k + 2].label === 'name';
while (i < oldCode.length || j < newCodeAll.length) {
  const o = oldCode[i], n = newCodeAll[j];
  if (!o || !n) { mismatch = { at: i, old: o ? o.text : '(끝)', new: n ? n.text : '(끝)' }; break; }
  if (o.label === 'var' && oldCode[i + 1] && oldCode[i + 1].label === 'name' && isCtxPrefix(j) && newCodeAll[j + 2].text === oldCode[i + 1].text) {
    DECL_CONV.push(oldCode[i + 1].text); originAt[i] = n.origin; i += 1; originAt[i] = n.origin; prefixedAt.set(i, 'decl'); i += 1; j += 3; continue;
  }
  if (o.label === 'name' && isCtxPrefix(j) && newCodeAll[j + 2].text === o.text && !(o.text === 'ctx')) { prefixedAt.set(i, 'ref'); originAt[i] = newCodeAll[j + 2].origin; i += 1; j += 3; continue; }
  if (o.label === n.label && o.text === n.text) { originAt[i] = n.origin; i++; j++; continue; }
  mismatch = { at: i, old: oldCode.slice(Math.max(0, i - 6), i + 6).map(t => t.text).join(' '), new: newCodeAll.slice(Math.max(0, j - 6), j + 8).map(t => t.text).join(' ') };
  break;
}
if (mismatch) bad('토큰열 불일치', JSON.stringify(mismatch));
// 주석 맞대기
let commentMismatch = null;
if (oldComments.length !== newComments.length) commentMismatch = { oldCount: oldComments.length, newCount: newComments.length };
else for (let k = 0; k < oldComments.length; k++) if (oldComments[k].text !== newComments[k].text) { commentMismatch = { at: k, old: oldComments[k].text.slice(0, 80), new: newComments[k].text.slice(0, 80) }; break; }
if (commentMismatch) bad('주석 불일치', JSON.stringify(commentMismatch));

// ── (a') 접두 기대: 정리 전 스코프 분석으로 따로 계산
const tokIndexByStart = new Map(oldCode.map((t, k) => [t.start, k]));
const role = new Map(); // old 코드 토큰 번호 → { name, kind: 'decl'|'read'|'write', binding }
const closure = [];
for (const [scopeName, scope] of [['entry', oldFn.scope], ['callback', oldCb.scope]]) {
  for (const name of Object.keys(scope.bindings)) {
    const b = scope.bindings[name];
    const rec = { name, scope: scopeName, kind: b.path.isFunctionDeclaration() ? 'function' : (b.kind === 'param' ? 'param' : 'var'), sites: [] };
    const put = (node, kind) => { const k = tokIndexByStart.get(node.start); if (k === undefined) { bad('자리 찾기', name + ' 의 ' + kind + ' 자리가 토큰에 없다'); return; } role.set(k, { rec, kind }); rec.sites.push({ k, kind }); };
    put(b.identifier, 'decl');
    for (const r of b.referencePaths) put(r.node, 'read');
    for (const v of b.constantViolations) {
      if (v.isAssignmentExpression() && v.node.left.type === 'Identifier') put(v.node.left, 'write');
      else if (v.isUpdateExpression() && v.node.argument.type === 'Identifier') put(v.node.argument, 'write');
      else bad('대입 꼴', name + ' — ' + v.type);
    }
    closure.push(rec);
  }
}
const expectMismatch = [];
const varTable = [];
if (!mismatch) {
  for (const rec of closure) {
    const piecesUsed = {};
    for (const s of rec.sites) { const o = (rec.kind === 'param' && s.kind === 'decl') ? 'entry' : originAt[s.k]; s.origin = o; piecesUsed[o] = (piecesUsed[o] || 0) + 1; }
    const declOrigin = rec.sites.find(s => s.kind === 'decl').origin;
    const cross = Object.keys(piecesUsed).length > 1;
    rec.cross = cross; rec.declOrigin = declOrigin;
    for (const s of rec.sites) {
      let expected;
      if (rec.kind === 'function') expected = s.kind === 'decl' ? false : (cross && s.origin !== declOrigin ? 'ref' : false);
      else if (rec.kind === 'param') expected = s.kind === 'decl' ? false : (cross ? 'ref' : false);
      else expected = cross ? (s.kind === 'decl' ? 'decl' : 'ref') : false;
      const actual = prefixedAt.get(s.k) || false;
      if (expected !== actual) expectMismatch.push({ name: rec.name, site: s.kind, origin: s.origin, expected, actual, near: oldCode.slice(Math.max(0, s.k - 3), s.k + 4).map(t => t.text).join(' ') });
    }
    const by = kind => { const o = {}; for (const s of rec.sites.filter(x => x.kind === kind)) o[s.origin] = (o[s.origin] || 0) + 1; return o; };
    varTable.push({ name: rec.name, kind: rec.kind, declaredIn: declOrigin, readIn: by('read'), writtenIn: by('write'), acrossPieces: cross, viaCtx: cross, ctxSites: rec.sites.filter(s => prefixedAt.get(s.k)).length });
  }
  // 닫힌 스코프 이름이 아닌 자리에 붙은 접두
  for (const [k, v] of prefixedAt) if (!role.has(k)) expectMismatch.push({ name: oldCode[k].text, site: '(지역 이름이 아닌 자리)', expected: false, actual: v, near: oldCode.slice(Math.max(0, k - 3), k + 4).map(t => t.text).join(' ') });
}
if (expectMismatch.length) bad('접두 기대 불일치', expectMismatch.length + '곳 — ' + JSON.stringify(expectMismatch.slice(0, 5)));

// ── (c) 꾸러미 빠짐
const ctxData = varTable.filter(r => r.viaCtx && r.kind !== 'function').map(r => r.name);
const ctxFuncs = varTable.filter(r => r.viaCtx && r.kind === 'function').map(r => r.name);
const provided = {};
for (const k of literalKeys) provided[k] = '꾸러미 만드는 문';
if (added.sheetAssign) provided.sheet = '콜백 첫 문';
for (const n of new Set(DECL_CONV)) provided[n] = (provided[n] ? provided[n] + ' + ' : '') + '바뀐 선언';
for (const r of added.registrations) provided[r.name] = (provided[r.name] ? provided[r.name] + ' + ' : '') + '등록(' + r.piece + ')';
const missing = ctxData.concat(ctxFuncs).filter(n => !provided[n]);
if (missing.length) bad('꾸러미 빠짐', '값을 넣는 자리가 없는 이름: ' + missing.join(', '));
const surplus = Object.keys(provided).filter(n => !ctxData.includes(n) && !ctxFuncs.includes(n));
if (surplus.length) bad('꾸러미 남음', '쓰지 않는 이름을 담았다: ' + surplus.join(', '));
const dup = Object.keys(provided).filter(n => provided[n].includes(' + '));
if (dup.length) bad('꾸러미 중복', '값을 넣는 자리가 둘: ' + dup.map(n => n + '=' + provided[n]).join(', '));
for (const r of added.registrations) { const rec = varTable.find(v => v.name === r.name); if (!rec || rec.declaredIn !== r.piece) bad('등록 주인', r.name + ' 을 주인이 아닌 조각(' + r.piece + ')이 등록한다'); }
// 새 코드에서 ctx.<이름> 으로 쓰는 이름 전부가 꾸러미 구성원인가 · ctx 를 통째로 넘기는 곳은 조각 호출뿐인가
const ctxMembersUsed = {};
let ctxBare = 0, thisArgs = 0;
const scanCtx = fnPath => fnPath.traverse({
  ThisExpression(p) { if (p.getFunctionParent() === fnPath) thisArgs++; },
  Identifier(p) {
    if (p.node.name === 'arguments' && p.isReferencedIdentifier() && p.getFunctionParent() === fnPath) thisArgs++;
    if (p.node.name !== 'ctx' || !p.isReferencedIdentifier()) return;
    const par = p.parent;
    if (par.type === 'MemberExpression' && par.object === p.node && !par.computed) ctxMembersUsed[par.property.name] = (ctxMembersUsed[par.property.name] || 0) + 1;
    else if (par.type === 'CallExpression' && par.arguments.includes(p.node) && par.callee.type === 'Identifier' && pieceOrder.includes(par.callee.name)) { /* 조각 호출 */ }
    else ctxBare++;
  },
});
scanCtx(newFn); for (const n of pieceOrder) scanCtx(pieces[n].path);
const strayMembers = Object.keys(ctxMembersUsed).filter(n => !provided[n]);
if (strayMembers.length) bad('꾸러미에 없는 이름을 읽는다', strayMembers.join(', '));
if (ctxBare) bad('꾸러미를 통째로 다른 데 넘긴다', ctxBare + '곳');
if (thisArgs) bad('최상위 this/arguments', thisArgs + '곳');

// ── (b) 스코프 분석: 함수 밖 이름
function freeNames(fnPath) {
  const out = {};
  fnPath.traverse({
    Identifier(p) {
      if (!p.isReferencedIdentifier() && !(p.parentPath.isAssignmentExpression() && p.parent.left === p.node) && !(p.parentPath.isUpdateExpression())) return;
      const b = p.scope.getBinding(p.node.name);
      const inside = b && (b.scope === fnPath.scope || b.scope.path.findParent(x => x === fnPath));
      if (!inside) out[p.node.name] = (out[p.node.name] || 0) + 1;
    },
  });
  return out;
}
const oldFree = freeNames(oldFn);
const closureNames = new Set(closure.map(r => r.name));
const newFree = {}; const leaks = [];
const perFn = {};
for (const [name, p] of [[ENTRY, newFn]].concat(pieceOrder.map(n => [n, pieces[n].path]))) {
  const f = freeNames(p); perFn[name] = Object.keys(f).length;
  for (const k of Object.keys(f)) { newFree[k] = (newFree[k] || 0) + f[k]; if (closureNames.has(k)) leaks.push({ fn: name, name: k, count: f[k] }); }
}
if (leaks.length) bad('조각 경계를 넘는 맨이름', JSON.stringify(leaks));
const newOuter = Object.keys(newFree).filter(k => !(k in oldFree));
const lostOuter = Object.keys(oldFree).filter(k => !(k in newFree));
const unexpectedOuter = newOuter.filter(k => !pieceOrder.includes(k));
if (unexpectedOuter.length) bad('새 바깥 의존', unexpectedOuter.join(', '));
if (lostOuter.length) bad('사라진 바깥 의존', lostOuter.join(', '));
const outerCountDiff = Object.keys(oldFree).filter(k => (k in newFree) && oldFree[k] !== newFree[k] && k !== ENTRY).map(k => k + ':' + oldFree[k] + '→' + newFree[k]);
if (outerCountDiff.length) bad('바깥 이름 참조 수 변화', outerCountDiff.join(', '));
// 800줄
const sizes = { [ENTRY]: newFn.node.loc.end.line - newFn.node.loc.start.line + 1 };
for (const n of pieceOrder) sizes[n] = pieces[n].lines;
for (const n of Object.keys(sizes)) if (sizes[n] > 800) bad('800줄 초과', n + ' ' + sizes[n]);

// ── (d) 저장 경로
function fnTokens(L, rootPath, name) { let hit = null; rootPath.traverse({ FunctionDeclaration(p) { if (p.node.id.name === name && !hit) hit = p; } }); return hit; }
const oldSave = fnTokens(A, oldFn, 'executeSave');
let newSave = null; for (const n of pieceOrder) { const h = fnTokens(B, pieces[n].path, 'executeSave'); if (h) newSave = { path: h, piece: n }; }
const save = { found: !!(oldSave && newSave) };
if (save.found) {
  const ot = A.within(oldSave.node.start, oldSave.node.end).filter(t => !t.comment).map(t => t.text);
  const nt = B.within(newSave.path.node.start, newSave.path.node.end).filter(t => !t.comment).map(t => t.text);
  const stripped = []; let ins = 0;
  for (let k = 0; k < nt.length; k++) { if (nt[k] === 'ctx' && nt[k + 1] === '.' && (k === 0 || nt[k - 1] !== '.')) { ins++; k++; continue; } stripped.push(nt[k]); }
  const calls = (L, p) => { const out = []; p.traverse({ CallExpression(c) { out.push(L.code.slice(c.node.callee.start, c.node.callee.end).replace(/(^|[^.\w$])ctx\./g, '$1')); }, AwaitExpression() { out.push('«await»'); } }); return out; };
  const oc = calls(A, oldSave), nc = calls(B, newSave.path);
  save.piece = newSave.piece; save.async = [oldSave.node.async, newSave.path.node.async];
  save.tokens = { old: ot.length, newWithoutPrefix: stripped.length, prefixInsertions: ins, same: ot.length === stripped.length && ot.every((t, k) => t === stripped[k]) };
  save.calls = { old: oc.length, new: nc.length, sameOrder: oc.length === nc.length && oc.every((t, k) => t === nc[k]), sequence: oc };
  if (!save.tokens.same) bad('저장 경로 토큰', 'executeSave 토큰열이 접두 말고도 다르다');
  if (!save.calls.sameOrder) bad('저장 경로 호출 순서', 'executeSave 호출 순서가 다르다');
  if (save.async[0] !== save.async[1]) bad('저장 경로 async', 'executeSave 의 async 표시가 다르다');
} else bad('저장 경로', 'executeSave 를 찾지 못했다');

// 함수 밖 글자: IIFE 의 나머지와 index.html 의 나머지가 그대로인가
const restOld = A.code.slice(0, oldFn.node.start) + '«FN»' + A.code.slice(oldFn.node.end);
const lastPiece = pieceOrder.length ? pieces[pieceOrder[pieceOrder.length - 1]].node : newFn.node;
let contiguous = true; { let pos = newFn.node.end; for (const n of pieceOrder) { if (B.code.slice(pos, pieces[n].node.start).trim() !== '') contiguous = false; pos = pieces[n].node.end; } }
if (!contiguous) bad('조각 자리', '진입점과 조각 함수 사이에 다른 글자가 있다');
const restNew = B.code.slice(0, newFn.node.start) + '«FN»' + B.code.slice(lastPiece.end);
const restSame = restOld === restNew && A.outside.before === B.outside.before && A.outside.after === B.outside.after;
if (!restSame) bad('함수 밖 글자', '이 함수 구간 밖의 index.html 글자가 달라졌다');

const prefixByName = {}; for (const [k, v] of prefixedAt) { const nm = oldCode[k].text; prefixByName[nm] = (prefixByName[nm] || 0) + 1; }
const result = {
  tool: 'reports/TASK-ES-646/tools/verify-inplace.cjs', type: '작업자 PC 예비 점검 — 판정 아님',
  ok: problems.length === 0, problems,
  before: { firstLine: oldFn.node.loc.start.line + A.off, lastLine: oldFn.node.loc.end.line + A.off, lines: oldFn.node.loc.end.line - oldFn.node.loc.start.line + 1 },
  after: { functions: Object.fromEntries([[ENTRY, { firstLine: newFn.node.loc.start.line + B.off, lastLine: newFn.node.loc.end.line + B.off, lines: sizes[ENTRY] }]].concat(pieceOrder.map(n => [n, { firstLine: pieces[n].firstLine, lastLine: pieces[n].lastLine, lines: pieces[n].lines, registers: pieces[n].regs }]))), maxLines: Math.max(...Object.values(sizes)), callOrder: cbPlan.map(s => (s.type === 'piece' ? s.fn + '(ctx)' : src(s.node))) },
  tokens: { old: oldCode.length, newLinearized: newCodeAll.length, mismatch: mismatch, allowed: { ctxPrefixOnReference: [...prefixedAt.values()].filter(v => v === 'ref').length, varDeclToCtx: DECL_CONV, addedCodeTokens: addedToks.filter(t => !t.comment).length, addedCode }, outsideAllowed: mismatch ? 1 : 0 },
  comments: { old: oldComments.length, newWithoutAdded: newComments.length, same: !commentMismatch, added: added.comments.length },
  prefixExpectation: { sitesChecked: [...role.keys()].length, mismatches: expectMismatch.length, byName: prefixByName },
  ctx: { data: ctxData, functions: ctxFuncs, members: ctxData.length + ctxFuncs.length, providedBy: provided, membersRead: ctxMembersUsed, missing, surplus },
  closureVariables: varTable,
  scope: { closureNames: closureNames.size, leaks, freeNamesOld: Object.keys(oldFree).length, freeNamesNew: Object.keys(newFree).length, newOuter, lostOuter, unexpectedOuter, outerCountDiff, freeNamesPerFunction: perFn, topLevelThisArguments: thisArgs },
  save,
  restOfFileSame: restSame,
  topLevelFunctionDecls: { before: oldTopNames.size, after: newTopNames.length, added: newTopNames.filter(n => !oldTopNames.has(n)) },
};
if (OUT) fs.writeFileSync(OUT, JSON.stringify(result, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ ok: result.ok, problems: problems.slice(0, 6), tokens: { old: result.tokens.old, linear: result.tokens.newLinearized, prefix: result.tokens.allowed.ctxPrefixOnReference, decl: DECL_CONV.length, added: result.tokens.allowed.addedCodeTokens }, comments: result.comments, expect: { checked: result.prefixExpectation.sitesChecked, mismatches: expectMismatch.length }, ctx: result.ctx.members, scope: { leaks: leaks.length, newOuter, lostOuter }, save: save.found ? { tokensSame: save.tokens.same, ins: save.tokens.prefixInsertions, calls: save.calls.old, sameOrder: save.calls.sameOrder } : null, restSame, sizes }, null, 1));
process.exit(result.ok ? 0 : 1);
