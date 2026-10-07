/**
 * 크리에이터 템플릿(구형 창)
 *
 * 구형 템플릿 60선 창 렌더링 및 템플릿 복제 함수
 * #TASK-ES-591(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 6854~6877 · 6878~6900줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalCreatorTemplatesLegacyKit = global.OurgoalCreatorTemplatesLegacyKit || {};

  /* ---- 이전 전 index.html 6854~6877줄(#TASK-ES-591 생성기 표지) ---- */
  function templatesHtml(){
    // [#TASK-ES-315, 64] 소통탭 내 구형 60선 창 영구 제거 (템플릿백과사전 일원화)
    if(!window.__FORCE_LEGACY_TEMPLATES_CARD) return '';
    if(window.OurgoalTemplateCredit){ setTimeout(function(){ window.OurgoalTemplateCredit.fillCounts(document.getElementById('commSubBody')); }, 0); }
    if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.renderTemplatesAccordionHtml){
      return window.OurgoalTeamInviteComm.renderTemplatesAccordionHtml();
    }
    var isExpanded = (L.state.templatesExpanded === true);
    return '<div class="card" style="margin-bottom:12px;padding:10px 14px;background:var(--surface-2);border:1px solid var(--rule);border-radius:14px;display:none;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;" id="toggleTemplatesBtn">' +
        '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:1.15rem;">📋</span><b style="font-size:.875rem;">아워골 추천 템플릿 3종</b></div>' +
        '<button type="button" class="btn btn-ghost btn-xs" id="toggleTemplatesBtnInner" aria-expanded="' + isExpanded + '" style="font-size:.75rem;padding:2px 8px;border:1px solid var(--rule);color:var(--brand-strong);cursor:pointer;">' + (isExpanded ? '접기 ▲' : '둘러보기 ▼') + '</button>' +
      '</div>' +
      (isExpanded ? '<div style="margin-top:10px;">' + L.CREATOR_TEMPLATES.map(function(t){
        return '<div class="tmpl-card" style="margin-bottom:8px;padding:10px;">' +
          '<div class="tmpl-head"><span class="tmpl-badge">M</span><b style="font-size:.875rem;">' + L.escapeHtml(t.title) + '</b></div>' +
          '<div class="tm-desc" style="font-size:.8125rem;">' + L.escapeHtml(t.desc) + '</div>' +
          '<div class="faint" data-tplcount="creator:'+t.id+'" style="font-size:.8125rem;margin-bottom:8px;display:none;"></div>' +
          '<button class="tmpl-btn btn-transplant" data-tmpl="' + t.id + '" type="button" style="margin-top:6px;padding:7px 14px;font-weight:700;">⚡ 내 목표에 바로 담기</button>' +
        '</div>';
      }).join('') + '</div>' : '') +
      '<div style="height:4px;"></div>' +
    '</div>';
  }
  /* ---- 이전 전 index.html 6878~6900줄(#TASK-ES-591 생성기 표지) ---- */

  async function cloneTemplate(tmplId, rerender){
    var t = L.CREATOR_TEMPLATES.find(function(x){ return x.id===tmplId; }) || (window.OURGOAL_60_TEMPLATES && window.OURGOAL_60_TEMPLATES.getById ? window.OURGOAL_60_TEMPLATES.getById(tmplId) : null) || (window.REAL_USER_TEMPLATES && window.REAL_USER_TEMPLATES.find(function(x){ return x.id===tmplId; }));
    if(!t) return;
    var goal = {
      id: L.newId(), title: t.title, dueDate: null, category: t.category,
      createdAt: L.nowISO(), visibility: 'private',
      milestones: t.ms.map(function(m){
        return {
          id: L.uid('ms'), title: m.title, status:'todo', dueDate:null,
          tasks: m.tasks.map(function(tk){ return { id: L.uid('task'), title: tk, done:false }; })
        };
      })
    };
    L.state.profile.goals.push(goal);
    L.state.activeGoalId = goal.id;
    L.trackGoalCreated(goal, 'community_template');
    await L.saveProfile();
    L.toast('\'' + (t.title && t.title.length > 18 ? t.title.slice(0, 18) + '...' : t.title) + '\' 목표를 추가했어요! 🎯');
    if(window.OurgoalTemplateCredit) window.OurgoalTemplateCredit.recordCopy('creator:' + t.id, null); // KF-2 #TASK-ES-017: 서버 실복제 기록
    L.renderAll();
    if(rerender) rerender();
  }

  K.templatesHtml = templatesHtml;
  K.cloneTemplate = cloneTemplate;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
