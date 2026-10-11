#!/usr/bin/env node
'use strict';
// #TASK-ES-666 — 「던지지 않는 단언」 전수 조사 결과 두 벌을 맞대, 둘째 트리에서만 실패하는 단언 줄을 파일별로 적는다(작업자 측정, 판정 아님).
// 입력은 reports/TASK-ES-620/run-asserts.cjs 의 결과 파일이다. 두 트리의 시험지가 같은 판이어야 줄 번호가 맞는다(기준·모의본 / 고친 기준·고친 모의본).
// 단언 밖의 끝남(otherEnds — 시험지가 스스로 종료 코드를 내거나 오류를 던진 것)도 둘째 트리에서만 나온 것을 따로 적는다.
// 사용: node only-in.cjs <첫째 결과.json> <둘째 결과.json> <out.json> [--label 글자]
const fs = require('fs');
const [A, B, OUT] = process.argv.slice(2);
const label = process.argv.indexOf('--label') >= 0 ? process.argv[process.argv.indexOf('--label') + 1] : null;
const a = JSON.parse(fs.readFileSync(A, 'utf8')), b = JSON.parse(fs.readFileSync(B, 'utf8'));
const key = x => x.file + ':' + x.line;
const inA = new Set(a.failedAssertsUnique.map(key));
const inB = new Set(b.failedAssertsUnique.map(key));
const only = b.failedAssertsUnique.filter(x => !inA.has(key(x))).map(x => ({ file: x.file, line: x.line, check: x.check || null, message: x.message || null, src: (x.src || '').slice(0, 400), ranBy: x.ranBy || null }))
  .sort((p, q) => (p.file < q.file ? -1 : p.file > q.file ? 1 : p.line - q.line));
const gone = a.failedAssertsUnique.filter(x => !inB.has(key(x))).map(x => ({ file: x.file, line: x.line, message: x.message || null }));
const byFile = {};
for (const x of only) byFile[x.file] = (byFile[x.file] || 0) + 1;
const ends = j => { const m = new Map(); for (const e of j.entries) m.set(e.entry, { softExit: e.softExit, timedOut: !!e.timedOut, otherEnds: (e.otherEnds || []).length }); return m; };
const ea = ends(a), eb = ends(b);
const endDiff = [];
for (const [entry, v] of eb) { const u = ea.get(entry); if (!u) { endDiff.push({ entry, first: null, second: v }); continue; } if (u.softExit !== v.softExit || u.timedOut !== v.timedOut || u.otherEnds !== v.otherEnds) endDiff.push({ entry, first: u, second: v }); }
const out = {
  tool: 'reports/TASK-ES-666/tools/only-in.cjs', type: '작업자 측정, 판정 아님', label,
  first: { tree: a.tree, entries: a.entries.length, failedAssertLines: a.failedAssertsUnique.length },
  second: { tree: b.tree, entries: b.entries.length, failedAssertLines: b.failedAssertsUnique.length },
  onlyInSecond: { lines: only.length, byFile, list: only },
  onlyInFirst: { lines: gone.length, list: gone },
  entryEndDifferences: endDiff,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log((label || '') + ' 둘째에서만 실패 ' + only.length + '줄 · 첫째에서만 실패 ' + gone.length + '줄 · 끝남이 다른 시험지 ' + endDiff.length);
for (const x of only) console.log('  ' + x.file + ':' + x.line + '  ' + String(x.message || x.src).slice(0, 110));
for (const d of endDiff) console.log('  [끝남] ' + d.entry + ' ' + JSON.stringify(d.first) + ' → ' + JSON.stringify(d.second));
