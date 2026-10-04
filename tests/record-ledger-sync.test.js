// tests/record-ledger-sync.test.js
// #TASK-ES-344 (노션 REC-01): 지운 기록 부활 + 서버 필드 손실 회귀 시험
// 확인 수준: "부품만 돌려 봄" — Supabase 는 메모리 가짜 표(아래 FakeSupabase)로 대신한다. 실서버·실계정 왕복이 아니다.
// 실행: node tests/record-ledger-sync.test.js  (워크트리에 node_modules 가 없으면 NODE_PATH 로 본 저장소 것을 쓴다)

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var Module = require('module');

var ROOT = path.join(__dirname, '..');
var Ledger = require('../js/record-ledger');

/* ---------- 메모리 가짜 Supabase (checkins·users·goals·events 만) ---------- */
function FakeDb(opts) {
  this.tables = { checkins: [], users: [], goals: [], events: [] };
  this.hasMeta = !(opts && opts.noMeta);
  this.hasDeletedAt = !(opts && opts.noDeletedAt);
  this.upsertCalls = [];
}
FakeDb.prototype.from = function (name) { return new FakeQuery(this, name); };

function FakeQuery(db, name) {
  this.db = db; this.name = name; this.filters = []; this.mode = 'select'; this.patch = null; this.err = null;
}
FakeQuery.prototype.select = function () { this.mode = 'select'; return this; };
FakeQuery.prototype.eq = function (col, val) { this.filters.push(function (r) { return r[col] === val; }); return this; };
FakeQuery.prototype.is = function (col, val) {
  if (this.name === 'checkins' && col === 'deleted_at' && !this.db.hasDeletedAt) {
    this.err = { message: 'column checkins.deleted_at does not exist' };
  }
  this.filters.push(function (r) { return (r[col] === undefined ? null : r[col]) === val; });
  return this;
};
FakeQuery.prototype.filter = function () { return this; };
FakeQuery.prototype.order = function () { return this; };
FakeQuery.prototype.limit = function () { return this; };
FakeQuery.prototype.insert = function (row) { this.db.tables[this.name].push(row); return Promise.resolve({ data: null, error: null }); };
FakeQuery.prototype.update = function (patch) { this.mode = 'update'; this.patch = patch; return this; };
FakeQuery.prototype.upsert = function (rows) {
  var db = this.db, name = this.name;
  rows = Array.isArray(rows) ? rows : [rows];
  db.upsertCalls.push(JSON.parse(JSON.stringify(rows)));
  if (name === 'checkins' && !db.hasMeta && rows.some(function (r) { return 'meta' in r; })) {
    return Promise.resolve({ data: null, error: { message: "Could not find the 'meta' column of 'checkins' in the schema cache" } });
  }
  rows.forEach(function (r) {
    var clean = JSON.parse(JSON.stringify(r));
    var t = db.tables[name];
    var i = t.findIndex(function (x) { return x.id === clean.id; });
    if (i === -1) t.push(clean); else t[i] = Object.assign({}, t[i], clean); // upsert 는 보낸 칸만 바꾼다(deleted_at 유지)
  });
  return Promise.resolve({ data: null, error: null });
};
FakeQuery.prototype.then = function (ok, no) {
  var self = this;
  var rows = this.db.tables[this.name].filter(function (r) { return self.filters.every(function (f) { return f(r); }); });
  if (this.err) return Promise.resolve({ data: null, error: this.err }).then(ok, no);
  if (this.mode === 'update') {
    rows.forEach(function (r) { Object.assign(r, self.patch); });
    return Promise.resolve({ data: null, error: null }).then(ok, no);
  }
  return Promise.resolve({ data: JSON.parse(JSON.stringify(rows)), error: null }).then(ok, no);
};

var UID = '11111111-1111-4111-8111-111111111111';
var currentDb = null;
function makeClient() {
  return {
    auth: { getUser: function () { return Promise.resolve({ data: { user: { id: UID } }, error: null }); } },
    from: function (n) { return currentDb.from(n); }
  };
}

/* api/track.js 가 require 하는 @supabase/supabase-js 를 가짜로 바꿔 끼운다 */
var origLoad = Module._load;
Module._load = function (req) {
  if (req === '@supabase/supabase-js') return { createClient: makeClient };
  return origLoad.apply(this, arguments);
};
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-not-a-real-key';
var trackHandler = require('../api/track');

function callSync(body) {
  var out = { status: 200, body: null };
  var res = {
    status: function (c) { out.status = c; return res; },
    setHeader: function () { return res; },
    json: function (d) { out.body = d; return res; },
    end: function () { return res; },
    send: function (d) { out.body = d; return res; }
  };
  var req = { method: 'POST', headers: { authorization: 'Bearer t' }, body: Object.assign({ action: 'sync_records', userId: UID }, body || {}), query: {} };
  return Promise.resolve(trackHandler(req, res)).then(function () { return out; });
}

var results = [];
async function check(name, fn) {
  try { await fn(); results.push({ name: name, ok: true }); console.log('  [통과] ' + name); }
  catch (e) { results.push({ name: name, ok: false, err: e.message }); console.log('  [실패] ' + name + '\n         ' + e.message); }
}

function ttRecord(id, startIso) {
  // js/time-tracker.js saveToRecords 가 만드는 모양 그대로
  return {
    id: id, type: 'time_record', mode: 'stopwatch', category: '시간기록', theme: 'growth', subTheme: 'time_tracker',
    themeConfidence: 0.99, text: '시간 기록', title: '영어 공부', startAt: startIso, endAt: startIso,
    durationMs: 1500000, durationMinutes: 25, totalSeconds: 1500, formattedTime: '25:00',
    laps: [{ lapNum: 1, splitMs: 600000, durationMs: 600000, formattedDuration: '10:00', formattedSplit: '10:00', text: '' }],
    goalId: 'goal-abc', visibility: 'private', isSample: false, createdAt: startIso
  };
}

(async function main() {
  console.log('TASK-ES-344 기록 원장 시험 (부품만 돌려 봄 — 가짜 Supabase)');
  var m = { deletedAfterSync: null, deletedAfterMerge: null, resurrectedFromTrash: null, roundTripMismatch: null, localKept: null };

  await check('① 기록 2건 생성 → 1건 휴지통 삭제 → sync_records 복원 결과에 지운 기록 0건', async function () {
    currentDb = new FakeDb();
    var a = ttRecord('rec-a', '2026-10-04T01:00:00.000Z'), b = ttRecord('rec-b', '2026-10-04T02:00:00.000Z');
    await Ledger.upsertCheckinRows(makeClient(), [a, b].map(function (r) { return Ledger.toCheckinRow(r, UID); }));
    // index.html moveToTrash 와 같은 호출: checkins.update({deleted_at}).eq(id).eq(user_id)
    await makeClient().from('checkins').update({ deleted_at: new Date().toISOString() }).eq('id', 'rec-a').eq('user_id', UID);
    var out = await callSync();
    assert.strictEqual(out.status, 200);
    var ids = out.body.records.map(function (r) { return r.id; });
    m.deletedAfterSync = ids.filter(function (id) { return id === 'rec-a'; }).length;
    assert.strictEqual(m.deletedAfterSync, 0, '지운 기록이 서버 응답에 ' + m.deletedAfterSync + '건');
    assert.deepStrictEqual(ids, ['rec-b']);
    // 클라이언트 병합(강제 새로고침 포함)에서도 0건
    var merged = Ledger.mergeServerRecords([b], out.body.records, { deletedIds: ['rec-a'], preferServer: true });
    m.deletedAfterMerge = merged.records.filter(function (r) { return r.id === 'rec-a'; }).length;
    assert.strictEqual(m.deletedAfterMerge, 0);
  });

  await check('① 보강: deleted_at 칸이 없는 DB 에서도 폴백 조회로 응답이 끊기지 않는다', async function () {
    currentDb = new FakeDb({ noDeletedAt: true });
    await Ledger.upsertCheckinRows(makeClient(), [Ledger.toCheckinRow(ttRecord('rec-x', '2026-10-04T03:00:00.000Z'), UID)]);
    var out = await callSync();
    assert.strictEqual(out.body.records.length, 1, '폴백 조회 결과 ' + out.body.records.length + '건');
  });

  await check('① 보강: 서버 소프트 삭제가 실패해 서버에 살아 있어도, 휴지통에 있는 기록은 병합에서 되살아나지 않는다', async function () {
    var server = [Ledger.fromCheckinRow(Ledger.toCheckinRow(ttRecord('rec-a', '2026-10-04T01:00:00.000Z'), UID))];
    var trash = [{ id: 'trash_1', originalId: 'rec-a', entityType: 'record' }];
    var merged = Ledger.mergeServerRecords([], server, { deletedIds: Ledger.trashRecordIds(trash), preferServer: true });
    m.resurrectedFromTrash = merged.records.length;
    assert.strictEqual(merged.records.length, 0);
    assert.strictEqual(merged.skippedDeleted, 1);
  });

  await check('② laps·durationMs·goalId 가 upsert payload 에 들어가고 sync_records 복원 시 같은 값이다', async function () {
    currentDb = new FakeDb();
    var rec = ttRecord('rec-t', '2026-10-04T04:00:00.000Z');
    await Ledger.upsertCheckinRows(makeClient(), [Ledger.toCheckinRow(rec, UID)]);
    var sent = currentDb.upsertCalls[0][0];
    assert.ok(sent.meta, 'payload 에 meta 없음');
    assert.deepStrictEqual(sent.meta.laps, rec.laps);
    assert.strictEqual(sent.meta.durationMs, rec.durationMs);
    assert.strictEqual(sent.meta.goalId, rec.goalId);
    var out = await callSync();
    var back = out.body.records[0];
    var mismatch = 0;
    Ledger.META_FIELDS.forEach(function (k) { try { assert.deepStrictEqual(back[k], rec[k]); } catch (e) { mismatch++; console.log('         불일치 ' + k); } });
    m.roundTripMismatch = mismatch;
    assert.strictEqual(mismatch, 0, 'META_FIELDS ' + Ledger.META_FIELDS.length + '개 중 불일치 ' + mismatch);
  });

  await check('② 보강: 서버 경유 저장(recordsToSave)도 meta 를 남긴다', async function () {
    currentDb = new FakeDb();
    var rec = ttRecord('rec-s', '2026-10-04T05:00:00.000Z');
    await callSync({ recordsToSave: [rec] });
    var row = currentDb.tables.checkins[0];
    assert.deepStrictEqual(row.meta.laps, rec.laps);
    assert.strictEqual(row.meta.goalId, rec.goalId);
  });

  await check('② 보강: meta 칸이 아직 없는 DB 에서는 meta 를 빼고 재시도해 기록 본문은 저장된다', async function () {
    currentDb = new FakeDb({ noMeta: true });
    var res = await Ledger.upsertCheckinRows(makeClient(), [Ledger.toCheckinRow(ttRecord('rec-m', '2026-10-04T06:00:00.000Z'), UID)]);
    assert.ok(!res.error, '재시도 뒤에도 오류');
    assert.strictEqual(currentDb.tables.checkins.length, 1);
    assert.strictEqual(currentDb.upsertCalls.length, 2, '첫 시도 + 재시도 = 2회');
  });

  await check('③ 로컬에만 있는 미동기화 기록은 병합 뒤에도 남고, 서버 기록은 추가된다', async function () {
    var localOnly = { id: 'rec-local', text: '아직 안 올라간 기록', startAt: '2026-10-04T09:00:00.000Z', photo: 'data:x' };
    var shared = { id: 'rec-b', text: '로컬에서 고친 글', startAt: '2026-10-04T02:00:00.000Z', energy: 70 };
    var server = [
      { id: 'rec-b', text: '서버 글', startAt: '2026-10-04T02:00:00.000Z', goalId: 'goal-abc' },
      { id: 'rec-c', text: '다른 기기 기록', startAt: '2026-10-04T08:00:00.000Z' }
    ];
    var merged = Ledger.mergeServerRecords([localOnly, shared], server, { deletedIds: [], preferServer: false });
    var ids = merged.records.map(function (r) { return r.id; });
    m.localKept = ids.indexOf('rec-local') !== -1 ? 1 : 0;
    assert.strictEqual(m.localKept, 1, '로컬 미동기화 기록 사라짐');
    assert.ok(ids.indexOf('rec-c') !== -1, '서버 기록 미추가');
    var b = merged.records.find(function (r) { return r.id === 'rec-b'; });
    assert.strictEqual(b.text, '로컬에서 고친 글', '일반 동기화는 로컬 값 우선');
    assert.strictEqual(b.goalId, 'goal-abc', '빈 칸은 서버 값으로 채움');
    assert.strictEqual(b.energy, 70, '로컬에만 있는 칸 유지');
    // 강제 새로고침: 서버 값 우선이지만 로컬 전용 칸·로컬 전용 기록은 유지
    var forced = Ledger.mergeServerRecords([localOnly, shared], server, { preferServer: true });
    var fb = forced.records.find(function (r) { return r.id === 'rec-b'; });
    assert.strictEqual(fb.text, '서버 글');
    assert.strictEqual(fb.energy, 70);
    assert.ok(forced.records.some(function (r) { return r.id === 'rec-local'; }));
  });

  await check('③ 기존 동작 유지: 로컬이 비어 있으면 서버 기록 전부로 복구된다', async function () {
    var server = [{ id: 'r1', startAt: '2026-10-01T00:00:00.000Z' }, { id: 'r2', startAt: '2026-10-02T00:00:00.000Z' }];
    var merged = Ledger.mergeServerRecords([], server, {});
    assert.strictEqual(merged.records.length, 2);
    assert.strictEqual(merged.changed, true);
    assert.deepStrictEqual(merged.records.map(function (r) { return r.id; }), ['r2', 'r1'], '최신순');
  });

  await check('배선: index.html 이 모듈을 싣고 저장·복원·병합에 쓴다(전체 교체 코드 없음)', async function () {
    var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    assert.ok(html.indexOf('<script src="js/record-ledger.js') !== -1, '스크립트 태그');
    assert.ok(html.indexOf('window.OurgoalRecordLedger.upsertCheckinRows(sb, recRows)') !== -1, 'saveProfile 저장');
    assert.ok(html.indexOf('window.OurgoalRecordLedger.applyRecordMeta(rec, r.meta)') !== -1, 'loadProfile 복원');
    assert.ok(html.indexOf('window.OurgoalRecordLedger.mergeServerRecords(state.profile.records || [], data.records') !== -1, 'syncServerRecords 병합');
    assert.strictEqual(html.indexOf('state.profile.records = data.records;'), -1, '전체 교체 코드 잔존');
    var api = fs.readFileSync(path.join(ROOT, 'api', 'track.js'), 'utf8');
    assert.ok(api.indexOf(".is('deleted_at', null)") !== -1, 'sync_records deleted_at 필터');
  });

  Module._load = origLoad;
  var pass = results.filter(function (r) { return r.ok; }).length;
  console.log('\n측정값 ' + JSON.stringify(m));
  console.log('결과: ' + pass + '/' + results.length + ' 통과');
  process.exitCode = (pass === results.length ? 0 : 1);
})();
