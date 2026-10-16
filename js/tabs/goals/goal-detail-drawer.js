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
    var pct = (typeof L.goalAchievement === 'function') ? L.goalAchievement(g) : (Number(g.progress) || 0);
    g.progress = pct;
    if(titleEl) titleEl.textContent = (g.icon || '🎯') + ' ' + g.title;
    if(bodyEl){
      var msHtml = '';
      if(g.milestones && g.milestones.length > 0){
        msHtml = '<div style="margin-bottom:14px;"><h4 style="font-size:0.88rem;margin:0 0 8px;color:var(--ink);">핵심 마일스톤 (' + g.milestones.filter(function(m){ return m.status === 'done' || m.done; }).length + '/' + g.milestones.length + ')</h4>' +
          g.milestones.map(function(m){
            var isDone = (m.status === 'done' || m.done);
            return '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;margin-bottom:6px;background:var(--card2, var(--surface));border:1px solid var(--rule);border-radius:10px;">' +
              '<span style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;min-width:28px;min-height:28px;" onclick="toggleMilestoneInDrawer(\''+g.id+'\',\''+m.id+'\')">' + (isDone ? '✅' : '⬜') + '</span>' +
              '<span style="font-size:0.85rem;font-weight:600;' + (isDone ? 'text-decoration:line-through;color:var(--ink-soft);' : 'color:var(--ink);') + '">' + L.escapeHtml(m.title) + '</span>' +
            '</div>';
          }).join('') + '</div>';
      }
      var routines = (L.state && L.state.profile && L.state.profile.settings && Array.isArray(L.state.profile.settings.routines)) ? L.state.profile.settings.routines : [];
      var linkedRoutines = routines.filter(function(r){ return r && (r.linkedGoalId === goalId || r.goalId === goalId); });
      var routineHtml = '<div style="margin-bottom:14px;padding:11px 12px;background:var(--card2, var(--surface));border:1px solid var(--rule);border-radius:12px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<span style="font-size:0.84rem;font-weight:700;color:var(--ink);">🔄 연결된 데일리 루틴 (' + linkedRoutines.length + '개)</span>' +
          '<button type="button" class="btn btn-ghost btn-sm" onclick="closeGoalDetailDrawer(); if(typeof switchGoalsSubTab===\'function\') switchGoalsSubTab(\'routine\');" style="font-size:0.72rem;padding:3px 8px;min-height:26px;">루틴 탭 이동 ➔</button>' +
        '</div>' +
        (linkedRoutines.length > 0
          ? linkedRoutines.map(function(r){
              return '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;margin-top:4px;background:var(--card);border:1px solid var(--rule);border-radius:8px;font-size:0.8rem;color:var(--ink);">' +
                '<span style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + L.escapeHtml(r.title || '루틴') + '</span>' +
                '<span style="font-size:0.72rem;color:var(--brand);font-weight:700;flex-shrink:0;">🔥 ' + (r.streak || 0) + '일</span>' +
              '</div>';
            }).join('')
          : '<div style="font-size:0.78rem;color:var(--ink-soft);">아직 이 목표에 연결된 루틴이 없어요. 루틴 탭에서 매일 실천할 습관을 연결해보세요!</div>') +
      '</div>';
      var progHtml = '<div style="margin-bottom:14px;padding:12px;background:var(--card2, var(--surface));border:1px solid var(--rule);border-radius:12px;"><div style="display:flex;align-items:center;justify-content:space-between;font-size:0.85rem;font-weight:700;color:var(--ink);margin-bottom:6px;"><span>목표 진척도</span><span style="color:var(--brand);">' + pct + '%</span></div>' +
        '<div class="goal-progress-track"><div class="goal-progress-fill" style="width:' + pct + '%;"></div></div></div>';
      bodyEl.innerHTML = progHtml + msHtml + routineHtml +
        '<div style="margin-top:16px;display:flex;gap:8px;">' +
          '<button type="button" class="btn btn-ghost btn-sm" onclick="closeGoalDetailDrawer(); if(window.state){ window.state.activeGoalId=\''+L.escapeHtml(String(g.id))+'\'; window.state.goalEditMode=true; if(typeof window.renderGoalsScreen===\'function\') window.renderGoalsScreen(); }" style="flex:1;min-height:44px;border-radius:12px;font-weight:700;border:1px solid var(--rule);color:var(--ink);">✏️ 목표 편집</button>' +
          '<button type="button" class="btn btn-primary btn-sm" onclick="closeGoalDetailDrawer()" style="flex:1;min-height:44px;border-radius:12px;font-weight:700;">확인</button>' +
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
    m.done = (m.status === 'done');
    var doneCount = g.milestones.filter(function(x){ return x.status === 'done' || x.done; }).length;
    g.progress = (typeof L.goalAchievement === 'function')
      ? L.goalAchievement(g)
      : Math.round((doneCount / g.milestones.length) * 100);
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
/* ==== [세포 등록 시작 · gen-cell-provide.js] 이 세포가 키트에 단 이름을 등록 기관(js/core/cell-registry.js)에 스스로 등록한다 — 대조(compare) 전용, 동작 변화 0. 생성기 산출이므로 손으로 고치지 않는다. ==== */
(function (g) {
  var R = g.OurgoalCellRegistry;
  if (!R) return;
  var K = g.OurgoalGoalsKit;
  if (K) R.provide('goals/goal-detail-drawer', {
    closeGoalDetailDrawer: K.closeGoalDetailDrawer, openGoalDetailDrawer: K.openGoalDetailDrawer, toggleMilestoneInDrawer: K.toggleMilestoneInDrawer
  }, { window: [
    'closeGoalDetailDrawer', 'openGoalDetailDrawer', 'toggleMilestoneInDrawer'
  ], windowOnly: [
    'closeGoalDetailDrawer', 'openGoalDetailDrawer', 'toggleMilestoneInDrawer'
  ] });
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 끝] ==== */
