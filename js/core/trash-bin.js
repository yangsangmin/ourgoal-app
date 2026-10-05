/**
 * OurGoal Trash Bin (기관 — 전역 7일 유예 통합 휴지통)
 *
 * 휴지통 목록·7일 지난 항목 자동 비우기·휴지통으로 옮기기·되살리기·영구 삭제·비우기·되돌리기 토스트·휴지통 창(#TASK-ES-153).
 * #TASK-ES-482(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 6414~6422 · 6423~6436 · 6437~6497 · 6498~6558 · 6559~6571 · 6572~6583 · 6584~6601 · 6602~6720줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 6414~6422줄(#TASK-ES-482 생성기 표지) ---- */
  function getTrashList(){
    if(!L.state.profile) return [];
    if(Array.isArray(L.state.profile.trash)) return L.state.profile.trash;
    var uidVal = L.state.profile.id || 'guest';
    var cached = [];
    try { cached = JSON.parse(localStorage.getItem('ourgoal_trash_backup_' + uidVal) || '[]'); } catch(e){}
    L.state.profile.trash = Array.isArray(cached) ? cached : [];
    return L.state.profile.trash;
  }
  /* ---- 이전 전 index.html 6423~6436줄(#TASK-ES-482 생성기 표지) ---- */

  function autoPurgeExpiredTrash(){
    if(!L.state.profile || !Array.isArray(L.state.profile.trash)) return;
    var now = Date.now();
    var beforeLen = L.state.profile.trash.length;
    L.state.profile.trash = L.state.profile.trash.filter(function(item){
      return item && item.expiresAt && item.expiresAt > now;
    });
    if(L.state.profile.trash.length !== beforeLen){
      var uidVal = L.state.profile.id || 'guest';
      try { localStorage.setItem('ourgoal_trash_backup_' + uidVal, JSON.stringify(L.state.profile.trash)); } catch(e){}
      if(typeof L.saveProfile === 'function') L.saveProfile().catch(function(){});
    }
  }
  /* ---- 이전 전 index.html 6437~6497줄(#TASK-ES-482 생성기 표지) ---- */

  async function moveToTrash(entityType, entityId, payload, source, title){
    if(!L.state.profile) return;
    autoPurgeExpiredTrash();
    var trash = getTrashList();
    var itemTitle = title || (payload && (payload.title || payload.text)) || '항목';
    var expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);

    var snapshot = null;
    try { snapshot = JSON.parse(JSON.stringify(payload)); } catch(e){ snapshot = payload; }

    var trashItem = {
      id: L.uid('trash'),
      originalId: entityId,
      entityType: entityType,
      title: itemTitle,
      payload: snapshot,
      deletedAt: Date.now(),
      expiresAt: expiresAt,
      source: source || 'in_app'
    };

    trash.unshift(trashItem);
    if(trash.length > 100) L.state.profile.trash = trash.slice(0, 100);

    if(entityType === 'goal'){
      L.state.profile.goals = (L.state.profile.goals || []).filter(function(g){ return g.id !== entityId; });
      if(L.state.activeGoalId === entityId) L.state.activeGoalId = null;
      var goal = { id: entityId };
      try { await L.sb.from('goals').update({ deleted_at: new Date().toISOString() }).eq('id', goal.id).eq('user_id', L.state.profile.id); } catch(e){}
    } else if(entityType === 'schedule'){
      L.state.profile.settings = L.state.profile.settings || {};
      L.state.profile.settings.customSchedules = (L.state.profile.settings.customSchedules || []).filter(function(c){ return c.id !== entityId; });
    } else if(entityType === 'record'){
      L.state.profile.records = (L.state.profile.records || []).filter(function(r){ return r.id !== entityId; });
      if(payload && payload.linkedScheduleId && L.state.profile.settings && L.state.profile.settings.customSchedules){
        L.state.profile.settings.customSchedules = L.state.profile.settings.customSchedules.filter(function(c){
          return c.id !== payload.linkedScheduleId && c.recordId !== entityId;
        });
      }
      var id = entityId;
      try { await L.sb.from('checkins').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('user_id', L.state.profile.id); } catch(e){}
    } else if(entityType === 'gcal'){
      if(Array.isArray(L.state.gcalEventsCache)){
        L.state.gcalEventsCache = L.state.gcalEventsCache.filter(function(e){ return e.id !== entityId; });
        try { localStorage.setItem(L.gcalEventsKey(), JSON.stringify(L.state.gcalEventsCache)); } catch(e){}
      }
    }

    var uidVal = L.state.profile.id || 'guest';
    try { localStorage.setItem('ourgoal_trash_backup_' + uidVal, JSON.stringify(L.state.profile.trash)); } catch(e){}
    await L.saveProfile();

    if(typeof L.renderHome === 'function') L.renderHome();
    if(typeof L.renderRecordsScreen === 'function') L.renderRecordsScreen();
    if(typeof renderStatsScreen === 'function') renderStatsScreen();
    if(typeof L.renderCalendarScreen === 'function') L.renderCalendarScreen();

    toastWithTrashUndo('🗑️ "' + L.escapeHtml(itemTitle) + '" 항목을 휴지통으로 이동했어요 (7일간 보관)', trashItem.id);
    return trashItem;
  }
  /* ---- 이전 전 index.html 6498~6558줄(#TASK-ES-482 생성기 표지) ---- */

  async function restoreFromTrash(trashId){
    if(!L.state.profile) return;
    var trash = getTrashList();
    var idx = trash.findIndex(function(x){ return x.id === trashId; });
    if(idx === -1){ L.toast('복원할 항목을 찾을 수 없습니다.'); return; }
    var item = trash[idx];
    var payload = item.payload;

    if(item.entityType === 'goal'){
      payload.deleted_at = null;
      L.state.profile.goals = L.state.profile.goals || [];
      if(!L.state.profile.goals.some(function(g){ return g.id === payload.id; })){
        L.state.profile.goals.push(payload);
      }
      try { await L.sb.from('goals').update({ deleted_at: null }).eq('id', payload.id).eq('user_id', L.state.profile.id); } catch(e){}
    } else if(item.entityType === 'schedule'){
      L.state.profile.settings = L.state.profile.settings || {};
      L.state.profile.settings.customSchedules = L.state.profile.settings.customSchedules || [];
      if(payload.linkedGoalId){
        var goalExists = (L.state.profile.goals || []).some(function(g){ return g.id === payload.linkedGoalId; });
        if(!goalExists){
          payload.linkedGoalId = null;
          payload.linkedGoalTitle = null;
        }
      }
      if(!L.state.profile.settings.customSchedules.some(function(c){ return c.id === payload.id; })){
        L.state.profile.settings.customSchedules.push(payload);
      }
      if(L.isGoogleCalendarConnected()){
        L.syncAllToGoogleCalendar(false).catch(function(){});
      }
    } else if(item.entityType === 'record'){
      payload.deleted_at = null;
      L.state.profile.records = L.state.profile.records || [];
      if(!L.state.profile.records.some(function(r){ return r.id === payload.id; })){
        L.state.profile.records.unshift(payload);
      }
      try { await L.sb.from('checkins').update({ deleted_at: null }).eq('id', payload.id).eq('user_id', L.state.profile.id); } catch(e){}
    } else if(item.entityType === 'gcal'){
      L.state.gcalEventsCache = L.state.gcalEventsCache || [];
      if(!L.state.gcalEventsCache.some(function(e){ return e.id === payload.id; })){
        L.state.gcalEventsCache.push(payload);
      }
      if(L.isGoogleCalendarConnected()){
        L.syncAllToGoogleCalendar(false).catch(function(){});
      }
    }

    trash.splice(idx, 1);
    var uidVal = L.state.profile.id || 'guest';
    try { localStorage.setItem('ourgoal_trash_backup_' + uidVal, JSON.stringify(trash)); } catch(e){}
    await L.saveProfile();

    if(typeof L.renderHome === 'function') L.renderHome();
    if(typeof L.renderRecordsScreen === 'function') L.renderRecordsScreen();
    if(typeof renderStatsScreen === 'function') renderStatsScreen();
    if(typeof L.renderCalendarScreen === 'function') L.renderCalendarScreen();

    L.toast('✨ "' + L.escapeHtml(item.title) + '" 항목을 원래 위치로 원복했어요!');
  }
  /* ---- 이전 전 index.html 6559~6571줄(#TASK-ES-482 생성기 표지) ---- */

  async function permanentDeleteFromTrash(trashId){
    if(!L.state.profile) return;
    var trash = getTrashList();
    var item = trash.find(function(x){ return x.id === trashId; });
    if(!item) return;
    if(!(await OurgoalCapabilities.call('ui.confirm', '"' + item.title + '" 항목을 영구 삭제할까요?\n더 이상 복구할 수 없습니다.'))) return;
    L.state.profile.trash = trash.filter(function(x){ return x.id !== trashId; });
    var uidVal = L.state.profile.id || 'guest';
    try { localStorage.setItem('ourgoal_trash_backup_' + uidVal, JSON.stringify(L.state.profile.trash)); } catch(e){}
    await L.saveProfile();
    L.toast('항목을 완전히 영구 삭제했습니다');
  }
  /* ---- 이전 전 index.html 6572~6583줄(#TASK-ES-482 생성기 표지) ---- */

  async function emptyTrash(){
    if(!L.state.profile) return;
    var trash = getTrashList();
    if(!trash.length){ L.toast('휴지통이 이미 비어 있습니다'); return; }
    if(!(await OurgoalCapabilities.call('ui.confirm', '휴지통을 완전히 비울까요?\n보관 중인 ' + trash.length + '개 항목이 모두 영구 삭제되며 복구할 수 없습니다.'))) return;
    L.state.profile.trash = [];
    var uidVal = L.state.profile.id || 'guest';
    try { localStorage.setItem('ourgoal_trash_backup_' + uidVal, JSON.stringify([])); } catch(e){}
    await L.saveProfile();
    L.toast('휴지통을 완전히 비웠습니다');
  }
  /* ---- 이전 전 index.html 6584~6601줄(#TASK-ES-482 생성기 표지) ---- */

  function toastWithTrashUndo(msg, trashId){
    var prev = document.getElementById('trashUndoToast');
    if(prev) prev.remove();
    var bar = document.createElement('div');
    bar.id = 'trashUndoToast';
    bar.style.cssText = 'position:fixed;bottom:76px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:10px 16px;border-radius:24px;font-size:.875rem;font-weight:700;display:flex;align-items:center;gap:12px;box-shadow:0 8px 24px rgba(0,0,0,.28);z-index:99999;max-width:92vw;pointer-events:none;';
    bar.innerHTML = '<span>' + msg + '</span><button type="button" id="btnTrashUndoAction" style="background:var(--brand);color:#fff;border:none;padding:4px 10px;border-radius:12px;font-size:.8125rem;font-weight:700;cursor:pointer;flex:0 0 auto;pointer-events:auto;">실행 취소</button>';
    document.body.appendChild(bar);
    var uBtn = bar.querySelector('#btnTrashUndoAction');
    if(uBtn){
      uBtn.onclick = async function(){
        bar.remove();
        await restoreFromTrash(trashId);
      };
    }
    setTimeout(function(){ if(bar.parentNode) bar.remove(); }, 6000);
  }
  /* ---- 이전 전 index.html 6602~6720줄(#TASK-ES-482 생성기 표지) ---- */

  function openTrashModal(){
    autoPurgeExpiredTrash();
    var trash = getTrashList();
    var activeFilter = 'all';

    function renderModalContent(filter){
      activeFilter = filter || activeFilter;
      var filtered = trash.filter(function(it){
        if(activeFilter === 'all') return true;
        return it.entityType === activeFilter;
      });

      var typeIcon = function(t){
        if(t === 'goal') return '🎯 목표';
        if(t === 'schedule') return '📅 일정';
        if(t === 'record') return '📝 기록';
        if(t === 'gcal') return '🗓️ 구글';
        return '📦 항목';
      };

      var listHtml = filtered.length ? (
        '<div style="display:flex;flex-direction:column;gap:8px;max-height:320px;overflow-y:auto;margin:12px 0;">' +
        filtered.map(function(item){
          var remainingDays = Math.max(1, Math.ceil((item.expiresAt - Date.now()) / (86400000)));
          var dDayText = (remainingDays <= 1) ? '<span style="color:var(--brand-strong);font-weight:700;font-size:.75rem;">오늘 자동삭제</span>' : ('<span class="dday-mini">D-' + remainingDays + '</span>');
          var delDateStr = new Date(item.deletedAt).toLocaleDateString('ko-KR', { month:'short', day:'numeric' });
          return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:var(--card2);border:1px solid var(--rule);border-radius:12px;">' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;flex-wrap:wrap;">' +
                '<span class="sched-goal-badge" style="font-size:.75rem;padding:1px 6px;">' + typeIcon(item.entityType) + '</span>' +
                dDayText +
                '<span class="faint" style="font-size:.75rem;">(' + delDateStr + ' 삭제)</span>' +
              '</div>' +
              '<div style="font-weight:700;font-size:.875rem;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
                L.escapeHtml(item.title) +
              '</div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;flex:0 0 auto;">' +
              '<button class="btn btn-primary btn-sm" data-trashrestore="' + item.id + '" type="button" style="font-size:.8125rem;padding:4px 8px;">원복</button>' +
              '<button class="icon-btn" data-trashdel="' + item.id + '" type="button" title="영구 삭제" style="color:var(--brand-strong);font-size:1rem;padding:4px 6px;">×</button>' +
            '</div>' +
          '</div>';
        }).join('') +
        '</div>'
      ) : (
        '<div class="empty-state" style="padding:24px 10px;margin:14px 0;">' +
          '<div class="e-icon">🗑️</div>' +
          '<p style="margin:4px 0 0;font-size:.875rem;font-weight:700;">휴지통이 비어 있습니다</p>' +
          '<p class="faint" style="margin:2px 0 0;font-size:.8125rem;">삭제된 목표, 일정, 기록은 7일간 안전하게 보관됩니다.</p>' +
        '</div>'
      );

      return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">' +
        '<h3 style="margin:0;display:flex;align-items:center;gap:6px;"><span>🗑️ 휴지통</span> <span class="faint" style="font-size:.875rem;font-weight:400;">(' + trash.length + '개 보관 중)</span></h3>' +
        (trash.length ? '<button class="btn btn-ghost btn-sm" id="btnEmptyTrashAll" type="button" style="color:var(--brand-strong);font-size:.8125rem;padding:3px 8px;border-color:var(--rule);">휴지통 비우기</button>' : '') +
      '</div>' +
      '<p class="faint" style="font-size:.8125rem;margin:0 0 10px;">삭제된 항목은 7일 후 완전히 자동 삭제됩니다. 언제든 원래 위치로 원복할 수 있습니다.</p>' +
      '<div class="format-toggle" id="trashFilterWrap" style="margin-bottom:10px;">' +
        '<div class="format-opt' + (activeFilter==='all'?' active':'') + '" data-trashfilt="all">전체 (' + trash.length + ')</div>' +
        '<div class="format-opt' + (activeFilter==='goal'?' active':'') + '" data-trashfilt="goal">🎯 목표</div>' +
        '<div class="format-opt' + (activeFilter==='schedule'?' active':'') + '" data-trashfilt="schedule">📅 일정</div>' +
        '<div class="format-opt' + (activeFilter==='record'?' active':'') + '" data-trashfilt="record">📝 기록</div>' +
        '<div class="format-opt' + (activeFilter==='gcal'?' active':'') + '" data-trashfilt="gcal">🗓️ 구글</div>' +
      '</div>' +
      '<div id="trashListContentSlot">' + listHtml + '</div>' +
      '<div class="modal-actions" style="margin-top:12px;">' +
        '<button class="btn btn-ghost btn-sm" id="trashCloseBtn" type="button" style="width:100%;">닫기</button>' +
      '</div>';
    }

    L.openModal(renderModalContent('all'), function(sheet){
      function bindTrashEvents(){
        var closeBtn = sheet.querySelector('#trashCloseBtn');
        if(closeBtn) closeBtn.onclick = L.closeModal;

        var emptyBtn = sheet.querySelector('#btnEmptyTrashAll');
        if(emptyBtn){
          emptyBtn.onclick = async function(){
            await emptyTrash();
            trash = getTrashList();
            sheet.innerHTML = renderModalContent(activeFilter);
            bindTrashEvents();
          };
        }

        sheet.querySelectorAll('[data-trashfilt]').forEach(function(opt){
          opt.onclick = function(){
            var f = opt.dataset.trashfilt;
            sheet.innerHTML = renderModalContent(f);
            bindTrashEvents();
          };
        });

        sheet.querySelectorAll('[data-trashrestore]').forEach(function(btn){
          btn.onclick = async function(e){
            e.stopPropagation();
            var tid = btn.dataset.trashrestore;
            await restoreFromTrash(tid);
            trash = getTrashList();
            sheet.innerHTML = renderModalContent(activeFilter);
            bindTrashEvents();
          };
        });

        sheet.querySelectorAll('[data-trashdel]').forEach(function(btn){
          btn.onclick = async function(e){
            e.stopPropagation();
            var tid = btn.dataset.trashdel;
            await permanentDeleteFromTrash(tid);
            trash = getTrashList();
            sheet.innerHTML = renderModalContent(activeFilter);
            bindTrashEvents();
          };
        });
      }
      bindTrashEvents();
    });
  }

  K.getTrashList = getTrashList;
  K.autoPurgeExpiredTrash = autoPurgeExpiredTrash;
  K.moveToTrash = moveToTrash;
  K.restoreFromTrash = restoreFromTrash;
  K.permanentDeleteFromTrash = permanentDeleteFromTrash;
  K.emptyTrash = emptyTrash;
  K.toastWithTrashUndo = toastWithTrashUndo;
  K.openTrashModal = openTrashModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
