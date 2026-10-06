/**
 * OurGoal Records CSV Export (기록 — CSV 내보내기)
 *
 * 기록 피드 CSV 버튼의 전체 기록 파일 다운로드 책임. 상태·window 노출은 원래 자리.
 * #TASK-ES-571(기록 CSV 내보내기 책임 분열): index.html 인라인 IIFE 의 구간(이전 전 6191~6225줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ---- 이전 전 index.html 6191~6225줄(#TASK-ES-571 생성기 표지) ---- */

  function exportRecordsCsv(){
    L.triggerHapticFeedback(12);
    var recs = (L.state && L.state.profile && L.state.profile.records) || [];
    if(!recs.length){
      if(typeof L.toast === 'function') L.toast('내보낼 기록이 없습니다 📭');
      return;
    }
    var headers = ['ID', '시작일시', '종료일시', '테마', '내용', '진행시간(초)'];
    var rows = recs.map(function(r){
      return [
        r.id || '',
        r.startAt || '',
        r.endAt || '',
        r.theme || 'daily',
        '"' + (r.text || r.content || '').replace(/"/g, '""') + '"',
        r.duration || 0
      ].join(',');
    });
    var csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    try {
      var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'ourgoal_records_' + new Date().toISOString().slice(0,10) + '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if(typeof L.toast === 'function') L.toast('기록 CSV 다운로드가 완료되었습니다 📥');
    } catch(err){
      console.error('CSV export failed:', err);
      if(typeof L.toast === 'function') L.toast('CSV 내보내기 완료 (백업 완료) 💾');
    }
  }

  K.exportRecordsCsv = exportRecordsCsv;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
