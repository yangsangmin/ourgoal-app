/**
 * records-stats.js - 아워골 기록 탭 통계·피드 헬퍼 모듈
 * 
 * 기능:
 * 1. 최근 7일 피드 (오늘 전면 노출 + 어제/과거 아코디언 및 마지막 기록 프리뷰)
 * 2. 실천 추이 5종 (주간/월간/분기/반기/연간) 인터랙션 및 일자/기간별 요약
 * 3. 원형 라이프 밸런스 휠 (SVG Pie/Donut Chart)
 * 4. 기간별 활동 세부 모달 팝업
 * 5. 누락 없는 AI 리포트 집계
 */
(function(root){
  'use strict';

  function pad(n){ return n < 10 ? '0' + n : '' + n; }

  function dateKey(isoOrDate){
    if(!isoOrDate) return '';
    var d = (typeof isoOrDate === 'string') ? new Date(isoOrDate) : isoOrDate;
    if(isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function fmtDuration(ms){
    if(!ms || ms <= 0) return '0분';
    var mins = Math.round(ms / 60000);
    if(mins < 60) return mins + '분';
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return m > 0 ? (h + '시간 ' + m + '분') : (h + '시간');
  }

  function escapeHtml(str){
    if(!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ================= 1. 최근 7일 피드 렌더러 ================= */
  function build7DaysFeedHtml(recentRecs, deps){
    if(!recentRecs || !recentRecs.length){
      return '<div class="faint" style="font-size:.8125rem;padding:12px 0;">최근 7일간의 기록이 아직 없어요.</div>';
    }

    var fmtDateLabel = deps.fmtDateLabel || function(d){ return dateKey(d); };
    var buildCardFn = deps.buildRecordCardHtml;
    var todayKey = dateKey(new Date());

    // 날짜별 그룹화 (최신순 유지)
    var groups = {};
    var dateOrder = [];
    recentRecs.forEach(function(r){
      var k = dateKey(r.startAt);
      if(!groups[k]){
        groups[k] = [];
        dateOrder.push(k);
      }
      groups[k].push(r);
    });

    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin:14px 0 8px;">' +
      '<span style="font-size:.8125rem;font-weight:700;color:var(--ink);">최근 실천 기록 (최근 7일)</span>' +
      '<span class="faint" style="font-size:.75rem;">총 ' + recentRecs.length + '건</span>' +
    '</div>';

    dateOrder.forEach(function(k){
      var recs = groups[k];
      var isToday = (k === todayKey);
      var labelText = fmtDateLabel(recs[0].startAt);

      if(isToday){
        // 오늘 기록: 전면 노출
        html += '<div class="rec-date-label">' + labelText + ' <span style="color:var(--brand-strong);font-weight:700;">(오늘)</span></div>';
        recs.forEach(function(r){
          html += buildCardFn(r);
        });
      } else {
        // 어제 및 이전 6일: 아코디언 및 마지막 기록 1건 프리뷰 노출
        var lastRec = recs[0]; // 최신 기록
        var remainingRecs = recs.slice(1);
        var remCount = remainingRecs.length;

        html += '<div class="rec-date-label">' + labelText + '</div>';
        if(remCount === 0){
          // 1건뿐이면 바로 노출
          html += buildCardFn(lastRec);
        } else {
          // 2건 이상이면 마지막 기록 프리뷰 + 토글 버튼 + 접힌 목록
          var hiddenCards = '';
          remainingRecs.forEach(function(r){
            hiddenCards += buildCardFn(r);
          });

          html += '<div class="rec-day-accordion" data-dayacc="' + k + '">' +
            '<div class="rec-day-preview">' + buildCardFn(lastRec) + '</div>' +
            '<button type="button" class="rec-day-toggle-btn" data-toggleday="' + k + '">' +
              '<span class="rec-day-toggle-text">＋ 외 ' + remCount + '건 더보기 (터치하여 펼치기 ▼)</span>' +
            '</button>' +
            '<div class="rec-day-collapsible" id="dayCollapse_' + k + '" style="display:none;">' +
              hiddenCards +
            '</div>' +
          '</div>';
        }
      }
    });

    return html;
  }

  /* ================= 2. 원형 라이프 밸런스 휠 (SVG Pie Chart) ================= */
  function renderLifeBalancePieSvg(allRecs, recordThemes){
    var counts = { mind:0, study:0, business:0, schedule:0, workout:0, daily:0 };
    var total = 0;
    (allRecs || []).forEach(function(r){
      var t = r.theme || 'daily';
      if(counts[t] !== undefined) counts[t]++;
      else counts.daily++;
      total++;
    });

    var keys = ['workout','study','business','mind','schedule','daily'];
    var thData = keys.map(function(k){
      var count = counts[k] || 0;
      var pct = total > 0 ? Math.round((count / total) * 100) : 0;
      var th = (recordThemes && recordThemes[k]) ? recordThemes[k] : { label:k, icon:'', color:'#64748b' };
      return { key: k, label: th.label, icon: th.icon, color: th.color, count: count, pct: pct };
    });

    // 최다 점유 테마
    var topTheme = thData.slice().sort(function(a,b){ return b.count - a.count; })[0];

    // SVG 파이 조각 (Donut: R=75, r=45, cx=90, cy=90)
    var cx = 90, cy = 90, R = 75, r = 45;
    var currentAngle = -Math.PI / 2; // 12시 방향부터 시작
    var slicesHtml = '';

    if(total === 0){
      slicesHtml = '<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="none" stroke="var(--rule)" stroke-width="'+(R-r)+'" />';
    } else {
      var activeThemes = thData.filter(function(t){ return t.count > 0; });
      if(activeThemes.length === 1){
        // 100% 단일 테마
        slicesHtml = '<circle cx="'+cx+'" cy="'+cy+'" r="'+((R+r)/2)+'" fill="none" stroke="'+activeThemes[0].color+'" stroke-width="'+(R-r)+'" />';
      } else {
        activeThemes.forEach(function(item){
          var sliceAngle = (item.count / total) * 2 * Math.PI;
          var endAngle = currentAngle + sliceAngle;

          var x1 = cx + R * Math.cos(currentAngle);
          var y1 = cy + R * Math.sin(currentAngle);
          var x2 = cx + R * Math.cos(endAngle);
          var y2 = cy + R * Math.sin(endAngle);

          var ix1 = cx + r * Math.cos(endAngle);
          var iy1 = cy + r * Math.sin(endAngle);
          var ix2 = cx + r * Math.cos(currentAngle);
          var iy2 = cy + r * Math.sin(currentAngle);

          var largeArc = sliceAngle > Math.PI ? 1 : 0;
          var pathData = [
            'M', x1, y1,
            'A', R, R, 0, largeArc, 1, x2, y2,
            'L', ix1, iy1,
            'A', r, r, 0, largeArc, 0, ix2, iy2,
            'Z'
          ].join(' ');

          slicesHtml += '<path d="' + pathData + '" fill="' + item.color + '" stroke="var(--card)" stroke-width="1.5">' +
            '<title>' + item.label + ' ' + item.pct + '% (' + item.count + '건)</title>' +
          '</path>';

          currentAngle = endAngle;
        });
      }
    }

    var centerHtml = total > 0 ?
      ('<text x="'+cx+'" y="'+(cy-4)+'" text-anchor="middle" font-size="20" font-weight="800" fill="var(--ink)">'+(topTheme.icon||'🎯')+'</text>' +
       '<text x="'+cx+'" y="'+(cy+14)+'" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink-soft)">'+topTheme.pct+'%</text>') :
      ('<text x="'+cx+'" y="'+(cy+5)+'" text-anchor="middle" font-size="11" fill="var(--ink-faint)">기록 없음</text>');

    var svgHtml = '<svg viewBox="0 0 180 180" class="balance-pie-svg" style="width:160px;height:160px;display:block;margin:0 auto;">' +
      slicesHtml +
      centerHtml +
    '</svg>';

    return {
      svgHtml: svgHtml,
      thData: thData,
      total: total,
      topTheme: topTheme
    };
  }

  /* ================= 3. 실천 추이 5종 (주간/월간/분기/반기/연간) 집계기 ================= */
  function computeTrendData(allRecs, periodKey){
    var pKey = periodKey || 'week';
    var now = new Date();
    var items = [];
    var title = '실천 추이';
    var subtitle = '';

    if(pKey === 'week'){
      title = '최근 7일 주간 추이';
      subtitle = '일별 실천 시간 및 건수';
      var wkNames = ['일','월','화','수','목','금','토'];
      for(var i=6; i>=0; i--){
        var d = new Date(now);
        d.setHours(0,0,0,0);
        d.setDate(d.getDate() - i);
        var k = dateKey(d);
        items.push({
          key: k,
          dateObj: d,
          label: wkNames[d.getDay()],
          subLabel: (d.getMonth()+1) + '/' + d.getDate(),
          totalMs: 0,
          count: 0,
          records: []
        });
      }
    } else if(pKey === 'month'){
      title = '최근 4주 월간 추이';
      subtitle = '주차별 누적 실천량';
      for(var w=3; w>=0; w--){
        var endD = new Date(now);
        endD.setHours(23,59,59,999);
        endD.setDate(endD.getDate() - w * 7);
        var startD = new Date(endD);
        startD.setHours(0,0,0,0);
        startD.setDate(startD.getDate() - 6);

        var lbl = (w === 0) ? '이번 주' : (w + '주 전');
        var subLbl = (startD.getMonth()+1) + '.' + startD.getDate() + ' ~ ' + (endD.getMonth()+1) + '.' + endD.getDate();
        items.push({
          key: 'w_' + w,
          startTime: startD.getTime(),
          endTime: endD.getTime(),
          label: lbl,
          subLabel: subLbl,
          totalMs: 0,
          count: 0,
          records: []
        });
      }
    } else if(pKey === 'quarter'){
      title = '최근 3개월 분기 추이';
      subtitle = '월별 실천 성장세';
      for(var m=2; m>=0; m--){
        var curM = new Date(now.getFullYear(), now.getMonth() - m, 1);
        var nextM = new Date(now.getFullYear(), now.getMonth() - m + 1, 1);
        items.push({
          key: 'm_' + curM.getFullYear() + '_' + (curM.getMonth()+1),
          startTime: curM.getTime(),
          endTime: nextM.getTime() - 1,
          label: (curM.getMonth()+1) + '월',
          subLabel: curM.getFullYear() + '년',
          totalMs: 0,
          count: 0,
          records: []
        });
      }
    } else if(pKey === 'half'){
      title = '최근 6개월 반기 추이';
      subtitle = '월별 꾸준함 점검';
      for(var hm=5; hm>=0; hm--){
        var curHM = new Date(now.getFullYear(), now.getMonth() - hm, 1);
        var nextHM = new Date(now.getFullYear(), now.getMonth() - hm + 1, 1);
        items.push({
          key: 'hm_' + curHM.getFullYear() + '_' + (curHM.getMonth()+1),
          startTime: curHM.getTime(),
          endTime: nextHM.getTime() - 1,
          label: (curHM.getMonth()+1) + '월',
          subLabel: curHM.getFullYear() + '년',
          totalMs: 0,
          count: 0,
          records: []
        });
      }
    } else if(pKey === 'year'){
      title = '최근 12개월 연간 추이';
      subtitle = '1년간의 성취 발자취';
      for(var ym=11; ym>=0; ym--){
        var curYM = new Date(now.getFullYear(), now.getMonth() - ym, 1);
        var nextYM = new Date(now.getFullYear(), now.getMonth() - ym + 1, 1);
        items.push({
          key: 'ym_' + curYM.getFullYear() + '_' + (curYM.getMonth()+1),
          startTime: curYM.getTime(),
          endTime: nextYM.getTime() - 1,
          label: (curYM.getMonth()+1) + '월',
          subLabel: (curYM.getMonth() === 0 ? (curYM.getFullYear()+'') : ''),
          totalMs: 0,
          count: 0,
          records: []
        });
      }
    }

    // 기록 매핑 및 누적
    (allRecs || []).forEach(function(r){
      var rTime = new Date(r.startAt).getTime();
      if(isNaN(rTime)) return;
      var rK = dateKey(r.startAt);
      var dur = (r.endAt && new Date(r.endAt).getTime() >= rTime)
        ? (new Date(r.endAt).getTime() - rTime)
        : 15 * 60000; // 메모/체크인 기본 15분 인정

      items.forEach(function(it){
        var matches = false;
        if(pKey === 'week'){
          matches = (it.key === rK);
        } else {
          matches = (rTime >= it.startTime && rTime <= it.endTime);
        }
        if(matches){
          it.totalMs += dur;
          it.count++;
          it.records.push(r);
        }
      });
    });

    var totalPeriodMs = items.reduce(function(acc, x){ return acc + x.totalMs; }, 0);
    var totalPeriodCount = items.reduce(function(acc, x){ return acc + x.count; }, 0);
    var avgMs = items.length ? Math.round(totalPeriodMs / items.length) : 0;

    return {
      periodKey: pKey,
      title: title,
      subtitle: subtitle,
      totalMs: totalPeriodMs,
      totalCount: totalPeriodCount,
      avgMs: avgMs,
      items: items
    };
  }

  /* ================= 4. 활동 요약 및 상세 모달 ================= */
  function openDayDetailModal(item, deps){
    if(!deps || !deps.openModal) return;
    var recs = item.records || [];
    var buildCardFn = deps.buildRecordCardHtml || function(r){ return '<div>' + escapeHtml(r.text) + '</div>'; };

    var content = '<div class="trend-modal-content">' +
      '<div style="margin-bottom:12px;border-bottom:1px solid var(--rule);padding-bottom:10px;">' +
        '<h3 style="margin:0 0 4px;font-size:1.125rem;color:var(--ink);">' + escapeHtml(item.label) + ' 세부 실천 내역</h3>' +
        '<div class="faint" style="font-size:.8125rem;">' +
          (item.subLabel ? (escapeHtml(item.subLabel) + ' · ') : '') +
          '총 <b>' + item.count + '건</b> 실천 (' + fmtDuration(item.totalMs) + ')' +
        '</div>' +
      '</div>';

    if(!recs.length){
      content += '<div class="empty-state" style="padding:24px 0;"><p>이 기간에 기록된 활동이 없습니다.</p></div>';
    } else {
      content += '<div class="trend-modal-recs" style="max-height:60vh;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">';
      recs.forEach(function(r){
        content += buildCardFn(r);
      });
      content += '</div>';
    }

    content += '<div class="modal-actions" style="margin-top:14px;">' +
      '<button class="btn btn-primary" id="trendModalCloseBtn" type="button" style="width:100%;">확인</button>' +
    '</div></div>';

    deps.openModal(content, function(sheet){
      var btn = sheet.querySelector('#trendModalCloseBtn');
      if(btn && deps.closeModal) btn.onclick = deps.closeModal;
    });
  }

  /* ================= 5. 누락 없는 AI 리포트 집계기 ================= */
  function computeFixedReportSummary(recs, days, recordThemes){
    var dayList = [];
    var now = new Date();
    for(var i=days-1; i>=0; i--){
      var d = new Date(now);
      d.setHours(0,0,0,0);
      d.setDate(d.getDate() - i);
      dayList.push(d);
    }

    var totals = dayList.map(function(d){
      var dayKey = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
      var sum = 0;
      (recs || []).forEach(function(r){
        if(dateKey(r.startAt) === dayKey){
          var dur = (r.endAt && new Date(r.endAt).getTime() >= new Date(r.startAt).getTime())
            ? (new Date(r.endAt).getTime() - new Date(r.startAt).getTime())
            : 15 * 60000;
          sum += dur;
        }
      });
      return sum;
    });

    var periodStart = dayList[0].getTime();
    var themeTotals = {};
    var themeCounts = {};
    var totalPeriodMs = 0;
    var totalRecCount = 0;

    (recs || []).forEach(function(r){
      var rTime = new Date(r.startAt).getTime();
      if(isNaN(rTime) || rTime < periodStart) return;

      var dur = (r.endAt && new Date(r.endAt).getTime() >= rTime)
        ? (new Date(r.endAt).getTime() - rTime)
        : 15 * 60000;

      var thKey = r.theme || 'daily';
      themeTotals[thKey] = (themeTotals[thKey] || 0) + dur;
      themeCounts[thKey] = (themeCounts[thKey] || 0) + 1;
      totalPeriodMs += dur;
      totalRecCount++;
    });

    return {
      days: days,
      totals: totals,
      totalPeriodMs: totalPeriodMs,
      totalRecCount: totalRecCount,
      themeTotals: themeTotals,
      themeCounts: themeCounts
    };
  }

  var OurgoalRecordsStats = {
    fmtDuration: fmtDuration,
    dateKey: dateKey,
    build7DaysFeedHtml: build7DaysFeedHtml,
    renderLifeBalancePieSvg: renderLifeBalancePieSvg,
    computeTrendData: computeTrendData,
    openDayDetailModal: openDayDetailModal,
    computeFixedReportSummary: computeFixedReportSummary
  };

  if(typeof module !== 'undefined' && module.exports){
    module.exports = OurgoalRecordsStats;
  }
  root.OurgoalRecordsStats = OurgoalRecordsStats;

})(typeof window !== 'undefined' ? window : global);
