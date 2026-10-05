'use strict';
// #TASK-ES-466 게스트 조작 비교 단계(dom-compare-inline-p1.js 가 읽는다): 구역 H1 1차로 옮긴 네 세포가 불리는 곳 —
//   홈 「🏃 동반자」(renderCrewPacingWidget) → 「응원 보내기」(nudgeCrewMates) → 「오늘 체크인」(focusHomeCheckinInput)
//   홈 「🎯 오늘 목표」 → <아워골 평가해주기>(openAppEvaluationModal) → 빈 제출(bindAppEvalSubmit 처리기) → × (closeAppEvaluationModal)
//   홈 「새 목표」(bindHomeAddGoal → promptNewGoal) → 「직접 설정할게요」(showNewGoalManualForm) → 「AI 도우미로」(showNewGoalChatStep)
//   소통 「게시하기」(openShareToFeedModal) → 「미리보기」 열기·닫기
exports.globals = ['renderCrewPacingWidget', 'applyCrewPacingUI', 'nudgeCrewMates', 'focusHomeCheckinInput', 'openShareToFeedModal', 'addSimulatedCheerAndReplyToPost',
  'openAppEvaluationModal', 'closeAppEvaluationModal', 'resetAppEvaluationForm', 'bindAppEvalBackdrop', 'bindAppEvalSubmit', 'bindHomeAddGoal',
  'promptNewGoal', 'localGoalTemplate', 'generateGoalTemplate', 'showNewGoalManualForm', 'showNewGoalChatStep', 'showNewGoalLoadingStep', 'showNewGoalReviewStep', 'bindNewGoalStepExports'];
exports.steps = ({ click, clickIn }) => [
  ['home-enter', { goTab: 'home' }],
  ['crew-open', click('#homeCompassCrew'), 600],
  ['crew-nudge', click('#btnNudgeCrewMates'), 600],
  ['crew-checkin', click('#btnCrewStartCheckin'), 600],
  ['detail-close-1', click('#homeDetailClose'), 400],
  ['quest-open', click('#homeCompassQuest'), 600],
  ['eval-open', click('#btnOpenEvalModal'), 600],
  ['eval-submit-empty', click('#btnSubmitAppEval'), 800],
  ['eval-close', click('#btnAppEvalClose'), 400],
  ['detail-close-2', click('#homeDetailClose'), 400],
  ['newgoal-open', click('#homeAddGoal'), 800],
  ['newgoal-manual', clickIn('#ngManualBtn'), 800],
  ['newgoal-back-ai', clickIn('#ngBackToAi'), 800],
  ['newgoal-close', { closeModal: true }],
  ['comm-enter', { goTab: 'comm' }],
  ['share-open', click('#btnCommPostFeed'), 1000],
  ['share-preview', clickIn('#sharePreviewBtn'), 800],
  ['share-preview-close', clickIn('#sharePreviewBtn'), 800],
  ['share-close', { closeModal: true }],
  ['tab-roundtrip', { tabRoundTrip: true }],
];
