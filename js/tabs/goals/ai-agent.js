/**
 * OurGoal Goal AI Agent (목표 탭 — 대화로 목표 관리·AI 생성 미리보기)
 *
 * #TASK-ES-436 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   goalAgentSnapshot · requestGoalAgentDiff · sanitizeAttachments(이전 전 18898~18952줄, 구획 주석 포함 · 구획 「대화로 목표 관리 (AI diff 제안 + 확인 후 반영)」)
 *   renderGoalOpsFullPreviewHtml · showGoalAgentLoadingStep · showGoalAgentReviewStep(이전 전 19517~19911줄 · 구획 「목표 AI 생성 전체 템플릿 양식 및 세부 항목 미리보기 (Req 5)」)
 *   sendGoalAgentMessage(이전 전 19913~19953줄 · 구획 「목표 AI 생성 전체 템플릿 양식 및 세부 항목 미리보기 (Req 5)」)
 * requestGoalAgentDiff = 목표 상태 요약을 AI 에 보내 바꿀 점(diff)을 받는다 · sendGoalAgentMessage = 대화 창 전송 → 로딩·검토 단계를 그린다.
 * 묶음의 함수 선언을 글자 그대로 옮겼다(묶음 전체가 함수뿐이면 구획 주석까지 통째로). 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>,
 * 같은 키트의 다른 세포 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓). 로드 중 바로 도는 문·최상위 변수는 index.html 원래 자리에 남았다.
 * index.html 은 IIFE 머리에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: #TASK-ES-423. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ============ 대화로 목표 관리 (AI diff 제안 + 확인 후 반영) ============ */
  function goalAgentSnapshot(){
    return L.state.profile.goals.filter(function(g){ return !g.archivedAt; }).map(function(g){
      return {
        id: g.id, title: g.title, dueDate: g.dueDate || null,
        milestones: (g.milestones||[]).map(function(m){
          return {
            id: m.id, title: m.title, status: m.status, dueDate: m.dueDate || null,
            tasks: (m.tasks||[]).map(function(t){ return { id: t.id, title: t.title, done: !!t.done }; })
          };
        })
      };
    });
  }
  async function requestGoalAgentDiff(message){
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, 28000);
    var settings = (L.state.profile && L.state.profile.settings) || {};
    try{
      var res = await fetch('/api/goalagent', {
        method:'POST', headers:{'Content-Type':'application/json'}, signal: controller.signal,
        body: JSON.stringify({
          message: message,
          goals: goalAgentSnapshot(),
          today: new Date().toISOString().slice(0,10),
          geminiKey: settings.geminiKey || ''
        })
      });
      clearTimeout(timer);
      if(!res.ok) {
        var errBody = await res.json().catch(function(){ return {}; });
        if(errBody.error === 'CONTENT_FILTER_REJECTED'){
          return { ops: [], isBlocked: true, reply: errBody.message, detail: errBody.detail, support: errBody.support, notice: errBody.notice };
        }
        return { ops: [], reply: errBody.error || '요청을 처리하지 못했어요 · 다시 시도해주세요' };
      }
      var data = await res.json();
      if(!data || !Array.isArray(data.ops)) return null;
      return data;
    } catch(e){ clearTimeout(timer); return null; }
  }
  function sanitizeAttachments(arr){
    if(!Array.isArray(arr)) return [];
    return arr.filter(function(a){ return a && (a.title || a.url || a.note); }).map(function(a){
      var t = a.type || 'link';
      if(t !== 'video' && t !== 'image' && t !== 'text' && t !== 'link') t = 'link';
      return {
        id: a.id || L.uid('att'),
        type: t,
        title: String(a.title || (t === 'video' ? '영상' : (t === 'image' ? '이미지' : (t === 'text' ? '메모' : '링크')))).slice(0, 100),
        url: a.url ? String(a.url).slice(0, 500) : '',
        note: a.note ? String(a.note).slice(0, 500) : ''
      };
    });
  }

  function renderGoalOpsFullPreviewHtml(ops){
    if(!ops || !ops.length) return '<p class="faint">반영할 변경사항이 없습니다.</p>';
    ops.forEach(function(op){
      if(op && op.level==='goal' && op.type==='CREATE' && op.data && Array.isArray(op.data.milestones)){
        L.normalizeSequentialMilestoneDates(op.data.milestones, op.data.dueDate);
      }
    });
    var html = '<div class="scroll-preview-box">';
    ops.forEach(function(op, opIdx){
      var icon = op.type==='CREATE' ? '➕' : (op.type==='DELETE' ? '🗑' : '✏️');
      var typeLabel = op.type==='CREATE' ? '새로 생성' : (op.type==='DELETE' ? '삭제' : '수정');
      var levelLabel = op.level==='goal' ? '목표' : (op.level==='milestone' ? '마일스톤' : '할 일');

      html += '<div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px dashed var(--rule);">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
        '<div style="font-weight:700;font-size:.875rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
          '<span>'+icon+'</span>' +
          '<span>'+levelLabel+' '+typeLabel+'</span>' +
        '</div>' +
        '<span class="faint" style="font-size:.8125rem;">'+L.escapeHtml(op.summary||'')+'</span>' +
      '</div>';

      if(op.level==='goal' && op.type==='CREATE' && op.data){
        var gData = op.data;
        html += '<div style="background:var(--card);padding:10px;border-radius:10px;border:1px solid var(--rule);">';
        html += '<div style="font-weight:700;font-size:.9rem;color:var(--ink);display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
          '<span><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg></span><span>'+L.escapeHtml(gData.title||'새 목표')+'</span>' +
          (gData.dueDate ? '<span class="dday-mini" style="margin-left:4px;">'+L.escapeHtml(gData.dueDate)+'</span>' : '') +
        '</div>';
        if(gData.topicMajor){
          var tmInfo = L.TOPICS[gData.topicMajor];
          html += '<div class="faint" style="font-size:.8125rem;margin-top:2px;">'+(tmInfo?tmInfo.icon+' '+tmInfo.label:gData.topicMajor)+(gData.topicMinor?' · '+L.escapeHtml(gData.topicMinor):'')+'</div>';
        }
        if(gData.attachments && gData.attachments.length){
          html += '<div class="att-chips-wrap" style="margin-top:4px;">'+gData.attachments.map(function(a){
            var aIco = a.type==='video'?'🎥':(a.type==='image'?'🖼️':(a.type==='text'?'📝':'🔗'));
            return '<span class="att-chip" style="cursor:default;">'+aIco+' '+L.escapeHtml(a.title||'참고자료')+'</span>';
          }).join('')+'</div>';
        }
        if(gData.milestones && gData.milestones.length){
          html += '<div style="margin-top:8px;padding-top:6px;border-top:1px solid var(--rule);">';
          html += '<div style="font-size:.8125rem;font-weight:700;color:var(--ink-soft);margin-bottom:6px;">마일스톤 및 세부 할 일 ('+gData.milestones.length+'단계)</div>';
          gData.milestones.forEach(function(m, mIdx){
            html += '<div style="margin-bottom:6px;padding:6px 8px;background:var(--card2);border-radius:8px;">';
            var msTitle = (m.title || '마일스톤').trim();
            var cleanMsTitle = msTitle.replace(/^(?:(?:\d+|[일이삼사오육칠팔구십]+)단계[:\.\s]*|단계\s*\d+[:\.\s]*)/i, '').trim();
            html += '<div style="font-size:.875rem;font-weight:700;display:flex;align-items:center;justify-content:space-between;gap:4px;">' +
              '<span>' + (mIdx+1) + '단계. ' + L.escapeHtml(cleanMsTitle || msTitle) + '</span>' +
              (m.dueDate ? '<span class="faint" style="font-size:.7rem;white-space:nowrap;">'+L.escapeHtml(m.dueDate)+'</span>' : '') +
            '</div>';
            if(m.attachments && m.attachments.length){
              html += '<div class="att-chips-wrap" style="margin-top:2px;">'+m.attachments.map(function(a){
                var aIco = a.type==='video'?'🎥':(a.type==='image'?'🖼️':(a.type==='text'?'📝':'🔗'));
                return '<span class="att-chip" style="cursor:default;font-size:.6875rem;padding:1px 5px;">'+aIco+' '+L.escapeHtml(a.title||'참고')+'</span>';
              }).join('')+'</div>';
            }
            if(m.tasks && m.tasks.length){
              html += '<div style="margin-top:4px;padding-left:8px;display:flex;flex-direction:column;gap:3px;">';
              m.tasks.forEach(function(t){
                var tTitle = typeof t==='string' ? t : (t&&t.title)||'';
                var tDue = (t&&t.dueDate)||null;
                html += '<div class="faint" style="font-size:.8125rem;display:flex;align-items:center;justify-content:space-between;gap:4px;">' +
                  '<span>' + L.escapeHtml(tTitle) + '</span>' +
                  (tDue ? '<span style="font-size:.6875rem;white-space:nowrap;">'+L.escapeHtml(tDue)+'</span>' : '') +
                '</div>';
              });
              html += '</div>';
            }
            html += '</div>';
          });
          html += '</div>';
        }
        html += '</div>';
      } else if(op.level==='milestone' && op.type==='CREATE' && op.data){
        var mData = op.data;
        html += '<div style="background:var(--card);padding:8px 10px;border-radius:10px;border:1px solid var(--rule);">';
        html += '<div style="font-weight:700;font-size:.875rem;color:var(--ink);display:flex;align-items:center;justify-content:space-between;gap:4px;">' +
          '<span>' + L.escapeHtml(mData.title||'새 마일스톤') + '</span>' +
          (mData.dueDate ? '<span class="faint" style="font-size:.8125rem;white-space:nowrap;">'+L.escapeHtml(mData.dueDate)+'</span>' : '') +
        '</div>';
        if(mData.tasks && mData.tasks.length){
          html += '<div style="margin-top:4px;padding-left:8px;display:flex;flex-direction:column;gap:3px;">';
          mData.tasks.forEach(function(t){
            var tkTitle = typeof t==='string' ? t : (t&&t.title)||'';
            html += '<div class="faint" style="font-size:.8125rem;">' + L.escapeHtml(tkTitle) + '</div>';
          });
          html += '</div>';
        }
        html += '</div>';
      } else if(op.level==='task' && op.type==='CREATE' && op.data){
        var tkTitle = typeof op.data==='string' ? op.data : (op.data&&op.data.title)||'새 할 일';
        var tkDue = op.data&&op.data.dueDate;
        html += '<div style="font-size:.875rem;padding:4px 8px;background:var(--card);border-radius:6px;display:flex;align-items:center;justify-content:space-between;gap:4px;">' +
          '<span>' + L.escapeHtml(tkTitle) + '</span>' +
          (tkDue ? '<span class="faint" style="font-size:.8125rem;white-space:nowrap;">'+L.escapeHtml(tkDue)+'</span>' : '') +
        '</div>';
      } else if(op.type==='UPDATE' && op.data){
        html += '<div style="font-size:.8125rem;color:var(--ink-soft);padding:4px 8px;background:var(--card);border-radius:6px;line-height:1.5;">';
        if(op.data.title) html += '• 제목 변경: <b>' + L.escapeHtml(op.data.title) + '</b><br>';
        if(op.data.dueDate) html += '• 일정/마감일 변경: <b>' + L.escapeHtml(op.data.dueDate) + '</b><br>';
        if(op.data.status) html += '• 상태 변경: <b>' + L.escapeHtml(op.data.status) + '</b><br>';
        if(op.data.attachments) html += '• 참고자료 업데이트: <b>' + op.data.attachments.length + '건</b><br>';
        html += '</div>';
      } else if(op.type==='DELETE'){
        html += '<div class="faint" style="font-size:.8125rem;color:var(--brand-strong);">삭제 예정: ' + L.escapeHtml(op.summary||'해당 항목') + '</div>';
      } else {
        html += '<div class="faint" style="font-size:.8125rem;">' + L.escapeHtml(op.summary||'') + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function showGoalAgentLoadingStep(){
    L.openModal('<h3>이대로 반영할까요?</h3>' + L.fbBotBubbleHtml('<p class="faint" style="margin:0;">요청을 분석하는 중…</p>'), null);
  }
  function showGoalAgentReviewStep(diff, lastPrompt, revisionCount){
    revisionCount = revisionCount || 0;
    if(revisionCount >= 3){
      var applied = 0;
      diff.ops.forEach(function(op){ if(L.applyGoalAgentOp(op)) applied++; });
      L.saveProfile().then(function(){
        L.renderAll();
        if(typeof L.dispatchFullViewPropagation === 'function') L.dispatchFullViewPropagation();
        L.openModal(
          '<h3>목표설정 자동 반영 완료</h3>' +
          '<div style="padding:14px;background:var(--card2);border-radius:12px;border:1px solid var(--rule);margin:12px 0 16px;">' +
            '<p style="margin:0;line-height:1.6;color:var(--ink);font-weight:700;font-size:.9rem;">' +
              '3번 수정하여 일단 자동으로 목표설정 반영되었습니다. 편집을 통해 다시 수정하실 수 있습니다.' +
            '</p>' +
          '</div>' +
          renderGoalOpsFullPreviewHtml(diff.ops) +
          '<div class="modal-actions"><button class="btn btn-primary btn-block" id="gaAutoDoneBtn" type="button">확인</button></div>',
          function(sheet){
            sheet.querySelector('#gaAutoDoneBtn').addEventListener('click', L.closeModal);
          }
        );
        L.toast('3번 수정으로 자동 반영되었습니다');
      });
      return;
    }

    // Check if this is a goal CREATE operation (#TASK-ES-236)
    var createGoalOp = (diff && diff.ops || []).find(function(op){ return op && op.level === 'goal' && op.type === 'CREATE' && op.data; });

    if(createGoalOp){
      var gData = createGoalOp.data;
      var rawMilestones = gData.milestones || [];
      var revBadge = revisionCount > 0 ? '<span class="dday-pill" style="margin-left:6px;background:var(--sage-soft);color:var(--sage);font-size:.6875rem;">수정보완 '+revisionCount+'/3회</span>' : '';

      var modalHtml = '<div class="ga-plan-preview-sheet">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
          '<h3 style="margin:0;font-size:1.1rem;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
            '<span>✨</span><span>제안된 목표 플랜 확인</span>' +
          '</h3>' +
          revBadge +
        '</div>' +
        '<p style="margin:0 0 12px;font-size:.8125rem;color:var(--ink-soft);line-height:1.45;">' +
          (diff.reply ? L.escapeHtml(diff.reply) + '<br>' : '') +
          '내 상황에 맞게 <b>목표 제목을 수정</b>하고 <b>필요한 단계(마일스톤)</b>만 골라 담아보세요.' +
        '</p>' +

        '<!-- 목표 제목 인라인 수정 -->' +
        '<div style="margin-bottom:12px;">' +
          '<label style="display:block;font-size:.78125rem;font-weight:700;color:var(--ink);margin-bottom:4px;">🎯 목표 제목 (터치하여 수정 가능)</label>' +
          '<input id="gaGoalTitleInput" type="text" class="input-base" value="' + L.escapeHtml(gData.title || '') + '" style="width:100%;box-sizing:border-box;font-weight:700;font-size:.95rem;padding:8px 10px;border-radius:10px;border:1px solid var(--rule);background:var(--surface);color:var(--ink);">' +
        '</div>' +

        '<!-- 실천 주기 선택 칩 -->' +
        '<div style="margin-bottom:12px;">' +
          '<label style="display:block;font-size:.78125rem;font-weight:700;color:var(--ink);margin-bottom:6px;">📅 추천 실천 주기</label>' +
          '<div class="goal-freq-chips" id="gaFreqChips">' +
            '<button type="button" class="goal-freq-chip active" data-freq="매일">매일 실천</button>' +
            '<button type="button" class="goal-freq-chip" data-freq="주 3회">주 3회 실천</button>' +
            '<button type="button" class="goal-freq-chip" data-freq="주 5회">주 5회 실천</button>' +
            '<button type="button" class="goal-freq-chip" data-freq="주말마다">주말마다 실천</button>' +
          '</div>' +
        '</div>' +

        '<!-- 마일스톤 단계 On/Off 선택 및 인라인 수정 -->' +
        '<div style="margin-bottom:14px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
            '<label style="font-size:.78125rem;font-weight:700;color:var(--ink);">📌 실천 단계 선택 & 수정 (' + rawMilestones.length + '단계)</label>' +
            '<span class="faint" style="font-size:.72rem;">체크 해제 시 해당 단계 제외</span>' +
          '</div>' +
          '<div id="gaMilestonesList" style="display:flex;flex-direction:column;gap:8px;max-height:240px;overflow-y:auto;padding-right:2px;">' +
            rawMilestones.map(function(m, mIdx){
              var mTitle = m.title || ('단계 ' + (mIdx+1));
              return '<div class="ga-ms-card" id="gaMsCard_' + mIdx + '" style="padding:8px 10px;background:var(--card2);border:1px solid var(--rule);border-radius:10px;">' +
                '<div style="display:flex;align-items:center;gap:8px;">' +
                  '<input type="checkbox" id="gaMsCheck_' + mIdx + '" class="ga-ms-check" data-midx="' + mIdx + '" checked style="width:18px;height:18px;cursor:pointer;flex-shrink:0;">' +
                  '<label for="gaMsCheck_' + mIdx + '" style="font-weight:700;font-size:.8125rem;color:var(--brand);flex-shrink:0;cursor:pointer;">' + (mIdx+1) + '단계</label>' +
                  '<input type="text" class="ga-ms-title-inp" id="gaMsTitleInp_' + mIdx + '" data-midx="' + mIdx + '" value="' + L.escapeHtml(mTitle) + '" style="flex:1;min-width:0;font-size:.875rem;padding:4px 8px;border:1px solid var(--rule);border-radius:6px;background:var(--surface);color:var(--ink);">' +
                '</div>' +
                (m.tasks && m.tasks.length ? '<div style="margin-top:4px;padding-left:26px;font-size:.75rem;color:var(--ink-soft);">' +
                  m.tasks.map(function(t){ return '• ' + L.escapeHtml(typeof t==='string'?t:(t&&t.title)||''); }).join('  ') +
                '</div>' : '') +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +

        '<!-- 추가 수정 입력 박스 -->' +
        '<div id="gaReviseBox" style="display:none;margin-top:12px;padding:12px;background:var(--card2);border-radius:12px;border:1px solid var(--rule);">' +
          '<div style="font-weight:700;font-size:.8125rem;margin-bottom:6px;color:var(--ink);">보완하거나 다시 설명할 내용을 적어주세요 ('+(revisionCount+1)+'/3회)</div>' +
          '<textarea id="gaReviseInput" rows="2" style="width:100%;box-sizing:border-box;border-radius:8px;padding:8px;font-size:.875rem;border:1px solid var(--rule);background:var(--surface-2);color:var(--ink);resize:vertical;" placeholder="예: 첫 번째 단계를 가볍게 줄여줘, 일정 시간을 오후 3시로 바꿔줘"></textarea>' +
          '<div style="display:flex;justify-content:flex-end;gap:6px;margin-top:8px;">' +
            '<button class="btn btn-ghost btn-sm" id="gaReviseCancelBtn" type="button">닫기</button>' +
            '<button class="btn btn-primary btn-sm" id="gaReviseSubmitBtn" type="button">수정 요청 전송</button>' +
          '</div>' +
        '</div>' +

        '<div class="modal-actions" style="margin-top:14px;gap:8px;">' +
          '<button class="btn btn-ghost" id="gaCancelBtn" type="button">취소</button>' +
          '<button class="btn btn-ghost" id="gaReviseBtn" type="button" style="color:var(--ink);border-color:var(--ink);">추가수정 ('+(revisionCount+1)+'/3)</button>' +
          '<button class="btn btn-primary" id="gaApplyBtn" type="button" style="font-weight:700;flex:1.5;">🎯 이 플랜으로 내 목표 만들기</button>' +
        '</div>' +
      '</div>';

      L.openModal(modalHtml, function(sheet){
        sheet.querySelector('#gaCancelBtn').addEventListener('click', function(){
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          L.closeModal();
        });

        // 실천 주기 칩 인터랙션
        var selectedFreq = '매일';
        sheet.querySelectorAll('#gaFreqChips .goal-freq-chip').forEach(function(chip){
          chip.addEventListener('click', function(){
            if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(10);
            sheet.querySelectorAll('#gaFreqChips .goal-freq-chip').forEach(function(c){ c.classList.remove('active'); });
            chip.classList.add('active');
            selectedFreq = chip.dataset.freq || '매일';
          });
        });

        // 단계 체크박스 인터랙션 (체크 해제 시 카드 음영 처리)
        sheet.querySelectorAll('.ga-ms-check').forEach(function(chk){
          chk.addEventListener('change', function(){
            if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(10);
            var midx = chk.dataset.midx;
            var card = sheet.querySelector('#gaMsCard_' + midx);
            if(card){
              card.classList.toggle('disabled', !chk.checked);
            }
          });
        });

        // 추가수정 버튼
        var reviseBox = sheet.querySelector('#gaReviseBox');
        var reviseBtn = sheet.querySelector('#gaReviseBtn');
        if(reviseBtn){
          reviseBtn.addEventListener('click', function(){
            if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
            reviseBox.style.display = reviseBox.style.display === 'none' ? 'block' : 'none';
            if(reviseBox.style.display === 'block'){
              var ta = sheet.querySelector('#gaReviseInput');
              if(ta) ta.focus();
            }
          });
        }
        var reviseCancelBtn = sheet.querySelector('#gaReviseCancelBtn');
        if(reviseCancelBtn){
          reviseCancelBtn.addEventListener('click', function(){ reviseBox.style.display = 'none'; });
        }
        var reviseSubmitBtn = sheet.querySelector('#gaReviseSubmitBtn');
        if(reviseSubmitBtn){
          reviseSubmitBtn.addEventListener('click', async function(){
            var revText = (sheet.querySelector('#gaReviseInput').value || '').trim();
            if(!revText){ L.toast('수정할 내용을 입력해주세요'); return; }
            if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
            showGoalAgentLoadingStep();
            var nextRev = revisionCount + 1;
            var combinedPrompt = (lastPrompt ? lastPrompt + ' [추가수정보완 ' + nextRev + '회차]: ' : '') + revText;
            var newDiff = await requestGoalAgentDiff(combinedPrompt);
            if(!newDiff || !newDiff.ops.length){
              L.closeModal();
              L.toast((newDiff && newDiff.reply) || '수정 요청을 처리하지 못했어요 · 다시 시도해주세요');
              return;
            }
            showGoalAgentReviewStep(newDiff, combinedPrompt, nextRev);
          });
        }

        // 🎯 이 플랜으로 내 목표 만들기 최종 적용 버튼
        sheet.querySelector('#gaApplyBtn').addEventListener('click', async function(){
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(15);
          var titleInp = sheet.querySelector('#gaGoalTitleInput');
          var finalTitle = (titleInp ? titleInp.value.trim() : '') || gData.title || '새 목표';

          var checkedMilestones = [];
          rawMilestones.forEach(function(m, idx){
            var chk = sheet.querySelector('#gaMsCheck_' + idx);
            if(chk && chk.checked){
              var titleEl = sheet.querySelector('#gaMsTitleInp_' + idx);
              var customTitle = (titleEl ? titleEl.value.trim() : '') || m.title;
              checkedMilestones.push(Object.assign({}, m, { title: customTitle }));
            }
          });

          if(!checkedMilestones.length){
            L.toast('최소 1개 이상의 단계를 선택해주세요');
            return;
          }

          // 최종 데이터 반영
          gData.title = finalTitle;
          gData.milestones = checkedMilestones;
          gData.topicMinor = selectedFreq;

          var applied = 0;
          diff.ops.forEach(function(op){ if(L.applyGoalAgentOp(op)) applied++; });
          if(!applied){ L.closeModal(); L.toast('반영할 변경사항이 없어요'); return; }

          await L.saveProfile();
          L.closeModal();
          L.renderAll();
          if(typeof L.dispatchFullViewPropagation === 'function') L.dispatchFullViewPropagation();
          L.toast('🎯 "' + finalTitle + '" 목표가 등록되었어요! 등반을 시작해요 🏔️');
        });
      });
      return;
    }

    // Default fallback for update/delete ops
    var revBadge = revisionCount > 0 ? '<span class="dday-pill" style="margin-left:6px;background:var(--sage-soft);color:var(--sage);font-size:.6875rem;">수정보완 '+revisionCount+'/3회</span>' : '';
    L.openModal(
      '<div style="display:flex;align-items:center;justify-content:space-between;">' +
        '<h3 style="margin:0;">이대로 반영할까요?</h3>' +
        revBadge +
      '</div>' +
      (diff.reply ? '<p class="faint" style="margin:8px 0 10px;font-size:.875rem;line-height:1.5;">'+L.escapeHtml(diff.reply)+'</p>' : '') +
      '<p class="faint" style="margin:0 0 10px;font-size:.8125rem;">생성된 템플릿과 세부 마일스톤·할 일을 아래 스크롤로 모두 확인해보세요.</p>' +
      renderGoalOpsFullPreviewHtml(diff.ops) +
      '<div id="gaReviseBox" style="display:none;margin-top:12px;padding:12px;background:var(--card2);border-radius:12px;border:1px solid var(--rule);">' +
        '<div style="font-weight:700;font-size:.8125rem;margin-bottom:6px;color:var(--ink);">보완하거나 다시 설명할 내용을 적어주세요 ('+(revisionCount+1)+'/3회)</div>' +
        '<textarea id="gaReviseInput" rows="2" style="width:100%;box-sizing:border-box;border-radius:8px;padding:8px;font-size:.875rem;border:1px solid var(--rule);background:var(--surface-2);color:var(--ink);resize:vertical;" placeholder="예: 첫 번째 단계를 가볍게 줄여줘, 일정 시간을 오후 3시로 바꿔줘, 관련 영상 링크 추가해줘"></textarea>' +
        '<div style="display:flex;justify-content:flex-end;gap:6px;margin-top:8px;">' +
          '<button class="btn btn-ghost btn-sm" id="gaReviseCancelBtn" type="button">닫기</button>' +
          '<button class="btn btn-primary btn-sm" id="gaReviseSubmitBtn" type="button">수정 요청 전송</button>' +
        '</div>' +
      '</div>' +
      '<div class="modal-actions" style="margin-top:14px;gap:8px;">' +
        '<button class="btn btn-ghost" id="gaCancelBtn" type="button">취소</button>' +
        '<button class="btn btn-ghost" id="gaReviseBtn" type="button" style="color:var(--ink);border-color:var(--ink);">추가수정 ('+(revisionCount+1)+'/3)</button>' +
        '<button class="btn btn-primary" id="gaApplyBtn" type="button">반영</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#gaCancelBtn').addEventListener('click', L.closeModal);
        var reviseBox = sheet.querySelector('#gaReviseBox');
        var reviseBtn = sheet.querySelector('#gaReviseBtn');
        if(reviseBtn){
          reviseBtn.addEventListener('click', function(){
            reviseBox.style.display = reviseBox.style.display === 'none' ? 'block' : 'none';
            if(reviseBox.style.display === 'block'){
              var ta = sheet.querySelector('#gaReviseInput');
              if(ta) ta.focus();
            }
          });
        }
        var reviseCancelBtn = sheet.querySelector('#gaReviseCancelBtn');
        if(reviseCancelBtn){
          reviseCancelBtn.addEventListener('click', function(){ reviseBox.style.display = 'none'; });
        }
        var reviseSubmitBtn = sheet.querySelector('#gaReviseSubmitBtn');
        if(reviseSubmitBtn){
          reviseSubmitBtn.addEventListener('click', async function(){
            var revText = (sheet.querySelector('#gaReviseInput').value || '').trim();
            if(!revText){ L.toast('수정할 내용을 입력해주세요'); return; }
            showGoalAgentLoadingStep();
            var nextRev = revisionCount + 1;
            var combinedPrompt = (lastPrompt ? lastPrompt + ' [추가수정보완 ' + nextRev + '회차]: ' : '') + revText;
            var newDiff = await requestGoalAgentDiff(combinedPrompt);
            if(!newDiff || !newDiff.ops.length){
              L.closeModal();
              L.toast((newDiff && newDiff.reply) || '수정 요청을 처리하지 못했어요 · 다시 시도해주세요');
              return;
            }
            showGoalAgentReviewStep(newDiff, combinedPrompt, nextRev);
          });
        }
        sheet.querySelector('#gaApplyBtn').addEventListener('click', async function(){
          var applied = 0;
          diff.ops.forEach(function(op){ if(L.applyGoalAgentOp(op)) applied++; });
          if(!applied){ L.closeModal(); L.toast('반영할 변경사항이 없어요'); return; }
          await L.saveProfile();
          L.closeModal();
          L.renderAll();
          if(typeof L.dispatchFullViewPropagation === 'function') L.dispatchFullViewPropagation();
          L.toast(applied+'개 변경사항을 반영했어요');
        });
      }
    );
  }

  async function sendGoalAgentMessage(customText){
    var input = document.getElementById('goalAgentInput');
    var text = (typeof customText === 'string' ? customText : (input ? input.value : '')).trim();
    if(!text) return;
    if(window.OurgoalModeration){
      var modCheck = window.OurgoalModeration.check(text);
      if(modCheck.flagged){
        L.openModal(
          '<div style="text-align:center;padding:12px 4px;">' +
            '<div style="font-size:2rem;margin-bottom:8px;">⚠️</div>' +
            '<h3 style="font-size:1.05rem;font-weight:700;margin:0 0 10px;color:var(--brand-strong);">' + L.escapeHtml(modCheck.message) + '</h3>' +
            '<p style="font-size:.875rem;color:var(--ink-soft);line-height:1.55;margin:0 0 14px;word-break:keep-all;">' + L.escapeHtml(modCheck.detail) + '<br><br>' + L.escapeHtml(modCheck.support) + '<br><br><span style="color:var(--ink-muted, #71717a);font-size:.8125rem;display:inline-block;padding:6px 10px;background:rgba(0,0,0,0.03);border-radius:8px;">🌿 ' + L.escapeHtml(modCheck.notice || '무공해 플랫폼을 위한 강한 제어체계를 구축했습니다. 양해 부탁드립니다.') + '</span></p>' +
            '<button class="btn btn-primary btn-block" type="button" onclick="closeModal()">확인</button>' +
          '</div>',
          function(){}
        );
        return;
      }
    }
    if(input && typeof customText !== 'string') input.value = '';
    showGoalAgentLoadingStep();
    var diff = await requestGoalAgentDiff(text);
    if(!diff || !diff.ops.length){
      L.closeModal();
      if(diff && diff.isBlocked){
        L.openModal(
          '<div style="text-align:center;padding:12px 4px;">' +
            '<div style="font-size:2rem;margin-bottom:8px;">⚠️</div>' +
            '<h3 style="font-size:1.05rem;font-weight:700;margin:0 0 10px;color:var(--brand-strong);">' + L.escapeHtml(diff.reply) + '</h3>' +
            '<p style="font-size:.875rem;color:var(--ink-soft);line-height:1.55;margin:0 0 14px;word-break:keep-all;">' + L.escapeHtml(diff.detail) + '<br><br>' + L.escapeHtml(diff.support) + '<br><br><span style="color:var(--ink-muted, #71717a);font-size:.8125rem;display:inline-block;padding:6px 10px;background:rgba(0,0,0,0.03);border-radius:8px;">🌿 ' + L.escapeHtml(diff.notice || '무공해 플랫폼을 위한 강한 제어체계를 구축했습니다. 양해 부탁드립니다.') + '</span></p>' +
            '<button class="btn btn-primary btn-block" type="button" onclick="closeModal()">확인</button>' +
          '</div>',
          function(){}
        );
      } else {
        L.toast((diff && diff.reply) || '요청을 처리하지 못했어요 · 다시 시도해주세요');
      }
      return;
    }
    showGoalAgentReviewStep(diff, text, 0);
  }

  K.goalAgentSnapshot = goalAgentSnapshot;
  K.requestGoalAgentDiff = requestGoalAgentDiff;
  K.sanitizeAttachments = sanitizeAttachments;
  K.renderGoalOpsFullPreviewHtml = renderGoalOpsFullPreviewHtml;
  K.showGoalAgentLoadingStep = showGoalAgentLoadingStep;
  K.showGoalAgentReviewStep = showGoalAgentReviewStep;
  K.sendGoalAgentMessage = sendGoalAgentMessage;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
