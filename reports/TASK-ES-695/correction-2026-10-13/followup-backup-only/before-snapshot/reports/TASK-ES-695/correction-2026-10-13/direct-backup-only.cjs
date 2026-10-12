'use strict';
// 실제 제품 함수를 고정 VM에서 직접 부른다. 서버·렌더러만 주입하며 브라우저·실계정 측정으로 부르지 않는다.
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process'), assert = require('assert');
const root = path.resolve(__dirname, '../../..'), previous = 'd6b15c1969748b2d622e14d9b2ded26ccac00162', base = 'db82811639c703f95c2349f2045dd443b7cec01f';
const uid = '11111111-1111-4111-8111-111111111111';
const source = (file, label) => label === 'after' ? fs.readFileSync(path.join(root, file), 'utf8') : fs.readFileSync(path.join('C:/Users/HP/AppData/Local/Temp/codex-pr968-review',label === 'base' ? 'base' : 'head',file),'utf8');
function environment(label) {
  const data = {}, server = [], storage = [], render = [], warns = [];
  const store = { getItem(k) { return Object.hasOwn(data, k) ? data[k] : null; }, setItem(k, v) { data[k] = String(v); storage.push(k); }, removeItem(k) { delete data[k]; } };
  const P = { id: uid, username: 'probe@example.invalid', displayName: '직접 재현', settings: {}, records: [], goals: [] };
  const L = { state: { profile: P, activeTab: 'home' }, getSupabaseAuthToken: async () => 'local-probe-only', getTrashList: () => [], saveLocalSettings: (u, s) => store.setItem('ourgoal_settings_' + u, JSON.stringify(s)), renderHome: () => render.push('renderHome'), nowISO: () => '2026-10-13T01:00:00.000Z', updateAppBadge() {}, computeStreakDays: () => 0, syncLockScreenLiveCard() {}, loadLocalSettings: () => ({}), isValidRealUser: () => true, toast: s => render.push(s) };
  L.sb = { from(table) { return { async upsert(rows) { const list = Array.isArray(rows) ? rows : [rows]; server.push({ op: 'upsert', table, ids: list.map(x => x.id), keys: list.map(x => Object.keys(x).sort()) }); return { data: null, error: null }; } }; } };
  const C = { localStorage: store, console: { warn: (...a) => warns.push(a.map(String).join(' ')), log() {} }, OurgoalAppScope: { scope: L }, sb: L.sb, fetch: async (url, o) => { const body = JSON.parse(o.body); server.push({ op: 'fetch', url, body }); return { ok: true, json: async () => ({ ok: true, targetUserId: uid, records: [{ id: 'same', type: 'note', text: 'server-text', category: 'exercise' }], goals: [{ id: 'server-goal', title: '서버 목표', milestones: [] }] }) }; }, Set, Date, JSON };
  C.window = C; vm.createContext(C);
  const files = ['js/account-isolation.js', 'js/record-ledger.js'];
  if (label !== 'base') files.push('js/core/local-keep.js');
  files.push('js/core/home-cockpit.js', 'js/core/server-records-sync.js', 'js/tabs/settings/guest-migration.js');
  for (const f of files) vm.runInContext(source(f, label), C, { filename: f });
  L.saveProfile = C.OurgoalUiHelpers.saveProfile;
  return { C, L, P, data, server, storage, render, warns, store };
}
async function probe(label, which, failing) {
  const E = environment(label), K = E.C.OurgoalLocalKeep, b = 'ourgoal_records_backup_' + uid, k = 'ourgoal_records_kept_' + uid;
  const rec = { id: 'same', type: 'note', text: 'server-text', photo: 'unique-photo', feedback: 'visible-feedback', energy: 60, focus: 40 };
  E.P.records = [{id:'same',type:'note',text:'server-text'}]; E.data[b] = JSON.stringify([rec]);
  let initial = null;
  if (failing && K) {
    E.data[b] = JSON.stringify([{ ...rec, text: 'device-edit', feedback: 'unique-device-feedback' }]);
    const set = E.store.setItem; E.store.setItem = (key, v) => { if (key === k) throw Error('QuotaExceededError'); set(key, v); };
    initial = K.commitServerRecords(uid, [{ id: 'same', type: 'note', text: 'server-text' }]).result;
    E.P.records = [{ id: 'same', type: 'note', text: 'server-text', photo: 'unique-photo', energy: 60, focus: 40 }];
  }
  E.storage.length = 0;
  let result;
  if (which === 'syncServerRecords') result = await E.C.OurgoalUiHelpers.syncServerRecords(true);
  else {
    E.data.ourgoal_guest_profile = JSON.stringify({ id: 'guest_direct', goals: [{ id: 'guest-goal', title: '게스트 목표', milestones: [], startDate: '2026-10-13' }], records: [{ id: 'guest-record', type: 'note', text: '게스트 기록', photo: 'guest-photo', energy: 20, focus: 80 }], settings: {} });
    result = await E.C.OurgoalSettingsKit.migrateGuestDataToUser(uid, E.P);
  }
  return { label, which, failing, result, initial, server: E.server, render: E.render, storage: E.storage, state: JSON.parse(JSON.stringify(E.P)), data: E.data, editedFeedbackRetained: Object.values(E.data).some(x => x.includes('unique-device-feedback')), warns: E.warns };
}
(async () => {
  const rows = [];
  for (const label of ['before', 'after']) for (const which of ['syncServerRecords', 'migrateGuestDataToUser']) for (const failing of [false, true]) rows.push(await probe(label, which, failing));
  const comparisons = [];
  for (const which of ['syncServerRecords', 'migrateGuestDataToUser']) for (const failing of [false, true]) {
    const a = rows.find(x => x.label === 'before' && x.which === which && x.failing === failing), b = rows.find(x => x.label === 'after' && x.which === which && x.failing === failing);
    const serverSame = JSON.stringify(a.server) === JSON.stringify(b.server), stateSame = JSON.stringify(a.state) === JSON.stringify(b.state), renderSame = JSON.stringify(a.render) === JSON.stringify(b.render);
    comparisons.push({ which, failing, serverSame, stateSame, renderSame, beforeEditedFeedbackRetained: a.editedFeedbackRetained, afterEditedFeedbackRetained: b.editedFeedbackRetained });
    assert.ok(serverSame && stateSame && renderSame);
    if (failing) assert.ok(b.editedFeedbackRetained);
  }
  // 기존 main의 실제 setItem 자리와 새 commit에 같은 최종 read→set 경합을 넣어 비교한다.
  const main = environment('base'), backup = 'ourgoal_records_backup_' + uid, concurrent = JSON.stringify([{ id: 'other', text: 'write-between-check-and-set' }]);
  main.P.records = [{ id: 'same', text: 'server-text' }]; main.data[backup] = JSON.stringify(main.P.records);
  const oldSet = main.store.setItem;
  main.store.setItem = (k, v) => { if (k === backup) main.data[k] = concurrent; oldSet(k, v); };
  await main.C.OurgoalUiHelpers.syncServerRecords(true);
  const boundary = { baseCommit: base, path: 'actual syncServerRecords at original main with concurrent setItem hook', baseRetainsConcurrent: Object.values(main.data).some(x => x.includes('write-between-check-and-set')), correctedRetainsConcurrent: JSON.parse(fs.readFileSync(path.join(__dirname, 'sequence-probe.json'), 'utf8')).boundary.concurrentRemains, note: 'same missing CAS boundary; not a new safety guarantee; B single-writer design is separate' };
  const out = { previous, base, rows, comparisons, boundary, scope: 'product VM with fake server/store/render; no operating server requests' };
  fs.writeFileSync(path.join(__dirname, 'direct-backup-only.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ comparisons, boundary }));
})().catch(e => { fs.writeFileSync(path.join(__dirname, 'direct-calls.error.log'), e.stack, 'utf8'); console.error(e.stack); process.exitCode = 1; });
