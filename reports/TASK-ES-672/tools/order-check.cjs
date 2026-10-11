'use strict';
// #TASK-ES-672 — 조각 호출 순서와 꾸러미 등록 의존을 세포 파일에서 직접 잰다(작업자 측정, 판정 아님).
// PR #936 독립 검토가 남긴 주의: 도구 조각(둘째)의 처리기가 ctx.updateTrendChart() 를 부르는데 그 등록은 차트 조각(셋째)의 첫 문이다.
// 지금은 문제없지만 진입점의 조각 호출 순서를 바꾸면 TypeError 가 날 수 있다 — 그래서 이전 뒤에도 아래가 그대로인지 본다.
//   ① 진입점 콜백의 문 순서가 「ctx.sheet = sheet → 표 → 도구 → ctx.bindRowEvents() → 차트 → 스톱워치 → 저장」 그대로인가(이름 앞 L. 은 뗀다)
//   ② 꾸러미에 등록하는 문(ctx.F = F;)이 주인 조각의 맨 앞에 있는가
//   ③ 다른 조각이 등록한 함수를 부르는 자리(ctx.F(…))가 전부 「안쪽 함수 안」(단추를 누른 뒤에 도는 자리)인가 — 연결 중에 바로 부르는 것은 진입점의 ctx.bindRowEvents() 하나뿐이어야 한다
// 사용: node reports/TASK-ES-672/tools/order-check.cjs <작업 트리> <proof.json> <out.json>
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const [WORK, PROOF, OUT] = process.argv.slice(2);
const proof = JSON.parse(fs.readFileSync(PROOF, 'utf8'));
const EXPECT_ORDER = ['ctx.sheet = sheet', 'bindProRecTable(ctx)', 'bindProRecTools(ctx)', 'ctx.bindRowEvents()', 'bindProRecTrendChart(ctx)', 'bindProRecStopwatch(ctx)', 'bindProRecSave(ctx)'];
const problems = [];
const pieces = {}; // 조각 함수 이름 → { file, registers[], registrationFirst, calls[] }
let entryOrder = null;
for (const cell of proof.cells) {
  const name = cell.take[0].names[0];
  const code = fs.readFileSync(path.join(WORK, cell.file), 'utf8');
  const ast = parser.parse(code, { sourceType: 'script', ranges: true });
  let fnPath = null;
  traverse(ast, { FunctionDeclaration(p) { if (p.node.id.name === name && !fnPath) fnPath = p; } });
  if (!fnPath) { problems.push('함수를 못 찾음: ' + name + ' in ' + cell.file); continue; }
  const src = n => code.slice(n.start, n.end);
  const body = fnPath.get('body').get('body');
  const info = { file: cell.file, registers: [], registrationFirst: true, crossCalls: [] };
  let mountCb = null;
  if (name === 'openProTemplateRecordModal') {
    const last = body[body.length - 1].node.expression; // (L.)openModal(renderModal(), function(sheet){…})
    const cb = last.arguments[1]; mountCb = cb;
    entryOrder = cb.body.body.map(st => src(st).replace(/;\s*$/, '').replace(/(^|[^A-Za-z0-9_$.])L\./g, '$1'));
    const lit = body[0].node.declarations && body[0].node.declarations[0].init;
    info.ctxLiteralKeys = lit && lit.type === 'ObjectExpression' ? lit.properties.map(p => p.key.name) : null;
  } else {
    let seenOther = false;
    for (const st of body) {
      const e = st.node.type === 'ExpressionStatement' ? st.node.expression : null;
      const isReg = e && e.type === 'AssignmentExpression' && e.left.type === 'MemberExpression' && e.left.object.name === 'ctx' && e.right.type === 'Identifier' && e.right.name === e.left.property.name;
      if (isReg) { if (seenOther) info.registrationFirst = false; info.registers.push(e.right.name); } else seenOther = true;
    }
    if (!info.registrationFirst) problems.push(name + ': 등록 문이 조각의 맨 앞이 아니다');
  }
  // ctx.F(…) 호출: 어느 깊이에서 부르는가
  fnPath.traverse({
    CallExpression(p) {
      const c = p.node.callee;
      if (!(c.type === 'MemberExpression' && !c.computed && c.object.type === 'Identifier' && c.object.name === 'ctx')) return;
      // 진입점에서는 창을 붙일 때 바로 도는 콜백(openModal 의 둘째 인자) 안이 「연결 중」이다
      let depth = 0; for (let q = p.getFunctionParent(); q && q !== fnPath && q.node !== mountCb; q = q.getFunctionParent()) depth++;
      info.crossCalls.push({ fn: c.property.name, insideInnerFunction: depth > 0, line: p.node.loc.start.line });
    },
  });
  pieces[name] = info;
}
const owner = {}; for (const [n, i] of Object.entries(pieces)) for (const r of i.registers) owner[r] = n;
const immediate = [];
for (const [n, i] of Object.entries(pieces)) for (const c of i.crossCalls) {
  if (!owner[c.fn] && !(pieces.openProTemplateRecordModal.ctxLiteralKeys || []).includes(c.fn)) problems.push(n + ': 등록되지 않은 꾸러미 함수를 부른다 — ctx.' + c.fn);
  if (!c.insideInnerFunction) immediate.push({ in: n, call: 'ctx.' + c.fn + '()', line: c.line });
}
const orderSame = JSON.stringify(entryOrder) === JSON.stringify(EXPECT_ORDER);
if (!orderSame) problems.push('진입점의 조각 호출 순서가 다르다: ' + JSON.stringify(entryOrder));
const onlyBindRows = immediate.length === 1 && immediate[0].in === 'openProTemplateRecordModal' && immediate[0].call === 'ctx.bindRowEvents()';
if (!onlyBindRows) problems.push('연결 중에 바로 부르는 꾸러미 함수가 ctx.bindRowEvents() 하나가 아니다: ' + JSON.stringify(immediate));
const out = { tool: 'reports/TASK-ES-672/tools/order-check.cjs', type: '작업자 측정, 판정 아님', ok: problems.length === 0, problems,
  entryCallOrder: entryOrder, expectedOrder: EXPECT_ORDER, orderSame,
  registrations: Object.fromEntries(Object.entries(pieces).filter(([, i]) => i.registers.length).map(([n, i]) => [n, { registers: i.registers, first: i.registrationFirst }])),
  ctxLiteralKeys: pieces.openProTemplateRecordModal && pieces.openProTemplateRecordModal.ctxLiteralKeys,
  crossCalls: Object.fromEntries(Object.entries(pieces).map(([n, i]) => [n, i.crossCalls.reduce((o, c) => { const k = 'ctx.' + c.fn + (c.insideInnerFunction ? ' (처리기 안)' : ' (연결 중 바로)'); o[k] = (o[k] || 0) + 1; return o; }, {})])),
  immediateCalls: immediate, onlyImmediateIsBindRowEvents: onlyBindRows,
  note: '도구 조각의 처리기 둘(템플릿 변경 · 템플릿 생성)이 ctx.updateTrendChart() 를 부르고, 그 등록은 차트 조각의 첫 문이다. 처리기는 창이 다 연결된 뒤 단추를 눌러야 돌므로 지금 순서에서는 등록이 먼저다. 진입점의 조각 호출 순서를 바꾸면 이 전제가 깨질 수 있다 — 순서를 바꾸지 않는다.' };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ ok: out.ok, problems, orderSame, immediate, registrations: out.registrations, cross: out.crossCalls }));
process.exit(out.ok ? 0 : 1);
