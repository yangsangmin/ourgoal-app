'use strict';
// #TASK-ES-390 아바타 설정 모달 섹션 7개·기능 카드 세포 이전 — 옮기기 전후 글자·토큰·실행·섹션 경계 검사(작업자 측정, 판정 아님).
//   ① 섹션 6개 함수 몸통(MS 담기 줄·markup 의 return html 뺌, MS./AV. 접두 뗌) = 기준 avatar-system.js 의 그 줄 그대로
//   ② 기능 카드 몸통(접두 없음) = 기준의 옮긴 줄 그대로
//   ③ 되맞추기: 새 avatar-system.js 에서 이음매 2 를 빼고, 안내 주석 자리에 modal/index.js(MS 블록 빼고 섹션 부르는 줄 자리에 섹션 몸통)·기능 카드 몸통을 끼우면
//      기준 avatar-system.js 와 줄 단위로 같다(접두 뗀 뒤) · 토큰열도 같다 — 허용 차이는 MS./AV. 접두뿐
//   ④ Node require: 공개 이름 순서·값 종류·함수 토큰(접두 뗌)·데이터가 기준과 같다(openAvatarModal 은 몸통이 조립자로 바뀌어 ③ 으로 대신 잰다)
//   ⑤ 브라우저 vm(index.html <script> 순서, self 있음·없음): 같은 검사 + window.handle아바타_* 4개가 OurgoalAvatar 의 같은 함수 + 새 전역 0
//   ⑥ 섹션 경계: 섹션 파일마다 자유 이름(그 파일에 선언 없는 이름) ⊆ 기준 avatar-system.js 의 자유 이름(전역) — 모달 지역 이름이 접두 없이 남은 곳 0.
//      MS.<이름> 읽기 ⊆ 조립자 getter ∪ 섹션이 담는 함수, MS.<이름> 대입 = setter 9개(설계)
//   ⑦ 파일 크기: 새 파일 8개·avatar-system.js 각 800줄 이하
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-avatar-modal.js <APP_DIR> <BASE_DIR(git archive 사본)> [out.json]
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = path.resolve(process.argv[2]);
const BASE = path.resolve(process.argv[3]);
const OUT = process.argv[4];
const rd = (d, rel) => fs.readFileSync(path.join(d, rel), 'utf8').replace(/\r\n/g, '\n');
const strip = s => s.replace(/(^|[^A-Za-z0-9_$.])(?:AV|MS)\.(?=[A-Za-z_$])/g, '$1');
const SHARED_MUTABLE = ['selectedType', 'newCustomUrl', 'lastUploadedImg', 'lastUploadedDataUrl', 'currentFeatures', 'chosenTheme', 'periodStart', 'periodEnd', 'currentPersona'];
const SECTIONS = [
  { k: 'markup', file: 'modal/markup.js', fn: 'renderAvatarModalMarkup' },
  { k: 'restore', file: 'modal/bind-craft.js', fn: 'restoreAvatarModalPersona' },
  { k: 'period', file: 'modal/bind-period.js', fn: 'bindAvatarModalPeriod' },
  { k: 'deck', file: 'modal/bind-deck.js', fn: 'bindAvatarModalDeck' },
  { k: 'craft', file: 'modal/bind-craft.js', fn: 'bindAvatarModalCraft' },
  { k: 'persona', file: 'modal/bind-persona.js', fn: 'bindAvatarModalPersona' },
  { k: 'save', file: 'modal/bind-save.js', fn: 'bindAvatarModalSave' },
];
const NEW_FILES = ['feature-cards.js', 'modal/index.js', 'modal/markup.js', 'modal/bind-period.js', 'modal/bind-deck.js', 'modal/bind-craft.js', 'modal/bind-persona.js', 'modal/bind-save.js'];
const MARK = /^  \/\* \[#TASK-ES-390\] (.*) → js\/avatar\/(.*) 로 옮김\(동작 그대로\)\. 이 팩토리 맨 위에서 같은 이름으로 가져온다\. \*\/$/;
const results = [];
let failed = 0;
function check(name, fn) {
  try { const detail = fn(); results.push({ name, ok: true, detail: detail || null }); console.log('  ok · ' + name + (detail ? ' — ' + JSON.stringify(detail).slice(0, 400) : '')); }
  catch (e) { failed++; process.exitCode = 1; results.push({ name, ok: false, error: String(e && e.message || e).slice(0, 400) }); console.error('  실패 · ' + name + '\n      ' + String(e && e.message || e).slice(0, 400)); }
}
const baseSrc = rd(BASE, 'js/avatar-system.js');
const baseLines = baseSrc.split('\n');
const mainSrc = rd(APP, 'js/avatar-system.js');
const mainLines = mainSrc.split('\n');
const fileSrc = {};
for (const f of NEW_FILES) fileSrc[f] = rd(APP, 'js/avatar/' + f);
const nLines = s => { const L = s.split('\n'); return L.length - (L[L.length - 1] === '' ? 1 : 0); };

// 섹션 몸통 뽑기
function sectionBody(sec) {
  const L = fileSrc[sec.file].split('\n');
  const open = L.indexOf('  function ' + sec.fn + '(MS) {');
  assert.ok(open > 0, sec.fn + ' 여는 줄');
  const hdr = L[open - 1];
  const m = /이전 전 줄 (\d+)~(\d+)\)/.exec(hdr);
  assert.ok(m, sec.fn + ' 머리 주석의 이전 전 줄');
  let i = open + 1;
  const exportsN = [];
  while (/^    MS\.([A-Za-z_$][\w$]*) = \1; \/\/ /.test(L[i])) { exportsN.push(/^    MS\.([A-Za-z_$][\w$]*)/.exec(L[i])[1]); i++; }
  let close = i; while (L[close] !== '  }') close++;
  let end = close;
  if (sec.k === 'markup') { assert.strictEqual(L[close - 1], '    return html;', 'markup 끝 return html'); end = close - 1; }
  return { from: +m[1], to: +m[2], body: L.slice(i, end), exportsN };
}
const secB = {};
check('① 섹션 7개 몸통(MS./AV. 접두 뗌) = 기준 avatar-system.js 의 그 줄 그대로', () => {
  const det = {};
  for (const s of SECTIONS) {
    const b = sectionBody(s);
    secB[s.k] = b;
    const expect = baseLines.slice(b.from - 1, b.to);
    const got = b.body.map(strip);
    assert.strictEqual(got.length, expect.length, s.k + ' 줄 수');
    for (let i = 0; i < got.length; i++) assert.strictEqual(got[i], expect[i], s.k + ' ' + (i + 1) + '번째 줄');
    det[s.k] = { lines: expect.length, from: b.from, to: b.to, prefixedLines: b.body.filter(l => /(^|[^A-Za-z0-9_$.])(?:AV|MS)\./.test(l)).length, exports: b.exportsN };
  }
  return det;
});

// 기능 카드 몸통
const fcL = fileSrc['feature-cards.js'].split('\n');
const fcRanges = /이전 전 줄: ([0-9~, ]+)\)/.exec(fileSrc['feature-cards.js'])[1].split(',').map(t => t.trim().split('~').map(Number));
const fcUs = fcL.indexOf("  'use strict';");
let fcTail = fcL.length - 1; while (fcL[fcTail] !== '}));') fcTail--;
let fcK = fcTail - 1; while (/^  AV\.[^ ]+ = [^ ]+;$/.test(fcL[fcK])) fcK--;
const fcBody = fcL.slice(fcUs + 2, fcK);
check('② 기능 카드 몸통 = 기준의 옮긴 줄 그대로(접두 0)', () => {
  const expect = [];
  fcRanges.forEach(([a, b], i) => { if (i) expect.push(''); for (let l = a; l <= b; l++) expect.push(baseLines[l - 1]); });
  assert.strictEqual(fcBody.length, expect.length, '줄 수');
  for (let i = 0; i < expect.length; i++) assert.strictEqual(fcBody[i], expect[i], (i + 1) + '번째 줄');
  assert.strictEqual(fcBody.filter(l => /(^|[^A-Za-z0-9_$.])(?:AV|MS)\./.test(l)).length, 0, '접두 붙은 줄');
  return { lines: expect.length, runs: fcRanges.length, exports: fcTail - 1 - fcK };
});

function tokens(src) {
  const ast = parser.parse(src, { sourceType: 'script', tokens: true });
  return ast.tokens.filter(t => t.type !== 'CommentLine' && t.type !== 'CommentBlock').map(t => (t.type.label || t.type) + ':' + src.slice(t.start, t.end));
}
// modal/index.js 되맞추기
const ixL = fileSrc['modal/index.js'].split('\n');
const CALL = /^ +(?:var html = )?AV\.([A-Za-z]+)\(MS\);(?: \/\* \[#TASK-ES-390\] .* 로 옮김\(동작 그대로\) \*\/)$/;
function rebuildIndex() {
  const us = ixL.indexOf("  'use strict';");
  let tail = ixL.length - 1; while (ixL[tail] !== '}));') tail--;
  let k = tail - 1; while (/^  AV\.[^ ]+ = [^ ]+;$/.test(ixL[k])) k--;
  const body = ixL.slice(us + 2, k);
  const out = [];
  let inMs = false, calls = 0, msBlocks = 0;
  for (const l of body) {
    if (/^ +\/\* \[#TASK-ES-390\] MS [FC] 시작 /.test(l)) { inMs = true; msBlocks++; continue; }
    if (/^ +\/\* \[#TASK-ES-390\] MS [FC] 끝 \*\/$/.test(l)) { inMs = false; continue; }
    if (inMs) continue;
    const m = CALL.exec(l);
    if (m) { const s = SECTIONS.find(x => x.fn === m[1]); assert.ok(s, '섹션 부름 ' + m[1]); out.push(...secB[s.k].body); calls++; continue; }
    out.push(l);
  }
  return { out, calls, msBlocks };
}
let rebuilt = null;
check('③ 되맞추기: 이음매 2 빼고 안내 주석 자리에 modal/index.js(섹션 몸통 끼움)·기능 카드 몸통 = 기준 avatar-system.js(줄·토큰)', () => {
  const ix = rebuildIndex();
  assert.strictEqual(ix.calls, SECTIONS.length, '섹션 부르는 줄 수');
  assert.strictEqual(ix.msBlocks, 2, 'MS 블록 수');
  const h2 = mainLines.findIndex(l => l.startsWith('  /* ============ [#TASK-ES-390] 아바타 부품 이음매 2'));
  let h2End = h2; while (!(mainLines[h2End] === '  }));' && mainLines[h2End - 1].indexOf('get ') >= 0)) h2End++;
  assert.ok(h2 > 0 && h2End > h2, '이음매 2 위치');
  const out = [];
  let mi = 0, fi = 0;
  mainLines.forEach((l, i) => {
    if (i >= h2 && i <= h2End) return;
    const m = MARK.exec(l);
    if (m) {
      if (m[2] === 'modal/index.js') { out.push(...ix.out.map(t => ({ t, mv: true }))); mi++; return; }
      const [a, b] = fcRanges[fi++];
      for (let x = a; x <= b; x++) out.push({ t: fcBody[bodyIdx(a, b, x)], mv: true });
      return;
    }
    out.push({ t: l, mv: false });
  });
  assert.strictEqual(mi, 1, '모달 안내 주석 1개');
  assert.strictEqual(fi, fcRanges.length, '기능 카드 안내 주석 수 = 묶음 수');
  const got = out.map(o => (o.mv ? strip(o.t) : o.t));
  assert.strictEqual(got.length, baseLines.length, '줄 수 ' + got.length + ' vs ' + baseLines.length);
  for (let i = 0; i < got.length; i++) assert.strictEqual(got[i], baseLines[i], (i + 1) + '번째 줄');
  rebuilt = out.map(o => o.t).join('\n');
  const a = tokens(baseSrc), b = tokens(got.join('\n'));
  assert.deepStrictEqual(b, a, '토큰열');
  // 허용 차이(접두) 수
  const pre = tokens(rebuilt);
  return { lines: got.length, tokens: a.length, prefixTokensAdded: pre.length - a.length, headerLines: h2End - h2 + 1, mainLines: nLines(mainSrc) };
});
function bodyIdx(a, b, x) {
  let idx = 0;
  for (const [p, q] of fcRanges) { if (p === a && q === b) return idx + (x - a); idx += (q - p + 1) + 1; }
  throw new Error('범위');
}

// ④·⑤ 실행 비교
function describe(api) {
  const o = {};
  for (const k of Object.keys(api)) {
    const v = api[k];
    if (typeof v === 'function') o[k] = k === 'openAvatarModal' ? 'fn:<조립자 — ③ 에서 잼>' : 'fn:' + tokens('(' + strip(v.toString()) + ')').join(' ');
    else o[k] = 'val:' + JSON.stringify(v);
  }
  return o;
}
function cmp(a, b, label) {
  assert.deepStrictEqual(Object.keys(b), Object.keys(a), label + ' 공개 이름·순서');
  for (const k of Object.keys(a)) assert.strictEqual(b[k], a[k], label + ' ' + k);
}
const baseApi = require(path.join(BASE, 'js', 'avatar-system.js'));
const afterApi = require(path.join(APP, 'js', 'avatar-system.js'));
check('④ Node: 공개 이름 ' + Object.keys(baseApi).length + '개 순서·함수 토큰·데이터 = 기준', () => {
  cmp(describe(baseApi), describe(afterApi), 'Node');
  assert.strictEqual(typeof afterApi.openAvatarModal, 'function');
  return { names: Object.keys(afterApi).length, functions: Object.values(afterApi).filter(v => typeof v === 'function').length };
});
function scriptOrder(dir) {
  const html = rd(dir, 'index.html');
  return [...html.matchAll(/<script[^>]*\bsrc="(js\/(?:avatar-system|avatar\/[^"?]+|data\/avatar-personas\/[^"?]+)\.js)(?:\?[^"]*)?"/g)].map(m => m[1]);
}
function runBrowser(dir, withSelf) {
  const ctx = { console, setTimeout, clearTimeout };
  if (withSelf) { ctx.self = ctx; ctx.window = ctx; } else { ctx.window = {}; }
  vm.createContext(ctx);
  for (const rel of scriptOrder(dir)) vm.runInContext(rd(dir, rel), ctx, { filename: rel });
  return ctx;
}
for (const withSelf of [true, false]) {
  check('⑤ 브라우저 vm(index.html 순서, self ' + (withSelf ? '있음' : '없음') + '): 공개 이름·함수 토큰·데이터 = 기준, window.handle아바타_* 4개 같은 함수, 새 전역 0', () => {
    const b = runBrowser(BASE, withSelf), a = runBrowser(APP, withSelf);
    cmp(describe(b.OurgoalAvatar), describe(a.OurgoalAvatar), '브라우저');
    const H = ['handle아바타_Item26Action', 'handle아바타_Item32Action', 'handle아바타_Item41Action', 'handle아바타_Item42Action'];
    for (const h of H) {
      assert.strictEqual(typeof a.window[h], typeof b.window[h], h + ' 종류');
      if (typeof b.window[h] === 'function') assert.strictEqual(a.window[h], a.OurgoalAvatar[h], h + ' = OurgoalAvatar.' + h);
    }
    const skip = ['console', 'setTimeout', 'clearTimeout', 'self', 'window'];
    const gA = Object.keys(a).filter(k => !skip.includes(k)).sort(), gB = Object.keys(b).filter(k => !skip.includes(k)).sort();
    assert.deepStrictEqual(gA, gB, '전역 이름 목록');
    return { scripts: scriptOrder(APP).length, baseScripts: scriptOrder(BASE).length, globals: gA };
  });
}

// ⑥ 섹션 경계
function freeNames(src) {
  const ast = parser.parse(src, { sourceType: 'script' });
  const free = new Set();
  traverse(ast, {
    Identifier(p) {
      const par = p.parent;
      if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
      if ((p.parentPath.isObjectProperty() || p.parentPath.isObjectMethod()) && par.key === p.node && !par.computed) return;
      if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
      if (!p.isReferencedIdentifier() && !(p.parentPath.isAssignmentExpression() && par.left === p.node) && !p.parentPath.isUpdateExpression()) return;
      if (!p.scope.hasBinding(p.node.name, true)) free.add(p.node.name);
    }
  });
  return free;
}
function msAccess(src) {
  const ast = parser.parse(src, { sourceType: 'script' });
  const reads = new Set(), writes = new Set();
  traverse(ast, {
    MemberExpression(p) {
      if (p.node.object.type !== 'Identifier' || p.node.object.name !== 'MS' || p.node.computed) return;
      const nm = p.node.property.name;
      const w = (p.parentPath.isAssignmentExpression() && p.parent.left === p.node) || p.parentPath.isUpdateExpression();
      (w ? writes : reads).add(nm);
    }
  });
  return { reads, writes };
}
check('⑥ 섹션 경계: 섹션 파일 자유 이름 ⊆ 기준 전역 · MS 읽기 ⊆ getter∪섹션 함수 · MS 대입 = setter 9개', () => {
  const baseFree = freeNames(baseSrc);
  const det = { files: {} };
  // 조립자 getter·setter 목록
  const ix = fileSrc['modal/index.js'];
  const getters = new Set([...ix.matchAll(/^ +([A-Za-z_$][\w$]*): \{ get: function \(\) \{ return \1; \}/gm)].map(m => m[1]));
  const setters = new Set([...ix.matchAll(/^ +([A-Za-z_$][\w$]*): \{ get: function \(\) \{ return \1; \}, set: function \(v\) \{ \1 = v; \} \}/gm)].map(m => m[1]));
  const secExports = new Set(Object.values(secB).flatMap(b => b.exportsN));
  const allReads = new Set(), allWrites = new Set();
  for (const f of NEW_FILES) {
    const fr = [...freeNames(fileSrc[f])].filter(n => !baseFree.has(n));
    assert.deepStrictEqual(fr, [], f + ' 에 기준에 없던 자유 이름(접두 없이 남은 지역 이름)');
    const { reads, writes } = msAccess(fileSrc[f]);
    reads.forEach(n => allReads.add(n)); writes.forEach(n => allWrites.add(n));
    det.files[f] = { lines: nLines(fileSrc[f]), msReads: reads.size, msWrites: [...writes].sort() };
  }
  for (const n of allReads) assert.ok(getters.has(n) || secExports.has(n), 'MS.' + n + ' 읽기에 getter·섹션 함수 없음');
  const plainWrites = [...allWrites].filter(n => !secExports.has(n)).sort();
  assert.deepStrictEqual(plainWrites, SHARED_MUTABLE.slice().sort(), 'MS 대입 이름 = 설계 9개');
  assert.deepStrictEqual([...setters].sort(), SHARED_MUTABLE.slice().sort(), 'setter = 설계 9개');
  for (const n of secExports) assert.ok(!getters.has(n), '섹션 함수 이름이 getter 와 겹침 ' + n);
  det.getters = getters.size; det.setters = [...setters].sort(); det.sectionFunctions = [...secExports].sort(); det.msNamesRead = allReads.size;
  return det;
});
check('⑦ 파일 크기: 새 파일 8개·avatar-system.js 각 800줄 이하', () => {
  const o = {};
  for (const f of NEW_FILES) { const n = nLines(fileSrc[f]); assert.ok(n <= 800, f + ' ' + n); o['js/avatar/' + f] = n; }
  o['js/avatar-system.js'] = nLines(mainSrc);
  assert.ok(o['js/avatar-system.js'] <= 800, 'avatar-system.js ' + o['js/avatar-system.js']);
  o['base js/avatar-system.js'] = nLines(baseSrc);
  return o;
});
console.log('[verify-avatar-modal] ' + (results.length - failed) + ' passed · ' + failed + ' failed');
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ task: 'TASK-ES-390', base: '09f4a99 (git archive)', results }, null, 2) + '\n', 'utf8');
