/**
 * OurGoal Date Rollover (기관 — 자정 날짜 변경 감지·홈/기록/캘린더 다시 그리기)
 *
 * 「[#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처」 묶음의 함수 둘: 날짜 키가 바뀌었는지 보고 바뀌면 오늘의 미션 카드·홈/기록/캘린더를 다시 그리는 checkAndHandleDateRollover, 화면 복귀·포커스·1분 간격에 그것을 거는 setupDateRolloverWatcher(renderAll 이 부른다).
 * 마지막으로 본 날짜 키(_lastObservedDateKey)는 다시 대입되는 상태 변수라 index.html 원래 자리에 두고 L getter/setter 로 읽는다. 날짜가 실제로 바뀌는 분기는 자정까지 기다려야 해서 화면 시나리오로 잴 수 없다(법정 실행기는 시계를 바꿀 수 없다 — 시간대 고정만).
 * #TASK-ES-536(인라인 3단계 Z3 — 알림·시간·주소): index.html 인라인 IIFE 의 구간(이전 전 13584~13599 · 13600~13615줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 13584~13599줄(#TASK-ES-536 생성기 표지) ---- */
  function checkAndHandleDateRollover(){
    if(!L.state || !L.state.profile) return false;
    var curDateKey = typeof L.getEffectiveStandardDateKey === 'function' ? L.getEffectiveStandardDateKey(L.nowISO()) : L.dateKey(L.nowISO());
    if(!L._lastObservedDateKey){
      L._lastObservedDateKey = curDateKey;
      return false;
    }
    if(L._lastObservedDateKey !== curDateKey){
      console.log('[DateRollover] 자정 경과 날짜 변동 감지:', L._lastObservedDateKey, '->', curDateKey);
      L._lastObservedDateKey = curDateKey;
      if(typeof L.renderTodayMissionCard === 'function') L.renderTodayMissionCard();
      if(typeof L.dispatchFullViewPropagation === 'function') L.dispatchFullViewPropagation(['home', 'records', 'calendar']);
      return true;
    }
    return false;
  }
  /* ---- 이전 전 index.html 13600~13615줄(#TASK-ES-536 생성기 표지) ---- */
  function setupDateRolloverWatcher(){
    L._lastObservedDateKey = typeof L.getEffectiveStandardDateKey === 'function' ? L.getEffectiveStandardDateKey(L.nowISO()) : L.dateKey(L.nowISO());
    if(typeof document !== 'undefined'){
      document.addEventListener('visibilitychange', function(){
        if(document.visibilityState === 'visible') checkAndHandleDateRollover();
      });
    }
    if(typeof window !== 'undefined'){
      window.addEventListener('focus', checkAndHandleDateRollover);
      if(!window._dateRolloverInterval){
        window._dateRolloverInterval = setInterval(checkAndHandleDateRollover, 60000);
      }
      window.checkAndHandleDateRollover = checkAndHandleDateRollover;
      window.setupDateRolloverWatcher = setupDateRolloverWatcher;
    }
  }

  K.checkAndHandleDateRollover = checkAndHandleDateRollover;
  K.setupDateRolloverWatcher = setupDateRolloverWatcher;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
