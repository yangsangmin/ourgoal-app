'use strict';
// 법정 모듈 로드 탐침(court/probes/module-load.js)을 읽기 전용으로 불러 기준 대 작업을 비교한다(작업자 측정, 판정 아님). 이 PR 은 js 파일을 바꾸지 않는다 — 회귀 0 이어야 한다.
// 사용: node module-load.cjs <기준 트리> <작업 트리> <out.json>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [BASE, WORK, OUT] = process.argv.slice(2);
const ml = require(path.join(path.resolve(WORK), 'court', 'probes', 'module-load.js'));
const html = fs.readFileSync(path.join(WORK, 'index.html'), 'utf8');
const cmp = ml.compare(ml.probeModules(BASE), ml.probeModules(WORK), html);
const DIRS = ['js', 'js/core', 'js/tabs/records', 'js/tabs/calendar'];
const wide = ml.compare(ml.probeModules(BASE, DIRS), ml.probeModules(WORK, DIRS), html);
const git = d => cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: d, encoding: 'utf8' }).trim();
const out = { tool: 'court/probes/module-load.js (읽기 전용 — compare(probeModules(기준), probeModules(작업)))', type: '작업자 측정, 판정 아님', baseHead: git(BASE), measuredAt: new Date().toISOString(),
  regressions: cmp.regressions, insufficient: cmp.insufficient, fixed: cmp.fixed, counts: cmp.counts, wide: { dirs: DIRS, regressions: wide.regressions, insufficient: wide.insufficient, fixed: wide.fixed, counts: wide.counts } };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('regressions', JSON.stringify(cmp.regressions), 'counts', JSON.stringify(cmp.counts), 'wide', JSON.stringify(wide.regressions), JSON.stringify(wide.counts));
