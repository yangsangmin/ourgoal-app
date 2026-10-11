'use strict';
// 옮긴 함수의 arguments · this 를 생성기·검사기와 따로 센다(작업자 측정, 판정 아님). 헌법 CELL_SPLIT 5호(v2026.10.11-ARGUMENTS)의 허용 범위 안인지 본다:
//  · 세포 파일의 arguments 식별자마다 가장 가까운 함수 부모가 무엇인지(옮긴 함수 선언 자신 / 화살표 함수 / 그 밖의 함수)
//  · 옮긴 함수 선언 안의 this 수(화살표 함수 안 포함) · 화살표 함수 수
//  · 기준 index.html 의 같은 함수에서 센 값과 같은지
//  · 생성기 메타·검사기 보고의 ownArguments 수와 같은지, 검사기 thisArgs 가 비어 있는지
// 사용: node arguments-check.cjs <기준 index.html> <작업 트리> <함수 이름> <세포 파일(작업 트리 기준)> <out.json>
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
const [BASE_HTML, WORK, NAME, CELL, OUT] = process.argv.slice(2);
const R = path.join(WORK, 'reports', 'TASK-ES-659');
const count = (code, where) => {
  const ast = parser.parse(code, { sourceType: 'script', errorRecovery: false });
  let found = null;
  traverse(ast, { FunctionDeclaration(p) { if (p.node.id && p.node.id.name === NAME && !found) found = p; } });
  if (!found) return { where, found: false };
  const k = { where, found: true, params: found.node.params.length, argumentsOwn: 0, argumentsInArrow: 0, argumentsInInnerFunction: 0, thisOwnLayer: 0, arrowFunctions: 0, innerOrdinaryFunctions: 0, argumentsLines: [] };
  found.traverse({
    ArrowFunctionExpression() { k.arrowFunctions++; },
    'FunctionExpression|FunctionDeclaration'() { k.innerOrdinaryFunctions++; },
    ThisExpression(q) { let f = q.getFunctionParent(); while (f && f.isArrowFunctionExpression()) f = f.getFunctionParent(); if (f && f.node === found.node) k.thisOwnLayer++; },
    Identifier(q) {
      if (q.node.name !== 'arguments' || !q.isReferencedIdentifier()) return;
      const f = q.getFunctionParent();
      if (f && f.node === found.node) { k.argumentsOwn++; k.argumentsLines.push(code.split(/\r?\n/)[q.node.loc.start.line - 1].trim()); }
      else if (f && f.isArrowFunctionExpression()) k.argumentsInArrow++; else k.argumentsInInnerFunction++;
    },
  });
  return k;
};
// 기준: index.html 의 인라인 스크립트 가운데 그 함수 선언이 든 덩어리
const html = fs.readFileSync(BASE_HTML, 'utf8');
let baseCode = null; { const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g; let m; while ((m = re.exec(html))) if (m[1].includes('function ' + NAME + '(')) { baseCode = m[1]; break; } }
const base = baseCode ? count(baseCode, 'index.html(기준) 인라인 스크립트') : { found: false };
const cellCode = fs.readFileSync(path.join(WORK, CELL), 'utf8');
const cell = count(cellCode, CELL);
const workHtml = fs.readFileSync(path.join(WORK, 'index.html'), 'utf8');
const meta = JSON.parse(fs.readFileSync(path.join(R, 'gen-inline-hard-meta.json'), 'utf8')), verify = JSON.parse(fs.readFileSync(path.join(R, 'verify-inline-hard.json'), 'utf8'));
const allCellArguments = (cellCode.match(/\barguments\b/g) || []).length - (cellCode.split(/\r?\n/).filter(l => /^\s*(\*|\/\*|\/\/)/.test(l)).join('\n').match(/\barguments\b/g) || []).length;
const out = { tool: 'reports/TASK-ES-659/tools/arguments-check.cjs (@babel/parser · @babel/traverse)', type: '작업자 측정, 판정 아님', name: NAME, base, cell,
  cellArgumentsWordsOutsideComments: allCellArguments,
  declarationLeftInWorkIndexHtml: workHtml.includes('function ' + NAME + '('),
  generatorOwnArguments: meta.ownArguments || null, verifierOwnArguments: verify.ownArguments || null, verifierThisArgs: verify.thisArgs,
  generatorOwnArgumentsCount: (meta.ownArguments || []).reduce((a, x) => a + x.count, 0), verifierOwnArgumentsCount: (verify.ownArguments || []).reduce((a, x) => a + x.count, 0),
  verifierOwnArgumentsNames: (verify.ownArguments || []).map(x => x.name) };
out.withinClause = cell.found === true && cell.argumentsInArrow === 0 && cell.thisOwnLayer === 0;
out.sameAsBase = base.found === true && cell.found === true && ['params', 'argumentsOwn', 'argumentsInArrow', 'argumentsInInnerFunction', 'thisOwnLayer', 'arrowFunctions', 'innerOrdinaryFunctions'].every(k => base[k] === cell[k]) && JSON.stringify(base.argumentsLines) === JSON.stringify(cell.argumentsLines);
out.countsAgree = cell.argumentsOwn === out.generatorOwnArgumentsCount && cell.argumentsOwn === out.verifierOwnArgumentsCount && cell.argumentsOwn === allCellArguments;
out.ok = out.withinClause && out.sameAsBase && out.countsAgree && out.verifierThisArgs.length === 0 && out.declarationLeftInWorkIndexHtml === false;
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ ok: out.ok, within: out.withinClause, same: out.sameAsBase, agree: out.countsAgree, base, cell, words: allCellArguments, gen: out.generatorOwnArgumentsCount, ver: out.verifierOwnArgumentsCount }));
