'use strict';
// #TASK-ES-389 아바타 로직 세포 5개 이전 — 옮기기 전후 글자·토큰·실행 동일성 검사(작업자 측정, 판정 아님).
//   ① 글자: 부품 파일 몸통(AV. 접두를 뗀 것) = 기준 avatar-system.js 의 옮긴 줄 그대로(묶음 사이 빈 줄 1개)
//   ② 글자: 새 avatar-system.js 에서 이음매 머리·안내 주석 줄을 뺀 것 = 기준에서 옮긴 줄을 뺀 것
//   ③ 토큰: 기준 전체 토큰열 = (새 avatar-system.js 머리 뺀 것 + 부품 몸통, 원래 자리에 끼운 것) 토큰열 — 허용 차이는 AV. 접두뿐
//   ④ 실행: Node require — Object.keys(OurgoalAvatar) 순서·각 값의 종류·함수 toString 토큰(AV. 접두 뗌)·데이터 deepStrictEqual 이 기준과 같다
//   ⑤ 실행: 브라우저 vm(index.html <script> 순서, self 있음·없음) — 같은 검사 + window.handle아바타_* 4개가 OurgoalAvatar 의 같은 함수
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-avatar-logic.js <APP_DIR> <BASE_DIR(git archive 사본)> [out.json]
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const parser = require('@babel/parser');

const APP = path.resolve(process.argv[2]);
const BASE = path.resolve(process.argv[3]);
const OUT = process.argv[4];
const rd = (d, rel) => fs.readFileSync(path.join(d, rel), 'utf8').replace(/\r\n/g, '\n');
const strip = s => s.replace(/(^|[^A-Za-z0-9_$.])AV\.(?=[A-Za-z_$])/g, '$1');
const PARTS = ['themes', 'render', 'craft-engine', 'wallet', 'dynamic-album'];
const MARK = /^  \/\* \[#TASK-ES-389\] .* 로 옮김\(동작 그대로\)\. 이 팩토리 맨 위에서 같은 이름으로 가져온다\. \*\/$/;
const results = [];
let failed = 0;
function check(name, fn) {
  try { const detail = fn(); results.push({ name, ok: true, detail: detail || null }); console.log('  ok · ' + name + (detail ? ' — ' + JSON.stringify(detail) : '')); }
  catch (e) { failed++; process.exitCode = 1; results.push({ name, ok: false, error: String(e && e.message || e).slice(0, 400) }); console.error('  실패 · ' + name + '\n      ' + String(e && e.message || e).slice(0, 400)); }
}

const baseSrc = rd(BASE, 'js/avatar-system.js');
const baseLines = baseSrc.split('\n');
const mainSrc = rd(APP, 'js/avatar-system.js');
const mainLines = mainSrc.split('\n');
// 부품 몸통: 머리 주석의 「이전 전 줄: a~b, c~d」 와 'use strict'; 다음 빈 줄 ~ AV.<이름> = 줄 앞 빈 줄
const parts = PARTS.map(d => {
  const src = rd(APP, 'js/avatar/' + d + '.js');
  const L = src.split('\n');
  const rangesTxt = /이전 전 줄: ([0-9~, ]+)\)/.exec(src)[1];
  const ranges = rangesTxt.split(',').map(t => t.trim().split('~').map(Number));
  const us = L.indexOf("  'use strict';");
  let tail = L.length - 1; while (L[tail] !== '}));') tail--;
  let k = tail - 1; while (/^  AV\.[^ ]+ = [^ ]+;$/.test(L[k])) k--;
  const body = L.slice(us + 2, k); // us+1 은 빈 줄, k 는 AV. 줄 앞 빈 줄
  const exportsN = tail - 1 - k;
  return { d, src, L, ranges, body, exportsN, lines: L.length - (L[L.length - 1] === '' ? 1 : 0) };
});

check('① 부품 5개 몸통(AV. 접두 뗌) = 기준 avatar-system.js 옮긴 줄 그대로', () => {
  const det = {};
  for (const p of parts) {
    const expect = [];
    p.ranges.forEach(([a, b], i) => { if (i) expect.push(''); for (let l = a; l <= b; l++) expect.push(baseLines[l - 1]); });
    const got = p.body.map(strip);
    assert.strictEqual(got.length, expect.length, p.d + ' 줄 수');
    for (let i = 0; i < got.length; i++) assert.strictEqual(got[i], expect[i], p.d + ' 몸통 ' + (i + 1) + '번째 줄');
    det[p.d] = { movedLines: expect.length, avPrefixed: p.body.filter(l => /(^|[^A-Za-z0-9_$.])AV\./.test(l)).length, exports: p.exportsN, fileLines: p.lines };
  }
  return det;
});

const moved = new Set();
for (const p of parts) for (const [a, b] of p.ranges) for (let l = a; l <= b; l++) moved.add(l);
const hdrStart = mainLines.findIndex(l => l.startsWith('  /* ============ [#TASK-ES-389] 아바타 부품 이음매'));
const hdrEnd = mainLines.findIndex((l, i) => i > hdrStart && l === '  }));');
check('② 새 avatar-system.js(이음매 머리·안내 주석 뺀 것) = 기준에서 옮긴 줄 뺀 것', () => {
  assert.ok(hdrStart > 0 && hdrEnd > hdrStart, '이음매 머리 위치');
  const got = mainLines.filter((l, i) => !(i >= hdrStart && i <= hdrEnd) && !MARK.test(l));
  const expect = baseLines.filter((l, i) => !moved.has(i + 1));
  assert.strictEqual(got.length, expect.length, '줄 수 ' + got.length + ' vs ' + expect.length);
  for (let i = 0; i < got.length; i++) assert.strictEqual(got[i], expect[i], (i + 1) + '번째 줄');
  return { headerLines: hdrEnd - hdrStart + 1, markers: mainLines.filter(l => MARK.test(l)).length, keptLines: got.length, movedLines: moved.size, mainLines: mainLines.length - (mainLines[mainLines.length - 1] === '' ? 1 : 0) };
});

function tokens(src) {
  const ast = parser.parse(src, { sourceType: 'script', tokens: true });
  return ast.tokens.filter(t => t.type !== 'CommentLine' && t.type !== 'CommentBlock').map(t => (t.type.label || t.type) + ':' + src.slice(t.start, t.end));
}
check('③ 토큰열: 기준 avatar-system.js = 새 avatar-system.js(머리 뺌) 의 안내 주석 자리에 부품 몸통(AV. 뗌)을 끼운 것', () => {
  // 안내 주석은 묶음마다 하나 — 부품 머리 「이전 전 줄」 순서로 같은 묶음을 끼운다
  const runs = [];
  for (const p of parts) for (const [a, b] of p.ranges) runs.push({ a, b, d: p.d });
  runs.sort((x, y) => x.a - y.a);
  const out = [];
  let ri = 0;
  mainLines.forEach((l, i) => {
    if (i >= hdrStart && i <= hdrEnd) return;
    if (MARK.test(l)) {
      const r = runs[ri++];
      assert.ok(l.indexOf('js/avatar/' + r.d + '.js') > 0, '안내 주석 ' + ri + ' 의 부품 = ' + r.d);
      for (let k = r.a; k <= r.b; k++) out.push(strip(parts.find(p => p.d === r.d).body[bodyIndex(r, k)]));
      return;
    }
    out.push(l);
  });
  assert.strictEqual(ri, runs.length, '안내 주석 수 = 묶음 수');
  const a = tokens(baseSrc), b = tokens(out.join('\n'));
  assert.strictEqual(b.length, a.length, '토큰 수');
  for (let i = 0; i < a.length; i++) assert.strictEqual(b[i], a[i], (i + 1) + '번째 토큰');
  return { tokens: a.length, runs: runs.length };
});
function bodyIndex(r, line) {
  const p = parts.find(x => x.d === r.d);
  let idx = 0;
  for (const [a, b] of p.ranges) { if (line >= a && line <= b) return idx + (line - a); idx += (b - a + 1) + 1; }
  throw new Error('줄 ' + line);
}

// ④·⑤ 실행 비교
function describe(api) {
  const o = {};
  for (const k of Object.keys(api)) {
    const v = api[k];
    if (typeof v === 'function') o[k] = 'fn:' + tokens('(' + strip(v.toString()) + ')').join(' ');
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
const baseDesc = describe(baseApi);
check('④ Node: 공개 이름 ' + Object.keys(baseApi).length + '개 순서·함수 토큰·데이터 = 기준', () => {
  cmp(baseDesc, describe(afterApi), 'Node');
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
  check('⑤ 브라우저 vm(index.html 순서, self ' + (withSelf ? '있음' : '없음') + '): 공개 이름·함수 토큰·데이터 = 기준, window.handle아바타_* 4개 같은 함수', () => {
    const b = runBrowser(BASE, withSelf), a = runBrowser(APP, withSelf);
    cmp(describe(b.OurgoalAvatar), describe(a.OurgoalAvatar), '브라우저');
    const H = ['handle아바타_Item26Action', 'handle아바타_Item32Action', 'handle아바타_Item41Action', 'handle아바타_Item42Action'];
    for (const h of H) {
      assert.strictEqual(typeof a.window[h], typeof b.window[h], h + ' 종류');
      if (typeof b.window[h] === 'function') assert.strictEqual(a.window[h], a.OurgoalAvatar[h], h + ' = OurgoalAvatar.' + h);
    }
    const skip = ['console', 'setTimeout', 'clearTimeout', 'self', 'window'];
    const gA = Object.keys(a).filter(k => !skip.includes(k)).sort(), gB = Object.keys(b).filter(k => !skip.includes(k)).sort();
    const added = gA.filter(k => !gB.includes(k)), removed = gB.filter(k => !gA.includes(k));
    assert.deepStrictEqual(removed, [], '없어진 전역');
    assert.deepStrictEqual(added, ['OurgoalAvatarParts'], '새 전역은 부품 통로 하나');
    return { scripts: scriptOrder(APP).length, newGlobals: added };
  });
}
check('⑥ 파일 크기: 부품 5개·avatar-system.js 각 800줄 이하 여부(avatar-system.js 는 모달 PR-4 전이라 넘을 수 있음 — 값만 적음)', () => {
  const o = {};
  for (const p of parts) { assert.ok(p.lines <= 800, p.d + ' ' + p.lines); o['js/avatar/' + p.d + '.js'] = p.lines; }
  o['js/avatar-system.js'] = mainLines.length - (mainLines[mainLines.length - 1] === '' ? 1 : 0);
  o['base js/avatar-system.js'] = baseLines.length - (baseLines[baseLines.length - 1] === '' ? 1 : 0);
  return o;
});
console.log('[verify-avatar-logic] ' + (results.length - failed) + ' passed · ' + failed + ' failed');
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ task: 'TASK-ES-389', base: BASE.replace(/\\/g, '/').split('/').pop(), results }, null, 2) + '\n', 'utf8');
