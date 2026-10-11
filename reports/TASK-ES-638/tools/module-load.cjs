'use strict';
// 법정 모듈 로드 탐침(court/probes/module-load.js)을 읽기 전용으로 불러 기준 대 작업을 비교하고, 새 파일 넷을 하나씩 단독 로드한다(작업자 측정, 판정 아님).
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [BASE, WORK, OUT] = process.argv.slice(2);
const ml = require(path.join(WORK, 'court', 'probes', 'module-load.js'));
const cmp = ml.compare(ml.probeModules(BASE), ml.probeModules(WORK), fs.readFileSync(path.join(WORK, 'index.html'), 'utf8'));
const DIRS = ['js', 'js/core', 'js/tabs/settings', 'js/tabs/goals'];
const cmpWide = ml.compare(ml.probeModules(BASE, DIRS), ml.probeModules(WORK, DIRS), fs.readFileSync(path.join(WORK, 'index.html'), 'utf8'));
const NEW = ['js/tabs/settings/boot-wiring.js', 'js/tabs/goals/goal-agent-toggle.js', 'js/core/module-connect.js', 'js/core/pwa-service-worker.js'];
const one = {};
for (const f of NEW) { let r; try { r = ml.loadOne(path.join(WORK, f)); } catch (e) { r = { threw: String(e && e.message || e) }; } one[f] = r; }
const git = d => cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: d, encoding: 'utf8' }).trim();
const out = { tool: 'court/probes/module-load.js (읽기 전용 — compare(probeModules(기준), probeModules(작업)) · loadOne(작업, 새 파일))', type: '작업자 측정, 판정 아님', baseHead: git(BASE), measuredAt: new Date().toISOString(),
  regressions: cmp.regressions, insufficient: cmp.insufficient, fixed: cmp.fixed, counts: cmp.counts, wide: { dirs: DIRS, regressions: cmpWide.regressions, insufficient: cmpWide.insufficient, fixed: cmpWide.fixed, counts: cmpWide.counts }, newFilesLoadOne: one };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');
console.log('regressions', JSON.stringify(cmp.regressions), 'insufficient', JSON.stringify(cmp.insufficient).slice(0, 200), 'fixed', JSON.stringify(cmp.fixed).slice(0, 100), 'counts', JSON.stringify(cmp.counts));
console.log('wide', JSON.stringify(cmpWide.regressions), JSON.stringify(cmpWide.counts), JSON.stringify(cmpWide.insufficient).slice(0,300));
console.log(JSON.stringify(one).slice(0, 900));
