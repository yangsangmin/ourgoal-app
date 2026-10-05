/**
 * OurGoal Stats Cell: 메트릭 자율 추출·탐색·시계열 집계 — ensureMetricConfig · extractMetricsFromRecord · discoverActiveMetrics · aggregateMetricTimeSeries (#TASK-ES-401 · 통계 세포 쪼개기 2차)
 *
 * js/universal-stats.js(이전 전 5,171줄)에서 동작 그대로 옮겼다(이전 전 285~967줄).
 *   ensureMetricConfig · extractMetricsFromRecord · discoverActiveMetrics · aggregateMetricTimeSeries
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalUniversalStats.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(root) {
  'use strict';
  // S = js/universal-stats.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·값(pad·METRIC_CONFIGS·askConfirm …)을 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 통계 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = root.OurgoalUniversalStatsKit = root.OurgoalUniversalStatsKit || {};
  var S = K.scope = K.scope || {};

  /**
   * 미등록 임의 메트릭 발생 시 자율적으로 메타데이터를 등록하는 안전 레지스트리
   */
  function ensureMetricConfig(cat, hint){
    if(S.METRIC_CONFIGS[cat]) return S.METRIC_CONFIGS[cat];
    var title = (hint && (hint.title || hint.label)) || cat.replace(/^tbl_/, '');
    var unit = (hint && hint.unit) || '';
    var chartType = (hint && hint.chartType) || 'line';
    var agg = (hint && hint.agg) || 'sum';
    var icon = (hint && hint.icon) || '✨';
    var color = (hint && hint.color) || '#8b5cf6';
    S.METRIC_CONFIGS[cat] = {
      category: cat,
      title: title,
      icon: icon,
      label: (hint && hint.label) || title,
      unit: unit,
      agg: agg,
      chartType: chartType,
      color: color,
      kpi1: (agg === 'latest' ? '🎯 최근 측정값' : '🏆 총 누적 ' + title),
      kpi2: (agg === 'latest' ? '📉 최저 기록' : '⭐ 최고 기록'),
      kpi3: '📊 일일/주간 평균',
      kpi4: '📈 성장 변동률'
    };
    return S.METRIC_CONFIGS[cat];
  }

  /**
   * 단일 레코드에서 가능한 모든 메트릭을 자율 추출 (자연어 줄글 + 표 형식)
   */
  function extractMetricsFromRecord(rec){
    var metrics = [];
    if(!rec) return metrics;

    var text = (rec.text || '') + ' ' + (rec.memo || '') + ' ' + (rec.summaryText || '') + ' ' + (rec.templateTitle || '');

    // [A] 체중 / 다이어트 지표
    var wtMatch = text.match(/(?:체중|몸무게|weight)[^\d]*(\d+(?:\.\d+)?)\s*(?:kg|킬로)?/i) || text.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if(wtMatch && /체중|몸무게|다이어트|인바디|체지방|weight/i.test(text)){
      var wtVal = parseFloat(wtMatch[1]);
      if(wtVal >= 30 && wtVal <= 250){
        metrics.push({
          category: 'weight',
          key: 'weight',
          label: '체중',
          value: wtVal,
          unit: 'kg',
          agg: 'latest',
          chartType: 'line'
        });
      }
    }

    // [B] 독서 지표 (페이지/쪽)
    var readMatch = text.match(/(\d+)\s*(?:쪽|페이지|page|pages|p\b)/i);
    var bookMatch = text.match(/(\d+)\s*(?:권|books?)/i);
    if(readMatch || bookMatch || /독서|책|도서|reading|book/i.test(text)){
      var pages = readMatch ? parseInt(readMatch[1], 10) : 0;
      var books = bookMatch ? parseInt(bookMatch[1], 10) : 0;
      if(!pages && books) pages = books * 250; // 권당 250쪽 환산
      if(pages > 0){
        metrics.push({
          category: 'reading',
          key: 'pages',
          label: '독서량',
          value: pages,
          books: books,
          unit: '쪽',
          agg: 'sum',
          chartType: 'bar'
        });
      }
    }

    // [C] 수면 지표 (수면시간 hr)
    var sleepMatch = text.match(/(?:수면|잠|취침)[^\d]*(\d+(?:\.\d+)?)\s*(?:시간|hr|h|hours?)/i) || text.match(/(\d+(?:\.\d+)?)\s*(?:시간|hr)[^\d]*(?:수면|취침|숙면|잠|꿀잠)/i) || (rec.subTheme === "수면" ? text.match(/(\d+(?:\.\d+)?)\s*(?:시간|hr)/i) : null);
    if(sleepMatch || /수면|숙면|sleep/i.test(text)){
      var sleepVal = sleepMatch ? parseFloat(sleepMatch[1]) : 0;
      if(!sleepVal && rec.startAt && rec.endAt && /수면|잠|숙면/i.test(text)){
        sleepVal = Math.round(((new Date(rec.endAt) - new Date(rec.startAt)) / 3600000) * 10) / 10;
      }
      if(sleepVal >= 1 && sleepVal <= 16){
        metrics.push({
          category: 'sleep',
          key: 'sleep_hours',
          label: '수면시간',
          value: sleepVal,
          unit: '시간',
          agg: 'avg',
          chartType: 'line'
        });
      }
    }

    // [D] 재테크 / 저축 지표
    var moneyMatch = text.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:만원|원|달러|\$)/i);
    if(moneyMatch && /저축|적금|투자|주식|지출|재테크|예금|finance|saving/i.test(text)){
      var rawAmt = moneyMatch[1].replace(/,/g, '');
      var amtVal = parseFloat(rawAmt);
      if(/만원/.test(moneyMatch[0])) amtVal = amtVal; // 단위: 만원
      else if(/원/.test(moneyMatch[0])) amtVal = Math.round((amtVal / 10000) * 10) / 10;
      else if(/달러|$/.test(moneyMatch[0])) amtVal = Math.round((amtVal * 1.35) * 10) / 10;

      if(amtVal > 0){
        metrics.push({
          category: 'finance',
          key: 'saving_amount',
          label: '저축/투자',
          value: amtVal,
          unit: '만원',
          agg: 'sum',
          chartType: 'area'
        });
      }
    }

    // [E] 러닝 메트릭 탐지
    var distMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:km|킬로|키로)/i);
    var paceMatch = text.match(/(\d+)['’:]([0-5]\d)["”]?\s*(?:페이스|pace)?/i);
    var isRunning = /러닝|달리기|마라톤|조깅|run|running/i.test(text) || (rec.theme === 'workout' && !!distMatch) || !!paceMatch;

    if(isRunning && distMatch){
      var distVal = parseFloat(distMatch[1]);
      if(distVal > 0 && distVal <= 100){
        var paceSec = 0;
        if(paceMatch){
          paceSec = parseInt(paceMatch[1], 10) * 60 + parseInt(paceMatch[2], 10);
        }
        metrics.push({
          category: 'running',
          key: 'distance',
          label: '거리',
          value: distVal,
          unit: 'km',
          paceSec: paceSec,
          agg: 'sum',
          chartType: 'area'
        });
      }
    }

    // [F] 3대 운동 및 웨이트 메트릭 탐지
    var isWorkout = /벤치|스쿼트|데드|헬스|웨이트|bench|squat|deadlift/i.test(text) || rec.templateKey === 'health' || rec.theme === 'workout';
    if(isWorkout){
      var bpMatch = text.match(/(?:벤치|벤치프레스|bp)[^\d]*(\d+(?:\.\d+)?)\s*(?:kg|키로)?/i);
      var sqMatch = text.match(/(?:스쿼트|백스쿼트|sq)[^\d]*(\d+(?:\.\d+)?)\s*(?:kg|키로)?/i);
      var dlMatch = text.match(/(?:데드|데드리프트|dl)[^\d]*(\d+(?:\.\d+)?)\s*(?:kg|키로)?/i);

      var bpVal = bpMatch ? parseFloat(bpMatch[1]) : 0;
      var sqVal = sqMatch ? parseFloat(sqMatch[1]) : 0;
      var dlVal = dlMatch ? parseFloat(dlMatch[1]) : 0;

      // 테이블 형식인 경우 셀 파싱
      if(rec.columns && rec.rows && rec.rows.length){
        rec.rows.forEach(function(row){
          var rowStr = row.join(' ');
          var rBp = rowStr.match(/(?:벤치|벤치프레스|bp)[^\d]*(\d+(?:\.\d+)?)/i);
          var rSq = rowStr.match(/(?:스쿼트|백스쿼트|sq)[^\d]*(\d+(?:\.\d+)?)/i);
          var rDl = rowStr.match(/(?:데드|데드리프트|dl)[^\d]*(\d+(?:\.\d+)?)/i);
          if(rBp && parseFloat(rBp[1]) > bpVal) bpVal = parseFloat(rBp[1]);
          if(rSq && parseFloat(rSq[1]) > sqVal) sqVal = parseFloat(rSq[1]);
          if(rDl && parseFloat(rDl[1]) > dlVal) dlVal = parseFloat(rDl[1]);

          var wtM = rowStr.match(/(\d+(?:\.\d+)?)\s*(?:kg|키로)/i);
          if(wtM && !bpVal && !sqVal && !dlVal){
            bpVal = parseFloat(wtM[1]);
          }
        });
      }

      if(bpVal > 0 || sqVal > 0 || dlVal > 0){
        metrics.push({
          category: 'big3',
          key: 'weight',
          label: '3대 중량',
          bench: bpVal,
          squat: sqVal,
          deadlift: dlVal,
          value: bpVal + sqVal + dlVal || Math.max(bpVal, sqVal, dlVal),
          unit: 'kg',
          agg: 'max',
          chartType: 'line'
        });
      }
    }

    // [G] 공부 / 수험 / 몰입 메트릭
    var isStudy = /공부|순공|도서관|독서실|수험|수학|영어|국어|알고리즘|열품타|인강|자격증|기출|study/i.test(text) || rec.templateKey === 'study' || rec.theme === 'study';
    if(isStudy && !/커밋|github|pr/i.test(text)){
      var probMatch = text.match(/(\d+)\s*(?:문제|문항|개)/);
      var minMatch = text.match(/(\d+)\s*(?:분|min)/);
      var hrMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:시간|hr|hours?)/);

      var studyMins = 0;
      if(minMatch) studyMins += parseInt(minMatch[1], 10);
      if(hrMatch) studyMins += parseFloat(hrMatch[1]) * 60;
      if(!studyMins && rec.startAt && rec.endAt){
        studyMins = Math.round((new Date(rec.endAt) - new Date(rec.startAt)) / 60000);
      }
      if(!studyMins) studyMins = 45;

      metrics.push({
        category: 'study',
        key: 'study_time',
        label: '순공시간',
        value: studyMins,
        problems: probMatch ? parseInt(probMatch[1], 10) : 0,
        unit: '분',
        agg: 'sum',
        chartType: 'bar'
      });
    }

    // [H] 영업 / 비즈니스
    var isSales = /영업|매출|계약|클라이언트|수주|실적|business|sales/i.test(text) || rec.templateKey === 'business' || rec.theme === 'business';
    if(isSales){
      var salesM = text.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:만원|원)/);
      var dealM = text.match(/(\d+)\s*(?:건|건수|개)/);
      var amt = 0;
      if(salesM){
        var cleanAmt = salesM[1].replace(/,/g, '');
        amt = /만원/.test(salesM[0]) ? parseFloat(cleanAmt) : Math.round(parseFloat(cleanAmt) / 10000);
      }
      var deals = dealM ? parseInt(dealM[1], 10) : 1;

      if(amt > 0 || deals > 0){
        metrics.push({
          category: 'sales',
          key: 'sales_amount',
          label: '영업실적',
          value: amt || deals * 100,
          deals: deals,
          unit: '만원',
          agg: 'sum',
          chartType: 'area'
        });
      }
    }

    // [I] 혈압 지표 (Blood Pressure)
    var bpFullM = text.match(/(?:혈압|bp)[^\d]*(\d{2,3})\s*[\/\s]\s*(\d{2,3})\s*(?:mmhg)?/i);
    if(bpFullM){
      var sysVal = parseInt(bpFullM[1], 10);
      var diaVal = parseInt(bpFullM[2], 10);
      metrics.push({
        category: 'blood_pressure',
        key: 'sys',
        label: '수축기 혈압',
        value: sysVal,
        dia: diaVal,
        unit: 'mmHg',
        agg: 'avg',
        chartType: 'line'
      });
    }

    // [J] 카페인 지표 (Caffeine)
    var cafMatch = text.match(/(?:카페인|커피|에스프레소)[^\d]*(\d+(?:\.\d+)?)\s*(?:mg|잔|shot)/i);
    if(cafMatch){
      var cVal = parseFloat(cafMatch[1]);
      if(/잔|shot/i.test(cafMatch[0])) cVal = cVal * 75; // 1잔 75mg 환산
      metrics.push({
        category: 'caffeine',
        key: 'caffeine_mg',
        label: '카페인',
        value: cVal,
        unit: 'mg',
        agg: 'sum',
        chartType: 'bar'
      });
    }

    // [K] 골프 지표 (Golf)
    var golfMatch = text.match(/(?:골프|라운딩|스크린|라베)[^\d]*(\d{2,3})\s*(?:타|개|스윙)/i);
    if(golfMatch){
      metrics.push({
        category: 'golf',
        key: 'score',
        label: '골프 타수',
        value: parseInt(golfMatch[1], 10),
        unit: '타',
        agg: 'latest',
        chartType: 'line'
      });
    }

    // [L] 코딩 / 커밋 지표 (Coding)
    var gitMatch = text.match(/(?:코딩|커밋|깃허브|github|pr|commit)[^\d]*(\d+)\s*(?:개|건|회|commits?|커밋)/i);
    if(gitMatch){
      metrics.push({
        category: 'coding',
        key: 'commits',
        label: '커밋 수',
        value: parseInt(gitMatch[1], 10),
        unit: '커밋',
        agg: 'sum',
        chartType: 'bar'
      });
    }

    // [M] 수분 / 물 지표 (Water)
    var waterMatch = text.match(/(?:물|수분|음용|water)[^\d]*(\d+(?:\.\d+)?)\s*(?:l|ml|리터|잔)/i);
    if(waterMatch){
      var wVal = parseFloat(waterMatch[1]);
      if(/ml/i.test(waterMatch[0])) wVal = Math.round((wVal / 1000) * 10) / 10;
      else if(/잔/i.test(waterMatch[0])) wVal = Math.round((wVal * 0.25) * 10) / 10;
      metrics.push({
        category: 'water',
        key: 'water_l',
        label: '수분 섭취량',
        value: wVal,
        unit: 'L',
        agg: 'sum',
        chartType: 'bar'
      });
    }

    // [N] 체지방률 지표 (Body Fat)
    var fatMatch = text.match(/(?:체지방|골격근|근육량|fat)[^\d]*(\d+(?:\.\d+)?)\s*%/i);
    if(fatMatch){
      metrics.push({
        category: 'body_fat',
        key: 'body_fat',
        label: '체지방률',
        value: parseFloat(fatMatch[1]),
        unit: '%',
        agg: 'latest',
        chartType: 'line'
      });
    }

    // [O] 임의 표(Table) 컬럼 자율 추출 (사용자 맞춤 템플릿/CSV 수용)
    if(rec.columns && rec.rows && rec.rows.length){
      rec.columns.forEach(function(colName, colIdx){
        if(/^(?:번호|날짜|일자|시간|메모|비고|코멘트|내용|구분|id|date|no)$/i.test(colName.trim())) return;
        var unitM = colName.match(/\(([^)]+)\)/);
        var cleanCol = colName.replace(/\([^)]+\)/, '').trim();
        rec.rows.forEach(function(row){
          var cellVal = row[colIdx];
          if(cellVal === undefined || cellVal === null) return;
          var str = String(cellVal).trim();
          var numM = str.match(/([+-]?\d+(?:\.\d+)?)/);
          if(numM){
            var num = parseFloat(numM[1]);
            var unit = unitM ? unitM[1] : (str.replace(numM[1], '').trim() || '');
            var catKey = 'tbl_' + cleanCol.toLowerCase().replace(/[^가-힣a-z0-9]/g, '_');
            var isState = /체중|몸무게|혈압|심박|점수|타수|%|kg|비율|레벨|온도/i.test(cleanCol + unit);
            var hint = {
              title: cleanCol,
              label: cleanCol,
              unit: unit,
              agg: isState ? 'latest' : 'sum',
              chartType: isState ? 'line' : 'bar'
            };
            ensureMetricConfig(catKey, hint);
            metrics.push({
              category: catKey,
              key: catKey,
              label: cleanCol,
              value: num,
              unit: unit,
              agg: isState ? 'latest' : 'sum',
              chartType: isState ? 'line' : 'bar'
            });
          }
        });
      });
    }

    // [P] 기본 실천시간 (항상 누적)
    var durMs = 0;
    if(rec.startAt && rec.endAt){
      durMs = Math.max(0, new Date(rec.endAt) - new Date(rec.startAt));
    }
    if(!durMs) durMs = 30 * 60000;

    metrics.push({
      category: 'general',
      key: 'duration',
      label: '실천시간',
      value: Math.round(durMs / 60000),
      unit: '분',
      agg: 'sum',
      chartType: 'area'
    });

    // [Q] 완전 자율 범용 수치·단위 채굴 엔진 (Universal Autonomous EAV Miner)
    // 텍스트에서 [명사/단어] [숫자] [단위] 패턴을 100% 자율 채굴하여 임의 도메인(시험, 유튜브, 마케팅, 음악 등) 즉시 수용
    var existingKeys = new Set();
    metrics.forEach(function(m){ existingKeys.add(m.key); existingKeys.add(m.label); });

        // 1-1. Table columns and rows parsing
    if(Array.isArray(rec.columns) && Array.isArray(rec.rows)){
      rec.rows.forEach(function(row){
        rec.columns.forEach(function(colName, cIdx){
          var cell = row[cIdx];
          if(cell === undefined || cell === null) return;
          var cellStr = String(cell).trim();
          var m = cellStr.match(/^([+-]?\d+(?:,\d+)*(?:\.\d+)?)\s*([가-힣a-zA-Z%$/℃°]+)?$/);
          if(m){
            var num = parseFloat(m[1].replace(/,/g, ''));
            var unit = m[2] || '';
            var cleanCol = colName.trim();
            var uMatch = cleanCol.match(/^(.*?)\s*[\(\[]([^\)\]]+)[\)\]]$/);
            if(uMatch){
              cleanCol = uMatch[1].trim();
              if(!unit) unit = uMatch[2].trim();
            }
            if(cleanCol && !existingKeys.has(cleanCol)){
              existingKeys.add(cleanCol);
              ensureMetricConfig(cleanCol, {
                title: cleanCol,
                label: cleanCol,
                unit: unit || '개',
                agg: 'sum',
                chartType: 'bar'
              });
              metrics.push({
                category: 'general',
                key: cleanCol,
                label: cleanCol,
                value: num,
                unit: unit || '개',
                agg: 'sum',
                chartType: 'bar'
              });
            }
          }
        });
      });
    }

    var genericRegex = /([가-힣a-zA-Z]{2,12})\s*[:=]?\s*([+-]?\d+(?:,\d+)*(?:\.\d+)?)\s*([가-힣a-zA-Z%$/℃°]{1,6})?/g;
    var gMatch;
    var skipWords = {
      '오늘':1, '내일':1, '어제':1, '오전':1, '오후':1, '매일':1, '주간':1, '월간':1, '연간':1,
      '목표':1, '달성':1, '완료':1, '시작':1, '종료':1, '기록':1, '세션':1, '테스트':1, '테마':1,
      '피드':1, '체크':1, '추천':1, '실천':1, '일자':1, '시간':1, '날짜':1, '하루':1, '매칭':1, '분석':1
    };

    while((gMatch = genericRegex.exec(text)) !== null){
      var rawLabel = gMatch[1].trim();
      var rawNumStr = gMatch[2].replace(/,/g, '');
      var numVal = parseFloat(rawNumStr);
      var unitStr = (gMatch[3] || '').trim();

      if(isNaN(numVal) || skipWords[rawLabel]) continue;
      if(numVal >= 1900 && numVal <= 2099 && (!unitStr || unitStr === '년')) continue;
      if(unitStr === '시' && numVal <= 24) continue;

      if(!unitStr){
        if(rawLabel.endsWith('수') || rawLabel.endsWith('량') || rawLabel.endsWith('율') || rawLabel.endsWith('금')){
          unitStr = rawLabel.endsWith('율') ? '%' : (rawLabel.endsWith('금') ? '원' : '개');
        } else {
          unitStr = '건';
        }
      }

      if(!existingKeys.has(rawLabel)){
        existingKeys.add(rawLabel);
        var isLatest = /점수|타수|혈압|체중|심박|레벨|순위|등수|평점|비율|%/i.test(rawLabel + unitStr);
        ensureMetricConfig(rawLabel, {
          title: rawLabel,
          label: rawLabel,
          unit: unitStr,
          agg: isLatest ? 'latest' : 'sum',
          chartType: isLatest ? 'line' : 'bar'
        });
        metrics.push({
          category: 'general',
          key: rawLabel,
          label: rawLabel,
          value: numVal,
          unit: unitStr,
          agg: isLatest ? 'latest' : 'sum',
          chartType: isLatest ? 'line' : 'bar'
        });
      }
    }

    return metrics;
  }

  /* ================= 2. 활성 메트릭 자율 탐색 (Auto-Discovery) ================= */
  function discoverActiveMetrics(allRecs){
    var catCounts = {};
    Object.keys(S.METRIC_CONFIGS).forEach(function(k){ catCounts[k] = 0; });

    (allRecs || []).forEach(function(r){
      var mList = extractMetricsFromRecord(r);
      mList.forEach(function(m){
        if(!S.METRIC_CONFIGS[m.category]){
          ensureMetricConfig(m.category, m);
        }
        if(catCounts[m.category] !== undefined){
          catCounts[m.category]++;
        } else {
          catCounts[m.category] = 1;
        }
      });
    });

    var discovered = [];
    // General 실천시간은 항상 포함
    discovered.push(S.METRIC_CONFIGS.general);

    // 데이터가 1건이라도 존재하는 도메인 메트릭을 동적 칩으로 노출
    var priority = ['weight', 'reading', 'sleep', 'big3', 'running', 'study', 'finance', 'sales', 'blood_pressure', 'body_fat', 'caffeine', 'golf', 'coding', 'water'];
    priority.forEach(function(cat){
      if(catCounts[cat] > 0 && S.METRIC_CONFIGS[cat]){
        discovered.push(S.METRIC_CONFIGS[cat]);
      }
    });

    // priority 외의 임의 커스텀 메트릭(테이블 컬럼, 외부 유입 데이터 등)도 동적 칩으로 노출
    Object.keys(catCounts).forEach(function(cat){
      if(catCounts[cat] > 0 && S.METRIC_CONFIGS[cat] && !discovered.some(function(d){ return d.category === cat; })){
        discovered.push(S.METRIC_CONFIGS[cat]);
      }
    });

    return {
      activeMetrics: discovered,
      counts: catCounts
    };
  }

  /* ================= 3. 다차원 시계열 집계 엔진 ================= */
  function aggregateMetricTimeSeries(allRecs, category, periodFilter){
    category = category || 'general';
    periodFilter = periodFilter || '1year';

    var cfg = S.METRIC_CONFIGS[category] || ensureMetricConfig(category);
    var now = new Date();
    var filterMonths = 12;
    if(periodFilter === '3months') filterMonths = 3;
    else if(periodFilter === '6months') filterMonths = 6;
    else if(periodFilter === 'week') filterMonths = 1;

    var cutoff = new Date(now.getFullYear(), now.getMonth() - filterMonths + 1, 1);
    if(periodFilter === 'week'){
      cutoff = new Date(now.getTime() - 7 * 86400000);
    }

    var relevantRecs = (allRecs || []).filter(function(r){
      var d = new Date(r.startAt || r.createdAt);
      return !isNaN(d.getTime()) && d >= cutoff;
    });

    // 버킷 생성 (월별 또는 일별)
    var buckets = [];
    var bucketMap = {};

    if(periodFilter === 'week'){
      // 최근 7일 일별 버킷
      for(var i = 6; i >= 0; i--){
        var bd = new Date(now.getTime() - i * 86400000);
        var bKey = S.dateKey(bd);
        var dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        var label = (bd.getMonth()+1) + '/' + bd.getDate() + '(' + dayNames[bd.getDay()] + ')';
        var bObj = { key: bKey, label: label, shortLabel: (bd.getMonth()+1)+'.'+bd.getDate(), val: 0, count: 0, extra: {} };
        buckets.push(bObj);
        bucketMap[bKey] = bObj;
      }
    } else {
      // 월별 버킷
      for(var m = filterMonths - 1; m >= 0; m--){
        var curM = new Date(now.getFullYear(), now.getMonth() - m, 1);
        var mKey = curM.getFullYear() + '-' + S.pad(curM.getMonth() + 1);
        var mLabel = (curM.getMonth() === 0 ? (String(curM.getFullYear()).slice(2) + '.') : '') + (curM.getMonth() + 1) + '월';
        var bObj = { key: mKey, label: curM.getFullYear() + '년 ' + (curM.getMonth()+1) + '월', shortLabel: mLabel, val: 0, count: 0, extra: {} };
        buckets.push(bObj);
        bucketMap[mKey] = bObj;
      }
    }

    // 기록 데이터 집계
    var totalSessions = 0;
    var maxVal = 0;
    var minVal = 999999;
    var latestVal = 0;
    var totalSum = 0;
    var extraKpi = {
      benchMax: 0, squatMax: 0, deadliftMax: 0,
      minWeight: 999, maxWeight: 0, latestWeight: 0,
      totalPaceSec: 0, paceCount: 0,
      totalProblems: 0, totalDeals: 0, totalBooks: 0
    };

    relevantRecs.forEach(function(r){
      var rDate = new Date(r.startAt || r.createdAt);
      var bKey = (periodFilter === 'week') ? S.dateKey(rDate) : (rDate.getFullYear() + '-' + S.pad(rDate.getMonth() + 1));
      var bucket = bucketMap[bKey];
      if(!bucket) return;

      var mList = extractMetricsFromRecord(r);
      var targetM = mList.find(function(m){ return m.category === category; });
      if(!targetM) return;

      bucket.count++;
      totalSessions++;

      var v = targetM.value || 0;
      if(cfg.agg === 'max'){
        if(v > bucket.val) bucket.val = v;
      } else if(cfg.agg === 'avg'){
        bucket.val = bucket.val ? Math.round(((bucket.val + v) / 2) * 10) / 10 : v;
      } else if(cfg.agg === 'latest'){
        bucket.val = v; // 마지막 값
      } else {
        bucket.val += v; // sum
      }

      if(v > maxVal) maxVal = v;
      if(v < minVal) minVal = v;
      latestVal = v;
      totalSum += v;

      // 도메인별 세부 KPI 수집
      if(category === 'big3'){
        if(targetM.bench > extraKpi.benchMax) extraKpi.benchMax = targetM.bench;
        if(targetM.squat > extraKpi.squatMax) extraKpi.squatMax = targetM.squat;
        if(targetM.deadlift > extraKpi.deadliftMax) extraKpi.deadliftMax = targetM.deadlift;
      } else if(category === 'weight'){
        if(v < extraKpi.minWeight) extraKpi.minWeight = v;
        if(v > extraKpi.maxWeight) extraKpi.maxWeight = v;
        if(!extraKpi.latestWeight) extraKpi.latestWeight = v;
      } else if(category === 'running'){
        if(targetM.paceSec){
          extraKpi.totalPaceSec += targetM.paceSec;
          extraKpi.paceCount++;
        }
      } else if(category === 'study'){
        if(targetM.problems) extraKpi.totalProblems += targetM.problems;
      } else if(category === 'sales'){
        if(targetM.deals) extraKpi.totalDeals += targetM.deals;
      } else if(category === 'reading'){
        if(targetM.books) extraKpi.totalBooks += targetM.books;
      }
    });

    if(cfg.agg === 'sum'){
      buckets.forEach(function(b){ b.val = Math.round(b.val * 10) / 10; });
    }

    // 소수점 정리
    maxVal = Math.round(maxVal * 10) / 10;
    minVal = (minVal === 999999) ? 0 : Math.round(minVal * 10) / 10;
    latestVal = Math.round(latestVal * 10) / 10;
    totalSum = Math.round(totalSum * 10) / 10;

    // 성장률 계산
    var nonZeroBuckets = buckets.filter(function(b){ return b.val > 0; });
    var growthRate = 0;
    var startVal = nonZeroBuckets[0] ? nonZeroBuckets[0].val : 0;
    var lVal = nonZeroBuckets.length ? nonZeroBuckets[nonZeroBuckets.length - 1].val : 0;
    if(startVal > 0 && lVal > 0){
      growthRate = Math.round(((lVal - startVal) / startVal) * 100);
    }

    var avgPaceStr = '-';
    if(extraKpi.paceCount > 0){
      var avgSec = Math.round(extraKpi.totalPaceSec / extraKpi.paceCount);
      avgPaceStr = Math.floor(avgSec / 60) + "'" + S.pad(avgSec % 60) + '"';
    }

    return {
      category: category,
      config: cfg,
      period: periodFilter,
      hasData: totalSessions > 0,
      totalSessions: totalSessions,
      buckets: buckets,
      maxVal: maxVal,
      minVal: minVal,
      latestVal: latestVal,
      totalSum: totalSum,
      growthRate: growthRate,
      avgPaceStr: avgPaceStr,
      extraKpi: extraKpi
    };
  }

  K.ensureMetricConfig = ensureMetricConfig;
  K.extractMetricsFromRecord = extractMetricsFromRecord;
  K.discoverActiveMetrics = discoverActiveMetrics;
  K.aggregateMetricTimeSeries = aggregateMetricTimeSeries;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
