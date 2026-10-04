/* ============================================================
 * 아워골(OurGoal) — 팀 목표 초대·소통 & 소통탭 전면 정비 모듈
 * #TASK-ES-104 (2026-09-15)
 * 1. 팀 목표 팀장 카카오톡 / 문자(SMS) / 링크 초대 모달
 * 2. 콕찌르기 & 팀원 간 실질적 양방향 대화(팀 톡/채팅) 루프
 * 3. 소통탭 피드창 추천 템플릿 3종 아코디언 컴팩트화
 * 4. 소통탭 공유창 1:1 '외부sns 소통용 카드 제작하기' & 3대 버튼 (피드게시/외부sns공유/이미지 저장)
 * ============================================================ */
(function(global){
  'use strict';

  /* ============ [#TASK-ES-382] 팀 세포 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) ============
     ① 가져오기: js/team-recruit.js · team-share.js(1차) · team-chat.js · team-templates.js · team-dm-inbox.js · team-dm-room.js · team-profile.js · team-companion-search.js · team-companions.js · team-auto-actions.js(2차, #TASK-ES-387) 로 옮긴 함수를 이 스코프에서 같은 이름으로 부른다(함수 선언 끌어올림과 같은 효과 — 이 줄보다 먼저 도는 문이 없다).
     ② 스코프 통로: 옮긴 코드가 읽는 이 스코프의 이름만 OurgoalTeamCommKit.scope 에 getter 로 노출한다(옮긴 코드가 대입하는 상태 변수는 setter 도 — 상태는 이 스코프에 남는다)(목록은 스코프 분석으로 뽑았다). */
  var _teamKit = global.OurgoalTeamCommKit;
  if(!_teamKit && typeof require === 'function'){ require('./team-recruit.js'); require('./team-share.js'); require('./team-chat.js'); require('./team-templates.js'); require('./team-dm-inbox.js'); require('./team-dm-room.js'); require('./team-profile.js'); require('./team-companion-search.js'); require('./team-companions.js'); require('./team-auto-actions.js'); _teamKit = global.OurgoalTeamCommKit; }
  _teamKit = _teamKit || {};
  var openTeamInviteModal = _teamKit.openTeamInviteModal;
  var openScoutToTeamModal = _teamKit.openScoutToTeamModal;
  var postShareCardToFeed = _teamKit.postShareCardToFeed;
  var shareCardExternal = _teamKit.shareCardExternal;
  var saveCardImage = _teamKit.saveCardImage;
  var openFeedShareModal = _teamKit.openFeedShareModal;
  /* [#TASK-ES-387] 2차로 옮긴 함수 — team-chat.js · team-templates.js · team-dm-inbox.js · team-dm-room.js · team-profile.js · team-companion-search.js · team-companions.js · team-auto-actions.js */
  var openTeamChatModal = _teamKit.openTeamChatModal;
  var handlePingSentAutoReply = _teamKit.handlePingSentAutoReply;
  var openTemplatePreviewModal = _teamKit.openTemplatePreviewModal;
  var openRecommendTemplateModal = _teamKit.openRecommendTemplateModal;
  var renderTemplatesAccordionHtml = _teamKit.renderTemplatesAccordionHtml;
  var wireTemplatesAccordionEvents = _teamKit.wireTemplatesAccordionEvents;
  var getDmReadMap = _teamKit.getDmReadMap;
  var markDmRoomRead = _teamKit.markDmRoomRead;
  var markDmThreadAsRead = _teamKit.markDmThreadAsRead;
  var updateDmUnreadBadge = _teamKit.updateDmUnreadBadge;
  var getDmUnreadStatus = _teamKit.getDmUnreadStatus;
  var loadIncomingDmRooms = _teamKit.loadIncomingDmRooms;
  var initIncomingDmListener = _teamKit.initIncomingDmListener;
  var startSmartDmPolling = _teamKit.startSmartDmPolling;
  var formatDmTime = _teamKit.formatDmTime;
  var formatDmDetailTime = _teamKit.formatDmDetailTime;
  var toggleDmMsgDetail = _teamKit.toggleDmMsgDetail;
  var renderSingleDmMsg = _teamKit.renderSingleDmMsg;
  var loadDmMessagesFromDb = _teamKit.loadDmMessagesFromDb;
  var subscribeRealtimeDm = _teamKit.subscribeRealtimeDm;
  var renderCommDM = _teamKit.renderCommDM;
  var openUserProfileModal = _teamKit.openUserProfileModal;
  var copyCompanionInviteLink = _teamKit.copyCompanionInviteLink;
  var renderCommTopInviteSearch = _teamKit.renderCommTopInviteSearch;
  var renderCommCompanions = _teamKit.renderCommCompanions;
  var handle팀목표_Item25Action = _teamKit.handle팀목표_Item25Action;
  var handle소통_Item28Action = _teamKit.handle소통_Item28Action;
  var handle소통_Item30Action = _teamKit.handle소통_Item30Action;
  var handle팀목표_Item37Action = _teamKit.handle팀목표_Item37Action;
  var handle팀목표_Item39Action = _teamKit.handle팀목표_Item39Action;
  Object.defineProperties(_teamKit.scope || (_teamKit.scope = {}), Object.getOwnPropertyDescriptors({
    get DM_READ_PREFIX(){ return DM_READ_PREFIX; },
    get _activeDmChannel(){ return _activeDmChannel; },
    set _activeDmChannel(v){ _activeDmChannel = v; },
    get _hasUnreadDm(){ return _hasUnreadDm; },
    set _hasUnreadDm(v){ _hasUnreadDm = v; },
    get _incomingDmChannel(){ return _incomingDmChannel; },
    set _incomingDmChannel(v){ _incomingDmChannel = v; },
    get _incomingDmLoadedForUser(){ return _incomingDmLoadedForUser; },
    set _incomingDmLoadedForUser(v){ _incomingDmLoadedForUser = v; },
    get _incomingDmRooms(){ return _incomingDmRooms; },
    set _incomingDmRooms(v){ _incomingDmRooms = v; },
    get _lastDmMessageMap(){ return _lastDmMessageMap; },
    get _smartDmPollingTimer(){ return _smartDmPollingTimer; },
    set _smartDmPollingTimer(v){ _smartDmPollingTimer = v; },
    get _unreadPeerMap(){ return _unreadPeerMap; },
    get _userCache(){ return _userCache; },
    get askConfirm(){ return askConfirm; },
    get ensureDefaultCompanions(){ return ensureDefaultCompanions; },
    get esc(){ return esc; },
    get getAppCloneTemplate(){ return getAppCloneTemplate; },
    get getDmPerson(){ return getDmPerson; },
    get getDmThreadId(){ return getDmThreadId; },
    get getTeamMembersPool(){ return getTeamMembersPool; },
    get isKnownAiCompanion(){ return isKnownAiCompanion; },
    get persistCompanions(){ return persistCompanions; },
    get safeAvatarHtml(){ return safeAvatarHtml; },
    get showGuestSoftAuthGate(){ return showGuestSoftAuthGate; },
    get showToast(){ return showToast; },
    get syncCompanionsFromDb(){ return syncCompanionsFromDb; }
  }));

  var _ctx = {};
  /* #TASK-ES-361 (CORE-10): 예전 통로는 init 전에 불리면 자기 자신을 다시 불러(재귀) 오류가 try/catch 에 묻혀 토스트가 안 떴다.
   * 공용 토스트 통로(js/core/toast.js · ui.toast) 하나로 — 주입(_ctx.toast) 우선, 없으면 공용(정본 준비 전이면 대기열). */
  var showToast = ((typeof OurgoalCapabilities !== 'undefined' && OurgoalCapabilities.has('ui.toast.bind')) ? OurgoalCapabilities.request('ui.toast.bind') : typeof require === 'function' ? require('./core/toast.js').bind : function(get){ return function(m){ var o = get(); if(typeof o === 'function') return o(m); }; })(function(){ return _ctx && _ctx.toast; });
  var askConfirm = ((typeof OurgoalCapabilities !== 'undefined' && OurgoalCapabilities.has('ui.confirm.bind')) ? OurgoalCapabilities.request('ui.confirm.bind') : typeof require === 'function' ? require('./core/confirm.js').bind : function(get){ return function(m){ var o = get(); return Promise.resolve(typeof o === 'function' ? o(m) : false); }; })(function(){ return _ctx && _ctx.confirm; });
  function getAppToast(){ return showToast; }
  function getAppOpenModal(){ return _ctx.openModal || global.openModal; }
  function getAppCloseModal(){ return _ctx.closeModal || global.closeModal; }
  function getAppSaveProfile(){ return _ctx.saveProfile || global.saveProfile; }
  function getAppState(){ return (_ctx.getState ? _ctx.getState() : global.state) || {}; }
  function getAppFmtTime(){ return _ctx.fmtTime || global.fmtTime || function(){ return '방금'; }; }
  function getAppNowISO(){ return (_ctx.nowISO ? _ctx.nowISO() : (global.nowISO ? global.nowISO() : new Date().toISOString())); }
  function getAppMockPeople(){ return _ctx.MOCK_PEOPLE || global.MOCK_PEOPLE || []; }
  function getAppCloneTemplate(){ return _ctx.cloneTemplate || global.cloneTemplate || (typeof window !== 'undefined' ? window.cloneTemplate : null); }
  function esc(s){
    if(s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* [#TASK-ES-382] openTeamInviteModal → js/team-recruit.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-387] openTeamChatModal · handlePingSentAutoReply → js/team-chat.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-387] openTemplatePreviewModal · openRecommendTemplateModal · renderTemplatesAccordionHtml · wireTemplatesAccordionEvents → js/team-templates.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-382] postShareCardToFeed · shareCardExternal · saveCardImage → js/team-share.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* ------------------------------------------------------------
  /* ------------------------------------------------------------
   * 5. 실 사용자 계정 상호 연동 1:1 DM 시스템 (헌법 제13조 준수)
   * ------------------------------------------------------------ */
  var _activeDmChannel = null;
  var _incomingDmChannel = null;
  var _incomingDmRooms = [];
  var _incomingDmLoadedForUser = null;
  var _hasUnreadDm = false;
  var _userCache = {};
  var _lastDmMessageMap = {};
  var _unreadPeerMap = {};
  var DM_READ_PREFIX = 'ourgoal_dm_read_';

  /* [#TASK-ES-387] getDmReadMap · markDmRoomRead · markDmThreadAsRead · updateDmUnreadBadge · getDmUnreadStatus · loadIncomingDmRooms · initIncomingDmListener → js/team-dm-inbox.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  var _smartDmPollingTimer = null;
  /* [#TASK-ES-387] startSmartDmPolling → js/team-dm-inbox.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  function showGuestSoftAuthGate(actionName){
    if(global.openModal){
      global.openModal(
        '<div style="text-align:center;padding:16px 10px;">' +
          '<div style="font-size:2.5rem;margin-bottom:8px;">🤝</div>' +
          '<h3>실제 동료와 소통하려면 로그인이 필요해요</h3>' +
          '<p class="faint" style="margin:8px 0 16px;font-size:.875rem;line-height:1.5;">' +
            '1:1 다이렉트 메시지 전송 및 동반자 맺기는 실제 사용자 계정 간의 안전한 상호 연결을 위해 로그인이 필요합니다.' +
          '</p>' +
          '<div class="modal-actions">' +
            '<button class="btn btn-ghost" id="guestGateCloseBtn" type="button">둘러보기 계속</button>' +
            '<button class="btn btn-primary" id="guestGateLoginBtn" type="button" style="font-weight:700;">로그인하러 가기</button>' +
          '</div>' +
        '</div>',
        function(sheet){
          var c = sheet.querySelector('#guestGateCloseBtn');
          if(c) c.onclick = global.closeModal;
          var l = sheet.querySelector('#guestGateLoginBtn');
          if(l) l.onclick = function(){
            if(global.closeModal) global.closeModal();
            if(global.renderAuthScreen) global.renderAuthScreen();
          };
        }
      );
    } else {
      alert('실제 동료와 소통하려면 로그인이 필요합니다.');
    }
  }

  function getDmThreadId(myId, peerId){
    var a = String(myId || 'guest');
    var b = String(peerId || 'unknown');
    return 'dm_' + (a < b ? a + '_' + b : b + '_' + a);
  }

  function getTeamMembersPool(){
    // 실제 연결된 팀원 및 동료 풀 (AI 봇 전면 배제)
    var state = global.state || {};
    var pool = [];
    var myId = (state.user && state.user.id) || (state.profile && state.profile.id);

    // 1. 실제 동반자 중 실 유저
    var comps = (state.profile && state.profile.companions) || [];
    comps.forEach(function(c){
      if(!isKnownAiCompanion(c) && String(c.id || '') !== String(myId)){
        if(!pool.some(function(x){ return String(x.id) === String(c.id); })){
          pool.push({
            id: c.id,
            name: c.name || c.nickname || '동료',
            nickname: c.nickname || c.name || '동료',
            avatar: c.avatar || '👤',
            groupName: c.groupName || '동반자',
            role: c.role || '팀원',
            isAiBot: false
          });
        }
      }
    });

    // 2. 수신된 실 유저 대화방
    (_incomingDmRooms || []).forEach(function(inc){
      if(!isKnownAiCompanion(inc) && String(inc.id || '') !== String(myId)){
        if(!pool.some(function(x){ return String(x.id) === String(inc.id); })){
          pool.push({
            id: inc.id,
            name: inc.name || inc.nickname || '동료',
            nickname: inc.nickname || inc.name || '동료',
            avatar: inc.avatar || '👤',
            groupName: inc.groupName || '대화 상대',
            role: inc.role || '팀원',
            isAiBot: false
          });
        }
      }
    });

    // 3. 참여 중인 팀 목표의 실제 멤버 (존재할 경우)
    var joinedGroups = (state.groups || []).concat(state.profile && state.profile.joinedGroups || []);
    joinedGroups.forEach(function(grp){
      if(grp && Array.isArray(grp.membersList)){
        grp.membersList.forEach(function(mem){
          if(mem && !isKnownAiCompanion(mem) && String(mem.id || '') !== String(myId)){
            if(!pool.some(function(x){ return String(x.id) === String(mem.id); })){
              pool.push({
                id: mem.id,
                name: mem.name || mem.nickname || '동료',
                nickname: mem.nickname || mem.name || '동료',
                avatar: mem.avatar || '👤',
                groupName: grp.name || '팀',
                role: mem.role || '팀원',
                isAiBot: false
              });
            }
          }
        });
      }
    });

    return pool;
  }

  function getDmPerson(id){
    var comps = (global.state && global.state.profile && global.state.profile.companions) || [];
    var c = comps.find(function(x){ return x.id === id; });
    if(c) return c;

    var inc = _incomingDmRooms.find(function(x){ return x.id === id; });
    if(inc) return inc;

    if(_userCache[id]) return _userCache[id];

    var teamMembers = getTeamMembersPool();
    var tm = teamMembers.find(function(x){ return x.id === id; });
    if(tm) return tm;

    var mockPeople = global.MOCK_PEOPLE || [];
    var p = mockPeople.find(function(x){ return x.id === id; });
    if(p) return p;

    return { id: id, nickname: '사용자', name: '사용자', avatar: '👤', intro: '아워골 회원' };
  }

  /* [#TASK-ES-387] formatDmTime · formatDmDetailTime · toggleDmMsgDetail → js/team-dm-room.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  if(typeof window !== 'undefined'){
    window.toggleDmMsgDetail = toggleDmMsgDetail;
  }

  /* [#TASK-ES-387] renderSingleDmMsg · loadDmMessagesFromDb · subscribeRealtimeDm · renderCommDM → js/team-dm-room.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* ------------------------------------------------------------
   * 6. 동반자(친구·팔로우) 실제 회원 연동 시스템 (헌법 제19조 준수)
   * ------------------------------------------------------------ */
  /* [#TASK-ES-348] AI 판별은 이름이 아니라 표식으로 한다. 실명형 이름(민지·도현·수아 등)으로 판별하면 같은 닉네임의 실제 회원이 AI 로 빠진다.
   * 표식: is_ai·botBadge(서버/시드 데이터) · 시드 id 접두(comp_·mem_·mock_·bot_·ai_·mn_·sim_·guest) · 오프라인 예시 id · isAiBot(인증 UUID 가 아닐 때만).
   * 인증 UUID 계정의 isAiBot 은 예전 이름 판별이 남긴 값일 수 있어 믿지 않는다. 페르소나 핸들은 정확 일치 AND 인증 UUID 아님일 때만 AI. */
  var AI_ID_PREFIXES = ['comp_', 'mem_', 'mock_', 'bot_', 'ai_', 'mn_', 'sim_', 'guest'];
  var LOCAL_SAMPLE_USER_IDS = ['user-runner-sm', 'user-early-reader', 'user-clean-coder', 'user-minji-runner', 'user-dohyun-dev', 'user-sua-god'];
  var KNOWN_AI_BOT_NAMES = ['새벽러너_민지', '코드장인_도현', '갓생사는_수아', '지수_TF장', '민우_운영조', '소연_레크조', '현아_드라이브', '준호_맛집탐험', '성진_헤드코치', '태양_와드러버'];
  function isAuthUuid(id){ return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || '').trim()); }
  function hasAiIdMarker(id){
    var s = String(id || '').trim().toLowerCase();
    if(!s) return false;
    return LOCAL_SAMPLE_USER_IDS.indexOf(s) !== -1 || AI_ID_PREFIXES.some(function(p){ return s.indexOf(p) === 0; });
  }

  function isKnownAiCompanion(userOrId){
    if(!userOrId) return false;
    if(typeof userOrId === 'string'){
      var s = userOrId.trim().toLowerCase();
      if(s.indexOf('mn_') === 0 || s.indexOf('guest') === 0) return true;
      return hasAiIdMarker(s);
    }
    if(userOrId.is_ai === true || userOrId.botBadge) return true;
    if(hasAiIdMarker(userOrId.id)) return true;
    if(isAuthUuid(userOrId.id)) return false;
    if(userOrId.isAiBot === true) return true;
    return KNOWN_AI_BOT_NAMES.indexOf(String(userOrId.nickname || userOrId.name || '').trim()) !== -1;
  }

  function safeAvatarHtml(avatar, size){
    size = size || 36;
    if(!avatar || typeof avatar !== 'string') return '👤';
    var trimmed = avatar.trim();
    if(trimmed.indexOf('http://') === 0 || trimmed.indexOf('https://') === 0 || trimmed.indexOf('data:image/') === 0 || trimmed.indexOf('/') === 0){
      return '<img src="' + esc(trimmed) + '" alt="아바타" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" onerror="this.onerror=null;this.parentElement.textContent=\'👤\';">';
    }
    if(trimmed.indexOf('<svg') >= 0){
      return trimmed;
    }
    return esc(trimmed);
  }

  var COMPANIONS_STORAGE_PREFIX = 'ourgoal_companions_backup_';
  function storageCopyOf(list){ return global.OurgoalDmLedger ? global.OurgoalDmLedger.storageCopy(list) : list; }

  function getCompanionsStorageKey(){
    var state = global.state || {};
    var uid = (state.profile && state.profile.id) ? String(state.profile.id).trim() : 'guest';
    return COMPANIONS_STORAGE_PREFIX + uid;
  }

  function ensureDefaultCompanions(){
    var state = global.state || {};
    if(!state.profile) return [];

    // 1. 메모리에 유효한 배열이 있고 비어있지 않으면 그대로 사용
    if(Array.isArray(state.profile.companions) && state.profile.companions.length > 0){
      return state.profile.companions;
    }

    // 2. 메모리가 비어있거나 초기화된 경우: localStorage 백업에서 즉시 0ms 자가 복원
    var restored = [];
    try {
      var key = getCompanionsStorageKey();
      var raw = localStorage.getItem(key);
      if(raw){
        var parsed = JSON.parse(raw);
        if(Array.isArray(parsed) && parsed.length > 0){
          restored = parsed;
        }
      }
      // #TASK-ES-366: 자기 uid 키만 읽는다 — 예전엔 비면 다른 계정의 ourgoal_companions_backup_* 를 훑어 가져왔다(계정 간 유출)
    } catch(e){}

    if(restored && restored.length > 0){
      state.profile.companions = restored;
      return state.profile.companions;
    }

    // 3. [#TASK-ES-172] 상민님 지시 [37]: 동반자 탭에서 AI 동반자 전면 제거 (실 사용자 중심 전환)
    if(!state.profile.companions || !Array.isArray(state.profile.companions)){
      state.profile.companions = [];
    } else {
      state.profile.companions = state.profile.companions.filter(function(c){
        return !isKnownAiCompanion(c) && String(c.id || '').indexOf('comp_') !== 0;
      });
    }

    return state.profile.companions;
  }

  var _companionsDbSynced = false;
  // #TASK-ES-129: 동반자 목록 영구 영속화 (localStorage 즉시 복원 + /api/track 서버리스 원장 동기화)
  function syncCompanionsFromDb(body){
    var state = global.state || {};
    if(_companionsDbSynced || !state.profile || !state.profile.id) return;
    if(String(state.profile.id).indexOf('guest') === 0) return;
    _companionsDbSynced = true;
    try { initIncomingDmListener(state.profile.id); } catch(e){}

    // 1단계: 로컬스토리지 자가 치유 복원
    ensureDefaultCompanions();

    // 2단계: /api/track 서버리스 원장 비동기 조회 및 병합
    if(global.OurgoalDmLedger){
      // #TASK-ES-366: 본인 토큰을 붙여야 서버가 동반자를 돌려준다(토큰 없이 보내면 401 → 다른 기기에서 목록이 비었다)
      global.OurgoalDmLedger.trackPost({ action: 'sync_companions', userId: state.profile.id }).then(function(res){
        if(res && res.ok) return res.json();
        return null;
      }).then(function(data){
        if(data && data.ok && Array.isArray(data.companions) && data.companions.length){
          var comps = ensureDefaultCompanions();
          var addedAny = false;
          data.companions.forEach(function(c){
            if(c && c.id){
              var cId = String(c.id).trim().toLowerCase();
              var exists = comps.some(function(x){ return String(x.id || '').trim().toLowerCase() === cId; });
              if(!exists){
                comps.push(c);
                addedAny = true;
              }
            }
          });
          if(addedAny){
            try {
              localStorage.setItem(getCompanionsStorageKey(), JSON.stringify(storageCopyOf(comps)));
            } catch(e){}
            if(body) renderCommCompanions(body);
          }
        }
      }).catch(function(err){
        console.warn('[동반자] 서버리스 동기화 예외(로컬 보존 유지):', err);
      });
    }

    // 3단계: Supabase 레거시 users.companions 컬럼 조회 시도 (존재 시 호환)
    if(global.sb){
      global.sb.from('users').select('companions').eq('id', state.profile.id).maybeSingle().then(function(res){
        if(res && res.data && Array.isArray(res.data.companions) && res.data.companions.length){
          var comps = ensureDefaultCompanions();
          var addedAny = false;
          res.data.companions.forEach(function(c){
            if(c && c.id){
              var cId = String(c.id).trim().toLowerCase();
              if(!comps.some(function(x){ return String(x.id || '').trim().toLowerCase() === cId; })){
                comps.push(c);
                addedAny = true;
              }
            }
          });
          if(addedAny){
            try { localStorage.setItem(getCompanionsStorageKey(), JSON.stringify(storageCopyOf(comps))); } catch(e){}
            if(body) renderCommCompanions(body);
          }
        }
      }).catch(function(){});
    }
  }

  function persistCompanions(customList){
    var state = global.state || {};
    if(!state.profile || !state.profile.id) return;
    var uid = state.profile.id;
    var list = (Array.isArray(customList) && customList.length) ? customList : ((state.profile && state.profile.companions) || []);
    // #TASK-ES-366: 대화 흔적(_thread·_loadedThreadFromDb·lastMsg)은 사본(localStorage·서버 events 원장)에 넣지 않는다
    list = storageCopyOf(list);

    // 1순위: localStorage 0ms 동기식 영구 저장 (새로고침 시 100% 무손실 복구)
    try {
      localStorage.setItem(getCompanionsStorageKey(), JSON.stringify(list));
      localStorage.setItem(COMPANIONS_STORAGE_PREFIX + uid, JSON.stringify(list));
    } catch(e){
      console.warn('[동반자] localStorage 백업 오류:', e);
    }

    if(String(uid).indexOf('guest') === 0) return;

    // 2순위: /api/track 서버리스 파이프라인 (events 원장 영구 저장)
    if(global.OurgoalDmLedger){
      global.OurgoalDmLedger.trackPost({ action: 'sync_companions', userId: uid, companions: list })
        .catch(function(err){ console.warn('[동반자] /api/track 서버 저장 실패:', err); });
    }

    // 3순위: Supabase users.companions 컬럼 업데이트 시도 (PostgrestFilterBuilder 호환)
    if(global.sb){
      try {
        var queryBuilder = global.sb.from('users').update({ companions: list }).eq('id', uid);
        if(queryBuilder && typeof queryBuilder.then === 'function'){
          queryBuilder.then(function(){}, function(err){
            console.warn('[동반자] Supabase 컬럼 업데이트 건너뜀:', err);
          });
        }
      } catch(sbErr){
        console.warn('[동반자] Supabase 컬럼 업데이트 예외(무시):', sbErr);
      }
    }
  }

  /* [#TASK-ES-387] openUserProfileModal · copyCompanionInviteLink → js/team-profile.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  global.copyCompanionInviteLink = copyCompanionInviteLink;

  /* [#TASK-ES-387] renderCommTopInviteSearch → js/team-companion-search.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-387] renderCommCompanions → js/team-companions.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-382] openFeedShareModal → js/team-share.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-382] openScoutToTeamModal → js/team-recruit.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* ------------------------------------------------------------
   * 모듈 전역 노출
   * ------------------------------------------------------------ */
  global.OurgoalTeamInviteComm = {
    init: function(ctx){
      _ctx = ctx || {};
      try {
        var state = global.state || (_ctx.getState ? _ctx.getState() : {});
        var myId = (state.user && state.user.id) || (state.profile && state.profile.id);
        if(myId && String(myId).indexOf('guest') !== 0){
          initIncomingDmListener(myId);
        }
      } catch(e){}
    },
    openTeamInviteModal: openTeamInviteModal,
    openTeamChatModal: openTeamChatModal,
    handlePingSentAutoReply: handlePingSentAutoReply,
    renderTemplatesAccordionHtml: renderTemplatesAccordionHtml,
    openTemplatePreviewModal: openTemplatePreviewModal,
    wireTemplatesAccordionEvents: wireTemplatesAccordionEvents,
    postShareCardToFeed: postShareCardToFeed,
    shareCardExternal: shareCardExternal,
    saveCardImage: saveCardImage,
    getTeamMembersPool: getTeamMembersPool,
    isKnownAiCompanion: isKnownAiCompanion,
    getDmPerson: getDmPerson,
    renderCommDM: renderCommDM,
    openUserProfileModal: openUserProfileModal,
    openFeedShareModal: openFeedShareModal,
    openScoutToTeamModal: openScoutToTeamModal,
    renderCommCompanions: renderCommCompanions,
    renderCommTopInviteSearch: renderCommTopInviteSearch,
    copyCompanionInviteLink: copyCompanionInviteLink,
    ensureDefaultCompanions: ensureDefaultCompanions,
    getDmThreadId: getDmThreadId,
    loadDmMessagesFromDb: loadDmMessagesFromDb,
    loadIncomingDmRooms: loadIncomingDmRooms,
    initIncomingDmListener: initIncomingDmListener,
    updateDmUnreadBadge: updateDmUnreadBadge,
    getDmUnreadStatus: getDmUnreadStatus,
    showGuestSoftAuthGate: showGuestSoftAuthGate,
    persistCompanions: persistCompanions,
    markDmRoomRead: markDmRoomRead,
    markDmThreadAsRead: markDmThreadAsRead,
    formatDmDetailTime: formatDmDetailTime,
    renderSingleDmMsg: renderSingleDmMsg,
    getDmReadMap: getDmReadMap,
    _lastDmMessageMap: _lastDmMessageMap,
    _unreadPeerMap: _unreadPeerMap,
    ALL_SEARCHABLE_USERS: []
  };

  /* [#TASK-ES-387] handle팀목표_Item25Action → js/team-auto-actions.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  global.OurgoalTeamInviteComm.handle팀목표_Item25Action = handle팀목표_Item25Action;

  if(typeof window !== 'undefined'){
    window.handle팀목표_Item25Action = handle팀목표_Item25Action;
  }
  if(typeof module !== 'undefined' && module.exports){
    module.exports = global.OurgoalTeamInviteComm;
    module.exports.handle팀목표_Item25Action = handle팀목표_Item25Action;
  }
  global.handle팀목표_Item25Action = handle팀목표_Item25Action;

  /* [#TASK-ES-387] handle소통_Item28Action → js/team-auto-actions.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  global.OurgoalTeamInviteComm.handle소통_Item28Action = handle소통_Item28Action;

  if(typeof window !== 'undefined'){
    window.handle소통_Item28Action = handle소통_Item28Action;
  }
  if(typeof module !== 'undefined' && module.exports){
    module.exports = global.OurgoalTeamInviteComm;
    module.exports.handle소통_Item28Action = handle소통_Item28Action;
  }
  global.handle소통_Item28Action = handle소통_Item28Action;

  /* [#TASK-ES-387] handle소통_Item30Action → js/team-auto-actions.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  global.OurgoalTeamInviteComm.handle소통_Item30Action = handle소통_Item30Action;

  if(typeof window !== 'undefined'){
    window.handle소통_Item30Action = handle소통_Item30Action;
  }
  if(typeof module !== 'undefined' && module.exports){
    module.exports = global.OurgoalTeamInviteComm;
    module.exports.handle소통_Item30Action = handle소통_Item30Action;
  }
  global.handle소통_Item30Action = handle소통_Item30Action;

  /* [#TASK-ES-387] handle팀목표_Item37Action → js/team-auto-actions.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  global.OurgoalTeamInviteComm.handle팀목표_Item37Action = handle팀목표_Item37Action;

  if(typeof window !== 'undefined'){
    window.handle팀목표_Item37Action = handle팀목표_Item37Action;
  }
  if(typeof module !== 'undefined' && module.exports){
    module.exports.handle팀목표_Item37Action = handle팀목표_Item37Action;
  }
  global.handle팀목표_Item37Action = handle팀목표_Item37Action;

  /* [#TASK-ES-387] handle팀목표_Item39Action → js/team-auto-actions.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  global.OurgoalTeamInviteComm.handle팀목표_Item39Action = handle팀목표_Item39Action;

  if(typeof window !== 'undefined'){
    window.handle팀목표_Item39Action = handle팀목표_Item39Action;
  }
  if(typeof module !== 'undefined' && module.exports){
    module.exports.handle팀목표_Item39Action = handle팀목표_Item39Action;
  }
  global.handle팀목표_Item39Action = handle팀목표_Item39Action;

})(typeof window !== 'undefined' ? window : global);

