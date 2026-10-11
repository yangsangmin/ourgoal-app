'use strict';
// TASK-ES-652 측정 모음(작업자 측정, 판정 아님).
// 사용: node measure-652.cjs <기준 트리> <작업 트리> <raw 폴더(npm-test.{base,work}.{log,exit} · tests-all.{base,work}.json)>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [BASE, WORK, RAW] = process.argv.slice(2);
const DIR = path.join(WORK, 'reports', 'TASK-ES-652');
const rj = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const wj = (f, o) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', 'utf8');
const TYPE = '작업자 측정, 판정 아님';
const git = (d, a) => cp.execFileSync('git', a, { cwd: d, encoding: 'utf8' }).trim();
const metrics = d => JSON.parse(cp.execFileSync(process.execPath, ['scripts/module-metrics.js'], { cwd: d, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
const L = f => fs.readFileSync(f, 'utf8').split(/\r?\n/);

// 1) 바뀐 줄: 기준과 작업의 index.html 을 줄 단위로 맞댄다
const bl = L(path.join(BASE, 'index.html')), wl = L(path.join(WORK, 'index.html'));
const diffIdx = []; for (let i = 0; i < Math.max(bl.length, wl.length); i++) if (bl[i] !== wl[i]) diffIdx.push(i);
const OLD = '    get USER_SESSION_CHANNEL(){ return USER_SESSION_CHANNEL; },';
const ADD = ' set USER_SESSION_CHANNEL(v){ USER_SESSION_CHANNEL = v; },';
const NEW = OLD.slice(0, -1) + ',' + ADD;
const line = diffIdx.length === 1 ? { line: diffIdx[0] + 1, base: bl[diffIdx[0]], work: wl[diffIdx[0]] } : null;
const changedLine = { sameLineCount: bl.length === wl.length, differingLines: diffIdx.length, line: line && line.line, baseIsGetterOnly: !!line && line.base === OLD, workIsGetterPlusSetter: !!line && line.work === NEW,
  addedText: line && line.work.startsWith(line.base.slice(0, -1)) ? line.work.slice(line.base.length - 1) : null, netLineGrowth: wl.length - bl.length };

// 2) npm test
fs.mkdirSync(path.join(DIR, 'raw'), { recursive: true });
const npm = {};
for (const label of ['base', 'work']) {
  const log = fs.readFileSync(path.join(RAW, 'npm-test.' + label + '.log'), 'utf8');
  const exit = Number(fs.readFileSync(path.join(RAW, 'npm-test.' + label + '.exit'), 'utf8').replace(/[^0-9]/g, ''));
  fs.writeFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.log'), log, 'utf8');
  fs.writeFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), 'exit=' + exit + '\n', 'utf8');
  const ls = log.split(/\r?\n/);
  npm[label] = { file: 'reports/TASK-ES-652/raw/npm-test.' + label + '.log', exit, checkLines: ls.filter(l => /^\s*✓/.test(l)).length, okDotLines: ls.filter(l => /^\s*ok · /.test(l)).length,
    summaryLines: ls.filter(l => /\d+개 통과, \d+개 실패|총 \d+개 검사 중 \d+개 통과|ALL PASS|100% COMPLETE/.test(l)).map(l => l.trim()) };
}
npm.same = { exit: npm.base.exit === npm.work.exit, checkLines: npm.base.checkLines === npm.work.checkLines, okDotLines: npm.base.okDotLines === npm.work.okDotLines, summaryLines: JSON.stringify(npm.base.summaryLines) === JSON.stringify(npm.work.summaryLines) };
npm.allSame = Object.values(npm.same).every(Boolean);
npm.tool = 'npm test (기준 트리·작업 트리 각각 전경 실행)'; npm.type = TYPE;
wj('npm-test-compare.json', npm);

// 3) tests 전부
const tb = rj(path.join(RAW, 'tests-all.base.json')), tw = rj(path.join(RAW, 'tests-all.work.json'));
const files = Object.keys(tb), tdiff = files.filter(k => !tw[k] || tb[k].exit !== tw[k].exit || tb[k].okLines !== tw[k].okLines);
wj('tests-all-compare.json', { tool: 'run-tests.cjs — tests/*.test.js 전부와 npm test 네 단계·module-guard 를 파일마다 node 로 실행(기준·작업)', type: TYPE, files: files.length, differingCount: tdiff.length, differing: tdiff.map(k => ({ file: k, base: tb[k], work: tw[k] || null })),
  nonZeroExit: { base: files.filter(k => tb[k].exit !== 0).length, work: files.filter(k => tw[k] && tw[k].exit !== 0).length } });

// 4) 지표·탐침 결과 모음
const mb = metrics(BASE), mw = metrics(WORK);
const ml = require(path.join(path.resolve(WORK), 'court', 'probes', 'module-load.js'));
const cmp = ml.compare(ml.probeModules(BASE), ml.probeModules(WORK), fs.readFileSync(path.join(WORK, 'index.html'), 'utf8'));
wj('module-load.json', { tool: 'court/probes/module-load.js (읽기 전용 — compare(probeModules(기준), probeModules(작업)))', type: TYPE, regressions: cmp.regressions, insufficient: cmp.insufficient, fixed: cmp.fixed, counts: cmp.counts });
const fpB = rj(path.join(DIR, 'cell-registry-compare.base.json')), fpW = rj(path.join(DIR, 'cell-registry-compare.json'));
const fp = {}; for (const k of ['scope', 'window']) { const a = fpB.fingerprints[k], b = fpW.fingerprints[k]; const names = Object.keys(a); fp[k] = { names: names.length, diff: names.filter(n => JSON.stringify(a[n]) !== JSON.stringify(b[n])) }; }
const sw = { base: rj(path.join(DIR, 'scope-write.base.json')), work: rj(path.join(DIR, 'scope-write.work.json')) };
const sc = fs.existsSync(path.join(DIR, 'scenario-local.json')) ? rj(path.join(DIR, 'scenario-local.json')) : null;
const guard = cp.spawnSync(process.execPath, ['scripts/module-guard.js'], { cwd: WORK, encoding: 'utf8' });
const baseHead = git(BASE, ['rev-parse', 'HEAD']);
const changed = git(WORK, ['diff', '--name-only', baseHead]).split('\n').filter(Boolean);
const out = { task: 'TASK-ES-652', type: TYPE, measuredAt: new Date().toISOString(), base: { head: baseHead },
  summary: {
    changedLine,
    ratchet: { inlineScriptLines: [mb.ratchet.inlineScriptLines, mw.ratchet.inlineScriptLines], inlineScriptLinesSame: mb.ratchet.inlineScriptLines === mw.ratchet.inlineScriptLines, indexFunctionDecls: [mb.ratchet.indexFunctionDecls, mw.ratchet.indexFunctionDecls], windowAssignments: [mb.ratchet.windowAssignments, mw.ratchet.windowAssignments], crossTabRefs: [mb.ratchet.crossTabRefs, mw.ratchet.crossTabRefs] },
    scopeWrite: { baseWriteRoundTripOk: sw.base.writeRoundTripOk, baseWriteThrew: sw.base.dynamic && sw.base.dynamic.writeThrew || null, workWriteRoundTripOk: sw.work.writeRoundTripOk, workRestored: sw.work.dynamic && sw.work.dynamic.restored, workDescriptor: sw.work.dynamic && sw.work.dynamic.descriptor },
    names: { scopeLost: fpW.namesFrom.scopeLost, scopeAdded: fpW.namesFrom.scopeAdded, scopeNames: fp.scope.names, scopeFingerprintDiff: fp.scope.diff, windowNames: fp.window.names, windowFingerprintDiff: fp.window.diff, mismatches: [fpB.counts.mismatches, fpW.counts.mismatches] },
    moduleLoad: { regressions: cmp.regressions, counts: cmp.counts },
    scenarios: sc ? { allPassedBoth: sc.allPassedBoth, rows: Object.keys(sc.scenarios).map(id => ({ id, base: sc.scenarios[id].runs.base.passed, base2: sc.scenarios[id].runs.base2.passed, work: sc.scenarios[id].runs.work.passed, exceptionsWork: (sc.scenarios[id].runs.work.exceptions || []).length })) } : null,
    npmTest: { baseExit: npm.base.exit, workExit: npm.work.exit, checkLines: [npm.base.checkLines, npm.work.checkLines], okDotLines: [npm.base.okDotLines, npm.work.okDotLines], allSame: npm.allSame },
    testsAll: { files: files.length, differingCount: tdiff.length },
    guard: { exitCode: guard.status },
    changed: { all: changed, productFiles: changed.filter(f => f === 'index.html' || f.startsWith('js/')), onlyIndexHtml: JSON.stringify(changed.filter(f => f === 'index.html' || f.startsWith('js/'))) === '["index.html"]', testsChanged: changed.filter(f => f.startsWith('tests/')),
      vaultChanged: changed.filter(f => /^(court\/|\.github\/|\.githooks\/|AGENTS\.md|CLAUDE\.md|GEMINI\.md|01_OURGOAL|package\.json|vercel\.json|scripts\/(essence-gate|verify-integrity-gate)\.js|docs\/rules\/(OURGOAL_ABSOLUTE|CONSTITUTION_VERSIONS|ESSENCE_OURGOAL|rules)|docs\/directives\/)/.test(f)),
      generatorChanged: changed.filter(f => f.startsWith('docs/design/harness/')), generatedMapsChanged: changed.filter(f => /docs\/architecture\/(cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md|module-baseline\.json)/.test(f)) },
  } };
wj('measurement.json', out);
console.log(JSON.stringify(out.summary).slice(0, 2600));
