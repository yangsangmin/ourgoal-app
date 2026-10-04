/**
 * OurGoal Avatar Cell: 최종 적용하기 (#TASK-ES-390 · 아바타·EXP 쪼개기 PR-4)
 *
 * 이전 전 openAvatarModal(js/avatar-system.js 985~1048줄)의 이 섹션을 동작 그대로 옮겼다.
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

  /* [#TASK-ES-390] 섹션: 최종 적용하기 — openAvatarModal(js/avatar/modal/index.js)이 원래 자리에서 부른다(이전 전 줄 985~1048). */
  function bindAvatarModalSave(MS) {
      // 4) 최종 '아바타 적용하기' 버튼 — 횟수 차감 없이 언제든 저장 & DOM 즉시 반영
      if (MS.btnSave) {
        MS.btnSave.onclick = function () {
          if (MS.selectedType === 'custom' && !MS.newCustomUrl) {
            MS.toast('먼저 사진으로 3등신 아바타를 제작해주세요.');
            return;
          }

          MS.settings.avatarType = MS.selectedType;
          if (MS.selectedType === 'custom') {
            MS.settings.customAvatarUrl = MS.newCustomUrl;
            MS.settings.avatarThemeId = MS.chosenTheme.id;
            MS.profile.avatarUrl = MS.newCustomUrl;
            AV.addSavedAvatar(MS.profile, {
              id: 'ava_' + Date.now(),
              url: MS.newCustomUrl,
              themeId: MS.chosenTheme.id,
              themeName: MS.chosenTheme.name,
              themeIcon: MS.chosenTheme.icon,
              mbti: MS.currentPersona ? MS.currentPersona.mbti : null,
              motto: MS.currentPersona ? MS.currentPersona.motto : null,
              periodStart: MS.toDateInputValue(MS.periodStart),
              periodEnd: MS.toDateInputValue(MS.periodEnd),
              createdAt: new Date().toISOString()
            });
          }

          if (MS.deps.state && MS.deps.state.profile) {
            MS.deps.state.profile.settings = MS.deps.state.profile.settings || {};
            MS.deps.state.profile.settings.avatarType = MS.selectedType;
            MS.deps.state.profile.settings.avatarChangedOnce = true;
            if (MS.selectedType === 'custom') {
              MS.deps.state.profile.settings.customAvatarUrl = MS.newCustomUrl;
              MS.deps.state.profile.settings.avatarThemeId = MS.chosenTheme.id;
              MS.deps.state.profile.avatarUrl = MS.newCustomUrl;
              MS.deps.state.profile.settings.savedAvatars = MS.profile.settings.savedAvatars;
            }
          }

          MS.saveProfile().then(function () {
            MS.toast('아바타가 성공적으로 적용되었습니다! 🤖✨');
            MS.closeModal();
            if (MS.onAvatarChanged) MS.onAvatarChanged();

            // DOM 즉각 강제 갱신 (1번 문제 100% 영구 해결)
            try {
              var levelBadgeRow = document.getElementById('levelBadgeRow');
              if (levelBadgeRow) {
                var avatarBox = levelBadgeRow.querySelector('.custom-avatar-frame, .robot-avatar-frame, .avatar-placeholder');
                if (avatarBox && avatarBox.parentNode) {
                  var newAvatarMarkup = AV.renderAvatarHtml(MS.curLevel, MS.profile, { size: 36 });
                  var tempDiv = document.createElement('div');
                  tempDiv.innerHTML = newAvatarMarkup;
                  if (tempDiv.firstElementChild) {
                    avatarBox.parentNode.replaceChild(tempDiv.firstElementChild, avatarBox);
                  }
                }
              }
            } catch (domErr) {
              console.warn('DOM instant update error:', domErr);
            }
          });
        };
      }
  }

  AV.bindAvatarModalSave = bindAvatarModalSave;
}));
