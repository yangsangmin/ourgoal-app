'use strict';
// 통계 세포 쪼개기 4차 생성기(#TASK-ES-428): js/universal-stats.js(이전 전 1,614줄 — 1·2·3차 이음매가 있는 판)의 renderUniversalStatsDashboard(884줄)를 나눈다.
// 손으로 옮기지 않는다. 두 단계다.
//  가 단계(같은 파일 안 구획 분할 — 토큰은 그대로, 검사기 verify-stats-split-4.js 가 맞댄다)
//   대시보드 함수 본문의 최상위 문을 구획(섹션)으로 묶는다: 머리(인자 기본값·온톨로지까지) · 빈 화면 if 블록 본문(맨 끝 return 은 조립자에 남김) ·
//   데이터 준비 · 머리 HTML · 렌즈·기간 컨트롤 HTML · 종목 칩·측정 지표 HTML · 차트 HTML · KPI HTML · 진단 리포트·조립·그리기 · 머리 동작 배선 · 컨트롤 동작 배선 · 차트 상호작용 배선.
//   구획끼리(머리 포함) 같이 쓰는 지역 이름(인자·var)은 하나의 문맥 객체 D 의 칸으로 옮긴다 — 그 이름을 쓰는 곳은 모두 D.<이름> 로, 그 이름의 var 선언은 `var ` 만 떼어 대입문으로.
//   한 구획 안에서만 쓰는 지역 이름은 그 구획 함수의 var 로 그대로 남는다. 머리에서 만든 공유 이름(container·allRecs·state·callbacks·ontology)은 조립자가 D 를 만들 때 넣는다.
//   변수 하나를 함수 안 여러 곳이 같은 칸(D.<이름>)으로 읽고 쓰므로 값의 흐름(구획 사이·나중에 불리는 닫힘 함수)이 이전과 같다. 실행 결과는 dashboard-boundary-stats-4.js 가 맞댄다.
//   경계 조건(어기면 멈춤): 구획 경계가 문을 가르지 않음(최상위 문 단위) · 구획 안 return·this·arguments 0(함수 경계 기준) · 공유 var 선언은 모두 초기값이 있는 단독 문(for 머리 아님)·
//   한 선언에 공유·비공유 섞임 0 · 머리에서 온 공유 이름은 구획에서 재대입 0 · 구획 최상위 함수 선언 0 · 이름 D 와 구획 함수 이름이 어디에도 없음.
//  나 단계(이동 — 3차 생성기 gen-stats-split-3.js 와 같은 꼴): 조립자·구획 함수를 js/stats-dashboard*.js 에 글자 그대로 옮기고 이름 참조만 S.(원본 스코프)·K.(다른 통계 세포 파일 함수)로 바꾼다.
//   원본 머리 이음매는 1·2·3차 것을 늘린다(require 줄·가져오기 줄·getter 목록).
// 카탈로그 상수는 옮기지 않는다(원본이 읽힐 때 쓰는 값 — 3차 REQ 4절 B·C, 헌법 CELL_SPLIT_PROOF 2: 공장 함수·지연 조립 금지).
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-stats-split-4.js <APP_DIR> [이전 전 js/universal-stats.js]
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const SRC = process.argv[3] || path.join(APP, 'js', 'universal-stats.js');
const TAG_TASK = '#TASK-ES-428';
const OLD_MARK = /\[#TASK-ES-(392|401|405)\]/;
const CTX = 'D';
const DASH = 'renderUniversalStatsDashboard';
const EMPTY_FN = 'renderStatsEmptyState';
const code0 = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
const lines0 = code0.split('\n');

// 구획: [하위 함수 이름, 첫 문 찾기(선언 이름 또는 글자 머리)]
const SECTIONS = [
  ['prepareStatsDashboardData', { v: 'isExpanded' }],
  ['buildStatsHeaderHtml', { v: 'headerHtml' }],
  ['buildStatsLensControlsHtml', { v: 'periodTabs' }],
  ['buildStatsEntityChipsHtml', { v: 'colors' }],
  ['buildStatsChartHtml', { v: 'chartObj' }],
  ['buildStatsKpiHtml', { v: 'seriesArray' }],
  ['mountStatsDashboardHtml', { v: 'diagReportVisual' }],
  ['bindStatsHeaderActions', { v: 'hdrEl' }],
  ['bindStatsControlActions', { t: "container.querySelectorAll('.u-lens-btn')" }],
  ['bindStatsChartInteractions', { v: 'captureRect' }],
];

// ───────── 가 단계 ─────────
const ast0 = parser.parse(code0, { sourceType: 'script', ranges: true, tokens: true });
let iife0 = null;
traverse(ast0, { FunctionExpression(p) { if (!iife0) iife0 = p; } });
const top0 = iife0.get('body').get('body');
const dash = top0.find(x => x.isFunctionDeclaration() && x.node.id.name === DASH);
if (!dash) throw new Error('대시보드 함수 없음');
if (JSON.stringify(dash.node.params.map(p => p.name)) !== '["container","allRecs","state","callbacks"]') throw new Error('대시보드 인자 꼴 다름');
const dScope = dash.scope;
const body = dash.get('body').get('body');
const iOnt = body.findIndex(s => s.isVariableDeclaration() && s.node.declarations.length === 1 && s.node.declarations[0].id.name === 'ontology');
if (iOnt < 0) throw new Error('ontology 선언 없음');
const emptyIf = body[iOnt + 1];
if (!emptyIf.isIfStatement() || code0.slice(emptyIf.node.test.start, emptyIf.node.test.end) !== 'ontology.length === 0' || emptyIf.node.alternate) throw new Error('빈 화면 if 꼴 다름');
const eBody = emptyIf.node.consequent.body;
const eRet = eBody[eBody.length - 1];
if (eRet.type !== 'ReturnStatement' || eRet.argument) throw new Error('빈 화면 블록 끝이 return; 이 아님');
const eStmts = eBody.slice(0, -1);
const secIdx = SECTIONS.map(([name, a]) => {
  const i = body.findIndex(s => a.v ? (s.isVariableDeclaration() && s.node.declarations[0].id.name === a.v) : code0.slice(s.node.start, s.node.end).startsWith(a.t));
  if (i < 0) throw new Error('구획 첫 문 없음 ' + name);
  return i;
});
if (secIdx[0] !== iOnt + 2) throw new Error('데이터 준비 구획이 빈 화면 if 바로 다음이 아님');
for (let i = 1; i < secIdx.length; i++) if (secIdx[i] <= secIdx[i - 1]) throw new Error('구획 순서 어긋남');
const regions = []; // { name, start, end (문자 위치), stmts }
regions.push({ name: EMPTY_FN, start: eStmts[0].start, end: eStmts[eStmts.length - 1].end, nodes: eStmts });
SECTIONS.forEach(([name], k) => {
  const a = secIdx[k], b = k + 1 < secIdx.length ? secIdx[k + 1] - 1 : body.length - 1;
  const nodes = body.slice(a, b + 1).map(x => x.node);
  regions.push({ name, start: nodes[0].start, end: nodes[nodes.length - 1].end, nodes });
});
// 경계가 문을 가르지 않음: 구획 첫 문은 앞 문과 다른 줄에서 시작하고, 마지막 문은 다음 문과 다른 줄에서 끝난다
const allTop = body.map(x => x.node);
for (const r of regions.slice(1)) {
  const i0 = allTop.indexOf(r.nodes[0]);
  if (allTop[i0 - 1].loc.end.line >= r.nodes[0].loc.start.line) throw new Error('구획 앞 경계가 한 줄 ' + r.name);
}
if (eStmts[0].loc.start.line <= emptyIf.node.loc.start.line || eRet.loc.start.line <= eStmts[eStmts.length - 1].loc.end.line || emptyIf.node.loc.end.line <= eRet.loc.end.line) throw new Error('빈 화면 블록 줄 꼴');
const regionOf = pos => { for (const r of regions) if (pos >= r.start && pos < r.end) return r.name; return 'head'; };
// 이름 충돌
const allNames = new Set();
traverse(ast0, { Identifier(p) { allNames.add(p.node.name); } });
for (const n of [CTX, EMPTY_FN, ...SECTIONS.map(s => s[0])]) if (allNames.has(n)) throw new Error('이름이 이미 있음: ' + n);
// 구획 안 return·this·arguments·최상위 함수 선언
dash.traverse({
  ReturnStatement(p) { if (p.getFunctionParent() === dash && regionOf(p.node.start) !== 'head') throw new Error('구획 안 return ' + regionOf(p.node.start)); },
  ThisExpression(p) { if (p.getFunctionParent() === dash && regionOf(p.node.start) !== 'head') throw new Error('구획 안 this'); },
  Identifier(p) { if (p.node.name === 'arguments' && p.getFunctionParent() === dash && regionOf(p.node.start) !== 'head') throw new Error('구획 안 arguments'); },
  FunctionDeclaration(p) { const b = p.scope.parent && p.scope.parent.getBinding(p.node.id.name); if (b && b.scope === dScope) throw new Error('대시보드 스코프 함수 선언 ' + p.node.id.name); },
});
// 공유 이름 찾기
const shared = new Map(); // name -> { binding, regions, fromHead }
const localOnly = {};
for (const [name, b] of Object.entries(dScope.bindings)) {
  const declPaths = [];
  dash.traverse({ VariableDeclarator(p) { if (p.node.id.type === 'Identifier' && p.node.id.name === name && p.scope.getBinding(name) === b) declPaths.push(p); } });
  const ids = [];
  dash.traverse({ Identifier(p) { if (p.node.name === name && p.scope.getBinding(name) === b) ids.push(p); } });
  const isParam = b.kind === 'param';
  const regs = new Set(ids.map(p => regionOf(p.node.start)));
  if (isParam) regs.add('head');
  if (regs.size < 2) { const r = [...regs][0]; (localOnly[r] = localOnly[r] || []).push(name); continue; }
  const fromHead = regs.has('head');
  if (fromHead) {
    if (!isParam && !declPaths.every(p => regionOf(p.node.start) === 'head')) throw new Error('머리 공유 이름이 구획에서 다시 선언됨 ' + name);
    for (const v of b.constantViolations) if (regionOf(v.node.start) !== 'head') throw new Error('머리 공유 이름이 구획에서 재대입됨 ' + name);
  }
  shared.set(name, { binding: b, regions: [...regs], fromHead, declPaths });
}
// 고치기 목록(문자 위치) — 구획 안에서만
const edits = [];
const isShared = p => { const s = shared.get(p.node.name); return s && p.scope.getBinding(p.node.name) === s.binding; };
dash.traverse({
  Identifier(p) {
    if (regionOf(p.node.start) === 'head') return;
    const par = p.parent;
    if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
    if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
    if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return;
    if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
    if (!isShared(p)) return;
    if (p.parentPath.isObjectProperty() && par.shorthand) { edits.push({ start: par.start, end: par.end, text: p.node.name + ': ' + CTX + '.' + p.node.name }); return; }
    edits.push({ start: p.node.start, end: p.node.end, text: CTX + '.' + p.node.name });
  },
  VariableDeclaration(p) {
    if (regionOf(p.node.start) === 'head') return;
    const flags = p.node.declarations.map(d => d.id.type === 'Identifier' && shared.has(d.id.name) && p.scope.getBinding(d.id.name) === shared.get(d.id.name).binding);
    if (!flags.some(Boolean)) return;
    if (!flags.every(Boolean)) throw new Error('한 선언에 공유·비공유가 섞임 ' + p.node.declarations.map(d => d.id.name).join(','));
    if (p.node.kind !== 'var') throw new Error('var 가 아닌 공유 선언');
    if (!p.parentPath.isBlockStatement() && !p.parentPath.isProgram()) throw new Error('문이 아닌 자리의 공유 선언(for 머리 등) ' + p.node.declarations[0].id.name);
    if (p.node.declarations.some(d => !d.init)) throw new Error('초기값 없는 공유 선언 ' + p.node.declarations[0].id.name);
    edits.push({ start: p.node.start, end: p.node.declarations[0].start, text: '' });
  },
});
const seen0 = new Set();
const edits0 = edits.filter(e => { const k = e.start + ':' + e.end; if (seen0.has(k)) return false; seen0.add(k); return true; }).sort((a, b) => b.start - a.start);
for (let i = 1; i < edits0.length; i++) if (edits0[i].end > edits0[i - 1].start) throw new Error('고치기 겹침');
let ecode = code0;
for (const e of edits0) ecode = ecode.slice(0, e.start) + e.text + ecode.slice(e.end);
const elines = ecode.split('\n');
if (elines.length !== lines0.length) throw new Error('가 단계 줄 수가 바뀜');
// 조립자 + 구획 함수
const L = n => n.loc.start.line, LE = n => n.loc.end.line;
const dStart = L(dash.node), dEnd = LE(dash.node);
const headShared = [...shared.values()].filter(s => s.fromHead).map(s => s.binding.identifier.name);
const headOrder = ['container', 'allRecs', 'state', 'callbacks'].filter(n => headShared.includes(n)).concat(headShared.filter(n => !['container', 'allRecs', 'state', 'callbacks'].includes(n)));
const ontEnd = LE(body[iOnt].node);
const asm = [];
for (let l = dStart; l <= ontEnd; l++) asm.push(lines0[l - 1]);
asm.push('    var ' + CTX + ' = { ' + headOrder.map(n => n + ': ' + n).join(', ') + ' };');
for (let l = ontEnd + 1; l <= L(emptyIf.node); l++) asm.push(lines0[l - 1]);
asm.push('      ' + EMPTY_FN + '(' + CTX + ');');
for (let l = L(eRet); l <= LE(emptyIf.node); l++) asm.push(lines0[l - 1]);
for (const [name] of SECTIONS) asm.push('    ' + name + '(' + CTX + ');');
if (lines0[dEnd - 1] !== '  }') throw new Error('대시보드 닫는 줄 꼴');
asm.push('  }');
const multiLineStringIn = (a, b) => ast0.tokens.some(t => t.start >= a && t.end <= b && t.loc.start.line !== t.loc.end.line && t.type.label !== 'CommentBlock' && (t.type.label === 'string' || t.type.label === 'template' || t.type.label === '`'));
const secFns = [];
{ // 빈 화면 구획(블록 안 — 들여쓰기 2칸 뺌)
  const a = L(emptyIf.node) + 1, b = LE(eStmts[eStmts.length - 1]);
  if (multiLineStringIn(eStmts[0].start, eStmts[eStmts.length - 1].end)) throw new Error('빈 화면 구획 여러 줄 문자열');
  const inner = elines.slice(a - 1, b);
  for (const l of inner) if (l.trim() && !l.startsWith('  ')) throw new Error('빈 화면 들여쓰기 2칸 미만');
  secFns.push(['', '  function ' + EMPTY_FN + '(' + CTX + '){', ...inner.map(l => l ? l.slice(2) : l), '  }']);
}
regions.slice(1).forEach((r, k) => {
  const prevEnd = k === 0 ? LE(emptyIf.node) : LE(regions[k].nodes[regions[k].nodes.length - 1]);
  let a = prevEnd + 1; while (!elines[a - 1].trim()) a++;
  const b = LE(r.nodes[r.nodes.length - 1]);
  secFns.push(['', '  function ' + r.name + '(' + CTX + '){', ...elines.slice(a - 1, b), '  }']);
});
const mid = lines0.slice(0, dStart - 1).concat(asm, ...secFns, lines0.slice(dEnd));
const code = mid.join('\n');
const stageA = { shared: [...shared.entries()].map(([n, s]) => ({ name: n, fromHead: s.fromHead, regions: s.regions })), localOnly, edits: edits0.length, headShared: headOrder };

// ───────── 나 단계 ─────────
const lines = code.split('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });
const CELLS = {
  'js/stats-dashboard.js': ['성취 분석 콕핏 대시보드 조립자 — 머리(온톨로지)·문맥 객체 D·구획 차례 호출, 빈 화면(샘플 바로 불러오기·가져오기), 데이터 준비(렌즈·모드·종목·측정 지표·기간·시계열)', [DASH, EMPTY_FN, 'prepareStatsDashboardData']],
  'js/stats-dashboard-view.js': ['성취 분석 콕핏 화면 글자 — 머리·렌즈·기간 컨트롤·종목 칩·측정 지표·차트·KPI·진단 리포트 HTML 을 만들고 그린다', ['buildStatsHeaderHtml', 'buildStatsLensControlsHtml', 'buildStatsEntityChipsHtml', 'buildStatsChartHtml', 'buildStatsKpiHtml', 'mountStatsDashboardHtml']],
  'js/stats-dashboard-bind.js': ['성취 분석 콕핏 동작 배선 — 접기·데이터 관리·숨은 앵커, 렌즈·분자/분모·모드·기간·스케일·측정 지표·종목 칩, 십자선·툴팁 수정·전체화면', ['bindStatsHeaderActions', 'bindStatsControlActions', 'bindStatsChartInteractions']],
};
const FILE_OF = {};
for (const [f, [, names]] of Object.entries(CELLS)) for (const n of names) FILE_OF[n] = f;
const MOVED_FN = Object.keys(FILE_OF);
const MOVED = new Set(MOVED_FN);
let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const PARAMS = new Set(iife.node.params.map(p => p.name));
if (JSON.stringify([...PARAMS]) !== '["root"]') throw new Error('IIFE 인자가 root 하나가 아님');
const top = iife.get('body').get('body');
const PREV = new Set();
for (const s of top) if (s.isVariableDeclaration()) for (const d of s.node.declarations) {
  const i = d.init;
  if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && i.object.name === '_statsKit' && !i.computed && i.property.name === d.id.name) PREV.add(d.id.name);
}
if (PREV.size !== 35) throw new Error('1·2·3차 가져오기 줄이 35개가 아님: ' + PREV.size);
const S = n => n.loc.start.line, E = n => n.loc.end.line;
const fnStmt = name => { const f = top.find(s => s.isFunctionDeclaration() && s.node.id.name === name); if (!f) throw new Error('함수 없음 ' + name); return f; };
for (const n of MOVED_FN) {
  const b = iScope.getBinding(n);
  if (!b || !b.path.isFunctionDeclaration()) throw new Error('최상위 함수 선언 아님: ' + n);
  if (b.constantViolations.length) throw new Error('이전 함수 재대입/중복 선언: ' + n);
  fnStmt(n).traverse({ Identifier(p) { if ((p.node.name === 'S' || p.node.name === 'K') && p.isReferencedIdentifier()) throw new Error('옮긴 코드에 S/K 이름: ' + n); } });
}
const isCommentLine = t => t.startsWith('/*') || t.startsWith('*') || t.startsWith('//');
const BLOCKS = [];
let blk = null;
for (const s of top) {
  const nm = s.isFunctionDeclaration() ? s.node.id.name : null;
  const f = nm && MOVED.has(nm) ? FILE_OF[nm] : null;
  if (f && blk && blk.file === f) {
    let gapHasPrevMarker = false;
    for (let l = blk.to + 1; l < S(s.node); l++) if (OLD_MARK.test(lines[l - 1])) gapHasPrevMarker = true;
    if (!gapHasPrevMarker) { blk.names.push(nm); blk.to = E(s.node); continue; }
  }
  if (blk) { BLOCKS.push(blk); blk = null; }
  if (f) {
    let from = S(s.node);
    while (from > 1 && lines[from - 2].trim() && isCommentLine(lines[from - 2].trim()) && !OLD_MARK.test(lines[from - 2])) from--;
    blk = { file: f, names: [nm], from, to: E(s.node) };
  }
}
if (blk) BLOCKS.push(blk);
for (const b of BLOCKS) for (let l = b.from; l <= b.to; l++) {
  if (b.names.some(n => l >= S(fnStmt(n).node) && l <= E(fnStmt(n).node))) continue;
  const t = lines[l - 1].trim();
  if (t && !isCommentLine(t)) throw new Error('블록 안 함수 밖 코드 줄 ' + l + ': ' + t);
  if (OLD_MARK.test(t)) throw new Error('블록 안에 이전 안내 주석 ' + l);
}
const fileOfLine = l => { for (const n of MOVED_FN) { const f = fnStmt(n).node; if (l >= S(f) && l <= E(f)) return FILE_OF[n]; } return null; };
const medits = [];
const bridged = new Set();
const kUsed = new Set();
for (const n of MOVED_FN) {
  fnStmt(n).traverse({
    ThisExpression(p) { if (p.getFunctionParent() === fnStmt(n)) throw new Error('옮긴 함수 최상위에서 this 사용: ' + n); },
    Identifier(p) {
      const nm = p.node.name;
      const par = p.parent;
      if (nm === 'arguments' && p.getFunctionParent() === fnStmt(n)) throw new Error('옮긴 함수 최상위에서 arguments 사용: ' + n);
      if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
      if (p.parentPath.isFunctionDeclaration() && par.id === p.node) return;
      const b = p.scope.getBinding(nm);
      if (!b || b.scope !== iScope) return;
      if (PARAMS.has(nm)) return;
      const here = fileOfLine(S(p.node));
      if (!here) throw new Error('파일 미정 줄 ' + S(p.node));
      const asg = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression();
      if (asg) throw new Error('옮긴 코드가 원본 스코프 이름에 대입: ' + nm);
      let rp;
      if (MOVED.has(nm)) {
        if (FILE_OF[nm] === here) return;
        rp = 'K.' + nm; kUsed.add(nm);
      } else if (PREV.has(nm)) {
        rp = 'K.' + nm; kUsed.add(nm);
      } else {
        rp = 'S.' + nm; bridged.add(nm);
      }
      if (p.parentPath.isObjectProperty() && par.shorthand) { medits.push({ start: par.start, end: par.end, text: nm + ': ' + rp }); return; }
      medits.push({ start: p.node.start, end: p.node.end, text: rp });
    }
  });
}
const importNeeded = new Set();
iife.traverse({ Identifier(p) {
  if (!MOVED.has(p.node.name) || !p.isReferencedIdentifier()) return;
  if (fileOfLine(S(p.node))) return;
  const b = p.scope.getBinding(p.node.name); if (b && b.scope === iScope) importNeeded.add(p.node.name);
} });
const seen = new Set();
const uniq = medits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.start - a.start);
let newCode = code;
for (const e of uniq) newCode = newCode.slice(0, e.start) + e.text + newCode.slice(e.end);
const newLines = newCode.split('\n');
if (newLines.length !== lines.length) throw new Error('줄 수가 바뀜');
const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(newLines[l - 1]); return o; };
const HEADER_BRIDGE = [
  "  // S = js/universal-stats.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·값(pad·METRIC_CONFIGS·askConfirm …)을 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.",
  "  // K = 통계 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).",
  '  var K = root.OurgoalUniversalStatsKit = root.OurgoalUniversalStatsKit || {};',
  '  var S = K.scope = K.scope || {};',
];
const HOW = {
  'js/stats-dashboard.js': [' * 조립자 renderUniversalStatsDashboard 는 이전 함수의 머리(인자 기본값·온톨로지)를 글자 그대로 두고, 공유 지역 이름을 담을 문맥 객체 D 를 만든 뒤',
    ' * 이전 함수 본문의 구획을 원래 순서로 부른다(빈 화면이면 빈 화면 구획 뒤 return — 이전과 같음).'],
  'js/stats-dashboard-view.js': [], 'js/stats-dashboard-bind.js': [],
};
const out = {};
for (const [f, [role, names]] of Object.entries(CELLS)) {
  const bl = BLOCKS.filter(b => b.file === f);
  const got = bl.flatMap(b => b.names);
  if (JSON.stringify(got.slice().sort()) !== JSON.stringify(names.slice().sort())) throw new Error('블록 함수 목록 다름 ' + f + ': ' + got.join(','));
  out[f] = [
    '/**',
    ' * OurGoal Stats Cell: ' + role + ' (' + TAG_TASK + ' · 통계 세포 쪼개기 4차)',
    ' *',
    ' * js/universal-stats.js(이전 전 1,614줄)의 renderUniversalStatsDashboard(884줄)에서 동작 그대로 옮겼다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md 2절(섹션 소블록)',
    ' *   ' + names.join(' · '),
    ...HOW[f],
    ' * 구획 함수는 이전 함수 본문의 최상위 문 묶음을 글자 그대로 옮긴 것이다. 구획끼리 같이 쓰던 지역 이름(인자·var)은 문맥 객체 D 의 칸(D.<이름>)으로 읽고 쓴다',
    ' * (그 이름의 var 선언은 `var ` 만 떼어 대입문이 됨). 한 구획에서만 쓰던 지역 이름은 그 구획의 var 로 그대로다.',
    ' * 바꾼 것은 이름 참조뿐이다 — D.<공유 지역 이름>, 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
    ' */',
    '(function(root) {',
    "  'use strict';",
    ...HEADER_BRIDGE,
    '',
    ...bl.flatMap((b, i) => [...(i ? [''] : []), ...range(b.from, b.to)]),
    '',
    ...names.map(n => '  K.' + n + ' = ' + n + ';'),
    '',
    "  if (typeof module !== 'undefined' && module.exports) {",
    '    module.exports = K;',
    '  }',
    "})(typeof window !== 'undefined' ? window : global);",
    '',
  ];
}
const removed = new Set();
const markerAt = new Map();
for (const b of BLOCKS) {
  for (let l = b.from; l <= b.to; l++) removed.add(l);
  if (lines[b.to] !== undefined && lines[b.to].trim() === '') removed.add(b.to + 1);
  if (b.file !== 'js/stats-dashboard.js') continue; // 구획 함수 묶음은 이전 전에 없던 함수라 안내 주석 없이 지운다
  markerAt.set(b.from, '  /* [' + TAG_TASK + '] renderUniversalStatsDashboard → js/stats-dashboard.js(조립자) · js/stats-dashboard-view.js · js/stats-dashboard-bind.js 로 구획 함수와 함께 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */');
}
const mainOut = [];
for (let l = 1; l <= lines.length; l++) {
  if (markerAt.has(l)) mainOut.push(markerAt.get(l), '');
  if (!removed.has(l)) mainOut.push(lines[l - 1]);
}
const NEW_FILES = Object.keys(CELLS);
const reqIdx = mainOut.findIndex(l => l.startsWith("  if(!_statsKit && typeof require === 'function'){ require('./stats-taxonomy.js');"));
if (reqIdx < 0 || reqIdx > 40) throw new Error('require 줄 없음');
mainOut[reqIdx] = mainOut[reqIdx].replace(' _statsKit = root.OurgoalUniversalStatsKit; }', ' ' + NEW_FILES.map(f => "require('./" + path.basename(f) + "');").join(' ') + ' _statsKit = root.OurgoalUniversalStatsKit; }');
const noteIdx = mainOut.findIndex(l => l.includes('[#TASK-ES-405] 3차:'));
if (noteIdx < 0 || noteIdx > reqIdx) throw new Error('3차 이음매 주석 없음');
mainOut.splice(noteIdx + 1, 0, '     [' + TAG_TASK + '] 4차: ' + NEW_FILES.join(' · ') + ' 도 같은 이음매로 가져온다(대시보드 조립자·구획 함수 — 공유 지역 이름은 문맥 객체 D 로 넘김). */');
mainOut[noteIdx] = mainOut[noteIdx].replace(/ \*\/$/, '');
let lastImp = -1;
for (let i = 0; i < 80; i++) if (/^  var (\w+) = _statsKit\.\1;$/.test(mainOut[i])) lastImp = i;
if (lastImp < 0) throw new Error('가져오기 줄 없음');
const IMPORTS = MOVED_FN.filter(n => importNeeded.has(n));
mainOut.splice(lastImp + 1, 0, ...IMPORTS.map(n => '  var ' + n + ' = _statsKit.' + n + ';'));
const gStart = mainOut.findIndex(l => l.startsWith('  Object.defineProperties(_statsKit.scope || (_statsKit.scope = {}), Object.getOwnPropertyDescriptors({'));
let gEnd = gStart + 1; while (mainOut[gEnd] !== '  }));') gEnd++;
const prevGetters = mainOut.slice(gStart + 1, gEnd).map(l => /get (\w+)\(\)/.exec(l)[1]);
const allGetters = [...new Set([...prevGetters, ...bridged])].sort();
mainOut.splice(gStart + 1, gEnd - gStart - 1, ...allGetters.map((n, i) => '    get ' + n + '(){ return ' + n + '; }' + (i === allGetters.length - 1 ? '' : ',')));

const htmlPath = path.join(APP, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const TAG = '<script src="js/universal-stats.js?v=20260914-es061d"></script>';
if (html.split(TAG).length !== 2) throw new Error('원본 script 태그가 1개가 아님');
const NEW_TAGS = NEW_FILES.map(f => '<script src="' + f + '?v=20261005-es428"></script>').join('');
if (!html.includes(NEW_TAGS)) fs.writeFileSync(htmlPath, html.replace(TAG, NEW_TAGS + TAG), 'utf8');

fs.writeFileSync(path.join(APP, 'js', 'universal-stats.js'), mainOut.join('\n'), 'utf8');
for (const [f, arr] of Object.entries(out)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = { stageA, blocks: BLOCKS, imports: IMPORTS, prevMovedCount: PREV.size, bridgedNew: [...bridged].filter(n => !prevGetters.includes(n)).sort(), getters: allGetters, kUsed: [...kUsed].sort(), edits: uniq.length, mainLines: mainOut.length - (mainOut[mainOut.length - 1] === '' ? 1 : 0) };
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-stats-split-4-meta.json'), JSON.stringify(meta, null, 1));
console.log('shared(D)', stageA.shared.length, stageA.shared.map(s => s.name).join(','), '| head', headOrder.join(','), '| 가 edits', edits0.length);
console.log('나 edits', uniq.length, 'bridged(new)', meta.bridgedNew.join(','), '| imports', IMPORTS.join(','), '| K', [...kUsed].sort().join(','));
console.log('js/universal-stats.js', lines0.length - 1, '->', mainOut.length - 1);
for (const [f, arr] of Object.entries(out)) console.log(f, arr.length - 1);
