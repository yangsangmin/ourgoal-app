'use strict';
// 이번 생성기가 머리에 새로 단 통로 getter(meta.exposed)에 대해: getter 를 단 줄과 그 이름의 값이 정해지는 줄(선언·가져오기) 사이에
// 「실행되는」 최상위 문(선언·가져오기·expose 가 아닌 문)이 있는지 센다. 있으면 그 사이에 통로 값이 예전(등록 기관 값)과 달라질 수 있는 창이 있다.
// 작업자 측정, 판정 아님. 사용: node expose-window.js <작업 index.html> <gen-inline-hard-meta.json> <out.json>
const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const [SRC, META, OUT] = process.argv.slice(2);
const meta = JSON.parse(fs.readFileSync(META, 'utf8'));
const lines = fs.readFileSync(SRC, 'utf8').split('\n').map(l => l.replace(/\r$/, ''));
let sLine = -1, eLine = -1;
for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { sLine = i + 1; break; }
for (let i = sLine; i < lines.length; i++) if (lines[i].startsWith('</script>')) { eLine = i; break; }
const off = sLine;
const ast = parser.parse(lines.slice(sLine, eLine).join('\n'), { sourceType: 'script' });
let iife = null; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const top = iife.get('body').get('body');
const H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off;
const headLine = lines.findIndex(l => l.includes('[#' + meta.task + '] ') && l.includes('가져오기 ')) + 1;
let exposeStmt = null;
for (const st of top) if (H(st.node) > headLine && st.isExpressionStatement() && /OurgoalAppScope\.expose/.test(lines[H(st.node) - 1])) { exposeStmt = st; break; }
const exposeLine = H(exposeStmt.node), exposeEnd = HE(exposeStmt.node);
const quiet = st => {
  if (st.isFunctionDeclaration() || st.isVariableDeclaration()) {
    if (st.isVariableDeclaration()) return st.node.declarations.every(d => !d.init || /Identifier|Literal/.test(d.init.type) || (d.init.type === 'MemberExpression' && !d.init.computed));
    return true;
  }
  if (st.isExpressionStatement() && /OurgoalAppScope\.expose\(/.test(lines[H(st.node) - 1])) return true;
  return false;
};
const rows = [];
for (const n of meta.exposed) {
  const b = iife.scope.getBinding(n);
  const defLine = H(b.path.node);
  const between = defLine > exposeEnd ? top.filter(st => H(st.node) > exposeEnd && HE(st.node) < defLine && !quiet(st)).map(st => ({ line: H(st.node), endLine: HE(st.node), text: lines[H(st.node) - 1].trim().slice(0, 120) })) : [];
  rows.push({ name: n, definedAtLine: defLine, definedBeforeExpose: defLine < exposeLine, executingStatementsBetween: between });
}
const out = { tool: 'expose-window.js (저장소 밖 측정 스크립트)', type: '작업자 측정, 판정 아님', exposeLines: [exposeLine, exposeEnd], names: rows.length,
  definedBeforeExpose: rows.filter(r => r.definedBeforeExpose).length, definedAfterExpose: rows.filter(r => !r.definedBeforeExpose).map(r => ({ name: r.name, line: r.definedAtLine, executingStatementsBetween: r.executingStatementsBetween })) };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');
console.log(JSON.stringify(out).slice(0, 2500));
