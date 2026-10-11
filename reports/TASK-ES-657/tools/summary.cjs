'use strict';
// 단위 시험 결과 요약 + 바뀐 파일 분류 + npm test 비교(작업자 측정, 판정 아님).
// 사용: node summary.cjs <작업 트리> <기준 커밋> <raw 폴더(npm-test.{base,work}.{log,exit})>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [WORK_ARG, BASE_SHA, RAW] = process.argv.slice(2);
const WORK = path.resolve(WORK_ARG), DIR = path.join(WORK, 'reports', 'TASK-ES-657');
const rj = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const wj = (f, o) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' });
const u = rj(path.join(DIR, 'fn-arguments-unit.json'));
const by = id => u.results.find(r => r.id === id) || { ok: false, detail: null };
const ids = p => u.results.filter(r => p.test(r.id));
const b = by('B');
wj('unit-summary.json', { type: '작업자 측정, 판정 아님', source: 'reports/TASK-ES-657/fn-arguments-unit.json', total: u.total, passed: u.passed, ok: u.ok,
  existingPaths: { regeneratedByteSame: ids(/^G\d/).map(r => ({ id: r.id, ok: r.ok })), allRegeneratedByteSame: ids(/^G\d/).length === 4 && ids(/^G\d/).every(r => r.ok), verifierOutputSame: ids(/^V\d/).map(r => ({ id: r.id, ok: r.ok })), allVerifierOutputSame: ids(/^V\d/).length === 4 && ids(/^V\d/).every(r => r.ok) },
  region643: { total: b.detail && b.detail.total, passed: b.detail && b.detail.passed, failed: b.detail && b.detail.failed, onlyD0Failed: !!(b.detail && b.detail.failed && b.detail.failed.length === 1 && b.detail.failed[0] === 'D0'), unstate634: b.detail && b.detail.innerB && (b.detail.innerB.passed + '/' + b.detail.innerB.total), unwireB1: b.detail && b.detail.innerB && b.detail.innerB.b1,
    d0Why: 'D0 는 생성기 파일과 #643 이전 생성기(e5f34779)의 차이가 「한 자리에 끼워 넣은 줄뿐」인지 보는 모양 비교다. 이번 PR 이 일반 모드의 다른 자리를 고쳐 공통 머리+꼬리 줄 수가 기준 줄 수보다 작아졌다(출력 비교가 아니다). 그 시험 파일은 고치지 않았다.' },
  diff: { generator: by('D1').detail, generatorOk: by('D1').ok, verifierRemoved: by('D2').detail && by('D2').detail.removed, verifierOk: by('D2').ok },
  allowed: ids(/^A\d/).map(r => ({ id: r.id, ok: r.ok })), allAllowedOk: ids(/^A\d/).every(r => r.ok),
  stops: ids(/^S\d/).map(r => ({ id: r.id, ok: r.ok })), allStopsOk: ids(/^S\d/).length === 6 && ids(/^S\d/).every(r => r.ok),
  verifierStops: ids(/^VS\d/).map(r => ({ id: r.id, ok: r.ok })), allVerifierStopsOk: ids(/^VS\d/).length === 2 && ids(/^VS\d/).every(r => r.ok),
  realIndexMock: { ok: by('P1').ok, baseGenerator: by('P1').detail && by('P1').detail.baseGenerator, lines: by('P1').detail && by('P1').detail.lines, ownArguments: by('P1').detail && by('P1').detail.meta && by('P1').detail.meta.ownArguments } });
const npm = {};
for (const label of ['base', 'work']) {
  const log = fs.readFileSync(path.join(RAW, 'npm-test.' + label + '.log'), 'utf8'), exit = Number(fs.readFileSync(path.join(RAW, 'npm-test.' + label + '.exit'), 'utf8').replace(/[^0-9]/g, ''));
  fs.mkdirSync(path.join(DIR, 'raw'), { recursive: true });
  fs.writeFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.log'), log, { encoding: 'utf8' }); fs.writeFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), 'exit=' + exit + '\n', { encoding: 'utf8' });
  const ls = log.split(/\r?\n/);
  npm[label] = { exit, checkLines: ls.filter(l => /^\s*✓/.test(l)).length, okDotLines: ls.filter(l => /^\s*ok · /.test(l)).length, summaryLines: ls.filter(l => /\d+개 통과, \d+개 실패|총 \d+개 검사 중 \d+개 통과|ALL PASS|100% COMPLETE/.test(l)).map(l => l.trim()) };
}
npm.allSame = npm.base.exit === npm.work.exit && npm.base.checkLines === npm.work.checkLines && npm.base.okDotLines === npm.work.okDotLines && JSON.stringify(npm.base.summaryLines) === JSON.stringify(npm.work.summaryLines);
const changed = cp.execFileSync('git', ['diff', '--name-only', BASE_SHA], { cwd: WORK, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  .concat(cp.execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: WORK, encoding: 'utf8' }).trim().split('\n').filter(Boolean));
const uniq = [...new Set(changed)].sort();
wj('measurement.json', { task: 'TASK-ES-657', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), base: BASE_SHA,
  changed: { all: uniq, productFiles: uniq.filter(f => f === 'index.html' || f.startsWith('js/') || /^ui\.(js|css)$/.test(f) || f === 'sw.js'), testsChanged: uniq.filter(f => f.startsWith('tests/')),
    vaultChanged: uniq.filter(f => /^(court\/|\.github\/|\.githooks\/|AGENTS\.md|CLAUDE\.md|GEMINI\.md|01_OURGOAL|package\.json|vercel\.json|scripts\/(essence-gate|verify-integrity-gate)\.js|docs\/rules\/(OURGOAL_ABSOLUTE|CONSTITUTION_VERSIONS|ESSENCE_OURGOAL|rules)|docs\/directives\/)/.test(f)),
    harnessChanged: uniq.filter(f => f.startsWith('docs/design/harness/')), generatedMapsChanged: uniq.filter(f => /docs\/architecture\/(cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md|module-baseline\.json|modules\.json)/.test(f)) },
  npmTest: npm });
console.log(JSON.stringify({ unit: [u.total, u.passed, u.ok], region: [b.detail.total, b.detail.passed, b.detail.failed], npm: [npm.base.exit, npm.work.exit, npm.base.checkLines, npm.work.checkLines, npm.allSame], product: uniq.filter(f => f === 'index.html' || f.startsWith('js/')), tests: uniq.filter(f => f.startsWith('tests/')), harness: uniq.filter(f => f.startsWith('docs/design/harness/')) }));
