/**
 * 전문 템플릿 기록 상세 모달·딥링크 (template-record-detail)
 *
 * 기존 전문 템플릿 기록의 상세 모달 조회와 URL 해시 딥링크 탐지를 맡는다. 동작 변경 없이 생성기로 옮긴다.
 * #TASK-ES-585(전문 템플릿 기록 상세 모달·딥링크 책임 원문 분열): index.html 인라인 IIFE 의 구간(이전 전 7287~7411 · 7412~7428줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalUiHelpers = global.OurgoalUiHelpers || {};

  /* ---- 이전 전 index.html 7287~7411줄(#TASK-ES-585 생성기 표지) ---- */

  /* 🔍 전문 템플릿 기록 상세 조회 모달 (일정 또는 기록에서 클릭 시) */
  function openTemplateRecordDetailModal(record){
    if(!record) return;
    var curTpl = L.getProTemplateByKey(record.templateKey || record.templateId);
    var tplTitle = record.templateTitle || (curTpl ? curTpl.title : '전문 맞춤 기록');
    var cols = record.columns || (curTpl ? curTpl.columns : ['번호', '항목']);
    var rList = record.rows || [];
    var yymmdd = L.fmtYYMMDD(record.startAt);

    L.openModal(
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<span class="pro-tpl-badge">' + L.escapeHtml(tplTitle) + '</span>' +
          '<span class="faint" style="font-size:.8125rem;">' + yymmdd + ' (' + rList.length + '개 항목)</span>' +
        '</div>' +
        '<div style="display:flex;gap:5px;align-items:center;">' +
          '<button class="btn btn-ghost btn-sm" id="detailCoachBtn" type="button" style="font-size:.8125rem;padding:3px 7px;color:var(--ink);border-color:var(--rule);" title="AI 프로 코치 분석">AI 코치</button>' +
          '<button class="btn btn-ghost btn-sm" id="detailNotionBtn" type="button" style="font-size:.8125rem;padding:3px 7px;" title="노션 표 복사">Notion</button>' +
          '<button class="btn btn-ghost btn-sm" id="detailEditBtn" type="button" style="font-size:.8125rem;padding:3px 8px;color:var(--ink);border-color:var(--rule);">수정</button>' +
        '</div>' +
      '</div>' +
      '<div id="detailAnalyticsWrap" style="margin-bottom:10px;">' +
        L.renderAnalyticsHtml(curTpl, cols, rList) +
      '</div>' +
      '<div id="detailTrendChartWrap" style="margin-bottom:10px;">' +
        L.renderTrendSvgChart(L.computeTrendChartData(record.templateKey || record.templateId, (L.state.profile && L.state.profile.records) || [], '7')) +
      '</div>' +
      (record.memo ? '<div style="padding:8px 12px;background:var(--card2);border-radius:10px;margin-bottom:10px;font-size:.875rem;line-height:1.45;">💭 <b>메모:</b> ' + L.escapeHtml(record.memo) + '</div>' : '') +
      '<div class="pro-tpl-table-wrap">' +
        '<table class="pro-notion-table">' +
          '<thead>' +
            '<tr>' +
              cols.map(function(c, idx){
                return '<th style="'+(idx===0?'width:44px;text-align:center;':'')+'">'+L.escapeHtml(c)+'</th>';
              }).join('') +
            '</tr>' +
          '</thead>' +
          '<tbody>' +
            (rList.length ? rList.map(function(r, rIdx){
              return '<tr>' + cols.map(function(c, cIdx){
                var cell = r[cIdx] !== undefined ? r[cIdx] : '';
                return '<td style="padding:6px 10px;'+(cIdx===0?'width:44px;text-align:center;font-weight:700;color:var(--ink-faint);':'')+'">'+L.escapeHtml(String(cell))+'</td>';
              }).join('') + '</tr>';
            }).join('') : '<tr><td colspan="'+cols.length+'" style="text-align:center;padding:14px;color:var(--ink-faint);">기록된 행이 없습니다</td></tr>') +
          '</tbody>' +
        '</table>' +
      '</div>' +
      (record.photo ? '<div style="margin:10px 0;"><img src="'+record.photo+'" style="max-height:180px;border-radius:10px;object-fit:cover;border:1px solid var(--rule);"></div>' : '') +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;flex-wrap:wrap;gap:8px;">' +
        '<span class="faint" style="font-size:.8125rem;">기록일시: ' + L.fmtTime(record.startAt) + '</span>' +
        '<div style="display:flex;gap:6px;">' +
          (record.linkedScheduleId ? '<button class="btn btn-ghost btn-sm" id="detailGoCalBtn" type="button" style="font-size:.8125rem;">캘린더에서 보기</button>' : '') +
          '<button class="btn btn-primary btn-sm" id="detailCloseBtn" type="button" style="padding:4px 16px;">닫기</button>' +
        '</div>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#detailCloseBtn').onclick = L.closeModal;

        var detailChartPeriod = '7';
        function bindDetailChartEvents(){
          var chartWrap = sheet.querySelector('#detailTrendChartWrap');
          if(!chartWrap) return;
          var tip = chartWrap.querySelector('#trendTooltip');
          chartWrap.querySelectorAll('.trend-pt-group').forEach(function(g){
            g.onmouseenter = function(){
              if(!tip) return;
              tip.textContent = (g.dataset.val || '') + ' (' + (g.dataset.date || '') + ')';
              tip.style.display = 'block';
              var rect = g.getBoundingClientRect();
              var wrapRect = chartWrap.getBoundingClientRect();
              tip.style.left = (rect.left - wrapRect.left) + 'px';
              tip.style.top = (rect.top - wrapRect.top - 24) + 'px';
            };
            g.onmouseleave = function(){
              if(tip) tip.style.display = 'none';
            };
          });
          chartWrap.querySelectorAll('.pro-trend-filter-chip').forEach(function(btn){
            btn.onclick = function(){
              detailChartPeriod = btn.dataset.period || '7';
              var cData = L.computeTrendChartData(record.templateKey || record.templateId, (L.state.profile && L.state.profile.records) || [], detailChartPeriod);
              chartWrap.innerHTML = L.renderTrendSvgChart(cData);
              var activeBtn = chartWrap.querySelector('.pro-trend-filter-chip[data-period="'+detailChartPeriod+'"]');
              if(activeBtn){
                chartWrap.querySelectorAll('.pro-trend-filter-chip').forEach(function(b){ b.classList.remove('active'); });
                activeBtn.classList.add('active');
              }
              bindDetailChartEvents();
            };
          });
        }
        bindDetailChartEvents();

        var editBtn = sheet.querySelector('#detailEditBtn');
        if(editBtn){
          editBtn.onclick = function(){
            L.closeModal();
            L.openProTemplateRecordModal(record);
          };
        }
        var coachBtn = sheet.querySelector('#detailCoachBtn');
        if(coachBtn){
          coachBtn.onclick = function(){
            L.openProCoachReportModal(curTpl, cols, rList, record.memo||'');
          };
        }
        var notionBtn = sheet.querySelector('#detailNotionBtn');
        if(notionBtn){
          notionBtn.onclick = function(){
            L.openProNotionExportModal(curTpl, cols, rList);
          };
        }
        var calBtn = sheet.querySelector('#detailGoCalBtn');
        if(calBtn){
          calBtn.onclick = function(){
            L.closeModal();
            L.state.calSelectedDate = L.isoDate(new Date(record.startAt));
            L.state.calDate = L.state.calSelectedDate;
            L.setTab('calendar');
          };
        }
      }
    );
  }
  /* ---- 이전 전 index.html 7412~7428줄(#TASK-ES-585 생성기 표지) ---- */

  /* 🔗 URL 해시 딥링크 감지 (#record=rec_xxx 또는 #record:rec_xxx) */
  function checkRecordDeepLink(){
    var hash = window.location.hash || '';
    var m = hash.match(/#record[=:](\w+)/);
    if(m && m[1]){
      var rid = m[1];
      var rec = (L.state.profile.records || []).find(function(r){ return r.id === rid; });
      if(rec){
        if(rec.type === 'template'){
          openTemplateRecordDetailModal(rec);
        } else {
          L.openRecordModal(rec);
        }
      }
    }
  }

  K.openTemplateRecordDetailModal = openTemplateRecordDetailModal;
  K.checkRecordDeepLink = checkRecordDeepLink;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
