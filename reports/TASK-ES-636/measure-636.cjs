#!/usr/bin/env node
'use strict';
// #TASK-ES-636 측정 기록 생성기(작업자 측정, 판정 아님). 값은 전부 스크립트 산출·결과 파일에서 읽는다 — 손으로 옮긴 수치 0.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-636/measure-636.cjs <작업 트리> <기준 트리(origin/main 임시 worktree)> <모의 이전 사본(계획 적용 상태)>
//   module-load.json · npm-test-compare.json · unstate-plan.json · measurement.json 을 이 폴더에 쓴다.
//   먼저 있어야 하는 것: organ-unit.json · mock-unstate-{all,plan}.json · pinned-state.json · state-probe.{base,base2,work,mock,mock-all,mock-no-organ}.json ·
//                      scenario-{local,mock,mock-all}.json · tests-{base,mock,mock-all}.json · raw/npm-test.{base,work}.{log,exit}
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const BASE = process.argv[3] ? path.resolve(process.argv[3]) : null, MOCK = process.argv[4] ? path.resolve(process.argv[4]) : null;
if (!BASE || !MOCK) { console.error('사용: node measure-636.cjs <작업 트리> <기준 트리> <모의 이전 사본>'); process.exit(2); }
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
const baseHead = git(['rev-parse', 'HEAD'], BASE).stdout.trim(), workHead = git(['rev-parse', 'HEAD']).stdout.trim(), mockHead = git(['rev-parse', 'HEAD'], MOCK).stdout.trim();
const numstat = L(git(['diff', '--numstat', baseHead, '--']).stdout).map(l => { const [a, d, f] = l.split('\t'); return { file: f, insertions: Number(a), deletions: Number(d) }; });
const untracked = L(git(['ls-files', '--others', '--exclude-standard']).stdout).filter(f => !f.startsWith('.claude/'));
const all = numstat.map(x => x.file).concat(untracked).filter((f, i, a) => a.indexOf(f) === i);
const jsChanged = all.filter(f => /^js\/.*\.js$/.test(f));
const newJs = jsChanged.filter(f => !fs.existsSync(path.join(BASE, f)));
const indexRow = numstat.find(x => x.file === 'index.html') || { insertions: 0, deletions: 0 };
const vaultRe = /^(court\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|\.agent\/rules\/|docs\/rules\/(OURGOAL_ABSOLUTE_INTEGRITY_RULES\.md|CONSTITUTION_VERSIONS\.md|ESSENCE_OURGOAL\.md|rules\.json|rules-control\.json|branch-protection.*\.json|archive\/)|\.github\/|\.githooks\/|scripts\/essence-gate\.js$|scripts\/install-essence-gate\.js$|scripts\/verify-integrity-gate\.js$|\.vercelignore$|package\.json$|vercel\.json$|\.gitattributes$|\.claude\/settings\.json$|docs\/directives\/)/;
// index.html 의 바뀐 줄: 기존 줄 끝에 태그 하나를 덧붙였는가
const bIdx = lf(fs.readFileSync(path.join(BASE, 'index.html'), 'utf8')).split('\n'), wIdx = lf(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')).split('\n');
const TAG = '<script src="js/core/app-state.js"></script>';
const diffLines = []; if (bIdx.length === wIdx.length) for (let i = 0; i < bIdx.length; i++) if (bIdx[i] !== wIdx[i]) diffLines.push(i + 1);
const tagLine = wIdx.findIndex(l => l.includes(TAG)) + 1;
const scriptLine = wIdx.findIndex((l, i) => l.trim() === '<script>' && (wIdx[i + 1] || '').trim() === '(function(){') + 1;
const commitLine = wIdx.findIndex(l => l.includes('js/core/cell-registry-commit.js')) + 1, scopeLine = wIdx.findIndex(l => l.includes('js/core/app-scope.js')) + 1;
const loadTag = { sameLineCount: bIdx.length === wIdx.length, changedLines: diffLines, tagLine, appendedOnly: diffLines.length === 1 && wIdx[diffLines[0] - 1] === bIdx[diffLines[0] - 1] + TAG,
  afterScopeTag: scopeLine > 0 && tagLine >= scopeLine && wIdx[tagLine - 1].indexOf('js/core/app-scope.js') < wIdx[tagLine - 1].indexOf('js/core/app-state.js'), beforeIife: tagLine > 0 && tagLine < scriptLine, beforeCommitTag: commitLine > 0 && tagLine < commitLine,
  deferOrAsync: /app-state\.js"[^>]*(defer|async)/.test(wIdx[tagLine - 1] || ''), lines: { scopeTag: scopeLine, organTag: tagLine, commitTag: commitLine, iifeScript: scriptLine } };

// 2. 줄 수 · 가드 · 인라인 줄 수
const mm = require(path.join(ROOT, 'scripts', 'module-metrics.js'));
const metrics = mm.measure(ROOT), baseMetrics = require(path.join(BASE, 'scripts', 'module-metrics.js')).measure(BASE), mockMetrics = mm.measure(MOCK);
const lineRows = jsChanged.map(f => ({ file: f, lines: mm.countLines(fs.readFileSync(path.join(ROOT, f), 'utf8')) })).sort((a, b) => b.lines - a.lines);
const guard = run('module-guard', [process.execPath, 'scripts/module-guard.js', '--quiet']);
const specsCheck = run('module-specs --check', [process.execPath, 'scripts/module-specs.js', '--check']);
const gate = run('verify-integrity-gate', [process.execPath, 'scripts/verify-integrity-gate.js']);

// 3. 모듈 로드: 법정 탐침과 같은 비교(기준 대 작업 · 기준 대 모의 이전 사본) + 새 js 파일 단독 로드
const ml = require(path.join(ROOT, 'court', 'probes', 'module-load.js'));
const probeBase = ml.probeModules(BASE);
const loadSet = TREE => {
  const cmp = ml.compare(probeBase, ml.probeModules(TREE), fs.readFileSync(path.join(TREE, 'index.html'), 'utf8'));
  const newFiles = newJs.map(f => { const w = ml.loadOne(path.join(TREE, f)); return { file: f, ok: w.ok, globals: w.globals || [], error: w.error || null }; });
  return { regressions: cmp.regressions, insufficient: cmp.insufficient, counts: cmp.counts, newFiles };
};
const moduleLoad = { tool: 'court/probes/module-load.js (읽기 전용 — compare(probeModules(기준), probeModules(트리)) 는 CLI 와 같은 셈, loadOne 은 새 js 파일 단독 로드)', type: '작업자 측정, 판정 아님', base: baseHead, measuredAt: new Date().toISOString(), work: loadSet(ROOT), mock: loadSet(MOCK) };
fs.writeFileSync(path.join(__dirname, 'module-load.json'), JSON.stringify(moduleLoad, null, 1) + '\n', 'utf8');

// 4. npm test 로그 비교(전경으로 끝까지 돌린 원시 로그 두 개)
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
const npmCmp = { tool: REL + '/measure-636.cjs (작업자 측정)', base: nb, work: nw, sameSummaryTokens: JSON.stringify(nb.summaryTokens) === JSON.stringify(nw.summaryTokens), sameOkCount: nb.ok === nw.ok && nb.okDot === nw.okDot, sameExit: nb.exit === nw.exit, onlyBase, onlyWork };
npmCmp.same = npmCmp.sameSummaryTokens && npmCmp.sameOkCount && npmCmp.sameExit && nb.exit === 0 && !onlyBase.length && !onlyWork.length && nb.fail === 0 && nw.fail === 0;
fs.writeFileSync(path.join(__dirname, 'npm-test-compare.json'), JSON.stringify(npmCmp, null, 1) + '\n', 'utf8');

// 5. 결과 파일들
const organ = rj('organ-unit.json'), mAll = rj('mock-unstate-all.json'), mPlan = rj('mock-unstate-plan.json'), pinned = rj('pinned-state.json');
const pB = rj('state-probe.base.json'), pB2 = rj('state-probe.base2.json'), pW = rj('state-probe.work.json'), pM = rj('state-probe.mock.json'), pA = rj('state-probe.mock-all.json'), pN = rj('state-probe.mock-no-organ.json');
const scL = rj('scenario-local.json'), scM = rj('scenario-mock.json'), scA = rj('scenario-mock-all.json'), tB = rj('tests-base.json'), tM = rj('tests-mock.json'), tA = rj('tests-mock-all.json');
const FIELDS = ['accessor', 'value', 'onWindow', 'windowValue', 'windowSame', 'writeRoundtrip', 'restored', 'error'];
const probeDiff = (x, y) => Object.keys(x.names).filter(n => FIELDS.some(f => JSON.stringify(x.names[n][f]) !== JSON.stringify((y.names[n] || {})[f]))).map(n => ({ name: n, fields: FIELDS.filter(f => JSON.stringify(x.names[n][f]) !== JSON.stringify((y.names[n] || {})[f])) }));
const intrinsic = probeDiff(pB, pB2).map(d => d.name); // 기준을 두 번 재도 달라지는 이름(본질 변동) — 비교에서 뺀다
const without = d => d.filter(x => !intrinsic.includes(x.name));
const transitions = (x, y) => { const t = {}; for (const n of Object.keys(x.names)) { const k = x.names[n].accessor + ' → ' + y.names[n].accessor + ' | 주인 ' + x.names[n].owner + ' → ' + y.names[n].owner + ' | 기관 ' + y.names[n].organKind; t[k] = (t[k] || 0) + 1; } return t; };
const writable = p => { const v = Object.values(p.names).filter(x => x.accessor === 'get+set'); return { names: v.length, roundtripOk: v.filter(x => x.writeRoundtrip === true && x.restored === true).length }; };
const winSame = p => { const v = Object.values(p.names).filter(x => x.onWindow); return { onWindow: v.length, same: v.filter(x => x.windowSame === true).length }; };
const organMatches = (p, m) => !!p.organNames && JSON.stringify(p.organNames.slice().sort()) === JSON.stringify(m.applied.names.slice().sort()) && m.applied.names.every(n => p.names[n].organKind === (m.applied.api[n] === 'defineVar' ? 'var' : 'const'));
const scRows = j => Object.keys(j.scenarios).map(id => ({ id, basePassed: j.scenarios[id].runs.base.passed, otherPassed: j.scenarios[id].runs.work.passed, baseExceptions: (j.scenarios[id].runs.base.exceptions || []).length, otherExceptions: (j.scenarios[id].runs.work.exceptions || []).length, nonVacuousExpects: j.scenarios[id].runs.work.nonVacuousExpects }));
const failSet = t => new Set(t.testFiles.filter(x => x.exit !== 0).map(x => x.file));
const fB = failSet(tB), fM = failSet(tM), fA = failSet(tA);
const tail = (t, f) => (t.testFiles.find(x => x.file === f) || {}).tail || null;
const scriptCmp = t => t.scripts.map(s => { const b = tB.scripts.find(x => x.script === s.script) || {}; return { script: s.script, exit: [b.exit, s.exit], ok: [b.ok, s.ok], okDot: [b.okDot, s.okDot], fails: s.fails.length, same: b.exit === s.exit && b.ok === s.ok && b.okDot === s.okDot && s.fails.length === (b.fails || []).length }; });
const testsCmp = (t, f) => ({ scripts: scriptCmp(t), scriptsSame: scriptCmp(t).every(x => x.same), testFiles: t.testFiles.length, failedBase: fB.size, failedHere: f.size, onlyHere: [...f].filter(x => !fB.has(x)), onlyBase: [...fB].filter(x => !f.has(x)), sameFailTails: [...f].filter(x => fB.has(x)).every(x => tail(t, x) === tail(tB, x)), newFailingChecks: t.scripts.flatMap(s => { const b = tB.scripts.find(x => x.script === s.script) || { fails: [] }; const had = new Set(b.fails.map(x => x.check)); return s.fails.filter(x => !had.has(x.check)).map(x => ({ script: s.script, check: x.check, detail: x.detail })); }) });
const cmpPlan = testsCmp(tM, fM), cmpAll = testsCmp(tA, fA);
const pinnedTable = Object.keys(pinned.pinned).sort().flatMap(n => pinned.pinned[n].flatMap(r => r.sites.map(s => ({ name: n, file: r.file, vault: r.vault, line: s.line, text: s.text }))));

// 6. 이전 계획(다음 PR 입력): 시험에 걸리는 이름을 뺀 모의 이전에서 실제로 적용된 이름
const plan = {
  schema: 'ourgoal.task-es-636.unstate-plan/1', type: '작업자 측정에서 나온 계획 — 판정 아님. 실제 상태 이전은 다음 PR(이 PR 의 실제 이전 0)',
  basis: { worktreeHead: workHead, base: baseHead, generator: mPlan.generator, note: '저장소 밖 사본(기준 worktree 에 이 PR 의 바뀐 파일을 덮은 것)에서 생성기 unstate 를 실제로 적용한 결과다. 이름으로 지정하므로 main 이 움직여도 쓸 수 있지만, 그때는 mock-unstate.cjs 를 다시 돌려 대상과 줄 수를 다시 잰다.' },
  howToUse: '이전 PR 하나 = 설정 { task, slot:"HO", mode:"unstate", cells:[{ file:"js/core/app-state.js" }], unstate:{ names } }. 법정은 PR 하나에 생성기를 한 번 돌린다. 이 PR(기관 파일)이 병합된 뒤에만 낼 수 있다.',
  totals: { stateNames: mPlan.counts.stateNames, exposed: mPlan.counts.exposed, movable: mPlan.counts.movable, excludedBecauseTestsPinStateText: mPlan.counts.excluded, names: mPlan.applied.names.length, define: mPlan.applied.define, defineVar: mPlan.applied.defineVar, stoppedByGenerator: mPlan.counts.stopped,
    expectedDeletedLines: mPlan.applied.deletedLines, expectedEditedLines: mPlan.applied.editedLines, htmlLines: mPlan.applied.htmlLines, inlineScriptLines: [metrics.ratchet.inlineScriptLines, mockMetrics.ratchet.inlineScriptLines] },
  names: mPlan.applied.names, api: mPlan.applied.api, byName: mPlan.applied.byName,
  excludedBecauseTestsPinStateText: { names: mPlan.excluded, failingChecksWhenAllMoved: cmpAll.newFailingChecks, testFilesFailedOnlyWhenAllMoved: cmpAll.onlyHere, sites: pinnedTable, note: '전 대상을 옮긴 사본에서 새로 깨진 검사와, 그 검사가 든 시험 소스에서 그 이름의 배선 글자가 있는 줄. 시험은 고치지 않았다.' },
  textInTestsButNotFailing: Object.keys(pinned.textOnly).sort().map(n => ({ name: n, files: pinned.textOnly[n].map(r => r.file) })),
  stoppedByGenerator: mPlan.stopped, notExposed: mPlan.notExposed,
  notMeasured: ['로그인 뒤 화면과 로그인 뒤 값 변화', '게스트 화면에서 숨겨져 누를 수 없는 진입로(템플릿 백과 · 앱 평가 · 체크인 글자 수 칸)의 화면 동작 — 탐침의 값 요약과 보조 조작으로만 쟀다', '실기기']
};
fs.writeFileSync(path.join(__dirname, 'unstate-plan.json'), JSON.stringify(plan, null, 1) + '\n', 'utf8');

const out = {
  schema: 'ourgoal.task-es-636.measurement/1', taskId: 'TASK-ES-636', type: '작업자 측정, 판정 아님 — 판정은 GitHub 법정(node court/chat.js <PR>)만 낸다', measuredAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, arch: process.arch, gitAutocrlf: git(['config', 'core.autocrlf']).stdout.trim() || null },
  sourceCommit: { baseTreeHead: baseHead, worktreeHead: workHead, mockTreeHead: mockHead, note: '기준 = origin/main 임시 git worktree(저장소 밖). 작업 = 이 트리. 모의 이전 사본 = 기준 worktree 를 하나 더 만들어 작업 트리의 바뀐 파일(기관 · index.html · 신고서 · 설명)을 덮고 index.html 에 생성기 unstate 를 적용한 것(커밋하지 않는다)' },
  summary: {
    changed: { files: all.length, list: all, jsFiles: jsChanged, newJsFiles: newJs, indexHtml: { insertions: indexRow.insertions, deletions: indexRow.deletions, netLineGrowth: indexRow.insertions - indexRow.deletions },
      testsChanged: all.filter(f => /^tests\//.test(f)), vaultChanged: all.filter(f => vaultRe.test(f)), generatorInlineHardChanged: all.filter(f => /gen-inline-hard\.js$/.test(f)),
      generatedMapsChanged: all.filter(f => /^docs\/architecture\/(module-baseline\.json|cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md)$/.test(f)) },
    loadTag,
    lines: { organ: lineRows.find(r => r.file === 'js/core/app-state.js') || null, over800: lineRows.filter(r => r.lines > 800) },
    ratchet: { inlineScriptLines: [baseMetrics.ratchet.inlineScriptLines, metrics.ratchet.inlineScriptLines], inlineScriptLinesSame: metrics.ratchet.inlineScriptLines === baseMetrics.ratchet.inlineScriptLines, indexFunctionDecls: [baseMetrics.ratchet.indexFunctionDecls, metrics.ratchet.indexFunctionDecls], windowAssignments: [baseMetrics.ratchet.windowAssignments, metrics.ratchet.windowAssignments], oversizeJsFiles: [baseMetrics.ratchet.oversizeJsFiles.count, metrics.ratchet.oversizeJsFiles.count], source: 'scripts/module-metrics.js measure().ratchet' },
    guard: { exitCode: guard.status, specsCheckExitCode: specsCheck.status, integrityGateExitCode: gate.status, integrityGateResult: ((gate.stdout || '').split('\n').find(l => /검증 결과/.test(l)) || '').trim() },
    newGlobals: { newFiles: moduleLoad.work.newFiles, onlyOrganGlobal: moduleLoad.work.newFiles.length === 1 && JSON.stringify(moduleLoad.work.newFiles[0].globals) === '["OurgoalAppState"]' },
    moduleLoad: { work: { regressions: moduleLoad.work.regressions.length, insufficient: moduleLoad.work.insufficient.length }, mock: { regressions: moduleLoad.mock.regressions.length, insufficient: moduleLoad.mock.insufficient.length }, insufficientNote: moduleLoad.work.insufficient.map(i => i.file + ': ' + i.note) },
    organUnit: { ok: organ.ok, passed: organ.passed, total: organ.total, byId: organ.results.reduce((a, r) => { a[r.id] = r.ok; return a; }, {}) },
    scenarios: { work: scRows(scL), mockPlan: scRows(scM), mockAll: scRows(scA), allPassed: [scL, scM, scA].every(j => Object.values(j.scenarios).every(r => r.runs.base.passed && r.runs.work.passed && !(r.runs.work.exceptions || []).length)) },
    stateProbe: {
      names: Object.keys(pB.names).length, intrinsicVariance: intrinsic, bootOk: { base: pB.guestBoot.ok, work: pW.guestBoot.ok, mockPlan: pM.guestBoot.ok, mockAll: pA.guestBoot.ok }, exceptions: { base: pB.guestBoot.exceptions.length, work: pW.guestBoot.exceptions.length, mockPlan: pM.guestBoot.exceptions.length, mockAll: pA.guestBoot.exceptions.length },
      baseVsWork: { differing: without(probeDiff(pB, pW)), count: without(probeDiff(pB, pW)).length, organNamesInWork: pW.organNames ? pW.organNames.length : null },
      baseVsMockPlan: { differing: without(probeDiff(pB, pM)), count: without(probeDiff(pB, pM)).length, organNames: pM.organNames ? pM.organNames.length : null, organMatchesPlan: organMatches(pM, mPlan), transitions: transitions(pB, pM) },
      baseVsMockAll: { differing: without(probeDiff(pB, pA)), count: without(probeDiff(pB, pA)).length, organNames: pA.organNames ? pA.organNames.length : null, organMatchesPlan: organMatches(pA, mAll), transitions: transitions(pB, pA) },
      writable: { base: writable(pB), mockPlan: writable(pM), mockAll: writable(pA) }, windowCopy: { base: winSame(pB), mockPlan: winSame(pM), mockAll: winSame(pA) },
      captureCount: { base: pB.checks && pB.checks.captureCount, work: pW.checks && pW.checks.captureCount, mockPlan: pM.checks && pM.checks.captureCount, mockAll: pA.checks && pA.checks.captureCount, same: JSON.stringify(pB.checks) === JSON.stringify(pM.checks) && JSON.stringify(pB.checks) === JSON.stringify(pA.checks) && JSON.stringify(pB.checks) === JSON.stringify(pW.checks) },
      note: '이름마다 통로 값의 요약(종류 · 길이 · JSON 가능한 값의 해시 · 요소는 태그#id.class) · 접근자 종류 · window 값의 동일성 · 쓰기 가능한 이름의 쓰기 왕복을 잰 뒤 트리 사이에 맞댄 차이. 기준을 두 번 재어 달라지는 이름(본질 변동)은 뺐다.' },
    mockUnstate: {
      all: { applied: mAll.counts.applied, define: mAll.applied.define, defineVar: mAll.applied.defineVar, deletedLines: mAll.applied.deletedLines, editedLines: mAll.applied.editedLines, htmlLines: mAll.applied.htmlLines, tests: cmpAll },
      plan: { excluded: mPlan.excluded, applied: mPlan.counts.applied, define: mPlan.applied.define, defineVar: mPlan.applied.defineVar, deletedLines: mPlan.applied.deletedLines, editedLines: mPlan.applied.editedLines, htmlLines: mPlan.applied.htmlLines, inlineScriptLines: [metrics.ratchet.inlineScriptLines, mockMetrics.ratchet.inlineScriptLines], tests: cmpPlan, testsSameAsBase: cmpPlan.scriptsSame && !cmpPlan.onlyHere.length && !cmpPlan.onlyBase.length && cmpPlan.sameFailTails },
      stoppedByGenerator: mPlan.counts.stopped, exposed: mPlan.counts.exposed, movable: mPlan.counts.movable,
      withoutOrganTag: { guestBootOk: pN.guestBoot.ok, error: pN.guestBoot.error, firstException: (pN.guestBoot.exceptions[0] || '').split('\n')[0], note: '대조군 — 같은 모의 이전 사본에서 기관 태그만 빼면 앱이 부팅하지 못한다(사본의 상태 접근이 실제로 기관을 지나감을 보임)' } },
    browserMeasuredOn: (() => { // 상태 탐침 · 시나리오 · 대조군(브라우저 측정)을 잰 기준 커밋과, 그 뒤 기준에 더 들어온 커밋이 제품·시험 파일을 바꿨는가
      const at = 'b57a8a102eb8244893be10bb74d986e3586773e2';
      const later = at === baseHead ? [] : L(git(['diff', '--name-only', at, baseHead]).stdout);
      return { commit: at, baseNow: baseHead, filesChangedSince: later.length, productOrTestFilesChangedSince: later.filter(f => /^(js\/|index\.html$|tests\/|scripts\/|court\/|ui\.js$|sw\.js$|css\/|.*\.css$)/.test(f)),
        note: '브라우저 측정(state-probe.* · scenario-* · 대조군)은 기준 ' + at.slice(0, 8) + '(#907 병합 뒤) 트리에서 쟀다. 그 뒤 기준에 들어온 커밋(#908 생성 지도 갱신)이 제품·시험 파일을 바꾸지 않았음을 위 목록(빈 배열)으로 확인한다. 시험 전부(tests-*.json) · npm test · 모듈 로드 · 지표 · 가드는 지금 기준에서 다시 쟀다.' };
    })(),
    pinnedByTests: { names: Object.keys(pinned.pinned).sort(), newFailingChecksWhenAllMoved: cmpAll.newFailingChecks.length, sites: pinnedTable, unexplainedFailingFiles: pinned.unexplainedFailingFiles, textInTestsButNotFailing: Object.keys(pinned.textOnly).length },
    npmTest: { base: { exitCode: nb.exit, okLines: nb.ok, okDotLines: nb.okDot, failLines: nb.fail }, work: { exitCode: nw.exit, okLines: nw.ok, okDotLines: nw.okDot, failLines: nw.fail }, same: npmCmp.same, onlyBase: onlyBase.length, onlyWork: onlyWork.length, retired: 0 }
  },
  limits: ['법정 판정이 아니다.', '모의 이전은 저장소 밖 사본에서만 했다(저장소 index.html 의 실제 상태 이전 0).', '화면 시나리오가 닿는 범위는 게스트의 탭 전환과 목표 하위 탭·기간까지다. 숨겨진 진입로와 로그인 뒤 화면은 재지 못했다(측정불가). 탐침의 보조 조작(captureCount)은 화면 시나리오가 아니라 페이지 안 평가다.', '값 요약이 같다는 것은 같은 종류·길이·해시의 값이 같은 종류의 접근자로 통로에 있다는 뜻이며, 모든 동작의 보존을 뜻하지 않는다.'],
  commands
};
fs.writeFileSync(path.join(__dirname, 'measurement.json'), JSON.stringify(out, null, 1) + '\n', 'utf8');
const s = out.summary;
console.log(JSON.stringify({ changed: s.changed.files, newJs: s.changed.newJsFiles, indexNet: s.changed.indexHtml.netLineGrowth, tests: s.changed.testsChanged.length, vault: s.changed.vaultChanged.length, gen: s.changed.generatorInlineHardChanged.length, maps: s.changed.generatedMapsChanged.length, loadTag: s.loadTag, organLines: s.lines.organ, inline: s.ratchet.inlineScriptLines, guard: s.guard, globals: s.newGlobals.onlyOrganGlobal, ml: s.moduleLoad, organUnit: [s.organUnit.passed, s.organUnit.total],
  scenarios: s.scenarios.allPassed, probe: { intrinsic: s.stateProbe.intrinsicVariance, work: s.stateProbe.baseVsWork.count, plan: s.stateProbe.baseVsMockPlan.count, all: s.stateProbe.baseVsMockAll.count, organPlan: s.stateProbe.baseVsMockPlan.organMatchesPlan, organAll: s.stateProbe.baseVsMockAll.organMatchesPlan, writable: s.stateProbe.writable, win: s.stateProbe.windowCopy, capture: s.stateProbe.captureCount.same },
  mockAll: { applied: s.mockUnstate.all.applied, newFails: s.mockUnstate.all.tests.newFailingChecks.length, onlyHere: s.mockUnstate.all.tests.onlyHere }, mockPlan: { applied: s.mockUnstate.plan.applied, excluded: s.mockUnstate.plan.excluded, deleted: s.mockUnstate.plan.deletedLines, inline: s.mockUnstate.plan.inlineScriptLines, testsSame: s.mockUnstate.plan.testsSameAsBase }, control: s.mockUnstate.withoutOrganTag.guestBootOk, npm: s.npmTest }));
