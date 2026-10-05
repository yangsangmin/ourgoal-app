/**
 * OurGoal Records Archive Toggle (기록 탭 — 이전 기록 아카이브 펼치기·접기)
 *
 * 기록 탭 「이전 기록 전체 보기」 아카이브 펼치기·접기(toggleRecordArchive).
 * 마크업 onclick 이 window 이름으로 부른다 — window 노출 줄은 index.html 원래 자리에 그대로 있다.
 * 같은 묶음에 있던 달력 융합 칩·빠른 스톱워치 함수는 #TASK-ES-515 에서 단추와 함께 지웠다(상민님 승인 2026-10-06 「숨김 정리 권장안 승인, 금고 변경 승인」). CSV 내보내기(exportRecordsCsv)는 내려받기 뒤 토스트를 게스트 화면 시나리오로 확인하지 못해 옮기지 않았다(별도 티켓).
 * #TASK-ES-481(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 15394~15416줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 15394~15416줄(#TASK-ES-481 생성기 표지) ---- */

  function toggleRecordArchive(){
    L.triggerHapticFeedback(12);
    if(!L.state) L.state = {};
    L.state.recordsArchiveOpen = !L.state.recordsArchiveOpen;
    var btn = document.getElementById('btnRecViewAllArchive');
    var recordsList = document.getElementById('recordsList');
    if(L.state.recordsArchiveOpen){
      if(btn) btn.innerHTML = '📦 이전 기록 접기';
      if(recordsList) {
        var extraItems = recordsList.querySelectorAll('.rec-archive-hidden-item');
        extraItems.forEach(function(el){ el.style.display = 'block'; });
      }
      if(typeof L.toast === 'function') L.toast('과거 기록 아카이브를 펼쳤습니다 📂');
    } else {
      if(btn) btn.innerHTML = '📦 이전 기록 전체 보기 (아카이브 펼치기)';
      if(recordsList) {
        var extraItems = recordsList.querySelectorAll('.rec-archive-hidden-item');
        extraItems.forEach(function(el){ el.style.display = 'none'; });
      }
      if(typeof L.toast === 'function') L.toast('과거 기록 아카이브를 접었습니다 📁');
    }
  }

  K.toggleRecordArchive = toggleRecordArchive;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
