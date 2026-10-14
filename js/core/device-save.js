/* TASK-ES-695 A: device data/readback + account-owned pending changes.
 * Server authority is unchanged. This module does not claim server CAS or two-device safety.
 * Dependencies are supplied by the existing saveProfile boundary; no new window name. */
(function (g) {
  'use strict';
  var PREFIX = 'ourgoal_save_pending_', active = new Map(), controllers = new Map(), observing = false;
  var states = new Map(), revisions = new Map(), focused = null;
  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function key(uid) { return PREFIX + uid; }
  function bucket(q, kind) {
    if (kind === 'records') return q;
    if (kind !== 'users' && kind !== 'goals') throw new Error('invalid-kind');
    q.kindData ||= {};
    return q.kindData[kind] ||= { versions: {}, entries: {}, confirmed: {} };
  }
  function stateKey(uid, kind, target) { return JSON.stringify([uid, kind, target]); }
  function targetOf(r) { return r.targetId || r.recordId; }
  function payloadOwn(kind, payload, id, uid) {
    return !!payload && String(payload.id) === id && (kind === 'users' ? payload.id === uid && id === uid : payload.user_id === uid);
  }
  function read(st, uid) {
    var raw = st.getItem(key(uid));
    if (raw === null) return { schema: 1, account: uid, versions: {}, entries: {}, confirmed: {} };
    var q = JSON.parse(raw);
    if (q && !q.confirmed) q.confirmed = {};
    if (!q || q.schema !== 1 || q.account !== uid || !q.versions || !q.entries) throw new Error('pending-integrity');
    if (Object.prototype.hasOwnProperty.call(q,'kindData') && (!q.kindData || typeof q.kindData !== 'object' || Array.isArray(q.kindData) || Object.keys(q.kindData).some(function(k){return k !== 'users' && k !== 'goals';}))) throw new Error('pending-integrity');
    ['records'].concat(Object.keys(q.kindData || {})).forEach(function(kind){
      var b = bucket(q, kind);
      if (!b || !b.versions || !b.entries || !b.confirmed || [b.versions,b.entries,b.confirmed].some(function(v){return typeof v !== 'object' || Array.isArray(v);})) throw new Error('pending-integrity');
      if(Object.keys(b.versions).some(function(id){return !Number.isSafeInteger(b.versions[id]) || b.versions[id] < 1;})
        || Object.keys(b.confirmed).some(function(id){return !payloadOwn(kind,b.confirmed[id],id,uid);})) throw new Error('pending-integrity');
      Object.keys(b.entries).forEach(function (id) {
        var e = b.entries[id];
        if (!e || e.account !== uid || e.target !== id || e.kind !== kind || !e.changeId || !Number.isSafeInteger(e.generation) || e.generation < 1 || !payloadOwn(kind,e.payload,id,uid) || b.versions[id] !== e.generation) throw new Error('pending-integrity');
      });
    });
    return q;
  }
  function write(st, k, value, before) {
    var raw = JSON.stringify(value);
    if (st.getItem(k) !== before) throw new Error('source-changed');
    st.setItem(k, raw);
    if (st.getItem(k) !== raw) throw new Error('write-unverified');
  }
  function pending(uid, store, expectedSource) {
    var raw=store.getItem(key(uid));
    if(arguments.length>2 && raw!==expectedSource) throw new Error('pending-source-changed');
    var q=read(store,uid);
    if(store.getItem(key(uid))!==raw) throw new Error('pending-source-changed');
    return {source:raw,data:copy(q)};
  }
  function lock(uid, fn) {
    if (!g.navigator || !g.navigator.locks) return Promise.reject(new Error('tab-lock-unavailable'));
    return g.navigator.locks.request('ourgoal-save-' + uid, fn);
  }
  function isCurrent(d, profile) { return d.current() === profile && profile.id === d.current().id; }
  function result(uid, id, kind) {
    kind ||= 'records';
    var k = stateKey(uid, kind, id), revision = (revisions.get(k) || 0) + 1; revisions.set(k, revision);
    return { account: uid, kind: kind, targetId: id, recordId: kind === 'records' ? id : null, localRevision: revision, generation: null, changeId: null, state: 'failed', reason: 'device-unverified', photoStored: kind === 'records' ? false : null,
      types: { users: { device: false, remote: 'not-sent' }, goals: { device: false, remote: 'not-sent' }, records: { device: false, remote: 'not-sent' } } };
  }
  function emit(r) {
    var k = stateKey(r.account, r.kind || 'records', targetOf(r)), shown = states.get(k);
    if(shown && shown.localRevision > r.localRevision) return;
    states.set(k, r);
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
    return res && !res.error && (res.status == null || Number(res.status) >= 200 && Number(res.status) < 300) && !res.omittedFields?.length && Array.isArray(res.data) && res.data.length === 1 && String(res.data[0].id) === entry.target && (entry.kind === 'users' ? res.data[0].id === entry.account : res.data[0].user_id === entry.account) && Object.keys(entry.payload).every(function (k) { return equal(entry.payload[k], res.data[0][k], k); });
  }
  function classify(res) {
    var e = res && res.error || {}, status = Number(res && res.status || e.status), code = String(e.code || '');
    if (status === 401 || code === 'PGRST301' || code === 'PGRST303') return ['reauth', 'authentication', 'reauth'];
    if (status === 403 && /JWT|token.*(expired|invalid)|authentication/i.test(String(e.message || ''))) return ['reauth', 'authentication', 'reauth'];
    if (status === 403) return ['rejected', 'permission', 'rejected'];
    if (res && res.omittedFields?.length) return ['local', 'schema-omission', 'unconfirmed'];
    if (status === 429 || status >= 500) return ['local', 'temporary', 'temporary'];
    if (status >= 400 || res && res.error) return ['rejected', status === 413 ? 'too-large' : 'invalid-data', 'rejected'];
    return ['local', 'unconfirmed', 'unconfirmed'];
  }
  function settings(d) {
    var cfg = (d.current() && d.current().settings && d.current().settings.saveSync) || {};
    return { timeoutMs: Math.min(60000, Math.max(20, Number(cfg.timeoutMs) || 12000)), retryMs: Math.min(300000, Math.max(100, Number(cfg.retryMs) || 10000)), maxAttempts: Math.min(8, Math.max(1, Number(cfg.maxAttempts) || 4)) };
  }
  async function sendOne(d, profile, entry, r) {
    var uid = profile.id, token = stateKey(uid, entry.kind, entry.target);
    if (active.has(token)) return active.get(token).then(function(){return r;});
    var task = g.navigator.locks.request('ourgoal-send-' + uid, async function () {
      if (!isCurrent(d, profile)) return r;
      var pendingNow = bucket(read(d.store, uid), entry.kind).entries[entry.target];
      if (!pendingNow || pendingNow.changeId !== entry.changeId || pendingNow.generation !== entry.generation) return r;
      if(d.isGuest && d.isGuest()) { r.state='local'; r.reason='guest-not-sent'; r.types[entry.kind].remote='not-sent'; emit(r); return r; }
      var auth;
      try { auth = await d.session(); } catch (_) { auth = null; }
      if (!isCurrent(d, profile)) return r;
      if (!auth || auth.id !== uid) { r.state = 'reauth'; r.reason = 'authentication'; r.types[entry.kind].remote = 'reauth'; emit(r); return r; }
      var cfg = settings(d), controller = new AbortController(), timer;
      controllers.set(token, { controller: controller, current: function(){ return isCurrent(d, profile); } });
      r.state = 'sending'; r.reason = ''; r.types[entry.kind].remote = 'unconfirmed'; emit(r);
      var operation = Promise.resolve().then(function () { return d.send(copy(entry.payload), controller.signal, entry.kind); });
      var timed = new Promise(function (resolve) { timer = setTimeout(function () { controller.abort(); resolve({ timeout: true }); }, cfg.timeoutMs); });
      var res;
      try { res = await Promise.race([operation, timed]); } catch (_) { res = { transportFailure: true }; }
      clearTimeout(timer);
      if (!isCurrent(d, profile)) { controller.abort(); return r; }
      // A late response cannot settle the next generation; timeout never means rollback.
      var outcome = res && (res.timeout || res.transportFailure) ? ['local', res.timeout ? 'unconfirmed' : 'temporary', res.timeout ? 'unconfirmed' : 'temporary'] : (confirmed(entry, res) ? ['confirmed', '', 'confirmed'] : classify(res));
      await lock(uid, function () {
        var before = d.store.getItem(key(uid)), q = read(d.store, uid), b = bucket(q, entry.kind), live = b.entries[entry.target];
        if (!live || live.changeId !== entry.changeId || live.generation !== entry.generation) return;
        live.attempts += 1; live.lastFailure = outcome[0] === 'confirmed' ? null : outcome[1];
        if (outcome[0] === 'confirmed') { b.confirmed[entry.target] = live.payload; delete b.entries[entry.target]; }
        write(d.store, key(uid), q, before);
        if (!isCurrent(d, profile)) return;
        var latest = states.get(token);
        var targetResult = latest && latest.changeId === entry.changeId && latest.generation === entry.generation ? latest : r;
        targetResult.state = outcome[0]; targetResult.reason = outcome[1]; targetResult.types[entry.kind].remote = outcome[2];
        if(res && res.omittedFields) targetResult.omittedFields = res.omittedFields.slice();
        emit(targetResult);
      });
      return r;
    }).catch(function () { if (isCurrent(d, profile)) { r.state = 'local'; r.reason = 'unconfirmed'; emit(r); } return r; }).finally(function () { active.delete(token); controllers.delete(token); });
    active.set(token, task); return task;
  }
  async function retry(d, manual) {
    observe(d);
    var profile = d.current(); if (!profile) return [];
    var q;
    try { q = read(d.store, profile.id); } catch (_) {var invalid=result(profile.id,'');invalid.reason='pending-integrity';return [invalid];}
    try {
      await lock(profile.id, function(){
        if(!isCurrent(d, profile)) return;
        q = read(d.store, profile.id);
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
        Object.keys(q.kindData || {}).forEach(function(kind){
          var entries = bucket(q,kind).entries, backup = 'ourgoal_' + (kind === 'users' ? 'profile' : kind) + '_backup_' + profile.id;
          var rawBefore = d.store.getItem(backup);
          if(kind === 'users'){
            var user = entries[profile.id];
            if(user && rawBefore === null) write(d.store,backup,d.fromRow(user.payload,kind),null);
          }else{
            var list = rawBefore === null ? [] : JSON.parse(rawBefore);
            if(!Array.isArray(list)) throw new Error('data-integrity');
            var changed = false;
            Object.keys(entries).forEach(function(id){if(!list.some(function(x){return x && String(x.id) === id;})){list.push(d.fromRow(entries[id].payload,kind));changed=true;}});
            if(changed && d.keep(kind,profile.id,list,d.store) !== true) throw new Error('recovery-unverified');
          }
        });
      });
    } catch (_) {var recovery=result(profile.id,'');recovery.reason='recovery-unverified';return [recovery];}
    var cfg = settings(d);
    var pending = ['records'].concat(Object.keys(q.kindData || {})).flatMap(function(kind){return Object.values(bucket(q,kind).entries);});
    return Promise.all(pending.map(function (e) {
      var r = states.get(stateKey(profile.id,e.kind,e.target)) || result(profile.id,e.target,e.kind);
      r.generation = e.generation; r.changeId = e.changeId; r.types[e.kind].device = true;
      if (e.lastFailure === 'permission' || e.lastFailure === 'invalid-data' || e.lastFailure === 'too-large') {r.state='rejected';r.reason=e.lastFailure;r.types[e.kind].remote='rejected';return r;}
      r.state='local';
      if (e.lastFailure === 'schema-omission' || !manual && e.attempts >= cfg.maxAttempts) {r.reason=e.lastFailure || 'unconfirmed';return r;}
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
    options = options || {}; var profile = d.current(), uid = profile && profile.id, kind = options.kind || 'records', id = String(options.targetId || options.recordId || (kind === 'users' ? uid : '') || '');
    var r = result(uid, id, kind);
    if (!uid || !id) return r;
    if(['records','users','goals'].indexOf(kind) < 0 || kind === 'users' && id !== uid
      || kind !== 'records' && options.operation && ['create','update'].indexOf(options.operation) < 0) {r.reason='invalid-kind-target-or-operation';return r;}
    if(['__proto__','constructor','prototype'].indexOf(id) >= 0){ r.reason='invalid-target'; return r; }
    try {
      await lock(uid, function () {
        if (!isCurrent(d, profile)) throw new Error('account-changed');
        var before = d.store.getItem(key(uid)), q = read(d.store, uid), b = bucket(q, kind);
        var rec = kind === 'users' ? profile : (profile[kind] || []).find(function (x) { return String(x.id) === id; });
        if (!rec || !d.owned(rec, uid, kind)) throw new Error('owner-mismatch');
        var payload = d.row(rec, uid, kind);
        if(!payloadOwn(kind,payload,id,uid)) throw new Error('payload-owner-mismatch');
        var snapshot = copy(profile);
        try { persist(d, snapshot); r.photoStored = true; }
        catch (error) {
          if (kind !== 'records' || !rec.photo || !/quota|exceed|storage.*full/i.test(String(error && error.message))) throw error;
          persist(d, withoutNewPhoto(snapshot, id)); r.photoStored = false; r.reason = 'photo-missing';
        }
        var prev = b.entries[id];
        // Local-only feedback/photo changes do not create an extra remote write.
        var already = !prev && b.confirmed[id] && equal(payload, b.confirmed[id], '') && equal(b.confirmed[id], payload, '');
        if (!already && (!prev || !equal(payload, prev.payload, '') || !equal(prev.payload, payload, ''))) {
          b.versions[id] = (b.versions[id] || 0) + 1;
          if(!Number.isSafeInteger(b.versions[id])) throw new Error('pending-generation-overflow');
          b.entries[id] = { changeId: d.newId(), generation: b.versions[id], account: uid, kind: kind, operation: options.operation || 'update', target: id, payload: payload, knownServerState: null, createdAt: new Date().toISOString(), attempts: 0, lastFailure: null };
        }
        write(d.store, key(uid), q, before);
        r.generation = b.versions[id]; r.changeId = b.entries[id] ? b.entries[id].changeId : null;
        r.state = already ? 'confirmed' : 'local'; if (r.photoStored) r.reason = already ? '' : 'queued';
        if(already) r.types[kind].remote = 'confirmed';
        Object.keys(r.types).forEach(function (kind) { r.types[kind].device = true; });
      });
      emit(r); observe(d);
      if(options.focus && kind === 'records') focused = {account:uid, recordId:id};
      var entry = bucket(read(d.store, uid), kind).entries[id];
      r.whenSettled = entry ? sendOne(d, profile, entry, r) : Promise.resolve(r);
      return r;
    } catch (e) { r.reason = String(e && e.message || 'device-unverified'); emit(r); return r; }
  }
  function message(r, action) {
    if (!r || r.state === 'failed') return '저장하지 못했어요. 입력을 그대로 남겨 두었어요.';
    var words = { confirmed: '반영됐어요', sending: '올리는 중이에요', local: '기기에 보관했어요. 올라간 것은 아직 확인되지 않았어요', reauth: '기기에 보관했어요. 다시 로그인하면 올라가요', rejected: '기기에 보관했지만 올리지 못했어요' };
    return (action ? action + ' · ' : '') + words[r.state] + (r.photoStored === false ? ' · 사진은 보관하지 못했어요. 다시 붙여 주세요.' : '');
  }
  var api = { save: save, retry: retry, pending: pending, message: message, focused: function(uid,id){return !!focused && focused.account === uid && focused.recordId === id;}, status: function (uid, id, kind) { return states.get(stateKey(uid,kind || 'records',id)) || null; }, equal: equal, read: read };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (g.OurgoalCapabilities) {
    var localMeta = { cell: 'core/device-save', description: 'DIR006 기기 확인과 계정별 미확정 자료', sideEffect: 'server' };
    var readMeta = { cell: 'core/device-save', description: 'DIR006 자료 종류별 저장 상태', sideEffect: 'none' };
    g.OurgoalCapabilities.provide('storage.device.save', api.save, localMeta);
    g.OurgoalCapabilities.provide('storage.device.retry', api.retry, localMeta);
    g.OurgoalCapabilities.provide('storage.device.message', api.message, readMeta);
    g.OurgoalCapabilities.provide('storage.device.status', api.status, readMeta);
    g.OurgoalCapabilities.provide('storage.device.pending', api.pending, readMeta);
    g.OurgoalCapabilities.provide('storage.device.focused', api.focused, readMeta);
  }
})(typeof window !== 'undefined' ? window : globalThis);
