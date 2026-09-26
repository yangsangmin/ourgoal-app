/* ==============================================================================
 * OurGoal Calendar Attachment System (js/calendar-attachment.js)
 * [#TASK-ES-096] 캘린더 일정(customSchedules) 참고자료(유튜브, 이미지, 메모, 웹링크) 첨부·조회·삭제 시스템
 * ============================================================================== */
(function(window){
  'use strict';

  var OurgoalCalendarAttachment = {
    /**
     * 일정 등록/수정 모달용 참고자료 섹션 HTML 생성
     * @param {Array} attachments
     * @returns {string} HTML string
     */
    renderSectionHtml: function(attachments){
      attachments = Array.isArray(attachments) ? attachments : [];
      var chipsHtml = attachments.length
        ? '<div class="att-chips-wrap" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">' +
            attachments.map(function(att, idx){
              var icon = att.type === 'video' ? '🎥' : (att.type === 'image' ? '🖼️' : (att.type === 'text' ? '📝' : '🔗'));
              var typeClass = 'type-' + (att.type || 'link');
              var safeTitle = (att.title || '참고자료').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
              return '<span class="att-chip att-chip-rich ' + typeClass + '" data-caldraftatt="' + idx + '" title="' + safeTitle + '" style="cursor:pointer;">' +
                '<span style="font-size:.875rem;">' + icon + '</span> ' +
                '<span style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + safeTitle + '</span>' +
              '</span>';
            }).join('') +
          '</div>'
        : '<p class="faint" style="font-size:.8125rem;margin:4px 0 0;">첨부된 참고자료가 없습니다. (+ 참고자료 첨부 버튼으로 등록해보세요)</p>';

      return '<div class="field" style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--rule);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">' +
          '<label style="font-size:.8125rem;font-weight:700;margin:0;">참고자료 (영상, 이미지, 메모, 링크)</label>' +
          '<button class="btn btn-ghost btn-sm" id="calEditAddAttBtn" type="button" style="font-size:.75rem;padding:2px 8px;border:1px solid var(--rule);color:var(--ink);">+ 참고자료 첨부</button>' +
        '</div>' +
        '<div id="calEditAttListWrap">' + chipsHtml + '</div>' +
      '</div>';
    },

    /**
     * 일정 편집 모달 내 첨부 버튼 및 칩 리스너 바인딩
     */
    wireEditModalAttachments: function(sheet, getContext, onAttachmentsChanged){
      if(!sheet) return;
      var addBtn = sheet.querySelector('#calEditAddAttBtn');
      if(addBtn){
        addBtn.onclick = function(e){
          e.stopPropagation();
          var ctx = typeof getContext === 'function' ? getContext() : {};
          var dummyTarget = { attachments: [].concat(ctx.attachments || []) };
          if(typeof window.openAddAttachmentModal === 'function'){
            window.openAddAttachmentModal(dummyTarget, function(){
              if(onAttachmentsChanged) onAttachmentsChanged(dummyTarget.attachments, ctx);
            }, function(){
              if(onAttachmentsChanged) onAttachmentsChanged(dummyTarget.attachments, ctx);
            });
          }
        };
      }

      sheet.querySelectorAll('[data-caldraftatt]').forEach(function(chip){
        chip.onclick = function(e){
          e.stopPropagation();
          var idx = parseInt(chip.dataset.caldraftatt, 10);
          var ctx = typeof getContext === 'function' ? getContext() : {};
          var curAtts = [].concat(ctx.attachments || []);
          var att = curAtts[idx];
          if(!att) return;
          if(typeof window.openAttachmentViewer === 'function'){
            window.openAttachmentViewer(att, null, function(){
              curAtts.splice(idx, 1);
              if(onAttachmentsChanged) onAttachmentsChanged(curAtts, ctx);
              if(typeof window.toast === 'function') window.toast('참고자료를 삭제했어요');
            });
          }
        };
      });
    },

    /**
     * 일자 허브 모달용 일정 행 칩 HTML 생성
     */
    renderHubEventChipsHtml: function(e){
      if(!e || !e.attachments || !e.attachments.length) return '';
      if(typeof window.renderAttachmentChipsHtml === 'function'){
        return '<div style="margin-top:4px;">' + window.renderAttachmentChipsHtml(e.attachments, e.kind, e.schedId || e.msId || e.goalId, e.goalId) + '</div>';
      }
      return '';
    },

    /**
     * 일자 허브 모달 내 +참고 버튼 이벤트 바인딩
     */
    wireHubModalAttachments: function(sheet, selDate){
      if(!sheet) return;
      sheet.querySelectorAll('[data-hubaddatt]').forEach(function(btn){
        btn.onclick = function(e){
          e.stopPropagation();
          var sid = btn.dataset.hubaddatt;
          if(!window.state || !window.state.profile || !window.state.profile.settings) return;
          var scheds = window.state.profile.settings.customSchedules || [];
          var targetSched = scheds.find(function(c){ return c.id === sid; });
          if(!targetSched) return;
          if(typeof window.openAddAttachmentModal === 'function'){
            window.openAddAttachmentModal(targetSched, function(){
              if(typeof window.renderCalendarScreen === 'function') window.renderCalendarScreen();
              if(typeof window.openCalendarDayEditHubModal === 'function') window.openCalendarDayEditHubModal(selDate);
            }, function(){
              if(typeof window.openCalendarDayEditHubModal === 'function') window.openCalendarDayEditHubModal(selDate);
            });
          }
        };
      });
    },

    /**
     * wireAttachmentChipClicks에서 custom schedule 칩 클릭 시 처리
     * @returns {boolean} true if handled
     */
    handleCustomScheduleAttachmentClick: function(chip, idx, schedId){
      if(!window.state || !window.state.profile || !window.state.profile.settings) return false;
      var scheds = window.state.profile.settings.customSchedules || [];
      var target = scheds.find(function(c){ return c.id === schedId; });
      if(!target || !target.attachments || !target.attachments[idx]) return false;
      var att = target.attachments[idx];

      if(typeof window.openAttachmentViewer === 'function'){
        window.openAttachmentViewer(att, null, async function(){
          target.attachments.splice(idx, 1);
          if(typeof window.saveProfile === 'function') await window.saveProfile();
          if(typeof window.renderAll === 'function') window.renderAll();
          if(window.state && window.state.activeTab === 'calendar' && typeof window.renderCalendarScreen === 'function'){
            window.renderCalendarScreen();
          }
          // 허브 모달이 열려 있는 경우 실시간 갱신
          var hubSheet = document.getElementById('modalSheet');
          if(hubSheet && hubSheet.querySelector('#hubAddNewBtn') && window.state && window.state.calSelectedDate){
            if(typeof window.openCalendarDayEditHubModal === 'function'){
              window.openCalendarDayEditHubModal(window.state.calSelectedDate);
            }
          }
          if(typeof window.toast === 'function') window.toast('참고자료를 삭제했어요');
        });
        return true;
      }
      return false;
    }
  };

  /**
   * [TASK-ES-AUTO-29 / #TASK-ES-280] 일정 사진 일기장 안내창 우측 상단 닫기(X) 버튼 추가 및 영구 숨김 처리 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle일정_Item29Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-29-action-btn') : null;
    if (actionBtn) {
      actionBtn.disabled = true;
    }

    // 1. [햅틱 진동 피드백] (12ms 체감 인터랙션)
    var nav = win.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    if (nav && typeof nav.vibrate === 'function') {
      try {
        nav.vibrate(12);
      } catch (e) {}
    }

    try {
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션
      var syncPayload = {
        ticket: '29',
        updated_at: new Date().toISOString(),
        hide_diary_guide: true,
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('ourgoal_hide_diary_guide', 'true');
        locStorage.setItem('og_task-29_cache', JSON.stringify(syncPayload));
      }

      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-29',
            metadata: syncPayload
          });
        } catch (sbErr) {}
      }

      // 안내 배너가 DOM에 존재할 경우 즉시 display: none 처리
      var diaryGuide = doc && typeof doc.getElementById === 'function' ? doc.getElementById('calSubGuideBanner') : null;
      if (diaryGuide) {
        diaryGuide.style.display = 'none';
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('일정 사진 일기장 안내창이 영구 숨김 처리되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-29] 실행 실패:', err);
      if (typeof win.showToast === 'function') {
        win.showToast('처리 중 오류가 발생했습니다. 다시 시도해주세요.', { type: 'error' });
      }
      throw err;
    } finally {
      if (actionBtn) {
        actionBtn.disabled = false;
      }
    }
  }

  OurgoalCalendarAttachment.handle일정_Item29Action = handle일정_Item29Action;
  window.handle일정_Item29Action = handle일정_Item29Action;
  window.OurgoalCalendarAttachment = OurgoalCalendarAttachment;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalCalendarAttachment;
    module.exports.handle일정_Item29Action = handle일정_Item29Action;
  }
  if (typeof global !== 'undefined') {
    global.handle일정_Item29Action = handle일정_Item29Action;
  }
})(typeof window !== 'undefined' ? window : global);
