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
        ? '<div class="att-chips-wrap" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">' +
            attachments.map(function(att, idx){
              var icon = att.type === 'video' ? '🎥' : (att.type === 'image' ? '🖼️' : (att.type === 'text' ? '📝' : '🔗'));
              var safeTitle = (att.title || '참고자료').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
              return '<span class="att-chip" data-caldraftatt="' + idx + '" title="' + safeTitle + '" style="cursor:pointer;">' +
                icon + ' ' + safeTitle +
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
              if(onAttachmentsChanged) onAttachmentsChanged(dummyTarget.attachments);
            }, function(){
              if(onAttachmentsChanged) onAttachmentsChanged(dummyTarget.attachments);
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
              if(onAttachmentsChanged) onAttachmentsChanged(curAtts);
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

  window.OurgoalCalendarAttachment = OurgoalCalendarAttachment;
})(typeof window !== 'undefined' ? window : this);
