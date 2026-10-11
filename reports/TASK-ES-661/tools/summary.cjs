'use strict';
// 단위 시험 결과 요약 + 바뀐 파일 분류 + npm test 비교(작업자 측정, 판정 아님).
// 사용: node summary.cjs <작업 트리> <기준 커밋> <raw 폴더(npm-test.{base,work}.{log,exit})>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [WORK_ARG, BASE_SHA, RAW] = process.argv.slice(2);
const WORK = path.resolve(WORK_ARG), DIR = path.join(WORK, 'reports', 'TASK-ES-661');
const rj = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const wj = (f, o) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' });
const u = rj(path.join(DIR, 'sweep-unit.json'));
const by = id => u.results.find(r => r.id === id) || { ok: false, detail: null };
const ids = p => u.results.filter(r => p.test(r.id));
const all = (p, n) => ids(p).length === n && ids(p).every(r => r.ok);
const b = by('B'), bd = b.detail || {}, r1 = by('R1').detail || {};
wj('unit-summary.json', { type: '작업자 측정, 판정 아님', source: 'reports/TASK-ES-661/sweep-unit.json', total: u.total, passed: u.passed, ok: u.ok,
  earlierSuites: { ok: b.ok, fnArguments657: { total: bd.total, passed: bd.passed, failed: bd.failed }, region643: bd.region643 && { total: bd.region643.total, passed: bd.region643.passed, failed: bd.region643.failed },
    unstate634: bd.region643 && bd.region643.innerB && (bd.region643.innerB.passed + '/' + bd.region643.innerB.total), unwireExt619: bd.region643 && bd.region643.innerB && bd.region643.innerB.ext619, unwireB1: bd.region643 && bd.region643.innerB && bd.region643.innerB.b1,
    onlyShapeChecksFailed: Array.isArray(bd.failed) && bd.failed.length === 1 && bd.failed[0] === 'D1' && !!bd.region643 && bd.region643.failed.length === 1 && bd.region643.failed[0] === 'D0',
    why: '657 의 D1 은 「생성기 diff 의 새 줄이 #657 의 것뿐」, 643 의 D0 는 「#643 이전 생성기와의 차이가 한 자리에 끼워 넣은 줄뿐」이라는 모양 비교다. 생성기에 줄을 더하면 구조적으로 거짓이 된다(출력 비교가 아니다 — 경험칙 L110). 그 시험 파일은 고치지 않았다. D1 의 나머지 조건(기준에서 사라진 줄 1 · unwire·unstate·region 구간 동일)은 여전히 참이다.' },
  generatorDiff: { ok: by('D0').ok, detail: by('D0').detail },
  mergedRegenerated: ids(/^G\d/).map(r => ({ id: r.id, ok: r.ok, pr: r.detail && r.detail.pr, mode: r.detail && r.detail.mode })), allMergedRegeneratedByteSame: all(/^G\d/, 3),
  deletes: ids(/^W\d/).map(r => ({ id: r.id, ok: r.ok })), allDeletesOk: all(/^W\d/, 6),
  keeps: ids(/^K\d/).map(r => ({ id: r.id, ok: r.ok })), allKeepsOk: all(/^K\d/, 3),
  excluded: ids(/^P\d/).map(r => ({ id: r.id, ok: r.ok })), allExcludedOk: all(/^P\d/, 2),
  untouched: ids(/^N\d/).map(r => ({ id: r.id, ok: r.ok })), allUntouchedOk: all(/^N\d/, 3),
  multiStep: ids(/^M\d/).map(r => ({ id: r.id, ok: r.ok })), allMultiStepOk: all(/^M\d/, 2),
  stops: ids(/^S\d/).map(r => ({ id: r.id, ok: r.ok })), allStopsOk: all(/^S\d/, 21),
  realIndex: ids(/^R\d/).map(r => ({ id: r.id, ok: r.ok })), allRealIndexOk: all(/^R\d/, 4),
  realIndexMock: { pin: r1.pin, deleted: r1.meta && r1.meta.deleted, emptyGroups: r1.meta && r1.meta.emptyGroups, gapLinesBefore: r1.meta && r1.meta.gapLinesBefore, gapLinesAfter: r1.meta && r1.meta.gapLinesAfter, htmlLines: r1.meta && r1.meta.htmlLines, independentBefore: r1.independentBefore, independentAfter: r1.independentAfter },
  audit: { ok: by('A').ok, cases: by('A').detail && by('A').detail.count, removedByCase: by('A').detail && by('A').detail.removedByCase } });
const npm = {};
for (const label of ['base', 'work']) {
  const log = fs.readFileSync(path.join(RAW, 'npm-test.' + label + '.log'), 'utf8'), exit = Number(fs.readFileSync(path.join(RAW, 'npm-test.' + label + '.exit'), 'utf8').replace(/[^0-9]/g, ''));
  fs.mkdirSync(path.join(DIR, 'raw'), { recursive: true });
  fs.writeFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.log'), log, { encoding: 'utf8' }); fs.writeFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), 'exit=' + exit + '\n', { encoding: 'utf8' });
  const ls = log.split(/\r?\n/);
  npm[label] = { exit, checkLines: ls.filter(l => /^\s*✓/.test(l)).length, okLines: ls.filter(l => /^\s*ok\b/.test(l)).length, summaryLines: ls.filter(l => /\d+개 통과, \d+개 실패|총 \d+개 검사 중 \d+개 통과|ALL PASS|100% COMPLETE/.test(l)).map(l => l.trim()) };
}
npm.allSame = npm.base.exit === npm.work.exit && npm.base.checkLines === npm.work.checkLines && npm.base.okLines === npm.work.okLines && JSON.stringify(npm.base.summaryLines) === JSON.stringify(npm.work.summaryLines);
const ownOnly = cp.execFileSync('git', ['diff', '--name-only', cp.execFileSync('git', ['merge-base', 'origin/main', 'HEAD'], { cwd: WORK, encoding: 'utf8' }).trim()], { cwd: WORK, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  .concat(cp.execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: WORK, encoding: 'utf8' }).trim().split('\n').filter(Boolean));
const uniq = [...new Set(ownOnly)].sort();
wj('measurement.json', { task: 'TASK-ES-661', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), base: BASE_SHA, note: 'changed 는 이 브랜치가 origin/main 과 갈라진 뒤 바꾼 파일이다(합친 main 의 변경은 빼고 센다).',
  changed: { all: uniq, productFiles: uniq.filter(f => f === 'index.html' || f.startsWith('js/') || /^ui\.(js|css)$/.test(f) || f === 'sw.js'), testsChanged: uniq.filter(f => f.startsWith('tests/')),
    vaultChanged: uniq.filter(f => /^(court\/|\.github\/|\.githooks\/|AGENTS\.md|CLAUDE\.md|GEMINI\.md|01_OURGOAL|package\.json|vercel\.json|scripts\/(essence-gate|verify-integrity-gate)\.js|docs\/rules\/(OURGOAL_ABSOLUTE|CONSTITUTION_VERSIONS|ESSENCE_OURGOAL|rules)|docs\/directives\/)/.test(f)),
    harnessChanged: uniq.filter(f => f.startsWith('docs/design/harness/')), scriptsChanged: uniq.filter(f => f.startsWith('scripts/')), generatedMapsChanged: uniq.filter(f => /docs\/architecture\/(cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md|module-baseline\.json|modules\.json)/.test(f)) },
  npmTest: npm });
console.log(JSON.stringify({ unit: [u.total, u.passed, u.ok], earlier: [bd.total, bd.passed, bd.failed, bd.region643 && bd.region643.failed], npm: [npm.base.exit, npm.work.exit, npm.base.checkLines, npm.work.checkLines, npm.allSame], product: uniq.filter(f => f === 'index.html' || f.startsWith('js/')), tests: uniq.filter(f => f.startsWith('tests/')), harness: uniq.filter(f => f.startsWith('docs/design/harness/')), all: uniq.length }));
