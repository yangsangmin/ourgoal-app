'use strict';
// #TASK-ES-646 — 944줄 함수 openProTemplateRecordModal 「제자리 정리」 변환기.
// index.html 인라인 IIFE 안의 그 함수 하나를, 동작을 바꾸지 않고 IIFE 최상위 함수 여섯(진입점 + 조각 다섯)으로 나눈다. 다른 글자는 건드리지 않는다.
// 손으로 고치지 않고 스코프 분석(@babel/parser · @babel/traverse)으로 고친다 — 문자열·주석·속성 이름 안의 같은 글자는 건드리지 않는다(L020).
// 법정이 다시 돌리는 생성기가 아니다(proof 없음). main 이 움직이면 main 판 index.html 에 이 변환기를 다시 돌린다.
//
// 바꾸는 것(이것뿐이다):
//   ① 조각 경계: openModal(…, function(sheet){ … }) 콜백 본문을 책임 단위 다섯 구간으로 잘라 IIFE 최상위 함수의 본문으로 옮긴다(글자 그대로 · 들여쓰기 그대로 · 순서 그대로).
//      콜백에는 그 함수들을 원래 순서대로 부르는 줄만 남는다. 구간 사이의 빈 줄은 없앤다.
//   ② 꾸러미(ctx): 여러 조각이 함께 보는 지역 변수·인자(DATA)는 읽기·쓰기 모두 ctx.<이름> 으로 바꾼다. 선언 `var X = …` 는 `ctx.X = …` 가 된다.
//      여러 조각이 부르는 안쪽 함수(FUNCS)는 주인 조각 안에서는 그대로 두고, 다른 조각에서는 ctx.<이름> 으로 부른다. 주인 조각은 머리에서 ctx.<이름> = <이름> 으로 등록한다.
//   ③ 한 조각 안에서만 쓰는 지역 변수·안쪽 함수는 그 조각 함수의 지역으로 그대로 둔다(글자 변화 0).
// 멈추는 조건(fail): 조각 경계 표지 문을 못 찾음 · 구간 밖에 빈 줄이 아닌 글자가 있음 · 여러 조각에 걸친 이름이 아래 기대 목록과 다름 ·
//   함수 안에 ctx 라는 이름·this·arguments·eval·with 가 있음 · 줄임 속성({ rows })에 걸림 · 결과가 파싱되지 않음.
// 사용: node reports/TASK-ES-646/tools/inplace-split.cjs <APP_DIR> [<입력 index.html>] [--out <결과 파일>] [--meta <meta.json>]
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const args = process.argv.slice(2);
const APP = args.shift();
let SRC = path.join(APP, 'index.html'), OUT = null, META = null;
while (args.length) { const a = args.shift(); if (a === '--out') OUT = args.shift(); else if (a === '--meta') META = args.shift(); else SRC = a; }
if (!OUT) OUT = path.join(APP, 'index.html');
const fail = m => { throw new Error('[inplace-split] ' + m); };

const TASK = 'TASK-ES-646';
const ENTRY = 'openProTemplateRecordModal';
// 여러 조각이 함께 보는 값(꾸러미로 간다). 측정으로 대조한다 — 다르면 멈춘다.
const DATA = ['editRec', 'initialDate', 'isNew', 'allTpls', 'curTpl', 'columns', 'rows', 'attachedPhoto', 'sheet'];
// 여러 조각이 부르는 안쪽 함수(주인 조각 → 꾸러미에 등록).
const FUNCS = { renderRowsHtml: 'entry', syncCurrentRowsFromDOM: 'table', updateAnalyticsBanner: 'table', refreshTableBody: 'table', bindRowEvents: 'table', updateTrendChart: 'chart', stopSwTimer: 'stopwatch' };
const PIECES = [
  { key: 'table', fn: 'bindProRecTable', note: '표 편집: 표의 칸을 읽어 행에 담기 · 실시간 분석 띠 · 표 다시 그리기 · 행 삭제 · 행 추가' },
  { key: 'tools', fn: 'bindProRecTools', note: '도구 단추: 지난 루틴 불러오기 · AI 코치 · Notion 연동 · CSV 가져오기/내려받기 · 스마트워치 · 템플릿 마켓 · AI 사진 인식 · 음성 입력 · 표 속성 편집 · 템플릿 변경 · 템플릿 생성 · 사진 첨부' },
  { key: 'chart', fn: 'bindProRecTrendChart', note: '성장 추이 차트: 점 설명 · 기간 칩 · 다시 그리기' },
  { key: 'stopwatch', fn: 'bindProRecStopwatch', note: '스톱워치·인터벌 타이머: 시작/정지 · 리셋 · 모드 · 랩 · 랩과 지금 시간을 표 칸에 기입' },
  { key: 'save', fn: 'bindProRecSave', note: '저장·닫기: 기기 즉시 저장 → 목표·일정·기록 연동 → 화면 갱신 → 서버 동기화 → Notion 자동 전송, 취소·돌아가기' },
];

const html = fs.readFileSync(SRC, 'utf8');
const EOL = html.includes('\r\n') ? '\r\n' : '\n';
const lines = html.split('\n').map(l => l.replace(/\r$/, ''));
let sLine = -1, eLine = -1;
for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { sLine = i + 1; break; }
if (sLine < 0) fail('인라인 IIFE 를 찾지 못했다');
for (let i = sLine; i < lines.length; i++) if (lines[i].startsWith('</script>')) { eLine = i; break; }
const code = lines.slice(sLine, eLine).join('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });

let iife = null, fnPath = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
for (const st of iife.get('body').get('body')) if (st.isFunctionDeclaration() && st.node.id.name === ENTRY) { if (fnPath) fail(ENTRY + ' 선언이 둘 이상'); fnPath = st; }
if (!fnPath) fail(ENTRY + ' 를 IIFE 최상위에서 찾지 못했다');
for (const p of PIECES) if (iife.scope.hasOwnBinding(p.fn)) fail('이미 조각 함수가 있다(' + p.fn + ') — 이미 정리된 index.html 이다');
if (iife.scope.hasOwnBinding('ctx')) fail('IIFE 최상위에 ctx 라는 이름이 있다');

// 줄 ↔ 글자 자리
const lineStart = [0];
for (let i = 0; i < code.length; i++) if (code[i] === '\n') lineStart.push(i + 1);
const LS = line => lineStart[line - 1];                                  // 그 줄(1부터)의 첫 글자
const LE = line => (line < lineStart.length ? lineStart[line] - 1 : code.length); // 그 줄의 끝(줄바꿈 앞)
const fileLine = line => line + sLine;                                   // index.html 줄 번호(1부터)

const fn = fnPath.node;
const fnStmts = fnPath.get('body').get('body');
const last = fnStmts[fnStmts.length - 1];
if (!(last.isExpressionStatement() && last.node.expression.type === 'CallExpression' && last.node.expression.callee.name === 'openModal' && last.node.expression.arguments.length === 2 && last.node.expression.arguments[1].type === 'FunctionExpression')) fail('마지막 문이 openModal(…, function(sheet){…}) 가 아니다');
const cbPath = last.get('expression').get('arguments')[1];
const cb = cbPath.node;
if (!(cb.params.length === 1 && cb.params[0].name === 'sheet')) fail('콜백 인자가 sheet 하나가 아니다');
const cbStmts = cbPath.get('body').get('body');

// 금지 요소
fnPath.traverse({
  ThisExpression() { fail('함수 안에 this 가 있다'); },
  WithStatement() { fail('함수 안에 with 가 있다'); },
  Identifier(p) {
    if (p.node.name === 'ctx') fail('함수 안에 ctx 라는 이름이 이미 있다');
    if (p.node.name === 'arguments' && p.isReferencedIdentifier()) fail('함수 안에 arguments 가 있다');
    if (p.node.name === 'eval' && p.isReferencedIdentifier()) fail('함수 안에 eval 이 있다');
  },
});

// ── 조각 경계(표지 문으로 찾는다 — 줄 번호에 기대지 않는다)
const idx = (name, pred) => { const hits = cbStmts.map((s, i) => (pred(s.node) ? i : -1)).filter(i => i >= 0); if (hits.length !== 1) fail('경계 표지 「' + name + '」 가 ' + hits.length + '개'); return hits[0]; };
const declares = n => s => s.type === 'VariableDeclaration' && s.declarations.length === 1 && s.declarations[0].id.name === n;
const callsBare = n => s => s.type === 'ExpressionStatement' && s.expression.type === 'CallExpression' && s.expression.callee.type === 'Identifier' && s.expression.callee.name === n && s.expression.arguments.length === 0;
const iTableEnd = idx('if(addBtn2) …', s => s.type === 'IfStatement' && s.test.type === 'Identifier' && s.test.name === 'addBtn2');
const iToolsStart = idx('var quickLoadBtn', declares('quickLoadBtn'));
const iToolsEnd = idx('if(photoBtn && fileInp){…}', s => s.type === 'IfStatement' && s.test.type === 'LogicalExpression' && s.test.left.name === 'photoBtn' && s.test.right.name === 'fileInp');
const iBindRows = idx('bindRowEvents();', callsBare('bindRowEvents'));
const iChartStart = idx('var curChartPeriod', declares('curChartPeriod'));
const iChartEnd = idx('bindChartEvents();', callsBare('bindChartEvents'));
const iSwStart = idx('var swTimerId', declares('swTimerId'));
const iSwEnd = idx('if(swInjectBtn){…}', s => s.type === 'IfStatement' && s.test.type === 'Identifier' && s.test.name === 'swInjectBtn');
if (!(cbStmts[0].isFunctionDeclaration() && cbStmts[0].node.id.name === 'syncCurrentRowsFromDOM')) fail('콜백 첫 문이 syncCurrentRowsFromDOM 선언이 아니다');
if (iToolsStart !== iTableEnd + 1 || iBindRows !== iToolsEnd + 1 || iChartStart !== iBindRows + 1 || iSwStart !== iChartEnd + 1 || iSwEnd + 1 >= cbStmts.length) fail('조각 경계가 이어지지 않는다');
const RANGE = { table: [0, iTableEnd], tools: [iToolsStart, iToolsEnd], chart: [iChartStart, iChartEnd], stopwatch: [iSwStart, iSwEnd], save: [iSwEnd + 1, cbStmts.length - 1] };
const firstLine = n => ((n.leadingComments && n.leadingComments.length) ? n.leadingComments[0].loc.start.line : n.loc.start.line);
const lastLine = n => { let l = n.loc.end.line; for (const c of n.trailingComments || []) if (c.loc.start.line === n.loc.end.line) l = Math.max(l, c.loc.end.line); return l; };
for (const p of PIECES) { const [a, b] = RANGE[p.key]; p.from = firstLine(cbStmts[a].node); p.to = lastLine(cbStmts[b].node); p.stmts = b - a + 1; }
const bindRowsLine = cbStmts[iBindRows].node.loc.start.line;
if (cbStmts[iBindRows].node.loc.end.line !== bindRowsLine || code.slice(LS(bindRowsLine), LE(bindRowsLine)).trim() !== 'bindRowEvents();') fail('bindRowEvents(); 줄에 다른 글자가 있다');
const cbOpenLine = cb.body.loc.start.line, cbCloseLine = cb.body.loc.end.line;
if (code.slice(LS(cbCloseLine), LE(cbCloseLine)).trim() !== '});') fail('콜백을 닫는 줄이 }); 가 아니다');
if (!/function\(sheet\)\{\s*$/.test(code.slice(LS(cbOpenLine), LE(cbOpenLine)))) fail('콜백을 여는 줄 끝이 function(sheet){ 가 아니다');
// 구간 밖 줄은 빈 줄뿐이어야 한다(글자를 흘리지 않는다)
const covered = new Set([bindRowsLine]);
for (const p of PIECES) for (let l = p.from; l <= p.to; l++) { if (covered.has(l)) fail('구간이 겹친다(줄 ' + fileLine(l) + ')'); covered.add(l); }
const droppedBlank = [];
for (let l = cbOpenLine + 1; l < cbCloseLine; l++) if (!covered.has(l)) { if (code.slice(LS(l), LE(l)).trim() !== '') fail('구간 밖에 빈 줄이 아닌 글자가 있다(줄 ' + fileLine(l) + ')'); droppedBlank.push(fileLine(l)); }

const pieceOf = pos => { for (const p of PIECES) if (pos >= LS(p.from) && pos <= LE(p.to)) return p.key; return 'entry'; };

// ── 이름 분류: 진입점 스코프·콜백 스코프의 이름마다 「어느 조각에서 선언·읽기·쓰기 하는가」
const table = [];
const edits = [];
const scopes = [['entry', fnPath.scope], ['callback', cbPath.scope]];
const seen = new Set();
for (const [where, scope] of scopes) {
  for (const name of Object.keys(scope.bindings)) {
    const b = scope.bindings[name];
    if (seen.has(name)) fail('두 스코프에 같은 이름이 있다: ' + name);
    seen.add(name);
    const declPiece = b.kind === 'param' ? 'entry' : pieceOf(b.identifier.start);
    const isFunc = b.path.isFunctionDeclaration();
    const reads = b.referencePaths.map(r => ({ node: r.node, piece: pieceOf(r.node.start), path: r }));
    const writes = [];
    for (const v of b.constantViolations) {
      if (v.isAssignmentExpression() && v.node.left.type === 'Identifier' && v.node.left.name === name) writes.push({ node: v.node.left, piece: pieceOf(v.node.left.start) });
      else if (v.isUpdateExpression() && v.node.argument.type === 'Identifier') writes.push({ node: v.node.argument, piece: pieceOf(v.node.argument.start) });
      else if (v.isVariableDeclarator() || v.isVariableDeclaration()) fail('같은 이름을 다시 선언한다: ' + name + ' — 조각 사이에 걸치면 값이 갈라진다');
      else fail('풀 수 없는 대입 꼴: ' + name + ' (' + v.type + ')');
    }
    const pieces = new Set([declPiece, ...reads.map(r => r.piece), ...writes.map(w => w.piece)]);
    // 콜백 인자 sheet 는 콜백(진입점)에서 꾸러미에 담는다
    const cross = pieces.size > 1;
    const row = { name, scope: where, kind: isFunc ? 'function' : (b.kind === 'param' ? 'param' : 'var'), declaredIn: declPiece, readIn: count(reads.map(r => r.piece)), writtenIn: count(writes.map(w => w.piece)), viaCtx: false };
    if (!isFunc && DATA.includes(name)) {
      if (!cross) fail('꾸러미 기대 목록의 ' + name + ' 가 한 조각에서만 쓰인다 — 목록을 다시 재야 한다');
      row.viaCtx = true;
      for (const r of reads) {
        const par = r.path.parent;
        if (par.type === 'ObjectProperty' && par.shorthand) fail('줄임 속성에 걸린다: ' + name);
        edits.push({ start: r.node.start, end: r.node.end, text: 'ctx.' + name, kind: 'read', name });
      }
      for (const w of writes) edits.push({ start: w.node.start, end: w.node.end, text: 'ctx.' + name, kind: 'write', name });
      if (b.kind !== 'param') {
        const d = b.path.node, decl = b.path.parent;
        if (!(decl.type === 'VariableDeclaration' && decl.kind === 'var' && decl.declarations.length === 1 && d.init)) fail('선언 꼴이 var X = … 하나가 아니다: ' + name);
        if (declPiece !== 'entry') fail('꾸러미로 가는 변수가 진입점 밖에서 선언된다: ' + name);
        edits.push({ start: decl.start, end: d.id.end, text: 'ctx.' + name, kind: 'decl', name });
      }
    } else if (isFunc && Object.prototype.hasOwnProperty.call(FUNCS, name)) {
      if (!cross) fail('꾸러미 기대 목록의 함수 ' + name + ' 가 한 조각에서만 쓰인다 — 목록을 다시 재야 한다');
      if (FUNCS[name] !== declPiece) fail('함수 ' + name + ' 의 주인 조각이 기대(' + FUNCS[name] + ')와 다르다: ' + declPiece);
      if (writes.length) fail('함수 이름에 대입한다: ' + name);
      row.viaCtx = true; row.owner = declPiece;
      for (const r of reads) if (r.piece !== declPiece) edits.push({ start: r.node.start, end: r.node.end, text: 'ctx.' + name, kind: 'call', name });
    } else if (cross) {
      fail('여러 조각에 걸친 이름이 기대 목록에 없다: ' + name + ' (' + [...pieces].join(', ') + ')');
    }
    table.push(row);
  }
}
function count(list) { const o = {}; for (const k of list) o[k] = (o[k] || 0) + 1; return o; }
for (const n of DATA) if (!seen.has(n)) fail('기대 목록의 이름이 함수에 없다: ' + n);
for (const n of Object.keys(FUNCS)) if (!seen.has(n)) fail('기대 목록의 함수가 함수에 없다: ' + n);

edits.sort((a, b) => a.start - b.start);
for (let i = 1; i < edits.length; i++) if (edits[i].start < edits[i - 1].end) fail('고칠 자리가 겹친다');
const apply = (from, to) => { let out = '', pos = from; for (const e of edits) { if (e.start < from || e.end > to) continue; out += code.slice(pos, e.start) + e.text; pos = e.end; } return out + code.slice(pos, to); };

// ── 새 글자 조립
const fnHeadLine = fn.body.loc.start.line; // function …(){ 줄
if (fn.loc.start.line !== fnHeadLine) fail('함수 머리가 한 줄이 아니다');
const IND = '    ', IND2 = '      ';
const out = [];
out.push(apply(fn.start, LE(fnHeadLine)));
out.push(IND + 'var ctx = { editRec: editRec, initialDate: initialDate, renderRowsHtml: renderRowsHtml }; /* [#' + TASK + '] 조각 함수들이 함께 보는 꾸러미 — 읽기·쓰기 모두 여기를 거친다 */');
out.push(apply(LS(fnHeadLine + 1), LE(cbOpenLine)));
out.push(IND2 + 'ctx.sheet = sheet;');
const callLine = p => IND2 + p.fn + '(ctx);';
const P = Object.fromEntries(PIECES.map(p => [p.key, p]));
out.push(callLine(P.table));
out.push(callLine(P.tools));
out.push(IND2 + 'ctx.bindRowEvents();');
out.push(callLine(P.chart));
out.push(callLine(P.stopwatch));
out.push(callLine(P.save));
out.push(apply(LS(cbCloseLine), fn.end));
for (const p of PIECES) {
  out.push('  function ' + p.fn + '(ctx){ /* [#' + TASK + '] 전문 템플릿 기록 창 조각 — ' + p.note + '. 꾸러미(ctx)는 ' + ENTRY + ' 가 만든다 */');
  const mine = Object.keys(FUNCS).filter(n => FUNCS[n] === p.key);
  if (mine.length) out.push(IND2 + mine.map(n => 'ctx.' + n + ' = ' + n + ';').join(' '));
  out.push(apply(LS(p.from), LE(p.to)));
  out.push('  }');
}
const newFnText = out.join('\n');
const newCode = code.slice(0, fn.start) + newFnText + code.slice(fn.end);
// 결과가 파싱되고 조각 함수가 IIFE 최상위에 있는지 확인
const ast2 = parser.parse(newCode, { sourceType: 'script', ranges: true });
let iife2 = null; traverse(ast2, { FunctionExpression(p) { if (!iife2) iife2 = p; } });
const top2 = iife2.get('body').get('body').filter(s => s.isFunctionDeclaration()).map(s => s.node);
const sizes = {};
for (const n of [ENTRY].concat(PIECES.map(p => p.fn))) { const f = top2.filter(x => x.id.name === n); if (f.length !== 1) fail('결과에 ' + n + ' 선언이 ' + f.length + '개'); sizes[n] = f[0].loc.end.line - f[0].loc.start.line + 1; if (sizes[n] > 800) fail(n + ' 가 800줄을 넘는다: ' + sizes[n]); }

const newLines = lines.slice(0, sLine).concat(newCode.split('\n'), lines.slice(eLine));
fs.writeFileSync(OUT, newLines.join(EOL), { encoding: 'utf8' });

const meta = {
  tool: 'reports/' + TASK + '/tools/inplace-split.cjs', task: TASK, entry: ENTRY,
  before: { firstLine: fileLine(fn.loc.start.line), lastLine: fileLine(fn.loc.end.line), lines: fn.loc.end.line - fn.loc.start.line + 1 },
  after: { functions: sizes, totalLines: Object.values(sizes).reduce((a, b) => a + b, 0), lineDelta: newCode.split('\n').length - code.split('\n').length },
  pieces: PIECES.map(p => ({ key: p.key, fn: p.fn, note: p.note, fromLine: fileLine(p.from), toLine: fileLine(p.to), statements: p.stmts, lines: p.to - p.from + 1 })),
  droppedBlankLines: droppedBlank,
  ctx: { data: DATA, functions: FUNCS, members: DATA.length + Object.keys(FUNCS).length },
  edits: { total: edits.length, byKind: count(edits.map(e => e.kind)), byName: count(edits.map(e => e.name)) },
  bindings: table,
  eol: EOL === '\r\n' ? 'CRLF' : 'LF',
};
if (META) fs.writeFileSync(META, JSON.stringify(meta, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ before: meta.before, after: meta.after, edits: meta.edits.byKind, ctxMembers: meta.ctx.members, droppedBlankLines: droppedBlank.length }, null, 1));
