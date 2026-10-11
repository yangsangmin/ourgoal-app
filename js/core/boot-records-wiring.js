/**
 * OurGoal Boot Records Wiring (앱 시동 — 기록 탭 단추 연결)
 *
 * 앱이 뜰 때 기록 탭의 단추를 원래 순서 그대로 연결하는 구역 함수다.
 * bootRecordsWiring — 주소의 기록 바로가기 듣기, 샘플 기록 정리 함수, 기록 추가·타임 트래커·주간 요약 카드 단추, 검색칸, 작은 흐름 막대와 알약 단추, 문서 누름 처리를 차례로 건다.
 * bootRecordsExportWiring — 캘린더 연동 주소용 값 자리를 만들고 기록 내보내기 단추에 내보내기 창 열기를 연결한다.
 * #TASK-ES-650(구역 이전 — 앱이 뜰 때 한 번 도는 문을 순서 그대로 구역 함수로): index.html 인라인 IIFE 의 연속 구역(이전 전 4255~4270 · 4276~4278줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js mode:"region")로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 4255~4270줄(#TASK-ES-650 생성기 표지) ---- */
  function bootRecordsWiring() { /* [#TASK-ES-650] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* [#TASK-ES-585] openTemplateRecordDetailModal · checkRecordDeepLink → js/tabs/records/template-record-detail.js 로 옮김(전문 템플릿 기록 상세 모달·딥링크 책임 원문 분열 — 앞 주석 포함) */
  window.addEventListener('hashchange', L.checkRecordDeepLink);

  L.definePurgeSampleRecords(); /* [#TASK-ES-640] 로드 중 문(앞 주석 포함) → js/tabs/records/sample-purge.js 의 definePurgeSampleRecords 로 옮김 — 원래 자리에서 부른다 */

  /* ============ 위클리 리캡 카드 (스포티파이 랩드 스타일, 공유 캔버스 인프라 재사용) ============ */
  /* [#TASK-ES-474] weeklyRecapStats · fitBigFont · generateWeeklyRecapImage · findBestMoment · openWeeklyRecapModal · openLegacyRecapCanvasModal · openRecordModal → js/tabs/records/weekly-recap.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  document.getElementById('recAddBtn').addEventListener('click', function(){ L.openRecordModal(null); });
  window.OurgoalAppState.define('btnOpenTt', document.getElementById('btnOpenTimeTracker'));
  L.bindRecTimeTrackerBtn(); /* [#TASK-ES-474] 로드 중 문(앞 주석 포함) → js/tabs/records/weekly-recap.js 의 bindRecTimeTrackerBtn 로 옮김 — 원래 자리에서 부른다 */
  document.getElementById('weeklyRecapBtn').addEventListener('click', function(){ L.openWeeklyRecapModal(); });
  document.getElementById('recSearchInput').addEventListener('input', function(){ L.renderRecordsScreen(); });
  window.OurgoalAppState.define('staticPulseBar', document.getElementById('recMiniPulseBar'));
  L.bindRecPulseBar(); /* [#TASK-ES-474] 로드 중 문(앞 주석 포함) → js/tabs/records/weekly-recap.js 의 bindRecPulseBar 로 옮김 — 원래 자리에서 부른다 */
  L.bindRecCarouselPills(); /* [#TASK-ES-474] 로드 중 문(앞 주석 포함) → js/tabs/records/weekly-recap.js 의 bindRecCarouselPills 로 옮김 — 원래 자리에서 부른다 */
  L.bindRecDocumentClick(); /* [#TASK-ES-474] 로드 중 문(앞 주석 포함) → js/tabs/records/weekly-recap.js 의 bindRecDocumentClick 로 옮김 — 원래 자리에서 부른다 */
  } /* bootRecordsWiring */

  /* ---- 이전 전 index.html 4276~4278줄(#TASK-ES-650 생성기 표지) ---- */
  function bootRecordsExportWiring() { /* [#TASK-ES-650] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  window.OurgoalAppState.defineVar('_cachedSignedCalendarToken', null);
  /* [#TASK-ES-474] fetchSignedCalendarToken · buildWebCalUrl · buildICS · buildMarkdownExport · openExportThemeModal · exportAllCheckins → js/tabs/records/export-theme.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  document.getElementById('exportRecordsBtn').addEventListener('click', L.openExportThemeModal);
  } /* bootRecordsExportWiring */

  K.bootRecordsWiring = bootRecordsWiring;
  K.bootRecordsExportWiring = bootRecordsExportWiring;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
