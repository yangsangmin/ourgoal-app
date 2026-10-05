'use strict';
// 인라인 스크립트 세포화 P1 구역(#TASK-ES-436~) 검사 — 1차 verify-inline-split-1.js(#TASK-ES-423)를 생성기 메타(gen-inline-p1-meta.json)로 일반화했다:
//  ① 글자: 옮긴 함수마다 이전 전 index.html 의 토큰열과 옮긴 파일의 토큰열이 같은가(차이 허용: 'L.'·'K.' 접두뿐)
//  ①-더: 덩어리마다 옮긴 파일의 줄(주석·빈 줄 포함)을 'L.'·'K.' 접두만 떼고 이전 전 줄과 한 줄씩 맞댄다
//  ①-나머지: 새 index.html 에서 이음매 블록과 새 script 태그 글자를 뺀 것이 「이전 전 index.html 에서 덩어리만 표지 주석 한 줄로 바꾼 것」과 한 줄도 다르지 않은가
//  ② 누수: 옮긴 파일에 IIFE 스코프 이름이 접두 없이 남아(전역으로 새어) 다른 값을 읽는 곳 0, L.<이름> 이 모두 expose 됐는가, K.<이름> 이 모두 같은 키트 세포에 등록됐는가,
//          옮긴 선언이 index.html 에 남지 않았는가, index.html 에서 쓰는 옮긴 이름이 모두 키트에서 가져와졌는가, 새 파일 800줄 이하
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-inline-p1.js <이전 전 index.html> <APP_DIR> <gen-inline-p1-meta.json> <설정 .json> [out.json]
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const [ORIG, APP, META, CFG_FILE, OUT] = process.argv.slice(2);
const meta = JSON.parse(fs.readFileSync(META, 'utf8'));
const CFG = JSON.parse(fs.readFileSync(CFG_FILE, 'utf8'));
const MOVED = {};
for (const ch of meta.chunks) { const f = CFG.cells.find(c => c.key === ch.cell).file; (MOVED[f] = MOVED[f] || []).push(...ch.names); }
const KIT_OF_FILE = Object.fromEntries(CFG.cells.map(c => [c.file, c.kit]));
const KIT_VARS = [...new Set(CFG.cells.map(c => c.kitVar))];
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
const topFns = ast => {
  const body = ast.program.body[0].expression.callee.body.body;
  const m = {};
  for (const x of body) if (x.type === 'FunctionDeclaration') m[x.id.name] = x;
  return m;
};
// ① 글자(토큰)
const oast = parser.parse(inlineCode(ORIG), { sourceType: 'script', tokens: true });
const ofns = topFns(oast);
const equiv = [];
for (const [f, names] of Object.entries(MOVED)) {
  const src = fs.readFileSync(path.join(APP, f), 'utf8');
  const fast = parser.parse(src, { sourceType: 'script', tokens: true });
  const nfns = topFns(fast);
  for (const n of names) {
    if (!ofns[n] || !nfns[n]) { equiv.push({ fn: n, file: f, same: false, missing: { orig: !ofns[n], neu: !nfns[n] } }); continue; }
    const a = norm(oast.tokens.filter(t => t.start >= ofns[n].start && t.end <= ofns[n].end));
    const b = norm(fast.tokens.filter(t => t.start >= nfns[n].start && t.end <= nfns[n].end));
    const same = a.length === b.length && a.every((v, i) => v === b[i]);
    let at = -1; if (!same) for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break; }
    equiv.push({ fn: n, file: f, tokensOrig: a.length, tokensNew: b.length, same, firstDiff: same ? null : { i: at, orig: a.slice(at - 3, at + 5), neu: b.slice(at - 3, at + 5) } });
  }
}
// ①-더: 덩어리 줄 맞대기
const origLines = readLines(ORIG);
const strip = l => l.replace(/(^|[^A-Za-z0-9_$.])[LK]\.(?=[A-Za-z_$])/g, '$1');
const lineCheck = meta.cellChunkLines.map(c => {
  const nl = readLines(path.join(APP, c.file));
  const diffs = [];
  for (let k = 0; k <= c.origEnd - c.origStart; k++) if (strip(nl[c.cellStart - 1 + k]) !== origLines[c.origStart - 1 + k]) diffs.push(k);
  return { file: c.file, names: c.names, origLines: [c.origStart, c.origEnd], cellLines: [c.cellStart, c.cellEnd], lines: c.origEnd - c.origStart + 1, diffLines: diffs.length, firstDiff: diffs.length ? { neu: nl[c.cellStart - 1 + diffs[0]], orig: origLines[c.origStart - 1 + diffs[0]] } : null };
});
// ①-나머지: index.html 의 나머지가 그대로인가
const newIdx = readLines(path.join(APP, 'index.html'));
const seamLines = newIdx.slice(meta.seamRange[0] - 1, meta.seamRange[1]);
let rest = newIdx.slice(0, meta.seamRange[0] - 1).concat(newIdx.slice(meta.seamRange[1]));
const tagHits = {};
rest = rest.map(l => { let x = l; for (const t of meta.tagEdits) if (x.includes(t.tag)) { tagHits[t.file] = (tagHits[t.file] || 0) + 1; x = x.split(t.tag).join(''); } return x; });
const expected = origLines.slice();
for (const m of meta.markers.slice().sort((a, b) => b.lines[0] - a.lines[0])) expected.splice(m.lines[0] - 1, m.lines[1] - m.lines[0] + 1, '@@MARKER:' + m.file);
const MARK_RE = new RegExp('^  /\\* \\[#' + meta.task + '\\] [A-Za-z_$][\\w$ ·]* → (\\S+) 로 옮김\\(인라인 스크립트 세포화 P1( — 구획 주석 포함)?\\) \\*/$');
const restDiffs = [];
if (rest.length !== expected.length) restDiffs.push({ what: '줄 수', rest: rest.length, expected: expected.length });
for (let i = 0; i < Math.min(rest.length, expected.length) && restDiffs.length < 10; i++) {
  if (expected[i].startsWith('@@MARKER:')) { const m = rest[i].match(MARK_RE); if (!m || m[1] !== expected[i].slice(9)) restDiffs.push({ line: i + 1, rest: rest[i], expected: expected[i] }); }
  else if (rest[i] !== expected[i]) restDiffs.push({ line: i + 1, rest: rest[i].slice(0, 200), expected: expected[i].slice(0, 200) });
}
const seamOnlyDeclsAndExpose = seamLines.every(l => l === '' || /^  \/\* =+ \[#/.test(l) || /^     [①②]/.test(l) || /^  var [A-Za-z_$][\w$]* = _\w+Kit\.[A-Za-z_$][\w$]*;$/.test(l) || l === "  window.OurgoalAppScope.expose('index.html', {" || /^    get [A-Za-z_$][\w$]*\(\)\{ return [A-Za-z_$][\w$]*; \}(, set [A-Za-z_$][\w$]*\(v\)\{ [A-Za-z_$][\w$]* = v; \})?,?$/.test(l) || l === '  });');
// ② 누수
const nast = parser.parse(inlineCode(path.join(APP, 'index.html')), { sourceType: 'script' });
let iife; traverse(nast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iifeNames = new Set(Object.keys(iife.scope.bindings));
const exposed = new Set(); const imported = new Set();
iife.traverse({
  CallExpression(p) { const c = p.node.callee; if (c.type === 'MemberExpression' && c.property.name === 'expose' && p.node.arguments[1] && p.node.arguments[1].properties) for (const pr of p.node.arguments[1].properties) if (pr.kind === 'get') exposed.add(pr.key.name); },
  VariableDeclarator(p) { const i = p.node.init; if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && KIT_VARS.includes(i.object.name)) imported.add(p.node.id.name); }
});
const leftDefs = ALL.filter(n => { const b = iife.scope.bindings[n]; return b && (b.path.isFunctionDeclaration() || (b.path.isVariableDeclarator() && !imported.has(n))); });
const usedInIndexNotImported = [];
iife.traverse({ Identifier(p) {
  const nm = p.node.name; if (!ALL.includes(nm) || !p.isReferencedIdentifier()) return;
  const par = p.parent; if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) return;
  const b = p.scope.getBinding(nm);
  if (!b || (b.scope === iife.scope && !imported.has(nm))) usedInIndexNotImported.push(nm + '@' + (p.node.loc && p.node.loc.start.line));
} });
const files = {}; const usedL = new Set(); const kProblems = [];
const registered = {}; // kit → 등록된 이름
for (const [f, names] of Object.entries(MOVED)) for (const n of names) (registered[KIT_OF_FILE[f]] = registered[KIT_OF_FILE[f]] || new Set()).add(n);
for (const f of Object.keys(MOVED)) {
  const fa = parser.parse(fs.readFileSync(path.join(APP, f), 'utf8'), { sourceType: 'script' });
  const leaks = new Set(), globals = new Set();
  traverse(fa, {
    Identifier(p) {
      const par = p.parent;
      if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) {
        if (par.object.type === 'Identifier' && par.object.name === 'L') usedL.add(p.node.name);
        if (par.object.type === 'Identifier' && par.object.name === 'K' && !registered[KIT_OF_FILE[f]].has(p.node.name)) kProblems.push(f + ':K.' + p.node.name);
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
const report = { task: meta.task, equivalent: equiv.every(r => r.same), movedFunctions: ALL.length, equiv, lineCheck, restOfIndexSame: restDiffs.length === 0 && seamOnlyDeclsAndExpose, restDiffs, seamOnlyDeclsAndExpose, seamLines: seamLines.length, tagHits,
  exposed: exposed.size, imported: [...imported].sort(), leftDefsInIndex: leftDefs, usedInIndexNotImported, files, usedL: [...usedL].sort(), notExposed, kProblems };
const ok = report.equivalent && lineCheck.length === meta.cellChunkLines.length && lineCheck.every(x => x.diffLines === 0) && report.restOfIndexSame
  && Object.keys(tagHits).length === meta.tagEdits.length && Object.values(tagHits).every(n => n === 1)
  && leftDefs.length === 0 && usedInIndexNotImported.length === 0 && notExposed.length === 0 && kProblems.length === 0
  && Object.values(files).every(x => x.leaksIIFEName.length === 0 && x.lines <= 800);
report.ok = ok;
console.log(JSON.stringify({ ok, equivalent: report.equivalent, moved: ALL.length, chunks: lineCheck.length, chunkLines: lineCheck.reduce((s, x) => s + x.lines, 0), restOfIndexSame: report.restOfIndexSame, restDiffs: restDiffs.slice(0, 3), leftDefs, usedInIndexNotImported, notExposed, kProblems, files }, null, 1));
console.log(ok ? 'OK: 토큰 동일(L./K. 접두 제외) · 덩어리 줄 동일(주석 포함) · index.html 나머지 그대로 · 누수 0 · 미노출 0 · 남은 정의 0 · 안 가져온 사용 0 · 새 파일 800줄 이하' : 'FAIL');
if (OUT) fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
process.exitCode = ok ? 0 : 1;
