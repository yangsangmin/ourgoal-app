'use strict';
// index.html 인라인 IIFE 의 주석·빈 줄을 종류별로 센다(작업자 측정, 판정 아님). 생성기와 따로 만든 집계다(생성기 sweep 모드의 결과와 맞대는 데 쓴다).
//   줄 종류: 문(최상위 문이 걸친 줄 — 그 안의 주석·빈 줄 포함) / IIFE 껍데기 / 최상위 주석 줄 / 최상위 빈 줄
//   최상위 주석의 종류: 구획 주석(`/* ===`) · 자리 표지(`[어려움 이음매 자리 X]`) · 1차 이음매 주석 · 생성기 「옮김」 표지(`[#작업] … 로 옮김(`) · 생성기 머리 표지(`[#작업] 파일 — 가져오기…`) · 그 밖
//   구획(묶음) = 구획 주석에서 다음 구획 주석 앞까지(지도·생성기와 같은 규칙). 첫 구획 주석 앞은 「머리」.
//   구획마다 최상위 문 수를 세고, 문이 0 인 구획의 주석·빈 줄 수를 따로 낸다.
// 사용: node sweep-survey.cjs <index.html> <out.json>
const fs = require('fs');
const parser = require('@babel/parser');
const [HTML, OUT] = process.argv.slice(2);
const lines = fs.readFileSync(HTML, 'utf8').split('\n').map(l => l.replace(/\r$/, ''));
let s = -1, e = -1;
for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
const code = lines.slice(s, e).join('\n');
const ast = parser.parse(code, { sourceType: 'script', tokens: true });
const fn = ast.program.body[0].expression.callee || ast.program.body[0].expression.argument.callee;
const body = fn.body.body, off = s;
const L = n => n.loc.start.line + off, LE = n => n.loc.end.line + off;
const first = L(fn) /* (function(){ 줄 */, last = LE(ast.program.body[0]);
const kind = new Array(lines.length + 2).fill(null); // html 줄 번호(1부터) → 종류
for (let l = s + 1; l <= e; l++) kind[l] = 'unknown';
kind[first] = 'shell'; kind[last] = 'shell';
for (const d of fn.body.directives || []) for (let l = L(d); l <= LE(d); l++) kind[l] = 'shell';
for (const st of body) for (let l = L(st); l <= LE(st); l++) kind[l] = 'stmt';
const inStmt = l => kind[l] === 'stmt' || kind[l] === 'shell';
const topComments = ast.comments.filter(c => !inStmt(L(c)) || !inStmt(LE(c))).filter(c => { for (let l = L(c); l <= LE(c); l++) if (!inStmt(l)) return true; return false; });
const classify = c => {
  const v = c.value;
  if (c.type === 'CommentBlock' && /^\s*=+/.test(v)) return 'header';
  if (/\[어려움 이음매 자리 /.test(v)) return 'slot';
  if (/\[#TASK-ES-423\] 인라인 스크립트 세포화 1차 이음매/.test(v)) return 'seam1';
  if (/^\s*\[#[\w-]+\][^\n]*로 옮김/.test(v)) return 'moved';
  if (/^\s*\[#[\w-]+\] js\/[^\s]+ — /.test(v)) return 'genHead';
  return 'other';
};
const commentOfLine = new Map();
for (const c of topComments) { const k = classify(c); for (let l = L(c); l <= LE(c); l++) if (!inStmt(l)) { kind[l] = 'comment:' + k; commentOfLine.set(l, c); } }
for (let l = s + 1; l <= e; l++) if (kind[l] === 'unknown') kind[l] = lines[l - 1].trim() === '' ? 'blank' : 'other-text';
// 구획
const headers = topComments.filter(c => classify(c) === 'header').map(c => ({ line: L(c), endLine: LE(c), title: c.value.replace(/=+/g, '').trim() }));
const groups = [{ title: '(머리)', line: first, headerEnd: first, end: headers.length ? headers[0].line - 1 : last - 1 }].concat(headers.map((h, i) => ({ title: h.title, line: h.line, headerEnd: h.endLine, end: i + 1 < headers.length ? headers[i + 1].line - 1 : last - 1 })));
const count = (a, b, pred) => { let n = 0; for (let l = a; l <= b; l++) if (pred(kind[l], l)) n++; return n; };
for (const g of groups) {
  g.statements = body.filter(st => L(st) >= g.line && L(st) <= g.end).length;
  g.lines = g.end - g.line + 1;
  g.commentLines = count(g.headerEnd + 1, g.end, k => /^comment:/.test(k));
  g.blankLines = count(g.headerEnd + 1, g.end, k => k === 'blank');
  g.byKind = {}; for (let l = g.headerEnd + 1; l <= g.end; l++) if (/^comment:/.test(kind[l])) g.byKind[kind[l].slice(8)] = (g.byKind[kind[l].slice(8)] || 0) + 1;
  g.headerLines = g.title === '(머리)' ? 0 : g.headerEnd - g.line + 1;
}
const tally = {}; for (let l = s + 1; l <= e; l++) tally[kind[l]] = (tally[kind[l]] || 0) + 1;
const empty = groups.filter(g => g.title !== '(머리)' && g.statements === 0);
const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
const emptyByKind = {}; for (const g of empty) for (const [k, n] of Object.entries(g.byKind)) emptyByKind[k] = (emptyByKind[k] || 0) + n;
const out = { tool: 'reports/TASK-ES-661/tools/sweep-survey.cjs (@babel/parser)', type: '작업자 측정, 판정 아님', scriptHtmlLines: [s + 1, e], iifeLines: last - first + 1, topStatements: body.length,
  lineKinds: tally, lineKindsSum: Object.values(tally).reduce((a, b) => a + b, 0), scriptLines: e - s,
  groups: { total: groups.length - 1, withStatements: groups.filter(g => g.title !== '(머리)' && g.statements > 0).length, empty: empty.length },
  emptyGroups: { headerLines: sum(empty, g => g.headerLines), commentLines: sum(empty, g => g.commentLines), blankLines: sum(empty, g => g.blankLines), commentByKind: emptyByKind,
    list: empty.map(g => ({ title: g.title, line: g.line, end: g.end, headerLines: g.headerLines, commentLines: g.commentLines, blankLines: g.blankLines, byKind: g.byKind })) },
  groupsWithStatements: { commentLines: sum(groups.filter(g => g.statements > 0), g => g.commentLines), blankLines: sum(groups.filter(g => g.statements > 0), g => g.blankLines) },
  head: { statements: groups[0].statements, commentLines: groups[0].commentLines, blankLines: groups[0].blankLines, byKind: groups[0].byKind } };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ iife: out.iifeLines, top: out.topStatements, kinds: tally, groups: out.groups, empty: { header: out.emptyGroups.headerLines, comment: out.emptyGroups.commentLines, blank: out.emptyGroups.blankLines, byKind: emptyByKind }, withStmts: out.groupsWithStatements, head: out.head }));
