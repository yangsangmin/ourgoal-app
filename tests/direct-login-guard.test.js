// tests/direct-login-guard.test.js
// #TASK-ES-368 (노션 CORE-13): 빠른 복구·닉네임 입장(loginWithDirectIdentifier)이 입력값과 상관없이 이 기기의 첫 백업 uid 로
// 인증 없이 입장하던 결함의 회귀 시험. 확인 수준: "부품만 돌려 봄" — index.html 의 실제 함수 본문을 잘라
// 메모리 가짜 브라우저(localStorage)·가짜 Supabase(RLS 흉내)로 돌린다. 실서버·실계정 왕복이 아니다.
// 가짜 Supabase·서버 처리기 부분은 tests/account-switch-isolation.test.js(#TASK-ES-365)와 같은 방식이다.
// 실행: node tests/direct-login-guard.test.js [--html <index.html 경로>]   (워크트리에 node_modules 가 없으면 NODE_PATH 로 본 저장소 것을 쓴다)

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var Module = require('module');

var ROOT = path.join(__dirname, '..');
var htmlArg = process.argv.indexOf('--html');
var HTML_PATH = htmlArg > -1 ? path.resolve(process.argv[htmlArg + 1]) : path.join(ROOT, 'index.html');
var html = require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(HTML_PATH, 'utf8')); /* #TASK-ES-441 인라인 합본(원문 맨 앞 + js/tabs 세포) */
var Ledger = require('../js/record-ledger');
var isoPath = path.join(ROOT, 'js', 'account-isolation.js');
var isolationSrc = fs.existsSync(isoPath) ? fs.readFileSync(isoPath, 'utf8') : null; /* 브라우저처럼 가짜 window·localStorage 안에서 돌린다 */
var guardPath = path.join(ROOT, 'js', 'direct-login-guard.js');
var guardSrc = fs.existsSync(guardPath) ? fs.readFileSync(guardPath, 'utf8') : null;

var UID_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
var UID_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
var A_MARK = 'A만의 표식 기록 ogtest-a-only';
var A_BIO = 'A 의 소개글';

/* ---------- index.html 에서 함수 본문 잘라 오기(중괄호 짝 맞춤, 문자열·주석 건너뜀) ---------- */
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

/* ---------- 메모리 localStorage ---------- */
function MemStorage() { this.m = new Map(); }
MemStorage.prototype.getItem = function (k) { return this.m.has(k) ? this.m.get(k) : null; };
MemStorage.prototype.setItem = function (k, v) { this.m.set(k, String(v)); };
MemStorage.prototype.removeItem = function (k) { this.m.delete(k); };
MemStorage.prototype.key = function (i) { return Array.from(this.m.keys())[i] || null; };
MemStorage.prototype.clear = function () { this.m.clear(); };
Object.defineProperty(MemStorage.prototype, 'length', { get: function () { return this.m.size; } });

/* ---------- 가짜 Supabase(서버 표 하나를 브라우저·서버가 같이 본다). RLS 흉내: user_id 가 세션 uid 와 다르면 거절 ---------- */
function ServerDb() { this.tables = { users: [], goals: [], checkins: [], events: [] }; this.attempts = []; }
function Query(db, name, sessionUid, isService) {
  this.db = db; this.name = name; this.uid = sessionUid; this.service = isService; this.filters = []; this.mode = 'select'; this.patch = null; this.single = false;
}
Query.prototype.select = function () { this.mode = 'select'; return this; };
Query.prototype.eq = function (c, v) { this.filters.push(function (r) { return r[c] === v; }); return this; };
Query.prototype.is = function (c, v) { this.filters.push(function (r) { return (r[c] === undefined ? null : r[c]) === v; }); return this; };
Query.prototype.filter = function () { return this; };
Query.prototype.order = function () { return this; };
Query.prototype.limit = function () { return this; };
Query.prototype.ilike = function () { return this; };
Query.prototype.neq = function () { return this; };
Query.prototype.maybeSingle = function () { this.single = true; return this; };
Query.prototype.insert = function (row) { this.db.tables[this.name].push(row); return Promise.resolve({ data: null, error: null }); };
Query.prototype.update = function (p) { this.mode = 'update'; this.patch = p; return this; };
Query.prototype.upsert = function (rows) {
  var self = this, list = Array.isArray(rows) ? rows : [rows];
  var t = this.db.tables[this.name];
  var ownerCol = this.name === 'users' ? 'id' : 'user_id';
  list.forEach(function (r) { self.db.attempts.push({ table: self.name, by: self.uid, row: JSON.parse(JSON.stringify(r)) }); });
  if (!this.service) {
    var bad = list.filter(function (r) { return r[ownerCol] !== self.uid; });
    var stolen = list.filter(function (r) { var ex = t.find(function (x) { return x.id === r.id; }); return ex && ex[ownerCol] !== self.uid; });
    if (bad.length || stolen.length) return Promise.resolve({ data: null, error: { message: 'new row violates row-level security policy' } });
  }
  list.forEach(function (r) {
    var ex = t.find(function (x) { return x.id === r.id; });
    if (ex) Object.assign(ex, r); else t.push(Object.assign({ created_at: new Date().toISOString() }, r));
  });
  return Promise.resolve({ data: null, error: null });
};
Query.prototype.then = function (ok, no) {
  var self = this, t = this.db.tables[this.name] || [];
  var rows = t.filter(function (r) { return self.filters.every(function (f) { return f(r); }); });
  if (this.mode === 'update') { rows.forEach(function (r) { Object.assign(r, self.patch); }); return Promise.resolve({ data: null, error: null }).then(ok, no); }
  var data = JSON.parse(JSON.stringify(rows));
  if (this.single) data = data[0] || null;
  return Promise.resolve({ data: data, error: null }).then(ok, no);
};
function browserClient(db, getUid) {
  return {
    auth: {
      signOut: function () { session.uid = null; return Promise.resolve({ error: null }); },
      getSession: function () { return Promise.resolve({ data: { session: session.uid ? { access_token: 'tok-' + session.uid, user: { id: session.uid } } : null } }); },
      getUser: function () { return Promise.resolve({ data: { user: session.uid ? { id: session.uid } : null }, error: null }); }
    },
    from: function (n) { return new Query(db, n, getUid(), false); }
  };
}

/* ---------- 서버 처리기(api/track.js 실제 코드) — 토큰의 uid 로만 조회 ---------- */
var session = { uid: null };
var serverDb = null;
var origLoad = Module._load;
Module._load = function (req) {
  if (req === '@supabase/supabase-js') {
    return {
      createClient: function () {
        return {
          auth: { getUser: function (token) { var u = String(token || '').replace(/^tok-/, ''); return Promise.resolve(u ? { data: { user: { id: u } }, error: null } : { data: null, error: { message: 'no' } }); } },
          from: function (n) { return new Query(serverDb, n, null, true); }
        };
      }
    };
  }
  return origLoad.apply(this, arguments);
};
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-not-a-real-key';
var trackHandler = require('../api/track');
var trackBodies = [];
function fakeFetch(url, opts) {
  if (String(url).indexOf('/api/track') === -1) return Promise.resolve({ ok: false, json: function () { return Promise.resolve({}); } });
  var body = JSON.parse(opts.body);
  trackBodies.push(body);
  var out = { status: 200, body: null };
  var res = {
    status: function (c) { out.status = c; return res; }, setHeader: function () { return res; },
    json: function (d) { out.body = d; return res; }, end: function () { return res; }, send: function (d) { out.body = d; return res; }
  };
  var auth = (opts.headers && opts.headers.Authorization) || '';
  return Promise.resolve(trackHandler({ method: 'POST', headers: { authorization: auth }, body: body, query: {} }, res)).then(function () {
    return { ok: out.status === 200, json: function () { return Promise.resolve(out.body); } };
  });
}

/* ---------- 가짜 브라우저 하나(같은 브라우저 = 같은 localStorage) ---------- */
function makeBrowser() {
  var ls = new MemStorage(), ss = new MemStorage();
  var state = { profile: null, activeTab: 'records' };
  var els = {};
  var el = function (id) { if (!els[id]) els[id] = { id: id, style: {}, textContent: '', classList: { add: function () {}, remove: function () {} }, click: function () {} }; return els[id]; };
  var win = { OurgoalRecordLedger: Ledger };
  var calls = { enterApp: 0, toasts: [] };
  var ctx = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    JSON: JSON, Date: Date, Math: Math, Object: Object, Array: Array, String: String, Number: Number, Set: Set, Map: Map, Promise: Promise, RegExp: RegExp, Error: Error, Uint8Array: Uint8Array,
    setTimeout: setTimeout, clearInterval: clearInterval,
    localStorage: ls, sessionStorage: ss, state: state, window: win,
    document: { getElementById: el, querySelector: function (q) { return q === '[data-authtab="login"]' ? el('authTabLogin') : null; } },
    fetch: fakeFetch,
    toast: function (msg) { calls.toasts.push(String(msg)); }, track: function () {}, getAttribution: function () { return {}; },
    updateAppBadge: function () {}, computeStreakDays: function () { return 0; }, syncLockScreenLiveCard: function () {},
    initRememberedAuthFields: function () {},
    renderRecordsScreen: function () {}, renderHomeScreen: function () {}, renderCalendarScreen: function () {}, renderSettingsScreen: function () {},
    getTrashList: function () { return []; },
    isValidRealUser: function (id) { return /^[0-9a-f-]{36}$/.test(String(id)); },
    resolveUniqueDisplayName: function (n) { return Promise.resolve(n); },
    classifyRecordTheme: function () { return { theme: 'daily' }; },
    getSupabaseAuthToken: function () { return Promise.resolve(session.uid ? 'tok-' + session.uid : null); },
    purgeLegacySharedGcalKeys: function () {},
    defaultSettings: function () { return { privacy: {}, customSchedules: [] }; },
    nowISO: function () { return new Date().toISOString(); },
    applyAppSettings: function () {},
    setDeviceLoginTime: function () {},
    enterApp: function () { calls.enterApp++; },
    loadLocalSettings: function (u) { try { return JSON.parse(ls.getItem('ourgoal_settings_' + u) || 'null') || { privacy: {}, customSchedules: [] }; } catch (e) { return {}; } },
    saveLocalSettings: function (u, s) { ls.setItem('ourgoal_settings_' + u, JSON.stringify(s || {})); }
  };
  ctx.sb = browserClient(serverDb, function () { return session.uid; });
  win.sb = ctx.sb;
  vm.createContext(ctx);
  if (isolationSrc) vm.runInContext(isolationSrc, ctx, { filename: 'js/account-isolation.js' });
  if (guardSrc) vm.runInContext(guardSrc, ctx, { filename: 'js/direct-login-guard.js' });
  var names = ['function defaultProfile(', 'async function sha256Hex(', 'async function ensureUserRow(', 'async function loadProfile(', 'async function saveProfile(', 'async function migrateGuestDataToUser(', 'async function performLogout(', 'async function loginWithDirectIdentifier('];
  var code = names.map(function (h) { return extractFunction(html, h); }).join('\n') +
    '\nthis.api = { loadProfile: loadProfile, saveProfile: saveProfile, migrateGuestDataToUser: migrateGuestDataToUser, performLogout: performLogout, loginWithDirectIdentifier: loginWithDirectIdentifier };';
  vm.runInContext(code, ctx, { filename: 'index.html(잘라 옴)' });
  return { ctx: ctx, ls: ls, state: state, api: ctx.api, els: els, calls: calls };
}

/* 이메일 로그인 진입과 같은 순서로 로그인시킨다 */
async function loginAs(b, uid, email) {
  session.uid = uid;
  b.ctx.window.OurgoalAccountIsolation.dropForeignSessionCopy(uid, b.ls);
  b.state.profile = await b.api.loadProfile(uid, email, {}, 'email');
  await b.api.migrateGuestDataToUser(uid, b.state.profile);
  return b.state.profile;
}
/* A 가 이 기기에서 로그인·기록·로그아웃 — 기기에 ourgoal_*_backup_<A uid> 가 남는다 */
async function leaveABackupOnDevice(b) {
  await loginAs(b, UID_A, 'ogtest-a@example.invalid');
  b.state.profile.bio = A_BIO;
  b.state.profile.records = [{ id: 'rec-a-1', type: 'note', text: A_MARK, startAt: '2026-10-04T10:00:00.000Z' }];
  await b.api.saveProfile();
  await b.api.performLogout();
  session.uid = null;
  b.state.profile = null;
  assert.ok(b.ls.getItem('ourgoal_records_backup_' + UID_A) !== null, '시험 전제: 이 기기에 A 기록 백업이 있어야 함');
}
function aDataOnScreen(b) {
  var p = b.state.profile;
  if (!p) return 0;
  var n = (p.records || []).filter(function (r) { return r && String(r.text || '').indexOf(A_MARK) > -1; }).length;
  if (p.bio === A_BIO) n++;
  if (p.id === UID_A) n++;
  return n;
}
function uploadsWithABy(uid) {
  return serverDb.attempts.filter(function (a) { return a.by === uid && String(JSON.stringify(a.row)).indexOf(A_MARK) > -1; }).length;
}

var results = [];
async function check(name, fn) {
  try { await fn(); results.push({ name: name, ok: true }); console.log('  [통과] ' + name); }
  catch (e) { results.push({ name: name, ok: false, err: e.message }); console.log('  [실패] ' + name + '\n         ' + e.message); }
}

(async function main() {
  console.log('TASK-ES-368 빠른 복구·닉네임 입장 잠금 시험 (부품만 돌려 봄 — 가짜 브라우저·가짜 Supabase) 대상: ' + path.relative(ROOT, HTML_PATH));
  var m = {};

  await check('① A 백업이 있는 기기에서 세션 없이 빠른 복구(A 닉네임·다른 닉네임 모두): 화면에 A 데이터 0, 앱 입장 0회, 정식 로그인 안내', async function () {
    serverDb = new ServerDb();
    var b = makeBrowser();
    await leaveABackupOnDevice(b);
    var r1 = await b.api.loginWithDirectIdentifier('ogtest-a');
    var r2 = await b.api.loginWithDirectIdentifier('아무 닉네임');
    m.noSessionResult = [r1, r2];
    m.noSessionAOnScreen = aDataOnScreen(b);
    m.noSessionEnterApp = b.calls.enterApp;
    m.noSessionAuthScreen = b.els.authScreen ? b.els.authScreen.style.display : null;
    m.noSessionGuide = b.els.loginError ? b.els.loginError.textContent : '';
    assert.strictEqual(m.noSessionAOnScreen, 0, '세션 없이 화면에 A 데이터 ' + m.noSessionAOnScreen + '건');
    assert.deepStrictEqual(m.noSessionResult, [false, false], '세션 없이 입장이 성공함: ' + JSON.stringify(m.noSessionResult));
    assert.strictEqual(m.noSessionEnterApp, 0, '세션 없이 앱 입장 ' + m.noSessionEnterApp + '회');
    assert.strictEqual(m.noSessionAuthScreen, 'flex', '정식 로그인 화면이 열리지 않음');
    assert.ok(m.noSessionGuide.indexOf('로그인') > -1, '로그인 안내 문구가 없음');
  });

  await check('② A 백업이 있는 기기에서 B 세션으로 빠른 복구(A 닉네임 입력): B 로 들어가고 화면·업로드에 A 데이터 0', async function () {
    serverDb = new ServerDb();
    var b = makeBrowser();
    await leaveABackupOnDevice(b);
    session.uid = UID_B;
    var ok = await b.api.loginWithDirectIdentifier('ogtest-a');
    if (b.state.profile) {
      b.state.profile.records = (b.state.profile.records || []).concat([{ id: 'rec-b-1', type: 'note', text: 'B 기록', startAt: '2026-10-04T11:00:00.000Z' }]);
      await b.api.saveProfile();
    }
    m.bSessionOk = ok;
    m.bSessionProfile = b.state.profile ? (b.state.profile.id === UID_B ? 'B' : (b.state.profile.id === UID_A ? 'A' : 'other')) : null;
    m.bSessionAOnScreen = aDataOnScreen(b);
    m.bSessionUploadsWithA = uploadsWithABy(UID_B);
    assert.strictEqual(m.bSessionAOnScreen, 0, 'B 화면에 A 데이터 ' + m.bSessionAOnScreen + '건');
    assert.strictEqual(m.bSessionUploadsWithA, 0, 'B 세션 업로드에 A 데이터 ' + m.bSessionUploadsWithA + '건');
    assert.strictEqual(m.bSessionOk, true, 'B 세션인데 입장 실패');
    assert.strictEqual(m.bSessionProfile, 'B', '입장한 계정이 B 가 아님: ' + m.bSessionProfile);
  });

  await check('③ B 세션에서 호출자가 A uid 를 직접 넘겨도 세션 uid(B)로만 연다', async function () {
    serverDb = new ServerDb();
    var b = makeBrowser();
    await leaveABackupOnDevice(b);
    session.uid = UID_B;
    await b.api.loginWithDirectIdentifier('ogtest-a', { userId: UID_A });
    m.bSessionExplicitAProfile = b.state.profile ? (b.state.profile.id === UID_B ? 'B' : (b.state.profile.id === UID_A ? 'A' : 'other')) : null;
    m.bSessionExplicitAOnScreen = aDataOnScreen(b);
    assert.strictEqual(m.bSessionExplicitAOnScreen, 0, 'A 데이터 ' + m.bSessionExplicitAOnScreen + '건');
    assert.strictEqual(m.bSessionExplicitAProfile, 'B', '세션과 다른 uid 로 열림: ' + m.bSessionExplicitAProfile);
  });

  /* [#TASK-ES-373] 바뀐 규칙: 구글 이메일만으로(세션 없음) 들어가던 갈래는 서명 검증이 없어 막는다. 구글 입장은
     tests/google-session-guard.test.js 가 Supabase 검증 세션 uid 로 열리는지 따로 잰다(입장 방법은 남는다). */
  await check('④ 구글 이메일만 넘긴 입장(Supabase 세션 없음)은 열지 않는다 — u_ uid 입장 0, 화면에 A 데이터 0, 정식 로그인 안내', async function () {
    serverDb = new ServerDb();
    var b = makeBrowser();
    await leaveABackupOnDevice(b);
    var ok = await b.api.loginWithDirectIdentifier('ogtest-g@example.invalid', { provider: 'google', email: 'ogtest-g@example.invalid', displayName: 'G' });
    m.googleOk = ok;
    m.googleUidIsEmailUid = !!(b.state.profile && /^u_[0-9a-f]{16}$/.test(b.state.profile.id));
    m.googleAOnScreen = aDataOnScreen(b);
    m.googleEnterApp = b.calls.enterApp;
    m.googleAuthScreen = b.els.authScreen ? b.els.authScreen.style.display : null;
    assert.strictEqual(m.googleAOnScreen, 0, '구글 입장 화면에 A 데이터 ' + m.googleAOnScreen + '건');
    assert.strictEqual(m.googleOk, false, '세션 없는 구글 이메일로 입장이 성공함');
    assert.strictEqual(m.googleUidIsEmailUid, false, '이메일에서 만든 u_ uid 로 열림');
    assert.strictEqual(m.googleEnterApp, 0, '세션 없는 구글 이메일로 앱 입장 ' + m.googleEnterApp + '회');
    assert.strictEqual(m.googleAuthScreen, 'flex', '정식 로그인 화면이 열리지 않음');
  });

  await check('⑤ 기존 흐름 유지: A 세션으로 빠른 복구하면 서버가 비어 있어도 A 자기 백업을 되찾는다', async function () {
    serverDb = new ServerDb();
    var b = makeBrowser();
    await leaveABackupOnDevice(b);
    serverDb.tables.checkins = [];
    session.uid = UID_A;
    var ok = await b.api.loginWithDirectIdentifier('ogtest-a');
    m.ownBackupRestored = b.state.profile ? (b.state.profile.records || []).filter(function (r) { return r && String(r.text || '').indexOf(A_MARK) > -1; }).length : 0;
    assert.strictEqual(ok, true, 'A 세션 입장 실패');
    assert.strictEqual(m.ownBackupRestored, 1, 'A 자기 백업 복원 ' + m.ownBackupRestored + '건');
  });

  await check('⑥ 추가 범위(#680 발견): loadProfile 동반자 복구는 이 uid 의 ourgoal_companions_backup_ 키만 읽는다 — B 자기 키가 비어도 A 동반자 0', async function () {
    serverDb = new ServerDb();
    var b = makeBrowser();
    b.ls.setItem('ourgoal_companions_backup_' + UID_A, JSON.stringify([{ id: 'comp-a', name: 'A 의 동반자' }]));
    session.uid = UID_B;
    var pB = await b.api.loadProfile(UID_B, 'ogtest-b@example.invalid', {}, 'email');
    m.bCompanionsFromA = (pB.companions || []).filter(function (c) { return c && c.id === 'comp-a'; }).length;
    session.uid = UID_A;
    var pA = await b.api.loadProfile(UID_A, 'ogtest-a@example.invalid', {}, 'email');
    m.aCompanionsOwn = (pA.companions || []).filter(function (c) { return c && c.id === 'comp-a'; }).length;
    assert.strictEqual(m.bCompanionsFromA, 0, 'B 프로필에 A 동반자 ' + m.bCompanionsFromA + '건');
    assert.strictEqual(m.aCompanionsOwn, 1, 'A 자기 동반자 백업 복원 ' + m.aCompanionsOwn + '건');
  });

  var failed = results.filter(function (r) { return !r.ok; }).length;
  console.log('\n측정값: ' + JSON.stringify(m));
  console.log('결과: ' + (results.length - failed) + '/' + results.length + ' 통과');
  if (failed) process.exitCode = 1;
})().catch(function (e) { console.error(e); process.exitCode = 1; });
