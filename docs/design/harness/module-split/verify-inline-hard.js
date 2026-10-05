'use strict';
// 인라인 어려움 묶음 검사(#TASK-ES-439) — 생성기(gen-inline-hard.js)의 분류를 다시 쓰지 않고, 결과 파일만 읽어 따로 잰다.
//  ① 글자(토큰): 세포 파일의 옮긴 함수·상수마다 이전 전 index.html 의 같은 이름 최상위 선언과 토큰열이 같은가(차이 허용: 'L.'·'K.' 접두뿐).
//                감싼 함수(로드 중 문)는 본문 문(statement)들이 이전 전 같은 줄 구간의 최상위 문과 토큰열이 같은가.
//  ② 덩어리 줄: 세포 파일의 생성기 표지(`/* ---- 이전 전 index.html a~b줄 ---- */`) 아래 줄들이 이전 전 a~b 줄과 한 줄씩 같은가(접두만 떼고, 주석 포함).
//  ③ 남은 글자: 이전 전 IIFE 토큰열에서 옮긴 구간을 뺀 것 = 새 IIFE 토큰열에서 이번 이음매(머리 블록·표지·부르는 줄)를 뺀 것.
//                → 남긴 문(상태 변수·window 노출·짧은 로드 중 문)이 글자 그대로 같은 순서로 남았고, 그 밖의 index.html 은 손대지 않았다.
//  ④ 누수·통로: 세포 파일에서 IIFE 이름이 접두 없이 남아 전역으로 새는 곳 0 · L.<이름> 은 모두 expose getter 가 있다 · L.<이름> 에 대입하면 setter 가 있다
//                · 옮긴 이름이 index.html 에 선언으로 남지 않았다 · index.html 이 쓰는 옮긴 이름은 모두 키트에서 가져왔다 · 새 파일 800줄 이하.
//  ⑤ 함수 최상위 this/arguments 0(헌법 CELL_SPLIT 5).
//  ⑥ 이중 처리기 0: 이전 전 IIFE 의 addEventListener·on<이벤트> 대입 수 = 새 IIFE + 새 세포 파일의 수(옮긴 등록이 두 곳에 있지 않다).
//  ⑦ 로드 중 순서: 감싼 함수를 부르는 줄이 index.html 에서 이전 전 그 문이 있던 자리(앞뒤 남은 문 사이)에 있다(③ 이 같은 순서를 보장, 여기서는 수만 센다).
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-inline-hard.js <이전 전 index.html> <APP_DIR> <설정.json>
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const [ORIG, APP, CFGF] = process.argv.slice(2);
const CFG = JSON.parse(fs.readFileSync(CFGF, 'utf8'));
const TAG = '#' + CFG.task;
const FILES = CFG.cells.map(c => c.file).filter(f => fs.existsSync(path.join(APP, f)));
const readLines = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n').split('\n');
const iifeOf = file => {
  const lines = readLines(file);
  let s = -1, e = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
  return { lines, s, e, code: lines.slice(s, e).join('\n') };
};
const tokVal = t => (t.type.label === 'name' || t.type.keyword) ? String(t.value) : (t.value !== undefined ? t.type.label + ':' + String(t.value) : t.type.label);
const norm = toks => {
  const v = toks.map(tokVal), out = [];
  for (let i = 0; i < v.length; i++) { if ((v[i] === 'L' || v[i] === 'K') && v[i + 1] === '.' && /^[A-Za-z_$]/.test(v[i + 2] || '')) { i += 1; continue; } out.push(v[i]); }
  return out;
};
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const strip = l => l.replace(/(^|[^A-Za-z0-9_$.])[LK]\.(?=[A-Za-z_$])/g, '$1');

const O = iifeOf(ORIG);
const oast = parser.parse(O.code, { sourceType: 'script', tokens: true, ranges: true });
const obody = oast.program.body[0].expression.callee.body.body;
const oTop = {}; for (const x of obody) { if (x.type === 'FunctionDeclaration') oTop[x.id.name] = x; if (x.type === 'VariableDeclaration') for (const d of x.declarations) oTop[d.id.name] = x; }
const oLine = n => n.loc.start.line + O.s, oLineE = n => n.loc.end.line + O.s;

// ①② 세포 파일
const equiv = [], lineCheck = [], movedRanges = [], files = {};
const usedL = new Set(), assignedL = new Set(), cellNames = new Set(), wrapNames = new Set();
let cellListeners = 0, thisArgs = [];
for (const f of FILES) {
  const src = fs.readFileSync(path.join(APP, f), 'utf8').replace(/\r\n/g, '\n'); // #TASK-ES-471: 체크아웃 줄 끝(CRLF)과 무관하게(여러 줄 템플릿 글자 토큰)
  const fl = src.replace(/\r\n/g, '\n').split('\n');
  const fast = parser.parse(src, { sourceType: 'script', tokens: true, ranges: true });
  const cbody = fast.program.body[0].expression.callee.body.body;
  // ② 표지 구간
  for (let i = 0; i < fl.length; i++) {
    const m = fl[i].match(/^  \/\* ---- 이전 전 index\.html (\d+)~(\d+)줄\(#[\w-]+ 생성기 표지\) ---- \*\/$/);
    if (!m) continue;
    const a = +m[1], b = +m[2];
    let j = i + 1;
    let wrap = null;
    const w = fl[j].match(/^  function (\w+)\(\) \{ \/\* \[#[\w-]+\] 로드 중 문/);
    if (w) { wrap = w[1]; j++; }
    const seg = fl.slice(j, j + (b - a + 1));
    const diffs = []; seg.forEach((l, k) => { if (strip(l) !== O.lines[a - 1 + k]) diffs.push(k); });
    const closeOk = !wrap || fl[j + (b - a + 1)] === '  } /* ' + wrap + ' */';
    lineCheck.push({ file: f, origLines: [a, b], wrap, diffLines: diffs.length, closeOk, firstDiff: diffs.length ? { neu: seg[diffs[0]], orig: O.lines[a - 1 + diffs[0]] } : null });
    movedRanges.push({ a, b, wrap, file: f });
  }
  // ① 토큰
  for (const st of cbody) {
    if (st.type === 'FunctionDeclaration') {
      const n = st.id.name;
      const fnToks = norm(fast.tokens.filter(t => t.start >= st.start && t.end <= st.end));
      if (wrapNames.has(n) || movedRanges.some(r => r.wrap === n && r.file === f)) {
        wrapNames.add(n); cellNames.add(n);
        const r = movedRanges.find(x => x.wrap === n && x.file === f);
        const inner = st.body.body;
        const os = obody.filter(x => oLine(x) >= r.a && oLineE(x) <= r.b);
        const a = norm(oast.tokens.filter(t => os.length && t.start >= os[0].start && t.end <= os[os.length - 1].end));
        const b = norm(fast.tokens.filter(t => inner.length && t.start >= inner[0].start && t.end <= inner[inner.length - 1].end));
        equiv.push({ name: n, file: f, kind: 'wrap', stmts: os.length + '/' + inner.length, tokensOrig: a.length, tokensNew: b.length, same: os.length === inner.length && same(a, b) });
        continue;
      }
      cellNames.add(n);
      const o = oTop[n];
      const a = o ? norm(oast.tokens.filter(t => t.start >= o.start && t.end <= o.end)) : [];
      equiv.push({ name: n, file: f, kind: 'function', tokensOrig: a.length, tokensNew: fnToks.length, same: !!o && same(a, fnToks) });
    } else if (st.type === 'VariableDeclaration' && !st.declarations.some(d => d.id.name === 'L' || d.id.name === 'K')) {
      const n = st.declarations[0].id.name; cellNames.add(n);
      const o = oTop[n];
      const a = o ? norm(oast.tokens.filter(t => t.start >= o.start && t.end <= o.end)) : [];
      const b = norm(fast.tokens.filter(t => t.start >= st.start && t.end <= st.end));
      equiv.push({ name: n, file: f, kind: 'var', tokensOrig: a.length, tokensNew: b.length, same: !!o && same(a, b) });
    }
  }
  // ④ 누수 · L 사용 · ⑤ this/arguments · ⑥ 처리기 수
  const leaks = new Set(), globals = new Set();
  traverse(fast, {
    Identifier(p) {
      const par = p.parent;
      if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) {
        if (par.object.type === 'Identifier' && par.object.name === 'L') {
          usedL.add(p.node.name);
          const gp = p.parentPath.parentPath;
          if ((gp.isAssignmentExpression() && gp.node.left === par) || gp.isUpdateExpression()) assignedL.add(p.node.name);
        }
        return;
      }
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node) return;
      if (!p.isReferencedIdentifier() && !(p.parentPath.isAssignmentExpression() && par.left === p.node)) return;
      if (p.scope.getBinding(p.node.name)) return;
      globals.add(p.node.name);
    },
    CallExpression(p) { const c = p.node.callee; if (c.type === 'MemberExpression' && !c.computed && c.property.name === 'addEventListener') cellListeners++; },
    AssignmentExpression(p) { const l = p.node.left; if (l.type === 'MemberExpression' && !l.computed && /^on[a-z]+$/.test(l.property.name)) cellListeners++; },
  });
  traverse(fast, { FunctionDeclaration(fp) {
    if (!cbody.includes(fp.node) || wrapNames.has(fp.node.id.name)) return;
    let bad = 0;
    fp.get('body').traverse({ Function(q) { if (!q.isArrowFunctionExpression()) q.skip(); }, ThisExpression() { bad++; }, Identifier(q) { if (q.node.name === 'arguments' && q.isReferencedIdentifier()) bad++; } });
    if (bad) thisArgs.push(fp.node.id.name);
  } });
  files[f] = { lines: fl.length - 1, globals: [...globals].sort(), leaks };
}
// ③ 남은 글자 · ④ index 쪽
const N = iifeOf(path.join(APP, 'index.html'));
const nast = parser.parse(N.code, { sourceType: 'script', tokens: true, ranges: true });
let iife; traverse(nast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iifeNames = new Set(Object.keys(iife.scope.bindings));
for (const f of FILES) { files[f].leaksIIFEName = files[f].globals.filter(n => iifeNames.has(n)); delete files[f].leaks; }
// 이번 이음매 줄: TAG 를 담은 줄(표지·부르는 줄·가져오기 머리 주석) + 이 구역 자리 표지 아래 줄(다음 자리 표지 전까지 — 양쪽에서 같이 뺀다: 앞선 PR 이 같은 자리에 넣은 줄도 대칭으로 빠진다)
// 자리 표지·머리 설명은 주석뿐이라 토큰이 없다.
const slotLines = (ls, slot) => {
  const set = new Set();
  const ANCHOR = '  /* [어려움 이음매 자리 ';
  const i = ls.findIndex(l => l.startsWith(ANCHOR + slot + ' ') || l.startsWith(ANCHOR + slot + ']'));
  if (i < 0) return set;
  for (let j = i + 1; j < ls.length && !ls[j].startsWith(ANCHOR) && ls[j].trim() !== ''; j++) set.add(j + 1);
  return set;
};
const seamLine = slotLines(N.lines, CFG.slot);
N.lines.forEach((l, i) => { if (l.includes('[' + TAG + ']')) seamLine.add(i + 1); });
const origSlot = slotLines(O.lines, CFG.slot);
const isCode = t => typeof t.type !== 'string'; // 주석 토큰(CommentBlock·CommentLine)은 남은 글자 비교에서 뺀다(표지·자리 표지 주석)
const origKeep = oast.tokens.filter(isCode).filter(t => { const l = t.loc.start.line + O.s; return !origSlot.has(l) && !movedRanges.some(r => l >= r.a && l <= r.b); }).map(tokVal);
const newKeep = nast.tokens.filter(isCode).filter(t => !seamLine.has(t.loc.start.line + N.s)).map(tokVal);
let restDiff = -1; for (let i = 0; i < Math.max(origKeep.length, newKeep.length); i++) if (origKeep[i] !== newKeep[i]) { restDiff = i; break; }
const restSame = restDiff < 0;
// expose · 가져오기
const getters = new Set(), setters = new Set(), imported = new Set();
const kitVars = new Set(CFG.cells.map(c => c.kitVar));
iife.traverse({
  CallExpression(p) { const c = p.node.callee; if (c.type === 'MemberExpression' && c.property.name === 'expose' && p.node.arguments[1] && p.node.arguments[1].properties) for (const pr of p.node.arguments[1].properties) { if (pr.kind === 'get') getters.add(pr.key.name); if (pr.kind === 'set') setters.add(pr.key.name); } },
  VariableDeclarator(p) { const i = p.node.init; if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && kitVars.has(i.object.name)) imported.add(p.node.id.name); },
});
// ⑧ 키트 변수 순서(#TASK-ES-521, 작업참고 L046): 가져오기 줄(var X = _키트.X)이 그 키트 변수 선언(var _키트 = window.K)보다 앞이면 로드 때 _키트 가 undefined 라 IIFE 머리가 멈춘다 — 이름·토큰 검사로는 안 잡혀 따로 잰다.
const kitDeclAt = {}, importAt = [];
iife.traverse({ VariableDeclarator(p) { const i = p.node.init, id = p.node.id.name; if (kitVars.has(id) && i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && i.object.name === 'window') kitDeclAt[id] = Math.min(kitDeclAt[id] == null ? Infinity : kitDeclAt[id], p.node.start); if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && kitVars.has(i.object.name)) importAt.push({ name: id, kit: i.object.name, start: p.node.start, line: p.node.loc.start.line + N.s }); } });
const importBeforeKit = importAt.filter(x => !(kitDeclAt[x.kit] < x.start)).map(x => x.name + '@' + x.line + '(' + x.kit + ')');
const leftDefs = [...cellNames].filter(n => { const b = iife.scope.bindings[n]; return b && (b.path.isFunctionDeclaration() || (b.path.isVariableDeclarator() && !imported.has(n))); });
const usedInIndexNotImported = [];
iife.traverse({ Identifier(p) {
  const nm = p.node.name; if (!cellNames.has(nm) || !p.isReferencedIdentifier()) return;
  const par = p.parent; if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) return;
  const b = p.scope.getBinding(nm);
  if (!b || (b.scope === iife.scope && !imported.has(nm))) usedInIndexNotImported.push(nm + '@' + (p.node.loc.start.line + N.s));
} });
const notExposed = [...usedL].filter(n => !getters.has(n)).sort();
const noSetter = [...assignedL].filter(n => !setters.has(n)).sort();
// ⑥ 처리기 수
const countL = (astRoot) => { let c = 0; traverse(astRoot, { CallExpression(p) { const x = p.node.callee; if (x.type === 'MemberExpression' && !x.computed && x.property.name === 'addEventListener') c++; }, AssignmentExpression(p) { const l = p.node.left; if (l.type === 'MemberExpression' && !l.computed && /^on[a-z]+$/.test(l.property.name)) c++; } }); return c; };
const listeners = { origIIFE: countL(oast), newIIFE: countL(nast), cells: cellListeners };
listeners.same = listeners.origIIFE === listeners.newIIFE + listeners.cells;
// ⑦ 부르는 줄
const callLines = N.lines.map((l, i) => ({ l, i })).filter(x => /^  (\w+)\(\); \/\* \[#[\w-]+\] 로드 중 문/.test(x.l)).map(x => ({ line: x.i + 1, fn: x.l.trim().split('(')[0] }));
const callsOk = [...wrapNames].every(n => callLines.filter(c => c.fn === n).length === 1);

const report = {
  equivalent: equiv.length > 0 && equiv.every(r => r.same), equiv, lineCheck, restSame, restDiff: restSame ? null : { i: restDiff, orig: origKeep.slice(restDiff - 3, restDiff + 6), neu: newKeep.slice(restDiff - 3, restDiff + 6) },
  tokens: { origRest: origKeep.length, newRest: newKeep.length },
  imported: [...imported].sort(), leftDefsInIndex: leftDefs, usedInIndexNotImported, usedL: [...usedL].sort(), notExposed, assignedL: [...assignedL].sort(), noSetter,
  thisArgs, listeners, wrapCalls: callLines, callsOk, importBeforeKit, files,
};
report.ok = report.equivalent && lineCheck.length > 0 && lineCheck.every(x => x.diffLines === 0 && x.closeOk) && restSame && leftDefs.length === 0 && usedInIndexNotImported.length === 0
  && notExposed.length === 0 && noSetter.length === 0 && thisArgs.length === 0 && listeners.same && callsOk && importBeforeKit.length === 0
  && Object.values(files).every(x => x.leaksIIFEName.length === 0 && x.lines <= 800);
console.log(JSON.stringify(report, null, 1));
console.log(report.ok ? 'OK: 토큰 동일(접두 제외) · 덩어리 줄 동일 · 남은 글자 동일 · 누수 0 · 미노출 0 · setter 빠짐 0 · 남은 정의 0 · 안 가져온 사용 0 · this/arguments 0 · 이중 처리기 0 · 키트 변수 뒤 가져오기 · 800줄 이하' : 'FAIL');
if (process.env.MODULE_SPLIT_OUT) fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT, 'verify-inline-hard.json'), JSON.stringify(report, null, 1));
process.exitCode = report.ok ? 0 : 1;
