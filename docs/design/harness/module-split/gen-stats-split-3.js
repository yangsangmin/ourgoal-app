'use strict';
// 통계 세포 쪼개기 3차 생성기(#TASK-ES-405): js/universal-stats.js(이전 전 3,283줄 — 1차 #TASK-ES-392·2차 #TASK-ES-401 이음매가 있는 판)를 더 나눈다.
// 손으로 옮기지 않는다. 두 단계다.
//  가 단계(글자 변형 — 토큰은 그대로, 검사기 verify-stats-split-3.js 가 맞댄다)
//   ① 카탈로그 상수(METRIC_CONFIGS·SAMPLE_THEMES·THEME_METRIC_SPECS·RAW_52W_POWERLIFTING_DATA·DOMAINS·METRIC_DIFFERENTIATED_MODELS)는 옮기지 않는다.
//      원본이 읽힐 때 바로 그 값을 쓴다(공개 API 객체·별칭 줄) — 공장 함수로 옮기면 원본 혼자 읽힐 때(법정 모듈 로드 탐침 court/probes/module-load.js 는 파일마다 따로 돌린다)
//      공장이 없어 원본이 멈춘다(실측: TypeError createMetricConfigs is not a function). 그래서 원본에 두고 부품은 S.<이름> getter 로 같은 객체를 읽는다(2차와 같음).
//   ② generateDomainSample(970줄) 구획 분할: if/else-if 사슬 중 큰 도메인 구획 6개(hyrox·running·big3·study·coding·sales)의 블록 본문을 하위 함수로 떼고
//      그 자리에는 하위 함수 호출 한 줄을 둔다. 공유 변수(domainKey·now·records — 재대입 0)는 인자로 넘긴다. 틀 2절 경계 조건을 정적으로 검사한다:
//      문을 가르지 않음(블록 본문 줄 전체) · 구획의 지역 var 는 그 구획 안에서만 선언·사용(사슬 조건식·꼬리·다른 떼는 구획에서 안 씀 — 구획끼리는 한 번에 하나만 돈다)
//      · 구획 안 return·this·arguments·바깥 break/continue 0 · 공유 변수 재대입 0. 실행 결과는 sample-boundary-stats-3.js 가 모든 도메인 키로 맞댄다.
//  나 단계(이동 — 2차 생성기 gen-stats-split-2.js 와 같은 꼴): 함수 단위로 js/stats-*.js 에 글자 그대로 옮기고 이름 참조만 S.(원본 스코프)·K.(다른 통계 세포 파일 함수)로 바꾼다.
//   원본 머리 이음매는 1·2차 것을 늘린다(require 줄·가져오기 줄·getter 목록). 1·2차 getter 는 그대로 둔다 — 이번에 옮긴 함수(getChosung 등)를 1차 부품이 S. 로 읽으므로
//   getter 가 가져온 같은 이름(var X = _statsKit.X)을 돌려준다. 1·2차 부품 글자 변경 0.
// renderUniversalStatsDashboard(884줄)는 이번에 손대지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-stats-split-3.js <APP_DIR> [이전 전 js/universal-stats.js]
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const SRC = process.argv[3] || path.join(APP, 'js', 'universal-stats.js');
const TAG_TASK = '#TASK-ES-405';
const OLD_MARK = /\[#TASK-ES-(392|401)\]/;
const code0 = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
const lines0 = code0.split('\n');

const SECTIONS = [
  ['hyrox', 'pushHyroxSample'],
  ['running', 'pushRunningSample'],
  ['big3', 'pushBig3Sample'],
  ['study', 'pushStudySample'],
  ['coding', 'pushCodingSample'],
  ['sales', 'pushSalesSample'],
];
const SHARED = ['domainKey', 'now', 'records'];

// ───────── 가 단계 ─────────
const ast0 = parser.parse(code0, { sourceType: 'script', ranges: true, tokens: true });
let iife0 = null;
traverse(ast0, { FunctionExpression(p) { if (!iife0) iife0 = p; } });
const top0 = iife0.get('body').get('body');
const multiLineStringIn = (a, b) => ast0.tokens.some(t => t.start >= a && t.end <= b && t.loc.start.line !== t.loc.end.line && t.type.label !== 'CommentBlock' && (t.type.label === 'string' || t.type.label === 'template' || t.type.label === '`'));
const repl = []; // { from, to, lines } — 원본 줄 from..to 를 lines 로 바꾼다

const gds = top0.find(x => x.isFunctionDeclaration() && x.node.id.name === 'generateDomainSample');
const fnScope = gds.scope;
if (JSON.stringify(gds.node.params.map(p => p.name)) !== '["domainKey"]') throw new Error('generateDomainSample 인자 꼴 다름');
const gBody = gds.get('body').get('body');
const ifs = gBody.filter(x => x.isIfStatement());
if (ifs.length !== 1) throw new Error('최상위 if 사슬이 1개가 아님');
for (const n of SHARED) {
  const b = fnScope.getBinding(n);
  if (!b || b.scope !== fnScope) throw new Error('공유 변수 없음 ' + n);
  if (b.constantViolations.length) throw new Error('공유 변수 재대입 ' + n);
}
// 사슬을 걸으며 구획을 찾는다
const sectionPaths = {};
let cur = ifs[0];
const chainKeys = [];
while (cur && cur.isIfStatement()) {
  const t = cur.node.test;
  const key = (t.type === 'BinaryExpression' && t.operator === '===' && t.left.type === 'Identifier' && t.left.name === 'domainKey' && t.right.type === 'StringLiteral') ? t.right.value : null;
  chainKeys.push(key);
  if (key && SECTIONS.some(([k]) => k === key)) sectionPaths[key] = cur.get('consequent');
  cur = cur.node.alternate ? cur.get('alternate') : null;
}
for (const [k] of SECTIONS) if (!sectionPaths[k]) throw new Error('구획 없음 ' + k);
const inRange = (node, blk) => node.start >= blk.start && node.end <= blk.end;
const secOf = node => { for (const [k] of SECTIONS) if (inRange(node, sectionPaths[k].node)) return k; return null; };
// 사슬의 모든 갈래(조건이 참일 때 블록, 마지막 else) — 갈래끼리는 한 번 부를 때 하나만 돈다
const branches = [];
{ let c = ifs[0], i = 0; while (c) { if (c.isIfStatement()) { branches.push({ label: chainKeys[i] || ('#' + i), node: c.node.consequent }); i++; c = c.node.alternate ? c.get('alternate') : null; } else { branches.push({ label: '<else>', node: c.node }); c = null; } } }
const regionOf = node => { for (const br of branches) if (inRange(node, br.node)) return br.label; return '<밖>'; };
// 함수 스코프 지역 이름(공유 3개 말고): 떼는 구획에서 쓰이면 ⓐ 사슬 조건식·머리·꼬리(<밖>)에서 안 쓰이고 ⓑ 그 이름을 쓰는 갈래마다(떼는 구획·남는 갈래 모두) 그 갈래 안에 선언이 있어야 한다
// (갈래끼리 같은 var 를 선언해 쓰는 것은 한 번에 한 갈래만 돌아 값이 오가지 않는다 — 다른 갈래의 var 끌어올림에 기대는 갈래가 있으면 멈춘다)
const boundary = { localsPerSection: {}, sharedPerSection: {} };
for (const [name, b] of Object.entries(fnScope.bindings)) {
  if (SHARED.includes(name)) continue;
  const declPaths = [];
  gds.traverse({ VariableDeclarator(p) { if (p.node.id.type === 'Identifier' && p.node.id.name === name && p.scope.getBinding(name) === b) declPaths.push(p); } });
  const allPaths = [b.path, ...b.referencePaths, ...b.constantViolations, ...declPaths];
  const secs = [...new Set(allPaths.map(p => secOf(p.node)).filter(Boolean))];
  if (!secs.length) continue;
  const regions = [...new Set(allPaths.map(p => regionOf(p.node)))];
  if (regions.includes('<밖>')) throw new Error('구획 지역 변수가 사슬 밖에서도 쓰임: ' + name);
  for (const r of regions) if (!declPaths.some(p => regionOf(p.node) === r)) throw new Error('갈래 ' + r + ' 이 선언하지 않은 지역 변수를 씀: ' + name);
  for (const s of secs) (boundary.localsPerSection[s] = boundary.localsPerSection[s] || []).push(name);
}
for (const [key, fnName] of SECTIONS) {
  const blk = sectionPaths[key];
  if (!blk.isBlockStatement() || !blk.node.body.length) throw new Error('구획 블록 꼴 ' + key);
  if (fnScope.getBinding(fnName) || iife0.scope.getBinding(fnName)) throw new Error('하위 함수 이름 충돌 ' + fnName);
  const used = new Set();
  blk.traverse({
    ReturnStatement(p) { if (p.getFunctionParent() === gds) throw new Error('구획 안 return ' + key); },
    ThisExpression(p) { if (p.getFunctionParent() === gds) throw new Error('구획 안 this ' + key); },
    Identifier(p) {
      if (p.node.name === 'arguments' && p.getFunctionParent() === gds) throw new Error('구획 안 arguments ' + key);
      if (!p.isReferencedIdentifier()) return;
      const b = p.scope.getBinding(p.node.name);
      if (b && b.scope === fnScope && SHARED.includes(p.node.name)) used.add(p.node.name);
    },
    'BreakStatement|ContinueStatement'(p) {
      if (p.node.label) { let q = p.parentPath, found = false; while (q && q !== blk) { if (q.isLabeledStatement() && q.node.label.name === p.node.label.name) found = true; q = q.parentPath; } if (!found) throw new Error('구획 밖 라벨 ' + key); return; }
      let q = p.parentPath, ok = false;
      while (q && q !== blk) { if (q.isLoop() || (p.isBreakStatement() && q.isSwitchStatement())) { ok = true; break; } if (q.isFunction()) { ok = true; break; } q = q.parentPath; }
      if (!ok) throw new Error('구획 밖 break/continue ' + key);
    },
  });
  const args = SHARED.filter(n => used.has(n));
  boundary.sharedPerSection[key] = args;
  const BS = blk.node.loc.start.line, BE = blk.node.loc.end.line;
  if (!lines0[BS - 1].trimEnd().endsWith('{') || lines0[BS - 1].indexOf('{', blk.node.loc.start.column) !== blk.node.loc.start.column) throw new Error('블록 여는 줄 꼴 ' + key);
  if (lines0[BE - 1].slice(0, blk.node.loc.end.column - 1).trim() !== '') throw new Error('블록 닫는 줄 꼴 ' + key);
  const first = blk.node.body[0].loc.start.line, last = blk.node.body[blk.node.body.length - 1].loc.end.line;
  if (first <= BS || last >= BE) throw new Error('블록 본문이 여닫는 줄과 같은 줄 ' + key);
  if (multiLineStringIn(blk.node.start, blk.node.end)) throw new Error('여러 줄 문자열 — 들여쓰기 못 바꿈 ' + key);
  const inner = lines0.slice(BS, BE - 1); // BS+1 .. BE-1
  const ind = /^\s*/.exec(lines0[first - 1])[0];
  for (const l of inner) if (l.trim() && !l.startsWith('  ')) throw new Error('들여쓰기 2칸 미만 ' + key);
  repl.push({ from: BS + 1, to: BE - 1, lines: [ind + fnName + '(' + args.join(', ') + ');'], kind: 'section-call', key, fnName });
  repl.push({ after: gds.node.loc.end.line, order: SECTIONS.findIndex(x => x[0] === key), lines: ['', '  function ' + fnName + '(' + args.join(', ') + '){', ...inner.map(l => l ? l.slice(2) : l), '  }'], kind: 'section-fn', key, fnName });
}
// 줄 바꾸기 적용(아래에서 위로)
const mid = lines0.slice();
const afterIns = repl.filter(r => r.after).sort((a, b) => a.order - b.order);
const spans = repl.filter(r => !r.after).sort((a, b) => b.from - a.from);
const insAt = gds.node.loc.end.line;
if (spans.some(r => r.from <= insAt && r.to >= insAt)) throw new Error('삽입 자리가 바뀌는 줄 안');
// 삽입이 바꾸는 줄보다 위·아래 어디든 줄 번호가 엇갈리지 않게: 큰 줄 번호부터 처리하되 삽입은 그 줄 번호 차례에 넣는다
const ops = spans.map(r => ({ at: r.from, run: () => mid.splice(r.from - 1, r.to - r.from + 1, ...r.lines) }))
  .concat([{ at: insAt + 0.5, run: () => mid.splice(insAt, 0, ...afterIns.flatMap(r => r.lines)) }])
  .sort((a, b) => b.at - a.at);
for (const o of ops) o.run();
const code = mid.join('\n');

// ───────── 나 단계 ─────────
const lines = code.split('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });
const CELLS = {
  'js/stats-samples.js': ['샘플 생성 — 도메인별 1년치 샘플(조립자: 작은 구획은 그대로, 큰 구획 6개는 하위 함수 호출)·52주 파워리프팅·1920년대 역도 샘플(generateDomainSample · generate52WeekPowerliftingSample · generate1920sOlympicStrengthSample)', ['generateDomainSample', 'generate52WeekPowerliftingSample', 'generate1920sOlympicStrengthSample']],
  'js/stats-sample-fitness.js': ['도메인 샘플 구획 — 운동(하이록스·러닝·3대운동) 1년치 기록 생성(pushHyroxSample · pushRunningSample · pushBig3Sample)', ['pushHyroxSample', 'pushRunningSample', 'pushBig3Sample']],
  'js/stats-sample-growth.js': ['도메인 샘플 구획 — 성장(공부·코딩·영업) 1년치 기록 생성(pushStudySample · pushCodingSample · pushSalesSample)', ['pushStudySample', 'pushCodingSample', 'pushSalesSample']],
  'js/stats-ontology.js': ['온톨로지 — 초성 추출·검색 일치·도메인 추론·범용 온톨로지 구축(getChosung · matchQuery · inferDomainKey · buildUniversalOntology)', ['getChosung', 'matchQuery', 'inferDomainKey', 'buildUniversalOntology']],
  'js/stats-export.js': ['내보내기 — 정제 CSV 내보내기·차트 스냅샷(exportCleanCsv · captureChartSnapshot)', ['exportCleanCsv', 'captureChartSnapshot']],
  'js/stats-fullscreen.js': ['성취통계 전체화면(가로) 뷰포트 모달(openStatsFullscreenModal)', ['openStatsFullscreenModal']],
  'js/stats-differentiated.js': ['지표별 차등 분석 — 분석 계산·리포트 카드·기준 설정 모달(computeDifferentiatedAnalysis · renderDifferentiatedReportCard · openDifferentiatedMetricConfigModal)', ['computeDifferentiatedAnalysis', 'renderDifferentiatedReportCard', 'openDifferentiatedMetricConfigModal']],
};
const SECTION_FILES = new Set(['js/stats-sample-fitness.js', 'js/stats-sample-growth.js']);
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
if (PREV.size !== 22) throw new Error('1·2차 가져오기 줄이 22개가 아님: ' + PREV.size);
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
const edits = [];
const bridged = new Set();
const kUsed = new Set();
for (const n of MOVED_FN) {
  fnStmt(n).traverse({
    ThisExpression(p) { if (p.getFunctionParent() === fnStmt(n)) throw new Error('옮긴 함수 최상위에서 this 사용: ' + n); },
    Identifier(p) {
      const nm = p.node.name;
      const par = p.parent;
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
      if (p.parentPath.isObjectProperty() && par.shorthand) { edits.push({ start: par.start, end: par.end, text: nm + ': ' + rp }); return; }
      edits.push({ start: p.node.start, end: p.node.end, text: rp });
    }
  });
}
// 원본에 남는 코드가 부르는 옮긴 함수(가져오기 줄이 필요한 이름)
const importNeeded = new Set();
iife.traverse({ Identifier(p) {
  if (!MOVED.has(p.node.name) || !p.isReferencedIdentifier()) return;
  if (fileOfLine(S(p.node))) return;
  const b = p.scope.getBinding(p.node.name); if (b && b.scope === iScope) importNeeded.add(p.node.name);
} });
const seen = new Set();
const uniq = edits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.start - a.start);
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
const out = {};
for (const [f, [role, names]] of Object.entries(CELLS)) {
  const bl = BLOCKS.filter(b => b.file === f);
  const got = bl.flatMap(b => b.names);
  if (JSON.stringify(got.slice().sort()) !== JSON.stringify(names.slice().sort())) throw new Error('블록 함수 목록 다름 ' + f + ': ' + got.join(','));
  const how = SECTION_FILES.has(f)
      ? [' * generateDomainSample(js/stats-samples.js)의 `if(domainKey === \'<키>\'){ … }` 블록 본문을 글자 그대로 옮긴 구획 함수다(들여쓰기 2칸만 뺌). 조립자는 그 자리에서 이 함수를 부른다.',
        ' * 공유 변수(domainKey·now·records — 재대입 없음)는 인자로 받는다. 구획의 지역 var 는 이 구획 안에서만 선언·사용된다(경계 조건 — 생성기가 검사, sample-boundary-stats-3.js 가 모든 도메인 출력을 맞댄다).']
      : [' * 함수 단위로 글자 그대로 옮겼다.'];
  out[f] = [
    '/**',
    ' * OurGoal Stats Cell: ' + role + ' (' + TAG_TASK + ' · 통계 세포 쪼개기 3차)',
    ' *',
    ' * js/universal-stats.js(이전 전 3,283줄)에서 동작 그대로 옮겼다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md',
    ' *   ' + names.join(' · '),
    ...how,
    ' * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
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

// 원본 새 판: 블록을 지우고(블록 뒤 빈 줄 1개도 함께) 그 자리에 한 줄 안내 주석(구획 함수만 있는 블록은 이전 전에 없던 함수라 안내 주석 없이 지운다)
const removed = new Set();
const markerAt = new Map();
for (const b of BLOCKS) {
  for (let l = b.from; l <= b.to; l++) removed.add(l);
  if (lines[b.to] !== undefined && lines[b.to].trim() === '') removed.add(b.to + 1);
  if (SECTION_FILES.has(b.file)) continue;
  markerAt.set(b.from, '  /* [' + TAG_TASK + '] ' + b.names.join(' · ') + ' → ' + b.file + ' 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */');
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
const noteIdx = mainOut.findIndex(l => l.includes('[#TASK-ES-401] 2차:'));
if (noteIdx < 0 || noteIdx > reqIdx) throw new Error('2차 이음매 주석 없음');
mainOut.splice(noteIdx + 1, 0, '     [' + TAG_TASK + '] 3차: ' + NEW_FILES.join(' · ') + ' 도 같은 이음매로 가져온다(카탈로그 상수는 원본에 두고 getter 로 노출). */');
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

// index.html: 2차 새 태그 바로 뒤(= 원본 태그 바로 앞), 같은 줄(원본 태그·버전 글자는 그대로 — 시험이 고정)
const htmlPath = path.join(APP, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const TAG = '<script src="js/universal-stats.js?v=20260914-es061d"></script>';
if (html.split(TAG).length !== 2) throw new Error('원본 script 태그가 1개가 아님');
const NEW_TAGS = NEW_FILES.map(f => '<script src="' + f + '?v=20261005-es405"></script>').join('');
if (!html.includes(NEW_TAGS)) fs.writeFileSync(htmlPath, html.replace(TAG, NEW_TAGS + TAG), 'utf8');

fs.writeFileSync(path.join(APP, 'js', 'universal-stats.js'), mainOut.join('\n'), 'utf8');
for (const [f, arr] of Object.entries(out)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = { chainKeys, boundary, blocks: BLOCKS, imports: IMPORTS, prevMoved: [...PREV].sort(), bridgedNew: [...bridged].filter(n => !prevGetters.includes(n)).sort(), getters: allGetters, kUsed: [...kUsed].sort(), edits: uniq.length, mainLines: mainOut.length - (mainOut[mainOut.length - 1] === '' ? 1 : 0) };
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-stats-split-3-meta.json'), JSON.stringify(meta, null, 1));
console.log('chain', chainKeys.join(','), '| sections', JSON.stringify(boundary.sharedPerSection));
console.log('edits', uniq.length, 'bridged(new)', meta.bridgedNew.join(','), '| imports', IMPORTS.join(','), '| K', [...kUsed].sort().join(','));
console.log('js/universal-stats.js', lines0.length - 1, '->', mainOut.length - 1);
for (const [f, arr] of Object.entries(out)) console.log(f, arr.length - 1);
