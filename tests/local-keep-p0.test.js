// tests/local-keep-p0.test.js
// #TASK-ES-695 (지시함 DIR-006 묶음 P0): 다시 열 때 기기 백업을 서버 것으로 덮어쓰기 전에 되붙이기 · 보관 · 직전 사본.
// 확인 수준: 「부품만 돌려 봄」 — 제품 파일(js/core/local-keep.js · profile-load.js · home-cockpit.js · record-ledger.js · account-isolation.js)을 그대로 불러
// 메모리 안 가짜 저장소(localStorage)와 가짜 서버(Supabase 흉내 — 오류를 예외 없이 {error} 로 돌려준다)로 돌린다. 화면 · 실서버 · 실기기가 아니다.
// 실행: node tests/local-keep-p0.test.js [--json]   (--json 이면 결과 요약을 한 줄 JSON 으로 낸다)
'use strict';
var assert = require('assert');
var path = require('path');
var ROOT = path.join(__dirname, '..');

/* ---------- 가짜 저장소 ---------- */
function makeStore(opt) {
  var o = opt || {};
  var data = {}; var calls = { set: 0, remove: 0, log: [] }; var cutOnce = {};
  var st = {
    data: data, calls: calls,
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem: function (k, v) {
      v = String(v);
      if (o.dead && o.dead()) { var d = new Error('앱 종료(더 쓰지 못함)'); d.name = 'AppGone'; throw d; }
      if (o.failKey && o.failKey(k, v)) { var e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
      if (o.capacity) { var total = 0; Object.keys(data).forEach(function (x) { if (x !== k) total += x.length + data[x].length; }); if (total + k.length + v.length > o.capacity) { var q = new Error('quota'); q.name = 'QuotaExceededError'; throw q; } }
      calls.set++; calls.log.push(k);
      var cut = o.truncateKey && o.truncateKey(k) && !cutOnce[k]; if (cut) cutOnce[k] = true; /* 그 열쇠의 첫 쓰기만 잘린다(한 번의 사고) */
      data[k] = cut ? v.slice(0, Math.floor(v.length / 2)) : v;
    },
    removeItem: function (k) { calls.remove++; delete data[k]; }
  };
  return st;
}

var UID = '11111111-1111-4111-8111-111111111111', OTHER = '22222222-2222-4222-8222-222222222222';
var BK = 'ourgoal_records_backup_' + UID, PREV = 'ourgoal_records_prev_' + UID, KEPT = 'ourgoal_records_kept_' + UID;
var GBK = 'ourgoal_goals_backup_' + UID, GPREV = 'ourgoal_goals_prev_' + UID, GKEPT = 'ourgoal_goals_kept_' + UID;
var PHOTO = 'data:image/jpeg;base64,' + new Array(40).join('QUJD');
function devRec(id, text, extra) { return Object.assign({ id: id, type: 'note', text: text, startAt: '2026-10-12T01:00:00.000Z', endAt: '2026-10-12T01:00:00.000Z', createdAt: '2026-10-12T01:00:00.000Z', category: null, theme: 'daily', subTheme: null, themeConfidence: 0.5, visibility: 'private' }, extra || {}); }
function srvRec(id, text, extra) { return Object.assign({ id: id, type: 'note', text: text, startAt: '2026-10-12T01:00:00+00:00', endAt: '2026-10-12T01:00:00+00:00', createdAt: '2026-10-12T01:00:00+00:00', category: null, theme: 'daily', subTheme: null, themeConfidence: 0.5, visibility: 'private' }, extra || {}); }
var RICH = { photo: PHOTO, feedback: { verdict: '실천 완료', fact_insight: '잘했다' }, energy: 60, focus: 40, notionDb: { name: '실천' }, structured: { status: '완료' }, themeMetadata: { k: 1 }, metrics: { volume: 100 } };
function fresh() { delete require.cache[require.resolve('../js/core/local-keep.js')]; return require('../js/core/local-keep.js'); }
function kept(st, key) { var r = st.getItem(key); return r ? JSON.parse(r).items : []; }
function seed(st, recs) { st.data[BK] = JSON.stringify(recs); return st.data[BK]; }

var results = [];
function check(name, fn) {
  try { fn(); results.push({ name: name, ok: true }); }
  catch (e) { results.push({ name: name, ok: false, error: String(e && e.message || e).slice(0, 300) }); }
}
var pending = [];
function checkAsync(name, fn) { pending.push(function () { return fn().then(function () { results.push({ name: name, ok: true }); }, function (e) { results.push({ name: name, ok: false, error: String(e && e.stack || e).slice(0, 400) }); }); }); }

/* ============ 1. 부품: js/core/local-keep.js ============ */
check('(i) 서버가 주지 않는 칸을 같은 id 의 기기 값에서 되붙인다 — 사진 · 피드백 · 에너지 · 집중 · 노션 구조 · 테마 부가정보 · 그 밖의 기기 칸', function () {
  var K = fresh(), st = makeStore(); seed(st, [devRec('r1', '본문', RICH)]);
  var out = K.commitServerRecords(UID, [srvRec('r1', '본문')], st);
  var r = out.records[0];
  ['photo', 'feedback', 'energy', 'focus', 'notionDb', 'structured', 'themeMetadata', 'metrics'].forEach(function (k) { assert.deepStrictEqual(r[k], RICH[k], k + ' 가 화면에 쓸 기록에 되붙었다'); });
  var b = JSON.parse(st.getItem(BK))[0];
  ['photo', 'feedback', 'energy', 'focus', 'notionDb', 'structured', 'themeMetadata', 'metrics'].forEach(function (k) { assert.deepStrictEqual(b[k], RICH[k], k + ' 가 기기 백업에 남았다'); });
  assert.strictEqual(out.result.ok, true); assert.strictEqual(out.result.stage, 'written');
});
check('(i) 서버가 준 칸은 기기의 옛 값으로 덮지 않는다 — 비어 있어도', function () {
  var K = fresh(), st = makeStore(); seed(st, [devRec('r1', '본문', { category: 'exercise', goalId: 'g-dev', title: '기기 제목', photo: PHOTO })]);
  var r = K.commitServerRecords(UID, [srvRec('r1', '본문', { category: null })], st).records[0];
  assert.strictEqual(r.category, null, '서버의 빈 분류를 기기 값으로 채우지 않는다');
  assert.strictEqual(r.goalId, undefined, '서버가 주지 않은 meta 칸(goalId)을 기기 값으로 채우지 않는다');
  assert.strictEqual(r.title, undefined);
  assert.strictEqual(r.startAt, '2026-10-12T01:00:00+00:00', '서버가 준 시각 그대로');
  assert.strictEqual(r.photo, PHOTO);
});
check('조건 ③ 본문이 달라진 기록에는 옛 피드백 · 구조를 되붙이지 않는다(사진 · 에너지 · 집중은 되붙인다). 기기 판의 본문 · 피드백은 보관한다', function () {
  var K = fresh(), st = makeStore(); seed(st, [devRec('r1', '기기에서 고친 본문', RICH)]);
  var r = K.commitServerRecords(UID, [srvRec('r1', '서버의 본문')], st).records[0];
  assert.strictEqual(r.text, '서버의 본문');
  assert.strictEqual(r.feedback, undefined); assert.strictEqual(r.notionDb, undefined); assert.strictEqual(r.structured, undefined);
  assert.strictEqual(r.photo, PHOTO); assert.strictEqual(r.energy, 60); assert.strictEqual(r.focus, 40);
  var items = kept(st, KEPT);
  assert.strictEqual(items.length, 1); assert.strictEqual(items[0].why, 'text-differs');
  assert.strictEqual(items[0].item.text, '기기에서 고친 본문'); assert.deepStrictEqual(items[0].item.feedback, RICH.feedback);
  assert.strictEqual(items[0].item.photo, undefined, '되붙인 사진은 보관에 겹쳐 두지 않는다');
});
check('(ii) 기기에만 있고 서버 응답에 없는 기록은 지우지 않고 보관 열쇠로 옮긴다 — 화면에 쓸 기록에는 없다', function () {
  var K = fresh(), st = makeStore(); seed(st, [devRec('new1', '올리지 못한 기록', { photo: PHOTO }), devRec('old1', '옛')]);
  var out = K.commitServerRecords(UID, [srvRec('old1', '옛')], st);
  assert.deepStrictEqual(out.records.map(function (r) { return r.id; }), ['old1'], '화면은 지금과 같다(안 보인다)');
  assert.deepStrictEqual(JSON.parse(st.getItem(BK)).map(function (r) { return r.id; }), ['old1']);
  var items = kept(st, KEPT);
  assert.strictEqual(items.length, 1); assert.strictEqual(items[0].why, 'not-in-server-response'); assert.strictEqual(items[0].id, 'new1');
  assert.strictEqual(items[0].item.text, '올리지 못한 기록'); assert.strictEqual(items[0].item.photo, PHOTO, '사진까지 그대로 보관');
});
check('(ii) 휴지통에 든 기록은 보관으로 옮기지 않는다(지운 것을 따로 쌓지 않는다)', function () {
  var K = fresh(), st = makeStore(); seed(st, [devRec('gone', '지운 기록'), devRec('old1', '옛')]);
  st.data['ourgoal_trash_backup_' + UID] = JSON.stringify([{ entityType: 'record', originalId: 'gone' }]);
  K.commitServerRecords(UID, [srvRec('old1', '옛')], st);
  assert.strictEqual(kept(st, KEPT).length, 0);
});
check('(iii) 덮어쓰기 직전의 백업 글자를 그대로 한 세대 남기고, 되돌리기가 그 글자를 백업 자리에 돌려놓는다(다시 부르면 원래대로)', function () {
  var K = fresh(), st = makeStore(); var before = seed(st, [devRec('new1', '올리지 못한 기록'), devRec('old1', '옛', RICH)]);
  K.commitServerRecords(UID, [srvRec('old1', '옛')], st);
  var after = st.getItem(BK);
  assert.strictEqual(st.getItem(PREV), before, '직전 사본 = 덮어쓰기 전 글자 그대로');
  assert.notStrictEqual(after, before);
  var r1 = K.restorePrevious('records', UID, st);
  assert.strictEqual(r1.ok, true); assert.strictEqual(st.getItem(BK), before, '되돌리면 백업이 덮어쓰기 전 글자와 같다');
  assert.strictEqual(st.getItem(PREV), after);
  K.restorePrevious('records', UID, st);
  assert.strictEqual(st.getItem(BK), after, '다시 부르면 원래대로');
});
check('쓰는 순서는 보관 → 직전 사본 → 백업이다', function () {
  var K = fresh(), st = makeStore(); seed(st, [devRec('new1', '올리지 못한 기록'), devRec('old1', '옛')]);
  K.commitServerRecords(UID, [srvRec('old1', '옛')], st);
  assert.deepStrictEqual(st.calls.log, [KEPT, PREV, BK]);
});
check('조건 ① 용량 초과(보관 쓰기 실패) — 원래 백업을 그대로 둔다. 직전 사본도 쓰지 않는다', function () {
  var K = fresh(), st = makeStore({ failKey: function (k) { return k === KEPT; } }); var before = seed(st, [devRec('new1', '올리지 못한 기록'), devRec('old1', '옛')]);
  var out = K.commitServerRecords(UID, [srvRec('old1', '옛')], st);
  assert.strictEqual(out.result.ok, false); assert.strictEqual(out.result.stage, 'kept-failed');
  assert.strictEqual(st.getItem(BK), before); assert.strictEqual(st.getItem(PREV), null); assert.strictEqual(st.getItem(KEPT), null);
  assert.deepStrictEqual(out.records.map(function (r) { return r.id; }), ['old1'], '화면은 그대로');
});
check('조건 ① 용량 초과(직전 사본 쓰기 실패) — 원래 백업을 그대로 둔다(보관은 이미 확인됨)', function () {
  var K = fresh(), st = makeStore({ failKey: function (k) { return k === PREV; } }); var before = seed(st, [devRec('new1', '올리지 못한 기록'), devRec('old1', '옛')]);
  var out = K.commitServerRecords(UID, [srvRec('old1', '옛')], st);
  assert.strictEqual(out.result.stage, 'prev-failed'); assert.strictEqual(st.getItem(BK), before);
  assert.strictEqual(kept(st, KEPT).length, 1);
});
check('조건 ① 일부만 쓰임(보관이 잘려 쓰임) — 되읽어 다르면 보관을 쓰기 전으로 돌려놓고 원래 백업을 그대로 둔다', function () {
  var K = fresh(), st = makeStore({ truncateKey: function (k) { return k === KEPT; } }); var before = seed(st, [devRec('new1', '올리지 못한 기록'), devRec('old1', '옛')]);
  var out = K.commitServerRecords(UID, [srvRec('old1', '옛')], st);
  assert.strictEqual(out.result.stage, 'kept-failed'); assert.strictEqual(st.getItem(BK), before); assert.strictEqual(st.getItem(KEPT), null, '잘린 글자를 남기지 않는다');
});
check('조건 ① 일부만 쓰임(직전 사본 · 백업이 잘려 쓰임) — 원래 백업 글자가 남는다', function () {
  var K = fresh(), st = makeStore({ truncateKey: function (k) { return k === PREV; } }); var before = seed(st, [devRec('new1', 'x'), devRec('old1', '옛')]);
  assert.strictEqual(K.commitServerRecords(UID, [srvRec('old1', '옛')], st).result.stage, 'prev-failed'); assert.strictEqual(st.getItem(BK), before); assert.strictEqual(st.getItem(PREV), null);
  var K2 = fresh(), st2 = makeStore({ truncateKey: function (k) { return k === BK; } }); var before2 = seed(st2, [devRec('new1', 'x'), devRec('old1', '옛')]);
  assert.strictEqual(K2.commitServerRecords(UID, [srvRec('old1', '옛')], st2).result.stage, 'backup-failed'); assert.strictEqual(st2.getItem(BK), before2, '잘린 백업을 남기지 않고 원래 글자로 돌려놓는다');
});
check('조건 ① 쓰는 사이 앱 종료 — 쓰기가 0 · 1 · 2번 된 뒤 멈추면 원래 백업 글자가 그대로다', function () {
  [0, 1, 2].forEach(function (n) {
    var done = 0; var K = fresh(); var st = makeStore({ dead: function () { return done >= n; } });
    var before = JSON.stringify([devRec('new1', '올리지 못한 기록'), devRec('old1', '옛', RICH)]); st.data[BK] = before;
    var origSet = st.setItem; st.setItem = function (k, v) { origSet(k, v); done++; };
    K.commitServerRecords(UID, [srvRec('old1', '옛')], st);
    assert.strictEqual(st.getItem(BK), before, '쓰기 ' + n + '번 뒤 종료');
  });
});
check('조건 ④ (다음 저장) 보관을 확인하지 못한 「기기에만 있는 것」은 다음 저장의 백업 쓰기에서도 지워지지 않는다', function () {
  var K = fresh(), st = makeStore({ failKey: function (k) { return k === KEPT; } }); seed(st, [devRec('new1', '올리지 못한 기록', { photo: PHOTO }), devRec('old1', '옛')]);
  var out = K.commitServerRecords(UID, [srvRec('old1', '옛')], st);
  assert.strictEqual(out.result.held, 1);
  K.setBackupFromSave('records', UID, out.records, st); /* saveProfile 이 화면의 기록으로 백업을 쓰는 자리 */
  var b = JSON.parse(st.getItem(BK));
  assert.deepStrictEqual(b.map(function (r) { return r.id; }), ['old1', 'new1']); assert.strictEqual(b[1].photo, PHOTO);
  /* 다음 실행: 자리가 생기면 보관으로 옮겨진다 */
  var K2 = fresh(), st2 = makeStore(); st2.data[BK] = st.getItem(BK);
  K2.commitServerRecords(UID, [srvRec('old1', '옛')], st2);
  assert.strictEqual(kept(st2, KEPT).length, 1); assert.deepStrictEqual(JSON.parse(st2.getItem(BK)).map(function (r) { return r.id; }), ['old1']);
});
check('조건 ④ (다음 저장) 남겨 둔 것이 없으면 저장이 쓰는 글자는 전과 같다', function () {
  var K = fresh(), st = makeStore(); var list = [devRec('a', '1', RICH), devRec('b', '2')];
  K.setBackupFromSave('records', UID, list, st);
  assert.strictEqual(st.getItem(BK), JSON.stringify(list)); assert.strictEqual(K.withHeld('records', UID, list), list);
});
check('조건 ② 이미 빠진 것이 있는 백업으로 직전 사본을 덮기 전에, 직전 사본에만 남은 칸(사진)을 보관한다', function () {
  var K = fresh(), st = makeStore();
  st.data[PREV] = JSON.stringify([devRec('old1', '옛', { photo: PHOTO, energy: 70 })]);   /* 앞선 실행의 직전 사본에는 사진이 있다 */
  seed(st, [devRec('old1', '옛', { energy: 70 })]);                                       /* 지금 백업에서는 사진이 빠졌다 */
  K.commitServerRecords(UID, [srvRec('old1', '옛', { category: 'x' })], st);
  var items = kept(st, KEPT);
  assert.strictEqual(items.length, 1); assert.strictEqual(items[0].why, 'missing-in-backup'); assert.strictEqual(items[0].item.photo, PHOTO);
  assert.strictEqual(items[0].item.energy, undefined, '지금 백업에 있는 칸은 겹쳐 두지 않는다');
  assert.strictEqual(JSON.parse(st.getItem(PREV))[0].photo, undefined, '직전 사본은 새 것으로 바뀌었다');
});
check('조건 ② 보관 항목은 덮지 않는다 — 더하기만 하고, 같은 것을 두 번 보관하지 않는다', function () {
  var K = fresh(), st = makeStore(); seed(st, [devRec('new1', '첫째'), devRec('old1', '옛')]);
  K.commitServerRecords(UID, [srvRec('old1', '옛')], st);
  st.data[BK] = JSON.stringify([devRec('new2', '둘째'), devRec('new1', '첫째'), devRec('old1', '옛')]);
  K.commitServerRecords(UID, [srvRec('old1', '옛')], st);
  assert.deepStrictEqual(kept(st, KEPT).map(function (i) { return i.id; }), ['new1', 'new2']);
});
check('바뀐 것이 없으면 아무것도 쓰지 않는다(직전 사본을 같은 글자로 덮지 않는다)', function () {
  var K = fresh(), st = makeStore(); seed(st, [devRec('old1', '옛', RICH)]);
  K.commitServerRecords(UID, [srvRec('old1', '옛')], st);
  var prev1 = st.getItem(PREV), n = st.calls.set;
  var again = JSON.parse(st.getItem(BK)).map(function (r) { var o = {}; Object.keys(r).forEach(function (k) { if (K.SERVER_RECORD_KEYS.indexOf(k) !== -1) o[k] = r[k]; }); return o; });
  var out = K.commitServerRecords(UID, again, st);
  assert.strictEqual(out.result.stage, 'same'); assert.strictEqual(st.calls.set, n); assert.strictEqual(st.getItem(PREV), prev1);
});
check('같은 계정만 — 다른 계정의 열쇠를 읽거나 쓰지 않고, 다른 사람 표시가 붙은 기기 기록에서는 되붙이지 않는다', function () {
  var K = fresh(), st = makeStore();
  st.data['ourgoal_records_backup_' + OTHER] = JSON.stringify([devRec('r1', '본문', RICH)]);
  seed(st, [devRec('r1', '본문', { photo: PHOTO, user_id: OTHER })]);
  var r = K.commitServerRecords(UID, [srvRec('r1', '본문')], st).records[0];
  assert.strictEqual(r.photo, undefined);
  assert.strictEqual(st.getItem('ourgoal_records_backup_' + OTHER), JSON.stringify([devRec('r1', '본문', RICH)]));
  assert.strictEqual(st.calls.log.filter(function (k) { return k.indexOf(OTHER) !== -1; }).length, 0);
});
check('보관으로 옮겨 둔 기록이 나중에 서버 응답에 나타나면, 보관의 기기 값에서 되붙인다', function () {
  var K = fresh(), st = makeStore(); seed(st, [devRec('new1', '올리지 못한 기록', { photo: PHOTO }), devRec('old1', '옛')]);
  K.commitServerRecords(UID, [srvRec('old1', '옛')], st);
  var r = K.commitServerRecords(UID, [srvRec('new1', '올리지 못한 기록'), srvRec('old1', '옛')], st).records[0];
  assert.strictEqual(r.photo, PHOTO);
});
check('읽을 수 없는 백업 글자는 버리지 않고 글자째 보관한다', function () {
  var K = fresh(), st = makeStore(); st.data[BK] = '{깨진 글자';
  K.commitServerRecords(UID, [srvRec('old1', '옛')], st);
  var items = kept(st, KEPT);
  assert.strictEqual(items[0].why, 'unreadable-backup'); assert.strictEqual(items[0].item.raw, '{깨진 글자'); assert.strictEqual(st.getItem(PREV), '{깨진 글자');
});
check('목표: 기기에만 있는 목표를 보관 열쇠로 옮기고 직전 사본을 남긴다. 휴지통에 든 목표는 옮기지 않는다', function () {
  var K = fresh(), st = makeStore();
  var before = JSON.stringify([{ id: 'g1', title: '서버에도 있는 목표' }, { id: 'gNew', title: '올리지 못한 목표', milestones: [{ id: 'm1', title: '단계' }] }, { id: 'gGone', title: '지운 목표' }]);
  st.data[GBK] = before; st.data['ourgoal_trash_backup_' + UID] = JSON.stringify([{ entityType: 'goal', originalId: 'gGone' }]);
  var out = K.commitServerGoals(UID, [{ id: 'g1', title: '서버에도 있는 목표', milestones: [] }], st);
  assert.deepStrictEqual(out.goals.map(function (g) { return g.id; }), ['g1']);
  var items = kept(st, GKEPT);
  assert.deepStrictEqual(items.map(function (i) { return i.id; }), ['gNew']); assert.strictEqual(items[0].item.milestones[0].title, '단계');
  assert.strictEqual(st.getItem(GPREV), before); assert.deepStrictEqual(st.calls.log, [GKEPT, GPREV, GBK]);
  assert.strictEqual(K.restorePrevious('goals', UID, st).ok, true); assert.strictEqual(st.getItem(GBK), before);
});
check('용량 초과(다음 저장): 자리가 모자라 백업 쓰기가 실패하면 직전 사본을 내려놓고 한 번 더 쓴다', function () {
  var K = fresh(); var big = [devRec('a', '1', { photo: new Array(200).join('P') }), devRec('b', '2')];
  var st = makeStore({ capacity: 1400 });
  st.data[PREV] = JSON.stringify(big); st.data[BK] = JSON.stringify(big);
  var bigger = big.concat([devRec('c', '3', { photo: new Array(60).join('Q') })]);
  K.setBackupFromSave('records', UID, bigger, st);
  assert.strictEqual(st.getItem(BK), JSON.stringify(bigger)); assert.strictEqual(st.getItem(PREV), null);
});

/* ============ 2. 맞물림: 진짜 loadProfile · saveProfile 로(가짜 서버) ============ */
function boot() {
  var store = makeStore();
  var srv = { checkins: [], goals: [], users: [{ id: UID, display_name: '조사용' }], mode: {}, calls: [] };
  function respond(table, op, rows) {
    srv.calls.push({ table: table, op: op, ids: rows ? rows.map(function (r) { return r.id; }) : null });
    var m = srv.mode[table + '.' + op] || 'ok';
    if (m === '500') return Promise.resolve({ data: null, error: { message: 'Internal Server Error' }, status: 500 });
    if (op === 'upsert') { var T = srv[table]; if (T) rows.forEach(function (r) { var i = T.findIndex(function (x) { return x.id === r.id; }); var row = Object.assign({ created_at: '2026-10-12T01:00:00+00:00' }, r); if (i >= 0) T[i] = Object.assign({}, T[i], r); else T.push(row); }); return Promise.resolve({ data: null, error: null, status: 201 }); }
    if (op === 'one') return Promise.resolve({ data: srv.users[0], error: null });
    return Promise.resolve({ data: JSON.parse(JSON.stringify(srv[table] || [])), error: null });
  }
  function from(table) { var q = { upsert: function (rows) { return respond(table, 'upsert', Array.isArray(rows) ? rows : [rows]); }, select: function () { return q; }, eq: function () { return q; }, order: function () { return q; }, limit: function () { return q; }, maybeSingle: function () { return respond(table, 'one'); }, then: function (a, b) { return respond(table, 'select').then(a, b); } }; return q; }
  var state = { profile: null };
  var L = { state: state, sb: { from: from }, updateAppBadge: function () {}, computeStreakDays: function () { return 0; },
    saveLocalSettings: function (u, s) { store.setItem('ourgoal_settings_' + u, JSON.stringify(s || {})); }, loadLocalSettings: function () { return {}; },
    syncLockScreenLiveCard: function () {}, nowISO: function () { return new Date().toISOString(); }, track: function () {}, getAttribution: function () { return {}; },
    getSupabaseAuthToken: function () { return Promise.resolve(null); }, classifyRecordTheme: function () { return { theme: 'daily' }; } };
  ['../js/record-ledger.js', '../js/account-isolation.js', '../js/core/local-keep.js', '../js/core/home-cockpit.js', '../js/core/profile-load.js'].forEach(function (f) { delete require.cache[require.resolve(f)]; });
  global.window = global; global.localStorage = store; global.OurgoalAppScope = { scope: L };
  require('../js/record-ledger.js'); require('../js/account-isolation.js'); require('../js/core/local-keep.js');
  var HC = require('../js/core/home-cockpit.js'), PL = require('../js/core/profile-load.js');
  return { store: store, srv: srv, state: state, save: HC.saveProfile, load: function () { return PL.loadProfile(UID, 'probe@example.invalid', {}, null); }, Keep: global.OurgoalLocalKeep };
}
function oldRows(n) { var a = []; for (var i = 1; i <= n; i++) a.push({ id: 'old-' + i, user_id: UID, type: 'note', text: '옛기록' + i, start_at: '2026-10-0' + i + 'T01:00:00+00:00', end_at: null, created_at: '2026-10-0' + i + 'T01:00:00+00:00', category: null, meta: { visibility: 'private' } }); return a; }
var NEWID = '33333333-3333-4333-8333-333333333333';

checkAsync('[맞물림] 사진 기록을 저장(서버 성공)하고 다시 열면 사진 · 피드백 · 에너지 · 집중이 화면에 쓸 기록과 기기 백업에 남는다 — 다음 저장 · 수동 동기화 · 또 다시 열기 뒤에도', async function () {
  var A = boot(); A.srv.checkins = oldRows(2);
  A.state.profile = await A.load();
  A.state.profile.records.unshift(devRec(NEWID, '사진 기록', { photo: PHOTO, feedback: RICH.feedback, energy: 60, focus: 40, notionDb: RICH.notionDb, structured: RICH.structured, themeMetadata: RICH.themeMetadata }));
  await A.save();
  var row = A.srv.checkins.find(function (r) { return r.id === NEWID; });
  assert.ok(row, '서버에 올라갔다'); assert.strictEqual(JSON.stringify(row).indexOf('data:image'), -1, '서버 줄에는 사진이 없다(서버로 가는 칸은 그대로)');
  var see = function (label) {
    var r = A.state.profile.records.find(function (x) { return x.id === NEWID; });
    assert.ok(r, label + ': 기록이 있다'); assert.strictEqual(r.photo, PHOTO, label + ': 사진'); assert.deepStrictEqual(r.feedback, RICH.feedback, label + ': 피드백'); assert.strictEqual(r.energy, 60, label + ': 에너지'); assert.strictEqual(r.focus, 40, label + ': 집중');
    var b = JSON.parse(A.store.getItem(BK)).find(function (x) { return x.id === NEWID; });
    assert.strictEqual(b.photo, PHOTO, label + ': 백업의 사진'); assert.deepStrictEqual(b.feedback, RICH.feedback, label + ': 백업의 피드백'); assert.strictEqual(b.energy, 60); assert.strictEqual(b.focus, 40);
  };
  A.state.profile = null; A.state.profile = await A.load(); see('다시 열기');
  await A.save(); see('다음 저장');
  var refreshed = await A.load(); A.state.profile = refreshed; await A.save(); see('수동 동기화(불러온 것으로 바꾸고 저장)');
  A.state.profile = null; A.state.profile = await A.load(); see('또 다시 열기');
  assert.strictEqual(kept(A.store, KEPT).length, 0, '보관으로 간 것은 없다');
});
checkAsync('[맞물림] 올리지 못한 기록(서버 500)은 다시 열 때 화면에는 없고 보관 열쇠에 남으며, 다시 올리지 않는다. 직전 사본으로 되돌릴 수 있다', async function () {
  var A = boot(); A.srv.checkins = oldRows(2);
  A.state.profile = await A.load();
  A.state.profile.records.unshift(devRec(NEWID, '올리지 못한 기록', { photo: PHOTO }));
  A.srv.mode['checkins.upsert'] = '500'; await A.save(); A.srv.mode = {};
  var before = A.store.getItem(BK); assert.ok(before.indexOf(NEWID) !== -1);
  A.state.profile = null; A.srv.calls.length = 0; A.state.profile = await A.load();
  assert.strictEqual(A.state.profile.records.some(function (r) { return r.id === NEWID; }), false, '화면은 지금과 같다(안 보인다)');
  var items = kept(A.store, KEPT);
  assert.strictEqual(items.length, 1); assert.strictEqual(items[0].id, NEWID); assert.strictEqual(items[0].item.photo, PHOTO);
  await A.save();
  assert.strictEqual(A.srv.calls.some(function (c) { return c.op === 'upsert' && c.ids && c.ids.indexOf(NEWID) !== -1; }), false, '보관한 것은 올리지 않는다');
  assert.strictEqual(A.srv.checkins.some(function (r) { return r.id === NEWID; }), false);
  assert.strictEqual(kept(A.store, KEPT).length, 1, '다음 저장 뒤에도 보관에 남아 있다');
  assert.strictEqual(A.store.getItem(PREV), before, '직전 사본 = 덮어쓰기 전 글자');
  assert.strictEqual(A.Keep.restorePrevious('records', UID).ok, true); assert.strictEqual(A.store.getItem(BK), before, '되돌리기');
});
checkAsync('[맞물림] 올리지 못한 목표(서버 500)는 다시 열 때 화면에는 없고 목표 보관 열쇠에 남으며, 다시 올리지 않는다', async function () {
  var A = boot(); A.srv.goals = [{ id: 'g1', user_id: UID, title: '서버에도 있는 목표', created_at: '2026-10-01T00:00:00+00:00', milestones: [] }];
  A.state.profile = await A.load();
  A.state.profile.goals.push({ id: 'gNew', title: '올리지 못한 목표', category: 'etc', milestones: [{ id: 'm1', title: '단계' }] });
  A.srv.mode['goals.upsert'] = '500'; await A.save(); A.srv.mode = {};
  var before = A.store.getItem(GBK);
  A.state.profile = null; A.srv.calls.length = 0; A.state.profile = await A.load();
  assert.deepStrictEqual(A.state.profile.goals.map(function (g) { return g.id; }), ['g1']);
  var items = kept(A.store, GKEPT);
  assert.deepStrictEqual(items.map(function (i) { return i.id; }), ['gNew']);
  await A.save();
  assert.strictEqual(A.srv.goals.some(function (g) { return g.id === 'gNew'; }), false, '보관한 목표는 올리지 않는다');
  assert.strictEqual(A.store.getItem(GPREV), before);
});
checkAsync('[맞물림] 서버에 더 묻지 않는다 — 다시 열 때 나가는 서버 호출이 고치기 전과 같다(사용자 1 · 목표 조회 1 · 기록 조회 1)', async function () {
  var A = boot(); A.srv.checkins = oldRows(2); A.store.data[BK] = JSON.stringify([devRec('dev-only', '기기에만'), devRec('old-1', '옛기록1', RICH)]);
  A.srv.calls.length = 0; await A.load();
  assert.deepStrictEqual(A.srv.calls.map(function (c) { return c.table + '.' + c.op; }), ['users.one', 'goals.select', 'checkins.select']);
});

(async function () {
  for (var i = 0; i < pending.length; i++) await pending[i]();
  var failed = results.filter(function (r) { return !r.ok; });
  if (process.argv.indexOf('--json') !== -1) console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, results: results }));
  else { results.forEach(function (r) { console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : '\n       ' + r.error)); }); console.log('local-keep-p0: ' + (results.length - failed.length) + '/' + results.length); }
  process.exit(failed.length ? 1 : 0);
})();
