#!/usr/bin/env node
'use strict';
// #TASK-ES-666 측정 요약(작업자 측정, 판정 아님) — 저장소 밖 결과 폴더의 원시 결과를 읽어 한 파일로 줄인다. 수를 손으로 옮기지 않기 위한 것이다.
// 읽는 것(결과 폴더): asserts-<트리>.json(run-asserts.cjs) · plain-<트리>.json(run-plain.cjs) · metrics-<트리>.json · guard-<트리>.exit/.out ·
//   relax-<트리>.json(relax-mock-limits.cjs) · control-group.json · tool-*.out/.exit · probe-*.json/.exit · harness-<base|work>.<시험>.exit/.out · mock-<트리>.json
// 트리 이름: base(기준 그대로) · main666/667/668/669(기준 + 그 PR 하나) · mainAll(기준 + 네 PR) · mockA/mockB(모의본 가/나, 고치기 전) ·
//   afterA/afterB/afterBreg(모의본 + 네 PR, reg = saveGoogleToken 등록 흉내) · afterB666/667/669(모의본 나 + 그 PR 하나) ·
//   limB/limAfterB/limAfterBreg(모의본 나에서 흉내의 한계 — 신고서·800줄 — 를 걷어 낸 것) · toolA/toolB(모의본 + 고친 도구)
// 사용: node summary.cjs <결과 폴더> <기준 커밋> <out.json>
const fs = require('fs'), path = require('path');
const DIR = path.resolve(process.argv[2]), BASE = process.argv[3], OUT = path.resolve(process.argv[4]);
const NL = String.fromCharCode(10);
const has = f => fs.existsSync(path.join(DIR, f));
const rj = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const rt = f => (has(f) ? fs.readFileSync(path.join(DIR, f), 'utf8') : null);
const num = f => { const t = rt(f); return t === null || t.trim() === '' ? null : Number(t.trim()); };
const key = x => x.file + ':' + x.line;

function onlyIn(a, b) {
  if (!has('asserts-' + a + '.json') || !has('asserts-' + b + '.json')) return null;
  const A = rj('asserts-' + a + '.json'), B = rj('asserts-' + b + '.json');
  const inA = new Set(A.failedAssertsUnique.map(key)), inB = new Set(B.failedAssertsUnique.map(key));
  const list = B.failedAssertsUnique.filter(x => !inA.has(key(x))).map(x => ({ file: x.file, line: x.line, check: x.check || null, message: String(x.message || '').split(NL)[0].slice(0, 160), src: String(x.src || '').slice(0, 300) }))
    .sort((p, q) => (p.file < q.file ? -1 : p.file > q.file ? 1 : p.line - q.line));
  const byFile = {};
  for (const x of list) byFile[x.file] = (byFile[x.file] || 0) + 1;
  const ends = j => { const m = new Map(); for (const e of j.entries) m.set(e.entry, (e.softExit === null ? 'x' : e.softExit) + '/' + (e.otherEnds || []).length + (e.timedOut ? '/timeout' : '')); return m; };
  const ea = ends(A), eb = ends(B), endDiff = [];
  for (const [entry, v] of eb) if (ea.get(entry) !== v) endDiff.push({ entry, first: ea.has(entry) ? ea.get(entry) : null, second: v });
  return { first: a, second: b, firstFailedLines: A.failedAssertsUnique.length, secondFailedLines: B.failedAssertsUnique.length, entries: [A.entries.length, B.entries.length],
    onlyInSecond: list.length, byFile, list, onlyInFirst: A.failedAssertsUnique.filter(x => !inB.has(key(x))).length, entryEndDifferences: endDiff };
}
function plain(n) {
  if (!has('plain-' + n + '.json')) return null;
  const s = rj('plain-' + n + '.json').summary, sc = name => s.scripts.find(x => x.script === name) || {};
  const one = name => { const x = sc(name); return { exit: x.exit, checkLines: x.checkLines, okLines: x.okLines, fails: x.fails }; };
  return { npmTestExit: s.npmTestExit, checkLines: s.npmTestCheckLines, okLines: s.npmTestOkLines, smoke: one('scripts/smoke-test.js'), gate: one('scripts/verify-integrity-gate.js'), clicks: one('scripts/verify-all-clicks.js'), shipyard: one('scripts/test-shipyard-modular.js'),
    otherScripts: s.otherScripts, otherScriptsFailed: s.otherScriptsFailed, testFiles: s.testFiles, testFilesExit0: s.testFilesExit0, testFilesFailed: s.testFilesFailed };
}
const metrics = n => (has('metrics-' + n + '.json') ? rj('metrics-' + n + '.json') : null);
const guard = n => { const o = rt('guard-' + n + '.out'); if (o === null) return null; const L = o.split(/\r?\n/); const i = L.findIndex(l => l.indexOf('모듈 가드 실패') >= 0); return { exit: num('guard-' + n + '.exit'), failures: i < 0 ? [] : L.slice(i + 1).filter(l => /^\s+- /.test(l)).map(l => l.trim().slice(0, 200)) }; };
// 이 PC 의 임시 폴더 경로는 싣지 않는다(트리 이름만 남긴다)
const noTemp = s => String(s).replace(/[A-Za-z]:[\\/]Users[\\/][^\\/]+[\\/]AppData[\\/]Local[\\/]Temp[\\/]/g, '<임시 폴더>/').replace(/\\/g, '/');
const firstLines = (f, n) => { const t = rt(f); if (t === null) return null; return noTemp(t).split(/\r?\n/).filter(l => l.trim() && !/^\s+at /.test(l) && !/^Node\.js v/.test(l) && !/^\s*\^+\s*$/.test(l)).slice(0, n).map(l => l.slice(0, 240)); };
const same = (a, b) => { const x = rt(a), y = rt(b); return x === null || y === null ? null : x === y; };

const out = { tool: 'reports/TASK-ES-666/tools/summary.cjs', type: '작업자 측정, 판정 아님', baseCommit: BASE, measuredAt: new Date().toISOString(), finishedMark: rt('done') ? rt('done').trim() : null };

// 1) 모의본에서만 깨지는 단언 줄
out.mock = {
  A: { made: has('mock-mockA.json') ? rj('mock-mockA.json') : null, before: onlyIn('base', 'mockA'), afterAll: onlyIn('mainAll', 'afterA') },
  B: { made: has('mock-mockB.json') ? (m => ({ topStatements: m.topStatements, byKind: m.byKind || null, byDestination: m.byDestination || null, movedFunctions: m.movedFunctions || null, movedFunctionFiles: m.movedFunctionFiles || null, movedFunctionFileMaxLines: m.movedFunctionFileMaxLines === undefined ? null : m.movedFunctionFileMaxLines, stateDefines: m.stateDefines || null, localVars: m.localVars || null, rewiredDropped: m.rewiredDropped || null, comments: m.comments || null, limits: m.limits || null, files: m.files || null }))(rj('mock-mockB.json')) : null,
    before: onlyIn('base', 'mockB'), afterAll: onlyIn('mainAll', 'afterB'), afterAllRegistered: onlyIn('mainAll', 'afterBreg'),
    registerAttempt: has('mock-afterBreg.json') ? (rj('mock-afterBreg.json').registered || []).map(x => ({ name: x.name, file: x.file || null, why: x.why || null, added: !x.why })) : null,
    limitsRemoved: { before: onlyIn('base', 'limB'), afterAll: onlyIn('mainAll', 'limAfterB'), afterAllRegistered: onlyIn('mainAll', 'limAfterBreg') },
    perPr: { '666': onlyIn('main666', 'afterB666'), '667': onlyIn('main667', 'afterB667'), '669': onlyIn('main669', 'afterB669') } },
};
out.pins = {};
for (const k of ['A', 'B']) out.pins[k] = has('pins-mock' + k + '.json') ? (p => ({ brokenAssertLines: p.summary.brokenAssertLines, withTextPin: p.summary.withTextPin, withoutTextPin: p.summary.withoutTextPin, byWhere: p.summary.byWhere, rows: p.rows.map(r => ({ file: r.file, line: r.line, where: [...new Set(r.pins.flatMap(x => x.where || []))], inComment: r.pins.some(x => x.inComment) })) }))(rj('pins-mock' + k + '.json')) : null;
// 2) 현재 main
out.main = {
  asserts: { all: onlyIn('base', 'mainAll'), '666': onlyIn('base', 'main666'), '667': onlyIn('base', 'main667'), '669': onlyIn('base', 'main669') },
  plain: { base: plain('base'), main666: plain('main666'), main667: plain('main667'), main668: plain('main668'), main669: plain('main669'), mainAll: plain('mainAll') },
};
out.mockPlain = { mockA: plain('mockA'), afterA: plain('afterA'), mockB: plain('mockB'), afterB: plain('afterB'), limAfterBreg: plain('limAfterBreg') };
// 3) 모듈 지표 · 가드
out.metrics = {}; out.guard = {};
for (const n of ['base', 'mainAll', 'main667', 'mockA', 'mockB', 'afterA', 'afterB', 'afterB667']) { const m = metrics(n); out.metrics[n] = m ? { ratchet: m.ratchet, crossTabRefs: m.crossTabRefs, organOwnedNames: m.organOwned ? m.organOwned.length : null, inlineOwnedNames: m.inlineOwned } : null; out.guard[n] = guard(n); }
out.metrics.mainSame = out.metrics.base && out.metrics.main667 ? JSON.stringify(out.metrics.base.ratchet) === JSON.stringify(out.metrics.main667.ratchet) : null;
out.metrics.organOwnedOnMain = metrics('main667') ? metrics('main667').organOwned : null;
// 4) 흉내의 한계를 걷어 낸 것
out.relax = {};
for (const n of ['limB', 'limAfterB', 'limAfterBreg', 'ctl']) out.relax[n] = has('relax-' + n + '.json') ? (r => ({ crossTabRefsMeasured: r.measured.crossTabRefs, baselineCrossTabRefs: r.baselineCrossTabRefs, guardBeforeRelax: r.guardBeforeRelax, guardAfterRelax: r.guardAfterRelax, specKindSetToOrgan: r.specKindSetToOrgan }))(rj('relax-' + n + '.json')) : null;
// 5) 대조군
out.control = has('control-group.json') ? (c => ({ summary: c.summary, treeRestored: c.treeRestored.unstagedOrUntrackedAfter.length === 0, variants: c.variants.map(v => ({ id: v.id, pr: v.pr, what: v.what, newlyFailing: v.newlyFailing, expected: v.expected, extraNewlyFailing: v.extraNewlyFailing, asExpected: v.asExpected, textOccurrencesInBundleFiles: v.textOccurrencesInBundleFiles })) }))(rj('control-group.json')) : null;
// 6) 도구
const toolRun = (name, label) => { const all = firstLines('tool-' + name + '.' + label + '.out', 12) || []; const err = all.find(l => /^(\w*Error|gen-inline-hard): /.test(l.trim())); return { exit: num('tool-' + name + '.' + label + '.exit'), head: all.slice(0, 2), message: (err || all[0] || '').trim().slice(0, 200) }; };
out.tools = {
  main: { mapExit: [num('tool-map.toolBase.exit'), num('tool-map.toolMain.exit')], mapOutputSame: same('tool-map.toolBase.out', 'tool-map.toolMain.out'), typesExit: [num('tool-types.toolBase.exit'), num('tool-types.toolMain.exit')], typesOutputSame: same('tool-types.toolBase.out', 'tool-types.toolMain.out'),
    writtenFilesSame: same('tool-written.toolBase.sha', 'tool-written.toolMain.sha'), mapHead: firstLines('tool-map.toolMain.out', 1), typesHead: firstLines('tool-types.toolMain.out', 1),
    committedMapStale: (rt('tool-written.toolBase.gitstatus') || '').split(/\r?\n/).filter(Boolean).map(l => l.trim()) },
  mock: {},
  probe: {},
};
for (const label of ['beforeA', 'beforeB', 'afterA', 'afterB']) out.tools.mock[label] = { map: toolRun('map', label), types: toolRun('types', label), testProbe: toolRun('testprobe', label), generator: Object.assign(toolRun('gen', label), { treeUnchanged: same('tool-gen.' + label + '.before', 'tool-gen.' + label + '.after') }) };
for (const n of ['probe-main.base', 'probe-main.work', 'probe-mockA.base', 'probe-mockA.work', 'probe-mockA.work-nonames']) {
  const j = has(n + '.json') ? rj(n + '.json') : null;
  out.tools.probe[n.replace('probe-', '').replace('.', '_').replace('-', '_')] = { exit: num(n + '.exit'), ok: j ? j.ok : null, counts: j ? j.counts : null, windowNames: j ? j.windowNames.length : null, noIife: j && j.windowNamesSource ? (j.windowNamesSource.noIife === undefined ? null : j.windowNamesSource.noIife) : null, head: j ? null : firstLines(n + '.out', 1) };
}
out.tools.probe.mainCountsSame = out.tools.probe.main_base.counts && out.tools.probe.main_work.counts ? JSON.stringify(out.tools.probe.main_base.counts) === JSON.stringify(out.tools.probe.main_work.counts) : null;
// 7) 생성기 단위 시험
// 가장 최근 묶음(guarded-check-670.js) 하나가 앞선 묶음 전부(662 → 661 → 657 → 643 → 634 → 619 → B1)를 안에서 다시 돌린다 — 그 결과 파일의 B 칸에 묶음별 수가 있다
const HS = ['guarded-check-670'];
const hj = side => (has('harness-' + side + '.guarded-check-670.json') ? rj('harness-' + side + '.guarded-check-670.json') : null);
const hside = side => { const j = hj(side); if (!j) return null; const b = (j.results.find(r => r.id === 'B') || {}).detail || null; return { total: j.total, passed: j.passed, failed: j.results.filter(r => !r.ok).map(r => r.id), inner: b ? { finalize662: b.finalize662, sweep661: b.sweep661, fnArguments657: b.fnArguments657, region643: b.region643, unstate634: b.unstate634, unwireExt619: b.unwireExt619, unwireB1: b.unwireB1 } : null }; };
const failedChecks = f => { const t = rt(f); if (t === null) return null; return t.split(/\r?\n/).filter(l => /^\s*(FAIL|not ok|✗|실패)\b/.test(l) || /^\s*NG\s/.test(l)).map(l => l.trim().slice(0, 200)); };
out.harness = { tests: HS.map(h => ({ test: h, exitBase: num('harness-base.' + h + '.exit'), exitWork: num('harness-work.' + h + '.exit'), lastLineBase: (firstLines('harness-base.' + h + '.out', 100000) || []).slice(-1)[0] || null, lastLineWork: (firstLines('harness-work.' + h + '.out', 100000) || []).slice(-1)[0] || null,
  failedLinesBase: failedChecks('harness-base.' + h + '.out'), failedLinesWork: failedChecks('harness-work.' + h + '.out'), outputSame: same('harness-base.' + h + '.out', 'harness-work.' + h + '.out') })) };
out.harness.exitsSame = out.harness.tests.every(t => t.exitBase !== null && t.exitBase === t.exitWork);
out.harness.nonZeroInBoth = out.harness.tests.filter(t => t.exitBase !== 0 && t.exitBase === t.exitWork).map(t => t.test);
out.harness.changedByThisWork = out.harness.tests.filter(t => t.exitBase !== t.exitWork).map(t => t.test);
out.harness.base = hside('base'); out.harness.work = hside('work');
out.harness.innerSame = out.harness.base && out.harness.work ? JSON.stringify(out.harness.base.inner) === JSON.stringify(out.harness.work.inner) : null;
out.harness.newlyFailedChecks = out.harness.base && out.harness.work ? out.harness.work.failed.filter(x => out.harness.base.failed.indexOf(x) < 0) : null;
out.harness.totalsSame = out.harness.base && out.harness.work ? out.harness.base.total === out.harness.work.total : null;

// 한눈 요약(서류·주장이 읽는 칸)
const n = x => (x ? x.onlyInSecond : null);
const P = out.main.plain, cmp = (a, k) => (P[a] && P.base ? [P.base[k], P[a][k]] : null);
out.summary = {
  mockA: { before: n(out.mock.A.before), afterAll: n(out.mock.A.afterAll), beforeByFile: out.mock.A.before ? out.mock.A.before.byFile : null },
  mockB: { before: n(out.mock.B.before), afterAll: n(out.mock.B.afterAll), afterAllRegistered: n(out.mock.B.afterAllRegistered), beforeByFile: out.mock.B.before ? out.mock.B.before.byFile : null,
    limitsRemovedBefore: n(out.mock.B.limitsRemoved.before), limitsRemovedAfterAll: n(out.mock.B.limitsRemoved.afterAll), limitsRemovedAfterAllRegistered: n(out.mock.B.limitsRemoved.afterAllRegistered),
    remainingAfterAllRegistered: out.mock.B.limitsRemoved.afterAllRegistered ? out.mock.B.limitsRemoved.afterAllRegistered.list.map(x => x.file + ':' + x.line) : null,
    only666: n(out.mock.B.perPr['666']), only667: n(out.mock.B.perPr['667']), only669: n(out.mock.B.perPr['669']) },
  main: { newlyFailingAll: n(out.main.asserts.all), newlyFailing666: n(out.main.asserts['666']), newlyFailing667: n(out.main.asserts['667']), newlyFailing669: n(out.main.asserts['669']),
    goneAll: out.main.asserts.all ? out.main.asserts.all.onlyInFirst : null,
    npmTestExit: { base: P.base ? P.base.npmTestExit : null, main666: P.main666 ? P.main666.npmTestExit : null, main667: P.main667 ? P.main667.npmTestExit : null, main668: P.main668 ? P.main668.npmTestExit : null, main669: P.main669 ? P.main669.npmTestExit : null, mainAll: P.mainAll ? P.mainAll.npmTestExit : null },
    checkLines: { main666: cmp('main666', 'checkLines'), main667: cmp('main667', 'checkLines'), main668: cmp('main668', 'checkLines'), main669: cmp('main669', 'checkLines'), mainAll: cmp('mainAll', 'checkLines') },
    okLines: { main666: cmp('main666', 'okLines'), main667: cmp('main667', 'okLines'), main668: cmp('main668', 'okLines'), main669: cmp('main669', 'okLines'), mainAll: cmp('mainAll', 'okLines') },
    testFilesExit0: { main666: cmp('main666', 'testFilesExit0'), main667: cmp('main667', 'testFilesExit0'), main668: cmp('main668', 'testFilesExit0'), main669: cmp('main669', 'testFilesExit0'), mainAll: cmp('mainAll', 'testFilesExit0') },
    testFiles: { main666: cmp('main666', 'testFiles'), main667: cmp('main667', 'testFiles'), main668: cmp('main668', 'testFiles'), main669: cmp('main669', 'testFiles'), mainAll: cmp('mainAll', 'testFiles') },
    smokeCheckLines: cmp('main666', 'smoke') ? [P.base.smoke.checkLines, P.main666.smoke.checkLines] : null, gateCheckLines: P.main669 && P.base ? [P.base.gate.checkLines, P.main669.gate.checkLines] : null },
  metrics: { mainSame: out.metrics.mainSame, crossTabRefs: { base: out.metrics.base ? out.metrics.base.ratchet.crossTabRefs : null, main667: out.metrics.main667 ? out.metrics.main667.ratchet.crossTabRefs : null, mockA: out.metrics.mockA ? out.metrics.mockA.ratchet.crossTabRefs : null, mockB: out.metrics.mockB ? out.metrics.mockB.ratchet.crossTabRefs : null, afterA: out.metrics.afterA ? out.metrics.afterA.ratchet.crossTabRefs : null, afterB667: out.metrics.afterB667 ? out.metrics.afterB667.ratchet.crossTabRefs : null },
    guardExit: { base: out.guard.base ? out.guard.base.exit : null, main667: out.guard.main667 ? out.guard.main667.exit : null }, limBGuardFailures: out.relax.limB ? out.relax.limB.guardAfterRelax.failures.length : null, limAfterBGuardExit: out.relax.limAfterB ? out.relax.limAfterB.guardAfterRelax.exit : null },
  control: out.control ? { variants: out.control.summary.variants, allAsExpected: out.control.summary.allAsExpected, byPr: out.control.summary.byPr, treeRestored: out.control.treeRestored } : null,
  tools: { mainMapOutputSame: out.tools.main.mapOutputSame, mainTypesOutputSame: out.tools.main.typesOutputSame, mainWrittenFilesSame: out.tools.main.writtenFilesSame, mainProbeCountsSame: out.tools.probe.mainCountsSame,
    mockExitBefore: { A: ['map', 'types', 'testProbe', 'generator'].map(k => out.tools.mock.beforeA[k].exit), B: ['map', 'types', 'testProbe', 'generator'].map(k => out.tools.mock.beforeB[k].exit) },
    mockExitAfter: { A: ['map', 'types', 'testProbe', 'generator'].map(k => out.tools.mock.afterA[k].exit), B: ['map', 'types', 'testProbe', 'generator'].map(k => out.tools.mock.afterB[k].exit) },
    harnessBase: out.harness.base ? { total: out.harness.base.total, passed: out.harness.base.passed, failed: out.harness.base.failed } : null, harnessWork: out.harness.work ? { total: out.harness.work.total, passed: out.harness.work.passed, failed: out.harness.work.failed } : null,
    harnessInnerSame: out.harness.innerSame, harnessNewlyFailedChecks: out.harness.newlyFailedChecks,
    generatorTreeUnchangedAfter: [out.tools.mock.afterA.generator.treeUnchanged, out.tools.mock.afterB.generator.treeUnchanged], probeMockAExit: [out.tools.probe.mockA_base.exit, out.tools.probe.mockA_work.exit, out.tools.probe.mockA_work_nonames.exit],
    harnessExitsSame: out.harness.exitsSame, harnessNonZeroInBoth: out.harness.nonZeroInBoth, harnessChangedByThisWork: out.harness.changedByThisWork },
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + NL, { encoding: 'utf8' });
console.log(JSON.stringify(out.summary, null, 1));
