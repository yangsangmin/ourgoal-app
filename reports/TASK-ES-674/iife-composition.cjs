#!/usr/bin/env node
'use strict';
// 인라인 IIFE(미분화 덩어리)의 줄 구성 재기 — 작업자 측정 도구, 판정 아님. 다음 단계 계획의 입력.
// index.html 의 IIFE 최상위 문을 @babel/parser 로 읽어 종류별 문 수·줄 수를 세고(줄 합 = IIFE 줄 수), 남은 함수 선언·로드 중 문·상태 이름을 목록으로 싣는다.
// 분류 규칙(설계 CELL-REGISTRY-DESIGN.md 7.1 과 같은 뜻):
//   손잡이 = 선언자 하나, 초기값이 window 로 시작하는 멤버식인 var · 가져오기 = 선언자 하나, 초기값이 `손잡이.이름` 인 var
//   상태 기관 호출 = window.OurgoalAppState.define/defineVar(…) 식 문 · 통로 노출 = OurgoalAppScope.expose(…) 식 문
//   window 대입 = window.X = … 식 문 · window 대입 if 블록 = else 없고 본문이 window 대입 식 문뿐인 if
//   로드 중 호출문 = 그 밖의 식 문 · 한 문이 여러 줄이면 그 줄 전부를 그 종류로, 한 줄에 문이 둘이면 첫 문 쪽으로 센다 · 문이 없는 줄은 껍데기·주석·빈 줄
// 사용: NODE_PATH=<node_modules> node reports/TASK-ES-648/iife-composition.cjs <트리> <out.json>
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
const [TREE, OUT] = process.argv.slice(2);
const lines = fs.readFileSync(path.join(TREE, 'index.html'), 'utf8').split(/\r?\n/);
let s = -1, e = -1;
for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
const code = lines.slice(s, e).join('\n');
const ast = parser.parse(code, { sourceType: 'script' });
let iife = null; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const top = iife.get('body').get('body'), scope = iife.scope;
const H = n => n.loc.start.line + s, HE = n => n.loc.end.line + s;
const rootWin = n => { let x = n; while (x && x.type === 'MemberExpression' && !x.computed) x = x.object; return !!x && x.type === 'Identifier' && x.name === 'window'; };
const isWA = x => x && x.type === 'AssignmentExpression' && x.left.type === 'MemberExpression' && x.left.object.type === 'Identifier' && x.left.object.name === 'window';
const handles = new Set();
for (const st of top) if (st.isVariableDeclaration() && st.node.declarations.length === 1) { const d = st.node.declarations[0]; if (d.init && d.init.type === 'MemberExpression' && rootWin(d.init) && d.id.type === 'Identifier') handles.add(d.id.name); }
const exposed = new Map(); // 이름 → { get, set }
const kindOf = st => {
  const n = st.node;
  if (st.isFunctionDeclaration()) return '함수 선언';
  if (st.isVariableDeclaration()) {
    if (n.declarations.length === 1) { const d = n.declarations[0];
      if (d.id.type === 'Identifier' && handles.has(d.id.name)) return '키트 손잡이';
      if (d.init && d.init.type === 'MemberExpression' && !d.init.computed && d.init.object.type === 'Identifier' && handles.has(d.init.object.name)) return '키트 가져오기'; }
    return '그 밖의 var(상태·상수·DOM 참조)';
  }
  if (st.isExpressionStatement()) { const x = n.expression;
    if (x.type === 'CallExpression' && x.callee.type === 'MemberExpression') {
      const txt = code.slice(x.callee.start, x.callee.end);
      if (/^window\.OurgoalAppState\.(define|defineVar)$/.test(txt)) return '상태 기관 호출(define·defineVar)';
      if (/OurgoalAppScope\.expose$/.test(txt)) {
        const o = x.arguments[1]; if (o && o.type === 'ObjectExpression') for (const p of o.properties) if (p.type === 'ObjectMethod' && p.key.type === 'Identifier') { const r = exposed.get(p.key.name) || { get: false, set: false }; r[p.kind] = true; exposed.set(p.key.name, r); }
        return '통로 노출(expose) 호출';
      }
    }
    if (isWA(x) || (x.type === 'SequenceExpression' && x.expressions.every(isWA))) return (HE(n) - H(n) + 1 > 3) ? 'window 대입(4줄 이상 — 함수식 등)' : 'window 대입(문)';
    return (HE(n) - H(n) + 1 > 3) ? '로드 중 호출문(4줄 이상)' : '로드 중 호출문(3줄 이하)';
  }
  if (st.isIfStatement()) {
    const c = n.consequent;
    if (!n.alternate && c.type === 'BlockStatement' && c.body.length && c.body.every(b => b.type === 'ExpressionStatement' && (isWA(b.expression) || (b.expression.type === 'SequenceExpression' && b.expression.expressions.every(isWA))))) return 'window 대입(그런 줄만 담은 if 블록)';
    return (HE(n) - H(n) + 1 > 3) ? 'if 블록(그 밖, 4줄 이상)' : 'if 블록(그 밖, 3줄 이하)';
  }
  if (st.isTryStatement()) return 'try 문';
  return '그 밖(' + n.type + ')';
};
const lineKind = new Map(), kinds = {}, items = [];
for (const st of top) {
  const k = kindOf(st); const a = H(st.node), b = HE(st.node);
  kinds[k] = kinds[k] || { statements: 0, lines: 0 }; kinds[k].statements++;
  for (let l = a; l <= b; l++) if (!lineKind.has(l)) { lineKind.set(l, k); kinds[k].lines++; }
  items.push({ kind: k, line: a, endLine: b, st });
}
const first = s + 1, last = e; // 1-based: IIFE 첫 줄 = `(function(){`, 마지막 줄 = `})();`
let shell = 0, comment = 0, blank = 0, inBlock = false;
for (let l = first; l <= last; l++) {
  if (lineKind.has(l)) { continue; }
  const t = lines[l - 1].trim();
  if (inBlock) { comment++; if (t.includes('*/')) inBlock = false; continue; }
  if (t === '') blank++;
  else if (t === '(function(){' || t === '"use strict";' || t === '})();') shell++;
  else if (t.startsWith('/*')) { comment++; if (!t.includes('*/')) inBlock = true; }
  else if (t.startsWith('//') || t.startsWith('*')) comment++;
  else comment++; // 문에 붙지 않은 그 밖의 글자(없어야 한다 — 있으면 아래 otherText 에 싣는다)
}
const total = last - first + 1;
const sum = Object.values(kinds).reduce((a, k) => a + k.lines, 0) + shell + comment + blank;
const nameOf = st => st.isFunctionDeclaration() ? st.node.id.name : null;
const fnDecls = items.filter(i => i.kind === '함수 선언').map(i => ({ name: nameOf(i.st), line: i.line, lines: i.endLine - i.line + 1 }));
const loadStmts = items.filter(i => /^로드 중 호출문|^if 블록|^try 문|4줄 이상 — 함수식/.test(i.kind)).map(i => ({ kind: i.kind, line: i.line, lines: i.endLine - i.line + 1, text: lines[i.line - 1].trim().slice(0, 110) }));
const stateVars = [];
for (const i of items.filter(x => x.kind === '그 밖의 var(상태·상수·DOM 참조)')) for (const d of i.st.node.declarations) {
  if (d.id.type !== 'Identifier') continue; const b = scope.getBinding(d.id.name); const ex = exposed.get(d.id.name);
  const refs = b ? b.referencePaths.filter(r => { const l = r.node.loc.start.line + s; return !(lineKind.get(l) === '통로 노출(expose) 호출'); }).length : null;
  stateVars.push({ name: d.id.name, line: i.line, lines: i.endLine - i.line + 1, reassigned: b ? b.constantViolations.length > 0 : null, exposed: ex ? (ex.set ? 'get+set' : 'get') : 'no', bareRefsOutsideExpose: refs, init: d.init ? (d.init.type === 'CallExpression' && /getElementById|querySelector/.test(code.slice(d.init.start, d.init.end)) ? 'DOM 참조' : d.init.type) : '없음' });
}
const organCalls = items.filter(i => i.kind === '상태 기관 호출(define·defineVar)').length;
const importsByHandle = {};
for (const i of items.filter(x => x.kind === '키트 가져오기')) { const h = i.st.node.declarations[0].init.object.name; importsByHandle[h] = (importsByHandle[h] || 0) + 1; }
const out = { tool: 'reports/TASK-ES-648/iife-composition.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), iife: { firstLine: first, lastLine: last, lines: total, topStatements: top.length },
  kinds: Object.fromEntries(Object.entries(kinds).sort((a, b) => b[1].lines - a[1].lines)), noStatementLines: { shell, comment, blank }, sumOfLines: sum, sumEqualsIifeLines: sum === total,
  functionDeclarations: fnDecls, loadTimeStatements: { count: loadStmts.length, lines: loadStmts.reduce((a, x) => a + x.lines, 0), fourPlus: loadStmts.filter(x => x.lines > 3), threeOrLess: { count: loadStmts.filter(x => x.lines <= 3).length, lines: loadStmts.filter(x => x.lines <= 3).reduce((a, x) => a + x.lines, 0) } },
  stateVars: { count: stateVars.length, exposed: stateVars.filter(v => v.exposed !== 'no').length, reassigned: stateVars.filter(v => v.reassigned).length, domRefs: stateVars.filter(v => v.init === 'DOM 참조').length, list: stateVars },
  organCalls, handles: [...handles], importsByHandle, exposedGetterNames: exposed.size };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify({ iife: out.iife, kinds: out.kinds, none: out.noStatementLines, sumOk: out.sumEqualsIifeLines, fn: fnDecls, load4: out.loadTimeStatements.fourPlus.map(x => x.line + ':' + x.lines + ':' + x.kind), load3: out.loadTimeStatements.threeOrLess, state: { count: stateVars.length, exposed: out.stateVars.exposed, reassigned: out.stateVars.reassigned, dom: out.stateVars.domRefs }, organCalls, importsByHandle, exposedGetterNames: exposed.size }));
