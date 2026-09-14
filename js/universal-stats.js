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

  /* ================= 6. 대시보드 렌더러 (성취통계 뷰에 장착) ================= */
  function renderUniversalStatsDashboard(container, allRecs, state, callbacks){
    if(!container) return;
    callbacks = callbacks || {};

    var discovery = discoverActiveMetrics(allRecs);
    var activeCat = (state && state.univStatCategory) || (discovery.activeMetrics[1] ? discovery.activeMetrics[1].category : 'general');
    var activePeriod = (state && state.univStatPeriod) || '1year';

    var agg = aggregateMetricTimeSeries(allRecs, activeCat, activePeriod);
    var cfg = agg.config;

    // 1. 상단 동적 칩 바
    var chipsHtml = '<div class="u-metric-chip-row" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:12px;-webkit-overflow-scrolling:touch;">';
    discovery.activeMetrics.forEach(function(m){
      var isAct = (m.category === activeCat);
      var bg = isAct ? m.color : 'var(--card2)';
      var fg = isAct ? '#ffffff' : 'var(--ink)';
      var bd = isAct ? 'none' : '1px solid var(--border)';
      var cnt = discovery.counts[m.category] || 0;
      chipsHtml += '<button type="button" class="u-metric-chip" data-cat="' + m.category + '" style="flex-shrink:0;padding:6px 12px;border-radius:18px;font-size:.8125rem;font-weight:700;background:' + bg + ';color:' + fg + ';border:' + bd + ';cursor:pointer;display:flex;align-items:center;gap:4px;">' +
        '<span>' + (m.icon || '📊') + ' ' + m.title + '</span>' +
        (cnt > 0 ? '<span style="opacity:0.75;font-size:.7rem;">(' + cnt + ')</span>' : '') +
      '</button>';
    });
    chipsHtml += '</div>';

    // 2. 기간 필터 바 (1년 / 6개월 / 3개월 / 1주)
    var periods = [
      { key: '1year', label: '1년' },
      { key: '6months', label: '6개월' },
      { key: '3months', label: '3개월' },
      { key: 'week', label: '1주' }
    ];
    var periodHtml = '<div style="display:flex;gap:4px;background:var(--card2);padding:3px;border-radius:8px;align-self:flex-start;">';
    periods.forEach(function(p){
      var isPAct = (p.key === activePeriod);
      var pBg = isPAct ? 'var(--card)' : 'transparent';
      var pFg = isPAct ? 'var(--ink)' : 'var(--ink-soft)';
      var pSh = isPAct ? '0 1px 2px rgba(0,0,0,0.06)' : 'none';
      periodHtml += '<button type="button" class="u-period-btn" data-period="' + p.key + '" style="padding:4px 10px;border:none;border-radius:6px;font-size:.75rem;font-weight:600;background:' + pBg + ';color:' + pFg + ';box-shadow:' + pSh + ';cursor:pointer;">' + p.label + '</button>';
    });
    periodHtml += '</div>';

    // 3. 차트 마크업
    var chartSvg = renderUniversalSvgChart(agg);

    // 4. 4대 KPI 요약 카드
    var kpiVal1 = '-';
    var kpiVal2 = '-';
    var kpiVal3 = '-';
    var kpiVal4 = '-';

    if(activeCat === 'weight'){
      kpiVal1 = (agg.latestVal || agg.extraKpi.latestWeight || '-') + ' ' + cfg.unit;
      var diff = (agg.extraKpi.maxWeight && agg.extraKpi.minWeight < 900) ? Math.round((agg.extraKpi.maxWeight - agg.extraKpi.minWeight)*10)/10 : 0;
      kpiVal2 = diff > 0 ? ('-' + diff + ' kg 감량') : '-';
      kpiVal3 = '진행 중';
      kpiVal4 = agg.growthRate ? (agg.growthRate + '%') : '-';
    } else if(activeCat === 'reading'){
      kpiVal1 = agg.totalSum ? (agg.totalSum.toLocaleString() + ' 쪽') : '0 쪽';
      kpiVal2 = (agg.extraKpi.totalBooks || Math.round(agg.totalSum / 250)) + ' 권 완독';
      kpiVal3 = Math.round(agg.totalSum / (agg.buckets.length || 1)) + ' 쪽/월';
      kpiVal4 = agg.growthRate ? ('+' + agg.growthRate + '%') : '-';
    } else if(activeCat === 'sleep'){
      var avgSl = agg.totalSessions ? Math.round((agg.totalSum / agg.totalSessions)*10)/10 : '-';
      kpiVal1 = avgSl + ' 시간';
      kpiVal2 = agg.maxVal ? (agg.maxVal + ' 시간') : '-';
      kpiVal3 = '규칙적';
      kpiVal4 = agg.growthRate ? (agg.growthRate + '%') : '-';
    } else if(activeCat === 'big3'){
      kpiVal1 = agg.maxVal ? (agg.maxVal + ' ' + cfg.unit) : '-';
      kpiVal2 = agg.extraKpi.benchMax ? (agg.extraKpi.benchMax + ' kg') : '-';
      kpiVal3 = agg.extraKpi.squatMax ? (agg.extraKpi.squatMax + ' kg') : '-';
      kpiVal4 = agg.extraKpi.deadliftMax ? (agg.extraKpi.deadliftMax + ' kg') : '-';
    } else if(activeCat === 'running'){
      kpiVal1 = agg.totalSum ? (agg.totalSum.toFixed(1) + ' ' + cfg.unit) : '0 km';
      kpiVal2 = agg.avgPaceStr;
      kpiVal3 = agg.maxVal ? (agg.maxVal + ' km') : '-';
      kpiVal4 = agg.growthRate ? ('+' + agg.growthRate + '%') : '-';
    } else if(activeCat === 'study'){
      kpiVal1 = fmtDuration(agg.totalSum * 60000);
      kpiVal2 = agg.extraKpi.totalProblems ? (agg.extraKpi.totalProblems.toLocaleString() + ' 문제') : '-';
      kpiVal3 = agg.totalSessions ? (Math.round(agg.totalSum / agg.totalSessions) + '분/회') : '-';
      kpiVal4 = agg.growthRate ? ('+' + agg.growthRate + '%') : '-';
    } else if(activeCat === 'finance' || activeCat === 'sales'){
      kpiVal1 = agg.totalSum ? (agg.totalSum.toLocaleString() + ' ' + cfg.unit) : '0 만원';
      kpiVal2 = (agg.extraKpi.totalDeals || agg.totalSessions) + ' 건';
      kpiVal3 = agg.maxVal ? (agg.maxVal.toLocaleString() + ' ' + cfg.unit) : '-';
      kpiVal4 = agg.growthRate ? ('+' + agg.growthRate + '%') : '-';
    } else if(activeCat === 'blood_pressure'){
      kpiVal1 = (agg.latestVal ? agg.latestVal + ' mmHg' : '-');
      kpiVal2 = (agg.minVal ? agg.minVal + ' mmHg' : '-');
      kpiVal3 = agg.totalSessions ? Math.round((agg.totalSum / agg.totalSessions)) + ' mmHg' : '-';
      kpiVal4 = agg.growthRate ? ((agg.growthRate >= 0 ? '+' : '') + agg.growthRate + '%') : '-';
    } else {
      if(cfg.agg === 'latest'){
        kpiVal1 = (agg.latestVal !== undefined ? agg.latestVal : '-') + ' ' + (cfg.unit || '');
        kpiVal2 = (agg.minVal !== undefined && agg.minVal !== 999 ? agg.minVal : '-') + ' ' + (cfg.unit || '');
        kpiVal3 = agg.totalSessions ? (Math.round((agg.totalSum / agg.totalSessions) * 10) / 10 + ' ' + (cfg.unit || '')) : '-';
        kpiVal4 = agg.growthRate ? ((agg.growthRate >= 0 ? '+' : '') + agg.growthRate + '%') : '-';
      } else {
        kpiVal1 = (cfg.category === 'general') ? fmtDuration(agg.totalSum * 60000) : (agg.totalSum ? (agg.totalSum.toLocaleString() + ' ' + (cfg.unit || '')) : '-');
        kpiVal2 = agg.maxVal ? (agg.maxVal.toLocaleString() + ' ' + (cfg.unit || '')) : (agg.totalSessions + ' 회');
        kpiVal3 = agg.totalSessions ? (Math.round((agg.totalSum / agg.totalSessions) * 10) / 10 + ' ' + (cfg.unit || '')) : '-';
        kpiVal4 = agg.growthRate ? ((agg.growthRate >= 0 ? '+' : '') + agg.growthRate + '%') : '-';
      }
    }

    var kpiGridHtml = 
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;">' +
        '<div class="card" style="padding:10px 12px;margin:0;border-radius:10px;background:var(--card);">' +
          '<div style="font-size:.75rem;color:var(--ink-soft);">' + cfg.kpi1 + '</div>' +
          '<div style="font-size:1.125rem;font-weight:800;color:' + cfg.color + ';margin-top:2px;">' + kpiVal1 + '</div>' +
        '</div>' +
        '<div class="card" style="padding:10px 12px;margin:0;border-radius:10px;background:var(--card);">' +
          '<div style="font-size:.75rem;color:var(--ink-soft);">' + cfg.kpi2 + '</div>' +
          '<div style="font-size:1.125rem;font-weight:800;color:var(--ink);margin-top:2px;">' + kpiVal2 + '</div>' +
        '</div>' +
        '<div class="card" style="padding:10px 12px;margin:0;border-radius:10px;background:var(--card);">' +
          '<div style="font-size:.75rem;color:var(--ink-soft);">' + cfg.kpi3 + '</div>' +
          '<div style="font-size:1.125rem;font-weight:800;color:var(--ink);margin-top:2px;">' + kpiVal3 + '</div>' +
        '</div>' +
        '<div class="card" style="padding:10px 12px;margin:0;border-radius:10px;background:var(--card);">' +
          '<div style="font-size:.75rem;color:var(--ink-soft);">' + cfg.kpi4 + '</div>' +
          '<div style="font-size:1.125rem;font-weight:800;color:' + (agg.growthRate >= 0 ? '#10b981' : '#ef4444') + ';margin-top:2px;">' + kpiVal4 + '</div>' +
        '</div>' +
      '</div>';

    // 5. Gemini 3.1 Flash Lite 지능형 분석 리포트 카드
    var aiReportHtml = 
      '<div class="card" style="margin-top:12px;padding:12px 14px;background:linear-gradient(135deg,rgba(14,165,233,0.06),rgba(139,92,246,0.06));border:1px solid rgba(139,92,246,0.2);border-radius:12px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<div style="font-weight:700;font-size:.8125rem;color:var(--brand);display:flex;align-items:center;gap:4px;">' +
            '<span>✨ Gemini 3.1 Flash Lite 지능형 통찰</span>' +
          '</div>' +
          '<span style="font-size:.7rem;color:var(--ink-soft);">실시간 AI 분석</span>' +
        '</div>' +
        '<div id="uAiReportText" style="font-size:.8125rem;color:var(--ink);line-height:1.5;">' +
          (agg.hasData ? ('[' + cfg.title + '] 데이터 ' + agg.totalSessions + '건의 시계열 추세를 분석했습니다. 시작 시점 대비 ' + (agg.growthRate >= 0 ? '+' + agg.growthRate + '% 성장' : '안정적 유지') + ' 추세를 보이고 있으며, 규칙적인 주기성이 성취 유지의 핵심 동력입니다.') : '아직 충분한 기록이 없습니다. 상단의 [샘플로드]나 [가져오기]로 다양한 데이터를 채워보세요.') +
        '</div>' +
      '</div>';

    // 6. 전체 대시보드 조립
    container.innerHTML = 
      '<div class="card" style="padding:14px;border-radius:14px;margin-bottom:12px;background:var(--card);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
          '<div>' +
            '<div style="font-size:.9375rem;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
              '<span>' + (cfg.icon || '📊') + ' ' + cfg.title + ' 시계열 분석</span>' +
            '</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">테마 제약 없이 AI가 자율 감지한 맞춤형 지표</div>' +
          '</div>' +
          periodHtml +
        '</div>' +
        chipsHtml +
        '<div style="background:var(--card2);padding:10px 8px;border-radius:12px;margin-top:8px;">' +
          chartSvg +
        '</div>' +
        kpiGridHtml +
        aiReportHtml +
      '</div>';

    // 이벤트 리스너 바인딩
    container.querySelectorAll('.u-metric-chip').forEach(function(btn){
      btn.onclick = function(){
        if(state) state.univStatCategory = btn.dataset.cat;
        if(callbacks.onSelectCategory) callbacks.onSelectCategory(btn.dataset.cat);
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    });

    container.querySelectorAll('.u-period-btn').forEach(function(btn){
      btn.onclick = function(){
        if(state) state.univStatPeriod = btn.dataset.period;
        if(callbacks.onSelectPeriod) callbacks.onSelectPeriod(btn.dataset.period);
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    });
  }

  /* ================= 7. 통합 가져오기 & 샘플 로드 모달 ================= */
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

    var modalHtml = 
      '<div class="modal-head">' +
        '<h3>📥 외부 데이터 가져오기 & 1년치 샘플 로드</h3>' +
      '</div>' +
      '<div style="margin-bottom:12px;font-size:.8125rem;color:var(--ink-soft);line-height:1.4;">' +
        '테마 구분 없이 러닝·3대운동·체중·독서·수면 등 어떤 데이터든 AI가 자동으로 감지해 흡수하고 시각화합니다.' +
      '</div>' +

      '<!-- 3개 탭 바 -->' +
      '<div class="tab-bar" style="margin-bottom:14px;display:flex;gap:4px;border-bottom:1px solid var(--border);padding-bottom:6px;">' +
        '<button class="tab-btn active" id="uImpTabSamples" type="button" style="flex:1;padding:8px 4px;font-size:.8125rem;font-weight:700;border:none;background:transparent;color:var(--brand);border-bottom:2px solid var(--brand);cursor:pointer;">⚡ 1년치 추천 샘플</button>' +
        '<button class="tab-btn" id="uImpTabCsv" type="button" style="flex:1;padding:8px 4px;font-size:.8125rem;font-weight:600;border:none;background:transparent;color:var(--ink-soft);cursor:pointer;">📁 CSV 파일</button>' +
        '<button class="tab-btn" id="uImpTabText" type="button" style="flex:1;padding:8px 4px;font-size:.8125rem;font-weight:600;border:none;background:transparent;color:var(--ink-soft);cursor:pointer;">✍️ 텍스트/일기</button>' +
      '</div>' +

      '<!-- Tab 1: 추천 샘플 1초 로드 -->' +
      '<div id="uImpPanelSamples" class="u-imp-panel">' +
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
          '<button type="button" class="btn btn-ghost u-sample-card" data-sample="finance" style="height:auto;padding:10px;text-align:left;display:flex;flex-direction:column;gap:3px;border:1px solid var(--border);border-radius:10px;">' +
            '<span style="font-weight:700;font-size:.875rem;color:var(--ink);">💰 재테크/저축 1년치</span>' +
            '<span style="font-size:.75rem;color:var(--ink-soft);">52주간 누적 1,200만원 자산 형성</span>' +
          '</button>' +
          '<button type="button" class="btn btn-ghost u-sample-card" data-sample="big3" style="height:auto;padding:10px;text-align:left;display:flex;flex-direction:column;gap:3px;border:1px solid var(--border);border-radius:10px;">' +
            '<span style="font-weight:700;font-size:.875rem;color:var(--ink);">🏋️ 3대 운동 1년치</span>' +
            '<span style="font-size:.75rem;color:var(--ink-soft);">52주 벤치/스쿼트/데드 385kg PR</span>' +
          '</button>' +
          '<button type="button" class="btn btn-ghost u-sample-card" data-sample="running" style="height:auto;padding:10px;text-align:left;display:flex;flex-direction:column;gap:3px;border:1px solid var(--border);border-radius:10px;">' +
            '<span style="font-weight:700;font-size:.875rem;color:var(--ink);">🏃 러닝 1년치 (120회)</span>' +
            '<span style="font-size:.75rem;color:var(--ink-soft);">5km → 하프마라톤 21.1km 페이스</span>' +
          '</button>' +
          '<button type="button" class="btn btn-ghost u-sample-card" data-sample="study" style="height:auto;padding:10px;text-align:left;display:flex;flex-direction:column;gap:3px;border:1px solid var(--border);border-radius:10px;">' +
            '<span style="font-weight:700;font-size:.875rem;color:var(--ink);">📚 공부 몰입 1년치</span>' +
            '<span style="font-size:.75rem;color:var(--ink-soft);">100회+ 순공 및 기출 4,000문제</span>' +
          '</button>' +
          '<button type="button" class="btn btn-ghost u-sample-card" data-sample="sales" style="height:auto;padding:10px;text-align:left;display:flex;flex-direction:column;gap:3px;border:1px solid var(--border);border-radius:10px;">' +
            '<span style="font-weight:700;font-size:.875rem;color:var(--ink);">💼 영업 성과 1년치</span>' +
            '<span style="font-size:.75rem;color:var(--ink-soft);">신규 계약 30건+ 실적 2,500만원</span>' +
          '</button>' +
        '</div>' +
      '</div>' +

      '<!-- Tab 2: CSV 파일 -->' +
      '<div id="uImpPanelCsv" class="u-imp-panel" style="display:none;">' +
        '<div class="field" style="margin-bottom:8px;">' +
          '<label>CSV 파일 선택</label>' +
          '<input type="file" id="uImpCsvFileInput" accept=".csv,text/csv" style="width:100%;box-sizing:border-box;">' +
        '</div>' +
        '<div class="faint" style="font-size:.75rem;line-height:1.4;">' +
          '💡 스프레드시트나 타 앱에서 내보낸 CSV 파일을 그대로 선택하세요. 날짜, 지표명, 수치를 AI가 자동으로 분석합니다.' +
        '</div>' +
      '</div>' +

      '<!-- Tab 3: 텍스트 붙여넣기 -->' +
      '<div id="uImpPanelText" class="u-imp-panel" style="display:none;">' +
        '<div class="field" style="margin-bottom:8px;">' +
          '<label>엑셀 복사 또는 일기/메모 줄글</label>' +
          '<textarea id="uImpTextInput" rows="6" placeholder="예 1 (체중/수면):\n2025-05-10 체중 74.2kg 수면 7.5시간\n2025-05-11 체중 73.8kg 수면 8시간\n\n예 2 (독서/자유일기):\n2025.06.15 오늘 책 50쪽 읽고 커피 2잔 마심\n2025.06.16 스쿼트 120kg 5세트 완료" style="width:100%;box-sizing:border-box;font-family:monospace;font-size:.8125rem;line-height:1.4;"></textarea>' +
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
          stagedRecs = generateDomainSample(sKey);
          previewBox.style.display = 'block';
          previewText.textContent = '선택됨: ' + btn.querySelector('span').textContent + ' (' + stagedRecs.length + '개 세션 준비 완료)';
          applyBtn.style.display = 'inline-block';
          applyBtn.textContent = stagedRecs.length + '개 데이터 1초 만에 흡수하기';
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
            var lines = csvStr.split(/\r?\n/).filter(function(l){ return l.trim(); });
            if(lines.length < 2){
              if(toastFn) toastFn('CSV 파일에 유효한 행이 부족합니다.');
              return;
            }
            var header = lines[0].split(',').map(function(c){ return c.trim(); });
            var parsedList = [];
            for(var i = 1; i < lines.length; i++){
              var cols = lines[i].split(',').map(function(c){ return c.trim(); });
              var lineDate = cols[0];
              var dObj = new Date(lineDate);
              var validDate = !isNaN(dObj.getTime()) ? dObj.toISOString() : new Date().toISOString();
              parsedList.push({
                id: 'imp_csv_' + Date.now() + '_' + i,
                type: 'note',
                theme: 'daily',
                text: cols.join(' '),
                columns: header,
                rows: [cols],
                startAt: validDate,
                endAt: new Date(new Date(validDate).getTime() + 30 * 60000).toISOString(),
                createdAt: validDate,
                visibility: 'private'
              });
            }
            stagedRecs = parsedList;
            previewBox.style.display = 'block';
            previewText.textContent = 'CSV 파일에서 ' + stagedRecs.length + '건의 기록을 성공적으로 파싱했습니다.';
            applyBtn.style.display = 'inline-block';
            applyBtn.textContent = stagedRecs.length + '건 데이터 흡수하기';
          };
          reader.readAsText(file, 'utf-8');
        };
      }

      // 텍스트 붙여넣기 파싱
      var textInp = modalEl.querySelector('#uImpTextInput');
      if(textInp){
        textInp.oninput = function(){
          var val = textInp.value.trim();
          if(!val){
            previewBox.style.display = 'none';
            applyBtn.style.display = 'none';
            return;
          }
          var rawLines = val.split(/\r?\n/).filter(function(l){ return l.trim(); });
          var parsedList = [];
          var nowMs = Date.now();
          rawLines.forEach(function(line, idx){
            var dateM = line.match(/^(\d{4}[-.\/]\d{1,2}[-.\/]\d{1,2})/);
            var dt = dateM ? new Date(dateM[1].replace(/\./g, '-').replace(/\//g, '-')) : new Date(nowMs - (rawLines.length - idx) * 86400000);
            var isoD = !isNaN(dt.getTime()) ? dt.toISOString() : new Date().toISOString();
            parsedList.push({
              id: 'imp_txt_' + nowMs + '_' + idx,
              type: 'note',
              theme: 'daily',
              text: line,
              startAt: isoD,
              endAt: new Date(new Date(isoD).getTime() + 30 * 60000).toISOString(),
              createdAt: isoD,
              visibility: 'private'
            });
          });
          stagedRecs = parsedList;
          previewBox.style.display = 'block';
          previewText.textContent = '입력된 줄글에서 ' + stagedRecs.length + '건의 독립 기록을 감지했습니다.';
          applyBtn.style.display = 'inline-block';
          applyBtn.textContent = stagedRecs.length + '건 데이터 흡수하기';
        };
      }

      // 흡수 적용 클릭
      if(applyBtn){
        applyBtn.onclick = async function(){
          if(!stagedRecs.length){
            if(toastFn) toastFn('가져올 유효한 데이터가 없습니다.');
            return;
          }
          applyBtn.disabled = true;
          applyBtn.textContent = '흡수 중…';

          var curRecs = (state && state.profile && state.profile.records) || [];
          var merged = curRecs.slice();
          var added = 0;
          stagedRecs.forEach(function(sr){
            merged.push(sr);
            added++;
          });
          merged.sort(function(a,b){ return new Date(b.startAt) - new Date(a.startAt); });
          if(state && state.profile) state.profile.records = merged;

          if(saveProfileFn) await saveProfileFn();
          closeModalFn();

          if(onDoneFn) onDoneFn('general', added);
          if(toastFn) toastFn('총 ' + added + '건의 기록을 성공적으로 흡수했습니다! 통계 뷰에서 맞춤 차트를 확인해보세요 🔥');
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
    renderUniversalStatsDashboard: renderUniversalStatsDashboard,
    openUniversalImportModal: openUniversalImportModal
  };

  if(typeof module !== 'undefined' && module.exports){
    module.exports = api;
  }
  root.OurgoalUniversalStats = api;

})(typeof window !== 'undefined' ? window : global);
