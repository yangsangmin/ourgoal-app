/**
 * OurGoal Avatar Cell: 320종 도감 토글·검색·탭 (#TASK-ES-390 · 아바타·EXP 쪼개기 PR-4)
 *
 * 이전 전 openAvatarModal(js/avatar-system.js 898~983줄)의 이 섹션을 동작 그대로 옮겼다.
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

  /* [#TASK-ES-390] 섹션: 320종 도감 토글·검색·탭 — openAvatarModal(js/avatar/modal/index.js)이 원래 자리에서 부른다(이전 전 줄 898~983). */
  function bindAvatarModalPersona(MS) {
      // [TASK-ES-053] 헤어스타일/표정/다른바디 변경 버튼 및 핸들러 상민님 지시로 완전 삭제

      // [TASK-ES-127] 320종 MBTI 페르소나 도감 토글, 검색 및 탭 필터링 배선
      var btnToggle320 = MS.sheet.querySelector('#btnToggle320PersonaCatalog');
      var catalogSlot = MS.sheet.querySelector('#persona320CatalogSlot');
      var toggle320Arrow = MS.sheet.querySelector('#toggle320Arrow');
      var inputSearch320 = MS.sheet.querySelector('#inputSearchPersona320');
      var groupTabs320 = MS.sheet.querySelectorAll('.btn-group-tab');
      var catalogItemsContainer = MS.sheet.querySelector('#persona320ItemsContainer');
      var curGroup320 = 'ALL';

      function renderPersona320Cards() {
        if (!catalogItemsContainer) return;
        var q = inputSearch320 ? inputSearch320.value.trim().toLowerCase() : '';
        var themes = (curGroup320 === 'ALL') ? AV.getAllThemes() : AV.getThemesByGroup(curGroup320);
        if (q) {
          themes = themes.filter(function (t) {
            return (t.name && t.name.toLowerCase().indexOf(q) !== -1) ||
                   (t.mbti && t.mbti.toLowerCase().indexOf(q) !== -1) ||
                   (t.kw && t.kw.toLowerCase().indexOf(q) !== -1) ||
                   (t.cat && t.cat.toLowerCase().indexOf(q) !== -1) ||
                   (t.desc && t.desc.toLowerCase().indexOf(q) !== -1);
          });
        }
        catalogItemsContainer.innerHTML = themes.slice(0, 80).map(function (t) {
          var isCur = MS.chosenTheme && MS.chosenTheme.id === t.id;
          return '<div class="persona-theme-card" data-tid="' + t.id + '" style="cursor:pointer;padding:8px 10px;border-radius:10px;border:1.5px solid ' + (isCur ? 'var(--brand,#059669)' : 'var(--border-soft,#E5E7EB)') + ';background:' + (isCur ? 'var(--emerald-surface,#ECFDF5)' : 'var(--surface-1,#fff)') + ';display:flex;flex-direction:column;gap:3px;transition:all 0.15s ease;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;">' +
              '<span style="font-size:1.15rem;">' + t.icon + '</span>' +
              '<span style="font-size:10px;font-weight:800;color:' + (t.color || 'var(--emerald)') + ';background:' + (t.subColor || '#EEF2FF') + ';padding:1px 5px;border-radius:4px;">' + t.mbti + '</span>' +
            '</div>' +
            '<div style="font-size:11px;font-weight:800;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + t.name + '</div>' +
            '<div style="font-size:9.5px;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + t.cat + ' · ' + t.gear + '</div>' +
          '</div>';
        }).join('');

        catalogItemsContainer.querySelectorAll('.persona-theme-card').forEach(function (card) {
          card.onclick = function () {
            var tid = parseInt(card.getAttribute('data-tid'), 10);
            var selected = AV.getThemeById(tid);
            if (selected) {
              MS.chosenTheme = selected;
              MS.currentPersona = { mbti: selected.mbti, motto: selected.desc || selected.name };
              MS.updateCustomAvatarView();
              renderPersona320Cards();
              MS.toast('[' + selected.mbti + ' ' + selected.name + '] 테마가 선택되었습니다! 🧬');
            }
          };
        });
      }

      if (btnToggle320 && catalogSlot) {
        btnToggle320.onclick = function () {
          var isHidden = catalogSlot.style.display === 'none' || !catalogSlot.style.display;
          catalogSlot.style.display = isHidden ? 'block' : 'none';
          if (toggle320Arrow) {
            toggle320Arrow.textContent = isHidden ? '접기 ▲' : '펼치기 ▼';
          }
          if (isHidden && (!catalogItemsContainer.children || catalogItemsContainer.children.length === 0)) {
            renderPersona320Cards();
          }
        };
      }

      if (groupTabs320 && groupTabs320.length > 0) {
        groupTabs320.forEach(function (tab) {
          tab.onclick = function () {
            groupTabs320.forEach(function (t) {
              t.classList.remove('active');
              t.style.background = 'var(--surface-1,#fff)';
              t.style.color = 'var(--ink-soft)';
            });
            tab.classList.add('active');
            tab.style.background = 'var(--emerald)';
            tab.style.color = '#fff';
            curGroup320 = tab.getAttribute('data-group') || 'ALL';
            renderPersona320Cards();
          };
        });
      }

      if (inputSearch320) {
        inputSearch320.oninput = function () {
          renderPersona320Cards();
        };
      }
  }

  AV.bindAvatarModalPersona = bindAvatarModalPersona;
}));
