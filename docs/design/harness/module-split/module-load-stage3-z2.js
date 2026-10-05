'use strict';
// #TASK-ES-545 원본 단독 로드(작업자 보조, 판정 아님) — 법정 모듈 로드 탐침(court/probes/module-load.js)을 읽기만 해서 기준 트리·작업 트리에 돌리고 맞댄다(court/** 변경 0).
// module-load-inline-split-2.js(#TASK-ES-432)와 같은 방식이며, 새 세포 파일 목록을 인자로 받는다. 새 파일은 각각 격리된 vm 에서 단독으로 불러 오류·등록 전역을 적는다.
// 사용: node module-load-stage3-z2.js <기준 트리> <작업 트리> <out.json> <새 파일,새 파일,...>
const fs = require('fs'), path = require('path');
const [BASE, WORK, OUT, NEWLIST] = process.argv.slice(2);
const probe = require(path.resolve(WORK, 'court', 'probes', 'module-load.js'));
const cfg = JSON.parse(fs.readFileSync(path.resolve(WORK, 'court', 'config.json'), 'utf8'));
const dirs = cfg.productModuleDirs || ['js'];
const baseRes = probe.probeModules(path.resolve(BASE), dirs);
const headRes = probe.probeModules(path.resolve(WORK), dirs);
const cmp = probe.compare(baseRes, headRes, fs.readFileSync(path.resolve(WORK, 'index.html'), 'utf8'));
const NEW = String(NEWLIST || '').split(',').filter(Boolean).concat(['js/core/app-scope.js']);
const newFilesStandalone = {};
for (const f of NEW) { const h = probe.loadOne(path.resolve(WORK, f)); newFilesStandalone[f] = { ok: h.ok, error: h.error || null, globals: h.globals }; }
const standaloneOk = cmp.regressions.length === 0 && Object.values(newFilesStandalone).every(x => x.ok);
const out = Object.assign({}, cmp, { newFilesStandalone, standaloneOk });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify({ regressions: cmp.regressions.length, counts: cmp.counts, standaloneOk, newGlobals: Object.entries(newFilesStandalone).map(([f, x]) => f + ':' + x.ok + ':' + x.globals.join(',')) }));
