/**
 * OurGoal Routine Detail Modal (목표 — 데일리 루틴 상세 확인·편집 창)
 *
 * 「[#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달」 묶음에 남아 있던 루틴 상세·편집 창(openRoutineDetailModal — 카테고리·이름·연결 목표·시간·알림·반복 요일·메모 편집, 저장·삭제·취소). 같은 묶음의 루틴 화면·추가 창은 #TASK-ES-493 이 js/tabs/goals/routine-screen.js 로 옮겼다.
 * window 노출 if 문은 index.html 원래 자리에 그대로 있다.
 * #TASK-ES-537(인라인 3단계 기관 — 데일리 루틴 상세·편집 창): index.html 인라인 IIFE 의 구간(이전 전 8451~8613줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 8451~8613줄(#TASK-ES-537 생성기 표지) ---- */
  /* [#TASK-ES-493] renderRoutineGoalsScreen → js/tabs/goals/routine-screen.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  /**
   * 루틴 상세 확인 및 편집 모달 (목표탭 벤치마킹 #TASK-ES-305)
   */
  function openRoutineDetailModal(routineId){
    var routines = (L.state.profile && L.state.profile.settings && L.state.profile.settings.routines) || [];
    var target = routines.find(function(r){ return r.id === routineId; });
    if(!target) return;

    var selectedDays = (target.days && target.days.slice()) || [1,2,3,4,5,6,7];
    var compCount = (target.completedDates && target.completedDates.length) || 0;
    var isDoneToday = target.completedDates && target.completedDates.indexOf(L.dateKey(new Date())) !== -1;
    var currentCat = target.category || '🌱 생활·습관';
    var routineCategories = ['🏃 운동·건강', '📚 공부·성장', '💼 커리어·업무', '🧘 마음·멘탈', '🌱 생활·습관'];
    var activeGoals = (L.state.profile && L.state.profile.goals) ? L.state.profile.goals.filter(function(g){ return !g.archivedAt; }) : [];

    var modalHtml = '' +
      '<div class="routine-detail-modal-box" style="padding:2px 0;">' +
        '<div class="modal-head" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="font-size:1.25rem;">🎯</span>' +
            '<h3 style="margin:0;font-size:1.1rem;font-weight:800;color:var(--ink);">루틴 상세 & 편집 (목표 벤치마킹)</h3>' +
          '</div>' +
          '<span class="badge" style="font-size:.75rem;padding:3px 8px;border-radius:8px;background:' + (isDoneToday ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.12)') + ';color:' + (isDoneToday ? '#16a34a' : 'var(--brand)') + ';font-weight:700;">' +
            (isDoneToday ? '✓ 오늘 완수됨' : '진행 대기 중') +
          '</span>' +
        '</div>' +
        '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;">' +
          '<div>' +
            '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);">누적 실천 성취</div>' +
            '<div class="faint" style="font-size:.75rem;">설정 이후 꾸준히 실천한 총 완수 일수</div>' +
          '</div>' +
          '<div style="font-size:1.15rem;font-weight:800;color:var(--brand);font-family:monospace;">총 ' + compCount + '일</div>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
          '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:6px;color:var(--ink);">루틴 카테고리 (목표 연계)</label>' +
          '<div id="detailRtCategoryPicker" style="display:flex;flex-wrap:wrap;gap:6px;">' +
            routineCategories.map(function(cat){
              var isCatSel = (cat === currentCat);
              return '<button type="button" class="btn btn-sm btn-ghost routine-cat-chip' + (isCatSel ? ' active' : '') + '" data-cat="' + cat + '" style="padding:5px 10px;font-size:.78125rem;font-weight:700;border-radius:8px;border:1px solid ' + (isCatSel ? 'var(--brand)' : 'var(--rule)') + ';background:' + (isCatSel ? 'var(--brand)' : 'var(--surface-2)') + ';color:' + (isCatSel ? '#fff' : 'var(--ink)') + ';">' + cat + '</button>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
          '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:4px;color:var(--ink);">루틴 이름</label>' +
          '<input type="text" id="inDetailRtTitle" value="' + L.escapeHtml(target.title) + '" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--rule);background:var(--surface-2);color:var(--ink);box-sizing:border-box;font-weight:600;" placeholder="실천할 루틴 이름을 입력하세요">' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
          '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:4px;color:var(--ink);">연결 상위 목표 (선택)</label>' +
          '<select id="inDetailRtLinkedGoalId" style="width:100%;padding:9px 12px;border-radius:10px;border:1px solid var(--rule);background:var(--surface-2);color:var(--ink);box-sizing:border-box;font-size:.84375rem;">' +
            '<option value="">선택 안 함 (독립 루틴)</option>' +
            activeGoals.map(function(g){
              var isGoalSel = (g.id === target.linkedGoalId);
              return '<option value="' + g.id + '"' + (isGoalSel ? ' selected' : '') + '>🎯 ' + L.escapeHtml(g.title) + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">' +
          '<div>' +
            '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:4px;color:var(--ink);">알림/실천 시간</label>' +
            '<input type="time" id="inDetailRtTime" value="' + (target.time || '08:00') + '" style="width:100%;padding:8px 10px;border-radius:10px;border:1px solid var(--rule);background:var(--surface-2);color:var(--ink);box-sizing:border-box;">' +
          '</div>' +
          '<div>' +
            '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:4px;color:var(--ink);">알림 수신</label>' +
            '<label style="display:flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid var(--rule);border-radius:10px;background:var(--surface-2);cursor:pointer;font-size:.8125rem;color:var(--ink);">' +
              '<input type="checkbox" id="inDetailRtNotify" ' + (target.notify !== false ? 'checked' : '') + '> <span>🔔 푸시 알림</span>' +
            '</label>' +
          '</div>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
          '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:6px;color:var(--ink);">반복 요일</label>' +
          '<div style="display:flex;gap:4px;" id="detailRoutineDaysPicker">' +
            ['월','화','수','목','금','토','일'].map(function(d, i){
              var isDayActive = selectedDays.indexOf(i+1) !== -1;
              return '<button type="button" class="btn btn-sm btn-ghost r-detail-day-btn" data-day="' + (i+1) + '" style="flex:1;padding:6px 0;font-size:.8125rem;font-weight:700;border:1px solid ' + (isDayActive ? 'var(--brand)' : 'var(--rule)') + ';background:' + (isDayActive ? 'var(--brand)' : 'transparent') + ';color:' + (isDayActive ? '#fff' : 'var(--ink)') + ';border-radius:8px;">' + d + '</button>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div style="margin-bottom:16px;">' +
          '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:4px;color:var(--ink);">실천 팁 & 상세 메모 (선택)</label>' +
          '<textarea id="inDetailRtMemo" placeholder="예: 미온수 500ml 준비, 가벼운 목/허리 스트레칭 5분" style="width:100%;box-sizing:border-box;min-height:65px;padding:8px 12px;border-radius:10px;border:1px solid var(--rule);background:var(--surface-2);color:var(--ink);resize:vertical;">' + L.escapeHtml(target.memo || '') + '</textarea>' +
        '</div>' +
        '<div class="modal-actions" style="display:flex;gap:8px;align-items:center;">' +
          '<button class="btn btn-ghost" id="btnDeleteDetailRoutine" type="button" style="color:#ef4444;font-weight:700;">삭제</button>' +
          '<div style="flex:1;"></div>' +
          '<button class="btn btn-ghost" id="btnCancelDetailRoutine" type="button">취소</button>' +
          '<button class="btn btn-primary" id="btnSaveDetailRoutine" type="button" style="font-weight:700;padding:8px 18px;">저장하기</button>' +
        '</div>' +
      '</div>';

    L.openModal(modalHtml, function(sheet){
      sheet.querySelector('#btnCancelDetailRoutine').onclick = L.closeModal;

      // 카테고리 칩 선택 이벤트
      sheet.querySelectorAll('.routine-cat-chip').forEach(function(chip){
        chip.onclick = function(){
          currentCat = chip.getAttribute('data-cat');
          sheet.querySelectorAll('.routine-cat-chip').forEach(function(c){
            var isThis = (c.getAttribute('data-cat') === currentCat);
            c.style.background = isThis ? 'var(--brand)' : 'var(--surface-2)';
            c.style.color = isThis ? '#fff' : 'var(--ink)';
            c.style.borderColor = isThis ? 'var(--brand)' : 'var(--rule)';
          });
        };
      });

      sheet.querySelectorAll('.r-detail-day-btn').forEach(function(btn){
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

      sheet.querySelector('#btnDeleteDetailRoutine').onclick = async function(){
        if(!confirm('이 루틴을 삭제하시겠습니까?')) return;
        L.state.profile.settings.routines = routines.filter(function(r){ return r.id !== routineId; });
        await L.saveProfile();
        L.closeModal();
        L.toast('루틴이 삭제되었습니다.');
        L.renderRoutineGoalsScreen();
        if(typeof L.renderAll === 'function') L.renderAll();
      };

      sheet.querySelector('#btnSaveDetailRoutine').onclick = async function(){
        var newTitle = sheet.querySelector('#inDetailRtTitle').value.trim();
        if(!newTitle){ L.toast('루틴 이름을 입력해주세요.'); return; }
        var newLinkedGoalId = sheet.querySelector('#inDetailRtLinkedGoalId').value || null;
        var newTime = sheet.querySelector('#inDetailRtTime').value;
        var newNotify = sheet.querySelector('#inDetailRtNotify').checked;
        var newMemo = sheet.querySelector('#inDetailRtMemo').value.trim();

        target.title = newTitle;
        target.category = currentCat;
        target.linkedGoalId = newLinkedGoalId;
        target.time = newTime;
        target.days = selectedDays;
        target.notify = newNotify;
        target.memo = newMemo;

        await L.saveProfile();
        L.closeModal();
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
        L.toast('루틴 설정이 저장되었습니다! ✨');
        L.renderRoutineGoalsScreen();
        if(typeof L.renderAll === 'function') L.renderAll();
      };
    });
  }

  K.openRoutineDetailModal = openRoutineDetailModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
