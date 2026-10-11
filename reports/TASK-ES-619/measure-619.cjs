'use strict';
// #TASK-ES-619 측정 기록 생성 — 작업자 측정, 판정 아님. 명령·종료 코드·수치를 measurement.json 에 그대로 적는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-619/measure-619.cjs <작업 트리> <기준 트리(origin/main 을 푼 임시 worktree)>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const WORK = path.resolve(process.argv[2]), BASE = path.resolve(process.argv[3]);
const OUT_DIR = path.join(WORK, 'reports', 'TASK-ES-619');
const RAW = path.join(OUT_DIR, 'raw');
fs.mkdirSync(RAW, { recursive: true });
const commands = [];
function run(id, argv, cwd, opts) {
  const startedAt = new Date().toISOString();
  const r = cp.spawnSync(argv[0], argv.slice(1), { cwd, encoding: 'utf8', maxBuffer: 1024 * 1024 * 256, env: process.env, shell: !!(opts && opts.shell) });
  const rec = { id, argv, cwd, startedAt, endedAt: new Date().toISOString(), exitCode: r.status, signal: r.signal, spawnError: r.error ? String(r.error.message) : null, stdoutHead: (r.stdout || '').slice(0, 300), stderrHead: (r.stderr || '').slice(0, 300) };
  commands.push(rec);
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}
const NODE = process.execPath;
const GEN = 'docs/design/harness/module-split/gen-inline-hard.js';
const head = run('git rev-parse HEAD', ['git', 'rev-parse', 'HEAD'], WORK).stdout.trim();
const main = run('git rev-parse origin/main', ['git', 'rev-parse', 'origin/main'], WORK).stdout.trim();
const baseHead = run('git rev-parse HEAD(기준 트리)', ['git', 'rev-parse', 'HEAD'], BASE).stdout.trim();

// 1) 바뀐 파일 — 제품 코드·시험지·금고·index.html 변경 0
const changed = [...new Set(run('git diff --name-only origin/main', ['git', 'diff', '--name-only', 'origin/main'], WORK).stdout.split('\n').concat(run('git ls-files --others --exclude-standard', ['git', 'ls-files', '--others', '--exclude-standard'], WORK).stdout.split('\n')).map(s => s.trim()).filter(Boolean))].filter(f => !f.startsWith('.claude/')).sort();
const PROTECTED = /^(js\/|index\.html$|tests\/|court\/|\.github\/|\.githooks\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|package\.json$|vercel\.json$|docs\/directives\/|docs\/architecture\/(module-baseline|cell-map|inline-script-map)\.json$|docs\/architecture\/INLINE-SCRIPT-MAP\.md$|scripts\/(essence-gate|verify-integrity-gate)\.js$)/;
const protectedChanged = changed.filter(f => PROTECTED.test(f));

// 2) 생성기 — 고친 글자가 unwire 구간 안에만 있는가(앞뒤 공통 줄 수로 잰다)
const baseGen = run('git cat-file 기준 생성기', ['git', 'cat-file', '-p', 'origin/main:' + GEN], WORK).stdout.split('\n');
const workGen = fs.readFileSync(path.join(WORK, GEN), 'utf8').replace(/\r\n/g, '\n').split('\n');
let pre = 0; while (pre < baseGen.length && pre < workGen.length && baseGen[pre] === workGen[pre]) pre++;
let suf = 0; while (suf < baseGen.length - pre && suf < workGen.length - pre && baseGen[baseGen.length - 1 - suf] === workGen[workGen.length - 1 - suf]) suf++;
const baseMid = baseGen.slice(pre, baseGen.length - suf), workMid = workGen.slice(pre, workGen.length - suf);
const generator = {
  baseLines: baseGen.length, workLines: workGen.length, commonPrefixLines: pre, commonSuffixLines: suf,
  baseChangedRegion: { firstLine: pre + 1, lastLine: baseGen.length - suf, lines: baseMid.length, first: (baseMid[0] || '').slice(0, 80), last: (baseMid[baseMid.length - 1] || '').slice(0, 80) },
  workChangedRegion: { firstLine: pre + 1, lastLine: workGen.length - suf, lines: workMid.length },
  // 바뀐 구간이 「unwire 진입 줄 ~ runUnwire 의 닫는 중괄호」 안에 들어 있는가: 구간의 앞은 unwire 머리 주석 뒤, 뒤는 smoke-test 주석 앞
  regionStartsAfterUnwireHeader: baseGen.slice(0, pre).some(l => l.startsWith('// ── [B1 · docs/architecture/CELL-REGISTRY-DESIGN.md 5절] 배선 철거 모드')),
  regionEndsBeforeMovePath: baseGen.slice(baseGen.length - suf).some(l => l.startsWith('// smoke-test FN_NAMES')),
  baseRegionIsOldUnwire: (baseMid[0] || '').startsWith("if (CFG.mode === 'unwire')") || (baseMid[0] || '').startsWith('function runUnwire') || /unwire/.test(baseMid.join('\n').slice(0, 400)),
  movePathLinesChanged: 0
};
generator.movePathLinesChanged = generator.regionStartsAfterUnwireHeader && generator.regionEndsBeforeMovePath ? 0 : null;

// 3) 단위 시험
const ext = run('unwire-check-ext-619', [NODE, 'docs/design/harness/module-split/unwire-check-ext-619.js', '.', 'reports/TASK-ES-619/unwire-ext-unit.json'], WORK);
const b1 = run('unwire-check-b1(재실행)', [NODE, 'docs/design/harness/module-split/unwire-check-b1.js', '.', 'reports/TASK-ES-619/unwire-b1-rerun.json'], WORK);
const extJ = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'unwire-ext-unit.json'), 'utf8')), b1J = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'unwire-b1-rerun.json'), 'utf8'));
const r1 = (extJ.results.find(r => r.id === 'R1') || {}).detail || {};

// 4) 게이트·가드·지표·npm test(기준/작업)
const gate = run('verify-integrity-gate', [NODE, 'scripts/verify-integrity-gate.js'], WORK);
const guard = run('module-guard', [NODE, 'scripts/module-guard.js'], WORK);
const metric = dir => { const r = run('module-metrics(' + (dir === WORK ? '작업' : '기준') + ')', [NODE, 'scripts/module-metrics.js'], dir); try { return JSON.parse(r.stdout).ratchet; } catch (_) { return null; } };
const mWork = metric(WORK), mBase = metric(BASE);
function npmTest(dir, name) {
  const r = run('npm test(' + name + ')', ['npm', 'test'], dir, { shell: true });
  const text = r.stdout + '\n' + r.stderr;
  fs.writeFileSync(path.join(RAW, 'npm-test.' + name + '.log'), text, 'utf8');
  const lines = text.split('\n');
  return { exitCode: r.status, checkLines: lines.filter(l => /✓/.test(l)).length, okLines: lines.filter(l => /^\s*ok\b/.test(l)).length, failLines: lines.filter(l => /✗|\bFAIL\b|not ok/.test(l)).length, summaryLines: lines.filter(l => /통과|passed|검증 결과|COMPLETE/.test(l)).map(l => l.trim()).filter(Boolean) };
}
const tBase = npmTest(BASE, 'base'), tWork = npmTest(WORK, 'work');
const sameSummary = JSON.stringify(tBase.summaryLines) === JSON.stringify(tWork.summaryLines);

const out = {
  schema: 'ourgoal.measurement/1', taskId: 'TASK-ES-619', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform },
  sourceCommit: { workHead: head, originMain: main, baseTreeHead: baseHead },
  summary: {
    changedFiles: changed,
    protectedChanged: { count: protectedChanged.length, files: protectedChanged, note: '제품 코드(js/** · index.html) · tests/ · 금고 · 지시함 · 생성 지도' },
    generator,
    unit: { ext: { ok: extJ.ok, passed: extJ.passed, total: extJ.total, exitCode: ext.status }, b1Rerun: { ok: b1J.ok, passed: b1J.passed, total: b1J.total, exitCode: b1.status } },
    sixteenVsOne: { pin: r1.pin, runs: r1.runs, stepsSame: r1.stepsSame, multiStatus: r1.multiStatus, bytesSequential: r1.bytes && r1.bytes[0], bytesMulti: r1.bytes && r1.bytes[1], same: !!(r1.bytes && r1.bytes[0] === r1.bytes[1] && (extJ.results.find(r => r.id === 'R1') || {}).ok), htmlLines: r1.htmlLines, deletedLinesTotal: (r1.deletedByRun || []).reduce((a, b) => a + b, 0), planExpectedTotal: (r1.expectedByRun || []).reduce((a, b) => a + b, 0) },
    integrityGate: { exitCode: gate.status, resultLine: (gate.stdout.split('\n').find(l => /검증 결과/.test(l)) || '').trim() },
    moduleGuard: { exitCode: guard.status, lastLine: guard.stdout.trim().split('\n').pop() },
    inlineScriptLines: { base: mBase && mBase.inlineScriptLines, work: mWork && mWork.inlineScriptLines, same: !!(mBase && mWork && mBase.inlineScriptLines === mWork.inlineScriptLines) },
    npmTest: { base: tBase, work: tWork, same: tBase.exitCode === 0 && tWork.exitCode === 0 && tBase.checkLines === tWork.checkLines && tBase.okLines === tWork.okLines && sameSummary, sameSummary }
  },
  evidence: { extUnit: 'reports/TASK-ES-619/unwire-ext-unit.json', b1Rerun: 'reports/TASK-ES-619/unwire-b1-rerun.json', npmLogs: ['reports/TASK-ES-619/raw/npm-test.base.log', 'reports/TASK-ES-619/raw/npm-test.work.log'] },
  commands,
  limits: ['법정 판정이 아니다. 단위 시험은 저장소 밖 임시 폴더의 사본에서 생성기를 돌린 것이며 저장소 index.html 은 바뀌지 않았다.', '실제 철거(이 확장으로 지울 이름을 고르는 일·시험이 붙잡는 이름 제외·화면 시나리오)는 이 PR 에 없다 — 철거 PR 이 자기 측정으로 한다.', '브라우저 시나리오는 돌리지 않았다(제품 코드 변경 0 이라 대상이 없다).']
};
fs.writeFileSync(path.join(OUT_DIR, 'measurement.json'), JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify({ protectedChanged: protectedChanged.length, generator: { pre, suf, baseRegion: generator.baseChangedRegion.firstLine + '~' + generator.baseChangedRegion.lastLine, movePathLinesChanged: generator.movePathLinesChanged }, unit: out.summary.unit, sixteenVsOne: out.summary.sixteenVsOne, gate: gate.status, guard: guard.status, inline: out.summary.inlineScriptLines, npm: { base: [tBase.exitCode, tBase.checkLines, tBase.okLines], work: [tWork.exitCode, tWork.checkLines, tWork.okLines], same: out.summary.npmTest.same } }, null, 1));
