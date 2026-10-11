'use strict';
// 옮긴 세포가 USER_SESSION_CHANNEL 에 대입하는 지점이 전부 통로(L.)를 거치는지 @babel/parser 로 센다(작업자 측정, 판정 아님).
// 기준 index.html 의 그 함수 안 대입 수와도 맞댄다. 사용: node assign-count.cjs <기준 index.html> <세포 파일> <작업 index.html> <out.json>
const fs = require('fs');
const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
const [BASE_HTML, CELL, WORK_HTML, OUT] = process.argv.slice(2);
const NAME = 'USER_SESSION_CHANNEL';
const count = code => { const ast = parser.parse(code, { sourceType: 'script' }); const r = { viaScopeAssign: 0, bareAssign: 0, viaScopeRead: 0, bareRead: 0 };
  traverse(ast, {
    AssignmentExpression(p) { const l = p.node.left;
      if (l.type === 'MemberExpression' && !l.computed && l.object.type === 'Identifier' && l.object.name === 'L' && l.property.name === NAME) r.viaScopeAssign++;
      if (l.type === 'Identifier' && l.name === NAME) r.bareAssign++; },
    MemberExpression(p) { const n = p.node; if (!n.computed && n.object.type === 'Identifier' && n.object.name === 'L' && n.property.name === NAME && !(p.parentPath.isAssignmentExpression() && p.parent.left === n)) r.viaScopeRead++; },
    Identifier(p) { if (p.node.name === NAME && p.isReferencedIdentifier() && !(p.parentPath.isAssignmentExpression() && p.parent.left === p.node)) r.bareRead++; },
  }); return r; };
const lines = fs.readFileSync(BASE_HTML, 'utf8').split(/\r?\n/);
const a = lines.findIndex(l => /^  function setupUserSessionRealtime\(\)\{/.test(l)); let b = a; while (lines[b] !== '  }') b++;
const baseFn = count(lines.slice(a, b + 1).join('\n'));
const cell = count(fs.readFileSync(CELL, 'utf8'));
const workLines = fs.readFileSync(WORK_HTML, 'utf8').split(/\r?\n/);
const left = workLines.map((l, i) => (l.includes(NAME) ? { line: i + 1, kind: /get USER_SESSION_CHANNEL\(\)/.test(l) ? '통로 노출 줄(get+set)' : /^\s*var USER_SESSION_CHANNEL\b/.test(l) ? '선언 줄' : '그 밖', text: l.trim().slice(0, 130) } : null)).filter(Boolean);
const out = { tool: 'reports/TASK-ES-653/tools/assign-count.cjs', type: '작업자 측정, 판정 아님', name: NAME,
  baseFunction: { lines: [a + 1, b + 1], bareAssign: baseFn.bareAssign, bareRead: baseFn.bareRead },
  cell: { viaScopeAssign: cell.viaScopeAssign, bareAssign: cell.bareAssign, viaScopeRead: cell.viaScopeRead, bareRead: cell.bareRead },
  allAssignmentsViaScope: cell.bareAssign === 0 && cell.viaScopeAssign === baseFn.bareAssign, allReadsViaScope: cell.bareRead === 0 && cell.viaScopeRead === baseFn.bareRead,
  nameLeftInWorkIndexHtml: left, onlyDeclarationAndExposeLeft: left.every(x => x.kind !== '그 밖') };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify(out).slice(0, 900));
