#!/usr/bin/env node
'use strict';
// 상태 이전 실행기 (#TASK-ES-679 — reports/TASK-ES-679/unstate-run.cjs 를 본떴다 · docs/architecture/CELL-REGISTRY-DESIGN.md 3.3절 · 5.5절) — 작업자 도구, 판정 아님.
// 673 판과 다른 점: measure 가 손잡이 탐침·공유 함수 정적 검사 대신 상태 객체 탐침(tools/state-object-probe.cjs — 앱 상태 객체의 동일성 · 통째 대입 왕복 · 템플릿 부품이 받는 getState · 프롬프트 서랍 접힘 값을 읽고 쓰는 세포 함수, 기준 2회 · 작업)과
//   초기값 글자의 바이트 비교(선언 줄에서 머리·끝을 뗀 글자)를 잰다. claims 가 그 결과를 주장에 넣는다.
// 줄을 지우고 바꿔 쓰는 것은 이 파일이 아니라 생성기(gen-inline-hard.js mode:"unstate")다 — 손 편집 0.
//
//   apply   작업 트리 index.html 에서 통로에 노출된 상태 이름을 전부 뽑아 하나씩 생성기에 돌려 옮길 수 있는 이름을 가른다(생성기 판단 그대로).
//           --exclude 의 이름(시험이 상태 선언 글자를 붙잡는 이름)을 빼고 reports/<TASK>/proof.json 을 쓴 뒤 생성기를 작업 트리에 돌린다. 기록은 unstate-meta.json.
//   measure 기준 트리(origin/main 임시 worktree)와 맞대어 잰다: 바뀐 파일 범위 · 되짚기(기준 index.html 에 생성기 기록을 적용한 결과 == 작업 index.html) · 지운·바뀐 줄의 종류 ·
//           인라인 줄 수 전→후와 기준선 기록 · 상태 탐침(이름별 통로 값 요약 · 접근자 종류 · 쓰기 왕복 · window 복사 동일성) · 등록 기관 대조 탐침 · 시나리오 · 모듈 로드 ·
//           npm test 로그 비교 · 시험 전부(따로 실행한 결과 파일) · module-guard · 무결성 게이트 → reports/<TASK>/measurement.json · remaining-state.json
//   claims  measurement.json 에서 reports/<TASK>/claims.json 을 만든다(보존 주장 = 시나리오마다 하나 + proof.json, 기록 주장 = 측정 파일의 값).
//
// 사용(작업 트리에서, NODE_PATH=C:/dev/ourgoal-app/node_modules):
//   node reports/TASK-ES-679/unstate-run.cjs apply   <작업 트리> --task TASK-ES-679 [--exclude reports/TASK-ES-636/pinned-state.exclude.json] [--label "…"]
//   node reports/TASK-ES-679/unstate-run.cjs measure <작업 트리> --task TASK-ES-679 --base <기준 트리>
//       먼저: reports/<TASK>/raw/npm-test.{base,work}.{log,exit} · tests-{base,work}.json(reports/TASK-ES-614/run-tests-each.cjs) · reports/<TASK>/scenarios/*.json
//   node reports/TASK-ES-679/unstate-run.cjs claims  <작업 트리> --task TASK-ES-679 --req docs/specs/REQ-….md
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const argv = process.argv.slice(2);
const CMD = argv[0], ROOT = path.resolve(argv[1] || '.');
const opt = (k, d) => (argv.indexOf(k) >= 0 ? argv[argv.indexOf(k) + 1] : d);
const TASK = opt('--task');
if (!['apply', 'measure', 'claims'].includes(CMD) || !TASK) { console.error('사용: node unstate-run.cjs apply|measure|claims <작업 트리> --task TASK-ES-6xx …(머리 주석 참고)'); process.exit(2); }
const REL = 'reports/' + TASK + '/', DIR = path.join(ROOT, 'reports', TASK);
const GEN = path.join(ROOT, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js');
const ORGAN = 'js/core/app-state.js', INDEX = path.join(ROOT, 'index.html');
const wj = (f, o) => { fs.mkdirSync(path.dirname(path.join(DIR, f)), { recursive: true }); fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' }); };
const rj = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const lf = s => s.replace(/\r\n/g, '\n');
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const commands = [];
function run(id, args, cwd, env) {
  const t0 = new Date().toISOString();
  const r = cp.spawnSync(args[0], args.slice(1), { cwd: cwd || ROOT, encoding: 'utf8', env: Object.assign({}, process.env, env || {}), shell: false, maxBuffer: 256 * 1024 * 1024 });
  commands.push({ id, argv: args.map(a => String(a).replace(ROOT, '<작업 트리>')), startedAt: t0, endedAt: new Date().toISOString(), exitCode: r.status, stdoutHead: (r.stdout || '').slice(0, 200), stderrHead: (r.stderr || '').slice(0, 200) });
  return r;
}
const git = (args, cwd) => run('git ' + args.slice(0, 2).join(' '), ['git'].concat(args), cwd);
const L = s => s.trim().split('\n').map(x => x.trim()).filter(Boolean);
// index.html 의 인라인 IIFE 에서 상태 이름을 뽑는다(키트 손잡이·가져오기는 뺀다): { stateNames, exposed, notExposed }
function stateNamesOf(indexFile) {
  const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
  const lines = fs.readFileSync(indexFile, 'utf8').split('\n').map(l => l.replace(/\r$/, ''));
  let s = -1, e = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
  const ast = parser.parse(lines.slice(s, e).join('\n'), { sourceType: 'script', ranges: true });
  let iife = null; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
  const top = iife.get('body').get('body');
  const rootWin = n => { let x = n; while (x && x.type === 'MemberExpression') x = x.object; return !!x && x.type === 'Identifier' && x.name === 'window'; };
  const handles = new Set(), stateNames = [], exposed = new Set(), declLine = {};
  for (const st of top) { if (!st.isVariableDeclaration() || st.node.declarations.length !== 1) continue; const d = st.node.declarations[0]; if (d.id.type === 'Identifier' && d.init && d.init.type === 'MemberExpression' && rootWin(d.init) && /^_/.test(d.id.name)) handles.add(d.id.name); }
  for (const st of top) if (st.isVariableDeclaration()) for (const d of st.node.declarations) {
    if (d.id.type !== 'Identifier' || handles.has(d.id.name)) continue;
    if (st.node.declarations.length === 1 && d.init && d.init.type === 'MemberExpression' && !d.init.computed && d.init.object.type === 'Identifier' && handles.has(d.init.object.name)) continue; // 키트 가져오기
    if (!stateNames.includes(d.id.name)) { stateNames.push(d.id.name); declLine[d.id.name] = st.node.loc.start.line + s; }
  }
  for (const st of top) { const x = st.isExpressionStatement() && st.node.expression; if (x && x.type === 'CallExpression' && x.callee.type === 'MemberExpression' && x.callee.property.name === 'expose' && x.arguments[1] && x.arguments[1].type === 'ObjectExpression') for (const p of x.arguments[1].properties) if (p.type === 'ObjectMethod' && p.key.type === 'Identifier' && stateNames.includes(p.key.name)) exposed.add(p.key.name); }
  return { stateNames, exposed: stateNames.filter(n => exposed.has(n)), notExposed: stateNames.filter(n => !exposed.has(n)), declLine, iifeLines: e - s };
}

// ───────────────────────── apply ─────────────────────────
if (CMD === 'apply') {
  const exArg = opt('--exclude'), EXCLUDE = exArg ? JSON.parse(fs.readFileSync(path.resolve(ROOT, exArg), 'utf8')) : {};
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'unstate-run-')), META = path.join(tmp, 'gen-inline-hard-meta.json');
  const genOnce = (dir, cfgFile) => { try { fs.unlinkSync(META); } catch (_) { /* 없으면 그만 */ } const r = run('gen-inline-hard(unstate)', [process.execPath, GEN, dir, cfgFile], ROOT, { MODULE_SPLIT_OUT: tmp }); return { status: r.status, stdout: r.stdout || '', meta: r.status === 0 && fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : null, err: r.status === 0 ? null : ((r.stderr || '').split('\n').find(l => /Error/.test(l)) || '').replace(/^Error: /, '').replace(/\r$/, '') }; };
  const before = fs.readFileSync(INDEX, 'utf8'), sn = stateNamesOf(INDEX);
  const dTry = path.join(tmp, 'try'); fs.mkdirSync(dTry);
  const movable = [], stopped = [];
  for (const n of sn.exposed) {
    fs.writeFileSync(path.join(dTry, 'index.html'), before, { encoding: 'utf8' });
    fs.writeFileSync(path.join(tmp, 'try.json'), JSON.stringify({ task: TASK, slot: 'HO', mode: 'unstate', cells: [{ file: ORGAN }], unstate: { names: [n] } }), { encoding: 'utf8' });
    const r = genOnce(dTry, path.join(tmp, 'try.json'));
    if (r.status === 0) movable.push(n); else stopped.push({ name: n, reason: r.err });
  }
  const excluded = movable.filter(n => EXCLUDE[n]), names = movable.filter(n => !EXCLUDE[n]);
  const proof = { task: TASK, label: opt('--label', '상태 이전 4차 — 통로에 노출된 상태 이름 ' + names.length + '개의 소유를 상태 기관(js/core/app-state.js)으로'), slot: 'HO', mode: 'unstate', cells: [{ file: ORGAN }], unstate: { names } };
  wj('proof.json', proof);
  const r = genOnce(ROOT, path.join(DIR, 'proof.json'));
  if (r.status !== 0) { console.error('생성기 실패:', r.err); process.exit(1); }
  const after = fs.readFileSync(INDEX, 'utf8'), m = r.meta;
  wj('unstate-meta.json', { tool: REL + 'unstate-run.cjs apply', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), generator: 'docs/design/harness/module-split/gen-inline-hard.js mode:"unstate"(이 PR 에서 변경 0)', proof: REL + 'proof.json', excludeFile: exArg || null,
    counts: { stateNames: sn.stateNames.length, exposed: sn.exposed.length, notExposed: sn.notExposed.length, movable: movable.length, stopped: stopped.length, excluded: excluded.length, applied: names.length, define: Object.values(m.api).filter(v => v === 'define').length, defineVar: Object.values(m.api).filter(v => v === 'defineVar').length },
    htmlLines: [lf(before).split('\n').length, lf(after).split('\n').length], generatorStdout: r.stdout.trim().split('\n'),
    names: m.names, api: m.api, deletedLineNumbers: m.deletedLines, commaFixedLineNumbers: m.commaFixedLines, editedLineNumbers: m.editedLines, removedDetail: m.removed, rewrittenDetail: m.rewritten,
    movable, excluded, stopped, notExposed: sn.notExposed, exposedAll: sn.exposed, commands });
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ }
  console.log(JSON.stringify({ exposed: sn.exposed.length, movable: movable.length, excluded, applied: names.length, define: Object.values(m.api).filter(v => v === 'define').length, defineVar: Object.values(m.api).filter(v => v === 'defineVar').length, deleted: m.deletedLines.length, edited: m.editedLines.length, htmlLines: [lf(before).split('\n').length, lf(after).split('\n').length], stopped: stopped.length }));
  process.exit(0);
}

// ───────────────────────── measure ─────────────────────────
if (CMD === 'measure') {
  const BASE = path.resolve(opt('--base'));
  const meta = rj('unstate-meta.json'), proof = rj('proof.json');
  const baseHead = git(['rev-parse', 'HEAD'], BASE).stdout.trim(), workHead = git(['rev-parse', 'HEAD']).stdout.trim();
  const numstat = L(git(['diff', '--numstat', baseHead, '--']).stdout).map(l => { const [a, d, f] = l.split('\t'); return { file: f, insertions: Number(a), deletions: Number(d) }; });
  const all = numstat.map(x => x.file).concat(L(git(['ls-files', '--others', '--exclude-standard']).stdout)).filter((f, i, a) => a.indexOf(f) === i && !f.startsWith('.claude/'));
  const productRe = /^(js\/.*|index\.html|ui\.js|sw\.js|.*\.css)$/;
  const vaultRe = /^(court\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|\.agent\/rules\/|docs\/rules\/(OURGOAL_ABSOLUTE_INTEGRITY_RULES\.md|CONSTITUTION_VERSIONS\.md|ESSENCE_OURGOAL\.md|rules\.json|rules-control\.json|branch-protection.*\.json|archive\/)|\.github\/|\.githooks\/|scripts\/essence-gate\.js$|scripts\/install-essence-gate\.js$|scripts\/verify-integrity-gate\.js$|scripts\/hook-smoke-on-index\.js$|\.vercelignore$|package\.json$|vercel\.json$|\.gitattributes$|\.claude\/settings\.json$|docs\/directives\/)/;
  // 되짚기: 기준 index.html 에 생성기 기록을 적용한다 — 지운 줄을 빼고, 쉼표를 떼고, 선언 머리(`var X =` → define 머리)·선언 끝(`;` → `);`)·window 복사 오른쪽을 바꿔 쓴다. 결과가 작업 index.html 과 글자 그대로 같아야 한다.
  const bl = lf(fs.readFileSync(path.join(BASE, 'index.html'), 'utf8')).split('\n'), wl = lf(fs.readFileSync(INDEX, 'utf8')).split('\n');
  const del = new Set(meta.deletedLineNumbers), comma = new Set(meta.commaFixedLineNumbers), R = meta.removedDetail, W = meta.rewrittenDetail, names = new Set(proof.unstate.names);
  const listed = new Set(); R.exposeProps.forEach(x => listed.add(x.line)); R.exposeCalls.forEach(x => { for (let l = x.line; l <= x.endLine; l++) listed.add(l); });
  const headAt = new Map(W.declarations.map(d => [d.line, d])), tailAt = new Map(W.declarations.map(d => [d.endLine, d])), copyAt = new Map(); W.windowCopies.forEach(c => { if (!copyAt.has(c.line)) copyAt.set(c.line, []); copyAt.get(c.line).push(c); });
  const replayProblems = [], rebuilt = [];
  bl.forEach((t0, k) => {
    const n = k + 1; if (del.has(n)) return;
    let t = t0;
    if (comma.has(n)) { if (!/,\s*$/.test(t)) replayProblems.push({ line: n, why: '쉼표를 뗀 줄이 쉼표로 끝나지 않는다' }); t = t.replace(/,\s*$/, ''); }
    if (headAt.has(n)) { const d = headAt.get(n), re = new RegExp('^(\\s*)var\\s+' + escRe(d.name) + '\\s*='); if (!re.test(t)) replayProblems.push({ line: n, why: '선언 머리가 `var ' + d.name + ' =` 꼴이 아니다' }); t = t.replace(re, '$1window.OurgoalAppState.' + d.api + "('" + d.name + "',"); }
    if (tailAt.has(n)) { if (!/;\s*$/.test(t)) replayProblems.push({ line: n, why: '선언 끝 줄이 ; 로 끝나지 않는다' }); t = t.replace(/;(\s*)$/, ');$1'); }
    if (copyAt.has(n)) for (const c of copyAt.get(n)) { const re = new RegExp('(window\\.' + escRe(c.name) + '\\s*=\\s*)' + escRe(c.name) + '(\\s*;)'); if (!re.test(t)) replayProblems.push({ line: n, why: 'window 복사 줄이 `window.' + c.name + ' = ' + c.name + ';` 꼴이 아니다' }); t = t.replace(re, '$1window.OurgoalAppScope.scope.' + c.name + '$2'); }
    rebuilt.push(t);
  });
  const accessorRe = /^get ([\w$]+)\(\)\{ return \1; \}(?:, set \1\(v\)\{ \1 = v; \})?,?$/;
  const propProblems = R.exposeProps.filter(x => { const m = accessorRe.exec(bl[x.line - 1].trim()); return !m || m[1] !== x.name || !names.has(x.name); }).map(x => ({ line: x.line, name: x.name, text: bl[x.line - 1].trim().slice(0, 120) }));
  const shellProblems = R.exposeCalls.flatMap(x => [x.line, x.endLine]).filter(n => !/^(window\.OurgoalAppScope\.expose\('index\.html', \{|\}\);)$/.test(bl[n - 1].trim())).map(n => ({ line: n, text: bl[n - 1].trim().slice(0, 120) }));
  const editedExpected = [...new Set([...headAt.keys(), ...tailAt.keys(), ...copyAt.keys()])].sort((a, b) => a - b);
  const replay = { rebuiltEqualsWork: !replayProblems.length && rebuilt.length === wl.length && rebuilt.every((t, i) => t === wl[i]), baseLines: bl.length, workLines: wl.length, deletedLines: del.size, commaFixedLines: comma.size, editedLines: meta.editedLineNumbers.length, problems: replayProblems,
    firstDiff: (() => { for (let i = 0; i < Math.max(rebuilt.length, wl.length); i++) if (rebuilt[i] !== wl[i]) return { line: i + 1, rebuilt: (rebuilt[i] || '').slice(0, 160), work: (wl[i] || '').slice(0, 160) }; return null; })(),
    note: '기준 index.html 에서 생성기가 적어 낸 줄(deletedLineNumbers)을 지우고, commaFixedLineNumbers 줄 끝 쉼표 한 글자를 떼고, 선언 머리·선언 끝·window 복사 오른쪽을 정해진 글자로 바꾼 결과 == 작업 index.html (줄바꿈만 LF 로 맞춤). 참이면 그 밖의 글자 변경 0 · 더한 줄 0' };
  const kindsOnly = { deletedOutsideListedKinds: [...del].filter(n => !listed.has(n)), exposePropsNotTrivialAccessorOfProofName: propProblems, exposeShellsNotShell: shellProblems, namesOutsideProof: [...new Set(R.exposeProps.map(x => x.name).concat(W.declarations.map(x => x.name), W.windowCopies.map(x => x.name)))].filter(n => !names.has(n)),
    editedLinesEqualExpected: JSON.stringify(meta.editedLineNumbers) === JSON.stringify(editedExpected), declarations: W.declarations.length, windowCopies: W.windowCopies.length, exposeProps: R.exposeProps.length, exposeCallsRemoved: R.exposeCalls.length,
    everyNameHasOneDeclaration: proof.unstate.names.every(n => W.declarations.filter(d => d.name === n).length === 1), everyNameHadAccessor: proof.unstate.names.every(n => R.exposeProps.some(p => p.name === n)),
    note: '지운 줄은 전부 대상 이름의 expose getter/setter 속성 줄(본문 return X; · X = v;)과 속성이 모두 지워진 expose 문의 머리·꼬리에 들고, 바뀐 줄은 선언 머리·선언 끝·window 복사 줄뿐이다(닫힌 목록 X4·X5·X6)' };
  const mm = require(path.join(ROOT, 'scripts', 'module-metrics.js'));
  const mW = mm.measure(ROOT).ratchet, mB = require(path.join(BASE, 'scripts', 'module-metrics.js')).measure(BASE).ratchet;
  const guard = run('module-guard', [process.execPath, 'scripts/module-guard.js', '--quiet']);
  const gate = run('verify-integrity-gate', [process.execPath, 'scripts/verify-integrity-gate.js']);
  const baselineJ = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'architecture', 'module-baseline.json'), 'utf8')), baselineB = JSON.parse(fs.readFileSync(path.join(BASE, 'docs', 'architecture', 'module-baseline.json'), 'utf8'));
  const lastOf = j => j.history[j.history.length - 1].metrics.inlineScriptLines;
  // 상태 탐침: 기준(2회 — 본질 변동 거름) · 작업. 이름 목록은 기준 트리에서 뽑은 「통로에 노출된 상태 이름 전부」로 고정
  const snBase = stateNamesOf(path.join(BASE, 'index.html'));
  wj('probe-names.json', { note: '기준 트리 index.html 의 통로에 노출된 상태 이름 전부(옮긴 것 + 남은 것) — 고정 입력', names: snBase.exposed });
  const probe = path.join(ROOT, 'reports', 'TASK-ES-636', 'state-probe.cjs');
  for (const [tree, out] of [[BASE, 'state-probe.base.json'], [BASE, 'state-probe.base2.json'], [ROOT, 'state-probe.work.json']]) run('state-probe ' + out, [process.execPath, probe, tree, path.join(DIR, out), '--names', path.join(DIR, 'probe-names.json')]);
  const pB = rj('state-probe.base.json'), pB2 = rj('state-probe.base2.json'), pW = rj('state-probe.work.json');
  const FIELDS = ['accessor', 'value', 'onWindow', 'windowValue', 'windowSame', 'writeRoundtrip', 'restored', 'error'];
  const probeDiff = (x, y) => Object.keys(x.names || {}).filter(n => FIELDS.some(f => JSON.stringify(x.names[n][f]) !== JSON.stringify(((y.names || {})[n] || {})[f]))).map(n => ({ name: n, fields: FIELDS.filter(f => JSON.stringify(x.names[n][f]) !== JSON.stringify(((y.names || {})[n] || {})[f])), base: FIELDS.reduce((a, f) => { a[f] = x.names[n][f]; return a; }, {}), other: FIELDS.reduce((a, f) => { a[f] = ((y.names || {})[n] || {})[f]; return a; }, {}) }));
  const intrinsic = probeDiff(pB, pB2).map(d => d.name), diffW = probeDiff(pB, pW).filter(d => !intrinsic.includes(d.name));
  // 함수 지문은 `function:<name>:<인자 수>:<본문 해시>` 꼴이다. 선언문이 define(…) 의 인자가 되면 이름 없는 함수식의 name 이 '' 이 된다 — 차이가 그 이름 칸뿐인지(인자 수·본문 해시 동일) 가른다
  const fnRe = /^function:([^:]*):(\d+):([0-9a-f?]+)$/;
  const fnNameOnly = (x, y) => { const a = fnRe.exec(String(x)), b = fnRe.exec(String(y)); return !!a && !!b && a[2] === b[2] && a[3] === b[3] && a[1] !== b[1]; };
  const nameOnly = d => d.fields.every(k => fnNameOnly(d.base[k], d.other[k]));
  const diffNameOnly = diffW.filter(nameOnly), diffBeyond = diffW.filter(d => !nameOnly(d));
  const writable = p => { const v = Object.values(p.names || {}).filter(x => x.accessor === 'get+set'); return { names: v.length, roundtripOk: v.filter(x => x.writeRoundtrip === true && x.restored === true).length }; };
  const winSame = p => { const v = Object.values(p.names || {}).filter(x => x.onWindow); return { onWindow: v.length, same: v.filter(x => x.windowSame === true).length }; };
  // 기관이 맡은 이름 = 기준에서 이미 맡던 이름(앞선 이전) + 이번 설정의 이름
  const organOk = !!pW.organNames && JSON.stringify(pW.organNames.slice().sort()) === JSON.stringify((pB.organNames || []).concat(proof.unstate.names).sort()) && proof.unstate.names.every(n => !(pB.organNames || []).includes(n)) && proof.unstate.names.every(n => pW.names[n] && pW.names[n].organKind === (meta.api[n] === 'defineVar' ? 'var' : 'const') && pW.names[n].owner === 'core/app-state');
  const transitions = {}; for (const n of Object.keys(pB.names || {})) { const k = pB.names[n].accessor + ' → ' + ((pW.names || {})[n] || {}).accessor + ' | 주인 ' + pB.names[n].owner + ' → ' + ((pW.names || {})[n] || {}).owner; transitions[k] = (transitions[k] || 0) + 1; }
  // 상태 객체 탐침(기준 2회 · 작업): 앱 상태 객체와 프롬프트 서랍 접힘 값을 페이지 안에서 더 잰다
  const sop = path.join(DIR, 'tools', 'state-object-probe.cjs');
  for (const [tree, out] of [[BASE, 'state-object-probe.base.json'], [BASE, 'state-object-probe.base2.json'], [ROOT, 'state-object-probe.work.json']]) run('state-object-probe ' + out, [process.execPath, sop, tree, path.join(DIR, out)]);
  const oB = rj('state-object-probe.base.json'), oB2 = rj('state-object-probe.base2.json'), oW = rj('state-object-probe.work.json');
  // 이전으로 바뀌는 것이 당연한 칸(주인 표시 · 기관 종류 · 기관이 맡은 이름 수)을 가린 뒤 통째로 맞댄다
  const mask = r => JSON.parse(JSON.stringify(r, (k, v) => (k === 'owner' || k === 'organKind' || k === 'organNames') ? undefined : v));
  const sameMasked = (a, b) => !!a.result && !!b.result && JSON.stringify(mask(a.result)) === JSON.stringify(mask(b.result));
  // 초기값 글자: 기준 선언 줄에서 `var X =` 머리와 끝의 `;` 를 뗀 글자 == 작업 줄에서 기관 호출 머리와 끝의 `);` 를 뗀 글자(바이트). 줄 번호는 지운 줄 수만큼 당겨서 맞춘다
  const workLineOf = n => n - [...del].filter(x => x < n).length;
  const initText = W.declarations.map(d => { const b = bl.slice(d.line - 1, d.endLine).join('\n'), w = wl.slice(workLineOf(d.line) - 1, workLineOf(d.endLine)).join('\n');
    const bi = b.replace(new RegExp('^\\s*var\\s+' + escRe(d.name) + '\\s*='), '').replace(/;\s*$/, ''), wi = w.replace(new RegExp('^\\s*window\\.OurgoalAppState\\.' + d.api + "\\('" + escRe(d.name) + "',"), '').replace(/\);\s*$/, '');
    return { name: d.name, api: d.api, baseLine: d.line, lines: d.endLine - d.line + 1, initBytes: Buffer.byteLength(bi, 'utf8'), byteIdentical: Buffer.from(bi, 'utf8').equals(Buffer.from(wi, 'utf8')), headStripped: bi !== b && wi !== w, initStartsWith: bi.trim().slice(0, 12) }; });
  // 정적 검사: 옮긴 이름을 읽고 쓰는 자리 — 저장소 js/** 와 index.html 인라인에서 그 이름이 나오는 줄을 통로(L.이름) · 기관 define 줄 · 주석 · 그 밖으로 가른다
  const jsList = []; (function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const p = path.join(d, e.name); if (e.isDirectory()) return walk(p); if (e.name.endsWith('.js')) jsList.push(p); }); })(path.join(ROOT, 'js'));
  const staticUse = {};
  for (const n of proof.unstate.names) {
    const re = new RegExp('(^|[^\\w$])' + escRe(n) + '(?![\\w$])'), rows = [];
    const scan = (rel, ls) => ls.forEach((l, i) => { if (!re.test(l)) return; const code = /^\s*(\*|\/\*)/.test(l) ? '' : l.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, ''); /* 여러 줄 주석의 줄(` * …`)은 주석이다 */ if (!re.test(code)) return rows.push({ file: rel, line: i + 1, kind: 'comment' });
      const bare = code.replace(new RegExp('L\\.' + escRe(n) + '(?![\\w$])', 'g'), '').replace(new RegExp("window\\.OurgoalAppState\\.define(Var)?\\('" + escRe(n) + "',", 'g'), '').replace(new RegExp('getElementById\\(([\'\"])' + escRe(n) + '\\1\\)', 'g'), '').replace(new RegExp('([\'\"])[^\'\"]*' + escRe(n) + '[^\'\"]*\\1', 'g'), '');
      const assign = new RegExp('L\\.' + escRe(n) + '\\s*=(?!=)').test(code);
      rows.push({ file: rel, line: i + 1, kind: re.test(bare) ? 'bare' : (/OurgoalAppState\.define/.test(code) ? 'define' : (assign ? 'scopeAssign' : (new RegExp('L\\.' + escRe(n)).test(code) ? 'scopeRead' : 'other'))) }); });
    for (const p of jsList) scan(path.relative(ROOT, p).replace(/\\/g, '/'), lf(fs.readFileSync(p, 'utf8')).split('\n'));
    const s0 = wl.findIndex((l, i) => l.trim() === '<script>' && (wl[i + 1] || '').trim() === '(function(){'), e0 = wl.findIndex((l, i) => i > s0 && l.startsWith('</script>'));
    scan('index.html(인라인)', wl.slice(s0, e0).map(x => x)); rows.filter(r => r.file === 'index.html(인라인)').forEach(r => { r.line += s0; });
    const by = k => rows.filter(r => r.kind === k);
    staticUse[n] = { scopeAssign: by('scopeAssign').map(r => r.file + ':' + r.line), scopeRead: by('scopeRead').length, define: by('define').map(r => r.file + ':' + r.line), bare: by('bare').map(r => r.file + ':' + r.line), other: by('other').map(r => r.file + ':' + r.line), comment: by('comment').length };
  }
  const staticUseOf = n => staticUse[n] || null;
  // 맨이름 참조(문법 분석): 작업 index.html 인라인 IIFE 에서 옮긴 이름이 식별자 참조로 나오는 자리. 속성 이름·객체 키는 참조가 아니다. 그 이름의 선언이 인라인 안에 있으면(함수의 매개변수·지역 변수) 다른 변수라 따로 센다.
  const bareAst = (() => { const parser = require('@babel/parser'), traverse = require('@babel/traverse').default; const s0 = wl.findIndex((l, i) => l.trim() === '<script>' && (wl[i + 1] || '').trim() === '(function(){'), e0 = wl.findIndex((l, i) => i > s0 && l.startsWith('</script>'));
    const ast = parser.parse(wl.slice(s0 + 1, e0).join('\n'), { sourceType: 'script' }); const unbound = {}, local = {}; proof.unstate.names.forEach(n => { unbound[n] = new Set(); local[n] = new Set(); });
    const note = (p, node) => { if (!unbound[node.name]) return; (p.scope.getBinding(node.name) ? local : unbound)[node.name].add(node.loc.start.line + s0 + 1); };
    traverse(ast, { Identifier(p) { if (p.isReferencedIdentifier()) note(p, p.node); }, AssignmentExpression(p) { if (p.node.left.type === 'Identifier') note(p, p.node.left); }, UpdateExpression(p) { if (p.node.argument.type === 'Identifier') note(p, p.node.argument); } });
    const flat = o => Object.keys(o).reduce((a, n) => { if (o[n].size) a[n] = [...o[n]].sort((x, y) => x - y); return a; }, {});
    return { unbound: flat(unbound), unboundCount: Object.values(unbound).reduce((a, s) => a + s.size, 0), localOfSameName: flat(local) }; })();
  // 등록 기관 대조 탐침: 기준 트리 → 그 이름 목록으로 작업 트리(통로에서 사라진 이름이 없어야 한다)
  const cmp = path.join(ROOT, 'scripts', 'probes', 'cell-registry-compare.js');
  run('registry probe base', [process.execPath, cmp, BASE, path.join(DIR, 'cell-registry-compare.before.json'), '--fingerprints']);
  run('registry probe work', [process.execPath, cmp, ROOT, path.join(DIR, 'cell-registry-compare.json'), '--fingerprints', '--names-from', path.join(DIR, 'cell-registry-compare.before.json')]);
  const cB = rj('cell-registry-compare.before.json'), cW = rj('cell-registry-compare.json');
  const fpd = k => Object.keys(cB.fingerprints[k]).filter(n => cB.fingerprints[k][n] !== cW.fingerprints[k][n] && !intrinsic.includes(n));
  // 시나리오(법정 실행기를 읽기만 쓰는 로컬 실행 — 기준 대 작업)
  const scDir = path.join(DIR, 'scenarios'), scFiles = fs.existsSync(scDir) ? fs.readdirSync(scDir).filter(f => /\.json$/.test(f)).sort() : [];
  if (scFiles.length) run('scenario-local', [process.execPath, path.join(ROOT, 'docs', 'design', 'harness', 'module-split', 'scenario-local-z56.js'), BASE, ROOT, path.join(DIR, 'scenario-local.json')].concat(scFiles.map(f => path.join(scDir, f))));
  const sc = scFiles.length ? rj('scenario-local.json') : { scenarios: {} };
  const scRows = Object.keys(sc.scenarios).map(id => ({ id, basePassed: sc.scenarios[id].runs.base.passed, workPassed: sc.scenarios[id].runs.work.passed, baseExceptions: (sc.scenarios[id].runs.base.exceptions || []).length, workExceptions: (sc.scenarios[id].runs.work.exceptions || []).length, nonVacuousExpects: sc.scenarios[id].runs.work.nonVacuousExpects }));
  // 모듈 로드
  const ml = require(path.join(ROOT, 'court', 'probes', 'module-load.js'));
  const mlCmp = ml.compare(ml.probeModules(BASE), ml.probeModules(ROOT), fs.readFileSync(INDEX, 'utf8'));
  wj('module-load.json', { tool: 'court/probes/module-load.js (읽기 전용 — compare(probeModules(기준), probeModules(작업)))', type: '작업자 측정, 판정 아님', base: baseHead, measuredAt: new Date().toISOString(), regressions: mlCmp.regressions, insufficient: mlCmp.insufficient, counts: mlCmp.counts });
  // npm test 로그 비교
  function readLog(label) {
    const txt = lf(fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.log'), 'utf8')), T = txt.split('\n');
    const exitTxt = fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), 'utf8').trim();
    const norm = s => s.trim().replace(/\d+(\.\d+)?\s?ms\b/g, 'Nms').replace(/[A-Za-z]:[\\/][^\s"')]+/g, '<path>');
    const ok = T.filter(l => /^\s*✓ /.test(l)).map(norm), okDot = T.filter(l => /^\s*ok · /.test(l)).map(norm), fail = T.filter(l => /^\s*(✗|✖|not ok|FAIL\b)/.test(l)).map(norm);
    return { file: REL + 'raw/npm-test.' + label + '.log', ok: ok.length, okDot: okDot.length, fail: fail.length, exit: Number((/exit=(\d+)/.exec(exitTxt) || [])[1]), summaryTokens: T.filter(l => /(\d+개 통과|검증 결과|ALL PASS|COMPLETE|\[검증 \d+\/\d+\])/.test(l)).map(norm), _checks: ok.concat(okDot) };
  }
  const nb = readLog('base'), nw = readLog('work');
  const multiset = a => { const m = {}; a.forEach(x => { m[x] = (m[x] || 0) + 1; }); return m; };
  const mb = multiset(nb._checks), mw = multiset(nw._checks);
  const onlyBase = Object.keys(mb).filter(k => (mw[k] || 0) < mb[k]), onlyWork = Object.keys(mw).filter(k => (mb[k] || 0) < mw[k]);
  delete nb._checks; delete nw._checks;
  const npmCmp = { base: nb, work: nw, sameSummaryTokens: JSON.stringify(nb.summaryTokens) === JSON.stringify(nw.summaryTokens), sameOkCount: nb.ok === nw.ok && nb.okDot === nw.okDot, onlyBase, onlyWork };
  npmCmp.same = npmCmp.sameSummaryTokens && npmCmp.sameOkCount && nb.exit === 0 && nw.exit === 0 && !onlyBase.length && !onlyWork.length && nb.fail === 0 && nw.fail === 0;
  wj('npm-test-compare.json', npmCmp);
  // 시험 전부(npm test 의 스크립트와 tests/*.test.js 를 하나씩 — 따로 실행한 결과 파일)
  const tB = rj('tests-base.json'), tW = rj('tests-work.json');
  const fset = t => new Set(t.testFiles.filter(x => x.exit !== 0).map(x => x.file)), fB = fset(tB), fW = fset(tW), tail = (t, f) => (t.testFiles.find(x => x.file === f) || {}).tail || null;
  const scripts = tW.scripts.map(s => { const b = tB.scripts.find(x => x.script === s.script) || {}; return { script: s.script, exit: [b.exit, s.exit], ok: [b.ok, s.ok], okDot: [b.okDot, s.okDot], fails: [(b.fails || []).length, s.fails.length], same: b.exit === s.exit && b.ok === s.ok && b.okDot === s.okDot && s.fails.length === (b.fails || []).length }; });
  const testsEach = { scripts, scriptsSame: scripts.every(x => x.same), testFiles: tW.testFiles.length, failedBase: fB.size, failedWork: fW.size, onlyWork: [...fW].filter(x => !fB.has(x)), onlyBase: [...fB].filter(x => !fW.has(x)), sameFailTails: [...fW].filter(x => fB.has(x)).every(x => tail(tW, x) === tail(tB, x)) };
  testsEach.sameAsBase = testsEach.scriptsSame && !testsEach.onlyWork.length && !testsEach.onlyBase.length && testsEach.sameFailTails;
  // 남은 상태 이름: 풀리는 조건별
  const snWork = stateNamesOf(INDEX);
  const cond = r => /아직 맨이름으로 쓰는 곳이 남는다/.test(r) ? { key: 'bareRefs', label: '맨이름 참조가 남음', unlock: '그 이름을 맨이름으로 읽고 쓰는 IIFE 안 코드(함수 본문·로드 중 문)가 세포로 옮겨져 L. 통로로 읽게 되면 — 함수 이전·감싸기(구역 이전) 뒤 unstate 로 다시' }
    : /선언이 여럿이다/.test(r) ? { key: 'duplicateDecl', label: '같은 이름의 선언이 둘', unlock: '겹친 선언을 하나로 줄이는 선행 PR(고치기 — 동작 주장) 뒤 unstate 로' }
      : /선언문 .* 다른 글자와 한 줄을 나눠 쓴다/.test(r) ? { key: 'declSharesLine', label: '선언문이 다른 글자와 한 줄을 나눠 씀', unlock: '줄을 나누는 선행 PR(글자 이동만) 뒤 unstate 로, 또는 닫힌 목록을 넓히는 결심' }
        : /window 복사/.test(r) ? { key: 'copySharesLine', label: 'window 복사 줄이 다른 글자와 한 줄을 나눠 씀', unlock: '줄을 나누는 선행 PR 뒤 unstate 로, 또는 X6 의 정지 조건을 넓히는 결심' } : { key: 'other', label: '그 밖', unlock: '생성기 사유 참고' };
  const stoppedRows = meta.stopped.map(x => Object.assign({ name: x.name, reason: x.reason }, cond(x.reason)));
  const remaining = { tool: REL + 'unstate-run.cjs measure', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), basis: { worktreeHead: workHead, base: baseHead },
    totals: { stateNamesBefore: meta.counts.stateNames, moved: meta.counts.applied, stateNamesLeftInIife: snWork.stateNames.length, stoppedByGenerator: stoppedRows.length, excludedBecauseGatePinsStateText: meta.excluded.length, notExposed: meta.notExposed.length },
    byCondition: [
      ...Object.values(stoppedRows.reduce((a, r) => { (a[r.key] = a[r.key] || { condition: r.label, unlock: r.unlock, names: [] }).names.push(r.name); return a; }, {})),
      { condition: '무결성 게이트가 상태 선언 글자를 붙잡음', unlock: 'scripts/verify-integrity-gate.js 가 선언 글자(`이름 = 값;`)를 index.html 에서 찾는다 — 그 단언을 넓히는 PR(금고 변경 승인분)이 병합된 뒤 unstate 로. 이 PR 은 게이트·시험을 고치지 않았다', names: meta.excluded },
      { condition: '통로에 노출되지 않음(IIFE 안에서만 쓰는 값)', unlock: '상태 기관 대상이 아니다(통로로 읽는 세포가 없다). 서버 주소·공개 키 선언이다 — 공개 키 글자가 든 줄을 새 파일에 더하는 커밋을 금지 패턴 규칙(docs/rules/rules.json HARDCODED_SECRET)이 막아 구역으로도 못 옮긴다(#951 에서 확인). 결심 필요', names: meta.notExposed }
    ].map(x => Object.assign({ count: x.names.length }, x)),
    stoppedDetail: stoppedRows.map(r => ({ name: r.name, condition: r.label, generatorReason: r.reason })) };
  wj('remaining-state.json', remaining);
  // finalize 전제까지 남은 것(작업 · 기준): 생성기 finalize 를 임시 사본에 돌린 오류 글자와, 최상위 문을 종류별로 센 표
  const gapTool = path.join(DIR, 'tools', 'finalize-gap-679.cjs');
  run('finalize-gap work', [process.execPath, gapTool, ROOT, path.join(DIR, 'finalize-gap.json')]); run('finalize-gap base', [process.execPath, gapTool, BASE, path.join(DIR, 'finalize-gap.base.json')]);
  const gap = rj('finalize-gap.json'), gapB = rj('finalize-gap.base.json'), kindRow = (x, k) => (x.byKind.find(y => y.kind === k) || { statements: 0, lines: 0 });
  const gapKinds = [...new Set(gapB.byKind.concat(gap.byKind).map(x => x.kind))].map(k => ({ kind: k, label: (gap.byKind.concat(gapB.byKind).find(x => x.kind === k) || {}).label, statements: [kindRow(gapB, k).statements, kindRow(gap, k).statements], lines: [kindRow(gapB, k).lines, kindRow(gap, k).lines] }));

  const out = { schema: 'ourgoal.unstate-run.measurement/1', taskId: TASK, type: '작업자 측정, 판정 아님 — 판정은 GitHub 법정(node court/chat.js <PR>)만 낸다', measuredAt: new Date().toISOString(),
    environment: { node: process.version, platform: process.platform, arch: process.arch, gitAutocrlf: git(['config', 'core.autocrlf']).stdout.trim() || null },
    sourceCommit: { baseTreeHead: baseHead, worktreeHead: workHead, note: '기준 = origin/main 임시 git worktree(저장소 밖). 작업 = 이 트리(커밋 전 작업 상태 포함)' },
    summary: {
      changed: { files: all.length, list: all, productFiles: all.filter(f => productRe.test(f)), onlyIndexHtml: JSON.stringify(all.filter(f => productRe.test(f))) === '["index.html"]', indexHtml: numstat.find(x => x.file === 'index.html') || null, netLineGrowth: (() => { const r = numstat.find(x => x.file === 'index.html'); return r ? r.insertions - r.deletions : null; })(),
        testsChanged: all.filter(f => /^tests\//.test(f)), vaultChanged: all.filter(f => vaultRe.test(f)), generatorChanged: all.filter(f => /^docs\/design\/harness\/module-split\/gen-.*\.js$/.test(f)), organChanged: all.filter(f => f === ORGAN || f === 'js/core/app-scope.js') },
      moved: { names: meta.counts.applied, define: meta.counts.define, defineVar: meta.counts.defineVar, exposed: meta.counts.exposed, movable: meta.counts.movable, excluded: meta.excluded, stopped: meta.counts.stopped, notExposed: meta.counts.notExposed },
      replay, kindsOnly,
      inlineScriptLines: { before: mB.inlineScriptLines, after: mW.inlineScriptLines, decreased: mW.inlineScriptLines < mB.inlineScriptLines, delta: mW.inlineScriptLines - mB.inlineScriptLines, equalsDeletedLines: mB.inlineScriptLines - mW.inlineScriptLines === del.size, source: 'scripts/module-metrics.js measure().ratchet' },
      ratchet: { indexFunctionDecls: [mB.indexFunctionDecls, mW.indexFunctionDecls], windowAssignments: [mB.windowAssignments, mW.windowAssignments], oversizeJsFiles: [mB.oversizeJsFiles.count, mW.oversizeJsFiles.count], crossTabRefs: [mB.crossTabRefs, mW.crossTabRefs] },
      baseline: { recordedBefore: lastOf(baselineB), recorded: lastOf(baselineJ), recordedEqualsMeasured: lastOf(baselineJ) === mW.inlineScriptLines, historyGrewBy: baselineJ.history.length - baselineB.history.length },
      guard: { exitCode: guard.status, integrityGateExitCode: gate.status, integrityGateResult: ((gate.stdout || '').split('\n').find(l => /검증 결과/.test(l)) || '').trim() },
      stateProbe: { names: Object.keys(pB.names || {}).length, bootOk: { base: pB.guestBoot.ok, work: pW.guestBoot.ok }, exceptions: { base: pB.guestBoot.exceptions.length, work: pW.guestBoot.exceptions.length }, consoleErrors: { base: pB.guestBoot.consoleErrors.length, work: pW.guestBoot.consoleErrors.length },
        intrinsicVariance: intrinsic, differing: diffW, differingCount: diffW.length, differingFunctionNameOnly: diffNameOnly.map(d => d.name), differingBeyondFunctionName: diffBeyond.map(d => d.name), organNames: pW.organNames ? pW.organNames.length : null, organMatchesProof: organOk, transitions, writable: { base: writable(pB), work: writable(pW) }, windowCopy: { base: winSame(pB), work: winSame(pW) },
        captureCount: { base: pB.checks && pB.checks.captureCount, work: pW.checks && pW.checks.captureCount, same: JSON.stringify(pB.checks) === JSON.stringify(pW.checks) },
        note: '이름마다 통로 값의 요약(종류 · 길이 · JSON 가능한 값의 해시 · 요소는 태그#id.class) · 접근자 종류 · window 값의 동일성 · 쓰기 가능한 이름의 쓰기 왕복을 기준과 작업에서 재어 맞댄 차이. 기준을 두 번 재어 달라지는 이름(본질 변동)은 뺐다' },
      stateObject: (() => { const B = oB.result || {}, K = oW.result || {}, bs = B.state || {}, ws = K.state || {}, bp = B.promptOpen || {}, wp = K.promptOpen || {}, ag = K.afterGoalsTab || {};
        return { bootOk: { base: oB.boot.ok, base2: oB2.boot.ok, work: oW.boot.ok }, exceptions: { base: oB.boot.exceptions.length, work: oW.boot.exceptions.length }, baseRepeatSame: JSON.stringify(oB.result) === JSON.stringify(oB2.result), sameAsBaseExceptOwner: sameMasked(oB, oW),
          state: { apiByGenerator: meta.api.state || null, accessor: [bs.accessor, ws.accessor], owner: [bs.owner, ws.owner], organKind: ws.organKind, keys: [bs.keys, ws.keys], keysHash: [bs.keysHash, ws.keysHash], windowSame: [bs.windowSame, ws.windowSame], getStateSame: [bs.getStateSame, ws.getStateSame], partInitCalls: [bs.partInitCalls, ws.partInitCalls],
            reassign: { base: bs.reassign, work: ws.reassign }, reassignWorkOk: !!ws.reassign && ws.reassign.scopeReturnsNew === true && ws.reassign.getStateReturnsNew === true && ws.reassign.windowStillOld === true && ws.reassign.restored === true,
            inPlaceWorkOk: ws.inPlaceVisibleOnWindow === true && ws.inPlaceVisibleViaGetState === true && ws.inPlaceRemoved === true, sameObjectEverywhereWork: ws.sameOnReread === true && ws.windowSame === true && ws.getStateSame === true,
            afterGoalsTab: { base: B.afterGoalsTab || null, work: K.afterGoalsTab || null }, afterGoalsTabWorkAllGoals: ag.scopeActiveTab === 'goals' && ag.windowActiveTab === 'goals' && ag.getStateActiveTab === 'goals',
            scopeAssignSites: (staticUseOf('state') || {}).scopeAssign, scopeReadLines: (staticUseOf('state') || {}).scopeRead },
          promptOpen: { apiByGenerator: meta.api._promptEncyclopediaOpen || null, accessor: [bp.accessor, wp.accessor], owner: [bp.owner, wp.owner], organKind: wp.organKind, value: [bp.value, wp.value], drawer: { whenFalse: [bp.drawerWhenFalse, wp.drawerWhenFalse], whenTrue: [bp.drawerWhenTrue, wp.drawerWhenTrue] }, toggledByButton: [bp.toggledByButton, wp.toggledByButton],
            workOk: wp.value === false && wp.writeTrue === true && wp.restored === true && wp.drawerWhenFalse === 'none' && wp.drawerWhenTrue === 'block' && wp.toggledByButton === true && wp.restoredAfterToggle === true,
            scopeAssignSites: (staticUseOf('_promptEncyclopediaOpen') || {}).scopeAssign, scopeReadLines: (staticUseOf('_promptEncyclopediaOpen') || {}).scopeRead },
          initText, initTextAllByteIdentical: initText.length === proof.unstate.names.length && initText.every(x => x.byteIdentical && x.headStripped),
          note: '상태 객체 탐침(게스트 부팅 뒤 페이지 안 평가)의 기록을 기준과 작업에서 맞댄 것 + 초기값 글자의 바이트 비교. 주인 표시·기관 종류는 이전으로 바뀌는 것이 당연해 가리고 맞댔다' }; })(),
      usage: { bareInlineUnbound: bareAst.unboundCount, bareInlineUnboundSites: bareAst.unbound, inlineLocalsOfSameName: bareAst.localOfSameName, scopeAssignSites: Object.keys(staticUse).reduce((a, n) => { a[n] = staticUse[n].scopeAssign; return a; }, {}), scopeReadLines: Object.keys(staticUse).reduce((a, n) => { a[n] = staticUse[n].scopeRead; return a; }, {}), defineSites: Object.keys(staticUse).reduce((a, n) => { a[n] = staticUse[n].define; return a; }, {}),
        note: 'bareInlineUnbound = 작업 index.html 인라인 IIFE 를 문법 분석해, 옮긴 이름이 선언 없이 식별자 참조로 나오는 자리 수(0 이어야 한다 — 남아 있으면 실행 때 ReferenceError). scopeAssignSites · scopeReadLines · defineSites = 저장소 js/** 와 인라인에서 그 이름이 통로 대입(L.이름 = …) · 통로 읽기(L.이름) · 기관 define 줄로 나오는 자리(글자 검색)' },
      registryCompare: { ok: cW.ok, counts: cW.counts, scopeLost: cW.namesFrom ? cW.namesFrom.scopeLost : null, scopeAdded: cW.namesFrom ? cW.namesFrom.scopeAdded : null, differingScope: fpd('scope'), differingWindow: fpd('window'), differingScopeBeyondFunctionName: fpd('scope').filter(n => !fnNameOnly(cB.fingerprints.scope[n], cW.fingerprints.scope[n])), differingWindowBeyondFunctionName: fpd('window').filter(n => !fnNameOnly(cB.fingerprints.window[n], cW.fingerprints.window[n])), differingDetail: ['scope', 'window'].reduce((a, k) => { a[k] = fpd(k).map(n => ({ name: n, base: cB.fingerprints[k][n], work: cW.fingerprints[k][n] })); return a; }, {}), exceptions: cW.guestBoot.exceptions.length, consoleErrors: cW.guestBoot.consoleErrors.length, note: '등록 기관 대조 탐침을 기준 트리의 이름 목록으로 작업 트리에 돌린 결과 — 통로에서 사라진 이름 0. 이름별 값 지문은 함수 이름 칸만 다른 이름(differingScope · differingWindow)과 그 밖(…BeyondFunctionName)으로 갈랐다(본질 변동 이름 제외)' },
      scenarios: { rows: scRows, allPassedBoth: scRows.length > 0 && scRows.every(r => r.basePassed && r.workPassed && !r.workExceptions) },
      moduleLoad: { regressions: mlCmp.regressions.length, insufficient: mlCmp.insufficient.length, insufficientNote: mlCmp.insufficient.map(i => i.file + ': ' + i.note) },
      npmTest: { base: { exitCode: nb.exit, okLines: nb.ok, okDotLines: nb.okDot, failLines: nb.fail }, work: { exitCode: nw.exit, okLines: nw.ok, okDotLines: nw.okDot, failLines: nw.fail }, same: npmCmp.same, onlyBase: onlyBase.length, onlyWork: onlyWork.length, retired: 0 },
      testsEach,
      remaining: remaining.totals,
      finalizeGap: { generatorSays: gap.generator.message, before: gapB.totals, after: gap.totals, byKindBeforeAfter: gapKinds }
    },
    limits: ["법정 판정이 아니다.","상태 객체 탐침과 상태 탐침은 게스트로 띄운 임시 브라우저의 페이지 안 평가다. 통째로 다시 대입한 값과 달았던 속성은 재고 나서 되돌렸다.","앱 상태 객체를 통째로 다시 대입하는 세포 자리(`if(!L.state) L.state = {};` 두 곳)는 상태가 비어 있을 때만 도는 줄이라 화면 조작으로는 닿지 않았다 — 통로에 직접 대입하는 왕복으로만 쟀다.","프롬프트 백과사전 서랍은 목표 상세 화면에 그려진다(게스트에게 목표가 없어 화면 시나리오로 닿지 않았다). 그 값을 읽는 그리기 함수와 쓰는 단추 처리기를 페이지 안에서 직접 불러 쟀다.","화면 시나리오가 닿는 범위는 게스트의 탭 전환 · 전문 템플릿 기록의 저장·다시 열기·수정 저장·새로 고침 뒤 유지 · 일정 연동 저장 · 행 지우고 저장 · 예시 모임 목록과 상세까지다. 로그인 뒤 화면은 재지 못했다(측정불가).","값 요약이 같다는 것은 같은 종류·길이·해시의 값이 같은 종류의 접근자로 통로에 있다는 뜻이며, 모든 동작의 보존을 뜻하지 않는다."],
    commands };
  wj('measurement.json', out);
  const s = out.summary;
  console.log(JSON.stringify({ files: s.changed.files, onlyIndex: s.changed.onlyIndexHtml, index: s.changed.indexHtml, tests: s.changed.testsChanged.length, vault: s.changed.vaultChanged.length, gen: s.changed.generatorChanged.length, organ: s.changed.organChanged.length, moved: s.moved, replay: [s.replay.rebuiltEqualsWork, s.replay.firstDiff, s.replay.problems.length], kinds: [s.kindsOnly.deletedOutsideListedKinds.length, s.kindsOnly.exposePropsNotTrivialAccessorOfProofName.length, s.kindsOnly.exposeShellsNotShell.length, s.kindsOnly.namesOutsideProof.length, s.kindsOnly.editedLinesEqualExpected, s.kindsOnly.everyNameHasOneDeclaration, s.kindsOnly.everyNameHadAccessor],
    inline: s.inlineScriptLines, baseline: s.baseline, guard: s.guard, probe: { intrinsic: s.stateProbe.intrinsicVariance, differing: s.stateProbe.differingCount, nameOnly: s.stateProbe.differingFunctionNameOnly, beyond: s.stateProbe.differingBeyondFunctionName, organ: [s.stateProbe.organNames, s.stateProbe.organMatchesProof], writable: s.stateProbe.writable, win: s.stateProbe.windowCopy, boot: s.stateProbe.bootOk, exc: s.stateProbe.exceptions, capture: s.stateProbe.captureCount.same, transitions: s.stateProbe.transitions },
    stateObject: { boot: s.stateObject.bootOk, exc: s.stateObject.exceptions, repeat: s.stateObject.baseRepeatSame, same: s.stateObject.sameAsBaseExceptOwner, state: [s.stateObject.state.apiByGenerator, s.stateObject.state.accessor, s.stateObject.state.owner, s.stateObject.state.keys, s.stateObject.state.sameObjectEverywhereWork, s.stateObject.state.reassignWorkOk, s.stateObject.state.inPlaceWorkOk, s.stateObject.state.afterGoalsTabWorkAllGoals, s.stateObject.state.scopeAssignSites, s.stateObject.state.scopeReadLines], prompt: [s.stateObject.promptOpen.apiByGenerator, s.stateObject.promptOpen.accessor, s.stateObject.promptOpen.value, s.stateObject.promptOpen.workOk, s.stateObject.promptOpen.scopeAssignSites], init: s.stateObject.initText },
    usage: { bareInlineUnbound: s.usage.bareInlineUnbound, sites: s.usage.bareInlineUnboundSites, locals: s.usage.inlineLocalsOfSameName, assign: s.usage.scopeAssignSites, reads: s.usage.scopeReadLines },
    registry: { ok: s.registryCompare.ok, mism: s.registryCompare.counts && s.registryCompare.counts.mismatches, lost: s.registryCompare.scopeLost, dScope: s.registryCompare.differingScope, dWin: s.registryCompare.differingWindow, beyond: [s.registryCompare.differingScopeBeyondFunctionName, s.registryCompare.differingWindowBeyondFunctionName] }, scenarios: s.scenarios, ml: s.moduleLoad, npm: s.npmTest, each: { same: s.testsEach.sameAsBase, failed: [s.testsEach.failedBase, s.testsEach.failedWork], onlyWork: s.testsEach.onlyWork }, remaining: s.remaining, gap: s.finalizeGap }, null, 1));
  process.exit(0);
}

// ───────────────────────── claims ─────────────────────────
if (CMD === 'claims') {
  const REQ = opt('--req'), m = rj('measurement.json').summary, rem = rj('remaining-state.json');
  const M = REL + 'measurement.json', scDir = path.join(DIR, 'scenarios');
  const claims = []; let n = 0;
  const add = c => { c.id = 'C' + (++n); claims.push(c); };
  const jp = (req, statement, file, p, equals, more) => add({ req, kind: 'static', domain: 'config', statement, touches: [file].concat(more || []), check: { type: 'jsonPath', file, path: p, equals } });
  for (const f of fs.readdirSync(scDir).filter(x => /\.json$/.test(x)).sort()) { const sc = JSON.parse(fs.readFileSync(path.join(scDir, f), 'utf8')); add({ req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior', statement: sc.title + ' — 상태 이전 전과 같다. index.html 은 생성기 설정(proof.json)을 기준 커밋에서 다시 돌린 결과와 바이트 단위로 같다.', touches: ['index.html'], scenario: 'scenarios/' + f, proof: 'proof.json' }); }
  jp('R2', '옮긴 이름을 포함해 통로에 노출된 상태 이름 전부의 통로 값 요약 · 접근자 종류 · window 복사의 동일성 · 쓰기 왕복이 기준과 다른 이름이 0 개다(기준을 두 번 재도 달라지는 이름은 뺀다).', M, 'summary.stateProbe.differingCount', 0, [REL + 'state-probe.work.json']);
  jp('R2', '기준을 두 번 재도 값 요약이 달라지는 이름 목록(비교에서 뺀 것).', M, 'summary.stateProbe.intrinsicVariance', m.stateProbe.intrinsicVariance);
  jp('R2', '작업 트리에서 상태 기관이 맡은 이름과 종류(읽기 전용·읽기쓰기)·주인 표시가 설정(proof.json)의 이름과 같다.', M, 'summary.stateProbe.organMatchesProof', true);
  jp('R2', '쓰기 가능한 이름의 쓰기 왕복이 작업 트리에서 전부 된다(기준과 같은 수).', M, 'summary.stateProbe.writable.work.roundtripOk', m.stateProbe.writable.base.roundtripOk);
  jp('R2', '게스트 부팅 뒤 작업 트리의 예외가 0 건이다.', M, 'summary.stateProbe.exceptions.work', 0);
  jp('R2', '등록 기관 대조 탐침(기준 트리 이름 목록 고정): 통로에서 사라진 이름이 없다.', M, 'summary.registryCompare.scopeLost', []);
  jp('R2', '등록 기관 대조 탐침: 이름별 통로 값 지문이 기준과 다른 이름 목록(본질 변동 이름 제외).', M, 'summary.registryCompare.differingScope', m.registryCompare.differingScope);
  jp('R2', '등록 기관 대조 탐침: 이름별 window 값 지문이 기준과 다른 이름 목록(본질 변동 이름 제외).', M, 'summary.registryCompare.differingWindow', m.registryCompare.differingWindow);
  jp('R2', '작업 index.html 인라인 IIFE 에 옮긴 이름이 선언 없이 식별자 참조로 남은 자리가 0 곳이다(문법 분석 — 읽고 쓰는 곳은 전부 통로 L. 을 거친다).', M, 'summary.usage.bareInlineUnbound', 0);
  jp('R6', '상태 객체 탐침: 주인 표시·기관 종류를 가리면 기준과 작업의 기록이 통째로 같다.', M, 'summary.stateObject.sameAsBaseExceptOwner', true, [REL + 'state-object-probe.base.json', REL + 'state-object-probe.work.json', REL + 'tools/state-object-probe.cjs']);
  jp('R6', '상태 객체 탐침을 기준에서 두 번 돌린 기록이 서로 같다(본질 변동 없음).', M, 'summary.stateObject.baseRepeatSame', true, [REL + 'state-object-probe.base2.json']);
  jp('R6', '앱 상태 객체(state)의 통로 접근자 종류(기준 · 작업) — 원래 마지막 노출 줄이 get+set 이라 생성기가 defineVar 로 옮겼다.', M, 'summary.stateObject.state.accessor', ['get+set', 'get+set']);
  jp('R6', '생성기가 state 에 고른 기관 함수.', M, 'summary.stateObject.state.apiByGenerator', 'defineVar', [REL + 'unstate-meta.json']);
  jp('R6', '작업 트리에서 통로의 state · window.state · 템플릿 부품 초기화가 받은 getState() 가 같은 객체다.', M, 'summary.stateObject.state.sameObjectEverywhereWork', true);
  jp('R6', '작업 트리에서 state 의 제자리 변경이 window.state 와 getState() 로 보인다.', M, 'summary.stateObject.state.inPlaceWorkOk', true);
  jp('R6', '작업 트리에서 state 를 통째로 다시 대입하면 통로와 getState() 가 새 객체를 돌려주고 window.state 는 예전 객체 그대로이며(기준과 같은 동작) 되돌림이 된다.', M, 'summary.stateObject.state.reassignWorkOk', true);
  jp('R6', '작업 트리에서 목표 탭을 누른 뒤 통로 · window · getState() 의 activeTab 이 모두 goals 다(화면 조작이 같은 객체를 바꾼다).', M, 'summary.stateObject.state.afterGoalsTabWorkAllGoals', true);
  jp('R6', 'state 의 열쇠 수(기준 · 작업).', M, 'summary.stateObject.state.keys', m.stateObject.state.keys);
  jp('R6', '저장소에서 state 를 통로로 통째 대입하는 자리 목록(전부 L.state = … 꼴).', M, 'summary.stateObject.state.scopeAssignSites', m.stateObject.state.scopeAssignSites);
  jp('R7', '프롬프트 서랍 접힘 값(_promptEncyclopediaOpen)의 통로 접근자 종류(기준 · 작업).', M, 'summary.stateObject.promptOpen.accessor', ['get+set', 'get+set']);
  jp('R7', '그 값의 처음 값(기준 · 작업).', M, 'summary.stateObject.promptOpen.value', [false, false]);
  jp('R7', '작업 트리에서 그 값을 읽는 그리기 함수가 거짓이면 서랍을 접힌 꼴로, 참이면 펼친 꼴로 그리고, 머리 줄 단추 처리기가 값을 뒤집으며, 쓰기 왕복과 되돌림이 된다.', M, 'summary.stateObject.promptOpen.workOk', true);
  jp('R7', '생성기가 그 이름에 고른 기관 함수.', M, 'summary.stateObject.promptOpen.apiByGenerator', 'defineVar');
  jp('R7', '두 이름 모두 초기값 글자가 기준 선언 줄의 것과 바이트 단위로 같다(선언 머리와 끝만 바뀌었다).', M, 'summary.stateObject.initTextAllByteIdentical', true);
  jp('R3', '바뀐 제품 파일은 index.html 하나다.', M, 'summary.changed.onlyIndexHtml', true);
  jp('R3', '되짚기: 기준 index.html 에 생성기 기록(지운 줄 · 쉼표 · 선언 머리와 끝 · window 복사 오른쪽)을 적용한 결과가 작업 index.html 과 글자 그대로 같다.', M, 'summary.replay.rebuiltEqualsWork', true, [REL + 'unstate-meta.json']);
  jp('R3', '지운 줄 가운데 대상 이름의 expose 속성 줄·빈 expose 문 껍데기 밖의 줄이 없다.', M, 'summary.kindsOnly.deletedOutsideListedKinds', []);
  jp('R3', '지운 expose 속성 줄은 전부 설정에 있는 이름의 `return X;`·`X = v;` 꼴이다.', M, 'summary.kindsOnly.exposePropsNotTrivialAccessorOfProofName', []);
  jp('R3', '설정(names) 밖의 이름을 건드린 기록이 없다.', M, 'summary.kindsOnly.namesOutsideProof', []);
  jp('R3', '바뀐 줄은 선언 머리 · 선언 끝 · window 복사 줄뿐이다(생성기 기록의 바뀐 줄 번호와 같다).', M, 'summary.kindsOnly.editedLinesEqualExpected', true);
  jp('R4', '인라인 스크립트 줄 수가 줄었다.', M, 'summary.inlineScriptLines.decreased', true);
  jp('R4', '줄어든 인라인 줄 수가 생성기가 지운 줄 수와 같다.', M, 'summary.inlineScriptLines.equalsDeletedLines', true);
  jp('R4', 'docs/architecture/module-baseline.json 의 마지막 기록 inlineScriptLines 가 작업 트리 측정값과 같다(module-guard --update 로 기록).', M, 'summary.baseline.recordedEqualsMeasured', true, ['docs/architecture/module-baseline.json']);
  jp('R4', '모듈 로드 탐침의 새 회귀가 없다.', REL + 'module-load.json', 'regressions', []);
  jp('R4', 'npm test 를 기준 트리와 작업 트리에서 전경으로 끝까지 돌려 종료 코드 0 이고 검사 줄·요약이 같다(폐기 0).', M, 'summary.npmTest.same', true);
  jp('R4', 'npm test 의 스크립트와 tests/*.test.js 를 하나씩 따로 돌린 결과(실패 집합·꼬리 글자)가 기준과 같다.', M, 'summary.testsEach.sameAsBase', true);
  jp('R4', '무결성 게이트 종료 코드가 0 이다.', M, 'summary.guard.integrityGateExitCode', 0);
  jp('R4', 'tests/ 아래 바뀐 파일이 없다.', M, 'summary.changed.testsChanged', []);
  jp('R4', '금고(court/** 등) 아래 바뀐 파일이 없다.', M, 'summary.changed.vaultChanged', []);
  jp('R4', '생성기 변경이 없다.', M, 'summary.changed.generatorChanged', []);
  jp('R4', '상태 기관 · 통로 파일 변경이 없다.', M, 'summary.changed.organChanged', []);
  jp('R5', 'finalize 전제를 막는 최상위 문 수(이 PR 을 반영한 index.html — 생성기 finalize 가 임시 사본에서 낸 수와 같다).', REL + 'finalize-gap.json', 'totals.blockingStatements', rj('finalize-gap.json').totals.blockingStatements);
  jp('R5', '그 문들이 차지하는 줄 수.', REL + 'finalize-gap.json', 'totals.blockingLines', rj('finalize-gap.json').totals.blockingLines);
  jp('R5', '남은 상태 이름 보고 파일: 옮긴 이름 수.', REL + 'remaining-state.json', 'totals.moved', rem.totals.moved, [REL + 'unstate-run.cjs']);
  jp('R5', '남은 상태 이름 보고 파일: 생성기가 멈춘 이름 수.', REL + 'remaining-state.json', 'totals.stoppedByGenerator', rem.totals.stoppedByGenerator);
  jp('R5', '남은 상태 이름 보고 파일: 통로에 노출되지 않은 이름 수.', REL + 'remaining-state.json', 'totals.notExposed', rem.totals.notExposed);
  jp('R5', '남은 상태 이름 보고 파일: 무결성 게이트가 선언 글자를 붙잡아 뺀 이름 수.', REL + 'remaining-state.json', 'totals.excludedBecauseGatePinsStateText', rem.totals.excludedBecauseGatePinsStateText);
  jp('R5', '남은 상태 이름 보고 파일: IIFE 에 남은 상태 이름 수.', REL + 'remaining-state.json', 'totals.stateNamesLeftInIife', rem.totals.stateNamesLeftInIife);
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  for (const c of claims) { if (c.kind !== 'static') continue; const v = getPath(JSON.parse(fs.readFileSync(path.join(ROOT, c.check.file), 'utf8')), c.check.path); if (JSON.stringify(v) !== JSON.stringify(c.check.equals)) { console.error(c.id + ' 값 불일치: ' + c.check.path + ' = ' + JSON.stringify(v) + ' (기대 ' + JSON.stringify(c.check.equals) + ')'); process.exit(1); } }
  const mv = m.moved;
  wj('claims.json', { task: TASK, requirementsSource: REQ, requirements: [
    { id: 'R1', text: 'index.html 인라인 IIFE 에서 통로에 노출된 상태 이름 ' + mv.names + '개의 소유를 상태 기관(js/core/app-state.js)으로 옮긴다(생성기 unstate — getter/setter 줄 삭제 · 선언문을 define/defineVar 로 바꿔 쓰기 · window 복사 줄 오른쪽 바꿔 쓰기). 앱 동작은 그대로다.' },
    { id: 'R2', text: '옮긴 이름은 상태 기관이 같은 값·같은 종류의 접근자로 통로에 내준다: 이름별 통로 값 요약 · 접근자 종류 · 쓰기 왕복 · window 복사의 동일성이 기준과 같고, 통로에서 사라진 이름이 없다.' },
    { id: 'R3', text: '지우고 바꿔 쓰는 대상은 닫힌 목록 X4·X5·X6 의 줄뿐이고 names 밖 이름·함수 본문·그 밖의 글자는 바꾸지 않는다. 바뀐 제품 파일은 index.html 하나다.' },
    { id: 'R4', text: '증명 하한(설계 4절): 인라인 줄 수 감소와 기준선 기록 · 모듈 로드 새 회귀 0 · npm test 검사 수 동일·폐기 0 · 무결성 게이트 통과 · tests/·금고·생성기·상태 기관 변경 0.' },
    { id: 'R5', text: '이 PR 을 반영한 index.html 에 남은 상태 이름을 풀리는 조건별로 다시 재서 보고 파일로 남긴다.' },
    { id: 'R6', text: '앱 상태 객체(state)는 원래 노출 줄과 같은 종류의 접근자(읽기쓰기)로 통로에 있고, 통로 · window.state · 템플릿 부품 초기화의 getState() 가 같은 객체를 받는다. 통째로 다시 대입하는 쓰기 왕복이 기준과 같다.' },
    { id: 'R7', text: '프롬프트 서랍 접힘 값(_promptEncyclopediaOpen)은 초기값 false 그대로 읽기쓰기로 통로에 있고, 그 값을 읽고 쓰는 세포 함수가 기준과 같이 돈다. 무결성 게이트가 통과한다.' } ],
    outOfScopeReports: [
      { text: '게스트 화면에서 숨겨져 누를 수 없는 진입로와 로그인 뒤 화면의 동작은 화면 시나리오로 재지 못했다. 상태 이름 전수는 탐침의 값 요약 · 접근자 종류 · 쓰기 왕복(작업자 측정)으로 쟀고, 법정이 그것을 다시 재는 것은 아니다.', cannotBecause: 'out-of-scope-feature' },
      { text: '프롬프트 백과사전 서랍은 목표 상세 화면에 그려져 게스트(목표 없음)의 화면 시나리오로 닿지 않았다. 그 값을 읽는 그리기 함수와 쓰는 단추 처리기를 페이지 안에서 직접 불러 쟀다(작업자 측정).' },
      { text: '앱 상태 객체를 통째로 다시 대입하는 세포 자리(상태가 비어 있을 때만 도는 줄)는 화면 조작으로 닿지 않았다. 통로에 직접 대입하는 왕복으로 쟀다.' },
      { text: '기록 저장 시나리오 셋(q1 · q2 · q3)은 게스트가 이 브라우저 안에 기록을 저장하는 조작이다(서버 연결 객체가 null 이라 서버로 가지 않는다). #949 의 시나리오를 그대로 가져왔다.' },
      { text: '이 PR 로 새로 생긴 상태 기관 정의 줄 둘(state · _promptEncyclopediaOpen)의 구역 이전, 서버 주소·공개 키 선언과 sb 정의 줄은 이 PR 에 없다. reports/' + TASK + '/remaining-state.json · finalize-gap.json 에 적었다.', cannotBecause: 'out-of-scope-feature' } ],
    claims });
  console.log('claims', claims.length, '· behavior', claims.filter(c => c.kind === 'behavior').length);
  process.exit(0);
}
