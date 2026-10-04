/**
 * OurGoal Stats Cell: 다차원 분석 렌즈 — 교차 비율·레이더·요일 리듬 차트와 통계 진단 리포트 (#TASK-ES-392 · 통계 세포 쪼개기 1차)
 *
 * js/universal-stats.js(이전 전 6,092줄)에서 동작 그대로 옮겼다(이전 전 3810~4152줄).
 *   computeCrossRatioSeries · renderCrossRatioSvg · renderRadarSvg · computeCadenceData · renderCadenceSvg · generateStatisticalDiagnosticReport
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalUniversalStats.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(root) {
  'use strict';
  // S = js/universal-stats.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·값(askConfirm·getChosung·DOMAINS …)을 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 통계 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = root.OurgoalUniversalStatsKit = root.OurgoalUniversalStatsKit || {};
  var S = K.scope = K.scope || {};

  // 1. 상관 & 효율 매트릭스 계산 (Cross-Ratio Matrix)
  function computeCrossRatioSeries(seriesA, seriesB){
    if(!seriesA || !seriesB) return null;
    var dateMapA = {};
    (seriesA.points || []).forEach(function(p){ dateMapA[p.date] = p.val; });

    var ratioPoints = [];
    (seriesB.points || []).forEach(function(p){
      var valA = dateMapA[p.date];
      var valB = p.val;
      if(valA !== undefined && valB !== undefined && valB > 0){
        var rVal = Math.round((valA / valB) * 100) / 100;
        ratioPoints.push({
          date: p.date,
          val: rVal,
          valA: valA,
          valB: valB
        });
      }
    });

    var avg = ratioPoints.length ? Math.round((ratioPoints.reduce(function(a,b){ return a + b.val; }, 0) / ratioPoints.length) * 100) / 100 : 0;
    var max = ratioPoints.length ? Math.max.apply(null, ratioPoints.map(function(p){ return p.val; })) : 0;
    var min = ratioPoints.length ? Math.min.apply(null, ratioPoints.map(function(p){ return p.val; })) : 0;

    return {
      label: seriesA.entity + ' / ' + seriesB.entity + ' 효율비',
      entityA: seriesA.entity,
      entityB: seriesB.entity,
      unit: (seriesA.unit || '') + '/' + (seriesB.unit || ''),
      points: ratioPoints,
      avgRatio: avg,
      peakRatio: max,
      minRatio: min
    };
  }

  // 2. 다차원 상관비율 SVG 차트 렌더러
  function renderCrossRatioSvg(ratioData, opts){
    opts = opts || {};
    var w = opts.width || 520;
    var h = opts.height || 210;
    if(!ratioData || !ratioData.points || ratioData.points.length === 0){
      return '<div style="height:' + h + 'px;display:flex;align-items:center;justify-content:center;color:var(--ink-soft);font-size:.8125rem;">비교할 두 지표의 동일 일자 데이터가 필요합니다. 상단 엔티티를 2개 이상 선택해보세요.</div>';
    }

    var pts = ratioData.points;
    var maxVal = Math.max.apply(null, pts.map(function(p){ return p.val; }).concat([1]));
    var minVal = Math.min.apply(null, pts.map(function(p){ return p.val; }).concat([0]));
    var padL = 45, padR = 15, padT = 20, padB = 30;
    var chartW = w - padL - padR;
    var chartH = h - padT - padB;

    var coords = pts.map(function(p, idx){
      var x = padL + (pts.length === 1 ? chartW / 2 : (idx / (pts.length - 1)) * chartW);
      var y = padT + chartH - ((p.val - minVal) / (maxVal - minVal || 1)) * chartH;
      return { x: Math.round(x*10)/10, y: Math.round(y*10)/10, d: p.date, val: p.val };
    });

    var lineD = coords.map(function(c, i){ return (i === 0 ? 'M' : 'L') + c.x + ',' + c.y; }).join(' ');
    var areaD = lineD + ' L' + coords[coords.length-1].x + ',' + (padT + chartH) + ' L' + coords[0].x + ',' + (padT + chartH) + ' Z';

    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:auto;display:block;">';
    svg += '<defs><linearGradient id="uRatioGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/><stop offset="100%" stop-color="#38bdf8" stop-opacity="0.02"/></linearGradient></defs>';
    // Y축 가이드선
    svg += '<line x1="' + padL + '" y1="' + padT + '" x2="' + (w - padR) + '" y2="' + padT + '" stroke="var(--border)" stroke-dasharray="3,3"/>';
    svg += '<line x1="' + padL + '" y1="' + (padT + chartH) + '" x2="' + (w - padR) + '" y2="' + (padT + chartH) + '" stroke="var(--border)"/>';
    svg += '<text x="' + (padL - 6) + '" y="' + (padT + 4) + '" text-anchor="end" font-size="10" fill="var(--ink-soft)" font-family="monospace">' + maxVal + '</text>';
    svg += '<text x="' + (padL - 6) + '" y="' + (padT + chartH) + '" text-anchor="end" font-size="10" fill="var(--ink-soft)" font-family="monospace">' + minVal + '</text>';
    
    svg += '<path d="' + areaD + '" fill="url(#uRatioGrad)"/>';
    svg += '<path d="' + lineD + '" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round"/>';

    coords.forEach(function(c){
      svg += '<circle cx="' + c.x + '" cy="' + c.y + '" r="3.5" fill="#0284c7" stroke="#fff" stroke-width="1.5"/>';
    });
    svg += '</svg>';

    var kpiBar = 
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:6px 10px;background:var(--card);border-radius:8px;border:1px solid var(--border);font-size:.75rem;">' +
        '<span>⚡ <b>' + ratioData.label + '</b></span>' +
        '<span style="font-family:monospace;font-weight:700;color:var(--brand);">평균: ' + ratioData.avgRatio + ' ' + ratioData.unit + ' (최고: ' + ratioData.peakRatio + ')</span>' +
      '</div>';

    return svg + kpiBar;
  }

  // 3. 다차원 포트폴리오 레이더(Spider) SVG 차트 렌더러
  function renderRadarSvg(ontology, seriesMap, opts){
    opts = opts || {};
    var w = opts.width || 520;
    var h = opts.height || 230;
    var items = [];

    ontology.forEach(function(o){
      var s = seriesMap && seriesMap[o.name];
      var pr = s ? s.prVal : 1;
      var cur = s ? s.latestVal : 0;
      var score = pr > 0 ? Math.min(100, Math.max(15, Math.round((cur / pr) * 100))) : 50;
      items.push({ name: o.name, score: score, icon: o.icon || '📌' });
    });

    if(items.length < 3){
      // 3개 미만 시 정규화 가로 막대로 친절 표출
      var barHtml = '<div style="padding:14px;font-size:.8125rem;">';
      barHtml += '<div style="font-weight:700;margin-bottom:8px;color:var(--ink);">🎯 엔티티별 최고치 대비 달성률 비교</div>';
      items.forEach(function(it){
        barHtml += 
          '<div style="margin-bottom:8px;">' +
            '<div style="display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:2px;">' +
              '<span>' + it.icon + ' ' + it.name + '</span>' +
              '<span style="font-weight:700;font-family:monospace;">' + it.score + '%</span>' +
            '</div>' +
            '<div style="width:100%;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">' +
              '<div style="width:' + it.score + '%;height:100%;background:var(--brand);border-radius:3px;"></div>' +
            '</div>' +
          '</div>';
      });
      barHtml += '<div style="font-size:.7rem;color:var(--ink-soft);margin-top:6px;">💡 엔티티가 3개 이상 등록되면 다각형 레이더 밸런스 차트가 자동 활성화됩니다.</div></div>';
      return barHtml;
    }

    var cx = w / 2;
    var cy = h / 2;
    var radius = Math.min(cx, cy) - 40;
    var n = Math.min(items.length, 8);
    var targetItems = items.slice(0, n);
    var angleStep = (Math.PI * 2) / n;

    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:auto;display:block;">';

    // 동심원 가이드 격자 (25%, 50%, 75%, 100%)
    [0.25, 0.5, 0.75, 1.0].forEach(function(lvl){
      var rL = radius * lvl;
      var gPts = [];
      for(var i = 0; i < n; i++){
        var a = i * angleStep - Math.PI / 2;
        gPts.push((cx + rL * Math.cos(a)) + ',' + (cy + rL * Math.sin(a)));
      }
      svg += '<polygon points="' + gPts.join(' ') + '" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="' + (lvl < 1.0 ? '2,2' : 'none') + '"/>';
    });

    // 방사형 축 선 및 라벨
    var polyPoints = [];
    targetItems.forEach(function(it, i){
      var a = i * angleStep - Math.PI / 2;
      var ax = cx + radius * Math.cos(a);
      var ay = cy + radius * Math.sin(a);
      svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + ax + '" y2="' + ay + '" stroke="var(--border)" stroke-width="1"/>';

      var rVal = (it.score / 100) * radius;
      var px = cx + rVal * Math.cos(a);
      var py = cy + rVal * Math.sin(a);
      polyPoints.push(px + ',' + py);

      var lx = cx + (radius + 20) * Math.cos(a);
      var ly = cy + (radius + 20) * Math.sin(a);
      svg += '<text x="' + lx + '" y="' + (ly + 4) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--ink)">' + it.name + ' (' + it.score + '%)</text>';
    });

    svg += '<defs><linearGradient id="uRadarGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3b82f6" stop-opacity="0.38"/><stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.16"/></linearGradient></defs>';
    svg += '<polygon points="' + polyPoints.join(' ') + '" fill="url(#uRadarGrad)" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round"/>';
    targetItems.forEach(function(it, i){
      var pt = polyPoints[i].split(',');
      svg += '<circle cx="' + pt[0] + '" cy="' + pt[1] + '" r="4.5" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>';
    });

    svg += '</svg>';

    var topEntity = targetItems.slice().sort(function(a,b){ return b.score - a.score; })[0];
    var avgScore = Math.round(targetItems.reduce(function(acc,it){ return acc + it.score; }, 0) / targetItems.length);
    var footerHtml = 
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:6px 10px;background:var(--card);border-radius:8px;border:1px solid var(--border);font-size:.75rem;">' +
        '<span>🎯 <b>포트폴리오 균형도</b>: 평균 <b>' + avgScore + '%</b> 달성</span>' +
        '<span style="color:var(--brand);font-weight:800;">최고 지표: ' + (topEntity ? (topEntity.icon + ' ' + topEntity.name) : '-') + '</span>' +
      '</div>';

    return svg + footerHtml;
  }

  // 4. 요일별(Cadence) 실천 밀도 계산 및 SVG 렌더러
  function computeCadenceData(records){
    var days = ['일', '월', '화', '수', '목', '금', '토'];
    var counts = [0, 0, 0, 0, 0, 0, 0];
    (records || []).forEach(function(r){
      var d = new Date(r.startAt || r.createdAt);
      if(!isNaN(d.getTime())) counts[d.getDay()]++;
    });
    var total = counts.reduce(function(a, b){ return a + b; }, 0) || 1;
    return days.map(function(dayName, idx){
      return { day: dayName, count: counts[idx], pct: Math.round((counts[idx] / total) * 100) };
    });
  }

  function renderCadenceSvg(cadenceData, opts){
    opts = opts || {};
    var w = opts.width || 520;
    var h = opts.height || 180;
    var padL = 30, padR = 20, padT = 20, padB = 30;
    var chartW = w - padL - padR;
    var chartH = h - padT - padB;
    var maxCnt = Math.max.apply(null, cadenceData.map(function(d){ return d.count; }).concat([1]));

    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:auto;display:block;">';
    var colW = chartW / 7;

    cadenceData.forEach(function(c, i){
      var barH = (c.count / maxCnt) * chartH;
      var x = padL + i * colW + colW * 0.15;
      var y = padT + chartH - barH;
      var bw = colW * 0.7;
      var isTop = (c.count === maxCnt && c.count > 0);
      var barColor = isTop ? 'var(--primary)' : 'var(--card2)';
      var strokeColor = isTop ? 'none' : 'var(--border)';

      svg += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + Math.max(4, barH) + '" rx="4" fill="' + barColor + '" stroke="' + strokeColor + '"/>';
      if(c.count > 0){
        svg += '<text x="' + (x + bw/2) + '" y="' + (y - 4) + '" text-anchor="middle" font-size="10" font-weight="700" fill="var(--ink)" font-family="monospace">' + c.count + '</text>';
      }
      svg += '<text x="' + (x + bw/2) + '" y="' + (padT + chartH + 16) + '" text-anchor="middle" font-size="11" font-weight="700" fill="' + (isTop ? 'var(--primary)' : 'var(--ink-soft)') + '">' + c.day + '</text>';
    });

    svg += '<defs><linearGradient id="uCadencePeakGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#38bdf8"/></linearGradient></defs>';
    svg += '</svg>';

    // 주중 vs 주말 통계 산출
    var weekdayCnt = cadenceData.slice(1, 6).reduce(function(acc, c){ return acc + c.count; }, 0);
    var weekendCnt = (cadenceData[0].count || 0) + (cadenceData[6].count || 0);
    var totCnt = weekdayCnt + weekendCnt || 1;
    var weekdayPct = Math.round((weekdayCnt / totCnt) * 100);
    var weekendPct = Math.round((weekendCnt / totCnt) * 100);

    var cadenceFooter = 
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:6px 10px;background:var(--card);border-radius:8px;border:1px solid var(--border);font-size:.75rem;">' +
        '<span>🗓️ <b>루틴 주기 분석</b></span>' +
        '<span style="font-family:monospace;font-weight:700;color:var(--ink-soft);">주중 <b style="color:var(--primary);">' + weekdayPct + '%</b> · 주말 <b style="color:#8b5cf6;">' + weekendPct + '%</b></span>' +
      '</div>';

    return svg + cadenceFooter;
  }

  // 5. 지능형 수학적 통계 리포트 생성기 (텍스트 + 시각 게이지 융합)
  function generateStatisticalDiagnosticReport(seriesMap, cadenceData, ratioData, opts){
    opts = opts || {};
    var seriesKeys = Object.keys(seriesMap || {});
    if(seriesKeys.length === 0){
      return '수집된 데이터가 아직 충분하지 않습니다. 기록을 추가하면 자율 통계 진단이 시작됩니다.';
    }

    var diagnostics = [];
    var gauges = [];
    var s1 = seriesMap[seriesKeys[0]];
    if(s1 && s1.points && s1.points.length > 0){
      var vals = s1.points.map(function(p){ return p.val; });
      var mean = vals.reduce(function(a, b){ return a + b; }, 0) / vals.length;
      var variance = vals.reduce(function(acc, v){ return acc + Math.pow(v - mean, 2); }, 0) / vals.length;
      var stdDev = Math.sqrt(variance);
      var cv = mean > 0 ? Math.round((stdDev / mean) * 100) : 0;

      var cvColor = cv < 15 ? '#10b981' : (cv <= 30 ? '#3b82f6' : '#f59e0b');
      var cvStatus = cv < 15 ? '극도로 일관됨' : (cv <= 30 ? '균형적 루틴' : '스프린트형 집중');
      gauges.push({
        label: '변동계수(CV)',
        val: cv + '%',
        status: cvStatus,
        color: cvColor,
        pct: Math.min(100, Math.max(10, cv * 2))
      });

      var cvText = '';
      if(cv < 15) cvText = '변동계수(CV) ' + cv + '%로 매우 일관되고 모범적인 루틴을 유지하고 있습니다.';
      else if(cv <= 30) cvText = '변동계수(CV) ' + cv + '%로 성장과 휴식이 균형을 이루는 건강한 흐름입니다.';
      else cvText = '변동계수(CV) ' + cv + '%로 집중 구간과 완충 구간의 차이가 큽니다.';

      diagnostics.push('📊 <b>[' + s1.entity + ']</b>: 총 ' + s1.points.length + '회 관측치 기반 평균 ' + (Math.round(mean*10)/10) + ' ' + (s1.unit || '') + '. ' + cvText);

      if(s1.growthRate !== 0){
        var mColor = s1.growthRate >= 0 ? '#10b981' : '#ef4444';
        gauges.push({
          label: '성장 모멘텀',
          val: (s1.growthRate > 0 ? '+' : '') + s1.growthRate + '%',
          status: '주당 ' + (s1.velocityPerWeek > 0 ? '+' : '') + s1.velocityPerWeek + (s1.unit ? (' ' + s1.unit) : ''),
          color: mColor,
          pct: Math.min(100, Math.max(15, Math.abs(s1.growthRate)))
        });
        diagnostics.push('🚀 <b>성장 모멘텀</b>: 시작 지점 대비 <b>' + (s1.growthRate > 0 ? '+' : '') + s1.growthRate + '%</b> 성장 (주당 약 ' + (s1.velocityPerWeek > 0 ? '+' : '') + s1.velocityPerWeek + ' ' + (s1.unit || '') + ' 페이스).');
      }

      if(s1.prVal > 0){
        var prRatio = Math.round((s1.latestVal / s1.prVal) * 100);
        gauges.push({
          label: '피크 유지율',
          val: prRatio + '%',
          status: '최고 ' + s1.prVal.toLocaleString() + (s1.unit ? (' ' + s1.unit) : ''),
          color: '#8b5cf6',
          pct: Math.min(100, prRatio)
        });
        diagnostics.push('🏆 <b>피크 벤치마크</b>: 역대 최고치 ' + s1.prVal.toLocaleString() + ' ' + (s1.unit || '') + ' 대비 현재 <b>' + prRatio + '%</b> 수준 유지.');
      }
    }

    if(ratioData && ratioData.points && ratioData.points.length > 0){
      diagnostics.push('⚡ <b>효율 매트릭스</b>: ' + ratioData.label + ' 평균 <b>' + ratioData.avgRatio + ' ' + ratioData.unit + '</b> 달성.');
    }

    if(Array.isArray(cadenceData) && cadenceData.length > 0){
      var sortedCadence = cadenceData.slice().sort(function(a, b){ return b.count - a.count; });
      if(sortedCadence[0].count > 0){
        diagnostics.push('🗓️ <b>주기성 분석</b>: <b>' + sortedCadence[0].day + '요일</b>(전체의 ' + sortedCadence[0].pct + '%)에 활동이 가장 집중됩니다.');
      }
    }

    if(opts.asHtml){
      var cardsHtml = '';
      if(gauges.length > 0){
        cardsHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(115px, 1fr));gap:6px;margin-bottom:10px;">';
        gauges.forEach(function(g){
          cardsHtml += 
            '<div style="padding:6px 8px;border-radius:8px;background:var(--card);border:1px solid var(--border);display:flex;flex-direction:column;gap:3px;">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;font-size:.65rem;color:var(--ink-soft);font-family:monospace;">' +
                '<span>' + g.label + '</span>' +
                '<span style="color:' + g.color + ';font-weight:800;">' + g.val + '</span>' +
              '</div>' +
              '<div style="width:100%;height:4px;background:var(--border);border-radius:2px;overflow:hidden;">' +
                '<div style="width:' + g.pct + '%;height:100%;background:' + g.color + ';border-radius:2px;"></div>' +
              '</div>' +
              '<div style="font-size:.625rem;color:var(--ink-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + g.status + '</div>' +
            '</div>';
        });
        cardsHtml += '</div>';
      }

      var textListHtml = '<div style="display:flex;flex-direction:column;gap:5px;font-size:.75rem;line-height:1.5;">';
      diagnostics.forEach(function(d){
        textListHtml += '<div style="display:flex;align-items:flex-start;gap:6px;"><span style="line-height:1.4;">' + d + '</span></div>';
      });
      textListHtml += '</div>';

      return cardsHtml + textListHtml;
    }

    return diagnostics.join('<br style="margin-bottom:4px;">');
  }

  K.computeCrossRatioSeries = computeCrossRatioSeries;
  K.renderCrossRatioSvg = renderCrossRatioSvg;
  K.renderRadarSvg = renderRadarSvg;
  K.computeCadenceData = computeCadenceData;
  K.renderCadenceSvg = renderCadenceSvg;
  K.generateStatisticalDiagnosticReport = generateStatisticalDiagnosticReport;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
