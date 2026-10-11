#!/usr/bin/env node
'use strict';
// #TASK-ES-673 남은 이름 조사(작업자 측정 도구, 판정 아님) — index.html 인라인 IIFE 에서 IIFE 지역 변수 하나(기본 `state`)를 맨이름으로 읽고 쓰는 자리가
// IIFE 의 어느 최상위 문(함수 선언 · 식 문) 안에 있는지 문법 분석으로 센다. 「무엇이 세포로 옮겨지면 이 이름을 상태 기관으로 옮길 수 있는가」를 적는 데 쓴다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-673/tools/state-bare-refs.cjs <트리> <out.json> [이름]
const fs = require('fs'), path = require('path');
const TREE = path.resolve(process.argv[2] || '.'), OUT = process.argv[3], NAME = process.argv[4] || 'state';
if (!OUT) { console.error('사용: node state-bare-refs.cjs <트리> <out.json> [이름]'); process.exit(2); }
const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
const L = fs.readFileSync(path.join(TREE, 'index.html'), 'utf8').split('\n').map(l => l.replace(/\r$/, ''));
let s = -1, e = -1;
for (let i = 0; i < L.length; i++) if (L[i].trim() === '<script>' && (L[i + 1] || '').trim() === '(function(){' && (L[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
for (let i = s; i < L.length; i++) if (L[i].startsWith('</script>')) { e = i; break; }
const ast = parser.parse(L.slice(s, e).join('\n'), { sourceType: 'script' });
let iife = null; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const top = iife.node.body.body, hits = [];
const isIifeBinding = p => { const b = p.scope.getBinding(NAME); return !!b && b.scope.block === iife.node; };
traverse(ast, {
  Identifier(p) { if (p.node.name === NAME && p.isReferencedIdentifier() && isIifeBinding(p)) hits.push(p.node.loc.start.line); },
  AssignmentExpression(p) { const l = p.node.left; if (l.type === 'Identifier' && l.name === NAME && isIifeBinding(p)) hits.push(l.loc.start.line); },
});
const groups = {};
for (const h of hits) { const st = top.find(b => b.loc.start.line <= h && b.loc.end.line >= h); if (!st) continue;
  const isExpose = st.type === 'ExpressionStatement' && st.expression.type === 'CallExpression' && st.expression.callee.type === 'MemberExpression' && st.expression.callee.property.name === 'expose';
  const key = st.loc.start.line; (groups[key] = groups[key] || { kind: st.type === 'FunctionDeclaration' ? '함수 선언' : isExpose ? '통로 노출 문(getter·setter)' : st.type === 'VariableDeclaration' ? '변수 선언' : '그 밖의 문', name: st.id ? st.id.name : null, fromLine: st.loc.start.line + s, toLine: st.loc.end.line + s, lines: st.loc.end.line - st.loc.start.line + 1, refs: 0 }).refs++; }
const rows = Object.values(groups).sort((a, b) => a.fromLine - b.fromLine);
const out = { tool: 'reports/TASK-ES-673/tools/state-bare-refs.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), name: NAME, totalRefs: hits.length,
  inFunctions: rows.filter(r => r.kind === '함수 선언').map(r => ({ name: r.name, lines: r.lines, refs: r.refs })), refsInFunctions: rows.filter(r => r.kind === '함수 선언').reduce((a, r) => a + r.refs, 0),
  refsInExposeStatements: rows.filter(r => r.kind === '통로 노출 문(getter·setter)').reduce((a, r) => a + r.refs, 0), refsElsewhere: rows.filter(r => r.kind !== '함수 선언' && r.kind !== '통로 노출 문(getter·setter)').reduce((a, r) => a + r.refs, 0), rows,
  note: '줄 번호는 이 트리의 index.html 기준이다(main 이 움직이면 바뀐다). 통로 노출 문 안의 참조는 getter·setter 본문이고 상태 이전 때 생성기가 지운다. 함수 선언 안의 참조가 0 이 되면(그 함수들이 세포로 옮겨져 L.' + NAME + ' 로 읽게 되면) 생성기 unstate 가 이 이름을 옮길 수 있다.' };
fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
fs.writeFileSync(path.resolve(OUT), JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ name: NAME, total: out.totalRefs, inFunctions: out.inFunctions, expose: out.refsInExposeStatements, elsewhere: out.refsElsewhere }));
