'use strict';
// #TASK-ES-453 게스트 조작 비교 단계(dom-compare-inline-p1.js 가 읽는다): 옮긴 refreshGoalStatusSummary 가 불리는 곳 —
//   목표 탭 상세를 그릴 때(요약이 없거나 낡았으면 부름) · 종합상황 막대 펼치기 · 마일스톤 상태를 바꿔 목표 해시가 바뀐 뒤 다시 그리기 · window.refreshGoalStatusSummary 직접 호출(같은 해시면 다시 부르지 않음)
const ev = js => ({ evalFn: js });
exports.globals = ['refreshGoalStatusSummary', 'computeGoalStatusHash', 'localGoalStatusSummary'];
exports.steps = ({ click }) => [
  ['goals-enter', { goTab: 'goals' }, 6000],
  ['status-toggle', click('#goalStatusToggleBtn'), 800],
  ['status-text', ev('(function(){ var e = document.getElementById("goalStatusText"); return e ? "status:" + e.textContent.trim().slice(0, 200) : "none"; })()')],
  ['ms-cycle', click('#screen-goals .ms-status.todo'), 2500],
  ['ms-cycle-close', { closeModal: true }, 1500],
  ['status-text-2', ev('(function(){ var e = document.getElementById("goalStatusText"); return e ? "status:" + e.textContent.trim().slice(0, 200) : "none"; })()')],
  ['refresh-direct', ev('(async function(){ var s = window.OurgoalAppScope.scope.state; var g = s.profile.goals[0]; var r = await window.refreshGoalStatusSummary(g, window.computeGoalStatusHash(g)); var c = (s.profile.settings.goalStatusSummaries || {})[g.id]; return "refresh:" + JSON.stringify(r === undefined ? null : r) + "|" + (c ? c.text.slice(0, 120) + "|" + (c.hash === window.computeGoalStatusHash(g)) : "none"); })()'), 1500],
  ['records-enter', { goTab: 'records' }],
  ['tab-roundtrip', { tabRoundTrip: true }],
];
