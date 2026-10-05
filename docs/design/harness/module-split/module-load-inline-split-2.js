'use strict';
// #TASK-ES-432 원본 단독 로드 — 법정 모듈 로드 탐침(court/probes/module-load.js)을 읽기만 해서 기준 트리·작업 트리에 돌리고 맞댄다(court/** 변경 0).
// 탐침 목록(productModuleDirs)과 별도로, 새 세포 파일과 index.html 이 부르는 탭 파일을 각각 격리된 vm 에서 단독으로 불러 오류·등록 전역을 적는다.
// 사용: node module-load-inline-split-2.js <기준 트리> <작업 트리> <out.json>
const fs = require('fs'), path = require('path');
const [BASE, WORK, OUT] = process.argv.slice(2);
const probe = require(path.resolve(WORK, 'court', 'probes', 'module-load.js'));
const cfg = JSON.parse(fs.readFileSync(path.resolve(WORK, 'court', 'config.json'), 'utf8'));
const dirs = cfg.productModuleDirs || ['js'];
const baseRes = probe.probeModules(path.resolve(BASE), dirs);
const headRes = probe.probeModules(path.resolve(WORK), dirs);
const cmp = probe.compare(baseRes, headRes, fs.readFileSync(path.resolve(WORK, 'index.html'), 'utf8'));
const NEW = ['js/tabs/comm/cheer-notify.js'];
const TOUCHED_TABS = ['js/tabs/comm/index.js', 'js/tabs/comm/render.js', 'js/core/app-scope.js'];
const standalone = {};
for (const f of NEW.concat(TOUCHED_TABS)) {
  const h = probe.loadOne(path.resolve(WORK, f));
  const b = fs.existsSync(path.resolve(BASE, f)) ? probe.loadOne(path.resolve(BASE, f)) : null;
  standalone[f] = { work: { ok: h.ok, error: h.error || null, globals: h.globals }, base: b ? { ok: b.ok, error: b.error || null, globals: b.globals } : null };
}
const newOk = NEW.every(f => standalone[f].work.ok);
const touchedSame = TOUCHED_TABS.every(f => standalone[f].base && standalone[f].base.ok === standalone[f].work.ok && JSON.stringify(standalone[f].base.globals) === JSON.stringify(standalone[f].work.globals));
const out = Object.assign({}, cmp, { standalone, newFilesStandaloneOk: newOk, touchedTabFilesSame: touchedSame, regressionCount: cmp.regressions.length });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ regressions: cmp.regressions.length, counts: cmp.counts, newOk, touchedSame, newGlobals: NEW.map(f => f + ':' + standalone[f].work.globals.join(',')) }));
