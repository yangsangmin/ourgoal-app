/**
 * OurGoal Team Comment Send (목표 — 팀 목표 댓글 보내기와 전역 누름·Enter 위임)
 *
 * defineSendTeamGoalComment — window.sendTeamGoalComment 를 단다: 팀 목표 댓글을 화면 캐시(TEAM_COMMENTS_CACHE)와 프로필 설정(localTeamComments)에 넣고 저장한 뒤 팀 목표 화면을 다시 그리고 서버(team_comments)에 보낸다.
 * bindTeamCommentClick · bindTeamCommentKeydown — 문서 전체에서 댓글 보내기 단추([data-cmtsend]) 누름과 댓글 입력칸([data-cmtinput])의 Enter 를 받아 window.sendTeamGoalComment 를 부른다.
 * #TASK-ES-640(시동 배선 감싸기 2차 — 체크인 입력 연결 · 팀 목표 댓글 보내기 · 샘플 기록 정리 · 빠른 목표 추가): index.html 인라인 IIFE 의 구간(이전 전 3468~3508 · 3509~3531 · 3532~3554줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ---- 이전 전 index.html 3468~3508줄(#TASK-ES-640 생성기 표지) ---- */
  function defineSendTeamGoalComment() { /* [#TASK-ES-640] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* ==========================================================================
     [#TASK-ES-299] 팀 목표 댓글 작성 및 전송 직통 헬퍼 & 전역 이벤트 위임 (먹통 방어 100%)
     ========================================================================== */
  window.sendTeamGoalComment = async function(gid, targetId, customText){
    if(!gid || !targetId) return false;
    var input = document.querySelector('[data-cmtinput="'+targetId+'"]');
    var text = (typeof customText === 'string') ? customText.trim() : (input ? input.value.trim() : '');
    if(!text) return false;
    if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
    else if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
    var row = {
      id: L.uid('cmt'),
      group_id: gid,
      user_id: (L.state.profile && L.state.profile.id) || 'guest',
      display_name: (L.state.profile && L.state.profile.displayName) || '사용자',
      target_id: targetId,
      text: text,
      created_at: L.nowISO()
    };
    if(typeof L.TEAM_COMMENTS_CACHE !== 'undefined'){
      (L.TEAM_COMMENTS_CACHE[gid] = L.TEAM_COMMENTS_CACHE[gid] || []).push(row);
    }
    if(L.state && L.state.profile){
      L.state.profile.settings = L.state.profile.settings || {};
      L.state.profile.settings.localTeamComments = L.state.profile.settings.localTeamComments || {};
      (L.state.profile.settings.localTeamComments[gid] = L.state.profile.settings.localTeamComments[gid] || []).push(row);
      await L.saveProfile();
    }
    if(input){
      input.value = '';
    }
    L.state.lastOpenCommentKey = gid + ':' + targetId;
    L.toast('댓글을 남겼어요');
    if(typeof L.renderTeamGoalsScreen === 'function'){
      L.renderTeamGoalsScreen();
    }
    try {
      L.sb.from('team_comments').insert(row).catch(function(err){ console.warn('Team comment remote sync:', err); });
    } catch(e){}
    return true;
  };
  } /* defineSendTeamGoalComment */
  /* ---- 이전 전 index.html 3509~3531줄(#TASK-ES-640 생성기 표지) ---- */
  function bindTeamCommentClick() { /* [#TASK-ES-640] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */

  document.addEventListener('click', function(e){
    var sendBtn = e.target && e.target.closest && e.target.closest('[data-cmtsend]');
    if(!sendBtn) return;
    var targetId = sendBtn.getAttribute('data-cmtsend');
    var gid = sendBtn.getAttribute('data-gid');
    if(!gid){
      var parentGroup = sendBtn.closest('[data-gid]');
      if(parentGroup) gid = parentGroup.getAttribute('data-gid');
    }
    if(!gid && L.state.profile && L.state.profile.groups && L.state.profile.groups.length > 0){
      gid = L.state.profile.groups[0];
    }
    if(!gid && typeof L.MOCK_GROUPS !== 'undefined' && L.MOCK_GROUPS.length > 0){
      gid = L.MOCK_GROUPS[0].id;
    }
    var input = document.querySelector('[data-cmtinput="'+targetId+'"]');
    var text = input ? input.value.trim() : '';
    if(!text) return;
    if(typeof window.sendTeamGoalComment === 'function'){
      window.sendTeamGoalComment(gid, targetId, text);
    }
  });
  } /* bindTeamCommentClick */
  /* ---- 이전 전 index.html 3532~3554줄(#TASK-ES-640 생성기 표지) ---- */
  function bindTeamCommentKeydown() { /* [#TASK-ES-640] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */

  document.addEventListener('keydown', function(e){
    if(e.key !== 'Enter') return;
    var input = e.target && e.target.closest && e.target.closest('[data-cmtinput]');
    if(!input) return;
    var targetId = input.getAttribute('data-cmtinput');
    var gid = input.getAttribute('data-gid');
    if(!gid){
      var parentGroup = input.closest('[data-gid]');
      if(parentGroup) gid = parentGroup.getAttribute('data-gid');
    }
    if(!gid && L.state.profile && L.state.profile.groups && L.state.profile.groups.length > 0){
      gid = L.state.profile.groups[0];
    }
    if(!gid && typeof L.MOCK_GROUPS !== 'undefined' && L.MOCK_GROUPS.length > 0){
      gid = L.MOCK_GROUPS[0].id;
    }
    var text = input.value.trim();
    if(!text) return;
    if(typeof window.sendTeamGoalComment === 'function'){
      window.sendTeamGoalComment(gid, targetId, text);
    }
  });
  } /* bindTeamCommentKeydown */

  K.defineSendTeamGoalComment = defineSendTeamGoalComment;
  K.bindTeamCommentClick = bindTeamCommentClick;
  K.bindTeamCommentKeydown = bindTeamCommentKeydown;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 시작 · gen-cell-provide.js] 이 세포가 키트에 단 이름을 등록 기관(js/core/cell-registry.js)에 스스로 등록한다 — 대조(compare) 전용, 동작 변화 0. 생성기 산출이므로 손으로 고치지 않는다. ==== */
(function (g) {
  var R = g.OurgoalCellRegistry;
  if (!R) return;
  var K = g.OurgoalGoalsKit;
  if (K) R.provide('goals/team-comment-send', {
    bindTeamCommentClick: K.bindTeamCommentClick, bindTeamCommentKeydown: K.bindTeamCommentKeydown,
    defineSendTeamGoalComment: K.defineSendTeamGoalComment
  }, { window: [] });
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 끝] ==== */
