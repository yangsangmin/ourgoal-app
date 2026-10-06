/**
 * OurGoal Shift Routines (목표 — 교대근무 루틴·주기)
 *
 * 교대근무자 가변형 루틴 프리셋과 사용자 설정 모달. 상태·window 노출은 원래 자리.
 * #TASK-ES-568(잔여 책임 분열 — 교대근무 루틴·성장차트·홈 퀘스트): index.html 인라인 IIFE 의 구간(이전 전 5724~5773 · 5774~5840 · 5841~5964 · 5965~6039줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 5724~5773줄(#TASK-ES-568 생성기 표지) ---- */
  var SHIFT_WORK_PRESETS = {
    day: {
      key: 'day',
      label: '☀️ 주간조',
      hours: '09:00~18:00',
      badge: '주간 활력 케어',
      healthTip: '기상 직후 미온수 500ml와 점심 식후 비타민C 복용으로 코르티솔 분비와 대사 리듬을 최적화하세요.',
      routines: [
        { id: 'rt_shift_day_wake', title: '🌅 모닝 활력: 기상 후 미온수 500ml & 스트레칭', time: '06:30', days: [1,2,3,4,5,6,7], notify: true, memo: '코르티솔 정상 분비 및 생체시계 활성화', completedDates: [] },
        { id: 'rt_shift_day_vit', title: '💊 식후 영양: 점심 식후 비타민C & 오메가3 복용', time: '12:30', days: [1,2,3,4,5,6,7], notify: true, memo: '피로 개선 및 면역력 유지', completedDates: [] },
        { id: 'rt_shift_day_sleep', title: '🌙 나이트 이완: 취침 30분 전 5분 침대 스트레칭 & 조명 낮추기', time: '22:30', days: [1,2,3,4,5,6,7], notify: true, memo: '부교감 신경 활성화 및 숙면 유도', completedDates: [] }
      ]
    },
    night: {
      key: 'night',
      label: '🌙 야간조',
      hours: '21:00~08:00',
      badge: '서카디언 케어',
      healthTip: '14시 기상 활력 루틴과 19시 식후 비타민C 복용, 아침 07시 퇴근 후 완전 암막 커튼으로 멜라토닌 분비를 유도하세요.',
      routines: [
        { id: 'rt_shift_night_wake', title: '⚡ 야간 기상 활력: 14시 기상 후 가벼운 워밍업 & 찬물 세안', time: '14:00', days: [1,2,3,4,5,6,7], notify: true, memo: '야간 근무 전 생체리듬 부스팅', completedDates: [] },
        { id: 'rt_shift_night_vit', title: '💊 야간 식후 영양: 19시 저녁 식후 비타민C 복용', time: '19:00', days: [1,2,3,4,5,6,7], notify: true, memo: '야간 활성산소 억제 및 피로 회복 가이드 준수', completedDates: [] },
        { id: 'rt_shift_night_sleep', title: '🛌 퇴근 후 숙면: 07시 퇴근 후 5분 침대 스트레칭 & 암막 세팅', time: '07:00', days: [1,2,3,4,5,6,7], notify: true, memo: '멜라토닌 분비 촉진을 위한 완전 암막 환경 조성', completedDates: [] }
      ]
    },
    duty: {
      key: 'duty',
      label: '🔄 당직/비번',
      hours: '24H 대기/회복',
      badge: '생체 회복 케어',
      healthTip: '불규칙 교대근무 피로 회복: 11시 수분·비타민B/C 충전과 16시 가벼운 산책으로 림프 순환을 돕고 23시 깊은 수면을 취하세요.',
      routines: [
        { id: 'rt_shift_duty_detox', title: '💧 피로 디톡스: 수분 섭취 및 피로회복 비타민B/C 섭취', time: '11:00', days: [1,2,3,4,5,6,7], notify: true, memo: '불규칙 교대근무 피로 누적 완화', completedDates: [] },
        { id: 'rt_shift_duty_walk', title: '🚶 회복 산책: 16시 가벼운 20분 걷기 스트레칭', time: '16:00', days: [1,2,3,4,5,6,7], notify: true, memo: '경직된 근육 이완 및 림프 순환', completedDates: [] },
        { id: 'rt_shift_duty_sleep', title: '🌙 온전한 회복: 23시 숙면 암막 환경 & 미온수 샤워', time: '23:00', days: [1,2,3,4,5,6,7], notify: true, memo: '수면 위상 동기화 및 뇌 피로 회복', completedDates: [] }
      ]
    },
    off: {
      key: 'off',
      label: '🌿 휴무',
      hours: '리셋/리프레시',
      badge: '리셋 & 충전',
      healthTip: '오전 09시 자연광을 쬐어 서카디언 리듬을 리셋하고, 오후 14시 취미 몰입으로 번아웃을 예방하세요.',
      routines: [
        { id: 'rt_shift_off_sun', title: '☀️ 햇살 충전: 09시 자연광 15분 산책 & 비타민D 합성', time: '09:00', days: [1,2,3,4,5,6,7], notify: true, memo: '생체시계 동기화 및 기분 전환', completedDates: [] },
        { id: 'rt_shift_off_heal', title: '🌿 나만의 힐링: 14시 좋아하는 취미/휴식 1시간 몰입', time: '14:00', days: [1,2,3,4,5,6,7], notify: true, memo: '번아웃 방지 및 정서적 회복', completedDates: [] },
        { id: 'rt_shift_off_sleep', title: '🌙 규칙 수면: 23시 스마트폰 멀리 두고 규칙 수면 유지', time: '23:00', days: [1,2,3,4,5,6,7], notify: true, memo: '다음 교대 주기를 위한 수면 리듬 수호', completedDates: [] }
      ]
    }
  };
  /* ---- 이전 전 index.html 5774~5840줄(#TASK-ES-568 생성기 표지) ---- */

  async function applyShiftWorkRoutines(mode, isReplace){
    if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
    var preset = SHIFT_WORK_PRESETS[mode] || SHIFT_WORK_PRESETS.day;
    if(!L.state.profile.settings.routines) L.state.profile.settings.routines = [];
    var currentRoutines = L.state.profile.settings.routines;

    // 전체 교대근무 프리셋 루틴 타이틀 수집 (이전 교대 루틴 스마트 클린 교체용)
    var allShiftTitles = [];
    Object.keys(SHIFT_WORK_PRESETS).forEach(function(k){
      SHIFT_WORK_PRESETS[k].routines.forEach(function(r){
        if(allShiftTitles.indexOf(r.title) === -1) allShiftTitles.push(r.title);
      });
    });

    if(isReplace){
      // 기존에 등록되었던 이전 교대 루틴만 정확히 선별하여 제거 (사용자 개인 루틴은 무손실 보존)
      L.state.profile.settings.routines = currentRoutines.filter(function(r){
        var isShift = r.isShiftRoutine === true ||
                      (r.id && r.id.indexOf('rt_shift_') !== -1) ||
                      allShiftTitles.indexOf(r.title) !== -1;
        return !isShift;
      });
      currentRoutines = L.state.profile.settings.routines;
    }

    // 근무 설정 업데이트
    if(!L.state.profile.settings.shiftSettings){
      L.state.profile.settings.shiftSettings = {
        currentShift: mode,
        cycle: ['day', 'night', 'duty', 'off'],
        cycleStartDate: L.dateKey(new Date()),
        autoCycleEnabled: false
      };
    } else {
      L.state.profile.settings.shiftSettings.currentShift = mode;
    }
    L.state.profile.shiftSettings = L.state.profile.settings.shiftSettings;

    var addedCount = 0;
    preset.routines.forEach(function(rTpl){
      var exists = currentRoutines.some(function(r){ return r.title === rTpl.title; });
      if(!exists){
        currentRoutines.push({
          id: 'rt_shift_' + mode + '_' + Date.now() + '_' + Math.random().toString(36).substring(2,7),
          title: rTpl.title,
          time: rTpl.time,
          days: rTpl.days.slice(),
          notify: rTpl.notify,
          memo: rTpl.memo,
          isShiftRoutine: true,
          completedDates: []
        });
        addedCount++;
      }
    });

    await L.saveProfile();
    if(isReplace){
      L.toast('⚡ ' + preset.label + ' 맞춤 루틴 3종으로 1초 교체 적용되었습니다! ✨');
    } else if(addedCount > 0){
      L.toast(preset.label + ' 맞춤 루틴 ' + addedCount + '종이 내 루틴에 연동되었습니다! ✨');
    } else {
      L.toast('이미 ' + preset.label + ' 맞춤 루틴이 등록되어 있습니다. 👍');
    }
    L.renderRoutineGoalsScreen();
  }
  /* ---- 이전 전 index.html 5841~5964줄(#TASK-ES-568 생성기 표지) ---- */

  function openShiftWorkCustomModal(initialMode){
    if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
    var shiftSettings = (L.state.profile && L.state.profile.settings && L.state.profile.settings.shiftSettings) || {
      currentShift: 'day',
      cycle: ['day', 'night', 'duty', 'off'],
      cycleStartDate: L.dateKey(new Date()),
      autoCycleEnabled: false
    };
    var selectedMode = initialMode || shiftSettings.currentShift || 'day';

    function renderModalContent(container){
      var preset = SHIFT_WORK_PRESETS[selectedMode] || SHIFT_WORK_PRESETS.day;
      var modes = [
        { key: 'day', label: '☀️ 주간조', time: '09:00~18:00' },
        { key: 'night', label: '🌙 야간조', time: '21:00~08:00' },
        { key: 'duty', label: '🔄 당직·비번', time: '24H 순환' },
        { key: 'off', label: '🌿 휴무', time: '리셋/충전' }
      ];

      var modalInnerHtml = '' +
        '<div class="modal-head" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<span style="font-size:1.2rem;">🔄</span>' +
            '<h3 style="margin:0;font-size:1.05rem;font-weight:800;color:var(--ink);">교대근무 맞춤 루틴 원클릭 세팅</h3>' +
          '</div>' +
          '<button class="btn btn-ghost btn-xs" id="btnCloseShiftCustomModal" type="button" style="font-size:1.1rem;padding:2px 8px;line-height:1;">✕</button>' +
        '</div>' +
        '<p class="faint" style="font-size:.8125rem;line-height:1.45;margin-bottom:12px;">' +
          '2교대/3교대 근무 패턴에 맞춰 서카디언 생체리듬 3대 루틴을 1초 만에 최적화하고 교체합니다.' +
        '</p>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px;">' +
          modes.map(function(m){
            var isSel = (m.key === selectedMode);
            return '<button type="button" class="btn btn-ghost btn-shift-select" data-mode="' + m.key + '" style="min-height:50px;padding:6px 2px;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:' + (isSel ? '2px solid var(--brand)' : '1px solid var(--rule)') + ';background:' + (isSel ? 'rgba(99,102,241,0.12)' : 'var(--card2)') + ';color:' + (isSel ? 'var(--brand)' : 'var(--ink)') + ';font-weight:700;transition:all 0.15s;">' +
              '<span style="font-size:.8125rem;">' + m.label + '</span>' +
              '<span class="faint" style="font-size:.65rem;margin-top:2px;">' + m.time + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
        '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:12px;margin-bottom:14px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<div style="font-size:.875rem;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
              '<span>' + preset.label + ' 케어</span>' +
              '<span class="badge" style="font-size:.68rem;padding:2px 6px;border-radius:6px;background:rgba(99,102,241,0.12);color:var(--brand);font-weight:700;">' + preset.badge + '</span>' +
            '</div>' +
            '<span class="faint" style="font-size:.75rem;">' + preset.hours + '</span>' +
          '</div>' +
          '<div style="background:var(--card);border:1px solid var(--rule);border-radius:8px;padding:8px 10px;font-size:.78125rem;color:var(--ink-soft);line-height:1.45;margin-bottom:10px;">' +
            '💡 ' + preset.healthTip +
          '</div>' +
          '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:6px;">추천 서카디언 루틴 (3종)</div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;">' +
            preset.routines.map(function(r){
              return '<div style="background:var(--card);border:1px solid var(--rule);border-radius:8px;padding:8px 10px;display:flex;align-items:center;gap:8px;">' +
                '<span style="font-size:.75rem;font-weight:700;color:var(--brand);background:rgba(99,102,241,0.1);padding:2px 6px;border-radius:6px;flex-shrink:0;">⏰ ' + r.time + '</span>' +
                '<div style="flex:1;min-width:0;">' +
                  '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + L.escapeHtml(r.title) + '</div>' +
                  '<div class="faint" style="font-size:.7rem;margin-top:1px;">💬 ' + L.escapeHtml(r.memo) + '</div>' +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px;">' +
          '<button class="btn btn-primary" id="btnShiftModalReplace" type="button" style="width:100%;min-height:44px;font-size:.875rem;font-weight:700;border-radius:10px;box-shadow:0 2px 8px rgba(99,102,241,0.25);">' +
            '⚡ 오늘 근무 루틴으로 1초 교체 적용' +
          '</button>' +
          '<div style="display:flex;gap:6px;">' +
            '<button class="btn btn-ghost btn-sm" id="btnShiftModalAppend" type="button" style="flex:1;min-height:38px;font-size:.8125rem;font-weight:600;border-radius:10px;border:1px solid var(--rule);">' +
              '➕ 기존 루틴에 추가' +
            '</button>' +
            '<button class="btn btn-ghost btn-sm" id="btnShiftModalCycleLink" type="button" style="flex:1;min-height:38px;font-size:.8125rem;font-weight:600;border-radius:10px;border:1px solid var(--rule);">' +
              '⚙️ 주기 자동 순환' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="faint" style="font-size:.71875rem;text-align:center;line-height:1.4;">' +
          '* [1초 교체 적용] 시 이전 교대 루틴을 깔끔하게 대체하여 목록이 과도하게 쌓이지 않습니다.' +
        '</div>';

      container.innerHTML = modalInnerHtml;

      var btnClose = container.querySelector('#btnCloseShiftCustomModal');
      if(btnClose) btnClose.onclick = function(){ L.closeModal(); };

      container.querySelectorAll('.btn-shift-select').forEach(function(b){
        b.onclick = function(){
          if(typeof L.triggerHaptic === 'function') L.triggerHaptic(10);
          selectedMode = b.getAttribute('data-mode');
          renderModalContent(container);
        };
      });

      var btnReplace = container.querySelector('#btnShiftModalReplace');
      if(btnReplace){
        btnReplace.onclick = async function(){
          await applyShiftWorkRoutines(selectedMode, true);
          L.closeModal();
        };
      }

      var btnAppend = container.querySelector('#btnShiftModalAppend');
      if(btnAppend){
        btnAppend.onclick = async function(){
          await applyShiftWorkRoutines(selectedMode, false);
          L.closeModal();
        };
      }

      var btnCycleLink = container.querySelector('#btnShiftModalCycleLink');
      if(btnCycleLink){
        btnCycleLink.onclick = function(){
          L.closeModal();
          setTimeout(function(){ openShiftCycleModal(); }, 100);
        };
      }
    }

    L.openModal('<div id="shiftWorkCustomModalContent"></div>', function(modalEl){
      var contentEl = modalEl.querySelector('#shiftWorkCustomModalContent');
      if(contentEl) renderModalContent(contentEl);
    });
  }
  /* ---- 이전 전 index.html 5965~6039줄(#TASK-ES-568 생성기 표지) ---- */

  function openShiftCycleModal(){
    if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
    var shiftSettings = (L.state.profile && L.state.profile.settings && L.state.profile.settings.shiftSettings) || {
      currentShift: 'day',
      cycle: ['day', 'night', 'duty', 'off'],
      cycleStartDate: L.dateKey(new Date()),
      autoCycleEnabled: false
    };
    var todayStr = L.dateKey(new Date());

    var modalHtml = '' +
      '<div class="modal-head" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<span style="font-size:1.2rem;">🔄</span>' +
          '<h3 style="margin:0;font-size:1.1rem;font-weight:800;color:var(--ink);">교대근무 주기 순환(Auto Cycle) 설정</h3>' +
        '</div>' +
        '<button class="btn btn-ghost btn-xs" id="btnCloseShiftCycleModal" type="button" style="font-size:1.1rem;padding:2px 8px;line-height:1;">✕</button>' +
      '</div>' +
      '<p class="faint" style="font-size:.8125rem;line-height:1.45;margin-bottom:14px;">' +
        '주-야-비-휴 4일 주기 또는 맞춤 교대 패턴을 등록하면 매일 날짜에 맞춰 오늘 근무 형태가 자동 계산됩니다.' +
      '</p>' +
      '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:12px 14px;margin-bottom:14px;">' +
        '<label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-weight:700;font-size:.875rem;color:var(--ink);">' +
          '<span>자동 교대 순환 활성화</span>' +
          '<input type="checkbox" id="chkAutoCycleEnabled"' + (shiftSettings.autoCycleEnabled ? ' checked' : '') + ' style="width:18px;height:18px;accent-color:var(--brand);cursor:pointer;">' +
        '</label>' +
      '</div>' +
      '<div style="margin-bottom:14px;">' +
        '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:4px;color:var(--ink);">주기 시작 기준일</label>' +
        '<input type="date" id="inCycleStartDate" value="' + (shiftSettings.cycleStartDate || todayStr) + '" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--rule);background:var(--surface-2);color:var(--ink);font-weight:600;box-sizing:border-box;">' +
      '</div>' +
      '<div style="margin-bottom:16px;">' +
        '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:6px;color:var(--ink);">순환 교대 패턴 (4일 주기)</label>' +
        '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:10px;padding:10px 12px;font-size:.8125rem;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
          '<span style="padding:4px 8px;background:var(--card);border:1px solid var(--rule);border-radius:6px;font-weight:700;">1일: ☀️ 주간</span>' +
          '<span>➔</span>' +
          '<span style="padding:4px 8px;background:var(--card);border:1px solid var(--rule);border-radius:6px;font-weight:700;">2일: 🌙 야간</span>' +
          '<span>➔</span>' +
          '<span style="padding:4px 8px;background:var(--card);border:1px solid var(--rule);border-radius:6px;font-weight:700;">3일: 🔄 비번</span>' +
          '<span>➔</span>' +
          '<span style="padding:4px 8px;background:var(--card);border:1px solid var(--rule);border-radius:6px;font-weight:700;">4일: 🌿 휴무</span>' +
        '</div>' +
        '<div class="faint" style="font-size:.75rem;margin-top:4px;">* 기준일로부터 경과 일수에 따라 당일 모드가 자동 지정됩니다.</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<button class="btn btn-ghost btn-sm" id="btnCancelShiftCycle" type="button" style="flex:1;min-height:44px;font-weight:700;border-radius:10px;border:1px solid var(--rule);">취소</button>' +
        '<button class="btn btn-primary btn-sm" id="btnSaveShiftCycle" type="button" style="flex:2;min-height:44px;font-weight:700;border-radius:10px;">저장 및 적용</button>' +
      '</div>';

    L.openModal(modalHtml, function(modalEl){
      var btnClose = modalEl.querySelector('#btnCloseShiftCycleModal');
      if(btnClose) btnClose.onclick = function(){ L.closeModal(); };
      var btnCancel = modalEl.querySelector('#btnCancelShiftCycle');
      if(btnCancel) btnCancel.onclick = function(){ L.closeModal(); };

      var btnSave = modalEl.querySelector('#btnSaveShiftCycle');
      if(btnSave){
        btnSave.onclick = async function(){
          if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
          var chk = modalEl.querySelector('#chkAutoCycleEnabled');
          var inStart = modalEl.querySelector('#inCycleStartDate');
          shiftSettings.autoCycleEnabled = !!(chk && chk.checked);
          shiftSettings.cycleStartDate = (inStart && inStart.value) || todayStr;
          shiftSettings.cycle = ['day', 'night', 'duty', 'off'];
          L.state.profile.settings.shiftSettings = shiftSettings;
          L.state.profile.shiftSettings = shiftSettings;
          await L.saveProfile();
          L.toast('교대근무 순환 주기가 설정되었습니다. 🔄');
          L.closeModal();
          L.renderRoutineGoalsScreen();
        };
      }
    });
  }

  K.SHIFT_WORK_PRESETS = SHIFT_WORK_PRESETS;
  K.applyShiftWorkRoutines = applyShiftWorkRoutines;
  K.openShiftWorkCustomModal = openShiftWorkCustomModal;
  K.openShiftCycleModal = openShiftCycleModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
