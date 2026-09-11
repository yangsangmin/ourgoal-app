/*
 * 아워골 — 공용 크레딧 클라이언트 (#TASK-ES-015, INFRA)
 *
 * 규격: 「아워골 수익화 모델(정립/구현)」 §1·§2.
 *   - 크레딧은 앱 내 전용. 현금·상품권과 교환하지 않는다. 화면에 화폐 문구를 쓰지 않는다.
 *   - 원장은 서버 credit_ledger 하나. 이 파일은 로컬에 잔액을 저장하지 않는다.
 *   - 지급 규칙은 전부 서버 설정값(credit_settings). enabled=false 면 아무것도 하지 않는다.
 *   - 표시하는 숫자는 서버에서 방금 읽은 실데이터뿐. 조회에 실패하면 숨긴다(추정·위조 금지).
 *
 * 서버가 아직 준비되지 않았을 때(테이블·RPC 없음: PGRST202/205, 404)는 모든 함수가
 * 조용히 실패해 false / 0 / null 을 돌려준다. 호출 측(KF-2·KF-5·KF-7)은 반환값만 보면 된다.
 *
 * 사용:
 *   OurgoalCredits.isEnabled()                       → Promise<boolean>
 *   OurgoalCredits.policy()                          → Promise<object>   (설정값 전체, 1회 캐시)
 *   OurgoalCredits.award(eventType, refType, refId, idemKey) → Promise<number> (적립된 양, 0이면 미적립)
 *   OurgoalCredits.balance()                         → Promise<number|null> (null = 조회 실패)
 *   OurgoalCredits.renderSettingsSection(container)  → enabled 일 때만 컨테이너를 채운다
 */
(function (global) {
  'use strict';

  var policyCache = null;
  var policyPromise = null;

  function client() {
    return global.sb || null;
  }

  function flagOn() {
    var c = global.OURGOAL_CONFIG;
    return !!(c && c.ENABLE_CREDITS);
  }

  function quiet(err) {
    /* 테이블·RPC 부재(PGRST202/205), 미로그인, 네트워크 — 전부 "없는 것"으로 취급 */
    if (global.console && global.console.debug && err) {
      try { global.console.debug('[credits] 조용히 실패:', err.message || err.code || err); } catch (e) { /* noop */ }
    }
    return null;
  }

  async function rpc(name, args) {
    var sb = client();
    if (!sb || typeof sb.rpc !== 'function') return null;
    try {
      var res = await sb.rpc(name, args || {});
      if (!res || res.error) return quiet(res && res.error);
      return res.data;
    } catch (e) {
      return quiet(e);
    }
  }

  async function policy() {
    if (policyCache) return policyCache;
    if (!policyPromise) {
      policyPromise = rpc('credit_policy').then(function (data) {
        policyCache = (data && typeof data === 'object') ? data : {};
        return policyCache;
      });
    }
    return policyPromise;
  }

  async function isEnabled() {
    if (!flagOn()) return false;
    var p = await policy();
    return p && p.enabled === true;
  }

  async function ready() {
    return isEnabled();
  }

  async function award(eventType, refType, refId, idemKey) {
    if (!eventType || !idemKey) return 0;
    if (!(await isEnabled())) return 0;
    var n = await rpc('award_credit', {
      p_event_type: String(eventType),
      p_ref_type: refType == null ? null : String(refType),
      p_ref_id: refId == null ? null : String(refId),
      p_idempotency_key: String(idemKey)
    });
    return (typeof n === 'number' && isFinite(n)) ? n : 0;
  }

  async function balance() {
    if (!(await isEnabled())) return null;
    var n = await rpc('my_credit_balance');
    return (typeof n === 'number' && isFinite(n)) ? n : null;
  }

  async function renderSettingsSection(container) {
    if (!container) return false;
    container.innerHTML = '';
    container.style.display = 'none';
    var n = await balance();
    if (n === null) return false; /* 꺼져 있거나 조회 실패 → 아무것도 보이지 않는다 */
    var h = document.createElement('h4');
    h.textContent = '크레딧';
    var p = document.createElement('p');
    p.className = 'faint';
    p.style.fontSize = '.8rem';
    p.style.margin = '4px 0 0';
    p.textContent = '내 크레딧 ' + n.toLocaleString('ko-KR') + ' · 다른 사람에게 도움이 된 기여로만 쌓여요. 앱 안에서만 쓰여요.';
    container.appendChild(h);
    container.appendChild(p);
    container.style.display = '';
    return true;
  }

  global.OurgoalCredits = {
    ready: ready,
    isEnabled: isEnabled,
    policy: policy,
    award: award,
    balance: balance,
    renderSettingsSection: renderSettingsSection,
    _resetCache: function () { policyCache = null; policyPromise = null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
