'use strict';
// #TASK-ES-476 게스트 조작 비교 단계(dom-compare-inline-h1.js 가 읽는다): 구역 H1 2차로 옮긴 네 세포가 불리는 곳 —
//   홈 「내 성장 자랑하기」(openMzShareCardModal) → 1:1 비율 → 닫기
//   체크인 저장 → 첫 체크인 축하 창(triggerFirstCheckinCelebrationModal) → 「홈 콕핏 둘러보기」
//   window.openAvatarLevelUpModal(2) 직접 호출(노출 줄은 index.html 원래 자리) → 성장 키워드 저장(부적절 단어 거름 · bindAvatarGrowthPromptSave) → 확인 닫기
//   window.checkKakaoInAppBrowser() 직접 호출(인앱이 아니면 아무것도 안 함)
// 첫 화면 단추(bindLand*)는 게스트로 부팅한 뒤라 이 하네스로 누르지 않는다 — 화면 시나리오 landing-login-link 가 잰다.
const ev = js => ({ evalFn: js });
exports.globals = ['openAvatarLevelUpModal', 'closeAvatarLevelUpModal', 'filterHarmfulWords', 'bindAvatarLevelUpBackdrop', 'bindAvatarGrowthPromptSave', 'bindAvatarLevelUpShare', 'bindAvatarLevelUpSaveImage',
  'checkKakaoInAppBrowser', 'escapeKakaoInAppBrowser', 'bindLandNickQuickLink', 'bindLandStartBtn', 'bindLandLoginLink', 'bindLandGuestBtn',
  'renderFirstCheckinTutorialBanner', 'triggerFirstCheckinCelebrationModal', 'sendFirstCheckinWelcomeStamps', 'getPeerRunnersForCategory',
  'openFocusAutoPilotModal', 'openMzShareCardModal'];
const typeIn = txt => ev('(function(){ var t = document.getElementById("captureInput"); if(!t) return "missing"; t.value = ' + JSON.stringify(txt) + '; t.dispatchEvent(new Event("input", { bubbles: true })); return "typed"; })()');
exports.steps = ({ click, clickIn }) => [
  ['home-enter', { goTab: 'home' }],
  ['mz-open', click('#mzShareBtn'), 1000],
  ['mz-ratio-1-1', ev('(function(){ var b = [].slice.call(document.querySelectorAll("#modalOverlay button")).find(function(x){ return /1:1/.test(x.textContent); }); if(!b) return "missing"; b.click(); var l = document.getElementById("mzRatioLabel"); return "ratio:" + (l ? l.textContent : "-"); })()'), 600],
  ['mz-close', clickIn('#mzCardCloseBtn'), 600],
  ['kakao-check', ev('(function(){ if(typeof window.checkKakaoInAppBrowser !== "function") return "no-fn"; window.checkKakaoInAppBrowser(); return "banner:" + !!document.getElementById("btnEscapeInAppNotice"); })()')],
  ['lvup-open', ev('(function(){ if(typeof window.openAvatarLevelUpModal !== "function") return "no-fn:" + typeof window.openAvatarLevelUpModal; window.openAvatarLevelUpModal(2); var m = document.getElementById("avatarLevelUpModal"); return m.style.display + "|" + document.getElementById("avatarLevelUpTitle").textContent; })()'), 600],
  ['lvup-prompt', ev('(function(){ var i = document.getElementById("avatarGrowthPromptInput"); if(!i) return "missing"; i.value = "더 강하게 바보"; var b = document.getElementById("btnSaveGrowthPrompt"); if(!b) return "no-btn"; b.click(); return "saved:" + i.value; })()'), 800],
  ['lvup-close', click('#btnConfirmLevelUpClose'), 600],
  ['checkin-type', typeIn('아침 30분 걷기')],
  ['checkin-save', click('#captureSave'), 3500],
  ['first-done', clickIn('#firstCheckinDoneBtn'), 1000],
  ['tab-roundtrip', { tabRoundTrip: true }],
];
