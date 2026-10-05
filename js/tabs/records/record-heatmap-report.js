/**
 * OurGoal Record Heatmap & Report (기록 탭 — 히트맵·주간/월간 리포트 그림)
 *
 * #TASK-ES-446 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G132·G133.
 *   옮긴 선언(이전 전 줄): renderRecordHeatmap(24615~24761) · TOPIC_COLORS(24762~24764) · svgTrendChart(24765~24781) · svgCategoryDonut(24782~24797) · renderReportSummary(24798~24858)
 * renderRecordHeatmap = 기록 히트맵(칸 색 단계 heatmapLevel 은 시험지가 글자로 읽어 index.html 에 남음),
 * svgTrendChart·svgCategoryDonut·renderReportSummary = 주간/월간 리포트 SVG 추이·카테고리 도넛(filterRecordsByQuery 는 index.html 에 남음).
 * 최상위 선언을 앞 주석·구획 주석과 함께 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 같은 키트의 다른 세포 이름은 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 로드 중 바로 도는 문(window.X 노출·전역 이벤트 위임)과 시험지가 index.html 에서 글자로 읽는 함수는 index.html 제자리에 남겼다.
 * index.html 은 IIFE 맨 위에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져와 쓴다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 인라인 세포화 1차 #TASK-ES-423 · 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  function renderRecordHeatmap(recs){
    var totalDays = L.HEATMAP_WEEKS*7;
    var today = new Date(); today.setHours(0,0,0,0);
    var start = new Date(today); start.setDate(start.getDate() - (totalDays - 1 - today.getDay()));
    var counts = {};
    var recsByDate = {};
    (recs || []).forEach(function(r){
      var k = L.dateKey(r.startAt);
      counts[k] = (counts[k]||0) + 1;
      if(!recsByDate[k]) recsByDate[k] = [];
      recsByDate[k].push(r);
    });
    var maxCount = Math.max.apply(null, [1].concat(Object.keys(counts).map(function(k){ return counts[k]; })));

    var totalPeriodRecords = 0;
    var activeDays = 0;
    var startDateStr = start.getFullYear() + '.' + L.pad(start.getMonth()+1) + '.' + L.pad(start.getDate());
    var todayDateStr = today.getFullYear() + '.' + L.pad(today.getMonth()+1) + '.' + L.pad(today.getDate());

    var monthLabels = [];
    var prevMonth = -1;
    for(var w=0; w<L.HEATMAP_WEEKS; w++){
      var dWeek = new Date(start);
      dWeek.setDate(dWeek.getDate() + w*7);
      var m = dWeek.getMonth();
      if(m !== prevMonth){
        prevMonth = m;
        var leftPx = w * 17;
        monthLabels.push('<span class="heatmap-month-lbl" style="left:' + leftPx + 'px;">' + (m+1) + '월</span>');
      }
    }

    var cells = '';
    for(var i=0;i<totalDays;i++){
      var d = new Date(start); d.setDate(d.getDate()+i);
      var k = d.getFullYear()+'-'+L.pad(d.getMonth()+1)+'-'+L.pad(d.getDate());
      var future = d.getTime() > today.getTime();
      var c = counts[k]||0;
      if(!future && c > 0){
        totalPeriodRecords += c;
        activeDays++;
      }
      var bg = future ? 'transparent' : L.HEATMAP_LEVELS[L.heatmapLevel(c, maxCount)];
      var dayOfWeek = ['일','월','화','수','목','금','토'][d.getDay()];
      var title = future ? '' : ' title="'+k+' ('+dayOfWeek+') · '+c+'건"';
      var isToday = (!future && d.getTime() === today.getTime());
      cells += '<div class="heatmap-cell' + (isToday ? ' active' : '') + '" style="background:'+bg+';"'+title+' data-date="'+k+'" data-count="'+c+'" data-future="'+(future?'1':'0')+'"></div>';
    }

    var dayLbls = ['일','월','화','수','목','금','토'].map(function(w,i){ return '<span>'+(i%2===1?w:'')+'</span>'; }).join('');

    var el = document.getElementById('recordHeatmap');
    if(!el) return;

    el.innerHTML =
      '<div class="chart-card" style="position:relative;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px;">' +
          '<div class="ct-label" style="margin:0;font-size:.9rem;font-weight:700;display:flex;align-items:center;gap:6px;">' +
            '<span>기록 히트맵</span>' +
            '<span class="dday-mini" style="background:var(--surface-2);color:var(--ink);font-weight:700;">최근 ' + L.HEATMAP_WEEKS + '주</span>' +
          '</div>' +
          '<span class="faint" style="font-size:.8125rem;font-weight:600;color:var(--ink-soft);">' + startDateStr + ' ~ ' + todayDateStr + '</span>' +
        '</div>' +

        '<div class="heatmap-stat-bar">' +
          '<div class="heatmap-stat-item"><span class="faint">총 기록</span><b style="color:var(--ink);">' + totalPeriodRecords + '건</b></div>' +
          '<div class="heatmap-stat-item"><span class="faint">실천 일수</span><b style="color:var(--ink);">' + activeDays + '일</b></div>' +
          '<div class="heatmap-stat-item"><span class="faint">1일 최다</span><b style="color:var(--sage);">' + (maxCount > 0 && totalPeriodRecords > 0 ? maxCount : 0) + '건</b></div>' +
          '<div class="heatmap-stat-item"><span class="faint">실천율</span><b style="color:var(--ink-soft);">' + Math.round((activeDays/Math.min(totalDays, 126))*100) + '%</b></div>' +
        '</div>' +

        '<div class="heatmap-scroll">' +
          '<div class="heatmap-body">' +
            '<div class="heatmap-month-row">' + monthLabels.join('') + '</div>' +
            '<div class="heatmap-grid-wrap">' +
              '<div class="heatmap-daylbls">' + dayLbls + '</div>' +
              '<div class="heatmap-grid">' + cells + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="heatmap-legend">' +
          '<span style="font-size:.6875rem;font-weight:600;margin-right:2px;">기록 건수:</span>' +
          '<div style="display:flex;align-items:center;gap:3px;"><div class="heatmap-cell" style="background:'+L.HEATMAP_LEVELS[0]+';"></div><span>0건</span></div>' +
          '<div style="display:flex;align-items:center;gap:3px;"><div class="heatmap-cell" style="background:'+L.HEATMAP_LEVELS[1]+';"></div><span>1건</span></div>' +
          '<div style="display:flex;align-items:center;gap:3px;"><div class="heatmap-cell" style="background:'+L.HEATMAP_LEVELS[2]+';"></div><span>2건</span></div>' +
          '<div style="display:flex;align-items:center;gap:3px;"><div class="heatmap-cell" style="background:'+L.HEATMAP_LEVELS[3]+';"></div><span>3~4건</span></div>' +
          '<div style="display:flex;align-items:center;gap:3px;"><div class="heatmap-cell" style="background:'+L.HEATMAP_LEVELS[4]+';"></div><span>5건+</span></div>' +
        '</div>' +

        '<div class="heatmap-selected-box" id="heatmapSelectedInfo"></div>' +
      '</div>';

    function updateSelectedDateInfo(dateStr, count){
      var infoBox = el.querySelector('#heatmapSelectedInfo');
      if(!infoBox) return;
      var dObj = new Date(dateStr + 'T00:00:00');
      var dayName = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'][dObj.getDay()];
      var dayRecs = recsByDate[dateStr] || [];

      var recsHtml = '';
      if(dayRecs.length > 0){
        recsHtml = '<div style="display:flex;flex-direction:column;gap:6px;margin-top:8px;max-height:160px;overflow-y:auto;">' +
          dayRecs.map(function(r){
            var timeStr = L.fmtTime(r.startAt);
            var thObj = (typeof L.RECORD_THEMES !== 'undefined' && L.RECORD_THEMES[r.theme]) ? L.RECORD_THEMES[r.theme] : null;
            var thIcon = thObj ? thObj.icon : '📝';
            var txt = L.escapeHtml(r.text || '');
            return '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:var(--card);border-radius:8px;border:1px solid var(--rule);font-size:.8125rem;">' +
              '<span class="faint" style="font-size:.7rem;">' + timeStr + '</span>' +
              '<span>' + thIcon + '</span>' +
              '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;color:var(--ink);">' + txt + '</span>' +
            '</div>';
          }).join('') +
        '</div>';
      } else {
        recsHtml = '<div class="faint" style="font-size:.8125rem;margin-top:6px;line-height:1.4;">이 날짜에는 등록된 기록이 없습니다. 새로운 목표를 향해 도전해보세요!</div>';
      }

      infoBox.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">' +
          '<div style="font-weight:700;font-size:.875rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
            '<span>' + dateStr + ' (' + dayName + ')</span>' +
          '</div>' +
          '<span class="dday-mini" style="' + (count > 0 ? 'background:var(--surface-2);color:var(--ink);' : 'background:var(--card);color:var(--ink-faint);') + 'font-weight:700;">' + count + '건의 기록</span>' +
        '</div>' +
        recsHtml;
    }

    var todayKey = today.getFullYear()+'-'+L.pad(today.getMonth()+1)+'-'+L.pad(today.getDate());
    updateSelectedDateInfo(todayKey, counts[todayKey] || 0);

    el.querySelectorAll('.heatmap-cell[data-future="0"]').forEach(function(cell){
      cell.onclick = function(){
        el.querySelectorAll('.heatmap-cell').forEach(function(c){ c.classList.remove('active'); });
        cell.classList.add('active');
        var dStr = cell.dataset.date;
        var cVal = parseInt(cell.dataset.count || '0', 10);
        updateSelectedDateInfo(dStr, cVal);
      };
    });

    var scrollContainer = el.querySelector('.heatmap-scroll');
    if(scrollContainer){
      scrollContainer.scrollLeft = scrollContainer.scrollWidth;
    }
  }

  /* ============ 주간/월간 리포트 (SVG 추이 + 카테고리 분포) ============ */
  var TOPIC_COLORS = { health:'#FF4F64', study:'#FF9F1C', career:'#1FC98E', hobby:'#6C5CE7', mind:'#FF7EB9', relation:'#3DBFCF' };

  function svgTrendChart(totals){
    var w = 320, h = 84, padX = 6, padY = 8;
    var maxMs = Math.max.apply(null, totals.concat([1]));
    var n = totals.length;
    var stepX = n>1 ? (w - padX*2)/(n-1) : 0;
    var pts = totals.map(function(ms, i){
      var x = padX + i*stepX;
      var y = h - padY - (ms/maxMs)*(h - padY*2);
      return x.toFixed(1)+','+y.toFixed(1);
    });
    var lastX = (padX + (n-1)*stepX).toFixed(1);
    var areaPts = padX.toFixed(1)+','+(h-padY).toFixed(1)+' '+pts.join(' ')+' '+lastX+','+(h-padY).toFixed(1);
    return '<svg viewBox="0 0 '+w+' '+h+'" width="100%" height="84" preserveAspectRatio="none" style="display:block;">' +
      '<polygon points="'+areaPts+'" style="fill:var(--violet-soft);"></polygon>' +
      '<polyline points="'+pts.join(' ')+'" style="fill:none;stroke:var(--violet);stroke-width:2;"></polyline>' +
    '</svg>';
  }

  function svgCategoryDonut(catTotals){
    var keys = Object.keys(catTotals).filter(function(k){ return catTotals[k] > 0; });
    if(!keys.length) return '';
    var total = keys.reduce(function(s,k){ return s+catTotals[k]; }, 0);
    var r = 40, cx = 50, cy = 50, circ = 2*Math.PI*r;
    var offset = 0;
    var segs = keys.map(function(k){
      var frac = catTotals[k]/total;
      var len = frac*circ;
      var seg = '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+(TOPIC_COLORS[k]||'#9A9EB8')+'" stroke-width="16" ' +
        'stroke-dasharray="'+len.toFixed(1)+' '+(circ-len).toFixed(1)+'" stroke-dashoffset="'+(-offset).toFixed(1)+'" transform="rotate(-90 '+cx+' '+cy+')"></circle>';
      offset += len;
      return seg;
    }).join('');
    return '<svg viewBox="0 0 100 100" width="104" height="104">'+segs+'</svg>';
  }

  function renderReportSummary(recs){
    var days = L.state.reportPeriod === 30 ? 30 : 7;
    var stats = (typeof OurgoalRecordsStats !== 'undefined')
      ? OurgoalRecordsStats.computeFixedReportSummary(recs, days, L.RECORD_THEMES)
      : { days: days, totals: [], totalPeriodMs: 0, totalRecCount: 0, themeTotals: {}, themeCounts: {} };

    var catTotals = {};
    var uncategorized = 0;
    var periodStart = Date.now() - days * 86400000;
    (recs || []).forEach(function(r){
      var rTime = new Date(r.startAt).getTime();
      if(isNaN(rTime) || rTime < periodStart) return;
      var dur = (r.endAt && new Date(r.endAt).getTime() >= rTime) ? (new Date(r.endAt).getTime() - rTime) : 15 * 60000;
      var key = r.category && L.TOPICS[r.category] ? r.category : null;
      if(key){ catTotals[key] = (catTotals[key]||0) + dur; }
      else { uncategorized += dur; }
    });

    var keys = Object.keys(catTotals).sort(function(a,b){ return catTotals[b]-catTotals[a]; });
    var legendRows = keys.map(function(k){
      return '<div class="report-legend-row"><span class="report-dot" style="background:'+(TOPIC_COLORS[k]||'var(--ink-faint)')+';"></span>'+
        '<span class="report-legend-label">'+L.TOPICS[k].icon+' '+L.TOPICS[k].label+'</span>'+
        '<span class="report-legend-val">'+L.fmtDuration(catTotals[k])+'</span></div>';
    }).join('');
    if(uncategorized>0){
      legendRows += '<div class="report-legend-row"><span class="report-dot" style="background:var(--ink-faint);"></span>'+
        '<span class="report-legend-label">기타/미분류</span>'+
        '<span class="report-legend-val">'+L.fmtDuration(uncategorized)+'</span></div>';
    }
    var donutMap = {};
    keys.forEach(function(k){ donutMap[k] = catTotals[k]; });
    if(uncategorized>0) donutMap._etc = uncategorized;

    document.getElementById('reportSummary').innerHTML =
      '<div class="chart-card">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px;">' +
          '<div class="ct-label" style="margin:0;">기간별 AI 리포트</div>' +
          '<div class="format-toggle" style="max-width:140px;" id="reportPeriodToggle">' +
            '<div class="format-opt'+(days===7?' active':'')+'" data-period="7">7일</div>' +
            '<div class="format-opt'+(days===30?' active':'')+'" data-period="30">30일</div>' +
          '</div>' +
        '</div>' +
        '<div class="faint" style="font-size:.8125rem;margin-bottom:6px;">최근 '+days+'일 총 '+L.fmtDuration(stats.totalPeriodMs)+' 기록 ('+stats.totalRecCount+'건)</div>' +
        svgTrendChart(stats.totals) +
        (keys.length || uncategorized>0 ?
          '<div style="display:flex;gap:16px;align-items:center;margin-top:14px;flex-wrap:wrap;">' +
            '<div style="flex:0 0 auto;">'+svgCategoryDonut(donutMap)+'</div>' +
            '<div style="flex:1;min-width:140px;">'+legendRows+'</div>' +
          '</div>'
        : '<div class="faint" style="font-size:.8125rem;margin-top:10px;">분야를 지정한 기록이 쌓이면 분포가 여기 표시돼요.</div>')
      + '</div>';

    document.getElementById('reportPeriodToggle').querySelectorAll('[data-period]').forEach(function(btn){
      btn.addEventListener('click', function(){
        if(L.isModalDismissCooldown()) return;
        var period = Number(btn.dataset.period);
        L.state.reportPeriod = period;
        L.renderRecordsScreen();
      });
    });
  }

  K.renderRecordHeatmap = renderRecordHeatmap;
  K.TOPIC_COLORS = TOPIC_COLORS;
  K.svgTrendChart = svgTrendChart;
  K.svgCategoryDonut = svgCategoryDonut;
  K.renderReportSummary = renderReportSummary;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
