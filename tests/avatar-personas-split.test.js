/**
 * #TASK-ES-386 — 아바타 페르소나 데이터 분리 동일성 시험 (아바타·EXP 쪼개기 PR-2, 설계 REQ-TASK-ES-384 5절)
 *
 * js/avatar-system.js 의 BODY_THEMES_320(320종)을 js/data/avatar-personas/<mbti>.js 16개로 나눈 뒤에도
 * OurgoalAvatar 가 내는 배열이 분리 전과 같은지(개수·순서·내용) 잰다.
 *  1) Node 경로(require) 배열 = 분리 전 원본 배열 — deepStrictEqual (원본: git 기준 커밋을 실행한 값, 못 읽으면 지문 해시)
 *  2) 브라우저 경로(index.html 의 <script> 순서 그대로 vm 실행 — self 있음·없음 두 판) 배열 = 원본 브라우저 실행 배열
 *  3) 읽는 쪽 함수(getAllThemes·getThemesByMbti·getThemesByGroup·searchThemes·getTheme) 결과가 원본과 같다
 *  4) 변이 시험 2종: 데이터 값 1개를 바꾸거나 파트 순서를 바꾸면 이 시험의 비교가 실패한다
 *  5) 데이터 파일 각 800줄 이하 · index.html 에서 16개가 PART_ORDER 순서로 avatar-system.js 보다 먼저 읽힌다
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const Module = require('module');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BASE_COMMIT = 'ddbb761'; // 분리 전 main(#700 병합)
const PART_ORDER = ['intj', 'intp', 'entj', 'entp', 'infj', 'infp', 'enfj', 'enfp',
  'istj', 'isfj', 'estj', 'esfj', 'istp', 'isfp', 'estp', 'esfp'];
const PART_FILES = PART_ORDER.map(k => 'js/data/avatar-personas/' + k + '.js');
// 분리 전 원본 BODY_THEMES_320 의 JSON 지문(sha256) — 기준 커밋을 못 읽는 얕은 복제본에서 쓴다
const BASE_SHA256 = 'b556882b0a91e91a53078bac43aa73fcb6c673015a0ace5f498b1d397031743e';

let passed = 0;
let failed = 0;
function ok(name, fn) {
  try { fn(); passed++; console.log('  ok · ' + name); } catch (e) {
    failed++; process.exitCode = 1;
    console.error('  실패 · ' + name + '\n      ' + (e && e.message ? e.message : e));
  }
}

const sha = (list) => crypto.createHash('sha256').update(JSON.stringify(list)).digest('hex');
const plain = (x) => JSON.parse(JSON.stringify(x));
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// 브라우저처럼 같은 전역에서 파일들을 차례로 실행한다. withSelf=false 는 self 없는 vm(=enlarge-avatar-icons 시험 판).
function runBrowser(sources, withSelf) {
  const ctx = { console, setTimeout, clearTimeout };
  if (withSelf) { ctx.self = ctx; ctx.window = ctx; } else { ctx.window = {}; }
  vm.createContext(ctx);
  for (const [name, code] of sources) vm.runInContext(code, ctx, { filename: name });
  return ctx;
}
function scriptOrderFromIndex() {
  const html = read('index.html');
  // #TASK-ES-389: 아바타 로직 부품(js/avatar/*.js, 아바타·EXP 쪼개기 PR-3)도 index.html 순서 그대로 같이 실행한다(읽는 범위만 넓힘 — 부품이 없으면 이전과 같다).
  return [...html.matchAll(/<script[^>]*\bsrc="(js\/(?:avatar-system|avatar\/[^"?]+|data\/avatar-personas\/[^"?]+)\.js)(?:\?[^"]*)?"/g)].map(m => m[1]);
}

console.log('[avatar-personas-split] #TASK-ES-386');

// 1) Node 경로
const after = require(path.join(ROOT, 'js', 'avatar-system.js'));

let baseSrc = null;
let base = null;
const g = spawnSync('git', ['show', BASE_COMMIT + ':js/avatar-system.js'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
if (g.status === 0 && g.stdout && g.stdout.indexOf('var BODY_THEMES_320 = [') !== -1) {
  baseSrc = g.stdout;
  const fname = path.join(ROOT, 'js', '__base-avatar-system.js');
  const m = new Module(fname);
  m.filename = fname;
  m.paths = Module._nodeModulePaths(path.dirname(fname));
  m._compile(baseSrc, fname);
  base = m.exports;
}

ok('Node 경로: 320종·id 1~320 순서·MBTI 20개씩 순서가 그대로', () => {
  assert.strictEqual(after.BODY_THEMES_320.length, 320);
  assert.deepStrictEqual(after.BODY_THEMES_320.map(t => t.id), Array.from({ length: 320 }, (_, i) => i + 1));
  assert.deepStrictEqual(after.BODY_THEMES_320.map(t => t.mbti.toLowerCase()), PART_ORDER.reduce((a, k) => a.concat(Array(20).fill(k)), []));
});
ok('Node 경로: BODY_THEMES_320 JSON 지문 = 분리 전 지문(' + BASE_SHA256.slice(0, 12) + '…)', () => {
  assert.strictEqual(sha(after.BODY_THEMES_320), BASE_SHA256);
});
if (base) {
  ok('Node 경로: BODY_THEMES_320 deepStrictEqual 분리 전 원본(git ' + BASE_COMMIT + ')', () => {
    assert.strictEqual(sha(base.BODY_THEMES_320), BASE_SHA256, '기준 원본 지문 자체 확인');
    assert.deepStrictEqual(after.BODY_THEMES_320, base.BODY_THEMES_320);
  });
  ok('Node 경로: 공개 이름(Object.keys(OurgoalAvatar))이 원본과 같다', () => {
    assert.deepStrictEqual(Object.keys(after), Object.keys(base));
  });
} else {
  console.log('  - 기준 커밋 ' + BASE_COMMIT + ' 을 못 읽음(얕은 복제) — 지문 해시 비교로 대신함');
}

// 2) 브라우저 경로
const order = scriptOrderFromIndex();
const CELL_PARTS = order.filter(rel => rel.indexOf('js/avatar/') === 0);
const afterSources = order.map(rel => [rel, read(rel)]);
const winSelf = runBrowser(afterSources, true);
const winNoSelf = runBrowser(afterSources, false);
const baseWin = baseSrc ? runBrowser([['base:js/avatar-system.js', baseSrc]], true) : null;
ok('브라우저 경로(self 있음, index.html 순서): OurgoalAvatar.BODY_THEMES_320 = 원본', () => {
  assert.ok(winSelf.OurgoalAvatar, 'OurgoalAvatar 전역');
  assert.strictEqual(sha(winSelf.OurgoalAvatar.BODY_THEMES_320), BASE_SHA256);
  assert.deepStrictEqual(plain(winSelf.OurgoalAvatar.BODY_THEMES_320), plain(after.BODY_THEMES_320));
  if (baseWin) assert.deepStrictEqual(plain(winSelf.OurgoalAvatar.BODY_THEMES_320), plain(baseWin.OurgoalAvatar.BODY_THEMES_320));
});
ok('브라우저 경로(self 없음 — 전역 this 로 실행): 같은 배열', () => {
  assert.ok(winNoSelf.OurgoalAvatar, 'OurgoalAvatar 전역');
  assert.strictEqual(sha(winNoSelf.OurgoalAvatar.BODY_THEMES_320), BASE_SHA256);
});
ok('브라우저 경로: 새 전역은 데이터 묶음 OurgoalAvatarPersonaParts 하나뿐(16개 키, PART_ORDER 순)', () => {
  const skip = ['console', 'setTimeout', 'clearTimeout', 'self', 'window'];
  const names = Object.keys(winSelf).filter(k => !skip.includes(k)).sort();
  // 기준 커밋을 못 읽는 사본(.git 없음)에서는 avatar-system.js 하나만 실행한 전역 이름을 기준으로 쓴다(데이터 파일과 무관한 이름들)
  const aloneWin = baseWin || runBrowser([['js/avatar-system.js', read('js/avatar-system.js')]], true);
  const baseNames = Object.keys(aloneWin).filter(k => !skip.includes(k)).sort();
  // #TASK-ES-389: 로직 부품이 있으면 부품 통로 OurgoalAvatarParts 하나가 더 생긴다(설계 REQ-TASK-ES-384 3-1절에 적은 새 전역 1개). 그 밖의 새 전역은 0.
  // #TASK-ES-599: OurgoalLevelBadgeKit 새 전역 추가 반영
  assert.deepStrictEqual(names, baseNames.concat(['OurgoalAvatarPersonaParts', 'OurgoalLevelBadgeKit'], CELL_PARTS.length ? ['OurgoalAvatarParts'] : []).sort());
  assert.deepStrictEqual(Object.keys(winSelf.OurgoalAvatarPersonaParts), PART_ORDER);
});

// 3) 읽는 쪽 함수
const refApi = base || after;
ok('getAllThemes·getThemesByMbti(16종·소문자·빈값)·getThemesByGroup(4군·빈값) 결과가 원본과 같다', () => {
  assert.deepStrictEqual(plain(after.getAllThemes()), plain(refApi.getAllThemes()));
  PART_ORDER.concat(['infj ', '', null]).forEach(k => {
    assert.deepStrictEqual(plain(after.getThemesByMbti(k)), plain(refApi.getThemesByMbti(k)));
    assert.deepStrictEqual(plain(winSelf.OurgoalAvatar.getThemesByMbti(k)), plain(refApi.getThemesByMbti(k)));
  });
  PART_ORDER.forEach(k => assert.strictEqual(after.getThemesByMbti(k).length, 20));
  ['NT', 'NF', 'SJ', 'SP', 'sp', ''].forEach(gr => {
    assert.deepStrictEqual(plain(after.getThemesByGroup(gr)), plain(refApi.getThemesByGroup(gr)));
  });
});
ok('searchThemes·getTheme(1·20·21·160·320·없는 id) 결과가 원본과 같다', () => {
  ['체스', '스포트라이트', 'ESFP', '전략', '', '없는키워드zz'].forEach(q => {
    assert.deepStrictEqual(plain(after.searchThemes(q)).map(t => t.id), plain(refApi.searchThemes(q)).map(t => t.id));
  });
  [1, 20, 21, 160, 320, '7', 999].forEach(id => {
    assert.deepStrictEqual(plain(after.getTheme(id)), plain(refApi.getTheme(id)));
  });
});

// 4) 변이 시험: 비교가 실제로 차이를 잡는지
ok('변이 ①(값 1개): esfp 파일의 색 하나를 바꾸면 지문·deepStrictEqual 비교가 실패한다', () => {
  const mutated = afterSources.map(([rel, code]) => [rel, rel.endsWith('/esfp.js') ? code.replace('"color": "#F59E0B"', '"color": "#F59E0C"') : code]);
  assert.notDeepStrictEqual(mutated, afterSources, '변이가 실제로 들어감');
  const w = runBrowser(mutated, true);
  assert.notStrictEqual(sha(w.OurgoalAvatar.BODY_THEMES_320), BASE_SHA256);
  assert.throws(() => assert.deepStrictEqual(plain(w.OurgoalAvatar.BODY_THEMES_320), plain(after.BODY_THEMES_320)));
});
ok('변이 ②(순서): 조립 순서에서 intj·intp 를 맞바꾸면 지문·deepStrictEqual 비교가 실패한다', () => {
  const mutated = afterSources.map(([rel, code]) => [rel, rel === 'js/avatar-system.js' ? code.replace("var PERSONA_PART_ORDER = ['intj', 'intp',", "var PERSONA_PART_ORDER = ['intp', 'intj',") : code]);
  assert.notDeepStrictEqual(mutated, afterSources, '변이가 실제로 들어감');
  const w = runBrowser(mutated, true);
  assert.strictEqual(w.OurgoalAvatar.BODY_THEMES_320.length, 320);
  assert.notStrictEqual(sha(w.OurgoalAvatar.BODY_THEMES_320), BASE_SHA256);
  assert.throws(() => assert.deepStrictEqual(plain(w.OurgoalAvatar.BODY_THEMES_320), plain(after.BODY_THEMES_320)));
});

// 5) 파일 크기·로드 순서
ok('데이터 파일 16개 각 800줄 이하, 각 20종', () => {
  PART_FILES.forEach((rel, i) => {
    const n = read(rel).split('\n').length;
    assert.ok(n <= 800, rel + ' ' + n + '줄');
    assert.strictEqual(require(path.join(ROOT, rel)).length, 20, rel);
    assert.ok(require(path.join(ROOT, rel)).every(t => t.mbti.toLowerCase() === PART_ORDER[i]), rel + ' MBTI');
  });
});
ok('index.html: 데이터 파일 16개가 PART_ORDER 순서로 avatar-system.js 보다 먼저 읽힌다', () => {
  assert.deepStrictEqual(order.filter(rel => rel.indexOf('js/avatar/') !== 0), PART_FILES.concat(['js/avatar-system.js']));
  // #TASK-ES-389: 로직 부품도 모두 avatar-system.js 보다 먼저 읽힌다(조립자가 읽을 때 부품 통로가 채워져 있어야 한다).
  CELL_PARTS.forEach(rel => assert.ok(order.indexOf(rel) < order.indexOf('js/avatar-system.js'), rel + ' 이 avatar-system.js 보다 먼저'));
});

console.log('[avatar-personas-split] ' + passed + ' passed · ' + failed + ' failed');
