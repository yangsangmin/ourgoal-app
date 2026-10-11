'use strict';
// sweep 적용 조사용 모의본(작업자 측정, 판정 아님 — 저장소 밖/모의 폴더에서만).
// 사용: node sweep-mocks.cjs <구역 3차를 적용한 트리(읽기만)> <모의 폴더 S> <모의 폴더 C> <임시 폴더> <out.json>
//   S  = 구역 3차 적용 + 생성기 sweep(groups:"all")            — 도는 앱. 시험을 돌려 「sweep 이 지우는 주석을 붙잡는 시험」을 찾는다
//   C  = 구역 3차 적용 + IIFE 최상위의 주석 줄·빈 줄 전부 삭제  — 도는 앱. finalize 가 지우는 주석 범위(구획 주석 포함)의 위쪽 한계. 시험을 돌려 「그 주석을 붙잡는 시험」을 찾는다
//   E  = (글자만) 구역 3차 적용 + 재철거 3차를 흉내(최상위에서 불리지 않는 가져오기 줄과 expose 문을 전부 지움) → sweep — 끝난 꼴에서 sweep 이 지우는 줄 수의 위쪽 한계. 실행하지 않는다
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [SRC, MOCK_S, MOCK_C, TMP, OUT] = process.argv.slice(2);
const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
const GEN = path.join(SRC, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js');
const srcHtml = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8'), EOL = srcHtml.includes('\r\n') ? '\r\n' : '\n';
const locate = L => { let s = -1, e = -1; for (let i = 0; i < L.length; i++) if (L[i].trim() === '<script>' && (L[i + 1] || '').trim() === '(function(){' && (L[i + 2] || '').includes('"use strict"')) { s = i; break; } for (let i = s; i < L.length; i++) if (L[i].startsWith('</script>')) { e = i; break; } return { s, e }; };
const parseTop = L => { const { s, e } = locate(L); const ast = parser.parse(L.slice(s + 1, e).join('\n'), { sourceType: 'script' }); let iife = null; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } }); return { s, e, ast, iife, top: iife.get('body').get('body'), line: n => n + s + 1 }; };
const runGen = (dir, cfg) => { const c = path.join(TMP, 'cfg-' + Date.now() + '.json'); fs.writeFileSync(c, JSON.stringify(cfg), { encoding: 'utf8' }); const out = path.join(TMP, 'meta-' + Date.now()); fs.mkdirSync(out, { recursive: true }); const r = cp.spawnSync(process.execPath, [GEN, dir, c], { cwd: SRC, encoding: 'utf8', env: Object.assign({}, process.env, { MODULE_SPLIT_OUT: out }) }); let meta = null; try { meta = JSON.parse(fs.readFileSync(path.join(out, 'gen-inline-hard-meta.json'), 'utf8')); } catch (_) { /* 멈췄으면 메타가 없다 */ } return { status: r.status, stdout: (r.stdout || '').trim().split('\n'), err: ((r.stderr || '').split('\n').find(x => /^Error:/.test(x.trim())) || '').trim().slice(0, 400), meta: r.status === 0 ? meta : null }; };
const SWEEP = { task: 'TASK-ES-682', slot: 'HO', mode: 'sweep', label: 'sweep 적용 조사(모의)', cells: [{ file: 'js/core/cell-registry.js' }], sweep: { groups: 'all' } };
const gapCount = L => { const { s, e, top, line } = parseTop(L); const st = new Set(); for (const t of top) for (let l = t.node.loc.start.line; l <= t.node.loc.end.line; l++) st.add(line(l)); let comment = 0, blank = 0, header = 0; for (let n = s + 4; n <= e - 1; n++) { if (st.has(n)) continue; const x = L[n - 1]; if (x.trim() === '') blank++; else { comment++; if (/^\s*\/\*\s*=+/.test(x)) header++; } } return { iifeLines: e - s + 1, statementLines: st.size, commentLines: comment, blankLines: blank, headerCommentLines: header }; };
const sweepSummary = r => r.meta ? { ok: true, stdout: r.stdout, emptyGroups: r.meta.emptyGroups, deleted: r.meta.deleted, keptCount: (r.meta.kept || []).length, htmlLines: [r.meta.htmlLinesBefore, r.meta.htmlLinesAfter], gapLinesBefore: r.meta.gapLinesBefore, gapLinesAfter: r.meta.gapLinesAfter, vanishedWords: r.meta.vanishedWords } : { ok: false, error: r.err, stdout: r.stdout };
const out = { tool: 'sweep-mocks.cjs(저장소 밖 조사 도구)', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), source: SRC };
// 기준(구역 3차 적용 판)의 주석·빈 줄
const L0 = srcHtml.split(EOL); out.region3 = { htmlLines: L0.length, gap: gapCount(L0) };
// S: 도는 앱에 sweep
fs.writeFileSync(path.join(MOCK_S, 'index.html'), srcHtml, { encoding: 'utf8' });
{ const r = runGen(MOCK_S, SWEEP); out.S = sweepSummary(r); if (r.meta) out.S.gapAfter = gapCount(fs.readFileSync(path.join(MOCK_S, 'index.html'), 'utf8').split(EOL)); }
// C: IIFE 최상위의 주석 줄·빈 줄 전부 삭제(문 안의 줄은 그대로)
{ const { s, e, top, line } = parseTop(L0); const st = new Set(); for (const t of top) for (let l = t.node.loc.start.line; l <= t.node.loc.end.line; l++) st.add(line(l)); const keep = []; let removed = 0; L0.forEach((x, i) => { const n = i + 1; if (n >= s + 4 && n <= e - 1 && !st.has(n)) { removed++; return; } keep.push(x); }); fs.writeFileSync(path.join(MOCK_C, 'index.html'), keep.join(EOL), { encoding: 'utf8' });
  // 실행 글자가 그대로인지: 주석을 뺀 토큰열 비교
  const toks = h => { const q = h.split(EOL), p = locate(q); return parser.parse(q.slice(p.s + 1, p.e).join('\n'), { sourceType: 'script', tokens: true }).tokens.filter(t => typeof t.type !== 'string' && t.type.label !== 'eof').map(t => (t.type.label || '') + ':' + (t.value === undefined ? '' : String(t.value))).join('\u0001'); };
  out.C = { removedLines: removed, htmlLines: [L0.length, keep.length], codeTokensSame: toks(srcHtml) === toks(keep.join(EOL)), gapAfter: gapCount(keep) }; }
// E: 재철거 3차를 흉내 낸 글자 모의본에 sweep
{ const dir = path.join(TMP, 'E'); fs.mkdirSync(dir, { recursive: true }); const { top, line } = parseTop(L0);
  const rootWin = n => { let x = n; while (x && x.type === 'MemberExpression' && !x.computed) x = x.object; return !!x && x.type === 'Identifier' && x.name === 'window'; };
  const oneVar = t => (t.isVariableDeclaration() && t.node.declarations.length === 1 && t.node.declarations[0].id.type === 'Identifier') ? t.node.declarations[0] : null;
  const handles = new Set(), imports = new Map(); for (const t of top) { const d = oneVar(t); if (d && d.init && d.init.type === 'MemberExpression' && rootWin(d.init)) handles.add(d.id.name); }
  for (const t of top) { const d = oneVar(t); if (d && d.init && d.init.type === 'MemberExpression' && !d.init.computed && d.init.object.type === 'Identifier' && handles.has(d.init.object.name)) imports.set(d.id.name, { t, calls: 0, kit: d.init.object.name }); }
  for (const t of top) { const x = t.isExpressionStatement() && t.node.expression; if (x && x.type === 'CallExpression' && x.callee.type === 'Identifier' && imports.has(x.callee.name) && x.arguments.length === 0) imports.get(x.callee.name).calls++; }
  const drop = new Set(); let dropImports = 0, dropExpose = 0; const usedKits = new Set();
  for (const [, im] of imports) { if (!im.calls) { dropImports++; for (let l = im.t.node.loc.start.line; l <= im.t.node.loc.end.line; l++) drop.add(line(l)); } else usedKits.add(im.kit); }
  for (const t of top) { const x = t.isExpressionStatement() && t.node.expression; if (x && x.type === 'CallExpression' && x.callee.type === 'MemberExpression' && x.callee.property.name === 'expose') { dropExpose++; for (let l = t.node.loc.start.line; l <= t.node.loc.end.line; l++) drop.add(line(l)); } }
  let dropHandles = 0; for (const t of top) { const d = oneVar(t); if (d && handles.has(d.id.name) && !usedKits.has(d.id.name)) { dropHandles++; drop.add(line(t.node.loc.start.line)); } }
  const LE = L0.filter((x, i) => !drop.has(i + 1)); fs.writeFileSync(path.join(dir, 'index.html'), LE.join(EOL), { encoding: 'utf8' });
  const r = runGen(dir, SWEEP); out.E = Object.assign({ simulatedUnwire: { droppedImportStatements: dropImports, droppedExposeStatements: dropExpose, droppedHandleStatements: dropHandles, droppedLines: drop.size }, htmlLinesBeforeSweep: LE.length, gapBeforeSweep: gapCount(LE) }, sweepSummary(r));
  if (r.meta) { const LA = fs.readFileSync(path.join(dir, 'index.html'), 'utf8').split(EOL); out.E.gapAfter = gapCount(LA); const p = parseTop(LA); out.E.topStatementsAfter = p.top.length; } }
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
const brief = x => x && x.ok ? { deleted: x.deleted, empty: x.emptyGroups && { total: x.emptyGroups.total || x.emptyGroups.count, used: x.emptyGroups.used, skipped: (x.emptyGroups.skipped || []).length }, html: x.htmlLines, kept: x.keptCount, gapAfter: x.gapAfter, vanished: (x.vanishedWords || []).length } : x;
console.log(JSON.stringify({ region3: out.region3, S: brief(out.S), C: out.C, E: Object.assign({ sim: out.E.simulatedUnwire, before: out.E.gapBeforeSweep, top: out.E.topStatementsAfter }, brief(out.E)) }, null, 1));
