/**
 * OurGoal App Boot (부팅 — 구역 함수를 순서대로 부른다)
 *
 * 구역 함수를 index.html 에 있던 순서 그대로 부른다.
 * #TASK-ES-685(인라인 IIFE 마지막 정리 — 남은 시동 문을 부팅 파일로(서버 연결 세 문과 그 앞에서 도는 문은 인라인에 그대로)): index.html 인라인 IIFE 에 마지막까지 남아 있던 문(키트 손잡이 1개 · 구역 함수 가져오기 26개 · 구역 함수 호출 26개)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로, 같은 순서로 옮겼다.
 * 인라인에 남은 문과 이 파일이 함께 쓰는 키트 손잡이 1개(_uiKit)는 같은 글자로 한 번 더 적었다.
 * 주석·빈 줄은 옮기지 않았다. index.html 의 인라인 IIFE 에는 문 9개가 줄 그대로 남아 있고(생성기 설정 keepInline — 커밋 훅의 HARDCODED_SECRET 규칙(금고)이 공개 키 선언 줄을 새 파일로 옮기는 것을 막는다 — 규칙은 건드리지 않는다(2026-10-11 결심 ① 제자리 인라인에 남김)), 그 `</script>` 뒤의 동기 script 태그가 이 파일을 부른다 — 인라인이 먼저 돌고 이 파일이 이어서 돈다. defer·async 를 붙이지 않는다(로드 순서가 곧 실행 순서다).
 * 설계: docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5절 X9 · 5.9절
 */
(function(){
  "use strict";
  var _uiKit = window.OurgoalUiHelpers;
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
