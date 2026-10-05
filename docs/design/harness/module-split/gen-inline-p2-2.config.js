'use strict';
// 인라인 세포화 구역 P2 둘째 PR(#TASK-ES-448) — 소통·목표(팀)·설정 쪽 묶음(지도 G129·G130·G140·G152·G153·G154·G155·G158·G160·G163·G166·G167·G168)
const C = { kit: 'OurgoalCommKit', kitVar: '_commKit', beforeTag: '<script src="js/tabs/comm/index.js"></script>' };
const G = { kit: 'OurgoalGoalsKit', kitVar: '_goalsKit', beforeTag: '<script src="js/tabs/goals/index.js"></script>' };
const S = { kit: 'OurgoalSettingsKit', kitVar: '_settingsKit', beforeTag: '<script src="js/tabs/settings/index.js"></script>' };
const R = { kit: 'OurgoalRecordsKit', kitVar: '_recordsKit', beforeTag: '<script src="js/tabs/records/index.js"></script>' };
module.exports = {
  task: 'TASK-ES-448', n: 2,
  // smoke-test 샌드박스가 스텁으로 직접 정의하는 이름(index.html 에서 뽑지 않음 — scripts/smoke-test.js 257줄) — smoke 함수가 읽어도 옮길 수 있다
  smokeStubbed: ['TOPICS'],
  cells: [
    Object.assign({ key: 'sample', file: 'js/tabs/comm/sample-data.js', title: 'OurGoal Comm Sample Data (소통 탭 — 둘러보기용 예시 자료)',
      desc: ['AI 표시 문구(AI_DISCLOSURE_NOTICE)·예시 사람(SIM_PERSONAS·MOCK_PEOPLE)·날짜 도우미(daysFromNow)·외부 자료(EXTERNAL_DATA)·크리에이터 템플릿(CREATOR_TEMPLATES)·공개 범위 이름(VISIBILITY_LABELS).', '예시 모임 MOCK_GROUPS 는 초기값이 로드 중에 daysFromNow → 인라인 pad 를 불러 index.html 에 남았다. window.CREATOR_TEMPLATES 노출 문도 제자리.'],
      groups: [{ id: 'G152', names: ['AI_DISCLOSURE_NOTICE', 'SIM_PERSONAS', 'MOCK_PEOPLE', 'daysFromNow', 'EXTERNAL_DATA', 'CREATOR_TEMPLATES', 'VISIBILITY_LABELS'] }] }, C),
    Object.assign({ key: 'picker', file: 'js/tabs/goals/topic-region-picker.js', title: 'OurGoal Topic & Region Picker (목표 탭 — 카테고리·지역 고르기)',
      desc: ['TOPICS·topicLabel·topicPill = 카테고리(대범위·중범위) 이름표, REGIONS·regionPickerHtml·wireRegionPicker = 시/도·시군구 고르기,', 'normalizeSubName·customSubsFor·categoryPickerHtml·wireCategoryPicker = 카테고리 고르기(직접 만든 중범위 포함).'],
      groups: [{ id: 'G153', names: ['TOPICS', 'topicLabel', 'topicPill'] }, { id: 'G154', names: ['REGIONS', 'regionPickerHtml', 'wireRegionPicker', 'normalizeSubName', 'customSubsFor', 'categoryPickerHtml', 'wireCategoryPicker'] }] }, G),
    Object.assign({ key: 'share', file: 'js/tabs/comm/share-card.js', title: 'OurGoal Share Card (소통 탭 — 플랫폼 맞춤 공유 카드 그리기)',
      desc: ['SHARE_PLATFORMS·SHARE_CANVAS_DIMS·SHARE_DOMAIN = 플랫폼별 크기·주소, drawShareWatermark·scRoundRect·scWrapLines·scDrawLines·generateShareImage = 공유 카드 캔버스,', 'buildInviteLinkSuffix·buildShareText = 초대 링크 꼬리·공유 글. shareContent(같은 줄에 window 노출)는 index.html 에 남았다.'],
      groups: [{ id: 'G155', names: ['SHARE_PLATFORMS', 'SHARE_CANVAS_DIMS', 'SHARE_DOMAIN', 'drawShareWatermark', 'buildInviteLinkSuffix', 'scRoundRect', 'scWrapLines', 'scDrawLines', 'generateShareImage', 'buildShareText'] }] }, C),
    Object.assign({ key: 'feed', file: 'js/tabs/comm/feed-posts-sync.js', title: 'OurGoal Feed Posts Sync (소통 탭 — 피드 글 불러오기·실시간 동기화)',
      desc: ['ensureFeedPostsLoaded = Supabase feed_posts 를 한 번 불러와 캐시(FEED_POSTS_CACHE — 여러 곳이 다시 대입하므로 index.html 에 남고 통로로 읽고 쓴다), setupFeedPostsRealtime = 실시간 구독(팀 댓글·피드·사용자 세션 채널).', '시험지 guest-null-client-es377 은 #TASK-ES-447 로 인라인 합본을 읽는다.'],
      groups: [{ id: 'G158', names: ['ensureFeedPostsLoaded', 'setupFeedPostsRealtime'] }] }, C),
    Object.assign({ key: 'team', file: 'js/tabs/goals/team-state.js', title: 'OurGoal Team State (목표 탭 — 팀 참여 상태)',
      desc: ['groupState = 팀(모임) 참여 상태(localStorage 유지), groupCheckedToday·groupStreak = 오늘 인증 여부·연속 인증.'],
      groups: [{ id: 'G160', names: ['groupState', 'groupCheckedToday', 'groupStreak'] }] }, G),
    Object.assign({ key: 'teamnew', file: 'js/tabs/goals/team-goal-prompt.js', title: 'OurGoal Team Goal Prompt (목표 탭 — 새 팀 목표 만들기 창)',
      desc: ['promptNewTeamGoal = 팀 목표를 새로 만드는 창. 같은 묶음의 팀 목표 댓글 전송(window.sendTeamGoalComment)·전역 클릭/엔터 위임은 로드 중 문이라 index.html 에 남았다.'],
      groups: [{ id: 'G129', names: ['promptNewTeamGoal'] }] }, G),
    // G163 handleDeepLinkRouting·checkAndHandlePeerInviteUrl(공유 링크 안내)는 게스트 화면에서 보이는 결과가 viral-sharing.js 몫이라 이번 화면 시나리오로 못 재 다음으로 미룸.
    Object.assign({ key: 'manito', file: 'js/tabs/comm/manito-basics.js', title: 'OurGoal Manito Basics (소통 탭 — 마니또 이름·도장·상태)',
      desc: ['MANITO_ADJ·MANITO_NOUN·MANITO_EMOJI·genAnonName·hashStr = 마니또 익명 이름, MANITO_WELCOME_STAMPS·MANITO_STAMPS·sendManitoWelcomeStamp = 환영·응원 도장,', 'manitoState·manitoMajors = 마니또 상태·주 분야. window 노출·도장 쿨다운 초기화 문은 index.html 제자리에 남았다.'],
      groups: [{ id: 'G163', names: ['MANITO_ADJ', 'MANITO_NOUN', 'MANITO_EMOJI', 'MANITO_WELCOME_STAMPS', 'MANITO_STAMPS', 'sendManitoWelcomeStamp', 'hashStr', 'manitoState', 'manitoMajors', 'genAnonName'] }] }, C),
    // G165 openUserProfileModal 은 OurgoalTeamInviteComm.openUserProfileModal 이 없을 때만 쓰는 예비 경로라 화면에서 닿지 않아 다음으로 미룸(보고 목록).
    Object.assign({ key: 'softask', file: 'js/tabs/settings/notify-soft-ask.js', title: 'OurGoal Notify Soft Ask (설정 탭 — 웹 알림 허용 먼저 묻기 창)',
      desc: ['openNotificationSoftAskModal = 브라우저 알림 권한을 묻기 전에 앱 창으로 먼저 물어본다(TASK-RD-T020).'],
      groups: [{ id: 'G166', names: ['openNotificationSoftAskModal'] }] }, S),
    // G172 setupNotifyTimer·showNotifyBanner 는 알림 시각에 도는 시계라 법정 화면 시나리오로 못 재 다음으로 미룸.
    Object.assign({ key: 'support', file: 'js/tabs/settings/support-modals.js', title: 'OurGoal Support Modals (설정 탭 — 고객지원·자주 묻는 질문·잇템 신고 창)',
      desc: ['openCustomerInquiryModal = 고객지원 문의 창, openFaqModal = 자주 묻는 질문 창, openItemReportModal = 잇템 불법/유해 링크 3초 신고 창.', 'window 노출 문·위젯 설정 단추 전역 클릭 위임과 위젯 설정 창(openWidgetSettingsModal — 시험지 desktop-widget-suite 가 index.html 글자로 읽음)은 index.html 제자리에 남았다.'],
      groups: [{ id: 'G167', names: ['openCustomerInquiryModal'] }, { id: 'G168', names: ['openItemReportModal', 'openFaqModal'] }] }, S),
    Object.assign({ key: 'widget', file: 'js/tabs/settings/widget-settings-modal.js', title: 'OurGoal Widget Settings Modal (설정 탭 — 바탕화면 위젯 설정 창)',
      desc: ['openWidgetSettingsModal = 기기 바탕화면 위젯 종류·크기를 고르고 실시간 미리보기를 보여 주는 창(#TASK-ES-180). 위젯 단추 전역 클릭 위임 문은 index.html 제자리에 남았다(시험지 desktop-widget-suite 는 #TASK-ES-447 로 인라인 합본을 읽는다).'],
      groups: [{ id: 'G168', names: ['openWidgetSettingsModal'] }] }, S),
    // G176 checkAndHandleDateRollover·setupDateRolloverWatcher 는 자정이 지나야 보이는 동작이라 법정 화면 시나리오로 못 재 다음으로 미룸.
    Object.assign({ key: 'recwire', file: 'js/tabs/records/record-card-wire.js', title: 'OurGoal Record Card Wire (기록 탭 — 기록 카드 단추 연결)',
      desc: ['wireRecordCards = 기록 카드의 수정·삭제(휴지통)·테마 바꾸기·표 기록 열기 단추를 연결한다(시험지 core-confirm-es376 은 #751 로 인라인 합본을 읽는다).'],
      groups: [{ id: 'G130', names: ['wireRecordCards'] }] }, R),
    Object.assign({ key: 'stopwatch', file: 'js/tabs/records/table-stopwatch.js', title: 'OurGoal Table Stopwatch (기록 탭 — 표 기록 인터벌 타이머·스톱워치 위젯)',
      desc: ['playTimerBeep·STOPWATCH_STATE·renderStopwatchWidgetHtml·renderLapRowsHtml = 전문 템플릿 표 안 스톱워치·인터벌 타이머 위젯과 랩 줄. formatStopwatchTime(시험지 smoke 가 글자로 읽음)·window 노출 문은 index.html 제자리(시험지 stopwatch-* 는 #TASK-ES-447 로 인라인 합본을 읽는다).'],
      groups: [{ id: 'G140', names: ['playTimerBeep', 'STOPWATCH_STATE', 'renderStopwatchWidgetHtml', 'renderLapRowsHtml'] }] }, R),
  ],
};
