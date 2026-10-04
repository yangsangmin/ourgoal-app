/**
 * OurGoal Avatar Cell: 아바타·랭크 그리기 입구 (로봇 SVG · 나무망치 연출 · 5대 랭크 테마·날개 · renderAvatarHtml) (#TASK-ES-389 · 아바타·EXP 쪼개기 PR-3)
 *
 * js/avatar-system.js(이전 전 3222줄)에서 이 책임 묶음의 선언을 동작 그대로 옮겼다(이전 전 줄: 186~286, 945~1431).
 *   getRobotAvatarSvg · getWoodHammerMakerAnimationHtml · RANK_THEMES_5 · getRankThemeInfo · getRankWingsSvg · renderAvatarHtml
 * 바꾼 것은 이름 참조뿐이다 — 다른 부품·avatar-system.js 의 이름은 AV.<이름>(없음). 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
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

  // ================= 1~10단계 초록 로봇 SVG 생성기 =================
  function getRobotAvatarSvg(level, size) {
    var lv = Math.max(1, Math.min(10, parseInt(level, 10) || 1));
    var s = size || 36;
    var primaryColor = '#10B981';
    var eyeColor = lv >= 7 ? '#F59E0B' : '#FFFFFF';
    var hasAntenna = lv >= 2;
    var hasEarMuffs = lv >= 4;
    var hasChestBadge = lv >= 6;
    var hasWings = lv >= 8;
    var isMaster = lv >= 10;

    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="50" cy="50" r="48" fill="#ECFDF5" stroke="' + primaryColor + '" stroke-width="3"/>' +
      (hasWings ? '<path d="M12 42 C4 30, 2 56, 16 64 Z M88 42 C96 30, 98 56, 84 64 Z" fill="' + (isMaster ? '#F59E0B' : '#A7F3D0') + '" opacity="0.9"/>' : '') +
      (hasAntenna ? '<line x1="50" y1="22" x2="50" y2="10" stroke="' + (isMaster ? '#F59E0B' : primaryColor) + '" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="8" r="4" fill="' + (isMaster ? '#EF4444' : '#F59E0B') + '"/>' : '') +
      '<rect x="26" y="22" width="48" height="38" rx="14" fill="' + primaryColor + '" stroke="#047857" stroke-width="2.5"/>' +
      (hasEarMuffs ? '<rect x="20" y="32" width="7" height="18" rx="3.5" fill="#047857"/><rect x="73" y="32" width="7" height="18" rx="3.5" fill="#047857"/>' : '') +
      '<circle cx="40" cy="38" r="6" fill="' + eyeColor + '"/>' +
      '<circle cx="60" cy="38" r="6" fill="' + eyeColor + '"/>' +
      '<circle cx="42" cy="36" r="2" fill="#047857"/>' +
      '<circle cx="62" cy="36" r="2" fill="#047857"/>' +
      '<path d="M42 50 Q50 56 58 50" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/>' +
      '<rect x="34" y="62" width="32" height="26" rx="8" fill="' + primaryColor + '" stroke="#047857" stroke-width="2"/>' +
      (hasChestBadge ? '<circle cx="50" cy="74" r="6" fill="' + (isMaster ? '#F59E0B' : '#FFFFFF') + '"/>' +
       '<text x="50" y="77" text-anchor="middle" font-size="7" font-weight="900" fill="#047857">' + lv + '</text>' :
       '<rect x="42" y="68" width="16" height="4" rx="2" fill="#A7F3D0"/>') +
      '<line x1="28" y1="68" x2="34" y2="76" stroke="' + primaryColor + '" stroke-width="5" stroke-linecap="round"/>' +
      '<line x1="72" y1="68" x2="66" y2="76" stroke="' + primaryColor + '" stroke-width="5" stroke-linecap="round"/>' +
      '<rect x="38" y="88" width="8" height="8" rx="3" fill="#047857"/>' +
      '<rect x="54" y="88" width="8" height="8" rx="3" fill="#047857"/>' +
    '</svg>';
  }

  // ================= 나무망치 아바타 제작 애니메이션 SVG =================
  function getWoodHammerMakerAnimationHtml(nickname) {
    var nick = nickname || '회원';
    return '<div class="avatar-maker-box" style="text-align:center;padding:24px 16px;">' +
      '<style>' +
        '@keyframes hammerStrike {' +
          '0% { transform: rotate(-25deg); }' +
          '40% { transform: rotate(38deg); }' +
          '60% { transform: rotate(32deg); }' +
          '100% { transform: rotate(-25deg); }' +
        '}' +
        '@keyframes sparkGlow {' +
          '0%, 100% { opacity: 0; transform: scale(0.6); }' +
          '40% { opacity: 1; transform: scale(1.3); }' +
          '60% { opacity: 0.6; transform: scale(1); }' +
        '}' +
        '@keyframes robotBob {' +
          '0%, 100% { transform: translateY(0); }' +
          '50% { transform: translateY(-3px); }' +
        '}' +
      '</style>' +
      '<div style="width:140px;height:120px;margin:0 auto;position:relative;">' +
        '<svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          // 작업대
          '<rect x="15" y="84" width="110" height="14" rx="4" fill="#78350F" stroke="#451A03" stroke-width="2"/>' +
          '<rect x="25" y="98" width="10" height="18" fill="#5A240A"/>' +
          '<rect x="105" y="98" width="10" height="18" fill="#5A240A"/>' +
          // 조립 중인 3등신 인형 실루엣
          '<rect x="58" y="70" width="24" height="14" rx="5" fill="#E2E8F0" stroke="#94A3B8"/>' +
          '<circle cx="70" cy="58" r="12" fill="#FEF08A" stroke="#EAB308"/>' +
          // 스파크 파티클
          '<g style="transform-origin:70px 76px;animation:sparkGlow 0.8s ease-in-out infinite;">' +
            '<circle cx="70" cy="74" r="5" fill="#F59E0B"/>' +
            '<path d="M70 65 L72 73 L80 75 L72 77 L70 85 L68 77 L60 75 L68 73 Z" fill="#FBBF24"/>' +
          '</g>' +
          // 초록 로봇 마스코트
          '<g style="animation:robotBob 0.8s ease-in-out infinite;">' +
            '<rect x="22" y="34" width="30" height="24" rx="8" fill="#10B981" stroke="#047857" stroke-width="2"/>' +
            '<circle cx="31" cy="44" r="3.5" fill="#FFFFFF"/>' +
            '<circle cx="43" cy="44" r="3.5" fill="#FFFFFF"/>' +
            '<circle cx="32" cy="43" r="1.5" fill="#047857"/>' +
            '<circle cx="44" cy="43" r="1.5" fill="#047857"/>' +
            '<path d="M33 51 Q37 54 41 51" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/>' +
            '<rect x="27" y="58" width="20" height="18" rx="5" fill="#10B981" stroke="#047857" stroke-width="1.5"/>' +
            '<line x1="23" y1="62" x2="27" y2="68" stroke="#10B981" stroke-width="3" stroke-linecap="round"/>' +
          '</g>' +
          // 나무망치를 쥔 오른팔 (타격 애니메이션)
          '<g style="transform-origin:46px 60px;animation:hammerStrike 0.8s ease-in-out infinite;">' +
            '<line x1="46" y1="60" x2="65" y2="52" stroke="#10B981" stroke-width="4" stroke-linecap="round"/>' +
            // 나무망치 자루
            '<line x1="62" y1="46" x2="74" y2="66" stroke="#92400E" stroke-width="4" stroke-linecap="round"/>' +
            // 나무망치 머리 (Wood Block)
            '<rect x="58" y="40" width="22" height="12" rx="3" fill="#B45309" stroke="#78350F" stroke-width="1.5" transform="rotate(30 58 40)"/>' +
          '</g>' +
        '</svg>' +
      '</div>' +
      '<div style="font-weight:800;font-size:1.0625rem;color:var(--ink);margin-top:10px;">' +
        nick + '님을 형상화한 아바타를 만들고 있어요 🔨✨' +
      '</div>' +
      '<div style="font-size:0.8125rem;color:var(--ink-soft);margin-top:4px;">' +
        'Gemini AI가 사진 속 특징과 설정하신 기간의 목표·팀·기록을 함께 분석해 나만의 MBTI·좌우명 아바타로 제작 중입니다…' +
      '</div>' +
      '<div style="width:160px;height:6px;background:var(--surface-3);border-radius:3px;margin:14px auto 0;overflow:hidden;">' +
        '<div id="avatarGenProgress" style="width:20%;height:100%;background:var(--emerald);transition:width 0.3s ease;"></div>' +
      '</div>' +
    '</div>';
  }

  // ================= 5대 상징 랭크 25단계 성장 진화 시스템 (#TASK-ES-159, #TASK-ES-204) =================
  // 상민님 지시: 새싹->숲->포세이돈->제우스->우주 5대 테마 + 1레벨마다(I~V) 점진적 성장 형태 진화
  var RANK_THEMES_5 = [
    {
      id: 'sprout',
      themeId: 1,
      minLv: 1,
      maxLv: 5,
      name: '새싹',
      icon: '🌱',
      title: '파릇한 새싹 랭크',
      desc: '작은 실천과 습관으로 틔워낸 소중한 새싹',
      mainColor: '#10B981',
      subColor: '#34D399',
      accentColor: '#D1FAE5',
      glow: 'rgba(16, 185, 129, 0.45)',
      badgeGradient: 'linear-gradient(135deg, #10B981, #059669)',
      subSteps: [
        { step: 1, roman: 'I', name: '아기 떡잎', desc: '머리 위 정중앙 앙증맞은 연둣빛 떡잎 한 쌍' },
        { step: 2, roman: 'II', name: '쌍떡잎과 아침이슬', desc: '도톰한 잎사귀와 영롱한 펄 이슬 두 방울' },
        { step: 3, roman: 'III', name: '세잎 클로버 핀', desc: '동글동글 사랑스러운 파스텔 클로버 헤어핀' },
        { step: 4, roman: 'IV', name: '미니 덩굴 화관', desc: '아바타 머리 위를 아치형으로 부드럽게 감싸는 미니 리스' },
        { step: 5, roman: 'V', name: '파스텔 데이지 티아라', desc: '화이트 & 파스텔 옐로우의 사랑스러운 데이지 꽃관' }
      ]
    },
    {
      id: 'forest',
      themeId: 2,
      minLv: 6,
      maxLv: 10,
      name: '울창한 숲',
      icon: '🌲',
      title: '울창한 숲 랭크',
      desc: '매일의 노력이 모여 울창한 숲을 이룬 성장',
      mainColor: '#059669',
      subColor: '#10B981',
      accentColor: '#A7F3D0',
      glow: 'rgba(5, 150, 105, 0.45)',
      badgeGradient: 'linear-gradient(135deg, #059669, #047857)',
      subSteps: [
        { step: 1, roman: 'I', name: '올리브 잎가지 핀', desc: '단정하게 꽂힌 미니멀 올리브 잎가지' },
        { step: 2, roman: 'II', name: '황금 도토리 핀', desc: '귀여운 황금빛 도토리와 작은 잎사귀' },
        { step: 3, roman: 'III', name: '월계수 미니 화관', desc: '머리 위에 정갈하게 얹히는 라운드 월계수' },
        { step: 4, roman: 'IV', name: '싱그러운 열매 링', desc: '에메랄드 잎사귀와 빨간 베리 열매 헤일로' },
        { step: 5, roman: 'V', name: '에메랄드 리프 크라운', desc: '세 봉우리 리프 크라운과 영롱한 보석 티아라' }
      ]
    },
    {
      id: 'poseidon',
      themeId: 3,
      minLv: 11,
      maxLv: 15,
      name: '포세이돈',
      icon: '🌊',
      title: '마린 바다 랭크',
      desc: '거친 한계와 파도를 넘어선 깊은 몰입의 경지',
      mainColor: '#0284C7',
      subColor: '#38BDF8',
      accentColor: '#E0F2FE',
      glow: 'rgba(2, 132, 199, 0.45)',
      badgeGradient: 'linear-gradient(135deg, #0284C7, #0369A1)',
      subSteps: [
        { step: 1, roman: 'I', name: '청량 에어 버블', desc: '머리 위에 퐁퐁 떠오르는 투명한 방울들' },
        { step: 2, roman: 'II', name: '파스텔 조개와 아기 진주', desc: '둥글고 귀여운 조개와 빛나는 진주' },
        { step: 3, roman: 'III', name: '몽글 파도 리본', desc: '부드러운 곡선미의 파스텔 바다 리본' },
        { step: 4, roman: 'IV', name: '아쿠아 마린 드롭', desc: '눈물방울형 아쿠아마린 젬 헤드피스' },
        { step: 5, roman: 'V', name: '사파이어 오션 티아라', desc: '잔잔한 물결 위의 사파이어 미니 티아라' }
      ]
    },
    {
      id: 'zeus',
      themeId: 4,
      minLv: 16,
      maxLv: 20,
      name: '제우스',
      icon: '⚡',
      title: '썬더 스파크 랭크',
      desc: '목표를 단숨에 꿰뚫는 찬란한 황금빛 섬광',
      mainColor: '#F59E0B',
      subColor: '#FBBF24',
      accentColor: '#FEF3C7',
      glow: 'rgba(245, 158, 11, 0.5)',
      badgeGradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
      subSteps: [
        { step: 1, roman: 'I', name: '쁘띠 썬더 핀', desc: '끝이 둥글려진 앙증맞은 버터옐로우 미니 번개 헤어핀' },
        { step: 2, roman: 'II', name: '솜사탕 아기 구름과 번개', desc: '몽실몽실 아기 구름 아래 꼬마 번개' },
        { step: 3, roman: 'III', name: '별빛 번개 엠블럼', desc: '반짝이는 미니 스타와 조화로운 스파크' },
        { step: 4, roman: 'IV', name: '샴페인 골드 스파크 링', desc: '머리 위를 비추는 골든 라이트 헤일로' },
        { step: 5, roman: 'V', name: '골든 스타 크라운', desc: '별과 번개 모티브가 장식된 세련된 황금빛 미니 크라운' }
      ]
    },
    {
      id: 'cosmic',
      themeId: 5,
      minLv: 21,
      maxLv: 25,
      name: '코스믹 우주',
      icon: '🌌',
      title: '코스믹 우주 랭크',
      desc: '나만의 우주를 완성한 위대한 성취',
      mainColor: '#8B5CF6',
      subColor: '#C084FC',
      accentColor: '#EDE9FE',
      glow: 'rgba(139, 92, 246, 0.5)',
      badgeGradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
      subSteps: [
        { step: 1, roman: 'I', name: '파스텔 토성 미니 링', desc: '라벤더빛 꼬마 행성과 부드러운 궤도 링' },
        { step: 2, roman: 'II', name: '핑크빛 아기 유성', desc: '은은한 꼬리의 귀여운 별똥별 핀' },
        { step: 3, roman: 'III', name: '은하수 미니 별자리', desc: '세 개의 꼬마 별이 은은한 선으로 이어진 별자리 피스' },
        { step: 4, roman: 'IV', name: '오로라 성운 엠블럼', desc: '몽환적인 파스텔 오로라 성운 & 반짝이' },
        { step: 5, roman: 'V', name: '코스믹 인피니티 헤일로', desc: '영롱한 인피니티 링 & 다이아몬드 스타' }
      ]
    }
  ];

  function getRankThemeInfo(level) {
    var lv = Math.max(1, parseInt(level, 10) || 1);
    var matchedTheme = RANK_THEMES_5[4];
    for (var i = 0; i < RANK_THEMES_5.length; i++) {
      if (lv >= RANK_THEMES_5[i].minLv && lv <= RANK_THEMES_5[i].maxLv) {
        matchedTheme = RANK_THEMES_5[i];
        break;
      }
    }
    var theme = Object.assign({}, matchedTheme);
    var subStep = Math.min(5, ((lv - 1) % 5) + 1);
    theme.subStep = subStep;
    theme.roman = ['I', 'II', 'III', 'IV', 'V'][subStep - 1];
    theme.stepInfo = (theme.subSteps && theme.subSteps[subStep - 1]) || { step: subStep, roman: theme.roman, name: theme.name + ' ' + theme.roman, desc: theme.desc };
    theme.stepTitle = theme.name + ' ' + theme.roman;
    theme.stepFullName = (theme.id === 'sprout' ? '' : (theme.icon + ' ')) + theme.name + ' ' + theme.roman + ' (' + theme.stepInfo.name + ')';
    theme.evolutionDesc = theme.stepInfo.desc;
    theme.nextTier = (theme.themeId < 5) ? RANK_THEMES_5[theme.themeId] : null;
    theme.nextLv = (subStep < 5) ? lv + 1 : ((theme.themeId < 5) ? RANK_THEMES_5[theme.themeId].minLv : null);
    return theme;
  }

  function getRankWingsSvg(level, size, options) {
    var s = size || 38;
    var opts = options || {};
    var compact = (opts.compact === true);
    var theme = getRankThemeInfo(level);
    var tid = theme.id;
    var step = theme.subStep; // 1 ~ 5
    var c1 = theme.mainColor;
    var c2 = theme.subColor;
    var cAcc = theme.accentColor || '#FFFFFF';

    // 오버워치·롤 랭크 스타일 좌우 상징 백그라운드 윙 결합 (아바타 본체는 완벽히 비움)
    var padX = compact ? Math.round(s * 0.24) : Math.round(s * 0.30);
    var padY = compact ? Math.round(s * 0.26) : Math.round(s * 0.32);
    var totalW = s + padX * 2;
    var totalH = s + padY * 2;
    var cx = totalW / 2;
    var cy = totalH / 2;
    var bL = padX;         // 아바타 왼쪽 경계
    var bR = padX + s;     // 아바타 오른쪽 경계
    var bT = padY;         // 아바타 상단 경계
    var bB = padY + s;     // 아바타 하단 경계

    var gradId = 'rg_' + tid + '_' + step + '_' + Math.round(s);
    var defsContent = '' +
      '<defs>' +
        '<linearGradient id="' + gradId + '_main" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="' + c2 + '" />' +
          '<stop offset="100%" stop-color="' + c1 + '" />' +
        '</linearGradient>' +
        '<linearGradient id="' + gradId + '_gold" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#FEF08A" />' +
          '<stop offset="100%" stop-color="#F59E0B" />' +
        '</linearGradient>' +
        '<filter id="' + gradId + '_glow" x="-20%" y="-20%" width="140%" height="140%">' +
          '<feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="' + c1 + '" flood-opacity="0.4" />' +
        '</filter>' +
      '</defs>';

    // 1. 머리 위 헤드 오브제 (Top Emblem)
    var growthContent = '';

    if (tid === 'sprout') {
      // 새싹 오버레이 제거 (아바타 본래 조형 보존)
      growthContent = '';
    } else if (tid === 'forest') {
      // 🌲 울창한 숲
      if (step === 1) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 7) + ' ' + (bT + 1) + ' Q ' + cx + ' ' + (bT - 6) + ' ' + (cx + 8) + ' ' + (bT - 9) + '" stroke="#78350F" stroke-width="1.8" stroke-linecap="round" fill="none" />' +
          '<ellipse cx="' + (cx - 2) + '" cy="' + (bT - 5) + '" rx="3.5" ry="2" transform="rotate(-30 ' + (cx - 2) + ' ' + (bT - 5) + ')" fill="#059669" stroke="#047857" stroke-width="0.6" />' +
          '<ellipse cx="' + (cx + 4) + '" cy="' + (bT - 8) + '" rx="3.5" ry="2" transform="rotate(-20 ' + (cx + 4) + ' ' + (bT - 8) + ')" fill="#10B981" stroke="#047857" stroke-width="0.6" />' +
          '<circle cx="' + (cx + 8) + '" cy="' + (bT - 10) + '" r="1.8" fill="#A7F3D0" />' +
        '</g>';
      } else if (step === 2) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + cx + ' ' + (bT + 1) + ' L ' + cx + ' ' + (bT - 5) + '" stroke="#78350F" stroke-width="1.8" stroke-linecap="round" />' +
          '<ellipse cx="' + cx + '" cy="' + (bT - 10) + '" rx="4" ry="4.5" fill="#D97706" stroke="#B45309" stroke-width="0.7" />' +
          '<path d="M ' + (cx - 4) + ' ' + (bT - 11) + ' Q ' + cx + ' ' + (bT - 14) + ' ' + (cx + 4) + ' ' + (bT - 11) + ' Z" fill="#78350F" />' +
          '<circle cx="' + (cx - 1.2) + '" cy="' + (bT - 9.5) + '" r="1.2" fill="#FEF08A" />' +
          '<ellipse cx="' + (cx + 5) + '" cy="' + (bT - 8) + '" rx="3.2" ry="1.8" transform="rotate(35 ' + (cx + 5) + ' ' + (bT - 8) + ')" fill="#10B981" />' +
        '</g>';
      } else if (step === 3) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 13) + ' ' + (bT + 1) + ' Q ' + cx + ' ' + (bT - 10) + ' ' + (cx + 13) + ' ' + (bT + 1) + '" stroke="#047857" stroke-width="1.8" fill="none" stroke-linecap="round" />' +
          '<ellipse cx="' + (cx - 9) + '" cy="' + (bT - 6) + '" rx="3.5" ry="2" transform="rotate(-40 ' + (cx - 9) + ' ' + (bT - 6) + ')" fill="#10B981" />' +
          '<ellipse cx="' + (cx - 4) + '" cy="' + (bT - 9) + '" rx="3.5" ry="2" transform="rotate(-20 ' + (cx - 4) + ' ' + (bT - 9) + ')" fill="#34D399" />' +
          '<ellipse cx="' + (cx + 4) + '" cy="' + (bT - 9) + '" rx="3.5" ry="2" transform="rotate(20 ' + (cx + 4) + ' ' + (bT - 9) + ')" fill="#34D399" />' +
          '<ellipse cx="' + (cx + 9) + '" cy="' + (bT - 6) + '" rx="3.5" ry="2" transform="rotate(40 ' + (cx + 9) + ' ' + (bT - 6) + ')" fill="#10B981" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 9) + '" r="1.8" fill="#FDE047" />' +
        '</g>';
      } else if (step === 4) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<circle cx="' + cx + '" cy="' + (bT - 7) + '" r="7.5" fill="none" stroke="#059669" stroke-width="1.8" />' +
          '<circle cx="' + (cx - 5) + '" cy="' + (bT - 8) + '" r="2.2" fill="#EF4444" stroke="#B91C1C" stroke-width="0.6" />' +
          '<circle cx="' + (cx + 4) + '" cy="' + (bT - 10) + '" r="2.2" fill="#EF4444" stroke="#B91C1C" stroke-width="0.6" />' +
          '<circle cx="' + (cx + 2) + '" cy="' + (bT - 4) + '" r="2" fill="#EF4444" stroke="#B91C1C" stroke-width="0.6" />' +
          '<ellipse cx="' + (cx - 2) + '" cy="' + (bT - 13) + '" rx="3" ry="1.8" transform="rotate(-20 ' + (cx - 2) + ' ' + (bT - 13) + ')" fill="#34D399" />' +
        '</g>';
      } else {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<polygon points="' + (cx - 12) + ',' + (bT) + ' ' + (cx - 7) + ',' + (bT - 11) + ' ' + (cx - 3) + ',' + (bT - 4) + ' ' + cx + ',' + (bT - 14) + ' ' + (cx + 3) + ',' + (bT - 4) + ' ' + (cx + 7) + ',' + (bT - 11) + ' ' + (cx + 12) + ',' + (bT) + '" fill="url(#' + gradId + '_gold)" stroke="#B45309" stroke-width="0.8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 8) + '" r="2.4" fill="#10B981" stroke="#FFFFFF" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 7) + '" cy="' + (bT - 6) + '" r="1.6" fill="#34D399" />' +
          '<circle cx="' + (cx + 7) + '" cy="' + (bT - 6) + '" r="1.6" fill="#34D399" />' +
        '</g>';
      }
    } else if (tid === 'poseidon') {
      // 🌊 마린 바다
      if (step === 1) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<circle cx="' + (cx - 6) + '" cy="' + (bT - 6) + '" r="3.6" fill="#BAE6FD" stroke="#38BDF8" stroke-width="1" opacity="0.9" />' +
          '<circle cx="' + (cx - 7.5) + '" cy="' + (bT - 7.5) + '" r="1" fill="#FFFFFF" />' +
          '<circle cx="' + (cx + 4) + '" cy="' + (bT - 9) + '" r="4.2" fill="#E0F2FE" stroke="#0284C7" stroke-width="1" opacity="0.9" />' +
          '<circle cx="' + (cx + 2.5) + '" cy="' + (bT - 10.5) + '" r="1.2" fill="#FFFFFF" />' +
          '<circle cx="' + (cx - 1) + '" cy="' + (bT - 14) + '" r="2" fill="#BAE6FD" stroke="#38BDF8" stroke-width="0.8" />' +
        '</g>';
      } else if (step === 2) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 9) + ' ' + (bT + 1) + ' C ' + (cx - 10) + ' ' + (bT - 9) + ', ' + (cx + 10) + ' ' + (bT - 9) + ', ' + (cx + 9) + ' ' + (bT + 1) + ' Z" fill="#BAE6FD" stroke="#0284C7" stroke-width="1" />' +
          '<path d="M ' + cx + ' ' + (bT + 1) + ' L ' + (cx - 5) + ' ' + (bT - 7) + ' M ' + cx + ' ' + (bT + 1) + ' L ' + cx + ' ' + (bT - 8) + ' M ' + cx + ' ' + (bT + 1) + ' L ' + (cx + 5) + ' ' + (bT - 7) + '" stroke="#38BDF8" stroke-width="0.9" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 1) + '" r="2.6" fill="#FFFFFF" stroke="#E0F2FE" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 0.7) + '" cy="' + (bT - 1.8) + '" r="0.8" fill="#F0F9FF" />' +
        '</g>';
      } else if (step === 3) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 12) + ' ' + (bT - 4) + ' Q ' + (cx - 6) + ' ' + (bT - 11) + ' ' + cx + ' ' + (bT - 6) + ' Q ' + (cx + 6) + ' ' + (bT - 11) + ' ' + (cx + 12) + ' ' + (bT - 4) + '" stroke="#0284C7" stroke-width="2.2" fill="none" stroke-linecap="round" />' +
          '<circle cx="' + (cx - 11) + '" cy="' + (bT - 3) + '" r="2" fill="#38BDF8" />' +
          '<circle cx="' + (cx + 11) + '" cy="' + (bT - 3) + '" r="2" fill="#38BDF8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 6) + '" r="3" fill="#BAE6FD" stroke="#0284C7" stroke-width="1" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 6) + '" r="1.2" fill="#FFFFFF" />' +
        '</g>';
      } else if (step === 4) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 12) + ' ' + (bT + 1) + ' Q ' + cx + ' ' + (bT - 6) + ' ' + (cx + 12) + ' ' + (bT + 1) + '" stroke="#38BDF8" stroke-width="1.8" fill="none" stroke-linecap="round" />' +
          '<path d="M ' + cx + ' ' + (bT - 14) + ' C ' + (cx - 5) + ' ' + (bT - 7) + ', ' + (cx - 5) + ' ' + (bT - 3) + ', ' + cx + ' ' + (bT - 3) + ' C ' + (cx + 5) + ' ' + (bT - 3) + ', ' + (cx + 5) + ' ' + (bT - 7) + ', ' + cx + ' ' + (bT - 14) + ' Z" fill="#0284C7" stroke="#BAE6FD" stroke-width="1" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 5.5) + '" r="1.6" fill="#FFFFFF" />' +
          '<circle cx="' + (cx - 10) + '" cy="' + (bT - 1) + '" r="1.8" fill="#BAE6FD" />' +
          '<circle cx="' + (cx + 10) + '" cy="' + (bT - 1) + '" r="1.8" fill="#BAE6FD" />' +
        '</g>';
      } else {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 13) + ' ' + (bT + 1) + ' Q ' + cx + ' ' + (bT - 7) + ' ' + (cx + 13) + ' ' + (bT + 1) + '" stroke="#0284C7" stroke-width="2" fill="none" stroke-linecap="round" />' +
          '<polygon points="' + (cx - 10) + ',' + (bT - 1) + ' ' + (cx - 5) + ',' + (bT - 9) + ' ' + (cx - 2) + ',' + (bT - 4) + ' ' + cx + ',' + (bT - 13) + ' ' + (cx + 2) + ',' + (bT - 4) + ' ' + (cx + 5) + ',' + (bT - 9) + ' ' + (cx + 10) + ',' + (bT - 1) + '" fill="#BAE6FD" stroke="#0284C7" stroke-width="0.9" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 7.5) + '" r="2.5" fill="#0284C7" stroke="#FFFFFF" stroke-width="0.8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 7.5) + '" r="1" fill="#FFFFFF" />' +
          '<circle cx="' + (cx - 5) + '" cy="' + (bT - 5.5) + '" r="1.5" fill="#38BDF8" />' +
          '<circle cx="' + (cx + 5) + '" cy="' + (bT - 5.5) + '" r="1.5" fill="#38BDF8" />' +
        '</g>';
      }
    } else if (tid === 'zeus') {
      // ⚡ 썬더 스파크
      if (step === 1) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<polygon points="' + (cx + 1) + ',' + (bT - 12) + ' ' + (cx - 4) + ',' + (bT - 6) + ' ' + cx + ',' + (bT - 6) + ' ' + (cx - 2) + ',' + (bT) + ' ' + (cx + 5) + ',' + (bT - 7) + ' ' + (cx + 1) + ',' + (bT - 7) + '" fill="#FBBF24" stroke="#D97706" stroke-width="0.8" />' +
          '<circle cx="' + (cx + 4) + '" cy="' + (bT - 9) + '" r="1.2" fill="#FFFFFF" />' +
        '</g>';
      } else if (step === 2) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<circle cx="' + (cx - 4) + '" cy="' + (bT - 8) + '" r="4.2" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1" />' +
          '<circle cx="' + (cx + 3) + '" cy="' + (bT - 9) + '" r="4.8" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1" />' +
          '<circle cx="' + (cx - 1) + '" cy="' + (bT - 11) + '" r="3.8" fill="#FFFFFF" />' +
          '<polygon points="' + cx + ',' + (bT - 5) + ' ' + (cx - 2.5) + ',' + (bT - 1) + ' ' + cx + ',' + (bT - 1) + ' ' + (cx - 1.5) + ',' + (bT + 3) + ' ' + (cx + 2.5) + ',' + (bT - 2) + ' ' + (cx + 0.5) + ',' + (bT - 2) + '" fill="#F59E0B" />' +
        '</g>';
      } else if (step === 3) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<polygon points="' + cx + ',' + (bT - 14) + ' ' + (cx + 2.5) + ',' + (bT - 8) + ' ' + (cx + 8) + ',' + (bT - 6) + ' ' + (cx + 2.5) + ',' + (bT - 4) + ' ' + cx + ',' + (bT + 2) + ' ' + (cx - 2.5) + ',' + (bT - 4) + ' ' + (cx - 8) + ',' + (bT - 6) + ' ' + (cx - 2.5) + ',' + (bT - 8) + '" fill="#FBBF24" stroke="#D97706" stroke-width="0.8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 6) + '" r="2.2" fill="#FFFFFF" />' +
          '<circle cx="' + (cx - 6) + '" cy="' + (bT - 9) + '" r="1.2" fill="#FEF08A" />' +
          '<circle cx="' + (cx + 6) + '" cy="' + (bT - 9) + '" r="1.2" fill="#FEF08A" />' +
        '</g>';
      } else if (step === 4) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<ellipse cx="' + cx + '" cy="' + (bT - 6) + '" rx="11" ry="3.5" fill="none" stroke="#F59E0B" stroke-width="1.8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 10) + '" r="2" fill="#FEF08A" stroke="#F59E0B" stroke-width="0.7" />' +
          '<circle cx="' + (cx - 9) + '" cy="' + (bT - 6) + '" r="1.4" fill="#FFFFFF" />' +
          '<circle cx="' + (cx + 9) + '" cy="' + (bT - 6) + '" r="1.4" fill="#FFFFFF" />' +
        '</g>';
      } else {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<polygon points="' + (cx - 12) + ',' + (bT) + ' ' + (cx - 8) + ',' + (bT - 11) + ' ' + (cx - 3) + ',' + (bT - 5) + ' ' + cx + ',' + (bT - 13) + ' ' + (cx + 3) + ',' + (bT - 5) + ' ' + (cx + 8) + ',' + (bT - 11) + ' ' + (cx + 12) + ',' + (bT) + '" fill="url(#' + gradId + '_gold)" stroke="#B45309" stroke-width="0.8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 13) + '" r="1.8" fill="#FFFFFF" />' +
          '<circle cx="' + (cx - 8) + '" cy="' + (bT - 11) + '" r="1.4" fill="#FFFFFF" />' +
          '<circle cx="' + (cx + 8) + '" cy="' + (bT - 11) + '" r="1.4" fill="#FFFFFF" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 6.5) + '" r="2" fill="#FEF08A" />' +
        '</g>';
      }
    } else if (tid === 'cosmic') {
      // 🌌 코스믹 우주
      if (step === 1) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<ellipse cx="' + cx + '" cy="' + (bT - 7) + '" rx="8.5" ry="3" fill="none" stroke="#C084FC" stroke-width="1.6" transform="rotate(-15 ' + cx + ' ' + (bT - 7) + ')" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 7) + '" r="4.2" fill="#8B5CF6" stroke="#DDD6FE" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 1.2) + '" cy="' + (bT - 8.2) + '" r="1.2" fill="#FFFFFF" />' +
        '</g>';
      } else if (step === 2) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 10) + ' ' + (bT - 12) + ' Q ' + (cx - 4) + ' ' + (bT - 8) + ' ' + (cx + 5) + ' ' + (bT - 4) + '" stroke="#C084FC" stroke-width="2.2" stroke-linecap="round" fill="none" />' +
          '<path d="M ' + (cx - 8) + ' ' + (bT - 14) + ' Q ' + (cx - 2) + ' ' + (bT - 10) + ' ' + (cx + 5) + ' ' + (bT - 5) + '" stroke="#F472B6" stroke-width="1.4" stroke-linecap="round" fill="none" />' +
          '<polygon points="' + (cx + 6) + ',' + (bT - 7) + ' ' + (cx + 7.5) + ',' + (bT - 4) + ' ' + (cx + 10.5) + ',' + (bT - 3) + ' ' + (cx + 8) + ',' + (bT - 1) + ' ' + (cx + 9) + ',' + (bT + 2) + ' ' + (cx + 6) + ',' + (bT) + ' ' + (cx + 3) + ',' + (bT + 2) + ' ' + (cx + 4) + ',' + (bT - 1) + ' ' + (cx + 1.5) + ',' + (bT - 3) + ' ' + (cx + 4.5) + ',' + (bT - 4) + '" fill="#FEF08A" stroke="#F59E0B" stroke-width="0.6" />' +
        '</g>';
      } else if (step === 3) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 9) + ' ' + (bT - 5) + ' L ' + (cx - 1) + ' ' + (bT - 10) + ' L ' + (cx + 8) + ' ' + (bT - 6) + '" stroke="#DDD6FE" stroke-width="1.2" stroke-dasharray="2,2" fill="none" />' +
          '<circle cx="' + (cx - 9) + '" cy="' + (bT - 5) + '" r="2.2" fill="#8B5CF6" stroke="#FFFFFF" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 1) + '" cy="' + (bT - 10) + '" r="2.8" fill="#C084FC" stroke="#FFFFFF" stroke-width="0.8" />' +
          '<circle cx="' + (cx + 8) + '" cy="' + (bT - 6) + '" r="2.2" fill="#8B5CF6" stroke="#FFFFFF" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 1) + '" cy="' + (bT - 10) + '" r="1" fill="#FFFFFF" />' +
        '</g>';
      } else if (step === 4) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<ellipse cx="' + cx + '" cy="' + (bT - 7) + '" rx="10.5" ry="5.5" fill="#8B5CF6" opacity="0.4" />' +
          '<ellipse cx="' + cx + '" cy="' + (bT - 7) + '" rx="7" ry="4" fill="#C084FC" opacity="0.6" />' +
          '<polygon points="' + cx + ',' + (bT - 12) + ' ' + (cx + 2) + ',' + (bT - 8) + ' ' + (cx + 6) + ',' + (bT - 7) + ' ' + (cx + 2) + ',' + (bT - 6) + ' ' + cx + ',' + (bT - 2) + ' ' + (cx - 2) + ',' + (bT - 6) + ' ' + (cx - 6) + ',' + (bT - 7) + ' ' + (cx - 2) + ',' + (bT - 8) + '" fill="#FFFFFF" />' +
        '</g>';
      } else {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<ellipse cx="' + (cx - 5.5) + '" cy="' + (bT - 7) + '" rx="5.5" ry="3.5" fill="none" stroke="#C084FC" stroke-width="1.8" />' +
          '<ellipse cx="' + (cx + 5.5) + '" cy="' + (bT - 7) + '" rx="5.5" ry="3.5" fill="none" stroke="#C084FC" stroke-width="1.8" />' +
          '<polygon points="' + cx + ',' + (bT - 12) + ' ' + (cx + 2) + ',' + (bT - 8) + ' ' + (cx + 6) + ',' + (bT - 7) + ' ' + (cx + 2) + ',' + (bT - 6) + ' ' + cx + ',' + (bT - 2) + ' ' + (cx - 2) + ',' + (bT - 6) + ' ' + (cx - 6) + ',' + (bT - 7) + ' ' + (cx - 2) + ',' + (bT - 8) + '" fill="#FEF08A" stroke="#FFFFFF" stroke-width="0.6" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 7) + '" r="1.2" fill="#FFFFFF" />' +
        '</g>';
      }
    }

    // 2. 아바타 창 옆으로 레벨별 상징 백그라운드 날개/오라 (Flanks & Side Wings)
    // 원칙: 아바타 이미지 영역 [bL, bR] x [bT, bB]는 절대 가리지 않음 (x < bL 또는 x > bR)
    var sideWingsContent = '';
    var wingScale = Math.min(1.4, Math.max(0.7, s / 44));
    var midY = bT + s * 0.52; // 아바타 세로 중심부

    if (tid === 'sprout') {
      // 🌱 새싹 5단계: 귀여운 아기 떡잎 -> 쌍떡잎 날개 -> 덩굴 클로버 -> 잎사귀 날개 -> 만개한 꽃잎 윙
      var spW = Math.round(7 * wingScale);
      var spH = Math.round(11 * wingScale);
      var spDepth = Math.round(step * 1.5 * wingScale);

      sideWingsContent = '<g class="avatar-rank-side-wings rank-wings-sprout" filter="url(#' + gradId + '_glow)">' +
        // 좌측 새싹 날개
        '<path d="M ' + (bL + 1) + ' ' + (midY + 4) + ' C ' + (bL - spW - spDepth) + ' ' + (midY + 2) + ', ' + (bL - spW - spDepth - 2) + ' ' + (midY - spH) + ', ' + (bL - 2) + ' ' + (midY - 6) + ' Z" fill="#34D399" stroke="#059669" stroke-width="0.8" opacity="0.9" />' +
        (step >= 2 ? '<circle cx="' + (bL - spW) + '" cy="' + (midY - 4) + '" r="' + (1.2 * wingScale) + '" fill="#FFFFFF" />' : '') +
        (step >= 3 ? '<path d="M ' + (bL + 1) + ' ' + (midY + 10) + ' C ' + (bL - spW * 0.8) + ' ' + (midY + 12) + ', ' + (bL - spW * 0.9) + ' ' + (midY + 2) + ', ' + (bL) + ' ' + (midY + 4) + ' Z" fill="#10B981" />' : '') +
        // 우측 새싹 날개 (완벽 대칭)
        '<path d="M ' + (bR - 1) + ' ' + (midY + 4) + ' C ' + (bR + spW + spDepth) + ' ' + (midY + 2) + ', ' + (bR + spW + spDepth + 2) + ' ' + (midY - spH) + ', ' + (bR + 2) + ' ' + (midY - 6) + ' Z" fill="#34D399" stroke="#059669" stroke-width="0.8" opacity="0.9" />' +
        (step >= 2 ? '<circle cx="' + (bR + spW) + '" cy="' + (midY - 4) + '" r="' + (1.2 * wingScale) + '" fill="#FFFFFF" />' : '') +
        (step >= 3 ? '<path d="M ' + (bR - 1) + ' ' + (midY + 10) + ' C ' + (bR + spW * 0.8) + ' ' + (midY + 12) + ', ' + (bR + spW * 0.9) + ' ' + (midY + 2) + ', ' + (bR) + ' ' + (midY + 4) + ' Z" fill="#10B981" />' : '') +
      '</g>';
    } else if (tid === 'forest') {
      // 🌲 숲 5단계: 올리브 잎가지 날개 -> 에메랄드 숲의 수호 날개
      var foW = Math.round(9 * wingScale);
      var foH = Math.round(14 * wingScale);
      var foSpread = Math.round(step * 1.8 * wingScale);

      sideWingsContent = '<g class="avatar-rank-side-wings rank-wings-forest" filter="url(#' + gradId + '_glow)">' +
        // 좌측 숲 날개
        '<path d="M ' + (bL + 1) + ' ' + (midY + 6) + ' Q ' + (bL - foW - foSpread) + ' ' + (midY) + ' ' + (bL - 3) + ' ' + (midY - foH) + ' Q ' + (bL - foW * 0.5) + ' ' + (midY - 4) + ' ' + (bL + 1) + ' ' + (midY + 6) + '" fill="#059669" stroke="#047857" stroke-width="0.9" />' +
        '<circle cx="' + (bL - foW * 0.7) + '" cy="' + (midY - 3) + '" r="' + (1.4 * wingScale) + '" fill="#A7F3D0" />' +
        (step >= 3 ? '<path d="M ' + (bL + 1) + ' ' + (midY + 12) + ' Q ' + (bL - foW) + ' ' + (midY + 8) + ' ' + (bL - 1) + ' ' + (midY + 2) + '" fill="#10B981" />' : '') +
        // 우측 숲 날개
        '<path d="M ' + (bR - 1) + ' ' + (midY + 6) + ' Q ' + (bR + foW + foSpread) + ' ' + (midY) + ' ' + (bR + 3) + ' ' + (midY - foH) + ' Q ' + (bR + foW * 0.5) + ' ' + (midY - 4) + ' ' + (bR - 1) + ' ' + (midY + 6) + '" fill="#059669" stroke="#047857" stroke-width="0.9" />' +
        '<circle cx="' + (bR + foW * 0.7) + '" cy="' + (midY - 3) + '" r="' + (1.4 * wingScale) + '" fill="#A7F3D0" />' +
        (step >= 3 ? '<path d="M ' + (bR - 1) + ' ' + (midY + 12) + ' Q ' + (bR + foW) + ' ' + (midY + 8) + ' ' + (bR + 1) + ' ' + (midY + 2) + '" fill="#10B981" />' : '') +
      '</g>';
    } else if (tid === 'poseidon') {
      // 🌊 포세이돈 5단계: 청량 파도 윙 -> 사파이어 오션 날개
      var poW = Math.round(10 * wingScale);
      var poH = Math.round(15 * wingScale);
      var poWave = Math.round(step * 2 * wingScale);

      sideWingsContent = '<g class="avatar-rank-side-wings rank-wings-poseidon" filter="url(#' + gradId + '_glow)">' +
        // 좌측 파도 날개
        '<path d="M ' + (bL + 1) + ' ' + (midY + 8) + ' C ' + (bL - poW - poWave) + ' ' + (midY + 4) + ', ' + (bL - poW - 4) + ' ' + (midY - poH) + ', ' + (bL - 2) + ' ' + (midY - 6) + ' Q ' + (bL - poW * 0.6) + ' ' + (midY + 2) + ' ' + (bL + 1) + ' ' + (midY + 8) + '" fill="#38BDF8" stroke="#0284C7" stroke-width="1" />' +
        '<circle cx="' + (bL - poW * 0.8) + '" cy="' + (midY - 1) + '" r="' + (1.5 * wingScale) + '" fill="#E0F2FE" />' +
        (step >= 3 ? '<circle cx="' + (bL - poW * 0.4) + '" cy="' + (midY - 8) + '" r="' + (1.2 * wingScale) + '" fill="#FFFFFF" />' : '') +
        // 우측 파도 날개
        '<path d="M ' + (bR - 1) + ' ' + (midY + 8) + ' C ' + (bR + poW + poWave) + ' ' + (midY + 4) + ', ' + (bR + poW + 4) + ' ' + (midY - poH) + ', ' + (bR + 2) + ' ' + (midY - 6) + ' Q ' + (bR + poW * 0.6) + ' ' + (midY + 2) + ' ' + (bR - 1) + ' ' + (midY + 8) + '" fill="#38BDF8" stroke="#0284C7" stroke-width="1" />' +
        '<circle cx="' + (bR + poW * 0.8) + '" cy="' + (midY - 1) + '" r="' + (1.5 * wingScale) + '" fill="#E0F2FE" />' +
        (step >= 3 ? '<circle cx="' + (bR + poW * 0.4) + '" cy="' + (midY - 8) + '" r="' + (1.2 * wingScale) + '" fill="#FFFFFF" />' : '') +
      '</g>';
    } else if (tid === 'zeus') {
      // ⚡ 제우스 5단계: 황금 번개 스파크 윙 -> 골든 썬더 볼트 백그라운드
      var zeW = Math.round(11 * wingScale);
      var zeH = Math.round(16 * wingScale);
      var zeSpark = Math.round(step * 2.2 * wingScale);

      sideWingsContent = '<g class="avatar-rank-side-wings rank-wings-zeus" filter="url(#' + gradId + '_glow)">' +
        // 좌측 번개 날개
        '<polygon points="' + (bL + 1) + ',' + (midY - 2) + ' ' + (bL - zeW * 0.6) + ',' + (midY - zeH * 0.6) + ' ' + (bL - zeW * 0.3) + ',' + (midY - zeH * 0.2) + ' ' + (bL - zeW - zeSpark) + ',' + (midY + 2) + ' ' + (bL - zeW * 0.4) + ',' + (midY + 5) + ' ' + (bL + 1) + ',' + (midY + 9) + '" fill="#FBBF24" stroke="#D97706" stroke-width="0.8" />' +
        '<circle cx="' + (bL - zeW * 0.7) + '" cy="' + (midY) + '" r="' + (1.5 * wingScale) + '" fill="#FFFFFF" />' +
        // 우측 번개 날개
        '<polygon points="' + (bR - 1) + ',' + (midY - 2) + ' ' + (bR + zeW * 0.6) + ',' + (midY - zeH * 0.6) + ' ' + (bR + zeW * 0.3) + ',' + (midY - zeH * 0.2) + ' ' + (bR + zeW + zeSpark) + ',' + (midY + 2) + ' ' + (bR + zeW * 0.4) + ',' + (midY + 5) + ' ' + (bR - 1) + ',' + (midY + 9) + '" fill="#FBBF24" stroke="#D97706" stroke-width="0.8" />' +
        '<circle cx="' + (bR + zeW * 0.7) + '" cy="' + (midY) + '" r="' + (1.5 * wingScale) + '" fill="#FFFFFF" />' +
      '</g>';
    } else {
      // 🌌 코스믹 우주 5단계: 은하수 궤도 링 & 신비로운 오로라 성운 윙
      var coW = Math.round(12 * wingScale);
      var coH = Math.round(16 * wingScale);
      var coOrbit = Math.round(step * 2.5 * wingScale);

      sideWingsContent = '<g class="avatar-rank-side-wings rank-wings-cosmic" filter="url(#' + gradId + '_glow)">' +
        // 좌측 코스믹 성운 윙
        '<ellipse cx="' + (bL - coW * 0.6) + '" cy="' + (midY + 2) + '" rx="' + (coW * 0.7 + coOrbit * 0.3) + '" ry="' + (coH * 0.5) + '" fill="#C084FC" opacity="0.8" transform="rotate(-20 ' + (bL - coW * 0.6) + ' ' + (midY + 2) + ')" />' +
        '<circle cx="' + (bL - coW * 0.7) + '" cy="' + (midY - 2) + '" r="' + (1.8 * wingScale) + '" fill="#FFFFFF" />' +
        '<circle cx="' + (bL - coW * 0.4) + '" cy="' + (midY + 6) + '" r="' + (1.2 * wingScale) + '" fill="#EDE9FE" />' +
        // 우측 코스믹 성운 윙
        '<ellipse cx="' + (bR + coW * 0.6) + '" cy="' + (midY + 2) + '" rx="' + (coW * 0.7 + coOrbit * 0.3) + '" ry="' + (coH * 0.5) + '" fill="#C084FC" opacity="0.8" transform="rotate(20 ' + (bR + coW * 0.6) + ' ' + (midY + 2) + ')" />' +
        '<circle cx="' + (bR + coW * 0.7) + '" cy="' + (midY - 2) + '" r="' + (1.8 * wingScale) + '" fill="#FFFFFF" />' +
        '<circle cx="' + (bR + coW * 0.4) + '" cy="' + (midY + 6) + '" r="' + (1.2 * wingScale) + '" fill="#EDE9FE" />' +
      '</g>';
    }

    return '<svg class="rank-bg-svg-layer rank-theme-' + tid + ' rank-step-' + step + '" width="' + totalW + '" height="' + totalH + '" viewBox="0 0 ' + totalW + ' ' + totalH + '" style="position:absolute;left:-' + padX + 'px;top:-' + padY + 'px;pointer-events:none;z-index:1;overflow:visible;">' +
      defsContent +
      sideWingsContent +
      growthContent +
    '</svg>';
  }

  // 아바타 HTML 렌더링 (25단계 상징 랭크 백그라운드 & 입체 프레임 결합)
  function renderAvatarHtml(level, profile, options) {
    var opts = options || {};
    var size = opts.size || 38;
    var compact = (opts.compact === true);
    var settings = (profile && profile.settings) || {};
    var customUrl = (settings.customAvatarUrl) || (profile && profile.avatarUrl) || (profile && profile.avatarImage) || '';
    var userAvatar = (profile && profile.avatar) || (settings && settings.equippedAvatar) || (profile && profile.avatarIcon) || '';
    if (typeof userAvatar === 'object' && userAvatar !== null) {
      userAvatar = userAvatar.emoji || userAvatar.icon || '';
    }
    if (!userAvatar && !customUrl) {
      userAvatar = '🦁'; // 기본 웰컴 페르소나
    }
    var withRankBg = (opts.withRankBg !== false);
    var rankTheme = getRankThemeInfo(level);

    var innerFrameHtml = '';
    var borderW = compact ? '2px' : '2.5px';
    var boxRadius = compact ? '10px' : '14px';

    // 🌟 레벨 뱃지: 새싹(🌱) 침범 방지 & 순수 레벨 표기
    var pillContent = 'Lv.' + level;
    if (rankTheme.id !== 'sprout' && rankTheme.icon) {
      pillContent = rankTheme.icon + ' ' + rankTheme.roman;
    }

    if (customUrl && customUrl.length > 5) {
      innerFrameHtml = '<div class="custom-avatar-frame avatar-inner-box" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + boxRadius + ';overflow:hidden;border:' + borderW + ' solid ' + rankTheme.mainColor + ';position:relative;background:#fff;display:flex;align-items:center;justify-content:center;z-index:2;box-shadow:0 0 10px ' + rankTheme.glow + ';box-sizing:border-box;">' +
        '<img src="' + customUrl + '" alt="아바타" style="width:100%;height:100%;object-fit:cover;display:block;">' +
      '</div>';
    } else if (userAvatar && userAvatar !== 'robot') {
      var emojiSize = Math.round(size * 0.52);
      innerFrameHtml = '<div class="persona-avatar-frame avatar-inner-box" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + boxRadius + ';overflow:hidden;background:var(--surface-2, #1e293b);border:' + borderW + ' solid ' + rankTheme.mainColor + ';display:flex;align-items:center;justify-content:center;position:relative;z-index:2;box-shadow:0 0 10px ' + rankTheme.glow + ';box-sizing:border-box;user-select:none;">' +
        '<span style="font-size:' + emojiSize + 'px;line-height:1;display:inline-block;transform:translateY(1px);">' + userAvatar + '</span>' +
      '</div>';
    } else {
      innerFrameHtml = '<div class="robot-avatar-frame avatar-inner-box" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + boxRadius + ';overflow:hidden;background:var(--surface-2);border:' + borderW + ' solid ' + rankTheme.mainColor + ';display:flex;align-items:center;justify-content:center;position:relative;z-index:2;box-shadow:0 0 10px ' + rankTheme.glow + ';box-sizing:border-box;">' +
        getRobotAvatarSvg(level, size) +
      '</div>';
    }

    if (!withRankBg) {
      return innerFrameHtml;
    }

    var wingsSvg = getRankWingsSvg(level, size, opts);
    return '<div class="avatar-rank-aura-wrap rank-theme-' + rankTheme.id + ' rank-step-' + rankTheme.subStep + '" title="' + rankTheme.stepFullName + ' — ' + rankTheme.evolutionDesc + '" style="position:relative;display:inline-flex;align-items:center;justify-content:center;overflow:visible;">' +
      wingsSvg +
      innerFrameHtml +
    '</div>';
  }

  AV.getRobotAvatarSvg = getRobotAvatarSvg;
  AV.getWoodHammerMakerAnimationHtml = getWoodHammerMakerAnimationHtml;
  AV.RANK_THEMES_5 = RANK_THEMES_5;
  AV.getRankThemeInfo = getRankThemeInfo;
  AV.getRankWingsSvg = getRankWingsSvg;
  AV.renderAvatarHtml = renderAvatarHtml;
}));
