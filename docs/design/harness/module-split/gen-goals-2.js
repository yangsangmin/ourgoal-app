'use strict';
// 목표 탭 이전 2차 생성기(#TASK-ES-375): index.html 인라인 IIFE 의 목표 탭 두 묶음을 글자 그대로 js/tabs/goals/*.js 로 옮긴다.
//   결과 입력 모달: openResultModal(목표·마일스톤·할 일 공용, 목표 상세만 부름) → js/tabs/goals/result-modal.js
//   내보내기·보관: buildGoalSnapshot·goalSnapshotSummary·exportGoalSnapshot·archiveGoal·openGoalCertificateModal → js/tabs/goals/goal-export.js
// 1차 생성기(gen-goals.js, #TASK-ES-370)와 같은 틀이다. 다른 점: 이번 함수들은 모두 800줄 이하라 구간 분할이 없고(함수 통째로 옮김),
// 바로 위 설명 주석(함수 하나만 설명하는 주석·그 묶음만 덮는 구획 주석)은 함수와 같이 옮긴다.
// 이름 참조만 바꾼다: 인라인 IIFE 스코프 이름은 L.<이름>(js/core/app-scope.js 통로), 목표 키트(OurgoalGoalsKit)에 있는 함수는 K.<이름>.
// 손으로 옮기지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-goals-2.js <APP_DIR> [이전 전 index.html]
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
  modal: 'js/tabs/goals/result-modal.js',
  export: 'js/tabs/goals/goal-export.js',
};
// 옮기는 최상위 함수 → 파일. 파일 안 순서 = index.html 원래 순서.
const DECL_FILE = {
  openResultModal: 'modal',
  buildGoalSnapshot: 'export', goalSnapshotSummary: 'export', exportGoalSnapshot: 'export',
  archiveGoal: 'export', openGoalCertificateModal: 'export',
};
const MOVED_NAMES = Object.keys(DECL_FILE);
const MOVED = new Set(MOVED_NAMES);
// 함수와 같이 옮기는 바로 위 주석(정확한 글자). 이 밖의 주석이 함수 바로 위에 있으면 멈춘다.
const LEAD_COMMENT = {
  openResultModal: '/* 목표·마일스톤·할 일 공용 결과 입력 모달 */',
  buildGoalSnapshot: '/* ============ 목표 현황 데이터 내보내기 (AI 분석용) ============ */',
};
// 함수 바로 위에 있지만 index.html 에 남기는 주석(그 구획에 남는 함수가 더 있다: 보관 구획의 restoreGoal)
const KEEP_COMMENT = { archiveGoal: '/* ============ 목표 보관(기록으로 옮기기) ============ */' };

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
// 목표 키트에서 가져온 이름(1차 이음매: var renderGoalsScreen = _goalsKit.renderGoalsScreen) — 옮긴 코드에서는 K.<이름> 으로 부른다
const KIT_IMPORTED = new Set();
for (const s of top) {
  if (!s.isVariableDeclaration()) continue;
  for (const d of s.node.declarations) if (d.init && d.init.type === 'MemberExpression' && d.init.object.type === 'Identifier' && d.init.object.name === '_goalsKit' && d.id.type === 'Identifier') KIT_IMPORTED.add(d.id.name);
}
if (!KIT_IMPORTED.has('renderGoalsScreen')) throw new Error('1차 목표 이음매(_goalsKit.renderGoalsScreen) 없음');

// 재대입·중복 선언 검사, 함수 크기
for (const n of MOVED_NAMES) {
  const b = iScope.getBinding(n);
  if (!b) throw new Error('바인딩 없음 ' + n);
  if (b.constantViolations.length) throw new Error('이전 이름 재대입/중복 선언: ' + n);
  if (!b.path.isFunctionDeclaration()) throw new Error('함수 선언이 아님: ' + n);
}
const movedNodes = MOVED_NAMES.map(n => declOf(n));
const inMoved = l => movedNodes.some(p => l >= H(p.node) && l <= HE(p.node));
// 옮긴 코드 밖에서 부르는 이름 = index.html 이 IIFE 머리에서 가져와야 하는 이름(스코프 분석으로 정한다)
const IMPORTS = [];
const outsideRefs = {};
for (const n of MOVED_NAMES) {
  const outs = iScope.getBinding(n).referencePaths.filter(r => !inMoved(H(r.node)));
  if (outs.length) { IMPORTS.push(n); outsideRefs[n] = outs.map(r => H(r.node)); }
}
// 옮기는 함수 바로 위 줄 검사
const leadOf = {};
for (const n of MOVED_NAMES) {
  const t = lines[H(declOf(n).node) - 2].trim();
  if (LEAD_COMMENT[n]) { if (t !== LEAD_COMMENT[n]) throw new Error('함수 위 주석이 예상과 다름: ' + n + ' ' + t); leadOf[n] = 1; continue; }
  if (KEEP_COMMENT[n]) { if (t !== KEEP_COMMENT[n]) throw new Error('함수 위 구획 주석이 예상과 다름: ' + n + ' ' + t); leadOf[n] = 0; continue; }
  if (t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) throw new Error('함수 위 설명 주석 처리 필요: ' + n + ' ' + t);
  leadOf[n] = 0;
}
// 주석이 함수와 함께 가는 구획(내보내기)은 그 구획이 옮기는 함수만 덮는지 본다: 구획 주석 다음 첫 비어 있지 않은 줄들이 옮기는 세 함수로 이어지고, 그 뒤는 빈 줄 + 다음 구획 주석이어야 한다
{
  const a = H(declOf('buildGoalSnapshot').node), b = HE(declOf('goalSnapshotSummary').node), c = H(declOf('exportGoalSnapshot').node);
  if (HE(declOf('buildGoalSnapshot').node) + 1 !== H(declOf('goalSnapshotSummary').node) || b + 1 !== c) throw new Error('내보내기 세 함수가 붙어 있지 않음');
  const after = HE(declOf('exportGoalSnapshot').node);
  if (lines[after].trim() !== '' || lines[after + 1].trim() !== KEEP_COMMENT.archiveGoal) throw new Error('내보내기 구획 끝 모양이 다름');
  if (a < 0) throw new Error('unreachable');
}

const fileOfLine = l => {
  for (const n of MOVED_NAMES) {
    const f = declOf(n).node;
    if (l >= H(f) && l <= HE(f)) return DECL_FILE[n];
  }
  return null;
};

// 바꿔 쓸 식별자
const edits = [];
const bridged = new Map();
const kitUsed = new Set();
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
      const isWrite = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression();
      let repl;
      if (MOVED.has(nm)) {
        if (DECL_FILE[nm] === here) return;
        if (isWrite) throw new Error('이전 이름에 대입: ' + nm);
        repl = 'K.' + nm;
      } else if (KIT_IMPORTED.has(nm)) {
        if (isWrite) throw new Error('키트 이름에 대입: ' + nm);
        repl = 'K.' + nm; kitUsed.add(nm);
      } else {
        repl = 'L.' + nm;
        if (!bridged.has(nm)) bridged.set(nm, { assigned: false, kind: b.kind });
        if (isWrite) bridged.get(nm).assigned = true;
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
const spanOf = n => [H(declOf(n).node) - leadOf[n], HE(declOf(n).node)];
const declRange = n => range(...spanOf(n));
const lbl = n => H(declOf(n).node) + '~' + HE(declOf(n).node);

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
const namesIn = f => MOVED_NAMES.filter(n => DECL_FILE[n] === f);
const out = {};
out[FILES.modal] = [
  '/**',
  ' * OurGoal Result Modal (목표 탭 — 목표·마일스톤·할 일 공용 결과 입력 모달)',
  ' *',
  ' * #TASK-ES-375 (목표 탭 세포 이전 2차): index.html 인라인 IIFE 의 openResultModal(이전 전 ' + lbl('openResultModal') + '줄)을 동작 그대로 옮겼다.',
  ' * 목표 상세(js/tabs/goals/goal-detail-events.js)의 결과 버튼·마일스톤 행·할 일 결과·보관 전 결과 입력이 L.openResultModal 로 부른다',
  ' * (index.html 이 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져오므로, 1차 이음매의 getter 가 그대로 이 함수를 돌려준다).',
  ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 목표 키트 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
  ' * 선례: 목표 탭 1차 #TASK-ES-370 · 일정 탭 #TASK-ES-360. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md',
  ' */',
  '(function(global) {',
  "  'use strict';",
  ...HEADER_BRIDGE,
  '',
  ...[].concat(...namesIn('modal').map((n, i) => (i ? [''] : []).concat(declRange(n)))),
  '',
  ...FOOT(namesIn('modal')),
];
out[FILES.export] = [
  '/**',
  ' * OurGoal Goal Export & Archive (목표 탭 — AI 분석용 내보내기 · 목표 보관 · 완주 인증서)',
  ' *',
  ' * #TASK-ES-375 (목표 탭 세포 이전 2차): index.html 인라인 IIFE 의 아래 함수들을 동작 그대로 옮겼다.',
  ...namesIn('export').map(n => ' *   ' + n + '(이전 전 ' + lbl(n) + '줄)'),
  ' * 목표 상세(js/tabs/goals/goal-detail-events.js)의 내보내기·전체 내보내기·보관 버튼이 L.exportGoalSnapshot · L.archiveGoal 로 부르고,',
  ' * 보관한 목표가 100% 달성이면 archiveGoal 이 같은 파일의 openGoalCertificateModal 을 부른다.',
  ' * 보관 구획 주석과 되돌리기(restoreGoal — 보관한 목표 목록 renderArchivedGoals 와 js/sanctuary-v3-engine.js 가 씀)는 index.html 에 남겼다. 인증서 그림(generateGoalCertificateImage)은 공유 카드 그림 묶음이라 L 통로로 읽는다.',
  ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 목표 키트 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
  ' */',
  '(function(global) {',
  "  'use strict';",
  ...HEADER_BRIDGE,
  '',
  ...[].concat(...namesIn('export').map((n, i) => {
    // 원래 붙어 있던 함수(내보내기 세 함수)는 붙여 두고, 떨어져 있던 함수 사이에만 빈 줄을 둔다
    const prev = namesIn('export')[i - 1];
    const glued = prev && spanOf(prev)[1] + 1 === spanOf(n)[0];
    return (i && !glued ? [''] : []).concat(declRange(n));
  })),
  '',
  ...FOOT(namesIn('export')),
];

// index.html 새 판: 옮긴 함수(붙어 있던 것은 한 덩어리)를 한 줄 표지 주석으로 바꾼다
const spans = MOVED_NAMES.map(n => [...spanOf(n), n]).sort((a, b) => a[0] - b[0]);
const merged = [];
for (const s of spans) {
  const last = merged[merged.length - 1];
  if (last && last[1] + 1 === s[0] && DECL_FILE[last[2][0]] === DECL_FILE[s[2]]) { last[1] = s[1]; last[2].push(s[2]); }
  else merged.push([s[0], s[1], [s[2]]]);
}
let newHtmlLines = lines.slice();
for (const [a, b, ns] of merged.slice().sort((x, y) => y[0] - x[0])) {
  const mk = '  /* [#TASK-ES-375] ' + ns.join(' · ') + ' → ' + FILES[DECL_FILE[ns[0]]] + ' 로 옮김(목표 탭 세포 2차) */';
  newHtmlLines.splice(a - 1, b - a + 1, mk);
}
// IIFE 머리: 1차 목표 이음매(#TASK-ES-370) 바로 다음에 2차 이음매를 둔다
const g1 = newHtmlLines.findIndex(l => l.includes('[#TASK-ES-370] 목표 탭 모듈 이음매'));
if (g1 < 0) throw new Error('1차 목표 이음매 없음');
let g1End = -1;
for (let i = g1; i < newHtmlLines.length; i++) if (newHtmlLines[i] === '  });') { g1End = i; break; }
if (g1End < 0 || g1End - g1 > 80) throw new Error('1차 목표 expose 끝 못 찾음');
const usIdx0 = newHtmlLines.findIndex((l, i) => i > sLine - 1 && l.includes('"use strict";'));
const alreadyExposed = new Set();
for (let i = usIdx0; i <= g1End; i++) { const re = /get ([A-Za-z_$][\w$]*)\(\)/g; let m; while ((m = re.exec(newHtmlLines[i]))) alreadyExposed.add(m[1]); }
if (!alreadyExposed.size) throw new Error('앞선 노출 목록을 못 읽음');
const bridgedSorted = [...bridged.keys()].sort();
const bridgedNew = bridgedSorted.filter(n => !alreadyExposed.has(n));
for (const n of bridgedSorted) if (alreadyExposed.has(n) && bridged.get(n).assigned && !newHtmlLines.slice(usIdx0, g1End + 1).some(l => l.includes('set ' + n + '(v)'))) throw new Error('대입하는 이름인데 기존 노출에 setter 없음: ' + n);
// 가져오는 이름이 이미 앞선 노출에 getter 로 있으면(1차가 L.openResultModal 등으로 노출) 그 getter 는 그대로 두고, 가져온 var 를 읽게 된다
const header = [
  '',
  '  /* ============ [#TASK-ES-375] 목표 탭 모듈 이음매 2차 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 1차 #TASK-ES-370 과 같은 틀) ============',
  '     ① 가져오기: js/tabs/goals/result-modal.js · goal-export.js 로 옮긴 함수 중 이 스코프에서 부르는 것(위 1차 노출의 getter 포함)을 같은 이름으로 가져온다(전역에 새 이름을 만들지 않는다).',
  '     ② 앱 스코프 통로: 옮긴 코드가 읽는 이 스코프 이름 중 앞선 이음매(설정·기록·일정·목표 1차)가 아직 노출하지 않은 것만 getter 로 더한다(스코프 분석으로 뽑았다). */',
  ...IMPORTS.map(n => '  var ' + n + ' = _goalsKit.' + n + ';'),
];
if (bridgedNew.length) {
  header.push("  window.OurgoalAppScope.expose('index.html', {");
  bridgedNew.forEach((n, i) => {
    const info = bridged.get(n);
    const comma = i === bridgedNew.length - 1 ? '' : ',';
    header.push('    get ' + n + '(){ return ' + n + '; }' + (info.assigned ? ', set ' + n + '(v){ ' + n + ' = v; }' : '') + comma);
  });
  header.push('  });');
}
newHtmlLines.splice(g1End + 1, 0, ...header);
const renderTag = newHtmlLines.findIndex(l => l.trim() === '<script src="js/tabs/goals/render.js"></script>');
if (renderTag < 0) throw new Error('goals/render.js 태그 없음');
if (newHtmlLines[renderTag + 1].trim() !== '<script src="js/tabs/goals/index.js"></script>') throw new Error('goals/index.js 태그 위치 다름');
newHtmlLines.splice(renderTag + 1, 0, '<script src="js/tabs/goals/result-modal.js"></script>', '<script src="js/tabs/goals/goal-export.js"></script>');

fs.writeFileSync(path.join(APP, 'index.html'), newHtmlLines.join(EOL), 'utf8');
for (const [f, arr] of Object.entries(out)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = { scriptHtmlLines: [sLine + 1, eLine],
  moved: MOVED_NAMES.map(n => ({ n, file: FILES[DECL_FILE[n]], lines: [H(declOf(n).node), HE(declOf(n).node)], leadComment: leadOf[n] ? lines[H(declOf(n).node) - 2].trim() : null })),
  markers: merged.map(([a, b, ns]) => ({ names: ns, lines: [a, b] })),
  imports: IMPORTS, outsideRefs, kitUsed: [...kitUsed].sort(),
  bridged: bridgedSorted.map(n => ({ n, ...bridged.get(n), alreadyExposedBefore: alreadyExposed.has(n) })), newlyExposed: bridgedNew, edits: uniq.length };
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-goals-2-meta.json'), JSON.stringify(meta, null, 1));
console.log('edits', uniq.length, 'bridged', bridgedSorted.length, 'newly exposed', bridgedNew.length, 'imports', IMPORTS.join(','), 'kit', [...kitUsed].join(','));
for (const [f, arr] of Object.entries(out)) console.log(f, arr.length - 1);
