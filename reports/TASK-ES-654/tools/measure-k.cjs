#!/usr/bin/env node
'use strict';
// TASK-ES-654 — index.html 인라인 스크립트의 함수 선언 가운데 본문 최상위에서 this·arguments 를 쓰는 것을 센다(읽기 전용).
// 「최상위」의 뜻은 생성기 gen-inline-hard.js 의 topThisArgs 와 같다: 화살표 함수 안으로는 내려가고, 일반 함수(function) 안은 건너뛴다.
// 거기에 더해 arguments 가 화살표 함수 안에 있는지(argumentsInArrow)를 따로 센다 — 개정 조문이 허용에서 뺀 꼴이다.
//   node reports/TASK-ES-654/tools/measure-k.cjs [index.html 경로]   (표준 출력 = JSON)
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const file = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', '..', 'index.html'));
const html = fs.readFileSync(file, 'utf8');
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
const found = [];
let blocks = 0, parsed = 0, declarations = 0, m;
while ((m = re.exec(html))) {
  blocks++;
  let ast;
  try { ast = parser.parse(m[1], { sourceType: 'script' }); } catch (_) { continue; }
  parsed++;
  const startLine = html.slice(0, m.index + m[0].indexOf(m[1])).split('\n').length;
  traverse(ast, {
    FunctionDeclaration(fn) {
      declarations++;
      let th = 0, ar = 0, arInArrow = 0;
      fn.get('body').traverse({
        Function(q) { if (!q.isArrowFunctionExpression()) q.skip(); },
        ThisExpression() { th++; },
        Identifier(q) {
          if (q.node.name !== 'arguments' || !q.isReferencedIdentifier()) return;
          ar++;
          for (let p = q.parentPath; p && p !== fn; p = p.parentPath) if (p.isArrowFunctionExpression()) { arInArrow++; break; }
        },
      });
      if (th || ar) found.push({ name: fn.node.id.name, line: startLine + fn.node.loc.start.line - 1, this: th, arguments: ar, argumentsInArrow: arInArrow });
    },
  });
}
process.stdout.write(JSON.stringify({ file: path.basename(file), inlineScriptBlocks: blocks, parsedBlocks: parsed, functionDeclarations: declarations, topLevelThisOrArguments: found }, null, 2) + '\n');
