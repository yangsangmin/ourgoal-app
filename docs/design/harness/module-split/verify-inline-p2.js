'use strict';
// 인라인 스크립트 세포화 구역 P2 검사(#TASK-ES-438 ~) — 1차 verify-inline-split-1.js(#TASK-ES-423)를 일반화했다(함수 선언 + 최상위 변수, 옮긴 목록은 생성기 meta 에서 읽음).
//  ① 글자: 옮긴 선언마다 이전 전 index.html 의 토큰열과 옮긴 파일의 토큰열이 같은가(차이 허용: 'L.'·'K.' 접두뿐)
//  ①-더: 덩어리(앞 주석·구획 주석 포함)를 'L.'·'K.' 접두만 떼고 이전 전 줄과 한 줄씩 맞댄다 — 덩어리 줄이 새 파일 안에 연속으로 그대로 있는가
//  ② 누수: 옮긴 파일에 IIFE 스코프 이름이 접두 없이 남아(전역으로 새어) 다른 값을 읽는 곳 0, L.<이름> 이 모두 expose 됐는가,
//          옮긴 선언이 index.html 에 남지 않았는가, index.html 에서 쓰는 옮긴 이름이 모두 키트에서 가져와졌는가, K.<이름> 이 모두 같은 키트의 옮긴 이름인가, 새 파일 800줄 이하
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-inline-p2.js <이전 전 index.html> <APP_DIR> <생성기 meta.json> [out.json]
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const ORIG = process.argv[2], APP = process.argv[3], META = JSON.parse(fs.readFileSync(process.argv[4], 'utf8')), OUT = process.argv[5];
const MOVED = META.moved;
const KIT_VARS = META.kitVars;
const ALL = [].concat(...Object.values(MOVED));
const readLines = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n').split('\n');
const inlineCode = file => {
  const lines = readLines(file);
  let s = -1, e = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
  return lines.slice(s, e).join('\n');
};
const norm = toks => {
  const vals = toks.map(t => (t.type.label === 'name' || t.type.keyword) ? String(t.value) : (t.value !== undefined ? t.type.label + ':' + String(t.value) : t.type.label));
  const out = [];
  for (let i = 0; i < vals.length; i++) {
    if ((vals[i] === 'L' || vals[i] === 'K') && vals[i + 1] === '.' && /^[A-Za-z_$]/.test(vals[i + 2] || '') && vals[i - 1] !== '.') { i += 1; continue; }
    out.push(vals[i]);
  }
  return out;
};
const topDecls = body => {
  const m = {};
  for (const x of body) {
    if (x.type === 'FunctionDeclaration') m[x.id.name] = x;
    if (x.type === 'VariableDeclaration' && x.declarations.length === 1 && x.declarations[0].id.type === 'Identifier') m[x.declarations[0].id.name] = x;
  }
  return m;
};
// ① 글자(토큰)
const oast = parser.parse(inlineCode(ORIG), { sourceType: 'script', tokens: true });
const ofns = topDecls(oast.program.body[0].expression.callee.body.body);
const equiv = [];
const origLines = readLines(ORIG);
const lineCheck = [];
const strip = l => l.replace(/(^|[^A-Za-z0-9_$.])[LK]\.(?=[A-Za-z_$])/g, '$1');
for (const [f, names] of Object.entries(MOVED)) {
  const src = fs.readFileSync(path.join(APP, f), 'utf8');
  const fast = parser.parse(src, { sourceType: 'script', tokens: true });
  const nfns = topDecls(fast.program.body[0].expression.callee.body.body);
  for (const n of names) {
    if (!ofns[n] || !nfns[n]) { equiv.push({ name: n, file: f, same: false, missing: { orig: !ofns[n], neu: !nfns[n] } }); continue; }
    const a = norm(oast.tokens.filter(t => t.start >= ofns[n].start && t.end <= ofns[n].end));
    const b = norm(fast.tokens.filter(t => t.start >= nfns[n].start && t.end <= nfns[n].end));
    const same = a.length === b.length && a.every((v, i) => v === b[i]);
    let at = -1; if (!same) for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break; }
    equiv.push({ name: n, file: f, kind: ofns[n].type, tokensOrig: a.length, tokensNew: b.length, same, firstDiff: same ? null : { i: at, orig: a.slice(at - 3, at + 5), neu: b.slice(at - 3, at + 5) } });
  }
  // ①-더: 덩어리 줄 맞대기(생성기 meta 의 덩어리 줄 범위 — 앞 빈 줄 제외 — 가 새 파일 본문에 접두만 뗀 채 연속으로 있는가)
  const nl = src.split('\n').map(strip);
  for (const ch of META.chunks.filter(c => (MOVED[f] || []).includes(c.names[0]))) {
    let seg = origLines.slice(ch.start - 1, ch.end);
    while (seg.length && seg[0].trim() === '') seg = seg.slice(1);
    let at = -1;
    for (let i = 0; i + seg.length <= nl.length && at < 0; i++) { let ok = true; for (let k = 0; k < seg.length; k++) if (nl[i + k] !== seg[k]) { ok = false; break; } if (ok) at = i; }
    lineCheck.push({ file: f, name: ch.names[0], origLines: [ch.start, ch.end], lines: seg.length, foundAtNewLine: at < 0 ? null : at + 1, same: at >= 0 });
  }
}
// ② 누수
const nast = parser.parse(inlineCode(path.join(APP, 'index.html')), { sourceType: 'script' });
let iife; traverse(nast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iifeNames = new Set(Object.keys(iife.scope.bindings));
const exposed = new Set(); const imported = new Set();
iife.traverse({
  CallExpression(p) { const c = p.node.callee; if (c.type === 'MemberExpression' && c.property.name === 'expose' && p.node.arguments[1] && p.node.arguments[1].properties) for (const pr of p.node.arguments[1].properties) if (pr.kind === 'get') exposed.add(pr.key.name); },
  VariableDeclarator(p) { const i = p.node.init; if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && KIT_VARS.includes(i.object.name) && i.property.name === p.node.id.name) imported.add(p.node.id.name); }
});
const leftDefs = ALL.filter(n => { const b = iife.scope.bindings[n]; return b && (b.path.isFunctionDeclaration() || (b.path.isVariableDeclarator() && !imported.has(n))); });
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
  files[f] = { lines: fs.readFileSync(path.join(APP, f), 'utf8').split('\n').length - 1, globals: [...globals].sort(), leaksIIFEName: [...leaks].sort() };
}
const notExposed = [...usedL].filter(n => !exposed.has(n)).sort();
const kNotMoved = [...usedK].filter(n => !ALL.includes(n));
const importedMissing = ALL.filter(n => exposed.has(n) && !imported.has(n));
const report = { task: META.task, equivalent: equiv.every(r => r.same), equiv, lineCheck, exposed: exposed.size, imported: [...imported].sort(), importedMissing, leftDefsInIndex: leftDefs, usedInIndexNotImported, files,
  usedL: [...usedL].sort(), notExposed, usedK: [...usedK].sort(), kNotMoved };
const ok = report.equivalent && lineCheck.length === META.chunks.length && lineCheck.every(x => x.same) && leftDefs.length === 0 && usedInIndexNotImported.length === 0 && notExposed.length === 0 && kNotMoved.length === 0 && importedMissing.length === 0
  && Object.values(files).every(x => x.leaksIIFEName.length === 0 && x.lines <= 800);
report.ok = ok;
console.log(JSON.stringify({ ok, equiv: equiv.map(e => e.name + ':' + e.same + ':' + e.tokensOrig), lineCheck: lineCheck.filter(x => !x.same), leftDefs, usedInIndexNotImported, notExposed, kNotMoved, importedMissing, files }, null, 1));
console.log(ok ? 'OK: 토큰 동일(L.·K. 접두 제외) · 덩어리 줄 동일(주석 포함) · 누수 0 · 미노출 0 · 남은 정의 0 · 안 가져온 사용 0 · 새 파일 800줄 이하' : 'FAIL');
if (OUT) fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
process.exitCode = ok ? 0 : 1;
