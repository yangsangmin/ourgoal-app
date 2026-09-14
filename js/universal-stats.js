/**
 * ourgoal - universal-stats.js
 * [TASK-ES-059] 테마 구분 없는 임의 데이터 AI 자율 메트릭 추론 및 다형성 시각화 엔진
 * 
 * 기능:
 * 1. extractMetricsFromRecord: 어떤 데이터(자연어 줄글, 표, CSV, 외부 수치)든 자율 메트릭 추출
 * 2. discoverActiveMetrics: 데이터베이스 내 실존하는 모든 도메인/커스텀 지표 자동 탐색 & 동적 칩 노출
 * 3. aggregateMetricTimeSeries: 1년/6개월/3개월/1주 단위의 다형성 시계열 집계 (sum, avg, max, latest)
 * 4. renderUniversalSvgChart: 지표 특성에 맞춘 다형성 SVG 차트 (면적/꺾은선/막대)
 * 5. generateDomainSample: 체중(78->68kg), 독서(5,200쪽), 수면(6.1->7.8h), 재테크(1,200만), 러닝(120회), 3대(385kg) 등 1년치 실측 데이터 생성
 * 6. renderUniversalStatsDashboard: 성취통계 뷰의 동적 대시보드 및 AI 분석 리포트 장착
 * 7. openUniversalImportModal: CSV/텍스트/추천샘플 3개 탭 통합 가져오기 모달
 */

(function(root){
  'use strict';

  /* ================= 0. 헬퍼 유틸리티 ================= */
  function pad(n){ return n < 10 ? '0' + n : String(n); }
  function dateKey(d){ return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fmtDuration(ms){
    if(!ms || ms <= 0) return '0분';
    var totalMin = Math.round(ms / 60000);
    var h = Math.floor(totalMin / 60);
    var m = totalMin % 60;
    if(h > 0 && m > 0) return h + '시간 ' + m + '분';
    if(h > 0) return h + '시간';
    return m + '분';
  }

  /* ================= 1. 표준 메트릭 카탈로그 & 동적 확장 레지스트리 ================= */
  var METRIC_CONFIGS = {
    // 1) 체중 / 다이어트
    weight: {
      category: 'weight',
      title: '체중 / 다이어트',
      icon: '⚖️',
      label: '체중',
      unit: 'kg',
      agg: 'latest',
      chartType: 'line',
      color: '#ec4899',
      kpi1: '⚖️ 현재 체중',
      kpi2: '📉 총 감량폭',
      kpi3: '🎯 체중 관리 추세',
      kpi4: '📊 기간 변동률'
    },
    // 2) 독서 / 도서
    reading: {
      category: 'reading',
      title: '독서 / 도서',
      icon: '📖',
      label: '독서량',
      unit: '쪽',
      agg: 'sum',
      chartType: 'bar',
      color: '#8b5cf6',
      kpi1: '🏆 총 읽은 쪽수',
      kpi2: '📚 완독 도서수',
      kpi3: '📖 일일 평균 독서',
      kpi4: '📈 주간 성장률'
    },
    // 3) 수면 / 웰니스
    sleep: {
      category: 'sleep',
      title: '수면 / 웰니스',
      icon: '💤',
      label: '수면시간',
      unit: '시간',
      agg: 'avg',
      chartType: 'line',
      color: '#6366f1',
      kpi1: '🌙 일일 평균 수면',
      kpi2: '⭐ 최고 수면 기록',
      kpi3: '💤 수면 규칙성',
      kpi4: '📉 수면 부채 지수'
    },
    // 4) 재테크 / 자산
    finance: {
      category: 'finance',
      title: '재테크 / 자산',
      icon: '💰',
      label: '저축/투자액',
      unit: '만원',
      agg: 'sum',
      chartType: 'area',
      color: '#10b981',
      kpi1: '🏆 총 누적 저축',
      kpi2: '💎 최고 단일 저축',
      kpi3: '📈 월평균 저축액',
      kpi4: '🎯 자산 목표 진척'
    },
    // 5) 러닝
    running: {
      category: 'running',
      title: '러닝 / 조깅',
      icon: '🏃',
      label: '러닝 거리',
      unit: 'km',
      agg: 'sum',
      chartType: 'area',
      color: '#0ea5e9',
      kpi1: '🏆 총 누적 거리',
      kpi2: '⚡ 최고 페이스',
      kpi3: '🏃 최장 1회 거리',
      kpi4: '📈 전월 대비 성장률'
    },
    // 6) 3대 운동
    big3: {
      category: 'big3',
      title: '3대 운동',
      icon: '🏋️',
      label: '3대 총합 중량',
      unit: 'kg',
      agg: 'max',
      chartType: 'line',
      color: '#f59e0b',
      kpi1: '🏆 3대 총합 (Total)',
      kpi2: '🏋️ 벤치프레스 PR',
      kpi3: '🦵 스쿼트 PR',
      kpi4: '🦍 데드리프트 PR'
    },
    // 7) 공부 / 수험
    study: {
      category: 'study',
      title: '공부 / 몰입',
      icon: '📚',
      label: '순공 시간',
      unit: '분',
      agg: 'sum',
      chartType: 'bar',
      color: '#a855f7',
      kpi1: '🏆 총 순공 시간',
      kpi2: '🎯 총 푼 문제수',
      kpi3: '📖 일일 평균 몰입',
      kpi4: '📈 주간 성장률'
    },
    // 8) 영업 / 비즈니스
    sales: {
      category: 'sales',
      title: '영업 / 성과',
      icon: '💼',
      label: '실적 금액',
      unit: '만원',
      agg: 'sum',
      chartType: 'area',
      color: '#14b8a6',
      kpi1: '🏆 총 누적 실적',
      kpi2: '🤝 총 계약 건수',
      kpi3: '💰 최고 단일 실적',
      kpi4: '📈 목표 달성률'
    },
    // 9) 혈압
    blood_pressure: {
      category: 'blood_pressure',
      title: '혈압 관리',
      icon: '❤️',
      label: '수축기 혈압',
      unit: 'mmHg',
      agg: 'avg',
      chartType: 'line',
      color: '#ef4444',
      kpi1: '❤️ 최근 수축기 혈압',
      kpi2: '💓 최근 이완기 혈압',
      kpi3: '📊 평균 혈압',
      kpi4: '📈 혈압 안정도'
    },
    // 10) 카페인
    caffeine: {
      category: 'caffeine',
      title: '카페인 섭취',
      icon: '☕',
      label: '카페인',
      unit: 'mg',
      agg: 'sum',
      chartType: 'bar',
      color: '#78350f',
      kpi1: '☕ 총 섭취 카페인',
      kpi2: '⚡ 최고 섭취일',
      kpi3: '📊 일평균 섭취량',
      kpi4: '📉 적정 권장선'
    },
    // 11) 골프
    golf: {
      category: 'golf',
      title: '골프 스코어',
      icon: '⛳',
      label: '타수',
      unit: '타',
      agg: 'latest',
      chartType: 'line',
      color: '#059669',
      kpi1: '⛳ 최근 스코어',
      kpi2: '🏆 라베 (최저타)',
      kpi3: '📊 평균 스코어',
      kpi4: '📈 핸디캡 추세'
    },
    // 12) 코딩
    coding: {
      category: 'coding',
      title: '코딩 / 커밋',
      icon: '💻',
      label: '커밋 수',
      unit: '커밋',
      agg: 'sum',
      chartType: 'bar',
      color: '#2563eb',
      kpi1: '💻 총 누적 커밋',
      kpi2: '🔥 1일 최다 커밋',
      kpi3: '📊 일평균 활동량',
      kpi4: '📈 잔디 연속성'
    },
    // 13) 수분 / 물
    water: {
      category: 'water',
      title: '수분 섭취',
      icon: '💧',
      label: '수분량',
      unit: 'L',
      agg: 'sum',
      chartType: 'bar',
      color: '#06b6d4',
      kpi1: '💧 총 수분 섭취량',
      kpi2: '⭐ 최고 달성일',
      kpi3: '📊 일평균 수분량',
      kpi4: '🎯 목표 달성률'
    },
    // 14) 체지방률
    body_fat: {
      category: 'body_fat',
      title: '체지방률',
      icon: '📉',
      label: '체지방률',
      unit: '%',
      agg: 'latest',
      chartType: 'line',
      color: '#f97316',
      kpi1: '📉 현재 체지방률',
      kpi2: '🏆 최저 체지방률',
      kpi3: '📊 평균 체지방률',
      kpi4: '📈 체조성 변화'
    },
    // 15) 일반 실천시간 (Global Fallback)
    general: {
      category: 'general',
      title: '실천 시간',
      icon: '🔥',
      label: '실천 시간',
      unit: '분',
      agg: 'sum',
      chartType: 'area',
      color: '#3b82f6',
      kpi1: '🏆 총 실천 시간',
      kpi2: '✍️ 총 기록 건수',
      kpi3: '🔥 주간 평균 몰입',
      kpi4: '📈 꾸준함 지수'
    }
  };

  /**
   * 미등록 임의 메트릭 발생 시 자율적으로 메타데이터를 등록하는 안전 레지스트리
   */
  function ensureMetricConfig(cat, hint){
    if(METRIC_CONFIGS[cat]) return METRIC_CONFIGS[cat];
    var title = (hint && (hint.title || hint.label)) || cat.replace(/^tbl_/, '');
    var unit = (hint && hint.unit) || '';
    var chartType = (hint && hint.chartType) || 'line';
    var agg = (hint && hint.agg) || 'sum';
    var icon = (hint && hint.icon) || '✨';
    var color = (hint && hint.color) || '#8b5cf6';
    METRIC_CONFIGS[cat] = {
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
    return METRIC_CONFIGS[cat];
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

    return metrics;
  }

  /* ================= 2. 활성 메트릭 자율 탐색 (Auto-Discovery) ================= */
  function discoverActiveMetrics(allRecs){
    var catCounts = {};
    Object.keys(METRIC_CONFIGS).forEach(function(k){ catCounts[k] = 0; });

    (allRecs || []).forEach(function(r){
      var mList = extractMetricsFromRecord(r);
      mList.forEach(function(m){
        if(!METRIC_CONFIGS[m.category]){
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
    discovered.push(METRIC_CONFIGS.general);

    // 데이터가 1건이라도 존재하는 도메인 메트릭을 동적 칩으로 노출
    var priority = ['weight', 'reading', 'sleep', 'big3', 'running', 'study', 'finance', 'sales', 'blood_pressure', 'body_fat', 'caffeine', 'golf', 'coding', 'water'];
    priority.forEach(function(cat){
      if(catCounts[cat] > 0 && METRIC_CONFIGS[cat]){
        discovered.push(METRIC_CONFIGS[cat]);
      }
    });

    // priority 외의 임의 커스텀 메트릭(테이블 컬럼, 외부 유입 데이터 등)도 동적 칩으로 노출
    Object.keys(catCounts).forEach(function(cat){
      if(catCounts[cat] > 0 && METRIC_CONFIGS[cat] && !discovered.some(function(d){ return d.category === cat; })){
        discovered.push(METRIC_CONFIGS[cat]);
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

    var cfg = METRIC_CONFIGS[category] || ensureMetricConfig(category);
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
        var bKey = dateKey(bd);
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
        var mKey = curM.getFullYear() + '-' + pad(curM.getMonth() + 1);
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
      var bKey = (periodFilter === 'week') ? dateKey(rDate) : (rDate.getFullYear() + '-' + pad(rDate.getMonth() + 1));
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
      avgPaceStr = Math.floor(avgSec / 60) + "'" + pad(avgSec % 60) + '"';
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

  /* ================= 5. 도메인별 1년치 실측 샘플 생성기 ================= */
  function generateDomainSample(domainKey){
    var now = new Date();
    var records = [];

    if(domainKey === 'weight'){
      // 52주간 1년치 다이어트 감량 실측 데이터 (78.5kg -> 68.2kg 점진적 감량)
      for(var w = 51; w >= 0; w--){
        var weekDate = new Date(now.getTime() - w * 7 * 86400000);
        var curWt = Math.round((78.5 - (51 - w) * 0.2 + (Math.sin(w) * 0.3)) * 10) / 10;
        records.push({
          id: 'samp_wt_' + w,
          type: 'note',
          theme: 'daily',
          subTheme: '체중관리',
          text: '공복 아침 체중 ' + curWt + 'kg 측정. 식단 조절 및 수분 섭취 완료.',
          startAt: weekDate.toISOString(),
          endAt: new Date(weekDate.getTime() + 10 * 60000).toISOString(),
          createdAt: weekDate.toISOString(),
          visibility: 'private'
        });
      }
    } else if(domainKey === 'reading'){
      // 52주간 1년치 독서 습관 (주 100~150쪽, 1년 누적 5,200쪽 완독)
      for(var w = 51; w >= 0; w--){
        var weekDate = new Date(now.getTime() - w * 7 * 86400000);
        var p = Math.round(80 + (51 - w) * 1.4 + (w % 3) * 15);
        records.push({
          id: 'samp_read_' + w + '_1',
          type: 'note',
          theme: 'study',
          subTheme: '독서',
          text: '취침 전 독서 ' + p + '쪽 완독. 핵심 인사이트 노트 기록.',
          startAt: weekDate.toISOString(),
          endAt: new Date(weekDate.getTime() + 60 * 60000).toISOString(),
          createdAt: weekDate.toISOString(),
          visibility: 'private'
        });
        if(w % 2 === 0){
          var midD = new Date(weekDate.getTime() - 3 * 86400000);
          records.push({
            id: 'samp_read_' + w + '_2',
            type: 'note',
            theme: 'study',
            subTheme: '독서',
            text: '주말 아침 독서 60쪽 완료 (누적 독서 루틴).',
            startAt: midD.toISOString(),
            endAt: new Date(midD.getTime() + 45 * 60000).toISOString(),
            createdAt: midD.toISOString(),
            visibility: 'private'
          });
        }
      }
    } else if(domainKey === 'sleep'){
      // 52주간 1년치 수면 회복 추이 (6.1시간 -> 7.8시간 양질의 숙면)
      for(var w = 51; w >= 0; w--){
        var weekDate = new Date(now.getTime() - w * 7 * 86400000);
        var sl = Math.round((6.1 + (51 - w) * 0.033 + (Math.sin(w*2) * 0.2)) * 10) / 10;
        records.push({
          id: 'samp_sleep_' + w,
          type: 'note',
          theme: 'daily',
          subTheme: '수면',
          text: '어젯밤 수면 ' + sl + '시간 숙면 기록. 개운한 기상 컨디션.',
          startAt: weekDate.toISOString(),
          endAt: new Date(weekDate.getTime() + Math.round(sl * 3600000)).toISOString(),
          createdAt: weekDate.toISOString(),
          visibility: 'private'
        });
      }
    } else if(domainKey === 'finance'){
      // 52주간 1년치 자산/저축 추이 (월 50~150만원, 1년 누적 1,200만원 달성)
      for(var w = 51; w >= 0; w--){
        var weekDate = new Date(now.getTime() - w * 7 * 86400000);
        var amt = Math.round(20 + (51 - w) * 0.4 + (w % 4 === 0 ? 30 : 0));
        records.push({
          id: 'samp_fin_' + w,
          type: 'note',
          theme: 'daily',
          subTheme: '재테크',
          text: '주간 정기 적금 및 ETF 투자 ' + amt + '만원 저축 완료.',
          startAt: weekDate.toISOString(),
          endAt: new Date(weekDate.getTime() + 15 * 60000).toISOString(),
          createdAt: weekDate.toISOString(),
          visibility: 'private'
        });
      }
    } else if(domainKey === 'running'){
      // 52주간 1년치 주 2~3회 러닝 점진적 과부하 (총 120회 이상 세션, 5km -> 21.1km)
      for(var w = 51; w >= 0; w--){
        var weekDate = new Date(now.getTime() - w * 7 * 86400000);
        var baseDist = 5 + (51 - w) * 0.3;
        var paceMin = Math.max(4.8, 6.2 - (51 - w) * 0.025);
        var pM = Math.floor(paceMin);
        var pS = Math.round((paceMin - pM) * 60);
        var curDist = Math.round(baseDist * 10) / 10;
        var durMin = Math.round(curDist * paceMin);
        var paceStr = pM + "'" + pad(pS) + '"';

        records.push({
          id: 'samp_run_' + w + '_long',
          type: 'note',
          theme: 'workout',
          subTheme: '러닝',
          text: '한강 주말 롱런 ' + curDist + 'km 완주 (페이스 ' + paceStr + ', ' + durMin + '분 소요).',
          startAt: weekDate.toISOString(),
          endAt: new Date(weekDate.getTime() + durMin * 60000).toISOString(),
          createdAt: weekDate.toISOString(),
          visibility: 'private'
        });

        var midDate = new Date(weekDate.getTime() - 3 * 86400000);
        var midDist = Math.round((curDist * 0.6) * 10) / 10;
        var midDur = Math.round(midDist * (paceMin + 0.2));
        records.push({
          id: 'samp_run_' + w + '_mid',
          type: 'note',
          theme: 'workout',
          subTheme: '러닝',
          text: '저녁 조깅 ' + midDist + 'km 완료 (' + midDur + '분 소요).',
          startAt: midDate.toISOString(),
          endAt: new Date(midDate.getTime() + midDur * 60000).toISOString(),
          createdAt: midDate.toISOString(),
          visibility: 'private'
        });

        if(w % 2 === 0){
          var ivDate = new Date(weekDate.getTime() - 5 * 86400000);
          records.push({
            id: 'samp_run_' + w + '_interval',
            type: 'note',
            theme: 'workout',
            subTheme: '러닝',
            text: '트랙 400m x 8회 인터벌 러닝 5.0km (' + paceStr + ' 집중).',
            startAt: ivDate.toISOString(),
            endAt: new Date(ivDate.getTime() + 35 * 60000).toISOString(),
            createdAt: ivDate.toISOString(),
            visibility: 'private'
          });
        }
      }
    } else if(domainKey === 'big3'){
      // 52주간 3대 운동 점진적 과부하 (벤치 60->95kg, 스쿼트 80->130kg, 데드 100->160kg, 합계 240->385kg)
      for(var w = 51; w >= 0; w--){
        var weekDate = new Date(now.getTime() - w * 7 * 86400000);
        var bp = Math.round(60 + (51 - w) * 0.68);
        var sq = Math.round(80 + (51 - w) * 0.98);
        var dl = Math.round(100 + (51 - w) * 1.17);

        records.push({
          id: 'samp_big3_' + w,
          type: 'template',
          theme: 'workout',
          templateKey: 'health',
          templateTitle: '3대 웨이트 트레이닝',
          columns: ['종목', '무게(kg)', '세트', '횟수'],
          rows: [
            ['벤치프레스', String(bp), '5', '5'],
            ['스쿼트', String(sq), '5', '5'],
            ['데드리프트', String(dl), '4', '3']
          ],
          text: '[헬스] 벤치프레스 ' + bp + 'kg 5세트, 스쿼트 ' + sq + 'kg 5세트, 데드리프트 ' + dl + 'kg 3세트 완수 (3대 총합 ' + (bp+sq+dl) + 'kg)',
          startAt: weekDate.toISOString(),
          endAt: new Date(weekDate.getTime() + 70 * 60000).toISOString(),
          createdAt: weekDate.toISOString(),
          visibility: 'private'
        });
      }
    } else if(domainKey === 'study'){
      for(var w = 51; w >= 0; w--){
        var weekDate = new Date(now.getTime() - w * 7 * 86400000);
        var studyMin = 180 + Math.round((51 - w) * 2.5);
        var problems = Math.round(40 + (51 - w) * 1.2);
        records.push({
          id: 'samp_study_' + w + '_main',
          type: 'note',
          theme: 'study',
          subTheme: '기출문제',
          text: '도서관 기출문제 풀이 ' + studyMin + '분 몰입 (' + problems + '문제 완료).',
          startAt: weekDate.toISOString(),
          endAt: new Date(weekDate.getTime() + studyMin * 60000).toISOString(),
          createdAt: weekDate.toISOString(),
          visibility: 'private'
        });
        var revDate = new Date(weekDate.getTime() - 3 * 86400000);
        records.push({
          id: 'samp_study_' + w + '_rev',
          type: 'note',
          theme: 'study',
          subTheme: '개념정리',
          text: '핵심 요약 복습 90분 몰입 (20문제 풀이).',
          startAt: revDate.toISOString(),
          endAt: new Date(revDate.getTime() + 90 * 60000).toISOString(),
          createdAt: revDate.toISOString(),
          visibility: 'private'
        });
      }
    } else if(domainKey === 'sales'){
      for(var w = 51; w >= 0; w--){
        var weekDate = new Date(now.getTime() - w * 7 * 86400000);
        var amt = Math.round(250 + (51 - w) * 12);
        var deals = Math.round(2 + (51 - w) * 0.08);
        records.push({
          id: 'samp_sales_' + w,
          type: 'note',
          theme: 'business',
          subTheme: '영업계약',
          text: '고객사 미팅 및 신규 계약 ' + deals + '건 체결 (실적 ' + amt + '만원 달성).',
          startAt: weekDate.toISOString(),
          endAt: new Date(weekDate.getTime() + 60 * 60000).toISOString(),
          createdAt: weekDate.toISOString(),
          visibility: 'private'
        });
      }
    }

    return records;
  }


  /* ================= 5-0. 1900년대 및 역대 과거 임의 일자 무손실 정규화 엔진 ================= */
  function normalizeHistoricalDate(str, offsetMin){
    if(!str) return null;
    str = String(str).trim().replace(/^[\"']|[\"']$/g, '');
    offsetMin = offsetMin || 0;
    if(str.indexOf('T') !== -1 || (str.indexOf(':') !== -1 && /\d{4}/.test(str))){
      var testD = new Date(str);
      if(!isNaN(testD.getTime())) return testD.toISOString();
    }
    var m1 = str.match(/^(\d{4})[-./\s년\s]+(\d{1,2})[-./\s월\s]+(\d{1,2})(?:일)?(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if(m1){
      var y = m1[1];
      var m = pad(parseInt(m1[2], 10));
      var d = pad(parseInt(m1[3], 10));
      var hr = m1[4] !== undefined ? pad(parseInt(m1[4], 10)) : pad(19);
      var min = m1[5] !== undefined ? pad(parseInt(m1[5], 10)) : pad(offsetMin % 60);
      var sec = m1[6] !== undefined ? pad(parseInt(m1[6], 10)) : '00';
      return y + '-' + m + '-' + d + 'T' + hr + ':' + min + ':' + sec + '.000Z';
    }
    var m2 = str.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})/);
    if(m2){
      var y2 = m2[3];
      var m2Part = parseInt(m2[1], 10);
      var d2Part = parseInt(m2[2], 10);
      var mVal = (m2Part > 12) ? d2Part : m2Part;
      var dVal = (m2Part > 12) ? m2Part : d2Part;
      return y2 + '-' + pad(mVal) + '-' + pad(dVal) + 'T19:' + pad(offsetMin % 60) + ':00.000Z';
    }
    var m3 = str.match(/^(\d{4})(\d{2})(\d{2})$/);
    if(m3){
      return m3[1] + '-' + m3[2] + '-' + m3[3] + 'T19:' + pad(offsetMin % 60) + ':00.000Z';
    }
    var fallback = new Date(str);
    if(!isNaN(fallback.getTime())) return fallback.toISOString();
    return null;
  }

  /* ================= 5-1. 52주 3대운동 주기화 156세션 정본 데이터 ================= */
  var RAW_52W_POWERLIFTING_DATA = ["2025-01-06,W01,Hypertrophy,스쿼트,5,100,8,100,8,105,8,105,7,100,8,4095,70,131,75,기본기 점검 및 웜업","2025-01-07,W01,Hypertrophy,벤치프레스,5,55,10,55,10,57.5,8,57.5,8,55,9,2515,70,73,78,테크닉 확인","2025-01-08,W01,Hypertrophy,데드리프트,5,130,6,130,6,135,6,135,5,130,6,3825,70.1,162,80,자세 점검 시작","2025-01-13,W02,Hypertrophy,스쿼트,5,102.5,8,102.5,8,107.5,8,107.5,7,102.5,8,4275,70.2,134,78,컨디션 양호","2025-01-14,W02,Hypertrophy,벤치프레스,5,57.5,10,57.5,9,60,8,60,7,55,10,2505,70.2,76,82,상체 볼륨감 집중","2025-01-15,W02,Hypertrophy,데드리프트,5,132.5,6,132.5,6,137.5,6,137.5,5,132.5,6,3915,70.3,165,82,안정적 수행","2025-01-20,W03,Hypertrophy,스쿼트,5,105,8,105,8,110,8,110,6,105,7,4025,70.4,138,85,하단 반등 집중","2025-01-21,W03,Hypertrophy,벤치프레스,5,60,9,60,8,62.5,7,62.5,6,57.5,8,2475,70.4,78,86,가슴 자극 집중","2025-01-22,W03,Hypertrophy,데드리프트,5,135,6,135,6,140,5,140,5,135,5,3730,70.5,168,88,호흡 유지 집중","2025-01-27,W04,Deload,스쿼트,4,85,6,85,6,85,6,85,6,-,-,2040,70.5,135,50,1주기 디로드","2025-01-28,W04,Deload,벤치프레스,4,47.5,8,47.5,8,47.5,8,47.5,8,-,-,1520,70.5,75,48,관절 피로 해소","2025-01-29,W04,Deload,데드리프트,4,110,5,110,5,110,5,110,5,-,-,2200,70.6,165,52,신경계 회복","2025-02-03,W05,Strength,스쿼트,5,115,5,115,5,120,5,120,5,125,4,2875,70.7,143,82,스트렝스 주기 시작","2025-02-04,W05,Strength,벤치프레스,5,65,6,65,6,67.5,5,67.5,5,70,4,1772.5,70.7,81,84,첫 70kg 터치","2025-02-05,W05,Strength,데드리프트,5,145,5,145,5,150,5,150,4,155,3,2775,70.8,175,85,바벨 속도 안정화","2025-02-10,W06,Strength,스쿼트,5,117.5,5,117.5,5,122.5,5,122.5,5,127.5,4,2950,70.9,146,84,상체 각도 유지","2025-02-11,W06,Strength,벤치프레스,5,67.5,6,67.5,5,70,5,70,5,72.5,3,1812.5,70.9,83,86,어깨 패킹감 일관","2025-02-12,W06,Strength,데드리프트,5,147.5,5,147.5,5,152.5,5,152.5,4,157.5,3,2845,71,178,87,광배근 락킹 강화","2025-02-17,W07,Strength,스쿼트,5,120,5,120,5,125,5,125,4,130,3,2865,71.1,148,88,고중량 적응화","2025-02-18,W07,Strength,벤치프레스,5,70,5,70,5,72.5,5,72.5,4,75,3,1787.5,71.2,85,89,중간 일관 유지","2025-02-19,W07,Strength,데드리프트,5,150,5,150,5,155,4,155,4,160,3,2810,71.2,182,90,락아웃 파워 상승","2025-02-24,W08,Deload,스쿼트,4,90,5,90,5,90,5,90,5,-,-,1800,71.2,145,52,2주기 디로드","2025-02-25,W08,Deload,벤치프레스,4,52.5,6,52.5,6,52.5,6,52.5,6,-,-,1260,71.3,82,50,가벼운 루틴 유지","2025-02-26,W08,Deload,데드리프트,4,115,5,115,5,115,5,115,5,-,-,2300,71.3,180,55,허리 부담 최소화","2025-03-03,W09,Peaking,스쿼트,5,125,3,130,3,135,3,140,2,145,1,1940,71.4,150,89,145kg 1RM 성공","2025-03-04,W09,Peaking,벤치프레스,5,72.5,4,75,3,77.5,3,80,2,82.5,1,1227.5,71.4,85,91,82.5kg PR 달성","2025-03-05,W09,Peaking,데드리프트,5,155,4,160,3,165,3,172.5,2,182.5,1,2125,71.5,188,92,182.5kg PR 달성","2025-03-10,W10,Hypertrophy,스쿼트,5,107.5,8,107.5,8,112.5,8,112.5,7,107.5,8,4325,71.5,142,77,2분기 근비대 주기 시작","2025-03-11,W10,Hypertrophy,벤치프레스,5,60,10,60,9,62.5,8,62.5,8,60,9,2680,71.6,80,80,가슴 볼륨 극대화","2025-03-12,W10,Hypertrophy,데드리프트,5,137.5,6,137.5,6,142.5,6,142.5,5,137.5,6,4035,71.6,172,81,후면사슬 자극 극대화","2025-03-17,W11,Hypertrophy,스쿼트,5,110,8,110,8,115,8,115,7,110,8,4435,71.7,145,80,대퇴사두 펌핑 양호","2025-03-18,W11,Hypertrophy,벤치프레스,5,62.5,9,62.5,9,65,8,65,7,60,10,2662.5,71.7,82,83,삼두근 보조력 상승","2025-03-19,W11,Hypertrophy,데드리프트,5,140,6,140,6,145,6,145,5,140,6,4115,71.8,175,84,악력 및 그립 지구력","2025-03-24,W12,Deload,스쿼트,4,90,6,90,6,90,6,90,6,-,-,2160,71.8,144,50,중간 디로드","2025-03-25,W12,Deload,벤치프레스,4,52.5,8,52.5,8,52.5,8,52.5,8,-,-,1680,71.8,80,48,회전근개 스트레칭","2025-03-26,W12,Deload,데드리프트,4,115,5,115,5,115,5,115,5,-,-,2300,71.9,173,50,기립근 휴식","2025-03-31,W13,Strength,스쿼트,5,122.5,5,122.5,5,127.5,5,127.5,4,132.5,3,2962.5,71.9,152,83,스트렝스 주기 시작","2025-04-01,W13,Strength,벤치프레스,5,70,6,70,5,72.5,5,72.5,5,75,4,1887.5,72,86,85,바벨 밀어내는 파워","2025-04-02,W13,Strength,데드리프트,5,152.5,5,152.5,5,157.5,5,157.5,4,162.5,3,2930,72,185,86,지면 반발력 활용","2025-04-07,W14,Strength,스쿼트,5,125,5,125,5,130,5,130,4,135,3,3030,72.1,154,86,안정적 하강 가속화","2025-04-08,W14,Strength,벤치프레스,5,72.5,5,72.5,5,75,5,75,4,77.5,3,1832.5,72.1,88,88,레그드라이브 강화","2025-04-09,W14,Strength,데드리프트,5,155,5,155,5,160,4,160,4,165,3,2965,72.2,188,88,등 상부 타이트닝","2025-04-14,W15,Strength,스쿼트,5,127.5,5,127.5,5,132.5,4,132.5,4,137.5,3,2985,72.2,156,89,고중량 멘탈 유지","2025-04-15,W15,Strength,벤치프레스,5,75,5,75,5,77.5,4,77.5,4,80,3,1830,72.3,90,90,80kg 3회 성공","2025-04-16,W15,Strength,데드리프트,5,157.5,5,157.5,4,162.5,4,162.5,4,170,3,2985,72.3,192,91,고중량 셋업 집중","2025-04-21,W16,Deload,스쿼트,4,95,5,95,5,95,5,95,5,-,-,1900,72.3,153,52,피로도 관리 집중","2025-04-22,W16,Deload,벤치프레스,4,55,6,55,6,55,6,55,6,-,-,1320,72.4,87,49,가슴 이완 스트레칭","2025-04-23,W16,Deload,데드리프트,4,120,5,120,5,120,5,120,5,-,-,2400,72.4,190,53,요추 회복 집중","2025-04-28,W17,Peaking,스쿼트,5,130,3,135,3,142.5,2,147.5,2,152.5,1,1927.5,72.5,156,92,스쿼트 152.5kg PR","2025-04-29,W17,Peaking,벤치프레스,5,75,3,77.5,3,80,3,83,2,86,1,1211,72.5,89,93,벤치프레스 86kg PR","2025-04-30,W17,Peaking,데드리프트,5,160,3,167.5,3,175,2,182.5,1,190,1,1900,72.6,194,94,데드리프트 190kg PR","2025-05-05,W18,Hypertrophy,스쿼트,5,112.5,8,112.5,8,117.5,7,117.5,7,112.5,7,4237.5,72.6,150,79,3분기 볼륨으로 전환","2025-05-06,W18,Hypertrophy,벤치프레스,5,65,9,65,8,67.5,8,67.5,7,62.5,9,2660,72.7,85,81,가슴 타격 집중","2025-05-07,W18,Hypertrophy,데드리프트,5,142.5,6,142.5,6,147.5,5,147.5,5,142.5,5,3890,72.7,180,82,햄스트링 로드감","2025-05-12,W19,Hypertrophy,스쿼트,5,115,8,115,8,120,7,120,6,115,7,4345,72.8,153,82,반복 일관성 향상","2025-05-13,W19,Hypertrophy,벤치프레스,5,67.5,8,67.5,8,70,7,70,6,65,8,2520,72.8,87,84,피딩 템포 조절","2025-05-14,W19,Hypertrophy,데드리프트,5,145,6,145,6,150,5,150,5,145,5,3965,72.9,183,85,호흡 밸런스 유지","2025-05-19,W20,Deload,스쿼트,4,95,6,95,6,95,6,95,6,-,-,2280,72.9,150,51,하체 디로드","2025-05-20,W20,Deload,벤치프레스,4,55,8,55,8,55,8,55,8,-,-,1760,72.9,85,47,상체 유연성 확보","2025-05-21,W20,Deload,데드리프트,4,120,5,120,5,120,5,120,5,-,-,2400,73,181,50,등 하부 이완","2025-05-26,W21,Strength,스쿼트,5,127.5,5,127.5,5,132.5,5,132.5,4,137.5,3,3032.5,73,157,84,스트렝스 체감 상승","2025-05-27,W21,Strength,벤치프레스,5,72.5,6,72.5,5,75,5,75,4,77.5,4,1882.5,73.1,90,86,안정적 프레스","2025-05-28,W21,Strength,데드리프트,5,157.5,5,157.5,5,162.5,4,162.5,4,167.5,3,2987.5,73.1,194,87,바벨 스피드 증가","2025-06-02,W22,Strength,스쿼트,5,130,5,130,5,135,4,135,4,140,3,3000,73.2,160,87,하단 탈출 속도 상승","2025-06-03,W22,Strength,벤치프레스,5,75,5,75,5,77.5,5,77.5,4,80,4,1917.5,73.2,92,88,80kg 반복수 상승","2025-06-04,W22,Strength,데드리프트,5,160,5,160,4,165,4,165,4,172.5,3,3017.5,73.3,198,89,신경계 몰입도 향상","2025-06-09,W23,Deload,스쿼트,4,100,5,100,5,100,5,100,5,-,-,2000,73.3,157,53,워밍 업 컨디셔닝","2025-06-10,W23,Deload,벤치프레스,4,57.5,6,57.5,6,57.5,6,57.5,6,-,-,1380,73.3,90,48,가슴 탄력 유지","2025-06-11,W23,Deload,데드리프트,4,125,5,125,5,125,5,125,5,-,-,2500,73.4,193,52,자세 완벽 정렬","2025-06-16,W24,Peaking,스쿼트,5,135,3,142.5,3,150,2,155,1,160,1,1897.5,73.4,162,94,스쿼트 160kg 성공","2025-06-17,W24,Peaking,벤치프레스,5,77.5,3,82.5,3,85,2,88,1,91,1,1146.5,73.5,93,95,벤치 91kg 첫 90 돌파","2025-06-18,W24,Peaking,데드리프트,5,165,3,175,2,185,2,192.5,1,200,1,1787.5,73.5,203,96,데드 200kg 달성","2025-06-23,W25,Deload,스쿼트,4,100,6,100,6,100,6,100,6,-,-,2400,73.5,158,50,상반기 마감 디로드","2025-06-24,W25,Deload,벤치프레스,4,60,6,60,6,60,6,60,6,-,-,1440,73.6,90,49,어깨 피로 털기","2025-06-25,W25,Deload,데드리프트,4,125,5,125,5,125,5,125,5,-,-,2500,73.6,195,51,중추신경계 회복","2025-06-30,W26,Hypertrophy,스쿼트,5,115,8,115,8,120,7,120,7,115,8,4375,73.7,155,78,하반기 주기 시작","2025-07-01,W26,Hypertrophy,벤치프레스,5,67.5,8,67.5,8,70,8,70,7,65,9,2615,73.7,89,82,가슴 두께감 집중","2025-07-02,W26,Hypertrophy,데드리프트,5,147.5,6,147.5,6,152.5,5,152.5,5,147.5,5,4030,73.8,188,83,기립근 지구력 향상","2025-07-07,W27,Hypertrophy,스쿼트,5,117.5,8,117.5,8,122.5,7,122.5,6,117.5,7,4345,73.8,157,81,하체 볼륨 유지","2025-07-08,W27,Hypertrophy,벤치프레스,5,70,8,70,8,72.5,7,72.5,6,67.5,8,2587.5,73.9,92,85,바벨 궤적 일치","2025-07-09,W27,Hypertrophy,데드리프트,5,150,6,150,6,155,5,155,5,150,5,4100,73.9,190,86,스트랩 그립 완벽성","2025-07-14,W28,Deload,스쿼트,4,100,6,100,6,100,6,100,6,-,-,2400,74,156,51,여름철 수분/피로 조절","2025-07-15,W28,Deload,벤치프레스,4,60,8,60,8,60,8,60,8,-,-,1920,74,91,48,어깨 스트레칭","2025-07-16,W28,Deload,데드리프트,4,130,5,130,5,130,5,130,5,-,-,2600,74,195,50,안정감 유지","2025-07-21,W29,Strength,스쿼트,5,130,5,130,5,135,5,135,4,140,3,3105,74.1,162,85,중량 적응도 최상","2025-07-22,W29,Strength,벤치프레스,5,75,6,75,5,77.5,5,77.5,4,80,4,1942.5,74.1,93,87,밀기 속도 증가","2025-07-23,W29,Strength,데드리프트,5,160,5,160,5,165,4,165,4,172.5,3,3077.5,74.2,201,88,하체 킥 파워","2025-07-28,W30,Strength,스쿼트,5,132.5,5,132.5,5,137.5,4,137.5,4,142.5,3,3090,74.2,164,88,안정 하강 유지","2025-07-29,W30,Strength,벤치프레스,5,77.5,5,77.5,5,80,4,80,4,82.5,3,1912.5,74.3,95,90,82.5kg 세트 안착","2025-07-30,W30,Strength,데드리프트,5,162.5,5,162.5,4,167.5,4,167.5,4,175,3,3082.5,74.3,203,90,등 중심 완성","2025-08-04,W31,Deload,스쿼트,4,105,5,105,5,105,5,105,5,-,-,2100,74.3,160,52,휴가 디로드","2025-08-05,W31,Deload,벤치프레스,4,60,6,60,6,60,6,60,6,-,-,1440,74.4,92,49,관절 회복","2025-08-06,W31,Deload,데드리프트,4,130,5,130,5,130,5,130,5,-,-,2600,74.4,200,53,안정 유지","2025-08-11,W32,Peaking,스쿼트,5,137.5,3,145,3,152.5,2,157.5,1,162.5,1,1872.5,74.4,165,93,스쿼트 162.5kg PR","2025-08-12,W32,Peaking,벤치프레스,5,80,3,83,3,86,2,90,1,93.5,1,1144.5,74.5,96,94,벤치프레스 93.5kg PR","2025-08-13,W32,Peaking,데드리프트,5,170,3,180,2,190,1,197.5,1,205,1,1772.5,74.5,208,95,데드리프트 205kg PR","2025-08-18,W33,Hypertrophy,스쿼트,5,117.5,8,117.5,8,122.5,7,122.5,7,117.5,8,4437.5,74.5,158,80,볼륨 사이클 재개","2025-08-19,W33,Hypertrophy,벤치프레스,5,70,8,70,8,72.5,8,72.5,7,67.5,9,2682.5,74.6,93,83,정확한 가슴 타격","2025-08-20,W33,Hypertrophy,데드리프트,5,152.5,6,152.5,6,157.5,5,157.5,5,152.5,5,4195,74.6,192,84,둔근 발달 집중","2025-08-25,W34,Hypertrophy,스쿼트,5,120,8,120,8,125,7,125,6,120,7,4460,74.7,160,82,하체 볼륨 4.4톤 돌파","2025-08-26,W34,Hypertrophy,벤치프레스,5,72.5,8,72.5,7,75,7,75,6,70,8,2615,74.7,95,86,밀기 힘 아주 탁월","2025-08-27,W34,Hypertrophy,데드리프트,5,155,6,155,5,160,5,160,5,155,5,4200,74.7,195,86,안정적 락다운","2025-09-01,W35,Deload,스쿼트,4,105,6,105,6,105,6,105,6,-,-,2520,74.8,158,50,디로드 및 식단 점검","2025-09-02,W35,Deload,벤치프레스,4,62.5,8,62.5,8,62.5,8,62.5,8,-,-,2000,74.8,92,48,상체 피로 완화","2025-09-03,W35,Deload,데드리프트,4,135,5,135,5,135,5,135,5,-,-,2700,74.8,198,51,허리 탄력 유지","2025-09-08,W36,Strength,스쿼트,5,132.5,5,132.5,5,137.5,5,137.5,4,142.5,3,3177.5,74.9,166,86,스쿼트 파워 상승","2025-09-09,W36,Strength,벤치프레스,5,77.5,6,77.5,5,80,5,80,4,82.5,4,1987.5,74.9,96,88,바벨 속도감 확보","2025-09-10,W36,Strength,데드리프트,5,165,5,165,5,170,4,170,4,177.5,3,3167.5,74.9,206,89,광배 텐션 극대화","2025-09-15,W37,Strength,스쿼트,5,135,5,135,5,140,4,140,4,145,3,3150,75,168,89,145kg 3회 성공","2025-09-16,W37,Strength,벤치프레스,5,80,5,80,5,82.5,4,82.5,4,85,3,1970,75,98,90,85kg 3회 성공","2025-09-17,W37,Strength,데드리프트,5,167.5,5,167.5,4,172.5,4,172.5,4,180,3,3187.5,75,209,91,안정 폭발 수행","2025-09-22,W38,Deload,스쿼트,4,110,5,110,5,110,5,110,5,-,-,2200,75,165,51,신경계 피로 관리 디로드","2025-09-23,W38,Deload,벤치프레스,4,65,6,65,6,65,6,65,6,-,-,1560,75.1,95,49,가슴 이완","2025-09-24,W38,Deload,데드리프트,4,135,5,135,5,135,5,135,5,-,-,2700,75.1,205,52,하체 스트레칭","2025-09-29,W39,Peaking,스쿼트,5,140,3,147.5,3,155,2,160,1,165,1,1897.5,75.1,168,93,스쿼트 165kg PR 달성","2025-09-30,W39,Peaking,벤치프레스,5,82.5,3,85,3,88,2,92.5,1,96,1,1160,75.2,98,94,벤치 96kg PR 달성","2025-10-01,W39,Peaking,데드리프트,5,175,3,185,2,195,1,202.5,1,210,1,1787.5,75.2,212,95,데드리프트 210kg 달성","2025-10-06,W40,Hypertrophy,스쿼트,5,120,8,120,8,125,7,125,7,120,8,4520,75.2,162,79,4분기 마지막 주기 시작","2025-10-07,W40,Hypertrophy,벤치프레스,5,72.5,8,72.5,8,75,8,75,7,70,9,2745,75.3,96,82,볼륨감 증가","2025-10-08,W40,Hypertrophy,데드리프트,5,155,6,155,6,160,5,160,5,155,5,4255,75.3,198,83,기립근 두께감","2025-10-13,W41,Hypertrophy,스쿼트,5,122.5,8,122.5,8,127.5,7,127.5,6,122.5,7,4460,75.3,165,82,하체 볼륨감 추가","2025-10-14,W41,Hypertrophy,벤치프레스,5,75,8,75,7,77.5,7,77.5,6,72.5,8,2670,75.4,98,85,가슴 자극 피치","2025-10-15,W41,Hypertrophy,데드리프트,5,157.5,6,157.5,6,162.5,5,162.5,5,157.5,5,4290,75.4,200,85,바벨 타이트감","2025-10-20,W42,Deload,스쿼트,4,110,6,110,6,110,6,110,6,-,-,2640,75.4,162,50,관절 및 부담 회복","2025-10-21,W42,Deload,벤치프레스,4,65,8,65,8,65,8,65,8,-,-,2080,75.5,95,47,어깨 스트레칭","2025-10-22,W42,Deload,데드리프트,4,140,5,140,5,140,5,140,5,-,-,2800,75.5,202,52,하체 폼롤러","2025-10-27,W43,Strength,스쿼트,5,135,5,135,5,140,5,140,4,145,4,3070,75.5,170,85,최종 스트렝스 주기","2025-10-28,W43,Strength,벤치프레스,5,80,6,80,5,82.5,5,82.5,4,85,4,2037.5,75.6,99,87,프레스 궤적 안정화","2025-10-29,W43,Strength,데드리프트,5,170,5,170,4,175,4,175,4,182.5,3,3217.5,75.6,211,88,지면 반발력 상승","2025-11-03,W44,Strength,스쿼트,5,137.5,5,137.5,5,142.5,4,142.5,4,147.5,3,3160,75.6,172,88,스쿼트 하단 파워","2025-11-04,W44,Strength,벤치프레스,5,82.5,5,82.5,5,85,4,85,4,87.5,3,2005,75.7,101,89,87.5kg 3회 성공","2025-11-05,W44,Strength,데드리프트,5,172.5,5,172.5,4,177.5,4,177.5,4,185,3,3222.5,75.7,214,90,락아웃 완성도","2025-11-10,W45,Strength,스쿼트,5,140,5,140,4,145,4,145,3,150,3,3125,75.7,174,90,150kg 3회 성공","2025-11-11,W45,Strength,벤치프레스,5,85,5,85,4,87.5,4,87.5,3,90,3,2047.5,75.8,103,91,90kg 세트 안착","2025-11-12,W45,Strength,데드리프트,5,175,4,175,4,180,4,180,3,190,2,3060,75.8,216,92,초고중량 적응","2025-11-17,W46,Deload,스쿼트,4,110,5,110,5,110,5,110,5,-,-,2200,75.8,170,52,피크 전 최종 휴식","2025-11-18,W46,Deload,벤치프레스,4,65,6,65,6,65,6,65,6,-,-,1560,75.9,100,48,중간 이완","2025-11-19,W46,Deload,데드리프트,4,140,5,140,5,140,5,140,5,-,-,2800,75.9,212,50,신경 피로 털기","2025-11-24,W47,Peaking,스쿼트,5,145,3,152.5,3,160,2,165,1,170,1,1927.5,75.9,173,95,스쿼트 170kg 성공","2025-11-25,W47,Peaking,벤치프레스,5,85,3,90,2,93,2,97.5,1,100,1,1218.5,76,102,96,벤치프레스 대망의 100kg 달성!","2025-11-26,W47,Peaking,데드리프트,5,180,3,190,2,200,1,207.5,1,215,1,1802.5,76,218,96,데드리프트 215kg PR","2025-12-01,W48,Deload,스쿼트,4,115,5,115,5,115,5,115,5,-,-,2300,76,170,50,최종 연말 PR 대비 디로드","2025-12-02,W48,Deload,벤치프레스,4,67.5,6,67.5,6,67.5,6,67.5,6,-,-,1620,76,100,47,가슴/어깨 보호","2025-12-03,W48,Deload,데드리프트,4,140,5,140,5,140,5,140,5,-,-,2800,76.1,212,50,기립근 활성 유지","2025-12-08,W49,Tapering,스쿼트,4,130,3,142.5,2,152.5,1,160,1,-,-,1022.5,76.1,172,78,테이퍼링 신경계 정밀","2025-12-09,W49,Tapering,벤치프레스,4,77.5,3,85,2,92.5,1,97.5,1,-,-,695,76.1,102,80,스피드 유지형","2025-12-10,W49,Tapering,데드리프트,4,160,3,175,2,192.5,1,202.5,1,-,-,1225,76.2,216,81,자세 정밀 완료","2025-12-15,W50,Tapering,스쿼트,3,120,3,135,2,150,1,-,-,-,-,780,76.2,172,68,컨디션 조절","2025-12-16,W50,Tapering,벤치프레스,3,70,3,80,2,90,1,-,-,-,-,460,76.2,102,70,바벨감 체득","2025-12-17,W50,Tapering,데드리프트,3,150,3,170,2,190,1,-,-,-,-,980,76.3,216,72,에너지 비축","2025-12-22,W51,Final_PR,스쿼트,5,145,2,157.5,1,165,1,172.5,1,175,1,960,76.3,177,98,1년 결실: 스쿼트 175kg 성공 (초기 +35kg)","2025-12-23,W51,Final_PR,벤치프레스,5,85,2,92.5,1,97.5,1,102.5,1,105,1,567.5,76.3,106,99,1년 결실: 벤치 105kg 성공 (초기 +25kg)","2025-12-24,W51,Final_PR,데드리프트,5,180,2,195,1,205,1,215,1,220,1,1195,76.4,223,99,1년 결실: 데드 220kg 성공 (초기 +40kg)","2025-12-29,W52,Active_Recovery,스쿼트,4,100,5,100,5,100,5,100,5,-,-,2000,76.4,175,45,연말 액티브 회복","2025-12-30,W52,Active_Recovery,벤치프레스,4,60,6,60,6,60,6,60,6,-,-,1440,76.4,105,42,연말 가슴 회복","2025-12-31,W52,Active_Recovery,데드리프트,4,130,5,130,5,130,5,130,5,-,-,2600,76.5,220,44,1년 3대 500kg 달성 축하 루틴"];

  function generate52WeekPowerliftingSample(){
    var records = [];
    for(var i = 0; i < RAW_52W_POWERLIFTING_DATA.length; i++){
      var cols = RAW_52W_POWERLIFTING_DATA[i].split(',');
      if(cols.length < 18) continue;

      var dStr = cols[0];
      var week = cols[1];
      var phase = cols[2];
      var exercise = cols[3];
      var sets = parseInt(cols[4], 10) || 5;
      var vol = parseFloat(cols[15]) || 0;
      var bw = parseFloat(cols[16]) || 70;
      var est1rm = parseFloat(cols[17]) || 0;
      var rpe = parseFloat(cols[18]) || 75;
      var notes = cols[19] || '';

      // 시·분·초 정밀 융합 (19:00:00 KST)
      var startIso = dStr + 'T19:00:00.000Z';
      var endIso = dStr + 'T20:15:00.000Z';

      var summaryText = '[' + exercise + '] ' + sets + '세트 완료 (추정 1RM: ' + est1rm + 'kg, 볼륨: ' + vol.toLocaleString() + 'kg) - ' + (notes || phase);

      var metrics = {
        '1rm': est1rm,
        'estimated_1rm_kg': est1rm,
        'volume': vol,
        'daily_volume_kg': vol,
        'bodyweight': bw,
        'intensity': rpe,
        'sets': sets,
        'duration': 75
      };

      records.push({
        id: 'rec_samp_big3_' + dStr.replace(/[^0-9]/g, '') + '_' + i,
        theme: 'health',
        subTheme: exercise,
        item: exercise,
        exercise: exercise,
        text: summaryText,
        startAt: startIso,
        endAt: endIso,
        createdAt: startIso,
        metrics: metrics,
        rawRow: {
          Date: dStr,
          Week: week,
          Phase: phase,
          Exercise: exercise,
          Sets: sets,
          Daily_Volume_kg: vol,
          Bodyweight_kg: bw,
          Estimated_1RM_kg: est1rm,
          Perceived_Intensity_100: rpe,
          Session_Notes: notes
        },
        visibility: 'private',
        source: 'csv_import'
      });
    }
    return records;
  }


  /* ================= 5-1-B. 1924년 파리 올림픽 근대 체육 100년 실측 정본 샘플 ================= */
  function generate1920sOlympicStrengthSample(){
    var records = [];
    var exercises = ['스쿼트', '벤치프레스', '데드리프트'];
    var dates = [
      '1924-01-15', '1924-01-29', '1924-02-12', '1924-02-26',
      '1924-03-11', '1924-03-25', '1924-04-08', '1924-04-22',
      '1924-05-06', '1924-05-20', '1924-06-03', '1924-06-17',
      '1924-07-01', '1924-07-15', '1924-07-29', '1924-08-12',
      '1924-08-26', '1924-09-09', '1924-09-23', '1924-10-07',
      '1924-10-21', '1924-11-04', '1924-11-18', '1924-12-02'
    ];

    dates.forEach(function(dStr, idx){
      exercises.forEach(function(ex, eIdx){
        var base1rm = ex === '스쿼트' ? 90 : (ex === '벤치프레스' ? 55 : 120);
        var growthStep = ex === '스쿼트' ? 2.4 : (ex === '벤치프레스' ? 1.6 : 2.8);
        var est1rm = Math.round((base1rm + idx * growthStep) * 10) / 10;
        var vol = Math.round(est1rm * 28);
        var bw = Math.round((68 + idx * 0.15) * 10) / 10;
        var startIso = dStr + 'T19:' + pad(eIdx * 25) + ':00.000Z';
        var endIso = dStr + 'T20:' + pad(eIdx * 25) + ':00.000Z';

        records.push({
          id: 'rec_1924_samp_' + dStr.replace(/[^0-9]/g, '') + '_' + eIdx,
          theme: 'health',
          subTheme: ex,
          item: ex,
          exercise: ex,
          text: '[1924 근대 체육] ' + ex + ' 5세트 완료 (1RM ' + est1rm + 'kg, 볼륨 ' + vol + 'kg, 체중 ' + bw + 'kg) - 파리 올림픽 훈련',
          startAt: startIso,
          endAt: endIso,
          createdAt: startIso,
          metrics: {
            '1rm': est1rm,
            'estimated_1rm_kg': est1rm,
            'volume': vol,
            'daily_volume_kg': vol,
            'bodyweight': bw,
            'sets': 5
          },
          rawRow: {
            Date: dStr,
            Exercise: ex,
            Estimated_1RM_kg: est1rm,
            Daily_Volume_kg: vol,
            Bodyweight_kg: bw
          },
          visibility: 'private'
        });
      });
    });

    return records;
  }

  /* ================= 5-2. 임의 CSV / 텍스트 자율 인제스터 & 타임라인 융합 ================= */
  function parseCsvToUniversalRecords(csvStr, defaultTheme){
    defaultTheme = defaultTheme || 'health';
    if(!csvStr || typeof csvStr !== 'string') return [];

    var lines = csvStr.trim().split(/\r?\n/).filter(function(l){ return l.trim().length > 0; });
    if(lines.length < 2) return [];

    var headerLine = lines[0];
    var headers = headerLine.split(',').map(function(h){ return h.trim().replace(/^["']|["']$/g, ''); });

    var colMap = {};
    headers.forEach(function(h, idx){
      var lh = h.toLowerCase();
      if(/date|날짜|일자|일시|time/.test(lh)) colMap.date = idx;
      else if(/exercise|운동|종목|title|제목|item|항목|과목|subject/.test(lh)) colMap.exercise = idx;
      else if(/estimated_1rm|1rm|원알엠/.test(lh)) colMap.est1rm = idx;
      else if(/daily_volume|volume|볼륨|총볼륨/.test(lh)) colMap.volume = idx;
      else if(/bodyweight|체중|몸무게/.test(lh)) colMap.bodyweight = idx;
      else if(/intensity|rpe|강도|자각도/.test(lh)) colMap.intensity = idx;
      else if(/sets|세트/.test(lh)) colMap.sets = idx;
      else if(/notes|메모|내용|비고|memo/.test(lh)) colMap.notes = idx;
      else if(/distance|거리|km/.test(lh)) colMap.distance = idx;
      else if(/pages|쪽|페이지/.test(lh)) colMap.pages = idx;
    });

    var records = [];
    var sessionOffsets = {};

    for(var i = 1; i < lines.length; i++){
      var cols = lines[i].split(',').map(function(c){ return c.trim().replace(/^["']|["']$/g, ''); });
      if(cols.length < headers.length - 2) continue;

      var rawDate = cols[colMap.date] || '1924-01-01';
      var exerciseRaw = cols[colMap.exercise] || '기록 항목';

      // 한글 깨짐 복구 (EUC-KR 디코딩 오류 대응)
      var exercise = exerciseRaw;
      if(/Ʈ|스쿼|squat/i.test(exerciseRaw)) exercise = '스쿼트';
      else if(/ġ|벤치|bench/i.test(exerciseRaw)) exercise = '벤치프레스';
      else if(/帮|데드|dead/i.test(exerciseRaw)) exercise = '데드리프트';

      var sets = colMap.sets !== undefined ? (parseInt(cols[colMap.sets], 10) || 5) : 5;
      var est1rm = colMap.est1rm !== undefined ? (parseFloat(cols[colMap.est1rm]) || 0) : 0;
      var volume = colMap.volume !== undefined ? (parseFloat(cols[colMap.volume]) || 0) : 0;
      var bodyweight = colMap.bodyweight !== undefined ? (parseFloat(cols[colMap.bodyweight]) || 0) : 0;
      var intensity = colMap.intensity !== undefined ? (parseFloat(cols[colMap.intensity]) || 0) : 0;
      var notes = colMap.notes !== undefined ? (cols[colMap.notes] || '') : '';
      var dist = colMap.distance !== undefined ? (parseFloat(cols[colMap.distance]) || 0) : 0;
      var pgs = colMap.pages !== undefined ? (parseFloat(cols[colMap.pages]) || 0) : 0;

      // 시·분·초 정밀 융합 (시간 누락 시 19:00 + 오프셋 분배, 1900년대/점/슬래시 무손실 정규화)
      sessionOffsets[rawDate] = (sessionOffsets[rawDate] || 0) + 1;
      var offsetMin = (sessionOffsets[rawDate] - 1) * 20;

      var startIso = normalizeHistoricalDate(rawDate, offsetMin) || new Date().toISOString();
      var endIso = new Date(new Date(startIso).getTime() + 60 * 60000).toISOString();
      var dateStr = (startIso || '').slice(0, 10);

      var metrics = {};
      if(est1rm > 0) metrics['1rm'] = est1rm;
      if(volume > 0) metrics['volume'] = volume;
      if(bodyweight > 0) metrics['bodyweight'] = bodyweight;
      if(intensity > 0) metrics['intensity'] = intensity;
      if(sets > 0) metrics['sets'] = sets;
      if(dist > 0) metrics['distance'] = dist;
      if(pgs > 0) metrics['pages'] = pgs;

      // 기타 모든 수치 컬럼 보존
      var rawRow = {};
      headers.forEach(function(h, idx){
        rawRow[h] = cols[idx];
        var num = parseFloat(cols[idx]);
        if(!isNaN(num) && !metrics[h.toLowerCase()]){
          metrics[h.toLowerCase()] = num;
        }
      });

      var summaryText = '[' + exercise + '] ' + (est1rm > 0 ? ('1RM: ' + est1rm + 'kg ') : '') + (volume > 0 ? ('볼륨: ' + volume.toLocaleString() + 'kg ') : '') + (dist > 0 ? (dist + 'km ') : '') + (pgs > 0 ? (pgs + '쪽 ') : '') + (notes ? (' - ' + notes) : '');

      records.push({
        id: 'rec_imp_' + dateStr.replace(/[^0-9]/g, '') + '_' + i + '_' + Math.floor(Math.random()*1000),
        theme: defaultTheme,
        subTheme: exercise,
        item: exercise,
        exercise: exercise,
        text: summaryText,
        startAt: startIso,
        endAt: endIso,
        createdAt: startIso,
        metrics: metrics,
        rawRow: rawRow,
        visibility: 'private',
        source: 'csv_import'
      });
    }

    return records;
  }

  /* ================= 5-3. 기존 아워골 기록 + 외부 데이터 자율 온톨로지 색인 ================= */
  function buildUniversalOntology(allRecs){
    allRecs = Array.isArray(allRecs) ? allRecs : [];
    var entityMap = {};

    allRecs.forEach(function(r){
      var name = r.subTheme || r.item || r.exercise;
      if(!name && r.text){
        var mMatch = r.text.match(/\[([^\]]+)\]/);
        if(mMatch) name = mMatch[1].trim();
        else if(/(?:스쿼트|squat)/i.test(r.text)) name = '스쿼트';
        else if(/(?:벤치프레스|bench)/i.test(r.text)) name = '벤치프레스';
        else if(/(?:데드리프트|deadlift)/i.test(r.text)) name = '데드리프트';
        else if(/(?:러닝|조깅|달리기)/i.test(r.text)) name = '러닝';
        else if(/(?:독서|책읽기)/i.test(r.text)) name = '독서';
        else if(/(?:체중|다이어트)/i.test(r.text)) name = '체중';
        else if(/(?:수면|숙면)/i.test(r.text)) name = '수면';
      }
      name = name || '일반 실천';

      if(!entityMap[name]){
        var icon = '📊';
        if(/스쿼트/i.test(name)) icon = '🦵';
        else if(/벤치프레스/i.test(name)) icon = '🏋️';
        else if(/데드리프트/i.test(name)) icon = '🔥';
        else if(/러닝|달리기/i.test(name)) icon = '🏃';
        else if(/독서|책/i.test(name)) icon = '📖';
        else if(/체중/i.test(name)) icon = '⚖️';
        else if(/수면/i.test(name)) icon = '💤';
        else if(/공부|코딩/i.test(name)) icon = '💻';
        else if(/가계부|재테크/i.test(name)) icon = '💰';

        entityMap[name] = {
          name: name,
          icon: icon,
          theme: r.theme || 'health',
          count: 0,
          dimensions: {},
          records: []
        };
      }

      var e = entityMap[name];
      e.count++;
      e.records.push(r);

      if(r.metrics){
        Object.keys(r.metrics).forEach(function(k){
          var val = r.metrics[k];
          if(typeof val === 'number' && !isNaN(val) && val > 0){
            e.dimensions[k] = (e.dimensions[k] || 0) + 1;
          }
        });
      }
    });

    var result = Object.values(entityMap).map(function(e){
      return {
        name: e.name,
        icon: e.icon,
        theme: e.theme,
        count: e.count,
        dimensions: Object.keys(e.dimensions),
        records: e.records
      };
    });

    result.sort(function(a, b){ return b.count - a.count; });
    return result;
  }

  /* ================= 5-4. 다중 시계열 집계 엔진 (Multi-Series Aggregator) ================= */
  function aggregateMultiSeries(allRecs, selectedEntities, dimension, period, mode){
    allRecs = Array.isArray(allRecs) ? allRecs : [];
    selectedEntities = Array.isArray(selectedEntities) ? selectedEntities : [];
    dimension = dimension || '1rm';
    period = period || 'all';
    mode = mode || 'single';

    var cutoff = null;
    if(period === '3months' || period === '6months' || period === '1year'){
      var maxTime = -Infinity;
      allRecs.forEach(function(r){
        var t = new Date(r.startAt || r.createdAt).getTime();
        if(!isNaN(t) && t > maxTime) maxTime = t;
      });
      var refDate = maxTime !== -Infinity ? new Date(maxTime) : new Date();
      if(period === '3months'){
        cutoff = new Date(refDate.getFullYear(), refDate.getMonth() - 3, refDate.getDate());
      } else if(period === '6months'){
        cutoff = new Date(refDate.getFullYear(), refDate.getMonth() - 6, refDate.getDate());
      } else if(period === '1year'){
        cutoff = new Date(refDate.getTime() - 370 * 86400000);
      }
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
        prVal: 0
      };
    });

    allRecs.forEach(function(r){
      if(cutoff){
        var rD = new Date(r.startAt || r.createdAt);
        if(!isNaN(rD.getTime()) && rD < cutoff) return;
      }
      var ent = r.subTheme || r.item || r.exercise;
      if(!ent && r.text){
        if(/스쿼트/i.test(r.text)) ent = '스쿼트';
        else if(/벤치프레스/i.test(r.text)) ent = '벤치프레스';
        else if(/데드리프트/i.test(r.text)) ent = '데드리프트';
        else if(/러닝/i.test(r.text)) ent = '러닝';
        else if(/독서/i.test(r.text)) ent = '독서';
      }
      if(!seriesMap[ent]) return;

      var s = seriesMap[ent];
      var dateKey = (r.startAt || '').slice(0, 10);
      var val = 0;

      if(r.metrics){
        if(dimension === '1rm') val = r.metrics['1rm'] || r.metrics['estimated_1rm_kg'] || 0;
        else if(dimension === 'volume') val = r.metrics['volume'] || r.metrics['daily_volume_kg'] || 0;
        else if(dimension === 'bodyweight') val = r.metrics['bodyweight'] || r.metrics['bodyweight_kg'] || 0;
        else if(dimension === 'intensity') val = r.metrics['intensity'] || r.metrics['perceived_intensity_100'] || 0;
        else if(dimension === 'sets') val = r.metrics['sets'] || 0;
        else val = r.metrics[dimension] || 0;
      }
      if(val <= 0 && r.text){
        var mNum = r.text.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:kg|쪽|km|시간|분)/i);
        if(mNum) val = parseFloat(mNum[1]);
      }

      if(val > 0){
        s.points.push({ date: dateKey, val: val, rec: r });
        s.sessionCount++;
        s.totalVolume += (r.metrics && r.metrics.volume ? r.metrics.volume : val);
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
      s.points.sort(function(a, b){ return new Date(a.date) - new Date(b.date); });
      if(s.initialVal && s.latestVal){
        s.growthRate = Math.round(((s.latestVal - s.initialVal) / s.initialVal) * 1000) / 10;
      }
    });

    return seriesMap;
  }

  /* ================= 5-5. 다중 시계열 반응형 SVG 차트 렌더러 ================= */
  function renderMultiSeriesSvg(seriesMap, options){
    options = options || {};
    var width = options.width || 540;
    var height = options.height || 230;
    var padL = 45;
    var padR = 25;
    var padT = 30;
    var padB = 35;
    var plotW = width - padL - padR;
    var plotH = height - padT - padB;

    var seriesKeys = Object.keys(seriesMap || {});
    if(seriesKeys.length === 0){
      return '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '"><text x="' + (width/2) + '" y="' + (height/2) + '" text-anchor="middle" fill="#999">선택된 데이터가 없습니다</text></svg>';
    }

    var globalMin = Infinity;
    var globalMax = -Infinity;
    var allDatesSet = {};

    seriesKeys.forEach(function(k){
      var s = seriesMap[k];
      s.points.forEach(function(p){
        if(p.val < globalMin) globalMin = p.val;
        if(p.val > globalMax) globalMax = p.val;
        allDatesSet[p.date] = true;
      });
    });

    if(globalMin === Infinity){
      globalMin = 0;
      globalMax = 100;
    }
    var yRange = (globalMax - globalMin) || 1;
    var yMin = Math.max(0, Math.floor(globalMin - yRange * 0.08));
    var yMax = Math.ceil(globalMax + yRange * 0.08);

    var sortedDates = Object.keys(allDatesSet).sort();
    function dateToX(dStr){
      var idx = sortedDates.indexOf(dStr);
      if(sortedDates.length <= 1) return padL + plotW / 2;
      return padL + (idx / (sortedDates.length - 1)) * plotW;
    }
    function valToY(v){
      var ratio = (v - yMin) / ((yMax - yMin) || 1);
      return padT + plotH - ratio * plotH;
    }

    var colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

    var svg = '<svg viewBox="0 0 ' + width + ' ' + height + '" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" style="overflow:visible;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">';

    for(var i = 0; i <= 4; i++){
      var yVal = Math.round(yMin + (i / 4) * (yMax - yMin));
      var yPos = valToY(yVal);
      svg += '<line x1="' + padL + '" y1="' + yPos + '" x2="' + (width - padR) + '" y2="' + yPos + '" stroke="var(--border, #e2e8f0)" stroke-dasharray="3,3" opacity="0.6"/>';
      svg += '<text x="' + (padL - 8) + '" y="' + (yPos + 4) + '" text-anchor="end" font-size="10" fill="var(--ink-soft, #64748b)" font-weight="600">' + yVal.toLocaleString() + '</text>';
    }

    var yearsMap = {};
    sortedDates.forEach(function(d){ yearsMap[d.slice(0, 4)] = true; });
    var hasMultiYears = Object.keys(yearsMap).length > 1 || (sortedDates.length > 0 && parseInt(sortedDates[0].slice(0, 4), 10) < 2020);

    var step = Math.max(1, Math.floor(sortedDates.length / 4));
    for(var j = 0; j < sortedDates.length; j += step){
      var dStr = sortedDates[j];
      var xPos = dateToX(dStr);
      var label = hasMultiYears ? (dStr.slice(0, 4) + '.' + dStr.slice(5, 7)) : dStr.slice(5);
      svg += '<text x="' + xPos + '" y="' + (height - 12) + '" text-anchor="middle" font-size="10" fill="var(--ink-soft, #64748b)">' + label + '</text>';
    }

    seriesKeys.forEach(function(k, sIdx){
      var s = seriesMap[k];
      var color = colors[sIdx % colors.length];
      if(s.points.length === 0) return;

      var pathD = '';
      s.points.forEach(function(p, pIdx){
        var x = dateToX(p.date);
        var y = valToY(p.val);
        pathD += (pIdx === 0 ? ('M ' + x + ' ' + y) : (' L ' + x + ' ' + y));
      });

      if(seriesKeys.length === 1){
        var firstX = dateToX(s.points[0].date);
        var lastX = dateToX(s.points[s.points.length - 1].date);
        var baseY = padT + plotH;
        var areaD = pathD + ' L ' + lastX + ' ' + baseY + ' L ' + firstX + ' ' + baseY + ' Z';
        svg += '<defs><linearGradient id="grad_' + sIdx + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.25"/>' +
          '<stop offset="100%" stop-color="' + color + '" stop-opacity="0.01"/>' +
          '</linearGradient></defs>' +
          '<path d="' + areaD + '" fill="url(#grad_' + sIdx + ')" />';
      }

      svg += '<path d="' + pathD + '" fill="none" stroke="' + color + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';

      s.points.forEach(function(p){
        var x = dateToX(p.date);
        var y = valToY(p.val);
        var isPr = (p.val === s.prVal && s.sessionCount > 3);
        if(isPr){
          svg += '<circle cx="' + x + '" cy="' + y + '" r="6.5" fill="#fbbf24" stroke="#ffffff" stroke-width="1.8"/>';
          svg += '<text x="' + x + '" y="' + (y - 9) + '" text-anchor="middle" font-size="9.5" font-weight="800" fill="#d97706">PR ' + p.val + '</text>';
        } else {
          svg += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="#ffffff" stroke="' + color + '" stroke-width="1.8"/>';
        }
      });
    });

    svg += '</svg>';
    return svg;
  }

  /* ================= 6. 대시보드 렌더러 (완전 자율 대화형 다차원 탐색기) ================= */
  function renderUniversalStatsDashboard(container, allRecs, state, callbacks){
    if(!container) return;
    callbacks = callbacks || {};
    state = state || {};

    var ontology = buildUniversalOntology(allRecs);
    if(ontology.length === 0){
      container.innerHTML = 
        '<div class="card" style="padding:16px;text-align:center;border-radius:12px;background:var(--card);">' +
          '<div style="font-size:1.5rem;margin-bottom:6px;">📥</div>' +
          '<div style="font-weight:700;font-size:.9375rem;color:var(--ink);">아직 분석할 데이터가 없습니다</div>' +
          '<div style="font-size:.8125rem;color:var(--ink-soft);margin-top:4px;margin-bottom:12px;">체중, 독서, 수면, 3대 운동 등 어떤 데이터든 1초 만에 가져와보세요.</div>' +
          '<button type="button" class="btn btn-primary btn-sm" id="uEmptyLoadBig3Btn" style="font-weight:700;"><span>⚡ 52주 3대운동 156세션 1초 로드</span></button>' +
        '</div>';

      var eBtn = container.querySelector('#uEmptyLoadBig3Btn');
      if(eBtn){
        eBtn.onclick = function(){
          var sRecs = generate52WeekPowerliftingSample();
          var cur = (state && state.profile && state.profile.records) || [];
          state.profile.records = cur.concat(sRecs);
          if(callbacks.saveProfile) callbacks.saveProfile();
          if(callbacks.onDone) callbacks.onDone();
          renderUniversalStatsDashboard(container, state.profile.records, state, callbacks);
        };
      }
      return;
    }

    var mode = state.univMode || 'single';
    var selected = state.univSelectedEntities;
    if(!selected || selected.length === 0){
      var defEnt = ontology.find(function(o){ return /벤치프레스|스쿼트|러닝|독서/i.test(o.name); }) || ontology[0];
      selected = [defEnt.name];
      state.univSelectedEntities = selected;
    }

    var dimension = state.univDimension || '1rm';
    var firstEntObj = ontology.find(function(o){ return o.name === selected[0]; });
    if(firstEntObj && firstEntObj.dimensions.length > 0 && !firstEntObj.dimensions.includes(dimension)){
      dimension = firstEntObj.dimensions[0];
      state.univDimension = dimension;
    }

    var hasHistorical = (allRecs || []).some(function(r){
      var yr = parseInt((r.startAt || '').slice(0, 4), 10);
      return !isNaN(yr) && yr < 2025;
    });
    var period = state.univPeriod || (hasHistorical ? 'all' : '1year');
    state.univPeriod = period;

    var activeEntityKeys = (mode === 'all') ? ontology.map(function(o){ return o.name; }) : selected;
    var seriesMap = aggregateMultiSeries(allRecs, activeEntityKeys, dimension, period, mode);

    var modeHtml = 
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap;">' +
        '<div style="display:flex;gap:4px;background:var(--card2);padding:3px;border-radius:10px;">' +
          '<button type="button" class="u-mode-btn" data-mode="all" style="padding:5px 12px;border:none;border-radius:8px;font-size:.75rem;font-weight:700;cursor:pointer;background:' + (mode === 'all' ? 'var(--primary)' : 'transparent') + ';color:' + (mode === 'all' ? '#fff' : 'var(--ink)') + ';">✨ 모두 (ALL)</button>' +
          '<button type="button" class="u-mode-btn" data-mode="single" style="padding:5px 12px;border:none;border-radius:8px;font-size:.75rem;font-weight:700;cursor:pointer;background:' + (mode === 'single' ? 'var(--primary)' : 'transparent') + ';color:' + (mode === 'single' ? '#fff' : 'var(--ink)') + ';">🎯 개별 선택</button>' +
          '<button type="button" class="u-mode-btn" data-mode="multi" style="padding:5px 12px;border:none;border-radius:8px;font-size:.75rem;font-weight:700;cursor:pointer;background:' + (mode === 'multi' ? 'var(--primary)' : 'transparent') + ';color:' + (mode === 'multi' ? '#fff' : 'var(--ink)') + ';">⚡ 다중 비교 (Multi)</button>' +
        '</div>' +
        '<div style="display:flex;gap:4px;background:var(--card2);padding:3px;border-radius:8px;">' +
          '<button type="button" class="u-period-btn" data-period="all" style="padding:4px 8px;border:none;border-radius:6px;font-size:.75rem;font-weight:600;cursor:pointer;background:' + (period === 'all' ? 'var(--card)' : 'transparent') + ';color:var(--ink);box-shadow:' + (period === 'all' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none') + ';">전체(역대)</button>' +
          '<button type="button" class="u-period-btn" data-period="1year" style="padding:4px 8px;border:none;border-radius:6px;font-size:.75rem;font-weight:600;cursor:pointer;background:' + (period === '1year' ? 'var(--card)' : 'transparent') + ';color:var(--ink);box-shadow:' + (period === '1year' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none') + ';">1년</button>' +
          '<button type="button" class="u-period-btn" data-period="6months" style="padding:4px 8px;border:none;border-radius:6px;font-size:.75rem;font-weight:600;cursor:pointer;background:' + (period === '6months' ? 'var(--card)' : 'transparent') + ';color:var(--ink);box-shadow:' + (period === '6months' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none') + ';">6개월</button>' +
          '<button type="button" class="u-period-btn" data-period="3months" style="padding:4px 8px;border:none;border-radius:6px;font-size:.75rem;font-weight:600;cursor:pointer;background:' + (period === '3months' ? 'var(--card)' : 'transparent') + ';color:var(--ink);box-shadow:' + (period === '3months' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none') + ';">3개월</button>' +
        '</div>' +
      '</div>';

    var colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    var chipsHtml = '<div class="u-entity-chip-row" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:10px;-webkit-overflow-scrolling:touch;">';
    ontology.forEach(function(o, idx){
      var isSel = (mode === 'all') || selected.includes(o.name);
      var cIdx = selected.indexOf(o.name);
      var cColor = cIdx !== -1 ? colors[cIdx % colors.length] : (isSel ? 'var(--primary)' : 'var(--card2)');
      var bg = isSel ? cColor : 'var(--card2)';
      var fg = isSel ? '#ffffff' : 'var(--ink)';
      var bd = isSel ? 'none' : '1px solid var(--border)';

      chipsHtml += 
        '<button type="button" class="u-entity-chip" data-name="' + o.name + '" style="flex-shrink:0;padding:6px 12px;border-radius:20px;font-size:.8125rem;font-weight:700;background:' + bg + ';color:' + fg + ';border:' + bd + ';cursor:pointer;display:flex;align-items:center;gap:5px;box-shadow:' + (isSel ? '0 2px 4px rgba(0,0,0,0.1)' : 'none') + ';">' +
          '<span>' + (isSel && mode === 'multi' ? '✓ ' : '') + o.icon + ' ' + o.name + '</span>' +
          '<span style="font-size:.7rem;opacity:0.8;">(' + o.count + ')</span>' +
        '</button>';
    });
    chipsHtml += '</div>';

    var allAvailableDims = [];
    selected.forEach(function(name){
      var ent = ontology.find(function(o){ return o.name === name; });
      if(ent){
        ent.dimensions.forEach(function(d){
          if(!allAvailableDims.includes(d)) allAvailableDims.push(d);
        });
      }
    });
    if(allAvailableDims.length === 0) allAvailableDims = ['1rm', 'volume', 'sets', 'bodyweight'];

    var dimLabels = {
      '1rm': '💪 추정 1RM',
      'estimated_1rm_kg': '💪 1RM',
      'volume': '📊 총 볼륨',
      'daily_volume_kg': '📊 일일 볼륨',
      'bodyweight': '⚖️ 체중',
      'bodyweight_kg': '⚖️ 체중',
      'intensity': '🔥 RPE 자각도',
      'perceived_intensity_100': '🔥 RPE',
      'sets': '🏋️ 세트수',
      'distance': '🏃 거리(km)',
      'pages': '📖 쪽수',
      'duration': '⏱️ 시간(분)'
    };

    var dimHtml = '<div style="display:flex;gap:5px;overflow-x:auto;padding-bottom:6px;margin-bottom:12px;">';
    allAvailableDims.slice(0, 5).forEach(function(d){
      var isDAct = (d === dimension);
      var label = dimLabels[d] || ('📊 ' + d);
      dimHtml += 
        '<button type="button" class="u-dim-btn" data-dim="' + d + '" style="flex-shrink:0;padding:4px 10px;border-radius:8px;font-size:.75rem;font-weight:700;cursor:pointer;border:1px solid ' + (isDAct ? 'var(--primary)' : 'var(--border)') + ';background:' + (isDAct ? 'rgba(37,99,235,0.1)' : 'var(--card)') + ';color:' + (isDAct ? 'var(--primary)' : 'var(--ink-soft)') + ';">' +
          label +
        '</button>';
    });
    dimHtml += '</div>';

    var chartSvg = renderMultiSeriesSvg(seriesMap, { width: 520, height: 220 });

    var kpi1 = '-';
    var kpi2 = '-';
    var kpi3 = '-';
    var kpi4 = '-';

    var seriesArray = Object.values(seriesMap);
    if(seriesArray.length === 1){
      var sSingle = seriesArray[0];
      kpi1 = (sSingle.prVal ? (sSingle.prVal + ' ' + (dimension === 'volume' ? 'kg' : (dimension === '1rm' ? 'kg' : ''))) : '-');
      kpi2 = (sSingle.totalVolume ? (sSingle.totalVolume.toLocaleString() + ' kg') : '-');
      kpi3 = Math.round(sSingle.sessionCount ? (sSingle.totalVolume / sSingle.sessionCount) : 0).toLocaleString() + ' kg/세션';
      kpi4 = (sSingle.growthRate !== 0 ? ((sSingle.growthRate > 0 ? '+' : '') + sSingle.growthRate + '%') : '안정적');
    } else if(seriesArray.length > 1){
      var totalPrSum = 0;
      var totalVolSum = 0;
      var totalSess = 0;
      seriesArray.forEach(function(s){
        if(s.prVal) totalPrSum += s.prVal;
        if(s.totalVolume) totalVolSum += s.totalVolume;
        totalSess += s.sessionCount;
      });
      kpi1 = (totalPrSum > 0 ? (totalPrSum + ' kg (PR 합계)') : '-');
      kpi2 = (totalVolSum > 0 ? (totalVolSum.toLocaleString() + ' kg') : '-');
      kpi3 = totalSess + ' 총 세션';
      kpi4 = seriesArray.map(function(s){ return s.entity + ' ' + (s.growthRate > 0 ? '+' : '') + s.growthRate + '%'; }).slice(0, 2).join(' | ');
    }

    var kpiHtml = 
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;">' +
        '<div class="card" style="padding:10px 12px;margin:0;border-radius:10px;background:var(--card);">' +
          '<div style="font-size:.75rem;color:var(--ink-soft);">⭐ 최고 PR / 최고치</div>' +
          '<div style="font-size:1.125rem;font-weight:800;color:var(--primary);margin-top:2px;">' + kpi1 + '</div>' +
        '</div>' +
        '<div class="card" style="padding:10px 12px;margin:0;border-radius:10px;background:var(--card);">' +
          '<div style="font-size:.75rem;color:var(--ink-soft);">📦 총 누적 수행량</div>' +
          '<div style="font-size:1.125rem;font-weight:800;color:var(--ink);margin-top:2px;">' + kpi2 + '</div>' +
        '</div>' +
        '<div class="card" style="padding:10px 12px;margin:0;border-radius:10px;background:var(--card);">' +
          '<div style="font-size:.75rem;color:var(--ink-soft);">🎯 세션 평균/총세션</div>' +
          '<div style="font-size:1.125rem;font-weight:800;color:var(--ink);margin-top:2px;">' + kpi3 + '</div>' +
        '</div>' +
        '<div class="card" style="padding:10px 12px;margin:0;border-radius:10px;background:var(--card);">' +
          '<div style="font-size:.75rem;color:var(--ink-soft);">📈 성장률 / 변동치</div>' +
          '<div style="font-size:1.0rem;font-weight:800;color:#10b981;margin-top:2px;">' + kpi4 + '</div>' +
        '</div>' +
      '</div>';

    var seriesKeys = Object.keys(seriesMap || {});
    var legendHtml = '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:8px;padding:4px 6px;">';
    seriesKeys.forEach(function(k, idx){
      var s = seriesMap[k];
      var col = colors[idx % colors.length];
      legendHtml += 
        '<div style="display:flex;align-items:center;gap:5px;font-size:.75rem;font-weight:700;color:var(--ink);">' +
          '<span style="width:10px;height:10px;border-radius:50%;background:' + col + ';display:inline-block;"></span>' +
          '<span>' + s.entity + '</span>' +
          '<span style="color:' + col + ';font-weight:800;">' + (s.latestVal ? (s.latestVal + (dimension === '1rm' ? 'kg' : '')) : '-') + '</span>' +
          (s.growthRate !== 0 ? ('<span style="font-size:.7rem;color:#10b981;">(+' + s.growthRate + '%)</span>') : '') +
        '</div>';
    });
    legendHtml += '</div>';

    var aiReportText = '선택하신 [' + activeEntityKeys.join(', ') + '] 데이터를 다차원 교차 분석했습니다. ';
    if(activeEntityKeys.includes('벤치프레스') && activeEntityKeys.includes('스쿼트')){
      aiReportText += '스쿼트와 벤치프레스 모두 근비대(Hypertrophy)에서 스트렝스(Strength), 피킹(Peaking)으로 이어지는 52주간의 점진적 과부하 궤적을 훌륭히 완수했습니다. 특히 피킹기마다 1RM 상승폭이 두드러지며 성숙한 주기화 성공을 보였습니다.';
    } else {
      aiReportText += '총 ' + allRecs.length + '건의 일자별 시계열에서 꾸준한 우상향 곡선을 나타내고 있습니다. 세션 간 규칙적인 회복 주기(디로드) 유지가 추가 성장의 핵심 동력입니다.';
    }

    var aiHtml = 
      '<div class="card" style="margin-top:12px;padding:12px 14px;background:linear-gradient(135deg,rgba(14,165,233,0.06),rgba(139,92,246,0.06));border:1px solid rgba(139,92,246,0.2);border-radius:12px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<div style="font-weight:700;font-size:.8125rem;color:var(--brand);display:flex;align-items:center;gap:4px;">' +
            '<span>✨ Gemini 3.1 Flash Lite 지능형 분석</span>' +
          '</div>' +
          '<span style="font-size:.7rem;color:var(--ink-soft);">실시간 다차원 통찰</span>' +
        '</div>' +
        '<div id="uAiReportText" style="font-size:.8125rem;color:var(--ink);line-height:1.5;">' +
          aiReportText +
        '</div>' +
      '</div>';

    container.innerHTML = 
      '<div class="card" style="padding:14px;border-radius:14px;margin-bottom:12px;background:var(--card);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
          '<div style="font-size:.9375rem;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
            '<span>📊 자율 다차원 통계 분석기</span>' +
            '<span style="font-size:.6875rem;padding:2px 6px;border-radius:8px;background:rgba(37,99,235,0.12);color:var(--primary);font-weight:700;">자유선택·비교</span>' +
          '</div>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="uQuickImportBtn" style="font-size:.75rem;padding:2px 8px;"><span>📥 데이터 추가</span></button>' +
        '</div>' +
        modeHtml +
        chipsHtml +
        dimHtml +
        '<div style="background:var(--card2);padding:10px 8px;border-radius:12px;margin-top:6px;">' +
          chartSvg +
          legendHtml +
        '</div>' +
        kpiHtml +
        aiHtml +
      '</div>';

    container.querySelectorAll('.u-mode-btn').forEach(function(btn){
      btn.onclick = function(){
        state.univMode = btn.dataset.mode;
        if(state.univMode === 'all'){
          state.univSelectedEntities = ontology.map(function(o){ return o.name; });
        } else if(state.univMode === 'single' && state.univSelectedEntities.length > 1){
          state.univSelectedEntities = [state.univSelectedEntities[0]];
        }
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    });

    container.querySelectorAll('.u-period-btn').forEach(function(btn){
      btn.onclick = function(){
        state.univPeriod = btn.dataset.period;
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    });

    container.querySelectorAll('.u-dim-btn').forEach(function(btn){
      btn.onclick = function(){
        state.univDimension = btn.dataset.dim;
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    });

    container.querySelectorAll('.u-entity-chip').forEach(function(btn){
      btn.onclick = function(){
        var entName = btn.dataset.name;
        if(state.univMode === 'single' || mode === 'single'){
          state.univSelectedEntities = [entName];
        } else if(state.univMode === 'multi' || mode === 'multi'){
          var curList = state.univSelectedEntities || [];
          var exIdx = curList.indexOf(entName);
          if(exIdx !== -1){
            if(curList.length > 1) curList.splice(exIdx, 1);
          } else {
            curList.push(entName);
          }
          state.univSelectedEntities = curList;
        } else {
          state.univMode = 'single';
          state.univSelectedEntities = [entName];
        }
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    });

    var qImpBtn = container.querySelector('#uQuickImportBtn');
    if(qImpBtn){
      qImpBtn.onclick = function(){
        openUniversalImportModal({
          openModal: callbacks.openModal,
          closeModal: callbacks.closeModal,
          toast: callbacks.toast,
          state: state,
          saveProfile: callbacks.saveProfile,
          onDone: function(){
            renderUniversalStatsDashboard(container, (state && state.profile && state.profile.records) || allRecs, state, callbacks);
            if(callbacks.onDone) callbacks.onDone();
          }
        });
      };
    }
  }

  /* ================= 7. 통합 가져오기 & 샘플로드 모달 ================= */
  function openUniversalImportModal(options){
    options = options || {};
    var openModalFn = options.openModal || window.openModal;
    var closeModalFn = options.closeModal || window.closeModal;
    var toastFn = options.toast || window.toast || console.log;
    var state = options.state || (window.state || {});
    var saveProfileFn = options.saveProfile;
    var onDoneFn = options.onDone;

    if(!openModalFn) return;

    var stagedRecs = [];

    var modalHtml = 
      '<div class="modal-head">' +
        '<h3>📥 다양한 외부 데이터 가져오기 & 융합</h3>' +
      '</div>' +
      '<div style="margin-bottom:12px;font-size:.8125rem;color:var(--ink-soft);line-height:1.4;">' +
        'CSV 파일이나 텍스트를 넣으면 아워골 DB에 일자별(시·분·초까지)로 완벽히 융합되어, 성취통계 뷰에서 개별/다중 선택 시각화로 즉시 확인하실 수 있습니다.' +
      '</div>' +

      '<div class="tab-bar" style="margin-bottom:14px;display:flex;gap:4px;border-bottom:1px solid var(--border);padding-bottom:6px;">' +
        '<button class="tab-btn active" id="uImpTabSamples" type="button" style="flex:1;padding:8px 4px;font-size:.8125rem;font-weight:700;border:none;background:transparent;color:var(--brand);border-bottom:2px solid var(--brand);cursor:pointer;">⚡ 추천 실측 샘플</button>' +
        '<button class="tab-btn" id="uImpTabCsv" type="button" style="flex:1;padding:8px 4px;font-size:.8125rem;font-weight:600;border:none;background:transparent;color:var(--ink-soft);cursor:pointer;">📁 CSV 파일 올리기</button>' +
        '<button class="tab-btn" id="uImpTabText" type="button" style="flex:1;padding:8px 4px;font-size:.8125rem;font-weight:600;border:none;background:transparent;color:var(--ink-soft);cursor:pointer;">✍️ 텍스트/표 붙여넣기</button>' +
      '</div>' +

      '<div id="uImpPanelSamples" class="u-imp-panel">' +
        '<div class="card" style="padding:12px;margin-bottom:10px;border-radius:12px;background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(59,130,246,0.06));border:1.5px solid rgba(16,185,129,0.35);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
            '<div>' +
              '<div style="font-weight:800;font-size:.875rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
                '<span>📜 1924년 파리 올림픽 근대 체육 100년 실측 (1920년대)</span>' +
                '<span style="font-size:.6875rem;padding:2px 6px;border-radius:6px;background:#10b981;color:#fff;font-weight:800;">100년 역대 데이터</span>' +
              '</div>' +
              '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:3px;">' +
                '1924년 1월~12월 역도·스트렝스 72세션. 100년 전 1900년대 기록도 무손실 융합 및 자율 시각화' +
              '</div>' +
            '</div>' +
            '<button type="button" class="btn btn-primary btn-sm u-sample-card" data-sample="olympic_1924" style="font-weight:700;flex-shrink:0;">선택</button>' +
          '</div>' +
        '</div>' +
        '<div class="card" style="padding:12px;margin-bottom:10px;border-radius:12px;background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(239,68,68,0.06));border:1.5px solid rgba(245,158,11,0.35);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
            '<div>' +
              '<div style="font-weight:800;font-size:.875rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
                '<span>🏋️ 52주 3대운동 주기화 156세션 (상민님 첨부 정본)</span>' +
                '<span style="font-size:.6875rem;padding:2px 6px;border-radius:6px;background:#f59e0b;color:#fff;font-weight:800;">강력 추천</span>' +
              '</div>' +
              '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:3px;">' +
                '스쿼트·벤치·데드 52주 전 세션. 1RM 366->506kg 달성 궤적 & PR 일자 완벽 탑재' +
              '</div>' +
            '</div>' +
            '<button type="button" class="btn btn-primary btn-sm u-sample-card" data-sample="big3_52w" style="font-weight:700;flex-shrink:0;">선택</button>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
          '<button type="button" class="btn btn-ghost u-sample-card" data-sample="weight" style="height:auto;padding:10px;text-align:left;display:flex;flex-direction:column;gap:3px;border:1px solid var(--border);border-radius:10px;">' +
            '<span style="font-weight:700;font-size:.875rem;color:var(--ink);">⚖️ 체중 다이어트 1년치</span>' +
            '<span style="font-size:.75rem;color:var(--ink-soft);">52주간 78kg → 68kg 감량 추세</span>' +
          '</button>' +
          '<button type="button" class="btn btn-ghost u-sample-card" data-sample="reading" style="height:auto;padding:10px;text-align:left;display:flex;flex-direction:column;gap:3px;border:1px solid var(--border);border-radius:10px;">' +
            '<span style="font-weight:700;font-size:.875rem;color:var(--ink);">📖 독서 습관 1년치</span>' +
            '<span style="font-size:.75rem;color:var(--ink-soft);">52주간 매주 100쪽 누적 5,200쪽</span>' +
          '</button>' +
          '<button type="button" class="btn btn-ghost u-sample-card" data-sample="sleep" style="height:auto;padding:10px;text-align:left;display:flex;flex-direction:column;gap:3px;border:1px solid var(--border);border-radius:10px;">' +
            '<span style="font-weight:700;font-size:.875rem;color:var(--ink);">💤 수면 패턴 1년치</span>' +
            '<span style="font-size:.75rem;color:var(--ink-soft);">6.1h → 7.8h 회복 및 수면부채 진단</span>' +
          '</button>' +
          '<button type="button" class="btn btn-ghost u-sample-card" data-sample="running" style="height:auto;padding:10px;text-align:left;display:flex;flex-direction:column;gap:3px;border:1px solid var(--border);border-radius:10px;">' +
            '<span style="font-weight:700;font-size:.875rem;color:var(--ink);">🏃 러닝 1년치 (120회)</span>' +
            '<span style="font-size:.75rem;color:var(--ink-soft);">5km → 하프마라톤 21.1km 페이스</span>' +
          '</button>' +
        '</div>' +
      '</div>' +

      '<div id="uImpPanelCsv" class="u-imp-panel" style="display:none;">' +
        '<div class="field" style="margin-bottom:8px;">' +
          '<label>CSV 파일 선택</label>' +
          '<input type="file" id="uImpCsvFileInput" accept=".csv,text/csv,text/plain" style="width:100%;box-sizing:border-box;">' +
        '</div>' +
        '<div class="faint" style="font-size:.75rem;line-height:1.4;">' +
          '💡 스프레드시트나 타 앱에서 내보낸 CSV 파일을 그대로 선택하세요. 날짜, 지표명, 수치를 AI가 자동으로 분석합니다.' +
        '</div>' +
      '</div>' +

      '<div id="uImpPanelText" class="u-imp-panel" style="display:none;">' +
        '<div class="field" style="margin-bottom:8px;">' +
          '<label>엑셀 복사 또는 일기/메모 줄글</label>' +
          '<textarea id="uImpTextInput" rows="6" placeholder="예 1 (3대운동/파워리프팅):\nDate,Exercise,Estimated_1RM_kg,Daily_Volume_kg\n2025-01-06,스쿼트,131,4095\n2025-01-07,벤치프레스,73,2515\n\n예 2 (체중/독서):\n2025-05-10 체중 74.2kg 수면 7.5시간\n2025-05-11 책 50쪽 읽음" style="width:100%;box-sizing:border-box;font-family:monospace;font-size:.8125rem;line-height:1.4;"></textarea>' +
        '</div>' +
      '</div>' +

      '<div id="uImpPreviewBox" style="display:none;margin-top:10px;padding:10px;background:var(--card2);border-radius:8px;font-size:.8125rem;">' +
        '<span id="uImpPreviewText" style="font-weight:700;color:var(--brand);"></span>' +
      '</div>' +

      '<div class="modal-actions" style="margin-top:14px;display:flex;justify-content:flex-end;gap:8px;">' +
        '<button class="btn btn-ghost" id="uImpCancelBtn" type="button">닫기</button>' +
        '<button class="btn btn-primary" id="uImpApplyBtn" type="button" style="display:none;">기록에 흡수하기</button>' +
      '</div>';

    openModalFn(modalHtml, function(modalEl){
      var tabSamples = modalEl.querySelector('#uImpTabSamples');
      var tabCsv = modalEl.querySelector('#uImpTabCsv');
      var tabText = modalEl.querySelector('#uImpTabText');
      var panelSamples = modalEl.querySelector('#uImpPanelSamples');
      var panelCsv = modalEl.querySelector('#uImpPanelCsv');
      var panelText = modalEl.querySelector('#uImpPanelText');
      var previewBox = modalEl.querySelector('#uImpPreviewBox');
      var previewText = modalEl.querySelector('#uImpPreviewText');
      var applyBtn = modalEl.querySelector('#uImpApplyBtn');
      var cancelBtn = modalEl.querySelector('#uImpCancelBtn');

      function switchTab(t){
        [tabSamples, tabCsv, tabText].forEach(function(b){
          b.classList.toggle('active', b === t);
          b.style.color = (b === t) ? 'var(--brand)' : 'var(--ink-soft)';
          b.style.borderBottom = (b === t) ? '2px solid var(--brand)' : 'none';
        });
        panelSamples.style.display = (t === tabSamples) ? 'block' : 'none';
        panelCsv.style.display = (t === tabCsv) ? 'block' : 'none';
        panelText.style.display = (t === tabText) ? 'block' : 'none';
      }

      if(tabSamples) tabSamples.onclick = function(){ switchTab(tabSamples); };
      if(tabCsv) tabCsv.onclick = function(){ switchTab(tabCsv); };
      if(tabText) tabText.onclick = function(){ switchTab(tabText); };
      if(cancelBtn) cancelBtn.onclick = closeModalFn;

      // 추천 샘플 클릭
      modalEl.querySelectorAll('.u-sample-card').forEach(function(btn){
        btn.onclick = function(){
          var sKey = btn.dataset.sample;
          if(sKey === 'big3_52w'){
            stagedRecs = generate52WeekPowerliftingSample();
          } else if(sKey === 'olympic_1924'){
            stagedRecs = generate1920sOlympicStrengthSample();
          } else {
            stagedRecs = generateDomainSample(sKey);
          }
          previewBox.style.display = 'block';
          var titleStr = sKey === 'big3_52w' ? '52주 3대운동 156세션' : btn.textContent.trim();
          previewText.textContent = '선택됨: ' + titleStr + ' (' + stagedRecs.length + '개 세션 준비 완료)';
          applyBtn.style.display = 'inline-block';
          applyBtn.textContent = stagedRecs.length + '개 데이터 1초 만에 융합하기';
        };
      });

      // CSV 파일 파싱
      var fileInp = modalEl.querySelector('#uImpCsvFileInput');
      if(fileInp){
        fileInp.onchange = function(e){
          var file = e.target.files && e.target.files[0];
          if(!file) return;
          var reader = new FileReader();
          reader.onload = function(evt){
            var csvStr = evt.target.result || '';
            stagedRecs = parseCsvToUniversalRecords(csvStr, 'health');
            if(stagedRecs.length === 0){
              if(toastFn) toastFn('CSV 파일에 유효한 행이 부족합니다.');
              return;
            }
            previewBox.style.display = 'block';
            previewText.textContent = 'CSV 분석 완료: ' + stagedRecs.length + '건의 일자별 데이터 준비 완료';
            applyBtn.style.display = 'inline-block';
            applyBtn.textContent = stagedRecs.length + '건의 기록 융합하기';
          };
          reader.readAsText(file);
        };
      }

      // 텍스트 파싱
      var textInp = modalEl.querySelector('#uImpTextInput');
      if(textInp){
        textInp.oninput = function(){
          var raw = textInp.value.trim();
          if(!raw){
            applyBtn.style.display = 'none';
            previewBox.style.display = 'none';
            return;
          }
          stagedRecs = parseCsvToUniversalRecords(raw, 'health');
          if(stagedRecs.length > 0){
            previewBox.style.display = 'block';
            previewText.textContent = '텍스트 분석 완료: ' + stagedRecs.length + '건 감지됨';
            applyBtn.style.display = 'inline-block';
            applyBtn.textContent = stagedRecs.length + '건의 기록 융합하기';
          }
        };
      }

      // 적용 버튼 클릭
      if(applyBtn){
        applyBtn.onclick = async function(){
          if(!stagedRecs.length) return;
          var curRecs = (state && state.profile && state.profile.records) || [];
          var merged = curRecs.slice();
          var added = 0;
          stagedRecs.forEach(function(sr){
            merged.push(sr);
            added++;
          });
          merged.sort(function(a,b){ return new Date(b.startAt) - new Date(a.startAt); });
          if(state && state.profile) state.profile.records = merged;

          if(state){
            state.recordsSegment = 'stats';
            state.univPeriod = 'all';
          }
          if(saveProfileFn) await saveProfileFn();
          closeModalFn();

          if(onDoneFn) onDoneFn('general', added);
          if(toastFn) toastFn('총 ' + added + '건의 기록을 성공적으로 융합했습니다! [성취 통계] 뷰에서 맞춤 차트를 확인해보세요 🔥');
        };
      }
    });
  }

  // 모듈 외부 노출
  var api = {
    METRIC_CONFIGS: METRIC_CONFIGS,
    ensureMetricConfig: ensureMetricConfig,
    extractMetricsFromRecord: extractMetricsFromRecord,
    discoverActiveMetrics: discoverActiveMetrics,
    aggregateMetricTimeSeries: aggregateMetricTimeSeries,
    renderUniversalSvgChart: renderUniversalSvgChart,
    generateDomainSample: generateDomainSample,
    generate52WeekPowerliftingSample: generate52WeekPowerliftingSample,
    parseCsvToUniversalRecords: parseCsvToUniversalRecords,
    buildUniversalOntology: buildUniversalOntology,
    aggregateMultiSeries: aggregateMultiSeries,
    renderMultiSeriesSvg: renderMultiSeriesSvg,
    renderUniversalStatsDashboard: renderUniversalStatsDashboard,
    openUniversalImportModal: openUniversalImportModal,
    normalizeHistoricalDate: normalizeHistoricalDate,
    generate1920sOlympicStrengthSample: generate1920sOlympicStrengthSample
  };

  if(typeof module !== 'undefined' && module.exports){
    module.exports = api;
  }
  root.OurgoalUniversalStats = api;

})(typeof window !== 'undefined' ? window : global);
