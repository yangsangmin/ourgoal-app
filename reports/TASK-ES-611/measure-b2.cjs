#!/usr/bin/env node
'use strict';
// B2 측정 기록 생성기(작업자 측정, 판정 아님). 값은 전부 스크립트 산출·결과 파일에서 읽는다 — 손으로 옮긴 수치 0.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-611/measure-b2.cjs <작업 트리> <기준 트리(origin/main 임시 worktree)>
//   module-load.json · npm-test-compare.json · measurement.json 을 이 폴더에 쓴다.
//   먼저 있어야 하는 것: cell-registry-compare.json · provide-plan.json · scenario-local.json · raw/npm-test.{base,work}.log · raw/npm-test.{base,work}.exit
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const BASE = process.argv[3] ? path.resolve(process.argv[3]) : null;
if (!BASE) { console.error('사용: node measure-b2.cjs <작업 트리> <기준 트리>'); process.exit(2); }
const REL = path.relative(ROOT, __dirname).replace(/\\/g, '/');
const rj = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const commands = [];
function run(id, argv, cwd) {
  const t0 = new Date().toISOString();
  const r = cp.spawnSync(argv[0], argv.slice(1), { cwd: cwd || ROOT, encoding: 'utf8', env: process.env, shell: false, maxBuffer: 64 * 1024 * 1024 });
  commands.push({ id, argv, cwd: cwd || ROOT, startedAt: t0, endedAt: new Date().toISOString(), exitCode: r.status, signal: r.signal, spawnError: r.error ? String(r.error.message) : null, stdoutHead: (r.stdout || '').slice(0, 300), stderrHead: (r.stderr || '').slice(0, 300) });
  return r;
}
const git = (args, cwd) => run('git ' + args.slice(0, 2).join(' '), ['git'].concat(args), cwd);
const lines = s => s.trim().split('\n').map(x => x.trim()).filter(Boolean);
const sha = (root, f) => { try { return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex'); } catch (e) { return null; } };

// 1. 바뀐 파일(기준 = 기준 트리의 HEAD 커밋 대비 작업 트리 — 스테이징·커밋 여부와 무관)
const baseHead = git(['rev-parse', 'HEAD'], BASE).stdout.trim();
const workHead = git(['rev-parse', 'HEAD']).stdout.trim();
const numstat = lines(git(['diff', '--numstat', baseHead, '--']).stdout).map(l => { const [a, d, f] = l.split('\t'); return { file: f, insertions: Number(a), deletions: Number(d) }; });
const untracked = lines(git(['ls-files', '--others', '--exclude-standard']).stdout);
const product = numstat.filter(x => /^(js\/|index\.html$|ui\.js$|sw\.js$|.*\.css$)/.test(x.file));
const jsChanged = product.filter(x => /^js\/.*\.js$/.test(x.file));
const indexRow = numstat.find(x => x.file === 'index.html') || { insertions: 0, deletions: 0 };
const vaultRe = /^(court\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|\.agent\/rules\/|docs\/rules\/(OURGOAL_ABSOLUTE_INTEGRITY_RULES\.md|CONSTITUTION_VERSIONS\.md|ESSENCE_OURGOAL\.md|rules\.json|rules-control\.json|branch-protection.*\.json|archive\/)|\.github\/|\.githooks\/|scripts\/essence-gate\.js$|scripts\/verify-integrity-gate\.js$|scripts\/install-essence-gate\.js$|\.claude\/settings\.json$|package\.json$|vercel\.json$|\.vercelignore$|\.gitattributes$|docs\/directives\/)/;
const all = numstat.map(x => x.file).concat(untracked);

// 2. 등록 블록만 더했는가 — 바뀐 세포 파일마다 「작업 파일에서 등록 블록을 걷어 낸 글자 == 기준 파일 글자」(줄바꿈만 LF 로 맞춘다)
const MARK_BEGIN = '/* ==== [세포 등록 시작 · gen-cell-provide.js]';
const MARK_END = '/* ==== [세포 등록 끝] ==== */';
const lf = s => s.replace(/\r\n/g, '\n');
const appendOnly = { checked: 0, same: 0, differ: [], withSemicolonLine: [] };
for (const x of jsChanged) {
  const w = lf(fs.readFileSync(path.join(ROOT, x.file), 'utf8'));
  let b; try { b = lf(fs.readFileSync(path.join(BASE, x.file), 'utf8')); } catch (e) { appendOnly.differ.push({ file: x.file, why: '기준에 없는 파일' }); continue; }
  appendOnly.checked++;
  const i = w.indexOf(MARK_BEGIN), j = w.indexOf(MARK_END);
  if (i < 0 || j < 0 || w.slice(j + MARK_END.length).trim()) { appendOnly.differ.push({ file: x.file, why: '등록 블록 표지가 없거나 블록 뒤에 글자가 있다' }); continue; }
  let head = w.slice(0, i);
  if (head.endsWith('\n;\n')) { head = head.slice(0, -2); appendOnly.withSemicolonLine.push(x.file); }
  if (head === b || head === b + '\n') appendOnly.same++; else appendOnly.differ.push({ file: x.file, why: '등록 블록 밖 글자가 기준과 다르다' });
}

// 3. 줄 수 · 가드 · 인라인 줄 수
const mm = require(path.join(ROOT, 'scripts', 'module-metrics.js'));
const metrics = mm.measure(ROOT), baseMetrics = require(path.join(BASE, 'scripts', 'module-metrics.js')).measure(BASE);
const lineRows = jsChanged.map(x => ({ file: x.file, lines: mm.countLines(fs.readFileSync(path.join(ROOT, x.file), 'utf8')) })).sort((a, b) => b.lines - a.lines);
const guard = run('module-guard', [process.execPath, 'scripts/module-guard.js', '--quiet']);
const specsCheck = run('module-specs --check', [process.execPath, 'scripts/module-specs.js', '--check']);

// 4. 모듈 로드: 법정 탐침 CLI 와 같은 비교(js/ 바로 아래) + 바뀐 세포 파일 전부를 기준·작업에서 단독 로드
const ml = require(path.join(ROOT, 'court', 'probes', 'module-load.js'));
let indexHtml = null; try { indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'); } catch (e) { indexHtml = null; }
const cmp = ml.compare(ml.probeModules(BASE), ml.probeModules(ROOT), indexHtml);
const changedLoad = { files: 0, baseOk: 0, workOk: 0, regressions: [], bothFail: [], globalsDiffer: [] };
for (const x of jsChanged) {
  const b = ml.loadOne(path.join(BASE, x.file)), w = ml.loadOne(path.join(ROOT, x.file));
  changedLoad.files++; if (b.ok) changedLoad.baseOk++; if (w.ok) changedLoad.workOk++;
  if (b.ok && !w.ok) changedLoad.regressions.push({ file: x.file, error: w.error });
  else if (!b.ok && !w.ok) changedLoad.bothFail.push({ file: x.file, base: b.error, work: w.error });
  else if (b.ok && w.ok && JSON.stringify((b.globals || []).slice().sort()) !== JSON.stringify((w.globals || []).slice().sort())) changedLoad.globalsDiffer.push({ file: x.file, base: b.globals, work: w.globals });
}
const moduleLoad = { tool: 'court/probes/module-load.js (읽기 전용 — compare(probeModules(기준), probeModules(작업)) 는 CLI 와 같은 셈, loadOne 은 바뀐 세포 파일마다 단독 로드)', type: '작업자 측정, 판정 아님',
  base: baseHead, work: workHead + ' + 작업 트리', measuredAt: new Date().toISOString(),
  regressions: cmp.regressions.concat(changedLoad.regressions.map(r => ({ file: r.file, kind: 'LOAD_THROWS', detail: r.error }))), insufficient: cmp.insufficient, fixed: cmp.fixed, removed: cmp.removed, moved: cmp.moved, counts: cmp.counts,
  changedCellFiles: changedLoad };
fs.writeFileSync(path.join(__dirname, 'module-load.json'), JSON.stringify(moduleLoad, null, 1) + '\n', 'utf8');

// 5. npm test 로그 비교(전경으로 끝까지 돌린 원시 로그 두 개)
function readLog(label) {
  const f = REL + '/raw/npm-test.' + label + '.log';
  const txt = lf(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const L = txt.split('\n');
  const exitTxt = fs.readFileSync(path.join(ROOT, REL + '/raw/npm-test.' + label + '.exit'), 'utf8').trim();
  const norm = s => s.trim().replace(/\d+(\.\d+)?\s?ms\b/g, 'Nms').replace(/[A-Za-z]:[\\/][^\s"')]+/g, '<path>');
  const okLines = L.filter(l => /^\s*✓ /.test(l)).map(norm);
  const okDot = L.filter(l => /^\s*ok · /.test(l)).map(norm);
  const fail = L.filter(l => /^\s*(✗|✖|not ok|FAIL\b)/.test(l)).map(norm);
  const summary = L.filter(l => /(\d+개 통과|검증 결과|ALL PASS|COMPLETE|^\s*\[\d+\/\d+\]|\[검증 \d+\/\d+\])/.test(l)).map(norm);
  return { file: f, totalLines: L.length, ok: okLines.length, okDot: okDot.length, fail: fail.length, failLines: fail.slice(0, 20), exit: Number((/exit=(\d+)/.exec(exitTxt) || [])[1]), summaryTokens: summary, _checks: okLines.concat(okDot) };
}
const nb = readLog('base'), nw = readLog('work');
const multiset = a => { const m = {}; a.forEach(x => { m[x] = (m[x] || 0) + 1; }); return m; };
const mb = multiset(nb._checks), mw = multiset(nw._checks);
const onlyBase = Object.keys(mb).filter(k => (mw[k] || 0) < mb[k]), onlyWork = Object.keys(mw).filter(k => (mb[k] || 0) < mw[k]);
delete nb._checks; delete nw._checks;
const npmCmp = { tool: REL + '/measure-b2.cjs (작업자 측정)', base: nb, work: nw,
  sameSummaryTokens: JSON.stringify(nb.summaryTokens) === JSON.stringify(nw.summaryTokens), sameOkCount: nb.ok === nw.ok && nb.okDot === nw.okDot, sameExit: nb.exit === nw.exit,
  onlyBase, onlyWork };
npmCmp.same = npmCmp.sameSummaryTokens && npmCmp.sameOkCount && npmCmp.sameExit && nb.exit === 0 && !onlyBase.length && !onlyWork.length && nb.fail === 0 && nw.fail === 0;
fs.writeFileSync(path.join(__dirname, 'npm-test-compare.json'), JSON.stringify(npmCmp, null, 1) + '\n', 'utf8');

// 6. 결과 파일들
const scenario = rj(REL + '/scenario-local.json');
const compare = rj(REL + '/cell-registry-compare.json');
const planJ = rj(REL + '/provide-plan.json');
const scId = Object.keys(scenario.scenarios)[0], sc = scenario.scenarios[scId];
const missing = compare.report.missing;
const skippedNames = {}; planJ.skipped.forEach(s => { skippedNames[s.name] = s.reason; });
const iifeNames = {}; planJ.iifeOwned.forEach(s => { iifeNames[s.kind + ':' + s.name] = true; });
const missClass = { iifeOwned: 0, skippedByGenerator: 0, unexplained: [] };
missing.forEach(m => { if (iifeNames[m.kind + ':' + m.name]) missClass.iifeOwned++; else if (skippedNames[m.name]) missClass.skippedByGenerator++; else missClass.unexplained.push(m); });
// 계획과 실제 등록이 같은가(계획에 있는 이름이 전부 페이지에서 등록됐는가)
const regSet = {}; compare.registeredNames.forEach(n => { regSet[n] = true; });
const plannedNotRegistered = planJ.registered.filter(r => !regSet[r.name]).map(r => r.name);
const registeredNotPlanned = compare.registeredNames.filter(n => !planJ.registered.some(r => r.name === n));

const out = {
  schema: 'ourgoal.task-es-611.measurement/1', taskId: 'TASK-ES-611',
  type: '작업자 측정, 판정 아님 — 판정은 GitHub 법정(node court/chat.js <PR>)만 낸다',
  measuredAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, arch: process.arch, gitAutocrlf: git(['config', 'core.autocrlf']).stdout.trim() || null },
  sourceCommit: { baseTreeHead: baseHead, worktreeHead: workHead, note: '기준 = origin/main 을 임시 git worktree(저장소 밖)로 받은 것. 작업 = 이 트리(작업 트리 상태 그대로)' },
  summary: {
    changed: { productFiles: product.length, jsCellFiles: jsChanged.length, insertions: product.reduce((a, x) => a + x.insertions, 0), deletions: product.reduce((a, x) => a + x.deletions, 0),
      indexHtml: { insertions: indexRow.insertions, deletions: indexRow.deletions, netLineGrowth: indexRow.insertions - indexRow.deletions },
      testsChanged: all.filter(f => /^tests\//.test(f)), vaultChanged: all.filter(f => vaultRe.test(f)),
      generatedMapsChanged: all.filter(f => /^docs\/architecture\/(module-baseline\.json|cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md)$/.test(f)) },
    appendOnly: { checked: appendOnly.checked, same: appendOnly.same, differ: appendOnly.differ, withSemicolonLine: appendOnly.withSemicolonLine, allSame: appendOnly.checked > 0 && appendOnly.same === appendOnly.checked,
      note: '바뀐 세포 파일마다 등록 블록(표지 사이)을 걷어 낸 글자가 기준 파일 글자와 같은지(줄바꿈만 LF 로 맞춤). 같으면 세포의 기존 글자·함수 본문은 0 변경이다' },
    lines: { maxAfter: lineRows[0] || null, over800: lineRows.filter(r => r.lines > 800), top5: lineRows.slice(0, 5) },
    ratchet: { work: metrics.ratchet.inlineScriptLines, base: baseMetrics.ratchet.inlineScriptLines, inlineScriptLinesSame: metrics.ratchet.inlineScriptLines === baseMetrics.ratchet.inlineScriptLines,
      indexFunctionDecls: [baseMetrics.ratchet.indexFunctionDecls, metrics.ratchet.indexFunctionDecls], windowAssignments: [baseMetrics.ratchet.windowAssignments, metrics.ratchet.windowAssignments],
      oversizeJsFiles: [baseMetrics.ratchet.oversizeJsFiles.count, metrics.ratchet.oversizeJsFiles.count], crossTabRefs: [baseMetrics.ratchet.crossTabRefs, metrics.ratchet.crossTabRefs], source: 'scripts/module-metrics.js measure().ratchet — [기준, 작업]' },
    guard: { exitCode: guard.status, specsCheckExitCode: specsCheck.status },
    newGlobals: { globalsDiffer: changedLoad.globalsDiffer, count: changedLoad.globalsDiffer.length, note: '바뀐 세포 파일을 단독 로드했을 때 등록하는 전역 목록이 기준과 다른 파일(0 이면 새 전역 0)' },
    moduleLoad: { regressions: moduleLoad.regressions.length, insufficient: cmp.insufficient.length, insufficientNote: cmp.insufficient.map(i => i.file + ': ' + i.note), counts: cmp.counts,
      changedCellFiles: { files: changedLoad.files, baseOk: changedLoad.baseOk, workOk: changedLoad.workOk, regressions: changedLoad.regressions.length, bothFail: changedLoad.bothFail.length } },
    scenario: { id: scId, basePassed: sc.runs.base.passed, workPassed: sc.runs.work.passed, baseExceptions: (sc.runs.base.exceptions || []).length, workExceptions: (sc.runs.work.exceptions || []).length, nonVacuousExpects: sc.runs.work.nonVacuousExpects, allPassedBoth: scenario.allPassedBoth },
    compare: Object.assign({}, compare.counts, { guestBootOk: compare.ok, exceptions: compare.guestBoot.exceptions.length, consoleErrors: compare.guestBoot.consoleErrors.length, scopeGetterErrors: compare.oldPath.scopeGetterErrors.length, windowUndefined: compare.oldPath.windowUndefined.length,
      nonVacuous: compare.counts.registered > 0 && compare.counts.checked > 0, missingScope: missing.filter(m => m.kind === 'scope').length, missingWindow: missing.filter(m => m.kind === 'window').length, missingClass: missClass }),
    generator: { counts: planJ.counts, byKit: planJ.byKit, skipped: planJ.skipped, plannedNotRegistered, registeredNotPlanned, planMatchesPage: !plannedNotRegistered.length && !registeredNotPlanned.length },
    npmTest: { base: { exitCode: nb.exit, okLines: nb.ok, okDotLines: nb.okDot, failLines: nb.fail }, work: { exitCode: nw.exit, okLines: nw.ok, okDotLines: nw.okDot, failLines: nw.fail }, same: npmCmp.same, onlyBase: onlyBase.length, onlyWork: onlyWork.length, retired: 0 },
  },
  evidence: { claims: REL + '/claims.json', scenario: REL + '/scenarios/' + scId + '.json', scenarioLocal: REL + '/scenario-local.json', moduleLoad: REL + '/module-load.json', compare: REL + '/cell-registry-compare.json', plan: REL + '/provide-plan.json',
    npmCompare: REL + '/npm-test-compare.json', npmLogs: [REL + '/raw/npm-test.base.log', REL + '/raw/npm-test.work.log'], req: 'docs/specs/REQ-TASK-ES-611-CELL-REGISTRY-B2.md',
    fileSha256: { 'docs/design/harness/module-split/gen-cell-provide.js': sha(ROOT, 'docs/design/harness/module-split/gen-cell-provide.js'), 'index.html(작업)': sha(ROOT, 'index.html'), 'index.html(기준)': sha(BASE, 'index.html'), 'js/core/cell-registry.js(작업)': sha(ROOT, 'js/core/cell-registry.js'), 'js/core/cell-registry.js(기준)': sha(BASE, 'js/core/cell-registry.js') } },
  commands,
  limits: [
    '누락 ' + missing.length + ' 은 꾸미지 않은 측정값이다: IIFE 안에 정의가 남은 이름(세포 없음)과 생성기가 사유를 적고 건너뛴 이름이며, 목록은 provide-plan.json 의 iifeOwned · skipped 에 있다.',
    '대조는 게스트 부팅 직후 한 시점의 값을 본다. 로그인 뒤에 다시 대입되는 값이 있다면 이 측정으로는 알 수 없다(setter 달린 통로 이름은 그래서 등록하지 않았다).',
    '로드 중 호출 순서(callOrder)는 note() 기록이 없어 비교하지 않았다 — B10 전까지 측정불가.',
    '키트별 unwireReady · blockedByIifeRefs 는 글자(AST 참조) 분석이다. 실제 철거 가능 여부는 B3 부터 생성기 unwire 모드의 잔존 참조 정지와 화면 시나리오로 다시 잰다.',
    '시나리오·module-load·대조 탐침·npm test 는 로컬 실행(작업자 측정)이다. 법정 판정은 PR 에서 node court/chat.js 가 낸다.',
  ],
};
fs.writeFileSync(path.join(__dirname, 'measurement.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ changed: out.summary.changed.jsCellFiles, appendOnly: out.summary.appendOnly.allSame, differ: appendOnly.differ.length, over800: out.summary.lines.over800.length, inline: [out.summary.ratchet.base, out.summary.ratchet.work], guard: guard.status,
  moduleLoad: out.summary.moduleLoad, scenario: [sc.runs.base.passed, sc.runs.work.passed], compare: compare.counts, missClass, planMatchesPage: out.summary.generator.planMatchesPage, npm: out.summary.npmTest, tests: out.summary.changed.testsChanged, vault: out.summary.changed.vaultChanged, maps: out.summary.changed.generatedMapsChanged }));
