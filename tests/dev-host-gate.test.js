// tests/dev-host-gate.test.js
// #TASK-ES-372: 운영 주소에 ?debug=true 를 붙이면 개발용 테스터 B 직통 버튼이 보이고, 누르면 인증 없이 테스터 B uid 로
// 입장하던 결함(PR #686 빌더 발견)의 회귀 시험. 확인 수준: "부품만 돌려 봄" — index.html 의 실제 함수 본문
// (initDevDebugButtons·enterAsTesterB)을 잘라 가짜 document·location 안에서 호스트별로 돌린다. 실제 브라우저가 아니다.
// 실행: node tests/dev-host-gate.test.js [--html <index.html 경로>]

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ROOT = path.join(__dirname, '..');
var htmlArg = process.argv.indexOf('--html');
var HTML_PATH = htmlArg > -1 ? path.resolve(process.argv[htmlArg + 1]) : path.join(ROOT, 'index.html');
var html = fs.readFileSync(HTML_PATH, 'utf8');
var Guard = require('../js/direct-login-guard');
var guardSrc = fs.readFileSync(path.join(ROOT, 'js', 'direct-login-guard.js'), 'utf8');

var TESTER_B = '00000000-0000-4000-a000-000000000002';
var ALLOWED = ['localhost', '127.0.0.1', '[::1]', 'ourgoal.localhost', 'LOCALHOST'];
var BLOCKED = ['ourgoal-app.vercel.app', 'ourgoal-app-git-feat-x-yangsangmin.vercel.app', 'www.example.com', 'localhost.example.com', 'evillocalhost', '127.0.0.1.nip.io', '192.168.0.10', ''];

/* index.html 에서 함수 본문 잘라 오기(중괄호 짝 맞춤, 문자열·주석 건너뜀) */
function extractFunction(src, header) {
  var start = src.indexOf(header);
  if (start === -1) throw new Error('index.html 에 ' + header + ' 가 없다');
  var i = src.indexOf('{', start), depth = 0, q = null;
  for (; i < src.length; i++) {
    var c = src[i], n = src[i + 1];
    if (q) {
      if (c === '\\') { i++; continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === '/' && n === '/') { i = src.indexOf('\n', i); continue; }
    if (c === '/' && n === '*') { i = src.indexOf('*/', i + 2) + 1; continue; }
    if (c === '\'' || c === '"' || c === '`') { q = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error(header + ' 의 끝을 못 찾음');
}

var code = extractFunction(html, 'async function enterAsTesterB(') + '\n' + extractFunction(html, 'function initDevDebugButtons(') +
  '\nthis.api = { enterAsTesterB: enterAsTesterB, initDevDebugButtons: initDevDebugButtons };';

/* 가짜 화면: 랜딩·로그인 화면의 테스터 B 래퍼 두 개(처음엔 display:none, 지워지면 removed) */
function makePage(hostname, search) {
  var els = {};
  ['landTesterBWrap', 'authTesterBWrap', 'landingScreen', 'authScreen'].forEach(function (id) {
    els[id] = { id: id, style: { display: id.indexOf('TesterB') > -1 ? 'none' : 'block' }, removed: false, remove: function () { this.removed = true; } };
  });
  var calls = { direct: [], enterApp: 0, toasts: [] };
  var win = {};
  var ctx = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    String: String, Object: Object, Array: Array, JSON: JSON, Promise: Promise,
    window: win,
    location: { hostname: hostname, search: search },
    document: { readyState: 'complete', addEventListener: function () {}, getElementById: function (id) { return els[id] && !els[id].removed ? els[id] : null; } },
    localStorage: { setItem: function () {}, getItem: function () { return null; } },
    state: {},
    toast: function (m) { calls.toasts.push(String(m)); },
    defaultProfile: function (id) { return { id: id }; },
    enterApp: function () { calls.enterApp++; },
    loginWithDirectIdentifier: function (nick, opt) { calls.direct.push(opt && opt.userId); return Promise.resolve(true); }
  };
  vm.createContext(ctx);
  vm.runInContext(guardSrc, ctx, { filename: 'js/direct-login-guard.js' });
  vm.runInContext(code, ctx, { filename: 'index.html(잘라 옴)' });
  return { ctx: ctx, els: els, calls: calls, api: ctx.api };
}
function visibleTesterButtons(p) {
  return ['landTesterBWrap', 'authTesterBWrap'].filter(function (id) { return !p.els[id].removed && p.els[id].style.display === 'block'; }).length;
}

var results = [];
async function check(name, fn) {
  try { await fn(); results.push({ name: name, ok: true }); console.log('  [통과] ' + name); }
  catch (e) { results.push({ name: name, ok: false, err: e.message }); console.log('  [실패] ' + name + '\n         ' + e.message); }
}

(async function main() {
  console.log('TASK-ES-372 개발용 테스터 B 직통 입장 호스트 제한 시험 (부품만 돌려 봄 — 가짜 document·location) 대상: ' + path.relative(ROOT, HTML_PATH));
  var m = { blockedHostButtons: {}, blockedHostForcedButtons: {}, blockedHostEntries: {}, allowedHostButtons: {}, allowedHostNoDebugButtons: {}, allowedHostEntries: {} };

  await check('① 운영·미리보기 등 로컬이 아닌 호스트: ?debug=true 여도 테스터 B 버튼 0개, 강제 인자(true)로 불러도 0개', async function () {
    BLOCKED.forEach(function (h) {
      var p = makePage(h, '?debug=true');
      p.api.initDevDebugButtons();
      m.blockedHostButtons[h] = visibleTesterButtons(p);
      var p2 = makePage(h, '?debug=true');
      p2.api.initDevDebugButtons(true);
      m.blockedHostForcedButtons[h] = visibleTesterButtons(p2);
    });
    BLOCKED.forEach(function (h) {
      assert.strictEqual(m.blockedHostButtons[h], 0, h + ' 에서 ?debug=true 로 테스터 버튼 ' + m.blockedHostButtons[h] + '개');
      assert.strictEqual(m.blockedHostForcedButtons[h], 0, h + ' 에서 강제 인자로 테스터 버튼 ' + m.blockedHostForcedButtons[h] + '개');
    });
  });

  await check('② 로컬이 아닌 호스트: enterAsTesterB 를 직접 불러도 테스터 B 로 입장하지 않는다(직통 로그인 호출 0회, 앱 입장 0회)', async function () {
    for (var i = 0; i < BLOCKED.length; i++) {
      var h = BLOCKED[i];
      var p = makePage(h, '?debug=true');
      await p.api.enterAsTesterB();
      m.blockedHostEntries[h] = p.calls.direct.length + p.calls.enterApp;
    }
    BLOCKED.forEach(function (h) {
      assert.strictEqual(m.blockedHostEntries[h], 0, h + ' 에서 테스터 B 입장 시도 ' + m.blockedHostEntries[h] + '회');
    });
  });

  await check('③ 로컬 개발 호스트(localhost·127.0.0.1·[::1]·*.localhost): ?debug=true 면 버튼 2개, 없으면 0개, enterAsTesterB 는 테스터 B uid 로 들어간다', async function () {
    for (var i = 0; i < ALLOWED.length; i++) {
      var h = ALLOWED[i];
      var p = makePage(h, '?debug=true');
      p.api.initDevDebugButtons();
      m.allowedHostButtons[h] = visibleTesterButtons(p);
      var p0 = makePage(h, '');
      p0.api.initDevDebugButtons();
      m.allowedHostNoDebugButtons[h] = visibleTesterButtons(p0);
      var p2 = makePage(h, '?debug=true');
      await p2.api.enterAsTesterB();
      m.allowedHostEntries[h] = p2.calls.direct.filter(function (u) { return u === TESTER_B; }).length;
    }
    ALLOWED.forEach(function (h) {
      assert.strictEqual(m.allowedHostButtons[h], 2, h + ' 에서 ?debug=true 버튼 ' + m.allowedHostButtons[h] + '개');
      assert.strictEqual(m.allowedHostNoDebugButtons[h], 0, h + ' 에서 debug 없이 버튼 ' + m.allowedHostNoDebugButtons[h] + '개');
      assert.strictEqual(m.allowedHostEntries[h], 1, h + ' 에서 테스터 B 입장 ' + m.allowedHostEntries[h] + '회');
    });
  });

  await check('④ 직통 입장 규칙: 세션 없이 호출자가 uid 를 넘겨도 로컬 개발 호스트가 아니면 열지 않는다(needs-login)', async function () {
    var off = Guard.resolveDirectLoginTarget({ explicitUid: TESTER_B, devHost: false });
    var missing = Guard.resolveDirectLoginTarget({ explicitUid: TESTER_B });
    var on = Guard.resolveDirectLoginTarget({ explicitUid: TESTER_B, devHost: true });
    m.explicitUidOffHost = off.allow;
    m.explicitUidNoFlag = missing.allow;
    m.explicitUidDevHost = on.allow;
    assert.strictEqual(off.allow, false, '로컬이 아닌 호스트에서 명시 uid 입장 허용됨');
    assert.strictEqual(off.reason, 'needs-login');
    assert.strictEqual(missing.allow, false, 'devHost 없이 명시 uid 입장 허용됨');
    assert.strictEqual(on.allow, true, '로컬 개발 호스트에서 명시 uid 입장이 막힘');
    assert.strictEqual(on.uid, TESTER_B);
  });

  await check('⑤ 호스트 판정: 허용 목록만 참, 비슷한 이름(localhost.example.com·evillocalhost·127.0.0.1.nip.io)은 거짓', async function () {
    m.isLocalDevHost = {};
    ALLOWED.concat(BLOCKED).forEach(function (h) { m.isLocalDevHost[h] = Guard.isLocalDevHost(h); });
    ALLOWED.forEach(function (h) { assert.strictEqual(m.isLocalDevHost[h], true, h + ' 가 로컬 개발 호스트로 판정되지 않음'); });
    BLOCKED.forEach(function (h) { assert.strictEqual(m.isLocalDevHost[h], false, h + ' 가 로컬 개발 호스트로 판정됨'); });
  });

  var failed = results.filter(function (r) { return !r.ok; }).length;
  console.log('\n측정값: ' + JSON.stringify(m));
  console.log('결과: ' + (results.length - failed) + '/' + results.length + ' 통과');
  if (failed) process.exitCode = 1;
})().catch(function (e) { console.error(e); process.exitCode = 1; });
