#!/usr/bin/env node
'use strict';
// #TASK-ES-689 이 PR 뒤 index.html 에 남은 인라인 스크립트 재기(작업자 측정 도구, 판정 아님).
//  ① 남긴 서버 연결 블록(첫 `<script>` + `(function(){` + "use strict")의 최상위 문 목록(공개 키 글자는 가림)
//  ② index.html 의 인라인 스크립트 조각 전부(src 없는 <script> — 줄 범위 · 줄 수 · 첫 글자)
//  ③ 공식 지표 다섯 칸(scripts/module-metrics.js ratchet) 기준 → 작업
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-689/tools/remaining-inline.cjs <작업 트리> <기준 트리> <out.json>
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
const WORK = path.resolve(process.argv[2] || '.'), BASE = path.resolve(process.argv[3]), OUT = path.resolve(process.argv[4]);
const redact = s => String(s).replace(/eyJ[A-Za-z0-9._-]+/g, '(가림)').replace(/https:\/\/[a-z0-9]+\.supabase\.co/g, '(서버 주소 가림)');
const ls = fs.readFileSync(path.join(WORK, 'index.html'), 'utf8').replace(/\r\n/g, '\n').split('\n');
let s = -1, e = -1;
for (let i = 0; i < ls.length; i++) if (ls[i].trim() === '<script>' && (ls[i + 1] || '').trim() === '(function(){' && (ls[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
for (let i = s; i < ls.length; i++) if (ls[i].startsWith('</script>')) { e = i; break; }
const code = ls.slice(s, e).join('\n'), ast = parser.parse(code, { sourceType: 'script' });
let f = null; traverse(ast, { FunctionExpression(p) { if (!f) f = p; p.skip(); } });
const callee = c => (c.type === 'MemberExpression' ? callee(c.object) + '.' + (c.property.name || '') : (c.name || ''));
const kindOf = n => {
  if (n.type === 'VariableDeclaration' && n.declarations.length === 1 && n.declarations[0].init && n.declarations[0].init.type === 'MemberExpression' && n.declarations[0].init.object.type === 'Identifier') return n.declarations[0].init.object.name === 'window' ? '키트 손잡이' : '가져오기';
  if (n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression' && n.expression.callee.type === 'Identifier') return '구역 함수 호출문';
  if (n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression' && /OurgoalAppScope\.expose$/.test(callee(n.expression.callee))) return '통로 중계(expose 문)';
  if (n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression' && /OurgoalAppState\.define(Var)?$/.test(callee(n.expression.callee))) return '상태 선언(define) — 서버 연결';
  if (n.type === 'VariableDeclaration') return '서버 주소·공개 키 선언(var)';
  return '그 밖';
};
const stmts = f.get('body').get('body').map((t, i) => ({ n: i + 1, line: t.node.loc.start.line + s, endLine: t.node.loc.end.line + s, lines: t.node.loc.end.line - t.node.loc.start.line + 1, kind: kindOf(t.node), text: redact(code.slice(t.node.start, t.node.end).split('\n')[0].slice(0, 110)) }));
let fnDecls = 0; traverse(ast, { FunctionDeclaration() { fnDecls++; } });
// 인라인 조각 전부
const pieces = []; let open = -1;
ls.forEach((l, i) => { if (open < 0 && /<script>\s*$/.test(l) && !/<script[^>]*\bsrc=/.test(l.slice(l.lastIndexOf('<script')))) open = i; else if (open >= 0 && l.includes('</script>')) { pieces.push({ from: open + 1, to: i + 1, lines: i - open + 1, innerLines: i - open - 1, firstText: redact((ls[open + 1] || '').trim().slice(0, 80)) }); open = -1; } });
const ratchet = d => require(path.join(d, 'scripts', 'module-metrics.js')).measure(d).ratchet;
const mB = ratchet(BASE), mW = ratchet(WORK);
const out = { tool: 'reports/TASK-ES-689/tools/remaining-inline.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(),
  keptBlock: { scriptTagLine: s, closeTagLine: e + 1, blockLines: e - s + 2, iifeLines: e - s, statements: stmts.length, statementLines: stmts.reduce((a, x) => a + x.lines, 0), functionDeclarations: fnDecls,
    byKind: stmts.reduce((a, x) => { a[x.kind] = (a[x.kind] || 0) + 1; return a; }, {}), list: stmts, closeLine: redact(ls[e]) },
  inlinePieces: pieces,
  officialMetrics: { base: mB, work: mW, note: 'scripts/module-metrics.js 의 ratchet 다섯 칸. inlineScriptLines 는 인라인 조각의 안쪽 줄 수를 더한 값이다' } };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ block: [out.keptBlock.blockLines, out.keptBlock.iifeLines, out.keptBlock.statements, out.keptBlock.byKind], pieces: pieces.map(p => [p.from, p.to, p.innerLines]), metrics: [mB, mW] }));
