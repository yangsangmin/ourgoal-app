/**
 * OurGoal Withdraw Modal (설정 — 회원 탈퇴 전용 안내 창·법적 책임·데이터 분실 사전 안내·탈퇴 신청)
 *
 * 「회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 (#TASK-ES-158)」 묶음: 탈퇴 안내 창 열기·닫기(openWithdrawModal·closeWithdrawModal), 동의 뒤 탈퇴 신청(submitWithdrawAccount — 서버 /api/withdraw), 하위 호환 래퍼(withdrawAccount).
 * 설정 「회원 탈퇴」 단추 한 줄 등록 문은 원래 자리에 그대로 있다.
 * #TASK-ES-522(인라인 3단계 Z1 로그인·계정 2차): index.html 인라인 IIFE 의 구간(이전 전 4416~4418 · 4419~4485 · 4486~4584 · 4585~4589줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 4416~4418줄(#TASK-ES-522 생성기 표지) ---- */
  function closeWithdrawModal(){
    L.closeModal();
  }
  /* ---- 이전 전 index.html 4419~4485줄(#TASK-ES-522 생성기 표지) ---- */

  async function submitWithdrawAccount(){
    if(!L.state.profile || !L.state.profile.id) return;
    var agreeCheck = document.getElementById('withdrawAgreeCheck');
    if(!agreeCheck || !agreeCheck.checked){
      L.toast('안내 사항을 확인하고 동의 체크박스를 선택해주세요.');
      return;
    }

    var confirmBtn = document.getElementById('withdrawConfirmBtn');
    if(confirmBtn){
      confirmBtn.disabled = true;
      confirmBtn.innerText = '탈퇴 처리 중…';
    }

    var uid = L.state.profile.id;
    var now = Date.now();
    try {
      L.toast('탈퇴 신청을 서버에 기록하는 중입니다…');
      // [#TASK-ES-351] 탈퇴 신청 시각을 서버(auth app_metadata.deletion_requested_at)에 기록한다.
      // 서버가 쓰고 다시 읽어 확인했을 때만 ok — 기록되지 않았으면 로그아웃하지 않고 실패를 알린다.
      var wSess = await L.sb.auth.getSession();
      var wToken = wSess && wSess.data && wSess.data.session && wSess.data.session.access_token;
      if(!wToken) throw new Error('로그인 세션을 확인할 수 없어요. 다시 로그인한 뒤 신청해 주세요');
      var wResp = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + wToken },
        body: JSON.stringify({ mode: 'request' })
      });
      var wBody = null;
      try { wBody = await wResp.json(); } catch(e){}
      if(!wResp.ok || !wBody || wBody.ok !== true){
        throw new Error('서버에 탈퇴 신청을 기록하지 못했어요. 잠시 후 다시 시도하거나 ourgoal.support@gmail.com 으로 요청해 주세요');
      }

      // 이 기기 표시는 보조 기록(판정은 서버 기록으로 한다 — js/auth-safety.js checkPendingDeletionRestore)
      if(!L.state.profile.settings) L.state.profile.settings = {};
      L.state.profile.settings.pendingDeletionAt = now;
      L.state.profile.settings.deletedAt = now;
      await L.saveProfile();

      // 알림 및 세션 정리
      try {
        localStorage.removeItem('ourgoal_current_user');
        localStorage.removeItem('ourgoal_guest_profile');
      } catch(e){}

      L.updateAppBadge(0);
      if(L.state.notifyTimer){ clearInterval(L.state.notifyTimer); L.state.notifyTimer=null; }

      await L.sb.auth.signOut(); /* #TASK-ES-399 탈퇴는 의도적으로 기본값 global — 탈퇴 신청한 계정의 모든 기기 세션을 끝낸다(30일 안에 다시 로그인하면 복구) */
      L.state.profile = null;

      closeWithdrawModal();
      document.getElementById('appShell').classList.remove('active');
      document.getElementById('authScreen').style.display = 'flex';
      L.initRememberedAuthFields();
      L.toast('탈퇴 신청을 서버에 기록했어요. 30일이 지나면 계정과 데이터가 서버에서 영구 파기돼요. 그 전에 어느 기기에서든 다시 로그인하면 복구할 수 있어요.');
    } catch(err){
      console.error('Withdrawal error:', err);
      if(confirmBtn){
        confirmBtn.disabled = false;
        confirmBtn.innerText = '탈퇴 신청하기';
      }
      L.toast('탈퇴 처리 중 오류가 발생했습니다: ' + (err.message || '잠시 후 다시 시도해주세요'));
    }
  }
  /* ---- 이전 전 index.html 4486~4584줄(#TASK-ES-522 생성기 표지) ---- */

  function openWithdrawModal(){
    if(!L.state.profile || !L.state.profile.id){
      L.toast('로그인 상태를 확인할 수 없습니다.');
      return;
    }
    if(L.state.profile.id === 'guest_user'){
      L.toast('게스트 모드에서는 회원 탈퇴가 필요하지 않습니다. 데이터 초기화를 이용해주세요.');
      return;
    }

    var html = '' +
      '<div id="withdrawModal" class="withdraw-modal-container">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
          '<h3 style="margin:0;font-size:1.15rem;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
            '<span>⚠️</span> 회원 탈퇴 및 법적책임·데이터 분실 사전 안내' +
          '</h3>' +
          '<button type="button" id="withdrawCloseBtn" class="btn-close" style="background:none;border:none;font-size:1.25rem;cursor:pointer;color:var(--ink-soft);padding:4px;" aria-label="닫기">×</button>' +
        '</div>' +
        '<div class="withdraw-top-banner">' +
          '아워골 서비스를 이용해 주셔서 진심으로 감사드립니다.<br>' +
          '계정 탈퇴 신청 전, 아래의 <b>탈퇴 신청 후 실제로 일어나는 일</b>과 <b>영구 파기 범위</b>를 꼭 확인해 주세요.' +
        '</div>' +

        '<!-- 1. 데이터 분실 4대 영역 안내 -->' +
        '<div class="withdraw-box withdraw-box-danger">' +
          '<div class="withdraw-box-title"><span>🗑️</span> 1. 소중한 목표 및 기록 분실 안내 (개인 자산 4대 영역 고지)</div>' +
          '<div class="withdraw-box-desc">' +
            '탈퇴를 신청하고 <b>30일이 지나면</b>, 매일 한 번 도는 서버 파기 작업이 아래 데이터와 로그인 계정을 <b>서버에서 영구 파기</b>합니다. 파기된 뒤에는 다시 복구할 수 없습니다.' +
            '<ul>' +
              '<li><b>목표 및 마일스톤</b>: 유저가 수립한 모든 개인/팀 목표, 하위 세부 할일, 루틴 설정 및 완료 진행 상태 전체</li>' +
              '<li><b>인생 실천 기록 및 타임라인</b>: 매일 남기신 3초 체크인, 일일 회고록, 뽀모도로 타이머 누적 시간, 첨부 링크, 누적 히트맵 데이터</li>' +
              '<li><b>아바타 인벤토리 및 성장 자산</b>: 320종 맞춤 아바타, 10개 커스텀 슬롯, 성장 레벨/경험치(EXP), 도감 수집률, 획득 배지 전체</li>' +
              '<li><b>소통 및 커뮤니티 데이터</b>: 피드 인증 게시글, 응원/스탬프 내역, 내가 보낸 마니또 응원·1:1 메시지·팀 댓글</li>' +
            '</ul>' +
          '</div>' +
        '</div>' +

        '<!-- 2. 30일 안전 유예 및 무손실 복구 안내 -->' +
        '<div class="withdraw-box withdraw-box-info">' +
          '<div class="withdraw-box-title"><span>🛡️</span> 2. 30일 탈퇴 유예 안전망 및 원클릭 복구</div>' +
          '<div class="withdraw-box-desc">' +
            '우발적인 클릭이나 실수로 인한 자산 유실을 방지하기 위해 <b>30일간 안전 유예 기간</b>이 부여됩니다.' +
            '<ul>' +
              '<li>탈퇴를 신청하면 신청 시각이 <b>서버에 기록</b>되고, 이 기기에서 바로 로그아웃됩니다. 서버에 기록되지 않으면 탈퇴 신청이 되지 않고 오류를 알려 드립니다.</li>' +
              '<li><b>30일 안에 어느 기기에서든 다시 로그인</b>하면 복구 안내가 뜨고, 복구를 누르면 서버의 탈퇴 신청 기록을 지우므로 데이터를 그대로 이어서 쓸 수 있습니다.</li>' +
              '<li>30일이 지나면 복구할 수 없고 로그인해도 앱에 들어갈 수 없습니다. 그 뒤 매일 한 번 도는 서버 파기 작업에서 차례대로(하루 최대 50계정) 계정과 데이터가 삭제됩니다.</li>' +
            '</ul>' +
          '</div>' +
        '</div>' +

        '<!-- 3. 파기 범위와 법령상 보존 기록 -->' +
        '<div class="withdraw-box withdraw-box-legal">' +
          '<div class="withdraw-box-title"><span>⚖️</span> 3. 데이터 삭제(파기) 현황과 요청 방법</div>' +
          '<div class="withdraw-box-desc">' +
            '개인정보보호법 제21조는 보유 목적이 끝난 개인정보를 지체 없이 파기하도록 정하고 있습니다. 아워골은 위 2번의 <b>30일 복구 기간이 끝나면 서버에서 자동으로 영구 파기</b>합니다.' +
            '<ul>' +
              '<li><b>파기되는 것</b>: 위 1번의 데이터(목표·체크인 기록과 그 백업·프로필·피드 글·내가 보낸 메시지·신고·알림 구독·1:1 문의 원장·설정과 동반자 저장 기록)와 로그인 계정, 로그인 기록(인증 감사 로그).</li>' +
              '<li><b>파기되지 않는 것</b>: 다른 회원이 나에게 보낸 메시지(그 회원의 글), 누가 보냈는지 담지 않은 익명 이용 통계, 1:1 문의·앱 평가로 보내신 내용의 운영팀 문의함(노션)·알림(텔레그램) 사본, 호스팅 회사(Supabase·Vercel)의 접속 로그와 장애 대비 백업(각 회사의 보관 기간이 끝나면 사라짐).</li>' +
              '<li><b>법령상 보존 의무 기록</b>: 아워골은 유료 결제·거래가 없어 전자상거래법상 보존할 계약·결제 기록이 없고, 통신비밀보호법상 접속 기록(3개월)도 따로 떼어 보관하지 않습니다. 그래서 탈퇴 후 법령을 이유로 따로 보관하는 기록은 없습니다.</li>' +
              '<li><b>더 빨리 지우거나 사본 삭제를 원하시면</b>: 공식 지원 이메일 <b>ourgoal.support@gmail.com</b> 으로 가입한 이메일(또는 카카오 계정)과 함께 &quot;계정 데이터 삭제 요청&quot;을 보내 주세요.</li>' +
              '<li><b>이 기기에 남는 것</b>: 앱 설정과 화면 캐시 일부. 기기의 브라우저 데이터 삭제로 지울 수 있습니다.</li>' +
            '</ul>' +
          '</div>' +
        '</div>' +

        '<div class="withdraw-agree-wrapper">' +
          '<label class="withdraw-check-label" for="withdrawAgreeCheck">' +
            '<input type="checkbox" id="withdrawAgreeCheck">' +
            '<span>위의 <b>30일 후 서버 영구 파기</b>와 <b>파기 범위</b>를 확인했으며, 회원 탈퇴를 신청합니다.</span>' +
          '</label>' +
        '</div>' +

        '<div class="modal-actions" style="display:flex;gap:8px;margin-top:8px;">' +
          '<button type="button" class="btn btn-ghost" id="withdrawCancelBtn" style="flex:1;">취소 (계정 유지)</button>' +
          '<button type="button" class="btn btn-danger" id="withdrawConfirmBtn" style="flex:1;" disabled>탈퇴 신청하기</button>' +
        '</div>' +
      '</div>';

    L.openModal(html, function(sheet){
      var closeBtn = sheet.querySelector('#withdrawCloseBtn');
      var cancelBtn = sheet.querySelector('#withdrawCancelBtn');
      var agreeCheck = sheet.querySelector('#withdrawAgreeCheck');
      var confirmBtn = sheet.querySelector('#withdrawConfirmBtn');

      if(closeBtn) closeBtn.onclick = closeWithdrawModal;
      if(cancelBtn) cancelBtn.onclick = closeWithdrawModal;

      if(agreeCheck && confirmBtn){
        agreeCheck.onchange = function(){
          confirmBtn.disabled = !this.checked;
        };
      }

      if(confirmBtn){
        confirmBtn.onclick = submitWithdrawAccount;
      }
    });
  }
  /* ---- 이전 전 index.html 4585~4589줄(#TASK-ES-522 생성기 표지) ---- */

  // 하위 호환 래퍼 유지 (스모크 테스트 및 기존 호출부 호환)
  async function withdrawAccount(){
    openWithdrawModal();
  }

  K.closeWithdrawModal = closeWithdrawModal;
  K.submitWithdrawAccount = submitWithdrawAccount;
  K.openWithdrawModal = openWithdrawModal;
  K.withdrawAccount = withdrawAccount;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
