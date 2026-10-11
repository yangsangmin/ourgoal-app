#!/usr/bin/env node
'use strict';
// #TASK-ES-679 병합 뒤 확인(작업자 측정 도구, 판정 아님) — push 직전에 origin/main 을 합친 뒤, 전체를 다시 재지 않고 두 가지만 다시 본다(오케스트레이터 지시):
//   ① 등록 기관 대조 탐침: 새 기준 트리 → 그 이름 목록으로 작업 트리(통로에서 사라진 이름 · 이름별 값 지문 차이)
//   ② npm test: 작업 트리에서 끝까지 돌린 종료 코드와 검사 줄 수(로그는 raw/npm-test.after-merge.log)
// 덤으로 상태 객체 탐침을 작업 트리에서 한 번 더 돌려 앞선 기록(state-object-probe.work.json)과 같은지 본다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-679/tools/after-merge-check.cjs <작업 트리> <새 기준 트리>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const WORK = path.resolve(process.argv[2] || '.'), BASE = path.resolve(process.argv[3]);
const DIR = path.join(WORK, 'reports', 'TASK-ES-679'), REL = 'reports/TASK-ES-679/';
const rj = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const node = (cwd, args) => cp.spawnSync(process.execPath, args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const git = (d, a) => cp.execFileSync('git', a, { cwd: d, encoding: 'utf8' }).trim();
const cmp = path.join(WORK, 'scripts', 'probes', 'cell-registry-compare.js');
const r1 = node(WORK, [cmp, BASE, path.join(DIR, 'after-merge.registry.base.json'), '--fingerprints']);
const r2 = node(WORK, [cmp, WORK, path.join(DIR, 'after-merge.registry.work.json'), '--fingerprints', '--names-from', path.join(DIR, 'after-merge.registry.base.json')]);
const cB = rj('after-merge.registry.base.json'), cW = rj('after-merge.registry.work.json');
const intrinsic = rj('measurement.json').summary.stateProbe.intrinsicVariance || [];
const fpd = k => Object.keys(cB.fingerprints[k]).filter(n => cB.fingerprints[k][n] !== cW.fingerprints[k][n] && !intrinsic.includes(n));
const r3 = node(WORK, [path.join(DIR, 'tools', 'state-object-probe.cjs'), WORK, path.join(DIR, 'after-merge.state-object.work.json')]);
const mask = r => JSON.parse(JSON.stringify(r, (k, v) => (k === 'organNames') ? undefined : v));
const soBefore = rj('state-object-probe.work.json'), soAfter = rj('after-merge.state-object.work.json');
const npm = cp.spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['test'], { cwd: WORK, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, shell: process.platform === 'win32' });
const log = (npm.stdout || '') + (npm.stderr || '');
fs.writeFileSync(path.join(DIR, 'raw', 'npm-test.after-merge.log'), log, { encoding: 'utf8' });
const T = log.split(/\r?\n/);
const out = { tool: REL + 'tools/after-merge-check.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), base: git(BASE, ['rev-parse', 'HEAD']), workHead: git(WORK, ['rev-parse', 'HEAD']),
  registry: { exit: [r1.status, r2.status], ok: cW.ok, counts: { base: cB.counts, work: cW.counts }, scopeLost: cW.namesFrom ? cW.namesFrom.scopeLost : null, scopeAdded: cW.namesFrom ? cW.namesFrom.scopeAdded : null, differingScope: fpd('scope'), differingWindow: fpd('window'), intrinsicExcluded: intrinsic },
  stateObject: { exit: r3.status, sameAsBeforeMerge: JSON.stringify(mask(soBefore.result)) === JSON.stringify(mask(soAfter.result)), organNames: [soBefore.result.organNames, soAfter.result.organNames] },
  npmTest: { exitCode: npm.status, okLines: T.filter(l => /^\s*✓ /.test(l)).length, okDotLines: T.filter(l => /^\s*ok · /.test(l)).length, failLines: T.filter(l => /^\s*(✗|✖|not ok|FAIL\b)/.test(l)).length, log: REL + 'raw/npm-test.after-merge.log' },
  note: '전체 측정(measurement.json)은 합치기 전 기준에서 잰 것이다. 합친 커밋은 js 세포의 등록 블록만 바꿨고 index.html 은 바꾸지 않았다 — 그래서 대조 탐침과 npm test 만 새 기준에서 다시 봤다.' };
out.ok = out.registry.ok === true && out.registry.scopeLost.length === 0 && out.registry.differingScope.length === 0 && out.registry.differingWindow.length === 0 && out.stateObject.sameAsBeforeMerge === true && out.npmTest.exitCode === 0 && out.npmTest.failLines === 0;
fs.writeFileSync(path.join(DIR, 'after-merge-check.json'), JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify(out));
