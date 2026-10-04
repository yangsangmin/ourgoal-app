/**
 * OurGoal Avatar Cell: 생성 기준 기간·퀵 칩 (#TASK-ES-390 · 아바타·EXP 쪼개기 PR-4)
 *
 * 이전 전 openAvatarModal(js/avatar-system.js 410~473줄)의 이 섹션을 동작 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 다른 섹션·조립자의 모달 지역 이름은 MS.<이름>(모달 상태 객체, index.js 가 getter 로 만든다), avatar-system.js·다른 부품 이름은 AV.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalAvatar.<이름> 으로 부른다(avatar-system.js 가 같은 이름으로 가져와 api 에 담는다).
 * 브라우저: index.html 이 avatar-system.js 보다 먼저 읽어 OurgoalAvatarParts 에 담는다. Node: avatar-system.js 가 require 해서 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory;
  } else {
    factory(root.OurgoalAvatarParts = root.OurgoalAvatarParts || {});
  }
}(typeof self !== 'undefined' ? self : this, function (AV) {
  'use strict';

  /* [#TASK-ES-390] 섹션: 생성 기준 기간·퀵 칩 — openAvatarModal(js/avatar/modal/index.js)이 원래 자리에서 부른다(이전 전 줄 410~473). */
  function bindAvatarModalPeriod(MS) {
      // [TASK-ES-122, TASK-ES-269] 아바타 생성 기준 기간 정하기 & 퀵 프리셋 칩 바인딩
      function updatePeriodSummaryLabel() {
        if (!MS.periodSummarySpan) return;
        MS.periodSummarySpan.textContent = '· ' + MS.toDateInputValue(MS.periodStart).slice(5) + ' ~ ' + MS.toDateInputValue(MS.periodEnd).slice(5);
      }
      updatePeriodSummaryLabel();

      if (MS.btnSetPeriod && MS.periodInputsBox) {
        MS.btnSetPeriod.onclick = function () {
          MS.periodInputsBox.style.display = (MS.periodInputsBox.style.display === 'none' || !MS.periodInputsBox.style.display) ? 'block' : 'none';
        };
      }

      function handlePeriodInputChange() {
        if (!MS.periodStartInput || !MS.periodEndInput) return;
        var s = new Date(MS.periodStartInput.value + 'T00:00:00');
        var e = new Date(MS.periodEndInput.value + 'T23:59:59');
        if (isNaN(s.getTime()) || isNaN(e.getTime()) || e.getTime() < s.getTime()) {
          if (MS.periodErrorText) MS.periodErrorText.style.display = 'block';
          return;
        }
        if (MS.periodErrorText) MS.periodErrorText.style.display = 'none';
        MS.periodStart = s;
        MS.periodEnd = e;
        updatePeriodSummaryLabel();
      }
      if (MS.periodStartInput) MS.periodStartInput.onchange = handlePeriodInputChange;
      if (MS.periodEndInput) MS.periodEndInput.onchange = handlePeriodInputChange;

      var periodChips = MS.sheet.querySelectorAll('.avatar-period-chip');
      periodChips.forEach(function (chip) {
        chip.onclick = function () {
          periodChips.forEach(function (c) {
            c.classList.remove('active');
            c.style.border = '1px solid var(--border-soft)';
            c.style.background = 'var(--surface-1,#fff)';
            c.style.color = 'var(--ink)';
            c.style.fontWeight = 'normal';
          });
          chip.classList.add('active');
          chip.style.border = '1px solid var(--emerald)';
          chip.style.background = 'var(--emerald-surface,#ECFDF5)';
          chip.style.color = 'var(--emerald)';
          chip.style.fontWeight = '800';

          var days = chip.getAttribute('data-days');
          var now = new Date();
          var endD = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          var startD;
          if (days === '7') {
            startD = new Date(endD.getTime() - 6 * 24 * 60 * 60 * 1000);
          } else if (days === '30') {
            startD = new Date(endD.getTime() - 29 * 24 * 60 * 60 * 1000);
          } else if (days === '90') {
            startD = new Date(endD.getTime() - 89 * 24 * 60 * 60 * 1000);
          } else {
            // 전체 (1년)
            startD = new Date(endD.getTime() - 365 * 24 * 60 * 60 * 1000);
          }
          if (MS.periodStartInput) MS.periodStartInput.value = MS.toDateInputValue(startD);
          if (MS.periodEndInput) MS.periodEndInput.value = MS.toDateInputValue(endD);
          handlePeriodInputChange();
        };
      });
  }

  AV.bindAvatarModalPeriod = bindAvatarModalPeriod;
}));
