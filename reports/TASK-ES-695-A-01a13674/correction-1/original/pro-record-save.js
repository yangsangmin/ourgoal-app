/**
 * OurGoal Pro Record Save (기록 — 전문 템플릿 기록 창의 저장·닫기)
 *
 * bindProRecSave — 일반저장 · 일정연동저장(기기 즉시 저장 → 목표·일정·기록 연동 → 화면 갱신 → 서버 동기화 → Notion 자동 전송)과 취소·돌아가기를 연결한다.
 * 본문은 이전 전 글자 그대로다(#TASK-ES-646 에서 나눈 꼴).
 * #TASK-ES-672(전문 템플릿 기록 창 조각 여섯을 세포로 글자 그대로 이전 — 진입점 · 표 편집 · 도구 단추 · 성장 추이 차트 · 스톱워치·인터벌 타이머 · 저장·닫기 (지시함 DIR-004 (라) A안 ③)): index.html 인라인 IIFE 의 구간(이전 전 3487~3673줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 3487~3673줄(#TASK-ES-672 생성기 표지) ---- */
  function bindProRecSave(ctx){ /* [#TASK-ES-646] 전문 템플릿 기록 창 조각 — 저장·닫기: 기기 즉시 저장 → 목표·일정·기록 연동 → 화면 갱신 → 서버 동기화 → Notion 자동 전송, 취소·돌아가기. 꾸러미(ctx)는 openProTemplateRecordModal 가 만든다 */
      var profile = L.state.profile, recordId = ctx.editRec ? ctx.editRec.id : L.newId();
      var saving = false, awarded = false;
      var buttons = [ctx.sheet.querySelector('#proGeneralSaveBtn'), ctx.sheet.querySelector('#proCalendarSaveBtn')];
      function unlock(){ saving = false; buttons.forEach(function(b){ if(b) b.disabled = false; }); }
      function message(saved, action){ return global.OurgoalCapabilities.request('storage.device.message', 'records/pro-record-save')(saved, action); }
      ctx.sheet.querySelector('#proCancelBtn').onclick = function(){
        ctx.stopSwTimer();
        L.closeModal();
      };

      // 저장 공통 함수
      async function executeSave(syncCalendar){
        if(saving || L.state.profile !== profile) return;
        saving = true; buttons.forEach(function(b){ if(b) b.disabled = true; });
        try {
        ctx.stopSwTimer();
        ctx.syncCurrentRowsFromDOM();
        var dateInpVal = (ctx.sheet.querySelector('#proRecDate').value || '').trim();
        var schedDateVal = dateInpVal ? (dateInpVal.indexOf('T') !== -1 ? dateInpVal : dateInpVal + 'T09:00') : L.toLocalInputValue(new Date());
        var recordDateISO = new Date(schedDateVal).toISOString();
        var memo = (ctx.sheet.querySelector('#proRecMemo').value || '').trim();
        var validRows = ctx.rows.filter(function(r){
          return r && r.some(function(cell, idx){ return idx > 0 && cell && String(cell).trim().length > 0; });
        });
        if(!validRows.length) validRows = ctx.rows.slice(0, 1);

        var recId = recordId;
        var yymmdd = L.fmtYYMMDD(schedDateVal);
        var tplTitle = ctx.curTpl.title || '기록';
        var linkUrl = '#record=' + recId;
        var schedTitle = yymmdd + tplTitle + '(' + linkUrl + ')';

        var summaryText = validRows.map(function(r){
          return r.filter(Boolean).join(' | ');
        }).join('\r\n');
        var fullText = '[' + tplTitle + '] ' + validRows.length + '개 항목 기록\r\n' + (memo ? memo + '\r\n' : '') + summaryText;

        var recObj = {
          id: recId,
          type: 'template',
          theme: ctx.curTpl.theme || 'daily',
          category: null,
          visibility: 'private',
          templateId: ctx.curTpl.id,
          templateKey: ctx.curTpl.key,
          templateTitle: tplTitle,
          columns: ctx.columns,
          rows: validRows,
          text: fullText,
          summaryText: summaryText,
          memo: memo,
          startAt: recordDateISO,
          endAt: null,
          createdAt: ctx.editRec ? ctx.editRec.createdAt : L.nowISO(),
          linkedScheduleId: ctx.editRec ? ctx.editRec.linkedScheduleId : null,
          photo: ctx.attachedPhoto
        };

        // 일정 연동 저장 시
        if(syncCalendar){
          L.state.profile.settings = L.state.profile.settings || {};
          L.state.profile.settings.customSchedules = L.state.profile.settings.customSchedules || [];
          var schedList = L.state.profile.settings.customSchedules;

          var existingSched = recObj.linkedScheduleId ? schedList.find(function(c){ return c.id === recObj.linkedScheduleId; }) : null;
          if(existingSched){
            existingSched.title = schedTitle;
            existingSched.date = schedDateVal;
            existingSched.note = '전문 템플릿 [' + tplTitle + '] 기록 연동\r\n' + (memo ? memo + '\r\n' : '') + summaryText;
            existingSched.recordId = recId;
            existingSched.linkUrl = linkUrl;
            existingSched.isTemplateRecord = true;
            existingSched.templateTitle = tplTitle;
          } else {
            var newSched = {
              id: L.uid('sched'),
              title: schedTitle,
              date: schedDateVal,
              note: '전문 템플릿 [' + tplTitle + '] 기록 연동\r\n' + (memo ? memo + '\r\n' : '') + summaryText,
              done: false,
              recordId: recId,
              linkUrl: linkUrl,
              isTemplateRecord: true,
              templateTitle: tplTitle,
              createdAt: L.nowISO()
            };
            schedList.push(newSched);
            recObj.linkedScheduleId = newSched.id;
          }

          var dayKey = schedDateVal.slice(0, 10);
          L.state.calSelectedDate = dayKey;
          L.state.calDate = dayKey;

          // Calendar transmission follows verified device storage below.
        }

        // Cache proTemplateRecords in settings so full metadata is never lost
        L.state.profile.settings = L.state.profile.settings || {};
        L.state.profile.settings.proTemplateRecords = L.state.profile.settings.proTemplateRecords || {};
        L.state.profile.settings.proTemplateRecords[recId] = recObj;

        L.state.profile.records = L.state.profile.records || [];
        if(ctx.isNew){
          var retryIdx = profile.records.findIndex(function(r){ return r.id === recId; });
          if(retryIdx >= 0) profile.records[retryIdx] = recObj; else profile.records.unshift(recObj);
        } else {
          var existIdx = L.state.profile.records.findIndex(function(r){ return r.id === recId; });
          if(existIdx !== -1) L.state.profile.records[existIdx] = recObj;
          else L.state.profile.records.unshift(recObj);
        }

        // 1. Save locally IMMEDIATELY (never loses data even if Supabase is offline/slow)
        var saved = await L.saveProfile({deviceFirst:true, recordId:recId, operation:ctx.isNew ? 'create' : 'update', focus:true});
        if(L.state.profile !== profile) return;
        if(saved.state === 'failed'){ L.toast(message(saved)); return; }
        unlock();
        if(ctx.isNew && !awarded){ L.awardXP(L.XP_RULES.checkin, '전문 템플릿 기록'); awarded = true; recObj.deviceXpAwarded = true; }

        // 🎯 3각 자동 추적 엔진: 목표-일정-맞춤기록 실시간 연동
        L.syncRecordToMatchingGoals(recObj, ctx.curTpl, ctx.columns, validRows);

        // 2. Refresh screens
        L.renderRecordsScreen();
        L.renderGoalsScreen();
        L.renderCalendarScreen();
        L.renderLevelBadge();

        if(!saved.photoStored){
          L.toast(message(saved, '본문을 기록했어요'));
        } else if(ctx.initialDate){
          L.openCalendarDayEditHubModal(ctx.initialDate);
        } else {
          L.closeModal();
        }

        // 3. Sync to Supabase in background
        await L.saveProfile({deviceFirst:true, recordId:recId});
        if(L.state.profile !== profile) return;
        if(syncCalendar && profile.settings.gcalAutoSync && L.isGoogleCalendarConnected()) L.syncAllToGoogleCalendar().catch(function(){});

        // 4. Background Notion Auto-Push if enabled
        if(L.state.profile.settings && L.state.profile.settings.notionAutoPush && (L.state.profile.settings.notionApiKey || L.state.profile.settings.notionWebhookUrl)){
          L.pushRecordToNotion(recObj, ctx.curTpl, ctx.columns, validRows).then(function(res){
            if(res && res.ok){
              console.log('[Notion AutoPush Success]', res.summary);
            }
          }).catch(function(e){
            console.warn('[Notion AutoPush Error]', e);
          });
        }

        if(syncCalendar){
          L.toast(message(saved, '기록 및 [' + schedTitle + '] 기기 일정에 연동했어요'));
        } else {
          L.toast(message(saved, '전문 템플릿 기록을 저장했어요'));
        }
        L.burstConfetti(window.innerWidth/2, window.innerHeight/2);

        if(ctx.isNew && !ctx.deviceFeedbackRequested){
          ctx.deviceFeedbackRequested = true;
          L.renderRecordFeedbackSlot('loading');
          var summaryText = (ctx.curTpl ? ctx.curTpl.title + ': ' : '') + validRows.map(function(r){ return r.filter(Boolean).join(' '); }).join(', ');
          var recGoal = (L.state.profile.goals || []).find(function(g){ return g.category === recObj.category; }) || (L.state.profile.goals && L.state.profile.goals[0]) || { title: '나의 맞춤 템플릿 성장', milestones: [] };
          L.requestAIFeedback(recGoal, summaryText || recObj.text, recObj.theme).then(async function(fb){
            if(L.state.profile !== profile || profile.records.find(function(r){return r.id === recId;}) !== recObj || recObj.text !== fullText) return;
            if(fb){
              recObj.feedback = fb;
              await L.saveProfile({deviceFirst:true, recordId:recId});
              if(L.state.profile !== profile || !global.OurgoalCapabilities.request('storage.device.focused', 'records/pro-record-save')(profile.id, recId)) return;
              L.state.lastCapture = { record: recObj, goal: recGoal, feedback: fb };
              L.renderRecordFeedbackSlot(fb);
              L.renderFeedbackSlot(fb);
              if(L.state.activeTab === 'records') L.renderRecordsScreen();
              if(recGoal && recGoal.milestones && recGoal.milestones.length > 0){
                L.maybeShowGoalUpdateModal(recGoal, fb);
              }
            }
          }).catch(function(err){
            console.warn('[ProTemplateRecord AI feedback error]', err);
          });
        }
        } catch(error){
          L.toast('기록 저장을 마치지 못했어요. 입력은 그대로 남겨 두었어요.');
          console.warn('[ProTemplateRecord save]', error);
        } finally { if(saving) unlock(); }
      }

      var backBtn = ctx.sheet.querySelector('#proRecBackToHubBtn');
      if(backBtn){
        backBtn.onclick = function(){
          ctx.stopSwTimer();
          L.openCalendarDayEditHubModal(ctx.initialDate);
        };
      }
      var cancelBtn = ctx.sheet.querySelector('#proCancelBtn');
      if(cancelBtn){
        cancelBtn.onclick = function(){
          ctx.stopSwTimer();
          if(ctx.initialDate) L.openCalendarDayEditHubModal(ctx.initialDate);
          else L.closeModal();
        };
      }

      ctx.sheet.querySelector('#proGeneralSaveBtn').onclick = function(){ executeSave(false); };
      ctx.sheet.querySelector('#proCalendarSaveBtn').onclick = function(){ executeSave(true); };
  }

  K.bindProRecSave = bindProRecSave;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 시작 · gen-cell-provide.js] 이 세포가 키트에 단 이름을 등록 기관(js/core/cell-registry.js)에 스스로 등록한다 — 대조(compare) 전용, 동작 변화 0. 생성기 산출이므로 손으로 고치지 않는다. ==== */
(function (g) {
  var R = g.OurgoalCellRegistry;
  if (!R) return;
  var K = g.OurgoalRecordsKit;
  if (K) R.provide('records/pro-record-save', {
    bindProRecSave: K.bindProRecSave
  }, { window: [] });
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 끝] ==== */
