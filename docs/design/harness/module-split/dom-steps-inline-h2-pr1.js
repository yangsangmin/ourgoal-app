'use strict';
// 구역 H2 첫 PR(#TASK-ES-481) 조작 단계 — 옮긴 함수가 불리는 곳을 차례로 누른다:
//   목표 탭 개인 하위 탭(switchGoalsSubTab) → 첫 추천 템플릿 「담기」(adoptTemplateAsMyGoal) → 성취통계 하위 탭(renderGoalStatsChart) → 기간 월간·연간·주간(switchGoalStatPeriod)
//   → 템플릿 하위 탭(renderTemplateEncyclopediaScreen) → 루틴·팀·개인 도메인, 실사용자·AI 출처 전환(분류 상태 변수 setter) → 기록 탭 「이전 기록 전체 보기」 두 번(toggleRecordArchive)
module.exports = ({ click }) => ({
  globals: ['switchGoalsSubTab', 'switchGoalStatPeriod', 'renderGoalStatsChart', 'adoptTemplateAsMyGoal', 'renderTemplateEncyclopediaScreen', 'ROUTINE_TEMPLATES_AI', 'TEAM_TEMPLATES_REAL', 'PERSONAL_TEMPLATES_REAL', '_subtabTplDomain', 'toggleRecordArchive', 'selectSmartTag', 'switchRecFusionMode', 'exportRecordsCsv'],
  steps: [
    ['goals-enter', { goTab: 'goals' }],
    ['sub-personal', click('#btnGoalsSubPersonal'), 400],
    ['adopt-first', click('.btn-quick-adopt-goal'), 600],
    // 하네스 게스트 시드(focus-sanctuary)에는 추천 템플릿 카드가 그려지지 않아, 마크업 onclick 과 같은 경로(window.adoptTemplateAsMyGoal)로 직접 부른다
    ['adopt-direct', { evalFn: '(function(){ if(typeof window.adoptTemplateAsMyGoal !== "function") return "no-fn"; window.adoptTemplateAsMyGoal("10km 마라톤 완주 로드맵", "운동/건강"); var g = window.state && window.state.profile && window.state.profile.goals; return "goals:" + (g ? g.length + ":" + g[0].title + ":" + g[0].milestones.length : "-"); })()' }, 600],
    ['close-1', { closeModal: true }],
    ['sub-stats', click('#btnGoalsSubStats'), 400],
    ['period-month', click('#btnGoalPeriodMonth'), 300],
    ['period-year', click('#btnGoalPeriodYear'), 300],
    ['period-week', click('#btnGoalPeriodWeek'), 300],
    ['sub-template', click('#btnGoalsSubTemplate'), 400],
    ['dom-routine', click('#encyclDomainRoutine'), 300],
    ['type-real', click('#subtabTplBtnReal'), 300],
    ['dom-team', click('#encyclDomainTeam'), 300],
    ['type-ai', click('#subtabTplBtnAi'), 300],
    ['dom-personal', click('#encyclDomainPersonal'), 300],
    ['records-enter', { goTab: 'records' }],
    ['archive-open', click('#btnRecViewAllArchive'), 300],
    ['archive-close', click('#btnRecViewAllArchive'), 300],
    ['tab-roundtrip', { tabRoundTrip: true }],
  ],
});
