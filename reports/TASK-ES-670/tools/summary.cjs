'use strict';
// 단위 시험 결과 요약 + 바뀐 파일 분류 + npm test 비교(작업자 측정, 판정 아님).
// 사용: node summary.cjs <작업 트리> <raw 폴더(npm-test.{base,work}.{log,exit})>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [WORK_ARG, RAW] = process.argv.slice(2);
const WORK = path.resolve(WORK_ARG), DIR = path.join(WORK, 'reports', 'TASK-ES-670');
const rj = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const wj = (f, o) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' });
const u = rj(path.join(DIR, 'guarded-unit.json'));
const by = id => u.results.find(r => r.id === id) || { ok: false, detail: null };
const ids = p => u.results.filter(r => p.test(r.id));
const all = (p, n) => ids(p).length === n && ids(p).every(r => r.ok);
const bd = by('B').detail || {}, d = by('D').detail || {}, r2 = by('R2').detail || {};
const sub = (arr, allow) => Array.isArray(arr) && arr.every(x => allow.includes(x));
wj('unit-summary.json', { type: '작업자 측정, 판정 아님', source: 'reports/TASK-ES-670/guarded-unit.json', total: u.total, passed: u.passed, ok: u.ok,
  earlierSuites: { ok: by('B').ok, finalize662: bd.finalize662, sweep661: bd.sweep661, fnArguments657: bd.fnArguments657, region643: bd.region643, unstate634: bd.unstate634, unwireExt619: bd.unwireExt619, unwireB1: bd.unwireB1,
    onlyShapeChecksFailed: !!bd.finalize662 && sub(bd.finalize662.failed, ['B', 'D0']) && sub(bd.sweep661.failed, ['B', 'D0']) && sub(bd.fnArguments657.failed, ['D1']) && sub(bd.region643.failed, ['D0']) && bd.unstate634 === '34/34' && bd.unwireExt619 === '16/16' && bd.unwireB1 === '8/8',
    why: '662 의 D0 · 661 의 D0 · 657 의 D1 · 643 의 D0 는 생성기 파일의 diff 모양을 옛 기준과 맞대는 검사이고, 662 의 B · 661 의 B 는 안쪽 묶음의 그 모양 조건(한 자리에 이어진 끼워 넣기 · region 구간 동일)을 겉에서 다시 본다. 이 PR 은 region 구간의 줄 셋을 바꿨으므로 그 여섯이 구조적으로 거짓이 된다(출력 비교가 아니다 — 경험칙 L110). 그 시험 파일은 고치지 않았다. 출력을 재는 검사(재생성 바이트 동일 · 꾸러미 · 정지 · 실행 등가)는 모두 통과했다.' },
  generatorDiff: { ok: by('D').ok, removed: d.removed, addedCount: d.addedCount, outsideRegionSame: d.outsideRegionSame, verifySame: d.verifySame },
  regionPrRegenerated: { ok: by('G650').ok, pr: (by('G650').detail || {}).pr, stdoutSame: (by('G650').detail || {}).stdoutSame, files: (by('G650').detail || {}).files },
  lockUnchanged: ids(/^K\d/).map(r => ({ id: r.id, ok: r.ok })), allLockUnchangedOk: all(/^K\d/, 3),
  allowed: ids(/^A\d/).map(r => ({ id: r.id, ok: r.ok })), allAllowedOk: all(/^A\d/, 4),
  vmEquivalence: by('E1').ok,
  stops: ids(/^S\d/).map(r => ({ id: r.id, ok: r.ok })), allStopsOk: all(/^S\d/, 13),
  realIndex: ids(/^R\d/).map(r => ({ id: r.id, ok: r.ok })), allRealIndexOk: all(/^R\d/, 3), realIndexAllowed: { lines: r2.lines, money: r2.money, guardedAllowed: r2.guardedAllowed } });
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
wj('measurement.json', { task: 'TASK-ES-670', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), base: mb, note: 'changed 는 이 브랜치가 origin/main 과 갈라진 뒤 바꾼 파일이다.',
  changed: { all: uniq, productFiles: uniq.filter(f => f === 'index.html' || f.startsWith('js/') || /^ui\.(js|css)$/.test(f) || f === 'sw.js'), testsChanged: uniq.filter(f => f.startsWith('tests/')),
    vaultChanged: uniq.filter(f => /^(court\/|\.github\/|\.githooks\/|AGENTS\.md|CLAUDE\.md|GEMINI\.md|01_OURGOAL|package\.json|vercel\.json|scripts\/(essence-gate|verify-integrity-gate)\.js|docs\/rules\/(OURGOAL_ABSOLUTE|CONSTITUTION_VERSIONS|ESSENCE_OURGOAL|rules)|docs\/directives\/)/.test(f)),
    harnessChanged: uniq.filter(f => f.startsWith('docs/design/harness/')), scriptsChanged: uniq.filter(f => f.startsWith('scripts/')), generatedMapsChanged: uniq.filter(f => /docs\/architecture\/(cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md|module-baseline\.json|modules\.json|cell-descriptions\.json)/.test(f)) },
  npmTest: npm });
console.log(JSON.stringify({ unit: [u.total, u.passed, u.ok], npm: [npm.base.exit, npm.work.exit, npm.base.checkLines, npm.work.checkLines, npm.allSame], product: uniq.filter(f => f === 'index.html' || f.startsWith('js/')), tests: uniq.filter(f => f.startsWith('tests/')), harness: uniq.filter(f => f.startsWith('docs/design/harness/')), all: uniq.length }));
