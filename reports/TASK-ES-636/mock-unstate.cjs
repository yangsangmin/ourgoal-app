#!/usr/bin/env node
'use strict';
// #TASK-ES-636 모의 상태 이전(작업자 측정 도구, 판정 아님) — 저장소 밖 사본(MOCK 트리)의 index.html 에 생성기 unstate 모드를 실제로 적용한다. 저장소의 index.html 은 건드리지 않는다.
//   1) MOCK/index.html 의 인라인 IIFE 에서 「통로에 노출된 상태 이름」을 전부 뽑는다(키트 손잡이·가져오기는 뺀다).
//   2) 이름 하나씩 임시 폴더에서 생성기를 돌려 지금 옮길 수 있는 이름과 멈춘 사유를 가른다(생성기 판단 그대로).
//   3) 옮길 수 있는 이름(--exclude 의 이름은 뺀다)을 MOCK/index.html 에 한 번에 적용한다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-636/mock-unstate.cjs <MOCK 트리> <out.json> [--exclude <{이름:true}.json>]
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
const argv = process.argv.slice(2);
const MOCK = path.resolve(argv[0]), OUT = path.resolve(argv[1]);
const exArg = argv.indexOf('--exclude') >= 0 ? argv[argv.indexOf('--exclude') + 1] : null;
const EXCLUDE = exArg ? JSON.parse(fs.readFileSync(path.resolve(exArg), 'utf8')) : {};
const GEN = path.join(MOCK, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mock-unstate-636-'));
const META = path.join(tmp, 'gen-inline-hard-meta.json');
const env = { ...process.env, MODULE_SPLIT_OUT: tmp };
function runGen(dir, names) {
  const cfg = path.join(tmp, 'cfg.json');
  fs.writeFileSync(cfg, JSON.stringify({ task: 'TASK-ES-636-MOCK', slot: 'HO', mode: 'unstate', cells: [{ file: 'js/core/app-state.js' }], unstate: { names } }), 'utf8');
  try { fs.unlinkSync(META); } catch (_) { /* 없으면 그만 */ }
  const r = cp.spawnSync(process.execPath, [GEN, dir, cfg], { encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status, meta: r.status === 0 && fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : null, err: r.status === 0 ? null : ((r.stderr || '').split('\n').find(l => /Error/.test(l)) || '').replace(/^Error: /, '').replace(/\r$/, '') };
}
const html = fs.readFileSync(path.join(MOCK, 'index.html'), 'utf8');
const lines = html.split('\n').map(l => l.replace(/\r$/, ''));
let s = -1, e = -1;
for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
const ast = parser.parse(lines.slice(s, e).join('\n'), { sourceType: 'script', ranges: true });
let iife = null; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const top = iife.get('body').get('body');
const rootWin = n => { let x = n; while (x && x.type === 'MemberExpression') x = x.object; return !!x && x.type === 'Identifier' && x.name === 'window'; };
const handles = new Set(), stateNames = [], exposed = new Set();
for (const st of top) { if (!st.isVariableDeclaration() || st.node.declarations.length !== 1) continue; const d = st.node.declarations[0]; if (d.id.type === 'Identifier' && d.init && d.init.type === 'MemberExpression' && rootWin(d.init) && /^_/.test(d.id.name)) handles.add(d.id.name); }
for (const st of top) if (st.isVariableDeclaration()) for (const d of st.node.declarations) {
  if (d.id.type !== 'Identifier' || handles.has(d.id.name)) continue;
  if (st.node.declarations.length === 1 && d.init && d.init.type === 'MemberExpression' && !d.init.computed && d.init.object.type === 'Identifier' && handles.has(d.init.object.name)) continue; // 키트 가져오기
  if (!stateNames.includes(d.id.name)) stateNames.push(d.id.name);
}
for (const st of top) { const x = st.isExpressionStatement() && st.node.expression; if (x && x.type === 'CallExpression' && x.callee.type === 'MemberExpression' && x.callee.property.name === 'expose' && x.arguments[1] && x.arguments[1].type === 'ObjectExpression') for (const p of x.arguments[1].properties) if (p.type === 'ObjectMethod' && p.key.type === 'Identifier' && stateNames.includes(p.key.name)) exposed.add(p.key.name); }
const candidates = stateNames.filter(n => exposed.has(n)), notExposed = stateNames.filter(n => !exposed.has(n));
const dTry = path.join(tmp, 'try'); fs.mkdirSync(dTry);
const movable = [], stopped = [];
for (const n of candidates) {
  fs.writeFileSync(path.join(dTry, 'index.html'), html, 'utf8');
  const r = runGen(dTry, [n]);
  if (r.status === 0) movable.push(n); else stopped.push({ name: n, reason: r.err });
}
const excluded = movable.filter(n => EXCLUDE[n]), apply = movable.filter(n => !EXCLUDE[n]);
const all = apply.length ? runGen(MOCK, apply) : { status: null, meta: null, err: '적용할 이름 0' };
const after = fs.readFileSync(path.join(MOCK, 'index.html'), 'utf8');
const head = cp.spawnSync('git', ['-C', MOCK, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
const m = all.meta;
const out = {
  tool: 'reports/TASK-ES-636/mock-unstate.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), mockTree: MOCK, mockTreeHead: head, generator: 'docs/design/harness/module-split/gen-inline-hard.js mode:"unstate"(이 PR 에서 변경 0)',
  excludeFile: exArg ? path.resolve(exArg) : null,
  counts: { stateNames: stateNames.length, exposed: candidates.length, notExposed: notExposed.length, movable: movable.length, stopped: stopped.length, excluded: excluded.length, applied: apply.length },
  applyStatus: all.status, applyError: all.err,
  applied: m ? { names: m.names, api: m.api, define: Object.values(m.api).filter(v => v === 'define').length, defineVar: Object.values(m.api).filter(v => v === 'defineVar').length, deletedLines: m.deletedLines.length, editedLines: m.editedLines.length, exposeProps: m.removed.exposeProps.length, exposeCallsRemoved: m.removed.exposeCalls.length, commaFixedLines: m.commaFixedLines.length, windowCopies: m.rewritten.windowCopies.length, htmlLines: [html.split('\n').length, after.split('\n').length],
    byName: m.names.map(n => ({ name: n, api: m.api[n], declLine: (m.rewritten.declarations.find(d => d.name === n) || {}).line, exposeLines: m.removed.exposeProps.filter(p => p.name === n).map(p => p.line), windowCopyLines: m.rewritten.windowCopies.filter(c => c.name === n).map(c => c.line) })) } : null,
  movable, excluded, stopped, notExposed
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ }
console.log(JSON.stringify({ counts: out.counts, applyStatus: all.status, applyError: all.err, applied: out.applied && { define: out.applied.define, defineVar: out.applied.defineVar, deleted: out.applied.deletedLines, edited: out.applied.editedLines, htmlLines: out.applied.htmlLines } }));
process.exit(all.status === 0 ? 0 : 1);
