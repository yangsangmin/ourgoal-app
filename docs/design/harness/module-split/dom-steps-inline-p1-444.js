'use strict';
// #TASK-ES-444 게스트 조작 비교 단계(dom-compare-inline-p1.js 가 읽는다): 이번에 옮긴 함수가 불리는 곳을 차례로 누른다.
//   일정: 일자별 배경 사진 창(남은 openCalendarDayBgPickerModal) 에 같은 그림 파일을 넣어 옮긴 compressCalendarBgImage 를 부른다 · 잠금화면 라이브 카드(window.syncLockScreenLiveCard·closeLockScreenLiveCard → buildLockScreenCardPayload)
//   홈: 사진 인증 입력에 같은 그림 파일(옮긴 compressImage) → 미리보기 → 사진 보기 창(openPhotoViewerModal) · 체크인 저장(triggerFirstCheerResponse·scheduleCheerDelivery) · 히트맵 요약(renderHomeGrassSummary) · iOS 설치 안내 창(window.openIosPwaInstallGuideModal)
//   설정: 화면 모드 칩(switchUxMode·renderAdaptiveModeBar) · 설치 안내 창(openPwaInstallGuideModal·switchPwaOsTab·closePwaInstallGuideModal·confirmPwaInstall) · 망설임 기록(window._recordHesitation)
//   소통: 피드 게시 창 미리보기 토글(toggleFeedPostPreview)
//   목표: 마일스톤 완료 축하(남은 celebrateMilestoneDone → 옮긴 localNextActionSuggestion) · 기록: 갓생 스토리카드 창(옮긴 generateMzStoryCanvas, 캔버스 해시)
// 그림 파일은 브라우저 안에서 같은 캔버스 그림(색 칸 4개)으로 만들어 두 앱에 똑같이 넣는다(파일 선택 창은 띄우지 않는다).
const FILE_INTO = sel => ({ evalFn: '(async function(){ var inp = document.querySelector(' + JSON.stringify(sel) + '); if(!inp) return "missing"; var c = document.createElement("canvas"); c.width = 64; c.height = 48; var x = c.getContext("2d"); x.fillStyle = "#3182f6"; x.fillRect(0,0,32,24); x.fillStyle = "#f04452"; x.fillRect(32,0,32,24); x.fillStyle = "#03b26c"; x.fillRect(0,24,32,24); x.fillStyle = "#ffc342"; x.fillRect(32,24,32,24); var blob = await new Promise(function(r){ c.toBlob(r, "image/png"); }); var dt = new DataTransfer(); dt.items.add(new File([blob], "p1-test.png", { type: "image/png" })); inp.files = dt.files; inp.dispatchEvent(new Event("change", { bubbles: true })); return "file:" + blob.size; })()' });
const ev = js => ({ evalFn: js });
exports.globals = ['openCalendarDayBgPickerModal', 'syncLockScreenLiveCard', 'closeLockScreenLiveCard', 'buildLockScreenCardPayload', 'compressCalendarBgImage', 'openChallengeRoomModal', 'triggerFirstCheerResponse',
  'toggleFeedPostPreview', 'openPhotoViewerModal', 'compressImage', 'renderHomeGrassSummary', 'switchUxMode', 'getUxMode', 'renderAdaptiveModeBar', '_recordHesitation', '_uxTelemetry',
  'renderIosPwaBanner', 'quickCreateStarterGoal', 'generateMzStoryCanvas', 'localTodayMission', 'localNextActionSuggestion', 'openIosPwaInstallGuideModal', 'initKeyboardShield', 'openPwaInstallGuideModal', 'closePwaInstallGuideModal', 'switchPwaOsTab', 'confirmPwaInstall'];
exports.steps = ({ click, clickIn }) => [
  ['home-enter', { goTab: 'home' }, 6000],
  ['grass-card', ev('(function(){ var e = document.getElementById("homeGrassSummaryCard"); return e ? "grass:" + e.innerHTML.length + ":" + e.textContent.replace(/\s+/g, " ").trim().slice(0, 200) : "none"; })()')],
  ['photo-file', FILE_INTO('#capturePhotoInput'), 1500],
  ['photo-preview-state', ev('(function(){ var w = document.getElementById("capturePhotoPreview"); return w ? "preview:" + w.className + ":" + (w.innerHTML.length > 0) + ":" + getComputedStyle(w).display : "none"; })()')],
  ['photo-viewer', click('#capturePhotoPreview'), 600],
  ['photo-viewer-close', { closeModal: true }],
  ['ios-guide', ev('(function(){ if(typeof window.openIosPwaInstallGuideModal !== "function") return "no-fn"; window.openIosPwaInstallGuideModal(); return "opened"; })()'), 600],
  ['ios-guide-close', { closeModal: true }],
  ['checkin-type', ev('(function(){ var i = document.getElementById("captureInput"); if(!i) return "missing"; i.value = "오늘 5km 달리기를 했다"; i.dispatchEvent(new Event("input", { bubbles: true })); return "value"; })()')],
  ['checkin-save', click('#captureSave'), 4000],
  ['checkin-close', { closeModal: true }],
  ['cal-enter', { goTab: 'calendar' }],
  ['bg-picker-open', ev('(function(){ if(typeof window.openCalendarDayBgPickerModal !== "function") return "no-fn"; var d = new Date(); var k = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); window.openCalendarDayBgPickerModal(k); return "opened"; })()'), 600],
  ['bg-picker-file', FILE_INTO('#calDayBgFileInput'), 2000],
  ['bg-picker-close', { closeModal: true }],
  ['lock-live-sync', ev('(async function(){ try { var r = await window.syncLockScreenLiveCard(false); return "sync:" + JSON.stringify(r); } catch(e){ return "throw:" + String(e).slice(0, 80); } })()'), 600],
  ['lock-live-close', ev('(async function(){ try { var r = await window.closeLockScreenLiveCard(); return "close:" + JSON.stringify(r); } catch(e){ return "throw:" + String(e).slice(0, 80); } })()'), 600],
  ['settings-enter', { goTab: 'settings' }],
  ['mode-gamified', click('#btnModeGamified')],
  ['mode-analyst', click('#btnModeAnalyst')],
  ['mode-minimal', click('#btnModeMinimal')],
  ['pwa-open', click('#btnPwaInstallGuide'), 600],
  ['pwa-android', click('#btnPwaOsAndroid')],
  ['pwa-ios', click('#btnPwaOsIos')],
  ['pwa-close', click('#btnClosePwaGuide'), 400],
  ['pwa-open-2', click('#btnPwaInstallGuide'), 600],
  ['pwa-confirm', click('#btnConfirmPwaInstall'), 400],
  ['hesitation', ev('(function(){ if(typeof window._recordHesitation !== "function") return "no-fn"; window._recordHesitation("p1-test"); var t = window._uxTelemetry; return "hes:" + (t && t.hesitation ? t.hesitation.length + ":" + t.hesitation[t.hesitation.length - 1].target : "none"); })()')],
  ['comm-enter', { goTab: 'comm' }],
  ['post-open', click('#btnCommPostFeed'), 1200],
  ['post-preview-on', clickIn('#sharePreviewBtn'), 600],
  ['post-preview-off', clickIn('#sharePreviewBtn'), 600],
  ['post-close', { closeModal: true }],
  ['goals-enter', { goTab: 'goals' }, 1500],
  ['ms-complete', click('#screen-goals .ms-status.doing'), 2500],
  ['ms-celebrate-close', { closeModal: true }, 1500],
  ['records-enter', { goTab: 'records' }],
  ['story-open', click('#sRecStoryCardBtn'), 2000],
  ['story-canvas', ev('(function(){ var c = document.getElementById("mzStoryCanvasEl"); if(!c) return "none"; var u = c.toDataURL("image/png"); var h = 2166136261; for (var i = 0; i < u.length; i++){ h ^= u.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return "canvas:" + c.width + "x" + c.height + ":h" + h.toString(16); })()')],
  ['story-close', { closeModal: true }],
  ['tab-roundtrip', { tabRoundTrip: true }],
];
