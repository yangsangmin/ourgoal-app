'use strict';
// 목표 탭 이전(#TASK-ES-370) 검사 두 가지 — 일정 탭 verify-calendar.js(#TASK-ES-360)를 복제해, 세 파일로 나눈 renderGoalsScreen 을
// 조립자(render.js) 머리 + 상세 마크업(goal-detail.js renderGoalDetailBody 본문, 덧붙인 return 문 제외) + 상세 이벤트(goal-detail-events.js wireGoalDetailEvents 본문) 를
// 이어 붙인 토큰열로 이전 전 renderGoalsScreen 한 덩어리와 맞대도록 넓혔다. 조립자가 덧붙인 두 문(구간 호출)은 모양까지 검사한다:
//  ① 글자: 옮긴 함수마다 이전 전 index.html 의 토큰열과 옮긴 파일의 토큰열이 같은가(차이 허용: 'L.'·'K.' 접두뿐)
//  ② 누수: 옮긴 파일에 IIFE 스코프 이름이 접두 없이 남아(전역으로 새어) 다른 값을 읽는 곳 0, L.<이름> 이 모두 expose 됐는가,
//          옮긴 선언이 index.html 에 남지 않았는가, index.html 에서 쓰는 옮긴 이름이 모두 일정 키트에서 가져와졌는가
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-goals.js <이전 전 index.html> <APP_DIR>
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const ORIG = process.argv[2], APP = process.argv[3];
const MOVED = {
  'js/tabs/goals/render.js': ['renderGoalsScreen'],
  'js/tabs/goals/goal-detail.js': ['resultBadgeHtml', 'formatDateTimeBadge'],
  'js/tabs/goals/goal-detail-events.js': [],
};
// 구간 함수(새 이름, 목표 키트 안에서만): 토큰 비교는 renderGoalsScreen 에 이어 붙여서 한다
const SECTION_FILES = { detail: ['js/tabs/goals/goal-detail.js', 'renderGoalDetailBody'], events: ['js/tabs/goals/goal-detail-events.js', 'wireGoalDetailEvents'] };
const ALL = [].concat(...Object.values(MOVED));
const KIT_ONLY = ['renderGoalDetailBody', 'wireGoalDetailEvents'];
const inlineCode = file => {
  const lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');
  let s = -1, e = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
  return lines.slice(s, e).join('\n');
};
const norm = toks => {
  const vals = toks.map(t => (t.type.label === 'name' || t.type.keyword) ? String(t.value) : (t.value !== undefined ? t.type.label + ':' + String(t.value) : t.type.label));
  const out = [];
  for (let i = 0; i < vals.length; i++) {
    if ((vals[i] === 'L' || vals[i] === 'K') && vals[i + 1] === '.' && /^[A-Za-z_$]/.test(vals[i + 2] || '')) { i += 1; continue; }
    out.push(vals[i]);
  }
  return out;
};
const topFns = (ast, inIife) => {
  const body = inIife ? ast.program.body[0].expression.callee.body.body : ast.program.body[0].expression.callee.body.body;
  const m = {};
  for (const x of body) {
    if (x.type === 'FunctionDeclaration') m[x.id.name] = x;
    else if (x.type === 'VariableDeclaration' && x.declarations.length === 1 && x.declarations[0].id.type === 'Identifier') m[x.declarations[0].id.name] = x;
  }
  return m;
};
// renderGoalsScreen 이어 붙이기: 조립자 머리(구간 호출 두 문 앞까지) + 상세 본문(마지막 return 문 제외) + 이벤트 본문 + 조립자 닫는 중괄호
const assembler = { ok: false, detail: null };
function stitchedRenderGoalsScreen(rast, rfn) {
  const st = rfn.body.body;
  const call1 = st[st.length - 2], call2 = st[st.length - 1];
  const src = fs.readFileSync(path.join(APP, 'js/tabs/goals/render.js'), 'utf8');
  const t1 = src.slice(call1.start, call1.end), t2 = src.slice(call2.start, call2.end);
  assembler.detail = [t1, t2];
  assembler.ok = t1 === 'var _goalDetail = K.renderGoalDetailBody(goal, body);'
    && t2 === 'K.wireGoalDetailEvents(goal, body, _goalDetail.allCollapsed, _goalDetail.goalStatusHash, _goalDetail.isDateStale, _goalDetail.goalStatusStale);';
  // 조립자가 덧붙인 한 줄 안내 주석([#TASK-ES-370] 여기부터는 …)은 이전 전에 없던 주석이라 뺀다(그 밖의 주석 토큰은 그대로 맞댄다)
  const head = rast.tokens.filter(t => t.start >= rfn.start && t.end <= call1.start && !(/^Comment/.test(t.type) && String(t.value).includes('[#TASK-ES-370]')));
  const close = rast.tokens.filter(t => t.start >= call2.end && t.end <= rfn.end);
  const sec = key => {
    const [f, name] = SECTION_FILES[key];
    const sa = parser.parse(fs.readFileSync(path.join(APP, f), 'utf8'), { sourceType: 'script', tokens: true });
    const fn = topFns(sa, true)[name];
    const bst = fn.body.body;
    let end = fn.body.end - 1;
    if (key === 'detail') {
      const last = bst[bst.length - 1];
      const rs = fs.readFileSync(path.join(APP, f), 'utf8').slice(last.start, last.end);
      assembler.detailReturn = rs;
      if (last.type !== 'ReturnStatement' || rs !== 'return { allCollapsed: allCollapsed, goalStatusHash: goalStatusHash, isDateStale: isDateStale, goalStatusStale: goalStatusStale };') assembler.ok = false;
      end = last.start;
    }
    return sa.tokens.filter(t => t.start >= fn.body.start + 1 && t.end <= end);
  };
  return norm([...head, ...sec('detail'), ...sec('events'), ...close]);
}
// ① 글자
const oast = parser.parse(inlineCode(ORIG), { sourceType: 'script', tokens: true });
const ofns = topFns(oast, true);
const equiv = [];
for (const [f, names] of Object.entries(MOVED)) {
  const fast = parser.parse(fs.readFileSync(path.join(APP, f), 'utf8'), { sourceType: 'script', tokens: true });
  const nfns = topFns(fast, true);
  for (const n of names) {
    const a = norm(oast.tokens.filter(t => t.start >= ofns[n].start && t.end <= ofns[n].end));
    let b;
    if (n === 'renderGoalsScreen') b = stitchedRenderGoalsScreen(fast, nfns[n]);
    else b = norm(fast.tokens.filter(t => t.start >= nfns[n].start && t.end <= nfns[n].end));
    const same = a.length === b.length && a.every((v, i) => v === b[i]);
    let at = -1; if (!same) for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break; }
    equiv.push({ fn: n, file: f, tokensOrig: a.length, tokensNew: b.length, same, firstDiff: same ? null : { i: at, orig: a.slice(at - 3, at + 5), neu: b.slice(at - 3, at + 5) } });
  }
}
// ② 누수
const nast = parser.parse(inlineCode(path.join(APP, 'index.html')), { sourceType: 'script' });
let iife; traverse(nast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iifeNames = new Set(Object.keys(iife.scope.bindings));
const exposed = new Set(); const imported = new Set();
iife.traverse({
  CallExpression(p) { const c = p.node.callee; if (c.type === 'MemberExpression' && c.property.name === 'expose' && p.node.arguments[1] && p.node.arguments[1].properties) for (const pr of p.node.arguments[1].properties) if (pr.kind === 'get') exposed.add(pr.key.name); },
  VariableDeclarator(p) { const i = p.node.init; if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && i.object.name === '_goalsKit') imported.add(p.node.id.name); }
});
const leftDefs = ALL.filter(n => { const b = iife.scope.bindings[n]; return b && (b.path.isFunctionDeclaration() || (b.path.isVariableDeclarator() && !imported.has(n))); });
// index.html 이 아직 부르는 옮긴 이름: IIFE 안에서 바인딩이 '가져오기 var' 가 아니면서 참조되는 것이 없어야 한다
const usedInIndexNotImported = [];
iife.traverse({ Identifier(p) {
  const nm = p.node.name; if (!ALL.includes(nm) || !p.isReferencedIdentifier()) return;
  const par = p.parent; if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) return;
  const b = p.scope.getBinding(nm);
  if (!b || (b.scope === iife.scope && !imported.has(nm))) usedInIndexNotImported.push(nm + '@' + (p.node.loc && p.node.loc.start.line));
} });
const files = {}; const usedL = new Set(); const usedK = new Set();
for (const f of Object.keys(MOVED)) {
  const fa = parser.parse(fs.readFileSync(path.join(APP, f), 'utf8'), { sourceType: 'script' });
  const leaks = new Set(), globals = new Set();
  traverse(fa, {
    Identifier(p) {
      const par = p.parent;
      if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) {
        if (par.object.type === 'Identifier' && par.object.name === 'L') usedL.add(p.node.name);
        if (par.object.type === 'Identifier' && par.object.name === 'K') usedK.add(p.node.name);
        return;
      }
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node) return;
      if (!p.isReferencedIdentifier() && !(p.parentPath.isAssignmentExpression() && par.left === p.node)) return;
      if (p.scope.getBinding(p.node.name)) return;
      globals.add(p.node.name);
      if (iifeNames.has(p.node.name)) leaks.add(p.node.name);
    }
  });
  files[f] = { globals: [...globals].sort(), leaksIIFEName: [...leaks].sort() };
}
const notExposed = [...usedL].filter(n => !exposed.has(n)).sort();
const exposedUnused = [...exposed].filter(n => !usedL.has(n)).sort();
const kNotDefined = [...usedK].filter(n => !ALL.includes(n) && !KIT_ONLY.includes(n));
const report = { equivalent: equiv.every(r => r.same), equiv, assembler, exposed: exposed.size, imported: [...imported].sort(), leftDefsInIndex: leftDefs, usedInIndexNotImported, files,
  usedL: [...usedL].sort(), notExposed, exposedUnused, usedK: [...usedK].sort(), kNotDefined };
const ok = report.equivalent && assembler.ok && leftDefs.length === 0 && usedInIndexNotImported.length === 0 && notExposed.length === 0 && kNotDefined.length === 0 && Object.values(files).every(x => x.leaksIIFEName.length === 0);
report.ok = ok;
console.log(JSON.stringify(report, null, 1));
console.log(ok ? 'OK: 토큰 동일(L./K. 접두 제외, renderGoalsScreen 은 세 파일 이어 붙여 비교) · 조립자 두 문 모양 일치 · 누수 0 · 미노출 0 · 남은 정의 0 · 안 가져온 사용 0' : 'FAIL');
if (process.env.MODULE_SPLIT_OUT) fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT, 'verify-goals.json'), JSON.stringify(report, null, 1));
process.exit(ok ? 0 : 1);
