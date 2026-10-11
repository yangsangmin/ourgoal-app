'use strict';
// #TASK-ES-643 측정 기록 생성 — 작업자 측정, 판정 아님. 명령·종료 코드·수치를 measurement.json 에 그대로 적는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-643/measure-643.cjs <작업 트리> <기준 트리(origin/main 을 푼 임시 worktree)>
//   먼저: region-plan.json · region-mock.json(모의 측정 — 계획 기준 커밋의 사본 둘에서 잰 것)
const fs = require('fs'), path = require('path'), cp = require('child_process');
const WORK = path.resolve(process.argv[2]), BASE = path.resolve(process.argv[3]);
const OUT_DIR = path.join(WORK, 'reports', 'TASK-ES-643'), RAW = path.join(OUT_DIR, 'raw');
const commands = [];
function run(id, argv, cwd, opts) {
  const startedAt = new Date().toISOString();
  const r = cp.spawnSync(argv[0], argv.slice(1), { cwd, encoding: 'utf8', maxBuffer: 1024 * 1024 * 256, env: process.env, shell: !!(opts && opts.shell) });
  commands.push({ id, argv, startedAt, endedAt: new Date().toISOString(), exitCode: r.status, stdoutHead: (r.stdout || '').slice(0, 300), stderrHead: (r.stderr || '').slice(0, 300) });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}
const NODE = process.execPath, GEN = 'docs/design/harness/module-split/gen-inline-hard.js';
const head = run('git rev-parse HEAD', ['git', 'rev-parse', 'HEAD'], WORK).stdout.trim();
const main = run('git rev-parse origin/main', ['git', 'rev-parse', 'origin/main'], WORK).stdout.trim();
const baseHead = run('git rev-parse HEAD(기준 트리)', ['git', 'rev-parse', 'HEAD'], BASE).stdout.trim();

// 1) 바뀐 파일 — 제품 코드·시험지·금고·index.html·생성 지도 변경 0
const changed = [...new Set(run('git diff --name-only origin/main', ['git', 'diff', '--name-only', 'origin/main'], WORK).stdout.split('\n').concat(run('git ls-files --others --exclude-standard', ['git', 'ls-files', '--others', '--exclude-standard'], WORK).stdout.split('\n')).map(s => s.trim()).filter(Boolean))].filter(f => !f.startsWith('.claude/')).sort();
const PROTECTED = /^(js\/|index\.html$|tests\/|court\/|\.github\/|\.githooks\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|package\.json$|vercel\.json$|docs\/directives\/|docs\/architecture\/(module-baseline|cell-map|inline-script-map|modules)\.json$|docs\/architecture\/INLINE-SCRIPT-MAP\.md$|scripts\/)/;
const protectedChanged = changed.filter(f => PROTECTED.test(f));

// 2) 생성기 — 기존 줄은 한 줄도 바뀌지 않고 한 자리에 끼워 넣기만 했는가
const baseGen = run('git cat-file 기준 생성기', ['git', 'cat-file', '-p', 'origin/main:' + GEN], WORK).stdout.split('\n');
const workGen = fs.readFileSync(path.join(WORK, GEN), 'utf8').replace(/\r\n/g, '\n').split('\n');
let pre = 0; while (pre < baseGen.length && pre < workGen.length && baseGen[pre] === workGen[pre]) pre++;
let suf = 0; while (suf < baseGen.length - pre && suf < workGen.length - pre && baseGen[baseGen.length - 1 - suf] === workGen[workGen.length - 1 - suf]) suf++;
const inserted = workGen.slice(pre, workGen.length - suf);
const generator = { baseLines: baseGen.length, workLines: workGen.length, commonPrefixLines: pre, commonSuffixLines: suf, insertOnly: pre + suf === baseGen.length, baseLinesChanged: baseGen.length - pre - suf, insertedLines: inserted.length,
  insertedAfterUnstate: baseGen.slice(0, pre).some(l => l.startsWith('function unstateOnce(')) && (baseGen.slice(0, pre).filter(l => l.trim()).pop() || '') === '}',
  insertedBeforeMovePath: (baseGen[pre] || '').startsWith('// smoke-test FN_NAMES'),
  insertedFirst: (inserted.find(l => l.trim()) || '').slice(0, 90),
  dispatchLine: inserted.includes("if (CFG.mode === 'region') { runRegion(); return; }"),
  callsIntoMovePath: inserted.some(l => /\b(groupRange|wrapSafe|finalPlan|outPieces|smokeFn)\b/.test(l.replace(/\/\/.*$/, ''))) };

// 3) 단위 시험
const unit = run('region-check-643', [NODE, 'docs/design/harness/module-split/region-check-643.js', '.', 'reports/TASK-ES-643/region-unit.json'], WORK);
const uJ = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'region-unit.json'), 'utf8'));
const byId = {}; for (const r of uJ.results) byId[r.id] = r.ok;
const det = id => (uJ.results.find(r => r.id === id) || {}).detail || {};

// 4) 게이트·가드·지표·npm test(작업 — 기준은 모의 측정 때의 로그)
const gate = run('verify-integrity-gate', [NODE, 'scripts/verify-integrity-gate.js'], WORK);
const guard = run('module-guard', [NODE, 'scripts/module-guard.js'], WORK);
const metric = dir => { const r = run('module-metrics(' + (dir === WORK ? '작업' : '기준') + ')', [NODE, 'scripts/module-metrics.js'], dir); try { return JSON.parse(r.stdout).ratchet; } catch (_) { return null; } };
const mWork = metric(WORK), mBase = metric(BASE);
const count = text => { const ls = text.replace(/\r\n/g, '\n').split('\n'); return { checkLines: ls.filter(l => /^\s*✓ /.test(l)).length, okLines: ls.filter(l => /^\s*ok · /.test(l)).length, failLines: ls.filter(l => /^\s*(✗|✖|not ok|FAIL\b)/.test(l)).length, summaryLines: ls.filter(l => /(\d+개 통과|검증 결과|ALL PASS|COMPLETE)/.test(l)).map(l => l.trim()) }; };
const wr = run('npm test(작업)', ['npm', 'test'], WORK, { shell: true });
fs.writeFileSync(path.join(RAW, 'npm-test.work.log'), wr.stdout + '\n' + wr.stderr, 'utf8');
fs.writeFileSync(path.join(RAW, 'npm-test.work.exit'), 'exit=' + wr.status + '\n', 'utf8');
const tWork = Object.assign({ exitCode: wr.status }, count(wr.stdout + '\n' + wr.stderr));
// 기준 트리(지금의 origin/main)에서도 돌린다 — 모의 측정의 기준 로그(raw/npm-test.base.log)는 계획 기준 커밋의 것이라 따로 둔다
const br = run('npm test(기준 — origin/main)', ['npm', 'test'], BASE, { shell: true });
fs.writeFileSync(path.join(RAW, 'npm-test.main.log'), br.stdout + '\n' + br.stderr, 'utf8');
fs.writeFileSync(path.join(RAW, 'npm-test.main.exit'), 'exit=' + br.status + '\n', 'utf8');
const tBase = Object.assign({ exitCode: br.status }, count(br.stdout + '\n' + br.stderr));
const sameSummary = JSON.stringify(tBase.summaryLines) === JSON.stringify(tWork.summaryLines);

const plan = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'region-plan.json'), 'utf8')), mock = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'region-mock.json'), 'utf8')).summary;
const out = {
  schema: 'ourgoal.measurement/1', taskId: 'TASK-ES-643', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform },
  sourceCommit: { workHead: head, originMain: main, baseTreeHead: baseHead, planBasis: plan.basis.commit },
  summary: {
    changedFiles: changed,
    protectedChanged: { count: protectedChanged.length, files: protectedChanged, note: '제품 코드(js/** · index.html) · tests/ · scripts/ · 금고 · 지시함 · 생성 지도·신고서' },
    generator,
    unit: { ok: uJ.ok, passed: uJ.passed, total: uJ.total, exitCode: unit.status, byId, stops: uJ.results.filter(r => /^Z\d+$/.test(r.id)).length, stopsPassed: uJ.results.filter(r => /^Z\d+$/.test(r.id) && r.ok).length,
      unstate634: { passed: det('B').passed, total: det('B').total, ext619: det('B').ext619, b1: det('B').b1 }, wrap911: det('G1').files ? Object.values(det('G1').files).every(x => x.same) : null, wrap911Files: det('G1').files ? Object.keys(det('G1').files).length : null,
      realCopy: { regions: det('P1').regions, htmlLines: det('P1').htmlLines, lineDiffOutsideListed: det('P2').diff, callLines: det('P2').callLines, bodyDiff: det('P3').bodyDiff, holdSame: det('P3').holdSame, cellsTouchHold: det('P3').cellsTouchHold } },
    plan: Object.assign({ basis: plan.basis.commit, pins: plan.pins.length, generatorOk: plan.generator.ok, htmlLines: plan.generator.htmlLines, gettersAdded: plan.generator.exposedAdded.length, linesMoved: plan.regions.reduce((a, r) => a + (r.lines || 0), 0), locals: plan.regions.reduce((a, r) => a + (r.locals || []).length, 0), holdInRegions: plan.regions.filter(r => /OurgoalTemplateCredit|OURGOAL_CONFIG/.test(JSON.stringify(r))).length }, plan.totals),
    mock: { inlineScriptLines: mock.inlineScriptLines, scenariosAllPassedBoth: mock.scenarios.allPassedBoth, scenarios: mock.scenarios.rows.length, scopeLost: mock.registryCompare.scopeLost, mismatches: mock.registryCompare.counts.mismatches, differingScope: mock.registryCompare.differingScope, differingWindow: mock.registryCompare.differingWindow, bootExceptions: mock.registryCompare.exceptions, stateDiffering: mock.stateProbe.differing, moduleLoadRegressions: mock.moduleLoad.regressions,
      npmSameCounts: mock.npmTest.sameCounts, npmExit: [mock.npmTest.base.exit, mock.npmTest.mock.exit], npmOnlyBase: mock.npmTest.onlyBase.length, testsEachNewFail: mock.testsEach.newFailFiles.map(x => x.file), testsEachFailed: [mock.testsEach.failedBase, mock.testsEach.failedMock] },
    integrityGate: { exitCode: gate.status, resultLine: (gate.stdout.split('\n').find(l => /검증 결과/.test(l)) || '').trim() },
    moduleGuard: { exitCode: guard.status, lastLine: guard.stdout.trim().split('\n').pop() },
    inlineScriptLines: { base: mBase && mBase.inlineScriptLines, work: mWork && mWork.inlineScriptLines, same: !!(mBase && mWork && mBase.inlineScriptLines === mWork.inlineScriptLines) },
    npmTest: { base: tBase, work: tWork, same: tBase.exitCode === 0 && tWork.exitCode === 0 && tBase.checkLines === tWork.checkLines && tBase.okLines === tWork.okLines && tWork.failLines === 0 && sameSummary, sameSummary }
  },
  evidence: { unit: 'reports/TASK-ES-643/region-unit.json', plan: 'reports/TASK-ES-643/region-plan.json', pins: 'reports/TASK-ES-643/region-pins.json', mock: 'reports/TASK-ES-643/region-mock.json', npmLogs: ['reports/TASK-ES-643/raw/npm-test.main.log(기준 = origin/main)', 'reports/TASK-ES-643/raw/npm-test.work.log(작업)', 'reports/TASK-ES-643/raw/npm-test.base.log · npm-test.mock.log(모의 측정 — 계획 기준 커밋의 기준·모의 사본)'] },
  commands,
  limits: ['법정 판정이 아니다. 단위 시험과 모의 적용은 저장소 밖 임시 폴더의 사본에서 생성기를 돌린 것이며 저장소 index.html 은 바뀌지 않았다.', '구역 계획은 계획 기준 커밋의 index.html 에서 잰 것이다. main 의 index.html 이 바뀌면 실제 구역 PR 이 다시 잰다. 구역 함수 이름·세포 파일·키트는 가칭이다.', '모의 사본의 화면 시나리오는 게스트 범위까지다(로그인 뒤 화면 측정불가). 호출 순서의 동적 대조 탐침은 만들지 않았다(미검증).']
};
fs.writeFileSync(path.join(OUT_DIR, 'measurement.json'), JSON.stringify(out, null, 1) + '\n', 'utf8');
const s = out.summary;
console.log(JSON.stringify({ changed: changed.length, protectedChanged: protectedChanged, generator, unit: [uJ.passed, uJ.total, uJ.ok, s.unit.stopsPassed + '/' + s.unit.stops, s.unit.unstate634, s.unit.wrap911], real: s.unit.realCopy, plan: s.plan, mock: s.mock, gate: gate.status, guard: guard.status, inline: s.inlineScriptLines, npm: { base: [tBase.exitCode, tBase.checkLines, tBase.okLines], work: [tWork.exitCode, tWork.checkLines, tWork.okLines, tWork.failLines], same: s.npmTest.same } }));
