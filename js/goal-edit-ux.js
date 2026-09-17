/**
 * OurGoal - 목표 편집 모드 완료 UX 및 목표 제목 편집 지원 모듈 (#TASK-ES-109)
 * 헌법 제7조(4위 1체 배선 원칙: 마크업 + 이벤트 리스너 + 비즈니스 로직 + 피드백) 준수
 */
(function(window){
  'use strict';

  var OurgoalGoalEditUX = {
    /**
     * 목표 편집 모드 최상단 목표 이름(Title) 편집 필드 HTML 생성
     */
    renderTitleRow: function(state, goal){
      if(!state || !state.goalEditMode || !goal) return '';
      var esc = function(str){
        return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      };
      return '<div class="field" style="margin:6px 0 10px;padding:10px 12px;background:var(--card2);border:1px solid var(--rule);border-radius:12px;">' +
        '<label class="lbl" for="goalTitleInput" style="display:flex;align-items:center;justify-content:space-between;font-weight:700;font-size:.8125rem;color:var(--ink);margin-bottom:6px;">' +
          '<span>🎯 목표 이름</span>' +
          '<span class="faint" style="font-size:.72rem;">목표명을 직접 수정할 수 있어요</span>' +
        '</label>' +
        '<input type="text" id="goalTitleInput" value="' + esc(goal.title) + '" style="font-size:.95rem;font-weight:700;width:100%;padding:8px 10px;border:1.5px solid var(--brand);border-radius:8px;background:var(--card);color:var(--ink);" placeholder="목표 이름을 입력하세요">' +
      '</div>';
    },

    /**
     * 마일스톤 목록 바로 아래 인라인 완료 버튼 HTML 생성
     */
    renderDoneInlineBtn: function(state, goal){
      if(!state || !state.goalEditMode || !goal) return '';
      return '<button class="goal-edit-done-inline-btn" id="btnGoalEditDoneInline" type="button" style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;min-height:44px;border-radius:12px;font-weight:700;font-size:.9375rem;background:var(--brand);color:#fff;border:none;cursor:pointer;margin-top:12px;margin-bottom:8px;box-shadow:0 3px 14px rgba(99,102,241,0.3);">' +
        '✓ 목표 편집 완료 (저장)' +
      '</button>';
    },

    /**
     * 팀 목표 편집 모드 하단 인라인 완료 버튼 HTML 생성
     */
    renderTeamDoneInlineBtn: function(state){
      if(!state || !state.teamGoalEditMode) return '';
      return '<button class="goal-edit-done-inline-btn" id="btnTeamGoalEditDoneInline" type="button" style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;min-height:44px;border-radius:12px;font-weight:700;font-size:.9375rem;background:var(--brand);color:#fff;border:none;cursor:pointer;margin-top:16px;margin-bottom:12px;box-shadow:0 3px 14px rgba(99,102,241,0.3);">' +
        '✓ 팀 목표 편집 완료 (저장)' +
      '</button>';
    },

    /**
     * 플로팅 완료 바 제거
     */
    removeFloatingBar: function(){
      var oldFb = document.getElementById('goalEditFloatingBar');
      if(oldFb) oldFb.remove();
    },

    /**
     * 개인 목표 편집 완료 확정 및 프로필 저장
     */
    commitAndFinishGoalEdit: async function(deps){
      if(!deps || !deps.state || !deps.goal) return;
      var goal = deps.goal;
      var state = deps.state;
      var body = deps.body || document.getElementById('goalDetailBody');

      // 1. 포커스 해제하여 인라인 입력 blur 강제 유도
      if(document.activeElement && typeof document.activeElement.blur === 'function'){
        document.activeElement.blur();
      }

      // 2. DOM 상의 최신 입력값 모델에 확정 커밋
      var titleInp = document.getElementById('goalTitleInput');
      if(titleInp && titleInp.value.trim()){
        goal.title = titleInp.value.trim();
      }
      var dueInp = document.getElementById('goalDueInput');
      if(dueInp){
        goal.dueDate = dueInp.value || null;
      }
      var visInp = document.getElementById('goalVisInput');
      if(visInp && visInp.value){
        goal.visibility = visInp.value;
      }

      // 마일스톤 및 할 일 인풋 커밋
      if(body){
        body.querySelectorAll('.ms-row').forEach(function(row){
          var msid = row.dataset.msid;
          var ms = (goal.milestones||[]).find(function(x){ return x.id===msid; });
          if(!ms) return;
          var mi = row.querySelector('[data-msinput]');
          if(mi && mi.value.trim()) ms.title = mi.value.trim();
          var md = row.querySelector('[data-msdate]');
          if(md) ms.dueDate = md.value || null;
          row.querySelectorAll('.task-row').forEach(function(trow){
            var tid = trow.dataset.taskid;
            var t = (ms.tasks||[]).find(function(x){ return x.id===tid; });
            if(!t) return;
            var ti = trow.querySelector('[data-taskinput]');
            if(ti && ti.value.trim()) t.title = ti.value.trim();
            var td = trow.querySelector('[data-taskdate]');
            if(td) t.dueDate = td.value || null;
          });
        });
      }

      // 3. 편집 모드 종료 및 플로팅 바 제거
      state.goalEditMode = false;
      state.msSel = {};
      state.taskSel = {};
      OurgoalGoalEditUX.removeFloatingBar();

      // 4. 프로필 영속 저장
      if(typeof deps.saveProfile === 'function'){
        await deps.saveProfile();
      }

      // 5. 성공 피드백 및 화면 재렌더
      if(typeof deps.toast === 'function'){
        deps.toast('목표 편집을 완료했어요');
      }
      if(typeof deps.renderGoalsScreen === 'function'){
        deps.renderGoalsScreen();
      }
      if(typeof deps.renderAll === 'function'){
        deps.renderAll();
      }
    },

    /**
     * 팀 목표 편집 완료 확정 및 저장
     */
        commitAndFinishTeamGoalEdit: async function(deps){
      if(!deps || !deps.state || !deps.view) return;
      var view = deps.view;
      var state = deps.state;
      var mockGroups = deps.mockGroups || [];

      if(document.activeElement && typeof document.activeElement.blur === 'function'){
        document.activeElement.blur();
      }

      // 1. 팀 목표명 수집
      view.querySelectorAll('[data-tgtitle]').forEach(function(inp){
        var card = inp.closest('[data-teamgoal]');
        var tgid = card && card.dataset.teamgoal;
        var pCard = inp.closest('[data-teamcard]');
        var gid = pCard && pCard.dataset.teamcard;
        var g = mockGroups.find(function(x){ return x.id===gid; });
        var tg = g && (g.teamGoals||[]).find(function(x){ return x.id===tgid; });
        if(tg && inp.value.trim()){ tg.title = inp.value.trim(); }
      });

      // 2. 팀 목표 인라인 마감일 수집
      view.querySelectorAll('[data-tgdue]').forEach(function(inp){
        var parts = (inp.dataset.tgdue || '').split(':');
        var gid = parts[0];
        var tgid = parts[1];
        var g = mockGroups.find(function(x){ return x.id===gid; });
        var tg = g && (g.teamGoals||[]).find(function(x){ return x.id===tgid; });
        if(tg){ tg.dueDate = inp.value || null; }
      });

      // 3. 마일스톤 제목 수집
      view.querySelectorAll('[data-tgmtitle]').forEach(function(inp){
        var row = inp.closest('[data-tgmid]');
        var mid = row && row.dataset.tgmid;
        var card = inp.closest('[data-teamgoal]');
        var tgid = card && card.dataset.teamgoal;
        var pCard = inp.closest('[data-teamcard]');
        var gid = pCard && pCard.dataset.teamcard;
        var g = mockGroups.find(function(x){ return x.id===gid; });
        var tg = g && (g.teamGoals||[]).find(function(x){ return x.id===tgid; });
        var m = tg && (tg.milestones||[]).find(function(x){ return x.id===mid; });
        if(m && inp.value.trim()){ m.title = inp.value.trim(); }
      });

      // 4. 마일스톤 우선순위 수집
      view.querySelectorAll('[data-tgmprio]').forEach(function(sel){
        var parts = (sel.dataset.tgmprio || '').split(':');
        var gid = parts[0];
        var tgid = parts[1];
        var mid = parts[2];
        var g = mockGroups.find(function(x){ return x.id===gid; });
        var tg = g && (g.teamGoals||[]).find(function(x){ return x.id===tgid; });
        var m = tg && (tg.milestones||[]).find(function(x){ return x.id===mid; });
        if(m){ m.priority = sel.value || 'medium'; }
      });

      // 5. 세부 할일 제목 수집
      view.querySelectorAll('[data-tgtasktitle]').forEach(function(inp){
        var parts = (inp.dataset.tgtasktitle || '').split(':');
        var tgid = parts[0];
        var mid = parts[1];
        var tid = parts[2];
        var card = inp.closest('[data-teamgoal]');
        var pCard = inp.closest('[data-teamcard]');
        var gid = pCard && pCard.dataset.teamcard;
        var g = mockGroups.find(function(x){ return x.id===gid; });
        var tg = g && (g.teamGoals||[]).find(function(x){ return x.id===tgid; });
        var m = tg && (tg.milestones||[]).find(function(x){ return x.id===mid; });
        var t = m && (m.tasks||[]).find(function(x){ return x.id===tid; });
        if(t && inp.value.trim()){ t.title = inp.value.trim(); }
      });

      // 6. [시너지 E2] 팀 연계 개인목표(Linked Goals) 참조 무결성 자동 수호
      if(window.OurgoalTeamLinkedGoals && typeof OurgoalTeamLinkedGoals.syncWithTeamGoals === 'function'){
        mockGroups.forEach(function(g){
          if(g.teamGoals && g.teamGoals.length){
            OurgoalTeamLinkedGoals.syncWithTeamGoals(g.teamGoals, g.id);
          }
        });
      }

      // 7. [시너지 E3] 편집 완료 실시간 시스템 공지 발행 (team_comments)
      mockGroups.forEach(function(g){
        if(g.teamGoals && g.teamGoals.length){
          var lastEditedGoal = g.teamGoals[0];
          var nowISO = new Date().toISOString();
          var noticeRow = {
            id: 'cmt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            group_id: g.id,
            user_id: 'system',
            display_name: '📢 팀 공지',
            target_id: lastEditedGoal.id,
            text: '팀장님이 공동 목표 [' + (lastEditedGoal.title || '목표') + '] 세부 계획을 업데이트했습니다!',
            created_at: nowISO,
            is_system: true
          };
          if(window.TEAM_COMMENTS_CACHE){
            window.TEAM_COMMENTS_CACHE[g.id] = window.TEAM_COMMENTS_CACHE[g.id] || [];
            window.TEAM_COMMENTS_CACHE[g.id].push(noticeRow);
          }
          if(state.profile && state.profile.settings){
            state.profile.settings.localTeamComments = state.profile.settings.localTeamComments || {};
            state.profile.settings.localTeamComments[g.id] = state.profile.settings.localTeamComments[g.id] || [];
            state.profile.settings.localTeamComments[g.id].push(noticeRow);
          }
          if(window.sb && window.sb.from){
            try { window.sb.from('team_comments').insert(noticeRow).catch(function(){}); } catch(e){}
          }
        }
      });

      state.teamGoalEditMode = false;
      OurgoalGoalEditUX.removeFloatingBar();

      if(typeof deps.saveProfile === 'function'){
        await deps.saveProfile();
      }
      if(typeof deps.toast === 'function'){
        deps.toast('팀 목표 편집을 완료했어요');
      }
      if(typeof deps.renderTeamGoalsScreen === 'function'){
        deps.renderTeamGoalsScreen();
      }
    },

    /**
     * 개인 목표 화면 이벤트 및 하단 고정 플로팅 바 바인딩
     */
    wirePersonalGoalEdit: function(deps){
      if(!deps || !deps.state || !deps.goal) return;
      var state = deps.state;
      var goal = deps.goal;
      var esc = function(str){
        return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      };

      // 1. 목표 제목 인풋 실시간 반영
      var titleInput = document.getElementById('goalTitleInput');
      if(titleInput){
        titleInput.addEventListener('input', function(){
          var val = titleInput.value.trim();
          if(val) goal.title = val;
        });
        titleInput.addEventListener('change', async function(){
          var val = titleInput.value.trim();
          if(val){
            goal.title = val;
            if(typeof deps.saveProfile === 'function') await deps.saveProfile();
          }
        });
      }

      // 2. 인라인 완료 버튼 바인딩
      var doneInlineBtn = document.getElementById('btnGoalEditDoneInline');
      if(doneInlineBtn){
        doneInlineBtn.addEventListener('click', async function(e){
          e.preventDefault();
          await OurgoalGoalEditUX.commitAndFinishGoalEdit(deps);
        });
      }

      // 3. 플로팅 완료 바 초기화 및 생성
      OurgoalGoalEditUX.removeFloatingBar();
      if(state.goalEditMode && goal){
        var fb = document.createElement('div');
        fb.id = 'goalEditFloatingBar';
        fb.className = 'goal-edit-floating-bar';
        fb.innerHTML =
          '<div class="bar-info">' +
            '<span class="bar-title">✏️ 목표 편집 중</span>' +
            '<span class="bar-sub">' + esc(goal.title) + '</span>' +
          '</div>' +
          '<button class="goal-edit-done-cta-btn" id="btnGoalEditDoneFloating" type="button">' +
            '✓ 편집 완료' +
          '</button>';
        document.body.appendChild(fb);

        var fbDoneBtn = fb.querySelector('#btnGoalEditDoneFloating');
        if(fbDoneBtn){
          fbDoneBtn.addEventListener('click', async function(e){
            e.preventDefault();
            e.stopPropagation();
            await OurgoalGoalEditUX.commitAndFinishGoalEdit(deps);
          });
        }
      }
    },

    /**
     * 팀 목표 화면 인라인 완료 버튼 바인딩
     */
        wireTeamGoalEdit: function(deps){
      if(!deps || !deps.view || !deps.state) return;
      var state = deps.state;
      var teamDoneBtn = deps.view.querySelector('#btnTeamGoalEditDoneInline');
      if(teamDoneBtn){
        teamDoneBtn.addEventListener('click', async function(e){
          e.preventDefault();
          await OurgoalGoalEditUX.commitAndFinishTeamGoalEdit(deps);
        });
      }

      // 하단 플로팅 완료 바 (#TASK-ES-176)
      OurgoalGoalEditUX.removeFloatingBar();
      if(state.teamGoalEditMode){
        var fb = document.createElement('div');
        fb.id = 'goalEditFloatingBar';
        fb.className = 'goal-edit-floating-bar';
        fb.innerHTML =
          '<div class="bar-info">' +
            '<span class="bar-title">✏️ 팀 목표 편집 중</span>' +
            '<span class="bar-sub">수정 후 완료를 누르면 팀에 반영돼요</span>' +
          '</div>' +
          '<button class="goal-edit-done-cta-btn" id="btnTeamGoalEditDoneFloating" type="button">' +
            '✓ 편집 완료' +
          '</button>';
        document.body.appendChild(fb);

        var fbDoneBtn = fb.querySelector('#btnTeamGoalEditDoneFloating');
        if(fbDoneBtn){
          fbDoneBtn.addEventListener('click', async function(e){
            e.preventDefault();
            e.stopPropagation();
            await OurgoalGoalEditUX.commitAndFinishTeamGoalEdit(deps);
          });
        }
      }
    },

    /**
     * 탭 전환 시 플로팅 바 가시성 제어
     */
    handleTabChange: function(tab, state){
      var fb = document.getElementById('goalEditFloatingBar');
      if(fb){
        if(tab !== 'goals') fb.style.display = 'none';
        else if(state && (state.goalEditMode || (state.goalsSubTab === 'team' && state.teamGoalEditMode))) fb.style.display = 'flex';
      }
    }
  };

  window.OurgoalGoalEditUX = OurgoalGoalEditUX;
})(typeof window !== 'undefined' ? window : this);
