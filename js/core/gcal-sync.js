/**
 * OurGoal Google Calendar Sync (기관 — 구글 캘린더 연결·토큰·가져오기·내보내기)
 *
 * 구글 캘린더 클라이언트 id·연결 상태·연결 창·일정 읽기·전체 보내기·토큰 저장/복원/상태·토큰 받기·가져오기/내보내기 창.
 * 같은 구획 주석 아래(휴지통 묶음)에 있던 것을 책임 단위로 나눴다. 토큰 클라이언트 상태 변수(googleTokenClient)와 window 노출 문은 원래 자리, 캘린더 사용 가능(calendarAvailable)은 smoke 시험지 FN_NAMES 라, 토큰 저장(saveGoogleToken)은 함수 최상위 arguments 를 써서(헌법 CELL_SPLIT 5) 남겼다.
 * #TASK-ES-482(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 6729~6733 · 6734~6763 · 6764~6787 · 6788~6823 · 6824~6872 · 6873~6928 · 6929~6933 · 6959~6985 · 6986~6991 · 7000~7013 · 7014~7049 · 7050~7067 · 7068~7131 · 7132~7190줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalUiHelpers = global.OurgoalUiHelpers || {};

  /* ---- 이전 전 index.html 6729~6733줄(#TASK-ES-482 생성기 표지) ---- */
  function effectiveGcalClientId(){
    var app = (L.GOOGLE_OAUTH_CLIENT_ID || '').trim();
    if(app) return app;
    return ((L.state.profile && L.state.profile.settings && L.state.profile.settings.gcalClientId) || '').trim();
  }
  /* ---- 이전 전 index.html 6734~6763줄(#TASK-ES-482 생성기 표지) ---- */
  function isGoogleCalendarConnected(){
    var s = (L.state.profile && L.state.profile.settings) || {};
    if(s.googleCalendarConnected) return true;
    // [#TASK-ES-345 CAL-02] 현재 uid 의 설정·토큰 키만 본다(게스트 설정·이메일 _last·_last 토큰 폴백 제거).
    var uid = L.gcalCurrentUid();
    try {
      var rawSet = localStorage.getItem('ourgoal_settings_' + uid);
      if(rawSet){
        var ps = JSON.parse(rawSet);
        if(ps && ps.googleCalendarConnected){
          if(L.state.profile && L.state.profile.settings){
            L.state.profile.settings.googleCalendarConnected = true;
            if(ps.googleCalendarEmail && !L.state.profile.settings.googleCalendarEmail) L.state.profile.settings.googleCalendarEmail = ps.googleCalendarEmail;
          }
          return true;
        }
      }
      var ownTok = localStorage.getItem('ourgoal_gcal_token_v1_' + uid);
      if(ownTok){
        if(L.state.profile && L.state.profile.settings) L.state.profile.settings.googleCalendarConnected = true;
        return true;
      }
    } catch(e){}
    if(!L.state.googleToken && typeof restoreGoogleToken === 'function') restoreGoogleToken();
    if(L.state.googleToken) {
      if(L.state.profile && L.state.profile.settings) L.state.profile.settings.googleCalendarConnected = true;
      return true;
    }
    return false;
  }
  /* ---- 이전 전 index.html 6764~6787줄(#TASK-ES-482 생성기 표지) ---- */
  async function tryConnectGoogleCalendar(){
    L.toast('구글 계정 연동 요청 중…');
    try{
      var token = await requestGoogleToken();
      if(!token) throw new Error('no token');
      L.state.profile.settings.googleCalendarConnected = true;
      try{
        var uRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers:{ Authorization: 'Bearer ' + token } });
        if(uRes.ok){
          var uData = await uRes.json();
          if(uData && uData.email) L.state.profile.settings.googleCalendarEmail = uData.email;
        }
      } catch(e){}
      if(!L.state.profile.settings.googleCalendarEmail) L.state.profile.settings.googleCalendarEmail = '연동 완료';
      if(typeof L.saveGoogleToken === 'function') L.saveGoogleToken(L.state.googleToken, L.state.profile.settings.googleCalendarEmail);
      await L.saveProfile();
      L.toast('구글 캘린더가 연동되었습니다 · 상호 동기화 중…');
      try { await syncAllToGoogleCalendar(); } catch(e){}
      if(L.state.activeTab==='calendar') L.renderCalendarScreen();
      else if(L.state.activeTab==='settings') L.renderSettingsScreen();
    } catch(err){
      L.toast('구글 캘린더 연동에 실패했어요 · 설정을 확인해주세요');
    }
  }
  /* ---- 이전 전 index.html 6788~6823줄(#TASK-ES-482 생성기 표지) ---- */
  function openGoogleCalendarConnectModal(){
    var clientId = effectiveGcalClientId();
    if(!clientId){
      L.openModal(
        '<h3>구글 캘린더 연동 설정</h3>' +
        '<p class="faint" style="margin:-8px 0 14px;">구글 캘린더와 실시간 동기화하여 목표와 일정을 한곳에서 관리하세요.</p>' +
        '<div class="field">' +
          '<label>Google OAuth 클라이언트 ID</label>' +
          '<input id="gcalPromptClientId" type="text" placeholder="예: xxxxxxxx.apps.googleusercontent.com" value="'+L.escapeHtml((L.state.profile.settings&&L.state.profile.settings.gcalClientId)||'')+'">' +
        '</div>' +
        '<p class="faint" style="font-size:.8125rem;">Google Cloud Console에서 발급한 웹 클라이언트 ID를 입력해주세요.</p>' +
        '<div style="display:flex;gap:6px;margin:10px 0 14px;">' +
          '<a href="https://calendar.google.com" target="_blank" rel="noopener" class="btn btn-ghost btn-sm" style="flex:1;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:4px;font-size:.8125rem;padding:6px 8px;">구글 캘린더 열기 ↗</a>' +
          '<a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" class="btn btn-ghost btn-sm" style="flex:1;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:4px;font-size:.8125rem;padding:6px 8px;">GCP 콘솔 바로가기 ↗</a>' +
        '</div>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-ghost" id="gcalPromptCancel" type="button">취소</button>' +
          '<button class="btn btn-primary" id="gcalPromptSave" type="button">저장 및 연결</button>' +
        '</div>',
        function(sheet){
          sheet.querySelector('#gcalPromptCancel').onclick = L.closeModal;
          sheet.querySelector('#gcalPromptSave').onclick = async function(){
            var val = (sheet.querySelector('#gcalPromptClientId').value || '').trim();
            if(!val){ L.toast('클라이언트 ID를 입력해주세요'); return; }
            L.state.profile.settings.gcalClientId = val;
            L.googleTokenClient = null;
            await L.saveProfile();
            L.closeModal();
            tryConnectGoogleCalendar();
          };
        }
      );
    } else {
      tryConnectGoogleCalendar();
    }
  }
  /* ---- 이전 전 index.html 6824~6872줄(#TASK-ES-482 생성기 표지) ---- */
  async function fetchGoogleCalendarEvents(token){
    if(!token){
      try{ token = await getGoogleAccessToken(); } catch(e){ return []; }
    }
    if(!token) return [];
    var now = new Date();
    var timeMin = new Date(now.getFullYear(), now.getMonth()-2, 1).toISOString();
    var timeMax = new Date(now.getFullYear(), now.getMonth()+6, 0).toISOString();
    var url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin='+encodeURIComponent(timeMin)+
      '&timeMax='+encodeURIComponent(timeMax)+'&singleEvents=true&orderBy=startTime&maxResults=250';
    try{
      var res = await fetch(url, { headers:{ Authorization:'Bearer '+token } });
      if(!res.ok) return [];
      var data = await res.json();
      var sync = (L.state.profile && L.state.profile.settings && L.state.profile.settings.gcalSync) || { goals:{}, ms:{}, tasks:{}, custom:{} };
      var ourEvIds = {};
      if(sync.goals) Object.values(sync.goals).forEach(function(id){ ourEvIds[id]=true; });
      if(sync.ms) Object.values(sync.ms).forEach(function(id){ ourEvIds[id]=true; });
      if(sync.tasks) Object.values(sync.tasks).forEach(function(id){ ourEvIds[id]=true; });
      if(sync.custom) Object.values(sync.custom).forEach(function(id){ ourEvIds[id]=true; });
      var doneMap = (L.state.profile && L.state.profile.settings && L.state.profile.settings.gcalDoneEvents) || {};
      var prevCache = L.state.gcalEventsCache || [];
      prevCache.forEach(function(pe){ if(pe.id && pe.done) doneMap[pe.id] = true; });
      var events = (data.items||[]).filter(function(e){
        if(e.status === 'cancelled') return false;
        if(ourEvIds[e.id]) return false;
        return !!(e.start && (e.start.date || e.start.dateTime));
      }).map(function(e){
        var dStr = e.start.date || (e.start.dateTime ? e.start.dateTime.slice(0,10) : '');
        var dtStr = e.start.dateTime ? L.toDateTimeLocalValue(e.start.dateTime) : (dStr + 'T09:00');
        return {
          id: e.id,
          title: e.summary || '(제목 없음)',
          date: e.start.dateTime ? dtStr : dStr,
          dayKey: dStr,
          kind: 'gcal',
          goalTitle: e.description || '구글 캘린더',
          htmlLink: e.htmlLink || 'https://calendar.google.com',
          done: !!doneMap[e.id]
        };
      });
      L.state.gcalEventsCache = events;
      try{ localStorage.setItem(L.gcalEventsKey(), JSON.stringify(events)); } catch(e){}
      return events;
    } catch(e){
      console.warn('구글 캘린더 일정 조회 실패:', e);
      return [];
    }
  }
  /* ---- 이전 전 index.html 6873~6928줄(#TASK-ES-482 생성기 표지) ---- */
  async function syncAllToGoogleCalendar(interactive){
    if(!isGoogleCalendarConnected()){
      if(interactive) openGoogleCalendarConnectModal();
      return;
    }
    var token = await getGoogleAccessToken(interactive);
    if(!token){
      if(interactive) L.toast('구글 인증이 필요해요 · [지금 동기화]를 눌러주세요');
      return;
    }
    if(interactive) L.toast('구글 캘린더 상호 동기화 중…');
    try{
      var count = 0;
      var sync = L.state.profile.settings.gcalSync = L.state.profile.settings.gcalSync || { goals:{}, ms:{}, tasks:{}, imported:{} };
      var goals = L.state.profile.goals.filter(function(g){ return !g.archivedAt; });
      for(var i=0; i<goals.length; i++){
        var g = goals[i];
        if(g.dueDate){
          var evId = await L.pushCalendarEvent(token, '' + g.title, g.dueDate, sync.goals[g.id]);
          if(evId){ sync.goals[g.id] = evId; count++; }
        }
        var mss = g.milestones || [];
        for(var j=0; j<mss.length; j++){
          var m = mss[j];
          if(m.dueDate && m.status !== 'done'){
            var evIdM = await L.pushCalendarEvent(token, '· ' + m.title + ' (' + g.title + ')', m.dueDate, (sync.ms && sync.ms[m.id]));
            if(evIdM){ sync.ms = sync.ms || {}; sync.ms[m.id] = evIdM; count++; }
          }
          var tks = m.tasks || [];
          for(var k=0; k<tks.length; k++){
            var t = tks[k];
            if(t.dueDate && !t.done){
              var evIdT = await L.pushCalendarEvent(token, '- ' + t.title + ' (' + m.title + ')', t.dueDate, (sync.tasks && sync.tasks[t.id]));
              if(evIdT){ sync.tasks = sync.tasks || {}; sync.tasks[t.id] = evIdT; count++; }
            }
          }
        }
      }
      var customSchedules = L.state.profile.settings.customSchedules || [];
      sync.custom = sync.custom || {};
      for(var c=0; c<customSchedules.length; c++){
        var cs = customSchedules[c];
        if(cs.date && !cs.done){
          var evIdC = await L.pushCalendarEvent(token, '' + cs.title, cs.date, sync.custom[cs.id]);
          if(evIdC){ sync.custom[cs.id] = evIdC; count++; }
        }
      }
      await L.saveProfile();
      var gEvents = await fetchGoogleCalendarEvents(token);
      L.toast('구글 캘린더와 상호 동기화 완료 (내 일정 ' + count + '개 반영 · 구글 ' + gEvents.length + '개 공유)');
      if(L.state.activeTab==='calendar') L.renderCalendarScreen();
      else if(L.state.activeTab==='settings') L.renderSettingsScreen();
    } catch(err){
      L.toast('동기화에 실패했어요 · 다시 시도해주세요');
    }
  }
  /* ---- 이전 전 index.html 6929~6933줄(#TASK-ES-482 생성기 표지) ---- */
  function nextDayISO(dateStr){
    var d = new Date(dateStr+'T00:00:00');
    d.setDate(d.getDate()+1);
    return d.getFullYear()+'-'+L.pad(d.getMonth()+1)+'-'+L.pad(d.getDate());
  }

  /* ---- 이전 전 index.html 6959~6985줄(#TASK-ES-482 생성기 표지) ---- */
  function restoreGoogleToken(){
    try {
      // [#TASK-ES-345 CAL-02] 현재 로그인 uid 키만 읽는다. _last 키 폴백과 "아무 ourgoal_gcal_token_v1_* 키" 탐색은
      // 같은 기기의 다른 계정 토큰으로 그 계정의 일정을 읽게 만들던 결함이라 제거했다.
      var uid = L.ensureGcalOwner();
      L.purgeLegacySharedGcalKeys();
      if(L.state.googleToken && L.state.googleToken.expiresAt > Date.now()) return L.state.googleToken;
      var raw = localStorage.getItem('ourgoal_gcal_token_v1_' + uid);
      if(!raw) return L.state.googleToken || null;
      var parsed = JSON.parse(raw);
      // 저장 당시 주인이 기록돼 있는데 현재 uid 와 다르면(키가 손으로 옮겨진 경우 등) 쓰지 않는다.
      if(parsed && parsed.ownerUid && parsed.ownerUid !== uid) return L.state.googleToken || null;
      if(parsed && parsed.accessToken){
        L.state.googleToken = parsed;
        if(parsed.expiresAt <= Date.now()){
          parsed.isExpired = true;
          L.state._lastExpiredGoogleToken = parsed;
        }
        if(parsed.email && L.state.profile && L.state.profile.settings){
          L.state.profile.settings.googleCalendarConnected = true;
          if(!L.state.profile.settings.googleCalendarEmail) L.state.profile.settings.googleCalendarEmail = parsed.email;
        }
        return parsed;
      }
    } catch(e){}
    return L.state.googleToken || null;
  }
  /* ---- 이전 전 index.html 6986~6991줄(#TASK-ES-482 생성기 표지) ---- */
  // [#TASK-ES-345 CAL-02] 현재 계정 토큰 상태: 'valid' | 'expired' | 'missing'. 연동돼 있는데 valid 가 아니면 '다시 연결' 안내를 띄운다.
  function gcalTokenStatus(){
    var tok = restoreGoogleToken();
    if(!tok || !tok.accessToken) return 'missing';
    return tok.expiresAt > Date.now() ? 'valid' : 'expired';
  }

  /* ---- 이전 전 index.html 7000~7013줄(#TASK-ES-482 생성기 표지) ---- */
  function ensureGoogleTokenClient(){
    var clientId = effectiveGcalClientId();
    if(!clientId){ L.toast('먼저 Google OAuth 클라이언트 ID를 입력해주세요'); return null; }
    if(!window.google || !google.accounts || !google.accounts.oauth2){ L.toast('구글 로그인 스크립트를 불러오는 중이에요, 잠시 후 다시 시도해주세요'); return null; }
    if(!L.googleTokenClient || L.googleTokenClient.__clientId !== clientId){
      L.googleTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
        callback: function(){}
      });
      L.googleTokenClient.__clientId = clientId;
    }
    return L.googleTokenClient;
  }
  /* ---- 이전 전 index.html 7014~7049줄(#TASK-ES-482 생성기 표지) ---- */
  function requestGoogleToken(options){
    var opts = options || {};
    return new Promise(function(resolve, reject){
      var client = ensureGoogleTokenClient();
      if(!client){
        if(opts.silent) resolve(null);
        else reject(new Error('no client'));
        return;
      }
      client.callback = function(resp){
        if(!resp || resp.error){
          if(opts.silent){
            resolve(null);
            return;
          }
          reject(new Error(resp && resp.error || '인증 실패'));
          return;
        }
        L.state.googleToken = { accessToken: resp.access_token, expiresAt: Date.now() + ((resp.expires_in||3300)*1000) };
        var gEmail = (L.state.profile && L.state.profile.settings && L.state.profile.settings.googleCalendarEmail) || '';
        L.saveGoogleToken(L.state.googleToken, gEmail);
        resolve(resp.access_token);
      };
      var hasSavedToken = !!restoreGoogleToken();
      var isConnected = isGoogleCalendarConnected();
      var reqOpts = { prompt: (L.state.googleToken || hasSavedToken || isConnected) ? '' : 'consent' };
      if(opts.silent) reqOpts.prompt = '';
      var gEmail = (L.state.profile && L.state.profile.settings && L.state.profile.settings.googleCalendarEmail) || '';
      if(gEmail && gEmail.indexOf('@') !== -1) reqOpts.hint = gEmail;
      try{ client.requestAccessToken(reqOpts); }
      catch(e){
        if(opts.silent) resolve(null);
        else reject(e);
      }
    });
  }
  /* ---- 이전 전 index.html 7050~7067줄(#TASK-ES-482 생성기 표지) ---- */
  async function getGoogleAccessToken(interactive){
    // [#TASK-ES-345 CAL-02] 다른 계정 토큰이 메모리에 남아 있으면 쓰지 않는다.
    L.ensureGcalOwner();
    if(!L.state.googleToken) restoreGoogleToken();
    if(L.state.googleToken && L.state.googleToken.expiresAt > Date.now()+30000) return L.state.googleToken.accessToken;
    var isConn = isGoogleCalendarConnected();
    if(!interactive){
      // [#TASK-ES-265] 백그라운드 호출 시 연동 계정이면 무인 Silent Refresh 시도
      if(isConn){
        try {
          var silentTok = await requestGoogleToken({ silent: true });
          if(silentTok) return silentTok;
        } catch(e){}
      }
      if(!interactive) return null;
    }
    return requestGoogleToken({ silent: false });
  }
  /* ---- 이전 전 index.html 7068~7131줄(#TASK-ES-482 생성기 표지) ---- */
  async function openGcalImportModal(){
    var token;
    try{ token = await getGoogleAccessToken(); } catch(e){ L.toast('구글 인증에 실패했어요'); return; }
    var goals = L.state.profile.goals.filter(function(g){ return !g.archivedAt; });
    if(!goals.length){ L.toast('먼저 목표를 만들어주세요'); return; }
    L.toast('일정을 불러오는 중…');
    var timeMin = new Date().toISOString();
    var timeMax = new Date(Date.now()+60*86400000).toISOString();
    var url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin='+encodeURIComponent(timeMin)+
      '&timeMax='+encodeURIComponent(timeMax)+'&singleEvents=true&orderBy=startTime&maxResults=25';
    var res;
    try{ res = await fetch(url, { headers:{ Authorization:'Bearer '+token } }); }
    catch(e){ L.toast('일정을 불러오지 못했어요'); return; }
    if(!res.ok){ L.toast('일정을 불러오지 못했어요 · 권한을 확인해주세요'); return; }
    var data = await res.json();
    var imported = L.state.profile.settings.gcalSync.imported || {};
    var events = (data.items||[]).filter(function(e){ return e.status!=='cancelled' && (e.start.date || e.start.dateTime); }).map(function(e){
      return { id:e.id, title:e.summary||'(제목 없음)', date:(e.start.date || (e.start.dateTime||'').slice(0,10)), already: !!imported[e.id] };
    });
    if(!events.length){ L.toast('앞으로 60일 안에 다가오는 일정이 없어요'); return; }
    var sel = {}; events.forEach(function(e){ sel[e.id] = !e.already; });
    L.openModal(
      '<h3>캘린더 일정 불러오기</h3>' +
      '<p class="faint" style="margin:-8px 0 14px;">마일스톤으로 추가할 일정과, 담을 목표를 골라주세요.</p>' +
      '<div class="field"><label>추가할 목표</label><select id="gcalTargetGoal">'+goals.map(function(g){ return '<option value="'+g.id+'">'+L.escapeHtml(g.title)+'</option>'; }).join('')+'</select></div>' +
      '<div class="ms-list" style="margin-top:10px;">' +
        events.map(function(e){
          return '<div class="ms-row" data-gev="'+e.id+'" style="cursor:pointer;'+(e.already?'opacity:.55;':'')+'">' +
            '<div class="ms-main">' +
              '<div class="sel-check'+(sel[e.id]?' on':'')+'" data-gevchk="'+e.id+'">'+(sel[e.id]?'✓':'')+'</div>' +
              '<div style="flex:1;min-width:0;"><div style="font-size:.875rem;font-weight:700;">'+L.escapeHtml(e.title)+'</div><div class="faint" style="font-size:.8125rem;">'+e.date+(e.already?' · 이미 가져왔어요':'')+'</div></div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" id="gcalImpCancel" type="button">취소</button><button class="btn btn-primary" id="gcalImpConfirm" type="button">마일스톤으로 추가</button></div>',
      function(sheet){
        sheet.querySelector('#gcalImpCancel').addEventListener('click', L.closeModal);
        sheet.querySelectorAll('[data-gev]').forEach(function(row){
          row.addEventListener('click', function(){
            var id = row.dataset.gev;
            sel[id] = !sel[id];
            var chk = row.querySelector('[data-gevchk]');
            chk.classList.toggle('on', sel[id]);
            chk.textContent = sel[id] ? '✓' : '';
          });
        });
        sheet.querySelector('#gcalImpConfirm').addEventListener('click', async function(){
          var gid = sheet.querySelector('#gcalTargetGoal').value;
          var goal = L.state.profile.goals.find(function(g){ return g.id===gid; });
          var picked = events.filter(function(e){ return sel[e.id]; });
          if(!goal || !picked.length){ L.toast('일정을 선택해주세요'); return; }
          picked.forEach(function(e){
            goal.milestones.push({ id: L.uid('ms'), title: e.title, status:'todo', dueDate: e.date, tasks:[] });
            L.state.profile.settings.gcalSync.imported[e.id] = true;
          });
          await L.saveProfile();
          L.closeModal();
          L.toast(picked.length+'개 일정을 "'+goal.title+'"의 마일스톤으로 추가했어요');
          L.renderAll();
        });
      }
    );
  }
  /* ---- 이전 전 index.html 7132~7190줄(#TASK-ES-482 생성기 표지) ---- */
  async function openGcalExportModal(){
    var token;
    try{ token = await getGoogleAccessToken(); } catch(e){ L.toast('구글 인증에 실패했어요'); return; }
    var sync = L.state.profile.settings.gcalSync;
    var goals = L.state.profile.goals.filter(function(g){ return !g.archivedAt; });
    var items = [];
    goals.forEach(function(g){
      if(g.dueDate) items.push({ key:'goal:'+g.id, label:''+g.title, date:g.dueDate, kind:'goal', goal:g, already: sync.goals[g.id]||null });
      g.milestones.forEach(function(m){
        if(m.dueDate && m.status!=='done') items.push({ key:'ms:'+m.id, label:'· '+m.title+' ('+g.title+')', date:m.dueDate, kind:'ms', goal:g, ms:m, already: sync.ms[m.id]||null });
      });
    });
    if(!items.length){ L.toast('캘린더에 반영할 마감일이 있는 목표·마일스톤이 없어요'); return; }
    var sel = {}; items.forEach(function(it){ sel[it.key] = true; });
    L.openModal(
      '<h3>목표를 캘린더에 반영하기</h3>' +
      '<p class="faint" style="margin:-8px 0 14px;">마감일이 있는 목표·마일스톤을 구글 캘린더 일정으로 만들어요.</p>' +
      '<div class="ms-list">' +
        items.map(function(it){
          return '<div class="ms-row" data-gxp="'+it.key+'" style="cursor:pointer;">' +
            '<div class="ms-main">' +
              '<div class="sel-check on" data-gxpchk="'+it.key+'"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg></div>' +
              '<div style="flex:1;min-width:0;"><div style="font-size:.875rem;font-weight:700;">'+L.escapeHtml(it.label)+'</div><div class="faint" style="font-size:.8125rem;">'+it.date+(it.already?' · 이미 캘린더에 있어요 · 다시 반영하면 갱신돼요':'')+'</div></div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" id="gcalExpCancel" type="button">취소</button><button class="btn btn-primary" id="gcalExpConfirm" type="button">캘린더에 반영</button></div>',
      function(sheet){
        sheet.querySelector('#gcalExpCancel').addEventListener('click', L.closeModal);
        sheet.querySelectorAll('[data-gxp]').forEach(function(row){
          row.addEventListener('click', function(){
            var key = row.dataset.gxp;
            sel[key] = !sel[key];
            var chk = row.querySelector('[data-gxpchk]');
            chk.classList.toggle('on', sel[key]);
            chk.textContent = sel[key] ? '✓' : '';
          });
        });
        sheet.querySelector('#gcalExpConfirm').addEventListener('click', async function(){
          var picked = items.filter(function(it){ return sel[it.key]; });
          if(!picked.length){ L.toast('반영할 항목을 선택해주세요'); return; }
          L.closeModal();
          L.toast('캘린더에 반영하는 중…');
          var okCount = 0;
          for(var i=0;i<picked.length;i++){
            var it = picked[i];
            var evId = await L.pushCalendarEvent(token, it.label, it.date, it.already);
            if(evId){
              if(it.kind==='goal') sync.goals[it.goal.id] = evId; else sync.ms[it.ms.id] = evId;
              okCount++;
            }
          }
          await L.saveProfile();
          L.toast(okCount+'개 일정을 캘린더에 반영했어요');
        });
      }
    );
  }

  K.effectiveGcalClientId = effectiveGcalClientId;
  K.isGoogleCalendarConnected = isGoogleCalendarConnected;
  K.tryConnectGoogleCalendar = tryConnectGoogleCalendar;
  K.openGoogleCalendarConnectModal = openGoogleCalendarConnectModal;
  K.fetchGoogleCalendarEvents = fetchGoogleCalendarEvents;
  K.syncAllToGoogleCalendar = syncAllToGoogleCalendar;
  K.nextDayISO = nextDayISO;
  K.restoreGoogleToken = restoreGoogleToken;
  K.gcalTokenStatus = gcalTokenStatus;
  K.ensureGoogleTokenClient = ensureGoogleTokenClient;
  K.requestGoogleToken = requestGoogleToken;
  K.getGoogleAccessToken = getGoogleAccessToken;
  K.openGcalImportModal = openGcalImportModal;
  K.openGcalExportModal = openGcalExportModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
