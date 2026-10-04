'use strict';
// 푸시 구독 등록·삭제 인증 시험 (#TASK-ES-400)
// 결함: /api/push-subscribe POST·DELETE 가 토큰이 있을 때만 소유를 확인했고, 앱은 토큰을 보내지 않았다.
//   → 토큰 없이 남의 userId 로 자기 기기를 등록할 수 있었다(그 사람 앞 푸시가 그 기기로 간다).
// 이 시험은 (가) 서버 처리기를 그대로 부르고 @supabase/supabase-js 만 노드 안의 가짜로 바꿔
//   토큰 없음 401 · 가짜 토큰 401 · 남의 userId 403 · 본인 200(행 user_id = 토큰 uid) · 남의 구독 삭제 403 · 본인 삭제 200 을 재고,
// (나) index.html 의 syncPushSubscription·removePushSubscription 함수 본문을 꺼내 노드 vm 에서 돌려
//   로그인 세션이 있으면 Bearer 를 붙여 보내고, 세션이 없으면 요청 0건인지 잰다(네트워크 없음).
// 사용: node <이 시험 파일> [저장소 뿌리 경로] [결과 JSON 경로] — 기준 사본(git archive)을 넘기면 그 사본을 잰다.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Module = require('module');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const OUT = process.argv[3] || null;
const ME = '11111111-1111-4111-8111-111111111111';
const STRANGER = '00000000-0000-4000-8000-000000000003';
const USER_TOKEN = 'session-token-of-me';
const EP_ME = 'https://push.example.invalid/ep-me';
const EP_STRANGER = 'https://push.example.invalid/ep-stranger';
const EP_NEW = 'https://push.example.invalid/ep-new';

const results = [];
function check(name, fn) {
  return Promise.resolve().then(fn).then(function () { results.push({ name: name, ok: true }); }, function (e) { results.push({ name: name, ok: false, err: String(e && e.message || e) }); });
}

/* ---------- (가) 서버 처리기 ---------- */
function makeDb() {
  return {
    push_subscriptions: [
      { endpoint: EP_ME, user_id: ME, p256dh: 'k', auth: 'a' },
      { endpoint: EP_STRANGER, user_id: STRANGER, p256dh: 'k', auth: 'a' }
    ]
  };
}
function fakeClient(db) {
  return {
    auth: {
      getUser: async function (t) {
        return t === USER_TOKEN ? { data: { user: { id: ME } }, error: null } : { data: { user: null }, error: { message: 'invalid jwt' } };
      }
    },
    from: function (tableName) {
      const filters = [];
      let mode = 'select';
      let limitN = null;
      const q = {
        select: function () { return q; },
        eq: function (k, v) { filters.push(function (r) { return String(r[k]) === String(v); }); return q; },
        limit: function (n) { limitN = n; return q; },
        delete: function () { mode = 'delete'; return q; },
        upsert: async function (row) {
          const list = db[tableName] = db[tableName] || [];
          const i = list.findIndex(function (r) { return r.endpoint === row.endpoint; });
          if (i >= 0) list[i] = Object.assign({}, list[i], row); else list.push(Object.assign({}, row));
          return { error: null };
        },
        then: function (res, rej) {
          const list = db[tableName] || [];
          const hit = list.filter(function (r) { return filters.every(function (f) { return f(r); }); });
          if (mode === 'delete') {
            db[tableName] = list.filter(function (r) { return hit.indexOf(r) < 0; });
            return Promise.resolve({ data: null, error: null }).then(res, rej);
          }
          const rows = limitN != null ? hit.slice(0, limitN) : hit;
          return Promise.resolve({ data: rows.map(function (r) { return Object.assign({}, r); }), error: null }).then(res, rej);
        }
      };
      return q;
    }
  };
}
function loadServer(db) {
  const file = path.join(ROOT, 'api', 'push-subscribe.js');
  const origLoad = Module._load;
  Module._load = function (request) {
    if (request === '@supabase/supabase-js') return { createClient: function () { return fakeClient(db); } };
    return origLoad.apply(this, arguments);
  };
  try {
    delete require.cache[require.resolve(file)];
    return require(file);
  } finally {
    Module._load = origLoad;
  }
}
function fakeRes() {
  const r = { statusCode: null, body: null, headers: {} };
  r.status = function (c) { r.statusCode = c; return r; };
  r.json = function (b) { r.body = b; return r; };
  r.send = function (b) { r.body = b; return r; };
  r.setHeader = function (k, v) { r.headers[k] = v; };
  return r;
}
async function call(method, body, token, url) {
  const db = makeDb();
  const handler = loadServer(db);
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = 'Bearer ' + token;
  const res = fakeRes();
  await handler({ method: method, url: url || '/api/push-subscribe', headers: headers, body: body, query: {} }, res);
  return { res: res, db: db };
}
const subOf = function (ep) { return { endpoint: ep, keys: { p256dh: 'p', auth: 'a' } }; };
const rowOf = function (db, ep) { return (db.push_subscriptions || []).find(function (r) { return r.endpoint === ep; }) || null; };

/* ---------- (나) 앱 쪽: index.html 의 두 함수 본문을 꺼내 돌린다 ---------- */
function extractFn(src, name) {
  const at = src.indexOf('  async function ' + name + '(){');
  assert.ok(at >= 0, 'index.html 에 ' + name + ' 정의');
  const end = src.indexOf('\n  }\n', at);
  assert.ok(end > at, name + ' 끝 찾음');
  return src.slice(at, end + 4);
}
function loadApp(withSession) {
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
  const code = extractFn(src, 'syncPushSubscription') + '\n' + extractFn(src, 'removePushSubscription');
  const requests = [];
  const subscription = {
    endpoint: EP_NEW,
    toJSON: function () { return subOf(EP_NEW); },
    unsubscribe: async function () { return true; }
  };
  const ctx = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    navigator: { serviceWorker: { ready: Promise.resolve({ pushManager: { getSubscription: async function () { return subscription; }, subscribe: async function () { return subscription; } } }) } },
    PushManager: function () {},
    Notification: { permission: 'granted' },
    Intl: Intl, JSON: JSON, Promise: Promise, String: String, Array: Array, Object: Object, Uint8Array: Uint8Array,
    state: { profile: { id: ME, settings: { checkinTimes: ['09:00'] } } },
    getSupabaseAuthToken: async function () { return withSession ? USER_TOKEN : null; },
    urlBase64ToUint8Array: function () { return new Uint8Array(1); },
    fetch: async function (url, opts) {
      requests.push({ url: url, method: (opts && opts.method) || 'GET', headers: (opts && opts.headers) || {}, body: opts && opts.body ? JSON.parse(opts.body) : null });
      return { ok: true, json: async function () { return { publicKey: 'x' }; } };
    }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(code + '\nthis.__sync = syncPushSubscription; this.__remove = removePushSubscription;', ctx, { filename: 'index.html#push-subscribe' });
  return { ctx: ctx, requests: requests };
}
const apiCalls = function (reqs, method) { return reqs.filter(function (r) { return r.url === '/api/push-subscribe' && r.method === method; }); };

(async function () {
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'unit-test-service-key';
  process.env.VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'unit-test-vapid-public';

  await check('S1 POST 토큰 없음 + 남의 userId → 401, 행 안 생김', async function () {
    const r = await call('POST', { userId: STRANGER, subscription: subOf(EP_NEW) }, null);
    assert.strictEqual(r.res.statusCode, 401, '응답 코드');
    assert.strictEqual(rowOf(r.db, EP_NEW), null, '새 행 없음');
  });
  await check('S2 POST 가짜 토큰 → 401, 행 안 생김', async function () {
    const r = await call('POST', { userId: ME, subscription: subOf(EP_NEW) }, 'forged-token');
    assert.strictEqual(r.res.statusCode, 401, '응답 코드');
    assert.strictEqual(rowOf(r.db, EP_NEW), null, '새 행 없음');
  });
  await check('S3 POST 본인 토큰 + 남의 userId → 403, 행 안 생김', async function () {
    const r = await call('POST', { userId: STRANGER, subscription: subOf(EP_NEW) }, USER_TOKEN);
    assert.strictEqual(r.res.statusCode, 403, '응답 코드');
    assert.strictEqual(rowOf(r.db, EP_NEW), null, '새 행 없음');
  });
  await check('S4 POST 본인 토큰 + 본인 userId → 200, 행 user_id = 토큰 uid', async function () {
    const r = await call('POST', { userId: ME, subscription: subOf(EP_NEW) }, USER_TOKEN);
    assert.strictEqual(r.res.statusCode, 200, '응답 코드');
    const row = rowOf(r.db, EP_NEW);
    assert.ok(row, '새 행 있음');
    assert.strictEqual(row.user_id, ME, '행 user_id');
  });
  await check('S5 POST 본인 토큰 + userId 생략 → 200, 행 user_id = 토큰 uid', async function () {
    const r = await call('POST', { subscription: subOf(EP_NEW) }, USER_TOKEN);
    assert.strictEqual(r.res.statusCode, 200, '응답 코드');
    const row = rowOf(r.db, EP_NEW);
    assert.ok(row, '새 행 있음');
    assert.strictEqual(row.user_id, ME, '행 user_id');
  });
  await check('S6 DELETE 토큰 없음 → 401, 남의 구독 행 그대로', async function () {
    const r = await call('DELETE', { endpoint: EP_STRANGER }, null);
    assert.strictEqual(r.res.statusCode, 401, '응답 코드');
    assert.ok(rowOf(r.db, EP_STRANGER), '행 남음');
  });
  await check('S7 DELETE 본인 토큰으로 남의 구독 → 403, 행 그대로', async function () {
    const r = await call('DELETE', { endpoint: EP_STRANGER }, USER_TOKEN);
    assert.strictEqual(r.res.statusCode, 403, '응답 코드');
    assert.ok(rowOf(r.db, EP_STRANGER), '행 남음');
  });
  await check('S8 DELETE 본인 토큰으로 본인 구독 → 200, 그 행만 지워짐', async function () {
    const r = await call('DELETE', { endpoint: EP_ME }, USER_TOKEN);
    assert.strictEqual(r.res.statusCode, 200, '응답 코드');
    assert.strictEqual(rowOf(r.db, EP_ME), null, '본인 행 지워짐');
    assert.ok(rowOf(r.db, EP_STRANGER), '남의 행 남음');
  });
  await check('S9 GET 공개키 조회는 토큰 없이 200 그대로', async function () {
    const r = await call('GET', null, null, '/api/vapid-public-key');
    assert.strictEqual(r.res.statusCode, 200, '응답 코드');
    assert.strictEqual(r.res.body && r.res.body.publicKey, process.env.VAPID_PUBLIC_KEY, '공개키');
  });

  await check('A1 앱 구독 등록: 로그인 세션 → POST 1건, Authorization = Bearer 세션 토큰', async function () {
    const app = loadApp(true);
    await app.ctx.__sync();
    const posts = apiCalls(app.requests, 'POST');
    assert.strictEqual(posts.length, 1, 'POST 건수');
    assert.strictEqual(posts[0].headers.Authorization, 'Bearer ' + USER_TOKEN, 'Authorization 머리글');
    assert.strictEqual(posts[0].body.subscription.endpoint, EP_NEW, '구독 endpoint');
  });
  await check('A2 앱 구독 등록: 세션 없음(게스트) → POST 0건', async function () {
    const app = loadApp(false);
    await app.ctx.__sync();
    assert.strictEqual(apiCalls(app.requests, 'POST').length, 0, 'POST 건수');
  });
  await check('A3 앱 구독 해제: 로그인 세션 → DELETE 1건, Authorization = Bearer 세션 토큰', async function () {
    const app = loadApp(true);
    await app.ctx.__remove();
    const dels = apiCalls(app.requests, 'DELETE');
    assert.strictEqual(dels.length, 1, 'DELETE 건수');
    assert.strictEqual(dels[0].headers.Authorization, 'Bearer ' + USER_TOKEN, 'Authorization 머리글');
    assert.strictEqual(dels[0].body.endpoint, EP_NEW, '삭제 endpoint');
  });
  await check('A4 앱 구독 해제: 세션 없음 → DELETE 0건', async function () {
    const app = loadApp(false);
    await app.ctx.__remove();
    assert.strictEqual(apiCalls(app.requests, 'DELETE').length, 0, 'DELETE 건수');
  });

  const failed = results.filter(function (r) { return !r.ok; }).length;
  for (const r of results) console.log('  ' + (r.ok ? 'ok' : '실패') + ' · ' + r.name + (r.ok ? '' : ' — ' + r.err));
  console.log('[push-subscribe-auth-es400] ' + (results.length - failed) + ' ok · ' + failed + ' failed');
  if (OUT) {
    fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify({ total: results.length, passed: results.length - failed, failed: failed, results: results }, null, 1) + '\n', 'utf8');
  }
  if (failed > 0) process.exitCode = 1;
})();
