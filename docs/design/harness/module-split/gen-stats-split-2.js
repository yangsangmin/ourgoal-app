'use strict';
// 통계 세포 쪼개기 2차 생성기(#TASK-ES-401): js/universal-stats.js(이전 전 5,171줄 — 1차 #TASK-ES-392 이음매가 이미 있는 판)에서
// 책임 묶음 4개를 글자 그대로 js/stats-*.js 로 옮긴다. 1차 생성기(gen-stats-split.js)와 같은 꼴이다 — 바꾸는 글자는 이름 참조뿐:
//   원본 IIFE 스코프에 남는 이름 → S.<이름>(원본이 OurgoalUniversalStatsKit.scope 에 getter 로 노출하는 통로)
//   다른 통계 세포 파일로 간 함수(이번에 옮기는 것 + 1차에 옮겨 원본이 var X = _statsKit.X 로 가져오는 것) → K.<이름>. 같은 파일 안 호출은 그대로.
// 상태 변수(var)는 모두 원본에 남긴다(옮긴 함수가 대입하는 원본 이름이 있으면 멈춘다).
// 원본 머리 이음매는 1차 것을 늘린다: require 줄에 새 파일, 가져오기 줄(var X = _statsKit.X) 추가, scope getter 목록 = 1차 목록 ∪ 이번 목록(이름순).
// 블록: 같은 파일로 가는 함수가 사이에 다른 문 없이 이어진 묶음 — 단, 사이에 1차 안내 주석([#TASK-ES-392])이 있으면 블록을 끊는다(1차 안내 주석은 원본에 남긴다).
// 위치·시험지: 1차와 같다(js/ 바로 아래 js/stats-*.js, 시험지 #TASK-ES-393 통계 합본). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md. 손으로 옮기지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-stats-split-2.js <APP_DIR> [이전 전 js/universal-stats.js]
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const SRC = process.argv[3] || path.join(APP, 'js', 'universal-stats.js');
const code = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
const lines = code.split('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });
const TAG_TASK = '#TASK-ES-401';

// 파일 → [역할 한 줄, 옮길 함수들]
const CELLS = {
  'js/stats-metrics.js': ['메트릭 자율 추출·탐색·시계열 집계 — ensureMetricConfig · extractMetricsFromRecord · discoverActiveMetrics · aggregateMetricTimeSeries', ['ensureMetricConfig', 'extractMetricsFromRecord', 'discoverActiveMetrics', 'aggregateMetricTimeSeries']],
  'js/stats-charts.js': ['SVG 차트 — 다형성 단일 지표 차트와 7-Tier 다중 시계열 집계·차트(renderUniversalSvgChart · aggregateMultiSeries · calcNiceStep · renderMultiSeriesSvg)', ['renderUniversalSvgChart', 'aggregateMultiSeries', 'calcNiceStep', 'renderMultiSeriesSvg']],
  'js/stats-import.js': ['데이터 가져오기 — 과거 일자 정규화·CSV 인제스터·가져오기 모달(normalizeHistoricalDate · parseCsvToUniversalRecords · openUniversalImportModal)', ['normalizeHistoricalDate', 'parseCsvToUniversalRecords', 'openUniversalImportModal']],
  'js/stats-data-menu.js': ['데이터 관리 메뉴·활용 가이드 모달 — openGuideModal · openDataManagementModal', ['openGuideModal', 'openDataManagementModal']],
};
const FILE_OF = {};
for (const [f, [, names]] of Object.entries(CELLS)) for (const n of names) FILE_OF[n] = f;
const MOVED_FN = Object.keys(FILE_OF);
const MOVED = new Set(MOVED_FN);

let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const PARAMS = new Set(iife.node.params.map(p => p.name)); // root
if (JSON.stringify([...PARAMS]) !== '["root"]') throw new Error('IIFE 인자가 root 하나가 아님');
const top = iife.get('body').get('body');
// 1차에 옮긴 함수(원본이 var X = _statsKit.X 로 가져오는 이름) — 옮긴 코드에서 부를 때 K.<이름>
const PREV = new Set();
for (const s of top) if (s.isVariableDeclaration()) for (const d of s.node.declarations) {
  const i = d.init;
  if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && i.object.name === '_statsKit' && !i.computed && i.property.name === d.id.name) PREV.add(d.id.name);
}
if (PREV.size !== 9) throw new Error('1차 가져오기 줄이 9개가 아님: ' + PREV.size);
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
let cur = null;
for (const s of top) {
  const nm = s.isFunctionDeclaration() ? s.node.id.name : null;
  const f = nm && MOVED.has(nm) ? FILE_OF[nm] : null;
  if (f && cur && cur.file === f) {
    let gapHasPrevMarker = false;
    for (let l = cur.to + 1; l < S(s.node); l++) if (lines[l - 1].includes('[#TASK-ES-392]')) gapHasPrevMarker = true;
    if (!gapHasPrevMarker) { cur.names.push(nm); cur.to = E(s.node); continue; }
  }
  if (cur) { BLOCKS.push(cur); cur = null; }
  if (f) {
    let from = S(s.node);
    while (from > 1 && lines[from - 2].trim() && isCommentLine(lines[from - 2].trim()) && !lines[from - 2].includes('[#TASK-ES-392]')) from--;
    cur = { file: f, names: [nm], from, to: E(s.node) };
  }
}
if (cur) BLOCKS.push(cur);
for (const b of BLOCKS) for (let l = b.from; l <= b.to; l++) {
  if (b.names.some(n => l >= S(fnStmt(n).node) && l <= E(fnStmt(n).node))) continue;
  const t = lines[l - 1].trim();
  if (t && !isCommentLine(t)) throw new Error('블록 안 함수 밖 코드 줄 ' + l + ': ' + t);
  if (t.includes('[#TASK-ES-392]')) throw new Error('블록 안에 1차 안내 주석 ' + l);
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
      let repl;
      if (MOVED.has(nm)) {
        if (FILE_OF[nm] === here) return;
        repl = 'K.' + nm;
        kUsed.add(nm);
      } else if (PREV.has(nm)) {
        repl = 'K.' + nm;
        kUsed.add(nm);
      } else {
        repl = 'S.' + nm;
        bridged.add(nm);
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
  out[f] = [
    '/**',
    ' * OurGoal Stats Cell: ' + role + ' (' + TAG_TASK + ' · 통계 세포 쪼개기 2차)',
    ' *',
    ' * js/universal-stats.js(이전 전 5,171줄)에서 동작 그대로 옮겼다(이전 전 ' + bl.map(b => b.from + '~' + b.to).join(', ') + '줄).',
    ' *   ' + names.join(' · '),
    ' * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
    ' * 바깥에서는 이전과 같이 window.OurgoalUniversalStats.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md',
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

// 원본 새 판: 블록을 지우고(블록 뒤 빈 줄 1개도 함께) 그 자리에 한 줄 안내 주석
const removed = new Set();
const markerAt = new Map();
for (const b of BLOCKS) {
  for (let l = b.from; l <= b.to; l++) removed.add(l);
  if (lines[b.to] !== undefined && lines[b.to].trim() === '') removed.add(b.to + 1);
  markerAt.set(b.from, '  /* [' + TAG_TASK + '] ' + b.names.join(' · ') + ' → ' + b.file + ' 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */');
}
const mainOut = [];
for (let l = 1; l <= lines.length; l++) {
  if (markerAt.has(l)) mainOut.push(markerAt.get(l), '');
  if (!removed.has(l)) mainOut.push(lines[l - 1]);
}
// 1차 이음매를 늘린다
const NEW_FILES = Object.keys(CELLS);
const reqIdx = mainOut.findIndex(l => l.startsWith("  if(!_statsKit && typeof require === 'function'){ require('./stats-taxonomy.js');"));
if (reqIdx < 0 || reqIdx > 40) throw new Error('1차 require 줄 없음');
mainOut[reqIdx] = mainOut[reqIdx].replace(' _statsKit = root.OurgoalUniversalStatsKit; }', ' ' + NEW_FILES.map(f => "require('./" + path.basename(f) + "');").join(' ') + ' _statsKit = root.OurgoalUniversalStatsKit; }');
const noteIdx = mainOut.findIndex(l => l.includes('② 스코프 통로: 옮긴 코드가 읽는 이 스코프의 이름만'));
if (noteIdx < 0 || noteIdx > reqIdx) throw new Error('1차 이음매 주석 없음');
mainOut.splice(noteIdx + 1, 0, '     [' + TAG_TASK + '] 2차: ' + NEW_FILES.join(' · ') + ' 도 같은 이음매로 가져온다(require 줄·가져오기 줄·getter 목록에 더했다). */');
mainOut[noteIdx] = mainOut[noteIdx].replace(/ \*\/$/, '');
let lastImp = -1;
for (let i = 0; i < 60; i++) if (/^  var (\w+) = _statsKit\.\1;$/.test(mainOut[i])) lastImp = i;
if (lastImp < 0) throw new Error('1차 가져오기 줄 없음');
mainOut.splice(lastImp + 1, 0, ...MOVED_FN.map(n => '  var ' + n + ' = _statsKit.' + n + ';'));
const gStart = mainOut.findIndex(l => l.startsWith('  Object.defineProperties(_statsKit.scope || (_statsKit.scope = {}), Object.getOwnPropertyDescriptors({'));
let gEnd = gStart + 1; while (mainOut[gEnd] !== '  }));') gEnd++;
const prevGetters = mainOut.slice(gStart + 1, gEnd).map(l => /get (\w+)\(\)/.exec(l)[1]);
const allGetters = [...new Set([...prevGetters, ...bridged])].sort();
mainOut.splice(gStart + 1, gEnd - gStart - 1, ...allGetters.map((n, i) => '    get ' + n + '(){ return ' + n + '; }' + (i === allGetters.length - 1 ? '' : ',')));

// index.html: 1차 새 태그들 바로 뒤(= 원본 태그 바로 앞), 같은 줄에 이번 새 파일들(원본 태그·버전 글자는 그대로 — 시험이 고정)
const htmlPath = path.join(APP, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const TAG = '<script src="js/universal-stats.js?v=20260914-es061d"></script>';
if (html.split(TAG).length !== 2) throw new Error('원본 script 태그가 1개가 아님');
const NEW_TAGS = NEW_FILES.map(f => '<script src="' + f + '?v=20261005-es401"></script>').join('');
if (!html.includes(NEW_TAGS)) fs.writeFileSync(htmlPath, html.replace(TAG, NEW_TAGS + TAG), 'utf8');

fs.writeFileSync(path.join(APP, 'js', 'universal-stats.js'), mainOut.join('\n'), 'utf8');
for (const [f, arr] of Object.entries(out)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = { blocks: BLOCKS, prevMoved: [...PREV].sort(), bridgedNew: [...bridged].sort(), getters: allGetters, kUsed: [...kUsed].sort(), edits: uniq.length, mainLines: mainOut.length - (mainOut[mainOut.length - 1] === '' ? 1 : 0) };
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-stats-split-2-meta.json'), JSON.stringify(meta, null, 1));
console.log('edits', uniq.length, 'bridged(new)', [...bridged].sort().join(','), 'K', [...kUsed].sort().join(','));
console.log('js/universal-stats.js', lines.length - 1, '->', mainOut.length - 1);
for (const [f, arr] of Object.entries(out)) console.log(f, arr.length - 1);
