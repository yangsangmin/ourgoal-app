/**
 * OurGoal Guest Backup Nudge (설정 탭 — 둘러보기 백업 권유 창)
 *
 * #TASK-ES-437 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   openGuestBackupNudgeModal — 「[#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시」(이전 전 5894~5945줄)
 *   checkGuestBackupNudge — 「[#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시」(이전 전 5947~5978줄)
 * 둘러보기로 3회 기록하면 계정 연결(백업)을 권하는 창과 그 조건 확인.
 * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  function openGuestBackupNudgeModal(){
    var html = 
      '<div class="guest-backup-sheet" style="padding:16px 8px 8px;text-align:center;">' +
        '<div style="font-size:2.8rem;margin-bottom:8px;line-height:1;">🎉</div>' +
        '<h3 style="margin:0 0 8px;font-size:1.18rem;font-weight:800;color:var(--ink);letter-spacing:-0.02em;">벌써 소중한 3개의 실천이 쌓였어요!</h3>' +
        '<p style="font-size:.875rem;color:var(--ink-soft);line-height:1.55;margin:0 0 16px;">' +
          '브라우저를 닫거나 캐시가 삭제되어도 사라지지 않게<br>' +
          '<b>카카오 계정에 평생 안전하게 보관</b>할까요?' +
        '</p>' +
        '<div style="background:var(--card-subtle, rgba(0,0,0,0.03));border:1px solid var(--rule, rgba(0,0,0,0.08));border-radius:14px;padding:12px 14px;margin-bottom:18px;text-align:left;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:.84rem;color:var(--ink);font-weight:600;">' +
            '<span style="color:#10b981;font-size:1rem;">🔒</span>' +
            '<span>평생 데이터 100% 무손실 보존 (기기 변경 안심)</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;font-size:.84rem;color:var(--ink);font-weight:600;">' +
            '<span style="color:var(--brand, #3b82f6);font-size:1rem;">⚡</span>' +
            '<span>1초 만에 지금 작성한 목표·체크인 그대로 자동 연동</span>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="btn btn-kakao" id="btnGuestBackupKakao" style="width:100%;min-height:48px;font-size:.95rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;cursor:pointer;border:none;">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.86 5.31 4.66 6.72L5.5 21.5c-.08.3.24.54.5.38l4.42-2.93c.52.05 1.05.08 1.58.08 5.52 0 10-3.58 10-8S17.52 3 12 3z"/></svg>' +
          '<span>🔒 1초 만에 안전 보관하기 (카카오 연동)</span>' +
        '</button>' +
        '<button type="button" class="btn btn-ghost" id="btnGuestBackupLater" style="width:100%;min-height:44px;color:var(--ink-soft);font-weight:600;font-size:.85rem;margin-top:6px;cursor:pointer;">' +
          '나중에 할게요' +
        '</button>' +
      '</div>';

    L.openModal(html, function(sheet){
      var btnKakao = sheet.querySelector('#btnGuestBackupKakao');
      if(btnKakao){
        btnKakao.onclick = function(){
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          try {
            if(L.state.profile){
              localStorage.setItem('ourgoal_guest_profile', JSON.stringify(L.state.profile));
            }
          } catch(e){}
          L.closeModal();
          L.startOAuthLogin('kakao');
        };
      }
      var btnLater = sheet.querySelector('#btnGuestBackupLater');
      if(btnLater){
        btnLater.onclick = function(){
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          L.closeModal();
          L.toast('안전 보관은 [설정 > 계정]에서 언제든 가능해요 😊');
        };
      }
    });
  }

  function checkGuestBackupNudge(){
    var force = arguments[0];
    try {
      var p = L.state.profile;
      if(!p) return;
      var u = L.state.user;
      var pid = String(p.id || '');
      var isGuest = (!u || !u.id) && (
        p.isGuest === true ||
        pid.indexOf('guest') === 0 ||
        (typeof L.isValidRealUser === 'function' ? !L.isValidRealUser(pid) : !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pid))
      );
      if(!isGuest && !force) return;
      var recCount = (p.records && p.records.length) || 0;
      if(recCount >= 3 || force){
        var alreadyNudged = false;
        if(!force){
          try {
            alreadyNudged = !!sessionStorage.getItem('ourgoal_guest_backup_nudged');
          } catch(e){}
        }
        if(!alreadyNudged){
          try { sessionStorage.setItem('ourgoal_guest_backup_nudged', 'true'); } catch(e){}
          setTimeout(function(){
            openGuestBackupNudgeModal();
          }, 350);
        }
      }
    } catch(err){
      console.warn('[checkGuestBackupNudge] exception:', err);
    }
  }

  K.openGuestBackupNudgeModal = openGuestBackupNudgeModal;
  K.checkGuestBackupNudge = checkGuestBackupNudge;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
