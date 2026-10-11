#!/usr/bin/env node
'use strict';
// 상태 이전 실행기 (#TASK-ES-673 — reports/TASK-ES-649/unstate-run.cjs 를 본떴다 · docs/architecture/CELL-REGISTRY-DESIGN.md 3.3절 · 5.5절) — 작업자 도구, 판정 아님.
// 649 판과 다른 점: measure 가 사진 첨부 경로 탐침 대신 손잡이 탐침(tools/handle-probe.cjs — 서버 연결 객체 · 공유 함수 · 모임 목록 · 닫기 단추, 기준 2회 · 작업, 가짜 연결 라이브러리 방식 포함)과
//   공유 함수 정적 검사(tools/name-readers-scan.cjs)를 돌리고, 상태 탐침·대조 탐침의 차이를 「함수 이름 칸만 다른 것」과 「그 밖」으로 가른다. claims 가 그 결과를 주장에 넣는다.
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
//   node reports/TASK-ES-673/unstate-run.cjs apply   <작업 트리> --task TASK-ES-673 [--exclude reports/TASK-ES-636/pinned-state.exclude.json] [--label "…"]
//   node reports/TASK-ES-673/unstate-run.cjs measure <작업 트리> --task TASK-ES-673 --base <기준 트리>
//       먼저: reports/<TASK>/raw/npm-test.{base,work}.{log,exit} · tests-{base,work}.json(reports/TASK-ES-614/run-tests-each.cjs) · reports/<TASK>/scenarios/*.json
//   node reports/TASK-ES-673/unstate-run.cjs claims  <작업 트리> --task TASK-ES-673 --req docs/specs/REQ-….md
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
  const proof = { task: TASK, label: opt('--label', '상태 이전 3차 — 통로에 노출된 상태 이름 ' + names.length + '개의 소유를 상태 기관(js/core/app-state.js)으로'), slot: 'HO', mode: 'unstate', cells: [{ file: ORGAN }], unstate: { names } };
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
  // 손잡이 탐침(기준 2회 · 작업): 서버 연결 객체 · 공유 함수 · 모임 목록 · 닫기 단추를 페이지 안에서 더 잰다. 가짜 연결 라이브러리 방식도 같은 세 번.
  const hp = path.join(DIR, 'tools', 'handle-probe.cjs');
  for (const [tree, out, fake] of [[BASE, 'handle-probe.base.json'], [BASE, 'handle-probe.base2.json'], [ROOT, 'handle-probe.work.json'], [BASE, 'handle-probe-fake.base.json', 1], [BASE, 'handle-probe-fake.base2.json', 1], [ROOT, 'handle-probe-fake.work.json', 1]]) run('handle-probe ' + out, [process.execPath, hp, tree, path.join(DIR, out)].concat(fake ? ['--fake-client'] : []));
  const hB = rj('handle-probe.base.json'), hB2 = rj('handle-probe.base2.json'), hW = rj('handle-probe.work.json'), kB = rj('handle-probe-fake.base.json'), kB2 = rj('handle-probe-fake.base2.json'), kW = rj('handle-probe-fake.work.json');
  // 이전으로 바뀌는 것이 당연한 칸(주인 표시 · 기관 종류 · 기관이 맡은 이름 수)과 함수 이름 칸을 가린 뒤 통째로 맞댄다
  const mask = r => JSON.parse(JSON.stringify(r, (k, v) => (k === 'owner' || k === 'organKind' || k === 'organNames' || k === 'nameSeenAtAssign') ? undefined : (k === 'functionsTrapped' && Array.isArray(v)) ? v.map(x => ({ length: x.length, isScopeFunction: x.isScopeFunction })) : v));
  const sameMasked = (a, b) => !!a.result && !!b.result && JSON.stringify(mask(a.result)) === JSON.stringify(mask(b.result));
  const sameExc = (a, b) => JSON.stringify(a.boot.exceptions) === JSON.stringify(b.boot.exceptions);
  // 공유 함수 정적 검사(기준 · 작업)
  const ns = path.join(DIR, 'tools', 'name-readers-scan.cjs');
  run('name-readers-scan base', [process.execPath, ns, BASE, path.join(DIR, 'name-readers.base.json')]);
  run('name-readers-scan work', [process.execPath, ns, ROOT, path.join(DIR, 'name-readers.work.json')]);
  const nB = rj('name-readers.base.json'), nW = rj('name-readers.work.json');
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
      { condition: '통로에 노출되지 않음(IIFE 안에서만 쓰는 값)', unlock: '상태 기관 대상이 아니다(통로로 읽는 세포가 없다). 그 값을 쓰는 문과 함께 구역 감싸기(region, X7)로 세포 함수의 지역 변수가 되거나, 그 문이 옮겨질 때 같이 옮긴다', names: meta.notExposed }
    ].map(x => Object.assign({ count: x.names.length }, x)),
    stoppedDetail: stoppedRows.map(r => ({ name: r.name, condition: r.label, generatorReason: r.reason })) };
  wj('remaining-state.json', remaining);

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
      handles: (() => { const HB = hB.result || {}, H = hW.result || {}, KB = kB.result || {}, K = kW.result || {}, two = (o, p, k) => [((o || {})[p] || {})[k], undefined].slice(0, 1)[0];
        const pair = (p, k) => [two(HB, p, k), two(H, p, k)], fk = (K.sb || {}).fake || null, fkB = (KB.sb || {}).fake || null;
        return { bootOk: { base: hB.boot.ok, base2: hB2.boot.ok, work: hW.boot.ok, fakeBase: kB.boot.ok, fakeWork: kW.boot.ok }, exceptions: { base: hB.boot.exceptions.length, work: hW.boot.exceptions.length, sameText: sameExc(hB, hW), fakeBase: kB.boot.exceptions.length, fakeWork: kW.boot.exceptions.length, fakeSameText: sameExc(kB, kW) },
          baseRepeatSame: JSON.stringify(hB.result) === JSON.stringify(hB2.result), sameAsBaseExceptOwnerAndFunctionName: sameMasked(hB, hW),
          sb: { apiByGenerator: meta.api.sb || null, accessor: pair('sb', 'accessor'), valueKind: pair('sb', 'valueKind'), owner: pair('sb', 'owner'), organKind: two(H, 'sb', 'organKind'), strictWrite: pair('sb', 'write'), strictWriteSame: JSON.stringify(two(HB, 'sb', 'write')) === JSON.stringify(two(H, 'sb', 'write')), partInitGotScopeSb: pair('sb', 'partInitGotScopeSb'), windowHas: pair('sb', 'windowHas'),
            accessorIsGetOnlyBoth: two(HB, 'sb', 'accessor') === 'get' && two(H, 'sb', 'accessor') === 'get', scopeReadLines: (staticUseOf('sb') || {}).scopeRead, scopeAssignSites: (staticUseOf('sb') || {}).scopeAssign },
          fakeClient: { baseRepeatSame: JSON.stringify(kB.result) === JSON.stringify(kB2.result), sameAsBaseExceptOwnerAndFunctionName: sameMasked(kB, kW), base: fkB, work: fk, valueKind: [two(KB, 'sb', 'valueKind'), two(K, 'sb', 'valueKind')],
            workOneCreateCallSameObjectEverywhere: !!fk && fk.createCalls.length === 1 && fk.scopeIsFakeClient === true && fk.windowIsFakeClient === true && fk.partInitGotFakeClient === true, topLevelReadsSame: !!fk && !!fkB && JSON.stringify(fk.topLevelReads) === JSON.stringify(fkB.topLevelReads),
            note: '페이지가 뜨기 전에 가짜 연결 라이브러리(window.supabase.createClient 가 기록용 대역 객체를 돌려줌)를 심어, 연결 객체가 null 이 아닐 때 같은 객체가 통로 · window.sb · 템플릿 부품 초기화에 닿는지와 그 객체의 맨 위 속성을 읽은 횟수를 기준과 작업에서 맞댄 것. 진짜 서버가 아니다' },
          shareContent: { apiByGenerator: meta.api.shareContent || null, nameAtAssign: pair('shareContent', 'nameSeenAtAssign'), length: pair('shareContent', 'length'), sourceHash: pair('shareContent', 'sourceHash'), sourceHashSame: two(HB, 'shareContent', 'sourceHash') === two(H, 'shareContent', 'sourceHash') && two(HB, 'shareContent', 'length') === two(H, 'shareContent', 'length'),
            trapped: pair('shareContent', 'trapped'), windowSame: pair('shareContent', 'windowSame'), nameReads: { base: two(HB, 'shareContent', 'nameReadsAfterCalls'), work: two(H, 'shareContent', 'nameReadsAfterCalls'), fakeBase: two(KB, 'shareContent', 'nameReadsAfterCalls'), fakeWork: two(K, 'shareContent', 'nameReadsAfterCalls') },
            nameReadsTotal: [two(HB, 'shareContent', 'nameReadsAfterCalls'), two(H, 'shareContent', 'nameReadsAfterCalls'), two(KB, 'shareContent', 'nameReadsAfterCalls'), two(K, 'shareContent', 'nameReadsAfterCalls')].reduce((a, v) => (typeof v === 'number' && a !== null ? a + v : null), 0),
            forward: { base: two(HB, 'shareContent', 'forward'), work: two(H, 'shareContent', 'forward') }, forwardSame: JSON.stringify(two(HB, 'shareContent', 'forward')) === JSON.stringify(two(H, 'shareContent', 'forward')),
            forwardWorkOk: (() => { const fw = two(H, 'shareContent', 'forward') || {}, a = fw.viaScope || {}, b = fw.viaWindow || {}, m = fw.marketPreviewShare || {}; return a.sameOptsObject === true && a.returnsEngineResult === true && a.thisIsEngine === true && b.sameOptsObject === true && b.returnsEngineResult === true && m.engineCallsByClick === 1 && m.optsType === 'template' && m.optsIdIsTemplateKey === true && (fw.noEngine || {}).returnsPromise === true && fw.restored === true && fw.engineRestored === true; })(),
            staticScan: { filesScanned: [nB.filesScanned, nW.filesScanned], byKind: { base: nB.byKind, work: nW.byKind }, propertyReads: [nB.propertyReads.length, nW.propertyReads.length], sensitivePropertyReads: [nB.sensitivePropertyReads, nW.sensitivePropertyReads], valueEscapesOutsideEngineFile: [nB.valueEscapesOutsideEngineFile, nW.valueEscapesOutsideEngineFile], valueEscapes: { base: nB.valueEscapes, work: nW.valueEscapes }, wholeObjectEnumerations: [nB.wholeObjectEnumerations.length, nW.wholeObjectEnumerations.length], parseErrors: [nB.parseErrors.length, nW.parseErrors.length] },
            note: '공유 함수의 name 은 선언문이 define(…) 의 인자가 되면서 \'shareContent\' 에서 \'\' 로 바뀐다(인자 수·본문 글자 해시는 같다). 그 name 을 읽는 순간을 잡는 덫에 걸린 읽기 횟수(부팅 · 여섯 탭 · 대역 엔진으로 부른 호출 · 장터 미리보기 공유 단추)와, 저장소 제품 코드에서 그 함수 객체가 쓰이는 자리의 정적 분류' },
          MOCK_GROUPS: { apiByGenerator: meta.api.MOCK_GROUPS || null, base: mask(HB.MOCK_GROUPS || {}), work: mask(H.MOCK_GROUPS || {}), same: JSON.stringify(mask(HB.MOCK_GROUPS || {})) === JSON.stringify(mask(H.MOCK_GROUPS || {})), owner: pair('MOCK_GROUPS', 'owner') },
          btnAvLvClose: { apiByGenerator: meta.api.btnAvLvClose || null, base: mask(HB.btnAvLvClose || {}), work: mask(H.btnAvLvClose || {}), same: JSON.stringify(mask(HB.btnAvLvClose || {})) === JSON.stringify(mask(H.btnAvLvClose || {})), owner: pair('btnAvLvClose', 'owner'), closeWiringWorks: JSON.stringify((H.btnAvLvClose || {}).closeWiring) === JSON.stringify({ displayAfterOpen: 'flex', displayAfterClick: 'none' }) },
          vars: { base: mask(HB.vars || {}), work: mask(H.vars || {}), same: JSON.stringify(mask(HB.vars || {})) === JSON.stringify(mask(H.vars || {})) } }; })(),
      usage: { bareInlineUnbound: bareAst.unboundCount, bareInlineUnboundSites: bareAst.unbound, inlineLocalsOfSameName: bareAst.localOfSameName, scopeAssignSites: Object.keys(staticUse).reduce((a, n) => { a[n] = staticUse[n].scopeAssign; return a; }, {}), scopeReadLines: Object.keys(staticUse).reduce((a, n) => { a[n] = staticUse[n].scopeRead; return a; }, {}), defineSites: Object.keys(staticUse).reduce((a, n) => { a[n] = staticUse[n].define; return a; }, {}),
        note: 'bareInlineUnbound = 작업 index.html 인라인 IIFE 를 문법 분석해, 옮긴 이름이 선언 없이 식별자 참조로 나오는 자리 수(0 이어야 한다 — 남아 있으면 실행 때 ReferenceError). scopeAssignSites · scopeReadLines · defineSites = 저장소 js/** 와 인라인에서 그 이름이 통로 대입(L.이름 = …) · 통로 읽기(L.이름) · 기관 define 줄로 나오는 자리(글자 검색)' },
      registryCompare: { ok: cW.ok, counts: cW.counts, scopeLost: cW.namesFrom ? cW.namesFrom.scopeLost : null, scopeAdded: cW.namesFrom ? cW.namesFrom.scopeAdded : null, differingScope: fpd('scope'), differingWindow: fpd('window'), differingScopeBeyondFunctionName: fpd('scope').filter(n => !fnNameOnly(cB.fingerprints.scope[n], cW.fingerprints.scope[n])), differingWindowBeyondFunctionName: fpd('window').filter(n => !fnNameOnly(cB.fingerprints.window[n], cW.fingerprints.window[n])), differingDetail: ['scope', 'window'].reduce((a, k) => { a[k] = fpd(k).map(n => ({ name: n, base: cB.fingerprints[k][n], work: cW.fingerprints[k][n] })); return a; }, {}), exceptions: cW.guestBoot.exceptions.length, consoleErrors: cW.guestBoot.consoleErrors.length, note: '등록 기관 대조 탐침을 기준 트리의 이름 목록으로 작업 트리에 돌린 결과 — 통로에서 사라진 이름 0. 이름별 값 지문은 함수 이름 칸만 다른 이름(differingScope · differingWindow)과 그 밖(…BeyondFunctionName)으로 갈랐다(본질 변동 이름 제외)' },
      scenarios: { rows: scRows, allPassedBoth: scRows.length > 0 && scRows.every(r => r.basePassed && r.workPassed && !r.workExceptions) },
      moduleLoad: { regressions: mlCmp.regressions.length, insufficient: mlCmp.insufficient.length, insufficientNote: mlCmp.insufficient.map(i => i.file + ': ' + i.note) },
      npmTest: { base: { exitCode: nb.exit, okLines: nb.ok, okDotLines: nb.okDot, failLines: nb.fail }, work: { exitCode: nw.exit, okLines: nw.ok, okDotLines: nw.okDot, failLines: nw.fail }, same: npmCmp.same, onlyBase: onlyBase.length, onlyWork: onlyWork.length, retired: 0 },
      testsEach,
      remaining: remaining.totals
    },
    limits: ["법정 판정이 아니다.","서버 연결 객체(sb)는 법정·작업자 PC 의 브라우저에서 null 이다(외부 통신이 막혀 연결 라이브러리가 뜨지 않는다 — 기준·작업 동일). 진짜 서버에 붙은 연결 객체로 도는 화면(로그인 · 서버 피드 · 실시간 구독 · 저장)은 재지 못했다(측정불가). 가짜 연결 라이브러리 방식은 「null 이 아닌 값이 같은 길로 닿는가」만 보여 준다.","공유 함수의 name 이 'shareContent' 에서 '' 로 바뀐다. 그 name 을 읽는 코드는 정적 검사와 덫으로 0 건이었으나, 덫이 본 범위는 게스트 부팅 · 여섯 탭 · 대역 엔진 호출 · 장터 미리보기 공유 단추까지다. 브라우저 개발자 도구의 호출 스택 표시는 달라진다(사람이 보는 표시 — 재지 않았다).","화면 시나리오가 닿는 범위는 게스트의 탭 전환 · 템플릿 백과사전의 분류·검색·종류·영역 · 소통 피드 · 예시 모임 목록과 상세 · 이 브라우저 안에서만 만들어지는 팀 개설까지다. 로그인 뒤 화면과 레벨업 창 같은 숨은 진입로는 화면 시나리오로 재지 못했다(레벨업 창 닫기 단추는 페이지 안 평가로 쟀다).","값 요약이 같다는 것은 같은 종류·길이·해시의 값이 같은 종류의 접근자로 통로에 있다는 뜻이며, 모든 동작의 보존을 뜻하지 않는다."],
    commands };
  wj('measurement.json', out);
  const s = out.summary;
  console.log(JSON.stringify({ files: s.changed.files, onlyIndex: s.changed.onlyIndexHtml, index: s.changed.indexHtml, tests: s.changed.testsChanged.length, vault: s.changed.vaultChanged.length, gen: s.changed.generatorChanged.length, organ: s.changed.organChanged.length, moved: s.moved, replay: [s.replay.rebuiltEqualsWork, s.replay.firstDiff, s.replay.problems.length], kinds: [s.kindsOnly.deletedOutsideListedKinds.length, s.kindsOnly.exposePropsNotTrivialAccessorOfProofName.length, s.kindsOnly.exposeShellsNotShell.length, s.kindsOnly.namesOutsideProof.length, s.kindsOnly.editedLinesEqualExpected, s.kindsOnly.everyNameHasOneDeclaration, s.kindsOnly.everyNameHadAccessor],
    inline: s.inlineScriptLines, baseline: s.baseline, guard: s.guard, probe: { intrinsic: s.stateProbe.intrinsicVariance, differing: s.stateProbe.differingCount, nameOnly: s.stateProbe.differingFunctionNameOnly, beyond: s.stateProbe.differingBeyondFunctionName, organ: [s.stateProbe.organNames, s.stateProbe.organMatchesProof], writable: s.stateProbe.writable, win: s.stateProbe.windowCopy, boot: s.stateProbe.bootOk, exc: s.stateProbe.exceptions, capture: s.stateProbe.captureCount.same, transitions: s.stateProbe.transitions },
    handles: { boot: s.handles.bootOk, exc: s.handles.exceptions, baseRepeat: s.handles.baseRepeatSame, same: s.handles.sameAsBaseExceptOwnerAndFunctionName, sb: [s.handles.sb.accessor, s.handles.sb.valueKind, s.handles.sb.strictWriteSame, s.handles.sb.scopeReadLines], fake: [s.handles.fakeClient.baseRepeatSame, s.handles.fakeClient.sameAsBaseExceptOwnerAndFunctionName, s.handles.fakeClient.workOneCreateCallSameObjectEverywhere, s.handles.fakeClient.topLevelReadsSame], share: [s.handles.shareContent.nameAtAssign, s.handles.shareContent.sourceHashSame, s.handles.shareContent.nameReads, s.handles.shareContent.forwardSame, s.handles.shareContent.forwardWorkOk, s.handles.shareContent.staticScan.sensitivePropertyReads, s.handles.shareContent.staticScan.valueEscapesOutsideEngineFile, s.handles.shareContent.staticScan.wholeObjectEnumerations], groups: s.handles.MOCK_GROUPS.same, btn: [s.handles.btnAvLvClose.same, s.handles.btnAvLvClose.closeWiringWorks], vars: s.handles.vars.same },
    usage: { bareInlineUnbound: s.usage.bareInlineUnbound, sites: s.usage.bareInlineUnboundSites, locals: s.usage.inlineLocalsOfSameName, assign: s.usage.scopeAssignSites, reads: s.usage.scopeReadLines },
    registry: { ok: s.registryCompare.ok, mism: s.registryCompare.counts && s.registryCompare.counts.mismatches, lost: s.registryCompare.scopeLost, dScope: s.registryCompare.differingScope, dWin: s.registryCompare.differingWindow, beyond: [s.registryCompare.differingScopeBeyondFunctionName, s.registryCompare.differingWindowBeyondFunctionName] }, scenarios: s.scenarios, ml: s.moduleLoad, npm: s.npmTest, each: { same: s.testsEach.sameAsBase, failed: [s.testsEach.failedBase, s.testsEach.failedWork], onlyWork: s.testsEach.onlyWork }, remaining: s.remaining }, null, 1));
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
  jp('R2', '옮긴 이름을 포함해 통로에 노출된 상태 이름 전부의 통로 값 요약 · 접근자 종류 · window 복사의 동일성 · 쓰기 왕복을 기준과 맞대면, 함수 이름 칸 말고 다른 것이 있는 이름이 0 개다(기준을 두 번 재도 달라지는 이름은 뺀다).', M, 'summary.stateProbe.differingBeyondFunctionName', [], [REL + 'state-probe.work.json']);
  jp('R2', '그 맞댐에서 달라진 이름은 함수 이름 칸만 다른 것뿐이고 그 목록은 이것이다(공유 함수 하나 — 인자 수·본문 글자 해시는 같고 함수의 name 만 빈 글자가 됐다).', M, 'summary.stateProbe.differingFunctionNameOnly', m.stateProbe.differingFunctionNameOnly);
  jp('R2', '달라진 이름의 수.', M, 'summary.stateProbe.differingCount', m.stateProbe.differingCount);
  jp('R2', '작업 트리에서 상태 기관이 맡은 이름과 종류(읽기 전용·읽기쓰기)·주인 표시가 설정(proof.json)의 이름과 같다.', M, 'summary.stateProbe.organMatchesProof', true);
  jp('R2', '쓰기 가능한 이름의 쓰기 왕복이 작업 트리에서 전부 된다(기준과 같은 수).', M, 'summary.stateProbe.writable.work.roundtripOk', m.stateProbe.writable.base.roundtripOk);
  jp('R2', '게스트 부팅 뒤 작업 트리의 예외가 0 건이다.', M, 'summary.stateProbe.exceptions.work', 0);
  jp('R2', '등록 기관 대조 탐침(기준 트리 이름 목록 고정): 통로에서 사라진 이름이 없다.', M, 'summary.registryCompare.scopeLost', []);
  jp('R2', '등록 기관 대조 탐침: 이름별 통로 값 지문에서 함수 이름 칸 말고 다른 것이 있는 이름이 없다(본질 변동 이름 제외).', M, 'summary.registryCompare.differingScopeBeyondFunctionName', []);
  jp('R2', '등록 기관 대조 탐침: 이름별 window 값 지문에서 함수 이름 칸 말고 다른 것이 있는 이름이 없다(본질 변동 이름 제외).', M, 'summary.registryCompare.differingWindowBeyondFunctionName', []);
  jp('R2', '등록 기관 대조 탐침: 통로 값 지문이 달라진 이름 목록(함수 이름 칸만 다른 것).', M, 'summary.registryCompare.differingScope', m.registryCompare.differingScope);
  jp('R2', '등록 기관 대조 탐침: window 값 지문이 달라진 이름 목록(함수 이름 칸만 다른 것).', M, 'summary.registryCompare.differingWindow', m.registryCompare.differingWindow);
  jp('R2', '손잡이 탐침(서버 연결 객체 · 공유 함수 · 모임 목록 · 닫기 단추 · 템플릿 하위 탭 넷 · 피드 캐시): 주인 표시·기관 종류·함수 이름 칸을 가리면 기준과 작업의 기록이 통째로 같다.', M, 'summary.handles.sameAsBaseExceptOwnerAndFunctionName', true, [REL + 'handle-probe.base.json', REL + 'handle-probe.work.json', REL + 'tools/handle-probe.cjs']);
  jp('R2', '손잡이 탐침을 기준에서 두 번 돌린 기록이 서로 같다(본질 변동 없음).', M, 'summary.handles.baseRepeatSame', true, [REL + 'handle-probe.base2.json']);
  jp('R2', '모임 목록(MOCK_GROUPS): 길이 · 내용 해시 · 다시 읽어도 같은 배열 · 제자리 변경이 통로로 보임 · 엄격 모드 대입 시도의 결과가 기준과 같다.', M, 'summary.handles.MOCK_GROUPS.same', true);
  jp('R2', '레벨업 창 닫기 단추(btnAvLvClose): 문서의 그 요소와 같은 것이고 엄격 모드 대입 시도의 결과가 기준과 같다.', M, 'summary.handles.btnAvLvClose.same', true);
  jp('R2', '작업 트리에서 레벨업 창을 열고 통로의 그 단추를 누르면 창이 닫힌다(닫기 배선이 돈다).', M, 'summary.handles.btnAvLvClose.closeWiringWorks', true);
  jp('R2', '작업 index.html 인라인 IIFE 에 옮긴 이름이 선언 없이 식별자 참조로 남은 자리가 0 곳이다(문법 분석 — 읽고 쓰는 곳은 전부 통로 L. 을 거친다).', M, 'summary.usage.bareInlineUnbound', 0);
  jp('R6', '서버 연결 객체(sb)의 통로 접근자는 기준과 작업 모두 읽기 전용(get 만)이다 — 생성기가 원래 노출 줄(get 만)을 보고 define 으로 옮겼다.', M, 'summary.handles.sb.accessorIsGetOnlyBoth', true, [REL + 'handle-probe.work.json']);
  jp('R6', '생성기가 sb 에 고른 기관 함수.', M, 'summary.handles.sb.apiByGenerator', 'define', [REL + 'unstate-meta.json']);
  jp('R6', '통로의 sb 에 엄격 모드로 대입을 시도한 결과가 기준과 작업에서 같다.', M, 'summary.handles.sb.strictWriteSame', true);
  jp('R6', '법정·작업자 PC 의 브라우저에서 sb 의 값은 기준과 작업 모두 null 이다(외부 통신 차단).', M, 'summary.handles.sb.valueKind', ['null', 'null']);
  jp('R6', '템플릿 부품 초기화가 건네받은 연결 객체가 통로의 sb 와 같은 것이다(기준 · 작업).', M, 'summary.handles.sb.partInitGotScopeSb', [true, true]);
  jp('R6', '저장소에서 sb 를 통로로 대입하는 자리가 없다(L.sb = … 0 곳).', M, 'summary.handles.sb.scopeAssignSites', []);
  jp('R6', '가짜 연결 라이브러리 방식(진짜 서버 아님): 작업 트리에서 연결 만들기가 한 번 불리고 그 객체가 통로 · window.sb · 템플릿 부품 초기화에 같은 것으로 닿는다.', M, 'summary.handles.fakeClient.workOneCreateCallSameObjectEverywhere', true, [REL + 'handle-probe-fake.work.json']);
  jp('R6', '가짜 연결 라이브러리 방식: 주인 표시·기관 종류·함수 이름 칸을 가리면 기준과 작업의 기록이 통째로 같다.', M, 'summary.handles.fakeClient.sameAsBaseExceptOwnerAndFunctionName', true, [REL + 'handle-probe-fake.base.json']);
  jp('R6', '가짜 연결 라이브러리 방식: 부팅 동안 그 객체의 맨 위 속성을 읽은 이름과 횟수가 기준과 작업에서 같다.', M, 'summary.handles.fakeClient.topLevelReadsSame', true);
  jp('R7', '공유 함수(shareContent)의 name 은 기준에서 shareContent, 작업에서 빈 글자다(대입 순간에 잰 값).', M, 'summary.handles.shareContent.nameAtAssign', ['shareContent', '']);
  jp('R7', '그 함수의 인자 수와 본문 글자 해시는 기준과 작업에서 같다.', M, 'summary.handles.shareContent.sourceHashSame', true);
  jp('R7', '그 함수의 name 을 읽는 순간을 잡는 덫에 걸린 읽기가 기준 · 작업 · 가짜 연결 방식 기준 · 작업 모두 0 번이다(부팅 · 여섯 탭 · 대역 엔진 호출 · 장터 미리보기 공유 단추).', M, 'summary.handles.shareContent.nameReadsTotal', 0);
  jp('R7', '통로 · window 로 부른 호출이 공유 엔진에 같은 인자 객체를 넘기고 엔진의 반환값을 그대로 돌려주며, 장터 미리보기 공유 단추가 엔진을 한 번 부르고, 엔진이 없으면 Promise 를 돌려준다 — 작업 트리에서 전부 참.', M, 'summary.handles.shareContent.forwardWorkOk', true);
  jp('R7', '그 호출 기록이 기준과 작업에서 같다.', M, 'summary.handles.shareContent.forwardSame', true);
  jp('R7', '정적 검사: 저장소 제품 코드에서 그 함수 객체의 속성(name · length · toString 등)을 읽는 자리 수(기준 · 작업).', M, 'summary.handles.shareContent.staticScan.propertyReads', [0, 0], [REL + 'name-readers.work.json', REL + 'tools/name-readers-scan.cjs']);
  jp('R7', '정적 검사: 작업 트리에서 그 함수 객체가 엔진 파일 밖에서 인자·반환값·객체 속성 값으로 흘러가는 자리 수(기준의 1 은 지워진 expose getter 의 return 줄이다).', M, 'summary.handles.shareContent.staticScan.valueEscapesOutsideEngineFile', m.handles.shareContent.staticScan.valueEscapesOutsideEngineFile);
  jp('R7', '정적 검사: window · 통로를 통째로 훑는 줄(for…in · Object.keys 류) 수(기준 · 작업).', M, 'summary.handles.shareContent.staticScan.wholeObjectEnumerations', [0, 0]);
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
  jp('R5', '남은 상태 이름 보고 파일: 옮긴 이름 수.', REL + 'remaining-state.json', 'totals.moved', rem.totals.moved, [REL + 'unstate-run.cjs']);
  jp('R5', '남은 상태 이름 보고 파일: 생성기가 멈춘 이름 수.', REL + 'remaining-state.json', 'totals.stoppedByGenerator', rem.totals.stoppedByGenerator);
  jp('R5', '남은 상태 이름 보고 파일: 통로에 노출되지 않은 이름 수.', REL + 'remaining-state.json', 'totals.notExposed', rem.totals.notExposed);
  jp('R5', '남은 상태 이름 보고 파일: 무결성 게이트가 선언 글자를 붙잡아 뺀 이름 수.', REL + 'remaining-state.json', 'totals.excludedBecauseGatePinsStateText', rem.totals.excludedBecauseGatePinsStateText);
  jp('R5', '남은 상태 이름 보고 파일: IIFE 에 남은 상태 이름 수.', REL + 'remaining-state.json', 'totals.stateNamesLeftInIife', rem.totals.stateNamesLeftInIife);
  add({ req: 'R8', kind: 'unverified', domain: 'server-api', statement: '실계정으로 로그인해 진짜 서버에 붙은 상태에서, 서버 연결 객체(sb)를 통로로 읽는 세포들이 하는 일(로그인 유지 · 서버 피드 불러오기 · 기록 저장과 다시 불러오기)이 상태 이전 전과 같다.', touches: ['index.html'],
    unverified: { reason: 'needs-live-server', who: '실서버에 실계정으로 로그인할 수 있는 사람 — 법정과 작업자 PC 의 브라우저는 외부 통신을 막아 연결 라이브러리가 뜨지 않고 서버 연결 객체가 null 이다(기준 · 작업 동일)',
      how: ['기준 커밋과 작업 커밋을 각각 띄워 실계정으로 로그인한다', '새로 고침 뒤에도 로그인이 유지되는지 본다', '소통 탭 피드에 서버의 글이 불러와지는지 본다', '기록을 하나 남기고 새로 고침 뒤 그 기록이 다시 보이는지 본다', '두 커밋에서 같은 순서로 해 보고 결과를 맞댄다'] } });
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  for (const c of claims) { if (c.kind !== 'static') continue; const v = getPath(JSON.parse(fs.readFileSync(path.join(ROOT, c.check.file), 'utf8')), c.check.path); if (JSON.stringify(v) !== JSON.stringify(c.check.equals)) { console.error(c.id + ' 값 불일치: ' + c.check.path + ' = ' + JSON.stringify(v) + ' (기대 ' + JSON.stringify(c.check.equals) + ')'); process.exit(1); } }
  const mv = m.moved;
  wj('claims.json', { task: TASK, requirementsSource: REQ, requirements: [
    { id: 'R1', text: 'index.html 인라인 IIFE 에서 통로에 노출된 상태 이름 ' + mv.names + '개의 소유를 상태 기관(js/core/app-state.js)으로 옮긴다(생성기 unstate — getter/setter 줄 삭제 · 선언문을 define/defineVar 로 바꿔 쓰기 · window 복사 줄 오른쪽 바꿔 쓰기). 앱 동작은 그대로다.' },
    { id: 'R2', text: '옮긴 이름은 상태 기관이 같은 값·같은 종류의 접근자로 통로에 내준다: 이름별 통로 값 요약 · 접근자 종류 · 쓰기 왕복 · window 복사의 동일성이 기준과 같고, 통로에서 사라진 이름이 없다.' },
    { id: 'R3', text: '지우고 바꿔 쓰는 대상은 닫힌 목록 X4·X5·X6 의 줄뿐이고 names 밖 이름·함수 본문·그 밖의 글자는 바꾸지 않는다. 바뀐 제품 파일은 index.html 하나다.' },
    { id: 'R4', text: '증명 하한(설계 4절): 인라인 줄 수 감소와 기준선 기록 · 모듈 로드 새 회귀 0 · npm test 검사 수 동일·폐기 0 · 무결성 게이트 통과 · tests/·금고·생성기·상태 기관 변경 0.' },
    { id: 'R5', text: '이 PR 을 반영한 index.html 에 남은 상태 이름을 풀리는 조건별로 다시 재서 보고 파일로 남긴다.' },
    { id: 'R6', text: '서버 연결 객체(sb)는 원래 노출 줄과 같은 종류의 접근자(읽기 전용)로 통로에 있고, 통로로 읽는 쪽이 같은 값을 받는다 — 법정·작업자 PC 에서는 null(기준 · 작업 동일)이고, null 이 아닐 때 같은 객체가 닿는지는 가짜 연결 라이브러리로 쟀다.' },
    { id: 'R7', text: '공유 함수(shareContent)는 선언문이 define(…) 의 인자가 되면서 함수의 name 이 빈 글자가 된다. 그 name 을 읽는 코드가 없어 동작에 영향이 없음을 정적 검사와 덫으로 잰다.' },
    { id: 'R8', text: '진짜 서버에 붙은 상태에서 서버 연결 객체로 하는 일이 이전 전과 같다.' } ],
    outOfScopeReports: [
      { text: '게스트 화면에서 숨겨져 누를 수 없는 진입로와 로그인 뒤 화면의 동작은 화면 시나리오로 재지 못했다. 상태 이름 전수는 탐침의 값 요약 · 접근자 종류 · 쓰기 왕복(작업자 측정)으로 쟀고, 법정이 그것을 다시 재는 것은 아니다.', cannotBecause: 'out-of-scope-feature' },
      { text: '공유 함수의 name 이 \'shareContent\' 에서 \'\' 로 바뀐다(인자 수·본문 글자는 같다). 상태 탐침과 등록 기관 대조 탐침의 함수 지문은 name 을 포함하므로 이 이름 하나에서 지문이 달라진다 — 숨기지 않고 주장에 그 목록을 그대로 적었다. 브라우저 개발자 도구의 호출 스택에 보이는 이름도 달라진다(재지 않았다).' },
      { text: '가짜 연결 라이브러리 방식은 페이지가 뜨기 전에 window.supabase 를 기록용 대역으로 심은 작업자 측정이다. 「null 이 아닌 값이 같은 길로 닿는가」만 보여 주고 서버 동작은 재지 못한다. 법정이 그 탐침을 다시 돌린 것은 아니다.' },
      { text: '팀 개설 시나리오(u5)는 게스트가 이 브라우저 안에서만 팀을 만드는 조작이다(서버 연결 객체가 null 이라 서버로 가지 않는다).' },
      { text: '남은 상태 이름(생성기가 멈춘 것 · 무결성 게이트가 선언 글자를 붙잡는 것 · 통로에 노출되지 않은 것)의 이전은 이 PR 에 없다. reports/' + TASK + '/remaining-state.json 에 풀리는 조건별로 적었다.', cannotBecause: 'out-of-scope-feature' } ],
    claims });
  console.log('claims', claims.length, '· behavior', claims.filter(c => c.kind === 'behavior').length);
  process.exit(0);
}
