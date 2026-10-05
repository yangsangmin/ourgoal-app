'use strict';
// #TASK-ES-436 게스트 조작 비교 단계(dom-compare-inline-p1.js 가 읽는다): 이번에 옮긴 함수가 불리는 곳을 차례로 누른다.
//   목표 탭: 일정 알약(openScheduleSetupModal·applyScheduleUpdate·formatSchedulePillHtml) → AI 목표 어시스턴트 전송(sendGoalAgentMessage·requestGoalAgentDiff·showGoalAgentLoadingStep)
//            → 마일스톤 상태 완료(celebrateMilestoneDone·requestNextActionSuggestion) → 종합상황 로컬 요약(window.localGoalStatusSummary·computeGoalStatusHash)
//   홈: AI 피드백 단계 막대(initFeedbackTierBar) → 체크인 저장(requestAIFeedback → requestServerAIFeedback·requestGeminiFeedback·localFeedback, buildFeedbackPrompt …)
const val = (sel, text) => ({ evalFn: '(function(){ var el = document.querySelector(' + JSON.stringify(sel) + '); if(!el) return "missing"; el.value = ' + JSON.stringify(text) + '; el.dispatchEvent(new Event("input", { bubbles: true })); return "value"; })()' });
exports.globals = ['openScheduleSetupModal', 'applyScheduleUpdate', 'formatSchedulePillHtml', 'showGoalAgentReviewStep', 'computeGoalStatusHash', 'localGoalStatusSummary', 'refreshGoalStatusSummary',
  'sendGoalAgentMessage', 'requestGoalAgentDiff', 'celebrateMilestoneDone', 'requestAIFeedback', 'initFeedbackTierBar', 'localFeedback', 'requestServerAIFeedback', 'GeminiQuotaDispatcher', 'PREMIUM_FEEDBACK_CATALOG'];
exports.steps = ({ click, clickIn }) => [
  ['goals-enter', { goTab: 'goals' }, 3000],
  ['sched-ms-open', click('button.schedule-pill-btn[data-schedmsid="m2"][data-schedlevel="ms"]'), 600],
  ['sched-ms-tomorrow', clickIn('#schedPresetTomorrow')],
  ['sched-ms-save', clickIn('#schedSaveBtn'), 600],
  ['sched-task-open', click('button.schedule-pill-btn[data-schedtid="t4"]'), 600],
  ['sched-task-1w', clickIn('#schedPreset1W')],
  ['sched-task-save', clickIn('#schedSaveBtn'), 600],
  ['sched-ms3-open', click('button.schedule-pill-btn[data-schedmsid="m3"][data-schedlevel="ms"]'), 600],
  ['sched-ms3-cancel', clickIn('#schedCancelBtn')],
  ['status-summary', { evalFn: '(function(){ var g = (window.OurgoalAppScope.scope.state && window.OurgoalAppScope.scope.state.profile && window.OurgoalAppScope.scope.state.profile.goals || [])[0]; if(!g) return "no-goal"; return "hash:" + window.computeGoalStatusHash(g) + "|" + window.localGoalStatusSummary(g); })()' }],
  ['agent-toggle', click('#btnToggleGoalAgent'), 400],
  ['agent-type', val('#goalAgentInput', '마감일을 일주일 미뤄줘')],
  ['agent-send', click('#goalAgentSendBtn'), 3000],
  ['agent-close', { closeModal: true }],
  ['ms-complete', click('#screen-goals .ms-status.doing'), 2500],
  ['ms-celebrate-close', { closeModal: true }, 1500],
  ['home-enter', { goTab: 'home' }],
  ['tier-medium', click('#checkinFeedbackTierBar [data-fbtier="medium"]')],
  ['tier-macro', click('#checkinFeedbackTierBar [data-fbtier="macro"]')],
  ['tier-default', click('#checkinFeedbackTierBar [data-fbtier="default"]')],
  ['checkin-type', val('#captureInput', '오늘 5km 달리기를 했다')],
  ['checkin-save', click('#captureSave'), 4000],
  ['checkin-close', { closeModal: true }],
  ['records-enter', { goTab: 'records' }],
  ['tab-roundtrip', { tabRoundTrip: true }],
];
