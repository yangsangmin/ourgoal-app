'use strict';
// #TASK-ES-634 측정 기록 생성 — 작업자 측정, 판정 아님. 명령·종료 코드·수치를 measurement.json 에 그대로 적는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-634/measure-634.cjs <작업 트리> <기준 트리(origin/main 을 푼 임시 worktree)>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const WORK = path.resolve(process.argv[2]), BASE = path.resolve(process.argv[3]);
const OUT_DIR = path.join(WORK, 'reports', 'TASK-ES-634');
const RAW = path.join(OUT_DIR, 'raw');
fs.mkdirSync(RAW, { recursive: true });
const commands = [];
function run(id, argv, cwd, opts) {
  const startedAt = new Date().toISOString();
  const r = cp.spawnSync(argv[0], argv.slice(1), { cwd, encoding: 'utf8', maxBuffer: 1024 * 1024 * 256, env: process.env, shell: !!(opts && opts.shell) });
  commands.push({ id, argv, cwd, startedAt, endedAt: new Date().toISOString(), exitCode: r.status, signal: r.signal, spawnError: r.error ? String(r.error.message) : null, stdoutHead: (r.stdout || '').slice(0, 300), stderrHead: (r.stderr || '').slice(0, 300) });
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

// 2) 생성기 — 기존 줄은 한 줄도 바뀌지 않고 한 자리에 끼워 넣기만 했는가(앞뒤 공통 줄 수의 합 = 기준 줄 수)
const baseGen = run('git cat-file 기준 생성기', ['git', 'cat-file', '-p', 'origin/main:' + GEN], WORK).stdout.split('\n');
const workGen = fs.readFileSync(path.join(WORK, GEN), 'utf8').replace(/\r\n/g, '\n').split('\n');
let pre = 0; while (pre < baseGen.length && pre < workGen.length && baseGen[pre] === workGen[pre]) pre++;
let suf = 0; while (suf < baseGen.length - pre && suf < workGen.length - pre && baseGen[baseGen.length - 1 - suf] === workGen[workGen.length - 1 - suf]) suf++;
const inserted = workGen.slice(pre, workGen.length - suf);
const generator = {
  baseLines: baseGen.length, workLines: workGen.length, commonPrefixLines: pre, commonSuffixLines: suf,
  insertOnly: pre + suf === baseGen.length,                       // 기준의 모든 줄이 그대로 남았다
  baseLinesChanged: baseGen.length - pre - suf,                   // 기준에서 바뀌거나 지워진 줄 수
  insertedLines: inserted.length,
  insertedAfter: (baseGen[pre - 1] || '').slice(0, 60),          // 끼워 넣은 자리 바로 앞 줄(= unwireOnce 의 닫는 중괄호)
  insertedBefore: (baseGen[pre] || '').slice(0, 60),             // 바로 뒤 줄
  insertedAfterUnwire: baseGen.slice(0, pre).some(l => l.startsWith('function unwireOnce(')) && (baseGen.slice(0, pre).filter(l => l.trim()).pop() || '') === '}', // 끼워 넣은 자리 앞의 마지막 글자 줄이 unwireOnce 의 닫는 중괄호
  insertedBeforeMovePath: baseGen.slice(pre).some(l => l.startsWith('// smoke-test FN_NAMES')),
  insertedFirst: (inserted.find(l => l.trim()) || '').slice(0, 90)
};

// 3) 단위 시험(계획 파일도 같이 쓴다)
const unit = run('unstate-check-634', [NODE, 'docs/design/harness/module-split/unstate-check-634.js', '.', 'reports/TASK-ES-634/unstate-unit.json', 'reports/TASK-ES-634/unstate-plan.json'], WORK);
const uJ = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'unstate-unit.json'), 'utf8')), plan = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'unstate-plan.json'), 'utf8'));
const byId = {}; for (const r of uJ.results) byId[r.id] = r.ok;
const bDetail = (uJ.results.find(r => r.id === 'B') || {}).detail || {};

// 4) 게이트·가드·지표·npm test(기준/작업)
const gate = run('verify-integrity-gate', [NODE, 'scripts/verify-integrity-gate.js'], WORK);
const guard = run('module-guard', [NODE, 'scripts/module-guard.js'], WORK);
const metric = dir => { const r = run('module-metrics(' + (dir === WORK ? '작업' : '기준') + ')', [NODE, 'scripts/module-metrics.js'], dir); try { return JSON.parse(r.stdout).ratchet; } catch (_) { return null; } };
const mWork = metric(WORK), mBase = metric(BASE);
function npmTest(dir, name) {
  const r = run('npm test(' + name + ')', ['npm', 'test'], dir, { shell: true });
  const text = r.stdout + '\n' + r.stderr;
  fs.writeFileSync(path.join(RAW, 'npm-test.' + name + '.log'), text, 'utf8');
  const ls = text.split('\n');
  return { exitCode: r.status, checkLines: ls.filter(l => /✓/.test(l)).length, okLines: ls.filter(l => /^\s*ok\b/.test(l)).length, summaryLines: ls.filter(l => /통과|passed|검증 결과|COMPLETE/.test(l)).map(l => l.trim()).filter(Boolean) };
}
const tBase = npmTest(BASE, 'base'), tWork = npmTest(WORK, 'work');
const sameSummary = JSON.stringify(tBase.summaryLines) === JSON.stringify(tWork.summaryLines);

const out = {
  schema: 'ourgoal.measurement/1', taskId: 'TASK-ES-634', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform },
  sourceCommit: { workHead: head, originMain: main, baseTreeHead: baseHead },
  summary: {
    changedFiles: changed,
    protectedChanged: { count: protectedChanged.length, files: protectedChanged, note: '제품 코드(js/** · index.html) · tests/ · 금고 · 지시함 · 생성 지도' },
    generator,
    unit: { ok: uJ.ok, passed: uJ.passed, total: uJ.total, exitCode: unit.status, byId, unwireExt619: { passed: bDetail.passed, total: bDetail.total, b1: bDetail.b1 } },
    plan: plan.totals ? Object.assign({ pin: plan.basis.pin }, plan.totals) : null,
    integrityGate: { exitCode: gate.status, resultLine: (gate.stdout.split('\n').find(l => /검증 결과/.test(l)) || '').trim() },
    moduleGuard: { exitCode: guard.status, lastLine: guard.stdout.trim().split('\n').pop() },
    inlineScriptLines: { base: mBase && mBase.inlineScriptLines, work: mWork && mWork.inlineScriptLines, same: !!(mBase && mWork && mBase.inlineScriptLines === mWork.inlineScriptLines) },
    npmTest: { base: tBase, work: tWork, same: tBase.exitCode === 0 && tWork.exitCode === 0 && tBase.checkLines === tWork.checkLines && tBase.okLines === tWork.okLines && sameSummary, sameSummary }
  },
  evidence: { unit: 'reports/TASK-ES-634/unstate-unit.json', plan: 'reports/TASK-ES-634/unstate-plan.json', npmLogs: ['reports/TASK-ES-634/raw/npm-test.base.log', 'reports/TASK-ES-634/raw/npm-test.work.log'] },
  commands,
  limits: ['법정 판정이 아니다. 단위 시험은 저장소 밖 임시 폴더의 사본에서 생성기를 돌린 것이며 저장소 index.html 은 바뀌지 않았다.', '모의 적용 사본의 앱 부팅·화면 동작은 재지 않았다(상태 기관 파일이 아직 없다 — 측정불가). 시험 V1 의 기관은 설계 계약대로 만든 견본이다.', '계획 파일의 대상 이름이 시험이 붙잡는 글자인지는 재지 않았다(이전 PR 이 잰다).']
};
fs.writeFileSync(path.join(OUT_DIR, 'measurement.json'), JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify({ protectedChanged: protectedChanged.length, generator: { pre, suf, insertOnly: generator.insertOnly, baseLinesChanged: generator.baseLinesChanged, inserted: inserted.length, afterUnwire: generator.insertedAfterUnwire, beforeMove: generator.insertedBeforeMovePath }, unit: [uJ.passed, uJ.total, uJ.ok], ext619: out.summary.unit.unwireExt619, plan: out.summary.plan, gate: gate.status, guard: guard.status, inline: out.summary.inlineScriptLines, npm: { base: [tBase.exitCode, tBase.checkLines, tBase.okLines], work: [tWork.exitCode, tWork.checkLines, tWork.okLines], same: out.summary.npmTest.same } }));
