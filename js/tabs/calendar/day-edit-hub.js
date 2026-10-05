/**
 * OurGoal Calendar Day Edit Hub Modal (일정 관리 허브 모달)
 *
 * #TASK-ES-456 (인라인 스크립트 세포화: index.html 인라인 IIFE 내 캘린더 날짜 클릭 시 해당 일자 일정 수정/관리 허브 모달 묶음을 옮김, 수정 없음 — 코드 이동 안티그래비티, 검수 Claude)
 *   openCalendarDayEditHubModal (이전 전 main 194ed83 index.html 10753~10928줄)
 *   openCalendarDayEditHubModal = 캘린더 날짜 클릭 시 나타나는 일정 관리 허브 모달창 (일정 수정, 상태 변경 등).
 *
 * 묶음(선두의 구획 주석 포함) 글자 그대로 떼어 바꾼 것은 이름 참조뿐이다(인라인 스코프 이름은 L.<이름>). 버그를 그대로 떼어 고치는 것은 별도 티켓.
 * index.html 의 IIFE 상단 이음매(#TASK-ES-423)가 일정 키트 OurgoalCalendarKit(index.html 안 이름 _calendarKit)에서 같은 이름으로 가져온다(부르는 쪽은 그대로다). window.openCalendarDayEditHubModal 노출은 index.html 원래 자리에 그대로 있다.
 * 지침: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 일정 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCalendarKit = global.OurgoalCalendarKit || {};

  /* ============ 캘린더 날짜 클릭 시 해당 일자 일정 수정/관리 허브 모달 ============ */
  function openCalendarDayEditHubModal(selectedDate){
    var sel = selectedDate || L.state.calSelectedDate || L.isoDate(new Date());
    var itemsByDate = L.calendarItemsByDate();
    var evs = itemsByDate[sel] || [];
    var evsHtml = evs.length ? (
      '<div style="display:flex;flex-direction:column;gap:8px;max-height:260px;overflow-y:auto;margin-bottom:14px;">' +
      evs.map(function(e, idx){
        var timeLabel = (e.date && e.date.indexOf('T') !== -1) ? ('<span class="dday-mini" style="background:var(--surface-2);color:var(--ink);margin-left:4px;">'+e.date.split('T')[1].slice(0,5)+'</span>') : '';
        var notifyBadge = e.notifyEnabled ? ('<span class="sched-notify-badge" style="font-size:.72rem;padding:1px 6px;border-radius:6px;background:rgba(16,185,129,0.12);color:var(--primary,#10b981);font-weight:700;display:inline-flex;align-items:center;gap:2px;white-space:nowrap;">⏰ ' + (e.notifyMinutes === 0 ? '정시 알림' : (e.notifyMinutes || 10) + '분 전') + '</span>') : '';
        var mRec = (e.title || '').match(/#record[=:](\w+)/);
        var targetRecId = e.recordId || (mRec ? mRec[1] : null);
        var tplBtn = targetRecId ? ('<button class="btn btn-ghost btn-sm" data-hubrec="'+targetRecId+'" type="button" style="font-size:.8125rem;padding:2px 6px;color:var(--ink);border-color:var(--rule);">기록 보기</button>') : '';
        var isDone = !!e.done;
        var checkBtn = '<div class="sched-check'+(isDone?' done':'')+'" data-hubtogglesched="'+e.kind+':'+(e.schedId||e.goalId||e.gcalId||'')+':'+(e.msId||'')+':'+(e.taskId||'')+'" style="cursor:pointer;flex:0 0 auto;" title="'+(isDone?'미완료로 변경':'완료로 변경')+'">'+(isDone?'✓':'')+'</div>';
        var goalBadge = (e.linkedGoalTitle || (e.goalTitle && e.goalTitle !== '일반 일정' && e.goalTitle !== '구글 캘린더')) ? ('<span class="sched-goal-badge">🎯 '+L.escapeHtml(e.linkedGoalTitle || e.goalTitle)+'</span>') : '';
        return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;background:var(--card2);border-radius:10px;border:1px solid var(--rule);">' +
          '<div style="display:flex;align-items:flex-start;gap:8px;flex:1;min-width:0;">' +
            checkBtn +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-weight:700;font-size:.875rem;color:var(--ink);display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                '<span class="sched-title'+(isDone?' done-text':'')+'">'+L.escapeHtml(e.title)+'</span>' +
                goalBadge +
                timeLabel +
                notifyBadge +
              '</div>' +
              '<div class="faint" style="font-size:.8125rem;margin-top:2px;">'+L.escapeHtml(e.goalTitle||'일반 일정')+'</div>' +
              (window.OurgoalCalendarAttachment ? window.OurgoalCalendarAttachment.renderHubEventChipsHtml(e) : '') +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:14px;align-items:center;">' +
            tplBtn +
            (e.kind==='custom' ? '<button class="icon-btn" data-hubaddatt="'+(e.schedId||'')+'" type="button" title="참고자료 첨부" style="font-size:.875rem;padding:4px 6px;">📎</button>' : '') +
            (e.kind === 'gcal' && e.htmlLink ? ('<a href="'+L.escapeHtml(e.htmlLink)+'" target="_blank" rel="noopener" class="btn btn-ghost btn-sm" style="font-size:.8125rem;padding:3px 7px;text-decoration:none;border-color:var(--rule);">구글 캘린더 ↗</a>') : ('<button class="icon-btn" data-hubedit="'+idx+'" type="button" title="수정" style="font-size:.875rem;padding:4px 6px;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>')) +
            (e.kind==='custom' ? '<button class="icon-btn" data-hubdel="'+(e.schedId||'')+'" type="button" title="삭제" style="color:var(--brand-strong);font-size:1rem;padding:4px 6px;">×</button>' : '') +
          '</div>' +
        '</div>';
      }).join('') +
      '</div>'
    ) : (
      '<div class="empty-state" style="padding:18px 10px;margin-bottom:14px;"><div class="e-icon"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 9.7h17"/><path d="M8 3.2v3.6M16 3.2v3.6"/></svg></div><p style="margin:4px 0 0;font-size:.875rem;">이 날짜에 등록된 일정이 없습니다.</p></div>'
    );
    var dayRecs = (L.state.profile && L.state.profile.records) ? L.state.profile.records.filter(function(r){
      return (r.startAt || r.createdAt || r.date || '').slice(0, 10) === sel;
    }) : [];
    var photoRec = dayRecs.find(function(r){
      return r.photo || (r.attachments && r.attachments.some(function(a){ return a.type==='image'||(a.url&&a.url.startsWith('data:image')); }));
    });
    var photoDiaryHtml = '';
    if(photoRec){
      var pUrl = photoRec.photo || (photoRec.attachments && photoRec.attachments.find(function(a){ return a.type==='image'||(a.url&&a.url.startsWith('data:image')); }).url);
      photoDiaryHtml = '<div class="cal-day-photo-diary-card" style="margin-bottom:12px;padding:10px;background:var(--surface-2);border-radius:10px;border:1px solid var(--rule);display:flex;gap:10px;align-items:center;">' +
        '<div style="width:56px;height:56px;border-radius:8px;background-image:url(\''+L.escapeHtml(pUrl)+'\');background-size:cover;background-position:center;flex:0 0 56px;border:1px solid var(--rule);"></div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:.75rem;font-weight:700;color:var(--ink-soft);display:flex;align-items:center;gap:4px;"><span>📸 이날의 사진 일기</span></div>' +
          '<div style="font-size:.84rem;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">'+L.escapeHtml(photoRec.text||'사진 기록')+'</div>' +
          (photoRec.feedback ? ('<div style="font-size:.72rem;color:var(--sage);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">✨ AI: '+L.escapeHtml(photoRec.feedback.cheer||photoRec.feedback.analysis||'')+ '</div>') : '') +
        '</div>' +
      '</div>';
    }
    L.openModal(
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;">' +
        '<h3 style="margin:0;">' + sel + ' 일정 관리</h3>' +
        '<span class="faint" style="font-weight:700;font-size:.8125rem;">' + (L.dDay(sel)||'') + '</span>' +
      '</div>' +
      '<p class="faint" style="font-size:.8125rem;margin:0 0 12px;">해당 일자의 일정을 수정하거나 새로운 일정·맞춤기록을 추가하세요.</p>' +
      photoDiaryHtml +
      evsHtml +
      '<div style="margin-bottom:10px;">' +
        '<button class="btn btn-secondary btn-sm cal-day-bg-btn" id="hubDayBgBtn" type="button" style="width:100%;padding:8px 0;font-size:.84rem;display:flex;align-items:center;justify-content:center;gap:6px;background:var(--surface-2);color:var(--ink);border:1px solid var(--rule);border-radius:8px;">' +
          '<span>🖼️ 이날의 배경사진 고르기' + (((L.state.profile && L.state.profile.calendarDayBackgrounds && L.state.profile.calendarDayBackgrounds[sel])) ? ' (설정됨)' : '') + '</span>' +
        '</button>' +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:12px;">' +
        '<button class="btn btn-primary btn-sm" id="hubAddNewBtn" type="button" style="flex:1;padding:8px 0;font-size:.875rem;display:flex;align-items:center;justify-content:center;gap:6px;">' +
          '<span>+ 새 일정 추가</span>' +
        '</button>' +
        '<button class="btn btn-ghost btn-sm" id="hubAddProRecBtn" type="button" style="flex:1;padding:8px 0;font-size:.875rem;display:flex;align-items:center;justify-content:center;gap:6px;color:var(--ink);border-color:var(--rule);">' +
          '<span>맞춤기록 작성</span>' +
        '</button>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost btn-sm" id="hubCloseBtn" type="button" style="width:100%;">닫기</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#hubCloseBtn').onclick = L.closeModal;
        var hubBgBtn = sheet.querySelector('#hubDayBgBtn');
        if(hubBgBtn){
          hubBgBtn.onclick = function(){
            L.openCalendarDayBgPickerModal(sel, true);
          };
        }
        sheet.querySelectorAll('[data-hubtogglesched]').forEach(function(chk){
          chk.onclick = async function(ev){
            ev.stopPropagation();
            var parts = chk.dataset.hubtogglesched.split(':');
            var kind = parts[0];
            var schedOrGoalId = parts[1];
            var msId = parts[2] || null;
            var taskId = parts[3] || null;
            await L.toggleScheduleDone((kind==='custom'||kind==='gcal')?schedOrGoalId:null, kind, (kind!=='custom'&&kind!=='gcal')?schedOrGoalId:null, msId, taskId);
            openCalendarDayEditHubModal(sel);
          };
        });
        sheet.querySelector('#hubAddNewBtn').onclick = function(){
          L.openCalendarManualEditModal(sel, null);
        };
        var proRecBtn = sheet.querySelector('#hubAddProRecBtn');
        if(proRecBtn){
          proRecBtn.onclick = function(){
            L.openProTemplateRecordModal(null, null, sel);
          };
        }
        sheet.querySelectorAll('[data-hubrec]').forEach(function(btn){
          btn.onclick = function(){
            var rid = btn.dataset.hubrec;
            var rec = (L.state.profile.records || []).find(function(r){ return r.id === rid; });
            if(rec){
              L.openTemplateRecordDetailModal(rec);
            }
          };
        });
        sheet.querySelectorAll('[data-hubedit]').forEach(function(btn){
          btn.onclick = function(){
            var idx = parseInt(btn.dataset.hubedit, 10);
            var ev = evs[idx];
            if(!ev) return;
            var targetEvent = null;
            if(ev.kind==='custom'){
              targetEvent = (L.state.profile.settings.customSchedules||[]).find(function(c){ return c.id===ev.schedId; });
            } else if(ev.kind==='goal'){
              targetEvent = L.state.profile.goals.find(function(g){ return g.id===ev.goalId; });
            } else if(ev.kind==='ms'){
              var g = L.state.profile.goals.find(function(g){ return g.id===ev.goalId; });
              targetEvent = g ? (g.milestones||[]).find(function(m){ return m.id===ev.msId; }) : null;
            } else if(ev.kind==='task'){
              var g = L.state.profile.goals.find(function(g){ return g.id===ev.goalId; });
              if(g && g.milestones){
                for(var mi=0; mi<g.milestones.length; mi++){
                  var tk = (g.milestones[mi].tasks||[]).find(function(t){ return t.id===ev.taskId; });
                  if(tk){ targetEvent = tk; break; }
                }
              }
            } else if(ev.kind==='gcal'){
              targetEvent = (L.state.gcalEventsCache||[]).find(function(c){ return String(c.id)===String(ev.schedId||ev.gcalId||ev.id); }) || ev;
            } else if(ev.kind==='team_goal'){
              targetEvent = ev;
            }
            L.openCalendarManualEditModal(sel, targetEvent, ev.kind);
          };
        });
        sheet.querySelectorAll('[data-hubdel]').forEach(function(btn){
          btn.onclick = async function(){
            var sid = btn.dataset.hubdel;
            if(!(await OurgoalCapabilities.call('ui.confirm', '이 일정을 휴지통으로 이동할까요?\n7일간 보관되며 언제든 원복할 수 있습니다.'))) return;
            var targetSched = (L.state.profile.settings.customSchedules || []).find(function(c){ return c.id === sid; });
            if(targetSched){
              await L.moveToTrash('schedule', sid, targetSched, 'in_app', targetSched.title);
              openCalendarDayEditHubModal(sel);
            }
          };
        });
        sheet.querySelectorAll('[data-hubaddatt]').forEach(function(btn){
          btn.onclick = function(){
            var sid = btn.dataset.hubaddatt;
            if(window.OurgoalCalendarAttachment && typeof window.OurgoalCalendarAttachment.openAttachmentModal === 'function'){
              window.OurgoalCalendarAttachment.openAttachmentModal(sid, sel);
            }
          };
        });
        if(window.OurgoalCalendarAttachment && typeof window.OurgoalCalendarAttachment.wireHubModalAttachments === 'function'){
          window.OurgoalCalendarAttachment.wireHubModalAttachments(sheet, sel);
        }
        L.wireAttachmentChipClicks(sheet);
      }
    );
  }

  K.openCalendarDayEditHubModal = openCalendarDayEditHubModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
