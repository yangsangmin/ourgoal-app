#!/usr/bin/env node
'use strict';
// #TASK-ES-679 「finalize 전제까지 남은 것」 조사(작업자 측정 도구, 판정 아님).
// finalize(닫힌 목록 X9 — docs/architecture/CELL-REGISTRY-DESIGN.md 5.8절)의 전제 = 인라인 IIFE 의 최상위 문이 세 종류뿐:
//   ① 키트 손잡이 `var _k = window.X;`  ② 구역 함수 가져오기 `var f = _k.f;`(최상위에서 한 번 이상 불림)  ③ 구역 함수 호출문 `f();`
// 이 도구는 지금 index.html 의 최상위 문을 하나씩 갈라 종류별 문 수·줄 수를 세고, 전제를 막는 종류마다 풀리는 조건을 적는다.
// 판단의 정본은 생성기다 — 저장소 밖 임시 사본에 생성기 finalize 를 돌려 그 오류 글자(종류별 수)를 함께 싣는다(작업 트리는 건드리지 않는다).
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-679/tools/finalize-gap-679.cjs <트리> <out.json>
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const TREE = path.resolve(process.argv[2] || '.'), OUT = process.argv[3];
if (!OUT) { console.error('사용: node finalize-gap-679.cjs <트리> <out.json>'); process.exit(2); }
const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
const L = fs.readFileSync(path.join(TREE, 'index.html'), 'utf8').split('\n').map(l => l.replace(/\r$/, ''));
let s = -1, e = -1;
for (let i = 0; i < L.length; i++) if (L[i].trim() === '<script>' && (L[i + 1] || '').trim() === '(function(){' && (L[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
for (let i = s; i < L.length; i++) if (L[i].startsWith('</script>')) { e = i; break; }
const ast = parser.parse(L.slice(s, e).join('\n'), { sourceType: 'script' });
let iife = null; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const top = iife.get('body').get('body');
const rootWin = n => { let x = n; while (x && x.type === 'MemberExpression' && !x.computed) x = x.object; return !!x && x.type === 'Identifier' && x.name === 'window'; };
const oneVar = st => (st.isVariableDeclaration() && st.node.declarations.length === 1 && st.node.declarations[0].id.type === 'Identifier') ? st.node.declarations[0] : null;
const handles = new Map();
for (const st of top) { const d = oneVar(st); if (d && d.init && d.init.type === 'MemberExpression' && rootWin(d.init)) handles.set(d.id.name, { line: st.node.loc.start.line + s, uses: 0 }); }
const imports = new Map();
for (const st of top) { const d = oneVar(st); if (d && d.init && d.init.type === 'MemberExpression' && !d.init.computed && d.init.object.type === 'Identifier' && handles.has(d.init.object.name)) { imports.set(d.id.name, { line: st.node.loc.start.line + s, kit: d.init.object.name, sameName: d.init.property.name === d.id.name, topCalls: 0, otherRefs: 0 }); handles.get(d.init.object.name).uses++; } }
// 최상위 호출문 `f();`(인자 없음 · 가져온 이름)
const isPlainCall = st => { const x = st.isExpressionStatement() && st.node.expression; return !!x && x.type === 'CallExpression' && x.callee.type === 'Identifier' && x.arguments.length === 0 && imports.has(x.callee.name); };
for (const st of top) if (isPlainCall(st)) imports.get(st.node.expression.callee.name).topCalls++;
// 가져온 이름의 그 밖의 참조(함수 선언 본문 · expose getter · 다른 문)
traverse(ast, { Identifier(p) { const im = imports.get(p.node.name); if (!im || !p.isReferencedIdentifier()) return; const b = p.scope.getBinding(p.node.name); if (!b || b.scope.block !== iife.node) return; const par = p.parentPath; if (par.isCallExpression() && par.node.callee === p.node && par.parentPath.isExpressionStatement() && par.parentPath.parentPath === iife.get('body')) return; im.otherRefs++; } });
const isExpose = st => { const x = st.isExpressionStatement() && st.node.expression; return !!x && x.type === 'CallExpression' && x.callee.type === 'MemberExpression' && !x.callee.computed && x.callee.property.name === 'expose'; };
const isDefine = st => { const x = st.isExpressionStatement() && st.node.expression; return !!x && x.type === 'CallExpression' && x.callee.type === 'MemberExpression' && !x.callee.computed && /^define(Var)?$/.test(x.callee.property.name || '') && x.callee.object.type === 'MemberExpression' && x.callee.object.property.name === 'OurgoalAppState'; };
const KINDS = {
  handle: { label: '키트 손잡이', allowed: true },
  regionImport: { label: '구역 함수 가져오기(최상위에서 불림)', allowed: true },
  regionCall: { label: '구역 함수 호출문', allowed: true },
  otherImport: { label: '그 밖의 가져오기(최상위에서 불리지 않음)', allowed: false, unlock: '재철거(unwire U1) — 그 이름을 IIFE 안에서 맨이름으로 쓰는 곳(남은 함수 선언 · expose getter)이 없어지고 등록 기관이 그 이름을 내주면 지운다. 남은 함수 여섯이 세포로 옮겨지면 대부분 풀린다' },
  expose: { label: 'expose 문(통로 getter·setter)', allowed: false, unlock: '재철거(unwire U2) — 등록된 이름의 getter 를 지운다. 상태 이름(state · _promptEncyclopediaOpen)의 getter·setter 는 그 이름의 상태 이전 때 지워진다' },
  functionDecl: { label: '함수 선언', allowed: false, unlock: '함수 이전 — 전문 템플릿 기록 창 조각 여섯을 세포로(944줄 함수 3단계, 다른 작업이 진행 중)' },
  stateVar: { label: '상태 선언(var)', allowed: false },
  define: { label: '상태 기관 정의 줄(define)', allowed: false },
  ifStmt: { label: 'if 문', allowed: false },
  windowAssign: { label: 'window 대입', allowed: false },
  otherCall: { label: '구역 함수가 아닌 호출문', allowed: false, unlock: '구역 이전 또는 재철거' },
  other: { label: '그 밖', allowed: false, unlock: '문마다 따로 본다' } };
const rows = [];
for (const st of top) {
  // 줄의 글자를 옮겨 적을 때 긴 문자열 값은 가린다(키·주소 같은 값을 보고 파일에 복사하지 않는다)
  const a = st.node.loc.start.line + s, b = st.node.loc.end.line + s, text = L[a - 1].trim().replace(/'[^']{24,}'?/g, m => "'…(" + (m.length - 2) + "자 가림)'").replace(/"[^"]{24,}"?/g, m => '"…(' + (m.length - 2) + '자 가림)"').slice(0, 110), d = oneVar(st);
  let kind = 'other', why = null;
  if (d && handles.has(d.id.name)) kind = 'handle';
  else if (d && imports.has(d.id.name)) { const im = imports.get(d.id.name); kind = im.topCalls > 0 && im.sameName ? 'regionImport' : 'otherImport'; }
  else if (isPlainCall(st)) kind = 'regionCall';
  else if (isExpose(st)) kind = 'expose';
  else if (isDefine(st)) kind = 'define';
  else if (st.isFunctionDeclaration()) kind = 'functionDecl';
  else if (st.isVariableDeclaration()) kind = 'stateVar';
  else if (st.isIfStatement()) kind = 'ifStmt';
  else if (st.isExpressionStatement() && st.node.expression.type === 'AssignmentExpression' && rootWin(st.node.expression.left)) kind = 'windowAssign';
  else if (st.isExpressionStatement() && st.node.expression.type === 'CallExpression') kind = 'otherCall';
  rows.push({ kind, line: a, endLine: b, lines: b - a + 1, name: st.isFunctionDeclaration() ? st.node.id.name : (d ? d.id.name : (isDefine(st) ? st.node.expression.arguments[0].value : (isPlainCall(st) ? st.node.expression.callee.name : null))), text });
}
// 문마다의 사유(이 PR 이 옮기지 못한 까닭)
const SERVER_KEY = '공개 키 글자가 든 선언 줄을 새 파일에 더하는 커밋을 금지 패턴 규칙(docs/rules/rules.json 의 HARDCODED_SECRET — 대상 파일 전부, 금고)이 막는다(이 작업에서 커밋 훅이 실제로 막았다). 서버 주소 · 공개 키 선언과 그 둘을 읽는 sb 정의 줄은 한 묶음이라 셋 다 제자리에 뒀다 — 그 규칙에 이 줄의 예외를 두거나 키를 두는 자리를 따로 정하는 결심(규범 변경)이 있어야 구역으로 옮길 수 있다';
const PIN = {
  SUPABASE_URL: SERVER_KEY, SUPABASE_ANON_KEY: SERVER_KEY, sb: SERVER_KEY,
  state: '상태 이전 4차(#TASK-ES-679)로 var 선언이 상태 기관 정의 줄이 된다. 그 정의 줄은 구역 이전 3차(재철거 3차 병합 뒤)로 구역 함수에 넣는다',
  _promptEncyclopediaOpen: '상태 이전 4차(#TASK-ES-679)로 var 선언이 상태 기관 정의 줄이 된다. 그 정의 줄은 구역 이전 3차(재철거 3차 병합 뒤)로 구역 함수에 넣는다' };
for (const r of rows) {
  if (r.kind === 'stateVar' || r.kind === 'define') r.why = PIN[r.name] || null;
}
const byKind = Object.keys(KINDS).map(k => { const rs = rows.filter(r => r.kind === k); return { kind: k, label: KINDS[k].label, allowedByFinalize: KINDS[k].allowed, statements: rs.length, lines: rs.reduce((a, r) => a + r.lines, 0), unlock: KINDS[k].unlock || (rs.some(r => r.why) ? '문마다 다르다 — items 의 why' : null),
  items: KINDS[k].allowed || k === 'otherImport' ? undefined : rs.map(r => ({ line: r.line, lines: r.lines, name: r.name, text: r.text, why: r.why || undefined })) }; }).filter(x => x.statements > 0);
// 생성기의 판단(정본): 임시 사본에 finalize 를 돌려 오류 글자를 받는다
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'finalize-gap-679-'));
let gen = { exitCode: null, message: null };
try {
  fs.copyFileSync(path.join(TREE, 'index.html'), path.join(tmp, 'index.html')); fs.mkdirSync(path.join(tmp, 'js', 'app'), { recursive: true });
  const cfgFile = path.join(tmp, 'finalize.json');
  fs.writeFileSync(cfgFile, JSON.stringify({ task: 'TASK-ES-679', mode: 'finalize', label: '전제 조사(임시 사본 — 쓰지 않는다)', cells: [{ file: 'js/app/boot.js', title: 'OurGoal App Boot (전제 조사)', desc: ['전제 조사용 임시 설정'] }] }), { encoding: 'utf8' });
  const r = cp.spawnSync(process.execPath, [path.join(TREE, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js'), tmp, cfgFile], { cwd: TREE, encoding: 'utf8', env: Object.assign({}, process.env, { MODULE_SPLIT_OUT: tmp }) });
  const txt = ((r.stderr || '') + '\n' + (r.stdout || '')).split('\n').map(x => x.trim()).filter(Boolean);
  gen = { exitCode: r.status, message: (txt.find(x => /finalize|전제/.test(x)) || txt[0] || '').slice(0, 900), wroteBootFile: fs.existsSync(path.join(tmp, 'js', 'app', 'boot.js')) };
} finally { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ } }
const unstatePreview = {};
{ const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), 'finalize-gap-679-u-'));
  try { for (const r of rows.filter(x => x.kind === 'stateVar')) { fs.copyFileSync(path.join(TREE, 'index.html'), path.join(tmp2, 'index.html')); const c = path.join(tmp2, 'cfg.json');
      fs.writeFileSync(c, JSON.stringify({ task: 'TASK-ES-679', slot: 'HO', mode: 'unstate', cells: [{ file: 'js/core/app-state.js' }], unstate: { names: [r.name] } }), { encoding: 'utf8' });
      const q = cp.spawnSync(process.execPath, [path.join(TREE, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js'), tmp2, c], { cwd: TREE, encoding: 'utf8', env: Object.assign({}, process.env, { MODULE_SPLIT_OUT: tmp2 }) });
      const lines2 = ((q.status === 0 ? q.stdout : q.stderr) || '').split('\n').map(x => x.trim()).filter(Boolean);
      unstatePreview[r.name] = { movable: q.status === 0, generatorSays: (q.status === 0 ? lines2[0] : (lines2.find(x => /^Error:/.test(x)) || lines2[0] || '')).slice(0, 220) }; } }
  finally { try { fs.rmSync(tmp2, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ } } }
const blocking = byKind.filter(x => !x.allowedByFinalize), allowed = byKind.filter(x => x.allowedByFinalize);
const unusedHandles = [...handles].filter(([, h]) => h.uses === 0).map(([n]) => n);
const out = { tool: 'reports/TASK-ES-679/tools/finalize-gap-679.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), iifeHtmlLines: [s + 1, e], topStatements: rows.length,
  generator: gen, totals: { allowedStatements: allowed.reduce((a, x) => a + x.statements, 0), allowedLines: allowed.reduce((a, x) => a + x.lines, 0), blockingStatements: blocking.reduce((a, x) => a + x.statements, 0), blockingLines: blocking.reduce((a, x) => a + x.lines, 0) },
  byKind, unstatePreview, otherImports: { count: rows.filter(r => r.kind === 'otherImport').length, withNoReferenceLeft: [...imports].filter(([, im]) => im.topCalls === 0 && im.otherRefs === 0).map(([n]) => n), note: 'withNoReferenceLeft = IIFE 안에서 더는 아무도 쓰지 않는 가져오기 이름(재철거가 바로 지울 수 있는 것 — 등록 여부는 재철거가 본다)' }, unusedHandles,
  note: '줄 번호는 이 트리의 index.html 기준이다(main 이 움직이면 바뀐다). 줄 수는 문이 차지하는 줄만 센 것이고 주석·빈 줄은 뺐다(sweep 이 지운다).' };
fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
fs.writeFileSync(path.resolve(OUT), JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ unstatePreview, top: out.topStatements, totals: out.totals, byKind: byKind.map(x => [x.label, x.statements, x.lines]), gen, noRef: out.otherImports.withNoReferenceLeft.length, unusedHandles }));
