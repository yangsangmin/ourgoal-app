/**
 * OurGoal Tester Entry (설정 — 2계정 상호작용 테스트용 테스터 B 직통 입장, 로컬 개발 주소 전용)
 *
 * 「2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169)」 묶음: 테스터 B 직통 입장(enterAsTesterB — 로컬 개발 주소에서만 연다)과 랜딩·로그인 화면의 테스터 B 단추 처리기 등록 문(bindLandTesterBButton·bindAuthTesterBButton — 단추가 화면에 있을 때만 건다, index.html 원래 자리에서 부른다).
 * 단추 요소 변수(landTesterBBtn·authTesterBBtn)와 window 노출 줄은 원래 자리에 그대로 있다.
 * #TASK-ES-521(인라인 3단계 Z1 로그인·계정 1차): index.html 인라인 IIFE 의 구간(이전 전 4025~4045 · 4048~4053 · 4055~4060줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 4025~4045줄(#TASK-ES-521 생성기 표지) ---- */
  async function enterAsTesterB(){
    if(!window.OurgoalDirectLoginGuard.isLocalDevHost(typeof location !== 'undefined' ? location.hostname : '')){ L.toast('테스터 직통 입장은 로컬 개발 환경에서만 열려요.'); return false; }
    var testerId = '00000000-0000-4000-a000-000000000002';
    var testerNick = '테스터_B';
    L.toast('테스터 B 계정으로 입장 중입니다…');
    if(typeof L.loginWithDirectIdentifier === 'function'){
      await L.loginWithDirectIdentifier(testerNick, {
        userId: testerId,
        displayName: '테스터 B',
        avatarUrl: ''
      });
    } else {
      L.state.profile = L.defaultProfile(testerId, 'tester_b', '테스터 B');
      try { localStorage.setItem('ourgoal_current_user', testerId); } catch(e){}
      var ls = document.getElementById('landingScreen');
      if(ls) ls.style.display = 'none';
      var as = document.getElementById('authScreen');
      if(as) as.style.display = 'none';
      L.enterApp();
    }
  }

  /* ---- 이전 전 index.html 4048~4053줄(#TASK-ES-521 생성기 표지) ---- */
  function bindLandTesterBButton() { /* [#TASK-ES-521] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.landTesterBBtn){
    L.landTesterBBtn.addEventListener('click', function(e){
      if(e && e.preventDefault) e.preventDefault();
      enterAsTesterB();
    });
  }
  } /* bindLandTesterBButton */

  /* ---- 이전 전 index.html 4055~4060줄(#TASK-ES-521 생성기 표지) ---- */
  function bindAuthTesterBButton() { /* [#TASK-ES-521] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.authTesterBBtn){
    L.authTesterBBtn.addEventListener('click', function(e){
      if(e && e.preventDefault) e.preventDefault();
      enterAsTesterB();
    });
  }
  } /* bindAuthTesterBButton */

  K.enterAsTesterB = enterAsTesterB;
  K.bindLandTesterBButton = bindLandTesterBButton;
  K.bindAuthTesterBButton = bindAuthTesterBButton;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
