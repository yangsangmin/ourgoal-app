/**
 * OurGoal Supabase Auth (기관 — 로그인 세션 토큰·인증 상태 감지·구글 OAuth 클라이언트 id)
 *
 * 「Supabase」 묶음 중 로그인 세션 토큰 꺼내기(getSupabaseAuthToken — 여러 탭의 서버 호출이 Authorization 헤더에 쓴다), 구글 OAuth 공개 클라이언트 id(GOOGLE_OAUTH_CLIENT_ID), 인증 상태 변화 감지 등록 문(bindSupabaseAuthStateListener — 로그인·토큰 갱신 때 세션 복구 입장을 부른다, index.html 원래 자리에서 부른다).
 * Supabase 주소·공개 키(SUPABASE_URL·SUPABASE_ANON_KEY)·클라이언트(sb)·대기 세션(_pendingAuthSession)·window 노출 줄은 원래 자리에 그대로 있다 — 주소·키는 실계정 하네스(docs/design/harness/real-account-steps.js)가 index.html 에서 읽는다.
 * #TASK-ES-521(인라인 3단계 Z1 로그인·계정 1차): index.html 인라인 IIFE 의 구간(이전 전 3239~3250 · 3251~3266 · 3268~3271줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalUiHelpers = global.OurgoalUiHelpers || {};

  /* ---- 이전 전 index.html 3239~3250줄(#TASK-ES-521 생성기 표지) ---- */
  function bindSupabaseAuthStateListener() { /* [#TASK-ES-521] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  try {
    if(L.sb && L.sb.auth){
      L.sb.auth.onAuthStateChange(function(event, session){
        if((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session && session.user){
          L._pendingAuthSession = session;
          if(typeof L.restoreSessionAndEnter === 'function' && (!L.state.profile || L.state.profile.id !== session.user.id)){
            L.restoreSessionAndEnter(session);
          }
        }
      });
    }
  } catch(e){}
  } /* bindSupabaseAuthStateListener */
  /* ---- 이전 전 index.html 3251~3266줄(#TASK-ES-521 생성기 표지) ---- */

  /* #TASK-ES-252: 보안 토큰 추출 헬퍼 (5계층 방어선 인증 연동) */
  async function getSupabaseAuthToken() {
    try {
      if (L._pendingAuthSession && L._pendingAuthSession.access_token) {
        return L._pendingAuthSession.access_token;
      }
      if (L.sb && L.sb.auth && typeof L.sb.auth.getSession === 'function') {
        var s = await L.sb.auth.getSession();
        if (s && s.data && s.data.session && s.data.session.access_token) {
          return s.data.session.access_token;
        }
      }
    } catch(e) {}
    return null;
  }

  /* ---- 이전 전 index.html 3268~3271줄(#TASK-ES-521 생성기 표지) ---- */

  /* 앱 레벨 Google OAuth 클라이언트 ID(공개 식별자, 시크릿 아님). GCP 콘솔에서 이 앱을 등록한 뒤 값을 채우면
     사용자가 자기 ID를 넣을 필요가 없어진다. 비어 있으면 설정의 사용자 ID로 폴백한다 — 거시 재조정안 A2 */
  var GOOGLE_OAUTH_CLIENT_ID = '441950547594-brg1nvritlb3hlucoktq11ga6vtn943a.apps.googleusercontent.com';

  K.bindSupabaseAuthStateListener = bindSupabaseAuthStateListener;
  K.getSupabaseAuthToken = getSupabaseAuthToken;
  K.GOOGLE_OAUTH_CLIENT_ID = GOOGLE_OAUTH_CLIENT_ID;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
