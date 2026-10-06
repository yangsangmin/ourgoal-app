/**
 * OurGoal Goal Detail Drawer (목표 — 상세 서랍·마일스톤)
 *
 * 성지 트레일 상세 버튼으로 여는 목표 서랍의 진척도·마일스톤 체크 및 닫기. 원격 저장과 기존 window 노출은 원래 동작 그대로.
 * #TASK-ES-572(알림 헬퍼·목표 상세 서랍 책임 분열): index.html 인라인 IIFE 의 구간(이전 전 5536~5565 · 5566~5569 · 5570~5582줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 5536~5565줄(#TASK-ES-572 생성기 표지) ---- */

  function openGoalDetailDrawer(goalId){
    var g = (L.state.profile.goals || []).find(function(x){ return x.id === goalId; });
    if(!g) return;
    L.triggerHapticFeedback(12);
    var drawer = document.getElementById('goalDetailDrawer');
    var titleEl = document.getElementById('goalDrawerTitle');
    var bodyEl = document.getElementById('goalDrawerBody');
    if(titleEl) titleEl.textContent = g.title + ' 🎯';
    if(bodyEl){
      var msHtml = '';
      if(g.milestones && g.milestones.length > 0){
        msHtml = '<div style="margin-bottom:14px;"><h4 style="font-size:0.9rem;margin-bottom:8px;color:var(--ink);">핵심 마일스톤</h4>' +
          g.milestones.map(function(m){
            var isDone = (m.status === 'done');
            return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px dashed var(--rule);">' +
              '<span style="cursor:pointer;" onclick="toggleMilestoneInDrawer(\''+g.id+'\',\''+m.id+'\')">' + (isDone ? '✅' : '⬜') + '</span>' +
              '<span style="font-size:0.85rem;' + (isDone ? 'text-decoration:line-through;color:var(--ink-soft);' : 'color:var(--ink);') + '">' + L.escapeHtml(m.title) + '</span>' +
            '</div>';
          }).join('') + '</div>';
      }
      var progHtml = '<div style="margin-bottom:14px;"><div style="font-size:0.82rem;color:var(--ink-soft);margin-bottom:4px;">목표 진척도: ' + (g.progress || 0) + '%</div>' +
        '<div class="goal-progress-track"><div class="goal-progress-fill" style="width:' + (g.progress || 0) + '%;"></div></div></div>';
      bodyEl.innerHTML = progHtml + msHtml +
        '<div style="margin-top:16px;display:flex;gap:8px;">' +
          '<button type="button" class="btn btn-primary btn-sm" onclick="closeGoalDetailDrawer()" style="flex:1;min-height:44px;">확인</button>' +
        '</div>';
    }
    if(drawer) drawer.classList.add('open');
  }
  /* ---- 이전 전 index.html 5566~5569줄(#TASK-ES-572 생성기 표지) ---- */
  function closeGoalDetailDrawer(){
    var drawer = document.getElementById('goalDetailDrawer');
    if(drawer) drawer.classList.remove('open');
  }
  /* ---- 이전 전 index.html 5570~5582줄(#TASK-ES-572 생성기 표지) ---- */
  function toggleMilestoneInDrawer(goalId, msId){
    var g = (L.state.profile.goals || []).find(function(x){ return x.id === goalId; });
    if(!g || !g.milestones) return;
    var m = g.milestones.find(function(x){ return x.id === msId; });
    if(!m) return;
    L.triggerHapticFeedback(12);
    m.status = (m.status === 'done' ? 'todo' : 'done');
    var doneCount = g.milestones.filter(function(x){ return x.status === 'done'; }).length;
    g.progress = Math.round((doneCount / g.milestones.length) * 100);
    openGoalDetailDrawer(goalId);
    if(typeof L.dispatchFullViewPropagation === 'function') L.dispatchFullViewPropagation();
    L.saveProfile().catch(function(e){ console.warn('[TASK-ES-462] 마일스톤 저장 실패', e); }); /* [#TASK-ES-462] 서랍 토글은 메모리만 바꾸고 저장하지 않았다 → 성소 트레일 토글과 같은 saveProfile(서버 goals upsert + 기기 사본) */
  }

  K.openGoalDetailDrawer = openGoalDetailDrawer;
  K.closeGoalDetailDrawer = closeGoalDetailDrawer;
  K.toggleMilestoneInDrawer = toggleMilestoneInDrawer;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
