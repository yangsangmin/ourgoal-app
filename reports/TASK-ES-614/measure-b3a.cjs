#!/usr/bin/env node
'use strict';
// B3a 측정 기록 생성기(작업자 측정, 판정 아님). 값은 전부 스크립트 산출·결과 파일에서 읽는다 — 손으로 옮긴 수치 0.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-614/measure-b3a.cjs <작업 트리> <기준 트리(origin/main 임시 worktree)> <모의 철거 사본>
//   module-load.json · npm-test-compare.json · unwire-plan.json · measurement.json 을 이 폴더에 쓴다.
//   먼저 있어야 하는 것: cell-registry-compare{,.base,.mock,.mock-without-commit}.json · mock-unwire-{all,plan-run}.json · pinned-names.json · overlap-names.json ·
//                      tests-{base,mock,mock-all}.json · scenario-{local,mock}.json · provide-plan.json · raw/npm-test.{base,work}.{log,exit}
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const BASE = process.argv[3] ? path.resolve(process.argv[3]) : null, MOCK = process.argv[4] ? path.resolve(process.argv[4]) : null;
if (!BASE || !MOCK) { console.error('사용: node measure-b3a.cjs <작업 트리> <기준 트리> <모의 철거 사본>'); process.exit(2); }
const REL = path.relative(ROOT, __dirname).replace(/\\/g, '/');
const rj = f => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
const commands = [];
function run(id, argv, cwd) {
  const t0 = new Date().toISOString();
  const r = cp.spawnSync(argv[0], argv.slice(1), { cwd: cwd || ROOT, encoding: 'utf8', env: process.env, shell: false, maxBuffer: 64 * 1024 * 1024 });
  commands.push({ id, argv, cwd: cwd || ROOT, startedAt: t0, endedAt: new Date().toISOString(), exitCode: r.status, stdoutHead: (r.stdout || '').slice(0, 200), stderrHead: (r.stderr || '').slice(0, 200) });
  return r;
}
const git = (args, cwd) => run('git ' + args.slice(0, 2).join(' '), ['git'].concat(args), cwd);
const L = s => s.trim().split('\n').map(x => x.trim()).filter(Boolean);
const lf = s => s.replace(/\r\n/g, '\n');

// 1. 바뀐 파일(기준 트리 HEAD 대비 작업 트리)
const baseHead = git(['rev-parse', 'HEAD'], BASE).stdout.trim(), workHead = git(['rev-parse', 'HEAD']).stdout.trim();
const numstat = L(git(['diff', '--numstat', baseHead, '--']).stdout).map(l => { const [a, d, f] = l.split('\t'); return { file: f, insertions: Number(a), deletions: Number(d) }; });
const untracked = L(git(['ls-files', '--others', '--exclude-standard']).stdout);
const all = numstat.map(x => x.file).concat(untracked);
const jsChanged = numstat.filter(x => /^js\/.*\.js$/.test(x.file));
const indexRow = numstat.find(x => x.file === 'index.html') || { insertions: 0, deletions: 0 };
const vaultRe = /^(court\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|\.agent\/rules\/|docs\/rules\/(OURGOAL_ABSOLUTE_INTEGRITY_RULES\.md|CONSTITUTION_VERSIONS\.md|ESSENCE_OURGOAL\.md|rules\.json|rules-control\.json|branch-protection.*\.json|archive\/)|\.github\/|\.githooks\/|scripts\/essence-gate\.js$|scripts\/install-essence-gate\.js$|scripts\/verify-integrity-gate\.js$|scripts\/hook-smoke-on-index\.js$|\.vercelignore$|package\.json$|vercel\.json$|\.gitattributes$|\.claude\/settings\.json$|docs\/directives\/)/;

// 2. 세포 파일은 등록 블록 안에서만 바뀌었는가(B2 블록 표지 사이) — 블록을 걷어 낸 글자가 기준과 같다
const MARK_BEGIN = '/* ==== [세포 등록 시작 · gen-cell-provide.js]', MARK_END = '/* ==== [세포 등록 끝] ==== */';
const head = s => { const i = s.indexOf(MARK_BEGIN); return i < 0 ? null : s.slice(0, i); };
const blockOnly = { checked: 0, same: 0, differ: [], notCellBlockFiles: [] };
for (const x of jsChanged) {
  if (x.file === 'js/core/cell-registry.js') { blockOnly.notCellBlockFiles.push(x.file); continue; }
  let b; try { b = lf(fs.readFileSync(path.join(BASE, x.file), 'utf8')); } catch (e) { blockOnly.notCellBlockFiles.push(x.file + ' (새 파일)'); continue; }
  const w = lf(fs.readFileSync(path.join(ROOT, x.file), 'utf8'));
  blockOnly.checked++;
  const hw = head(w), hb = head(b);
  if (hw !== null && hb !== null && hw === hb && w.slice(w.indexOf(MARK_END)).trim() === MARK_END) blockOnly.same++; else blockOnly.differ.push(x.file);
}
const newJs = all.filter(f => /^js\/.*\.js$/.test(f) && !fs.existsSync(path.join(BASE, f)));

// 3. 줄 수 · 가드 · 인라인 줄 수
const mm = require(path.join(ROOT, 'scripts', 'module-metrics.js'));
const metrics = mm.measure(ROOT), baseMetrics = require(path.join(BASE, 'scripts', 'module-metrics.js')).measure(BASE), mockMetrics = mm.measure(MOCK);
const lineRows = jsChanged.map(x => x.file).concat(newJs).filter((f, i, a) => a.indexOf(f) === i).map(f => ({ file: f, lines: mm.countLines(fs.readFileSync(path.join(ROOT, f), 'utf8')) })).sort((a, b) => b.lines - a.lines);
const guard = run('module-guard', [process.execPath, 'scripts/module-guard.js', '--quiet']);
const specsCheck = run('module-specs --check', [process.execPath, 'scripts/module-specs.js', '--check']);
const genIdem = run('gen-cell-provide (계획만)', [process.execPath, 'docs/design/harness/module-split/gen-cell-provide.js', '.']);
let genIdemOut = null; try { genIdemOut = JSON.parse(genIdem.stdout.trim().split('\n').pop()); } catch (e) { genIdemOut = null; }

// 4. 모듈 로드: 법정 탐침과 같은 비교 + 바뀐·새 js 파일 단독 로드(기준 대 작업, 기준 대 모의 철거 사본)
const ml = require(path.join(ROOT, 'court', 'probes', 'module-load.js'));
const probeBase = ml.probeModules(BASE);
const loadSet = (TREE) => {
  const cmp = ml.compare(probeBase, ml.probeModules(TREE), fs.readFileSync(path.join(TREE, 'index.html'), 'utf8'));
  const ch = { files: 0, baseOk: 0, treeOk: 0, regressions: [], globalsDiffer: [], newFiles: [] };
  for (const f of lineRows.map(r => r.file)) {
    const w = ml.loadOne(path.join(TREE, f));
    if (!fs.existsSync(path.join(BASE, f))) { ch.newFiles.push({ file: f, ok: w.ok, globals: w.globals || [], error: w.error || null }); continue; }
    const b = ml.loadOne(path.join(BASE, f));
    ch.files++; if (b.ok) ch.baseOk++; if (w.ok) ch.treeOk++;
    if (b.ok && !w.ok) ch.regressions.push({ file: f, error: w.error });
    else if (b.ok && w.ok && JSON.stringify((b.globals || []).slice().sort()) !== JSON.stringify((w.globals || []).slice().sort())) ch.globalsDiffer.push({ file: f, base: b.globals, tree: w.globals });
  }
  return { regressions: cmp.regressions.concat(ch.regressions.map(r => ({ file: r.file, kind: 'LOAD_THROWS', detail: r.error }))), insufficient: cmp.insufficient, counts: cmp.counts, changedFiles: ch };
};
const moduleLoad = { tool: 'court/probes/module-load.js (읽기 전용 — compare(probeModules(기준), probeModules(트리)) 는 CLI 와 같은 셈, loadOne 은 바뀐·새 js 파일마다 단독 로드)', type: '작업자 측정, 판정 아님', base: baseHead, measuredAt: new Date().toISOString(), work: loadSet(ROOT), mock: loadSet(MOCK) };
fs.writeFileSync(path.join(__dirname, 'module-load.json'), JSON.stringify(moduleLoad, null, 1) + '\n', 'utf8');

// 5. npm test 로그 비교(전경으로 끝까지 돌린 원시 로그 두 개)
function readLog(label) {
  const txt = lf(fs.readFileSync(path.join(__dirname, 'raw', 'npm-test.' + label + '.log'), 'utf8')), T = txt.split('\n');
  const exitTxt = fs.readFileSync(path.join(__dirname, 'raw', 'npm-test.' + label + '.exit'), 'utf8').trim();
  const norm = s => s.trim().replace(/\d+(\.\d+)?\s?ms\b/g, 'Nms').replace(/[A-Za-z]:[\\/][^\s"')]+/g, '<path>');
  const ok = T.filter(l => /^\s*✓ /.test(l)).map(norm), okDot = T.filter(l => /^\s*ok · /.test(l)).map(norm), fail = T.filter(l => /^\s*(✗|✖|not ok|FAIL\b)/.test(l)).map(norm);
  const summary = T.filter(l => /(\d+개 통과|검증 결과|ALL PASS|COMPLETE|^\s*\[\d+\/\d+\]|\[검증 \d+\/\d+\])/.test(l)).map(norm);
  return { file: REL + '/raw/npm-test.' + label + '.log', totalLines: T.length, ok: ok.length, okDot: okDot.length, fail: fail.length, exit: Number((/exit=(\d+)/.exec(exitTxt) || [])[1]), summaryTokens: summary, _checks: ok.concat(okDot) };
}
const nb = readLog('base'), nw = readLog('work');
const multiset = a => { const m = {}; a.forEach(x => { m[x] = (m[x] || 0) + 1; }); return m; };
const mb = multiset(nb._checks), mw = multiset(nw._checks);
const onlyBase = Object.keys(mb).filter(k => (mw[k] || 0) < mb[k]), onlyWork = Object.keys(mw).filter(k => (mb[k] || 0) < mw[k]);
delete nb._checks; delete nw._checks;
const npmCmp = { tool: REL + '/measure-b3a.cjs (작업자 측정)', base: nb, work: nw, sameSummaryTokens: JSON.stringify(nb.summaryTokens) === JSON.stringify(nw.summaryTokens), sameOkCount: nb.ok === nw.ok && nb.okDot === nw.okDot, sameExit: nb.exit === nw.exit, onlyBase, onlyWork };
npmCmp.same = npmCmp.sameSummaryTokens && npmCmp.sameOkCount && npmCmp.sameExit && nb.exit === 0 && !onlyBase.length && !onlyWork.length && nb.fail === 0 && nw.fail === 0;
fs.writeFileSync(path.join(__dirname, 'npm-test-compare.json'), JSON.stringify(npmCmp, null, 1) + '\n', 'utf8');

// 6. 결과 파일들
const cW = rj('cell-registry-compare.json'), cB = rj('cell-registry-compare.base.json'), cM = rj('cell-registry-compare.mock.json'), cN = rj('cell-registry-compare.mock-without-commit.json');
const mAll = rj('mock-unwire-all.json'), mPlan = rj('mock-unwire-plan-run.json'), pinned = rj('pinned-names.json'), overlap = rj('overlap-names.json');
const tB = rj('tests-base.json'), tM = rj('tests-mock.json'), tA = rj('tests-mock-all.json'), scL = rj('scenario-local.json'), scM = rj('scenario-mock.json'), planJ = rj('provide-plan.json');
const fpDiff = (x, y) => ['scope', 'window'].reduce((a, k) => { a[k] = Object.keys(x.fingerprints[k]).filter(n => x.fingerprints[k][n] !== y.fingerprints[k][n]); return a; }, {});
const fp = { baseVsWork: fpDiff(cB, cW), baseVsMock: fpDiff(cB, cM), workVsMock: fpDiff(cW, cM) };
const failSet = t => new Set(t.testFiles.filter(x => x.exit !== 0).map(x => x.file));
const fB = failSet(tB), fM = failSet(tM), fA = failSet(tA);
const scRows = j => Object.keys(j.scenarios).map(id => ({ id, basePassed: j.scenarios[id].runs.base.passed, otherPassed: j.scenarios[id].runs.work.passed, baseExceptions: (j.scenarios[id].runs.base.exceptions || []).length, otherExceptions: (j.scenarios[id].runs.work.exceptions || []).length, nonVacuousExpects: j.scenarios[id].runs.work.nonVacuousExpects }));
const regSet = {}; cW.registeredNames.forEach(n => { regSet[n] = true; });

// 7. 철거 계획(B3~B8 입력): 제외 목록을 적용한 모의 철거에서 실제로 돈 실행을 그대로 싣는다
const unwirePlan = {
  schema: 'ourgoal.task-es-614.unwire-plan/1', type: '작업자 측정에서 나온 계획 — 판정 아님. 실제 철거는 B3 부터(이 PR 의 실제 철거 0)',
  basis: { worktreeHead: workHead, base: baseHead, generator: mPlan.generator, note: '저장소 밖 사본에서 아래 실행을 위에서부터 차례로 돌린 결과다. 줄 번호가 아니라 이름으로 지정하므로 앞 실행이 병합된 뒤의 index.html 에 그대로 쓸 수 있다. 예상 삭제 줄 수는 이 순서로 돌렸을 때의 값이다.' },
  howToUse: '철거 PR 하나 = 실행 하나(법정은 PR 하나에 생성기 한 번만 돌린다). 설정: { task, slot:"HO", mode:"unwire", cells:[{file:"js/core/cell-registry.js"}], unwire:{ kitVar, imports, exposeGetters:true, windowAssign:true, names } }',
  totals: { runs: mPlan.passes.filter(p => p.names.length).length, names: mPlan.passes.reduce((a, p) => a + p.names.length, 0), expectedDeletedLines: mPlan.deletedLinesTotal, htmlLines: [mPlan.before.htmlLines, mPlan.after.htmlLines], inlineScriptLines: [metrics.ratchet.inlineScriptLines, mockMetrics.ratchet.inlineScriptLines] },
  runs: mPlan.passes.filter(p => p.names.length).map((p, i) => ({ order: i + 1, kitVar: p.kitVar, label: p.label, flags: p.flags, namesCount: p.names.length, expectedDeletedLines: p.htmlLines[0] - p.htmlLines[1], removed: p.removed, names: p.names })),
  byKit: mPlan.byKit,
  excludedBecauseTestsPinWiringText: { count: pinned.pinnedCount, names: Object.keys(pinned.pinned).sort(), source: REL + '/pinned-names.json', note: '시험 소스에 배선 글자(window.N = … 등)가 있는 이름 — 넓게 잡은 목록이다. 시험은 고치지 않았다.' },
  stoppedByGenerator: mPlan.passes.flatMap(p => p.dropped.map(d => Object.assign({ kitVar: p.kitVar, run: p.label }, d))),
  notRunnableKitVars: mPlan.notRunnableKitVars,
  registeredStillWired: mPlan.registeredStillWired, importOnlyWithRefs: mPlan.importOnlyWithRefs,
};
fs.writeFileSync(path.join(__dirname, 'unwire-plan.json'), JSON.stringify(unwirePlan, null, 1) + '\n', 'utf8');

const out = {
  schema: 'ourgoal.task-es-614.measurement/1', taskId: 'TASK-ES-614', type: '작업자 측정, 판정 아님 — 판정은 GitHub 법정(node court/chat.js <PR>)만 낸다', measuredAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, arch: process.arch, gitAutocrlf: git(['config', 'core.autocrlf']).stdout.trim() || null },
  sourceCommit: { baseTreeHead: baseHead, worktreeHead: workHead, note: '기준 = origin/main 임시 git worktree(저장소 밖). 작업 = 이 트리. 모의 철거 사본 = 기준 worktree 를 하나 더 만들어 작업 트리의 바뀐 파일을 덮고 index.html 만 생성기 unwire 로 철거한 것(커밋하지 않는다)' },
  summary: {
    changed: { files: all.length, jsFiles: jsChanged.length, newJsFiles: newJs, indexHtml: { insertions: indexRow.insertions, deletions: indexRow.deletions, netLineGrowth: indexRow.insertions - indexRow.deletions },
      testsChanged: all.filter(f => /^tests\//.test(f)), vaultChanged: all.filter(f => vaultRe.test(f)), generatorInlineHardChanged: all.filter(f => /gen-inline-hard\.js$/.test(f)),
      generatedMapsChanged: all.filter(f => /^docs\/architecture\/(module-baseline\.json|cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md)$/.test(f)) },
    cellBlocksOnly: { checked: blockOnly.checked, same: blockOnly.same, differ: blockOnly.differ, other: blockOnly.notCellBlockFiles, allSame: blockOnly.checked > 0 && blockOnly.same === blockOnly.checked,
      note: '바뀐 세포 파일마다 등록 블록 앞 글자가 기준과 같고 블록 뒤에 글자가 없다(블록 안에서만 바뀜 — windowOnly 칸 추가). js/core/cell-registry.js 와 새 파일은 따로 센다' },
    provideGenerator: { exitCode: genIdem.status, planOnlyRun: genIdemOut, idempotent: !!genIdemOut && genIdemOut.changed === 0, note: '--write 없이 다시 돌려 「바뀔 파일 0」인지(멱등)' },
    lines: { maxAfter: lineRows[0] || null, over800: lineRows.filter(r => r.lines > 800) },
    ratchet: { inlineScriptLines: [baseMetrics.ratchet.inlineScriptLines, metrics.ratchet.inlineScriptLines], inlineScriptLinesSame: metrics.ratchet.inlineScriptLines === baseMetrics.ratchet.inlineScriptLines, indexFunctionDecls: [baseMetrics.ratchet.indexFunctionDecls, metrics.ratchet.indexFunctionDecls],
      windowAssignments: [baseMetrics.ratchet.windowAssignments, metrics.ratchet.windowAssignments], oversizeJsFiles: [baseMetrics.ratchet.oversizeJsFiles.count, metrics.ratchet.oversizeJsFiles.count], crossTabRefs: [baseMetrics.ratchet.crossTabRefs, metrics.ratchet.crossTabRefs], source: 'scripts/module-metrics.js measure().ratchet — [기준, 작업]' },
    guard: { exitCode: guard.status, specsCheckExitCode: specsCheck.status },
    newGlobals: { changedFilesGlobalsDiffer: moduleLoad.work.changedFiles.globalsDiffer.length, newFiles: moduleLoad.work.changedFiles.newFiles, note: '바뀐 js 파일 단독 로드의 전역 목록이 기준과 다른 파일 수(0 이면 새 전역 0) · 새 파일이 만드는 전역' },
    moduleLoad: { work: { regressions: moduleLoad.work.regressions.length, insufficient: moduleLoad.work.insufficient.length, changedFiles: moduleLoad.work.changedFiles.files, changedOkBase: moduleLoad.work.changedFiles.baseOk, changedOkWork: moduleLoad.work.changedFiles.treeOk },
      mock: { regressions: moduleLoad.mock.regressions.length, insufficient: moduleLoad.mock.insufficient.length }, insufficientNote: moduleLoad.work.insufficient.map(i => i.file + ': ' + i.note) },
    own: { counts: cW.counts, modes: cW.modes, commit: { scope: cW.report.commit.scope, window: cW.report.commit.window, kept: cW.report.commit.kept, scopeBefore: cW.report.commit.scopeBefore.length, windowBefore: { undefined: cW.report.commit.windowBefore.undefined, same: cW.report.commit.windowBefore.same, different: cW.report.commit.windowBefore.different.map(x => x.name) } },
      registeredEqualsPlan: planJ.registered.every(r => regSet[r.name]) && cW.registeredNames.length === planJ.registered.length, exceptions: cW.guestBoot.exceptions.length, consoleErrors: cW.guestBoot.consoleErrors.length,
      baseCounts: cB.counts, nonVacuous: cW.counts.own > 0 && cW.counts.checked > 0 },
    fingerprints: { names: { scope: Object.keys(cB.fingerprints.scope).length, window: Object.keys(cB.fingerprints.window).length }, baseVsWork: { scope: fp.baseVsWork.scope.length, window: fp.baseVsWork.window.length }, baseVsMock: { scope: fp.baseVsMock.scope.length, window: fp.baseVsMock.window.length }, workVsMock: { scope: fp.workVsMock.scope.length, window: fp.workVsMock.window.length },
      differing: fp, note: '이름마다 통로 값·window 값의 지문(함수 = 이름·인자 수·글자 해시, 문자열 = 길이·해시, 그 밖 = 종류)을 세 트리에서 재어 맞댄 차이 수' },
    overlap: { windowNames: overlap.windowNames, overlapCount: overlap.overlapCount, overlapRegistered: overlap.overlapRegistered, differentValueAtCommit: overlap.differentValueAtCommit, assignedAfterCommit: overlap.assignedAfterCommit, tagsBetweenCommitAndIife: overlap.order.tagsBetweenCommitAndIife, deferOrAsync: overlap.order.deferOrAsync, inlineAfterIife: overlap.order.inlineAfterIife, allFinalValuesSame: overlap.allFinalValuesSame },
    mockUnwire: {
      all: { deletedLines: mAll.deletedLinesTotal, names: mAll.passes.reduce((a, p) => a + p.names.length, 0), runs: mAll.passes.length, byKit: mAll.byKit, npmTestPath: tA.summary.scripts, testFilesFailedNotInBase: [...fA].filter(f => !fB.has(f)) },
      plan: { excluded: pinned.pinnedCount, deletedLines: mPlan.deletedLinesTotal, names: mPlan.passes.reduce((a, p) => a + p.names.length, 0), runs: mPlan.passes.filter(p => p.names.length).length, byKit: mPlan.byKit, htmlLines: [mPlan.before.htmlLines, mPlan.after.htmlLines],
        inlineScriptLines: [metrics.ratchet.inlineScriptLines, mockMetrics.ratchet.inlineScriptLines], windowNamesLeftInIife: cM.namesFrom.windowNamesInThisIndexHtml,
        compare: Object.assign({}, cM.counts, { scopeLost: cM.namesFrom.scopeLost.length, scopeAdded: cM.namesFrom.scopeAdded.length, exceptions: cM.guestBoot.exceptions.length, consoleErrors: cM.guestBoot.consoleErrors.length, namesFixedFrom: cM.namesFrom.file }),
        scenarios: scRows(scM), npmTestPath: { base: tB.summary.scripts, mock: tM.summary.scripts }, testFiles: { total: tM.testFiles.length, failedBase: fB.size, failedMock: fM.size, mockOnly: [...fM].filter(f => !fB.has(f)), baseOnly: [...fB].filter(f => !fM.has(f)) },
        stoppedByGenerator: unwirePlan.stoppedByGenerator.length, registeredStillWired: mPlan.registeredStillWired.count },
      withoutCommit: { guestBootOk: cN.ok, error: cN.guestBoot.error, firstException: (cN.guestBoot.exceptions[0] || '').split('\n')[0], note: '대조군 — 같은 모의 철거 사본에서 commit 태그만 빼면 앱이 부팅하지 못한다(own 적용이 실제로 이름을 내주고 있음을 보임)' } },
    scenarios: scRows(scL),
    npmTest: { base: { exitCode: nb.exit, okLines: nb.ok, okDotLines: nb.okDot, failLines: nb.fail }, work: { exitCode: nw.exit, okLines: nw.ok, okDotLines: nw.okDot, failLines: nw.fail }, same: npmCmp.same, onlyBase: onlyBase.length, onlyWork: onlyWork.length, retired: 0 },
    pinnedByTests: { count: pinned.pinnedCount, byKind: pinned.byKind, byFile: pinned.byFile, failingChecksWhenAllUnwired: tA.scripts.map(s => ({ script: s.script, exit: s.exit, fails: s.fails })) },
  },
  commands,
};
fs.writeFileSync(path.join(__dirname, 'measurement.json'), JSON.stringify(out, null, 1) + '\n', 'utf8');
const s = out.summary;
console.log(JSON.stringify({ changed: s.changed.files, js: s.changed.jsFiles, newJs: s.changed.newJsFiles, indexNet: s.changed.indexHtml.netLineGrowth, tests: s.changed.testsChanged.length, vault: s.changed.vaultChanged.length, genInlineHard: s.changed.generatorInlineHardChanged.length, maps: s.changed.generatedMapsChanged.length,
  cellBlocksOnly: s.cellBlocksOnly.allSame + ' ' + s.cellBlocksOnly.same + '/' + s.cellBlocksOnly.checked, idem: s.provideGenerator.idempotent, max: s.lines.maxAfter, over800: s.lines.over800.length, inline: s.ratchet.inlineScriptLines, guard: s.guard, globalsDiffer: s.newGlobals.changedFilesGlobalsDiffer, newFiles: s.newGlobals.newFiles,
  ml: s.moduleLoad, own: s.own.counts, fp: [s.fingerprints.baseVsWork, s.fingerprints.baseVsMock], mockAll: [s.mockUnwire.all.deletedLines, s.mockUnwire.all.names], mockPlan: [s.mockUnwire.plan.deletedLines, s.mockUnwire.plan.names, s.mockUnwire.plan.inlineScriptLines], mockOnlyFails: s.mockUnwire.plan.testFiles.mockOnly, npm: s.npmTest, sc: s.scenarios }));
