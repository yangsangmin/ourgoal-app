'use strict';
// 일정 탭 이전 생성기(#TASK-ES-360): index.html 의 일정(캘린더) 탭 렌더 코드를 글자 그대로 js/tabs/calendar/*.js 로 옮기고,
// 인라인 IIFE 스코프 이름은 L.<이름>(js/core/app-scope.js 통로), 다른 일정 파일로 간 이전 함수는 K.<이름>(일정 키트)으로만 바꾼다.
// 기록 탭 생성기(gen-records.js, #TASK-ES-358)를 복제해 일반화했다: 옮기는 문이 한 구간이 아니라 여러 덩어리이고, 함수 선언 외에 var 선언(WEEKDAYS_KR)도 옮긴다.
// 손으로 옮기지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-calendar.js <APP_DIR> [이전 전 index.html]
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
  render: 'js/tabs/calendar/render.js',
  day: 'js/tabs/calendar/day-detail.js',
  agent: 'js/tabs/calendar/natural-schedule.js',
};
// 옮기는 이름(함수 선언 또는 var 선언) → 옮겨 갈 파일. 파일 안 순서는 이 순서(= index.html 원래 순서).
// calCellHtml(날짜 칸)은 일정 렌더 전용 헬퍼지만 index.html 에 남긴다: 동결 시험지 scripts/verify-integrity-gate.js [검증 21/21] #TASK-ES-197 이
// index.html 한 파일에서 그 함수 안의 글자(cal-photo-diary-bg·cal-photo-badge)를 찾는다(합본을 읽지 않는다). 옮긴 코드는 L.calCellHtml 로 부른다.
const DECL_FILE = {
  WEEKDAYS_KR: 'render', calWeekStart: 'render', calShift: 'render', renderCalendarScreen: 'render',
  renderCalDayDetail: 'day',
  parseNaturalScheduleText: 'agent', executeCalAgentNaturalSchedule: 'agent',
};
const MOVED_NAMES = Object.keys(DECL_FILE);
const MOVED = new Set(MOVED_NAMES);
// index.html 이 IIFE 맨 위에서 같은 이름으로 가져오는 것(옮긴 코드 밖에서 부르는 함수)
const IMPORTS = ['renderCalendarScreen', 'calShift'];

let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const top = iife.get('body').get('body');
const H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off;
const declOf = name => {
  const f = top.find(s => (s.isFunctionDeclaration() && s.node.id.name === name)
    || (s.isVariableDeclaration() && s.node.declarations.length === 1 && s.node.declarations[0].id.name === name));
  if (!f) throw new Error('선언 없음(함수 또는 단일 var) ' + name);
  return f;
};

// 재대입·중복 선언 검사(있으면 옮기면 뜻이 바뀐다)
for (const n of MOVED_NAMES) {
  const b = iScope.getBinding(n);
  if (!b) throw new Error('바인딩 없음 ' + n);
  if (b.constantViolations.length) throw new Error('이전 이름 재대입/중복 선언: ' + n);
  // 옮긴 var 를 옮긴 코드 밖에서 읽으면 안 된다(가져오기 목록에 없는 바깥 참조 금지)
}
const movedNodes = MOVED_NAMES.map(n => declOf(n));
const inMoved = l => movedNodes.some(p => l >= H(p.node) && l <= HE(p.node));
for (const n of MOVED_NAMES) {
  const outs = iScope.getBinding(n).referencePaths.filter(r => !inMoved(H(r.node)));
  if (outs.length && !IMPORTS.includes(n)) throw new Error('옮긴 코드 밖 참조가 있는데 가져오지 않음: ' + n + ' @' + outs.map(r => H(r.node)).join(','));
  if (!outs.length && IMPORTS.includes(n)) throw new Error('가져오기 목록에 있는데 바깥 참조 없음: ' + n);
}

// 지울 덩어리: 옮긴 문을 원래 순서로 늘어놓고, 사이가 빈 줄뿐이면 한 덩어리로 묶는다
const spans = movedNodes.map(p => [H(p.node), HE(p.node)]).sort((a, b) => a[0] - b[0]);
const groups = [];
for (const [a, b] of spans) {
  const g = groups[groups.length - 1];
  if (g) {
    let gapBlank = true;
    for (let l = g.e + 1; l < a; l++) if (lines[l - 1].trim() !== '') { gapBlank = false; break; }
    if (gapBlank) { g.e = b; g.members.push([a, b]); continue; }
  }
  groups.push({ s: a, e: b, members: [[a, b]] });
}
// 덩어리 안에 옮기지 않는 문이 끼어 있지 않은지(빈 줄 말고는 없어야 한다)
for (const g of groups) for (const st of top) {
  const l = H(st.node);
  if (l >= g.s && l <= g.e && !movedNodes.some(p => p.node === st.node)) throw new Error('덩어리 안에 예상 밖 문: ' + l);
}

const fileOfLine = l => {
  for (const n of MOVED_NAMES) { const f = declOf(n).node; if (l >= H(f) && l <= HE(f)) return DECL_FILE[n]; }
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
        if (!declOf(nm).isFunctionDeclaration()) throw new Error('다른 파일에서 옮긴 var 를 읽음: ' + nm);
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
// 이번 대상에는 함수 바로 위 설명 주석이 없다(있으면 덩어리 밖에 남겨 지워지지 않으므로 멈춘다)
for (const n of MOVED_NAMES) {
  const t = lines[H(declOf(n).node) - 2].trim();
  if (t.startsWith('//') || (t.startsWith('/*') && t.endsWith('*/') && !t.includes('일정(캘린더) 탭'))) throw new Error('함수 위 설명 주석 처리 필요: ' + n + ' ' + t);
}

const HEADER_BRIDGE = [
  "  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.",
  "  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};",
  "  // 일정 키트: 일정 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)",
  "  var K = global.OurgoalCalendarKit = global.OurgoalCalendarKit || {};",
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
const namesIn = f => MOVED_NAMES.filter(n => DECL_FILE[n] === f);
const fnNamesIn = f => namesIn(f).filter(n => declOf(n).isFunctionDeclaration());
const rangeLabel = f => namesIn(f).map(n => H(declOf(n).node) + '~' + HE(declOf(n).node)).join(', ');
const body = f => namesIn(f).flatMap(n => [...declRange(n), '']);
const out = {};
out[FILES.render] = [
  '/**',
  ' * OurGoal Calendar Screen Renderer (일정 탭 화면 렌더)',
  ' *',
  ' * #TASK-ES-360 (일정 탭 세포 이전): index.html 인라인 IIFE 에 있던 일정 탭 렌더 코드(이전 전 ' + rangeLabel('render') + '줄)를 동작 그대로 옮겼다.',
  ' *   WEEKDAYS_KR(요일 머리글) · calWeekStart(주 시작일) · calShift(월·주·일 이동) · renderCalendarScreen(일정 화면 전체 렌더)',
  ' * 날짜 칸 calCellHtml 은 index.html 에 남아 있다(동결 시험지 verify-integrity-gate #TASK-ES-197 이 index.html 에서 그 글자를 찾는다) — L.calCellHtml 로 부른다.',
  ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 일정 파일 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
  ' * index.html 은 IIFE 맨 위에서 이 키트(OurgoalCalendarKit)의 renderCalendarScreen·calShift 를 같은 이름으로 가져와 부른다 — 호출하는 쪽 수십 곳은 그대로다.',
  ' * window.renderCalendarScreen·window.calShift 노출 줄은 이전 전과 같은 자리(index.html)에 그대로 있다. 선례: 기록 탭 #TASK-ES-358.',
  ' */',
  '(function(global) {',
  "  'use strict';",
  ...HEADER_BRIDGE,
  '',
  ...body('render'),
  ...FOOT(fnNamesIn('render')),
];
out[FILES.day] = [
  '/**',
  ' * OurGoal Calendar Day Detail Renderer (일정 탭 선택한 날의 상세 목록 렌더)',
  ' *',
  ' * #TASK-ES-360 (일정 탭 세포 이전): index.html 인라인 IIFE 의 renderCalDayDetail(이전 전 ' + rangeLabel('day') + '줄)을 동작 그대로 옮겼다.',
  ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다.',
  ' * renderCalendarScreen(js/tabs/calendar/render.js)이 K.renderCalDayDetail 로 부른다.',
  ' * (소블록 sub-day-detail.js 가 찾는 window.renderCalendarDayDetail 과는 다른 이름이다 — 이전 전과 같다.)',
  ' */',
  '(function(global) {',
  "  'use strict';",
  ...HEADER_BRIDGE,
  '',
  ...body('day'),
  ...FOOT(fnNamesIn('day')),
];
out[FILES.agent] = [
  '/**',
  ' * OurGoal Calendar Natural-Language Schedule (일정 탭 AI 일정 비서 — 자연어 한 줄을 일정으로 등록)',
  ' *',
  ' * #TASK-ES-360 (일정 탭 세포 이전): index.html 인라인 IIFE 의 parseNaturalScheduleText · executeCalAgentNaturalSchedule(이전 전 ' + rangeLabel('agent') + '줄)를 동작 그대로 옮겼다.',
  ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 일정 파일 함수는 K.<이름>. 버그도 그대로 옮겼다.',
  ' * renderCalendarScreen(js/tabs/calendar/render.js)이 그리는 일정 비서 입력칸(#calAgentInput)의 버튼·Enter 가 K.executeCalAgentNaturalSchedule 로 부른다.',
  ' */',
  '(function(global) {',
  "  'use strict';",
  ...HEADER_BRIDGE,
  '',
  ...body('agent'),
  ...FOOT(fnNamesIn('agent')),
];

// index.html 새 판: 덩어리마다 한 줄 표지 주석으로 바꾼다
const marker = g => {
  const names = MOVED_NAMES.filter(n => { const l = H(declOf(n).node); return l >= g.s && l <= g.e; });
  const files = [...new Set(names.map(n => FILES[DECL_FILE[n]]))];
  return '  /* [#TASK-ES-360] ' + names.join(' · ') + ' → ' + files.join(' · ') + ' 로 옮김(일정 탭 세포) */';
};
let newHtmlLines = lines.slice();
for (const g of groups.slice().sort((a, b) => b.s - a.s)) newHtmlLines.splice(g.s - 1, g.e - g.s + 1, marker(g));
// IIFE 머리: 기록 탭 이음매(#TASK-ES-358) 바로 다음에 일정 탭 이음매를 둔다
const recHead = newHtmlLines.findIndex(l => l.includes('[#TASK-ES-358] 기록 탭 모듈 이음매'));
if (recHead < 0) throw new Error('기록 탭 이음매 없음');
let recEnd = -1;
for (let i = recHead; i < newHtmlLines.length; i++) if (newHtmlLines[i] === '  });') { recEnd = i; break; }
if (recEnd < 0 || recEnd - recHead > 80) throw new Error('기록 탭 expose 끝 못 찾음');
// 앞선 이음매(설정 #TASK-ES-354 · 기록 #TASK-ES-358)가 이미 노출한 이름은 다시 달지 않는다(다시 달면 앞에서 단 setter — 예: state·googleTokenClient — 를 getter 만으로 덮어쓴다)
const alreadyExposed = new Set();
const usIdx0 = newHtmlLines.findIndex((l, i) => i > sLine - 1 && l.includes('"use strict";'));
for (let i = usIdx0; i <= recEnd; i++) { const m = /^\s{4}get ([A-Za-z_$][\w$]*)\(\)/.exec(newHtmlLines[i]); if (m) alreadyExposed.add(m[1]); }
if (!alreadyExposed.size) throw new Error('앞선 노출 목록을 못 읽음');
const bridgedSorted = [...bridged.keys()].sort();
const bridgedNew = bridgedSorted.filter(n => !alreadyExposed.has(n));
for (const n of bridgedSorted) if (alreadyExposed.has(n) && bridged.get(n).assigned && !newHtmlLines.slice(usIdx0, recEnd + 1).some(l => l.includes('set ' + n + '(v)'))) throw new Error('대입하는 이름인데 기존 노출에 setter 없음: ' + n);
const header = [
  '',
  '  /* ============ [#TASK-ES-360] 일정 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 기록 탭 #TASK-ES-358 과 같은 틀) ============',
  '     ① 가져오기: js/tabs/calendar/render.js 로 옮긴 함수를 이 스코프에서 같은 이름으로 부른다(전역에 새 이름을 만들지 않는다).',
  '     ② 앱 스코프 통로: 옮긴 코드가 읽는 이 스코프의 공용 상태·함수를 window.OurgoalAppScope.scope 한 곳에만 getter 로 노출한다(목록은 스코프 분석으로 뽑았다 — 옮긴 코드가 실제로 쓰는 이름 중 앞선 이음매(설정·기록)가 아직 노출하지 않은 것만 더한다). */',
  '  var _calendarKit = window.OurgoalCalendarKit;',
  ...IMPORTS.map(n => '  var ' + n + ' = _calendarKit.' + n + ';'),
  "  window.OurgoalAppScope.expose('index.html', {",
  ...bridgedNew.map((n, i) => {
    const info = bridged.get(n);
    const comma = i === bridgedNew.length - 1 ? '' : ',';
    return '    get ' + n + '(){ return ' + n + '; }' + (info.assigned ? ', set ' + n + '(v){ ' + n + ' = v; }' : '') + comma;
  }),
  '  });',
];
newHtmlLines.splice(recEnd + 1, 0, ...header);
const calIdx = newHtmlLines.findIndex(l => l.trim() === '<script src="js/tabs/calendar/sub-photo-diary.js"></script>');
if (calIdx < 0) throw new Error('sub-photo-diary.js 태그 없음');
newHtmlLines.splice(calIdx + 1, 0, '<script src="js/tabs/calendar/day-detail.js"></script>', '<script src="js/tabs/calendar/natural-schedule.js"></script>', '<script src="js/tabs/calendar/render.js"></script>');
if (!newHtmlLines.some(l => l.trim() === '<script src="js/core/app-scope.js"></script>')) throw new Error('app-scope.js 태그 없음');

fs.writeFileSync(path.join(APP, 'index.html'), newHtmlLines.join(EOL), 'utf8');
for (const [f, arr] of Object.entries(out)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = { scriptHtmlLines: [sLine + 1, eLine], removedGroups: groups.map(g => [g.s, g.e]),
  moved: MOVED_NAMES.map(n => ({ n, kind: declOf(n).isFunctionDeclaration() ? 'function' : 'var', file: FILES[DECL_FILE[n]], lines: [H(declOf(n).node), HE(declOf(n).node)] })),
  imports: IMPORTS, bridged: bridgedSorted.map(n => ({ n, ...bridged.get(n), alreadyExposedBefore: alreadyExposed.has(n) })), newlyExposed: bridgedNew, edits: uniq.length };
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-calendar-meta.json'), JSON.stringify(meta, null, 1));
console.log('edits', uniq.length, 'bridged', bridgedSorted.length, 'newly exposed', bridgedNew.length, 'groups', JSON.stringify(meta.removedGroups));
for (const [f, arr] of Object.entries(out)) console.log(f, arr.length - 1);
