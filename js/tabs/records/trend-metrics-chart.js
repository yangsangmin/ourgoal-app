/**
 * OurGoal Records Trend Metrics Chart (기록 탭 — 측정지표 정의·실천 추이 차트 그리기)
 *
 * 측정지표 정의(TREND_METRICS: 몰입시간·실천횟수·달성률·스트릭) · 기록 탭 실천 추이 차트 칸 그리기와 지표 칩·기간 단추(renderWeekChart, #chartContainer).
 * window.TREND_METRICS 노출 줄은 index.html 원래 자리에 그대로 있다(같은 객체가 같은 순간에 달린다).
 * 같은 묶음의 여러 지표 SVG 그리기(renderMultiMetricSvg)와 그 노출 줄은 옮기지 않았다 — 시험지 tests/achievement-graph-multiset.test.js 가 index.html 에서 그 함수부터 노출 줄까지를 잘라 실행한다(합본 읽기로도 이어지는 구간이 끊긴다).
 * #TASK-ES-467(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 18568~18573 · 18632~18860줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 18568~18573줄(#TASK-ES-467 생성기 표지) ---- */
  var TREND_METRICS = {
    duration: { key: 'duration', label: '몰입시간', unit: '분', color: '#3b82f6', getter: function(it){ return it.durationMinutes != null ? it.durationMinutes : Math.round((it.totalMs||0)/60000); } },
    count:    { key: 'count',    label: '실천횟수', unit: '회', color: '#10b981', getter: function(it){ return it.count || 0; } },
    rate:     { key: 'rate',     label: '달성률',   unit: '%',  color: '#8b5cf6', getter: function(it){ return it.rate != null ? it.rate : Math.min(100, Math.round(((it.totalMs||0)/(60*60000))*100)); } },
    streak:   { key: 'streak',   label: '스트릭',   unit: '일', color: '#f59e0b', getter: function(it){ return it.streak || 0; } }
  };

  /* ---- 이전 전 index.html 18632~18860줄(#TASK-ES-467 생성기 표지) ---- */

  function renderWeekChart(recs){
    var container = document.getElementById('chartContainer');
    if(!container) return;
    var periodKey = L.state.trendPeriod || 'week';
    var tData = (typeof OurgoalRecordsStats !== 'undefined')
      ? OurgoalRecordsStats.computeTrendData(recs, periodKey)
      : { items: [], totalMs: 0, totalCount: 0, title: '실천 추이' };

    // state.selectedTrendMetrics 복원 및 기본값
    if(!Array.isArray(L.state.selectedTrendMetrics) || !L.state.selectedTrendMetrics.length){
      try {
        var saved = localStorage.getItem('og_trend_metrics');
        if(saved){
          var parsed = JSON.parse(saved);
          if(Array.isArray(parsed) && parsed.length) L.state.selectedTrendMetrics = parsed;
        }
      } catch(e){}
    }
    if(!Array.isArray(L.state.selectedTrendMetrics) || !L.state.selectedTrendMetrics.length){
      L.state.selectedTrendMetrics = ['duration', 'count'];
    }
    // 유효한 키만 필터링
    var activeMetrics = L.state.selectedTrendMetrics.filter(function(k){ return !!TREND_METRICS[k]; });
    if(!activeMetrics.length) activeMetrics = ['duration'];
    L.state.selectedTrendMetrics = activeMetrics;

    var activeIdx = (typeof L.state.trendActiveIdx === 'number' && L.state.trendActiveIdx >= 0 && L.state.trendActiveIdx < tData.items.length)
      ? L.state.trendActiveIdx
      : (tData.items.length - 1);
    L.state.trendActiveIdx = activeIdx;

    var maxMs = Math.max.apply(null, tData.items.map(function(x){ return x.totalMs; }).concat([1]));

    var segHtml = '<div class="trend-seg-bar" id="trendSegBar">' +
      [['week','주간'],['month','월간'],['quarter','분기'],['half','반기'],['year','연간']].map(function(s){
        return '<button class="trend-seg-btn'+(periodKey===s[0]?' active':'')+'" data-trendseg="'+s[0]+'" type="button">'+s[1]+'</button>';
      }).join('') +
    '</div>';

    var metricsSelectorHtml = '<div class="trend-metrics-selector-row" style="display:flex;align-items:center;gap:6px;margin:8px 0 6px;flex-wrap:wrap;">' +
      '<span style="font-size:0.75rem;font-weight:700;color:var(--ink-soft);margin-right:2px;">측정지표:</span>' +
      Object.keys(TREND_METRICS).map(function(k){
        var m = TREND_METRICS[k];
        var isSel = activeMetrics.indexOf(k) !== -1;
        return '<button type="button" class="trend-metric-chip' + (isSel ? ' active' : '') + '" data-trendmetric="' + k + '" style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:14px;font-size:0.75rem;border:1px solid ' + (isSel ? m.color : 'var(--line)') + ';background:' + (isSel ? (m.color + '22') : 'var(--card2)') + ';color:' + (isSel ? m.color : 'var(--ink-faint)') + ';font-weight:' + (isSel ? '700' : '500') + ';cursor:pointer;min-height:30px;transition:all .15s ease;">' +
          '<span class="metric-color-dot" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:' + m.color + ';opacity:' + (isSel ? '1' : '0.4') + ';"></span>' +
          m.label +
        '</button>';
      }).join('') +
    '</div>';

    var legendHtml = '<div class="trend-legend-row" style="display:flex;align-items:center;gap:10px;margin-bottom:6px;font-size:0.72rem;color:var(--ink-faint);flex-wrap:wrap;">' +
      activeMetrics.map(function(k){
        var m = TREND_METRICS[k];
        return '<span class="trend-legend-item" style="display:inline-flex;align-items:center;gap:4px;">' +
          '<span style="display:inline-block;width:9px;height:3px;border-radius:2px;background:' + m.color + ';"></span>' +
          '<span style="font-weight:600;color:' + m.color + ';">' + m.label + ' (' + m.unit + ')</span>' +
        '</span>';
      }).join('') +
    '</div>';

    var multiSvgHtml = L.renderMultiMetricSvg(tData.items, activeMetrics, activeIdx, TREND_METRICS);

    var bars = tData.items.map(function(item, i){
      var h = Math.max(4, Math.round((item.totalMs / maxMs) * 60));
      var isAct = (i === activeIdx);
      return '<div class="chart-bar-wrap">' +
        '<div class="chart-bar'+(isAct?' active':'')+'" data-trendbar="'+i+'" style="height:'+h+'px;cursor:pointer;" title="'+item.label+': '+L.fmtDuration(item.totalMs)+' ('+item.count+'건)"></div>' +
        '<div class="chart-day-lbl">'+item.label+'</div>' +
      '</div>';
    }).join('');

    var activeItem = tData.items[activeIdx] || { label:'-', count:0, totalMs:0, records:[] };

    var summaryMetricsBadges = activeMetrics.map(function(k){
      var m = TREND_METRICS[k];
      var rawVal = m.getter(activeItem);
      var displayVal = (k === 'duration') ? L.fmtDuration(activeItem.totalMs) : (rawVal + m.unit);
      return '<span class="trend-summary-badge" style="display:inline-flex;align-items:center;gap:3px;font-size:0.75rem;padding:2px 7px;border-radius:6px;background:' + m.color + '18;color:' + m.color + ';font-weight:700;border:1px solid ' + m.color + '33;">' +
        '<span style="width:6px;height:6px;border-radius:50%;background:' + m.color + ';"></span>' +
        m.label + ' ' + displayVal +
      '</span>';
    }).join(' ');

    var summaryBoxHtml = '';
    if(activeItem.count > 0){
      summaryBoxHtml = '<div class="trend-detail-summary" id="trendDetailSummary" data-trendpop="1">' +
        '<div class="trend-summary-head" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">' +
          '<span class="trend-summary-title">📅 ' + L.escapeHtml(activeItem.label) + (activeItem.subLabel ? (' ('+L.escapeHtml(activeItem.subLabel)+')') : '') + ' 실천 요약</span>' +
        '</div>' +
        '<div class="trend-summary-badges-row" style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin:6px 0 4px;">' +
          summaryMetricsBadges +
        '</div>' +
        '<div class="faint" style="font-size:.78rem;margin-top:2px;">' +
          activeItem.records.slice(0, 2).map(function(r){ return '· ' + L.escapeHtml(r.text); }).join(' ') +
          (activeItem.records.length > 2 ? ' 외 ' + (activeItem.records.length - 2) + '건' : '') +
        '</div>' +
        '<div class="trend-summary-hint">터치하여 세부 기록 보기 🔍</div>' +
      '</div>';
    } else {
      summaryBoxHtml = '<div class="trend-detail-summary" style="cursor:default;">' +
        '<div class="trend-summary-head">' +
          '<span class="trend-summary-title">📅 ' + L.escapeHtml(activeItem.label) + (activeItem.subLabel ? (' ('+L.escapeHtml(activeItem.subLabel)+')') : '') + '</span>' +
          '<span class="faint" style="font-size:.78rem;">실천 기록 없음</span>' +
        '</div>' +
        '<div class="trend-summary-badges-row" style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin:6px 0 4px;">' +
          summaryMetricsBadges +
        '</div>' +
        '<div class="faint" style="font-size:.75rem;margin-top:4px;">이 기간에는 아직 기록된 활동이 없어요.</div>' +
      '</div>';
    }

    // [4단계 개편: 3대 핵심 요약 카드 및 엄지 스위처]
    var streakVal = (L.state && L.state.profile && L.state.profile.streak) || 3;
    var trendPulseCards = '<div class="rec-stats-summary-card" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px;">' +
      '<div class="rec-stats-summary-item" style="background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:8px 6px;text-align:center;">' +
        '<div style="font-size:0.7rem;color:var(--ink-faint);">총 몰입 시간</div>' +
        '<div style="font-size:0.875rem;font-weight:800;color:var(--brand);margin-top:2px;">' + L.fmtDuration(tData.totalMs) + '</div>' +
      '</div>' +
      '<div class="rec-stats-summary-item" style="background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:8px 6px;text-align:center;">' +
        '<div style="font-size:0.7rem;color:var(--ink-faint);">포커스 스트릭</div>' +
        '<div style="font-size:0.875rem;font-weight:800;color:#f59e0b;margin-top:2px;">' + streakVal + '일 연속 🔥</div>' +
      '</div>' +
      '<div class="rec-stats-summary-item" style="background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:8px 6px;text-align:center;">' +
        '<div style="font-size:0.7rem;color:var(--ink-faint);">총 실천 횟수</div>' +
        '<div style="font-size:0.875rem;font-weight:800;color:#38bdf8;margin-top:2px;">' + tData.totalCount + '회 완주</div>' +
      '</div>' +
    '</div>';

    var thumbSwitcherHtml = '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:10px;padding-top:8px;border-top:1px dashed var(--line, rgba(255,255,255,0.08));">' +
      '<button type="button" class="btn btn-ghost btn-sm" ' + (activeIdx <= 0 ? 'disabled' : '') + ' onclick="state.trendActiveIdx=' + (activeIdx - 1) + '; renderWeekChart(state.profile.records||[]);" style="font-size:0.75rem;padding:4px 10px;">' +
        '◀ 이전 ' + (periodKey === 'week' ? '일자' : '구간') +
      '</button>' +
      '<span style="font-size:0.75rem;font-weight:700;color:var(--ink-soft);">' + L.escapeHtml(activeItem.label) + '</span>' +
      '<button type="button" class="btn btn-ghost btn-sm" ' + (activeIdx >= tData.items.length - 1 ? 'disabled' : '') + ' onclick="state.trendActiveIdx=' + (activeIdx + 1) + '; renderWeekChart(state.profile.records||[]);" style="font-size:0.75rem;padding:4px 10px;">' +
        '다음 ' + (periodKey === 'week' ? '일자' : '구간') + ' ▶' +
      '</button>' +
    '</div>';

    container.innerHTML =
      '<div class="chart-card">' +
        trendPulseCards +
        segHtml +
        metricsSelectorHtml +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0 4px;">' +
          '<div class="ct-label" style="margin:0;">' + tData.title + '</div>' +
          '<span class="faint" style="font-size:.75rem;">총 ' + L.fmtDuration(tData.totalMs) + ' (' + tData.totalCount + '건)</span>' +
        '</div>' +
        legendHtml +
        multiSvgHtml +
        '<div class="chart-bars">' + bars + '</div>' +
        summaryBoxHtml +
        thumbSwitcherHtml +
      '</div>';

    container.querySelectorAll('[data-trendseg]').forEach(function(btn){
      btn.onclick = function(){
        L.state.trendPeriod = btn.dataset.trendseg;
        L.state.trendActiveIdx = null;
        renderWeekChart(recs);
      };
    });
    container.querySelectorAll('[data-trendmetric]').forEach(function(chip){
      chip.onclick = function(e){
        e.stopPropagation();
        var mKey = chip.dataset.trendmetric;
        var cur = (L.state.selectedTrendMetrics || []).slice();
        var idx = cur.indexOf(mKey);
        if(idx !== -1){
          if(cur.length > 1){
            cur.splice(idx, 1);
          } else if(typeof L.toast === 'function'){
            L.toast('최소 하나의 측정지표는 선택되어야 합니다.');
            return;
          }
        } else {
          cur.push(mKey);
        }
        L.state.selectedTrendMetrics = cur;
        try {
          localStorage.setItem('og_trend_metrics', JSON.stringify(cur));
        } catch(e){}
        if(navigator && typeof navigator.vibrate === 'function') try { navigator.vibrate(12); } catch(e){}
        renderWeekChart(recs);
      };
    });
    container.querySelectorAll('[data-trendbar]').forEach(function(bar){
      bar.onclick = function(){
        L.state.trendActiveIdx = parseInt(bar.dataset.trendbar, 10);
        renderWeekChart(recs);
      };
    });
    var popBtn = container.querySelector('[data-trendpop]');
    if(popBtn){
      popBtn.onclick = function(){
        if(typeof OurgoalRecordsStats !== 'undefined' && OurgoalRecordsStats.openDayDetailModal){
          OurgoalRecordsStats.openDayDetailModal(activeItem, {
            openModal: L.openModal,
            closeModal: L.closeModal,
            buildRecordCardHtml: L.buildRecordCardHtml,
            wireRecordCards: function(sheet){
              L.wireRecordCards(sheet, {
                onUpdate: function(){
                  L.renderRecordsScreen();
                  var recsContainer = sheet.querySelector('.trend-modal-recs');
                  if(recsContainer){
                    var updatedRecs = (L.state.profile.records || []).filter(function(r){
                      var rTime = new Date(r.startAt).getTime();
                      if(isNaN(rTime)) return false;
                      var rK = L.dateKey(r.startAt);
                      if(periodKey === 'week') return rK === activeItem.key;
                      return rTime >= activeItem.startTime && rTime <= activeItem.endTime;
                    });
                    if(!updatedRecs.length){
                      recsContainer.innerHTML = '<div class="empty-state" style="padding:24px 0;"><p>이 기간에 기록된 활동이 없습니다.</p></div>';
                    } else {
                      recsContainer.innerHTML = updatedRecs.map(function(r){ return L.buildRecordCardHtml(r); }).join('');
                      L.wireRecordCards(sheet, { onUpdate: function(){ L.renderRecordsScreen(); } });
                    }
                  }
                }
              });
            }
          });
        }
      };
    }
  }

  K.TREND_METRICS = TREND_METRICS;
  K.renderWeekChart = renderWeekChart;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
