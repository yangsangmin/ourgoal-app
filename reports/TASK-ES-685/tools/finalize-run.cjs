#!/usr/bin/env node
'use strict';
// 인라인 IIFE 마지막 정리 실행기 (#TASK-ES-685 · docs/architecture/CELL-REGISTRY-DESIGN.md 5.8절 X9 · 5.9절 relay · keepInline) — 작업자 도구, 판정 아님.
// 줄을 옮기고 지우는 것은 이 파일이 아니라 생성기(gen-inline-hard.js mode:"finalize")다 — 손 편집은 신고서의 종류 한 칸(modules.json app/boot kind = organ)뿐이고 그것도 이 도구가 적어 남긴다.
//   apply     proof.json(생성기 설정)을 쓰고 생성기를 돌린 뒤 신고서(module-specs --write) · 종류 한 칸 · 세포 설명 · 기준선(module-guard --update) · git add -N 까지 한다.
//   scenarios 시나리오를 법정 실행기로 기준 2회 · 작업 1회 돌려(reports/TASK-ES-659/tools/scenario-local.cjs) scenario-local.json 에 id 별로 모은다(여러 번 나눠 돌릴 수 있다).
//   measure   기준 트리(origin/main 임시 worktree)와 맞대어 잰다 → measurement.json
//   claims    measurement.json 에서 claims.json 을 만든다(보존 주장 = 시나리오마다 하나 + proof.json, 기록 주장 = 측정 파일의 값).
// 사용(NODE_PATH=C:/dev/ourgoal-app/node_modules):
//   node reports/TASK-ES-685/tools/finalize-run.cjs apply     <작업 트리>
//   node reports/TASK-ES-685/tools/finalize-run.cjs scenarios <작업 트리> --base <기준 트리> [--only a,b,c]
//   node reports/TASK-ES-685/tools/finalize-run.cjs measure   <작업 트리> --base <기준 트리>
//       먼저: raw/npm-test.{base,work}.{log,exit} · tests-{base,work}.json · scenario-local.json
//   node reports/TASK-ES-685/tools/finalize-run.cjs claims    <작업 트리> --req docs/specs/REQ-….md
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const argv = process.argv.slice(2), CMD = argv[0], ROOT = path.resolve(argv[1] || '.');
const opt = (k, d) => (argv.indexOf(k) >= 0 ? argv[argv.indexOf(k) + 1] : d);
const TASK = 'TASK-ES-685', REL = 'reports/' + TASK + '/', DIR = path.join(ROOT, 'reports', TASK);
const GEN = path.join(ROOT, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js'), INDEX = path.join(ROOT, 'index.html');
const BOOT = 'js/app/boot.js', CELL_ID = 'app/boot', TAG = '<script src="' + BOOT + '"></script>';
const wj = (f, o) => { fs.mkdirSync(path.dirname(path.join(DIR, f)), { recursive: true }); fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' }); };
const rj = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const lf = s => s.replace(/\r\n/g, '\n');
const redact = s => String(s).replace(/eyJ[A-Za-z0-9._-]+/g, '(가림)').replace(/https:\/\/[a-z0-9]+\.supabase\.co/g, '(서버 주소 가림)'); // 공개 키·서버 주소 글자는 보고 파일에 옮기지 않는다(키 꼴 글자는 커밋 훅의 금지 패턴)
const commands = [];
function run(id, args, cwd, env) { const t0 = new Date().toISOString(); const r = cp.spawnSync(args[0], args.slice(1), { cwd: cwd || ROOT, encoding: 'utf8', env: Object.assign({}, process.env, env || {}), maxBuffer: 256 * 1024 * 1024 }); commands.push({ id, startedAt: t0, endedAt: new Date().toISOString(), exitCode: r.status, stderrHead: redact((r.stderr || '').slice(0, 200)) }); return r; }
const must = (r, what) => { if (r.status !== 0) { console.error(what + ' 실패: ' + redact(((r.stderr || '') + (r.stdout || '')).slice(0, 600))); process.exit(1); } return r; };
const git = (args, cwd) => run('git ' + args[0], ['git'].concat(args), cwd);
const L = s => s.trim().split('\n').map(x => x.trim()).filter(Boolean);
if (!['apply', 'scenarios', 'measure', 'claims'].includes(CMD)) { console.error('사용: node finalize-run.cjs apply|scenarios|measure|claims <작업 트리> …'); process.exit(2); }

// 2026-10-11 결심(①②)이 승인한 자리 — 이 밖의 문·이름은 적지 않는다
const RELAY = [{ name: 'renderTeamGoalsScreen', reason: '주인 세포 js/tabs/goals/team-goals-screen.js 가 798줄이라 등록 블록을 붙이면 800줄 상한을 넘는다 — 등록 기관에 등록하지 못한 이름의 통로 중계(2026-10-11 결심 ② 글자 그대로)' }];
const KEEP = { statements: ['var SUPABASE_URL', 'var SUPABASE_ANON_KEY', "window.OurgoalAppState.define('sb'"], reason: '커밋 훅의 HARDCODED_SECRET 규칙(금고)이 공개 키 선언 줄을 새 파일로 옮기는 것을 막는다 — 규칙은 건드리지 않는다(2026-10-11 결심 ① 제자리 인라인에 남김)' };

if (CMD === 'apply') {
  // slot: finalize 는 이음매 자리를 쓰지 않지만 법정의 재실행 대조(court/lib/preserve-source.js)가 증명 파일에 slot 칸을 요구한다 — 배선 철거 · 쓸기 증명 파일과 같은 값을 적는다(생성기 출력에 영향 없음)
  const proof = { task: TASK, slot: 'HO', mode: 'finalize', label: '인라인 IIFE 마지막 정리 — 남은 시동 문을 부팅 파일로(서버 연결 세 문과 그 앞에서 도는 문은 인라인에 그대로)',
    cells: [{ file: BOOT, title: 'OurGoal App Boot (부팅 — 구역 함수를 순서대로 부른다)', desc: ['구역 함수를 index.html 에 있던 순서 그대로 부른다.'] }], relay: RELAY, keepInline: KEEP };
  wj('proof.json', proof);
  const metaDir = fs.mkdtempSync(path.join(os.tmpdir(), 'finalize-run-meta-'));
  const r = run('gen-inline-hard finalize', [process.execPath, GEN, ROOT, path.join(DIR, 'proof.json')], ROOT, { MODULE_SPLIT_OUT: metaDir });
  if (r.status !== 0) { console.error('생성기 정지: ' + redact((((r.stderr || '') + (r.stdout || '')).split('\n').find(l => /Error: /.test(l)) || '(메시지 없음)'))); fs.rmSync(metaDir, { recursive: true, force: true }); process.exit(1); }
  const meta = JSON.parse(redact(fs.readFileSync(path.join(metaDir, 'gen-inline-hard-meta.json'), 'utf8'))); fs.rmSync(metaDir, { recursive: true, force: true });
  // 신고서 · 종류 한 칸(손 편집 — 신고서 도구는 새 폴더 js/app 의 종류를 모른다) · 세포 설명 · 기준선
  must(run('module-specs --write', [process.execPath, 'scripts/module-specs.js', '--write']), '신고서 쓰기');
  const mfile = path.join(ROOT, 'docs', 'architecture', 'modules.json'), readM = () => JSON.parse(fs.readFileSync(mfile, 'utf8'));
  const kindWritten = (readM().cells.find(c => c.id === CELL_ID) || {}).kind;
  const guardBefore = run('module-guard(종류를 정하기 전)', [process.execPath, 'scripts/module-guard.js', '--quiet']);
  { const raw = fs.readFileSync(mfile, 'utf8'), m = JSON.parse(raw), eol = raw.includes('\r\n') ? '\r\n' : '\n', ind = (raw.match(/\n( +)"/) || [])[1] || ' ';
    m.cells.find(c => c.id === CELL_ID).kind = 'organ';
    fs.writeFileSync(mfile, JSON.stringify(m, null, ind.length).split('\n').join(eol) + (raw.endsWith('\n') ? eol : ''), { encoding: 'utf8' }); }
  must(run('module-specs --write(다시)', [process.execPath, 'scripts/module-specs.js', '--write']), '신고서 다시 쓰기');
  const kindKept = (readM().cells.find(c => c.id === CELL_ID) || {}).kind;
  const descFile = path.join(os.tmpdir(), 'finalize-run-desc-' + process.pid + '.json');
  fs.writeFileSync(descFile, JSON.stringify({ [CELL_ID]: ['앱 부팅', '앱이 뜰 때 시동 함수들을 예전 index.html 에 있던 차례 그대로 부른다'] }), { encoding: 'utf8' });
  must(run('cell-desc-add', [process.execPath, 'docs/design/harness/module-split/cell-desc-add.js', ROOT, descFile]), '세포 설명'); fs.unlinkSync(descFile);
  must(run('module-guard --update', [process.execPath, 'scripts/module-guard.js', '--update']), '기준선');
  const guardAfter = run('module-guard(뒤)', [process.execPath, 'scripts/module-guard.js', '--quiet']);
  git(['add', '-N', BOOT]);
  wj('finalize-meta.json', { tool: REL + 'tools/finalize-run.cjs apply', type: '생성기 산출 기록(작업자 측정, 판정 아님) — 공개 키 글자는 (가림)으로 바꿔 적었다', stdout: redact((r.stdout || '').trim()).split('\n'), meta,
    spec: { cell: CELL_ID, kindWrittenByTool: kindWritten || null, guardExitBeforeKind: guardBefore.status, kindSetByHand: 'organ', kindKeptAfterRewrite: kindKept, guardExitAfter: guardAfter.status,
      note: '신고서 도구(module-specs --write)는 새 폴더 js/app 의 종류를 정하지 못해 unclassified 로 적고 모듈 가드가 멈춘다. modules.json 의 그 한 칸을 organ 으로 손으로 정했다(이 도구가 적었다) — 다시 써도 그 값은 보존된다. 도구·가드 규칙은 바꾸지 않았다' } });
  console.log(redact((r.stdout || '').trim()));
  console.log(JSON.stringify({ kind: [kindWritten, kindKept], guard: [guardBefore.status, guardAfter.status] }));
  process.exit(0);
}

if (CMD === 'scenarios') {
  const BASE = path.resolve(opt('--base')), only = opt('--only') ? opt('--only').split(',') : null;
  const scDir = path.join(DIR, 'scenarios'), files = fs.readdirSync(scDir).filter(f => /\.json$/.test(f)).sort().filter(f => !only || only.some(p => f.startsWith(p)));
  const part = path.join(os.tmpdir(), 'finalize-run-sc-' + process.pid + '.json');
  const r = run('scenario-local', [process.execPath, path.join(ROOT, 'reports', 'TASK-ES-659', 'tools', 'scenario-local.cjs'), BASE, ROOT, part].concat(files.map(f => path.join(scDir, f))));
  if (!fs.existsSync(part)) { console.error('시나리오 실행 실패: ' + redact(((r.stderr || '') + (r.stdout || '')).slice(-600))); process.exit(1); }
  const got = JSON.parse(fs.readFileSync(part, 'utf8')); fs.unlinkSync(part);
  const f = path.join(DIR, 'scenario-local.json'), all = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { tool: got.tool, type: got.type, scenarios: {} };
  Object.assign(all.scenarios, got.scenarios);
  const want = fs.readdirSync(scDir).filter(x => /\.json$/.test(x)).map(x => JSON.parse(fs.readFileSync(path.join(scDir, x), 'utf8')).id).sort();
  const ordered = {}; want.forEach(id => { if (all.scenarios[id]) ordered[id] = all.scenarios[id]; }); all.scenarios = ordered;
  const rows = Object.values(all.scenarios);
  all.expected = want.length; all.ran = rows.length; all.missing = want.filter(id => !all.scenarios[id]);
  all.allPassedBoth = rows.length === want.length && rows.every(x => x.runs.base.passed && x.runs.base2.passed && x.runs.work.passed);
  all.allProveBehavior = rows.length === want.length && rows.every(x => x.runs.base.provesBehavior && x.runs.base2.provesBehavior && x.runs.work.provesBehavior);
  wj('scenario-local.json', all);
  console.log((r.stdout || '').trim());
  console.log(JSON.stringify({ ran: all.ran, expected: all.expected, missing: all.missing.length, allPassedBoth: all.allPassedBoth }));
  process.exit(0);
}

// ── 파싱: 인라인 IIFE(첫 `<script>` + `(function(){` + "use strict") 와 부팅 파일의 최상위 문
const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
function kindOf(n) {
  if (n.type === 'VariableDeclaration' && n.declarations.length === 1 && n.declarations[0].init && n.declarations[0].init.type === 'MemberExpression' && !n.declarations[0].init.computed && n.declarations[0].init.object.type === 'Identifier') {
    const d = n.declarations[0]; return d.init.object.name === 'window' ? { kind: '손잡이', name: d.id.name } : { kind: '가져오기', name: d.id.name, kit: d.init.object.name }; }
  if (n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression' && n.expression.callee.type === 'Identifier' && n.expression.arguments.length === 0) return { kind: '구역 함수 호출문', name: n.expression.callee.name };
  if (n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression' && /OurgoalAppScope\.expose$/.test(codeOfCallee(n.expression.callee))) return { kind: 'expose 문', name: null };
  if (n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression' && /OurgoalAppState\.define(Var)?$/.test(codeOfCallee(n.expression.callee))) return { kind: '상태 선언(define)', name: (n.expression.arguments[0] || {}).value || null };
  if (n.type === 'VariableDeclaration') return { kind: '그 밖의 var', name: n.declarations.map(d => d.id.name).join(',') };
  return { kind: '그 밖', name: null };
}
function codeOfCallee(c) { return c.type === 'MemberExpression' ? codeOfCallee(c.object) + '.' + (c.property.name || '') : (c.name || ''); }
function topStatements(code, lineOffset) {
  const ast = parser.parse(code, { sourceType: 'script' }); let f = null; traverse(ast, { FunctionExpression(p) { if (!f) f = p; p.skip(); } });
  return f.get('body').get('body').map(t => Object.assign({ text: code.slice(t.node.start, t.node.end), line: t.node.loc.start.line + lineOffset, endLine: t.node.loc.end.line + lineOffset }, kindOf(t.node)));
}
function iife(ls) { // ls = LF 로 나눈 줄. s = `<script>` 줄 번호(1부터), e = `</script>` 로 시작하는 줄의 0부터 번호
  let s = -1, e = -1;
  for (let i = 0; i < ls.length; i++) if (ls[i].trim() === '<script>' && (ls[i + 1] || '').trim() === '(function(){' && (ls[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  if (s < 0) return null;
  for (let i = s; i < ls.length; i++) if (ls[i].startsWith('</script>')) { e = i; break; }
  const stmts = topStatements(ls.slice(s, e).join('\n'), s), stmtLines = new Set();
  for (const t of stmts) for (let l = t.line; l <= t.endLine; l++) stmtLines.add(l);
  let comment = 0, blank = 0; for (let n = s + 3; n <= e - 1; n++) if (!stmtLines.has(n)) { if (ls[n - 1].trim() === '') blank++; else comment++; }
  return { s, e, lines: e - s, stmts, stmtLines, gap: { comment, blank } };
}
const rawLines = f => fs.readFileSync(f).toString('latin1').split('\n'); // 바이트 그대로(줄 끝 \r 포함)

if (CMD === 'measure') {
  const BASE = path.resolve(opt('--base'));
  { const mf = path.join(DIR, 'finalize-meta.json'), raw = fs.readFileSync(mf, 'utf8'), red = redact(raw); if (red !== raw) fs.writeFileSync(mf, red, { encoding: 'utf8' }); } // 생성기 메타의 문 글자 앞머리에 든 서버 주소도 가린다(값은 그대로 — 글자만)
  const fm = rj('finalize-meta.json'), meta = fm.meta, proof = rj('proof.json');
  const baseHead = git(['rev-parse', 'HEAD'], BASE).stdout.trim(), workHead = git(['rev-parse', 'HEAD']).stdout.trim();
  const numstat = L(git(['diff', '--numstat', baseHead, '--']).stdout).map(l => { const [a, d, f] = l.split('\t'); return { file: f, insertions: Number(a), deletions: Number(d) }; });
  const all = [...new Set(numstat.map(x => x.file).concat(L(git(['ls-files', '--others', '--exclude-standard']).stdout)))];
  const productRe = /^(js\/.*|index\.html|ui\.js|sw\.js|.*\.css)$/;
  const vaultRe = /^(court\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|\.agent\/rules\/|docs\/rules\/(OURGOAL_ABSOLUTE_INTEGRITY_RULES\.md|CONSTITUTION_VERSIONS\.md|ESSENCE_OURGOAL\.md|rules\.json|rules-control\.json|branch-protection.*\.json|archive\/)|\.github\/|\.githooks\/|scripts\/essence-gate\.js$|scripts\/install-essence-gate\.js$|scripts\/verify-integrity-gate\.js$|scripts\/hook-smoke-on-index\.js$|\.vercelignore$|package\.json$|vercel\.json$|\.gitattributes$|\.claude\/settings\.json$|docs\/directives\/)/;

  // ── ① 글자: 남은 인라인 줄 · 부팅 파일 · 되짚기
  const bl = lf(fs.readFileSync(path.join(BASE, 'index.html'), 'utf8')).split('\n'), wl = lf(fs.readFileSync(INDEX, 'utf8')).split('\n');
  const bRaw = rawLines(path.join(BASE, 'index.html')), wRaw = rawLines(INDEX);
  const iB = iife(bl), iW = iife(wl);
  const bootText = lf(fs.readFileSync(path.join(ROOT, BOOT), 'utf8')), bootLs = bootText.split('\n');
  const bootStart = bootLs.findIndex(l => l.trim() === '(function(){');
  const K = topStatements(bootLs.slice(bootStart).join('\n'), bootStart), I = iW.stmts, B = iB.stmts;
  const textIdx = {}; B.forEach((b, i) => { (textIdx[b.text] = textIdx[b.text] || []).push(i); });
  const duplicatedBaseTexts = Object.keys(textIdx).filter(t => textIdx[t].length > 1);
  const mapTo = arr => arr.map(x => (textIdx[x.text] || [])[0]);
  const iMap = mapTo(I), kMap = mapTo(K);
  const increasing = a => a.every((v, i) => v !== undefined && (i === 0 || a[i - 1] < v));
  const inlineSet = new Set(iMap), dupInBoot = K.filter((k, i) => inlineSet.has(kMap[i]));
  const kOnly = K.filter((k, i) => !inlineSet.has(kMap[i])), kOnlyMap = kMap.filter(v => !inlineSet.has(v));
  const covered = new Set(iMap.concat(kOnlyMap));
  const eff = arr => arr.filter(x => x.kind !== '손잡이' && x.kind !== '가져오기').map(x => x.text);
  const keptBaseLineNos = []; I.forEach((x, i) => { const b = B[iMap[i]]; if (b) for (let n = b.line; n <= b.endLine; n++) keptBaseLineNos.push(n); });
  const keptWorkLineNos = []; I.forEach(x => { for (let n = x.line; n <= x.endLine; n++) keptWorkLineNos.push(n); });
  const inlineBytes = keptWorkLineNos.length === keptBaseLineNos.length && keptWorkLineNos.every((n, i) => Buffer.from(wRaw[n - 1], 'latin1').equals(Buffer.from(bRaw[keptBaseLineNos[i] - 1], 'latin1')));
  const KEYLINE = /^\s*var SUPABASE_(URL|ANON_KEY) = /;
  const keyB = bRaw.filter(l => KEYLINE.test(l)), keyW = wRaw.filter(l => KEYLINE.test(l));
  // 되짚기: 기준 줄 = [… <script> (function(){ "use strict";] + [남긴 줄(기준 차례)] + [})();] + [</script> 줄에 부팅 태그만 붙인 것] + […나머지] 가 작업 index.html 과 같은가
  const rebuilt = bl.slice(0, iB.s + 2).concat(keptBaseLineNos.map(n => bl[n - 1]), [bl[iB.e - 1]], [wl[iW.e]], bl.slice(iB.e + 1));
  const firstDiff = (() => { for (let i = 0; i < Math.max(rebuilt.length, wl.length); i++) if (rebuilt[i] !== wl[i]) return { line: i + 1, rebuilt: redact((rebuilt[i] || '').slice(0, 140)), work: redact((wl[i] || '').slice(0, 140)) }; return null; })();
  const bootBody = bootLs.slice(bootStart + 2, bootLs.lastIndexOf('})();')).filter(l => l.trim() !== '');
  const words = { type: '작업자 측정, 판정 아님', note: '생성기와 따로 기준·작업 index.html 과 부팅 파일을 다시 파싱해 문 단위로 맞댔다(문 글자 = 문의 시작~끝 글자, 뒤따르는 주석 제외. 바이트 비교는 줄 전체 — 줄 끝 글자 포함)',
    base: { iifeLines: iB.lines, statements: B.length, byKind: B.reduce((a, x) => { a[x.kind] = (a[x.kind] || 0) + 1; return a; }, {}), commentLines: iB.gap.comment, blankLines: iB.gap.blank, duplicatedStatementTexts: duplicatedBaseTexts.length },
    inline: { blockLines: iW.lines, statements: I.length, byKind: I.reduce((a, x) => { a[x.kind] = (a[x.kind] || 0) + 1; return a; }, {}), commentOnlyLines: iW.gap.comment, blankLines: iW.gap.blank,
      list: I.map((x, i) => ({ line: x.line, kind: x.kind, name: x.name, baseLine: (B[iMap[i]] || {}).line || null, text: redact(x.text.split('\n')[0].slice(0, 90)) })),
      everyStatementIsABaseStatement: iMap.every(v => v !== undefined), orderSameAsBase: increasing(iMap), linesByteIdenticalToBase: inlineBytes, lineCount: keptWorkLineNos.length },
    boot: { file: BOOT, fileLines: bootLs.length - (bootText.endsWith('\n') ? 1 : 0), statements: K.length, byKind: K.reduce((a, x) => { a[x.kind] = (a[x.kind] || 0) + 1; return a; }, {}),
      everyStatementIsABaseStatement: kMap.every(v => v !== undefined), duplicatedFromInline: dupInBoot.map(x => ({ kind: x.kind, name: x.name })), duplicatedAreHandlesOnly: dupInBoot.every(x => x.kind === '손잡이'),
      callOrderSameAsBase: increasing(kOnlyMap.filter((v, i) => kOnly[i].kind === '구역 함수 호출문')), importOrderSameAsBase: increasing(kOnlyMap.filter((v, i) => kOnly[i].kind === '가져오기')),
      bodyIsStatementsOnly: bootBody.length === K.length && bootBody.every((l, i) => l === '  ' + K[i].text), calls: K.filter(x => x.kind === '구역 함수 호출문').map(x => x.name),
      importsAllCalledInBoot: K.filter(x => x.kind === '가져오기').every(x => K.some(y => y.kind === '구역 함수 호출문' && y.name === x.name)) },
    partition: { baseStatements: B.length, inline: I.length, bootWithoutDuplicates: kOnly.length, everyBaseStatementExactlyOnce: covered.size === B.length && I.length + kOnly.length === B.length, missingFromWork: B.filter((b, i) => !covered.has(i)).map(b => redact(b.text.slice(0, 60))) },
    effectOrder: { base: eff(B).length, inlineThenBoot: eff(I).length + eff(K).length, sameAsBase: JSON.stringify(eff(B)) === JSON.stringify(eff(I).concat(eff(K))), inlineEffects: eff(I).map(t => redact(t.split('\n')[0].slice(0, 60))),
      note: '값을 읽기만 하는 문(손잡이 · 가져오기 — 키트의 데이터 속성 읽기)을 뺀 문의 차례: 기준 IIFE == 인라인 블록 뒤에 부팅 파일을 이은 것' },
    serverKey: { keyLinesInBaseIndex: keyB.length, keyLinesInWorkIndex: keyW.length, workLinesByteIdenticalToBase: keyB.length === 2 && keyW.length === 2 && keyB.every((l, i) => Buffer.from(l, 'latin1').equals(Buffer.from(keyW[i], 'latin1'))),
      bootHasNoKeyText: !/SUPABASE|supabase\.co|eyJ[A-Za-z0-9._-]{10,}/.test(bootText), bootMentions: { SUPABASE: /SUPABASE/.test(bootText), host: /supabase\.co/.test(bootText), keyLike: /eyJ[A-Za-z0-9._-]{10,}/.test(bootText) },
      note: '서버 주소 · 공개 키 선언 두 줄(값 글자는 이 파일에 적지 않는다): 작업 index.html 의 그 줄이 기준 줄과 바이트로 같고, 부팅 파일에는 그 이름도 주소도 키 꼴 글자도 없다' },
    replay: { rebuiltEqualsWork: rebuilt.length === wl.length && firstDiff === null, firstDiff, baseLines: bl.length, workLines: wl.length, removedLines: bl.length - wl.length, generatorRemovedLines: meta.removed.lines,
      tagLineIsBasePlusBootTag: wl[iW.e].split(TAG).join('') === bl[iB.e] && wl[iW.e].split(TAG).length === 2, tagLine: iW.e + 1, tagInBase: bl.some(l => l.includes(TAG)), tagCountInWork: wl.filter(l => l.includes(TAG)).length,
      note: '기준 index.html 의 IIFE 에서 「남긴 줄」만 기준 차례로 남기고(머리 3줄 · 꼬리 `})();` 는 그대로), `</script>` 줄에 부팅 파일 태그만 붙이면 작업 index.html 과 줄 단위로 같다 — IIFE 밖의 글자 변경 0' } };
  words.ok = words.inline.everyStatementIsABaseStatement && words.inline.orderSameAsBase && words.inline.linesByteIdenticalToBase && words.inline.commentOnlyLines === 0 && words.inline.blankLines === 0 && words.boot.everyStatementIsABaseStatement && words.boot.duplicatedAreHandlesOnly && words.boot.callOrderSameAsBase && words.boot.bodyIsStatementsOnly && words.boot.importsAllCalledInBoot && words.partition.everyBaseStatementExactlyOnce && words.effectOrder.sameAsBase && words.serverKey.workLinesByteIdenticalToBase && words.serverKey.bootHasNoKeyText && words.replay.rebuiltEqualsWork && words.replay.tagLineIsBasePlusBootTag && words.replay.tagCountInWork === 1 && duplicatedBaseTexts.length === 0;

  // ── ② 시점
  const OP = path.join(ROOT, 'reports', TASK, 'tools', 'order-probe-685.cjs');
  for (const [label, dir] of [['base', BASE], ['work', ROOT]]) { run('order-probe ' + label, [process.execPath, OP, dir, path.join(DIR, 'order-probe.' + label + '.json')]); run('order-probe fake ' + label, [process.execPath, OP, dir, path.join(DIR, 'order-probe-fake.' + label + '.json'), '--fake-client']); }
  const oB = rj('order-probe.base.json'), oW = rj('order-probe.work.json'), fB = rj('order-probe-fake.base.json'), fW = rj('order-probe-fake.work.json');
  const sameArr = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const order = { tool: REL + 'tools/order-probe-685.cjs',
    plain: { bootOk: [oB.boot.ok, oW.boot.ok], exceptions: [oB.boot.exceptions.length, oW.boot.exceptions.length], events: [oB.result && oB.result.total, oW.result && oW.result.total], eventsSame: !!oB.result && !!oW.result && sameArr(oB.result.events, oW.result.events), scopeNamesAtSame: !!oB.result && !!oW.result && sameArr(oB.result.scopeNamesAt, oW.result.scopeNamesAt),
      bootCalls: [oB.result && oB.result.bootCallCount, oW.result && oW.result.bootCallCount], bootCallsSame: !!oB.result && !!oW.result && sameArr(oB.result.bootCalls, oW.result.bootCalls), serverLink: { base: oB.result && oB.result.serverLink, work: oW.result && oW.result.serverLink }, probeErrors: [(oB.result || {}).errors, (oW.result || {}).errors] },
    fakeClient: { bootOk: [fB.boot.ok, fW.boot.ok], exceptions: [fB.boot.exceptions.length, fW.boot.exceptions.length], events: [fB.result && fB.result.total, fW.result && fW.result.total], eventsSame: !!fB.result && !!fW.result && sameArr(fB.result.events, fW.result.events), fake: { base: fB.result && fB.result.fake, work: fW.result && fW.result.fake }, serverLink: { base: fB.result && fB.result.serverLink, work: fW.result && fW.result.serverLink } } };
  order.themeThenServerLinkThenRest = !!(oW.result && oW.result.serverLink.themeThenSbThenRest && oB.result.serverLink.themeThenSbThenRest && fW.result.serverLink.themeThenSbThenRest);
  order.ok = order.plain.eventsSame && order.plain.scopeNamesAtSame && order.plain.bootCallsSame && order.fakeClient.eventsSame && order.themeThenServerLinkThenRest && oW.boot.ok && fW.boot.ok && oW.boot.exceptions.length === 0 && fW.boot.exceptions.length === fB.boot.exceptions.length
    && !!(fW.result.fake && fW.result.fake.scopeSbIsFake && fW.result.fake.createClientBeforeDefineSb) && JSON.stringify(fW.result.fake) === JSON.stringify(fB.result.fake);

  // ── ③ 값 · ④ 화면 · 시험
  const mm = require(path.join(ROOT, 'scripts', 'module-metrics.js'));
  const mW = mm.measure(ROOT).ratchet, mB = require(path.join(BASE, 'scripts', 'module-metrics.js')).measure(BASE).ratchet;
  const guard = run('module-guard', [process.execPath, 'scripts/module-guard.js', '--quiet']);
  const gate = run('integrity-gate', [process.execPath, 'scripts/verify-integrity-gate.js']);
  const baselineJ = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'architecture', 'module-baseline.json'), 'utf8')), baselineB = JSON.parse(fs.readFileSync(path.join(BASE, 'docs', 'architecture', 'module-baseline.json'), 'utf8'));
  const lastOf = j => j.history[j.history.length - 1].metrics.inlineScriptLines;
  const probe = path.join(ROOT, 'scripts', 'probes', 'cell-registry-compare.js');
  run('probe base', [process.execPath, probe, BASE, path.join(DIR, 'cell-registry-compare.before.json'), '--fingerprints']);
  run('probe work', [process.execPath, probe, ROOT, path.join(DIR, 'cell-registry-compare.json'), '--fingerprints', '--names-from', path.join(DIR, 'cell-registry-compare.before.json')]);
  const cB = rj('cell-registry-compare.before.json'), cW = rj('cell-registry-compare.json');
  const fpd = k => Object.keys(cB.fingerprints[k]).filter(n => cB.fingerprints[k][n] !== cW.fingerprints[k][n]);
  const sc = rj('scenario-local.json');
  const ml = require(path.join(ROOT, 'court', 'probes', 'module-load.js'));
  const cmp = ml.compare(ml.probeModules(BASE), ml.probeModules(ROOT), fs.readFileSync(INDEX, 'utf8'));
  wj('module-load.json', { tool: 'court/probes/module-load.js (읽기 전용)', type: '작업자 측정, 판정 아님', base: baseHead, measuredAt: new Date().toISOString(), regressions: cmp.regressions, insufficient: cmp.insufficient, fixed: cmp.fixed, counts: cmp.counts });
  const readLog = label => {
    const T = lf(fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.log'), 'utf8')).split('\n'), ex = fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), 'utf8').trim();
    const norm = s => s.trim().replace(/\d+(\.\d+)?\s?ms\b/g, 'Nms').replace(/[A-Za-z]:[\\/][^\s"')]+/g, '<path>');
    const ok = T.filter(l => /^\s*✓ /.test(l)).map(norm), okDot = T.filter(l => /^\s*ok · /.test(l)).map(norm), fail = T.filter(l => /^\s*(✗|✖|not ok|FAIL\b)/.test(l)).map(norm);
    return { ok: ok.length, okDot: okDot.length, fail: fail.length, failLines: fail.slice(0, 20), exit: Number((/exit=(\d+)/.exec(ex) || [])[1]), _c: ok.concat(okDot) };
  };
  const nb = readLog('base'), nw = readLog('work');
  const ms = a => { const m = {}; a.forEach(x => { m[x] = (m[x] || 0) + 1; }); return m; }, b = ms(nb._c), w = ms(nw._c);
  const onlyBase = Object.keys(b).filter(k => (w[k] || 0) < b[k]), onlyWork = Object.keys(w).filter(k => (b[k] || 0) < w[k]); delete nb._c; delete nw._c;
  const npm = { base: nb, work: nw, onlyBase, onlyWork, same: nb.ok === nw.ok && nb.okDot === nw.okDot && nb.exit === 0 && nw.exit === 0 && !onlyBase.length && !onlyWork.length && nb.fail === 0 && nw.fail === 0 };
  const tB = rj('tests-base.json'), tW = rj('tests-work.json'), sig = x => JSON.stringify([x.exit, x.ok, x.okDot, (x.fails || []).length]), key = x => x.script || x.file, differing = [];
  for (const k of ['scripts', 'testFiles']) { const m = {}; tB[k].forEach(x => { m[key(x)] = sig(x); }); tW[k].forEach(x => { if (m[key(x)] !== sig(x)) differing.push({ file: key(x), base: m[key(x)] || null, work: sig(x) }); }); }
  const scRows = Object.keys(sc.scenarios).map(id => ({ id, base: sc.scenarios[id].runs.base.passed, base2: sc.scenarios[id].runs.base2.passed, work: sc.scenarios[id].runs.work.passed, workExceptions: (sc.scenarios[id].runs.work.exceptions || []).length, nonVacuousExpects: sc.scenarios[id].runs.work.nonVacuousExpects, steps: sc.scenarios[id].runs.work.steps }));
  const modules = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'architecture', 'modules.json'), 'utf8')), cell = modules.cells.find(c => c.id === CELL_ID) || {};
  const descs = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'architecture', 'cell-descriptions.json'), 'utf8'));
  const out = { schema: 'ourgoal.finalize-run.measurement/1', taskId: TASK, type: '작업자 측정, 판정 아님 — 판정은 GitHub 법정만 낸다', measuredAt: new Date().toISOString(),
    sourceCommit: { baseTreeHead: baseHead, worktreeHead: workHead },
    summary: {
      finalize: { statements: meta.statements, removed: meta.removed, htmlLines: [meta.htmlLinesBefore, meta.htmlLinesAfter], files: meta.files, relayed: (meta.relayed || []).map(x => ({ name: x.name, movedTo: x.movedTo })), relayNames: (meta.relayed || []).map(x => x.name),
        keptInline: { specified: meta.keptInline.statements.map(x => x.match), before: (meta.keptInline.before || []).map(x => ({ line: x.line, why: x.why })), pulled: (meta.keptInline.pulled || []).map(x => ({ line: x.line, why: x.why })), duplicatedHandles: (meta.keptInline.duplicatedHandles || []).map(x => x.name), inline: meta.keptInline.inline, boot: meta.keptInline.boot },
        configured: { relayNames: (proof.relay || []).map(x => x.name), keepInlineStatements: proof.keepInline.statements } },
      changed: { files: all.length, productFiles: all.filter(f => productRe.test(f)).sort(), onlyIndexAndBoot: JSON.stringify(all.filter(f => productRe.test(f)).sort()) === JSON.stringify(['index.html', BOOT]), indexHtml: numstat.find(x => x.file === 'index.html') || null,
        testsChanged: all.filter(f => /^tests\//.test(f)), scriptsChanged: all.filter(f => /^scripts\//.test(f)), vaultChanged: all.filter(f => vaultRe.test(f)), generatorChanged: all.filter(f => /^docs\/design\/harness\/module-split\//.test(f) || f === 'js/core/cell-registry.js'),
        otherGeneratedMapsChanged: all.filter(f => /^docs\/architecture\/(cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md)$/.test(f)) },
      words, order,
      spec: { cell: CELL_ID, kind: cell.kind || null, kindIsOrgan: cell.kind === 'organ', hasName: !!(descs.names || {})[CELL_ID], hasDescription: !!(descs.cells || {})[CELL_ID], apply: fm.spec },
      inlineScriptLines: { before: mB.inlineScriptLines, after: mW.inlineScriptLines, decreasedBy: mB.inlineScriptLines - mW.inlineScriptLines, decreased: mW.inlineScriptLines < mB.inlineScriptLines, keptBlockLines: iW.lines, otherInlineLines: mW.inlineScriptLines - iW.lines,
        note: 'after = 남긴 서버 연결 블록(`(function(){` ~ `})();`) 줄 수 + 다른 인라인 조각(접속 통계 · ESC 키 처리기) 줄 수' },
      baseline: { lastInlineScriptLines: [lastOf(baselineB), lastOf(baselineJ)], recordedEqualsMeasured: lastOf(baselineJ) === mW.inlineScriptLines },
      guard: { exitCode: guard.status, integrityGateExitCode: gate.status },
      compare: Object.assign({}, cW.counts, { ok: cW.ok, scopeLost: cW.namesFrom ? cW.namesFrom.scopeLost : null, exceptions: cW.guestBoot.exceptions.length, before: cB.counts }),
      fingerprints: { names: { scope: Object.keys(cB.fingerprints.scope).length, window: Object.keys(cB.fingerprints.window).length }, differingScope: fpd('scope'), differingWindow: fpd('window') },
      scenarios: scRows, scenarioCount: scRows.length, scenariosExpected: sc.expected, scenariosAllPassedBoth: sc.allPassedBoth === true && scRows.length === sc.expected,
      moduleLoad: { regressions: cmp.regressions.length, insufficient: cmp.insufficient.map(i => i.file + ': ' + i.note), counts: cmp.counts },
      npmTest: npm, testsEach: { scripts: tW.scripts.length, testFiles: tW.testFiles.length, differing, sameAsBase: differing.length === 0 },
    }, commands };
  wj('measurement.json', out);
  const s = out.summary;
  console.log(JSON.stringify({ wordsOk: s.words.ok, inline: [s.words.inline.statements, s.words.inline.blockLines, s.words.inline.orderSameAsBase, s.words.inline.linesByteIdenticalToBase], boot: [s.words.boot.statements, s.words.boot.callOrderSameAsBase, s.words.boot.bodyIsStatementsOnly, s.words.boot.duplicatedFromInline],
    part: s.words.partition.everyBaseStatementExactlyOnce, eff: s.words.effectOrder.sameAsBase, key: [s.words.serverKey.workLinesByteIdenticalToBase, s.words.serverKey.bootHasNoKeyText], replay: [s.words.replay.rebuiltEqualsWork, s.words.replay.firstDiff, s.words.replay.tagLineIsBasePlusBootTag],
    orderOk: s.order.ok, order: [s.order.plain.events, s.order.plain.eventsSame, s.order.plain.bootCalls, s.order.fakeClient.eventsSame, s.order.themeThenServerLinkThenRest], product: s.changed.productFiles, tests: s.changed.testsChanged.length, vault: s.changed.vaultChanged.length, gen: s.changed.generatorChanged.length,
    spec: [s.spec.kind, s.spec.hasName], inlineLines: [s.inlineScriptLines.before, s.inlineScriptLines.after, s.inlineScriptLines.keptBlockLines, s.inlineScriptLines.otherInlineLines], recorded: s.baseline.recordedEqualsMeasured, guard: s.guard,
    compare: [s.compare.mismatches, s.compare.before.extra, s.compare.extra, s.compare.scopeLost, s.compare.exceptions], fp: [s.fingerprints.differingScope.length, s.fingerprints.differingWindow.length], sc: [s.scenarioCount, s.scenariosAllPassedBoth], ml: s.moduleLoad.regressions, npm: [s.npmTest.same, s.npmTest.base.ok, s.npmTest.work.ok, s.npmTest.work.fail], each: s.testsEach.differing.length }));
  process.exit(0);
}

if (CMD === 'claims') {
  const REQ = opt('--req'), m = rj('measurement.json'), s = m.summary;
  const M = REL + 'measurement.json', C = REL + 'cell-registry-compare.json';
  const scDir = path.join(DIR, 'scenarios'), scs = fs.readdirSync(scDir).filter(f => /\.json$/.test(f)).sort().map(f => ({ file: f, j: JSON.parse(fs.readFileSync(path.join(scDir, f), 'utf8')) }));
  const claims = [];
  scs.forEach((x, i) => claims.push({ id: 'C' + (i + 1), req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior',
    statement: x.j.title + ' — 바뀐 index.html 과 새 부팅 파일은 생성기 설정(proof.json)을 기준 커밋에서 다시 돌린 결과와 바이트 단위로 같다.', touches: ['index.html', BOOT], scenario: 'scenarios/' + x.file, proof: 'proof.json' }));
  let n = scs.length;
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const add = (req, statement, file, p, equals, extra) => {
    const v = getPath(JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8')), p);
    if (JSON.stringify(v) !== JSON.stringify(equals)) { console.error('값 불일치: ' + file + ' ' + p + ' = ' + JSON.stringify(v).slice(0, 200)); process.exit(1); }
    claims.push({ id: 'C' + (++n), req, kind: 'static', domain: 'config', statement, touches: [file].concat(extra || []), check: { type: 'jsonPath', file, path: p, equals } });
  };
  add('R2', '인라인에 남은 문은 전부 기준 IIFE 에 있던 문이고 차례가 기준과 같다.', M, 'summary.words.inline.orderSameAsBase', true);
  add('R2', '인라인에 남은 줄은 기준 index.html 의 그 줄과 바이트 단위로 같다(줄 끝 글자 포함).', M, 'summary.words.inline.linesByteIdenticalToBase', true);
  add('R2', '서버 주소 · 공개 키 선언 두 줄은 작업 index.html 에서 기준 줄과 바이트 단위로 같다.', M, 'summary.words.serverKey.workLinesByteIdenticalToBase', true);
  add('R2', '부팅 파일에는 서버 주소 · 공개 키의 이름도 주소도 키 꼴 글자도 없다.', M, 'summary.words.serverKey.bootHasNoKeyText', true, [BOOT]);
  add('R2', '옵션에 적은 중계 이름은 승인된 한 이름뿐이다.', REL + 'proof.json', 'relay.0.name', 'renderTeamGoalsScreen');
  add('R2', '생성기가 중계로 다룬 이름이 설정에 적은 것과 같다.', M, 'summary.finalize.relayNames', ['renderTeamGoalsScreen']);
  add('R2', '인라인에 남기라고 적은 문은 승인된 서버 연결 세 문뿐이다.', REL + 'proof.json', 'keepInline.statements', KEEP.statements);
  add('R3', '부팅 파일의 문은 전부 기준 IIFE 에 있던 문이다.', M, 'summary.words.boot.everyStatementIsABaseStatement', true, [BOOT]);
  add('R3', '부팅 파일과 인라인에 함께 적힌 문은 키트 손잡이뿐이다.', M, 'summary.words.boot.duplicatedAreHandlesOnly', true);
  add('R3', '부팅 파일의 구역 함수 호출 차례가 기준과 같다.', M, 'summary.words.boot.callOrderSameAsBase', true);
  add('R3', '부팅 파일의 몸통은 문뿐이다(옮긴 문 말고 더한 실행 글자 0).', M, 'summary.words.boot.bodyIsStatementsOnly', true);
  add('R3', '기준 IIFE 의 문은 하나도 빠짐없이 인라인 블록이나 부팅 파일 가운데 한 곳에 있다.', M, 'summary.words.partition.everyBaseStatementExactlyOnce', true);
  add('R3', '값을 읽기만 하는 문을 뺀 문의 차례가 기준 IIFE 와 같다(인라인 블록 뒤에 부팅 파일).', M, 'summary.words.effectOrder.sameAsBase', true);
  add('R3', '기준 index.html 에서 IIFE 의 남긴 줄만 남기고 부팅 파일 태그를 붙이면 작업 index.html 과 줄 단위로 같다(IIFE 밖의 글자 변경 0).', M, 'summary.words.replay.rebuiltEqualsWork', true);
  add('R3', '바뀐 태그 줄은 기준 줄에 부팅 파일 태그만 붙인 것이다.', M, 'summary.words.replay.tagLineIsBasePlusBootTag', true);
  add('R3', '바뀐 제품 파일은 index.html 과 새 부팅 파일 둘뿐이다.', M, 'summary.changed.onlyIndexAndBoot', true);
  add('R4', '시점 탐침: 부팅 동안의 사건 줄(구역 함수 호출 · 상태 정의 · 통로 노출 · window 대입)이 기준과 글자 그대로 같다.', M, 'summary.order.plain.eventsSame', true);
  add('R4', '시점 탐침: 구역 함수가 불린 차례가 기준과 같다.', M, 'summary.order.plain.bootCallsSame', true);
  add('R4', '시점 탐침(가짜 연결 라이브러리): 사건 줄이 기준과 글자 그대로 같다.', M, 'summary.order.fakeClient.eventsSame', true);
  add('R4', '테마 적용 → 서버 연결 → 나머지 구역 함수 호출의 차례가 기준·작업 모두에서 지켜진다.', M, 'summary.order.themeThenServerLinkThenRest', true);
  add('R4', '대조 탐침이 게스트 부팅을 끝내고 report() 를 받아 쓰였다(ok true).', C, 'ok', true);
  add('R4', '대조에서 불일치는 0 이다.', C, 'counts.mismatches', 0);
  add('R4', '통로에서 사라진 이름이 없다.', C, 'namesFrom.scopeLost', []);
  add('R4', '통로 이름마다 잰 값 지문의 차이가 없다.', M, 'summary.fingerprints.differingScope', []);
  add('R4', 'window 이름마다 잰 값 지문의 차이가 없다.', M, 'summary.fingerprints.differingWindow', []);
  add('R5', '인라인 스크립트 줄 수(module-metrics inlineScriptLines)가 기준 트리보다 작다.', M, 'summary.inlineScriptLines.decreased', true);
  add('R5', 'docs/architecture/module-baseline.json 의 마지막 기록 inlineScriptLines 가 작업 트리 측정값과 같다.', M, 'summary.baseline.recordedEqualsMeasured', true);
  add('R5', '부팅 파일의 신고서 종류는 organ 이다.', M, 'summary.spec.kindIsOrgan', true);
  add('R5', '모듈 로드 탐침 결과에서 기준 대비 새 회귀 목록이 비어 있다.', REL + 'module-load.json', 'regressions', []);
  add('R5', 'npm test 를 기준·작업 트리에서 전경으로 끝까지 돌려 종료 코드 0 이고 검사 줄이 같다.', M, 'summary.npmTest.same', true);
  add('R5', '시험을 하나씩 돌린 결과가 기준과 같다.', M, 'summary.testsEach.sameAsBase', true);
  add('R5', 'tests/ 아래 바뀐 파일이 없다.', M, 'summary.changed.testsChanged', []);
  add('R5', 'scripts/ 아래 바뀐 파일이 없다.', M, 'summary.changed.scriptsChanged', []);
  add('R5', '금고 아래 바뀐 파일이 없다.', M, 'summary.changed.vaultChanged', []);
  add('R5', '생성기 · 하네스 · 등록 기관 변경이 없다.', M, 'summary.changed.generatorChanged', []);
  add('R5', '모듈 가드 종료 코드가 0 이다.', M, 'summary.guard.exitCode', 0);
  add('R5', '무결성 게이트 종료 코드가 0 이다.', M, 'summary.guard.integrityGateExitCode', 0);
  wj('claims.json', { task: TASK, requirementsSource: REQ, requirements: [
    { id: 'R1', text: 'index.html 인라인 IIFE 에 남은 시동 문을 생성기(gen-inline-hard.js mode:"finalize" · relay · keepInline)로 부팅 파일 js/app/boot.js 로 옮기고 앱 동작을 보존한다(손 편집은 신고서 종류 한 칸뿐).' },
    { id: 'R2', text: '서버 연결 세 문과, 실행 차례상 그 앞에서 도는 문(테마 적용 호출 · 통로 중계)과 그것들이 읽는 가져오기 · 손잡이는 제자리 인라인에 바이트 그대로 남긴다. 공개 키 글자는 부팅 파일에 없다. 옵션은 승인된 세 자리에만 쓴다.' },
    { id: 'R3', text: '옮긴 문은 글자와 차례가 기준과 같고 빠지거나 더해진 문이 없다. IIFE 밖의 글자는 부팅 파일 태그 하나 말고 바뀌지 않는다. 바뀐 제품 파일은 index.html 과 부팅 파일 둘이다.' },
    { id: 'R4', text: '실행 차례와 값이 같다: 시점 탐침의 사건 줄 동일(테마 적용 → 서버 연결 → 나머지) · 대조 불일치 0 · 사라진 이름 0 · 값 지문 차이 0.' },
    { id: 'R5', text: '증명 하한: 인라인 줄 수 감소와 기준선 기록 · 신고서 종류 · 모듈 로드 새 회귀 0 · npm test 와 시험 하나씩이 기준과 같음 · tests/ · scripts/ · 금고 · 생성기 변경 0.' } ],
    outOfScopeReports: [
      { text: '인라인에 남은 서버 연결 블록을 없애는 일(커밋 훅의 키 금지 규칙 변경이 필요하다 — 금고)은 하지 않는다. 2026-10-11 결심 ①이 그 블록의 잔류를 정했다.', cannotBecause: 'out-of-scope-feature' },
      { text: 'renderTeamGoalsScreen 함수 나누기(주인 세포 800줄 상한)는 덩어리 해체 뒤의 별도 과제다.', cannotBecause: 'out-of-scope-feature' } ],
    claims });
  console.log('claims', claims.length, '· 보존 주장', scs.length);
  process.exit(0);
}
