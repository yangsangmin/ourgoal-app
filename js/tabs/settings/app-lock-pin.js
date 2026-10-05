/**
 * OurGoal App Lock PIN (설정 탭 — 이 기기 앱 잠금 PIN)
 *
 * #TASK-ES-442 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   isHashedAppLockPin — 「[71] 앱 잠금 PIN (이 기기)」(이전 전 4058~4060줄)
 *   appLockCryptoAvailable — 「[71] 앱 잠금 PIN (이 기기)」(이전 전 4061~4063줄)
 *   sha256HexAppLock — 「[71] 앱 잠금 PIN (이 기기)」(이전 전 4064~4067줄)
 *   hashAppLockPin — 「[71] 앱 잠금 PIN (이 기기)」(이전 전 4068~4077줄)
 *   verifyAppLockPin — 「[71] 앱 잠금 PIN (이 기기)」(이전 전 4078~4101줄)
 *   openTwoFactorSetupModal — 「[71] 앱 잠금 PIN (이 기기)」(이전 전 4107~4160줄)
 *   openTwoFactorDisableModal — 「[71] 앱 잠금 PIN (이 기기)」(이전 전 4162~4203줄)
 *   challengeTwoFactorModal — 「[71] 앱 잠금 PIN (이 기기)」(이전 전 4205~4277줄)
 * 앱 잠금 PIN 해시·확인, 설정·해제 창, 앱 진입 때 PIN 확인 창.
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

  function isHashedAppLockPin(v){
    return typeof v === 'string' && v.indexOf(L.APP_LOCK_PIN_PREFIX) === 0;
  }

  function appLockCryptoAvailable(){
    return !!(window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function' && typeof TextEncoder === 'function');
  }

  async function sha256HexAppLock(text){
    var buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.prototype.map.call(new Uint8Array(buf), function(b){ return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  async function hashAppLockPin(pin, salt){
    if(!salt){
      var rnd = new Uint8Array(16);
      window.crypto.getRandomValues(rnd);
      var uidPart = (L.state.profile && L.state.profile.id) || 'guest';
      salt = uidPart + ':' + Array.prototype.map.call(rnd, function(b){ return ('0' + b.toString(16)).slice(-2); }).join('');
    }
    var hex = await sha256HexAppLock(salt + '|' + String(pin));
    return L.APP_LOCK_PIN_PREFIX + salt + '$' + hex;
  }

  /* 입력한 PIN 이 저장값과 맞는지 확인한다. 평문 저장값이 맞으면 해시로 이전해 저장한다. */
  async function verifyAppLockPin(entered){
    var settings = (L.state.profile && L.state.profile.settings) || {};
    var stored = settings.twoFactorPin || '';
    if(!stored || !/^[0-9]{4}$/.test(String(entered || ''))) return false;
    if(isHashedAppLockPin(stored)){
      if(!appLockCryptoAvailable()) return false;
      var body = stored.slice(L.APP_LOCK_PIN_PREFIX.length);
      var cut = body.lastIndexOf('$');
      if(cut < 0) return false;
      var salt = body.slice(0, cut);
      var recomputed = await hashAppLockPin(entered, salt);
      return recomputed === stored;
    }
    /* 예전 평문 저장값 */
    if(String(entered) !== String(stored)) return false;
    if(appLockCryptoAvailable()){
      try {
        settings.twoFactorPin = await hashAppLockPin(entered);
        await L.saveProfile();
      } catch(e){ console.warn('[app-lock] 평문 PIN 해시 이전 실패(다음 검증 때 다시 시도):', e); }
    }
    return true;
  }

  function openTwoFactorSetupModal(){
    var settings = (L.state.profile && L.state.profile.settings) || {};
    var isEnabled = !!(settings.twoFactorAuth && settings.twoFactorPin);

    L.openModal(
      '<h3>🔐 앱 잠금 PIN (이 기기)</h3>' +
      '<p class="faint" style="margin:-8px 0 14px;font-size:.8125rem;">이 기기에서 아워골을 새로 열 때 물어볼 4자리 PIN 을 정해요.</p>' +
      '<div class="field">' +
        '<label>4자리 PIN</label>' +
        '<input type="password" id="twoFaPinInput" maxlength="4" placeholder="숫자 4자리 입력" pattern="[0-9]*" inputmode="numeric" style="letter-spacing:6px;font-size:1.25rem;text-align:center;font-weight:700;">' +
      '</div>' +
      '<div class="field">' +
        '<label>PIN 확인</label>' +
        '<input type="password" id="twoFaPinConfirm" maxlength="4" placeholder="다시 한 번 입력" pattern="[0-9]*" inputmode="numeric" style="letter-spacing:6px;font-size:1.25rem;text-align:center;font-weight:700;">' +
      '</div>' +
      '<div style="margin:10px 0;padding:10px 12px;background:var(--card2);border-radius:10px;font-size:.78125rem;color:var(--ink-soft);line-height:1.45;">' +
        '※ 이 기기에서만 적용돼요. 브라우저(앱)를 닫았다가 다시 열면 PIN 을 물어봐요. 다른 기기에는 적용되지 않고, 로그인 비밀번호나 서버 2단계 인증을 대신하지 않아요. PIN 은 원문이 아닌 해시값으로만 이 기기에 저장돼요.' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost" id="btnCancel2Fa" type="button">취소</button>' +
        '<button class="btn btn-primary" id="btnSave2Fa" type="button">' + (isEnabled ? 'PIN 변경 저장' : '앱 잠금 켜기') + '</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#btnCancel2Fa').addEventListener('click', L.closeModal);
        sheet.querySelector('#btnSave2Fa').addEventListener('click', async function(){
          var pin1 = sheet.querySelector('#twoFaPinInput').value.trim();
          var pin2 = sheet.querySelector('#twoFaPinConfirm').value.trim();
          if(!/^[0-9]{4}$/.test(pin1)){
            if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
            L.toast('PIN 은 숫자 4자리로 입력해주세요.');
            return;
          }
          if(pin1 !== pin2){
            if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
            L.toast('PIN 이 일치하지 않습니다.');
            return;
          }
          if(!appLockCryptoAvailable()){
            L.toast('이 환경에서는 PIN 을 안전하게(해시로) 저장할 수 없어 앱 잠금을 켤 수 없어요.');
            return;
          }
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          if(!L.state.profile.settings) L.state.profile.settings = {};
          L.state.profile.settings.twoFactorPin = await hashAppLockPin(pin1);
          L.state.profile.settings.twoFactorAuth = true;
          sessionStorage.setItem('ourgoal_2fa_verified', 'true');
          await L.saveProfile();
          L.closeModal();
          L.renderSettingsScreen();
          L.toast('이 기기에 앱 잠금 PIN 을 설정했어요. 🔐');
        });
      }
    );
  }

  function openTwoFactorDisableModal(onSuccess){
    var settings = (L.state.profile && L.state.profile.settings) || {};

    L.openModal(
      '<h3>🔐 앱 잠금 PIN 끄기</h3>' +
      '<p class="faint" style="margin:-8px 0 14px;font-size:.8125rem;">앱 잠금을 끄려면 지금 설정된 4자리 PIN 을 입력해주세요.</p>' +
      '<div class="field">' +
        '<label>현재 PIN</label>' +
        '<input type="password" id="disable2FaPinInput" maxlength="4" placeholder="••••" pattern="[0-9]*" inputmode="numeric" autofocus style="letter-spacing:8px;font-size:1.4rem;text-align:center;font-weight:700;">' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost" id="btnCancelDisable2Fa" type="button">취소</button>' +
        '<button class="btn btn-primary" id="btnConfirmDisable2Fa" type="button" style="background:var(--red);border-color:var(--red);color:#fff;font-weight:700;">앱 잠금 끄기</button>' +
      '</div>',
      function(sheet){
        var pinInp = sheet.querySelector('#disable2FaPinInput');
        sheet.querySelector('#btnCancelDisable2Fa').addEventListener('click', L.closeModal);
        sheet.querySelector('#btnConfirmDisable2Fa').addEventListener('click', async function(){
          var entered = pinInp ? pinInp.value.trim() : '';
          var ok = settings.twoFactorPin ? await verifyAppLockPin(entered) : true;
          if(!ok){
            if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
            L.toast('PIN 이 일치하지 않습니다.');
            if(pinInp){
              pinInp.value = '';
              pinInp.focus();
            }
            return;
          }
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          settings.twoFactorAuth = false;
          settings.twoFactorPin = '';
          sessionStorage.removeItem('ourgoal_2fa_verified');
          await L.saveProfile();
          L.closeModal();
          L.renderSettingsScreen();
          L.toast('이 기기의 앱 잠금 PIN 을 껐어요.');
          if(onSuccess) onSuccess();
        });
      }
    );
  }

  function challengeTwoFactorModal(onSuccess){
    var settings = (L.state.profile && L.state.profile.settings) || {};
    if(!settings.twoFactorAuth || !settings.twoFactorPin){
      if(onSuccess) onSuccess();
      return;
    }
    if(sessionStorage.getItem('ourgoal_2fa_verified') === 'true'){
      if(onSuccess) onSuccess();
      return;
    }

    L.openModal(
      '<h3>🔐 앱 잠금 PIN</h3>' +
      '<p class="faint" style="margin:-8px 0 14px;font-size:.8125rem;">이 기기에 설정하신 4자리 앱 잠금 PIN 을 입력해주세요.</p>' +
      '<div class="field">' +
        '<input type="password" id="challenge2FaPin" maxlength="4" placeholder="••••" pattern="[0-9]*" inputmode="numeric" autofocus style="letter-spacing:10px;font-size:1.6rem;text-align:center;font-weight:700;margin:10px 0;">' +
      '</div>' +
      '<div class="modal-actions" style="display:flex;gap:8px;">' +
        '<button class="btn btn-ghost" id="btn2FaLogout" type="button" style="flex:1;">로그아웃</button>' +
        '<button class="btn btn-primary" id="btnVerify2FaChallenge" type="button" style="flex:2;font-weight:700;">잠금 해제</button>' +
      '</div>',
      function(sheet){
        var pinInput = sheet.querySelector('#challenge2FaPin');
        var verifyBtn = sheet.querySelector('#btnVerify2FaChallenge');
        var logoutBtn = sheet.querySelector('#btn2FaLogout');
        var verifying = false;

        if(logoutBtn){
          logoutBtn.addEventListener('click', function(){
            L.closeModal();
            L.performLogout();
          });
        }

        async function doVerify(){
          if(verifying) return;
          verifying = true;
          var entered = pinInput ? pinInput.value.trim() : '';
          var ok = false;
          try { ok = await verifyAppLockPin(entered); } catch(e){ ok = false; }
          verifying = false;
          if(ok){
            if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
            sessionStorage.setItem('ourgoal_2fa_verified', 'true');
            L.closeModal();
            L.toast('앱 잠금을 풀었어요. 환영합니다! ✨');
            if(onSuccess) onSuccess();
          } else {
            if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
            L.toast('PIN 이 올바르지 않습니다.');
            if(pinInput){
              pinInput.value = '';
              pinInput.focus();
            }
          }
        }

        if(verifyBtn){
          verifyBtn.addEventListener('click', doVerify);
        }
        if(pinInput){
          pinInput.addEventListener('keydown', function(e){
            if(e.key === 'Enter') doVerify();
          });
          pinInput.addEventListener('input', function(){
            if(pinInput.value.length === 4){
              setTimeout(doVerify, 150);
            }
          });
        }
      }
    );
  }

  K.isHashedAppLockPin = isHashedAppLockPin;
  K.appLockCryptoAvailable = appLockCryptoAvailable;
  K.sha256HexAppLock = sha256HexAppLock;
  K.hashAppLockPin = hashAppLockPin;
  K.verifyAppLockPin = verifyAppLockPin;
  K.openTwoFactorSetupModal = openTwoFactorSetupModal;
  K.openTwoFactorDisableModal = openTwoFactorDisableModal;
  K.challengeTwoFactorModal = challengeTwoFactorModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
