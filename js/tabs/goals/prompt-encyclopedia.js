/**
 * OurGoal Prompt Encyclopedia (목표 탭 — 데이터분석 프롬프트 백과사전)
 *
 * #TASK-ES-442 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   getUserPrompts — 「[78 / 89] 데이터분석 프롬프트 백과사전」(이전 전 4290~4301줄)
 *   getLikedPromptIds — 「[78 / 89] 데이터분석 프롬프트 백과사전」(이전 전 4303~4314줄)
 *   getPromptLikesMap — 「[78 / 89] 데이터분석 프롬프트 백과사전」(이전 전 4316~4322줄)
 *   openAddUserPromptModal — 「[78 / 89] 데이터분석 프롬프트 백과사전」(이전 전 4324~4413줄)
 *   renderPromptEncyclopediaHtml — 「[78 / 89] 데이터분석 프롬프트 백과사전」(이전 전 4415~4606줄)
 *   wirePromptEncyclopediaEvents — 「[78 / 89] 데이터분석 프롬프트 백과사전」(이전 전 4608~4750줄)
 * 목표 상세의 데이터분석 프롬프트 백과사전 — 실사용·AI 맞춤 목록 그리기, 사용자 프롬프트 등록 창, 도움돼요·복사·피드 게시 이벤트.
 * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  function getUserPrompts(){
    if(!L.state.profile) return [];
    if(!Array.isArray(L.state.profile.userPrompts)){
      try {
        var cached = localStorage.getItem('ourgoal_shared_prompts');
        L.state.profile.userPrompts = cached ? JSON.parse(cached) : [];
      } catch(e){
        L.state.profile.userPrompts = [];
      }
    }
    return L.state.profile.userPrompts;
  }

  function getLikedPromptIds(){
    if(!L.state.profile) return [];
    if(!Array.isArray(L.state.profile.likedPromptIds)){
      try {
        var cached = localStorage.getItem('ourgoal_liked_prompt_ids');
        L.state.profile.likedPromptIds = cached ? JSON.parse(cached) : [];
      } catch(e){
        L.state.profile.likedPromptIds = [];
      }
    }
    return L.state.profile.likedPromptIds;
  }

  function getPromptLikesMap(){
    if(!L.state.profile) return {};
    if(!L.state.profile.promptLikesMap || typeof L.state.profile.promptLikesMap !== 'object'){
      L.state.profile.promptLikesMap = {};
    }
    return L.state.profile.promptLikesMap;
  }

  function openAddUserPromptModal(){
    if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
    var modalHtml =
      '<div style="padding:4px 0;">' +
        '<div class="faint" style="font-size:.78rem;margin-bottom:12px;">내가 직접 외부 AI에 넣어 효과를 본 데이터분석 프롬프트를 공유해주세요.</div>' +
        '<div style="margin-bottom:10px;">' +
          '<label style="display:block;font-size:.78rem;font-weight:700;color:var(--ink);margin-bottom:4px;">프롬프트 제목 <span style="color:var(--danger);">*</span></label>' +
          '<input type="text" id="newUserPromptTitle" class="input" placeholder="예: [러닝/체중] 주간 페이스 및 칼로리 상관분석" style="width:100%;box-sizing:border-box;font-size:.84rem;padding:8px 10px;border-radius:8px;border:1px solid var(--rule);">' +
        '</div>' +
        '<div style="margin-bottom:10px;">' +
          '<label style="display:block;font-size:.78rem;font-weight:700;color:var(--ink);margin-bottom:4px;">대상 목표 분류</label>' +
          '<select id="newUserPromptCategory" class="input" style="width:100%;box-sizing:border-box;font-size:.84rem;padding:8px 10px;border-radius:8px;border:1px solid var(--rule);background:var(--card);color:var(--ink);">' +
            '<option value="운동/건강">🏃 운동/건강</option>' +
            '<option value="커리어/공부">💼 커리어/공부</option>' +
            '<option value="생활습관/루틴">🌱 생활습관/루틴</option>' +
            '<option value="마음챙김/멘탈">🧘 마음챙김/멘탈</option>' +
            '<option value="자산관리/재테크">💰 자산관리/재테크</option>' +
            '<option value="기타">✨ 기타</option>' +
          '</select>' +
        '</div>' +
        '<div style="margin-bottom:10px;">' +
          '<label style="display:block;font-size:.78rem;font-weight:700;color:var(--ink);margin-bottom:4px;">활용 팁 / 한줄 요약</label>' +
          '<input type="text" id="newUserPromptDesc" class="input" placeholder="예: 목표 달성률과 함께 복사해서 ChatGPT에 넣으면 다음 주 플랜 도출" style="width:100%;box-sizing:border-box;font-size:.84rem;padding:8px 10px;border-radius:8px;border:1px solid var(--rule);">' +
        '</div>' +
        '<div style="margin-bottom:14px;">' +
          '<label style="display:block;font-size:.78rem;font-weight:700;color:var(--ink);margin-bottom:4px;">프롬프트 본문 <span style="color:var(--danger);">*</span></label>' +
          '<textarea id="newUserPromptContent" class="input" rows="4" placeholder="예: 다음은 나의 아워골 목표 데이터입니다...\n이 데이터로 3가지 병목을 진단하고 다음 주 실행계획을 알려주세요." style="width:100%;box-sizing:border-box;font-size:.8125rem;padding:8px 10px;border-radius:8px;border:1px solid var(--rule);font-family:monospace;resize:vertical;"></textarea>' +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;">' +
          '<button type="button" class="btn btn-ghost" id="btnCloseUserPromptModal" style="font-size:.84rem;padding:6px 14px;">취소</button>' +
          '<button type="button" class="btn btn-primary" id="btnSubmitUserPrompt" style="font-size:.84rem;padding:6px 16px;font-weight:700;">🚀 등록하기</button>' +
        '</div>' +
      '</div>';

    L.openModal({
      title: '나만의 프롬프트 올리기 🚀',
      body: modalHtml,
      onMount: function(sheet){
        var cancelBtn = sheet.querySelector('#btnCloseUserPromptModal');
        if(cancelBtn) cancelBtn.addEventListener('click', function(){ L.closeModal(); });
        var submitBtn = sheet.querySelector('#btnSubmitUserPrompt');
        if(submitBtn){
          submitBtn.addEventListener('click', async function(){
            var tInp = sheet.querySelector('#newUserPromptTitle');
            var cInp = sheet.querySelector('#newUserPromptCategory');
            var dInp = sheet.querySelector('#newUserPromptDesc');
            var pInp = sheet.querySelector('#newUserPromptContent');
            var title = (tInp ? tInp.value : '').trim();
            var category = (cInp ? cInp.value : '기타').trim();
            var desc = (dInp ? dInp.value : '').trim();
            var prompt = (pInp ? pInp.value : '').trim();
            if(!title){
              L.toast('프롬프트 제목을 입력해주세요.');
              if(tInp) tInp.focus();
              return;
            }
            if(!prompt){
              L.toast('프롬프트 본문을 입력해주세요.');
              if(pInp) pInp.focus();
              return;
            }
            var newPrompt = {
              id: 'up_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
              title: title,
              category: category,
              desc: desc || (category + ' 맞춤형 프롬프트'),
              prompt: prompt,
              authorName: (L.state.profile && L.state.profile.displayName) || '익명의 달성가',
              authorAvatar: (L.state.profile && L.state.profile.avatar && L.state.profile.avatar.emoji) || '🌱',
              createdAt: new Date().toISOString(),
              likes: 0
            };
            if(!L.state.profile.userPrompts) L.state.profile.userPrompts = [];
            L.state.profile.userPrompts.unshift(newPrompt);
            try {
              localStorage.setItem('ourgoal_shared_prompts', JSON.stringify(L.state.profile.userPrompts));
            } catch(e){}
            await L.saveProfile();
            if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
            L.toast('나만의 프롬프트가 성공적으로 등록되었습니다! 🎉');
            L.closeModal();
            L._promptTabState = 'real';
            L._promptEncyclopediaOpen = true;
            L.renderGoalsScreen();
            if(typeof L.renderRecordsScreen === 'function') L.renderRecordsScreen();
          });
        }
      }
    });
  }

  function renderPromptEncyclopediaHtml(context){
    var goals = (L.state.profile && L.state.profile.goals) ? L.state.profile.goals.filter(function(g){ return !g.archivedAt; }) : [];
    var goalTitles = goals.map(function(g){ return g.title; }).join(', ') || '러닝 10km 완주, 자격증 취득';

    var realPrompts = [
      {
        id: 'preset_real_0',
        baseLikes: 14,
        title: '📊 목표 달성률 정밀 진단 및 병목 분석',
        desc: '현재 진행 중인 목표의 완료율과 지연 요인을 진단하고 주간 실행 계획을 도출합니다.',
        prompt: '다음은 나의 아워골 목표 데이터입니다:\n[목표 목록: ' + goalTitles + ']\n이 목표들을 분석해서 (1) 가장 지연될 위험이 높은 병목 지점, (2) 이번 주에 반드시 끝내야 할 최우선 과제 3가지, (3) 일일 실천 행동 가이드를 작성해주세요.'
      },
      {
        id: 'preset_real_1',
        baseLikes: 21,
        title: '⚡ 정체기 돌파 및 동기부여 행동 전략',
        desc: '반복되는 슬럼프나 정체기를 극복하기 위한 행동경제학 기반 실천 프롬프트입니다.',
        prompt: '내가 현재 진행 중인 목표는 다음과 같습니다: [' + goalTitles + ']. 최근 며칠간 실천 의욕이 떨어지고 정체기를 겪고 있습니다. 심리학 및 행동경제학적 관점에서 (1) 2분 마이크로 루틴 설계, (2) 즉각적 보상 메커니즘, (3) 실패 방지 환경 재설계 3가지를 제안해주세요.'
      },
      {
        id: 'preset_real_2',
        baseLikes: 18,
        title: '🎯 마일스톤 데드라인 역산 최적화',
        desc: '최종 목표 완료일부터 오늘까지 날짜를 역산하여 단계별 마일스톤을 재배치합니다.',
        prompt: '내 목표 [' + goalTitles + ']를 성공적으로 완수하기 위해 오늘부터 D-Day까지 역산 일정(Backcasting) 계획표를 작성해주세요. 각 마일스톤별 필수 산출물과 주간 마감일 체크리스트를 표 형태로 정리해주세요.'
      },
      {
        id: 'preset_real_3',
        baseLikes: 9,
        title: '📈 주간 실천 루틴 상관관계 분석',
        desc: '운동, 독서, 업무 등 시간대별 실천 패턴의 상관관계를 심층 분석합니다.',
        prompt: '나의 목표와 최근 실천 내역을 바탕으로, 하루 중 어느 시간대에 어떤 활동을 배치했을 때 완수 성공률이 가장 높은지 최적의 하루 시간표(타임블록)를 설계해주세요.'
      }
    ];

    var aiPrompts = [
      {
        id: 'preset_ai_0',
        baseLikes: 25,
        title: '🤖 아워골 AI 목표 요약 및 넥스트 마일스톤 제안',
        desc: '내 실제 등록 목표에 최적화된 다음 단계 추천 마일스톤입니다.',
        prompt: '아워골 유저 [' + ((L.state.profile && L.state.profile.displayName) || '유저') + ']님의 현재 목표: [' + goalTitles + ']. 각 목표별로 현재 수준에서 난이도를 1단계 높여 성취감을 극대화할 수 있는 차기 마일스톤 2개씩을 추천해주세요.'
      },
      {
        id: 'preset_ai_1',
        baseLikes: 17,
        title: '💡 관심 카테고리 맞춤형 습관 루틴 팩',
        desc: '프로필 관심사 기반으로 100일 챌린지 루틴을 설계합니다.',
        prompt: '나의 관심 분야는 [' + (((L.state.profile && L.state.profile.interests) || []).join(', ') || '운동, 자기계발') + ']입니다. 아워골 앱에서 매일 3초 체크인으로 실천할 수 있는 100일 습관 루틴 5가지를 구체적인 실행 지침과 함께 알려주세요.'
      },
      {
        id: 'preset_ai_2',
        baseLikes: 19,
        title: '📝 주간 회고(KPT) 자동 작성 템플릿',
        desc: 'Keep, Problem, Try 프레임워크로 한 주간의 성과를 돌아봅니다.',
        prompt: '이번 주에 실천한 목표 [' + goalTitles + ']를 바탕으로 KPT(Keep-유지할 점, Problem-아쉬운 점, Try-다음 주 시도할 점) 회고 보고서를 작성해주세요. 다음 주 액션 플랜을 일자별로 제시해주세요.'
      },
      {
        id: 'preset_ai_3',
        baseLikes: 32,
        title: '🏆 개인 맞춤형 명예의 전당 수상 소감 생성',
        desc: '목표 달성 시 SNS나 아워골 피드에 공유할 감동적인 달성 스토리입니다.',
        prompt: '내가 [' + goalTitles + '] 목표를 끈기 있게 완수했다고 가정하고, 인스타그램이나 커뮤니티에 동료들과 공유할 300자 내외의 솔직하고 감동적인 완주 회고 소감을 작성해주세요.'
      }
    ];

    var userList = getUserPrompts();
    var likedIds = getLikedPromptIds();
    var likesMap = getPromptLikesMap();

    function renderPromptCard(item, isUserCreated){
      var isLiked = likedIds.indexOf(item.id) !== -1;
      var currentLikes = (typeof likesMap[item.id] === 'number') ? likesMap[item.id] : ((item.likes !== undefined) ? item.likes : (item.baseLikes || 0));
      var isOwner = isUserCreated && (item.authorName === ((L.state.profile && L.state.profile.displayName) || '익명의 달성가'));

      var metaHeader = '';
      if(isUserCreated){
        metaHeader =
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:4px;">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-size:1.05rem;">' + (item.authorAvatar || '🌱') + '</span>' +
              '<span style="font-size:.78rem;font-weight:700;color:var(--ink);">' + L.escapeHtml(item.authorName || '동반자') + '</span>' +
              '<span style="font-size:.6875rem;padding:2px 6px;border-radius:6px;background:rgba(99,102,241,0.1);color:var(--primary);font-weight:600;">' + L.escapeHtml(item.category || '실사용') + '</span>' +
            '</div>' +
            (isOwner ? '<button type="button" class="btn btn-ghost btn-xs btn-del-prompt" data-delpromptid="' + item.id + '" style="color:var(--danger);font-size:.72rem;padding:2px 6px;border:none;">🗑️ 삭제</button>' : '') +
          '</div>';
      }

      var likeBtnStyle = isLiked ?
        'background:rgba(49,130,246,0.16) !important;color:#3182f6 !important;border:1px solid rgba(49,130,246,0.45) !important;font-weight:700 !important;' :
        'background:var(--card2) !important;color:var(--ink-soft) !important;border:1px solid var(--rule) !important;';

      return '<div class="user-prompt-card" style="background:var(--card);border:1px solid var(--rule);border-radius:12px;padding:12px;margin-bottom:10px;">' +
        metaHeader +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;gap:8px;">' +
          '<span style="font-weight:700;font-size:.875rem;color:var(--ink);line-height:1.3;">' + L.escapeHtml(item.title) + '</span>' +
          '<button type="button" class="btn btn-ghost btn-xs btn-copy-prompt" data-pcontent="' + L.escapeHtml(item.prompt) + '" style="font-size:.75rem;color:var(--brand);border-color:rgba(108,92,231,0.3);white-space:nowrap;flex-shrink:0;">📋 복사하기</button>' +
        '</div>' +
        '<div class="faint" style="font-size:.78125rem;margin-bottom:8px;">' + L.escapeHtml(item.desc) + '</div>' +
        '<div style="background:var(--card2);padding:8px 10px;border-radius:8px;font-size:.75rem;color:var(--ink-soft);font-family:monospace;white-space:pre-wrap;max-height:80px;overflow-y:auto;border:1px dashed var(--rule);margin-bottom:8px;">' +
          L.escapeHtml(item.prompt) +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;">' +
          '<button type="button" class="btn btn-xs btn-like-prompt' + (isLiked ? ' liked' : '') + '" data-promptid="' + item.id + '" style="font-size:.72rem;padding:3px 9px;border-radius:12px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;min-height:24px;' + likeBtnStyle + '">' +
            '<span style="font-size:.82rem;">' + (isLiked ? '👍' : '👍🏻') + '</span>' +
            '<span>도움돼요 <b style="' + (isLiked ? 'color:#3182f6;' : '') + '">(' + currentLikes + ')</b></span>' +
          '</button>' +
          (isUserCreated ? '<span class="faint" style="font-size:.6875rem;">유저 검증 팁</span>' : '<span class="faint" style="font-size:.6875rem;">아워골 공식 큐레이션</span>') +
        '</div>' +
      '</div>';
    }

    var contentListHtml = '';
    if(L._promptTabState === 'real'){
      var userCardsHtml = '';
      if(userList.length === 0){
        userCardsHtml =
          '<div class="empty-prompt-notice" style="padding:18px 14px;text-align:center;background:var(--card);border:1px dashed var(--rule);border-radius:12px;margin-bottom:12px;">' +
            '<div style="font-size:1.3rem;margin-bottom:4px;">💡</div>' +
            '<div style="font-size:.84rem;font-weight:700;color:var(--ink);margin-bottom:4px;">아직 등록된 사용자 프롬프트가 없습니다.</div>' +
            '<div class="faint" style="font-size:.75rem;margin-bottom:10px;">내가 검증한 효과적인 데이터분석 프롬프트를 첫 번째로 공유해 보세요!</div>' +
            '<button type="button" class="btn btn-primary btn-xs" id="btnEmptyAddPrompt" style="font-size:.75rem;padding:4px 12px;font-weight:700;">➕ 첫 프롬프트 공유하기</button>' +
          '</div>';
      } else {
        userCardsHtml = userList.map(function(item){ return renderPromptCard(item, true); }).join('');
      }

      var presetCardsHtml = realPrompts.map(function(item){ return renderPromptCard(item, false); }).join('');

      contentListHtml =
        '<div style="margin-bottom:12px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<span style="font-size:.8125rem;font-weight:700;color:var(--ink);">👥 사용자 공유 실사용 프롬프트</span>' +
            '<span class="faint" style="font-size:.72rem;">' + userList.length + '건</span>' +
          '</div>' +
          userCardsHtml +
        '</div>' +
        '<div style="margin-top:14px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<span style="font-size:.8125rem;font-weight:700;color:var(--ink);">⭐ 아워골 큐레이션 실사용 프리셋</span>' +
            '<span class="faint" style="font-size:.72rem;">공식 추천 4종</span>' +
          '</div>' +
          presetCardsHtml +
        '</div>';
    } else {
      contentListHtml =
        '<div style="margin-bottom:12px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<span style="font-size:.8125rem;font-weight:700;color:var(--ink);">🤖 아워골 AI 목표 맞춤 프롬프트</span>' +
            '<span class="faint" style="font-size:.72rem;">4종</span>' +
          '</div>' +
          aiPrompts.map(function(item){ return renderPromptCard(item, false); }).join('') +
        '</div>';
    }

    var drawerHtml =
      '<div id="promptEncyclopediaDrawer" style="' + (L._promptEncyclopediaOpen ? 'margin-top:14px;display:block;' : 'display:none;') + '">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;">' +
          '<div style="display:flex;gap:4px;background:var(--card);padding:3px;border-radius:10px;border:1px solid var(--rule);flex:1;min-width:0;">' +
            '<button type="button" class="btn-prompt-tab" data-ptab="real" style="flex:1;text-align:center;padding:6px 6px;font-size:.75rem;border-radius:8px;border:none;cursor:pointer;white-space:nowrap;' + (L._promptTabState==='real'?'background:var(--brand);color:#fff;font-weight:700;':'background:transparent;color:var(--ink-soft);') + '">실사용 (' + (userList.length + realPrompts.length) + ')</button>' +
            '<button type="button" class="btn-prompt-tab" data-ptab="ai" style="flex:1;text-align:center;padding:6px 6px;font-size:.75rem;border-radius:8px;border:none;cursor:pointer;white-space:nowrap;' + (L._promptTabState==='ai'?'background:var(--brand);color:#fff;font-weight:700;':'background:transparent;color:var(--ink-soft);') + '">AI 맞춤 (' + aiPrompts.length + ')</button>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm" id="btnAddUserPrompt" style="flex-shrink:0;font-size:.75rem;font-weight:700;padding:6px 12px;border-radius:10px;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;">' +
            '<span>➕</span> 나만의 프롬프트 올리기' +
          '</button>' +
        '</div>' +
        '<div style="padding:8px 12px;background:rgba(108,92,231,0.06);border-left:3px solid var(--brand);border-radius:6px;margin-bottom:12px;font-size:.78125rem;color:var(--ink-soft);">' +
          '✨ <b>안내:</b> 프롬프트를 복사해서 외부 AI(ChatGPT, Claude, Gemini 등)에 붙여넣어 내 목표 데이터를 정밀 분석하세요! 도움이 된 프롬프트에는 <b>도움돼요 👍</b>를 눌러주세요.' +
        '</div>' +
        contentListHtml +
      '</div>';

    return '<div class="prompt-encyclopedia-card" style="margin-top:20px;padding:14px 16px;background:var(--card2);border:1px solid var(--rule);border-radius:16px;">' +
      '<div id="btnTogglePromptAccordion" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;gap:8px;">' +
        '<div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1;">' +
          '<span style="font-size:1.2rem;flex-shrink:0;">🧠</span>' +
          '<div style="display:flex;flex-direction:column;min-width:0;">' +
            '<span style="font-weight:700;font-size:.9rem;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">데이터분석 프롬프트 백과사전</span>' +
            '<span class="faint" style="font-size:.72rem;">(외부 AI 분석 · 유저 피드)</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">' +
          '<button type="button" class="btn btn-primary btn-xs" id="btnHeaderAddUserPrompt" style="font-size:.72rem;font-weight:700;padding:4px 9px;border-radius:8px;display:inline-flex;align-items:center;gap:3px;white-space:nowrap;">' +
            '<span>➕</span> 올리기' +
          '</button>' +
          '<span style="font-size:.75rem;color:var(--brand);font-weight:600;padding-left:2px;white-space:nowrap;">' + (L._promptEncyclopediaOpen ? '접기' : '펼쳐보기') + '</span>' +
          '<span id="promptAccordionChevron" style="font-size:.75rem;color:var(--ink-soft);transition:transform .2s ease;' + (L._promptEncyclopediaOpen ? 'transform:rotate(180deg);' : '') + '">▼</span>' +
        '</div>' +
      '</div>' +
      drawerHtml +
    '</div>';
  }

  function wirePromptEncyclopediaEvents(root){
    if(!root) return;
    var toggleBtn = root.querySelector('#btnTogglePromptAccordion');
    if(toggleBtn){
      toggleBtn.addEventListener('click', function(e){
        e.stopPropagation();
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
        L._promptEncyclopediaOpen = !L._promptEncyclopediaOpen;
        L.renderGoalsScreen();
        if(typeof L.renderRecordsScreen === 'function') L.renderRecordsScreen();
      });
    }

    var headerAddBtn = root.querySelector('#btnHeaderAddUserPrompt');
    if(headerAddBtn){
      headerAddBtn.addEventListener('click', function(e){
        e.stopPropagation();
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
        L._promptEncyclopediaOpen = true;
        openAddUserPromptModal();
      });
    }

    var addBtn = root.querySelector('#btnAddUserPrompt');
    if(addBtn){
      addBtn.addEventListener('click', function(e){
        e.stopPropagation();
        openAddUserPromptModal();
      });
    }

    var emptyAddBtn = root.querySelector('#btnEmptyAddPrompt');
    if(emptyAddBtn){
      emptyAddBtn.addEventListener('click', function(e){
        e.stopPropagation();
        openAddUserPromptModal();
      });
    }

    root.querySelectorAll('.btn-prompt-tab').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
        L._promptTabState = btn.dataset.ptab;
        L._promptEncyclopediaOpen = true;
        L.renderGoalsScreen();
        if(typeof L.renderRecordsScreen === 'function') L.renderRecordsScreen();
      });
    });

    root.querySelectorAll('.btn-copy-prompt').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
        var text = btn.dataset.pcontent;
        navigator.clipboard.writeText(text).then(function(){
          L.toast('프롬프트가 클립보드에 복사되었습니다! 외부 AI에 붙여넣어보세요 📋');
        }).catch(function(){
          L.toast('프롬프트 복사에 실패했습니다.');
        });
      });
    });

    root.querySelectorAll('.btn-like-prompt').forEach(function(btn){
      btn.addEventListener('click', async function(e){
        e.stopPropagation();
        var pid = btn.dataset.promptid;
        if(!pid) return;
        var likedIds = getLikedPromptIds();
        var likesMap = getPromptLikesMap();
        var idx = likedIds.indexOf(pid);

        // Find baseline likes
        var currentLikes = (typeof likesMap[pid] === 'number') ? likesMap[pid] : 0;
        if(typeof likesMap[pid] !== 'number'){
          var userPrompts = getUserPrompts();
          var foundUp = userPrompts.find(function(u){ return u.id === pid; });
          if(foundUp){
            currentLikes = foundUp.likes || 0;
          } else {
            var presetMap = {
              'preset_real_0': 14, 'preset_real_1': 21, 'preset_real_2': 18, 'preset_real_3': 9,
              'preset_ai_0': 25, 'preset_ai_1': 17, 'preset_ai_2': 19, 'preset_ai_3': 32
            };
            currentLikes = presetMap[pid] || 0;
          }
        }

        if(idx !== -1){
          // Unlike
          likedIds.splice(idx, 1);
          currentLikes = Math.max(0, currentLikes - 1);
          likesMap[pid] = currentLikes;
          var uList = getUserPrompts();
          var targetUp = uList.find(function(u){ return u.id === pid; });
          if(targetUp) targetUp.likes = currentLikes;
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          L.toast('도움돼요 추천을 취소했습니다.');
        } else {
          // Like
          likedIds.push(pid);
          currentLikes += 1;
          likesMap[pid] = currentLikes;
          var uList = getUserPrompts();
          var targetUp = uList.find(function(u){ return u.id === pid; });
          if(targetUp) targetUp.likes = currentLikes;
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          L.toast('이 프롬프트를 추천했습니다! 👍');
        }

        try {
          localStorage.setItem('ourgoal_liked_prompt_ids', JSON.stringify(likedIds));
          localStorage.setItem('ourgoal_shared_prompts', JSON.stringify(L.state.profile.userPrompts || []));
        } catch(err){}

        await L.saveProfile();
        L._promptEncyclopediaOpen = true;
        L.renderGoalsScreen();
        if(typeof L.renderRecordsScreen === 'function') L.renderRecordsScreen();
      });
    });

    root.querySelectorAll('.btn-del-prompt').forEach(function(btn){
      btn.addEventListener('click', async function(e){
        e.stopPropagation();
        var delId = btn.dataset.delpromptid;
        if(!delId) return;
        if(!(await OurgoalCapabilities.call('ui.confirm', '등록하신 프롬프트를 삭제하시겠습니까?'))) return;
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
        var uList = getUserPrompts();
        var filtered = uList.filter(function(u){ return u.id !== delId; });
        L.state.profile.userPrompts = filtered;
        try {
          localStorage.setItem('ourgoal_shared_prompts', JSON.stringify(filtered));
        } catch(err){}
        await L.saveProfile();
        L.toast('프롬프트가 삭제되었습니다.');
        L._promptEncyclopediaOpen = true;
        L.renderGoalsScreen();
        if(typeof L.renderRecordsScreen === 'function') L.renderRecordsScreen();
      });
    });
  }

  K.getUserPrompts = getUserPrompts;
  K.getLikedPromptIds = getLikedPromptIds;
  K.getPromptLikesMap = getPromptLikesMap;
  K.openAddUserPromptModal = openAddUserPromptModal;
  K.renderPromptEncyclopediaHtml = renderPromptEncyclopediaHtml;
  K.wirePromptEncyclopediaEvents = wirePromptEncyclopediaEvents;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
