/**
 * OurGoal Pro Record Table (기록 — 전문 템플릿 기록 창의 표 편집)
 *
 * bindProRecTable — 표의 칸을 읽어 행에 담기 · 실시간 분석 띠 · 표 다시 그리기 · 행 삭제 · 행 추가를 연결하고, 다른 조각이 부르는 함수 넷을 꾸러미(ctx)에 등록한다.
 * 본문은 이전 전 글자 그대로다(#TASK-ES-646 에서 나눈 꼴).
 * #TASK-ES-672(전문 템플릿 기록 창 조각 여섯을 세포로 글자 그대로 이전 — 진입점 · 표 편집 · 도구 단추 · 성장 추이 차트 · 스톱워치·인터벌 타이머 · 저장·닫기 (지시함 DIR-004 (라) A안 ③)): index.html 인라인 IIFE 의 구간(이전 전 2868~2937줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 2868~2937줄(#TASK-ES-672 생성기 표지) ---- */
  function bindProRecTable(ctx){ /* [#TASK-ES-646] 전문 템플릿 기록 창 조각 — 표 편집: 표의 칸을 읽어 행에 담기 · 실시간 분석 띠 · 표 다시 그리기 · 행 삭제 · 행 추가. 꾸러미(ctx)는 openProTemplateRecordModal 가 만든다 */
      ctx.syncCurrentRowsFromDOM = syncCurrentRowsFromDOM; ctx.updateAnalyticsBanner = updateAnalyticsBanner; ctx.refreshTableBody = refreshTableBody; ctx.bindRowEvents = bindRowEvents;
      function syncCurrentRowsFromDOM(){
        var tbody = ctx.sheet.querySelector('#proTableBody');
        if(!tbody) return;
        var newRows = [];
        tbody.querySelectorAll('tr').forEach(function(tr){
          var rowData = [];
          tr.querySelectorAll('.pro-tpl-cell-input').forEach(function(inp){
            var cIdx = parseInt(inp.dataset.col, 10);
            rowData[cIdx] = inp.value;
          });
          if(rowData.length) newRows.push(rowData);
        });
        ctx.rows = newRows;
      }

      function updateAnalyticsBanner(){
        var bannerWrap = ctx.sheet.querySelector('#proAnalyticsWrap');
        if(bannerWrap){
          bannerWrap.innerHTML = L.renderAnalyticsHtml(ctx.curTpl, ctx.columns, ctx.rows);
        }
      }

      function refreshTableBody(){
        var tbody = ctx.sheet.querySelector('#proTableBody');
        if(!tbody) return;
        tbody.innerHTML = ctx.renderRowsHtml(ctx.rows, ctx.columns);
        bindRowEvents();
        updateAnalyticsBanner();
      }

      function bindRowEvents(){
        ctx.sheet.querySelectorAll('.pro-tpl-row-del').forEach(function(b){
          b.onclick = function(){
            syncCurrentRowsFromDOM();
            var dIdx = parseInt(b.dataset.delrow, 10);
            if(ctx.rows.length > 1){
              ctx.rows.splice(dIdx, 1);
              ctx.rows.forEach(function(r, i){ if(r[0] !== undefined) r[0] = String(i+1); });
            } else {
              ctx.rows[0] = ctx.columns.map(function(c, i){ return i===0 ? '1' : ''; });
            }
            refreshTableBody();
          };
        });
      }

      function addNewRow(){
        syncCurrentRowsFromDOM();
        var nextNum = String(ctx.rows.length + 1);
        var newRow = ctx.columns.map(function(c, i){ return i===0 ? nextNum : ''; });
        ctx.rows.push(newRow);
        refreshTableBody();
        var inputs = ctx.sheet.querySelectorAll('.pro-tpl-cell-input[data-row="'+(ctx.rows.length-1)+'"]');
        if(inputs && inputs[1]) inputs[1].focus();
      }

      var tableBody = ctx.sheet.querySelector('#proTableBody');
      if(tableBody){
        tableBody.addEventListener('input', function(){
          syncCurrentRowsFromDOM();
          updateAnalyticsBanner();
        });
      }

      ctx.sheet.querySelector('#proAddRowBtn').onclick = addNewRow;
      var addBtn2 = ctx.sheet.querySelector('#proAddRowBtn2');
      if(addBtn2) addBtn2.onclick = addNewRow;
  }

  K.bindProRecTable = bindProRecTable;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
