'use strict';
// #TASK-ES-672 측정 모음(작업자 측정, 판정 아님). 이미 만든 결과 파일들과 원시 로그를 읽어 비교 파일과 measurement.json 을 쓴다.
// 사용: node reports/TASK-ES-672/tools/measure.cjs <기준 트리> <작업 트리> <tests-all.base.json> <tests-all.work.json>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [BASE, WORK, TB, TW] = process.argv.slice(2);
const DIR = path.join(WORK, 'reports', 'TASK-ES-672');
const rj = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const R = f => rj(path.join(DIR, f));
const has = f => fs.existsSync(path.join(DIR, f));
const wj = (f, o) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' });
const TYPE = '작업자 측정, 판정 아님';
const git = (d, a) => cp.execFileSync('git', a, { cwd: d, encoding: 'utf8' }).trim();
const metrics = d => JSON.parse(cp.execFileSync(process.execPath, ['scripts/module-metrics.js'], { cwd: d, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
const lineCount = f => { const s = fs.readFileSync(f, 'utf8'); return s.split('\n').length - (s.endsWith('\n') ? 1 : 0); };

// 1) npm test 로그 비교
const npm = {};
for (const label of ['base', 'work']) {
  const log = fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.log'), 'utf8');
  const exit = Number(fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), 'utf8').trim());
  const ls = log.split(/\r?\n/);
  npm[label] = { file: 'reports/TASK-ES-672/raw/npm-test.' + label + '.log', exit,
    checkLines: ls.filter(l => /^\s*✓/.test(l)).length, okLines: ls.filter(l => /^\s*ok\b/.test(l)).length, failMarkLines: ls.filter(l => /^\s*(✗|✘|not ok\b)/.test(l)).length,
    checkAndOkText: ls.filter(l => /^\s*(✓|ok\b)/.test(l)).join('\n'),
    summaryLines: ls.filter(l => /\d+개 통과, \d+개 실패|총 \d+개 검사 중 \d+개 통과|ALL PASS|100% COMPLETE/.test(l)).map(l => l.trim()) };
}
npm.same = { exit: npm.base.exit === npm.work.exit, checkLines: npm.base.checkLines === npm.work.checkLines, okLines: npm.base.okLines === npm.work.okLines, checkAndOkLineText: npm.base.checkAndOkText === npm.work.checkAndOkText, summaryLines: JSON.stringify(npm.base.summaryLines) === JSON.stringify(npm.work.summaryLines) };
// 글자가 갈린 검사 줄을 그대로 싣는다. 세포 파일 수를 적는 줄(「Checked N modular files」)은 새 세포 파일만큼 N 이 달라진다 — 그 줄의 숫자만 가리고 다시 맞댄 값도 싣는다.
{
  const bl = npm.base.checkAndOkText.split('\n'), wl = npm.work.checkAndOkText.split('\n');
  const diffs = []; for (let i = 0; i < Math.max(bl.length, wl.length); i++) if (bl[i] !== wl[i]) diffs.push({ base: (bl[i] || '').trim(), work: (wl[i] || '').trim() });
  const mask = t => t.replace(/Checked \d+ modular files/g, 'Checked «N» modular files');
  const cnt = t => { const m = /Checked (\d+) modular files/.exec(t); return m ? Number(m[1]) : null; };
  npm.same.textDiffLines = diffs.slice(0, 20); npm.same.textDiffLineCount = diffs.length;
  npm.same.checkAndOkLineTextExceptModularFileCount = mask(npm.base.checkAndOkText) === mask(npm.work.checkAndOkText);
  npm.modularFileCount = { base: cnt(npm.base.checkAndOkText), work: cnt(npm.work.checkAndOkText) };
  npm.modularFileCount.delta = npm.modularFileCount.base === null || npm.modularFileCount.work === null ? null : npm.modularFileCount.work - npm.modularFileCount.base;
}
delete npm.base.checkAndOkText; delete npm.work.checkAndOkText;
npm.tool = 'npm test (기준 트리·작업 트리 각각 전경 실행)'; npm.type = TYPE;
wj('npm-test-compare.json', npm);

// 2) 시험 파일 전부 종료 코드 비교
const tb = rj(TB), tw = rj(TW);
const files = Object.keys(tb);
const tdiff = files.filter(k => !tw[k] || tb[k].exit !== tw[k].exit || tb[k].okLines !== tw[k].okLines);
wj('tests-all-compare.json', { tool: 'tests/*.test.js 전부 + scripts/smoke-test.js · verify-integrity-gate.js · verify-all-clicks.js · test-shipyard-modular.js · module-guard.js 를 파일마다 node 로 실행(기준·작업) — reports/TASK-ES-672/tools/run-tests.cjs', type: TYPE,
  files: files.length, differing: tdiff.map(k => ({ file: k, base: tb[k], work: tw[k] || null })), differingCount: tdiff.length,
  nonZeroExit: { base: files.filter(k => tb[k].exit !== 0).length, work: files.filter(k => tw[k] && tw[k].exit !== 0).length },
  nonZeroExitFilesBase: files.filter(k => tb[k].exit !== 0), note: '기준에서도 종료 코드가 0 이 아닌 파일은 이 PR 과 무관한 기존 상태다(기준·작업이 같다).',
  perFile: Object.fromEntries(files.map(k => [k, { base: [tb[k].exit, tb[k].okLines], work: tw[k] ? [tw[k].exit, tw[k].okLines] : null }])) });

// 3) 지표·줄 수·바뀐 파일
const mb = metrics(BASE), mw = metrics(WORK);
const baseHead = git(BASE, ['rev-parse', 'HEAD']);
const meta = R('gen-inline-hard-meta.json'), verify = R('verify-inline-hard.json'), proof = R('proof.json');
const ml = R('module-load.json'), fp = R('name-fingerprints.json'), pf = R('prefix-only-check.json'), ap = R('accessor-probe.json'), ew = R('expose-window.json');
const sc = has('scenario-local.json') ? R('scenario-local.json') : null;
const csv = has('csv-download.json') ? R('csv-download.json') : null;
const pn = has('photo-notion-probe.json') ? R('photo-notion-probe.json') : null;
const oc = has('order-check.json') ? R('order-check.json') : null;
const baseline = rj(path.join(WORK, 'docs', 'architecture', 'module-baseline.json'));
const lastBase = baseline.history[baseline.history.length - 1];
const guard = cp.spawnSync(process.execPath, ['scripts/module-guard.js'], { cwd: WORK, encoding: 'utf8' });
const numstat = git(WORK, ['diff', '--numstat', baseHead, '--', 'index.html']).split(/\s+/);
const tracked = git(WORK, ['diff', '--name-only', baseHead]).split('\n').filter(Boolean);
const untracked = git(WORK, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean);
const changed = [...new Set(tracked.concat(untracked))].sort();
const isVault = f => /^(court\/|\.github\/|\.githooks\/|\.agent\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|package\.json$|vercel\.json$|\.claude\/settings\.json$|scripts\/(essence-gate|verify-integrity-gate)\.js$|docs\/rules\/(OURGOAL_ABSOLUTE_INTEGRITY_RULES\.md|CONSTITUTION_VERSIONS\.md|ESSENCE_OURGOAL\.md|rules\.json|rules-control\.json|branch-protection.*\.json|archive\/))/.test(f);
const cellFiles = proof.cells.map(c => c.file);
const scRows = j => (j ? Object.keys(j.scenarios).map(id => { const r = j.scenarios[id]; return { id, steps: r.stepCount, base: r.runs.base.passed, base2: r.runs.base2.passed, work: r.runs.work ? r.runs.work.passed : null, nonVacuousExpects: r.runs.base.nonVacuousExpects, exceptions: [r.runs.base.exceptions.length, r.runs.base2.exceptions.length, r.runs.work ? r.runs.work.exceptions.length : null], fieldsCompared: r.compare.fieldsCompared, fieldsSame: r.compare.fieldsSame, diffs: r.compare.diffs.length, ignoredBecauseBaseDiffers: r.compare.ignoredBecauseBaseDiffers.length }; }) : null);
const out = {
  task: 'TASK-ES-672', type: TYPE, measuredAt: new Date().toISOString(), base: { head: baseHead },
  summary: {
    inlineScriptLines: { before: mb.ratchet.inlineScriptLines, after: mw.ratchet.inlineScriptLines, delta: mw.ratchet.inlineScriptLines - mb.ratchet.inlineScriptLines },
    indexFunctionDecls: { before: mb.ratchet.indexFunctionDecls, after: mw.ratchet.indexFunctionDecls, delta: mw.ratchet.indexFunctionDecls - mb.ratchet.indexFunctionDecls },
    windowAssignments: { before: mb.ratchet.windowAssignments, after: mw.ratchet.windowAssignments },
    crossTabRefs: { before: mb.ratchet.crossTabRefs, after: mw.ratchet.crossTabRefs },
    oversizeJsFiles: { before: mb.ratchet.oversizeJsFiles.count, after: mw.ratchet.oversizeJsFiles.count },
    indexHtmlLines: { before: mb.info.indexHtmlLines, after: mw.info.indexHtmlLines, delta: mw.info.indexHtmlLines - mb.info.indexHtmlLines },
    indexHtmlNumstat: { added: Number(numstat[0]), deleted: Number(numstat[1]) },
  },
  generator: { moves: meta.plan.filter(p => p.action === 'move').length, wraps: meta.plan.filter(p => p.action === 'wrap').length, keeps: meta.plan.filter(p => p.action === 'keep').length,
    moved: meta.plan.filter(p => p.action === 'move').map(p => ({ cell: p.cell, name: p.names[0], segment: p.segment, lines: p.segment[1] - p.segment[0] + 1 })),
    imports: meta.imports.length, importNames: meta.imports.map(i => i.n), newExposeGetters: meta.exposed.length, newExposeGetterNames: meta.exposed, bridged: meta.bridged.length, edits: meta.edits, headLinesAdded: 1 + meta.imports.length + (meta.exposed.length ? meta.exposed.length + 2 : 0) },
  newFiles: Object.fromEntries(cellFiles.map(f => [f, { lines: lineCount(path.join(WORK, f)), under800: lineCount(path.join(WORK, f)) <= 800 }])),
  newFilesMaxLines: Math.max(...cellFiles.map(f => lineCount(path.join(WORK, f)))),
  verify: { ok: verify.ok, notExposed: verify.notExposed, noSetter: verify.noSetter, thisArgs: verify.thisArgs, callsOk: verify.callsOk, importBeforeKit: verify.importBeforeKit, lastGetterNoSetter: verify.lastGetterNoSetter, restSame: verify.restSame, listeners: verify.listeners },
  prefixOnly: { ok: pf.ok, lines: pf.totals.lines, identicalLines: pf.totals.identicalLines, prefixOnlyLines: pf.totals.prefixOnlyLines, otherDiffLines: pf.totals.otherDiffLines, strippedPrefixes: pf.totals.strippedPrefixes, generatorEdits: pf.generatorEdits, marketLines: pf.marketLines.length, marketLinesAllSame: pf.marketLinesAllSame, moneyWordsOutsideMovedLines: pf.moneyWordsOutsideMovedLines.length },
  accessor: { ok: ap.ok, missing: ap.dyn && ap.dyn.missing, undef: ap.dyn && ap.dyn.undef, byOwner: ap.dyn && ap.dyn.byOwner, organOverlap: ap.static && ap.static.newGetterOverlap, readOrgan: ap.static && ap.static.readOrgan },
  exposeWindow: { names: ew.names, definedBeforeExpose: ew.definedBeforeExpose, definedAfterExpose: ew.definedAfterExpose.length, withExecutingStatementsBetween: ew.definedAfterExpose.filter(x => x.executingStatementsBetween.length).map(x => x.name) },
  order: oc,
  moduleLoad: { regressions: ml.regressions, counts: ml.counts, wideRegressions: ml.wide.regressions, newFilesLoadOneOk: Object.values(ml.newFilesLoadOne).every(r => r && r.ok === true) },
  names: { scopeLost: fp.scopeLost, scopeAdded: fp.scopeAdded, scopeNames: fp.scope.names, scopeFingerprintDiff: fp.scope.diff, scopeUnexpectedDiff: fp.scope.unexpectedDiff, windowNames: fp.window.names, windowFingerprintDiff: fp.window.diff, windowUnexpectedDiff: fp.window.unexpectedDiff },
  scenarios: sc ? { scenarioCount: sc.scenarioCount, allPassed: sc.allPassed, allProveBehavior: sc.allProveBehavior, baseRunsAgree: sc.baseRunsAgree, fieldsCompared: sc.totalFieldsCompared, fieldsSame: sc.totalFieldsSame, diffs: sc.totalDiffs, ignoredBecauseBaseDiffers: sc.totalIgnoredBecauseBaseDiffers, exceptions: sc.totalExceptions, rows: scRows(sc) } : null,
  csvDownload: csv ? { fileCreated: csv.fileCreated, sameFile: csv.sameFile, exceptions: csv.exceptions } : null,
  photoNotion: pn ? { allSame: pn.allSame, errors: pn.errors, photoSame: pn.results['P1-photo-attach'].same, notionSame: pn.results['P2-notion-autopush'].same, notionRequests: (pn.results['P2-notion-autopush'].head.notionRequests || []).length } : null,
  npmTest: { baseExit: npm.base.exit, workExit: npm.work.exit, checkLines: [npm.base.checkLines, npm.work.checkLines], okLines: [npm.base.okLines, npm.work.okLines], same: npm.same },
  testsAll: { files: files.length, differingCount: tdiff.length, nonZeroExit: [files.filter(k => tb[k].exit !== 0).length, files.filter(k => tw[k] && tw[k].exit !== 0).length] },
  baseline: { lastInlineScriptLines: lastBase.metrics.inlineScriptLines, lastIndexFunctionDecls: lastBase.metrics.indexFunctionDecls, recordedEqualsMeasured: lastBase.metrics.inlineScriptLines === mw.ratchet.inlineScriptLines && lastBase.metrics.indexFunctionDecls === mw.ratchet.indexFunctionDecls, historyLength: baseline.history.length },
  guard: { exitCode: guard.status },
  changedFiles: { all: changed, product: changed.filter(f => f === 'index.html' || f.startsWith('js/') || /\.(css|html)$/.test(f)), jsOutsideCells: changed.filter(f => f.startsWith('js/') && !cellFiles.includes(f)), tests: changed.filter(f => f.startsWith('tests/') || /^scripts\/(smoke-test|verify-all-clicks|test-).*\.js$/.test(f)), vault: changed.filter(isVault), generator: changed.filter(f => f.startsWith('docs/design/harness/')), scripts: changed.filter(f => f.startsWith('scripts/')), generatedMaps: changed.filter(f => /^docs\/architecture\/(cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md)$/.test(f)) },
};
wj('measurement.json', out);
console.log(JSON.stringify({ s: out.summary, files: out.newFiles, verify: out.verify.ok, prefix: out.prefixOnly, order: out.order && out.order.ok, ml: out.moduleLoad, names: out.names, sc: out.scenarios && { n: out.scenarios.scenarioCount, pass: out.scenarios.allPassed, cmp: out.scenarios.fieldsCompared, same: out.scenarios.fieldsSame, diffs: out.scenarios.diffs, ign: out.scenarios.ignoredBecauseBaseDiffers, ex: out.scenarios.exceptions }, csv: out.csvDownload, pn: out.photoNotion, npm: out.npmTest, ta: out.testsAll, bl: out.baseline.recordedEqualsMeasured, guard: out.guard, ch: { product: out.changedFiles.product, jsOut: out.changedFiles.jsOutsideCells, tests: out.changedFiles.tests, vault: out.changedFiles.vault, gen: out.changedFiles.generator, maps: out.changedFiles.generatedMaps } }));
