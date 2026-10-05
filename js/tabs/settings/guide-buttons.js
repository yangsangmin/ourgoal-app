/**
 * OurGoal Guide Buttons (설정 — 각 탭 활용법 허브·앱 기본 가이드 다시보기 단추)
 *
 * 설정 「도움말」 칸의 「각 탭 200% 활용법」 단추(#btnTabGuideHub → openTabGuideHubModal)와 「앱 기본 가이드 다시보기」 단추(#btnRestartGuide → startFirstLoginGuide) 처리기 등록 문 두 개(bindTabGuideHubButton·bindRestartGuideButton — index.html 원래 자리에서 부른다).
 * #TASK-ES-541(인라인 3단계 구역 Z5 표준 1): index.html 인라인 IIFE 의 구간(이전 전 4597~4601 · 4605~4609줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 4597~4601줄(#TASK-ES-541 생성기 표지) ---- */
  function bindTabGuideHubButton() { /* [#TASK-ES-541] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.tabGuideBtn){
    L.tabGuideBtn.addEventListener('click', function(){
      L.openTabGuideHubModal('avatar');
    });
  }
  } /* bindTabGuideHubButton */

  /* ---- 이전 전 index.html 4605~4609줄(#TASK-ES-541 생성기 표지) ---- */
  function bindRestartGuideButton() { /* [#TASK-ES-541] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.guideBtn){
    L.guideBtn.addEventListener('click', function(){
      L.startFirstLoginGuide();
    });
  }
  } /* bindRestartGuideButton */

  K.bindTabGuideHubButton = bindTabGuideHubButton;
  K.bindRestartGuideButton = bindRestartGuideButton;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
