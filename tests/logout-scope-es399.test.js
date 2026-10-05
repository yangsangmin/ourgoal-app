'use strict';
// 로그아웃 범위·끊긴 세션 감지 시험 (#TASK-ES-399 · TASK-ES-398 실측 결함)
// - 일반 로그아웃(performLogout)은 이 기기만 끊는다: sb.auth.signOut({ scope: 'local' }).
//   supabase-js v2 기본값은 'global' 이라 인자 없이 부르면 같은 계정의 다른 기기 세션까지 서버에서 해제된다.
// - 다른 기기 로그아웃(openLogoutOtherDevicesConfirmModal)은 그대로 'others'. 탈퇴(submitWithdrawAccount)는 의도적으로 기본값(global).
// - 로그아웃 직전(세션이 있을 때) 이 기기 푸시 구독을 서버에서 지운다(removePushSubscription, DELETE /api/push-subscribe + Bearer) — 남으면 이전 사용자 알림이 온다(#714 빌더 발견).
// - 끊긴 기기 감지(checkRemoteSessionRevoked): 서버가 세션을 지우면 getUser 오류 문구가 'Auth session missing!' 이다.
//   이 문구(대소문자 무관)와 401 도 끊긴 세션으로 보고 로그아웃 화면으로 보낸다. 네트워크 오류·로그인 직후 60초는 그대로 로그아웃시키지 않는다.
// 확인 수준: 부품만 돌려 봄 — index.html 의 실제 함수 본문을 잘라 가짜 Supabase(인자·호출 기록)·가짜 화면으로 돌린다.
// 사용: node <이 시험 파일> [저장소 뿌리 경로] [결과 JSON 경로] — 기준 커밋 사본(git archive)을 넘기면 그 사본을 잰다.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const UID = '11111111-1111-4111-8111-111111111111';

/* index.html 에서 함수 본문 잘라 오기(중괄호 짝 맞춤, 문자열·주석 건너뜀) */
function extractFunction(src, header) {
  const start = src.indexOf(header);
  if (start === -1) throw new Error('index.html 에 ' + header + ' 가 없다');
  let i = src.indexOf('{', start), depth = 0, q = null;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === '/' && n === '/') { i = src.indexOf('\n', i); continue; }
    if (c === '/' && n === '*') { i = src.indexOf('*/', i + 2) + 1; continue; }
    if (c === '\'' || c === '"' || c === '`') { q = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error(header + ' 의 끝을 못 찾음');
}
const noComments = (s) => s.split(/\r?\n/).filter((l) => !/^\s*(\/\/|\/?\*)/.test(l)).map((l) => l.replace(/\/\*.*?\*\//g, '')).join('\n');

function mem() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
}

/* 기기 하나: getUserResult 는 sb.auth.getUser() 가 돌려줄 값, loginAgoMs 는 이 기기 로그인 뒤 지난 시간 */
function device(opts) {
  const calls = { signOut: [], toasts: [], order: [], fetches: [] };
  let session = opts.session === undefined ? { access_token: 'tok-p1' } : opts.session;
  const authScreen = { style: { display: 'none' } };
  const shell = { classList: { remove: function () { shell.active = false; } }, active: true };
  const ls = mem(), ss = mem();
  ls.setItem('ourgoal_login_at', String(Date.now() - (opts.loginAgoMs == null ? 120000 : opts.loginAgoMs)));
  const win = {
    console: { log() {}, warn() {}, error() {} },
    Date, Math, JSON, String, Number, Promise, parseInt,
    localStorage: ls, sessionStorage: ss,
    state: { profile: { id: UID, settings: {} }, notifyTimer: null, googleToken: 'x' },
    sb: { auth: {
      signOut: function (arg) { calls.order.push('signOut'); calls.signOut.push(arg === undefined ? '(인자 없음)' : JSON.parse(JSON.stringify(arg))); session = null; return Promise.resolve({ error: null }); },
      getSession: function () { return Promise.resolve({ data: { session: session } }); },
      getUser: function () { return Promise.resolve(opts.getUserResult); }
    } },
    document: { getElementById: (id) => (id === 'authScreen' ? authScreen : id === 'appShell' ? shell : null) },
    updateAppBadge() {}, initRememberedAuthFields() {},
    toast: (m) => calls.toasts.push(m),
    getDeviceId: () => 'dev-p1',
    OurgoalAccountIsolation: { clearSharedSessionCopies() {} },
    clearInterval() {},
    setTimeout: opts.fastTimers ? function (fn) { fn(); return 0; } : setTimeout,
    _pendingAuthSession: null,
    navigator: opts.noServiceWorker ? {} : { serviceWorker: { ready: opts.swNeverReady ? new Promise(function () {}) : Promise.resolve({ pushManager: { getSubscription: function () { return Promise.resolve(opts.noSub ? null : { endpoint: 'https://push.example/ep-p1', unsubscribe: function () { calls.order.push('unsubscribe'); return Promise.resolve(true); } }); } } }) } },
    fetch: function (url, o) { calls.order.push('fetch ' + o.method + ' ' + url); calls.fetches.push({ url: url, method: o.method, auth: o.headers && o.headers.Authorization, body: JSON.parse(o.body) }); return Promise.resolve({ ok: true, status: 200 }); }
  };
  win.window = win;
  const ctx = vm.createContext(win);
  const src = ['async function getSupabaseAuthToken(', 'async function removePushSubscription(', 'function getDeviceLoginTime(', 'async function performLogout(', 'async function checkRemoteSessionRevoked(']
    .map((h) => extractFunction(html, h)).join('\n') +
    '\nthis.api = { performLogout: performLogout, checkRemoteSessionRevoked: checkRemoteSessionRevoked };';
  vm.runInContext(src, ctx, { filename: 'index.html(잘라 옴)' });
  return { api: win.api, win, calls, authScreen, shell };
}
const userOk = { data: { user: { id: UID, user_metadata: {} } }, error: null };
const loggedOut = (d) => d.authScreen.style.display === 'flex' && d.win.state.profile === null;

const results = [];
async function check(name, fn) {
  try { await fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, err: String(e && e.message || e) }); }
}

(async function () {
  await check('일반 로그아웃(performLogout)은 signOut 을 한 번, { scope: \'local\' } 로 부른다(이 기기만)', async function () {
    const d = device({ getUserResult: userOk });
    await d.api.performLogout();
    assert.deepStrictEqual(d.calls.signOut, [{ scope: 'local' }], 'signOut 인자: ' + JSON.stringify(d.calls.signOut));
    assert.ok(loggedOut(d), '로그아웃 화면으로 감');
  });
  await check('로그아웃은 세션이 있을 때 먼저 이 기기 푸시 구독을 서버에서 지운다(DELETE /api/push-subscribe + 세션 Bearer) — 그 다음 signOut', async function () {
    const d = device({ getUserResult: userOk });
    await d.api.performLogout();
    assert.deepStrictEqual(d.calls.order, ['unsubscribe', 'fetch DELETE /api/push-subscribe', 'signOut'], '순서: ' + JSON.stringify(d.calls.order));
    assert.strictEqual(d.calls.fetches[0].auth, 'Bearer tok-p1', '로그아웃 전 세션 토큰');
    assert.deepStrictEqual(d.calls.fetches[0].body, { endpoint: 'https://push.example/ep-p1' }, '이 기기 구독 endpoint');
  });
  await check('서비스 워커가 준비되지 않아도(ready 가 끝나지 않음) 로그아웃은 막히지 않고 끝난다', async function () {
    const d = device({ getUserResult: userOk, swNeverReady: true, fastTimers: true });
    await d.api.performLogout();
    assert.deepStrictEqual(d.calls.signOut, [{ scope: 'local' }]);
    assert.ok(loggedOut(d), '로그아웃 화면으로 감');
  });
  await check('구독이 없거나 서비스 워커가 없는 브라우저는 구독 요청 0건으로 로그아웃한다', async function () {
    for (const o of [{ noSub: true }, { noServiceWorker: true }]) {
      const d = device(Object.assign({ getUserResult: userOk }, o));
      await d.api.performLogout();
      assert.strictEqual(d.calls.fetches.length, 0, JSON.stringify(o) + ' 요청 수');
      assert.ok(loggedOut(d), JSON.stringify(o) + ' 로그아웃 화면');
    }
  });
  await check('서버가 세션을 지운 기기(getUser: \'Auth session missing!\')는 끊긴 세션으로 판정되어 로그아웃 화면으로 간다', async function () {
    const d = device({ getUserResult: { data: { user: null }, error: { message: 'Auth session missing!', status: 400, name: 'AuthSessionMissingError' } } });
    const r = await d.api.checkRemoteSessionRevoked();
    assert.strictEqual(r, true, '판정 반환값');
    assert.ok(loggedOut(d), '로그아웃 화면으로 감');
    assert.strictEqual(d.calls.toasts.length, 1, '안내 1회');
  });
  await check('문구는 대소문자를 가리지 않는다(\'AUTH SESSION MISSING\')', async function () {
    const d = device({ getUserResult: { data: { user: null }, error: { message: 'AUTH SESSION MISSING', status: 400 } } });
    assert.strictEqual(await d.api.checkRemoteSessionRevoked(), true);
  });
  await check('getUser 오류 응답 401 도 끊긴 세션으로 판정된다', async function () {
    const d = device({ getUserResult: { data: { user: null }, error: { message: 'Unauthorized', status: 401 } } });
    assert.strictEqual(await d.api.checkRemoteSessionRevoked(), true);
    assert.ok(loggedOut(d), '로그아웃 화면으로 감');
  });
  await check('잠깐의 네트워크 오류(\'Failed to fetch\', status 0)로는 로그아웃시키지 않는다', async function () {
    const d = device({ getUserResult: { data: { user: null }, error: { message: 'Failed to fetch', status: 0, name: 'AuthRetryableFetchError' } } });
    assert.strictEqual(await d.api.checkRemoteSessionRevoked(), false);
    assert.ok(!loggedOut(d) && d.calls.signOut.length === 0, '로그인 상태 유지');
  });
  await check('로그인 직후 60초 안에는 \'Auth session missing!\' 이어도 로그아웃시키지 않는다(기존 오탐 방어 유지)', async function () {
    const d = device({ loginAgoMs: 5000, getUserResult: { data: { user: null }, error: { message: 'Auth session missing!', status: 400 } } });
    assert.strictEqual(await d.api.checkRemoteSessionRevoked(), false);
    assert.ok(!loggedOut(d), '로그인 상태 유지');
  });
  await check('세션이 살아 있으면(getUser 정상) 로그아웃시키지 않는다', async function () {
    const d = device({ getUserResult: userOk });
    assert.strictEqual(await d.api.checkRemoteSessionRevoked(), false);
    assert.ok(!loggedOut(d), '로그인 상태 유지');
  });
  await check('인자 없는 signOut()(기본값 global)은 탈퇴(submitWithdrawAccount) 1곳에만 남는다', function () {
    const code = noComments(html);
    const n = code.split('sb.auth.signOut()').length - 1;
    assert.strictEqual(n, 1, '인자 없는 signOut 수: ' + n);
    const w = extractFunction(html, 'async function submitWithdrawAccount(');
    assert.ok(noComments(w).includes('sb.auth.signOut()'), '탈퇴 경로의 signOut 은 기본값(global)');
  });
  await check('다른 기기 로그아웃은 그대로 { scope: \'others\' } 다', function () {
    const m = extractFunction(html, 'function openLogoutOtherDevicesConfirmModal(');
    assert.ok(noComments(m).includes("await sb.auth.signOut({ scope: 'others' })"));
  });

  const fail = results.filter((r) => !r.ok);
  for (const r of results) console.log((r.ok ? '  ok   ' : '  FAIL ') + r.name + (r.ok ? '' : ' — ' + r.err));
  console.log('logout-scope-es399: ' + (results.length - fail.length) + '/' + results.length + ' (root: ' + path.basename(ROOT) + ')');
  if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify({ test: 'logout-scope-es399', root: path.basename(ROOT), total: results.length, passed: results.length - fail.length, failed: fail.length, results: results }, null, 1), 'utf8');
  process.exitCode = fail.length ? 1 : 0;
})();
