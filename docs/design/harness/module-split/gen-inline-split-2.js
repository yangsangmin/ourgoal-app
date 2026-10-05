'use strict';
// 인라인 스크립트 세포화 2차 생성기(#TASK-ES-432): index.html 인라인 IIFE 의 책임 묶음(scripts/inline-script-map.js 지도의 묶음) 1개를 글자 그대로 세포 파일 1개로 옮긴다.
//   받은 응원 알림: 지도 「받은 응원 알림 (실제 내 게시물 응원 수 + 마니또 받은 응원함)」(totalFeedCheers·checkSocialNotifications·showSocialNotifyBanner) → js/tabs/comm/cheer-notify.js
//   (처음 고른 게이지·스트릭 프리즈·소통 투어 3묶음은 그사이 다른 구역 PR 이 main 에 옮겨 뺐다.)
// 1차 생성기(gen-inline-split-1.js, #TASK-ES-423)와 같은 틀이다(묶음 머리 구획 주석부터 마지막 선언 끝 줄까지 한 덩어리, 묶음 안에 옮기지 않는 문이 있으면 멈춘다).
// 다른 점: 이음매를 1차 이음매(#TASK-ES-423) expose 블록 바로 다음에 두고, 새 script 태그는 그 탭 index.js 태그 바로 앞(같은 줄, 앞선 태그가 붙어 있어도)에 넣는다.
// 이름 참조만 바꾼다: 인라인 IIFE 스코프 이름은 L.<이름>(js/core/app-scope.js 통로), 같은 세포 안 이름은 그대로, 다른 세포로 간 이름은 K.<이름>(이번에는 0 이어야 한다).
// 시험지가 index.html 에서 글자로 잘라 가는 함수(smoke-test FN_NAMES)는 옮기지 않는다(MODULE-SPLIT-PROTOCOL 1절 (라)) — 생성기가 검사한다.
// 손으로 옮기지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-inline-split-2.js <APP_DIR> [이전 전 index.html]
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

// 세포: 파일 · 키트(전역 하나, 이미 있는 탭 키트를 같이 쓴다) · 옮길 묶음(구획 주석 첫 줄 글자로 찾는다 — 지도 id 는 줄이 바뀌면 바뀐다)
const CELLS = [
  {
    key: 'cheer', file: 'js/tabs/comm/cheer-notify.js', kit: 'OurgoalCommKit', kitVar: '_commKit',
    groups: [
      { header: '받은 응원 알림 (실제 내 게시물 응원 수 + 마니또 받은 응원함)', names: ['totalFeedCheers', 'checkSocialNotifications', 'showSocialNotifyBanner'] },
    ],
    beforeTag: '<script src="js/tabs/comm/index.js"></script>',
  },
];
const DECL_CELL = {};
for (const c of CELLS) for (const g of c.groups) for (const n of g.names) DECL_CELL[n] = c.key;
const CELL = Object.fromEntries(CELLS.map(c => [c.key, c]));
const MOVED_NAMES = Object.keys(DECL_CELL);
const MOVED = new Set(MOVED_NAMES);

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
// smoke-test FN_NAMES 의 함수는 옮기지 않는다
{
  const smoke = fs.readFileSync(path.join(APP, 'scripts', 'smoke-test.js'), 'utf8');
  const m = smoke.match(/const FN_NAMES = \[([\s\S]*?)\];/);
  if (!m) throw new Error('smoke-test FN_NAMES 못 읽음');
  for (const n of MOVED_NAMES) if (new RegExp("'" + n + "'").test(m[1])) throw new Error('smoke-test FN_NAMES 함수를 옮기려 함: ' + n);
}
// 재대입·중복 선언 검사, 최상위 this·arguments 0
for (const n of MOVED_NAMES) {
  const b = iScope.getBinding(n);
  if (!b) throw new Error('바인딩 없음 ' + n);
  if (b.constantViolations.length) throw new Error('이전 이름 재대입/중복 선언: ' + n);
  if (!b.path.isFunctionDeclaration()) throw new Error('함수 선언이 아님: ' + n);
  let bad = 0;
  b.path.get('body').traverse({
    Function(p) { if (!p.isArrowFunctionExpression()) p.skip(); },
    ThisExpression() { bad++; },
    Identifier(p) { if (p.node.name === 'arguments' && p.isReferencedIdentifier()) bad++; },
  });
  if (bad) throw new Error('옮길 함수의 최상위 this/arguments: ' + n);
}

// 묶음 덩어리: 구획 주석 첫 줄 ~ 마지막 선언 끝 줄. 그 사이 최상위 문은 모두 옮기는 선언이어야 한다.
const chunks = [];
for (const c of CELLS) for (const g of c.groups) {
  const hIdx = lines.findIndex((l, i) => i >= sLine && i < eLine && l.includes(g.header));
  if (hIdx < 0) throw new Error('구획 주석 못 찾음: ' + g.header);
  // 구획 주석의 시작 줄(`/*` 가 있는 줄)
  let start = hIdx + 1;
  while (!/^\s*\/\*/.test(lines[start - 1])) start--;
  if (lines.slice(sLine, eLine).filter(l => l.includes(g.header)).length !== 1) throw new Error('구획 주석이 둘 이상: ' + g.header);
  const decls = g.names.map(n => declOf(n).node);
  const end = Math.max(...decls.map(HE));
  const firstDecl = Math.min(...decls.map(H));
  // 구획 주석과 첫 선언 사이에는 주석·빈 줄만
  for (let l = start; l < firstDecl; l++) { const t = lines[l - 1].trim(); if (t && !t.startsWith('/*') && !t.startsWith('*') && !t.startsWith('-') && !t.startsWith('[') && !/\*\/$/.test(t) && !/^=+/.test(t) && !lines[l - 1].startsWith('     ')) throw new Error('구획 머리에 코드: ' + l + ' ' + t); }
  // 덩어리 안 최상위 문 = 옮기는 선언만
  for (const st of top) {
    const a = H(st.node), b = HE(st.node);
    if (b < start || a > end) continue;
    if (!(st.isFunctionDeclaration() && MOVED.has(st.node.id.name) && DECL_CELL[st.node.id.name] === c.key)) throw new Error('묶음 안에 옮기지 않는 문: ' + a + ' ' + st.node.type);
  }
  // 덩어리 앞뒤가 문 중간을 가르지 않는지(첫 줄 앞·끝 줄 뒤 같은 줄 코드 0)
  const lastNode = decls.find(d => HE(d) === end);
  const tail = lines[end - 1].slice(lastNode.loc.end.column).trim();
  if (tail && !tail.startsWith('//')) throw new Error('끝 줄 뒤에 다른 코드: ' + tail);
  if (lines[start - 1].slice(0, lines[start - 1].indexOf('/*')).trim()) throw new Error('첫 줄 앞에 다른 코드: ' + start);
  // 다음 최상위 문의 앞 주석이 덩어리 안에 들어오지 않는지(다음 묶음 구획 주석은 end 뒤에 있어야 한다)
  chunks.push({ cell: c.key, header: g.header, names: g.names, start, end });
}
chunks.sort((a, b) => a.start - b.start);
for (let i = 1; i < chunks.length; i++) if (chunks[i].start <= chunks[i - 1].end) throw new Error('덩어리 겹침');
const cellOfLine = l => { const ch = chunks.find(x => l >= x.start && l <= x.end); return ch ? ch.cell : null; };

// 옮긴 코드 밖에서 부르는 이름 = index.html 이 IIFE 머리에서 가져와야 하는 이름(스코프 분석으로 정한다)
const IMPORTS = {}; const outsideRefs = {};
for (const n of MOVED_NAMES) {
  const outs = iScope.getBinding(n).referencePaths.filter(r => !cellOfLine(H(r.node)));
  if (outs.length) { (IMPORTS[DECL_CELL[n]] = IMPORTS[DECL_CELL[n]] || []).push(n); outsideRefs[n] = outs.map(r => H(r.node)); }
}

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
      const here = cellOfLine(H(p.node));
      if (!here) throw new Error('세포 미정 줄 ' + H(p.node));
      const isWrite = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression();
      let repl;
      if (MOVED.has(nm)) {
        if (DECL_CELL[nm] === here) return;
        throw new Error('다른 세포로 간 이름을 부름(이번 틀 밖): ' + nm);
      }
      repl = 'L.' + nm;
      if (!bridged.has(nm)) bridged.set(nm, { assigned: false, kind: b.kind });
      if (isWrite) bridged.get(nm).assigned = true;
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

const HEADER_BRIDGE = kit => [
  "  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.",
  "  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};",
  "  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)",
  "  var K = global." + kit + " = global." + kit + " || {};",
];
const FOOT = names => [
  ...names.map(n => '  K.' + n + ' = ' + n + ';'),
  '',
  "  if (typeof module !== 'undefined' && module.exports) {",
  '    module.exports = K;',
  '  }',
  "})(typeof window !== 'undefined' ? window : globalThis);",
  '',
];
const COMMON_NOTE = [
  ' * 묶음을 통째로(구획 주석 포함) 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
  ' * index.html 은 IIFE 맨 위에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.',
  ' * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 인라인 세포화 1차 #TASK-ES-423 · 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md',
];
const bodyOf = key => {
  const out = [];
  chunks.filter(ch => ch.cell === key).forEach((ch, i) => { if (i) out.push(''); out.push(...range(ch.start, ch.end)); });
  return out;
};
const namesOf = key => MOVED_NAMES.filter(n => DECL_CELL[n] === key).sort((a, b) => H(declOf(a).node) - H(declOf(b).node));
const lbl = ch => ch.start + '~' + ch.end;
const DESC = {
  cheer: [
    ' * OurGoal Cheer Notify (소통 탭 — 받은 응원 알림 띠)',
    ' *',
    ' * #TASK-ES-432 (인라인 스크립트 세포화 2차): index.html 인라인 IIFE 의 받은 응원 알림 묶음을 동작 그대로 옮겼다.',
    ...chunks.filter(c => c.cell === 'cheer').map(ch => ' *   ' + ch.names.join(' · ') + '(이전 전 ' + lbl(ch) + '줄)'),
    ' * checkSocialNotifications = 앱에 들어올 때(enterApp — 아직 index.html) 내 피드 글 응원 수·마니또 받은 응원 수를 지난번 본 수와 비교해 새 것이 있으면',
    ' * 홈 #socialNotifySlot 에 「응원이 도착했어요」 띠를 그린다(「확인하기」 #sbOpen → 소통 탭).',
  ],
};
const out = {};
for (const c of CELLS) {
  out[c.file] = ['/**', ...DESC[c.key], ...COMMON_NOTE, ' */', '(function(global) {', "  'use strict';", ...HEADER_BRIDGE(c.kit), '', ...bodyOf(c.key), '', ...FOOT(namesOf(c.key))];
}

// index.html 새 판: 덩어리마다(같은 세포로 가는 이웃 덩어리는 사이가 빈 줄뿐이면 합친다) 표지 주석 한 줄
const blankBetween = (a, b) => { for (let l = a + 1; l < b; l++) if (lines[l - 1].trim() !== '') return false; return true; };
const merged = [];
for (const ch of chunks) {
  const last = merged[merged.length - 1];
  if (last && last.cell === ch.cell && (last.end + 1 === ch.start || blankBetween(last.end, ch.start))) { last.end = ch.end; last.names.push(...ch.names); }
  else merged.push({ cell: ch.cell, start: ch.start, end: ch.end, names: ch.names.slice() });
}
let newHtmlLines = lines.slice();
for (const m of merged.slice().sort((x, y) => y.start - x.start)) {
  const mk = '  /* [#TASK-ES-432] ' + m.names.join(' · ') + ' → ' + CELL[m.cell].file + ' 로 옮김(인라인 스크립트 세포화 2차 — 구획 주석 포함) */';
  newHtmlLines.splice(m.start - 1, m.end - m.start + 1, mk);
}
// IIFE 머리: 인라인 세포화 1차 이음매(#TASK-ES-423) expose 블록 바로 다음에 이번 이음매를 둔다
const g2 = newHtmlLines.findIndex(l => l.includes('[#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매'));
if (g2 < 0) throw new Error('인라인 세포화 1차 이음매 없음');
let g2End = -1;
for (let i = g2; i < newHtmlLines.length; i++) if (newHtmlLines[i] === '  });') { g2End = i; break; }
if (g2End < 0 || g2End - g2 > 30) throw new Error('인라인 세포화 1차 expose 끝 못 찾음');
const usIdx0 = newHtmlLines.findIndex((l, i) => i > sLine - 1 && l.includes('"use strict";'));
const alreadyExposed = new Set();
for (let i = usIdx0; i <= g2End; i++) { const re = /get ([A-Za-z_$][\w$]*)\(\)/g; let m; while ((m = re.exec(newHtmlLines[i]))) alreadyExposed.add(m[1]); }
if (!alreadyExposed.size) throw new Error('앞선 노출 목록을 못 읽음');
const kitVarDeclared = new Set();
for (let i = usIdx0; i <= g2End; i++) { const m = newHtmlLines[i].match(/^  var (_\w+Kit) = window\.(\w+);$/); if (m) kitVarDeclared.add(m[1] + '=' + m[2]); }
const bridgedSorted = [...bridged.keys()].sort();
const bridgedNew = bridgedSorted.filter(n => !alreadyExposed.has(n));
for (const n of bridgedSorted) if (alreadyExposed.has(n) && bridged.get(n).assigned && !newHtmlLines.slice(usIdx0, g2End + 1).some(l => l.includes('set ' + n + '(v)'))) throw new Error('대입하는 이름인데 기존 노출에 setter 없음: ' + n);
const header = [
  '',
  '  /* ============ [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs/MODULE-SPLIT-PROTOCOL.md, 1차 #TASK-ES-423 와 같은 틀) ============',
  '     ① 가져오기: js/tabs/comm/cheer-notify.js 로 옮긴 함수 중 이 스코프에서 부르는 것을 같은 이름으로 가져온다(키트는 앞선 이음매의 소통 키트 변수를 그대로 쓴다 — 전역에 새 이름을 만들지 않는다).',
  '     ② 앱 스코프 통로: 옮긴 코드가 읽는 이 스코프 이름 중 앞선 이음매가 아직 노출하지 않은 것만 getter 로 더한다(스코프 분석으로 뽑았다). */',
];
for (const c of CELLS) {
  if (!kitVarDeclared.has(c.kitVar + '=' + c.kit)) throw new Error('앞선 이음매에 키트 변수 없음: ' + c.kitVar);
  for (const n of (IMPORTS[c.key] || [])) header.push('  var ' + n + ' = ' + c.kitVar + '.' + n + ';');
}
if (bridgedNew.length) {
  header.push("  window.OurgoalAppScope.expose('index.html', {");
  bridgedNew.forEach((n, i) => {
    const info = bridged.get(n);
    const comma = i === bridgedNew.length - 1 ? '' : ',';
    header.push('    get ' + n + '(){ return ' + n + '; }' + (info.assigned ? ', set ' + n + '(v){ ' + n + ' = v; }' : '') + comma);
  });
  header.push('  });');
}
newHtmlLines.splice(g2End + 1, 0, ...header);
// script 태그: 그 탭 index.js 태그 바로 앞, 같은 줄(순증가 0줄). 앞선 이전이 같은 줄에 태그를 붙여 두었어도 index.js 태그 글자 바로 앞에 넣는다.
for (const c of CELLS) {
  const hits = newHtmlLines.map((l, i) => [l, i]).filter(([l]) => l.includes(c.beforeTag));
  if (hits.length !== 1) throw new Error('태그 없음/여럿 ' + c.beforeTag + ' ' + hits.length);
  const idx = hits[0][1];
  const tag = '<script src="' + c.file + '"></script>';
  if (newHtmlLines[idx].includes(tag)) throw new Error('이미 있는 태그 ' + tag);
  newHtmlLines[idx] = newHtmlLines[idx].replace(c.beforeTag, tag + c.beforeTag);
}
if (!newHtmlLines.some(l => l.trim() === '<script src="js/core/app-scope.js"></script>')) throw new Error('app-scope.js 태그 없음');

fs.writeFileSync(path.join(APP, 'index.html'), newHtmlLines.join(EOL), 'utf8');
for (const [f, arr] of Object.entries(out)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = { scriptHtmlLines: [sLine + 1, eLine],
  chunks, markers: merged.map(m => ({ names: m.names, lines: [m.start, m.end], file: CELL[m.cell].file })),
  imports: IMPORTS, outsideRefs,
  bridged: bridgedSorted.map(n => ({ n, ...bridged.get(n), alreadyExposedBefore: alreadyExposed.has(n) })), newlyExposed: bridgedNew, edits: uniq.length,
  htmlLinesBefore: lines.length, htmlLinesAfter: newHtmlLines.length };
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-inline-split-2-meta.json'), JSON.stringify(meta, null, 1));
console.log('edits', uniq.length, 'bridged', bridgedSorted.length, 'newly exposed', bridgedNew.length, 'imports', JSON.stringify(IMPORTS));
console.log('index.html lines', lines.length, '->', newHtmlLines.length);
for (const [f, arr] of Object.entries(out)) console.log(f, arr.length - 1);
