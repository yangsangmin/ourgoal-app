/**
 * OurGoal Heatmap Summary Card (홈 — 최근 히트맵 요약 카드)
 *
 * #TASK-ES-444 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   renderHomeGrassSummary(이전 전 13434~13484줄, 구획 주석 포함 · 구획 「최근 히트맵 요약 카드 (가상유저 요청 P7/P9)」)
 * 묶음의 함수 선언을 글자 그대로 옮겼다(묶음 전체가 함수뿐이면 구획 주석까지 통째로). 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>,
 * 같은 키트의 다른 세포 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓). 로드 중 바로 도는 문·최상위 변수는 index.html 원래 자리에 남았다.
 * index.html 은 IIFE 머리에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: #TASK-ES-423. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ============ 최근 히트맵 요약 카드 (가상유저 요청 P7/P9) ============ */
  function renderHomeGrassSummary(){
    var card = document.getElementById('homeGrassSummaryCard');
    if(!card) return;
    card.style.display = 'none';
    card.innerHTML = '';
    return;
    
    var now = new Date();
    var recDates = {};
    var dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    (L.state.profile.records || []).forEach(function(r){
      if(r && r.startAt) recDates[L.dateKey(r.startAt)] = (recDates[L.dateKey(r.startAt)] || 0) + 1;
    });

    // [#UIUX-30] 홈 히트맵 14px 스케일업 & 4주(28일) 콤팩트 뷰
    var cellsHtml = '';
    for(var i=27; i>=0; i--){
      var d = new Date(now.getTime() - i * 86400000);
      var dk = L.dateKey(d);
      var cnt = recDates[dk] || 0;
      var isToday = (i === 0);
      var dayName = dayNames[d.getDay()];
      var bg = isToday ? 'linear-gradient(180deg, #F59E0B, #D97706)' : (cnt >= 2 ? 'linear-gradient(180deg, #10B981, #059669)' : (cnt > 0 ? 'rgba(16,185,129,0.65)' : 'rgba(255,255,255,0.06)'));
      var shadow = isToday ? 'box-shadow:0 0 8px rgba(245,158,11,0.7);' : (cnt > 0 ? 'box-shadow:0 0 6px rgba(16,185,129,0.35);' : '');
      var border = isToday ? 'border:1.5px solid #F59E0B;' : 'border:1px solid rgba(255,255,255,0.08);';
      var todayCls = isToday ? ' heatmap-cell-today' : '';
      cellsHtml += '<span class="heatmap-cell-14' + todayCls + '" title="' + dk + ' (' + dayName + '): ' + cnt + '회" style="background:' + bg + ';' + shadow + border + '"></span>';
    }

    var dayHeadersHtml = dayNames.map(function(dn, idx){
      var isWknd = (idx === 0 || idx === 6);
      return '<span style="font-size:0.62rem;color:' + (isWknd ? 'var(--ink-soft)' : 'var(--ink-faint)') + ';font-weight:700;">' + dn + '</span>';
    }).join('');

    card.innerHTML = '<div class="card home-cockpit-card" style="margin-top:14px;padding:14px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;backdrop-filter:blur(16px);">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;flex-wrap:nowrap;">'
      + '  <div style="display:flex;align-items:center;gap:4px;white-space:nowrap;flex-shrink:0;"><span style="font-size:1rem;">🔥</span><span style="font-size:0.88rem;font-weight:700;color:var(--ink);white-space:nowrap;">4주 활동 기록</span><span style="font-size:0.75rem;color:var(--ink-faint);white-space:nowrap;">(최근 히트맵)</span></div>'
      + '  <span style="font-size:0.75rem;color:var(--brand);font-weight:700;background:rgba(16,185,129,0.12);padding:3px 8px;border-radius:12px;border:1px solid rgba(16,185,129,0.25);white-space:nowrap;flex-shrink:0;">' + (streak > 0 ? ('' + streak + '일 연속 몰입 중 🔥') : '첫 기록 남기기 ✨') + '</span>'
      + '</div>'
      + '<div class="home-heatmap-4w-container" style="margin-bottom:12px;">'
      + '  <div class="home-heatmap-4w-grid" style="margin-bottom:4px;">' + dayHeadersHtml + '</div>'
      + '  <div class="home-heatmap-4w-grid">' + cellsHtml + '</div>'
      + '</div>'
      + '<div style="display:flex;gap:12px;font-size:0.76rem;color:var(--ink-sub);justify-content:space-between;border-top:1px solid rgba(255,255,255,0.06);padding-top:8px;">'
      + '  <div>최근 7일 체크인: <b style="color:var(--ink);">' + stats.totalSessions + '회</b></div>'
      + '  <div>집중 일수: <b style="color:var(--ink);">' + stats.activeDays + '일</b></div>'
      + '  <div>누적 집중: <b style="color:var(--ink);">' + stats.totalMinutes + '분</b></div>'
      + '</div>'
      + '</div>';
  }

  K.renderHomeGrassSummary = renderHomeGrassSummary;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
