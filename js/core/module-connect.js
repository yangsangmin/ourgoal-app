/**
 * OurGoal Module Connect (기관 — 바깥 부품에 앱 손잡이 건네기)
 *
 * 앱이 뜰 때 바깥 부품 다섯 개의 init 에 앱의 상태·함수 손잡이를 건넨다.
 * connectAuthSafety(계정 보안 OurgoalAuthSafety) · connectReactions(반응 OurgoalReactions) · connectHelpfulReason(도움돼요 이유 OurgoalHelpfulReason) · connectTeamInviteComm(팀 초대·소통 OurgoalTeamInviteComm) · connectTeamLinkedGoals(팀 연계 개인목표 OurgoalTeamLinkedGoals).
 * #TASK-ES-638(시동 배선 감싸기 1차 — 설정 시동 연결 · AI 목표 어시스턴트 서랍 · 바깥 부품 연결 · 서비스 워커): index.html 인라인 IIFE 의 구간(이전 전 5121~5132 · 5135~5148 · 5154~5161 · 5163~5170 · 5172~5178줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalUiHelpers = global.OurgoalUiHelpers || {};

  /* ---- 이전 전 index.html 5121~5132줄(#TASK-ES-638 생성기 표지) ---- */
  function connectAuthSafety() { /* [#TASK-ES-638] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(window.OurgoalAuthSafety && typeof window.OurgoalAuthSafety.init === 'function'){
    window.OurgoalAuthSafety.init({
      sb: L.sb,
      state: L.state,
      toast: L.toast,
      openModal: L.openModal,
      closeModal: L.closeModal,
      performLogout: L.performLogout,
      saveProfile: L.saveProfile,
      enterApp: L.enterApp
    });
  }
  } /* connectAuthSafety */

  /* ---- 이전 전 index.html 5135~5148줄(#TASK-ES-638 생성기 표지) ---- */
  function connectReactions() { /* [#TASK-ES-638] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* ============ KF-7 #TASK-ES-014: 반응 4종 모듈(js/reactions.js)에 앱 핸들 연결 ============ */
  if(window.OurgoalReactions && typeof window.OurgoalReactions.init === 'function'){
    window.OurgoalReactions.init({
      sb: L.sb,
      getProfile: function(){ return L.state.profile; },
      getState: function(){ return L.state; },
      toast: L.toast, escapeHtml: L.escapeHtml, openModal: L.openModal, closeModal: L.closeModal,
      saveProfile: L.saveProfile, triggerHaptic: L.triggerHaptic, burstConfetti: L.burstConfetti, timeAgo: L.timeAgoStr,
      rerenderFeed: function(){
        var b = document.getElementById('commSubBody');
        if(b && L.state.activeTab === 'comm' && L.state.commSubTab === 'feed') L.renderCommFeed(b);
      }
    });
  }
  } /* connectReactions */

  /* ---- 이전 전 index.html 5154~5161줄(#TASK-ES-638 생성기 표지) ---- */
  function connectHelpfulReason() { /* [#TASK-ES-638] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* ============ KF-5 #TASK-ES-016: 도움돼요 이유 모듈(js/helpful-reason.js)에 앱 핸들 연결 ============ */
  if(window.OurgoalHelpfulReason && typeof window.OurgoalHelpfulReason.init === 'function'){
    window.OurgoalHelpfulReason.init({
      sb: L.sb, getProfile: function(){ return L.state.profile; },
      toast: L.toast, escapeHtml: L.escapeHtml, openModal: L.openModal, closeModal: L.closeModal,
      saveProfile: L.saveProfile, timeAgo: L.timeAgoStr
    });
  }
  } /* connectHelpfulReason */

  /* ---- 이전 전 index.html 5163~5170줄(#TASK-ES-638 생성기 표지) ---- */
  function connectTeamInviteComm() { /* [#TASK-ES-638] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* ============ #TASK-ES-105: 팀 초대 및 소통/DM/동반자 모듈(js/team-invite-comm.js) 연결 ============ */
  if(window.OurgoalTeamInviteComm && typeof window.OurgoalTeamInviteComm.init === 'function'){
    window.OurgoalTeamInviteComm.init({
      getState: function(){ return L.state; }, getProfile: function(){ return L.state.profile; }, toast: L.toast, escapeHtml: L.escapeHtml, openModal: L.openModal, closeModal: L.closeModal,
      saveProfile: L.saveProfile, fmtTime: L.fmtTime, nowISO: L.nowISO, setTab: L.setTab, renderCommScreen: L.renderCommScreen, renderGoalsScreen: L.renderGoalsScreen,
      cloneTemplate: L.cloneTemplate, openShareToFeedModal: L.openShareToFeedModal, MOCK_PEOPLE: L.MOCK_PEOPLE
    });
  }
  } /* connectTeamInviteComm */

  /* ---- 이전 전 index.html 5172~5178줄(#TASK-ES-638 생성기 표지) ---- */
  function connectTeamLinkedGoals() { /* [#TASK-ES-638] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(window.OurgoalTeamLinkedGoals && typeof window.OurgoalTeamLinkedGoals.init === 'function'){
    window.OurgoalTeamLinkedGoals.init({
      getState: function(){ return L.state; }, getProfile: function(){ return L.state.profile; }, saveProfile: L.saveProfile, toast: L.toast, openModal: L.openModal, closeModal: L.closeModal,
      triggerHaptic: L.triggerHaptic, escapeHtml: L.escapeHtml, dDay: L.dDay, goalAchievement: L.goalAchievement, renderGoalsScreen: L.renderGoalsScreen, renderTeamGoalsScreen: L.renderTeamGoalsScreen,
      groupState: L.groupState, MOCK_GROUPS: L.MOCK_GROUPS
    });
  }
  } /* connectTeamLinkedGoals */

  K.connectAuthSafety = connectAuthSafety;
  K.connectReactions = connectReactions;
  K.connectHelpfulReason = connectHelpfulReason;
  K.connectTeamInviteComm = connectTeamInviteComm;
  K.connectTeamLinkedGoals = connectTeamLinkedGoals;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 시작 · gen-cell-provide.js] 이 세포가 키트에 단 이름을 등록 기관(js/core/cell-registry.js)에 스스로 등록한다 — 대조(compare) 전용, 동작 변화 0. 생성기 산출이므로 손으로 고치지 않는다. ==== */
(function (g) {
  var R = g.OurgoalCellRegistry;
  if (!R) return;
  var K = g.OurgoalUiHelpers;
  if (K) R.provide('core/module-connect', {
    connectAuthSafety: K.connectAuthSafety, connectHelpfulReason: K.connectHelpfulReason, connectReactions: K.connectReactions,
    connectTeamInviteComm: K.connectTeamInviteComm, connectTeamLinkedGoals: K.connectTeamLinkedGoals
  }, { window: [] });
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 끝] ==== */
