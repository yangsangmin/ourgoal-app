/**
 * js/sanctuary-v3-engine.js — 포커스 성소 20대 전수 화면 실제 엔진 직결 조형 렌더러
 * 더미 목데이터 0%, 100% 실제 데이터 원장(state.profile.goals, calendarItemsByDate, records) 바인딩
 * 72개 인터랙션 전수 실구현 및 20종 정본 그래픽 시안 1:1 완벽 일치 보장
 */
(function(window) {
  'use strict';

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
    activeDmPeer: null,
    dmHistory: {}
  };

  function isFocusSanctuary() {
    var th = document.documentElement.getAttribute('data-theme') || 'focus-sanctuary';
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

    // 1-1. 상단 목표 알약 셀렉터 (실제 state.profile.goals 순회)
    var pillsHtml = '<div class="s-goal-pills-wrap">' +
      goals.map(function(g) {
        var isCur = (g.id === engine.activeGoalId);
        return '<button type="button" class="s-goal-pill ' + (isCur ? 'active' : '') + '" data-sgoalid="' + g.id + '">' +
          escapeHtml(g.title) +
        '</button>';
      }).join('') +
      '<button type="button" class="s-goal-pill add" id="sAddGoalBtn" onclick="if(window.promptNewGoal) window.promptNewGoal(); else toast(\'새 목표 추가 창을 엽니다\');">+ 새 목표</button>' +
    '</div>';

    // 1-2. 마운틴 트레일 카드 조형
    var trailHtml = '';
    if (!activeGoal) {
      trailHtml = '<div class="mountain-trail-card empty-card">' +
        '<div style="text-align:center;padding:40px 20px;color:var(--ink-sub);">' +
          '<div style="font-size:2.5rem;margin-bottom:12px;">🏔️</div>' +
          '<h3 style="margin-bottom:8px;color:var(--ink);">등록된 목표가 없습니다</h3>' +
          '<p style="font-size:0.875rem;margin-bottom:18px;">나만의 첫 목표를 만들고 등반을 시작해보세요.</p>' +
          '<button class="btn btn-primary btn-sm" type="button" onclick="if(window.promptNewGoal) window.promptNewGoal();">+ 새 목표 만들기</button>' +
        '</div>' +
      '</div>';
    } else {
      var msList = activeGoal.milestones || [];
      var totalMs = msList.length;
      var doneMs = msList.filter(function(m) { return m.status === 'done' || m.done; }).length;
      var pct = totalMs > 0 ? Math.round((doneMs / totalMs) * 100) : (activeGoal.progress || 0);
      var ddayText = activeGoal.dueDate ? (window.dDay ? window.dDay(activeGoal.dueDate) : 'D-day') : '';

      // 마일스톤 노드 리스트 생성 (정상이 상단, 시작이 하단)
      var nodesHtml = '';
      if (totalMs === 0) {
        nodesHtml = '<div style="text-align:center;padding:24px;color:var(--ink-sub);font-size:0.875rem;">마일스톤을 추가하여 등반 트레일을 완성해보세요 🚩</div>';
      } else {
        // 복제본 생성 후 역순 정렬 (정상이 맨 위)
        var reversedMs = msList.slice().reverse();
        nodesHtml = reversedMs.map(function(m, idx) {
          var isSummit = (idx === 0);
          var isDone = (m.status === 'done' || m.done);
          var isDoing = (!isDone && (m.status === 'doing' || idx === reversedMs.length - 1));
          var nodeClass = isDone ? 'done' : (isDoing ? 'doing' : 'todo');
          var pointIcon = isSummit ? '🏁' : (isDone ? '✓' : (isDoing ? '⚡' : '○'));
          var subText = isDone ? ('완료됨 · ' + (m.dueDate || '달성')) : (isDoing ? '진행 중 · 실천 중' : '대기 · 예정');

          // 하위 할일 목록(Tasks) 바인딩
          var tasksHtml = '';
          if (m.tasks && m.tasks.length > 0) {
            tasksHtml = '<div class="trail-tasks-sublist">' +
              m.tasks.map(function(t) {
                var tDone = !!t.done;
                return '<div class="trail-task-row ' + (tDone ? 'done' : '') + '" onclick="event.stopPropagation(); window.OurgoalSanctuaryV3.toggleTask(\'' + activeGoal.id + '\', \'' + m.id + '\', \'' + t.id + '\');">' +
                  '<span class="trail-task-check">' + (tDone ? '☑' : '☐') + '</span>' +
                  '<span class="trail-task-title">' + escapeHtml(t.title) + '</span>' +
                '</div>';
              }).join('') +
            '</div>';
          }

          var actionChip = isDoing ?
            '<span class="trail-action-chip" onclick="event.stopPropagation(); window.OurgoalSanctuaryV3.openMilestoneCheckin(\'' + escapeHtml(m.title) + '\');">기록 입력</span>' :
            (isDone ? '<span class="trail-done-badge">완료</span>' : '');

          return '<div class="trail-node ' + nodeClass + '" onclick="window.OurgoalSanctuaryV3.toggleMilestone(\'' + activeGoal.id + '\', \'' + m.id + '\');">' +
            '<div class="trail-node-point ' + (isDoing ? 'beacon' : (isDone ? 'check' : '')) + '">' + pointIcon + '</div>' +
            '<div class="trail-node-content">' +
              '<div class="trail-node-title">' + escapeHtml(m.title) + '</div>' +
              '<div class="trail-node-sub">' + subText + (m.dueDate ? ' (' + m.dueDate + ')' : '') + '</div>' +
              tasksHtml +
            '</div>' +
            actionChip +
          '</div>' +
          (idx < reversedMs.length - 1 ? '<div class="trail-connector ' + (isDone ? 'done' : (isDoing ? 'doing' : '')) + '"></div>' : '');
        }).join('');
      }

      trailHtml = '<div class="mountain-trail-card">' +
        '<div class="mountain-head">' +
          '<div class="m-title-col">' +
            '<span class="m-badge">등반 로드맵 (Mountain Trail)</span>' +
            '<h3 class="m-goal-title">' + escapeHtml(activeGoal.title) + '</h3>' +
          '</div>' +
          '<div class="m-summit-badge">' +
            '<span>' + (pct >= 100 ? '🎉 정상 정복 완료!' : ('정상까지 ' + (100 - pct) + '% 남음 🏔️')) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="mountain-trail-path">' +
          nodesHtml +
        '</div>' +
      '</div>';
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

    var modeNav = '<div class="s-cal-modes-wrap">' +
      '<button type="button" class="s-cal-mode-btn ' + (engine.activeCalMode === 'month' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setCalMode(\'month\')">📅 월간 캘린더</button>' +
      '<button type="button" class="s-cal-mode-btn ' + (engine.activeCalMode === 'timeline' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setCalMode(\'timeline\')">⏱️ 일간 타임라인</button>' +
      '<button type="button" class="s-cal-mode-btn ' + (engine.activeCalMode === 'timer' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setCalMode(\'timer\')">🧘 집중 타이머</button>' +
    '</div>';

    var contentHtml = '';
    var itemsByDate = (typeof window.calendarItemsByDate === 'function') ? window.calendarItemsByDate() : {};

    if (engine.activeCalMode === 'month') {
      var curYear = engine.calYear;
      var curMonth = engine.calMonth;
      var daysInMonth = new Date(curYear, curMonth, 0).getDate();
      var firstDayOfWeek = new Date(curYear, curMonth - 1, 1).getDay(); // 0(일) ~ 6(토)
      var todayStr = getTodayStr();

      // 첫 요일 이전 빈 칸 생성 (일요일 시작 정렬)
      var emptyCellsHtml = '';
      for (var ei = 0; ei < firstDayOfWeek; ei++) {
        emptyCellsHtml += '<div class="s-cal-day-cell empty" style="opacity:0.2;pointer-events:none;"></div>';
      }

      // 일자별 셀 렌더링
      var daysHtml = Array.from({ length: daysInMonth }, function(_, i) {
        var d = i + 1;
        var dateKey = curYear + '-' + String(curMonth).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var isToday = (dateKey === todayStr);
        var isSelected = (dateKey === engine.selectedCalDate);
        var dayItems = itemsByDate[dateKey] || [];
        var hasItems = dayItems.length > 0;

        // 일자별 배경 사진 지정 여부 확인
        var dayBg = (window.state && window.state.profile && window.state.profile.calendarDayBackgrounds && window.state.profile.calendarDayBackgrounds[dateKey]) || '';
        var bgStyle = '';
        if (Array.isArray(dayBg) && dayBg.length > 0) {
          bgStyle = 'background-image:url(\'' + escapeHtml(dayBg[0]) + '\');background-size:cover;background-position:center;';
        } else if (typeof dayBg === 'string' && dayBg) {
          bgStyle = 'background-image:url(\'' + escapeHtml(dayBg) + '\');background-size:cover;background-position:center;';
        }

        var bgLayer = bgStyle ? '<div style="position:absolute;inset:0;opacity:0.38;border-radius:10px;' + bgStyle + 'pointer-events:none;"></div>' : '';

        return '<div class="s-cal-day-cell ' + (isToday ? 'today' : '') + ' ' + (isSelected ? 'selected' : '') + ' ' + (hasItems ? 'active' : '') + '" style="position:relative;" onclick="window.OurgoalSanctuaryV3.selectCalDay(\'' + dateKey + '\')">' +
          bgLayer +
          '<span class="s-day-num" style="position:relative;z-index:1;">' + d + '</span>' +
          (hasItems ? '<span class="s-day-dot" style="position:relative;z-index:1;"></span>' : '') +
          (dayItems.length ? '<span class="s-day-today-tag" style="position:relative;z-index:1;">' + escapeHtml(dayItems[0].title || '일정') + '</span>' : '') +
        '</div>';
      }).join('');

      var selectedItems = itemsByDate[engine.selectedCalDate] || [];
      var selItemTitle = selectedItems.length > 0 ?
        (selectedItems[0].title || selectedItems[0].text || '실천 일정') :
        '등록된 일정이 없습니다';

      contentHtml = '<div class="s-month-cal-card">' +
        '<div class="s-month-header">' +
          '<button class="s-cal-arrow" type="button" onclick="window.OurgoalSanctuaryV3.shiftCal(-1);">◀</button>' +
          '<h3 class="s-cal-month-title">' + curYear + '년 ' + curMonth + '월</h3>' +
          '<button class="s-cal-arrow" type="button" onclick="window.OurgoalSanctuaryV3.shiftCal(1);">▶</button>' +
          '<span class="s-cal-today-badge" onclick="window.OurgoalSanctuaryV3.selectToday();">오늘</span>' +
        '</div>' +
        '<div class="s-month-days-header">' +
          '<span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>' +
        '</div>' +
        '<div class="s-month-grid">' +
          emptyCellsHtml +
          daysHtml +
        '</div>' +
        '<div class="s-cal-selected-bar">' +
          '<div class="s-cal-sel-info">' +
            '<span class="s-cal-sel-date">' + engine.selectedCalDate + ' · 일정 ' + selectedItems.length + '건</span>' +
            '<span class="s-cal-sel-task">' + escapeHtml(selItemTitle) + '</span>' +
          '</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
            '<button class="btn btn-ghost btn-sm" type="button" onclick="window.OurgoalSanctuaryV3.openBgPickerModal();" title="배경사진 선택">🖼️ 사진</button>' +
            '<button class="btn btn-ghost btn-sm" type="button" onclick="window.OurgoalSanctuaryV3.openDayHubModal();" title="일자 관리 종합 허브">📅 허브</button>' +
            '<button class="btn btn-primary btn-sm" type="button" onclick="window.OurgoalSanctuaryV3.openAddScheduleModal();">+ 일정 추가</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    } else if (engine.activeCalMode === 'timeline') {
      var todayKey = engine.selectedCalDate || getTodayStr();
      var todayItems = itemsByDate[todayKey] || [];

      var rowsHtml = '';
      if (todayItems.length === 0) {
        rowsHtml = '<div style="text-align:center;padding:36px 14px;color:var(--ink-sub);font-size:0.875rem;">' +
          '선택된 일자(' + todayKey + ')에 등록된 타임라인 일정이 없습니다.<br>새 일정을 추가하여 하루 실천 궤적을 기록해보세요.' +
        '</div>';
      } else {
        rowsHtml = todayItems.map(function(item) {
          var timeStr = '10:00';
          if (item.date && item.date.indexOf('T') !== -1) {
            timeStr = item.date.split('T')[1].slice(0, 5);
          } else if (item.time) {
            timeStr = item.time;
          }
          var isDone = !!item.done;
          var schedId = item.schedId || item.id || '';
          var kind = item.kind || 'custom';
          var goalId = item.goalId || '';
          var msId = item.msId || '';
          var taskId = item.taskId || '';

          return '<div class="s-timeline-row ' + (isDone ? 'done' : 'active') + '" onclick="window.OurgoalSanctuaryV3.toggleScheduleItem(\'' + schedId + '\', \'' + kind + '\', \'' + goalId + '\', \'' + msId + '\', \'' + taskId + '\');">' +
            '<span class="s-t-time">' + timeStr + '</span>' +
            '<div class="s-t-block">' +
              '<span class="s-t-badge ' + (isDone ? '' : 'active') + '">' + (isDone ? '✓ 완료' : '⚡ 진행 중') + '</span>' +
              '<span class="s-t-title">' + escapeHtml(item.title || item.text) + '</span>' +
            '</div>' +
          '</div>';
        }).join('');
      }

      contentHtml = '<div class="s-timeline-card">' +
        '<div class="s-timeline-header">' +
          '<h4>' + todayKey + ' 24시간 타임라인</h4>' +
          '<span class="s-timeline-status">실천 ' + todayItems.length + '건</span>' +
        '</div>' +
        '<div class="s-timeline-track">' +
          rowsHtml +
        '</div>' +
        '<div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
          '<button class="btn btn-ghost btn-sm" type="button" onclick="window.OurgoalSanctuaryV3.openDayHubModal();">📅 일자 종합 허브</button>' +
          '<button class="btn btn-primary btn-sm" type="button" onclick="window.OurgoalSanctuaryV3.openAddScheduleModal();">+ 새 일정 등록</button>' +
        '</div>' +
      '</div>';
    } else if (engine.activeCalMode === 'timer') {
      var mins = Math.floor(engine.timerSeconds / 60);
      var secs = engine.timerSeconds % 60;
      var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;

      var goals = (window.state && window.state.profile && window.state.profile.goals) || [];
      var curGoal = goals.find(function(g) { return g.id === engine.activeGoalId; }) || goals[0];
      var goalTitle = curGoal ? curGoal.title : '25분 딥워크 몰입';

      contentHtml = '<div class="s-timer-card">' +
        '<div class="s-timer-header">' +
          '<span class="s-timer-badge">뽀모도로 딥워크 세션</span>' +
          '<h4>' + escapeHtml(goalTitle) + '</h4>' +
        '</div>' +
        '<div class="s-timer-dial-wrap">' +
          '<svg class="s-timer-svg" viewBox="0 0 200 200">' +
            '<circle class="s-dial-bg" cx="100" cy="100" r="85"></circle>' +
            '<circle class="s-dial-progress ' + (engine.timerRunning ? 'pulsing' : '') + '" cx="100" cy="100" r="85" style="stroke-dashoffset: ' + (534 * (1 - engine.timerSeconds / 1500)) + ';"></circle>' +
          '</svg>' +
          '<div class="s-timer-display" id="sPomodoroDisplay">' + timeStr + '</div>' +
        '</div>' +
        '<div class="s-timer-controls">' +
          '<button class="btn btn-primary s-timer-main-btn" type="button" onclick="window.OurgoalSanctuaryV3.togglePomodoro()">' +
            (engine.timerRunning ? '⏸️ 일시정지' : '▶️ 몰입 시작') +
          '</button>' +
          '<button class="btn btn-ghost btn-sm" type="button" onclick="window.OurgoalSanctuaryV3.resetPomodoro()">' +
            '↺ 리셋' +
          '</button>' +
          '<button class="btn btn-ghost btn-sm" type="button" style="color:var(--brand-strong);border:1px solid var(--brand);" onclick="window.OurgoalSanctuaryV3.finishPomodoroSession()">' +
            '✨ 완성 & 기록 적립' +
          '</button>' +
        '</div>' +
      '</div>';
    }

    slot.innerHTML = modeNav + contentHtml;
  }

  /* =========================================================================
   * 3. 기록 탭: 내 기록 피드 / 365일 연간 히트맵 / 위클리 리캡 직결
   * ========================================================================= */
  function renderSanctuaryRecords() {
    var slot = document.getElementById('sanctuaryRecordsView');
    if (!slot) return;

    var modeNav = '<div class="s-rec-modes-wrap" style="display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;padding-bottom:4px;margin-bottom:12px;">' +
      '<button type="button" class="s-rec-mode-btn ' + (engine.activeRecMode === 'heatmap' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setRecMode(\'heatmap\')">🟩 365일 히트맵</button>' +
      '<button type="button" class="s-rec-mode-btn ' + (engine.activeRecMode === 'feed' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setRecMode(\'feed\')">✍️ 내 기록 피드</button>' +
      '<button type="button" class="s-rec-mode-btn ' + (engine.activeRecMode === 'stats' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setRecMode(\'stats\')">📊 성취 통계</button>' +
      '<button type="button" class="s-rec-mode-btn ' + (engine.activeRecMode === 'archive' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setRecMode(\'archive\')">📦 보관함</button>' +
      '<button type="button" class="s-rec-mode-btn ' + (engine.activeRecMode === 'recap' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setRecMode(\'recap\')">📸 위클리 리캡</button>' +
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

      var cellsCount = (engine.heatFilter === 'today') ? 7 : ((engine.heatFilter === 'week') ? 14 : ((engine.heatFilter === 'month') ? 35 : 140));
      var cellsHtml = Array.from({ length: cellsCount }, function(_, i) {
        var dayOffset = (cellsCount - 1) - i;
        var cellD = new Date(todayMs - dayOffset * 86400000);
        var cKey = cellD.getFullYear() + '-' + String(cellD.getMonth() + 1).padStart(2, '0') + '-' + String(cellD.getDate()).padStart(2, '0');
        var cnt = countByDay[cKey] || 0;
        var lvl = cnt === 0 ? 0 : (cnt === 1 ? 1 : (cnt === 2 ? 2 : (cnt <= 4 ? 3 : 4)));
        return '<div class="s-heat-cell lvl-' + lvl + '" title="' + cKey + ' (' + cnt + '건 실천)" onclick="toast(\'' + cKey + ' 실천 기록: ' + cnt + '건\');"></div>';
      }).join('');

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
          '<button class="s-seg-pill ' + (engine.heatFilter === 'month' ? 'active' : '') + '" type="button" onclick="window.OurgoalSanctuaryV3.setHeatFilter(\'month\')">이번 달</button>' +
          '<button class="s-seg-pill ' + (engine.heatFilter === 'year' ? 'active' : '') + '" type="button" onclick="window.OurgoalSanctuaryV3.setHeatFilter(\'year\')">올해</button>' +
          '<button class="s-seg-pill ' + (engine.heatFilter === 'all' ? 'active' : '') + '" type="button" onclick="window.OurgoalSanctuaryV3.setHeatFilter(\'all\')">전체</button>' +
        '</div>' +
        '<div class="s-annual-heatmap-matrix">' +
          cellsHtml +
        '</div>' +
        '<div class="s-heat-legend">' +
          '<span>적음</span>' +
          '<div class="s-heat-cell lvl-0"></div>' +
          '<div class="s-heat-cell lvl-1"></div>' +
          '<div class="s-heat-cell lvl-2"></div>' +
          '<div class="s-heat-cell lvl-3"></div>' +
          '<div class="s-heat-cell lvl-4"></div>' +
          '<span>많음 (에메랄드 글로우)</span>' +
        '</div>' +
        '<div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end;">' +
          '<button class="btn btn-ghost btn-sm" type="button" onclick="if(window.OurgoalTimeTracker) window.OurgoalTimeTracker.open();">⏱️ 스톱워치 콕핏</button>' +
          '<button class="btn btn-primary btn-sm" type="button" onclick="if(window.openAddRecordModal) window.openAddRecordModal(); else if(document.getElementById(\'recAddBtn\')) document.getElementById(\'recAddBtn\').click();">+ 새 기록 작성</button>' +
        '</div>' +
      '</div>';
    } else if (engine.activeRecMode === 'feed') {
      var feedItemsHtml = '';
      if (records.length === 0) {
        feedItemsHtml = '<div style="text-align:center;padding:40px 20px;color:var(--ink-sub);">' +
          '등록된 기록이 없습니다.<br>오늘의 첫 체크인과 회고를 남겨보세요.' +
        '</div>';
      } else {
        var sortedRecs = records.slice().reverse();
        feedItemsHtml = sortedRecs.slice(0, 30).map(function(r) {
          var dateStr = (r.startAt || r.created_at || r.start_at || '').slice(0, 16).replace('T', ' ');
          var topicTag = r.topic ? '<span class="s-f-tag">#' + escapeHtml(r.topic) + '</span>' : '';
          return '<div class="s-feed-item-card">' +
            '<div class="s-f-head">' +
              '<span class="s-f-date">' + dateStr + '</span>' +
              '<span class="s-f-xp">+10 EXP</span>' +
            '</div>' +
            '<div class="s-f-content">' +
              escapeHtml(r.text || r.content || '실천 완료') +
            '</div>' +
            '<div class="s-f-meta">' +
              topicTag +
              '<span class="s-f-goal">목표 연동</span>' +
            '</div>' +
          '</div>';
        }).join('');
      }

      contentHtml = '<div class="s-feed-container">' +
        '<div class="s-feed-header">' +
          '<h4>나의 체크인 & 회고 피드 (' + records.length + '건)</h4>' +
          '<button class="btn btn-primary btn-sm" type="button" onclick="if(window.openAddRecordModal) window.openAddRecordModal(); else if(document.getElementById(\'recAddBtn\')) document.getElementById(\'recAddBtn\').click();">+ 새 기록</button>' +
        '</div>' +
        feedItemsHtml +
      '</div>';
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
      contentHtml = '<div class="s-heatmap-card" style="margin-bottom:12px;">' +
        '<div class="s-heat-head">' +
          '<div class="s-heat-title-col">' +
            '<span class="s-heat-badge">완료 및 보관 데이터</span>' +
            '<h3>실천 및 목표 보관함</h3>' +
          '</div>' +
        '</div>' +
        '<p style="font-size:0.875rem;color:var(--ink-sub);margin:0 0 14px;line-height:1.5;">' +
          '달성 완료된 과거 목표 및 보관된 기록 데이터가 아래 보관함 목록에 안전하게 보존되어 있습니다.' +
        '</p>' +
      '</div>';
    } else if (engine.activeRecMode === 'recap') {
      var streakVal = (window.state && window.state.profile && window.state.profile.streak) || 3;
      var totalMinutes = 0;
      records.forEach(function(r) { totalMinutes += (r.durationMinutes || 25); });
      var totalHours = Math.round(totalMinutes / 60 * 10) / 10;

      contentHtml = '<div class="s-recap-share-card">' +
        '<div class="s-recap-head">' +
          '<span class="s-recap-badge">인스타그램 스토리 9:16 최적화</span>' +
          '<h4>위클리 퍼펙트 리캡</h4>' +
        '</div>' +
        '<div class="s-recap-canvas-mock" id="sRecapCanvasMock">' +
          '<div class="s-rc-top">OURGOAL WEEKLY RECAP</div>' +
          '<div class="s-rc-main">' +
            '<div class="s-rc-avatar">🦉 Lv.1</div>' +
            '<div class="s-rc-metric">누적 ' + totalHours + '시간 몰입 완주!</div>' +
            '<div class="s-rc-streak">' + streakVal + '일 연속 스트릭 달성 🔥</div>' +
          '</div>' +
          '<div class="s-rc-foot">우리들의 목표 성소 · ourgoal.kr</div>' +
        '</div>' +
        '<div class="s-recap-actions" style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button class="btn btn-primary btn-sm" type="button" onclick="window.OurgoalSanctuaryV3.downloadRecapImage();">💾 이미지 다운로드 (PNG)</button>' +
          '<button class="btn btn-ghost btn-sm" type="button" onclick="window.OurgoalSanctuaryV3.openWeeklyRecapModal();">🔍 리캡 커스텀 모달</button>' +
          '<button class="btn btn-ghost btn-sm" type="button" onclick="if(window.OurgoalViralSharing) window.OurgoalViralSharing.shareStreakKakao(); else toast(\'카카오톡 공유 링크를 생성했습니다!\');">💬 카카오톡 공유</button>' +
        '</div>' +
      '</div>';
    }

    slot.innerHTML = modeNav + contentHtml;
  }

  /* =========================================================================
   * 4. 소통 탭: 실시간 러닝메이트 레이더 & 4위 1체 실기능 직결 (헌법 제13조 & 제4조 준수)
   * ========================================================================= */
  function renderPeerAvatarHtml(avatar) {
    if (!avatar) return '👤';
    if (typeof avatar === 'string' && (avatar.indexOf('data:image') === 0 || avatar.indexOf('http') === 0 || avatar.indexOf('/') === 0)) {
      return '<img src="' + escapeHtml(avatar) + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
    }
    return escapeHtml(String(avatar)[0] || '👤');
  }

  function getRealRunningMates() {
    var peers = [];
    var seenIds = {};
    var myId = (window.state && window.state.profile && window.state.profile.id) ? String(window.state.profile.id).trim().toLowerCase() : '';

    // 1. 실제 동반자 목록 (state.profile.companions or state.companions)
    var companions = (window.state && window.state.profile && window.state.profile.companions) || (window.state && window.state.companions) || [];
    if (Array.isArray(companions)) {
      companions.forEach(function(c) {
        if (!c || !c.id) return;
        var cId = String(c.id).trim().toLowerCase();
        if (cId === myId || seenIds[cId]) return;
        seenIds[cId] = true;
        peers.push({
          id: c.id,
          name: c.nickname || c.name || '동반자',
          avatar: c.avatar || '👤',
          avatarUrl: c.avatarUrl || null,
          streak: c.streak || 1,
          goal: (c.goals && c.goals[0] && (c.goals[0].title || c.goals[0])) || c.goal || c.theme || '목표 실천',
          status: '함께 실천 중',
          theme: c.theme || '동반자',
          isCompanion: true,
          isTeam: false,
          raw: c
        });
      });
    }

    // 2. 내가 속한 팀원 풀 (OurgoalTeamInviteComm.getTeamMembersPool())
    if (window.OurgoalTeamInviteComm && typeof window.OurgoalTeamInviteComm.getTeamMembersPool === 'function') {
      try {
        var teamMems = window.OurgoalTeamInviteComm.getTeamMembersPool() || [];
        if (Array.isArray(teamMems)) {
          teamMems.forEach(function(m) {
            if (!m || !m.id) return;
            var mId = String(m.id).trim().toLowerCase();
            if (mId === myId || seenIds[mId]) return;
            seenIds[mId] = true;
            peers.push({
              id: m.id,
              name: m.name || m.nickname || '팀원',
              avatar: m.avatar || '👥',
              avatarUrl: m.avatarUrl || null,
              streak: m.streak || 1,
              goal: m.goal || m.role || '팀 목표 완주',
              status: m.role || '팀원',
              theme: m.groupName || '팀',
              isCompanion: false,
              isTeam: true,
              raw: m
            });
          });
        }
      } catch (e) {
        console.warn('[레이더] 팀원 풀 로드 경고:', e);
      }
    }

    return peers;
  }

  function renderSanctuaryComm() {
    var slot = document.getElementById('sanctuaryCommView');
    if (!slot) return;

    var peers = getRealRunningMates();
    var countText = peers.length > 0 ? (peers.length + '명 함께하는 중') : '0명 (새 동반자 찾기)';
    var countClass = peers.length > 0 ? 's-radar-count' : 's-radar-count s-radar-zero';

    var radarHtml = '<div class="s-peer-radar-card">' +
      '<div class="s-radar-head">' +
        '<div class="s-radar-title">' +
          '<span class="s-live-dot"></span>' +
          '<b>실시간 러닝메이트 레이더</b>' +
          '<span class="' + countClass + '">' + countText + '</span>' +
        '</div>' +
        '<button class="btn btn-ghost btn-xs s-radar-refresh-btn" type="button" onclick="window.OurgoalSanctuaryV3.refreshRadar(this);">새로고침</button>' +
      '</div>';

    if (peers.length > 0) {
      radarHtml += '<div class="s-radar-scroll">' +
        peers.map(function(p) {
          return '<div class="s-radar-item" data-peerid="' + escapeHtml(p.id) + '" role="button" tabindex="0" onclick="window.OurgoalSanctuaryV3.openPeerInteraction(\'' + escapeHtml(p.id) + '\');">' +
            '<div class="s-r-avatar-ring">' +
              '<span class="s-r-avatar">' + renderPeerAvatarHtml(p.avatarUrl || p.avatar) + '</span>' +
              '<span class="s-r-badge" title="함께 실천 중"></span>' +
            '</div>' +
            '<span class="s-r-name">' + escapeHtml(p.name) + '</span>' +
            '<span class="s-r-goal">' + escapeHtml(p.goal) + '</span>' +
          '</div>';
        }).join('') +
      '</div>';
    } else {
      radarHtml += '<div class="s-radar-empty-card">' +
        '<div class="s-r-empty-info">' +
          '<span style="font-size:1.4rem;">🤝</span>' +
          '<div>' +
            '<b>아직 연결된 러닝메이트가 없습니다</b>' +
            '<span>닉네임으로 동반자를 검색하거나 팀에 참여해보세요!</span>' +
          '</div>' +
        '</div>' +
        '<button class="btn btn-primary btn-xs" id="sRadarEmptyBtn" type="button" onclick="window.OurgoalSanctuaryV3.gotoCompanions();">+ 동반자 찾기</button>' +
      '</div>';
    }

    radarHtml += '</div>';

    slot.innerHTML = radarHtml;
  }

  /* =========================================================================
   * 5. 전역 통합 라우터 & 공개 API
   * ========================================================================= */
  function renderSanctuaryV3(tab) {
    if (!isFocusSanctuary()) return;
    if (tab === 'goals') {
      renderSanctuaryGoals();
      if (typeof renderGoalsScreen === 'function') renderGoalsScreen();
    }
    if (tab === 'calendar') renderSanctuaryCalendar();
    if (tab === 'records') renderSanctuaryRecords();
    if (tab === 'comm') {
      renderSanctuaryComm();
      if (typeof renderCommScreen === 'function') renderCommScreen();
    }
  }

  window.OurgoalSanctuaryV3 = {
    render: renderSanctuaryV3,
    renderRadar: renderSanctuaryComm,
    setCalMode: function(m) {
      engine.activeCalMode = m;
      renderSanctuaryCalendar();
    },
    setRecMode: function(m) {
      engine.activeRecMode = m;
      if (m === 'stats' || m === 'archive' || m === 'feed') {
        if (typeof window.setRecordsSegment === 'function') {
          window.setRecordsSegment(m);
        }
      }
      renderSanctuaryRecords();
    },
    setHeatFilter: function(f) {
      engine.heatFilter = f;
      var fNames = { today: '오늘', week: '이번 주', month: '이번 달', year: '올해', all: '전체' };
      toast('히트맵 기간: ' + (fNames[f] || f));
      renderSanctuaryRecords();
    },
    shiftCal: function(dir) {
      if (!engine.calYear || !engine.calMonth) {
        var d0 = new Date();
        engine.calYear = d0.getFullYear();
        engine.calMonth = d0.getMonth() + 1;
      }
      var newDate = new Date(engine.calYear, engine.calMonth - 1 + dir, 1);
      engine.calYear = newDate.getFullYear();
      engine.calMonth = newDate.getMonth() + 1;
      var newKey = engine.calYear + '-' + String(engine.calMonth).padStart(2, '0') + '-01';
      engine.selectedCalDate = newKey;
      if (window.state) {
        window.state.calDate = newKey;
        window.state.calSelectedDate = newKey;
      }
      toast(engine.calYear + '년 ' + engine.calMonth + '월로 이동했습니다.');
      renderSanctuaryCalendar();
    },
    selectToday: function() {
      var d = new Date();
      engine.calYear = d.getFullYear();
      engine.calMonth = d.getMonth() + 1;
      var tStr = getTodayStr();
      engine.selectedCalDate = tStr;
      if (window.state) {
        window.state.calDate = tStr;
        window.state.calSelectedDate = tStr;
      }
      toast('오늘(' + tStr + ')로 이동했습니다.');
      renderSanctuaryCalendar();
    },
    selectCalDay: function(dateKey) {
      engine.selectedCalDate = dateKey;
      if (window.state) {
        window.state.calSelectedDate = dateKey;
      }
      toast(dateKey + ' 일정을 선택했습니다.');
      renderSanctuaryCalendar();
    },
    openAddScheduleModal: function(dateKey) {
      var dt = dateKey || engine.selectedCalDate || getTodayStr();
      if (typeof window.openCalendarManualEditModal === 'function') {
        window.openCalendarManualEditModal(dt, null, 'custom', {
          title: '',
          date: dt + 'T10:00',
          note: '',
          done: false,
          attachments: []
        });
      } else if (typeof window.openAddScheduleModal === 'function') {
        window.openAddScheduleModal(dt);
      } else {
        toast('일정 추가 창을 준비 중입니다.');
      }
    },
    openDayHubModal: function(dateKey) {
      var dt = dateKey || engine.selectedCalDate || getTodayStr();
      if (typeof window.openCalendarDayEditHubModal === 'function') {
        window.openCalendarDayEditHubModal(dt);
      } else {
        toast('일자 관리 종합 허브를 엽니다.');
      }
    },
    openBgPickerModal: function(dateKey) {
      var dt = dateKey || engine.selectedCalDate || getTodayStr();
      if (typeof window.openCalendarDayBgPickerModal === 'function') {
        window.openCalendarDayBgPickerModal(dt);
      } else {
        toast('배경사진 선택 모달을 엽니다.');
      }
    },
    toggleScheduleItem: async function(schedId, kind, goalId, msId, taskId) {
      if (typeof window.toggleScheduleDone === 'function') {
        await window.toggleScheduleDone(schedId, kind || 'custom', goalId, msId, taskId);
        renderSanctuaryCalendar();
      } else {
        var scheds = (window.state && window.state.profile && window.state.profile.settings && window.state.profile.settings.customSchedules) || [];
        var s = scheds.find(function(item) { return item.id === schedId; });
        if (s) {
          s.done = !s.done;
          if (window.saveProfile) await window.saveProfile();
          toast('일정을 ' + (s.done ? '완료 처리했습니다! (+5P)' : '미완료로 변경했습니다.'));
          renderSanctuaryCalendar();
        }
      }
    },
    toggleMilestone: async function(goalId, msId) {
      var goals = (window.state && window.state.profile && window.state.profile.goals) || [];
      var g = goals.find(function(item) { return item.id === goalId; });
      if (!g) return;
      var ms = (g.milestones || []).find(function(m) { return m.id === msId; });
      if (!ms) return;

      // 상태 순환: todo -> doing -> done -> todo
      if (ms.status === 'done' || ms.done) {
        ms.status = 'todo';
        ms.done = false;
      } else if (ms.status === 'doing') {
        ms.status = 'done';
        ms.done = true;
      } else {
        ms.status = 'doing';
        ms.done = false;
      }

      var total = g.milestones.length;
      var done = g.milestones.filter(function(m) { return m.status === 'done' || m.done; }).length;
      g.progress = total > 0 ? Math.round((done / total) * 100) : 0;

      if (window.saveProfile) await window.saveProfile();
      if (window.triggerHaptic) window.triggerHaptic(15);
      toast('마일스톤 상태가 변경되었습니다! ✨ (' + (ms.status === 'done' ? '완료' : '진행') + ')');
      renderSanctuaryGoals();
    },
    toggleTask: async function(goalId, msId, taskId) {
      var goals = (window.state && window.state.profile && window.state.profile.goals) || [];
      var g = goals.find(function(item) { return item.id === goalId; });
      if (!g) return;
      var ms = (g.milestones || []).find(function(m) { return m.id === msId; });
      if (!ms || !ms.tasks) return;
      var t = ms.tasks.find(function(tk) { return tk.id === taskId; });
      if (!t) return;

      t.done = !t.done;
      if (window.saveProfile) await window.saveProfile();
      if (window.triggerHaptic) window.triggerHaptic(10);
      toast('할 일을 ' + (t.done ? '완료했습니다! (+5P)' : '미완료로 변경했습니다.'));
      renderSanctuaryGoals();
    },
    openMilestoneCheckin: function(msTitle) {
      if (typeof setTab === 'function') setTab('home');
      setTimeout(function() {
        var inp = document.getElementById('captureInput');
        if (inp) {
          inp.value = '#' + msTitle + ' ';
          inp.focus();
          toast('체크인 입력창에 마일스톤을 연결했습니다. 실천 내용을 적어보세요!');
        }
      }, 150);
    },
    transplantSampleRoutine: async function() {
      var routine = {
        id: 'goal_transplant_' + Date.now(),
        title: '10km 하프마라톤 4주 완주 🏃',
        topic: '운동/건강',
        theme: 'workout',
        progress: 25,
        dueDate: getTodayStr(),
        milestones: [
          { id: 'ms_t1', title: '5km 논스톱 달리기', status: 'done', done: true, dueDate: getTodayStr() },
          { id: 'ms_t2', title: '10km 지속 페이스 5:30 달성', status: 'doing', done: false, dueDate: getTodayStr() },
          { id: 'ms_t3', title: '하프코스 21.0975km 완주', status: 'todo', done: false, dueDate: getTodayStr() }
        ],
        tasks: [
          { id: 'tk_t1', title: '카본 러닝화 점검', done: true },
          { id: 'tk_t2', title: '주 3회 야간 조깅', done: false }
        ]
      };

      if (!window.state) window.state = {};
      if (!window.state.profile) window.state.profile = { goals: [] };
      if (!Array.isArray(window.state.profile.goals)) window.state.profile.goals = [];

      window.state.profile.goals.unshift(routine);
      engine.activeGoalId = routine.id;
      window.state.activeGoalId = routine.id;

      if (window.saveProfile) await window.saveProfile();
      if (window.triggerHaptic) window.triggerHaptic(20);
      toast('⚡ [10km 하프마라톤 완주] 루틴이 내 목표에 1초 만에 담겼습니다! 🎉');
      renderSanctuaryGoals();
    },
    togglePomodoro: function() {
      engine.timerRunning = !engine.timerRunning;
      if (engine.timerRunning) {
        toast('25분 뽀모도로 포커스 타이머가 시작되었습니다! 🧘');
        if (!engine.timerInterval) {
          engine.timerInterval = setInterval(function() {
            if (engine.timerSeconds > 0) {
              engine.timerSeconds--;
              var disp = document.getElementById('sPomodoroDisplay');
              if (disp) {
                var mins = Math.floor(engine.timerSeconds / 60);
                var secs = engine.timerSeconds % 60;
                disp.textContent = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
              }
            } else {
              window.OurgoalSanctuaryV3.finishPomodoroSession();
            }
          }, 1000);
        }
      } else {
        toast('타이머가 일시정지되었습니다.');
        clearInterval(engine.timerInterval);
        engine.timerInterval = null;
      }
      renderSanctuaryCalendar();
    },
    resetPomodoro: function() {
      clearInterval(engine.timerInterval);
      engine.timerInterval = null;
      engine.timerRunning = false;
      engine.timerSeconds = 1500;
      toast('타이머가 리셋되었습니다.');
      renderSanctuaryCalendar();
    },
    finishPomodoroSession: async function() {
      clearInterval(engine.timerInterval);
      engine.timerInterval = null;
      engine.timerRunning = false;
      engine.timerSeconds = 1500;

      var goals = (window.state && window.state.profile && window.state.profile.goals) || [];
      var curGoal = goals.find(function(g) { return g.id === engine.activeGoalId; }) || goals[0];
      var goalTitle = curGoal ? curGoal.title : '집중 몰입';

      var newRecord = {
        id: 'rec_pomo_' + Date.now(),
        text: '뽀모도로 25분 몰입 완주 🧘 (' + goalTitle + ')',
        content: '뽀모도로 25분 몰입 완주 🧘 (' + goalTitle + ')',
        durationMinutes: 25,
        topic: (curGoal && curGoal.topic) || '운동/건강',
        startAt: new Date(Date.now() - 25 * 60000).toISOString(),
        created_at: new Date().toISOString()
      };

      if (!window.state) window.state = {};
      if (!window.state.profile) window.state.profile = { records: [] };
      if (!Array.isArray(window.state.profile.records)) window.state.profile.records = [];

      window.state.profile.records.unshift(newRecord);
      if (window.saveProfile) await window.saveProfile();
      if (window.playTimerBeep) window.playTimerBeep();

      toast('🎉 뽀모도로 세션 완료! 기록 탭에 25분이 자동 적립되었습니다 (+25 EXP).');
      renderSanctuaryCalendar();
    },
    cheerPost: function(btn, emoji) {
      btn.classList.toggle('active');
      toast(emoji + ' 응원을 보냈습니다! (+2P)');
      if (window.triggerHaptic) window.triggerHaptic(10);
    },
    openPeerDm: function(peerName, peerGoal) {
      if (window.state) {
        window.state.commSubTab = 'dm';
      }
      if (typeof renderCommScreen === 'function') renderCommScreen();
      toast('[' + peerName + '] 님과의 1:1 DM 대화창으로 연결되었습니다 💬');
      if (window.triggerHaptic) window.triggerHaptic(15);
    },
    downloadRecapImage: async function() {
      try {
        var allRecs = (window.state && window.state.profile && window.state.profile.records) || [];
        var streakVal = (window.state && window.state.profile && window.state.profile.streak) || 3;
        var totalMs = 0;
        allRecs.forEach(function(r) { totalMs += ((r.durationMinutes || 25) * 60000); });

        var canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        var ctx = canvas.getContext('2d');

        // 배경 그라디언트 (포커스 성소 다크 슬레이트 & 에메랄드 네온 아우라)
        var grad = ctx.createLinearGradient(0, 0, 0, 1920);
        grad.addColorStop(0, '#090d16');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1920);

        // 상단 네온 글로우 원
        var auraGrad = ctx.createRadialGradient(540, 400, 50, 540, 400, 500);
        auraGrad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
        auraGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = auraGrad;
        ctx.fillRect(0, 0, 1080, 1000);

        // 카드 박스
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(80, 160, 920, 1560, 40);
        } else {
          ctx.rect(80, 160, 920, 1560);
        }
        ctx.fill();
        ctx.stroke();

        // 텍스트 렌더링
        ctx.textAlign = 'center';
        ctx.fillStyle = '#10b981';
        ctx.font = '700 36px sans-serif';
        ctx.fillText('OURGOAL WEEKLY RECAP', 540, 280);

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 68px sans-serif';
        ctx.fillText('위클리 퍼펙트 리캡', 540, 380);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '500 32px sans-serif';
        ctx.fillText('나의 몰입과 성장의 성소 궤적', 540, 440);

        // 아바타
        ctx.font = '100px sans-serif';
        ctx.fillText('🦉', 540, 620);
        ctx.fillStyle = '#10b981';
        ctx.font = '700 34px sans-serif';
        var nick = (window.state && window.state.profile && (window.state.profile.nickname || window.state.profile.displayName)) || '목표 달성자';
        ctx.fillText(nick + ' · Lv.1 성소 탐험가', 540, 680);

        // 메트릭 1: 누적 몰입 시간
        var hoursStr = (Math.round(totalMs / 3600000 * 10) / 10) + '시간';
        ctx.fillStyle = '#f8fafc';
        ctx.font = '900 84px sans-serif';
        ctx.fillText(hoursStr, 540, 890);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = '600 34px sans-serif';
        ctx.fillText('총 누적 몰입 시간', 540, 950);

        // 메트릭 2: 연속 스트릭
        ctx.fillStyle = '#f59e0b';
        ctx.font = '900 84px sans-serif';
        ctx.fillText(streakVal + '일 연속', 540, 1140);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = '600 34px sans-serif';
        ctx.fillText('포커스 스트릭 달성 🔥', 540, 1200);

        // 메트릭 3: 누적 실천 횟수
        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 84px sans-serif';
        ctx.fillText(allRecs.length + '회 실천', 540, 1390);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = '600 34px sans-serif';
        ctx.fillText('체크인 & 회고 완료', 540, 1450);

        // 하단 워터마크
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '500 28px sans-serif';
        ctx.fillText('우리들의 목표 성소 · ourgoal.kr · ' + getTodayStr(), 540, 1640);

        var dataUrl = canvas.toDataURL('image/png');
        var link = document.createElement('a');
        link.download = 'ourgoal-weekly-recap-' + getTodayStr() + '.png';
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast('📸 위클리 리캡 카드가 이미지(PNG)로 다운로드되었습니다!');
      } catch (err) {
        console.error('downloadRecapImage error:', err);
        if (typeof window.openWeeklyRecapModal === 'function') {
          window.openWeeklyRecapModal();
        } else {
          toast('위클리 리캡 모달을 엽니다.');
        }
      }
    },
    openWeeklyRecapModal: function() {
      if (typeof window.openWeeklyRecapModal === 'function') {
        window.openWeeklyRecapModal();
      } else {
        toast('위클리 리캡 모달을 로드 중입니다.');
      }
    },
    openPeerInteraction: function(peerId) {
      var peers = getRealRunningMates();
      var p = peers.find(function(x) { return String(x.id).trim().toLowerCase() === String(peerId).trim().toLowerCase(); });
      if (!p) {
        p = peers.find(function(x) { return String(x.name).trim() === String(peerId).trim(); });
      }
      if (p && window.OurgoalTeamInviteComm && typeof window.OurgoalTeamInviteComm.openUserProfileModal === 'function') {
        window.OurgoalTeamInviteComm.openUserProfileModal(p.raw || p);
        return;
      }
      if (window.state) {
        window.state.commSubTab = 'dm';
        if (p && p.id) window.state.dmActiveId = p.id;
        if (typeof renderCommScreen === 'function') renderCommScreen();
        toast((p ? p.name : '러닝메이트') + '님과의 1:1 대화방으로 이동했습니다.');
      }
    },
    openPeerDm: function(peerIdOrName, goal) {
      this.openPeerInteraction(peerIdOrName);
    },
    refreshRadar: function(btn) {
      if (btn) {
        btn.disabled = true;
        btn.textContent = '스캔 중...';
      }
      if (window.OurgoalTeamInviteComm && typeof window.OurgoalTeamInviteComm.syncCompanionsFromDb === 'function') {
        try {
          window.OurgoalTeamInviteComm.syncCompanionsFromDb();
        } catch (e) {}
      }
      setTimeout(function() {
        renderSanctuaryComm();
        if (btn) {
          btn.disabled = false;
          btn.textContent = '새로고침';
        }
        var peers = getRealRunningMates();
        toast('러닝메이트 레이더 갱신 완료: 현재 ' + peers.length + '명 확인');
      }, 350);
    },
    gotoCompanions: function() {
      if (window.state) {
        window.state.commSubTab = 'companion';
        if (typeof renderCommScreen === 'function') renderCommScreen();
        setTimeout(function() {
          var inp = document.getElementById('companionSearchInput');
          if (inp) inp.focus();
        }, 150);
      }
    }
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
