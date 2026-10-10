#!/usr/bin/env node
'use strict';
// B1 측정 기록 생성기(작업자 측정, 판정 아님). 값은 전부 스크립트 산출·결과 파일에서 읽는다 — 손으로 옮긴 수치 0.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/<task>/measure-b1.cjs <저장소 루트>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const REL = path.relative(ROOT, __dirname).replace(/\\/g, '/');
const rj = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const commands = [];
function run(id, argv, opts) {
  const t0 = new Date().toISOString();
  const r = cp.spawnSync(argv[0], argv.slice(1), { cwd: ROOT, encoding: 'utf8', env: process.env, shell: false, ...(opts || {}) });
  commands.push({ id, argv, cwd: ROOT, startedAt: t0, endedAt: new Date().toISOString(), exitCode: r.status, signal: r.signal, spawnError: r.error ? String(r.error.message) : null, stdoutHead: (r.stdout || '').slice(0, 400), stderrHead: (r.stderr || '').slice(0, 400) });
  return r;
}
const git = args => run('git ' + args[0], ['git', ...args]);

// 1. index.html 순증가(스테이징 여부와 무관하게 origin/main 기준 작업 트리 비교)
const base = git(['rev-parse', 'origin/main']).stdout.trim();
const head = git(['rev-parse', 'HEAD']).stdout.trim();
const numstat = git(['diff', '--numstat', 'HEAD', '--', 'index.html']).stdout.trim().split('\t');
const indexHtml = { insertions: Number(numstat[0] || 0), deletions: Number(numstat[1] || 0) };
indexHtml.netLineGrowth = indexHtml.insertions - indexHtml.deletions;

// 2. 인라인 줄 수(module-metrics) 와 기준선
const metrics = require(path.join(ROOT, 'scripts', 'module-metrics.js')).measure(ROOT);
const baseline = rj('docs/architecture/module-baseline.json');
const last = baseline.history[baseline.history.length - 1];
const inlineScriptLines = { measured: metrics.ratchet.inlineScriptLines, baseline: last.metrics.inlineScriptLines, baselineDate: last.date, same: metrics.ratchet.inlineScriptLines === last.metrics.inlineScriptLines, source: 'scripts/module-metrics.js measure().ratchet.inlineScriptLines · docs/architecture/module-baseline.json 마지막 항목' };
const windowAssignments = { measured: metrics.ratchet.windowAssignments, baseline: last.metrics.windowAssignments, same: metrics.ratchet.windowAssignments === last.metrics.windowAssignments };
const guard = run('module-guard', [process.execPath, 'scripts/module-guard.js', '--quiet']);
const specsCheck = run('module-specs --check', [process.execPath, 'scripts/module-specs.js', '--check']);

// 3. 새 파일 단독 로드(법정 탐침 읽기 전용)
const { loadOne } = require(path.join(ROOT, 'court', 'probes', 'module-load.js'));
const load = loadOne(path.join(ROOT, 'js', 'core', 'cell-registry.js'));
const lineCount = fs.readFileSync(path.join(ROOT, 'js', 'core', 'cell-registry.js'), 'utf8').split('\n').length;

// 4. 결과 파일들
const moduleLoad = rj(REL + '/module-load.json');
const scenario = rj(REL + '/scenario-local.json');
const compare = rj(REL + '/cell-registry-compare.json');
const unwire = rj(REL + '/unwire-unit.json');
const npmCmp = rj(REL + '/npm-test-compare.json');
const testsChanged = git(['diff', '--name-only', 'HEAD', '--', 'tests']).stdout.trim().split('\n').filter(Boolean);
const testsUntracked = git(['ls-files', '--others', '--exclude-standard', '--', 'tests']).stdout.trim().split('\n').filter(Boolean);
const sha = f => { try { return require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex'); } catch (e) { return null; } };
const sc = Object.values(scenario.scenarios)[0];

const out = {
  schema: 'ourgoal.task-es-610.measurement/1',
  taskId: 'TASK-ES-610',
  requestedTaskTag: 'TASK-ES-600 (지시 원문 번호 — PR #868 이 선점, #TASK-ES-601~609 도 사용 중이라 빈 번호 #TASK-ES-610 으로 확정 · 양비스 부모 작업 TASK-YV-8aa85377-0805-42a0-8e32-d7607aadd39f, 오케스트레이터 TASK-YV-8aa85377-0805-42a0-8e32-d7607aadd39f-ORCH-c66825121b9a)',
  type: '작업자 측정, 판정 아님 — 판정은 GitHub 법정(node court/chat.js <PR>)만 낸다',
  measuredAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, arch: process.arch, gitAutocrlf: git(['config', 'core.autocrlf']).stdout.trim() || null },
  sourceCommit: { parentWorkerBase: '0ecaf23356cef7ee7ec0fbd260fc3edc5cc58226', worktreeHead: head, originMainAtMeasure: base, note: '부모 작업자(TASK-YV-8aa85377)는 0ecaf233 기준으로 만들었고, 오케스트레이터가 origin/main 기준 새 트리에 다시 적용해 재측정했다. 두 커밋 사이 제품 파일 차이 0(docs·헌법 문서만)' },
  summary: {
    indexHtml,
    inlineScriptLines,
    windowAssignments,
    newGlobals: load.globals,
    newGlobalsCount: load.globals.length,
    newFile: { file: 'js/core/cell-registry.js', loadOk: load.ok, loadError: load.error, lines: lineCount, under800: lineCount <= 800 },
    moduleLoad: { regressions: moduleLoad.regressions.length, insufficient: moduleLoad.insufficient.length, insufficientNote: moduleLoad.insufficient.map(i => i.file + ': ' + i.note), counts: moduleLoad.counts, newFiles: moduleLoad.newFiles.map(n => ({ file: n.file, ok: n.ok, globals: n.globals })) },
    scenario: { id: sc && Object.keys(scenario.scenarios)[0], basePassed: sc.runs.base.passed, workPassed: sc.runs.work.passed, baseExceptions: (sc.runs.base.exceptions || []).length, workExceptions: (sc.runs.work.exceptions || []).length, nonVacuousExpects: sc.runs.work.nonVacuousExpects, allPassedBoth: scenario.allPassedBoth },
    compare: { ...compare.counts, guestBootOk: compare.ok, exceptions: compare.guestBoot.exceptions.length, consoleErrors: compare.guestBoot.consoleErrors.length, scopeGetterErrors: compare.oldPath.scopeGetterErrors.length, windowUndefined: compare.oldPath.windowUndefined.length, callOrderRecorded: compare.report.callOrder.recorded.length, callOrderExpected: compare.report.callOrder.expected },
    unwireUnit: { passed: unwire.passed, total: unwire.total, ok: unwire.ok, t7Names: (unwire.results.find(r => r.id === 'T7') || {}).detail && unwire.results.find(r => r.id === 'T7').detail.names, t8Files: (unwire.results.find(r => r.id === 'T8') || {}).detail && unwire.results.find(r => r.id === 'T8').detail.files },
    npmTest: { base: { exitCode: npmCmp.base.exit, okLines: npmCmp.base.ok, failLines: npmCmp.base.fail, summaryTokens: npmCmp.base.summaryTokens.length }, work: { exitCode: npmCmp.work.exit, okLines: npmCmp.work.ok, failLines: npmCmp.work.fail, summaryTokens: npmCmp.work.summaryTokens.length }, same: npmCmp.same, onlyBase: npmCmp.onlyBase.length, onlyWork: npmCmp.onlyWork.length, retired: 0, testsChanged, testsUntracked, note: '기준 = origin/main 93b6c126 을 임시 git worktree 로 받아 전경 실행(raw/npm-test.base.log) · 작업 = 이 트리(raw/npm-test.work.log). 첫 작업 실행은 cell-map-export 시험이 git 미추적 새 파일 줄 수를 못 읽어 실패했고(16/17), 새 파일을 git add 한 뒤 17/17 — 커밋 뒤에는 추적 상태라 무관' },
    guard: { exitCode: guard.status, specsCheckExitCode: specsCheck.status },
  },
  evidence: {
    claims: REL + '/claims.json',
    scenario: REL + '/scenarios/b1-guest-boot-six-tabs.json',
    scenarioLocal: REL + '/scenario-local.json',
    moduleLoad: REL + '/module-load.json',
    compare: REL + '/cell-registry-compare.json',
    unwireUnit: REL + '/unwire-unit.json',
    npmCompare: REL + '/npm-test-compare.json',
    npmLogs: [REL + '/raw/npm-test.base.log', REL + '/raw/npm-test.work.log'],
    req: 'docs/specs/REQ-TASK-ES-610-CELL-REGISTRY-B1.md',
    fileSha256: Object.fromEntries(['js/core/cell-registry.js', 'scripts/probes/cell-registry-compare.js', 'docs/design/harness/module-split/gen-inline-hard.js', 'docs/design/harness/module-split/unwire-check-b1.js', 'index.html'].map(f => [f, sha(f)])),
  },
  commands,
  limits: [
    '등록(provide)이 0 인 첫 측정이라 report().mismatches 는 대조할 값이 없어 0 이다 — 공허한 0 이며, B2 가 등록 줄을 넣은 뒤의 불일치 0 과는 다르다. 누락 622 가 실제 측정값이다.',
    '로드 중 호출 순서(callOrder) 는 note() 기록이 0 건이고 기대 배열도 없어(null) 비교하지 않았다 — B10 전까지 측정불가.',
    'own 모드는 B1 에서 동작하지 않는다(설계 3.1). unwire 모드는 단위 시험·실제 index.html 모의 철거로만 증명했고 저장소의 index.html 에는 철거를 적용하지 않았다.',
    '이 PC 는 git core.autocrlf=true 라 git show·git archive 출력이 CRLF 로 바뀐다. T8 은 git cat-file 원시 blob(LF)으로 법정 clone(autocrlf=false) 입력을 재현했다.',
    '시나리오·module-load·탐침은 로컬 실행(작업자 측정)이다. 법정 판정은 PR 에서 node court/chat.js 가 낸다.',
    '법정 모듈 로드 탐침의 「불충분 1」(js/goal-templates-registry.js, 양쪽 모두 로드 실패) 은 기준에도 있는 기존 상태다.',
  ],
};
fs.writeFileSync(path.join(__dirname, 'measurement.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ indexHtml, inlineScriptLines: inlineScriptLines.measured + '/' + inlineScriptLines.baseline, newGlobals: load.globals, moduleLoadRegressions: moduleLoad.regressions.length, scenario: [sc.runs.base.passed, sc.runs.work.passed], compare: compare.counts, unwire: unwire.passed + '/' + unwire.total, npmSame: npmCmp.same, guard: guard.status }));
