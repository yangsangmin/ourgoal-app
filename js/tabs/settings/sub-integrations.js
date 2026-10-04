/**
 * OurGoal Settings Sub-Block: Integrations (구글 캘린더 · 가상 페르소나 · 휴지통/차단 · 노션 · 잇템)
 *
 * #TASK-ES-354 (노션 CORE-07 · SET-07): index.html 인라인 renderSettingsScreen 의 이 구간(이전 전 39275~39518줄)을 동작 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 설정 파일 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 그리는 순서와 같은 settings 객체는 renderSettingsScreen(js/tabs/settings/render.js)이 정한다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // 공용 부품은 js/core 두 곳으로만 읽는다(설정 전용 통로 없음).
  //  U = js/core/ui-helpers.js — 여러 탭이 같이 쓰는 순수 헬퍼(escapeHtml·a11ySwitch·nowISO·download·triggerHaptic·triggerHapticFeedback), 코드가 실제로 옮겨 와 있다.
  //  L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var U = global.OurgoalUiHelpers || {};
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 설정 키트: 설정 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* 섹션 렌더: renderSettingsScreen 이 원래 순서대로 부른다. settings = state.profile.settings (renderSettingsScreen 이 한 번 읽어 넘긴 같은 객체) */
  function renderIntegrationsSection(settings){
    // 📅 구글 캘린더 연동 (Req 3 & 4)
    if(!settings.gcalSync) settings.gcalSync = { goals:{}, ms:{}, imported:{} };
    var gcalIdInput = document.getElementById('gcalClientIdInput');
    if(gcalIdInput) gcalIdInput.value = settings.gcalClientId || '';
    var gcalConnected = L.isGoogleCalendarConnected();
    var statusBox = document.getElementById('gcalStatusBox');
    // [#TASK-ES-345 CAL-02] 연동돼 있는데 이 계정의 토큰이 없거나 만료됐으면 1줄 안내 + '다시 연결' 1탭(기존 연결 함수 재사용)
    var gcalTokState = gcalConnected ? L.gcalTokenStatus() : 'missing';
    if(statusBox){
      if(gcalConnected && gcalTokState !== 'valid'){
        statusBox.innerHTML =
          '<div id="gcalReconnectNotice" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
            '<p class="faint" style="margin:0;color:var(--amber);font-weight:700;flex:1;min-width:0;">' +
              (gcalTokState === 'expired' ? '구글 캘린더 연결이 끊겼어요 · 다시 연결해 주세요' : '이 계정의 구글 캘린더 연결 정보가 없어요 · 다시 연결해 주세요') +
            '</p>' +
            '<button class="btn btn-primary btn-sm" id="gcalReconnectBtn" type="button" style="min-height:44px;">다시 연결</button>' +
          '</div>';
        var reBtn = document.getElementById('gcalReconnectBtn');
        if(reBtn) reBtn.onclick = L.openGoogleCalendarConnectModal;
      } else {
        statusBox.innerHTML = gcalConnected
          ? '<p class="faint" style="margin:0;color:var(--sage);font-weight:700;">구글 캘린더가 연동되었습니다</p>'
          : '<p class="faint" style="margin:0;color:var(--amber);font-weight:700;">구글 캘린더를 연동하세요</p>';
      }
    }
    var qConnRow = document.getElementById('gcalQuickConnectRow');
    if(qConnRow) qConnRow.style.display = gcalConnected ? 'none' : 'block';
    var syncRow = document.getElementById('gcalSyncRow');
    if(syncRow) syncRow.style.display = gcalConnected ? 'flex' : 'none';
    var qConnBtn = document.getElementById('gcalQuickConnectBtn');
    if(qConnBtn) qConnBtn.onclick = L.openGoogleCalendarConnectModal;
    var syncNowBtn = document.getElementById('gcalSyncNowBtn');
    if(syncNowBtn) syncNowBtn.onclick = function(){ L.syncAllToGoogleCalendar(true); };
    var disconnBtn = document.getElementById('gcalDisconnectBtn');
    if(disconnBtn){
      disconnBtn.onclick = async function(){
        if(confirm('구글 캘린더 연동을 해제하시겠습니까?')){
          L.state.googleToken = null;
          try {
            var uid = (L.state.profile && L.state.profile.id) || 'guest';
            localStorage.removeItem('ourgoal_gcal_token_v1_' + uid);
            localStorage.removeItem('ourgoal_gcal_token_v1_last');
            sessionStorage.removeItem('ourgoal_google_token');
          } catch(e){}
          settings.googleCalendarConnected = false;
          settings.googleCalendarEmail = '';
          await L.saveProfile();
          K.renderSettingsScreen();
          if(L.state.activeTab === 'calendar') L.renderCalendarScreen();
          L.toast('구글 캘린더 연동이 해제되었습니다');
        }
      };
    }
    var autoSyncSw = document.getElementById('gcalAutoSyncSwitch');
    if(autoSyncSw){
      var isAuto = settings.gcalAutoSync !== false;
      autoSyncSw.className = 'switch' + (isAuto ? ' on' : '');
      U.a11ySwitch(autoSyncSw, isAuto, '목표·일정 변경 시 자동 동기화');
      autoSyncSw.onclick = async function(){
        settings.gcalAutoSync = !isAuto;
        await L.saveProfile();
        K.renderSettingsScreen();
      };
    }
    if(gcalIdInput){
      gcalIdInput.onchange = async function(){
        settings.gcalClientId = gcalIdInput.value.trim();
        L.googleTokenClient = null;
        await L.saveProfile();
        K.renderSettingsScreen();
      };
    }
    var gImpBtn = document.getElementById('gcalImportBtn');
    if(gImpBtn) gImpBtn.onclick = L.openGcalImportModal;
    var gExpBtn = document.getElementById('gcalExportBtn');
    if(gExpBtn) gExpBtn.onclick = L.openGcalExportModal;
    // 가상 페르소나
    var cheerSw = document.getElementById('virtualCheerSwitch');
    if(cheerSw){
      var isCheerOn = settings.virtualCheerEnabled !== false;
      cheerSw.className = 'switch' + (isCheerOn ? ' on' : '');
      U.a11ySwitch(cheerSw, isCheerOn, '가상 페르소나 응원 수신');
      cheerSw.onclick = async function(){
        settings.virtualCheerEnabled = !isCheerOn;
        await L.saveProfile();
        K.renderSettingsScreen();
      };
    }
    // 차단 사용자
    var trashList = L.getTrashList();
    var trashBtn = document.getElementById('btnOpenTrashModal');
    if(trashBtn){
      trashBtn.textContent = '🗑️ 휴지통 (' + trashList.length + '개 보관 중)';
      trashBtn.onclick = L.openTrashModal;
    }
    var blockedList = settings.blockedUsers || [];
    var countDesc = document.getElementById('blockedCountDesc');
    if(countDesc) countDesc.textContent = blockedList.length ? ('현재 ' + blockedList.length + '명의 사용자를 차단 중이에요.') : '차단된 사용자의 글/댓글은 피드에서 숨겨집니다.';
    var manageBlockedBtn = document.getElementById('manageBlockedBtn');
    if(manageBlockedBtn) manageBlockedBtn.onclick = function(){ L.openBlockedUsersModal(); };
    // 노션 연동
    var notionSw = document.getElementById('notionSwitch');
    notionSw.className = 'switch' + (settings.notionSync ? ' on' : '');
    U.a11ySwitch(notionSw, settings.notionSync, 'Notion 자동 동기화');
    document.getElementById('notionUrlBlock').style.display = settings.notionSync ? '' : 'none';
    var notionUrlInput = document.getElementById('notionWebhookInput');
    if(notionUrlInput){
      notionUrlInput.value = settings.notionWebhookUrl || '';
      notionUrlInput.onchange = async function(){
        settings.notionWebhookUrl = notionUrlInput.value.trim();
        await L.saveProfile();
      };
    }
    var notionKeyInput = document.getElementById('notionApiKeyInput');
    if(notionKeyInput){
      notionKeyInput.value = settings.notionApiKey || '';
      notionKeyInput.onchange = async function(){
        settings.notionApiKey = notionKeyInput.value.trim();
        await L.saveProfile();
      };
    }
    function extractNotionDatabaseId(input){
      if(!input) return '';
      var str = String(input).trim();
      var dashMatch = str.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if(dashMatch) return dashMatch[0].replace(/-/g, '').toLowerCase();
      var hexMatch = str.match(/[0-9a-f]{32}/i);
      if(hexMatch) return hexMatch[0].toLowerCase();
      return str.replace(/^.*\//, '').replace(/\?.*$/, '').replace(/-/g, '').trim();
    }
    if(typeof window !== 'undefined'){ window.extractNotionDatabaseId = extractNotionDatabaseId; }

    function updateNotionDirectLink(){
      var directLink = document.getElementById('notionDirectOpenLink');
      if(directLink){
        if(settings.notionDatabaseId){
          directLink.href = 'https://www.notion.so/' + settings.notionDatabaseId;
          directLink.title = '내 노션 데이터베이스 바로 열기';
        } else {
          directLink.href = 'https://www.notion.so';
          directLink.title = '노션 홈페이지 열기';
        }
      }
    }

    var notionDbInput = document.getElementById('notionDbIdInput');
    if(notionDbInput){
      notionDbInput.value = settings.notionDatabaseId || '';
      notionDbInput.onchange = async function(){
        var cleanId = extractNotionDatabaseId(notionDbInput.value);
        settings.notionDatabaseId = cleanId;
        notionDbInput.value = cleanId;
        await L.saveProfile();
        updateNotionDirectLink();
      };
    }
    updateNotionDirectLink();

    var notionAutoPushSw = document.getElementById('notionAutoPushSwitch');
    if(notionAutoPushSw){
      var isAuto = !!settings.notionAutoPush;
      notionAutoPushSw.className = 'switch' + (isAuto ? ' on' : '');
      U.a11ySwitch(notionAutoPushSw, isAuto, '맞춤 템플릿 저장 시 노션 DB로 자동 전송');
      notionAutoPushSw.onclick = async function(){
        settings.notionAutoPush = !isAuto;
        await L.saveProfile();
        K.renderSettingsScreen();
      };
    }
    notionSw.onclick = async function(){
      settings.notionSync = !settings.notionSync;
      await L.saveProfile();
      K.renderSettingsScreen();
    };
    document.getElementById('notionTestBtn').onclick = async function(){
      if(settings.notionApiKey && settings.notionDatabaseId){
        L.toast('Notion DB로 테스트 전송 중...');
        var res = await L.pushRecordToNotion({ startAt: U.nowISO(), memo: '아워골 연동 테스트' }, { title: '테스트' }, ['항목', '상태'], [['연동 확인', '성공']]);
        L.toast(res.ok ? '' + res.summary : '전송 실패: ' + (res.error || res.summary));
      } else if(settings.notionWebhookUrl){
        var ok = await L.sendToNotion({ text:'아워골 테스트 전송입니다', createdAt: U.nowISO() }, null);
        L.toast(ok ? '노션 웹훅으로 테스트 전송했어요' : '전송에 실패했어요 · URL을 확인해주세요');
      } else {
        L.toast('API Key와 Database ID를 먼저 입력해주세요 (아래 4단계 가이드 참고)');
        if(!settings.notionApiKey && notionKeyInput) notionKeyInput.focus();
        else if(!settings.notionDatabaseId && notionDbInput) notionDbInput.focus();
      }
    };
    // 잇템 통계 및 안전 관리 (#TASK-ES-179)
    var statsEl = document.getElementById('itemStatsList');
    if(statsEl){
      var myItems = L.state.profile.itItems || [];
      var myItemsHtml = '';
      if(myItems.length){
        myItemsHtml = '<div style="margin-bottom:14px;">' +
          '<div style="font-size:.875rem;font-weight:700;margin-bottom:8px;color:var(--ink);">내가 등록한 잇템 ('+myItems.length+'개)</div>' +
          myItems.map(function(it){
            var isAff = it.isAffiliate || /파트너스|쿠팡|affiliate|제휴/i.test(it.desc || '');
            return '<div class="it-item-card" style="flex-direction:column;align-items:stretch;">' +
              '<div style="display:flex;align-items:center;gap:10px;">' +
                (it.imageUrl ? '<img src="'+it.imageUrl+'" class="it-item-thumb" alt="">' : '<div class="it-item-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1 14H5z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg></div>') +
                '<div style="flex:1;min-width:0;">' +
                  '<div style="display:flex;align-items:center;gap:4px;">' +
                    '<div style="font-weight:700;font-size:.875rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+U.escapeHtml(it.name)+'</div>' +
                    (isAff ? '<span class="dday-pill" style="font-size:.6875rem;background:rgba(108,92,231,0.12);color:var(--brand-strong);font-weight:700;padding:1px 5px;flex-shrink:0;">제휴</span>' : '') +
                  '</div>' +
                  (it.desc ? '<div class="faint" style="font-size:.8125rem;margin-top:2px;">'+U.escapeHtml(it.desc)+'</div>' : '') +
                '</div>' +
                (it.buyUrl ? '<a href="'+U.escapeHtml(it.buyUrl)+'" target="_blank" rel="noopener noreferrer nofollow" class="btn btn-ghost btn-sm" style="font-size:.8125rem;padding:4px 8px;flex:0 0 auto;">구매 링크 ↗</a>' : '') +
              '</div>' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding-top:6px;border-top:1px dashed var(--rule);font-size:.6875rem;color:var(--ink-faint);">' +
                '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">※ 아워골은 상품 판매 당사자가 아닙니다.</span>' +
                '<button class="btn btn-ghost btn-xs btn-report-ititem" data-itname="'+U.escapeHtml(it.name)+'" data-iturl="'+U.escapeHtml(it.buyUrl||'')+'" data-itowner="'+U.escapeHtml((L.state.profile&&L.state.profile.nickname)||'내 잇템')+'" type="button" style="font-size:.6875rem;padding:2px 6px;color:var(--red);border:1px solid rgba(235,87,87,0.3);border-radius:6px;cursor:pointer;flex-shrink:0;margin-left:6px;">🚨 신고</button>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>';
      } else {
        myItemsHtml = '<div style="margin-bottom:12px;padding:10px 12px;background:var(--card2);border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
          '<div style="font-size:.8125rem;color:var(--ink-soft);">아직 등록한 잇템이 없어요.<br>프로필 편집에서 장비·꿀템을 등록해보세요!</div>' +
          '<button class="btn btn-ghost btn-sm" id="setGoProfileBtn" type="button" style="font-size:.8125rem;padding:4px 8px;">등록하기</button>' +
        '</div>';
      }
      statsEl.innerHTML =
        myItemsHtml +
        '<div class="collective-card" style="border-color:var(--rule);background:var(--card2);margin-bottom:12px;padding:12px 14px;border-radius:12px;">' +
          '<div style="font-weight:700;font-size:.875rem;color:var(--ink);margin-bottom:4px;display:flex;align-items:center;gap:6px;"><span>🛡️ 투명한 잇템 추천 가이드</span></div>' +
          '<p class="faint" style="margin:0;font-size:.8125rem;line-height:1.45;">' +
            '아워골은 동료 러너 간의 진정성 있는 장비 추천을 지지합니다. 제휴 링크 등록 시 대가성을 꼭 표기해 주세요. 의심스러운 링크는 각 카드의 [🚨 신고]로 제보하실 수 있습니다.' +
          '</p>' +
        '</div>';

      var goProf = statsEl.querySelector('#setGoProfileBtn');
      if(goProf) goProf.addEventListener('click', L.openProfileEditor);

      statsEl.querySelectorAll('.btn-report-ititem').forEach(function(rb){
        rb.addEventListener('click', function(e){
          e.stopPropagation();
          if(typeof L.openItemReportModal === 'function'){
            L.openItemReportModal({ itemName: rb.dataset.itname, itemUrl: rb.dataset.iturl, itemOwner: rb.dataset.itowner });
          }
        });
      });
    }
  }

  var OurgoalSettingsSubIntegrations = {
    id: 'integrations',
    megaBlockId: 'settings',
    name: '외부 연동·차단·잇템',
    containerId: 'gcalStatusBox',

    /** 실제 렌더(섹션 단위). 인자: settings 객체. renderSettingsScreen 이 순서대로 부른다. */
    render: renderIntegrationsSection,

    /**
     * 소블록 단독 마운트는 그리지 않고 false('그리지 않음')를 돌려준다.
     * 설정 화면은 섹션끼리 settings 객체·호출 순서를 공유하므로 renderSettingsScreen 이 한 번에 그린다 —
     * 메가블록(index.js)은 이 false 를 보고 이전과 같은 경로(setTab 의 renderSettingsScreen)로 넘긴다. (#TASK-ES-353 '실제로 그렸는가' 판정 유지)
     */
    mount: function(container, state, events) {
      this.dispose(events);
      return false;
    },

    /** 이 소블록이 건 구독 해제(#TASK-ES-353 소유자 키). 설정 섹션은 view:sync 로 다시 그리지 않는다(이전과 같음). */
    dispose: function(events) {
      var ev = events || global.OurgoalEvents;
      if (ev && typeof ev.offOwner === 'function') ev.offOwner('settings/integrations');
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalSettingsSubIntegrations;
  }
  global.OurgoalSettingsSubIntegrations = OurgoalSettingsSubIntegrations;
})(typeof window !== 'undefined' ? window : globalThis);
