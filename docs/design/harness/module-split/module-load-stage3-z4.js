'use strict';
// 인라인 3단계 Z4(#TASK-ES-520~) 원본 단독 로드 — 법정 모듈 로드 탐침(court/probes/module-load.js)을 읽기만 해서 기준 트리·작업 트리에 돌리고 맞댄다(court/** 변경 0).
// module-load-inline-split-2.js(#TASK-ES-432)와 같은 방식이고, 새 세포 파일 목록만 인자로 받는다. 새 파일은 각각 격리된 vm 에서 단독으로 불러 오류·등록 전역을 적는다.
// 사용: node module-load-stage3-z4.js <기준 트리> <작업 트리> <out.json> <새 파일 상대경로...>
const fs = require('fs'), path = require('path');
const [BASE, WORK, OUT, ...NEW] = process.argv.slice(2);
const probe = require(path.resolve(WORK, 'court', 'probes', 'module-load.js'));
const cfg = JSON.parse(fs.readFileSync(path.resolve(WORK, 'court', 'config.json'), 'utf8'));
const dirs = cfg.productModuleDirs || ['js'];
const baseRes = probe.probeModules(path.resolve(BASE), dirs);
const headRes = probe.probeModules(path.resolve(WORK), dirs);
const cmp = probe.compare(baseRes, headRes, fs.readFileSync(path.resolve(WORK, 'index.html'), 'utf8'));
const TOUCHED = ['js/core/app-scope.js'];
const standalone = {};
for (const f of NEW.concat(TOUCHED)) {
  const h = probe.loadOne(path.resolve(WORK, f));
  const b = fs.existsSync(path.resolve(BASE, f)) ? probe.loadOne(path.resolve(BASE, f)) : null;
  standalone[f] = { work: { ok: h.ok, error: h.error || null, globals: h.globals }, base: b ? { ok: b.ok, error: b.error || null, globals: b.globals } : null };
}
const newOk = NEW.every(f => standalone[f].work.ok);
const out = Object.assign({}, cmp, { standalone, newFilesStandaloneOk: newOk, regressionCount: cmp.regressions.length, standaloneOk: newOk && cmp.regressions.length === 0 });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify({ regressions: cmp.regressions.length, counts: cmp.counts, newOk, newGlobals: NEW.map(f => f + ':' + standalone[f].work.globals.join(',')) }));
