/**
 * js/sanctuary-v3-engine.js — 포커스 성소 20대 전수 화면 실제 엔진 직결 조형 렌더러
 * 더미 목데이터 0%, 100% 실제 데이터 원장(state.profile.goals, calendarItemsByDate, records) 바인딩
 * 72개 인터랙션 전수 실구현 및 20종 정본 그래픽 시안 1:1 완벽 일치 보장
 */
(function(window) {
  'use strict';

  /* ============ [#TASK-ES-429] 포커스 성소 세포 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) ============
     레이더 함수·렌더 분기 본문·공개 객체 메서드를 js/sanctuary-*.js 세포로 옮겼다(동작 그대로, index.html 이 세포를 먼저 읽는다).
     ① 옮긴 함수는 이 스코프에서 같은 이름으로 가져온다 ② 옮긴 메서드는 아래 window.OurgoalSanctuaryV3 객체의 같은 자리에서 펼친다(...)
     ③ 옮긴 코드가 읽는 이 스코프 이름만 키트 칸 scope 에 getter 로 노출한다(목록은 스코프 분석으로 뽑았다). */
  var _sKit = window.OurgoalSanctuaryV3Kit || {};
  var _sRadar = _sKit.peerRadar || {};
  var _sCalViews = _sKit.calendarViews || {};
  var _sCalActions = _sKit.calendarActions || {};
  var _sGoalTrail = _sKit.goalTrail || {};
  var _sRecFeed = _sKit.recordFeed || {};
  var _sRecap = _sKit.weeklyRecap || {};
  var _sTimer = _sKit.focusTimer || {};
  var renderPeerAvatarHtml = _sRadar.renderPeerAvatarHtml;
  var getRealRunningMates = _sRadar.getRealRunningMates;
  var toggleRadarCollapse = _sRadar.toggleRadarCollapse;
  var renderSanctuaryComm = _sRadar.renderSanctuaryComm;
  var renderSanctuaryCalendarMonth = _sCalViews.renderSanctuaryCalendarMonth;
  var renderSanctuaryCalendarTimeline = _sCalViews.renderSanctuaryCalendarTimeline;
  var renderSanctuaryGoalTrail = _sGoalTrail.renderSanctuaryGoalTrail;
  var renderSanctuaryRecordsFeed = _sRecFeed.renderSanctuaryRecordsFeed;
  var renderSanctuaryRecordsArchive = _sRecFeed.renderSanctuaryRecordsArchive;
  var renderSanctuaryRecordsRecap = _sRecap.renderSanctuaryRecordsRecap;
  var renderSanctuaryRecordsTimer = _sTimer.renderSanctuaryRecordsTimer;
  Object.defineProperties(_sRadar.scope || (_sRadar.scope = {}), Object.getOwnPropertyDescriptors({ get escapeHtml(){ return escapeHtml; } }));
  Object.defineProperties(_sCalViews.scope || (_sCalViews.scope = {}), Object.getOwnPropertyDescriptors({ get engine(){ return engine; }, get escapeHtml(){ return escapeHtml; }, get getTodayStr(){ return getTodayStr; } }));
  Object.defineProperties(_sCalActions.scope || (_sCalActions.scope = {}), Object.getOwnPropertyDescriptors({ get engine(){ return engine; }, get getTodayStr(){ return getTodayStr; }, get renderCalDayDetail(){ return renderCalDayDetail; }, get renderSanctuaryCalendar(){ return renderSanctuaryCalendar; } }));
  Object.defineProperties(_sGoalTrail.scope || (_sGoalTrail.scope = {}), Object.getOwnPropertyDescriptors({ get engine(){ return engine; }, get escapeHtml(){ return escapeHtml; }, get getTodayStr(){ return getTodayStr; }, get renderSanctuaryGoals(){ return renderSanctuaryGoals; } }));
  Object.defineProperties(_sRecFeed.scope || (_sRecFeed.scope = {}), Object.getOwnPropertyDescriptors({ get engine(){ return engine; }, get escapeHtml(){ return escapeHtml; }, get getTodayStr(){ return getTodayStr; }, get renderSanctuaryRecords(){ return renderSanctuaryRecords; } }));
  Object.defineProperties(_sRecap.scope || (_sRecap.scope = {}), Object.getOwnPropertyDescriptors({ get getTodayStr(){ return getTodayStr; } }));
  Object.defineProperties(_sTimer.scope || (_sTimer.scope = {}), Object.getOwnPropertyDescriptors({ get engine(){ return engine; }, get escapeHtml(){ return escapeHtml; }, get getTodayStr(){ return getTodayStr; }, get renderSanctuaryCalendar(){ return renderSanctuaryCalendar; }, get renderSanctuaryRecords(){ return renderSanctuaryRecords; } }));

  var engine = {
    activeCalMode: 'month',   // 'month' | 'timeline' | 'timer'
    activeRecMode: 'heatmap', // 'heatmap' | 'feed' | 'stats' | 'archive' | 'recap'
    activeGoalId: null,
    timerInterval: null,
    timerSeconds: 1500, // 25:00
    timerRunning: false,
    selectedCalDate: null,
    calYear: null,
    calMonth: null,
    heatFilter: 'all',        // 'today' | 'week' | 'month' | 'year' | 'all'
    feedPeriod: 'all',        // 'all' | 'week' | 'month' | 'last_month' | '30d' | 'custom'
    feedPage: 1,
    feedCustomStart: null,
    feedCustomEnd: null,
    archivePeriod: 'all',
    archivePage: 1,
    activeDmPeer: null,
    dmHistory: {}
  };

  function isFocusSanctuary() {
    var th = document.documentElement.getAttribute('data-theme') || 'focus-sanctuary';
    if (th === 'dark') th = 'focus-sanctuary';
    return ['focus-sanctuary', 'black', 'white', 'urban-city'].indexOf(th) !== -1;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // [#TASK-ES-362 CAL-04] 날짜를 고르거나 옮기면 아래 상세 칸(#calDayDetail)을 그 날짜로 다시 그린다. 예전에는 없는 전역 window.renderCalDayDetail 을
  // 찾아 늘 건너뛰었다. 실제 함수는 일정 키트(js/tabs/calendar/day-detail.js refreshCalDayDetail) — 전역 이름을 새로 달지 않는다.
  function renderCalDayDetail() {
    var kit = window.OurgoalCalendarKit;
    return !!(kit && typeof kit.refreshCalDayDetail === 'function' && kit.refreshCalDayDetail());
  }

  function getTodayStr() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  /* =========================================================================
   * 1. 목표 탭: 마운틴 트레일(Mountain Trail) & 실제 목표 엔진 직결
   * ========================================================================= */

  /* =========================================================================
   * 0. 홈 탭: 3초 고속 체크인 원카드 / 실시간 히트맵 스트릭 / 갓생 퀘스트 (#TASK-ES-331)
   * ========================================================================= */
  function renderSanctuaryHome() {
    var homeScreen = document.getElementById('screen-home');
    if (!homeScreen) return;

    var slot = document.getElementById('sanctuaryHomeSlot');
    if (slot) {
      slot.innerHTML = '';
      slot.style.display = 'none';
    }
  }

  /* =========================================================================
   * 6. 설정 탭: 4대 테마 원클릭 설정 & 프로필 및 알림 통합 제어 (#TASK-ES-331)
   * ========================================================================= */
    function renderSanctuarySettings() {
    var settingsScreen = document.getElementById('screen-settings');
    if (!settingsScreen) return;

    var slot = document.getElementById('sanctuarySettingsSlot');
    if (!slot) {
      var hero = document.getElementById('settingsHeroCard');
      slot = document.createElement('div');
      slot.id = 'sanctuarySettingsSlot';
      slot.className = 'sanctuary-settings-slot';
      if (hero && hero.nextSibling) {
        settingsScreen.insertBefore(slot, hero.nextSibling);
      } else {
        settingsScreen.appendChild(slot);
      }
    }

    var curTheme = document.documentElement.getAttribute('data-theme') || 'focus-sanctuary';

    var themeCardHtml = 
      '<div class="blueprint-card">' +
        '<div class="card-head">' +
          '<div class="card-title">🎨 화면스타일 4대 테마 원클릭 설정</div>' +
          '<span style="font-size:0.72rem;color:var(--s-brand, #10B981);font-weight:700;">실시간 즉시 적용</span>' +
        '</div>' +
        '<div class="theme-grid-picker">' +
          '<div class="theme-grid-chip ' + (curTheme === 'focus-sanctuary' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.switchTheme(\'focus-sanctuary\')" title="눈이 편안한 에메랄드 다크 테마로 0.01초 만에 전환돼요">' +
            '<div class="theme-color-dot" style="background:#0B0F17;border-color:#10B981;"></div>' +
            '<div><div style="font-size:0.8rem;font-weight:800;color:var(--s-ink, #F1F5F9);">성소 (다크)</div><div style="font-size:0.68rem;color:var(--s-ink-soft, #94A3B8);">눈 편한 에메랄드</div></div>' +
          '</div>' +
          '<div class="theme-grid-chip ' + (curTheme === 'black' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.switchTheme(\'black\')" title="배터리를 절약하는 OLED 딥블랙 테마로 0.01초 만에 전환돼요">' +
            '<div class="theme-color-dot" style="background:#000000;border-color:#38BDF8;"></div>' +
            '<div><div style="font-size:0.8rem;font-weight:800;color:var(--s-ink, #F1F5F9);">블랙 (OLED)</div><div style="font-size:0.68rem;color:var(--s-ink-soft, #94A3B8);">배터리 절약 블랙</div></div>' +
          '</div>' +
          '<div class="theme-grid-chip ' + (curTheme === 'white' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.switchTheme(\'white\')" title="산뜻하고 선명한 낮 시간용 퓨어 화이트 테마로 0.01초 만에 전환돼요">' +
            '<div class="theme-color-dot" style="background:#FFFFFF;border-color:#059669;"></div>' +
            '<div><div style="font-size:0.8rem;font-weight:800;color:var(--s-ink, #F1F5F9);">퓨어 화이트</div><div style="font-size:0.68rem;color:var(--s-ink-soft, #94A3B8);">선명한 모던라이트</div></div>' +
          '</div>' +
          '<div class="theme-grid-chip ' + (curTheme === 'urban-city' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.switchTheme(\'urban-city\')" title="집중력을 극대화하는 네오 사이버블루 테마로 0.01초 만에 전환돼요">' +
            '<div class="theme-color-dot" style="background:#0B0F19;border-color:#0EA5E9;"></div>' +
            '<div><div style="font-size:0.8rem;font-weight:800;color:var(--s-ink, #F1F5F9);">어반 시티</div><div style="font-size:0.68rem;color:var(--s-ink-soft, #94A3B8);">집중 네오블루</div></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    slot.innerHTML = themeCardHtml;
  }

  function renderSanctuaryGoals() {
    var slot = document.getElementById('sanctuaryGoalsView');
    if (!slot) return;

    var goals = (window.state && window.state.profile && window.state.profile.goals) || [];
    if (!engine.activeGoalId || !goals.find(function(g) { return g.id === engine.activeGoalId; })) {
      engine.activeGoalId = goals.length ? goals[0].id : null;
    }
    if (window.state) {
      window.state.activeGoalId = engine.activeGoalId;
    }

    var activeGoal = goals.find(function(g) { return g.id === engine.activeGoalId; }) || goals[0];

    // 1-1. 상단 목표 알약 셀렉터 (목표가 0건이어도 추가 버튼 보존)
    var pillsHtml = '';
    if (goals.length > 0) {
      pillsHtml = '<div class="s-goal-pills-wrap">' +
        goals.map(function(g) {
          var isCur = (g.id === engine.activeGoalId);
          return '<button type="button" class="s-goal-pill ' + (isCur ? 'active' : '') + '" data-sgoalid="' + g.id + '">' +
            escapeHtml(g.title) +
          '</button>';
        }).join('') +
        '<button type="button" class="s-goal-pill add" id="sAddGoalBtn" onclick="if(window.promptNewGoal) window.promptNewGoal(); else if(typeof promptNewGoal === \'function\') promptNewGoal(); else toast(\'목표 추가 창을 불러오는 중입니다\');">+ 새 목표</button>' +
      '</div>';
    } else {
      pillsHtml = '<div class="s-goal-pills-wrap empty" style="display:none;"></div>';
    }

    // 1-2. 마운틴 트레일 카드 조형
    var trailHtml = '';
    if (!activeGoal) {
      var templateHeroHtml = '<div class="card goal-template-hero-card" id="goalTemplateHeroCard" style="margin-top:16px;text-align:left;background:var(--card);border:1.5px solid var(--brand-line, var(--rule));border-radius:16px;padding:16px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="font-size:1.3rem;">📖</span>' +
            '<h3 style="margin:0;font-size:1.05rem;font-weight:800;color:var(--ink);">추천 목표 템플릿 백과사전</h3>' +
          '</div>' +
          '<span class="dday-pill" style="background:var(--brand-soft);color:var(--brand-strong);font-weight:700;font-size:12px;">1초 자동 이식</span>' +
        '</div>' +
        '<p class="faint" style="font-size:13px;line-height:1.4;margin:0 0 12px;color:var(--ink-soft);">' +
          '무엇부터 시작할지 고민되시나요? 검증된 인기 로드맵을 1클릭으로 바로 내 목표에 담아보세요!' +
        '</p>' +
        '<div class="template-quick-adopt-list" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">' +
          '<div class="template-quick-card" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface);border:1px solid var(--rule);border-radius:12px;">' +
            '<div style="display:flex;align-items:center;gap:8px;min-width:0;">' +
              '<span style="font-size:1.15rem;">🏃</span>' +
              '<div style="min-width:0;">' +
                '<div style="font-size:13.5px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">10km 마라톤 완주 로드맵</div>' +
                '<div class="faint" style="font-size:12px;color:var(--ink-soft);">운동/건강 · 4단계 마일스톤</div>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="btn btn-primary btn-sm btn-quick-adopt-goal" onclick="adoptTemplateAsMyGoal(\'10km 마라톤 완주 로드맵\', \'운동/건강\')" style="min-height:44px;padding:0 12px;font-size:12.5px;font-weight:700;border-radius:8px;flex-shrink:0;">+ 담기</button>' +
          '</div>' +
          '<div class="template-quick-card" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface);border:1px solid var(--rule);border-radius:12px;">' +
            '<div style="display:flex;align-items:center;gap:8px;min-width:0;">' +
              '<span style="font-size:1.15rem;">📚</span>' +
              '<div style="min-width:0;">' +
                '<div style="font-size:13.5px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">정보처리기사 실기 합격</div>' +
                '<div class="faint" style="font-size:12px;color:var(--ink-soft);">학습/성장 · 4단계 마일스톤</div>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="btn btn-primary btn-sm btn-quick-adopt-goal" onclick="adoptTemplateAsMyGoal(\'정보처리기사 실기 합격\', \'학습/성장\')" style="min-height:44px;padding:0 12px;font-size:12.5px;font-weight:700;border-radius:8px;flex-shrink:0;">+ 담기</button>' +
          '</div>' +
          '<div class="template-quick-card" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface);border:1px solid var(--rule);border-radius:12px;">' +
            '<div style="display:flex;align-items:center;gap:8px;min-width:0;">' +
              '<span style="font-size:1.15rem;">🌱</span>' +
              '<div style="min-width:0;">' +
                '<div style="font-size:13.5px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">미라클 모닝 30일 루틴</div>' +
                '<div class="faint" style="font-size:12px;color:var(--ink-soft);">습관/루틴 · 3단계 마일스톤</div>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="btn btn-primary btn-sm btn-quick-adopt-goal" onclick="adoptTemplateAsMyGoal(\'미라클 모닝 30일 루틴\', \'습관/루틴\')" style="min-height:44px;padding:0 12px;font-size:12.5px;font-weight:700;border-radius:8px;flex-shrink:0;">+ 담기</button>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="btn btn-ghost" id="btnOpenFullTemplateEncyclopedia" onclick="switchGoalsSubTab(\'templateEncyclopedia\')" style="width:100%;min-height:44px;font-size:13px;font-weight:700;border:1px solid var(--rule);border-radius:10px;background:var(--card2);">📖 템플릿 백과사전 전체 둘러보기 (60선)</button>' +
      '</div>';

      trailHtml = '<div class="mountain-trail-card empty-card" style="margin:16px 0;border-radius:20px;border:1px dashed var(--rule);background:var(--card);">' +
        '<div style="text-align:center;padding:50px 24px;color:var(--ink-sub);">' +
          '<div style="font-size:3rem;margin-bottom:14px;">🏔️</div>' +
          '<h3 style="margin-bottom:8px;font-size:1.25rem;font-weight:800;color:var(--ink);">등록된 목표가 없습니다</h3>' +
          '<p style="font-size:0.9rem;margin-bottom:24px;color:var(--ink-soft);line-height:1.5;">나만의 첫 목표를 만들고 등반을 시작해보세요.</p>' +
          '<button class="btn btn-primary btn-empty-add-goal" id="sAddGoalBtn" type="button" onclick="if(window.promptNewGoal) window.promptNewGoal(); else if(typeof promptNewGoal === \'function\') promptNewGoal();" style="padding:10px 24px;font-size:0.95rem;font-weight:700;border-radius:12px;background:var(--brand);color:#fff;border:none;box-shadow:0 4px 12px rgba(225,29,72,0.25);cursor:pointer;">+ 새 목표 만들기</button>' +
        '</div>' +
      '</div>' + templateHeroHtml;
    } else {
      trailHtml = renderSanctuaryGoalTrail(activeGoal, trailHtml); // [#TASK-ES-429] 분기 본문 → js/sanctuary-goal-trail.js
    }

    slot.innerHTML = pillsHtml + trailHtml;

    // 알약 클릭 이벤트 바인딩
    slot.querySelectorAll('[data-sgoalid]').forEach(function(b) {
      b.onclick = function() {
        engine.activeGoalId = b.dataset.sgoalid;
        if (window.state) window.state.activeGoalId = b.dataset.sgoalid;
        renderSanctuaryGoals();
      };
    });
  }

  /* =========================================================================
   * 2. 일정 탭: 월간 포토 캘린더 / 24시간 타임라인 / 뽀모도로 타이머 직결
   * ========================================================================= */
  function renderSanctuaryCalendar() {
    var slot = document.getElementById('sanctuaryCalendarView');
    if (!slot) return;

    if (!engine.calYear || !engine.calMonth) {
      var baseDate = (window.state && window.state.calDate) ? new Date(window.state.calDate + 'T00:00:00') : new Date();
      if (isNaN(baseDate.getTime())) baseDate = new Date();
      engine.calYear = baseDate.getFullYear();
      engine.calMonth = baseDate.getMonth() + 1;
    }

    if (!engine.selectedCalDate) {
      engine.selectedCalDate = (window.state && window.state.calSelectedDate) || getTodayStr();
    }

    var calScreen = document.getElementById('screen-calendar');
    if (calScreen) {
      calScreen.setAttribute('data-cal-mode', engine.activeCalMode || 'month');
    }

    var modeNav = '<div class="s-cal-modes-wrap" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap;">' +
      '<div style="display:inline-flex;background:var(--card, #131A26);padding:3px;border-radius:10px;border:1px solid var(--rule, #2D3B4F);">' +
        '<button type="button" class="s-cal-mode-btn ' + (engine.activeCalMode === 'month' ? 'active' : '') + '" style="padding:5px 12px;font-size:0.75rem;border:none;border-radius:8px;background:' + (engine.activeCalMode === 'month' ? 'var(--brand,#10B981)' : 'transparent') + ';color:' + (engine.activeCalMode === 'month' ? '#fff' : 'var(--s-ink-soft,#94A3B8)') + ';font-weight:700;cursor:pointer;" onclick="window.OurgoalSanctuaryV3.setCalMode(\'month\')">월간</button>' +
        '<button type="button" class="s-cal-mode-btn ' + (engine.activeCalMode === 'week' ? 'active' : '') + '" style="padding:5px 12px;font-size:0.75rem;border:none;border-radius:8px;background:' + (engine.activeCalMode === 'week' ? 'var(--brand,#10B981)' : 'transparent') + ';color:' + (engine.activeCalMode === 'week' ? '#fff' : 'var(--s-ink-soft,#94A3B8)') + ';font-weight:700;cursor:pointer;" onclick="window.OurgoalSanctuaryV3.setCalMode(\'week\')">주간</button>' +
        '<button type="button" class="s-cal-mode-btn ' + (engine.activeCalMode === 'timeline' ? 'active' : '') + '" style="padding:5px 12px;font-size:0.75rem;border:none;border-radius:8px;background:' + (engine.activeCalMode === 'timeline' ? 'var(--brand,#10B981)' : 'transparent') + ';color:' + (engine.activeCalMode === 'timeline' ? '#fff' : 'var(--s-ink-soft,#94A3B8)') + ';font-weight:700;cursor:pointer;" onclick="window.OurgoalSanctuaryV3.setCalMode(\'timeline\')">타임라인</button>' +
      '</div>' +
      '<div class="s-cal-quick-action-bar" style="display:flex;align-items:center;gap:6px;">' +
        '<button type="button" class="btn-ghost" title="누르면: 폰 잠금화면용 9:16 일정 카드가 사진첩에 저장됩니다" onclick="if(typeof window.openCalendarLockScreenModal===\'function\'){window.openCalendarLockScreenModal();}else{var b=document.getElementById(\'calLockScreenBtn\');if(b)b.click();}" style="display:inline-flex;align-items:center;gap:4px;padding:5px 9px;font-size:0.74rem;font-weight:600;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:var(--ink);cursor:pointer;white-space:nowrap;word-break:keep-all;">' +
          '<span style="display:none;">폰 잠금화면에서 보기</span><span style="white-space:nowrap;word-break:keep-all;font-size:0.74rem;">📱 잠금화면용 일정 카드 저장</span>' +
        '</button>' +
        '<button type="button" class="btn btn-primary btn-sm" title="누르면: 원하는 날짜에 실천할 목표와 시간을 등록합니다" onclick="window.OurgoalSanctuaryV3.openAddScheduleModal();" style="padding:5px 10px;font-size:0.75rem;font-weight:700;border-radius:8px;background:var(--brand,#10B981);color:#fff;border:none;cursor:pointer;white-space:nowrap;">' +
          '<span>+ 새 일정</span>' +
        '</button>' +
      '</div>' +
    '</div>';

    var contentHtml = '';
    var itemsByDate = (typeof window.calendarItemsByDate === 'function') ? window.calendarItemsByDate() : {};

    if (engine.activeCalMode === 'month') {
      contentHtml = renderSanctuaryCalendarMonth(contentHtml, itemsByDate); // [#TASK-ES-429] 분기 본문 → js/sanctuary-calendar-views.js
    } else if (engine.activeCalMode === 'week') {
      var weekBase = engine.selectedCalDate || getTodayStr();
      var wParts = weekBase.split('-');
      var wDate = new Date(parseInt(wParts[0], 10), parseInt(wParts[1], 10) - 1, parseInt(wParts[2], 10));
      if (isNaN(wDate.getTime())) wDate = new Date();
      var wDay = wDate.getDay(); // 0(일) ~ 6(토)
      var sundayMs = wDate.getTime() - wDay * 86400000;
      var saturdayMs = sundayMs + 6 * 86400000;
      var sunDate = new Date(sundayMs);
      var satDate = new Date(saturdayMs);
      var sunStr = sunDate.getFullYear() + '-' + String(sunDate.getMonth() + 1).padStart(2, '0') + '-' + String(sunDate.getDate()).padStart(2, '0');
      var satStr = satDate.getFullYear() + '-' + String(satDate.getMonth() + 1).padStart(2, '0') + '-' + String(satDate.getDate()).padStart(2, '0');
      var dayNames = ['일', '월', '화', '수', '목', '금', '토'];

      var weekRowsHtml = Array.from({ length: 7 }, function(_, idx) {
        var dayMs = sundayMs + idx * 86400000;
        var dayObj = new Date(dayMs);
        var dateKey = dayObj.getFullYear() + '-' + String(dayObj.getMonth() + 1).padStart(2, '0') + '-' + String(dayObj.getDate()).padStart(2, '0');
        var isToday = (dateKey === getTodayStr());
        var isSelected = (dateKey === engine.selectedCalDate);
        var dayEvs = itemsByDate[dateKey] || [];

        var evSummary = '';
        if (dayEvs.length === 0) {
          evSummary = '<span style="font-size:0.8125rem;color:var(--ink-soft);opacity:0.6;">등록된 일정 없음</span>';
        } else {
          evSummary = dayEvs.slice(0, 2).map(function(it) {
            var tPart = (it.date && it.date.indexOf('T') !== -1) ? it.date.split('T')[1].slice(0, 5) : (it.time || '종일');
            return '<div style="display:flex;align-items:center;gap:6px;font-size:0.8125rem;margin-bottom:2px;">' +
              '<span style="color:' + (it.done ? '#10b981' : 'var(--brand)') + ';font-size:0.65rem;">' + (it.done ? '✓' : '●') + '</span>' +
              '<span style="color:var(--ink-soft);font-size:0.75rem;min-width:32px;">' + tPart + '</span>' +
              '<span style="font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' + (it.done ? 'text-decoration:line-through;opacity:0.6;' : '') + '">' + escapeHtml(it.title || it.text) + '</span>' +
            '</div>';
          }).join('');
          if (dayEvs.length > 2) {
            evSummary += '<div style="font-size:0.7rem;color:var(--brand);font-weight:600;">+ 외 ' + (dayEvs.length - 2) + '건 더보기</div>';
          }
        }

        return '<div class="s-week-day-row ' + (isSelected ? 'selected' : '') + '" onclick="window.OurgoalSanctuaryV3.selectCalDay(\'' + dateKey + '\')">' +
          '<div class="s-week-day-badge ' + (isToday ? 'today' : '') + '">' +
            '<span class="s-week-day-name">' + dayNames[idx] + '</span>' +
            '<span class="s-week-day-num">' + dayObj.getDate() + '</span>' +
          '</div>' +
          '<div class="s-week-day-content">' +
            '<div style="flex:1;min-width:0;">' + evSummary + '</div>' +
            '<span class="s-week-count-chip" style="font-size:0.75rem;padding:2px 8px;border-radius:6px;background:var(--surface-2, rgba(255,255,255,0.06));color:var(--ink-soft);font-weight:600;">' + dayEvs.length + '건</span>' +
          '</div>' +
        '</div>';
      }).join('');

      var selectedDayItems = itemsByDate[engine.selectedCalDate] || [];
      var dayDetailsHtml = '';
      if (selectedDayItems.length > 0) {
        dayDetailsHtml = selectedDayItems.map(function(it) {
          var tPart = (it.date && it.date.indexOf('T') !== -1) ? it.date.split('T')[1].slice(0, 5) : (it.time || '종일');
          var isDone = !!it.done;
          var schedId = it.schedId || it.id || '';
          var kind = it.kind || 'custom';
          var goalId = it.goalId || '';
          var msId = it.msId || '';
          return '<div class="s-cal-item ' + (isDone ? 'done' : '') + '" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:var(--surface-2, rgba(255,255,255,0.04));border:1px solid var(--rule);margin-bottom:8px;cursor:pointer;" onclick="window.OurgoalSanctuaryV3.openScheduleDetail(\'' + engine.selectedCalDate + '\', \'' + schedId + '\', \'' + kind + '\', \'' + goalId + '\');">' +
            '<button type="button" class="s-cal-check-btn" style="background:none;border:none;padding:4px;cursor:pointer;color:' + (isDone ? '#10b981' : 'var(--ink-sub)') + ';" onclick="event.stopPropagation(); window.OurgoalSanctuaryV3.toggleScheduleItem(\'' + schedId + '\', \'' + kind + '\', \'' + goalId + '\', \'' + msId + '\');">' +
              (isDone ? '☑' : '☐') +
            '</button>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-weight:600;font-size:0.875rem;color:var(--ink);' + (isDone ? 'text-decoration:line-through;opacity:0.6;' : '') + '">' + escapeHtml(it.title || it.text) + '</div>' +
              '<div style="font-size:0.75rem;color:var(--ink-soft);">' + tPart + (it.category ? ' · ' + escapeHtml(it.category) : '') + '</div>' +
            '</div>' +
            '<span style="font-size:0.75rem;color:var(--brand);font-weight:600;">상세</span>' +
          '</div>';
        }).join('');
      }

      contentHtml = '<div class="s-week-cal-card">' +
        '<div class="s-week-header">' +
          '<button class="s-cal-arrow" type="button" onclick="window.OurgoalSanctuaryV3.shiftWeek(-1)">◀</button>' +
          '<h3 class="s-cal-month-title" style="font-size:0.95rem;">' + sunStr.slice(5) + ' ~ ' + satStr.slice(5) + '</h3>' +
          '<button class="s-cal-arrow" type="button" onclick="window.OurgoalSanctuaryV3.shiftWeek(1)">▶</button>' +
          '<span class="s-cal-today-badge" onclick="window.OurgoalSanctuaryV3.selectToday()">오늘</span>' +
        '</div>' +
        '<div class="s-week-grid">' +
          weekRowsHtml +
        '</div>' +
        '<div class="s-week-day-detail" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--rule, rgba(255,255,255,0.08));">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
            '<h4 style="margin:0;font-size:0.9rem;color:var(--ink-soft);">' + engine.selectedCalDate + ' 상세 일정</h4>' +
            '<button class="btn btn-primary btn-sm" type="button" onclick="window.OurgoalSanctuaryV3.openAddScheduleModal(\'' + engine.selectedCalDate + '\');">+ 일정 추가</button>' +
          '</div>' +
          (dayDetailsHtml || '<div style="text-align:center;padding:18px 0;color:var(--ink-soft);font-size:0.85rem;">등록된 일정이 없습니다.</div>') +
        '</div>' +
      '</div>';
    } else if (engine.activeCalMode === 'timeline') {
      contentHtml = renderSanctuaryCalendarTimeline(contentHtml, itemsByDate); // [#TASK-ES-429] 분기 본문 → js/sanctuary-calendar-views.js
    }

    slot.innerHTML = modeNav + contentHtml;
  }

  /* =========================================================================
   * 3. 기록 탭: 내 기록 피드 / 365일 연간 히트맵 / 위클리 리캡 직결
   * ========================================================================= */
  function renderSanctuaryRecords() {
    var slot = document.getElementById('sanctuaryRecordsView');
    if (!slot) return;

    var isHeatmapActive = (engine.activeRecMode === 'heatmap' || engine.activeRecMode === 'stats');
    var isTimerActive = (engine.activeRecMode === 'timer');
    var isFeedActive = (engine.activeRecMode === 'feed' || engine.activeRecMode === 'archive' || engine.activeRecMode === 'recap');

    var modeNav = '<div class="s-rec-modes-wrap" id="sRecModesWrap" style="display:flex;gap:6px;padding-bottom:4px;margin-bottom:12px;width:100%;">' +
      '<button type="button" class="s-rec-mode-btn ' + (isHeatmapActive ? 'active' : '') + '" style="flex:1;min-height:42px;padding:8px 10px;font-size:0.875rem;font-weight:700;border-radius:12px;" onclick="window.OurgoalSanctuaryV3.setRecMode(\'heatmap\')">📈 히트맵·통계</button>' +
      '<button type="button" class="s-rec-mode-btn ' + (isTimerActive ? 'active' : '') + '" style="flex:1;min-height:42px;padding:8px 10px;font-size:0.875rem;font-weight:700;border-radius:12px;" onclick="window.OurgoalSanctuaryV3.setRecMode(\'timer\')">⏱️ 몰입 타이머</button>' +
      '<button type="button" class="s-rec-mode-btn ' + (isFeedActive ? 'active' : '') + '" style="flex:1;min-height:42px;padding:8px 10px;font-size:0.875rem;font-weight:700;border-radius:12px;" onclick="window.OurgoalSanctuaryV3.setRecMode(\'feed\')">📝 실천 타임라인</button>' +
      '<div style="display:none !important;" aria-hidden="true">' +
        '<button type="button" onclick="window.OurgoalSanctuaryV3.setRecMode(\'stats\')">성취 통계</button>' +
        '<button type="button" onclick="window.OurgoalSanctuaryV3.setRecMode(\'archive\')">보관함</button>' +
        '<button type="button" onclick="window.OurgoalSanctuaryV3.setRecMode(\'recap\')">위클리 리캡</button>' +
      '</div>' +
    '</div>';

    var records = (window.state && window.state.profile && window.state.profile.records) || [];
    var contentHtml = '';

    if (engine.activeRecMode === 'heatmap') {
      var countByDay = {};
      records.forEach(function(r) {
        var dStr = (r.startAt || r.created_at || r.start_at || '').slice(0, 10);
        if (dStr) countByDay[dStr] = (countByDay[dStr] || 0) + 1;
      });

      var todayMs = Date.now();
      var filterDays = 140;
      if (engine.heatFilter === 'today') filterDays = 1;
      else if (engine.heatFilter === 'week') filterDays = 7;
      else if (engine.heatFilter === 'month') filterDays = 30;
      else if (engine.heatFilter === 'year') filterDays = 365;
      else filterDays = 140;

      // 필터 기간 내 총 실천 건수 집계
      var filteredCount = 0;
      for (var fIdx = 0; fIdx < filterDays; fIdx++) {
        var fDate = new Date(todayMs - fIdx * 86400000);
        var fKey = fDate.getFullYear() + '-' + String(fDate.getMonth() + 1).padStart(2, '0') + '-' + String(fDate.getDate()).padStart(2, '0');
        filteredCount += (countByDay[fKey] || 0);
      }

      var streakDays = (window.state && window.state.profile && window.state.profile.streak) || 3;

      var cellsCount = (engine.heatFilter === 'today') ? 7 : ((engine.heatFilter === 'week') ? 14 : ((engine.heatFilter === 'month') ? 28 : 140));
      var cellsHtml = Array.from({ length: cellsCount }, function(_, i) {
        var dayOffset = (cellsCount - 1) - i;
        var cellD = new Date(todayMs - dayOffset * 86400000);
        var cKey = cellD.getFullYear() + '-' + String(cellD.getMonth() + 1).padStart(2, '0') + '-' + String(cellD.getDate()).padStart(2, '0');
        var cnt = countByDay[cKey] || 0;
        var lvl = cnt === 0 ? 0 : (cnt === 1 ? 1 : (cnt === 2 ? 2 : (cnt <= 4 ? 3 : 4)));
        var isSelected = (engine.selectedHeatDate === cKey) ? 'style="outline:2px solid var(--brand);outline-offset:1px;"' : '';
        return '<div class="s-heat-cell lvl-' + lvl + '" ' + isSelected + ' title="' + cKey + ' (' + cnt + '건 실천)" onclick="window.OurgoalSanctuaryV3.selectHeatDay(\'' + cKey + '\');"></div>';
      }).join('');

      var dayDetailHtml = '';
      if (engine.selectedHeatDate) {
        var selDate = engine.selectedHeatDate;
        var dayRecs = records.filter(function(r) {
          return (r.startAt || r.created_at || r.start_at || '').slice(0, 10) === selDate;
        });
        if (dayRecs.length === 0) {
          dayDetailHtml = '<div class="s-heat-day-preview" style="margin-top:10px;padding:8px 12px;background:var(--card2);border:1px solid var(--line);border-radius:10px;font-size:0.78rem;color:var(--ink-sub);display:flex;align-items:center;justify-content:space-between;">' +
            '<span>📅 <b>' + selDate + '</b>: 등록된 실천 기록이 없습니다.</span>' +
            '<button type="button" class="btn btn-primary btn-sm" style="padding:2px 8px;font-size:0.75rem;" onclick="if(window.openAddRecordModal) window.openAddRecordModal();">+ 기록</button>' +
          '</div>';
        } else {
          var firstRecText = escapeHtml(dayRecs[0].text || dayRecs[0].content || '실천 완료');
          dayDetailHtml = '<div class="s-heat-day-preview" style="margin-top:10px;padding:10px 12px;background:var(--card2);border:1px solid var(--line);border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
            '<div style="min-width:0;flex:1;">' +
              '<div style="font-weight:700;font-size:0.78rem;color:var(--brand);">📅 ' + selDate + ' 실천 (' + dayRecs.length + '건)</div>' +
              '<div style="font-size:0.75rem;color:var(--ink-soft);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + firstRecText + '</div>' +
            '</div>' +
            '<button type="button" class="btn btn-ghost btn-sm" style="padding:3px 8px;font-size:0.75rem;white-space:nowrap;" onclick="window.OurgoalSanctuaryV3.setRecMode(\'feed\');">피드 보기 ›</button>' +
          '</div>';
        }
      }

      contentHtml = '<div class="s-heatmap-card">' +
        '<div class="s-heat-head">' +
          '<div class="s-heat-title-col">' +
            '<span class="s-heat-badge">성취 명예의 전당</span>' +
            '<h3>365일 연간 히트맵</h3>' +
          '</div>' +
          '<div class="s-heat-stat">' +
            '<span class="s-heat-val">' + filteredCount + '개 실천</span>' +
            '<span class="s-heat-sub">' + streakDays + '일 연속 몰입 🔥</span>' +
          '</div>' +
        '</div>' +
        '<div class="s-segment-pills">' +
          '<button class="s-seg-pill ' + (engine.heatFilter === 'today' ? 'active' : '') + '" type="button" onclick="window.OurgoalSanctuaryV3.setHeatFilter(\'today\')">오늘</button>' +
          '<button class="s-seg-pill ' + (engine.heatFilter === 'week' ? 'active' : '') + '" type="button" onclick="window.OurgoalSanctuaryV3.setHeatFilter(\'week\')">이번 주</button>' +
          '<button class="s-seg-pill ' + (engine.heatFilter === 'month' ? 'active' : '') + '" type="button" onclick="window.OurgoalSanctuaryV3.setHeatFilter(\'month\')">최근 4주</button>' +
          '<button class="s-seg-pill ' + (engine.heatFilter === 'year' ? 'active' : '') + '" type="button" onclick="window.OurgoalSanctuaryV3.setHeatFilter(\'year\')">올해</button>' +
          '<button class="s-seg-pill ' + (engine.heatFilter === 'all' ? 'active' : '') + '" type="button" onclick="window.OurgoalSanctuaryV3.setHeatFilter(\'all\')">전체</button>' +
        '</div>' +
        '<div class="s-annual-heatmap-matrix" style="max-height:160px;overflow-y:auto;-webkit-overflow-scrolling:touch;">' +
          cellsHtml +
        '</div>' +
        dayDetailHtml +
        '<div class="s-heat-legend" style="margin-top:10px;">' +
          '<span>적음</span>' +
          '<div class="s-heat-cell lvl-0"></div>' +
          '<div class="s-heat-cell lvl-1"></div>' +
          '<div class="s-heat-cell lvl-2"></div>' +
          '<div class="s-heat-cell lvl-3"></div>' +
          '<div class="s-heat-cell lvl-4"></div>' +
          '<span>많음 (에메랄드 글로우)</span>' +
        '</div>' +
        '<div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end;">' +
          '<button class="btn btn-ghost btn-sm" id="sHeatmapTimerCockpitBtn" type="button" style="display:none !important;" onclick="if(window.OurgoalTimeTracker) window.OurgoalTimeTracker.open();" title="누르면: 전체화면 스톱워치로 지금부터 몰입 시간을 초 단위 측정해요">⏱️ 스톱워치 콕핏</button>' +
          '<button class="btn btn-primary btn-sm" type="button" onclick="if(window.openAddRecordModal) window.openAddRecordModal(); else if(document.getElementById(\'recAddBtn\')) document.getElementById(\'recAddBtn\').click();" title="누르면: 오늘 실천한 내용과 사진을 남겨 타임라인에 저장합니다">+ 새 기록 작성</button>' +
        '</div>' +
      '</div>';
    } else if (engine.activeRecMode === 'feed') {
      contentHtml = renderSanctuaryRecordsFeed(records, contentHtml); // [#TASK-ES-429] 분기 본문 → js/sanctuary-record-feed.js
    } else if (engine.activeRecMode === 'stats') {
      contentHtml = '<div class="s-heatmap-card" style="margin-bottom:12px;">' +
        '<div class="s-heat-head">' +
          '<div class="s-heat-title-col">' +
            '<span class="s-heat-badge">성취 분석 리포트</span>' +
            '<h3>성취 통계 & 라이프 밸런스</h3>' +
          '</div>' +
        '</div>' +
        '<p style="font-size:0.875rem;color:var(--ink-sub);margin:0 0 14px;line-height:1.5;">' +
          '목표 달성률, 주간 몰입 시간, 라이프 밸런스 휠 분석이 아래 성취 통계 대시보드에 실시간 반영되어 있습니다.' +
        '</p>' +
      '</div>';
    } else if (engine.activeRecMode === 'archive') {
      contentHtml = renderSanctuaryRecordsArchive(contentHtml); // [#TASK-ES-429] 분기 본문 → js/sanctuary-record-feed.js
    } else if (engine.activeRecMode === 'recap') {
      contentHtml = renderSanctuaryRecordsRecap(records, contentHtml); // [#TASK-ES-429] 분기 본문 → js/sanctuary-weekly-recap.js
    } else if (engine.activeRecMode === 'timer') {
      contentHtml = renderSanctuaryRecordsTimer(contentHtml); // [#TASK-ES-429] 분기 본문 → js/sanctuary-focus-timer.js
    }

    slot.innerHTML = modeNav + contentHtml;
  }

  /* [#TASK-ES-429] 함수 renderPeerAvatarHtml·getRealRunningMates·toggleRadarCollapse·renderSanctuaryComm → js/sanctuary-peer-radar.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* =========================================================================
   * 5. 전역 통합 라우터 & 공개 API
   * ========================================================================= */
  function renderSanctuaryV3(tab) {
    if (!isFocusSanctuary()) return;
    if (!tab) tab = (window.state && window.state.activeTab) || 'home';
    if (tab === 'home') {
      renderSanctuaryHome();
    }
    if (tab === 'goals') {
      renderSanctuaryGoals();
      if (typeof renderGoalsScreen === 'function') renderGoalsScreen();
    }
    if (tab === 'calendar') {
      renderSanctuaryCalendar();
    }
    if (tab === 'records') {
      renderSanctuaryRecords();
    }
    if (tab === 'comm') {
      renderSanctuaryComm();
      if (typeof renderCommScreen === 'function') renderCommScreen();
    }
    if (tab === 'settings') {
      renderSanctuarySettings();
    }
  }

  window.OurgoalSanctuaryV3 = {
    renderHome: renderSanctuaryHome,
    renderSettings: renderSanctuarySettings,
    fastCheckin: function() {
      if (typeof vibratePhone === 'function') vibratePhone(12);
      else if (navigator.vibrate) navigator.vibrate(12);

      var goals = (window.state && window.state.profile && window.state.profile.goals) || [];
      var activeG = goals[0] || { id: 'g_default', title: '1순위 실천' };
      if (goals.length > 0) {
        goals[0].progress = Math.min((goals[0].progress || 0) + 10, 100);
      }
      var today = (typeof dateKey === 'function') ? dateKey() : (new Date().toISOString().slice(0,10));
      if (window.state && window.state.profile) {
        if (!Array.isArray(window.state.profile.records)) window.state.profile.records = [];
        window.state.profile.records.push({
          id: 'rec_' + Date.now(),
          goalId: activeG.id,
          text: activeG.title + ' 실천 완료',
          date: today,
          createdAt: new Date().toISOString()
        });
      }
      if (typeof saveState === 'function') saveState();
      else if (typeof saveProfile === 'function') saveProfile();

      if (typeof dispatchFullViewPropagation === 'function') {
        dispatchFullViewPropagation({ type: 'checkin', text: activeG.title + ' 실천 완료' });
      }

      toast('🎉 오늘 실천 완료! 12ms 햅틱과 전 탭 동기화가 완료되었습니다 ✨');
      renderSanctuaryHome();
      if (typeof renderHome === 'function') renderHome();
      if (typeof setTab === 'function') {
        // keep current view refreshed
      }
    },
    switchTheme: function(th) {
      document.documentElement.setAttribute('data-theme', th);
      try {
        localStorage.setItem('ourgoal_theme', th);
        localStorage.setItem('theme', th);
      } catch(e) {}
      if (typeof applyTheme === 'function') applyTheme(th);
      toast('🎨 ' + th + ' 테마가 실시간 적용되었습니다 ✨');
      renderSanctuarySettings();
    },
    render: renderSanctuaryV3,
    renderRadar: renderSanctuaryComm,
    toggleRadarCollapse: toggleRadarCollapse,
    setCalMode: function(m) {
      if (m === 'timer') {
        if (typeof window.switchTab === 'function') window.switchTab('records');
        else if (typeof window.setTab === 'function') window.setTab('records');
        else if (typeof window.showScreen === 'function') window.showScreen('screen-records');
        this.setRecMode('timer');
        return;
      }
      engine.activeCalMode = m;
      var calScreen = document.getElementById('screen-calendar');
      if (calScreen) {
        calScreen.setAttribute('data-cal-mode', m);
      }
      renderSanctuaryCalendar();
      if (m === 'month') renderCalDayDetail();
    },
    getActiveRecMode: function() {
      return engine.activeRecMode;
    },
    setRecMode: function(m) {
      if (typeof triggerHapticFeedback === 'function') triggerHapticFeedback(12);
      engine.activeRecMode = m;
      if (m === 'stats' || m === 'archive' || m === 'feed') {
        if (typeof window.setRecordsSegment === 'function') {
          window.setRecordsSegment(m);
        }
      } else if (m === 'heatmap') {
        if (typeof window.setRecordsSegment === 'function') {
          window.setRecordsSegment('stats');
        }
      }
      renderSanctuaryRecords();
    },
    setHeatFilter: function(f) {
      engine.heatFilter = f;
      var fNames = { today: '오늘', week: '이번 주', month: '최근 4주', year: '올해', all: '전체' };
      toast('히트맵 기간: ' + (fNames[f] || f));
      renderSanctuaryRecords();
    },
    selectHeatDay: function(dateKey) {
      engine.selectedHeatDate = (engine.selectedHeatDate === dateKey ? null : dateKey);
      renderSanctuaryRecords();
    },
    ..._sCalActions.methodsFrom_shiftCal, // [#TASK-ES-429] 메서드 shiftCal·selectToday·shiftWeek·shiftTimelineDay·selectCalDay → js/sanctuary-calendar-actions.js
    openScheduleDetail: function(dateKey, schedId, kind, goalId) {
      var dt = dateKey || engine.selectedCalDate || getTodayStr();
      if (typeof window.openCalendarManualEditModal === 'function') {
        var itemsByDate = (typeof window.calendarItemsByDate === 'function') ? window.calendarItemsByDate() : {};
        var dayItems = itemsByDate[dt] || [];
        var editEvent = null;
        if ((kind === 'custom' || !kind) && window.state && window.state.profile && window.state.profile.settings && window.state.profile.settings.customSchedules) {
          editEvent = window.state.profile.settings.customSchedules.find(function(cs) {
            return String(cs.id) === String(schedId);
          });
        }
        if (!editEvent) editEvent = found;
        window.openCalendarManualEditModal(dt, editEvent || null, kind || 'custom');
      } else {
        window.OurgoalSanctuaryV3.openAddScheduleModal(dt);
      }
    },
    ..._sCalActions.methodsFrom_openAddScheduleModal, // [#TASK-ES-429] 메서드 openAddScheduleModal·openDayHubModal·openBgPickerModal·toggleScheduleItem → js/sanctuary-calendar-actions.js
    ..._sGoalTrail.methodsFrom_toggleMilestone, // [#TASK-ES-429] 메서드 toggleMilestone·toggleTask·openMilestoneCheckin·transplantSampleRoutine → js/sanctuary-goal-trail.js
    ..._sTimer.methodsFrom_togglePomodoro, // [#TASK-ES-429] 메서드 togglePomodoro·resetPomodoro·finishPomodoroSession → js/sanctuary-focus-timer.js
    ..._sRadar.methodsFrom_cheerPost, // [#TASK-ES-429] 메서드 cheerPost·openPeerDm → js/sanctuary-peer-radar.js
    ..._sRecap.methodsFrom_downloadRecapImage, // [#TASK-ES-429] 메서드 downloadRecapImage·openWeeklyRecapModal → js/sanctuary-weekly-recap.js
    ..._sRadar.methodsFrom_openPeerInteraction, // [#TASK-ES-429] 메서드 openPeerInteraction → js/sanctuary-peer-radar.js
    openPeerDm: function(peerIdOrName, goal) {
      this.openPeerInteraction(peerIdOrName);
    },
    ..._sRadar.methodsFrom_refreshRadar, // [#TASK-ES-429] 메서드 refreshRadar·gotoCompanions → js/sanctuary-peer-radar.js
    ..._sRecFeed.methodsFrom_setFeedPeriod // [#TASK-ES-429] 메서드 setFeedPeriod·setFeedPage·applyFeedCustomDate·setArchivePeriod·setArchivePage → js/sanctuary-record-feed.js
  };

  // 탭 진입 시 자동 렌더링
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('DOMContentLoaded', function() {
      if (window.state && window.state.activeTab) {
        renderSanctuaryV3(window.state.activeTab);
      }
    });
  }

})(window);
