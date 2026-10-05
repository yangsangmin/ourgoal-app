/**
 * OurGoal Notion Sync (설정 탭 — 노션 실시간 보내기)
 *
 * #TASK-ES-437 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   sendToNotion — 「Notion 실시간 동기화 (Direct API & Webhook)」(이전 전 9125~9168줄, 구획 주석 포함)
 * 기록을 노션(직접 API·웹훅)으로 보내기.
 * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* ============ Notion 실시간 동기화 (Direct API & Webhook) ============ */
  async function sendToNotion(record, feedback){
    var s = L.state.profile && L.state.profile.settings;
    if(!s || !s.notionSync) return false;

    // 1. Direct Notion Database API 푸시 (API Key & Database ID)
    if(s.notionApiKey && s.notionDatabaseId && typeof L.pushRecordToNotion === 'function'){
      try {
        var columns = ['항목', '내용'];
        var rows = [
          ['실천 내용', record.text || ''],
          ['기록 일시', (record.createdAt || L.nowISO()).slice(0, 19).replace('T', ' ')]
        ];
        if(feedback && (feedback.comment || feedback.text)){
          rows.push(['AI 피드백', String(feedback.comment || feedback.text || '')]);
        }
        L.pushRecordToNotion(record, { title: '체크인' }, columns, rows).catch(function(err){
          console.warn('[Notion Checkin Push Error]', err);
        });
      } catch(e){}
    }

    // 2. Notion Webhook (선택 연동)
    if(s.notionWebhookUrl){
      try{
        await fetch(s.notionWebhookUrl, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          mode:'no-cors',
          body: JSON.stringify({
            source:'아워골',
            user: L.state.profile.displayName,
            text: record.text,
            createdAt: record.createdAt || L.nowISO(),
            verdict: feedback ? feedback.verdict : null,
            comment: feedback ? feedback.comment : null
          })
        });
      } catch(e){
        console.warn('Notion webhook failed:', e);
      }
    }
    return true;
  }

  K.sendToNotion = sendToNotion;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
