/**
 * OurGoal Team Goal Edit Modal (목표 탭 — 팀장·매니저의 팀 목표 상세 편집 창)
 *
 * 같은 묶음의 팀 목표 상세 편집 창(openTeamGoalEditModal): 팀 목표명·마감일·마일스톤·세부 할 일을 고치고 저장·삭제한다. 팀목표 화면 편집 모드의 「상세 편집」 단추가 L 통로로 부른다.
 * #TASK-ES-552(인라인 3단계 Z2 팀·소통 — 개인 목표 가이드·팀 수준별 목표·팀 목표 편집): index.html 인라인 IIFE 의 구간(이전 전 6905~7045줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ---- 이전 전 index.html 6905~7045줄(#TASK-ES-552 생성기 표지) ---- */
  /* [#TASK-ES-493] getTeamGoalTemplatePreset → js/tabs/goals/team-goals-guide.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  function openTeamGoalEditModal(gid, tgid){
    var g = L.MOCK_GROUPS.find(function(x){ return x.id===gid; });
    if(!g) return;
    var tg = (g.teamGoals||[]).find(function(x){ return x.id===tgid; });
    if(!tg) return;

    var msList = tg.milestones || [];
    var msHtml = msList.map(function(m, idx){
      var tasks = m.tasks || [];
      var tRows = tasks.map(function(t){
        return '<div class="task-row" style="display:flex;align-items:center;gap:6px;padding:3px 0;">' +
          '<div class="task-check'+(t.done?' done':'')+'" data-medittaskcheck="'+m.id+':'+t.id+'" style="cursor:pointer;flex:0 0 auto;">'+(t.done?'✓':'')+'</div>' +
          '<input class="task-title'+(t.done?' done-text':'')+'" data-medittasktitle="'+m.id+':'+t.id+'" value="'+L.escapeHtml(t.title)+'" style="flex:1;font-size:.8125rem;">' +
          '<button class="icon-btn" data-medittaskdel="'+m.id+':'+t.id+'" type="button" title="할 일 삭제" style="padding:2px 4px;">×</button>' +
        '</div>';
      }).join('');

      var curPrio = m.priority || 'med';
      var prioLabel = curPrio === 'high' ? '높음' : (curPrio === 'low' ? '낮음' : '보통');
      var prioTagHtml = '<span class="ms-priority-tag ms-priority-' + curPrio + '" data-meditcycleprio="' + m.id + '" title="우선순위 변경 (클릭)" style="cursor:pointer;">' + prioLabel + '</span>';

      return '<div class="ms-row" style="margin-top:6px;padding:8px 10px;background:var(--card);border-radius:12px;border:1px solid var(--rule);">' +
        '<div class="ms-main" style="align-items:flex-start;">' +
          '<div class="ms-status '+m.status+'" data-meditcyclestatus="'+m.id+'" style="margin-top:2px;cursor:pointer;" title="상태 변경 (클릭)">'+(m.status==='done'?'✓':'')+'</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">' +
              prioTagHtml +
              (tasks.length > 0 ? '<span class="faint" style="font-size:.6875rem;background:var(--card2);padding:1px 6px;border-radius:6px;">'+tasks.filter(function(t){return t.done;}).length+'/'+tasks.length+' 완료</span>' : '') +
            '</div>' +
            '<input class="ms-title'+(m.status==='done'?' done-text':'')+'" data-meditmtitle="'+m.id+'" value="'+L.escapeHtml(m.title)+'" style="width:100%;font-size:.9375rem;">' +
          '</div>' +
          '<div class="ms-actions" style="display:flex;gap:3px;align-items:center;">' +
            (idx > 0 ? '<button class="icon-btn" data-meditmove="'+m.id+':up" type="button" title="위로">▲</button>' : '') +
            (idx < msList.length - 1 ? '<button class="icon-btn" data-meditmove="'+m.id+':down" type="button" title="아래로">▼</button>' : '') +
            '<button class="icon-btn" data-meditdelms="'+m.id+'" type="button" title="마일스톤 삭제" style="color:var(--brand-strong);">×</button>' +
          '</div>' +
        '</div>' +
        (tRows ? '<div class="task-list" style="margin-top:6px;padding:4px 8px;background:var(--surface-2);border-radius:8px;">'+tRows+'</div>' : '') +
        '<div data-meditaddtask="'+m.id+'" style="cursor:pointer;margin-top:6px;font-size:.75rem;color:var(--brand-strong);font-weight:700;">+ 세부 할 일 추가</div>' +
      '</div>';
    }).join('');

    var modalHtml = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
      '<div style="display:flex;align-items:center;gap:6px;">' +
        '<span style="font-size:1.4rem;">🎯</span>' +
        '<div><h3 style="margin:0;font-size:1.1rem;">팀 목표 상세 편집</h3><div class="faint" style="font-size:.8125rem;">' + g.icon + ' ' + L.escapeHtml(g.name) + '</div></div>' +
      '</div>' +
    '</div>' +
    '<div class="field" style="margin-bottom:8px;"><label style="font-weight:700;font-size:.8125rem;">팀 목표명</label><input id="modalTgTitleInput" type="text" value="'+L.escapeHtml(tg.title)+'" style="font-weight:700;"></div>' +
    '<div class="field" style="margin-bottom:12px;"><label style="font-weight:700;font-size:.8125rem;">목표 마감일</label><input id="modalTgDueInput" type="date" value="'+(tg.dueDate||'')+'"></div>' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
      '<b style="font-size:.875rem;color:var(--ink);">마일스톤 & 세부 할 일 ('+msList.length+'개)</b>' +
      '<button class="btn btn-ghost btn-sm" id="modalTgAddMsBtn" type="button" style="padding:2px 8px;font-size:.75rem;color:var(--brand-strong);border-color:var(--red-line);">+ 마일스톤 추가</button>' +
    '</div>' +
    '<div style="max-height:50vh;overflow-y:auto;padding-right:2px;margin-bottom:12px;">' +
      (msHtml || '<p class="faint" style="text-align:center;padding:20px 0;">등록된 마일스톤이 없어요.</p>') +
    '</div>' +
    '<div class="modal-actions">' +
      '<button class="btn btn-danger btn-sm" id="modalTgDelGoalBtn" type="button" style="flex:0 0 auto;">목표 삭제</button>' +
      '<button class="btn btn-ghost btn-sm" id="modalTgCloseBtn" type="button" style="flex:1;">닫기</button>' +
      '<button class="btn btn-primary btn-sm" id="modalTgSaveBtn" type="button" style="flex:1;">저장 완료</button>' +
    '</div>';

    L.openModal(modalHtml, function(sheet){
      var refreshModal = async function(){ await L.saveProfile(); L.closeModal(); openTeamGoalEditModal(gid, tgid); };
      sheet.addEventListener('change', async function(e){
        var t = e.target;
        if(t.matches('#modalTgTitleInput')){ tg.title = t.value.trim() || tg.title; }
        else if(t.matches('#modalTgDueInput')){ tg.dueDate = t.value || null; }
        else if(t.dataset.meditmtitle){
          var m = (tg.milestones||[]).find(function(x){ return x.id===t.dataset.meditmtitle; });
          if(m){ m.title = t.value.trim() || m.title; await L.saveProfile(); }
        } else if(t.dataset.medittasktitle){
          var p = t.dataset.medittasktitle.split(':');
          var m = (tg.milestones||[]).find(function(x){ return x.id===p[0]; });
          var tk = m && (m.tasks||[]).find(function(x){ return x.id===p[1]; });
          if(tk){ tk.title = t.value.trim() || tk.title; await L.saveProfile(); }
        }
      });
      sheet.addEventListener('click', async function(e){
        var t = e.target;
        if(t.closest('#modalTgCloseBtn')){ return L.closeModal(); }
        if(t.closest('#modalTgAddMsBtn')){
          (tg.milestones = tg.milestones || []).push({ id: L.uid('tgm'), title: '새 마일스톤', status: 'todo', priority: 'med', tasks: [] });
          return refreshModal();
        }
        if(t.closest('#modalTgDelGoalBtn')){
          if(!(await OurgoalCapabilities.call('ui.confirm', '정말 "' + tg.title + '" 팀 목표를 삭제할까요?'))) return;
          g.teamGoals = (g.teamGoals||[]).filter(function(x){ return x.id !== tgid; });
          await L.saveProfile(); L.toast('팀 목표를 삭제했어요'); L.closeModal(); return L.renderTeamGoalsScreen();
        }
        if(t.closest('#modalTgSaveBtn')){
          var nt = (sheet.querySelector('#modalTgTitleInput').value||'').trim();
          if(nt) tg.title = nt;
          tg.dueDate = sheet.querySelector('#modalTgDueInput').value || null;
          await L.saveProfile(); L.toast('팀 목표를 저장했어요'); L.closeModal(); return L.renderTeamGoalsScreen();
        }
        var stEl = t.closest('[data-meditcyclestatus]');
        if(stEl){
          var m = (tg.milestones||[]).find(function(x){ return x.id===stEl.dataset.meditcyclestatus; });
          if(m){ m.status = ['todo','doing','done'][(['todo','doing','done'].indexOf(m.status)+1)%3]; L.triggerHaptic(10); return refreshModal(); }
        }
        var prEl = t.closest('[data-meditcycleprio]');
        if(prEl){
          var m = (tg.milestones||[]).find(function(x){ return x.id===prEl.dataset.meditcycleprio; });
          if(m){ m.priority = ['med','high','low'][(['med','high','low'].indexOf(m.priority||'med')+1)%3]; L.triggerHaptic(10); return refreshModal(); }
        }
        var mvEl = t.closest('[data-meditmove]');
        if(mvEl){
          var p = mvEl.dataset.meditmove.split(':'), mid = p[0], dir = p[1];
          var idx = (tg.milestones||[]).findIndex(function(x){ return x.id===mid; });
          if(dir==='up' && idx > 0){ var tmp = tg.milestones[idx]; tg.milestones[idx]=tg.milestones[idx-1]; tg.milestones[idx-1]=tmp; return refreshModal(); }
          if(dir==='down' && idx >= 0 && idx < tg.milestones.length-1){ var tmp = tg.milestones[idx]; tg.milestones[idx]=tg.milestones[idx+1]; tg.milestones[idx+1]=tmp; return refreshModal(); }
        }
        var delMsEl = t.closest('[data-meditdelms]');
        if(delMsEl){ tg.milestones = (tg.milestones||[]).filter(function(x){ return x.id!==delMsEl.dataset.meditdelms; }); return refreshModal(); }
        var chkEl = t.closest('[data-medittaskcheck]');
        if(chkEl){
          var p = chkEl.dataset.medittaskcheck.split(':');
          var m = (tg.milestones||[]).find(function(x){ return x.id===p[0]; });
          var tk = m && (m.tasks||[]).find(function(x){ return x.id===p[1]; });
          if(tk){ tk.done = !tk.done; L.triggerHaptic(10); return refreshModal(); }
        }
        var delTkEl = t.closest('[data-medittaskdel]');
        if(delTkEl){
          var p = delTkEl.dataset.medittaskdel.split(':');
          var m = (tg.milestones||[]).find(function(x){ return x.id===p[0]; });
          if(m){ m.tasks = (m.tasks||[]).filter(function(x){ return x.id!==p[1]; }); return refreshModal(); }
        }
        var addTkEl = t.closest('[data-meditaddtask]');
        if(addTkEl){
          var title = prompt('추가할 세부 할 일을 입력하세요:');
          if(!title || !title.trim()) return;
          var m = (tg.milestones||[]).find(function(x){ return x.id===addTkEl.dataset.meditaddtask; });
          if(m){ (m.tasks = m.tasks || []).push({ id: L.uid('tgt'), title: title.trim(), done: false }); return refreshModal(); }
        }
      });
    });
  }

  K.openTeamGoalEditModal = openTeamGoalEditModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
