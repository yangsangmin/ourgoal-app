/**
 * OurGoal User Blocks (소통 — 신고 숨김·차단 사용자 거르기와 차단 관리)
 *
 * 「RENDER: 팀 목표」 묶음 중 숨김·차단 몫: 신고 자동 숨김 거르기(filterHidden) · 차단한 사용자의 글·댓글 거르기(filterBlockedPosts) · 차단 여부(isUserBlocked) · 차단·해제(blockUser·unblockUser — 프로필 settings.blockedUsers + 서버 user_blocks) · 설정 「차단한 사용자 관리」 창(openBlockedUsersModal).
 * filterHidden·filterBlockedPosts 는 smoke-test FN_NAMES 다 — 시험지가 인라인 합본(js/tabs/**)에서 같은 함수를 찾는다(#TASK-ES-465).
 * #TASK-ES-545(인라인 3단계 Z2 팀·소통 — 팀 목표 댓글·차단·목표 순서): index.html 인라인 IIFE 의 구간(이전 전 9060~9063 · 9117~9131 · 9132~9137 · 9138~9163 · 9164~9180 · 9181~9212줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 9060~9063줄(#TASK-ES-545 생성기 표지) ---- */
  /* 숨김 처리된 게시물·댓글 제외(신고 자동 숨김) — 성장 백로그 P0 5 */
  function filterHidden(list){
    return (list || []).filter(function(x){ return !!x && !x.hidden; });
  }

  /* ---- 이전 전 index.html 9117~9131줄(#TASK-ES-545 생성기 표지) ---- */

  /* 차단된 사용자의 게시물·댓글 제외 (TASK-CB-004) */
  function filterBlockedPosts(posts, blockedList){
    if(!posts || !Array.isArray(posts)) return [];
    var map = {};
    (blockedList || []).forEach(function(b){
      if(typeof b === 'string') map[b] = true;
      else if(b && b.id) map[b.id] = true;
    });
    return posts.filter(function(p){
      if(!p) return false;
      var uid = p.userId || p.user_id;
      return !uid || !map[uid];
    });
  }
  /* ---- 이전 전 index.html 9132~9137줄(#TASK-ES-545 생성기 표지) ---- */

  function isUserBlocked(userId){
    if(!userId) return false;
    var list = (L.state.profile && L.state.profile.settings && L.state.profile.settings.blockedUsers) || [];
    return list.some(function(b){ return (typeof b === 'string' ? b : (b && b.id)) === userId; });
  }
  /* ---- 이전 전 index.html 9138~9163줄(#TASK-ES-545 생성기 표지) ---- */

  async function blockUser(userId, userName){
    if(!userId) return;
    if(userId === L.state.profile.id){
      L.toast('자기 자신은 차단할 수 없어요');
      return;
    }
    var displayName = userName || '이 사용자';
    if(!(await OurgoalCapabilities.call('ui.confirm', displayName + '님을 차단할까요?\r\n차단하면 내 화면에서 이 사용자의 게시물과 댓글이 숨겨집니다.'))) return;
    var settings = L.state.profile.settings;
    if(!settings.blockedUsers) settings.blockedUsers = [];
    if(!settings.blockedUsers.some(function(b){ return (typeof b === 'string' ? b : b.id) === userId; })){
      settings.blockedUsers.push({ id: userId, name: displayName, at: L.nowISO() });
    }
    try{
      await L.sb.from('user_blocks').insert({ blocker_id: L.state.profile.id, blocked_id: userId });
    }catch(e){}
    await L.saveProfile();
    L.toast(displayName + '님을 차단했어요');
    if(L.state.activeTab === 'comm'){
      var subBody = document.getElementById('commSubBody');
      if(subBody && L.state.commSubTab === 'feed') L.renderCommFeed(subBody);
    } else if(L.state.activeTab === 'goals' && L.state.goalsSubTab === 'team'){
      L.renderTeamGoalsScreen();
    }
  }
  /* ---- 이전 전 index.html 9164~9180줄(#TASK-ES-545 생성기 표지) ---- */

  async function unblockUser(userId){
    var settings = L.state.profile.settings;
    if(!settings.blockedUsers) return;
    settings.blockedUsers = settings.blockedUsers.filter(function(b){ return (typeof b === 'string' ? b : b.id) !== userId; });
    try{
      await L.sb.from('user_blocks').delete().eq('blocker_id', L.state.profile.id).eq('blocked_id', userId);
    }catch(e){}
    await L.saveProfile();
    L.toast('차단을 해제했어요');
    if(L.state.activeTab === 'comm'){
      var subBody = document.getElementById('commSubBody');
      if(subBody && L.state.commSubTab === 'feed') L.renderCommFeed(subBody);
    } else if(L.state.activeTab === 'goals' && L.state.goalsSubTab === 'team'){
      L.renderTeamGoalsScreen();
    }
  }
  /* ---- 이전 전 index.html 9181~9212줄(#TASK-ES-545 생성기 표지) ---- */

  function openBlockedUsersModal(){
    var list = (L.state.profile.settings && L.state.profile.settings.blockedUsers) || [];
    var listHtml = list.length === 0
      ? '<p class="muted" style="text-align:center;padding:24px 0;">차단한 사용자가 없습니다.</p>'
      : list.map(function(b){
          var bid = typeof b === 'string' ? b : b.id;
          var bname = typeof b === 'string' ? '사용자' : (b.name || '사용자');
          var bat = (typeof b === 'object' && b.at) ? b.at.slice(0, 10) : '-';
          return '<div class="blocked-user-row">' +
            '<div><b>' + L.escapeHtml(bname) + '</b><div class="faint" style="font-size:.8125rem;">차단일: ' + bat + '</div></div>' +
            '<button class="btn-unblock" data-unblockid="' + bid + '" type="button">차단 해제</button>' +
          '</div>';
        }).join('');

    L.openModal(
      '<h3>차단한 사용자 관리</h3>' +
      '<p class="muted" style="margin:-6px 0 14px;font-size:.8125rem;">차단된 사용자의 글과 댓글은 피드에서 숨겨집니다.</p>' +
      '<div style="max-height:280px;overflow-y:auto;margin-bottom:16px;">' + listHtml + '</div>' +
      '<div class="modal-actions"><button class="btn btn-primary btn-block" id="closeBlockedModal" type="button">닫기</button></div>',
      function(sheet){
        sheet.querySelector('#closeBlockedModal').addEventListener('click', L.closeModal);
        sheet.querySelectorAll('[data-unblockid]').forEach(function(btn){
          btn.addEventListener('click', async function(){
            await unblockUser(btn.dataset.unblockid);
            L.closeModal();
            openBlockedUsersModal();
          });
        });
      }
    );
  }

  K.filterHidden = filterHidden;
  K.filterBlockedPosts = filterBlockedPosts;
  K.isUserBlocked = isUserBlocked;
  K.blockUser = blockUser;
  K.unblockUser = unblockUser;
  K.openBlockedUsersModal = openBlockedUsersModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
