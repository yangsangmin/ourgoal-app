/*
 * 앱을 내맘대로! — 홈 구성 요소 켜기/끄기 (#TASK-ES-020, KF-1)
 * - 화이트리스트에 있는 부가 위젯만 숨길 수 있다. 체크인 루프(오늘의 질문·답하기·피드백·내 위치·기록됨)와
 *   기록·소통 탭은 목록에 없고 절대 숨기지 않는다 (본질 ①②③ 보호, 정의서 REQ-P1).
 * - 저장: state.profile.settings.homeLayout = { hidden: [id...], version: 1 } → saveProfile()로 동기화.
 * - 마크업·CSS는 바꾸지 않는다. 표시/숨김은 인라인 display만 토글하고 원래 값을 되돌린다 (REQ-P3).
 * - 이 파일은 로드 시 document를 만지지 않는다 (스모크 테스트에서 샌드박스 로드).
 */
(function(root){
  'use strict';

  var WHITELIST = [
    { id: 'crewPacingWidget',     label: '오늘 함께 기록한 사람',   hint: '같은 목표로 오늘 기록한 사람 수' },
    { id: 'dailyQuestBarWrap',    label: '오늘의 퀘스트',           hint: '작은 도전 과제 바' },
    { id: 'levelBadgeRow',        label: '레벨 배지',               hint: '내 레벨과 경험치' },
    { id: 'todayGlancePill',      label: '오늘 몰입 요약',          hint: '오늘 상태 한 줄' },
    { id: 'quickRoutineRow',      label: '빠른 루틴 버튼',          hint: '운동 완료·물 2L 같은 한 번 누르기' },
    { id: 'customFeedbackBtn',    label: '맞춤 피드백 설정 버튼',   hint: '피드백 말투를 고르는 버튼' },
    { id: 'todayMissionCard',     label: '오늘 미션',               hint: '오늘 하나 해볼 것' },
    { id: 'homeGrassSummaryCard', label: '이번 주 잔디 요약',       hint: '이번 주 기록 한눈에' },
    { id: 'homeChallengeRoomBtn', label: '챌린지 룸 버튼',          hint: '소규모 챌린지 열기' },
    { id: 'mzShareBtn',           label: '자랑하기 버튼',           hint: '내 성장 카드 공유' }
  ];
  var WHITELIST_IDS = WHITELIST.map(function(w){ return w.id; });

  /* 절대 숨길 수 없는 것 — 코드로 보호한다 (REQ-P1) */
  var CORE_IDS = ['captureCardBox', 'captureInput', 'captureSave', 'homeGoalList', 'streakBadge', 'homeAddGoal',
                  'screen-home', 'screen-records', 'screen-comm', 'screen-goals', 'screen-calendar'];

  /* 기존 '포커스 미니멀' 모드 CSS가 숨기던 항목 — 저장값이 없을 때 이관 기준 (REQ-D3) */
  var MINIMAL_HIDDEN = ['crewPacingWidget', 'quickRoutineRow', 'homeGrassSummaryCard', 'customFeedbackBtn', 'homeChallengeRoomBtn'];
  var UX_MODE_KEY = 'ourgoal_ux_mode';
  var CUSTOM_MODE = 'custom';
  var PREV_ATTR = 'data-kf1-prev-display';

  function readUxMode(){
    try{ return (root.localStorage && root.localStorage.getItem(UX_MODE_KEY)) || 'minimal'; }catch(e){ return 'minimal'; }
  }

  /* 저장값 → 유효한 숨김 id 배열. 화이트리스트 밖 id·핵심 id는 버린다 (REQ-D2) */
  function normalize(layout){
    var src = (layout && Array.isArray(layout.hidden)) ? layout.hidden : [];
    var out = [];
    src.forEach(function(id){
      if(WHITELIST_IDS.indexOf(id) < 0) return;
      if(CORE_IDS.indexOf(id) >= 0) return;
      if(out.indexOf(id) < 0) out.push(id);
    });
    return out;
  }

  /* 현재 적용할 숨김 목록. 저장값이 없으면 기존 모드 칩 상태에서 유추 (REQ-D3, 쓰지는 않는다) */
  function effectiveHidden(settings){
    if(settings && settings.homeLayout) return normalize(settings.homeLayout);
    return readUxMode() === 'minimal' ? MINIMAL_HIDDEN.slice() : [];
  }

  function hideEl(el){
    if(!el.hasAttribute(PREV_ATTR)) el.setAttribute(PREV_ATTR, el.style.display || '');
    el.style.display = 'none';
  }
  function showEl(el){
    if(!el.hasAttribute(PREV_ATTR)) return;
    el.style.display = el.getAttribute(PREV_ATTR);
    el.removeAttribute(PREV_ATTR);
  }

  /* 홈 렌더 뒤 호출. settings만 받는다 (의존성 없음) */
  function apply(settings){
    if(typeof document === 'undefined') return [];
    var hidden = effectiveHidden(settings);
    WHITELIST_IDS.forEach(function(id){
      var el = document.getElementById(id);
      if(!el) return;
      if(hidden.indexOf(id) >= 0) hideEl(el); else showEl(el);
    });
    return hidden;
  }

  /* 유저가 직접 고르기 시작하면 프리셋 칩의 CSS 규칙이 덮어쓰지 않도록 'custom' 모드로 둔다 */
  function enterCustomMode(){
    try{
      root.localStorage.setItem(UX_MODE_KEY, CUSTOM_MODE);
      document.body.setAttribute('data-ux-mode', CUSTOM_MODE);
      var chips = document.querySelectorAll('#adaptiveModeSelector .mode-chip');
      Array.prototype.forEach.call(chips, function(c){ c.classList.remove('active'); });
    }catch(e){}
  }
  function leaveCustomMode(){
    try{
      root.localStorage.setItem(UX_MODE_KEY, 'minimal');
      document.body.setAttribute('data-ux-mode', 'minimal');
      var chips = document.querySelectorAll('#adaptiveModeSelector .mode-chip');
      Array.prototype.forEach.call(chips, function(c){ c.classList.toggle('active', c.dataset.mode === 'minimal'); });
    }catch(e){}
  }

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }

  /* deps: { state, saveProfile, toast, openModal, closeModal, track } — index.html 안 함수들을 넘겨 받는다 */
  function open(deps){
    var settings = deps.state.profile.settings;
    if(!settings.homeLayout) settings.homeLayout = { hidden: effectiveHidden(settings), version: 1 };
    else settings.homeLayout.hidden = normalize(settings.homeLayout);
    if(deps.track) deps.track('layout_open', { hidden: settings.homeLayout.hidden.length });

    function rowHtml(w){
      var on = settings.homeLayout.hidden.indexOf(w.id) < 0;
      return '<div class="toggle-row" style="margin-bottom:8px;">' +
        '<div class="t" style="font-size:.875rem;">' + esc(w.label) + '<div style="font-size:.8125rem;color:var(--ink-faint);font-weight:500;">' + esc(w.hint) + '</div></div>' +
        '<div class="switch' + (on ? ' on' : '') + '" role="switch" tabindex="0" aria-checked="' + on + '" aria-label="' + esc(w.label) + '" data-kf1-id="' + w.id + '"></div>' +
        '</div>';
    }
    var html = '<h3 style="margin:0 0 4px;">앱을 내맘대로!</h3>' +
      '<p style="font-size:.8125rem;color:var(--ink-soft);margin:0 0 12px;">홈에 보일 것만 남기세요. 오늘 기록하기·내 목표·기록·소통은 항상 보여요.</p>' +
      '<div id="kf1LayoutList">' + WHITELIST.map(rowHtml).join('') + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:14px;">' +
        '<button class="btn btn-ghost btn-sm" type="button" id="kf1ResetBtn" style="flex:1;">기본으로 되돌리기</button>' +
        '<button class="btn btn-primary btn-sm" type="button" id="kf1DoneBtn" style="flex:1;">완료</button>' +
      '</div>';

    deps.openModal(html, function(sheet){
      function persist(){
        apply(settings);
        var p = deps.saveProfile();
        if(p && p.then) p.then(function(){}, function(){});
      }
      sheet.querySelectorAll('.switch[data-kf1-id]').forEach(function(sw){
        var toggle = function(){
          var id = sw.getAttribute('data-kf1-id');
          var list = settings.homeLayout.hidden;
          var idx = list.indexOf(id);
          var nowOn;
          if(idx >= 0){ list.splice(idx, 1); nowOn = true; } else { list.push(id); nowOn = false; }
          sw.classList.toggle('on', nowOn);
          sw.setAttribute('aria-checked', String(nowOn));
          enterCustomMode();
          persist();
          if(deps.track) deps.track('layout_change', { section: id, on: nowOn });
        };
        sw.onclick = toggle;
        sw.onkeydown = function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); } };
      });
      var resetBtn = sheet.querySelector('#kf1ResetBtn');
      if(resetBtn) resetBtn.onclick = function(){
        if(!confirm('홈 구성을 처음 상태로 되돌릴까요?')) return;
        settings.homeLayout = { hidden: [], version: 1 };
        leaveCustomMode();
        persist();
        if(deps.track) deps.track('layout_reset', {});
        if(deps.toast) deps.toast('홈 구성을 기본으로 되돌렸어요');
        deps.closeModal();
      };
      var doneBtn = sheet.querySelector('#kf1DoneBtn');
      if(doneBtn) doneBtn.onclick = function(){
        if(deps.toast) deps.toast('홈 구성을 저장했어요');
        deps.closeModal();
      };
    });
  }

  root.OurgoalCustomize = {
    WHITELIST: WHITELIST,
    WHITELIST_IDS: WHITELIST_IDS,
    CORE_IDS: CORE_IDS,
    MINIMAL_HIDDEN: MINIMAL_HIDDEN,
    normalize: normalize,
    effectiveHidden: effectiveHidden,
    apply: apply,
    open: open
  };
})(typeof window !== 'undefined' ? window : this);
