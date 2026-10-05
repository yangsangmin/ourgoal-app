/**
 * OurGoal Checkin Feedback (기록 — 체크인 AI 피드백 칸·창·피드 공유)
 *
 * 「맞춤 피드백 봇 설정」 묶음 중 피드백 보여 주기 몫: 판정 색(verdictClass)·홈/기록 피드백 칸 그리기·체크인 피드백 창 열기/닫기·피드 바로 공유·내 아바타 글자·「n분 전」 글자(timeAgoStr).
 * #TASK-ES-492(인라인 어려움 기관 묶음 이전 3차): index.html 인라인 IIFE 의 구간(이전 전 10202~10203 · 10204~10272 · 10273~10292 · 10293~10524 · 10525~10532 · 10537~10617 · 10619~10683 · 10684~10692줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ---- 이전 전 index.html 10202~10203줄(#TASK-ES-492 생성기 표지) ---- */

  function verdictClass(v){ return (v==='도움됨'||v==='실천 완료')?'good':(v==='도움안됨'?'bad':'mid'); }
  /* ---- 이전 전 index.html 10204~10272줄(#TASK-ES-492 생성기 표지) ---- */
  function renderFeedbackSlot(fb){
    var existing = document.getElementById('fbSlot');
    if(existing) existing.remove();
    if(!fb) return;
    var card = document.createElement('div');
    card.id = 'fbSlot';
    if(fb==='loading'){
      card.className = 'fb-card mid';
      card.innerHTML = '<span class="fb-verdict">판단 중…</span>';
    } else {
      card.className = 'fb-card ' + verdictClass(fb.verdict);
      var isLocalFb = (fb.source === 'local_enhanced' || fb.source === 'local' || fb.source === '간이 판단');
      var fbNoticeHtml = isLocalFb ? '<div style="font-size:11px;color:var(--ink-soft);margin-top:4px;">⚡ 오프라인 상태 또는 아워골 서버 문제로 기본 안내가 생성되었습니다</div>' : '';

      var mode = fb.feedbackMode || (L.state && L.state.aiFeedbackMode) || 'default';
      var modeLabel = mode === 'macro' ? '정밀' : (mode === 'medium' ? '중간' : '기본');
      var modeBadgeHtml = '<span class="badge" style="font-size:11px;padding:2px 7px;margin-left:6px;border-radius:6px;background:var(--card2);color:var(--ink-soft);font-weight:600;">[' + modeLabel + ']</span>';

      var calAct = fb.calendarAction || fb.calendar_action;
      var calBtnHtml = '';
      if(calAct && (calAct.has_suggestion || calAct.title)){
        calBtnHtml = '<div style="margin-top:8px;padding:8px 10px;background:var(--card2);border-radius:8px;border:1px dashed var(--line);">' +
          '<div style="font-size:0.75rem;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:4px;"><span>📅</span> <span>AI 추천 일정: ' + L.escapeHtml(calAct.title) + '</span></div>' +
          '<div style="font-size:0.72rem;color:var(--ink-soft);margin-top:2px;">일시: ' + L.escapeHtml(calAct.suggested_date || calAct.date || '') + ' ' + L.escapeHtml(calAct.suggested_time || calAct.time || '') + (calAct.note ? (' (' + L.escapeHtml(calAct.note) + ')') : '') + '</div>' +
          '<button type="button" class="btn btn-sm btn-accent" id="btnApplyAiCalSlot" style="margin-top:6px;width:100%;font-size:0.75rem;padding:4px 8px;">캘린더에 이 일정 즉시 등록 (+1클릭)</button>' +
        '</div>';
      }

      card.innerHTML = '<span class="fb-close" id="fbCloseBtn">×</span>' +
        '<div class="fb-verdict">' + L.escapeHtml(fb.verdict) + modeBadgeHtml + '</div>' +
        '<div class="fb-row">' + L.escapeHtml(fb.comment) + '</div>' +
        calBtnHtml +
        '<div class="fb-source">' + (fb.persona ? '내 맞춤 봇 판단' : (fb.source === 'ai' || fb.source === 'gemini' ? 'Gemini 판단' : '간이 판단')) + '</div>' +
        fbNoticeHtml +
        '<button class="btn btn-ghost btn-sm" id="fbShareBtn" type="button" style="width:100%;margin-top:10px;">이 기록, 피드에 공유하기</button>';
    }
    document.getElementById('captureCardBox').after(card);
    if(fb!=='loading'){
      card.classList.add('just-arrived');
      try { card.scrollIntoView({ behavior:'smooth', block:'center' }); } catch(e){}
      L.triggerHaptic(18);
      card.querySelector('#fbCloseBtn').addEventListener('click', function(){ card.remove(); });
      var shareBtn = card.querySelector('#fbShareBtn');
      if(shareBtn) shareBtn.addEventListener('click', L.openShareToFeedModal);
      var calBtn = card.querySelector('#btnApplyAiCalSlot');
      if(calBtn){
        calBtn.addEventListener('click', async function(){
          var act = fb.calendarAction || fb.calendar_action;
          if(!act) return;
          if(!L.state.profile.settings.customSchedules) L.state.profile.settings.customSchedules = [];
          L.state.profile.settings.customSchedules.push({
            id: L.uid('sched'),
            title: act.title || 'AI 추천 일정',
            date: act.suggested_date || act.date || ((typeof L.dateKey === 'function') ? L.dateKey(L.nowISO()) : L.nowISO().slice(0,10)),
            time: act.suggested_time || act.time || '14:00',
            note: act.note || 'AI 피드백 추천 일정',
            done: false,
            createdAt: L.nowISO()
          });
          await L.saveProfile();
          if(typeof L.renderCalendarScreen === 'function' && L.state.activeTab === 'calendar') L.renderCalendarScreen();
          L.toast('캘린더에 일정을 등록했습니다: ' + (act.title || ''));
          calBtn.disabled = true;
          calBtn.textContent = '✓ 캘린더 등록 완료';
          calBtn.style.opacity = '0.6';
        });
      }
    }
  }
  /* ---- 이전 전 index.html 10273~10292줄(#TASK-ES-492 생성기 표지) ---- */

  function getUserAvatarHtml(size){
    size = size || 48;
    try {
      var p = (L.state && L.state.profile) || {};
      var customUrl = (p.settings && p.settings.avatarType === 'custom' && p.settings.customAvatarUrl) || p.avatarUrl;
      if(customUrl){
        return '<img src="' + customUrl + '" alt="" style="width:'+size+'px;height:'+size+'px;object-fit:cover;border-radius:50%;border:2px solid var(--primary);">';
      }
      if(window.OurgoalAvatar && window.OurgoalAvatar.renderAvatarHtml){
        var xpTotal = (p.settings && p.settings.xp && p.settings.xp.total) || 0;
        var pLvl = (typeof L.levelProgress === 'function') ? L.levelProgress(xpTotal) : { level: 1 };
        return window.OurgoalAvatar.renderAvatarHtml(pLvl.level, p, { size: size });
      }
      var icon = (p.avatar || p.avatarIcon || '🌱');
      return '<div style="width:'+size+'px;height:'+size+'px;border-radius:50%;background:var(--primary-glow, rgba(99,102,241,0.15));display:flex;align-items:center;justify-content:center;font-size:'+Math.round(size*0.55)+'px;border:2px solid var(--primary);">'+icon+'</div>';
    } catch(e){
      return '<div style="width:'+size+'px;height:'+size+'px;border-radius:50%;background:var(--primary-glow, rgba(99,102,241,0.15));display:flex;align-items:center;justify-content:center;font-size:24px;">🌱</div>';
    }
  }
  /* ---- 이전 전 index.html 10293~10524줄(#TASK-ES-492 생성기 표지) ---- */

  function showCheckinFeedbackSheet(rec, fb){
    try {
      var prevPop = document.getElementById('avatarCelebrationToast');
      if(prevPop) prevPop.remove();
    } catch(e){}
    var existingBackdrop = document.getElementById('checkinAiSheetBackdrop');
    if(!fb){
      fb = {
        verdict: '실천 완료',
        fact_insight: '오늘의 멋진 실천을 성공적으로 기록하셨습니다! 꾸준한 실천이 큰 성장을 만듭니다.',
        next_action: '내일도 같은 시간에 목표를 이어가보세요!'
      };
    }
    if(!existingBackdrop){
      existingBackdrop = document.createElement('div');
      existingBackdrop.id = 'checkinAiSheetBackdrop';
      existingBackdrop.className = 'checkin-ai-backdrop';
      document.body.appendChild(existingBackdrop);
      existingBackdrop.addEventListener('click', function(e){
        if(e.target === existingBackdrop){
          closeCheckinFeedbackSheet();
        }
      });
    }

    var avatarHtml = getUserAvatarHtml(52);
    var p = (L.state && L.state.profile) || {};
    var userName = p.displayName || '나';

    if(fb === 'loading'){
      existingBackdrop.innerHTML = 
        '<div class="checkin-ai-sheet card" role="dialog" aria-modal="true" aria-label="AI 코치 체크인 피드백">' +
          '<div class="checkin-ai-header">' +
            '<div class="checkin-ai-header-title">✨ 오늘의 체크인 AI 코칭</div>' +
            '<button type="button" class="checkin-ai-close-btn" id="btnCheckinAiClose" aria-label="닫기">×</button>' +
          '</div>' +
          '<div class="checkin-ai-body">' +
            '<div class="checkin-ai-profile-row">' +
              '<div class="checkin-ai-avatar-wrap pulse">' + avatarHtml + '</div>' +
              '<div class="checkin-ai-profile-info">' +
                '<div class="checkin-ai-speaker"><b>' + L.escapeHtml(userName) + '</b> 님의 페이스메이커</div>' +
                '<div class="checkin-ai-status-sub">오늘의 실천 데이터를 정밀 분석하고 있어요...</div>' +
              '</div>' +
            '</div>' +
            '<div class="checkin-ai-loading-box">' +
              '<div class="checkin-ai-dots"><span></span><span></span><span></span></div>' +
              '<div class="checkin-ai-loading-text">방금 남긴 실천에 맞는 맞춤 조언을 준비 중입니다</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      existingBackdrop.style.display = 'flex';
      var closeBtn = existingBackdrop.querySelector('#btnCheckinAiClose');
      if(closeBtn) closeBtn.addEventListener('click', closeCheckinFeedbackSheet);
      return;
    }

    // fb loaded
    var mode = fb.feedbackMode || (L.state && L.state.aiFeedbackMode) || 'default';
    var modeLabel = mode === 'macro' ? '정밀 진단' : (mode === 'medium' ? '중간 코칭' : '기본 코칭');
    var verdict = fb.verdict || '핵심 발견';
    var factText = fb.fact_insight || fb.factInsight || fb.comment || '오늘의 실천을 멋지게 완수하셨습니다.';
    var nextAction = fb.next_action || fb.nextAction || '내일도 같은 시간대에 꾸준한 실천으로 성장 흐름을 이어가보세요!';
    var calAct = fb.calendarAction || fb.calendar_action;

    var calBtnHtml = '';
    if(calAct && (calAct.has_suggestion || calAct.title)){
      calBtnHtml = '<button type="button" class="btn btn-secondary btn-sm" id="btnCheckinAiCal" style="width:100%;min-height:40px;margin-top:6px;font-size:0.8125rem;">📅 AI 추천 일정 캘린더 등록: ' + L.escapeHtml(calAct.title) + '</button>';
    }

    var nextActionHtml = '';
    if(nextAction){
      nextActionHtml = 
        '<div class="checkin-ai-next-card">' +
          '<div class="checkin-ai-next-head">🎯 내일의 1가지 행동 제안</div>' +
          '<div class="checkin-ai-next-body">' + L.escapeHtml(nextAction) + '</div>' +
          '<button type="button" class="btn btn-primary" id="btnCheckinAiApplyNext" style="width:100%;min-height:40px;margin-top:8px;font-weight:700;">내일 퀘스트로 등록 (+1클릭)</button>' +
        '</div>';
    }

    existingBackdrop.innerHTML = 
      '<div class="checkin-ai-sheet card" role="dialog" aria-modal="true" aria-label="AI 코치 체크인 피드백">' +
        '<div class="checkin-ai-header">' +
          '<div class="checkin-ai-header-title">✨ 오늘의 체크인 AI 코칭</div>' +
          '<button type="button" class="checkin-ai-close-btn" id="btnCheckinAiClose" aria-label="닫기">×</button>' +
        '</div>' +
        '<div class="checkin-ai-body">' +
          '<div class="checkin-ai-profile-row">' +
            '<div class="checkin-ai-avatar-wrap">' + avatarHtml + '</div>' +
            '<div class="checkin-ai-profile-info">' +
              '<div class="checkin-ai-speaker"><b>' + L.escapeHtml(userName) + '</b> 님의 페이스메이커</div>' +
              '<div style="display:flex;align-items:center;gap:6px;margin-top:2px;">' +
                '<span class="checkin-ai-verdict-tag">' + L.escapeHtml(verdict) + '</span>' +
                '<span class="checkin-ai-mode-tag">[' + modeLabel + ']</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="checkin-ai-speech-bubble">' +
            '<div class="checkin-ai-speech-text">' + L.escapeHtml(factText) + '</div>' +
          '</div>' +
          nextActionHtml +
          calBtnHtml +
          '<div class="checkin-ai-instant-share-box" style="margin-top:12px;padding:12px;background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(5,150,105,0.04));border:1px solid rgba(16,185,129,0.25);border-radius:12px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
              '<span style="font-size:0.8125rem;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:5px;">' +
                '<span>📢 동반자 피드 1-클릭 자랑</span>' +
                '<span class="tag" style="background:#10b981;color:#fff;font-size:0.6875rem;padding:1px 6px;border-radius:6px;font-weight:700;">+5 EXP</span>' +
              '</span>' +
              '<label style="display:flex;align-items:center;gap:4px;font-size:0.75rem;color:var(--ink-soft);cursor:pointer;">' +
                '<input type="checkbox" id="chkCheckinShareGoalTitle" checked style="accent-color:#10b981;cursor:pointer;" />' +
                '<span>목표명 공개</span>' +
              '</label>' +
            '</div>' +
            '<button type="button" class="btn btn-primary" id="btnCheckinInstantShareFeed" style="width:100%;min-height:44px;background:linear-gradient(135deg,#10b981,#059669);border:none;color:#fff;font-weight:700;font-size:0.875rem;border-radius:10px;box-shadow:0 3px 10px rgba(16,185,129,0.25);display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;">' +
              '<span>📢 피드에도 자랑하고 +5 EXP 받기</span>' +
            '</button>' +
          '</div>' +
          '<div class="checkin-ai-footer-actions">' +
            '<button type="button" class="btn btn-ghost" id="btnCheckinAiGoRecords" style="flex:1;min-height:40px;font-size:0.8125rem;">기록 탭에서 확인</button>' +
            '<button type="button" class="btn btn-ghost" id="btnCheckinAiShareFeed" style="flex:1;min-height:40px;font-size:0.8125rem;">피드에 공유하기</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    existingBackdrop.style.display = 'flex';
    L.triggerHaptic(18);

    // wire listeners
    var closeBtn = existingBackdrop.querySelector('#btnCheckinAiClose');
    if(closeBtn) closeBtn.addEventListener('click', closeCheckinFeedbackSheet);

    var btnInstantShare = existingBackdrop.querySelector('#btnCheckinInstantShareFeed');
    var chkGoalTitle = existingBackdrop.querySelector('#chkCheckinShareGoalTitle');
    if(btnInstantShare){
      btnInstantShare.addEventListener('click', async function(){
        try {
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(15);
          else if(typeof L.triggerHaptic === 'function') L.triggerHaptic(15);
          btnInstantShare.disabled = true;
          btnInstantShare.textContent = '피드에 발행 중…';
          var includeGoal = chkGoalTitle ? chkGoalTitle.checked : true;
          await instantShareCheckinToFeed(rec, fb, { includeGoal: includeGoal });
          btnInstantShare.textContent = '✓ 피드 자랑 완료 (+5 EXP)';
          btnInstantShare.style.opacity = '0.8';
          setTimeout(function(){
            closeCheckinFeedbackSheet();
            L.state.commSubTab = 'feed';
            if(typeof L.setTab === 'function') L.setTab('comm');
            else if(typeof L.switchTab === 'function') L.switchTab('comm');
            if(typeof L.renderCommScreen === 'function') L.renderCommScreen();
          }, 900);
        } catch(err){
          console.error('Instant share failed:', err);
          L.toast('피드 공유 중 문제가 발생했습니다.');
          btnInstantShare.disabled = false;
          btnInstantShare.textContent = '📢 피드에도 자랑하고 +5 EXP 받기';
        }
      });
    }

    var btnApplyNext = existingBackdrop.querySelector('#btnCheckinAiApplyNext');
    if(btnApplyNext && nextAction){
      btnApplyNext.addEventListener('click', async function(){
        try {
          btnApplyNext.disabled = true;
          btnApplyNext.textContent = '등록 중…';
          if(!L.state.profile.settings.customSchedules) L.state.profile.settings.customSchedules = [];
          var tomorrow = new Date(Date.now() + 86400000);
          var tomorrowKey = (typeof L.dateKey === 'function') ? L.dateKey(tomorrow.toISOString()) : tomorrow.toISOString().slice(0, 10);
          L.state.profile.settings.customSchedules.push({
            id: L.uid('sched'),
            title: nextAction,
            date: tomorrowKey,
            time: '09:00',
            note: 'AI 체크인 코칭 제안 액션',
            done: false,
            createdAt: L.nowISO()
          });
          await L.saveProfile();
          if(typeof L.renderCalendarScreen === 'function' && L.state.activeTab === 'calendar') L.renderCalendarScreen();
          L.toast('내일 퀘스트로 등록되었습니다! 🎯');
          L.burstConfetti(window.innerWidth / 2, window.innerHeight / 2, 10);
          btnApplyNext.textContent = '✓ 내일 퀘스트 등록 완료';
          btnApplyNext.style.opacity = '0.7';
        } catch(err){
          L.toast('등록 중 문제가 발생했습니다.');
          btnApplyNext.disabled = false;
          btnApplyNext.textContent = '내일 퀘스트로 등록 (+1클릭)';
        }
      });
    }

    var btnCal = existingBackdrop.querySelector('#btnCheckinAiCal');
    if(btnCal && calAct){
      btnCal.addEventListener('click', async function(){
        if(!L.state.profile.settings.customSchedules) L.state.profile.settings.customSchedules = [];
        L.state.profile.settings.customSchedules.push({
          id: L.uid('sched'),
          title: calAct.title || 'AI 추천 일정',
          date: calAct.suggested_date || calAct.date || ((typeof L.dateKey === 'function') ? L.dateKey(L.nowISO()) : L.nowISO().slice(0,10)),
          time: calAct.suggested_time || calAct.time || '14:00',
          note: calAct.note || 'AI 피드백 추천 일정',
          done: false,
          createdAt: L.nowISO()
        });
        await L.saveProfile();
        if(typeof L.renderCalendarScreen === 'function' && L.state.activeTab === 'calendar') L.renderCalendarScreen();
        L.toast('캘린더에 일정을 등록했습니다: ' + (calAct.title || ''));
        btnCal.disabled = true;
        btnCal.textContent = '✓ 캘린더 등록 완료';
        btnCal.style.opacity = '0.6';
      });
    }

    var btnGoRec = existingBackdrop.querySelector('#btnCheckinAiGoRecords');
    if(btnGoRec){
      btnGoRec.addEventListener('click', function(){
        closeCheckinFeedbackSheet();
        var navRecords = document.querySelector('.navbtn[data-tab="records"]');
        if(navRecords) navRecords.click();
        else if(typeof L.switchTab === 'function') L.switchTab('records');
      });
    }

    var btnShareFeed = existingBackdrop.querySelector('#btnCheckinAiShareFeed');
    if(btnShareFeed){
      btnShareFeed.addEventListener('click', function(){
        closeCheckinFeedbackSheet();
        if(typeof L.openShareToFeedModal === 'function') L.openShareToFeedModal();
      });
    }
  }
  /* ---- 이전 전 index.html 10525~10532줄(#TASK-ES-492 생성기 표지) ---- */

  function closeCheckinFeedbackSheet(){
    var existingBackdrop = document.getElementById('checkinAiSheetBackdrop');
    if(existingBackdrop){
      existingBackdrop.classList.add('closing');
      setTimeout(function(){ existingBackdrop.remove(); }, 200);
    }
  }

  /* ---- 이전 전 index.html 10537~10617줄(#TASK-ES-492 생성기 표지) ---- */

  async function instantShareCheckinToFeed(rec, fb, opt){
    opt = opt || {};
    if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(15);
    else if(typeof L.triggerHaptic === 'function') L.triggerHaptic(15);

    var userGoals = (L.state.profile.goals || []).filter(function(g){ return !g.archivedAt; });
    var targetGoal = (L.state.lastCapture && L.state.lastCapture.goal) || (rec && rec.goalId && userGoals.find(function(g){ return g.id === rec.goalId; })) || (userGoals.length ? userGoals[0] : null);
    var includeGoal = opt.includeGoal !== undefined ? opt.includeGoal : true;
    var goalTitle = (includeGoal && targetGoal) ? targetGoal.title : null;
    var goalPct = (includeGoal && targetGoal && typeof L.goalProgress === 'function') ? L.goalProgress(targetGoal) : null;

    var curRecord = rec || (L.state.lastCapture && L.state.lastCapture.record) || (L.state.profile.records && L.state.profile.records[0]) || null;
    var rText = (curRecord && (curRecord.text || curRecord.title)) ? (curRecord.text || curRecord.title).replace(/\r\n/g, ' ').trim() : '';
    var curPhoto = (curRecord && curRecord.photo) || null;
    var curFb = fb || (curRecord && curRecord.feedback) || null;

    var defaultCaption = '';
    if(rText){
      var snippet = rText.slice(0, 45);
      defaultCaption = '오늘 실천 완료! "' + snippet + (rText.length > 45 ? '…' : '') + '" 꾸준히 나아갑니다 🔥';
    } else if(goalTitle){
      defaultCaption = '"' + goalTitle + '" 목표를 향해 집중하고 있습니다. 함께 달려요! 💪';
    } else {
      defaultCaption = '오늘도 목표를 향해 한 걸음 내딛습니다. 모두 파이팅해요! ✨';
    }

    var selectedCat = (targetGoal && targetGoal.category) || 'study';
    var postId = 'post_' + L.newId();
    var post = {
      id: postId,
      user_id: L.state.profile.id,
      display_name: L.state.profile.displayName,
      avatar_url: L.state.profile.avatarUrl || null,
      goal_title: goalTitle,
      caption: defaultCaption,
      cheers_count: 0,
      created_at: L.nowISO(),
      extra: {
        category: selectedCat,
        includeRecord: !!curRecord,
        recordText: rText || null,
        photo: curPhoto,
        includeFeedback: !!curFb,
        feedback: curFb ? (typeof curFb === 'string' ? { comment: curFb, verdict: 'PASS', source: 'ai_coach' } : { verdict: curFb.verdict || 'PASS', comment: curFb.comment || curFb.fact_insight || curFb.text || '', source: curFb.source || 'ai_coach' }) : null,
        includeGoal: !!goalTitle,
        goalPct: goalPct,
        milestones: (targetGoal && targetGoal.milestones) ? targetGoal.milestones.filter(function(m){ return m.status === 'done' || m.status === 'doing'; }).map(function(m){ return { title: m.title, status: m.status }; }) : [],
        comments: []
      }
    };

    try {
      if(typeof L.sb !== 'undefined' && L.sb && L.sb.from){
        await L.sb.from('feed_posts').insert(post);
      }
    } catch(e){
      console.warn('Supabase post insert failed, saving locally:', e);
    }

    if(!L.state.profile.settings.myFeedPosts) L.state.profile.settings.myFeedPosts = [];
    L.state.profile.settings.myFeedPosts.unshift(post);

    L.awardXP(5, '체크인 피드 자랑');
    await L.saveProfile();

    if(typeof L.FEED_POSTS_CACHE === 'undefined' || !L.FEED_POSTS_CACHE) L.FEED_POSTS_CACHE = [];
    L.FEED_POSTS_CACHE.unshift(post);

    L.burstConfetti(window.innerWidth / 2, window.innerHeight / 2, 16);
    L.toast('동반자 피드에 자랑 완료! 경험치 +5 EXP 획득 🎉');

    if(typeof L.dispatchFullViewPropagation === 'function') L.dispatchFullViewPropagation();

    if(L.state.profile.settings.virtualCheerEnabled !== false && typeof L.addSimulatedCheerAndReplyToPost === 'function'){
      setTimeout(function(){
        L.addSimulatedCheerAndReplyToPost(postId, goalTitle, defaultCaption);
      }, 2400);
    }
    return post;
  }

  /* ---- 이전 전 index.html 10619~10683줄(#TASK-ES-492 생성기 표지) ---- */

  function renderRecordFeedbackSlot(fb){
    var el = document.getElementById('recFeedbackSlot');
    if(!el) return;
    if(!fb){ el.innerHTML = ''; el.style.display = 'none'; return; }
    el.style.display = 'block';
    if(fb === 'loading'){
      el.innerHTML = '<div class="fb-card mid"><span class="fb-verdict">AI 코치 피드백 분석 중…</span></div>';
    } else {
      var isRecLocalFb = (fb.source === 'local_enhanced' || fb.source === 'local' || fb.source === '간이 판단');
      var recFbNoticeHtml = isRecLocalFb ? '<div style="font-size:11px;color:var(--ink-soft);margin-top:4px;">⚡ 오프라인 상태 또는 아워골 서버 문제로 기본 안내가 생성되었습니다</div>' : '';

      var mode = fb.feedbackMode || (L.state && L.state.aiFeedbackMode) || 'default';
      var modeLabel = mode === 'macro' ? '정밀' : (mode === 'medium' ? '중간' : '기본');
      var modeBadgeHtml = '<span class="badge" style="font-size:11px;padding:2px 7px;margin-left:6px;border-radius:6px;background:var(--card2);color:var(--ink-soft);font-weight:600;">[' + modeLabel + ']</span>';

      var calAct = fb.calendarAction || fb.calendar_action;
      var calBtnHtml = '';
      if(calAct && (calAct.has_suggestion || calAct.title)){
        calBtnHtml = '<div style="margin-top:8px;padding:8px 10px;background:var(--card2);border-radius:8px;border:1px dashed var(--line);">' +
          '<div style="font-size:0.75rem;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:4px;"><span>📅</span> <span>AI 추천 일정: ' + L.escapeHtml(calAct.title) + '</span></div>' +
          '<div style="font-size:0.72rem;color:var(--ink-soft);margin-top:2px;">일시: ' + L.escapeHtml(calAct.suggested_date || calAct.date || '') + ' ' + L.escapeHtml(calAct.suggested_time || calAct.time || '') + (calAct.note ? (' (' + L.escapeHtml(calAct.note) + ')') : '') + '</div>' +
          '<button type="button" class="btn btn-sm btn-accent" id="btnApplyAiRecordCalSlot" style="margin-top:6px;width:100%;font-size:0.75rem;padding:4px 8px;">캘린더에 이 일정 즉시 등록 (+1클릭)</button>' +
        '</div>';
      }

      el.innerHTML = '<div class="fb-card ' + verdictClass(fb.verdict) + '">' +
        '<span class="fb-close" id="recFbCloseBtn">×</span>' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:4px;display:flex;align-items:center;gap:4px;"><span><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/></svg></span><span>기록 탭 AI 피드백</span>' + modeBadgeHtml + '</div>' +
        '<div class="fb-verdict">' + L.escapeHtml(fb.verdict) + '</div>' +
        '<div class="fb-row">' + L.escapeHtml(fb.comment) + '</div>' +
        calBtnHtml +
        '<div class="fb-source">' + (fb.persona ? '내 맞춤 봇 판단' : (fb.source === 'ai' || fb.source === 'gemini' ? 'Gemini 판단' : '간이 판단')) + '</div>' +
        recFbNoticeHtml +
        '<button class="btn btn-ghost btn-sm" id="recFbShareBtn" type="button" style="width:100%;margin-top:10px;">이 기록, 피드에 공유하기</button>' +
      '</div>';
      var closeBtn = el.querySelector('#recFbCloseBtn');
      if(closeBtn) closeBtn.onclick = function(){ el.innerHTML = ''; el.style.display = 'none'; };
      var shareBtn = el.querySelector('#recFbShareBtn');
      if(shareBtn) shareBtn.onclick = L.openShareToFeedModal;
      var calBtn = el.querySelector('#btnApplyAiRecordCalSlot');
      if(calBtn){
        calBtn.addEventListener('click', async function(){
          var act = fb.calendarAction || fb.calendar_action;
          if(!act) return;
          if(!L.state.profile.settings.customSchedules) L.state.profile.settings.customSchedules = [];
          L.state.profile.settings.customSchedules.push({
            id: L.uid('sched'),
            title: act.title || 'AI 추천 일정',
            date: act.suggested_date || act.date || ((typeof L.dateKey === 'function') ? L.dateKey(L.nowISO()) : L.nowISO().slice(0,10)),
            time: act.suggested_time || act.time || '14:00',
            note: act.note || 'AI 피드백 추천 일정',
            done: false,
            createdAt: L.nowISO()
          });
          await L.saveProfile();
          if(typeof L.renderCalendarScreen === 'function' && L.state.activeTab === 'calendar') L.renderCalendarScreen();
          L.toast('캘린더에 일정을 등록했습니다: ' + (act.title || ''));
          calBtn.disabled = true;
          calBtn.textContent = '✓ 캘린더 등록 완료';
          calBtn.style.opacity = '0.6';
        });
      }
    }
  }
  /* ---- 이전 전 index.html 10684~10692줄(#TASK-ES-492 생성기 표지) ---- */
  function timeAgoStr(iso){
    var diff = Math.max(0, Date.now() - new Date(iso).getTime());
    var min = Math.floor(diff/60000);
    if(min < 1) return '방금';
    if(min < 60) return min+'분 전';
    var hr = Math.floor(min/60);
    if(hr < 24) return hr+'시간 전';
    return Math.floor(hr/24)+'일 전';
  }

  K.verdictClass = verdictClass;
  K.renderFeedbackSlot = renderFeedbackSlot;
  K.getUserAvatarHtml = getUserAvatarHtml;
  K.showCheckinFeedbackSheet = showCheckinFeedbackSheet;
  K.closeCheckinFeedbackSheet = closeCheckinFeedbackSheet;
  K.instantShareCheckinToFeed = instantShareCheckinToFeed;
  K.renderRecordFeedbackSlot = renderRecordFeedbackSlot;
  K.timeAgoStr = timeAgoStr;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
