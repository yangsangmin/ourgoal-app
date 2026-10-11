#!/usr/bin/env node
'use strict';
// 구역 이전 실행기 (#TASK-ES-650 · docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5.6절) — 작업자 도구, 판정 아님. 철거·상태 이전 실행기와 같은 절차·같은 증거 꼴이다.
// 줄을 옮기는 것은 이 파일이 아니라 생성기(gen-inline-hard.js mode:"region")다 — 손 편집 0.
//
//   apply   계획기(reports/TASK-ES-643/region-plan.cjs)로 지금 index.html 의 구역을 다시 재고(붙잡힌 글자 region-pins.json 제외), 구역마다 region-names.json 의 이름·세포를 붙여
//           reports/<TASK>/proof.json 을 쓴 뒤 생성기를 작업 트리에 돌린다. 이름 규칙이 없는 구역 · 쓰이지 않은 규칙이 있으면 멈춘다. 기록은 region-meta.json.
//   measure 기준 트리(origin/main 임시 worktree)와 맞대어 잰다: 바뀐 파일 범위 · 되짚기(기준 index.html 에 생성기 기록을 적용해 다시 만든 것 == 작업 index.html) ·
//           세포 본문에서 L. 접두만 걷으면 이전 전 줄과 같은가 · 인라인 줄 수와 기준선 기록 · 시나리오 · 대조 탐침 지문 · 상태 탐침(기관 이름 전부 + 노출된 상태 이름) ·
//           사진 첨부 경로 탐침 · 모듈 로드 · npm test 로그 비교 · 시험 하나씩 · module-guard · 무결성 게이트 · 남는 줄 표 → reports/<TASK>/measurement.json
//   claims  measurement.json 에서 reports/<TASK>/claims.json 을 만든다(보존 주장 = 시나리오마다 하나 + proof.json, 기록 주장 = 측정 파일의 값).
//
// 사용(작업 트리에서, NODE_PATH=C:/dev/ourgoal-app/node_modules):
//   node reports/TASK-ES-650/region-run.cjs apply   <작업 트리> --task TASK-ES-650
//   node reports/TASK-ES-650/region-run.cjs measure <작업 트리> --task TASK-ES-650 --base <기준 트리>
//       먼저: reports/<TASK>/raw/npm-test.{base,work}.{log,exit} · tests-{base,work}.json(reports/TASK-ES-614/run-tests-each.cjs) · reports/<TASK>/scenarios/*.json
//   node reports/TASK-ES-650/region-run.cjs claims  <작업 트리> --task TASK-ES-650 --req docs/specs/REQ-….md
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const argv = process.argv.slice(2);
const CMD = argv[0], ROOT = path.resolve(argv[1] || '.');
const opt = (k, d) => (argv.indexOf(k) >= 0 ? argv[argv.indexOf(k) + 1] : d);
const TASK = opt('--task');
if (!['apply', 'measure', 'claims'].includes(CMD) || !TASK) { console.error('사용: node region-run.cjs apply|measure|claims <작업 트리> --task TASK-ES-6xx …(머리 주석 참고)'); process.exit(2); }
const REL = 'reports/' + TASK + '/', DIR = path.join(ROOT, 'reports', TASK);
const GEN = path.join(ROOT, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js');
const INDEX = path.join(ROOT, 'index.html');
const wj = (f, o) => { fs.mkdirSync(path.dirname(path.join(DIR, f)), { recursive: true }); fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' }); };
const rj = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const lf = s => s.replace(/\r\n/g, '\n');
const commands = [];
function run(id, args, cwd, env) {
  const t0 = new Date().toISOString();
  const r = cp.spawnSync(args[0], args.slice(1), { cwd: cwd || ROOT, encoding: 'utf8', env: Object.assign({}, process.env, env || {}), shell: false, maxBuffer: 256 * 1024 * 1024 });
  commands.push({ id, startedAt: t0, endedAt: new Date().toISOString(), exitCode: r.status, stdoutHead: (r.stdout || '').slice(0, 200), stderrHead: (r.stderr || '').slice(0, 200) });
  return r;
}
const git = (args, cwd) => run('git ' + args[0], ['git'].concat(args), cwd);
const L = s => s.trim().split('\n').map(x => x.trim()).filter(Boolean);

// ───────────────────────── apply ─────────────────────────
if (CMD === 'apply') {
  const NAMES = rj('region-names.json');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'region-run-')), planFile = path.join(tmp, 'plan.json');
  const pr = run('region-plan', [process.execPath, path.join(ROOT, 'reports', 'TASK-ES-643', 'region-plan.cjs'), ROOT, planFile, '--pins', path.join(DIR, 'region-pins.json')]);
  if (pr.status !== 0 || !fs.existsSync(planFile)) { console.error('계획기 실패:', (pr.stderr || '').slice(0, 400)); process.exit(1); }
  const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
  if (!plan.generator || !plan.generator.ok) { console.error('계획의 가칭 설정이 생성기에서 멈췄다:', plan.generator && plan.generator.error); process.exit(1); }
  const before = fs.readFileSync(INDEX, 'utf8'), bl = lf(before).split('\n');
  // 구역마다 이름·세포: 구역의 첫 문 줄이 규칙의 first 로 시작해야 한다(꼭 하나)
  const used = new Set(), unmatched = [], byCell = {};
  const regions = plan.regions.map(r => {
    const first = bl[r.firstLine - 1].trim(), hits = NAMES.regions.filter(x => first.startsWith(x.first));
    if (hits.length !== 1) { unmatched.push({ firstLine: r.firstLine, first: first.slice(0, 80), rules: hits.length }); return null; }
    used.add(hits[0]);
    const spec = { name: hits[0].name, group: r.group }; for (const k of ['groupTo', 'from', 'to', 'headerPick']) if (r[k]) spec[k] = r[k];
    (byCell[hits[0].cell] = byCell[hits[0].cell] || []).push(spec);
    return { name: hits[0].name, cell: hits[0].cell, plannedLines: [r.firstLine, r.lastLine], statements: r.statements, kinds: r.kinds };
  });
  const unusedRules = NAMES.regions.filter(x => !used.has(x)).map(x => x.name);
  if (unmatched.length || unusedRules.length) { console.error('이름 규칙이 구역과 맞지 않는다 — 멈춘다:', JSON.stringify({ unmatched, unusedRules })); process.exit(1); }
  const cells = NAMES.cells.filter(c => byCell[c.key]).map(c => Object.assign({}, c, { regions: byCell[c.key] }));
  if (cells.length !== NAMES.cells.length) { console.error('구역이 하나도 없는 세포가 있다:', NAMES.cells.filter(c => !byCell[c.key]).map(c => c.key)); process.exit(1); }
  const proof = { task: TASK, label: NAMES.label, slot: NAMES.slot, mode: 'region', cells };
  wj('proof.json', proof);
  const r = run('gen-inline-hard(region)', [process.execPath, GEN, ROOT, path.join(DIR, 'proof.json')], ROOT, { MODULE_SPLIT_OUT: tmp });
  if (r.status !== 0) { console.error('생성기 실패:', ((r.stderr || '').split('\n').find(l => /Error/.test(l)) || '').slice(0, 400)); process.exit(1); }
  const m = JSON.parse(fs.readFileSync(path.join(tmp, 'gen-inline-hard-meta.json'), 'utf8')), after = fs.readFileSync(INDEX, 'utf8');
  wj('region-meta.json', { tool: REL + 'region-run.cjs apply', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), generator: 'docs/design/harness/module-split/gen-inline-hard.js mode:"region"(이 PR 에서 변경 0)', proof: REL + 'proof.json',
    planner: { tool: 'reports/TASK-ES-643/region-plan.cjs', pins: plan.pins, totals: plan.totals, notRegionable: plan.notRegionable, notRegionableStatements: plan.notRegionableStatements },
    counts: { regions: m.regions.length, cells: Object.keys(m.files).length, statements: m.regions.reduce((a, x) => a + x.statements.length, 0), linesMoved: m.regions.reduce((a, x) => a + x.lines, 0), locals: m.regions.reduce((a, x) => a + x.locals.length, 0), edits: m.edits, bridged: m.bridged.length, gettersAdded: m.exposed.length, settersAdded: m.bridged.filter(b => m.exposed.includes(b.n) && b.assigned).length, headLines: m.head.lines, kitVarsAdded: m.kitVarsAdded.length },
    htmlLines: [lf(before).split('\n').length, lf(after).split('\n').length], generatorStdout: (r.stdout || '').trim().split('\n'), regionsNamed: regions, meta: m, commands });
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ }
  console.log(JSON.stringify({ regions: m.regions.length, cells: m.files, statements: m.regions.reduce((a, x) => a + x.statements.length, 0), linesMoved: m.regions.reduce((a, x) => a + x.lines, 0), locals: m.regions.reduce((a, x) => a + x.locals.length, 0), gettersAdded: m.exposed.length, headLines: m.head.lines, htmlLines: [lf(before).split('\n').length, lf(after).split('\n').length] }));
  process.exit(0);
}

// ───────────────────────── measure ─────────────────────────
if (CMD === 'measure') {
  const BASE = path.resolve(opt('--base'));
  const M = rj('region-meta.json'), meta = M.meta, proof = rj('proof.json');
  const baseHead = git(['rev-parse', 'HEAD'], BASE).stdout.trim(), workHead = git(['rev-parse', 'HEAD']).stdout.trim();
  const numstat = L(git(['diff', '--numstat', baseHead, '--']).stdout).map(l => { const [a, d, f] = l.split('\t'); return { file: f, insertions: Number(a), deletions: Number(d) }; });
  const all = numstat.map(x => x.file).concat(L(git(['ls-files', '--others', '--exclude-standard']).stdout)).filter((f, i, a) => a.indexOf(f) === i && !f.startsWith('.claude/'));
  const productRe = /^(js\/.*|index\.html|ui\.js|sw\.js|.*\.css)$/, cellFiles = proof.cells.map(c => c.file);
  const vaultRe = /^(court\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|\.agent\/rules\/|docs\/rules\/(OURGOAL_ABSOLUTE_INTEGRITY_RULES\.md|CONSTITUTION_VERSIONS\.md|ESSENCE_OURGOAL\.md|rules\.json|rules-control\.json|branch-protection.*\.json|archive\/)|\.github\/|\.githooks\/|scripts\/essence-gate\.js$|scripts\/install-essence-gate\.js$|scripts\/verify-integrity-gate\.js$|scripts\/hook-smoke-on-index\.js$|\.vercelignore$|package\.json$|vercel\.json$|\.gitattributes$|\.claude\/settings\.json$|docs\/directives\/)/;
  const product = all.filter(f => productRe.test(f)).sort();
  // 되짚기: 기준 index.html 에서 생성기 기록대로 다시 만든다 — 구역 줄 → 부르는 한 줄 · 머리 이음매 자리에 가져오기·통로 줄 · script 태그. 그 결과가 작업 index.html 과 글자 그대로 같아야 한다.
  const bl = lf(fs.readFileSync(path.join(BASE, 'index.html'), 'utf8')).split('\n'), wl = lf(fs.readFileSync(INDEX, 'utf8')).split('\n');
  const T = proof.task, rebuilt = bl.slice(), cellOf = Object.fromEntries(proof.cells.map(c => [c.key, c]));
  for (const x of meta.regions.slice().sort((a, b) => b.segment[0] - a.segment[0]))
    rebuilt.splice(x.segment[0] - 1, x.segment[1] - x.segment[0] + 1, '  ' + x.name + '(); /* [#' + T + '] 로드 중 구역(주석·빈 줄 포함 ' + x.lines + '줄) → ' + x.file + ' 의 ' + x.name + ' 로 옮김 — 원래 자리에서 부른다 */');
  const head = ['  /* [#' + T + '] ' + proof.cells.map(c => c.file).join(' · ') + ' — 구역 함수 가져오기 ' + meta.regions.length + '개 · 통로 노출은 스코프 분석으로 뽑았다 */'];
  for (const c of proof.cells) { for (const k of meta.kitVarsAdded.filter(k => k.kitVar === c.kitVar && k.kit === c.kit && !head.includes('  var ' + k.kitVar + ' = window.' + k.kit + ';'))) head.push('  var ' + k.kitVar + ' = window.' + k.kit + ';'); for (const x of meta.regions.filter(y => y.cell === c.key)) head.push('  var ' + x.name + ' = ' + c.kitVar + '.' + x.name + ';'); }
  if (meta.exposed.length) { head.push("  window.OurgoalAppScope.expose('index.html', {"); meta.exposed.forEach((n, i) => { const b = meta.bridged.find(z => z.n === n); head.push('    get ' + n + '(){ return ' + n + '; }' + (b && b.assigned ? ', set ' + n + '(v){ ' + n + ' = v; }' : '') + (i === meta.exposed.length - 1 ? '' : ',')); }); head.push('  });'); }
  rebuilt.splice(meta.head.insertAfterLine, 0, ...head);
  for (const c of proof.cells) { const tag = '<script src="' + c.file + '"></script>', a = c.afterTag || c.beforeTag, i = rebuilt.findIndex(l => l.includes(a)); if (i >= 0) rebuilt[i] = c.afterTag ? rebuilt[i].replace(a, a + tag) : rebuilt[i].replace(a, tag + a); }
  let firstDiff = null; for (let i = 0; i < Math.max(rebuilt.length, wl.length); i++) if (rebuilt[i] !== wl[i]) { firstDiff = { line: i + 1, rebuilt: (rebuilt[i] || '').slice(0, 160), work: (wl[i] || '').slice(0, 160) }; break; }
  const replay = { rebuiltEqualsWork: !firstDiff && rebuilt.length === wl.length, baseLines: bl.length, workLines: wl.length, regionLinesReplaced: meta.regions.reduce((a, x) => a + x.lines, 0), callLines: meta.regions.length, headLines: head.length, headLinesEqualMeta: head.length === meta.head.lines, tagLines: [...new Set(meta.tags.map(t => t.line))].length, firstDiff,
    note: '기준 index.html 에서 구역 줄을 부르는 한 줄로 바꾸고, 머리 이음매 자리에 가져오기·통로 줄을 끼우고, script 태그를 같은 줄에 붙여 다시 만든 결과 == 작업 index.html (줄바꿈만 LF 로 맞춤). 참이면 그 밖의 글자 변경 0' };
  // 세포 본문: 구역 함수 본문의 줄에서 L. 접두만 걷어 내면 이전 전 구역의 줄과 같다(= 문 순서가 이전 전 줄 순서와 같다) · 틀
  const strip = l => l.replace(/(^|[^\w$.])L\.(?=[A-Za-z_$])/g, '$1'), stripShort = l => l.replace(/([A-Za-z_$][\w$]*): L\.\1(?![\w$])/g, '$1');
  let bodyDiff = 0, prefixLines = 0, firstBodyDiff = null; const cellRows = [];
  for (const c of proof.cells) {
    const cl = lf(fs.readFileSync(path.join(ROOT, c.file), 'utf8')).split('\n'), base = fs.existsSync(path.join(BASE, c.file));
    let parses = true; try { require('@babel/parser').parse(cl.join('\n'), { sourceType: 'script' }); } catch (e) { parses = false; }
    for (const x of meta.regions.filter(y => y.cell === c.key)) {
      const i0 = cl.findIndex(l => l.startsWith('  function ' + x.name + '() { /* [#' + T + '] 로드 중 구역')), body = cl.slice(i0 + 1, i0 + 1 + x.lines), orig = bl.slice(x.segment[0] - 1, x.segment[1]);
      if (i0 < 0 || cl[i0 + 1 + x.lines] !== '  } /* ' + x.name + ' */' || cl[i0 - 1] !== '  /* ---- 이전 전 index.html ' + x.segment[0] + '~' + x.segment[1] + '줄(#' + T + ' 생성기 표지) ---- */') { bodyDiff++; if (!firstBodyDiff) firstBodyDiff = { file: c.file, region: x.name, why: '함수 틀이 예상과 다르다' }; continue; }
      body.forEach((l, k) => { if (l === orig[k]) return; prefixLines++; if (strip(l) !== orig[k] && strip(stripShort(l)) !== orig[k]) { bodyDiff++; if (!firstBodyDiff) firstBodyDiff = { file: c.file, region: x.name, got: l.slice(0, 140), want: orig[k].slice(0, 140) }; } });
    }
    cellRows.push({ file: c.file, lines: cl.length - 1, under800: cl.length - 1 <= 800, parses, existedInBase: base, kitLine: cl.includes('  var K = global.' + c.kit + ' = global.' + c.kit + ' || {};'), exports: meta.regions.filter(y => y.cell === c.key).every(x => cl.includes('  K.' + x.name + ' = ' + x.name + ';')), registersWithRegistry: /OurgoalCellRegistry/.test(cl.join('\n')) });
  }
  const holdRe = /OurgoalTemplateCredit\.init|OURGOAL_CONFIG/, holdBase = bl.filter(l => holdRe.test(l)), holdWork = wl.filter(l => holdRe.test(l));
  const cellsAudit = { bodyDiff, linesWithPrefix: prefixLines, firstBodyDiff, cells: cellRows, allUnder800: cellRows.every(r => r.under800), allParse: cellRows.every(r => r.parses), noneExistedInBase: cellRows.every(r => !r.existedInBase), noRegistryBlock: cellRows.every(r => !r.registersWithRegistry),
    statementsAscending: meta.regions.every(x => x.statements.every((s, k) => !k || s.line >= x.statements[k - 1].endLine)), holdLines: [holdBase.length, holdWork.length], holdSame: JSON.stringify(holdBase) === JSON.stringify(holdWork), cellsTouchHold: proof.cells.some(c => /OurgoalTemplateCredit|OURGOAL_CONFIG/.test(fs.readFileSync(path.join(ROOT, c.file), 'utf8'))),
    pinsLeftInIndex: (M.planner.pins || []).map(p => ({ text: p.text, base: bl.filter(l => l.includes(p.text)).length, work: wl.filter(l => l.includes(p.text)).length })) };
  cellsAudit.pinsKept = cellsAudit.pinsLeftInIndex.every(p => p.base === p.work && p.work > 0);
  // 지표 · 가드 · 게이트
  const mm = f => require(path.join(f, 'scripts', 'module-metrics.js')).measure(f).ratchet, mW = mm(ROOT), mB = mm(BASE);
  const guard = run('module-guard', [process.execPath, 'scripts/module-guard.js', '--quiet']);
  const gate = run('verify-integrity-gate', [process.execPath, 'scripts/verify-integrity-gate.js']);
  const baselineJ = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'architecture', 'module-baseline.json'), 'utf8')), baselineB = JSON.parse(fs.readFileSync(path.join(BASE, 'docs', 'architecture', 'module-baseline.json'), 'utf8'));
  const lastOf = j => j.history[j.history.length - 1].metrics.inlineScriptLines;
  // 시나리오
  const scDir = path.join(DIR, 'scenarios'), scFiles = fs.readdirSync(scDir).filter(f => /\.json$/.test(f)).sort();
  run('scenario-local', [process.execPath, path.join(ROOT, 'docs', 'design', 'harness', 'module-split', 'scenario-local-z56.js'), BASE, ROOT, path.join(DIR, 'scenario-local.json')].concat(scFiles.map(f => path.join(scDir, f))));
  const sc = rj('scenario-local.json');
  const scRows = Object.keys(sc.scenarios).map(id => ({ id, basePassed: sc.scenarios[id].runs.base.passed, workPassed: sc.scenarios[id].runs.work.passed, baseExceptions: (sc.scenarios[id].runs.base.exceptions || []).length, workExceptions: (sc.scenarios[id].runs.work.exceptions || []).length, nonVacuousExpects: sc.scenarios[id].runs.work.nonVacuousExpects }));
  // 대조 탐침(이름 목록은 기준 트리 결과로 고정) — 기준을 두 번 재어 본질 변동을 거른다
  const cmp = path.join(ROOT, 'scripts', 'probes', 'cell-registry-compare.js');
  run('registry probe base', [process.execPath, cmp, BASE, path.join(DIR, 'cell-registry-compare.before.json'), '--fingerprints']);
  run('registry probe base2', [process.execPath, cmp, BASE, path.join(DIR, 'cell-registry-compare.before2.json'), '--fingerprints']);
  run('registry probe work', [process.execPath, cmp, ROOT, path.join(DIR, 'cell-registry-compare.json'), '--fingerprints', '--names-from', path.join(DIR, 'cell-registry-compare.before.json')]);
  const cB = rj('cell-registry-compare.before.json'), cB2 = rj('cell-registry-compare.before2.json'), cW = rj('cell-registry-compare.json');
  const fpd = (x, y, k) => Object.keys(x.fingerprints[k]).filter(n => x.fingerprints[k][n] !== (y.fingerprints[k] || {})[n]);
  const intrinsicFp = { scope: fpd(cB, cB2, 'scope'), window: fpd(cB, cB2, 'window') };
  const fpDiff = { scope: fpd(cB, cW, 'scope').filter(n => !intrinsicFp.scope.includes(n)), window: fpd(cB, cW, 'window').filter(n => !intrinsicFp.window.includes(n)) };
  // 상태 탐침: 기관이 맡은 이름 전부(기준 index.html 의 define 줄) + 통로에 노출된 상태 var 이름(expose 문의 속성 가운데 IIFE 의 var 로 선언된 것)
  const organNamesBase = [...new Set(bl.map(l => (/^\s*window\.OurgoalAppState\.define(?:Var)?\('([A-Za-z_$][\w$]*)',/.exec(l) || [])[1]).filter(Boolean))];
  const exposedVars = [...new Set(bl.map(l => (/^\s*get ([A-Za-z_$][\w$]*)\(\)\{ return \1; \}/.exec(l) || [])[1]).filter(Boolean))].filter(n => bl.some(l => new RegExp('^  var ' + n.replace(/\$/g, '\\$') + '\\b').test(l) && !new RegExp('^  var ' + n.replace(/\$/g, '\\$') + ' = _\\w+\\.').test(l)));
  wj('probe-names.json', { note: '기준 트리 index.html 에서 뽑은 고정 입력 — 상태 기관이 맡은 이름 전부(define 줄) + 통로에 노출된 IIFE var 이름(가져오기 제외)', names: [...new Set(organNamesBase.concat(exposedVars))], organ: organNamesBase.length, exposedVars: exposedVars.length });
  const probe = path.join(ROOT, 'reports', 'TASK-ES-636', 'state-probe.cjs');
  for (const [tree, out] of [[BASE, 'state-probe.base.json'], [BASE, 'state-probe.base2.json'], [ROOT, 'state-probe.work.json']]) run('state-probe ' + out, [process.execPath, probe, tree, path.join(DIR, out), '--names', path.join(DIR, 'probe-names.json')]);
  const pB = rj('state-probe.base.json'), pB2 = rj('state-probe.base2.json'), pW = rj('state-probe.work.json');
  const FIELDS = ['accessor', 'owner', 'organKind', 'value', 'onWindow', 'windowValue', 'windowSame', 'writeRoundtrip', 'restored', 'error'];
  const pdiff = (x, y) => Object.keys(x.names || {}).filter(n => FIELDS.some(f => JSON.stringify(x.names[n][f]) !== JSON.stringify(((y.names || {})[n] || {})[f])));
  const intrinsicState = pdiff(pB, pB2), stateDiff = pdiff(pB, pW).filter(n => !intrinsicState.includes(n));
  const writable = p => { const v = Object.values(p.names || {}).filter(x => x.accessor === 'get+set'); return { names: v.length, roundtripOk: v.filter(x => x.writeRoundtrip === true && x.restored === true).length }; };
  // 사진 첨부 경로 탐침(#TASK-ES-649 의 도구) — 구역이 그 이름들의 define 줄과 연결 호출을 옮긴다
  const photo = path.join(ROOT, 'reports', 'TASK-ES-649', 'photo-probe.cjs');
  run('photo-probe base', [process.execPath, photo, BASE, path.join(DIR, 'photo-probe.base.json')]);
  run('photo-probe work', [process.execPath, photo, ROOT, path.join(DIR, 'photo-probe.work.json')]);
  const phB = rj('photo-probe.base.json'), phW = rj('photo-probe.work.json');
  const allTrue = o => Object.values(o || {}).every(v => (v && typeof v === 'object') ? allTrue(v) : (v === true || typeof v !== 'boolean'));
  // 모듈 로드
  const ml = require(path.join(ROOT, 'court', 'probes', 'module-load.js'));
  const mlCmp = ml.compare(ml.probeModules(BASE), ml.probeModules(ROOT), fs.readFileSync(INDEX, 'utf8'));
  wj('module-load.json', { tool: 'court/probes/module-load.js (읽기 전용 — compare(probeModules(기준), probeModules(작업)))', type: '작업자 측정, 판정 아님', base: baseHead, measuredAt: new Date().toISOString(), regressions: mlCmp.regressions, insufficient: mlCmp.insufficient, counts: mlCmp.counts });
  // npm test 로그 비교
  function readLog(label) {
    const txt = lf(fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.log'), 'utf8')), TT = txt.split('\n');
    const exitTxt = fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), 'utf8').trim();
    const norm = s => s.trim().replace(/\d+(\.\d+)?\s?ms\b/g, 'Nms').replace(/[A-Za-z]:[\\/][^\s"')]+/g, '<path>');
    const ok = TT.filter(l => /^\s*✓ /.test(l)).map(norm), okDot = TT.filter(l => /^\s*ok · /.test(l)).map(norm), fail = TT.filter(l => /^\s*(✗|✖|not ok|FAIL\b)/.test(l)).map(norm);
    return { file: REL + 'raw/npm-test.' + label + '.log', ok: ok.length, okDot: okDot.length, fail: fail.length, exit: Number((/exit=(\d+)/.exec(exitTxt) || [])[1]), summaryTokens: TT.filter(l => /(\d+개 통과|검증 결과|ALL PASS|COMPLETE|\[검증 \d+\/\d+\])/.test(l)).map(norm), _checks: ok.concat(okDot) };
  }
  const nb = readLog('base'), nw = readLog('work');
  const multiset = a => { const m = {}; a.forEach(x => { m[x] = (m[x] || 0) + 1; }); return m; }, mb = multiset(nb._checks), mw = multiset(nw._checks);
  const onlyBase = Object.keys(mb).filter(k => (mw[k] || 0) < mb[k]), onlyWork = Object.keys(mw).filter(k => (mb[k] || 0) < mw[k]);
  delete nb._checks; delete nw._checks;
  const npmCmp = { base: nb, work: nw, sameSummaryTokens: JSON.stringify(nb.summaryTokens) === JSON.stringify(nw.summaryTokens), sameOkCount: nb.ok === nw.ok && nb.okDot === nw.okDot, onlyBase, onlyWork };
  npmCmp.same = npmCmp.sameSummaryTokens && npmCmp.sameOkCount && nb.exit === 0 && nw.exit === 0 && !onlyBase.length && !onlyWork.length && nb.fail === 0 && nw.fail === 0;
  wj('npm-test-compare.json', npmCmp);
  const tB = rj('tests-base.json'), tW = rj('tests-work.json');
  const fset = t => new Set(t.testFiles.filter(x => x.exit !== 0).map(x => x.file)), fB = fset(tB), fW = fset(tW), tail = (t, f) => (t.testFiles.find(x => x.file === f) || {}).tail || null;
  const scripts = tW.scripts.map(s => { const b = tB.scripts.find(x => x.script === s.script) || {}; return { script: s.script, exit: [b.exit, s.exit], ok: [b.ok, s.ok], okDot: [b.okDot, s.okDot], fails: [(b.fails || []).length, s.fails.length], same: b.exit === s.exit && b.ok === s.ok && b.okDot === s.okDot && s.fails.length === (b.fails || []).length }; });
  const testsEach = { scripts, scriptsSame: scripts.every(x => x.same), testFiles: tW.testFiles.length, failedBase: fB.size, failedWork: fW.size, onlyWork: [...fW].filter(x => !fB.has(x)), onlyBase: [...fB].filter(x => !fW.has(x)), sameFailTails: [...fW].filter(x => fB.has(x)).every(x => tail(tW, x) === tail(tB, x)) };
  testsEach.sameAsBase = testsEach.scriptsSame && !testsEach.onlyWork.length && !testsEach.onlyBase.length && testsEach.sameFailTails;
  // 남는 줄 표(= 다음 단계의 입력)
  const { inventory } = require(path.join(ROOT, 'reports', 'TASK-ES-643', 'region-inventory.cjs'));
  const table = v => { const t = {}; v.stmts.forEach(x => { const k = t[x.kind] = t[x.kind] || { statements: 0, lines: 0 }; k.statements++; k.lines += x.lines; }); return t; };
  const iB = inventory(path.join(BASE, 'index.html')), iW = inventory(INDEX), tb = table(iB), tw = table(iW);
  const remaining = { rows: [...new Set(Object.keys(tb).concat(Object.keys(tw)))].sort().map(k => ({ kind: k, before: tb[k] || { statements: 0, lines: 0 }, after: tw[k] || { statements: 0, lines: 0 } })).concat([{ kind: '(주석 줄)', before: { lines: iB.comment }, after: { lines: iW.comment } }, { kind: '(빈 줄)', before: { lines: iB.blank }, after: { lines: iW.blank } }]),
    leftLoadStatements: iW.stmts.filter(x => !['functionDecl', 'kitImport', 'kitHandle', 'exposeCall', 'regionCall'].includes(x.kind)).map(x => ({ line: x.line, lines: x.lines, kind: x.kind, text: x.text.slice(0, 90) })) };

  const out = { schema: 'ourgoal.region-run.measurement/1', taskId: TASK, type: '작업자 측정, 판정 아님 — 판정은 GitHub 법정(node court/chat.js <PR>)만 낸다', measuredAt: new Date().toISOString(),
    environment: { node: process.version, platform: process.platform, arch: process.arch },
    sourceCommit: { baseTreeHead: baseHead, worktreeHead: workHead, note: '기준 = origin/main 임시 git worktree(저장소 밖). 작업 = 이 트리(커밋 전 작업 상태 포함)' },
    summary: {
      changed: { files: all.length, productFiles: product, productIsIndexPlusNewCells: JSON.stringify(product) === JSON.stringify(['index.html'].concat(cellFiles).sort()), indexHtml: numstat.find(x => x.file === 'index.html') || null,
        testsChanged: all.filter(f => /^tests\//.test(f)), vaultChanged: all.filter(f => vaultRe.test(f)), generatorChanged: all.filter(f => /^docs\/design\/harness\/module-split\//.test(f)), scriptsChanged: all.filter(f => /^scripts\//.test(f)), otherJsChanged: product.filter(f => f !== 'index.html' && !cellFiles.includes(f)) },
      moved: M.counts, htmlLines: M.htmlLines, pins: (M.planner.pins || []).length,
      replay, cells: cellsAudit,
      inlineScriptLines: { before: mB.inlineScriptLines, after: mW.inlineScriptLines, decreased: mW.inlineScriptLines < mB.inlineScriptLines, delta: mW.inlineScriptLines - mB.inlineScriptLines, source: 'scripts/module-metrics.js measure().ratchet' },
      ratchet: { indexFunctionDecls: [mB.indexFunctionDecls, mW.indexFunctionDecls], windowAssignments: [mB.windowAssignments, mW.windowAssignments], oversizeJsFiles: [mB.oversizeJsFiles.count, mW.oversizeJsFiles.count], crossTabRefs: [mB.crossTabRefs, mW.crossTabRefs] },
      baseline: { recordedBefore: lastOf(baselineB), recorded: lastOf(baselineJ), recordedEqualsMeasured: lastOf(baselineJ) === mW.inlineScriptLines, historyGrewBy: baselineJ.history.length - baselineB.history.length },
      guard: { exitCode: guard.status, integrityGateExitCode: gate.status, integrityGateResult: ((gate.stdout || '').split('\n').find(l => /검증 결과/.test(l)) || '').trim() },
      scenarios: { rows: scRows, count: scRows.length, allPassedBoth: scRows.length > 0 && scRows.every(r => r.basePassed && r.workPassed && !r.workExceptions) },
      registryCompare: { ok: cW.ok, counts: cW.counts, scopeLost: cW.namesFrom ? cW.namesFrom.scopeLost : null, scopeAdded: cW.namesFrom ? (cW.namesFrom.scopeAdded || []).length : null, intrinsicVariance: intrinsicFp, differingScope: fpDiff.scope, differingWindow: fpDiff.window, exceptions: cW.guestBoot.exceptions.length, consoleErrors: cW.guestBoot.consoleErrors.length },
      stateProbe: { names: Object.keys(pB.names || {}).length, organNames: { base: (pB.organNames || []).length, work: (pW.organNames || []).length, same: JSON.stringify((pB.organNames || []).slice().sort()) === JSON.stringify((pW.organNames || []).slice().sort()) }, bootOk: { base: pB.guestBoot.ok, work: pW.guestBoot.ok }, exceptions: { base: pB.guestBoot.exceptions.length, work: pW.guestBoot.exceptions.length }, intrinsicVariance: intrinsicState, differing: stateDiff, writable: { base: writable(pB), work: writable(pW) }, captureSame: JSON.stringify(pB.checks) === JSON.stringify(pW.checks) },
      photoPath: { behaviorSame: JSON.stringify(phB.behavior) === JSON.stringify(phW.behavior), namesSame: JSON.stringify(phB.names) === JSON.stringify(phW.names), workAllTrue: !!phW.behavior && allTrue(phW.behavior), exceptions: { base: phB.guestBoot.exceptions.length, work: phW.guestBoot.exceptions.length } },
      moduleLoad: { regressions: mlCmp.regressions.length, insufficient: mlCmp.insufficient.length },
      npmTest: { base: { exitCode: nb.exit, okLines: nb.ok, okDotLines: nb.okDot, failLines: nb.fail }, work: { exitCode: nw.exit, okLines: nw.ok, okDotLines: nw.okDot, failLines: nw.fail }, same: npmCmp.same, onlyBase: onlyBase.length, onlyWork: onlyWork.length, retired: 0 },
      testsEach, remaining
    },
    limits: ['법정 판정이 아니다.', '화면 시나리오는 게스트로 닿는 범위다. 로그인 뒤 화면과 숨겨진 진입로(템플릿 백과 · 앱 평가 창 · 레벨업 창 등 구역이 연결하는 단추의 일부)는 측정불가다.', '사진 첨부 경로는 화면 시나리오가 아니라 페이지 안 평가로 쟀다.', '호출 순서의 동적 대조 탐침은 없다(미검증) — 순서는 「세포 본문에서 L. 접두만 걷으면 이전 전 줄과 같다」와 법정의 생성기 재실행 바이트 대조로 쟀다.'],
    commands };
  wj('measurement.json', out);
  const s = out.summary;
  console.log(JSON.stringify({ product: s.changed.productFiles, productOk: s.changed.productIsIndexPlusNewCells, index: s.changed.indexHtml, tests: s.changed.testsChanged.length, vault: s.changed.vaultChanged.length, gen: s.changed.generatorChanged.length, moved: s.moved, html: s.htmlLines, replay: [s.replay.rebuiltEqualsWork, s.replay.firstDiff, s.replay.headLinesEqualMeta], cells: { bodyDiff: s.cells.bodyDiff, first: s.cells.firstBodyDiff, rows: s.cells.cells.map(c => [c.file, c.lines, c.parses, c.kitLine, c.exports]), hold: s.cells.holdSame, pins: s.cells.pinsLeftInIndex, noReg: s.cells.noRegistryBlock }, inline: s.inlineScriptLines, ratchet: s.ratchet, baseline: s.baseline, guard: s.guard,
    sc: s.scenarios.rows.map(r => [r.id, r.basePassed, r.workPassed, r.nonVacuousExpects, r.workExceptions]), registry: { ok: s.registryCompare.ok, mism: s.registryCompare.counts && s.registryCompare.counts.mismatches, lost: s.registryCompare.scopeLost, added: s.registryCompare.scopeAdded, intrinsic: s.registryCompare.intrinsicVariance, dScope: s.registryCompare.differingScope, dWin: s.registryCompare.differingWindow, exc: s.registryCompare.exceptions },
    state: { names: s.stateProbe.names, organ: s.stateProbe.organNames, differing: s.stateProbe.differing, intrinsic: s.stateProbe.intrinsicVariance, writable: s.stateProbe.writable, exc: s.stateProbe.exceptions }, photo: s.photoPath, ml: s.moduleLoad, npm: s.npmTest, each: [s.testsEach.sameAsBase, s.testsEach.onlyWork, s.testsEach.failedBase, s.testsEach.failedWork] }));
  process.exit(0);
}

// ───────────────────────── claims ─────────────────────────
if (CMD === 'claims') {
  const REQ = opt('--req'), m = rj('measurement.json').summary;
  const MF = REL + 'measurement.json', scDir = path.join(DIR, 'scenarios');
  const claims = []; let n = 0;
  const add = c => { c.id = 'C' + (++n); claims.push(c); };
  const jp = (req, statement, file, p, equals, more) => add({ req, kind: 'static', domain: 'config', statement, touches: [file].concat(more || []), check: { type: 'jsonPath', file, path: p, equals } });
  const proof = rj('proof.json'), touched = ['index.html'].concat(proof.cells.map(c => c.file));
  for (const f of fs.readdirSync(scDir).filter(x => /\.json$/.test(x)).sort()) { const sc = JSON.parse(fs.readFileSync(path.join(scDir, f), 'utf8')); add({ req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior', statement: sc.title + ' — 구역 이전 전과 같다. index.html 과 새 세포 파일은 생성기 설정(proof.json)을 기준 커밋에서 다시 돌린 결과와 바이트 단위로 같다.', touches: touched, scenario: 'scenarios/' + f, proof: 'proof.json' }); }
  jp('R2', '되짚기: 기준 index.html 에서 구역 줄을 부르는 한 줄로 바꾸고 머리 이음매 자리에 가져오기·통로 줄을 끼우고 script 태그를 붙여 다시 만든 결과가 작업 index.html 과 글자 그대로 같다.', MF, 'summary.replay.rebuiltEqualsWork', true, [REL + 'region-meta.json']);
  jp('R2', '구역 함수 본문의 줄에서 L. 접두만 걷어 내면 이전 전 구역의 줄과 같다(다른 줄 0 — 문 순서가 이전 전 줄 순서와 같다).', MF, 'summary.cells.bodyDiff', 0);
  jp('R2', '구역 안 문의 줄 번호가 구역마다 오름차순이다.', MF, 'summary.cells.statementsAscending', true);
  jp('R2', '바뀐 제품 파일은 index.html 과 새 세포 파일뿐이다.', MF, 'summary.changed.productIsIndexPlusNewCells', true);
  jp('R2', '돈 근처·결심 대기 줄(OurgoalTemplateCredit.init · OURGOAL_CONFIG)은 index.html 에 글자 그대로 남아 있다.', MF, 'summary.cells.holdSame', true);
  jp('R2', '새 세포 파일에 돈 근처·결심 대기 이름이 없다.', MF, 'summary.cells.cellsTouchHold', false);
  jp('R2', '시험·가드가 붙잡는 글자와 다른 작업이 옮길 노출 줄(region-pins.json)이 index.html 에 그대로 있다.', MF, 'summary.cells.pinsKept', true, [REL + 'region-pins.json']);
  jp('R3', '새 세포 파일이 전부 800줄 이하다.', MF, 'summary.cells.allUnder800', true);
  jp('R3', '새 세포 파일이 전부 파싱된다.', MF, 'summary.cells.allParse', true);
  jp('R3', '새 세포 파일은 기준 커밋에 없던 파일이다(덮어쓰기 0).', MF, 'summary.cells.noneExistedInBase', true);
  jp('R3', '새 세포 파일에 등록 블록(OurgoalCellRegistry)이 없다 — 구역 함수는 IIFE 머리 가져오기 + 호출 한 줄로 불린다.', MF, 'summary.cells.noRegistryBlock', true);
  jp('R3', '탭 간 직접 참조 수가 기준과 같다.', MF, 'summary.ratchet.crossTabRefs', m.ratchet.crossTabRefs);
  jp('R4', '등록 기관 대조 탐침(기준 트리 이름 목록 고정): 통로에서 사라진 이름이 없다.', MF, 'summary.registryCompare.scopeLost', []);
  jp('R4', '등록 기관 대조 탐침: 불일치가 0 이다.', MF, 'summary.registryCompare.counts.mismatches', 0);
  jp('R4', '이름별 통로 값 지문 차이가 없다(기준을 두 번 재어 달라지는 이름 제외).', MF, 'summary.registryCompare.differingScope', []);
  jp('R4', '이름별 window 값 지문 차이가 없다(기준을 두 번 재어 달라지는 이름 제외).', MF, 'summary.registryCompare.differingWindow', []);
  jp('R4', '게스트 부팅 뒤 작업 트리의 예외가 0 건이다.', MF, 'summary.registryCompare.exceptions', 0);
  jp('R4', '상태 탐침(상태 기관이 맡은 이름 전부 + 통로에 노출된 상태 var): 값 요약 · 접근자 종류 · 주인 · 기관 종류 · window 복사 · 쓰기 왕복이 기준과 다른 이름이 없다(기준끼리 달라지는 이름 제외).', MF, 'summary.stateProbe.differing', [], [REL + 'state-probe.work.json']);
  jp('R4', '상태 기관이 맡은 이름 목록이 기준과 같다(구역으로 간 define 줄이 같은 이름을 같은 순서의 자리에서 정의한다).', MF, 'summary.stateProbe.organNames.same', true);
  jp('R4', '쓰기 가능한 이름의 쓰기 왕복이 작업 트리에서 전부 된다(기준과 같은 수).', MF, 'summary.stateProbe.writable.work.roundtripOk', m.stateProbe.writable.base.roundtripOk);
  jp('R4', '사진 첨부 경로(고르기 → 지우기 → 다시 고르고 기록)를 페이지 안에서 돌린 기록이 기준과 같다.', MF, 'summary.photoPath.behaviorSame', true, [REL + 'photo-probe.work.json']);
  jp('R4', '작업 트리에서 그 경로의 확인 칸이 전부 참이다.', MF, 'summary.photoPath.workAllTrue', true);
  jp('R5', '인라인 스크립트 줄 수가 줄었다.', MF, 'summary.inlineScriptLines.decreased', true);
  jp('R5', 'docs/architecture/module-baseline.json 의 마지막 기록 inlineScriptLines 가 작업 트리 측정값과 같다(module-guard --update 로 기록).', MF, 'summary.baseline.recordedEqualsMeasured', true, ['docs/architecture/module-baseline.json']);
  jp('R5', '모듈 가드 종료 코드가 0 이다.', MF, 'summary.guard.exitCode', 0);
  jp('R5', '모듈 로드 탐침의 새 회귀가 없다.', REL + 'module-load.json', 'regressions', []);
  jp('R5', 'npm test 를 기준 트리와 작업 트리에서 전경으로 끝까지 돌려 종료 코드 0 이고 검사 줄·요약이 같다(폐기 0).', MF, 'summary.npmTest.same', true);
  jp('R5', 'npm test 의 스크립트와 tests/*.test.js 를 하나씩 따로 돌린 결과(실패 집합·꼬리 글자)가 기준과 같다.', MF, 'summary.testsEach.sameAsBase', true);
  jp('R5', '무결성 게이트 종료 코드가 0 이다.', MF, 'summary.guard.integrityGateExitCode', 0);
  jp('R5', 'tests/ 아래 바뀐 파일이 없다.', MF, 'summary.changed.testsChanged', []);
  jp('R5', '금고(court/** 등) 아래 바뀐 파일이 없다.', MF, 'summary.changed.vaultChanged', []);
  jp('R5', '생성기·하네스 변경이 없다.', MF, 'summary.changed.generatorChanged', []);
  jp('R5', 'scripts/ 아래 바뀐 파일이 없다.', MF, 'summary.changed.scriptsChanged', []);
  jp('R5', '새 세포 밖의 js 파일 변경이 없다.', MF, 'summary.changed.otherJsChanged', []);
  jp('R6', '통로 getter 가 늘어난 수(구역 본문이 읽는 IIFE 이름 가운데 통로에 없던 것 — 뒤의 재철거가 지운다).', MF, 'summary.moved.gettersAdded', m.moved.gettersAdded, [REL + 'region-meta.json']);
  jp('R6', '옮긴 구역 수.', MF, 'summary.moved.regions', m.moved.regions);
  jp('R6', '구역으로 간 최상위 문 수.', MF, 'summary.moved.statements', m.moved.statements);
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  for (const c of claims) { if (c.kind !== 'static') continue; const v = getPath(JSON.parse(fs.readFileSync(path.join(ROOT, c.check.file), 'utf8')), c.check.path); if (JSON.stringify(v) !== JSON.stringify(c.check.equals)) { console.error(c.id + ' 값 불일치: ' + c.check.path + ' = ' + JSON.stringify(v) + ' (기대 ' + JSON.stringify(c.check.equals) + ')'); process.exit(1); } }
  wj('claims.json', { task: TASK, requirementsSource: REQ, requirements: [
    { id: 'R1', text: 'index.html 인라인 IIFE 에서 앱이 뜰 때 한 번 도는 문을 구역 ' + m.moved.regions + '개(문 ' + m.moved.statements + '개)로 묶어 새 세포 ' + m.moved.cells + '개의 구역 함수로 옮기고, 원래 자리에 부르는 한 줄을 남긴다(생성기 region — 손 편집 0). 앱 동작은 그대로다.' },
    { id: 'R2', text: '옮기는 것은 닫힌 목록 X7(M1a~M1e)의 줄뿐이고 문 순서와 글자(L. 접두 밖)는 그대로다. 돈 근처 줄 · OURGOAL_CONFIG · 시험이 붙잡는 글자 · 다른 작업이 옮길 노출 줄은 제자리에 둔다.' },
    { id: 'R3', text: '새 세포는 책임 단위이고 800줄 이하이며, 등록 블록 없이 기존 감싸기와 같은 꼴(키트 · 머리 가져오기 · 호출 한 줄)이다. 신고서와 세포 설명을 더한다.' },
    { id: 'R4', text: '통로·window 값의 이름별 지문 · 상태 기관 이름의 값과 쓰기 왕복 · 사진 첨부 경로가 기준과 같다.' },
    { id: 'R5', text: '증명 하한: 인라인 줄 수 감소와 기준선 기록 · 모듈 가드 · 모듈 로드 새 회귀 0 · npm test 와 시험 하나씩 기준과 같음 · 무결성 게이트 · tests/·금고·생성기·scripts 변경 0.' },
    { id: 'R6', text: '구역 이전으로 늘어나는 통로 getter 의 수와 region 뒤 남는 줄을 재서 남긴다(뒤의 재철거·sweep·finalize 의 입력).' } ],
    outOfScopeReports: [
      { text: '게스트로 닿지 않는 화면(로그인 뒤 화면 · 템플릿 백과 · 앱 평가 창 · 아바타 레벨업 창 등 구역이 연결하는 단추의 일부)은 화면 시나리오로 재지 못했다. 그 연결 문은 글자·순서 그대로 옮겼다는 것(되짚기 · 본문 줄 대조 · 법정의 바이트 대조)과 통로 값 지문으로만 쟀다.', cannotBecause: 'out-of-scope-feature' },
      { text: '늘어난 통로 getter 의 재철거, 남은 로드 중 문(돈 근처 · 결심 대기 · 붙잡힌 글자) · sweep · finalize 는 이 PR 에 없다. 호출 순서의 동적 대조 탐침은 만들지 않았다(미검증).', cannotBecause: 'out-of-scope-feature' } ],
    claims });
  console.log('claims', claims.length, '· behavior', claims.filter(c => c.kind === 'behavior').length);
  process.exit(0);
}
