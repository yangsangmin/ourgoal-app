/**
 * OurGoal Quick Checkin (미사용 빠른 체크인 캡처본 유지)
 *
 * G062 5대 테마 온톨로지에서 분리되지 않고 원본에 남았던 buildCheckinRecord와 saveQuickCheckin을 세포로 옮긴다.
 * 미사용 함수이나 제품 및 법정의 동작 보존을 위해 그대로 옮긴다.
 * #TASK-ES-600(빠른 체크인 분리 (G062 잔여)): index.html 인라인 IIFE 의 구간(이전 전 3983~4006 · 4007~4082줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 3983~4006줄(#TASK-ES-600 생성기 표지) ---- */
  /* ============ 5대 테마 온톨로지 & 경량 AI 분류기 (TASK-OG-001) ============ */
  /* [#TASK-ES-569] RECORD_THEMES · THEME_KEYWORDS · THEME_REGEX_RULES · CATEGORY_THEME_MAP · classifyRecordTheme → js/tabs/records/theme-classifier.js 로 옮김(기록 테마 분류와 공용 토스트 표시 책임 분열 — 앞 주석 포함) */

  /* 온보딩 첫 기록용 체크인 저장 — 데이터 부수효과만 수행하고 홈 DOM(captureSave 핸들러)은 건드리지 않는다. 성장 백로그 P0 3.5 / 거시 A4 */
  function buildCheckinRecord(text, goal){
    var cat = goal ? goal.category : null;
    var classified = (typeof L.classifyRecordTheme === 'function')
      ? L.classifyRecordTheme(text, cat)
      : { theme: 'daily', subTheme: '', confidence: 0.5 };
    var now = L.nowISO();
    return {
      id: L.newId(),
      type: 'note',
      text: text,
      startAt: now,
      endAt: now,
      createdAt: now,
      category: cat,
      visibility: 'private',
      theme: classified.theme,
      subTheme: classified.subTheme,
      themeConfidence: classified.confidence
    };
  }
  /* ---- 이전 전 index.html 4007~4082줄(#TASK-ES-600 생성기 표지) ---- */
  async function saveQuickCheckin(text, goal, source){
    var isFirst = L.state.profile.records.length === 0;
    L.state.profile.records.unshift(buildCheckinRecord(text, goal));
    var xpRes = L.awardXP(L.XP_RULES.checkin, '체크인');
    L.maybeGrantStreakFreeze();
    L.maybeGrantAvatarCraftBonus();
    if(isFirst && L.state.profile.settings){
      if(!L.state.profile.settings.streakFreeze) L.state.profile.settings.streakFreeze = { available:0, usedDates:[], grantedTier:0 };
      if(L.state.profile.settings.streakFreeze.available === 0){
        L.state.profile.settings.streakFreeze.available = 1;
      }
    }
    await L.saveProfile();
    try{ L.updateAppBadge(L.computeStreakDays()); }catch(e){}
    try{
      if(window.OurgoalEvents && typeof window.OurgoalEvents.emit === 'function'){
        window.OurgoalEvents.emit('checkin:created', L.state.profile.records[0]);
        window.OurgoalEvents.emit('record:saved', L.state.profile.records[0]);
      }
      if(window.OurgoalStore && typeof window.OurgoalStore.set === 'function'){
        window.OurgoalStore.set('profile.records', L.state.profile.records);
      }
    }catch(evErr){ console.warn('[saveQuickCheckin] OurgoalEvents error:', evErr); }
    try{ if(typeof L.dispatchFullViewPropagation === 'function') L.dispatchFullViewPropagation(); }catch(propErr){ console.warn('[saveQuickCheckin] propagation warning:', propErr); }

    // 👥 참여 중인 팀 단체방 자동 인증 브릿지 (#TASK-CHECKIN-TEAM-CERTIFICATION)
    try {
      var joinedTeams = (typeof L.MOCK_GROUPS !== 'undefined' ? L.MOCK_GROUPS : []).filter(function(g){
        return typeof L.groupState === 'function' && L.groupState(g.id).joined;
      });
      if(joinedTeams.length > 0){
        var myName = (L.state.profile && (L.state.profile.displayName || L.state.profile.name)) || '팀원';
        var myId = (L.state.profile && L.state.profile.id) || 'guest';
        var gTitle = goal ? goal.title : '오늘의 실천 과제';
        joinedTeams.forEach(function(team){
          var certMsg = '✅ [오늘의 인증] ' + myName + '님이 "' + gTitle + '" 체크인을 완료했습니다! (' + String(text || '').slice(0, 40) + ')';
          if(typeof L.groupState === 'function'){
            var gs = L.groupState(team.id);
            gs.chatMessages = gs.chatMessages || [];
            gs.chatMessages.push({
              sender: myName,
              text: certMsg,
              time: '방금',
              isMe: true
            });
          }
          if(window.sb){
            window.sb.from('team_pings').insert({
              id: 'ping_cert_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
              group_id: team.id,
              sender_id: myId,
              sender_name: myName,
              target_type: 'checkin_certification',
              target_id: team.id,
              target_title: gTitle,
              ping_type: 'checkin_cert',
              message: certMsg,
              status: 'active',
              created_at: new Date().toISOString()
            }).then(function(){}).catch(function(){});
          }
        });
      }
    } catch(certErr){ console.warn('[saveQuickCheckin] team certification broadcast warning:', certErr); }

    L.track('checkin', { first: isFirst, has_goal: !!goal, len: text.length<20 ? 's' : (text.length<80 ? 'm' : 'l'), source: source || 'quick' });
    L.track('checkin_completed', { source: source || 'quick', goal_type: goal && goal.category, day_index: L.dayIndexSinceSignup() });
    if(isFirst){
      L.triggerFirstCheerResponse(goal, text);
    }
    // [#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시 안전 백업 넛지
    try {
      if(typeof L.checkGuestBackupNudge === 'function') L.checkGuestBackupNudge();
    } catch(e){}
    return xpRes;
  }

  K.buildCheckinRecord = buildCheckinRecord;
  K.saveQuickCheckin = saveQuickCheckin;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
