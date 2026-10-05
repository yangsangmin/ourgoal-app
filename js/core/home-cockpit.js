/**
 * OurGoal Home Cockpit (기관 — 홈 1초 조망 ↔ 체크인 콕핏)
 *
 * 홈 1초 조망·무저항 체크인 콕핏 8대 과업 묶음(#TASK-UIUX-PHASE3-HOME-COCKPIT). 여러 탭이 부르는 공용 부품이라 기관 칸에 둔다.
 * #TASK-ES-471(인라인 어려움 기관 묶음 이전 1차): index.html 인라인 IIFE 의 구간(이전 전 4070~4092 · 4094~4114 · 4116~4138 · 4140~4200 · 4201~4306줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 4070~4092줄(#TASK-ES-471 생성기 표지) ---- */
  function switchHomeDate(offset){
    window._homeDateOffset = offset;
    if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
    var chips = document.querySelectorAll('.home-date-chip');
    chips.forEach(function(c){
      var o = parseInt(c.getAttribute('data-date-offset'), 10);
      if(o === offset){
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
    var headline = document.getElementById('homeHeadlineSentence');
    if(headline){
      if(offset === -1){
        headline.innerHTML = '어제 실천 기록을 <b>돌아보고 점검</b>해요 📅';
      } else if(offset === 1){
        headline.innerHTML = '내일의 도전을 <b>미리 계획하고 준비</b>해요 🚀';
      } else {
        headline.innerHTML = '오늘 하루를 완성할 <b>갓생 목표</b>가 기다려요 ✨';
      }
    }
  }

  /* ---- 이전 전 index.html 4094~4114줄(#TASK-ES-471 생성기 표지) ---- */

  function initDimensionSliders(){
    var slEnergy = document.getElementById('sliderEnergy');
    var valEnergy = document.getElementById('valEnergy');
    if(slEnergy && valEnergy && !slEnergy._bound){
      slEnergy._bound = true;
      slEnergy.addEventListener('input', function(){
        valEnergy.textContent = slEnergy.value + '%';
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(8);
      });
    }
    var slFocus = document.getElementById('sliderFocus');
    var valFocus = document.getElementById('valFocus');
    if(slFocus && valFocus && !slFocus._bound){
      slFocus._bound = true;
      slFocus.addEventListener('input', function(){
        valFocus.textContent = slFocus.value + '%';
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(8);
      });
    }
  }

  /* ---- 이전 전 index.html 4116~4138줄(#TASK-ES-471 생성기 표지) ---- */

  function initHomeCockpit(){
    initDimensionSliders();
    var inp = document.getElementById('captureInput');
    if(inp && !inp.value){
      inp.value = ''; // [공준 1: 무예단 원칙] 깨끗한 빈칸 보장
    }
    var btnY = document.getElementById('btnHomeDateYesterday');
    if(btnY && !btnY._bound){
      btnY._bound = true;
      btnY.addEventListener('click', function(){ switchHomeDate(-1); });
    }
    var btnT = document.getElementById('btnHomeDateToday');
    if(btnT && !btnT._bound){
      btnT._bound = true;
      btnT.addEventListener('click', function(){ switchHomeDate(0); });
    }
    var btnM = document.getElementById('btnHomeDateTomorrow');
    if(btnM && !btnM._bound){
      btnM._bound = true;
      btnM.addEventListener('click', function(){ switchHomeDate(1); });
    }
  }

  /* ---- 이전 전 index.html 4140~4200줄(#TASK-ES-471 생성기 표지) ---- */

  function renderQuickCheckinGuideChips(){
    var wrap = document.querySelector('.quick-checkin-chips');
    if(!wrap) return;
    wrap.style.display = '';

    var userGoals = (typeof L.state !== 'undefined' && L.state.profile && Array.isArray(L.state.profile.goals)) ? L.state.profile.goals.filter(function(g){ return !g.archivedAt; }) : [];
    var chips = [];
    if(userGoals.length > 0){
      userGoals.slice(0, 5).forEach(function(g){
        var snippet = (g.title || '').slice(0, 18);
        var icon = g.icon || '🎯';
        chips.push({
          label: icon + ' ' + snippet,
          text: icon + ' [' + (g.title || '목표') + '] 오늘 실천 미션 완수! 한 걸음 더 성장했어요 🔥'
        });
      });
    }
    // 기본 영감 칩 폴백 (최소 2개 유지)
    if(chips.length < 2){
      var fallbacks = [
        { label: '👟 러닝/운동 실천', text: '👟 30분 유산소 운동 완주! 땀 흘리며 스트레스 해소 완료 🔥' },
        { label: '📖 독서/학습 몰입', text: '📖 핵심 내용 30분 집중 독서 & 마인드셋 정리 완료 ✨' }
      ];
      for(var fi = 0; fi < fallbacks.length && chips.length < 2; fi++){
        chips.push(fallbacks[fi]);
      }
    }

    wrap.innerHTML = 
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
        '<span style="font-size:0.78rem;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:4px;">' +
          '💡 <b>내 목표 맞춤 커닝페이퍼</b>' +
        '</span>' +
        '<span style="font-size:12.5px;color:var(--ink-soft);font-weight:500;">(탭하면 가이드 예시 힌트 설정 ⚡)</span>' +
      '</div>' +
      '<div class="cunning-chips-wrap" style="display:flex;gap:6px;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px;scrollbar-width:none;">' +
      chips.map(function(c){
        return '<button type="button" class="btn-quick-chip" data-cunningtext="'+L.escapeHtml(c.text)+'" style="font-size:0.78rem;padding:6px 14px;min-height:36px;border-radius:18px;background:rgba(49,130,246,0.08);border:1px solid rgba(49,130,246,0.22);color:var(--ink);cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-weight:600;white-space:nowrap;flex-shrink:0;transition:all .15s ease;">' +
          L.escapeHtml(c.label) +
        '</button>';
      }).join('') +
      '</div>';

    wrap.querySelectorAll('[data-cunningtext]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.preventDefault();
        wrap.querySelectorAll('[data-cunningtext]').forEach(function(b){
          b.classList.remove('active-cunning');
          b.style.borderColor = 'rgba(49,130,246,0.22)';
          b.style.background = 'rgba(49,130,246,0.08)';
          b.style.fontWeight = '600';
        });
        btn.classList.add('active-cunning');
        btn.style.borderColor = 'var(--brand, #3182f6)';
        btn.style.background = 'rgba(49,130,246,0.18)';
        btn.style.fontWeight = '700';
        L.applyQuickCunningText(btn.dataset.cunningtext);
      });
    });
  }
  /* ---- 이전 전 index.html 4201~4306줄(#TASK-ES-471 생성기 표지) ---- */

  async function saveProfile(){




    if(!L.state.profile) return;
    L.updateAppBadge(L.computeStreakDays()); /* 기록이 바뀌는 모든 경로(홈 체크인·기록 모달·온보딩)가 여기를 지나므로 배지는 여기서 갱신 */
    var uidVal = L.state.profile.id;
    try{
      if(L.state.profile.guardianAnimal && L.state.profile.settings){
        L.state.profile.settings.guardianAnimal = L.state.profile.guardianAnimal;
        if(!Array.isArray(L.state.profile.settings.savedAvatars)) L.state.profile.settings.savedAvatars = [];
        var existsGa = L.state.profile.settings.savedAvatars.some(function(a){ return a.id === 'guardian_' + (L.state.profile.guardianAnimal && L.state.profile.guardianAnimal.mbti); });
        if(!existsGa){
          L.state.profile.settings.savedAvatars.unshift({
            id: 'guardian_' + L.state.profile.guardianAnimal.mbti,
            name: L.state.profile.guardianAnimal.name,
            emoji: L.state.profile.guardianAnimal.emoji,
            mbti: L.state.profile.guardianAnimal.mbti,
            cat: '수호동물',
            createdAt: (typeof L.nowISO === 'function' ? L.nowISO() : new Date().toISOString())
          });
        }
      }
      var savedAvatarsPayload = (L.state.profile.settings && Array.isArray(L.state.profile.settings.savedAvatars)) ? L.state.profile.settings.savedAvatars : [];
      var trashPayload = Array.isArray(L.state.profile.trash) ? L.state.profile.trash : [];
      if(trashPayload.length){
        try { localStorage.setItem('ourgoal_trash_backup_' + uidVal, JSON.stringify(trashPayload)); } catch(e){}
      }
      var userUpsertObj = {
        trash: trashPayload,
        id: uidVal, username: L.state.profile.username, display_name: L.state.profile.displayName,
        bio: L.state.profile.bio || null, avatar_url: L.state.profile.avatarUrl || null,
        interests: L.state.profile.interests || [],
        region: L.state.profile.region || null, region_public: !!L.state.profile.regionPublic,
        saved_avatars: savedAvatarsPayload
      };
      var uUpsertRes = await L.sb.from('users').upsert(userUpsertObj);
      if(uUpsertRes && uUpsertRes.error){
        if(/saved_avatars/i.test(uUpsertRes.error.message || '')){
          delete userUpsertObj.saved_avatars;
          uUpsertRes = await L.sb.from('users').upsert(userUpsertObj);
        }
        if(uUpsertRes && uUpsertRes.error && /interests|region|trash|saved_avatars/i.test(uUpsertRes.error.message || '')){
          var minimalUser = {
            id: uidVal, username: L.state.profile.username, display_name: L.state.profile.displayName,
            bio: L.state.profile.bio || null, avatar_url: L.state.profile.avatarUrl || null
          };
          await L.sb.from('users').upsert(minimalUser);
        }
      }
      if(savedAvatarsPayload.length){
        try { localStorage.setItem('ourgoal_saved_avatars_backup_' + uidVal, JSON.stringify(savedAvatarsPayload)); } catch(e){}
      }

      var goals = L.state.profile.goals || [];
      try {
        localStorage.setItem('ourgoal_goals_backup_' + uidVal, JSON.stringify(goals));
        localStorage.setItem('ourgoal_guest_profile', JSON.stringify(L.state.profile));
        if(L.state.profile.calendarDayBackgrounds){
          localStorage.setItem('ourgoal_cal_day_bg_' + uidVal, JSON.stringify(L.state.profile.calendarDayBackgrounds));
        }
      } catch(e){}
      if(goals.length){
        await L.sb.from('goals').upsert(goals.map(function(g){
          return {
            id:g.id, user_id:uidVal, title:g.title, category:g.category||null, due_date:g.dueDate||null,
            visibility:g.visibility||'private', topic:g.topic||null, archived_at:g.archivedAt||null,
            result:g.result||null, milestones:g.milestones||[]
          };
        }));
      }

      var recs = L.state.profile.records || [];
      if(recs.length){
        try {
          localStorage.setItem('ourgoal_records_backup_' + uidVal, JSON.stringify(recs));
        } catch(e){}
        /* [#TASK-ES-344] REC-01: goalId·laps·durationMs·durationMinutes·visibility·isSample·title 을 meta(jsonb)에 담아 보낸다.
           checkins.meta/theme/category 컬럼이 아직 없는 DB에서는 그 칸을 빼고 재시도해 기록 저장이 끊기지 않게 한다(upsertCheckinRows) */
        /* [#TASK-ES-365] 주인 표시(user_id·ownerUid)가 지금 uid 와 다른 기록은 지금 계정 이름으로 올리지 않는다 */
        var recRows = window.OurgoalAccountIsolation.ownRecordsOnly(recs, uidVal).map(function(r){
          return window.OurgoalRecordLedger.toCheckinRow(r, uidVal);
        });
        if(recRows.length) await window.OurgoalRecordLedger.upsertCheckinRows(L.sb, recRows);
      }
      try {
        localStorage.setItem('ourgoal_profile_backup_' + uidVal, JSON.stringify({
          displayName: L.state.profile.displayName,
          bio: L.state.profile.bio || '',
          avatarUrl: L.state.profile.avatarUrl || '',
          interests: L.state.profile.interests || [],
          region: L.state.profile.region || '',
          regionPublic: !!L.state.profile.regionPublic,
          itItems: L.state.profile.itItems || []
        }));
      } catch(e){}
      var compsPayload = L.state.profile.companions || [];
      if(Array.isArray(compsPayload) && compsPayload.length){
        try { localStorage.setItem('ourgoal_companions_backup_' + uidVal, JSON.stringify(compsPayload)); } catch(e){}
      }
    } catch(e){ console.warn('Supabase sync failed:', e); }
    L.saveLocalSettings(uidVal, L.state.profile.settings);
    try { if(typeof L.syncLockScreenLiveCard === 'function') L.syncLockScreenLiveCard(false); } catch(lsErr){}
  }

  K.switchHomeDate = switchHomeDate;
  K.initDimensionSliders = initDimensionSliders;
  K.initHomeCockpit = initHomeCockpit;
  K.renderQuickCheckinGuideChips = renderQuickCheckinGuideChips;
  K.saveProfile = saveProfile;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
