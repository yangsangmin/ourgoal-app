/**
 * OurGoal Pro Record Tools (기록 — 전문 템플릿 기록 창의 도구 단추)
 *
 * bindProRecTools — 지난 루틴 불러오기 · AI 코치 · Notion 연동 · CSV 가져오기/내려받기 · 스마트워치 · 템플릿 마켓 · AI 사진 인식 · 음성 입력 · 표 속성 편집 · 템플릿 변경 · 템플릿 생성 · 사진 첨부 단추를 연결한다.
 * 본문은 이전 전 글자 그대로다(#TASK-ES-646 에서 나눈 꼴).
 * #TASK-ES-672(전문 템플릿 기록 창 조각 여섯을 세포로 글자 그대로 이전 — 진입점 · 표 편집 · 도구 단추 · 성장 추이 차트 · 스톱워치·인터벌 타이머 · 저장·닫기 (지시함 DIR-004 (라) A안 ③)): index.html 인라인 IIFE 의 구간(이전 전 2938~3175줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 2938~3175줄(#TASK-ES-672 생성기 표지) ---- */
  function bindProRecTools(ctx){ /* [#TASK-ES-646] 전문 템플릿 기록 창 조각 — 도구 단추: 지난 루틴 불러오기 · AI 코치 · Notion 연동 · CSV 가져오기/내려받기 · 스마트워치 · 템플릿 마켓 · AI 사진 인식 · 음성 입력 · 표 속성 편집 · 템플릿 변경 · 템플릿 생성 · 사진 첨부. 꾸러미(ctx)는 openProTemplateRecordModal 가 만든다 */
      // ⚡ 지난 루틴 불러오기 (혁신 2)
      var quickLoadBtn = ctx.sheet.querySelector('#proQuickLoadBtn');
      if(quickLoadBtn){
        quickLoadBtn.onclick = function(){
          var prev = (L.state.profile.records || []).find(function(r){
            return r.type === 'template' && (r.templateKey === ctx.curTpl.key || r.templateId === ctx.curTpl.id) && r.rows && r.rows.length;
          });
          if(!prev){
            L.toast('이 템플릿으로 작성된 이전 기록이 없습니다. 첫 루틴을 완성해보세요!');
            return;
          }
          ctx.rows = prev.rows.map(function(r, idx){
            var copy = r.slice();
            if(copy[0] !== undefined) copy[0] = String(idx + 1);
            return copy;
          });
          ctx.refreshTableBody();
          L.toast('' + L.fmtYYMMDD(prev.startAt) + ' 이전 루틴을 성공적으로 불러왔어요!');
        };
      }

      // 🧠 AI 코치 리포트 버튼 (혁신 3)
      var coachBtn = ctx.sheet.querySelector('#proCoachBtn');
      if(coachBtn){
        coachBtn.onclick = function(){
          ctx.syncCurrentRowsFromDOM();
          var memo = (ctx.sheet.querySelector('#proRecMemo').value || '').trim();
          L.openProCoachReportModal(ctx.curTpl, ctx.columns, ctx.rows, memo);
        };
      }

      // 🔄 Notion 연동 버튼 (혁신 4)
      var notionBtn = ctx.sheet.querySelector('#proNotionExportBtn');
      if(notionBtn){
        notionBtn.onclick = function(){
          ctx.syncCurrentRowsFromDOM();
          L.openProNotionExportModal(ctx.curTpl, ctx.columns, ctx.rows);
        };
      }

      // 📥 CSV 가져오기
      var csvImportBtn = ctx.sheet.querySelector('#proCsvImportBtn');
      if(csvImportBtn){
        csvImportBtn.onclick = function(){
          ctx.syncCurrentRowsFromDOM();
          L.openCsvImportModal(ctx.curTpl, ctx.columns, function(parsedRows){
            if(!parsedRows || !parsedRows.length) return;
            ctx.rows = parsedRows.map(function(r, idx){
              var newR = [];
              for(var i=0; i<ctx.columns.length; i++){
                newR[i] = (r[i] !== undefined) ? r[i] : (i===0 ? String(idx+1) : '');
              }
              return newR;
            });
            ctx.refreshTableBody();
            L.toast('CSV 표 데이터 ' + ctx.rows.length + '개 행을 성공적으로 가져왔어요!');
          });
        };
      }

      // 📤 CSV 다운로드
      var csvExportBtn = ctx.sheet.querySelector('#proCsvExportBtn');
      if(csvExportBtn){
        csvExportBtn.onclick = function(){
          ctx.syncCurrentRowsFromDOM();
          L.downloadTableAsCsv(ctx.curTpl, ctx.columns, ctx.rows);
        };
      }

      // ⌚ 스마트워치 연동
      var wearableBtn = ctx.sheet.querySelector('#proWearableSyncBtn');
      if(wearableBtn){
        wearableBtn.onclick = function(){
          ctx.syncCurrentRowsFromDOM();
          L.openWearableSyncModal(ctx.curTpl, ctx.columns, function(act){
            if(!act) return;
            var targetRow = ctx.rows[0] || ctx.columns.map(function(c, i){ return i===0 ? '1' : ''; });
            ctx.columns.forEach(function(colName, cIdx){
              if(cIdx === 0) return;
              var c = colName.toLowerCase();
              if(/(?:심박수|bpm|맥박)/.test(c)){
                targetRow[cIdx] = act.bpm;
              } else if(/(?:시간|소요시간|타임)/.test(c)){
                targetRow[cIdx] = act.duration;
              } else if(/(?:칼로리|kcal)/.test(c)){
                targetRow[cIdx] = act.calories;
              } else if(/(?:거리|km|m)/.test(c) && act.dist !== '-'){
                targetRow[cIdx] = act.dist;
              } else if(/(?:페이스|pace)/.test(c) && act.pace !== '-'){
                targetRow[cIdx] = act.pace;
              }
            });
            if(!ctx.rows.length) ctx.rows.push(targetRow);
            ctx.refreshTableBody();
            L.toast('[' + act.source + '] 운동 데이터가 표에 자동 매핑되었습니다!');
          });
        };
      }

      // 🏪 템플릿 마켓
      var marketBtn = ctx.sheet.querySelector('#proTplMarketBtn');
      if(marketBtn){
        marketBtn.onclick = function(){
          L.openTemplateMarketModal(function(clonedTpl){
            L.closeModal();
            L.openProTemplateRecordModal(null, clonedTpl.key, ctx.initialDate);
          });
        };
      }

      // 📷 AI 사진 인식 (Vision-to-Table)
      var visionBtn = ctx.sheet.querySelector('#proVisionOcrBtn');
      if(visionBtn){
        visionBtn.onclick = function(){
          ctx.syncCurrentRowsFromDOM();
          L.openVisionTableModal(ctx.curTpl, ctx.columns, function(newRows){
            if(!newRows || !newRows.length) return;
            newRows.forEach(function(r){
              var rowArr = [];
              for(var i=0; i<ctx.columns.length; i++){
                rowArr[i] = (r[i] !== undefined) ? r[i] : (i===0 ? String(ctx.rows.length + 1) : '');
              }
              ctx.rows.push(rowArr);
            });
            ctx.refreshTableBody();
            L.toast('사진에서 ' + newRows.length + '개 행을 추출하여 표에 추가했습니다!');
          });
        };
      }

      // 🎙️ 음성 입력 (Voice-to-Table)
      var voiceBtn = ctx.sheet.querySelector('#proVoiceInputBtn');
      if(voiceBtn){
        voiceBtn.onclick = function(){
          ctx.syncCurrentRowsFromDOM();
          L.openVoiceTableModal(ctx.curTpl, ctx.columns, function(newRow){
            if(!newRow) return;
            var rowArr = [];
            for(var i=0; i<ctx.columns.length; i++){
              rowArr[i] = (newRow[i] !== undefined) ? newRow[i] : (i===0 ? String(ctx.rows.length + 1) : '');
            }
            ctx.rows.push(rowArr);
            ctx.refreshTableBody();
            L.toast('음성으로 새 행이 표에 추가되었습니다!');
          });
        };
      }

      // 표 속성 편집
      ctx.sheet.querySelector('#proEditColsBtn').onclick = function(){
        ctx.syncCurrentRowsFromDOM();
        L.openTemplateColumnEditModal(ctx.columns, function(updatedCols){
          ctx.columns = updatedCols;
          ctx.rows = ctx.rows.map(function(r){
            var newR = [];
            for(var i=0; i<ctx.columns.length; i++){
              newR[i] = (r[i] !== undefined) ? r[i] : (i===0 ? r[0] : '');
            }
            return newR;
          });
          var thead = ctx.sheet.querySelector('#proTable thead tr');
          if(thead){
            thead.innerHTML = ctx.columns.map(function(c, cIdx){
              return '<th style="'+(cIdx===0?'width:44px;text-align:center;':'')+'">'+L.escapeHtml(c)+'</th>';
            }).join('') + '<th style="width:36px;text-align:center;">삭제</th>';
          }
          ctx.refreshTableBody();
          L.toast('표 속성을 변경했어요');
        });
      };

      // 템플릿 변경
      var tplSelect = ctx.sheet.querySelector('#proTplSelect');
      if(tplSelect){
        tplSelect.onchange = function(){
          ctx.syncCurrentRowsFromDOM();
          var selKey = tplSelect.value;
          ctx.curTpl = L.getProTemplateByKey(selKey);
          ctx.columns = ctx.curTpl.columns ? ctx.curTpl.columns.slice() : ['번호','항목'];
          ctx.rows = ctx.curTpl.defaultRows ? ctx.curTpl.defaultRows.map(function(r){ return r.slice(); }) : [ctx.columns.map(function(c, i){ return i===0 ? '1' : ''; })];
          var thead = ctx.sheet.querySelector('#proTable thead tr');
          if(thead){
            thead.innerHTML = ctx.columns.map(function(c, cIdx){
              return '<th style="'+(cIdx===0?'width:44px;text-align:center;':'')+'">'+L.escapeHtml(c)+'</th>';
            }).join('') + '<th style="width:36px;text-align:center;">삭제</th>';
          }
          var badge = ctx.sheet.querySelector('.pro-tpl-badge');
          if(badge) badge.innerHTML = ctx.curTpl.icon + ' ' + L.escapeHtml(ctx.curTpl.title);
          ctx.refreshTableBody();
          ctx.updateTrendChart();
        };
      }

      // 템플릿 생성 버튼
      var createBtn = ctx.sheet.querySelector('#proCreateTplBtn');
      if(createBtn){
        createBtn.onclick = function(){
          L.openCreateCustomTemplateModal(function(newTpl){
            ctx.curTpl = newTpl;
            ctx.columns = newTpl.columns.slice();
            ctx.rows = newTpl.defaultRows ? newTpl.defaultRows.map(function(r){ return r.slice(); }) : [ctx.columns.map(function(c, i){ return i===0 ? '1' : ''; })];
            ctx.allTpls = L.getAllProTemplates();
            tplSelect.innerHTML = ctx.allTpls.map(function(t){
              return '<option value="'+t.key+'"'+(t.key===ctx.curTpl.key?' selected':'')+'>'+t.icon+' '+t.title+' ('+t.columns.length+'개 속성)</option>';
            }).join('');
            var thead = ctx.sheet.querySelector('#proTable thead tr');
            if(thead){
              thead.innerHTML = ctx.columns.map(function(c, cIdx){
                return '<th style="'+(cIdx===0?'width:44px;text-align:center;':'')+'">'+L.escapeHtml(c)+'</th>';
              }).join('') + '<th style="width:36px;text-align:center;">삭제</th>';
            }
            var badge = ctx.sheet.querySelector('.pro-tpl-badge');
            if(badge) badge.innerHTML = ctx.curTpl.icon + ' ' + L.escapeHtml(ctx.curTpl.title);
            ctx.refreshTableBody();
            ctx.updateTrendChart();
          });
        };
      }

      // 사진 첨부
      var fileInp = ctx.sheet.querySelector('#proFileInput');
      var photoBtn = ctx.sheet.querySelector('#proPhotoPickBtn');
      var photoPrev = ctx.sheet.querySelector('#proPhotoPreview');
      if(photoBtn && fileInp){
        photoBtn.onclick = function(){ fileInp.click(); };
        fileInp.onchange = function(e){
          var f = e.target.files[0];
          if(!f) return;
          L.resizeImageToDataUrl(f, 600, function(dUrl){
            if(dUrl){
              ctx.attachedPhoto = dUrl;
              photoPrev.innerHTML = '<img src="'+dUrl+'" style="width:100%;height:100%;object-fit:cover;">';
            }
          });
        };
      }
  }

  K.bindProRecTools = bindProRecTools;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 시작 · gen-cell-provide.js] 이 세포가 키트에 단 이름을 등록 기관(js/core/cell-registry.js)에 스스로 등록한다 — 대조(compare) 전용, 동작 변화 0. 생성기 산출이므로 손으로 고치지 않는다. ==== */
(function (g) {
  var R = g.OurgoalCellRegistry;
  if (!R) return;
  var K = g.OurgoalRecordsKit;
  if (K) R.provide('records/pro-record-tools', {
    bindProRecTools: K.bindProRecTools
  }, { window: [] });
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 끝] ==== */
