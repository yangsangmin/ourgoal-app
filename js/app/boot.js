/**
 * OurGoal App Boot (부팅 — 구역 함수를 순서대로 부른다)
 *
 * 구역 함수를 index.html 에 있던 순서 그대로 부른다.
 * #TASK-ES-689(인라인 IIFE 마지막 정리 — 시동 문을 부팅 파일로(서버 주소·공개 키 상수 선언 두 줄만 index.html 에)): index.html 인라인 IIFE 에 마지막까지 남아 있던 문(키트 손잡이 2개 · 구역 함수 가져오기 27개 · 구역 함수 호출 27개)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로, 같은 순서로 옮겼다.
 * 통로 중계 1개(renderTeamGoalsScreen)도 함께 옮겼다 — 등록 기관에 등록할 수 없는 이름의 가져오기 줄과 그 getter 를 담은 expose 문이다(생성기 설정 relay).
 *   - renderTeamGoalsScreen: 주인 세포 js/tabs/goals/team-goals-screen.js 가 798줄이라 등록 블록을 붙이면 800줄 상한을 넘는다 — 등록 기관에 등록하지 못한 이름의 통로 중계(2026-10-11 결심 ② 글자 그대로 옮김)
 * 상태 선언 1개도 함께 옮겼다 — index.html 에 남긴 전역 상수(SUPABASE_URL · SUPABASE_ANON_KEY)를 읽는 문이다(생성기 설정 keepGlobalConst.readers).
 * 주석·빈 줄은 옮기지 않았다. index.html 에는 큰 인라인 IIFE 가 더 없고, 문자열 상수 선언 2줄(SUPABASE_URL · SUPABASE_ANON_KEY)만 껍데기 없는 최상위 스크립트에 줄 그대로 남아 있다(생성기 설정 keepGlobalConst — 커밋 훅의 HARDCODED_SECRET 규칙(금고)이 공개 키 선언 줄을 새 파일로 옮기는 것을 막는다 — 선언 두 줄만 제자리에 남기고 연결 만들기는 부팅 파일로(2026-10-12 결심 「p안 승인」 · 규칙은 건드리지 않는다)). 그 `</script>` 뒤의 동기 script 태그가 이 파일을 부르고 이 파일의 문이 그 전역 이름을 읽는다 — 나머지 문은 전부 이 파일 한 스크립트 안에서 이어서 돈다. defer·async 를 붙이지 않는다(로드 순서가 곧 실행 순서다).
 * 설계: docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5절 X9 · 5.9절
 */
(function(){
  "use strict";
  var _goalsKit = window.OurgoalGoalsKit;
  window.OurgoalAppScope.expose('index.html', {
    get renderTeamGoalsScreen(){ return renderTeamGoalsScreen; }
  });
  var renderTeamGoalsScreen = _goalsKit.renderTeamGoalsScreen;
  var _uiKit = window.OurgoalUiHelpers;
  var bootApplySavedTheme = _uiKit.bootApplySavedTheme;
  var bootAuthStateListener = _uiKit.bootAuthStateListener;
  var bootThemeList = _uiKit.bootThemeList;
  var bootAvatarLevelUpWiring = _uiKit.bootAvatarLevelUpWiring;
  var bootExposeAppState = _uiKit.bootExposeAppState;
  var bootPromptTabState = _uiKit.bootPromptTabState;
  var bootEntryAndAccountWiring = _uiKit.bootEntryAndAccountWiring;
  var bootGoogleTokenState = _uiKit.bootGoogleTokenState;
  var bootHomeAndGoalWiring = _uiKit.bootHomeAndGoalWiring;
  var bootGoalsAndTeamState = _uiKit.bootGoalsAndTeamState;
  var bootRecordsWiring = _uiKit.bootRecordsWiring;
  var bootRecordsExportWiring = _uiKit.bootRecordsExportWiring;
  var bootSharedGroupsState = _uiKit.bootSharedGroupsState;
  var bootCommSettingsAndStart = _uiKit.bootCommSettingsAndStart;
  var bootInstallAndServiceWorker = _uiKit.bootInstallAndServiceWorker;
  var bootAppConfig = _uiKit.bootAppConfig;
  var bootTemplatePartHandles = _uiKit.bootTemplatePartHandles;
  var bootAvatarCloseButton = _uiKit.bootAvatarCloseButton;
  var bootGoogleTokenSaveHandle = _uiKit.bootGoogleTokenSaveHandle;
  var bootTemplateSubtabFilterState = _uiKit.bootTemplateSubtabFilterState;
  var bootTemplateSubtabKindState = _uiKit.bootTemplateSubtabKindState;
  var bootSampleGroups = _uiKit.bootSampleGroups;
  var bootShareHandle = _uiKit.bootShareHandle;
  var bootFeedCacheState = _uiKit.bootFeedCacheState;
  var bootSharedGroupsFlag = _uiKit.bootSharedGroupsFlag;
  var bootAppStateObject = _uiKit.bootAppStateObject;
  var bootPromptDrawerState = _uiKit.bootPromptDrawerState;
  bootApplySavedTheme();
  window.OurgoalAppState.define('sb', (window.supabase && typeof window.supabase.createClient === 'function') ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null);
  bootAuthStateListener();
  bootAppConfig();
  bootThemeList();
  bootAvatarCloseButton();
  bootAvatarLevelUpWiring();
  bootAppStateObject();
  bootExposeAppState();
  bootPromptTabState();
  bootPromptDrawerState();
  bootEntryAndAccountWiring();
  bootGoogleTokenState();
  bootGoogleTokenSaveHandle();
  bootHomeAndGoalWiring();
  bootTemplateSubtabFilterState();
  bootTemplateSubtabKindState();
  bootGoalsAndTeamState();
  bootRecordsWiring();
  bootRecordsExportWiring();
  bootSampleGroups();
  bootShareHandle();
  bootFeedCacheState();
  bootSharedGroupsState();
  bootSharedGroupsFlag();
  bootCommSettingsAndStart();
  bootTemplatePartHandles();
  bootInstallAndServiceWorker();
})();
