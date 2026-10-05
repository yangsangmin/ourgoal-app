/**
 * OurGoal Stats Cell: 도메인 샘플 구획 — 성장(공부·코딩·영업) 1년치 기록 생성(pushStudySample · pushCodingSample · pushSalesSample) (#TASK-ES-405 · 통계 세포 쪼개기 3차)
 *
 * js/universal-stats.js(이전 전 3,283줄)에서 동작 그대로 옮겼다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 *   pushStudySample · pushCodingSample · pushSalesSample
 * generateDomainSample(js/stats-samples.js)의 `if(domainKey === '<키>'){ … }` 블록 본문을 글자 그대로 옮긴 구획 함수다(들여쓰기 2칸만 뺌). 조립자는 그 자리에서 이 함수를 부른다.
 * 공유 변수(domainKey·now·records — 재대입 없음)는 인자로 받는다. 구획의 지역 var 는 이 구획 안에서만 선언·사용된다(경계 조건 — 생성기가 검사, sample-boundary-stats-3.js 가 모든 도메인 출력을 맞댄다).
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 */
(function(root) {
  'use strict';
  // S = js/universal-stats.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·값(pad·METRIC_CONFIGS·askConfirm …)을 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 통계 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = root.OurgoalUniversalStatsKit = root.OurgoalUniversalStatsKit || {};
  var S = K.scope = K.scope || {};

  function pushStudySample(now, records){
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
  }

  function pushCodingSample(now, records){
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
  }

  function pushSalesSample(now, records){
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
  }

  K.pushStudySample = pushStudySample;
  K.pushCodingSample = pushCodingSample;
  K.pushSalesSample = pushSalesSample;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
