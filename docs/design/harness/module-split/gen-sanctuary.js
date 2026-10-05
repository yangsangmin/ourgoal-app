'use strict';
// 포커스 성소 엔진 세포 쪼개기 생성기(#TASK-ES-429): js/sanctuary-v3-engine.js(1,964줄)에서 응집된 책임 묶음을 글자 그대로 새 파일로 옮긴다.
//   묶음 정의는 sanctuary-cells.js(세포마다 새 파일 하나 js/sanctuary-<하는 일>.js). 옮기는 코드 모양 세 가지:
//   ① fns: 원본 IIFE 최상위 함수 선언(바로 위 붙은 주석 포함). 원본은 IIFE 맨 위에서 같은 이름으로 가져온다(var X = _s<칸>.X — 이 줄보다 먼저 도는 문이 없어 함수 선언 끌어올림과 같은 값).
//   ② methods: window.OurgoalSanctuaryV3 객체 리터럴의 메서드 속성. 이어진 속성 덩어리를 세포의 K.methodsFrom_<첫 키> = { …글자 그대로… } 로 옮기고,
//      원본 객체 리터럴의 그 자리에는 펼침 한 줄(..._s<칸>.methodsFrom_<첫 키>,)을 둔다 — 키 순서·값(같은 함수 글자, 같은 이름 추론)이 같다.
//      메서드 최상위 this·arguments 는 0 이어야 한다(검사) — this 를 쓰는 메서드(setCalMode·openPeerDm 둘째)는 원본에 남는다.
//   ③ sections: 렌더 함수 if 사슬의 한 분기 본문. 세포의 함수 function <이름>(<인자>) { …본문 글자 그대로… return <바뀐 지역 변수>; } 로 옮기고,
//      원본 분기 본문은 <바뀐 지역 변수> = <이름>(<인자>); 한 줄이 된다. 검사: 본문이 바꾸는 렌더 함수 지역 변수는 하나 이하, 본문 안 선언 변수는 본문 밖에서 안 쓰임,
//      인자로 넘기는 지역 변수는 분기 뒤에 다시 대입되지 않음, 바뀐 변수를 본문 안 안쪽 함수가 잡지 않음, 본문 최상위 return·this·arguments·바깥 break/continue 0.
// 바꾸는 글자는 원본 IIFE 스코프 이름 앞 T. 접두뿐(T = 키트 칸 scope 의 getter 통로 — 원본이 머리 이음매에서 채운다). 원본 IIFE 인자 window 는 부품 IIFE 인자도 window 로 두고 같은 식(window)으로 부른다.
// 키트: 새 전역 1개 window.OurgoalSanctuaryV3Kit — 세포마다 칸 하나. 원본은 node module.exports 가 없으므로(node 에서는 window 가 없어 원래도 못 읽음) require 경로를 두지 않는다.
// 상태(engine)·공용 도우미·로드 시점 문(객체 대입·DOMContentLoaded 등록)은 원본에 둔다. 원본 단독 로드(부품 없음)에서도 던지지 않는다(펼침 대상 undefined 는 건너뜀, 가져온 함수는 부를 때만 쓰임).
// 위치: js/ 바로 아래(팀·통계·시간기록·컴포넌트 쪼개기와 같은 이유). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md. 손으로 옮기지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-sanctuary.js <APP_DIR>
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const TASK = '#TASK-ES-429';
const VER = '20261005-es429';
const SRC_REL = 'js/sanctuary-v3-engine.js';
const TAG = '<script src="js/sanctuary-v3-engine.js?v=20260928-prod-renewal-final"></script>';
const KITNAME = 'OurgoalSanctuaryV3Kit';
const API = 'OurgoalSanctuaryV3';
const CELLS = require('./sanctuary-cells.js');
const isCommentLine = t => t.startsWith('/*') || t.startsWith('*') || t.startsWith('//');

const SRC = path.join(APP, SRC_REL);
const code = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
if (code.includes('[' + TASK + ']')) throw new Error('이미 옮긴 판: ' + SRC_REL);
const lines = code.split('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });
let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const PARAMS = new Set(iife.node.params.map(p => p.name));
if (PARAMS.size !== 1 || !PARAMS.has('window')) throw new Error('원본 IIFE 인자가 window 하나가 아님');
const callArg = code.slice(ast.program.body[0].expression.arguments[0].start, ast.program.body[0].expression.arguments[0].end);
if (callArg !== 'window') throw new Error('원본 IIFE 부르는 식이 다름: ' + callArg);
iife.traverse({ Identifier(p) { if (['K', 'T', 'KIT', 'root'].includes(p.node.name)) throw new Error('원본에 부품 예약 이름이 있다: ' + p.node.name); } });
const top = iife.get('body').get('body');
const S = n => n.loc.start.line, E = n => n.loc.end.line;
const src = n => code.slice(n.start, n.end);
const fnStmt = name => { const f = top.find(s => s.isFunctionDeclaration() && s.node.id.name === name); if (!f) throw new Error('함수 없음 ' + name); return f; };
const nonArrowFn = p => { let f = p.getFunctionParent(); while (f && f.isArrowFunctionExpression()) f = f.parentPath.getFunctionParent(); return f; };

// 공개 객체 window.OurgoalSanctuaryV3 = { … }
const apiStmt = top.find(s => s.isExpressionStatement() && s.get('expression').isAssignmentExpression() && src(s.node.expression.left) === 'window.' + API);
if (!apiStmt) throw new Error('공개 객체 대입문 없음');
const props = apiStmt.get('expression.right.properties');
const propKey = p => p.node.key.name;
function resolveMethod(spec) {
  const [k, occ] = spec.split('#');
  const same = props.filter(p => propKey(p) === k);
  const p = same[occ === undefined ? 0 : Number(occ)];
  if (!p) throw new Error('메서드 없음 ' + spec);
  if (occ === undefined && same.length !== 1) throw new Error('같은 키 메서드가 여럿 — #순번 필요: ' + spec);
  if (!p.isObjectProperty() || !(p.get('value').isFunctionExpression())) throw new Error('메서드 값이 function 식이 아님: ' + spec);
  return p;
}

const ALL_FNS = new Set([].concat(...CELLS.map(c => c.fns)));
for (const n of ALL_FNS) {
  const b = iScope.getBinding(n);
  if (!b || !b.path.isFunctionDeclaration()) throw new Error('최상위 함수 선언 아님: ' + n);
  if (b.constantViolations.length) throw new Error('이전 함수 재대입/중복 선언: ' + n);
}
const SECTION_NAMES = [].concat(...CELLS.map(c => c.sections.map(s => s.name)));
for (const n of SECTION_NAMES) if (iScope.getBinding(n) || iScope.hasGlobal(n)) throw new Error('구간 함수 이름이 이미 쓰임: ' + n);
// 원본 최상위 문(함수 선언 밖)이 옮길 함수를 IIFE 실행 중 바로 부르지 않는지 — 값으로 읽는 것(공개 객체 값)만 허용
for (const s of top) {
  if (s.isFunctionDeclaration()) continue;
  s.traverse({ Identifier(p) {
    if (!ALL_FNS.has(p.node.name) || !p.isReferencedIdentifier() || p.getFunctionParent()) return;
    if (p.parentPath.isCallExpression() && p.parent.callee === p.node) throw new Error('최상위 문이 옮길 함수를 바로 부름: ' + p.node.name);
  } });
}

const edits = [];
// 옮길 코드 안의 원본 IIFE 스코프 이름 → T.<이름>. sec 가 있으면 렌더 함수 지역 변수도 모은다.
function bridge(rootPath, label, cellLocal, bridged, sec) {
  rootPath.traverse({
    ThisExpression(p) { const f = nonArrowFn(p); if (!f || f.node === sec?.fnNode || f.node === rootPath.node || f.node === rootPath.node.value) throw new Error('옮길 코드 최상위 this: ' + label); },
    ReturnStatement(p) { if (sec && p.getFunctionParent().node === sec.fnNode) throw new Error('분기 본문 최상위 return: ' + label); },
    'BreakStatement|ContinueStatement'(p) {
      if (!sec) return;
      let q = p.parentPath, inside = false;
      while (q && q.node !== sec.block) { if (q.isLoop() || q.isSwitchStatement() || q.isFunction() || (p.node.label && q.isLabeledStatement())) { inside = true; break; } q = q.parentPath; }
      if (!inside) throw new Error('분기 본문 바깥으로 break/continue: ' + label);
    },
    Identifier(p) {
      const nm = p.node.name;
      const par = p.parent;
      if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
      if (p.parentPath.isFunctionDeclaration() && par.id === p.node) return;
      if (nm === 'arguments' && !p.scope.getBinding(nm)) { const f = nonArrowFn(p); if (!f || f.node === sec?.fnNode || f.node === rootPath.node || f.node === rootPath.node.value) throw new Error('옮길 코드 최상위 arguments: ' + label); return; }
      const b = p.scope.getBinding(nm);
      if (!b) return;
      if (sec && b.scope === sec.fnScope) {
        const asg = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression();
        if (sec.declaredHere.has(nm)) { sec.internal.add(nm); return; }
        const e = sec.outer.get(nm) || { read: false, write: false, inner: false };
        if (asg) e.write = true; else e.read = true;
        if (p.getFunctionParent().node !== sec.fnNode) e.inner = true;
        sec.outer.set(nm, e);
        return;
      }
      if (b.scope !== iScope) return;
      if (PARAMS.has(nm)) return; // window — 부품 IIFE 인자도 window(같은 식으로 부른다), 글자 그대로
      if (cellLocal.has(nm)) return; // 같은 세포 안 함수
      const asg = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression();
      const e = bridged.get(nm) || { set: false };
      if (asg) e.set = true;
      bridged.set(nm, e);
      if (p.parentPath.isObjectProperty() && par.shorthand) { edits.push({ start: par.start, end: par.end, text: nm + ': T.' + nm }); return; }
      edits.push({ start: p.node.start, end: p.node.end, text: 'T.' + nm });
    }
  });
}

const plans = [];
for (const C of CELLS) {
  const cellLocal = new Set(C.fns);
  const bridged = new Map();
  const items = []; // { kind, from, to, ... } — 원본 줄 구간
  // ① 함수 덩어리
  const MOVED = new Set(C.fns);
  let cur = null;
  const fnBlocks = [];
  for (const s of top) {
    const nm = s.isFunctionDeclaration() ? s.node.id.name : null;
    const mv = nm && MOVED.has(nm);
    if (mv && cur) { cur.names.push(nm); cur.to = E(s.node); continue; }
    if (cur) { fnBlocks.push(cur); cur = null; }
    if (mv) {
      let from = S(s.node);
      while (from > 1 && lines[from - 2].trim() && isCommentLine(lines[from - 2].trim())) from--;
      cur = { kind: 'fns', names: [nm], from, to: E(s.node) };
    }
  }
  if (cur) fnBlocks.push(cur);
  for (const bl of fnBlocks) {
    for (let l = bl.from; l <= bl.to; l++) {
      if (bl.names.some(n => l >= S(fnStmt(n).node) && l <= E(fnStmt(n).node))) continue;
      const t = lines[l - 1].trim();
      if (t && !isCommentLine(t)) throw new Error('덩어리 안 함수 밖 코드 줄 ' + l + ': ' + t);
    }
    for (const n of bl.names) bridge(fnStmt(n), n, cellLocal, bridged, null);
    items.push(bl);
  }
  // ② 메서드 덩어리(공개 객체 안에서 이어진 속성)
  const mprops = C.methods.map(resolveMethod).sort((a, b) => a.node.start - b.node.start);
  const runs = [];
  for (const p of mprops) {
    const idx = props.indexOf(p);
    const last = runs[runs.length - 1];
    if (last && last.lastIdx === idx - 1) { last.props.push(p); last.lastIdx = idx; } else runs.push({ props: [p], lastIdx: idx });
  }
  for (const r of runs) {
    const first = r.props[0], lastP = r.props[r.props.length - 1];
    let from = S(first.node);
    while (from > 1 && lines[from - 2].trim() && isCommentLine(lines[from - 2].trim())) from--;
    const to = E(lastP.node);
    if (lines[S(first.node) - 1].slice(0, first.node.loc.start.column).trim()) throw new Error('메서드 줄 앞에 다른 글자: ' + propKey(first));
    const tail = lines[to - 1].slice(lastP.node.loc.end.column).trim();
    if (tail !== '' && tail !== ',') throw new Error('메서드 줄 뒤에 다른 글자: ' + propKey(lastP) + ' ' + tail);
    const nextIdx = r.lastIdx + 1;
    if (props[nextIdx] && S(props[nextIdx].node) <= to) throw new Error('다음 속성이 같은 줄에서 시작');
    const prevIdx = props.indexOf(first) - 1;
    if (prevIdx >= 0 && E(props[prevIdx].node) >= from) throw new Error('앞 속성이 같은 줄에서 끝남');
    const keys = r.props.map(propKey);
    const runKey = 'methodsFrom_' + keys[0];
    for (const p of r.props) {
      const v = p.get('value');
      if (v.node.params.some(x => x.type !== 'Identifier')) throw new Error('메서드 인자 모양: ' + propKey(p));
      bridge(v, propKey(p), cellLocal, bridged, null);
      v.traverse({ ThisExpression(q) { if (nonArrowFn(q).node === v.node) throw new Error('메서드 최상위 this: ' + propKey(p)); } });
    }
    const indent = lines[S(first.node) - 1].match(/^\s*/)[0];
    items.push({ kind: 'methods', runKey, keys, from, to, replace: indent + '...' + C.imp + '.' + runKey + (tail === ',' ? ',' : '') + ' // [' + TASK + '] 메서드 ' + keys.join('·') + ' → ' + C.cell });
  }
  // ③ 렌더 분기 본문
  for (const D of C.sections) {
    const fp = fnStmt(D.fn);
    let target = null, ifNode = null;
    fp.traverse({ IfStatement(p) {
      if (target || p.getFunctionParent().node !== fp.node || src(p.node.test) !== D.test) return;
      const blk = D.branch === 'else' ? p.get('alternate') : p.get('consequent');
      if (!blk.node || !blk.isBlockStatement()) throw new Error('분기 본문이 블록이 아님: ' + D.name);
      target = blk; ifNode = p.node;
    } });
    if (!target) throw new Error('분기 못 찾음: ' + D.fn + ' ' + D.test);
    const block = target.node;
    if (!block.body.length) throw new Error('빈 분기: ' + D.name);
    const from = S(block) + 1, to = E(block) - 1;
    if (!lines[S(block) - 1].trimEnd().endsWith('{') || !lines[E(block) - 1].trim().startsWith('}')) throw new Error('블록 괄호가 본문 줄과 섞임: ' + D.name);
    if (S(block.body[0]) < from || E(block.body[block.body.length - 1]) > to) throw new Error('본문 문이 괄호 줄에 걸침: ' + D.name);
    // 본문이 (렌더 함수 단위로) var 선언하는 이름 — 같은 if 사슬의 다른 분기도 같은 이름을 선언해 쓰면(호출마다 한 분기만 돈다) 분기별 지역 변수로 나눠도 같다(아래 검사)
    const declOf = (blkPath) => { const s = new Set(); blkPath.traverse({ VariableDeclarator(q) { if (q.parentPath.node.kind === 'var' && q.getFunctionParent().node === fp.node && q.node.id.type === 'Identifier') s.add(q.node.id.name); } }); return s; };
    const chainBlocks = []; { let c = fp.get('body').get('body').find(x => x.isIfStatement() && x.node.start <= ifNode.start && x.node.end >= ifNode.end) || null; let q = c; while (q && q.isIfStatement()) { chainBlocks.push(q.get('consequent')); const alt = q.get('alternate'); if (alt.node && !alt.isIfStatement()) chainBlocks.push(alt); q = alt.node ? alt : null; } }
    if (!chainBlocks.length) throw new Error('if 사슬이 렌더 함수 최상위 문이 아님: ' + D.name);
    const sec = { fnNode: fp.node, fnScope: fp.scope, block, internal: new Set(), outer: new Map(), declaredHere: declOf(target) };
    bridge(target, D.name, cellLocal, bridged, sec);
    for (const nm of sec.internal) {
      const b = fp.scope.getBinding(nm);
      const outside = [...b.referencePaths, ...b.constantViolations].filter(x => x.node.start < block.start || x.node.end > block.end);
      for (const x of outside) {
        const cb = chainBlocks.find(k => k.node !== block && x.node.start >= k.node.start && x.node.end <= k.node.end);
        if (!cb) throw new Error('본문 안 선언 변수를 if 사슬 밖에서 씀: ' + D.name + ' ' + nm + ' @' + S(x.node));
        if (!declOf(cb).has(nm)) throw new Error('다른 분기가 본문 선언 변수를 자기 선언 없이 씀: ' + D.name + ' ' + nm + ' @' + S(x.node));
      }
      if (outside.length) sec.sharedNames = (sec.sharedNames || []).concat(nm);
    }
    const writes = [...sec.outer].filter(([, e]) => e.write).map(([n]) => n);
    if (writes.length > 1) throw new Error('본문이 바꾸는 렌더 함수 지역 변수가 둘 이상: ' + D.name + ' ' + writes.join(','));
    const result = writes[0] || null;
    for (const [nm, e] of sec.outer) {
      const b = fp.scope.getBinding(nm);
      if (b.kind === 'param') throw new Error('렌더 함수 인자를 씀(이번 틀 밖): ' + nm);
      if (nm === result && e.inner) throw new Error('바뀌는 변수를 안쪽 함수가 잡음: ' + nm);
      if (nm !== result) {
        const late = b.constantViolations.filter(x => x.node.start > ifNode.start);
        if (late.length) throw new Error('인자로 넘길 변수가 분기 뒤에 다시 대입됨: ' + nm);
      }
    }
    const params = [...sec.outer.keys()].sort((a, b) => fp.scope.getBinding(a).path.node.start - fp.scope.getBinding(b).path.node.start);
    for (const n of params) if (['K', 'T', 'KIT', 'window'].includes(n) || ALL_FNS.has(n)) throw new Error('인자 이름 충돌: ' + n);
    const firstBody = lines.slice(from - 1, to).find(l => l.trim());
    const indent = firstBody.match(/^\s*/)[0];
    const call = D.name + '(' + params.join(', ') + ');';
    items.push({ kind: 'section', name: D.name, fn: D.fn, test: D.test, branch: D.branch || 'then', from, to, params, result,
      replace: indent + (result ? result + ' = ' : '') + call + ' // [' + TASK + '] 분기 본문 → ' + C.cell });
  }
  items.sort((a, b) => a.from - b.from);
  plans.push({ C, items, bridged });
}
// 구간 겹침 검사
const allItems = [].concat(...plans.map(p => p.items.map(it => Object.assign({ cell: p.C.cell }, it)))).sort((a, b) => a.from - b.from);
for (let i = 1; i < allItems.length; i++) if (allItems[i].from <= allItems[i - 1].to) throw new Error('옮길 구간이 겹침: ' + allItems[i - 1].from + '~' + allItems[i - 1].to + ' / ' + allItems[i].from);

const seen = new Set();
const uniq = edits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.start - a.start);
let newCode = code;
for (const e of uniq) newCode = newCode.slice(0, e.start) + e.text + newCode.slice(e.end);
const newLines = newCode.split('\n');
if (newLines.length !== lines.length) throw new Error('줄 수가 바뀜');
const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(newLines[l - 1]); return o; };

const removed = new Set();
const replaceAt = new Map();
const lineCell = new Map();
const meta = {};
const seam = [
  '',
  '  /* ============ [' + TASK + '] 포커스 성소 세포 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) ============',
  '     레이더 함수·렌더 분기 본문·공개 객체 메서드를 js/sanctuary-*.js 세포로 옮겼다(동작 그대로, index.html 이 세포를 먼저 읽는다).',
  '     ① 옮긴 함수는 이 스코프에서 같은 이름으로 가져온다 ② 옮긴 메서드는 아래 window.OurgoalSanctuaryV3 객체의 같은 자리에서 펼친다(...)',
  '     ③ 옮긴 코드가 읽는 이 스코프 이름만 키트 칸 scope 에 getter 로 노출한다(목록은 스코프 분석으로 뽑았다). */',
  '  var _sKit = window.' + KITNAME + ' || {};',
];
const importLines = [], scopeLines = [];
for (const { C, items, bridged } of plans) {
  const body = [];
  const descr = [];
  for (const it of items) {
    if (body.length) body.push('');
    if (it.kind === 'fns') {
      body.push(...range(it.from, it.to));
      descr.push('함수 ' + it.names.join('·') + '(' + it.from + '~' + it.to + ')');
      for (let l = it.from; l <= it.to; l++) { removed.add(l); lineCell.set(l, C.cell); }
      if (lines[it.to] !== undefined && lines[it.to].trim() === '') { removed.add(it.to + 1); lineCell.set(it.to + 1, C.cell); }
    } else if (it.kind === 'methods') {
      body.push('  // [' + TASK + '] window.' + API + ' 메서드 ' + it.keys.join('·') + ' — 이전 전 ' + it.from + '~' + it.to + '줄 글자 그대로. 원본 객체 리터럴의 같은 자리에서 펼친다(...).');
      body.push('  K.' + it.runKey + ' = {');
      body.push(...range(it.from, it.to));
      body.push('  };');
      descr.push('메서드 ' + it.keys.join('·') + '(' + it.from + '~' + it.to + ')');
      for (let l = it.from; l <= it.to; l++) removed.add(l);
      replaceAt.set(it.from, it.replace);
    } else {
      body.push('  // [' + TASK + '] ' + it.fn + ' 의 「' + it.test + '」' + (it.branch === 'else' ? ' 아닌(else)' : '') + ' 분기 본문 — 이전 전 ' + it.from + '~' + it.to + '줄 글자 그대로.');
      body.push('  //   렌더 함수 지역 변수(' + it.params.join('·') + ')는 인자로 받는다' + (it.result ? ', 바뀐 ' + it.result + ' 을 돌려준다.' : '.'));
      body.push('  function ' + it.name + '(' + it.params.join(', ') + ') {');
      body.push(...range(it.from, it.to));
      if (it.result) body.push('    return ' + it.result + ';');
      body.push('  }');
      descr.push('분기 본문 ' + it.name + '(' + it.from + '~' + it.to + ')');
      for (let l = it.from; l <= it.to; l++) removed.add(l);
      replaceAt.set(it.from, it.replace);
    }
  }
  const exportNames = [...C.fns, ...C.sections.map(s => s.name)];
  const cellOut = [
    '/**',
    ' * OurGoal Sanctuary Cell: ' + C.role + ' (' + TASK + ' · 포커스 성소 엔진 세포 쪼개기)',
    ' *',
    ' * ' + SRC_REL + '(' + (lines.length - 1) + '줄)에서 동작 그대로 옮겼다(이전 전 줄 번호):',
    ...descr.map(d => ' *   ' + d),
    ' * 바꾼 글자는 원본 스코프 이름 앞 T. 접두뿐이다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
    ' * 바깥에서는 이전과 같이 window.' + API + ' 로 부른다(메서드는 원본 객체의 같은 자리에서 펼치고, 함수는 원본이 같은 이름으로 가져온다). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md',
    ' */',
    '(function(window) {',
    "  'use strict';",
    '  // T = ' + SRC_REL + ' 의 스코프 통로 — 원본 IIFE 에 남은 상태(engine)·함수를 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.',
    '  // K = 성소 세포 키트의 ' + C.kit + ' 칸 — 옮긴 함수·메서드 묶음을 담는다(전역 이름은 키트 ' + KITNAME + ' 하나만 는다).',
    '  // root = window 인자(키트 등록 전용 별칭 — 컴포넌트·팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).',
    '  var root = window;',
    '  var KIT = root.' + KITNAME + ' = root.' + KITNAME + ' || {};',
    '  var K = KIT.' + C.kit + ' = KIT.' + C.kit + ' || {};',
    '  var T = K.scope = K.scope || {};',
    '',
    ...body,
    '',
    ...exportNames.map(n => '  K.' + n + ' = ' + n + ';'),
    '})(window);',
    '',
  ];
  fs.writeFileSync(path.join(APP, C.cell), cellOut.join('\n'), 'utf8');
  seam.push('  var ' + C.imp + ' = _sKit.' + C.kit + ' || {};');
  importLines.push(...exportNames.map(n => '  var ' + n + ' = ' + C.imp + '.' + n + ';'));
  const bs = [...bridged.keys()].sort();
  const getters = [];
  bs.forEach(n => { getters.push('get ' + n + '(){ return ' + n + '; }'); if (bridged.get(n).set) getters.push('set ' + n + '(v){ ' + n + ' = v; }'); });
  if (getters.length) scopeLines.push('  Object.defineProperties(' + C.imp + '.scope || (' + C.imp + '.scope = {}), Object.getOwnPropertyDescriptors({ ' + getters.join(', ') + ' }));');
  meta[C.cell] = { items: items.map(it => ({ kind: it.kind, from: it.from, to: it.to, names: it.names || it.keys || [it.name], params: it.params, result: it.result })), bridged: bs.map(n => n + (bridged.get(n).set ? ' (get/set)' : '')), cellLines: cellOut.length - 1 };
}
seam.push(...importLines, ...scopeLines);
const strictLine = S((iife.node.body.directives && iife.node.body.directives[0]) || iife.node.body.body[0]);
if (lines[strictLine - 1].trim() !== "'use strict';") throw new Error("IIFE 첫 문이 'use strict' 아님");
// 옮긴 함수 덩어리 사이에 빈 줄만 남으면 그 빈 줄도 지운다
for (let l = 1; l <= lines.length; l++) {
  if (removed.has(l) || lines[l - 1].trim() || replaceAt.size && [...replaceAt.keys()].includes(l)) continue;
  let a = l - 1; while (a >= 1 && !lines[a - 1].trim() && !removed.has(a)) a--;
  let b = l + 1; while (b <= lines.length && !lines[b - 1].trim() && !removed.has(b)) b++;
  if (removed.has(a) && removed.has(b) && lineCell.has(a) && lineCell.has(b)) removed.add(l);
}
const mainOut = [];
for (let l = 1; l <= lines.length; l++) {
  if (replaceAt.has(l)) mainOut.push(replaceAt.get(l));
  else if (removed.has(l) && lineCell.has(l) && !removed.has(l - 1)) {
    const cells = []; let fns = [];
    for (let k = l; removed.has(k); k++) if (lineCell.has(k) && !cells.includes(lineCell.get(k))) cells.push(lineCell.get(k));
    for (const P of plans) for (const it of P.items) if (it.kind === 'fns' && it.from >= l) { let k = l; while (removed.has(k)) k++; if (it.from < k) fns = fns.concat(it.names); }
    mainOut.push('  /* [' + TASK + '] 함수 ' + fns.join('·') + ' → ' + cells.join('·') + ' 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */', '');
  }
  if (!removed.has(l)) mainOut.push(lines[l - 1]);
  if (l === strictLine) mainOut.push(...seam);
}
fs.writeFileSync(SRC, mainOut.join('\n'), 'utf8');
// index.html: 원본 태그 바로 앞, 같은 줄에 새 태그(순증가 0줄)
let html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
if (html.split(TAG).length !== 2) throw new Error('원본 태그 자리가 1곳이 아님: ' + TAG);
const NEW_TAGS = CELLS.map(C => '<script src="' + C.cell + '?v=' + VER + '"></script>').join('');
html = html.replace(TAG, NEW_TAGS + TAG);
fs.writeFileSync(path.join(APP, 'index.html'), html, 'utf8');
meta[SRC_REL] = { linesBefore: lines.length - 1, linesAfter: mainOut.length - 1, edits: uniq.length };
console.log(JSON.stringify(meta, null, 1));
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-sanctuary-meta.json'), JSON.stringify(meta, null, 1));
