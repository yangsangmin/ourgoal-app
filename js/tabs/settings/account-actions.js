/**
 * OurGoal Account Actions (설정 — 이메일 로그인 제출·계정 데이터 다시 맞추기·로그아웃·초기화 단추·새 비밀번호 창)
 *
 * 「P0: 새 비밀번호 입력 모달」 묶음(openNewPasswordModal — 비밀번호 복구 링크로 들어왔을 때 OurgoalAuthSafety 창을 연다)과 「P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크」 묶음의 단추 처리기 등록 문 4개:
 * 이메일 로그인 제출(bindLoginSubmit — 로그인 뒤 기기 로그인 시각·아이디 기억·프로필 불러오기·게스트 기록 합치기·탈퇴 유예 복구 확인), 계정 데이터 다시 맞추기(bindResyncAccountDataButton), 로그아웃(bindLogoutButton), 계정 초기화(bindResetButton). 모두 index.html 원래 자리에서 부른다(등록 순서 보존).
 * 다시 맞추기 단추 변수(resyncBtn)와 탈퇴 단추 한 줄 등록은 원래 자리에 그대로 있다.
 * #TASK-ES-521(인라인 3단계 Z1 로그인·계정 1차): index.html 인라인 IIFE 의 구간(이전 전 4427~4432 · 4437~4486 · 4489~4520 · 4521~4525 · 4526~4534줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* ---- 이전 전 index.html 4427~4432줄(#TASK-ES-521 생성기 표지) ---- */
  /* ============ P0: 새 비밀번호 입력 모달 (비밀번호 복구 링크 수신 시) ============ */
  function openNewPasswordModal(){
    if(window.OurgoalAuthSafety && typeof window.OurgoalAuthSafety.openNewPasswordModal === 'function'){
      window.OurgoalAuthSafety.openNewPasswordModal();
    }
  }

  /* ---- 이전 전 index.html 4437~4486줄(#TASK-ES-521 생성기 표지) ---- */
  function bindLoginSubmit() { /* [#TASK-ES-521] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* [#TASK-ES-437] checkPendingDeletionRestore → js/tabs/settings/account-entry.js 로 옮김(인라인 스크립트 세포화 P0) */

  document.getElementById('loginSubmit').addEventListener('click', async function(){
    var u = document.getElementById('loginUser').value.trim();
    var p = document.getElementById('loginPass').value;
    var errEl = document.getElementById('loginError');
    errEl.textContent = '';
    if(!u || !p){ errEl.textContent = '아이디와 비밀번호를 입력해주세요.'; return; }
    var res = await L.sb.auth.signInWithPassword({ email: u, password: p });
    if(res.error){ errEl.textContent = '아이디 또는 비밀번호가 올바르지 않아요.'; return; }
    L.setDeviceLoginTime(Date.now());

    // 1. 아이디 저장
    try {
      var remId = document.getElementById('rememberIdCheck');
      if(remId && remId.checked){
        localStorage.setItem('ourgoal_saved_id', u);
      } else {
        localStorage.removeItem('ourgoal_saved_id');
      }
    } catch(e){}

    // 2. 이 기기에서 로그인 유지
    try {
      var remMe = document.getElementById('rememberMeCheck');
      if(remMe && !remMe.checked){
        sessionStorage.setItem('ourgoal_session_ephemeral', 'true');
      } else {
        sessionStorage.removeItem('ourgoal_session_ephemeral');
      }
    } catch(e){}

    // 3. 최근 로그인 수단 뱃지 저장
    try {
      localStorage.setItem('ourgoal_last_auth_provider', 'email');
    } catch(e){}

    L.state.profile = await L.loadProfile(res.data.user.id, u);
    try {
      if(typeof L.migrateGuestDataToUser === 'function'){
        await L.migrateGuestDataToUser(res.data.user.id, L.state.profile);
      }
    } catch(mErr){ console.warn('[loginSubmit] migrateGuestDataToUser error:', mErr); }

    // 4. 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크
    var cancelled = await L.checkPendingDeletionRestore();
    if(cancelled) return;

    L.enterApp();
  });
  } /* bindLoginSubmit */

  /* ---- 이전 전 index.html 4489~4520줄(#TASK-ES-521 생성기 표지) ---- */
  function bindResyncAccountDataButton() { /* [#TASK-ES-521] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.resyncBtn){
    L.resyncBtn.addEventListener('click', async function(){
      if(!L.state.profile || !L.state.profile.id){
        L.toast('로그인 상태를 확인할 수 없습니다.');
        return;
      }
      L.resyncBtn.disabled = true;
      L.toast('서버 및 로컬 백업에서 목표·기록·프로필을 동기화하고 복원하는 중입니다…');
      try {
        await L.syncServerRecords(true);
        var refreshed = await L.loadProfile(L.state.profile.id, L.state.profile.username, {
          display_name: L.state.profile.displayName,
          avatar_url: L.state.profile.avatarUrl
        }, 'manual_resync');
        if(refreshed){
          L.state.profile = refreshed;
          await L.saveProfile();
          L.renderAll();
          var gCount = (L.state.profile.goals || []).length;
          var rCount = (L.state.profile.records || []).length;
          L.toast('동기화 완료: 목표 ' + gCount + '개, 기록 ' + rCount + '개가 안전하게 연결되었습니다!');
        } else {
          L.toast('동기화 완료: 최신 상태입니다.');
        }
      } catch(err){
        console.warn('수동 동기화 실패:', err);
        L.toast('동기화 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        L.resyncBtn.disabled = false;
      }
    });
  }
  } /* bindResyncAccountDataButton */
  /* ---- 이전 전 index.html 4521~4525줄(#TASK-ES-521 생성기 표지) ---- */
  function bindLogoutButton() { /* [#TASK-ES-521] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */

  document.getElementById('logoutBtn').addEventListener('click', async function(){
    await L.performLogout();
    L.toast('로그아웃되었습니다.');
  });
  } /* bindLogoutButton */
  /* ---- 이전 전 index.html 4526~4534줄(#TASK-ES-521 생성기 표지) ---- */
  function bindResetButton() { /* [#TASK-ES-521] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */

  document.getElementById('resetBtn').addEventListener('click', async function(){
    if(!(await OurgoalCapabilities.call('ui.confirm', '이 계정의 모든 목표·기록·설정을 초기화할까요? 되돌릴 수 없어요.'))) return;
    var fresh = L.defaultProfile(L.state.profile.id, L.state.profile.username, L.state.profile.displayName);
    L.state.profile = fresh;
    await L.saveProfile();
    L.renderAll();
    L.toast('초기화했어요');
  });
  } /* bindResetButton */

  K.openNewPasswordModal = openNewPasswordModal;
  K.bindLoginSubmit = bindLoginSubmit;
  K.bindResyncAccountDataButton = bindResyncAccountDataButton;
  K.bindLogoutButton = bindLogoutButton;
  K.bindResetButton = bindResetButton;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
