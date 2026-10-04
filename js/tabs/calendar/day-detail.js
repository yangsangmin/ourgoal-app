/**
 * OurGoal Calendar Day Detail Renderer (일정 탭 선택한 날의 상세 목록 렌더)
 *
 * #TASK-ES-360 (일정 탭 세포 이전): index.html 인라인 IIFE 의 renderCalDayDetail(이전 전 12157~12296줄)을 동작 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다.
 * renderCalendarScreen(js/tabs/calendar/render.js)이 K.renderCalDayDetail 로 부른다.
 * (소블록 sub-day-detail.js 가 찾는 window.renderCalendarDayDetail 과는 다른 이름이다 — 이전 전과 같다.)
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 일정 키트: 일정 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCalendarKit = global.OurgoalCalendarKit || {};

  function renderCalDayDetail(itemsByDate){
    var sel = L.state.calSelectedDate || L.isoDate(new Date());
    var evs = (itemsByDate || L.calendarItemsByDate())[sel] || [];
    var wrap = document.getElementById('calDayDetail');
    wrap.innerHTML =
      '<div class="toss-calendar-hero-card">' +
        '<div class="card-title-row" style="margin-bottom:12px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;">' +
          '<div style="display:flex;align-items:center;gap:8px;white-space:nowrap;">' +
            '<span style="font-size:1.2rem;">📅</span>' +
            '<h3 style="margin:0;font-size:1.05rem;font-weight:800;color:var(--ink);white-space:nowrap;">'+sel+'</h3>' +
            '<span class="dday-pill" style="background:var(--red-soft);color:var(--brand-strong);font-weight:700;white-space:nowrap;">'+(L.dDay(sel)||'오늘')+'</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
            '<button class="btn btn-secondary btn-sm cal-day-bg-btn" id="calPickDayBgBtn" type="button" style="font-size:.78rem;padding:3px 8px;border-radius:6px;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;">🖼️ 배경' + (((L.state.profile && L.state.profile.calendarDayBackgrounds && L.state.profile.calendarDayBackgrounds[sel])) ? ' (설정됨)' : '') + '</button>' +
            '<button class="btn btn-ghost btn-sm" id="calOpenHubBtn" type="button" style="font-size:.78rem;padding:3px 8px;color:var(--ink);border-color:var(--rule);white-space:nowrap;">일정 관리</button>' +
            '<button class="btn btn-primary btn-sm" id="calAddManualBtn" type="button" style="font-size:.78rem;padding:3px 9px;font-weight:700;white-space:nowrap;">+ 일정 추가</button>' +
          '</div>' +
        '</div>' +
        (evs.length ? '<div class="ms-list" style="display:flex;flex-direction:column;gap:6px;">'+evs.map(function(e, evIdx){
          var timeLabel = (e.date && e.date.indexOf('T') !== -1) ? ('<span class="dday-mini" style="background:var(--surface-2);color:var(--ink);margin-left:4px;">'+e.date.split('T')[1].slice(0,5)+'</span>') : '';
          var notifyBadge = e.notifyEnabled ? ('<span class="sched-notify-badge" style="font-size:.72rem;padding:1px 6px;border-radius:6px;background:rgba(16,185,129,0.12);color:var(--primary,#10b981);font-weight:700;display:inline-flex;align-items:center;gap:2px;white-space:nowrap;">⏰ ' + (e.notifyMinutes === 0 ? '정시 알림' : (e.notifyMinutes || 10) + '분 전') + '</span>') : '';
          var attChips = (e.attachments && e.attachments.length) ? ('<div style="margin-top:4px;">'+L.renderAttachmentChipsHtml(e.attachments, e.kind, e.msId||e.goalId||e.schedId, e.goalId)+'</div>') : '';
          var mRec = (e.title || '').match(/#record[=:](\w+)/);
          var targetRecId = e.recordId || (mRec ? mRec[1] : null);
          var tplLinkChip = targetRecId ? ('<button class="dday-pill" data-calviewrec="'+targetRecId+'" type="button" style="cursor:pointer;background:var(--surface-2);color:var(--ink);border:1px solid var(--rule);font-size:.8125rem;padding:2px 6px;margin-left:4px;">기록 보기</button>') : '';
          var goalBadge = (e.linkedGoalTitle || (e.goalTitle && e.goalTitle !== '일반 일정' && e.goalTitle !== '구글 캘린더')) ? ('<span class="sched-goal-badge" style="font-size:.72rem;padding:1px 6px;">🎯 '+L.escapeHtml(e.linkedGoalTitle || e.goalTitle)+'</span>') : '';
          return '<div class="ms-row toss-timeline-card" style="padding:10px 12px;border-radius:14px;background:var(--card);border:1px solid var(--rule);margin-bottom:0;" '+(e.goalId?'data-calgoto="'+e.goalId+'"':'')+(targetRecId?' data-calrecid="'+targetRecId+'" style="cursor:pointer;"':'')+'>' +
            '<div class="ms-main" style="align-items:flex-start;gap:8px;">' +
              '<div class="sched-check'+(e.done?' done':'')+'" data-detailtogglesched="'+e.kind+':'+(e.schedId||e.goalId||e.gcalId||'')+':'+(e.msId||'')+':'+(e.taskId||'')+'" style="cursor:pointer;flex:0 0 auto;margin-top:2px;width:22px;height:22px;border-radius:7px;" title="'+(e.done?'미완료로 변경':'완료로 변경')+'">'+(e.done?'✓':'')+'</div>' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                  '<span class="ms-title'+(e.done?' done-text':'')+'" style="font-size:.9rem;font-weight:700;">'+L.escapeHtml(e.title)+'</span>' +
                  goalBadge +
                  timeLabel +
                  notifyBadge +
                  tplLinkChip +
                '</div>' +
                '<div class="faint" style="font-size:.78rem;margin-top:2px;">'+L.escapeHtml(e.goalTitle||'일반 일정')+'</div>' +
                attChips +
              '</div>' +
              '<button class="icon-btn" data-caledit="'+e.kind+'" data-schedid="'+(e.schedId||e.gcalId||'')+'" data-calgid="'+(e.goalId||'')+'" data-calmid="'+(e.msId||'')+'" data-caltid="'+(e.taskId||'')+'" type="button" aria-label="일정 편집" title="수동 편집" style="font-size:.8125rem;padding:2px 4px;margin-right:2px;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>' +
              (L.calendarAvailable(L.GOOGLE_OAUTH_CLIENT_ID, L.state.profile.settings) ? '<button class="icon-btn" data-calsync="'+e.kind+'" data-calsyncgid="'+(e.goalId||'')+'" data-calsyncmid="'+(e.msId||'')+'" data-calsynctid="'+(e.taskId||'')+'" data-calsyncsched="'+(e.schedId||'')+'" type="button" aria-label="일정 반영" title="구글 캘린더에 일정 반영"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 9.7h17"/><path d="M8 3.2v3.6M16 3.2v3.6"/></svg></button>' : '') +
            '</div>' +
          '</div>';
        }).join('')+'</div>'
        : '<div class="empty-state" style="padding:20px 10px;text-align:center;"><div class="e-icon" style="font-size:2rem;margin-bottom:6px;">⏰</div><p style="margin:0 0 10px;font-size:.875rem;color:var(--ink-soft);">이 날은 예정된 일정이 없어요.</p><button class="btn btn-ghost btn-sm" id="calEmptyAddBtn" type="button" style="font-size:.8125rem;padding:4px 10px;">+ 이 날짜에 일정 추가</button></div>') +
      '</div>';
    var detailBgBtn = wrap.querySelector('#calPickDayBgBtn');
    if(detailBgBtn){
      detailBgBtn.addEventListener('click', function(){
        L.openCalendarDayBgPickerModal(sel, false);
      });
    }
    var hubBtn = wrap.querySelector('#calOpenHubBtn');
    if(hubBtn){
      hubBtn.addEventListener('click', function(){
        L.openCalendarDayEditHubModal(sel);
      });
    }
    var addBtn = wrap.querySelector('#calAddManualBtn') || wrap.querySelector('#calEmptyAddBtn');
    if(addBtn){
      addBtn.addEventListener('click', function(){
        L.openCalendarManualEditModal(sel, null);
      });
    }
    wrap.querySelectorAll('[data-detailtogglesched]').forEach(function(chk){
      chk.addEventListener('click', async function(ev){
        ev.stopPropagation();
        var parts = chk.dataset.detailtogglesched.split(':');
        var kind = parts[0];
        var schedOrGoalId = parts[1];
        var msId = parts[2] || null;
        var taskId = parts[3] || null;
        await L.toggleScheduleDone((kind==='custom'||kind==='gcal')?schedOrGoalId:null, kind, (kind!=='custom'&&kind!=='gcal')?schedOrGoalId:null, msId, taskId);
      });
    });
    wrap.querySelectorAll('[data-calviewrec]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var rid = btn.dataset.calviewrec;
        var rec = (L.state.profile.records || []).find(function(r){ return r.id === rid; });
        if(rec){
          L.openTemplateRecordDetailModal(rec);
        } else {
          L.toast('연동된 기록을 찾을 수 없습니다');
        }
      });
    });
    wrap.querySelectorAll('[data-calrecid]').forEach(function(row){
      row.addEventListener('click', function(e){
        if(e.target.closest('[data-calsync]') || e.target.closest('[data-caledit]') || e.target.closest('.att-chip') || e.target.closest('[data-calviewrec]')) return;
        var rid = row.dataset.calrecid;
        var rec = (L.state.profile.records || []).find(function(r){ return r.id === rid; });
        if(rec){
          L.openTemplateRecordDetailModal(rec);
        }
      });
    });
    wrap.querySelectorAll('[data-caledit]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var k = btn.dataset.caledit;
        var sid = btn.dataset.schedid;
        var gid = btn.dataset.calgid;
        var mid = btn.dataset.calmid;
        var tid = btn.dataset.caltid;
        var targetEvent = null;
        if(k==='custom'){
          targetEvent = (L.state.profile.settings.customSchedules||[]).find(function(c){ return String(c.id)===String(sid); });
        } else if(k==='goal'){
          targetEvent = (L.state.profile.goals||[]).find(function(g){ return String(g.id)===String(gid); });
        } else if(k==='ms'){
          var g = (L.state.profile.goals||[]).find(function(g){ return String(g.id)===String(gid); });
          targetEvent = g ? (g.milestones||[]).find(function(m){ return String(m.id)===String(mid); }) : null;
        } else if(k==='task'){
          var g = (L.state.profile.goals||[]).find(function(g){ return String(g.id)===String(gid); });
          var m = g ? (g.milestones||[]).find(function(m){ return String(m.id)===String(mid); }) : null;
          targetEvent = m ? (m.tasks||[]).find(function(t){ return String(t.id)===String(tid); }) : null;
        } else if(k==='gcal'){
          targetEvent = (L.state.gcalEventsCache||[]).find(function(c){ return String(c.id)===String(sid); }) ||
                        (evs||[]).find(function(c){ return c.kind==='gcal' && String(c.schedId||c.gcalId||c.id)===String(sid); });
        }
        L.openCalendarManualEditModal(sel, targetEvent, k);
      });
    });
    wrap.querySelectorAll('[data-calgoto]').forEach(function(row){
      row.addEventListener('click', function(e){
        if(e.target.closest('[data-detailtogglesched]') || e.target.closest('.sched-check') || e.target.closest('[data-calsync]') || e.target.closest('[data-caledit]') || e.target.closest('.att-chip') || e.target.closest('[data-calviewrec]')) return;
        L.state.activeGoalId = row.dataset.calgoto;
        L.setTab('goals');
      });
    });
    wrap.querySelectorAll('[data-calsync]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        L.quickSyncToCalendar(btn.dataset.calsync, btn.dataset.calsyncgid, btn.dataset.calsyncmid||null, btn.dataset.calsynctid||null, btn.dataset.calsyncsched||null);
      });
    });
    L.wireAttachmentChipClicks(wrap);
  }

  K.renderCalDayDetail = renderCalDayDetail;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
