# 아워골 index.html UI 인벤토리 (리디자인 기준선)

- 대상 파일: `C:/dev/ourgoal-app/index.html` (단일 파일 앱)
- 측정일: 2026-09-12 · 측정 도구: grep/sed/awk + Node 스크립트(정규식 카운트). 모든 수치는 스크립트 산출값이며 추정치는 "약"으로 표기.
- 구획: `<style>` 36~1601행 · 정적 HTML 셸 1603~2280행 · 메인 `<script>` 2283~20557행 · 보조 `<script>`(ESC 모달 닫기) 20559~20575행.
- JS 렌더 방식: 백틱 템플릿이 아니라 **`'...' + 변수 + '...'` 문자열 결합**으로 HTML을 조립해 `innerHTML`에 넣는다(`innerHTML =` 119회, `class="` 1,409회, 정적 `id="` 453종). 이벤트는 `addEventListener` 348회 + `.onclick =` 186회로 붙이며, HTML 인라인 `onclick`은 셸 4곳(`switchUxMode` 3, `nudgeCrewMates` 1, `openShareToFeedModal` 1)만 있다.

---

## 1. 화면 목록

최상위 화면은 3개의 풀페이지 컨테이너(`#landingScreen`, `#authScreen`, `#appShell`)와 `#appShell > main.screens` 안의 `.screen` 섹션 7개다. 화면 전환은 `setTab(tab)`(3945행)이 `.screen.active` 토글 + `navbtn.active` 토글 + 각 화면 `render*()` 호출(`document.startViewTransition` 사용). 피드백 봇 설정 화면만 `openFeedbackSetup()`(8009행)이 별도로 `screen-feedbacksetup`을 활성화한다.

| # | id | 행 | 용도 | 주요 자식 섹션 |
|---|----|----|------|----------------|
| 1 | `#landingScreen` | 1606 | 비로그인 랜딩(소개+CTA) | `.land-hero`(마크·태그라인·`.land-feats` 4개 특징) / `.land-cta`(카카오 `#landKakaoBtn`, 구글 `#landGoogleBtn`, 이메일 가입 `#landStartBtn`, 로그인 `#landLoginLink`) |
| 2 | `#authScreen` | 1632 | 로그인·회원가입 | `.auth-brand` / `.auth-card`: `.oauth-row`(`#authKakaoBtn`, `#authGoogleBtn`) → `.auth-divider` → `.auth-tabs`(`data-authtab=login|signup`) → `#loginForm`(`#loginUser`,`#loginPass`,`#loginError`,`#loginSubmit`) / `#signupForm`(`#suUser`,`#suName`,`#suPass`,`#suPass2`,`#signupError`,`#signupSubmit`) → 약관 문구(`#authTermsLink`,`#authPrivacyLink`) |
| 3 | `#appShell` | 1675 | 로그인 후 앱 셸 | `.topbar`(1676) · `#levelUpBannerSlot`(1683) · `main.screens`(1685~2244) · `.bottomnav`(2246~2274) |
| 3-1 | `#screen-home` | 1687 | 홈(오늘·체크인) | `.s-eyebrow`/`#homeGreeting` · `#todayGlancePill` · `#adaptiveModeSelector`(모드칩 3) · `#crewPacingWidget` · `#dailyQuestBarWrap` · `#a11yLiveAnnouncer` · `#offlineNoticeBanner` · `#levelBadgeRow` · `#notifyBannerSlot` · `#socialNotifySlot` · `#iosPwaSlot` · `#captureCardBox`(퀵루틴칩 5, `#captureInput`, `#micBtn`, `#captureLiveMeta`, `#capturePhotoPreview`, `#capturePhotoBtn`, `#importExternalBtn`, `#captureSave`) · `#customFeedbackBtn` · `#todayMissionCard` · `#homeGrassSummaryCard` · 내 목표 헤더(`#streakBadge`,`#streakFreezeBadge`,`#homeAddGoal`) · `#homeGoalList` · 하단 액션(`#homeChallengeRoomBtn`, `#mzShareBtn`) |
| 3-2 | `#screen-goals` | 1764 | 목표(개인/팀) | `#goalsSubtabs`(개인/팀) · `#personalGoalsView`: `#goalAgentCard`(`#goalAgentInput`,`#goalAgentSendBtn`) · `.goal-head-row`(`#goalsPrivacyBadge`, `#goalEditToggle`) · `#goalChipRow` · `#goalDetailBody`(JS: 현재 종합상황 `#goalStatusTag/#goalStatusText`, 마감 `#goalDueInput`, 공개범위 `#goalVisInput`, 마일스톤 필터 `#msFilterToggle`, `#addMsBtn`, 선택삭제 `#selAllBtn/#selDeleteBtn/#selDeleteAllBtn`, `#goalResultBtn`, `#goalExportBtn/#goalExportAllBtn`) · `#teamGoalsView`(JS `renderTeamGoalsScreen` 11064) |
| 3-3 | `#screen-calendar` | 1789 | 일정(월/주/일) | 헤더(`#calPrivacyBadge`, `#calViewToggle` 월·주·일) · `#calGoogleBanner` · `#calAgentCard`(`#calAgentInput`,`#calAgentSendBtn`) · `.cal-nav-row`(`#calPrevBtn`,`#calPeriodLabel`,`#calTodayBtn`,`#calNextBtn`) · `#calGrid` · `#calDayDetail` |
| 3-4 | `#screen-records` | 1824 | 기록·분석 | 헤더(`#recPrivacyBadge`, `#recAddBtn`) · `#recFeedbackSlot` · `#recAgentCard`(`#recAgentInput`,`#recAgentSendBtn`) · `#recProTemplateCard`(`#recOpenProTemplateBtn`, 퀵템플릿칩 `data-quicktpl` 5 + `#recCreateCustomTplQuickBtn` + `#recOpenMarketQuickBtn`) · `#weekSummary` · `#lifeBalanceBox` · `#chartContainer` · `#recordHeatmap` · `#reportSummary` · 위클리 리캡 카드(`#weeklyRecapBtn`) · `#archivedGoals` · `#periodAiCard`(`#periodPresetRow`, `#periodStartDate/#periodEndDate`, `#periodRecordCountBadge`, `#periodAiRequestBtn`, `#periodAiResultSlot`) · `#recThemeFilters` · `#recSearchInput` · `#recordsList` · `.export-card`(`#exportRecordsBtn`) |
| 3-5 | `#screen-comm` | 1942 | 소통 | 헤더(`#btnCommPostFeed` → `openShareToFeedModal`) · `#commBody`(JS `renderCommScreen` 17316: `.comm-subtabs` 5개 + `#commSubBody`) |
| 3-6 | `#screen-settings` | 1956 | 설정 | `.set-block` 13개: 내 프로필(`#profileCard`,`#avatarFile`) / 공개 범위·프라이버시(셀렉트 4 + `#onlineStatusSwitch`) / 계정·보안(`#setAccountEmail`,`#twoFactorSwitch`,`#logoutOtherDevicesBtn`) / 알림·방해금지(`#checkinTimesRow`,`#addTimeBtn`,`#presetTimesBtn`,`#notifySwitch`,`#quietHoursSwitch`,`#quietStartInput/#quietEndInput`, 유형별 스위치 4, `#testNotifyBtn`) / 화면 스타일(`#themeGrid`,`#highContrastSwitch`,`#fontSizeToggle`,`#dataSaverSwitch`) / 구글 캘린더(`#gcalStatusBox`,`#gcalQuickConnectBtn`,`#gcalSyncRow`: `#gcalSyncNowBtn`,`#gcalDisconnectBtn`,`#gcalAutoSyncSwitch`,`#gcalImportBtn`,`#gcalExportBtn`, `#gcalClientIdInput`) / AI 피드백(`#aiProviderToggle`,`#geminiKeyBlock`,`#autoUpdateSwitch`,`#settingsCustomFeedbackBtn`) / 가상 페르소나·커뮤니티(`#virtualCheerSwitch`,`#manageBlockedBtn`) / 외부 연동(`#notionSwitch`,`#notionUrlBlock`: webhook·API key·DB id·`#notionAutoPushSwitch`·`#notionTestBtn`) / 잇템 클릭 통계(`#itemStatsList`) / 저장공간·캐시(`#cacheSizeText`,`#clearCacheBtn`,`#formatToggle`,`#settingsExportCheckins`,`#settingsExportAll`,`#settingsImportAll`,`#importFile`) / 고객지원(`#btnRestartGuide`,`#feedbackInquiryBtn`,`#faqAccordionBtn`,`#viewTermsBtn`,`#viewPrivacyBtn`) / 계정(`#logoutBtn`,`#resetBtn`,`#withdrawBtn`) · 푸터(버전·문의·`#setTermsLink`/`#setPrivacyLink`) |
| 3-7 | `#screen-feedbacksetup` | 2239 | 맞춤 피드백 봇 설정(서브 화면) | `#fbSetupBack`(‹ 뒤로) · `#fbSetupBody`(JS `renderFeedbackSetup` 8047) |

풀페이지급 오버레이(화면 밖 고정 레이어): `#modalOverlay > #modalSheet`(2276~2278, z-index 100, 바텀시트) · `#toast`(2279, z-index 200) · `#levelUpBannerSlot`(z-index 250, 상단 고정) · `#confettiLayer`(JS가 동적 생성, z-index 300) · `.bottomnav`(z-index 30) · 최하단 `div.sangmin-clone-remote-notice`(20578, 원격패치 알림 문구).

온보딩은 별도 화면이 아니라 **모달 시퀀스**다: `startOnboarding()`(3552) → `showObStep1~4`(3556/3616/3651/3709, "1/4 환영 → 2/4 목표 정하기 → 3/4 마일스톤 미리보기 → 4/4 첫 기록") → `showCommTourModal`(3760, "첫 목표를 만들었어요") → `maybeShowFirstLoginGuide`(3780, `settings.hasSeenGuide`) → `showGuideStep1~6`(3790~3868, "1/6 완전 무료 · 2/6 AI 코칭 · 3/6 구글 캘린더 · 4/6 전문 템플릿 · 5/6 팀 수준별 목표 · 6/6 음성 기록·보안"). 설정의 `#btnRestartGuide`(3455)가 가이드를 재실행한다.

---

## 2. 내비게이션

### 2-1. 하단 탭바 `.bottomnav > nav.bottomnav-inner` (2246~2274)
`position:fixed; bottom:0; z-index:30`, 플로팅 필 형태. 버튼 6개는 id가 없고 `data-tab`으로 식별한다.

| 버튼 | `data-tab` | 라벨 | 대상 화면 | 아이콘(인라인 SVG, stroke 1.8) |
|------|-----------|------|-----------|------|
| `.navbtn.active` | `home` | 홈 | `#screen-home` | 집(지붕 path + 몸체) |
| `.navbtn` | `goals` | 목표 | `#screen-goals` | 동심원 3개(타깃) |
| `.navbtn` | `calendar` | 일정 | `#screen-calendar` | 달력(rect + 가로선 + 고리 2) |
| `.navbtn` | `records` | 기록 | `#screen-records` | 시계(원 + 바늘) |
| `.navbtn` | `comm` | 소통 | `#screen-comm` | 말풍선 |
| `.navbtn` | `settings` | 설정 | `#screen-settings` | 톱니(원 + 기어 path) |

### 2-2. 상단바 `.topbar` (1676~1682)
`.brand`("아워골") · `.user-chip`(`#topUserName`, `.avatar#topAvatar`). 갱신 함수 `updateTopBar()`(4967). 스크롤 숨김 없음. CSS 변수 `--topbar-bg`로 테마별 그라디언트.

### 2-3. 화면 내부 서브탭·세그먼트

| 위치 | 컨테이너 id/클래스 | 옵션 식별자 | 항목 | 렌더 행 |
|------|------------------|------------|------|--------|
| 인증 | `.auth-tabs > .auth-tab` | `data-authtab` | 로그인 / 회원가입 | 정적 1650 |
| 약관 모달 | `.auth-tabs`(재사용) `#legalTabTerms/#legalTabPrivacy` | — | 이용약관 / 개인정보처리방침 | 4052 |
| 홈 | `#adaptiveModeSelector > .mode-chip` | `data-mode` | 🎯 미니멀 / ⚡ MZ게이미피케이션 / 📊 파워분석가 (`switchUxMode`, `body[data-ux-mode]`) | 정적 1691 |
| 목표 | `#goalsSubtabs > .comm-subtab` | `data-gsub` | 개인 목표 / 팀 목표 (`state.goalsSubTab`) | 9787 |
| 목표 상세 | `#msFilterToggle.format-toggle > .format-opt` | `data-msfilter` | 전체 / 진행 중 / 대기 / 완료 (`state.msFilter`) | 9915 |
| 일정 | `#calViewToggle.format-toggle > .format-opt` | `data-calview` | 월 / 주 / 일 | 정적 1797, 바인딩 5819 |
| 기록 | `#reportPeriodToggle > .format-opt` | `data-period` | 7일 / 30일 (리포트) | 11693 |
| 기록 | `#periodPresetRow > .dday-pill` | `data-perioddays` | 최근 7일 / 14일 / 30일 / 이번 달 (기간 AI) | 정적 1893, 바인딩 15921 |
| 기록 | `#recThemeFilters > .theme-filter-chip` | `data-filter` | 5대 테마 필터 | 11802 |
| 기록 | `.balance-legend > .balance-leg-item` | `data-themefilter` | 라이프 밸런스 휠 범례 필터 | 11761 |
| 기록(전문 템플릿) | `.pro-trend-filters > .pro-trend-filter-chip` | `data-period` | 7회 / 30일 / 전체 | 13138 |
| 소통 | `.comm-subtabs > .comm-subtab` | `data-sub` | 피드 / 모임 / 🎁 마니또 / 공유 / DM (`state.commSubTab`) | 17318 |
| 소통 내부 뒤로가기 | `.dm-back` | `#grpBack`(18557) `#mnDmBack`(19469) `#dmBack`(19503) `#calEditBackToHubBtn`(5616) `#proRecBackToHubBtn`(14901) `#fbSetupBack`(2241) | ‹ 목록으로 류 | — |
| 첨부 모달 | `#attTypeToggle.format-toggle` | `data-atttype` | 🎥 영상 / 🖼️ 이미지 / 📝 메모 / 🔗 링크 | 8975 |
| 설정 | `#fontSizeToggle` | `data-fs` | 작게 / 보통 / 크게 / 아주 크게 | 정적 2068 |
| 설정 | `#aiProviderToggle` | `data-provider` | Claude / Gemini | 정적 2111 |
| 설정 | `#formatToggle` | `data-fmt` | CSV / JSON | 정적 2196 |

---

## 3. 모달·시트·오버레이 목록

공통 인프라: `openModal(html, onMount)`(3975) → `#modalSheet.innerHTML = html` + `#modalOverlay.active`, `history.pushState`로 안드로이드 뒤로가기 대응 / `closeModal(skipHistoryBack)`(4000) / 오버레이 바깥 탭 닫기 + 400ms 고스트클릭 방지 / `popstate`(4014) / ESC 전역 핸들러(20559~20575, `.modal-close-btn`·`.btn-close`·`#rsCancel` 탐색 — 이 중 `.modal-close-btn`·`.btn-close`는 CSS 미정의). **모달은 단일 바텀시트 1장만 존재**하며 `openModal` 호출 지점은 **71곳**. 토스트는 `toast(msg)`(2481) → `#toast`.

### 3-1. 바텀시트 모달 (openModal 사용)

| 함수 (행) | 내용 | 진입 경로 |
|-----------|------|----------|
| `openHallOfFame` 2771 | 🏆 명예의 전당(뱃지 그리드) | `#levelBadgeRow` 레벨 배지 클릭 |
| `startOAuthLogin` 3186 | OAuth 미지원 시 "이메일/닉네임으로 1초" 폴백 모달 | 카카오/구글 버튼(`#landKakaoBtn/#authKakaoBtn`, 구글은 `startGoogleLogin` 3135 우선) |
| `showObStep1~4` 3556/3616/3651/3709 | 4단계 온보딩(환영·프리셋 목표 `.btn-preset-goal`·마일스톤 미리보기·첫 기록 `.ob-quick-action-chip`) | `startOnboarding` 3552 (첫 로그인, 목표 0개) |
| `showCommTourModal` 3760 | 🎉 첫 목표 생성 축하·마니또/모임 소개 | 온보딩 종료 `finishOnboarding` |
| `showGuideStep1~6` 3790~3868 | 6단계 활용 가이드 | `maybeShowFirstLoginGuide` 3780 / `#btnRestartGuide` 3455 |
| `openPrivacyPickerModal(tabKey)` 3910 | 공개 범위(전체/모임원/나만) 선택 `data-privopt` | `#goalsPrivacyBadge/#calPrivacyBadge/#recPrivacyBadge` 클릭 3894 |
| `showLegalModal(tab)` 4024 | 이용약관·개인정보처리방침(탭) | `#authTermsLink/#authPrivacyLink/#viewTermsBtn/#viewPrivacyBtn/#setTermsLink/#setPrivacyLink` |
| `openPaywallModal` 4070 | **스텁** — 토스트 "100% 무료"만 표시(모달 없음) | 과거 Pro 게이트 자리 |
| `openAiResultAssistantModal` 4211 | AI 결과 기록 비서(줄글→노션 DB 규격 변환 `convertTextToNotionDbRecord`) | 결과 기록 버튼 |
| `openResultModal` 4403 / `renderNotionCardHtml` 4441 | "{종류} 결과 기록" 노션 카드형 입력 | `#goalResultBtn`, `data-msresult`, `data-taskresult` |
| `openProfileEditor` 4758 | 프로필 편집(아바타 `#pvPick/#pvClear`, 바이오 `#pvBio`, 관심사 `.cat-sub[data-int]`, 잇템 `#pvAddItItem`) | `#profileCard` 편집 |
| `paintItItems` 4824 (4854) | 🛍️ 새 잇템(제휴 링크) 등록 | 프로필 편집 내 `#pvAddItItem` |
| `openGoogleCalendarConnectModal` 5048 | 구글 캘린더 연동 안내·클라이언트 ID | `#gcalQuickConnectBtn` 20010, `#calBannerSetBtn` |
| `openGcalImportModal` 5222 | 구글 일정 불러와 목표 반영(`data-gev`/`data-gevchk`) | `#gcalImportBtn` 20051 |
| `openGcalExportModal` 5287 | 내 목표를 캘린더에 반영(`data-gxp`) | `#gcalExportBtn` 20053 |
| `openCalendarDayEditHubModal(date)` 5493 | 해당 일자 관리 허브(일정/기록 목록, `#hubAddProRecBtn`, `#calAddManualBtn`, `data-hubedit/hubdel/hubrec`) | 일 상세 `#calOpenHubBtn` |
| `openCalendarManualEditModal` 5605 | 일정 수동 추가/편집/삭제(`#calEditDeleteBtn`, `#calEditBackToHubBtn`) | 허브 → 추가/편집 |
| `openFocusAutoPilotModal(goalId)` 6945 | 집중 타이머(`#focusTimerDisplay`, `#btnFocusStartPause`, `#btnFocusReset`, `#btnFocusQuickCheckin`) | 홈 목표 카드 `data-focusgoal` |
| `openMzShareCardModal` 7069 | MZ 성장 스토리 카드(캔버스 `generateMzStoryCanvas`, 테마 `data-mztheme`, `#saveMzStoryPngBtn`, `#shareMzStoryWebBtn`, 링크/텍스트 복사) | `#mzShareBtn` 6614 |
| `openChallengeRoomModal` 7238 | 🔥 소규모 챌린지 룸(참여/퇴장 `data-joinchallenge/leavechallenge`, `#inviteFriendChallengeBtn`) | `#homeChallengeRoomBtn` 6610 |
| `openPhotoViewerModal(src)` 7387 | 사진 확대 뷰어 | 체크인 썸네일 `.checkin-photo-thumb`, 피드 사진 `data-feedphoto` |
| `maybeShowGoalUpdateModal` 7926 | 🔍 AI가 감지한 진행상황 변경 제안(`data-sugchk/sugpick`) | 체크인 저장 후 `settings.autoUpdate` 켜짐 |
| `openShareToFeedModal` 8309 (`renderModalHtml` 8334) | ✍️ 피드에 목표/기록 게시(목표·마일스톤 선택, 기록 선택, 사진/피드백 포함, 캡션, 카테고리) | `#btnCommPostFeed`, 공유 탭 `#toFeedLink` |
| `bindMsClicks` 내 8619 | 🔗 외부 데이터 불러오기(건강앱 등 연동 목록) | `#importExternalBtn` |
| `promptNewGoal` 8665 → `showNewGoalChatStep` 8689 / `showNewGoalLoadingStep` 8722 / `showNewGoalReviewStep` 8727 / `showNewGoalManualForm` 8782 | 새 목표 생성 3단계(대화 → AI 템플릿 생성 `/api/goaltemplate` → 검토/수동 폼 `data-ngms*`) | `#homeAddGoal` 6510, `#chipAdd`, `#emptyAddCustomGoalBtn` |
| `openAttachmentViewer` 8947 / `openAddAttachmentModal` 8969 | 참고자료 보기·추가(영상/이미지/메모/링크, `#attTypeToggle`) | 마일스톤/할 일 `data-addattms/addatttask`, `.att-chip` |
| `showGoalAgentLoadingStep` 9363 / `showGoalAgentReviewStep` 9372 | 🤖 대화형 목표 에이전트 변경안 검토·적용(`/api/goalagent`) | `#goalAgentSendBtn` 9472 |
| `celebrateMilestoneDone` 9767 | 🎉 마일스톤 완료 축하 + 다음 행동 제안(`#naOk`) | 마일스톤 체크 `data-mstoggle` |
| `openBlockedUsersModal` 10521 | 🚫 차단 사용자 목록·해제(`data-unblockid`) | `#manageBlockedBtn` 20073 |
| `openLevelGroupDetailModal(gid,lgId)` 10769 | 수준별 조/그룹 상세(목표·마일스톤·할 일 CRUD `data-lg*`) | 팀 목표 `data-openleveldetail` |
| `renderTeamGoalsScreen` 내 11239 / 11257 | 팀 목표 안내 모달(`#closeTeamGuideModal`) / 새 수준별 조·그룹 추가(`#saveNewLgBtn`) | 팀 목표 탭 최초 진입 / `data-addlevelgroup` |
| `promptNewTeamGoal` 11402 | 팀 목표 추가(`#tgSave`) | `data-addteamgoal` |
| `openThemePickerModal(recId)` 11817 | 기록 테마 변경(`data-picktheme`) | 기록 카드 테마 칩 `data-rectheme` |
| `openConversationalRecordConfirmModal` 11922 | 💬 대화형 기록 파싱 결과 확인 | `#recAgentSendBtn` 16181 |
| `openCreateCustomTemplateModal` 12477 (`renderModalHtml` 12502) | ✨ 맞춤 템플릿 생성(자연어 스펙 `parseNaturalLanguageTemplateSpec`, 열 편집, 표 미리보기) | `#recCreateCustomTplQuickBtn` 16204, `#proCreateTplBtn` |
| `openTemplateColumnEditModal` 12710 | 템플릿 열(속성) 편집(`data-delcol`) | `#proEditColsBtn` |
| `openProCoachReportModal` 13301 | 🧠 AI 코치 리포트(표 데이터 분석) | `#proCoachBtn` |
| `openProNotionExportModal` 13463 | 노션 DB 전송(`pushRecordToNotion` 13227, `/api/notion-push`) | `#proNotionExportBtn` |
| `openCsvImportModal` 13648 | CSV 붙여넣기/파일 가져오기 | `#proCsvImportBtn` |
| `openWearableSyncModal` 13696 | ⌚ 웨어러블 데이터 동기화(시뮬레이션 카드 `.wearable-act-card`) | `#proWearableSyncBtn` |
| `openVisionTableModal` 13850 | 📷 사진 OCR → 표 행(`/api/vision-table`, 일일 쿼터 `getVisionDailyQuota`, `.vision-drop-box`) | `#proVisionOcrBtn` |
| `openVoiceTableModal` 14130 | 🎙️ 음성 → 표 행(SpeechRecognition, `.voice-wave-ring`, `data-voicesim`) | `#proVoiceInputBtn` |
| `showWebRewardedAdModal` 14531 / `handleTemplateCloneWithAd` 14651 | 템플릿 복제 전 리워드 광고 카운트다운(`startTemplateAdCountdown`) | 마켓 템플릿 복제 |
| `openTemplateMarketModal` 14679 (`renderGridHtml` 14761) | 🏪 템플릿 마켓(카테고리 `data-mktcat`, 검색, 복제 `data-mktkey`) | `#recOpenMarketQuickBtn` 16212, `#proTplMarketBtn` |
| `openProTemplateRecordModal` 14874 (`renderModal` 14896, `renderRowsHtml` 15015) | 📋 전문(맞춤) 템플릿 기록 표(템플릿 선택 `#proTplSelect`, 날짜 `#proRecDate`, 표 `#proTable`, 행 추가 `#proAddRowBtn`, 스톱워치 `#proStopwatchWrap`, 트렌드 차트 `#proTrendChartWrap`, 분석 `#proAnalyticsWrap`, 사진 `#proPhotoPickBtn`, CSV 내보내기 `#proCsvExportBtn`, 일반 저장 `#proGeneralSaveBtn` / 일정 연동 저장 `#proCalendarSaveBtn`) | `#recOpenProTemplateBtn` 16197, 퀵칩 `data-quicktpl`, 허브 `#hubAddProRecBtn`, 기록 편집 `data-recedit` |
| `openTemplateRecordDetailModal(record)` 15724 | 템플릿 기록 상세(표·차트) | 기록 카드 `data-detail`, 일정 `data-calviewrec`, 딥링크 `checkRecordDeepLink` 15849 |
| `openWeeklyRecapModal` 16433 | 📸 위클리 리캡 이미지 생성·저장·공유(`generateWeeklyRecapImage` 16352) | `#weeklyRecapBtn` 16669 |
| `openRecordModal(rec)` 16575 | 새 기록 / 기록 수정(`#rText`, 테마 `#rTheme`, 카테고리 `#rCategory`, 시작/종료/진행중 `#rStart/#rEnd/#rOngoing`, 사진 `#recPickPhotoBtn`) | `#recAddBtn` 16668, `data-recedit` |
| `openExportThemeModal` 16803 | 테마별 기록 내보내기(CSV/JSON/MD/ICS, AI 분석 프롬프트 포함 옵션 `.export-theme-opt`) | `#exportRecordsBtn` 16955 |
| `openGoalCertificateModal(goal)` 17579 | 🏅 목표 달성 인증서 이미지(`generateGoalCertificateImage` 17526) | 보관 목표 카드 |
| `promptNewGroup` 18780 | 새 모임·함께 목표 방 만들기(`#grpCancel`) | `#commAddGroup` |
| `openPeerInviteSuccessModal(group)` 19005 | 모임 생성 후 초대(`#modalKakaoShareBtn`, `#modalCopyLinkBtn`) | 모임 생성 직후 |
| `showPeerInviteLandingModal` 19120 | 초대 링크 랜딩(`#grpJoinNow`, `#peerInviteKakaoQuickBtn`, `#peerInviteDismissBtn`) | URL `?invite=`/`?invite_group=` (`checkAndHandlePeerInviteUrl` 19184) |
| `openNotificationSoftAskModal` 19543 | 🔔 알림 권한 소프트 애스크(`.soft-ask-card`, `Notification.requestPermission` 19579) | 알림 스위치 켤 때 |
| `openCustomerInquiryModal` 19591 | 💬 1:1 문의·오류 제보 | `#feedbackInquiryBtn` 3463 |
| `openFaqModal` 19628 | ❓ FAQ 아코디언 | `#faqAccordionBtn` 20226 |

### 3-2. 모달이 아닌 오버레이·배너·토스트

| 요소 | 행 | 표시 방식 |
|------|----|-----------|
| `#toast` / `toast(msg)` | 2279 / 2481 | 하단 고정(bottom 104px), `.show` 토글 |
| `#levelUpBannerSlot` / `showLevelUpBanner` | 1683 / 2733 | 상단 고정 레벨업 배너(`.level-badge.levelup`) |
| `#confettiLayer` / `burstConfetti` | 2453 | 동적 생성 풀스크린 `.confetti-piece` 애니메이션 |
| `#notifyBannerSlot` / `showNotifyBanner` | 1718 / 20376 | 홈 인라인 `.notify-banner`(체크인 리마인더) |
| `#socialNotifySlot` / `showSocialNotifyBanner` | 1719 / 20464 | 홈 인라인(새 응원·마니또) |
| `#iosPwaSlot` / `renderIosPwaBanner` | 1720 / 6355 | iOS 홈화면 추가 안내(`ios_pwa_dismissed`) |
| `#offlineNoticeBanner.offline-banner` | 1716 | 오프라인 모드 배너 |
| `#todayGlancePill` / `renderTodayGlancePill` | 1690 / 6666 | 상단 상태 필 |
| `#dailyQuestBarWrap` / `renderDailyQuestBar` | 1714 / 6691 | 게이미피케이션 모드 퀘스트 바 |
| `#recFeedbackSlot` / `renderRecordFeedbackSlot`, `renderFeedbackSlot` | 1836 / 8207 | AI 피드백 카드 `.fb-card`(닫기 `.fb-close`) |
| `#a11yLiveAnnouncer.sr-only` / `announceToA11y` | 1715 / 6658 | 스크린리더 라이브 영역 |
| `div.sangmin-clone-remote-notice` | 20578 | 하단 고정 문구(원격 패치 표식) |

---

## 4. 컴포넌트 클래스 카탈로그

`<style>`에 정의된 클래스 셀렉터 **437종**(`.접두어-` 단순 분류, 상태 클래스 포함). 사용 판정: HTML 셸(1603~2280) 또는 JS(2283~20557)에서 클래스명 토큰 출현 여부. CSS 블록 수 약 714, `!important` 23회, id 셀렉터 15종, `@keyframes` 11종(fadein, mic-pulse, sheetup, spring-pop, confetti-fall, cs-pulse, streak-pulse, voicePulse, streakFlamePulse, swFlash, cellFlash), `@media` 5종(prefers-reduced-motion ×2, prefers-contrast ×2, prefers-color-scheme: dark).

| 패밀리 | 수 | JS 참조 | 셸 참조 | 클래스 | 미사용(dead) |
|--------|----|--------|--------|--------|-------------|
| feed-* | 32 | 31 | 0 | feed-action, feed-ai-tag, feed-avatar, feed-body, feed-c-author, feed-c-avatar, feed-c-badge, feed-c-body, feed-c-del, feed-c-input, feed-c-meta, feed-c-text, feed-c-time, feed-card-body, feed-comm-toggle, feed-comment-bubble, feed-comments-list, feed-comments-panel, feed-filter-bar, feed-filter-chip, feed-foot, feed-goal, feed-head, feed-input-row, feed-item, feed-name, feed-preview-box, feed-quick-chip, feed-quick-chips-row, feed-react-btn, feed-react-group, feed-time | feed-card-body |
| pro-* | 27 | 27 | 0 | pro-analytics-banner, pro-badge, pro-designer-preview, pro-notion-table, pro-stat-chip/label/value, pro-stopwatch-header/widget, pro-sw-clock/controls/display-row/mode-chip/modes, pro-tpl-badge/cell-input/row-del/table-wrap, pro-trend-chart-card/filter-chip/filters/growth-badge/header/kpi-pill/kpi-row/svg-wrap/title | — (`pro-badge`는 `renderProBadge`가 제거만 함) |
| ms-* (마일스톤) | 14 | 11 | 0 | ms, ms-actions, ms-break, ms-date, ms-list, ms-main, ms-priority-tag, ms-row, ms-status, ms-title, ms-total, ms-priority-high/med/low | ms-priority-high, ms-priority-med, ms-priority-low |
| btn-* | 12 | 10 | 8 | btn, btn-block, btn-cs-pulse, btn-danger, btn-ghost, btn-google, btn-kakao, btn-mz, btn-preset-goal, btn-primary, btn-sm, btn-unblock | btn-mz (※ JS는 `btn-secondary`를 쓰지만 CSS 미정의) |
| heatmap-* | 12 | 12 | 0 | heatmap-body/cell/daylbls/grid/grid-wrap/legend/month-lbl/month-row/scroll/selected-box/stat-bar/stat-item | — |
| badge-* | 9 | 9 | 0 | badge, badge-ai, badge-author, badge-desc, badge-grid, badge-icon, badge-label, badge-tile, badge-wrap | — |
| rec-* (기록 카드) | 9 | 9 | 0 | rec-bottom, rec-card, rec-date-label, rec-dur, rec-icons, rec-text, rec-theme-chip, rec-time, rec-top | — |
| theme-* | 9 | 7 | 2 | theme-card, theme-check, theme-desc, theme-dot, theme-filter-chip, theme-filter-row, theme-grid, theme-info, theme-name | — |
| cal-* | 8 | 7 | 1 | cal-cell, cal-daynum, cal-grid, cal-grid-week, cal-more, cal-nav-row, cal-pill, cal-weekdays | — |
| dm-* | 8 | 8 | 2 | dm-back, dm-input-row, dm-list-item, dm-msg, dm-msgs, dm-preview, dm-thread-head, dm-thread-wrap | — |
| goal-* | 8 | 7 | 3 | goal-body, goal-card, goal-card-top, goal-chip, goal-chip-row, goal-detail-link, goal-head-row, goal-stats | — |
| land-* | 8 | 1 | 8 | land-cta, land-feat, land-feats, land-headline, land-hero, land-login-link, land-mark, land-tag | — |
| auth-* | 7 | 2 | 7 | auth-brand, auth-card, auth-divider, auth-error, auth-note, auth-tab, auth-tabs | — |
| balance-* | 7 | 7 | 0 | balance-bar-wrap, balance-card, balance-dot, balance-head, balance-leg-item, balance-legend, balance-seg | — |
| manito-* | 7 | 7 | 0 | manito-avatar, manito-card, manito-head, manito-hero, manito-name, manito-rec, manito-sub | — |
| profile-* | 7 | 7 | 0 | profile-avatar, profile-bio, profile-card, profile-name, profile-stat, profile-stats, profile-top | — |
| cat-* (카테고리 선택) | 6 | 6 | 0 | cat-chip, cat-grid, cat-major, cat-major-row, cat-sub, cat-sub-grid | — |
| streak-* | 6 | 6 | 0 | streak-flame-pulse, streak-pill, streak-t1~t4 | — |
| tmpl-* (크리에이터 템플릿) | 6 | 6 | 0 | tmpl-badge, tmpl-btn, tmpl-card, tmpl-head, tmpl-ms, tmpl-preview | — |
| active-* (피드 반응 상태) | 5 | 5 | 1 | active, active-clap, active-fire, active-heart, active-sparkle | — |
| archive-* | 5 | 5 | 0 | archive-card, archive-meta, archive-ms, archive-pct, archive-top | — |
| chart-* | 5 | 5 | 0 | chart-bar, chart-bar-wrap, chart-bars, chart-card, chart-day-lbl | — |
| collective-* | 5 | 5 | 0 | collective-card, collective-fill, collective-pct, collective-top, collective-track | — |
| fb-* (AI 피드백 카드) | 5 | 5 | 0 | fb-card, fb-close, fb-row, fb-source, fb-verdict | — |
| level-* | 5 | 5 | 0 | level-badge, level-badge-row, level-bar-wrap, level-num, level-xp-txt | — |
| pw-* (구 페이월) | 5 | 0 | 0 | pw-discount, pw-plan, pw-plan-row, pw-price, pw-unit | **전부 dead** |
| task-* | 5 | 5 | 0 | task-add, task-check, task-list, task-row, task-title | — |
| group-* / grp-* | 4+4 | 8 | 0 | group-bar, group-ico, group-info, group-item / grp-photo-card, grp-photo-grid, grp-photo-img, grp-photo-meta | — |
| modal-* | 4 | 1 | 2 | modal-actions, modal-body, modal-overlay, modal-sheet | modal-body |
| report-* | 4 | 4 | 0 | report-dot, report-legend-label, report-legend-row, report-legend-val | — |
| ai-* | 3 | 2 | 1 | ai-badge-notice, ai-icon, ai-note | — |
| att-* (첨부) | 3 | 2 | 0 | att-add-btn, att-chip, att-del-btn | att-del-btn |
| capture-* | 3 | 0 | 3 | capture-card, capture-row, capture-ta-wrap | — |
| comm-* | 3 | 3 | 1 | comm-hint, comm-subtab, comm-subtabs | — |
| daily-* | 3 | 2 | 1 | daily-quest-bar-wrap, daily-quest-fill, daily-quest-track | — |
| font-* | 3 | 3 | 0 | font-small, font-large, font-xlarge | — |
| m-* (미션) | 3 | 3 | 0 | m-goal, m-icon, m-text | — |
| market-* | 3 | 3 | 0 | market-badge, market-card, market-grid | — |
| photo-* | 3 | 2 | 0 | photo-preview-img, photo-preview-wrap, photo-remove-btn | photo-remove-btn |
| 2개짜리 | 2×22 | — | — | avatar/avatar-edit, bottomnav/bottomnav-inner, card/card-title-row, ct/ct-label, dday-mini/dday-pill, done/done-text, drag-handle/drag-hint, empty-goal/empty-state, export-card/export-theme-opt, format-opt/format-toggle, has/has-comments, it-item-card/it-item-thumb, me/me-comment, mic-btn/mic-status, mission-card/mission-row, mz-btn/mz-card-preview, note/note-text, ob-quick-action-chip/ob-step-label, s-eyebrow/s-title, sel-bar/sel-check, soft-ask-card/soft-ask-icon, stamp/stamp-row, tag/tag-row, time-chip/time-chip-row, today/today-glance-pill | empty-goal, note-text |
| 단독 (약 110종) | — | — | — | adaptive-mode-bar, add-ms-btn, addchip, alert, app, bad, blocked-user-row, brand, cb, cell-highlight-flash, challenge-room-card, checkin-photo-thumb, cheer-in, ci, confetti-piece, connected, crew-pacing-widget, custom, d, danger-note, data-btn-row, dock-action-btn, doing, dot, down, dragging, dragover, drop-target, duedate-row, e-icon, edit-toggle, fab-add, faint, field, fnote, freeze-pill, future-box, gauge, good, highlight, hint, ico, icon-btn, item-stat-row, join-btn, joined, lbl, levelup, listening, mark, meta-strip, mi, mid, mini-bar, miss, mode-chip, muted, navbtn, nb-txt, nm, notify-banner, notion-push-status-pill, oauth-row, off, offline-banner, on, other-month, over, pill-react, privacy-badge, quick-prose-chip, result-btn, running, screen, screens, scroll-preview-box, selected, sent, set-block, share-badges, show, sr-only, switch, t, them, tm-desc, toast, todo, toggle-row, topbar, topic-pill, tp-item, tpl, trend-tooltip, txt, up, user-chip, vision-drop-box, voice-wave-ring, wearable-act-card, week-summary, welcome-reward-card | alert, connected, dock-action-btn, fnote, future-box, welcome-reward-card |

**dead 클래스 합계 21종**: alert, att-del-btn, btn-mz, connected, dock-action-btn, empty-goal, feed-card-body, fnote, future-box, modal-body, ms-priority-high, ms-priority-low, ms-priority-med, note-text, photo-remove-btn, pw-discount, pw-plan, pw-plan-row, pw-price, pw-unit, welcome-reward-card.

**JS에서 쓰지만 CSS에 없는 클래스(역방향 누락, 확인된 것)**: `btn-secondary`(홈 `#homeChallengeRoomBtn`, MZ 카드 `#shareMzStoryWebBtn`), `modal-close-btn`, `btn-close`, `pro-trend-svg`. 이 항목들은 리디자인 때 정의하거나 치환해야 한다.

요청 문구에 있던 `mkt-*`, `skeleton*`, `nav*`(navbtn 제외), `chip*`(단독) 패밀리는 **존재하지 않음**(마켓은 `market-*`, 스켈레톤 로딩 클래스 없음, 칩은 `goal-chip`·`mode-chip`·`time-chip`·`feed-quick-chip` 등 패밀리별로 분산).

---

## 5. JS 인라인 하드코딩 스타일

- JS(2283~20557) 내 `style="` 출현: **1,363회** (`style='` 0회). 정적 HTML 셸에도 **208회** → 전체 1,571회.
- 서로 다른 style 속성값(전체 문자열 기준) 856종, 속성 조각(`;` 분리) 604종.
- 인라인 style 안의 `var(--*)` 사용 590회(--rule 99, --violet 75, --ink 63, --card2 61, --ink-soft 49, --ink-faint 44, --card 34, --violet-soft 34, --red 31, --sage 22, --red-soft 11, --gold 8, --sage-soft 8, --bg 6 ※ `--bg`는 CSS에 **미정의** 변수, --chip 6).

### 5-1. 가장 자주 반복된 인라인 조각 상위 30 (→ 유틸리티/컴포넌트 클래스로 이관 대상)

| 순위 | 횟수 | 조각 | | 순위 | 횟수 | 조각 |
|----|----|----|----|----|----|----|
| 1 | 234 | `display:flex` | | 16 | 60 | `background:var(--card2)` |
| 2 | 181 | `align-items:center` | | 17 | 53 | `font-weight:800` |
| 3 | 100 | `font-weight:700` | | 18 | 51 | `text-align:center` |
| 4 | 97 | `font-size:.72rem` | | 19 | 49 | `color:var(--ink-soft)` |
| 5 | 84 | `gap:6px` | | 20 | 49 | `margin-bottom:12px` |
| 6 | 83 | `width:100%` | | 21 | 48 | `font-size:.82rem` |
| 7 | 80 | `flex:1` | | 22 | 47 | `margin:0` |
| 8 | 76 | `border:1px solid var(--rule)` | | 23 | 46 | `flex-wrap:wrap` |
| 9 | 71 | `font-size:.74rem` | | 24 | 43 | `color:var(--ink-faint)` |
| 10 | 65 | `cursor:pointer` | | 25 | 42 | `margin-bottom:6px` |
| 11 | 65 | `gap:8px` | | 26 | 42 | `font-size:.76rem` |
| 12 | 63 | `border-radius:12px` | | 27 | 41 | `font-size:.78rem` |
| 13 | 63 | `color:var(--ink)` | | 28 | 38 | `font-size:.84rem` |
| 14 | 62 | `color:var(--violet)` | | 29 | 36 | `margin-bottom:8px` |
| 15 | 60 | `justify-content:space-between` | | 30 | 33 | `margin-bottom:10px` |

그 다음: `margin-bottom:14px` 32, `background:var(--card)` 32, `font-size:.8rem` 30, `color:var(--red)` 29, `margin-bottom:4px` 28, `justify-content:center` 28, `min-width:0` 28, `border:none` 25, `gap:4px` 25, `border-radius:10px` 25. 폰트 크기만 .72/.74/.76/.78/.8/.82/.84rem **7단계가 인라인으로 난립** → 타이포 스케일 토큰 필요.

### 5-2. JS 내 하드코딩 색상

- `#hex` 또는 `rgb()/rgba()` 리터럴 출현 **299회**, 서로 다른 값 **165종**. 이 중 `style="..."` 속성 내부는 113회(나머지는 THEMES 미리보기 그라디언트·캔버스 공유 이미지·SVG fill·인라인 `<svg>` 등).

| 순위 | 횟수 | 값 | 비고 |
|----|----|----|----|
| 1 | 26 | `#fff` | 버튼 텍스트·카드 위 글자 |
| 2 | 12 | `#ff4f64` | = `--red`(토큰 우회) |
| 3 | 12 | `#6c5ce7` | = `--violet`(토큰 우회) |
| 4 | 11 | `#1fc98e` | = `--sage` |
| 5 | 9 | `#ff9f1c` | = `--gold` |
| 6 | 8 | `#ff6b4a` | MZ 그라디언트 |
| 7 | 4 | `rgba(108,92,231,0.08)` | violet 8% |
| 8 | 4 | `#ffd54f` | 골드 하이라이트 |
| 9 | 4 | `#fd79a8` | 핑크(마니또/리캡) |
| 10 | 4 | `rgba(255,255,255,.2)` | 어두운 카드 위 반투명 |
| 11 | 3 | `#38bdf8` | 하늘색(심해 테마·차트) |
| 12 | 3 | `rgba(108,92,231,0.25)` | |
| 13 | 3 | `rgba(255,255,255,.6)` | |
| 14 | 3 | `#64748b` | 슬레이트 회색 |
| 15 | 3 | `#00f2fe` | 네온 시안 |
| 16 | 3 | `#f39c12` | 오렌지 |
| 17 | 3 | `#ffffff` | |
| 18 | 3 | `#111` | |
| 19 | 3 | `#2e7d32` | 녹색(성공) |
| 20 | 3 | `#e8f5e9` | 연녹 배경 |

(다음 순위: `#c8e6c9` 3, `#9a9eb8` 3, 테마 프리뷰용 `#0b0c0e`/`#050510`/`#0a0826` 2씩.) 상위 5개 중 4개가 이미 CSS 변수로 존재하는 색의 리터럴 복제다.

---

## 6. 테마

- **루트 토큰**(`:root` 37~60행): `--paper --card --card2 --ink --ink-soft --ink-faint --red(-soft/-line) --gold(-soft/-line) --sage(-soft/-line) --violet(-soft/-line) --rule --rule-soft --radius(22px) --radius-sm(14px) --maxw(480px) --shadow --shadow-sm --mz1 --mz2 --grad --chip --font --mono --topbar-bg --bottomnav-bg --card-backdrop --card-border --body-gradient --input-bg --spring-bounce --paper-soft-shadow` = 39개. 폰트: `--font:'Noto Sans KR','Pretendard',…`, `--mono:'IBM Plex Mono'`; `<head>`에서 Google Fonts(Fraunces, Noto Serif KR, Noto Sans KR) 로드.
- **data-theme 값(8종, CSS 62~230행)**: `black`(`dark` 별칭), `white`(`light` 별칭), `dark-space`, `glowing-space`, `deep-sea`, `daylight-beach`, `sunset-beach`, `urban-city`. JS `THEMES` 배열(2508~2517)이 id·이름·설명·미리보기·`metaColor`를 가짐(블랙·화이트·까만 우주·빛나는 우주·심해·대낮 해변·석양 해변·깔끔한 도심).
- **전환 흐름**: 부트 시 2288~2292행에서 `localStorage['ourgoal_current_theme']`(기본 `white`, `dark→black`, `light/system→white` 정규화)을 `<html data-theme>`에 즉시 적용 → 로그인 후 `applyAppSettings(settings)`(2531)가 `settings.theme` 우선 적용 → `applyTheme(themeId)`(2519)가 `data-theme` 세팅 + `<meta name=theme-color>` 갱신 + localStorage 저장. 설정 화면 `#themeGrid`는 `renderSettingsScreen` 19920~19946에서 `.theme-card[data-themeid]`로 렌더, 클릭 시 `settings.theme` 저장(`saveProfile`) + `applyTheme` + 토스트.
- **시스템 다크모드**: `@media (prefers-color-scheme: dark)` 블록(994~1025)은 `html:not([data-theme])`일 때만 적용되지만, 부트 스크립트가 항상 `data-theme`를 세팅하므로 실질적으로 비활성.
- **고대비**: `settings.highContrast` → `<html data-high-contrast="true">`(2538), CSS 230행 `[data-high-contrast="true"]` + 233행 다크 계열 조합. 별도로 `@media (prefers-contrast: more)`(986~) OS 설정 대응. 설정 스위치 `#highContrastSwitch`.
- **글자 크기**: `settings.fontSize` ∈ small/normal/large/xlarge → `body.font-small(0.92rem)/.font-large(1.06rem)/.font-xlarge(1.18rem)`(CSS 256~258, 291~293 중복 정의). 컨트롤 `#fontSizeToggle[data-fs]`(19970).
- **UX 모드(홈 레이아웃 변형)**: `body[data-ux-mode=minimal|gamified|analyst]`(CSS 533~546) — `switchUxMode`(6242), `localStorage['ourgoal_ux_mode']`, 미니멀은 크루위젯·퀵루틴·잔디·피드백버튼·챌린지버튼을 `display:none!important`.
- **기타 설정 저장 키**: `ourgoal_settings_<userId>`(로컬 설정 백업), `ourgoal_goals_backup_<userId>`, `ourgoal_sid`, `ourgoal_attrib`, `ourgoal_lv_day`, `ourgoal_device_id`, `ourgoal_login_at`, `ourgoal_gcal_events`, `ourgoal_guest_profile`, `ourgoal_remote_logout_trigger`, `ios_pwa_dismissed`, 오프라인 큐 `this.QUEUE_KEY`. 데이터 절약 모드 `#dataSaverSwitch`는 설정값만 저장(CSS 훅 없음).

---

## 7. 기능 보존 체크리스트

형식: `- [ ] 기능 — 진입점(id/함수, 행) — 화면`. 총 **184항목**(`grep -c '^- \[ \]'` 측정값).

### 인증·계정
- [ ] 랜딩 → 이메일 가입 진입 — `#landStartBtn` — 랜딩
- [ ] 랜딩 → 로그인 진입 — `#landLoginLink` — 랜딩
- [ ] 카카오 OAuth 로그인(Supabase `signInWithOAuth`, 미지원 시 폴백 모달) — `#landKakaoBtn/#authKakaoBtn` → `startOAuthLogin` 3186 — 랜딩/인증
- [ ] 구글 로그인(GIS 토큰 클라이언트 + One Tap) — `#landGoogleBtn/#authGoogleBtn` → `startGoogleLogin` 3135, `initGoogleOneTap` 3155, `handleGoogleUserSuccess` — 랜딩/인증
- [ ] 이메일(아이디) 로그인 — `#loginSubmit` 3370, `#loginUser/#loginPass`, `#loginError` — 인증
- [ ] 회원가입(아이디·닉네임·비번 확인, sha256 해시) — `#signupSubmit` 3345, `sha256Hex` — 인증
- [ ] 로그인/회원가입 탭 전환 — `.auth-tab[data-authtab]` — 인증
- [ ] 약관·개인정보처리방침 열람 — `#authTermsLink/#authPrivacyLink/#viewTermsBtn/#viewPrivacyBtn/#setTermsLink/#setPrivacyLink` → `showLegalModal` 4024 — 인증/설정
- [ ] 로그아웃 — `#logoutBtn` 3383 → `performLogout` 3299 — 설정
- [ ] 계정 데이터 초기화 — `#resetBtn` 3388 — 설정
- [ ] 회원 탈퇴(`/api/withdraw`) — `#withdrawBtn` 3452 → `withdrawAccount` 3398 — 설정
- [ ] 다른 기기 원격 로그아웃(Supabase 브로드캐스트 채널) — `#logoutOtherDevicesBtn` 19756, `setupUserSessionRealtime` 10361, `checkRemoteSessionRevoked` 3312 — 설정
- [ ] 2FA 스위치(설정값) — `#twoFactorSwitch` — 설정
- [ ] 계정 이메일 표시 — `#setAccountEmail` — 설정
- [ ] 게스트 프로필 로컬 저장 — `ourgoal_guest_profile`, `defaultProfile` — 전역
- [ ] 유입 경로 기록(attribution/landing 트래킹) — `recordLanding` 2402, `track` 2415, `ourgoal_attrib` — 전역

### 온보딩·가이드
- [ ] 4단계 온보딩(프리셋 목표 → 목표 작성 → 마일스톤 미리보기 → 첫 기록) — `startOnboarding` 3552, `showObStep1~4` — 모달
- [ ] 온보딩 중 목표 생성·첫 체크인 저장 — `trackGoalCreated(…,'onboarding')` 3688, `saveQuickCheckin(…,'onboarding')` 3743 — 모달
- [ ] 소통 투어 모달 — `showCommTourModal` 3760 — 모달
- [ ] 최초 로그인 6단계 활용 가이드 — `maybeShowFirstLoginGuide` 3780, `showGuideStep1~6` — 모달
- [ ] 가이드 다시보기 — `#btnRestartGuide` 3455 — 설정
- [ ] 스타터 목표 빠른 생성 — `quickCreateStarterGoal` 6424, `data-starter` — 홈(목표 없음 상태)

### 홈·체크인
- [ ] 인사말·오늘 날짜 — `#homeGreeting`, `renderHome` 6448 — 홈
- [ ] 오늘 상태 요약 필 — `#todayGlancePill`, `renderTodayGlancePill` 6666 — 홈
- [ ] UX 모드 전환(미니멀/게이미피케이션/분석가) — `#adaptiveModeSelector .mode-chip` → `switchUxMode` 6242, `renderAdaptiveModeBar` — 홈
- [ ] 크루 페이싱 위젯 + 크루원 찌르기 — `#crewPacingWidget`, `renderCrewPacingWidget` 6270, `#btnNudgeCrewMates` → `nudgeCrewMates` 6314 — 홈
- [ ] 데일리 퀘스트 바(게이미피케이션 모드) — `#dailyQuestBarWrap`, `renderDailyQuestBar` 6691 — 홈
- [ ] 오프라인 모드 배너·오프라인 큐 동기화 — `#offlineNoticeBanner`, `QUEUE_KEY` — 홈
- [ ] 퀵 루틴 칩 5종(텍스트 프리필) — `#quickRoutineRow .goal-chip[data-quickroutine]` — 홈
- [ ] 줄글 체크인 입력 + 실시간 테마 자동인식·글자수 — `#captureInput`, `#captureLiveMeta/#captureLiveTheme/#captureCharCount`, `classifyRecordTheme` 6145 — 홈
- [ ] 음성 입력(Web Speech API) — `#micBtn` 7344~7375, `#micStatus` — 홈
- [ ] 체크인 사진 첨부(리사이즈·미리보기) — `#capturePhotoBtn` 7432, `#capturePhotoInput`, `#capturePhotoPreview`, `compressImage` 7404 — 홈
- [ ] 외부 데이터 불러오기 모달 — `#importExternalBtn` 8619 — 홈
- [ ] 체크인 저장(+XP·스트릭·햅틱·컨페티·AI 피드백) — `#captureSave` 7338 → `saveQuickCheckin` 6218, `buildCheckinRecord` 6199 — 홈
- [ ] AI 피드백(서버 Claude `/api/feedback` / Gemini 직접 / 로컬 폴백) — `requestAIFeedback` 7719, `requestGeminiFeedback` 7765, `localFeedback` 7799, `renderFeedbackSlot` 8207 — 홈/기록
- [ ] AI 진행상황 자동 업데이트 제안 모달 — `maybeShowGoalUpdateModal` 7926, `#autoUpdateSwitch` — 홈
- [ ] 맞춤 피드백 봇 설정 화면(대화형 프롬프트 생성 `/api/promptgen`) — `#customFeedbackBtn/#settingsCustomFeedbackBtn` → `openFeedbackSetup` 8009, `renderFeedbackSetup` 8047, `#fbSetupBack` — 피드백설정
- [ ] 오늘의 미션 카드(`/api/todaymission` + 로컬) — `#todayMissionCard`, `renderTodayMissionCard` 9714 — 홈
- [ ] 홈 잔디(기록 요약) 카드 — `#homeGrassSummaryCard`, `renderHomeGrassSummary` 6623 — 홈
- [ ] 내 목표 카드 리스트(게이지 SVG·D-day·진행률) — `#homeGoalList`, `gaugeSvg` 4080, `goalProgress` — 홈
- [ ] 목표 카드 드래그 정렬 — `data-draggoal`, `reorderGoal` 10439, `shiftGoalOrder`, `.drag-handle` — 홈/목표
- [ ] 집중 타이머(포커스 오토파일럿) — `data-focusgoal` → `openFocusAutoPilotModal` 6945 — 홈
- [ ] 새 목표 버튼 — `#homeAddGoal` 6510 → `promptNewGoal` 8665 — 홈
- [ ] 소규모 챌린지 룸(참여/퇴장/친구 초대) — `#homeChallengeRoomBtn` 6610 → `openChallengeRoomModal` 7238 — 홈
- [ ] MZ 성장 자랑 스토리 카드(캔버스 PNG 저장·웹 공유·링크/텍스트 복사) — `#mzShareBtn` 6614 → `openMzShareCardModal` 7069, `generateMzStoryCanvas` — 홈
- [ ] 스트릭 배지·스트릭 프리즈 — `#streakBadge/#streakFreezeBadge`, `computeStreakDays` 5988, `maybeGrantStreakFreeze` 6014, `maybeApplyStreakFreeze`, `checkStreakFreeze` — 홈
- [ ] 가상 페르소나 첫 응원(시뮬 서버 `localhost:7777`) — `triggerFirstCheerResponse` 7571, `scheduleCheerDelivery` 7606, `#virtualCheerSwitch` — 홈/피드
- [ ] iOS PWA 설치 안내 배너 — `renderIosPwaBanner` 6355, `#iosPwaSlot` — 홈
- [ ] 체크인 리마인더 배너(설정 시간대) — `setupNotifyTimer` 20356, `showNotifyBanner` 20376, `generateDynamicNotification` — 홈
- [ ] 소셜 알림 배너(새 응원·마니또) — `checkSocialNotifications` 20450, `showSocialNotifyBanner` 20464 — 홈

### 게이미피케이션
- [ ] XP 적립·레벨 계산 — `awardXP` 2713, `levelForXP` 2702, `xpForLevel`, `levelProgress` — 전역
- [ ] 레벨 배지 행 + 레벨업 배너 — `#levelBadgeRow`, `renderLevelBadge`, `showLevelUpBanner` 2733 — 홈
- [ ] 명예의 전당(뱃지 컬렉션) — `openHallOfFame` 2771, `badgeContext` — 모달
- [ ] 컨페티 — `burstConfetti` 2453 — 전역
- [ ] 햅틱 피드백(vibrate 패턴) — `triggerHaptic` 2551 — 전역
- [ ] 앱 아이콘 배지(`setAppBadge`) — `updateAppBadge` 6004 — 전역
- [ ] 마일스톤 완료 축하 + 다음 행동 제안(`/api/nextaction`) — `celebrateMilestoneDone` 9767, `requestNextActionSuggestion` 9749 — 목표

### 목표
- [ ] 개인/팀 목표 서브탭 — `#goalsSubtabs[data-gsub]` 9787 — 목표
- [ ] 대화형 목표 에이전트(추가·변경·삭제, `/api/goalagent`) — `#goalAgentInput/#goalAgentSendBtn` 9472 → `sendGoalAgentMessage` 9458, `showGoalAgentReviewStep` 9372 — 목표
- [ ] 목표 공개범위 배지·변경 — `#goalsPrivacyBadge` → `openPrivacyPickerModal('goal')` 3910, `updatePrivacyBadges` 3892 — 목표
- [ ] 편집 모드 토글 — `#goalEditToggle` 9817 — 목표
- [ ] 목표 칩 행(선택·추가) — `#goalChipRow`, `#chipAdd` — 목표
- [ ] 새 목표 생성(AI 대화 → 템플릿 `/api/goaltemplate` → 검토 → 수동 폼) — `promptNewGoal` 8665, `generateGoalTemplate` 8669, `showNewGoalManualForm` 8782 — 모달
- [ ] 목표 현재 종합상황 AI 요약(`/api/goalstatus`) — `#goalStatusTag/#goalStatusText`, `generateGoalStatusSummary`, `refreshGoalStatusSummary` — 목표
- [ ] 목표 마감일 편집·D-day — `#goalDueInput`, `dDay`, `ddayMini` — 목표
- [ ] 목표 공개범위 셀렉트 — `#goalVisInput` — 목표
- [ ] 마일스톤 CRUD(제목·날짜·상태 순환·우선순위·삭제·순서 이동) — `#addMsBtn`, `data-msinput/msdate/mstoggle/cyclestatus/cyclepriority/msdel/msup/msdown` — 목표
- [ ] 마일스톤 필터(전체/진행/대기/완료) + 전체 접기 — `#msFilterToggle[data-msfilter]` 9915, `#msCollapseAllBtn` — 목표
- [ ] 마일스톤 다중 선택 삭제 — `#selAllBtn/#selDeleteBtn/#selDeleteAllBtn`, `data-selms/seltask`, `.sel-bar` — 목표
- [ ] 마일스톤 드래그 정렬 — `reorderMilestones`, `.dragging/.dragover/.drop-target` — 목표
- [ ] 할 일(task) CRUD·체크·날짜 — `data-addtask/taskinput/taskid/taskdate/deltask`, `.task-*` — 목표
- [ ] 참고자료 첨부(영상/이미지/메모/링크) 추가·보기·삭제 — `openAddAttachmentModal` 8969, `openAttachmentViewer` 8947, `data-addattms/addatttask/openatt`, `.att-chip` — 목표
- [ ] 마일스톤/할 일을 구글 캘린더에 빠른 동기화 — `data-calsync*`, `quickSyncToCalendar` — 목표
- [ ] 결과 기록(마일스톤/할 일/목표 단위, 노션 카드 입력 + AI 변환) — `#goalResultBtn`, `data-msresult/taskresult` → `openResultModal` 4403, `openAiResultAssistantModal` 4211 — 목표
- [ ] 목표 스냅샷 내보내기(개별/전체) — `#goalExportBtn/#goalExportAllBtn` → `exportGoalSnapshot` 9557 — 목표
- [ ] 목표 보관/복원 — `data-arch`, `data-restore`, `archiveGoal` 9572, `restoreGoal` 9585 — 목표/기록
- [ ] 목표 순서 이동 버튼 — `data-shiftgoal` — 목표
- [ ] 팀 목표 탭(모임별 목표, 안내 모달, 댓글 실시간) — `renderTeamGoalsScreen` 11064, `canManageTeamGoals`, `setupTeamCommentsRealtime` 10378 — 목표
- [ ] 팀 목표 추가/마일스톤/상태 순환/삭제 — `promptNewTeamGoal` 11402, `data-tg*` — 목표
- [ ] 수준별 조/그룹 추가·상세(목표·마일스톤·할 일) — `data-addlevelgroup`, `openLevelGroupDetailModal` 10769, `data-lg*` — 목표
- [ ] 팀 목표 댓글 작성·신고 — `data-cmtinput/cmtsend/reportcmt`, `teamCommentsBlockHtml` — 목표
- [ ] 목표 달성 인증서 이미지 — `openGoalCertificateModal` 17579 — 기록(보관 목표)

### 일정(캘린더)
- [ ] 월/주/일 뷰 전환 — `#calViewToggle[data-calview]` 5819 — 일정
- [ ] 이전/오늘/다음 이동 + 기간 라벨 — `#calPrevBtn/#calTodayBtn/#calNextBtn/#calPeriodLabel`, `calShift` — 일정
- [ ] 캘린더 그리드(목표·마일스톤·할 일·기록·구글 이벤트 필) — `#calGrid`, `renderCalendarScreen` 5733, `calCellHtml`, `calendarItemsByDate` — 일정
- [ ] 일 상세(항목별 보기·기록 열기·해당일 관리) — `#calDayDetail`, `renderCalDayDetail` 5865, `data-calviewrec`, `#calOpenHubBtn`, `#calEmptyAddBtn` — 일정
- [ ] 해당일 관리 허브 + 일정 수동 추가/편집/삭제 — `openCalendarDayEditHubModal` 5493, `openCalendarManualEditModal` 5605 — 모달
- [ ] AI 일정·참고자료 등록 비서(자연어) — `#calAgentInput/#calAgentSendBtn` 5835 — 일정
- [ ] 일정 공개범위 배지 — `#calPrivacyBadge` — 일정
- [ ] 구글 캘린더 연동 배너(설정/지금 동기화) — `#calGoogleBanner`, `#calBannerSetBtn/#calBannerSyncBtn` — 일정
- [ ] 구글 캘린더 연결(토큰 클라이언트·클라이언트 ID) — `#gcalQuickConnectBtn` 20010, `tryConnectGoogleCalendar` 5025, `openGoogleCalendarConnectModal` 5048, `#gcalClientIdInput` — 설정
- [ ] 구글 이벤트 가져오기(`ourgoal_gcal_events`) — `fetchGoogleCalendarEvents` 5085 — 일정
- [ ] 전체 동기화/자동 동기화/연동 해제 — `#gcalSyncNowBtn`, `#gcalAutoSyncSwitch`, `#gcalDisconnectBtn`, `syncAllToGoogleCalendar` 5133 — 설정
- [ ] 구글 일정 → 목표 반영 / 목표 → 캘린더 반영 모달 — `#gcalImportBtn` → `openGcalImportModal` 5222 / `#gcalExportBtn` → `openGcalExportModal` 5287 — 설정

### 기록·분석
- [ ] 새 기록/기록 수정 모달(텍스트·테마·카테고리·시간·사진) — `#recAddBtn` 16668, `data-recedit` → `openRecordModal` 16575 — 기록
- [ ] 기록 삭제 — `data-recdel` — 기록
- [ ] 기록 공개범위 배지 — `#recPrivacyBadge` — 기록
- [ ] AI 대화형 기록 비서(자연어 파싱 → 확인 모달) — `#recAgentInput/#recAgentSendBtn` 16181, `handleConversationalRecord` 11917, `openConversationalRecordConfirmModal` 11922 — 기록
- [ ] 기록 실시간 AI 피드백 슬롯 — `#recFeedbackSlot`, `renderRecordFeedbackSlot` — 기록
- [ ] 전문(맞춤) 템플릿 기록 표 열기 — `#recOpenProTemplateBtn` 16197, 퀵칩 `data-quicktpl`(헬스/크로스핏/하이록스/공부/영업) → `openProTemplateRecordModal` 14874 — 기록
- [ ] 템플릿 표 행 추가/삭제/셀 편집 — `#proAddRowBtn`, `data-delrow`, `.pro-tpl-cell-input` — 모달
- [ ] 템플릿 표 분석 배너·KPI — `#proAnalyticsWrap`, `computeTableAnalytics`, `renderAnalyticsHtml` — 모달
- [ ] 템플릿 트렌드 SVG 차트(7회/30일/전체) — `#proTrendChartWrap`, `renderTrendSvgChart` 13075, `.pro-trend-filter-chip` — 모달
- [ ] 인앱 스톱워치(모드 칩·비프) — `#proStopwatchWrap`, `renderStopwatchWidgetHtml` 13198, `data-swmode`, `playTimerBeep` — 모달
- [ ] 템플릿 기록 사진 첨부 — `#proPhotoPickBtn/#proFileInput/#proPhotoPreview` — 모달
- [ ] 템플릿 CSV 내보내기/가져오기 — `#proCsvExportBtn` → `downloadTableAsCsv`, `#proCsvImportBtn` → `openCsvImportModal` 13648 — 모달
- [ ] 템플릿 열 편집 — `#proEditColsBtn` → `openTemplateColumnEditModal` 12710 — 모달
- [ ] 맞춤 템플릿 생성(자연어 스펙·AI 추천) — `#recCreateCustomTplQuickBtn` 16204, `#proCreateTplBtn` → `openCreateCustomTemplateModal` 12477, `recommendTemplateFromAI` — 모달
- [ ] 템플릿 마켓(카테고리·검색·복제, 리워드 광고 게이트) — `#recOpenMarketQuickBtn` 16212, `#proTplMarketBtn` → `openTemplateMarketModal` 14679, `cloneTemplate` 14779, `handleTemplateCloneWithAd` 14651, `showWebRewardedAdModal` 14531 — 모달
- [ ] AI 코치 리포트(표 기반) — `#proCoachBtn` → `openProCoachReportModal` 13301 — 모달
- [ ] 노션 DB 전송(`/api/notion-push`, 자동 전송 스위치) — `#proNotionExportBtn` → `openProNotionExportModal` 13463, `pushRecordToNotion` 13227, `#notionAutoPushSwitch` — 모달/설정
- [ ] 웨어러블 동기화(시뮬) — `#proWearableSyncBtn` → `openWearableSyncModal` 13696 — 모달
- [ ] 사진 OCR → 표(`/api/vision-table`, 일일 쿼터) — `#proVisionOcrBtn` → `openVisionTableModal` 13850 — 모달
- [ ] 음성 → 표 행 — `#proVoiceInputBtn` → `openVoiceTableModal` 14130 — 모달
- [ ] 템플릿 기록 일반 저장 / 일정 연동 저장 — `#proGeneralSaveBtn/#proCalendarSaveBtn`, `executeSave`, `syncRecordToMatchingGoals` — 모달
- [ ] 템플릿 기록 상세 보기 + 딥링크 — `openTemplateRecordDetailModal` 15724, `checkRecordDeepLink` 15849 — 모달
- [ ] 주간 요약 — `#weekSummary`, `calculateWeeklyFocusStats` — 기록
- [ ] 라이프 밸런스 휠(5대 테마 도넛·범례 필터) — `#lifeBalanceBox`, `renderLifeBalanceWheel` 11733, `svgCategoryDonut` 11645 — 기록
- [ ] 주간 막대 차트 — `#chartContainer`, `renderWeekChart` 11426 — 기록
- [ ] 기록 히트맵(연간 잔디, 셀 선택 상세) — `#recordHeatmap`, `renderRecordHeatmap` 11464, `updateSelectedDateInfo` — 기록
- [ ] 리포트 요약(7/30일 트렌드 SVG·범례) — `#reportSummary`, `renderReportSummary` 11647, `svgTrendChart` 11626, `#reportPeriodToggle` — 기록
- [ ] 위클리 리캡 이미지 생성·저장·공유 — `#weeklyRecapBtn` 16669 → `openWeeklyRecapModal` 16433 — 기록
- [ ] 완료·보관한 목표 목록(복원·인증서) — `#archivedGoals`, `renderArchivedGoals` 9605 — 기록
- [ ] 기간별 AI 종합 피드백(프리셋/날짜 범위/건수) — `#periodAiCard`, `initPeriodAiCard` 15867, `generatePeriodAIFeedback` 15976, `#periodAiRequestBtn` — 기록
- [ ] 테마 필터 칩 — `#recThemeFilters`, `renderRecordThemeFilters` 11786 — 기록
- [ ] 기록 검색(날짜·테마·키워드) — `#recSearchInput`, `filterRecordsByQuery` 11717 — 기록
- [ ] 기록 리스트(카드: 시간·테마칩·사진 썸네일·편집·삭제·테마 변경) — `#recordsList`, `.rec-card`, `openThemePickerModal` 11817, `openPhotoViewerModal` 7387 — 기록
- [ ] 날짜별 기록 다운로드(테마별 CSV/JSON/MD/ICS + AI 프롬프트) — `#exportRecordsBtn` 16955 → `openExportThemeModal` 16803, `buildCSV` 16686, `buildICS` 16713, `buildMarkdownExport`, `getAIAnalysisPrompt` — 기록

### 소통
- [ ] 소통 서브탭 5종(피드/모임/마니또/공유/DM) — `renderCommScreen` 17316 — 소통
- [ ] 피드에 목표/기록 게시 모달 — `#btnCommPostFeed` → `openShareToFeedModal` 8309 — 소통
- [ ] 피드 카테고리 필터 — `data-feedcat`, `filterFeedByCategory`, `.feed-filter-chip` — 피드
- [ ] 피드 게시글 카드(작성자·목표·사진·AI 태그·시간) — `feedPostHtml` 18040, `renderCommFeed` 18070 — 피드
- [ ] 피드 반응 4종(하트/박수/불/스파클) — `data-reacttype`, `toggleFeedReaction` 18010 — 피드
- [ ] 피드 댓글 보기/작성/삭제 + 퀵 리플 — `data-togglecomments/cinput/sendcomment/delcomment/quickreply`, `handleUserCommentSubmit` 17947 — 피드
- [ ] 피드 게시글 삭제(본인) — `data-delpost` — 피드
- [ ] 게시글 신고 — `data-reportpost`, `contentReports` — 피드
- [ ] 사용자 차단/해제·차단 목록 — `data-blockuser`, `blockUser` 10478, `unblockUser`, `openBlockedUsersModal` 10521, `#manageBlockedBtn` — 피드/설정
- [ ] 피드 실시간 갱신(Supabase `feed_posts_channel`) — `setupFeedPostsRealtime` 17892 — 피드
- [ ] 가상 페르소나 응원·댓글 시뮬 — `addSimulatedCheerAndReplyToPost` 8264 — 피드
- [ ] 모임 목록·참여 현황·집단 게이지 — `renderCommGroups` 18455, `collectiveGaugeHtml`, `groupStreak` — 모임
- [ ] 새 모임 만들기(지역·카테고리 선택) — `#commAddGroup` → `promptNewGroup` 18780, `regionPickerHtml`, `categoryPickerHtml` — 모임
- [ ] 모임 상세(인증 피드·사진 인증·응원·잇템) — `renderGroupDetail` 18536, `#grpPickPhotoBtn`, `#grpCheer`, `data-cheervf`, `.grp-photo-*` — 모임
- [ ] 모임 초대(카카오톡 공유·링크 복사·남은 정원) — `#grpKakaoInviteBtn` → `shareGroupToKakao` 18974, `#grpCopyLinkBtn` → `copyGroupInviteLink` 18998, `calculateRemainingSeats` — 모임
- [ ] 초대 성공 모달 / 초대 링크 랜딩·수락 — `openPeerInviteSuccessModal` 19005, `showPeerInviteLandingModal` 19120, `acceptPeerInvite` 19046, `checkAndHandlePeerInviteUrl` 19184 (`?invite`, `?invite_group`, `?room_name`, `?max`, `?type`) — 모임
- [ ] 마니또 매칭·익명 이름·오늘 미션·재매칭·다시 뽑기·그만두기·정체 공개 제안 — `renderCommManito` 19296, `#mnReshuffle/#mnRegen/#mnQuit`, `data-mnreveal` — 마니또
- [ ] 마니또 DM — `data-mndm` → `renderManitoDm` 19463, `#mnDmSend`, `#mnDmBack` — 마니또
- [ ] 공유 탭: 목표 선택 → 플랫폼(카톡/인스타/틱톡/쓰레드) 배지 선택 → 비율 → 미리보기 이미지 생성·저장·공유 — `renderCommShare` 17632, `data-sharegoal`, `.share-badges`, `data-scratio`, `#sharePreviewBtn`, `data-imgsave/imgshare`, `generateShareImage` 17405 — 공유
- [ ] 크리에이터 템플릿으로 목표 시작 — `data-tmpl`, `cloneTemplate` 17862, `.tmpl-card` — 공유
- [ ] 공유 탭 → 피드 게시 링크 — `#toFeedLink` — 공유
- [ ] DM 목록·스레드·전송 — `renderCommDM` 19498, `#dmSend`, `#dmBack`, `.dm-*` — DM
- [ ] Web Share API 파일 공유(리캡·인증서·공유 이미지·MZ 카드·초대) — `navigator.share` 7180/16544/17610/17809/18982 — 여러 곳
- [ ] 클립보드 복사 폴백 — `copyTextToClipboard`, `fallbackCopyText` — 여러 곳

### 프로필·설정
- [ ] 프로필 카드(아바타·이름·바이오·통계) — `#profileCard`, `renderProfileCard` 4700 — 설정
- [ ] 프로필 편집(아바타 업로드/삭제·바이오·관심사·잇템) — `openProfileEditor` 4758, `#avatarFile`, `resizeImageToDataUrl`, `paintInterests`, `paintItItems` 4824 — 설정
- [ ] 잇템 클릭 통계 — `#itemStatsList`, `.item-stat-row` — 설정
- [ ] 공개 범위 4종 셀렉트(목표/일정/기록/통계) + 온라인 상태 표시 — `#privGoalSelect/#privCalSelect/#privRecSelect/#privStatsSelect`, `#onlineStatusSwitch` — 설정
- [ ] 체크인 알림 시간 칩 추가/삭제·추천 프리셋 — `#checkinTimesRow`, `#addTimeBtn` 20230, `#presetTimesBtn` 19836, `data-timeidx/timedel` — 설정
- [ ] 탭 열림 중 알림 스위치 + 소프트 애스크 + 웹푸시 구독(`/api/vapid-public-key`, `/api/push-subscribe`, `push_subscriptions`) — `#notifySwitch`, `openNotificationSoftAskModal` 19543, `syncPushSubscription` 20398, `removePushSubscription` — 설정
- [ ] 야간 방해금지 시간대 — `#quietHoursSwitch`, `#quietStartInput/#quietEndInput`, `isWithinDND` — 설정
- [ ] 유형별 알림 4종(모임원 인증/응원·댓글/D-day/스트릭) — `#notifTeamSwitch/#notifCheersSwitch/#notifDdaySwitch/#notifStreakSwitch` — 설정
- [ ] 테스트 알림 — `#testNotifyBtn` 20235 — 설정
- [ ] 테마 8종 선택 — `#themeGrid .theme-card[data-themeid]` 19927, `applyTheme` 2519 — 설정
- [ ] 고대비 모드 — `#highContrastSwitch`, `data-high-contrast` — 설정
- [ ] 글자 크기 4단계 — `#fontSizeToggle[data-fs]` 19970 — 설정
- [ ] 데이터 절약 모드 — `#dataSaverSwitch` — 설정
- [ ] AI 제공자 전환(Claude/Gemini) + Gemini 키·모델 입력 — `#aiProviderToggle` 20181, `#geminiKeyInput/#geminiModelInput` — 설정
- [ ] 가상 페르소나 응원 수신 스위치 — `#virtualCheerSwitch` — 설정
- [ ] Notion 자동 동기화(웹훅 URL·API Key·DB ID·테스트 전송) — `#notionSwitch`, `#notionWebhookInput/#notionApiKeyInput/#notionDbIdInput`, `#notionTestBtn`, `sendToNotion` 4982 — 설정
- [ ] 캐시 크기 표시·비우기 — `#cacheSizeText`, `#clearCacheBtn` 20208 — 설정
- [ ] 내보내기 형식 CSV/JSON — `#formatToggle[data-fmt]` 20218 — 설정
- [ ] 체크인 전체 내보내기 / 전체 백업 / 가져오기 — `#settingsExportCheckins` → `exportAllCheckins` 16952, `#settingsExportAll` 20245, `#settingsImportAll` 20249 + `#importFile` — 설정
- [ ] 1:1 문의·오류 제보 / FAQ — `#feedbackInquiryBtn` 3463 → `openCustomerInquiryModal` 19591, `#faqAccordionBtn` 20226 → `openFaqModal` 19628 — 설정
- [ ] 앱 정보 푸터(버전·문의 메일·약관 링크) — 2227~2236 — 설정

### 플랫폼·접근성·데이터
- [ ] PWA(manifest, sw.js 등록, apple-mobile-web-app 메타, theme-color 동기화) — `<link rel=manifest>` 28, `navigator.serviceWorker.register('/sw.js')` 20553 — 전역
- [ ] 안드로이드 뒤로가기로 모달 닫기(`history.pushState`/`popstate`) — `openModal` 3975, 4014 — 전역
- [ ] ESC로 모달 닫기 — 20559~20575 — 전역
- [ ] View Transitions API 탭 전환 — `setTab` 3945 — 전역
- [ ] 스크린리더 라이브 공지·스위치 ARIA — `announceToA11y` 6658, `a11ySwitch` — 전역
- [ ] prefers-reduced-motion / prefers-contrast 대응 — CSS 986~, 1589~ — 전역
- [ ] Supabase 데이터 동기화(테이블: users, goals, checkins, feed_posts, comments, team_comments, user_blocks, events, push_subscriptions) + 로컬 백업 — `ensureUserRow`, `loadProfile`, `saveProfile`, `ourgoal_goals_backup_*` — 전역
- [ ] Supabase 실시간 채널 3종(유저 세션·팀 댓글·피드) — `setupRealtimeChannelsOnce` 10347 — 전역
- [ ] OAuth 리다이렉트 오류 처리(`?error`, `?error_description`, `?code`) — 19193, 20494~20495 — 전역
- [ ] 유입 세션 ID·디바이스 ID·로그인 시각 저장 — `getSid`, `getDeviceId`, `setDeviceLoginTime` — 전역
- [ ] 가로 오버플로우 방어·타이포 리듬(암행어사 패치) — CSS 1589~1600 — 전역

---

## 8. 아이콘·이모지 사용

- **아이콘 체계: 이모지 위주 + 소수 인라인 SVG. 아이콘 폰트 없음**(`<i class=` 0회, 외부 아이콘 CSS 없음).
- 인라인 `<svg>`: HTML 셸 8개(구글 G 로고 2 + 하단 내비 6), JS 4개(`gaugeSvg` 4085 목표 게이지 링, `svgTrendChart` 11626 리포트 트렌드, `svgCategoryDonut` 11645 라이프밸런스 도넛, `renderTrendSvgChart` 13103 템플릿 트렌드). 하단 내비 SVG 세트: 집 / 동심원 타깃 / 달력 / 시계 / 말풍선 / 톱니 — 모두 `viewBox 0 0 24 24`, `fill:none; stroke:currentColor; stroke-width:1.8`.
- 이모지(Extended_Pictographic 코드포인트 기준): JS 944개(문자열 줄 898 + 주석 46), HTML 셸 106개, CSS `content:` 8개 → **UI 노출 약 1,012개**. 최빈: 🔥69 ✨41 🎯39 📅39 🏃37 📋29 📝28 🤖26 ⚡25 💬25 📚23 👥23 🎉21 🔒20 💪20 📷18 ✅17 🎙16 💼15 🔗15 🏋15 🧠14 ⏱14 ↗13 📥13 🏆12 🔄12 🚀11 💻11 ✏11.
- 이모지가 쓰이는 자리: 섹션 제목 접두(🤖 대화로 목표 관리, 🔒 공개 범위…), 버튼 라벨(📷 사진, 🔗 불러오기, 저장 ✨), 칩(💪 운동 완료), 상태 배지(🔒 나만 보기), 카테고리/테마 아이콘, 모달 h3, 토스트. 리디자인 시 아이콘 토큰 체계(SVG 스프라이트 또는 아이콘 컴포넌트)로 치환할 범위가 곧 이 1,000여 곳이다.

---

## 9. 수치 요약

| 항목 | 값 |
|------|----|
| 총 행수 | 20,581 |
| CSS 행(36~1601) | 1,566 |
| HTML 셸 행(1603~2280) | 678 |
| JS 행(2283~20557 메인 + 20559~20575 보조) | 18,275 + 17 |
| 최상위 화면 | 9 (랜딩 1 + 인증 1 + `.screen` 7) |
| 바텀시트 모달 호출 지점 / 모달 함수 | 71곳 / 약 60종(표 3-1) |
| 비모달 오버레이·배너 | 12종(표 3-2) |
| CSS 클래스 셀렉터 | 437종 (dead 21, 패밀리 약 140) |
| CSS 블록(`{`) / `!important` / id 셀렉터 | 약 714 / 23 / 15 |
| CSS 변수 / data-theme / keyframes / media | 39 / 8 / 11 / 5 |
| 인라인 `style="`(JS / 셸 / 합계) | 1,363 / 208 / 1,571 |
| 인라인 style 고유 값 / 고유 조각 | 856 / 604 |
| JS 하드코딩 색상(출현 / 고유) | 299 / 165 (style 속성 내 113) |
| 이모지(JS / 셸 / CSS) | 944 / 106 / 8 |
| 함수 선언 | 463 |
| `addEventListener` / `.onclick=` / `innerHTML=` | 348 / 186 / 119 |
| 셸 고유 id / JS 문자열 내 고유 id / 셸 버튼 / 셸 스위치 | 205 / 453 / 79 / 15 |
| `data-*` 속성 종류(JS) | 약 190 |
| localStorage 키 | 13 리터럴 + 1 동적(QUEUE_KEY) |
| 서버 API 경로 | 12 (`/api/feedback, goalagent, goaltemplate, goalstatus, nextaction, todaymission, promptgen, notion-push, vision-table, push-subscribe, vapid-public-key, withdraw`) + Gemini·Google userinfo 직접 호출 |
| Supabase 테이블 | 9 |
| 기능 체크리스트 항목 | 184 |
