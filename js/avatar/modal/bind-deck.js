/**
 * OurGoal Avatar Cell: 탭 토글·남은 횟수·보기 갱신·보관함 슬롯·성장 성향·제작 완료 인입 (#TASK-ES-390 · 아바타·EXP 쪼개기 PR-4)
 *
 * 이전 전 openAvatarModal(js/avatar-system.js 475~698줄)의 이 섹션을 동작 그대로 옮겼다.
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

  /* [#TASK-ES-390] 섹션: 탭 토글·남은 횟수·보기 갱신·보관함 슬롯·성장 성향·제작 완료 인입 — openAvatarModal(js/avatar/modal/index.js)이 원래 자리에서 부른다(이전 전 줄 475~698). */
  function bindAvatarModalDeck(MS) {
    MS.onAvatarCraftCompleted = onAvatarCraftCompleted; // 다른 섹션이 부르는 이 섹션의 함수(끌어올림과 같은 시점)
    MS.updateCustomAvatarView = updateCustomAvatarView; // 다른 섹션이 부르는 이 섹션의 함수(끌어올림과 같은 시점)
    MS.updateRemainingUI = updateRemainingUI; // 다른 섹션이 부르는 이 섹션의 함수(끌어올림과 같은 시점)
      // 탭 토글
      if (MS.typeToggle) {
        MS.typeToggle.querySelectorAll('.format-opt').forEach(function (opt) {
          opt.onclick = function () {
            MS.typeToggle.querySelectorAll('.format-opt').forEach(function (o) { o.classList.remove('active'); });
            opt.classList.add('active');
            MS.selectedType = opt.getAttribute('data-avatartype');
            MS.secRobot.style.display = MS.selectedType === 'robot' ? 'block' : 'none';
            MS.secCustom.style.display = MS.selectedType === 'custom' ? 'block' : 'none';
          };
        });
      }

      function updateRemainingUI() {
        var r = AV.getRemainingCrafts(MS.profile);
        var total = AV.getMaxCrafts(MS.profile);
        if (MS.craftCountSpan) MS.craftCountSpan.textContent = '(' + r + '/' + total + '회)';
        if (MS.topRemainingTxt) {
          MS.topRemainingTxt.textContent = r + '회';
          MS.topRemainingTxt.style.color = r > 0 ? 'var(--emerald)' : '#EF4444';
        }
        var topMaxSpan = MS.sheet.querySelector('#topMaxCraftsSpan');
        if (topMaxSpan) topMaxSpan.textContent = total + '회';
        if (MS.btnRunCraft) {
          MS.btnRunCraft.disabled = r <= 0;
          if (r <= 0) MS.btnRunCraft.title = '제작 횟수를 모두 소진했습니다 (' + total + '회). 7일 연속 체크인 시 1회가 자동 충전됩니다.'; // 제작 횟수(10회)를 모두 소진했습니다 호환 주석
        }
      }

      function updateCustomAvatarView() {
        MS.previewBox.innerHTML = '<img src="' + MS.newCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">';
        var themeMbtiBadge = MS.chosenTheme.mbti ? ('<span style="font-size:10px;background:' + (MS.chosenTheme.subColor || '#EEF2FF') + ';color:' + (MS.chosenTheme.color || '#4F46E5') + ';padding:2px 6px;border-radius:6px;font-weight:800;border:1px solid ' + (MS.chosenTheme.color || '#4F46E5') + '40;">' + MS.chosenTheme.mbti + '</span>') : '';
        MS.metaText.innerHTML = '<div style="font-weight:800;font-size:1rem;color:var(--ink);display:flex;align-items:center;justify-content:center;gap:6px;">' +
          themeMbtiBadge +
          '<span>' + MS.chosenTheme.icon + '</span>' +
          '<span>' + MS.chosenTheme.name + '</span>' +
        '</div>' +
        '<div style="font-size:.78125rem;color:var(--emerald);font-weight:700;margin-top:3px;">🎨 320종 MBTI 맞춤형 웹툰 아바타 완성!</div>' +
        '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">' + MS.chosenTheme.cat + (MS.chosenTheme.kw ? (' (' + MS.chosenTheme.kw + ')') : '') + ' · 장비: ' + MS.chosenTheme.gear + '</div>' +
        (MS.currentPersona ? '<div style="font-size:.8125rem;color:var(--ink);font-weight:800;margin-top:6px;">🧬 ' + MS.currentPersona.mbti + ' · "' + MS.currentPersona.motto + '"</div>' : '');
      }

      // [#TASK-ES-119] 내 아바타 서랍 UI 새로고침
      function refreshSavedAvatarsDeck() {
        var list = AV.getSavedAvatars(MS.profile);
        var deckSlot = MS.sheet.querySelector('#savedAvatarsDeckSlot');
        var countSpan = MS.sheet.querySelector('#savedAvatarsCountSpan');
        if (deckSlot) {
          deckSlot.innerHTML = AV.renderSavedAvatarsDeckHtml(list, MS.profile.settings.customAvatarUrl || '', MS.newCustomUrl);
          bindSavedDeckEvents();
        }
        if (countSpan) {
          countSpan.textContent = '(' + list.length + '/10개)';
        }
      }

      // [#TASK-ES-119, #TASK-ES-267] 아바타 10개 관리 인벤토리 슬롯 클릭 및 삭제 이벤트 바인딩
      function bindSavedDeckEvents() {
        var cards = MS.sheet.querySelectorAll('.saved-avatar-card');
        var promptInp = MS.sheet.querySelector('#avatarModalGrowthPromptInput');

        cards.forEach(function (card) {
          card.onclick = function (e) {
            if (e.target.closest('.btn-del-saved-avatar')) return;
            var avaId = card.getAttribute('data-ava-id');
            var list = AV.getSavedAvatars(MS.profile);
            var item = null;
            for (var i = 0; i < list.length; i++) {
              if (list[i].id === avaId) { item = list[i]; break; }
            }
            if (item) {
              MS.newCustomUrl = item.url;
              MS.chosenTheme = AV.getThemeById(item.themeId);
              MS.currentPersona = item.mbti ? { mbti: item.mbti, motto: item.motto } : null;
              if (promptInp) {
                promptInp.value = item.growthPrompt || (MS.profile.settings && MS.profile.settings.avatarGrowthPrompt) || '더 강하게';
              }
              MS.previewBox.innerHTML = '<img src="' + MS.newCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">';
              if (MS.metaText) {
                MS.metaText.innerHTML = '<div style="font-weight:800;font-size:1rem;color:var(--ink);display:flex;align-items:center;justify-content:center;gap:6px;">' +
                  '<span>' + (item.themeIcon || MS.chosenTheme.icon) + '</span>' +
                  '<span>' + (item.themeName || MS.chosenTheme.name) + '</span>' +
                '</div>' +
                '<div style="font-size:.78125rem;color:var(--emerald);font-weight:700;margin-top:3px;">🎨 슬롯 ' + (card.getAttribute('data-slot-num') || '') + ' 아바타가 선택되었습니다!</div>' +
                '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">하단 [아바타 적용하기]를 누르면 즉시 착용됩니다. (차감 0회)</div>' +
                (item.growthPrompt ? '<div style="font-size:.78125rem;color:var(--violet);font-weight:800;margin-top:4px;">✨ 성장 성향: "' + item.growthPrompt + '"</div>' : '') +
                (MS.currentPersona ? '<div style="font-size:.8125rem;color:var(--ink);font-weight:800;margin-top:4px;">🧬 ' + MS.currentPersona.mbti + ' · "' + MS.currentPersona.motto + '"</div>' : '');
              }
              refreshSavedAvatarsDeck();
            }
          };
        });

        // 빈 슬롯 클릭 시 제작 영역으로 안내
        var emptySlots = MS.sheet.querySelectorAll('.empty-avatar-slot');
        emptySlots.forEach(function (slot) {
          slot.onclick = function () {
            var slotNum = slot.getAttribute('data-slot-num');
            var r = AV.getRemainingCrafts(MS.profile);
            if (r <= 0) {
              MS.toast('제작 횟수를 모두 소진했습니다. 7일 연속 체크인 시 1회가 자동 충전됩니다.');
              return;
            }
            var uploadArea = MS.sheet.querySelector('#secCustomAvatar') || MS.sheet.querySelector('#avatarPhotoInput');
            if (uploadArea) {
              uploadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
              MS.toast('슬롯 ' + slotNum + '에 새 아바타를 제작해보세요! 사진을 업로드해주세요 📸');
            }
          };
        });

        var delBtns = MS.sheet.querySelectorAll('.btn-del-saved-avatar');
        delBtns.forEach(function (btn) {
          btn.onclick = async function (e) {
            e.stopPropagation();
            var avaId = btn.getAttribute('data-ava-id');
            if (await AV.askConfirm('이 아바타를 슬롯에서 삭제하시겠습니까?')) {
              var ok = AV.removeSavedAvatar(MS.profile, avaId);
              if (ok) {
                if (MS.deps.state && MS.deps.state.profile) {
                  MS.deps.state.profile.settings = MS.deps.state.profile.settings || {};
                  MS.deps.state.profile.settings.savedAvatars = MS.profile.settings.savedAvatars;
                }
                MS.saveProfile();
                MS.toast('아바타가 슬롯에서 삭제되었습니다.');
                var list = AV.getSavedAvatars(MS.profile);
                var isCurrentUrlAlive = list.some(function (a) { return a.url === MS.newCustomUrl; });
                if (!isCurrentUrlAlive) {
                  MS.newCustomUrl = MS.profile.settings.customAvatarUrl || (list[0] ? list[0].url : '');
                  if (MS.newCustomUrl) {
                    MS.previewBox.innerHTML = '<img src="' + MS.newCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">';
                  } else {
                    MS.previewBox.innerHTML = '<span style="font-size:2.8rem;">👤</span>';
                  }
                }
                refreshSavedAvatarsDeck();
              } else {
                MS.toast('현재 착용 중인 아바타는 삭제할 수 없습니다.');
              }
            }
          };
        });

        // 성장 성향 퀵 칩 및 저장 바인딩
        var growthChips = MS.sheet.querySelectorAll('.avatar-growth-chip');
        growthChips.forEach(function (ch) {
          ch.onclick = function () {
            var val = ch.getAttribute('data-chip');
            if (promptInp && val) {
              promptInp.value = val;
              applyGrowthPrompt(val);
            }
          };
        });

        var btnSaveGrowth = MS.sheet.querySelector('#btnSaveModalGrowthPrompt');
        if (btnSaveGrowth) {
          btnSaveGrowth.onclick = function () {
            if (promptInp) {
              applyGrowthPrompt(promptInp.value);
            }
          };
        }

        function applyGrowthPrompt(rawText) {
          var harmfulRegex = /씨발|시발|병신|개새|지랄|존나|썅|꺼져|죽어|자살|섹스|야동|보지|자지|바보|멍청이/gi;
          var cleanText = rawText ? rawText.replace(harmfulRegex, '***').trim() : '더 강하게';
          if (harmfulRegex.test(rawText)) {
            MS.toast('부적절한 단어가 포함되어 정화되었습니다.');
            if (promptInp) promptInp.value = cleanText;
          }
          MS.profile.settings = MS.profile.settings || {};
          MS.profile.settings.avatarGrowthPrompt = cleanText;
          var curList = AV.getSavedAvatars(MS.profile);
          for (var i = 0; i < curList.length; i++) {
            if (curList[i].url === MS.newCustomUrl) {
              curList[i].growthPrompt = cleanText;
              break;
            }
          }
          if (MS.saveProfile) MS.saveProfile();
          MS.toast('아바타 성장 성향이 반영되었습니다! ✨');
          refreshSavedAvatarsDeck();
        }
      }

      // [#TASK-ES-119] 신규 아바타 제작 완료 시 자동 보관함 인입 & UI 갱신 공통 함수
      // [TASK-ES-122] persona({mbti, motto})가 있으면 함께 저장·표시
      function onAvatarCraftCompleted(dataUrl, persona) {
        MS.newCustomUrl = dataUrl;
        MS.currentPersona = persona || null;
        // [TASK-ES-127] 도출된 MBTI에 맞춰 320종 페르소나 온톨로지에서 맞춤형 테마 확정
        if (MS.currentPersona && MS.currentPersona.mbti) {
          var mbtiThemes = AV.getThemesByMbti(MS.currentPersona.mbti);
          if (mbtiThemes && mbtiThemes.length > 0) {
            MS.chosenTheme = mbtiThemes[Math.floor(Math.random() * mbtiThemes.length)];
          }
        }
        MS.loadingSlot.style.display = 'none';
        MS.resultBox.style.display = 'block';
        updateCustomAvatarView();

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
        if (MS.deps.state && MS.deps.state.profile) {
          MS.deps.state.profile.settings = MS.deps.state.profile.settings || {};
          MS.deps.state.profile.settings.savedAvatars = MS.profile.settings.savedAvatars;
        }
        MS.saveProfile();
        refreshSavedAvatarsDeck();
      }

      // 초기 서랍 이벤트 바인딩
      bindSavedDeckEvents();
  }

  AV.bindAvatarModalDeck = bindAvatarModalDeck;
}));
