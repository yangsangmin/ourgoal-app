/* TASK-ES-695 A: device data/readback + account-owned pending changes.
 * Server authority is unchanged. This module does not claim server CAS or two-device safety.
 * Dependencies are supplied by the existing saveProfile boundary; no new window name. */
(function (g) {
  'use strict';
  var PREFIX = 'ourgoal_save_pending_', active = new Map(), controllers = new Map(), observing = false;
  var states = new Map(), revisions = new Map(), focused = null;
  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function key(uid) { return PREFIX + uid; }
  function read(st, uid) {
    var raw = st.getItem(key(uid));
    if (raw === null) return { schema: 1, account: uid, versions: {}, entries: {}, confirmed: {} };
    var q = JSON.parse(raw);
    if (q && !q.confirmed) q.confirmed = {};
    if (!q || q.schema !== 1 || q.account !== uid || !q.versions || !q.entries) throw new Error('pending-integrity');
    Object.keys(q.entries).forEach(function (id) {
      var e = q.entries[id];
      if (!e || e.account !== uid || e.target !== id || e.kind !== 'records' || !e.changeId || !Number.isSafeInteger(e.generation) || e.generation < 1 || !e.payload || e.payload.user_id !== uid || String(e.payload.id) !== id || q.versions[id] !== e.generation) throw new Error('pending-integrity');
    });
    return q;
  }
  function write(st, k, value, before) {
    var raw = JSON.stringify(value);
    if (st.getItem(k) !== before) throw new Error('source-changed');
    st.setItem(k, raw);
    if (st.getItem(k) !== raw) throw new Error('write-unverified');
  }
  function lock(uid, fn) {
    if (!g.navigator || !g.navigator.locks) return Promise.reject(new Error('tab-lock-unavailable'));
    return g.navigator.locks.request('ourgoal-save-' + uid, fn);
  }
  function isCurrent(d, profile) { return d.current() === profile && profile.id === d.current().id; }
  function result(uid, id) {
    var k = uid + ':' + id, revision = (revisions.get(k) || 0) + 1; revisions.set(k, revision);
    return { account: uid, recordId: id, localRevision: revision, generation: null, changeId: null, state: 'failed', reason: 'device-unverified', photoStored: false,
      types: { users: { device: false, remote: 'not-sent' }, goals: { device: false, remote: 'not-sent' }, records: { device: false, remote: 'not-sent' } } };
  }
  function emit(r) {
    var shown = states.get(r.account + ':' + r.recordId);
    if(shown && shown.localRevision > r.localRevision) return;
    states.set(r.account + ':' + r.recordId, r);
    if (g.OurgoalEvents) g.OurgoalEvents.emit('save:state-changed', publicResult(r));
  }
  function publicResult(r) { var x = Object.assign({}, r); delete x.whenSettled; return copy(x); }
  function persist(d, profile) {
    var uid = profile.id, st = d.store;
    ['goals', 'records'].forEach(function (kind) {
      var backupKey = 'ourgoal_' + kind + '_backup_' + uid, before = st.getItem(backupKey), storageError = null;
      // P0 deliberately returns false for a verified-write failure. Capture the actual storage
      // exception without changing that policy; quota fallback is allowed only if its source stayed put.
      var checkedStore = { getItem: function(k){ return st.getItem(k); }, removeItem: function(k){ return st.removeItem(k); }, setItem: function(k,v){
        try { return st.setItem(k,v); } catch(e){ storageError=e; throw e; }
      }};
      try { if (d.keep(kind, uid, profile[kind] || [], checkedStore) !== true) throw new Error('preservation-unverified'); }
      catch(error){ if(storageError && st.getItem(backupKey) === before) throw storageError; throw error; }
      var saved = JSON.parse(st.getItem('ourgoal_' + kind + '_backup_' + uid));
      (profile[kind] || []).forEach(function (item) {
        var row = saved && saved.find(function (x) { return x && x.id === item.id; });
        if (!row || Object.keys(item).some(function (k) { return JSON.stringify(row[k]) !== JSON.stringify(item[k]); })) throw new Error('data-unverified');
      });
    });
    var profileData = { displayName: profile.displayName, bio: profile.bio || '', avatarUrl: profile.avatarUrl || '', interests: profile.interests || [], region: profile.region || '', regionPublic: !!profile.regionPublic, itItems: profile.itItems || [] };
    var values = {};
    values['ourgoal_settings_' + uid] = profile.settings || {};
    values['ourgoal_profile_backup_' + uid] = profileData;
    values.ourgoal_guest_profile = profile;
    if (profile.calendarDayBackgrounds) values['ourgoal_cal_day_bg_' + uid] = profile.calendarDayBackgrounds;
    if (profile.trash) values['ourgoal_trash_backup_' + uid] = profile.trash;
    if (profile.companions) values['ourgoal_companions_backup_' + uid] = profile.companions;
    Object.keys(values).forEach(function (k) { write(st, k, values[k], st.getItem(k)); });
  }
  function withoutNewPhoto(profile, target) {
    var p = copy(profile);
    p.records.forEach(function (r) { if (String(r.id) === target) delete r.photo; });
    if (p.settings && p.settings.proTemplateRecords && p.settings.proTemplateRecords[target]) delete p.settings.proTemplateRecords[target].photo;
    return p;
  }
  function equal(a, b, field) {
    if (a === undefined) return true; // omitted request field has no assertion
    if (a === null) return b === null;
    if (/_at$/.test(field) && a && b) return Number.isFinite(Date.parse(a)) && Date.parse(a) === Date.parse(b);
    if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every(function (x, i) { return equal(x, b[i], ''); });
    if (typeof a === 'object') return !!b && typeof b === 'object' && Object.keys(a).every(function (k) { return equal(a[k], b[k], k); });
    return typeof a === typeof b && a === b;
  }
  function confirmed(entry, res) {
    return res && !res.error && Array.isArray(res.data) && res.data.length === 1 && String(res.data[0].id) === entry.target && res.data[0].user_id === entry.account && Object.keys(entry.payload).every(function (k) { return equal(entry.payload[k], res.data[0][k], k); });
  }
  function classify(res) {
    var e = res && res.error || {}, status = Number(res && res.status || e.status), code = String(e.code || '');
    if (status === 401 || code === 'PGRST301' || code === 'PGRST303') return ['reauth', 'authentication', 'reauth'];
    if (status === 403) return ['rejected', 'permission', 'rejected'];
    if (status === 429 || status >= 500) return ['local', 'temporary', 'temporary'];
    if (status >= 400 || res && res.error) return ['rejected', status === 413 ? 'too-large' : 'invalid-data', 'rejected'];
    return ['local', 'unconfirmed', 'unconfirmed'];
  }
  function settings(d) {
    var cfg = (d.current() && d.current().settings && d.current().settings.saveSync) || {};
    return { timeoutMs: Math.min(60000, Math.max(20, Number(cfg.timeoutMs) || 12000)), retryMs: Math.min(300000, Math.max(100, Number(cfg.retryMs) || 10000)), maxAttempts: Math.min(8, Math.max(1, Number(cfg.maxAttempts) || 4)) };
  }
  async function sendOne(d, profile, entry, r) {
    var uid = profile.id, token = uid + ':' + entry.target;
    if (active.has(token)) return active.get(token);
    var task = g.navigator.locks.request('ourgoal-send-' + uid, async function () {
      if (!isCurrent(d, profile)) return r;
      var pendingNow = read(d.store, uid).entries[entry.target];
      if (!pendingNow || pendingNow.changeId !== entry.changeId || pendingNow.generation !== entry.generation) return r;
      if(d.isGuest && d.isGuest()) { r.state='local'; r.reason='guest-not-sent'; r.types.records.remote='not-sent'; emit(r); return r; }
      var auth;
      try { auth = await d.session(); } catch (_) { auth = null; }
      if (!isCurrent(d, profile)) return r;
      if (!auth || auth.id !== uid) { r.state = 'reauth'; r.reason = 'authentication'; r.types.records.remote = 'reauth'; emit(r); return r; }
      var cfg = settings(d), controller = new AbortController(), timer;
      controllers.set(token, { controller: controller, current: function(){ return isCurrent(d, profile); } });
      r.state = 'sending'; r.reason = ''; r.types.records.remote = 'unconfirmed'; emit(r);
      var operation = Promise.resolve().then(function () { return d.send(copy(entry.payload), controller.signal); });
      var timed = new Promise(function (resolve) { timer = setTimeout(function () { controller.abort(); resolve({ timeout: true }); }, cfg.timeoutMs); });
      var res;
      try { res = await Promise.race([operation, timed]); } catch (_) { res = { transportFailure: true }; }
      clearTimeout(timer);
      if (!isCurrent(d, profile)) { controller.abort(); return r; }
      // A late response cannot settle the next generation; timeout never means rollback.
      var outcome = res && (res.timeout || res.transportFailure) ? ['local', res.timeout ? 'unconfirmed' : 'temporary', res.timeout ? 'unconfirmed' : 'temporary'] : (confirmed(entry, res) ? ['confirmed', '', 'confirmed'] : classify(res));
      await lock(uid, function () {
        var before = d.store.getItem(key(uid)), q = read(d.store, uid), live = q.entries[entry.target];
        if (!live || live.changeId !== entry.changeId || live.generation !== entry.generation) return;
        live.attempts += 1; live.lastFailure = outcome[0] === 'confirmed' ? null : outcome[1];
        if (outcome[0] === 'confirmed') { q.confirmed[entry.target] = live.payload; delete q.entries[entry.target]; }
        write(d.store, key(uid), q, before);
        if (!isCurrent(d, profile)) return;
        var latest = states.get(uid + ':' + entry.target);
        var targetResult = latest && latest.changeId === entry.changeId && latest.generation === entry.generation ? latest : r;
        targetResult.state = outcome[0]; targetResult.reason = outcome[1]; targetResult.types.records.remote = outcome[2]; emit(targetResult);
      });
      return r;
    }).catch(function () { if (isCurrent(d, profile)) { r.state = 'local'; r.reason = 'unconfirmed'; emit(r); } return r; }).finally(function () { active.delete(token); controllers.delete(token); });
    active.set(token, task); return task;
  }
  async function retry(d, manual) {
    observe(d);
    var profile = d.current(); if (!profile) return [];
    var q;
    try { q = read(d.store, profile.id); } catch (_) { return []; }
    try {
      await lock(profile.id, function(){
        if(!isCurrent(d, profile)) return;
        var raw = d.store.getItem('ourgoal_records_backup_' + profile.id);
        var rows = raw === null ? [] : JSON.parse(raw);
        if(!Array.isArray(rows)) throw new Error('data-integrity');
        var restored = false;
        Object.keys(q.entries).forEach(function(id){
          if(!rows.some(function(r){return r && String(r.id) === id;})){
            var body = d.fromRow(q.entries[id].payload); body.devicePhotoMissing = true;
            rows.push(body); restored = true;
          }
        });
        if(restored && d.keep('records', profile.id, rows, d.store) !== true) throw new Error('recovery-unverified');
      });
    } catch (_) { return []; }
    var cfg = settings(d);
    return Promise.all(Object.keys(q.entries).map(function (id) {
      var e = q.entries[id], r = states.get(profile.id + ':' + id) || result(profile.id, id);
      r.state = 'local'; r.generation = e.generation; r.changeId = e.changeId; r.types.records.device = true;
      if (e.lastFailure === 'permission' || e.lastFailure === 'invalid-data' || e.lastFailure === 'too-large' || !manual && e.attempts >= cfg.maxAttempts) return r;
      return sendOne(d, profile, e, r);
    }));
  }
  function observe(d) {
    if (observing) return; observing = true;
    var last = null;
    g.addEventListener('online', function () { retry(d); });
    // A bounded heartbeat also notices login/profile replacement; old account queues remain untouched.
    function tick() {
      var p = d.current(), uid = p && p.id;
      controllers.forEach(function (item) { if (!item.current()) item.controller.abort(); });
      if (uid && (uid !== last || g.navigator.onLine)) retry(d);
      last = uid; setTimeout(tick, Math.min(300000, settings(d).retryMs + Math.floor(Math.random() * 1000)));
    }
    setTimeout(tick, settings(d).retryMs);
  }
  async function save(d, options) {
    options = options || {}; var profile = d.current(), uid = profile && profile.id, id = String(options.recordId || '');
    var r = result(uid, id);
    if (!uid || !id) return r;
    if(['__proto__','constructor','prototype'].indexOf(id) >= 0){ r.reason='invalid-target'; return r; }
    try {
      await lock(uid, function () {
        if (!isCurrent(d, profile)) throw new Error('account-changed');
        var before = d.store.getItem(key(uid)), q = read(d.store, uid);
        var rec = (profile.records || []).find(function (x) { return String(x.id) === id; });
        if (!rec || !d.owned(rec, uid)) throw new Error('owner-mismatch');
        var snapshot = copy(profile);
        try { persist(d, snapshot); r.photoStored = true; }
        catch (error) {
          if (!rec.photo || !/quota|exceed|storage.*full/i.test(String(error && error.message))) throw error;
          persist(d, withoutNewPhoto(snapshot, id)); r.photoStored = false; r.reason = 'photo-missing';
        }
        var payload = d.row(rec, uid), prev = q.entries[id];
        // Local-only feedback/photo changes do not create an extra remote write.
        var already = !prev && q.confirmed[id] && equal(payload, q.confirmed[id], '') && equal(q.confirmed[id], payload, '');
        if (!already && (!prev || !equal(payload, prev.payload, '') || !equal(prev.payload, payload, ''))) {
          q.versions[id] = (q.versions[id] || 0) + 1;
          q.entries[id] = { changeId: d.newId(), generation: q.versions[id], account: uid, kind: 'records', operation: options.operation || 'update', target: id, payload: payload, knownServerState: null, createdAt: new Date().toISOString(), attempts: 0, lastFailure: null };
        }
        write(d.store, key(uid), q, before);
        r.generation = q.versions[id]; r.changeId = q.entries[id] ? q.entries[id].changeId : null;
        r.state = already ? 'confirmed' : 'local'; if (r.photoStored) r.reason = already ? '' : 'queued';
        if(already) r.types.records.remote = 'confirmed';
        Object.keys(r.types).forEach(function (kind) { r.types[kind].device = true; });
      });
      emit(r); observe(d);
      if(options.focus) focused = {account:uid, recordId:id};
      var entry = read(d.store, uid).entries[id];
      r.whenSettled = entry ? sendOne(d, profile, entry, r) : Promise.resolve(r);
      return r;
    } catch (e) { r.reason = String(e && e.message || 'device-unverified'); emit(r); return r; }
  }
  function message(r, action) {
    if (!r || r.state === 'failed') return '저장하지 못했어요. 입력을 그대로 남겨 두었어요.';
    var words = { confirmed: '반영됐어요', sending: '올리는 중이에요', local: '기기에 보관했어요. 올라간 것은 아직 확인되지 않았어요', reauth: '기기에 보관했어요. 다시 로그인하면 올라가요', rejected: '기기에 보관했지만 올리지 못했어요' };
    return (action ? action + ' · ' : '') + words[r.state] + (r.photoStored === false ? ' · 사진은 보관하지 못했어요. 다시 붙여 주세요.' : '');
  }
  var api = { save: save, retry: retry, message: message, focused: function(uid,id){return !!focused && focused.account === uid && focused.recordId === id;}, status: function (uid, id) { return states.get(uid + ':' + id) || null; }, equal: equal, read: read };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (g.OurgoalCapabilities) {
    var localMeta = { cell: 'core/device-save', description: 'DIR006 기기 확인과 계정별 미확정 기록', sideEffect: 'server' };
    var readMeta = { cell: 'core/device-save', description: 'DIR006 기록 저장 상태', sideEffect: 'none' };
    g.OurgoalCapabilities.provide('storage.device.save', api.save, localMeta);
    g.OurgoalCapabilities.provide('storage.device.retry', api.retry, localMeta);
    g.OurgoalCapabilities.provide('storage.device.message', api.message, readMeta);
    g.OurgoalCapabilities.provide('storage.device.status', api.status, readMeta);
    g.OurgoalCapabilities.provide('storage.device.focused', api.focused, readMeta);
  }
})(typeof window !== 'undefined' ? window : globalThis);
