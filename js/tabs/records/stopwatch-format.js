/**
 * OurGoal Stopwatch Format (기록 탭 — 전문 템플릿 스톱워치 시간 글자)
 *
 * 「⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯」 묶음에 남아 있던 formatStopwatchTime — 밀리초를 「분:초.10분의1초」(1시간 넘으면 시:분:초) 글자로 바꾼다(smoke-test FN_NAMES — 인라인 합본에서 찾는다). 스톱워치 위젯은 js/tabs/records/table-stopwatch.js.
 * window.renderStopwatchWidgetHtml · window.renderLapRowsHtml 노출 묶음은 index.html 원래 자리에 그대로 있다.
 * #TASK-ES-523(인라인 3단계 Z4 이동 2차(활용가이드·공개 범위 배지·스톱워치 시간 글자)): index.html 인라인 IIFE 의 구간(이전 전 10472~10485줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 10472~10485줄(#TASK-ES-523 생성기 표지) ---- */
  function formatStopwatchTime(ms, includeTenths){
    if(isNaN(ms) || ms < 0) ms = 0;
    var totalSec = Math.floor(ms / 1000);
    var hours = Math.floor(totalSec / 3600);
    var minutes = Math.floor((totalSec % 3600) / 60);
    var seconds = totalSec % 60;
    var tenths = Math.floor((ms % 1000) / 100);

    var minStr = (hours > 0 ? (L.pad(hours) + ':') : '') + L.pad(minutes) + ':' + L.pad(seconds);
    if(includeTenths !== false){
      return minStr + '.' + tenths;
    }
    return minStr;
  }

  K.formatStopwatchTime = formatStopwatchTime;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
