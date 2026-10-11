#!/usr/bin/env node
'use strict';
// #TASK-ES-681 측정 모음(작업자 측정 도구, 판정 아님) — 단위 시험 결과를 묶음별로 줄이고(unit-summary.json), 바뀐 파일 범위와 npm test 기록을 measurement.json 에 모은다.
// 사용: node reports/TASK-ES-681/tools/measure.cjs <작업 트리>   (먼저: finalize-options-unit.json · mock/mock-apply.json · raw/npm-test.work.{log,exit})
const fs = require('fs'), path = require('path'), cp = require('child_process');
const WORK = path.resolve(process.argv[2]);
const DIR = path.join(WORK, 'reports', 'TASK-ES-681');
const rj = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const wj = (f, o) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' });
const git = a => cp.execFileSync('git', a, { cwd: WORK, encoding: 'utf8' }).trim();
const u = rj('finalize-options-unit.json'), by = {}; u.results.forEach(r => { by[r.id] = r; });
const ok = ids => ids.every(id => by[id] && by[id].ok === true);
const range = (p, a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(p + String(i).padStart(2, '0')); return o.filter(id => by[id]); };
const sRelay = range('S', 1, 19), sKeep = range('S', 31, 50), sDead = range('S', 61, 88);
const P = by.P || { ok: false, detail: {} };
const summary = {
  tool: 'reports/TASK-ES-681/tools/measure.cjs', type: '작업자 측정, 판정 아님', source: 'reports/TASK-ES-681/finalize-options-unit.json', pin: u.pin,
  total: u.total, passed: u.passed, failed: u.failed,
  prevSuite: { ok: P.ok === true, total: P.detail && P.detail.total, failed: P.detail && P.detail.failed, note: '앞선 finalize 단위 시험 45건(그 안에서 661 · 657 · 643 · 634 · 619 · B1 과 병합된 PR 재생성이 다시 돈다). 실패는 생성기 diff 모양 검사(D0)뿐이어야 한다 — 생성기에 줄을 더하면 구조적으로 거짓이 되는 검사다(L110). 그 시험 파일은 고치지 않았다' },
  diffConfinedOk: ok(['D']), diffDetail: by.D && by.D.detail,
  allDefaultSameOk: ok(['G1', 'G2']),
  allRelayOk: ok(['R1', 'R2']), allKeepInlineOk: ok(['K1', 'K2', 'K3', 'K4', 'K5']), allDeadImportOk: ok(['U1', 'U2']),
  allExecEquivalentOk: ok(['E1', 'E2', 'E3', 'E4', 'E5']),
  stops: { relay: sRelay.length, keepInline: sKeep.length, deadImport: sDead.length },
  allStopsRelayOk: sRelay.length === 19 && ok(sRelay), allStopsKeepInlineOk: sKeep.length === 20 && ok(sKeep), allStopsDeadImportOk: sDead.length === 28 && ok(sDead),
  auditsOk: ok(['A', 'AU']), realIndexStopsOk: ok(['X1']), realIndexStop: by.X1 && by.X1.detail && { outside: by.X1.detail.outside, kinds: by.X1.detail.kinds }, rerunStopsOk: ok(['X2']),
  allButPrevSuiteShapeChecksOk: u.results.every(r => r.ok === true),
};
wj('unit-summary.json', summary);
// 바뀐 파일 범위(origin/main 대비)
const base = git(['merge-base', 'HEAD', 'origin/main']);
const files = git(['diff', '--name-only', base, '--']).split('\n').filter(Boolean).concat(git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)).filter((f, i, a) => a.indexOf(f) === i).sort();
const vaultRe = /^(court\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|\.agent\/rules\/|docs\/rules\/(OURGOAL_ABSOLUTE_INTEGRITY_RULES\.md|CONSTITUTION_VERSIONS\.md|ESSENCE_OURGOAL\.md|rules\.json|rules-control\.json|branch-protection.*\.json|archive\/)|\.github\/|\.githooks\/|scripts\/essence-gate\.js$|scripts\/install-essence-gate\.js$|scripts\/verify-integrity-gate\.js$|scripts\/hook-smoke-on-index\.js$|\.vercelignore$|package\.json$|vercel\.json$|\.gitattributes$|\.claude\/settings\.json$|docs\/directives\/)/;
const npmLog = fs.existsSync(path.join(DIR, 'raw', 'npm-test.work.log')) ? fs.readFileSync(path.join(DIR, 'raw', 'npm-test.work.log'), 'utf8') : null;
const m = rj('mock/mock-apply.json');
const measurement = {
  tool: 'reports/TASK-ES-681/tools/measure.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), base,
  changed: { files: files.length, productFiles: files.filter(f => /^(js\/.*|index\.html|ui\.js|sw\.js|.*\.css)$/.test(f)), testsChanged: files.filter(f => /^tests\//.test(f)), scriptsChanged: files.filter(f => /^scripts\//.test(f)), vaultChanged: files.filter(f => vaultRe.test(f)),
    harnessChanged: files.filter(f => /^docs\/design\/harness\//.test(f)), designDocsChanged: files.filter(f => /^docs\/architecture\//.test(f)), generatedMapsChanged: files.filter(f => /^docs\/architecture\/(cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md|modules\.json|cell-descriptions\.json|module-baseline\.json)$/.test(f)) },
  unit: { total: summary.total, passed: summary.passed, failed: summary.failed },
  npmTest: npmLog === null ? null : { exitCode: Number((/exit=(\d+)/.exec(fs.readFileSync(path.join(DIR, 'raw', 'npm-test.work.exit'), 'utf8')) || [])[1]), okLines: npmLog.split('\n').filter(l => /✓/.test(l)).length },
  mock: { file: 'reports/TASK-ES-681/mock/mock-apply.json', base: m.base, htmlLines: m.htmlLines, finalizeRan: !!m.step3Finalize, deadImportsRemoved: m.step2Unwire.runs.flatMap(r => r.deadImports.map(d => d.name)),
    relayed: (m.step3Finalize.relayed || []).map(x => ({ name: x.name, movedTo: x.movedTo })), inlineKept: m.inlineKept, compareMismatches: m.compare.mock.mismatches, scopeLost: m.compare.scopeLost, fingerprintsDiffering: m.compare.fingerprintsDiffering, bootExceptions: m.compare.exceptions,
    scenariosAllPassedBoth: m.scenarios.allPassedBoth, scenarios: m.scenarios.count, npmTestSame: m.npmTest.same, testsEachDiffering: m.testsEach.differing.length, commitHook: m.commitHook, deadImportRuntime: m.deadImportRuntime, moduleSpecs: m.moduleSpecs },
};
wj('measurement.json', measurement);
console.log(JSON.stringify({ unit: [summary.total, summary.passed, summary.failed], groups: [summary.prevSuite.ok, summary.diffConfinedOk, summary.allDefaultSameOk, summary.allRelayOk, summary.allKeepInlineOk, summary.allDeadImportOk, summary.allExecEquivalentOk, summary.allStopsRelayOk, summary.allStopsKeepInlineOk, summary.allStopsDeadImportOk, summary.auditsOk, summary.realIndexStopsOk, summary.rerunStopsOk], stops: summary.stops, changed: measurement.changed, npm: measurement.npmTest }));
