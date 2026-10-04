/**
 * OurGoal Avatar Cell: 제작권(횟수·스트릭 보너스) · 보관함 10칸 (#TASK-ES-389 · 아바타·EXP 쪼개기 PR-3)
 *
 * js/avatar-system.js(이전 전 3222줄)에서 이 책임 묶음의 선언을 동작 그대로 옮겼다(이전 전 줄: 642~714, 732~807, 902~943).
 *   isLegacyAccount · getMaxCrafts · getRemainingCrafts · maybeGrantStreakBonus · getSavedAvatars · addSavedAvatar · removeSavedAvatar · renderSavedAvatarsDeckHtml
 * 바꾼 것은 이름 참조뿐이다 — 다른 부품·avatar-system.js 의 이름은 AV.<이름>(DEFAULT_BASE_CRAFTS · LEGACY_MAX_CRAFTS · MAX_AVATAR_CHANGES · getThemeById). 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
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

  // 기존 계정 판별기 (10회 기득권 100% 무손실 보존) (#TASK-ES-125)
  function isLegacyAccount(profile) {
    if (!profile) return false;
    var settings = profile.settings || {};
    if (settings.maxBaseCrafts === AV.DEFAULT_BASE_CRAFTS) return false;
    if (settings.maxBaseCrafts === AV.LEGACY_MAX_CRAFTS) return true;
    if (typeof settings.avatarCraftCount === 'number' && settings.avatarCraftCount > 0) return true;
    if (settings.customAvatarUrl) return true;
    if (Array.isArray(settings.savedAvatars) && settings.savedAvatars.length > 0) return true;
    if (Array.isArray(profile.goals) && profile.goals.length > 0) return true;
    if (Array.isArray(profile.records) && profile.records.length > 0) return true;
    // maxBaseCrafts가 3으로 지정되지 않은 모든 기존/미지정 계정은 레거시 10회 보존
    return settings.maxBaseCrafts !== AV.DEFAULT_BASE_CRAFTS;
  }

  // 총 가용 제작 한도 계산 (기본 한도 + 7일 연속 체크인 충전 보너스) (#TASK-ES-125)
  function getMaxCrafts(profile) {
    if (!profile) return AV.DEFAULT_BASE_CRAFTS;
    var settings = profile.settings = profile.settings || {};
    var base;
    if (typeof settings.maxBaseCrafts === 'number') {
      base = settings.maxBaseCrafts;
    } else {
      // 미지정 계정은 레거시 10회 기본 보존
      base = AV.LEGACY_MAX_CRAFTS;
      settings.maxBaseCrafts = AV.LEGACY_MAX_CRAFTS;
    }
    var bonus = (typeof settings.bonusCraftCredits === 'number') ? settings.bonusCraftCredits : 0;
    return base + bonus;
  }

  // 잔여 제작 가능 횟수 계산 (총한도 - 실질사용횟수, 기본 3회 / 레거시 10회) (#TASK-ES-125)
  function getRemainingCrafts(profile) {
    var maxCrafts = getMaxCrafts(profile);
    if (!profile || !profile.settings) return maxCrafts;
    var used = profile.settings.avatarCraftCount;
    if (typeof used !== 'number') used = 0;
    return Math.max(0, maxCrafts - used);
  }

  // 7일 연속 체크인 달성 시 아바타 제작권 1회 자동 충전 리워드 루프 (#TASK-ES-125)
  function maybeGrantStreakBonus(profile, streakDays) {
    if (!profile) return { granted: false };
    var settings = profile.settings = profile.settings || {};
    var sDays = Number(streakDays) || 0;
    if (sDays < 7) return { granted: false };

    var currentTierDays = Math.floor(sDays / 7) * 7;
    var lastAwarded = Number(settings.lastStreakAwarded) || 0;

    // 스트릭이 끊겼다가 다시 회복된 경우 마지막 지급 기준 리셋
    if (sDays < lastAwarded) {
      lastAwarded = 0;
      settings.lastStreakAwarded = 0;
    }

    // 동일 7일 배수 구간 중복 지급 방지
    if (currentTierDays <= lastAwarded) {
      return { granted: false };
    }

    settings.bonusCraftCredits = (Number(settings.bonusCraftCredits) || 0) + 1;
    settings.lastStreakAwarded = currentTierDays;

    return {
      granted: true,
      streakDays: sDays,
      awardedTierDays: currentTierDays,
      bonusCraftCredits: settings.bonusCraftCredits,
      totalCrafts: getMaxCrafts(profile),
      remainingCrafts: getRemainingCrafts(profile)
    };
  }

  // 누적 아바타 보관함(서랍) 목록 반환 (하위호환 자가치유 포함) (#TASK-ES-119)
  function getSavedAvatars(profile) {
    if (!profile) return [];
    var settings = profile.settings = profile.settings || {};
    if (!Array.isArray(settings.savedAvatars)) {
      settings.savedAvatars = [];
    }
    // 자가 치유: 기존에 제작된 customAvatarUrl이 있는데 savedAvatars가 비어있는 경우 1번 아이템으로 자동 복원
    if (settings.savedAvatars.length === 0 && settings.customAvatarUrl && (settings.customAvatarUrl.indexOf('data:image') === 0 || settings.customAvatarUrl.indexOf('http') === 0)) {
      var t = AV.getThemeById(settings.avatarThemeId || 1);
      settings.savedAvatars.push({
        id: 'ava_init_' + Date.now(),
        url: settings.customAvatarUrl,
        themeId: t.id,
        themeName: t.name,
        themeIcon: t.icon,
        createdAt: new Date().toISOString()
      });
    }
    return settings.savedAvatars;
  }

  // 아바타 보관함에 새 아바타 추가 (최대 10개) (#TASK-ES-119)
  function addSavedAvatar(profile, item) {
    if (!profile || !item || !item.url) return [];
    var list = getSavedAvatars(profile);
    var existingIdx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].url === item.url || (list[i].id && list[i].id === item.id)) {
        existingIdx = i;
        break;
      }
    }
    if (existingIdx !== -1) {
      list.splice(existingIdx, 1);
    }
    list.unshift({
      id: item.id || ('ava_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
      url: item.url,
      themeId: item.themeId || 1,
      themeName: item.themeName || AV.getThemeById(item.themeId || 1).name,
      themeIcon: item.themeIcon || AV.getThemeById(item.themeId || 1).icon,
      growthPrompt: item.growthPrompt || (profile.settings && profile.settings.avatarGrowthPrompt) || '더 강하게',
      mbti: item.mbti || null,
      motto: item.motto || null,
      periodStart: item.periodStart || null,
      periodEnd: item.periodEnd || null,
      createdAt: item.createdAt || new Date().toISOString()
    });
    if (list.length > AV.MAX_AVATAR_CHANGES) {
      profile.settings.savedAvatars = list.slice(0, AV.MAX_AVATAR_CHANGES);
    } else {
      profile.settings.savedAvatars = list;
    }
    return profile.settings.savedAvatars;
  }

  // 아바타 보관함에서 삭제 (착용 중 보호) (#TASK-ES-119)
  function removeSavedAvatar(profile, avatarId) {
    if (!profile || !avatarId) return false;
    var list = getSavedAvatars(profile);
    var targetIdx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === avatarId) {
        targetIdx = i;
        break;
      }
    }
    if (targetIdx === -1) return false;
    if (profile.settings && profile.settings.customAvatarUrl === list[targetIdx].url) {
      return false; // 착용 중 보호
    }
    list.splice(targetIdx, 1);
    profile.settings.savedAvatars = list;
    return true;
  }

  function renderSavedAvatarsDeckHtml(savedList, activeUrl, selectedUrl) {
    var list = savedList || [];
    var MAX_SLOTS = 10;
    var cardsHtml = '';

    for (var slotIdx = 0; slotIdx < MAX_SLOTS; slotIdx++) {
      var slotNum = slotIdx + 1;
      var item = list[slotIdx] || null;

      if (item) {
        var isWearing = (item.url === activeUrl);
        var isSelected = (item.url === selectedUrl);
        var borderColor = isSelected ? 'var(--emerald, #10B981)' : (isWearing ? '#3B82F6' : 'var(--border-soft, #E2E8F0)');
        var borderWeight = (isSelected || isWearing) ? '2.5px' : '1px';
        var bgShadow = isSelected ? 'box-shadow:0 0 0 3px rgba(16,185,129,0.22);' : (isWearing ? 'box-shadow:0 0 0 2px rgba(59,130,246,0.2);' : '');
        var promptText = item.growthPrompt || '더 강하게';

        cardsHtml += '<div class="saved-avatar-card" data-ava-id="' + item.id + '" data-slot-num="' + slotNum + '" style="flex:0 0 88px;position:relative;background:var(--surface-1, #FFFFFF);border:' + borderWeight + ' solid ' + borderColor + ';' + bgShadow + 'border-radius:14px;padding:6px 4px;cursor:pointer;text-align:center;transition:all .15s ease;">' +
          '<div style="position:absolute;top:-7px;left:6px;background:var(--surface-3, #E2E8F0);color:var(--ink, #1E293B);font-size:9px;font-weight:900;padding:1px 5px;border-radius:6px;z-index:2;border:1px solid var(--border-soft,#cbd5e1);">슬롯 ' + slotNum + '</div>' +
          (isWearing ? '<div style="position:absolute;top:-7px;right:6px;background:#3B82F6;color:#fff;font-size:9px;font-weight:900;padding:1px 6px;border-radius:10px;white-space:nowrap;z-index:2;">착용 중</div>' : '') +
          (!isWearing ? '<button type="button" class="btn-del-saved-avatar" data-ava-id="' + item.id + '" title="슬롯 ' + slotNum + ' 아바타 삭제" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.5);color:#fff;border:none;font-size:11px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3;padding:0;">×</button>' : '') +
          '<div style="width:72px;height:72px;border-radius:10px;overflow:hidden;margin:10px auto 0;background:#f8fafc;display:flex;align-items:center;justify-content:center;">' +
            '<img src="' + item.url + '" alt="' + (item.themeName || '아바타') + '" style="width:100%;height:100%;object-fit:cover;">' +
          '</div>' +
          '<div style="font-size:10px;font-weight:800;color:var(--ink, #0F172A);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + item.themeName + '">' +
            (item.themeIcon || '🎨') + ' ' + (item.themeName || '아바타') +
          '</div>' +
          '<div class="slot-growth-badge" style="font-size:9px;font-weight:700;color:var(--violet, #8B5CF6);background:rgba(139,92,246,0.1);padding:1px 4px;border-radius:4px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="성향: ' + promptText + '">✨ ' + promptText + '</div>' +
        '</div>';
      } else {
        cardsHtml += '<div class="empty-avatar-slot" data-slot-num="' + slotNum + '" style="flex:0 0 88px;min-height:130px;border:1.5px dashed var(--border-soft, #cbd5e1);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;background:var(--surface-2, #f8fafc);color:var(--ink-soft, #64748b);gap:4px;padding:6px;transition:all .15s ease;" title="슬롯 ' + slotNum + ' (새 아바타 제작 가능)">' +
          '<span style="font-size:1.4rem;line-height:1;">➕</span>' +
          '<span style="font-size:10px;font-weight:800;color:var(--ink, #1E293B);">슬롯 ' + slotNum + '</span>' +
          '<span style="font-size:9px;color:var(--ink-faint, #94a3b8);">비어 있음</span>' +
        '</div>';
      }
    }

    return '<div class="avatar-10slots-carousel" style="display:flex;gap:8px;overflow-x:auto;padding:12px 4px 8px 4px;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;">' +
      cardsHtml +
    '</div>';
  }

  AV.isLegacyAccount = isLegacyAccount;
  AV.getMaxCrafts = getMaxCrafts;
  AV.getRemainingCrafts = getRemainingCrafts;
  AV.maybeGrantStreakBonus = maybeGrantStreakBonus;
  AV.getSavedAvatars = getSavedAvatars;
  AV.addSavedAvatar = addSavedAvatar;
  AV.removeSavedAvatar = removeSavedAvatar;
  AV.renderSavedAvatarsDeckHtml = renderSavedAvatarsDeckHtml;
}));
