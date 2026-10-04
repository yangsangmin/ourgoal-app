'use strict';
// 기록 탭 이전 생성기(#TASK-ES-358): index.html 의 기록 탭 렌더 코드를 글자 그대로 js/tabs/records/*.js 로 옮기고,
// 인라인 IIFE 스코프 이름은 L.<이름>(js/core/app-scope.js 통로), 다른 기록 파일로 간 이전 함수는 K.<이름>(기록 키트)으로만 바꾼다.
// 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md(#TASK-ES-354, 설정 시범). 손으로 옮기지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-records.js <APP_DIR> [이전 전 index.html]
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
  period: 'js/tabs/records/period-ai-card.js',
  render: 'js/tabs/records/render.js',
};
// 함수 → 옮겨 갈 파일
const DECL_FILE = {
  initPeriodAiCard: 'period', generatePeriodAIFeedback: 'period', generateLocalPeriodFeedback: 'period', renderPeriodFeedbackResult: 'period',
  setRecordsSegment: 'render', setRecordsSlide: 'render', renderRecordsScreen: 'render',
};
const MOVED_FN = Object.keys(DECL_FILE);
const MOVED = new Set(MOVED_FN);
// index.html 이 IIFE 맨 위에서 같은 이름으로 가져오는 것(옮긴 코드 밖에서 부르는 함수)
const IMPORTS = ['renderRecordsScreen', 'setRecordsSegment', 'setRecordsSlide'];

let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const top = iife.get('body').get('body');
const H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off;
const fnNode = name => { const f = top.find(s => s.isFunctionDeclaration() && s.node.id.name === name); if (!f) throw new Error('함수 없음 ' + name); return f; };

// 중복 선언·재대입 검사(있으면 옮기면 뜻이 바뀐다)
for (const n of MOVED_FN) {
  const b = iScope.getBinding(n);
  if (!b || b.constantViolations.length) throw new Error('이전 함수 재대입/중복 선언: ' + n);
}
// 지우는 구간: 기간별 AI 피드백 카드 머리 주석 ~ renderRecordsScreen 끝
const D_S = H(fnNode('initPeriodAiCard').node) - 1;
if (!lines[D_S - 1].includes('기간별 기록 AI 피드백 카드')) throw new Error('머리 주석 위치 다름: ' + lines[D_S - 1]);
const D_E = HE(fnNode('renderRecordsScreen').node);
// 구간 안에 남기는 문: window.purgeSampleRecordsOneClick = … (IIFE 실행 중 대입되는 문 — 원래 자리에 그대로 둔다)
const movedNodes = new Set(MOVED_FN.map(n => fnNode(n).node));
const keepStmts = [];
for (const s of top) {
  const l = H(s.node);
  if (l < D_S || l > D_E) continue;
  if (movedNodes.has(s.node)) continue;
  if (s.isExpressionStatement() && /^\s*window\.purgeSampleRecordsOneClick\s*=/.test(lines[l - 1])) { keepStmts.push(s); continue; }
  throw new Error('지우는 구간에 예상 밖 문: ' + l + ' ' + lines[l - 1].trim().slice(0, 80));
}
if (keepStmts.length !== 1) throw new Error('남길 문(purgeSampleRecordsOneClick) 수: ' + keepStmts.length);
const KEEP_S = H(keepStmts[0].node) - (/^\s*\/\/ \[TASK-ES-245\]/.test(lines[H(keepStmts[0].node) - 2]) ? 1 : 0);
const KEEP_E = HE(keepStmts[0].node);

const fileOfLine = l => {
  for (const n of MOVED_FN) { const f = fnNode(n).node; if (l >= H(f) && l <= HE(f)) return DECL_FILE[n]; }
  return null;
};

// 바꿔 쓸 식별자
const edits = [];
const bridged = new Map();
for (const n of MOVED_FN) {
  fnNode(n).traverse({
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
        if ((p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression()) throw new Error('이전 함수에 대입: ' + nm);
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
const fnRange = name => range(H(fnNode(name).node), HE(fnNode(name).node));
// 함수 바로 위의 설명 주석 줄(한 줄짜리)도 함께 옮긴다
const leadComment = name => { const l = H(fnNode(name).node) - 1; const t = lines[l - 1].trim(); return (t.startsWith('/*') && t.endsWith('*/')) || t.startsWith('//') ? [NL(l)] : []; };

const HEADER_BRIDGE = [
  "  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.",
  "  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};",
  "  // 기록 키트: 기록 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)",
  "  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};",
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
const periodFns = ['initPeriodAiCard', 'generatePeriodAIFeedback', 'generateLocalPeriodFeedback', 'renderPeriodFeedbackResult'];
const out = {};
out[FILES.period] = [
  '/**',
  ' * OurGoal Records: Period AI Feedback Card (기록 탭 기간별 기록 AI 피드백 카드)',
  ' *',
  ' * #TASK-ES-358 (기록 탭 세포 이전): index.html 인라인 IIFE 의 기간별 AI 피드백 카드 코드(이전 전 ' + D_S + '~' + HE(fnNode('renderPeriodFeedbackResult').node) + '줄)를 동작 그대로 옮겼다.',
  ' *   initPeriodAiCard · generatePeriodAIFeedback · generateLocalPeriodFeedback · renderPeriodFeedbackResult',
  ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
  ' * renderRecordsScreen(js/tabs/records/render.js)이 K.initPeriodAiCard 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md',
  ' */',
  '(function(global) {',
  "  'use strict';",
  ...HEADER_BRIDGE,
  '',
  NL(D_S),
  ...periodFns.flatMap((n, i) => [...(i === 0 ? [] : leadComment(n)), ...fnRange(n), '']),
  ...FOOT(periodFns),
];
const renderFns = ['setRecordsSegment', 'setRecordsSlide', 'renderRecordsScreen'];
out[FILES.render] = [
  '/**',
  ' * OurGoal Records Screen Renderer (기록 탭 화면 렌더)',
  ' *',
  ' * #TASK-ES-358 (기록 탭 세포 이전): index.html 인라인 IIFE 에 있던 기록 탭 렌더 코드를 동작 그대로 옮겼다.',
  ' *   setRecordsSegment(세그먼트 전환) · setRecordsSlide(지표 캐러셀) · renderRecordsScreen(기록 화면 전체 렌더)',
  ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 기록 파일 함수는 K.<이름>. 버그도 그대로 옮겼다.',
  ' * index.html 은 IIFE 맨 위에서 이 키트(OurgoalRecordsKit)의 함수를 같은 이름으로 가져와 부른다 — 호출하는 쪽 수십 곳은 그대로다.',
  ' * window.renderRecordsScreen 노출은 이전 전과 같은 자리(index.html)에 그대로 있다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md',
  ' */',
  '(function(global) {',
  "  'use strict';",
  ...HEADER_BRIDGE,
  '',
  ...renderFns.flatMap(n => [...leadComment(n), ...fnRange(n), '']),
  ...FOOT(renderFns),
];
// 옮긴 함수의 설명 주석 줄도 지우는 구간 안에 있는지
for (const n of renderFns.concat(periodFns.slice(1))) {
  const lc = leadComment(n);
  if (lc.length && (H(fnNode(n).node) - 1 < D_S)) throw new Error('주석 줄이 구간 밖: ' + n);
}

// index.html 새 판
const replacement = [
  '  /* ============ [#TASK-ES-358] 기록 탭 렌더 → js/tabs/records/period-ai-card.js · render.js 로 옮김 ============',
  '     initPeriodAiCard · generatePeriodAIFeedback · generateLocalPeriodFeedback · renderPeriodFeedbackResult · setRecordsSegment · setRecordsSlide · renderRecordsScreen.',
  '     renderRecordsScreen·setRecordsSegment·setRecordsSlide 는 이 IIFE 맨 위에서 같은 이름으로 가져온다. 아래 window 대입 문은 이전 전과 같은 자리에 둔다. */',
  ...lines.slice(KEEP_S - 1, KEEP_E),
];
const newHtmlLines = [...lines.slice(0, D_S - 1), ...replacement, ...lines.slice(D_E)];
const usIdx = newHtmlLines.findIndex((l, i) => i > sLine - 1 && l.includes('"use strict";'));
const bridgedSorted = [...bridged.keys()].sort();
const header = [
  '',
  '  /* ============ [#TASK-ES-358] 기록 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) ============',
  '     ① 가져오기: js/tabs/records/render.js 로 옮긴 함수를 이 스코프에서 같은 이름으로 부른다(전역에 새 이름을 만들지 않는다).',
  '     ② 앱 스코프 통로: 옮긴 코드가 읽는 이 스코프의 공용 상태·함수를 window.OurgoalAppScope.scope 한 곳에만 getter 로 노출한다(목록은 스코프 분석으로 뽑았다 — 옮긴 코드가 실제로 쓰는 이름만). */',
  '  var _recordsKit = window.OurgoalRecordsKit;',
  ...IMPORTS.map(n => '  var ' + n + ' = _recordsKit.' + n + ';'),
  "  window.OurgoalAppScope.expose('index.html', {",
  ...bridgedSorted.map((n, i) => {
    const info = bridged.get(n);
    const comma = i === bridgedSorted.length - 1 ? '' : ',';
    return '    get ' + n + '(){ return ' + n + '; }' + (info.assigned ? ', set ' + n + '(v){ ' + n + ' = v; }' : '') + comma;
  }),
  '  });',
];
newHtmlLines.splice(usIdx + 1, 0, ...header);
const storeIdx = newHtmlLines.findIndex(l => l.trim() === '<script src="js/core/store.js"></script>');
if (storeIdx < 0) throw new Error('store.js 태그 없음');
if (!newHtmlLines.some(l => l.trim() === '<script src="js/core/app-scope.js"></script>')) newHtmlLines.splice(storeIdx + 1, 0, '<script src="js/core/app-scope.js"></script>');
const retroIdx = newHtmlLines.findIndex(l => l.trim() === '<script src="js/tabs/records/sub-retrospect.js"></script>');
if (retroIdx < 0) throw new Error('sub-retrospect.js 태그 없음');
newHtmlLines.splice(retroIdx + 1, 0, '<script src="js/tabs/records/period-ai-card.js"></script>', '<script src="js/tabs/records/render.js"></script>');

fs.writeFileSync(path.join(APP, 'index.html'), newHtmlLines.join(EOL), 'utf8');
for (const [f, arr] of Object.entries(out)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = { scriptHtmlLines: [sLine + 1, eLine], removedHtmlRange: [D_S, D_E], keptInPlace: [KEEP_S, KEEP_E],
  moved: MOVED_FN.map(n => ({ n, file: FILES[DECL_FILE[n]], lines: [H(fnNode(n).node), HE(fnNode(n).node)] })),
  imports: IMPORTS, bridged: bridgedSorted.map(n => ({ n, ...bridged.get(n) })), edits: uniq.length };
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-records-meta.json'), JSON.stringify(meta, null, 1));
console.log('edits', uniq.length, 'bridged', bridgedSorted.length, 'removed html lines', D_S, '~', D_E, 'kept', KEEP_S, '~', KEEP_E);
for (const [f, arr] of Object.entries(out)) console.log(f, arr.length - 1);
