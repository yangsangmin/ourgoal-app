// tests/account-switch-isolation.test.js
// #TASK-ES-365 (노션 CORE-09): 같은 브라우저에서 A 로그아웃 -> B 로그인 시 A 데이터가 B 화면·B 업로드에 섞이는 결함 회귀 시험
// 확인 수준: "부품만 돌려 봄" — index.html 의 실제 함수 본문(ensureUserRow·loadProfile·saveProfile·syncServerRecords·
// migrateGuestDataToUser·performLogout)을 잘라 메모리 가짜 브라우저(localStorage)·가짜 Supabase(RLS 흉내)로 돌린다.
// 서버 쪽 sync_records 는 api/track.js 실제 처리기를 쓴다. 실서버·실계정 왕복이 아니다(실계정 확인은 docs/design/harness/real-account-check.js).
// 실행: node tests/account-switch-isolation.test.js [--html <index.html 경로>]   (워크트리에 node_modules 가 없으면 NODE_PATH 로 본 저장소 것을 쓴다)

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
  var el = function () { return { style: {}, classList: { add: function () {}, remove: function () {} } }; };
  var win = { OurgoalRecordLedger: Ledger };
  var ctx = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    JSON: JSON, Date: Date, Math: Math, Object: Object, Array: Array, String: String, Number: Number, Set: Set, Map: Map, Promise: Promise, RegExp: RegExp, Error: Error,
    setTimeout: setTimeout, clearInterval: clearInterval,
    localStorage: ls, sessionStorage: ss, state: state, window: win,
    document: { getElementById: el, querySelector: function () { return null; } },
    fetch: fakeFetch,
    toast: function () {}, track: function () {}, getAttribution: function () { return {}; },
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
    applyAppSettings: function () {},
    loadLocalSettings: function (u) { try { return JSON.parse(ls.getItem('ourgoal_settings_' + u) || 'null') || { privacy: {}, customSchedules: [] }; } catch (e) { return {}; } },
    saveLocalSettings: function (u, s) { ls.setItem('ourgoal_settings_' + u, JSON.stringify(s || {})); }
  };
  ctx.sb = browserClient(serverDb, function () { return session.uid; });
  win.sb = ctx.sb;
  vm.createContext(ctx);
  if (isolationSrc) vm.runInContext(isolationSrc, ctx, { filename: 'js/account-isolation.js' });
  var names = ['async function ensureUserRow(', 'async function loadProfile(', 'async function saveProfile(', 'async function syncServerRecords(', 'async function migrateGuestDataToUser(', 'async function performLogout('];
  var code = names.map(function (h) { return extractFunction(html, h); }).join('\n') +
    '\nthis.api = { ensureUserRow: ensureUserRow, loadProfile: loadProfile, saveProfile: saveProfile, syncServerRecords: syncServerRecords, migrateGuestDataToUser: migrateGuestDataToUser, performLogout: performLogout };';
  vm.runInContext(code, ctx, { filename: 'index.html(잘라 옴)' });
  return { ctx: ctx, ls: ls, state: state, api: ctx.api };
}

/* 앱의 이메일 로그인 진입(restoreSessionAndEnter)과 같은 순서: 세션 -> (다른 사람 사본 정리) -> loadProfile -> 게스트 이관 */
async function loginAs(b, uid, email) {
  session.uid = uid;
  if (b.ctx.window.OurgoalAccountIsolation && html.indexOf('OurgoalAccountIsolation.dropForeignSessionCopy(session.user.id)') > -1) {
    b.ctx.window.OurgoalAccountIsolation.dropForeignSessionCopy(uid, b.ls);
    if (b.state.profile && b.state.profile.id !== uid && !b.ctx.window.OurgoalAccountIsolation.isGuestId(b.state.profile.id)) b.state.profile = null;
  }
  b.state.profile = await b.api.loadProfile(uid, email, {}, 'email');
  await b.api.migrateGuestDataToUser(uid, b.state.profile);
  return b.state.profile;
}

function countMark(list) { return (list || []).filter(function (r) { return r && (String(r.text || '').indexOf(A_MARK) > -1); }).length; }
function bUploadsWithA() {
  return serverDb.attempts.filter(function (a) { return a.by === UID_B && a.table === 'checkins' && String(a.row.text || '').indexOf(A_MARK) > -1; }).length;
}
function bLocalCopiesWithA(ls) {
  var n = 0;
  ls.m.forEach(function (v, k) { if (k.indexOf(UID_B) > -1 && v.indexOf(A_MARK) > -1) n++; });
  return n;
}

var results = [];
async function check(name, fn) {
  try { await fn(); results.push({ name: name, ok: true }); console.log('  [통과] ' + name); }
  catch (e) { results.push({ name: name, ok: false, err: e.message }); console.log('  [실패] ' + name + '\n         ' + e.message); }
}

/* A 가 로그인해 기록을 남기고 로그아웃까지 — 같은 브라우저에 A 사본이 남는 상태를 만든다 */
async function aSessionThenLogout(b, opts) {
  await loginAs(b, UID_A, 'ogtest-a@example.invalid');
  b.state.profile.bio = A_BIO;
  b.state.profile.records = [{ id: 'rec-a-1', type: 'note', text: A_MARK, startAt: '2026-10-04T10:00:00.000Z' }];
  b.state.profile.companions = [{ id: 'comp-a', name: 'A 의 동반자' }];
  await b.api.saveProfile();
  if (opts && opts.serverDropsA) serverDb.tables.checkins = serverDb.tables.checkins.filter(function (r) { return r.user_id !== UID_A; });
  if (!opts || !opts.skipLogout) await b.api.performLogout();
}

(async function main() {
  console.log('TASK-ES-365 계정 전환 격리 시험 (부품만 돌려 봄 — 가짜 브라우저·가짜 Supabase) 대상: ' + path.relative(ROOT, HTML_PATH));
  var m = {};

  await check('① A 로그인·기록·로그아웃 -> 같은 브라우저 B 로그인: B 화면 기록·소개·동반자에 A 데이터 0건, B 업로드에 A 기록 0건', async function () {
    serverDb = new ServerDb(); trackBodies = [];
    var b = makeBrowser();
    await aSessionThenLogout(b);
    var pB = await loginAs(b, UID_B, 'ogtest-b@example.invalid');
    await b.api.saveProfile();
    await b.api.syncServerRecords(false);
    m.profileIsB = b.state.profile.id === UID_B;
    m.aTextOnB = countMark(b.state.profile.records);
    m.aBioOnB = b.state.profile.bio === A_BIO ? 1 : 0;
    m.aCompanionOnB = (b.state.profile.companions || []).filter(function (c) { return c && c.id === 'comp-a'; }).length;
    m.bUploadsWithA = bUploadsWithA();
    m.bLocalCopiesWithA = bLocalCopiesWithA(b.ls);
    assert.ok(m.profileIsB, '프로필 id 가 B 가 아님');
    assert.strictEqual(m.aTextOnB, 0, 'B 화면 기록에 A 표식 ' + m.aTextOnB + '건');
    assert.strictEqual(m.aBioOnB, 0, 'B 소개글이 A 것');
    assert.strictEqual(m.aCompanionOnB, 0, 'B 동반자에 A 동반자');
    assert.strictEqual(m.bUploadsWithA, 0, 'B 세션이 서버에 A 기록 ' + m.bUploadsWithA + '건 업로드 시도');
    assert.strictEqual(m.bLocalCopiesWithA, 0, 'B uid 로컬 사본 ' + m.bLocalCopiesWithA + '개에 A 기록');
    assert.strictEqual(serverDb.tables.checkins.filter(function (r) { return r.user_id === UID_B; }).length, 0, '서버 B 소유 기록이 생김');
    void pB;
  });

  await check('② 서버에 A 기록이 아직 없을 때(오프라인 저장분)도 B 로 넘어가지 않는다', async function () {
    serverDb = new ServerDb(); trackBodies = [];
    var b = makeBrowser();
    await aSessionThenLogout(b, { serverDropsA: true });
    await loginAs(b, UID_B, 'ogtest-b@example.invalid');
    await b.api.saveProfile();
    m.offlineATextOnB = countMark(b.state.profile.records);
    m.offlineBUploadsWithA = bUploadsWithA();
    assert.strictEqual(m.offlineATextOnB, 0, 'B 화면에 A 표식 ' + m.offlineATextOnB + '건');
    assert.strictEqual(m.offlineBUploadsWithA, 0, 'B 세션 업로드에 A 기록 ' + m.offlineBUploadsWithA + '건');
    /* A 가 다시 로그인하면 자기 백업은 그대로 돌아온다(uid 별 분리 — 미동기화 기록 보존) */
    await b.api.performLogout();
    var pA = await loginAs(b, UID_A, 'ogtest-a@example.invalid');
    m.aBackRestored = countMark(pA.records);
    assert.strictEqual(m.aBackRestored, 1, 'A 재로그인 때 A 자기 백업 복원 ' + m.aBackRestored + '건');
  });

  await check('③ 로그아웃 없이 계정이 바뀌어도(A 전체 사본이 남은 채 B 세션) A 사본을 B 로 이관하지 않는다', async function () {
    serverDb = new ServerDb(); trackBodies = [];
    var b = makeBrowser();
    await aSessionThenLogout(b, { skipLogout: true });
    m.aCopyLeftBeforeSwitch = b.ls.getItem('ourgoal_guest_profile') && b.ls.getItem('ourgoal_guest_profile').indexOf(A_MARK) > -1;
    await loginAs(b, UID_B, 'ogtest-b@example.invalid');
    await b.api.saveProfile();
    m.noLogoutATextOnB = countMark(b.state.profile.records);
    m.noLogoutBUploadsWithA = bUploadsWithA();
    assert.ok(m.aCopyLeftBeforeSwitch, '시험 전제: A 전체 사본이 남아 있어야 함');
    assert.strictEqual(m.noLogoutATextOnB, 0, 'B 화면에 A 표식 ' + m.noLogoutATextOnB + '건');
    assert.strictEqual(m.noLogoutBUploadsWithA, 0, 'B 세션 업로드에 A 기록 ' + m.noLogoutBUploadsWithA + '건');
  });

  await check('④ 서버 동기화 요청(sync_records)에는 지금 로그인 uid 만 실린다', async function () {
    serverDb = new ServerDb(); trackBodies = [];
    var b = makeBrowser();
    await aSessionThenLogout(b);
    await loginAs(b, UID_B, 'ogtest-b@example.invalid');
    trackBodies = [];
    await b.api.syncServerRecords(false);
    var ids = [];
    trackBodies.forEach(function (x) { (x.backupIds || []).forEach(function (id) { ids.push(id); }); ids.push(x.userId); });
    m.syncIdsOtherThanB = ids.filter(function (id) { return id !== UID_B; }).length;
    assert.ok(trackBodies.length >= 1, 'sync_records 요청이 없음');
    assert.strictEqual(m.syncIdsOtherThanB, 0, 'B 의 동기화 요청에 다른 uid ' + m.syncIdsOtherThanB + '개');
  });

  await check('⑤ 기존 흐름 유지: 게스트로 쓴 목표·기록은 로그인한 계정으로 이관되어 그 계정 이름으로 올라간다', async function () {
    serverDb = new ServerDb(); trackBodies = [];
    var b = makeBrowser();
    var gid = 'guest-' + 'lz1abc';
    b.ls.setItem('ourgoal_guest_profile', JSON.stringify({
      id: gid, username: gid, displayName: '게스트', settings: {},
      goals: [{ id: 'goal-g-1', title: '게스트 목표' }],
      records: [{ id: 'rec-g-1', type: 'note', text: '게스트 기록', startAt: '2026-10-04T09:00:00.000Z' }]
    }));
    var pB = await loginAs(b, UID_B, 'ogtest-b@example.invalid');
    m.guestRecMigrated = (pB.records || []).filter(function (r) { return r.id === 'rec-g-1'; }).length;
    m.guestGoalMigrated = (pB.goals || []).filter(function (g) { return g.id === 'goal-g-1'; }).length;
    m.guestRecOnServerAsB = serverDb.tables.checkins.filter(function (r) { return r.id === 'rec-g-1' && r.user_id === UID_B; }).length;
    m.guestCopyRemoved = b.ls.getItem('ourgoal_guest_profile') === null || JSON.parse(b.ls.getItem('ourgoal_guest_profile')).id === UID_B;
    assert.strictEqual(m.guestRecMigrated, 1, '게스트 기록 이관 ' + m.guestRecMigrated + '건');
    assert.strictEqual(m.guestGoalMigrated, 1, '게스트 목표 이관 ' + m.guestGoalMigrated + '건');
    assert.strictEqual(m.guestRecOnServerAsB, 1, '게스트 기록이 B 이름으로 서버에 ' + m.guestRecOnServerAsB + '건');
    assert.ok(m.guestCopyRemoved, '이관 뒤 게스트 사본이 남음');
  });

  await check('⑥ 로그아웃은 계정 공용 키만 지우고 서버 원장(A 기록)은 그대로 둔다', async function () {
    serverDb = new ServerDb(); trackBodies = [];
    var b = makeBrowser();
    await aSessionThenLogout(b, { skipLogout: true });
    b.ls.setItem('ourgoal_offline_sync_queue', JSON.stringify([{ id: 'q1', action: { type: 'record', data: { text: A_MARK } } }]));
    var serverABefore = serverDb.tables.checkins.filter(function (r) { return r.user_id === UID_A; }).length;
    await b.api.performLogout();
    m.sharedKeysLeft = ['ourgoal_guest_profile', 'ourgoal_current_user', 'ourgoal_offline_sync_queue'].filter(function (k) { return b.ls.getItem(k) !== null; });
    m.serverAKept = serverDb.tables.checkins.filter(function (r) { return r.user_id === UID_A; }).length === serverABefore && serverABefore === 1;
    m.aOwnBackupKept = b.ls.getItem('ourgoal_records_backup_' + UID_A) !== null;
    assert.deepStrictEqual(m.sharedKeysLeft, [], '로그아웃 뒤 남은 공용 키: ' + m.sharedKeysLeft.join(','));
    assert.ok(m.serverAKept, '서버 A 기록이 바뀜');
    assert.ok(m.aOwnBackupKept, 'A uid 백업이 지워짐(미동기화 기록 보존 길이 끊김)');
  });

  var failed = results.filter(function (r) { return !r.ok; }).length;
  console.log('\n측정값: ' + JSON.stringify(m));
  console.log('결과: ' + (results.length - failed) + '/' + results.length + ' 통과');
  if (failed) process.exitCode = 1;
})().catch(function (e) { console.error(e); process.exitCode = 1; });
