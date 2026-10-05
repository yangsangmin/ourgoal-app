/**
 * OurGoal Stats Cell: 내보내기 — 정제 CSV 내보내기·차트 스냅샷(exportCleanCsv · captureChartSnapshot) (#TASK-ES-405 · 통계 세포 쪼개기 3차)
 *
 * js/universal-stats.js(이전 전 3,283줄)에서 동작 그대로 옮겼다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 *   exportCleanCsv · captureChartSnapshot
 * 함수 단위로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 */
(function(root) {
  'use strict';
  // S = js/universal-stats.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·값(pad·METRIC_CONFIGS·askConfirm …)을 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 통계 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = root.OurgoalUniversalStatsKit = root.OurgoalUniversalStatsKit || {};
  var S = K.scope = K.scope || {};

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

  K.exportCleanCsv = exportCleanCsv;
  K.captureChartSnapshot = captureChartSnapshot;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
