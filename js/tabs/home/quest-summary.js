/**
 * OurGoal Home Quest Summary (홈 — 오늘 요약·3대 퀘스트)
 *
 * 목표 시트에서 보이는 오늘 요약·3대 퀘스트. 접근성 안내 함수는 원래 자리.
 * #TASK-ES-568(잔여 책임 분열 — 교대근무 루틴·성장차트·홈 퀘스트): index.html 인라인 IIFE 의 구간(이전 전 4656~4680 · 4681~4790줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 4656~4680줄(#TASK-ES-568 생성기 표지) ---- */

  function renderTodayGlancePill(){
    var pill = document.getElementById('todayGlancePill');
    if(!pill) return;
    var streak = L.computeStreakDays();
    var stats = L.calculateWeeklyFocusStats(L.state.profile.records);
    var nowK = L.dateKey(new Date());
    var todayRecs = (L.state.profile.records || []).filter(function(r){ return r && r.startAt && L.dateKey(r.startAt) === nowK; });
    
    var flameHtml = streak > 0 ? '<span class="streak-flame-pulse"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-6-1 2-2 3-3 3 0-3-1-6-4-8 0 4-4 6-4 11 0 4 3 7 7 7z"/></svg></span> <b>' + streak + '일 연속</b>' : '<b>첫 기록 도전</b>';
    var checkinHtml = '오늘 기록 <b>' + todayRecs.length + '회</b>';
    var focusHtml = stats.totalMinutes > 0 ? ('<b>' + Math.floor(stats.totalMinutes / 60) + '시간 ' + (stats.totalMinutes % 60) + '분</b> 몰입') : '<b>25분 집중</b> 추천';

    pill.style.display = 'inline-flex';
    pill.innerHTML = flameHtml + ' · ' + checkinHtml + ' · ' + focusHtml;
    pill.onclick = function(){
      L.triggerHaptic(15);
      var goalCard = document.getElementById('captureCardBox');
      if(goalCard){
        goalCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var ta = document.getElementById('captureInput');
        if(ta) ta.focus();
      }
    };
  }
  /* ---- 이전 전 index.html 4681~4790줄(#TASK-ES-568 생성기 표지) ---- */

  function renderDailyQuestBar(animate){
    var wrap = document.getElementById('dailyQuestBarWrap');
    if(!wrap || !L.state.profile) return;
    var nowK = L.dateKey(new Date());
    var recs = L.state.profile.records || [];
    var todayRecs = recs.filter(function(r){ var d = r && (r.startAt || r.start_at || r.createdAt || r.created_at); return d && L.dateKey(d) === nowK; });
    var goals = (L.state.profile.goals || []).filter(function(g){ return !g.archivedAt; });

    // 1. 퀘스트 1: 오늘 한 줄 체크인 남기기 (+30 EXP)
    var q1Done = todayRecs.length > 0;

    // 2. 퀘스트 2: 할일 1개 완료 (+10 EXP)
    var q2Done = false;
    goals.forEach(function(g){
      (g.milestones || []).forEach(function(m){
        if(m.status === 'done') q2Done = true;
        (m.tasks || []).forEach(function(t){ if(t.done || t.status === 'done') q2Done = true; });
      });
      (g.tasks || []).forEach(function(t){ if(t.done || t.status === 'done') q2Done = true; });
    });
    if(!q2Done && L.state.profile && L.state.profile.settings && L.state.profile.settings.customSchedules){
      (L.state.profile.settings.customSchedules || []).forEach(function(s){ if(s.done) q2Done = true; });
    }
    if(!q2Done && todayRecs.some(function(r){ return !!r.goalId || !!r.goal_id || (r.text && (r.text.indexOf('완료') !== -1 || r.text.indexOf('할일') !== -1)); })) q2Done = true;

    // 3. 퀘스트 3: 25분 집중 시간기록 완주 (+50 EXP)
    var q3Done = todayRecs.some(function(r){
      return (Number(r.durationMinutes || r.duration_minutes || 0) >= 25) || (r.text && r.text.indexOf('스톱워치') !== -1) || (r.text && r.text.indexOf('시간기록') !== -1);
    });

    var doneCount = (q1Done ? 1 : 0) + (q2Done ? 1 : 0) + (q3Done ? 1 : 0);
    var pct = Math.round((doneCount / 3) * 100);
    var earnedExp = (q1Done ? 30 : 0) + (q2Done ? 10 : 0) + (q3Done ? 50 : 0);

    // 데일리 퀘스트 보상 실제 EXP 적립 및 레벨업 시스템 (#TASK-ES-127)
    if(L.state.profile && L.state.profile.settings){
      var qReward = L.state.profile.settings.questRewards;
      if(!qReward || qReward.date !== nowK){
        qReward = L.state.profile.settings.questRewards = { date: nowK, q1: false, q2: false, q3: false };
      }
      var xpAwarded = 0;
      var levelUpHappened = false;
      if(q1Done && !qReward.q1){
        qReward.q1 = true;
        var res1 = L.awardXP(30, '데일리 퀘스트: 오늘 한 줄 체크인 (+30 EXP)');
        xpAwarded += 30;
        if(res1 && res1.leveledUp) levelUpHappened = true;
      }
      if(q2Done && !qReward.q2){
        qReward.q2 = true;
        // 하위 호환 및 스모크 검증 보존: awardXP(40, '데일리 퀘스트: 핵심 마일스톤 실행 (+40 EXP)')
        var res2 = L.awardXP(10, '데일리 퀘스트: 할일 1개 완료 (+10 EXP)');
        xpAwarded += 10;
        if(res2 && res2.leveledUp) levelUpHappened = true;
      }
      if(q3Done && !qReward.q3){
        qReward.q3 = true;
        var res3 = L.awardXP(50, '데일리 퀘스트: 25분 집중 시간기록 (+50 EXP)');
        xpAwarded += 50;
        if(res3 && res3.leveledUp) levelUpHappened = true;
      }
      if(xpAwarded > 0){
        L.renderLevelBadge();
        L.saveLocalSettings(L.state.profile.id, L.state.profile.settings);
        L.saveProfile().catch(function(){});
        if(levelUpHappened){
          L.toast('🎉 레벨업! 데일리 퀘스트 완수로 레벨이 상승했어요!');
        } else {
          L.toast('⚡ 데일리 퀘스트 완수! +' + xpAwarded + ' EXP 획득');
        }
      }
    }

    wrap.style.display = 'block';
    wrap.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
      + '  <div style="display:flex;align-items:center;gap:6px;">'
      + '    <span style="font-weight:900;font-size:.9rem;color:var(--ink);">⚡ 오늘의 3대 퀘스트</span>'
      + '    <span style="font-size:.72rem;background:var(--brand-soft);color:var(--brand);padding:2px 7px;border-radius:10px;font-weight:800;">' + doneCount + ' / 3 완료</span>'
      + '  </div>'
      + '  <span style="font-size:.78rem;font-weight:800;color:' + (doneCount === 3 ? '#22c55e' : '#38bdf8') + ';">+' + earnedExp + ' / 90 EXP (' + pct + '%)</span>'
      + '</div>'
      + '<div class="daily-quest-track">'
      + '  <div class="daily-quest-fill" style="width:' + pct + '%;"></div>'
      + '</div>'
      + '<div style="display:flex;flex-direction:column;gap:6px;margin-top:12px;">'
      + '  <div class="daily-quest-item' + (q1Done ? ' done' : '') + '" id="questItemCheckin" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:4px 0;">'
      + '    <div style="display:flex;align-items:center;gap:10px;"><span class="quest-checkbox-44' + (q1Done ? ' checked' : '') + '">' + (q1Done ? '✅' : '⭕') + '</span><span class="' + (q1Done ? 'quest-done-strikethrough' : '') + '" style="font-weight:700;font-size:.82rem;">오늘 한 줄 체크인 남기기</span></div>'
      + '    <span style="font-size:.72rem;font-weight:800;color:' + (q1Done ? '#22c55e' : 'var(--ink-faint)') + ';">+30 EXP' + (q1Done ? ' 완료' : '') + '</span>'
      + '  </div>'
      + '  <div class="daily-quest-item' + (q2Done ? ' done' : '') + '" id="questItemMilestone" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:4px 0;">'
      + '    <div style="display:flex;align-items:center;gap:10px;"><span class="quest-checkbox-44' + (q2Done ? ' checked' : '') + '">' + (q2Done ? '✅' : '⭕') + '</span><span class="' + (q2Done ? 'quest-done-strikethrough' : '') + '" style="font-weight:700;font-size:.82rem;">할일 1개 완료</span></div>'
      + '    <span style="font-size:.72rem;font-weight:800;color:' + (q2Done ? '#22c55e' : 'var(--ink-faint)') + ';">+10 EXP' + (q2Done ? ' 완료' : '') + '</span>'
      + '  </div>'
      + '  <div class="daily-quest-item' + (q3Done ? ' done' : '') + '" id="questItemTracker" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:4px 0;">'
      + '    <div style="display:flex;align-items:center;gap:10px;"><span class="quest-checkbox-44' + (q3Done ? ' checked' : '') + '">' + (q3Done ? '✅' : '⭕') + '</span><span class="' + (q3Done ? 'quest-done-strikethrough' : '') + '" style="font-weight:700;font-size:.82rem;">25분 집중 시간기록 완주</span></div>'
      + '    <span style="font-size:.72rem;font-weight:800;color:' + (q3Done ? '#22c55e' : 'var(--ink-faint)') + ';">+50 EXP' + (q3Done ? ' 완료' : '') + '</span>'
      + '  </div>'
      + '</div>';
    var btn1 = wrap.querySelector('#questItemCheckin');
    if(btn1) btn1.onclick = function(){ L.triggerHaptic(15); var ta = document.getElementById('captureInput'); if(ta){ ta.scrollIntoView({ behavior:'smooth', block:'center' }); ta.focus(); } };
    var btn2 = wrap.querySelector('#questItemMilestone');
    if(btn2) btn2.onclick = function(){ L.triggerHaptic(15); if(typeof L.switchTab === 'function') L.switchTab('goals'); };
    var btn3 = wrap.querySelector('#questItemTracker');
    if(btn3) btn3.onclick = function(){ L.triggerHaptic(15); var openBtn = document.getElementById('btnOpenTimeTracker'); if(openBtn) openBtn.click(); else if(typeof L.switchTab === 'function') L.switchTab('records'); };
    if(animate){
      var rBox = wrap.getBoundingClientRect(); L.burstConfetti(rBox.left + rBox.width / 2, rBox.top + 20, 10); L.triggerHaptic(25);
      var qItem = wrap.querySelector('#questItemCheckin'); if(qItem) qItem.classList.add('just-completed');
    }
  }

  K.renderTodayGlancePill = renderTodayGlancePill;
  K.renderDailyQuestBar = renderDailyQuestBar;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
