#!/usr/bin/env node
'use strict';
// #TASK-ES-620 모의 철거 실행기(작업자 측정 도구, 판정 아님) — reports/TASK-ES-614/mock-unwire.cjs 를 바탕으로 세 곳만 바꿨다(나머지 글자 그대로).
//   ① 손잡이 이름꼴 제한을 풀었다(X1 — `_ui`·`_xp` 도 돈다. 생성기 #TASK-ES-619 부터 받는다)
//   ② 모든 실행에 "sharedLine": true 를 준다(X3 — 다른 글자와 한 줄을 나눠 쓰는 window 대입도 지운다)
//   ③ 임시 파일 이름·도구 이름
// 쓰임: 시험이 배선 글자를 붙잡는 이름까지 포함해(--exclude 없이) 지울 수 있는 배선을 전부 지운 index.html 을 저장소 밖 사본에 만든다.
// 저장소의 index.html 은 건드리지 않는다(실제 철거 0). 생성기(docs/design/harness/module-split/gen-inline-hard.js)는 이 PR 에서 변경 0 이다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-620/mock-unwire-all.cjs <작업 트리> <MOCK 트리> <등록 계획.json> <결과.json> [--exclude <names.json>] [--task TASK-ES-6xx]
//   <MOCK 트리>: 작업 트리와 같은 내용의 저장소 밖 사본(이 도구가 시작할 때 index.html 을 작업 트리 것으로 되돌린다 — 다시 돌려도 결과가 같다).
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const argv = process.argv.slice(2);
const WORK = path.resolve(argv[0]), MOCK = path.resolve(argv[1]), PLAN = path.resolve(argv[2]), OUT = path.resolve(argv[3]);
const opt = k => (argv.indexOf(k) >= 0 ? argv[argv.indexOf(k) + 1] : null);
const EXCLUDE = opt('--exclude') ? JSON.parse(fs.readFileSync(path.resolve(opt('--exclude')), 'utf8')) : {};
const TASK = opt('--task') || 'TASK-ES-620-MOCK';
if (path.relative(WORK, MOCK) === '' || !path.relative(WORK, MOCK).startsWith('..')) { console.error('MOCK 트리는 작업 트리 밖이어야 한다'); process.exit(2); }
const GEN = path.join(WORK, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js');
const KIT_RE = /^[A-Za-z_$][\w$]*$/; // #TASK-ES-620 ①: 손잡이 이름꼴 제한 없음(X1). 손잡이가 아니면 생성기가 멈춘다
const ORDER = ['_settingsKit', '_goalsKit', '_uiKit', '_recordsKit', '_commKit', '_calendarKit'];
const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8'));
const REG = {}; plan.registered.forEach(r => { REG[r.name] = r; });

function analyze(indexHtml) {
  const lines = fs.readFileSync(indexHtml, 'utf8').split('\n').map(l => l.replace(/\r$/, ''));
  let s = -1, e = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
  const off = s, code = lines.slice(s, e).join('\n');
  const ast = parser.parse(code, { sourceType: 'script', ranges: true });
  let iife = null; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
  const top = iife.get('body').get('body'), H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off;
  const isWA = x => x && x.type === 'AssignmentExpression' && x.operator === '=' && x.left.type === 'MemberExpression' && !x.left.computed && x.left.object.type === 'Identifier' && x.left.object.name === 'window' && x.left.property.type === 'Identifier';
  const isSeq = x => x && x.type === 'SequenceExpression' && x.expressions.every(isWA);
  const imports = {}, getters = {}, wins = {}, handles = {};
  const addWin = (x, line) => { const n = x.left.property.name; (wins[n] = wins[n] || []).push({ line, rhs: x.right.type === 'Identifier' ? x.right.name : null }); };
  for (const st of top) {
    const n = st.node, ex = st.isExpressionStatement() ? n.expression : null;
    if (st.isVariableDeclaration() && n.declarations.length === 1) {
      const d = n.declarations[0];
      if (d.id.type === 'Identifier' && d.init && d.init.type === 'MemberExpression' && !d.init.computed && d.init.object.type === 'Identifier') {
        if (d.init.object.name === 'window' || (d.init.object.name !== 'window' && d.init.property.type === 'Identifier' && d.init.object.name === 'window')) handles[d.id.name] = H(n);
        else if (d.init.property.type === 'Identifier' && d.init.property.name === d.id.name) imports[d.id.name] = { kitVar: d.init.object.name, line: H(n) };
      } else if (d.id.type === 'Identifier' && d.init && d.init.type === 'MemberExpression') { let x = d.init; while (x.type === 'MemberExpression') x = x.object; if (x.type === 'Identifier' && x.name === 'window') handles[d.id.name] = H(n); }
    } else if (ex && ex.type === 'CallExpression' && ex.callee.type === 'MemberExpression' && !ex.callee.computed && ex.callee.property.name === 'expose' && ex.arguments.length === 2 && ex.arguments[1].type === 'ObjectExpression') {
      for (const p of ex.arguments[1].properties) if (p.type === 'ObjectMethod' && !p.computed && p.key.type === 'Identifier' && (p.kind === 'get' || p.kind === 'set')) {
        const ret = p.kind === 'get' && p.body.body.length === 1 && p.body.body[0].type === 'ReturnStatement' && p.body.body[0].argument && p.body.body[0].argument.type === 'Identifier' ? p.body.body[0].argument.name : null;
        (getters[p.key.name] = getters[p.key.name] || []).push({ line: p.loc.start.line + off, kind: p.kind, returns: ret });
      }
    } else if (ex && isWA(ex)) addWin(ex, H(n));
    else if (ex && isSeq(ex)) ex.expressions.forEach(x => addWin(x, H(n)));
    else if (st.isIfStatement() && !n.alternate && n.consequent.type === 'BlockStatement' && n.consequent.body.length && n.consequent.body.every(b => b.type === 'ExpressionStatement' && (isWA(b.expression) || isSeq(b.expression)))) {
      for (const b of n.consequent.body) { const x = b.expression; if (isWA(x)) addWin(x, b.loc.start.line + off); else x.expressions.forEach(y => addWin(y, b.loc.start.line + off)); }
    }
  }
  const refLines = name => { const b = iife.scope.getBinding(name); if (!b) return []; return b.referencePaths.map(r => H(r.node)).concat(b.constantViolations.map(r => H(r.node))); };
  return { lines: lines.length, iife: [s + 1, e], imports, getters, wins, handles, refLines };
}

// 한 키트의 1차·2차 이름 집합
function classify(A, kitVar) {
  const cand = Object.keys(REG).filter(n => REG[n].kitVar === kitVar && !EXCLUDE[n]);
  const info = {}, notes = [];
  for (const n of cand) {
    const r = REG[n], g = (A.getters[n] || []), w = (A.wins[n] || []);
    const isImport = !!(A.imports[n] && A.imports[n].kitVar === kitVar);
    if (g.length && !/scope/.test(r.kinds)) { notes.push({ name: n, why: '통로 getter 줄이 있는데 등록은 window 뿐이다 — 넣지 않는다' }); continue; }
    if (w.length && !/window/.test(r.kinds)) { notes.push({ name: n, why: 'window 대입 줄이 있는데 등록은 통로뿐이다 — 넣지 않는다' }); continue; }
    if (g.some(x => x.kind === 'get' && x.returns !== r.import) || w.some(x => x.rhs !== r.import)) { notes.push({ name: n, why: 'getter 가 돌려주는 이름·window 대입 오른쪽이 등록한 가져오기 이름(' + r.import + ')과 다른 줄이 있다 — 넣지 않는다' }); continue; }
    if (!isImport && !g.length && !w.length) { notes.push({ name: n, why: '지울 줄이 없다(이미 철거됐거나 이 키트의 가져오기가 아니다)' }); continue; }
    info[n] = { isImport, importLine: isImport ? A.imports[n].line : null, own: g.map(x => x.line).concat(w.map(x => x.line)), importName: r.import };
  }
  // 1차 후보: 가져오기 이름 + 그 이름을 오른쪽으로 하는 별칭. 참조가 남는 가져오기는 2차로 내린다(고정점).
  let t1 = new Set(Object.keys(info).filter(n => info[n].isImport));
  for (const n of Object.keys(info)) if (!info[n].isImport && t1.has(info[n].importName)) t1.add(n);
  for (;;) {
    const del = new Set();
    for (const n of t1) { info[n].own.forEach(l => del.add(l)); if (info[n].isImport) del.add(info[n].importLine); }
    const bad = [...t1].filter(n => info[n].isImport && A.refLines(n).some(l => !del.has(l)));
    if (!bad.length) break;
    bad.forEach(n => t1.delete(n));
    for (const n of [...t1]) if (!info[n].isImport && !t1.has(info[n].importName)) t1.delete(n);
  }
  const t2 = Object.keys(info).filter(n => !t1.has(n) && info[n].own.length);
  const residualOnly = Object.keys(info).filter(n => !t1.has(n) && !info[n].own.length);
  return { t1: [...t1].sort(), t2: t2.sort(), residualOnly: residualOnly.sort(), info, notes };
}

function runGen(kitVar, names, imports, label) {
  const dropped = []; let cur = names.slice(), meta = null, tries = 0;
  while (cur.length && tries < 60) {
    tries++;
    const A = analyze(path.join(MOCK, 'index.html'));
    const cfgFile = path.join(os.tmpdir(), 'es620-mock-cfg-' + process.pid + '.json');
    const metaDir = fs.mkdtempSync(path.join(os.tmpdir(), 'es620-mock-meta-'));
    fs.writeFileSync(cfgFile, JSON.stringify({ task: TASK, slot: 'HO', mode: 'unwire', cells: [{ file: 'js/core/cell-registry.js' }], unwire: { kitVar, imports, exposeGetters: true, windowAssign: true, sharedLine: true, names: cur } }), 'utf8');
    const r = cp.spawnSync(process.execPath, [GEN, MOCK, cfgFile], { encoding: 'utf8', env: Object.assign({}, process.env, { MODULE_SPLIT_OUT: metaDir }), maxBuffer: 64 * 1024 * 1024 });
    try { fs.unlinkSync(cfgFile); } catch (e) { /* 무시 */ }
    if (r.status === 0) { meta = JSON.parse(fs.readFileSync(path.join(metaDir, 'gen-inline-hard-meta.json'), 'utf8')); fs.rmSync(metaDir, { recursive: true, force: true }); break; }
    fs.rmSync(metaDir, { recursive: true, force: true });
    const msg = ((r.stderr || '') + (r.stdout || '')).split('\n').find(l => /Error: /.test(l)) || (r.stderr || '').trim().split('\n').slice(-1)[0] || '(메시지 없음)';
    const text = msg.replace(/^.*Error: /, '');
    // 멈춘 이름 찾기: 메시지에 적힌 줄 번호에 줄이 걸린 이름, 또는 메시지에 그대로 나온 이름
    const nums = new Set(); (text.match(/\d+/g) || []).forEach(x => nums.add(Number(x)));
    const hitByLine = cur.filter(n => (A.getters[n] || []).some(x => nums.has(x.line)) || (A.wins[n] || []).some(x => nums.has(x.line)) || (A.imports[n] && nums.has(A.imports[n].line)));
    const words = new Set(text.split(/[^A-Za-z0-9_$]+/));
    const hitByName = cur.filter(n => words.has(n));
    let drop = hitByName.length ? hitByName : hitByLine;
    if (!drop.length) { dropped.push({ names: cur.slice(), reason: '생성기 정지 — 멈춘 이름을 가려내지 못해 이 실행 전체를 건너뜀', generator: text }); cur = []; break; }
    drop.forEach(n => dropped.push({ name: n, reason: '생성기 정지', generator: text }));
    cur = cur.filter(n => !drop.includes(n));
  }
  return { label, kitVar, flags: { imports, exposeGetters: true, windowAssign: true, sharedLine: true }, names: meta ? cur : [], dropped, tries,
    removed: meta ? { imports: meta.removed.imports.length, exposeProps: meta.removed.exposeProps.length, exposeCalls: meta.removed.exposeCalls.length, windowAssigns: meta.removed.windowAssigns.length, windowBlocks: meta.removed.windowBlocks.length, commaFixedLines: meta.commaFixedLines.length, deletedLines: meta.deletedLines.length } : null,
    htmlLines: meta ? [meta.htmlLinesBefore, meta.htmlLinesAfter] : null };
}

fs.copyFileSync(path.join(WORK, 'index.html'), path.join(MOCK, 'index.html'));
const A0 = analyze(path.join(MOCK, 'index.html'));
const kitVars = [...new Set(Object.values(A0.imports).map(x => x.kitVar))];
const runnable = ORDER.filter(k => kitVars.includes(k)).concat(kitVars.filter(k => KIT_RE.test(k) && !ORDER.includes(k)).sort());
const blockedKitVars = kitVars.filter(k => !KIT_RE.test(k)).sort();
const passes = [], notes = [], residualOnly = [];
for (const k of runnable) {
  const c1 = classify(analyze(path.join(MOCK, 'index.html')), k);
  c1.notes.forEach(x => notes.push(Object.assign({ kitVar: k }, x)));
  c1.residualOnly.forEach(n => residualOnly.push({ kitVar: k, name: n }));
  if (c1.t1.length) passes.push(runGen(k, c1.t1, true, k + ' 1차'));
  const c2 = classify(analyze(path.join(MOCK, 'index.html')), k);
  const t2 = c2.t1.filter(n => !c2.info[n].isImport || c2.info[n].own.length).concat(c2.t2).filter((n, i, a) => a.indexOf(n) === i && c2.info[n].own.length).sort();
  if (t2.length) passes.push(runGen(k, t2, false, k + ' 2차(가져오기 줄은 남김)'));
}
const A1 = analyze(path.join(MOCK, 'index.html'));
const removedNames = new Set(); passes.forEach(p => p.names.forEach(n => removedNames.add(n)));
const stillWired = Object.keys(REG).filter(n => (A1.getters[n] || []).length || (A1.wins[n] || []).length).sort();
const out = {
  tool: 'reports/TASK-ES-620/mock-unwire-all.cjs', type: '작업자 측정, 판정 아님 — 저장소 밖 사본에서의 모의 철거(실제 철거 0)', measuredAt: new Date().toISOString(),
  generator: 'docs/design/harness/module-split/gen-inline-hard.js mode:"unwire" + sharedLine(X3) · 손잡이 이름꼴 제한 없음(X1) (이 PR 에서 변경 0)', task: TASK,
  excluded: EXCLUDE,
  before: { htmlLines: A0.lines, iifeLines: A0.iife[1] - A0.iife[0] + 1, imports: Object.keys(A0.imports).length, getterNames: Object.keys(A0.getters).length, windowNames: Object.keys(A0.wins).length },
  after: { htmlLines: A1.lines, iifeLines: A1.iife[1] - A1.iife[0] + 1, imports: Object.keys(A1.imports).length, getterNames: Object.keys(A1.getters).length, windowNames: Object.keys(A1.wins).length },
  deletedLinesTotal: A0.lines - A1.lines,
  passes,
  byKit: runnable.map(k => { const ps = passes.filter(p => p.kitVar === k); return { kitVar: k, passes: ps.length, names: ps.reduce((a, p) => a + p.names.length, 0), deletedLines: ps.reduce((a, p) => a + (p.htmlLines ? p.htmlLines[0] - p.htmlLines[1] : 0), 0) }; }),
  notRunnableKitVars: blockedKitVars.map(k => ({ kitVar: k, why: '손잡이 이름이 식별자 꼴이 아니다', registeredNames: Object.keys(REG).filter(n => REG[n].kitVar === k).sort() })),
  registeredStillWired: { count: stillWired.length, names: stillWired, note: '등록됐지만 모의 철거 뒤에도 getter 줄 또는 window 줄이 남은 이름(제외·생성기 정지·kitVar 꼴 때문)' },
  importOnlyWithRefs: { count: residualOnly.length, names: residualOnly, note: '등록됐고 자기 getter·window 줄은 없는데 IIFE 안 다른 코드가 아직 써서 가져오기 줄을 못 지우는 이름' },
  notes,
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('모의 철거:', A0.lines, '->', A1.lines, '줄 (', out.deletedLinesTotal, '줄 삭제 ) · 실행', passes.length, '· 이름', removedNames.size, '· 생성기 정지로 뺀 이름', passes.reduce((a, p) => a + p.dropped.length, 0), '· 등록됐지만 남은 배선', stillWired.length);
passes.forEach(p => console.log(' ', p.label, '· names', p.names.length, '· 삭제', p.htmlLines ? p.htmlLines[0] - p.htmlLines[1] : 0, '· 뺀', p.dropped.length, '· 시도', p.tries));
