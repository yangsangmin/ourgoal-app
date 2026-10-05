/**
 * OurGoal Stats Cell: 도메인 샘플 구획 — 운동(하이록스·러닝·3대운동) 1년치 기록 생성(pushHyroxSample · pushRunningSample · pushBig3Sample) (#TASK-ES-405 · 통계 세포 쪼개기 3차)
 *
 * js/universal-stats.js(이전 전 3,283줄)에서 동작 그대로 옮겼다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 *   pushHyroxSample · pushRunningSample · pushBig3Sample
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

  function pushHyroxSample(now, records){
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
  }

  function pushRunningSample(now, records){
    // 52주간 1년치 주 2~3회 러닝 점진적 과부하 (롱런, 조깅, 인터벌 세부 종목별 시계열 및 페이스·RPE)
    for(var w = 51; w >= 0; w--){
      var weekDate = new Date(now.getTime() - w * 7 * 86400000);
      var baseDist = 5 + (51 - w) * 0.3;
      var paceMin = Math.max(4.8, 6.2 - (51 - w) * 0.025);
      var pM = Math.floor(paceMin);
      var pS = Math.round((paceMin - pM) * 60);
      var curDist = Math.round(baseDist * 10) / 10;
      var durMin = Math.round(curDist * paceMin);
      var paceStr = pM + "'" + S.pad(pS) + '"';
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
        text: '[조깅] 저녁 리커버리 ' + midDist + 'km 완료 (' + midDur + '분, 페이스 ' + Math.floor(midPace/60) + "'" + S.pad(midPace%60) + '", RPE ' + rpeJog + ').',
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
          text: '[인터벌] 트랙 400m x 8회 5.0km 완주 (페이스 ' + Math.floor(ivPace/60) + "'" + S.pad(ivPace%60) + '", 고강도 RPE ' + rpeIv + ').',
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
  }

  function pushBig3Sample(now, records){
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
  }

  K.pushHyroxSample = pushHyroxSample;
  K.pushRunningSample = pushRunningSample;
  K.pushBig3Sample = pushBig3Sample;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
