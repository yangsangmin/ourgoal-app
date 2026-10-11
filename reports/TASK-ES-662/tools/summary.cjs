'use strict';
// 단위 시험 결과 요약 + 바뀐 파일 분류 + npm test 비교 + 「남은 것」·「깨지는 것」 표의 요약 값(작업자 측정, 판정 아님).
// 사용: node summary.cjs <작업 트리> <raw 폴더(npm-test.{base,work}.{log,exit})>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [WORK_ARG, RAW] = process.argv.slice(2);
const WORK = path.resolve(WORK_ARG), DIR = path.join(WORK, 'reports', 'TASK-ES-662');
const rj = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const wj = (f, o) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' });
const u = rj(path.join(DIR, 'finalize-unit.json'));
const by = id => u.results.find(r => r.id === id) || { ok: false, detail: null };
const ids = p => u.results.filter(r => p.test(r.id));
const all = (p, n) => ids(p).length === n && ids(p).every(r => r.ok);
const b = by('B'), bd = b.detail || {}, i657 = bd.inner657 || {}, r643 = i657.region643 || {};
const gap = rj(path.join(DIR, 'finalize-gap.json')), rx = rj(path.join(DIR, 'iife-gone-reactions.json')), mock = rj(path.join(DIR, 'mock-checks.json'));
const A = gap.afterRegion, st = A.others.byStage;
wj('unit-summary.json', { type: '작업자 측정, 판정 아님', source: 'reports/TASK-ES-662/finalize-unit.json', total: u.total, passed: u.passed, ok: u.ok,
  earlierSuites: { ok: b.ok, sweep661: { total: bd.total, passed: bd.passed, failed: bd.failed }, fnArguments657: { total: i657.total, passed: i657.passed, failed: i657.failed }, region643: { total: r643.total, passed: r643.passed, failed: r643.failed },
    unstate634: r643.innerB && (r643.innerB.passed + '/' + r643.innerB.total), unwireExt619: r643.innerB && r643.innerB.ext619, unwireB1: r643.innerB && r643.innerB.b1,
    onlyShapeChecksFailed: JSON.stringify(bd.failed) === '["D0"]' && JSON.stringify(i657.failed) === '["D1"]' && JSON.stringify(r643.failed) === '["D0"]',
    why: '661 의 D0 · 657 의 D1 · 643 의 D0 는 생성기 파일의 diff 모양을 옛 기준과 맞대는 검사다. 생성기에 줄을 더하면 구조적으로 거짓이 된다(출력 비교가 아니다 — 경험칙 L110). 그 시험 파일은 고치지 않았다. 661 의 D0 가 함께 보는 「끼워 넣은 줄이 한 자리에 이어져 있다」(commonHead + commonTail = 기준 줄 수)는 여전히 참이다.' },
  generatorDiff: { ok: by('D0').ok, detail: by('D0').detail },
  preconditionMet: ids(/^F\d/).map(r => ({ id: r.id, ok: r.ok })), allPreconditionMetOk: all(/^F\d/, 6),
  vmEquivalence: ids(/^E\d/).map(r => ({ id: r.id, ok: r.ok })), allVmEquivalenceOk: all(/^E\d/, 2),
  stops: ids(/^S\d/).map(r => ({ id: r.id, ok: r.ok })), allStopsOk: all(/^S\d/, 31),
  realIndexStops: { ok: by('R1').ok, count: by('R1').detail && by('R1').detail.count, kinds: by('R1').detail && by('R1').detail.kinds },
  rerunStops: by('R2').ok, audit: { ok: by('A').ok, cases: by('A').detail && by('A').detail.count },
  bootFileLoadOne: by('L').detail && by('L').detail.loadOne });
// 「남은 것」 · 「깨지는 것」 요약(표의 수를 주장에 걸 수 있게 한 곳에 모은다)
wj('gap-summary.json', { type: '작업자 측정, 판정 아님', source: ['reports/TASK-ES-662/finalize-gap.json', 'reports/TASK-ES-662/iife-gone-reactions.json', 'reports/TASK-ES-662/mock-checks.json'], baseHead: mock.baseHead,
  now: { topStatements: gap.now.topStatements, iifeLines: gap.now.iifeLines, insidePrecondition: A.finalizeOk.kitHandles + A.finalizeOk.regionFunctionImports + A.finalizeOk.regionFunctionCalls, outsidePrecondition: gap.now.topStatements - (A.finalizeOk.kitHandles + A.finalizeOk.regionFunctionImports + A.finalizeOk.regionFunctionCalls), regionPlanned: gap.now.regionPlan.statements, byKind: gap.now.byKind.map(k => ({ kind: k.kind, statements: k.statements, lines: k.lines, regionPlanned: k.regionPlanned, left: k.left })) },
  afterRegion: { topStatements: A.topStatements, sumOk: A.sumCheck.ok, importsSumOk: A.imports.sumOk, finalizeOk: A.finalizeOk,
    imports: { total: A.imports.total, regionFunction: A.imports.regionFunction, unwireReady: A.imports.unwireReady.count, deadImport: A.imports.deadImport.count, needRegister: A.imports.needRegister.count, usedByFunction: A.imports.usedByFunction.count, usedByFunctionNotRegistered: A.imports.usedByFunction.notRegistered.length, usedByOther: A.imports.usedByOther.count },
    expose: { statements: A.expose.statements, getters: A.expose.getters }, functionDecls: A.functionDecls.map(f => ({ name: f.name, lines: f.lines, iifeNamesUsed: f.iifeNamesUsed })),
    others: { statements: A.others.statements, decisionNeeded: (st['결심 필요'] || {}).statements || 0, methodUndetermined: (st['방법 미정'] || {}).statements || 0, stateMove: (st['상태 이전(막는 코드가 옮겨진 뒤)'] || {}).statements || 0, stateThenRegion: (st['상태 이전 뒤 구역 이전'] || {}).statements || 0 } },
  beforeRegionMerge: mock.beforeRegionMerge, emptyMockBoots: mock.emptyMock.bootScenario.allPassedBoth,
  iifeGone: { toolsDead: rx.toolsDead, toolsFine: rx.toolsFine, testsChanged: rx.tests.changedCount, testsNewlyFailing: rx.tests.newlyFailing, testFiles: rx.tests.list.map(t => t.file) } });
const npm = {};
for (const label of ['base', 'work']) {
  const log = fs.readFileSync(path.join(RAW, 'npm-test.' + label + '.log'), 'utf8'), exit = Number(fs.readFileSync(path.join(RAW, 'npm-test.' + label + '.exit'), 'utf8').replace(/[^0-9]/g, ''));
  fs.mkdirSync(path.join(DIR, 'raw'), { recursive: true });
  fs.writeFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.log'), log, { encoding: 'utf8' }); fs.writeFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), 'exit=' + exit + '\n', { encoding: 'utf8' });
  const ls = log.split(/\r?\n/);
  npm[label] = { exit, checkLines: ls.filter(l => /^\s*✓/.test(l)).length, okLines: ls.filter(l => /^\s*ok\b/.test(l)).length, summaryLines: ls.filter(l => /\d+개 통과, \d+개 실패|총 \d+개 검사 중 \d+개 통과|ALL PASS|100% COMPLETE/.test(l)).map(l => l.trim()) };
}
npm.allSame = npm.base.exit === npm.work.exit && npm.base.checkLines === npm.work.checkLines && npm.base.okLines === npm.work.okLines && JSON.stringify(npm.base.summaryLines) === JSON.stringify(npm.work.summaryLines);
const mb = cp.execFileSync('git', ['merge-base', 'origin/main', 'HEAD'], { cwd: WORK, encoding: 'utf8' }).trim();
const uniq = [...new Set(cp.execFileSync('git', ['diff', '--name-only', mb], { cwd: WORK, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  .concat(cp.execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: WORK, encoding: 'utf8' }).trim().split('\n').filter(Boolean)))].sort();
wj('measurement.json', { task: 'TASK-ES-662', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), base: mb, note: 'changed 는 이 브랜치가 origin/main 과 갈라진 뒤 바꾼 파일이다(합친 main 의 변경은 빼고 센다).',
  changed: { all: uniq, productFiles: uniq.filter(f => f === 'index.html' || f.startsWith('js/') || /^ui\.(js|css)$/.test(f) || f === 'sw.js'), testsChanged: uniq.filter(f => f.startsWith('tests/')),
    vaultChanged: uniq.filter(f => /^(court\/|\.github\/|\.githooks\/|AGENTS\.md|CLAUDE\.md|GEMINI\.md|01_OURGOAL|package\.json|vercel\.json|scripts\/(essence-gate|verify-integrity-gate)\.js|docs\/rules\/(OURGOAL_ABSOLUTE|CONSTITUTION_VERSIONS|ESSENCE_OURGOAL|rules)|docs\/directives\/)/.test(f)),
    harnessChanged: uniq.filter(f => f.startsWith('docs/design/harness/')), scriptsChanged: uniq.filter(f => f.startsWith('scripts/')), generatedMapsChanged: uniq.filter(f => /docs\/architecture\/(cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md|module-baseline\.json|modules\.json)/.test(f)) },
  npmTest: npm });
console.log(JSON.stringify({ unit: [u.total, u.passed, u.ok], earlier: [bd.failed, i657.failed, r643.failed], npm: [npm.base.exit, npm.work.exit, npm.base.checkLines, npm.work.checkLines, npm.allSame], product: uniq.filter(f => f === 'index.html' || f.startsWith('js/')), tests: uniq.filter(f => f.startsWith('tests/')), harness: uniq.filter(f => f.startsWith('docs/design/harness/')), all: uniq.length }));
