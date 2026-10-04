/**
 * OurGoal Goals Screen Renderer (목표 탭 메인 렌더 — 화면 단위 조립)
 *
 * #TASK-ES-370 (목표 탭 세포 이전): index.html 인라인 IIFE 의 renderGoalsScreen(이전 전 24185~25228줄, 1,044줄)을 동작 그대로 옮겼다.
 * 800줄을 넘어 책임 단위 세 구간으로 나눴다(docs/specs/MODULE-SPLIT-PROTOCOL.md 0절 2 · 2절):
 *   이 파일 renderGoalsScreen = 머리(이전 전 24186~24379줄: 서브탭 칩·서브탭 분기·목표 칩·편집 토글·빈 상태) + 아래 두 구간을 원래 순서로 부르는 조립자
 *   goal-detail.js renderGoalDetailBody(이전 전 24380~24770줄: 상세 마크업) · goal-detail-events.js wireGoalDetailEvents(이전 전 24771~25228줄: 상세 이벤트 배선)
 * 구간을 넘는 지역 변수는 인자(goal·body)와 반환값(allCollapsed·goalStatusHash·isDateStale·goalStatusStale)으로만 넘긴다(모두 재대입 0 — 생성기 검사).
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 목표 파일 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * index.html 은 IIFE 맨 위에서 이 키트(OurgoalGoalsKit)의 renderGoalsScreen 을 같은 이름으로 가져와 부른다 — 호출하는 쪽 수십 곳은 그대로다.
 * window.renderGoalsScreen 노출 줄은 이전 전과 같은 자리(index.html)에 그대로 있다. 선례: 일정 탭 #TASK-ES-360 · 설정 탭 #TASK-ES-354.
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 목표 키트: 목표 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  function renderGoalsScreen(){
    // [#UIUX-33] 5대 서브탭 Sticky 네비게이션 동기화
    var currentSub = L.state.goalsSubTab || 'personal';
    var stickyMap = {
      'personal': 'btnGoalsSubPersonal',
      'routine': 'btnGoalsSubRoutine',
      'teamLinked': 'btnGoalsSubTeamLinked',
      'team': 'btnGoalsSubTeam',
      'templateEncyclopedia': 'btnGoalsSubTemplate',
      'stats': 'btnGoalsSubStats'
    };
    var stickyNav = document.getElementById('goalsStickySubnav');
    if (stickyNav) {
      stickyNav.querySelectorAll('.goals-subtab-chip').forEach(function(chip) {
        chip.classList.remove('active');
      });
      var activeChipId = stickyMap[currentSub];
      if (activeChipId) {
        var activeEl = document.getElementById(activeChipId);
        if (activeEl) activeEl.classList.add('active');
      }
    }

    var subtabs = document.getElementById('goalsSubtabs');
    if(!subtabs) return;
    /* 하위 호환성 헌법 단정화 선언: ['teamLinked','팀 연계'], ['templateEncyclopedia','📖 템플릿'] */
    var subtabsList = [
      ['routine', '루틴'],
      ['personal', '개인'],
      ['teamLinked', '팀 연계'],
      ['team', '팀목표'],
      ['templateEncyclopedia', '📖 템플릿']
    ];
    subtabs.innerHTML = subtabsList.map(function(s){
      return '<div class="comm-subtab'+((!L.state.goalsSubTab && s[0]==='personal') || L.state.goalsSubTab===s[0]?' active':'')+'" data-gsub="'+s[0]+'">'+s[1]+'</div>';
    }).join('');
    subtabs.querySelectorAll('[data-gsub]').forEach(function(t){
      t.addEventListener('click', function(){
        L.triggerHapticFeedback(12);
        L.state.goalsSubTab = t.dataset.gsub;
        renderGoalsScreen();
      });
    });
    var rawGoals = L.state.profile.goals.filter(function(g){ return !g.archivedAt && !g.teamLinked; });
    var goals = L.sortGoalsByOrder(rawGoals, (L.state.profile.settings && L.state.profile.settings.goalOrder) || []);
    if(!L.state.activeGoalId || !goals.find(function(g){ return g.id===L.state.activeGoalId; })){
      L.state.activeGoalId = goals.length ? goals[0].id : null;
    }

    var headlineEl = document.getElementById('goalsHeadlineSentence');
    if(headlineEl){
      if(goals.length === 0){
        headlineEl.innerHTML = '새로운 목표를 세우고 첫 발걸음을 딛어보세요 🌱';
      } else {
        var activeGoal = goals.find(function(g){ return g.id === L.state.activeGoalId; }) || goals[0];
        var remainingMs = (activeGoal && activeGoal.milestones) ? activeGoal.milestones.filter(function(m){ return m.status !== 'done'; }).length : 0;
        if(remainingMs > 0){
          headlineEl.innerHTML = '정상까지 <b>' + remainingMs + '개</b>의 퀘스트가 남았어요 🏔️';
        } else {
          headlineEl.innerHTML = '목표를 멋지게 달성하셨어요! 축하드려요 🎉';
        }
      }
    }

    var isPersonal = (!L.state.goalsSubTab || L.state.goalsSubTab==='personal');
    var sv = document.getElementById('sanctuaryGoalsView');
    if(sv) sv.style.display = isPersonal ? '' : 'none';
    var rv = document.getElementById('routineGoalsView');
    var pv = document.getElementById('personalGoalsView'), tv = document.getElementById('teamGoalsView'), tlv = document.getElementById('teamLinkedGoalsView');
    var tev = document.getElementById('templateEncyclopediaView');
    var statv = document.getElementById('statsGoalsView');
    if(rv) rv.style.display = (L.state.goalsSubTab==='routine') ? '' : 'none';
    if(pv) pv.style.display = (isPersonal && goals.length > 0) ? '' : 'none';
    if(tlv) tlv.style.display = (L.state.goalsSubTab==='teamLinked') ? '' : 'none';
    if(tv) tv.style.display = (L.state.goalsSubTab==='team') ? '' : 'none';
    if(tev) tev.style.display = (L.state.goalsSubTab==='templateEncyclopedia') ? '' : 'none';
    if(statv) statv.style.display = (L.state.goalsSubTab==='stats') ? '' : 'none';

    if(L.state.goalsSubTab==='stats'){ L.renderGoalStatsChart(); return; }
    if(L.state.goalsSubTab==='routine'){ L.renderRoutineGoalsScreen(); L.renderRoutineMatrixGrid(); return; }
    if(L.state.goalsSubTab==='team'){ L.renderTeamGoalsScreen(); return; }
    if(L.state.goalsSubTab==='teamLinked'){ if(window.OurgoalTeamLinkedGoals) window.OurgoalTeamLinkedGoals.renderTeamLinkedGoalsScreen(); return; }
    if(L.state.goalsSubTab==='templateEncyclopedia'){ L.renderTemplateEncyclopediaScreen(); return; }

    // [#TASK-ES-315, 64] 목표탭 내 기존 60선 창 영구 제거 (템플릿백과사전 일원화)
    var tplSlot = document.getElementById('goalsTemplateAccordionSlot');
    if(tplSlot){
      tplSlot.innerHTML = '';
      tplSlot.style.display = 'none';
    }
    var chipRow = document.getElementById('goalChipRow');
    if(L.state.goalEditMode){
      chipRow.innerHTML = goals.map(function(g, gIdx){
        var isAct = (g.id === L.state.activeGoalId);
        var isFirst = (gIdx === 0);
        var isLast = (gIdx === goals.length - 1);
        return '<div class="goal-chip-item-wrap">' +
          '<button class="goal-chip'+(isAct?' active':'')+'" data-chip="'+g.id+'">'+L.escapeHtml(g.title)+'</button>' +
          '<div class="goal-chip-nav-row">' +
            '<button type="button" class="goal-chip-nav-btn" data-shiftleft="'+g.id+'" '+(isFirst?'disabled':'')+' title="왼쪽으로 이동">◀</button>' +
            '<button type="button" class="goal-chip-nav-btn" data-shiftright="'+g.id+'" '+(isLast?'disabled':'')+' title="오른쪽으로 이동">▶</button>' +
          '</div>' +
        '</div>';
      }).join('') + '<button class="goal-chip addchip" id="chipAdd">+</button>';

      chipRow.querySelectorAll('[data-shiftleft]').forEach(function(btn){
        btn.onclick = function(e){
          e.stopPropagation();
          L.shiftGoalOrder(btn.dataset.shiftleft, -1);
        };
      });
      chipRow.querySelectorAll('[data-shiftright]').forEach(function(btn){
        btn.onclick = function(e){
          e.stopPropagation();
          L.shiftGoalOrder(btn.dataset.shiftright, 1);
        };
      });
    } else {
      chipRow.innerHTML = goals.map(function(g){
        return '<button class="goal-chip'+(g.id===L.state.activeGoalId?' active':'')+'" data-chip="'+g.id+'">'+L.escapeHtml(g.title)+'</button>';
      }).join('') + '<button class="goal-chip addchip" id="chipAdd">+</button>';
    }

    chipRow.querySelectorAll('[data-chip]').forEach(function(b){
      b.addEventListener('click', function(){ L.state.activeGoalId = b.dataset.chip; renderGoalsScreen(); });
    });
    var addChip = document.getElementById('chipAdd');
    if(addChip) addChip.addEventListener('click', function(){
      if(L.isModalDismissCooldown()) return;
      L.promptNewGoal();
    });
    var personalAddInline = document.getElementById('btnPersonalAddGoalInline');
    if(personalAddInline){
      personalAddInline.onclick = function(){
        if(L.isModalDismissCooldown()) return;
        L.promptNewGoal();
      };
    }

    var editBtn = document.getElementById('goalEditToggle');
    editBtn.textContent = L.state.goalEditMode ? '✓ 편집 완료' : '편집';
    editBtn.className = 'edit-toggle ' + (L.state.goalEditMode ? 'on' : 'off');
    editBtn.onclick = async function(){
      if(L.state.goalEditMode && window.OurgoalGoalEditUX){ await OurgoalGoalEditUX.commitAndFinishGoalEdit({ state: L.state, goal: goal, body: body, saveProfile: L.saveProfile, toast: L.toast, renderGoalsScreen: renderGoalsScreen, renderAll: L.renderAll }); return; }
      L.state.goalEditMode = !L.state.goalEditMode; L.state.msSel = {}; L.state.taskSel = {};
      if(!L.state.goalEditMode){ if(window.OurgoalGoalEditUX) OurgoalGoalEditUX.removeFloatingBar(); await L.saveProfile(); }
      renderGoalsScreen();
    };

    var body = document.getElementById('goalDetailBody');
    var goal = goals.find(function(g){ return g.id===L.state.activeGoalId; });

    /* 편집 모드: 목표 옆에서 바로 삭제 및 보관 */
    var headRow = editBtn.parentElement;
    var oldDel = document.getElementById('goalDeleteInline');
    if(oldDel) oldDel.remove();
    var oldArchive = document.getElementById('goalArchiveBtn');
    if(oldArchive) oldArchive.remove();

    if(L.state.goalEditMode && goal){
      var archiveBtnEl = document.createElement('button');
      archiveBtnEl.id = 'goalArchiveBtn';
      archiveBtnEl.type = 'button';
      archiveBtnEl.className = 'btn btn-ghost btn-sm';
      archiveBtnEl.textContent = '📦 보관';
      archiveBtnEl.title = '목표를 보관함으로 이동';
      archiveBtnEl.style.marginRight = '6px';
      archiveBtnEl.style.fontSize = '.78rem';
      archiveBtnEl.style.padding = '4px 8px';
      headRow.insertBefore(archiveBtnEl, editBtn);

      var delInline = document.createElement('button');
      delInline.id = 'goalDeleteInline';
      delInline.type = 'button';
      delInline.className = 'btn btn-danger btn-sm';
      delInline.textContent = '목표 삭제';
      delInline.style.marginRight = '6px';
      headRow.insertBefore(delInline, archiveBtnEl);
      delInline.addEventListener('click', async function(){
        if(!confirm('"'+goal.title+'" 목표를 휴지통으로 이동할까요?\n7일간 안전하게 보관되며 언제든 원복할 수 있습니다.')) return;
        await L.moveToTrash('goal', goal.id, goal, 'in_app', goal.title);
        L.state.goalEditMode = false; if(window.OurgoalGoalEditUX) OurgoalGoalEditUX.removeFloatingBar();
        L.renderAll();
      });
    }

    var emptyGuideSlot = document.getElementById('personalGoalsEmptyGuideSlot');
    if(emptyGuideSlot){
      emptyGuideSlot.innerHTML = (goals.length === 0) ? L.renderPersonalGoalsEmptyGuideHtml() : '';
    }

    if(!goal){
      body.innerHTML = '<div class="empty-state"><div class="e-icon"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg></div><p>목표를 만들면 여기에 마일스톤이 보여요.</p></div>';
      return;
    }
    // [#TASK-ES-370] 여기부터는 goal-detail.js · goal-detail-events.js 로 옮긴 구간이다. 원래 순서 그대로 부르고, 구간 사이 지역 변수는 인자·반환값으로 넘긴다.
    var _goalDetail = K.renderGoalDetailBody(goal, body);
    K.wireGoalDetailEvents(goal, body, _goalDetail.allCollapsed, _goalDetail.goalStatusHash, _goalDetail.isDateStale, _goalDetail.goalStatusStale);
  }

  K.renderGoalsScreen = renderGoalsScreen;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
