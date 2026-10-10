#!/usr/bin/env node
'use strict';
// 배선 철거 실행기 (#TASK-ES-618 · 여러 실행 #TASK-ES-622 · docs/architecture/CELL-REGISTRY-DESIGN.md 4절 「배선 철거」·6.2절 순서 2) — 작업자 도구, 판정 아님.
// 철거 PR 을 같은 절차·같은 증거 꼴로 만들기 위한 것이다. 줄을 지우는 것은 이 파일이 아니라 생성기(gen-inline-hard.js mode:"unwire")다 — 손 편집 0.
//
//   apply   철거 계획(reports/TASK-ES-614/unwire-plan.json 꼴)에서 실행(키트·차수)마다 names 를 읽어 reports/<TASK>/proof.json 을 쓰고, 생성기를 돌린다.
//           실행이 하나면 "unwire" 는 객체, 여럿이면 배열(생성기가 차례로 적용 — #TASK-ES-619)이다.
//           생성기가 멈추면(한 줄을 나눠 쓰는 대입 등) 멈춘 실행에서 멈춘 이름만 빼고 proof.json 을 다시 써서 돌린다. 뺀 이름과 생성기 원문 사유는 unwire-meta.json 에 남긴다.
//   measure 기준 트리(origin/main 임시 worktree)와 맞대어 잰다: 바뀐 파일 범위 · 「생성기가 적어 낸 줄 말고는 0」(실행을 차례로 되짚어 기준 index.html 에서 작업 index.html 을 다시 만든다) ·
//           인라인 줄 수 전→후 · 대조 탐침(이름 목록은 기준 트리 결과로 고정) · 이름별 값 지문 · 시나리오(reports/<TASK>/scenarios/*.json) · 모듈 로드 · npm test 로그 비교 · module-guard
//           → reports/<TASK>/measurement.json
//   claims  measurement.json 에서 reports/<TASK>/claims.json 을 만든다(보존 주장 = 시나리오마다 하나 + proof.json, 기록 주장 = 측정 파일의 값).
//
// 사용(작업 트리에서, NODE_PATH=C:/dev/ourgoal-app/node_modules):
//   node docs/design/harness/module-split/unwire-run.js apply   <작업 트리> --task TASK-ES-6xx --runs _goalsKit:1,_goalsKit:2,_settingsKit:2 [--plan reports/TASK-ES-614/unwire-plan.json] [--label "…"]
//       (실행 하나면 --kit _settingsKit --pass 1 로도 된다.)  실행 = <손잡이 이름>:<차수>[:옵션+옵션]   옵션: shared(X3 sharedLine) · dropkit(X2 dropKitVar)
//       이름은 계획의 runs 에서 읽는다. 계획 당시 생성기가 못 돌리던 손잡이(X1 `_ui`·`_xp`)는 계획의 notRunnableKitVars.registeredNames 에서 읽고,
//       --names-for <손잡이:차수>=이름+이름[,…] 으로 그 실행의 이름을 손으로 줄 수도 있다(예: 1차에서 참조가 남아 멈춘 이름을 2차로 돌릴 때).
//   node docs/design/harness/module-split/unwire-run.js measure <작업 트리> --task TASK-ES-6xx --base <기준 트리>
//       먼저: reports/<TASK>/raw/npm-test.{base,work}.{log,exit} (npm test 를 두 트리에서 전경으로 끝까지 돌린 것) · reports/<TASK>/scenarios/*.json
//   node docs/design/harness/module-split/unwire-run.js claims  <작업 트리> --task TASK-ES-6xx --req docs/specs/REQ-….md
// 차수 1 = 가져오기·getter·window 세 종류 모두(계획의 imports:true 실행) · 차수 2 = 가져오기 줄은 남기고 getter·window 줄만(imports:false 실행).
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const argv = process.argv.slice(2);
const CMD = argv[0], ROOT = path.resolve(argv[1] || '.');
const opt = (k, d) => (argv.indexOf(k) >= 0 ? argv[argv.indexOf(k) + 1] : d);
const TASK = opt('--task');
if (!['apply', 'measure', 'claims'].includes(CMD) || !TASK) { console.error('사용: node unwire-run.js apply|measure|claims <작업 트리> --task TASK-ES-6xx …(머리 주석 참고)'); process.exit(2); }
const REL = 'reports/' + TASK + '/', DIR = path.join(ROOT, 'reports', TASK);
const GEN = path.join(ROOT, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js');
const REGISTRY = 'js/core/cell-registry.js', INDEX = path.join(ROOT, 'index.html');
const wj = (f, o) => { fs.mkdirSync(path.dirname(path.join(DIR, f)), { recursive: true }); fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' }); };
const rj = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const lf = s => s.replace(/\r\n/g, '\n');
const commands = [];
function run(id, args, cwd, env) {
  const t0 = new Date().toISOString();
  const r = cp.spawnSync(args[0], args.slice(1), { cwd: cwd || ROOT, encoding: 'utf8', env: Object.assign({}, process.env, env || {}), shell: false, maxBuffer: 256 * 1024 * 1024 });
  commands.push({ id, argv: args.map(a => String(a).replace(ROOT, '<작업 트리>')), startedAt: t0, endedAt: new Date().toISOString(), exitCode: r.status, stdoutHead: (r.stdout || '').slice(0, 200), stderrHead: (r.stderr || '').slice(0, 200) });
  return r;
}
const git = (args, cwd) => run('git ' + args.slice(0, 2).join(' '), ['git'].concat(args), cwd);
const L = s => s.trim().split('\n').map(x => x.trim()).filter(Boolean);
const specsOf = proof => (Array.isArray(proof.unwire) ? proof.unwire : [proof.unwire]);
const passWord = u => (u.imports === false ? '2차(가져오기 줄은 남김)' : '1차');

// ───────────────────────── apply ─────────────────────────
if (CMD === 'apply') {
  const PLAN_REL = opt('--plan', 'reports/TASK-ES-614/unwire-plan.json');
  const plan = JSON.parse(fs.readFileSync(path.join(ROOT, PLAN_REL), 'utf8'));
  const runsArg = opt('--runs') || (opt('--kit') ? opt('--kit') + ':' + opt('--pass', '1') : null);
  if (!runsArg) { console.error('--runs <손잡이:차수,…> 또는 --kit/--pass 가 필요하다'); process.exit(2); }
  const want = runsArg.split(',').map(s => { const [kitVar, pass, opts] = s.trim().split(':'); return { kitVar, pass: Number(pass || 1), opts: (opts || '').split('+').filter(Boolean) }; });
  // 이름의 출처: ① --names-for <손잡이:차수>=이름+이름,… (손으로 지정) ② 계획의 runs ③ 계획의 notRunnableKitVars.registeredNames(계획 당시 생성기가 못 돌리던 손잡이 — X1 `_ui`·`_xp`)
  const namesFor = {}; (opt('--names-for') || '').split(',').filter(Boolean).forEach(s => { const [k, v] = s.split('='); namesFor[k.trim()] = (v || '').split('+').filter(Boolean); });
  const runs = want.map(w => {
    const key = w.kitVar + ':' + w.pass;
    const pr = plan.runs.find(r => r.kitVar === w.kitVar && r.flags.imports === (w.pass === 1));
    const nr = (plan.notRunnableKitVars || []).find(k => k.kitVar === w.kitVar);
    const planned = namesFor[key] || (pr ? pr.names : (nr ? nr.registeredNames : null));
    if (!planned) { console.error('계획에 그 실행이 없다: ' + key); process.exit(2); }
    return { kitVar: w.kitVar, pass: w.pass, opts: w.opts, planned: planned.slice(), plannedDeletedLines: pr && !namesFor[key] ? pr.expectedDeletedLines : null, names: planned.slice(), dropped: [],
      source: namesFor[key] ? '--names-for' : (pr ? '계획 runs' : '계획 notRunnableKitVars.registeredNames') };
  });
  const textBefore = fs.readFileSync(INDEX, 'utf8'); // 철거 전 글자(매 시도는 여기서 시작한다)
  const restore = () => fs.writeFileSync(INDEX, textBefore, { encoding: 'utf8' });
  const before = lf(textBefore).split('\n');
  const label = opt('--label', '배선 철거 — ' + runs.map(r => r.kitVar + ' ' + r.pass + '차').join(' · '));
  const specOf = r => { const u = { kitVar: r.kitVar, imports: r.pass === 1, exposeGetters: true, windowAssign: true, names: r.names }; if (r.opts.includes('shared')) u.sharedLine = true; if (r.opts.includes('dropkit')) u.dropKitVar = true; return u; };
  const proofOf = () => { const live = runs.filter(r => r.names.length || r.opts.includes('dropkit')); return { task: TASK, label, slot: 'HO', mode: 'unwire', cells: [{ file: REGISTRY }], unwire: live.length === 1 && runs.length === 1 ? specOf(live[0]) : live.map(specOf) }; };
  let meta = null, tries = 0;
  while (runs.some(r => r.names.length) && tries < 60) {
    tries++;
    restore();
    wj('proof.json', proofOf());
    const metaDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unwire-run-meta-'));
    const r = run('gen-inline-hard unwire', [process.execPath, GEN, ROOT, path.join(DIR, 'proof.json')], ROOT, { MODULE_SPLIT_OUT: metaDir });
    if (r.status === 0) { meta = JSON.parse(fs.readFileSync(path.join(metaDir, 'gen-inline-hard-meta.json'), 'utf8')); fs.rmSync(metaDir, { recursive: true, force: true }); break; }
    fs.rmSync(metaDir, { recursive: true, force: true });
    const text = (((r.stderr || '') + (r.stdout || '')).split('\n').find(l => /Error: /.test(l)) || '(메시지 없음)').replace(/^.*Error: /, '');
    const live = runs.filter(x => x.names.length || x.opts.includes('dropkit'));
    const at = /\[unwire 실행 (\d+)\/\d+\]/.exec(text), target = at ? live[Number(at[1]) - 1] : live[0];
    const words = new Set(text.split(/[^A-Za-z0-9_$]+/));
    const drop = target ? target.names.filter(n => words.has(n)) : [];
    if (!drop.length) { restore(); console.error('생성기 정지 — 멈춘 이름을 가려내지 못했다(손으로 확인): ' + text); process.exit(1); }
    drop.forEach(n => target.dropped.push({ name: n, generator: text }));
    target.names = target.names.filter(n => !drop.includes(n));
  }
  if (!meta) { restore(); console.error('지울 이름이 남지 않았다'); process.exit(1); }
  const after = lf(fs.readFileSync(INDEX, 'utf8')).split('\n');
  const metas = meta.runs || [meta], live = runs.filter(r => r.names.length || r.opts.includes('dropkit'));
  const cnt = m => ({ imports: m.removed.imports.length, exposeProps: m.removed.exposeProps.length, exposeCalls: m.removed.exposeCalls.length, windowAssigns: m.removed.windowAssigns.length, windowBlocks: m.removed.windowBlocks.length, commaFixedLines: m.commaFixedLines.length, inlineEdits: (m.inlineEdits || []).length, kitVarLine: m.removed.kitVarLine ? 1 : 0, deletedLines: m.deletedLines.length });
  const outRuns = live.map((r, i) => ({ order: i + 1, kitVar: r.kitVar, pass: r.pass, options: r.opts, namesSource: r.source, plannedNames: r.planned.length, plannedDeletedLines: r.plannedDeletedLines, names: r.names.length, droppedFromPlan: r.dropped,
    removed: cnt(metas[i]), htmlLines: [metas[i].htmlLinesBefore, metas[i].htmlLinesAfter], deletedLineNumbers: metas[i].deletedLines, commaFixedLineNumbers: metas[i].commaFixedLines, inlineEdits: metas[i].inlineEdits || [], removedDetail: metas[i].removed }));
  const skipped = runs.filter(r => !live.includes(r)).map(r => ({ kitVar: r.kitVar, pass: r.pass, plannedNames: r.planned.length, droppedFromPlan: r.dropped, why: '지울 이름이 남지 않아 실행에서 뺌' }));
  const tot = k => outRuns.reduce((a, r) => a + r.removed[k], 0);
  wj('unwire-meta.json', { tool: 'docs/design/harness/module-split/unwire-run.js apply', type: '생성기 산출 기록(작업자 측정, 판정 아님)', task: TASK, plan: { file: PLAN_REL }, generatorTries: tries,
    totals: { runs: outRuns.length, names: outRuns.reduce((a, r) => a + r.names, 0), plannedNames: runs.reduce((a, r) => a + r.planned.length, 0), droppedFromPlan: runs.reduce((a, r) => a + r.dropped.length, 0),
      removed: { imports: tot('imports'), exposeProps: tot('exposeProps'), exposeCalls: tot('exposeCalls'), windowAssigns: tot('windowAssigns'), windowBlocks: tot('windowBlocks'), commaFixedLines: tot('commaFixedLines'), inlineEdits: tot('inlineEdits'), kitVarLine: tot('kitVarLine'), deletedLines: tot('deletedLines') }, htmlLines: [before.length, after.length] },
    runs: outRuns, skippedRuns: skipped });
  outRuns.forEach(r => console.log('apply [' + r.order + '/' + outRuns.length + ']', r.kitVar, r.pass + '차 · names', r.names, '(계획 ' + r.plannedNames + ', 뺀 ' + r.droppedFromPlan.length + ') · 삭제', r.removed.deletedLines, '줄 · 쉼표', r.removed.commaFixedLines, '·', r.htmlLines[0], '->', r.htmlLines[1]));
  console.log('index.html', before.length, '->', after.length, '· 시도', tries);
  process.exit(0);
}

// ───────────────────────── measure ─────────────────────────
if (CMD === 'measure') {
  const BASE = path.resolve(opt('--base'));
  const meta = rj('unwire-meta.json'), proof = rj('proof.json'), specs = specsOf(proof);
  const baseHead = git(['rev-parse', 'HEAD'], BASE).stdout.trim(), workHead = git(['rev-parse', 'HEAD']).stdout.trim();
  const numstat = L(git(['diff', '--numstat', baseHead, '--']).stdout).map(l => { const [a, d, f] = l.split('\t'); return { file: f, insertions: Number(a), deletions: Number(d) }; });
  const all = numstat.map(x => x.file).concat(L(git(['ls-files', '--others', '--exclude-standard']).stdout));
  const productRe = /^(js\/.*|index\.html|ui\.js|sw\.js|.*\.css)$/;
  const vaultRe = /^(court\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|\.agent\/rules\/|docs\/rules\/(OURGOAL_ABSOLUTE_INTEGRITY_RULES\.md|CONSTITUTION_VERSIONS\.md|ESSENCE_OURGOAL\.md|rules\.json|rules-control\.json|branch-protection.*\.json|archive\/)|\.github\/|\.githooks\/|scripts\/essence-gate\.js$|scripts\/install-essence-gate\.js$|scripts\/verify-integrity-gate\.js$|scripts\/hook-smoke-on-index\.js$|\.vercelignore$|package\.json$|vercel\.json$|\.gitattributes$|\.claude\/settings\.json$|docs\/directives\/)/;
  // 「생성기가 적어 낸 줄 말고는 0」: 기준 index.html 에서 실행을 차례로 되짚는다 — 지운 줄을 빼고, 쉼표를 떼고, (X3) 한 줄 안 삭제를 반영 — 그 결과가 작업 index.html 과 글자 그대로 같다
  const bl = lf(fs.readFileSync(path.join(BASE, 'index.html'), 'utf8')).split('\n'), wl = lf(fs.readFileSync(INDEX, 'utf8')).split('\n');
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let cur = bl.slice(); const perRun = [];
  const removedScope = new Set(), removedWindow = new Set(), removedAny = new Set();
  meta.runs.forEach((r, i) => {
    const del = new Set(r.deletedLineNumbers), comma = new Set(r.commaFixedLineNumbers), edits = new Map((r.inlineEdits || []).map(e => [e.line, e]));
    const R = r.removedDetail, kinds = new Set(), spec = specs[i];
    R.imports.forEach(x => kinds.add(x.line)); R.exposeProps.forEach(x => kinds.add(x.line)); R.exposeCalls.forEach(x => { for (let l = x.line; l <= x.endLine; l++) kinds.add(l); });
    R.windowAssigns.forEach(x => kinds.add(x.line)); R.windowBlocks.forEach(x => { for (let l = x.line; l <= x.endLine; l++) kinds.add(l); });
    if (R.kitVarLine) kinds.add(R.kitVarLine.line);
    edits.forEach((e, l) => kinds.add(l));
    const names = R.imports.concat(R.exposeProps, R.windowAssigns).map(x => x.name);
    R.exposeProps.forEach(x => removedScope.add(x.name)); R.windowAssigns.forEach(x => removedWindow.add(x.name)); names.forEach(n => removedAny.add(n));
    perRun.push({ order: r.order, kitVar: r.kitVar, pass: r.pass, linesBeforeMatch: cur.length === r.htmlLines[0], deletedOutsideListedKinds: [...del].filter(n => !kinds.has(n)), namesOutsideProof: names.filter(n => !spec.names.includes(n)),
      importLinesAreKitImports: R.imports.every(x => new RegExp('^\\s*var\\s+' + escRe(x.name) + '\\s*=\\s*' + escRe(r.kitVar) + '\\.' + escRe(x.name) + '\\s*;\\s*$').test(cur[x.line - 1])),
      inlineEditBeforeMatches: [...edits.values()].every(e => cur[e.line - 1] === e.before), commaFixedAreOneCharEach: [...comma].every(n => cur[n - 1].replace(/,\s*$/, '').length === cur[n - 1].replace(/\s*$/, '').length - 1) });
    const next = [];
    cur.forEach((t, k) => { const n = k + 1; if (del.has(n)) return; if (edits.has(n)) { const e = edits.get(n); if (e.after !== null) next.push(e.after); return; } next.push(comma.has(n) ? t.replace(/,\s*$/, '') : t); });
    cur = next;
  });
  const onlyDeletions = { rebuiltEqualsWork: cur.length === wl.length && cur.every((t, i) => t === wl[i]), baseLines: bl.length, workLines: wl.length, runs: perRun.length,
    note: '기준 index.html 에서 실행마다 생성기가 적어 낸 줄(deletedLineNumbers)을 지우고 commaFixedLineNumbers 줄 끝 쉼표 한 글자를 떼고 inlineEdits 를 반영한 결과 == 작업 index.html (줄바꿈만 LF 로 맞춤). 참이면 그 밖의 글자 변경 0 · 더한 줄 0' };
  const kindsOnly = { deletedOutsideListedKinds: perRun.flatMap(p => p.deletedOutsideListedKinds.map(n => ({ run: p.order, line: n }))), namesOutsideProof: perRun.flatMap(p => p.namesOutsideProof.map(n => ({ run: p.order, name: n }))),
    allImportLinesAreKitImports: perRun.every(p => p.importLinesAreKitImports), allRunsReplayed: perRun.every(p => p.linesBeforeMatch && p.inlineEditBeforeMatches && p.commaFixedAreOneCharEach), perRun,
    extendedKindsUsed: { sharedLine: specs.filter(u => u.sharedLine === true).length, dropKitVar: specs.filter(u => u.dropKitVar === true).length, nonKitHandle: specs.filter(u => !/^_\w+Kit$/.test(u.kitVar)).length },
    note: '실행마다: 지운 줄이 전부 가져오기 줄 · expose getter/setter 속성 줄(과 빈 껍데기) · window 대입 줄(과 빈 블록 껍데기) · (설정에 있을 때만) 손잡이 줄·한 줄 안 삭제 줄에 든다' };
  const mm = require(path.join(ROOT, 'scripts', 'module-metrics.js'));
  const mW = mm.measure(ROOT).ratchet, mB = require(path.join(BASE, 'scripts', 'module-metrics.js')).measure(BASE).ratchet;
  const guard = run('module-guard', [process.execPath, 'scripts/module-guard.js', '--quiet']);
  const baselineJ = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'architecture', 'module-baseline.json'), 'utf8')), baselineB = JSON.parse(fs.readFileSync(path.join(BASE, 'docs', 'architecture', 'module-baseline.json'), 'utf8'));
  const lastOf = j => j.history[j.history.length - 1].metrics.inlineScriptLines;
  // 대조 탐침: 기준 트리(철거 전) → 그 이름 목록으로 작업 트리
  const probe = path.join(ROOT, 'scripts', 'probes', 'cell-registry-compare.js');
  run('probe base', [process.execPath, probe, BASE, path.join(DIR, 'cell-registry-compare.before.json'), '--fingerprints']);
  run('probe work', [process.execPath, probe, ROOT, path.join(DIR, 'cell-registry-compare.json'), '--fingerprints', '--names-from', path.join(DIR, 'cell-registry-compare.before.json')]);
  const cB = rj('cell-registry-compare.before.json'), cW = rj('cell-registry-compare.json');
  const fpd = k => Object.keys(cB.fingerprints[k]).filter(n => cB.fingerprints[k][n] !== cW.fingerprints[k][n]);
  const present = (k, n) => !!cW.fingerprints[k][n] && cW.fingerprints[k][n] !== '(absent)';
  const rs = [...removedScope], rw = [...removedWindow];
  // 시나리오(법정 실행기를 읽기만 쓰는 로컬 실행 — 기준 대 작업)
  const scDir = path.join(DIR, 'scenarios'), scFiles = fs.existsSync(scDir) ? fs.readdirSync(scDir).filter(f => /\.json$/.test(f)).sort() : [];
  if (scFiles.length) run('scenario-local', [process.execPath, path.join(ROOT, 'docs', 'design', 'harness', 'module-split', 'scenario-local-z56.js'), BASE, ROOT, path.join(DIR, 'scenario-local.json')].concat(scFiles.map(f => path.join(scDir, f))));
  const sc = scFiles.length ? rj('scenario-local.json') : { scenarios: {}, allPassedBoth: null };
  // 모듈 로드(법정 탐침과 같은 비교)
  const ml = require(path.join(ROOT, 'court', 'probes', 'module-load.js'));
  const cmp = ml.compare(ml.probeModules(BASE), ml.probeModules(ROOT), fs.readFileSync(INDEX, 'utf8'));
  wj('module-load.json', { tool: 'court/probes/module-load.js (읽기 전용 — compare(probeModules(기준), probeModules(작업)))', type: '작업자 측정, 판정 아님', base: baseHead, measuredAt: new Date().toISOString(), regressions: cmp.regressions, insufficient: cmp.insufficient, fixed: cmp.fixed, counts: cmp.counts });
  // npm test 로그 비교
  const readLog = label => {
    const f = path.join(DIR, 'raw', 'npm-test.' + label + '.log'); if (!fs.existsSync(f)) return null;
    const T = lf(fs.readFileSync(f, 'utf8')).split('\n'), ex = fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), 'utf8').trim();
    const norm = s => s.trim().replace(/\d+(\.\d+)?\s?ms\b/g, 'Nms').replace(/[A-Za-z]:[\\/][^\s"')]+/g, '<path>');
    const ok = T.filter(l => /^\s*✓ /.test(l)).map(norm), okDot = T.filter(l => /^\s*ok · /.test(l)).map(norm), fail = T.filter(l => /^\s*(✗|✖|not ok|FAIL\b)/.test(l)).map(norm);
    return { file: REL + 'raw/npm-test.' + label + '.log', ok: ok.length, okDot: okDot.length, fail: fail.length, exit: Number((/exit=(\d+)/.exec(ex) || [])[1]), summaryTokens: T.filter(l => /(\d+개 통과|검증 결과|ALL PASS|COMPLETE|^\s*\[\d+\/\d+\]|\[검증 \d+\/\d+\])/.test(l)).map(norm), _c: ok.concat(okDot) };
  };
  const nb = readLog('base'), nw = readLog('work'); let npm = null;
  if (nb && nw) {
    const ms = a => { const m = {}; a.forEach(x => { m[x] = (m[x] || 0) + 1; }); return m; }, b = ms(nb._c), w = ms(nw._c);
    const onlyBase = Object.keys(b).filter(k => (w[k] || 0) < b[k]), onlyWork = Object.keys(w).filter(k => (b[k] || 0) < w[k]); delete nb._c; delete nw._c;
    npm = { base: nb, work: nw, onlyBase, onlyWork, same: JSON.stringify(nb.summaryTokens) === JSON.stringify(nw.summaryTokens) && nb.ok === nw.ok && nb.okDot === nw.okDot && nb.exit === 0 && nw.exit === 0 && !onlyBase.length && !onlyWork.length && nb.fail === 0 && nw.fail === 0 };
    wj('npm-test-compare.json', npm);
  }
  const scRows = Object.keys(sc.scenarios).map(id => ({ id, basePassed: sc.scenarios[id].runs.base.passed, workPassed: sc.scenarios[id].runs.work.passed, baseExceptions: (sc.scenarios[id].runs.base.exceptions || []).length, workExceptions: (sc.scenarios[id].runs.work.exceptions || []).length, nonVacuousExpects: sc.scenarios[id].runs.work.nonVacuousExpects }));
  const out = { schema: 'ourgoal.unwire-run.measurement/2', taskId: TASK, type: '작업자 측정, 판정 아님 — 판정은 GitHub 법정(node court/chat.js <PR>)만 낸다', measuredAt: new Date().toISOString(),
    environment: { node: process.version, platform: process.platform, gitAutocrlf: git(['config', 'core.autocrlf']).stdout.trim() || null },
    sourceCommit: { baseTreeHead: baseHead, worktreeHead: workHead, note: '기준 = origin/main 임시 git worktree(저장소 밖). 작업 = 이 트리(작업 트리 상태 그대로)' },
    summary: {
      unwire: { runs: meta.runs.map(r => ({ order: r.order, kitVar: r.kitVar, pass: r.pass, options: r.options, names: r.names, plannedNames: r.plannedNames, droppedFromPlan: r.droppedFromPlan, removed: r.removed, htmlLines: r.htmlLines })), skippedRuns: meta.skippedRuns,
        totals: meta.totals, removedNames: removedAny.size, removedScopeNames: rs.length, removedWindowNames: rw.length },
      changed: { files: all.length, productFiles: all.filter(f => productRe.test(f)), onlyIndexHtml: JSON.stringify(all.filter(f => productRe.test(f))) === '["index.html"]', indexHtml: numstat.find(x => x.file === 'index.html') || null,
        testsChanged: all.filter(f => /^tests\//.test(f)), vaultChanged: all.filter(f => vaultRe.test(f)), generatorChanged: all.filter(f => /gen-inline-hard\.js$|gen-cell-provide\.js$/.test(f) || f === REGISTRY),
        otherGeneratedMapsChanged: all.filter(f => /^docs\/architecture\/(cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md)$/.test(f)) },
      onlyDeletions, kindsOnly,
      inlineScriptLines: { before: mB.inlineScriptLines, after: mW.inlineScriptLines, decreasedBy: mB.inlineScriptLines - mW.inlineScriptLines, decreased: mW.inlineScriptLines < mB.inlineScriptLines, source: 'scripts/module-metrics.js measure().ratchet.inlineScriptLines — 기준 트리, 작업 트리' },
      ratchet: { indexFunctionDecls: [mB.indexFunctionDecls, mW.indexFunctionDecls], windowAssignments: [mB.windowAssignments, mW.windowAssignments], oversizeJsFiles: [mB.oversizeJsFiles.count, mW.oversizeJsFiles.count], crossTabRefs: [mB.crossTabRefs, mW.crossTabRefs] },
      baseline: { file: 'docs/architecture/module-baseline.json', lastInlineScriptLines: [lastOf(baselineB), lastOf(baselineJ)], recordedEqualsMeasured: lastOf(baselineJ) === mW.inlineScriptLines, historyEntries: [baselineB.history.length, baselineJ.history.length] },
      guard: { exitCode: guard.status },
      compare: Object.assign({}, cW.counts, { ok: cW.ok, namesFixedFrom: cW.namesFrom && cW.namesFrom.file, scopeLost: cW.namesFrom ? cW.namesFrom.scopeLost : null, scopeAdded: cW.namesFrom ? cW.namesFrom.scopeAdded : null, exceptions: cW.guestBoot.exceptions.length, consoleErrors: cW.guestBoot.consoleErrors.length,
        before: cB.counts, windowNamesLeftInIife: cW.namesFrom ? cW.namesFrom.windowNamesInThisIndexHtml : null, modes: cW.modes }),
      fingerprints: { names: { scope: Object.keys(cB.fingerprints.scope).length, window: Object.keys(cB.fingerprints.window).length }, differingScope: fpd('scope'), differingWindow: fpd('window'),
        removedNamesStillPresent: { scope: rs.filter(n => present('scope', n)).length + '/' + rs.length, window: rw.filter(n => present('window', n)).length + '/' + rw.length },
        removedNamesAbsent: rs.filter(n => !present('scope', n)).concat(rw.filter(n => !present('window', n))) },
      scenarios: scRows, scenariosAllPassedBoth: sc.allPassedBoth,
      moduleLoad: { regressions: cmp.regressions.length, insufficient: cmp.insufficient.map(i => i.file + ': ' + i.note), counts: cmp.counts },
      npmTest: npm ? { base: { exitCode: npm.base.exit, okLines: npm.base.ok, okDotLines: npm.base.okDot, failLines: npm.base.fail }, work: { exitCode: npm.work.exit, okLines: npm.work.ok, okDotLines: npm.work.okDot, failLines: npm.work.fail }, same: npm.same, onlyBase: npm.onlyBase.length, onlyWork: npm.onlyWork.length, retired: 0 } : null,
    }, commands };
  wj('measurement.json', out);
  const s = out.summary;
  console.log(JSON.stringify({ runs: s.unwire.runs.map(r => [r.kitVar, r.pass, r.names, r.removed.deletedLines]), totals: s.unwire.totals.removed, onlyIndexHtml: s.changed.onlyIndexHtml, product: s.changed.productFiles, tests: s.changed.testsChanged.length, vault: s.changed.vaultChanged.length, onlyDeletions: s.onlyDeletions.rebuiltEqualsWork, replayed: s.kindsOnly.allRunsReplayed, outside: s.kindsOnly.deletedOutsideListedKinds.length,
    inline: [s.inlineScriptLines.before, s.inlineScriptLines.after], baseline: s.baseline.lastInlineScriptLines, recorded: s.baseline.recordedEqualsMeasured, guard: s.guard.exitCode, compare: { mism: s.compare.mismatches, lost: s.compare.scopeLost, exc: s.compare.exceptions, own: s.compare.own }, fp: [s.fingerprints.differingScope.length, s.fingerprints.differingWindow.length], present: s.fingerprints.removedNamesStillPresent, sc: s.scenarios.map(x => [x.id, x.basePassed, x.workPassed, x.nonVacuousExpects]), ml: s.moduleLoad.regressions, npm: s.npmTest }));
  process.exit(0);
}

// ───────────────────────── claims ─────────────────────────
if (CMD === 'claims') {
  const REQ = opt('--req'), m = rj('measurement.json'), s = m.summary, proof = rj('proof.json'), specs = specsOf(proof);
  const M = REL + 'measurement.json', C = REL + 'cell-registry-compare.json';
  const st = (id, req, statement, file, p, equals, extra) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [file].concat(extra || []), check: { type: 'jsonPath', file, path: p, equals } });
  const scDir = path.join(DIR, 'scenarios'), scs = fs.readdirSync(scDir).filter(f => /\.json$/.test(f)).sort().map(f => ({ file: f, j: JSON.parse(fs.readFileSync(path.join(scDir, f), 'utf8')) }));
  const what = specs.map(u => u.kitVar + ' ' + passWord(u)).join(' · ');
  const claims = [];
  scs.forEach((x, i) => claims.push({ id: 'C' + (i + 1), req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior',
    statement: x.j.title + ' — 바뀐 index.html 은 생성기 설정(proof.json)을 기준 커밋에서 다시 돌린 결과와 바이트 단위로 같다.', touches: ['index.html'], scenario: 'scenarios/' + x.file, proof: 'proof.json' }));
  let n = scs.length;
  const add = (req, statement, file, p, equals, extra) => claims.push(st('C' + (++n), req, statement, file, p, equals, extra));
  add('R2', '대조 탐침이 게스트 부팅을 끝내고 report() 를 받아 쓰였다(ok true) — 이름 목록은 철거 전 기준 트리 결과로 고정했다.', C, 'ok', true);
  add('R2', '철거 뒤 대조에서 불일치는 0 이다.', C, 'counts.mismatches', 0);
  add('R2', '철거 뒤 통로에서 사라진 이름이 없다(지운 getter 의 이름은 등록 기관이 내준다).', C, 'namesFrom.scopeLost', []);
  add('R2', '철거 전(기준 트리)과 뒤(작업 트리)에서 통로 이름마다 잰 값 지문의 차이가 없다.', M, 'summary.fingerprints.differingScope', []);
  add('R2', '철거 전과 뒤에서 window 이름마다 잰 값 지문의 차이가 없다.', M, 'summary.fingerprints.differingWindow', []);
  add('R2', '지운 이름 가운데 철거 뒤 통로·window 에 없는 이름이 없다.', M, 'summary.fingerprints.removedNamesAbsent', []);
  add('R3', '바뀐 제품 파일은 index.html 하나뿐이다(js/** 변경 0).', M, 'summary.changed.onlyIndexHtml', true);
  add('R3', '기준 index.html 에서 실행을 차례로 되짚어(생성기가 적어 낸 줄을 지우고 쉼표를 뗌) 만든 결과가 작업 index.html 과 글자 그대로 같다(더한 줄 0 · 그 밖의 글자 변경 0).', M, 'summary.onlyDeletions.rebuiltEqualsWork', true);
  add('R3', '생성기가 지운 줄 가운데 설정이 허용한 줄 종류(가져오기 줄 · expose getter/setter 속성 줄과 빈 껍데기 · window 대입 줄과 빈 블록 껍데기) 밖의 줄이 없다.', M, 'summary.kindsOnly.deletedOutsideListedKinds', [], [REL + 'unwire-meta.json']);
  add('R3', '지운 줄의 이름 가운데 설정(proof.json) names 에 없는 이름이 없다.', M, 'summary.kindsOnly.namesOutsideProof', []);
  add('R4', '인라인 스크립트 줄 수(module-metrics inlineScriptLines)가 기준 트리보다 작다 — 전·후 값은 측정 기록에 있다.', M, 'summary.inlineScriptLines.decreased', true);
  add('R4', 'docs/architecture/module-baseline.json 의 마지막 기록 inlineScriptLines 가 작업 트리 측정값과 같다(module-guard --update 로 기록).', M, 'summary.baseline.recordedEqualsMeasured', true);
  add('R4', '모듈 로드 탐침 결과에서 기준 대비 새 회귀 목록이 비어 있다.', REL + 'module-load.json', 'regressions', []);
  add('R4', 'npm test 를 기준 트리(origin/main)와 작업 트리에서 전경으로 끝까지 돌려 종료 코드 0 이고 검사 줄·요약이 같다(폐기 0).', M, 'summary.npmTest.same', true);
  add('R4', 'tests/ 아래 바뀐 파일이 없다.', M, 'summary.changed.testsChanged', []);
  add('R4', '금고(court/** 등) 아래 바뀐 파일이 없다.', M, 'summary.changed.vaultChanged', []);
  add('R4', '생성기(gen-inline-hard.js · gen-cell-provide.js)와 등록 기관(js/core/cell-registry.js)을 바꾸지 않았다.', M, 'summary.changed.generatorChanged', []);
  const dropped = s.unwire.runs.flatMap(r => r.droppedFromPlan.map(d => r.kitVar + ' ' + r.pass + '차 ' + d.name + '(' + d.generator + ')')).concat((s.unwire.skippedRuns || []).flatMap(r => r.droppedFromPlan.map(d => r.kitVar + ' ' + r.pass + '차 ' + d.name + '(' + d.generator + ')')));
  const out = { task: TASK, requirementsSource: REQ,
    requirements: [
      { id: 'R1', text: 'index.html 인라인 IIFE 에서 배선(' + what + ')을 생성기(gen-inline-hard.js mode:"unwire")로 지우고 앱 동작을 보존한다(손 편집 0 — 법정의 생성기 재실행 결과와 바이트 동일).' },
      { id: 'R2', text: '지운 이름은 등록 기관(own)이 같은 값으로 내준다: 철거 전 이름 목록으로 대조해 불일치 0 · 통로에서 사라진 이름 0 · 이름별 값 지문 차이 0.' },
      { id: 'R3', text: '지우는 대상은 설정이 허용한 줄 종류뿐이고 names 밖 이름·함수 본문·그 밖의 글자는 바꾸지 않는다. 바뀐 제품 파일은 index.html 하나다.' },
      { id: 'R4', text: '증명 하한(설계 4절 「배선 철거」): 인라인 줄 수 감소와 기준선 기록 · 모듈 로드 새 회귀 0 · npm test 검사 수 동일·폐기 0 · tests/·금고·생성기·등록 기관 변경 0.' },
    ],
    outOfScopeReports: (dropped.length ? [{ text: '계획에 있었지만 생성기가 멈춰 이번에 지우지 않은 이름: ' + dropped.join(' · '), cannotBecause: 'out-of-scope-feature' }] : []),
    claims };
  wj('claims.json', out);
  console.log('claims', claims.length, '· 보존 주장', scs.length, '· R1~R4');
  process.exit(0);
}
