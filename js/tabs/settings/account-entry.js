/**
 * OurGoal Account Entry (설정 탭 — 로그인 보조·비밀번호 변경·탈퇴 복구·약관 창)
 *
 * #TASK-ES-437 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   showLastAuthBadge · initRememberedAuthFields — 「P0: 최근 로그인 뱃지 & 아이디 저장 & 로그인 유지」(이전 전 6352~6363줄, 구획 주석 포함)
 *   openChangePasswordModal — 「P0: 설정 화면 내 비밀번호 변경 모달」(이전 전 6382~6387줄, 구획 주석 포함)
 *   checkPendingDeletionRestore — 「P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크」(이전 전 6390~6395줄)
 *   showLegalModal — 「이용약관 & 개인정보처리방침 모달」(이전 전 8164~8207줄)
 * 최근 로그인 뱃지·아이디 기억(OurgoalAuthSafety 위임), 설정의 비밀번호 변경 창, 탈퇴 유예 복구 확인, 이용약관·개인정보처리방침 창.
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

  /* ============ P0: 최근 로그인 뱃지 & 아이디 저장 & 로그인 유지 ============ */
  function showLastAuthBadge(){
    if(window.OurgoalAuthSafety && typeof window.OurgoalAuthSafety.showLastAuthBadge === 'function'){
      window.OurgoalAuthSafety.showLastAuthBadge();
    }
  }

  function initRememberedAuthFields(){
    if(window.OurgoalAuthSafety && typeof window.OurgoalAuthSafety.initRememberedAuthFields === 'function'){
      window.OurgoalAuthSafety.initRememberedAuthFields();
    }
  }

  /* ============ P0: 설정 화면 내 비밀번호 변경 모달 ============ */
  function openChangePasswordModal(){
    if(window.OurgoalAuthSafety && typeof window.OurgoalAuthSafety.openChangePasswordModal === 'function'){
      window.OurgoalAuthSafety.openChangePasswordModal();
    }
  }

  async function checkPendingDeletionRestore(){
    if(window.OurgoalAuthSafety && typeof window.OurgoalAuthSafety.checkPendingDeletionRestore === 'function'){
      return await window.OurgoalAuthSafety.checkPendingDeletionRestore();
    }
    return false;
  }

  function showLegalModal(initialTab){
    var curTab = initialTab === 'privacy' ? 'privacy' : 'terms';
    function getBody(tab){
      if(tab === 'privacy'){
        return '<h4 style="margin:4px 0 6px;">아워골 개인정보처리방침</h4>' +
          '<p class="faint" style="font-size:0.75rem;margin-bottom:12px;">시행일자: 2026년 9월 9일</p>' +
          '<div style="max-height:55vh;overflow-y:auto;font-size:0.8rem;line-height:1.65;padding-right:4px;color:var(--ink-soft);">' +
          '<p><b>제1조 (수집하는 개인정보 항목)</b><br>• 회원가입 및 소셜 로그인(카카오/구글/애플): 이메일 주소, 닉네임, 프로필 사진 URL, 소셜 고유 식별자<br>• 서비스 이용: 목표, 마일스톤, 체크인 기록, 피드백 설정, 피드 게시물 및 댓글<br>• 기기 정보: 기기 식별값(익명 sid), 접속 일시</p>' +
          '<p><b>제2조 (개인정보의 처리 목적)</b><br>• 회원 식별 및 계정 관리<br>• 목표 관리, 체크인 기록 저장 및 맞춤 피드백 제공<br>• 1:1 고객 문의 응대 및 중요 고지사항 전달</p>' +
          '<p><b>제3조 (보유 및 파기)</b><br>• 회원 탈퇴를 신청하면 신청 시각이 서버에 기록되고, 30일 안에 다시 로그인하면 복구할 수 있습니다.<br>• 신청 후 30일이 지나면 매일 한 번 도는 서버 파기 작업이 계정과 목표·체크인 기록(백업 포함)·프로필·피드 글·내가 보낸 메시지·설정과 동반자 저장 기록 등 개인정보를 영구 파기합니다(하루 최대 50계정, 차례대로).<br>• 다른 회원이 보낸 메시지, 익명 이용 통계, 1:1 문의의 운영팀 문의함(노션)·알림(텔레그램) 사본, 호스팅 회사(Supabase·Vercel)의 접속 로그·장애 대비 백업은 이 작업으로 지워지지 않습니다(사본은 이메일 요청 시 삭제).<br>• 아워골은 유료 결제·거래가 없어 전자상거래법상 보존 기록이 없고, 통신비밀보호법상 접속 기록도 따로 보관하지 않습니다.</p>' +
          '<p><b>제4조 (제3자 제공 및 위탁)</b><br>• 서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.<br>• 인프라 위탁: Supabase Inc. (클라우드 DB), Vercel Inc. (호스팅 및 API)</p>' +
          '<p><b>제5조 (이용자의 권리와 행사)</b><br>• 이용자는 언제든지 [설정] 메뉴의 [회원 탈퇴]로 탈퇴를 신청할 수 있으며, 신청 30일 후 계정과 개인정보가 서버에서 영구 파기됩니다.<br>• 더 빨리 삭제하거나 사본 삭제를 원하시면 ourgoal.support@gmail.com 으로 요청할 수 있습니다.</p>' +
          '<p><b>제6조 (개인정보 보호책임자)</b><br>• 성명: 아워골 운영팀 · 문의: ourgoal.support@gmail.com</p>' +
          '</div>';
      } else {
        return '<h4 style="margin:4px 0 6px;">아워골 서비스 이용약관</h4>' +
          '<p class="faint" style="font-size:0.75rem;margin-bottom:12px;">시행일자: 2026년 9월 9일</p>' +
          '<div style="max-height:55vh;overflow-y:auto;font-size:0.8rem;line-height:1.65;padding-right:4px;color:var(--ink-soft);">' +
          '<p><b>제1조 (목적)</b><br>본 약관은 아워골 서비스의 이용과 관련하여 서비스와 회원 간의 권리, 의무 및 책임사항을 규정합니다.</p>' +
          '<p><b>제2조 (이용계약)</b><br>회원가입 또는 소셜 로그인을 통해 서비스를 시작함으로써 본 약관 및 개인정보처리방침에 동의한 것으로 간주됩니다.</p>' +
          '<p><b>제3조 (사용자 콘텐츠 및 커뮤니티 정책)</b><br>• 음란물, 폭력/혐오 표현, 타인 비방, 무단 광고 등 불법·유해 콘텐츠 게시를 엄격히 금지합니다.<br>• 신고가 누적되거나 운영 정책을 위반한 콘텐츠는 사전 통보 없이 즉시 숨김 또는 삭제될 수 있습니다.</p>' +
          '<p><b>제4조 (계약 해지 및 회원 탈퇴)</b><br>회원은 언제든지 서비스 내 [설정] 메뉴를 통해 회원 탈퇴를 신청할 수 있습니다. 신청 시각은 서버에 기록되며, 30일 안에 다시 로그인하면 복구할 수 있고, 30일이 지나면 계정과 데이터가 서버에서 영구 파기되어 복구할 수 없습니다. 파기 범위는 개인정보처리방침 제3조를 따릅니다.</p>' +
          '<p><b>제5조 (면책 조항)</b><br>서비스는 천재지변, 외부 클라우드 장애 등 불가항력적 사유로 인한 장애에 대하여 책임을 면합니다.</p>' +
          '</div>';
      }
    }

    function render(){
      L.openModal(
        '<div class="auth-tabs" style="margin-bottom:14px;">' +
          '<button class="auth-tab' + (curTab==='terms'?' active':'') + '" id="legalTabTerms" type="button">이용약관</button>' +
          '<button class="auth-tab' + (curTab==='privacy'?' active':'') + '" id="legalTabPrivacy" type="button">개인정보처리방침</button>' +
        '</div>' +
        '<div id="legalBody">' + getBody(curTab) + '</div>' +
        '<div class="modal-actions" style="margin-top:14px;"><button class="btn btn-primary btn-block" id="legalCloseBtn" type="button">확인</button></div>',
        function(sheet){
          sheet.querySelector('#legalCloseBtn').addEventListener('click', L.closeModal);
          sheet.querySelector('#legalTabTerms').addEventListener('click', function(){ curTab='terms'; render(); });
          sheet.querySelector('#legalTabPrivacy').addEventListener('click', function(){ curTab='privacy'; render(); });
        }
      );
    }
    render();
  }

  K.showLastAuthBadge = showLastAuthBadge;
  K.initRememberedAuthFields = initRememberedAuthFields;
  K.openChangePasswordModal = openChangePasswordModal;
  K.checkPendingDeletionRestore = checkPendingDeletionRestore;
  K.showLegalModal = showLegalModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
