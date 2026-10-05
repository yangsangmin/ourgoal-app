/**
 * OurGoal Goal Archive (목표 탭 — 보관한 목표 화면·되돌리기·달성률)
 *
 * 「목표 보관(기록으로 옮기기)」 묶음 전체: 보관 목표 되돌리기(restoreGoal)·목표 달성률(goalAchievement)·보관 목표 목록 그리기(renderArchivedGoals, #archivedGoals)와 기간·쪽 고르기 노출(bindArchivedPeriodSetter·bindArchivedPageSetter — index.html 원래 자리에서 부른다).
 * goalAchievement 는 smoke-test FN_NAMES 다 — 시험지는 인라인 합본(tests/helpers/inline-bundle.js)에서 이 글자를 찾는다.
 * #TASK-ES-520(인라인 3단계 Z4 — FN_NAMES 묶음(목표 보관·히트맵·표 집계·표 추이·여러 지표 SVG)): index.html 인라인 IIFE 의 구간(이전 전 7861~7869 · 7870~7882 · 7883~7888 · 7889~7896 · 7897~8029줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 7861~7869줄(#TASK-ES-520 생성기 표지) ---- */
  /* ============ 목표 보관(기록으로 옮기기) ============ */
  /* [#TASK-ES-375] archiveGoal → js/tabs/goals/goal-export.js 로 옮김(목표 탭 세포 2차) */
  async function restoreGoal(goal){
    goal.archivedAt = null;
    await L.saveProfile();
    L.renderAll();
    L.setTab('goals');
    L.toast('목표를 다시 진행 중으로 되돌렸어요');
  }
  /* ---- 이전 전 index.html 7870~7882줄(#TASK-ES-520 생성기 표지) ---- */
  function goalAchievement(goal){
    var pct = L.resultPct(goal.result);
    if(pct !== null) return pct;
    var all = [], done = 0;
    goal.milestones.forEach(function(m){
      var mp = L.resultPct(m.result);
      if(mp !== null){ all.push(mp); return; }
      all.push(m.status==='done' ? 100 : (m.status==='doing' ? 50 : 0));
    });
    if(!all.length) return 0;
    all.forEach(function(v){ done += v; });
    return Math.round(done / all.length);
  }
  /* ---- 이전 전 index.html 7883~7888줄(#TASK-ES-520 생성기 표지) ---- */
  function bindArchivedPeriodSetter() { /* [#TASK-ES-520] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  window.setArchivedPeriod = function(p) {
    if (!window.state) window.state = {};
    window.state.archivedPeriodFilter = p;
    window.state.archivedPastPage = 1;
    renderArchivedGoals();
  };
  } /* bindArchivedPeriodSetter */
  /* ---- 이전 전 index.html 7889~7896줄(#TASK-ES-520 생성기 표지) ---- */
  function bindArchivedPageSetter() { /* [#TASK-ES-520] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */

  window.setArchivedPage = function(page) {
    if (!window.state) window.state = {};
    window.state.archivedPastPage = page;
    renderArchivedGoals();
    var c = document.getElementById('archPastArchiveCard');
    if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  } /* bindArchivedPageSetter */
  /* ---- 이전 전 index.html 7897~8029줄(#TASK-ES-520 생성기 표지) ---- */

  function renderArchivedGoals(){
    var wrap = document.getElementById('archivedGoals');
    if(!wrap) return;
    if(!L.state || !L.state.profile) return;
    var allArchived = (L.state.profile.goals || []).filter(function(g){ return g.archivedAt; })
      .sort(function(a,b){ return new Date(b.archivedAt) - new Date(a.archivedAt); });

    if(!allArchived.length){
      wrap.innerHTML = '<p class="faint" style="margin:0 0 18px;text-align:center;padding:24px 0;">마감일이 지난 목표는 삭제 대신 여기로 옮겨서 결과와 함께 남길 수 있어요.</p>';
      return;
    }

    function buildGoalCardHtml(g, isLatest) {
      var pct = goalAchievement(g);
      var days = Math.max(1, Math.round((new Date(g.archivedAt) - new Date(g.createdAt))/86400000));
      var latestBadge = isLatest ? '<span style="font-size:0.7rem;font-weight:700;color:var(--brand);background:var(--brand-glow, rgba(99,102,241,0.12));padding:1px 6px;border-radius:4px;margin-left:6px;">최신 보관</span>' : '';
      var msHtml = '';
      if (Array.isArray(g.milestones) && g.milestones.length > 0) {
        var msList = g.milestones.map(function(m){
          var mp = L.resultPct(m.result);
          return '· '+L.escapeHtml(m.title)+' — '+(mp!==null ? m.result.result+'/'+m.result.target+' '+(m.result.unit||'')+' ('+mp+'%)' : (m.status==='done'?'완료':'미완료'));
        }).join('<br>');
        msHtml = '<details class="archive-ms-details" style="margin-top:8px;border-top:1px dashed var(--line, rgba(255,255,255,0.08));padding-top:6px;">' +
          '<summary style="font-size:0.75rem;color:var(--ink-soft);cursor:pointer;user-select:none;font-weight:600;">세부 마일스톤 (' + g.milestones.length + '개) 보기 ▾</summary>' +
          '<div class="archive-ms" style="margin-top:6px;font-size:0.75rem;line-height:1.45;color:var(--ink-sub);">' + msList + '</div>' +
        '</details>';
      }

      return '<div class="archive-card" data-arch="'+g.id+'" style="margin-bottom:10px;">' +
        '<div class="archive-top"><b>'+L.escapeHtml(g.title)+'</b>' + latestBadge + '<span class="archive-pct" style="margin-left:auto;">'+pct+'%</span></div>' +
        '<div class="archive-meta">'+(g.topic?L.topicLabel(g.topic)+' · ':'')+days+'일간 진행 · '+
          (g.dueDate ? '마감 '+g.dueDate+' · ' : '')+L.dateKey(g.archivedAt)+' 보관</div>' +
        (g.result ? '<div class="archive-meta">최종 '+(g.result.result||0)+'/'+(g.result.target||'-')+' '+(g.result.unit||'')+
          (g.result.note ? ' · '+L.escapeHtml(g.result.note) : '')+'</div>' : '') +
        msHtml +
        '<button class="btn btn-ghost btn-sm" data-restore="'+g.id+'" type="button" style="width:100%;margin-top:10px;">다시 진행하기</button>' +
      '</div>';
    }

    // 1. 최신 3개 전면 노출
    var top3Goals = allArchived.slice(0, 3);
    var top3Html = top3Goals.map(function(g, idx){
      return buildGoalCardHtml(g, idx === 0);
    }).join('');

    // 2. 4번째 이후 이전 완료 목표 모아보기
    var allPast = allArchived.slice(3);
    var pastSectionHtml = '';

    if (allPast.length > 0) {
      var pFilter = (L.state && L.state.archivedPeriodFilter) || 'all';
      var currentYear = new Date().getFullYear();

      var filteredPast = allPast;
      if (pFilter === 'this_year') {
        filteredPast = allPast.filter(function(g){
          return new Date(g.archivedAt || g.createdAt || 0).getFullYear() === currentYear;
        });
      } else if (pFilter === 'last_year') {
        filteredPast = allPast.filter(function(g){
          return new Date(g.archivedAt || g.createdAt || 0).getFullYear() === (currentYear - 1);
        });
      } else if (pFilter === 'health') {
        filteredPast = allPast.filter(function(g){ return g.topic === 'health'; });
      } else if (pFilter === 'study') {
        filteredPast = allPast.filter(function(g){ return g.topic === 'study'; });
      }

      var PAGE_SIZE = 5;
      var totalPast = filteredPast.length;
      var totalPages = Math.max(1, Math.ceil(totalPast / PAGE_SIZE));
      var currPage = Math.min(Math.max(1, (L.state && L.state.archivedPastPage) || 1), totalPages);
      if (L.state) L.state.archivedPastPage = currPage;
      var pageItems = filteredPast.slice((currPage - 1) * PAGE_SIZE, currPage * PAGE_SIZE);

      var pastCardsHtml = '';
      if (pageItems.length === 0) {
        pastCardsHtml = '<div style="text-align:center;padding:20px;font-size:0.8125rem;color:var(--ink-faint);">' +
          '선택한 분류의 이전 보관 목표가 없습니다.<br>' +
          '<button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px;" onclick="window.setArchivedPeriod(\'all\');">전체 보기</button>' +
        '</div>';
      } else {
        var cardsList = pageItems.map(function(g){ return buildGoalCardHtml(g, false); }).join('');
        var pagerHtml = '<div class="rec-past-pager" style="margin-top:12px;padding-top:10px;">' +
          '<button type="button" class="rec-pager-btn" ' + (currPage <= 1 ? 'disabled' : '') + ' onclick="window.setArchivedPage(' + (currPage - 1) + ');">' +
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
            '<span>이전 5개</span>' +
          '</button>' +
          '<div class="rec-pager-info">' +
            '<b>' + currPage + ' / ' + totalPages + ' 페이지</b>' +
            '<span>(이전 목표 총 ' + totalPast + '개)</span>' +
          '</div>' +
          '<button type="button" class="rec-pager-btn" ' + (currPage >= totalPages ? 'disabled' : '') + ' onclick="window.setArchivedPage(' + (currPage + 1) + ');">' +
            '<span>다음 5개</span>' +
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
          '</button>' +
        '</div>';
        pastCardsHtml = cardsList + pagerHtml;
      }

      pastSectionHtml = '<div class="rec-past-archive-card" id="archPastArchiveCard" style="margin-top:16px;">' +
        '<div class="rec-past-header-row">' +
          '<div class="rec-past-title"><span>📂 이전 완료 목표 모아보기</span></div>' +
          '<span class="rec-past-meta">총 ' + totalPast + '개</span>' +
        '</div>' +
        '<div class="rec-period-chip-bar">' +
          '<button type="button" class="rec-period-chip ' + (pFilter === 'all' ? 'active' : '') + '" onclick="window.setArchivedPeriod(\'all\');">전체</button>' +
          '<button type="button" class="rec-period-chip ' + (pFilter === 'this_year' ? 'active' : '') + '" onclick="window.setArchivedPeriod(\'this_year\');">올해</button>' +
          '<button type="button" class="rec-period-chip ' + (pFilter === 'last_year' ? 'active' : '') + '" onclick="window.setArchivedPeriod(\'last_year\');">작년</button>' +
          '<button type="button" class="rec-period-chip ' + (pFilter === 'health' ? 'active' : '') + '" onclick="window.setArchivedPeriod(\'health\');">운동/건강</button>' +
          '<button type="button" class="rec-period-chip ' + (pFilter === 'study' ? 'active' : '') + '" onclick="window.setArchivedPeriod(\'study\');">학습/성장</button>' +
        '</div>' +
        pastCardsHtml +
      '</div>';
    } else {
      pastSectionHtml = '<div style="font-size:0.78rem;color:var(--ink-faint);text-align:center;padding:12px 0;">✨ 모든 보관 목표를 확인했습니다.</div>';
    }

    wrap.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
        '<span style="font-size:0.75rem;font-weight:700;color:var(--ink-soft);">✨ 최근 완료·보관 목표 (최신순 3개)</span>' +
        '<span class="faint" style="font-size:0.75rem;">총 ' + allArchived.length + '개 보관됨</span>' +
      '</div>' +
      top3Html +
      pastSectionHtml;

    wrap.querySelectorAll('[data-restore]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var g = L.state.profile.goals.find(function(x){ return x.id===btn.dataset.restore; });
        if(g) restoreGoal(g);
      });
    });
  }

  K.restoreGoal = restoreGoal;
  K.goalAchievement = goalAchievement;
  K.bindArchivedPeriodSetter = bindArchivedPeriodSetter;
  K.bindArchivedPageSetter = bindArchivedPageSetter;
  K.renderArchivedGoals = renderArchivedGoals;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
