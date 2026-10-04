/**
 * OurGoal Community Cell: 동반자 탭 화면 — renderCommCompanions (#TASK-ES-387 · 팀 세포 쪼개기 2차)
 *
 * js/team-invite-comm.js(1차 뒤 3,276줄)에서 동작 그대로 옮겼다(이전 전 2265~2746줄).
 *   renderCommCompanions
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>, 다른 팀 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalTeamInviteComm.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // T = js/team-invite-comm.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·상태를 getter(대입하는 상태는 setter 도)로 읽고 쓴다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 팀 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = global.OurgoalTeamCommKit = global.OurgoalTeamCommKit || {};
  var T = K.scope = K.scope || {};

  function renderCommCompanions(body){
    if(!body) body = document.getElementById('commSubBody');
    if(!body) return;

    var state = global.state || {};
    var companions = T.ensureDefaultCompanions();
    T.syncCompanionsFromDb(body);

    // [자가 치유] 기존 companions 내 가상 유저 3인 AI 플래그 자동 보정 및 영속화
    try {
      var healed = false;
      companions.forEach(function(c){
        var aiNow = T.isKnownAiCompanion(c);
        if(!!c.isAiBot !== aiNow){
          c.isAiBot = aiNow;
          healed = true;
        }
      });
      if(healed){
        T.persistCompanions();
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
        (state._companionSearchErrorDetail ? '<div class="faint" style="margin-top:6px;font-size:.6875rem;word-break:break-all;">' + T.esc(state._companionSearchErrorDetail) + '</div>' : '') +
      '</div>';
    } else if(searchResults !== null){
      if(!searchResults.length){
        searchResultsHtml = '<div style="padding:16px 12px;background:var(--surface-2);border-radius:12px;text-align:center;font-size:.8125rem;color:var(--ink-soft);margin-bottom:14px;">' +
          '“' + T.esc(searchKeyword) + '” 닉네임을 가진 실제 회원을 찾지 못했어요.<br>정확한 닉네임으로 다시 검색해보세요.' +
        '</div>';
      } else {
        searchResultsHtml = '<div style="margin-bottom:14px;background:var(--surface-2);border-radius:14px;padding:12px;border:1px solid var(--rule);">' +
          '<div style="font-size:.75rem;font-weight:700;color:var(--brand-strong);margin-bottom:8px;">🔍 실제 회원 검색 결과 (' + searchResults.length + '명)</div>' +
          searchResults.map(function(u){
            var isAdded = companions.some(function(c){
              return String(c.id || '').trim().toLowerCase() === String(u.id || '').trim().toLowerCase();
            });
            return '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--card);border:1px solid var(--rule);border-radius:10px;margin-bottom:6px;position:relative;">' +
              '<div class="comp-avatar-click" data-viewprof="' + T.esc(u.id) + '" style="width:36px;height:36px;border-radius:50%;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:1.3rem;cursor:pointer;flex:0 0 auto;overflow:hidden;" title="프로필 보기">' +
                T.safeAvatarHtml(u.avatar, 36) +
              '</div>' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                  '<div style="font-weight:700;font-size:.875rem;color:var(--ink);">' + T.esc(u.nickname) + '</div>' +
                  '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--ink-soft);">실 사용자</span>' +
                '</div>' +
                '<div class="faint" style="font-size:.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + T.esc(u.intro) + '</div>' +
              '</div>' +
              (isAdded ?
                '<span class="faint" style="font-size:.75rem;padding:4px 8px;background:var(--surface-2);border-radius:6px;flex-shrink:0;">✓ 이미 동반자</span>' :
                '<button class="btn btn-primary btn-xs" data-addcomp="' + T.esc(u.id) + '" data-request-companion="' + T.esc(u.id) + '" type="button" style="font-size:.75rem;padding:6px 12px;min-height:36px;border-radius:8px;font-weight:700;position:relative;z-index:2;cursor:pointer;touch-action:manipulation;white-space:nowrap;flex-shrink:0;">🤝 동반자 신청</button>'
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
        var isAi = T.isKnownAiCompanion(c);
        c.isAiBot = isAi;
        var badgeHtml = isAi ?
          '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--brand-strong);border:1px solid rgba(108,92,231,0.3);font-weight:700;">🤖 AI 동반자</span>' :
          '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--ink-soft);">실 사용자</span>';

        return '<div class="card" style="margin-bottom:8px;padding:12px 14px;background:var(--card);border:1px solid var(--rule);border-radius:14px;display:flex;align-items:center;gap:12px;">' +
          '<div class="comp-avatar-click" data-viewprof="' + T.esc(c.id) + '" role="button" tabindex="0" style="width:44px;height:44px;border-radius:50%;background:var(--surface-2);border:2px solid var(--brand);display:flex;align-items:center;justify-content:center;font-size:1.5rem;cursor:pointer;flex:0 0 auto;overflow:hidden;transition:transform 0.15s ease;" title="아바타를 클릭해 프로필을 확인하세요">' +
            T.safeAvatarHtml(c.avatar, 44) +
          '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;flex-wrap:wrap;">' +
              '<b style="font-size:.9375rem;color:var(--ink);cursor:pointer;" class="comp-avatar-click" data-viewprof="' + c.id + '">' + T.esc(c.nickname || c.name) + '</b>' +
              badgeHtml +
              (c.streak > 0 ? '<span style="font-size:.75rem;color:var(--brand-strong);font-weight:700;">🔥 ' + c.streak + '일</span>' : '') +
            '</div>' +
            '<div class="faint" style="font-size:.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + T.esc(c.intro || c.theme || (isAi ? '초기 활동을 함께하는 AI 동반자' : '목표를 향해 함께 달리는 동반자')) + '</div>' +
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

    var hasTopBar = !!document.getElementById('commTopCompanionBar');
    if(!hasTopBar){
    body.innerHTML = '<div class="companion-hero-card">' +
        '<div class="companion-hero-header">' +
          '<div class="companion-hero-title">' +
            '<span>🤝</span><span>목표 동반자와 함께 달리기</span>' +
          '</div>' +
          '<span class="dday-pill" style="font-weight:700;background:rgba(99,102,241,0.15);color:var(--brand-strong);">' + companions.length + '명 함께함</span>' +
        '</div>' +
        '<div class="companion-hero-desc">' +
          '서로의 목표를 실시간으로 확인하고 1터치 응원과 DM을 나누세요.<br>친구를 초대해 나의 러닝메이트로 등록해보세요!' +
        '</div>' +
        '<button type="button" class="btn-companion-invite" id="btnCopyCompanionInviteLink">' +
          '<span>🔗 내 전용 동반자 초대 링크 복사</span>' +
        '</button>' +
      '</div>' +

      '<div class="companion-search-wrap" style="margin-bottom:14px;">' +
        '<div class="companion-search-box" style="display:flex;gap:6px;background:var(--surface-2);border:1px solid var(--rule);border-radius:12px;padding:4px 6px 4px 12px;align-items:center;">' +
          '<span style="font-size:1rem;">🔍</span>' +
          '<input type="text" id="companionNicknameSearchInput" class="companion-search-input" placeholder="실시간 가입자 닉네임 검색 (0.2초 자동 탐색)" value="' + T.esc(state._companionSearchKeyword || '') + '" style="flex:1;border:none;background:transparent;padding:8px 6px;font-size:.875rem;color:var(--ink);outline:none;" autocomplete="off">' +
          '<button class="btn btn-primary btn-sm" id="companionSearchBtn" type="button" style="font-weight:700;padding:6px 14px;border-radius:10px;white-space:nowrap;">검색</button>' +
          (searchKeyword ? '<button class="btn btn-ghost btn-sm" id="companionSearchResetBtn" type="button" style="padding:6px 8px;border-radius:10px;white-space:nowrap;">초기화</button>' : '') +
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
    } else {
      body.innerHTML = '<div style="font-size:.875rem;font-weight:700;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">' +
        '<span>동반자 목록 (' + companions.length + '명)</span>' +
        '<span class="faint" style="font-size:.75rem;">아바타 클릭 시 프로필 조회</span>' +
      '</div>' +
      '<div class="companion-list-wrap">' +
        listHtml +
      '</div>';
    }

    var sInput = body.querySelector('#companionNicknameSearchInput') || body.querySelector('#companionSearchInput');
    var sBtn = body.querySelector('#companionSearchBtn');
    var sResetBtn = body.querySelector('#companionSearchResetBtn');
    var btnCopy = body.querySelector('#btnCopyCompanionInviteLink');

    if(btnCopy){
      btnCopy.addEventListener('click', async function(e){
        if(e){ e.preventDefault(); e.stopPropagation(); }
        if(typeof triggerHapticFeedback === 'function'){
          triggerHapticFeedback(15);
        }
        var myName = (state.profile && (state.profile.displayName || state.profile.name || state.profile.nickname)) || 'mate';
        var inviteUrl = 'https://ourgoal-app.vercel.app?ref=' + encodeURIComponent(myName);

        var copyFallback = function(text){
          var copied = false;
          try {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            copied = document.execCommand('copy');
            document.body.removeChild(ta);
          } catch(e){
            console.warn('[초대 링크 복사 fallback 오류]:', e);
          }
          return copied;
        };

        var didShare = false;
        if(navigator.share){
          try {
            await navigator.share({
              title: '아워골 목표 동반자 초대',
              text: myName + '님과 함께 매일 실천하는 목표 동반자가 되어주세요! 🤝',
              url: inviteUrl
            });
            didShare = true;
            T.showToast('초대 링크를 전송했어요! 💌');
          } catch(sErr){
            if(sErr && sErr.name === 'AbortError'){
              return;
            }
          }
        }

        if(!didShare){
          var clipOk = false;
          if(navigator.clipboard && navigator.clipboard.writeText){
            try {
              await navigator.clipboard.writeText(inviteUrl);
              clipOk = true;
            } catch(cErr){
              clipOk = copyFallback(inviteUrl);
            }
          } else {
            clipOk = copyFallback(inviteUrl);
          }

          if(clipOk){
            T.showToast('초대 링크가 복사되었어요! 친구에게 공유해보세요 💌');
          } else {
            T.showToast('초대 링크: ' + inviteUrl);
          }
        }
      });
    }

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
                streak: u.streak || 0,
                theme: u.theme || '일반',
                isAiBot: false
              };
              T._userCache[u.id] = obj;
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
                streak: 0,
                theme: (u.interests && u.interests[0]) || '일반',
                isAiBot: false
              };
              T._userCache[u.id] = obj;
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

    var debounceTimer = null;
    if(sInput){
      sInput.addEventListener('input', function(){
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function(){
          doSearch();
        }, 200);
      });
      sInput.addEventListener('keydown', function(e){
        if(e.key === 'Enter'){
          clearTimeout(debounceTimer);
          doSearch();
        }
      });
    }
    if(sBtn){
      sBtn.addEventListener('click', function(){
        clearTimeout(debounceTimer);
        if(typeof triggerHapticFeedback === 'function'){
          triggerHapticFeedback(12);
        }
        doSearch();
      });
    }
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
                T._userCache[uid];
        if(u) K.openUserProfileModal(u);
      });
    });

    body.querySelectorAll('[data-request-companion], [data-addcomp]').forEach(function(btn){
      btn.addEventListener('click', async function(e){
        if(e){
          e.stopPropagation();
          e.preventDefault();
        }
        if(typeof triggerHapticFeedback === 'function'){
          triggerHapticFeedback(12);
        }
        var isGuest = !state.profile || !state.profile.id || String(state.profile.id).indexOf('guest') === 0;
        if(isGuest){
          T.showGuestSoftAuthGate('동반자 추가');
          return;
        }
        var uid = String(btn.dataset.requestCompanion || btn.dataset.addcomp || '').trim();
        var target = null;
        if(state._companionSearchResults && Array.isArray(state._companionSearchResults)){
          target = state._companionSearchResults.find(function(x){
            return String(x.id || '').trim().toLowerCase() === uid.toLowerCase();
          });
        }
        if(!target && T._userCache[uid]){
          target = T._userCache[uid];
        }
        if(!target){
          console.warn('[동반자] 추가 대상 회원을 찾을 수 없음:', uid);
          T.showToast('회원 정보를 확인하는 중입니다. 다시 시도해주세요.');
          return;
        }

        var comps = T.ensureDefaultCompanions();
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
            T.persistCompanions();
          } catch(pErr){
            console.warn('[동반자] persistCompanions 오류(무시):', pErr);
          }

          T.showToast((target.nickname || target.name) + '님에게 동반자 신청을 보냈어요! 🤝');
          renderCommCompanions(body);
        } else {
          var exIdx = comps.findIndex(function(x){ return String(x.id || '').trim().toLowerCase() === String(target.id || '').trim().toLowerCase(); });
          if(exIdx >= 0){
            comps[exIdx].nickname = target.nickname || target.name || comps[exIdx].nickname;
            comps[exIdx].avatar = target.avatar || comps[exIdx].avatar;
            comps[exIdx].intro = target.intro || comps[exIdx].intro;
          }
          try {
            T.persistCompanions();
          } catch(pErr){
            console.warn('[동반자] persistCompanions 오류(무시):', pErr);
          }
          T.showToast((target.nickname || target.name) + '님은 이미 등록된 동반자입니다.');
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
        if(!(await T.askConfirm(name + '님과의 동반자 관계를 해제하시겠습니까?'))) return;
        state.profile.companions = companions.filter(function(x){ return String(x.id || '').trim().toLowerCase() !== String(uid || '').trim().toLowerCase(); });
        try { if(global.saveProfile) await global.saveProfile(); } catch(e){}
        try { T.persistCompanions(); } catch(pErr){ console.warn('[동반자] persistCompanions 오류(무시):', pErr); }
        T.showToast('동반자 관계를 해제했습니다');
        renderCommCompanions(body);
      });
    });
  }

  K.renderCommCompanions = renderCommCompanions;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
