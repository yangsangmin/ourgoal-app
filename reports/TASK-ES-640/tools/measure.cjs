'use strict';
// TASK-ES-640 측정 모음(작업자 측정, 판정 아님). 저장소 밖 스크립트 — 결과만 reports/TASK-ES-640/ 에 쓴다.
// 사용: node measure.js <기준 트리> <작업 트리> <raw 폴더(npm-test.{base,work}.{log,exit} · tests-all.{base,work}.json)>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [BASE, WORK, RAW] = process.argv.slice(2);
const DIR = path.join(WORK, 'reports', 'TASK-ES-640');
const rj = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const wj = (f, o) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', 'utf8');
const TYPE = '작업자 측정, 판정 아님';
const git = (d, a) => cp.execFileSync('git', a, { cwd: d, encoding: 'utf8' }).trim();
const metrics = d => JSON.parse(cp.execFileSync(process.execPath, ['scripts/module-metrics.js'], { cwd: d, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
const lineCount = f => fs.readFileSync(f, 'utf8').split('\n').length - (fs.readFileSync(f, 'utf8').endsWith('\n') ? 1 : 0);

// 1) npm test 로그 비교
fs.mkdirSync(path.join(DIR, 'raw'), { recursive: true });
const npm = {};
for (const label of ['base', 'work']) {
  const log = fs.readFileSync(path.join(RAW, 'npm-test.' + label + '.log'), 'utf8');
  const exit = Number(fs.readFileSync(path.join(RAW, 'npm-test.' + label + '.exit'), 'utf8').trim());
  fs.writeFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.log'), log, 'utf8');
  fs.writeFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), String(exit) + '\n', 'utf8');
  const ls = log.split(/\r?\n/);
  npm[label] = {
    file: 'reports/TASK-ES-640/raw/npm-test.' + label + '.log', exit,
    checkLines: ls.filter(l => /^\s*✓/.test(l)).length,
    okLines: ls.filter(l => /^\s*ok\b/.test(l)).length,
    failMarkLines: ls.filter(l => /^\s*(✗|✘|not ok\b)/.test(l)).length,
    summaryLines: ls.filter(l => /\d+개 통과, \d+개 실패|총 \d+개 검사 중 \d+개 통과|ALL PASS|100% COMPLETE/.test(l)).map(l => l.trim()),
  };
}
npm.same = { exit: npm.base.exit === npm.work.exit, checkLines: npm.base.checkLines === npm.work.checkLines, okLines: npm.base.okLines === npm.work.okLines, summaryLines: JSON.stringify(npm.base.summaryLines) === JSON.stringify(npm.work.summaryLines) };
npm.tool = 'npm test (기준 트리·작업 트리 각각 전경 실행)'; npm.type = TYPE;
wj('npm-test-compare.json', npm);

// 2) tests 전부 종료 코드 비교
const tb = rj(path.join(RAW, 'tests-all.base.json')), tw = rj(path.join(RAW, 'tests-all.work.json'));
const files = Object.keys(tb);
const tdiff = files.filter(k => !tw[k] || tb[k].exit !== tw[k].exit || tb[k].okLines !== tw[k].okLines);
wj('tests-all-compare.json', { tool: 'tests/*.test.js 전부 + scripts/smoke-test.js · verify-integrity-gate.js · verify-all-clicks.js · test-shipyard-modular.js · module-guard.js 를 파일마다 node 로 실행(기준·작업)', type: TYPE,
  files: files.length, differing: tdiff.map(k => ({ file: k, base: tb[k], work: tw[k] || null })), differingCount: tdiff.length,
  nonZeroExit: { base: files.filter(k => tb[k].exit !== 0).length, work: files.filter(k => tw[k] && tw[k].exit !== 0).length },
  nonZeroExitFilesBase: files.filter(k => tb[k].exit !== 0),
  perFile: Object.fromEntries(files.map(k => [k, { base: [tb[k].exit, tb[k].okLines], work: tw[k] ? [tw[k].exit, tw[k].okLines] : null }])) });

// 3) 줄 수·지표
const mb = metrics(BASE), mw = metrics(WORK);
const meta = rj(path.join(DIR, 'gen-inline-hard-meta.json'));
const verify = rj(path.join(DIR, 'verify-inline-hard.json'));
const ml = rj(path.join(DIR, 'module-load.json'));
const fp = rj(path.join(DIR, 'name-fingerprints.json'));
const sc = fs.existsSync(path.join(DIR, 'scenario-local.json')) ? rj(path.join(DIR, 'scenario-local.json')) : null;
const baseline = rj(path.join(WORK, 'docs', 'architecture', 'module-baseline.json'));
const lastBase = baseline.history[baseline.history.length - 1];
const guard = cp.spawnSync(process.execPath, ['scripts/module-guard.js'], { cwd: WORK, encoding: 'utf8' });
const newFiles = Object.keys(meta.files);
const wraps = meta.plan.filter(p => p.action === 'wrap');
const numstat = git(WORK, ['diff', '--numstat', git(BASE, ['rev-parse', 'HEAD']), '--', 'index.html']).split(/\s+/);
const changed = git(WORK, ['diff', '--name-only', git(BASE, ['rev-parse', 'HEAD'])]).split('\n').filter(Boolean);
const out = {
  task: 'TASK-ES-640', type: TYPE, measuredAt: new Date().toISOString(),
  base: { head: git(BASE, ['rev-parse', 'HEAD']) },
  summary: {
    inlineScriptLines: { before: mb.ratchet.inlineScriptLines, after: mw.ratchet.inlineScriptLines, delta: mw.ratchet.inlineScriptLines - mb.ratchet.inlineScriptLines },
    indexFunctionDecls: { before: mb.ratchet.indexFunctionDecls, after: mw.ratchet.indexFunctionDecls },
    windowAssignments: { before: mb.ratchet.windowAssignments, after: mw.ratchet.windowAssignments },
    crossTabRefs: { before: mb.ratchet.crossTabRefs, after: mw.ratchet.crossTabRefs },
    oversizeJsFiles: { before: mb.ratchet.oversizeJsFiles.count, after: mw.ratchet.oversizeJsFiles.count },
    indexHtmlLines: { before: mb.info.indexHtmlLines, after: mw.info.indexHtmlLines, delta: mw.info.indexHtmlLines - mb.info.indexHtmlLines },
    indexHtmlNumstat: { added: Number(numstat[0]), deleted: Number(numstat[1]) },
  },
  generator: {
    wraps: wraps.length, moves: meta.plan.filter(p => p.action === 'move').length,
    wrapped: wraps.map(p => ({ cell: p.cell, name: p.names[0], segment: p.segment, stmt: p.stmt, stmtLines: p.stmt[1] - p.stmt[0] + 1 })),
    wrappedStmtLinesTotal: wraps.reduce((a, p) => a + (p.stmt[1] - p.stmt[0] + 1), 0),
    wrappedSegmentLinesTotal: wraps.reduce((a, p) => a + (p.segment[1] - p.segment[0] + 1), 0),
    imports: meta.imports.length, newExposeGetters: meta.exposed.length, newExposeGetterNames: meta.exposed, edits: meta.edits,
    headLinesAdded: 1 + meta.imports.length + (meta.exposed.length ? meta.exposed.length + 2 : 0),
  },
  newFiles: Object.fromEntries(newFiles.map(f => [f, { lines: lineCount(path.join(WORK, f)), under800: lineCount(path.join(WORK, f)) <= 800 }])),
  verify: { ok: verify.ok, notExposed: verify.notExposed, noSetter: verify.noSetter, thisArgs: verify.thisArgs, callsOk: verify.callsOk, importBeforeKit: verify.importBeforeKit, lastGetterNoSetter: verify.lastGetterNoSetter, restSame: verify.restSame, listeners: verify.listeners },
  moduleLoad: { regressions: ml.regressions, counts: ml.counts, wideRegressions: ml.wide.regressions, wideCounts: ml.wide.counts, newFilesLoadOneOk: Object.values(ml.newFilesLoadOne).every(r => r && r.ok === true) },
  names: { scopeLost: fp.scopeLost, scopeAdded: fp.scopeAdded, scopeFingerprintDiff: fp.scope.diff, scopeNames: fp.scope.names, windowFingerprintDiff: fp.window.diff, windowNames: fp.window.names },
  scenarios: sc ? { allPassedBoth: sc.allPassedBoth, rows: Object.keys(sc.scenarios).map(id => ({ id, base: sc.scenarios[id].runs.base.passed, base2: sc.scenarios[id].runs.base2 ? sc.scenarios[id].runs.base2.passed : null, work: sc.scenarios[id].runs.work.passed, nonVacuousExpectsWork: sc.scenarios[id].runs.work.nonVacuousExpects, exceptionsWork: (sc.scenarios[id].runs.work.exceptions || []).length })) } : null,
  npmTest: { baseExit: npm.base.exit, workExit: npm.work.exit, checkLines: [npm.base.checkLines, npm.work.checkLines], okLines: [npm.base.okLines, npm.work.okLines], same: npm.same },
  testsAll: { files: files.length, differingCount: tdiff.length },
  baseline: { lastInlineScriptLines: lastBase.metrics.inlineScriptLines, recordedEqualsMeasured: lastBase.metrics.inlineScriptLines === mw.ratchet.inlineScriptLines, historyLength: baseline.history.length },
  guard: { exitCode: guard.status },
  changedFiles: { all: changed, product: changed.filter(f => f === 'index.html' || f.startsWith('js/')), tests: changed.filter(f => f.startsWith('tests/')), vault: changed.filter(f => /^(court\/|\.github\/|\.githooks\/|AGENTS\.md|CLAUDE\.md|GEMINI\.md|01_OURGOAL|package\.json|vercel\.json|scripts\/(essence-gate|verify-integrity-gate)\.js|docs\/rules\/(OURGOAL_ABSOLUTE|CONSTITUTION_VERSIONS|ESSENCE_OURGOAL|rules)|docs\/directives\/)/.test(f)), generator: changed.filter(f => f.startsWith('docs/design/harness/')), generatedMaps: changed.filter(f => /docs\/architecture\/(cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md)/.test(f)) },
};
wj('measurement.json', out);
console.log(JSON.stringify({ s: out.summary, gen: { wraps: out.generator.wraps, stmt: out.generator.wrappedStmtLinesTotal, seg: out.generator.wrappedSegmentLinesTotal, head: out.generator.headLinesAdded }, files: out.newFiles, verify: out.verify.ok, ml: out.moduleLoad, names: out.names, sc: out.scenarios, npm: out.npmTest, ta: out.testsAll, bl: out.baseline, guard: out.guard, ch: { product: out.changedFiles.product, tests: out.changedFiles.tests, vault: out.changedFiles.vault, gen: out.changedFiles.generator, maps: out.changedFiles.generatedMaps } }, null, 0));
