'use strict';
// #TASK-ES-483 게스트 조작 비교 단계(dom-compare-inline-h1.js 가 읽는다): 구역 H1 3차로 옮긴 세 세포가 불리는 곳 —
//   기록 입력 「외부 기록 불러오기」(bindImportExternalBtn 처리기) → 샘플 줄 고르기 → 다시 열어 「CSV/줄글 대량 가져오기」 → 닫기
//   window.openAddAttachmentModal(빈 대상) 직접 호출(노출 줄은 index.html 원래 자리) → 닫기 · window.renderAttachmentChipsHtml 직접 호출
//   체크인 저장 → 시드 게스트 목표에 대해 maybeShowGoalUpdateModal 이 도는 경로(제안이 없으면 창 없음 — 양쪽 같은 값)
const ev = js => ({ evalFn: js });
exports.globals = ['openHomeCustomizer', 'bindImportExternalBtn', 'bindPersonalGuideBtn', 'openAddAttachmentModal', 'openAttachmentViewer', 'renderAttachmentChipsHtml', 'renderInlineAttachmentChips', 'wireAttachmentChipClicks',
  'applyGoalAgentOp', 'buildGoalFromAgentData', 'normalizeSequentialMilestoneDates', 'maybeShowGoalUpdateModal', 'sanitizeSuggestions', 'findSuggestionTarget', 'applySuggestion', 'describeSuggestion'];
const typeIn = txt => ev('(function(){ var t = document.getElementById("captureInput"); if(!t) return "missing"; t.value = ' + JSON.stringify(txt) + '; t.dispatchEvent(new Event("input", { bubbles: true })); return "typed"; })()');
exports.steps = ({ click, clickIn }) => [
  ['home-enter', { goTab: 'home' }],
  ['ext-open', click('#importExternalBtn'), 800],
  ['ext-pick', clickIn('[data-ext="x2"]'), 800],
  ['ext-input', ev('(function(){ var t = document.getElementById("captureInput"); return "value:" + (t ? t.value : "-"); })()')],
  ['ext-open-2', click('#importExternalBtn'), 800],
  ['ext-universal', clickIn('#extOpenUniversalModalBtn'), 1000],
  ['ext-close', { closeModal: true }],
  ['att-open', ev('(function(){ if(typeof window.openAddAttachmentModal !== "function") return "no-fn"; window.__h1att = { attachments: [] }; window.openAddAttachmentModal(window.__h1att, function(){}, function(){}); return "opened"; })()'), 800],
  ['att-close', { closeModal: true }],
  ['att-chips', ev('(function(){ if(typeof window.renderAttachmentChipsHtml !== "function") return "no-fn"; return String(window.renderAttachmentChipsHtml([{ id: "a1", type: "link", title: "참고 링크", url: "https://example.com" }])).slice(0, 400); })()')],
  ['checkin-type', typeIn('아침 30분 걷기 완료')],
  ['checkin-save', click('#captureSave'), 3500],
  ['checkin-close', { closeModal: true }],
  ['tab-roundtrip', { tabRoundTrip: true }],
];
