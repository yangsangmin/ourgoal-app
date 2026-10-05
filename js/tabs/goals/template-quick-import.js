/**
 * OurGoal Template Quick Import (목표 탭 — 템플릿 1초 이식·분야별 마일스톤)
 *
 * #TASK-ES-437 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   importTemplateInstantly — 「[80] 템플릿백과사전 1초 자동이식」(이전 전 4775~4812줄)
 *   templateMilestones — 「Goal category templates」(이전 전 6207~6211줄)
 * 템플릿 백과사전에서 고른 템플릿을 목표로 바로 이식, 분야 템플릿의 기본 마일스톤 만들기.
 * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  async function importTemplateInstantly(templateId, templateTitle, category, milestones){
    if(!L.state.profile) return;
    if(!L.state.profile.goals) L.state.profile.goals = [];

    var newGoalId = L.uid('goal');
    var msList = Array.isArray(milestones) ? milestones.map(function(m, i){
      return {
        id: L.uid('ms'),
        title: typeof m === 'string' ? m : (m.title || '마일스톤 ' + (i + 1)),
        status: 'todo',
        tasks: Array.isArray(m.tasks) ? m.tasks.map(function(t){
          return { id: L.uid('task'), title: typeof t === 'string' ? t : (t.title || '세부과제'), done: false };
        }) : []
      };
    }) : [
      { id: L.uid('ms'), title: '1단계: 준비 및 기초 습관 세팅', status: 'doing', tasks: [] },
      { id: L.uid('ms'), title: '2단계: 핵심 실천 및 일일 체크인', status: 'todo', tasks: [] },
      { id: L.uid('ms'), title: '3단계: 최종 완수 및 성과 회고', status: 'todo', tasks: [] }
    ];

    var newGoal = {
      id: newGoalId,
      title: templateTitle || '새 템플릿 목표',
      category: category || 'study',
      visibility: 'private',
      topic: category || null,
      milestones: msList,
      result: null,
      createdAt: L.nowISO(),
      fromTemplateId: templateId
    };

    L.state.profile.goals.unshift(newGoal);
    await L.saveProfile();
    L.closeTemplateEncyclopediaModal();
    L.renderAll();
    L.toast('⚡ "' + templateTitle + '" 목표가 1초 만에 자동이식되었습니다! 로드맵이 동기화되었습니다 ✨');
  }

  function templateMilestones(key){
    var t = L.GOAL_TEMPLATES[key];
    if(!t) return [];
    return t.ms.map(function(title){ return { id: L.uid('ms'), title: title, status:'todo', dueDate:null, tasks:[] }; });
  }

  K.importTemplateInstantly = importTemplateInstantly;
  K.templateMilestones = templateMilestones;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
