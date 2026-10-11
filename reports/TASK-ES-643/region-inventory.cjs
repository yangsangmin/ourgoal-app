#!/usr/bin/env node
'use strict';
// 인라인 IIFE 최상위 문 재고(#TASK-ES-643) — 작업자 도구, 판정 아님.
// index.html 인라인 IIFE 의 최상위 문을 종류별로 가르고, 구획 주석(=== 줄) 묶음마다 무엇이 들었는지 적는다. region 구역 계획과 「region 뒤 남는 줄」 표의 입력이다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-643/region-inventory.cjs <트리> <out.json>
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
function inventory(indexFile) {
  const lines = fs.readFileSync(indexFile, 'utf8').split('\n').map(l => l.replace(/\r$/, ''));
  let s = -1, e = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
  const code = lines.slice(s, e).join('\n');
  const ast = parser.parse(code, { sourceType: 'script', ranges: true, tokens: true });
  let iife = null; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
  const top = iife.get('body').get('body'), iScope = iife.scope;
  const H = n => n.loc.start.line + s, HE = n => n.loc.end.line + s;
  const rootWin = n => { let x = n; while (x && x.type === 'MemberExpression' && !x.computed) x = x.object; return !!x && x.type === 'Identifier' && x.name === 'window'; };
  const handles = new Set();
  for (const st of top) if (st.isVariableDeclaration() && st.node.declarations.length === 1) { const d = st.node.declarations[0]; if (d.id.type === 'Identifier' && d.init && d.init.type === 'MemberExpression' && rootWin(d.init) && /^_/.test(d.id.name)) handles.add(d.id.name); }
  const isKitImport = st => st.isVariableDeclaration() && st.node.declarations.length === 1 && (d => d.id.type === 'Identifier' && d.init && d.init.type === 'MemberExpression' && !d.init.computed && d.init.object.type === 'Identifier' && handles.has(d.init.object.name))(st.node.declarations[0]);
  const imports = new Set(top.filter(isKitImport).map(st => st.node.declarations[0].id.name));
  const exposed = new Set();
  const isExpose = st => { const x = st.isExpressionStatement() && st.node.expression; return !!x && x.type === 'CallExpression' && x.callee.type === 'MemberExpression' && !x.callee.computed && x.callee.property.name === 'expose' && x.callee.object.type === 'MemberExpression' && x.callee.object.property.name === 'OurgoalAppScope'; };
  for (const st of top) if (isExpose(st) && st.node.expression.arguments[1] && st.node.expression.arguments[1].type === 'ObjectExpression') for (const p of st.node.expression.arguments[1].properties) if (p.key && p.key.type === 'Identifier') exposed.add(p.key.name);
  const isStateDefine = x => !!x && x.type === 'CallExpression' && x.callee.type === 'MemberExpression' && !x.callee.computed && /^define(Var)?$/.test(x.callee.property.name) && x.callee.object.type === 'MemberExpression' && x.callee.object.property.name === 'OurgoalAppState' && x.callee.object.object.type === 'Identifier' && x.callee.object.object.name === 'window';
  const isWinAssign = x => !!x && x.type === 'AssignmentExpression' && x.operator === '=' && x.left.type === 'MemberExpression' && x.left.object.type === 'Identifier' && x.left.object.name === 'window';
  const winBlock = n => n.type === 'IfStatement' && !n.alternate && n.consequent.type === 'BlockStatement' && n.consequent.body.length > 0 && n.consequent.body.every(b => b.type === 'ExpressionStatement' && isWinAssign(b.expression));
  const kindOf = st => {
    const n = st.node, x = st.isExpressionStatement() && n.expression;
    if (st.isFunctionDeclaration()) return 'functionDecl';
    if (st.isVariableDeclaration()) {
      if (n.declarations.length === 1 && handles.has(n.declarations[0].id.name)) return 'kitHandle';
      if (isKitImport(st)) return 'kitImport';
      return n.declarations.some(d => exposed.has(d.id.name)) ? 'varExposed' : 'varNotExposed';
    }
    if (isExpose(st)) return 'exposeCall';
    if (x && isStateDefine(x)) return 'stateDefine';
    if (x && x.type === 'CallExpression' && x.callee.type === 'Identifier' && imports.has(x.callee.name) && x.arguments.length === 0 && /\[#TASK-ES-\d+\] 로드 중 구역/.test(lines[HE(n) - 1])) return 'regionCall';
    if (x && x.type === 'CallExpression' && x.callee.type === 'Identifier' && imports.has(x.callee.name) && x.arguments.length === 0 && /\[#TASK-ES-\d+\] 로드 중 문/.test(lines[HE(n) - 1])) return 'wrapCall';
    if (x && isWinAssign(x)) return x.right.type === 'Identifier' ? 'windowCopy' : (/Function/.test(x.right.type) ? 'windowFunctionDef' : 'windowLiteral');
    if (winBlock(n)) return n.consequent.body.every(b => b.expression.right.type === 'Identifier') ? 'windowCopyBlock' : 'windowDefBlock';
    if (st.isIfStatement()) return 'if';
    if (st.isTryStatement()) return 'try';
    if (x && x.type === 'CallExpression') return 'call';
    return x ? 'expr:' + x.type : n.type;
  };
  const isHeader = c => c.type === 'CommentBlock' && /^\s*=+/.test(c.value);
  const headers = [];
  for (const st of top) for (const c of (st.node.leadingComments || [])) if (isHeader(c)) headers.push({ line: c.loc.start.line + s, endLine: c.loc.end.line + s, title: c.value.replace(/=+/g, '').trim().split('\n')[0].trim() });
  // 마지막 문 뒤의 구획 주석(문이 없는 구획)도 센다
  for (const c of ast.comments || []) { const l = c.loc.start.line + s; if (isHeader(c) && !headers.some(h => h.line === l)) headers.push({ line: l, endLine: c.loc.end.line + s, title: c.value.replace(/=+/g, '').trim().split('\n')[0].trim() }); }
  headers.sort((a, b) => a.line - b.line);
  const stmts = top.map((st, i) => {
    const n = st.node, kind = kindOf(st);
    const names = st.isVariableDeclaration() ? n.declarations.map(d => d.id.name) : st.isFunctionDeclaration() ? [n.id.name] : [];
    const prevEnd = i ? HE(top[i - 1].node) : s + 2, tail = lines[HE(n) - 1].slice(n.loc.end.column).trim();
    return { i, kind, line: H(n), endLine: HE(n), lines: HE(n) - H(n) + 1, names, sharesPrevLine: i > 0 && H(n) === prevEnd, tailCode: !!tail && !/^(\/\/|\/\*)/.test(tail), text: lines[H(n) - 1].trim().slice(0, 110).replace(/eyJ[A-Za-z0-9_\-.]{6,}/g, '(가림)') }; // 키처럼 생긴 글자는 발췌에 싣지 않는다
  });
  // 주석·빈 줄: IIFE 안(머리 3줄·꼬리 줄 제외)에서 어느 최상위 문에도 속하지 않는 줄
  const covered = new Set(); stmts.forEach(x => { for (let l = x.line; l <= x.endLine; l++) covered.add(l); });
  let blank = 0, comment = 0; const iifeFirst = s + 3, iifeLast = e - 1;
  for (let l = iifeFirst; l <= iifeLast; l++) if (!covered.has(l)) { if (lines[l - 1].trim() === '') blank++; else comment++; }
  return { lines, s, e, top, iScope, stmts, headers, handles, imports, exposed, blank, comment, iifeLines: e - s, H, HE, code, ast };
}
module.exports = { inventory };
if (require.main === module) {
  const TREE = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3]);
  const v = inventory(path.join(TREE, 'index.html'));
  const byKind = {}; v.stmts.forEach(x => { const k = byKind[x.kind] = byKind[x.kind] || { statements: 0, lines: 0, max3: 0, over3: 0 }; k.statements++; k.lines += x.lines; if (x.lines <= 3) k.max3++; else k.over3++; });
  const groups = v.headers.map((h, i) => { const end = i + 1 < v.headers.length ? v.headers[i + 1].line - 1 : v.e; const sts = v.stmts.filter(x => x.line >= h.line && x.endLine <= end); const kinds = {}; sts.forEach(x => { kinds[x.kind] = (kinds[x.kind] || 0) + 1; }); return { title: h.title, start: h.line, end, statements: sts.length, kinds }; });
  const out = { tool: 'reports/TASK-ES-643/region-inventory.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), iife: { firstLine: v.s + 1, lastLine: v.e, lines: v.iifeLines }, topLevelStatements: v.stmts.length, byKind, commentLines: v.comment, blankLines: v.blank, handles: [...v.handles], imports: v.imports.size, exposedNames: v.exposed.size, headers: v.headers.length, emptyGroups: groups.filter(g => !g.statements).length, groups,
    statements: v.stmts.filter(x => !['functionDecl', 'kitImport', 'kitHandle', 'exposeCall'].includes(x.kind)) };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
  console.log(JSON.stringify({ iife: out.iife, top: out.topLevelStatements, byKind, comment: out.commentLines, blank: out.blankLines, headers: out.headers, emptyGroups: out.emptyGroups }));
}
