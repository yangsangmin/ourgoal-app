/**
 * OurGoal Community Cell: 소통 탭 상단 초대 링크·닉네임 검색 바 — renderCommTopInviteSearch (#TASK-ES-387 · 팀 세포 쪼개기 2차)
 *
 * js/team-invite-comm.js(1차 뒤 3,276줄)에서 동작 그대로 옮겼다(이전 전 1956~2263줄).
 *   renderCommTopInviteSearch
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>, 다른 팀 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalTeamInviteComm.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // T = js/team-invite-comm.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·상태를 getter(대입하는 상태는 setter 도)로 읽고 쓴다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 팀 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = global.OurgoalTeamCommKit = global.OurgoalTeamCommKit || {};
  var T = K.scope = K.scope || {};

  /* ------------------------------------------------------------
   * 7-0-1. 소통 탭 상단 [🔗 초대 링크 복사] & [🔍 닉네임 검색] 상단 바 렌더링
   * #TASK-ES-231 [생각 메모장 101번]
   * ------------------------------------------------------------ */
  function renderCommTopInviteSearch(container){
    if(!container) container = document.getElementById('commTopCompanionBar');
    if(!container) return;

    var state = global.state || {};
    var companions = T.ensureDefaultCompanions();

    var searchKeyword = (state._companionSearchKeyword || '').trim();
    var searchResults = state._companionSearchResults || null;
    var isSearching = state._companionIsSearching === true;
    var searchError = state._companionSearchError || null;
    var searchResultsHtml = '';

    if(isSearching){
      searchResultsHtml = '<div style="padding:14px 12px;background:var(--surface-2);border-radius:12px;text-align:center;font-size:.8125rem;color:var(--ink-soft);margin-bottom:10px;">' +
        '회원 데이터베이스에서 실제 사용자를 검색하고 있습니다... 🔍' +
      '</div>';
    } else if(searchError === 'guest'){
      searchResultsHtml = '<div style="padding:14px 12px;background:var(--surface-2);border-radius:12px;text-align:center;font-size:.8125rem;color:var(--ink-soft);margin-bottom:10px;">' +
        '로그인하면 실제 회원을 닉네임으로 검색하고 동반자로 추가할 수 있어요.' +
      '</div>';
    } else if(searchError === 'session'){
      searchResultsHtml = '<div style="padding:14px 12px;background:var(--surface-2);border-radius:12px;text-align:center;font-size:.8125rem;color:var(--ink-soft);margin-bottom:10px;">' +
        '로그인 세션이 만료됐어요. 로그아웃 후 다시 로그인해주세요.' +
      '</div>';
    } else if(searchError === 'error'){
      searchResultsHtml = '<div style="padding:14px 12px;background:var(--surface-2);border-radius:12px;text-align:center;font-size:.8125rem;color:var(--ink-soft);margin-bottom:10px;">' +
        '검색 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.' +
        (state._companionSearchErrorDetail ? '<div class="faint" style="margin-top:6px;font-size:.6875rem;word-break:break-all;">' + T.esc(state._companionSearchErrorDetail) + '</div>' : '') +
      '</div>';
    } else if(searchResults !== null){
      if(!searchResults.length){
        searchResultsHtml = '<div style="padding:14px 12px;background:var(--surface-2);border-radius:12px;text-align:center;font-size:.8125rem;color:var(--ink-soft);margin-bottom:10px;">' +
          '“' + T.esc(searchKeyword) + '” 닉네임을 가진 실제 회원을 찾지 못했어요.<br>정확한 닉네임으로 다시 검색해보세요.' +
        '</div>';
      } else {
        searchResultsHtml = '<div style="margin-bottom:10px;background:var(--surface-2);border-radius:14px;padding:12px;border:1px solid var(--rule);">' +
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
                  '<div style="font-weight:700;font-size:.875rem;color:var(--ink);">' + (typeof formatDisplayNameWithTag === 'function' ? formatDisplayNameWithTag(u.nickname || u.name) : T.esc(u.nickname || u.name)) + '</div>' +
                  '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--brand-strong);border:1px solid rgba(108,92,231,0.2);">' + T.esc(u.theme || '실천') + '</span>' +
                  '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--ink-soft);">🔥 Lv.' + (u.level || 1) + (u.streak > 0 ? ' · ' + u.streak + '일 연속' : '') + '</span>' +
                '</div>' +
                '<div class="faint" style="font-size:.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + T.esc(u.intro || '함께 실천하는 아워골 동반자') + '</div>' +
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

    container.innerHTML = '<div class="companion-hero-card" style="margin-top:8px;margin-bottom:8px;padding:12px 14px;border-radius:16px;">' +
        '<div class="companion-hero-header" style="margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;">' +
          '<div class="companion-hero-title" style="font-size:.875rem;display:flex;align-items:center;gap:6px;font-weight:700;">' +
            '<span>🤝</span><span>동반자 초대 &amp; 실시간 검색</span>' +
          '</div>' +
          '<span class="dday-pill" style="font-weight:700;font-size:.6875rem;background:rgba(99,102,241,0.15);color:var(--brand-strong);">' + companions.length + '명 함께함</span>' +
        '</div>' +
        '<div class="companion-hero-desc" style="font-size:.75rem;margin-bottom:10px;color:var(--ink-soft);line-height:1.4;">' +
          '친구를 초대해 나의 러닝메이트로 영입하고 1터치 응원을 나눠보세요!' +
        '</div>' +
        '<button type="button" class="btn-companion-invite" id="btnCopyCompanionInviteLink" style="min-height:38px;padding:8px 14px;font-size:.8125rem;">' +
          '<span>🔗 내 전용 동반자 초대 링크 복사</span>' +
        '</button>' +
      '</div>' +

      '<div class="companion-search-wrap" style="margin-bottom:12px;">' +
        '<div class="companion-search-box" style="display:flex;gap:6px;background:var(--surface-2);border:1px solid var(--rule);border-radius:12px;padding:4px 6px 4px 12px;align-items:center;">' +
          '<span style="font-size:.9375rem;">🔍</span>' +
          '<input type="text" id="companionNicknameSearchInput" class="companion-search-input" placeholder="실시간 가입자 닉네임 검색 (0.2초 자동 탐색)" value="' + T.esc(state._companionSearchKeyword || '') + '" style="flex:1;border:none;background:transparent;padding:8px 6px;font-size:.875rem;color:var(--ink);outline:none;" autocomplete="off">' +
          '<button class="btn btn-primary btn-sm" id="companionSearchBtn" type="button" style="font-weight:700;padding:5px 12px;border-radius:10px;white-space:nowrap;font-size:.8125rem;min-height:32px;">검색</button>' +
          (searchKeyword ? '<button class="btn btn-ghost btn-sm" id="companionSearchResetBtn" type="button" style="padding:5px 8px;border-radius:10px;white-space:nowrap;font-size:.8125rem;">초기화</button>' : '') +
        '</div>' +
        '<div id="companionSearchResultsSlot">' + searchResultsHtml + '</div>' +
      '</div>';

    var sInput = container.querySelector('#companionNicknameSearchInput');
    var sBtn = container.querySelector('#companionSearchBtn');
    var sResetBtn = container.querySelector('#companionSearchResetBtn');
    var btnCopy = container.querySelector('#btnCopyCompanionInviteLink');

    if(btnCopy){
      btnCopy.addEventListener('click', K.copyCompanionInviteLink);
    }

    var doSearch = async function(){
      if(!sInput) return;
      var q = sInput.value.trim();
      if(!q){
        state._companionSearchKeyword = '';
        state._companionSearchResults = null;
        state._companionSearchError = null;
        renderCommTopInviteSearch(container);
        return;
      }

      state._companionSearchKeyword = q;
      state._companionIsSearching = true;
      state._companionSearchError = null;
      renderCommTopInviteSearch(container);

      var matched = [];

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
        console.warn('[동반자 상단] /api/track 검색 오류(RPC 폴백 시도):', apiErr);
      }

      if(!matched.length && global.sb){
        try {
          var res = await global.sb.rpc('search_users_by_nickname', { p_query: q });
          if(res && res.error){
            console.warn('[동반자 상단] Supabase RPC 검색 경고:', res.error);
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
          console.warn('[동반자 상단] Supabase RPC 검색 오류:', rpcErr);
        }
      }

      // [#TASK-ES-320] 고유 태그(#1234) 핀포인트 검색 최우선 매칭 정렬
      if(matched.length > 1 && q.indexOf('#') !== -1){
        var tagMatch = q.match(/#\d{4}/);
        if(tagMatch){
          var targetTag = tagMatch[0].toLowerCase();
          matched.sort(function(a, b){
            var aHas = String(a.nickname || a.name || '').toLowerCase().indexOf(targetTag) !== -1 ? 1 : 0;
            var bHas = String(b.nickname || b.name || '').toLowerCase().indexOf(targetTag) !== -1 ? 1 : 0;
            return bHas - aHas;
          });
        }
      }

      state._companionIsSearching = false;
      state._companionSearchError = null;
      state._companionSearchResults = matched;
      renderCommTopInviteSearch(container);
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
        renderCommTopInviteSearch(container);
      });
    }

    container.querySelectorAll('.comp-avatar-click').forEach(function(el){
      el.addEventListener('click', function(e){
        if(e){ e.stopPropagation(); e.preventDefault(); }
        var uid = el.dataset.viewprof;
        if(uid && K.openUserProfileModal) K.openUserProfileModal(uid);
      });
    });

    container.querySelectorAll('[data-request-companion], [data-addcomp]').forEach(function(btn){
      btn.addEventListener('click', async function(e){
        if(e){ e.stopPropagation(); e.preventDefault(); }
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
          T.showToast('회원 정보를 확인하는 중입니다. 다시 시도해주세요.');
          return;
        }

        var comps = T.ensureDefaultCompanions();
        var alreadyExists = comps.some(function(x){
          return String(x.id || '').trim().toLowerCase() === String(target.id || '').trim().toLowerCase();
        });

        if(!alreadyExists){
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

          try { if(global.saveProfile) await global.saveProfile(); } catch(err){}
          try { T.persistCompanions(); } catch(pErr){}

          T.showToast((target.nickname || target.name) + '님에게 동반자 신청을 보냈어요! 🤝');
          renderCommTopInviteSearch(container);
          var subBody = document.getElementById('commSubBody');
          if(subBody && state.commSubTab === 'companion'){
            K.renderCommCompanions(subBody);
          }
        } else {
          T.showToast((target.nickname || target.name) + '님은 이미 등록된 동반자입니다.');
        }
      });
    });
  }

  K.renderCommTopInviteSearch = renderCommTopInviteSearch;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
