'use strict';
// 목표 탭 이전 생성기(#TASK-ES-370): index.html 의 목표 탭 메인 렌더 renderGoalsScreen(이전 전 1,044줄)과 그것만 쓰는 렌더 헬퍼 2개를
// 글자 그대로 js/tabs/goals/*.js 로 옮기고, 인라인 IIFE 스코프 이름은 L.<이름>(js/core/app-scope.js 통로), 다른 목표 파일로 간 이전 함수는 K.<이름>(목표 키트)으로만 바꾼다.
// 일정 탭 생성기(gen-calendar.js, #TASK-ES-360)를 복제하고, 설정 탭 생성기(gen-settings.js, #TASK-ES-354)의 "800줄 넘는 화면 함수 → 머리 + 섹션" 방식을 더했다.
// renderGoalsScreen 은 800줄을 넘으므로 책임 단위 세 구간으로 나눈다(줄 수 분할 아님):
//   머리(서브탭·목표 칩·편집 토글·빈 상태, return 이 있는 구간) → render.js 의 renderGoalsScreen(조립자)
//   상세 마크업(마일스톤·상태 요약·내보내기 카드를 만들어 #goalDetailBody 에 넣기) → goal-detail.js 의 renderGoalDetailBody
//   상세 이벤트 배선(마감일·공개 범위·필터·선택·마일스톤 행·할 일 체크 …) → goal-detail-events.js 의 wireGoalDetailEvents
// 구간을 넘는 지역 변수는 인자(goal·body)와 반환값(allCollapsed·goalStatusHash·isDateStale·goalStatusStale)으로만 넘기고, 모두 재대입 0 을 검사한다.
// 손으로 옮기지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-goals.js <APP_DIR> [이전 전 index.html]
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const SRC = process.argv[3] || path.join(APP, 'index.html');
const html = fs.readFileSync(SRC, 'utf8');
const EOL = html.includes('\r\n') ? '\r\n' : '\n';
const lines = html.split('\n').map(l => l.replace(/\r$/, ''));
let sLine = -1, eLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { sLine = i + 1; break; }
}
for (let i = sLine; i < lines.length; i++) if (lines[i].startsWith('</script>')) { eLine = i; break; }
const off = sLine;
const code = lines.slice(sLine, eLine).join('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });

const FILES = {
  render: 'js/tabs/goals/render.js',
  detail: 'js/tabs/goals/goal-detail.js',
  events: 'js/tabs/goals/goal-detail-events.js',
};
// 옮기는 최상위 함수 → 파일(renderGoalsScreen 은 아래에서 구간별로 다시 나눈다). 파일 안 순서 = index.html 원래 순서.
const DECL_FILE = { resultBadgeHtml: 'detail', formatDateTimeBadge: 'detail', renderGoalsScreen: 'render' };
const MOVED_NAMES = Object.keys(DECL_FILE);
const MOVED = new Set(MOVED_NAMES);
// renderGoalsScreen 구간 함수(새 이름 — 목표 키트 안에서만 산다. 전역 이름을 늘리지 않는다)
const SECTION_FN = { detail: 'renderGoalDetailBody', events: 'wireGoalDetailEvents' };
// 구간 사이로 넘기는 지역 변수(인자·반환값). 이 밖의 지역 변수가 두 구간에 걸치면 멈춘다.
const PASS_TO_DETAIL = ['goal', 'body'];
const PASS_TO_EVENTS = ['goal', 'body'];
const RETURN_FROM_DETAIL = ['allCollapsed', 'goalStatusHash', 'isDateStale', 'goalStatusStale'];
// index.html 이 IIFE 맨 위에서 같은 이름으로 가져오는 것(옮긴 코드 밖에서 부르는 함수)
const IMPORTS = ['renderGoalsScreen'];

let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const top = iife.get('body').get('body');
const H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off;
const declOf = name => {
  const f = top.find(s => s.isFunctionDeclaration() && s.node.id.name === name);
  if (!f) throw new Error('함수 선언 없음 ' + name);
  return f;
};

// 재대입·중복 선언 검사, 바깥 참조 검사
for (const n of MOVED_NAMES) {
  const b = iScope.getBinding(n);
  if (!b) throw new Error('바인딩 없음 ' + n);
  if (b.constantViolations.length) throw new Error('이전 이름 재대입/중복 선언: ' + n);
}
const movedNodes = MOVED_NAMES.map(n => declOf(n));
const inMoved = l => movedNodes.some(p => l >= H(p.node) && l <= HE(p.node));
for (const n of MOVED_NAMES) {
  const outs = iScope.getBinding(n).referencePaths.filter(r => !inMoved(H(r.node)));
  if (outs.length && !IMPORTS.includes(n)) throw new Error('옮긴 코드 밖 참조가 있는데 가져오지 않음: ' + n + ' @' + outs.map(r => H(r.node)).join(','));
  if (!outs.length && IMPORTS.includes(n)) throw new Error('가져오기 목록에 있는데 바깥 참조 없음: ' + n);
}
for (const k of Object.values(SECTION_FN).concat(['_goalDetail'])) if (iScope.getBinding(k) || iScope.hasGlobal(k)) throw new Error('새 이름이 이미 있음: ' + k);

// ---- renderGoalsScreen 구간 나누기 ----
const rgs = declOf('renderGoalsScreen');
const RS = H(rgs.node), RE = HE(rgs.node);
// 끝 줄은 마지막 문과 닫는 중괄호가 한 줄에 있다(`…renderAll:renderAll }); }`). 그 줄의 문은 이벤트 구간으로 옮기고, 닫는 중괄호만 조립자 끝(  })에 둔다(토큰 순서 같음).
if (lines[RS - 1].trim() !== 'function renderGoalsScreen(){' || !/\}\);\s\}$/.test(lines[RE - 1])) throw new Error('renderGoalsScreen 첫·끝 줄 모양이 다름');
const stmts = rgs.get('body').get('body');
// 머리 끝 = if(!goal){ … return; } (목표가 없으면 빈 상태를 그리고 끝나는 문)
const headEndIdx = stmts.findIndex(s => s.isIfStatement() && s.get('test').isUnaryExpression({ operator: '!' }) && s.get('test.argument').isIdentifier({ name: 'goal' }));
if (headEndIdx < 0) throw new Error('머리 끝(if(!goal)) 없음');
// 상세 마크업 끝 = 최상위 body.innerHTML = … (상세 화면 HTML 을 넣는 문, 하나뿐이어야 한다)
const bodySetIdxs = stmts.map((s, i) => [s, i]).filter(([s]) => s.isExpressionStatement() && s.get('expression').isAssignmentExpression()
  && s.get('expression.left').isMemberExpression() && s.get('expression.left.object').isIdentifier({ name: 'body' })
  && s.get('expression.left.property').isIdentifier({ name: 'innerHTML' })).map(([, i]) => i);
if (bodySetIdxs.length !== 1) throw new Error('최상위 body.innerHTML 대입이 하나가 아님: ' + bodySetIdxs.length);
const detailEndIdx = bodySetIdxs[0];
if (!(detailEndIdx > headEndIdx)) throw new Error('구간 순서 이상');
const HEAD = [RS + 1, HE(stmts[headEndIdx].node)];
const DETAIL = [HEAD[1] + 1, HE(stmts[detailEndIdx].node)];
const EVENTS = [DETAIL[1] + 1, RE];
if (HE(stmts[stmts.length - 1].node) !== RE) throw new Error('마지막 문이 끝 줄에 있지 않음');
const secOfLine = l => (l >= HEAD[0] && l <= HEAD[1]) ? 'render' : (l >= DETAIL[0] && l <= DETAIL[1]) ? 'detail' : (l >= EVENTS[0] && l <= EVENTS[1]) ? 'events' : null;
// ① 경계가 문을 가르지 않는다
for (const st of stmts) {
  const a = secOfLine(H(st.node)), b = secOfLine(HE(st.node));
  if (!a || a !== b) throw new Error('구간 경계가 문을 가른다: ' + H(st.node) + '~' + HE(st.node));
}
// ② 지역 변수 교차: 정한 이름만, 정한 방향으로만 넘는다. 넘기는 이름은 재대입 0.
const crossing = {};
for (const [n, b] of Object.entries(rgs.scope.bindings)) {
  const declSec = secOfLine(H(b.path.node));
  const secs = new Set([b.path.node, ...b.referencePaths.map(p => p.node), ...b.constantViolations.map(p => p.node)].map(x => secOfLine(H(x))));
  if (secs.has(null)) throw new Error('구간 밖 지역 변수 사용: ' + n);
  if (secs.size === 1) continue;
  crossing[n] = [...secs];
  if (b.constantViolations.length) throw new Error('구간을 넘는 지역 변수에 재대입/중복 선언: ' + n);
  for (const s of secs) {
    if (s === declSec) continue;
    const ok = (declSec === 'render' && s === 'detail' && PASS_TO_DETAIL.includes(n))
      || (declSec === 'render' && s === 'events' && PASS_TO_EVENTS.includes(n))
      || (declSec === 'detail' && s === 'events' && RETURN_FROM_DETAIL.includes(n));
    if (!ok) throw new Error('정하지 않은 구간 교차: ' + n + ' ' + declSec + '→' + s);
  }
}
for (const n of [...PASS_TO_DETAIL, ...PASS_TO_EVENTS, ...RETURN_FROM_DETAIL]) if (!crossing[n]) throw new Error('넘긴다고 정했는데 실제로는 안 넘음: ' + n);
for (const n of RETURN_FROM_DETAIL) if (rgs.scope.bindings[n].kind !== 'var' || secOfLine(H(rgs.scope.bindings[n].path.node)) !== 'detail') throw new Error('반환 변수가 상세 구간의 var 가 아님: ' + n);
// ③ 옮기는 두 구간에 renderGoalsScreen 자신의 return·this·arguments 가 없어야 한다(구간 함수로 감싸면 뜻이 바뀐다)
for (const st of stmts.slice(headEndIdx + 1)) {
  const own = p => p.getFunctionParent() === rgs;
  st.traverse({
    ReturnStatement(p) { if (own(p)) throw new Error('옮기는 구간에 renderGoalsScreen 의 return: ' + H(p.node)); },
    ThisExpression(p) { let f = p.getFunctionParent(); while (f && f.isArrowFunctionExpression()) f = f.parentPath.getFunctionParent(); if (f === rgs) throw new Error('this: ' + H(p.node)); },
    Identifier(p) { if (p.node.name === 'arguments' && !p.scope.getBinding('arguments')) { let f = p.getFunctionParent(); while (f && f.isArrowFunctionExpression()) f = f.parentPath.getFunctionParent(); if (f === rgs) throw new Error('arguments: ' + H(p.node)); } },
    AwaitExpression(p) { if (own(p)) throw new Error('await: ' + H(p.node)); },
  });
}
// 주석만 있는 줄이 구간 경계에 걸려 있으면 구간 쪽에 붙는다(줄 단위로 자르므로 문 사이 주석은 다음 문과 같은 파일로 간다)

const fileOfLine = l => {
  for (const n of MOVED_NAMES) {
    const f = declOf(n).node;
    if (l >= H(f) && l <= HE(f)) return n === 'renderGoalsScreen' ? (l === RS ? 'render' : secOfLine(l)) : DECL_FILE[n];
  }
  return null;
};

// 바꿔 쓸 식별자
const edits = [];
const bridged = new Map();
for (const n of MOVED_NAMES) {
  declOf(n).traverse({
    Identifier(p) {
      const nm = p.node.name;
      const par = p.parent;
      if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
      const b = p.scope.getBinding(nm);
      if (!b || b.scope !== iScope) return;
      const here = fileOfLine(H(p.node));
      if (!here) throw new Error('파일 미정 줄 ' + H(p.node));
      let repl;
      if (MOVED.has(nm)) {
        if (DECL_FILE[nm] === here) return;
        if ((p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression()) throw new Error('이전 이름에 대입: ' + nm);
        repl = 'K.' + nm;
      } else {
        repl = 'L.' + nm;
        if (!bridged.has(nm)) bridged.set(nm, { assigned: false, kind: b.kind });
        if ((p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression()) bridged.get(nm).assigned = true;
      }
      if (p.parentPath.isObjectProperty() && par.shorthand) { edits.push({ start: par.start, end: par.end, text: nm + ': ' + repl }); return; }
      edits.push({ start: p.node.start, end: p.node.end, text: repl });
    }
  });
}
const seen = new Set();
const uniq = edits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.start - a.start);
let newCode = code;
for (const e of uniq) newCode = newCode.slice(0, e.start) + e.text + newCode.slice(e.end);
const newLines = newCode.split('\n');
if (newLines.length !== code.split('\n').length) throw new Error('줄 수가 바뀜');
const NL = l => newLines[l - 1 - off];
const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(NL(l)); return o; };
const declRange = name => range(H(declOf(name).node), HE(declOf(name).node));
// 함수 바로 위 설명 주석이 있으면(덩어리 밖에 남아 지워지지 않으므로) 멈춘다. renderGoalsScreen 위 구획 주석(RENDER: GOALS)은 index.html 에 남긴다.
for (const n of MOVED_NAMES) {
  const t = lines[H(declOf(n).node) - 2].trim();
  if (n === 'renderGoalsScreen') { if (t !== '/* ============ RENDER: GOALS ============ */') throw new Error('renderGoalsScreen 위 줄이 예상과 다름: ' + t); continue; }
  // 앞선 세포 이전이 남긴 한 줄 표지 주석(/* [#TASK-ES-3xx] … 로 옮김 … */)은 이 함수 설명이 아니다 — index.html 에 그대로 남는다.
  if ((t.startsWith('//') || t.startsWith('/*')) && !/^\/\* \[#TASK-ES-3\d\d\] .* 로 옮김/.test(t)) throw new Error('함수 위 설명 주석 처리 필요: ' + n + ' ' + t);
}

const HEADER_BRIDGE = [
  "  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.",
  "  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};",
  "  // 목표 키트: 목표 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)",
  "  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};",
];
const FOOT = (names) => [
  ...names.map(n => '  K.' + n + ' = ' + n + ';'),
  '',
  "  if (typeof module !== 'undefined' && module.exports) {",
  '    module.exports = K;',
  '  }',
  "})(typeof window !== 'undefined' ? window : globalThis);",
  '',
];
const lbl = n => H(declOf(n).node) + '~' + HE(declOf(n).node);
const out = {};
out[FILES.render] = [
  '/**',
  ' * OurGoal Goals Screen Renderer (목표 탭 메인 렌더 — 화면 단위 조립)',
  ' *',
  ' * #TASK-ES-370 (목표 탭 세포 이전): index.html 인라인 IIFE 의 renderGoalsScreen(이전 전 ' + lbl('renderGoalsScreen') + '줄, 1,044줄)을 동작 그대로 옮겼다.',
  ' * 800줄을 넘어 책임 단위 세 구간으로 나눴다(docs/specs/MODULE-SPLIT-PROTOCOL.md 0절 2 · 2절):',
  ' *   이 파일 renderGoalsScreen = 머리(이전 전 ' + HEAD[0] + '~' + HEAD[1] + '줄: 서브탭 칩·서브탭 분기·목표 칩·편집 토글·빈 상태) + 아래 두 구간을 원래 순서로 부르는 조립자',
  ' *   goal-detail.js renderGoalDetailBody(이전 전 ' + DETAIL[0] + '~' + DETAIL[1] + '줄: 상세 마크업) · goal-detail-events.js wireGoalDetailEvents(이전 전 ' + EVENTS[0] + '~' + EVENTS[1] + '줄: 상세 이벤트 배선)',
  ' * 구간을 넘는 지역 변수는 인자(goal·body)와 반환값(allCollapsed·goalStatusHash·isDateStale·goalStatusStale)으로만 넘긴다(모두 재대입 0 — 생성기 검사).',
  ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 목표 파일 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
  ' * index.html 은 IIFE 맨 위에서 이 키트(OurgoalGoalsKit)의 renderGoalsScreen 을 같은 이름으로 가져와 부른다 — 호출하는 쪽 수십 곳은 그대로다.',
  ' * window.renderGoalsScreen 노출 줄은 이전 전과 같은 자리(index.html)에 그대로 있다. 선례: 일정 탭 #TASK-ES-360 · 설정 탭 #TASK-ES-354.',
  ' */',
  '(function(global) {',
  "  'use strict';",
  ...HEADER_BRIDGE,
  '',
  NL(RS),
  ...range(HEAD[0], HEAD[1]),
  '    // [#TASK-ES-370] 여기부터는 goal-detail.js · goal-detail-events.js 로 옮긴 구간이다. 원래 순서 그대로 부르고, 구간 사이 지역 변수는 인자·반환값으로 넘긴다.',
  '    var _goalDetail = K.' + SECTION_FN.detail + '(' + PASS_TO_DETAIL.join(', ') + ');',
  '    K.' + SECTION_FN.events + '(' + PASS_TO_EVENTS.join(', ') + ', ' + RETURN_FROM_DETAIL.map(n => '_goalDetail.' + n).join(', ') + ');',
  '  }',
  '',
  ...FOOT(['renderGoalsScreen']),
];
out[FILES.detail] = [
  '/**',
  ' * OurGoal Goal Detail Markup (목표 탭 — 선택한 목표의 상세 마크업)',
  ' *',
  ' * #TASK-ES-370 (목표 탭 세포 이전): index.html 인라인 renderGoalsScreen 의 상세 마크업 구간(이전 전 ' + DETAIL[0] + '~' + DETAIL[1] + '줄)과',
  ' *   그 구간만 쓰는 헬퍼 resultBadgeHtml(이전 전 ' + lbl('resultBadgeHtml') + '줄) · formatDateTimeBadge(이전 전 ' + lbl('formatDateTimeBadge') + '줄)를 동작 그대로 옮겼다.',
  ' * 마일스톤 목록·진행 요약·마감일·공개 범위·AI 상태 요약 미니바·내보내기 카드·선택 막대를 만들어 #goalDetailBody 에 넣는다.',
  ' * renderGoalsScreen(js/tabs/goals/render.js)이 머리 다음에 K.' + SECTION_FN.detail + '(' + PASS_TO_DETAIL.join(', ') + ') 로 부르고,',
  ' * 다음 구간(goal-detail-events.js)이 쓰는 지역 변수 ' + RETURN_FROM_DETAIL.join('·') + ' 를 돌려준다.',
  ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 목표 파일 함수는 K.<이름>. 버그도 그대로 옮겼다(예: 같은 함수 안 var totalMs 두 번 선언 — 이 파일 안에 그대로 있다).',
  ' */',
  '(function(global) {',
  "  'use strict';",
  ...HEADER_BRIDGE,
  '',
  ...declRange('resultBadgeHtml'),
  '',
  ...declRange('formatDateTimeBadge'),
  '',
  '  /* renderGoalsScreen 의 상세 마크업 구간. goal·body 는 renderGoalsScreen 머리에서 정한 같은 값이다(재대입 없음). */',
  '  function ' + SECTION_FN.detail + '(' + PASS_TO_DETAIL.join(', ') + '){',
  ...range(DETAIL[0], DETAIL[1]),
  '    return { ' + RETURN_FROM_DETAIL.map(n => n + ': ' + n).join(', ') + ' };',
  '  }',
  '',
  ...FOOT(['resultBadgeHtml', 'formatDateTimeBadge', SECTION_FN.detail]),
];
out[FILES.events] = [
  '/**',
  ' * OurGoal Goal Detail Events (목표 탭 — 선택한 목표의 상세 이벤트 배선)',
  ' *',
  ' * #TASK-ES-370 (목표 탭 세포 이전): index.html 인라인 renderGoalsScreen 의 상세 이벤트 배선 구간(이전 전 ' + EVENTS[0] + '~' + EVENTS[1] + '줄)을 동작 그대로 옮겼다.',
  ' * 프롬프트 백과사전·마감일·공개 범위·필터·보기 전환·접기·선택·내보내기·보관·마일스톤 행·할 일 체크·일정 지정·캘린더 동기화·마일스톤 추가 버튼을 잇는다.',
  ' * renderGoalsScreen(js/tabs/goals/render.js)이 상세 마크업(goal-detail.js) 다음에 K.' + SECTION_FN.events + '(…) 로 부른다.',
  ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 목표 파일 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
  ' */',
  '(function(global) {',
  "  'use strict';",
  ...HEADER_BRIDGE,
  '',
  '  /* renderGoalsScreen 의 상세 이벤트 배선 구간. goal·body 는 renderGoalsScreen 머리에서, 나머지 넷은 상세 마크업 구간(renderGoalDetailBody)이 돌려준 같은 값이다(재대입 없음). */',
  '  function ' + SECTION_FN.events + '(' + [...PASS_TO_EVENTS, ...RETURN_FROM_DETAIL].join(', ') + '){',
  ...range(EVENTS[0], EVENTS[1] - 1),
  NL(EVENTS[1]).replace(/\s*\}\s*$/, ''),
  '  }',
  '',
  ...FOOT([SECTION_FN.events]),
];

// index.html 새 판: 옮긴 함수마다 한 줄 표지 주석으로 바꾼다(사이가 빈 줄뿐인 경우는 이번 대상에 없다 — 세 함수가 서로 멀리 떨어져 있다)
const spans = movedNodes.map(p => [H(p.node), HE(p.node), p.node.id.name]).sort((a, b) => b[0] - a[0]);
let newHtmlLines = lines.slice();
for (const [a, b, n] of spans) {
  const mk = n === 'renderGoalsScreen'
    ? '  /* [#TASK-ES-370] renderGoalsScreen → js/tabs/goals/render.js(머리·조립) · goal-detail.js(상세 마크업) · goal-detail-events.js(상세 이벤트) 로 옮김(목표 탭 세포) */'
    : '  /* [#TASK-ES-370] ' + n + ' → ' + FILES[DECL_FILE[n]] + ' 로 옮김(목표 탭 세포) */';
  newHtmlLines.splice(a - 1, b - a + 1, mk);
}
// IIFE 머리: 일정 탭 이음매(#TASK-ES-360) 바로 다음에 목표 탭 이음매를 둔다
const calHead = newHtmlLines.findIndex(l => l.includes('[#TASK-ES-360] 일정 탭 모듈 이음매'));
if (calHead < 0) throw new Error('일정 탭 이음매 없음');
let calEnd = -1;
for (let i = calHead; i < newHtmlLines.length; i++) if (newHtmlLines[i] === '  });') { calEnd = i; break; }
if (calEnd < 0 || calEnd - calHead > 80) throw new Error('일정 탭 expose 끝 못 찾음');
// 앞선 이음매가 이미 노출한 이름은 다시 달지 않는다(다시 달면 앞에서 단 setter 를 getter 만으로 덮어쓴다)
const alreadyExposed = new Set();
const usIdx0 = newHtmlLines.findIndex((l, i) => i > sLine - 1 && l.includes('"use strict";'));
for (let i = usIdx0; i <= calEnd; i++) { const re = /get ([A-Za-z_$][\w$]*)\(\)/g; let m; while ((m = re.exec(newHtmlLines[i]))) alreadyExposed.add(m[1]); }
if (!alreadyExposed.size) throw new Error('앞선 노출 목록을 못 읽음');
const bridgedSorted = [...bridged.keys()].sort();
const bridgedNew = bridgedSorted.filter(n => !alreadyExposed.has(n));
for (const n of bridgedSorted) if (alreadyExposed.has(n) && bridged.get(n).assigned && !newHtmlLines.slice(usIdx0, calEnd + 1).some(l => l.includes('set ' + n + '(v)'))) throw new Error('대입하는 이름인데 기존 노출에 setter 없음: ' + n);
const header = [
  '',
  '  /* ============ [#TASK-ES-370] 목표 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 일정 탭 #TASK-ES-360 과 같은 틀) ============',
  '     ① 가져오기: js/tabs/goals/render.js 로 옮긴 renderGoalsScreen 을 이 스코프에서 같은 이름으로 부른다(전역에 새 이름을 만들지 않는다).',
  '     ② 앱 스코프 통로: 옮긴 코드가 읽는 이 스코프의 공용 상태·함수를 window.OurgoalAppScope.scope 한 곳에만 getter 로 노출한다(목록은 스코프 분석으로 뽑았다 — 옮긴 코드가 실제로 쓰는 이름 중 앞선 이음매(설정·기록·일정)가 아직 노출하지 않은 것만 더한다). */',
  '  var _goalsKit = window.OurgoalGoalsKit;',
  ...IMPORTS.map(n => '  var ' + n + ' = _goalsKit.' + n + ';'),
  "  window.OurgoalAppScope.expose('index.html', {",
  ...bridgedNew.map((n, i) => {
    const info = bridged.get(n);
    const comma = i === bridgedNew.length - 1 ? '' : ',';
    return '    get ' + n + '(){ return ' + n + '; }' + (info.assigned ? ', set ' + n + '(v){ ' + n + ' = v; }' : '') + comma;
  }),
  '  });',
];
newHtmlLines.splice(calEnd + 1, 0, ...header);
const goalsIdx = newHtmlLines.findIndex(l => l.trim() === '<script src="js/tabs/goals/sub-team.js"></script>');
if (goalsIdx < 0) throw new Error('sub-team.js 태그 없음');
if (newHtmlLines[goalsIdx + 1].trim() !== '<script src="js/tabs/goals/index.js"></script>') throw new Error('goals/index.js 태그 위치 다름');
newHtmlLines.splice(goalsIdx + 1, 0, '<script src="js/tabs/goals/goal-detail.js"></script>', '<script src="js/tabs/goals/goal-detail-events.js"></script>', '<script src="js/tabs/goals/render.js"></script>');
if (!newHtmlLines.some(l => l.trim() === '<script src="js/core/app-scope.js"></script>')) throw new Error('app-scope.js 태그 없음');

fs.writeFileSync(path.join(APP, 'index.html'), newHtmlLines.join(EOL), 'utf8');
for (const [f, arr] of Object.entries(out)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = { scriptHtmlLines: [sLine + 1, eLine],
  moved: MOVED_NAMES.map(n => ({ n, file: FILES[DECL_FILE[n]], lines: [H(declOf(n).node), HE(declOf(n).node)] })),
  renderGoalsScreenSections: { head: HEAD, detail: DETAIL, events: EVENTS }, crossing,
  imports: IMPORTS, bridged: bridgedSorted.map(n => ({ n, ...bridged.get(n), alreadyExposedBefore: alreadyExposed.has(n) })), newlyExposed: bridgedNew, edits: uniq.length };
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-goals-meta.json'), JSON.stringify(meta, null, 1));
console.log('edits', uniq.length, 'bridged', bridgedSorted.length, 'newly exposed', bridgedNew.length, 'sections', JSON.stringify(meta.renderGoalsScreenSections));
console.log('crossing', JSON.stringify(crossing));
for (const [f, arr] of Object.entries(out)) console.log(f, arr.length - 1);
