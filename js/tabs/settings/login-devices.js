/**
 * OurGoal Login Devices (설정 탭 — 로그인 기기 목록·다른 기기 로그아웃 창)
 *
 * #TASK-ES-442 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   getRegisteredDevices · renderActiveDevicesList — 「[70] 활성 로그인 기기 목록 실시간 렌더링 & 개별 세션 로그아웃」(이전 전 3861~3950줄, 구획 주석 포함)
 *   openLogoutOtherDevicesConfirmModal — 「[70] 다른 모든 기기 원격 로그아웃 전 로그인 기기 목록 확인 모달」(이전 전 3953~4048줄)
 * 설정 > 보안의 활성 로그인 기기 목록 그리기·개별 세션 로그아웃, 「다른 모든 기기 로그아웃」 전 확인 창.
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

  /* ============ [70] 활성 로그인 기기 목록 실시간 렌더링 & 개별 세션 로그아웃 ============ */
  /* [#TASK-ES-346 SET-01] 아워골은 다른 기기의 접속 목록·위치를 수집하지 않는다.
     이 목록은 이 기기의 localStorage 에만 있으므로 "지금 쓰는 이 기기" 한 대만 사실대로 보여 준다.
     예전 판이 처음 열 때 만들어 저장해 둔 실재하지 않는 기기 2대(와 위치 문구)는 읽을 때 이 기기 한 대로 정리한다. */
  function getRegisteredDevices(){
    var uidVal = (L.state.profile && L.state.profile.id) || 'guest';
    var myDevId = L.getDeviceId();
    var key = 'ourgoal_registered_devices_' + uidVal;
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(key) || 'null'); } catch(e){}
    var ua = navigator.userAgent;
    var os = /iPhone|iPad/i.test(ua) ? 'iOS' : /Android/i.test(ua) ? 'Android' : /Macintosh/i.test(ua) ? 'macOS' : 'Windows';
    var browser = /Chrome/i.test(ua) ? 'Chrome' : /Safari/i.test(ua) ? 'Safari' : /Firefox/i.test(ua) ? 'Firefox' : 'Browser';
    var mine = null;
    if(Array.isArray(raw)){
      raw.forEach(function(d){ if(d && d.id === myDevId) mine = d; });
    }
    var cleaned = [{
      id: myDevId,
      name: os + ' ' + browser,
      platform: os,
      isCurrent: true,
      firstLogin: (mine && mine.firstLogin) || Date.now(),
      lastActive: Date.now(),
      ipHint: null, /* 위치·IP 는 수집하지 않는다 */
      revoked: false
    }];
    try { localStorage.setItem(key, JSON.stringify(cleaned)); } catch(e){}
    return cleaned;
  }

  function renderActiveDevicesList(){
    var container = document.getElementById('activeDevicesContainer');
    var badge = document.getElementById('activeDeviceCountBadge');
    if(!container) return;
    var devices = getRegisteredDevices();
    if(badge){
      /* 다른 기기 수는 알 수 없으므로 기기 수를 지어내지 않는다 */
      badge.textContent = '이 기기만 표시';
    }

    container.innerHTML = devices.map(function(d){
      var isRevoked = !!d.revoked;
      var timeAgo = d.isCurrent ? '지금 접속 중' : (isRevoked ? (d.revokedAt ? '원격 차단됨 (' + new Date(d.revokedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) + ')' : '원격 로그아웃됨') : (Math.round((Date.now() - d.lastActive) / 3600000) + '시간 전 활동'));
      var statusBadge = d.isCurrent
        ? '<span class="dday-pill" style="font-size:.65rem;background:rgba(99,102,241,0.15);color:var(--brand-strong);border:1px solid rgba(99,102,241,0.3);font-weight:700;">🟢 현재 기기</span>'
        : (isRevoked
            ? '<span class="dday-pill" style="font-size:.65rem;background:rgba(235,87,87,0.15);color:var(--red);border:1px solid rgba(235,87,87,0.3);font-weight:700;">🔴 원격 차단됨</span>'
            : '<span class="dday-pill" style="font-size:.65rem;background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);font-weight:700;">🟢 정상 연결 중</span>');

      var cardStyle = 'display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:12px;font-size:.8125rem;transition:all .2s ease;' +
        (d.isCurrent
          ? 'background:var(--card2);border:1.5px solid var(--brand);'
          : (isRevoked
              ? 'background:var(--surface-2);border:1px dashed var(--rule);opacity:.6;'
              : 'background:var(--card);border:1px solid var(--rule);'));

      return '<div class="active-device-card" id="deviceCard_' + L.escapeHtml(d.id) + '" style="' + cardStyle + '">' +
        '<div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">' +
          '<span style="font-size:1.3rem;">' + (d.platform==='Mobile'?'📱':(d.platform==='Tablet'?'📟':'💻')) + '</span>' +
          '<div style="min-width:0;flex:1;">' +
            '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
              '<span style="font-weight:700;color:var(--ink);">' + L.escapeHtml(d.name) + '</span>' +
              statusBadge +
            '</div>' +
            '<div class="faint" style="font-size:.72rem;margin-top:2px;">' + L.escapeHtml(d.ipHint || '위치 정보 수집 안 함') + ' · ' + timeAgo + '</div>' +
          '</div>' +
        '</div>' +
        '<div>' +
          (d.isCurrent
            ? '<span class="faint" style="font-size:.72rem;color:var(--brand);font-weight:700;">(이 기기)</span>'
            : (isRevoked
                ? '<button class="btn btn-ghost btn-xs" type="button" disabled style="font-size:.72rem;opacity:.5;border-color:var(--rule);">차단 완료</button>'
                : '<button class="btn btn-ghost btn-xs btn-revoke-device" data-devid="' + L.escapeHtml(d.id) + '" data-devname="' + L.escapeHtml(d.name) + '" type="button" style="font-size:.72rem;color:var(--red);border-color:rgba(235,87,87,0.3);font-weight:700;">원격 로그아웃</button>')) +
        '</div>' +
      '</div>';
    }).join('');

    container.querySelectorAll('.btn-revoke-device').forEach(function(btn){
      btn.addEventListener('click', async function(){
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
        var devId = btn.dataset.devid;
        var devName = btn.dataset.devname || '기기';
        /* [#TASK-ES-346 SET-01] 기기 한 대만 골라 끊는 서버 기능은 없다(예전 판의 방송은 받는 쪽이 없었다).
           끊었다고 말하거나 '차단됨'으로 표시하지 않고, 실제로 동작하는 일괄 로그아웃으로 안내한다. */
        L.toast('‘' + devName + '’ 한 대만 골라 로그아웃하는 기능은 아직 없어요. "다른 모든 기기에서 로그아웃"을 이용해 주세요.');
        if(typeof openLogoutOtherDevicesConfirmModal === 'function') openLogoutOtherDevicesConfirmModal();
      });
    });
  }

  function openLogoutOtherDevicesConfirmModal(){
    if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
    /* [#TASK-ES-346 SET-01] 다른 기기 목록은 수집하지 않으므로 목록으로 막지 않는다.
       실제 동작은 Supabase 의 sb.auth.signOut({ scope: 'others' }) — 이 기기를 뺀 모든 로그인 세션을 서버에서 해제한다. */
    if(!L.state.profile || !L.state.profile.id || String(L.state.profile.id).indexOf('guest') === 0){
      L.toast('게스트 체험 모드는 로그인 세션이 없어 다른 기기에서 로그아웃할 것이 없어요.');
      return;
    }

    var modalHtml = 
      '<h3>📱 다른 모든 기기 원격 로그아웃 확인</h3>' +
      '<p class="faint" style="margin:-6px 0 12px;font-size:.8125rem;">지금 쓰는 이 기기를 뺀, 이 계정으로 로그인된 모든 기기의 로그인을 해제해요. 아워골은 다른 기기 목록을 수집하지 않아 몇 대가 해제될지는 보여 드릴 수 없어요.</p>' +
      '<div style="padding:10px 12px;background:rgba(235,87,87,0.06);border:1px dashed rgba(235,87,87,0.3);border-radius:10px;margin-bottom:14px;font-size:.78rem;color:var(--ink-soft);line-height:1.45;">' +
        '⚠️ 해제된 기기에서 다시 쓰려면 다시 로그인해야 해요. 그 기기에 이미 열려 있는 화면은 다음에 서버와 연결을 확인할 때 로그아웃돼요.' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost" id="btnCancelLogoutOtherModal" type="button">취소</button>' +
        '<button class="btn btn-primary" id="btnConfirmLogoutOtherModal" type="button" style="background:var(--red);border-color:var(--red);color:#fff;font-weight:700;">다른 기기 모두 로그아웃</button>' +
      '</div>';

    L.openModal(modalHtml, function(sheet){
      var btnCancel = sheet.querySelector('#btnCancelLogoutOtherModal');
      var btnConfirm = sheet.querySelector('#btnConfirmLogoutOtherModal');
      if(btnCancel){
        btnCancel.addEventListener('click', function(){ L.closeModal(); });
      }
      if(btnConfirm){
        btnConfirm.addEventListener('click', async function(){
          btnConfirm.disabled = true;
          btnConfirm.textContent = '원격 로그아웃 처리 중…';
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);

          var myDevId = L.getDeviceId();
          var nowTs = Date.now();
          var uidVal = (L.state.profile && L.state.profile.id) || 'guest';

          // 1. (삭제됨 #TASK-ES-346) 이 기기에 저장된 가짜 기기 목록에 '차단됨'을 찍던 단계 — 다른 기기 목록은 수집하지 않는다.

          // 2. Supabase Auth others 세션 무효화 — 실패하면 '로그아웃했다'고 말하지 않는다
          var signOutOthersError = null;
          try {
            var soRes = await L.sb.auth.signOut({ scope: 'others' });
            if(soRes && soRes.error) signOutOthersError = soRes.error;
          } catch(e){ signOutOthersError = e; }
          if(signOutOthersError){
            console.warn('signOut others error:', signOutOthersError);
            btnConfirm.disabled = false;
            btnConfirm.textContent = '다른 기기 모두 로그아웃';
            L.toast('다른 기기 로그아웃에 실패했어요. 네트워크를 확인하고 다시 시도해 주세요.');
            return;
          }

          // 3. Auth 메타데이터 갱신
          try {
            await L.sb.auth.updateUser({
              data: {
                remote_logout_at: nowTs,
                remote_logout_device_id: myDevId
              }
            });
          } catch(e){ console.warn('updateUser metadata warning:', e); }

          // 4. 프로필 설정 저장 및 현재 기기 로그인 시간 갱신
          if(L.state.profile && L.state.profile.settings){
            L.state.profile.settings.remoteLogoutTimestamp = nowTs;
            L.state.profile.settings.remoteLogoutDeviceId = myDevId;
            L.setDeviceLoginTime(nowTs);
            try { await L.saveProfile(); } catch(e){}
          }

          // 5. 활성 접속 기기에 실시간 브로드캐스트 전송
          try {
            if(L.USER_SESSION_CHANNEL){
              await L.USER_SESSION_CHANNEL.send({
                type: 'broadcast',
                event: 'remote_logout',
                payload: {
                  keptDeviceId: myDevId,
                  timestamp: nowTs,
                  userId: (L.state.profile && L.state.profile.id) || ''
                }
              });
            }
          } catch(e){}

          // 6. 로컬스토리지 스토리지 이벤트 전송
          try { localStorage.setItem('ourgoal_remote_logout_trigger', nowTs + '_' + myDevId); } catch(e){}

          // 7. 실시간 화면 갱신 (끄면 꺼지는 시각적 피드백 보장!)
          L.closeModal();
          renderActiveDevicesList();
          L.toast('이 기기를 뺀 모든 기기의 로그인을 해제했어요.');
        });
      }
    });
  }

  K.getRegisteredDevices = getRegisteredDevices;
  K.renderActiveDevicesList = renderActiveDevicesList;
  K.openLogoutOtherDevicesConfirmModal = openLogoutOtherDevicesConfirmModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
