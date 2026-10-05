/**
 * OurGoal Record Heatmap Levels (기록 탭 — 히트맵 칸 수·색 단계·기록 검색)
 *
 * 「기록 히트맵 (GitHub 히트맵 스타일)」 묶음 전체: 히트맵 주 수·색 단계(HEATMAP_WEEKS·HEATMAP_LEVELS)·칸 단계 계산(heatmapLevel)·기록 검색 거르기(filterRecordsByQuery). heatmapLevel·filterRecordsByQuery 는 smoke-test FN_NAMES 다(인라인 합본에서 찾는다).
 * #TASK-ES-520(인라인 3단계 Z4 — FN_NAMES 묶음(목표 보관·히트맵·표 집계·표 추이·여러 지표 SVG)): index.html 인라인 IIFE 의 구간(이전 전 9879~9880 · 9881~9881 · 9882~9890 · 9891~9906줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ---- 이전 전 index.html 9879~9880줄(#TASK-ES-520 생성기 표지) ---- */
  /* ============ 기록 히트맵 (GitHub 히트맵 스타일) ============ */
  var HEATMAP_WEEKS = 18;
  /* ---- 이전 전 index.html 9881~9881줄(#TASK-ES-520 생성기 표지) ---- */
  var HEATMAP_LEVELS = ['var(--card2)','rgba(31,201,142,.35)','rgba(31,201,142,.6)','rgba(31,201,142,.85)','#1FC98E'];
  /* ---- 이전 전 index.html 9882~9890줄(#TASK-ES-520 생성기 표지) ---- */
  function heatmapLevel(count, maxCount){
    if(!count) return 0;
    if(maxCount<=1) return 4;
    var ratio = count/maxCount;
    if(ratio>0.75) return 4;
    if(ratio>0.5) return 3;
    if(ratio>0.25) return 2;
    return 1;
  }
  /* ---- 이전 전 index.html 9891~9906줄(#TASK-ES-520 생성기 표지) ---- */
  /* [#TASK-ES-446] renderRecordHeatmap · TOPIC_COLORS · svgTrendChart · svgCategoryDonut · renderReportSummary → js/tabs/records/record-heatmap-report.js 로 옮김(인라인 스크립트 세포화 P2 — 앞 주석 포함) */

  function filterRecordsByQuery(recs, query){
    var q = String(query||'').trim().toLowerCase();
    if(!q) return recs || [];
    return (recs||[]).filter(function(r){
      var text = String(r.text||'').toLowerCase();
      var label = L.fmtDateLabel(r.startAt).toLowerCase();
      var key = L.dateKey(r.startAt).toLowerCase();
      var cat = (r.category && typeof L.TOPICS !== 'undefined' && L.TOPICS[r.category]) ? String(L.TOPICS[r.category].label||'').toLowerCase() : '';
      var thObj = (typeof L.RECORD_THEMES !== 'undefined' && r.theme && L.RECORD_THEMES[r.theme]) ? L.RECORD_THEMES[r.theme] : null;
      var thLabel = thObj ? String(thObj.label||'').toLowerCase() : '';
      var subTh = String(r.subTheme||'').toLowerCase();
      return text.indexOf(q)>=0 || label.indexOf(q)>=0 || key.indexOf(q)>=0 || cat.indexOf(q)>=0 || thLabel.indexOf(q)>=0 || subTh.indexOf(q)>=0;
    });
  }

  K.HEATMAP_WEEKS = HEATMAP_WEEKS;
  K.HEATMAP_LEVELS = HEATMAP_LEVELS;
  K.heatmapLevel = heatmapLevel;
  K.filterRecordsByQuery = filterRecordsByQuery;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
