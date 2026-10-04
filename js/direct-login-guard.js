/* [#TASK-ES-368] CORE-13 빠른 복구·닉네임 입장 잠금 — 입력한 닉네임·이메일은 신원 증명이 아니다.
 * 원인(PR #678 빌더 발견): index.html loginWithDirectIdentifier 가 입력값과 상관없이 이 기기의 첫
 * ourgoal_*_backup_<uid> 키(없으면 직전 사용자 ourgoal_current_user)의 uid 로 인증 없이 입장했다.
 * 공용 기기에서 다른 사람 데이터로 들어갈 수 있었다(노션 COMM-11 세션 없는 로그인 경로와 같은 뿌리).
 * 규칙(상민님 2026-10-04 승인 방향):
 *   1. 정식 Supabase 로그인 세션이 있으면 그 세션 uid 로만 연다(입력값·다른 uid 무시). 백업은 그 uid 의 것만 읽힌다.
 *   2. 세션이 없으면 열지 않는다(needs-login) — 화면은 정식 로그인(카카오·구글·이메일)으로 안내한다.
 *   3. 예외 두 갈래는 기존 입장 방법을 없애지 않기 위해 남긴다:
 *      - Google 계정 인증(GIS)으로 확인된 이메일: 그 이메일에서 결정되는 uid(기기 백업을 훑지 않음).
 *      - 개발용 테스터 B 직통(호출자가 uid 를 명시) — [#TASK-ES-372] 로컬 개발 호스트(devHost true)일 때만.
 *   이 기기의 다른 사람 백업 키를 훑어 uid 를 고르는 길은 어느 갈래에도 없다. */
(function (root) {
  'use strict';

  var BACKUP_PREFIXES = ['ourgoal_goals_backup_', 'ourgoal_records_backup_', 'ourgoal_profile_backup_', 'ourgoal_settings_'];
  var NEEDS_LOGIN_MESSAGE = '빠른 복구는 카카오·구글·이메일로 로그인한 상태에서만 이 기기에 남은 내 기록을 열 수 있어요. 먼저 로그인해 주세요.';

  function present(v) {
    return v !== undefined && v !== null && String(v) !== '';
  }

  /* opt: { sessionUid, provider, verifiedEmail, explicitUid, devHost }
   * 돌려줌: { allow, uid, deriveFromEmail, reason } — uid 를 정할 수 없으면 allow=false, reason='needs-login' */
  function resolveDirectLoginTarget(opt) {
    var o = opt || {};
    if (present(o.sessionUid)) {
      return { allow: true, uid: String(o.sessionUid), deriveFromEmail: null, reason: 'session' };
    }
    if (o.provider === 'google' && present(o.verifiedEmail)) {
      return { allow: true, uid: null, deriveFromEmail: String(o.verifiedEmail).trim().toLowerCase(), reason: 'google-verified-email' };
    }
    if (present(o.explicitUid) && o.devHost === true) {
      return { allow: true, uid: String(o.explicitUid), deriveFromEmail: null, reason: 'explicit-tester' };
    }
    return { allow: false, uid: null, deriveFromEmail: null, reason: 'needs-login' };
  }

  /* [#TASK-ES-372] 개발용 직통 입장(테스터 B)은 로컬 개발 호스트에서만 연다.
   * 결함(PR #686 빌더 발견): 운영 주소에 ?debug=true 를 붙이면 테스터 B 버튼이 보이고 인증 없이 테스터 B uid 로 들어갔다.
   * 허용: localhost, 127.0.0.1, [::1], *.localhost. 그 밖(운영·미리보기 주소)은 쿼리와 상관없이 막는다. */
  var LOCAL_DEV_HOSTS = ['localhost', '127.0.0.1', '[::1]', '::1'];
  var LOCAL_DEV_SUFFIX = '.localhost';

  function isLocalDevHost(hostname) {
    var h = String(hostname || '').trim().toLowerCase().replace(/\.$/, '');
    if (!h) return false;
    if (LOCAL_DEV_HOSTS.indexOf(h) !== -1) return true;
    return h.length > LOCAL_DEV_SUFFIX.length && h.slice(-LOCAL_DEV_SUFFIX.length) === LOCAL_DEV_SUFFIX;
  }

  /* 이 uid 의 백업 키 중 이 기기에 남아 있는 것(다른 uid 키는 보지 않는다) */
  function ownBackupKeys(uid, store) {
    var found = [];
    if (!store || !present(uid)) return found;
    BACKUP_PREFIXES.forEach(function (p) {
      try { if (store.getItem(p + uid) !== null) found.push(p + uid); } catch (e) {}
    });
    return found;
  }

  /* 세션 없이 빠른 복구를 누르면 아무 데이터도 열지 않고 정식 로그인 화면(카카오·이메일 로그인 칸)과 안내 문구를 띄운다 */
  function guideToFormalLogin(doc, toastFn, initFieldsFn) {
    if (!doc) return false;
    var landing = doc.getElementById('landingScreen');
    if (landing) landing.style.display = 'none';
    var auth = doc.getElementById('authScreen');
    if (auth) auth.style.display = 'flex';
    if (typeof initFieldsFn === 'function') { try { initFieldsFn(); } catch (e) {} }
    var loginTab = doc.querySelector('[data-authtab="login"]');
    if (loginTab && typeof loginTab.click === 'function') loginTab.click();
    var loginErr = doc.getElementById('loginError');
    if (loginErr) loginErr.textContent = NEEDS_LOGIN_MESSAGE;
    if (typeof toastFn === 'function') toastFn(NEEDS_LOGIN_MESSAGE);
    return true;
  }

  var api = {
    BACKUP_PREFIXES: BACKUP_PREFIXES,
    NEEDS_LOGIN_MESSAGE: NEEDS_LOGIN_MESSAGE,
    resolveDirectLoginTarget: resolveDirectLoginTarget,
    ownBackupKeys: ownBackupKeys,
    guideToFormalLogin: guideToFormalLogin,
    isLocalDevHost: isLocalDevHost
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.OurgoalDirectLoginGuard = api;
})(typeof window !== 'undefined' ? window : null);
