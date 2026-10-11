#!/usr/bin/env node
'use strict';
// 등록 2차 측정·주장 도구 (#TASK-ES-664) — 작업자 도구, 판정 아님. 등록 줄을 쓰는 것은 이 파일이 아니라 생성기(gen-cell-provide.js --keep)다.
//
//   mockplan 모의 철거용 계획 파일을 만든다: 이번에 더한 이름(provide-plan.json registered) + window 전용에서 통로로 올린 이름(keep.upgradedEntries)
//   measure  기준 트리(origin/main 임시 worktree)와 맞대어 잰다:
//            ① 등록 블록 전후 대조(생성기와 다른 방법 — 블록 글자를 정규식으로 읽는다): 기존 이름이 하나도 빠지지 않았는가 · 더한 이름 = 계획 · 블록 밖 글자 불변 · 800줄
//            ② 바뀐 파일 범위 ③ 대조 탐침(등록 수 · 불일치 · 이중 등록 · 초과 · 값 지문) ④ 새 이름의 통로 값·접근자(상태 탐침) ⑤ 시나리오 ⑥ 모듈 로드 ⑦ npm test · 시험 하나씩
//            ⑧ 모의 철거(저장소 밖 사본에서 새로 등록한 이름의 배선을 지운 것)와 대조군(등록 없이 같은 배선을 지운 것)의 대조 탐침 · 시나리오 · 시험
//   claims   measurement.json 에서 claims.json 을 만든다.
// 사용(작업 트리에서, NODE_PATH=C:/dev/ourgoal-app/node_modules):
//   node reports/TASK-ES-664/provide-run.cjs mockplan <작업 트리>
//   node reports/TASK-ES-664/provide-run.cjs measure  <작업 트리> --base <기준 트리> --mock <모의 철거 트리> --ctrl <대조군 트리>
//       먼저: raw/npm-test.{base,work,mock}.{log,exit} · tests-{base,work,mock}.json · scenarios/*.json · mock-unwire.json · ctrl-unwire.json(reports/TASK-ES-614/mock-unwire.cjs 의 결과)
//   node reports/TASK-ES-664/provide-run.cjs claims   <작업 트리> --req docs/specs/REQ-….md
const fs = require('fs'), path = require('path'), cp = require('child_process');
const argv = process.argv.slice(2), CMD = argv[0], ROOT = path.resolve(argv[1] || '.');
const opt = (k, d) => (argv.indexOf(k) >= 0 ? argv[argv.indexOf(k) + 1] : d);
const TASK = 'TASK-ES-664', REL = 'reports/' + TASK + '/', DIR = path.join(ROOT, 'reports', TASK);
const wj = (f, o) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' });
const rj = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const lf = s => s.replace(/\r\n/g, '\n');
const commands = [];
function run(id, args, cwd) { const t0 = new Date().toISOString(); const r = cp.spawnSync(args[0], args.slice(1), { cwd: cwd || ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }); commands.push({ id, startedAt: t0, endedAt: new Date().toISOString(), exitCode: r.status, stderrHead: (r.stderr || '').slice(0, 200) }); return r; }
const git = (args, cwd) => run('git ' + args[0], ['git'].concat(args), cwd);
const L = s => s.trim().split('\n').map(x => x.trim()).filter(Boolean);
const BEGIN = '/* ==== [세포 등록 시작 · gen-cell-provide.js]', END = '/* ==== [세포 등록 끝] ==== */';

if (CMD === 'mockplan') {
  const p = rj('provide-plan.json');
  wj('mock-plan.json', { note: '모의 철거의 입력 — 이번에 더한 이름 + window 전용에서 통로로 올린 이름. reports/TASK-ES-614/mock-unwire.cjs 가 registered 를 읽는다', registered: p.registered.concat(p.keep.upgradedEntries) });
  console.log('mock-plan', p.registered.length, '+', p.keep.upgradedEntries.length);
  process.exit(0);
}

// 등록 블록을 글자로 읽는다(생성기의 AST 읽기와 다른 방법): { owner, entries: { name: { kit, member, window, scope } } } · 없으면 null
function readBlock(code) {
  const t = lf(code), b = t.indexOf(BEGIN);
  if (b < 0) return null;
  const e = t.indexOf(END, b), body = t.slice(b, e), out = { owner: null, entries: {}, outside: t.slice(0, b) + t.slice(e + END.length) };
  const kitOf = {};
  for (const m of body.matchAll(/^  var (K\d*) = (.+);$/gm)) { const last = m[2].split('&&').pop().trim(); kitOf[m[1]] = last.replace(/^g\./, ''); }
  for (const m of body.matchAll(/^  if \((K\d*)\) R\.provide\('([^']+)', \{\n([\s\S]*?)\n  \}, \{ window: \[([\s\S]*?)\] \}\);$/gm)) {
    const kv = m[1]; out.owner = m[2];
    const tail = m[4], wo = tail.indexOf('], windowOnly: [');
    const strs = s => (s.match(/'([^']+)'/g) || []).map(x => x.slice(1, -1));
    const win = strs(wo >= 0 ? tail.slice(0, wo) : tail), winOnly = wo >= 0 ? strs(tail.slice(wo)) : [];
    for (const pm of m[3].matchAll(/([A-Za-z_$][\w$]*): (K\d*)\.([A-Za-z_$][\w$]*)/g)) out.entries[pm[1]] = { kit: kitOf[kv], member: pm[3], window: win.includes(pm[1]), scope: !winOnly.includes(pm[1]) };
  }
  return out;
}
const jsFiles = root => { const o = []; (function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const p = path.join(d, e.name); if (e.isDirectory()) return walk(p); if (e.name.endsWith('.js')) o.push(path.relative(root, p).replace(/\\/g, '/')); }); })(path.join(root, 'js')); return o.sort(); };
const countLines = t => { const x = lf(t); const n = x.split('\n').length; return x.endsWith('\n') ? n - 1 : n; };

if (CMD === 'measure') {
  const BASE = path.resolve(opt('--base')), MOCK = path.resolve(opt('--mock')), CTRL = path.resolve(opt('--ctrl'));
  const plan = rj('provide-plan.json'), K = plan.keep;
  const baseHead = git(['rev-parse', 'HEAD'], BASE).stdout.trim(), workHead = git(['rev-parse', 'HEAD']).stdout.trim();
  const numstat = L(git(['diff', '--numstat', baseHead, '--']).stdout).map(l => { const [a, d, f] = l.split('\t'); return { file: f, insertions: Number(a), deletions: Number(d) }; });
  const all = numstat.map(x => x.file).concat(L(git(['ls-files', '--others', '--exclude-standard']).stdout)).filter((f, i, a) => a.indexOf(f) === i && !f.startsWith('.claude/'));
  const vaultRe = /^(court\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|\.agent\/rules\/|docs\/rules\/(OURGOAL_ABSOLUTE_INTEGRITY_RULES\.md|CONSTITUTION_VERSIONS\.md|ESSENCE_OURGOAL\.md|rules\.json|rules-control\.json|branch-protection.*\.json|archive\/)|\.github\/|\.githooks\/|scripts\/essence-gate\.js$|scripts\/install-essence-gate\.js$|scripts\/verify-integrity-gate\.js$|scripts\/hook-smoke-on-index\.js$|\.vercelignore$|package\.json$|vercel\.json$|\.gitattributes$|\.claude\/settings\.json$|docs\/directives\/)/;
  const jsChanged = all.filter(f => /^js\//.test(f)).sort();
  // ① 등록 블록 전후 대조
  const before = {}, after = {}, outsideDiff = [], over800 = [];
  for (const f of jsFiles(BASE)) { const b = readBlock(fs.readFileSync(path.join(BASE, f), 'utf8')); if (b) for (const n of Object.keys(b.entries)) before[n] = Object.assign({ file: f, owner: b.owner }, b.entries[n]); }
  const dup = [];
  for (const f of jsFiles(ROOT)) {
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8'), b = readBlock(code);
    if (b) for (const n of Object.keys(b.entries)) { if (after[n]) dup.push(n); after[n] = Object.assign({ file: f, owner: b.owner }, b.entries[n]); }
    if (!jsChanged.includes(f)) continue;
    const base = fs.existsSync(path.join(BASE, f)) ? fs.readFileSync(path.join(BASE, f), 'utf8') : null, bb = base ? readBlock(base) : null;
    const strip = (t, blk) => (blk ? blk.outside : lf(t)).replace(/\n;\n$/, '\n').replace(/\s+$/, '');
    if (base === null || strip(code, b) !== strip(base, bb)) outsideDiff.push(f);
    if (countLines(code) > 800) over800.push({ file: f, lines: countLines(code) });
  }
  const same = (a, b) => a.file === b.file && a.owner === b.owner && a.kit === b.kit && a.member === b.member && a.window === b.window && a.scope === b.scope;
  const lost = Object.keys(before).filter(n => !after[n]), added = Object.keys(after).filter(n => !before[n]).sort();
  const changedEntries = Object.keys(before).filter(n => after[n] && !same(before[n], after[n])).map(n => ({ name: n, before: before[n], after: after[n] }));
  const upgradedOnly = changedEntries.filter(c => c.before.file === c.after.file && c.before.owner === c.after.owner && c.before.kit === c.after.kit && c.before.member === c.after.member && c.before.window === c.after.window && c.before.scope === false && c.after.scope === true).map(c => c.name).sort();
  const blocks = { before: Object.keys(before).length, after: Object.keys(after).length, lost, added: added.length, addedEqualsPlan: JSON.stringify(added) === JSON.stringify(K.addedNames), changedEntries: changedEntries.length, upgradedFromWindowOnly: upgradedOnly, upgradedEqualsPlan: JSON.stringify(upgradedOnly) === JSON.stringify(K.upgradedFromWindowOnly), otherChangedEntries: changedEntries.filter(c => !upgradedOnly.includes(c.name)).map(c => c.name), duplicateNames: dup,
    filesChanged: jsChanged.length, filesEqualPlan: JSON.stringify(jsChanged) === JSON.stringify(K.filesToChange), outsideBlockChanged: outsideDiff, over800, newBlockFiles: K.newBlockFiles.length,
    addedWindow: added.filter(n => after[n].window), addedScopeOnly: added.filter(n => after[n].scope && !after[n].window).length,
    note: '기준·작업 트리의 js/** 전부에서 등록 블록을 글자(정규식)로 읽어 이름 단위로 맞댄 것 — 생성기의 블록 읽기(AST)와 다른 방법이다' };
  // ③ 대조 탐침
  const cmp = path.join(ROOT, 'scripts', 'probes', 'cell-registry-compare.js');
  run('registry base', [process.execPath, cmp, BASE, path.join(DIR, 'cell-registry-compare.base.json'), '--fingerprints']);
  run('registry base2', [process.execPath, cmp, BASE, path.join(DIR, 'cell-registry-compare.base2.json'), '--fingerprints']);
  run('registry work', [process.execPath, cmp, ROOT, path.join(DIR, 'cell-registry-compare.json'), '--fingerprints', '--names-from', path.join(DIR, 'cell-registry-compare.base.json')]);
  run('registry mock', [process.execPath, cmp, MOCK, path.join(DIR, 'cell-registry-compare.mock.json'), '--fingerprints', '--names-from', path.join(DIR, 'cell-registry-compare.base.json')]);
  run('registry ctrl', [process.execPath, cmp, CTRL, path.join(DIR, 'cell-registry-compare.ctrl.json'), '--fingerprints', '--names-from', path.join(DIR, 'cell-registry-compare.base.json')]);
  const cB = rj('cell-registry-compare.base.json'), cB2 = rj('cell-registry-compare.base2.json'), cW = rj('cell-registry-compare.json'), cM = rj('cell-registry-compare.mock.json'), cC = rj('cell-registry-compare.ctrl.json');
  const fpd = (x, y, k) => Object.keys(x.fingerprints[k]).filter(n => x.fingerprints[k][n] !== ((y.fingerprints || {})[k] || {})[n]);
  const intr = { scope: fpd(cB, cB2, 'scope'), window: fpd(cB, cB2, 'window') };
  const fp = c => ({ scope: fpd(cB, c, 'scope').filter(n => !intr.scope.includes(n)), window: fpd(cB, c, 'window').filter(n => !intr.window.includes(n)) });
  const reg = c => ({ ok: c.ok, counts: c.counts, scopeLost: c.namesFrom ? c.namesFrom.scopeLost : null, exceptions: c.guestBoot.exceptions.length, consoleErrors: c.guestBoot.consoleErrors.length, firstException: (c.guestBoot.exceptions[0] || '').split('\n')[0].slice(0, 160), differing: fp(c) });
  // ④ 새 이름의 통로 값·접근자
  wj('probe-names.json', { note: '이번에 더한 이름 + 통로로 올린 이름 — 고정 입력', names: K.addedNames.concat(K.upgradedFromWindowOnly) });
  const probe = path.join(ROOT, 'reports', 'TASK-ES-636', 'state-probe.cjs');
  for (const [tree, out] of [[BASE, 'name-probe.base.json'], [ROOT, 'name-probe.work.json'], [MOCK, 'name-probe.mock.json']]) run('name-probe ' + out, [process.execPath, probe, tree, path.join(DIR, out), '--names', path.join(DIR, 'probe-names.json')]);
  const nB = rj('name-probe.base.json'), nW = rj('name-probe.work.json'), nM = rj('name-probe.mock.json');
  const valDiff = (x, y) => Object.keys(x.names || {}).filter(n => x.names[n].value !== ((y.names || {})[n] || {}).value);
  const ownerCount = p => Object.values(p.names || {}).reduce((a, v) => { const k = v.accessor + ' · ' + v.owner; a[k] = (a[k] || 0) + 1; return a; }, {});
  // ⑤ 시나리오(기준 대 작업 · 기준 대 모의)
  const scDir = path.join(DIR, 'scenarios'), scFiles = fs.readdirSync(scDir).filter(f => /\.json$/.test(f)).sort().map(f => path.join(scDir, f));
  const SL = path.join(ROOT, 'docs', 'design', 'harness', 'module-split', 'scenario-local-z56.js');
  run('scenario work', [process.execPath, SL, BASE, ROOT, path.join(DIR, 'scenario-local.json')].concat(scFiles));
  run('scenario mock', [process.execPath, SL, BASE, MOCK, path.join(DIR, 'scenario-mock.json')].concat(scFiles));
  const rows = j => Object.keys(j.scenarios).map(id => ({ id, basePassed: j.scenarios[id].runs.base.passed, otherPassed: j.scenarios[id].runs.work.passed, otherExceptions: (j.scenarios[id].runs.work.exceptions || []).length, nonVacuousExpects: j.scenarios[id].runs.work.nonVacuousExpects }));
  const sW = rows(rj('scenario-local.json')), sM = rows(rj('scenario-mock.json'));
  // ⑥ 모듈 로드
  const ml = require(path.join(ROOT, 'court', 'probes', 'module-load.js'));
  const mlCmp = ml.compare(ml.probeModules(BASE), ml.probeModules(ROOT), fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
  wj('module-load.json', { tool: 'court/probes/module-load.js (읽기 전용)', type: '작업자 측정, 판정 아님', base: baseHead, measuredAt: new Date().toISOString(), regressions: mlCmp.regressions, insufficient: mlCmp.insufficient, counts: mlCmp.counts });
  // ⑦ npm test · 시험 하나씩
  function readLog(label) {
    const T = lf(fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.log'), 'utf8')).split('\n'), ex = fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), 'utf8');
    const norm = s => s.trim().replace(/\d+(\.\d+)?\s?ms\b/g, 'Nms').replace(/[A-Za-z]:[\\/][^\s"')]+/g, '<path>');
    return { exit: Number((/exit=(\d+)/.exec(ex) || [])[1]), ok: T.filter(l => /^\s*✓ /.test(l)).length, okDot: T.filter(l => /^\s*ok · /.test(l)).length, fail: T.filter(l => /^\s*(✗|✖|not ok|FAIL\b)/.test(l)).map(norm).slice(0, 12), checks: T.filter(l => /^\s*(✓ |ok · )/.test(l)).map(norm) };
  }
  const nb = readLog('base'), nw = readLog('work'), nm = readLog('mock');
  const ms = a => { const m = {}; a.forEach(x => { m[x] = (m[x] || 0) + 1; }); return m; };
  const only = (a, b) => { const A = ms(a), B = ms(b); return Object.keys(A).filter(k => (B[k] || 0) < A[k]); };
  const npm = (x, y) => ({ base: { exit: x.exit, ok: x.ok, okDot: x.okDot, fail: x.fail.length }, other: { exit: y.exit, ok: y.ok, okDot: y.okDot, fail: y.fail.length, failLines: y.fail }, onlyBase: only(x.checks, y.checks).slice(0, 20), onlyOther: only(y.checks, x.checks).slice(0, 20), same: x.exit === 0 && y.exit === 0 && x.ok === y.ok && x.okDot === y.okDot && !only(x.checks, y.checks).length && !only(y.checks, x.checks).length });
  const tB = rj('tests-base.json'), tW = rj('tests-work.json'), tM = rj('tests-mock.json');
  const fset = t => new Set(t.testFiles.filter(x => x.exit !== 0).map(x => x.file)), tail = (t, f) => (t.testFiles.find(x => x.file === f) || {}).tail || null;
  const each = (a, b) => { const fa = fset(a), fb = fset(b); const scripts = b.scripts.map(s => { const o = a.scripts.find(x => x.script === s.script) || {}; return { script: s.script, exit: [o.exit, s.exit], ok: [o.ok, s.ok], fails: [(o.fails || []).length, s.fails.length], newFails: s.fails.filter(x => !(o.fails || []).some(y => JSON.stringify(y) === JSON.stringify(x))).slice(0, 10) }; });
    const r = { scripts, testFiles: b.testFiles.length, failedBase: fa.size, failedOther: fb.size, onlyOther: [...fb].filter(x => !fa.has(x)).map(f => ({ file: f, tail: String(tail(b, f) || '').slice(-300) })), onlyBase: [...fa].filter(x => !fb.has(x)) };
    r.sameAsBase = scripts.every(s => s.exit[0] === s.exit[1] && s.ok[0] === s.ok[1] && s.fails[0] === s.fails[1]) && !r.onlyOther.length && !r.onlyBase.length; return r; };
  // ⑧ 모의 철거 기록
  const mu = rj('mock-unwire.json'), cu = rj('ctrl-unwire.json');
  const muSum = j => ({ before: j.before, after: j.after, deletedLinesTotal: j.deletedLinesTotal, excluded: Object.keys(j.excluded || {}).length, registeredStillWired: (j.registeredStillWired || []).length, importOnlyWithRefs: (j.importOnlyWithRefs || []).length, notRunnableKitVars: j.notRunnableKitVars });
  const mm = f => require(path.join(f, 'scripts', 'module-metrics.js')).measure(f).ratchet, mB = mm(BASE), mW = mm(ROOT), mMk = mm(MOCK);
  const guard = run('module-guard', [process.execPath, 'scripts/module-guard.js', '--quiet']), gate = run('verify-integrity-gate', [process.execPath, 'scripts/verify-integrity-gate.js']);
  const lostInCtrl = (cC.namesFrom && cC.namesFrom.scopeLost) || [];
  const out = { schema: 'ourgoal.provide-run.measurement/1', taskId: TASK, type: '작업자 측정, 판정 아님 — 판정은 GitHub 법정만 낸다', measuredAt: new Date().toISOString(), environment: { node: process.version, platform: process.platform },
    sourceCommit: { baseTreeHead: baseHead, worktreeHead: workHead, note: '기준 = origin/main 임시 worktree. 모의 = 기준 + 이 PR 의 세포 파일 + 새로 등록한 이름의 배선을 지운 index.html(저장소 밖). 대조군 = 기준에서 같은 배선만 지운 것(등록 없음)' },
    summary: {
      changed: { files: all.length, jsChanged: jsChanged.length, indexHtmlChanged: all.includes('index.html'), testsChanged: all.filter(f => /^tests\//.test(f)), vaultChanged: all.filter(f => vaultRe.test(f)), unwireGeneratorChanged: all.filter(f => /gen-inline-hard\.js$/.test(f)), scriptsChanged: all.filter(f => /^scripts\//.test(f)), harnessChanged: all.filter(f => /^docs\/design\/harness\//.test(f)) },
      plan: { existingNames: K.existingNames, plannedNow: K.plannedNow, alreadyRegistered: K.alreadyRegistered, added: K.added, upgradedFromWindowOnly: K.upgradedFromWindowOnly, excluded: K.excluded, newBlockFiles: K.newBlockFiles.length, filesToChange: K.filesToChange.length, skipped: plan.skipped.map(s => ({ name: s.name, reason: s.reason })), iifeOwnedScope: plan.counts.iifeOwnedScope, iifeOwnedWindow: plan.counts.iifeOwnedWindow, byKit: plan.byKit },
      blocks,
      registry: { base: reg(cB), work: reg(cW), intrinsicVariance: intr, registeredGrewBy: cW.counts.registered - cB.counts.registered, extraSameAsBase: cW.counts.extra === cB.counts.extra, missingFellBy: cB.counts.missing - cW.counts.missing },
      nameProbe: { names: Object.keys(nB.names || {}).length, valueDifferingWork: valDiff(nB, nW), accessor: { base: ownerCount(nB), work: ownerCount(nW), mock: ownerCount(nM) }, bootExceptions: { base: nB.guestBoot.exceptions.length, work: nW.guestBoot.exceptions.length, mock: nM.guestBoot.exceptions.length } },
      scenarios: { work: sW, count: sW.length, allPassedBoth: sW.length > 0 && sW.every(r => r.basePassed && r.otherPassed && !r.otherExceptions) },
      moduleLoad: { regressions: mlCmp.regressions.length, insufficient: mlCmp.insufficient.length },
      npmTest: npm(nb, nw), testsEach: each(tB, tW),
      inlineScriptLines: { base: mB.inlineScriptLines, work: mW.inlineScriptLines, same: mB.inlineScriptLines === mW.inlineScriptLines }, ratchet: { oversizeJsFiles: [mB.oversizeJsFiles.count, mW.oversizeJsFiles.count], crossTabRefs: [mB.crossTabRefs, mW.crossTabRefs], windowAssignments: [mB.windowAssignments, mW.windowAssignments] },
      guard: { exitCode: guard.status, integrityGateExitCode: gate.status },
      mockUnwire: { unwire: muSum(mu), inlineScriptLines: { base: mB.inlineScriptLines, mock: mMk.inlineScriptLines, delta: mMk.inlineScriptLines - mB.inlineScriptLines }, registry: reg(cM), nameValueDiffering: valDiff(nB, nM), scenarios: { rows: sM, allPassedBoth: sM.length > 0 && sM.every(r => r.basePassed && r.otherPassed && !r.otherExceptions) }, npmTest: npm(nb, nm), testsEach: each(tB, tM) },
      mockAll: fs.existsSync(path.join(DIR, 'tests-mock-all.json')) ? (a => ({ note: '붙잡힌 이름을 빼지 않고 새로 등록한 이름의 배선을 전부 지운 사본의 시험 결과 — 여기서만 깨지는 시험이 「시험이 배선 글자를 붙잡는 곳」이다', deletedLinesTotal: rj('mock-unwire-all.json').deletedLinesTotal, onlyOther: a.onlyOther, pinned: rj('pinned-names.json').pinned }))(each(tB, rj('tests-mock-all.json'))) : null,
      control: { unwire: muSum(cu), bootFailed: !!cC.guestBoot.error && cC.guestBoot.exceptions.length > 0, bootError: cC.guestBoot.error || null, exceptions: cC.guestBoot.exceptions.length, firstException: (cC.guestBoot.exceptions[0] || '').split('\n')[0].slice(0, 160), scopeLostCount: lostInCtrl.length, note: '등록 없이 같은 배선을 지우면 구역 함수가 통로에서 그 이름을 찾지 못해 부팅이 멈춘다 — 모의 철거가 통과하는 까닭이 이번 등록임을 보이는 대조군' }
    },
    limits: ['법정 판정이 아니다. 모의 철거·대조군은 저장소 밖 사본이다 — 이 PR 은 index.html 을 바꾸지 않는다.', '화면 시나리오는 게스트로 닿는 범위다. 로그인 뒤에만 불리는 이름은 대조 탐침의 값 일치(===)와 지문으로만 쟀다.', '시험이 배선 글자를 붙잡는지는 모의 철거 사본의 npm test 와 시험 하나씩으로 쟀다(깨지는 것이 있으면 목록).'],
    commands };
  wj('measurement.json', out);
  const s = out.summary;
  console.log(JSON.stringify({ changed: s.changed, blocks: Object.assign({}, s.blocks, { note: undefined, upgradedFromWindowOnly: s.blocks.upgradedFromWindowOnly.length }), registry: { base: s.registry.base.counts, work: s.registry.work.counts, lost: s.registry.work.scopeLost, diff: s.registry.work.differing, grew: s.registry.registeredGrewBy, exc: s.registry.work.exceptions }, nameProbe: s.nameProbe, sc: [s.scenarios.count, s.scenarios.allPassedBoth], ml: s.moduleLoad, npm: s.npmTest.same, each: [s.testsEach.sameAsBase, s.testsEach.onlyOther.map(x => x.file)], inline: s.inlineScriptLines, guard: s.guard,
    mock: { unwire: s.mockUnwire.unwire, inline: s.mockUnwire.inlineScriptLines, reg: { counts: s.mockUnwire.registry.counts, lost: s.mockUnwire.registry.scopeLost, diff: s.mockUnwire.registry.differing, exc: s.mockUnwire.registry.exceptions }, val: s.mockUnwire.nameValueDiffering, sc: s.mockUnwire.scenarios.allPassedBoth, npm: [s.mockUnwire.npmTest.same, s.mockUnwire.npmTest.other, s.mockUnwire.npmTest.onlyBase.length], each: [s.mockUnwire.testsEach.sameAsBase, s.mockUnwire.testsEach.onlyOther.map(x => x.file), s.mockUnwire.testsEach.scripts.map(x => [x.script, x.exit, x.fails])] },
    mockAll: s.mockAll && { deleted: s.mockAll.deletedLinesTotal, onlyOther: s.mockAll.onlyOther.map(x => x.file), pinned: s.mockAll.pinned },
    ctrl: { unwire: s.control.unwire.deletedLinesTotal, bootFailed: s.control.bootFailed, exc: s.control.exceptions, first: s.control.firstException } }));
  process.exit(0);
}

if (CMD === 'claims') {
  const REQ = opt('--req'), m = rj('measurement.json').summary, MF = REL + 'measurement.json', scDir = path.join(DIR, 'scenarios');
  const plan = rj('provide-plan.json'), touched = plan.keep.filesToChange;
  const claims = []; let n = 0;
  const add = c => { c.id = 'C' + (++n); claims.push(c); };
  const jp = (req, statement, file, p, equals, more) => add({ req, kind: 'static', domain: 'config', statement, touches: [file].concat(more || []), check: { type: 'jsonPath', file, path: p, equals } });
  for (const f of fs.readdirSync(scDir).filter(x => /\.json$/.test(x)).sort()) { const sc = JSON.parse(fs.readFileSync(path.join(scDir, f), 'utf8')); add({ req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior', statement: sc.title, touches: touched, scenario: 'scenarios/' + f }); }
  jp('R2', '기존 등록 이름이 하나도 빠지지 않았다(기준의 등록 블록에 있던 이름 가운데 작업 트리에 없는 것 0).', MF, 'summary.blocks.lost', [], [REL + 'provide-plan.json']);
  jp('R2', '이번에 더한 이름이 계획 파일의 목록과 같다.', MF, 'summary.blocks.addedEqualsPlan', true);
  jp('R2', '기존 등록 가운데 바뀐 것은 window 전용에서 통로로 올린 이름뿐이고 그 목록이 계획과 같다.', MF, 'summary.blocks.upgradedEqualsPlan', true);
  jp('R2', '그 밖에 바뀐 기존 등록 항목이 없다.', MF, 'summary.blocks.otherChangedEntries', []);
  jp('R2', '같은 이름을 두 세포가 등록한 것이 없다.', MF, 'summary.blocks.duplicateNames', []);
  jp('R2', '바뀐 세포 파일에서 등록 블록 밖의 글자는 기준과 같다.', MF, 'summary.blocks.outsideBlockChanged', []);
  jp('R2', '바뀐 세포 파일이 계획의 파일 목록과 같다.', MF, 'summary.blocks.filesEqualPlan', true);
  jp('R2', '등록 블록을 붙인 뒤 800줄을 넘는 세포 파일이 없다.', MF, 'summary.blocks.over800', []);
  jp('R3', '대조 탐침: 작업 트리의 불일치가 0 이다.', MF, 'summary.registry.work.counts.mismatches', 0, [REL + 'cell-registry-compare.json']);
  jp('R3', '대조 탐침: 이중 등록(conflicts)이 0 이다.', MF, 'summary.registry.work.counts.conflicts', 0);
  jp('R3', '대조 탐침: 초과(등록됐는데 옛 배선에 없는 이름) 수가 기준과 같다 — 이번에 더한 이름은 전부 옛 배선에 있는 이름이다.', MF, 'summary.registry.extraSameAsBase', true);
  jp('R3', '대조 탐침: 등록 이름 수가 더한 이름 수만큼 늘었다.', MF, 'summary.registry.registeredGrewBy', m.plan.added);
  jp('R3', '대조 탐침: 통로에서 사라진 이름이 없다.', MF, 'summary.registry.work.scopeLost', []);
  jp('R3', '이름별 통로 값 지문 차이가 없다.', MF, 'summary.registry.work.differing.scope', []);
  jp('R3', '이름별 window 값 지문 차이가 없다.', MF, 'summary.registry.work.differing.window', []);
  jp('R3', '게스트 부팅 뒤 작업 트리의 예외가 0 건이다.', MF, 'summary.registry.work.exceptions', 0);
  jp('R3', '새로 등록한 이름의 통로 값 요약이 기준과 다른 이름이 없다.', MF, 'summary.nameProbe.valueDifferingWork', []);
  jp('R4', 'index.html 을 바꾸지 않았다.', MF, 'summary.changed.indexHtmlChanged', false);
  jp('R4', 'tests/ 아래 바뀐 파일이 없다.', MF, 'summary.changed.testsChanged', []);
  jp('R4', '금고 아래 바뀐 파일이 없다.', MF, 'summary.changed.vaultChanged', []);
  jp('R4', '철거 생성기(gen-inline-hard.js) 변경이 없다.', MF, 'summary.changed.unwireGeneratorChanged', []);
  jp('R4', 'scripts/ 아래 바뀐 파일이 없다.', MF, 'summary.changed.scriptsChanged', []);
  jp('R4', '모듈 로드 탐침의 새 회귀가 없다.', REL + 'module-load.json', 'regressions', []);
  jp('R4', 'npm test 를 기준·작업 트리에서 전경으로 끝까지 돌려 종료 코드 0 이고 검사 줄이 같다.', MF, 'summary.npmTest.same', true);
  jp('R4', '시험을 하나씩 돌린 결과가 기준과 같다.', MF, 'summary.testsEach.sameAsBase', true);
  jp('R4', 'inlineScriptLines 가 기준과 같다(index.html 변경 0).', MF, 'summary.inlineScriptLines.same', true);
  jp('R4', '모듈 가드 종료 코드가 0 이다.', MF, 'summary.guard.exitCode', 0);
  jp('R4', '무결성 게이트 종료 코드가 0 이다.', MF, 'summary.guard.integrityGateExitCode', 0);
  jp('R5', '모의 철거 사본: 통로에서 사라진 이름이 없다.', MF, 'summary.mockUnwire.registry.scopeLost', []);
  jp('R5', '모의 철거 사본: 이름별 통로 값 지문 차이가 없다.', MF, 'summary.mockUnwire.registry.differing.scope', []);
  jp('R5', '모의 철거 사본: 게스트 부팅 예외가 0 건이다.', MF, 'summary.mockUnwire.registry.exceptions', 0);
  jp('R5', '모의 철거 사본: 새로 등록한 이름의 통로 값 요약이 기준과 다른 이름이 없다.', MF, 'summary.mockUnwire.nameValueDiffering', []);
  jp('R5', '모의 철거 사본: 게스트 시나리오가 기준·모의 양쪽 통과한다.', MF, 'summary.mockUnwire.scenarios.allPassedBoth', true);
  jp('R5', '모의 철거 사본(붙잡힌 이름을 뺀 것): npm test 의 종료 코드와 검사 줄이 기준과 같다.', MF, 'summary.mockUnwire.npmTest.same', true);
  jp('R5', '모의 철거 사본(붙잡힌 이름을 뺀 것): 시험을 하나씩 돌린 결과가 기준과 같다.', MF, 'summary.mockUnwire.testsEach.sameAsBase', true);
  jp('R5', '시험이 배선 글자를 붙잡는 이름 목록(붙잡힌 이름을 빼지 않은 사본에서만 깨지는 시험으로 찾았다 — 재철거는 이 이름의 그 줄을 지우지 않는다).', MF, 'summary.mockAll.pinned', m.mockAll.pinned, [REL + 'pinned-names.json']);
  jp('R5', '모의 철거로 지워지는 줄 수(다음 재철거 PR 의 예상값 — 기준 커밋에 고정된 측정).', MF, 'summary.mockUnwire.unwire.deletedLinesTotal', m.mockUnwire.unwire.deletedLinesTotal);
  jp('R5', '대조군(등록 없이 같은 배선을 지움)은 게스트 부팅이 예외로 멈춘다 — 모의 철거가 통과하는 까닭이 이번 등록이다.', MF, 'summary.control.bootFailed', true);
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  for (const c of claims) { if (c.kind !== 'static') continue; const v = getPath(JSON.parse(fs.readFileSync(path.join(ROOT, c.check.file), 'utf8')), c.check.path); if (JSON.stringify(v) !== JSON.stringify(c.check.equals)) { console.error(c.id + ' 값 불일치: ' + c.check.path + ' = ' + JSON.stringify(v).slice(0, 200)); process.exit(1); } }
  wj('claims.json', { task: TASK, requirementsSource: REQ, requirements: [
    { id: 'R1', text: '키트 가져오기 이름 가운데 등록 기관에 없던 ' + m.plan.added + '개를 그 이름을 키트에 다는 세포 ' + m.plan.filesToChange + '개의 등록 블록에 더한다(window 전용이던 ' + m.plan.upgradedFromWindowOnly.length + '개는 통로로도 내주게 올린다). 앱 동작은 그대로다 — index.html 의 옛 배선이 같은 값을 다시 내준다.' },
    { id: 'R2', text: '등록 줄은 생성기가 쓴다(손 편집 0). 기존 등록은 하나도 빠지지 않고, 세포의 기존 글자는 바뀌지 않으며, 800줄 상한을 지킨다.' },
    { id: 'R3', text: '대조 탐침: 등록 수 증가 · 불일치 0 · 이중 등록 0 · 초과는 기준과 같음 · 값 지문 차이 0.' },
    { id: 'R4', text: 'index.html · tests · 금고 · 철거 생성기 변경 0. 모듈 로드 · npm test · 시험 하나씩이 기준과 같다.' },
    { id: 'R5', text: '모의 철거: 저장소 밖 사본에서 새로 등록한 이름의 배선을 지워도 대조 · 시나리오 · 시험이 기준과 같다. 시험이 글자로 붙잡는 이름은 목록으로 남긴다.' } ],
    outOfScopeReports: [
      { text: '실제 재철거(index.html 의 가져오기·getter·window 줄 삭제)는 이 PR 에 없다. 등록하지 않은 이름(통로와 window 값이 다른 2개 · 800줄 상한에 걸린 1개 · 통로·window 로 나가지 않는 가져오기)은 계획 파일에 사유와 함께 적었다.', cannotBecause: 'out-of-scope-feature' },
      { text: '로그인 뒤에만 불리는 이름의 동작은 화면 시나리오로 재지 못했다 — 대조 탐침의 값 일치와 지문으로만 쟀다.', cannotBecause: 'out-of-scope-feature' } ],
    claims });
  console.log('claims', claims.length, '· behavior', claims.filter(c => c.kind === 'behavior').length);
  process.exit(0);
}
console.error('사용: node provide-run.cjs mockplan|measure|claims <작업 트리> …'); process.exit(2);
