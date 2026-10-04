'use strict';
// 아바타·EXP 쪼개기 PR-4 생성기(#TASK-ES-390, 설계 docs/specs/REQ-TASK-ES-384-AVATAR-EXP-PLAN.md 3-1·3-2절):
// js/avatar-system.js 의 아바타 설정 모달(showAvatarLegalNotice · openAvatarModal)을 js/avatar/modal/ 섹션 7개로,
// PR-3(#TASK-ES-389)이 남긴 기능 카드 핸들러 4개·대사 2개를 js/avatar/feature-cards.js 로 글자 그대로 옮긴다.
//   modal/index.js     showAvatarLegalNotice + openAvatarModal 머리(공유 변수 선언까지)·openModal 뼈대(섹션을 원래 순서로 부르는 조립자)
//   modal/markup.js    모달 HTML 문자열(var html = …)
//   modal/bind-period.js  생성 기준 기간·퀵 칩
//   modal/bind-deck.js    탭 토글·남은 횟수·보기 갱신·보관함 슬롯·성장 성향·제작 완료 인입·첫 서랍 바인딩
//   modal/bind-craft.js   초기 페르소나 복원(원래 자리에서 부름) · 사진 업로드 · 제작 실행
//   modal/bind-persona.js 320종 도감 토글·검색·탭
//   modal/bind-save.js    최종 적용하기
// 바꾸는 글자는 이름 참조뿐이다.
//   · 다른 파일(avatar-system.js·다른 부품)의 팩토리 스코프 이름 → AV.<이름> (PR-3 과 같다)
//   · 모달의 지역 이름(openAvatarModal·openModal 콜백 스코프)을 다른 섹션이 쓰면 → MS.<이름> (모달 상태 객체).
//     MS 는 조립자(index.js)가 그 이름에 대한 getter 로 만든다(살아 있는 값). 섹션이 다시 대입하는 이름(설계의 9개)만 setter 가 있다.
//     섹션 안에 선언된 함수를 다른 섹션이 부르면, 그 섹션 맨 위에서 MS.<이름> = <이름> 으로 담는다(함수 선언 끌어올림과 같은 시점).
// 섹션 경계 검사(틀 docs/specs/MODULE-SPLIT-PROTOCOL.md 2절): ① 문 하나를 가르지 않는다(최상위 문 단위로만 자른다)
//   ② 모달 지역 이름을 두 섹션이 쓰면 반드시 MS 로만(목록을 적는다) ③ 다시 대입되는 공유 이름 = 설계 9개와 같아야 한다.
//   ④ 다른 섹션 함수를 바로(중첩 함수 밖에서) 부르면 그 섹션이 먼저 실행돼야 한다 ⑤ MS./AV. 로 부르는 함수는 this 를 쓰지 않는다.
// 남는 것(avatar-system.js): 기능 카드 window.handle아바타_* 대입 if 문 4쌍·api.<이름> = … 4줄(원래 자리·원래 실행 시점 — components.js 덮어쓰기 순서 보존).
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-avatar-modal.js <APP_DIR> <이전 전 js/avatar-system.js>
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const SRC = process.argv[3];
if (!APP || !SRC) throw new Error('사용: gen-avatar-modal.js <APP_DIR> <이전 전 avatar-system.js>');
const code = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
const lines = code.split('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });
const TAG = '#TASK-ES-390';
const SHARED_MUTABLE = ['selectedType', 'newCustomUrl', 'lastUploadedImg', 'lastUploadedDataUrl', 'currentFeatures', 'chosenTheme', 'periodStart', 'periodEnd', 'currentPersona'];

// 파일·섹션 정의(섹션 이름 → 파일 · 섹션 함수 이름 · 설명)
const SEC = {
  markup: { file: 'modal/markup.js', fn: 'renderAvatarModalMarkup', title: '모달 HTML 문자열' },
  restore: { file: 'modal/bind-craft.js', fn: 'restoreAvatarModalPersona', title: '초기 페르소나 복원' },
  period: { file: 'modal/bind-period.js', fn: 'bindAvatarModalPeriod', title: '생성 기준 기간·퀵 칩' },
  deck: { file: 'modal/bind-deck.js', fn: 'bindAvatarModalDeck', title: '탭 토글·남은 횟수·보기 갱신·보관함 슬롯·성장 성향·제작 완료 인입' },
  craft: { file: 'modal/bind-craft.js', fn: 'bindAvatarModalCraft', title: '사진 업로드·제작 실행' },
  persona: { file: 'modal/bind-persona.js', fn: 'bindAvatarModalPersona', title: '320종 도감 토글·검색·탭' },
  save: { file: 'modal/bind-save.js', fn: 'bindAvatarModalSave', title: '최종 적용하기' },
};
const SEC_ORDER = ['markup', 'restore', 'period', 'deck', 'craft', 'persona', 'save']; // 원래 실행 순서
const TOP_DEST = {
  showAvatarLegalNotice: 'modal/index.js', openAvatarModal: 'modal/index.js',
  'handle아바타_Item26Action': 'feature-cards.js', 'handle아바타_Item32Action': 'feature-cards.js', triggerAvatarLevelUpDialogue: 'feature-cards.js',
  'handle아바타_Item41Action': 'feature-cards.js', triggerExpCelebrationPopup: 'feature-cards.js', 'handle아바타_Item42Action': 'feature-cards.js',
};
const TOP_MOVED = Object.keys(TOP_DEST);
const FILE_TITLE = {
  'feature-cards.js': '자동 생성 기능 카드 핸들러 4개(26·32·41·42) · 레벨업/EXP 대사 2개',
  'modal/index.js': '아바타 설정 모달 조립자 · 초상권 안내',
  'modal/markup.js': SEC.markup.title,
  'modal/bind-period.js': SEC.period.title,
  'modal/bind-deck.js': SEC.deck.title,
  'modal/bind-craft.js': SEC.restore.title + ' · ' + SEC.craft.title,
  'modal/bind-persona.js': SEC.persona.title,
  'modal/bind-save.js': SEC.save.title,
};
const PART_FILES = ['feature-cards.js', 'modal/index.js', 'modal/markup.js', 'modal/bind-period.js', 'modal/bind-deck.js', 'modal/bind-craft.js', 'modal/bind-persona.js', 'modal/bind-save.js'];

// 1) 팩토리 · 최상위 문
let fac = null;
traverse(ast, { FunctionExpression(p) { if (!fac && p.node.params.length === 0 && p.parentPath.isCallExpression()) fac = p; } });
if (!fac) throw new Error('팩토리 없음');
const fScope = fac.scope;
const top = fac.get('body').get('body');
const S = n => n.loc.start.line, E = n => n.loc.end.line;
const declName = s => {
  if (s.isFunctionDeclaration()) return s.node.id.name;
  if (s.isVariableDeclaration() && s.node.declarations.length === 1) return s.node.declarations[0].id.name;
  return null;
};
if (/\bMS\b/.test(code)) throw new Error('원본에 MS 이름이 이미 있음');
for (const n of TOP_MOVED) {
  const b = fScope.getBinding(n);
  if (!b || !b.path.isFunctionDeclaration()) throw new Error('최상위 함수 선언 아님 ' + n);
  if (b.constantViolations.length) throw new Error('옮길 이름 재대입 ' + n);
}
// AV 에서 가져온 이름(var X = AV.X) — 다른 부품에 있는 이름
const avImported = new Set();
for (const s of top) {
  if (!s.isVariableDeclaration() || s.node.declarations.length !== 1) continue;
  const d = s.node.declarations[0];
  if (d.init && d.init.type === 'MemberExpression' && d.init.object.type === 'Identifier' && d.init.object.name === 'AV' && !d.init.computed && d.init.property.name === d.id.name) avImported.add(d.id.name);
}
// 이미 AV getter 로 나가 있는 이름(PR-3 이음매)
const avGetters = new Set();
traverse(ast, { ObjectMethod(p) { if (p.node.kind === 'get' && p.findParent(q => q.isCallExpression() && q.node.callee.type === 'MemberExpression' && q.node.callee.property.name === 'getOwnPropertyDescriptors')) avGetters.add(p.node.key.name); } });

// 2) 덩어리 만들기(앞 주석 포함 시작 줄 ~ 끝 줄). 두 문이 한 줄을 같이 쓰면 멈춘다. 문 사이 틈은 빈 줄이어야 한다.
const comments = ast.comments;
function chunkify(stmts, openLine) {
  return stmts.map((s, i) => {
    const prevEnd = i ? E(stmts[i - 1].node) : openLine;
    if (S(s.node) === prevEnd) throw new Error('두 문이 한 줄: ' + S(s.node));
    let start = S(s.node);
    // PR-3 이 남긴 안내 주석(「→ … 로 옮김」)은 앞 문의 주석이 아니다 — 그 뒤의 주석만 이 문의 앞 주석으로 본다
    let floor = prevEnd;
    for (const c of comments) if (isMarker(c) && c.loc.start.line > prevEnd && c.loc.end.line < S(s.node)) floor = Math.max(floor, c.loc.end.line);
    for (const c of comments) if (c.loc.start.line > floor && c.loc.end.line < S(s.node) && c.loc.start.line < start) start = c.loc.start.line;
    return { path: s, from: start, to: E(s.node), prevEnd };
  });
}
function isMarker(c) { return c.type === 'CommentBlock' && /^ \[#TASK-ES-3\d\d\] .* 로 옮김\(동작 그대로\)/.test(c.value); }
const markerLines = new Set();
for (const c of comments) if (isMarker(c)) for (let l = c.loc.start.line; l <= c.loc.end.line; l++) markerLines.add(l);
function checkGaps(ch, firstOpen) {
  for (let i = 0; i < ch.length; i++) {
    const a = i ? ch[i - 1].to + 1 : firstOpen + 1;
    for (let l = a; l < ch[i].from; l++) if (!markerLines.has(l) && lines[l - 1].trim() && lines[l - 1].trim() !== "'use strict';") throw new Error('문 사이 틈에 글자 줄 ' + l + ': ' + lines[l - 1]);
  }
}
const topCh = chunkify(top, S(fac.node.body));
checkGaps(topCh, S(fac.node.body));
topCh.forEach(c => { c.name = declName(c.path); c.dest = (c.name && TOP_DEST[c.name]) || 'main'; });

// 3) openAvatarModal 안: 머리 문 · html · openModal 콜백
const F = fScope.getBinding('openAvatarModal').path;
const Fscope = F.scope;
const FB = F.get('body').get('body');
const fbCh = chunkify(FB, S(F.node.body));
checkGaps(fbCh, S(F.node.body));
let callIdx = -1, htmlIdx = -1;
FB.forEach((s, i) => {
  if (s.isVariableDeclaration() && declName(s) === 'html') htmlIdx = i;
  if (s.isExpressionStatement() && s.node.expression.type === 'CallExpression' && s.node.expression.callee.name === 'openModal') callIdx = i;
});
if (htmlIdx < 0 || callIdx !== FB.length - 1 || htmlIdx !== callIdx - 1) throw new Error('openAvatarModal 모양이 다름 html=' + htmlIdx + ' call=' + callIdx);
const C = FB[callIdx].get('expression').get('arguments')[1];
if (!C.isFunctionExpression() || C.node.params.length !== 1 || C.node.params[0].name !== 'sheet') throw new Error('openModal 콜백 모양이 다름');
const Cscope = C.scope;
const CB = C.get('body').get('body');
const cbCh = chunkify(CB, S(C.node.body));
checkGaps(cbCh, S(C.node.body));
fbCh.forEach((c, i) => { c.sec = i === htmlIdx ? 'markup' : 'index'; });
// 콜백 문 → 섹션: 시작 표지 문부터 다음 표지 전까지
const isIf = (s, test) => s.isIfStatement() && code.slice(s.node.test.start, s.node.test.end) === test;
let cur = 'index';
cbCh.forEach(c => {
  const s = c.path;
  if (s.isFunctionDeclaration() && s.node.id.name === 'updatePeriodSummaryLabel') cur = 'period';
  else if (isIf(s, 'typeToggle')) cur = 'deck';
  else if (isIf(s, 'btnUpload && fileInput')) cur = 'craft';
  else if (s.isVariableDeclaration() && declName(s) === 'btnToggle320') cur = 'persona';
  else if (isIf(s, 'btnSave')) cur = 'save';
  const iife = s.isExpressionStatement() && s.node.expression.type === 'CallExpression' && s.node.expression.callee.type === 'FunctionExpression' && s.node.expression.callee.id && s.node.expression.callee.id.name === 'preloadCurrentPersona';
  c.sec = iife ? 'restore' : cur;
});
for (const k of SEC_ORDER) if (!fbCh.concat(cbCh).some(c => c.sec === k)) throw new Error('섹션 없음 ' + k);
// 각 섹션은 이어진 덩어리여야 한다(restore 는 한 문)
for (const k of SEC_ORDER) {
  const idx = cbCh.map((c, i) => (c.sec === k ? i : -1)).filter(i => i >= 0);
  for (let j = 1; j < idx.length; j++) if (idx[j] !== idx[j - 1] + 1) throw new Error('섹션이 끊김 ' + k);
}
// 섹션 실행 순서가 SEC_ORDER 와 같은지
const seqSeen = [];
for (const c of fbCh.concat(cbCh)) if (c.sec !== 'index' && seqSeen[seqSeen.length - 1] !== c.sec) seqSeen.push(c.sec);
if (seqSeen.join(',') !== SEC_ORDER.join(',')) throw new Error('섹션 순서 다름 ' + seqSeen.join(','));

const allModalCh = fbCh.concat(cbCh);
const secOfNode = node => { const c = cbCh.concat(fbCh).find(c => node.start >= c.path.node.start && node.end <= c.path.node.end); return c ? c.sec : 'index'; };
const topChOfNode = node => topCh.find(c => node.start >= c.path.node.start && node.end <= c.path.node.end);
const fileOfSec = k => (k === 'index' ? 'modal/index.js' : SEC[k].file);

// 4) 이름 참조 바꾸기
const edits = [];
const bridged = new Set(); // avatar-system.js 에 남아 AV getter 가 새로 필요한 이름
const msNames = new Map(); // 모달 지역 이름 → { owner, users:Set, assigned:Set }
const avCalled = new Set(), msCalled = new Set();
const immediateUse = []; // 섹션 함수를 중첩 함수 밖에서 부름
function addEdit(p, repl) {
  const par = p.parent;
  if (p.parentPath.isObjectProperty() && par.shorthand && par.value === p.node) { edits.push({ start: par.start, end: par.end, text: p.node.name + ': ' + repl }); return; }
  edits.push({ start: p.node.start, end: p.node.end, text: repl });
}
function isRefIdent(p) {
  const par = p.parent;
  if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return false;
  if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return false;
  if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return false;
  if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return false;
  if (p.parentPath.isFunctionDeclaration() && par.id === p.node) return false;
  if (p.parentPath.isFunctionExpression() && par.id === p.node) return false;
  return true;
}
const ownerOfBinding = b => {
  const decls = [b.path, ...b.constantViolations.filter(v => v.isVariableDeclarator())];
  const owners = new Set(decls.map(d => (d.node === F.node || d.node === C.node || d.isFunction() && (d.node === F.node || d.node === C.node)) ? 'index' : secOfNode(d.node)));
  // 매개변수(deps·sheet)는 binding.path 가 함수 자체 → index
  if (b.kind === 'param') return 'index';
  if (owners.size !== 1) throw new Error('같은 이름이 두 섹션에서 선언됨: ' + b.identifier.name + ' ' + [...owners].join(','));
  return [...owners][0];
};
for (const tc of topCh) {
  if (tc.dest === 'main') continue;
  const here = tc.dest;
  tc.path.traverse({
    Identifier(p) {
      if (!isRefIdent(p)) return;
      const nm = p.node.name;
      const b = p.scope.getBinding(nm);
      if (!b) return;
      const asg = (p.parentPath.isAssignmentExpression() && p.parent.left === p.node) || p.parentPath.isUpdateExpression();
      const isCall = p.parentPath.isCallExpression() && p.parent.callee === p.node;
      if (b.scope.block === fac.node) {
        if (p.node === tc.path.node.id) return;
        const there = TOP_DEST[nm] || (avImported.has(nm) ? 'part' : 'main');
        // modal/index.js 안이라도 섹션 파일로 가는 문이면 다른 파일이다
        const fileHere = here === 'modal/index.js' ? fileOfSec(secOfNode(p.node)) : here;
        if (there === fileHere) return;
        if (asg) throw new Error('다른 파일 이름에 대입: ' + nm + ' 줄 ' + S(p.node));
        if (there === 'main' && !avGetters.has(nm)) bridged.add(nm);
        if (isCall) avCalled.add(nm);
        addEdit(p, 'AV.' + nm);
        return;
      }
      if (here !== 'modal/index.js') return;
      if (b.scope.block !== F.node && b.scope.block !== C.node) return;
      const useSec = secOfNode(p.node);
      const owner = ownerOfBinding(b);
      if (owner === useSec) return;
      // html 은 조립자의 이음매 줄(var html = AV.renderAvatarModalMarkup(MS))이 같은 이름으로 다시 선언한다 — 조립자가 쓰는 것은 그 값
      if (nm === 'html' && owner === 'markup' && useSec === 'index') return;
      if (useSec === 'index') throw new Error('조립자가 섹션 이름을 씀: ' + nm + ' 줄 ' + S(p.node));
      let rec = msNames.get(nm);
      if (!rec) { rec = { owner, users: new Set(), assigned: new Set(), kind: b.kind, scope: b.scope.block === F.node ? 'F' : 'C' }; msNames.set(nm, rec); }
      rec.users.add(useSec);
      if (asg) rec.assigned.add(useSec);
      if (owner !== 'index') {
        if (!b.path.isFunctionDeclaration()) throw new Error('섹션의 var 를 다른 섹션이 씀: ' + nm + ' 줄 ' + S(p.node));
        if (asg) throw new Error('섹션 함수에 대입: ' + nm);
        // ④ 중첩 함수 밖에서 부르면 정의 섹션이 먼저 돌아야 한다
        const fnParent = p.getFunctionParent();
        if (fnParent && (fnParent.node === C.node || fnParent.node === F.node)) immediateUse.push({ nm, owner, useSec, line: S(p.node) });
      }
      if (isCall) msCalled.add(nm);
      addEdit(p, 'MS.' + nm);
    }
  });
}
for (const u of immediateUse) if (SEC_ORDER.indexOf(u.owner) >= SEC_ORDER.indexOf(u.useSec)) throw new Error('뒤 섹션 함수를 먼저 부름: ' + u.nm + ' 줄 ' + u.line);
// ③ 다시 대입되는 공유 이름 = 설계 9개
if (process.env.GEN_DEBUG) console.log([...msNames].map(([n, r]) => n + ':' + r.owner + ':' + [...r.users] + ':' + [...r.assigned]).join(' '));
const assignedShared = [...msNames].filter(([, r]) => r.assigned.size).map(([n]) => n).sort();
if (assignedShared.join(',') !== SHARED_MUTABLE.slice().sort().join(',')) throw new Error('다시 대입되는 공유 이름이 설계 9개와 다름: ' + assignedShared.join(','));
for (const n of assignedShared) if (msNames.get(n).owner !== 'index' || msNames.get(n).scope !== 'C') throw new Error('공유 바뀌는 이름이 콜백 머리에 없음 ' + n);
// ⑤ this 검사: MS./AV. 로 부르는 함수 선언은 자기 몸통에서 this 를 쓰지 않는다
function noThis(fnPath, nm) { fnPath.traverse({ ThisExpression(p) { if (p.getFunctionParent() === fnPath) throw new Error('this 를 쓰는 함수를 접두로 부름: ' + nm); } }); }
for (const nm of msCalled) { const r = msNames.get(nm); const b = (r.scope === 'F' ? Fscope : Cscope).getBinding(nm); if (b.path.isFunction()) noThis(b.path, nm); else if (b.path.isVariableDeclarator() && b.path.node.init && /Function/.test(b.path.node.init.type)) noThis(b.path.get('init'), nm); }
for (const nm of avCalled) { const b = fScope.getBinding(nm); if (b.path.isFunctionDeclaration()) noThis(b.path, nm); }
for (const nm of bridged) { const b = fScope.getBinding(nm); if (b.constantViolations.length) throw new Error('getter 로 노출할 이름이 재대입됨: ' + nm); }

const seen = new Set();
const uniq = edits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.start - a.start);
let newCode = code;
for (const e of uniq) newCode = newCode.slice(0, e.start) + e.text + newCode.slice(e.end);
const NLs = newCode.split('\n');
if (NLs.length !== lines.length) throw new Error('줄 수가 바뀜');
const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(NLs[l - 1]); return o; };

// 5) 섹션 몸통
const secLines = {}; // sec → { from, to, lines }
for (const k of SEC_ORDER) {
  const cs = allModalCh.filter(c => c.sec === k);
  const from = cs[0].from, to = cs[cs.length - 1].to;
  secLines[k] = { from, to, body: range(from, to) };
}
const exportsOf = k => [...msNames].filter(([, r]) => r.owner === k).map(([n]) => n).sort();
const msFromIndex = sc => [...msNames].filter(([, r]) => r.owner === 'index' && r.scope === sc).map(([n]) => n).sort();

const WRAP_HEAD = (file, extra) => [
  '/**',
  ' * OurGoal Avatar Cell: ' + FILE_TITLE[file] + ' (' + TAG + ' · 아바타·EXP 쪼개기 PR-4)',
  ' *',
  ...extra.map(l => ' * ' + l),
  ' * 바깥에서는 이전과 같이 window.OurgoalAvatar.<이름> 으로 부른다(avatar-system.js 가 같은 이름으로 가져와 api 에 담는다).',
  ' * 브라우저: index.html 이 avatar-system.js 보다 먼저 읽어 OurgoalAvatarParts 에 담는다. Node: avatar-system.js 가 require 해서 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md',
  ' */',
  '(function (root, factory) {',
  "  if (typeof module === 'object' && module.exports) {",
  '    module.exports = factory;',
  '  } else {',
  '    factory(root.OurgoalAvatarParts = root.OurgoalAvatarParts || {});',
  '  }',
  "}(typeof self !== 'undefined' ? self : this, function (AV) {",
  "  'use strict';",
  '',
];
const out = {};
const SECFN_OPEN = k => '  function ' + SEC[k].fn + '(MS) {';
const secFnBlock = k => {
  const ex = exportsOf(k);
  return [
    '  /* [' + TAG + '] 섹션: ' + SEC[k].title + ' — openAvatarModal(js/avatar/modal/index.js)이 원래 자리에서 부른다(이전 전 줄 ' + secLines[k].from + '~' + secLines[k].to + '). */',
    SECFN_OPEN(k),
    ...ex.map(n => '    MS.' + n + ' = ' + n + '; // 다른 섹션이 부르는 이 섹션의 함수(끌어올림과 같은 시점)'),
    ...secLines[k].body,
    ...(k === 'markup' ? ['    return html;'] : []),
    '  }',
  ];
};
const sectionNote = k => '이전 전 openAvatarModal(js/avatar-system.js ' + secLines[k].from + '~' + secLines[k].to + '줄)의 이 섹션을 동작 그대로 옮겼다.';
const prefixNote = '바꾼 것은 이름 참조뿐이다 — 다른 섹션·조립자의 모달 지역 이름은 MS.<이름>(모달 상태 객체, index.js 가 getter 로 만든다), avatar-system.js·다른 부품 이름은 AV.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).';
for (const k of ['markup', 'period', 'deck', 'persona', 'save']) {
  const f = SEC[k].file;
  out[f] = [...WRAP_HEAD(f, [sectionNote(k), prefixNote]), ...secFnBlock(k), '', '  AV.' + SEC[k].fn + ' = ' + SEC[k].fn + ';', '}));', ''];
}
out['modal/bind-craft.js'] = [...WRAP_HEAD('modal/bind-craft.js', [sectionNote('restore'), sectionNote('craft'), prefixNote]),
  ...secFnBlock('restore'), '', ...secFnBlock('craft'), '',
  '  AV.' + SEC.restore.fn + ' = ' + SEC.restore.fn + ';', '  AV.' + SEC.craft.fn + ' = ' + SEC.craft.fn + ';', '}));', ''];

// 6) modal/index.js: showAvatarLegalNotice + openAvatarModal(섹션 자리는 부르는 줄 한 줄, MS 만들기 블록)
const MS_BEGIN = sc => '    /* [' + TAG + '] MS ' + sc + ' 시작 — 섹션이 같이 쓰는 ' + (sc === 'F' ? 'openAvatarModal' : 'openModal 콜백') + ' 지역 이름(목록은 스코프 분석으로 뽑음). getter 는 살아 있는 값, setter 는 섹션이 다시 대입하는 이름만 */';
const MS_END = sc => '    /* [' + TAG + '] MS ' + sc + ' 끝 */';
function msBlock(sc, indent) {
  const names = msFromIndex(sc);
  const pad = ' '.repeat(indent);
  const o = [pad + MS_BEGIN(sc).trim()];
  if (sc === 'F') o.push(pad + 'var MS = {};');
  o.push(pad + 'Object.defineProperties(MS, {');
  names.forEach((n, i) => {
    const set = msNames.get(n).assigned.size ? ', set: function (v) { ' + n + ' = v; }' : '';
    o.push(pad + '  ' + n + ': { get: function () { return ' + n + '; }' + set + ' }' + (i === names.length - 1 ? '' : ','));
  });
  o.push(pad + '});');
  o.push(pad + MS_END(sc).trim());
  return o;
}
const CALL = (k, indent) => ' '.repeat(indent) + (k === 'markup' ? 'var html = AV.' + SEC.markup.fn + '(MS);' : 'AV.' + SEC[k].fn + '(MS);') + ' /* [' + TAG + '] ' + SEC[k].title + ' → js/avatar/' + SEC[k].file + ' 로 옮김(동작 그대로) */';
const ocTop = topCh.find(c => c.name === 'openAvatarModal');
const idxLines = [];
const lastCallbackHeadIdx = (() => { // 9개 공유 변수 선언 마지막 문
  let li = -1; cbCh.forEach((c, i) => { if (c.sec === 'index' && c.path.isVariableDeclaration() && SHARED_MUTABLE.includes(declName(c.path))) li = i; }); return li;
})();
if (lastCallbackHeadIdx < 0) throw new Error('공유 변수 선언 없음');
const emitted = new Set();
for (let l = ocTop.from; l <= ocTop.to; l++) {
  const fc = fbCh.find(c => l >= c.from && l <= c.to && c.sec === 'markup');
  const ccK = SEC_ORDER.find(k => k !== 'markup' && l >= secLines[k].from && l <= secLines[k].to); const cc = ccK ? { sec: ccK } : null;
  if (fc) { if (!emitted.has('markup')) { emitted.add('markup'); idxLines.push(...msBlock('F', 4), CALL('markup', 4)); } continue; }
  if (cc) { if (!emitted.has(cc.sec)) { emitted.add(cc.sec); idxLines.push(CALL(cc.sec, 6)); } continue; }
  idxLines.push(NLs[l - 1]);
  if (l === cbCh[lastCallbackHeadIdx].to) idxLines.push(...msBlock('C', 6));
}
const legal = topCh.find(c => c.name === 'showAvatarLegalNotice');
out['modal/index.js'] = [...WRAP_HEAD('modal/index.js', [
  '이전 전 js/avatar-system.js(' + (lines.length - 1) + '줄)의 showAvatarLegalNotice(' + legal.from + '~' + legal.to + '줄)·openAvatarModal(' + ocTop.from + '~' + ocTop.to + '줄)을 동작 그대로 옮겼다.',
  'openAvatarModal 은 머리(공유 변수 선언까지)와 openModal 뼈대만 남은 조립자다 — 섹션 6개(markup·bind-*)를 원래 순서·원래 자리에서 부른다.',
  '섹션이 같이 쓰는 지역 이름은 모달 상태 객체 MS 의 getter 로 넘긴다(살아 있는 값). 섹션이 다시 대입하는 9개(' + SHARED_MUTABLE.join('·') + ')만 setter 가 있다.',
  'avatar-system.js·다른 부품 이름은 AV.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).']),
  ...range(legal.from, legal.to), '', ...idxLines, '',
  '  AV.showAvatarLegalNotice = showAvatarLegalNotice;', '  AV.openAvatarModal = openAvatarModal;', '}));', ''];

// 7) feature-cards.js — 이어진 기능 카드 문 묶음
const runs = [];
for (const c of topCh) {
  if (c.dest !== 'feature-cards.js') continue;
  const i = topCh.indexOf(c);
  const last = runs[runs.length - 1];
  if (last && last.lastIdx === i - 1) { last.to = c.to; last.names.push(c.name); last.lastIdx = i; }
  else runs.push({ from: c.from, to: c.to, names: [c.name], lastIdx: i, dest: 'feature-cards.js' });
}
const fcNames = runs.flatMap(r => r.names);
out['feature-cards.js'] = [...WRAP_HEAD('feature-cards.js', [
  'js/avatar-system.js(이전 전 ' + (lines.length - 1) + '줄)에서 이 책임 묶음의 선언을 동작 그대로 옮겼다(이전 전 줄: ' + runs.map(r => r.from + '~' + r.to).join(', ') + ').',
  '  ' + fcNames.join(' · '),
  'window.handle아바타_* 대입 if 문·api.<이름> = … 줄은 avatar-system.js 원래 자리에 남았다(js/components.js 가 41·42 를 나중에 덮어쓰는 순서 보존).',
  '바꾼 글자 없음(바깥 이름을 읽지 않는다). 버그도 그대로 옮겼다(고치는 것은 별도 티켓).']),
  ...runs.flatMap((r, i) => [...(i ? [''] : []), ...range(r.from, r.to)]), '',
  ...fcNames.map(n => '  AV.' + n + ' = ' + n + ';'), '}));', ''];

// 8) avatar-system.js 새 판
const removed = new Set();
const markerAt = new Map();
const mainRuns = [{ from: legal.from, to: ocTop.to, names: ['showAvatarLegalNotice', 'openAvatarModal'], dest: 'modal/index.js' }, ...runs];
for (const t of topCh) if (t.dest === 'modal/index.js' && (t.from < legal.from || t.to > ocTop.to)) throw new Error('모달 묶음이 이어져 있지 않음');
for (const r of mainRuns) {
  for (let l = r.from; l <= r.to; l++) removed.add(l);
  markerAt.set(r.from, '  /* [' + TAG + '] ' + r.names.join(' · ') + ' → js/avatar/' + r.dest + ' 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */');
}
const mainOut = [];
for (let l = 1; l <= lines.length; l++) {
  if (markerAt.has(l)) mainOut.push(markerAt.get(l));
  if (!removed.has(l)) mainOut.push(lines[l - 1]);
}
// 이음매 2: PR-3 이음매(getter 블록 끝 '  }));') 바로 다음
const g1 = mainOut.findIndex(l => l.startsWith('  /* ============ [#TASK-ES-389] 아바타 부품 이음매'));
const g1End = mainOut.findIndex((l, i) => i > g1 && l === '  }));');
if (g1 < 0 || g1End < 0) throw new Error('PR-3 이음매 없음');
const NODE = "typeof module === 'object' && module && module.exports && typeof require === 'function'";
const bridgedSorted = [...bridged].sort();
const header2 = [
  '  /* ============ [' + TAG + '] 아바타 부품 이음매 2 — 모달 섹션(js/avatar/modal/*)·기능 카드(js/avatar/feature-cards.js) ============',
  '     위 이음매와 같은 방식: 옮긴 선언을 같은 이름으로 가져오고, 옮긴 코드가 읽는 이 팩토리 이름만 AV 에 getter 로 노출한다. */',
  '  if (' + NODE + ') {',
  ...PART_FILES.map(f => "    require('./avatar/" + f + "')(AV);"),
  '  }',
  ...TOP_MOVED.map(n => '  var ' + n + ' = AV.' + n + ';'),
  ...(bridgedSorted.length ? [
    '  Object.defineProperties(AV, Object.getOwnPropertyDescriptors({',
    ...bridgedSorted.map((n, i) => '    get ' + n + '() { return ' + n + '; }' + (i === bridgedSorted.length - 1 ? '' : ',')),
    '  }));'] : []),
];
mainOut.splice(g1End + 1, 0, ...header2);
fs.mkdirSync(path.join(APP, 'js', 'avatar', 'modal'), { recursive: true });
fs.writeFileSync(path.join(APP, 'js', 'avatar-system.js'), mainOut.join('\n'), 'utf8');
for (const [f, arr] of Object.entries(out)) fs.writeFileSync(path.join(APP, 'js', 'avatar', f), arr.join('\n'), 'utf8');

// 9) index.html: avatar-system.js <script> 바로 앞에 부품 8개(원본 태그·버전 글자는 그대로)
const htmlPath = path.join(APP, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const STAG = '  <script src="js/avatar-system.js?v=20260913-es054"></script>';
if (html.split(STAG).length !== 2) throw new Error('avatar-system.js script 태그가 1개가 아님');
const eol = html.includes('\r\n') ? '\r\n' : '\n';
const NEW_TAGS = PART_FILES.map(f => '  <script src="js/avatar/' + f + '?v=20261005-es390"></script>').join(eol) + eol;
if (!html.includes('js/avatar/modal/index.js')) fs.writeFileSync(htmlPath, html.replace(STAG, NEW_TAGS + STAG), 'utf8');

const meta = {
  sections: Object.fromEntries(SEC_ORDER.map(k => [k, { file: 'js/avatar/' + SEC[k].file, from: secLines[k].from, to: secLines[k].to, lines: secLines[k].to - secLines[k].from + 1, exports: exportsOf(k) }])),
  ms: Object.fromEntries([...msNames].sort().map(([n, r]) => [n, { owner: r.owner, scope: r.scope, users: [...r.users].sort(), assigned: [...r.assigned].sort() }])),
  msSetters: assignedShared, msFromF: msFromIndex('F'), msFromC: msFromIndex('C'),
  avBridgedNew: bridgedSorted, avCalled: [...avCalled].sort(), msCalled: [...msCalled].sort(), immediateCrossCalls: immediateUse,
  featureCardRuns: runs.map(r => ({ from: r.from, to: r.to, names: r.names })), edits: uniq.length,
  mainLines: mainOut.length - (mainOut[mainOut.length - 1] === '' ? 1 : 0),
};
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-avatar-modal-meta.json'), JSON.stringify(meta, null, 1));
console.log('edits', uniq.length, 'AV new getters', bridgedSorted.join(','));
console.log('MS from F', meta.msFromF.join(','));
console.log('MS from C', meta.msFromC.join(','));
console.log('MS setters', assignedShared.join(','));
console.log('section exports', JSON.stringify(Object.fromEntries(SEC_ORDER.map(k => [k, exportsOf(k)]))));
console.log('js/avatar-system.js', lines.length - 1, '->', meta.mainLines);
for (const [f, arr] of Object.entries(out)) console.log('js/avatar/' + f, arr.length - 1);
