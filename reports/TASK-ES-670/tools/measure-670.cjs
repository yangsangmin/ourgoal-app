'use strict';
// TASK-ES-670 모의 적용 측정 모음(작업자 측정, 판정 아님). 모의 = 기준 커밋의 git 작업 폴더에 고친 생성기를 mock-config.json(allowGuarded 둘)으로 돌리고 module-specs --write · 세포 설명 한 칸 · git add 까지 한 것. 실제 이전은 0 이다(다음 PR).
//  ① 글자: 옮긴 줄을 기준과 줄 단위로 맞댄다 — 접두 `L.` 말고 다른 줄 0 · 접두 수 = 생성기 바꿔 쓰기 수 · 돈 관련 낱말이 든 줄 수(옮긴 줄 · index.html + 세포 전체)가 전후 같음 · 세포 머리 설명에 그 낱말 0
//  ② 동작: 두 곳의 실행 순서·건넨 값 탐침(guarded-probe.cjs) · 상태 탐침 · 대조 탐침 지문 · 시나리오 · 모듈 로드 · npm test · 시험 하나씩 · 지표 · 모듈 가드
// 사용: node measure-670.cjs <작업 트리> <기준 작업 폴더> <모의 작업 폴더> <raw 폴더(npm-test.{base,mock}.{log,exit} · tests-all.{base,mock}.json · guarded-probe.json)> <생성기 메타.json>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [WORK_ARG, BASE, MOCK, RAW, META] = process.argv.slice(2);
const WORK = path.resolve(WORK_ARG), DIR = path.join(WORK, 'reports', 'TASK-ES-670');
const TYPE = '작업자 측정, 판정 아님';
const rj = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const wj = (f, o) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' });
const git = (d, a) => cp.execFileSync('git', a, { cwd: d, encoding: 'utf8' }).trim();
const node = (cwd, args) => cp.spawnSync(process.execPath, args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const LF = s => s.replace(/\r\n/g, '\n');
const MONEY = /credit|subscription|paywall|OURGOAL_CONFIG|광고|구독|결제|크레딧|유료|가격|과금|payment|price|premium/i; // #917(reports/TASK-ES-645/tools/prefix-only-check.cjs)과 같은 낱말
const meta = rj(META);
const stripL = l => l.replace(/(^|[^\w$.])L\.(?=[A-Za-z_$])/g, '$1');
const cellBody = text => { const ls = text.split('\n'), out = {}; let cur = null; for (const l of ls) { const m = l.match(/^  function (\w+)\(\) \{ \/\* \[#/); if (m) { cur = m[1]; out[cur] = []; continue; } if (cur && new RegExp('^  \\} /\\* ' + cur + ' \\*/$').test(l)) { cur = null; continue; } if (cur) out[cur].push(l); } return out; };

// ── ① 글자
const before = LF(fs.readFileSync(path.join(BASE, 'index.html'), 'utf8')), after = LF(fs.readFileSync(path.join(MOCK, 'index.html'), 'utf8')), bl = before.split('\n');
const cellFiles = Object.keys(meta.files), cells = Object.fromEntries(cellFiles.map(f => [f, LF(fs.readFileSync(path.join(MOCK, f), 'utf8'))]));
const segs = meta.regions.map(g => { const lines = bl.slice(g.segment[0] - 1, g.segment[1]), got = (cellBody(cells[g.file])[g.name] || []);
  const row = { region: g.name, file: g.file, baseLines: g.segment, lines: lines.length, identical: 0, prefixOnly: 0, otherDiff: [], strippedPrefixes: 0, moneyLinesBase: 0, moneyLinesCell: 0, moneyLinesSameAfterStrip: true };
  if (lines.length !== got.length) { row.otherDiff.push({ why: '줄 수가 다르다', base: lines.length, cell: got.length }); return row; }
  lines.forEach((l, i) => { const c = got[i], st = stripL(c); if (c === l) row.identical++; else if (st === l) { row.prefixOnly++; row.strippedPrefixes += (c.length - l.length) / 2; } else row.otherDiff.push({ line: g.segment[0] + i, base: l.slice(0, 160), cell: c.slice(0, 160) });
    if (MONEY.test(l)) { row.moneyLinesBase++; if (st !== l) row.moneyLinesSameAfterStrip = false; } if (MONEY.test(c)) row.moneyLinesCell++; });
  return row; });
const count = t => t.split('\n').filter(l => MONEY.test(l)).length;
const headerOf = t => { const ls = t.split('\n'); return ls.slice(0, ls.findIndex(l => l.startsWith('(function(global)'))); };
const sum = f => segs.reduce((a, s) => a + f(s), 0);
const words = { type: TYPE, tool: 'reports/TASK-ES-670/tools/measure-670.cjs', moneyWords: MONEY.source, segments: segs,
  totals: { lines: sum(s => s.lines), identical: sum(s => s.identical), prefixOnly: sum(s => s.prefixOnly), otherDiffLines: sum(s => s.otherDiff.length), strippedPrefixes: sum(s => s.strippedPrefixes), generatorEdits: meta.edits },
  moneyLines: { movedBase: sum(s => s.moneyLinesBase), movedCell: sum(s => s.moneyLinesCell), allSameAfterStrip: segs.every(s => s.moneyLinesSameAfterStrip), indexBefore: count(before), indexAfter: count(after), cellFiles: Object.fromEntries(cellFiles.map(f => [f, count(cells[f])])),
    cellHeaderLines: cellFiles.reduce((a, f) => a + headerOf(cells[f]).filter(l => MONEY.test(l)).length, 0) } };
words.moneyLines.totalAfter = words.moneyLines.indexAfter + Object.values(words.moneyLines.cellFiles).reduce((a, b) => a + b, 0);
words.moneyLines.totalSame = words.moneyLines.indexBefore === words.moneyLines.totalAfter;
words.ok = words.totals.otherDiffLines === 0 && words.totals.strippedPrefixes === meta.edits && words.moneyLines.movedBase === words.moneyLines.movedCell && words.moneyLines.allSameAfterStrip && words.moneyLines.cellHeaderLines === 0 && words.moneyLines.totalSame;
wj('prefix-only-check.json', words);

// ── ② 동작
const gp = rj(path.join(RAW, 'guarded-probe.json')); wj('guarded-probe.json', gp);
const NAMES = ['sb', 'state', 'MOCK_GROUPS', '_promptEncyclopediaOpen', '_subtabTplCat', 'FEED_POSTS_CACHE', 'shareContent'];
const namesFile = path.join(DIR, 'probe-names.json'); wj('probe-names.json', { note: '상태 탐침에 넣는 이름 — 초기화 블록이 읽는 sb · state 와 통로에 노출된 다른 상태 이름', names: NAMES });
const probe = path.join(WORK, 'reports', 'TASK-ES-636', 'state-probe.cjs');
for (const [tree, out] of [[BASE, 'state-probe.base.json'], [BASE, 'state-probe.base2.json'], [MOCK, 'state-probe.mock.json']]) { const r = node(WORK, [probe, path.resolve(tree), path.join(DIR, out), '--names', namesFile]); if (r.status !== 0) throw new Error('상태 탐침 실패 ' + out + ': ' + (r.stderr || '').slice(0, 300)); }
const pB = rj(path.join(DIR, 'state-probe.base.json')), pB2 = rj(path.join(DIR, 'state-probe.base2.json')), pW = rj(path.join(DIR, 'state-probe.mock.json'));
const FIELDS = ['accessor', 'owner', 'value', 'onWindow', 'windowValue', 'windowSame', 'organKind', 'writeRoundtrip'];
const pdiff = (x, y) => Object.keys(x.names || {}).filter(n => FIELDS.some(f => JSON.stringify(x.names[n][f]) !== JSON.stringify(((y.names || {})[n] || {})[f])));
const intrinsic = pdiff(pB, pB2), differing = pdiff(pB, pW).filter(n => !intrinsic.includes(n));
const cmp = path.join(WORK, 'scripts', 'probes', 'cell-registry-compare.js');
for (const [tree, out, extra] of [[BASE, 'cell-registry-compare.base.json', []], [MOCK, 'cell-registry-compare.mock.json', ['--names-from', path.join(DIR, 'cell-registry-compare.base.json')]]]) { const r = node(WORK, [cmp, path.resolve(tree), path.join(DIR, out), '--fingerprints'].concat(extra)); if (r.status !== 0) throw new Error('대조 탐침 실패 ' + out + ': ' + (r.stderr || '').slice(0, 300)); }
const cb = rj(path.join(DIR, 'cell-registry-compare.base.json')), cw = rj(path.join(DIR, 'cell-registry-compare.mock.json'));
const fp = {}; for (const k of ['scope', 'window']) { const fb = cb.fingerprints[k], fw = cw.fingerprints[k], ns = Object.keys(fb); fp[k] = { names: ns.length, diff: ns.filter(n => JSON.stringify(fb[n]) !== JSON.stringify(fw[n])) }; }
const scn = fs.readdirSync(path.join(DIR, 'scenarios')).filter(f => f.endsWith('.json')).sort().map(f => path.join(DIR, 'scenarios', f));
{ const r = node(WORK, [path.join(WORK, 'reports', 'TASK-ES-659', 'tools', 'scenario-local.cjs'), path.resolve(BASE), path.resolve(MOCK), path.join(DIR, 'scenario-mock.json')].concat(scn)); if (r.status !== 0) throw new Error('시나리오 실행 실패: ' + (r.stderr || '').slice(0, 300)); }
const sc = rj(path.join(DIR, 'scenario-mock.json'));
const ml = require(path.join(WORK, 'court', 'probes', 'module-load.js'));
const DIRS = ['js', 'js/core'];
const mlc = ml.compare(ml.probeModules(path.resolve(BASE), DIRS), ml.probeModules(path.resolve(MOCK), DIRS), after);
const one = {}; for (const f of cellFiles) { try { one[f] = ml.loadOne(path.join(path.resolve(MOCK), f)); } catch (e) { one[f] = { threw: String(e && e.message || e) }; } }
const tb = rj(path.join(RAW, 'tests-all.base.json')), tm = rj(path.join(RAW, 'tests-all.mock.json'));
const tdiff = Object.keys(tb).filter(k => !tm[k] || tb[k].exit !== tm[k].exit || tb[k].okLines !== tm[k].okLines);
const npm = {};
for (const label of ['base', 'mock']) {
  const log = fs.readFileSync(path.join(RAW, 'npm-test.' + label + '.log'), 'utf8'), exit = Number(fs.readFileSync(path.join(RAW, 'npm-test.' + label + '.exit'), 'utf8').replace(/[^0-9]/g, ''));
  const ls = log.split(/\r?\n/);
  npm[label] = { exit, checkLines: ls.filter(l => /^\s*✓/.test(l)).length, okLines: ls.filter(l => /^\s*ok\b/.test(l)).length, summaryLines: ls.filter(l => /\d+개 통과, \d+개 실패|총 \d+개 검사 중 \d+개 통과|ALL PASS|100% COMPLETE/.test(l)).map(l => l.trim()) };
}
npm.allSame = npm.base.exit === npm.mock.exit && npm.base.checkLines === npm.mock.checkLines && npm.base.okLines === npm.mock.okLines && JSON.stringify(npm.base.summaryLines) === JSON.stringify(npm.mock.summaryLines);
const metrics = d => JSON.parse(node(path.resolve(d), ['scripts/module-metrics.js']).stdout).ratchet;
const mb = metrics(BASE), mm = metrics(MOCK), guard = node(path.resolve(MOCK), ['scripts/module-guard.js']);
const out = { task: 'TASK-ES-670', type: TYPE, measuredAt: new Date().toISOString(), note: '측정 시점 main(' + git(BASE, ['rev-parse', 'HEAD']).slice(0, 8) + ')의 모의 적용이다. 실제 이전은 0 이다(모의 작업 폴더는 측정 뒤 지운다). 구역 함수 이름과 세포 파일은 모의용이다.',
  baseHead: git(BASE, ['rev-parse', 'HEAD']), config: 'reports/TASK-ES-670/mock-config.json',
  generator: { regions: meta.regions.map(g => ({ name: g.name, segment: g.segment, lines: g.lines, statements: g.statements.length, locals: g.locals, edits: g.edits, headersMoved: g.headersMoved })), guardedAllowed: meta.guardedAllowed, edits: meta.edits, exposed: meta.exposed, htmlLines: [meta.htmlLinesBefore, meta.htmlLinesAfter], files: meta.files },
  prefixOnly: { ok: words.ok, totals: words.totals, moneyLines: words.moneyLines },
  guardedProbe: { ok: gp.ok, sameAsBase: gp.sameAsBase, expected: gp.expected, seq: gp.work.result && gp.work.result.seq, sbIsNullInThisBrowser: gp.work.result && gp.work.result.init && gp.work.result.init.sbIsNull },
  stateProbe: { names: Object.keys(pB.names || {}).length, intrinsicVariance: intrinsic, differing },
  fingerprints: { scopeNames: fp.scope.names, scopeDiff: fp.scope.diff, windowNames: fp.window.names, windowDiff: fp.window.diff, scopeLost: cw.namesFrom.scopeLost, scopeAdded: cw.namesFrom.scopeAdded, mismatches: [cb.counts.mismatches, cw.counts.mismatches] },
  scenarios: { allPassedBoth: sc.allPassedBoth, rows: Object.keys(sc.scenarios).map(id => ({ id, base: sc.scenarios[id].runs.base.passed, base2: sc.scenarios[id].runs.base2.passed, mock: sc.scenarios[id].runs.work.passed, exceptionsMock: (sc.scenarios[id].runs.work.exceptions || []).length })) },
  moduleLoad: { dirs: DIRS, regressions: mlc.regressions, counts: mlc.counts, newFilesLoadOne: one, newFilesLoadOneOk: Object.values(one).every(r => r && r.ok === true) },
  testsAll: { files: Object.keys(tb).length, differingCount: tdiff.length, differing: tdiff.map(k => ({ file: k, base: [tb[k].exit, tb[k].okLines], mock: tm[k] ? [tm[k].exit, tm[k].okLines] : null })) },
  npmTest: npm, metrics: { inlineScriptLines: [mb.inlineScriptLines, mm.inlineScriptLines], delta: mm.inlineScriptLines - mb.inlineScriptLines, windowAssignments: [mb.windowAssignments, mm.windowAssignments], crossTabRefs: [mb.crossTabRefs, mm.crossTabRefs] }, moduleGuard: { exitCode: guard.status } };
out.ok = words.ok && gp.ok === true && differing.length === 0 && fp.scope.diff.length === 0 && fp.window.diff.length === 0 && cw.namesFrom.scopeLost.length === 0 && sc.allPassedBoth === true && mlc.regressions.length === 0 && out.moduleLoad.newFilesLoadOneOk
  && tdiff.length === 0 && npm.allSame && npm.mock.exit === 0 && guard.status === 0 && meta.guardedAllowed.length === 2;
wj('mock-apply.json', out);
console.log(JSON.stringify({ ok: out.ok, prefix: words.totals, money: words.moneyLines, probe: out.guardedProbe, state: out.stateProbe, fp: [fp.scope.diff, fp.window.diff, cw.namesFrom.scopeLost, cw.namesFrom.scopeAdded], sc: out.scenarios.rows.map(r => r.id + ':' + r.base + r.base2 + r.mock), ml: [mlc.regressions, out.moduleLoad.newFilesLoadOneOk], tests: out.testsAll, npm: [npm.base.exit, npm.mock.exit, npm.base.checkLines, npm.mock.checkLines, npm.allSame], metrics: out.metrics, guard: guard.status }));
