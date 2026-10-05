'use strict';
// 구역 H2 둘째 PR(#TASK-ES-493) 조작 단계 — 옮긴 함수가 불리는 곳을 차례로 누른다:
//   목표 탭 「루틴」 하위 탭(renderRoutineGoalsScreen) → 「+ 새 루틴」(openAddRoutineModal) → 닫기
//   → 「팀목표」 하위 탭(빈 안내 renderTeamGoalsEmptyGuideHtml·renderTeamCreateHeroCardHtml·wireTeamGoalsGuideEvents) → 예시 탭 단체 여행·운동 크루 → 빠른 템플릿 운동 크루(getTeamGoalTemplatePreset → 새 팀 창) → 닫기
module.exports = ({ click }) => ({
  globals: ['renderRoutineGoalsScreen', 'openAddRoutineModal', 'openRoutineDetailModal', 'renderTeamCreateHeroCardHtml', 'renderTeamGoalsEmptyGuideHtml', 'wireTeamGoalsGuideEvents', 'getTeamGoalTemplatePreset', 'renderTeamGoalsScreen'],
  steps: [
    ['goals-enter', { goTab: 'goals' }],
    ['sub-routine', click('#btnGoalsSubRoutine'), 400],
    ['add-routine', click('#btnAddRoutineBtn'), 500],
    ['add-cancel', click('#btnCancelAddRoutine'), 300],
    ['sub-team', click('#btnGoalsSubTeam'), 400],
    ['ex-travel', click('#teamGoalsView [data-tgexampletab="travel"]'), 300],
    ['ex-fitness', click('#teamGoalsView [data-tgexampletab="fitness"]'), 300],
    ['quick-fitness', click('#teamGoalsView [data-tgtplquick="fitness"]'), 600],
    ['close-1', { closeModal: true }],
    ['quick-workshop', click('#teamGoalsView [data-tgtplquick="workshop"]'), 600],
    ['close-2', { closeModal: true }],
    ['tab-roundtrip', { tabRoundTrip: true }],
  ],
});
