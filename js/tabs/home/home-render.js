/**
 * OurGoal Home Render (홈 — 홈 화면 그리기)
 *
 * 「RENDER: HOME」 묶음 전체(renderHome). 홈 큰 세포 키트 OurgoalHomeMegaBlock 은 js/tabs/home/index.js 가 통째로 대입하므로 그 태그 뒤에 둔다(유형 M).
 * #TASK-ES-556(인라인 3단계 구역 Z6 표준 3): index.html 인라인 IIFE 의 구간(이전 전 4614~4826줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 4614~4826줄(#TASK-ES-556 생성기 표지) ---- */
  /* ============ RENDER: HOME ============ */
  function renderHome(){
    if(typeof L.initHomeCockpit === 'function') L.initHomeCockpit();
    L.renderQuickCheckinGuideChips();
    if(window.OurgoalHomeOneScreen && typeof window.OurgoalHomeOneScreen.refreshAvatar === 'function'){
      window.OurgoalHomeOneScreen.refreshAvatar();
    }
    L.refreshCustomFeedbackButtons();
    L.renderLevelBadge();
    L.renderTodayMissionCard();
    L.renderHomeGrassSummary();
    L.renderAdaptiveModeBar();
    L.initFeedbackTierBar();
    L.renderCrewPacingWidget();
    L.renderIosPwaBanner();
    var homeHeadline = document.getElementById('homeHeadlineSentence');
    var rawGoals = L.state.profile.goals.filter(function(g){ return !g.archivedAt; });
    var goalOrder = (L.state.profile.settings && L.state.profile.settings.goalOrder) || [];
    var goals = L.sortGoalsByOrder(rawGoals, goalOrder);

    if(homeHeadline){
      // [HOME-21] 닉네임이 없으면 이름 없이 말한다(하드코딩 이름 금지)
      var nick = (L.state.profile && L.state.profile.nickname) || '';
      var nickLead = nick ? (L.escapeHtml(nick) + '님, ') : '';
      // [HOME-21] 체크인 기록은 date 없이 startAt 만 가진다 — startAt 로 날짜를 구하고, 옛 date 필드 기록도 그대로 센다
      var todayKeyHL = L.dateKey();
      var todayCheckins = (L.state.profile.records || []).filter(function(r){
        if(!r) return false;
        var rKey = r.date || (r.startAt ? L.dateKey(r.startAt) : null);
        return rKey === todayKeyHL;
      });
      if(!goals.length){
        homeHeadline.innerHTML = nickLead + '가슴 뛰는 <b>첫 번째 목표</b>를 시작해볼까요? 🌱';
      } else {
        var firstG = goals[0];
        var firstGPct = (typeof L.goalProgress === 'function') ? L.goalProgress(firstG) : 0;
        if(firstGPct >= 100){
          homeHeadline.innerHTML = nickLead + '오늘 1순위 목표를 <b>멋지게 완주</b>하셨어요! 🏆';
        } else if(todayCheckins.length > 0){
          homeHeadline.innerHTML = nickLead + '오늘 멋진 실천을 <b>' + todayCheckins.length + '회</b> 기록하셨어요 🔥';
        } else {
          homeHeadline.innerHTML = nickLead + '오늘 하루를 완성할 <b>실천과 몰입</b>이 기다려요 ✨';
        }
      }
    }
    var streak = L.computeStreakDays();
    L.updateAppBadge(streak);
    var badgeEl = document.getElementById('streakBadge');
    if(badgeEl) badgeEl.innerHTML = streak>0 ? L.streakBadgeHtml(streak) : '';
    var freezeEl = document.getElementById('streakFreezeBadge');
    var sf = L.state.profile.settings.streakFreeze;
    if(freezeEl) freezeEl.innerHTML = (sf && sf.available>0) ? '<span class="freeze-pill" title="하루를 놓쳐도 스트릭이 끊기지 않게 지켜줘요">🧊'+sf.available+'</span>' : '';
    if(typeof OurgoalStreaks !== 'undefined'){ OurgoalStreaks.renderHome({ state: L.state, BADGES: L.BADGES, badgeContext: L.badgeContext, computeStreakDays: L.computeStreakDays, saveProfile: L.saveProfile, escapeHtml: L.escapeHtml, dateKey: L.dateKey }); } // #TASK-ES-019 출석·스트릭·배지
    var wrap = document.getElementById('homeGoalList');
    if(!goals.length){
      wrap.innerHTML = '<div class="empty-goal-starter card toss-card toss-home-starter-card" style="text-align:center;padding:22px 18px;border-radius:20px;">' +
        '<div style="margin-bottom:8px;"><span class="toss-focus-badge" style="background:rgba(20,184,166,0.15);color:#14b8a6;border-color:rgba(20,184,166,0.3);font-size:0.75rem;">🌱 1초 만에 시작하기</span></div>' +
        '<h4 style="font-size:1.0625rem;font-weight:700;color:var(--ink);margin:0 0 4px;">아직 등록된 목표가 없어요</h4>' +
        '<p class="muted" style="font-size:0.82rem;margin:0 0 14px;">고민할 필요 없이 1터치로 첫 갓생 목표를 시작해보세요!</p>' +
        '<div class="starter-goals-grid" style="display:flex;flex-direction:column;gap:8px;">' +
          '<button type="button" class="btn btn-ghost btn-sm starter-goal-btn" data-starter="workout" style="justify-content:space-between;padding:10px 14px;border-radius:12px;font-size:0.84rem;text-align:left;border:1px solid var(--rule);">' +
            '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:1.2rem;">👟</span><div><b>주 3회 헬스 & 기초체력</b><br><span style="font-size:0.72rem;color:var(--ink-faint);">스트레칭 · 30분 운동 · 단백질 섭취</span></div></div>' +
            '<span style="font-size:0.72rem;font-weight:700;color:var(--brand);background:rgba(49,130,246,0.1);padding:2px 8px;border-radius:10px;">시작 +</span>' +
          '</button>' +
          '<button type="button" class="btn btn-ghost btn-sm starter-goal-btn" data-starter="running" style="justify-content:space-between;padding:10px 14px;border-radius:12px;font-size:0.84rem;text-align:left;border:1px solid var(--rule);">' +
            '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:1.2rem;">🏃</span><div><b>매일 3km 러닝 & 심폐지구력</b><br><span style="font-size:0.72rem;color:var(--ink-faint);">가벼운 조깅 · 3km 완주 · 수분 보충</span></div></div>' +
            '<span style="font-size:0.72rem;font-weight:700;color:var(--brand);background:rgba(49,130,246,0.1);padding:2px 8px;border-radius:10px;">시작 +</span>' +
          '</button>' +
          '<button type="button" class="btn btn-ghost btn-sm starter-goal-btn" data-starter="study" style="justify-content:space-between;padding:10px 14px;border-radius:12px;font-size:0.84rem;text-align:left;border:1px solid var(--rule);">' +
            '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:1.2rem;">💻</span><div><b>매일 1시간 몰입 & 기출 복습</b><br><span style="font-size:0.72rem;color:var(--ink-faint);">개념 정리 · 문제 풀이 · 오답 복습</span></div></div>' +
            '<span style="font-size:0.72rem;font-weight:700;color:var(--brand);background:rgba(49,130,246,0.1);padding:2px 8px;border-radius:10px;">시작 +</span>' +
          '</button>' +
          '<button type="button" class="btn btn-ghost btn-sm starter-goal-btn" data-starter="reading" style="justify-content:space-between;padding:10px 14px;border-radius:12px;font-size:0.84rem;text-align:left;border:1px solid var(--rule);">' +
            '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:1.2rem;">📖</span><div><b>하루 15분 독서 & 지적 성장</b><br><span style="font-size:0.72rem;color:var(--ink-faint);">책 15분 읽기 · 인상 깊은 한 줄 메모</span></div></div>' +
            '<span style="font-size:0.72rem;font-weight:700;color:var(--brand);background:rgba(49,130,246,0.1);padding:2px 8px;border-radius:10px;">시작 +</span>' +
          '</button>' +
        '</div>' +
        '<button class="btn btn-primary btn-sm" id="emptyAddCustomGoalBtn" type="button" style="width:100%;margin-top:14px;padding:11px 16px;border-radius:14px;font-weight:800;background:linear-gradient(135deg, #10B981 0%, #059669 100%);border:none;box-shadow:0 4px 12px rgba(16,185,129,0.3);">+ 내가 직접 새 목표 만들기</button>' +
      '</div>';

      wrap.querySelectorAll('.starter-goal-btn').forEach(function(btn){
        btn.onclick = async function(){
          var key = btn.dataset.starter;
          var newG = L.quickCreateStarterGoal(key);
          L.state.profile.goals.push(newG);
          L.state.activeGoalId = newG.id;
          await L.saveProfile();
          if(typeof L.dispatchFullViewPropagation === 'function') L.dispatchFullViewPropagation();
          else L.renderAll();
          L.triggerHaptic(25);
          L.burstConfetti(window.innerWidth/2, window.innerHeight/3, 20);
          L.toast('첫 갓생 목표가 시작되었어요! 오늘 1줄 기록을 남겨보세요.');
        };
      });

      var customAddBtn = wrap.querySelector('#emptyAddCustomGoalBtn');
      if(customAddBtn){
        customAddBtn.onclick = function(){
          var addBtn = document.getElementById('homeAddGoal');
          if(addBtn) addBtn.click();
        };
      }
      L.renderTodayGlancePill(); L.renderDailyQuestBar(); if(window.OurgoalCustomize) OurgoalCustomize.apply(L.state.profile.settings); /* [#TASK-ES-462] 목표 0개여도 함수 끝과 같은 마무리(오늘 요약·3대 퀘스트·홈 구성 적용) — 조기 반환이 건너뛰던 것 */
      return;
    }
    var subGoals = goals.slice(1);
    if(subGoals.length === 0){
      wrap.innerHTML = '<div class="card toss-card" style="padding:16px;text-align:center;border-radius:18px;background:var(--card-bg, #fff);border:1px dashed var(--rule);">' +
        '<div style="font-size:0.875rem;font-weight:700;color:var(--ink);margin-bottom:4px;">✨ 오늘 1순위 목표에 온전히 집중하는 날이에요</div>' +
        '<div style="font-size:0.75rem;color:var(--muted);margin-bottom:10px;">함께 병행할 2순위 서브 목표나 루틴이 있다면 언제든 추가해보세요.</div>' +
        '<button type="button" class="btn btn-ghost btn-sm" onclick="var b=document.getElementById(\'homeAddGoal\');if(b)b.click();" style="border-radius:12px;font-size:0.75rem;font-weight:700;color:var(--brand);border:1px solid var(--brand);padding:6px 14px;">+ 서브 목표 추가하기</button>' +
      '</div>';
    } else {
      wrap.innerHTML = subGoals.map(function(g, sIdx){
        var pct = (typeof L.goalProgress === 'function') ? L.goalProgress(g) : (g.progress || 0);
        var counts = L.msCounts(g);
        var color = pct>=67 ? '#1FC98E' : (pct>=34 ? '#FF9F1C' : '#FF4F64');
        var dd = g.dueDate
          ? '<span class="dday-pill" style="background:var(--red-soft);color:var(--brand-strong);">'+g.dueDate+' · '+L.dDay(g.dueDate)+'</span>'
          : '';
        var isGoalDone = (pct >= 100);
        return '<div class="goal-card" data-goalid="'+g.id+'" draggable="true" style="margin-bottom:12px;border-radius:18px;">' +
          '<div class="goal-card-top">' +
            '<div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1;">' +
              '<span class="focus-goal-pill" style="font-size:.6875rem;padding:2px 6px;border-radius:10px;background:rgba(49,130,246,0.1);color:var(--brand);font-weight:700;">서브 ' + (sIdx+1) + '</span>' +
              '<h4 style="margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.9375rem;">'+L.escapeHtml(g.title)+'</h4>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">' +
              '<button class="icon-btn order-shift-btn" data-shiftgoal="'+g.id+'" data-dir="-1" type="button" aria-label="위로 이동" title="위로 이동" style="padding:2px 4px;font-size:.6875rem;background:none;border:none;color:var(--muted);cursor:pointer;">▲</button>' +
              '<button class="icon-btn order-shift-btn" data-shiftgoal="'+g.id+'" data-dir="1" type="button" aria-label="아래로 이동" title="아래로 이동" style="padding:2px 4px;font-size:.6875rem;background:none;border:none;color:var(--muted);cursor:pointer;">▼</button>' +
              dd +
            '</div>' +
          '</div>' +
          (g.topic ? '<div style="margin:4px 0 8px;">'+L.topicPill(g.topic)+'</div>' : '') +
          '<div class="toss-focus-progress-wrap" style="margin:8px 0 10px;">' +
            '<div class="toss-focus-progress-labels" style="display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:4px;">' +
              '<span>마일스톤 ' + counts.done + '/' + counts.total + ' 완료</span>' +
              '<span style="color:'+color+';font-weight:700;">' + Math.round(pct) + '%</span>' +
            '</div>' +
            '<div class="toss-focus-progress-bar" style="height:6px;background:rgba(0,0,0,0.06);border-radius:99px;overflow:hidden;">' +
              '<div class="toss-focus-progress-fill" style="width:' + Math.min(100, Math.max(0, pct)) + '%;background:'+color+';height:100%;border-radius:99px;"></div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
            '<button class="btn-focus-pilot toss-focus-complete-btn ' + (isGoalDone ? 'is-done' : '') + '" data-focusgoal="'+g.id+'" type="button" title="서브 목표 실천 기록" style="flex:1;padding:8px 12px;border-radius:10px;font-size:0.8125rem;font-weight:700;">' +
              '<span>' + (isGoalDone ? '완주됨 🏆' : '실천 체크인 ✓') + '</span>' +
            '</button>' +
            '<a class="goal-detail-link" data-detail="'+g.id+'" style="font-size:0.75rem;cursor:pointer;color:var(--muted);flex-shrink:0;">마일스톤 보기 ›</a>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    wrap.querySelectorAll('[data-detail]').forEach(function(el){
      el.addEventListener('click', function(){
        L.state.activeGoalId = el.dataset.detail;
        L.setTab('goals');
      });
    });

    wrap.querySelectorAll('[data-focusgoal]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        var gid = btn.getAttribute('data-focusgoal');
        L.openFocusAutoPilotModal(gid);
      });
    });
    wrap.querySelectorAll('[data-calsyncgoal]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        L.quickSyncToCalendar('goal', btn.dataset.calsyncgoal, null);
      });
    });
    wrap.querySelectorAll('.order-shift-btn').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var gid = btn.dataset.shiftgoal;
        var dir = parseInt(btn.dataset.dir, 10);
        L.shiftGoalOrder(gid, dir);
      });
    });

    var draggedGoalId = null;
    wrap.querySelectorAll('.goal-card').forEach(function(card){
      card.addEventListener('dragstart', function(e){
        draggedGoalId = card.dataset.goalid;
        card.style.opacity = '0.4';
        if(e.dataTransfer){
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', draggedGoalId);
        }
      });
      card.addEventListener('dragend', function(){
        card.style.opacity = '1';
        draggedGoalId = null;
      });
      card.addEventListener('dragover', function(e){
        e.preventDefault();
        if(e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      });
      card.addEventListener('drop', function(e){
        e.preventDefault();
        var targetGoalId = card.dataset.goalid;
        if(!draggedGoalId || draggedGoalId === targetGoalId) return;
        L.reorderGoal(draggedGoalId, targetGoalId);
      });
    });

    L.renderTodayGlancePill();
    L.renderDailyQuestBar();
    if(window.OurgoalCustomize) OurgoalCustomize.apply(L.state.profile.settings); /* 앱을 내맘대로! (#TASK-ES-020) */
  }

  K.renderHome = renderHome;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
