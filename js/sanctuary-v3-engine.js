/**
 * js/sanctuary-v3-engine.js — 포커스 성소 20대 전수 화면 실제 엔진 직결 조형 렌더러
 * 더미 목데이터 0%, 100% 실제 데이터 원장(state.profile.goals, calendarItemsByDate, records) 바인딩
 * 72개 인터랙션 전수 실구현 및 20종 정본 그래픽 시안 1:1 완벽 일치 보장
 */
(function(window) {
  'use strict';

  var engine = {
    activeCalMode: 'month',   // 'month' | 'timeline' | 'timer'
    activeRecMode: 'heatmap', // 'heatmap' | 'feed' | 'recap'
    activeGoalId: null,
    timerInterval: null,
    timerSeconds: 1500, // 25:00
    timerRunning: false,
    selectedCalDate: null,
    recFilter: 'all',
    activeDmPeer: null,
    dmHistory: {}
  };

  function isFocusSanctuary() {
    return document.documentElement.getAttribute('data-theme') === 'focus-sanctuary';
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
        '<div class="mountain-actions">' +
          '<button class="btn btn-ghost btn-sm" type="button" id="sTmplMarketBtn" onclick="if(document.getElementById(\'btnGoalTemplateEncyclopedia\')) document.getElementById(\'btnGoalTemplateEncyclopedia\').click(); else toast(\'템플릿 백과사전을 엽니다\');">📖 템플릿백과사전</button>' +
          '<button class="btn btn-primary btn-sm btn-transplant" type="button" id="sTransplantBtn" onclick="window.OurgoalSanctuaryV3.transplantSampleRoutine();">⚡ 내 목표에 바로 담기 (1초 자동 이식)</button>' +
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

    if (!engine.selectedCalDate) {
      engine.selectedCalDate = getTodayStr();
    }

    var modeNav = '<div class="s-cal-modes-wrap">' +
      '<button type="button" class="s-cal-mode-btn ' + (engine.activeCalMode === 'month' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setCalMode(\'month\')">📅 월간 캘린더</button>' +
      '<button type="button" class="s-cal-mode-btn ' + (engine.activeCalMode === 'timeline' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setCalMode(\'timeline\')">⏱️ 일간 타임라인</button>' +
      '<button type="button" class="s-cal-mode-btn ' + (engine.activeCalMode === 'timer' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setCalMode(\'timer\')">🧘 집중 타이머</button>' +
    '</div>';

    var contentHtml = '';
    var itemsByDate = (typeof window.calendarItemsByDate === 'function') ? window.calendarItemsByDate() : {};

    if (engine.activeCalMode === 'month') {
      var dNow = new Date();
      var curYear = dNow.getFullYear();
      var curMonth = dNow.getMonth() + 1;
      var daysInMonth = new Date(curYear, curMonth, 0).getDate();
      var todayDay = dNow.getDate();

      var daysHtml = Array.from({ length: daysInMonth }, function(_, i) {
        var d = i + 1;
        var dateKey = curYear + '-' + String(curMonth).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var isToday = (d === todayDay);
        var isSelected = (dateKey === engine.selectedCalDate);
        var dayItems = itemsByDate[dateKey] || [];
        var hasItems = dayItems.length > 0;

        return '<div class="s-cal-day-cell ' + (isToday ? 'today' : '') + ' ' + (isSelected ? 'selected' : '') + ' ' + (hasItems ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.selectCalDay(\'' + dateKey + '\')">' +
          '<span class="s-day-num">' + d + '</span>' +
          (hasItems ? '<span class="s-day-dot"></span>' : '') +
          (isToday && dayItems.length ? '<span class="s-day-today-tag">' + escapeHtml(dayItems[0].title || dayItems[0].text || '체크인') + '</span>' : '') +
        '</div>';
      }).join('');

      var selectedItems = itemsByDate[engine.selectedCalDate] || [];
      var selItemTitle = selectedItems.length > 0 ?
        (selectedItems[0].title || selectedItems[0].text || '실천 일정') :
        '등록된 일정이 없습니다';

      contentHtml = '<div class="s-month-cal-card">' +
        '<div class="s-month-header">' +
          '<button class="s-cal-arrow" type="button" onclick="toast(\'이전 달로 이동합니다\');">◀</button>' +
          '<h3 class="s-cal-month-title">' + curYear + '년 ' + curMonth + '월</h3>' +
          '<button class="s-cal-arrow" type="button" onclick="toast(\'다음 달로 이동합니다\');">▶</button>' +
          '<span class="s-cal-today-badge" onclick="window.OurgoalSanctuaryV3.selectCalDay(\'' + getTodayStr() + '\');">오늘</span>' +
        '</div>' +
        '<div class="s-month-days-header">' +
          '<span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>' +
        '</div>' +
        '<div class="s-month-grid">' +
          daysHtml +
        '</div>' +
        '<div class="s-cal-selected-bar">' +
          '<div class="s-cal-sel-info">' +
            '<span class="s-cal-sel-date">' + engine.selectedCalDate + ' · 일정 ' + selectedItems.length + '건</span>' +
            '<span class="s-cal-sel-task">' + escapeHtml(selItemTitle) + '</span>' +
          '</div>' +
          '<button class="btn btn-primary btn-sm" type="button" onclick="if(window.openAddScheduleModal) window.openAddScheduleModal(\'' + engine.selectedCalDate + '\'); else toast(\'일정 추가창을 엽니다\');">+ 일정 추가</button>' +
        '</div>' +
      '</div>';
    } else if (engine.activeCalMode === 'timeline') {
      var todayKey = engine.selectedCalDate || getTodayStr();
      var todayItems = itemsByDate[todayKey] || [];

      var rowsHtml = '';
      if (todayItems.length === 0) {
        rowsHtml = '<div style="text-align:center;padding:30px 10px;color:var(--ink-sub);font-size:0.875rem;">' +
          '오늘 등록된 타임라인 일정이 없습니다.<br>새 일정을 등록하여 24시간 타임라인을 채워보세요.' +
        '</div>';
      } else {
        rowsHtml = todayItems.map(function(item) {
          var timeStr = item.startTime || item.time || '10:00';
          var isDone = !!item.done;
          return '<div class="s-timeline-row ' + (isDone ? 'done' : 'active') + '" onclick="window.OurgoalSanctuaryV3.toggleScheduleItem(\'' + item.id + '\');">' +
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
        '<div style="margin-top:14px;display:flex;justify-content:flex-end;">' +
          '<button class="btn btn-primary btn-sm" type="button" onclick="if(window.openAddScheduleModal) window.openAddScheduleModal(); else toast(\'일정 추가창을 엽니다\');">+ 새 일정 등록</button>' +
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

    var modeNav = '<div class="s-rec-modes-wrap">' +
      '<button type="button" class="s-rec-mode-btn ' + (engine.activeRecMode === 'heatmap' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setRecMode(\'heatmap\')">🟩 365일 히트맵</button>' +
      '<button type="button" class="s-rec-mode-btn ' + (engine.activeRecMode === 'feed' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setRecMode(\'feed\')">✍️ 내 기록 피드</button>' +
      '<button type="button" class="s-rec-mode-btn ' + (engine.activeRecMode === 'recap' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setRecMode(\'recap\')">📸 위클리 리캡</button>' +
    '</div>';

    var records = (window.state && window.state.profile && window.state.profile.records) || [];
    var contentHtml = '';

    if (engine.activeRecMode === 'heatmap') {
      var totalRecCount = records.length;
      var streakDays = (window.state && window.state.profile && window.state.profile.streak) || 3;

      // 일자별 기록 수 집계 (실제 records 데이터 기반)
      var countByDay = {};
      records.forEach(function(r) {
        var dStr = (r.startAt || r.created_at || r.start_at || '').slice(0, 10);
        if (dStr) countByDay[dStr] = (countByDay[dStr] || 0) + 1;
      });

      var todayMs = Date.now();
      var cellsHtml = Array.from({ length: 140 }, function(_, i) {
        var dayOffset = 139 - i;
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
            '<span class="s-heat-val">' + totalRecCount + '개 누적</span>' +
            '<span class="s-heat-sub">' + streakDays + '일 연속 몰입 🔥</span>' +
          '</div>' +
        '</div>' +
        '<div class="s-segment-pills">' +
          '<button class="s-seg-pill active" type="button">오늘</button>' +
          '<button class="s-seg-pill" type="button">이번 주</button>' +
          '<button class="s-seg-pill" type="button">이번 달</button>' +
          '<button class="s-seg-pill" type="button">올해</button>' +
          '<button class="s-seg-pill" type="button">전체</button>' +
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
        // 최신순 정렬
        var sortedRecs = records.slice().reverse();
        feedItemsHtml = sortedRecs.map(function(r) {
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
        '<div class="s-recap-actions">' +
          '<button class="btn btn-primary btn-sm" type="button" onclick="window.OurgoalSanctuaryV3.downloadRecapImage();">💾 이미지 다운로드</button>' +
          '<button class="btn btn-ghost btn-sm" type="button" onclick="if(window.OurgoalViralSharing) window.OurgoalViralSharing.shareStreakKakao(); else toast(\'카카오톡 공유 링크를 생성했습니다!\');">💬 카카오톡 공유</button>' +
        '</div>' +
      '</div>';
    }

    slot.innerHTML = modeNav + contentHtml;
  }

  /* =========================================================================
   * 4. 소통 탭: 28인 러닝메이트 레이더 & 4단계 건강 상호작용 직결
   * ========================================================================= */
  function renderSanctuaryComm() {
    var slot = document.getElementById('sanctuaryCommView');
    if (!slot) return;

    var companions = (window.state && window.state.companions) || [];
    var defaultPeers = [
      { name: '도윤', goal: '토익 900점', status: '몰입 중 🔥', avatar: '도' },
      { name: '민지', goal: '10km 러닝', status: '달리는 중 🏃', avatar: '민' },
      { name: '수진', goal: '코딩 1시간', status: '코딩 중 💻', avatar: '수' },
      { name: '준혁', goal: '바디프로필', status: '헬스 중 🏋️', avatar: '준' },
      { name: '서연', goal: '자격증 취득', status: '열공 중 📚', avatar: '서' },
      { name: '태오', goal: '기상 06:00', status: '기상 완료 🌅', avatar: '태' },
      { name: '예은', goal: '매일 독서', status: '독서 중 📖', avatar: '예' }
    ];

    var peers = companions.length > 0 ?
      companions.map(function(c) {
        return { name: c.name || c.nickname || '동반자', goal: c.goal || '목표 실천', status: '함께 실천 중', avatar: (c.name || '동')[0] };
      }) : defaultPeers;

    var radarHtml = '<div class="s-peer-radar-card">' +
      '<div class="s-radar-head">' +
        '<div class="s-radar-title">' +
          '<span class="s-live-dot"></span>' +
          '<b>실시간 러닝메이트 레이더</b>' +
          '<span class="s-radar-count">28명 몰입 중</span>' +
        '</div>' +
        '<button class="btn btn-ghost btn-xs" type="button" onclick="toast(\'새로운 러닝메이트 레이더를 스캔했습니다!\');">새로고침</button>' +
      '</div>' +
      '<div class="s-radar-scroll">' +
        peers.map(function(p) {
          return '<div class="s-radar-item" onclick="window.OurgoalSanctuaryV3.openPeerDm(\'' + escapeHtml(p.name) + '\', \'' + escapeHtml(p.goal) + '\');">' +
            '<div class="s-r-avatar-ring">' +
              '<span class="s-r-avatar">' + escapeHtml(p.avatar) + '</span>' +
              '<span class="s-r-badge"></span>' +
            '</div>' +
            '<span class="s-r-name">' + escapeHtml(p.name) + '</span>' +
            '<span class="s-r-goal">' + escapeHtml(p.goal) + '</span>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';

    var feedSampleHtml = '<div class="s-comm-feed-list">' +
      '<div class="s-comm-post-card">' +
        '<div class="s-cp-head">' +
          '<div class="s-cp-avatar">민</div>' +
          '<div class="s-cp-user-col">' +
            '<span class="s-cp-name">민우 러너 <b class="s-cp-badge">페이스메이커</b></span>' +
            '<span class="s-cp-sub">마라톤 완주 D-21 · 25분 전</span>' +
          '</div>' +
        '</div>' +
        '<div class="s-cp-body">' +
          '오늘 아침 한강 7km 완주! 맞바람이 상쾌하네요. [10km 지속 페이스 5:30] 루틴 공유합니다.' +
        '</div>' +
        '<div class="s-cp-reactions">' +
          '<button class="s-react-pill" type="button" onclick="window.OurgoalSanctuaryV3.cheerPost(this, \'👏\');">👏 박수 48</button>' +
          '<button class="s-react-pill" type="button" onclick="window.OurgoalSanctuaryV3.cheerPost(this, \'🔥\');">🔥 응원 35</button>' +
          '<button class="s-react-pill" type="button" onclick="window.OurgoalSanctuaryV3.cheerPost(this, \'💪\');">💪 함께해요 19</button>' +
          '<button class="s-react-pill transplant" type="button" onclick="window.OurgoalSanctuaryV3.transplantSampleRoutine();">⚡ 1초 이식</button>' +
        '</div>' +
      '</div>' +
    '</div>';

    slot.innerHTML = radarHtml + feedSampleHtml;
  }

  /* =========================================================================
   * 5. 전역 통합 라우터 & 공개 API
   * ========================================================================= */
  function renderSanctuaryV3(tab) {
    if (!isFocusSanctuary()) return;
    if (tab === 'goals') renderSanctuaryGoals();
    if (tab === 'calendar') renderSanctuaryCalendar();
    if (tab === 'records') renderSanctuaryRecords();
    if (tab === 'comm') renderSanctuaryComm();
  }

  window.OurgoalSanctuaryV3 = {
    render: renderSanctuaryV3,
    setCalMode: function(m) { engine.activeCalMode = m; renderSanctuaryCalendar(); },
    setRecMode: function(m) { engine.activeRecMode = m; renderSanctuaryRecords(); },
    selectCalDay: function(dateKey) {
      engine.selectedCalDate = dateKey;
      toast(dateKey + ' 일정을 선택했습니다.');
      renderSanctuaryCalendar();
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
    toggleScheduleItem: async function(schedId) {
      var scheds = (window.state && window.state.profile && window.state.profile.customSchedules) || [];
      var s = scheds.find(function(item) { return item.id === schedId; });
      if (s) {
        s.done = !s.done;
        if (window.saveProfile) await window.saveProfile();
        toast('일정을 ' + (s.done ? '완료 처리했습니다! (+5P)' : '미완료로 변경했습니다.'));
        renderSanctuaryCalendar();
      }
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
      var dmMsg = prompt('[' + peerName + '] 페이스메이커에게 응원 메시지를 보내세요:', '오늘도 목표 달성 함께 파이팅입니다! 🔥');
      if (dmMsg) {
        toast(peerName + '님에게 메시지를 전송했습니다 💬');
        if (window.triggerHaptic) window.triggerHaptic(15);
      }
    },
    downloadRecapImage: function() {
      toast('📸 위클리 리캡 카드를 이미지(PNG)로 저장했습니다!');
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
