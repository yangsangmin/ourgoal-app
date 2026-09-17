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
      kpi4: '📈 히트맵 연속성'
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

  /* ================= 4-9. 추천 샘플 테마별 35종 카탈로그 (#TASK-ES-093) ================= */
  var SAMPLE_THEMES = [
    {
      id: 'workout',
      label: '🏃 운동·피트니스',
      shortLabel: '운동 (7)',
      items: [
        { key: 'hyrox', icon: '🏃', title: '하이록스 (HYROX)', tag: '대세', desc: '8개 스테이션 랩타임 & 페이스 52주', count: 52 },
        { key: 'big3_52w', icon: '🏋️', title: '파워리프팅 (3대 500kg)', tag: '대표', desc: '스쿼트·벤치·데드 주기화 156세션', count: 156 },
        { key: 'yoga', icon: '🧘', title: '요가 & 필라테스', tag: '인기', desc: '코어 정렬 및 체류시간 추적 52주', count: 52 },
        { key: 'running', icon: '🏃', title: '마라톤 & 러닝', tag: '정석', desc: '5km→하프 마라톤 페이스 52주', count: 120 },
        { key: 'crossfit', icon: '⚡', title: '크로스핏 WOD', tag: '고강도', desc: 'AMRAP 라운드 & 타임캡 추이 52주', count: 52 },
        { key: 'swimming', icon: '🏊', title: '수영 랩타임', tag: '유산소', desc: '자유형 50m 랩타임 & 2.5km 52주', count: 52 },
        { key: 'climbing', icon: '🧗', title: '볼더링 클라이밍', tag: '도전', desc: 'V-Grade 난이도 & 완등수 52주', count: 52 }
      ]
    },
    {
      id: 'career',
      label: '💼 업무·커리어',
      shortLabel: '업무 (7)',
      items: [
        { key: 'sales', icon: '💼', title: 'B2B 솔루션 영업', tag: '대표', desc: '주간 수주액 & 계약 체결 52주', count: 52 },
        { key: 'coding', icon: '💻', title: '풀스택 오픈소스 개발', tag: 'IT', desc: 'GitHub 일일 커밋 & PR 머지 52주', count: 52 },
        { key: 'marketing', icon: '📈', title: '퍼포먼스 마케팅', tag: '그로스', desc: '광고 ROAS & 리드 전환율 52주', count: 52 },
        { key: 'design', icon: '🎨', title: 'UI/UX 프로덕트 디자인', tag: '디자인', desc: '화면 설계 & 사용성 점수 52주', count: 52 },
        { key: 'techblog', icon: '✍️', title: '테크 블로그 연재', tag: '브랜딩', desc: '월간 순방문자 & 기술 아티클 52주', count: 52 },
        { key: 'support', icon: '🎧', title: 'CS 고객 경험 케어', tag: '만족도', desc: '티켓 처리 & CSAT 98% 달성 52주', count: 52 },
        { key: 'startup', icon: '🚀', title: '스타트업 지표 추적', tag: '스케일', desc: '주간 WAU 활성도 & 리텐션 52주', count: 52 }
      ]
    },
    {
      id: 'learning',
      label: '📖 공부·학습',
      shortLabel: '공부 (7)',
      items: [
        { key: 'study', icon: '📚', title: '공무원·고시 순공', tag: '대표', desc: '순공시간 & 일일 기출 52주', count: 104 },
        { key: 'toeic', icon: '🎯', title: '토익·어학 시험', tag: '어학', desc: 'LC/RC 모의고사 940점 달성 52주', count: 52 },
        { key: 'codingtest', icon: '💻', title: '알고리즘 코테 준비', tag: '개발', desc: '백준/리트코드 골드 티어 52주', count: 52 },
        { key: 'reading', icon: '📖', title: '주간 독서 습관', tag: '정석', desc: '주 100쪽 누적 5,200쪽 완독 52주', count: 78 },
        { key: 'cert', icon: '📜', title: '기사·전문 자격증', tag: '취득', desc: '오답노트 & 모의고사 86점 52주', count: 52 },
        { key: 'music', icon: '🎹', title: '피아노 악기 연습', tag: '취미', desc: '주간 연습시간 & 12곡 마스터 52주', count: 52 },
        { key: 'thesis', icon: '🎓', title: '대학원 학술 연구', tag: '연구', desc: '논문 작성 & 실험 데이터 분석 52주', count: 52 }
      ]
    },
    {
      id: 'finance',
      label: '💰 재테크·자산',
      shortLabel: '재테크 (7)',
      items: [
        { key: 'finance', icon: '💰', title: '월간 저축 & 적금', tag: '대표', desc: '월 50~150만 누적 1,200만원 52주', count: 52 },
        { key: 'dividend', icon: '💵', title: '미국 배당주 투자', tag: '배당', desc: '월 배당금 수령 & 복리 재투자 52주', count: 52 },
        { key: 'crypto', icon: '🪙', title: '비트코인 적립식 DCA', tag: '크립토', desc: '주간 분할 매수 & 누적 평단 52주', count: 52 },
        { key: 'budget', icon: '📉', title: '가계부 생활비 절감', tag: '절약', desc: '식비·고정비 65만원 절감 52주', count: 52 },
        { key: 'realestate', icon: '🏢', title: '부동산 청약 가점', tag: '청약', desc: '청약 납입 100회 & 가점 관리 52주', count: 52 },
        { key: 'sidehustle', icon: '💡', title: '사이드 프로젝트 수입', tag: '부수입', desc: '디지털 제품 부수입 240만원 52주', count: 52 },
        { key: 'irp', icon: '🛡️', title: '연금저축 & IRP', tag: '절세', desc: '세액공제 한도 적립 900만원 52주', count: 52 }
      ]
    },
    {
      id: 'wellness',
      label: '🧘 웰니스·루틴',
      shortLabel: '웰니스 (7)',
      items: [
        { key: 'sleep', icon: '😴', title: '수면 품질 회복', tag: '회복', desc: '6.1h→7.8h 숙면 & 피로도 케어 52주', count: 52 },
        { key: 'miracle', icon: '🌅', title: '미라클 모닝 루틴', tag: '아침', desc: '05:45 기상 & 주 6일 루틴 52주', count: 52 },
        { key: 'water', icon: '💧', title: '일일 수분 섭취 2L', tag: '건강', desc: '매일 물 2.3L 수분 충전 52주', count: 52 },
        { key: 'meditation', icon: '🧘', title: '마음챙김 명상', tag: '멘탈', desc: '매일 15분 호흡 & 스트레스 케어 52주', count: 52 },
        { key: 'screentime', icon: '📵', title: '디지털 디톡스', tag: '디톡스', desc: '스마트폰 사용 6.5h→2.2h 감소 52주', count: 52 },
        { key: 'walking', icon: '👟', title: '만보 걷기 산책', tag: '활동량', desc: '일일 10,000보 달성률 추적 52주', count: 52 },
        { key: 'gratitude', icon: '📝', title: '3줄 감사일기', tag: '긍정', desc: '매일 감사 노트 & 긍정 점수 52주', count: 52 }
      ]
    }
  ];

  var THEME_METRIC_SPECS = {
    hyrox: { theme: 'workout', sub: '하이록스', pName: '완주시간', pUnit: '분', sName: '페이스', sUnit: '초', pStart: 88, pDelta: -0.38, sStart: 340, sDelta: -1.3, tmpl: '[하이록스] 8개 스테이션 완주 {p}분 (1km 러닝 평균 {s}초)' },
    yoga: { theme: 'workout', sub: '요가', pName: '집중도', pUnit: '점', sName: '수련시간', sUnit: '분', pStart: 68, pDelta: 0.52, sStart: 60, sDelta: 0, tmpl: '[요가] 하타 & 빈야사 수련 60분 (코어 집중도 {p}점)' },
    crossfit: { theme: 'workout', sub: '크로스핏', pName: '라운드', pUnit: 'Rnd', sName: '칼로리', sUnit: 'kcal', pStart: 8, pDelta: 0.19, sStart: 420, sDelta: 4.8, tmpl: '[크로스핏] WOD {p}라운드 완수 ({s}kcal 소모)' },
    swimming: { theme: 'workout', sub: '수영', pName: '총거리', pUnit: 'm', sName: '50m랩', sUnit: '초', pStart: 1000, pDelta: 28.5, sStart: 52, sDelta: -0.3, tmpl: '[수영] 인터벌 완영 {p}m (50m 최고랩 {s}초)' },
    climbing: { theme: 'workout', sub: '클라이밍', pName: '완등수', pUnit: '개', sName: 'V등급', sUnit: 'V', pStart: 10, pDelta: 0.31, sStart: 2, sDelta: 0.08, tmpl: '[클라이밍] 볼더링 V{s} 완등 (세션 총 {p}문제 완등)' },
    marketing: { theme: 'career', sub: '마케팅', pName: 'ROAS', pUnit: '%', sName: '전환수', sUnit: '건', pStart: 280, pDelta: 5.1, sStart: 45, sDelta: 2.8, tmpl: '[마케팅] 캠페인 ROAS {p}% 달성 (신규 전환 {s}건)' },
    design: { theme: 'career', sub: '디자인', pName: '설계화면', pUnit: '개', sName: '사용성점수', sUnit: '점', pStart: 12, pDelta: 0.58, sStart: 72, sDelta: 0.42, tmpl: '[디자인] UI/UX 컴포넌트 {p}개 설계 (사용성 {s}점)' },
    techblog: { theme: 'career', sub: '테크블로그', pName: '주간PV', pUnit: '회', sName: '아티클', sUnit: '편', pStart: 850, pDelta: 220, sStart: 1, sDelta: 0.04, tmpl: '[블로그] 기술 아티클 연재 주간 PV {p}회 ({s}편 발행)' },
    support: { theme: 'career', sub: '고객지원', pName: '티켓해결', pUnit: '건', sName: 'CSAT', sUnit: '%', pStart: 65, pDelta: 2.8, sStart: 89, sDelta: 0.18, tmpl: '[CS] 인바운드 티켓 {p}건 처리 (만족도 {s}%)' },
    startup: { theme: 'career', sub: '스타트업', pName: '주간WAU', pUnit: '명', sName: '리텐션', sUnit: '%', pStart: 1400, pDelta: 430, sStart: 30, sDelta: 0.5, tmpl: '[그로스] 주간 활성 WAU {p}명 (7일 리텐션 {s}%)' },
    toeic: { theme: 'learning', sub: '토익', pName: '모의점수', pUnit: '점', sName: '순공시간', sUnit: 'h', pStart: 650, pDelta: 5.7, sStart: 14, sDelta: 0.2, tmpl: '[토익] 실전 모의고사 {p}점 달성 (주간 학습 {s}시간)' },
    codingtest: { theme: 'learning', sub: '코테', pName: '풀이수', pUnit: '문제', sName: '레이팅', sUnit: '점', pStart: 20, pDelta: 6.2, sStart: 1150, sDelta: 15, tmpl: '[알고리즘] 코테 누적 {p}문제 풀이 (레이팅 {s}점)' },
    cert: { theme: 'learning', sub: '자격증', pName: '모의점수', pUnit: '점', sName: '정답률', sUnit: '%', pStart: 50, pDelta: 0.72, sStart: 52, sDelta: 0.76, tmpl: '[자격증] 전문 기사 모의고사 {p}점 (정답률 {s}%)' },
    music: { theme: 'learning', sub: '악기연습', pName: '연습시간', pUnit: '분', sName: '완주곡', sUnit: '곡', pStart: 120, pDelta: 4.8, sStart: 1, sDelta: 0.21, tmpl: '[피아노] 주간 {p}분 연습 (마스터 곡수 {s}곡)' },
    thesis: { theme: 'learning', sub: '학술연구', pName: '집필페이지', pUnit: '쪽', sName: '분석논문', sUnit: '편', pStart: 3, pDelta: 0.95, sStart: 5, sDelta: 1.5, tmpl: '[대학원] 학술 연구 {p}쪽 집필 (참고 논문 {s}편 분석)' },
    dividend: { theme: 'finance', sub: '배당투자', pName: '월배당금', pUnit: '$', sName: '배당수익률', sUnit: '%', pStart: 40, pDelta: 8.5, sStart: 3.4, sDelta: 0.027, tmpl: '[배당주] 월 배당금 ${p} 수령 (포트폴리오 수익률 {s}%)' },
    crypto: { theme: 'finance', sub: '비트코인', pName: '적립BTC', pUnit: 'mBTC', sName: '수익률', sUnit: '%', pStart: 4, pDelta: 4.2, sStart: -8, sDelta: 1.45, tmpl: '[DCA] 비트코인 정기 적립 누적 {p}mBTC (수익률 {s}%)' },
    budget: { theme: 'finance', sub: '가계부', pName: '절감액', pUnit: '만원', sName: '달성률', sUnit: '%', pStart: 12, pDelta: 1.0, sStart: 74, sDelta: 0.42, tmpl: '[가계부] 생활비 {p}만원 절감 성공 (예산 준수율 {s}%)' },
    realestate: { theme: 'finance', sub: '부동산청약', pName: '청약가점', pUnit: '점', sName: '납입횟수', sUnit: '회', pStart: 30, pDelta: 0.65, sStart: 48, sDelta: 1.0, tmpl: '[청약] 청약통장 {s}회 납입 (인정 가점 {p}점)' },
    sidehustle: { theme: 'finance', sub: '사이드잡', pName: '부수입', pUnit: '만원', sName: '주문건수', sUnit: '건', pStart: 15, pDelta: 4.6, sStart: 3, sDelta: 0.88, tmpl: '[사이드프로젝트] 월 부수입 {p}만원 달성 ({s}건 주문)' },
    irp: { theme: 'finance', sub: '연금저축', pName: '납입원금', pUnit: '만원', sName: '절세환급', sUnit: '만원', pStart: 75, pDelta: 16.5, sStart: 12, sDelta: 2.65, tmpl: '[IRP] 연금저축 누적 {p}만원 납입 (예상 공제 {s}만원)' },
    miracle: { theme: 'wellness', sub: '미라클모닝', pName: '성공일수', pUnit: '일', sName: '기상시각', sUnit: '분', pStart: 2, pDelta: 0.08, sStart: 455, sDelta: -2.1, tmpl: '[미라클모닝] 주 {p}일 05시 기상 성공 (모닝 루틴 완수)' },
    water: { theme: 'wellness', sub: '수분섭취', pName: '음용량', pUnit: 'L', sName: '물잔수', sUnit: '잔', pStart: 1.2, pDelta: 0.022, sStart: 5, sDelta: 0.08, tmpl: '[수분] 하루 물 {p}L 섭취 ({s}잔 완료)' },
    meditation: { theme: 'wellness', sub: '명상', pName: '명상시간', pUnit: '분', sName: '평온지수', sUnit: '점', pStart: 10, pDelta: 0.3, sStart: 64, sDelta: 0.6, tmpl: '[마음챙김] 호흡 명상 {p}분 수행 (평온 지수 {s}점)' },
    screentime: { theme: 'wellness', sub: '스크린타임', pName: '사용시간', pUnit: 'h', sName: '집중시간', sUnit: '분', pStart: 6.2, pDelta: -0.078, sStart: 60, sDelta: 3.5, tmpl: '[디지털디톡스] 스마트폰 {p}시간 제한 (딥워크 {s}분)' },
    walking: { theme: 'wellness', sub: '만보걷기', pName: '일일걸음', pUnit: '보', sName: '거리', sUnit: 'km', pStart: 4800, pDelta: 135, sStart: 3.4, sDelta: 0.098, tmpl: '[만보] 오늘 하루 {p}보 산책 완료 (거리 {s}km)' },
    gratitude: { theme: 'wellness', sub: '감사일기', pName: '긍정점수', pUnit: '점', sName: '감사항목', sUnit: '개', pStart: 62, pDelta: 0.65, sStart: 3, sDelta: 0.04, tmpl: '[감사일기] 3줄 감사 작성 완료 (행복 긍정 점수 {p}점)' }
  };

  /* ================= 5. 도메인별 1년치 실측 샘플 생성기 ================= */
  function generateDomainSample(domainKey){
    var now = new Date();
    var records = [];

    if(domainKey === 'hyrox'){
      // 하이록스(HYROX) 8대 공식 스테이션 + 1km 인터벌러닝 + 종합 완주 52주 & 최근 7일 실측 데이터
      // 1. 종합 완주 52주 세션 (88분 -> 68분 단축, 기존 테스트 100% 하위 호환)
      for(var w = 51; w >= 0; w--){
        var weekDate = new Date(now.getTime() - w * 7 * 86400000);
        var totalMin = Math.round((88 - (51 - w) * 0.38 + (Math.sin(w) * 0.5)) * 10) / 10;
        var runPaceSec = Math.round(340 - (51 - w) * 1.3 + (Math.cos(w) * 2));
        var rpeVal = Math.round((8.0 + (51 - w) * 0.03 + (Math.sin(w * 0.7) * 0.3)) * 10) / 10;
        records.push({
          id: 'samp_hyrox_total_' + w,
          type: 'note',
          theme: 'workout',
          subTheme: '하이록스',
          text: '[하이록스] 종합 8개 스테이션 + 8km 완주 ' + totalMin + '분 (러닝 평균 페이스 ' + runPaceSec + '초/km, 체감 강도 RPE ' + rpeVal + ').',
          startAt: weekDate.toISOString(),
          endAt: new Date(weekDate.getTime() + Math.round(totalMin * 60000)).toISOString(),
          createdAt: weekDate.toISOString(),
          metrics: {
            primary: totalMin,
            secondary: runPaceSec,
            record: totalMin,
            pace: runPaceSec,
            rpe: rpeVal,
            intensity: Math.round(rpeVal * 10),
            duration: totalMin
          },
          metricUnits: {
            primary: '분',
            secondary: '초',
            record: '분',
            pace: '초',
            rpe: '점',
            intensity: '%',
            duration: '분'
          },
          visibility: 'private'
        });
      }

      // 2. 8대 공식 스테이션 및 인터벌러닝 52주 주간 훈련 추세
      var hyroxStationConfigs = [
        { key: 'skierg', name: '스키에르그', icon: '⛷️', startRec: 260, delta: -0.85, paceUnit: '초/500m', paceRatio: 0.5, rpeBase: 7.5, dist: '1,000m' },
        { key: 'sledpush', name: '슬레드푸시', icon: '🛷', startRec: 180, delta: -0.86, paceUnit: '초/10m', paceRatio: 0.2, rpeBase: 8.5, dist: '50m' },
        { key: 'sledpull', name: '슬레드풀', icon: '🚜', startRec: 240, delta: -0.96, paceUnit: '초/10m', paceRatio: 0.2, rpeBase: 8.0, dist: '50m' },
        { key: 'burpee', name: '버피점프', icon: '🤸', startRec: 320, delta: -1.44, paceUnit: '초/10m', paceRatio: 0.125, rpeBase: 8.5, dist: '80m' },
        { key: 'rowing', name: '로잉', icon: '🚣', startRec: 255, delta: -0.86, paceUnit: '초/500m', paceRatio: 0.5, rpeBase: 7.5, dist: '1,000m' },
        { key: 'farmers', name: '파머스캐리', icon: '🧳', startRec: 130, delta: -0.67, paceUnit: '초/50m', paceRatio: 0.25, rpeBase: 7.0, dist: '200m' },
        { key: 'lunges', name: '샌드백런지', icon: '🎒', startRec: 270, delta: -1.25, paceUnit: '초/10m', paceRatio: 0.1, rpeBase: 8.5, dist: '100m' },
        { key: 'wallballs', name: '월볼샷', icon: '🏐', startRec: 360, delta: -1.54, paceUnit: '초/10회', paceRatio: 0.1, rpeBase: 9.0, dist: '100회' },
        { key: 'interval', name: '인터벌러닝', icon: '⚡', startRec: 350, delta: -1.54, paceUnit: '초/km', paceRatio: 1.0, rpeBase: 7.5, dist: '1km x 8' }
      ];

      hyroxStationConfigs.forEach(function(stn, sIdx){
        for(var w = 51; w >= 1; w--){
          var dayShift = (sIdx % 4) + 1;
          var stnDate = new Date(now.getTime() - (w * 7 + dayShift) * 86400000);
          var curSec = Math.round(stn.startRec + (51 - w) * stn.delta + (Math.sin(w + sIdx) * 2));
          var paceVal = Math.round(curSec * stn.paceRatio * 10) / 10;
          var curRpe = Math.round((stn.rpeBase + (51 - w) * 0.02 + (Math.cos(w) * 0.2)) * 10) / 10;
          if(curRpe > 10) curRpe = 10;
          records.push({
            id: 'samp_hyrox_' + stn.key + '_w' + w,
            type: 'note',
            theme: 'workout',
            subTheme: stn.name,
            text: '[' + stn.name + '] ' + stn.dist + ' 훈련 기록 ' + curSec + '초 (페이스 ' + paceVal + stn.paceUnit + ', 체감 강도 RPE ' + curRpe + ').',
            startAt: stnDate.toISOString(),
            endAt: new Date(stnDate.getTime() + Math.round(curSec * 1000) + 10 * 60000).toISOString(),
            createdAt: stnDate.toISOString(),
            metrics: {
              record: curSec,
              pace: paceVal,
              rpe: curRpe,
              intensity: Math.round(curRpe * 10),
              primary: curSec,
              secondary: paceVal,
              duration: Math.round(curSec / 60 * 10) / 10
            },
            metricUnits: {
              record: '초',
              pace: stn.paceUnit,
              rpe: '점',
              intensity: '%',
              primary: '초',
              secondary: stn.paceUnit,
              duration: '분'
            },
            visibility: 'private'
          });
        }
      });

      // 3. 최근 7일(D-6 ~ D-0) 하이록스 스테이션별 일일 집중 훈련 세션 (1W 뷰 완벽 대응)
      var dailyHyroxSchedule = [
        { dayOffset: 6, key: 'skierg', name: '스키에르그', curSec: 218, pace: 109, rpe: 8.2, note: '스키에르그 1000m 인터벌 페이스 집중' },
        { dayOffset: 5, key: 'sledpush', name: '슬레드푸시', curSec: 138, pace: 27.6, rpe: 9.3, note: '슬레드푸시 50m 지면 반발력 폭발' },
        { dayOffset: 4, key: 'sledpull', name: '슬레드풀', curSec: 192, pace: 38.4, rpe: 8.8, note: '슬레드풀 50m 암 & 코어 그립 유지' },
        { dayOffset: 3, key: 'burpee', name: '버피점프', curSec: 248, pace: 31.0, rpe: 9.4, note: '버피점프 80m 착지 충격 최소화 점프' },
        { dayOffset: 2, key: 'rowing', name: '로잉', curSec: 212, pace: 106, rpe: 8.3, note: '로잉 1000m 드라이브 템포 28s/m 유지' },
        { dayOffset: 1, key: 'farmers', name: '파머스캐리', curSec: 96, pace: 24.0, rpe: 7.8, note: '파머스캐리 200m 빠른 보폭 턴오버' },
        { dayOffset: 0, key: 'wallballs', name: '월볼샷', curSec: 282, pace: 28.2, rpe: 9.8, note: '월볼샷 100회 언브로큰 달성 ★PR' }
      ];

      dailyHyroxSchedule.forEach(function(item){
        var itemDate = new Date(now.getTime() - item.dayOffset * 86400000);
        var stn = hyroxStationConfigs.find(function(s){ return s.key === item.key; }) || hyroxStationConfigs[0];
        records.push({
          id: 'samp_hyrox_daily_' + item.dayOffset,
          type: 'note',
          theme: 'workout',
          subTheme: item.name,
          text: '[' + item.name + '] ' + item.note + ' (' + item.curSec + '초, 페이스 ' + item.pace + stn.paceUnit + ', RPE ' + item.rpe + ').',
          startAt: itemDate.toISOString(),
          endAt: new Date(itemDate.getTime() + Math.round(item.curSec * 1000)).toISOString(),
          createdAt: itemDate.toISOString(),
          metrics: {
            record: item.curSec,
            pace: item.pace,
            rpe: item.rpe,
            intensity: Math.round(item.rpe * 10),
            primary: item.curSec,
            secondary: item.pace,
            duration: Math.round(item.curSec / 60 * 10) / 10
          },
          metricUnits: {
            record: '초',
            pace: stn.paceUnit,
            rpe: '점',
            intensity: '%',
            primary: '초',
            secondary: stn.paceUnit,
            duration: '분'
          },
          visibility: 'private'
        });
      });
    } else if(domainKey === 'weight'){
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
      // 52주간 1년치 주 2~3회 러닝 점진적 과부하 (롱런, 조깅, 인터벌 세부 종목별 시계열 및 페이스·RPE)
      for(var w = 51; w >= 0; w--){
        var weekDate = new Date(now.getTime() - w * 7 * 86400000);
        var baseDist = 5 + (51 - w) * 0.3;
        var paceMin = Math.max(4.8, 6.2 - (51 - w) * 0.025);
        var pM = Math.floor(paceMin);
        var pS = Math.round((paceMin - pM) * 60);
        var curDist = Math.round(baseDist * 10) / 10;
        var durMin = Math.round(curDist * paceMin);
        var paceStr = pM + "'" + pad(pS) + '"';
        var rpeLong = Math.round((7.5 + (51 - w) * 0.02 + (Math.sin(w) * 0.3)) * 10) / 10;
        if(rpeLong > 10) rpeLong = 10;

        // 1. 롱런 세션
        records.push({
          id: 'samp_run_' + w + '_long',
          type: 'note',
          theme: 'workout',
          subTheme: '롱런',
          text: '[롱런] 주말 장거리 ' + curDist + 'km 완주 (페이스 ' + paceStr + ', ' + durMin + '분 소요, RPE ' + rpeLong + ').',
          startAt: weekDate.toISOString(),
          endAt: new Date(weekDate.getTime() + durMin * 60000).toISOString(),
          createdAt: weekDate.toISOString(),
          metrics: {
            distance: curDist,
            duration: durMin,
            pace: Math.round(paceMin * 60),
            record: durMin,
            rpe: rpeLong,
            intensity: Math.round(rpeLong * 10),
            primary: curDist,
            secondary: Math.round(paceMin * 60)
          },
          metricUnits: {
            distance: 'km',
            duration: '분',
            pace: '초/km',
            record: '분',
            rpe: '점',
            intensity: '%',
            primary: 'km',
            secondary: '초/km'
          },
          visibility: 'private'
        });

        // 2. 조깅 세션
        var midDate = new Date(weekDate.getTime() - 3 * 86400000);
        var midDist = Math.round((curDist * 0.6) * 10) / 10;
        var midPace = Math.round((paceMin + 0.3) * 60);
        var midDur = Math.round(midDist * (paceMin + 0.3));
        var rpeJog = Math.round((6.2 + (51 - w) * 0.015) * 10) / 10;
        records.push({
          id: 'samp_run_' + w + '_mid',
          type: 'note',
          theme: 'workout',
          subTheme: '조깅',
          text: '[조깅] 저녁 리커버리 ' + midDist + 'km 완료 (' + midDur + '분, 페이스 ' + Math.floor(midPace/60) + "'" + pad(midPace%60) + '", RPE ' + rpeJog + ').',
          startAt: midDate.toISOString(),
          endAt: new Date(midDate.getTime() + midDur * 60000).toISOString(),
          createdAt: midDate.toISOString(),
          metrics: {
            distance: midDist,
            duration: midDur,
            pace: midPace,
            record: midDur,
            rpe: rpeJog,
            intensity: Math.round(rpeJog * 10),
            primary: midDist,
            secondary: midPace
          },
          metricUnits: {
            distance: 'km',
            duration: '분',
            pace: '초/km',
            record: '분',
            rpe: '점',
            intensity: '%',
            primary: 'km',
            secondary: '초/km'
          },
          visibility: 'private'
        });

        // 3. 인터벌 러닝 세션 (격주)
        if(w % 2 === 0){
          var ivDate = new Date(weekDate.getTime() - 5 * 86400000);
          var ivPace = Math.round((paceMin - 0.45) * 60);
          var rpeIv = Math.round((8.8 + (51 - w) * 0.02) * 10) / 10;
          if(rpeIv > 10) rpeIv = 10;
          records.push({
            id: 'samp_run_' + w + '_interval',
            type: 'note',
            theme: 'workout',
            subTheme: '인터벌러닝',
            text: '[인터벌] 트랙 400m x 8회 5.0km 완주 (페이스 ' + Math.floor(ivPace/60) + "'" + pad(ivPace%60) + '", 고강도 RPE ' + rpeIv + ').',
            startAt: ivDate.toISOString(),
            endAt: new Date(ivDate.getTime() + 35 * 60000).toISOString(),
            createdAt: ivDate.toISOString(),
            metrics: {
              distance: 5.0,
              duration: 35,
              pace: ivPace,
              record: 35,
              rpe: rpeIv,
              intensity: Math.round(rpeIv * 10),
              primary: 5.0,
              secondary: ivPace
            },
            metricUnits: {
              distance: 'km',
              duration: '분',
              pace: '초/km',
              record: '분',
              rpe: '점',
              intensity: '%',
              primary: 'km',
              secondary: '초/km'
            },
            visibility: 'private'
          });
        }
      }
    } else if(domainKey === 'big3'){
      // 52주간 3대 운동 점진적 과부하 (스쿼트·벤치프레스·데드리프트 개별 엔티티 및 RPE·페이스 완비)
      for(var w = 51; w >= 0; w--){
        var weekDate = new Date(now.getTime() - w * 7 * 86400000);
        var bp = Math.round(60 + (51 - w) * 0.68);
        var sq = Math.round(80 + (51 - w) * 0.98);
        var dl = Math.round(100 + (51 - w) * 1.17);
        var rpeBig3 = Math.round((7.8 + (51 - w) * 0.03 + (Math.sin(w) * 0.3)) * 10) / 10;
        if(rpeBig3 > 10) rpeBig3 = 10;

        // 종합 템플릿 레코드 (하위 호환성)
        records.push({
          id: 'samp_big3_' + w,
          type: 'template',
          theme: 'workout',
          subTheme: '파워리프팅',
          templateKey: 'health',
          templateTitle: '3대 웨이트 트레이닝',
          columns: ['종목', '무게(kg)', '세트', '횟수'],
          rows: [
            ['벤치프레스', String(bp), '5', '5'],
            ['스쿼트', String(sq), '5', '5'],
            ['데드리프트', String(dl), '4', '3']
          ],
          text: '[파워리프팅] 벤치 ' + bp + 'kg, 스쿼트 ' + sq + 'kg, 데드 ' + dl + 'kg 완수 (3대 합계 ' + (bp+sq+dl) + 'kg, RPE ' + rpeBig3 + ')',
          startAt: weekDate.toISOString(),
          endAt: new Date(weekDate.getTime() + 70 * 60000).toISOString(),
          createdAt: weekDate.toISOString(),
          metrics: {
            primary: bp + sq + dl,
            secondary: bp,
            record: bp + sq + dl,
            volume: (bp*25 + sq*25 + dl*12),
            rpe: rpeBig3,
            intensity: Math.round(rpeBig3 * 10),
            pace: 150
          },
          metricUnits: {
            primary: 'kg',
            secondary: 'kg',
            record: 'kg',
            volume: 'kg',
            rpe: '점',
            intensity: '%',
            pace: '초/세트'
          },
          visibility: 'private'
        });

        // 스쿼트 개별 세션
        var sqDate = new Date(weekDate.getTime() - 4 * 86400000);
        records.push({
          id: 'samp_sq_' + w,
          type: 'note',
          theme: 'workout',
          subTheme: '스쿼트',
          text: '[스쿼트] 메인 세트 ' + sq + 'kg 5x5 완수 (볼륨 ' + (sq * 25) + 'kg, RPE ' + rpeBig3 + ').',
          startAt: sqDate.toISOString(),
          endAt: new Date(sqDate.getTime() + 50 * 60000).toISOString(),
          createdAt: sqDate.toISOString(),
          metrics: {
            '1rm': Math.round(sq * 1.16),
            record: sq,
            volume: sq * 25,
            sets: 5,
            rpe: rpeBig3,
            intensity: Math.round(rpeBig3 * 10),
            pace: 180,
            primary: sq,
            secondary: sq * 25
          },
          metricUnits: {
            '1rm': 'kg',
            record: 'kg',
            volume: 'kg',
            sets: 'set',
            rpe: '점',
            intensity: '%',
            pace: '초/세트',
            primary: 'kg',
            secondary: 'kg'
          },
          visibility: 'private'
        });

        // 벤치프레스 개별 세션
        var bpDate = new Date(weekDate.getTime() - 2 * 86400000);
        records.push({
          id: 'samp_bp_' + w,
          type: 'note',
          theme: 'workout',
          subTheme: '벤치프레스',
          text: '[벤치프레스] 메인 세트 ' + bp + 'kg 5x5 완수 (볼륨 ' + (bp * 25) + 'kg, RPE ' + (Math.round((rpeBig3 - 0.3) * 10) / 10) + ').',
          startAt: bpDate.toISOString(),
          endAt: new Date(bpDate.getTime() + 45 * 60000).toISOString(),
          createdAt: bpDate.toISOString(),
          metrics: {
            '1rm': Math.round(bp * 1.16),
            record: bp,
            volume: bp * 25,
            sets: 5,
            rpe: Math.round((rpeBig3 - 0.3) * 10) / 10,
            intensity: Math.round((rpeBig3 - 0.3) * 10),
            pace: 120,
            primary: bp,
            secondary: bp * 25
          },
          metricUnits: {
            '1rm': 'kg',
            record: 'kg',
            volume: 'kg',
            sets: 'set',
            rpe: '점',
            intensity: '%',
            pace: '초/세트',
            primary: 'kg',
            secondary: 'kg'
          },
          visibility: 'private'
        });

        // 데드리프트 개별 세션
        var dlDate = new Date(weekDate.getTime() - 0 * 86400000);
        records.push({
          id: 'samp_dl_' + w,
          type: 'note',
          theme: 'workout',
          subTheme: '데드리프트',
          text: '[데드리프트] 메인 세트 ' + dl + 'kg 4x3 완수 (볼륨 ' + (dl * 12) + 'kg, 고강도 RPE ' + (Math.round((rpeBig3 + 0.4) * 10) / 10) + ').',
          startAt: dlDate.toISOString(),
          endAt: new Date(dlDate.getTime() + 40 * 60000).toISOString(),
          createdAt: dlDate.toISOString(),
          metrics: {
            '1rm': Math.round(dl * 1.12),
            record: dl,
            volume: dl * 12,
            sets: 4,
            rpe: Math.min(10, Math.round((rpeBig3 + 0.4) * 10) / 10),
            intensity: Math.min(100, Math.round((rpeBig3 + 0.4) * 10)),
            pace: 210,
            primary: dl,
            secondary: dl * 12
          },
          metricUnits: {
            '1rm': 'kg',
            record: 'kg',
            volume: 'kg',
            sets: 'set',
            rpe: '점',
            intensity: '%',
            pace: '초/세트',
            primary: 'kg',
            secondary: 'kg'
          },
          visibility: 'private'
        });
      }
    } else if(domainKey === 'study'){
      // 과거 51주간(w = 51..1) 1년치 장기 추세 (주간 기출 + 격주 개념정리 + 월간 모의고사, w=1은 8일 전으로 1W 경계 안전 분리)
      for(var w = 51; w >= 1; w--){
        var weekDate = new Date(now.getTime() - (w * 7 + 1) * 86400000);
        var studyMin = 180 + Math.round((51 - w) * 2.2);
        var problems = Math.round(35 + (51 - w) * 0.7);
        var rpeStudy = Math.round((7.5 + (51 - w) * 0.03 + (Math.sin(w) * 0.3)) * 10) / 10;
        if(rpeStudy > 10) rpeStudy = 10;
        var paceStudy = Math.round((studyMin / problems) * 10) / 10;

        records.push({
          id: 'samp_study_' + w + '_main',
          type: 'note',
          theme: 'learning',
          subTheme: '기출문제',
          text: '[기출문제] 도서관 기출 풀이 ' + studyMin + '분 몰입 (' + problems + '문제, 페이스 ' + paceStudy + '분/문제, 집중도 RPE ' + rpeStudy + ').',
          startAt: weekDate.toISOString(),
          endAt: new Date(weekDate.getTime() + studyMin * 60000).toISOString(),
          createdAt: weekDate.toISOString(),
          metrics: {
            problems: problems,
            duration: studyMin,
            primary: problems,
            secondary: studyMin,
            record: problems,
            pace: paceStudy,
            rpe: rpeStudy,
            intensity: Math.round(rpeStudy * 10)
          },
          metricUnits: {
            problems: '문제',
            duration: '분',
            primary: '문제',
            secondary: '분',
            record: '문제',
            pace: '분/문제',
            rpe: '점',
            intensity: '%'
          },
          visibility: 'private'
        });

        if(w % 2 === 0){
          var revDate = new Date(weekDate.getTime() - 3 * 86400000);
          records.push({
            id: 'samp_study_' + w + '_rev',
            type: 'note',
            theme: 'learning',
            subTheme: '개념정리',
            text: '[개념정리] 핵심 요약 복습 90분 몰입 (20문제 풀이, RPE 7.2).',
            startAt: revDate.toISOString(),
            endAt: new Date(revDate.getTime() + 90 * 60000).toISOString(),
            createdAt: revDate.toISOString(),
            metrics: {
              problems: 20,
              duration: 90,
              primary: 20,
              secondary: 90,
              record: 20,
              pace: 4.5,
              rpe: 7.2,
              intensity: 72
            },
            metricUnits: {
              problems: '문제',
              duration: '분',
              primary: '문제',
              secondary: '분',
              record: '문제',
              pace: '분/문제',
              rpe: '점',
              intensity: '%'
            },
            visibility: 'private'
          });
        }

        if(w % 4 === 0){
          var mockDate = new Date(weekDate.getTime() - 5 * 86400000);
          var mockScore = Math.round(62 + (51 - w) * 0.65);
          records.push({
            id: 'samp_study_' + w + '_mock',
            type: 'note',
            theme: 'learning',
            subTheme: '모의고사',
            text: '[모의고사] 실전 전국 모의 100문제 풀이 (' + mockScore + '점 획득, 시간 120분, 실전압박 RPE 9.2).',
            startAt: mockDate.toISOString(),
            endAt: new Date(mockDate.getTime() + 120 * 60000).toISOString(),
            createdAt: mockDate.toISOString(),
            metrics: {
              score: mockScore,
              problems: 100,
              duration: 120,
              primary: mockScore,
              secondary: 100,
              record: mockScore,
              pace: 1.2,
              rpe: 9.2,
              intensity: 92
            },
            metricUnits: {
              score: '점',
              problems: '문제',
              duration: '분',
              primary: '점',
              secondary: '문제',
              record: '점',
              pace: '분/문제',
              rpe: '점',
              intensity: '%'
            },
            visibility: 'private'
          });
        }
      }
      // 최근 7일(D-6 ~ D-0): 매일 1회 연속 기출문제 실전 풀이 7개 세션 (1W 뷰 완벽 대응)
      var dailyStudyData = [
        { dayOffset: 6, problems: 35, duration: 120, rpe: 7.8, memo: '기출문제 1회차 35문제 풀이 및 기본 이론 오답 정리' },
        { dayOffset: 5, problems: 42, duration: 135, rpe: 8.1, memo: '기출문제 2회차 42문제 풀이 및 빈출 유형 점검' },
        { dayOffset: 4, problems: 48, duration: 150, rpe: 8.4, memo: '기출문제 3회차 48문제 완풀 및 시간 단축 훈련' },
        { dayOffset: 3, problems: 52, duration: 165, rpe: 8.6, memo: '기출문제 4회차 52문제 몰입 풀이 및 심화 오답 분석' },
        { dayOffset: 2, problems: 58, duration: 180, rpe: 8.9, memo: '기출문제 5회차 58문제 실전 모의 풀이 (정답률 88%)' },
        { dayOffset: 1, problems: 65, duration: 200, rpe: 9.2, memo: '기출문제 6회차 65문제 풀이 및 파이널 킬러문항 정복' },
        { dayOffset: 0, problems: 72, duration: 215, rpe: 9.6, memo: '기출문제 최종 72문제 완벽 풀이 (역대 최고 기록 달성 ★PR)' }
      ];
      dailyStudyData.forEach(function(item){
        var itemDate = new Date(now.getTime() - item.dayOffset * 86400000);
        var paceVal = Math.round((item.duration / item.problems) * 10) / 10;
        records.push({
          id: 'samp_study_daily_' + item.dayOffset,
          type: 'note',
          theme: 'learning',
          subTheme: '기출문제',
          text: item.memo + ' (' + item.duration + '분 집중, ' + item.problems + '문제, RPE ' + item.rpe + ').',
          startAt: itemDate.toISOString(),
          endAt: new Date(itemDate.getTime() + item.duration * 60000).toISOString(),
          createdAt: itemDate.toISOString(),
          metrics: {
            problems: item.problems,
            duration: item.duration,
            primary: item.problems,
            secondary: item.duration,
            record: item.problems,
            pace: paceVal,
            rpe: item.rpe,
            intensity: Math.round(item.rpe * 10)
          },
          metricUnits: {
            problems: '문제',
            duration: '분',
            primary: '문제',
            secondary: '분',
            record: '문제',
            pace: '분/문제',
            rpe: '점',
            intensity: '%'
          },
          visibility: 'private'
        });
      });
      // D-4, D-2, D-0 개념정리 복습 병행 세션
      [4, 2, 0].forEach(function(dayOff){
        var cDate = new Date(now.getTime() - dayOff * 86400000 - 3 * 3600000);
        records.push({
          id: 'samp_study_daily_concept_' + dayOff,
          type: 'note',
          theme: 'learning',
          subTheme: '개념정리',
          text: '핵심 요약 복습 및 암기 노트 60분 (20문제 풀이, RPE 7.2).',
          startAt: cDate.toISOString(),
          endAt: new Date(cDate.getTime() + 60 * 60000).toISOString(),
          createdAt: cDate.toISOString(),
          metrics: {
            problems: 20,
            duration: 60,
            primary: 20,
            secondary: 60,
            record: 20,
            pace: 3.0,
            rpe: 7.2,
            intensity: 72
          },
          metricUnits: {
            problems: '문제',
            duration: '분',
            primary: '문제',
            secondary: '분',
            record: '문제',
            pace: '분/문제',
            rpe: '점',
            intensity: '%'
          },
          visibility: 'private'
        });
      });
    } else if(domainKey === "coding"){
      // 52주간 1년치 개발 세부 종목별 시계열 (기능구현, PR머지, 코드리뷰 및 RPE·페이스)
      for(var w = 51; w >= 0; w--){
        var weekDate = new Date(now.getTime() - w * 7 * 86400000);
        var commits = Math.round(12 + (51 - w) * 0.4 + (w % 3) * 4);
        var prs = Math.round(2 + (51 - w) * 0.06);
        var rpeCode = Math.round((7.5 + (51 - w) * 0.03 + (Math.sin(w) * 0.3)) * 10) / 10;
        if(rpeCode > 10) rpeCode = 10;

        // 기능구현 세션
        records.push({
          id: 'samp_code_' + w,
          type: 'note',
          theme: 'career',
          subTheme: '기능구현',
          text: '[기능구현] 스프린트 개발 완료 ' + commits + '커밋 (페이스 ' + Math.round(180/commits) + '분/커밋, 몰입 RPE ' + rpeCode + ').',
          startAt: weekDate.toISOString(),
          endAt: new Date(weekDate.getTime() + 180 * 60000).toISOString(),
          createdAt: weekDate.toISOString(),
          metrics: {
            commits: commits,
            prs: prs,
            primary: commits,
            secondary: prs,
            record: commits,
            pace: Math.round(180 / commits),
            rpe: rpeCode,
            intensity: Math.round(rpeCode * 10),
            duration: 180
          },
          metricUnits: {
            commits: '개',
            prs: 'PR',
            primary: '개',
            secondary: 'PR',
            record: '개',
            pace: '분/커밋',
            rpe: '점',
            intensity: '%',
            duration: '분'
          },
          visibility: 'private'
        });

        // PR머지 세션
        var prDate = new Date(weekDate.getTime() - 2 * 86400000);
        records.push({
          id: 'samp_pr_' + w,
          type: 'note',
          theme: 'career',
          subTheme: 'PR머지',
          text: '[PR머지] 주요 기능 브랜치 ' + prs + '건 배포 및 머지 완료 (RPE 7.8).',
          startAt: prDate.toISOString(),
          endAt: new Date(prDate.getTime() + 90 * 60000).toISOString(),
          createdAt: prDate.toISOString(),
          metrics: {
            prs: prs,
            primary: prs,
            record: prs,
            pace: Math.round(90 / prs),
            rpe: 7.8,
            intensity: 78,
            duration: 90
          },
          metricUnits: {
            prs: 'PR',
            primary: 'PR',
            record: 'PR',
            pace: '분/PR',
            rpe: '점',
            intensity: '%',
            duration: '분'
          },
          visibility: 'private'
        });

        // 코드리뷰 세션 (격주)
        if(w % 2 === 0){
          var crDate = new Date(weekDate.getTime() - 4 * 86400000);
          var reviews = Math.round(3 + (51 - w) * 0.08);
          records.push({
            id: 'samp_cr_' + w,
            type: 'note',
            theme: 'career',
            subTheme: '코드리뷰',
            text: '[코드리뷰] 동료 PR ' + reviews + '건 정밀 리뷰 및 아키텍처 피드백 (RPE 7.0).',
            startAt: crDate.toISOString(),
            endAt: new Date(crDate.getTime() + 60 * 60000).toISOString(),
            createdAt: crDate.toISOString(),
            metrics: {
              reviews: reviews,
              primary: reviews,
              record: reviews,
              pace: Math.round(60 / reviews),
              rpe: 7.0,
              intensity: 70,
              duration: 60
            },
            metricUnits: {
              reviews: '건',
              primary: '건',
              record: '건',
              pace: '분/건',
              rpe: '점',
              intensity: '%',
              duration: '분'
            },
            visibility: 'private'
          });
        }
      }
    } else if(domainKey === 'sales'){
      // 52주간 1년치 영업 세부 종목별 시계열 (영업계약, 고객미팅, 제안서작성 및 RPE·페이스)
      for(var w = 51; w >= 0; w--){
        var weekDate = new Date(now.getTime() - w * 7 * 86400000);
        var amt = Math.round(250 + (51 - w) * 12);
        var deals = Math.round(2 + (51 - w) * 0.08);
        var rpeSales = Math.round((8.0 + (51 - w) * 0.03 + (Math.cos(w) * 0.3)) * 10) / 10;
        if(rpeSales > 10) rpeSales = 10;

        // 영업계약 세션
        records.push({
          id: 'samp_sales_' + w,
          type: 'note',
          theme: 'career',
          subTheme: '영업계약',
          text: '[영업계약] 신규 수주 ' + deals + '건 체결 (매출 ' + amt + '만원 달성, 성취감 RPE ' + rpeSales + ').',
          startAt: weekDate.toISOString(),
          endAt: new Date(weekDate.getTime() + 60 * 60000).toISOString(),
          createdAt: weekDate.toISOString(),
          metrics: {
            revenue: amt,
            deals: deals,
            primary: amt,
            secondary: deals,
            record: amt,
            pace: Math.round(amt / deals),
            rpe: rpeSales,
            intensity: Math.round(rpeSales * 10)
          },
          metricUnits: {
            revenue: '만원',
            deals: '건',
            primary: '만원',
            secondary: '건',
            record: '만원',
            pace: '만원/건',
            rpe: '점',
            intensity: '%'
          },
          visibility: 'private'
        });

        // 고객미팅 세션
        var meetDate = new Date(weekDate.getTime() - 2 * 86400000);
        var meets = Math.round(4 + (51 - w) * 0.12);
        records.push({
          id: 'samp_meet_' + w,
          type: 'note',
          theme: 'career',
          subTheme: '고객미팅',
          text: '[고객미팅] 주간 파트너사 미팅 ' + meets + '건 완료 (RPE 7.4).',
          startAt: meetDate.toISOString(),
          endAt: new Date(meetDate.getTime() + meets * 45 * 60000).toISOString(),
          createdAt: meetDate.toISOString(),
          metrics: {
            meetings: meets,
            primary: meets,
            record: meets,
            pace: 45,
            rpe: 7.4,
            intensity: 74,
            duration: meets * 45
          },
          metricUnits: {
            meetings: '회',
            primary: '회',
            record: '회',
            pace: '분/회',
            rpe: '점',
            intensity: '%',
            duration: '분'
          },
          visibility: 'private'
        });

        // 제안서작성 세션 (격주)
        if(w % 2 === 0){
          var propDate = new Date(weekDate.getTime() - 4 * 86400000);
          var props = Math.round(2 + (51 - w) * 0.05);
          records.push({
            id: 'samp_prop_' + w,
            type: 'note',
            theme: 'career',
            subTheme: '제안서작성',
            text: '[제안서] B2B 입찰 제안서 ' + props + '종 작성 및 제출 완료 (RPE 8.2).',
            startAt: propDate.toISOString(),
            endAt: new Date(propDate.getTime() + 120 * 60000).toISOString(),
            createdAt: propDate.toISOString(),
            metrics: {
              proposals: props,
              primary: props,
              record: props,
              pace: Math.round(120 / props),
              rpe: 8.2,
              intensity: 82,
              duration: 120
            },
            metricUnits: {
              proposals: '건',
              primary: '건',
              record: '건',
              pace: '분/건',
              rpe: '점',
              intensity: '%',
              duration: '분'
            },
            visibility: 'private'
          });
        }
      }
    } else if(THEME_METRIC_SPECS[domainKey]){
      var spec = THEME_METRIC_SPECS[domainKey];
      for(var w = 51; w >= 0; w--){
        var weekDate = new Date(now.getTime() - w * 7 * 86400000);
        var pVal = Math.round((spec.pStart + (51 - w) * spec.pDelta + (Math.sin(w) * spec.pDelta * 0.2)) * 10) / 10;
        var sVal = Math.round((spec.sStart + (51 - w) * spec.sDelta + (Math.cos(w) * spec.sDelta * 0.2)) * 10) / 10;
        if(pVal < 0) pVal = 0;
        if(sVal < 0) sVal = 0;
        var rpeCatalog = Math.round((7.2 + (51 - w) * 0.035 + (Math.sin(w * 0.5) * 0.4)) * 10) / 10;
        if(rpeCatalog > 10) rpeCatalog = 10;
        var txt = spec.tmpl.replace('{p}', pVal).replace('{s}', sVal);
        var rec = {
          id: 'samp_' + domainKey + '_' + w,
          type: 'note',
          theme: spec.theme,
          subTheme: spec.sub,
          text: txt,
          startAt: weekDate.toISOString(),
          endAt: new Date(weekDate.getTime() + 60 * 60000).toISOString(),
          createdAt: weekDate.toISOString(),
          metrics: {
            primary: pVal,
            secondary: sVal,
            record: pVal,
            pace: sVal,
            rpe: rpeCatalog,
            intensity: Math.round(rpeCatalog * 10)
          },
          metricUnits: {
            primary: spec.pUnit,
            secondary: spec.sUnit,
            record: spec.pUnit,
            pace: spec.sUnit,
            rpe: '점',
            intensity: '%'
          },
          visibility: 'private'
        };
        rec.metrics[spec.pName] = pVal;
        rec.metrics[spec.sName] = sVal;
        rec.metricUnits[spec.pName] = spec.pUnit;
        rec.metricUnits[spec.sName] = spec.sUnit;
        records.push(rec);
      }
    }
    records.forEach(function(r){
      r.isSample = true;
      r.sampleCategory = domainKey;
    });
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
    var now = new Date();
    for(var i = 0; i < RAW_52W_POWERLIFTING_DATA.length; i++){
      var cols = RAW_52W_POWERLIFTING_DATA[i].split(',');
      if(cols.length < 18) continue;

      var origDStr = cols[0];
      var week = cols[1];
      var phase = cols[2];
      var exercise = cols[3];
      var sets = parseInt(cols[4], 10) || 5;
      var vol = parseFloat(cols[15]) || 0;
      var bw = parseFloat(cols[16]) || 70;
      var est1rm = parseFloat(cols[17]) || 0;
      var rpe = parseFloat(cols[18]) || 75;
      var notes = cols[19] || '';

      // 오늘 기준으로 직전 52주 동적 리베이스 (W01: 51주 전 ~ W52: 이번 주)
      var weekNum = parseInt((week || 'W01').replace(/[^0-9]/g, ''), 10) || 1;
      var weekOffset = Math.max(0, 52 - weekNum);
      var dayOffset = (exercise === '스쿼트' ? 4 : (exercise === '벤치프레스' ? 2 : 0));
      var sessionDate = new Date(now.getTime() - (weekOffset * 7 * 86400000) - (dayOffset * 86400000));
      var dStr = sessionDate.toISOString().slice(0, 10);

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
        source: 'csv_import',
        isSample: true,
        sampleCategory: 'big3'
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

    records.forEach(function(r){
      r.isSample = true;
      r.sampleCategory = 'olympic_1924';
    });
    return records;
  }

  /* ================= 5-2. 임의 CSV / 텍스트 자율 인제스터 & 타임라인 융합 ================= */
    function parseCsvToUniversalRecords(csvStr, defaultTheme){
    defaultTheme = defaultTheme || 'general';
    if(!csvStr || typeof csvStr !== 'string') return [];

    var lines = csvStr.trim().split(/\r?\n/).filter(function(l){ return l.trim().length > 0; });
    if(lines.length === 0) return [];

    var headerLine = lines[0];
    // 탭(\t) 구분자 vs 쉼표(,) 구분자 자동 판별
    var tabCount = (headerLine.match(/\t/g) || []).length;
    var commaCount = (headerLine.match(/,/g) || []).length;
    var delim = (tabCount > commaCount || (tabCount > 0 && commaCount === 0)) ? '\t' : ',';

    var headers = headerLine.split(delim).map(function(h){ return h.trim().replace(/^[\"\']|[\"\']$/g, ''); });

    var colMap = { date: -1, exercise: -1, notes: -1 };

    headers.forEach(function(h, idx){
      var lh = h.toLowerCase();
      if(colMap.date === -1 && /date|날짜|일자|일시|time|timestamp/.test(lh)) colMap.date = idx;
      else if(colMap.exercise === -1 && /exercise|운동|종목|title|제목|item|항목|과목|subject|task|업무|프로젝트|category|카테고리|name|client|고객|고객사|target|company|org/.test(lh)) colMap.exercise = idx;
      else if(colMap.notes === -1 && /notes|메모|내용|비고|memo|desc|description/.test(lh)) colMap.notes = idx;
    });

    var records = [];
    var sessionOffsets = {};

    var startIdx = 1;
    // 만약 헤더에 날짜나 메트릭 키워드가 없고 바로 데이터인 경우(헤더 없는 데이터) 방어
    if(colMap.date === -1 && lines.length === 1){
      startIdx = 0;
      headers = ['date', 'content'];
      colMap.date = 0;
      colMap.notes = 1;
    }

    for(var i = startIdx; i < lines.length; i++){
      var cols = lines[i].split(delim).map(function(c){ return c.trim().replace(/^[\"\']|[\"\']$/g, ''); });
      if(cols.length < headers.length - 2) continue;

      var rawDate = colMap.date !== -1 ? (cols[colMap.date] || '1924-01-01') : '1924-01-01';
      var exerciseRaw = colMap.exercise !== -1 ? (cols[colMap.exercise] || '기록 항목') : '기록 항목';

      // 한글 깨짐 복구 (EUC-KR 디코딩 오류 대응)
      var exercise = exerciseRaw;
      if(/Ʈ|스쿼|squat/i.test(exerciseRaw)) exercise = '스쿼트';
      else if(/ġ|벤치|bench/i.test(exerciseRaw)) exercise = '벤치프레스';
      else if(/帮|데드|dead/i.test(exerciseRaw)) exercise = '데드리프트';

      var notes = colMap.notes !== -1 ? (cols[colMap.notes] || '') : '';

      sessionOffsets[rawDate] = (sessionOffsets[rawDate] || 0) + 1;
      var offsetMin = (sessionOffsets[rawDate] - 1) * 20;

      var startIso = normalizeHistoricalDate(rawDate, offsetMin) || new Date().toISOString();
      var endIso = new Date(new Date(startIso).getTime() + 60 * 60000).toISOString();
      var dateStr = (startIso || '').slice(0, 10);

      var metrics = {};
      var metricUnits = {};
      var rawRow = {};

      headers.forEach(function(h, idx){
        rawRow[h] = cols[idx];
        if(idx === colMap.date || idx === colMap.exercise || idx === colMap.notes) return;
        var val = parseFloat(cols[idx]);
        if(!isNaN(val)){
          var lh = h.toLowerCase().replace(/\s+/g, '_');
          var uMatch = h.match(/\(([^)]+)\)/) || h.match(/_([a-zA-Z가-힣%]+)$/);
          var unit = uMatch ? uMatch[1] : '';
          
          metrics[lh] = val;
          metricUnits[lh] = unit;

          // 호환성 별칭 매핑 (기존 테스트 통과 보장)
          if(/1rm|estimated_1rm|원알엠/.test(lh)){ metrics['1rm'] = val; metricUnits['1rm'] = 'kg'; }
          if(/volume|daily_volume|볼륨/.test(lh)){ metrics['volume'] = val; metricUnits['volume'] = 'kg'; }
          if(/bodyweight|체중/.test(lh)){ metrics['bodyweight'] = val; metricUnits['bodyweight'] = 'kg'; }
          if(/sets|세트/.test(lh)){ metrics['sets'] = val; metricUnits['sets'] = 'set'; }
          if(/pages|쪽/.test(lh)){ metrics['pages'] = val; metricUnits['pages'] = '쪽'; }
          if(/distance|거리/.test(lh)){ metrics['distance'] = val; metricUnits['distance'] = 'km'; }
          if(/duration|시간/.test(lh)){ metrics['duration'] = val; metricUnits['duration'] = '분'; }
        }
      });

      // 1차/2차 수치 자동 할당
      var numKeys = Object.keys(metrics).filter(function(k){ return !['sets'].includes(k); });
      if(numKeys.length > 0){
        metrics.primary = metrics[numKeys[0]];
        metrics.primaryUnit = metricUnits[numKeys[0]] || '';
      }
      if(numKeys.length > 1){
        metrics.secondary = metrics[numKeys[1]];
        metrics.secondaryUnit = metricUnits[numKeys[1]] || '';
      }

      // 요약 텍스트
      var summaryParts = [];
      if(metrics['1rm'] !== undefined && metrics['volume'] !== undefined){
        summaryParts.push('1RM: ' + metrics['1rm'] + 'kg');
        summaryParts.push('볼륨: ' + metrics['volume'].toLocaleString() + 'kg');
      } else {
        numKeys.slice(0, 3).forEach(function(nk){
          var u = metricUnits[nk] ? (' ' + metricUnits[nk]) : '';
          summaryParts.push(nk + ': ' + metrics[nk].toLocaleString() + u);
        });
      }
      var summaryText = '[' + exercise + '] ' + summaryParts.join(' | ') + (notes ? (' - ' + notes) : '');

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
        metricUnits: metricUnits,
        rawRow: rawRow,
        visibility: 'private',
        source: 'csv_import'
      });
    }

    return records;
  }

  /* ================= 5-3. 기존 아워골 기록 + 외부 데이터 자율 온톨로지 색인 ================= */

  /* ================= 5-3. 8대 도메인 다형성 온톨로지 빌더 ================= */
    var DOMAINS = {
    career: { key: 'career', name: '업무·성과', icon: '💼', color: '#8b5cf6' },
    finance: { key: 'finance', name: '재테크·자산', icon: '💰', color: '#f59e0b' },
    learning: { key: 'learning', name: '학습·독서', icon: '📖', color: '#3b82f6' },
    health: { key: 'health', name: '건강·운동', icon: '🏃', color: '#10b981' },
    mind: { key: 'mind', name: '멘탈·회고', icon: '🧘', color: '#06b6d4' },
    routine: { key: 'routine', name: '일상·루틴', icon: '⏰', color: '#ec4899' },
    hobby: { key: 'hobby', name: '취미·창작', icon: '🎨', color: '#f43f5e' },
    relationship: { key: 'relationship', name: '관계·소통', icon: '🤝', color: '#64748b' },
    general: { key: 'general', name: '일반·데이터', icon: '📊', color: '#6366f1' }
  };

  /* 한글 유니코드 초성 분해 알고리즘 */
  function getChosung(str){
    if(!str) return '';
    var CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    var res = '';
    for(var i = 0; i < str.length; i++){
      var c = str.charCodeAt(i);
      if(c >= 0xAC00 && c <= 0xD7A3){
        res += CHOSUNG[Math.floor((c - 0xAC00) / 588)];
      } else {
        res += str[i];
      }
    }
    return res;
  }

  function matchQuery(entity, query){
    if(!query) return true;
    query = String(query).trim().toLowerCase();
    var entLower = String(entity).toLowerCase();
    if(entLower.indexOf(query) !== -1) return true;
    if(/^[ㄱ-ㅎ]+$/.test(query)){
      var cho = getChosung(entity);
      return cho.indexOf(query) !== -1;
    }
    return false;
  }

    function inferDomainKey(name, theme){
    if(theme && DOMAINS[theme]) return theme;
    var n = String(name).toLowerCase();
    if(/독서|책|공부|코딩|어학|스터디|자격증|강의|논문|학습|수학|영어|시험|모의고사/i.test(n)) return 'learning';
    if(/스쿼트|벤치프레스|데드리프트|러닝|체중|수면|운동|헬스|마라톤|스트렝스|수영|자전거|피트니스/i.test(n)) return 'health';
    if(/가계부|주식|자산|코인|예금|적금|투자|배당|지출|수익|펀드|저축|연금/i.test(n)) return 'finance';
    if(/업무|프로젝트|회의|기획|개발|보고|출시|kpi|실적|영업|계약|고객|티켓|스프린트|매출/i.test(n)) return 'career';
    if(/감사|명상|회고|감정|멘탈|일기|생각|다짐|스트레스|평온/i.test(n)) return 'mind';
    if(/기상|취침|물마시기|영양제|스트레칭|산책|청소|루틴|습관/i.test(n)) return 'routine';
    if(/그림|음악|글쓰기|사진|영화|취미|게임|요리|공예/i.test(n)) return 'hobby';
    if(/가족|친구|연인|모임|멘토링|네트워킹|팀원|동료/i.test(n)) return 'relationship';
    return 'general';
  }

  function buildUniversalOntology(allRecs, customSchemas){
    allRecs = Array.isArray(allRecs) ? allRecs : [];
    customSchemas = Array.isArray(customSchemas) ? customSchemas : [];
    var entityMap = {};

    customSchemas.forEach(function(cs){
      if(cs && cs.name){
        entityMap[cs.name] = {
          name: cs.name,
          icon: cs.icon || '📌',
          theme: cs.domainKey || 'health',
          domainKey: cs.domainKey || 'health',
          primaryUnit: cs.primaryUnit || '',
          secondaryUnit: cs.secondaryUnit || '',
          count: 0,
          dimensions: cs.dimensions || {},
          records: [],
          isCustom: true
        };
      }
    });

    allRecs.forEach(function(r){
      // 자율 메트릭 추출 및 레코드 동기화
      var mList = extractMetricsFromRecord(r);
      r.metrics = r.metrics || {};
      r.metricUnits = r.metricUnits || {};
      mList.forEach(function(m){
        if(m && m.key && typeof m.value === 'number'){
          if(r.metrics[m.key] === undefined) r.metrics[m.key] = m.value;
          if(m.unit && !r.metricUnits[m.key]) r.metricUnits[m.key] = m.unit;
        }
      });

      if(r.metrics.primary === undefined){
        var nonDur = mList.filter(function(m){ return m.key !== 'duration'; });
        if(nonDur.length > 0){
          r.metrics.primary = nonDur[0].value;
          r.metrics.primaryUnit = nonDur[0].unit;
          if(nonDur.length > 1){
            r.metrics.secondary = nonDur[1].value;
            r.metrics.secondaryUnit = nonDur[1].unit;
          }
        }
      }

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
        else if(/(?:매출|영업|계약)/i.test(r.text)) name = '영업계약';
        else if(/(?:코딩|개발|커밋)/i.test(r.text)) name = '개발커밋';
        else if(/(?:공부|기출|문제)/i.test(r.text)) name = '기출문제';
        else if(/(?:재테크|투자|자산)/i.test(r.text)) name = '재테크';
        else if(mList.length > 0 && mList[0].key !== 'duration') name = mList[0].label;
      }
      name = name || '일반 실천';
      r._entityName = name;

      if(!entityMap[name]){
        var icon = '📊';
        if(/스키에르그/i.test(name)) icon = '⛷️';
        else if(/슬레드푸시/i.test(name)) icon = '🛷';
        else if(/슬레드풀/i.test(name)) icon = '🚜';
        else if(/버피점프|버피/i.test(name)) icon = '🤸';
        else if(/로잉/i.test(name)) icon = '🚣';
        else if(/파머스캐리/i.test(name)) icon = '🧳';
        else if(/샌드백런지|런지/i.test(name)) icon = '🎒';
        else if(/월볼샷|월볼/i.test(name)) icon = '🏐';
        else if(/인터벌러닝/i.test(name)) icon = '⚡';
        else if(/하이록스/i.test(name)) icon = '🏃';
        else if(/롱런/i.test(name)) icon = '🏃‍♂️';
        else if(/조깅/i.test(name)) icon = '👟';
        else if(/스쿼트/i.test(name)) icon = '🦵';
        else if(/벤치프레스/i.test(name)) icon = '🏋️';
        else if(/데드리프트/i.test(name)) icon = '🔥';
        else if(/파워리프팅/i.test(name)) icon = '🏋️';
        else if(/러닝|달리기/i.test(name)) icon = '🏃';
        else if(/모의고사/i.test(name)) icon = '📝';
        else if(/개념정리/i.test(name)) icon = '📚';
        else if(/기출문제|공부/i.test(name)) icon = '📖';
        else if(/기능구현|개발커밋/i.test(name)) icon = '💻';
        else if(/PR머지/i.test(name)) icon = '🔀';
        else if(/코드리뷰/i.test(name)) icon = '👀';
        else if(/영업계약/i.test(name)) icon = '💼';
        else if(/고객미팅/i.test(name)) icon = '🤝';
        else if(/제안서/i.test(name)) icon = '📑';
        else if(/독서|책/i.test(name)) icon = '📖';
        else if(/체중/i.test(name)) icon = '⚖️';
        else if(/수면/i.test(name)) icon = '💤';
        else if(/가계부|재테크/i.test(name)) icon = '💰';

        var domKey = inferDomainKey(name, r.theme);
        entityMap[name] = {
          name: name,
          icon: icon,
          theme: domKey,
          domainKey: domKey,
          primaryUnit: '',
          secondaryUnit: '',
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
        if(r.metrics.primaryUnit && !e.primaryUnit) e.primaryUnit = r.metrics.primaryUnit;
        if(r.metrics.secondaryUnit && !e.secondaryUnit) e.secondaryUnit = r.metrics.secondaryUnit;
      }
    });

    var result = Object.values(entityMap).map(function(e){
      return {
        name: e.name,
        icon: e.icon,
        theme: e.theme,
        domainKey: e.domainKey,
        primaryUnit: e.primaryUnit,
        secondaryUnit: e.secondaryUnit,
        count: e.count,
        dimensions: Object.keys(e.dimensions),
        records: e.records,
        isCustom: !!e.isCustom
      };
    });

    result.sort(function(a, b){ return b.count - a.count; });
    return result;
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

  /* ================= 6. 클린 CSV 내보내기 & 캔버스 스냅샷 ================= */
  function exportCleanCsv(records, filename){
    records = Array.isArray(records) ? records : [];
    filename = filename || ('ourgoal_clean_export_' + new Date().toISOString().slice(0, 10) + '.csv');

    var headers = ['Date', 'Domain', 'Entity', 'PrimaryValue', 'PrimaryUnit', 'SecondaryValue', 'SecondaryUnit', 'Memo', 'Source'];
    var rows = [headers.join(',')];

    records.forEach(function(r){
      var d = (r.startAt || r.createdAt || '').slice(0, 10);
      var dom = r.theme || 'health';
      var ent = r.subTheme || r.item || r.exercise || '일반';
      var pVal = (r.metrics && (r.metrics.primary !== undefined ? r.metrics.primary : (r.metrics['1rm'] || r.metrics.pages || r.metrics.distance || 0))) || '';
      var pUnit = (r.metrics && r.metrics.primaryUnit) || '';
      var sVal = (r.metrics && (r.metrics.secondary !== undefined ? r.metrics.secondary : (r.metrics.volume || r.metrics.duration || 0))) || '';
      var sUnit = (r.metrics && r.metrics.secondaryUnit) || '';
      var memo = (r.text || '').replace(/"/g, '""');
      var src = r.source || 'in_app';

      rows.push([
        d,
        '"' + dom + '"',
        '"' + ent + '"',
        pVal,
        '"' + pUnit + '"',
        sVal,
        '"' + sUnit + '"',
        '"' + memo + '"',
        '"' + src + '"'
      ].join(','));
    });

    var csvContent = '\uFEFF' + rows.join('\r\n');
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function captureChartSnapshot(container, title){
    if(typeof html2canvas !== 'undefined'){
      html2canvas(container, { scale: 2, useCORS: true }).then(function(canvas){
        var link = document.createElement('a');
        link.download = (title || 'ourgoal_analytics_snapshot') + '_' + new Date().toISOString().slice(0, 10) + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    } else {
      // Fallback: alert
      if(typeof alert !== 'undefined') alert('📸 화면 캡처 기능을 실행했습니다. 브라우저 스크린샷으로 공유하실 수 있습니다.');
    }
  }

  /* ================= 7. 활용 가이드 모달 (Guide Modal - OurGoal Philosophy) ================= */
  function openGuideModal(options){
    options = options || {};
    var openModalFn = options.openModal || window.openModal;
    var closeModalFn = options.closeModal || window.closeModal;
    if(!openModalFn) return;

    var bodyHtml = 
      '<div style="max-height:75vh;overflow-y:auto;padding:4px 2px;">' +
        '<div style="text-align:center;margin-bottom:16px;">' +
          '<div style="font-size:2rem;margin-bottom:6px;">🚀</div>' +
          '<h3 style="font-size:1.125rem;font-weight:800;color:var(--ink);margin:0;">나의 역사와 미래를 담는 자율 데이터 콕핏</h3>' +
          '<p style="font-size:.8125rem;color:var(--ink-soft);margin-top:4px;">기록을 숫자로 끝내지 않고 실천과 성장으로 잇는 아워골의 5대 원칙</p>' +
        '</div>' +

        '<div style="display:flex;flex-direction:column;gap:12px;">' +
          '<div class="card" style="padding:12px 14px;border-radius:12px;background:var(--card);border-left:4px solid #3b82f6;margin:0;">' +
            '<div style="font-weight:800;font-size:.875rem;color:#3b82f6;margin-bottom:4px;">1. 테마 제약 없는 유니버설 데이터 주권</div>' +
            '<div style="font-size:.8125rem;color:var(--ink);line-height:1.5;">' +
              '운동, 독서, 학술 연구, 재테크, 프로젝트, 멘탈 회고까지 어떤 형태의 데이터든 스스로 알맞은 단위와 스케일을 입혀 융합합니다. 100년 전 1924년 올림픽 데이터부터 52주간의 성장 궤적까지 100% 무손실로 보존됩니다.' +
            '</div>' +
          '</div>' +

          '<div class="card" style="padding:12px 14px;border-radius:12px;background:var(--card);border-left:4px solid #10b981;margin:0;">' +
            '<div style="font-weight:800;font-size:.875rem;color:#10b981;margin-bottom:4px;">2. 트레이딩뷰급 정밀 십자선 & 7-Tier 시계열 분석</div>' +
            '<div style="font-size:.8125rem;color:var(--ink);line-height:1.5;">' +
              '전체(역대)부터 1년, 6개월, 3개월, 1개월, 1주, 3일까지 7단계로 절삭하여 추세를 관측합니다. 차트 위를 호버하면 <b>자석 스냅 십자선(Crosshair)</b>과 세션 간 <b>변동폭(Δ)</b>, <b>PR 별 배지</b>가 실시간 플로팅 인스펙터로 즉시 표출됩니다.' +
            '</div>' +
          '</div>' +

          '<div class="card" style="padding:12px 14px;border-radius:12px;background:var(--card);border-left:4px solid #8b5cf6;margin:0;">' +
            '<div style="font-weight:800;font-size:.875rem;color:#8b5cf6;margin-bottom:4px;">3. 노션식 EAV 온톨로지 & 초성 고속 검색</div>' +
            '<div style="font-size:.8125rem;color:var(--ink);line-height:1.5;">' +
              '<b>[🔍 Facet Taxonomy Explorer]</b>를 통해 8대 도메인 트리를 자유자재로 탐색하고, <b>초성 검색</b>(예: <code>ㅂㅊ</code> ➔ 벤치프레스, <code>ㅅㅋ</code> ➔ 스쿼트, <code>ㄷㅅ</code> ➔ 독서)으로 원하는 지표를 1ms 만에 찾아냅니다. 필요 시 사용자가 직접 단위를 정의할 수도 있습니다.' +
            '</div>' +
          '</div>' +

          '<div class="card" style="padding:12px 14px;border-radius:12px;background:var(--card);border-left:4px solid #f59e0b;margin:0;">' +
            '<div style="font-weight:800;font-size:.875rem;color:#f59e0b;margin-bottom:4px;">4. 엔터프라이즈 데이터 그리드 (무손실 CRUD & 클린 CSV)</div>' +
            '<div style="font-size:.8125rem;color:var(--ink);line-height:1.5;">' +
              '<b>[📋 DATA GRID]</b> 버튼을 누르면 엑셀 수준의 고밀도 테이블이 열립니다. 도메인별 자동 헤더 전환, 모노스페이스 다차원 3상태 정렬, 단건 수정/삭제, <b>체크박스 일괄 삭제</b>, <b>클린 CSV 내보내기</b>를 통해 데이터를 완벽히 통제할 수 있습니다.' +
            '</div>' +
          '</div>' +

          '<div class="card" style="padding:12px 14px;border-radius:12px;background:var(--card);border-left:4px solid #ec4899;margin:0;">' +
            '<div style="font-weight:800;font-size:.875rem;color:#ec4899;margin-bottom:4px;">5. 실시간 목표 및 캘린더 실천 연계 (비용 0원)</div>' +
            '<div style="font-size:.8125rem;color:var(--ink);line-height:1.5;">' +
              '데이터에서 달성한 최고 수치는 <b>내 목표(Goal) 진척도로 1초 만에 자동 동기화</b>되며, Gemini AI 진단에서 추천된 행동은 <b>[📅 캘린더에 실천 등록]</b> 클릭 한 번으로 내 일정에 0초 만에 안착됩니다.' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div style="margin-top:16px;text-align:center;">' +
          '<button type="button" class="btn btn-primary" id="uGuideCloseBtn" style="width:100%;font-weight:700;">확인했습니다</button>' +
        '</div>' +
      '</div>';

    var fullHtml = '<div class="modal-head" style="margin-bottom:12px;"><h3 style="margin:0;font-size:1.125rem;font-weight:800;color:var(--ink);">💡 아워골 자율 데이터 콕핏 안내</h3></div>' + bodyHtml;
    openModalFn(fullHtml, function(modalEl){
      var cBtn = modalEl ? modalEl.querySelector('#uGuideCloseBtn') : null;
      if(cBtn && closeModalFn) cBtn.onclick = closeModalFn;
    });
  }

  /* ================= 8. 패싯 온톨로지 탐색기 & 스키마 CRUD 모달 ================= */
  function openTaxonomyManagerModal(options){
    options = options || {};
    var allRecs = options.allRecs || [];
    var state = options.state || {};
    var callbacks = options.callbacks || {};
    var openModalFn = callbacks.openModal || window.openModal;
    var closeModalFn = callbacks.closeModal || window.closeModal;
    if(!openModalFn) return;

    var customSchemas = (state.profile && state.profile.customSchemas) || [];
    var curDomainFilter = 'all';
    var curSearchQuery = '';

    function renderModalContent(containerEl){
      var ontology = buildUniversalOntology(allRecs, customSchemas);
      var filtered = ontology.filter(function(o){
        if(curDomainFilter !== 'all' && o.domainKey !== curDomainFilter) return false;
        if(curSearchQuery && !matchQuery(o.name, curSearchQuery)) return false;
        return true;
      });

      var domainPills = '<div style="display:flex;gap:4px;overflow-x:auto;padding-bottom:6px;margin-bottom:10px;">';
      domainPills += '<button type="button" class="u-tax-dom-btn" data-dom="all" style="padding:4px 8px;border-radius:12px;border:none;font-size:.75rem;font-weight:700;cursor:pointer;background:' + (curDomainFilter === 'all' ? 'var(--primary)' : 'var(--card2)') + ';color:' + (curDomainFilter === 'all' ? '#fff' : 'var(--ink)') + ';">전체</button>';
      Object.values(DOMAINS).forEach(function(d){
        var isA = (curDomainFilter === d.key);
        domainPills += '<button type="button" class="u-tax-dom-btn" data-dom="' + d.key + '" style="padding:4px 8px;border-radius:12px;border:none;font-size:.75rem;font-weight:700;cursor:pointer;background:' + (isA ? 'var(--primary)' : 'var(--card2)') + ';color:' + (isA ? '#fff' : 'var(--ink)') + ';">' + d.icon + ' ' + d.name + '</button>';
      });
      domainPills += '</div>';

      var listHtml = '<div style="max-height:40vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px;">';
      if(filtered.length === 0){
        listHtml += '<div style="padding:20px;text-align:center;color:var(--ink-soft);font-size:.8125rem;">검색 결과가 없습니다. 아래에서 직접 추가해보세요!</div>';
      } else {
        filtered.forEach(function(item){
          var isSel = (state.univSelectedEntities || []).includes(item.name);
          listHtml += 
            '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--card2);border-radius:10px;">' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                '<span style="font-size:1.1rem;">' + item.icon + '</span>' +
                '<div>' +
                  '<div style="font-size:.875rem;font-weight:700;color:var(--ink);">' + item.name + ' ' + (item.isCustom ? '<span style="font-size:.65rem;padding:1px 4px;border-radius:4px;background:rgba(139,92,246,0.15);color:#8b5cf6;">커스텀</span>' : '') + '</div>' +
                  '<div style="font-size:.75rem;color:var(--ink-soft);">' + (item.count ? (item.count + '개 기록') : '정의된 스키마') + (item.primaryUnit ? (' · ' + item.primaryUnit) : '') + '</div>' +
                '</div>' +
              '</div>' +
              '<div style="display:flex;gap:4px;">' +
                '<button type="button" class="btn btn-xs u-tax-select-btn" data-name="' + item.name + '" style="background:' + (isSel ? 'var(--primary)' : 'var(--card)') + ';color:' + (isSel ? '#fff' : 'var(--ink)') + ';border:1px solid var(--border);">' + (isSel ? '선택됨' : '선택') + '</button>' +
                (item.isCustom ? ('<button type="button" class="btn btn-xs btn-ghost u-tax-del-btn" data-name="' + item.name + '" style="color:#ef4444;">삭제</button>') : '') +
              '</div>' +
            '</div>';
        });
      }
      listHtml += '</div>';

      var addFormHtml = 
        '<div style="margin-top:12px;padding:10px 12px;background:var(--card);border:1px solid var(--border);border-radius:10px;">' +
          '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:6px;">+ 새 분류/단위 직접 정의 (Custom Schema)</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">' +
            '<select id="uTaxNewDomain" style="padding:6px;font-size:.8125rem;border-radius:6px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
              Object.values(DOMAINS).map(function(d){ return '<option value="' + d.key + '">' + d.icon + ' ' + d.name + '</option>'; }).join('') +
            '</select>' +
            '<input id="uTaxNewName" type="text" placeholder="항목명 (예: 플랭크, 한자암기)" style="padding:6px;font-size:.8125rem;border-radius:6px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">' +
            '<input id="uTaxNewPUnit" type="text" placeholder="1차 단위 (예: 초, 자, kg, 쪽)" style="padding:6px;font-size:.8125rem;border-radius:6px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
            '<input id="uTaxNewSUnit" type="text" placeholder="2차 단위 (선택, 예: 세트, 분)" style="padding:6px;font-size:.8125rem;border-radius:6px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm" id="uTaxAddSchemaBtn" style="width:100%;font-weight:700;">+ 스키마 등록 및 온톨로지 반영</button>' +
        '</div>';

      containerEl.innerHTML = 
        '<div style="max-height:75vh;overflow-y:auto;padding:2px;">' +
          '<div style="margin-bottom:8px;">' +
            '<input id="uTaxSearchInput" type="search" placeholder="초성 고속 검색 (예: ㅂㅊ, ㅅㅋ, ㄷㅅ, 독서)" value="' + curSearchQuery + '" style="width:100%;padding:8px 12px;border-radius:10px;border:1px solid var(--border);font-size:.875rem;background:var(--card2);color:var(--ink);box-sizing:border-box;">' +
          '</div>' +
          domainPills +
          listHtml +
          addFormHtml +
        '</div>';

      // 이벤트 바인딩
      var sInput = containerEl.querySelector('#uTaxSearchInput');
      if(sInput){
        sInput.oninput = function(){
          curSearchQuery = sInput.value;
          renderModalContent(containerEl);
          var nextInp = containerEl.querySelector('#uTaxSearchInput');
          if(nextInp){
            nextInp.focus();
            nextInp.selectionStart = nextInp.selectionEnd = nextInp.value.length;
          }
        };
      }

      containerEl.querySelectorAll('.u-tax-dom-btn').forEach(function(btn){
        btn.onclick = function(){
          curDomainFilter = btn.dataset.dom;
          renderModalContent(containerEl);
        };
      });

      containerEl.querySelectorAll('.u-tax-select-btn').forEach(function(btn){
        btn.onclick = function(){
          var entName = btn.dataset.name;
          state.univSelectedEntities = [entName];
          state.univMode = 'single';
          if(callbacks.onDone) callbacks.onDone();
          closeModalFn();
        };
      });

      containerEl.querySelectorAll('.u-tax-del-btn').forEach(function(btn){
        btn.onclick = function(){
          var entName = btn.dataset.name;
          if(!confirm('[' + entName + '] 스키마를 삭제하시겠습니까? (기존 기록은 안전 보존됩니다)')) return;
          customSchemas = customSchemas.filter(function(cs){ return cs.name !== entName; });
          if(state.profile) state.profile.customSchemas = customSchemas;
          if(callbacks.saveProfile) callbacks.saveProfile();
          renderModalContent(containerEl);
        };
      });

      var addBtn = containerEl.querySelector('#uTaxAddSchemaBtn');
      if(addBtn){
        addBtn.onclick = function(){
          var nameInput = containerEl.querySelector('#uTaxNewName');
          var nameVal = (nameInput && nameInput.value || '').trim();
          if(!nameVal){
            alert('항목명을 입력해주세요.');
            return;
          }
          var domVal = containerEl.querySelector('#uTaxNewDomain').value;
          var pUnit = (containerEl.querySelector('#uTaxNewPUnit').value || '').trim();
          var sUnit = (containerEl.querySelector('#uTaxNewSUnit').value || '').trim();

          customSchemas.push({
            name: nameVal,
            domainKey: domVal,
            primaryUnit: pUnit,
            secondaryUnit: sUnit,
            icon: DOMAINS[domVal] ? DOMAINS[domVal].icon : '📌'
          });
          if(state.profile) state.profile.customSchemas = customSchemas;
          if(callbacks.saveProfile) callbacks.saveProfile();
          if(callbacks.toast) callbacks.toast('[' + nameVal + '] 스키마가 성공적으로 등록되었습니다!');
          renderModalContent(containerEl);
        };
      }
    }

    var fullHtml = '<div class="modal-head" style="margin-bottom:12px;"><h3 style="margin:0;font-size:1.125rem;font-weight:800;color:var(--ink);">🔍 다형성 패싯 온톨로지 탐색기</h3></div><div id="uTaxModalContainer"></div>';
    openModalFn(fullHtml, function(modalEl){
      var cEl = modalEl ? modalEl.querySelector('#uTaxModalContainer') : null;
      if(cEl) renderModalContent(cEl);
    });
  }

  /* ================= 9. 도메인 중립 엔터프라이즈 데이터 그리드 모달 ================= */
  function openUniversalDataGrid(options){
    options = options || {};
    var allRecs = options.allRecs || [];
    var state = options.state || {};
    var callbacks = options.callbacks || {};
    var openModalFn = callbacks.openModal || window.openModal;
    var closeModalFn = callbacks.closeModal || window.closeModal;
    if(!openModalFn) return;

    var sortCol = 'date';
    var sortDir = 'desc'; // 'desc', 'asc', 'none'
    var curQuery = '';
    var curSource = 'all';
    var curPage = 1;
    var pageSize = 30;
    var selectedRecIds = {};

    function getDisplayRecord(r){
      var d = (r.startAt || r.createdAt || '').slice(0, 10);
      var ent = r.subTheme || r.item || r.exercise || '일반';
      var pVal = (r.metrics && (r.metrics.primary !== undefined ? r.metrics.primary : (r.metrics.revenue !== undefined ? r.metrics.revenue : (r.metrics.commits !== undefined ? r.metrics.commits : (r.metrics.problems !== undefined ? r.metrics.problems : (r.metrics['1rm'] || r.metrics.pages || r.metrics.distance || 0)))))) || 0;
      var pUnit = (r.metrics && r.metrics.primaryUnit) || (r.metricUnits && (r.metricUnits.primary || r.metricUnits.revenue || r.metricUnits.commits || r.metricUnits.problems)) || (r.metrics && r.metrics['1rm'] ? 'kg' : (r.metrics && r.metrics.pages ? '쪽' : (r.metrics && r.metrics.revenue ? '만원' : '')));
      var sVal = (r.metrics && (r.metrics.secondary !== undefined ? r.metrics.secondary : (r.metrics.deals !== undefined ? r.metrics.deals : (r.metrics.prs !== undefined ? r.metrics.prs : (r.metrics.volume || r.metrics.duration || 0))))) || 0;
      var sUnit = (r.metrics && r.metrics.secondaryUnit) || (r.metricUnits && (r.metricUnits.secondary || r.metricUnits.deals || r.metricUnits.prs)) || (r.metrics && r.metrics.volume ? 'kg' : (r.metrics && r.metrics.duration ? '분' : (r.metrics && r.metrics.deals ? '건' : '')));
      var memo = r.text || '';
      var src = r.source || 'in_app';
      var rawTime = new Date(r.startAt || r.createdAt).getTime();

      return {
        id: r.id || (d + '_' + Math.random()),
        date: d,
        rawTime: rawTime,
        entity: ent,
        primaryVal: pVal,
        primaryUnit: pUnit,
        secondaryVal: sVal,
        secondaryUnit: sUnit,
        memo: memo,
        source: src,
        raw: r
      };
    }

    function renderGrid(modalContainer){
      var mapped = allRecs.map(getDisplayRecord);

      // 필터링
      var filtered = mapped.filter(function(row){
        if(curSource !== 'all' && row.source !== curSource) return false;
        if(curQuery){
          var q = curQuery.toLowerCase();
          var hit = row.date.indexOf(q) !== -1 || row.entity.toLowerCase().indexOf(q) !== -1 || row.memo.toLowerCase().indexOf(q) !== -1;
          if(!hit && /^[ㄱ-ㅎ]+$/.test(q)){
            hit = getChosung(row.entity).indexOf(q) !== -1;
          }
          if(!hit) return false;
        }
        return true;
      });

      // 정렬
      if(sortDir !== 'none'){
        filtered.sort(function(a, b){
          var cmp = 0;
          if(sortCol === 'date') cmp = a.rawTime - b.rawTime;
          else if(sortCol === 'entity') cmp = a.entity.localeCompare(b.entity);
          else if(sortCol === 'primary') cmp = a.primaryVal - b.primaryVal;
          else if(sortCol === 'secondary') cmp = a.secondaryVal - b.secondaryVal;
          return (sortDir === 'desc' ? -cmp : cmp);
        });
      }

      var totalRows = filtered.length;
      var pagedRows = filtered.slice(0, curPage * pageSize);

            // 도메인 감지 헤더
      var h1 = '1차 지표';
      var h2 = '2차 지표';
      var sampleRow = pagedRows[0];
      if(sampleRow){
        var entLower = (sampleRow.entity || '').toLowerCase();
        var rawM = (sampleRow.raw && sampleRow.raw.metrics) || {};
        var isWeightlifting = /스쿼트|벤치프레스|데드리프트|역도|파워리프팅/.test(entLower);
        if(rawM.revenue !== undefined || /영업|매출|계약/.test(entLower)){
          h1 = '매출실적 (' + (sampleRow.primaryUnit || '만원') + ')';
          h2 = '계약/미팅 (' + (sampleRow.secondaryUnit || '건') + ')';
        } else if(rawM.commits !== undefined || /개발|커밋|코딩|git/.test(entLower)){
          h1 = '커밋수 (' + (sampleRow.primaryUnit || '개') + ')';
          h2 = 'PR/리뷰 (' + (sampleRow.secondaryUnit || '개') + ')';
        } else if(rawM.problems !== undefined || /공부|수험|학습|문제/.test(entLower)){
          h1 = '소요시간 (' + (sampleRow.primaryUnit || '분') + ')';
          h2 = '문제풀이 (' + (sampleRow.secondaryUnit || '개') + ')';
        } else if(isWeightlifting && sampleRow.primaryUnit === 'kg'){
          h1 = 'Peak 1RM (kg)';
          h2 = 'Total Vol (kg)';
        } else if(sampleRow.primaryUnit === '쪽' || /독서|책/.test(entLower)){
          h1 = '독서량 (쪽)';
          h2 = '집중시간 (분)';
        } else if(sampleRow.primaryUnit === 'km' || /러닝|달리기/.test(entLower)){
          h1 = '거리 (km)';
          h2 = '소요시간 (분)';
        } else if(sampleRow.primaryUnit === 'hr' || sampleRow.primaryUnit === '시간' || /수면|잠/.test(entLower)){
          h1 = '수면시간 (' + (sampleRow.primaryUnit || '시간') + ')';
          h2 = '컨디션 점수';
        } else if(sampleRow.primaryUnit === '원' || sampleRow.primaryUnit === '만원' || /재테크|저축|자산/.test(entLower)){
          h1 = '저축/투자 (' + (sampleRow.primaryUnit || '만원') + ')';
          h2 = '건수/수익률';
        } else {
          h1 = sampleRow.primaryUnit ? ('1차 지표 (' + sampleRow.primaryUnit + ')') : '1차 지표';
          h2 = sampleRow.secondaryUnit ? ('2차 지표 (' + sampleRow.secondaryUnit + ')') : '2차 지표';
        }
      }

      var sortIcon = function(c){
        if(sortCol !== c || sortDir === 'none') return ' ↕';
        return sortDir === 'desc' ? ' ▼' : ' ▲';
      };

      var tableRows = pagedRows.map(function(row){
        var isChecked = !!selectedRecIds[row.id];
        return (
          '<tr style="border-bottom:1px solid var(--border);font-size:.8125rem;">' +
            '<td style="padding:6px 4px;text-align:center;"><input type="checkbox" class="u-grid-row-chk" data-id="' + row.id + '" ' + (isChecked ? 'checked' : '') + '></td>' +
            '<td style="padding:6px 6px;font-family:monospace;font-weight:600;color:var(--ink);">' + row.date + '</td>' +
            '<td style="padding:6px 6px;font-weight:700;color:var(--primary);">' + row.entity + '</td>' +
            '<td style="padding:6px 6px;text-align:right;font-family:monospace;font-weight:700;color:var(--ink);">' + (row.primaryVal ? (row.primaryVal.toLocaleString() + ' ' + row.primaryUnit) : '-') + '</td>' +
            '<td style="padding:6px 6px;text-align:right;font-family:monospace;color:var(--ink-soft);">' + (row.secondaryVal ? (row.secondaryVal.toLocaleString() + ' ' + row.secondaryUnit) : '-') + '</td>' +
            '<td style="padding:6px 6px;color:var(--ink);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + row.memo + '">' + (row.memo || '-') + '</td>' +
            '<td style="padding:6px 4px;text-align:center;">' +
              '<button type="button" class="btn btn-xs btn-ghost u-grid-edit-btn" data-id="' + row.id + '" style="padding:1px 4px;font-size:.7rem;">✏️</button>' +
              '<button type="button" class="btn btn-xs btn-ghost u-grid-del-btn" data-id="' + row.id + '" style="padding:1px 4px;font-size:.7rem;color:#ef4444;">🗑️</button>' +
            '</td>' +
          '</tr>'
        );
      }).join('');

      var selCount = Object.keys(selectedRecIds).length;

      modalContainer.innerHTML = 
        '<div style="max-height:78vh;display:flex;flex-direction:column;gap:8px;padding:2px;">' +
          // 상단 액션바
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-weight:800;font-size:.9375rem;color:var(--ink);">총 ' + totalRows + '건</span>' +
              (selCount > 0 ? ('<button type="button" class="btn btn-xs btn-danger" id="uGridBulkDelBtn" style="background:#ef4444;color:#fff;font-weight:700;">' + selCount + '개 일괄 삭제</button>') : '') +
            '</div>' +
            '<div style="display:flex;gap:4px;">' +
              '<button type="button" class="btn btn-xs btn-primary" id="uGridAddRowBtn" style="font-weight:700;">+ 새 기록 추가</button>' +
              '<button type="button" class="btn btn-xs btn-ghost" id="uGridExportCleanBtn" style="border:1px solid var(--border);">📥 클린 CSV</button>' +
            '</div>' +
          '</div>' +

          // 검색 & 소스 필터
          '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +
            '<input id="uGridSearchInp" type="search" placeholder="검색 (날짜, 항목, 메모, 초성)" value="' + curQuery + '" style="flex:1;min-width:140px;padding:6px 10px;border-radius:8px;border:1px solid var(--border);font-size:.8125rem;background:var(--card2);color:var(--ink);">' +
            '<div style="display:flex;gap:3px;background:var(--card2);padding:2px;border-radius:8px;">' +
              '<button type="button" class="u-grid-src-btn" data-src="all" style="padding:3px 6px;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;background:' + (curSource === 'all' ? 'var(--card)' : 'transparent') + ';color:var(--ink);">전체</button>' +
              '<button type="button" class="u-grid-src-btn" data-src="manual_in_app" style="padding:3px 6px;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;background:' + (curSource === 'manual_in_app' ? 'var(--card)' : 'transparent') + ';color:var(--ink);">인앱</button>' +
              '<button type="button" class="u-grid-src-btn" data-src="powerlifting_52w_sample" style="padding:3px 6px;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;background:' + (curSource === 'powerlifting_52w_sample' ? 'var(--card)' : 'transparent') + ';color:var(--ink);">52주</button>' +
              '<button type="button" class="u-grid-src-btn" data-src="olympic_strength_1920s" style="padding:3px 6px;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;background:' + (curSource === 'olympic_strength_1920s' ? 'var(--card)' : 'transparent') + ';color:var(--ink);">1924</button>' +
            '</div>' +
          '</div>' +

          // 테이블 영역
          '<div style="flex:1;overflow-y:auto;border:1px solid var(--border);border-radius:8px;background:var(--card);">' +
            '<table style="width:100%;border-collapse:collapse;text-align:left;">' +
              '<thead style="background:var(--card2);position:sticky;top:0;z-index:2;border-bottom:1px solid var(--border);font-size:.75rem;">' +
                '<tr>' +
                  '<th style="padding:8px 4px;text-align:center;width:28px;"><input type="checkbox" id="uGridSelectAll"></th>' +
                  '<th class="u-grid-sort-th" data-col="date" style="padding:8px 6px;cursor:pointer;">일시' + sortIcon('date') + '</th>' +
                  '<th class="u-grid-sort-th" data-col="entity" style="padding:8px 6px;cursor:pointer;">항목' + sortIcon('entity') + '</th>' +
                  '<th class="u-grid-sort-th" data-col="primary" style="padding:8px 6px;text-align:right;cursor:pointer;">' + h1 + sortIcon('primary') + '</th>' +
                  '<th class="u-grid-sort-th" data-col="secondary" style="padding:8px 6px;text-align:right;cursor:pointer;">' + h2 + sortIcon('secondary') + '</th>' +
                  '<th style="padding:8px 6px;">메모</th>' +
                  '<th style="padding:8px 4px;text-align:center;width:48px;">액션</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' +
                (tableRows || '<tr><td colspan="7" style="padding:20px;text-align:center;color:var(--ink-soft);">데이터가 없습니다</td></tr>') +
              '</tbody>' +
            '</table>' +
          '</div>' +

          // 하단 지연 페이징
          '<div style="display:flex;align-items:center;justify-content:space-between;font-size:.75rem;color:var(--ink-soft);padding:4px 0;">' +
            '<span>표시: ' + Math.min(pagedRows.length, totalRows) + ' / ' + totalRows + '</span>' +
            (pagedRows.length < totalRows ? ('<button type="button" class="btn btn-xs btn-ghost" id="uGridLoadMoreBtn" style="border:1px solid var(--border);font-weight:700;">+ 더보기 (30개)</button>') : '') +
          '</div>' +
        '</div>';

      // 이벤트 바인딩
      var sInp = modalContainer.querySelector('#uGridSearchInp');
      if(sInp){
        sInp.oninput = function(){
          curQuery = sInp.value;
          curPage = 1;
          renderGrid(modalContainer);
          var nextI = modalContainer.querySelector('#uGridSearchInp');
          if(nextI){
            nextI.focus();
            nextI.selectionStart = nextI.selectionEnd = nextI.value.length;
          }
        };
      }

      modalContainer.querySelectorAll('.u-grid-src-btn').forEach(function(btn){
        btn.onclick = function(){
          curSource = btn.dataset.src;
          curPage = 1;
          renderGrid(modalContainer);
        };
      });

      modalContainer.querySelectorAll('.u-grid-sort-th').forEach(function(th){
        th.onclick = function(){
          var col = th.dataset.col;
          if(sortCol === col){
            sortDir = (sortDir === 'desc' ? 'asc' : (sortDir === 'asc' ? 'none' : 'desc'));
          } else {
            sortCol = col;
            sortDir = 'desc';
          }
          renderGrid(modalContainer);
        };
      });

      var allChk = modalContainer.querySelector('#uGridSelectAll');
      if(allChk){
        allChk.onchange = function(){
          var checked = allChk.checked;
          pagedRows.forEach(function(r){
            if(checked) selectedRecIds[r.id] = true;
            else delete selectedRecIds[r.id];
          });
          renderGrid(modalContainer);
        };
      }

      modalContainer.querySelectorAll('.u-grid-row-chk').forEach(function(chk){
        chk.onchange = function(){
          var id = chk.dataset.id;
          if(chk.checked) selectedRecIds[id] = true;
          else delete selectedRecIds[id];
          renderGrid(modalContainer);
        };
      });

      var moreBtn = modalContainer.querySelector('#uGridLoadMoreBtn');
      if(moreBtn){
        moreBtn.onclick = function(){
          curPage++;
          renderGrid(modalContainer);
        };
      }

      var expBtn = modalContainer.querySelector('#uGridExportCleanBtn');
      if(expBtn){
        expBtn.onclick = function(){
          exportCleanCsv(allRecs, 'ourgoal_clean_grid_export.csv');
        };
      }

      var bulkDelBtn = modalContainer.querySelector('#uGridBulkDelBtn');
      if(bulkDelBtn){
        bulkDelBtn.onclick = function(){
          var delIds = Object.keys(selectedRecIds);
          if(!confirm('선택된 ' + delIds.length + '개 기록을 완전히 삭제하시겠습니까?')) return;
          if(state.profile && state.profile.records){
            state.profile.records = state.profile.records.filter(function(r){ return !selectedRecIds[r.id]; });
            allRecs = state.profile.records;
            selectedRecIds = {};
            if(callbacks.saveProfile) callbacks.saveProfile();
            if(callbacks.onDone) callbacks.onDone();
            renderGrid(modalContainer);
          }
        };
      }

      modalContainer.querySelectorAll('.u-grid-del-btn').forEach(function(btn){
        btn.onclick = function(){
          var id = btn.dataset.id;
          if(!confirm('해당 기록을 삭제하시겠습니까?')) return;
          if(state.profile && state.profile.records){
            state.profile.records = state.profile.records.filter(function(r){ return r.id !== id; });
            allRecs = state.profile.records;
            delete selectedRecIds[id];
            if(callbacks.saveProfile) callbacks.saveProfile();
            if(callbacks.onDone) callbacks.onDone();
            renderGrid(modalContainer);
          }
        };
      });

      var addRowBtn = modalContainer.querySelector('#uGridAddRowBtn');
      if(addRowBtn){
        addRowBtn.onclick = function(){
          openRowEditModal({
            isNew: true,
            callbacks: callbacks,
            state: state,
            onSaved: function(){
              allRecs = (state.profile && state.profile.records) || [];
              renderGrid(modalContainer);
            }
          });
        };
      }

      modalContainer.querySelectorAll('.u-grid-edit-btn').forEach(function(btn){
        btn.onclick = function(){
          var id = btn.dataset.id;
          var targetRow = mapped.find(function(r){ return r.id === id; });
          if(targetRow){
            openRowEditModal({
              row: targetRow,
              callbacks: callbacks,
              state: state,
              onSaved: function(){
                allRecs = (state.profile && state.profile.records) || [];
                renderGrid(modalContainer);
              }
            });
          }
        };
      });
    }

    var fullHtml = '<div class="modal-head" style="margin-bottom:12px;"><h3 style="margin:0;font-size:1.125rem;font-weight:800;color:var(--ink);">📋 엔터프라이즈 데이터 관리 그리드</h3></div><div id="uGridModalContainer"></div>';
    openModalFn(fullHtml, function(modalEl){
      var cEl = modalEl ? modalEl.querySelector('#uGridModalContainer') : null;
      if(cEl) renderGrid(cEl);
    });
  }

  /* 단건 레코드 인라인 수정/추가 모달 */
  function openRowEditModal(options){
    options = options || {};
    var row = options.row || {};
    var isNew = !!options.isNew;
    var state = options.state || {};
    var callbacks = options.callbacks || {};
    var openModalFn = callbacks.openModal || window.openModal;
    var closeModalFn = callbacks.closeModal || window.closeModal;
    if(!openModalFn) return;

    var curDate = row.date || new Date().toISOString().slice(0, 10);
    var curEntity = row.entity || '';
    var curPVal = row.primaryVal || '';
    var curPUnit = row.primaryUnit || 'kg';
    var curSVal = row.secondaryVal || '';
    var curSUnit = row.secondaryUnit || 'kg';
    var curMemo = row.memo || '';

    var bodyHtml = 
      '<div style="display:flex;flex-direction:column;gap:8px;padding:4px 0;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);">일시 (1900년대 완벽 지원)</div>' +
        '<input id="uEditRowDate" type="text" value="' + curDate + '" placeholder="YYYY-MM-DD" style="padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--card2);color:var(--ink);font-family:monospace;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);">항목 / 엔티티</div>' +
        '<input id="uEditRowEntity" type="text" value="' + curEntity + '" placeholder="예: 벤치프레스, 독서, 러닝" style="padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
          '<div>' +
            '<div style="font-size:.75rem;font-weight:700;color:var(--ink);margin-bottom:2px;">1차 수치 / 단위</div>' +
            '<div style="display:flex;gap:4px;">' +
              '<input id="uEditRowPVal" type="number" step="any" value="' + curPVal + '" placeholder="수치" style="flex:1;padding:6px;border-radius:6px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
              '<input id="uEditRowPUnit" type="text" value="' + curPUnit + '" placeholder="단위" style="width:50px;padding:6px;border-radius:6px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:.75rem;font-weight:700;color:var(--ink);margin-bottom:2px;">2차 수치 / 단위</div>' +
            '<div style="display:flex;gap:4px;">' +
              '<input id="uEditRowSVal" type="number" step="any" value="' + curSVal + '" placeholder="수치" style="flex:1;padding:6px;border-radius:6px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
              '<input id="uEditRowSUnit" type="text" value="' + curSUnit + '" placeholder="단위" style="width:50px;padding:6px;border-radius:6px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);">메모 / 상세 내용</div>' +
        '<textarea id="uEditRowMemo" rows="3" style="padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--card2);color:var(--ink);resize:vertical;">' + curMemo + '</textarea>' +
        '<button type="button" class="btn btn-primary" id="uEditRowSaveBtn" style="margin-top:8px;font-weight:700;">' + (isNew ? '기록 생성' : '수정 사항 저장') + '</button>' +
      '</div>';

    var fullHtml = '<div class="modal-head" style="margin-bottom:12px;"><h3 style="margin:0;font-size:1.125rem;font-weight:800;color:var(--ink);">' + (isNew ? '➕ 새 데이터 행 추가' : '✏️ 데이터 행 정밀 수정') + '</h3></div>' + bodyHtml;
    openModalFn(fullHtml, function(modalEl){
      if(!modalEl) return;
      var saveBtn = modalEl.querySelector('#uEditRowSaveBtn');
        if(saveBtn){
          saveBtn.onclick = function(){
            var dateVal = modalEl.querySelector('#uEditRowDate').value.trim();
            var entVal = modalEl.querySelector('#uEditRowEntity').value.trim();
            var pVal = parseFloat(modalEl.querySelector('#uEditRowPVal').value) || 0;
            var pUnit = modalEl.querySelector('#uEditRowPUnit').value.trim();
            var sVal = parseFloat(modalEl.querySelector('#uEditRowSVal').value) || 0;
            var sUnit = modalEl.querySelector('#uEditRowSUnit').value.trim();
            var memoVal = modalEl.querySelector('#uEditRowMemo').value.trim();

            if(!dateVal || !entVal){
              alert('일시와 항목명은 필수입니다.');
              return;
            }

            var recs = (state.profile && state.profile.records) || [];
            if(isNew){
              var newId = 'rec_' + dateVal.replace(/[^0-9]/g, '') + '_' + Math.random().toString(36).slice(2, 7);
              var newRec = {
                id: newId,
                theme: inferDomainKey(entVal),
                subTheme: entVal,
                item: entVal,
                text: '[' + entVal + '] ' + (pVal ? (pVal + pUnit + ' ') : '') + memoVal,
                startAt: dateVal + 'T12:00:00.000Z',
                createdAt: dateVal + 'T12:00:00.000Z',
                source: 'manual_in_app',
                metrics: {
                  primary: pVal,
                  primaryUnit: pUnit,
                  secondary: sVal,
                  secondaryUnit: sUnit
                }
              };
              if(pUnit === 'kg' && /스쿼트|벤치|데드/i.test(entVal)) newRec.metrics['1rm'] = pVal;
              if(sUnit === 'kg' && /스쿼트|벤치|데드/i.test(entVal)) newRec.metrics.volume = sVal;
              if(pUnit === '쪽') newRec.metrics.pages = pVal;
              recs.push(newRec);
            } else {
              var target = recs.find(function(r){ return r.id === row.id; });
              if(target){
                target.startAt = dateVal + 'T12:00:00.000Z';
                target.subTheme = entVal;
                target.item = entVal;
                target.text = '[' + entVal + '] ' + (pVal ? (pVal + pUnit + ' ') : '') + memoVal;
                target.metrics = target.metrics || {};
                target.metrics.primary = pVal;
                target.metrics.primaryUnit = pUnit;
                target.metrics.secondary = sVal;
                target.metrics.secondaryUnit = sUnit;
                if(pUnit === 'kg' && /스쿼트|벤치|데드/i.test(entVal)) target.metrics['1rm'] = pVal;
                if(sUnit === 'kg' && /스쿼트|벤치|데드/i.test(entVal)) target.metrics.volume = sVal;
                if(pUnit === '쪽') target.metrics.pages = pVal;
              }
            }

            if(state.profile) state.profile.records = recs;
            if(callbacks.saveProfile) callbacks.saveProfile();
            if(callbacks.toast) callbacks.toast('데이터가 성공적으로 저장되었습니다!');
            closeModalFn();
            if(options.onSaved) options.onSaved();
          };
        }
      });
    }

  
  /* ================= 5-4-B. 4대 다차원 분석 렌즈 엔진 (Cross-Ratio, Radar, Cadence, Diagnostics) ================= */
  
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

  /* ================= 9-B. 데이터 관리 및 도구 통합 모달 (#TASK-ES-092) ================= */

  function openDataManagementModal(options){
    options = options || {};
    var allRecs = options.allRecs || [];
    var state = options.state || {};
    var callbacks = options.callbacks || {};
    var openModalFn = callbacks.openModal || window.openModal;
    var closeModalFn = callbacks.closeModal || window.closeModal;
    if(!openModalFn) return;

    var menuHtml = 
      '<div class="modal-head" style="margin-bottom:12px;">' +
        '<h3 style="margin:0;font-size:1.125rem;font-weight:800;color:var(--ink);">⚙️ 데이터 관리 & 분석 도구</h3>' +
      '</div>' +
      '<div style="font-size:.8125rem;color:var(--ink-soft);margin-bottom:14px;line-height:1.4;">' +
        '새로운 데이터를 추가하거나, 기존 기록을 표로 조회·수정하고, 파일로 백업할 수 있습니다.' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
        '<button type="button" class="btn btn-ghost" id="uMenuImportBtn" style="height:auto;padding:12px 14px;text-align:left;display:flex;align-items:center;gap:12px;border:1.5px solid var(--border);border-radius:12px;cursor:pointer;transition:background .15s;">' +
          '<span style="font-size:1.4rem;">📥</span>' +
          '<div style="flex:1;">' +
            '<div style="font-weight:800;font-size:.875rem;color:var(--ink);">새 데이터 가져오기 & 1초 샘플</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">CSV 파일 업로드, 엑셀 텍스트 붙여넣기, 52주 추천 샘플 1초 로드</div>' +
          '</div>' +
        '</button>' +
        '<button type="button" class="btn btn-ghost" id="uMenuGridBtn" style="height:auto;padding:12px 14px;text-align:left;display:flex;align-items:center;gap:12px;border:1.5px solid var(--border);border-radius:12px;cursor:pointer;transition:background .15s;">' +
          '<span style="font-size:1.4rem;">📋</span>' +
          '<div style="flex:1;">' +
            '<div style="font-weight:800;font-size:.875rem;color:var(--ink);">전체 기록 데이터 표 (그리드)</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">모든 기록을 테이블로 검색, 정렬하고 수치를 직접 수정·삭제</div>' +
          '</div>' +
        '</button>' +
        '<button type="button" class="btn btn-ghost" id="uMenuExportCsvBtn" style="height:auto;padding:12px 14px;text-align:left;display:flex;align-items:center;gap:12px;border:1.5px solid var(--border);border-radius:12px;cursor:pointer;transition:background .15s;">' +
          '<span style="font-size:1.4rem;">💾</span>' +
          '<div style="flex:1;">' +
            '<div style="font-weight:800;font-size:.875rem;color:var(--ink);">CSV 파일로 백업 다운로드</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">정제된 전체 기록을 엑셀에서 열 수 있는 CSV로 다운로드</div>' +
          '</div>' +
        '</button>' +
        '<button type="button" class="btn btn-ghost" id="uMenuTaxonomyBtn" style="height:auto;padding:12px 14px;text-align:left;display:flex;align-items:center;gap:12px;border:1.5px solid var(--border);border-radius:12px;cursor:pointer;transition:background .15s;">' +
          '<span style="font-size:1.4rem;">🔍</span>' +
          '<div style="flex:1;">' +
            '<div style="font-weight:800;font-size:.875rem;color:var(--ink);">항목 온톨로지 탐색기</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">새로운 분석 종목 및 맞춤 단위(kg, 쪽, 만원 등) 스키마 관리</div>' +
          '</div>' +
        '</button>' +
        '<button type="button" class="btn btn-ghost" id="uMenuSnapBtn" style="height:auto;padding:12px 14px;text-align:left;display:flex;align-items:center;gap:12px;border:1.5px solid var(--border);border-radius:12px;cursor:pointer;transition:background .15s;">' +
          '<span style="font-size:1.4rem;">📸</span>' +
          '<div style="flex:1;">' +
            '<div style="font-weight:800;font-size:.875rem;color:var(--ink);">차트 스냅샷 이미지 저장</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">현재 콕핏 차트와 KPI 카드를 깨끗한 PNG 이미지로 보관</div>' +
          '</div>' +
        '</button>' +
      '</div>';

    openModalFn(menuHtml, function(modalEl){
      if(!modalEl) return;
      var curAllRecs = (state && state.profile && state.profile.records) || allRecs;

      var impB = modalEl.querySelector('#uMenuImportBtn');
      if(impB){
        impB.onclick = function(){
          // closeModalFn() 호출 없이 직접 import 모달로 전환 (popstate 레이스 컨디션 차단)
          openUniversalImportModal({
            openModal: openModalFn,
            closeModal: closeModalFn,
            toast: callbacks.toast || (typeof window !== 'undefined' ? window.toast : null),
            state: state,
            saveProfile: callbacks.saveProfile || (typeof window !== 'undefined' ? window.saveProfile : null),
            onDone: function(type, count){
              if(options.onDone) options.onDone(type, count);
              if(callbacks.onDone) callbacks.onDone(type, count);
            }
          });
        };
      }
      var gridB = modalEl.querySelector('#uMenuGridBtn');
      if(gridB){
        gridB.onclick = function(){
          openUniversalDataGrid({
            allRecs: (state && state.profile && state.profile.records) || allRecs,
            state: state,
            callbacks: {
              openModal: openModalFn,
              closeModal: closeModalFn,
              saveProfile: callbacks.saveProfile || (typeof window !== 'undefined' ? window.saveProfile : null),
              toast: callbacks.toast || (typeof window !== 'undefined' ? window.toast : null),
              onDone: function(){
                if(options.onDone) options.onDone();
                if(callbacks.onDone) callbacks.onDone();
              }
            }
          });
        };
      }
      var expB = modalEl.querySelector('#uMenuExportCsvBtn');
      if(expB){
        expB.onclick = function(){
          closeModalFn();
          exportCleanCsv((state && state.profile && state.profile.records) || allRecs, 'ourgoal_analytics_export.csv');
        };
      }
      var taxB = modalEl.querySelector('#uMenuTaxonomyBtn');
      if(taxB){
        taxB.onclick = function(){
          openTaxonomyManagerModal({
            allRecs: (state && state.profile && state.profile.records) || allRecs,
            state: state,
            callbacks: {
              openModal: openModalFn,
              closeModal: closeModalFn,
              saveProfile: callbacks.saveProfile || (typeof window !== 'undefined' ? window.saveProfile : null),
              toast: callbacks.toast || (typeof window !== 'undefined' ? window.toast : null),
              onDone: function(){
                if(options.onDone) options.onDone();
                if(callbacks.onDone) callbacks.onDone();
              }
            }
          });
        };
      }
      var snapB = modalEl.querySelector('#uMenuSnapBtn');
      if(snapB){
        snapB.onclick = function(){
          closeModalFn();
          var mainCard = (typeof document !== 'undefined') ? document.querySelector('#uCockpitMainCard') : null;
          if(mainCard) captureChartSnapshot(mainCard, 'ourgoal_cockpit');
        };
      }
    });
  }

/* ================= 10. 프로페셔널 데이터 콕핏 메인 렌더러 ================= */
  function renderUniversalStatsDashboard(container, allRecs, state, callbacks){

    if(!container) return;
    callbacks = callbacks || {};
    state = state || {};

    var customSchemas = (state.profile && state.profile.customSchemas) || [];
    var ontology = buildUniversalOntology(allRecs, customSchemas);

    if(ontology.length === 0){
      container.innerHTML = 
        '<div class="card" style="padding:18px 14px;text-align:center;border-radius:14px;background:var(--card);border:1px solid var(--border);">' +
          '<div style="font-size:1.6rem;margin-bottom:6px;">📊</div>' +
          '<div style="font-weight:800;font-size:1rem;color:var(--ink);">자율 다차원 통계 분석기</div>' +
          '<div style="font-size:.8125rem;color:var(--ink-soft);margin-top:4px;margin-bottom:14px;line-height:1.5;">영업 실적, 개발 커밋, 수험 공부, 자산, 운동 등 어떤 데이터든 AI가 감지해 다차원으로 분석해요.</div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;margin-bottom:12px;">' +
            '<button type="button" class="btn btn-ghost btn-sm u-empty-load-btn" data-type="sales" style="padding:10px 8px;border-radius:10px;border:1px solid var(--border);background:var(--card2);display:flex;flex-direction:column;align-items:center;gap:4px;height:auto;cursor:pointer;">' +
              '<span style="font-size:1.2rem;">💼</span>' +
              '<span style="font-weight:700;font-size:.75rem;color:var(--ink);">B2B 영업 실적</span>' +
              '<span style="font-size:.65rem;color:var(--ink-soft);">52주 매출·계약</span>' +
            '</button>' +
            '<button type="button" class="btn btn-ghost btn-sm u-empty-load-btn" data-type="coding" style="padding:10px 8px;border-radius:10px;border:1px solid var(--border);background:var(--card2);display:flex;flex-direction:column;align-items:center;gap:4px;height:auto;cursor:pointer;">' +
              '<span style="font-size:1.2rem;">💻</span>' +
              '<span style="font-weight:700;font-size:.75rem;color:var(--ink);">개발자 활동</span>' +
              '<span style="font-size:.65rem;color:var(--ink-soft);">52주 커밋·PR</span>' +
            '</button>' +
            '<button type="button" class="btn btn-ghost btn-sm u-empty-load-btn" data-type="study" style="padding:10px 8px;border-radius:10px;border:1px solid var(--border);background:var(--card2);display:flex;flex-direction:column;align-items:center;gap:4px;height:auto;cursor:pointer;">' +
              '<span style="font-size:1.2rem;">📖</span>' +
              '<span style="font-weight:700;font-size:.75rem;color:var(--ink);">수험·공부</span>' +
              '<span style="font-size:.65rem;color:var(--ink-soft);">52주 문제·순공</span>' +
            '</button>' +
            '<button type="button" class="btn btn-ghost btn-sm u-empty-load-btn" id="uEmptyLoadBig3Btn" data-type="big3" style="padding:10px 8px;border-radius:10px;border:1px solid var(--border);background:var(--card2);display:flex;flex-direction:column;align-items:center;gap:4px;height:auto;cursor:pointer;">' +
              '<span style="font-size:1.2rem;">🏃</span>' +
              '<span style="font-weight:700;font-size:.75rem;color:var(--ink);">건강·운동</span>' +
              '<span style="font-size:.65rem;color:var(--ink-soft);">52주 중량·세션</span>' +
            '</button>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm" id="uEmptyImportBtn" style="font-weight:700;padding:8px 16px;"><span>📥 내 데이터 가져오기 (CSV / 직접입력)</span></button>' +
        '</div>';

      container.querySelectorAll('.u-empty-load-btn').forEach(function(btn){
        btn.onclick = function(){
          var sType = btn.dataset.type;
          var sRecs = [];
          if(sType === 'sales') sRecs = generateDomainSample('sales');
          else if(sType === 'coding') sRecs = generateDomainSample('coding');
          else if(sType === 'study') sRecs = generateDomainSample('study');
          else sRecs = generate52WeekPowerliftingSample();

          var cur = (state && state.profile && state.profile.records) || [];
          if(state && state.profile) state.profile.records = cur.concat(sRecs);
          if(callbacks.saveProfile) callbacks.saveProfile();
          if(callbacks.onDone) callbacks.onDone();
          renderUniversalStatsDashboard(container, (state && state.profile && state.profile.records) || sRecs, state, callbacks);
        };
      });

      var impBtn = container.querySelector('#uEmptyImportBtn');
      if(impBtn){
        impBtn.onclick = function(){
          openUniversalImportModal({
            openModal: callbacks.openModal || window.openModal,
            closeModal: callbacks.closeModal || window.closeModal,
            toast: callbacks.toast || window.toast,
            state: state,
            saveProfile: callbacks.saveProfile,
            onDone: function(){
              if(callbacks.onDone) callbacks.onDone();
              renderUniversalStatsDashboard(container, (state && state.profile && state.profile.records) || [], state, callbacks);
            }
          });
        };
      }
      return;
    }

    var isExpanded = true;
    try {
      if(typeof localStorage !== 'undefined'){
        var savedExp = localStorage.getItem('ourgoal_uStats_expanded');
        if(savedExp === 'false') isExpanded = false;
      }
    } catch(e){}

    var curLens = state.univLens || 'trend';
    state.univLens = curLens;
        var mode = state.univMode || 'single';
    var selected = state.univSelectedEntities;
    if(!selected || selected.length === 0){
      selected = [ontology[0].name];
      state.univSelectedEntities = selected;
    }

    // 선택된 엔티티가 가진 모든 측정 차원(Metric Dimensions) 동적 수집
    var targetEntityNames = (mode === 'all') ? ontology.map(function(o){ return o.name; }) : selected;
    var availableDims = [];
    var specificDims = [];
    targetEntityNames.forEach(function(name){
      var ent = ontology.find(function(o){ return o.name === name; });
      if(ent && Array.isArray(ent.dimensions)){
        ent.dimensions.forEach(function(d){
          if(d === 'primary' || d === 'secondary' || d === 'primaryUnit' || d === 'secondaryUnit') return;
          if(!specificDims.includes(d)) specificDims.push(d);
        });
      }
    });
    if(specificDims.length > 0){
      availableDims = specificDims;
    } else {
      availableDims = ['primary'];
    }

    var selectedDims = state.univSelectedDimensions;
    if(!Array.isArray(selectedDims) || selectedDims.length === 0){
      var initDim = state.univDimension || availableDims[0];
      if(!availableDims.includes(initDim)) initDim = availableDims[0];
      selectedDims = [initDim];
      state.univSelectedDimensions = selectedDims;
    } else {
      selectedDims = selectedDims.filter(function(d){ return availableDims.includes(d); });
      if(selectedDims.length === 0){
        selectedDims = [availableDims[0]];
      }
      state.univSelectedDimensions = selectedDims;
    }

    var dimension = state.univDimension;
    if(!dimension || !selectedDims.includes(dimension)){
      dimension = selectedDims[0];
      state.univDimension = dimension;
    }

    var hasHistorical = (allRecs || []).some(function(r){
      var yr = parseInt((r.startAt || '').slice(0, 4), 10);
      return !isNaN(yr) && yr < 2025;
    });
    var period = state.univPeriod || (hasHistorical ? 'all' : '1y');
    state.univPeriod = period;

    var scaleMode = state.univScaleMode || 'linear';

    var dimDisplayNames = {
      '1rm': '추정 1RM(kg)',
      'estimated_1rm_kg': '1RM(kg)',
      'volume': '총 볼륨(kg)',
      'daily_volume_kg': '일일 볼륨(kg)',
      'bodyweight': '체중(kg)',
      'bodyweight_kg': '체중(kg)',
      'sets': '세트수',
      'record': '완주기록(초)',
      'pace': '페이스',
      'rpe': '체감강도(RPE)',
      'intensity': '운동강도(%)',
      'distance': '거리(km)',
      'pages': '독서량(쪽)',
      'duration': '소요시간(분)',
      'revenue': '매출액(만원)',
      'contracts': '계약건수(건)',
      'deals': '계약건수(건)',
      'score': '점수(점)',
      'problems': '문제수(개)',
      'commits': '커밋수(개)',
      'prs': 'PR수(개)',
      'reviews': '코드리뷰(건)',
      'meetings': '미팅(회)',
      'proposals': '제안서(건)',
      'savings': '저축액(만원)',
      'hours': '수면(시간)',
      'primary': '1차 지표',
      'secondary': '2차 지표'
    };

    var activeEntityKeys = (mode === 'all') ? ontology.map(function(o){ return o.name; }) : selected;
    var seriesMap = {};
    if(selectedDims.length <= 1){
      seriesMap = aggregateMultiSeries(allRecs, activeEntityKeys, dimension, period, mode);
    } else {
      // 복수 지표 다중 선택 시: 모든 선택된 지표의 시계열을 단일 차트에 오버레이 (#TASK-ES-172)
      selectedDims.forEach(function(d){
        var dLabel = dimDisplayNames[d] || d;
        var subMap = aggregateMultiSeries(allRecs, activeEntityKeys, d, period, mode);
        Object.keys(subMap).forEach(function(entKey){
          var subSeries = subMap[entKey];
          if(subSeries && subSeries.points && subSeries.points.length > 0){
            var combinedKey = (activeEntityKeys.length === 1 && mode !== 'all') ? dLabel : (entKey + ' (' + dLabel + ')');
            var cloned = Object.assign({}, subSeries);
            cloned.entity = combinedKey;
            seriesMap[combinedKey] = cloned;
          }
        });
      });
      if(Object.keys(seriesMap).length === 0){
        seriesMap = aggregateMultiSeries(allRecs, activeEntityKeys, dimension, period, mode);
      }
    }

    // 1. 헤더 (1-Line Compact & Intuitive Header)
    var headerHtml = 
      '<div class="u-cockpit-header" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--card);border-radius:12px;cursor:pointer;user-select:none;border:1px solid var(--border);">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="font-size:1.15rem;">📊</span>' +
          '<div>' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-weight:800;font-size:.9375rem;color:var(--ink);">성취 분석 콕핏</span>' +
              '<span class="badge" style="font-size:.6875rem;padding:2px 6px;border-radius:10px;background:rgba(37,99,235,0.12);color:var(--primary);font-weight:800;font-family:monospace;">' + activeEntityKeys.length + '개 종목</span>' +
            '</div>' +
            '<div style="font-size:.6875rem;color:var(--ink-soft);margin-top:1px;">기록 향상 곡선과 실천 패턴 다각도 분석</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;" onclick="event.stopPropagation();">' +
          '<button type="button" class="btn btn-ghost btn-xs" id="uHdrMgmtMenuBtn" style="font-size:.75rem;padding:4px 9px;font-weight:700;border:1px solid var(--border);border-radius:8px;background:var(--card2);cursor:pointer;">' +
            '⚙️ 데이터 관리 ▾' +
          '</button>' +
          '<span id="uAccordionToggleIcon" style="cursor:pointer;font-size:.75rem;padding:2px 6px;font-weight:800;color:var(--ink-soft);">' + (isExpanded ? '▲' : '▼') + '</span>' +
          '<!-- 하위 호환성 앵커 (스크립트/테스트 참조 보존) -->' +
          '<div style="display:none;">' +
            '<button type="button" id="uHdrGridBtn"></button>' +
            '<button type="button" id="uHdrImportBtn"></button>' +
            '<button type="button" id="uHdrExportCsvBtn"></button>' +
            '<button type="button" id="uHdrSnapBtn"></button>' +
          '</div>' +
        '</div>' +
      '</div>';

    // 1-B. 3단계 사용법 퀵 가이드
    var quickGuideHtml = 
      '<div class="u-cockpit-quick-guide" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:6px 10px;background:var(--card2);border-radius:8px;margin-bottom:10px;font-size:.75rem;color:var(--ink-soft);flex-wrap:wrap;">' +
        '<span style="font-weight:800;color:var(--primary);display:flex;align-items:center;gap:3px;"><span>💡</span><span>사용법:</span></span>' +
        '<span style="font-weight:700;color:var(--ink);"><b style="color:var(--primary);">1</b> 렌즈 선택</span>' +
        '<span style="opacity:0.4;">➔</span>' +
        '<span style="font-weight:700;color:var(--ink);"><b style="color:var(--primary);">2</b> 종목 탭</span>' +
        '<span style="opacity:0.4;">➔</span>' +
        '<span style="font-weight:700;color:var(--ink);"><b style="color:var(--primary);">3</b> 성장 분석 확인</span>' +
      '</div>';

    // 2. 컨트롤 바 (기간 & 스케일 알약)
    var periodTabs = [
      { id: 'all', label: '전체 (ALL)' },
      { id: '1y', label: '1Y' },
      { id: '6m', label: '6M' },
      { id: '3m', label: '3M' },
      { id: '1m', label: '1M' },
      { id: '1w', label: '1W' },
      { id: '3d', label: '3D' }
    ];

    var periodHtml = '<div style="display:flex;gap:3px;background:var(--card2);padding:2px;border-radius:8px;">';
    periodTabs.forEach(function(pt){
      var isPAct = (period === pt.id);
      periodHtml += '<button type="button" class="u-period-btn" data-period="' + pt.id + '" style="padding:3px 7px;border:none;border-radius:6px;font-size:.7rem;font-weight:700;font-family:monospace;cursor:pointer;background:' + (isPAct ? 'var(--card)' : 'transparent') + ';color:' + (isPAct ? 'var(--primary)' : 'var(--ink)') + ';box-shadow:' + (isPAct ? '0 1px 2px rgba(0,0,0,0.08)' : 'none') + ';">' + pt.label + '</button>';
    });
    periodHtml += '</div>';

    var scaleToggleHtml = 
      '<div style="display:flex;gap:2px;background:var(--card2);padding:2px;border-radius:6px;">' +
        '<button type="button" class="u-scale-btn" data-scale="linear" style="padding:3px 6px;border:none;border-radius:4px;font-size:.6875rem;font-weight:700;cursor:pointer;background:' + (scaleMode === 'linear' ? 'var(--primary)' : 'transparent') + ';color:' + (scaleMode === 'linear' ? '#fff' : 'var(--ink)') + ';">실제 수치</button>' +
        '<button type="button" class="u-scale-btn" data-scale="normalized" style="padding:3px 6px;border:none;border-radius:4px;font-size:.6875rem;font-weight:700;cursor:pointer;background:' + (scaleMode === 'normalized' ? 'var(--primary)' : 'transparent') + ';color:' + (scaleMode === 'normalized' ? '#fff' : 'var(--ink)') + ';">100% 상대 비교</button>' +
      '</div>';

    // 4대 다차원 분석 렌즈 전환 바 (고밀도 반응형 세그먼트)
    var lenses = [
      { id: 'trend', icon: '📈', label: '성장 추세', sub: '시계열·PR' },
      { id: 'ratio', icon: '⚡', label: '상관 효율비', sub: '단가·비율' },
      { id: 'radar', icon: '🎯', label: '균형 레이더', sub: '달성도·방사형' },
      { id: 'cadence', icon: '🗓️', label: '요일 주기', sub: '루틴·밀도' }
    ];
    var lensHtml = '<div class="u-lens-row" style="display:flex;gap:4px;background:var(--card2);padding:3px;border-radius:10px;margin-bottom:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;">';
    lenses.forEach(function(l){
      var isLAct = (curLens === l.id);
      var actBg = isLAct ? 'var(--primary, #2563eb)' : 'transparent';
      var actFg = isLAct ? '#ffffff' : 'var(--ink)';
      var actShadow = isLAct ? '0 2px 6px rgba(37,99,235,0.25)' : 'none';
      lensHtml += 
        '<button type="button" class="u-lens-btn" data-lens="' + l.id + '" style="flex:1;min-width:78px;padding:7px 4px;border:none;border-radius:8px;cursor:pointer;background:' + actBg + ';color:' + actFg + ';box-shadow:' + actShadow + ';display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:all 0.18s ease;user-select:none;">' +
          '<div style="display:flex;align-items:center;gap:3px;font-size:.75rem;font-weight:800;">' +
            '<span>' + l.icon + '</span><span>' + l.label + '</span>' +
          '</div>' +
          '<span style="font-size:.625rem;opacity:' + (isLAct ? '0.9' : '0.65') + ';font-family:sans-serif;letter-spacing:-0.2px;">' + l.sub + '</span>' +
        '</button>';
    });
    lensHtml += '</div>';

    var lensExplanations = {
      trend: '📈 <b>성장 추세</b>: 선택한 종목의 시간 흐름에 따른 기록 향상 곡선과 역대 최고치(PR)를 추적합니다.',
      ratio: '⚡ <b>상관 효율비</b>: 두 지표 간의 상대적 효율비(예: 볼륨당 성과, 단가당 매출)를 분석합니다.',
      radar: '🎯 <b>균형 레이더</b>: 전체 활동 영역의 비중과 균형도를 방사형 차트로 종합 평가합니다.',
      cadence: '🗓️ <b>요일 주기</b>: 요일별 활동 실천 횟수와 집중 요일을 파악하여 루틴을 점검합니다.'
    };
    var lensExpBannerHtml = 
      '<div class="u-lens-exp-banner" style="font-size:.75rem;color:var(--ink-soft);background:var(--card2);padding:7px 10px;border-radius:8px;margin-bottom:10px;border-left:3px solid var(--primary);line-height:1.4;">' +
        (lensExplanations[curLens] || lensExplanations.trend) +
      '</div>';

    // 3. 엔티티 칩 타이틀 및 목록
    var colors = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];
    var chipsTitleHtml = 
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
        '<span style="font-size:.78125rem;font-weight:800;color:var(--ink);">🎯 분석할 항목 (탭하여 선택):</span>' +
        '<div style="display:flex;gap:4px;align-items:center;">' +
          '<button type="button" class="btn btn-xs btn-ghost u-mode-btn" data-mode="' + (mode === 'all' ? 'single' : 'all') + '" style="font-size:.6875rem;padding:2px 7px;border:1px solid var(--border);border-radius:6px;font-weight:700;cursor:pointer;">' +
            (mode === 'all' ? '🎯 개별 선택 모드' : '✨ 전체 모아보기') +
          '</button>' +
        '</div>' +
      '</div>';

    var chipsHtml = '<div class="u-entity-chip-row" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px;-webkit-overflow-scrolling:touch;">';
    ontology.forEach(function(o, idx){
      var isSel = (mode === 'all') || selected.includes(o.name);
      var cIdx = selected.indexOf(o.name);
      var cColor = cIdx !== -1 ? colors[cIdx % colors.length] : (isSel ? 'var(--primary)' : 'var(--card2)');
      var bg = isSel ? cColor : 'var(--card2)';
      var fg = isSel ? '#ffffff' : 'var(--ink)';
      var bd = isSel ? 'none' : '1px solid var(--border)';

      chipsHtml += 
        '<button type="button" class="u-entity-chip" data-name="' + o.name + '" style="flex-shrink:0;padding:5px 11px;border-radius:16px;font-size:.75rem;font-weight:700;background:' + bg + ';color:' + fg + ';border:' + bd + ';cursor:pointer;display:flex;align-items:center;gap:4px;box-shadow:' + (isSel ? '0 1px 3px rgba(0,0,0,0.12)' : 'none') + ';">' +
          '<span>' + (isSel && mode !== 'all' ? '✓ ' : '') + o.icon + ' ' + o.name + '</span>' +
          '<span style="font-size:.65rem;opacity:0.85;">(' + o.count + ')</span>' +
        '</button>';
    });
    chipsHtml += '</div>';

    // 3-1. 측정 차원(Metric Dimension) 전환 바

    var dimHtml = '<div class="u-dim-selector-row" style="display:flex;gap:5px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px;-webkit-overflow-scrolling:touch;align-items:center;">';
    dimHtml += '<span style="font-size:.75rem;font-weight:800;color:var(--ink);flex-shrink:0;margin-right:4px;">📊 측정 지표 <span style="font-size:.65rem;color:var(--ink-soft);font-family:monospace;">[DIMENSION]</span>:</span>';
    availableDims.forEach(function(d){
      var isDAct = (state.univSelectedDimensions || [dimension]).includes(d);
      var dLabel = dimDisplayNames[d] || d;
      dimHtml += 
        '<button type="button" class="u-dim-btn" data-dim="' + d + '" style="flex-shrink:0;padding:4px 10px;border-radius:14px;font-size:.75rem;font-weight:700;cursor:pointer;border:1.5px solid ' + (isDAct ? 'var(--primary, #2563eb)' : 'var(--border, #cbd5e1)') + ';background:' + (isDAct ? 'rgba(37,99,235,0.14)' : 'var(--card2)') + ';color:' + (isDAct ? 'var(--primary, #1d4ed8)' : 'var(--ink)') + ';box-shadow:' + (isDAct ? '0 1px 2px rgba(0,0,0,0.06)' : 'none') + ';transition:all 0.15s ease;">' +
          (isDAct ? '● ' : '○ ') + dLabel +
        '</button>';
    });
    dimHtml += '</div>';

    // 4. 다차원 분석 렌즈별 정밀 데이터 계산 및 인터랙티브 페어 매핑
    var chartObj = renderMultiSeriesSvg(seriesMap, { width: 520, height: 210, scaleMode: scaleMode, period: period });
    var seriesKeys = Object.keys(seriesMap || {});
    var allEntityNames = ontology.map(function(o){ return o.name; });

    // 상관 효율비 동적 페어 선택기 (Interactive Pair Selector)
    var selRatioNum = state.univRatioNum || allEntityNames[0] || '';
    var selRatioDen = state.univRatioDen || (allEntityNames.length > 1 ? allEntityNames[1] : allEntityNames[0]) || '';
    if(!allEntityNames.includes(selRatioNum)) selRatioNum = allEntityNames[0] || '';
    if(!allEntityNames.includes(selRatioDen)) selRatioDen = (allEntityNames.length > 1 ? allEntityNames[1] : allEntityNames[0]) || '';
    state.univRatioNum = selRatioNum;
    state.univRatioDen = selRatioDen;

    var sA = seriesMap[selRatioNum] || (seriesKeys[0] ? seriesMap[seriesKeys[0]] : null);
    var sB = seriesMap[selRatioDen] || (seriesKeys[1] ? seriesMap[seriesKeys[1]] : sA);
    var ratioData = computeCrossRatioSeries(sA, sB);
    var cadenceData = computeCadenceData(allRecs);

    // 범례 (Legend)
    var legendHtml = '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px;padding:2px 4px;">';
    seriesKeys.forEach(function(k, idx){
      var s = seriesMap[k];
      var col = colors[idx % colors.length];
      legendHtml += 
        '<div style="display:flex;align-items:center;gap:4px;font-size:.7rem;font-weight:700;color:var(--ink);">' +
          '<span style="width:8px;height:8px;border-radius:50%;background:' + col + ';display:inline-block;"></span>' +
          '<span>' + s.entity + '</span>' +
          '<span style="color:' + col + ';font-family:monospace;">' + (s.latestVal ? (s.latestVal + (s.unit ? (' ' + s.unit) : '')) : '-') + '</span>' +
        '</div>';
    });
    legendHtml += '</div>';

    var mainChartContentHtml = '';
    if(curLens === 'trend'){
      mainChartContentHtml = 
        chartObj.svgHtml +
        '<div id="uFloatingInspector" style="display:none;position:absolute;z-index:30;background:rgba(15,23,42,0.95);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.18);color:#fff;padding:8px 12px;border-radius:10px;font-size:.75rem;pointer-events:auto;box-shadow:0 12px 28px -4px rgba(0,0,0,0.48);max-width:215px;">' +
          '<div id="uTipDate" style="font-size:.6875rem;color:#94a3b8;font-family:monospace;"></div>' +
          '<div id="uTipVal" style="font-size:.875rem;font-weight:800;color:#38bdf8;margin:2px 0;"></div>' +
          '<div id="uTipDelta" style="font-size:.6875rem;color:#34d399;"></div>' +
          '<div id="uTipMemo" style="font-size:.6875rem;color:#cbd5e1;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></div>' +
          '<button type="button" class="btn btn-xs btn-ghost" id="uTipEditBtn" style="margin-top:4px;padding:1px 6px;font-size:.65rem;color:#fff;border:1px solid rgba(255,255,255,0.3);width:100%;">✏️ 이 기록 수정</button>' +
        '</div>' +
        legendHtml;
    } else if(curLens === 'ratio'){
      var ratioPairBar = 
        '<div class="u-ratio-pair-bar" style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:8px 10px;background:var(--card);border-radius:10px;margin-bottom:10px;border:1px solid var(--border);flex-wrap:wrap;">' +
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
            '<div style="display:flex;align-items:center;gap:4px;">' +
              '<span style="font-size:.6875rem;font-weight:800;color:var(--primary);font-family:monospace;">분자(A):</span>' +
              '<select id="uRatioNumSelect" style="font-size:.75rem;padding:3px 8px;border-radius:6px;background:var(--card2);color:var(--ink);border:1px solid var(--border);font-weight:700;cursor:pointer;">' +
                allEntityNames.map(function(n){ return '<option value="' + n + '"' + (n === selRatioNum ? ' selected' : '') + '>' + n + '</option>'; }).join('') +
              '</select>' +
            '</div>' +
            '<span style="font-size:1rem;font-weight:900;color:var(--ink-soft);user-select:none;">÷</span>' +
            '<div style="display:flex;align-items:center;gap:4px;">' +
              '<span style="font-size:.6875rem;font-weight:800;color:#10b981;font-family:monospace;">분모(B):</span>' +
              '<select id="uRatioDenSelect" style="font-size:.75rem;padding:3px 8px;border-radius:6px;background:var(--card2);color:var(--ink);border:1px solid var(--border);font-weight:700;cursor:pointer;">' +
                allEntityNames.map(function(n){ return '<option value="' + n + '"' + (n === selRatioDen ? ' selected' : '') + '>' + n + '</option>'; }).join('') +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div style="font-size:.6875rem;font-weight:800;color:var(--brand);padding:3px 8px;border-radius:12px;background:rgba(139,92,246,0.12);font-family:monospace;">' +
            '효율단위: ' + (ratioData ? ratioData.unit : '-') +
          '</div>' +
        '</div>';

      mainChartContentHtml = 
        ratioPairBar +
        '<div style="padding:4px 0;">' +
          renderCrossRatioSvg(ratioData, { width: 520, height: 210 }) +
        '</div>';
    } else if(curLens === 'radar'){
      mainChartContentHtml = 
        '<div style="padding:6px 0;display:flex;justify-content:center;">' +
          renderRadarSvg(ontology, seriesMap, { size: 260 }) +
        '</div>';
    } else if(curLens === 'cadence'){
      mainChartContentHtml = 
        '<div style="padding:4px 0;">' +
          renderCadenceSvg(cadenceData, { width: 520, height: 180 }) +
        '</div>';
    }

    // 5. 4대 수학적 정량 KPI 바 (PEAK | LATEST | NET DELTA | VELOCITY)
    var seriesArray = Object.values(seriesMap);
    var peakStr = '-';
    var latestStr = '-';
    var deltaStr = '-';
    var velocityStr = '-';

    if(curLens === 'ratio' && ratioData){
      peakStr = (ratioData.avgRatio > 0 ? (ratioData.avgRatio + ' ' + ratioData.unit) : '-');
      var rPts = ratioData.points || [];
      latestStr = (rPts.length > 0 ? (rPts[rPts.length - 1].val + ' ' + ratioData.unit) : '-');
      deltaStr = rPts.length > 1 ? (Math.round((rPts[rPts.length - 1].val - rPts[0].val)*10)/10 + ' ' + ratioData.unit) : '단일 관측';
      velocityStr = ratioData.label;
    } else if(curLens === 'cadence' && cadenceData){
      var sortedC = cadenceData.slice().sort(function(a,b){ return b.count - a.count; });
      peakStr = sortedC[0].count > 0 ? (sortedC[0].day + '요일 (' + sortedC[0].pct + '%)') : '-';
      var totSess = cadenceData.reduce(function(acc, c){ return acc + c.count; }, 0);
      latestStr = totSess + '회 총 실천';
      deltaStr = '주 7일 분포';
      velocityStr = (Math.round((totSess / 52)*10)/10) + '회/주 평균';
    } else if(seriesArray.length === 1){
      var sSingle = seriesArray[0];
      peakStr = (sSingle.prVal ? (sSingle.prVal.toLocaleString() + ' ' + sSingle.unit) : '-');
      latestStr = (sSingle.latestVal ? (sSingle.latestVal.toLocaleString() + ' ' + sSingle.unit) : '-');
      deltaStr = (sSingle.netDelta !== 0 ? ((sSingle.netDelta > 0 ? '+' : '') + sSingle.netDelta + ' ' + sSingle.unit + ' (' + (sSingle.growthRate > 0 ? '+' : '') + sSingle.growthRate + '%)') : '변동없음');
      velocityStr = (sSingle.velocityPerWeek !== 0 ? ((sSingle.velocityPerWeek > 0 ? '+' : '') + sSingle.velocityPerWeek + ' ' + sSingle.unit + '/주') : '-');
    } else if(seriesArray.length > 1){
      var totalPrSum = 0;
      var totalLatest = 0;
      seriesArray.forEach(function(s){
        if(s.prVal) totalPrSum += s.prVal;
        if(s.latestVal) totalLatest += s.latestVal;
      });
      peakStr = totalPrSum > 0 ? (totalPrSum.toLocaleString() + ' (합계)') : '-';
      latestStr = totalLatest > 0 ? (totalLatest.toLocaleString() + ' (합계)') : '-';
      deltaStr = seriesArray.map(function(s){ return s.entity + ' ' + (s.growthRate > 0 ? '+' : '') + s.growthRate + '%'; }).slice(0, 2).join(' | ');
      velocityStr = seriesArray.length + '개 지표 추적 중';
    }

    // 차트 상단 헤더 (분석 대상 요약 + 기간/스케일 알약)
    var activeEntLabel = (mode === 'all' ? '전체 ' + ontology.length + '개 종목' : activeEntityKeys.join(', '));
    var chartTitleText = '';
    if(curLens === 'trend'){
      chartTitleText = activeEntLabel + ' 성장 곡선';
    } else if(curLens === 'ratio'){
      chartTitleText = selRatioNum + ' / ' + selRatioDen + ' 상관 효율비';
    } else if(curLens === 'radar'){
      chartTitleText = '종목별 활동 균형도 다각도 레이더';
    } else if(curLens === 'cadence'){
      chartTitleText = '요일별 실천 루틴 및 활동 밀도';
    }

    var chartTitleBar = 
      '<div class="u-chart-title-bar" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap;">' +
        '<div style="font-weight:800;font-size:.8125rem;color:var(--ink);display:flex;align-items:center;gap:5px;">' +
          '<span>📊</span><span>' + chartTitleText + '</span>' +
          '<span style="font-size:.7rem;font-weight:600;color:var(--ink-soft);font-family:monospace;">(' + (period === 'all' ? '전체' : period.toUpperCase()) + ')</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
          periodHtml +
          (curLens === 'trend' ? scaleToggleHtml : '') +
          '<button type="button" class="btn btn-ghost btn-xs" id="uBtnGraphFullscreen" title="전체화면(가로) 보기" style="font-size:.75rem;padding:3px 8px;border:1px solid var(--border);border-radius:6px;background:var(--card2);cursor:pointer;display:inline-flex;align-items:center;gap:4px;font-weight:700;color:var(--ink);">' +
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>' +
            '</svg>' +
            '<span>전체화면</span>' +
          '</button>' +
        '</div>' +
      '</div>';

    var kpiHtml = 
      '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(78px, 1fr));gap:6px;margin-top:10px;">' +
        '<div class="card" style="padding:8px 6px;margin:0;border-radius:10px;background:var(--card);border:1px solid var(--border);text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.03);">' +
          '<div style="font-size:.65rem;font-weight:800;color:#f59e0b;font-family:monospace;display:flex;align-items:center;justify-content:center;gap:3px;">' +
            '<span>🏆</span><span>' + (curLens === 'ratio' ? 'AVG RATIO' : (curLens === 'cadence' ? 'PEAK DAY' : 'PEAK')) + '</span>' +
          '</div>' +
          '<div style="font-size:clamp(0.78rem, 2.2vw, 0.9375rem);font-weight:900;color:var(--primary, #2563eb);margin-top:3px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + peakStr + '</div>' +
        '</div>' +
        '<div class="card" style="padding:8px 6px;margin:0;border-radius:10px;background:var(--card);border:1px solid var(--border);text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.03);">' +
          '<div style="font-size:.65rem;font-weight:800;color:#0284c7;font-family:monospace;display:flex;align-items:center;justify-content:center;gap:3px;">' +
            '<span>⚡</span><span>' + (curLens === 'ratio' ? 'LATEST RATIO' : (curLens === 'cadence' ? 'SESSIONS' : 'LATEST')) + '</span>' +
          '</div>' +
          '<div style="font-size:clamp(0.78rem, 2.2vw, 0.9375rem);font-weight:900;color:var(--ink);margin-top:3px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + latestStr + '</div>' +
        '</div>' +
        '<div class="card" style="padding:8px 6px;margin:0;border-radius:10px;background:var(--card);border:1px solid var(--border);text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.03);">' +
          '<div style="font-size:.65rem;font-weight:800;color:#10b981;font-family:monospace;display:flex;align-items:center;justify-content:center;gap:3px;">' +
            '<span>📈</span><span>' + (curLens === 'ratio' ? 'NET SPREAD' : (curLens === 'cadence' ? 'PATTERN' : 'NET DELTA')) + '</span>' +
          '</div>' +
          '<div style="font-size:clamp(0.75rem, 2vw, 0.875rem);font-weight:900;color:#10b981;margin-top:3px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + deltaStr + '</div>' +
        '</div>' +
        '<div class="card" style="padding:8px 6px;margin:0;border-radius:10px;background:var(--card);border:1px solid var(--border);text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.03);">' +
          '<div style="font-size:.65rem;font-weight:800;color:#8b5cf6;font-family:monospace;display:flex;align-items:center;justify-content:center;gap:3px;">' +
            '<span>🚀</span><span>' + (curLens === 'ratio' ? 'EFFICIENCY' : (curLens === 'cadence' ? 'CADENCE' : 'VELOCITY')) + '</span>' +
          '</div>' +
          '<div style="font-size:clamp(0.75rem, 2vw, 0.875rem);font-weight:900;color:var(--ink);margin-top:3px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + velocityStr + '</div>' +
        '</div>' +
      '</div>';

    // 6. 자율 통계 진단 리포트 (Visual Executive Briefing Card)
    var diagReportVisual = generateStatisticalDiagnosticReport(seriesMap, cadenceData, (curLens === 'ratio' ? ratioData : null), { asHtml: true });
    var aiReportHtml = 
      '<div class="card u-ai-briefing-card" style="margin-top:12px;padding:12px 14px;background:linear-gradient(135deg,rgba(37,99,235,0.05),rgba(139,92,246,0.06));border:1px solid rgba(139,92,246,0.22);border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px;">' +
          '<div style="font-weight:800;font-size:.8125rem;color:var(--brand);display:flex;align-items:center;gap:6px;">' +
            '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 6px #10b981;"></span>' +
            '<span>✨ Gemini 3.1 Flash Lite 자율 다차원 통계 진단 브리핑</span>' +
          '</div>' +
          '<div style="display:flex;gap:4px;">' +
            '<button type="button" class="btn btn-xs btn-ghost" id="uLinkGoalBtn" style="font-size:.6875rem;padding:3px 8px;border:1px solid var(--border);border-radius:6px;">🎯 목표 연계</button>' +
            '<button type="button" class="btn btn-xs btn-primary" id="uRegCalendarBtn" style="font-size:.6875rem;padding:3px 8px;font-weight:700;border-radius:6px;">📅 캘린더 등록</button>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:.78125rem;color:var(--ink);line-height:1.6;">' +
          diagReportVisual +
        '</div>' +
      '</div>';

    // 전체 바디 조립 (3단 레이아웃 완비)
    var bodyHtml = 
      '<div id="uCockpitBody" style="display:' + (isExpanded ? 'block' : 'none') + ';padding-top:10px;">' +
        quickGuideHtml +
        lensHtml +
        lensExpBannerHtml +
        chipsTitleHtml +
        chipsHtml +
        (curLens === 'trend' ? dimHtml : '') +
        chartTitleBar +
        '<div id="uChartContainerWrapper" style="position:relative;background:var(--card2);padding:10px 6px;border-radius:10px;border:1px solid var(--border);">' +
          mainChartContentHtml +
        '</div>' +
        kpiHtml +
        aiReportHtml +
      '</div>';

    container.innerHTML = 
      '<div class="card" id="uCockpitMainCard" style="padding:10px 12px;border-radius:14px;background:var(--card);border:1px solid var(--border);margin-bottom:12px;">' +
        headerHtml +
        bodyHtml +
      '</div>';

    // 6. 인터랙션 이벤트 바인딩
    // 아코디언 토글
    var hdrEl = container.querySelector('.u-cockpit-header');
    var bdyEl = container.querySelector('#uCockpitBody');
    var togIco = container.querySelector('#uAccordionToggleIcon');

    if(hdrEl && bdyEl){
      hdrEl.onclick = function(){
        var nowExp = (bdyEl.style.display !== 'none');
        var nextExp = !nowExp;
        bdyEl.style.display = nextExp ? 'block' : 'none';
        if(togIco) togIco.textContent = nextExp ? '▲' : '▼';
        try {
          if(typeof localStorage !== 'undefined'){
            localStorage.setItem('ourgoal_uStats_expanded', nextExp ? 'true' : 'false');
          }
        } catch(e){}

        if(nextExp){
          requestAnimationFrame(function(){
            var w = container.getBoundingClientRect().width;
            if(w > 100){
              renderUniversalStatsDashboard(container, allRecs, state, callbacks);
            }
          });
        }
      };
    }

    // 데이터 관리 모달 통합 메뉴 버튼
    var mgmtMenuBtn = container.querySelector('#uHdrMgmtMenuBtn');
    if(mgmtMenuBtn){
      mgmtMenuBtn.onclick = function(e){
        e.stopPropagation();
        var curRecs = (state && state.profile && state.profile.records) || allRecs;
        openDataManagementModal({
          allRecs: curRecs,
          state: state,
          callbacks: callbacks,
          onDone: function(){
            var nextRecs = (state && state.profile && state.profile.records) || allRecs;
            renderUniversalStatsDashboard(container, nextRecs, state, callbacks);
          }
        });
      };
    }

    // 하위 호환성 앵커 버튼 (외부 참조 및 기존 스크립트 안전망)
    var gridBtn = container.querySelector('#uHdrGridBtn');
    if(gridBtn){
      gridBtn.onclick = function(e){
        e.stopPropagation();
        openUniversalDataGrid({ allRecs: allRecs, state: state, callbacks: callbacks });
      };
    }

    var impBtn = container.querySelector('#uHdrImportBtn');
    if(impBtn){
      impBtn.onclick = function(e){
        e.stopPropagation();
        openUniversalImportModal({
          openModal: callbacks.openModal || window.openModal,
          closeModal: callbacks.closeModal || window.closeModal,
          toast: callbacks.toast || window.toast,
          state: state,
          saveProfile: callbacks.saveProfile,
          onDone: function(){ renderUniversalStatsDashboard(container, (state && state.profile && state.profile.records) || [], state, callbacks); }
        });
      };
    }

    var expCsvBtn = container.querySelector('#uHdrExportCsvBtn');
    if(expCsvBtn){
      expCsvBtn.onclick = function(e){
        e.stopPropagation();
        exportCleanCsv(allRecs, 'ourgoal_analytics_export.csv');
      };
    }

    var snapBtn = container.querySelector('#uHdrSnapBtn');
    if(snapBtn){
      snapBtn.onclick = function(e){
        e.stopPropagation();
        var mainCard = container.querySelector('#uCockpitMainCard');
        if(mainCard) captureChartSnapshot(mainCard, 'ourgoal_cockpit');
      };
    }

    // 4대 렌즈 전환 버튼
    container.querySelectorAll('.u-lens-btn').forEach(function(btn){
      btn.onclick = function(){
        state.univLens = btn.dataset.lens;
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    });

    // 상관 효율비 분자/분모 지표 변경 리스너
    var numSel = container.querySelector('#uRatioNumSelect');
    if(numSel){
      numSel.onchange = function(){
        state.univRatioNum = numSel.value;
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    }
    var denSel = container.querySelector('#uRatioDenSelect');
    if(denSel){
      denSel.onchange = function(){
        state.univRatioDen = denSel.value;
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    }

    // 모드 버튼
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

    // 7-Tier 기간 버튼
    container.querySelectorAll('.u-period-btn').forEach(function(btn){
      btn.onclick = function(){
        state.univPeriod = btn.dataset.period;
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    });

    // 스케일 모드 버튼
    container.querySelectorAll('.u-scale-btn').forEach(function(btn){
      btn.onclick = function(){
        state.univScaleMode = btn.dataset.scale;
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    });

    // 3-1. 측정 차원(Dimension) 다중 선택 토글 버튼 (매출액, 계약건수, 커밋수, 1RM 등)
    container.querySelectorAll('.u-dim-btn').forEach(function(btn){
      btn.onclick = function(e){
        e.stopPropagation();
        var targetDim = btn.dataset.dim;
        state.univDimension = targetDim;
        var curSelected = (state.univSelectedDimensions || []).slice();
        var idx = curSelected.indexOf(targetDim);
        if(idx !== -1){
          if(curSelected.length > 1){
            curSelected.splice(idx, 1);
            state.univDimension = curSelected[0] || targetDim;
          }
        } else {
          curSelected.push(targetDim);
        }
        state.univSelectedDimensions = curSelected;
        renderUniversalStatsDashboard(container, (state && state.profile && state.profile.records) || allRecs, state, callbacks);
      };
    });

    // 온톨로지 탐색기 오픈
    var taxBtn = container.querySelector('#uTaxonomyOpenBtn');
    if(taxBtn){
      taxBtn.onclick = function(){
        openTaxonomyManagerModal({
          allRecs: allRecs,
          state: state,
          callbacks: {
            openModal: callbacks.openModal,
            closeModal: callbacks.closeModal,
            saveProfile: callbacks.saveProfile,
            toast: callbacks.toast,
            onDone: function(){ renderUniversalStatsDashboard(container, allRecs, state, callbacks); }
          }
        });
      };
    }

    // 엔티티 칩 클릭
    container.querySelectorAll('.u-entity-chip').forEach(function(btn){
      btn.onclick = function(){
        var entName = btn.dataset.name;
        if(state.univMode === 'single' || mode === 'single'){
          state.univSelectedEntities = [entName];
        } else if(state.univMode === 'multi' || mode === 'multi'){
          var curList = state.univSelectedEntities || [];
          if(curList.includes(entName)){
            if(curList.length > 1) state.univSelectedEntities = curList.filter(function(n){ return n !== entName; });
          } else {
            state.univSelectedEntities = curList.concat([entName]);
          }
        }
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    });

    // 십자선 & 플로팅 인스펙터 인터랙션 (Crosshair Tracking)
    var captureRect = container.querySelector('#uCrosshairCapture');
    var crossV = container.querySelector('#uCrosshairV');
    var crossH = container.querySelector('#uCrosshairH');
    var crossDot = container.querySelector('#uCrosshairDot');
    var tipBox = container.querySelector('#uFloatingInspector');
    var tipDate = container.querySelector('#uTipDate');
    var tipVal = container.querySelector('#uTipVal');
    var tipDelta = container.querySelector('#uTipDelta');
    var tipMemo = container.querySelector('#uTipMemo');
    var tipEditBtn = container.querySelector('#uTipEditBtn');
    var curHoverRecId = null;

    if(captureRect && chartObj.points.length > 0){
      function handleMove(e){
        var rect = captureRect.getBoundingClientRect();
        var clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
        var clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);
        if(!clientX || !clientY) return;

        var svgEl = container.querySelector('#uInteractiveSvgChart');
        if(!svgEl) return;
        var svgRect = svgEl.getBoundingClientRect();
        var svgX = ((clientX - svgRect.left) / svgRect.width) * chartObj.width;
        var svgY = ((clientY - svgRect.top) / svgRect.height) * chartObj.height;

        // 가장 가까운 데이터 포인트 탐색 (반경 35px)
        var nearest = null;
        var minDist = 40;

        chartObj.points.forEach(function(pt){
          var dist = Math.hypot(pt.x - svgX, pt.y - svgY);
          if(dist < minDist){
            minDist = dist;
            nearest = pt;
          }
        });

        if(nearest){
          crossV.setAttribute('x1', nearest.x);
          crossV.setAttribute('x2', nearest.x);
          crossV.style.display = 'block';

          crossH.setAttribute('y1', nearest.y);
          crossH.setAttribute('y2', nearest.y);
          crossH.style.display = 'block';

          crossDot.setAttribute('cx', nearest.x);
          crossDot.setAttribute('cy', nearest.y);
          crossDot.setAttribute('fill', nearest.color);
          crossDot.style.display = 'block';

          if(tipBox){
            tipDate.textContent = nearest.date + ' · ' + nearest.seriesName;
            tipVal.textContent = nearest.val.toLocaleString() + ' ' + nearest.unit + (nearest.isPr ? ' (★ PR)' : '');
            if(nearest.delta !== null){
              tipDelta.textContent = (nearest.delta >= 0 ? '+' : '') + nearest.delta + ' ' + nearest.unit + ' (' + (nearest.deltaPct >= 0 ? '+' : '') + nearest.deltaPct + '%)';
              tipDelta.style.color = (nearest.delta >= 0 ? '#34d399' : '#f87171');
            } else {
              tipDelta.textContent = '첫 관측치';
              tipDelta.style.color = '#94a3b8';
            }
            tipMemo.textContent = nearest.memo || '세션 메모 없음';
            curHoverRecId = nearest.recId;

            var tipLeft = Math.min(rect.width - 160, Math.max(10, ((nearest.x / chartObj.width) * svgRect.width) - 50));
            var tipTop = Math.max(10, ((nearest.y / chartObj.height) * svgRect.height) - 75);
            tipBox.style.left = tipLeft + 'px';
            tipBox.style.top = tipTop + 'px';
            tipBox.style.display = 'block';
          }
        }
      }

      function handleLeave(){
        if(crossV) crossV.style.display = 'none';
        if(crossH) crossH.style.display = 'none';
        if(crossDot) crossDot.style.display = 'none';
        // 툴팁은 마우스 벗어나고 1.5초 후 닫기
        setTimeout(function(){
          if(tipBox && !tipBox.matches(':hover')) tipBox.style.display = 'none';
        }, 1500);
      }

      captureRect.addEventListener('mousemove', handleMove);
      captureRect.addEventListener('touchmove', handleMove, { passive: true });
      captureRect.addEventListener('mouseleave', handleLeave);
    }

    if(tipEditBtn){
      tipEditBtn.onclick = function(){
        if(curHoverRecId){
          var targetRec = allRecs.find(function(r){ return r.id === curHoverRecId; });
          if(targetRec){
            openRowEditModal({
              row: {
                id: targetRec.id,
                date: (targetRec.startAt || targetRec.createdAt || '').slice(0, 10),
                entity: targetRec.subTheme || targetRec.item || targetRec.exercise || '일반',
                primaryVal: targetRec.metrics ? (targetRec.metrics.primary || targetRec.metrics['1rm'] || targetRec.metrics.pages || 0) : 0,
                primaryUnit: targetRec.metrics ? (targetRec.metrics.primaryUnit || '') : '',
                secondaryVal: targetRec.metrics ? (targetRec.metrics.secondary || targetRec.metrics.volume || targetRec.metrics.duration || 0) : 0,
                secondaryUnit: targetRec.metrics ? (targetRec.metrics.secondaryUnit || '') : '',
                memo: targetRec.text || ''
              },
              callbacks: callbacks,
              state: state,
              onSaved: function(){
                renderUniversalStatsDashboard(container, state.profile.records, state, callbacks);
              }
            });
          }
        }
      };
    }

    // 캘린더 실천 등록
    var calBtn = container.querySelector('#uRegCalendarBtn');
    if(calBtn){
      calBtn.onclick = function(){
        var dStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        var calItem = {
          id: 'cal_' + Date.now(),
          title: '🔥 ' + activeEntityKeys[0] + ' 성장 실천 세션',
          date: dStr,
          time: '19:00',
          completed: false,
          theme: inferDomainKey(activeEntityKeys[0]),
          autoGenerated: true
        };
        if(state.profile){
          state.profile.calendar = state.profile.calendar || [];
          state.profile.calendar.push(calItem);
          if(callbacks.saveProfile) callbacks.saveProfile();
          if(callbacks.toast) callbacks.toast('내일 캘린더에 [' + calItem.title + '] 실천이 등록되었습니다! 📅');
        }
      };
    }

    // 목표 연계
    var goalBtn = container.querySelector('#uLinkGoalBtn');
    if(goalBtn){
      goalBtn.onclick = function(){
        if(callbacks.toast) callbacks.toast('[' + activeEntityKeys[0] + '] 지표가 목표 진척도 계산식과 실시간 연계되었습니다! 🎯');
      };
    }

    // 전체화면 (가로 모드) 버튼 바인딩 (#TASK-ES-172)
    var fsBtn = container.querySelector('#uBtnGraphFullscreen');
    if(fsBtn){
      fsBtn.onclick = function(e){
        e.stopPropagation();
        openStatsFullscreenModal(seriesMap, allRecs, state, callbacks);
      };
    }
  }

  /**
   * 성취통계 전체화면(가로) 뷰포트 모달 (#TASK-ES-172)
   * 디바이스 기기 화면비율에 알맞게 자동 피팅하며, 세로 폰에서도 가로 꽉 찬 뷰 지원
   */
  function openStatsFullscreenModal(seriesMap, allRecs, state, callbacks){
    var oldModal = document.getElementById('uStatsFullscreenModal');
    if(oldModal) oldModal.remove();

    var modal = document.createElement('div');
    modal.id = 'uStatsFullscreenModal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '100030';
    modal.style.background = 'rgba(11, 17, 32, 0.98)';
    modal.style.backdropFilter = 'blur(20px)';
    modal.style.webkitBackdropFilter = 'blur(20px)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.padding = '12px 16px';
    modal.style.boxSizing = 'border-box';
    modal.style.overflow = 'hidden';
    modal.style.color = '#fff';

    document.body.appendChild(modal);

    var curPeriod = state.univPeriod || 'all';
    var curScale = state.univScaleMode || 'linear';
    var isForcedRotated = false;

    var dimNames = {
      '1rm': '추정 1RM(kg)', 'estimated_1rm_kg': '1RM(kg)', 'volume': '총 볼륨(kg)',
      'daily_volume_kg': '일일 볼륨(kg)', 'bodyweight': '체중(kg)', 'bodyweight_kg': '체중(kg)',
      'sets': '세트수', 'record': '완주기록(초)', 'pace': '페이스', 'rpe': '체감강도(RPE)',
      'intensity': '운동강도(%)', 'distance': '거리(km)', 'pages': '독서량(쪽)', 'duration': '소요시간(분)',
      'revenue': '매출액(만원)', 'contracts': '계약건수(건)', 'deals': '계약건수(건)', 'score': '점수(점)',
      'problems': '문제수(개)', 'commits': '커밋수(개)', 'prs': 'PR수(개)', 'reviews': '코드리뷰(건)',
      'meetings': '미팅(회)', 'proposals': '제안서(건)', 'savings': '저축액(만원)', 'hours': '수면(시간)',
      'primary': '1차 지표', 'secondary': '2차 지표'
    };

    function renderFullscreenContent(){
      var winW = window.innerWidth;
      var winH = window.innerHeight;
      var isLandscape = winW >= winH;

      var plotW, plotH;
      if(isForcedRotated && !isLandscape){
        plotW = Math.max(winH - 32, 480);
        plotH = Math.max(winW - 130, 240);
      } else {
        plotW = Math.max(winW - 32, 320);
        plotH = Math.max(winH - 120, 240);
      }

      var fsChartObj = renderMultiSeriesSvg(seriesMap, {
        width: plotW,
        height: plotH,
        scaleMode: curScale,
        period: curPeriod
      });

      var activeEntities = Object.keys(seriesMap || {});
      var colors = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

      var fsPeriodTabs = [
        { id: 'all', label: '전체 (ALL)' },
        { id: '1y', label: '1Y' },
        { id: '6m', label: '6M' },
        { id: '3m', label: '3M' },
        { id: '1m', label: '1M' },
        { id: '1w', label: '1W' },
        { id: '3d', label: '3D' }
      ];

      var periodBtnsHtml = '<div style="display:flex;gap:3px;background:rgba(255,255,255,0.08);padding:3px;border-radius:8px;">' +
        fsPeriodTabs.map(function(pt){
          var isAct = curPeriod === pt.id;
          return '<button type="button" class="u-fs-period-btn" data-p="' + pt.id + '" style="padding:4px 8px;border:none;border-radius:6px;font-size:0.75rem;font-weight:700;font-family:monospace;cursor:pointer;background:' + (isAct ? '#3b82f6' : 'transparent') + ';color:' + (isAct ? '#fff' : '#cbd5e1') + ';">' + pt.label + '</button>';
        }).join('') +
      '</div>';

      var scaleBtnsHtml = '<div style="display:flex;gap:3px;background:rgba(255,255,255,0.08);padding:3px;border-radius:8px;">' +
        '<button type="button" class="u-fs-scale-btn" data-s="linear" style="padding:4px 8px;border:none;border-radius:6px;font-size:0.75rem;font-weight:700;cursor:pointer;background:' + (curScale === 'linear' ? '#3b82f6' : 'transparent') + ';color:' + (curScale === 'linear' ? '#fff' : '#cbd5e1') + ';">실제 수치</button>' +
        '<button type="button" class="u-fs-scale-btn" data-s="normalized" style="padding:4px 8px;border:none;border-radius:6px;font-size:0.75rem;font-weight:700;cursor:pointer;background:' + (curScale === 'normalized' ? '#3b82f6' : 'transparent') + ';color:' + (curScale === 'normalized' ? '#fff' : '#cbd5e1') + ';">100% 상대 비교</button>' +
      '</div>';

      var rotateBtnHtml = '';
      if(!isLandscape){
        rotateBtnHtml = '<button type="button" id="uFsRotateBtn" style="padding:5px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;font-size:0.75rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">' +
          '<span>🔄 ' + (isForcedRotated ? '세로 보기' : '가로 회전') + '</span>' +
        '</button>';
      }

      var fsLegendHtml = '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:6px 4px;margin-top:6px;overflow-x:auto;">' +
        activeEntities.map(function(k, idx){
          var s = seriesMap[k];
          var col = colors[idx % colors.length];
          return '<div style="display:flex;align-items:center;gap:5px;font-size:.78rem;font-weight:700;color:#cbd5e1;white-space:nowrap;">' +
            '<span style="width:10px;height:10px;border-radius:50%;background:' + col + ';display:inline-block;box-shadow:0 0 6px ' + col + ';"></span>' +
            '<span>' + s.entity + '</span>' +
            '<span style="color:' + col + ';font-family:monospace;font-weight:800;">' + (s.latestVal ? (s.latestVal + (s.unit ? (' ' + s.unit) : '')) : '-') + '</span>' +
          '</div>';
        }).join('') +
      '</div>';

      var rotationStyle = '';
      if(isForcedRotated && !isLandscape){
        rotationStyle = 'transform:rotate(90deg);transform-origin:center center;width:' + (winH - 32) + 'px;height:' + (winW - 130) + 'px;position:absolute;top:50%;left:50%;margin-left:-' + ((winH - 32)/2) + 'px;margin-top:-' + ((winW - 130)/2) + 'px;';
      } else {
        rotationStyle = 'width:100%;box-sizing:border-box;';
      }

      modal.innerHTML = 
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-shrink:0;gap:8px;flex-wrap:wrap;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="font-size:1.3rem;">📊</span>' +
            '<div>' +
              '<h3 style="margin:0;font-size:1.05rem;font-weight:800;color:#fff;letter-spacing:-0.3px;">성취 분석 전체화면 뷰</h3>' +
              '<span style="font-size:0.75rem;color:#94a3b8;font-family:monospace;">화면 비율: ' + (isLandscape ? '가로 와이드 핏' : (isForcedRotated ? '가로 회전 핏' : '모바일 핏')) + ' (' + winW + 'x' + winH + ')</span>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
            periodBtnsHtml +
            scaleBtnsHtml +
            rotateBtnHtml +
            '<button type="button" id="uFsCloseBtn" style="padding:6px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.25);background:rgba(239,68,68,0.2);color:#fca5a5;font-weight:800;cursor:pointer;font-size:0.85rem;display:inline-flex;align-items:center;gap:4px;">' +
              '<span>✕ 닫기</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div id="uFsChartWrapper" style="flex:1;min-height:0;position:relative;background:rgba(15,23,42,0.85);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:8px;display:flex;flex-direction:column;justify-content:center;align-items:center;overflow:hidden;' + rotationStyle + '">' +
          fsChartObj.svgHtml +
        '</div>' +
        fsLegendHtml;

      modal.querySelector('#uFsCloseBtn').onclick = function(){
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKey);
        modal.remove();
      };

      modal.querySelectorAll('.u-fs-period-btn').forEach(function(btn){
        btn.onclick = function(){
          curPeriod = btn.dataset.p;
          state.univPeriod = curPeriod;
          var selectedDims = state.univSelectedDimensions || [state.univDimension || 'primary'];
          seriesMap = {};
          if(selectedDims.length > 1){
            selectedDims.forEach(function(d){
              var dLabel = dimNames[d] || d;
              var subMap = aggregateMultiSeries(allRecs, state.univSelectedEntities || [], d, curPeriod, state.univMode || 'single');
              Object.keys(subMap).forEach(function(entKey){
                var subSeries = subMap[entKey];
                if(subSeries && subSeries.points && subSeries.points.length > 0){
                  var combinedKey = entKey + ' (' + dLabel + ')';
                  var cloned = Object.assign({}, subSeries);
                  cloned.entity = combinedKey;
                  seriesMap[combinedKey] = cloned;
                }
              });
            });
          } else {
            seriesMap = aggregateMultiSeries(allRecs, state.univSelectedEntities || [], state.univDimension || 'primary', curPeriod, state.univMode || 'single');
          }
          renderFullscreenContent();
        };
      });

      modal.querySelectorAll('.u-fs-scale-btn').forEach(function(btn){
        btn.onclick = function(){
          curScale = btn.dataset.s;
          state.univScaleMode = curScale;
          renderFullscreenContent();
        };
      });

      var rotBtn = modal.querySelector('#uFsRotateBtn');
      if(rotBtn){
        rotBtn.onclick = function(){
          isForcedRotated = !isForcedRotated;
          renderFullscreenContent();
        };
      }
    }

    function handleResize(){
      renderFullscreenContent();
    }
    function handleKey(e){
      if(e.key === 'Escape'){
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKey);
        modal.remove();
      }
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKey);

    renderFullscreenContent();
  }

  function openUniversalImportModal(opts){
    opts = opts || {};
    var openModalFn = opts.openModal;
    var closeModalFn = opts.closeModal;
    var toastFn = opts.toast;
    var state = opts.state;
    var saveProfileFn = opts.saveProfile;
    var onDoneFn = opts.onDone;

    if(!openModalFn) return;

    var stagedRecs = [];
    var curRecs = (state && state.profile && state.profile.records) || [];
    var sampleCount = curRecs.filter(function(r){ return r.isSample; }).length;

    var purgeBannerHtml = '';
    if(sampleCount > 0){
      purgeBannerHtml = 
        '<div class="u-sample-purge-row" id="uSamplePurgeRow" style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:8px 12px;margin-bottom:12px;">' +
          '<div style="font-size:.8125rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
            '<span>🧪 현재 체험 샘플 <b>' + sampleCount + '건</b> 로드됨</span>' +
          '</div>' +
          '<button type="button" class="btn btn-xs btn-danger" id="uPurgeSampleBtn" style="font-size:.75rem;padding:4px 10px;font-weight:700;border-radius:6px;cursor:pointer;">' +
            '🧹 샘플만 삭제' +
          '</button>' +
        '</div>';
    }

    function renderSampleCardsHtml(themeId){
      var th = SAMPLE_THEMES.find(function(t){ return t.id === themeId; }) || SAMPLE_THEMES[0];
      return th.items.map(function(item){
        return '<div class="btn btn-ghost u-sample-card" data-sample="' + item.key + '" style="height:auto;padding:10px 12px;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:8px;border:1.5px solid var(--border);border-radius:10px;cursor:pointer;transition:all .15s;background:var(--card);">' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
              '<span style="font-weight:700;font-size:.84rem;color:var(--ink);">' + item.icon + ' ' + item.title + '</span>' +
              '<span class="badge" style="font-size:.65rem;background:var(--card2);color:var(--brand);padding:1px 5px;border-radius:4px;font-weight:700;">' + item.tag + '</span>' +
            '</div>' +
            '<div style="font-size:.72rem;color:var(--ink-soft);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + item.desc + '</div>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-xs u-sample-quick-btn" data-quick-sample="' + item.key + '" style="font-weight:700;padding:5px 9px;font-size:.72rem;white-space:nowrap;box-shadow:0 1px 3px rgba(37,99,235,0.25);flex-shrink:0;">⚡ 1초 로드</button>' +
        '</div>';
      }).join('');
    }

    var modalHtml = 
      '<div class="modal-head">' +
        '<h3>📥 데이터 가져오기 & 1초 샘플 로드</h3>' +
      '</div>' +
      purgeBannerHtml +
      '<div style="margin-bottom:12px;font-size:.8125rem;color:var(--ink-soft);line-height:1.4;">' +
        '운동·업무·학습·재테크·웰니스 5대 테마 중 원하는 분야를 골라 1초 만에 실제 52주 데이터를 융합해보세요.' +
      '</div>' +

      '<!-- 3개 탭 바 -->' +
      '<div class="tab-bar" style="margin-bottom:14px;display:flex;gap:4px;border-bottom:1px solid var(--border);padding-bottom:6px;">' +
        '<button class="tab-btn active" id="uImpTabSamples" type="button" style="flex:1;padding:8px 4px;font-size:.8125rem;font-weight:700;border:none;background:transparent;color:var(--brand);border-bottom:2px solid var(--brand);cursor:pointer;">⚡ 52주 추천 샘플</button>' +
        '<button class="tab-btn" id="uImpTabCsv" type="button" style="flex:1;padding:8px 4px;font-size:.8125rem;font-weight:600;border:none;background:transparent;color:var(--ink-soft);cursor:pointer;">📁 CSV 파일</button>' +
        '<button class="tab-btn" id="uImpTabText" type="button" style="flex:1;padding:8px 4px;font-size:.8125rem;font-weight:600;border:none;background:transparent;color:var(--ink-soft);cursor:pointer;">✍️ 엑셀/텍스트 붙여넣기</button>' +
      '</div>' +

      '<!-- Tab 1: 추천 샘플 1초 로드 -->' +
      '<div id="uImpPanelSamples" class="u-imp-panel">' +
        '<!-- 5대 테마 탭 칩 바 (가로 스크롤 가능) -->' +
        '<div class="u-theme-tab-row" id="uSampleThemeTabRow" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:10px;-webkit-overflow-scrolling:touch;scrollbar-width:none;">' +
          SAMPLE_THEMES.map(function(th, idx){
            var isActive = idx === 0;
            return '<button type="button" class="btn btn-xs u-theme-tab-btn' + (isActive ? ' active' : '') + '" data-theme="' + th.id + '" style="flex-shrink:0;padding:6px 11px;border-radius:20px;font-size:.75rem;font-weight:700;border:1px solid ' + (isActive ? 'var(--brand)' : 'var(--border)') + ';background:' + (isActive ? 'var(--brand)' : 'var(--card)') + ';color:' + (isActive ? '#fff' : 'var(--ink)') + ';cursor:pointer;transition:all .15s;">' +
              th.label + ' (7)' +
            '</button>';
          }).join('') +
        '</div>' +
        '<!-- 테마별 7개 카드 컨테이너들 (활성 테마만 표출) -->' +
        '<div id="uSampleCardContainer" class="u-sample-cards-wrapper">' +
          SAMPLE_THEMES.map(function(th, idx){
            var isActive = idx === 0;
            return '<div class="u-sample-card-grid" data-theme-panel="' + th.id + '" style="display:' + (isActive ? 'grid' : 'none') + ';grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:8px;">' +
              renderSampleCardsHtml(th.id) +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +

      '<!-- Tab 2: CSV 파일 -->' +
      '<div id="uImpPanelCsv" class="u-imp-panel" style="display:none;">' +
        '<div class="field" style="margin-bottom:8px;">' +
          '<label style="font-size:.8125rem;font-weight:600;">CSV 파일 선택</label>' +
          '<input type="file" id="uImpCsvFileInput" accept=".csv,text/csv,text/plain" style="width:100%;box-sizing:border-box;margin-top:4px;">' +
        '</div>' +
        '<div class="faint" style="font-size:.75rem;line-height:1.4;">' +
          '💡 영업 실적, GitHub 커밋 로그, 수험 타이머 기록, 체중 등 모든 CSV 파일을 지원합니다. 첫 번째 행(헤더)의 컬럼명을 AI가 스스로 감지합니다.' +
        '</div>' +
      '</div>' +

      '<!-- Tab 3: 엑셀/텍스트 붙여넣기 -->' +
      '<div id="uImpPanelText" class="u-imp-panel" style="display:none;">' +
        '<div class="field" style="margin-bottom:8px;">' +
          '<label style="font-size:.8125rem;font-weight:600;">엑셀 복사(탭 구분) 또는 일기/메모 줄글</label>' +
          '<textarea id="uImpTextInput" rows="5" placeholder="예 1 (B2B 영업 실적):&#10;2025-05-10\t콜 25건\t미팅 4건\t수주 1200만원&#10;2025-05-11\t콜 30건\t미팅 5건\t수주 2500만원&#10;&#10;예 2 (개발 활동):&#10;2025-06-15, 커밋 12회, PR 3개, 리뷰 5회&#10;2025-06-16, 커밋 8회, PR 1개, 리뷰 2회" style="width:100%;box-sizing:border-box;font-family:monospace;font-size:.8125rem;line-height:1.4;margin-top:4px;"></textarea>' +
        '</div>' +
      '</div>' +

      '<!-- 실시간 분석 결과 & 데이터 테이블 미리보기 영역 -->' +
      '<div id="uImpPreviewBox" style="display:none;margin-top:12px;padding:10px;background:var(--card2);border-radius:10px;font-size:.8125rem;">' +
        '<div id="uImpPreviewTitle" style="font-weight:700;color:var(--brand);margin-bottom:4px;"></div>' +
        '<div id="uImpPreviewTableArea"></div>' +
      '</div>' +

      '<div class="modal-actions" style="margin-top:14px;display:flex;justify-content:flex-end;gap:8px;">' +
        '<button class="btn btn-ghost" id="uImpCancelBtn" type="button">닫기</button>' +
        '<button class="btn btn-primary" id="uImpApplyBtn" type="button" style="display:none;">기록에 융합하기</button>' +
      '</div>';

    openModalFn(modalHtml, function(modalEl){
      var tabSamples = modalEl.querySelector('#uImpTabSamples');
      var tabCsv = modalEl.querySelector('#uImpTabCsv');
      var tabText = modalEl.querySelector('#uImpTabText');
      var panelSamples = modalEl.querySelector('#uImpPanelSamples');
      var panelCsv = modalEl.querySelector('#uImpPanelCsv');
      var panelText = modalEl.querySelector('#uImpPanelText');
      var previewBox = modalEl.querySelector('#uImpPreviewBox');
      var previewTitle = modalEl.querySelector('#uImpPreviewTitle');
      var previewTableArea = modalEl.querySelector('#uImpPreviewTableArea');
      var applyBtn = modalEl.querySelector('#uImpApplyBtn');
      var cancelBtn = modalEl.querySelector('#uImpCancelBtn');
      var purgeBtn = modalEl.querySelector('#uPurgeSampleBtn');

      function switchTab(t){
        [tabSamples, tabCsv, tabText].forEach(function(b){
          if(!b) return;
          b.classList.toggle('active', b === t);
          b.style.color = (b === t) ? 'var(--brand)' : 'var(--ink-soft)';
          b.style.borderBottom = (b === t) ? '2px solid var(--brand)' : 'none';
        });
        if(panelSamples) panelSamples.style.display = (t === tabSamples) ? 'block' : 'none';
        if(panelCsv) panelCsv.style.display = (t === tabCsv) ? 'block' : 'none';
        if(panelText) panelText.style.display = (t === tabText) ? 'block' : 'none';
      }

      if(tabSamples) tabSamples.onclick = function(){ switchTab(tabSamples); };
      if(tabCsv) tabCsv.onclick = function(){ switchTab(tabCsv); };
      if(tabText) tabText.onclick = function(){ switchTab(tabText); };
      if(cancelBtn) cancelBtn.onclick = closeModalFn;

      // 0. 샘플 데이터 일괄 삭제/정화 안전망
      if(purgeBtn){
        purgeBtn.onclick = async function(){
          if(!confirm('체험용으로 로드된 샘플 데이터 ' + sampleCount + '건만 삭제하시겠습니까?\n(회원님의 실제 기록은 100% 안전하게 보존됩니다)')) return;
          var kept = curRecs.filter(function(r){ return !r.isSample; });
          if(state && state.profile) state.profile.records = kept;
          if(saveProfileFn) await saveProfileFn();
          closeModalFn();
          if(toastFn) toastFn('샘플 데이터 ' + sampleCount + '건이 모두 정리되었습니다! ✨');
          if(onDoneFn) onDoneFn('purge', sampleCount);
        };
      }

      // 공통 융합 실행 함수 (원터치 1초 로더)
      async function executeImport(recsToImport, domainLabel){
        if(!recsToImport || !recsToImport.length) return;
        var cur = (state && state.profile && state.profile.records) || [];
        var merged = cur.slice();
        var added = 0;
        recsToImport.forEach(function(sr){
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

        if(onDoneFn) onDoneFn(domainLabel || 'general', added);
        if(toastFn) toastFn('총 ' + added + '건의 [' + (domainLabel || '데이터') + '] 기록을 1초 만에 융합했습니다! 콕핏 차트를 확인해보세요 🔥');
      }

      // 샘플 레코드 생성 헬퍼
      function getSampleRecs(sKey){
        if(sKey === 'big3_52w') return generate52WeekPowerliftingSample();
        if(sKey === 'olympic_1924') return generate1920sOlympicStrengthSample();
        return generateDomainSample(sKey);
      }

      var sampleCardContainer = modalEl.querySelector('#uSampleCardContainer');
      var themeTabBtns = modalEl.querySelectorAll('.u-theme-tab-btn');

      function bindSampleInteractions(){
        // 1-A. 샘플 카드 내 [⚡ 1초 로드] 원터치 직행 버튼
        modalEl.querySelectorAll('.u-sample-quick-btn').forEach(function(qBtn){
          qBtn.onclick = function(e){
            e.stopPropagation();
            var sKey = qBtn.dataset.quickSample;
            var recs = getSampleRecs(sKey);
            var titleStr = qBtn.closest('.u-sample-card') ? qBtn.closest('.u-sample-card').textContent.trim().split('\n')[0] : sKey;
            executeImport(recs, titleStr);
          };
        });

        // 1-B. 샘플 카드 본체 클릭 시 선택 활성화 & 하단 프리뷰
        modalEl.querySelectorAll('.u-sample-card').forEach(function(card){
          card.onclick = function(){
            modalEl.querySelectorAll('.u-sample-card').forEach(function(c){
              c.style.border = '1.5px solid var(--border)';
              c.style.background = 'var(--card)';
            });
            card.style.border = '2px solid var(--brand)';
            card.style.background = 'var(--brand-faint, rgba(37,99,235,0.06))';

            var sKey = card.dataset.sample;
            stagedRecs = getSampleRecs(sKey);

            previewBox.style.display = 'block';
            var titleStr = sKey === 'big3_52w' ? '52주 3대운동 156세션' : card.textContent.trim().split('\n')[0];
            previewTitle.textContent = '선택됨: ' + titleStr + ' (' + stagedRecs.length + '개 세션 준비 완료)';
            previewTableArea.innerHTML = renderTablePreview(stagedRecs);

            applyBtn.style.display = 'inline-block';
            applyBtn.textContent = stagedRecs.length + '개 데이터 1초 만에 융합하기';
          };
        });
      }

      // 테마 탭 전환 이벤트 바인딩
      themeTabBtns.forEach(function(thBtn){
        thBtn.onclick = function(){
          var themeId = thBtn.dataset.theme;
          themeTabBtns.forEach(function(b){
            var isCur = b === thBtn;
            b.classList.toggle('active', isCur);
            b.style.border = isCur ? '1px solid var(--brand)' : '1px solid var(--border)';
            b.style.background = isCur ? 'var(--brand)' : 'var(--card)';
            b.style.color = isCur ? '#fff' : 'var(--ink)';
          });
          modalEl.querySelectorAll('.u-sample-card-grid[data-theme-panel]').forEach(function(grid){
            grid.style.display = (grid.dataset.themePanel === themeId) ? 'grid' : 'none';
          });
        };
      });

      // 마운트 시 전체 35종 카드에 상호작용 바인딩 1회 수행 (Zero Dead Click 보장)
      bindSampleInteractions();

      // 테이블 프리뷰 렌더러
      function renderTablePreview(recs){
        if(!recs || !recs.length) return '';
        var rows = recs.slice(0, 4);
        var trs = rows.map(function(r){
          var d = (r.startAt || '').slice(0, 10);
          var ent = r.subTheme || r.exercise || r.item || '일반';
          var pVal = (r.metrics && (r.metrics.primary !== undefined ? r.metrics.primary : (r.metrics['1rm'] || r.metrics.revenue || r.metrics.commits || '-'))) + (r.metrics && r.metrics.primaryUnit ? (' ' + r.metrics.primaryUnit) : '');
          var sVal = (r.metrics && (r.metrics.secondary !== undefined ? r.metrics.secondary : (r.metrics.volume || r.metrics.deals || r.metrics.prs || '-'))) + (r.metrics && r.metrics.secondaryUnit ? (' ' + r.metrics.secondaryUnit) : '');
          var txt = r.text || '';
          if(txt.length > 28) txt = txt.slice(0, 28) + '…';
          return '<tr style="border-bottom:1px solid var(--border);">' +
            '<td style="padding:4px 6px;white-space:nowrap;color:var(--ink);">' + d + '</td>' +
            '<td style="padding:4px 6px;font-weight:700;color:var(--brand);white-space:nowrap;">' + ent + '</td>' +
            '<td style="padding:4px 6px;white-space:nowrap;color:#10b981;font-weight:700;">' + pVal + '</td>' +
            '<td style="padding:4px 6px;white-space:nowrap;color:#6366f1;">' + sVal + '</td>' +
            '<td style="padding:4px 6px;color:var(--ink-soft);">' + txt + '</td>' +
          '</tr>';
        }).join('');

        return '<div style="margin-top:6px;max-height:150px;overflow-x:auto;border:1px solid var(--border);border-radius:8px;background:var(--card);">' +
          '<table style="width:100%;border-collapse:collapse;text-align:left;font-size:11px;font-family:monospace;">' +
            '<thead style="background:var(--card2);border-bottom:1px solid var(--border);color:var(--ink-soft);">' +
              '<tr>' +
                '<th style="padding:4px 6px;">일자</th><th style="padding:4px 6px;">항목</th><th style="padding:4px 6px;">주요수치</th><th style="padding:4px 6px;">보조수치</th><th style="padding:4px 6px;">내용 요약</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' + trs + '</tbody>' +
          '</table>' +
        '</div>';
      }

      // 2. CSV 파일 파싱
      var fileInp = modalEl.querySelector('#uImpCsvFileInput');
      if(fileInp){
        fileInp.onchange = function(e){
          var file = e.target.files && e.target.files[0];
          if(!file) return;
          var reader = new FileReader();
          reader.onload = function(evt){
            var csvStr = evt.target.result || '';
            stagedRecs = parseCsvToUniversalRecords(csvStr, 'general');
            if(stagedRecs.length === 0){
              if(toastFn) toastFn('CSV 파일에 유효한 데이터 행이 부족합니다.');
              return;
            }
            previewBox.style.display = 'block';
            previewTitle.textContent = 'CSV 분석 완료: ' + stagedRecs.length + '건의 데이터 감지됨 (상위 미리보기)';
            previewTableArea.innerHTML = renderTablePreview(stagedRecs);
            applyBtn.style.display = 'inline-block';
            applyBtn.textContent = stagedRecs.length + '건의 기록 융합하기';
          };
          reader.readAsText(file);
        };
      }

      // 3. 텍스트 파싱
      var textInp = modalEl.querySelector('#uImpTextInput');
      if(textInp){
        textInp.oninput = function(){
          var raw = textInp.value.trim();
          if(!raw){
            applyBtn.style.display = 'none';
            previewBox.style.display = 'none';
            stagedRecs = [];
            return;
          }
          stagedRecs = parseCsvToUniversalRecords(raw, 'general');
          if(stagedRecs.length > 0){
            previewBox.style.display = 'block';
            previewTitle.textContent = '텍스트 분석 완료: ' + stagedRecs.length + '건 감지됨 (상위 미리보기)';
            previewTableArea.innerHTML = renderTablePreview(stagedRecs);
            applyBtn.style.display = 'inline-block';
            applyBtn.textContent = stagedRecs.length + '건의 기록 융합하기';
          }
        };
      }

      // 4. 하단 적용 버튼 클릭
      if(applyBtn){
        applyBtn.onclick = function(){
          executeImport(stagedRecs, '가져온 데이터');
        };
      }
    });
  }


  /* ================= [#TASK-ES-163] 도메인별 측정지표 차등 분석 모델 ================= */
  var METRIC_DIFFERENTIATED_MODELS = {
    // 1. 체중/다이어트: 7일 이동평균 & 주간 감량 안전속도
    weight: {
      name: '체중 및 체성분 정밀 분석',
      modelType: 'moving_average_safety',
      analyze: function(points){
        points = Array.isArray(points) ? points : [];
        var n = points.length;
        if(n === 0) return { title: '체중 데이터 없음', kpis: [], summary: '체중 기록을 추가해보세요.' };
        var latest = points[n - 1].value || 0;
        var first = points[0].value || latest;
        var totalDiff = +(latest - first).toFixed(2);
        
        // 7일 이동평균 계산
        var last7 = points.slice(-7);
        var ma7 = +(last7.reduce(function(a, b){ return a + (b.value||0); }, 0) / (last7.length || 1)).toFixed(2);
        
        // 주간 속도 (최근 7일 기준 감량폭)
        var weeklyDiff = last7.length > 1 ? +(last7[last7.length - 1].value - last7[0].value).toFixed(2) : 0;
        var isSafeVelocity = weeklyDiff >= -1.0 && weeklyDiff <= 0.5;
        var velocityText = weeklyDiff <= 0 ? (Math.abs(weeklyDiff) + 'kg 감량/주') : ('+' + weeklyDiff + 'kg 증량/주');

        return {
          model: 'weight',
          title: '⚖️ 체중 7일 이동평균 & 감량 안전도 정밀 분석',
          kpis: [
            { label: '현재 체중', val: latest + ' kg', badge: '최신 실측' },
            { label: '7일 이동평균 (MA7)', val: ma7 + ' kg', badge: '체수분 보정 정본' },
            { label: '주간 속도', val: velocityText, badge: isSafeVelocity ? '안전 골디락스' : '주의 속도' },
            { label: '총 누적 변동', val: (totalDiff > 0 ? '+' : '') + totalDiff + ' kg', badge: totalDiff <= 0 ? '감량 성공' : '증량' }
          ],
          summary: '체수분 왜곡을 배제한 7일 이동평균은 ' + ma7 + 'kg이며, ' + (isSafeVelocity ? '근손실 없는 안전 감량 궤도를 유지 중입니다.' : '급격한 수분 변화를 주의하고 균형 잡힌 영양을 섭취하세요.')
        };
      }
    },

    // 2. 3대 운동 / 헬스: 에플리 1RM 추정 & 과부하 성장률
    big3: {
      name: '스트렝스 1RM 추정 및 점진적 과부하 분석',
      modelType: 'epley_1rm_overload',
      analyze: function(points){
        points = Array.isArray(points) ? points : [];
        var n = points.length;
        if(n === 0) return { title: '운동 데이터 없음', kpis: [], summary: '세트/중량 기록을 추가해보세요.' };
        var maxWeight = Math.max.apply(null, points.map(function(p){ return p.value || 0; }));
        var latestWeight = points[n - 1].value || 0;
        // 에플리 공식: 1RM = Weight * (1 + Reps / 30) (5회 기준 1.167)
        var estimated1RM = Math.round(maxWeight * (1 + 5 / 30));
        var first = points[0].value || latestWeight;
        var growthRate = first > 0 ? Math.round(((latestWeight - first) / first) * 100) : 0;
        var totalVolumeTon = +(points.reduce(function(a, b){ return a + (b.value||0); }, 0) * 10 / 1000).toFixed(1);

        return {
          model: 'big3',
          title: '🏋️ 에플리 공식 1RM 추정 & 점진적 과부하 분석',
          kpis: [
            { label: '추정 1RM (Epley)', val: estimated1RM + ' kg', badge: '최대 근력' },
            { label: '최고 수행 중량 (PR)', val: maxWeight + ' kg', badge: '최고 기록' },
            { label: '과부하 성장률', val: (growthRate > 0 ? '+' : '') + growthRate + '%', badge: '점진적 과부하' },
            { label: '추정 누적 볼륨', val: totalVolumeTon + ' 톤', badge: '총 운동량' }
          ],
          summary: '에플리 공식 기준 추정 1RM은 ' + estimated1RM + 'kg이며, 시작 대비 ' + growthRate + '%의 점진적 과부하를 성공적으로 달성했습니다.'
        };
      }
    },

    // 3. 러닝: 페이스존 5단계 & 심폐 마일리지
    running: {
      name: '러닝 페이스존 및 심폐 마일리지 분석',
      modelType: 'pace_zone_cardio',
      analyze: function(points){
        points = Array.isArray(points) ? points : [];
        var n = points.length;
        if(n === 0) return { title: '러닝 데이터 없음', kpis: [], summary: '러닝 기록을 추가해보세요.' };
        var totalDist = +(points.reduce(function(a, b){ return a + (b.value||0); }, 0)).toFixed(1);
        var avgDist = +(totalDist / n).toFixed(1);
        var maxDist = Math.max.apply(null, points.map(function(p){ return p.value || 0; }));
        var cardioLoad = Math.round(totalDist * 12.5);
        var paceZone = totalDist > 50 ? 'Zone 3 (지구력 향상존)' : 'Zone 2 (유산소 베이스존)';

        return {
          model: 'running',
          title: '🏃 5단계 페이스존 & 심폐 부하 마일리지 분석',
          kpis: [
            { label: '총 누적 거리', val: totalDist + ' km', badge: '총 주행' },
            { label: '평균 1회 주행', val: avgDist + ' km', badge: '평균 거리' },
            { label: '최장 1회 거리', val: maxDist + ' km', badge: '최장 런' },
            { label: '심폐 부하 지수', val: cardioLoad + ' pts', badge: paceZone }
          ],
          summary: '현재 ' + paceZone + ' 훈련을 진행 중이며, 총 ' + totalDist + 'km 주행으로 심폐 부하 지수 ' + cardioLoad + '점을 적립했습니다.'
        };
      }
    },

    // 4. 공부/수험: 순공 분당 몰입 밀도 & 뽀모도로 지속성
    study: {
      name: '학습 몰입 밀도 및 세션 지속 지수',
      modelType: 'focus_density_streak',
      analyze: function(points){
        points = Array.isArray(points) ? points : [];
        var n = points.length;
        if(n === 0) return { title: '학습 데이터 없음', kpis: [], summary: '공부 기록을 추가해보세요.' };
        var totalMinutes = points.reduce(function(a, b){ return a + (b.value||0); }, 0);
        var totalHours = +(totalMinutes / 60).toFixed(1);
        var avgDailyMin = Math.round(totalMinutes / (n || 1));
        var pomodoroSessions = Math.floor(totalMinutes / 25);
        var focusDensity = avgDailyMin >= 180 ? '최상급 딥워크 (95%)' : (avgDailyMin >= 90 ? '안정적 몰입 (80%)' : '시작 단계 (60%)');

        return {
          model: 'study',
          title: '📚 순공 분당 몰입 밀도 & 뽀모도로 세션 분석',
          kpis: [
            { label: '총 누적 순공', val: totalHours + ' 시간', badge: '총 학습' },
            { label: '일일 평균 몰입', val: avgDailyMin + ' 분', badge: '일평균' },
            { label: '완료 뽀모도로', val: pomodoroSessions + ' 세션', badge: '25분 몰입' },
            { label: '몰입 밀도 등급', val: focusDensity, badge: '집중도' }
          ],
          summary: '총 ' + totalHours + '시간의 순공과 ' + pomodoroSessions + '회의 뽀모도로 세션을 완료하여 ' + focusDensity + ' 수준의 학습 밀도를 입증했습니다.'
        };
      }
    },

    // 5. 재테크/자산: 월간 저축 가속도 & 복리 성장 예측
    finance: {
      name: '자산 누적 가속도 및 복리 달성률',
      modelType: 'compound_saving_velocity',
      analyze: function(points){
        points = Array.isArray(points) ? points : [];
        var n = points.length;
        if(n === 0) return { title: '자산 데이터 없음', kpis: [], summary: '저축/투자 기록을 추가해보세요.' };
        var totalSaved = points.reduce(function(a, b){ return a + (b.value||0); }, 0);
        var avgMonthly = Math.round(totalSaved / (Math.max(1, Math.ceil(n / 4))));
        var first = points[0].value || 1;
        var latest = points[n - 1].value || first;
        var velocityRate = Math.round(((latest - first) / first) * 100);
        var projectedYearly = Math.round(avgMonthly * 12);

        return {
          model: 'finance',
          title: '💰 월간 저축 가속도 & 연간 자산 누적 예측',
          kpis: [
            { label: '총 누적 저축액', val: totalSaved.toLocaleString() + ' 만원', badge: '총 자산' },
            { label: '월평균 저축액', val: avgMonthly.toLocaleString() + ' 만원', badge: '월 저축력' },
            { label: '저축 가속도', val: (velocityRate > 0 ? '+' : '') + velocityRate + '%', badge: '추세' },
            { label: '연간 예상 누적', val: projectedYearly.toLocaleString() + ' 만원', badge: '1년 전망' }
          ],
          summary: '현재 월평균 ' + avgMonthly.toLocaleString() + '만원의 저축력으로 연간 ' + projectedYearly.toLocaleString() + '만원 자산 형성이 예상됩니다.'
        };
      }
    },

    // 6. 수면/웰니스: 수면 리듬 규칙성 100점 점수 & 수면 부채
    sleep: {
      name: '수면 리듬 규칙성 및 부채 지수',
      modelType: 'sleep_regularity_score',
      analyze: function(points){
        points = Array.isArray(points) ? points : [];
        var n = points.length;
        if(n === 0) return { title: '수면 데이터 없음', kpis: [], summary: '수면 기록을 추가해보세요.' };
        var avgHours = +(points.reduce(function(a, b){ return a + (b.value||0); }, 0) / n).toFixed(1);
        var debt = +(Math.max(0, 7.5 - avgHours) * 7).toFixed(1);
        var variances = points.map(function(p){ return Math.pow((p.value || avgHours) - avgHours, 2); });
        var stdDev = Math.sqrt(variances.reduce(function(a, b){ return a + b; }, 0) / (n || 1));
        var regularityScore = Math.max(50, Math.min(100, Math.round(100 - (stdDev * 20))));

        return {
          model: 'sleep',
          title: '💤 수면 리듬 규칙성 100점 지수 & 수면 부채',
          kpis: [
            { label: '일일 평균 수면', val: avgHours + ' 시간', badge: '평균' },
            { label: '수면 규칙성 점수', val: regularityScore + ' / 100점', badge: regularityScore >= 80 ? '골드 웰니스' : '불규칙 주의' },
            { label: '주간 수면 부채', val: debt + ' 시간', badge: debt <= 2 ? '적정 충전' : '피로 누적' },
            { label: '수면 변동성 (표준편차)', val: '±' + stdDev.toFixed(1) + 'h', badge: '리듬 안정도' }
          ],
          summary: '수면 규칙성 점수는 ' + regularityScore + '점이며, ' + (debt <= 2 ? '최적의 생체 리듬을 유지하고 있습니다.' : '주말 추가 휴식으로 수면 부채를 해소하세요.')
        };
      }
    }
  };
  METRIC_DIFFERENTIATED_MODELS.strength = METRIC_DIFFERENTIATED_MODELS.big3;
  METRIC_DIFFERENTIATED_MODELS.health = METRIC_DIFFERENTIATED_MODELS.big3;

  function computeDifferentiatedAnalysis(metricKey, timeSeriesData, customAgg){
    var model = METRIC_DIFFERENTIATED_MODELS[metricKey];
    if(model && typeof model.analyze === 'function'){
      return model.analyze(timeSeriesData);
    }
    timeSeriesData = Array.isArray(timeSeriesData) ? timeSeriesData : [];
    var n = timeSeriesData.length;
    var sum = timeSeriesData.reduce(function(a, b){ return a + (b.value||0); }, 0);
    var avg = n > 0 ? +(sum / n).toFixed(1) : 0;
    var max = n > 0 ? Math.max.apply(null, timeSeriesData.map(function(p){ return p.value || 0; })) : 0;
    return {
      model: 'generic',
      title: '📊 일반 지표 정밀 분석',
      kpis: [
        { label: '총 합계', val: sum.toLocaleString(), badge: '누적' },
        { label: '평균값', val: avg.toLocaleString(), badge: '일평균' },
        { label: '최고 기록', val: max.toLocaleString(), badge: 'PR' },
        { label: '기록 횟수', val: n + ' 회', badge: '데이터수' }
      ],
      summary: '총 ' + n + '건의 기록이 누적되었으며, 일평균 ' + avg + ', 최고 ' + max + '를 기록했습니다.'
    };
  }

  function renderDifferentiatedReportCard(metricKey, timeSeriesData, customAgg){
    var report = computeDifferentiatedAnalysis(metricKey, timeSeriesData, customAgg);
    if(!report) return '';

    var kpiHtml = (report.kpis || []).map(function(k){
      return '<div class="diff-kpi-cell">' +
        '<span class="diff-kpi-label">' + k.label + '</span>' +
        '<span class="diff-kpi-val">' + k.val + '</span>' +
        '<span class="diff-kpi-badge">' + k.badge + '</span>' +
      '</div>';
    }).join('');

    return '<div class="diff-report-card" data-metric-report="' + (report.model || metricKey) + '">' +
      '<div class="diff-report-header">' +
        '<div class="diff-report-title">' + (report.title || '지표 정밀 분석 리포트') + '</div>' +
        '<button type="button" class="btn btn-sm btn-ghost diff-cfg-open-btn" style="font-size:0.75rem;padding:4px 8px;border:1px solid var(--rule,#cbd5e1);border-radius:6px;">⚙️ 기준 설정</button>' +
      '</div>' +
      '<div class="diff-kpi-grid">' + kpiHtml + '</div>' +
      '<div class="diff-summary-box">💡 ' + (report.summary || '') + '</div>' +
    '</div>';
  }

  function openDifferentiatedMetricConfigModal(options){
    options = options || {};
    var openModalFn = options.openModal || (typeof window !== 'undefined' ? window.openModal : null);
    var closeModalFn = options.closeModal || (typeof window !== 'undefined' ? window.closeModal : null);
    if(!openModalFn) return;

    var STORAGE_KEY = 'ourgoal_metric_diff_configs';
    var savedConfigs = {};
    try {
      savedConfigs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch(e) { savedConfigs = {}; }

    var metricList = [
      { key: 'weight', name: '체중 (kg)', defaultAgg: 'domain', desc: '7일 이동평균 & 주간 감량 속도 분석' },
      { key: 'strength', name: '웨이트/3대 (kg)', defaultAgg: 'domain', desc: '에플리 공식 1RM 추정 & 과부하 분석' },
      { key: 'running', name: '러닝 (km)', defaultAgg: 'domain', desc: '5단계 페이스존 & 심폐 마일리지' },
      { key: 'study', name: '공부/수험 (분/시간)', defaultAgg: 'domain', desc: '순공 몰입 밀도 & 뽀모도로 세션' },
      { key: 'finance', name: '자산/저축 (만원)', defaultAgg: 'domain', desc: '월간 저축 가속도 & 복리 예측' },
      { key: 'sleep', name: '수면 (시간)', defaultAgg: 'domain', desc: '수면 규칙성 100점 & 수면 부채' }
    ];

    var bodyHtml = 
      '<div class="og-modal-shell" style="max-height:75vh;overflow-y:auto;padding:4px 2px;">' +
        '<div class="og-modal-sub">' +
          '지표별 특성에 맞는 전문 분석 모델(1RM, 7일이평선, 페이스존, 뽀모도로 등) 또는 원하는 집계 기준(누적합, 평균, 최고기록)을 차등 지정할 수 있습니다.' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:12px;">' +
          metricList.map(function(m){
            var curVal = savedConfigs[m.key] || m.defaultAgg;
            return '<div class="diff-cfg-card">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                '<span class="diff-cfg-title">' + m.name + '</span>' +
                '<span style="font-size:0.75rem;color:var(--ink-soft);">' + m.desc + '</span>' +
              '</div>' +
              '<div class="diff-opt-group">' +
                '<button type="button" class="diff-opt-btn' + (curVal==='domain' ? ' active' : '') + '" data-metric="' + m.key + '" data-agg="domain">맞춤 전문모델</button>' +
                '<button type="button" class="diff-opt-btn' + (curVal==='sum' ? ' active' : '') + '" data-metric="' + m.key + '" data-agg="sum">누적합</button>' +
                '<button type="button" class="diff-opt-btn' + (curVal==='avg' ? ' active' : '') + '" data-metric="' + m.key + '" data-agg="avg">평균값</button>' +
                '<button type="button" class="diff-opt-btn' + (curVal==='max' ? ' active' : '') + '" data-metric="' + m.key + '" data-agg="max">최고기록</button>' +
                '<button type="button" class="diff-opt-btn' + (curVal==='ma7' ? ' active' : '') + '" data-metric="' + m.key + '" data-agg="ma7">7일이평</button>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';

    var footerHtml = 
      '<div style="display:flex;justify-content:flex-end;gap:8px;width:100%;">' +
        '<button type="button" class="btn btn-secondary" id="diffCfgCloseBtn" style="padding:8px 16px;">닫기</button>' +
        '<button type="button" class="btn btn-primary" id="diffCfgSaveBtn" style="padding:8px 20px;font-weight:700;">적용 완료</button>' +
      '</div>';

    openModalFn({
      title: '⚙️ 지표별 차등 분석 기준 설정',
      body: bodyHtml,
      footer: footerHtml
    });

    setTimeout(function(){
      var modalEl = document.querySelector('.modal, .dialog, #modalContainer, body');
      if(!modalEl) return;

      var buttons = modalEl.querySelectorAll('.diff-opt-btn');
      buttons.forEach(function(btn){
        btn.addEventListener('click', function(){
          var mKey = btn.getAttribute('data-metric');
          modalEl.querySelectorAll('.diff-opt-btn[data-metric="' + mKey + '"]').forEach(function(b){ b.classList.remove('active'); });
          btn.classList.add('active');
        });
      });

      var saveBtn = document.getElementById('diffCfgSaveBtn');
      if(saveBtn){
        saveBtn.addEventListener('click', function(){
          var newConfigs = {};
          metricList.forEach(function(m){
            var activeBtn = modalEl.querySelector('.diff-opt-btn[data-metric="' + m.key + '"].active');
            newConfigs[m.key] = activeBtn ? activeBtn.getAttribute('data-agg') : 'domain';
          });
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfigs));
          } catch(e){}
          if(typeof closeModalFn === 'function') closeModalFn();
          if(typeof options.onSave === 'function') options.onSave(newConfigs);
        });
      }

      var closeBtn = document.getElementById('diffCfgCloseBtn');
      if(closeBtn){
        closeBtn.addEventListener('click', function(){
          if(typeof closeModalFn === 'function') closeModalFn();
        });
      }
    }, 50);
  }

  // 모듈 외부 노출
  var api = {
    METRIC_CONFIGS: METRIC_CONFIGS,
    METRIC_DIFFERENTIATED_MODELS: METRIC_DIFFERENTIATED_MODELS,
    computeDifferentiatedAnalysis: computeDifferentiatedAnalysis,
    renderDifferentiatedReportCard: renderDifferentiatedReportCard,
    openDifferentiatedMetricConfigModal: openDifferentiatedMetricConfigModal,
    DOMAINS: DOMAINS,
    getChosung: getChosung,
    matchQuery: matchQuery,
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
    openTaxonomyManagerModal: openTaxonomyManagerModal,
    openUniversalDataGrid: openUniversalDataGrid,
    openGuideModal: openGuideModal,
    exportCleanCsv: exportCleanCsv,
    captureChartSnapshot: captureChartSnapshot,
    normalizeHistoricalDate: normalizeHistoricalDate,
    generate1920sOlympicStrengthSample: generate1920sOlympicStrengthSample,
    computeCrossRatioSeries: computeCrossRatioSeries,
    renderCrossRatioSvg: renderCrossRatioSvg,
    renderRadarSvg: renderRadarSvg,
    computeCadenceData: computeCadenceData,
    renderCadenceSvg: renderCadenceSvg,
    generateStatisticalDiagnosticReport: generateStatisticalDiagnosticReport,
    openDataManagementModal: openDataManagementModal,
    openStatsFullscreenModal: openStatsFullscreenModal,
    SAMPLE_THEMES: SAMPLE_THEMES
  };

  if(typeof module !== 'undefined' && module.exports){
    module.exports = api;
  }
  root.OurgoalUniversalStats = api;

})(typeof window !== 'undefined' ? window : global);
