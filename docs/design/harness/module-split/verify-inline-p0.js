'use strict';
// 인라인 스크립트 세포화 P0 구역 검사(#TASK-ES-437~) — 1차 verify-inline-split-1.js(#TASK-ES-423)를 생성기 meta 로 돌게 넓힌 것:
//  ① 글자: 옮긴 선언(함수·var)마다 이전 전 index.html 의 토큰열과 옮긴 파일의 토큰열이 같은가(차이 허용: 'L.' 접두뿐)
//  ①-더: 옮긴 덩어리(앞 주석·구획 주석 포함)를 'L.' 접두만 떼고 이전 전 줄과 한 줄씩 맞댄다(주석 글자까지 같은가)
//  ② 누수: 옮긴 파일에 IIFE 스코프 이름이 접두 없이 남아(전역으로 새어) 다른 값을 읽는 곳 0, L.<이름> 이 모두 expose 됐는가,
//          옮긴 선언이 index.html 에 남지 않았는가, index.html 에서 쓰는 옮긴 이름이 모두 키트에서 가져와졌는가, 새 파일 800줄 이하
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-inline-p0.js <이전 전 index.html> <APP_DIR> <gen-inline-p0-meta.json> [out.json]
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const [ORIG, APP, META, OUT] = process.argv.slice(2);
const meta = JSON.parse(fs.readFileSync(META, 'utf8'));
const MOVED = meta.moved;
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
    if (vals[i] === 'L' && vals[i + 1] === '.' && /^[A-Za-z_$]/.test(vals[i + 2] || '')) { i += 1; continue; }
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
const odecl = topDecls(oast.program.body[0].expression.callee.body.body);
const equiv = [];
const origLines = readLines(ORIG);
const lineCheck = [];
const strip = l => l.replace(/(^|[^A-Za-z0-9_$.])L\.(?=[A-Za-z_$])/g, '$1');
for (const [f, names] of Object.entries(MOVED)) {
  const src = fs.readFileSync(path.join(APP, f), 'utf8');
  const fast = parser.parse(src, { sourceType: 'script', tokens: true });
  const ndecl = topDecls(fast.program.body[0].expression.callee.body.body);
  for (const n of names) {
    if (!odecl[n] || !ndecl[n]) { equiv.push({ name: n, file: f, same: false, missing: { orig: !odecl[n], neu: !ndecl[n] } }); continue; }
    const a = norm(oast.tokens.filter(t => t.start >= odecl[n].start && t.end <= odecl[n].end));
    const b = norm(fast.tokens.filter(t => t.start >= ndecl[n].start && t.end <= ndecl[n].end));
    const same = a.length === b.length && a.every((v, i) => v === b[i]);
    let at = -1; if (!same) for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break; }
    equiv.push({ name: n, file: f, tokensOrig: a.length, tokensNew: b.length, same, firstDiff: same ? null : { i: at, orig: a.slice(at - 3, at + 5), neu: b.slice(at - 3, at + 5) } });
  }
  // ①-더: 덩어리 줄 맞대기
  const nl = src.replace(/\r\n/g, '\n').split('\n').map(strip); // 작업 폴더 줄바꿈(CRLF 체크아웃)과 무관하게 맞댄다
  for (const ch of meta.chunks.filter(c => c.cell === f)) {
    const seg = origLines.slice(ch.start - 1, ch.end);
    let at = -1;
    for (let i = 0; i + seg.length <= nl.length; i++) { if (nl[i] === seg[0] && seg.every((l, k) => nl[i + k] === l)) { at = i; break; } }
    lineCheck.push({ file: f, names: ch.names, origLines: ch.start + '~' + ch.end, lines: seg.length, foundAtNewLine: at + 1, same: at >= 0 });
  }
}
// ② 누수
const nast = parser.parse(inlineCode(path.join(APP, 'index.html')), { sourceType: 'script' });
let iife; traverse(nast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iifeNames = new Set(Object.keys(iife.scope.bindings));
const exposed = new Set(); const imported = new Set();
iife.traverse({
  CallExpression(p) { const c = p.node.callee; if (c.type === 'MemberExpression' && c.property.name === 'expose' && p.node.arguments[1] && p.node.arguments[1].properties) for (const pr of p.node.arguments[1].properties) if (pr.kind === 'get') exposed.add(pr.key.name); },
  VariableDeclarator(p) { const i = p.node.init; if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && /^_\w+Kit$/.test(i.object.name) && i.property.name === p.node.id.name) imported.add(p.node.id.name); }
});
const leftDefs = ALL.filter(n => { const b = iife.scope.bindings[n]; return b && (b.path.isFunctionDeclaration() || (b.path.isVariableDeclarator() && !imported.has(n))); });
const usedInIndexNotImported = [];
iife.traverse({ Identifier(p) {
  const nm = p.node.name; if (!ALL.includes(nm) || !p.isReferencedIdentifier()) return;
  const par = p.parent; if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) return;
  const b = p.scope.getBinding(nm);
  if (!b || (b.scope === iife.scope && !imported.has(nm))) usedInIndexNotImported.push(nm + '@' + (p.node.loc && p.node.loc.start.line));
} });
const files = {}; const usedL = new Set();
for (const f of Object.keys(MOVED)) {
  const fa = parser.parse(fs.readFileSync(path.join(APP, f), 'utf8'), { sourceType: 'script' });
  const leaks = new Set(), globals = new Set();
  traverse(fa, {
    Identifier(p) {
      const par = p.parent;
      if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) {
        if (par.object.type === 'Identifier' && par.object.name === 'L') usedL.add(p.node.name);
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
const importedMissing = Object.values(meta.imports).flat().filter(n => !imported.has(n));
const report = { task: meta.task, equivalent: equiv.every(r => r.same), equiv, lineCheck, exposed: exposed.size, imported: [...imported].sort(), importedMissing, leftDefsInIndex: leftDefs, usedInIndexNotImported, files,
  usedL: [...usedL].sort(), notExposed, movedCount: ALL.length, chunkCount: meta.chunks.length };
const ok = report.equivalent && equiv.length === ALL.length && lineCheck.length === meta.chunks.length && lineCheck.every(x => x.same) && leftDefs.length === 0 && usedInIndexNotImported.length === 0 && notExposed.length === 0 && importedMissing.length === 0
  && Object.values(files).every(x => x.leaksIIFEName.length === 0 && x.lines <= 800);
report.ok = ok;
if (OUT) fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ ok, moved: ALL.length, chunks: meta.chunks.length, equivalentFail: equiv.filter(e => !e.same).map(e => e.name), lineFail: lineCheck.filter(x => !x.same), leftDefs, usedInIndexNotImported, notExposed, importedMissing, leaks: Object.fromEntries(Object.entries(files).map(([f, x]) => [f, x.leaksIIFEName])) }, null, 1));
console.log(ok ? 'OK: 토큰 동일(L. 접두 제외) · 덩어리 줄 동일(주석 포함) · 누수 0 · 미노출 0 · 남은 정의 0 · 안 가져온 사용 0 · 새 파일 800줄 이하' : 'FAIL');
process.exitCode = ok ? 0 : 1;
