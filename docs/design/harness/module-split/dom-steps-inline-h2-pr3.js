'use strict';
// 구역 H2 셋째 PR(#TASK-ES-497) 조작 단계 — 옮긴 renderTeamGoalsScreen 이 불리는 곳:
//   목표 탭 「팀목표」 하위 탭(빈 안내 분기) → 개인 → 팀목표 다시 → 활용 가이드 예시 탭 → 빠른 템플릿(새 팀 창) → 닫기 → 탭 왕복 뒤 다시 팀목표
module.exports = ({ click }) => ({
  globals: ['renderTeamGoalsScreen', 'collapseAllTeamGoalAccordions', 'renderTeamGoalsEmptyGuideHtml', 'isMockGroup'],
  steps: [
    ['goals-enter', { goTab: 'goals' }],
    ['sub-team', click('#btnGoalsSubTeam'), 400],
    ['sub-personal', click('#btnGoalsSubPersonal'), 300],
    ['sub-team-2', click('#btnGoalsSubTeam'), 400],
    ['ex-fitness', click('#teamGoalsView [data-tgexampletab="fitness"]'), 300],
    ['quick-travel', click('#teamGoalsView [data-tgtplquick="travel"]'), 600],
    ['close-1', { closeModal: true }],
    ['tab-roundtrip', { tabRoundTrip: true }],
    ['goals-again', { goTab: 'goals' }],
    ['sub-team-3', click('#btnGoalsSubTeam'), 400],
  ],
});
