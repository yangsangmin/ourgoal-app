/**
 * OurGoal Sample Purge (기록 — 체험용 샘플 기록만 한 번에 정리)
 *
 * definePurgeSampleRecords — window.purgeSampleRecordsOneClick 을 단다: 체험용 샘플 기록(isSample)이 있으면 확인 창(ui.confirm)을 띄우고, 확인하면 샘플 기록만 빼고 저장한 뒤 기록 화면을 다시 그린다. 직접 적은 기록은 건드리지 않는다.
 * #TASK-ES-640(시동 배선 감싸기 2차 — 체크인 입력 연결 · 팀 목표 댓글 보내기 · 샘플 기록 정리 · 빠른 목표 추가): index.html 인라인 IIFE 의 구간(이전 전 4842~4868줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ---- 이전 전 index.html 4842~4868줄(#TASK-ES-640 생성기 표지) ---- */
  function definePurgeSampleRecords() { /* [#TASK-ES-640] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* ============ [#TASK-ES-358] 기록 탭 렌더 → js/tabs/records/period-ai-card.js · render.js 로 옮김 ============
     initPeriodAiCard · generatePeriodAIFeedback · generateLocalPeriodFeedback · renderPeriodFeedbackResult · setRecordsSegment · setRecordsSlide · renderRecordsScreen.
     renderRecordsScreen·setRecordsSegment·setRecordsSlide 는 이 IIFE 맨 위에서 같은 이름으로 가져온다. 아래 window 대입 문은 이전 전과 같은 자리에 둔다. */
  // [TASK-ES-245] 샘플 데이터 1초 체험 후 원클릭 완전 삭제/정화 함수
  window.purgeSampleRecordsOneClick = async function(){
    if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
    var curRecs = (L.state && L.state.profile && L.state.profile.records) || (L.state && L.state.records) || [];
    var sampleRecs = curRecs.filter(function(r){ return r && r.isSample === true; });
    var sampleCount = sampleRecs.length;
    if(!sampleCount){
      if(typeof L.toast === 'function') L.toast('정리할 샘플 데이터가 없습니다.');
      return;
    }

    var confirmed = await OurgoalCapabilities.call('ui.confirm', '체험용 샘플 데이터 ' + sampleCount + '건만 말끔히 삭제할까요?\n(내가 직접 적은 기록은 100% 안전하게 유지됩니다)');
    if(!confirmed) return;

    if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(15);
    var keptRecs = curRecs.filter(function(r){ return !r || r.isSample !== true; });
    if(L.state && L.state.profile) L.state.profile.records = keptRecs;
    if(L.state) L.state.records = keptRecs;
    if(typeof L.saveProfile === 'function') await L.saveProfile();
    if(typeof L.dispatchFullViewPropagation === 'function') L.dispatchFullViewPropagation();
    L.renderRecordsScreen();
    if(window.OurgoalSanctuaryV3 && window.OurgoalSanctuaryV3.render) window.OurgoalSanctuaryV3.render('records');
    if(typeof L.toast === 'function') L.toast('체험용 샘플 데이터가 모두 정리되었습니다! ✨');
  };
  } /* definePurgeSampleRecords */

  K.definePurgeSampleRecords = definePurgeSampleRecords;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
