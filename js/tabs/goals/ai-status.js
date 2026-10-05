/**
 * OurGoal Goal AI Status (목표 탭 — 종합상황 요약·오늘의 미션·마일스톤 완료 축하)
 *
 * #TASK-ES-436 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   computeGoalStatusHash · localGoalStatusSummary · generateGoalStatusSummary(이전 전 20142~20191줄 · 구획 「현재 종합상황 (AI 요약)」)
 *   milestonesForMission(이전 전 20240~20244줄 · 구획 「오늘의 미션」)
 *   requestTodayMission(이전 전 20249~20264줄 · 구획 「오늘의 미션」)
 *   requestNextActionSuggestion · celebrateMilestoneDone(이전 전 20348~20399줄 · 구획 「마일스톤 완료 축하 모달 (AI 다음 행동 제안)」)
 * smoke-test 가 인라인에서 잘라 가는 localTodayMission·localNextActionSuggestion 은 index.html 에 남았다.
 * refreshGoalStatusSummary 는 시험지(ai-conditional-call-optimization)가 index.html 한 파일에서 그 글자를 찾아 index.html 에 남았다.
 * 묶음의 함수 선언을 글자 그대로 옮겼다(묶음 전체가 함수뿐이면 구획 주석까지 통째로). 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>,
 * 같은 키트의 다른 세포 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓). 로드 중 바로 도는 문·최상위 변수는 index.html 원래 자리에 남았다.
 * index.html 은 IIFE 머리에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: #TASK-ES-423. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  function computeGoalStatusHash(goal){
    var parts = [goal.title||'', goal.dueDate||'', JSON.stringify(goal.result||null)];
    (goal.milestones||[]).forEach(function(m){
      parts.push(m.id, m.title||'', m.status||'', m.dueDate||'', JSON.stringify(m.result||null));
      (m.tasks||[]).forEach(function(t){ parts.push(t.id, t.title||'', t.done?'1':'0', t.dueDate||'', JSON.stringify(t.result||null)); });
    });
    var str = parts.join('|');
    var h = 0;
    for(var i=0;i<str.length;i++){ h = ((h<<5)-h + str.charCodeAt(i))|0; }
    return String(h);
  }
  function localGoalStatusSummary(goal){
    if(!goal) return '목표를 설정하고 첫 걸음을 시작해보세요.';
    var ms = goal.milestones || [];
    var total = ms.length;
    if(!total) return '마일스톤을 추가하면 세부 단계별 진행 상황을 종합 분석해드려요.';
    var done = ms.filter(function(m){ return m.status === 'done'; }).length;
    var doing = ms.find(function(m){ return m.status === 'doing'; });
    var pct = total ? Math.round((done / total) * 100) : 0;
    var ddayInfo = goal.dueDate ? ('마감 ' + L.dDay(goal.dueDate)) : '마감일 미설정';

    if(pct === 100){
      return '🎉 모든 마일스톤(' + total + '개)을 완수한 상태입니다! 최종 결과와 회고를 정리하며 다음 성장을 준비해보세요.';
    }
    if(doing){
      return '현재 "' + doing.title + '" 마일스톤에 집중하고 있으며, 전체 공정률은 ' + pct + '%(' + done + '/' + total + ' 완수, ' + ddayInfo + ')입니다. 계획에 맞추어 다음 단계를 차근차근 진행해보세요.';
    }
    if(done > 0){
      var next = ms.find(function(m){ return m.status !== 'done'; });
      var nextTitle = next ? ('다음으로 "' + next.title + '"') : '다음 단계';
      return '지금까지 ' + done + '개 마일스톤을 성공적으로 달성했습니다(진행률 ' + pct + '%). ' + nextTitle + '를 시작해보세요!';
    }
    return '목표 착수 단계입니다(진행률 0%). 첫 번째 마일스톤인 "' + ms[0].title + '"부터 작은 행동으로 실행을 개시해보세요!';
  }
  async function generateGoalStatusSummary(goal){
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, 28000);
    try{
      var res = await fetch('/api/goalstatus', {
        method:'POST', headers:{'Content-Type':'application/json'}, signal: controller.signal,
        body: JSON.stringify({ goalTitle: goal.title, milestones: L.milestonesForAI(goal), dueDate: goal.dueDate||null, goalResult: goal.result||null })
      });
      clearTimeout(timer);
      if(!res.ok) return localGoalStatusSummary(goal);
      var data = await res.json();
      var text = data && data.summary ? String(data.summary).trim() : '';
      if(!text || text.length<30 || text.length>300) return localGoalStatusSummary(goal);
      return text;
    } catch(e){ clearTimeout(timer); return localGoalStatusSummary(goal); }
  }

  function milestonesForMission(goal){
    return goal.milestones.filter(function(m){ return m.status!=='done'; }).map(function(m){
      return { title: m.title, status: m.status, tasks: (m.tasks||[]).filter(function(t){ return !t.done; }).map(function(t){ return { title: t.title }; }) };
    });
  }

  async function requestTodayMission(goal){
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, 28000);
    try{
      var res = await fetch('/api/todaymission', {
        method:'POST', headers:{'Content-Type':'application/json'}, signal: controller.signal,
        body: JSON.stringify({ goalTitle: goal.title, milestones: milestonesForMission(goal) })
      });
      clearTimeout(timer);
      if(!res.ok) return L.localTodayMission(goal);
      var data = await res.json();
      var text = data && data.mission ? String(data.mission).trim() : '';
      if(!text || text.length<6 || text.length>80) return L.localTodayMission(goal);
      return text;
    } catch(e){ clearTimeout(timer); return L.localTodayMission(goal); }
  }

  async function requestNextActionSuggestion(goal, completedMs){
    var remaining = goal.milestones.filter(function(m){ return m.id!==completedMs.id; })
      .map(function(m){ return { title:m.title, status:m.status }; });
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, 28000);
    try{
      var res = await fetch('/api/nextaction', {
        method:'POST', headers:{'Content-Type':'application/json'}, signal: controller.signal,
        body: JSON.stringify({ goalTitle: goal.title, completedTitle: completedMs.title, remaining: remaining })
      });
      clearTimeout(timer);
      if(!res.ok) return { suggestion: L.localNextActionSuggestion(goal, completedMs.id), fallback: true };
      var data = await res.json();
      var text = data && data.suggestion ? String(data.suggestion).trim() : '';
      if(!text || text.length<8 || text.length>80) return { suggestion: L.localNextActionSuggestion(goal, completedMs.id), fallback: true };
      return { suggestion: text, fallback: false };
    } catch(e){ clearTimeout(timer); return { suggestion: L.localNextActionSuggestion(goal, completedMs.id), fallback: true }; }
  }
  function celebrateMilestoneDone(goal, ms){
    if(navigator.vibrate) navigator.vibrate([12,40,24]);
    L.burstConfetti(window.innerWidth/2, window.innerHeight/3);
    var avatarSvg = (window.OurgoalAvatar && window.OurgoalAvatar.getDynamicAvatarSvg) ?
      window.OurgoalAvatar.getDynamicAvatarSvg('milestone_break', (L.state.profile && L.state.profile.settings && L.state.profile.settings.customAvatarUrl) || (L.state.profile && L.state.profile.level) || 1, { size: 84 }) :
      '';
    var greetingTxt = (window.OurgoalAvatar && window.OurgoalAvatar.DYNAMIC_SITUATIONS) ?
      window.OurgoalAvatar.DYNAMIC_SITUATIONS.milestone_break.greeting :
      '대박! 마일스톤 정복을 축하해! 🏆';
    L.openModal(
      '<div style="text-align:center;padding:8px 0;">' +
        (avatarSvg ? '<div style="display:flex;justify-content:center;margin-bottom:12px;">' + avatarSvg + '</div>' : '') +
        '<h3 style="margin:0 0 6px;font-size:1.1875rem;font-weight:900;color:var(--ink);">마일스톤 돌파 달성! 🏆</h3>' +
        '<div style="font-size:0.875rem;font-weight:700;color:var(--primary);margin-bottom:10px;">' + greetingTxt + '</div>' +
        '<p class="muted" style="margin:0 0 14px;font-size:0.9375rem;"><b style="color:var(--ink);">' + L.escapeHtml(ms.title) + '</b></p>' +
        '<p class="faint" id="naText" style="margin:0 0 16px;">다음 행동을 생각하는 중...</p>' +
        '<div id="naNotice" style="display:none;font-size:12px;color:var(--ink-soft);margin:-10px 0 14px;line-height:1.4;">⚡ 오프라인 상태 또는 아워골 서버 문제로 기본 안내가 생성되었습니다</div>' +
        '<div class="modal-actions"><button class="btn btn-primary" id="naOk" type="button" style="min-height:38px;">확인</button></div>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#naOk').addEventListener('click', L.closeModal);
        requestNextActionSuggestion(goal, ms).then(function(res){
          var el = sheet.querySelector('#naText');
          var notice = sheet.querySelector('#naNotice');
          if(res && typeof res === 'object'){
            if(el) el.textContent = '' + (res.suggestion || '');
            if(notice && res.fallback) notice.style.display = 'block';
          } else {
            if(el) el.textContent = '' + res;
          }
        });
      }
    );
  }

  K.computeGoalStatusHash = computeGoalStatusHash;
  K.localGoalStatusSummary = localGoalStatusSummary;
  K.generateGoalStatusSummary = generateGoalStatusSummary;
  K.milestonesForMission = milestonesForMission;
  K.requestTodayMission = requestTodayMission;
  K.requestNextActionSuggestion = requestNextActionSuggestion;
  K.celebrateMilestoneDone = celebrateMilestoneDone;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
