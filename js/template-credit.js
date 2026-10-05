/*
 * 아워골 — 템플릿 복제 크레딧 (KF-2 #TASK-ES-017, E3)
 *
 * 규격: 「아워골 수익화 모델(정립/구현)」 §1·§2·§3, KF-2 요구사항정의서 v2.
 *   - 복제 수는 서버 실데이터(template_copies)만 표시한다. 값이 없거나 0이면 아무 숫자도 보이지 않는다.
 *   - 원작자 크레딧 구간 판정·적립은 서버 RPC(record_template_copy) 안에서만. 클라이언트는 결과만 본다.
 *   - 광고는 없다(#TASK-ES-516, 상민님 결정 2026-10-06).
 *   - 화면에 돈을 연상시키는 문구를 쓰지 않는다. 크레딧은 앱 안에서만 쓰인다.
 *
 * 서버가 아직 준비되지 않았을 때(테이블·RPC 없음: PGRST202/205, 42P01, 404)는 전부 조용히 실패하고
 * 복제 자체는 기존대로 동작한다. 오류 토스트를 띄우지 않는다.
 *
 * 사용(index.html 이 부팅 마지막에 init 으로 앱 핸들을 넘긴다):
 *   OurgoalTemplateCredit.init({ sb, getState, toast })
 *   OurgoalTemplateCredit.recordCopy(templateId, ownerUserId)   → Promise<{count,recorded,awarded}|null>
 *   OurgoalTemplateCredit.counts(templateIds)                   → Promise<object|null>  (id → 복제 수)
 *   OurgoalTemplateCredit.fillCounts(rootEl)                    → [data-tplcount] 배지를 서버값으로 채운다
 */
(function (global) {
  'use strict';

  var deps = null;
  var serverOk = null;          /* null=모름, true=RPC 응답 확인, false=스키마 없음(이 세션 동안 호출 중단) */
  var countCache = {};

  function init(d) {
    deps = d || {};
    /* 공용 크레딧 모듈(js/credits.js)은 window.sb 를 찾는다. 앱의 sb 는 IIFE 안에 있어 여기서 한 번 노출한다. */
    if (deps.sb && !global.sb) { try { global.sb = deps.sb; } catch (e) { /* noop */ } }
  }

  function missingSchema(err) {
    if (!err) return false;
    var code = String(err.code || '');
    var msg = String(err.message || '');
    return code === 'PGRST202' || code === 'PGRST205' || code === '42P01' || code === '404' ||
      /Could not find the (function|table)/i.test(msg) || /does not exist/i.test(msg);
  }

  function quiet(err) {
    if (global.console && global.console.debug && err) {
      try { global.console.debug('[template-credit] 조용히 실패:', err.message || err.code || err); } catch (e) { /* noop */ }
    }
    return null;
  }

  function rpc(name, args) {
    if (!deps || !deps.sb || typeof deps.sb.rpc !== 'function' || serverOk === false) return Promise.resolve(null);
    var p;
    try { p = deps.sb.rpc(name, args || {}); } catch (e) { return Promise.resolve(quiet(e)); }
    return Promise.resolve(p).then(function (res) {
      if (!res || res.error) {
        if (res && missingSchema(res.error)) serverOk = false;
        return quiet(res && res.error);
      }
      serverOk = true;
      return res.data;
    }).catch(function (e) { return quiet(e); });
  }

  function currentUserId() {
    var st = deps && typeof deps.getState === 'function' ? deps.getState() : null;
    if (!st) return null;
    return (st.profile && st.profile.id) || (st.user && st.user.id) || null;
  }

  /* 복제 직후 호출. 서버가 세고, 구간에 닿으면 원작자에게 적립한다(설정값 null 이면 0). */
  function recordCopy(templateId, ownerUserId) {
    if (!templateId) return Promise.resolve(null);
    if (!currentUserId()) return Promise.resolve(null); /* 로그인 전 로컬 복제는 세지 않는다 */
    return rpc('record_template_copy', {
      p_template_id: String(templateId),
      p_owner_user_id: ownerUserId ? String(ownerUserId) : null
    }).then(function (d) {
      if (d && typeof d === 'object' && typeof d.count === 'number') countCache[String(templateId)] = d.count;
      return d && typeof d === 'object' ? d : null;
    });
  }

  function counts(templateIds) {
    var ids = (templateIds || []).map(String).filter(Boolean);
    if (!ids.length) return Promise.resolve({});
    return rpc('template_copy_counts', { p_template_ids: ids }).then(function (rows) {
      if (!Array.isArray(rows)) return null;
      var map = {};
      rows.forEach(function (r) { if (r && r.template_id) map[String(r.template_id)] = Number(r.copies) || 0; });
      ids.forEach(function (id) { if (!(id in map)) map[id] = 0; countCache[id] = map[id]; });
      return map;
    });
  }

  function badgeText(n) {
    return '📥 ' + Number(n).toLocaleString('ko-KR') + '회 복제';
  }

  /* [data-tplcount="id"] 요소를 서버 집계로 채운다. 값 없음·0 → 그대로 숨김(위조·추정 숫자 금지) */
  function fillCounts(root) {
    var scope = root || (global.document ? global.document : null);
    if (!scope || typeof scope.querySelectorAll !== 'function') return Promise.resolve(false);
    var els = Array.prototype.slice.call(scope.querySelectorAll('[data-tplcount]'));
    if (!els.length) return Promise.resolve(false);
    var ids = [];
    els.forEach(function (el) { var id = el.getAttribute('data-tplcount'); if (id && ids.indexOf(id) < 0) ids.push(id); });
    return counts(ids).then(function (map) {
      if (!map) return false;
      els.forEach(function (el) {
        var id = el.getAttribute('data-tplcount');
        var n = map[id];
        if (typeof n === 'number' && n > 0) {
          el.textContent = badgeText(n);
          el.style.display = '';
        } else {
          el.textContent = '';
          el.style.display = 'none';
        }
      });
      return true;
    });
  }

  global.OurgoalTemplateCredit = {
    init: init,
    recordCopy: recordCopy,
    counts: counts,
    fillCounts: fillCounts,
    badgeText: badgeText,
    _reset: function () { serverOk = null; countCache = {}; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
