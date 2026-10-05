/**
 * OurGoal Routine Screen (목표 탭 — 「루틴」 하위 탭 화면·새 루틴 추가 창)
 *
 * 목표 탭 「루틴」 하위 탭의 데일리 루틴 화면(renderRoutineGoalsScreen — 루틴 카드·체크·순서·삭제·교대 맞춤 편집 진입)과 「+ 새 루틴」 추가 창(openAddRoutineModal).
 * js/tabs/goals/render.js 가 L.renderRoutineGoalsScreen 으로, 마크업 바깥 파일이 window 이름으로 부른다 — window 노출 줄은 index.html 원래 자리에 그대로 있다.
 * 같은 묶음의 루틴 상세·편집 창(openRoutineDetailModal)은 옮기지 않았다 — 게스트 시드에 루틴이 없어 그 창을 여는 카드·「수정」 단추가 게스트 화면에 없다(화면 시나리오로 잴 수 없음).
 * #TASK-ES-493(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 12900~13301 · 13468~13598줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 12900~13301줄(#TASK-ES-493 생성기 표지) ---- */
  function renderRoutineGoalsScreen(){
    var container = document.getElementById('routineGoalsView');
    if(!container) return;

    if(!L.state.profile.settings.routines || !Array.isArray(L.state.profile.settings.routines)){
      L.state.profile.settings.routines = [
        { id: 'rt_morning', title: '🌅 모닝 루틴: 기상 후 물 한 잔 & 가벼운 스트레칭', time: '07:00', days: [1,2,3,4,5,6,7], notify: true, memo: '일어나자마자 미온수 500ml 섭취', completedDates: [] },
        { id: 'rt_focus', title: '💻 핵심 몰입: 오늘 1순위 목표 1시간 집중 실천', time: '10:00', days: [1,2,3,4,5], notify: true, memo: '스마트폰 방해금지 모드 켜고 뽀모도로 실천', completedDates: [] },
        { id: 'rt_evening', title: '🌙 나이트 루틴: 오늘의 하루 회고 & 내일 계획 수립', time: '22:00', days: [1,2,3,4,5,6,7], notify: true, memo: '감사한 일 3가지와 내일 할일 3가지 정리', completedDates: [] }
      ];
    }

    if(typeof L.state.routineEditMode === 'undefined') L.state.routineEditMode = false;

    // [#TASK-ES-220] 교대근무 설정 초기화 및 당일 근무 모드 계산
    if(!L.state.profile.settings.shiftSettings){
      L.state.profile.settings.shiftSettings = {
        currentShift: 'day',
        cycle: ['day', 'night', 'duty', 'off'],
        cycleStartDate: L.dateKey(new Date()),
        autoCycleEnabled: false
      };
    }
    L.state.profile.shiftSettings = L.state.profile.settings.shiftSettings;
    var shiftSettings = L.state.profile.settings.shiftSettings;

    var routines = L.state.profile.settings.routines;
    var now = new Date();
    var todayKey = L.dateKey(now);
    var dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

    var calculatedShift = shiftSettings.currentShift || 'day';
    if(shiftSettings.autoCycleEnabled && shiftSettings.cycleStartDate && Array.isArray(shiftSettings.cycle) && shiftSettings.cycle.length > 0){
      try {
        var sDate = new Date(shiftSettings.cycleStartDate + 'T00:00:00');
        var tDate = new Date(todayKey + 'T00:00:00');
        var diffTime = tDate.getTime() - sDate.getTime();
        var diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if(diffDays >= 0){
          var cycleIdx = diffDays % shiftSettings.cycle.length;
          calculatedShift = shiftSettings.cycle[cycleIdx] || calculatedShift;
        }
      } catch(e){}
    }
    var currentShiftMode = shiftSettings.currentShift || calculatedShift || 'day';
    var activePreset = L.SHIFT_WORK_PRESETS[currentShiftMode] || L.SHIFT_WORK_PRESETS.day;

    if(typeof L.state.routineFilterDay === 'undefined') L.state.routineFilterDay = 'today';
    var filterDay = L.state.routineFilterDay;

    var todayRoutines = routines.filter(function(r){
      return !r.days || r.days.indexOf(dayOfWeek) !== -1;
    });

    var completedCount = todayRoutines.filter(function(r){
      return r.completedDates && r.completedDates.indexOf(todayKey) !== -1;
    }).length;

    var totalToday = todayRoutines.length;
    var allDone = (totalToday > 0 && completedCount === totalToday);
    var dayLabels = ['월', '화', '수', '목', '금', '토', '일'];

    // [#TASK-ES-270] 요일별(오늘/월~일/전체) 필터링 대상 루틴
    var displayedRoutines = routines.filter(function(r){
      if(filterDay === 'all') return true;
      if(filterDay === 'today') return !r.days || r.days.indexOf(dayOfWeek) !== -1;
      var dNum = parseInt(filterDay, 10);
      return !r.days || r.days.indexOf(dNum) !== -1;
    });

    var filterChips = [
      { key: 'today', label: '오늘' },
      { key: '1', label: '월' },
      { key: '2', label: '화' },
      { key: '3', label: '수' },
      { key: '4', label: '목' },
      { key: '5', label: '금' },
      { key: '6', label: '토' },
      { key: '7', label: '일' },
      { key: 'all', label: '전체' }
    ];

    var html = '' +
      '<div style="margin-bottom:14px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px;">' +
          '<div>' +
            '<h3 style="margin:0;font-size:1.15rem;font-weight:700;color:var(--ink);">📅 나의 데일리 루틴</h3>' +
            '<p class="faint" style="margin:2px 0 0;font-size:.8125rem;">루틴을 터치하면 상세/편집이 가능하며, 당일 루틴 완수 시 <b>+10 EXP</b> 획득!</p>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
            '<button class="btn btn-ghost btn-sm" id="btnOpenShiftRoutineModal" type="button" style="padding:6px 10px;font-size:.8125rem;font-weight:700;border:1px solid rgba(99,102,241,0.3);border-radius:10px;color:var(--brand);background:rgba(99,102,241,0.06);display:flex;align-items:center;gap:4px;">' +
              '🔄 교대 맞춤 루틴' +
            '</button>' +
            '<button class="btn btn-ghost btn-sm" id="btnToggleRoutineEdit" type="button" style="padding:6px 12px;font-size:.8125rem;font-weight:700;border:1px solid var(--rule);border-radius:10px;color:' + (L.state.routineEditMode ? 'var(--brand)' : 'var(--ink)') + ';">' +
              (L.state.routineEditMode ? '완료' : '편집') +
            '</button>' +
            '<button class="btn btn-primary btn-sm" id="btnAddRoutineBtn" type="button" style="padding:6px 12px;font-size:.8125rem;font-weight:700;border-radius:10px;">+ 새 루틴</button>' +
          '</div>' +
        '</div>' +
        '<div class="card" id="shiftWorkRoutineSection" style="margin-bottom:12px;background:var(--card);border:1px solid var(--rule);border-radius:14px;padding:12px 14px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px;">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-size:1.05rem;">🩺</span>' +
              '<span style="font-size:.875rem;font-weight:700;color:var(--ink);">교대근무 가변형 루틴 스케줄러</span>' +
              '<span class="badge" style="font-size:.7rem;padding:2px 6px;border-radius:6px;background:rgba(99,102,241,0.12);color:var(--brand);font-weight:700;">서카디언 케어</span>' +
            '</div>' +
            '<button class="btn btn-ghost btn-xs" id="btnOpenShiftCycleModal" type="button" style="min-height:30px;padding:4px 8px;font-size:.75rem;font-weight:700;border-radius:8px;border:1px solid var(--rule);">' +
              '⚙️ 교대주기 설정' +
            '</button>' +
          '</div>' +
          '<div id="shiftWorkRoutineBar" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;">' +
            '<button class="btn btn-ghost" id="btnShiftDay" data-shift="day" type="button" style="min-height:44px;padding:6px 2px;font-size:.8125rem;font-weight:700;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:' + (currentShiftMode === 'day' ? '2px solid var(--brand)' : '1px solid var(--rule)') + ';background:' + (currentShiftMode === 'day' ? 'rgba(99,102,241,0.12)' : 'var(--card)') + ';color:' + (currentShiftMode === 'day' ? 'var(--brand)' : 'var(--ink)') + ';">' +
              '<span>☀️ 주간조</span>' +
              '<span class="faint" style="font-size:.65rem;margin-top:2px;">09:00~18:00</span>' +
            '</button>' +
            '<button class="btn btn-ghost" id="btnShiftNight" data-shift="night" type="button" style="min-height:44px;padding:6px 2px;font-size:.8125rem;font-weight:700;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:' + (currentShiftMode === 'night' ? '2px solid var(--brand)' : '1px solid var(--rule)') + ';background:' + (currentShiftMode === 'night' ? 'rgba(99,102,241,0.12)' : 'var(--card)') + ';color:' + (currentShiftMode === 'night' ? 'var(--brand)' : 'var(--ink)') + ';">' +
              '<span>🌙 야간조</span>' +
              '<span class="faint" style="font-size:.65rem;margin-top:2px;">21:00~08:00</span>' +
            '</button>' +
            '<button class="btn btn-ghost" id="btnShiftDuty" data-shift="duty" type="button" style="min-height:44px;padding:6px 2px;font-size:.8125rem;font-weight:700;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:' + (currentShiftMode === 'duty' ? '2px solid var(--brand)' : '1px solid var(--rule)') + ';background:' + (currentShiftMode === 'duty' ? 'rgba(99,102,241,0.12)' : 'var(--card)') + ';color:' + (currentShiftMode === 'duty' ? 'var(--brand)' : 'var(--ink)') + ';">' +
              '<span>🔄 당직/비번</span>' +
              '<span class="faint" style="font-size:.65rem;margin-top:2px;">24H 대기/회복</span>' +
            '</button>' +
            '<button class="btn btn-ghost" id="btnShiftOff" data-shift="off" type="button" style="min-height:44px;padding:6px 2px;font-size:.8125rem;font-weight:700;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:' + (currentShiftMode === 'off' ? '2px solid var(--brand)' : '1px solid var(--rule)') + ';background:' + (currentShiftMode === 'off' ? 'rgba(99,102,241,0.12)' : 'var(--card)') + ';color:' + (currentShiftMode === 'off' ? 'var(--brand)' : 'var(--ink)') + ';">' +
              '<span>🌿 휴무</span>' +
              '<span class="faint" style="font-size:.65rem;margin-top:2px;">리셋/리프레시</span>' +
            '</button>' +
          '</div>' +
          '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:10px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">' +
            '<div style="flex:1;min-width:200px;">' +
              '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
                '<span>현재 근무 모드: <b style="color:var(--brand);">' + activePreset.label + '</b></span>' +
                (shiftSettings.autoCycleEnabled ? '<span class="badge" style="font-size:.68rem;padding:2px 5px;background:rgba(34,197,94,0.15);color:#16a34a;border-radius:4px;">자동순환 중</span>' : '') +
              '</div>' +
              '<div class="faint" style="font-size:.75rem;margin-top:3px;line-height:1.4;">' +
                '💡 ' + activePreset.healthTip +
              '</div>' +
            '</div>' +
            '<button class="btn btn-primary btn-sm" id="btnApplyShiftRoutines" type="button" style="min-height:36px;padding:6px 12px;font-size:.8125rem;font-weight:700;border-radius:8px;flex-shrink:0;">' +
              '⚡ ' + activePreset.label + ' 맞춤 루틴 연동' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:14px;padding:12px 14px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">' +
          '<div>' +
            '<div style="font-size:.875rem;font-weight:700;color:var(--ink);">' +
              (allDone ? '🎉 오늘의 모든 루틴 달성 완료!' : '오늘 루틴 진행률 (' + completedCount + ' / ' + totalToday + ')') +
            '</div>' +
            '<div class="faint" style="font-size:.78125rem;margin-top:2px;">' +
              (allDone ? '오늘의 완주 보너스 +10 EXP가 지급되었습니다.' : '모든 루틴을 체크하면 +10 EXP가 자동 지급됩니다.') +
            '</div>' +
          '</div>' +
          '<div style="font-size:1.25rem;font-weight:800;color:' + (allDone ? 'var(--brand)' : 'var(--ink)') + ';">' +
            (totalToday ? Math.round((completedCount / totalToday) * 100) : 0) + '%' +
          '</div>' +
        '</div>' +
        '<div id="routineDayFilterBar" class="routine-day-bar" style="display:flex;align-items:center;gap:6px;overflow-x:auto;padding:2px 0 8px;margin-bottom:10px;-webkit-overflow-scrolling:touch;">' +
          filterChips.map(function(fc){
            var isSel = (filterDay === fc.key);
            var isTodayChip = (fc.key === 'today');
            var chipText = isTodayChip ? '⭐ 오늘' : (fc.key === 'all' ? '전체' : fc.label);
            return '<button type="button" class="btn btn-ghost routine-day-chip' + (isSel ? ' active' : '') + '" data-rday="' + fc.key + '" style="min-height:36px;padding:6px 14px;font-size:.8125rem;font-weight:700;border-radius:20px;white-space:nowrap;flex-shrink:0;transition:all 0.15s;' +
              (isSel ? 'background:var(--brand);color:#fff;border:1px solid var(--brand);box-shadow:0 2px 6px rgba(99,102,241,0.25);' : 'background:var(--card2);color:var(--ink);border:1px solid var(--rule);') + '">' +
              chipText +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="routine-list" style="display:flex;flex-direction:column;gap:8px;">' +
        (displayedRoutines.length === 0 ? 
          '<div class="faint" style="text-align:center;padding:30px 0;">' +
            (filterDay === 'today' ? '오늘 예정된 루틴이 없습니다. 새 루틴을 추가해보세요!' :
            (filterDay === 'all' ? '등록된 루틴이 없습니다. 새 루틴을 추가해보세요!' :
            dayLabels[parseInt(filterDay, 10) - 1] + '요일에 예정된 루틴이 없습니다.')) +
          '</div>' : '') +
        displayedRoutines.map(function(r, idx){
          var isDone = r.completedDates && r.completedDates.indexOf(todayKey) !== -1;
          var borderStyle = L.state.routineEditMode ? '1.5px dashed var(--brand)' : (isDone ? '1px solid var(--brand-line)' : '1px solid var(--rule)');
          var linkedGoal = r.linkedGoalId && L.state.profile && L.state.profile.goals ? L.state.profile.goals.find(function(g){ return g.id === r.linkedGoalId; }) : null;
          return '<div class="routine-card" data-rtid="' + r.id + '" style="background:var(--card);border:' + borderStyle + ';border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:12px;transition:all 0.2s;cursor:pointer;">' +
            (L.state.routineEditMode ? 
              '<div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0;">' +
                '<button type="button" class="btn btn-ghost btn-xs" data-rtup="' + r.id + '" style="padding:1px 4px;font-size:.7rem;line-height:1;" title="위로 이동">▲</button>' +
                '<button type="button" class="btn btn-ghost btn-xs" data-rtdown="' + r.id + '" style="padding:1px 4px;font-size:.7rem;line-height:1;" title="아래로 이동">▼</button>' +
              '</div>'
              :
              '<div class="sel-check' + (isDone ? ' on' : '') + '" data-rtchk="' + r.id + '" style="cursor:pointer;width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.9rem;font-weight:700;border:1.5px solid ' + (isDone ? 'var(--brand)' : 'var(--rule)') + ';background:' + (isDone ? 'var(--brand)' : 'transparent') + ';color:#fff;flex-shrink:0;">' +
                (isDone ? '✓' : '') +
              '</div>'
            ) +
            '<div style="flex:1;min-width:0;" data-rtopen="' + r.id + '">' +
              '<div style="font-size:.9375rem;font-weight:700;color:var(--ink);text-decoration:' + (isDone ? 'line-through' : 'none') + ';opacity:' + (isDone ? '0.7' : '1') + ';display:flex;align-items:center;gap:6px;">' +
                '<span>' + L.escapeHtml(r.title) + '</span>' +
                (!L.state.routineEditMode ? '<span style="font-size:.75rem;color:var(--ink-soft);opacity:0.6;" title="클릭하여 상세/편집">✏️</span>' : '') +
              '</div>' +
              (r.memo ? '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">💬 ' + L.escapeHtml(r.memo) + '</div>' : '') +
              '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap;">' +
                (r.category ? '<span class="routine-cat-badge" style="font-size:.71875rem;font-weight:700;padding:2px 6px;border-radius:6px;background:rgba(99,102,241,0.12);color:var(--brand);">' + L.escapeHtml(r.category) + '</span>' : '') +
                (linkedGoal ? '<span class="routine-linked-goal-badge" style="font-size:.71875rem;padding:2px 6px;border-radius:6px;background:var(--card2);border:1px solid var(--rule);color:var(--ink-soft);">🎯 ' + L.escapeHtml(linkedGoal.title) + '</span>' : '') +
                (r.time ? '<span style="font-size:.75rem;color:var(--ink-soft);background:var(--card2);padding:2px 6px;border-radius:6px;border:1px solid var(--rule);">⏰ ' + r.time + '</span>' : '') +
                '<span style="font-size:.75rem;color:var(--ink-soft);">' +
                  (r.days || [1,2,3,4,5,6,7]).map(function(d){ return dayLabels[d-1]; }).join(',') +
                '</span>' +
                (r.notify ? '<span style="font-size:.75rem;color:var(--brand);">🔔 알림</span>' : '') +
              '</div>' +
            '</div>' +
            (L.state.routineEditMode ?
              '<div style="display:flex;gap:4px;flex-shrink:0;">' +
                '<button class="btn btn-ghost btn-sm" data-rtedit="' + r.id + '" type="button" style="color:var(--brand);padding:4px 8px;font-size:.8125rem;font-weight:700;">수정</button>' +
                '<button class="btn btn-ghost btn-sm" data-rtdel="' + r.id + '" type="button" style="color:#ef4444;padding:4px 8px;font-size:.8125rem;">삭제</button>' +
              '</div>'
              :
              '<button class="btn btn-ghost btn-sm" data-rtdel="' + r.id + '" type="button" style="color:var(--ink-soft);padding:4px 8px;font-size:.8125rem;">삭제</button>'
            ) +
          '</div>';
        }).join('') +
      '</div>';

    container.innerHTML = html;

    // 편집 모드 토글
    var editToggleBtn = container.querySelector('#btnToggleRoutineEdit');
    if(editToggleBtn){
      editToggleBtn.onclick = function(){
        L.state.routineEditMode = !L.state.routineEditMode;
        renderRoutineGoalsScreen();
      };
    }

    // 순서 변경 (위로 / 아래로)
    container.querySelectorAll('[data-rtup]').forEach(function(btn){
      btn.onclick = async function(e){
        e.stopPropagation();
        var rId = btn.getAttribute('data-rtup');
        var idx = routines.findIndex(function(r){ return r.id === rId; });
        if(idx > 0){
          var temp = routines[idx];
          routines[idx] = routines[idx - 1];
          routines[idx - 1] = temp;
          await L.saveProfile();
          renderRoutineGoalsScreen();
        }
      };
    });

    container.querySelectorAll('[data-rtdown]').forEach(function(btn){
      btn.onclick = async function(e){
        e.stopPropagation();
        var rId = btn.getAttribute('data-rtdown');
        var idx = routines.findIndex(function(r){ return r.id === rId; });
        if(idx !== -1 && idx < routines.length - 1){
          var temp = routines[idx];
          routines[idx] = routines[idx + 1];
          routines[idx + 1] = temp;
          await L.saveProfile();
          renderRoutineGoalsScreen();
        }
      };
    });

    // 편집 버튼 클릭
    container.querySelectorAll('[data-rtedit]').forEach(function(btn){
      btn.onclick = function(e){
        e.stopPropagation();
        var rId = btn.getAttribute('data-rtedit');
        L.openRoutineDetailModal(rId);
      };
    });

    // 루틴 카드 클릭 시 상세/수정 모달 오픈 (체크박스/삭제버튼 제외)
    container.querySelectorAll('.routine-card').forEach(function(card){
      card.onclick = function(e){
        if(e.target.closest('[data-rtchk]') || e.target.closest('[data-rtdel]') || e.target.closest('[data-rtup]') || e.target.closest('[data-rtdown]')) return;
        var rId = card.getAttribute('data-rtid');
        L.openRoutineDetailModal(rId);
      };
    });

    // 체크박스 완수 토글
    container.querySelectorAll('[data-rtchk]').forEach(function(chk){
      chk.onclick = async function(e){
        e.stopPropagation();
        L.triggerHaptic(15);
        var rId = chk.getAttribute('data-rtchk');
        var targetRoutine = routines.find(function(r){ return r.id === rId; });
        if(!targetRoutine) return;
        if(!targetRoutine.completedDates) targetRoutine.completedDates = [];
        var idx = targetRoutine.completedDates.indexOf(todayKey);
        if(idx !== -1){
          targetRoutine.completedDates.splice(idx, 1);
        } else {
          targetRoutine.completedDates.push(todayKey);
        }
        await L.saveProfile();

        var nowCompleted = todayRoutines.filter(function(r){
          return r.completedDates && r.completedDates.indexOf(todayKey) !== -1;
        }).length;
        if(todayRoutines.length > 0 && nowCompleted === todayRoutines.length){
          if(L.state.profile.settings.routineLastExpAwardDate !== todayKey){
            L.state.profile.settings.routineLastExpAwardDate = todayKey;
            await L.saveProfile();
            L.awardXP(10, '일일 루틴 전수 완수 (+10 EXP)');
            L.burstConfetti(window.innerWidth / 2, window.innerHeight / 3, 30);
            L.toast('오늘의 모든 루틴을 완수했습니다! +10 EXP 획득 🎉');
          }
        }
        renderRoutineGoalsScreen();
      };
    });

    // 삭제 버튼
    container.querySelectorAll('[data-rtdel]').forEach(function(btn){
      btn.onclick = async function(e){
        e.stopPropagation();
        var rId = btn.getAttribute('data-rtdel');
        if(!confirm('이 루틴을 삭제하시겠습니까?')) return;
        L.state.profile.settings.routines = routines.filter(function(r){ return r.id !== rId; });
        await L.saveProfile();
        L.toast('루틴이 삭제되었습니다.');
        renderRoutineGoalsScreen();
      };
    });

    // [#TASK-ES-270] 요일 필터 칩 클릭 이벤트 배선
    container.querySelectorAll('.routine-day-chip').forEach(function(chip){
      chip.onclick = function(e){
        e.stopPropagation();
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
        L.state.routineFilterDay = chip.getAttribute('data-rday');
        renderRoutineGoalsScreen();
      };
    });

    var addBtn = container.querySelector('#btnAddRoutineBtn');
    if(addBtn){
      addBtn.onclick = function(){
        openAddRoutineModal();
      };
    }

    // [#TASK-ES-270] 교대근무 4종 캡슐 버튼 1초 안전 비파괴 치환 배선
    var shiftDayBtn = container.querySelector('#btnShiftDay');
    if(shiftDayBtn){
      shiftDayBtn.onclick = async function(e){
        e.stopPropagation();
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
        await L.applyShiftWorkRoutines('day', true);
      };
    }

    var shiftNightBtn = container.querySelector('#btnShiftNight');
    if(shiftNightBtn){
      shiftNightBtn.onclick = async function(e){
        e.stopPropagation();
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
        await L.applyShiftWorkRoutines('night', true);
      };
    }

    var shiftDutyBtn = container.querySelector('#btnShiftDuty');
    if(shiftDutyBtn){
      shiftDutyBtn.onclick = async function(e){
        e.stopPropagation();
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
        await L.applyShiftWorkRoutines('duty', true);
      };
    }

    var shiftOffBtn = container.querySelector('#btnShiftOff');
    if(shiftOffBtn){
      shiftOffBtn.onclick = async function(e){
        e.stopPropagation();
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
        await L.applyShiftWorkRoutines('off', true);
      };
    }

    var btnOpenShiftModal = container.querySelector('#btnOpenShiftRoutineModal');
    if(btnOpenShiftModal){
      btnOpenShiftModal.onclick = function(e){
        e.stopPropagation();
        L.openShiftWorkCustomModal(currentShiftMode);
      };
    }

    var btnApplyShift = container.querySelector('#btnApplyShiftRoutines');
    if(btnApplyShift){
      btnApplyShift.onclick = function(e){
        e.stopPropagation();
        L.openShiftWorkCustomModal(currentShiftMode);
      };
    }

    var btnCycleModal = container.querySelector('#btnOpenShiftCycleModal');
    if(btnCycleModal){
      btnCycleModal.onclick = function(e){
        e.stopPropagation();
        L.openShiftCycleModal();
      };
    }
  }

  /* ---- 이전 전 index.html 13468~13598줄(#TASK-ES-493 생성기 표지) ---- */

  function openAddRoutineModal(){
    var routineCategories = ['🏃 운동·건강', '📚 공부·성장', '💼 커리어·업무', '🧘 마음·멘탈', '🌱 생활·습관'];
    var activeGoals = (L.state.profile && L.state.profile.goals) ? L.state.profile.goals.filter(function(g){ return !g.archivedAt; }) : [];
    var currentCat = '🌱 생활·습관';

    var modalHtml = '' +
      '<div class="routine-detail-modal-box" style="padding:2px 0;">' +
        '<div class="modal-head" style="margin-bottom:12px;">' +
          '<h3 style="margin:0;font-size:1.1rem;font-weight:800;color:var(--ink);">🎯 새 데일리 루틴 추가</h3>' +
          '<p class="faint" style="margin:4px 0 0;font-size:.8125rem;">매일 또는 특정 요일에 반복할 나만의 습관/루틴을 설정하세요.</p>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
          '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:6px;color:var(--ink);">루틴 카테고리 (목표 연계)</label>' +
          '<div id="addRtCategoryPicker" style="display:flex;flex-wrap:wrap;gap:6px;">' +
            routineCategories.map(function(cat){
              var isCatSel = (cat === currentCat);
              return '<button type="button" class="btn btn-sm btn-ghost add-routine-cat-chip' + (isCatSel ? ' active' : '') + '" data-cat="' + cat + '" style="padding:5px 10px;font-size:.78125rem;font-weight:700;border-radius:8px;border:1px solid ' + (isCatSel ? 'var(--brand)' : 'var(--rule)') + ';background:' + (isCatSel ? 'var(--brand)' : 'var(--surface-2)') + ';color:' + (isCatSel ? '#fff' : 'var(--ink)') + ';">' + cat + '</button>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
          '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:4px;color:var(--ink);">루틴 이름</label>' +
          '<input type="text" id="inRoutineTitle" placeholder="예: 📚 아침 독서 20분, 💧 물 2L 마시기" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--rule);background:var(--surface-2);color:var(--ink);box-sizing:border-box;font-weight:600;">' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
          '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:4px;color:var(--ink);">연결 상위 목표 (선택)</label>' +
          '<select id="inAddRtLinkedGoalId" style="width:100%;padding:9px 12px;border-radius:10px;border:1px solid var(--rule);background:var(--surface-2);color:var(--ink);box-sizing:border-box;font-size:.84375rem;">' +
            '<option value="">선택 안 함 (독립 루틴)</option>' +
            activeGoals.map(function(g){
              return '<option value="' + g.id + '">🎯 ' + L.escapeHtml(g.title) + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">' +
          '<div>' +
            '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:4px;color:var(--ink);">알림/실천 시간</label>' +
            '<input type="time" id="inRoutineTime" value="08:00" style="width:100%;padding:8px 10px;border-radius:10px;border:1px solid var(--rule);background:var(--surface-2);color:var(--ink);box-sizing:border-box;">' +
          '</div>' +
          '<div>' +
            '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:4px;color:var(--ink);">알림 수신</label>' +
            '<label style="display:flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid var(--rule);border-radius:10px;background:var(--surface-2);cursor:pointer;font-size:.8125rem;color:var(--ink);">' +
              '<input type="checkbox" id="inAddRtNotify" checked> <span>🔔 푸시 알림</span>' +
            '</label>' +
          '</div>' +
        '</div>' +
        '<div style="margin-bottom:14px;">' +
          '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:6px;color:var(--ink);">반복 요일</label>' +
          '<div style="display:flex;gap:4px;" id="routineDaysPicker">' +
            ['월','화','수','목','금','토','일'].map(function(d, i){
              return '<button type="button" class="btn btn-sm btn-ghost r-day-btn active" data-day="' + (i+1) + '" style="flex:1;padding:6px 0;font-size:.8125rem;font-weight:700;border:1px solid var(--brand);background:var(--brand);color:#fff;border-radius:8px;">' + d + '</button>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div style="margin-bottom:16px;">' +
          '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:4px;color:var(--ink);">실천 팁 & 상세 메모 (선택)</label>' +
          '<textarea id="inAddRtMemo" placeholder="예: 미온수 500ml 준비, 가벼운 목/허리 스트레칭 5분" style="width:100%;box-sizing:border-box;min-height:60px;padding:8px 12px;border-radius:10px;border:1px solid var(--rule);background:var(--surface-2);color:var(--ink);resize:vertical;"></textarea>' +
        '</div>' +
        '<div class="modal-actions" style="display:flex;gap:8px;">' +
          '<button class="btn btn-ghost" id="btnCancelAddRoutine" type="button" style="flex:1;">취소</button>' +
          '<button class="btn btn-primary" id="btnSaveAddRoutine" type="button" style="flex:1;font-weight:700;">루틴 등록</button>' +
        '</div>' +
      '</div>';

    L.openModal(modalHtml, function(sheet){
      sheet.querySelector('#btnCancelAddRoutine').onclick = L.closeModal;

      sheet.querySelectorAll('.add-routine-cat-chip').forEach(function(chip){
        chip.onclick = function(){
          currentCat = chip.getAttribute('data-cat');
          sheet.querySelectorAll('.add-routine-cat-chip').forEach(function(c){
            var isThis = (c.getAttribute('data-cat') === currentCat);
            c.style.background = isThis ? 'var(--brand)' : 'var(--surface-2)';
            c.style.color = isThis ? '#fff' : 'var(--ink)';
            c.style.borderColor = isThis ? 'var(--brand)' : 'var(--rule)';
          });
        };
      });

      var selectedDays = [1,2,3,4,5,6,7];
      sheet.querySelectorAll('.r-day-btn').forEach(function(btn){
        btn.onclick = function(){
          var day = parseInt(btn.getAttribute('data-day'), 10);
          var idx = selectedDays.indexOf(day);
          if(idx !== -1){
            if(selectedDays.length > 1){
              selectedDays.splice(idx, 1);
              btn.style.background = 'transparent';
              btn.style.color = 'var(--ink)';
              btn.style.borderColor = 'var(--rule)';
            }
          } else {
            selectedDays.push(day);
            selectedDays.sort();
            btn.style.background = 'var(--brand)';
            btn.style.color = '#fff';
            btn.style.borderColor = 'var(--brand)';
          }
        };
      });

      sheet.querySelector('#btnSaveAddRoutine').onclick = async function(){
        var title = sheet.querySelector('#inRoutineTitle').value.trim();
        if(!title){ L.toast('루틴 이름을 입력해주세요.'); return; }
        var linkedGoalId = sheet.querySelector('#inAddRtLinkedGoalId').value || null;
        var time = sheet.querySelector('#inRoutineTime').value;
        var notify = sheet.querySelector('#inAddRtNotify').checked;
        var memo = sheet.querySelector('#inAddRtMemo').value.trim();

        if(!L.state.profile.settings.routines) L.state.profile.settings.routines = [];
        var newRt = {
          id: 'rt_' + Date.now(),
          title: title,
          category: currentCat,
          linkedGoalId: linkedGoalId,
          time: time,
          days: selectedDays,
          notify: notify,
          memo: memo,
          completedDates: []
        };
        L.state.profile.settings.routines.push(newRt);
        await L.saveProfile();
        L.closeModal();
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
        L.toast('새 루틴이 등록되었습니다! ⏰');
        renderRoutineGoalsScreen();
        if(typeof L.renderAll === 'function') L.renderAll();
      };
    });
  }

  K.renderRoutineGoalsScreen = renderRoutineGoalsScreen;
  K.openAddRoutineModal = openAddRoutineModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
