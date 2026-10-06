/**
 * OurGoal Today Mission (홈 — 오늘 미션 해시·카드)
 *
 * 목표·기록 기반 해시와 오늘 미션 카드의 캐시·펼침/접기·비동기 저장 재렌더. 기존 AI 요청 함수·통로·window 노출·버그를 보존한다. 홈 키트를 통째 대입하는 index.js 뒤에 태그를 둔다.
 * #TASK-ES-576(오늘 미션 해시·카드 렌더 책임 분열): index.html 인라인 IIFE 의 구간(이전 전 5351~5357 · 5361~5426줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalHomeMegaBlock = global.OurgoalHomeMegaBlock || {};

  /* ---- 이전 전 index.html 5351~5357줄(#TASK-ES-576 생성기 표지) ---- */
  function computeTodayMissionHash(g){
    var baseHash = typeof L.computeGoalStatusHash === 'function' ? L.computeGoalStatusHash(g) : String(g.title||'');
    var recs = (L.state.profile && L.state.profile.records) || [];
    var lastRec = recs.find(function(r){ return r.goalId === g.id || r.category === g.category; });
    var recPart = lastRec ? (lastRec.id + ':' + (lastRec.startAt || lastRec.date || '')) : '';
    return baseHash + (recPart ? (':' + recPart) : '');
  }

  /* ---- 이전 전 index.html 5361~5426줄(#TASK-ES-576 생성기 표지) ---- */
  function renderTodayMissionCard(){
    var el = document.getElementById('todayMissionCard');
    if(!el || !L.state.profile) return;
    var goals = L.state.profile.goals.filter(function(g){ return !g.archivedAt; });
    if(!goals.length){ el.innerHTML = ''; return; }
    var today = typeof L.getEffectiveStandardDateKey === 'function' ? L.getEffectiveStandardDateKey(L.nowISO()) : L.dateKey(L.nowISO());
    var missions = L.state.profile.settings.todayMissions || {};

    function missionRowHtml(g){
      var m = missions[g.id];
      var gHash = computeTodayMissionHash(g);
      var isCacheValid = !!(m && m.text && m.date === today && (!m.hash || m.hash === gHash));
      var text = isCacheValid ? m.text : '생각하는 중...';
      return '<div class="mission-row"><span class="m-icon"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg></span><span><span class="m-goal">'+L.escapeHtml(g.title)+'</span> · <span class="m-text">'+L.escapeHtml(text)+'</span></span></div>';
    }

    var firstGoal = goals[0];
    var restGoals = goals.slice(1);
    var isExpanded = !!L.state.missionAccordionOpen;

    var moreBtnHtml = restGoals.length > 0 ?
      ('<button class="btn btn-ghost btn-sm mission-more-btn" id="btnToggleMissionAccordion" type="button" style="font-size:.6875rem;padding:1px 6px;color:var(--ink-soft);border-color:var(--rule);line-height:1.2;">' +
        (isExpanded ? '접기 ▴' : ('외 ' + restGoals.length + '개 미션 더보기 ▾')) +
      '</button>') : '';

    var restHtml = (restGoals.length > 0) ?
      ('<div id="missionRestList" style="display:' + (isExpanded ? 'block' : 'none') + ';">' +
        restGoals.map(missionRowHtml).join('') +
      '</div>') : '';

    el.innerHTML = '<div class="mission-card" style="padding:10px 14px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;"><div class="ct-label" style="margin:0;">오늘의 카드</div><span class="today-card-guide-hint" title="뭘 할지 모르겠을 때 도움돼요(내 목표기반)">뭘 할지 모르겠을 때 도움돼요(내 목표기반)</span></div>' +
        moreBtnHtml +
      '</div>' +
      missionRowHtml(firstGoal) +
      restHtml +
    '</div>';

    var toggleBtn = el.querySelector('#btnToggleMissionAccordion');
    if(toggleBtn){
      toggleBtn.onclick = function(){
        L.state.missionAccordionOpen = !L.state.missionAccordionOpen;
        renderTodayMissionCard();
      };
    }
    goals.forEach(function(g){
      var m = missions[g.id];
      var gHash = computeTodayMissionHash(g);
      var isCacheValid = !!(m && m.text && m.date === today && (!m.hash || m.hash === gHash));
      if(isCacheValid){
        if(m && !m.hash){ m.hash = gHash; }
        return;
      }
      if(!L.state.todayMissionPending) L.state.todayMissionPending = {};
      if(L.state.todayMissionPending[g.id]) return;
      L.state.todayMissionPending[g.id] = true;
      L.requestTodayMission(g).then(async function(text){
        delete L.state.todayMissionPending[g.id];
        if(!L.state.profile.settings.todayMissions) L.state.profile.settings.todayMissions = {};
        L.state.profile.settings.todayMissions[g.id] = { date: today, text: text, hash: gHash, updatedAt: L.nowISO() };
        await L.saveProfile();
        if(L.state.activeTab==='home') renderTodayMissionCard();
      });
    });
  }

  K.computeTodayMissionHash = computeTodayMissionHash;
  K.renderTodayMissionCard = renderTodayMissionCard;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
