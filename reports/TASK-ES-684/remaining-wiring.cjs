#!/usr/bin/env node
'use strict';
// 인라인 IIFE 에 남은 배선 재기(작업자 측정 도구, 판정 아님) — reports/TASK-ES-630/remaining-wiring.cjs 를 가져와 한 가지를 고쳤다(#TASK-ES-632: 가져오기 줄만 남은 이름의 분류).
// 지금 index.html 의 IIFE 최상위를 @babel/parser 로 읽어, 세포가 등록 기관에 등록한 이름(reports/TASK-ES-614/provide-plan.json registered) 가운데
// 가져오기 줄 · 통로 getter 줄 · window 대입 줄이 아직 남은 이름을 이유별로 가른다.
//   시험이 붙잡음      지금 시험 소스에 그 이름의 배선 글자가 있다(<지금 다시 돌린 pinned-names 결과>)
//   시험에서 풀림      TASK-ES-614 때는 붙잡혀 계획에서 뺐는데 지금은 시험 소스에 그 글자가 없다(시험지 수정 #900·#901 뒤) — 이제 지울 수 있다
//   한 줄 나눠 쓰기    window 대입이 다른 글자와 한 줄을 나눠 쓴다(설계 5.2 X3 — sharedLine)
//   가져오기 줄만 남음  getter·window 줄은 없고, IIFE 안 다른 코드가 맨이름으로 써서 가져오기 줄만 남았다(함수 이전·구역 이전 뒤 풀림)
//   그 밖              위 어디에도 들지 않는 것(이유를 따로 적는다)
// 등록되지 않은 이름(IIFE 소유 — 함수·상태·DOM 참조)의 getter·window 줄과, 손잡이 줄(`var _k = window.…;`)의 남은 참조 수도 센다(참조 0 = X2 dropKitVar 로 지울 수 있다).
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-632/remaining-wiring.cjs <트리> <지금의 pinned-names.json> <out.json> [pinned-release-mock.json]
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
const ROOT = path.resolve(process.argv[2]), PIN_NOW = JSON.parse(fs.readFileSync(path.resolve(process.argv[3]), 'utf8')), OUT = path.resolve(process.argv[4]);
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/TASK-ES-684/registered-now.json'), 'utf8')); // [#TASK-ES-680] 등록 3차(#950) 뒤라 지금의 등록 블록에서 읽은 목록을 쓴다(registered-now.cjs)
const pinOld = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/TASK-ES-614/pinned-names.json'), 'utf8')).pinned;
const REG = {}; plan.registered.forEach(r => { REG[r.name] = r; });
const lines = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').split('\n').map(l => l.replace(/\r$/, ''));
let s = -1, e = -1;
for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
const off = s, code = lines.slice(s, e).join('\n'), ast = parser.parse(code, { sourceType: 'script', ranges: true });
let iife = null; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const top = iife.get('body').get('body'), H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off, src = n => code.slice(n.start, n.end);
const isWA = x => x && x.type === 'AssignmentExpression' && x.operator === '=' && x.left.type === 'MemberExpression' && !x.left.computed && x.left.object.type === 'Identifier' && x.left.object.name === 'window' && x.left.property.type === 'Identifier';
const isSeq = x => x && x.type === 'SequenceExpression' && x.expressions.every(isWA);
const rootWin = n => { let x = n; while (x && x.type === 'MemberExpression') x = x.object; return x && x.type === 'Identifier' && x.name === 'window'; };
const handles = {}, imports = {}, getters = {}, wins = {};
for (const st of top) { // 손잡이 먼저
  if (!st.isVariableDeclaration() || st.node.declarations.length !== 1) continue;
  const d = st.node.declarations[0];
  if (d.id.type === 'Identifier' && /^_/.test(d.id.name) && d.init && d.init.type === 'MemberExpression' && rootWin(d.init)) handles[d.id.name] = { line: H(st.node), path: src(d.init) };
}
const addWin = (x, line, shared) => { const n = x.left.property.name; (wins[n] = wins[n] || []).push({ line, rhs: x.right.type === 'Identifier' ? x.right.name : null, rhsType: x.right.type, shared }); };
for (const st of top) {
  const n = st.node, ex = st.isExpressionStatement() ? n.expression : null;
  if (st.isVariableDeclaration() && n.declarations.length === 1) {
    const d = n.declarations[0];
    if (d.id.type === 'Identifier' && d.init && d.init.type === 'MemberExpression' && !d.init.computed && d.init.object.type === 'Identifier' && handles[d.init.object.name] && d.init.property.type === 'Identifier' && d.init.property.name === d.id.name) imports[d.id.name] = { kitVar: d.init.object.name, line: H(n) };
  } else if (ex && ex.type === 'CallExpression' && ex.callee.type === 'MemberExpression' && !ex.callee.computed && ex.callee.property.name === 'expose' && ex.arguments.length === 2 && ex.arguments[1].type === 'ObjectExpression') {
    for (const p of ex.arguments[1].properties) if (p.type === 'ObjectMethod' && !p.computed && p.key.type === 'Identifier' && (p.kind === 'get' || p.kind === 'set')) {
      const ret = p.kind === 'get' && p.body.body.length === 1 && p.body.body[0].type === 'ReturnStatement' && p.body.body[0].argument && p.body.body[0].argument.type === 'Identifier' ? p.body.body[0].argument.name : null;
      (getters[p.key.name] = getters[p.key.name] || []).push({ line: p.loc.start.line + off, kind: p.kind, returns: ret });
    }
  } else if (ex && (isWA(ex) || isSeq(ex))) {
    const own = H(n) === HE(n) && lines[H(n) - 1].trim() === src(n);
    (isWA(ex) ? [ex] : ex.expressions).forEach(x => addWin(x, H(n), !own || isSeq(ex)));
  } else if (st.isIfStatement() && !n.alternate && n.consequent.type === 'BlockStatement' && n.consequent.body.length && n.consequent.body.every(b => b.type === 'ExpressionStatement' && (isWA(b.expression) || isSeq(b.expression)))) {
    const oneLine = H(n) === HE(n), many = n.consequent.body.length > 1 || isSeq(n.consequent.body[0].expression);
    for (const b of n.consequent.body) { const x = b.expression, l = b.loc.start.line + off; const own = !oneLine && b.loc.end.line + off === l && lines[l - 1].trim() === src(b);
      (isWA(x) ? [x] : x.expressions).forEach(y => addWin(y, l, oneLine ? many || lines[l - 1].trim() !== src(n) : (!own || isSeq(x)))); }
  }
}
const refsOf = name => { const b = iife.scope.getBinding(name); if (!b) return []; return b.referencePaths.map(r => H(r.node)).concat(b.constantViolations.map(r => H(r.node))); };
const pinnedNow = PIN_NOW.pinned || {};
// 측정으로 풀렸음을 확인한 이름(선택 인자): 저장소 밖 사본에서 그 이름들을 모의 철거한 뒤 npm test 가 기준과 같았다(pinned-release-mock.json)
const REL = process.argv[5] ? JSON.parse(fs.readFileSync(path.resolve(process.argv[5]), 'utf8')) : null;
const released = new Set(REL && REL.released ? REL.names : []);
const rows = [];
for (const n of Object.keys(REG).sort()) {
  const r = REG[n], g = getters[n] || [], w = wins[n] || [], imp = imports[n] && imports[n].kitVar === r.kitVar ? imports[n] : null;
  if (!g.length && !w.length && !imp) continue;
  const own = new Set(g.map(x => x.line).concat(w.map(x => x.line), imp ? [imp.line] : []));
  const residual = imp ? refsOf(n).filter(l => !own.has(l)) : [];
  let reason, note = null;
  // [#TASK-ES-632] getter·window 줄이 이미 없고 가져오기 줄만 남은 이름은 시험과 무관하다(시험이 붙잡던 것은 배선 글자) — 잔존 참조로만 가른다
  if (!g.length && !w.length) reason = residual.length ? '가져오기 줄만 남음(IIFE 안 잔존 참조)' : '그 밖';
  else if (released.has(n)) reason = '시험에서 풀림(시험지 수정 뒤 — 모의 철거 사본 npm test 동일, 이제 지울 수 있음)';
  else if (pinnedNow[n]) reason = '시험이 붙잡음';
  else if (g.length || w.length) {
    if (w.some(x => x.shared)) reason = '한 줄 나눠 쓰기(X3)';
    else if (pinOld[n]) reason = '시험에서 풀림(이제 지울 수 있음)';
    else if (w.some(x => x.rhs !== r.import) || g.some(x => x.kind === 'get' && x.returns !== r.import)) { reason = '그 밖'; note = 'getter 가 돌려주는 이름·window 대입 오른쪽이 등록한 가져오기 이름(' + r.import + ')과 다르다'; }
    else { reason = '그 밖'; note = '계획에 없던 이름(계획 당시 손잡이 꼴·분류 때문에 빠짐) — 지금 생성기로 지울 수 있는지 2차에서 돌려 본다'; }
  } else reason = residual.length ? '가져오기 줄만 남음(IIFE 안 잔존 참조)' : '그 밖';
  if (reason === '그 밖' && !note) note = '가져오기 줄만 남았고 IIFE 안 참조가 0 이다 — 가져오기 줄을 지울 수 있다';
  rows.push({ name: n, kitVar: r.kitVar, kinds: r.kinds, reason, note, lines: { import: imp ? 1 : 0, getter: g.length, window: w.length }, residualRefs: residual.length, pinnedThen: !!pinOld[n], pinnedNow: !!pinnedNow[n] });
}
const by = {}; rows.forEach(x => { const b = by[x.reason] = by[x.reason] || { names: 0, importLines: 0, getterLines: 0, windowLines: 0, list: [] }; b.names++; b.importLines += x.lines.import; b.getterLines += x.lines.getter; b.windowLines += x.lines.window; b.list.push(x.name); });
// 등록되지 않은 이름(IIFE 소유)
const unregG = Object.keys(getters).filter(n => !REG[n] || !/scope/.test(REG[n].kinds)), unregW = Object.keys(wins).filter(n => !REG[n] || !/window/.test(REG[n].kinds));
const lineCount = (m, names) => names.reduce((a, n) => a + m[n].length, 0);
// 손잡이 줄
const handleRows = Object.keys(handles).sort().map(k => { const refs = refsOf(k); const imps = Object.keys(imports).filter(n => imports[n].kitVar === k);
  return { kitVar: k, path: handles[k].path, line: handles[k].line, references: refs.length, importsLeft: imps.length, otherRefs: refs.length - imps.length, droppable: refs.length === 0, importNames: imps.sort() }; });
// 등록됐는데 가져오기가 아니라서(IIFE 가 직접 가져오지 않는 이름) 줄이 없는 것은 세지 않는다.
const out = { tool: 'reports/TASK-ES-684/remaining-wiring.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), tree: path.basename(ROOT),
  iife: { lines: e - s, imports: Object.keys(imports).length, getterNames: Object.keys(getters).length, getterLines: lineCount(getters, Object.keys(getters)), windowNames: Object.keys(wins).length, windowLines: lineCount(wins, Object.keys(wins)), handles: Object.keys(handles).length },
  registered: { total: Object.keys(REG).length, stillWiredNames: rows.length, importLines: rows.reduce((a, x) => a + x.lines.import, 0), getterLines: rows.reduce((a, x) => a + x.lines.getter, 0), windowLines: rows.reduce((a, x) => a + x.lines.window, 0), byReason: by },
  pinned: { then: Object.keys(pinOld).length, textScanNow: Object.keys(pinnedNow).length, textScanNote: '글자 검색(pinned-names.cjs)은 시험 소스에 옛 배선 글자가 남아 있으면 계속 잡는다 — 단언 방식이 바뀌어 풀렸는지는 가리지 못한다. 풀렸는지는 모의 철거 사본의 npm test 로 쟀다',
    releasedByMeasurement: [...released].sort(), releaseEvidence: REL ? { file: 'reports/TASK-ES-630/pinned-release-mock.json', released: REL.released, npmTest: REL.npmTest, deletedLines: REL.totals.removed.deletedLines } : null,
    stillPinned: Object.keys(pinnedNow).filter(n => !released.has(n)).sort() },
  unregistered: { note: '등록되지 않은 이름(IIFE 안에 정의가 남은 함수·상태·DOM 참조, 그리고 B2 가 건너뛴 이름) — 함수 이전·상태 이전·구역 이전의 몫', getterNames: unregG.length, getterLines: lineCount(getters, unregG), windowNames: unregW.length, windowLines: lineCount(wins, unregW), windowNamesList: unregW.sort(), getterNamesList: unregG.sort(),
    importsNotRegistered: Object.keys(imports).filter(n => !REG[n]).map(n => ({ name: n, kitVar: imports[n].kitVar, refs: refsOf(n).length })).sort((a, b) => (a.name < b.name ? -1 : 1)) },
  handles: { total: handleRows.length, droppableNow: handleRows.filter(h => h.droppable).map(h => h.kitVar), rows: handleRows },
  rows };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log('IIFE', out.iife.lines, '줄 · 남은 가져오기', out.iife.imports, '· getter 이름', out.iife.getterNames, '· window 이름', out.iife.windowNames);
console.log('등록된 이름 중 배선이 남은 것', rows.length, '— 가져오기', out.registered.importLines, '· getter', out.registered.getterLines, '· window', out.registered.windowLines);
Object.keys(by).forEach(k => console.log('  ', k, by[k].names, '(가져오기', by[k].importLines, '· getter', by[k].getterLines, '· window', by[k].windowLines + ')'));
console.log('미등록: getter 이름', out.unregistered.getterNames, '(줄', out.unregistered.getterLines + ') · window 이름', out.unregistered.windowNames, '(줄', out.unregistered.windowLines + ') · 등록 안 된 가져오기', out.unregistered.importsNotRegistered.length);
console.log('손잡이', handleRows.length, '· 지금 지울 수 있는 것(참조 0)', JSON.stringify(out.handles.droppableNow));
handleRows.forEach(h => console.log('  ', h.kitVar, '참조', h.references, '(가져오기', h.importsLeft, '· 그 밖', h.otherRefs + ')'));
