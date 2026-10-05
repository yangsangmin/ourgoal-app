/**
 * OurGoal Support Inquiry Buttons (설정 — 1:1 문의·지원 이메일 단추)
 *
 * 「1:1 고객 문의 / 버그 제보」 묶음의 처리기 등록 문 두 개: 설정·바닥글 문의 단추(#feedbackInquiryBtn·#footInquiryLink → openCustomerInquiryModal)(bindInquiryButtons), 바닥글 지원 이메일 단추(#footSupportEmailLink — 이메일 복사·토스트·문의 창)(bindSupportEmailLink). index.html 원래 자리에서 부른다.
 * #TASK-ES-562(인라인 3단계 구역 Z5 표준 1): index.html 인라인 IIFE 의 구간(이전 전 4559~4565 · 4567~4576줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 4559~4565줄(#TASK-ES-562 생성기 표지) ---- */
  function bindInquiryButtons() { /* [#TASK-ES-562] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  ['feedbackInquiryBtn', 'footInquiryLink'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener('click', function(e){
      e.preventDefault();
      L.openCustomerInquiryModal();
    });
  });
  } /* bindInquiryButtons */

  /* ---- 이전 전 index.html 4567~4576줄(#TASK-ES-562 생성기 표지) ---- */
  function bindSupportEmailLink() { /* [#TASK-ES-562] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.footEmailEl) L.footEmailEl.addEventListener('click', function(e){
    e.preventDefault();
    try {
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText('ourgoal.support@gmail.com');
      }
      L.toast('공식 지원 이메일(ourgoal.support@gmail.com)이 복사되었습니다.');
    } catch(copyErr){}
    L.openCustomerInquiryModal();
  });
  } /* bindSupportEmailLink */

  K.bindInquiryButtons = bindInquiryButtons;
  K.bindSupportEmailLink = bindSupportEmailLink;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
