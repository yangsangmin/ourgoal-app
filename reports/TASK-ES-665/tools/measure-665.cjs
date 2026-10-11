'use strict';
// TASK-ES-665 측정 모음(작업자 측정, 판정 아님). 손으로 고친 PR 이라 생성기 재실행 대조가 없다 — 그래서 「허용한 차이 말고 0」을 여기서 잰다.
//  ① 글자: 기준·작업 index.html 의 인라인 IIFE 를 파싱해 토큰열(주석 제외)을 맞댄다. 작업 = 기준 − 겹친 선언 두 문의 토큰. 주석은 종류·글자·순서가 같다. 줄 수 같음.
//     지운 두 문은 앞의 같은 이름 선언과 글자가 같고, 두 선언 사이의 최상위 문은 그 이름에 값을 넣지 않는다(문 종류와 글자를 그대로 싣는다).
//  ② 목적: 생성기 unstate 를 저장소 밖 사본에서 이름마다 돌려 기준에서는 멈추고 작업에서는 옮겨지는지 본다(이 PR 은 상태 이전을 하지 않는다).
//  ③ 동작: 상태 탐침(이름별 통로 값 요약 · 접근자 · 주인 · window 복사 동일성 · 쓰기 왕복 — reports/TASK-ES-636/state-probe.cjs, 기준 2회·작업 1회) · 대조 탐침 지문 · 시나리오 · 모듈 로드 ·
//     npm test · 시험 하나씩 · 지표 · 모듈 가드 · 바뀐 파일.
// 사용: node measure-665.cjs <기준 트리> <작업 트리> <raw 폴더(npm-test.{base,work}.{log,exit} · tests-all.{base,work}.json)> [<모의 상태 이전 트리>]
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const parser = require('@babel/parser');
const [BASE, WORK_ARG, RAW, MOCK] = process.argv.slice(2);
const WORK = path.resolve(WORK_ARG), DIR = path.join(WORK, 'reports', 'TASK-ES-665');
const TYPE = '작업자 측정, 판정 아님';
const rj = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const wj = (f, o) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' });
const git = (d, a) => cp.execFileSync('git', a, { cwd: d, encoding: 'utf8' }).trim();
const node = (cwd, args, env) => cp.spawnSync(process.execPath, args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: Object.assign({}, process.env, env || {}) });
const NAMES = ['_subtabTplCat', '_subtabTplQuery', '_subtabTplDomain', '_subtabTplType', 'FEED_POSTS_CACHE', 'shareContent'];
const OTHERS = ['sb', 'state', 'MOCK_GROUPS', '_promptEncyclopediaOpen'];
const GEN = path.join(WORK, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js');

// ── ① 글자
function load(tree) {
  const raw = fs.readFileSync(path.join(tree, 'index.html'), 'utf8'), lines = raw.split('\n').map(l => l.replace(/\r$/, ''));
  let s = -1, e = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
  const code = lines.slice(s, e).join('\n'), ast = parser.parse(code, { sourceType: 'script', tokens: true });
  const call = ast.program.body[0].expression, fn = call.callee || call.argument.callee, top = fn.body.body;
  const toks = ast.tokens.filter(t => typeof t.type !== 'string' && t.type.label !== 'eof');
  const sig = t => (t.type.label || '') + ' ' + (t.value === undefined ? '' : String(t.value));
  const decls = {}; // 이름 → 최상위 선언문들
  top.forEach((st, i) => { if (st.type === 'VariableDeclaration') for (const d of st.declarations) if (d.id.type === 'Identifier') (decls[d.id.name] = decls[d.id.name] || []).push({ st, i, line: st.loc.start.line + s, text: code.slice(st.start, st.end) }); });
  return { lines, s, e, code, ast, top, toks, sig, decls, comments: ast.comments.map(c => c.type + ' ' + c.value), outside: lines.slice(0, s).concat(['…'], lines.slice(e)).join('\n') };
}
const b = load(BASE), w = load(WORK);
const dup = Object.keys(b.decls).filter(n => b.decls[n].length > 1);
const removedStmts = dup.map(n => b.decls[n][b.decls[n].length - 1]);
const inRemoved = t => removedStmts.some(r => t.start >= r.st.start && t.end <= r.st.end);
const expected = b.toks.filter(t => !inRemoved(t)).map(b.sig), got = w.toks.map(w.sig);
const between = dup.map(n => { const [first, last] = [b.decls[n][0], b.decls[n][b.decls[n].length - 1]]; const mid = b.top.slice(first.i + 1, last.i);
  return { name: n, firstLine: first.line, removedLine: last.line, sameText: first.text === last.text, text: last.text, declarations: b.decls[n].length,
    statementsBetween: mid.map(st => ({ type: st.type, text: b.code.slice(st.start, st.end).slice(0, 80) })), assignsNameBetween: mid.some(st => !(st.type === 'VariableDeclaration') || st.declarations.some(d => d.id.type !== 'Identifier' || d.id.name === n)), // 사이의 문이 다른 이름의 선언문이 아니면(또는 그 이름을 다시 선언하면) 참
    onlyLiteralVarDeclsBetween: mid.every(st => st.type === 'VariableDeclaration' && st.declarations.every(d => d.init && (d.init.type === 'StringLiteral' || d.init.type === 'NumericLiteral' || d.init.type === 'BooleanLiteral' || d.init.type === 'NullLiteral'))) }; });
const alone = n => { const ds = w.decls[n] || []; if (ds.length !== 1) return { declarations: ds.length, aloneOnLine: false }; const d = ds[0]; return { declarations: 1, line: d.line, aloneOnLine: d.st.loc.start.line === d.st.loc.end.line && w.lines[d.line - 1].trim() === d.text }; };
const winCopy = w.top.map(st => ({ st, text: w.code.slice(st.start, st.end), line: st.loc.start.line + w.s })).filter(x => x.text === 'window.shareContent = shareContent;');
const numstat = git(WORK, ['diff', '--numstat', git(BASE, ['rev-parse', 'HEAD']), '--', 'index.html']).split(/\s+/);
const tokens = { type: TYPE, tool: 'reports/TASK-ES-665/tools/measure-665.cjs (@babel/parser — 기준·작업 index.html 의 인라인 IIFE)',
  tokenCount: [b.toks.length, w.toks.length], removedStatements: removedStmts.map(r => ({ line: r.line, text: r.text })), removedTokenCount: b.toks.length - expected.length,
  workEqualsBaseMinusRemoved: expected.length === got.length && expected.every((v, i) => v === got[i]),
  comments: { base: b.comments.length, work: w.comments.length, sameTypeTextOrder: b.comments.length === w.comments.length && b.comments.every((v, i) => v === w.comments[i]) },
  duplicateDeclarations: between, allRemovedAreSameTextAsFirst: between.length === 2 && between.every(x => x.sameText && x.declarations === 2), nothingBetweenTouchesTheNames: between.every(x => x.onlyLiteralVarDeclsBetween && !x.assignsNameBetween),
  outsideInlineScriptSame: b.outside === w.outside, lines: { base: b.lines.length, work: w.lines.length, netGrowth: w.lines.length - b.lines.length, numstat: { added: Number(numstat[0]), deleted: Number(numstat[1]) } },
  afterShape: { names: Object.fromEntries(NAMES.map(n => [n, alone(n)])), everyNameDeclaredOnceAloneOnItsLine: NAMES.every(n => { const a = alone(n); return a.declarations === 1 && a.aloneOnLine; }),
    windowShareContentLine: winCopy.length === 1 ? { line: winCopy[0].line, aloneOnLine: w.lines[winCopy[0].line - 1].trim() === winCopy[0].text } : null } };
tokens.ok = tokens.workEqualsBaseMinusRemoved && tokens.comments.sameTypeTextOrder && tokens.allRemovedAreSameTextAsFirst && tokens.nothingBetweenTouchesTheNames && tokens.outsideInlineScriptSame && tokens.lines.netGrowth === 0 && tokens.afterShape.everyNameDeclaredOnceAloneOnItsLine && !!tokens.afterShape.windowShareContentLine && tokens.afterShape.windowShareContentLine.aloneOnLine;
wj('token-diff.json', tokens);

// ── ② unstate 모의(저장소 밖 임시 폴더 — index.html 사본에만 돌린다)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'unstate-665-'));
const unstate = (tree, names, tag) => {
  const d = path.join(tmp, tag); fs.mkdirSync(d, { recursive: true }); fs.copyFileSync(path.join(tree, 'index.html'), path.join(d, 'index.html'));
  const cfg = path.join(d, 'cfg.json'); fs.writeFileSync(cfg, JSON.stringify({ task: 'TASK-ES-665-MOCK', slot: 'HO', mode: 'unstate', cells: [{ file: 'js/core/app-state.js' }], unstate: { names } }), { encoding: 'utf8' });
  const r = node(WORK, [GEN, d, cfg], { MODULE_SPLIT_OUT: d });
  const err = r.status === 0 ? null : ((r.stderr || '').split(/\r?\n/).find(l => /^Error: /.test(l)) || '').replace(/^Error: /, '').slice(0, 200);
  let meta = null; try { if (r.status === 0) meta = rj(path.join(d, 'gen-inline-hard-meta.json')); } catch (_) { /* 메타 없음 */ }
  return { ok: r.status === 0, error: err, stdout: r.status === 0 ? (r.stdout || '').trim().split(/\r?\n/).slice(0, 2) : null, meta, dir: d };
};
const perName = NAMES.concat(OTHERS).map(n => { const rb = unstate(BASE, [n], 'b-' + n), rw = unstate(WORK, [n], 'w-' + n); return { name: n, target: NAMES.includes(n), base: { moves: rb.ok, reason: rb.error }, work: { moves: rw.ok, reason: rw.error } }; });
const allW = unstate(WORK, NAMES, 'w-all'), allB = unstate(BASE, NAMES, 'b-all');
const definesIn = dir => { const t = fs.readFileSync(path.join(dir, 'index.html'), 'utf8'); return Object.fromEntries(NAMES.map(n => { const m = t.match(new RegExp("window\\.OurgoalAppState\\.(define|defineVar)\\('" + n.replace(/\$/g, '\\$') + "',")); return [n, m ? m[1] : null]; })); };
const um = { type: TYPE, tool: 'docs/design/harness/module-split/gen-inline-hard.js mode:"unstate" — 저장소 밖 임시 폴더의 index.html 사본에 이름 하나씩, 그리고 여섯을 한 번에. 이 PR 은 상태 이전을 하지 않는다(모의)',
  perName, targetsMovingInBase: perName.filter(x => x.target && x.base.moves).map(x => x.name), targetsMovingInWork: perName.filter(x => x.target && x.work.moves).map(x => x.name), targetsNotMovingInWork: perName.filter(x => x.target && !x.work.moves).map(x => ({ name: x.name, reason: x.work.reason })),
  allSixTogether: { base: { ok: allB.ok, error: allB.error }, work: { ok: allW.ok, error: allW.error, stdout: allW.stdout, defineKind: allW.ok ? definesIn(allW.dir) : null } },
  allTargetsMoveInWork: perName.filter(x => x.target).every(x => x.work.moves) && allW.ok, noTargetMovesInBase: perName.filter(x => x.target).every(x => !x.base.moves) };
wj('unstate-mock.json', um);
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ }

// ── ③ 동작
const namesFile = path.join(DIR, 'probe-names.json'); wj('probe-names.json', { note: '상태 탐침에 넣는 이름 — 이 PR 이 선언 줄을 다듬은 여섯과, 같은 통로에 노출된 남은 상태 이름 넷', names: NAMES.concat(OTHERS) });
const probe = path.join(WORK, 'reports', 'TASK-ES-636', 'state-probe.cjs');
for (const [tree, out] of [[BASE, 'state-probe.base.json'], [BASE, 'state-probe.base2.json'], [WORK, 'state-probe.work.json']]) { const r = node(WORK, [probe, tree, path.join(DIR, out), '--names', namesFile]); if (r.status !== 0) throw new Error('상태 탐침 실패 ' + out + ': ' + (r.stderr || '').slice(0, 300)); }
const pB = rj(path.join(DIR, 'state-probe.base.json')), pB2 = rj(path.join(DIR, 'state-probe.base2.json')), pW = rj(path.join(DIR, 'state-probe.work.json'));
const FIELDS = ['accessor', 'owner', 'value', 'onWindow', 'windowValue', 'windowSame', 'organKind', 'writeRoundtrip'];
const pdiff = (x, y) => Object.keys(x.names || {}).filter(n => FIELDS.some(f => JSON.stringify(x.names[n][f]) !== JSON.stringify(((y.names || {})[n] || {})[f])));
const intrinsic = pdiff(pB, pB2), differing = pdiff(pB, pW).filter(n => !intrinsic.includes(n));
const stateProbe = { names: Object.keys(pB.names || {}).length, intrinsicVariance: intrinsic, differing, exceptions: [(pB.exceptions || []).length, (pW.exceptions || []).length],
  targets: Object.fromEntries(NAMES.map(n => [n, { base: FIELDS.reduce((a, f) => (a[f] = pB.names[n][f], a), {}), work: FIELDS.reduce((a, f) => (a[f] = pW.names[n][f], a), {}) }])) };
const cmp = path.join(WORK, 'scripts', 'probes', 'cell-registry-compare.js');
for (const [tree, out, extra] of [[BASE, 'cell-registry-compare.base.json', []], [WORK, 'cell-registry-compare.json', ['--names-from', path.join(DIR, 'cell-registry-compare.base.json')]]]) { const r = node(WORK, [cmp, tree, path.join(DIR, out), '--fingerprints'].concat(extra)); if (r.status !== 0) throw new Error('대조 탐침 실패 ' + out + ': ' + (r.stderr || '').slice(0, 300)); }
const cb = rj(path.join(DIR, 'cell-registry-compare.base.json')), cw = rj(path.join(DIR, 'cell-registry-compare.json'));
const fp = {}; for (const k of ['scope', 'window']) { const fb = cb.fingerprints[k], fw = cw.fingerprints[k], ns = Object.keys(fb); fp[k] = { names: ns.length, diff: ns.filter(n => JSON.stringify(fb[n]) !== JSON.stringify(fw[n])) }; }
const scn = fs.readdirSync(path.join(DIR, 'scenarios')).filter(f => f.endsWith('.json')).sort().map(f => path.join(DIR, 'scenarios', f));
{ const r = node(WORK, [path.join(WORK, 'reports', 'TASK-ES-659', 'tools', 'scenario-local.cjs'), path.resolve(BASE), WORK, path.join(DIR, 'scenario-local.json')].concat(scn)); if (r.status !== 0) throw new Error('시나리오 실행 실패: ' + (r.stderr || '').slice(0, 300)); }
const sc = rj(path.join(DIR, 'scenario-local.json'));
const ml = require(path.join(WORK, 'court', 'probes', 'module-load.js'));
const mlc = ml.compare(ml.probeModules(path.resolve(BASE)), ml.probeModules(WORK), fs.readFileSync(path.join(WORK, 'index.html'), 'utf8'));
wj('module-load.json', { tool: 'court/probes/module-load.js (읽기 전용 — compare(probeModules(기준), probeModules(작업)))', type: TYPE, regressions: mlc.regressions, insufficient: mlc.insufficient, fixed: mlc.fixed, counts: mlc.counts });
const tb = rj(path.join(RAW, 'tests-all.base.json')), tw = rj(path.join(RAW, 'tests-all.work.json'));
const tdiff = Object.keys(tb).filter(k => !tw[k] || tb[k].exit !== tw[k].exit || tb[k].okLines !== tw[k].okLines);
wj('tests-all-compare.json', { tool: 'tests/*.test.js 전부 + scripts/smoke-test.js · verify-integrity-gate.js · verify-all-clicks.js · test-shipyard-modular.js · module-guard.js 를 파일마다 node 로 실행(기준·작업)', type: TYPE, files: Object.keys(tb).length, differingCount: tdiff.length,
  differing: tdiff.map(k => ({ file: k, base: tb[k], work: tw[k] || null })), nonZeroExit: { base: Object.keys(tb).filter(k => tb[k].exit !== 0).length, work: Object.keys(tw).filter(k => tw[k].exit !== 0).length } });
const npm = { type: TYPE };
fs.mkdirSync(path.join(DIR, 'raw'), { recursive: true });
for (const label of ['base', 'work']) {
  const log = fs.readFileSync(path.join(RAW, 'npm-test.' + label + '.log'), 'utf8'), exit = Number(fs.readFileSync(path.join(RAW, 'npm-test.' + label + '.exit'), 'utf8').replace(/[^0-9]/g, ''));
  fs.writeFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.log'), log, { encoding: 'utf8' }); fs.writeFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), 'exit=' + exit + '\n', { encoding: 'utf8' });
  const ls = log.split(/\r?\n/);
  npm[label] = { exit, checkLines: ls.filter(l => /^\s*✓/.test(l)).length, okLines: ls.filter(l => /^\s*ok\b/.test(l)).length, summaryLines: ls.filter(l => /\d+개 통과, \d+개 실패|총 \d+개 검사 중 \d+개 통과|ALL PASS|100% COMPLETE/.test(l)).map(l => l.trim()) };
}
npm.allSame = npm.base.exit === npm.work.exit && npm.base.checkLines === npm.work.checkLines && npm.base.okLines === npm.work.okLines && JSON.stringify(npm.base.summaryLines) === JSON.stringify(npm.work.summaryLines);
wj('npm-test-compare.json', npm);
const metrics = d => JSON.parse(node(d, ['scripts/module-metrics.js']).stdout).ratchet;
const mb = metrics(path.resolve(BASE)), mw = metrics(WORK), guard = node(WORK, ['scripts/module-guard.js']);
const baseHead = git(BASE, ['rev-parse', 'HEAD']);
const changed = [...new Set(git(WORK, ['diff', '--name-only', baseHead]).split('\n').filter(Boolean).concat(git(WORK, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)))].sort();
let mockBoot = null;
if (MOCK) { // 모의 상태 이전 사본(이 PR 의 판에 unstate 를 실제로 돌린 git 작업 폴더)이 뜨는지 — 참고 측정
  const out = path.join(DIR, 'mock-unstate-scenario.json');
  const r = node(WORK, [path.join(WORK, 'reports', 'TASK-ES-659', 'tools', 'scenario-local.cjs'), path.resolve(BASE), path.resolve(MOCK), out].concat(scn));
  const pm = path.join(DIR, 'state-probe.mock-unstate.json'); const r2 = node(WORK, [probe, path.resolve(MOCK), pm, '--names', namesFile]);
  if (r.status === 0 && r2.status === 0) { const s = rj(out), p = rj(pm); mockBoot = { what: '이 PR 의 판에 생성기 unstate(여섯 이름)를 돌린 모의 작업 폴더 — 시나리오와 상태 탐침. 실제 상태 이전은 다른 PR 의 몫이다', allScenariosPass: s.allPassedBoth, organKind: Object.fromEntries(NAMES.map(n => [n, p.names[n].organKind])), owner: Object.fromEntries(NAMES.map(n => [n, p.names[n].owner])),
    valueSameAsBase: NAMES.filter(n => p.names[n].value === pB.names[n].value).length, writeRoundtrip: Object.fromEntries(NAMES.map(n => [n, p.names[n].writeRoundtrip])), exceptions: (p.exceptions || []).length }; }
  else mockBoot = { error: ((r.stderr || '') + (r2.stderr || '')).slice(0, 300) };
}
const out = { task: 'TASK-ES-665', type: TYPE, measuredAt: new Date().toISOString(), base: { head: baseHead },
  summary: { tokens: { ok: tokens.ok, removedStatements: tokens.removedStatements.length, removedTokens: tokens.removedTokenCount, commentsSame: tokens.comments.sameTypeTextOrder, netLineGrowth: tokens.lines.netGrowth, numstat: tokens.lines.numstat },
    unstateMock: { allTargetsMoveInWork: um.allTargetsMoveInWork, noTargetMovesInBase: um.noTargetMovesInBase, movingInWork: um.targetsMovingInWork, notMovingInWork: um.targetsNotMovingInWork },
    stateProbe, names: { scopeNames: fp.scope.names, scopeFingerprintDiff: fp.scope.diff, windowNames: fp.window.names, windowFingerprintDiff: fp.window.diff, scopeLost: cw.namesFrom.scopeLost, scopeAdded: cw.namesFrom.scopeAdded, mismatches: [cb.counts.mismatches, cw.counts.mismatches] },
    scenarios: { allPassedBoth: sc.allPassedBoth, rows: Object.keys(sc.scenarios).map(id => ({ id, base: sc.scenarios[id].runs.base.passed, base2: sc.scenarios[id].runs.base2.passed, work: sc.scenarios[id].runs.work.passed, nonVacuousExpectsWork: sc.scenarios[id].runs.work.nonVacuousExpects, exceptionsWork: (sc.scenarios[id].runs.work.exceptions || []).length })) },
    moduleLoad: { regressions: mlc.regressions, counts: mlc.counts }, testsAll: { files: Object.keys(tb).length, differingCount: tdiff.length }, npmTest: { exit: [npm.base.exit, npm.work.exit], checkLines: [npm.base.checkLines, npm.work.checkLines], allSame: npm.allSame },
    ratchet: { inlineScriptLines: [mb.inlineScriptLines, mw.inlineScriptLines], inlineScriptLinesSame: mb.inlineScriptLines === mw.inlineScriptLines, indexFunctionDecls: [mb.indexFunctionDecls, mw.indexFunctionDecls], windowAssignments: [mb.windowAssignments, mw.windowAssignments], guardExit: guard.status },
    changed: { all: changed, productFiles: changed.filter(f => f === 'index.html' || f.startsWith('js/') || /^ui\.(js|css)$/.test(f) || f === 'sw.js'), onlyIndexHtml: JSON.stringify(changed.filter(f => f === 'index.html' || f.startsWith('js/') || /^ui\.(js|css)$/.test(f) || f === 'sw.js')) === '["index.html"]', testsChanged: changed.filter(f => f.startsWith('tests/')),
      vaultChanged: changed.filter(f => /^(court\/|\.github\/|\.githooks\/|AGENTS\.md|CLAUDE\.md|GEMINI\.md|01_OURGOAL|package\.json|vercel\.json|scripts\/(essence-gate|verify-integrity-gate)\.js|docs\/rules\/(OURGOAL_ABSOLUTE|CONSTITUTION_VERSIONS|ESSENCE_OURGOAL|rules)|docs\/directives\/)/.test(f)),
      generatedMapsChanged: changed.filter(f => f.startsWith('docs/design/harness/') || /docs\/architecture\/(cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md|module-baseline\.json|modules\.json)/.test(f)) },
    mockUnstateBoot: mockBoot } };
wj('measurement.json', out);
console.log(JSON.stringify({ tokens: out.summary.tokens, unstate: out.summary.unstateMock, probe: { names: stateProbe.names, intrinsic, differing }, fp: [fp.scope.diff, fp.window.diff, cw.namesFrom.scopeLost], sc: out.summary.scenarios.rows.map(r => r.id + ':' + r.base + r.base2 + r.work), ml: mlc.regressions, tests: tdiff.length, npm: out.summary.npmTest, ratchet: out.summary.ratchet, changed: out.summary.changed.productFiles, mock: mockBoot }));
