/**
 * OurGoal Community Cell: DM·동반자 서버 원장 통로 (#TASK-ES-366 · 노션 COMM-03·COMM-04)
 *
 * 왜 따로 두나: js/team-invite-comm.js(4131줄, 모듈 가드 기준선)가 서버와 주고받는 세 군데가 실서버에서 조용히 끊겨 있었다.
 *   ① 동반자 저장·불러오기(/api/track sync_companions)가 로그인 토큰 없이 나가 401 — 다른 기기에서 목록이 비었다.
 *   ② DM 메시지 insert 가 운영 표에 없는 열(status·sent_at·delivered_at·read_at·is_read)을 넣어 PGRST204 로 통째 실패 — 상대에게 0건.
 *   ③ 읽음 표시(markDmThreadAsRead)는 정의만 있고 부르는 곳이 없었다.
 * 이 세포는 그 통로만 맡는다(화면은 그리지 않는다). 큰 세포는 global.OurgoalDmLedger 의 함수만 부른다.
 */
(function(global) {
  'use strict';

  /* 운영 표에 아직 없을 수 있는 열 — docs/sql/2026-10-04-dm-read-columns.sql 적용 전에는 이 열을 빼고 다시 넣는다 */
  var OPTIONAL_REPLY_COLUMNS = ['status', 'sent_at', 'delivered_at', 'read_at', 'is_read'];
  /* 동반자 사본에서 빼는 대화 흔적 — DM 본문이 localStorage·서버 events 원장에 복제되지 않게, '서버에서 이미 불러옴' 표식이 다른 기기·새로고침에 남지 않게 */
  var TRANSIENT_COMPANION_KEYS = ['lastMsg', 'lastTime', 'isUnread'];

  async function getAuthToken() {
    try {
      if (typeof global.getSupabaseAuthToken === 'function') {
        var t = await global.getSupabaseAuthToken();
        if (t) return t;
      }
      var sb = global.sb;
      if (sb && sb.auth && typeof sb.auth.getSession === 'function') {
        var s = await sb.auth.getSession();
        return (s && s.data && s.data.session && s.data.session.access_token) || null;
      }
    } catch (e) {}
    return null;
  }

  /* /api/track 은 본인 토큰이 있어야 동반자를 읽고 쓴다(api/track.js authenticateCaller). 토큰이 없으면 보내지 않고 null */
  async function trackPost(body) {
    if (typeof fetch === 'undefined') return null;
    var token = await getAuthToken();
    if (!token) return null;
    return fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(body)
    });
  }

  function storageCopy(list) {
    if (!Array.isArray(list)) return [];
    return list.map(function(c) {
      if (!c || typeof c !== 'object') return c;
      var out = {};
      Object.keys(c).forEach(function(k) {
        if (k.charAt(0) === '_' || TRANSIENT_COMPANION_KEYS.indexOf(k) !== -1) return;
        out[k] = c[k];
      });
      return out;
    });
  }

  function isMissingColumnError(err) {
    if (!err) return false;
    var msg = String(err.message || '') + ' ' + String(err.details || '');
    return err.code === 'PGRST204' || err.code === '42703' || /column/i.test(msg);
  }

  /* DM 한 건 저장. 운영 표에 상태 열이 없으면 그 열만 빼고 다시 넣어 메시지 자체는 반드시 도착시킨다.
   * 돌려주는 값: { ok, error, withoutStatusColumns } — supabase-js 는 실패를 throw 하지 않고 error 로 돌려준다 */
  async function insertReply(sb, payload) {
    if (!sb || typeof sb.from !== 'function') return { ok: false, error: 'no client' };
    var first = await sb.from('team_ping_replies').insert(payload);
    if (!first || !first.error) return { ok: true, error: null, withoutStatusColumns: false };
    if (!isMissingColumnError(first.error)) return { ok: false, error: first.error.message || String(first.error) };
    var base = {};
    Object.keys(payload).forEach(function(k) { if (OPTIONAL_REPLY_COLUMNS.indexOf(k) === -1) base[k] = payload[k]; });
    var second = await sb.from('team_ping_replies').insert(base);
    if (second && second.error) return { ok: false, error: second.error.message || String(second.error) };
    return { ok: true, error: null, withoutStatusColumns: true };
  }

  /* 받는 사람이 대화를 열었을 때 그 대화의 받은 메시지를 읽음으로. 먼저 서버 함수 og_dm_mark(받는 사람 본인 행만, 읽음 열만 바꿈),
   * 그 함수가 아직 없으면 직접 update(운영 RLS·열이 허용할 때만 반영). 돌려주는 값: { ok, rows, via, error } */
  async function markThreadRead(sb, myId, threadId) {
    if (!sb || !myId || !threadId) return { ok: false, rows: 0, via: null, error: 'missing args' };
    if (typeof sb.rpc === 'function') {
      var r = await sb.rpc('og_dm_mark', { p_ping_id: threadId, p_read: true });
      if (r && !r.error) return { ok: true, rows: Number(r.data) || 0, via: 'rpc', error: null };
    }
    var nowIso = new Date().toISOString();
    var u = await sb.from('team_ping_replies')
      .update({ is_read: true, status: 'read', read_at: nowIso })
      .eq('ping_id', threadId)
      .eq('receiver_id', myId)
      .not('is_read', 'is', true)
      .select('id');
    if (u && u.error) return { ok: false, rows: 0, via: 'update', error: u.error.message || String(u.error) };
    return { ok: true, rows: (u && Array.isArray(u.data)) ? u.data.length : 0, via: 'update', error: null };
  }

  /* 받는 기기가 메시지를 서버에서 받아 왔을 때 '도착' 시각을 남긴다(서버 함수가 있을 때만). 보낸 쪽이 도착을 지어내지 않게 */
  async function markThreadDelivered(sb, threadId) {
    if (!sb || !threadId || typeof sb.rpc !== 'function') return { ok: false };
    var r = await sb.rpc('og_dm_mark', { p_ping_id: threadId, p_read: false });
    return { ok: !!(r && !r.error) };
  }

  var OurgoalDmLedger = {
    id: 'comm/dm-ledger',
    getAuthToken: getAuthToken,
    trackPost: trackPost,
    storageCopy: storageCopy,
    isMissingColumnError: isMissingColumnError,
    insertReply: insertReply,
    markThreadRead: markThreadRead,
    markThreadDelivered: markThreadDelivered,
    OPTIONAL_REPLY_COLUMNS: OPTIONAL_REPLY_COLUMNS
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalDmLedger;
  }
  global.OurgoalDmLedger = OurgoalDmLedger;
})(typeof window !== 'undefined' ? window : globalThis);
