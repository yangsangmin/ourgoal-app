'use strict';
// 기록 탭 이전(#TASK-ES-358) 검사 두 가지(설정 시범 verify-equiv·verify-free 와 같은 기준):
//  ① 글자: 옮긴 함수마다 이전 전 index.html 의 토큰열과 옮긴 파일의 토큰열이 같은가(차이 허용: 'L.'·'K.' 접두뿐)
//  ② 누수: 옮긴 파일에 IIFE 스코프 이름이 접두 없이 남아(전역으로 새어) 다른 값을 읽는 곳 0, L.<이름> 이 모두 expose 됐는가,
//          옮긴 함수 정의가 index.html 에 남지 않았는가, index.html 에서 쓰는 K 함수가 모두 가져와졌는가
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-records.js <이전 전 index.html> <APP_DIR>
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const ORIG = process.argv[2], APP = process.argv[3];
const MOVED = {
  'js/tabs/records/period-ai-card.js': ['initPeriodAiCard', 'generatePeriodAIFeedback', 'generateLocalPeriodFeedback', 'renderPeriodFeedbackResult'],
  'js/tabs/records/render.js': ['setRecordsSegment', 'setRecordsSlide', 'renderRecordsScreen'],
};
const ALL = [].concat(...Object.values(MOVED));
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
  const m = {}; for (const x of body) if (x.type === 'FunctionDeclaration') m[x.id.name] = x; return m;
};
// ① 글자
const oast = parser.parse(inlineCode(ORIG), { sourceType: 'script', tokens: true });
const ofns = topFns(oast, true);
const equiv = [];
for (const [f, names] of Object.entries(MOVED)) {
  const fast = parser.parse(fs.readFileSync(path.join(APP, f), 'utf8'), { sourceType: 'script', tokens: true });
  const nfns = topFns(fast, true);
  for (const n of names) {
    const a = norm(oast.tokens.filter(t => t.start >= ofns[n].start && t.end <= ofns[n].end));
    const b = norm(fast.tokens.filter(t => t.start >= nfns[n].start && t.end <= nfns[n].end));
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
  VariableDeclarator(p) { const i = p.node.init; if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && i.object.name === '_recordsKit') imported.add(p.node.id.name); }
});
const leftDefs = ALL.filter(n => { const b = iife.scope.bindings[n]; return b && b.path.isFunctionDeclaration(); });
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
const kNotDefined = [...usedK].filter(n => !ALL.includes(n));
const report = { equivalent: equiv.every(r => r.same), equiv, exposed: exposed.size, imported: [...imported].sort(), leftFunctionDefsInIndex: leftDefs, files,
  usedL: [...usedL].sort(), notExposed, exposedUnused, usedK: [...usedK].sort(), kNotDefined };
const ok = report.equivalent && leftDefs.length === 0 && notExposed.length === 0 && kNotDefined.length === 0 && Object.values(files).every(x => x.leaksIIFEName.length === 0);
report.ok = ok;
console.log(JSON.stringify(report, null, 1));
console.log(ok ? 'OK: 토큰 동일(L./K. 접두 제외) · 누수 0 · 미노출 0 · 남은 정의 0' : 'FAIL');
if (process.env.MODULE_SPLIT_OUT) fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT, 'verify-records.json'), JSON.stringify(report, null, 1));
process.exit(ok ? 0 : 1);
