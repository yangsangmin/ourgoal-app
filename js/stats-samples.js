/**
 * OurGoal Stats Cell: 샘플 생성 — 도메인별 1년치 샘플(조립자: 작은 구획은 그대로, 큰 구획 6개는 하위 함수 호출)·52주 파워리프팅·1920년대 역도 샘플(generateDomainSample · generate52WeekPowerliftingSample · generate1920sOlympicStrengthSample) (#TASK-ES-405 · 통계 세포 쪼개기 3차)
 *
 * js/universal-stats.js(이전 전 3,283줄)에서 동작 그대로 옮겼다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 *   generateDomainSample · generate52WeekPowerliftingSample · generate1920sOlympicStrengthSample
 * 함수 단위로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 */
(function(root) {
  'use strict';
  // S = js/universal-stats.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·값(pad·METRIC_CONFIGS·askConfirm …)을 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 통계 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = root.OurgoalUniversalStatsKit = root.OurgoalUniversalStatsKit || {};
  var S = K.scope = K.scope || {};

  /* ================= 5. 도메인별 1년치 실측 샘플 생성기 ================= */
  function generateDomainSample(domainKey){
    var now = new Date();
    var records = [];

    if(domainKey === 'hyrox'){
      K.pushHyroxSample(now, records);
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
      K.pushRunningSample(now, records);
    } else if(domainKey === 'big3'){
      K.pushBig3Sample(now, records);
    } else if(domainKey === 'study'){
      K.pushStudySample(now, records);
    } else if(domainKey === "coding"){
      K.pushCodingSample(now, records);
    } else if(domainKey === 'sales'){
      K.pushSalesSample(now, records);
    } else if(S.THEME_METRIC_SPECS[domainKey]){
      var spec = S.THEME_METRIC_SPECS[domainKey];
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

  function generate52WeekPowerliftingSample(){
    var records = [];
    var now = new Date();
    for(var i = 0; i < S.RAW_52W_POWERLIFTING_DATA.length; i++){
      var cols = S.RAW_52W_POWERLIFTING_DATA[i].split(',');
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
        var startIso = dStr + 'T19:' + S.pad(eIdx * 25) + ':00.000Z';
        var endIso = dStr + 'T20:' + S.pad(eIdx * 25) + ':00.000Z';

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

  K.generateDomainSample = generateDomainSample;
  K.generate52WeekPowerliftingSample = generate52WeekPowerliftingSample;
  K.generate1920sOlympicStrengthSample = generate1920sOlympicStrengthSample;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
