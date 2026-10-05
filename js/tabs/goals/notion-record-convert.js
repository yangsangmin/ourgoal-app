/**
 * OurGoal Notion Record Convert (목표 탭 — 결과 글을 노션 DB 기록으로 변환)
 *
 * #TASK-ES-442 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   convertTextToNotionDbRecord — 「AI 결과 입력 -> Notion DB 구조화 변환기」(이전 전 7882~7958줄, 구획 주석 포함)
 * 자연어 결과 글에서 상태·달성률·수치를 뽑아 노션 DB 프로퍼티 형태로 바꾼다.
 * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ============ AI 결과 입력 -> Notion DB 구조화 변환기 ============ */
  function convertTextToNotionDbRecord(text, kind, obj, goal){
    var raw = (text || '').trim();
    var dateStr = typeof L.isoDate === 'function' ? L.isoDate(new Date()) : new Date().toISOString().slice(0, 10);
    var category = (goal && goal.category) || 'etc';

    // Status & Progress determination
    var isDone = /(?:완료|끝|성공|완주|다\s*했|마침|100%|올클|해냄|달성)/i.test(raw);
    var isDoing = /(?:진행|절반|도중|일부|시작|조금)/i.test(raw);
    var status = isDone ? '완료' : (isDoing ? '진행중' : '완료');

    var progress = isDone ? 100 : (isDoing ? 50 : 100);
    var pctMatch = raw.match(/(\d+(?:\.\d+)?)\s*%/);
    if(pctMatch){
      progress = Math.min(100, Math.round(parseFloat(pctMatch[1])));
      if(progress >= 100) status = '완료';
      else if(progress > 0) status = '진행중';
    } else {
      var fracMatch = raw.match(/(\d+)\s*(?:개|km|쪽|강|회)?\s*(?:중|에서|\/)\s*(\d+)/);
      if(fracMatch){
        var part = parseFloat(fracMatch[2]), tot = parseFloat(fracMatch[1]);
        if(tot > 0) progress = Math.min(100, Math.round((part / tot) * 100));
        status = progress >= 100 ? '완료' : '진행중';
      }
    }

    // Metric extraction
    var metrics = [];
    var distMatch = raw.match(/(\d+(?:\.\d+)?)\s*(?:km|킬로|킬로미터)/i);
    if(distMatch) metrics.push(distMatch[1] + 'km');
    var timeMatch = raw.match(/(\d+)\s*시간(?:\s*(\d+)\s*분)?/) || raw.match(/(\d+)\s*(?:분|min)/i);
    if(timeMatch){
      if(timeMatch[2] !== undefined) metrics.push(timeMatch[1] + '시간 ' + (timeMatch[2] || 0) + '분');
      else if(raw.includes('시간')) metrics.push(timeMatch[1] + '시간');
      else metrics.push(timeMatch[1] + '분');
    }
    var countMatch = raw.match(/(\d+)\s*(?:개|문제|강|세트|쪽|페이지|회|권)/);
    if(countMatch) metrics.push(countMatch[0]);
    if(!metrics.length) metrics.push(progress + '% 달성');
    var metricStr = metrics.join(' · ');

    // Title generation
    var fallbackTitle = (obj && obj.title && obj.title !== '커리큘럼 정하기' && obj.title !== '커리큘럼') ? obj.title : '오늘의 실천 기록';
    var cleanTitle = raw.replace(/[!?,.]/g, '').trim();
    if(cleanTitle.length > 32) cleanTitle = cleanTitle.slice(0, 32) + '…';
    var title = cleanTitle || fallbackTitle;

    // Key takeaway extraction
    var keyTakeaway = raw;
    var tags = [];
    if(/운동|헬스|러닝|달리기|km|와드|하체|상체|스쿼트|벤치/.test(raw) || category === 'exercise') tags.push('운동');
    if(/공부|강의|강|문제|인강|복습|단어|독서|페이지|쪽|시험/.test(raw) || category === 'study' || category === 'exam') tags.push('학습');
    if(/오답|정리|노트|기록/.test(raw)) tags.push('정리');
    if(status === '완료') tags.push('완료');
    if(!tags.length) tags.push('실천');

    var notionSchema = {
      'Name': { type: 'title', title: [{ type: 'text', text: { content: title } }] },
      'Status': { type: 'select', select: { name: status } },
      'Progress': { type: 'number', number: progress },
      'Metric': { type: 'rich_text', rich_text: [{ type: 'text', text: { content: metricStr } }] },
      'KeyTakeaway': { type: 'rich_text', rich_text: [{ type: 'text', text: { content: keyTakeaway } }] },
      'Tags': { type: 'multi_select', multi_select: tags.map(function(t){ return { name: t }; }) },
      'Date': { type: 'date', date: { start: dateStr } }
    };

    return {
      title: title,
      status: status,
      progress: progress,
      metric: metricStr,
      keyTakeaway: keyTakeaway,
      tags: tags,
      date: dateStr,
      notionSchema: notionSchema
    };
  }

  K.convertTextToNotionDbRecord = convertTextToNotionDbRecord;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
