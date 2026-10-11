'use strict';
// 「finalize 전제까지 남은 것」 실측(작업자 측정, 판정 아님).
//  finalize 의 전제 = IIFE 최상위 문이 키트 손잡이 · 구역 함수 가져오기 · 구역 함수 호출문뿐. 이 도구는 지금 index.html 의 최상위 문을 하나씩 갈라
//  ① 지금 종류 ② 구역 이전 예정인지(구역 계획기 reports/TASK-ES-643/region-plan.cjs 를 지금 main 에 돌린 결과 — 계획기 기준일 뿐, 실제 구역 이전 PR 이 정한다)
//  ③ 구역 이전을 흉내 낸 사본(계획기 --apply)에서 남는 문마다 「무엇이 막고 있고 어떤 단계로 풀리는가」를 적는다.
//  막는 것은 이름의 참조를 따라 잰다: 가져오기 이름을 IIFE 안에서 누가 아직 맨이름으로 쓰는가(함수 선언 · 남는 var · 남는 if) · 등록 기관이 그 이름을 내주는가(대조 탐침의 registeredNames).
// 사용: node finalize-gap.cjs <기준 트리> <구역 모의 트리> <region-plan.json> <대조 탐침 결과.json> <remaining-state.json> <out.json>
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
const [BASE, REGION, PLAN_F, CRC_F, STATE_F, OUT] = process.argv.slice(2);
const rj = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const plan = rj(PLAN_F), registered = new Set(rj(CRC_F).registeredNames || []), stateLeft = rj(STATE_F);
const stateWhy = new Map(); for (const c of stateLeft.byCondition) for (const n of c.names) stateWhy.set(n, { condition: c.condition, unlock: c.unlock });
const MONEY = /(^|[^\w$])OurgoalTemplateCredit($|[^\w$])/, CONFIG = /(^|[^\w$])OURGOAL_CONFIG($|[^\w$])/;

function load(tree) {
  const lines = fs.readFileSync(path.join(tree, 'index.html'), 'utf8').split('\n').map(l => l.replace(/\r$/, ''));
  let s = -1, e = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
  const code = lines.slice(s, e).join('\n');
  const ast = parser.parse(code, { sourceType: 'script', ranges: true });
  let iife = null; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
  const top = iife.get('body').get('body');
  const H = n => n.loc.start.line + s, HE = n => n.loc.end.line + s;
  const text = st => code.slice(st.node.start, st.node.end);
  const oneVar = st => (st.isVariableDeclaration() && st.node.declarations.length === 1 && st.node.declarations[0].id.type === 'Identifier') ? st.node.declarations[0] : null;
  const plain = n => !!n && n.type === 'MemberExpression' && !n.computed && n.object.type === 'Identifier' && n.property.type === 'Identifier';
  const rootWin = n => { let x = n; while (x && x.type === 'MemberExpression' && !x.computed) x = x.object; return !!x && x.type === 'Identifier' && x.name === 'window'; };
  const winChain = n => { let x = n; if (!x || x.type !== 'MemberExpression') return false; while (x.type === 'MemberExpression') { if (x.computed || x.property.type !== 'Identifier') return false; x = x.object; } return x.type === 'Identifier' && x.name === 'window'; }; // 생성기 finalize·unwire(X1)와 같은 손잡이 꼴
  const handles = new Set(); for (const st of top) { const d = oneVar(st); if (d && winChain(d.init)) handles.add(d.id.name); }
  const exposed = new Set();
  const isExpose = st => { const x = st.isExpressionStatement() && st.node.expression; return !!x && x.type === 'CallExpression' && code.slice(x.callee.start, x.callee.end) === 'window.OurgoalAppScope.expose'; };
  for (const st of top) if (isExpose(st)) { const o = st.node.expression.arguments[1]; if (o && o.type === 'ObjectExpression') for (const p of o.properties) if (p.type === 'ObjectMethod' && p.key.type === 'Identifier') exposed.add(p.key.name); }
  const kindOf = st => {
    const n = st.node, d = oneVar(st);
    if (n.type === 'FunctionDeclaration') return 'functionDecl';
    if (d && winChain(d.init)) return 'kitHandle';
    if (d && plain(d.init) && handles.has(d.init.object.name)) return 'kitImport';
    if (n.type === 'VariableDeclaration') return n.declarations.some(x => x.id.type === 'Identifier' && exposed.has(x.id.name)) ? 'varExposed' : 'varNotExposed';
    if (isExpose(st)) return 'exposeCall';
    if (n.type === 'ExpressionStatement') {
      const x = n.expression;
      if (x.type === 'CallExpression' && /^window\.OurgoalAppState\.(define|defineVar)$/.test(code.slice(x.callee.start, x.callee.end))) return 'stateDefine';
      if (x.type === 'CallExpression' && x.callee.type === 'Identifier') return 'callBare';
      if (x.type === 'CallExpression') return 'callOther';
      if (x.type === 'AssignmentExpression' && x.left.type === 'MemberExpression' && rootWin(x.left)) return 'windowAssign';
      return 'exprOther';
    }
    if (n.type === 'IfStatement') return 'if';
    if (n.type === 'TryStatement') return 'try';
    return n.type;
  };
  return { lines, s, e, code, ast, iife, top, H, HE, text, oneVar, plain, kindOf, exposed, handles, iScope: iife.scope };
}
const tally = () => ({ statements: 0, lines: 0 });
const add = (o, k, st, d) => { o[k] = o[k] || tally(); o[k].statements++; o[k].lines += d.HE(st.node) - d.H(st.node) + 1; };

// ── ① · ② 지금 main: 종류별 · 구역 이전 예정
const b = load(BASE);
const inRegion = st => plan.regions.some(r => b.H(st.node) >= r.firstLine && b.H(st.node) <= r.lastLine);
const now = {}, nowPlanned = {};
for (const st of b.top) { const k = b.kindOf(st); add(now, k, st, b); if (inRegion(st)) add(nowPlanned, k, st, b); }
const nowRows = Object.keys(now).sort().map(k => ({ kind: k, statements: now[k].statements, lines: now[k].lines, regionPlanned: (nowPlanned[k] || tally()).statements, regionPlannedLines: (nowPlanned[k] || tally()).lines, left: now[k].statements - (nowPlanned[k] || tally()).statements }));

// ── ③ 구역 이전을 흉내 낸 사본: 남는 문과 막는 것
const r = load(REGION);
const BODY = r.iife.node.body;
const topOf = p => p.find(q => q.listKey === 'body' && q.parent === BODY);
const kinds = new Map(r.top.map(st => [st.node, r.kindOf(st)]));
const called = new Set(); for (const st of r.top) if (kinds.get(st.node) === 'callBare' && st.node.expression.arguments.length === 0) called.add(st.node.expression.callee.name);
const refsOf = name => { const bnd = r.iScope.getBinding(name); if (!bnd) return []; return bnd.referencePaths.concat(bnd.constantViolations).map(p => { const t = topOf(p); return t ? { kind: kinds.get(t.node), line: r.H(t.node), fn: t.node.type === 'FunctionDeclaration' ? t.node.id.name : null, stmt: t.node } : { kind: '?', line: 0 }; }); };
const residual = [];
const push = (row) => residual.push(row);
const fnDecls = r.top.filter(st => kinds.get(st.node) === 'functionDecl');
// 가져오기
const imp = { regionFn: [], unwireReady: [], deadImport: [], needRegister: [], byFunction: [], byOther: [] };
for (const st of r.top) {
  if (kinds.get(st.node) !== 'kitImport') continue;
  const name = r.oneVar(st).id.name;
  if (called.has(name)) { imp.regionFn.push(name); continue; }
  const refs = refsOf(name).filter(x => x.kind !== 'exposeCall');
  if (!refs.length) (registered.has(name) ? imp.unwireReady : r.exposed.has(name) ? imp.needRegister : imp.deadImport).push(name);
  else if (refs.every(x => x.kind === 'functionDecl')) imp.byFunction.push({ name, registered: registered.has(name), users: [...new Set(refs.map(x => x.fn))] });
  else imp.byOther.push({ name, registered: registered.has(name), users: [...new Set(refs.map(x => x.kind + '@' + x.line))] });
}
// expose 문의 getter·setter 가 가리키는 이름
const getters = { import: 0, stateVar: 0, functionDecl: 0, otherVar: 0, missing: 0, names: { functionDecl: [], otherVar: [], missing: [] } };
let exposeStmts = 0, exposeLines = 0;
for (const st of r.top) {
  if (kinds.get(st.node) !== 'exposeCall') continue; exposeStmts++; exposeLines += r.HE(st.node) - r.H(st.node) + 1;
  const o = st.node.expression.arguments[1]; const seen = new Set();
  for (const p of (o && o.properties) || []) { if (p.type !== 'ObjectMethod' || p.kind !== 'get') continue; const n = p.key.name; if (seen.has(n)) continue; seen.add(n);
    const bnd = r.iScope.getBinding(n), decl = bnd && bnd.path.findParent(q => q.listKey === 'body' && q.parent === BODY) || (bnd && bnd.path);
    const k = !bnd ? 'missing' : bnd.path.isFunctionDeclaration() ? 'functionDecl' : (decl && kinds.get(decl.node) === 'kitImport') ? 'import' : (decl && kinds.get(decl.node) === 'varExposed') ? 'stateVar' : 'otherVar';
    getters[k]++; if (getters.names[k]) getters.names[k].push(n); }
}
// 남는 var · if · window 대입 — 하나씩
const items = [];
for (const st of r.top) {
  const k = kinds.get(st.node); if (['kitHandle', 'kitImport', 'exposeCall', 'functionDecl'].includes(k)) continue;
  if (k === 'callBare' && st.node.expression.arguments.length === 0 && r.iScope.getBinding(st.node.expression.callee.name) && kinds.get((r.iScope.getBinding(st.node.expression.callee.name).path.parentPath || {}).node) === 'kitImport') continue; // 구역 함수 호출문
  const t = r.text(st), names = st.node.type === 'VariableDeclaration' ? st.node.declarations.map(d => d.id.name) : [];
  let stage, how, sw = names.map(n => stateWhy.get(n)).find(Boolean);
  if (CONFIG.test(t)) { stage = '결심 필요'; how = '`OURGOAL_CONFIG`(빈 설정 객체 선언 · window 복사 줄)는 지시함 「결심 대기」 항목이다(설계 8.1 — 묶음 3 표에 없던 돈 근처 후보). 결심 전에는 구역에 넣지 않는다'; }
  else if (MONEY.test(t)) { stage = '결심 필요'; how = '돈 근처 `OurgoalTemplateCredit.init` 블록. 허용 한도는 「글자를 한 글자도 바꾸지 않고 자리만」인데, 구역 감싸기는 IIFE 이름에 `L.` 접두를 붙여 한도 밖이다(설계 3.4). 후보: ① 한도에 「`L.` 접두」를 넣는 결심(#917 은 함수 이전에서 접두를 한도 안으로 봤다) ② 접두가 붙지 않게 블록이 읽는 이름을 먼저 window/키트 경유로 바꾸는 고치기 PR'; }
  else if (/SHARED_GROUPS_LOADED/.test(t)) { stage = '결심 필요'; how = '모듈 가드 ⑤(`scripts/module-metrics.js` #TASK-ES-507)가 「index.html 인라인이 window 에 다는 이름」을 인라인 소유로 세어 탭 간 참조에서 뺀다. 이 줄이 세포로 가면 가드가 실패한다 — 가드 규칙(부팅 파일도 인라인 소유로 본다)을 고치는 선행 PR 이 필요하고, 가드·그 시험을 바꾸는 일이라 승인 사안이다'; }
  else if (names.includes('btnAvLvClose')) { stage = '결심 필요'; how = '이 문 바로 앞 표지 주석의 `filterHarmfulWords` 글자를 `tests/avatar-10slots-growth.test.js` 가 index.html 에서 찾는다. 구역에 넣으면 앞 주석이 따라가 글자가 사라진다 — 시험이 읽는 범위를 합본으로 넓히는 시험지 선행 PR(tests/ 변경, 단언·기대값 0 변경 — L021)이 먼저다'; }
  else if (names.some(n => /^SUPABASE_(URL|ANON_KEY)$/.test(n))) { stage = '상태 이전 뒤 구역 이전'; how = '`sb` 선언의 초기값이 이 두 상수를 읽는다(구역 밖에서 쓰는 var). `sb` 가 상태 기관으로 가면(`define(\'sb\', 초기값)` 줄이 되어 구역에 들 수 있다) 세 줄이 한 구역에 들어 두 상수는 그 구역 함수의 지역 변수가 된다. 키 글자는 그대로 옮겨질 뿐이지만 접속 키라 그 PR 에서 따로 확인한다'; }
  else if (sw) { const cond = sw.condition; stage = /시험이/.test(cond) ? '결심 필요' : /맨이름 참조/.test(cond) ? '상태 이전(막는 코드가 옮겨진 뒤)' : '방법 미정'; how = cond + ' → ' + sw.unlock; }
  else if (k === 'windowAssign') { stage = '방법 미정'; how = '상태 선언과 한 줄을 나눠 쓰는 window 복사 줄(`shareContent`). 후보: ① 줄을 나누는 선행 PR(글자 이동만 — 순증가 1줄이라 index.html 순증가 0 규칙과 부딪친다. 같은 PR 에서 다른 줄을 줄여야 한다) ② X5·X6 의 「다른 글자와 한 줄」 정지를 이 꼴(선언 + 자기 window 복사)에 한해 푸는 결심'; }
  else { stage = '방법 미정'; how = '분류되지 않은 문 — 해당 PR 이 다시 잰다'; }
  const blockedBy = [...new Set(names.flatMap(n => refsOf(n).filter(x => x.stmt !== st.node && x.kind !== 'exposeCall').map(x => x.fn ? '함수 ' + x.fn : x.kind + '@' + x.line)))];
  items.push({ line: r.H(st.node), endLine: r.HE(st.node), lines: r.HE(st.node) - r.H(st.node) + 1, kind: k, names, stage, how, bareUsers: blockedBy, text: t.split('\n')[0].replace(/'[A-Za-z0-9_.\-]{40,}'/g, "'(가림)'").slice(0, 90) });
}
// 944줄 함수가 맨이름으로 쓰는 IIFE 이름(그 함수가 조각으로 옮겨질 때 통로로 읽게 될 이름들)
const fnUses = fnDecls.map(st => { const names = new Set(); st.traverse({ Identifier(p) { if (!p.isReferencedIdentifier() && !(p.parentPath.isAssignmentExpression() && p.key === 'left') && !p.parentPath.isUpdateExpression()) return; const bnd = p.scope.getBinding(p.node.name); if (bnd && bnd.scope === r.iScope && p.node.name !== st.node.id.name) names.add(p.node.name); } });
  const byKind = {}; for (const n of names) { const bnd = r.iScope.getBinding(n), d = bnd.path.findParent(q => q.listKey === 'body' && q.parent === BODY) || bnd.path; const k = kinds.get(d.node) || 'functionDecl'; byKind[k] = (byKind[k] || 0) + 1; }
  return { name: st.node.id.name, lines: r.HE(st.node) - r.H(st.node) + 1, iifeNamesUsed: names.size, byKind, stateNames: [...names].filter(n => stateWhy.has(n)).sort() }; });

const handles = r.top.filter(st => kinds.get(st.node) === 'kitHandle');
const handleRows = handles.map(st => { const name = r.oneVar(st).id.name; const imps = r.top.filter(x => kinds.get(x.node) === 'kitImport' && r.oneVar(x).init.object.name === name).map(x => r.oneVar(x).id.name); return { name, imports: imps.length, regionFnImports: imps.filter(n => called.has(n)).length, otherImports: imps.filter(n => !called.has(n)).length }; });
const sumLines = arr => arr.reduce((a, x) => a + x.lines, 0);
const byStage = {}; for (const it of items) { byStage[it.stage] = byStage[it.stage] || { statements: 0, lines: 0 }; byStage[it.stage].statements++; byStage[it.stage].lines += it.lines; }
const out = { tool: 'reports/TASK-ES-662/tools/finalize-gap.cjs', type: '작업자 측정, 판정 아님',
  note: '구역 이전 예정은 구역 계획기(reports/TASK-ES-643/region-plan.cjs)를 지금 main 에 돌린 결과다 — 실제 구역 이전 PR(#TASK-ES-650, 병합 전)이 구역을 다르게 잡으면 달라진다. 「남는 것」은 그 계획을 저장소 밖 작업 폴더에 흉내 낸 사본에서 쟀다.',
  now: { scriptHtmlLines: [b.s, b.e + 1], iifeLines: b.e - b.s, topStatements: b.top.length, byKind: nowRows, regionPlan: { regions: plan.regions.length, statements: plan.totals.statementsInRegions, statementLines: plan.totals.statementLinesInRegions, generatorOk: plan.generator.ok } },
  afterRegion: { topStatements: r.top.length, htmlLines: r.lines.length,
    finalizeOk: { kitHandles: handles.length, regionFunctionImports: imp.regionFn.length, regionFunctionCalls: r.top.filter(st => kinds.get(st.node) === 'callBare' && called.has(st.node.expression.callee.name)).length },
    handles: handleRows,
    imports: { total: r.top.filter(st => kinds.get(st.node) === 'kitImport').length, regionFunction: imp.regionFn.length,
      unwireReady: { count: imp.unwireReady.length, stage: '재철거(unwire U1·U2 — 구역 이전 뒤)', names: imp.unwireReady },
      deadImport: { count: imp.deadImport.length, stage: '재철거(unwire U1 — 구역 이전 뒤)', how: '통로 getter 도 없고 IIFE 안 참조도 없다 — 가져오기 줄만 남았다', names: imp.deadImport },
      needRegister: { count: imp.needRegister.length, stage: '등록 → 재철거', how: '참조는 통로 getter 뿐인데 등록 기관이 이 이름을 내주지 않는다. 그 세포에 등록 블록을 달아(생성기 gen-cell-provide.js — 세포 파일 변경 PR) 대조 0 을 본 뒤 재철거', names: imp.needRegister },
      usedByFunction: { count: imp.byFunction.length, stage: '944줄 3단계 뒤 재철거', how: '남은 함수 선언이 이 이름을 맨이름으로 부른다. 함수가 조각으로 옮겨지면 통로(L.)로 읽게 되어 가져오기가 풀린다', registered: imp.byFunction.filter(x => x.registered).length, notRegistered: imp.byFunction.filter(x => !x.registered).map(x => x.name), names: imp.byFunction.map(x => x.name) },
      usedByOther: { count: imp.byOther.length, stage: '막는 문이 풀린 뒤 재철거', items: imp.byOther } },
    expose: { statements: exposeStmts, lines: exposeLines, getters: { toImports: getters.import, toStateVars: getters.stateVar, toFunctionDecl: getters.functionDecl, toOtherVars: getters.otherVar, toMissing: getters.missing }, names: getters.names,
      stage: '가져오기 이름의 getter 는 재철거(U2), 상태 이름의 getter 는 상태 이전(X4), 함수 선언의 getter 는 그 함수가 옮겨질 때 가져오기로 바뀐 뒤 재철거' },
    functionDecls: fnUses.map(f => Object.assign(f, { stage: '944줄 3단계', how: 'A안(설계 6.3): 안전망 시험 → 제자리 다섯 조각(고치기 PR, #TASK-ES-646 진행 중) → 조각별 옮기기' })),
    others: { statements: items.length, lines: sumLines(items), byStage, items } },
  stateNames: { source: path.basename(STATE_F) + ' (#TASK-ES-649 측정)', leftInIife: stateLeft.totals.stateNamesLeftInIife, byCondition: stateLeft.byCondition.map(c => ({ condition: c.condition, count: c.count, names: c.names, unlock: c.unlock })) } };
// 줄 합 대조: 구역 모의 사본의 최상위 문 = 손잡이 + 가져오기 + expose + 함수 선언 + 구역 호출 + 그 밖
const calls = out.afterRegion.finalizeOk.regionFunctionCalls;
out.afterRegion.sumCheck = { handles: handles.length, imports: out.afterRegion.imports.total, expose: exposeStmts, functionDecls: fnDecls.length, regionCalls: calls, others: items.length, sum: handles.length + out.afterRegion.imports.total + exposeStmts + fnDecls.length + calls + items.length, topStatements: r.top.length };
out.afterRegion.sumCheck.ok = out.afterRegion.sumCheck.sum === r.top.length;
const I = out.afterRegion.imports; I.sumOk = I.regionFunction + I.unwireReady.count + I.deadImport.count + I.needRegister.count + I.usedByFunction.count + I.usedByOther.count === I.total;
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ now: { top: b.top.length, rows: nowRows.map(x => x.kind + ':' + x.statements + '/' + x.regionPlanned) }, after: { top: r.top.length, ok: out.afterRegion.finalizeOk, imports: { total: I.total, regionFn: I.regionFunction, ready: I.unwireReady.count, dead: I.deadImport.count, needReg: I.needRegister.count, byFn: I.usedByFunction.count, byFnNotReg: I.usedByFunction.notRegistered.length, byOther: I.usedByOther.count, sumOk: I.sumOk }, expose: out.afterRegion.expose.getters, exposeStmts, fn: fnUses, others: byStage, sum: out.afterRegion.sumCheck } }));
