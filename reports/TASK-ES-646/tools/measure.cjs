'use strict';
// #TASK-ES-646 측정 모음(작업자 측정, 판정 아님). 이미 만든 결과 파일들과 원시 로그를 읽어 비교 파일과 measurement.json 을 쓴다.
// 사용: node reports/TASK-ES-646/tools/measure.cjs <기준 트리> <작업 트리> <tests-all.base.json> <tests-all.work.json>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [BASE, WORK, TB, TW] = process.argv.slice(2);
const DIR = path.join(WORK, 'reports', 'TASK-ES-646');
const rj = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const has = f => fs.existsSync(path.join(DIR, f));
const wj = (f, o) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' });
const TYPE = '작업자 측정, 판정 아님';
const git = (d, a) => cp.execFileSync('git', a, { cwd: d, encoding: 'utf8' }).trim();
const metrics = d => JSON.parse(cp.execFileSync(process.execPath, ['scripts/module-metrics.js'], { cwd: d, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));

// 1) npm test 로그 비교
const npm = {};
for (const label of ['base', 'work']) {
  const log = fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.log'), 'utf8');
  const exit = Number(fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), 'utf8').trim());
  const ls = log.split(/\r?\n/);
  npm[label] = { file: 'reports/TASK-ES-646/raw/npm-test.' + label + '.log', exit,
    checkLines: ls.filter(l => /^\s*✓/.test(l)).length, okLines: ls.filter(l => /^\s*ok\b/.test(l)).length, failMarkLines: ls.filter(l => /^\s*(✗|✘|not ok\b)/.test(l)).length,
    checkAndOkText: ls.filter(l => /^\s*(✓|ok\b)/.test(l)).join('\n'),
    summaryLines: ls.filter(l => /\d+개 통과, \d+개 실패|총 \d+개 검사 중 \d+개 통과|ALL PASS|100% COMPLETE/.test(l)).map(l => l.trim()) };
}
npm.same = { exit: npm.base.exit === npm.work.exit, checkLines: npm.base.checkLines === npm.work.checkLines, okLines: npm.base.okLines === npm.work.okLines, checkAndOkLineText: npm.base.checkAndOkText === npm.work.checkAndOkText, summaryLines: JSON.stringify(npm.base.summaryLines) === JSON.stringify(npm.work.summaryLines) };
delete npm.base.checkAndOkText; delete npm.work.checkAndOkText;
npm.tool = 'npm test (기준 트리·작업 트리 각각 전경 실행)'; npm.type = TYPE;
wj('npm-test-compare.json', npm);

// 2) 시험 파일 전부 종료 코드 비교
const tb = rj(TB), tw = rj(TW);
const files = Object.keys(tb);
const tdiff = files.filter(k => !tw[k] || tb[k].exit !== tw[k].exit || tb[k].okLines !== tw[k].okLines);
wj('tests-all-compare.json', { tool: 'tests/*.test.js 전부 + scripts/smoke-test.js · verify-integrity-gate.js · verify-all-clicks.js · test-shipyard-modular.js · module-guard.js 를 파일마다 node 로 실행(기준·작업) — reports/TASK-ES-646/tools/run-tests.cjs', type: TYPE,
  files: files.length, differing: tdiff.map(k => ({ file: k, base: tb[k], work: tw[k] || null })), differingCount: tdiff.length,
  nonZeroExit: { base: files.filter(k => tb[k].exit !== 0).length, work: files.filter(k => tw[k] && tw[k].exit !== 0).length },
  nonZeroExitFilesBase: files.filter(k => tb[k].exit !== 0), note: '기준에서도 종료 코드가 0 이 아닌 파일은 이 PR 과 무관한 기존 상태다(기준·작업이 같다).',
  perFile: Object.fromEntries(files.map(k => [k, { base: [tb[k].exit, tb[k].okLines], work: tw[k] ? [tw[k].exit, tw[k].okLines] : null }])) });

// 3) 이름 지문(대조 탐침 두 결과)
const cb = rj(path.join(DIR, 'cell-registry-compare.base.json')), cw = rj(path.join(DIR, 'cell-registry-compare.json'));
const fp = { tool: 'scripts/probes/cell-registry-compare.js --fingerprints (기준) / --fingerprints --names-from 기준 결과 (작업)', type: TYPE, counts: { base: cb.counts, work: cw.counts }, scopeLost: cw.namesFrom.scopeLost, scopeAdded: cw.namesFrom.scopeAdded };
const EXPECT = ['openProTemplateRecordModal'];
for (const k of ['scope', 'window']) {
  const fb = cb.fingerprints[k], fw = cw.fingerprints[k]; const names = Object.keys(fb);
  const diff = names.filter(n => JSON.stringify(fb[n]) !== JSON.stringify(fw[n]));
  const head = v => String(v).split(':').slice(0, 3).join(':');
  fp[k] = { names: names.length, diff: diff.length, diffNames: diff.map(n => ({ n, base: fb[n], work: fw[n] })), unexpectedDiff: diff.filter(n => !EXPECT.includes(n)), changedSameKindNameArity: diff.filter(n => EXPECT.includes(n)).every(n => head(fb[n]) === head(fw[n])) };
}
fp.expectedBodyChange = EXPECT;
fp.note = '지문은 「종류:이름:인자 수:함수 글자 해시」다. 이번에 본문 글자를 고친 함수 하나(openProTemplateRecordModal)는 해시만 달라지고 종류·이름·인자 수는 같다. 조각 함수 다섯은 IIFE 안에만 있고 통로·window 에 내놓지 않았다(새 이름 0).';
wj('name-fingerprints.json', fp);

// 4) 지표·줄 수·바뀐 파일
const mb = metrics(BASE), mw = metrics(WORK);
const baseHead = git(BASE, ['rev-parse', 'HEAD']);
const baseline = rj(path.join(WORK, 'docs', 'architecture', 'module-baseline.json'));
const lastBase = baseline.history[baseline.history.length - 1];
const guard = cp.spawnSync(process.execPath, ['scripts/module-guard.js'], { cwd: WORK, encoding: 'utf8' });
const numstat = git(WORK, ['diff', '--numstat', baseHead, '--', 'index.html']).split(/\s+/);
const tracked = git(WORK, ['diff', '--name-only', baseHead]).split('\n').filter(Boolean);
const untracked = git(WORK, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean);
const changed = [...new Set(tracked.concat(untracked))].sort();
const isVault = f => /^(court\/|\.github\/|\.githooks\/|\.agent\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|package\.json$|vercel\.json$|\.claude\/settings\.json$|scripts\/(essence-gate|verify-integrity-gate)\.js$|docs\/rules\/(OURGOAL_ABSOLUTE_INTEGRITY_RULES\.md|CONSTITUTION_VERSIONS\.md|ESSENCE_OURGOAL\.md|rules\.json|rules-control\.json|branch-protection.*\.json|archive\/))/.test(f);
const v = has('verify-inplace.json') ? rj(path.join(DIR, 'verify-inplace.json')) : null;
const ctl = has('control-group.json') ? rj(path.join(DIR, 'control-group.json')) : null;
const sc = has('scenario-local.json') ? rj(path.join(DIR, 'scenario-local.json')) : null;
const s1 = has('stage1-base-stability.json') ? rj(path.join(DIR, 'stage1-base-stability.json')) : null;
const ml = has('module-load.json') ? rj(path.join(DIR, 'module-load.json')) : null;
const csv = has('csv-download.json') ? rj(path.join(DIR, 'csv-download.json')) : null;
const meta = has('inplace-split-meta.json') ? rj(path.join(DIR, 'inplace-split-meta.json')) : null;
const scRows = j => (j ? Object.keys(j.scenarios).map(id => { const r = j.scenarios[id]; return { id, steps: r.stepCount, base: r.runs.base.passed, base2: r.runs.base2.passed, work: r.runs.work ? r.runs.work.passed : null, nonVacuousExpects: r.runs.base.nonVacuousExpects, exceptions: [r.runs.base.exceptions.length, r.runs.base2.exceptions.length, r.runs.work ? r.runs.work.exceptions.length : null], fieldsCompared: r.compare.fieldsCompared, fieldsSame: r.compare.fieldsSame, diffs: r.compare.diffs.length, ignoredBecauseBaseDiffers: r.compare.ignoredBecauseBaseDiffers.length }; }) : null);
const out = {
  task: 'TASK-ES-646', type: TYPE, measuredAt: new Date().toISOString(), base: { head: baseHead },
  summary: {
    inlineScriptLines: { before: mb.ratchet.inlineScriptLines, after: mw.ratchet.inlineScriptLines, delta: mw.ratchet.inlineScriptLines - mb.ratchet.inlineScriptLines },
    indexFunctionDecls: { before: mb.ratchet.indexFunctionDecls, after: mw.ratchet.indexFunctionDecls, delta: mw.ratchet.indexFunctionDecls - mb.ratchet.indexFunctionDecls },
    windowAssignments: { before: mb.ratchet.windowAssignments, after: mw.ratchet.windowAssignments },
    crossTabRefs: { before: mb.ratchet.crossTabRefs, after: mw.ratchet.crossTabRefs },
    oversizeJsFiles: { before: mb.ratchet.oversizeJsFiles.count, after: mw.ratchet.oversizeJsFiles.count },
    indexHtmlLines: { before: mb.info.indexHtmlLines, after: mw.info.indexHtmlLines, delta: mw.info.indexHtmlLines - mb.info.indexHtmlLines },
    indexHtmlNumstat: { added: Number(numstat[0]), deleted: Number(numstat[1]) },
  },
  split: meta ? { before: meta.before, functions: meta.after.functions, pieces: meta.pieces.map(p => ({ fn: p.fn, lines: meta.after.functions[p.fn], statements: p.statements })), ctxMembers: meta.ctx.members, ctxData: meta.ctx.data, ctxFunctions: Object.keys(meta.ctx.functions), edits: meta.edits.byKind, droppedBlankLines: meta.droppedBlankLines.length } : null,
  verify: v ? { ok: v.ok, problems: v.problems.length, tokensOld: v.tokens.old, tokensNewLinearized: v.tokens.newLinearized, tokenMismatch: v.tokens.mismatch, outsideAllowed: v.tokens.outsideAllowed, ctxPrefixOnReference: v.tokens.allowed.ctxPrefixOnReference, varDeclToCtx: v.tokens.allowed.varDeclToCtx.length, addedCodeTokens: v.tokens.allowed.addedCodeTokens, commentsSame: v.comments.same, commentsAdded: v.comments.added, prefixSitesChecked: v.prefixExpectation.sitesChecked, prefixMismatches: v.prefixExpectation.mismatches, scopeLeaks: v.scope.leaks.length, newOuter: v.scope.newOuter, lostOuter: v.scope.lostOuter, topLevelThisArguments: v.scope.topLevelThisArguments, maxLines: v.after.maxLines, saveTokensSame: v.save.tokens.same, saveCallsSameOrder: v.save.calls.sameOrder, saveCalls: v.save.calls.old, restOfFileSame: v.restOfFileSame } : null,
  controlGroup: ctl ? { mutations: ctl.mutations, mustBeCaught: ctl.mustBeCaught, caught: ctl.caught, missed: ctl.missed, cleanPasses: ctl.cleanPasses, allAsExpected: ctl.allAsExpected } : null,
  stage1: s1 ? { scenarioCount: s1.scenarioCount, allPassed: s1.allPassed, allProveBehavior: s1.allProveBehavior, baseRunsAgree: s1.baseRunsAgree, fieldsCompared: s1.totalFieldsCompared, fieldsSame: s1.totalFieldsSame, ignoredBecauseBaseDiffers: s1.totalIgnoredBecauseBaseDiffers, exceptions: s1.totalExceptions } : null,
  scenarios: sc ? { scenarioCount: sc.scenarioCount, allPassed: sc.allPassed, allProveBehavior: sc.allProveBehavior, baseRunsAgree: sc.baseRunsAgree, fieldsCompared: sc.totalFieldsCompared, fieldsSame: sc.totalFieldsSame, diffs: sc.totalDiffs, ignoredBecauseBaseDiffers: sc.totalIgnoredBecauseBaseDiffers, exceptions: sc.totalExceptions, rows: scRows(sc) } : null,
  csvDownload: csv ? { fileCreated: csv.fileCreated, sameFile: csv.sameFile, bytes: [csv.base.download && csv.base.download.bytes, csv.work.download && csv.work.download.bytes], exceptions: csv.exceptions } : null,
  moduleLoad: ml ? { regressions: ml.regressions, counts: ml.counts, wideRegressions: ml.wide.regressions, wideCounts: ml.wide.counts } : null,
  names: { scopeLost: fp.scopeLost, scopeAdded: fp.scopeAdded, scopeNames: fp.scope.names, scopeFingerprintDiff: fp.scope.diff, scopeUnexpectedDiff: fp.scope.unexpectedDiff, windowNames: fp.window.names, windowFingerprintDiff: fp.window.diff },
  npmTest: { baseExit: npm.base.exit, workExit: npm.work.exit, checkLines: [npm.base.checkLines, npm.work.checkLines], okLines: [npm.base.okLines, npm.work.okLines], same: npm.same },
  testsAll: { files: files.length, differingCount: tdiff.length, nonZeroExit: [files.filter(k => tb[k].exit !== 0).length, files.filter(k => tw[k] && tw[k].exit !== 0).length] },
  pinnedByTests: { grep: 'git grep -n "openProTemplateRecordModal\\|executeSave\\|renderRowsHtml" -- tests scripts', hits: git(WORK, ['grep', '-n', 'openProTemplateRecordModal\\|executeSave\\|renderRowsHtml', '--', 'tests', 'scripts']).split('\n').filter(Boolean), brokenTests: tdiff.length },
  baseline: { lastInlineScriptLines: lastBase.metrics.inlineScriptLines, lastIndexFunctionDecls: lastBase.metrics.indexFunctionDecls, recordedEqualsMeasured: lastBase.metrics.inlineScriptLines === mw.ratchet.inlineScriptLines && lastBase.metrics.indexFunctionDecls === mw.ratchet.indexFunctionDecls, reasonRecorded: typeof lastBase.reason === 'string' && lastBase.reason.trim().length >= 20, reason: lastBase.reason || null, historyLength: baseline.history.length },
  guard: { exitCode: guard.status },
  changedFiles: { all: changed, product: changed.filter(f => f === 'index.html' || f.startsWith('js/') || /\.(css|html)$/.test(f)), js: changed.filter(f => f.startsWith('js/')), tests: changed.filter(f => f.startsWith('tests/') || /^scripts\/(smoke-test|verify-all-clicks|test-).*\.js$/.test(f)), vault: changed.filter(isVault), generator: changed.filter(f => f.startsWith('docs/design/harness/')), scripts: changed.filter(f => f.startsWith('scripts/')), generatedMaps: changed.filter(f => /^docs\/architecture\/(cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md)$/.test(f)) },
};
wj('measurement.json', out);
console.log(JSON.stringify({ s: out.summary, split: out.split && out.split.functions, verify: out.verify && { ok: out.verify.ok, outside: out.verify.outsideAllowed, leaks: out.verify.scopeLeaks }, ctl: out.controlGroup, s1: out.stage1, sc: out.scenarios && { n: out.scenarios.scenarioCount, pass: out.scenarios.allPassed, cmp: out.scenarios.fieldsCompared, same: out.scenarios.fieldsSame, diffs: out.scenarios.diffs, ign: out.scenarios.ignoredBecauseBaseDiffers }, csv: out.csvDownload, ml: out.moduleLoad, names: out.names, npm: out.npmTest, ta: out.testsAll, bl: out.baseline.recordedEqualsMeasured, guard: out.guard, ch: { product: out.changedFiles.product, js: out.changedFiles.js, tests: out.changedFiles.tests, vault: out.changedFiles.vault, gen: out.changedFiles.generator, scripts: out.changedFiles.scripts, maps: out.changedFiles.generatedMaps } }));
