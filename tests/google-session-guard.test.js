// tests/google-session-guard.test.js
// #TASK-ES-373 (노션 CORE-14): 구글 로그인이 Supabase 세션 없이, 서명 검증 안 된 GIS 자격증명(JWT)의 이메일로
// 'u_' + sha256 uid 에 입장하던 결함의 회귀 시험. 확인 수준: "부품만 돌려 봄" — index.html 의 실제 함수 본문을 잘라
// 가짜 브라우저·가짜 Supabase 로 돌린다. 가짜 Supabase 의 signInWithIdToken 은 진짜 서버처럼 RS256 서명(가짜 구글 키)·aud·만료·nonce 를
// 검증하고, 통과하면 이메일과 무관한 서버 uid(uuid) 세션을 돌려준다. 실서버·실제 구글 계정 왕복이 아니다.
// 실행: node tests/google-session-guard.test.js [--html <index.html 경로>] [--root <저장소 경로>]

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var crypto = require('crypto');

var argRoot = process.argv.indexOf('--root');
var ROOT = argRoot > -1 ? path.resolve(process.argv[argRoot + 1]) : path.join(__dirname, '..');
var htmlArg = process.argv.indexOf('--html');
var HTML_PATH = htmlArg > -1 ? path.resolve(process.argv[htmlArg + 1]) : path.join(ROOT, 'index.html');
var html = require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(HTML_PATH, 'utf8')); /* #TASK-ES-518: 인라인 합본(원문 맨 앞 + 세포) — 단언·기대값 그대로 */
function readIf(p) { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; }
var directGuardSrc = readIf(path.join(ROOT, 'js', 'direct-login-guard.js'));
var googleGuardSrc = readIf(path.join(ROOT, 'js', 'google-session-guard.js'));

var CLIENT_ID = '441950547594-brg1nvritlb3hlucoktq11ga6vtn943a.apps.googleusercontent.com'; // index.html 의 공개 클라이언트 id(비밀값 아님)
var VICTIM_EMAIL = 'ogtest-victim@example.invalid';
var SERVER_UID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

/* ---------- index.html 에서 함수 본문 잘라 오기(중괄호 짝 맞춤, 문자열·주석 건너뜀) ---------- */
function extractFunction(src, header) {
  var start = src.indexOf(header);
  if (start === -1) return null;
  var i = src.indexOf('{', start), depth = 0, q = null;
  for (; i < src.length; i++) {
    var c = src[i], n = src[i + 1];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === '/' && n === '/') { i = src.indexOf('\n', i); continue; }
    if (c === '/' && n === '*') { i = src.indexOf('*/', i + 2) + 1; continue; }
    if (c === '\'' || c === '"' || c === '`') { q = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error(header + ' 의 끝을 못 찾음');
}

/* ---------- 가짜 구글 키·JWT ---------- */
var googleKey = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
var attackerKey = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
function b64u(x) { return Buffer.from(x).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'); }
function makeJwt(payload, opt) {
  var o = opt || {};
  var header = { alg: o.alg || 'RS256', typ: 'JWT', kid: 'test' };
  var body = b64u(JSON.stringify(header)) + '.' + b64u(JSON.stringify(payload));
  if (o.alg === 'none') return body + '.' + 'x';
  var sig = crypto.sign('RSA-SHA256', Buffer.from(body), (o.key || googleKey).privateKey);
  return body + '.' + b64u(sig);
}
function basePayload(extra) {
  var now = Math.floor(Date.now() / 1000);
  return Object.assign({ iss: 'https://accounts.google.com', aud: CLIENT_ID, sub: '1234567890', email: VICTIM_EMAIL, email_verified: true, iat: now, exp: now + 3600 }, extra || {});
}

/* ---------- 가짜 Supabase 서버: signInWithIdToken 이 서명·aud·exp·nonce 를 검증 ---------- */
function makeServer() {
  var calls = { idToken: [], oauth: [] };
  function verify(token, rawNonce) {
    var parts = String(token).split('.');
    if (parts.length !== 3) return 'malformed';
    var header, payload;
    try { header = JSON.parse(Buffer.from(parts[0], 'base64').toString()); payload = JSON.parse(Buffer.from(parts[1], 'base64').toString()); } catch (e) { return 'malformed'; }
    if (header.alg !== 'RS256') return 'bad alg';
    var ok = false;
    try { ok = crypto.verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), googleKey.publicKey, Buffer.from(parts[2].replace(/-/g, '+').replace(/_/g, '/'), 'base64')); } catch (e) { ok = false; }
    if (!ok) return 'bad signature';
    if (payload.aud !== CLIENT_ID) return 'bad aud';
    if (!(payload.exp > Date.now() / 1000)) return 'expired';
    var hasTokenNonce = !!payload.nonce, hasRaw = !!rawNonce;
    if (hasTokenNonce !== hasRaw) return 'nonce mismatch';
    if (hasRaw && crypto.createHash('sha256').update(rawNonce).digest('hex') !== payload.nonce) return 'nonce mismatch';
    return null;
  }
  return {
    calls: calls,
    client: function (sessionBox) {
      return {
        auth: {
          signInWithIdToken: function (p) {
            calls.idToken.push(p);
            var err = p.provider === 'google' ? verify(p.token, p.nonce) : 'bad provider';
            if (err) return Promise.resolve({ data: { session: null, user: null }, error: { message: err } });
            var session = { access_token: 'sb-access-' + SERVER_UID, user: { id: SERVER_UID, email: VICTIM_EMAIL, app_metadata: { provider: 'google' } } };
            sessionBox.session = session;
            return Promise.resolve({ data: { session: session, user: session.user }, error: null });
          },
          signInWithOAuth: function (p) { calls.oauth.push(p); return Promise.resolve(sessionBox.oauthError ? { error: { message: sessionBox.oauthError } } : { data: { url: 'https://example.invalid/authorize' }, error: null }); },
          getSession: function () { return Promise.resolve({ data: { session: sessionBox.session || null } }); },
          signOut: function () { sessionBox.session = null; return Promise.resolve({ error: null }); }
        }
      };
    }
  };
}

/* ---------- 가짜 브라우저 ---------- */
function makeBrowser(opt) {
  var o = opt || {};
  var server = makeServer();
  var box = { session: null, oauthError: o.oauthError || null };
  var els = {};
  var el = function (id) { if (!els[id]) els[id] = { id: id, style: {}, textContent: '', value: '', classList: { contains: function () { return false; }, add: function () {}, remove: function () {} }, click: function () {}, focus: function () {} }; return els[id]; };
  var gis = { config: null, prompts: 0 };
  var calls = { enterApp: 0, restore: [], toasts: [], modals: 0, loginDirect: [] };
  var state = { profile: null };
  var modalSheet = null;
  var win = { location: { origin: "https://ourgoal.example.invalid" } };
  var ctx = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    JSON: JSON, Date: Date, Math: Math, Object: Object, Array: Array, String: String, Promise: Promise, RegExp: RegExp, Error: Error, Uint8Array: Uint8Array,
    TextEncoder: TextEncoder, crypto: crypto.webcrypto, atob: function (s) { return Buffer.from(s, 'base64').toString('binary'); },
    decodeURIComponent: decodeURIComponent, setTimeout: setTimeout,
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    sessionStorage: { getItem: function () { return null; }, setItem: function () {} },
    state: state, window: win,
    document: { getElementById: el, querySelector: function (q) { return q === '[data-authtab="login"]' ? el('authTabLogin') : null; } },
    toast: function (m) { calls.toasts.push(String(m)); },
    escapeHtml: function (s) { return String(s); },
    openModal: function (h, fn) {
      calls.modals++;
      var btns = {};
      modalSheet = { querySelector: function (q) { var id = q.replace('#', ''); if (h.indexOf('id="' + id + '"') === -1) return null; return btns[id] || (btns[id] = { id: id }); } };
      fn(modalSheet);
    },
    closeModal: function () {},
    openLoginRescueModal: function () {},
    saveProfile: function () { return Promise.resolve(); },
    initRememberedAuthFields: function () {},
    setDeviceLoginTime: function () {},
    GOOGLE_OAUTH_CLIENT_ID: CLIENT_ID,
    /* 정식 세션 진입(index.html restoreSessionAndEnter)은 세션 uid 로 프로필을 연다 — 여기서는 그 결과(uid)만 기록 */
    restoreSessionAndEnter: function (session) { calls.restore.push(session.user.id); state.profile = { id: session.user.id }; calls.enterApp++; return Promise.resolve(true); },
    loginWithDirectIdentifier: function (id, ex) {
      /* 고치기 전 경로가 쓰던 u_ uid 입장을 그대로 흉내(세션 없이 이메일에서 uid 를 만든다) */
      calls.loginDirect.push(ex || null);
      var uid = 'u_' + crypto.createHash('sha256').update('ourgoal_user_' + String(id).toLowerCase()).digest('hex').slice(0, 16);
      state.profile = { id: uid }; calls.enterApp++; return Promise.resolve(true);
    }
  };
  ctx.google = { accounts: { id: { initialize: function (c) { gis.config = c; }, prompt: function () { gis.prompts++; } } } };
  win.google = ctx.google;
  ctx.sb = server.client(box);
  vm.createContext(ctx);
  if (directGuardSrc) vm.runInContext(directGuardSrc, ctx, { filename: 'js/direct-login-guard.js' });
  if (googleGuardSrc) vm.runInContext(googleGuardSrc, ctx, { filename: 'js/google-session-guard.js' });
  var names = ['function parseJwtPayload(', 'async function handleGoogleUserSuccess(', 'function failGoogleSession(', 'async function enterWithVerifiedGoogleCredential(', 'var _googleOneTapNonce = null;', 'function initGoogleOneTap('];
  var code = names.map(function (h) {
    if (h.indexOf('var ') === 0) return html.indexOf(h) > -1 ? h : '';
    var f = extractFunction(html, h);
    if (f && h === 'function initGoogleOneTap(') { var at = html.indexOf(h); if (html.slice(at - 6, at) === 'async ') f = 'async ' + f; }
    return f || '';
  }).join('\n') + '\nthis.api = { initGoogleOneTap: initGoogleOneTap, handleGoogleUserSuccess: handleGoogleUserSuccess };';
  vm.runInContext(code, ctx, { filename: 'index.html(잘라 옴)' });
  return { ctx: ctx, api: ctx.api, gis: gis, calls: calls, state: state, els: els, server: server, box: box, sheet: function () { return modalSheet; } };
}

/* One-Tap 을 초기화하고 구글이 콜백에 자격증명을 준 것처럼 부른다 */
async function oneTap(b, credential) {
  await b.api.initGoogleOneTap();
  assert.ok(b.gis.config && typeof b.gis.config.callback === 'function', 'GIS initialize 콜백이 없음');
  await b.gis.config.callback({ credential: credential });
}
function isEmailUid(id) { return /^u_[0-9a-f]{16}$/.test(String(id || '')); }

var results = [];
async function check(name, fn) {
  try { await fn(); results.push({ name: name, ok: true }); console.log('  [통과] ' + name); }
  catch (e) { results.push({ name: name, ok: false, err: e.message }); console.log('  [실패] ' + name + '\n         ' + e.message); }
}

(async function main() {
  console.log('TASK-ES-373 구글 로그인 서버 검증 세션 시험 (부품만 돌려 봄 — 가짜 브라우저·가짜 Supabase·가짜 구글 키) 대상: ' + path.relative(ROOT, HTML_PATH));
  var m = {};

  var forged = {
    unsigned: makeJwt(basePayload(), { alg: 'none' }),
    attackerSigned: makeJwt(basePayload(), { key: attackerKey }),
    wrongAud: makeJwt(basePayload({ aud: 'someone-else.apps.googleusercontent.com' })),
    expired: makeJwt(basePayload({ exp: Math.floor(Date.now() / 1000) - 60 })),
    notJwt: 'not-a-jwt'
  };

  await check('① 위조·무서명 자격증명 5종(서명 없음·다른 키 서명·다른 aud·만료·JWT 아님)을 One-Tap 콜백에 넣으면 입장 0회, u_ uid 0, 정식 로그인 안내', async function () {
    m.forged = {};
    var keys = Object.keys(forged);
    for (var i = 0; i < keys.length; i++) {
      var b = makeBrowser();
      await oneTap(b, forged[keys[i]]);
      m.forged[keys[i]] = { enterApp: b.calls.enterApp, emailUid: isEmailUid(b.state.profile && b.state.profile.id), authScreen: b.els.authScreen ? b.els.authScreen.style.display : null, loginError: !!(b.els.loginError && b.els.loginError.textContent) };
    }
    var entered = keys.reduce(function (n, k) { return n + m.forged[k].enterApp; }, 0);
    var emailUids = keys.filter(function (k) { return m.forged[k].emailUid; }).length;
    var guided = keys.filter(function (k) { return m.forged[k].authScreen === 'flex' && m.forged[k].loginError; }).length;
    m.forgedEntered = entered; m.forgedEmailUid = emailUids; m.forgedGuided = guided;
    assert.strictEqual(entered, 0, '위조 자격증명으로 입장 ' + entered + '회: ' + JSON.stringify(m.forged));
    assert.strictEqual(emailUids, 0, '이메일 u_ uid 로 열린 경우 ' + emailUids + '건');
    assert.strictEqual(guided, keys.length, '정식 로그인 안내가 뜬 경우 ' + guided + '/' + keys.length);
  });

  await check('② 서버 검증 성공(가짜 구글 키로 서명된 정상 자격증명 + nonce) → Supabase 세션 uid 로 입장, u_ uid 아님', async function () {
    var b = makeBrowser();
    await b.api.initGoogleOneTap();
    var hashedNonce = b.gis.config && b.gis.config.nonce;
    m.gisNonceSet = !!hashedNonce;
    var good = makeJwt(basePayload(hashedNonce ? { nonce: hashedNonce } : {}));
    await b.gis.config.callback({ credential: good });
    m.goodProfile = b.state.profile ? (b.state.profile.id === SERVER_UID ? 'server-uid' : (isEmailUid(b.state.profile.id) ? 'email-u_' : 'other')) : null;
    m.goodRestoreCalls = b.calls.restore.length;
    m.goodIdTokenCalls = b.server.calls.idToken.length;
    m.goodProvider = b.server.calls.idToken[0] && b.server.calls.idToken[0].provider;
    assert.strictEqual(m.goodIdTokenCalls, 1, 'signInWithIdToken 호출 ' + m.goodIdTokenCalls + '회');
    assert.strictEqual(m.goodProvider, 'google', '공급자가 google 이 아님');
    assert.strictEqual(m.goodProfile, 'server-uid', '입장 uid 가 서버 세션 uid 가 아님: ' + m.goodProfile);
    assert.strictEqual(m.goodRestoreCalls, 1, '정식 세션 진입 ' + m.goodRestoreCalls + '회');
    assert.ok(m.gisNonceSet, 'GIS 에 nonce 를 넘기지 않음');
  });

  await check('③ 다른 nonce 로 발급된 자격증명(재사용 흉내)은 서버가 거절 → 입장 0', async function () {
    var b = makeBrowser();
    await b.api.initGoogleOneTap();
    var replay = makeJwt(basePayload({ nonce: crypto.createHash('sha256').update('another-session-nonce').digest('hex') }));
    await b.gis.config.callback({ credential: replay });
    m.replayEntered = b.calls.enterApp;
    assert.strictEqual(m.replayEntered, 0, '다른 nonce 자격증명으로 입장 ' + m.replayEntered + '회');
  });

  await check('④ 토큰 클라이언트 경로(미로그인, 액세스 토큰·userinfo 이메일): "Google 계정으로 바로 시작하기" 는 이메일 u_ uid 로 들어가지 않고 Supabase 구글 OAuth 로 넘긴다', async function () {
    var b = makeBrowser();
    await b.api.handleGoogleUserSuccess({ email: VICTIM_EMAIL, sub: '1', name: 'V' }, 'ya29.fake-access-token');
    var sheet = b.sheet();
    var gBtn = sheet && sheet.querySelector('#continueGoogleDirectBtn');
    assert.ok(gBtn && typeof gBtn.onclick === 'function', '#continueGoogleDirectBtn 버튼이 없음(입장 방법이 사라지면 안 됨)');
    await gBtn.onclick();
    m.tokenPathEnterApp = b.calls.enterApp;
    m.tokenPathDirectCalls = b.calls.loginDirect.length;
    m.tokenPathOAuth = b.server.calls.oauth.map(function (c) { return c.provider; });
    assert.strictEqual(m.tokenPathDirectCalls, 0, '세션 없는 직통 입장 호출 ' + m.tokenPathDirectCalls + '회');
    assert.strictEqual(m.tokenPathEnterApp, 0, '서버 검증 전에 입장 ' + m.tokenPathEnterApp + '회');
    assert.deepStrictEqual(m.tokenPathOAuth, ['google'], 'Supabase 구글 OAuth 로 넘기지 않음: ' + JSON.stringify(m.tokenPathOAuth));
  });

  await check('⑤ 토큰 클라이언트 경로에서 Supabase 가 구글 공급자를 거절하면(공급자 꺼짐) 입장 0, 정식 로그인 안내', async function () {
    var b = makeBrowser({ oauthError: 'Unsupported provider: provider is not enabled' });
    await b.api.handleGoogleUserSuccess({ email: VICTIM_EMAIL, sub: '1', name: 'V' }, 'ya29.fake-access-token');
    var gBtn = b.sheet() && b.sheet().querySelector('#continueGoogleDirectBtn');
    if (gBtn && gBtn.onclick) await gBtn.onclick();
    m.disabledEnterApp = b.calls.enterApp;
    m.disabledGuide = b.els.authScreen ? b.els.authScreen.style.display : null;
    assert.strictEqual(m.disabledEnterApp, 0, '공급자 꺼짐인데 입장 ' + m.disabledEnterApp + '회');
    assert.strictEqual(m.disabledGuide, 'flex', '정식 로그인 화면이 열리지 않음');
  });

  await check('⑥ 고정: loginWithDirectIdentifier 에 이메일 → u_ uid 를 만드는 줄이 없다', async function () {
    var body = extractFunction(html, 'async function loginWithDirectIdentifier(') || '';
    m.directDerivesEmailUid = body.indexOf("'u_' + h.slice(0, 16)") > -1 || body.indexOf("sha256Hex('ourgoal_user_'") > -1;
    assert.strictEqual(m.directDerivesEmailUid, false, '이메일에서 u_ uid 를 만드는 줄이 남아 있음');
  });

  var failed = results.filter(function (r) { return !r.ok; }).length;
  console.log('\n측정값: ' + JSON.stringify(m));
  console.log('결과: ' + (results.length - failed) + '/' + results.length + ' 통과');
  if (failed) process.exitCode = 1;
})().catch(function (e) { console.error(e); process.exitCode = 1; });
