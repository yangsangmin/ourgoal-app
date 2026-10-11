/**
 * OurGoal Goal Fast Add (목표 — 빠른 목표 추가와 분류 칩 고르기)
 *
 * selectSmartTag — 분류 칩(#chipTagHealth · #chipTagStudy · #chipTagCareer · #chipTagHabit) 가운데 고른 것을 표시하고 window.selectedGoalSmartTag 에 적는다.
 * handleGoalFastAddSubmit — 빠른 추가 입력칸(#goalFastAddInput)의 글로 새 목표를 만들어 목록 맨 앞에 넣고 저장한 뒤 화면을 다시 그린다.
 * #TASK-ES-640(시동 배선 감싸기 2차 — 체크인 입력 연결 · 팀 목표 댓글 보내기 · 샘플 기록 정리 · 빠른 목표 추가): index.html 인라인 IIFE 의 구간(이전 전 3354~3364 · 3366~3398줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 3354~3364줄(#TASK-ES-640 생성기 표지) ---- */
  function selectSmartTag(tag){
    L.triggerHapticFeedback(12);
    window.selectedGoalSmartTag = tag;
    var wrap = document.querySelector('.smart-tag-chips-wrap');
    if(wrap){
      wrap.querySelectorAll('.smart-tag-chip').forEach(function(c){ c.classList.remove('active'); });
      var map = { 'health':'chipTagHealth', 'study':'chipTagStudy', 'career':'chipTagCareer', 'habit':'chipTagHabit' };
      var target = document.getElementById(map[tag]);
      if(target) target.classList.add('active');
    }
  }

  /* ---- 이전 전 index.html 3366~3398줄(#TASK-ES-640 생성기 표지) ---- */
  /* [#TASK-ES-481] switchGoalsSubTab → js/tabs/goals/goals-ia-actions.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  function handleGoalFastAddSubmit(){
    var input = document.getElementById('goalFastAddInput');
    if(!input) return;
    var title = input.value.trim();
    if(!title){
      if(typeof L.toast === 'function') L.toast('목표 이름을 입력해주세요 🌱');
      input.focus();
      return;
    }
    L.triggerHapticFeedback(12);
    var tag = window.selectedGoalSmartTag || 'health';
    var tagNames = { 'health':'운동/건강', 'study':'학습/성장', 'career':'커리어', 'habit':'습관/루틴' };
    var newGoal = {
      id: 'g_' + Date.now(),
      title: title,
      category: tagNames[tag] || '일반',
      status: 'active',
      progress: 0,
      createdAt: new Date().toISOString(),
      milestones: [
        { id: 'm_' + Date.now() + '_1', title: '첫 번째 작은 실천하기', status: 'todo' }
      ]
    };
    if(!L.state.profile.goals) L.state.profile.goals = [];
    L.state.profile.goals.unshift(newGoal);
    L.state.activeGoalId = newGoal.id;
    input.value = '';
    if(typeof L.toast === 'function') L.toast('새 목표가 등록되었습니다! 🎯'); L.saveProfile().catch(function(e){ console.warn('[TASK-ES-514] 빠른 목표 추가 저장 실패', e); if(typeof L.toast === 'function') L.toast('목표를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요'); }); /* [#TASK-ES-514] 빠른 목표 추가는 메모리에만 넣고 저장하지 않아 새로 고치면 사라졌다 → 서랍 마일스톤 토글(#TASK-ES-462)과 같은 saveProfile(서버 goals upsert + 기기 사본) */
    if(typeof L.dispatchFullViewPropagation === 'function') L.dispatchFullViewPropagation();
    else L.renderGoalsScreen();
  }

  K.selectSmartTag = selectSmartTag;
  K.handleGoalFastAddSubmit = handleGoalFastAddSubmit;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
