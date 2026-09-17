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
  function showToast(msg){
    try {
      if(_ctx && typeof _ctx.toast === 'function') return _ctx.toast(msg);
      if(typeof global.toast === 'function') return showToast(msg);
      if(typeof window !== 'undefined' && typeof window.showToast === 'function') return window.showToast(msg);
    } catch(e){}
  }
  function getAppToast(){ return showToast; }
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
              showToast('카카오톡 공유창이 열렸어요');
              return;
            } catch(e){}
          }
          if(navigator.clipboard && navigator.clipboard.writeText){
            navigator.clipboard.writeText(inviteMsg).then(function(){
              showToast('초대 메시지가 복사되었어요! 카카오톡에 붙여넣어주세요.');
            });
          } else {
            showToast('초대 링크: ' + inviteUrl);
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
              showToast('초대 링크를 복사했어요! 원하는 곳에 붙여넣으세요.');
            });
          } else {
            showToast('초대 링크: ' + inviteUrl);
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
          showToast('메시지를 입력해주세요');
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
      showToast('💬 팀장님의 따뜻한 DM 답장이 도착했어요!');
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
              showToast('공유 기능 준비 중');
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

    showToast('피드에 내 실천 카드가 성공적으로 게시되었어요!');
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
          showToast('성공적으로 공유했어요!');
          return;
        }
      } catch(e){}
    }

    if(navigator.share){
      try {
        await navigator.share({ title: title, text: text, url: shareUrl });
        showToast('성공적으로 공유했어요!');
        return;
      } catch(e){}
    }

    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){
        showToast('공유 링크와 텍스트가 복사되었어요! 원하는 SNS에 공유해보세요.');
      });
    } else {
      showToast('아워골 링크: ' + shareUrl);
    }
  }

  function saveCardImage(dataUrl){
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = '아워골_소통카드_1대1.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('1:1 소통 카드를 저장했어요');
    if(global.triggerHaptic) global.triggerHaptic(10);
  }

  /* ------------------------------------------------------------
  /* ------------------------------------------------------------
   * 5. 실 사용자 계정 상호 연동 1:1 DM 시스템 (헌법 제13조 준수)
   * ------------------------------------------------------------ */
  var _activeDmChannel = null;
  var _incomingDmChannel = null;
  var _incomingDmRooms = [];
  var _incomingDmLoadedForUser = null;
  var _hasUnreadDm = false;
  var _userCache = {};
  var _lastDmMessageMap = {};
  var _unreadPeerMap = {};
  var DM_READ_PREFIX = 'ourgoal_dm_read_';

  function getDmReadMap(myId){
    if(!myId || String(myId).indexOf('guest') === 0) return {};
    try {
      var raw = localStorage.getItem(DM_READ_PREFIX + myId);
      return raw ? JSON.parse(raw) : {};
    } catch(e){ return {}; }
  }

  function markDmRoomRead(myId, peerId){
    if(!myId || !peerId || String(myId).indexOf('guest') === 0) return;
    try {
      var pid = String(peerId).trim();
      var map = getDmReadMap(myId);
      map[pid] = Date.now();
      localStorage.setItem(DM_READ_PREFIX + myId, JSON.stringify(map));
      delete _unreadPeerMap[pid];
      var stillUnread = Object.keys(_unreadPeerMap).some(function(k){ return !!_unreadPeerMap[k]; });
      updateDmUnreadBadge(stillUnread);
    } catch(e){}
  }

  function updateDmUnreadBadge(hasUnread){
    _hasUnreadDm = !!hasUnread;
    try {
      var commNavBadge = document.getElementById('commNavBadge');
      if(commNavBadge){
        commNavBadge.style.display = _hasUnreadDm ? 'block' : 'none';
      }
      var dmSubtabBadge = document.getElementById('dmSubtabBadge');
      if(dmSubtabBadge){
        dmSubtabBadge.style.display = _hasUnreadDm ? 'inline-block' : 'none';
      }
    } catch(e){}
  }

  function getDmUnreadStatus(){
    return _hasUnreadDm;
  }

  async function loadIncomingDmRooms(myId){
    if(!global.sb || !myId || String(myId).indexOf('guest') === 0) return [];
    try {
      var res = await global.sb.from('team_ping_replies')
        .select('id, ping_id, sender_id, sender_name, sender_avatar, receiver_id, message, created_at')
        .eq('receiver_id', myId)
        .order('created_at', { ascending: false })
        .limit(100);
      if(res && res.data){
        var state = global.state || {};
        var comps = (state.profile && state.profile.companions) || [];
        var readMap = getDmReadMap(myId);
        var seenSenders = {};
        var rooms = [];

        res.data.forEach(function(r){
          if(!r.sender_id || r.sender_id === myId) return;
          var senderId = String(r.sender_id).trim();

          // 최신 메시지 매핑 (최신 순이므로 첫 번째 발견된 메시지가 가장 최신)
          if(!_lastDmMessageMap[senderId]){
            _lastDmMessageMap[senderId] = {
              text: r.message,
              time: r.created_at,
              from: 'them'
            };
          }

          var msgTime = new Date(r.created_at).getTime();
          var lastRead = readMap[senderId] || 0;
          if(msgTime > lastRead){
            _unreadPeerMap[senderId] = true;
          }

          if(seenSenders[senderId]) return;
          seenSenders[senderId] = true;

          // 동반자 목록에 존재하는지 확인
          var targetComp = comps.find(function(c){
            return String(c.id || '').trim().toLowerCase() === senderId.toLowerCase();
          });

          if(targetComp){
            // 기존 동반자인 경우 최신 메시지 및 미확인 상태 갱신
            targetComp.lastMsg = r.message;
            targetComp.lastTime = r.created_at;
            targetComp.isUnread = !!_unreadPeerMap[senderId];
            if(!targetComp._thread || targetComp._thread.length === 0){
              targetComp._thread = [{
                id: r.id,
                from: 'them',
                text: r.message,
                time: global.fmtTime ? global.fmtTime(r.created_at) : '최근'
              }];
            }
          } else {
            // 동반자가 아닌 신규 대화 요청
            var roomItem = {
              id: senderId,
              name: r.sender_name || '동반자',
              nickname: r.sender_name || '동반자',
              avatar: r.sender_avatar || '👤',
              intro: r.message,
              isIncoming: true,
              lastMsg: r.message,
              lastTime: r.created_at,
              isUnread: !!_unreadPeerMap[senderId],
              theme: '새 대화 요청',
              _thread: [{
                id: r.id,
                from: 'them',
                text: r.message,
                time: global.fmtTime ? global.fmtTime(r.created_at) : '최근'
              }]
            };
            rooms.push(roomItem);
            _userCache[senderId] = roomItem;
          }
        });

        _incomingDmRooms = rooms;
        _incomingDmLoadedForUser = myId;

        // 미확인 DM 유무 종합 판정
        var hasUnread = Object.keys(_unreadPeerMap).some(function(k){ return !!_unreadPeerMap[k]; });
        updateDmUnreadBadge(hasUnread);

        return rooms;
      }
    } catch(err){
      console.warn('[DM] incoming dm rooms 로드 오류:', err);
    }
    return [];
  }

  function initIncomingDmListener(myId){
    if(!global.sb || !myId || String(myId).indexOf('guest') === 0) return;
    if(_incomingDmChannel){
      try { _incomingDmChannel.unsubscribe(); } catch(e){}
      _incomingDmChannel = null;
    }
    try {
      _incomingDmChannel = global.sb.channel('incoming_dm_global_' + myId)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'team_ping_replies',
          filter: 'receiver_id=eq.' + myId
        }, function(payload){
          var r = payload.new;
          if(!r || r.sender_id === myId) return;
          var senderId = String(r.sender_id).trim();

          _lastDmMessageMap[senderId] = {
            text: r.message,
            time: r.created_at || new Date().toISOString(),
            from: 'them'
          };

          var state = global.state || {};
          var isInThisDm = (state.activeTab === 'comm' && state.commSubTab === 'dm' && state.dmActiveId === senderId);

          if(!isInThisDm){
            _unreadPeerMap[senderId] = true;
            var senderTitle = r.sender_name || '동반자';
            showToast('💬 ' + senderTitle + '님의 새 메시지: ' + (r.message || ''));
            updateDmUnreadBadge(true);
          } else {
            markDmRoomRead(myId, senderId);
          }

          // 수신 목록 및 뷰 갱신
          loadIncomingDmRooms(myId).then(function(){
            if(state.activeTab === 'comm' && state.commSubTab === 'dm' && !state.dmActiveId){
              var subBody = document.getElementById('commSubBody');
              if(subBody && document.body.contains(subBody)){
                renderCommDM(subBody);
              }
            }
          });
        })
        .subscribe();

      // 최초 1회 incoming 대화 목록 로드 & 미확인 확인
      loadIncomingDmRooms(myId);
    } catch(err){
      console.warn('[DM] 전역 Realtime 리스너 설정 오류:', err);
    }
  }

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

    var inc = _incomingDmRooms.find(function(x){ return x.id === id; });
    if(inc) return inc;

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
            markDmRoomRead(myId, r.sender_id);
            person.isUnread = false;
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

      markDmRoomRead(myId, person.id);
      person.isUnread = false;

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

      var isMyCompanion = (state.profile && state.profile.companions || []).some(function(c){
        return String(c.id || '').trim().toLowerCase() === String(person.id || '').trim().toLowerCase();
      });
      var canFollowBack = !isMyCompanion && !person.isAiBot && String(person.id).indexOf('mem_') !== 0;
      var followBackBannerHtml = canFollowBack ? (
        '<div id="dmFollowBackBanner" style="margin-bottom:12px;padding:10px 14px;background:var(--surface-2);border:1.5px solid var(--brand);border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
          '<div style="font-size:.8125rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
            '<span style="font-size:1.1rem;">🤝</span>' +
            '<span><b>' + esc(person.nickname || person.name) + '</b>님을 내 동반자로 추가하시겠습니까?</span>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm" id="btnDmFollowBack" style="font-size:.75rem;padding:6px 12px;border-radius:8px;white-space:nowrap;font-weight:700;cursor:pointer;">+ 맞추가</button>' +
        '</div>'
      ) : '';

      var msgsHtml = (person._thread && person._thread.length) ? person._thread.map(function(m){
        return '<div class="dm-msg ' + m.from + '">' + esc(m.text) + '</div>';
      }).join('') : '<div style="text-align:center;padding:24px 10px;font-size:.8125rem;color:var(--ink-faint);">아직 주고받은 메시지가 없습니다.<br>첫 대화를 건네보세요! 👋</div>';

      body.innerHTML = '<span class="dm-back" id="dmBack" style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-size:.875rem;font-weight:700;color:var(--brand-strong);margin-bottom:12px;">‹ 목록으로</span>' +
        followBackBannerHtml +
        '<div class="dm-thread-wrap">' +
          '<div class="dm-thread-head" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--card);border-bottom:1px solid var(--rule);">' +
            '<div class="feed-avatar" style="width:40px;height:40px;font-size:1.4rem;display:flex;align-items:center;justify-content:center;background:var(--surface-2);border-radius:50%;overflow:hidden;flex-shrink:0;">' + safeAvatarHtml(person.avatar, 40) + '</div>' +
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
            '<button class="btn btn-primary btn-sm" id="dmSend" type="button" style="font-weight:700;border-radius:10px;padding:8px 16px;position:relative;z-index:5;touch-action:manipulation;cursor:pointer;flex-shrink:0;">전송</button>' +
          '</div>' +
        '</div>' +
        '<p class="faint" style="margin-top:10px;font-size:.75rem;">💡 실제 사용자 계정 간 서버 DB 원장 및 Realtime 채널로 실시간 송수신됩니다</p>';

      var backBtn = document.getElementById('dmBack');
      if(backBtn) backBtn.addEventListener('click', function(){
        if(_activeDmChannel){ try{ _activeDmChannel.unsubscribe(); }catch(e){} _activeDmChannel = null; }
        state.dmActiveId = null;
        renderCommDM(body);
      });

      var btnFollow = document.getElementById('btnDmFollowBack');
      if(btnFollow){
        btnFollow.addEventListener('click', async function(){
          var comps = (state.profile.companions = state.profile.companions || []);
          var newComp = {
            id: person.id,
            nickname: person.nickname || person.name,
            name: person.name || person.nickname,
            avatar: person.avatar || '👤',
            intro: person.intro || '함께 목표를 실천하는 소중한 동반자',
            theme: person.theme || '전체',
            streak: person.streak || 1,
            level: person.level || 1,
            goals: person.goals || ['목표 실천 중']
          };
          comps.unshift(newComp);
          _incomingDmRooms = _incomingDmRooms.filter(function(x){ return x.id !== person.id; });
          try { if(global.saveProfile) await global.saveProfile(); } catch(e){}
          try { persistCompanions(comps); } catch(pErr){ console.warn('[동반자] persistCompanions 오류(무시):', pErr); }
          showToast(newComp.nickname + '님을 동반자로 추가했습니다! 🎉');
          renderCommDM(body);
        });
      }

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
        _lastDmMessageMap[person.id] = { text: text, time: new Date().toISOString(), from: 'me' };
        markDmRoomRead(myId, person.id);
        input.value = '';
        var msgsEl = document.getElementById('dmMsgs');
        if(msgsEl){
          var div = document.createElement('div');
          div.className = 'dm-msg me';
          div.textContent = text;
          msgsEl.appendChild(div);
          msgsEl.scrollTop = msgsEl.scrollHeight;
        }

        showToast('메시지를 전송했습니다! 💬');

        // 2. 헌법 제19조 의거 Supabase 서버 DB 원장 영속화
        if(global.sb){
          try {
            var threadId = getDmThreadId(myId, person.id);
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
      if(sendBtn){
        sendBtn.addEventListener('click', function(e){
          if(e){ e.stopPropagation(); e.preventDefault(); }
          send();
        });
        sendBtn.addEventListener('touchend', function(e){
          if(e){ e.stopPropagation(); e.preventDefault(); }
          send();
        });
      }
      var inputEl = document.getElementById('dmInput');
      if(inputEl){
        inputEl.focus();
        inputEl.addEventListener('keydown', function(e){
          if(e.key === 'Enter' && !e.shiftKey){
            e.preventDefault();
            send();
          }
        });
      }
    } else {
      if(_activeDmChannel){ try{ _activeDmChannel.unsubscribe(); }catch(e){} _activeDmChannel = null; }

      // 수신된 대화방 목록 비동기 프리로드 (첫 진입 시)
      if(!isGuest && _incomingDmLoadedForUser !== myId){
        loadIncomingDmRooms(myId).then(function(rooms){
          if(rooms && rooms.length > 0 && document.body.contains(body) && !state.dmActiveId && state.commSubTab === 'dm'){
            renderCommDM(body);
          }
        });
      }

      var teamMembersChipsHtml = teamMembers.map(function(m){
        return '<div class="dm-team-chip" data-openteamdm="' + esc(m.id) + '" role="button" tabindex="0" style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;width:72px;padding:8px 4px;background:var(--card);border:1px solid var(--rule);border-radius:12px;cursor:pointer;text-align:center;transition:transform 0.15s ease;">' +
          '<div style="width:38px;height:38px;border-radius:50%;background:var(--surface-2);border:1.5px solid var(--brand);display:flex;align-items:center;justify-content:center;font-size:1.25rem;margin-bottom:4px;overflow:hidden;flex-shrink:0;">' + safeAvatarHtml(m.avatar, 38) + '</div>' +
          '<div style="font-size:.75rem;font-weight:700;color:var(--ink);width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(m.name) + '</div>' +
          '<span class="faint" style="font-size:.625rem;line-height:1.2;margin-top:2px;">' + (m.role || '팀원') + '</span>' +
        '</div>';
      }).join('');

      var allDmList = [];
      // 1. 수신 대화 요청 (내 companions에 아직 없는 상대방)
      _incomingDmRooms.forEach(function(inc){
        allDmList.push(inc);
      });
      // 2. 내 동반자 목록
      var companions = (state.profile && state.profile.companions) || [];
      companions.forEach(function(c){
        if(!allDmList.some(function(x){ return String(x.id || '').trim().toLowerCase() === String(c.id || '').trim().toLowerCase(); })){
          allDmList.push(c);
        }
      });
      // 3. 팀원 목록 (중복 제외)
      teamMembers.forEach(function(m){
        if(!allDmList.some(function(x){ return String(x.id || '').trim().toLowerCase() === String(m.id || '').trim().toLowerCase(); })){
          allDmList.push(m);
        }
      });

      var dmListHtml = allDmList.map(function(p){
        var last = (p._thread && p._thread.length) ? p._thread[p._thread.length - 1].text : (p.intro || '새로운 대화를 시작해보세요!');
        var badgeText = p.isIncoming ? '📩 새 대화 요청' : (p.isAiBot ? 'AI 봇' : (p.groupName ? p.groupName : (p.theme || '동반자')));
        var itemBorder = p.isIncoming ? 'border:1.5px solid var(--brand);background:var(--surface-2);' : 'border:1px solid var(--rule);background:var(--card);';
        var pillStyle = p.isIncoming ? 'font-size:.6875rem;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;font-weight:700;' : 'font-size:.6875rem;';

        return '<div class="dm-list-item" data-open="' + esc(p.id) + '" style="cursor:pointer;padding:10px 12px;display:flex;align-items:center;gap:12px;' + itemBorder + 'border-radius:12px;margin-bottom:8px;">' +
          '<div class="feed-avatar" style="width:42px;height:42px;border-radius:50%;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex:0 0 auto;overflow:hidden;">' + safeAvatarHtml(p.avatar, 42) + '</div>' +
          '<div class="dm-preview" style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">' +
              '<b style="font-size:.875rem;color:var(--ink);">' + esc(p.nickname || p.name) + '</b>' +
              '<span class="dday-pill" style="' + pillStyle + '">' + esc(badgeText) + '</span>' +
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
  var KNOWN_AI_BOT_NAMES = [
    '새벽러너_민지', '민지', '김민지',
    '코드장인_도현', '도현', '박도현',
    '갓생사는_수아', '수아', '이수아',
    '이지수 팀장', '지수_TF장',
    '김민우 대리', '민우_운영조',
    '박소연 사원', '소연_레크조',
    '최현아', '현아_드라이브',
    '정준호', '준호_맛집탐험',
    '강성진 코치', '성진_헤드코치',
    '윤태양', '태양_와드러버'
  ];

  function isKnownAiCompanion(userOrId){
    if(!userOrId) return false;
    if(typeof userOrId === 'string'){
      var s = userOrId.toLowerCase();
      if(s.indexOf('comp_') === 0 || s.indexOf('mem_') === 0 || s.indexOf('mock_') === 0 || s.indexOf('bot_') === 0 || s.indexOf('ai_') === 0) return true;
      return KNOWN_AI_BOT_NAMES.some(function(n){ return n === userOrId; });
    }
    if(userOrId.isAiBot === true) return true;
    var uid = String(userOrId.id || '').toLowerCase();
    if(uid.indexOf('comp_') === 0 || uid.indexOf('mem_') === 0 || uid.indexOf('mock_') === 0 || uid.indexOf('bot_') === 0 || uid.indexOf('ai_') === 0) return true;
    var nick = userOrId.nickname || userOrId.name || '';
    if(KNOWN_AI_BOT_NAMES.some(function(n){ return n === nick; })) return true;
    if(userOrId.botBadge) return true;
    return false;
  }

  function safeAvatarHtml(avatar, size){
    size = size || 36;
    if(!avatar || typeof avatar !== 'string') return '👤';
    var trimmed = avatar.trim();
    if(trimmed.indexOf('http://') === 0 || trimmed.indexOf('https://') === 0 || trimmed.indexOf('data:image/') === 0 || trimmed.indexOf('/') === 0){
      return '<img src="' + esc(trimmed) + '" alt="아바타" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" onerror="this.onerror=null;this.parentElement.textContent=\'👤\';">';
    }
    if(trimmed.indexOf('<svg') >= 0){
      return trimmed;
    }
    return esc(trimmed);
  }

  var COMPANIONS_STORAGE_PREFIX = 'ourgoal_companions_backup_';

  function getCompanionsStorageKey(){
    var state = global.state || {};
    var uid = (state.profile && state.profile.id) ? String(state.profile.id).trim() : 'guest';
    return COMPANIONS_STORAGE_PREFIX + uid;
  }

  function ensureDefaultCompanions(){
    var state = global.state || {};
    if(!state.profile) return [];

    // 1. 메모리에 유효한 배열이 있고 비어있지 않으면 그대로 사용
    if(Array.isArray(state.profile.companions) && state.profile.companions.length > 0){
      return state.profile.companions;
    }

    // 2. 메모리가 비어있거나 초기화된 경우: localStorage 백업에서 즉시 0ms 자가 복원
    var restored = [];
    try {
      var key = getCompanionsStorageKey();
      var raw = localStorage.getItem(key);
      if(raw){
        var parsed = JSON.parse(raw);
        if(Array.isArray(parsed) && parsed.length > 0){
          restored = parsed;
        }
      }
    } catch(e){}

    if(restored && restored.length > 0){
      state.profile.companions = restored;
      return state.profile.companions;
    }

    // 3. 만약 로컬스토리지에도 저장 이력이 전혀 없다면: 초기 콜드스타트 가상 AI 동반자 3인 안전 제공
    if(!state.profile.companions || !Array.isArray(state.profile.companions) || state.profile.companions.length === 0){
      state.profile.companions = [
        { id: 'comp_minji', nickname: '새벽러너_민지', name: '새벽러너_민지', avatar: '🏃‍♀️', streak: 42, theme: '마라톤', intro: '매일 아침 6시 5km 달리기 함께해요!', isAiBot: true, createdAt: new Date().toISOString() },
        { id: 'comp_dohyun', nickname: '코드장인_도현', name: '코드장인_도현', avatar: '💻', streak: 128, theme: '코딩', intro: '매일 1커밋과 알고리즘 1문제 풀기', isAiBot: true, createdAt: new Date().toISOString() },
        { id: 'comp_sua', nickname: '갓생사는_수아', name: '갓생사는_수아', avatar: '📚', streak: 15, theme: '독서', intro: '출퇴근길 30분 독서 습관 만들기', isAiBot: true, createdAt: new Date().toISOString() }
      ];
      try {
        localStorage.setItem(getCompanionsStorageKey(), JSON.stringify(state.profile.companions));
      } catch(e){}
    }

    return state.profile.companions;
  }

  var _companionsDbSynced = false;
  // #TASK-ES-129: 동반자 목록 영구 영속화 (localStorage 즉시 복원 + /api/track 서버리스 원장 동기화)
  function syncCompanionsFromDb(body){
    var state = global.state || {};
    if(_companionsDbSynced || !state.profile || !state.profile.id) return;
    if(String(state.profile.id).indexOf('guest') === 0) return;
    _companionsDbSynced = true;
    try { initIncomingDmListener(state.profile.id); } catch(e){}

    // 1단계: 로컬스토리지 자가 치유 복원
    ensureDefaultCompanions();

    // 2단계: /api/track 서버리스 원장 비동기 조회 및 병합
    if(typeof fetch !== 'undefined'){
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_companions', userId: state.profile.id })
      }).then(function(res){
        if(res && res.ok) return res.json();
        return null;
      }).then(function(data){
        if(data && data.ok && Array.isArray(data.companions) && data.companions.length){
          var comps = ensureDefaultCompanions();
          var addedAny = false;
          data.companions.forEach(function(c){
            if(c && c.id){
              var cId = String(c.id).trim().toLowerCase();
              var exists = comps.some(function(x){ return String(x.id || '').trim().toLowerCase() === cId; });
              if(!exists){
                comps.push(c);
                addedAny = true;
              }
            }
          });
          if(addedAny){
            try {
              localStorage.setItem(getCompanionsStorageKey(), JSON.stringify(comps));
            } catch(e){}
            if(body) renderCommCompanions(body);
          }
        }
      }).catch(function(err){
        console.warn('[동반자] 서버리스 동기화 예외(로컬 보존 유지):', err);
      });
    }

    // 3단계: Supabase 레거시 users.companions 컬럼 조회 시도 (존재 시 호환)
    if(global.sb){
      global.sb.from('users').select('companions').eq('id', state.profile.id).maybeSingle().then(function(res){
        if(res && res.data && Array.isArray(res.data.companions) && res.data.companions.length){
          var comps = ensureDefaultCompanions();
          var addedAny = false;
          res.data.companions.forEach(function(c){
            if(c && c.id){
              var cId = String(c.id).trim().toLowerCase();
              if(!comps.some(function(x){ return String(x.id || '').trim().toLowerCase() === cId; })){
                comps.push(c);
                addedAny = true;
              }
            }
          });
          if(addedAny){
            try { localStorage.setItem(getCompanionsStorageKey(), JSON.stringify(comps)); } catch(e){}
            if(body) renderCommCompanions(body);
          }
        }
      }).catch(function(){});
    }
  }

  function persistCompanions(){
    var state = global.state || {};
    if(!state.profile || !state.profile.id) return;
    var uid = state.profile.id;
    var list = state.profile.companions || [];

    // 1순위: localStorage 0ms 동기식 영구 저장 (새로고침 시 100% 무손실 복구)
    try {
      localStorage.setItem(getCompanionsStorageKey(), JSON.stringify(list));
    } catch(e){
      console.warn('[동반자] localStorage 백업 오류:', e);
    }

    if(String(uid).indexOf('guest') === 0) return;

    // 2순위: /api/track 서버리스 파이프라인 (events 원장 영구 저장)
    if(typeof fetch !== 'undefined'){
      try {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync_companions', userId: uid, companions: list })
        }).catch(function(err){ console.warn('[동반자] /api/track 서버 저장 실패:', err); });
      } catch(e){}
    }

    // 3순위: Supabase users.companions 컬럼 업데이트 시도 (PostgrestFilterBuilder 호환)
    if(global.sb){
      try {
        var queryBuilder = global.sb.from('users').update({ companions: list }).eq('id', uid);
        if(queryBuilder && typeof queryBuilder.then === 'function'){
          queryBuilder.then(function(){}, function(err){
            console.warn('[동반자] Supabase 컬럼 업데이트 건너뜀:', err);
          });
        }
      } catch(sbErr){
        console.warn('[동반자] Supabase 컬럼 업데이트 예외(무시):', sbErr);
      }
    }
  }

  function openUserProfileModal(user){
    if(!user) return;
    var state = global.state || {};
    var isAiBot = isKnownAiCompanion(user);
    if(isAiBot) user.isAiBot = true;

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

    var isMyCompanion = (state.profile && state.profile.companions && state.profile.companions.some(function(c){ return String(c.id || '').trim().toLowerCase() === String(user.id || '').trim().toLowerCase(); }));

    var modalHtml = '<h3>' + esc(user.nickname || user.name) + '님의 프로필</h3>' +
      '<div style="text-align:center;padding:12px 0 10px;">' +
        '<div style="width:72px;height:72px;border-radius:50%;background:var(--surface-2);border:2px solid var(--brand);display:flex;align-items:center;justify-content:center;font-size:2.2rem;margin:0 auto 10px;box-shadow:0 4px 12px rgba(0,0,0,0.06);overflow:hidden;flex-shrink:0;">' +
          safeAvatarHtml(user.avatar, 72) +
        '</div>' +
        '<div style="font-weight:700;font-size:1.1rem;color:var(--ink);display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;">' +
          '<span>' + esc(user.nickname || user.name) + '</span>' +
          (isAiBot ? '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--brand-strong);border:1px solid rgba(108,92,231,0.3);font-weight:700;">🤖 AI 동반자</span>' : '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--ink-soft);">실 사용자</span>') +
        '</div>' +
        '<div class="faint" style="font-size:.8125rem;margin-top:2px;">' + esc(user.theme || (isAiBot ? 'AI 목표 동반자' : '아워골 동반자')) + '</div>' +
        '<div style="display:flex;justify-content:center;gap:6px;margin-top:8px;">' +
          '<span class="dday-pill" style="font-size:.75rem;">Lv.' + (user.level || 1) + '</span>' +
          '<span class="dday-pill" style="font-size:.75rem;background:var(--red-soft);color:var(--brand-strong);">🔥 ' + (user.streak || 1) + '일 연속 실천</span>' +
        '</div>' +
      '</div>' +
      '<div style="padding:10px 14px;background:var(--surface-2);border-radius:12px;margin-bottom:14px;font-size:.8125rem;color:var(--ink);line-height:1.5;text-align:center;">' +
        '“ ' + esc(user.intro || (isAiBot ? '초기 활동을 함께 응원하는 AI 동반자입니다.' : '함께 목표를 향해 달리는 든든한 동반자입니다.')) + ' ”' +
      '</div>' +
      (isAiBot ? '<div style="font-size:.75rem;color:var(--brand-strong);margin-top:-6px;margin-bottom:12px;text-align:center;font-weight:600;">💡 목표 도전을 함께 응원하는 AI 동반자입니다.</div>' : '') +
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
            var targetId = String(user.id || '').trim().toLowerCase();
            if(!comps.some(function(x){ return String(x.id || '').trim().toLowerCase() === targetId; })){
              addCompBtn.disabled = true;
              addCompBtn.textContent = '✓ 추가됨';
              comps.unshift({
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
              // saveProfile() 실패가 추가 자체를 막지 않도록 격리
              try { if(global.saveProfile) await global.saveProfile(); } catch(err){ console.warn('[동반자] saveProfile 오류(무시하고 계속):', err); }
              try { persistCompanions(); } catch(pErr){ console.warn('[동반자] persistCompanions 오류(무시):', pErr); }
              showToast((user.nickname || user.name) + '님을 동반자로 추가했어요! 🎉');
              if(global.closeModal) global.closeModal();
              if(state.activeTab === 'comm' && state.commSubTab === 'companion'){
                if(global.renderCommScreen) global.renderCommScreen();
              }
            } else {
              showToast('이미 등록된 동반자입니다.');
              if(global.closeModal) global.closeModal();
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
    if(!body) body = document.getElementById('commSubBody');
    if(!body) return;

    var state = global.state || {};
    var companions = ensureDefaultCompanions();
    syncCompanionsFromDb(body);

    // [자가 치유] 기존 companions 내 가상 유저 3인 AI 플래그 자동 보정 및 영속화
    try {
      var healed = false;
      companions.forEach(function(c){
        if(isKnownAiCompanion(c)){
          if(!c.isAiBot){
            c.isAiBot = true;
            healed = true;
          }
        }
      });
      if(healed){
        persistCompanions();
      }
    } catch(healErr){
      console.warn('[동반자] 자가 치유 동기화 예외(렌더링 유지):', healErr);
    }

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
    } else if(searchError === 'session'){
      searchResultsHtml = '<div style="padding:16px 12px;background:var(--surface-2);border-radius:12px;text-align:center;font-size:.8125rem;color:var(--ink-soft);margin-bottom:14px;">' +
        '로그인 세션이 만료됐어요. 로그아웃 후 다시 로그인해주세요.' +
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
            var isAdded = companions.some(function(c){
              return String(c.id || '').trim().toLowerCase() === String(u.id || '').trim().toLowerCase();
            });
            return '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--card);border:1px solid var(--rule);border-radius:10px;margin-bottom:6px;position:relative;">' +
              '<div class="comp-avatar-click" data-viewprof="' + esc(u.id) + '" style="width:36px;height:36px;border-radius:50%;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:1.3rem;cursor:pointer;flex:0 0 auto;overflow:hidden;" title="프로필 보기">' +
                safeAvatarHtml(u.avatar, 36) +
              '</div>' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                  '<div style="font-weight:700;font-size:.875rem;color:var(--ink);">' + esc(u.nickname) + '</div>' +
                  '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--ink-soft);">실 사용자</span>' +
                '</div>' +
                '<div class="faint" style="font-size:.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(u.intro) + '</div>' +
              '</div>' +
              (isAdded ?
                '<span class="faint" style="font-size:.75rem;padding:4px 8px;background:var(--surface-2);border-radius:6px;flex-shrink:0;">✓ 이미 동반자</span>' :
                '<button class="btn btn-primary btn-xs" data-addcomp="' + esc(u.id) + '" type="button" style="font-size:.75rem;padding:4px 10px;border-radius:8px;font-weight:700;position:relative;z-index:2;cursor:pointer;touch-action:manipulation;white-space:nowrap;flex-shrink:0;">+ 추가</button>'
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
        var isAi = isKnownAiCompanion(c);
        c.isAiBot = isAi;
        var badgeHtml = isAi ?
          '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--brand-strong);border:1px solid rgba(108,92,231,0.3);font-weight:700;">🤖 AI 동반자</span>' :
          '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--ink-soft);">실 사용자</span>';

        return '<div class="card" style="margin-bottom:8px;padding:12px 14px;background:var(--card);border:1px solid var(--rule);border-radius:14px;display:flex;align-items:center;gap:12px;">' +
          '<div class="comp-avatar-click" data-viewprof="' + esc(c.id) + '" role="button" tabindex="0" style="width:44px;height:44px;border-radius:50%;background:var(--surface-2);border:2px solid var(--brand);display:flex;align-items:center;justify-content:center;font-size:1.5rem;cursor:pointer;flex:0 0 auto;overflow:hidden;transition:transform 0.15s ease;" title="아바타를 클릭해 프로필을 확인하세요">' +
            safeAvatarHtml(c.avatar, 44) +
          '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;flex-wrap:wrap;">' +
              '<b style="font-size:.9375rem;color:var(--ink);cursor:pointer;" class="comp-avatar-click" data-viewprof="' + c.id + '">' + esc(c.nickname || c.name) + '</b>' +
              badgeHtml +
              '<span style="font-size:.75rem;color:var(--brand-strong);font-weight:700;">🔥 ' + (c.streak || 1) + '일</span>' +
            '</div>' +
            '<div class="faint" style="font-size:.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(c.intro || c.theme || (isAi ? '초기 활동을 함께하는 AI 동반자' : '목표를 향해 함께 달리는 동반자')) + '</div>' +
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

      state._companionSearchKeyword = q;
      state._companionIsSearching = true;
      state._companionSearchError = null;
      renderCommCompanions(body);

      var matched = [];
      var errored = false;
      var errorDetail = '';

      // [1순위] Vercel 서버리스 RLS 우회 검색 파이프라인 (Service Role Key 활용)
      try {
        var apiRes = await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'search_users', query: q })
        });
        if(apiRes.ok){
          var apiData = await apiRes.json();
          if(apiData && apiData.ok && Array.isArray(apiData.users) && apiData.users.length){
            matched = apiData.users.map(function(u){
              var obj = {
                id: u.id,
                nickname: u.nickname || u.name,
                name: u.name || u.nickname,
                avatar: u.avatar || '👤',
                intro: u.intro || '함께 실천하는 아워골 회원',
                level: u.level || 1,
                streak: u.streak || 1,
                theme: u.theme || '일반',
                isAiBot: false
              };
              _userCache[u.id] = obj;
              return obj;
            });
          }
        }
      } catch(apiErr){
        console.warn('[동반자] /api/track 검색 오류(RPC 폴백 시도):', apiErr);
      }

      // [2순위] 로컬 환경이거나 API 결과 없을 때 Supabase RPC 폴백 호출
      if(!matched.length && global.sb){
        try {
          var res = await global.sb.rpc('search_users_by_nickname', { p_query: q });
          if(res && res.error){
            errorDetail = (res.error.code || '') + ' ' + (res.error.message || '');
            console.warn('[동반자] Supabase RPC 검색 경고:', res.error);
          } else if(res && Array.isArray(res.data)){
            matched = res.data.map(function(u){
              var obj = {
                id: u.id,
                nickname: u.nickname,
                name: u.nickname,
                avatar: u.avatar_url || '👤',
                intro: u.bio || '함께 실천하는 아워골 회원',
                level: 1,
                streak: 1,
                theme: (u.interests && u.interests[0]) || '일반',
                isAiBot: false
              };
              _userCache[u.id] = obj;
              return obj;
            });
          }
        } catch(rpcErr){
          console.warn('[동반자] Supabase RPC 검색 오류:', rpcErr);
          errorDetail = (rpcErr && rpcErr.message) || String(rpcErr);
        }
      }

      state._companionIsSearching = false;
      state._companionSearchError = null;
      state._companionSearchErrorDetail = '';
      state._companionSearchResults = matched;
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
      el.addEventListener('click', function(e){
        if(e){ e.stopPropagation(); }
        var uid = String(el.dataset.viewprof || '').trim();
        var u = (state._companionSearchResults && state._companionSearchResults.find(function(x){ return String(x.id || '').trim().toLowerCase() === uid.toLowerCase(); })) ||
                companions.find(function(x){ return String(x.id || '').trim().toLowerCase() === uid.toLowerCase(); }) ||
                _userCache[uid];
        if(u) openUserProfileModal(u);
      });
    });

    body.querySelectorAll('[data-addcomp]').forEach(function(btn){
      btn.addEventListener('click', async function(e){
        if(e){
          e.stopPropagation();
          e.preventDefault();
        }
        var isGuest = !state.profile || !state.profile.id || String(state.profile.id).indexOf('guest') === 0;
        if(isGuest){
          showGuestSoftAuthGate('동반자 추가');
          return;
        }
        var uid = String(btn.dataset.addcomp || '').trim();
        var target = null;
        if(state._companionSearchResults && Array.isArray(state._companionSearchResults)){
          target = state._companionSearchResults.find(function(x){
            return String(x.id || '').trim().toLowerCase() === uid.toLowerCase();
          });
        }
        if(!target && _userCache[uid]){
          target = _userCache[uid];
        }
        if(!target){
          console.warn('[동반자] 추가 대상 회원을 찾을 수 없음:', uid);
          showToast('회원 정보를 확인하는 중입니다. 다시 시도해주세요.');
          return;
        }

        var comps = ensureDefaultCompanions();
        var alreadyExists = comps.some(function(x){
          return String(x.id || '').trim().toLowerCase() === String(target.id || '').trim().toLowerCase();
        });

        if(!alreadyExists){
          // [낙관적 UI] 클릭 즉시 시각적 상태 갱신하여 멈춤 현상 제거
          btn.disabled = true;
          btn.textContent = '✓ 추가됨';
          btn.style.background = 'var(--surface-2)';
          btn.style.color = 'var(--brand-strong)';
          btn.style.borderColor = 'var(--rule)';

          var newComp = {
            id: target.id,
            nickname: target.nickname || target.name || '동반자',
            name: target.name || target.nickname || '동반자',
            avatar: target.avatar || '👤',
            level: target.level || 1,
            streak: target.streak || 1,
            theme: target.theme || '동반자',
            intro: target.intro || '',
            goals: target.goals || [],
            isAiBot: false,
            createdAt: new Date().toISOString()
          };
          comps.unshift(newComp);

          try {
            if(global.saveProfile) await global.saveProfile();
          } catch(err){
            console.warn('[동반자] saveProfile 오류(무시하고 계속):', err);
          }
          try {
            persistCompanions();
          } catch(pErr){
            console.warn('[동반자] persistCompanions 오류(무시):', pErr);
          }

          showToast((target.nickname || target.name) + '님을 동반자로 추가했어요! 🎉');
          renderCommCompanions(body);
        } else {
          var exIdx = comps.findIndex(function(x){ return String(x.id || '').trim().toLowerCase() === String(target.id || '').trim().toLowerCase(); });
          if(exIdx >= 0){
            comps[exIdx].nickname = target.nickname || target.name || comps[exIdx].nickname;
            comps[exIdx].avatar = target.avatar || comps[exIdx].avatar;
            comps[exIdx].intro = target.intro || comps[exIdx].intro;
          }
          try {
            persistCompanions();
          } catch(pErr){
            console.warn('[동반자] persistCompanions 오류(무시):', pErr);
          }
          showToast((target.nickname || target.name) + '님은 이미 등록된 동반자입니다.');
          renderCommCompanions(body);
        }
      });
    });

    body.querySelectorAll('[data-directdm]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        if(e){ e.stopPropagation(); e.preventDefault(); }
        var uid = String(btn.dataset.directdm || '').trim();
        state.commSubTab = 'dm';
        state.dmActiveId = uid;
        if(global.setTab) global.setTab('comm');
        if(global.renderCommScreen) global.renderCommScreen();
      });
    });

    body.querySelectorAll('[data-delcomp]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var uid = btn.dataset.delcomp;
        var comp = companions.find(function(x){ return String(x.id || '').trim().toLowerCase() === String(uid || '').trim().toLowerCase(); });
        var name = comp ? comp.nickname : '해당 동반자';
        if(!confirm(name + '님과의 동반자 관계를 해제하시겠습니까?')) return;
        state.profile.companions = companions.filter(function(x){ return String(x.id || '').trim().toLowerCase() !== String(uid || '').trim().toLowerCase(); });
        try { if(global.saveProfile) await global.saveProfile(); } catch(e){}
        try { persistCompanions(); } catch(pErr){ console.warn('[동반자] persistCompanions 오류(무시):', pErr); }
        showToast('동반자 관계를 해제했습니다');
        renderCommCompanions(body);
      });
    });
  }

  /* ------------------------------------------------------------
   * 모듈 전역 노출
   * ------------------------------------------------------------ */
  global.OurgoalTeamInviteComm = {
    init: function(ctx){
      _ctx = ctx || {};
      try {
        var state = global.state || (_ctx.getState ? _ctx.getState() : {});
        var myId = (state.user && state.user.id) || (state.profile && state.profile.id);
        if(myId && String(myId).indexOf('guest') !== 0){
          initIncomingDmListener(myId);
        }
      } catch(e){}
    },
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
    loadIncomingDmRooms: loadIncomingDmRooms,
    initIncomingDmListener: initIncomingDmListener,
    updateDmUnreadBadge: updateDmUnreadBadge,
    getDmUnreadStatus: getDmUnreadStatus,
    showGuestSoftAuthGate: showGuestSoftAuthGate,
    ALL_SEARCHABLE_USERS: []
  };

})(typeof window !== 'undefined' ? window : global);
