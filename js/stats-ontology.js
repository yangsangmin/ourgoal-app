/**
 * OurGoal Stats Cell: 온톨로지 — 초성 추출·검색 일치·도메인 추론·범용 온톨로지 구축(getChosung · matchQuery · inferDomainKey · buildUniversalOntology) (#TASK-ES-405 · 통계 세포 쪼개기 3차)
 *
 * js/universal-stats.js(이전 전 3,283줄)에서 동작 그대로 옮겼다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 *   getChosung · matchQuery · inferDomainKey · buildUniversalOntology
 * 함수 단위로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 */
(function(root) {
  'use strict';
  // S = js/universal-stats.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·값(pad·METRIC_CONFIGS·askConfirm …)을 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 통계 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = root.OurgoalUniversalStatsKit = root.OurgoalUniversalStatsKit || {};
  var S = K.scope = K.scope || {};

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
    if(theme && S.DOMAINS[theme]) return theme;
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
      var mList = K.extractMetricsFromRecord(r);
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

  K.getChosung = getChosung;
  K.matchQuery = matchQuery;
  K.inferDomainKey = inferDomainKey;
  K.buildUniversalOntology = buildUniversalOntology;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
