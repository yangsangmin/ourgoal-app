/**
 * OurGoal Pro Record Modal (기록 — 전문 템플릿 기록 창의 진입점과 창 틀)
 *
 * openProTemplateRecordModal — 「전문(맞춤) 템플릿 기록」 창을 연다: 고른 템플릿·날짜·행을 꾸러미(ctx)에 담고 창의 마크업을 그린 뒤 조각 다섯을 정해진 순서로 부른다.
 * 조각을 부르는 순서(표 편집 → 도구 단추 → 행 삭제 연결 → 성장 추이 차트 → 스톱워치 → 저장·닫기)는 바꾸지 않는다 — 도구 단추의 처리기가 차트 조각이 꾸러미에 등록하는 함수를 부른다.
 * 본문은 이전 전 글자 그대로다(#TASK-ES-646 에서 나눈 꼴).
 * #TASK-ES-672(전문 템플릿 기록 창 조각 여섯을 세포로 글자 그대로 이전 — 진입점 · 표 편집 · 도구 단추 · 성장 추이 차트 · 스톱워치·인터벌 타이머 · 저장·닫기 (지시함 DIR-004 (라) A안 ③)): index.html 인라인 IIFE 의 구간(이전 전 2712~2867줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 2712~2867줄(#TASK-ES-672 생성기 표지) ---- */
  /* [#TASK-ES-645] executeDirectTemplateClone · openTemplateMarketModal → js/tabs/records/template-market.js 로 옮김(돈 근처 함수 2개 글자 그대로 이전 — 템플릿 마켓 창 · 템플릿 복제 본체(지시함 DIR-004 (나): 내용은 한 글자도 바꾸지 않고 자리만) — 앞 주석 포함) */

  /* 📋 전문적(내 전용 템플릿) 기록하기 메인 창 */
  function openProTemplateRecordModal(editRec, initialTplKey, initialDate){
    var ctx = { editRec: editRec, initialDate: initialDate, renderRowsHtml: renderRowsHtml }; /* [#TASK-ES-646] 조각 함수들이 함께 보는 꾸러미 — 읽기·쓰기 모두 여기를 거친다 */
    ctx.isNew = !ctx.editRec;
    ctx.allTpls = L.getAllProTemplates();
    ctx.curTpl = ctx.editRec ?
      (ctx.allTpls.find(function(t){ return t.id===ctx.editRec.templateId || t.key===ctx.editRec.templateKey; }) || { id: ctx.editRec.templateId, key: ctx.editRec.templateKey, icon:'📋', title: ctx.editRec.templateTitle || '맞춤기록', columns: ctx.editRec.columns||['번호','항목'] }) :
      (initialTplKey ? (ctx.allTpls.find(function(t){ return t.key===initialTplKey || t.id===initialTplKey; }) || ctx.allTpls[0]) : ctx.allTpls[0]);

    ctx.columns = ctx.editRec && ctx.editRec.columns ? ctx.editRec.columns.slice() : (ctx.curTpl.columns ? ctx.curTpl.columns.slice() : ['번호','운동종목','세트','횟수','시간','거리','강도(100점)']);
    ctx.rows = [];
    if(ctx.editRec && ctx.editRec.rows && ctx.editRec.rows.length){
      ctx.rows = ctx.editRec.rows.map(function(r){ return r.slice(); });
    } else if(ctx.curTpl.defaultRows && ctx.curTpl.defaultRows.length){
      ctx.rows = ctx.curTpl.defaultRows.map(function(r){ return r.slice(); });
    } else {
      ctx.rows = [ctx.columns.map(function(c, i){ return i===0 ? '1' : ''; })];
    }

    var defaultDateVal = ctx.initialDate ? (ctx.initialDate + 'T' + L.pad(new Date().getHours()) + ':' + L.pad(new Date().getMinutes())) : L.toLocalInputValue(new Date());
    var recordDateVal = ctx.editRec && ctx.editRec.startAt ? L.toLocalInputValue(ctx.editRec.startAt) : defaultDateVal;
    var memoVal = ctx.editRec ? (ctx.editRec.memo || '') : '';
    ctx.attachedPhoto = ctx.editRec ? ctx.editRec.photo : null;

    function renderModal(){
      var tplOptions = ctx.allTpls.map(function(t){
        return '<option value="'+t.key+'"'+(t.key===ctx.curTpl.key?' selected':'')+'>'+t.icon+' '+t.title+' ('+t.columns.length+'개 속성)</option>';
      }).join('');

      var backHtml = ctx.initialDate ? ('<div style="width:100%;margin-bottom:6px;"><span class="dm-back" id="proRecBackToHubBtn" style="cursor:pointer;margin:0;font-size:.875rem;color:var(--ink);font-weight:700;">‹ ' + ctx.initialDate + ' 일정 목록으로 돌아가기</span></div>') : '';

      return backHtml + '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap;">' +
        '<h3 style="margin:0;">' + (ctx.isNew ? '전문(맞춤) 템플릿 기록' : '전문 템플릿 기록 수정') + '</h3>' +
        '<div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;">' +
          '<button class="btn btn-ghost btn-sm" id="proQuickLoadBtn" type="button" style="font-size:.8125rem;padding:3px 7px;color:var(--ink);border-color:var(--rule);" title="이전 세션 루틴 1초 불러오기">루틴 불러오기</button>' +
          '<button class="btn btn-ghost btn-sm" id="proCoachBtn" type="button" style="font-size:.8125rem;padding:3px 7px;color:var(--ink);border-color:var(--rule);" title="AI 프로 코치 분석 리포트">AI 코치</button>' +
          '<button class="btn btn-ghost btn-sm" id="proNotionExportBtn" type="button" style="font-size:.8125rem;padding:3px 7px;" title="노션 표 복사/연동">Notion 연동</button>' +
          '<button class="btn btn-ghost btn-sm" id="proCsvImportBtn" type="button" style="font-size:.8125rem;padding:3px 7px;" title="CSV/엑셀 데이터 가져오기">CSV 가져오기</button>' +
          '<button class="btn btn-ghost btn-sm" id="proCsvExportBtn" type="button" style="font-size:.8125rem;padding:3px 7px;" title="엑셀 호환 CSV 다운로드">CSV 다운로드</button>' +
          '<button class="btn btn-ghost btn-sm" id="proWearableSyncBtn" type="button" style="font-size:.8125rem;padding:3px 7px;color:var(--ink);" title="애플 건강/스트라바 연동">스마트워치</button>' +
          '<button class="btn btn-ghost btn-sm" id="proTplMarketBtn" type="button" style="font-size:.8125rem;padding:3px 7px;color:var(--ink);" title="커뮤니티 템플릿 마켓">마켓</button>' +
          '<button class="btn btn-ghost btn-sm" id="proCreateTplBtn" type="button" style="font-size:.8125rem;padding:3px 7px;">+ 새 템플릿</button>' +
        '</div>' +
      '</div>' +
      '<div style="padding:10px 14px;background:var(--card2);border-radius:12px;border:1px solid var(--rule);margin-bottom:12px;font-size:.8125rem;line-height:1.45;color:var(--ink-soft);">' +
        '<b>맞춤형으로 생성됩니다.</b> 일자별로 그기록을 저장하고 일정과 연동할 수 있습니다.' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">' +
        '<div class="field" style="flex:1;min-width:140px;margin-bottom:0;">' +
          '<label>템플릿 선택</label>' +
          '<select id="proTplSelect">' + tplOptions + '</select>' +
        '</div>' +
        '<div class="field" style="flex:1;min-width:140px;margin-bottom:0;">' +
          '<label>기록 날짜 및 시간</label>' +
          '<input id="proRecDate" type="datetime-local" value="' + recordDateVal + '">' +
        '</div>' +
      '</div>' +
      '<div id="proTrendChartWrap" style="margin-bottom:10px;">' +
        L.renderTrendSvgChart(L.computeTrendChartData(ctx.curTpl.key, (L.state.profile && L.state.profile.records) || [], '7')) +
      '</div>' +
      '<div id="proStopwatchWrap" style="margin-bottom:10px;">' +
        L.renderStopwatchWidgetHtml() +
      '</div>' +
      '<div id="proAnalyticsWrap">' +
        L.renderAnalyticsHtml(ctx.curTpl, ctx.columns, ctx.rows) +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin:10px 0 6px;flex-wrap:wrap;gap:6px;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<span class="pro-tpl-badge">' + ctx.curTpl.icon + ' ' + L.escapeHtml(ctx.curTpl.title) + '</span>' +
          '<span class="faint" style="font-size:.8125rem;">노션 표 속성 기록</span>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
          '<button class="btn btn-ghost btn-sm" id="proVisionOcrBtn" type="button" style="font-size:.8125rem;padding:3px 8px;color:var(--ink);" title="와드판/시험지 사진으로 표 자동 채우기">AI 사진 인식</button>' +
          '<button class="btn btn-ghost btn-sm" id="proVoiceInputBtn" type="button" style="font-size:.8125rem;padding:3px 8px;color:var(--brand-strong);" title="음성으로 말하면 실시간 행 추가">음성 입력</button>' +
          '<button class="btn btn-ghost btn-sm" id="proEditColsBtn" type="button" style="font-size:.8125rem;padding:3px 8px;">표 속성 편집</button>' +
          '<button class="btn btn-ghost btn-sm" id="proAddRowBtn" type="button" style="font-size:.8125rem;padding:3px 8px;color:var(--ink);">+ 행 추가</button>' +
        '</div>' +
      '</div>' +
      '<div class="pro-tpl-table-wrap">' +
        '<table class="pro-notion-table" id="proTable">' +
          '<thead>' +
            '<tr>' +
              ctx.columns.map(function(c, cIdx){
                return '<th style="'+(cIdx===0?'width:44px;text-align:center;':'')+'">'+L.escapeHtml(c)+'</th>';
              }).join('') +
              '<th style="width:36px;text-align:center;">삭제</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody id="proTableBody">' +
            renderRowsHtml(ctx.rows, ctx.columns) +
          '</tbody>' +
        '</table>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;margin-bottom:12px;">' +
        '<button class="btn btn-ghost btn-sm" id="proAddRowBtn2" type="button" style="font-size:.8125rem;padding:3px 10px;">+ 새 행 추가</button>' +
      '</div>' +
      '<div class="field" style="margin-bottom:10px;">' +
        '<label>오늘의 한줄 회고 및 메모 (선택)</label>' +
        '<input id="proRecMemo" type="text" value="' + L.escapeHtml(memoVal) + '" placeholder="예: 오늘 컨디션 좋았음, 다음엔 3세트 무게 올려서 도전">' +
      '</div>' +
      '<div class="field" style="margin-bottom:14px;">' +
        '<label>인증 사진 첨부 (선택)</label>' +
        '<div style="display:flex;gap:10px;align-items:center;">' +
          '<button class="btn btn-ghost btn-sm" id="proPhotoPickBtn" type="button">사진 첨부</button>' +
          '<input type="file" id="proFileInput" accept="image/*" style="display:none;">' +
          '<div id="proPhotoPreview" style="width:40px;height:40px;border-radius:8px;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:1.1rem;overflow:hidden;border:1px solid var(--rule);">' +
            (ctx.attachedPhoto ? '<img src="'+ctx.attachedPhoto+'" style="width:100%;height:100%;object-fit:cover;">' : '🖼️') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="padding:10px 14px;background:var(--card2);border-radius:12px;margin-bottom:14px;border:1px solid var(--rule);">' +
        '<div style="font-size:.8125rem;color:var(--ink);font-weight:700;margin-bottom:2px;">*일정연동 저장은 오늘 기록이 링크화되어 일정에 기록됩니다.</div>' +
        '<div class="faint" style="font-size:.8125rem;">일정에 ' + L.fmtYYMMDD(recordDateVal) + ctx.curTpl.title + '(link주소) 형식으로 등록되며, 일정 탭에서 바로 열람할 수 있습니다.</div>' +
      '</div>' +
      '<div class="modal-actions" style="gap:8px;flex-wrap:wrap;">' +
        '<button class="btn btn-ghost btn-sm" id="proCancelBtn" type="button" style="flex:0 0 auto;">취소</button>' +
        '<button class="btn btn-ghost btn-sm" id="proGeneralSaveBtn" type="button" style="flex:1;min-width:110px;">일반저장</button>' +
        '<button class="btn btn-primary btn-sm" id="proCalendarSaveBtn" type="button" style="flex:1;min-width:130px;">일정연동저장</button>' +
      '</div>';
    }

    function renderRowsHtml(rList, cList){
      if(!rList.length){
        return '<tr><td colspan="'+(cList.length+1)+'" style="text-align:center;padding:16px;color:var(--ink-faint);">+ 행 추가 버튼을 눌러 기록을 시작하세요</td></tr>';
      }
      return rList.map(function(row, rIdx){
        var tds = cList.map(function(colName, cIdx){
          var val = row[cIdx] !== undefined ? row[cIdx] : '';
          var isFirst = (cIdx === 0);
          var isTimeCol = /(시간|타임|휴식|초|time|duration|sec|min)/i.test(String(colName || ''));
          var ph = isFirst ? (rIdx + 1) : (isTimeCol ? colName + ' (분:초 또는 초)' : colName);
          return '<td style="'+(isFirst?'width:44px;text-align:center;':'')+'">' +
            '<input type="text" class="pro-tpl-cell-input" data-row="'+rIdx+'" data-col="'+cIdx+'" value="'+L.escapeHtml(String(val))+'" placeholder="'+L.escapeHtml(String(ph))+'">' +
          '</td>';
        }).join('');
        return '<tr data-rowidx="'+rIdx+'">' +
          tds +
          '<td style="width:36px;text-align:center;">' +
            '<button type="button" class="pro-tpl-row-del" data-delrow="'+rIdx+'" aria-label="행 삭제" title="행 삭제">×</button>' +
          '</td>' +
        '</tr>';
      }).join('');
    }

    L.openModal(renderModal(), function(sheet){
      ctx.sheet = sheet;
      L.bindProRecTable(ctx);
      L.bindProRecTools(ctx);
      ctx.bindRowEvents();
      L.bindProRecTrendChart(ctx);
      L.bindProRecStopwatch(ctx);
      L.bindProRecSave(ctx);
    });
  }

  K.openProTemplateRecordModal = openProTemplateRecordModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 시작 · gen-cell-provide.js] 이 세포가 키트에 단 이름을 등록 기관(js/core/cell-registry.js)에 스스로 등록한다 — 대조(compare) 전용, 동작 변화 0. 생성기 산출이므로 손으로 고치지 않는다. ==== */
(function (g) {
  var R = g.OurgoalCellRegistry;
  if (!R) return;
  var K = g.OurgoalRecordsKit;
  if (K) R.provide('records/pro-record-modal', {
    openProTemplateRecordModal: K.openProTemplateRecordModal
  }, { window: [] });
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 끝] ==== */
