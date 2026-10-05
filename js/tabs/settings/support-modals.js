/**
 * OurGoal Support Modals (설정 탭 — 고객지원·자주 묻는 질문·잇템 신고 창)
 *
 * #TASK-ES-448 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G167·G168.
 *   옮긴 선언(이전 전 줄): openCustomerInquiryModal(33288~33329) · openItemReportModal(33333~33424) · openFaqModal(33428~33478)
 * openCustomerInquiryModal = 고객지원 문의 창, openFaqModal = 자주 묻는 질문 창, openItemReportModal = 잇템 불법/유해 링크 3초 신고 창.
 * window 노출 문·위젯 설정 단추 전역 클릭 위임과 위젯 설정 창(openWidgetSettingsModal — 시험지 desktop-widget-suite 가 index.html 글자로 읽음)은 index.html 제자리에 남았다.
 * 최상위 선언을 앞 주석·구획 주석과 함께 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 같은 키트의 다른 세포 이름은 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 로드 중 바로 도는 문(window.X 노출·전역 이벤트 위임)과 시험지가 index.html 에서 글자로 읽는 함수는 index.html 제자리에 남겼다.
 * index.html 은 IIFE 맨 위에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져와 쓴다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 인라인 세포화 1차 #TASK-ES-423 · 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* ============ 고객지원 & FAQ 모달 (Req 10) ============ */
  function openCustomerInquiryModal(){
    L.openModal(
      '<h3>1:1 고객 문의 및 오류 제보</h3>' +
      '<p class="faint" style="margin:-8px 0 16px;">불편하신 점이나 새로운 기능 제안을 남겨주시면 개발팀에서 신속하게 검토합니다.</p>' +
      '<div class="field">' +
        '<label>문의 유형</label>' +
        '<select id="inquiryType">' +
          '<option value="bug">버그 / 오류 제보</option>' +
          '<option value="feature">새로운 기능 제안</option>' +
          '<option value="account">계정 / 보안 관련</option>' +
          '<option value="other">기타 문의사항</option>' +
        '</select>' +
      '</div>' +
      '<div class="field">' +
        '<label>답변받으실 이메일</label>' +
        '<input id="inquiryEmail" type="email" value="'+L.escapeHtml((L.state.user && L.state.user.email) || (L.state.profile && L.state.profile.email) || '')+'" placeholder="답변받으실 이메일 주소">' +
      '</div>' +
      '<div class="field">' +
        '<label>문의 내용</label>' +
        '<textarea id="inquiryContent" rows="4" placeholder="상세한 내용이나 발생 상황을 적어주세요." style="width:100%;border-radius:10px;padding:8px 12px;background:var(--card2);border:1px solid var(--rule);color:var(--ink);font-size:.875rem;resize:vertical;box-sizing:border-box;"></textarea>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost" id="inquiryCancel" type="button">취소</button>' +
        '<button class="btn btn-primary" id="inquirySubmit" type="button">문의 접수</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#inquiryCancel').onclick = L.closeModal;
        sheet.querySelector('#inquirySubmit').onclick = async function(){
          var content = (sheet.querySelector('#inquiryContent').value || '').trim();
          if(!content){ L.toast('문의 내용을 입력해주세요'); return; }
          var btn = sheet.querySelector('#inquirySubmit'); var inqType = (sheet.querySelector('#inquiryType') && sheet.querySelector('#inquiryType').value) || 'other'; var replyEmail = (sheet.querySelector('#inquiryEmail') && sheet.querySelector('#inquiryEmail').value || '').trim();
          btn.disabled = true; btn.textContent = '접수 중...'; try {
            var payload = { action: 'inquiry', content: content, inquiryType: inqType, replyEmail: replyEmail, userId: (L.state.profile && L.state.profile.id) || (L.state.user && L.state.user.id) || '', userNickname: (L.state.profile && L.state.profile.nickname) || (L.state.profile && L.state.profile.username) || '익명 유저', userAgent: (navigator.userAgent || '').slice(0, 300), appVersion: 'v1.0.0' };
            var res = await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); var data = await res.json().catch(function(){ return {}; });
            if (res.ok && data.ok) { L.closeModal(); L.toast('문의가 성공적으로 접수되었습니다. 신속히 검토하겠습니다.'); } else { throw new Error((data && data.error) || '접수 중 오류가 발생했습니다.'); }
          } catch(e) { btn.disabled = false; btn.textContent = '문의 접수'; L.toast(e.message || '네트워크 오류가 발생했습니다.'); }
        };
      }
    );
  }

  /* ============ 잇템 불법/유해 링크 3초 퀵 신고 모달 (#TASK-ES-179) ============ */
  function openItemReportModal(reportData){
    reportData = reportData || {};
    var itemName = reportData.name || reportData.itemName || '등록된 잇템';
    var itemUrl = reportData.buyUrl || reportData.url || reportData.itemUrl || '';
    var itemOwner = reportData.owner || reportData.itemOwner || '등록 유저';

    L.openModal(
      '<h3>🚨 잇템 불법·유해 링크 신고</h3>' +
      '<p class="faint" style="margin:-8px 0 14px;font-size:.8125rem;">안전하고 신뢰할 수 있는 목표 달성 환경을 위해 불법·유해 링크를 신속히 제보해 주세요.</p>' +
      '<div style="padding:10px 12px;background:var(--card2);border-radius:10px;border:1px solid var(--rule);margin-bottom:12px;font-size:.8125rem;">' +
        '<div style="font-weight:700;color:var(--ink);margin-bottom:3px;">📦 ' + L.escapeHtml(itemName) + '</div>' +
        (itemOwner ? '<div class="faint" style="font-size:.75rem;margin-bottom:2px;">등록자: ' + L.escapeHtml(itemOwner) + '</div>' : '') +
        (itemUrl ? '<div style="font-size:.75rem;color:var(--brand-strong);word-break:break-all;">' + L.escapeHtml(itemUrl) + '</div>' : '') +
      '</div>' +
      '<div class="field">' +
        '<label style="font-weight:700;margin-bottom:6px;">신고 사유 선택 (필수)</label>' +
        '<div style="display:flex;flex-direction:column;gap:6px;" id="repReasonWrap">' +
          '<label style="display:flex;align-items:center;gap:8px;font-size:.8125rem;cursor:pointer;"><input type="radio" name="repReason" value="commission" checked style="accent-color:var(--brand);cursor:pointer;"> <span>수수료/제휴 대가성 미표기 (뒷광고)</span></label>' +
          '<label style="display:flex;align-items:center;gap:8px;font-size:.8125rem;cursor:pointer;"><input type="radio" name="repReason" value="phishing" style="accent-color:var(--brand);cursor:pointer;"> <span>사기 · 피싱 의심 사이트 결제 유도</span></label>' +
          '<label style="display:flex;align-items:center;gap:8px;font-size:.8125rem;cursor:pointer;"><input type="radio" name="repReason" value="harmful" style="accent-color:var(--brand);cursor:pointer;"> <span>불법 도박 · 성인물 · 유해 소프트웨어 링크</span></label>' +
          '<label style="display:flex;align-items:center;gap:8px;font-size:.8125rem;cursor:pointer;"><input type="radio" name="repReason" value="other" style="accent-color:var(--brand);cursor:pointer;"> <span>기타 규정 위반 및 허위 정보</span></label>' +
        '</div>' +
      '</div>' +
      '<div class="field" style="margin-top:10px;">' +
        '<label>상세 설명 (선택)</label>' +
        '<textarea id="repDetailInput" rows="3" placeholder="구체적인 문제 상황이나 의심되는 점을 적어주세요." style="width:100%;border-radius:10px;padding:8px 12px;background:var(--card2);border:1px solid var(--rule);color:var(--ink);font-size:.8125rem;resize:vertical;box-sizing:border-box;"></textarea>' +
      '</div>' +
      '<div style="margin:12px 0 14px;padding:8px 12px;background:rgba(235,87,87,0.08);border:1px solid rgba(235,87,87,0.25);border-radius:8px;font-size:.75rem;color:var(--red);line-height:1.45;">' +
        '<b style="font-weight:700;">⚠️ 주의:</b> 허위 또는 악의적인 신고임이 확인될 경우, 서비스 이용 제한 등 계정에 불이익을 받으실 수 있습니다.' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost" id="repCancelBtn" type="button">취소</button>' +
        '<button class="btn btn-primary" id="repSubmitBtn" type="button" style="background:var(--red);border-color:var(--red);">신고 접수</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#repCancelBtn').onclick = L.closeModal;
        sheet.querySelector('#repSubmitBtn').onclick = async function(){
          var btn = sheet.querySelector('#repSubmitBtn');
          var selectedRadio = sheet.querySelector('input[name="repReason"]:checked');
          var reasonKey = selectedRadio ? selectedRadio.value : 'other';
          var reasonLabels = {
            commission: '수수료/제휴 대가성 미표기 (뒷광고)',
            phishing: '사기·피싱 의심 사이트',
            harmful: '불법·도박·성인물 등 유해 링크',
            other: '기타 규정 위반'
          };
          var detail = (sheet.querySelector('#repDetailInput').value || '').trim();

          btn.disabled = true;
          btn.textContent = '신고 접수 중...';

          try {
            var payload = {
              action: 'inquiry',
              inquiryType: 'item_report',
              reportData: {
                itemName: itemName,
                itemUrl: itemUrl,
                itemOwner: itemOwner,
                reason: reasonKey,
                reasonLabel: reasonLabels[reasonKey] || reasonKey
              },
              content: detail || (reasonLabels[reasonKey] + ' 사유로 신고 접수됨'),
              userId: (L.state.profile && L.state.profile.id) || (L.state.user && L.state.user.id) || '',
              userNickname: (L.state.profile && L.state.profile.nickname) || (L.state.profile && L.state.profile.username) || '익명 러너',
              userAgent: (navigator.userAgent || '').slice(0, 300),
              appVersion: 'v1.0.0'
            };

            var res = await fetch('/api/inquiry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            var data = await res.json().catch(function(){ return {}; });
            if(res.ok && data.ok){
              L.closeModal();
              L.toast('신고가 성공적으로 접수되었습니다. 신속히 검토하겠습니다.');
            } else {
              throw new Error((data && data.error) || '신고 접수 중 오류가 발생했습니다.');
            }
          } catch(e) {
            btn.disabled = false;
            btn.textContent = '신고 접수';
            L.toast(e.message || '네트워크 오류가 발생했습니다.');
          }
        };
      }
    );
  }

  function openFaqModal(){
    var faqs = [
      {
        q: '목표와 마일스톤은 어떻게 설정하나요?',
        a: '목표 탭 상단의 AI 대화창에 자유롭게 이루고 싶은 목표를 문장으로 입력하세요. AI 비서가 목표 기간, 단계별 마일스톤, 하위 할 일까지 자동으로 구조화하여 추천해 줍니다. 직접 상단의 "+ 새 목표" 버튼을 눌러 수동으로 작성할 수도 있습니다.'
      },
      {
        q: '구글 캘린더 연동은 어떻게 동작하나요?',
        a: '구글 계정을 연동하면 아워골에 등록된 마일스톤 및 할 일의 마감 일정이 구글 캘린더에 자동으로 동기화됩니다. 일정 탭 상단의 배너나 설정 탭의 구글 캘린더 메뉴에서 언제든지 연동 및 수동 동기화를 진행할 수 있습니다.'
      },
      {
        q: '체크인 기록과 스트릭(연속 달성)은 어떻게 관리되나요?',
        a: '오늘 실천한 행동을 기록 탭이나 홈 탭에서 대화형/수동으로 기록하면 일일 스트릭이 1일 증가합니다. 만약 하루를 놓쳤을 경우 상점에서 스트릭 프리즈(얼음)를 사용하여 연속 불꽃을 보호할 수 있습니다.'
      },
      {
        q: '공개 범위를 비공개(나만 보기)로 설정하면 어떻게 되나요?',
        a: '목표, 캘린더, 기록의 공개 범위를 "🔒 나만 보기"로 설정하면 피드나 팀원에게 일체 노출되지 않으며 오직 본인에게만 표시되는 안전한 프라이빗 공간으로 운영됩니다.'
      },
      {
        q: '데이터 백업과 기기 간 동기화는 어떻게 하나요?',
        a: '설정 > 데이터 관리에서 "전체 백업" 버튼을 누르면 모든 목표와 기록이 JSON 파일로 다운로드됩니다. 새 기기나 다른 브라우저에서 "가져오기"를 통해 즉시 복원할 수 있습니다.'
      }
    ];

    var faqHtml = faqs.map(function(item){
      return '<details style="margin-bottom:8px;padding:10px 12px;background:var(--card2);border:1px solid var(--rule);border-radius:12px;">' +
        '<summary style="font-weight:700;font-size:.875rem;color:var(--ink);cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;">' +
          '<span>Q. ' + L.escapeHtml(item.q) + '</span>' +
          '<span style="font-size:.8125rem;color:var(--ink-faint);">▼</span>' +
        '</summary>' +
        '<p class="faint" style="margin:8px 0 0;font-size:.8125rem;line-height:1.5;color:var(--ink-soft);border-top:1px dashed var(--rule);padding-top:8px;">' +
          L.escapeHtml(item.a) +
        '</p>' +
      '</details>';
    }).join('');

    L.openModal(
      '<h3>자주 묻는 질문 (FAQ)</h3>' +
      '<p class="faint" style="margin:-8px 0 14px;">아워골 이용 시 자주 궁금해하시는 내용들을 모았습니다.</p>' +
      '<div style="max-height:60vh;overflow-y:auto;padding-right:2px;">' +
        faqHtml +
      '</div>' +
      '<div class="modal-actions" style="margin-top:14px;">' +
        '<button class="btn btn-primary" id="faqCloseBtn" type="button">확인</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#faqCloseBtn').onclick = L.closeModal;
      }
    );
  }

  K.openCustomerInquiryModal = openCustomerInquiryModal;
  K.openItemReportModal = openItemReportModal;
  K.openFaqModal = openFaqModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
