'use strict';
// #TASK-ES-432 줄 수 기록 — scripts/module-metrics.js(모듈 가드가 쓰는 같은 측정)를 기준 트리·작업 트리에 읽기만으로 돌려 인라인 줄·함수 선언·전역 대입을 적고, 새 세포 파일 줄 수(wc -l 과 같음)를 적는다.
// 사용: node line-counts-inline-split-2.js <기준 트리> <작업 트리> <out.json>
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const [BASE, WORK, OUT] = process.argv.slice(2);
const metrics = root => JSON.parse(execFileSync(process.execPath, [path.resolve(WORK, 'scripts', 'module-metrics.js'), '--root', root], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
const pick = m => ({ inlineScriptLines: m.ratchet.inlineScriptLines, indexFunctionDecls: m.ratchet.indexFunctionDecls, windowAssignments: m.ratchet.windowAssignments, oversizeJsFiles: m.ratchet.oversizeJsFiles.count, crossTabRefs: m.ratchet.crossTabRefs });
const b = metrics(path.resolve(BASE)), w = metrics(path.resolve(WORK));
const NEW = ['js/tabs/comm/cheer-notify.js'];
const lines = f => { const s = fs.readFileSync(path.resolve(WORK, f), 'utf8'); return s.split('\n').length - (s.endsWith('\n') ? 1 : 0); };
const htmlLines = root => fs.readFileSync(path.resolve(root, 'index.html'), 'utf8').split('\n').length;
const newFiles = Object.fromEntries(NEW.map(f => [f, lines(f)]));
const out = { task: 'TASK-ES-432', what: 'scripts/module-metrics.js 측정(모듈 가드 ①②③) + 새 세포 줄 수(wc -l)', before: pick(b), after: pick(w), indexHtmlLines: { before: htmlLines(BASE), after: htmlLines(WORK) }, newFiles, allAtMost800: Object.values(newFiles).every(n => n <= 800) };
out.inlineDelta = out.after.inlineScriptLines - out.before.inlineScriptLines;
out.inlineDecreased = out.inlineDelta < 0;
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify(out));
