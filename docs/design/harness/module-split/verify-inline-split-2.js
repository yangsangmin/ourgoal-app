'use strict';
// 인라인 스크립트 세포화 2차(#TASK-ES-432) 검사 — 1차 verify-inline-split-1.js(#TASK-ES-423)를 복제하고 옮긴 묶음·키트 변수만 바꿨다:
//  ① 글자: 옮긴 함수마다 이전 전 index.html 의 토큰열과 옮긴 파일의 토큰열이 같은가(차이 허용: 'L.' 접두뿐)
//  ①-더: 묶음을 통째로 옮겼으므로 덩어리 줄(구획 주석·빈 줄 포함)을 'L.' 접두만 떼고 이전 전 줄과 한 줄씩 맞댄다(주석 글자까지 같은가)
//  ② 누수: 옮긴 파일에 IIFE 스코프 이름이 접두 없이 남아(전역으로 새어) 다른 값을 읽는 곳 0, L.<이름> 이 모두 expose 됐는가,
//          옮긴 선언이 index.html 에 남지 않았는가, index.html 에서 쓰는 옮긴 이름이 모두 키트에서 가져와졌는가, K.<이름> 이 모두 키트에 있는가, 새 파일 800줄 이하
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-inline-split-2.js <이전 전 index.html> <APP_DIR>
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const ORIG = process.argv[2], APP = process.argv[3];
const MOVED = {
  'js/tabs/comm/cheer-notify.js': ['totalFeedCheers', 'checkSocialNotifications', 'showSocialNotifyBanner'],
};
const KIT_VARS = ['_commKit'];
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
    if ((vals[i] === 'L' || vals[i] === 'K') && vals[i + 1] === '.' && /^[A-Za-z_$]/.test(vals[i + 2] || '')) { i += 1; continue; }
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
const origLines = readLines(ORIG);
const lineCheck = [];
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
  // ①-더: 덩어리 줄 맞대기. 새 파일 본문(키트 머리 다음 빈 줄 ~ 꼬리 K. 줄 앞 빈 줄)을 빈 줄로 나눈 덩어리마다, 이전 전 index.html 에서 같은 첫 줄을 찾아 한 줄씩 비교한다.
  const nl = src.split('\n');
  const bStart = nl.findIndex(l => /^  var K = global\./.test(l)) + 2;
  let bEnd = nl.findIndex(l => /^  K\.\w+ = \w+;$/.test(l)) - 2;
  const body = nl.slice(bStart, bEnd + 1);
  const strip = l => l.replace(/(^|[^A-Za-z0-9_$.])[LK]\.(?=[A-Za-z_$])/g, '$1');
  // 덩어리 = 구획 주석 줄(`  /* `)로 시작하는 구간
  const starts = []; body.forEach((l, i) => { if (/^  \/\*/.test(l)) starts.push(i); });
  for (let k = 0; k < starts.length; k++) {
    let seg = body.slice(starts[k], k + 1 < starts.length ? starts[k + 1] : body.length);
    while (seg.length && seg[seg.length - 1].trim() === '') seg = seg.slice(0, -1);
    const o = origLines.findIndex((l, i) => l === strip(seg[0]) && origLines[i + 1] === strip(seg[1] || ''));
    const diffs = [];
    seg.forEach((l, i) => { if (strip(l) !== origLines[o + i]) diffs.push(i); });
    lineCheck.push({ file: f, origStartLine: o + 1, lines: seg.length, diffLines: diffs.length, firstDiff: diffs.length ? { neu: seg[diffs[0]], orig: origLines[o + diffs[0]] } : null });
  }
}
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
// K.<이름> 으로 쓰는 것은 꼬리의 키트 등록(K.x = x)뿐이어야 한다 — 옮긴 이름이 아닌 K. 사용 0
const kNotMoved = [...usedK].filter(n => !ALL.includes(n));
const importedMissing = ALL.filter(n => exposed.has(n) && !imported.has(n));
const report = { equivalent: equiv.every(r => r.same), equiv, lineCheck, exposed: exposed.size, imported: [...imported].sort(), importedMissing, leftDefsInIndex: leftDefs, usedInIndexNotImported, files,
  usedL: [...usedL].sort(), notExposed, usedK: [...usedK].sort(), kNotMoved };
const ok = report.equivalent && lineCheck.length === 1 && lineCheck.every(x => x.diffLines === 0 && x.origStartLine > 0) && leftDefs.length === 0 && usedInIndexNotImported.length === 0 && notExposed.length === 0 && kNotMoved.length === 0 && importedMissing.length === 0
  && Object.values(files).every(x => x.leaksIIFEName.length === 0 && x.lines <= 800);
report.ok = ok;
console.log(JSON.stringify(report, null, 1));
console.log(ok ? 'OK: 토큰 동일(L. 접두 제외) · 덩어리 줄 동일(주석 포함) · 누수 0 · 미노출 0 · 남은 정의 0 · 안 가져온 사용 0 · 새 파일 800줄 이하' : 'FAIL');
if (process.env.MODULE_SPLIT_OUT) fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT, 'verify-inline-split-2.json'), JSON.stringify(report, null, 1));
process.exitCode = ok ? 0 : 1;
