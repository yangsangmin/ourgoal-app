'use strict';
// DM 즉시 푸시 인증·받는 사람 칸 시험 (#TASK-ES-397)
// 실측(reports/TASK-ES-397/live-base.json): 운영에서 A→B DM 전송·피드 공유 DM 의 /api/push-dispatch 요청이 둘 다 401 이었다.
//   ① 두 요청 모두 Authorization 머리글이 없었다 → 'unauthorized: missing bearer token'
//   ② 피드 공유는 받는 사람을 receiver_id 로 보냈다 — 서버 즉시 발송 분기는 targetUserId 만 읽는다
//   ③ 로그인 세션 토큰을 붙여도 서버 isAuthorized 는 크론 비밀값·DB 토큰만 받아 'unauthorized'
// 이 시험은 (가) 앱 쪽 두 요청이 로그인 세션 Bearer + targetUserId 로 나가는지, (나) 서버가 즉시 발송 분기에서만
// 로그인 사용자 + 방금 그 상대에게 보낸 DM 행이 있을 때 받고, 나머지(토큰 없음·가짜 토큰·DM 행 없음·자기 자신·정기 발송)는 거절하는지 잰다.
// 앱 파일·서버 처리기를 그대로 읽고, 바깥 모듈(@supabase/supabase-js·web-push)과 fetch 만 노드 안의 가짜로 바꾼다(네트워크 없음).
// 사용: node <이 시험 파일> [저장소 뿌리 경로] [결과 JSON 경로] — 기준 커밋 사본(git archive)을 넘기면 그 사본을 잰다.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Module = require('module');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const ME = '11111111-1111-4111-8111-111111111111';
const PEER = '00000000-0000-4000-8000-000000000002';
const STRANGER = '00000000-0000-4000-8000-000000000003';
const USER_TOKEN = 'session-token-of-me';

const results = [];
function check(name, fn) {
  return Promise.resolve().then(fn).then(function () { results.push({ name, ok: true }); }, function (e) { results.push({ name, ok: false, err: String(e && e.message || e) }); });
}
const noComments = function (s) { return s.split(/\r?\n/).filter(function (l) { return !/^\s*(\/\/|\/?\*)/.test(l); }).join('\n'); };
const flush = function () { return new Promise(function (r) { setTimeout(r, 0); }); };

/* ---------- (가) 앱 쪽: 피드 공유 DM 은 화면 그대로 누른다 ---------- */
function listTeamCommParts(rootDir) {
  const dir = path.join(rootDir, 'js');
  return fs.readdirSync(dir).filter((n) => n.indexOf('team-') === 0 && n !== 'team-invite-comm.js' && n.endsWith('.js')).sort()
    .map((n) => path.join(dir, n)).filter((f) => fs.statSync(f).isFile() && fs.readFileSync(f, 'utf8').indexOf('OurgoalTeamCommKit') >= 0);
}
function loadApp(withSession) {
  const pushes = [];
  const buttons = [];
  const sheet = {
    querySelector: function () { return null; },
    querySelectorAll: function (sel) { return sel === '[data-sharecompdm]' ? buttons : []; }
  };
  const table = function () {
    return {
      upsert: function () { return Promise.resolve({ error: null }); },
      insert: function () { return Promise.resolve({ error: null }); }
    };
  };
  const win = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    state: { profile: { id: ME, displayName: '나', companions: [{ id: PEER, nickname: '상대' }] } },
    sb: {
      from: table,
      auth: { getSession: function () { return Promise.resolve({ data: { session: withSession ? { access_token: USER_TOKEN } : null } }); } }
    },
    fetch: function (url, opts) { pushes.push({ url: url, headers: (opts && opts.headers) || {}, body: JSON.parse(opts.body) }); return Promise.resolve({ ok: true }); },
    localStorage: { getItem: function () { return null; }, setItem: function () {} },
    openModal: function (html, onMount) {
      const m = /data-sharecompdm="([^"]+)"/.exec(html);
      if (m) buttons.push({ disabled: false, textContent: '', getAttribute: function () { return m[1]; } });
      onMount(sheet);
    },
    closeModal: function () {},
    setTimeout: setTimeout, Promise: Promise, Date: Date, Math: Math, JSON: JSON, String: String, Array: Array, Object: Object
  };
  win.window = win;
  const ctx = vm.createContext(win);
  // 브라우저와 같은 순서: index.html 에서 js/tabs/comm/dm-ledger.js 가 팀 부품보다 먼저 로드된다
  const files = ['js/tabs/comm/dm-ledger.js'].concat(listTeamCommParts(ROOT).map(function (f) { return 'js/' + path.basename(f); }), ['js/team-invite-comm.js']);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  win.OurgoalTeamInviteComm.init({ toast: function () {} });
  return { win, pushes, buttons };
}
async function shareOnce(withSession) {
  const app = loadApp(withSession);
  app.win.OurgoalTeamInviteComm.openFeedShareModal({ id: 'post_1', name: '작성자', goal: '아침 달리기', action: '5km' });
  assert.strictEqual(app.buttons.length, 1, '동반자 버튼 1개');
  await app.buttons[0].onclick();
  for (let i = 0; i < 5; i++) await flush();
  return app.pushes.filter(function (p) { return p.url === '/api/push-dispatch'; });
}
/* DM 화면 전송: send() 안의 /api/push-dispatch 호출 묶음(주석 줄 제외)을 꺼낸다 */
function roomPushCall() {
  const code = noComments(fs.readFileSync(path.join(ROOT, 'js', 'team-dm-room.js'), 'utf8'));
  const at = code.indexOf("fetch('/api/push-dispatch'");
  assert.ok(at >= 0, "js/team-dm-room.js 에 fetch('/api/push-dispatch' 호출");
  const end = code.indexOf("tag: 'dm-' + threadId", at);
  assert.ok(end > at, '호출 묶음 끝(tag) 찾음');
  return { call: code.slice(at, end), before: code.slice(Math.max(0, at - 600), at) };
}

/* ---------- (나) 서버 쪽: 처리기를 그대로 부르고 Supabase·web-push 만 가짜로 ---------- */
function loadServer(db) {
  const sent = [];
  const fakeSb = {
    auth: { getUser: async function (t) { return t === USER_TOKEN ? { data: { user: { id: ME } }, error: null } : { data: { user: null }, error: { message: 'invalid jwt' } }; } },
    rpc: async function (name) { return name === 'push_dispatch_token' ? { data: 'db-vault-token', error: null } : { data: null, error: { message: 'no rpc' } }; },
    from: function (tableName) {
      const filters = [];
      let limitN = null;
      const q = {
        select: function () { return q; },
        eq: function (k, v) { filters.push(function (r) { return String(r[k]) === String(v); }); return q; },
        gte: function (k, v) { filters.push(function (r) { return String(r[k]) >= String(v); }); return q; },
        limit: function (n) { limitN = n; return q; },
        delete: function () { return q; },
        update: function () { return q; },
        then: function (res, rej) {
          let rows = (db[tableName] || []).filter(function (r) { return filters.every(function (f) { return f(r); }); });
          if (limitN != null) rows = rows.slice(0, limitN);
          return Promise.resolve({ data: rows, error: null }).then(res, rej);
        }
      };
      return q;
    }
  };
  const fakeWebpush = {
    setVapidDetails: function () {},
    sendNotification: async function (sub, payload) { sent.push({ endpoint: sub.endpoint, payload: JSON.parse(payload) }); return {}; }
  };
  const file = path.join(ROOT, 'api', 'push-dispatch.js');
  const origLoad = Module._load;
  Module._load = function (request) {
    if (request === '@supabase/supabase-js') return { createClient: function () { return fakeSb; } };
    if (request === 'web-push') return fakeWebpush;
    return origLoad.apply(this, arguments);
  };
  let handler;
  try { delete require.cache[require.resolve(file)]; handler = require(file); } finally { Module._load = origLoad; }
  return { handler, sent };
}
async function call(handler, opts) {
  const out = { statusCode: null, json: null };
  const req = { method: opts.method || 'POST', headers: opts.token ? { authorization: 'Bearer ' + opts.token } : {}, body: opts.body || {}, query: {} };
  const res = { status: function (c) { out.statusCode = c; return res; }, json: function (j) { out.json = j; return res; }, setHeader: function () {}, end: function () { return res; } };
  await handler(req, res);
  return out;
}
const recent = function () { return new Date(Date.now() - 30 * 1000).toISOString(); };
const old = function () { return new Date(Date.now() - 60 * 60 * 1000).toISOString(); };
function db(replies) {
  return {
    push_subscriptions: [{ user_id: PEER, endpoint: 'push-endpoint-peer', p256dh: 'k', auth: 'a' }, { user_id: STRANGER, endpoint: 'push-endpoint-stranger', p256dh: 'k', auth: 'a' }],
    team_ping_replies: replies
  };
}

(async function () {
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-placeholder-for-unit';
  process.env.VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'vapid-public-placeholder';
  process.env.VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'vapid-private-placeholder';

  // (가) 앱 쪽
  let sharePushes = [];
  await check('피드 공유 DM → 푸시 요청 1건이 로그인 세션 Bearer 를 붙여 나간다', async function () {
    sharePushes = await shareOnce(true);
    assert.strictEqual(sharePushes.length, 1, '푸시 요청 1건');
    assert.strictEqual(sharePushes[0].headers['Authorization'], 'Bearer ' + USER_TOKEN, 'Authorization 머리글 = 로그인 세션 Bearer');
  });
  await check('피드 공유 DM 푸시의 받는 사람 칸 = 서버가 읽는 targetUserId (receiver_id 아님)', function () {
    assert.ok(sharePushes[0], '요청 있음');
    assert.strictEqual(sharePushes[0].body.targetUserId, PEER, 'targetUserId = 받는 사람');
    assert.ok(!('receiver_id' in sharePushes[0].body), 'receiver_id 칸 없음');
  });
  await check('로그인 세션이 없으면 피드 공유 DM 푸시 요청을 보내지 않는다(토큰 없는 요청 0건)', async function () {
    const p = await shareOnce(false);
    assert.strictEqual(p.length, 0, '토큰 없는 요청 ' + p.length + '건');
  });
  await check('DM 화면 전송의 푸시 호출에 Authorization Bearer 머리글이 있다', function () {
    const r = roomPushCall();
    assert.ok(/'Authorization'\s*:\s*'Bearer '\s*\+\s*pushToken/.test(r.call), "headers 에 'Authorization': 'Bearer ' + pushToken");
    assert.ok(r.before.includes('getAuthToken()'), '호출 앞에서 로그인 세션 토큰을 구한다');
    assert.ok(r.before.includes('if(!pushToken) return null;'), '토큰이 없으면 보내지 않는다');
  });
  await check('DM 화면 전송의 받는 사람 칸 = targetUserId', function () {
    const r = roomPushCall();
    assert.ok(r.call.includes('targetUserId: person.id'), 'targetUserId: person.id');
  });

  // (나) 서버 쪽
  await check('서버: 로그인 사용자 + 방금 그 상대에게 보낸 DM 행 → 200, 그 상대 구독에만 발송', async function () {
    const s = loadServer(db([{ id: 'r1', sender_id: ME, receiver_id: PEER, created_at: recent() }]));
    const r = await call(s.handler, { token: USER_TOKEN, body: { targetUserId: PEER, title: 't', body: 'b', url: '/#comm', tag: 'dm-x' } });
    assert.strictEqual(r.statusCode, 200, '응답 ' + r.statusCode + ' ' + JSON.stringify(r.json));
    assert.strictEqual(s.sent.length, 1, '발송 1건');
    assert.strictEqual(s.sent[0].endpoint, 'push-endpoint-peer', '받는 사람 구독');
  });
  await check('서버: 로그인 사용자라도 그 상대에게 보낸 최근 DM 행이 없으면 403, 발송 0', async function () {
    const s = loadServer(db([{ id: 'r1', sender_id: ME, receiver_id: PEER, created_at: old() }]));
    const r = await call(s.handler, { token: USER_TOKEN, body: { targetUserId: STRANGER, title: 't', body: 'b' } });
    assert.strictEqual(r.statusCode, 403, '응답 ' + r.statusCode);
    const r2 = await call(s.handler, { token: USER_TOKEN, body: { targetUserId: PEER, title: 't', body: 'b' } });
    assert.strictEqual(r2.statusCode, 403, '오래된 DM 행만 있을 때 응답 ' + r2.statusCode);
    assert.strictEqual(s.sent.length, 0, '발송 ' + s.sent.length);
  });
  await check('서버: 자기 자신을 받는 사람으로 지정하면 403', async function () {
    const s = loadServer(db([{ id: 'r1', sender_id: ME, receiver_id: ME, created_at: recent() }]));
    const r = await call(s.handler, { token: USER_TOKEN, body: { targetUserId: ME, title: 't', body: 'b' } });
    assert.strictEqual(r.statusCode, 403, '응답 ' + r.statusCode);
    assert.strictEqual(s.sent.length, 0);
  });
  await check('서버: 가짜 토큰·토큰 없음은 즉시 발송도 401, 발송 0', async function () {
    const s = loadServer(db([{ id: 'r1', sender_id: ME, receiver_id: PEER, created_at: recent() }]));
    const r = await call(s.handler, { token: 'forged-token', body: { targetUserId: PEER } });
    const r2 = await call(s.handler, { body: { targetUserId: PEER } });
    assert.strictEqual(r.statusCode, 401, '가짜 토큰 ' + r.statusCode);
    assert.strictEqual(r2.statusCode, 401, '토큰 없음 ' + r2.statusCode);
    assert.strictEqual(s.sent.length, 0);
  });
  await check('서버: 로그인 사용자 토큰으로는 정기 발송(크론) 분기에 못 들어간다 — 401', async function () {
    const s = loadServer(db([{ id: 'r1', sender_id: ME, receiver_id: PEER, created_at: recent() }]));
    const r = await call(s.handler, { token: USER_TOKEN, body: {} });
    assert.strictEqual(r.statusCode, 401, '응답 ' + r.statusCode);
    assert.strictEqual(s.sent.length, 0);
  });
  await check('서버: 사용자 호출 알림은 앱 안 경로만 연다(바깥 주소 → /#comm)', async function () {
    const s = loadServer(db([{ id: 'r1', sender_id: ME, receiver_id: PEER, created_at: recent() }]));
    const r = await call(s.handler, { token: USER_TOKEN, body: { targetUserId: PEER, title: 't', body: 'b', url: 'https://elsewhere.example/x' } });
    assert.strictEqual(r.statusCode, 200, '응답 ' + r.statusCode);
    assert.strictEqual(s.sent[0] && s.sent[0].payload.url, '/#comm');
  });
  await check('서버: DB 토큰(비밀값) 호출은 예전처럼 DM 행 없이도 즉시 발송 200', async function () {
    const s = loadServer(db([]));
    const r = await call(s.handler, { token: 'db-vault-token', body: { targetUserId: PEER, title: 't', body: 'b' } });
    assert.strictEqual(r.statusCode, 200, '응답 ' + r.statusCode);
    assert.strictEqual(s.sent.length, 1);
  });

  const fail = results.filter(function (r) { return !r.ok; });
  for (const r of results) console.log((r.ok ? '  ok   ' : '  FAIL ') + r.name + (r.ok ? '' : ' — ' + r.err));
  console.log('dm-push-auth: ' + (results.length - fail.length) + '/' + results.length + ' (root: ' + path.basename(ROOT) + ')');
  if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify({ test: 'dm-push-auth-es397', root: path.basename(ROOT), total: results.length, passed: results.length - fail.length, failed: fail.length, results: results }, null, 1));
  process.exitCode = fail.length ? 1 : 0;
})();
