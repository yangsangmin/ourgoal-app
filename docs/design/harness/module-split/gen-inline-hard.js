'use strict';
// 인라인 어려움 묶음 생성기(#TASK-ES-439) — 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md
// index.html 인라인 IIFE 의 책임 묶음(scripts/inline-script-map.js 지도의 묶음)을 설정 파일대로 세포 파일로 글자 그대로 옮긴다.
// 1차 생성기(gen-inline-split-1.js, #TASK-ES-423)는 "묶음 안에 옮기지 않는 문이 있으면 멈춘다". 이 생성기는 어려움 유형을 표준 이음매로 푼다:
//   · 함수 선언                      → 세포로 옮김. index.html 은 IIFE 머리에서 같은 이름으로 가져온다(var X = _kit.X — 끌어올림과 같은 효과).
//   · 순수 상수(초기값에 이름·호출 0, 재대입 0) → 세포로 옮김 + 같은 이름으로 가져옴(같은 객체 — 바깥의 내용 변경도 그대로 보인다).
//   · 상태 변수(재대입 있음·초기값이 실행되는 식) → 원래 자리에 그대로 둔다. 옮긴 코드는 L.<이름> getter 로 읽고, 대입하면 setter 를 단다(유형 A1·A2).
//   · window.X = … 노출 문(B1)       → 원래 자리에 그대로 둔다(노출 순서·바깥 파일 덮어쓰기 순서 보존, 인라인 on*="X()" 도 그대로 닿는다 — 유형 C·J).
//   · 설정 take 의 keepRest: true → 이 묶음에서 이름을 고르지 않은 문은 원래 자리에 둔다(묶음을 나눠 옮길 때).
//   · 로드 중 다른 문(B2·B3)         → 4줄 이상이고 감싸도 안전하면 본문을 세포 함수로 옮기고 원래 자리에 그 함수 부르는 한 줄을 남긴다(호출 순서 보존).
//                                       3줄 이하이거나 감쌀 수 없으면(IIFE 로 끌어올려지는 var·최상위 this/arguments/return) 그대로 둔다.
// 이름 참조만 바꾼다: 인라인 IIFE 스코프 이름은 L.<이름>(js/core/app-scope.js 통로), 같은 세포 안 이름은 그대로.
// 머리 이음매는 구역 자리 표지(`/* [어려움 이음매 자리 Hn] */`) 바로 아래에 넣는다 — 구역마다 자리가 달라 병렬 빌더의 병합 충돌이 나지 않는다.
// 손으로 옮기지 않는다. 결과를 바꾸려면 설정을 바꿔 다시 돌린다(입력 = 이전 전 index.html).
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-inline-hard.js <APP_DIR> <설정.json> [이전 전 index.html]
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const CFG = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const SRC = process.argv[4] || path.join(APP, 'index.html');
const TAG = CFG.task; // 예: 'TASK-ES-439'
const html = fs.readFileSync(SRC, 'utf8');
const EOL = html.includes('\r\n') ? '\r\n' : '\n';
const lines = html.split('\n').map(l => l.replace(/\r$/, ''));
let sLine = -1, eLine = -1;
for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { sLine = i + 1; break; }
for (let i = sLine; i < lines.length; i++) if (lines[i].startsWith('</script>')) { eLine = i; break; }
const off = sLine;
const code = lines.slice(sLine, eLine).join('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });
let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const top = iife.get('body').get('body');
const H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off;
const fail = m => { throw new Error(m); };

// ── [B1 · docs/architecture/CELL-REGISTRY-DESIGN.md 5절] 배선 철거 모드(설정 "mode": "unwire") — 상민님 2026-10-10 「허용」(결심 ⑤), 범위는 그 문서 5절 그대로.
// 지우는 대상은 세 종류뿐이다:
//   ① 지정 키트(unwire.kitVar)의 가져오기 줄 `var X = _kit.X;`
//   ② OurgoalAppScope.expose('index.html', {…}) 객체의 X getter/setter 속성 줄(`get X(){ return X; }` · `, set X(v){ X = v; }`) — 객체가 비면 expose 문 전체
//   ③ X 의 window 대입 줄 `window.X = X;` · `if(typeof window !== 'undefined'){ window.X = X; }` · 여러 줄 if 블록 안의 그 줄 — 블록이 비면 if 문 전체
// unwire.names 에 없는 이름은 지우지 않는다. 함수 본문은 옮기거나 고치지 않는다. 그 밖의 글자는 바꾸지 않는다
// (지운 속성이 마지막이어서 새로 마지막이 된 속성 줄 끝의 쉼표를 떼는 것만 예외 — 문법 유지). 세포 파일은 쓰지 않는다(설정 cells 는 법정 재생성 대조의 파일 목록일 뿐).
// 안전 정지(fail): 지운 뒤에도 IIFE 안에 그 이름을 읽거나 쓰는 곳이 남으면(ReferenceError 가 될 자리) · 지울 문이 다른 글자와 한 줄을 나눠 쓰면 ·
//   window 대입의 오른쪽이 이름이 아니면(함수 정의문은 배선이 아니다) · names 의 이름 중 지울 줄이 하나도 없는 것이 있으면 멈춘다.
// 설정 예: { "task": "TASK-ES-6xx", "slot": "HO", "mode": "unwire", "cells": [{ "file": "js/core/cell-registry.js" }],
//           "unwire": { "kitVar": "_settingsKit", "imports": true, "exposeGetters": true, "windowAssign": true, "names": ["…"] } }
// ── [#TASK-ES-619 · 같은 문서 5절 닫힌 목록 X1·X2·X3 — 상민님 2026-10-11 「허용」, 효력 기록 지시함 DIR-004] unwire 확장. 아래는 전부 mode:"unwire" 경로 안에서만 돈다.
//   · 여러 실행: "unwire" 가 배열이면 실행을 차례로 적용한다(앞 실행이 지운 결과를 다시 파싱해 다음 실행이 돈다). 줄 종류는 그대로다 — 한 PR 에서 여러 키트·플래그를 돌릴 뿐이다.
//     하나라도 멈추면 index.html 을 쓰지 않는다. 단일 객체 꼴은 예전과 같은 글자를 낸다.
//   · X1 손잡이 이름꼴: kitVar 는 `_xxxKit` 꼴이 아니어도 된다(`_ui`·`_xp`). 대신 IIFE 최상위에서 `var <kitVar> = window.…;` 로 한 번 선언된 손잡이여야 한다(아니면 멈춘다).
//   · X3 "sharedLine": true — 다른 글자와 한 줄을 나눠 쓰는 window 대입(주석·다른 문과 같은 줄의 `window.X = X;`, 한 줄 if 블록 안 여러 대입 중 일부)을 그 줄 안에서 그 대입 글자만 지운다.
//     지운 대입 뒤의 빈칸을 함께 지우고, 줄 끝이었으면 앞 빈칸을 지운다. 줄이 비면 줄을 지운다. 쉼표 연쇄·여러 줄 if 블록 안의 나눠 쓴 줄·오른쪽이 이름이 아닌 대입은 여전히 멈춘다.
//   · X2 "dropKitVar": true — 그 실행의 삭제를 반영한 뒤 손잡이의 맨이름 참조가 0 이면 손잡이 줄 `var <kitVar> = window.…;` 을 지운다. 참조가 남으면 멈춘다. 이때만 names 가 비어도 된다.
//   · 사후 대조(모든 실행): 결과를 다시 파싱해 토큰열이 「이전 토큰열 − 지우기로 한 줄·글자의 토큰 − 뗀 쉼표」와 같고 남은 주석이 그대로인지 본다. 다르면 멈춘다(닫힌 목록 밖 글자 변화 0 의 기계 검사).
// 설정 예(여러 실행): "unwire": [ { "kitVar": "_uiKit", "names": ["…"] }, { "kitVar": "_uiKit", "imports": false, "sharedLine": true, "names": ["…"] }, { "kitVar": "_ui", "names": ["…"], "dropKitVar": true } ]
if (CFG.mode === 'unwire') { runUnwire(); return; }
function parseUnwireDoc(ls) {
  let s = -1, e = -1;
  for (let i = 0; i < ls.length; i++) if (ls[i].trim() === '<script>' && (ls[i + 1] || '').trim() === '(function(){' && (ls[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  if (s >= 0) for (let i = s; i < ls.length; i++) if (ls[i].startsWith('</script>')) { e = i; break; }
  if (s < 0 || e < 0) fail('인라인 IIFE 를 찾지 못했다');
  const c = ls.slice(s, e).join('\n');
  const a = parser.parse(c, { sourceType: 'script', ranges: true, tokens: true });
  let f = null;
  traverse(a, { FunctionExpression(p) { if (!f) f = p; } });
  return { lines: ls, code: c, ast: a, top: f.get('body').get('body'), iScope: f.scope, off: s };
}
function runUnwire() {
  const isList = Array.isArray(CFG.unwire);
  const specs = isList ? CFG.unwire : [CFG.unwire || {}];
  if (isList && !specs.length) fail('unwire 배열이 비었다');
  let doc = parseUnwireDoc(lines);
  const metas = [], logs = [];
  for (let i = 0; i < specs.length; i++) {
    let r;
    try { r = unwireOnce(specs[i], doc); }
    catch (err) { if (isList) err.message = '[unwire 실행 ' + (i + 1) + '/' + specs.length + '] ' + err.message; throw err; }
    metas.push(r.meta); logs.push(r.log);
    doc = r.next;
  }
  fs.writeFileSync(path.join(APP, 'index.html'), doc.lines.join(EOL), 'utf8');
  const meta = isList
    ? { task: TAG, mode: 'unwire', runs: metas, htmlLinesBefore: lines.length, htmlLinesAfter: doc.lines.length, files: {} }
    : Object.assign({ task: TAG, mode: 'unwire' }, metas[0], { files: {} });
  fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-inline-hard-meta.json'), JSON.stringify(meta, null, 1), 'utf8');
  logs.forEach((l, i) => console.log(...(isList ? ['unwire', '[' + (i + 1) + '/' + specs.length + ']'] : ['unwire']), ...l));
  console.log('index.html lines', lines.length, '->', doc.lines.length);
}
function unwireOnce(U, doc) {
  const { lines, code, top, iScope } = doc; // 이 실행이 보는 문서(앞 실행의 결과). 파일 머리의 같은 이름을 가린다.
  const H = n => n.loc.start.line + doc.off, HE = n => n.loc.end.line + doc.off;
  if (!U || typeof U !== 'object' || Array.isArray(U)) fail('unwire 실행 설정은 객체여야 한다');
  for (const k of Object.keys(U)) if (!['kitVar', 'names', 'imports', 'exposeGetters', 'windowAssign', 'sharedLine', 'dropKitVar', 'label'].includes(k)) fail('unwire 설정에 모르는 칸: ' + k);
  if (typeof U.kitVar !== 'string' || !/^[A-Za-z_$][\w$]*$/.test(U.kitVar)) fail('unwire.kitVar 가 이름이 아니다: ' + U.kitVar);
  // X1: kitVar 는 IIFE 최상위에서 `var <kitVar> = window.…;` 로 한 번 선언된 손잡이여야 한다(아무 식별자나 받지 않는다)
  const rootWin = n => { let x = n; while (x && x.type === 'MemberExpression' && !x.computed) x = x.object; return !!x && x.type === 'Identifier' && x.name === 'window'; };
  const handleSts = top.filter(st => st.isVariableDeclaration() && st.node.declarations.some(d => d.id.type === 'Identifier' && d.id.name === U.kitVar));
  if (handleSts.length !== 1 || handleSts[0].node.declarations.length !== 1 || !handleSts[0].node.declarations[0].init || handleSts[0].node.declarations[0].init.type !== 'MemberExpression' || !rootWin(handleSts[0].node.declarations[0].init))
    fail('unwire.kitVar 는 IIFE 최상위에서 `var ' + U.kitVar + ' = window.…;` 로 한 번 선언된 손잡이여야 한다: ' + U.kitVar);
  const names = new Set(Array.isArray(U.names) ? U.names : []);
  const shared = U.sharedLine === true, dropKit = U.dropKitVar === true;
  if (!names.size && !dropKit) fail('unwire.names 가 비었다');
  for (const n of names) if (!/^[A-Za-z_$][\w$]*$/.test(n)) fail('unwire.names 에 이름이 아닌 글자: ' + n);
  const doImports = U.imports !== false, doExpose = U.exposeGetters !== false, doWindow = U.windowAssign !== false;
  const del = new Set();        // 지울 줄(index.html 1-based)
  const commaFix = new Map();   // 줄 → 쉼표를 뗀 새 글자
  const cuts = new Map();       // X3: 줄 → [{ c0, c1, s, e }] 그 줄 안에서 지울 글자 구간(열, code 오프셋)
  const removed = { imports: [], exposeProps: [], exposeCalls: [], windowAssigns: [], windowBlocks: [] };
  const hit = {}; for (const n of names) hit[n] = 0;
  const src = n => code.slice(n.start, n.end);
  const ownLine = (st, what) => { // 문이 한 줄을 통째로 차지하는가(앞뒤에 다른 글자 0)
    if (H(st.node) !== HE(st.node)) fail(what + ' 이(가) 여러 줄에 걸쳐 있다: ' + H(st.node));
    if (lines[H(st.node) - 1].trim() !== src(st.node)) fail(what + ' 이(가) 다른 글자와 한 줄을 나눠 쓴다: ' + H(st.node));
  };
  const sharesLine = nd => H(nd) === HE(nd) && lines[H(nd) - 1].trim() !== src(nd);
  const cutInline = (nd, what) => { // X3: 한 줄 안의 그 문 글자만 지운다
    if (H(nd) !== HE(nd)) fail(what + ' 이(가) 여러 줄에 걸쳐 있다: ' + H(nd));
    const l = H(nd);
    if (lines[l - 1].slice(nd.loc.start.column, nd.loc.end.column) !== src(nd)) fail(what + ' 의 줄 안 자리를 찾지 못했다: ' + l);
    if (!cuts.has(l)) cuts.set(l, []);
    cuts.get(l).push({ c0: nd.loc.start.column, c1: nd.loc.end.column, s: nd.start, e: nd.end });
  };
  const isWA = x => x && x.type === 'AssignmentExpression' && x.operator === '=' && x.left.type === 'MemberExpression' && !x.left.computed && x.left.object.type === 'Identifier' && x.left.object.name === 'window' && x.left.property.type === 'Identifier';
  const isSeqWA = x => x && x.type === 'SequenceExpression' && x.expressions.every(isWA);
  const isExposureBlock = n => n.type === 'IfStatement' && !n.alternate && n.consequent.type === 'BlockStatement' && n.consequent.body.length > 0
    && n.consequent.body.every(b => b.type === 'ExpressionStatement' && (isWA(b.expression) || isSeqWA(b.expression)));
  const checkRhs = (x, where) => { if (x.right.type !== 'Identifier') fail('window.' + x.left.property.name + ' 대입의 오른쪽이 이름이 아니다(' + x.right.type + ') — 배선이 아니라 정의문이라 지우지 않는다: ' + where); };
  const headTailOnly = (st, what) => { // 여러 줄 문의 머리 줄·꼬리 줄에 그 문 말고 다른 글자가 없는가
    const a = H(st.node), b = HE(st.node);
    if (lines[a - 1].slice(0, st.node.loc.start.column).trim() !== '' || lines[b - 1].slice(st.node.loc.end.column).trim() !== '') fail(what + ' 의 머리·꼬리 줄에 다른 글자가 있다: ' + a + '~' + b);
  };
  for (const st of top) {
    const e = st.isExpressionStatement() ? st.node.expression : null;
    // ① 가져오기
    if (st.isVariableDeclaration()) {
      if (st.node.declarations.length !== 1) continue;
      const d = st.node.declarations[0];
      if (!d.init || d.id.type !== 'Identifier' || d.init.type !== 'MemberExpression' || d.init.computed || d.init.object.type !== 'Identifier' || d.init.object.name !== U.kitVar) continue;
      if (!names.has(d.id.name)) continue;
      if (d.init.property.type !== 'Identifier' || d.init.property.name !== d.id.name) fail('가져오기 이름과 키트 속성이 다르다: ' + src(st.node));
      if (!doImports) continue;
      ownLine(st, '가져오기 ' + d.id.name);
      del.add(H(st.node)); hit[d.id.name]++; removed.imports.push({ name: d.id.name, line: H(st.node) });
      continue;
    }
    // ② expose getter/setter
    if (e && e.type === 'CallExpression' && e.callee.type === 'MemberExpression' && !e.callee.computed && e.callee.property.name === 'expose'
      && ((e.callee.object.type === 'Identifier' && e.callee.object.name === 'OurgoalAppScope') || (e.callee.object.type === 'MemberExpression' && !e.callee.object.computed && e.callee.object.property.name === 'OurgoalAppScope'))
      && e.arguments.length === 2 && e.arguments[1].type === 'ObjectExpression') {
      if (!doExpose) continue;
      const byLine = new Map();
      for (const p of e.arguments[1].properties) { const l = p.loc.start.line + doc.off; if (!byLine.has(l)) byLine.set(l, []); byLine.get(l).push(p); }
      for (const [l, ps] of byLine) {
        const keys = [...new Set(ps.map(p => (p.type === 'ObjectMethod' && !p.computed && p.key.type === 'Identifier' && (p.kind === 'get' || p.kind === 'set')) ? p.key.name : null))];
        const mine = keys.filter(k => k !== null && names.has(k));
        if (!mine.length) continue;
        if (keys.length !== 1) fail('expose 속성 줄에 여러 이름이 섞여 있다(' + keys.join(',') + '): ' + l);
        if (ps.some(p => p.loc.end.line + doc.off !== l)) fail('expose 속성이 여러 줄에 걸쳐 있다: ' + l);
        if (l === H(st.node) || l === HE(st.node)) fail('expose 속성이 머리·꼬리 줄과 한 줄을 나눠 쓴다: ' + l);
        if (lines[l - 1].trim().replace(/,$/, '') !== code.slice(ps[0].start, ps[ps.length - 1].end)) fail('expose 속성 줄에 다른 글자가 있다: ' + l);
        del.add(l); hit[keys[0]]++; removed.exposeProps.push({ name: keys[0], line: l, kinds: ps.map(p => p.kind) });
      }
      const rest = [...byLine.keys()].filter(l => !del.has(l)).sort((a, b) => a - b);
      if (!rest.length) { headTailOnly(st, 'expose 문'); for (let l = H(st.node); l <= HE(st.node); l++) del.add(l); removed.exposeCalls.push({ line: H(st.node), endLine: HE(st.node) }); }
      else { const last = rest[rest.length - 1]; const t = lines[last - 1]; if (/,\s*$/.test(t)) commaFix.set(last, t.replace(/,\s*$/, '')); }
      continue;
    }
    // ③ window 대입
    if (e && (isWA(e) || isSeqWA(e))) {
      if (isSeqWA(e)) { if (e.expressions.some(x => names.has(x.left.property.name))) fail('한 줄에 여러 window 대입(쉼표 연쇄)이 있어 하나만 지울 수 없다: ' + H(st.node)); continue; }
      const n = e.left.property.name;
      if (!names.has(n) || !doWindow) continue;
      checkRhs(e, '줄 ' + H(st.node));
      if (shared && sharesLine(st.node)) { // X3: 주석·다른 문과 한 줄을 나눠 쓰는 대입
        cutInline(st.node, 'window 대입 ' + n);
        hit[n]++; removed.windowAssigns.push({ name: n, line: H(st.node), inline: true });
        continue;
      }
      ownLine(st, 'window 대입 ' + n);
      del.add(H(st.node)); hit[n]++; removed.windowAssigns.push({ name: n, line: H(st.node) });
      continue;
    }
    if (st.isIfStatement() && isExposureBlock(st.node)) {
      if (!doWindow) continue;
      const body = st.node.consequent.body;
      const a = H(st.node), b = HE(st.node);
      if (a === b) { // 한 줄 if 블록
        const x = body[0].expression;
        if (body.length !== 1 || !isWA(x)) {
          if (!body.some(s => (isWA(s.expression) ? [s.expression] : s.expression.expressions).some(y => names.has(y.left.property.name)))) continue;
          if (!shared) fail('한 줄 if 블록에 여러 window 대입이 있어 하나만 지울 수 없다: ' + a);
          // X3: 한 줄 if 블록 안 여러 대입 중 names 의 것만 지운다
          if (body.some(s => !isWA(s.expression))) fail('한 줄 if 블록에 쉼표 연쇄 window 대입이 있어 지울 수 없다: ' + a);
          const mine = body.filter(s => names.has(s.expression.left.property.name));
          for (const s of mine) checkRhs(s.expression, '줄 ' + a);
          const whole = mine.length === body.length, inl = !whole || sharesLine(st.node); // 블록의 대입이 모두 대상이면 블록째 지운다
          if (whole) { if (inl) cutInline(st.node, 'window 대입 블록'); else del.add(a); }
          for (const s of mine) {
            if (!whole) cutInline(s, 'window 대입 ' + s.expression.left.property.name);
            hit[s.expression.left.property.name]++; removed.windowAssigns.push(Object.assign({ name: s.expression.left.property.name, line: a, block: 'one-line' }, inl ? { inline: true } : {}));
          }
          continue;
        }
        if (!names.has(x.left.property.name)) continue;
        checkRhs(x, '줄 ' + a);
        if (shared && sharesLine(st.node)) { // X3: 주석·다른 문과 한 줄을 나눠 쓰는 한 줄 블록
          cutInline(st.node, 'window 대입 블록 ' + x.left.property.name);
          hit[x.left.property.name]++; removed.windowAssigns.push({ name: x.left.property.name, line: a, block: 'one-line', inline: true });
          continue;
        }
        ownLine(st, 'window 대입 블록 ' + x.left.property.name);
        del.add(a); hit[x.left.property.name]++; removed.windowAssigns.push({ name: x.left.property.name, line: a, block: 'one-line' });
        continue;
      }
      const bodyLines = [];
      for (const s of body) {
        const x = s.expression, l = s.loc.start.line + doc.off;
        bodyLines.push(l);
        if (isSeqWA(x)) { if (x.expressions.some(y => names.has(y.left.property.name))) fail('if 블록 안 한 줄에 여러 window 대입이 있어 하나만 지울 수 없다: ' + l); continue; }
        const n = x.left.property.name;
        if (!names.has(n)) continue;
        checkRhs(x, '줄 ' + l);
        if (s.loc.end.line + doc.off !== l || l === a || l === b) fail('window 대입이 여러 줄이거나 if 머리·꼬리와 한 줄을 나눠 쓴다: ' + l);
        if (lines[l - 1].trim() !== src(s)) fail('window 대입 줄에 다른 글자가 있다: ' + l);
        del.add(l); hit[n]++; removed.windowAssigns.push({ name: n, line: l, block: a + '~' + b });
      }
      if (bodyLines.every(l => del.has(l))) { headTailOnly(st, 'window 대입 if 블록'); for (let l = a; l <= b; l++) del.add(l); removed.windowBlocks.push({ line: a, endLine: b }); }
    }
  }
  for (const n of names) if (!hit[n]) fail('unwire.names 의 이름인데 지울 줄이 하나도 없다: ' + n);
  // X3: 줄 안 삭제를 줄 글자로 바꾼다(오른쪽부터). 지운 문 뒤의 빈칸을 함께 지우고, 줄 끝이었으면 앞 빈칸을 지운다. 줄이 비면 줄을 지운다.
  const edits = new Map(), cutRanges = [], inlineEdits = [];
  for (const [l, cs] of cuts) {
    if (del.has(l)) fail('줄 안 삭제와 줄 삭제가 같은 줄에 겹친다: ' + l);
    if (commaFix.has(l)) fail('줄 안 삭제와 쉼표 떼기가 같은 줄에 겹친다: ' + l);
    const sorted = cs.slice().sort((p, q) => q.c0 - p.c0);
    for (let i = 1; i < sorted.length; i++) if (sorted[i].c1 > sorted[i - 1].c0) fail('줄 안 삭제 구간이 서로 겹친다: ' + l);
    let t = lines[l - 1];
    for (const c of sorted) { const left = t.slice(0, c.c0), right = t.slice(c.c1).replace(/^[ \t]+/, ''); t = right === '' ? left.replace(/[ \t]+$/, '') : left + right; cutRanges.push({ s: c.s, e: c.e }); }
    if (t.trim() === '') del.add(l); else edits.set(l, t);
    inlineEdits.push({ line: l, before: lines[l - 1], after: t.trim() === '' ? null : t });
  }
  const gone = nd => del.has(H(nd)) || cutRanges.some(r => nd.start >= r.s && nd.end <= r.e); // 이 실행이 지우는 글자 안에 있는가
  const leftOf = bd => [...new Set(bd.referencePaths.map(r => r.node).concat(bd.constantViolations.map(r => r.node)).filter(nd => !gone(nd)).map(H))].sort((x, y) => x - y);
  // 안전: 가져오기를 지운 이름이 IIFE 안에 아직 읽히거나 대입되면 멈춘다(지운 글자 밖의 참조만 센다)
  const remaining = [];
  for (const n of names) {
    const b = iScope.getBinding(n);
    if (!b || !del.has(H(b.path.node))) continue;
    const left = leftOf(b);
    if (left.length) remaining.push(n + '(줄 ' + left.join(',') + ')');
  }
  if (remaining.length) fail('철거한 이름을 IIFE 안에서 아직 쓰는 곳이 남는다 — 지우지 않는다: ' + remaining.join(' · '));
  // X2: 손잡이 줄 — 이 실행의 삭제를 반영한 뒤 맨이름 참조가 0 일 때만 지운다
  if (dropKit) {
    const hs = handleSts[0];
    ownLine(hs, '손잡이 ' + U.kitVar);
    const hb = iScope.getBinding(U.kitVar);
    if (!hb || hb.path.node !== hs.node.declarations[0]) fail('손잡이 ' + U.kitVar + ' 의 선언을 찾지 못했다');
    const left = leftOf(hb);
    if (left.length) fail('손잡이 ' + U.kitVar + ' 을(를) IIFE 안에서 아직 쓰는 곳이 남는다 — 지우지 않는다: 줄 ' + left.join(','));
    del.add(H(hs.node)); removed.kitVarLine = { name: U.kitVar, line: H(hs.node) };
  }
  const nh = [];
  for (let i = 0; i < lines.length; i++) { const l = i + 1; if (del.has(l)) continue; nh.push(edits.has(l) ? edits.get(l) : commaFix.has(l) ? commaFix.get(l) : lines[i]); }
  // 사후 대조: 다시 파싱한 토큰열 = 이전 토큰열 − (지운 줄의 토큰 · 줄 안에서 지운 글자의 토큰 · 뗀 쉼표). 주석도 지운 줄의 것만 빠진다.
  const next = parseUnwireDoc(nh);
  const isComment = t => typeof t.type === 'string';
  const sig = t => (t.type.label || '') + '\u0000' + (t.value === undefined ? '' : String(t.value));
  const tokLine = t => t.loc.start.line + doc.off;
  const oldToks = doc.ast.tokens.filter(t => !isComment(t)), commaTok = new Set();
  for (const l of commaFix.keys()) {
    const onLine = oldToks.filter(t => tokLine(t) === l), last = onLine[onLine.length - 1];
    if (!last || last.type.label !== ',') fail('쉼표를 뗀 줄의 마지막 토큰이 쉼표가 아니다: ' + l);
    commaTok.add(last);
  }
  const want = oldToks.filter(t => !del.has(tokLine(t)) && !commaTok.has(t) && !cutRanges.some(r => t.start >= r.s && t.end <= r.e)).map(sig);
  const got = next.ast.tokens.filter(t => !isComment(t)).map(sig);
  let diffAt = want.length === got.length ? -1 : Math.min(want.length, got.length);
  for (let i = 0; i < Math.min(want.length, got.length); i++) if (want[i] !== got[i]) { diffAt = i; break; }
  if (diffAt >= 0) fail('지운 뒤 다시 파싱한 토큰열이 예상과 다르다(닫힌 목록 밖 글자 변화) — 쓰지 않는다: 토큰 ' + diffAt + ' 기대 ' + JSON.stringify(want[diffAt]) + ' 실제 ' + JSON.stringify(got[diffAt]));
  const wantCom = doc.ast.tokens.filter(t => isComment(t) && !del.has(tokLine(t))).map(t => t.value), gotCom = next.ast.tokens.filter(isComment).map(t => t.value);
  if (wantCom.length !== gotCom.length || wantCom.some((v, i) => v !== gotCom[i])) fail('지운 뒤 남은 주석이 예상과 다르다 — 쓰지 않는다');
  const flags = { imports: doImports, exposeGetters: doExpose, windowAssign: doWindow };
  if (shared) flags.sharedLine = true;
  if (dropKit) flags.dropKitVar = true;
  const meta = { kitVar: U.kitVar, names: [...names], flags, removed, commaFixedLines: [...commaFix.keys()], deletedLines: [...del].sort((a, b) => a - b), htmlLinesBefore: lines.length, htmlLinesAfter: nh.length };
  if (inlineEdits.length) meta.inlineEdits = inlineEdits;
  const log = [U.kitVar, '· names', names.size, '· imports', removed.imports.length, '· expose props', removed.exposeProps.length, '(calls', removed.exposeCalls.length + ')', '· window', removed.windowAssigns.length, '(blocks', removed.windowBlocks.length + ')', '· comma', commaFix.size];
  if (inlineEdits.length) log.push('· inline', inlineEdits.length);
  if (removed.kitVarLine) log.push('· kitVar line', removed.kitVarLine.line);
  return { next, meta, log };
}

// ── [#TASK-ES-634 · docs/architecture/CELL-REGISTRY-DESIGN.md 3.3절 · 5절 닫힌 목록 X4·X5·X6 — 상민님 2026-10-11 「허용」, 효력 기록 지시함 DIR-004] 상태 이전 모드(설정 "mode": "unstate").
// 통로에 노출된 IIFE 상태 변수의 소유를 상태 기관(window.OurgoalAppState — js/core/app-state.js, 이 생성기는 만들지 않는다)으로 옮긴다. 다루는 줄은 세 종류뿐이다:
//   S1(X4) 그 이름의 OurgoalAppScope.expose getter/setter 속성 줄 — 삭제(객체가 비면 expose 문 전체, 새로 마지막이 된 속성의 쉼표 한 글자). 본문이 `return X;`·`X = v;` 꼴이 아니면 멈춘다.
//   R1(X5) 선언문 `var X = <초기값>;` — `var X =` 를 `window.OurgoalAppState.define('X',` 로, 끝의 `;` 를 `);` 로 바꿔 쓴다. 초기값 글자와 자리는 그대로다.
//          그 이름의 마지막 노출 문(지우기 직전)에 `set X` 가 있었으면 define 대신 defineVar 를 쓴다 — 사람이 아니라 생성기가 정한다(L047).
//   R2(X6) 자기 일회 window 복사 줄 `window.X = X;` — 오른쪽 이름만 `window.OurgoalAppScope.scope.X` 로 바꿔 쓴다(자리·시점 유지).
// 안전 정지(fail): 그 이름의 맨이름 참조(읽기·대입)가 지운 줄·바꿔 쓴 글자 밖에 하나라도 남으면 · 초기값에 자기 이름이 나오면 · 선언이 없거나 여럿이면 · 선언자가 여럿이면 ·
//   초기값이 없으면 · 선언문이 다른 글자와 한 줄을 나눠 쓰면 · 통로에 노출되지 않은 이름이면 · window 복사 줄이 다른 글자와 한 줄을 나눠 쓰거나 쉼표 연쇄면 ·
//   선언이 첫 노출 문보다 앞이고 그 사이에 실행되는 문이 있으면(노출 시점이 달라진다) 멈춘다. 함수 본문은 옮기거나 고치지 않는다. 세포 파일은 쓰지 않는다.
// 여러 실행: "unstate" 가 배열이면 차례로 적용한다(앞 실행 결과를 다시 파싱). 배열의 단계가 { "unwire": { … } } 이면 그 단계는 위 unwire 실행 하나로 돈다(unwireOnce 를 그대로 부른다 — 법정은 PR 하나에 생성기를 한 번만 돌린다).
// 사후 대조(모든 실행): 다시 파싱한 토큰열 = 이전 토큰열 − 지운 줄의 토큰 − 뗀 쉼표, 그리고 바꿔 쓴 자리는 정해진 토큰열로 바뀜. 남은 주석은 그대로. 다르면 쓰지 않고 멈춘다.
// 설정 예: { "task": "TASK-ES-6xx", "slot": "HO", "mode": "unstate", "cells": [{ "file": "js/core/app-state.js" }], "unstate": { "names": ["toastTimer", "…"] } }
//   여러 단계: "unstate": [ { "names": ["…"] }, { "unwire": { "kitVar": "_uiKit", "names": ["…"] } }, { "names": ["…"] } ]
if (CFG.mode === 'unstate') { runUnstate(); return; }
function runUnstate() {
  const isList = Array.isArray(CFG.unstate);
  const specs = isList ? CFG.unstate : [CFG.unstate || {}];
  if (isList && !specs.length) fail('unstate 배열이 비었다');
  let doc = parseUnwireDoc(lines);
  const metas = [], logs = [];
  for (let i = 0; i < specs.length; i++) {
    const sp = specs[i];
    let r;
    try {
      if (isList && sp && typeof sp === 'object' && !Array.isArray(sp) && Object.prototype.hasOwnProperty.call(sp, 'unwire')) { // unwire 단계 — 위 unwireOnce 를 그대로 부른다
        if (Object.keys(sp).length !== 1) fail('unwire 단계에는 unwire 칸 하나만 둔다');
        r = unwireOnce(sp.unwire, doc);
        r = { next: r.next, meta: Object.assign({ step: 'unwire' }, r.meta), log: ['unwire'].concat(r.log) };
      } else {
        r = unstateOnce(sp, doc);
        if (isList) r = { next: r.next, meta: Object.assign({ step: 'unstate' }, r.meta), log: r.log };
      }
    } catch (err) { if (isList) err.message = '[unstate 실행 ' + (i + 1) + '/' + specs.length + '] ' + err.message; throw err; }
    metas.push(r.meta); logs.push(r.log);
    doc = r.next;
  }
  fs.writeFileSync(path.join(APP, 'index.html'), doc.lines.join(EOL), 'utf8');
  const meta = isList
    ? { task: TAG, mode: 'unstate', runs: metas, htmlLinesBefore: lines.length, htmlLinesAfter: doc.lines.length, files: {} }
    : Object.assign({ task: TAG, mode: 'unstate' }, metas[0], { files: {} });
  fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-inline-hard-meta.json'), JSON.stringify(meta, null, 1), 'utf8');
  logs.forEach((l, i) => console.log(...(isList ? ['[' + (i + 1) + '/' + specs.length + ']'] : []), ...l));
  console.log('index.html lines', lines.length, '->', doc.lines.length);
}
function unstateOnce(U, doc) {
  const { lines, code, top, iScope } = doc; // 이 실행이 보는 문서(앞 실행의 결과). 파일 머리의 같은 이름을 가린다.
  const H = n => n.loc.start.line + doc.off, HE = n => n.loc.end.line + doc.off;
  if (!U || typeof U !== 'object' || Array.isArray(U)) fail('unstate 실행 설정은 객체여야 한다');
  for (const k of Object.keys(U)) if (!['names', 'label'].includes(k)) fail('unstate 설정에 모르는 칸: ' + k);
  const names = new Set(Array.isArray(U.names) ? U.names : []);
  if (!names.size) fail('unstate.names 가 비었다');
  for (const n of names) if (typeof n !== 'string' || !/^[A-Za-z_$][\w$]*$/.test(n)) fail('unstate.names 에 이름이 아닌 글자: ' + n);
  const ORGAN = 'window.OurgoalAppState', SCOPE = 'window.OurgoalAppScope.scope';
  const del = new Set();        // 지울 줄(index.html 1-based)
  const commaFix = new Map();   // 줄 → 쉼표를 뗀 새 글자
  const subs = [];              // 바꿔 쓸 글자 구간 { line, c0, c1, s, e, text, sigs }
  const removed = { exposeProps: [], exposeCalls: [] }, rewritten = { declarations: [], windowCopies: [] }, api = Object.create(null);
  const st8 = Object.create(null); for (const n of names) st8[n] = { decls: [], expose: [], copies: [] };
  const src = n => code.slice(n.start, n.end);
  const isWA = x => x && x.type === 'AssignmentExpression' && x.operator === '=' && x.left.type === 'MemberExpression' && !x.left.computed && x.left.object.type === 'Identifier' && x.left.object.name === 'window' && x.left.property.type === 'Identifier';
  const isSeqWA = x => x && x.type === 'SequenceExpression' && x.expressions.every(isWA);
  const isExposureBlock = n => n.type === 'IfStatement' && !n.alternate && n.consequent.type === 'BlockStatement' && n.consequent.body.length > 0
    && n.consequent.body.every(b => b.type === 'ExpressionStatement' && (isWA(b.expression) || isSeqWA(b.expression)));
  const isExposeCall = e => !!e && e.type === 'CallExpression' && e.callee.type === 'MemberExpression' && !e.callee.computed && e.callee.property.name === 'expose'
    && ((e.callee.object.type === 'Identifier' && e.callee.object.name === 'OurgoalAppScope') || (e.callee.object.type === 'MemberExpression' && !e.callee.object.computed && e.callee.object.property.name === 'OurgoalAppScope'))
    && e.arguments.length === 2 && e.arguments[1].type === 'ObjectExpression';
  const isCopy = x => isWA(x) && names.has(x.left.property.name) && x.right.type === 'Identifier' && x.right.name === x.left.property.name; // 자기 일회 window 복사 `window.X = X`
  const trivialAccessor = p => { // getter 는 `return X;`, setter 는 `X = v;` 하나뿐인가
    const b = p.body.body, k = p.key.name;
    if (p.kind === 'get') return p.params.length === 0 && b.length === 1 && b[0].type === 'ReturnStatement' && !!b[0].argument && b[0].argument.type === 'Identifier' && b[0].argument.name === k;
    return p.params.length === 1 && p.params[0].type === 'Identifier' && b.length === 1 && b[0].type === 'ExpressionStatement' && b[0].expression.type === 'AssignmentExpression' && b[0].expression.operator === '='
      && b[0].expression.left.type === 'Identifier' && b[0].expression.left.name === k && b[0].expression.right.type === 'Identifier' && b[0].expression.right.name === p.params[0].name;
  };
  const headTailOnly = (st, what) => { // 문의 머리 줄·꼬리 줄에 그 문 말고 다른 글자가 없는가
    const a = H(st.node), b = HE(st.node);
    if (lines[a - 1].slice(0, st.node.loc.start.column).trim() !== '' || lines[b - 1].slice(st.node.loc.end.column).trim() !== '') fail(what + ' 이(가) 다른 글자와 한 줄을 나눠 쓴다: ' + a + (a === b ? '' : '~' + b));
  };
  top.forEach((st, idx) => {
    const e = st.isExpressionStatement() ? st.node.expression : null;
    if (st.isVariableDeclaration()) { for (const d of st.node.declarations) if (d.id.type === 'Identifier' && names.has(d.id.name)) st8[d.id.name].decls.push({ st, d, idx }); return; }
    // S1(X4): expose getter/setter
    if (isExposeCall(e)) {
      const byLine = new Map();
      for (const p of e.arguments[1].properties) { const l = p.loc.start.line + doc.off; if (!byLine.has(l)) byLine.set(l, []); byLine.get(l).push(p); }
      for (const [l, ps] of byLine) {
        const keys = [...new Set(ps.map(p => (p.type === 'ObjectMethod' && !p.computed && p.key.type === 'Identifier' && (p.kind === 'get' || p.kind === 'set')) ? p.key.name : null))];
        const mine = keys.filter(k => k !== null && names.has(k));
        if (!mine.length) continue;
        if (keys.length !== 1) fail('expose 속성 줄에 여러 이름이 섞여 있다(' + keys.join(',') + '): ' + l);
        if (ps.some(p => p.loc.end.line + doc.off !== l)) fail('expose 속성이 여러 줄에 걸쳐 있다: ' + l);
        if (l === H(st.node) || l === HE(st.node)) fail('expose 속성이 머리·꼬리 줄과 한 줄을 나눠 쓴다: ' + l);
        if (lines[l - 1].trim().replace(/,$/, '') !== code.slice(ps[0].start, ps[ps.length - 1].end)) fail('expose 속성 줄에 다른 글자가 있다: ' + l);
        if (!ps.every(trivialAccessor)) fail('expose 속성의 본문이 `return X;`·`X = v;` 꼴이 아니다 — 지우지 않는다: ' + l);
        del.add(l); st8[keys[0]].expose.push({ line: l, idx, kinds: ps.map(p => p.kind) }); removed.exposeProps.push({ name: keys[0], line: l, kinds: ps.map(p => p.kind) });
      }
      const rest = [...byLine.keys()].filter(l => !del.has(l)).sort((a, b) => a - b);
      if (![...byLine.keys()].some(l => del.has(l))) return;
      if (!rest.length) { headTailOnly(st, 'expose 문'); for (let l = H(st.node); l <= HE(st.node); l++) del.add(l); removed.exposeCalls.push({ line: H(st.node), endLine: HE(st.node) }); }
      else { const last = rest[rest.length - 1]; const t = lines[last - 1]; if (/,\s*$/.test(t)) commaFix.set(last, t.replace(/,\s*$/, '')); }
      return;
    }
    // R2(X6): 자기 일회 window 복사 줄 — 받는 꼴은 unwire 의 window 대입 줄과 같다(줄을 통째로 차지하는 문 · 그런 줄만 담은 if 블록)
    if (e && (isWA(e) || isSeqWA(e))) {
      if (isSeqWA(e)) { if (e.expressions.some(isCopy)) fail('window 복사가 쉼표 연쇄 안에 있어 바꿔 쓰지 않는다: ' + H(st.node)); return; }
      if (!isCopy(e)) return;
      if (H(st.node) !== HE(st.node) || lines[H(st.node) - 1].trim() !== src(st.node)) fail('window 복사 줄이 다른 글자와 한 줄을 나눠 쓴다: ' + H(st.node));
      st8[e.left.property.name].copies.push({ rhs: e.right, line: H(st.node) });
      return;
    }
    if (st.isIfStatement() && isExposureBlock(st.node)) {
      const body = st.node.consequent.body, a = H(st.node), b = HE(st.node);
      for (const s of body) {
        const x = s.expression, l = s.loc.start.line + doc.off;
        if (isSeqWA(x)) { if (x.expressions.some(isCopy)) fail('window 복사가 쉼표 연쇄 안에 있어 바꿔 쓰지 않는다: ' + l); continue; }
        if (!isCopy(x)) continue;
        if (a === b) { if (body.length !== 1 || lines[a - 1].trim() !== src(st.node)) fail('한 줄 if 블록의 window 복사가 다른 글자와 한 줄을 나눠 쓴다: ' + a); }
        else if (s.loc.end.line + doc.off !== l || l === a || l === b || lines[l - 1].trim() !== src(s)) fail('window 복사 줄에 다른 글자가 있다: ' + l);
        st8[x.left.property.name].copies.push({ rhs: x.right, line: l });
      }
    }
  });
  // 바꿔 쓴 자리에 들어갈 토큰열(사후 대조용) — 온전한 견본 문을 토큰으로 갈라 얻는다
  const isComment = t => typeof t.type === 'string';
  const sig = t => (t.type.label || '') + '\u0000' + (t.value === undefined ? '' : String(t.value));
  const sample = text => parser.parse(text, { sourceType: 'script', tokens: true }).tokens.filter(t => !isComment(t) && t.type.label !== 'eof').map(sig);
  const toks = doc.ast.tokens.filter(t => !isComment(t)), comments = doc.ast.tokens.filter(isComment);
  const quietBetween = (stmts, from, to) => { // 두 최상위 문 사이에 「실행되는」 문이 없는가(선언·함수 선언·노출·window 복사만 있으면 조용하다)
    for (let i = from + 1; i < to; i++) {
      const t = stmts[i].node, x = t.type === 'ExpressionStatement' ? t.expression : null;
      if (t.type === 'FunctionDeclaration' || isExposeCall(x) || isExposureBlock(t)) continue;
      if (x && (isSeqWA(x) || isWA(x)) && (isSeqWA(x) ? x.expressions : [x]).every(y => /^(Identifier|NullLiteral|BooleanLiteral|NumericLiteral|StringLiteral)$/.test(y.right.type))) continue;
      if (t.type === 'VariableDeclaration' && t.declarations.every(d => !d.init || /^(Identifier|NullLiteral|BooleanLiteral|NumericLiteral|StringLiteral)$/.test(d.init.type) || (d.init.type === 'MemberExpression' && !d.init.computed && d.init.object.type === 'Identifier'))) continue;
      return H(t);
    }
    return 0;
  };
  for (const n of names) {
    const info = st8[n];
    if (!info.decls.length) fail('unstate.names 의 이름인데 IIFE 최상위 선언이 없다: ' + n);
    if (info.decls.length !== 1) fail('같은 이름의 선언이 여럿이다 — 옮기지 않는다: ' + n + '(줄 ' + info.decls.map(x => H(x.st.node)).join(',') + ')');
    const { st, d, idx } = info.decls[0];
    if (st.node.kind !== 'var') fail('var 선언이 아니다 — 옮기지 않는다: ' + n + ' 줄 ' + H(st.node));
    if (st.node.declarations.length !== 1) fail('선언자가 여럿인 선언문이다 — 옮기지 않는다: ' + n + ' 줄 ' + H(st.node));
    const bd = iScope.getBinding(n);
    if (!bd || bd.path.node !== d) fail('선언을 IIFE 바인딩에서 찾지 못했다: ' + n);
    if (!d.init) fail('초기값이 없는 선언이다 — 옮기지 않는다: ' + n + ' 줄 ' + H(st.node));
    headTailOnly(st, '선언문 ' + n);
    if (!info.expose.length) fail('통로에 노출되지 않은 이름이다(상태 기관 대상이 아니다): ' + n);
    const ts = toks.filter(t => t.start >= st.node.start && t.end <= st.node.end), semi = ts[ts.length - 1];
    if (ts.length < 5 || ts[0].type.label !== 'var' || ts[1].type.label !== 'name' || ts[1].value !== n || ts[2].type.label !== '=' || semi.type.label !== ';' || semi.end !== st.node.end) fail('선언문이 `var X = 초기값;` 꼴이 아니다 — 옮기지 않는다: ' + n + ' 줄 ' + H(st.node));
    if (ts[0].loc.start.line !== ts[2].loc.end.line) fail('선언문의 `var X =` 가 여러 줄에 걸쳐 있다: ' + n + ' 줄 ' + H(st.node));
    if (comments.some(c => c.start >= ts[0].start && c.end <= ts[2].end)) fail('선언문의 `var X =` 사이에 주석이 있다: ' + n + ' 줄 ' + H(st.node));
    const lastIdx = Math.max(...info.expose.map(x => x.idx)), firstIdx = Math.min(...info.expose.map(x => x.idx));
    const lastKinds = new Set(); for (const x of info.expose) if (x.idx === lastIdx) for (const k of x.kinds) lastKinds.add(k);
    if (!lastKinds.has('get')) fail('마지막 노출 문에 getter 가 없다 — 옮기지 않는다: ' + n);
    api[n] = lastKinds.has('set') ? 'defineVar' : 'define'; // 마지막 노출 문(지우기 직전)에 set 이 있었는가로 정한다
    if (idx < firstIdx) { const q = quietBetween(top, idx, firstIdx); if (q) fail('선언이 첫 노출보다 앞이고 그 사이에 실행되는 문이 있다(노출 시점이 달라진다) — 옮기지 않는다: ' + n + ' 줄 ' + H(st.node) + ' · 사이의 문 ' + q); }
    const head = ORGAN + '.' + api[n] + "('" + n + "',", s8 = sample(ORGAN + '.' + api[n] + "('" + n + "', 0);");
    subs.push({ line: ts[0].loc.start.line + doc.off, c0: ts[0].loc.start.column, c1: ts[2].loc.end.column, s: ts[0].start, e: ts[2].end, text: head, sigs: s8.slice(0, s8.length - 3) });
    subs.push({ line: semi.loc.start.line + doc.off, c0: semi.loc.start.column, c1: semi.loc.end.column, s: semi.start, e: semi.end, text: ');', sigs: s8.slice(s8.length - 2) });
    rewritten.declarations.push({ name: n, line: H(st.node), endLine: HE(st.node), api: api[n] });
    for (const c of info.copies) {
      const s9 = sample(SCOPE + '.' + n + ';');
      subs.push({ line: c.rhs.loc.start.line + doc.off, c0: c.rhs.loc.start.column, c1: c.rhs.loc.end.column, s: c.rhs.start, e: c.rhs.end, text: SCOPE + '.' + n, sigs: s9.slice(0, s9.length - 1) });
      rewritten.windowCopies.push({ name: n, line: c.line });
    }
  }
  // 안전: 옮길 이름의 맨이름 참조가 지운 줄·바꿔 쓴 글자 밖에 하나라도 남으면 멈춘다
  const inSub = nd => subs.some(r => nd.start >= r.s && nd.end <= r.e);
  const remaining = [];
  for (const n of names) {
    const bd = iScope.getBinding(n), d = st8[n].decls[0].d;
    const left = bd.referencePaths.map(r => r.node).concat(bd.constantViolations.map(r => r.node)).filter(nd => !del.has(H(nd)) && !inSub(nd));
    const self = left.filter(nd => nd.start >= d.init.start && nd.end <= d.init.end);
    if (self.length) fail('초기값에 자기 이름이 나온다 — 옮기지 않는다: ' + n + ' 줄 ' + H(self[0]));
    if (left.length) remaining.push(n + '(줄 ' + [...new Set(left.map(H))].sort((x, y) => x - y).join(',') + ')');
  }
  if (remaining.length) fail('옮길 이름을 IIFE 안에서 아직 맨이름으로 쓰는 곳이 남는다 — 옮기지 않는다: ' + remaining.join(' · '));
  // 줄 글자 바꿔 쓰기(오른쪽부터)
  const edits = new Map(), byLine = new Map();
  for (const r of subs) {
    if (del.has(r.line)) fail('바꿔 쓸 줄과 지울 줄이 겹친다: ' + r.line);
    if (commaFix.has(r.line)) fail('바꿔 쓸 줄과 쉼표 떼기가 겹친다: ' + r.line);
    if (lines[r.line - 1].slice(r.c0, r.c1) !== code.slice(r.s, r.e)) fail('바꿔 쓸 글자의 줄 안 자리를 찾지 못했다: ' + r.line);
    if (!byLine.has(r.line)) byLine.set(r.line, []);
    byLine.get(r.line).push(r);
  }
  for (const [l, rs] of byLine) {
    const sorted = rs.slice().sort((p, q) => q.c0 - p.c0);
    for (let i = 1; i < sorted.length; i++) if (sorted[i].c1 > sorted[i - 1].c0) fail('바꿔 쓸 구간이 서로 겹친다: ' + l);
    let t = lines[l - 1];
    for (const r of sorted) t = t.slice(0, r.c0) + r.text + t.slice(r.c1);
    edits.set(l, t);
  }
  const nh = [];
  for (let i = 0; i < lines.length; i++) { const l = i + 1; if (del.has(l)) continue; nh.push(edits.has(l) ? edits.get(l) : commaFix.has(l) ? commaFix.get(l) : lines[i]); }
  // 사후 대조: 다시 파싱한 토큰열 = 이전 토큰열에서 지운 줄의 토큰·뗀 쉼표를 빼고, 바꿔 쓴 구간을 정해진 토큰열로 바꾼 것. 주석은 지운 줄의 것만 빠진다.
  const next = parseUnwireDoc(nh);
  const tokLine = t => t.loc.start.line + doc.off, commaTok = new Set();
  for (const l of commaFix.keys()) {
    const onLine = toks.filter(t => tokLine(t) === l), last = onLine[onLine.length - 1];
    if (!last || last.type.label !== ',') fail('쉼표를 뗀 줄의 마지막 토큰이 쉼표가 아니다: ' + l);
    commaTok.add(last);
  }
  const want = [], emitted = new Set();
  for (const t of toks) {
    if (del.has(tokLine(t)) || commaTok.has(t)) continue;
    const r = subs.find(x => t.start >= x.s && t.end <= x.e);
    if (!r) { want.push(sig(t)); continue; }
    if (!emitted.has(r)) { emitted.add(r); for (const g of r.sigs) want.push(g); }
  }
  if (emitted.size !== subs.length) fail('바꿔 쓸 구간 가운데 토큰을 찾지 못한 것이 있다 — 쓰지 않는다');
  const got = next.ast.tokens.filter(t => !isComment(t)).map(sig);
  let diffAt = want.length === got.length ? -1 : Math.min(want.length, got.length);
  for (let i = 0; i < Math.min(want.length, got.length); i++) if (want[i] !== got[i]) { diffAt = i; break; }
  if (diffAt >= 0) fail('바꿔 쓴 뒤 다시 파싱한 토큰열이 예상과 다르다(닫힌 목록 밖 글자 변화) — 쓰지 않는다: 토큰 ' + diffAt + ' 기대 ' + JSON.stringify(want[diffAt]) + ' 실제 ' + JSON.stringify(got[diffAt]));
  const wantCom = comments.filter(t => !del.has(tokLine(t))).map(t => t.value), gotCom = next.ast.tokens.filter(isComment).map(t => t.value);
  if (wantCom.length !== gotCom.length || wantCom.some((v, i) => v !== gotCom[i])) fail('바꿔 쓴 뒤 남은 주석이 예상과 다르다 — 쓰지 않는다');
  const meta = { names: [...names], api, removed, rewritten, commaFixedLines: [...commaFix.keys()], deletedLines: [...del].sort((a, b) => a - b), editedLines: [...edits.keys()].sort((a, b) => a - b), htmlLinesBefore: lines.length, htmlLinesAfter: nh.length };
  const nVar = Object.values(api).filter(v => v === 'defineVar').length;
  const log = ['unstate', '· names', names.size, '· define', names.size - nVar, '· defineVar', nVar, '· expose props', removed.exposeProps.length, '(calls', removed.exposeCalls.length + ')', '· window copies', rewritten.windowCopies.length, '· comma', commaFix.size];
  return { next, meta, log };
}

// smoke-test FN_NAMES(시험지가 인라인에서 함수를 잘라 실행) — 옮기지 않는다(MODULE-SPLIT-PROTOCOL 1절 (라), 유형 F2)
const smokeFn = (() => { const s = fs.readFileSync(path.join(APP, 'scripts', 'smoke-test.js'), 'utf8'); const m = s.match(/const FN_NAMES = \[([\s\S]*?)\];/); if (!m) fail('smoke-test FN_NAMES 못 읽음'); return new Set((m[1].match(/'([^']+)'/g) || []).map(x => x.slice(1, -1))); })();

// #TASK-ES-465: smoke-test 가 함수를 잘라 오는 원본에 인라인 합본(tests/helpers/inline-bundle.js — js/tabs/** app-scope 세포 + js/core/*.js 중 생성기 표지를 담은 파일)을 붙이면
// FN_NAMES 함수도 그 자리 세포로 옮길 수 있다(시험지가 같은 함수를 세포 글자에서 찾는다). 그 밖의 경로는 여전히 멈춘다.
const smokeUsesBundle = /inline-bundle/.test(fs.readFileSync(path.join(APP, 'scripts', 'smoke-test.js'), 'utf8'));
const bundleCoversCore = (() => { try { return /coreMovedCellFiles/.test(fs.readFileSync(path.join(APP, 'tests', 'helpers', 'inline-bundle.js'), 'utf8')); } catch (e) { return false; } })();
const smokeReadsCell = file => smokeUsesBundle && (file.startsWith('js/tabs/') || (bundleCoversCore && /^js\/core\/[^/]+\.js$/.test(file)));

// ── 묶음 경계(지도와 같은 규칙: 구획 주석 `/* ===` 에서 다음 구획 주석 앞까지)
const isHeader = c => c.type === 'CommentBlock' && /^\s*=+/.test(c.value);
const headers = [];
for (const st of top) for (const c of (st.node.leadingComments || [])) if (isHeader(c)) headers.push({ line: c.loc.start.line + off, endLine: c.loc.end.line + off, text: c.value, stmt: st });
const groupRange = (title, pick) => {
  let hs = headers.filter(h => h.text.includes(title));
  // [#TASK-ES-483] 설정 take.headerPick: 'nonEmpty' — 같은 글자의 구획 주석이 여럿이면(예: 「참고자료」 구획 주석이 두 줄 연달아) 최상위 문을 담은 것 하나만 고른다. 표시가 없으면 이전과 같이 멈춘다.
  if (hs.length > 1 && pick === 'nonEmpty') {
    const endOf = h => { const i = headers.indexOf(h); return i + 1 < headers.length ? headers[i + 1].line - 1 : eLine; };
    hs = hs.filter(h => top.some(st => H(st.node) >= h.line && HE(st.node) <= endOf(h)));
  }
  if (hs.length !== 1) fail('구획 주석이 ' + hs.length + '개: ' + title);
  const i = headers.indexOf(hs[0]);
  return { start: hs[0].line, hEnd: hs[0].endLine, end: i + 1 < headers.length ? headers[i + 1].line - 1 : eLine };
};

// ── 최상위 문 분류
const isPureInit = node => {
  if (!node) return true;
  let pure = true;
  const walk = n => {
    if (!pure || !n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    switch (n.type) {
      case 'StringLiteral': case 'NumericLiteral': case 'BooleanLiteral': case 'NullLiteral': case 'RegExpLiteral': case 'TemplateElement': return;
      case 'FunctionExpression': case 'ArrowFunctionExpression': return; // 본문은 부를 때 돈다
      case 'ObjectExpression': return n.properties.forEach(p => { if (p.type !== 'ObjectProperty' || p.computed) { if (p.type === 'ObjectMethod' && !p.computed) return; pure = false; return; } walk(p.value); });
      case 'ArrayExpression': return n.elements.forEach(walk);
      case 'TemplateLiteral': return n.expressions.length ? (pure = false) : undefined;
      case 'UnaryExpression': return n.operator === '-' ? walk(n.argument) : (pure = false);
      default: pure = false;
    }
  };
  walk(node);
  return pure;
};
const topThisArgs = p => {
  let bad = 0;
  p.traverse({ Function(q) { if (!q.isArrowFunctionExpression()) q.skip(); }, ThisExpression() { bad++; }, Identifier(q) { if (q.node.name === 'arguments' && q.isReferencedIdentifier()) bad++; } });
  return bad;
};
const wrapSafe = st => {
  const why = [];
  for (const [n, b] of Object.entries(iScope.bindings)) { const l = H(b.path.node); if (l >= H(st.node) && l <= HE(st.node)) why.push('IIFE 로 끌어올려지는 선언 ' + n); }
  if (topThisArgs(st)) why.push('최상위 this/arguments');
  st.traverse({ ReturnStatement(q) { if (q.getFunctionParent() === iife) why.push('최상위 return'); } });
  return why;
};

// #TASK-ES-465: `if(typeof window !== 'undefined'){ window.a = a; window.b = c; }` 처럼 몸통이 window 속성 대입뿐인 if 문(else 없음)은 노출 묶음이다 → 원래 자리
const isWindowAssign = x => x && x.type === 'AssignmentExpression' && x.operator === '=' && x.left.type === 'MemberExpression' && x.left.object.type === 'Identifier' && x.left.object.name === 'window' && (x.right.type !== 'AssignmentExpression' || isWindowAssign(x.right));
const isWindowExposureBlock = n => n.type === 'IfStatement' && !n.alternate && n.consequent.type === 'BlockStatement' && n.consequent.body.length > 0
  && n.consequent.body.every(b => b.type === 'ExpressionStatement' && (isWindowAssign(b.expression) || (b.expression.type === 'SequenceExpression' && b.expression.expressions.every(isWindowAssign))));
const cellByKey =Object.fromEntries(CFG.cells.map(c => [c.key, c]));
const plan = []; // { cell, action: move|wrap|keep, st, start, end, segStart, names, wrapName, why }
for (const c of CFG.cells) {
  for (const t of c.take) {
    const r = groupRange(t.group, t.headerPick);
    const sts = top.filter(s => H(s.node) >= r.start && HE(s.node) <= r.end);
    let wrapK = 0;
    sts.forEach((st, k) => {
      const prevEnd = k ? HE(sts[k - 1].node) : r.start - 1;
      const sharesPrevLine = !!(k && H(st.node) === prevEnd); // #TASK-ES-482: 한 줄에 두 문 — 둘 다 원래 자리에 남으면 문제없다(옮기는 문에 걸릴 때만 아래에서 멈춘다)
      const tail = lines[HE(st.node) - 1].slice(st.node.loc.end.column).trim();
      const tailCode = !!(tail && !tail.startsWith('//'));
      // 앞 주석·빈 줄은 그 문을 따라간다(묶음 첫 문은 구획 주석부터)
      const item = { cell: c.key, group: t.group, hEnd: r.hEnd, gStart: r.start, gEnd: r.end, st, start: H(st.node), end: HE(st.node), segStart: k ? prevEnd + 1 : r.start, names: [], sharesPrevLine, tailCode, preserveWindowSuffix: t.preserveWindowSuffix === true };
      const mine = n => t.all || (t.names || []).includes(n);
      if (st.isFunctionDeclaration()) {
        const n = st.node.id.name; item.names = [n];
        if (!mine(n)) { item.action = t.keepRest ? 'keep' : 'skip'; if (t.keepRest) { item.why = '이번 범위 밖(keepRest) — 원래 자리'; item.keepRestOnly = true; } return plan.push(item); }
        const b = iScope.getBinding(n);
        if (smokeFn.has(n) && !smokeReadsCell(c.file)) fail('smoke-test FN_NAMES 함수 — 시험지 선행 PR 이 먼저(유형 F2): ' + n);
        if (b.constantViolations.length) fail('함수 이름 재대입(유형 H) — 개별 설계: ' + n);
        if (topThisArgs(st.get('body'))) fail('최상위 this/arguments(유형 K) — 옮기지 않는다: ' + n);
        item.action = 'move';
      } else if (st.isVariableDeclaration()) {
        item.names = st.node.declarations.map(d => d.id.name);
        const movable = st.node.declarations.every(d => d.id.type === 'Identifier' && iScope.getBinding(d.id.name).constantViolations.length === 0 && isPureInit(d.init) && (!smokeFn.has(d.id.name) || smokeReadsCell(c.file)))
          && st.node.declarations.every(d => !d.init || !/Function|Arrow/.test(d.init.type) || topThisArgs(st) === 0);
        if (!item.names.some(mine)) { item.action = t.keepRest ? 'keep' : 'skip'; if (t.keepRest) { item.why = '이번 범위 밖(keepRest) — 원래 자리'; item.keepRestOnly = true; } return plan.push(item); }
        if (!item.names.every(mine)) fail('한 var 문의 이름을 일부만 가져감: ' + item.names.join(','));
        item.action = movable ? 'move' : 'keep';
        if (item.action === 'keep') item.why = '상태 변수(재대입 또는 실행되는 초기값) — 원래 자리에 두고 L getter/setter 로 읽는다';
      } else if (st.isClassDeclaration()) {
        item.names = [st.node.id.name]; item.action = 'keep'; item.why = 'class 선언은 이번 틀 밖';
      } else {
        const e = st.isExpressionStatement() && st.node.expression;
        const lineCount = HE(st.node) - H(st.node) + 1;
        if (e && e.type === 'AssignmentExpression' && e.left.type === 'MemberExpression' && e.left.object.type === 'Identifier' && e.left.object.name === 'window' && lineCount <= 3) { item.action = 'keep'; item.why = 'window 노출 — 원래 자리(순서 보존)'; }
        else if (isWindowExposureBlock(st.node)) { item.action = 'keep'; item.why = 'window 노출 묶음(if 안 window.X = … 만) — 원래 자리(순서 보존, #TASK-ES-465)'; }
        else if (!t.all && !(t.wrap || []).length) { item.action = t.keepRest ? 'keep' : 'skip'; if (t.keepRest) { item.why = '이번 범위 밖(keepRest) — 원래 자리'; item.keepRestOnly = true; } }
        else if (lineCount <= 3) { item.action = 'keep'; item.why = '3줄 이하 로드 중 문 — 원래 자리'; }
        else {
          const why = wrapSafe(st);
          if (why.length) { item.action = 'keep'; item.why = '감쌀 수 없음: ' + why.join(', '); }
          else {
            const wn = (t.wrap || [])[wrapK++];
            if (!wn) fail('감쌀 로드 중 문에 이름이 없다(설정 wrap): ' + H(st.node) + '~' + HE(st.node));
            if (iScope.hasBinding(wn) || iScope.hasGlobal && iScope.hasGlobal(wn)) fail('감쌀 함수 이름이 이미 있다: ' + wn);
            item.action = 'wrap'; item.wrapName = wn; item.names = [wn];
          }
        }
      }
      plan.push(item);
    });
    if ((t.wrap || []).length !== wrapK) fail('설정 wrap 이름 수(' + (t.wrap || []).length + ')와 감싼 문 수(' + wrapK + ')가 다르다: ' + t.group);
  }
}
// #TASK-ES-573: 명시 opt-in인 여러 줄 함수의 닫는 } 뒤 window.같은이름=같은함수; 한 문장만 원문 끝 열로 자른다.
// 일반 같은 줄 코드·계산 프로퍼티·연쇄 대입·한 줄 함수는 기존 차단을 유지한다. suffix는 원래 자리의 원문 그대로 남는다.
const windowSuffixEnd = it => {
  if (!it.preserveWindowSuffix || !it.st.isFunctionDeclaration() || it.start === it.end || iScope.hasOwnBinding('window')) return null;
  const n = it.st.node.id.name, col = it.st.node.loc.end.column;
  if (!/^[A-Za-z_$][\w$]*$/.test(n) || lines[it.end - 1].slice(0, col).trim() !== '}') return null;
  const nx = top[top.indexOf(it.st) + 1], e = nx && nx.isExpressionStatement() && nx.node.expression;
  if (!nx || H(nx.node) !== it.end || HE(nx.node) !== it.end || !plan.some(x => x.st === nx && x.action === 'keep')) return null;
  if (!e || e.type !== 'AssignmentExpression' || e.operator !== '=' || e.left.type !== 'MemberExpression' || e.left.computed || e.left.object.type !== 'Identifier' || e.left.object.name !== 'window' || e.left.property.name !== n || e.right.type !== 'Identifier' || e.right.name !== n) return null;
  if (!new RegExp('^[ \\t]+window\\.' + n.replace(/\$/g, '\\$') + '[ \\t]*=[ \\t]*' + n.replace(/\$/g, '\\$') + '[ \\t]*;[ \\t]*(?://.*)?$').test(lines[it.end - 1].slice(col))) return null;
  let count = 0; traverse(ast, { AssignmentExpression(p) { const l = p.node.left; if (l.type === 'MemberExpression' && l.object.type === 'Identifier' && l.object.name === 'window' && ((!l.computed && l.property.name === n) || (l.computed && l.property.type === 'StringLiteral' && l.property.value === n))) count++; } });
  if (count !== 1) return null;
  return col;
};
// #TASK-ES-482: 한 줄을 나눠 쓰는 문은 기본적으로 옮기거나 감쌀 수 없다. #573의 좁은 함수 끝 범위만 예외다.
for (const it of plan) {
  const out = it.action === 'move' || it.action === 'wrap';
  if (out && it.sharesPrevLine) fail('두 문이 한 줄에: ' + it.start);
  if (out && it.tailCode) { const col = windowSuffixEnd(it); if (col === null) fail('문 끝 줄 뒤에 다른 코드: ' + it.end); it.sourceEndColumn = col; }
  if (it.tailCode) { const nx = plan.find(x => x !== it && x.start === it.end && x.sharesPrevLine && (x.action === 'move' || x.action === 'wrap')); if (nx) fail('두 문이 한 줄에: ' + nx.start); }
}
// 같은 문을 두 세포가 가져가면 안 된다 · skip 은 다른 세포가 가져가야 한다
const byStart = new Map();
for (const it of plan) { const k = it.start; if (!byStart.has(k)) byStart.set(k, []); byStart.get(k).push(it); }
const finalPlan = [];
for (const [, its] of [...byStart].sort((a, b) => a[0] - b[0])) {
  const out = its.filter(i => i.action === 'move' || i.action === 'wrap');
  if (out.length > 1) fail('같은 문을 두 세포가 가져감: ' + its[0].start);
  // #TASK-ES-482: 한 묶음을 여러 세포가 이름으로 나눠 가질 때, 다른 세포의 keepRest(「이번 범위 밖」) 남김은 그 문을 옮기는 세포에 양보한다. 그 밖의 남김(상태 변수·노출 문 등)과 겹치면 멈춘다
  if (out.length && its.some(i => i.action === 'keep' && !(i.keepRestOnly))) fail('한 세포는 옮기고 다른 세포는 남김: ' + its[0].start);
  const real = out.length ? out : its.filter(i => i.action === 'keep').slice(0, 1);
  if (!real.length) { const s = its[0]; fail('어느 세포도 가져가지 않는 문(names 에 빠짐): ' + s.start + ' ' + (s.names.join(',') || s.st.node.type)); }
  finalPlan.push(real[0]);
}
// 묶음에 원래 자리에 남는 문이 있으면 구획 주석은 index.html 에 남긴다(지도의 묶음 이름·경계가 그대로 — 남은 문이 앞 묶음에 붙지 않는다)
for (const it of finalPlan) {
  if (it.segStart !== it.gStart || it.action === 'keep') continue;
  if (finalPlan.some(x => x.action === 'keep' && x.start >= it.gStart && x.end <= it.gEnd)) it.segStart = it.hEnd + 1;
}
const moved = finalPlan.filter(i => i.action === 'move');
const wrapped = finalPlan.filter(i => i.action === 'wrap');
const kept = finalPlan.filter(i => i.action === 'keep');
const MOVED_NAMES = new Set(moved.flatMap(i => i.names));
const CELL_OF = new Map(moved.flatMap(i => i.names.map(n => [n, i.cell])));
const outPieces = finalPlan.filter(i => i.action !== 'keep');
const cellOfLine = l => { const it = outPieces.find(x => l >= x.segStart && l <= x.end); return it ? it.cell : null; };

// ── 이름 바꿔 쓰기(옮기는 문·감싸는 문 안)
const edits = []; const bridged = new Map();
for (const it of outPieces) {
  it.st.traverse({
    Identifier(p) {
      const nm = p.node.name, par = p.parent;
      if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isClassMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
      const b = p.scope.getBinding(nm);
      if (!b || b.scope !== iScope) return;
      const here = it.cell;
      if (MOVED_NAMES.has(nm) && CELL_OF.get(nm) === here) return; // 같은 세포 안 — 그대로
      if (it.action === 'move' && it.names.includes(nm) && (p.parentPath.isFunctionDeclaration() || p.parentPath.isVariableDeclarator()) && par.id === p.node) return;
      const isWrite = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression() || (p.parentPath.isAssignmentPattern() && par.left === p.node) || p.parentPath.isArrayPattern() || (p.parentPath.isObjectProperty() && p.parentPath.parentPath.isObjectPattern());
      if (isWrite && b.kind === 'const') fail('const 에 대입: ' + nm);
      if (!bridged.has(nm)) bridged.set(nm, { assigned: false, kind: b.kind });
      if (isWrite) bridged.get(nm).assigned = true;
      if (p.parentPath.isObjectProperty() && par.shorthand) { edits.push({ start: par.start, end: par.end, text: nm + ': L.' + nm }); return; }
      edits.push({ start: p.node.start, end: p.node.end, text: 'L.' + nm });
    }
  });
}
const seen = new Set();
const uniq = edits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.start - a.start);
let newCode = code;
for (const e of uniq) newCode = newCode.slice(0, e.start) + e.text + newCode.slice(e.end);
const newLines = newCode.split('\n');
if (newLines.length !== code.split('\n').length) fail('줄 수가 바뀜');
const NL = l => newLines[l - 1 - off];
const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(NL(l)); return o; };

// ── 세포 파일
const outFiles = {};
for (const c of CFG.cells) {
  const its = outPieces.filter(i => i.cell === c.key).sort((a, b) => a.segStart - b.segStart);
  if (!its.length) continue;
  const body = [];
  let prevEnd = -2;
  for (const it of its) {
    if (it.segStart !== prevEnd + 1 && body.length) body.push('');
    body.push('  /* ---- 이전 전 index.html ' + it.segStart + '~' + it.end + '줄(#' + TAG + ' 생성기 표지) ---- */');
    if (it.sourceEndColumn != null) body.push('  /* 원문 AST 끝 ' + it.end + ':' + it.sourceEndColumn + ' · ' + it.names[0] + ' · 같은 줄 window 노출 보존 */');
    if (it.action === 'wrap') {
      body.push('  function ' + it.wrapName + '() { /* [#' + TAG + '] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */');
      body.push(...range(it.segStart, it.end));
      body.push('  } /* ' + it.wrapName + ' */');
    } else { const segment = range(it.segStart, it.end); if (it.sourceEndColumn != null) segment[segment.length - 1] = segment[segment.length - 1].slice(0, it.sourceEndColumn); body.push(...segment); }
    prevEnd = it.end;
  }
  const exportNames = its.flatMap(i => i.names);
  const pieces = its.map(i => i.segStart + '~' + i.end).join(' · ');
  outFiles[c.file] = [
    '/**',
    ' * ' + c.title,
    ' *',
    ...c.desc.map(d => ' * ' + d),
    ' * #' + TAG + '(' + (CFG.label || '인라인 어려움 묶음 시범') + '): index.html 인라인 IIFE 의 구간(이전 전 ' + pieces + '줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.',
    ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.',
    ' * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.',
    ' * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md',
    ' */',
    '(function(global) {',
    "  'use strict';",
    '  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.',
    '  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};',
    '  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다',
    '  var K = global.' + c.kit + ' = global.' + c.kit + ' || {};',
    '',
    ...body,
    '',
    ...exportNames.map(n => '  K.' + n + ' = ' + n + ';'),
    '',
    "  if (typeof module !== 'undefined' && module.exports) {",
    '    module.exports = K;',
    '  }',
    "})(typeof window !== 'undefined' ? window : globalThis);",
    '',
  ];
}

// ── index.html 새 판
let nh = lines.slice();
// (1) 묶음 자리: 옮긴 연속 구간 → 표지 한 줄, 감싼 문 → 부르는 한 줄, 남긴 문 → 그대로
const repl = [];
{
  const sorted = finalPlan.slice().sort((a, b) => a.segStart - b.segStart);
  let run = null;
  const flush = () => { if (run) { repl.push(run); run = null; } };
  for (const it of sorted) {
    if (it.action === 'move') {
      if (run && run.kind === 'move' && run.cell === it.cell && run.end + 1 === it.segStart && run.sourceEndColumn == null && it.sourceEndColumn == null) { run.end = it.end; run.names.push(...it.names); }
      else { flush(); run = { kind: 'move', cell: it.cell, segStart: it.segStart, end: it.end, names: it.names.slice(), sourceEndColumn: it.sourceEndColumn }; }
    } else if (it.action === 'wrap') { flush(); repl.push({ kind: 'wrap', cell: it.cell, segStart: it.segStart, end: it.end, names: [it.wrapName] }); }
    else flush();
  }
  flush();
}
for (const r of repl.slice().sort((a, b) => b.segStart - a.segStart)) {
  const file = cellByKey[r.cell].file;
  const line = r.kind === 'move'
    ? '  /* [#' + TAG + '] ' + r.names.join(' · ') + ' → ' + file + ' 로 옮김(' + (CFG.label || '인라인 어려움 묶음 시범') + ' — 앞 주석 포함) */'
    : '  ' + r.names[0] + '(); /* [#' + TAG + '] 로드 중 문(앞 주석 포함) → ' + file + ' 의 ' + r.names[0] + ' 로 옮김 — 원래 자리에서 부른다 */';
  nh.splice(r.segStart - 1, r.end - r.segStart + 1, line + (r.sourceEndColumn == null ? '' : lines[r.end - 1].slice(r.sourceEndColumn)));
}
// (2) 머리 이음매: 구역 자리 표지 아래(없으면 #TASK-ES-423 이음매 다음에 자리 표지 묶음을 만든다)
const usIdx = nh.findIndex((l, i) => i > sLine - 1 && l.includes('"use strict";'));
const SLOT_RE = s => new RegExp('^  /\\* \\[어려움 이음매 자리 ' + s + '[ \\]]');
// [#TASK-ES-524] 설정 newSlotBefore: 자리 묶음이 이미 있는데 이 구역 자리 표지가 없으면, 그 이름의 자리 표지 바로 앞에 이 구역 자리 표지 한 줄만 새로 둔다
// (인라인 3단계 병렬 구역 — 다른 빌더가 쓰는 자리와 다른 줄이라 머리에서 병합 충돌이 나지 않는다. 주석 한 줄이라 토큰 0).
if (CFG.newSlotBefore && !nh.some(l => SLOT_RE(CFG.slot).test(l))) {
  const b = nh.findIndex(l => SLOT_RE(CFG.newSlotBefore).test(l));
  if (b < 0) fail('newSlotBefore 자리 표지 없음: ' + CFG.newSlotBefore);
  nh.splice(b, 0, '  /* [어려움 이음매 자리 ' + CFG.slot + '] */');
}
if (!nh.some(l => SLOT_RE(CFG.slot).test(l))) {
  const a = nh.findIndex(l => l.includes('[#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매'));
  if (a < 0) fail('1차 이음매(#TASK-ES-423) 없음');
  let aEnd = -1; for (let i = a; i < nh.length; i++) if (nh[i] === '  });') { aEnd = i; break; }
  if (aEnd < 0 || aEnd - a > 80) fail('1차 이음매 expose 끝 못 찾음');
  nh.splice(aEnd + 1, 0,
    '',
    '  /* [#TASK-ES-439] 인라인 어려움 묶음 이음매 자리 (docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 생성기 docs/design/harness/module-split/gen-inline-hard.js)',
    '     구역(H1~H4·HO 기관)마다 자기 자리 표지 바로 아래에 ① 가져오기(var X = _키트.X) ② 앱 스코프 통로(expose getter·setter)를 생성기가 넣는다.',
    '     자리가 서로 다른 줄이라 여러 빌더가 동시에 옮겨도 이 머리에서 병합 충돌이 나지 않는다(자리 표지는 지우지 않는다).',
    '     구획 주석(=== 줄)을 쓰지 않는다 — 지도(scripts/inline-script-map.js)의 묶음 번호가 밀리지 않게 1차 이음매 묶음에 붙는다. */',
    ...CFG.slots.map(s => '  /* [어려움 이음매 자리 ' + s + '] */'));
}
const slotIdx = nh.findIndex(l => SLOT_RE(CFG.slot).test(l));
let insertAt = slotIdx + 1;
while (insertAt < nh.length && !/^  \/\* \[어려움 이음매 자리 /.test(nh[insertAt]) && nh[insertAt].trim() !== '') insertAt++;
// 이미 노출된 이름(머리 전체의 expose getter·setter)
const headEnd = nh.findIndex((l, i) => i > usIdx && /^  try\{$/.test(l));
const headText = nh.slice(usIdx, headEnd > 0 ? headEnd : usIdx + 600);
const getters = new Set(), setters = new Set(), kitVars = new Set();
for (const l of headText) {
  let m; const g = /get ([A-Za-z_$][\w$]*)\(\)/g; while ((m = g.exec(l))) getters.add(m[1]);
  const s = /set ([A-Za-z_$][\w$]*)\(v\)/g; while ((m = s.exec(l))) setters.add(m[1]);
  const k = l.match(/^  var (_\w+Kit) = window\.(\w+);$/); if (k) kitVars.add(k[1] + '=' + k[2]);
}
// 가져올 이름: 옮긴 이름 중 옮긴 코드 밖(index.html 에 남은 곳 · 다른 세포)에서 쓰는 것 + 감싼 함수
const IMPORTS = [];
const outsideRefs = {};
for (const it of moved) for (const n of it.names) {
  const b = iScope.getBinding(n);
  const outs = b.referencePaths.filter(r => cellOfLine(H(r.node)) !== CELL_OF.get(n));
  if (outs.length) { IMPORTS.push({ n, cell: it.cell }); outsideRefs[n] = outs.map(r => H(r.node)); }
}
for (const it of wrapped) IMPORTS.push({ n: it.wrapName, cell: it.cell });
// 다른 세포로 간 이름을 L. 로 부르면 그 이름도 노출해야 한다(가져온 var 를 getter 로)
const head = ['  /* [#' + TAG + '] ' + CFG.cells.map(c => c.file).join(' · ') + ' — 가져오기 ' + IMPORTS.length + '개 · 통로 노출은 스코프 분석으로 뽑았다 */'];
for (const c of CFG.cells) {
  // 앞선 이음매에 그 키트 변수가 없으면(예: 홈 탭) 이 자리에서 지역 변수로 만든다 — 전역 이름은 늘지 않는다(이미 있는 전역을 읽을 뿐)
  if (!kitVars.has(c.kitVar + '=' + c.kit)) { if ([...kitVars].some(k => k.startsWith(c.kitVar + '='))) fail('키트 변수 이름이 다른 키트에 쓰였다: ' + c.kitVar); head.push('  var ' + c.kitVar + ' = window.' + c.kit + ';'); kitVars.add(c.kitVar + '=' + c.kit); }
  for (const x of IMPORTS.filter(i => i.cell === c.key)) head.push('  var ' + x.n + ' = ' + c.kitVar + '.' + x.n + ';');
}
const exposeList = [...bridged.keys()].sort().filter(n => !getters.has(n) || (bridged.get(n).assigned && !setters.has(n)));
if (exposeList.length) {
  head.push("  window.OurgoalAppScope.expose('index.html', {");
  exposeList.forEach((n, i) => head.push('    get ' + n + '(){ return ' + n + '; }' + (bridged.get(n).assigned ? ', set ' + n + '(v){ ' + n + ' = v; }' : '') + (i === exposeList.length - 1 ? '' : ',')));
  head.push('  });');
}
nh.splice(insertAt, 0, ...head);
// (3) script 태그: 그 탭 index.js 태그 바로 앞, 같은 줄(순증가 0줄)
// 덮어쓰는 키트(유형 M): 어떤 js 파일이 global.<키트> = { … } 로 통째로 새로 대입하면, 그 파일 태그보다 앞에 넣은 세포의 K.x 는 지워진다 → 그 파일 태그 뒤(afterTag)에만 넣는다
const overwriters = kit => { const out = []; const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const p = path.join(d, e.name); if (e.isDirectory()) return walk(p); if (!e.name.endsWith('.js') || path.resolve(p) === path.resolve(APP, CFG.cells.find(c => c.kit === kit).file)) return; const t = fs.readFileSync(p, 'utf8'); if (new RegExp('(?:global|window)\\.' + kit + '\\s*=(?!=)').test(t) && !new RegExp('(?:global|window)\\.' + kit + '\\s*=\\s*(?:global|window)\\.' + kit + '\\s*\\|\\|').test(t)) out.push(path.relative(APP, p).replace(/\\/g, '/')); }); walk(path.join(APP, 'js')); return out; };
for (const c of CFG.cells) {
  if (!outFiles[c.file]) continue;
  const tagStr = '<script src="' + c.file + '"></script>';
  const ow = overwriters(c.kit);
  if (c.afterTag) {
    const idx = nh.findIndex(l => l.includes(c.afterTag));
    if (idx < 0) fail('태그 없음 ' + c.afterTag);
    nh[idx] = nh[idx].replace(c.afterTag, c.afterTag + tagStr);
  } else {
    if (ow.length) fail('키트 ' + c.kit + ' 를 통째로 새로 대입하는 파일이 있다(' + ow.join(', ') + ') — 그 태그 뒤에 넣도록 설정에 afterTag 를 쓴다(유형 M)');
    const idx = nh.findIndex(l => l.includes(c.beforeTag));
    if (idx < 0) fail('태그 없음 ' + c.beforeTag);
    nh[idx] = nh[idx].replace(c.beforeTag, tagStr + c.beforeTag);
  }
}
// 세포 태그는 인라인 IIFE 보다 앞이어야 한다(머리에서 가져온다)
for (const c of CFG.cells) { const ti = nh.findIndex(l => l.includes('<script src="' + c.file + '"></script>')); if (outFiles[c.file] && !(ti >= 0 && ti < sLine)) fail('세포 태그가 인라인 IIFE 뒤에 있다: ' + c.file); }

fs.writeFileSync(path.join(APP, 'index.html'), nh.join(EOL), 'utf8');
for (const [f, arr] of Object.entries(outFiles)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = {
  task: TAG, slot: CFG.slot, scriptHtmlLines: [sLine + 1, eLine],
  plan: finalPlan.map(i => ({ cell: i.cell, action: i.action, segment: [i.segStart, i.end], stmt: [i.start, i.end], names: i.names, why: i.why || null, ...(i.sourceEndColumn == null ? {} : { sourceEndColumn: i.sourceEndColumn }) })),
  imports: IMPORTS, outsideRefs,
  bridged: [...bridged.keys()].sort().map(n => ({ n, ...bridged.get(n), exposedBefore: getters.has(n), setterBefore: setters.has(n) })), exposed: exposeList, edits: uniq.length,
  htmlLinesBefore: lines.length, htmlLinesAfter: nh.length,
  files: Object.fromEntries(Object.entries(outFiles).map(([f, a]) => [f, a.length - 1])),
};
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-inline-hard-meta.json'), JSON.stringify(meta, null, 1));
console.log('move', moved.length, 'wrap', wrapped.length, 'keep', kept.length, '· edits', uniq.length, '· bridged', bridged.size, '· exposed', exposeList.length, '· imports', IMPORTS.length);
for (const k of kept) console.log('  keep', k.start + '~' + k.end, k.names.join(',') || k.st.node.type, '—', k.why);
console.log('index.html lines', lines.length, '->', nh.length);
for (const [f, a] of Object.entries(outFiles)) console.log(f, a.length - 1);
