/**
 * OurGoal Table Analytics Engine (기록 탭 — 전문 템플릿 표 실시간 집계·일자별 추이 계산)
 *
 * 「전문 템플릿 실시간 자동 집계 엔진 (혁신 1)」 묶음(computeTableAnalytics)과 「📈 표 기록 기반 일자별 자동 성장 추이 차트」 묶음(computeTrendChartData) — 둘 다 표 기록을 숫자로 바꾸는 계산 책임이다. 그리는 쪽(renderAnalyticsHtml·renderTrendSvgChart)은 js/tabs/records/table-analytics-view.js.
 * computeTableAnalytics·computeTrendChartData 는 smoke-test FN_NAMES 다(인라인 합본에서 찾는다).
 * #TASK-ES-520(인라인 3단계 Z4 — FN_NAMES 묶음(목표 보관·히트맵·표 집계·표 추이·여러 지표 SVG)): index.html 인라인 IIFE 의 구간(이전 전 9662~9833 · 9836~9944줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 9662~9833줄(#TASK-ES-520 생성기 표지) ---- */
  /* ============ 전문 템플릿 실시간 자동 집계 엔진 (혁신 1) ============ */
  function computeTableAnalytics(template, columns, rows){
    var res = {
      theme: (template && template.theme) || 'daily',
      title: (template && template.title) || '',
      stats: []
    };
    if(!columns || !rows) return res;

    var validRows = rows.filter(function(r){
      return r && r.some(function(cell, idx){ return idx > 0 && cell && String(cell).trim().length > 0; });
    });

    var colMap = {};
    columns.forEach(function(c, idx){
      var name = (c || '').toLowerCase();
      if(name.indexOf('종목') !== -1 || name.indexOf('운동') !== -1 || name.indexOf('활동') !== -1 || name.indexOf('스테이션') !== -1 || name.indexOf('과목') !== -1 || name.indexOf('고객') !== -1) colMap.item = idx;
      if(name.indexOf('세트') !== -1) colMap.sets = idx;
      if(name.indexOf('횟수') !== -1 || name.indexOf('회') !== -1 || name.indexOf('reps') !== -1) colMap.reps = idx;
      if(name.indexOf('무게') !== -1 || name.indexOf('중량') !== -1 || name.indexOf('kg') !== -1) colMap.weight = idx;
      if(name.indexOf('시간') !== -1 || name.indexOf('분') !== -1 || name.indexOf('time') !== -1) colMap.time = idx;
      if(name.indexOf('거리') !== -1 || name.indexOf('km') !== -1 || name.indexOf('m') !== -1) colMap.dist = idx;
      if(name.indexOf('금액') !== -1 || name.indexOf('원') !== -1 || name.indexOf('제안') !== -1) colMap.amount = idx;
      if(name.indexOf('확률') !== -1 || name.indexOf('%') !== -1) colMap.prob = idx;
      if(name.indexOf('강도') !== -1 || name.indexOf('집중도') !== -1 || name.indexOf('점') !== -1) colMap.score = idx;
      if(name.indexOf('심박') !== -1 || name.indexOf('bpm') !== -1) colMap.hr = idx;
      if(name.indexOf('페이스') !== -1) colMap.pace = idx;
    });

    var rowCount = validRows.length;

    if(res.theme === 'workout' || (template && template.key==='hyrox_workout') || (template && template.title && template.title.indexOf('헬스')!==-1)){
      var totalVolume = 0;
      var totalSets = 0;
      var totalReps = 0;
      var totalDistKm = 0;
      var totalTimeMin = 0;
      var uniqueItems = {};

      validRows.forEach(function(r){
        var itemStr = colMap.item !== undefined ? (r[colMap.item] || '') : '';
        if(itemStr.trim()) uniqueItems[itemStr.trim()] = true;

        var s = colMap.sets !== undefined ? parseFloat(String(r[colMap.sets]).replace(/[^0-9.]/g,'')) : NaN;
        var reps = colMap.reps !== undefined ? parseFloat(String(r[colMap.reps]).replace(/[^0-9.]/g,'')) : NaN;
        var w = colMap.weight !== undefined ? parseFloat(String(r[colMap.weight]).replace(/[^0-9.]/g,'')) : NaN;

        if(!isNaN(s)) totalSets += s;
        if(!isNaN(reps)) totalReps += (isNaN(s) ? reps : reps * s);

        if(!isNaN(s) && !isNaN(reps)){
          var weightVal = !isNaN(w) && w > 0 ? w : 1;
          totalVolume += weightVal * s * reps;
        }

        if(colMap.dist !== undefined){
          var d = parseFloat(String(r[colMap.dist]).replace(/[^0-9.]/g,''));
          if(!isNaN(d)) totalDistKm += d;
        }
        if(colMap.time !== undefined){
          var tm = parseFloat(String(r[colMap.time]).replace(/[^0-9.]/g,''));
          if(!isNaN(tm)) totalTimeMin += tm;
        }
      });

      var uCount = Object.keys(uniqueItems).length || rowCount;
      if(totalVolume > 0 && colMap.weight !== undefined){
        res.stats.push({ label: '총 볼륨', value: Math.round(totalVolume).toLocaleString() + ' kg', highlight: true });
      }
      if(totalSets > 0){
        res.stats.push({ label: '총 세트', value: totalSets + ' 세트', highlight: false });
      }
      if(totalDistKm > 0){
        res.stats.push({ label: '총 거리', value: totalDistKm.toFixed(1) + ' km', highlight: true });
      }
      if(totalTimeMin > 0){
        res.stats.push({ label: '총 시간', value: Math.round(totalTimeMin) + ' 분', highlight: false });
      }
      res.stats.push({ label: '운동 종목', value: uCount + ' 개', highlight: false });

    } else if(res.theme === 'study' || (template && template.title && template.title.indexOf('공부')!==-1)){
      var totalStudyMin = 0;
      var scoreSum = 0;
      var scoreCount = 0;
      var studySubjects = {};

      validRows.forEach(function(r){
        var sub = colMap.item !== undefined ? (r[colMap.item] || '') : '';
        if(sub.trim()) studySubjects[sub.trim()] = true;

        if(colMap.time !== undefined){
          var tm = parseFloat(String(r[colMap.time]).replace(/[^0-9.]/g,''));
          if(!isNaN(tm)) totalStudyMin += tm;
        }
        if(colMap.score !== undefined){
          var sc = parseFloat(String(r[colMap.score]).replace(/[^0-9.]/g,''));
          if(!isNaN(sc)){ scoreSum += sc; scoreCount++; }
        }
      });

      var subCount = Object.keys(studySubjects).length || rowCount;
      if(totalStudyMin > 0){
        var hrs = Math.floor(totalStudyMin / 60);
        var mins = Math.round(totalStudyMin % 60);
        var timeStr = hrs > 0 ? (hrs + '시간 ' + (mins>0?mins+'분':'')) : (mins + '분');
        res.stats.push({ label: '총 학습시간', value: timeStr, highlight: true });
      }
      if(scoreCount > 0){
        res.stats.push({ label: '평균 집중도', value: Math.round(scoreSum / scoreCount) + '점', highlight: true });
      }
      res.stats.push({ label: '학습 과목', value: subCount + ' 개', highlight: false });
      res.stats.push({ label: '기록 세션', value: rowCount + ' 회', highlight: false });

    } else if(res.theme === 'business' || (template && template.title && template.title.indexOf('영업')!==-1)){
      var totalAmountWon = 0;
      var expectedWon = 0;
      var clientCount = 0;

      validRows.forEach(function(r){
        var cName = colMap.item !== undefined ? (r[colMap.item] || '') : '';
        if(cName.trim()) clientCount++;

        var rawAmt = colMap.amount !== undefined ? String(r[colMap.amount] || '') : '';
        var rawProb = colMap.prob !== undefined ? String(r[colMap.prob] || '') : '';

        var isEok = rawAmt.indexOf('억') !== -1;
        var numAmt = parseFloat(rawAmt.replace(/[^0-9.]/g,''));
        if(!isNaN(numAmt)){
          var amtManwon = isEok ? (numAmt * 10000) : numAmt;
          totalAmountWon += amtManwon;

          var probNum = parseFloat(rawProb.replace(/[^0-9.]/g,''));
          var probRate = !isNaN(probNum) ? (probNum > 1 ? probNum / 100 : probNum) : 0.5;
          expectedWon += (amtManwon * probRate);
        }
      });

      if(totalAmountWon > 0){
        var amtFmt = totalAmountWon >= 10000 ? ((totalAmountWon/10000).toFixed(1)+'억원') : (Math.round(totalAmountWon).toLocaleString()+'만원');
        var expFmt = expectedWon >= 10000 ? ((expectedWon/10000).toFixed(1)+'억원') : (Math.round(expectedWon).toLocaleString()+'만원');
        res.stats.push({ label: '총 파이프라인', value: amtFmt, highlight: true });
        res.stats.push({ label: '가중 예상매출', value: expFmt, highlight: true });
      }
      res.stats.push({ label: '진행 미팅/딜', value: (clientCount || rowCount) + ' 건', highlight: false });

    } else {
      var numericSums = {};
      columns.forEach(function(c, cIdx){
        if(cIdx === 0) return;
        validRows.forEach(function(r){
          var cell = r[cIdx];
          if(!cell) return;
          var num = parseFloat(String(cell).replace(/[^0-9.]/g,''));
          if(!isNaN(num) && String(num).length > 0){
            numericSums[c] = (numericSums[c] || 0) + num;
          }
        });
      });

      res.stats.push({ label: '총 기록 항목', value: rowCount + ' 건', highlight: true });
      var added = 0;
      Object.keys(numericSums).forEach(function(colTitle){
        if(added < 2){
          var sum = numericSums[colTitle];
          res.stats.push({ label: colTitle + ' 합계', value: (sum%1===0 ? sum : sum.toFixed(1)).toLocaleString(), highlight: false });
          added++;
        }
      });
    }

    return res;
  }

  /* ---- 이전 전 index.html 9836~9944줄(#TASK-ES-520 생성기 표지) ---- */
  /* ============ 📈 표 기록 기반 일자별 자동 성장 추이 차트 (Visual Trend Chart) ============ */
  function computeTrendChartData(templateKey, allRecords, period){
    period = period || '7';
    var list = (allRecords || []).filter(function(r){
      if(!r) return false;
      var tKey = r.templateKey || r.templateId || '';
      if(templateKey && tKey && tKey !== templateKey) return false;
      if(templateKey && !tKey){
        if(r.templateTitle && r.templateTitle.indexOf(templateKey) === -1 && (!r.theme || r.theme.indexOf(templateKey) === -1)) return false;
      }
      return (r.type === 'template' || (r.columns && r.rows));
    });

    list.sort(function(a, b){
      var da = Date.parse(a.startAt || a.createdAt || 0);
      var db = Date.parse(b.startAt || b.createdAt || 0);
      return da - db;
    });

    if(period === '7' && list.length > 7){
      list = list.slice(-7);
    } else if(period === '30' && list.length > 30){
      list = list.slice(-30);
    }

    var tKey = templateKey || (list[0] && list[0].templateKey) || 'health';
    var metricName = '기록 항목수';
    var unit = '개';
    if(/hyrox|하이록스|crossfit|크로스핏/.test(tKey)){
      metricName = '소요 시간';
      unit = '분';
    } else if(/study|공부/.test(tKey)){
      metricName = '순공 시간';
      unit = '분';
    } else if(/sales|영업|주식|stock/.test(tKey)){
      metricName = '실적 금액';
      unit = '만원';
    } else if(/health|workout|헬스|운동/.test(tKey)){
      metricName = '총 볼륨';
      unit = 'kg';
    }

    var points = [];
    var isSample = false;

    if(list.length >= 2){
      list.forEach(function(rec){
        var d = new Date(rec.startAt || rec.createdAt || Date.now());
        var dateLabel = L.pad(d.getMonth() + 1) + '/' + L.pad(d.getDate());
        var fullDate = L.dateKey(d.toISOString());
        var tplTheme = (rec && rec.theme) || (/health|workout|hyrox|crossfit|헬스|운동/.test(tKey) ? 'workout' : (/study|공부/.test(tKey) ? 'study' : (/sales|영업|주식/.test(tKey) ? 'sales' : 'daily')));
        var tplTitle = (rec && rec.templateTitle) || (tplTheme === 'workout' ? '헬스 운동일지' : tKey);
        var analytics = computeTableAnalytics({ key: tKey, title: tplTitle, theme: tplTheme }, rec.columns || [], rec.rows || []);
        if(analytics && analytics.stats && analytics.stats.length){
          var stat = analytics.stats[0];
          if(stat && stat.value){
            val = parseFloat(String(stat.value).replace(/[^0-9.]/g, '')) || 0;
          }
        }
        if(val === 0){
          val = (rec.rows && rec.rows.length) || 1;
        }
        points.push({
          date: dateLabel,
          fullDate: fullDate,
          value: Math.round(val),
          label: Math.round(val).toLocaleString() + unit
        });
      });
    } else {
      isSample = true;
      var baseVal = /study|공부/.test(tKey) ? 75 : (/sales|영업/.test(tKey) ? 450 : (/hyrox|하이록스/.test(tKey) ? 68 : 1200));
      var now = new Date();
      var sampleCount = period === '7' ? 5 : (period === '30' ? 8 : 10);
      for(var i = sampleCount - 1; i >= 0; i--){
        var dt = new Date(now.getTime() - i * 86400000 * 2);
        var factor = 1 + (sampleCount - 1 - i) * 0.07 + (i % 2 === 0 ? 0.03 : -0.02);
        var simVal = Math.round(baseVal * factor);
        points.push({
          date: L.pad(dt.getMonth() + 1) + '/' + L.pad(dt.getDate()),
          fullDate: L.dateKey(dt.toISOString()),
          value: simVal,
          label: simVal.toLocaleString() + unit
        });
      }
    }

    var vals = points.map(function(p){ return p.value; });
    var maxVal = Math.max.apply(null, vals);
    var minVal = Math.min.apply(null, vals);
    var sum = vals.reduce(function(a, b){ return a + b; }, 0);
    var avgVal = Math.round(sum / vals.length);
    var latest = vals[vals.length - 1];
    var first = vals[0];
    var growthRate = first > 0 ? parseFloat((((latest - first) / first) * 100).toFixed(1)) : 0;

    return {
      templateKey: tKey,
      metricName: metricName,
      unit: unit,
      points: points,
      max: maxVal,
      min: minVal,
      avg: avgVal,
      latest: latest,
      growthRate: growthRate,
      isSample: isSample
    };
  }

  K.computeTableAnalytics = computeTableAnalytics;
  K.computeTrendChartData = computeTrendChartData;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
