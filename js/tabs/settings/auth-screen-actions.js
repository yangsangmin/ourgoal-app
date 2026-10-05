/**
 * OurGoal Auth Screen Actions (설정 — 로그인 화면 탭 전환·비밀번호 찾기 창)
 *
 * 로그인 화면 「로그인/회원가입」 탭 단추 처리기 등록 문(bindAuthTabButtons — index.html 원래 자리에서 부른다, 「Goal category templates」 묶음 안의 로드 중 문)과 「P0: 비밀번호 찾기」 묶음의 openForgotPasswordModal(js/auth-safety.js 의 창으로 넘긴다).
 * #TASK-ES-541(인라인 3단계 구역 Z5 표준 1): index.html 인라인 IIFE 의 구간(이전 전 4402~4410 · 4418~4422줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* ---- 이전 전 index.html 4402~4410줄(#TASK-ES-541 생성기 표지) ---- */
  function bindAuthTabButtons() { /* [#TASK-ES-541] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  L.authTabButtons.forEach(function(b){
    b.addEventListener('click', function(){
      L.authTabButtons.forEach(function(x){ x.classList.remove('active'); });
      b.classList.add('active');
      var which = b.dataset.authtab;
      document.getElementById('loginForm').style.display = which==='login' ? '' : 'none';
      document.getElementById('signupForm').style.display = which==='signup' ? '' : 'none';
    });
  });
  } /* bindAuthTabButtons */

  /* ---- 이전 전 index.html 4418~4422줄(#TASK-ES-541 생성기 표지) ---- */
  function openForgotPasswordModal(){
    if(window.OurgoalAuthSafety && typeof window.OurgoalAuthSafety.openForgotPasswordModal === 'function'){
      window.OurgoalAuthSafety.openForgotPasswordModal();
    }
  }

  K.bindAuthTabButtons = bindAuthTabButtons;
  K.openForgotPasswordModal = openForgotPasswordModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
