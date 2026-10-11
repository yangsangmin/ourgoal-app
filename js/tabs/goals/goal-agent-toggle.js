/**
 * OurGoal Goal Agent Toggle (목표 — AI 목표 어시스턴트 서랍 여닫기 연결)
 *
 * bindGoalAgentToggle — 목표 탭의 「AI 목표 어시스턴트」 제목 줄(#btnToggleGoalAgent)을 누르면 서랍(#goalAgentDrawer)을 열고 닫고 화살표(#goalAgentChevron)를 돌리며, 열 때 입력칸(#goalAgentInput)에 초점을 준다.
 * #TASK-ES-638(시동 배선 감싸기 1차 — 설정 시동 연결 · AI 목표 어시스턴트 서랍 · 바깥 부품 연결 · 서비스 워커): index.html 인라인 IIFE 의 구간(이전 전 3348~3361줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ---- 이전 전 index.html 3348~3361줄(#TASK-ES-638 생성기 표지) ---- */
  function bindGoalAgentToggle() { /* [#TASK-ES-638] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.toggleAgentBtn){
    L.toggleAgentBtn.addEventListener('click', function(){
      var drawer = document.getElementById('goalAgentDrawer');
      var chevron = document.getElementById('goalAgentChevron');
      if(!drawer) return;
      var isClosed = (drawer.style.display === 'none');
      drawer.style.display = isClosed ? 'block' : 'none';
      if(chevron) chevron.style.transform = isClosed ? 'rotate(180deg)' : 'rotate(0deg)';
      if(isClosed){
        var inp = document.getElementById('goalAgentInput');
        if(inp) setTimeout(function(){ inp.focus(); }, 50);
      }
    });
  }
  } /* bindGoalAgentToggle */

  K.bindGoalAgentToggle = bindGoalAgentToggle;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 시작 · gen-cell-provide.js] 이 세포가 키트에 단 이름을 등록 기관(js/core/cell-registry.js)에 스스로 등록한다 — 대조(compare) 전용, 동작 변화 0. 생성기 산출이므로 손으로 고치지 않는다. ==== */
(function (g) {
  var R = g.OurgoalCellRegistry;
  if (!R) return;
  var K = g.OurgoalGoalsKit;
  if (K) R.provide('goals/goal-agent-toggle', {
    bindGoalAgentToggle: K.bindGoalAgentToggle
  }, { window: [] });
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 끝] ==== */
