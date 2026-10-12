'use strict';
// 실제 앱 Chrome에서 직접 두 함수와 오류 경로를 부른다. 가짜 세션·차단된 외부망·가짜 응답이며 UI 실클릭 E2E와 구분한다.
const fs = require('fs'), path = require('path');
const label = process.argv[2];
if (!['before', 'after'].includes(label)) throw Error('before or after required');
const dir = path.join(__dirname, 'browser', label);
for (const p of ['tools', 'raw', 'shots']) fs.mkdirSync(path.join(dir, p), { recursive: true });
fs.copyFileSync(path.resolve(__dirname, '../../TASK-ES-694/repro/tools/h.cjs'), path.join(dir, 'tools/h.cjs'));
const h = require(path.join(dir, 'tools/h.cjs'));
const out = { label, appTree: h.WT, scope: 'actual app in Chrome; direct product calls; fake sessions and responses; operating server requests 0', scenarios: [] };
function direct(which, failing, uid) {
  return (async function () {
    var L = window.OurgoalAppScope.scope, P = L.state.profile, K = window.OurgoalLocalKeep;
    var b = 'ourgoal_records_backup_' + uid, p = 'ourgoal_records_prev_' + uid, k = 'ourgoal_records_kept_' + uid;
    var gb = 'ourgoal_goals_backup_' + uid, gp = 'ourgoal_goals_prev_' + uid, gk = 'ourgoal_goals_kept_' + uid;
    var put = Storage.prototype.setItem, get = Storage.prototype.getItem;
    var rec = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type: 'note', text: 'direct-record', photo: 'data:image/png;base64,direct-photo', feedback: { verdict: 'direct-feedback' }, energy: 61, focus: 43, notionDb: { name: 'direct-structure' } };
    P.records = [rec]; P.goals = []; P.settings = P.settings || {};
    [p, k, gp, gk].forEach(function (key) { localStorage.removeItem(key); });
    put.call(localStorage, b, JSON.stringify([rec])); put.call(localStorage, gb, '[]');
    var commitResult = null;
    if (failing) {
      var device = Object.assign({}, rec, { text: 'edited-device-text', feedback: { verdict: 'unique-device-feedback' } });
      put.call(localStorage, b, JSON.stringify([device]));
      Storage.prototype.setItem = function (key, v) { if (key === k) throw new DOMException('injected quota', 'QuotaExceededError'); return put.call(this, key, v); };
      commitResult = K.commitServerRecords(uid, [Object.assign({}, rec, { text: 'server-text', feedback: undefined })]).result;
      P.records = [Object.assign({}, rec, { text: 'server-text', feedback: undefined })];
    }
    var before = get.call(localStorage, b), origFetch = window.fetch, apiCalls = [], result;
    var beforeArray = JSON.parse(before);
    try {
      if (which === 'syncServerRecords') {
        window.fetch = function (url, options) {
          if (String(url).indexOf('/api/track') === 0) {
            var body = JSON.parse(options.body); apiCalls.push({ action: body.action, userId: body.userId, backupIds: body.backupIds, fields: Object.keys(body).sort() });
            return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ ok: true, targetUserId: uid, records: [{ id: rec.id, type: 'note', text: failing ? 'server-text' : rec.text, category: 'exercise' }], goals: [{ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', title: 'direct-server-goal', milestones: [] }] }); } });
          }
          return origFetch.apply(this, arguments);
        };
        result = await window.OurgoalUiHelpers.syncServerRecords(true);
      } else {
        put.call(localStorage, 'ourgoal_guest_profile', JSON.stringify({ id: 'guest_p0_direct', settings: {}, goals: [{ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', title: 'direct-guest-goal', milestones: [], startDate: '2026-10-13' }], records: [{ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', type: 'note', text: 'direct-guest-record', photo: 'guest-photo', energy: 23, focus: 77 }] }));
        result = await window.OurgoalSettingsKit.migrateGuestDataToUser(uid, P);
      }
    } finally { window.fetch = origFetch; Storage.prototype.setItem = put; }
    var after = get.call(localStorage, b), afterArray = JSON.parse(after), original = afterArray.find(function (r) { return r.id === rec.id; });
    var values = [b, p, k].map(function (key) { return get.call(localStorage, key) || ''; });
    return { which, failing, result, commitResult, apiCalls, backupBefore: beforeArray, backupAfter: afterArray, original: original, originalFieldsPreserved: !!original && original.photo === rec.photo && original.energy === 61 && original.focus === 43,
      beforeRawEqualsAfter: before === after, uniqueEditedFeedbackRetained: values.some(function (raw) { return raw.indexOf('unique-device-feedback') >= 0; }), goalsBackup: JSON.parse(get.call(localStorage, gb)), guestCopyRemaining: !!get.call(localStorage, 'ourgoal_guest_profile'), stateIds: P.records.map(function (r) { return r.id; }) };
  })();
}
(async () => {
  let H;
  try {
    H = await h.open(); out.chrome = H.chrome; out.lib = h.libInfo(H.libPath);
    H.S.tables.users = [h.userRow()]; H.S.tables.checkins = h.oldRows(2);
    await H.nav(); out.entered = !!(await H.waitEntered(25000)); await H.sleep(3000);
    for (const which of ['syncServerRecords', 'migrateGuestDataToUser']) {
      for (const failing of [false, true]) {
        H.S.setMode({ 'rest.write': '500' }); const since = H.S.seq;
        const r = JSON.parse(await H.ev('(' + direct.toString() + ')(' + JSON.stringify(which) + ',' + failing + ',' + JSON.stringify(h.UID) + ').then(function(x){return JSON.stringify(x);})'));
        r.requests = H.reqsSince(since).map(x => ({ method: x.method, kind: x.kind, table: x.table, rows: x.rows || null, keys: x.keys || null }));
        out.scenarios.push(r);
      }
    }
    out.exceptions = H.exc; out.console = H.con; out.shot = await H.shot('direct-paths');
  } catch (e) { out.error = String(e.stack || e); }
  finally { if (H) await H.close(); }
  fs.writeFileSync(path.join(dir, 'direct-results.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ label, entered: out.entered, error: out.error || null, scenarios: out.scenarios.map(x => ({ which: x.which, failing: x.failing, result: x.result, originalFieldsPreserved: x.originalFieldsPreserved, uniqueEditedFeedbackRetained: x.uniqueEditedFeedbackRetained, requests: x.requests })) }));
  process.exitCode = out.error ? 1 : 0;
})();
