#!/usr/bin/env node
'use strict';
// #TASK-ES-689 이 PR 뒤 index.html 에 남은 인라인 스크립트 재기(작업자 측정 도구, 판정 아님).
//  ① index.html 의 인라인 스크립트 조각 전부(src 없는 <script> — 줄 범위 · 안쪽 줄 수 · 최상위 문 수와 종류 · 큰 인라인 IIFE 인가)
//  ② 서버 상수 선언 블록(부팅 파일 태그가 붙은 조각)의 문 목록 — 값 글자는 적지 않는다(이름 · 줄 · 길이만)
//  ③ 공식 지표 다섯 칸(scripts/module-metrics.js ratchet) 기준 → 작업
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-689/tools/remaining-inline.cjs <작업 트리> <기준 트리> <out.json>
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser');
const WORK = path.resolve(process.argv[2] || '.'), BASE = path.resolve(process.argv[3]), OUT = path.resolve(process.argv[4]);
const TAG = '<script src="js/app/boot.js"></script>';
const ls = fs.readFileSync(path.join(WORK, 'index.html'), 'utf8').replace(/\r\n/g, '\n').split('\n');
const pieces = []; let open = -1;
ls.forEach((l, i) => { if (open < 0 && l.trim() === '<script>') open = i; else if (open >= 0 && l.includes('</script>')) {
  const code = ls.slice(open + 1, i).join('\n'); let body = null, err = null; try { body = parser.parse(code, { sourceType: 'script' }).program.body; } catch (e) { err = String(e.message).slice(0, 80); }
  const kinds = {}; (body || []).forEach(n => { kinds[n.type] = (kinds[n.type] || 0) + 1; });
  pieces.push({ from: open + 1, to: i + 1, innerLines: i - open - 1, topStatements: body ? body.length : null, kinds, parseError: err, bigIife: (ls[open + 1] || '').trim() === '(function(){' && (ls[open + 2] || '').includes('"use strict"'), followedByBootTag: l.includes(TAG), closeLine: l.replace(/'[^']*'/g, "'…'").slice(0, 120),
    declarations: body && l.includes(TAG) ? body.map(n => (n.type === 'VariableDeclaration' && n.declarations.length === 1 && n.declarations[0].init && n.declarations[0].init.type === 'StringLiteral') ? { line: n.loc.start.line + open + 1, kind: '문자열 상수 선언(var)', name: n.declarations[0].id.name, valueLength: n.declarations[0].init.value.length } : { line: n.loc.start.line + open + 1, kind: n.type }) : undefined });
  open = -1; } });
const ratchet = d => require(path.join(d, 'scripts', 'module-metrics.js')).measure(d).ratchet;
const mB = ratchet(BASE), mW = ratchet(WORK);
const constPiece = pieces.find(p => p.followedByBootTag) || null;
const out = { tool: 'reports/TASK-ES-689/tools/remaining-inline.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(),
  inlinePieces: pieces, pieceCount: pieces.length, bigInlineIifeCount: pieces.filter(p => p.bigIife).length, innerLinesTotal: pieces.reduce((a, p) => a + p.innerLines, 0),
  constBlock: constPiece ? { lines: [constPiece.from, constPiece.to], blockLines: constPiece.to - constPiece.from + 1, innerLines: constPiece.innerLines, statements: constPiece.declarations, onlyStringConstDeclarations: constPiece.declarations.every(d => d.kind === '문자열 상수 선언(var)'), bootTagOnCloseLine: true } : null,
  officialMetrics: { base: mB, work: mW, note: 'scripts/module-metrics.js 의 ratchet 다섯 칸. inlineScriptLines 는 인라인 조각의 안쪽 줄 수를 더한 값이다. 최상위 var 로 생기는 전역 이름은 windowAssignments 에 들어가지 않는다' } };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ pieces: pieces.map(p => [p.from, p.to, p.innerLines, p.topStatements, p.bigIife]), bigIife: out.bigInlineIifeCount, inner: out.innerLinesTotal, constBlock: out.constBlock, metrics: [mB.inlineScriptLines, mW.inlineScriptLines] }));
