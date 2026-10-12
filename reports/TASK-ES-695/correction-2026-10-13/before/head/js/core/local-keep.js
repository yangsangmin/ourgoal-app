/* [#TASK-ES-695] 기기 보관(local keep) — 지시함 DIR-006 묶음 P0(저장 · 동기화 계약 1절)
 * 다시 열 때(loadProfile) 기기 백업(ourgoal_records_backup_<uid> · ourgoal_goals_backup_<uid>)을 서버에서 받은 것으로 덮어쓰기 **전에**
 *   (i)   서버가 주지 않는 칸(사진 · 피드백 · 에너지 · 집중 · 노션 구조 · 테마 부가정보 등)을 같은 계정 · 같은 id 의 기기 값에서 되붙인다.
 *         서버가 준 칸은 기기의 옛 값으로 덮지 않는다. 본문이 달라진 기록에는 옛 피드백 · 구조를 되붙이지 않는다.
 *   (ii)  기기에만 있고 서버 응답에 없는 기록 · 목표는 지우지 않고 보관 열쇠(ourgoal_records_kept_<uid> · ourgoal_goals_kept_<uid>)로 옮긴다.
 *         올리지 않는다. 화면에 내놓지 않는다. 코드는 보관 항목을 지우지 않는다(지우는 규칙은 상민님 결심 대기).
 *   (iii) 덮어쓰기 직전의 백업 글자를 그대로 한 세대 남긴다(ourgoal_records_prev_<uid> · ourgoal_goals_prev_<uid> — 되돌리기용).
 * 쓰는 순서는 보관 → 직전 사본 → 백업이고, 앞의 것을 되읽어 같을 때만 다음으로 간다. 하나라도 확인되지 않으면 원래 백업을 건드리지 않는다.
 * 숨겨서 보관하는 것은 되찾을 재료를 남기는 것이다 — 「쓸 수 있다」 「저장이 안전하다」가 아니다.
 * 서버에는 아무것도 묻지 않고 올리지 않는다. 브라우저(window.OurgoalLocalKeep)와 시험(require)이 같은 규칙을 쓴다. */
(function (root) {
  'use strict';

  var BACKUP_PREFIX = { records: 'ourgoal_records_backup_', goals: 'ourgoal_goals_backup_' };
  var PREV_PREFIX = { records: 'ourgoal_records_prev_', goals: 'ourgoal_goals_prev_' };
  var KEPT_PREFIX = { records: 'ourgoal_records_kept_', goals: 'ourgoal_goals_kept_' };
  var TRASH_PREFIX = 'ourgoal_trash_backup_';
  var TRASH_TYPE = { records: 'record', goals: 'goal' };
  var KEPT_VERSION = 1;

  /* 서버에서 받은 행으로 loadProfile 이 만드는 기록의 칸(js/core/profile-load.js 의 기록 변환 + js/record-ledger.js META_FIELDS).
     이 칸들은 서버가 준 값이 정본이다 — 비어 있어도 기기 값으로 채우지 않는다. 이 밖의 칸이 「서버가 주지 않는 칸」이다. */
  var SERVER_RECORD_KEYS = ['id', 'type', 'text', 'startAt', 'endAt', 'createdAt', 'category', 'theme', 'subTheme', 'themeConfidence',
    'goalId', 'laps', 'durationMs', 'durationMinutes', 'visibility', 'isSample', 'title'];
  /* 본문에 딸린 칸 — 본문이 달라진 기록에는 되붙이지 않는다(옛 본문에 대한 피드백 · 구조) */
  var TEXT_BOUND_KEYS = ['feedback', 'notionDb', 'structured'];
  var WHY = { NOT_IN_RESPONSE: 'not-in-server-response', TEXT_DIFFERS: 'text-differs', MISSING_IN_BACKUP: 'missing-in-backup', UNREADABLE: 'unreadable-backup' };

  /* 보관을 확인하지 못해(용량 초과 등) 백업에 그대로 둬야 하는 「기기에만 있는 것」. 이 실행 동안만 기억한다(다음 실행의 loadProfile 이 백업에서 다시 찾는다). */
  var held = { records: {}, goals: {} };
  var last = { records: null, goals: null, notes: [] };
  /* 삼키지 않는다: 기기 저장소가 낸 오류는 자리와 글을 적어 둔다(status 로 본다). 화면에는 내놓지 않는다(P0 는 화면을 바꾸지 않는다) */
  function note(where, e) { if (last.notes.length < 20) last.notes.push({ where: where, error: String((e && (e.name || e.message)) || e) }); }

  function getStore(store) {
    if (store) return store;
    try { if (typeof localStorage !== 'undefined') return localStorage; } catch (e) { note('getStore', e); }
    return null;
  }
  function has(v) { return v !== undefined && v !== null; }
  function inList(list, k) { return list.indexOf(k) !== -1; }
  function readRaw(st, key) { try { var v = st.getItem(key); return has(v) ? String(v) : null; } catch (e) { note('read:' + key.split('_').slice(0, 3).join('_'), e); return null; } }
  /* 글자 → 배열. 없으면 [], 배열이 아니거나 깨졌으면 null */
  function parseList(raw) {
    if (raw === null) return [];
    try { var v = JSON.parse(raw); return Array.isArray(v) ? v : null; } catch (e) { return null; }
  }
  /* 쓴 뒤 되읽어 글자가 같을 때만 true. 다르면 before(쓰기 전 글자, 없었으면 null)로 되돌려 놓는다 */
  function writeVerified(st, key, raw, before) {
    var ok = false;
    try { st.setItem(key, raw); ok = (readRaw(st, key) === raw); } catch (e) { ok = false; note('write:' + key.split('_').slice(0, 3).join('_'), e); }
    if (!ok) {
      try {
        if (readRaw(st, key) !== before) { if (before === null) st.removeItem(key); else st.setItem(key, before); }
      } catch (e2) { note('putBack:' + key.split('_').slice(0, 3).join('_'), e2); }
    }
    return ok;
  }
  /* 같은 내용을 두 번 보관하지 않기 위한 지문(FNV-1a 32비트 + 길이). 보안용이 아니다 */
  function fingerprint(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; }
    return h.toString(16) + ':' + s.length;
  }
  function entry(why, item) {
    var body = JSON.stringify(item);
    return { id: (item && has(item.id)) ? String(item.id) : null, why: why, keptAt: new Date().toISOString(), fp: fingerprint(why + '|' + body), item: item };
  }
  function ownerOk(item, uid) {
    var owner = has(item.user_id) ? item.user_id : item.ownerUid;
    return !has(owner) || owner === '' || String(owner) === String(uid);
  }
  function textOf(r) { return String(has(r.text) ? r.text : (has(r.content) ? r.content : '')); }
  function trashIds(st, kind, uid) {
    var out = {};
    try {
      var list = JSON.parse(readRaw(st, TRASH_PREFIX + uid) || '[]');
      (Array.isArray(list) ? list : []).forEach(function (t) { if (t && t.entityType === TRASH_TYPE[kind] && has(t.originalId)) out[String(t.originalId)] = true; });
    } catch (e) { note('trash', e); }
    return out;
  }

  /* ---------- 보관 열쇠 ---------- */
  function readKept(kind, uid, store) {
    var st = getStore(store);
    var empty = { v: KEPT_VERSION, items: [] };
    if (!st || !has(uid) || uid === '') return empty;
    var raw = readRaw(st, KEPT_PREFIX[kind] + uid);
    if (raw === null) return empty;
    try { var d = JSON.parse(raw); return (d && Array.isArray(d.items)) ? d : null; } catch (e) { note('kept-parse', e); return null; }
  }
  /* 보관 항목을 더한다(같은 지문은 한 번만). 쓴 뒤 되읽어 확인한다. 이미 있는 항목은 지우거나 바꾸지 않는다 */
  function addKept(st, kind, uid, adds) {
    if (!adds.length) return { ok: true, added: 0 };
    var key = KEPT_PREFIX[kind] + uid;
    var before = readRaw(st, key);
    var doc = readKept(kind, uid, st);
    if (!doc) return { ok: false, added: 0, why: 'kept-unreadable' }; /* 읽을 수 없는 보관 글자는 덮어쓰지 않는다 */
    var seen = {};
    doc.items.forEach(function (it) { if (it && it.fp) seen[it.fp] = true; });
    var added = 0;
    adds.forEach(function (a) { if (!seen[a.fp]) { seen[a.fp] = true; doc.items.push(a); added++; } });
    if (!added) return { ok: true, added: 0 };
    doc.v = KEPT_VERSION;
    return writeVerified(st, key, JSON.stringify(doc), before) ? { ok: true, added: added } : { ok: false, added: 0, why: 'kept-write' };
  }

  /* ---------- (i) 되붙이기 ---------- */
  function reattachRecord(rec, dev, textDiffers) {
    var n = 0;
    Object.keys(dev).forEach(function (k) {
      if (inList(SERVER_RECORD_KEYS, k)) return;            /* 서버가 준 칸은 덮지 않는다 */
      if (!has(dev[k])) return;
      if (has(rec[k])) return;
      if (textDiffers && inList(TEXT_BOUND_KEYS, k)) return; /* 본문이 달라졌으면 옛 피드백 · 구조는 되붙이지 않는다 */
      rec[k] = dev[k]; n++;
    });
    return n;
  }
  /* 본문이 달라진 기록의 기기 판: 본문과 본문에 딸린 칸만 추려 보관한다(되붙인 사진 등은 백업에 그대로 있으므로 겹쳐 두지 않는다) */
  function textBoundCopy(dev) {
    var o = { id: dev.id, text: textOf(dev) };
    TEXT_BOUND_KEYS.forEach(function (k) { if (has(dev[k])) o[k] = dev[k]; });
    return o;
  }

  /* 서버 기록에 기기 값을 되붙이고, 보관할 것을 고른다. 서버 기록 배열의 각 객체를 고쳐서 돌려준다(쓰기는 commit 이 한다) */
  function planRecords(uid, serverRecords, store) {
    var st = getStore(store);
    var out = { next: Array.isArray(serverRecords) ? serverRecords : [], adds: [], reattached: 0, prevRaw: null, unreadable: false };
    if (!st) return out;
    out.prevRaw = readRaw(st, BACKUP_PREFIX.records + uid);
    var devList = parseList(out.prevRaw);
    if (devList === null) { out.unreadable = true; out.adds.push(entry(WHY.UNREADABLE, { id: null, raw: out.prevRaw })); devList = []; }
    var byId = {};
    devList.forEach(function (d) { if (d && has(d.id) && ownerOk(d, uid) && !byId[String(d.id)]) byId[String(d.id)] = d; });
    var fromKept = {};
    var kept = readKept('records', uid, st);
    ((kept && kept.items) || []).forEach(function (it) {
      if (it && it.why === WHY.NOT_IN_RESPONSE && it.item && has(it.item.id) && ownerOk(it.item, uid)) fromKept[String(it.item.id)] = it.item;
    });
    var serverIds = {};
    out.next.forEach(function (rec) {
      if (!rec || !has(rec.id)) return;
      var id = String(rec.id);
      serverIds[id] = true;
      var dev = byId[id] || fromKept[id];
      if (!dev) return;
      var differs = textOf(dev) !== textOf(rec);
      out.reattached += reattachRecord(rec, dev, differs);
      if (differs && byId[id]) out.adds.push(entry(WHY.TEXT_DIFFERS, textBoundCopy(dev)));
    });
    var trashed = trashIds(st, 'records', uid);
    devList.forEach(function (d) {
      if (!d || typeof d !== 'object') return;
      if (has(d.id) && (serverIds[String(d.id)] || trashed[String(d.id)])) return; /* 서버에 있거나 휴지통에 든 것은 보관 대상이 아니다 */
      out.adds.push(entry(WHY.NOT_IN_RESPONSE, d));
    });
    return out;
  }
  function planGoals(uid, serverGoals, store) {
    var st = getStore(store);
    var out = { next: Array.isArray(serverGoals) ? serverGoals : [], adds: [], reattached: 0, prevRaw: null, unreadable: false };
    if (!st) return out;
    out.prevRaw = readRaw(st, BACKUP_PREFIX.goals + uid);
    var devList = parseList(out.prevRaw);
    if (devList === null) { out.unreadable = true; out.adds.push(entry(WHY.UNREADABLE, { id: null, raw: out.prevRaw })); devList = []; }
    var serverIds = {};
    out.next.forEach(function (g) { if (g && has(g.id)) serverIds[String(g.id)] = true; });
    var trashed = trashIds(st, 'goals', uid);
    devList.forEach(function (d) {
      if (!d || typeof d !== 'object') return;
      if (has(d.id) && (serverIds[String(d.id)] || trashed[String(d.id)])) return;
      out.adds.push(entry(WHY.NOT_IN_RESPONSE, d));
    });
    return out;
  }

  /* 직전 사본을 새 것으로 바꾸기 전에: 직전 사본에는 있는데 지금 백업의 같은 id 기록에서 빠진 「서버가 주지 않는 칸」을 보관할 항목으로 고른다.
     (이미 빠진 것이 있는 백업으로 직전 사본을 덮어 하나뿐인 사진을 잃지 않게 한다. 지금 백업에 없는 id 는 고르지 않는다 — 사용자가 지운 기록일 수 있다) */
  function missingFromPrev(st, uid, currentRaw) {
    var adds = [];
    var oldPrevRaw = readRaw(st, PREV_PREFIX.records + uid);
    if (oldPrevRaw === null || oldPrevRaw === currentRaw) return adds;
    var oldList = parseList(oldPrevRaw), cur = parseList(currentRaw);
    if (!oldList || !cur) return adds;
    var curById = {};
    cur.forEach(function (c) { if (c && has(c.id) && !curById[String(c.id)]) curById[String(c.id)] = c; });
    oldList.forEach(function (x) {
      if (!x || !has(x.id)) return;
      var y = curById[String(x.id)];
      if (!y) return;
      var miss = { id: x.id, text: textOf(x) }, n = 0;
      Object.keys(x).forEach(function (k) {
        if (inList(SERVER_RECORD_KEYS, k) || !has(x[k]) || has(y[k])) return;
        miss[k] = x[k]; n++;
      });
      if (n) adds.push(entry(WHY.MISSING_IN_BACKUP, miss));
    });
    return adds;
  }

  /* ---------- 보관 → 직전 사본 → 백업 (앞의 것을 되읽어 확인한 뒤에만 다음) ---------- */
  function commit(kind, uid, plan, store) {
    var st = getStore(store);
    var res = { kind: kind, ok: false, stage: 'no-store', reattached: plan.reattached, keptAdded: 0, prevWritten: false, backupWritten: false, held: 0 };
    if (!st) return res;
    var backupKey = BACKUP_PREFIX[kind] + uid, prevKey = PREV_PREFIX[kind] + uid;
    var prevRaw = plan.prevRaw;
    var nextRaw = JSON.stringify(plan.next);
    var adds = plan.adds;
    if (prevRaw === nextRaw && !adds.length) { delete held[kind][uid]; res.ok = true; res.stage = 'same'; return res; }
    if (kind === 'records' && prevRaw !== null && prevRaw !== nextRaw) adds = adds.concat(missingFromPrev(st, uid, prevRaw));
    /* 1) 보관 */
    var k = addKept(st, kind, uid, adds);
    if (!k.ok) {
      var keep = adds.filter(function (a) { return a.why === WHY.NOT_IN_RESPONSE && a.item && has(a.item.id); }).map(function (a) { return a.item; });
      if (keep.length) held[kind][uid] = keep; else delete held[kind][uid];
      res.held = keep.length; res.stage = 'kept-failed'; return res; /* 원래 백업은 그대로 */
    }
    delete held[kind][uid];
    res.keptAdded = k.added;
    if (prevRaw === nextRaw) { res.ok = true; res.stage = 'same'; return res; }
    /* 2) 직전 사본 — 덮어쓰기 직전의 백업 글자 그대로 */
    if (prevRaw !== null) {
      if (!writeVerified(st, prevKey, prevRaw, readRaw(st, prevKey))) { res.stage = 'prev-failed'; return res; } /* 원래 백업은 그대로 */
      res.prevWritten = true;
    }
    /* 3) 백업 */
    if (!writeVerified(st, backupKey, nextRaw, prevRaw)) { res.stage = 'backup-failed'; return res; }
    res.backupWritten = true; res.ok = true; res.stage = 'written';
    return res;
  }
  /* 확인하지 못해 원래 백업을 그대로 둔 경우를 콘솔에 남긴다(본문 없이 단계 이름만) */
  function warnIfLeft(res) {
    if (res && !res.ok && typeof console !== 'undefined' && console && typeof console.warn === 'function') console.warn('[OurgoalLocalKeep] ' + res.kind + ' 백업을 바꾸지 않았다 — ' + res.stage);
    return res;
  }

  /* loadProfile 이 부른다: 서버에서 받은 기록(1건 이상)으로 기기 백업을 바꾸는 자리. 화면에 쓸 기록(되붙인 것)을 돌려준다.
     어떤 오류가 나도 던지지 않는다 — 그때는 백업을 건드리지 않고 받은 기록을 그대로 돌려준다 */
  function commitServerRecords(uid, records, store) {
    var out = { records: records, result: null };
    try {
      var plan = planRecords(uid, records, store);
      out.records = plan.next;
      out.result = warnIfLeft(commit('records', uid, plan, store));
    } catch (e) { out.result = { kind: 'records', ok: false, stage: 'error', error: String(e && e.message || e) }; }
    last.records = out.result;
    return out;
  }
  function commitServerGoals(uid, goals, store) {
    var out = { goals: goals, result: null };
    try {
      var plan = planGoals(uid, goals, store);
      out.goals = plan.next;
      out.result = warnIfLeft(commit('goals', uid, plan, store));
    } catch (e) { out.result = { kind: 'goals', ok: false, stage: 'error', error: String(e && e.message || e) }; }
    last.goals = out.result;
    return out;
  }

  /* ---------- 다음 저장 · 수동 동기화 · 게스트 이관이 백업을 쓰는 자리 ---------- */
  /* 보관을 확인하지 못해 백업에 남겨 둬야 하는 것(held)을 쓸 배열 뒤에 붙인다. 없으면 받은 배열 그대로(같은 객체) */
  function withHeld(kind, uid, list) {
    var h = held[kind] && held[kind][uid];
    if (!h || !h.length || !Array.isArray(list)) return list;
    var ids = {};
    list.forEach(function (x) { if (x && has(x.id)) ids[String(x.id)] = true; });
    var extra = h.filter(function (x) { return x && has(x.id) && !ids[String(x.id)]; });
    return extra.length ? list.concat(extra) : list;
  }
  /* 직전 사본을 내려놓는다(자리가 모자라 백업 쓰기가 실패할 때만). 직전 사본에만 남은 칸이 있으면 먼저 보관하고, 보관을 확인하지 못하면 내려놓지 않는다 */
  function releasePrev(kind, uid, store) {
    var st = getStore(store);
    if (!st) return false;
    var prevKey = PREV_PREFIX[kind] + uid;
    if (readRaw(st, prevKey) === null) return false;
    if (kind === 'records') {
      var cur = readRaw(st, BACKUP_PREFIX.records + uid);
      var adds = cur === null ? [] : missingFromPrev(st, uid, cur);
      if (adds.length && !addKept(st, 'records', uid, adds).ok) return false;
    }
    try { st.removeItem(prevKey); return readRaw(st, prevKey) === null; } catch (e) { note('releasePrev', e); return false; }
  }
  /* saveProfile 이 부른다: 백업 쓰기. 실패하면(용량 초과) 직전 사본을 내려놓고 한 번 더 쓴다. 그래도 실패하면 원래처럼 던진다 */
  function setBackupFromSave(kind, uid, list, store) {
    var st = getStore(store);
    if (!st) throw new Error('no storage');
    var key = BACKUP_PREFIX[kind] + uid;
    var raw = JSON.stringify(withHeld(kind, uid, list));
    try { st.setItem(key, raw); }
    catch (e) {
      if (!releasePrev(kind, uid, st)) throw e;
      st.setItem(key, raw);
    }
  }

  /* ---------- (iii) 되돌리기: 직전 사본을 백업 자리로, 지금 백업을 직전 사본 자리로(맞바꿈 — 다시 부르면 원래대로) ---------- */
  function restorePrevious(kind, uid, store) {
    var st = getStore(store);
    var res = { kind: kind, ok: false, stage: 'no-store' };
    if (!st) return res;
    var backupKey = BACKUP_PREFIX[kind] + uid, prevKey = PREV_PREFIX[kind] + uid;
    var prevRaw = readRaw(st, prevKey), curRaw = readRaw(st, backupKey);
    if (prevRaw === null) { res.stage = 'no-previous'; return res; }
    if (!writeVerified(st, backupKey, prevRaw, curRaw)) { res.stage = 'backup-failed'; return res; }
    res.ok = true; res.stage = 'restored';
    if (curRaw !== null) res.swapped = writeVerified(st, prevKey, curRaw, prevRaw);
    return res;
  }

  /* 기기에 무엇이 있는지 세어 준다(본문은 내놓지 않는다) — 확인 · 증거용 */
  function status(uid, store) {
    var st = getStore(store), o = { uid: has(uid) ? String(uid) : null, records: null, goals: null };
    if (!st) return o;
    ['records', 'goals'].forEach(function (kind) {
      var b = readRaw(st, BACKUP_PREFIX[kind] + uid), p = readRaw(st, PREV_PREFIX[kind] + uid), kd = readKept(kind, uid, st);
      var bl = parseList(b), pl = parseList(p);
      o[kind] = { backup: b === null ? null : { chars: b.length, count: bl ? bl.length : null }, prev: p === null ? null : { chars: p.length, count: pl ? pl.length : null },
        kept: kd ? { count: kd.items.length, why: kd.items.reduce(function (a, it) { a[it.why] = (a[it.why] || 0) + 1; return a; }, {}) } : { unreadable: true },
        held: (held[kind][uid] || []).length, last: last[kind] };
    });
    o.notes = last.notes.slice();
    return o;
  }

  var api = {
    BACKUP_PREFIX: BACKUP_PREFIX, PREV_PREFIX: PREV_PREFIX, KEPT_PREFIX: KEPT_PREFIX, SERVER_RECORD_KEYS: SERVER_RECORD_KEYS, TEXT_BOUND_KEYS: TEXT_BOUND_KEYS, WHY: WHY,
    planRecords: planRecords, planGoals: planGoals, commit: commit,
    commitServerRecords: commitServerRecords, commitServerGoals: commitServerGoals,
    withHeld: withHeld, setBackupFromSave: setBackupFromSave, releasePrev: releasePrev,
    restorePrevious: restorePrevious, readKept: readKept, status: status
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.OurgoalLocalKeep = api;
})(typeof window !== 'undefined' ? window : null);
