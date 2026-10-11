#!/usr/bin/env node
'use strict';
// #TASK-ES-620 측정 모음(작업자 측정, 판정 아님) — 측정 도구들이 저장소 밖에 낸 결과 파일을 읽어 reports/<작업번호>/measurement.json 한 장으로 묶는다.
// 이 파일은 옮겨 적고, 두 결과가 같은지 맞대어 보기만 한다(수·목록은 각 도구의 산출 그대로). 큰 결과(시험 파일 113개의 종료 코드 등)는 요약과 「달라진 것」만 싣는다.
//   run-plain.cjs          → runs.<이름>: npm test 종료 코드·✓ 줄·ok 줄, 스크립트별 종료 코드·✗ 제목, 실패한 시험 파일 목록
//   run-asserts.cjs        → softAsserts.<이름>: 실패 단언 줄 수(던지지 않는 단언으로 센 것)
//   broken-assertions.cjs  → reports/<작업번호>/broken-assertions.json (고치기 전 시험지로 모의 철거 사본에서만 실패하는 단언 줄)
//   court-sandbox-run.cjs  → courtSandbox.<이름>
//   control-group.cjs      → reports/<작업번호>/control-group.json
// 사용: node reports/TASK-ES-620/measure.cjs <결과 폴더> <작업 폴더> <작업번호> --base <기준 커밋> --pairs <a>:<b>,…
//   --pairs: 「main 쪽 이름:모의 철거 쪽 이름」 — 같은 시험지를 얹은 두 트리. 모의 철거 쪽에서만 실패하는 단언 줄을 remaining 에 적는다.
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2);
const RAW = path.resolve(argv[0]), WT = path.resolve(argv[1]), TASK = argv[2];
const opt = (k, d) => (argv.indexOf(k) >= 0 ? argv[argv.indexOf(k) + 1] : d);
const BASE = opt('--base', null), PAIRS = opt('--pairs', '').split(',').filter(Boolean).map(s => s.split(':'));
const DIR = path.join(WT, 'reports', TASK);
const rj = f => JSON.parse(fs.readFileSync(path.join(RAW, f), 'utf8'));
const has = f => fs.existsSync(path.join(RAW, f));
const names = [...new Set(fs.readdirSync(RAW).map(f => /^plain-(.+)\.json$/.exec(f)).filter(Boolean).map(m => m[1]))].sort();
const out = { tool: 'reports/' + TASK + '/measure.cjs', type: '작업자 측정, 판정 아님 — 각 측정 도구의 산출을 옮겨 적은 것', task: TASK, measuredAt: new Date().toISOString(), baseCommit: BASE,
  note: '트리 이름: main-before(기준 커밋 그대로) · main-after(#TASK-ES-620 시험지) · main-gate(#TASK-ES-623 게이트만) · main-both(둘 다) · mock-*(같은 시험지 + 배선을 전부 지운 index.html — reports/TASK-ES-620/mock-unwire-all.json). 원시 결과 파일은 저장소 밖 작업자 PC 임시 폴더에 있다.',
  runs: {}, softAsserts: {}, remaining: {}, courtSandbox: {} };
for (const n of names) {
  const p = rj('plain-' + n + '.json');
  out.runs[n] = { label: p.label, scope: p.scope || 'npm test 경로 + 그 밖의 scripts/test-*.js + tests/*.test.js 전부', npmTest: { exit: p.npmTest.exit, checkLines: p.npmTest.checkLines, okLines: p.npmTest.okLines, failLines: p.npmTest.failLines },
    scripts: p.scripts.map(s => ({ script: s.script, exit: s.exit, checkLines: s.checkLines, okLines: s.okLines, fails: s.fails })),
    otherScripts: p.otherScripts ? { count: p.otherScripts.length, failed: p.otherScripts.filter(t => t.exit !== 0).map(t => ({ script: t.script, exit: t.exit, tail: t.tail })) } : null,
    testFiles: p.testFiles ? { count: p.testFiles.length, exit0: p.testFiles.filter(t => t.exit === 0).length, failed: p.testFiles.filter(t => t.exit !== 0).map(t => t.file) } : null };
  if (has('asserts-' + n + '.json')) { const a = rj('asserts-' + n + '.json'); out.softAsserts[n] = { entries: a.summary.entries, testFiles: a.summary.testFiles, failedAssertLines: a.summary.failedAssertLines }; }
  if (has('court-sandbox-' + n + '.json')) { const c = rj('court-sandbox-' + n + '.json'); out.courtSandbox[n] = { label: c.label, runners: c.runners.map(r => ({ file: r.file, exit: r.exit, isolated: r.isolated, watched: r.watched, passed: r.passed, failed: r.failed, failedTitles: r.failedTitles, death: r.death && r.death.line })) }; }
}
const key = f => f.file + ':' + f.line + ':' + f.message;
for (const [a, b] of PAIRS) {
  if (!has('asserts-' + a + '.json') || !has('asserts-' + b + '.json')) { out.remaining[a + '__' + b] = null; continue; }
  const A = rj('asserts-' + a + '.json'), B = rj('asserts-' + b + '.json');
  const inA = new Set(A.failedAssertsUnique.map(key)), inB = new Set(B.failedAssertsUnique.map(key));
  const only = B.failedAssertsUnique.filter(f => !inA.has(key(f)));
  out.remaining[a + '__' + b] = { failingOnlyInMock: only.length, failingOnlyInMain: A.failedAssertsUnique.filter(f => !inB.has(key(f))).length, byFile: only.reduce((m, f) => { m[f.file] = (m[f.file] || 0) + 1; return m; }, {}),
    rows: only.map(f => ({ file: f.file, line: f.line, check: f.check, message: f.message, assertion: f.src })) };
}
// 같은 시험지끼리 실패한 시험 파일 목록 비교(종료 코드 기준)
const sameFailed = (a, b) => (out.runs[a] && out.runs[b] && out.runs[a].testFiles && out.runs[b].testFiles ? JSON.stringify(out.runs[a].testFiles.failed) === JSON.stringify(out.runs[b].testFiles.failed) : null);
const R = n => out.runs[n] || null;
const brief = n => (R(n) ? { npmTestExit: R(n).npmTest.exit, npmTestCheckLines: R(n).npmTest.checkLines, npmTestOkLines: R(n).npmTest.okLines, smoke: R(n).scripts[0] && { exit: R(n).scripts[0].exit, checkLines: R(n).scripts[0].checkLines, fails: R(n).scripts[0].fails.length },
  gate: R(n).scripts[1] && { exit: R(n).scripts[1].exit, checkLines: R(n).scripts[1].checkLines, fails: R(n).scripts[1].fails.length }, testFiles: R(n).testFiles && { count: R(n).testFiles.count, exit0: R(n).testFiles.exit0 } } : null);
// 고친 시험지에서 새로 실패한 시험 파일(고치기 전 목록에 없던 것) — 새 시험 파일이 더해져 목록 길이는 달라질 수 있어 「새로 실패한 것」만 센다
const newlyFailed = (a, b) => (R(a) && R(b) && R(a).testFiles && R(b).testFiles ? R(b).testFiles.failed.filter(f => !R(a).testFiles.failed.includes(f)) : null);
const nz = (n, f) => (R(n) ? f(R(n)) : null);
out.summary = { runs: names.reduce((m, n) => { m[n] = brief(n); return m; }, {}),
  // 같은지 비교만 한 값(주장 파일이 가리키기 쉽게 한 칸씩)
  compare: {
    mainNpmTestExitBefore: nz('main-before', r => r.npmTest.exit), mainNpmTestExitAfter: nz('main-after', r => r.npmTest.exit),
    mainCheckLinesBefore: nz('main-before', r => r.npmTest.checkLines), mainCheckLinesAfter: nz('main-after', r => r.npmTest.checkLines),
    mainOkLinesBefore: nz('main-before', r => r.npmTest.okLines), mainOkLinesAfter: nz('main-after', r => r.npmTest.okLines),
    mainTestFilesNewlyFailedAfter: newlyFailed('main-before', 'main-after'),
    mockSmokeFailsBefore: nz('mock-before', r => r.scripts[0].fails.length), mockSmokeFailsAfter: nz('mock-after', r => r.scripts[0].fails.length),
    mockSmokeCheckLinesBefore: nz('mock-before', r => r.scripts[0].checkLines), mockSmokeCheckLinesAfter: nz('mock-after', r => r.scripts[0].checkLines),
    mockGateFailsBefore: nz('mock-before', r => r.scripts[1].fails.length), mockGateFailsAfter: nz('mock-after', r => r.scripts[1].fails.length),
    mockTestFilesFailedBefore: nz('mock-before', r => r.testFiles.failed.length), mockTestFilesFailedAfter: nz('mock-after', r => r.testFiles.failed.length),
    mockAfterFailedTestFilesSameAsMainAfter: sameFailed('main-after', 'mock-after'),
    bothMainNpmTestExit: nz('main-both', r => r.npmTest.exit), bothMockNpmTestExit: nz('mock-both', r => r.npmTest.exit),
    bothMockCheckLines: nz('mock-both', r => r.npmTest.checkLines), bothMainCheckLines: nz('main-both', r => r.npmTest.checkLines),
    bothMockFailedTestFilesSameAsMain: sameFailed('main-both', 'mock-both'),
    gateOnlyMainNpmTestExit: nz('main-gate', r => r.npmTest.exit), gateOnlyMainGateCheckLines: nz('main-gate', r => r.scripts[1].checkLines), gateOnlyMainGateFails: nz('main-gate', r => r.scripts[1].fails.length),
    gateOnlyMockGateCheckLines: nz('mock-gate', r => r.scripts[1].checkLines), gateOnlyMockGateFails: nz('mock-gate', r => r.scripts[1].fails.length),
    bothMockGateCheckLines: nz('mock-both', r => r.scripts[1].checkLines), bothMockGateFails: nz('mock-both', r => r.scripts[1].fails.length),
  },
  remaining: Object.keys(out.remaining).reduce((m, k) => { m[k] = out.remaining[k] ? out.remaining[k].failingOnlyInMock : null; return m; }, {}),
  courtSandbox: Object.keys(out.courtSandbox).reduce((m, k) => { const s = out.courtSandbox[k].runners; m[k] = s.map(r => ({ file: r.file, isolated: r.isolated, watched: r.watched, passed: r.passed, failed: r.failed })); return m; }, {}),
  courtSandboxSmokeFailedTitlesSame: { mockAfterVsMainBefore: out.courtSandbox['mock-after'] && out.courtSandbox['main-before'] ? JSON.stringify(out.courtSandbox['mock-after'].runners[0].failedTitles) === JSON.stringify(out.courtSandbox['main-before'].runners[0].failedTitles) : null,
    mockBothVsMainBefore: out.courtSandbox['mock-both'] && out.courtSandbox['main-before'] ? JSON.stringify(out.courtSandbox['mock-both'].runners[0].failedTitles) === JSON.stringify(out.courtSandbox['main-before'].runners[0].failedTitles) : null,
    gateMockBothFailed: out.courtSandbox['mock-both'] ? out.courtSandbox['mock-both'].runners[1].failed : null } };
for (const f of ['broken-assertions.json', 'control-group.json', 'changed-assertions.json', 'mock-unwire-all.json']) if (fs.existsSync(path.join(DIR, f))) { const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); out.summary[f.replace('.json', '')] = j.summary || { deletedLinesTotal: j.deletedLinesTotal, before: j.before, after: j.after, registeredStillWired: j.registeredStillWired && j.registeredStillWired.count, droppedByGenerator: j.passes && j.passes.reduce((a, p) => a + p.dropped.length, 0), runs: j.passes && j.passes.length }; }
// 이 변경이 바꾼 파일의 범위(기준 커밋 대비 — 커밋한 것 + 아직 커밋하지 않은 것 + 새 파일. 작업 폴더 안의 작업계획서 .claude/ 는 커밋하지 않으므로 뺀다)
{
  const cp = require('child_process');
  const git = args => cp.execFileSync('git', ['-c', 'core.quotepath=false'].concat(args), { cwd: WT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n').map(s => s.trim()).filter(Boolean);
  const files = [...new Set(git(['diff', '--name-only', BASE]).concat(git(['ls-files', '--others', '--exclude-standard'])))].filter(f => !f.startsWith('.claude/')).sort();
  const PRODUCT = /^(index\.html$|[^/]+\.html$|js\/|css\/|api\/|ui\.js$|ui\.css$|sw\.js$|manifest\.|icons\/|android\/|sim\/|capacitor\.config\.json$|docs\/sql\/)/;
  const GUARDED = /^(court\/|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|\.agent\/rules\/|docs\/rules\/(OURGOAL_ABSOLUTE_INTEGRITY_RULES|CONSTITUTION_VERSIONS|ESSENCE_OURGOAL)\.md$|docs\/rules\/rules(-control)?\.json$|docs\/rules\/branch-protection|docs\/rules\/archive\/|\.github\/|\.githooks\/|scripts\/essence-gate\.js$|scripts\/install-essence-gate\.js$|scripts\/verify-integrity-gate\.js$|scripts\/hook-smoke-on-index\.js$|\.claude\/settings\.json$|\.vercelignore$|\.gitattributes$|package\.json$|vercel\.json$|docs\/directives\/|docs\/design\/harness\/module-split\/)/;
  const TESTS = /^(scripts\/smoke-test\.js$|scripts\/verify-all-clicks\.js$|scripts\/test-[^/]*\.js$|tests\/)/;
  out.changedScope = { base: BASE, all: files, product: files.filter(f => PRODUCT.test(f)), vaultCourtConstitutionDirectivesGenerator: files.filter(f => GUARDED.test(f)), tests: files.filter(f => TESTS.test(f)),
    docsAndReports: files.filter(f => !PRODUCT.test(f) && !GUARDED.test(f) && !TESTS.test(f)) };
}
// 서류를 다 쓴 뒤 npm test 를 전경으로 끝까지 돌린 원시 로그(reports/<작업번호>/raw/npm-test.<이름>.log · .exit)의 종료 코드와 줄 수를 옮겨 적는다
{
  const rawDir = path.join(DIR, 'raw');
  out.rawNpmTestLogs = {};
  if (fs.existsSync(rawDir)) for (const e of fs.readdirSync(rawDir).filter(n => /^npm-test\..+\.exit$/.test(n)).sort()) {
    const name = e.replace(/^npm-test\./, '').replace(/\.exit$/, ''), L = fs.readFileSync(path.join(rawDir, 'npm-test.' + name + '.log'), 'utf8').split(/\r?\n/);
    out.rawNpmTestLogs[name] = { log: 'reports/' + TASK + '/raw/npm-test.' + name + '.log', exit: Number(fs.readFileSync(path.join(rawDir, e), 'utf8').trim()), checkLines: L.filter(l => /^\s*✓ /.test(l)).length, okLines: L.filter(l => /^\s*ok · /.test(l)).length, failLines: L.filter(l => /^\s*(✗|✖|not ok)/.test(l)).length };
  }
}
fs.mkdirSync(DIR, { recursive: true });
fs.writeFileSync(path.join(DIR, 'measurement.json'), JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify(out.summary, null, 1));
