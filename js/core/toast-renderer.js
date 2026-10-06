/**
 * OurGoal Toast Renderer (기관 — 공용 토스트 표시·교체·닫기)
 *
 * toast(msg) 표시 책임만 글자 그대로 옮긴다. toastTimer 상태와 window.toast·window.showToast 노출은 index.html 원래 자리에 보존한다.
 * 기존 앱 스코프 getter/setter로 Confetti Undo와 같은 타이머를 쓰며 새 연결·타이머·API를 만들지 않는다. UiHelpers 원본 파일은 수정하지 않는다.
 * #TASK-ES-569(기록 테마 분류와 공용 토스트 표시 책임 분열): index.html 인라인 IIFE 의 구간(이전 전 3419~3427줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 3419~3427줄(#TASK-ES-569 생성기 표지) ---- */
  function toast(msg){
    var el = document.getElementById('toast');
    if(!el) return;
    el.textContent = msg;
    el.classList.add('show');
    el.onclick = function(){ el.classList.remove('show'); };
    clearTimeout(L.toastTimer);
    L.toastTimer = setTimeout(function(){ el.classList.remove('show'); }, 2200);
  }

  K.toast = toast;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
