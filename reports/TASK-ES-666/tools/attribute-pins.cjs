#!/usr/bin/env node
'use strict';
// #TASK-ES-666 조사 도구(작업자 측정, 판정 아님) — 「모의본에서만 실패하는 단언」이 덩어리(IIFE) 안의 어느 글자를 붙잡는지, 그 글자가 덩어리의 어떤 줄 종류에 있는지 가린다.
// 입력: run-asserts.cjs(reports/TASK-ES-620)를 기준 트리와 모의본에서 돌린 결과 두 개. 모의본에서만 실패하는 단언 줄마다
//   ① 그 단언 문(여러 줄이면 문 전체)에 든 문자열·정규식 리터럴을 파서로 모으고
//   ② 리터럴마다 기준 index.html 의 큰 인라인 IIFE 안에서 찾은 줄 · IIFE 밖 index.html 에서 찾은 수 · js/** 에서 찾은 파일을 적고
//   ③ IIFE 안의 그 줄이 어떤 최상위 문 종류(함수 선언 · 상태 var · 가져오기 · expose · if · window 대입 · 호출 · 주석)에 드는지 적는다.
// 단언의 실패 메시지 문자열(마지막 인자)은 붙잡는 글자가 아니므로 뺀다(assert.ok(x, '메시지') · assert(x, '메시지') · check 제목).
// 사용: NODE_PATH=… node attribute-pins.cjs <기준 트리> <기준 결과.json> <모의 결과.json> <out.json>
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser');
const [BASE, AJ, MJ, OUT] = process.argv.slice(2);
const A = JSON.parse(fs.readFileSync(AJ, 'utf8')), M = JSON.parse(fs.readFileSync(MJ, 'utf8'));
const key = f => f.file + ':' + f.line + ':' + f.message;
const inA = new Set(A.failedAssertsUnique.map(key));
const only = M.failedAssertsUnique.filter(f => !inA.has(key(f)));

// 기준 index.html 의 IIFE 와 그 최상위 문 지도
const html = fs.readFileSync(path.join(BASE, 'index.html'), 'utf8');
const ls = html.split('\n').map(l => l.replace(/\r$/, ''));
let s = -1, e = -1;
for (let i = 0; i < ls.length; i++) if (ls[i].trim() === '<script>' && (ls[i + 1] || '').trim() === '(function(){' && (ls[i + 2] || '').includes('"use strict"')) { s = i; break; }
for (let i = s + 1; i < ls.length; i++) if (ls[i].startsWith('</script>')) { e = i; break; }
if (s < 0 || e < 0) throw new Error('기준 index.html 에서 큰 인라인 IIFE 를 찾지 못했다');
const iifeLines = ls.slice(s + 1, e), off = s + 1; // iifeLines[k] = html 줄 (off + k + 1)
const ast = parser.parse(iifeLines.join('\n'), { sourceType: 'script', ranges: true });
const fn = ast.program.body[0].expression.callee; // (function(){ … })()
const top = fn.body.body;
const isWin = x => x && x.type === 'AssignmentExpression' && x.left.type === 'MemberExpression' && x.left.object.type === 'Identifier' && x.left.object.name === 'window';
function kindOf(st) {
  if (st.type === 'FunctionDeclaration') return '함수 선언(' + st.id.name + ')';
  if (st.type === 'VariableDeclaration') {
    const d = st.declarations[0], i = d.init;
    if (st.declarations.length === 1 && i && i.type === 'MemberExpression') { let o = i; while (o.type === 'MemberExpression') o = o.object; if (o.type === 'Identifier' && o.name === 'window') return '키트 손잡이'; if (i.object.type === 'Identifier' && !i.computed) return '키트 가져오기'; }
    return '상태·그 밖의 var(' + st.declarations.map(x => x.id.name).join(',') + ')';
  }
  if (st.type === 'ExpressionStatement') {
    const x = st.expression;
    if (x.type === 'CallExpression' && x.callee.type === 'MemberExpression' && x.callee.property.name === 'expose') return 'expose 문';
    if (isWin(x)) return 'window 대입 문';
    if (x.type === 'CallExpression') return '호출문';
    return '식 문';
  }
  if (st.type === 'IfStatement') return 'if 문';
  return st.type;
}
const stmtAt = line => { const k = line - off; for (const st of top) if (st.loc.start.line <= k && k <= st.loc.end.line) return kindOf(st); return null; }; // line = html 줄 번호
const commentAt = line => { const k = line - off; return (ast.comments || []).some(c => c.loc.start.line <= k && k <= c.loc.end.line); };
const insideIife = line => line > off && line <= off + iifeLines.length;

// js/** 글자 색인(파일 → 글자)
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(x => (x.isDirectory() ? walk(path.join(d, x.name)) : [path.join(d, x.name)]));
const jsFiles = walk(path.join(BASE, 'js')).filter(f => f.endsWith('.js')).map(f => ({ rel: path.relative(BASE, f).replace(/\\/g, '/'), text: fs.readFileSync(f, 'utf8') }));
const stripPrefix = t => t.replace(/(^|[^A-Za-z0-9_$.])[LK]\.(?=[A-Za-z_$])/g, '$1');

function literalsOf(file, line) {
  const src = fs.readFileSync(path.join(BASE, file), 'utf8');
  let tree;
  try { tree = parser.parse(src, { sourceType: 'unambiguous', errorRecovery: true, allowReturnOutsideFunction: true }); } catch (err) { return null; }
  // 그 줄에서 시작하는 가장 바깥 호출식(단언 문)을 찾는다
  let target = null;
  (function visit(n) {
    if (!n || typeof n.type !== 'string') return;
    if (!target && n.type === 'CallExpression' && n.loc.start.line === line) { target = n; return; }
    for (const k of Object.keys(n)) { if (k === 'loc') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && visit(c)); else if (v && typeof v.type === 'string') visit(v); }
  })(tree.program);
  if (!target) return null;
  const out = [];
  const msgArg = target.arguments.length > 1 ? target.arguments[target.arguments.length - 1] : null; // 실패 메시지
  (function visit(n) {
    if (!n || typeof n.type !== 'string' || n === msgArg) return;
    if (n.type === 'StringLiteral') out.push({ kind: '문자열', text: n.value });
    else if (n.type === 'TemplateLiteral' && n.quasis.length === 1) out.push({ kind: '문자열', text: n.quasis[0].value.cooked });
    else if (n.type === 'RegExpLiteral') out.push({ kind: '정규식', text: n.pattern, flags: n.flags });
    for (const k of Object.keys(n)) { if (k === 'loc') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && visit(c)); else if (v && typeof v.type === 'string') visit(v); }
  })(target);
  return out;
}
const findLines = lit => {
  const hits = [];
  if (lit.kind === '문자열') { if (lit.text.includes('\n')) { const i = html.indexOf(lit.text); if (i >= 0) hits.push(html.slice(0, i).split('\n').length); } else ls.forEach((l, i) => { if (l.includes(lit.text)) hits.push(i + 1); }); }
  else { let re; try { re = new RegExp(lit.text, lit.flags.replace(/[gy]/g, '')); } catch (err) { return hits; } ls.forEach((l, i) => { if (re.test(l)) hits.push(i + 1); }); }
  return hits;
};
const inJs = lit => jsFiles.filter(f => (lit.kind === '문자열' ? (f.text.includes(lit.text) || stripPrefix(f.text).includes(lit.text)) : (() => { try { return new RegExp(lit.text, lit.flags.replace(/[gy]/g, '')).test(stripPrefix(f.text)); } catch (err) { return false; } })())).map(f => f.rel);

const rows = only.map(f => {
  const lits = f.file ? literalsOf(f.file, f.line) : null;
  const pins = (lits || []).map(lit => {
    const lines = findLines(lit), inside = lines.filter(insideIife), outside = lines.filter(l => !insideIife(l));
    return { kind: lit.kind, text: lit.text.slice(0, 160), iifeLines: inside.slice(0, 6), iifeHits: inside.length, indexOutsideHits: outside.length,
      where: [...new Set(inside.map(l => (stmtAt(l) || (commentAt(l) ? '주석(문 밖)' : '그 밖'))))],
      inComment: inside.length > 0 && inside.every(l => commentAt(l)), jsFiles: inJs(lit).slice(0, 5) };
  }).filter(p => p.iifeHits > 0 && p.indexOutsideHits === 0); // 덩어리 안에만 있는 글자 = 이 단언이 덩어리에서 붙잡는 것
  return { file: f.file, line: f.line, check: f.check, message: f.message.slice(0, 120), assertion: (f.src || '').slice(0, 220), literals: lits ? lits.length : null, pins };
});
const count = fn2 => rows.reduce((a, r) => { const k = fn2(r); a[k] = (a[k] || 0) + 1; return a; }, {});
const out = { tool: 'reports/TASK-ES-666/tools/attribute-pins.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), base: BASE, iife: { htmlLines: [s + 1, e + 1], lines: iifeLines.length, topStatements: top.length },
  summary: { brokenAssertLines: rows.length, byFile: count(r => r.file), withTextPin: rows.filter(r => r.pins.length).length, withoutTextPin: rows.filter(r => !r.pins.length).map(r => r.file + ':' + r.line),
    byWhere: rows.flatMap(r => r.pins.flatMap(p => p.where.map(w => w.replace(/\(.*\)$/, '')))).reduce((a, w) => { a[w] = (a[w] || 0) + 1; return a; }, {}) },
  rows };
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify(out.summary));
for (const r of rows) console.log(r.file + ':' + r.line, '|', r.pins.map(p => JSON.stringify(p.text.slice(0, 50)) + ' @' + p.iifeLines.slice(0, 2).join(',') + ' [' + p.where.join('/') + ']' + (p.jsFiles.length ? ' js:' + p.jsFiles.slice(0, 2).join(',') : '')).join(' ; ') || '(덩어리 안에만 있는 리터럴 없음)');
