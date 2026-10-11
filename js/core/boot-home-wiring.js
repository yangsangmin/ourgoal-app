/**
 * OurGoal Boot Home Wiring (앱 시동 — 홈 체크인 · 피드백 · 템플릿 백과 · 목표 창 단추 연결)
 *
 * 앱이 뜰 때 홈과 목표 둘레의 단추를 원래 순서 그대로 연결하는 구역 함수다.
 * bootHomeAndGoalWiring — 집중 타이머 값, 퀵 루틴 칩·음성 체크인·사진 첨부·글자 수 힌트·기록 단추, 맞춤 피드백 봇 설정 열고 닫기, 가이드 단추, 템플릿 백과 창의 닫기·탭·바깥 누름, 앱 평가 창, 새 목표 단추, 성장 자랑하기 단추, AI 목표 어시스턴트 서랍과 보내기, 보관함 기간·쪽 설정을 차례로 건다.
 * bootGoalsAndTeamState — 템플릿 분류 값과 빠른 목표 추가 함수를 window 에 달고, 입력칸 가림 방지를 시작하고, 실시간 채널 값 자리를 만들고, 팀 목표 화면 함수와 팀 댓글 보내기를 연결한다.
 * #TASK-ES-650(구역 이전 — 앱이 뜰 때 한 번 도는 문을 순서 그대로 구역 함수로): index.html 인라인 IIFE 의 연속 구역(이전 전 2996~3173 · 3205~3271줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js mode:"region")로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 구역 안에서만 쓰던 var 는 그 함수의 지역 변수가 됐다.
 * 로드 중 바로 돌던 문들은 순서 그대로 함수 하나로 감싸 index.html 원래 자리에서 부른다. index.html 은 IIFE 머리에서 그 함수를 같은 이름으로 가져온다.
 * 설계: docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5절 · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalUiHelpers = global.OurgoalUiHelpers || {};

  /* ---- 이전 전 index.html 2996~3173줄(#TASK-ES-650 생성기 표지) ---- */
  function bootHomeAndGoalWiring() { /* [#TASK-ES-650] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* ============ UX Telemetry (Hesitation & Rage Tap) ============ */
  /* [#TASK-ES-548] _uxTelemetry → js/tabs/settings/ux-telemetry.js 로 옮김(인라인 3단계 구역 Z5 표준 2 — 앞 주석 포함) */

  /* [#TASK-ES-444] _recordHesitation → js/tabs/settings/adaptive-ux.js 로 옮김(인라인 스크립트 세포화 P1) */
  L.bindRageTapTelemetry(); /* [#TASK-ES-548] 로드 중 문(앞 주석 포함) → js/tabs/settings/ux-telemetry.js 의 bindRageTapTelemetry 로 옮김 — 원래 자리에서 부른다 */

  /* ============ iOS 사파리 홈 화면 추가 안내 배너 & 실시간 알림 가이드 (#TASK-ES-234) ============ */
  /* [#TASK-ES-444] renderIosPwaBanner · openIosPwaInstallGuideModal → js/tabs/settings/pwa-install.js 로 옮김(인라인 스크립트 세포화 P1) */

  /* [#TASK-ES-548] STARTER_GOAL_TEMPLATES → js/tabs/goals/starter-goal-templates.js 로 옮김(인라인 3단계 구역 Z5 표준 2 — 앞 주석 포함) */

  /* [#TASK-ES-444] quickCreateStarterGoal → js/tabs/goals/starter-goal.js 로 옮김(인라인 스크립트 세포화 P1) */

  /* [#TASK-ES-556] renderHome → js/tabs/home/home-render.js 로 옮김(인라인 3단계 구역 Z6 표준 3 — 앞 주석 포함) */

  /* [#TASK-ES-444] renderHomeGrassSummary → js/tabs/records/heatmap-summary.js 로 옮김(인라인 스크립트 세포화 P1 — 구획 주석 포함) */

  /* [#TASK-ES-596] announceToA11y → js/tabs/settings/a11y-announce.js 로 옮김(A1 시범 — 남은 작은 함수 2개 이전(동작 보존 확인 경로 첫 사용) — 앞 주석 포함) */
  /* [#TASK-ES-568] renderTodayGlancePill · renderDailyQuestBar → js/tabs/home/quest-summary.js 로 옮김(잔여 책임 분열 — 교대근무 루틴·성장차트·홈 퀘스트 — 앞 주석 포함) */

  /* [#TASK-ES-444] generateMzStoryCanvas → js/tabs/comm/story-canvas.js 로 옮김(인라인 스크립트 세포화 P1 — 구획 주석 포함) */

  /* ============ 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot) ============ */
  window.OurgoalAppState.defineVar('focusTimerInterval', null);
  window.OurgoalAppState.defineVar('focusTimerSeconds', 25 * 60);
  window.OurgoalAppState.defineVar('focusTimerRunning', false);
  /* [#TASK-ES-476] openFocusAutoPilotModal · openMzShareCardModal → js/tabs/goals/focus-autopilot.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  /* [#TASK-ES-423] openSelectCompanionForStoryModal · openSelectTeamForStoryModal → js/tabs/comm/story-card-send.js 로 옮김(인라인 스크립트 세포화 1차 — 구획 주석 포함) */


  /* ============ 원터치 퀵 루틴 칩 ============ */
  window.OurgoalAppState.define('qRoutineRow', document.getElementById('quickRoutineRow'));
  L.bindQuickRoutineChips(); /* [#TASK-ES-640] 로드 중 문(앞 주석 포함) → js/tabs/records/checkin-input-wiring.js 의 bindQuickRoutineChips 로 옮김 — 원래 자리에서 부른다 */

  /* ============ 🎙️ 마이크 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 (#TASK-ES-227) ============ */
  /* [#TASK-ES-556] openMicPermissionGuideModal → js/tabs/records/mic-permission-guide.js 로 옮김(인라인 3단계 구역 Z6 표준 3 — 앞 주석 포함) */

  L.startVoiceCheckin(); /* [#TASK-ES-640] 로드 중 문(앞 주석 포함) → js/tabs/records/checkin-input-wiring.js 의 startVoiceCheckin 로 옮김 — 원래 자리에서 부른다 */

  /* ============ 사진 인증 & 뷰어 모달 (가상유저 요청 P1) ============ */
  window.OurgoalAppState.defineVar('pendingCapturePhoto', null);

  /* [#TASK-ES-444] openPhotoViewerModal · compressImage → js/tabs/records/photo-proof.js 로 옮김(인라인 스크립트 세포화 P1) */

  window.OurgoalAppState.define('capturePhotoBtn', document.getElementById('capturePhotoBtn'));
  window.OurgoalAppState.define('capturePhotoInput', document.getElementById('capturePhotoInput'));
  window.OurgoalAppState.define('capturePhotoPreview', document.getElementById('capturePhotoPreview'));
  L.bindCapturePhoto(); /* [#TASK-ES-640] 로드 중 문(앞 주석 포함) → js/tabs/records/checkin-input-wiring.js 의 bindCapturePhoto 로 옮김 — 원래 자리에서 부른다 */

  /* ============ 체크인 입력 글자수 힌트 (#TASK-ES-367: 열 수 없던 활동 테마 선택 창·배지 제거, 승인 2026-10-04) ============ */
  window.OurgoalAppState.define('liveMeta', document.getElementById('captureLiveMeta'));
  window.OurgoalAppState.define('liveCount', document.getElementById('captureCharCount'));
  window.OurgoalAppState.define('capInput', document.getElementById('captureInput'));
  L.bindCaptureLiveMeta(); /* [#TASK-ES-439] 로드 중 문(앞 주석 포함) → js/tabs/records/checkin-capture.js 의 bindCaptureLiveMeta 로 옮김 — 원래 자리에서 부른다 */
  L.bindCaptureSave(); /* [#TASK-ES-439] 로드 중 문(앞 주석 포함) → js/tabs/records/checkin-capture.js 의 bindCaptureSave 로 옮김 — 원래 자리에서 부른다 */

  /* [#TASK-ES-444] triggerFirstCheerResponse · scheduleCheerDelivery → js/tabs/comm/first-cheer.js 로 옮김(인라인 스크립트 세포화 P1 — 구획 주석 포함) */

  /* [#TASK-ES-556] THEME_FEEDBACK_PROMPTS → js/tabs/records/ai-feedback-catalog.js 로 옮김(인라인 3단계 구역 Z6 표준 3 — 앞 주석 포함) */

  /* [#TASK-ES-436] getUpcomingSchedulesForAI · getRecentCheckinsForAI · getLastFeedbackAdvice · initFeedbackTierBar · buildFeedbackPrompt · parseFeedbackJSON · requestAIFeedback → js/tabs/records/ai-feedback.js 로 옮김(인라인 스크립트 세포화 P1) */

  /* ============ [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) 방어 및 지수 백오프 큐 ============ */
  /* [#TASK-ES-556] PREMIUM_FEEDBACK_CATALOG · GeminiQuotaDispatcher → js/tabs/records/ai-feedback-catalog.js 로 옮김(인라인 3단계 구역 Z6 표준 3 — 앞 주석 포함) */

  /* [#TASK-ES-436] requestServerAIFeedback → js/tabs/records/ai-feedback-providers.js 로 옮김(인라인 스크립트 세포화 P1) */
  var requestClaudeFeedback = L.requestServerAIFeedback;
  /* [#TASK-ES-556] DONE_KEYWORDS → js/tabs/records/ai-feedback-catalog.js 로 옮김(인라인 3단계 구역 Z6 표준 3 — 앞 주석 포함) */
  /* [#TASK-ES-436] localFeedback → js/tabs/records/ai-feedback-providers.js 로 옮김(인라인 스크립트 세포화 P1) */
  /* [#TASK-ES-483] findSuggestionTarget · sanitizeSuggestions · describeSuggestion · applySuggestion · maybeShowGoalUpdateModal → js/tabs/goals/goal-update-suggest.js 로 옮김(인라인 어려움 구역 H1 3차 — 앞 주석 포함) */

  /* ============ 맞춤 피드백 봇 설정 ============ */
  /* [#TASK-ES-492] customFeedbackStatusSuffix · refreshCustomFeedbackButtons · getSavedFeedbackPresets · persistFeedbackPresets · openFeedbackSetup → js/tabs/settings/feedback-bot-setup.js 로 옮김(인라인 어려움 기관 묶음 이전 3차 — 앞 주석 포함) */
  /* [#TASK-ES-492] closeFeedbackSetup → js/tabs/settings/feedback-bot-setup.js 로 옮김(인라인 어려움 기관 묶음 이전 3차 — 앞 주석 포함) */
  /* [#TASK-ES-492] generateCustomFeedbackPrompt · fbBotBubbleHtml · renderFeedbackSetup · openFeedbackSetupGated → js/tabs/settings/feedback-bot-setup.js 로 옮김(인라인 어려움 기관 묶음 이전 3차 — 앞 주석 포함) */
  document.getElementById('customFeedbackBtn').addEventListener('click', L.openFeedbackSetupGated);
  document.getElementById('settingsCustomFeedbackBtn').addEventListener('click', L.openFeedbackSetupGated);
  document.getElementById('fbSetupBack').addEventListener('click', L.closeFeedbackSetup);
  /* [#TASK-ES-492] verdictClass · renderFeedbackSlot · getUserAvatarHtml · showCheckinFeedbackSheet · closeCheckinFeedbackSheet → js/tabs/records/checkin-feedback.js 로 옮김(인라인 어려움 기관 묶음 이전 3차 — 앞 주석 포함) */
  /* [#TASK-ES-492] instantShareCheckinToFeed → js/tabs/records/checkin-feedback.js 로 옮김(인라인 어려움 기관 묶음 이전 3차 — 앞 주석 포함) */
  /* [#TASK-ES-492] renderRecordFeedbackSlot · timeAgoStr → js/tabs/records/checkin-feedback.js 로 옮김(인라인 어려움 기관 묶음 이전 3차 — 앞 주석 포함) */
  /* ============ 목표 & 기록 선택 피드 공유 모달 (전면 고도화) ============ */
  /* [#TASK-ES-466] addSimulatedCheerAndReplyToPost · openShareToFeedModal → js/tabs/records/share-to-feed.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  /* ==========================================================================
     [#TASK-ES-301] 피드 게시 모달 내 '미리보기' 토글 직통 헬퍼
     ========================================================================== */
  /* [#TASK-ES-444] toggleFeedPostPreview → js/tabs/comm/feed-post-preview.js 로 옮김(인라인 스크립트 세포화 P1) */

  /* ============ 외부 데이터 불러오기 (mock) ============ */
  L.bindImportExternalBtn(); /* [#TASK-ES-483] 로드 중 문(앞 주석 포함) → js/tabs/records/external-import.js 의 bindImportExternalBtn 로 옮김 — 원래 자리에서 부른다 */
  var topBtnGuide = document.getElementById('topHomeGuideBtn'); if(topBtnGuide){ topBtnGuide.addEventListener('click', function(){ if(window.showTabUsageGuide) showTabUsageGuide((L.state && L.state.activeTab) || 'home'); }); }

  window.OurgoalAppState.define('btnShowGuide', document.getElementById('btnShowPersonalGuideModal'));
  L.bindPersonalGuideBtn(); /* [#TASK-ES-483] 로드 중 문(앞 주석 포함) → js/tabs/records/external-import.js 의 bindPersonalGuideBtn 로 옮김 — 원래 자리에서 부른다 */

  /* ============ [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용 ============ */
  /* [#TASK-ES-591] REAL_USER_TEMPLATES → js/tabs/goals/template-encyclopedia-modal.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  window.OurgoalAppState.defineVar('_tplActiveTab', 'realUser');
  window.OurgoalAppState.defineVar('_tplAiCurCat', 'all');
  /* [#TASK-ES-591] openTemplateEncyclopediaModal · closeTemplateEncyclopediaModal → js/tabs/goals/template-encyclopedia-modal.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  /* [#TASK-ES-591] switchTemplateEncyclopediaTab · getLikedTemplateMap · setLikedTemplateMap · cheerRealUserTemplate → js/tabs/goals/template-encyclopedia-modal.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  /* [#TASK-ES-591] copyRealUserTemplate → js/tabs/goals/template-encyclopedia-modal.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  /* [#TASK-ES-591] getUserSharedTemplates · saveUserSharedTemplates · shareMyActiveGoalAsTemplate → js/tabs/goals/template-encyclopedia-modal.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  /* [#TASK-ES-591] renderRealUserTemplatesList · renderAiTemplatesList → js/tabs/goals/template-encyclopedia-modal.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  // 모달 닫기 및 탭 클릭 바인딩
  var btnCloseTplEncycl = document.getElementById('btnTplEncyclopediaClose');
  if(btnCloseTplEncycl) btnCloseTplEncycl.addEventListener('click', L.closeTemplateEncyclopediaModal);
  var tabBtnReal = document.getElementById('tabTplRealUser');
  if(tabBtnReal) tabBtnReal.addEventListener('click', function(){ L.switchTemplateEncyclopediaTab('realUser'); });
  var tabBtnAi = document.getElementById('tabTplOurgoalAi');
  if(tabBtnAi) tabBtnAi.addEventListener('click', function(){ L.switchTemplateEncyclopediaTab('ourgoalAi'); });

  window.OurgoalAppState.define('modalTplEncyclElem', document.getElementById('templateEncyclopediaModal'));
  L.bindTemplateEncyclopediaModalClick(); /* [#TASK-ES-591] 로드 중 문(앞 주석 포함) → js/tabs/goals/template-encyclopedia-modal.js 의 bindTemplateEncyclopediaModalClick 로 옮김 — 원래 자리에서 부른다 */
  L.bindTemplateEncyclopediaEscape(); /* [#TASK-ES-591] 로드 중 문(앞 주석 포함) → js/tabs/goals/template-encyclopedia-modal.js 의 bindTemplateEncyclopediaEscape 로 옮김 — 원래 자리에서 부른다 */

  // 목표탭 상단 템플릿백과사전 버튼 바인딩 (#TASK-ES-187 / #TASK-ES-303: 서브탭 전환 및 전체화면 팝업 오픈) — [#TASK-ES-514] 처리기는 이 한 벌(단추의 인라인 onclick 은 같은 창을 한 번 더 열던 이중 처리기라 지움)
  window.OurgoalAppState.define('btnHeaderTplEncycl', document.getElementById('btnGoalTemplateEncyclopedia'));
  L.bindHeaderTemplateEncyclopediaClick(); /* [#TASK-ES-591] 로드 중 문(앞 주석 포함) → js/tabs/goals/template-encyclopedia-modal.js 의 bindHeaderTemplateEncyclopediaClick 로 옮김 — 원래 자리에서 부른다 */

  // 전역 함수 노출

  /* ============ [#TASK-ES-146] 아워골 평가해주기 90% 팝업 ============ */
  /* [#TASK-ES-466] openAppEvaluationModal · closeAppEvaluationModal → js/tabs/settings/app-evaluation.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  var btnEvalBanner = document.getElementById('btnOpenEvalModal');
  if(btnEvalBanner){
    btnEvalBanner.addEventListener('click', L.openAppEvaluationModal);
  }
  var btnEvalClose = document.getElementById('btnAppEvalClose');
  if(btnEvalClose){
    btnEvalClose.addEventListener('click', L.closeAppEvaluationModal);
  }
  window.OurgoalAppState.define('modalEvalElem', document.getElementById('appEvaluationModal'));
  L.bindAppEvalBackdrop(); /* [#TASK-ES-466] 로드 중 문(앞 주석 포함) → js/tabs/settings/app-evaluation.js 의 bindAppEvalBackdrop 로 옮김 — 원래 자리에서 부른다 */
  /* [#TASK-ES-466] resetAppEvaluationForm → js/tabs/settings/app-evaluation.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  window.OurgoalAppState.define('btnSubmitEval', document.getElementById('btnSubmitAppEval'));
  L.bindAppEvalSubmit(); /* [#TASK-ES-466] 로드 중 문(앞 주석 포함) → js/tabs/settings/app-evaluation.js 의 bindAppEvalSubmit 로 옮김 — 원래 자리에서 부른다 */
  L.bindHomeAddGoal(); /* [#TASK-ES-466] 로드 중 문(앞 주석 포함) → js/tabs/settings/app-evaluation.js 의 bindHomeAddGoal 로 옮김 — 원래 자리에서 부른다 */

  /* [#TASK-ES-433] 홈 「내 성장 확인하기」·「내 성장 자랑하기」 처리기는 시작 때 한 벌씩 — renderHome 은 목표 0개면 일찍 끝나 거기서 걸던 처리기가 게스트에겐 없었다 */
  var challengeBtn = document.getElementById('homeChallengeRoomBtn');
  if(challengeBtn){
    challengeBtn.onclick = function(){ L.setTab('records'); };
  }
  document.getElementById('mzShareBtn').addEventListener('click', function(){ /* [#TASK-ES-433] 처리기 한 벌: 「내 성장 자랑하기」 = 갓생 카드 창만 연다(소통 탭 이동 없음) */
    L.openMzShareCardModal();
  });

  /* ============ New goal modal ============ */
  /* [#TASK-ES-466] promptNewGoal → js/tabs/goals/new-goal-modal.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  /* [#TASK-ES-466] localGoalTemplate · generateGoalTemplate · showNewGoalChatStep · showNewGoalLoadingStep · showNewGoalReviewStep · showNewGoalManualForm → js/tabs/goals/new-goal-modal.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  L.bindNewGoalStepExports(); /* [#TASK-ES-466] 로드 중 문(앞 주석 포함) → js/tabs/goals/new-goal-modal.js 의 bindNewGoalStepExports 로 옮김 — 원래 자리에서 부른다 */

  /* [#TASK-ES-436] goalAgentSnapshot · requestGoalAgentDiff · sanitizeAttachments → js/tabs/goals/ai-agent.js 로 옮김(인라인 스크립트 세포화 P1 — 구획 주석 포함) */

  /* ============ 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) ============ */
  /* ============ 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) ============ */
  /* [#TASK-ES-483] renderAttachmentChipsHtml · renderInlineAttachmentChips · openAttachmentViewer · openAddAttachmentModal → js/tabs/goals/attachments.js 로 옮김(인라인 어려움 구역 H1 3차 — 앞 주석 포함) */
  /* [#TASK-ES-483] wireAttachmentChipClicks · normalizeSequentialMilestoneDates · buildGoalFromAgentData · applyGoalAgentOp → js/tabs/goals/attachments.js 로 옮김(인라인 어려움 구역 H1 3차 — 앞 주석 포함) */
  /* ============ 목표 AI 생성 전체 템플릿 양식 및 세부 항목 미리보기 (Req 5) ============ */
  /* [#TASK-ES-436] renderGoalOpsFullPreviewHtml · showGoalAgentLoadingStep · showGoalAgentReviewStep → js/tabs/goals/ai-agent.js 로 옮김(인라인 스크립트 세포화 P1) */
  /* [#TASK-ES-436] sendGoalAgentMessage → js/tabs/goals/ai-agent.js 로 옮김(인라인 스크립트 세포화 P1) */
  window.OurgoalAppState.define('toggleAgentBtn', document.getElementById('btnToggleGoalAgent'));
  L.bindGoalAgentToggle(); /* [#TASK-ES-638] 로드 중 문(앞 주석 포함) → js/tabs/goals/goal-agent-toggle.js 의 bindGoalAgentToggle 로 옮김 — 원래 자리에서 부른다 */
  document.getElementById('goalAgentSendBtn').addEventListener('click', function(){ L.sendGoalAgentMessage(); });
  document.getElementById('goalAgentInput').addEventListener('keydown', function(e){ if(e.key==='Enter') L.sendGoalAgentMessage(); });

  /* [#TASK-ES-375] buildGoalSnapshot · goalSnapshotSummary · exportGoalSnapshot → js/tabs/goals/goal-export.js 로 옮김(목표 탭 세포 2차) */

  /* [#TASK-ES-520] restoreGoal · goalAchievement → js/tabs/goals/goal-archive.js 로 옮김(인라인 3단계 Z4 — FN_NAMES 묶음(목표 보관·히트맵·표 집계·표 추이·여러 지표 SVG) — 앞 주석 포함) */
  L.bindArchivedPeriodSetter(); /* [#TASK-ES-520] 로드 중 문(앞 주석 포함) → js/tabs/goals/goal-archive.js 의 bindArchivedPeriodSetter 로 옮김 — 원래 자리에서 부른다 */
  L.bindArchivedPageSetter(); /* [#TASK-ES-520] 로드 중 문(앞 주석 포함) → js/tabs/goals/goal-archive.js 의 bindArchivedPageSetter 로 옮김 — 원래 자리에서 부른다 */
  } /* bootHomeAndGoalWiring */

  /* ---- 이전 전 index.html 3205~3271줄(#TASK-ES-650 생성기 표지) ---- */
  function bootGoalsAndTeamState() { /* [#TASK-ES-650] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* [#TASK-ES-481] ROUTINE_TEMPLATES_AI · ROUTINE_TEMPLATES_REAL · TEAM_TEMPLATES_AI · TEAM_TEMPLATES_REAL · PERSONAL_TEMPLATES_REAL · renderTemplateEncyclopediaScreen → js/tabs/goals/template-encyclopedia.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  window._subtabTplDomain = L._subtabTplDomain;
  window._subtabTplType = L._subtabTplType;

  /* ==========================================================================
     [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA (#TASK-UIUX-PHASE4-GOALS)
     ========================================================================== */

  window.selectedGoalSmartTag = 'health';
  /* [#TASK-ES-640] selectSmartTag → js/tabs/goals/goal-fast-add.js 로 옮김(시동 배선 감싸기 2차 — 체크인 입력 연결 · 팀 목표 댓글 보내기 · 샘플 기록 정리 · 빠른 목표 추가 — 앞 주석 포함) */
  window.selectSmartTag = L.selectSmartTag;
  /* [#TASK-ES-640] handleGoalFastAddSubmit → js/tabs/goals/goal-fast-add.js 로 옮김(시동 배선 감싸기 2차 — 체크인 입력 연결 · 팀 목표 댓글 보내기 · 샘플 기록 정리 · 빠른 목표 추가 — 앞 주석 포함) */
  window.handleGoalFastAddSubmit = L.handleGoalFastAddSubmit;
  /* [#TASK-ES-572] openGoalDetailDrawer · closeGoalDetailDrawer · toggleMilestoneInDrawer → js/tabs/goals/goal-detail-drawer.js 로 옮김(알림 헬퍼·목표 상세 서랍 책임 분열 — 앞 주석 포함) */

  window.currentGoalStatPeriod = 'week';
  /* [#TASK-ES-481] switchGoalStatPeriod · renderGoalStatsChart → js/tabs/goals/goals-ia-actions.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  /* [#TASK-ES-481] adoptTemplateAsMyGoal → js/tabs/goals/goals-ia-actions.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  /* ============ [PHASE 5] #TASK-UIUX-PHASE5-RECORDS-CALENDAR FUNCTIONS ============ */
  /* [#TASK-ES-481] toggleRecordArchive → js/tabs/records/archive-toggle.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  /* [#TASK-ES-571] exportRecordsCsv → js/tabs/records/csv-export.js 로 옮김(기록 CSV 내보내기 책임 분열 — 앞 주석 포함) */

  /* ============ [PHASE 6] #TASK-UIUX-PHASE6-COMM-SETTINGS FUNCTIONS ============ */
  /* [#TASK-ES-439] paintSecurityCard → js/tabs/settings/quick-actions.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  /* [#TASK-ES-439] refreshSecurityStatus → js/tabs/settings/quick-actions.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  /* [#TASK-ES-439] killDeviceSession → js/tabs/settings/quick-actions.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  /* [#TASK-ES-439] selectThemeSwatch → js/tabs/settings/quick-actions.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  L.startKeyboardShield(); /* [#TASK-ES-638] 로드 중 문(앞 주석 포함) → js/tabs/settings/boot-wiring.js 의 startKeyboardShield 로 옮김 — 원래 자리에서 부른다 */

  /* [#TASK-ES-444] openPwaInstallGuideModal → js/tabs/settings/pwa-install.js 로 옮김(인라인 스크립트 세포화 P1) */

  /* [#TASK-ES-444] closePwaInstallGuideModal → js/tabs/settings/pwa-install.js 로 옮김(인라인 스크립트 세포화 P1) */

  /* [#TASK-ES-444] switchPwaOsTab → js/tabs/settings/pwa-install.js 로 옮김(인라인 스크립트 세포화 P1) */

  /* [#TASK-ES-444] confirmPwaInstall → js/tabs/settings/pwa-install.js 로 옮김(인라인 스크립트 세포화 P1) */
  /* ============ RENDER: GOALS ============ */
  /* [#TASK-ES-370] renderGoalsScreen → js/tabs/goals/render.js(머리·조립) · goal-detail.js(상세 마크업) · goal-detail-events.js(상세 이벤트) 로 옮김(목표 탭 세포) */

  /* ============ RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만) ============ */
  /* [#TASK-ES-545] canManageTeamGoals · TEAM_COMMENTS_CACHE → js/tabs/goals/team-comments.js 로 옮김(인라인 3단계 Z2 팀·소통 — 팀 목표 댓글·차단·목표 순서 — 앞 주석 포함) */
  window.OurgoalAppState.defineVar('REALTIME_CHANNELS_SETUP', false);
  window.OurgoalAppState.defineVar('USER_SESSION_CHANNEL', null);
  /* [#TASK-ES-653] setupUserSessionRealtime → js/tabs/settings/user-session-realtime.js 로 옮김(세션 실시간 채널 구독 함수 이전 — setupUserSessionRealtime — 앞 주석 포함) */
  /* [#TASK-ES-545] ensureTeamCommentsLoaded · setupTeamCommentsRealtime → js/tabs/goals/team-comments.js 로 옮김(인라인 3단계 Z2 팀·소통 — 팀 목표 댓글·차단·목표 순서 — 앞 주석 포함) */
  /* [#TASK-ES-545] filterHidden → js/tabs/comm/user-blocks.js 로 옮김(인라인 3단계 Z2 팀·소통 — 팀 목표 댓글·차단·목표 순서 — 앞 주석 포함) */
  /* [#TASK-ES-545] sortGoalsByOrder · shiftGoalOrder · reorderGoal → js/tabs/goals/goal-order.js 로 옮김(인라인 3단계 Z2 팀·소통 — 팀 목표 댓글·차단·목표 순서 — 앞 주석 포함) */
  /* [#TASK-ES-545] filterBlockedPosts · isUserBlocked · blockUser · unblockUser · openBlockedUsersModal → js/tabs/comm/user-blocks.js 로 옮김(인라인 3단계 Z2 팀·소통 — 팀 목표 댓글·차단·목표 순서 — 앞 주석 포함) */
  /* [#TASK-ES-545] teamComments · teamCommentItemHtml · teamCommentsBlockHtml → js/tabs/goals/team-comments.js 로 옮김(인라인 3단계 Z2 팀·소통 — 팀 목표 댓글·차단·목표 순서 — 앞 주석 포함) */

  
  /* ============ 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135) ============ */
  /* [#TASK-ES-552] renderPersonalGoalsEmptyGuideHtml → js/tabs/goals/personal-goals-guide.js 로 옮김(인라인 3단계 Z2 팀·소통 — 개인 목표 가이드·팀 수준별 목표·팀 목표 편집 — 앞 주석 포함) */
  /* [#TASK-ES-552] isMockGroup → js/tabs/goals/team-level-goals.js 로 옮김(인라인 3단계 Z2 팀·소통 — 개인 목표 가이드·팀 수준별 목표·팀 목표 편집 — 앞 주석 포함) */
  /* [#TASK-ES-493] renderTeamCreateHeroCardHtml · renderTeamGoalsEmptyGuideHtml → js/tabs/goals/team-goals-guide.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  /* [#TASK-ES-552] getGroupLevelGoals · openLevelGroupDetailModal · collapseAllTeamGoalAccordions → js/tabs/goals/team-level-goals.js 로 옮김(인라인 3단계 Z2 팀·소통 — 개인 목표 가이드·팀 수준별 목표·팀 목표 편집 — 앞 주석 포함) */
  /* [#TASK-ES-497] renderTeamGoalsScreen → js/tabs/goals/team-goals-screen.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  if (typeof window !== 'undefined') {
    window.renderTeamGoalsScreen = L.renderTeamGoalsScreen;
  }
  /* [#TASK-ES-552] openTeamGoalEditModal → js/tabs/goals/team-goal-edit-modal.js 로 옮김(인라인 3단계 Z2 팀·소통 — 개인 목표 가이드·팀 수준별 목표·팀 목표 편집 — 앞 주석 포함) */

  L.defineSendTeamGoalComment(); /* [#TASK-ES-640] 로드 중 문(앞 주석 포함) → js/tabs/goals/team-comment-send.js 의 defineSendTeamGoalComment 로 옮김 — 원래 자리에서 부른다 */
  L.bindTeamCommentClick(); /* [#TASK-ES-640] 로드 중 문(앞 주석 포함) → js/tabs/goals/team-comment-send.js 의 bindTeamCommentClick 로 옮김 — 원래 자리에서 부른다 */
  L.bindTeamCommentKeydown(); /* [#TASK-ES-640] 로드 중 문(앞 주석 포함) → js/tabs/goals/team-comment-send.js 의 bindTeamCommentKeydown 로 옮김 — 원래 자리에서 부른다 */
  } /* bootGoalsAndTeamState */

  K.bootHomeAndGoalWiring = bootHomeAndGoalWiring;
  K.bootGoalsAndTeamState = bootGoalsAndTeamState;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
