/**
 * OurGoal Stats Cell: SVG 차트 — 다형성 단일 지표 차트와 7-Tier 다중 시계열 집계·차트(renderUniversalSvgChart · aggregateMultiSeries · calcNiceStep · renderMultiSeriesSvg) (#TASK-ES-401 · 통계 세포 쪼개기 2차)
 *
 * js/universal-stats.js(이전 전 5,171줄)에서 동작 그대로 옮겼다(이전 전 969~1070, 2659~3100줄).
 *   renderUniversalSvgChart · aggregateMultiSeries · calcNiceStep · renderMultiSeriesSvg
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalUniversalStats.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(root) {
  'use strict';
  // S = js/universal-stats.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·값(pad·METRIC_CONFIGS·askConfirm …)을 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 통계 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = root.OurgoalUniversalStatsKit = root.OurgoalUniversalStatsKit || {};
  var S = K.scope = K.scope || {};

  /* ================= 4. 다형성 SVG 차트 렌더러 ================= */
  function renderUniversalSvgChart(data){
    if(!data || !data.buckets || !data.buckets.length){
      return '<div class="faint" style="padding:24px;text-align:center;">표시할 시계열 데이터가 없습니다.</div>';
    }

    var W = 360;
    var H = 160;
    var padL = 36;
    var padR = 20;
    var padT = 20;
    var padB = 32;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;

    var maxV = 0;
    data.buckets.forEach(function(b){ if(b.val > maxV) maxV = b.val; });
    if(maxV <= 0) maxV = 10;
    var topVal = Math.ceil(maxV * 1.15);
    var color = (data.config && data.config.color) || '#3b82f6';
    var chartType = (data.config && data.config.chartType) || 'area';

    // 그리드 라인 & Y축 눈금
    var gridHtml = '';
    var ySteps = 4;
    for(var s = 0; s <= ySteps; s++){
      var yRatio = s / ySteps;
      var yPos = padT + plotH * (1 - yRatio);
      var tickVal = Math.round(topVal * yRatio);
      gridHtml += '<line x1="' + padL + '" y1="' + yPos + '" x2="' + (W - padR) + '" y2="' + yPos + '" stroke="var(--border)" stroke-dasharray="3,3" stroke-width="0.75" opacity="0.6" />';
      gridHtml += '<text x="' + (padL - 6) + '" y="' + (yPos + 3) + '" text-anchor="end" font-size="9" fill="var(--ink-soft)">' + tickVal + '</text>';
    }

    var n = data.buckets.length;
    var stepX = n > 1 ? plotW / (n - 1) : plotW / 2;
    var coords = [];
    var xLabelsHtml = '';
    var barsHtml = '';

    data.buckets.forEach(function(b, idx){
      var x = padL + idx * stepX;
      var y = padT + plotH - (b.val / topVal) * plotH;
      coords.push({ x: x, y: y, b: b });

      if(n <= 7 || idx % 2 === 0 || idx === n - 1){
        xLabelsHtml += '<text x="' + x + '" y="' + (H - 10) + '" text-anchor="middle" font-size="10" fill="var(--ink-soft)">' + b.shortLabel + '</text>';
      }

      // 막대 차트인 경우
      if(chartType === 'bar'){
        var barW = Math.max(6, Math.min(22, (plotW / n) * 0.65));
        var barH = Math.max(2, (b.val / topVal) * plotH);
        var barX = x - barW / 2;
        var barY = padT + plotH - barH;
        barsHtml += '<rect x="' + barX + '" y="' + barY + '" width="' + barW + '" height="' + barH + '" rx="3" fill="' + color + '" opacity="0.85">' +
          '<title>' + b.label + ': ' + b.val + ' ' + (data.config.unit || '') + '</title></rect>';
      }
    });

    var linePath = '';
    var areaPath = '';
    if(coords.length > 0 && chartType !== 'bar'){
      linePath = 'M ' + coords[0].x + ' ' + coords[0].y;
      for(var c = 0; c < coords.length - 1; c++){
        var p0 = coords[c];
        var p1 = coords[c+1];
        var cpX1 = p0.x + (p1.x - p0.x) * 0.5;
        var cpX2 = p1.x - (p1.x - p0.x) * 0.5;
        linePath += ' C ' + cpX1 + ' ' + p0.y + ', ' + cpX2 + ' ' + p1.y + ', ' + p1.x + ' ' + p1.y;
      }

      if(chartType === 'area'){
        areaPath = linePath + ' L ' + coords[coords.length - 1].x + ' ' + (padT + plotH) + ' L ' + coords[0].x + ' ' + (padT + plotH) + ' Z';
      }
    }

    // 데이터 포인트
    var dotsHtml = '';
    coords.forEach(function(c){
      if(c.b.val > 0 || chartType === 'line'){
        dotsHtml += '<circle cx="' + c.x + '" cy="' + c.y + '" r="3.5" fill="var(--card)" stroke="' + color + '" stroke-width="2">' +
          '<title>' + c.b.label + ': ' + c.b.val + ' ' + (data.config.unit || '') + '</title></circle>';
      }
    });

    var gradId = 'uGrad_' + Math.random().toString(36).substring(2, 8);

    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;overflow:visible;display:block;" role="img" aria-label="' + (data.config.title || '') + ' 추이 차트">' +
      '<defs>' +
        '<linearGradient id="' + gradId + '" x1="0%" y1="0%" x2="0%" y2="100%">' +
          '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.38"/>' +
          '<stop offset="100%" stop-color="' + color + '" stop-opacity="0.02"/>' +
        '</linearGradient>' +
      '</defs>' +
      gridHtml +
      xLabelsHtml +
      (areaPath ? '<path d="' + areaPath + '" fill="url(#' + gradId + ')" />' : '') +
      (linePath ? '<path d="' + linePath + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />' : '') +
      barsHtml +
      dotsHtml +
    '</svg>';
  }

  /* ================= 5-4. 7-Tier 정밀 시계열 집계 엔진 ================= */
  function aggregateMultiSeries(allRecs, selectedEntities, dimension, period, mode){
    allRecs = Array.isArray(allRecs) ? allRecs : [];
    selectedEntities = Array.isArray(selectedEntities) ? selectedEntities : [];
    dimension = dimension || 'primary';
    period = period || 'all';
    mode = mode || 'single';

    var maxTime = -Infinity;
    allRecs.forEach(function(r){
      var t = new Date(r.startAt || r.createdAt).getTime();
      if(!isNaN(t) && t > maxTime) maxTime = t;
    });
    var refDate = (maxTime !== -Infinity) ? maxTime : Date.now();

    var cutoff = null;
    if(period === '3d'){
      cutoff = refDate - 3 * 86400000;
    } else if(period === '1w'){
      cutoff = refDate - 7 * 86400000;
    } else if(period === '1m'){
      cutoff = refDate - 30 * 86400000;
    } else if(period === '3m' || period === '3months'){
      cutoff = refDate - 92 * 86400000;
    } else if(period === '6m' || period === '6months'){
      cutoff = refDate - 183 * 86400000;
    } else if(period === '1y' || period === '1year'){
      cutoff = refDate - 370 * 86400000;
    } else {
      cutoff = null; // all: 음수 타임스탬프 전수 수용
    }

    var seriesMap = {};
    selectedEntities.forEach(function(ent){
      seriesMap[ent] = {
        entity: ent,
        points: [],
        minVal: Infinity,
        maxVal: -Infinity,
        latestVal: 0,
        initialVal: null,
        growthRate: 0,
        totalVolume: 0,
        sessionCount: 0,
        prDate: null,
        prVal: 0,
        unit: '',
        velocityPerWeek: 0,
        netDelta: 0
      };
    });

    allRecs.forEach(function(r){
      var t = new Date(r.startAt || r.createdAt).getTime();
      if(cutoff !== null && !isNaN(t) && t < cutoff) return;

      var ent = r._entityName || r.subTheme || r.item || r.exercise;
      if(!ent && r.text){
        var mMatch = r.text.match(/\[([^\]]+)\]/);
        if(mMatch) ent = mMatch[1].trim();
        else if(/스쿼트/i.test(r.text)) ent = '스쿼트';
        else if(/벤치프레스/i.test(r.text)) ent = '벤치프레스';
        else if(/데드리프트/i.test(r.text)) ent = '데드리프트';
        else if(/러닝/i.test(r.text)) ent = '러닝';
        else if(/독서/i.test(r.text)) ent = '독서';
      }
      if(!seriesMap[ent]) return;

      var s = seriesMap[ent];
      var dateKey = (r.startAt || '').slice(0, 10);
      var val = 0;
      var unit = '';

            if(r.metrics){
        if(r.metrics[dimension] !== undefined && typeof r.metrics[dimension] === 'number'){
          val = r.metrics[dimension];
          unit = (r.metricUnits && r.metricUnits[dimension]) || r.metrics.primaryUnit || '';
        } else if(dimension === '1rm'){
          val = r.metrics['1rm'] || r.metrics['estimated_1rm_kg'] || 0;
          unit = 'kg';
        } else if(dimension === 'volume'){
          val = r.metrics['volume'] || r.metrics['daily_volume_kg'] || 0;
          unit = 'kg';
        } else if(dimension === 'bodyweight'){
          val = r.metrics['bodyweight'] || r.metrics['bodyweight_kg'] || 0;
          unit = 'kg';
        } else if(dimension === 'intensity'){
          val = r.metrics['intensity'] || r.metrics['perceived_intensity_100'] || 0;
          unit = '%';
        } else if(dimension === 'sets'){
          val = r.metrics['sets'] || 0;
          unit = 'set';
        } else if(dimension === 'pages'){
          val = r.metrics['pages'] || 0;
          unit = '쪽';
        } else if(dimension === 'duration'){
          val = r.metrics['duration'] || 0;
          unit = '분';
        } else if(dimension === 'distance'){
          val = r.metrics['distance'] || 0;
          unit = 'km';
        } else if(dimension === 'revenue'){
          val = r.metrics['revenue'] || 0;
          unit = '만원';
        } else if(dimension === 'commits'){
          val = r.metrics['commits'] || 0;
          unit = '개';
        } else if(dimension === 'primary'){
          val = r.metrics.primary !== undefined ? r.metrics.primary : (r.metrics['1rm'] || r.metrics.pages || r.metrics.distance || 0);
          unit = r.metrics.primaryUnit || '';
        } else if(dimension === 'secondary'){
          val = r.metrics.secondary !== undefined ? r.metrics.secondary : (r.metrics.volume || r.metrics.duration || 0);
          unit = r.metrics.secondaryUnit || '';
        } else {
          var kMatch = Object.keys(r.metrics).find(function(k){ return k.toLowerCase() === dimension.toLowerCase(); });
          if(kMatch && typeof r.metrics[kMatch] === 'number'){
            val = r.metrics[kMatch];
            unit = (r.metricUnits && r.metricUnits[kMatch]) || '';
          }
        }
      }
      if(val <= 0 && r.text){
        var mNum = r.text.match(/([0-9]+(?:\.[0-9]+)?)\s*(kg|쪽|km|시간|분|원)/i);
        if(mNum){
          val = parseFloat(mNum[1]);
          unit = mNum[2] || '';
        }
      }

      if(val > 0){
        s.points.push({ date: dateKey, val: val, rawTime: t, rec: r, unit: unit });
        s.sessionCount++;
        s.totalVolume += (r.metrics && r.metrics.volume ? r.metrics.volume : val);
        if(!s.unit && unit) s.unit = unit;
        if(val < s.minVal) s.minVal = val;
        if(val > s.maxVal){
          s.maxVal = val;
          s.prVal = val;
          s.prDate = dateKey;
        }
        s.latestVal = val;
        if(s.initialVal === null) s.initialVal = val;
      }
    });

    Object.values(seriesMap).forEach(function(s){
      s.points.sort(function(a, b){ return a.rawTime - b.rawTime; });
      if(s.points.length > 0){
        s.initialVal = s.points[0].val;
        s.latestVal = s.points[s.points.length - 1].val;
        s.netDelta = Math.round((s.latestVal - s.initialVal) * 10) / 10;
        if(s.initialVal > 0){
          s.growthRate = Math.round(((s.latestVal - s.initialVal) / s.initialVal) * 1000) / 10;
        }
        var firstTime = s.points[0].rawTime;
        var lastTime = s.points[s.points.length - 1].rawTime;
        var diffWeeks = Math.max(1, (lastTime - firstTime) / (7 * 86400000));
        s.velocityPerWeek = Math.round((s.netDelta / diffWeeks) * 100) / 100;
      }
    });

    return seriesMap;
  }

  function calcNiceStep(range, targetTicks){
    range = Math.max(1, range);
    targetTicks = targetTicks || 5;
    var rough = range / targetTicks;
    var mag = Math.pow(10, Math.floor(Math.log10(rough)));
    var norm = rough / mag;
    var step = 1;
    if(norm < 1.5) step = 1;
    else if(norm < 3) step = 2;
    else if(norm < 7) step = 5;
    else step = 10;
    return step * mag;
  }

  /* ================= 5-5. 프로급 SVG 반응형 차트 렌더러 ================= */
  function renderMultiSeriesSvg(seriesMap, options){
    options = options || {};
    var width = options.width || 540;
    var height = options.height || 230;
    var scaleMode = options.scaleMode || 'linear';
    var period = options.period || '';
    var padL = 48;
    var padR = 25;
    var padT = 30;
    var padB = 38;
    var plotW = width - padL - padR;
    var plotH = height - padT - padB;

    var seriesKeys = Object.keys(seriesMap || {});
    if(seriesKeys.length === 0){
      var emptySvg = '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '"><text x="' + (width/2) + '" y="' + (height/2) + '" text-anchor="middle" fill="var(--ink-soft, #94a3b8)" font-size="13">NO OBSERVED DATA IN RANGE — EXPAND TO [ALL]</text></svg>';
      var emptyRes = new String(emptySvg);
      emptyRes.svgHtml = emptySvg;
      emptyRes.points = [];
      emptyRes.width = width;
      emptyRes.height = height;
      emptyRes.padL = padL;
      emptyRes.padR = padR;
      emptyRes.padT = padT;
      emptyRes.padB = padB;
      return emptyRes;
    }

    var globalMin = Infinity;
    var globalMax = -Infinity;
    var allDatesMap = {};

    seriesKeys.forEach(function(k){
      var s = seriesMap[k];
      s.points.forEach(function(p, idx){
        var plotVal = p.val;
        if(scaleMode === 'normalized'){
          var base = (s.points[0] && s.points[0].val) || 1;
          plotVal = Math.round((p.val / base) * 1000) / 10;
          p.normVal = plotVal;
        }
        if(plotVal < globalMin) globalMin = plotVal;
        if(plotVal > globalMax) globalMax = plotVal;
        allDatesMap[p.date] = p.rawTime;
      });
    });

    if(globalMin === Infinity){
      globalMin = (scaleMode === 'normalized' ? 100 : 0);
      globalMax = (scaleMode === 'normalized' ? 100 : 100);
    }

    var rawRange = globalMax - globalMin;
    var stepVal = calcNiceStep(rawRange, 4);
    var yMin = Math.max(0, Math.floor(globalMin / stepVal) * stepVal);
    var yMax = Math.ceil(globalMax / stepVal) * stepVal;
    if(yMax === yMin) yMax += stepVal;

    var sortedDatePairs = Object.entries(allDatesMap).sort(function(a, b){ return a[1] - b[1]; });
    var sortedDates = sortedDatePairs.map(function(p){ return p[0]; });

    function dateToX(dStr){
      var idx = sortedDates.indexOf(dStr);
      if(sortedDates.length <= 1) return padL + plotW / 2;
      return padL + (idx / (sortedDates.length - 1)) * plotW;
    }
    function valToY(v){
      var ratio = (v - yMin) / ((yMax - yMin) || 1);
      return padT + plotH - ratio * plotH;
    }

    var colors = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

    var svg = '<svg id="uInteractiveSvgChart" viewBox="0 0 ' + width + ' ' + height + '" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" style="overflow:visible;font-family:-apple-system,BlinkMacSystemFont,monospace,sans-serif;user-select:none;">';

    var tickCount = Math.min(8, Math.round((yMax - yMin) / stepVal));
    for(var i = 0; i <= tickCount; i++){
      var yVal = yMin + i * stepVal;
      if(yVal > yMax) break;
      var yPos = valToY(yVal);
      svg += '<line x1="' + padL + '" y1="' + yPos + '" x2="' + (width - padR) + '" y2="' + yPos + '" stroke="var(--border, rgba(148,163,184,0.3))" stroke-dasharray="2,2" stroke-width="1"/>';
      var yLbl = (scaleMode === 'normalized' ? (yVal + '%') : yVal.toLocaleString());
      svg += '<text x="' + (padL - 8) + '" y="' + (yPos + 4) + '" text-anchor="end" font-size="10" fill="var(--ink-soft, #64748b)" font-weight="700" font-family="monospace">' + yLbl + '</text>';
    }

    var yearsMap = {};
    sortedDates.forEach(function(d){ yearsMap[d.slice(0, 4)] = true; });
    var hasMultiYears = Object.keys(yearsMap).length > 1 || (sortedDates.length > 0 && parseInt(sortedDates[0].slice(0, 4), 10) < 2020);

    var KOR_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

    if(period === '1w' || sortedDates.length <= 7){
      // 1W 또는 7일 이하 일별 뷰: 7일간의 날짜 및 요일을 빠짐없이 100% 표출
      sortedDates.forEach(function(dStr){
        var xPos = dateToX(dStr);
        var dt = new Date(dStr + 'T00:00:00');
        var dayName = KOR_DAYS[dt.getDay()] || '';
        var dateLabel = hasMultiYears ? (dStr.slice(0, 4) + '.' + dStr.slice(5, 7)) : dStr.slice(5).replace('-', '.');
        svg += '<text x="' + xPos + '" y="' + (height - 12) + '" text-anchor="middle" font-size="9.5" fill="var(--ink)" font-weight="700">' +
          dateLabel + '<tspan fill="var(--primary)" font-weight="800">(' + dayName + ')</tspan></text>';
      });
    } else if(sortedDates.length <= 15){
      // 2주 이내: 2일 간격
      for(var j = 0; j < sortedDates.length; j += 2){
        var dStr = sortedDates[j];
        var xPos = dateToX(dStr);
        var dt = new Date(dStr + 'T00:00:00');
        var dayName = KOR_DAYS[dt.getDay()] || '';
        var dateLabel = hasMultiYears ? (dStr.slice(0, 4) + '.' + dStr.slice(5, 7)) : dStr.slice(5).replace('-', '.');
        svg += '<text x="' + xPos + '" y="' + (height - 12) + '" text-anchor="middle" font-size="9" fill="var(--ink-soft, #64748b)" font-weight="600">' +
          dateLabel + '(' + dayName + ')</text>';
      }
      if((sortedDates.length - 1) % 2 !== 0){
        var lastD = sortedDates[sortedDates.length - 1];
        var lastX = dateToX(lastD);
        var lastDt = new Date(lastD + 'T00:00:00');
        var dateLabelLast = hasMultiYears ? (lastD.slice(0, 4) + '.' + lastD.slice(5, 7)) : lastD.slice(5).replace('-', '.');
        svg += '<text x="' + lastX + '" y="' + (height - 12) + '" text-anchor="middle" font-size="9" fill="var(--ink-soft, #64748b)" font-weight="600">' +
          dateLabelLast + '(' + KOR_DAYS[lastDt.getDay()] + ')</text>';
      }
    } else if(sortedDates.length <= 35){
      // 1M 뷰: 5~7일 간격 균등 샘플링 + 시작/끝 표출
      var tickIndices = [0];
      var interval = Math.max(1, Math.floor(sortedDates.length / 4));
      for(var k = interval; k < sortedDates.length - 1; k += interval){
        tickIndices.push(k);
      }
      if(!tickIndices.includes(sortedDates.length - 1)){
        tickIndices.push(sortedDates.length - 1);
      }
      tickIndices.forEach(function(idx){
        var dStr = sortedDates[idx];
        var xPos = dateToX(dStr);
        var label = hasMultiYears ? (dStr.slice(0, 4) + '.' + dStr.slice(5, 7)) : dStr.slice(5).replace('-', '.');
        svg += '<text x="' + xPos + '" y="' + (height - 12) + '" text-anchor="middle" font-size="9.5" fill="var(--ink-soft, #64748b)" font-weight="600">' +
          label + '</text>';
      });
    } else {
      // 3M, 6M, 1Y, ALL 등 중장기 뷰: 4~5개 균등 분할
      var tickIndices = [0];
      var step = Math.max(1, Math.floor((sortedDates.length - 1) / 4));
      for(var k = 1; k < 4; k++){
        if(k * step < sortedDates.length - 1){
          tickIndices.push(k * step);
        }
      }
      if(!tickIndices.includes(sortedDates.length - 1)){
        tickIndices.push(sortedDates.length - 1);
      }
      tickIndices.forEach(function(idx){
        var dStr = sortedDates[idx];
        var xPos = dateToX(dStr);
        var label = hasMultiYears ? (dStr.slice(0, 4) + '.' + dStr.slice(5, 7)) : dStr.slice(5).replace('-', '.');
        svg += '<text x="' + xPos + '" y="' + (height - 12) + '" text-anchor="middle" font-size="9.5" fill="var(--ink-soft, #64748b)" font-weight="600">' +
          label + '</text>';
      });
    }

    var allInspectablePoints = [];

    seriesKeys.forEach(function(k, sIdx){
      var s = seriesMap[k];
      var color = colors[sIdx % colors.length];
      if(s.points.length === 0) return;

      var pathD = '';
      s.points.forEach(function(p, pIdx){
        var curVal = (scaleMode === 'normalized' ? p.normVal : p.val);
        var x = dateToX(p.date);
        var y = valToY(curVal);
        pathD += (pIdx === 0 ? ('M ' + x + ' ' + y) : (' L ' + x + ' ' + y));

        var prevVal = (pIdx > 0 ? s.points[pIdx - 1].val : null);
        var delta = (prevVal !== null ? (Math.round((p.val - prevVal) * 10) / 10) : null);
        var deltaPct = (prevVal !== null && prevVal > 0 ? (Math.round(((p.val - prevVal) / prevVal) * 1000) / 10) : null);

        allInspectablePoints.push({
          x: x,
          y: y,
          date: p.date,
          val: p.val,
          normVal: p.normVal,
          unit: s.unit || '',
          seriesName: s.entity,
          color: color,
          recId: (p.rec && p.rec.id) || '',
          rec: p.rec,
          memo: (p.rec && p.rec.text) || '',
          isPr: (p.val === s.prVal && s.sessionCount > 3),
          delta: delta,
          deltaPct: deltaPct
        });
      });

      if(seriesKeys.length === 1){
        var firstX = dateToX(s.points[0].date);
        var lastX = dateToX(s.points[s.points.length - 1].date);
        var baseY = padT + plotH;
        var areaD = pathD + ' L ' + lastX + ' ' + baseY + ' L ' + firstX + ' ' + baseY + ' Z';
        svg += '<defs><linearGradient id="u_grad_' + sIdx + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.28"/>' +
          '<stop offset="100%" stop-color="' + color + '" stop-opacity="0.01"/>' +
          '</linearGradient></defs>' +
          '<path d="' + areaD + '" fill="url(#u_grad_' + sIdx + ')" />';
      }

      svg += '<path d="' + pathD + '" fill="none" stroke="' + color + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';

      var ptCount = s.points.length;
      var dotR = 3.0;
      var strokeW = 1.8;
      var showValueBadge = false;

      if(period === '1w' || ptCount <= 7){
        dotR = 4.2;
        strokeW = 2.2;
        showValueBadge = (seriesKeys.length <= 2);
      } else if(ptCount <= 15){
        dotR = 3.2;
        strokeW = 1.8;
      } else if(ptCount <= 35){
        dotR = 2.4;
        strokeW = 1.5;
      } else {
        dotR = 1.6;
        strokeW = 1.0;
      }

      s.points.forEach(function(p){
        var curVal = (scaleMode === 'normalized' ? p.normVal : p.val);
        var x = dateToX(p.date);
        var y = valToY(curVal);
        var isPr = (p.val === s.prVal && s.sessionCount > 3);
        if(isPr){
          var prR = (ptCount <= 7 ? 6.5 : 5.5);
          svg += '<circle cx="' + x + '" cy="' + y + '" r="' + prR + '" fill="#fbbf24" stroke="#ffffff" stroke-width="2"/>';
          svg += '<text x="' + x + '" y="' + (y - (ptCount <= 7 ? 10 : 8)) + '" text-anchor="middle" font-size="9.5" font-weight="900" fill="#d97706">PR ' + p.val + '</text>';
        } else {
          svg += '<circle cx="' + x + '" cy="' + y + '" r="' + dotR + '" fill="#ffffff" stroke="' + color + '" stroke-width="' + strokeW + '"/>';
          if(showValueBadge && !isPr){
            svg += '<text x="' + x + '" y="' + (y - 8) + '" text-anchor="middle" font-size="9" font-weight="700" fill="var(--ink)">' + curVal + '</text>';
          }
        }
      });
    });

    svg += '<line id="uCrosshairV" x1="0" y1="' + padT + '" x2="0" y2="' + (padT + plotH) + '" stroke="var(--primary, #3b82f6)" stroke-dasharray="3,3" stroke-width="1.2" style="display:none;pointer-events:none;"/>';
    svg += '<line id="uCrosshairH" x1="' + padL + '" y1="0" x2="' + (width - padR) + '" y2="0" stroke="var(--primary, #3b82f6)" stroke-dasharray="3,3" stroke-width="1.2" style="display:none;pointer-events:none;"/>';
    svg += '<circle id="uCrosshairDot" cx="0" cy="0" r="5" fill="#3b82f6" stroke="#ffffff" stroke-width="2" style="display:none;pointer-events:none;"/>';
    svg += '<rect id="uCrosshairCapture" x="' + padL + '" y="' + padT + '" width="' + plotW + '" height="' + plotH + '" fill="transparent" style="cursor:crosshair;"/>';
    svg += '</svg>';

    var res = new String(svg);
    res.svgHtml = svg;
    res.points = allInspectablePoints;
    res.width = width;
    res.height = height;
    res.padL = padL;
    res.padR = padR;
    res.padT = padT;
    res.padB = padB;
    return res;
  }

  K.renderUniversalSvgChart = renderUniversalSvgChart;
  K.aggregateMultiSeries = aggregateMultiSeries;
  K.calcNiceStep = calcNiceStep;
  K.renderMultiSeriesSvg = renderMultiSeriesSvg;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
