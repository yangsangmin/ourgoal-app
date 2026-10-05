/**
 * OurGoal Virtual-User Helpers (기관 — 가상유저 개선 10대 헬퍼)
 *
 * 「가상유저 개선 10대 핵심 헬퍼 함수」 묶음을 글자 그대로 옮겼다(고치지 않음 — 발견 사항은 #TASK-ES-471 REQ 에 적었다).
 * #TASK-ES-471(인라인 어려움 기관 묶음 이전 1차): index.html 인라인 IIFE 의 구간(이전 전 3189~3212 · 3213~3216 · 3218~3227 · 3228~3257 · 3258~3283 · 3284~3291 · 3292~3299 · 3300~3331줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 3189~3212줄(#TASK-ES-471 생성기 표지) ---- */
  function triggerHaptic(pattern){
    var HAPTIC_PATTERNS = {
      tap: 12,
      light: 8,
      checkin: [12, 35, 18],
      streak: [20, 45, 30],
      success: [15, 30, 25],
      drag: 10,
      warning: [25, 40, 25]
    };
    try{
      if(typeof navigator !== 'undefined' && navigator && navigator.vibrate){
        var p = pattern;
        if(typeof pattern === 'string' && HAPTIC_PATTERNS[pattern]){
          p = HAPTIC_PATTERNS[pattern];
        } else if(p === undefined || p === null){
          p = 12;
        }
        navigator.vibrate(p);
        return true;
      }
    }catch(e){}
    return false;
  }
  /* ---- 이전 전 index.html 3213~3216줄(#TASK-ES-471 생성기 표지) ---- */

  function triggerHapticFeedback(pattern){
    return triggerHaptic(pattern || 12);
  }

  /* ---- 이전 전 index.html 3218~3227줄(#TASK-ES-471 생성기 표지) ---- */

  function reorderMilestones(goal, fromIdx, toIdx){
    if(!goal || !goal.milestones || !Array.isArray(goal.milestones)) return [];
    var list = goal.milestones.slice();
    if(fromIdx < 0 || fromIdx >= list.length || toIdx < 0 || toIdx >= list.length) return list;
    var item = list.splice(fromIdx, 1)[0];
    list.splice(toIdx, 0, item);
    goal.milestones = list;
    return list;
  }
  /* ---- 이전 전 index.html 3228~3257줄(#TASK-ES-471 생성기 표지) ---- */

  function filterFeedByCategory(items, categoryKey){
    if(!categoryKey || categoryKey === 'all') return (items || []).slice();
    var key = String(categoryKey).toLowerCase();
    var validCategories = ['study','dev','workout','running','diet','career','sideproject','finance','life','morning','parenting','pet','relation','reading','hobby','mental','clean','travel'];
    if(validCategories.indexOf(key) === -1) return (items || []).slice();
    return (items || []).filter(function(item){
      if(item.category && String(item.category).toLowerCase() === key) return true;
      var text = ((item.goal || '') + ' ' + (item.action || '') + ' ' + (item.category || '')).toLowerCase();
      if(key === 'study') return /토익|공부|시험|자격증|수험|독서실|회독|강의|leet|cpa|노무사|간호|국시|기출/.test(text);
      if(key === 'dev') return /개발|코딩|깃허브|알고리즘|오픈소스|백준|디자인|ui|ux|saas|프론트|백엔드/.test(text);
      if(key === 'workout') return /운동|헬스|러닝|체력|바디프로필|웨이트|필라테스|테니스|수영|인터벌|근력/.test(text);
      if(key === 'running') return /러닝|달리기|마라톤|조깅|페이스트레이닝|10k|하프마라톤|풀코스/.test(text);
      if(key === 'diet') return /식단|다이어트|칼로리|단백질|클린식단|간헐적단식|체중|샐러드/.test(text);
      if(key === 'career') return /취업|인턴|이직|창업|매출|사업|마케터|세일즈|영업|스타트업|hr|포트폴리오|이력서|면접|직무|승진/.test(text);
      if(key === 'sideproject') return /사이드프로젝트|창업|사업|매출|수익화|bm|출시|런칭|고객/.test(text);
      if(key === 'finance') return /재테크|투자|주식|저축|가계부|부동산|예금|펀드|소비|자산/.test(text);
      if(key === 'life') return /생활|습관|루틴|일상|규칙|절제|라이프|하루/.test(text);
      if(key === 'morning') return /기상|모닝루틴|미라클모닝|새벽기상|기상인증|아침시간|수면패턴/.test(text);
      if(key === 'parenting') return /육아|자녀|아이|등하원|이유식|부모|가정|어린이집|유치원/.test(text);
      if(key === 'pet') return /반려동물|강아지|고양이|산책|반려견|반려묘|펫/.test(text);
      if(key === 'relation') return /관계|인간관계|가족|친구|연애|결혼|소통|대화|부부/.test(text);
      if(key === 'reading') return /독서|책|서평|인문|독서모임|완독|필사|리딩/.test(text);
      if(key === 'hobby') return /음악|그림|공연|웹툰|댄스|사진|자작곡|뮤지컬|베이커리|로스팅|공예/.test(text);
      if(key === 'mental') return /멘탈|마인드|명상|일기|감사|회고|스트레스|휴식|힐링|마음/.test(text);
      if(key === 'clean') return /정리|청소|미니멀|비우기|청결|방청소|분리수거/.test(text);
      if(key === 'travel') return /여행|아웃도어|등산|캠핑|트레킹|나들이|휴가/.test(text);
      return false;
    });
  }
  /* ---- 이전 전 index.html 3258~3283줄(#TASK-ES-471 생성기 표지) ---- */

  function calculateWeeklyFocusStats(records){
    var now = new Date();
    var sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    var recs = (records || []).filter(function(r){
      return r && r.startAt && (new Date(r.startAt) >= sevenDaysAgo);
    });
    var totalSessions = recs.length;
    var totalMins = 0;
    var daysSet = {};
    recs.forEach(function(r){
      var k = L.dateKey(r.startAt);
      daysSet[k] = true;
      if(r.endAt && r.startAt){
        var m = Math.round((new Date(r.endAt) - new Date(r.startAt)) / 60000);
        if(m > 0 && m < 1440) totalMins += m;
      } else {
        totalMins += 25;
      }
    });
    return {
      totalSessions: totalSessions,
      totalMinutes: totalMins,
      activeDays: Object.keys(daysSet).length
    };
  }
  /* ---- 이전 전 index.html 3284~3291줄(#TASK-ES-471 생성기 표지) ---- */

  function exportRecordsToCsv(records, themeKey){
    var list = records || [];
    if(themeKey && themeKey !== 'all'){
      list = list.filter(function(r){ return (r.theme || 'daily') === themeKey; });
    }
    return '\uFEFF' + L.buildCSV(list);
  }
  /* ---- 이전 전 index.html 3292~3299줄(#TASK-ES-471 생성기 표지) ---- */

  function exportRecordsToMarkdown(records, themeKey, includePrompt){
    var list = records || [];
    if(themeKey && themeKey !== 'all'){
      list = list.filter(function(r){ return (r.theme || 'daily') === themeKey; });
    }
    return L.buildMarkdownExport(list, themeKey || 'all', !!includePrompt);
  }
  /* ---- 이전 전 index.html 3300~3331줄(#TASK-ES-471 생성기 표지) ---- */

  var OfflineSyncManager = {
    QUEUE_KEY: 'ourgoal_offline_sync_queue',
    getQueue: function(){
      try{
        var raw = (typeof localStorage !== 'undefined' && localStorage) ? localStorage.getItem(this.QUEUE_KEY) : null;
        return raw ? JSON.parse(raw) : [];
      }catch(e){ return []; }
    },
    enqueue: function(action){
      var q = this.getQueue();
      var item = { id: (typeof L.uid === 'function' ? L.uid('act') : 'act_' + Date.now()), action: action, timestamp: (typeof L.nowISO === 'function' ? L.nowISO() : new Date().toISOString()) };
      q.push(item);
      try{ if(typeof localStorage !== 'undefined' && localStorage) localStorage.setItem(this.QUEUE_KEY, JSON.stringify(q)); }catch(e){}
      return q.length;
    },
    clear: function(){
      try{ if(typeof localStorage !== 'undefined' && localStorage) localStorage.removeItem(this.QUEUE_KEY); }catch(e){}
    },
    flush: async function(syncHandler){
      var q = this.getQueue();
      if(!q.length) return 0;
      var count = q.length;
      if(typeof syncHandler === 'function'){
        for(var i=0; i<q.length; i++){
          try { await syncHandler(q[i]); }catch(e){}
        }
      }
      this.clear();
      return count;
    }
  };

  K.triggerHaptic = triggerHaptic;
  K.triggerHapticFeedback = triggerHapticFeedback;
  K.reorderMilestones = reorderMilestones;
  K.filterFeedByCategory = filterFeedByCategory;
  K.calculateWeeklyFocusStats = calculateWeeklyFocusStats;
  K.exportRecordsToCsv = exportRecordsToCsv;
  K.exportRecordsToMarkdown = exportRecordsToMarkdown;
  K.OfflineSyncManager = OfflineSyncManager;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
