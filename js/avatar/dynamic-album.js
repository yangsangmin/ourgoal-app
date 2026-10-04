/**
 * OurGoal Avatar Cell: 상황별 다이나믹 아바타 · 앨범 (#TASK-ES-389 · 아바타·EXP 쪼개기 PR-3)
 *
 * js/avatar-system.js(이전 전 3222줄)에서 이 책임 묶음의 선언을 동작 그대로 옮겼다(이전 전 줄: 2528~2829).
 *   DYNAMIC_SITUATIONS · getDynamicAvatarSvg · getDynamicAlbum · saveDynamicAlbum · openDynamicAlbumModal
 * 바꾼 것은 이름 참조뿐이다 — 다른 부품·avatar-system.js 의 이름은 AV.<이름>(getRobotAvatarSvg). 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
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

  // ================= 상황별 다이나믹 아바타 리액션 프리셋 (#TASK-ES-249) =================
  var DYNAMIC_SITUATIONS = {
    checkin_1: {
      id: 'checkin_1',
      title: '일상 맞이',
      icon: '🌅',
      greeting: '돌아왔구나! 오늘은 어떤 하루야?',
      badge: '1회차',
      themeColor: '#10B981',
      subColor: '#ECFDF5',
      prop: 'heart',
      desc: '당일 첫 체크인 완료 시 반갑게 맞이하는 활기찬 아바타'
    },
    checkin_2: {
      id: 'checkin_2',
      title: '오후 몰입',
      icon: '☕',
      greeting: '열심히 달리는 중! 커피 한 잔의 여유 ☕',
      badge: '2회차',
      themeColor: '#F59E0B',
      subColor: '#FFFBEB',
      prop: 'coffee',
      desc: '당일 2회차 체크인 시 지친 일상에 힘을 주는 커피 타임 아바타'
    },
    checkin_3: {
      id: 'checkin_3',
      title: '야간 안식',
      icon: '🌙',
      greeting: '오늘 하루도 정말 고생 많았어! 🌙',
      badge: '3회차',
      themeColor: '#6366F1',
      subColor: '#EEF2FF',
      prop: 'moon_star',
      desc: '당일 3회차 이상 체크인 시 포근한 밤과 휴식을 축복하는 아바타'
    },
    todo_done: {
      id: 'todo_done',
      title: '할일 완료',
      icon: '💪',
      greeting: '해냈다! 하나씩 클리어하는 맛! 💪',
      badge: '실천왕',
      themeColor: '#EC4899',
      subColor: '#FDF2F8',
      prop: 'dumbbell',
      desc: '세부할일을 하나씩 달성할 때마다 환호하고 힘을 불어넣는 아바타'
    },
    milestone_break: {
      id: 'milestone_break',
      title: '마일스톤 돌파',
      icon: '🏆',
      greeting: '대박! 마일스톤 정복을 축하해! 🏆',
      badge: '달성',
      themeColor: '#8B5CF6',
      subColor: '#F5F3FF',
      prop: 'trophy',
      desc: '마일스톤 및 주요 목표를 완수했을 때 트로피를 치켜드는 황금 아바타'
    }
  };

  // 상황별 시각 소품 및 말풍선이 결합된 다이나믹 아바타 SVG 생성 (#TASK-ES-249)
  function getDynamicAvatarSvg(situationKey, baseAvatar, options) {
    var opts = options || {};
    var s = opts.size || 80;
    var sit = DYNAMIC_SITUATIONS[situationKey] || DYNAMIC_SITUATIONS.checkin_1;
    var avatarSource = '';
    var isRobot = true;
    var robotLevel = 1;

    if (typeof baseAvatar === 'string' && (baseAvatar.indexOf('data:image') === 0 || baseAvatar.indexOf('http') === 0)) {
      avatarSource = baseAvatar;
      isRobot = false;
    } else if (typeof baseAvatar === 'number') {
      robotLevel = baseAvatar;
    } else if (baseAvatar && typeof baseAvatar === 'object') {
      var st = baseAvatar.settings || {};
      if (st.avatarType === 'custom' && st.customAvatarUrl) {
        avatarSource = st.customAvatarUrl;
        isRobot = false;
      } else if (baseAvatar.avatarUrl) {
        avatarSource = baseAvatar.avatarUrl;
        isRobot = false;
      }
      robotLevel = baseAvatar.level || 1;
    }

    var uid = 'dyn_' + sit.id + '_' + Math.floor(Math.random() * 10000);

    // 상황별 시각 소품 (Props) & 장식 SVG
    var propSvg = '';
    if (sit.id === 'checkin_1') {
      // 일상 맞이: 햇살 오라 + 환영 하트
      propSvg = 
        '<g class="dyn-prop-checkin1">' +
          '<circle cx="82" cy="18" r="8" fill="#F59E0B" opacity="0.3" />' +
          '<circle cx="82" cy="18" r="5" fill="#FBBF24" />' +
          '<path d="M82 9 L82 6 M82 27 L82 30 M73 18 L70 18 M91 18 L94 18" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" />' +
          '<path d="M22 20 C22 16, 17 14, 15 17 C13 14, 8 16, 8 20 C8 25, 15 30, 15 30 C15 30, 22 25, 22 20 Z" fill="#EF4444" />' +
        '</g>';
    } else if (sit.id === 'checkin_2') {
      // 오후 몰입: 김이 모락모락 피어나는 따뜻한 커피 머그잔
      propSvg = 
        '<g class="dyn-prop-checkin2">' +
          '<rect x="68" y="58" width="18" height="15" rx="3.5" fill="#B45309" stroke="#78350F" stroke-width="1.5" />' +
          '<path d="M86 61 C91 61, 91 68, 86 68" stroke="#78350F" stroke-width="2" fill="none" />' +
          '<path d="M73 54 Q75 50 73 47" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" fill="none" />' +
          '<path d="M79 54 Q81 50 79 47" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" fill="none" />' +
          '<circle cx="16" cy="22" r="3" fill="#F59E0B" opacity="0.8" />' +
        '</g>';
    } else if (sit.id === 'checkin_3') {
      // 야간 안식: 금빛 초승달 + 반짝이는 별무리
      propSvg = 
        '<g class="dyn-prop-checkin3">' +
          '<path d="M78 12 A12 12 0 1 0 88 28 A10 10 0 0 1 78 12 Z" fill="#FBBF24" />' +
          '<polygon points="20,18 21.5,22 25.5,22 22.5,24.5 23.5,28.5 20,26 16.5,28.5 17.5,24.5 14.5,22 18.5,22" fill="#A5B4FC" />' +
          '<circle cx="28" cy="30" r="1.5" fill="#E0E7FF" />' +
          '<circle cx="70" cy="42" r="2" fill="#FDE047" />' +
        '</g>';
    } else if (sit.id === 'todo_done') {
      // 할일 완료: 승리의 덤벨 & 체크 배지
      propSvg = 
        '<g class="dyn-prop-tododone">' +
          '<circle cx="18" cy="22" r="9" fill="#10B981" />' +
          '<path d="M14 22 L17 25 L22 19" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />' +
          '<rect x="66" y="65" width="20" height="4" rx="2" fill="#64748B" />' +
          '<rect x="64" y="61" width="5" height="12" rx="2" fill="#EC4899" />' +
          '<rect x="83" y="61" width="5" height="12" rx="2" fill="#EC4899" />' +
        '</g>';
    } else if (sit.id === 'milestone_break') {
      // 마일스톤 돌파: 빛나는 황금 트로피 & 승리의 별
      propSvg = 
        '<g class="dyn-prop-milestone">' +
          '<path d="M68 58 L86 58 L83 69 Q77 74 77 77 L74 77 M75 77 L79 77 M72 79 L82 79" stroke="#B45309" stroke-width="2" fill="#F59E0B" />' +
          '<path d="M68 60 C63 60, 63 67, 68 67 M86 60 C91 60, 91 67, 86 67" stroke="#B45309" stroke-width="1.5" fill="none" />' +
          '<polygon points="77,61 78.5,65 82.5,65 79.5,67.5 80.5,71.5 77,69 73.5,71.5 74.5,67.5 71.5,65 75.5,65" fill="#FEF08A" />' +
          '<polygon points="18,14 19.5,18 23.5,18 20.5,20.5 21.5,24.5 18,22 14.5,24.5 15.5,20.5 12.5,18 16.5,18" fill="#F59E0B" />' +
        '</g>';
    }

    var avatarCore = '';
    if (!isRobot && avatarSource) {
      avatarCore = 
        '<defs>' +
          '<clipPath id="' + uid + '_clip">' +
            '<circle cx="50" cy="48" r="30" />' +
          '</clipPath>' +
        '</defs>' +
        '<circle cx="50" cy="48" r="31" fill="#FFFFFF" stroke="' + sit.themeColor + '" stroke-width="2" />' +
        '<image href="' + avatarSource + '" x="20" y="18" width="60" height="60" preserveAspectRatio="xMidYMid slice" clip-path="url(#' + uid + '_clip)" />';
    } else {
      var robSvg = AV.getRobotAvatarSvg(robotLevel, 60);
      avatarCore = 
        '<circle cx="50" cy="48" r="30" fill="#ECFDF5" stroke="' + sit.themeColor + '" stroke-width="2" />' +
        '<g transform="translate(20, 18) scale(0.6)">' +
          robSvg +
        '</g>';
    }

    return '<svg class="dynamic-avatar-svg situation-' + sit.id + '" width="' + s + '" height="' + s + '" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + sit.title + ' 아바타">' +
      '<circle cx="50" cy="50" r="46" fill="' + sit.subColor + '" stroke="' + sit.themeColor + '" stroke-width="2.5" />' +
      avatarCore +
      propSvg +
      '<rect x="18" y="78" width="64" height="15" rx="7.5" fill="' + sit.themeColor + '" />' +
      '<text x="50" y="89" text-anchor="middle" font-size="8" font-weight="900" fill="#FFFFFF" letter-spacing="-0.2px">' + sit.badge + ' · ' + sit.title + '</text>' +
    '</svg>';
  }

  // 다이나믹 아바타 리액션 도감 데이터 조회 (#TASK-ES-249)
  function getDynamicAlbum(profile) {
    var p = profile || {};
    var s = p.settings = p.settings || {};
    var album = s.dynamicAlbum;
    if (!Array.isArray(album) || album.length === 0) {
      album = Object.keys(DYNAMIC_SITUATIONS).map(function (key) {
        var sit = DYNAMIC_SITUATIONS[key];
        return {
          situationKey: key,
          title: sit.title,
          icon: sit.icon,
          greeting: sit.greeting,
          badge: sit.badge,
          themeColor: sit.themeColor,
          unlocked: true,
          isEquipped: key === (s.equippedSituationKey || 'checkin_1'),
          customAvatarUrl: s.customAvatarUrl || '',
          updatedAt: new Date().toISOString()
        };
      });
      s.dynamicAlbum = album;
    }
    return album;
  }

  // 다이나믹 아바타 리액션 도감 데이터 영속화 (#TASK-ES-249)
  function saveDynamicAlbum(profile, album) {
    if (!profile) return;
    profile.settings = profile.settings || {};
    profile.settings.dynamicAlbum = album;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('ourgoal_dynamic_album', JSON.stringify(album));
      }
    } catch (e) {}
  }

  // 상황별 다이나믹 아바타 도감 모달 (#TASK-ES-249 - 100% 무료 순수 기능)
  function openDynamicAlbumModal(deps) {
    var d = deps || {};
    var profile = d.profile || (d.state && d.state.profile) || {};
    var saveProfile = d.saveProfile || function () {};
    var toast = d.toast || function (m) { console.log(m); };
    var openModal = d.openModal || (typeof window !== 'undefined' && window.openModal);
    var closeModal = d.closeModal || (typeof window !== 'undefined' && window.closeModal);
    var renderHome = d.renderHome;
    var renderSettingsScreen = d.renderSettingsScreen;

    var album = getDynamicAlbum(profile);
    var settings = profile.settings = profile.settings || {};
    var equippedKey = settings.equippedSituationKey || 'checkin_1';
    var curCustomUrl = settings.customAvatarUrl || profile.avatarUrl || '';
    var curLevel = profile.level || 1;

    var html = '<div class="dynamic-avatar-album-modal" style="max-width:620px;margin:0 auto;text-align:left;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:8px;">' +
        '<div>' +
          '<div style="font-weight:900;font-size:1.25rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
            '<span>📖 아바타 리액션 도감</span>' +
            '<span style="font-size:0.75rem;padding:2px 8px;border-radius:20px;background:var(--surface-3);color:var(--ink-soft);font-weight:700;">100% 무료 컬렉션</span>' +
          '</div>' +
          '<div style="font-size:0.8125rem;color:var(--ink-soft);margin-top:2px;">1·2·3회차 기록 및 마일스톤 달성 시 나를 반겨주는 생생한 아바타 컬렉션</div>' +
        '</div>' +
        '<button type="button" class="btn btn-ghost btn-sm" id="btnCloseDynamicAlbumModal" style="min-height:36px;padding:6px 12px;border-radius:10px;">닫기</button>' +
      '</div>' +

      '<div class="dynamic-avatar-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(250px, 1fr));gap:12px;max-height:420px;overflow-y:auto;padding-right:4px;-webkit-overflow-scrolling:touch;">';

    var keys = Object.keys(DYNAMIC_SITUATIONS);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var sit = DYNAMIC_SITUATIONS[k];
      var isEq = (k === equippedKey);
      var svgPreview = getDynamicAvatarSvg(k, curCustomUrl || curLevel, { size: 74 });

      html += '<div class="dynamic-avatar-card ' + (isEq ? 'equipped' : '') + '" style="background:var(--card, #fff);border:' + (isEq ? '2px solid ' + sit.themeColor : '1px solid var(--border-soft)') + ';border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;box-shadow:' + (isEq ? '0 0 12px ' + sit.themeColor + '30' : '0 2px 6px rgba(0,0,0,0.04)') + ';transition:all 0.2s ease;">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<div style="flex-shrink:0;">' + svgPreview + '</div>' +
          '<div style="min-width:0;flex:1;">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-weight:900;font-size:0.9375rem;color:var(--ink);">' + sit.title + '</span>' +
              '<span style="font-size:0.6875rem;padding:1px 6px;border-radius:6px;background:' + sit.subColor + ';color:' + sit.themeColor + ';font-weight:800;border:1px solid ' + sit.themeColor + '40;">' + sit.badge + '</span>' +
            '</div>' +
            '<div style="font-size:0.75rem;color:var(--ink-soft);margin-top:4px;line-height:1.35;">' + sit.desc + '</div>' +
          '</div>' +
        '</div>' +

        '<div style="background:var(--surface-2);border-radius:10px;padding:8px 10px;font-size:0.8125rem;color:var(--ink);display:flex;align-items:center;gap:6px;border-left:3px solid ' + sit.themeColor + ';">' +
          '<span style="font-size:1.1rem;line-height:1;">💬</span>' +
          '<span style="font-style:italic;font-weight:600;">"' + sit.greeting + '"</span>' +
        '</div>' +

        '<div style="margin-top:auto;display:flex;justify-content:flex-end;">' +
          (isEq ?
            '<button type="button" class="btn btn-sm btn-equip-dynamic-avatar btn-equipped" data-situation="' + k + '" style="min-height:34px;padding:5px 12px;font-size:0.75rem;font-weight:800;border-radius:8px;background:' + sit.themeColor + ';color:#fff;border:none;cursor:default;" disabled>✓ 현재 대표 반응</button>' :
            '<button type="button" class="btn btn-ghost btn-sm btn-equip-dynamic-avatar" data-situation="' + k + '" style="min-height:34px;padding:5px 12px;font-size:0.75rem;font-weight:700;border-radius:8px;border-color:var(--border-soft);color:var(--ink);">대표 반응으로 착용</button>'
          ) +
        '</div>' +
      '</div>';
    }

    html += '</div></div>';

    if (!openModal) {
      console.warn('openModal not found for openDynamicAlbumModal');
      return;
    }

    openModal(html, function (sheet) {
      var btnClose = sheet.querySelector('#btnCloseDynamicAlbumModal');
      if (btnClose && closeModal) {
        btnClose.onclick = function () {
          if (typeof triggerHapticFeedback === 'function') triggerHapticFeedback(12);
          closeModal();
        };
      }

      sheet.addEventListener('click', function (e) {
        var targetBtn = e.target.closest('.btn-equip-dynamic-avatar');
        if (!targetBtn || targetBtn.disabled) return;
        var sitKey = targetBtn.getAttribute('data-situation');
        if (!sitKey || !DYNAMIC_SITUATIONS[sitKey]) return;

        if (typeof triggerHapticFeedback === 'function') triggerHapticFeedback(12);
        settings.equippedSituationKey = sitKey;
        if (saveProfile) saveProfile();
        toast('✨ ' + DYNAMIC_SITUATIONS[sitKey].title + ' 아바타가 기본 반응으로 활성화되었습니다!');

        if (renderHome) renderHome();
        if (renderSettingsScreen) renderSettingsScreen();

        if (closeModal) closeModal();
      });
    });
  }

  AV.DYNAMIC_SITUATIONS = DYNAMIC_SITUATIONS;
  AV.getDynamicAvatarSvg = getDynamicAvatarSvg;
  AV.getDynamicAlbum = getDynamicAlbum;
  AV.saveDynamicAlbum = saveDynamicAlbum;
  AV.openDynamicAlbumModal = openDynamicAlbumModal;
}));
