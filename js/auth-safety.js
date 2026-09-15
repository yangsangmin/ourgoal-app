(function(window){
  'use strict';

  var sbClient = null;
  var stateRef = null;
  var toastFn = function(m){ console.log(m); };
  var openModalFn = null;
  var closeModalFn = null;
  var performLogoutFn = null;
  var saveProfileFn = null;
  var enterAppFn = null;

  function init(deps){
    if(!deps) return;
    sbClient = deps.sb;
    stateRef = deps.state;
    if(deps.toast) toastFn = deps.toast;
    if(deps.openModal) openModalFn = deps.openModal;
    if(deps.closeModal) closeModalFn = deps.closeModal;
    if(deps.performLogout) performLogoutFn = deps.performLogout;
    if(deps.saveProfile) saveProfileFn = deps.saveProfile;
    if(deps.enterApp) enterAppFn = deps.enterApp;
  }

  /* ============ P0: 최근 로그인 뱃지 (인터랙티브 안내) ============ */
  function showLastAuthBadge(){
    var badgeEl = document.getElementById('lastAuthBadge');
    if(!badgeEl) return;
    var lastProv = localStorage.getItem('ourgoal_last_auth_provider');
    if(!lastProv){
      badgeEl.style.display = 'none';
      return;
    }
    var provName = lastProv === 'google' ? 'Google' : (lastProv === 'kakao' ? '카카오' : '이메일');
    badgeEl.innerHTML = '<span style="font-size:.75rem;padding:6px 14px;background:rgba(99,102,241,0.12);color:var(--brand);border-radius:14px;font-weight:700;display:inline-flex;align-items:center;gap:6px;cursor:pointer;transition:transform .15s ease;" title="클릭하시면 해당 로그인 수단으로 이동해요">' +
      '<span>✨ 지난번에 <b>' + provName + '</b>로 로그인하셨어요</span>' +
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>' +
    '</span>';
    badgeEl.style.display = 'block';

    badgeEl.onclick = function(){
      if(lastProv === 'google'){
        var kBtnG = document.getElementById('authKakaoBtn');
        if(kBtnG){
          kBtnG.focus();
          kBtnG.style.boxShadow = '0 0 0 3px rgba(254,229,0,0.45)';
          setTimeout(function(){ kBtnG.style.boxShadow = ''; }, 1200);
        }
        toastFn('아워골 로그인이 카카오로 간편 통합되었어요! 카카오로 편하게 시작하세요.');
      } else if(lastProv === 'kakao'){
        var kBtn = document.getElementById('authKakaoBtn');
        if(kBtn){
          kBtn.focus();
          kBtn.style.boxShadow = '0 0 0 3px rgba(254,229,0,0.45)';
          setTimeout(function(){ kBtn.style.boxShadow = ''; }, 1200);
        }
      } else {
        var logTab = document.querySelector('[data-authtab="login"]');
        if(logTab) logTab.click();
        var uEl = document.getElementById('loginUser');
        var pEl = document.getElementById('loginPass');
        if(uEl && uEl.value && pEl){
          pEl.focus();
        } else if(uEl){
          uEl.focus();
        }
      }
    };
  }

  /* ============ P0: 아이디 복원 & 기억하기 ============ */
  function initRememberedAuthFields(){
    showLastAuthBadge();
    try {
      var savedId = localStorage.getItem('ourgoal_saved_id');
      var userInp = document.getElementById('loginUser');
      var remIdChk = document.getElementById('rememberIdCheck');
      if(savedId && userInp){
        userInp.value = savedId;
        if(remIdChk) remIdChk.checked = true;
      }
    } catch(e){}
  }

  /* ============ P0: 공용 기기 세션 파기 (로그인 유지 해제 시) ============ */
  window.addEventListener('pagehide', function(){
    if(sessionStorage.getItem('ourgoal_session_ephemeral') === 'true'){
      try {
        for(var i = localStorage.length - 1; i >= 0; i--){
          var k = localStorage.key(i);
          if(k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') !== -1){
            localStorage.removeItem(k);
          }
        }
      } catch(e){}
    }
  });

  /* ============ P0: 비밀번호 찾기 (이메일 재설정 링크 발송) ============ */
  function openForgotPasswordModal(){
    var om = openModalFn || window.openModal;
    var cm = closeModalFn || window.closeModal;
    var sb = sbClient || window.sb;
    if(!om) return;

    om(
      '<div style="text-align:center;padding:14px 6px;">' +
        '<div style="font-size:2.2rem;margin-bottom:8px;">🔑</div>' +
        '<h3 style="margin:0 0 8px;font-size:1.15rem;font-weight:700;">비밀번호 찾기</h3>' +
        '<p style="font-size:.875rem;color:var(--ink-soft);line-height:1.55;margin:0 0 14px;">' +
          '가입하신 이메일 주소를 입력해주세요.<br>비밀번호를 다시 설정할 수 있는 안전한 링크를 보내드려요.' +
        '</p>' +
        '<div class="field" style="text-align:left;margin-bottom:12px;">' +
          '<label for="resetEmailInput">가입 이메일</label>' +
          '<input id="resetEmailInput" type="email" placeholder="example@email.com" autocomplete="email">' +
        '</div>' +
        '<p class="auth-error" id="resetEmailError" style="margin-bottom:8px;"></p>' +
        '<button class="btn btn-primary btn-block" id="btnSendPasswordReset" style="padding:12px;font-weight:700;border-radius:12px;background:var(--brand);border:none;">재설정 메일 받기</button>' +
        '<button class="btn btn-ghost btn-sm btn-close" id="btnCloseForgotModal" style="width:100%;margin-top:8px;">취소</button>' +
      '</div>',
      function(sheet){
        var cBtn = sheet.querySelector('#btnCloseForgotModal');
        if(cBtn && cm) cBtn.onclick = cm;
        var sBtn = sheet.querySelector('#btnSendPasswordReset');
        var inEl = sheet.querySelector('#resetEmailInput');
        var errEl = sheet.querySelector('#resetEmailError');
        var curU = (document.getElementById('loginUser') && document.getElementById('loginUser').value) || '';
        if(curU && curU.indexOf('@') !== -1 && inEl) inEl.value = curU;

        if(inEl){
          inEl.addEventListener('keydown', function(e){
            if(e.key === 'Enter'){
              e.preventDefault();
              if(sBtn) sBtn.click();
            }
          });
          setTimeout(function(){ try { inEl.focus(); } catch(e){} }, 200);
        }

        if(sBtn) sBtn.onclick = async function(){
          var email = (inEl ? inEl.value : '').trim();
          if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
            if(errEl) errEl.textContent = '올바른 이메일 주소를 입력해주세요.';
            return;
          }
          errEl.textContent = '';
          sBtn.disabled = true;
          sBtn.textContent = '발송 중…';
          try {
            var res = await sb.auth.resetPasswordForEmail(email, {
              redirectTo: window.location.origin
            });
            if(res && res.error) throw res.error;
            if(cm) cm();
            toastFn('비밀번호 재설정 메일을 보냈어요. 메일함을 확인해주세요!');
          } catch(err){
            console.warn('resetPasswordForEmail failed:', err);
            if(errEl) errEl.textContent = (err && err.message) || '메일 발송에 실패했어요. 다시 시도해주세요.';
          } finally {
            sBtn.disabled = false;
            sBtn.textContent = '재설정 메일 받기';
          }
        };
      }
    );
  }

  /* ============ P0: 새 비밀번호 입력 모달 (비밀번호 복구 링크 수신 시) ============ */
  function openNewPasswordModal(){
    var om = openModalFn || window.openModal;
    var cm = closeModalFn || window.closeModal;
    var sb = sbClient || window.sb;
    if(!om) return;

    om(
      '<div style="text-align:center;padding:14px 6px;">' +
        '<div style="font-size:2.2rem;margin-bottom:8px;">🔐</div>' +
        '<h3 style="margin:0 0 8px;font-size:1.15rem;font-weight:700;">새 비밀번호 설정</h3>' +
        '<p style="font-size:.875rem;color:var(--ink-soft);line-height:1.55;margin:0 0 14px;">' +
          '새롭게 사용할 비밀번호를 입력해주세요.' +
        '</p>' +
        '<div class="field field-pw" style="text-align:left;margin-bottom:10px;position:relative;">' +
          '<label for="newPass1">새 비밀번호 (8자 이상)</label>' +
          '<input id="newPass1" type="password" placeholder="8자 이상">' +
          '<button type="button" class="pw-toggle" aria-label="비밀번호 보기" onclick="var i=document.getElementById(\'newPass1\');i.type=i.type===\'password\'?\'text\':\'password\';this.classList.toggle(\'on\');">보기</button>' +
        '</div>' +
        '<div class="field field-pw" style="text-align:left;margin-bottom:12px;position:relative;">' +
          '<label for="newPass2">새 비밀번호 확인</label>' +
          '<input id="newPass2" type="password" placeholder="한 번 더 입력">' +
          '<button type="button" class="pw-toggle" aria-label="비밀번호 보기" onclick="var i=document.getElementById(\'newPass2\');i.type=i.type===\'password\'?\'text\':\'password\';this.classList.toggle(\'on\');">보기</button>' +
        '</div>' +
        '<p class="auth-error" id="newPassError" style="margin-bottom:8px;"></p>' +
        '<button class="btn btn-primary btn-block" id="btnSubmitNewPass" style="padding:12px;font-weight:700;border-radius:12px;background:var(--brand);border:none;">비밀번호 변경 완료</button>' +
        '<button class="btn btn-ghost btn-sm btn-close" id="btnCloseNewPassModal" style="width:100%;margin-top:8px;">취소</button>' +
      '</div>',
      function(sheet){
        var cBtn = sheet.querySelector('#btnCloseNewPassModal');
        if(cBtn && cm) cBtn.onclick = cm;
        var p1 = sheet.querySelector('#newPass1');
        var p2 = sheet.querySelector('#newPass2');
        var errEl = sheet.querySelector('#newPassError');
        var sBtn = sheet.querySelector('#btnSubmitNewPass');

        if(p1 && p2){
          p1.addEventListener('keydown', function(e){
            if(e.key === 'Enter'){ e.preventDefault(); p2.focus(); }
          });
          p2.addEventListener('keydown', function(e){
            if(e.key === 'Enter'){ e.preventDefault(); if(sBtn) sBtn.click(); }
          });
          setTimeout(function(){ try { p1.focus(); } catch(e){} }, 200);
        }

        if(sBtn) sBtn.onclick = async function(){
          var v1 = p1 ? p1.value : '';
          var v2 = p2 ? p2.value : '';
          if(!v1 || v1.length < 8){
            if(errEl) errEl.textContent = '비밀번호는 8자 이상으로 입력해주세요.';
            return;
          }
          if(v1 !== v2){
            if(errEl) errEl.textContent = '비밀번호가 서로 달라요.';
            return;
          }
          errEl.textContent = '';
          sBtn.disabled = true;
          sBtn.textContent = '변경 중…';
          try {
            var res = await sb.auth.updateUser({ password: v1 });
            if(res && res.error) throw res.error;
            if(cm) cm();
            toastFn('비밀번호가 성공적으로 변경되었습니다!');
          } catch(err){
            console.warn('updateUser password error:', err);
            if(errEl) errEl.textContent = (err && err.message) || '비밀번호 변경에 실패했습니다.';
          } finally {
            sBtn.disabled = false;
            sBtn.textContent = '비밀번호 변경 완료';
          }
        };
      }
    );
  }

  /* ============ P0: 설정 화면 내 비밀번호 변경/등록 모달 ============ */
  function openChangePasswordModal(){
    var om = openModalFn || window.openModal;
    var cm = closeModalFn || window.closeModal;
    var sb = sbClient || window.sb;
    if(!om) return;

    var state = stateRef || window.state;
    var isOAuth = (state && state.profile && (state.profile.provider === 'kakao' || state.profile.provider === 'google')) ||
                  (state && state.user && state.user.app_metadata && (state.user.app_metadata.provider === 'kakao' || state.user.app_metadata.provider === 'google'));

    var modalTitle = isOAuth ? '비밀번호 등록/설정' : '비밀번호 변경';
    var modalDesc = isOAuth ?
      '소셜 계정(카카오/Google)과 함께 이메일/비밀번호로도 로그인할 수 있도록 새 비밀번호를 설정합니다.' :
      '새 비밀번호를 설정하여 계정을 안전하게 보호하세요.';

    om(
      '<div style="text-align:center;padding:14px 6px;">' +
        '<div style="font-size:2.2rem;margin-bottom:8px;">🔒</div>' +
        '<h3 style="margin:0 0 8px;font-size:1.15rem;font-weight:700;">' + modalTitle + '</h3>' +
        '<p style="font-size:.875rem;color:var(--ink-soft);line-height:1.55;margin:0 0 14px;">' + modalDesc + '</p>' +
        '<div class="field field-pw" style="text-align:left;margin-bottom:10px;position:relative;">' +
          '<label for="chgPass1">새 비밀번호 (8자 이상)</label>' +
          '<input id="chgPass1" type="password" placeholder="8자 이상">' +
          '<button type="button" class="pw-toggle" aria-label="비밀번호 보기" onclick="var i=document.getElementById(\'chgPass1\');i.type=i.type===\'password\'?\'text\':\'password\';this.classList.toggle(\'on\');">보기</button>' +
        '</div>' +
        '<div class="field field-pw" style="text-align:left;margin-bottom:12px;position:relative;">' +
          '<label for="chgPass2">새 비밀번호 확인</label>' +
          '<input id="chgPass2" type="password" placeholder="새 비밀번호 한 번 더 입력">' +
          '<button type="button" class="pw-toggle" aria-label="비밀번호 보기" onclick="var i=document.getElementById(\'chgPass2\');i.type=i.type===\'password\'?\'text\':\'password\';this.classList.toggle(\'on\');">보기</button>' +
        '</div>' +
        '<p class="auth-error" id="chgPassError" style="margin-bottom:8px;"></p>' +
        '<button class="btn btn-primary btn-block" id="btnSubmitChgPass" style="padding:12px;font-weight:700;border-radius:12px;background:var(--brand);border:none;">' + modalTitle + ' 완료</button>' +
        '<button class="btn btn-ghost btn-sm btn-close" id="btnCloseChgPass" style="width:100%;margin-top:8px;">취소</button>' +
      '</div>',
      function(sheet){
        var cBtn = sheet.querySelector('#btnCloseChgPass');
        if(cBtn && cm) cBtn.onclick = cm;
        var p1 = sheet.querySelector('#chgPass1');
        var p2 = sheet.querySelector('#chgPass2');
        var errEl = sheet.querySelector('#chgPassError');
        var sBtn = sheet.querySelector('#btnSubmitChgPass');

        if(p1 && p2){
          p1.addEventListener('keydown', function(e){
            if(e.key === 'Enter'){ e.preventDefault(); p2.focus(); }
          });
          p2.addEventListener('keydown', function(e){
            if(e.key === 'Enter'){ e.preventDefault(); if(sBtn) sBtn.click(); }
          });
          setTimeout(function(){ try { p1.focus(); } catch(e){} }, 200);
        }

        if(sBtn) sBtn.onclick = async function(){
          var v1 = p1 ? p1.value : '';
          var v2 = p2 ? p2.value : '';
          if(!v1 || v1.length < 8){
            if(errEl) errEl.textContent = '비밀번호는 8자 이상으로 입력해주세요.';
            return;
          }
          if(v1 !== v2){
            if(errEl) errEl.textContent = '비밀번호가 서로 달라요.';
            return;
          }
          errEl.textContent = '';
          sBtn.disabled = true;
          sBtn.textContent = '변경 중…';
          try {
            var res = await sb.auth.updateUser({ password: v1 });
            if(res && res.error) throw res.error;
            if(cm) cm();
            toastFn('비밀번호가 안전하게 변경되었습니다.');
          } catch(err){
            console.warn('updateUser password failed:', err);
            if(errEl) errEl.textContent = (err && err.message) || '비밀번호 변경에 실패했습니다.';
          } finally {
            sBtn.disabled = false;
            sBtn.textContent = modalTitle + ' 완료';
          }
        };
      }
    );
  }

  /* ============ P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크 ============ */
  async function checkPendingDeletionRestore(){
    var state = stateRef || window.state;
    if(!state || !state.profile) return false;
    var st = state.profile.settings || {};
    var pDel = st.pendingDeletionAt || st.deletedAt;
    if(!pDel) return false;

    var delTime = Number(pDel);
    var now = Date.now();
    var graceDays = 30;
    var elapsedDays = Math.floor((now - delTime) / (86400 * 1000));
    var remainDays = Math.max(0, graceDays - elapsedDays);

    var logoutFn = performLogoutFn || window.performLogout;
    var om = openModalFn || window.openModal;
    var cm = closeModalFn || window.closeModal;
    var sb = sbClient || window.sb;
    var sp = saveProfileFn || window.saveProfile;

    if(remainDays <= 0){
      if(logoutFn) await logoutFn('탈퇴 유예 기간(30일)이 만료되어 계정이 비활성화되었습니다.');
      return true;
    }

    return new Promise(function(resolve){
      if(!om){ resolve(false); return; }
      var settled = false;
      function finish(val){
        if(settled) return;
        settled = true;
        resolve(val);
      }

      om(
        '<div style="text-align:center;padding:16px 8px;">' +
          '<div style="font-size:2.5rem;margin-bottom:10px;">🌱</div>' +
          '<h3 style="margin:0 0 8px;font-size:1.15rem;font-weight:700;">계정 복구 안내</h3>' +
          '<p style="font-size:.875rem;color:var(--ink-soft);line-height:1.6;margin:0 0 16px;">' +
            '이 계정은 현재 <b>회원 탈퇴 유예 보관 중</b>입니다.<br>' +
            '(영구 파기까지 <b>' + remainDays + '일</b> 남음)<br><br>' +
            '지금 복구하시면 기존의 모든 목표, 마일스톤, 체크인 기록을 그대로 이어서 이용하실 수 있습니다.' +
          '</p>' +
          '<button class="btn btn-primary" id="btnRestoreAccount" style="width:100%;margin-bottom:8px;padding:12px;font-weight:700;border-radius:12px;background:var(--brand);border:none;">계정 및 기록 복구하기</button>' +
          '<button class="btn btn-ghost btn-sm btn-close" id="btnCancelRestore" style="width:100%;">로그아웃 (탈퇴 상태 유지)</button>' +
        '</div>',
        function(sheet){
          var rBtn = sheet.querySelector('#btnRestoreAccount');
          if(rBtn) rBtn.onclick = async function(){
            if(cm) cm();
            toastFn('계정을 복구하는 중입니다…');
            try {
              delete state.profile.settings.pendingDeletionAt;
              delete state.profile.settings.deletedAt;
              if(sp) await sp();
              try {
                await sb.auth.updateUser({ data: { account_status: 'active', deleted_at: null } });
              } catch(e){}
              toastFn('계정이 성공적으로 복구되었습니다! 환영합니다.');
              finish(false);
            } catch(e){
              toastFn('복구 중 오류가 발생했습니다: ' + (e && e.message));
              finish(false);
            }
          };

          var cBtn = sheet.querySelector('#btnCancelRestore');
          if(cBtn) cBtn.onclick = async function(){
            if(cm) cm();
            if(logoutFn) await logoutFn('탈퇴 상태가 유지됩니다.');
            finish(true);
          };

          // 배경 클릭 또는 탈출 시 안전 로그아웃 처리
          var overlay = document.getElementById('modalOverlay');
          if(overlay){
            var ovHandler = function(e){
              if(e.target === overlay && !settled){
                if(logoutFn) logoutFn('탈퇴 상태가 유지됩니다.');
                finish(true);
              }
            };
            overlay.addEventListener('click', ovHandler, { once: true });
          }
        }
      );
    });
  }

  window.OurgoalAuthSafety = {
    init: init,
    showLastAuthBadge: showLastAuthBadge,
    initRememberedAuthFields: initRememberedAuthFields,
    openForgotPasswordModal: openForgotPasswordModal,
    openNewPasswordModal: openNewPasswordModal,
    openChangePasswordModal: openChangePasswordModal,
    checkPendingDeletionRestore: checkPendingDeletionRestore
  };

})(typeof window !== 'undefined' ? window : this);
