/**
 * OurGoal Notification Helper (설정 — DND 판별·동적 알림 문구)
 *
 * 알림 타이머가 사용하는 방해금지 시간 판별과 맥락별 알림 문구. 기존 스코프 getter·타이머 호출 순서를 보존한다.
 * #TASK-ES-572(알림 헬퍼·목표 상세 서랍 책임 분열): index.html 인라인 IIFE 의 구간(이전 전 7927~7947 · 7948~7999줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 7927~7947줄(#TASK-ES-572 생성기 표지) ---- */
  /* ============ 방해금지 시간대(DND, 조용한 시간) 판별 순수 함수 (TASK-BG-7) ============ */
  function isWithinDND(now, dndSettings){
    if(!dndSettings) return false;
    var cfg = dndSettings.dnd || dndSettings;
    var enabled = cfg.enabled !== undefined ? cfg.enabled : cfg.quietHoursEnabled;
    if(!enabled) return false;
    var start = cfg.start || cfg.quietHoursStart || '22:00';
    var end = cfg.end || cfg.quietHoursEnd || '08:00';
    var sParts = String(start).split(':').map(Number);
    var eParts = String(end).split(':').map(Number);
    var sMin = (sParts[0] || 0) * 60 + (sParts[1] || 0);
    var eMin = (eParts[0] || 0) * 60 + (eParts[1] || 0);
    now = now || new Date();
    var curMin = now.getHours() * 60 + now.getMinutes();
    if(sMin === eMin) return false;
    if(sMin < eMin){
      return curMin >= sMin && curMin < eMin;
    } else {
      return curMin >= sMin || curMin < eMin;
    }
  }
  /* ---- 이전 전 index.html 7948~7999줄(#TASK-ES-572 생성기 표지) ---- */
  /* ============ 맥락 기반 다이내믹 알림 문구 생성 ============ */
  function generateDynamicNotification(profile, now){
    now = now || new Date();
    if(profile && profile.settings && isWithinDND(now, profile.settings)){
      return null;
    }
    now = now || new Date();
    var today = new Date(now); today.setHours(0,0,0,0);
    var goals = (profile.goals || []).filter(function(g){ return !g.archivedAt && g.dueDate; });
    var soonest = null;
    goals.forEach(function(g){
      var target = new Date(g.dueDate+'T00:00:00');
      var daysLeft = Math.round((target-today)/86400000);
      if(daysLeft>=0 && daysLeft<=3 && (!soonest || daysLeft<soonest.daysLeft)){
        soonest = { goal:g, daysLeft:daysLeft };
      }
    });
    if(soonest){
      return '[D-day 임박] '+soonest.goal.title+' 마감까지 '+soonest.daysLeft+'일 남았어요! 오늘 마일스톤을 체크해보세요 🔥';
    }
    var checkedToday = (profile.records || []).some(function(r){ return L.dateKey(r.startAt)===L.dateKey(now.toISOString()); });
    var hourNow = now.getHours();
    if(!checkedToday && hourNow>=20){
      // 오늘 체크인 전이라 computeStreakDays()(오늘 포함 기준)는 항상 0이 되므로,
      // "지금 끊기려는 중인 스트릭"은 어제까지의 연속 기록으로 따로 센다.
      var recs = profile.records || [];
      var frozen = (profile.settings && profile.settings.streakFreeze && profile.settings.streakFreeze.usedDates) || [];
      var days = {};
      recs.forEach(function(r){ days[L.dateKey(r.startAt)] = true; });
      frozen.forEach(function(k){ days[k] = true; });
      var cursor = new Date(today); cursor.setDate(cursor.getDate()-1);
      var priorStreak = 0;
      while(days[cursor.getFullYear()+'-'+L.pad(cursor.getMonth()+1)+'-'+L.pad(cursor.getDate())]){
        priorStreak++;
        cursor.setDate(cursor.getDate()-1);
      }
      if(priorStreak>0){
        return '[스트릭 경보] '+priorStreak+'일 연속 불꽃이 꺼지기 직전이에요! 오늘 한 일을 10초 만에 남겨보세요 ⏰';
      }
    }
    // 일요일 저녁(18~22시) 주간 성취 리캡 (TASK-BG-8)
    if(now.getDay() === 0 && hourNow >= 18 && hourNow <= 22 && (profile.records || []).length > 0){
      return '[위클리 리캡] 이번 주 나의 성취가 정리되었어요! 지난 7일간의 기록과 테마 분석을 확인해보세요 🏆';
    }
    var s = profile.settings || {};
    var joinedGroup = L.MOCK_GROUPS.find(function(g){ return s.groupState && s.groupState[g.id] && s.groupState[g.id].joined; });
    if(joinedGroup){
      var n = (joinedGroup.activity || []).length;
      return '[팀 인증] '+joinedGroup.name+' 팀원들이 오늘 '+n+'회 인증했어요! 함께 달려볼까요? 🏃';
    }
    return (profile.displayName||'회원')+'님, 오늘의 성장을 기록할 시간이에요 ✨';
  }

  K.isWithinDND = isWithinDND;
  K.generateDynamicNotification = generateDynamicNotification;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
