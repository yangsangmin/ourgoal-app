/* [#TASK-ES-365] CORE-09 계정 전환 격리 — 이 기기에 남은 로컬 사본은 "그 사본의 주인 uid" 에게만 돌려준다.
 * 원인(2026-10-04 실계정 RA-CORE-SWITCH 실패): loadProfile·부팅 게스트 복구가 자기 백업이 비어 있으면
 * localStorage 의 다른 사람 백업(ourgoal_records_backup_<다른 uid> 등)을 아무거나 골라 새 계정에 붙이고 서버에도 올렸다.
 * 규칙:
 *   1. 사용자별 백업 키(<접두사><uid>)는 정확히 그 uid 로만 읽는다. 다른 uid 키를 훑어 "빌려오는" 경로는 없다.
 *   2. 전체 사본(ourgoal_guest_profile)은 게스트 id 일 때만 다른 계정으로 이관한다(게스트 -> 회원 1회 이관, #TASK-ES-224).
 *      로그인 사용자의 사본이 남아 있으면 다른 계정으로 옮기지 않고 버린다.
 *   3. 로그아웃·계정 전환 때는 계정 공용 키(전체 사본·직전 사용자 표시·uid 없는 오프라인 대기열)만 지운다. uid 별 백업은 그 주인만 읽으므로 남긴다
 *      (서버에 아직 못 올린 기록이 그 주인에게 돌아갈 길을 끊지 않는다). 서버 원장은 건드리지 않는다.
 *   4. 서버로 올리는 기록은 주인 표시(user_id·ownerUid)가 현재 uid 와 다른 것을 뺀다. */
(function (root) {
  'use strict';

  var GUEST_PROFILE_KEY = 'ourgoal_guest_profile';
  var SHARED_SESSION_KEYS = ['ourgoal_guest_profile', 'ourgoal_current_user', 'ourgoal_offline_sync_queue'];

  function isGuestId(id) {
    return typeof id === 'string' && id.indexOf('guest') === 0;
  }

  function sameOwner(a, b) {
    return a !== undefined && a !== null && b !== undefined && b !== null && String(a) === String(b);
  }

  function getStore(store) {
    if (store) return store;
    try { if (typeof localStorage !== 'undefined') return localStorage; } catch (e) {}
    return null;
  }

  /* <접두사><uid> 키 하나만 읽는다. 없거나 깨졌으면 fallback. */
  function readOwnCopy(prefix, uid, fallback, store) {
    var st = getStore(store);
    if (!st || uid === undefined || uid === null || uid === '') return fallback;
    try {
      var raw = st.getItem(prefix + uid);
      if (raw === null || raw === undefined) return fallback;
      var v = JSON.parse(raw);
      return (v === null || v === undefined) ? fallback : v;
    } catch (e) { return fallback; }
  }

  /* 전체 사본을 targetUid 로 이관해도 되는가: 게스트가 만든 사본이고 대상과 다른 id 일 때만 */
  function canMigrateGuestCopy(copy, targetUid) {
    return !!copy && isGuestId(copy.id) && !sameOwner(copy.id, targetUid);
  }

  /* 전체 사본의 주인이 지금 들어오는 uid 와 다른 로그인 사용자면 지운다. 지웠으면 true */
  function dropForeignSessionCopy(targetUid, store) {
    var st = getStore(store);
    if (!st) return false;
    try {
      var raw = st.getItem(GUEST_PROFILE_KEY);
      if (!raw) return false;
      var copy = null;
      try { copy = JSON.parse(raw); } catch (e) { copy = null; }
      if (copy && (isGuestId(copy.id) || sameOwner(copy.id, targetUid))) return false;
      st.removeItem(GUEST_PROFILE_KEY);
      return true;
    } catch (e) { return false; }
  }

  /* 로그아웃 때 계정 공용 키를 지운다. 지운 키 이름 목록을 돌려준다 */
  function clearSharedSessionCopies(store) {
    var st = getStore(store);
    var removed = [];
    if (!st) return removed;
    SHARED_SESSION_KEYS.forEach(function (k) {
      try {
        if (st.getItem(k) !== null) { st.removeItem(k); removed.push(k); }
      } catch (e) {}
    });
    return removed;
  }

  /* 서버로 올릴 기록 중 다른 사람 표시가 붙은 것을 뺀다 */
  function ownRecordsOnly(records, uid) {
    return (Array.isArray(records) ? records : []).filter(function (r) {
      if (!r) return false;
      var owner = (r.user_id !== undefined && r.user_id !== null) ? r.user_id : r.ownerUid;
      if (owner === undefined || owner === null || owner === '') return true;
      return sameOwner(owner, uid);
    });
  }

  /* 서버 응답이 지금 화면 주인의 것인가(응답에 주인 id 가 있고 다르면 false) */
  function isResponseForUid(responseUid, uid) {
    if (responseUid === undefined || responseUid === null || responseUid === '') return true;
    return sameOwner(responseUid, uid);
  }

  var api = {
    GUEST_PROFILE_KEY: GUEST_PROFILE_KEY,
    SHARED_SESSION_KEYS: SHARED_SESSION_KEYS,
    isGuestId: isGuestId,
    readOwnCopy: readOwnCopy,
    canMigrateGuestCopy: canMigrateGuestCopy,
    dropForeignSessionCopy: dropForeignSessionCopy,
    clearSharedSessionCopies: clearSharedSessionCopies,
    ownRecordsOnly: ownRecordsOnly,
    isResponseForUid: isResponseForUid
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.OurgoalAccountIsolation = api;
})(typeof window !== 'undefined' ? window : null);
