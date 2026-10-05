/**
 * OurGoal Comm Shared Groups (소통 탭 — 공유 팀 불러오기·팀 목록·팀 상세·새 팀 만들기 창)
 *
 * 서버 공유 팀 불러오기(loadSharedGroups) · 소통 탭 팀 목록(renderCommGroups) · 팀 상세(renderGroupDetail) · 함께 게이지(collectiveGaugeHtml) · 새 팀 만들기 창(promptNewGroup).
 * 불러옴 표시(SHARED_GROUPS_LOADED)와 window 노출 두 줄(if 문)은 index.html 원래 자리에 그대로 있고 L getter·setter 로 읽고 쓴다.
 * #TASK-ES-474(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 17009~17044 · 17046~17202 · 17203~17430 · 17431~17446 · 17447~17596줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  /* ---- 이전 전 index.html 17009~17044줄(#TASK-ES-474 생성기 표지) ---- */
  async function loadSharedGroups(){
    try {
      // 1. 로컬 저장소 자가 복원
      var customGroups = (L.state.profile && L.state.profile.settings && L.state.profile.settings.customGroups) ? L.state.profile.settings.customGroups : [];
      customGroups.forEach(function(g){
        if(!L.MOCK_GROUPS.some(function(x){ return x.id === g.id; })){
          L.MOCK_GROUPS.unshift(g);
        }
      });
      // 2. Supabase team_pings 전역 공유 팀 페칭
      var res = await L.sb.from('team_pings')
        .select('*')
        .eq('group_id', 'shared_groups')
        .eq('target_type', 'team_group')
        .order('created_at', { ascending: false })
        .limit(50);
      if(res.data && res.data.length){
        res.data.forEach(function(row){
          try {
            var g = typeof row.message === 'string' ? JSON.parse(row.message) : row.message;
            if(g && g.id && !L.MOCK_GROUPS.some(function(x){ return x.id === g.id; })){
              L.MOCK_GROUPS.unshift(g);
            }
          } catch(err){}
        });
      }
      L.SHARED_GROUPS_LOADED = true;
      if(typeof window !== 'undefined'){ window.SHARED_GROUPS_LOADED = true; }
      if(L.state.activeTab === 'comm' && L.state.commSubTab === 'group'){
        var commBody = document.getElementById('commSubBody');
        if(commBody && !L.state.activeGroupId) renderCommGroups(commBody);
      }
    } catch(e){
      console.warn('[SharedGroups] load error:', e);
    }
  }

  /* ---- 이전 전 index.html 17046~17202줄(#TASK-ES-474 생성기 표지) ---- */

  function renderCommGroups(body){
    if(!L.SHARED_GROUPS_LOADED){
      loadSharedGroups();
    }
    if(L.state.activeGroupId){
      var ag = L.MOCK_GROUPS.find(function(x){ return x.id===L.state.activeGroupId; });
      if(ag) return renderGroupDetail(body, ag);
      L.state.activeGroupId = null;
    }
    var filter = L.state.groupFilter || 'all';
    var myInterests = L.state.profile.interests || [];
    var myRegion = L.state.profile.region || '';
    var mySido = myRegion.split(' ')[0];
    var visibleGroups = L.MOCK_GROUPS.filter(function(g){
      if(filter==='all') return true;
      if(filter==='near') return myRegion && g.region && g.region !== '온라인' &&
        (g.region === myRegion || g.region.split(' ')[0] === mySido);
      if(filter==='mine') return myInterests.some(function(i){ return i === g.topic; }) ||
        myInterests.some(function(i){ return (i.split('/')[0]) === (g.topic||'').split('/')[0]; });
      return (g.topic||'').split('/')[0] === filter;
    });

    var realGroups = visibleGroups.filter(function(g){ return !L.isMockGroup(g); });
    var mockGroups = visibleGroups.filter(function(g){ return L.isMockGroup(g); });
    var isMockAccordionOpen = L.state.mockSectionOpen !== false;

    var renderSingleGroupItem = function(g, isMock){
      var gs = L.groupState(g.id);
      var prog = typeof g.progress==='number' ? g.progress : 0;
      var isOwner = gs.myRole === 'owner'; var checked = L.groupCheckedToday(g.id);
      var ownerBadge = isOwner ? '<span style="font-size:.6875rem;font-weight:700;color:var(--sage);background:var(--sage-soft);border:1px solid var(--sage-soft);padding:1px 6px;border-radius:999px;margin-left:5px;vertical-align:middle;">팀장</span>' : '';
      var mockBadge = isMock ? '<div style="margin-bottom:4px;"><span class="mock-group-badge">💡 이런 팀을 만들 수 있어요 (활용 예시)</span></div>' : '';

      var actionButtons = isMock ?
        '<div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">' +
          '<button class="btn btn-primary btn-sm" data-tplgroup-create="'+g.id+'" type="button" style="min-height:38px;padding:4px 10px;font-size:.75rem;font-weight:700;border-radius:8px;">✨ 이 템플릿으로 팀 개설</button>' +
          '<button class="btn btn-ghost btn-sm" data-join="'+g.id+'" type="button" style="min-height:38px;padding:4px 8px;font-size:.75rem;border-radius:8px;">'+(gs.joined?'체험중':'체험')+'</button>' +
        '</div>' :
        '<button class="join-btn'+(gs.joined?' joined':'')+'" data-join="'+g.id+'" type="button">'+(gs.joined?'참여중':'참여하기')+'</button>';

      return '<div class="group-item" style="align-items:flex-start;cursor:pointer;' + (isMock ? 'background:var(--surface-2);border-color:var(--rule);' : '') + '" data-open-group="'+g.id+'">' +
        '<div class="group-ico">'+g.icon+'</div>' +
        '<div class="group-info">' +
          mockBadge +
          '<b>'+L.escapeHtml(g.name)+ownerBadge+(gs.joined&&checked?' ✅':'')+'</b>' +
          '<div style="margin:3px 0 2px;display:flex;gap:4px;flex-wrap:wrap;">' + L.topicPill(g.topic) +
            (g.maxMembers === 2 ? '<span class="topic-pill" style="background:var(--sage-soft);color:var(--sage);border-color:var(--sage-line);font-weight:700;">1:1 완주방</span>' : (g.maxMembers === 5 ? '<span class="topic-pill" style="background:var(--surface-2);color:var(--ink);border-color:var(--rule);font-weight:700;">5인 소그룹</span>' : '')) +
            (g.region ? '<span class="topic-pill" style="background:var(--gold-soft);color:var(--gold);border-color:var(--gold-line);">'+(g.region==='온라인'?'온라인':''+L.escapeHtml(g.region))+'</span>' : '') +
          '</div>' +
          '<span>'+(g.members+(gs.joined?1:0))+(g.maxMembers ? '/'+g.maxMembers+'명' : '명')+' 참여 · '+g.cadence+' 인증 · '+L.dDay(g.endDate)+'</span>' +
          '<div class="group-bar"><span style="width:'+prog+'%;"></span></div>' +
          '<span class="faint" style="font-size:.7rem;">공동 달성률 '+prog+'%'+(gs.joined&&!checked?' · 오늘 인증 전이에요':'')+'</span>' +
        '</div>' +
        actionButtons +
      '</div>';
    };

    var realGroupsHtml = realGroups.length ?
      '<div style="font-size:.9375rem;font-weight:700;color:var(--ink);margin:14px 0 8px;display:flex;align-items:center;gap:6px;">' +
        '<span>🔥 실시간 활동 중인 팀 (' + realGroups.length + ')</span>' +
      '</div>' +
      realGroups.map(function(g){ return renderSingleGroupItem(g, false); }).join('') :
      '<div style="background:var(--surface-2);border-radius:14px;padding:14px;border:1px dashed var(--rule);margin:12px 0 16px;text-align:center;">' +
        '<p style="margin:0 0 4px;font-weight:700;font-size:0.9375rem;color:var(--ink);">아직 개설된 실제 팀이 없어요</p>' +
        '<p style="margin:0;font-size:0.8125rem;color:var(--ink-soft);">상단의 <b>[+ 새 팀 개설하기]</b>를 눌러 친구들과 첫 팀을 만들거나, 아래 예시 템플릿을 복사해 1초 만에 시작해보세요!</p>' +
      '</div>';

    var mockGroupsCardsHtml = mockGroups.map(function(g){ return renderSingleGroupItem(g, true); }).join('');
    var mockAccordionHtml = mockGroups.length ?
      '<div class="mock-section-accordion">' +
        '<button class="mock-section-toggle-btn" id="btnToggleMockGroups" data-toggle-mock-section="comm" type="button">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<span>💡 이런 팀을 만들 수 있어요 (활용 예시 템플릿)</span>' +
            '<span class="mock-group-badge">' + mockGroups.length + '개</span>' +
          '</div>' +
          '<span style="font-size:.8125rem;color:var(--brand-strong);font-weight:700;">' + (isMockAccordionOpen ? '접기 ▲' : '둘러보기 ▼') + '</span>' +
        '</button>' +
        '<div id="commMockGroupsContainer" style="display:' + (isMockAccordionOpen ? 'block' : 'none') + ';margin-top:10px;">' +
          mockGroupsCardsHtml +
        '</div>' +
      '</div>' : '';

    body.innerHTML =
      L.renderTeamCreateHeroCardHtml('comm') +
      '<div class="card-title-row" style="margin-bottom:10px;">' +
        '<p class="faint" style="margin:0;">목표를 함께 달성하는 팀 공간</p>' +
        '<button class="btn btn-ghost btn-sm" id="commAddGroup" type="button">+ 팀 만들기</button>' +
      '</div>' +
      '<div class="cat-major-row" id="grpFilterRow">' +
        '<button class="cat-major'+(filter==='all'?' active':'')+'" data-gfilter="all" type="button">전체</button>' +
        (myRegion ? '<button class="cat-major'+(filter==='near'?' active':'')+'" data-gfilter="near" type="button">'+L.escapeHtml(mySido)+' 근처</button>' : '') +
        (myInterests.length ? '<button class="cat-major'+(filter==='mine'?' active':'')+'" data-gfilter="mine" type="button">내 관심</button>' : '') +
        Object.keys(L.TOPICS).map(function(k){
          return '<button class="cat-major'+(filter===k?' active':'')+'" data-gfilter="'+k+'" type="button">'+L.TOPICS[k].icon+' '+L.TOPICS[k].label+'</button>';
        }).join('') +
      '</div>' +
      collectiveGaugeHtml() +
      realGroupsHtml +
      mockAccordionHtml +
      '<p class="faint" style="margin-top:10px;">팀을 눌러 인증·랭킹·미션을 확인해보세요 · 참여 기록은 이 기기에 저장돼요</p>';

    body.querySelectorAll('[data-gfilter]').forEach(function(b){
      b.addEventListener('click', function(){
        L.state.groupFilter = b.dataset.gfilter;
        renderCommGroups(body);
      });
    });
    body.querySelectorAll('[data-open-group]').forEach(function(card){
      card.addEventListener('click', function(e){
        if(e.target.closest('[data-join]')) return;
        L.state.activeGroupId = card.dataset.openGroup;
        renderCommGroups(body);
      });
    });
    body.querySelectorAll('[data-join]').forEach(function(btn){
      btn.addEventListener('click', async function(e){
        e.stopPropagation();
        var gs = L.groupState(btn.dataset.join);
        gs.joined = !gs.joined;
        await L.saveProfile();
        L.toast(gs.joined ? '참여했어요 · 오늘부터 인증해봐요' : '참여를 취소했어요');
        renderCommGroups(body);
      });
    });
    var heroCommBtn = document.getElementById('btnHeroCreateTeamComm');
    if(heroCommBtn){
      heroCommBtn.addEventListener('click', function(){
        L.triggerHapticFeedback(12);
        promptNewGroup(body);
      });
    }
    body.querySelectorAll('[data-tgtplquick]').forEach(function(btn){
      btn.addEventListener('click', function(){
        L.triggerHapticFeedback(12);
        var preset = L.getTeamGoalTemplatePreset(btn.dataset.tgtplquick);
        promptNewGroup(body, preset);
      });
    });
    body.querySelectorAll('[data-tplgroup-create]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        L.triggerHapticFeedback(12);
        var gid = btn.dataset.tplgroupCreate;
        var preset = L.getTeamGoalTemplatePreset(gid);
        promptNewGroup(body, preset);
      });
    });
    body.querySelectorAll('[data-toggle-mock-section]').forEach(function(btn){
      btn.addEventListener('click', function(){
        L.triggerHapticFeedback(12);
        L.state.mockSectionOpen = L.state.mockSectionOpen === false ? true : false;
        renderCommGroups(body);
      });
    });
    document.getElementById('commAddGroup').addEventListener('click', function(){ L.triggerHapticFeedback(12); promptNewGroup(body); });
  }
  /* ---- 이전 전 index.html 17203~17430줄(#TASK-ES-474 생성기 표지) ---- */

  function renderGroupDetail(body, g){
    var gs = L.groupState(g.id);
    var checked = L.groupCheckedToday(g.id);
    var myStreak = L.groupStreak(g.id);
    var myCount = gs.checkins.length;
    var weeklyDone = g.weeklyDone + myCount;
    var weeklyPct = Math.min(100, Math.round((weeklyDone / g.weeklyTarget) * 100));
    var roster = g.roster.concat([{ n: L.state.profile.displayName, c: myCount, me:true }])
      .sort(function(a,b){ return b.c - a.c; });
    var myRank = roster.findIndex(function(r){ return r.me; }) + 1;
    var acts = (gs.checkins.slice(-3).reverse().map(function(d){
      return { me:true, text:'내가 '+L.fmtDateLabel(d+'T00:00:00')+' 인증했어요' };
    })).concat(g.activity.map(function(a){ return { me:false, text:a }; }));

    gs.verifications = gs.verifications || [];
    var allVerifications = (gs.verifications || []).concat(g.verifications || []);
    var draftPhotoUrl = '';
    var isOwner = gs.myRole === 'owner';
    var ownerBadge = isOwner ? '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;"><span style="font-size:1.1rem;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18"/><path d="m4 8 4 5 4-7 4 7 4-5-1 10H5z"/></svg></span><span style="font-size:.8125rem;font-weight:700;color:var(--sage);background:var(--sage-soft);border:1px solid var(--sage-soft);padding:2px 8px;border-radius:999px;">팀장</span></div>' : '';

    body.innerHTML =
      '<span class="dm-back" id="grpBack">‹ 팀 목록</span>' +
      '<div class="collective-card">' +
        ownerBadge +
        '<div class="collective-top"><b>'+g.icon+' '+L.escapeHtml(g.name)+'</b>' +
          '<span class="dday-pill" style="background:var(--red-soft);color:var(--brand-strong);">'+g.endDate+' · '+L.dDay(g.endDate)+'</span></div>' +
        '<div style="margin:0 0 8px;display:flex;gap:4px;flex-wrap:wrap;">'+L.topicPill(g.topic)+
          (g.region ? '<span class="topic-pill" style="background:var(--gold-soft);color:var(--gold);border-color:var(--gold-line);">'+(g.region==='온라인'?'온라인 팀':''+L.escapeHtml(g.region)+' 오프라인 가능')+'</span>' : '')+'</div>' +
        '<p class="faint" style="margin:0 0 10px;">'+L.escapeHtml(g.desc)+' · '+g.cadence+' 인증</p>' +
        '<div class="collective-track"><div class="collective-fill" style="width:'+g.progress+'%;"></div></div>' +
        '<p class="faint" style="margin:8px 0 0;">참여자 '+(g.members+(gs.joined?1:0))+'명의 공동 달성률 '+g.progress+'%</p>' +
      '</div>' +

      /* [PEER INVITE] 친구와 1:1 또는 5인 소그룹 초대 루프 카드 */
      (function(){
        var max = g.maxMembers || (g.roomType==='pair' ? 2 : (g.roomType==='small' ? 5 : 50));
        var cur = g.members + (gs.joined?1:0);
        var rem = Math.max(0, max - cur);
        var isPair = max === 2;
        var isSmall = max <= 5 && !isPair;
        var isFull = rem === 0;
        return '<div class="card" style="background:var(--surface-2);border:1.4px solid var(--brand-line);margin-bottom:12px;">' +
          '<div class="card-title-row" style="margin-bottom:6px;">' +
            '<h3 style="display:flex;align-items:center;gap:6px;font-size:.9375rem;margin:0;">' +
              '<span>'+(isPair ? '친구와 1:1 페어 완주방' : (isSmall ? '5인 소그룹 완주방' : '함께 목표 방'))+'</span>' +
            '</h3>' +
            '<span class="dday-pill" style="background:var(--red-soft);color:var(--brand-strong);font-size:.6875rem;font-weight:700;">방 초대 루프</span>' +
          '</div>' +
          '<p class="muted" style="margin:0 0 10px;font-size:.8125rem;line-height:1.45;">' +
            (isPair ? (isFull ? '1:1 완주 페어 매칭이 완료되었습니다! 서로의 페이스메이커로 함께 완주해요.' : '친구 1명을 초대해 1:1 페이스메이커로 함께 목표를 완주해보세요!')
                    : (isFull ? '소그룹 정원이 모두 찼어요! 멤버들과 함께 완주 목표를 향해 달려요.' : '친구를 초대해 소그룹을 완성하고 웹에서 앱 설치 없이 바로 함께 시작해요.')) +
          '</p>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--card);padding:10px 12px;border-radius:12px;border:1px solid var(--rule);margin-bottom:10px;">' +
            '<div>' +
              '<div style="font-size:.8125rem;color:var(--ink-faint);">참여 인원 현황</div>' +
              '<div style="font-size:.9375rem;font-weight:700;color:var(--ink);margin-top:2px;">' +
                cur + ' / ' + max + '명 ' + (isFull ? '<span style="color:var(--sage);font-size:.8125rem;font-weight:700;">(정원 마감 🏅)</span>' : '<span style="color:var(--brand-strong);font-size:.8125rem;font-weight:700;">(잔여 '+rem+'자리)</span>') +
              '</div>' +
            '</div>' +
            '<div style="font-size:1.5rem;">'+(isFull ? '🏅' : (isPair ? '🏃‍♂️🏃‍♀️' : '👥'))+'</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;">' +
            '<button class="btn btn-kakao" id="grpKakaoInviteBtn" type="button" style="flex:1;font-size:.8125rem;padding:8px 6px;justify-content:center;">카카오톡 초대</button>' +
            '<button class="btn btn-ghost" id="grpCopyLinkBtn" type="button" style="flex:1;font-size:.8125rem;padding:8px 6px;justify-content:center;">초대 링크 복사</button>' +
          '</div>' +
          '<p class="faint" style="font-size:.6875rem;text-align:center;margin:6px 0 0;">카톡 공유 시 친구가 앱 설치 없이 웹에서 바로 초대 수락하고 참여할 수 있어요</p>' +
        '</div>';
      })() +

      (gs.joined ?
        '<div class="card" style="border:1.6px solid '+(checked?'var(--sage)':'var(--red)')+';">' +
          '<div class="card-title-row"><h3>'+(checked?'오늘 인증 완료 ✅':'오늘의 인증')+'</h3>' +
            (myStreak>0 ? L.streakBadgeHtml(myStreak) : '') + '</div>' +
          '<p class="muted" style="margin:0 0 10px;">'+L.escapeHtml(g.rule)+'</p>' +
          '<div style="background:var(--card2);border-radius:12px;padding:12px;border:1px solid var(--rule);margin-bottom:10px;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<div id="grpPhotoPreview" style="width:60px;height:60px;border-radius:10px;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:1.6rem;overflow:hidden;border:1px solid var(--rule);flex:0 0 auto;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>' +
              '<div style="flex:1;min-width:0;">' +
                '<button class="btn btn-ghost btn-sm" id="grpPickPhotoBtn" type="button" style="font-size:.8125rem;">인증 사진 선택</button>' +
                '<input type="file" id="grpPhotoFileInput" accept="image/*" style="display:none;">' +
                '<div class="faint" style="font-size:.7rem;margin-top:4px;">당일 운동 완료, WOD 기록, 체육관 사진을 올려요</div>' +
              '</div>' +
            '</div>' +
            '<input id="grpPhotoMemoInput" type="text" placeholder="실천 한줄 메모 (예: 오늘 Fran WOD 15분 완주! 🔥)" style="margin-top:8px;width:100%;box-sizing:border-box;font-size:.875rem;padding:7px 10px;border-radius:8px;border:1px solid var(--rule);background:var(--surface-2);color:var(--ink);">' +
            '<button class="mz-btn" id="grpPhotoSubmitBtn" type="button" style="margin-top:10px;width:100%;">오늘 사진과 함께 인증하기</button>' +
          '</div>' +
          (checked ? '<p class="faint" style="margin:0;font-size:.8125rem;">이미 오늘 인증을 완료했어요. 추가 인증 사진도 언제든 피드에 올릴 수 있어요!</p>' : '') +
        '</div>' : '') +

      (allVerifications.length ?
        '<div class="card">' +
          '<div class="card-title-row"><h3>오늘의 멤버 인증 피드</h3><span class="dday-pill" style="background:var(--surface-2);color:var(--ink);">'+allVerifications.length+'개 인증</span></div>' +
          '<div class="grp-photo-grid">' +
            allVerifications.map(function(v){
              return '<div class="grp-photo-card">' +
                (v.photoUrl ? '<img src="'+L.escapeHtml(v.photoUrl)+'" class="grp-photo-img" alt="인증">' : '<div class="grp-photo-img" style="display:flex;align-items:center;justify-content:center;font-size:2rem;background:var(--card2);"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>') +
                '<div class="grp-photo-meta">' +
                  '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">' +
                    '<b style="font-size:.8125rem;">'+(v.userAvatar||'👤')+' '+L.escapeHtml(v.userName)+'</b>' +
                    '<span class="faint" style="font-size:.6875rem;">'+L.escapeHtml(v.time||'')+'</span>' +
                  '</div>' +
                  (v.note ? '<div style="font-size:.8125rem;color:var(--ink);line-height:1.4;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">'+L.escapeHtml(v.note)+'</div>' : '') +
                  '<button class="btn btn-ghost btn-sm" data-cheervf="'+v.id+'" type="button" style="width:100%;font-size:.7rem;padding:3px 6px;">응원 ('+(v.cheers||0)+')</button>' +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' : '') +

      '<div class="card">' +
        '<div class="card-title-row"><h3>이번 주 팀 미션</h3><span class="collective-pct" style="font-size:.9rem;">'+weeklyPct+'%</span></div>' +
        '<p class="muted" style="margin:0 0 8px;">팀 전체 '+g.weeklyTarget+'회 인증하기 · 현재 '+weeklyDone+'회</p>' +
        '<div class="collective-track"><div class="collective-fill" style="width:'+weeklyPct+'%;"></div></div>' +
        (weeklyPct>=100 ? '<p style="margin:10px 0 0;color:var(--sage);font-weight:700;font-size:.875rem;">이번 주 미션 달성! 팀 배지를 받았어요</p>'
                        : '<p class="faint" style="margin:8px 0 0;">'+(g.weeklyTarget-weeklyDone)+'회 남았어요 · 내 인증 1회가 팀 기록이 돼요</p>') +
      '</div>' +

      '<div class="card">' +
        '<h3 style="margin-bottom:10px;">이번 주 인증 랭킹</h3>' +
        roster.slice(0,6).map(function(r, i){
          var streak = r.me ? myStreak : Math.max(1, Math.round(r.c * 0.6));
          return '<div class="item-stat-row"'+(r.me?' style="border-color:var(--brand-strong);background:var(--red-soft);"':'')+'>' +
            '<span class="ico">'+(i===0?'🥇':(i===1?'🥈':(i===2?'🥉':(i+1)+'위')))+'</span>' +
            '<span class="nm" style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+L.escapeHtml(r.n)+(r.me?' (나)':'')+'</span>' +
            (streak>=3 ? '<span style="flex:0 0 auto;">'+L.streakBadgeHtml(streak)+'</span>' : '') +
            '<span class="ct"><b>'+r.c+'</b>회</span>' +
          '</div>';
        }).join('') +
        (gs.joined ? '<p class="faint" style="margin:6px 0 0;">내 순위 '+myRank+'위 · 인증할수록 올라가요</p>' : '') +
      '</div>' +

      '<div class="card">' +
        '<div class="card-title-row"><h3>팀 활동</h3>' +
          '<button class="btn btn-ghost btn-sm" id="grpCheer" type="button">응원 보내기</button></div>' +
        acts.slice(0,6).map(function(a){
          return '<div class="rec-card'+(a.me?' doing':'')+'" style="margin-bottom:8px;"><div class="rec-text">'+L.escapeHtml(a.text)+'</div></div>';
        }).join('') +
        (gs.cheers ? '<p class="faint" style="margin:6px 0 0;">이 팀에 응원을 '+gs.cheers+'번 보냈어요</p>' : '') +
      '</div>' +

      (gs.joined ? '' : '<button class="btn btn-primary btn-block" id="grpJoinNow" type="button" style="margin-top:6px;">이 팀 참여하기</button>');

    document.getElementById('grpBack').addEventListener('click', function(){
      L.state.activeGroupId = null;
      renderCommGroups(body);
    });

    var pickPhotoBtn = body.querySelector('#grpPickPhotoBtn');
    var photoFileInput = body.querySelector('#grpPhotoFileInput');
    var photoPreview = body.querySelector('#grpPhotoPreview');
    if(pickPhotoBtn && photoFileInput){
      pickPhotoBtn.addEventListener('click', function(){ photoFileInput.click(); });
      photoFileInput.onchange = function(e){
        var f = e.target.files[0];
        if(!f) return;
        L.resizeImageToDataUrl(f, 600, function(dataUrl){
          if(!dataUrl){ L.toast('사진을 불러오지 못했어요'); return; }
          draftPhotoUrl = dataUrl;
          photoPreview.innerHTML = '<img src="'+dataUrl+'" style="width:100%;height:100%;object-fit:cover;">';
        });
      };
    }

    var photoSubmitBtn = body.querySelector('#grpPhotoSubmitBtn');
    if(photoSubmitBtn){
      photoSubmitBtn.addEventListener('click', async function(){
        var memoInput = body.querySelector('#grpPhotoMemoInput');
        var memo = memoInput ? memoInput.value.trim() : '';
        var newVf = {
          id: L.uid('vf'),
          userName: L.state.profile.displayName,
          userAvatar: (typeof L.state.profile.avatar === 'object' && L.state.profile.avatar ? L.state.profile.avatar.emoji : L.state.profile.avatar) || '👤',
          time: '방금 전',
          photoUrl: draftPhotoUrl || '',
          note: memo || (g.name + ' 오늘 인증 완료! 🔥'),
          cheers: 0
        };
        gs.verifications = gs.verifications || [];
        gs.verifications.unshift(newVf);
        gs.checkins.push(L.dateKey(L.nowISO()));
        if(navigator.vibrate) navigator.vibrate([12, 40, 24]);
        var r = photoSubmitBtn.getBoundingClientRect();
        L.burstConfetti(r.left + r.width/2, r.top + r.height/2);
        L.awardXP(L.XP_RULES.groupCheckin || 15, '팀 인증 완료');
        await L.saveProfile();
        L.toast('오늘 인증 사진을 등록했어요! 팀 기록 +1');
        renderCommGroups(body);
      });
    }

    body.querySelectorAll('[data-cheervf]').forEach(function(btn){
      btn.addEventListener('click', async function(e){
        e.stopPropagation();
        var vfid = btn.dataset.cheervf;
        var targetVf = allVerifications.find(function(x){ return x.id === vfid; });
        if(targetVf){
          targetVf.cheers = (targetVf.cheers || 0) + 1;
          if(navigator.vibrate) navigator.vibrate(10);
          await L.saveProfile();
          L.toast('응원을 보냈어요 ❤️');
          renderGroupDetail(body, g);
        }
      });
    });

    var cheerBtn = document.getElementById('grpCheer');
    if(cheerBtn) cheerBtn.addEventListener('click', async function(){
      gs.cheers = (gs.cheers||0) + 1;
      if(navigator.vibrate) navigator.vibrate(10);
      await L.saveProfile();
      L.toast('응원을 보냈어요 👏');
      renderCommGroups(body);
    });

    var joinNow = document.getElementById('grpJoinNow');
    if(joinNow) joinNow.addEventListener('click', async function(){
      gs.joined = true;
      await L.saveProfile();
      L.toast('참여했어요 · 오늘부터 인증해봐요');
      renderCommGroups(body);
    });

    var kakaoInviteBtn = body.querySelector('#grpKakaoInviteBtn');
    if(kakaoInviteBtn) kakaoInviteBtn.addEventListener('click', function(){ L.shareGroupToKakao(g); });
    var copyLinkBtn = body.querySelector('#grpCopyLinkBtn');
    if(copyLinkBtn) copyLinkBtn.addEventListener('click', function(){ L.copyGroupInviteLink(g); });
  }
  /* ---- 이전 전 index.html 17431~17446줄(#TASK-ES-474 생성기 표지) ---- */

  function collectiveGaugeHtml(){
    var joined = L.MOCK_GROUPS.filter(function(g){ return L.groupState(g.id).joined; });
    var pool = joined.length ? joined : L.MOCK_GROUPS;
    var sum = pool.reduce(function(acc,g){ return acc + (typeof g.progress==='number' ? g.progress : 0); }, 0);
    var avg = pool.length ? Math.round(sum / pool.length) : 0;
    var members = pool.reduce(function(acc,g){ return acc + g.members + (L.groupState(g.id).joined?1:0); }, 0);
    return '<div class="collective-card">' +
      '<div class="collective-top">' +
        '<b>'+(joined.length ? '참여 중인 팀 공동 챌린지' : '전체 팀 공동 챌린지')+'</b>' +
        '<span class="collective-pct">'+avg+'%</span>' +
      '</div>' +
      '<div class="collective-track"><div class="collective-fill" style="width:'+avg+'%;"></div></div>' +
      '<p class="faint" style="margin:8px 0 0;">'+pool.length+'개 팀 · 참여자 '+members.toLocaleString()+'명의 달성도를 합산했어요</p>' +
    '</div>';
  }
  /* ---- 이전 전 index.html 17447~17596줄(#TASK-ES-474 생성기 표지) ---- */

  function promptNewGroup(body, initialPreset){
    var myGoals = L.state.profile.goals;
    L.openModal(
      '<h3>새 팀 · 함께 목표 달성하기</h3>' +
      '<p class="muted" style="margin:-8px 0 6px;">함께 목표를 실천하고 서로 응원할 팀을 만들어보세요.</p>' +
      '<div style="font-size:.8125rem;color:var(--brand);margin-bottom:12px;font-weight:600;display:flex;align-items:center;gap:4px;">✨ 정원·인증 주기·기간 제약 없는 자유로운 팀이에요</div>' +
      '<div style="margin-bottom:12px;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:6px;">1초 추천 팀 템플릿</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
          '<button type="button" class="btn btn-ghost btn-sm" id="tplWorkshop" style="font-size:.8125rem;padding:4px 8px;border-color:var(--brand-strong);color:var(--brand-strong);">🏢 회사 워크숍 TF</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="tplTravel" style="font-size:.8125rem;padding:4px 8px;border-color:var(--teal);color:var(--teal);">✈️ 단체여행 플래너</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="tplMarathonPair" style="font-size:.8125rem;padding:4px 8px;border-color:var(--red-line);color:var(--brand-strong);">🏃 함께 달리는 마라톤방</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="tplMarathonSmall" style="font-size:.8125rem;padding:4px 8px;border-color:var(--rule);color:var(--ink);">🔥 목표 완주 크루</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="tplMorningPair" style="font-size:.8125rem;padding:4px 8px;">⏰ 미라클 모닝 기상방</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="tplStudySmall" style="font-size:.8125rem;padding:4px 8px;">📚 몰입 스터디룸</button>' +
        '</div>' +
      '</div>' +
      '<div class="field"><label>아이콘 (이모지)</label><input id="grpIcon" type="text" value="🔥" maxlength="4"></div>' +
      '<div class="field"><label>팀 이름</label><input id="grpName" type="text" placeholder="예: 친구와 함께하는 마라톤 완주방"></div>' +
      '<div class="field"><label>소개글</label><input id="grpDesc" type="text" placeholder="어떤 사람들과 무엇을 함께할지 자유롭게 적어주세요"></div>' +
      '<div class="field"><label>카테고리 (대범위 · 중범위)</label></div>' +
      L.categoryPickerHtml('gTopic', '') +
      '<div style="height:14px;"></div>' +
      (myGoals.length ? '<div class="field"><label>연결할 내 목표 (선택)</label><select id="grpGoal">' +
        '<option value="">연결 안 함</option>' +
        myGoals.map(function(g){ return '<option value="'+g.id+'">'+L.escapeHtml(g.title)+'</option>'; }).join('') +
      '</select></div>' : '') +
      '<div class="modal-actions"><button class="btn btn-ghost" id="grpCancel" type="button">취소</button><button class="btn btn-primary" id="grpSave" type="button">팀 만들기</button></div>',
      function(sheet){
        var gTopicRef = { value: '' };
        L.wireCategoryPicker(sheet, 'gTopic', gTopicRef);

        // ⚡ 1초 추천 방 템플릿 핸들러
        var applyPreset = function(preset){
          var elIcon = sheet.querySelector('#grpIcon'); if(elIcon) elIcon.value = preset.icon || '🔥';
          var elName = sheet.querySelector('#grpName'); if(elName) elName.value = preset.name || '';
          var elDesc = sheet.querySelector('#grpDesc'); if(elDesc) elDesc.value = preset.desc || '';
          if(preset.topic) gTopicRef.value = preset.topic;
        };
        var btnWS = sheet.querySelector('#tplWorkshop');
        if(btnWS) btnWS.onclick = function(){
          applyPreset({ icon:'🏢', name:'하반기 전사 전략 워크숍 TF', desc:'워크숍 장소 선정부터 프로그램·팀빌딩 기획까지 함께 완주해요', topic:'career/기획·전략' });
        };
        var btnTR = sheet.querySelector('#tplTravel');
        if(btnTR) btnTR.onclick = function(){
          applyPreset({ icon:'✈️', name:'설레는 단체여행 완벽 준비 크루', desc:'항공·숙소 예약부터 현장 동선 및 경비 정산까지 똑소리나게 준비해요', topic:'hobby/여행·캠핑' });
        };
        var btnMP = sheet.querySelector('#tplMarathonPair');
        if(btnMP) btnMP.onclick = function(){
          applyPreset({ icon:'🏃', name:'함께 달리는 마라톤 완주방', desc:'페이스메이커가 되어 마라톤 풀코스/하프 완주를 달성해요', topic:'health/러닝·마라톤' });
        };
        var btnMS = sheet.querySelector('#tplMarathonSmall');
        if(btnMS) btnMS.onclick = function(){
          applyPreset({ icon:'🔥', name:'목표 완주 크루', desc:'낙오자 없이 서로 응원하며 함께 목표를 완주하는 크루', topic:'health/러닝·마라톤' });
        };
        var btnMorning = sheet.querySelector('#tplMorningPair');
        if(btnMorning) btnMorning.onclick = function(){
          applyPreset({ icon:'⏰', name:'미라클 모닝 6시 기상방', desc:'서로 깨워주며 아침 6시 기상 루틴을 완성하는 방', topic:'mind/기상·수면' });
        };
        var btnStudy = sheet.querySelector('#tplStudySmall');
        if(btnStudy) btnStudy.onclick = function(){
          applyPreset({ icon:'📚', name:'몰입 스터디룸', desc:'하루 1시간 이상 집중 공부를 인증하며 시험/자격증을 정복하는 방', topic:'study/자격증·시험' });
        };
        if(initialPreset) applyPreset(initialPreset);

        sheet.querySelector('#grpCancel').addEventListener('click', L.closeModal);
        sheet.querySelector('#grpSave').addEventListener('click', async function(){
          var name = (sheet.querySelector('#grpName') ? sheet.querySelector('#grpName').value.trim() : '');
          if(!name) {
            L.toast('팀 이름을 입력해주세요.');
            return;
          }
          // #TASK-ES-319 팀 만들기 5대 제약(정원·주기·기간·규칙·진행방식) 전면 제거 기본값
          var weeks = 0; // 기간 제약 없음 (상시 지속형)
          var cadence = '자유'; // 인증 주기 제약 없음
          var maxMembers = 999999; // 정원 제약 없음 (무제한)
          var goalSel = sheet.querySelector('#grpGoal');
          var linked = goalSel && goalSel.value ? myGoals.find(function(g){ return g.id===goalSel.value; }) : null;
          var gid = L.newId();
          var inviteCode = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
          var newGroup = {
            id: gid,
            icon: (sheet.querySelector('#grpIcon') ? sheet.querySelector('#grpIcon').value.trim() : '🔥') || '🔥',
            name: name,
            topic: gTopicRef.value || 'health/러닝·마라톤',
            region: '온라인',
            members: 1,
            maxMembers: 999999,
            roomType: 'open',
            mode: 'open',
            inviteCode: inviteCode,
            ownerName: L.state.profile.displayName,
            progress: 0,
            cadence: '자유',
            endDate: null,
            desc: (sheet.querySelector('#grpDesc') ? sheet.querySelector('#grpDesc').value.trim() : '') || (linked ? '"'+linked.title+'" 목표를 함께 달성해요' : '함께 목표를 완주하는 열린 팀이에요'),
            rule: '자유 실천 (누구나 부담 없이 자유롭게 실천하고 소통해요)',
            weeklyTarget: 999999,
            weeklyDone: 0,
            roster: [{ n: L.state.profile.displayName, c: 0, me: true }],
            activity: [L.state.profile.displayName + '님이 방을 개설했어요! 친구를 초대해보세요.'],
            teamGoals: (initialPreset && initialPreset.teamGoals) ? JSON.parse(JSON.stringify(initialPreset.teamGoals)) : []
          };
          // #TASK-ES-133 새 팀 전역 공유 및 영구 보존
          if(!L.state.profile.settings.customGroups) L.state.profile.settings.customGroups = [];
          L.state.profile.settings.customGroups = L.state.profile.settings.customGroups.filter(function(g){ return g.id !== gid; });
          L.state.profile.settings.customGroups.unshift(newGroup);
          L.MOCK_GROUPS.unshift(newGroup);
          L.groupState(gid).joined = true;
          L.groupState(gid).myRole = 'owner';
          await L.saveProfile();

          // Supabase team_pings 전역 영구 등록
          var groupPing = {
            id: gid,
            group_id: 'shared_groups',
            sender_id: L.state.profile.id,
            sender_name: L.state.profile.displayName || '팀장',
            sender_avatar: newGroup.icon || '🔥',
            receiver_id: '',
            target_type: 'team_group',
            target_id: gid,
            target_title: newGroup.name,
            ping_type: 'group_creation',
            message: JSON.stringify(newGroup),
            status: 'sent',
            hidden: false,
            created_at: L.nowISO()
          };
          L.sb.from('team_pings').insert(groupPing).then(function(r){
            if(r.error) console.warn('[SharedGroup] Supabase insert warn:', r.error.message);
          });
          L.closeModal();
          L.state.activeGroupId = gid;
          if(initialPreset && initialPreset.teamGoals && initialPreset.teamGoals.length){
            L.state.activeTab = 'goals';
            L.state.goalsSubTab = 'team';
            L.state.teamGoalFilterGid = gid;
            L.renderGoalsScreen();
            L.toast('"' + newGroup.name + '" 팀을 템플릿으로 개설했어요! 내가 팀장이에요 👑');
          } else {
            renderCommGroups(body);
            L.toast('팀을 개설했어요! 친구를 초대해보세요 💌');
            L.openPeerInviteSuccessModal(newGroup);
          }
        });
      }
    );
  }

  K.loadSharedGroups = loadSharedGroups;
  K.renderCommGroups = renderCommGroups;
  K.renderGroupDetail = renderGroupDetail;
  K.collectiveGaugeHtml = collectiveGaugeHtml;
  K.promptNewGroup = promptNewGroup;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
