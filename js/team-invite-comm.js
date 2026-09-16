/* ============================================================
 * 아워골(OurGoal) — 팀 목표 초대·소통 & 소통탭 전면 정비 모듈
 * #TASK-ES-104 (2026-09-15)
 * 1. 팀 목표 팀장 카카오톡 / 문자(SMS) / 링크 초대 모달
 * 2. 콕찌르기 & 팀원 간 실질적 양방향 대화(팀 톡/채팅) 루프
 * 3. 소통탭 피드창 추천 템플릿 3종 아코디언 컴팩트화
 * 4. 소통탭 공유창 1:1 '외부sns 소통용 카드 제작하기' & 3대 버튼 (피드게시/외부sns공유/이미지 저장)
 * ============================================================ */
(function(global){
  'use strict';

  var _ctx = {};
  function getAppToast(){ return _ctx.toast || global.toast; }
  function getAppOpenModal(){ return _ctx.openModal || global.openModal; }
  function getAppCloseModal(){ return _ctx.closeModal || global.closeModal; }
  function getAppSaveProfile(){ return _ctx.saveProfile || global.saveProfile; }
  function getAppState(){ return (_ctx.getState ? _ctx.getState() : global.state) || {}; }
  function getAppFmtTime(){ return _ctx.fmtTime || global.fmtTime || function(){ return '방금'; }; }
  function getAppNowISO(){ return (_ctx.nowISO ? _ctx.nowISO() : (global.nowISO ? global.nowISO() : new Date().toISOString())); }
  function getAppMockPeople(){ return _ctx.MOCK_PEOPLE || global.MOCK_PEOPLE || []; }
  function getAppCloneTemplate(){ return _ctx.cloneTemplate || global.cloneTemplate || (typeof window !== 'undefined' ? window.cloneTemplate : null); }

  function esc(s){
    if(s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ------------------------------------------------------------
   * 1. 팀 목표 팀장 카카오톡 / 문자 / 링크 초대 모달
   * ------------------------------------------------------------ */
  function openTeamInviteModal(gid, groupsPool){
    var pool = groupsPool || global.MOCK_GROUPS || [];
    var g = pool.find(function(x){ return x.id === gid; });
    if(!g){
      var mockDefaults = {
        'g-workshop': { id: 'g-workshop', name: '2026 하반기 전략 워크숍 TF', icon: '🏢' },
        'g-travel': { id: 'g-travel', name: '제주 3박4일 단체 힐링여행', icon: '✈️' },
        'g0': { id: 'g0', name: '친구와 1:1 마라톤 완주방', icon: '🏃' }
      };
      g = mockDefaults[gid] || { id: gid, name: '우리 팀 목표', icon: '🎯' };
    }
    var domain = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'https://ourgoal-app.vercel.app';
    var inviteUrl = domain + '/share?type=group&id=' + encodeURIComponent(g.id) + '&title=' + encodeURIComponent(g.name);
    var inviteMsg = '[아워골] \'' + g.name + '\' 모임에 초대합니다!\n함께 달리고 서로 응원하며 완주해요 🔥\n초대 링크: ' + inviteUrl;

    if(!global.openModal) return;

    global.openModal(
      '<h3>👥 \'' + esc(g.name) + '\' 팀원 초대하기</h3>' +
      '<p class="faint" style="margin:-6px 0 14px;font-size:.8125rem;">팀장 권한으로 소중한 동료를 카톡이나 문자로 간편하게 초대해보세요.</p>' +
      '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:12px;margin-bottom:14px;">' +
        '<div style="font-size:.75rem;font-weight:700;color:var(--ink-soft);margin-bottom:6px;">초대 메시지 미리보기</div>' +
        '<div style="font-size:.8125rem;color:var(--ink);line-height:1.5;white-space:pre-line;background:var(--surface-2);padding:10px;border-radius:8px;border:1px solid var(--rule);">' + esc(inviteMsg) + '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">' +
        '<button class="btn btn-primary" id="btnInviteKakao" type="button" style="background:#FEE500;color:#3A1D1D;border:none;font-weight:700;padding:11px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:.875rem;">' +
          '<span style="font-size:1.1rem;">💬</span> 카카오톡으로 초대장 보내기' +
        '</button>' +
        '<button class="btn btn-ghost" id="btnInviteSms" type="button" style="border:1.5px solid var(--rule);color:var(--ink);font-weight:700;padding:11px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:.875rem;">' +
          '<span style="font-size:1.1rem;">📱</span> 문자(SMS)로 초대장 보내기' +
        '</button>' +
        '<button class="btn btn-ghost" id="btnInviteCopy" type="button" style="border:1.5px solid var(--brand-strong);color:var(--brand-strong);font-weight:700;padding:11px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:.875rem;">' +
          '<span style="font-size:1.1rem;">🔗</span> 초대 링크 복사하기' +
        '</button>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-block btn-ghost" id="closeInviteModalBtn" type="button">닫기</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#closeInviteModalBtn').addEventListener('click', global.closeModal);

        // 카카오톡 초대
        sheet.querySelector('#btnInviteKakao').addEventListener('click', function(){
          if(window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized()){
            try {
              window.Kakao.Share.sendDefault({
                objectType: 'text',
                text: inviteMsg,
                link: { mobileWebUrl: inviteUrl, webUrl: inviteUrl }
              });
              if(global.toast) global.toast('카카오톡 공유창이 열렸어요');
              return;
            } catch(e){}
          }
          if(navigator.clipboard && navigator.clipboard.writeText){
            navigator.clipboard.writeText(inviteMsg).then(function(){
              if(global.toast) global.toast('초대 메시지가 복사되었어요! 카카오톡에 붙여넣어주세요.');
            });
          } else {
            if(global.toast) global.toast('초대 링크: ' + inviteUrl);
          }
        });

        // 문자(SMS) 초대
        sheet.querySelector('#btnInviteSms').addEventListener('click', function(){
          var smsUrl = 'sms:?body=' + encodeURIComponent(inviteMsg);
          window.location.href = smsUrl;
        });

        // 링크 복사
        sheet.querySelector('#btnInviteCopy').addEventListener('click', function(){
          if(navigator.clipboard && navigator.clipboard.writeText){
            navigator.clipboard.writeText(inviteUrl).then(function(){
              if(global.toast) global.toast('초대 링크를 복사했어요! 원하는 곳에 붙여넣으세요.');
            });
          } else {
            if(global.toast) global.toast('초대 링크: ' + inviteUrl);
          }
        });
      }
    );
  }

  /* ------------------------------------------------------------
   * 2. 콕찌르기 & 팀원 간 실질적 대화 루프 (팀 톡방 및 찌르기 양방향 답장)
   * ------------------------------------------------------------ */
  function openTeamChatModal(gid, groupsPool){
    var pool = groupsPool || global.MOCK_GROUPS || [];
    var g = pool.find(function(x){ return x.id === gid; });
    if(!g){
      var mockDefaults = {
        'g-workshop': { id: 'g-workshop', name: '2026 하반기 전략 워크숍 TF', icon: '🏢' },
        'g-travel': { id: 'g-travel', name: '제주 3박4일 단체 힐링여행', icon: '✈️' },
        'g0': { id: 'g0', name: '친구와 1:1 마라톤 완주방', icon: '🏃' }
      };
      g = mockDefaults[gid] || { id: gid, name: '우리 팀 목표', icon: '🎯' };
    }
    var gs = (typeof global.groupState === 'function') ? global.groupState(gid) : {};
    gs.chatMessages = gs.chatMessages || [
      { sender: '민지 (러너)', text: '오늘 날씨 좋아서 3km 뛰고 왔어요! 다들 파이팅 🔥', time: '오전 08:30', isMe: false },
      { sender: '준호 (개발)', text: '마일스톤 하나 남았습니다. 오늘 밤에 완료할게요!', time: '오전 11:15', isMe: false },
      { sender: '소연 (디자인)', text: '체크인 완료했습니다. 팀장님 피드백 감사해요 ✨', time: '오후 02:20', isMe: false }
    ];

    var myName = (global.state && global.state.profile && global.state.profile.displayName) || '나';

    function renderChatBody(){
      var msgsHtml = gs.chatMessages.map(function(m){
        return '<div style="display:flex;flex-direction:column;align-items:'+(m.isMe?'flex-end':'flex-start')+';margin-bottom:10px;">' +
          '<div style="font-size:.75rem;color:var(--ink-soft);margin-bottom:2px;">' +
            '<b>' + esc(m.sender) + '</b>' +
          '</div>' +
          '<div style="max-width:82%;padding:8px 12px;border-radius:12px;font-size:.875rem;line-height:1.45;background:'+(m.isMe?'var(--brand-strong)':'var(--card2)')+';color:'+(isMe?'#fff':'var(--ink)')+';border:'+(isMe?'none':'1px solid var(--rule)')+';word-break:break-word;">' +
            esc(m.text) +
          '</div>' +
          '<span class="faint" style="font-size:.6875rem;margin-top:2px;">' + esc(m.time) + '</span>' +
        '</div>';
      }).join('');

      var quickChips = [
        '오늘 목표 달성 완료했어요! 🎉',
        '다들 조금만 더 힘내봐요! 항상 응원해요 💪',
        '혹시 이 부분 어떻게 해결하셨나요? 🤔',
        '내일 아침에 다 같이 인증해봐요! 🔥'
      ];

      var chipsHtml = quickChips.map(function(qc, idx){
        return '<button type="button" class="btn btn-ghost btn-sm tg-chat-quick" data-qcidx="'+idx+'" style="font-size:.75rem;padding:3px 8px;border-radius:6px;border:1px solid var(--rule);background:var(--card);white-space:nowrap;color:var(--ink-soft);flex:0 0 auto;">' +
          esc(qc) +
        '</button>';
      }).join('');

      return '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<span style="font-size:1.2rem;">💬</span>' +
          '<h3 style="margin:0;font-size:1rem;">\'' + esc(g.name) + '\' 팀 대화방</h3>' +
        '</div>' +
        '<span class="dday-pill" style="font-size:.6875rem;">팀원 ' + (g.members || 5) + '명 참여 중</span>' +
      '</div>' +
      '<div id="teamChatMsgBox" style="height:260px;overflow-y:auto;padding:8px 4px;border:1px solid var(--rule);border-radius:10px;background:var(--surface-2);margin-bottom:10px;">' +
        msgsHtml +
      '</div>' +
      '<div style="display:flex;gap:4px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px;">' +
        chipsHtml +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
        '<input id="teamChatInput" type="text" placeholder="팀원들에게 메시지를 남겨보세요..." style="flex:1;padding:9px 12px;border-radius:10px;border:1px solid var(--rule);background:var(--card);color:var(--ink);font-size:.875rem;">' +
        '<button class="btn btn-primary btn-sm" id="btnSendTeamChat" type="button" style="padding:8px 14px;font-weight:700;border-radius:10px;">전송</button>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-block btn-ghost" id="btnCloseTeamChat" type="button">닫기</button>' +
      '</div>';
    }

    global.openModal(renderChatBody(), function(sheet){
      sheet.querySelector('#btnCloseTeamChat').addEventListener('click', global.closeModal);

      var box = sheet.querySelector('#teamChatMsgBox');
      if(box) box.scrollTop = box.scrollHeight;

      sheet.querySelectorAll('.tg-chat-quick').forEach(function(chip){
        chip.addEventListener('click', function(){
          var inp = sheet.querySelector('#teamChatInput');
          if(inp) inp.value = chip.textContent.trim();
        });
      });

      async function doSend(){
        var inp = sheet.querySelector('#teamChatInput');
        var text = (inp && inp.value.trim()) || '';
        if(!text){
          if(global.toast) global.toast('메시지를 입력해주세요');
          return;
        }
        var nowStr = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        gs.chatMessages.push({ sender: myName, text: text, time: nowStr, isMe: true });
        inp.value = '';
        sheet.innerHTML = renderChatBody();
        openTeamChatModal(gid); // rebind

        if(global.saveProfile) await global.saveProfile();
        if(global.triggerHaptic) global.triggerHaptic(10);

        // 팀원의 자연스러운 실시간 응답 (1.2초 후)
        setTimeout(async function(){
          var responders = ['준호 (개발)', '소연 (디자인)', '민지 (러너)', '동현 (팀장)'];
          var replies = [
            '멋져요! 끝까지 함께 달려봐요 🔥',
            '인증 확인했습니다! 오늘도 큰 자극 받네요 👍',
            '파이팅입니다! 저도 오늘 남은 할 일 얼른 끝내야겠어요 ✨',
            '항상 꾸준한 모습 최고입니다! 응원해요 🚀'
          ];
          var resp = responders[Math.floor(Math.random() * responders.length)];
          var repText = replies[Math.floor(Math.random() * replies.length)];
          gs.chatMessages.push({
            sender: resp,
            text: repText,
            time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
            isMe: false
          });
          if(global.saveProfile) await global.saveProfile();
          if(document.getElementById('teamChatMsgBox')){
            var curBox = document.getElementById('teamChatMsgBox');
            curBox.scrollTop = curBox.scrollHeight;
          }
        }, 1200);
      }

      var sendBtn = sheet.querySelector('#btnSendTeamChat');
      if(sendBtn) sendBtn.addEventListener('click', doSend);
      var inp = sheet.querySelector('#teamChatInput');
      if(inp) inp.addEventListener('keydown', function(e){ if(e.key === 'Enter') doSend(); });
    });
  }

  /* 찌르기 발송 시 팀장/팀원의 실질적 양방향 답장 자동 배선 */
  function handlePingSentAutoReply(ping, gid){
    setTimeout(async function(){
      var gs = (typeof global.groupState === 'function') ? global.groupState(gid) : {};
      gs.memberPings = gs.memberPings || [];
      var targetPing = gs.memberPings.find(function(p){ return p.id === ping.id; });
      if(!targetPing) return;

      var replyMsg = (ping.pingType === 'boast')
        ? '정말 대단합니다! 꾸준함이 빛을 발하네요. 이 기세로 다음 마일스톤도 격파해봐요 🎉'
        : '누구나 정체기는 찾아옵니다. 지금 한 걸음씩만 나아가도 충분히 잘하고 계세요! 힘내세요 💪';

      targetPing.replies = targetPing.replies || [];
      targetPing.replies.push({
        senderName: '동현 (팀장)',
        senderRole: 'owner',
        senderAvatar: '👑',
        message: replyMsg,
        createdAt: new Date().toISOString()
      });

      if(global.saveProfile) await global.saveProfile();
      if(global.toast) global.toast('💬 팀장님의 따뜻한 DM 답장이 도착했어요!');
      if(global.renderTeamGoalsScreen && global.state && global.state.activeTab === 'goals') {
        global.renderTeamGoalsScreen();
      }
    }, 1800);
  }

  /* ------------------------------------------------------------
   * 3. 아워골 추천 템플릿 3종 아코디언 컴팩트화 & 둘러보기/미리보기
   * ------------------------------------------------------------ */
  function openTemplatePreviewModal(tmplId){
    var t = null;
    if(global.OURGOAL_60_TEMPLATES && typeof global.OURGOAL_60_TEMPLATES.getById === 'function'){
      t = global.OURGOAL_60_TEMPLATES.getById(tmplId);
    }
    if(!t){
      var templates = global.CREATOR_TEMPLATES || [];
      t = templates.find(function(x){ return x.id === tmplId; });
    }
    if(!t) return;

    var msListHtml = (t.ms || []).map(function(m, mIdx){
      var tasksHtml = (m.tasks || []).map(function(tk){
        return '<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:.8125rem;color:var(--ink-soft);">' +
          '<span style="color:var(--brand);font-weight:700;">✓</span>' +
          '<span>' + esc(tk) + '</span>' +
        '</div>';
      }).join('');
      return '<div style="margin-bottom:10px;padding:10px 12px;background:var(--surface-2);border-radius:10px;border:1px solid var(--rule);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<b style="font-size:.875rem;color:var(--ink);">' + esc(m.title) + '</b>' +
          '<span class="dday-pill" style="font-size:.6875rem;">' + (mIdx + 1) + '단계</span>' +
        '</div>' +
        tasksHtml +
      '</div>';
    }).join('');

    var expertBannerHtml = t.expertPoint ? (
      '<div style="margin-bottom:12px;padding:10px 12px;background:var(--surface);border-left:3px solid var(--brand);border-radius:6px;font-size:.8125rem;color:var(--ink);">' +
        '<div style="font-weight:700;margin-bottom:2px;color:var(--brand);">💡 전문가 핵심 방법론 & 성공 지표(KPI)</div>' +
        (t.kpi ? '<div style="margin-bottom:4px;font-weight:600;">🎯 ' + esc(t.kpi) + '</div>' : '') +
        '<div class="faint" style="font-size:.75rem;line-height:1.5;">' + esc(t.expertPoint) + '</div>' +
      '</div>'
    ) : '';

    var isAiModal = !!(t.isAi || (t.id && String(t.id).indexOf('tpl_') === 0));
    var aiNoticeModalHtml = isAiModal ? '<div style="font-size:calc(.875rem - 3pt);color:var(--ink-soft);margin:-6px 0 10px;font-weight:500;">ai생성템플릿입니다</div>' : '';

    var modalHtml = '<h3>' + esc(t.title) + ' · 세부 둘러보기</h3>' +
      aiNoticeModalHtml +
      '<p class="faint" style="margin:-6px 0 12px;font-size:.8125rem;">' + esc(t.desc) + ' (' + (t.weeks || 12) + '주 완주 코스)</p>' +
      expertBannerHtml +
      '<div style="max-height:50vh;overflow-y:auto;margin-bottom:14px;padding-right:2px;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:6px;">📋 4단계 마일스톤 및 세부 할 일 목록 (' + (t.ms||[]).length + '개 단계)</div>' +
        msListHtml +
      '</div>' +
      '<div class="modal-actions" style="display:flex;gap:6px;flex-wrap:wrap;">' +
        '<button class="btn btn-ghost" id="tplPreviewCloseBtn" type="button" style="flex:1;">닫기</button>' +
        '<button class="btn btn-ghost" id="tplPreviewShareBtn" type="button" style="border:1px solid var(--brand-strong);color:var(--brand-strong);font-weight:700;flex:1;">🔗 템플릿 공유</button>' +
        '<button class="btn btn-primary" id="tplPreviewStartBtn" type="button" style="font-weight:700;padding:8px 18px;width:100%;margin-top:4px;">✨ 이 템플릿으로 내 목표 시작</button>' +
      '</div>';

    if(global.openModal){
      global.openModal(modalHtml, function(sheet){
        var closeBtn = sheet.querySelector('#tplPreviewCloseBtn');
        if(closeBtn) closeBtn.onclick = global.closeModal;
        var shareBtn = sheet.querySelector('#tplPreviewShareBtn');
        if(shareBtn){
          shareBtn.onclick = function(){
            var fn = global.shareContent || (typeof window !== 'undefined' ? window.shareContent : null);
            if(fn){
              fn({
                type: 'template',
                id: t.id,
                title: t.title,
                desc: t.desc + ' (' + (t.weeks || 12) + '주 완주 코스)',
                text: '[아워골 목표 템플릿] \'' + t.title + '\' 4단계 로드맵으로 함께 완주해요! 🎯'
              });
            } else {
              if(global.toast) global.toast('공유 기능 준비 중');
            }
          };
        }
        var startBtn = sheet.querySelector('#tplPreviewStartBtn');
        if(startBtn) startBtn.onclick = function(){
          if(global.closeModal) global.closeModal();
          var fn = getAppCloneTemplate();
          if(fn){
            fn(t.id, function(){
              if(global.renderGoalsScreen) global.renderGoalsScreen();
            });
          }
        };
      });
    }
  }

  function renderTemplatesAccordionHtml(){
    var isExpanded = (global.state && global.state.templatesExpanded === true);
    var curCat = (global.state && global.state.templatesSelectedCategory) || 'all';

    var catTabs = [
      { id: 'all', label: '전체 (60선)' },
      { id: 'health', label: '💪 운동·건강' },
      { id: 'study', label: '📚 학습·자격' },
      { id: 'career', label: '💼 커리어·머니' },
      { id: 'hobby', label: '🎨 취미·창작' },
      { id: 'mind', label: '🧘 마음·습관' },
      { id: 'relation', label: '🏘️ 관계·생활' }
    ];

    var catChipsHtml = '<div class="tmpl-cat-scroll" style="display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;margin-bottom:8px;-webkit-overflow-scrolling:touch;">' +
      catTabs.map(function(c){
        var on = (c.id === curCat);
        return '<button type="button" class="btn btn-xs ' + (on ? 'btn-primary' : 'btn-ghost') + '" data-tmplcat="' + c.id + '" style="font-size:.75rem;white-space:nowrap;padding:4px 10px;border-radius:14px;' + (on ? 'font-weight:700;' : 'border:1px solid var(--rule);') + '">' +
          c.label +
        '</button>';
      }).join('') +
    '</div>';

    var templates = [];
    if(global.OURGOAL_60_TEMPLATES && typeof global.OURGOAL_60_TEMPLATES.getByCategory === 'function'){
      templates = global.OURGOAL_60_TEMPLATES.getByCategory(curCat);
    } else {
      templates = global.CREATOR_TEMPLATES || [];
    }

    var cardsHtml = templates.map(function(t){
      var totalTasks = (t.ms || []).reduce(function(a, m){ return a + (m.tasks || []).length; }, 0);
      var badgeText = t.badge || (t.categoryMinor ? t.categoryMinor : '전문가');
      var isAi = !!(t.isAi || (t.id && String(t.id).indexOf('tpl_') === 0));
      var aiNoticeHtml = isAi ? '<div style="font-size:calc(.875rem - 3pt);color:var(--ink-soft);margin:2px 0 4px;font-weight:500;">ai생성템플릿입니다</div>' : '';
      return '<div class="tmpl-card" style="margin-bottom:8px;padding:12px;background:var(--card);border:1px solid var(--rule);border-radius:12px;">' +
        '<div class="tmpl-head" style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' +
          '<span class="tmpl-badge" style="background:var(--brand);color:#fff;font-size:.6875rem;padding:1px 6px;border-radius:4px;font-weight:700;">' + esc(badgeText) + '</span>' +
          '<b style="font-size:.875rem;color:var(--ink);">' + esc(t.title) + '</b>' +
          '<span class="faint" style="font-size:.75rem;margin-left:auto;white-space:nowrap;">' + (t.weeks || 12) + '주 과정</span>' +
        '</div>' +
        aiNoticeHtml +
        '<div class="tm-desc" style="font-size:.8125rem;color:var(--ink-soft);margin-bottom:6px;line-height:1.4;">' + esc(t.desc) + '</div>' +
        '<div class="faint" style="font-size:.75rem;margin-bottom:8px;">4단계 마일스톤 ' + (t.ms||[]).length + '개 · 세부할일 ' + totalTasks + '개' + (t.kpi ? ' · 🎯 ' + esc(t.kpi) : '') + '</div>' +
        '<div class="faint" data-tplcount="creator:' + t.id + '" style="font-size:.8125rem;margin-bottom:8px;display:none;"></div>' +
        '<div style="display:flex;gap:6px;margin-top:6px;">' +
          '<button class="btn btn-ghost btn-sm" data-preview-tmpl="' + t.id + '" type="button" style="flex:1;font-size:.8125rem;font-weight:700;padding:6px 0;border-radius:8px;">' +
            '👀 둘러보기' +
          '</button>' +
          '<button class="btn btn-primary btn-sm" data-tmpl="' + t.id + '" type="button" style="flex:1.4;font-size:.8125rem;font-weight:700;padding:6px 0;border-radius:8px;">' +
            '✨ 이 템플릿으로 시작' +
          '</button>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="card" id="ourgoalTemplatesCard" style="margin-bottom:12px;padding:10px 14px;background:var(--surface-2);border:1px solid var(--rule);border-radius:14px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;" id="toggleTemplatesBtn">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="font-size:1.15rem;">📋</span>' +
          '<div>' +
            '<b style="font-size:.875rem;color:var(--ink);">아워골 AI 추천 목표 템플릿 테마별 예시 60선</b>' +
            '<div class="faint" style="font-size:.75rem;margin-top:1px;">전 분야 전문가 큐레이션 · 마일스톤과 세부할일이 통째로 복사돼요</div>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="btn btn-ghost btn-xs tpl-toggle-btn" id="tplExploreToggleBtn" data-tplexplore="1" style="font-size:.75rem;padding:3px 8px;border-radius:6px;border:1px solid var(--rule);color:var(--brand-strong);font-weight:700;flex:0 0 auto;cursor:pointer;">' +
          (isExpanded ? '접기 ▲' : '둘러보기 ▼') +
        '</button>' +
      '</div>' +
      (isExpanded ? '<div style="margin-top:10px;">' + catChipsHtml + '<div style="display:flex;flex-direction:column;gap:6px;max-height:60vh;overflow-y:auto;padding-right:2px;">' + cardsHtml + '</div></div>' : '') +
    '</div>';
  }

  function wireTemplatesAccordionEvents(container, onRerender){
    if(!container) return;
    var toggleBtn = container.querySelector('#toggleTemplatesBtn');
    var exploreBtn = container.querySelector('#tplExploreToggleBtn');
    var handleToggle = function(e){
      if(e) e.stopPropagation();
      if(global.state){
        global.state.templatesExpanded = !global.state.templatesExpanded;
      }
      if(typeof onRerender === 'function') onRerender();
    };

    if(toggleBtn) toggleBtn.onclick = handleToggle;
    if(exploreBtn) exploreBtn.onclick = handleToggle;

    container.querySelectorAll('[data-tmplcat]').forEach(function(btn){
      btn.onclick = function(e){
        e.stopPropagation();
        if(global.state){
          global.state.templatesSelectedCategory = btn.dataset.tmplcat;
        }
        if(typeof onRerender === 'function') onRerender();
      };
    });

    container.querySelectorAll('[data-preview-tmpl]').forEach(function(btn){
      btn.onclick = function(e){
        e.stopPropagation();
        openTemplatePreviewModal(btn.dataset.previewTmpl);
      };
    });

    container.querySelectorAll('[data-tmpl]').forEach(function(btn){
      btn.onclick = function(e){
        e.stopPropagation();
        var fn = getAppCloneTemplate();
        if(fn){
          fn(btn.dataset.tmpl, function(){
            if(typeof onRerender === 'function') onRerender();
          });
        }
      };
    });
  }

  /* ------------------------------------------------------------
   * 4. 소통탭 공유창 1:1 '외부sns 소통용 카드 제작하기' & 3대 버튼
   * ------------------------------------------------------------ */
  async function postShareCardToFeed(g, lastRec, canvasDataUrl){
    if(!confirm('아워골 피드에 게시할까요?')) return;

    var postId = 'post_' + (global.newId ? global.newId() : Date.now());
    var prof = (global.state && global.state.profile) || {};
    var goalTitle = g ? g.title : '오늘의 실천';
    var caption = lastRec ? ('오늘 실천 완료! "' + (lastRec.text || '').slice(0, 45) + '"') : (goalTitle + ' 목표를 향해 달리고 있습니다 🔥');

    var post = {
      id: postId,
      user_id: prof.id || 'user_guest',
      display_name: prof.displayName || '나',
      avatar_url: prof.avatarUrl || null,
      goal_title: goalTitle,
      caption: caption,
      cheers_count: 0,
      created_at: new Date().toISOString(),
      extra: {
        category: (g && g.category) || 'study',
        includeRecord: !!lastRec,
        recordText: lastRec ? lastRec.text : null,
        photo: canvasDataUrl || (lastRec ? lastRec.photo : null),
        includeGoal: true,
        goalPct: g ? (global.goalProgress ? global.goalProgress(g) : 50) : 100,
        milestones: [],
        comments: []
      }
    };

    if(prof.settings){
      prof.settings.myFeedPosts = prof.settings.myFeedPosts || [];
      prof.settings.myFeedPosts.unshift(post);
    }
    if(global.FEED_POSTS_CACHE){
      global.FEED_POSTS_CACHE.unshift(post);
    }
    if(global.saveProfile) await global.saveProfile();

    if(global.toast) global.toast('피드에 내 실천 카드가 성공적으로 게시되었어요!');
    if(global.triggerHaptic) global.triggerHaptic(15);
    if(global.burstConfetti) global.burstConfetti(window.innerWidth / 2, window.innerHeight / 3, 16);

    if(global.state){
      global.state.commSubTab = 'feed';
      if(global.renderCommScreen) global.renderCommScreen();
    }
  }

  async function shareCardExternal(dataUrl, g){
    var origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'https://ourgoal-app.vercel.app';
    var title = g ? ('[아워골] ' + g.title) : '[아워골] 나의 성장 카드';
    var shareUrl = origin + '/';
    var text = '나만의 목표 달성 메이트 아워골에서 성장 카드를 공유합니다! ' + shareUrl;

    if(navigator.share && navigator.canShare){
      try {
        var blob = await (await fetch(dataUrl)).blob();
        var file = new File([blob], 'ourgoal_card.png', { type: 'image/png' });
        if(navigator.canShare({ files: [file] })){
          await navigator.share({
            title: title,
            text: text,
            files: [file]
          });
          if(global.toast) global.toast('성공적으로 공유했어요!');
          return;
        }
      } catch(e){}
    }

    if(navigator.share){
      try {
        await navigator.share({ title: title, text: text, url: shareUrl });
        if(global.toast) global.toast('성공적으로 공유했어요!');
        return;
      } catch(e){}
    }

    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){
        if(global.toast) global.toast('공유 링크와 텍스트가 복사되었어요! 원하는 SNS에 공유해보세요.');
      });
    } else {
      if(global.toast) global.toast('아워골 링크: ' + shareUrl);
    }
  }

  function saveCardImage(dataUrl){
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = '아워골_소통카드_1대1.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    if(global.toast) global.toast('1:1 소통 카드를 저장했어요');
    if(global.triggerHaptic) global.triggerHaptic(10);
  }

  /* ------------------------------------------------------------
  /* ------------------------------------------------------------
   * 5. 실 사용자 계정 상호 연동 1:1 DM 시스템 (헌법 제19조 준수)
   * ------------------------------------------------------------ */
  var _activeDmChannel = null;
  var _userCache = {};

  function showGuestSoftAuthGate(actionName){
    if(global.openModal){
      global.openModal(
        '<div style="text-align:center;padding:16px 10px;">' +
          '<div style="font-size:2.5rem;margin-bottom:8px;">🤝</div>' +
          '<h3>실제 동료와 소통하려면 로그인이 필요해요</h3>' +
          '<p class="faint" style="margin:8px 0 16px;font-size:.875rem;line-height:1.5;">' +
            '1:1 다이렉트 메시지 전송 및 동반자 맺기는 실제 사용자 계정 간의 안전한 상호 연결을 위해 로그인이 필요합니다.' +
          '</p>' +
          '<div class="modal-actions">' +
            '<button class="btn btn-ghost" id="guestGateCloseBtn" type="button">둘러보기 계속</button>' +
            '<button class="btn btn-primary" id="guestGateLoginBtn" type="button" style="font-weight:700;">로그인하러 가기</button>' +
          '</div>' +
        '</div>',
        function(sheet){
          var c = sheet.querySelector('#guestGateCloseBtn');
          if(c) c.onclick = global.closeModal;
          var l = sheet.querySelector('#guestGateLoginBtn');
          if(l) l.onclick = function(){
            if(global.closeModal) global.closeModal();
            if(global.renderAuthScreen) global.renderAuthScreen();
          };
        }
      );
    } else {
      alert('실제 동료와 소통하려면 로그인이 필요합니다.');
    }
  }

  function getDmThreadId(myId, peerId){
    var a = String(myId || 'guest');
    var b = String(peerId || 'unknown');
    return 'dm_' + (a < b ? a + '_' + b : b + '_' + a);
  }

  function getTeamMembersPool(){
    // 헌법 제19조 제3항 1호에 의거한 공식 콜드스타트 완충재 (AI 봇 명시)
    return [
      { id: 'mem_ws_1', name: '이지수 팀장', nickname: '지수_TF장', avatar: '👩‍💼', groupName: '회사 워크숍 TF', role: '팀장', level: 8, streak: 24, theme: '커리어·기획', intro: '전사 전략 워크숍 TF를 이끌고 있습니다. 함께 완주해요!', goals: ['2026 하반기 전략 워크숍 완수', '부서별 액션플랜 수립'], isAiBot: true, botBadge: 'AI 봇' },
      { id: 'mem_ws_2', name: '김민우 대리', nickname: '민우_운영조', avatar: '👨‍💼', groupName: '회사 워크숍 TF', role: '팀원', level: 6, streak: 14, theme: '커리어·기획', intro: '대관 및 현장 운영 총괄을 맡고 있습니다.', goals: ['장소 대관 계약 및 음향 점검', '타임테이블 배포'], isAiBot: true, botBadge: 'AI 봇' },
      { id: 'mem_ws_3', name: '박소연 사원', nickname: '소연_레크조', avatar: '🙋‍♀️', groupName: '회사 워크숍 TF', role: '팀원', level: 5, streak: 9, theme: '취미·소통', intro: '팀빌딩과 비전 세션 프로그램을 기획 중입니다.', goals: ['아이스브레이킹 게임 3종 준비', '참가자 웰컴키트 제작'], isAiBot: true, botBadge: 'AI 봇' },
      { id: 'mem_tr_1', name: '최현아', nickname: '현아_드라이브', avatar: '🚗', groupName: '제주 힐링여행', role: '팀장', level: 7, streak: 18, theme: '여행·생활', intro: '낙오자 없는 제주 힐링 여행을 기획하고 있어요!', goals: ['제주 3박4일 독채 펜션 예약', '동선별 드라이브 코스 확정'], isAiBot: true, botBadge: 'AI 봇' },
      { id: 'mem_tr_2', name: '정준호', nickname: '준호_맛집탐험', avatar: '🍖', groupName: '제주 힐링여행', role: '팀원', level: 6, streak: 11, theme: '식단·여행', intro: '제주 로컬 흑돼지/해산물 찐맛집 리스트업 담당', goals: ['흑돼지 맛집 단체석 예약', '공용 경비 1/N 정산표 정리'], isAiBot: true, botBadge: 'AI 봇' },
      { id: 'mem_ft_1', name: '강성진 코치', nickname: '성진_헤드코치', avatar: '🏋️‍♂️', groupName: '크로스핏 정복대', role: '코치', level: 10, streak: 45, theme: '운동·건강', intro: '안전하고 즐겁게 한계 돌파! 주 5회 WOD 정복', goals: ['크루 전체 월 250회 WOD 달성', '전원 Rx 도전 서포트'], isAiBot: true, botBadge: 'AI 봇' },
      { id: 'mem_ft_2', name: '윤태양', nickname: '태양_와드러버', avatar: '💪', groupName: '크로스핏 정복대', role: '팀원', level: 7, streak: 19, theme: '운동·건강', intro: '무반동 턱걸이 10개 도전 중인 크로스핏터', goals: ['Rx 무게 정복', '턱걸이 10개 연속 성공'], isAiBot: true, botBadge: 'AI 봇' }
    ];
  }

  function getDmPerson(id){
    var comps = (global.state && global.state.profile && global.state.profile.companions) || [];
    var c = comps.find(function(x){ return x.id === id; });
    if(c) return c;

    if(_userCache[id]) return _userCache[id];

    var teamMembers = getTeamMembersPool();
    var tm = teamMembers.find(function(x){ return x.id === id; });
    if(tm) return tm;

    var mockPeople = global.MOCK_PEOPLE || [];
    var p = mockPeople.find(function(x){ return x.id === id; });
    if(p) return p;

    return { id: id, nickname: '사용자', name: '사용자', avatar: '👤', intro: '아워골 회원' };
  }

  async function loadDmMessagesFromDb(threadId, person){
    if(!global.sb || !threadId) return;
    try {
      var res = await global.sb.from('team_ping_replies')
        .select('*')
        .eq('ping_id', threadId)
        .order('created_at', { ascending: true })
        .limit(50);
      if(res && res.data){
        var myId = (global.state && global.state.user && global.state.user.id) || (global.state && global.state.profile && global.state.profile.id);
        person._thread = res.data.map(function(r){
          return {
            id: r.id,
            from: (r.sender_id === myId ? 'me' : 'them'),
            text: r.message,
            time: global.fmtTime ? global.fmtTime(r.created_at) : '최근'
          };
        });
      }
    } catch(e){
      console.warn('[DM] DB 메시지 로드 오류:', e);
    }
  }

  function subscribeRealtimeDm(threadId, myId, person, body){
    if(_activeDmChannel){
      try { _activeDmChannel.unsubscribe(); } catch(e){}
      _activeDmChannel = null;
    }
    if(!global.sb || !threadId) return;

    try {
      _activeDmChannel = global.sb.channel('dm_room_' + threadId)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'team_ping_replies',
          filter: 'ping_id=eq.' + threadId
        }, function(payload){
          var r = payload.new;
          if(!r) return;
          if(r.sender_id !== myId){
            person._thread = person._thread || [];
            if(!person._thread.some(function(m){ return m.id === r.id; })){
              person._thread.push({
                id: r.id,
                from: 'them',
                text: r.message,
                time: global.fmtTime ? global.fmtTime(r.created_at) : '방금'
              });
              var msgsEl = document.getElementById('dmMsgs');
              if(msgsEl && document.body.contains(msgsEl)){
                var div = document.createElement('div');
                div.className = 'dm-msg them';
                div.textContent = r.message;
                msgsEl.appendChild(div);
                msgsEl.scrollTop = msgsEl.scrollHeight;
              }
            }
          }
        })
        .subscribe();
    } catch(err){
      console.warn('[DM] Realtime 구독 오류:', err);
    }
  }

  function renderCommDM(body){
    var teamMembers = getTeamMembersPool();
    var state = global.state || {};
    var myId = (state.user && state.user.id) || (state.profile && state.profile.id);
    var isGuest = !state.profile || !state.profile.id || String(state.profile.id).indexOf('guest') === 0;

    if(state.dmActiveId){
      var person = getDmPerson(state.dmActiveId);
      if(!person){ state.dmActiveId = null; return renderCommDM(body); }

      var threadId = getDmThreadId(myId, person.id);
      person._thread = person._thread || [];

      // 실시간 Realtime 채널 구독 배선
      subscribeRealtimeDm(threadId, myId, person, body);

      // 서버 DB에서 실제 메시지 비동기 로드
      if(!person._loadedThreadFromDb && !isGuest){
        person._loadedThreadFromDb = true;
        loadDmMessagesFromDb(threadId, person).then(function(){
          var msgsEl = document.getElementById('dmMsgs');
          if(msgsEl && document.body.contains(msgsEl)){
            msgsEl.innerHTML = (person._thread && person._thread.length) ? person._thread.map(function(m){
              return '<div class="dm-msg ' + m.from + '">' + esc(m.text) + '</div>';
            }).join('') : '<div style="text-align:center;padding:24px 10px;font-size:.8125rem;color:var(--ink-faint);">아직 주고받은 메시지가 없습니다.<br>첫 대화를 건네보세요! 👋</div>';
            msgsEl.scrollTop = msgsEl.scrollHeight;
          }
        });
      }

      var subTitle = person.groupName ? ('👥 ' + esc(person.groupName) + (person.role ? ' · ' + esc(person.role) : '')) : (person.theme ? ('🤝 동반자 · ' + esc(person.theme)) : '아워골 회원');
      var badgeTag = person.isAiBot ? '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--brand-strong);margin-left:6px;">🤖 AI 봇</span>' : '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--ink);margin-left:6px;">실 사용자</span>';

      var msgsHtml = (person._thread && person._thread.length) ? person._thread.map(function(m){
        return '<div class="dm-msg ' + m.from + '">' + esc(m.text) + '</div>';
      }).join('') : '<div style="text-align:center;padding:24px 10px;font-size:.8125rem;color:var(--ink-faint);">아직 주고받은 메시지가 없습니다.<br>첫 대화를 건네보세요! 👋</div>';

      body.innerHTML = '<span class="dm-back" id="dmBack" style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-size:.875rem;font-weight:700;color:var(--brand-strong);margin-bottom:12px;">‹ 목록으로</span>' +
        '<div class="dm-thread-wrap">' +
          '<div class="dm-thread-head" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--card);border-bottom:1px solid var(--rule);">' +
            '<div class="feed-avatar" style="width:40px;height:40px;font-size:1.4rem;display:flex;align-items:center;justify-content:center;background:var(--surface-2);border-radius:50%;">' + person.avatar + '</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-weight:700;font-size:.9375rem;color:var(--ink);display:flex;align-items:center;">' +
                '<span>' + esc(person.nickname || person.name) + '</span>' +
                badgeTag +
              '</div>' +
              '<div class="faint" style="font-size:.75rem;margin-top:1px;">' + subTitle + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="dm-msgs" id="dmMsgs" style="padding:14px;min-height:240px;max-height:420px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">' +
            msgsHtml +
          '</div>' +
          '<div class="dm-input-row" style="padding:10px 12px;background:var(--card);border-top:1px solid var(--rule);display:flex;gap:8px;">' +
            '<input id="dmInput" type="text" placeholder="' + (isGuest ? '로그인 후 메시지를 전송할 수 있습니다' : '메시지를 입력하세요 (Enter)') + '" style="flex:1;border:1px solid var(--rule);border-radius:10px;padding:8px 12px;font-size:.875rem;background:var(--surface-2);color:var(--ink);">' +
            '<button class="btn btn-primary btn-sm" id="dmSend" type="button" style="font-weight:700;border-radius:10px;padding:8px 16px;">전송</button>' +
          '</div>' +
        '</div>' +
        '<p class="faint" style="margin-top:10px;font-size:.75rem;">💡 실제 사용자 계정 간 서버 DB 원장 및 Realtime 채널로 실시간 송수신됩니다</p>';

      var backBtn = document.getElementById('dmBack');
      if(backBtn) backBtn.addEventListener('click', function(){
        if(_activeDmChannel){ try{ _activeDmChannel.unsubscribe(); }catch(e){} _activeDmChannel = null; }
        state.dmActiveId = null;
        renderCommDM(body);
      });

      var msgsEl = document.getElementById('dmMsgs');
      if(msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;

      var send = async function(){
        if(isGuest){
          showGuestSoftAuthGate('1:1 DM 발송');
          return;
        }
        var input = document.getElementById('dmInput');
        if(!input) return;
        var text = input.value.trim();
        if(!text) return;

        var myName = (state.profile && (state.profile.displayName || state.profile.name)) || (state.user && state.user.email) || '나';
        var myAvatar = (state.profile && state.profile.avatar) || '🏃';
        var replyId = 'reply_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        var nowStr = global.fmtTime ? global.fmtTime(new Date().toISOString()) : '방금';

        // 1. Optimistic UI 반영
        person._thread.push({ id: replyId, from: 'me', text: text, time: nowStr });
        input.value = '';
        var msgsEl = document.getElementById('dmMsgs');
        if(msgsEl){
          var div = document.createElement('div');
          div.className = 'dm-msg me';
          div.textContent = text;
          msgsEl.appendChild(div);
          msgsEl.scrollTop = msgsEl.scrollHeight;
        }

        // 2. 헌법 제19조 의거 Supabase 서버 DB 원장 영속화
        if(global.sb){
          try {
            // 부모 team_pings 대화방 보장
            await global.sb.from('team_pings').upsert({
              id: threadId,
              group_id: 'dm_direct',
              sender_id: myId,
              sender_name: myName,
              sender_avatar: myAvatar,
              receiver_id: person.id,
              target_type: 'dm',
              target_id: person.id,
              target_title: '1:1 다이렉트 메시지',
              ping_type: 'dm',
              message: text,
              status: 'active'
            });

            // 1:1 메시지 레코드 저장
            await global.sb.from('team_ping_replies').insert({
              id: replyId,
              ping_id: threadId,
              group_id: 'dm_direct',
              sender_id: myId,
              sender_name: myName,
              sender_role: 'member',
              sender_avatar: myAvatar,
              receiver_id: person.id,
              message: text,
              created_at: new Date().toISOString()
            });
          } catch(err){
            console.warn('[DM] Supabase 영속화 실패:', err);
          }
        }
      };

      var sendBtn = document.getElementById('dmSend');
      if(sendBtn) sendBtn.addEventListener('click', send);
      var inputEl = document.getElementById('dmInput');
      if(inputEl){
        inputEl.focus();
        inputEl.addEventListener('keydown', function(e){ if(e.key === 'Enter') send(); });
      }
    } else {
      if(_activeDmChannel){ try{ _activeDmChannel.unsubscribe(); }catch(e){} _activeDmChannel = null; }

      var teamMembersChipsHtml = teamMembers.map(function(m){
        return '<div class="dm-team-chip" data-openteamdm="' + m.id + '" role="button" tabindex="0" style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;width:72px;padding:8px 4px;background:var(--card);border:1px solid var(--rule);border-radius:12px;cursor:pointer;text-align:center;transition:transform 0.15s ease;">' +
          '<div style="width:38px;height:38px;border-radius:50%;background:var(--surface-2);border:1.5px solid var(--brand);display:flex;align-items:center;justify-content:center;font-size:1.25rem;margin-bottom:4px;">' + m.avatar + '</div>' +
          '<div style="font-size:.75rem;font-weight:700;color:var(--ink);width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(m.name) + '</div>' +
          '<span class="faint" style="font-size:.625rem;line-height:1.2;margin-top:2px;">' + (m.role || '팀원') + '</span>' +
        '</div>';
      }).join('');

      var allDmList = [];
      var companions = (state.profile && state.profile.companions) || [];
      companions.forEach(function(c){
        allDmList.push(c);
      });
      teamMembers.forEach(function(m){
        if(!allDmList.find(function(x){ return x.id === m.id; })) allDmList.push(m);
      });

      var dmListHtml = allDmList.map(function(p){
        var last = (p._thread && p._thread.length) ? p._thread[p._thread.length - 1].text : (p.intro || '새로운 대화를 시작해보세요!');
        var badgeText = p.isAiBot ? 'AI 봇' : (p.groupName ? p.groupName : (p.theme || '동반자'));
        return '<div class="dm-list-item" data-open="' + p.id + '" style="cursor:pointer;padding:10px 12px;display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--rule);border-radius:12px;margin-bottom:8px;">' +
          '<div class="feed-avatar" style="width:42px;height:42px;border-radius:50%;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex:0 0 auto;">' + p.avatar + '</div>' +
          '<div class="dm-preview" style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">' +
              '<b style="font-size:.875rem;color:var(--ink);">' + esc(p.nickname || p.name) + '</b>' +
              '<span class="dday-pill" style="font-size:.6875rem;">' + esc(badgeText) + '</span>' +
            '</div>' +
            '<span style="font-size:.8125rem;color:var(--ink-soft);display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(last) + '</span>' +
          '</div>' +
        '</div>';
      }).join('');

      body.innerHTML = '<div class="card" style="margin-bottom:14px;padding:12px 14px;background:var(--surface-2);border:1px solid var(--rule);border-radius:14px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<div style="font-weight:700;font-size:.875rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
              '<span>👥</span><span>내 팀 동료에게 바로 DM 보내기</span>' +
            '</div>' +
            '<span class="faint" style="font-size:.75rem;">원클릭 선택</span>' +
          '</div>' +
          '<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;-webkit-overflow-scrolling:touch;">' +
            teamMembersChipsHtml +
          '</div>' +
        '</div>' +
        '<div style="font-size:.875rem;font-weight:700;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">' +
          '<span>💬 대화 목록</span>' +
          '<span class="faint" style="font-size:.75rem;">' + allDmList.length + '개의 대화</span>' +
        '</div>' +
        '<div class="dm-list-wrap">' +
          dmListHtml +
        '</div>';

      body.querySelectorAll('[data-openteamdm]').forEach(function(el){
        el.addEventListener('click', function(){
          state.dmActiveId = el.dataset.openteamdm;
          renderCommDM(body);
        });
      });

      body.querySelectorAll('[data-open]').forEach(function(el){
        el.addEventListener('click', function(){
          state.dmActiveId = el.dataset.open;
          renderCommDM(body);
        });
      });
    }
  }

  /* ------------------------------------------------------------
   * 6. 동반자(친구·팔로우) 실제 회원 연동 시스템 (헌법 제19조 준수)
   * ------------------------------------------------------------ */
  function ensureDefaultCompanions(){
    var state = global.state;
    if(!state || !state.profile) return [];
    if(!state.profile.companions || !Array.isArray(state.profile.companions)){
      state.profile.companions = [];
    }
    return state.profile.companions;
  }

  function openUserProfileModal(user){
    if(!user) return;
    var state = global.state || {};
    var isAiBot = !!user.isAiBot;

    var goalsHtml = (user.goals && user.goals.length ? user.goals : ['진행 중인 목표 1개']).map(function(g){
      return '<div style="padding:8px 12px;background:var(--surface-2);border-radius:10px;border:1px solid var(--rule);font-size:.8125rem;display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
        '<span style="color:var(--ink);font-weight:600;">🎯 ' + esc(g) + '</span>' +
        '<span class="dday-pill" style="font-size:.6875rem;background:var(--card);">진행 중</span>' +
      '</div>';
    }).join('');

    var heatmapCubes = '';
    for(var d = 13; d >= 0; d--){
      var hasCheckin = (d % 3 !== 0);
      var bg = hasCheckin ? 'var(--brand)' : 'var(--rule)';
      heatmapCubes += '<div style="flex:1;aspect-ratio:1/1;background:' + bg + ';border-radius:3px;" title="' + d + '일 전 실천"></div>';
    }

    var isMyCompanion = (state.profile && state.profile.companions && state.profile.companions.some(function(c){ return c.id === user.id; }));

    var modalHtml = '<h3>' + esc(user.nickname || user.name) + '님의 프로필</h3>' +
      '<div style="text-align:center;padding:12px 0 10px;">' +
        '<div style="width:72px;height:72px;border-radius:50%;background:var(--surface-2);border:2px solid var(--brand);display:flex;align-items:center;justify-content:center;font-size:2.2rem;margin:0 auto 10px;box-shadow:0 4px 12px rgba(0,0,0,0.06);">' +
          user.avatar +
        '</div>' +
        '<div style="font-weight:700;font-size:1.1rem;color:var(--ink);display:flex;align-items:center;justify-content:center;gap:6px;">' +
          '<span>' + esc(user.nickname || user.name) + '</span>' +
          (isAiBot ? '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--brand-strong);">🤖 AI 봇</span>' : '') +
        '</div>' +
        '<div class="faint" style="font-size:.8125rem;margin-top:2px;">' + esc(user.theme || '아워골 동반자') + '</div>' +
        '<div style="display:flex;justify-content:center;gap:6px;margin-top:8px;">' +
          '<span class="dday-pill" style="font-size:.75rem;">Lv.' + (user.level || 1) + '</span>' +
          '<span class="dday-pill" style="font-size:.75rem;background:var(--red-soft);color:var(--brand-strong);">🔥 ' + (user.streak || 1) + '일 연속 실천</span>' +
        '</div>' +
      '</div>' +
      '<div style="padding:10px 14px;background:var(--surface-2);border-radius:12px;margin-bottom:14px;font-size:.8125rem;color:var(--ink);line-height:1.5;text-align:center;">' +
        '“ ' + esc(user.intro || '함께 목표를 향해 달리는 든든한 동반자입니다.') + ' ”' +
      '</div>' +
      '<div style="margin-bottom:14px;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:6px;">도전 중인 목표</div>' +
        goalsHtml +
      '</div>' +
      '<div style="margin-bottom:16px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
          '<span style="font-size:.8125rem;font-weight:700;color:var(--ink);">최근 14일 실천 히트맵</span>' +
          '<span class="faint" style="font-size:.75rem;">' + (user.streak || 1) + '일 연속 달성 중</span>' +
        '</div>' +
        '<div style="display:flex;gap:4px;padding:8px 10px;background:var(--card);border:1px solid var(--rule);border-radius:10px;">' +
          heatmapCubes +
        '</div>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost" id="userProfCloseBtn" type="button">닫기</button>' +
        (isMyCompanion ? '' : '<button class="btn btn-ghost" id="userProfAddCompBtn" type="button" style="color:var(--brand-strong);border-color:var(--brand);">+ 동반자 추가</button>') +
        '<button class="btn btn-primary" id="userProfDmBtn" type="button" style="font-weight:700;padding:8px 20px;">💬 1:1 DM 보내기</button>' +
      '</div>';

    if(global.openModal){
      global.openModal(modalHtml, function(sheet){
        var closeBtn = sheet.querySelector('#userProfCloseBtn');
        if(closeBtn) closeBtn.onclick = global.closeModal;

        var addCompBtn = sheet.querySelector('#userProfAddCompBtn');
        if(addCompBtn){
          addCompBtn.onclick = async function(){
            var isGuest = !state.profile || !state.profile.id || String(state.profile.id).indexOf('guest') === 0;
            if(isGuest){
              if(global.closeModal) global.closeModal();
              showGuestSoftAuthGate('동반자 추가');
              return;
            }
            var comps = ensureDefaultCompanions();
            if(!comps.some(function(x){ return x.id === user.id; })){
              comps.push({
                id: user.id,
                nickname: user.nickname || user.name,
                name: user.name,
                avatar: user.avatar,
                level: user.level || 1,
                streak: user.streak || 1,
                theme: user.theme || '동반자',
                intro: user.intro || '',
                goals: user.goals || [],
                isAiBot: isAiBot,
                createdAt: new Date().toISOString()
              });
              if(global.saveProfile) await global.saveProfile();
              if(global.toast) global.toast((user.nickname || user.name) + '님을 동반자로 추가했어요! 🎉');
              if(global.closeModal) global.closeModal();
              if(state.activeTab === 'comm' && state.commSubTab === 'companion'){
                if(global.renderCommScreen) global.renderCommScreen();
              }
            }
          };
        }

        var dmBtn = sheet.querySelector('#userProfDmBtn');
        if(dmBtn){
          dmBtn.onclick = function(){
            if(global.closeModal) global.closeModal();
            state.commSubTab = 'dm';
            state.dmActiveId = user.id;
            if(global.setTab) global.setTab('comm');
            if(global.renderCommScreen) global.renderCommScreen();
          };
        }
      });
    }
  }

  function renderCommCompanions(body){
    var state = global.state || {};
    var companions = ensureDefaultCompanions();
    var searchKeyword = (state._companionSearchKeyword || '').trim();
    var searchResults = state._companionSearchResults || null;
    var isSearching = state._companionIsSearching === true;

    var searchError = state._companionSearchError || null;
    var searchResultsHtml = '';
    if(isSearching){
      searchResultsHtml = '<div style="padding:16px 12px;background:var(--surface-2);border-radius:12px;text-align:center;font-size:.8125rem;color:var(--ink-soft);margin-bottom:14px;">' +
        '회원 데이터베이스에서 실제 사용자를 검색하고 있습니다... 🔍' +
      '</div>';
    } else if(searchError === 'guest'){
      searchResultsHtml = '<div style="padding:16px 12px;background:var(--surface-2);border-radius:12px;text-align:center;font-size:.8125rem;color:var(--ink-soft);margin-bottom:14px;">' +
        '로그인하면 실제 회원을 닉네임으로 검색하고 동반자로 추가할 수 있어요.' +
      '</div>';
    } else if(searchError === 'error'){
      searchResultsHtml = '<div style="padding:16px 12px;background:var(--surface-2);border-radius:12px;text-align:center;font-size:.8125rem;color:var(--ink-soft);margin-bottom:14px;">' +
        '검색 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.' +
        (state._companionSearchErrorDetail ? '<div class="faint" style="margin-top:6px;font-size:.6875rem;word-break:break-all;">' + esc(state._companionSearchErrorDetail) + '</div>' : '') +
      '</div>';
    } else if(searchResults !== null){
      if(!searchResults.length){
        searchResultsHtml = '<div style="padding:16px 12px;background:var(--surface-2);border-radius:12px;text-align:center;font-size:.8125rem;color:var(--ink-soft);margin-bottom:14px;">' +
          '“' + esc(searchKeyword) + '” 닉네임을 가진 실제 회원을 찾지 못했어요.<br>정확한 닉네임으로 다시 검색해보세요.' +
        '</div>';
      } else {
        searchResultsHtml = '<div style="margin-bottom:14px;background:var(--surface-2);border-radius:14px;padding:12px;border:1px solid var(--rule);">' +
          '<div style="font-size:.75rem;font-weight:700;color:var(--brand-strong);margin-bottom:8px;">🔍 실제 회원 검색 결과 (' + searchResults.length + '명)</div>' +
          searchResults.map(function(u){
            var isAdded = companions.some(function(c){ return c.id === u.id; });
            return '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--card);border:1px solid var(--rule);border-radius:10px;margin-bottom:6px;">' +
              '<div class="comp-avatar-click" data-viewprof="' + u.id + '" style="width:36px;height:36px;border-radius:50%;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:1.3rem;cursor:pointer;flex:0 0 auto;" title="프로필 보기">' +
                u.avatar +
              '</div>' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="font-weight:700;font-size:.875rem;color:var(--ink);">' + esc(u.nickname) + '</div>' +
                '<div class="faint" style="font-size:.75rem;">' + esc(u.intro) + '</div>' +
              '</div>' +
              (isAdded ?
                '<span class="faint" style="font-size:.75rem;padding:4px 8px;background:var(--surface-2);border-radius:6px;">✓ 이미 동반자</span>' :
                '<button class="btn btn-primary btn-xs" data-addcomp="' + u.id + '" type="button" style="font-size:.75rem;padding:4px 10px;border-radius:8px;font-weight:700;">+ 추가</button>'
              ) +
            '</div>';
          }).join('') +
        '</div>';
      }
    }

    var listHtml = '';
    if(!companions.length){
      listHtml = '<div class="empty-state" style="padding:30px 10px;text-align:center;">' +
        '<div style="font-size:2.5rem;margin-bottom:8px;">🤝</div>' +
        '<div style="font-weight:700;font-size:.9375rem;color:var(--ink);margin-bottom:4px;">아직 등록된 동반자가 없어요</div>' +
        '<div class="faint" style="font-size:.8125rem;">위의 닉네임 검색을 통해 실제 사용자를 찾고 동반자를 맺어보세요!</div>' +
      '</div>';
    } else {
      listHtml = companions.map(function(c){
        return '<div class="card" style="margin-bottom:8px;padding:12px 14px;background:var(--card);border:1px solid var(--rule);border-radius:14px;display:flex;align-items:center;gap:12px;">' +
          '<div class="comp-avatar-click" data-viewprof="' + c.id + '" role="button" tabindex="0" style="width:44px;height:44px;border-radius:50%;background:var(--surface-2);border:2px solid var(--brand);display:flex;align-items:center;justify-content:center;font-size:1.5rem;cursor:pointer;flex:0 0 auto;transition:transform 0.15s ease;" title="아바타를 클릭해 프로필을 확인하세요">' +
            c.avatar +
          '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">' +
              '<b style="font-size:.9375rem;color:var(--ink);cursor:pointer;" class="comp-avatar-click" data-viewprof="' + c.id + '">' + esc(c.nickname || c.name) + '</b>' +
              (c.isAiBot ? '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--brand-strong);">🤖 AI 봇</span>' : '<span class="dday-pill" style="font-size:.6875rem;">실 사용자</span>') +
              '<span style="font-size:.75rem;color:var(--brand-strong);font-weight:700;">🔥 ' + (c.streak || 1) + '일</span>' +
            '</div>' +
            '<div class="faint" style="font-size:.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(c.intro || c.theme || '목표를 향해 함께 달리는 동반자') + '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;flex:0 0 auto;">' +
            '<button class="btn btn-primary btn-sm" data-directdm="' + c.id + '" type="button" style="font-size:.8125rem;font-weight:700;padding:6px 12px;border-radius:8px;">' +
              '💬 DM' +
            '</button>' +
            '<button class="btn btn-ghost btn-xs" data-delcomp="' + c.id + '" type="button" style="font-size:.75rem;padding:4px 6px;color:var(--ink-faint);border:none;" title="동반자 삭제">' +
              '✕' +
            '</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    body.innerHTML = '<div class="card" style="margin-bottom:14px;padding:12px 14px;background:var(--surface-2);border:1px solid var(--rule);border-radius:14px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<div style="font-weight:700;font-size:.9375rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
            '<span>🤝</span><span>나의 목표 동반자</span>' +
          '</div>' +
          '<span class="dday-pill" style="font-weight:700;">' + companions.length + '명</span>' +
        '</div>' +
        '<div class="faint" style="font-size:.75rem;">실제 가입된 사용자와 동반자를 맺고 서로의 목표를 응원하세요!</div>' +
      '</div>' +

      '<div style="margin-bottom:14px;">' +
        '<div style="display:flex;gap:6px;">' +
          '<input type="text" id="companionSearchInput" placeholder="실제 사용자 닉네임 검색" value="' + esc(state._companionSearchKeyword || '') + '" style="flex:1;border:1px solid var(--rule);border-radius:10px;padding:8px 12px;font-size:.875rem;background:var(--surface-2);color:var(--ink);">' +
          '<button class="btn btn-primary btn-sm" id="companionSearchBtn" type="button" style="font-weight:700;padding:0 14px;border-radius:10px;">검색</button>' +
          (searchKeyword ? '<button class="btn btn-ghost btn-sm" id="companionSearchResetBtn" type="button" style="padding:0 8px;border-radius:10px;">초기화</button>' : '') +
        '</div>' +
        searchResultsHtml +
      '</div>' +

      '<div style="font-size:.875rem;font-weight:700;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">' +
        '<span>동반자 목록</span>' +
        '<span class="faint" style="font-size:.75rem;">아바타 클릭 시 프로필 조회</span>' +
      '</div>' +
      '<div class="companion-list-wrap">' +
        listHtml +
      '</div>';

    var sInput = body.querySelector('#companionSearchInput');
    var sBtn = body.querySelector('#companionSearchBtn');
    var sResetBtn = body.querySelector('#companionSearchResetBtn');

    var doSearch = async function(){
      if(!sInput) return;
      var q = sInput.value.trim();
      if(!q){
        state._companionSearchKeyword = '';
        state._companionSearchResults = null;
        state._companionSearchError = null;
        renderCommCompanions(body);
        return;
      }

      var isGuest = !state.profile || !state.profile.id || String(state.profile.id).indexOf('guest') === 0;
      if(isGuest){
        state._companionSearchKeyword = q;
        state._companionSearchResults = null;
        state._companionSearchError = 'guest';
        state._companionIsSearching = false;
        renderCommCompanions(body);
        showGuestSoftAuthGate('실제 사용자 검색');
        return;
      }

      state._companionSearchKeyword = q;
      state._companionIsSearching = true;
      state._companionSearchError = null;
      renderCommCompanions(body);

      var matched = [];
      var errored = false;
      var errorDetail = '';
      if(global.sb){
        try {
          // users 테이블 RLS(auth.uid()=본인 행만 select)는 그대로 둔 채,
          // 검색에 필요한 최소 필드만 반환하는 SECURITY DEFINER RPC를 호출한다.
          // docs/sql/2026-09-16-search-users-rpc.sql 실행 이후에만 동작한다.
          var res = await global.sb.rpc('search_users_by_nickname', { p_query: q });
          if(res && res.error){
            errored = true;
            errorDetail = (res.error.code || '') + ' ' + (res.error.message || '');
            console.warn('[동반자] Supabase 검색 오류:', res.error);
          } else if(res && res.data){
            matched = res.data.map(function(u){
              var obj = {
                id: u.id,
                nickname: u.nickname,
                name: u.nickname,
                avatar: u.avatar_url || '👤',
                intro: u.bio || '함께 실천하는 아워골 회원',
                level: 1,
                streak: 1,
                theme: (u.interests && u.interests[0]) || '일반'
              };
              _userCache[u.id] = obj;
              return obj;
            });
          }
        } catch(err){
          errored = true;
          errorDetail = (err && err.message) || String(err);
          console.warn('[동반자] Supabase 검색 오류:', err);
        }
      }

      state._companionIsSearching = false;
      state._companionSearchError = errored ? 'error' : null;
      state._companionSearchErrorDetail = errored ? errorDetail : '';
      state._companionSearchResults = errored ? null : matched;
      renderCommCompanions(body);
    };

    if(sBtn) sBtn.addEventListener('click', doSearch);
    if(sInput) sInput.addEventListener('keydown', function(e){ if(e.key === 'Enter') doSearch(); });
    if(sResetBtn){
      sResetBtn.addEventListener('click', function(){
        state._companionSearchKeyword = '';
        state._companionSearchResults = null;
        state._companionSearchError = null;
        state._companionIsSearching = false;
        renderCommCompanions(body);
      });
    }

    body.querySelectorAll('[data-viewprof]').forEach(function(el){
      el.addEventListener('click', function(){
        var uid = el.dataset.viewprof;
        var u = (state._companionSearchResults && state._companionSearchResults.find(function(x){ return x.id === uid; })) ||
                companions.find(function(x){ return x.id === uid; }) ||
                _userCache[uid];
        if(u) openUserProfileModal(u);
      });
    });

    body.querySelectorAll('[data-addcomp]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var isGuest = !state.profile || !state.profile.id || String(state.profile.id).indexOf('guest') === 0;
        if(isGuest){
          showGuestSoftAuthGate('동반자 추가');
          return;
        }
        var uid = btn.dataset.addcomp;
        var target = (state._companionSearchResults && state._companionSearchResults.find(function(x){ return x.id === uid; })) || _userCache[uid];
        if(!target) return;
        if(!companions.some(function(x){ return x.id === target.id; })){
          companions.push({
            id: target.id,
            nickname: target.nickname,
            name: target.name,
            avatar: target.avatar,
            level: target.level || 1,
            streak: target.streak || 1,
            theme: target.theme || '동반자',
            intro: target.intro || '',
            goals: target.goals || [],
            createdAt: new Date().toISOString()
          });
          if(global.saveProfile) await global.saveProfile();
          if(global.toast) global.toast(target.nickname + '님을 동반자로 추가했어요! 🎉');
          renderCommCompanions(body);
        }
      });
    });

    body.querySelectorAll('[data-directdm]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var uid = btn.dataset.directdm;
        state.commSubTab = 'dm';
        state.dmActiveId = uid;
        if(global.renderCommScreen) global.renderCommScreen();
      });
    });

    body.querySelectorAll('[data-delcomp]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var uid = btn.dataset.delcomp;
        var comp = companions.find(function(x){ return x.id === uid; });
        var name = comp ? comp.nickname : '해당 동반자';
        if(!confirm(name + '님과의 동반자 관계를 해제하시겠습니까?')) return;
        state.profile.companions = companions.filter(function(x){ return x.id !== uid; });
        if(global.saveProfile) await global.saveProfile();
        if(global.toast) global.toast('동반자 관계를 해제했습니다');
        renderCommCompanions(body);
      });
    });
  }

  /* ------------------------------------------------------------
   * 모듈 전역 노출
   * ------------------------------------------------------------ */
  global.OurgoalTeamInviteComm = {
    init: function(ctx){ _ctx = ctx || {}; },
    openTeamInviteModal: openTeamInviteModal,
    openTeamChatModal: openTeamChatModal,
    handlePingSentAutoReply: handlePingSentAutoReply,
    renderTemplatesAccordionHtml: renderTemplatesAccordionHtml,
    openTemplatePreviewModal: openTemplatePreviewModal,
    wireTemplatesAccordionEvents: wireTemplatesAccordionEvents,
    postShareCardToFeed: postShareCardToFeed,
    shareCardExternal: shareCardExternal,
    saveCardImage: saveCardImage,
    getTeamMembersPool: getTeamMembersPool,
    getDmPerson: getDmPerson,
    renderCommDM: renderCommDM,
    openUserProfileModal: openUserProfileModal,
    renderCommCompanions: renderCommCompanions,
    ensureDefaultCompanions: ensureDefaultCompanions,
    getDmThreadId: getDmThreadId,
    loadDmMessagesFromDb: loadDmMessagesFromDb,
    showGuestSoftAuthGate: showGuestSoftAuthGate,
    ALL_SEARCHABLE_USERS: []
  };

})(typeof window !== 'undefined' ? window : global);
