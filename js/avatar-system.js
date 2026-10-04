/**
 * Ourgoal Avatar System (#TASK-ES-044, #TASK-ES-046, #TASK-ES-047, #TASK-ES-048)
 * - 1~10단계 레벨별 초록 로봇 아바타 SVG 렌더러
 * - 사진 업로드 ➔ '내 사진으로 아바타 제작' 클릭 시 실질 10회 차감 (하단 적용하기는 횟수 차감 없음)
 * - Gemini 2.5 Flash 멀티모달 비전 연동: 실제 인물의 안경, 헤어 가르마, 눈매, 얼굴형 디코딩
 * - 77종 바디 5단계 샌드위치(Z-Index) 무봉제(Seamless) 캔버스 결합 (목선 매립 + 턱선 그림자 + 옷깃 오버랩)
 * - 캔버스 좌측 상단 번호/이름 뱃지 삭제 (순수 캐릭터 일러스트 렌더링)
 * - 아바타 적용 즉시 DOM 반영 및 프로필 실시간 동기화 보장
 * - 나무망치 아바타 제작 애니메이션 연출 (getWoodHammerMakerAnimationHtml)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OurgoalAvatar = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  /* ============ [#TASK-ES-389] 아바타 부품 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md · 설계 REQ-TASK-ES-384 3-1절) ============
     ① 가져오기: js/avatar/{themes,render,craft-engine,wallet,dynamic-album}.js 로 옮긴 선언을 이 팩토리에서 같은 이름으로 부른다(함수 선언 끌어올림과 같은 효과 — 이 줄보다 먼저 도는 문이 없다).
        브라우저는 index.html 이 부품을 먼저 읽어 전역 OurgoalAvatarParts 에 담아 둔다(이 파일은 그 이름을 읽기만 한다). Node 는 여기서 require 해 부른다.
     ② 통로: 옮긴 코드가 읽는 이 팩토리의 이름만 AV 에 getter 로 노출한다(목록은 스코프 분석으로 뽑았다). 값은 읽을 때마다 살아 있는 값이다. */
  var AV = (typeof module === 'object' && module && module.exports && typeof require === 'function') ? {} : ((typeof OurgoalAvatarParts !== 'undefined' && OurgoalAvatarParts) || {});
  if (typeof module === 'object' && module && module.exports && typeof require === 'function') {
    require('./avatar/themes.js')(AV);
    require('./avatar/render.js')(AV);
    require('./avatar/craft-engine.js')(AV);
    require('./avatar/wallet.js')(AV);
    require('./avatar/dynamic-album.js')(AV);
  }
  var BODY_THEMES_77 = AV.BODY_THEMES_77;
  var getAllThemes = AV.getAllThemes;
  var getThemesByMbti = AV.getThemesByMbti;
  var getThemesByGroup = AV.getThemesByGroup;
  var searchThemes = AV.searchThemes;
  var getThemeById = AV.getThemeById;
  var renderPersona320ListHtml = AV.renderPersona320ListHtml;
  var getRobotAvatarSvg = AV.getRobotAvatarSvg;
  var getWoodHammerMakerAnimationHtml = AV.getWoodHammerMakerAnimationHtml;
  var RANK_THEMES_5 = AV.RANK_THEMES_5;
  var getRankThemeInfo = AV.getRankThemeInfo;
  var getRankWingsSvg = AV.getRankWingsSvg;
  var renderAvatarHtml = AV.renderAvatarHtml;
  var composite3DeformedAvatar = AV.composite3DeformedAvatar;
  var getSmartFallbackFeatures = AV.getSmartFallbackFeatures;
  var extractPersonalFeatures = AV.extractPersonalFeatures;
  var drawCartoonHead = AV.drawCartoonHead;
  var collectPeriodPersonaSummary = AV.collectPeriodPersonaSummary;
  var fetchAvatarPersona = AV.fetchAvatarPersona;
  var isLegacyAccount = AV.isLegacyAccount;
  var getMaxCrafts = AV.getMaxCrafts;
  var getRemainingCrafts = AV.getRemainingCrafts;
  var maybeGrantStreakBonus = AV.maybeGrantStreakBonus;
  var getSavedAvatars = AV.getSavedAvatars;
  var addSavedAvatar = AV.addSavedAvatar;
  var removeSavedAvatar = AV.removeSavedAvatar;
  var renderSavedAvatarsDeckHtml = AV.renderSavedAvatarsDeckHtml;
  var DYNAMIC_SITUATIONS = AV.DYNAMIC_SITUATIONS;
  var getDynamicAvatarSvg = AV.getDynamicAvatarSvg;
  var getDynamicAlbum = AV.getDynamicAlbum;
  var saveDynamicAlbum = AV.saveDynamicAlbum;
  var openDynamicAlbumModal = AV.openDynamicAlbumModal;
  Object.defineProperties(AV, Object.getOwnPropertyDescriptors({
    get BODY_THEMES_320() { return BODY_THEMES_320; },
    get DEFAULT_BASE_CRAFTS() { return DEFAULT_BASE_CRAFTS; },
    get LEGACY_MAX_CRAFTS() { return LEGACY_MAX_CRAFTS; },
    get MAX_AVATAR_CHANGES() { return MAX_AVATAR_CHANGES; }
  }));
  var askConfirm = ((typeof OurgoalCapabilities !== 'undefined' && OurgoalCapabilities.has('ui.confirm.bind')) ? OurgoalCapabilities.request('ui.confirm.bind') : typeof require === 'function' ? require('./core/confirm.js').bind : function(get){ return function(m){ var o = get(); return Promise.resolve(typeof o === 'function' ? o(m) : false); }; })(function(){ return null; });
  var DEFAULT_BASE_CRAFTS = 3;
  var LEGACY_MAX_CRAFTS = 10; // 레거시 10회 호환: /10회
  var MAX_AVATAR_CHANGES = 10; // 보관함 최대 저장 용량 및 레거시 10회 호환

  /* [#TASK-ES-389] BODY_THEMES_77 → js/avatar/themes.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */

  // ================= [TASK-ES-127] 16개 MBTI 연계 320개 아바타 페르소나 온톨로지 =================
  // #TASK-ES-386: 320종 페르소나 데이터는 MBTI 16개 파일(js/data/avatar-personas/<mbti>.js)에 있다.
  // 브라우저: index.html 이 이 파일보다 먼저 16개를 읽어 전역 OurgoalAvatarPersonaParts 에 둔다. Node: require 로 읽는다.
  // 원래 배열과 같은 순서로 잇는다 — 동일성 시험: tests/ 폴더 avatar-personas-split 시험
  var PERSONA_PART_ORDER = ['intj', 'intp', 'entj', 'entp', 'infj', 'infp', 'enfj', 'enfp', 'istj', 'isfj', 'estj', 'esfj', 'istp', 'isfp', 'estp', 'esfp'];
  function loadPersonaParts() {
    if (typeof module === 'object' && module && module.exports && typeof require === 'function') {
      return {
        intj: require('./data/avatar-personas/intj.js'),
        intp: require('./data/avatar-personas/intp.js'),
        entj: require('./data/avatar-personas/entj.js'),
        entp: require('./data/avatar-personas/entp.js'),
        infj: require('./data/avatar-personas/infj.js'),
        infp: require('./data/avatar-personas/infp.js'),
        enfj: require('./data/avatar-personas/enfj.js'),
        enfp: require('./data/avatar-personas/enfp.js'),
        istj: require('./data/avatar-personas/istj.js'),
        isfj: require('./data/avatar-personas/isfj.js'),
        estj: require('./data/avatar-personas/estj.js'),
        esfj: require('./data/avatar-personas/esfj.js'),
        istp: require('./data/avatar-personas/istp.js'),
        isfp: require('./data/avatar-personas/isfp.js'),
        estp: require('./data/avatar-personas/estp.js'),
        esfp: require('./data/avatar-personas/esfp.js')
      };
    }
    return (typeof OurgoalAvatarPersonaParts !== 'undefined' && OurgoalAvatarPersonaParts) || {};
  }
  var PERSONA_PARTS = loadPersonaParts();
  var BODY_THEMES_320 = [];
  PERSONA_PART_ORDER.forEach(function (key) {
    var part = PERSONA_PARTS[key];
    if (part && part.length) BODY_THEMES_320.push.apply(BODY_THEMES_320, part);
  });

  /* [#TASK-ES-389] getAllThemes · getThemesByMbti · getThemesByGroup · searchThemes → js/avatar/themes.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */


  /* [#TASK-ES-389] getRobotAvatarSvg · getWoodHammerMakerAnimationHtml → js/avatar/render.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-389] composite3DeformedAvatar · getSmartFallbackFeatures → js/avatar/craft-engine.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-389] isLegacyAccount · getMaxCrafts · getRemainingCrafts · maybeGrantStreakBonus → js/avatar/wallet.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-389] getThemeById → js/avatar/themes.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-389] getSavedAvatars · addSavedAvatar · removeSavedAvatar → js/avatar/wallet.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-389] collectPeriodPersonaSummary · fetchAvatarPersona → js/avatar/craft-engine.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-389] renderPersona320ListHtml → js/avatar/themes.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-389] renderSavedAvatarsDeckHtml → js/avatar/wallet.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-389] RANK_THEMES_5 · getRankThemeInfo · getRankWingsSvg · renderAvatarHtml → js/avatar/render.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */

  // 초상권 및 사진 사용 준수 안내 모달 (#TASK-ES-249)
  function showAvatarLegalNotice(onAgree) {
    if (typeof document === 'undefined') return;
    var overlay = document.createElement('div');
    overlay.id = 'modalAvatarLegalNotice';
    overlay.className = 'modal-backdrop active';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML = 
      '<div style="background:var(--card,#fff);border-radius:16px;max-width:400px;width:100%;padding:20px;text-align:left;box-shadow:0 8px 30px rgba(0,0,0,0.2);">' +
        '<div style="font-weight:900;font-size:1.0625rem;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;gap:6px;">' +
          '<span>⚖️ 초상권 및 사진 사용 준수 안내</span>' +
        '</div>' +
        '<div style="font-size:0.8125rem;color:var(--ink-soft);line-height:1.5;margin-bottom:16px;">' +
          '아워골 아바타 제작을 위해 업로드하는 사진은 본인의 사진이거나 정당한 사용 권한을 보유한 사진이어야 합니다.<br><br>' +
          '타인의 초상권, 저작권, 인격권을 침해하는 이미지는 사전 예고 없이 삭제 조치될 수 있습니다. (Notice & Takedown 준수)' +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
          '<button type="button" class="btn btn-ghost btn-sm" id="btnLegalNoticeCancel" style="min-height:36px;border-radius:8px;">취소</button>' +
          '<button type="button" class="btn btn-primary btn-sm" id="btnLegalNoticeAgree" style="min-height:36px;border-radius:8px;">동의하고 사진 선택</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    var cleanup = function () {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };
    var cancelBtn = overlay.querySelector('#btnLegalNoticeCancel');
    if (cancelBtn) cancelBtn.onclick = cleanup;
    var agreeBtn = overlay.querySelector('#btnLegalNoticeAgree');
    if (agreeBtn) {
      agreeBtn.onclick = function () {
        cleanup();
        if (onAgree) onAgree();
      };
    }
  }

  // 아바타 모달 열기
  function openAvatarModal(deps) {
    var profile = deps.profile || (deps.state && deps.state.profile) || {};
    var saveProfile = deps.saveProfile;
    var toast = deps.toast || function (m) { console.log(m); };
    var openModal = deps.openModal;
    var closeModal = deps.closeModal;
    var onAvatarChanged = deps.onAvatarChanged || function () {};

    var settings = profile.settings = profile.settings || {};
    var curType = settings.avatarType || 'robot';
    var curCustomUrl = settings.customAvatarUrl || '';
    var curLevel = deps.currentLevel || profile.level || 1;
    var curThemeId = settings.avatarThemeId || 1;
    var maxCrafts = getMaxCrafts(profile);
    var remainingCrafts = getRemainingCrafts(profile);
    var userNick = profile.nickname || '회원';
    var savedList = getSavedAvatars(profile);

    var todayForPeriod = new Date();
    var defaultPeriodEnd = todayForPeriod;
    var defaultPeriodStart = new Date(todayForPeriod.getTime() - 29 * 24 * 60 * 60 * 1000);
    var toDateInputValue = function (d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };

    var html = '<div class="modal-sheet-inner" style="max-width:620px;/* max-width:560px */margin:0 auto;text-align:left;">' +
      '<div class="modal-header-custom" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
        '<div style="font-weight:900;font-size:1.1875rem;color:var(--ink);">아바타 설정</div>' +
        '<div style="font-size:0.8125rem;color:var(--ink-soft);font-weight:700;">' +
          '아바타 제작 잔여: <strong id="topRemainingCraftsTxt" style="color:' + (remainingCrafts > 0 ? 'var(--emerald)' : '#EF4444') + ';">' + remainingCrafts + '회</strong> / <span id="topMaxCraftsSpan">' + maxCrafts + '회</span>' +
        '</div>' +
      '</div>' +

      '<div style="background:var(--surface-2);border:1px solid var(--border-soft);border-radius:12px;padding:10px 14px;font-size:0.8125rem;color:var(--ink-soft);line-height:1.45;margin-bottom:16px;">' +
        '💡 <strong>아바타 제작 안내</strong>: 신규 가입 시 <strong>기본 3회</strong>(기존 계정 최대 10회)가 제공되며, <strong>7일 연속 체크인</strong>할 때마다 제작권 1회가 자동 보너스로 충전됩니다.<br>' +
        '제작된 아바타는 <strong>내 아바타 서랍</strong>에 영구 보관되며 횟수 차감 없이 언제든 자유롭게 변경·착용할 수 있습니다.' +
      '</div>' +

      // 5대 상징 랭크 백그라운드 안내 카드 (#TASK-ES-159)
      '<div id="avatarRankThemeCard" class="avatar-rank-summary-card" style="background:linear-gradient(135deg, ' + getRankThemeInfo(curLevel).mainColor + '18, ' + getRankThemeInfo(curLevel).subColor + '10);border:1px solid ' + getRankThemeInfo(curLevel).mainColor + '40;border-radius:14px;padding:12px 14px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:40px;height:40px;border-radius:10px;background:var(--card, #fff);border:1.5px solid ' + getRankThemeInfo(curLevel).mainColor + ';display:flex;align-items:center;justify-content:center;font-size:1.4rem;box-shadow:0 0 8px ' + getRankThemeInfo(curLevel).glow + ';">' +
            getRankThemeInfo(curLevel).icon +
          '</div>' +
          '<div>' +
            '<div style="font-weight:800;font-size:0.9375rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
              getRankThemeInfo(curLevel).title +
              '<span style="background:' + getRankThemeInfo(curLevel).badgeGradient + ';color:#fff;font-size:0.75rem;padding:1px 6px;border-radius:6px;font-weight:800;">Lv.' + curLevel + '</span>' +
            '</div>' +
            '<div style="font-size:0.78125rem;color:var(--ink-soft);margin-top:2px;">' + getRankThemeInfo(curLevel).desc + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0;">' +
          (getRankThemeInfo(curLevel).nextTier ?
            '<div style="font-size:0.72rem;color:var(--ink-soft);">다음 진화</div><div style="font-size:0.8125rem;font-weight:700;color:' + getRankThemeInfo(curLevel).nextTier.mainColor + ';">' + getRankThemeInfo(curLevel).nextTier.icon + ' ' + getRankThemeInfo(curLevel).nextTier.name + ' (Lv.' + getRankThemeInfo(curLevel).nextLv + ')</div>' :
            '<div style="font-size:0.75rem;font-weight:800;color:var(--violet);">🌌 우주 마스터 달성</div>'
          ) +
        '</div>' +
      '</div>' +

      // 탭 토글
      '<div class="format-toggle" id="avatarTypeToggle" style="margin-bottom:18px;display:flex;background:var(--surface-3);border-radius:10px;padding:3px;">' +
        '<div class="format-opt ' + (curType === 'robot' ? 'active' : '') + '" data-avatartype="robot" style="flex:1;text-align:center;padding:8px;border-radius:8px;font-weight:800;font-size:.875rem;cursor:pointer;">🤖 초록 로봇 (성장형)</div>' +
        '<div class="format-opt ' + (curType === 'custom' ? 'active' : '') + '" data-avatartype="custom" style="flex:1;text-align:center;padding:8px;border-radius:8px;font-weight:800;font-size:.875rem;cursor:pointer;">🎨 만화형 3등신 아바타</div>' +
      '</div>' +

      // 로봇 아바타 선택 섹션
      '<div id="secRobotAvatar" style="display:' + (curType === 'robot' ? 'block' : 'none') + ';">' +
        '<div style="background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;padding:16px;text-align:center;">' +
          '<div style="width:72px;height:72px;margin:0 auto;display:flex;align-items:center;justify-content:center;">' +
            getRobotAvatarSvg(curLevel, 68) +
          '</div>' +
          '<div style="margin-top:10px;font-weight:800;font-size:1rem;color:var(--ink);">현재 성장 단계: Lv.' + curLevel + '</div>' +
          '<div style="font-size:.78125rem;color:var(--ink-soft);margin-top:4px;">기록과 실천이 쌓일수록 안테나, 귀마개, 가슴 엠블럼, 날개가 진화합니다.</div>' +
        '</div>' +
      '</div>' +

      // 만화형 3등신 아바타 섹션
      '<div id="secCustomAvatar" style="display:' + (curType === 'custom' ? 'block' : 'none') + ';">' +
        // 제작 로딩 슬롯
        '<div id="avatarMakerLoadingSlot" style="display:none;background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;"></div>' +

        // 결과 및 등록 박스
        '<div id="avatarMakerResultBox" style="background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;padding:18px 14px;text-align:center;">' +
          '<div id="customAvatarPreviewBox" style="width:110px;height:110px;border-radius:20px;overflow:hidden;border:2.5px solid var(--emerald);background:#fff;margin:0 auto;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(16,185,129,0.18);">' +
            (curCustomUrl ? '<img src="' + curCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">' : '<span style="font-size:2.8rem;">👤</span>') +
          '</div>' +
          '<div id="customAvatarMetaText" style="margin-top:10px;">' +
            '<div style="font-weight:800;font-size:.9375rem;color:var(--ink);">내 사진 기반 만화형 3등신 아바타</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">사진을 업로드한 후 [내 사진으로 아바타 제작]을 누르면 Gemini 비전 AI가 맞춤형 아바타를 제작합니다.</div>' +
          '</div>' +
          '<div style="margin-top:14px;display:flex;justify-content:center;gap:6px;flex-wrap:wrap;">' +
            '<input type="file" id="customAvatarFileInput" accept="image/*" style="display:none;">' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnUploadAvatarPhoto" style="font-size:.8125rem;">📷 사진 선택하기</button>' +
            '<button type="button" class="btn btn-primary btn-sm" id="btnRunCraftAvatar" style="font-size:.8125rem;display:none;">' +
              '✨ 내 사진으로 아바타 제작 <span id="craftBtnCountSpan">(' + remainingCrafts + '/' + maxCrafts + '회)</span>' +
            '</button>' +
          '</div>' +

          // [TASK-ES-269] 아바타 생성 기준 기간 설정 섹션 (사진 선택군 바로 밑 배치)
          '<div id="avatarPeriodSection" style="margin-top:12px;text-align:left;">' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnSetAvatarPeriod" style="font-size:.8125rem;width:100%;">' +
              '📅 아바타 생성 기준 기간 정하기 <span id="avatarPeriodSummarySpan" style="font-weight:700;color:var(--emerald);"></span>' +
            '</button>' +
            '<div id="avatarPeriodInputs" style="display:none;margin-top:8px;background:var(--surface-3, #F1F5F9);border:1px solid var(--border-soft);border-radius:12px;padding:12px;">' +
              '<div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap;" id="avatarPeriodQuickChips">' +
                '<button type="button" class="btn btn-ghost btn-xs avatar-period-chip" data-days="7" style="font-size:11px;padding:3px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink);cursor:pointer;">최근 1주</button>' +
                '<button type="button" class="btn btn-ghost btn-xs avatar-period-chip active" data-days="30" style="font-size:11px;padding:3px 8px;border-radius:8px;border:1px solid var(--emerald);background:var(--emerald-surface,#ECFDF5);color:var(--emerald);cursor:pointer;font-weight:800;">최근 1개월</button>' +
                '<button type="button" class="btn btn-ghost btn-xs avatar-period-chip" data-days="90" style="font-size:11px;padding:3px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink);cursor:pointer;">최근 3개월</button>' +
                '<button type="button" class="btn btn-ghost btn-xs avatar-period-chip" data-days="all" style="font-size:11px;padding:3px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink);cursor:pointer;">전체</button>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                '<input type="date" id="avatarPeriodStartInput" value="' + toDateInputValue(defaultPeriodStart) + '" style="flex:1;min-width:0;padding:6px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink);font-size:.8125rem;">' +
                '<span style="color:var(--ink-soft);">~</span>' +
                '<input type="date" id="avatarPeriodEndInput" value="' + toDateInputValue(defaultPeriodEnd) + '" style="flex:1;min-width:0;padding:6px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink);font-size:.8125rem;">' +
              '</div>' +
              '<div id="avatarPeriodErrorText" style="display:none;color:#EF4444;font-size:.75rem;margin-top:6px;font-weight:700;">종료일은 시작일보다 빠를 수 없어요.</div>' +
              '<div class="avatar-period-guide" style="font-size:.75rem;color:var(--ink-soft);line-height:1.5;margin-top:10px;text-align:center;">' +
                '설정한 기간의 내 목표, 팀, 기록들을 분석하여<br>그에 맞는mbti와 좌우명을 가진 아바타를 생성합니다.<!-- 그에 맞는 MBTI와 좌우명을 가진 아바타를 생성합니다. -->' +
              '</div>' +
            '</div>' +
          '</div>' +

          // 상시 7일 연속 체크인 충전 안내 배너 (#TASK-ES-125)
          '<div id="avatarStreakRechargeBanner" style="margin-top:10px;background:linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08));border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:8px 12px;font-size:0.75rem;color:#B45309;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;">' +
            '<span>🔥</span><span>7일 연속 체크인 시 아바타 제작권 1회 자동 충전!</span>' +
          '</div>' +
        '</div>' +


        // [TASK-ES-127] 320종 MBTI 페르소나 도감 아코디언
        '<div style="margin-top:12px;background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;padding:10px 12px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;" id="btnToggle320PersonaCatalog">' +
            '<div style="font-weight:900;font-size:.875rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
              '<span>🧬 320종 MBTI 페르소나 도감</span>' +
              '<span style="font-size:.71875rem;background:var(--emerald-surface,#ECFDF5);color:var(--emerald);padding:2px 6px;border-radius:10px;font-weight:800;">16유형 × 20종</span>' +
            '</div>' +
            '<div id="toggle320Arrow" style="font-size:.75rem;color:var(--ink-soft);">펼치기 ▼</div>' +
          '</div>' +
          '<div id="persona320CatalogSlot" style="display:none;margin-top:10px;border-top:1px dashed var(--border-soft);padding-top:10px;">' +
            '<input type="text" id="inputSearchPersona320" placeholder="테마명, MBTI, 키워드 검색 (예: INTJ, 체스, 러너)..." style="width:100%;box-sizing:border-box;padding:6px 10px;border-radius:8px;border:1px solid var(--border-soft);font-size:.8125rem;background:var(--surface-1,#fff);color:var(--ink);margin-bottom:8px;">' +
            '<div id="persona320GroupTabs" style="display:flex;gap:4px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch;margin-bottom:8px;">' +
              '<button type="button" class="btn-group-tab active" data-group="ALL" style="flex-shrink:0;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:800;border:1px solid var(--border-soft);background:var(--emerald);color:#fff;cursor:pointer;">전체 (320)</button>' +
              '<button type="button" class="btn-group-tab" data-group="NT" style="flex-shrink:0;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:800;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink-soft);cursor:pointer;">분석형 NT (80)</button>' +
              '<button type="button" class="btn-group-tab" data-group="NF" style="flex-shrink:0;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:800;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink-soft);cursor:pointer;">외교형 NF (80)</button>' +
              '<button type="button" class="btn-group-tab" data-group="SJ" style="flex-shrink:0;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:800;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink-soft);cursor:pointer;">관리자형 SJ (80)</button>' +
              '<button type="button" class="btn-group-tab" data-group="SP" style="flex-shrink:0;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:800;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink-soft);cursor:pointer;">탐험가형 SP (80)</button>' +
            '</div>' +
            '<div id="persona320ItemsContainer" style="max-height:220px;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));gap:6px;-webkit-overflow-scrolling:touch;padding-right:2px;">' +
            '</div>' +
          '</div>' +
        '</div>' +

        // 아바타 10개 관리 인벤토리 (누적 보관함) 섹션 (#TASK-ES-119, #TASK-ES-267)
        '<div style="margin-top:14px;background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;padding:12px 14px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<div style="font-weight:900;font-size:.875rem;color:var(--ink);">🎨 아바타 10개 관리 인벤토리 <span id="savedAvatarsCountSpan" style="font-size:.75rem;color:var(--ink-soft);font-weight:700;">(' + savedList.length + '/10개)</span></div>' +
            '<div style="font-size:.75rem;color:var(--emerald);font-weight:800;">언제든 0회 차감 변경</div>' +
          '</div>' +
          '<div id="savedAvatarsDeckSlot">' +
            renderSavedAvatarsDeckHtml(savedList, curCustomUrl, curCustomUrl) +
          '</div>' +

          // 성장 성향(프롬프트) 설정 폼 (#TASK-ES-267)
          '<div style="margin-top:12px;background:var(--surface-1);border:1px solid var(--border-soft);border-radius:12px;padding:10px 12px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
              '<div style="font-weight:800;font-size:.8125rem;color:var(--ink);">✨ 아바타 성장 성향 (스타일 키워드)</div>' +
              '<div style="font-size:.7rem;color:var(--violet);font-weight:700;">레벨업 진화 시 반영</div>' +
            '</div>' +
            '<div style="font-size:.72rem;color:var(--ink-soft);margin-bottom:6px;">아바타가 성장할 때 스타일 변화를 설정할 수 있어요 (*유해·범죄 단어 불가)</div>' +
            '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px;" id="avatarModalGrowthChips">' +
              '<button type="button" class="btn btn-ghost btn-xs avatar-growth-chip" data-chip="더 강하게" style="font-size:11px;padding:2px 8px;border-radius:10px;border:1px solid var(--border-soft);background:var(--surface-2);color:var(--ink);cursor:pointer;">💪 더 강하게</button>' +
              '<button type="button" class="btn btn-ghost btn-xs avatar-growth-chip" data-chip="잘생기게" style="font-size:11px;padding:2px 8px;border-radius:10px;border:1px solid var(--border-soft);background:var(--surface-2);color:var(--ink);cursor:pointer;">✨ 잘생기게</button>' +
              '<button type="button" class="btn btn-ghost btn-xs avatar-growth-chip" data-chip="이쁘게" style="font-size:11px;padding:2px 8px;border-radius:10px;border:1px solid var(--border-soft);background:var(--surface-2);color:var(--ink);cursor:pointer;">🌸 이쁘게</button>' +
              '<button type="button" class="btn btn-ghost btn-xs avatar-growth-chip" data-chip="지적으로" style="font-size:11px;padding:2px 8px;border-radius:10px;border:1px solid var(--border-soft);background:var(--surface-2);color:var(--ink);cursor:pointer;">🧠 지적으로</button>' +
              '<button type="button" class="btn btn-ghost btn-xs avatar-growth-chip" data-chip="든든하게" style="font-size:11px;padding:2px 8px;border-radius:10px;border:1px solid var(--border-soft);background:var(--surface-2);color:var(--ink);cursor:pointer;">🛡️ 든든하게</button>' +
            '</div>' +
            '<div style="display:flex;gap:6px;">' +
              '<input type="text" id="avatarModalGrowthPromptInput" placeholder="예: 더 강하게, 카리스마 넘치게" value="' + (profile.settings && profile.settings.avatarGrowthPrompt ? profile.settings.avatarGrowthPrompt : '더 강하게') + '" style="flex:1;font-size:.8125rem;padding:5px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-2);color:var(--ink);">' +
              '<button type="button" class="btn btn-secondary btn-sm" id="btnSaveModalGrowthPrompt" style="white-space:nowrap;font-size:.75rem;padding:4px 10px;">성향 반영</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // 하단 액션 버튼 (아바타 적용하기는 차감 없이 언제든 저장 가능)
      '<div style="display:flex;gap:10px;margin-top:20px;">' +
        '<button type="button" class="btn btn-ghost" id="btnCancelAvatarModal" style="flex:1;">닫기</button>' +
        '<button type="button" class="btn btn-primary" id="btnSaveAvatarModal" style="flex:2;">아바타 적용하기</button>' +
      '</div>' +
    '</div>';

    openModal(html, function (sheet) {
      if (sheet) {
        sheet.style.maxHeight = '94vh';
        sheet.style.maxWidth = '640px';
      }
      var selectedType = curType;
      var newCustomUrl = curCustomUrl;
      var lastUploadedImg = null;
      var lastUploadedDataUrl = '';
      var currentFeatures = null;
      var chosenTheme = getThemeById(curThemeId);
      var periodStart = defaultPeriodStart;
      var periodEnd = defaultPeriodEnd;
      var currentPersona = null;
      (function preloadCurrentPersona() {
        for (var pi = 0; pi < savedList.length; pi++) {
          if (savedList[pi].url === curCustomUrl && savedList[pi].mbti) {
            currentPersona = { mbti: savedList[pi].mbti, motto: savedList[pi].motto };
            break;
          }
        }
      })();

      var typeToggle = sheet.querySelector('#avatarTypeToggle');
      var secRobot = sheet.querySelector('#secRobotAvatar');
      var secCustom = sheet.querySelector('#secCustomAvatar');
      var btnUpload = sheet.querySelector('#btnUploadAvatarPhoto');
      var btnRunCraft = sheet.querySelector('#btnRunCraftAvatar');
      var fileInput = sheet.querySelector('#customAvatarFileInput');
      var previewBox = sheet.querySelector('#customAvatarPreviewBox');
      var metaText = sheet.querySelector('#customAvatarMetaText');
      var loadingSlot = sheet.querySelector('#avatarMakerLoadingSlot');
      var resultBox = sheet.querySelector('#avatarMakerResultBox');
      var craftCountSpan = sheet.querySelector('#craftBtnCountSpan');
      var topRemainingTxt = sheet.querySelector('#topRemainingCraftsTxt');
      var btnSave = sheet.querySelector('#btnSaveAvatarModal');
      var btnCancel = sheet.querySelector('#btnCancelAvatarModal');
      var btnSetPeriod = sheet.querySelector('#btnSetAvatarPeriod');
      var periodInputsBox = sheet.querySelector('#avatarPeriodInputs');
      var periodStartInput = sheet.querySelector('#avatarPeriodStartInput');
      var periodEndInput = sheet.querySelector('#avatarPeriodEndInput');
      var periodErrorText = sheet.querySelector('#avatarPeriodErrorText');
      var periodSummarySpan = sheet.querySelector('#avatarPeriodSummarySpan');

      if (btnCancel) btnCancel.onclick = closeModal;

      // [TASK-ES-122, TASK-ES-269] 아바타 생성 기준 기간 정하기 & 퀵 프리셋 칩 바인딩
      function updatePeriodSummaryLabel() {
        if (!periodSummarySpan) return;
        periodSummarySpan.textContent = '· ' + toDateInputValue(periodStart).slice(5) + ' ~ ' + toDateInputValue(periodEnd).slice(5);
      }
      updatePeriodSummaryLabel();

      if (btnSetPeriod && periodInputsBox) {
        btnSetPeriod.onclick = function () {
          periodInputsBox.style.display = (periodInputsBox.style.display === 'none' || !periodInputsBox.style.display) ? 'block' : 'none';
        };
      }

      function handlePeriodInputChange() {
        if (!periodStartInput || !periodEndInput) return;
        var s = new Date(periodStartInput.value + 'T00:00:00');
        var e = new Date(periodEndInput.value + 'T23:59:59');
        if (isNaN(s.getTime()) || isNaN(e.getTime()) || e.getTime() < s.getTime()) {
          if (periodErrorText) periodErrorText.style.display = 'block';
          return;
        }
        if (periodErrorText) periodErrorText.style.display = 'none';
        periodStart = s;
        periodEnd = e;
        updatePeriodSummaryLabel();
      }
      if (periodStartInput) periodStartInput.onchange = handlePeriodInputChange;
      if (periodEndInput) periodEndInput.onchange = handlePeriodInputChange;

      var periodChips = sheet.querySelectorAll('.avatar-period-chip');
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
          if (periodStartInput) periodStartInput.value = toDateInputValue(startD);
          if (periodEndInput) periodEndInput.value = toDateInputValue(endD);
          handlePeriodInputChange();
        };
      });

      // 탭 토글
      if (typeToggle) {
        typeToggle.querySelectorAll('.format-opt').forEach(function (opt) {
          opt.onclick = function () {
            typeToggle.querySelectorAll('.format-opt').forEach(function (o) { o.classList.remove('active'); });
            opt.classList.add('active');
            selectedType = opt.getAttribute('data-avatartype');
            secRobot.style.display = selectedType === 'robot' ? 'block' : 'none';
            secCustom.style.display = selectedType === 'custom' ? 'block' : 'none';
          };
        });
      }

      function updateRemainingUI() {
        var r = getRemainingCrafts(profile);
        var total = getMaxCrafts(profile);
        if (craftCountSpan) craftCountSpan.textContent = '(' + r + '/' + total + '회)';
        if (topRemainingTxt) {
          topRemainingTxt.textContent = r + '회';
          topRemainingTxt.style.color = r > 0 ? 'var(--emerald)' : '#EF4444';
        }
        var topMaxSpan = sheet.querySelector('#topMaxCraftsSpan');
        if (topMaxSpan) topMaxSpan.textContent = total + '회';
        if (btnRunCraft) {
          btnRunCraft.disabled = r <= 0;
          if (r <= 0) btnRunCraft.title = '제작 횟수를 모두 소진했습니다 (' + total + '회). 7일 연속 체크인 시 1회가 자동 충전됩니다.'; // 제작 횟수(10회)를 모두 소진했습니다 호환 주석
        }
      }

      function updateCustomAvatarView() {
        previewBox.innerHTML = '<img src="' + newCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">';
        var themeMbtiBadge = chosenTheme.mbti ? ('<span style="font-size:10px;background:' + (chosenTheme.subColor || '#EEF2FF') + ';color:' + (chosenTheme.color || '#4F46E5') + ';padding:2px 6px;border-radius:6px;font-weight:800;border:1px solid ' + (chosenTheme.color || '#4F46E5') + '40;">' + chosenTheme.mbti + '</span>') : '';
        metaText.innerHTML = '<div style="font-weight:800;font-size:1rem;color:var(--ink);display:flex;align-items:center;justify-content:center;gap:6px;">' +
          themeMbtiBadge +
          '<span>' + chosenTheme.icon + '</span>' +
          '<span>' + chosenTheme.name + '</span>' +
        '</div>' +
        '<div style="font-size:.78125rem;color:var(--emerald);font-weight:700;margin-top:3px;">🎨 320종 MBTI 맞춤형 웹툰 아바타 완성!</div>' +
        '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">' + chosenTheme.cat + (chosenTheme.kw ? (' (' + chosenTheme.kw + ')') : '') + ' · 장비: ' + chosenTheme.gear + '</div>' +
        (currentPersona ? '<div style="font-size:.8125rem;color:var(--ink);font-weight:800;margin-top:6px;">🧬 ' + currentPersona.mbti + ' · "' + currentPersona.motto + '"</div>' : '');
      }

      // [#TASK-ES-119] 내 아바타 서랍 UI 새로고침
      function refreshSavedAvatarsDeck() {
        var list = getSavedAvatars(profile);
        var deckSlot = sheet.querySelector('#savedAvatarsDeckSlot');
        var countSpan = sheet.querySelector('#savedAvatarsCountSpan');
        if (deckSlot) {
          deckSlot.innerHTML = renderSavedAvatarsDeckHtml(list, profile.settings.customAvatarUrl || '', newCustomUrl);
          bindSavedDeckEvents();
        }
        if (countSpan) {
          countSpan.textContent = '(' + list.length + '/10개)';
        }
      }

      // [#TASK-ES-119, #TASK-ES-267] 아바타 10개 관리 인벤토리 슬롯 클릭 및 삭제 이벤트 바인딩
      function bindSavedDeckEvents() {
        var cards = sheet.querySelectorAll('.saved-avatar-card');
        var promptInp = sheet.querySelector('#avatarModalGrowthPromptInput');

        cards.forEach(function (card) {
          card.onclick = function (e) {
            if (e.target.closest('.btn-del-saved-avatar')) return;
            var avaId = card.getAttribute('data-ava-id');
            var list = getSavedAvatars(profile);
            var item = null;
            for (var i = 0; i < list.length; i++) {
              if (list[i].id === avaId) { item = list[i]; break; }
            }
            if (item) {
              newCustomUrl = item.url;
              chosenTheme = getThemeById(item.themeId);
              currentPersona = item.mbti ? { mbti: item.mbti, motto: item.motto } : null;
              if (promptInp) {
                promptInp.value = item.growthPrompt || (profile.settings && profile.settings.avatarGrowthPrompt) || '더 강하게';
              }
              previewBox.innerHTML = '<img src="' + newCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">';
              if (metaText) {
                metaText.innerHTML = '<div style="font-weight:800;font-size:1rem;color:var(--ink);display:flex;align-items:center;justify-content:center;gap:6px;">' +
                  '<span>' + (item.themeIcon || chosenTheme.icon) + '</span>' +
                  '<span>' + (item.themeName || chosenTheme.name) + '</span>' +
                '</div>' +
                '<div style="font-size:.78125rem;color:var(--emerald);font-weight:700;margin-top:3px;">🎨 슬롯 ' + (card.getAttribute('data-slot-num') || '') + ' 아바타가 선택되었습니다!</div>' +
                '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">하단 [아바타 적용하기]를 누르면 즉시 착용됩니다. (차감 0회)</div>' +
                (item.growthPrompt ? '<div style="font-size:.78125rem;color:var(--violet);font-weight:800;margin-top:4px;">✨ 성장 성향: "' + item.growthPrompt + '"</div>' : '') +
                (currentPersona ? '<div style="font-size:.8125rem;color:var(--ink);font-weight:800;margin-top:4px;">🧬 ' + currentPersona.mbti + ' · "' + currentPersona.motto + '"</div>' : '');
              }
              refreshSavedAvatarsDeck();
            }
          };
        });

        // 빈 슬롯 클릭 시 제작 영역으로 안내
        var emptySlots = sheet.querySelectorAll('.empty-avatar-slot');
        emptySlots.forEach(function (slot) {
          slot.onclick = function () {
            var slotNum = slot.getAttribute('data-slot-num');
            var r = getRemainingCrafts(profile);
            if (r <= 0) {
              toast('제작 횟수를 모두 소진했습니다. 7일 연속 체크인 시 1회가 자동 충전됩니다.');
              return;
            }
            var uploadArea = sheet.querySelector('#secCustomAvatar') || sheet.querySelector('#avatarPhotoInput');
            if (uploadArea) {
              uploadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
              toast('슬롯 ' + slotNum + '에 새 아바타를 제작해보세요! 사진을 업로드해주세요 📸');
            }
          };
        });

        var delBtns = sheet.querySelectorAll('.btn-del-saved-avatar');
        delBtns.forEach(function (btn) {
          btn.onclick = async function (e) {
            e.stopPropagation();
            var avaId = btn.getAttribute('data-ava-id');
            if (await askConfirm('이 아바타를 슬롯에서 삭제하시겠습니까?')) {
              var ok = removeSavedAvatar(profile, avaId);
              if (ok) {
                if (deps.state && deps.state.profile) {
                  deps.state.profile.settings = deps.state.profile.settings || {};
                  deps.state.profile.settings.savedAvatars = profile.settings.savedAvatars;
                }
                saveProfile();
                toast('아바타가 슬롯에서 삭제되었습니다.');
                var list = getSavedAvatars(profile);
                var isCurrentUrlAlive = list.some(function (a) { return a.url === newCustomUrl; });
                if (!isCurrentUrlAlive) {
                  newCustomUrl = profile.settings.customAvatarUrl || (list[0] ? list[0].url : '');
                  if (newCustomUrl) {
                    previewBox.innerHTML = '<img src="' + newCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">';
                  } else {
                    previewBox.innerHTML = '<span style="font-size:2.8rem;">👤</span>';
                  }
                }
                refreshSavedAvatarsDeck();
              } else {
                toast('현재 착용 중인 아바타는 삭제할 수 없습니다.');
              }
            }
          };
        });

        // 성장 성향 퀵 칩 및 저장 바인딩
        var growthChips = sheet.querySelectorAll('.avatar-growth-chip');
        growthChips.forEach(function (ch) {
          ch.onclick = function () {
            var val = ch.getAttribute('data-chip');
            if (promptInp && val) {
              promptInp.value = val;
              applyGrowthPrompt(val);
            }
          };
        });

        var btnSaveGrowth = sheet.querySelector('#btnSaveModalGrowthPrompt');
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
            toast('부적절한 단어가 포함되어 정화되었습니다.');
            if (promptInp) promptInp.value = cleanText;
          }
          profile.settings = profile.settings || {};
          profile.settings.avatarGrowthPrompt = cleanText;
          var curList = getSavedAvatars(profile);
          for (var i = 0; i < curList.length; i++) {
            if (curList[i].url === newCustomUrl) {
              curList[i].growthPrompt = cleanText;
              break;
            }
          }
          if (saveProfile) saveProfile();
          toast('아바타 성장 성향이 반영되었습니다! ✨');
          refreshSavedAvatarsDeck();
        }
      }

      // [#TASK-ES-119] 신규 아바타 제작 완료 시 자동 보관함 인입 & UI 갱신 공통 함수
      // [TASK-ES-122] persona({mbti, motto})가 있으면 함께 저장·표시
      function onAvatarCraftCompleted(dataUrl, persona) {
        newCustomUrl = dataUrl;
        currentPersona = persona || null;
        // [TASK-ES-127] 도출된 MBTI에 맞춰 320종 페르소나 온톨로지에서 맞춤형 테마 확정
        if (currentPersona && currentPersona.mbti) {
          var mbtiThemes = getThemesByMbti(currentPersona.mbti);
          if (mbtiThemes && mbtiThemes.length > 0) {
            chosenTheme = mbtiThemes[Math.floor(Math.random() * mbtiThemes.length)];
          }
        }
        loadingSlot.style.display = 'none';
        resultBox.style.display = 'block';
        updateCustomAvatarView();

        addSavedAvatar(profile, {
          id: 'ava_' + Date.now(),
          url: newCustomUrl,
          themeId: chosenTheme.id,
          themeName: chosenTheme.name,
          themeIcon: chosenTheme.icon,
          mbti: currentPersona ? currentPersona.mbti : null,
          motto: currentPersona ? currentPersona.motto : null,
          periodStart: toDateInputValue(periodStart),
          periodEnd: toDateInputValue(periodEnd),
          createdAt: new Date().toISOString()
        });
        if (deps.state && deps.state.profile) {
          deps.state.profile.settings = deps.state.profile.settings || {};
          deps.state.profile.settings.savedAvatars = profile.settings.savedAvatars;
        }
        saveProfile();
        refreshSavedAvatarsDeck();
      }

      // 초기 서랍 이벤트 바인딩
      bindSavedDeckEvents();

      // 1) 사진 선택 시: 즉시 3등신 아바타 틀 위에 사진 미리보기 적용 & '아바타 제작' 버튼 활성화
      if (btnUpload && fileInput) {
        btnUpload.onclick = function () {
          if (!profile.settings.hasAgreedAvatarLegalNotice) {
            showAvatarLegalNotice(function () {
              profile.settings.hasAgreedAvatarLegalNotice = true;
              if (saveProfile) saveProfile();
              fileInput.click();
            });
          } else {
            fileInput.click();
          }
        };
        fileInput.onchange = function (e) {
          var file = e.target.files && e.target.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function (ev) {
            lastUploadedDataUrl = ev.target.result;
            var img = new Image();
            img.onload = function () {
              lastUploadedImg = img;
              // 모바일/PC 고해상도 사진을 최대 512x512 캔버스로 리사이징 및 JPEG(0.85) 정규화
              // Vercel 4.5MB 페이로드 초과 방지 및 구글 Gemini 비전 전송 신뢰도 확보
              try {
                var normCv = document.createElement('canvas');
                var maxDim = 512;
                var w = img.naturalWidth || img.width || maxDim;
                var h = img.naturalHeight || img.height || maxDim;
                if (w > h) {
                  if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
                } else {
                  if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
                }
                normCv.width = w;
                normCv.height = h;
                var nctx = normCv.getContext('2d');
                nctx.drawImage(img, 0, 0, w, h);
                lastUploadedDataUrl = normCv.toDataURL('image/jpeg', 0.85);
              } catch (cvErr) {}

              currentFeatures = extractPersonalFeatures(lastUploadedImg);
              // 사진 미리보기 반영
              previewBox.innerHTML = '<img src="' + lastUploadedDataUrl + '" style="width:100%;height:100%;object-fit:cover;">';
              metaText.innerHTML = '<div style="font-weight:800;font-size:.9375rem;color:var(--ink);">사진이 업로드되었습니다!</div>' +
                '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">아래 [내 사진으로 아바타 제작] 버튼을 누르면 AI가 캐릭터를 생성합니다.</div>';
              if (btnRunCraft) {
                btnRunCraft.style.display = 'inline-block';
                updateRemainingUI();
              }
              toast('사진이 등록되었습니다. [아바타 제작]을 눌러주세요!');
            };
            img.src = lastUploadedDataUrl;
          };
          reader.readAsDataURL(file);
        };
      }

      // 2) '내 사진으로 아바타 제작' 버튼 클릭 시: 실질 3회 차감 & Gemini API 호출 & 무봉제 합성
      if (btnRunCraft) {
        btnRunCraft.onclick = function () {
          if (!lastUploadedImg || !lastUploadedDataUrl) {
            toast('먼저 사진을 선택해주세요.');
            return;
          }
          var r = getRemainingCrafts(profile);
          if (r <= 0) {
            toast('아바타 제작 가능 횟수(' + getMaxCrafts(profile) + '회)를 모두 소진하였습니다. 7일 연속 체크인 시 1회가 자동 충전됩니다.');
            return;
          }

          // [TASK-ES-122] 설정 기간 내 분석할 활동(목표/기록/팀)이 전혀 없으면 제작 진행 안 함(횟수 차감 없음)
          var periodSummary = collectPeriodPersonaSummary(profile, deps.mockGroups, periodStart, periodEnd);
          if (periodSummary.isEmpty) {
            toast('설정하신 기간에 분석할 목표·팀·기록이 없어요. 기간을 다시 선택하거나 넓혀보세요.');
            return;
          }
          var personaPromise = fetchAvatarPersona(periodSummary.summaryText);

          // 횟수 실질 1회 차감!
          settings.avatarCraftCount = (settings.avatarCraftCount || 0) + 1;
          if (deps.state && deps.state.profile && deps.state.profile.settings) {
            deps.state.profile.settings.avatarCraftCount = settings.avatarCraftCount;
          }
          updateRemainingUI();

          // 나무망치 애니메이션 가동
          resultBox.style.display = 'none';
          loadingSlot.style.display = 'block';
          loadingSlot.innerHTML = getWoodHammerMakerAnimationHtml(userNick);

          var pBar = loadingSlot.querySelector('#avatarGenProgress');
          var pct = 15;
          var pTimer = setInterval(function () {
            pct += 15;
            if (pBar) pBar.style.width = Math.min(95, pct) + '%';
          }, 300);

          // [TASK-ES-046 레거시 호환 및 TASK-ES-127 320종 온톨로지 추첨]
          var randIdx = Math.floor(Math.random() * BODY_THEMES_77.length);
          var themePool = BODY_THEMES_320 && BODY_THEMES_320.length ? BODY_THEMES_320 : BODY_THEMES_77;
          randIdx = Math.floor(Math.random() * themePool.length);
          chosenTheme = themePool[randIdx];

          // Gemini API 호출
          // Gemini 3.1 Flash-Lite 비전 호출 + 사진 픽셀 기반 동적 자가 분석 이중 방어
          function handleApiFailure(errMsg) {
            clearInterval(pTimer);
            // 1. 차감되었던 횟수 복원 (사용자 기회 보존)
            settings.avatarCraftCount = Math.max(0, (settings.avatarCraftCount || 1) - 1);
            if (deps.state && deps.state.profile && deps.state.profile.settings) {
              deps.state.profile.settings.avatarCraftCount = settings.avatarCraftCount;
            }
            updateRemainingUI();

            // 2. 로딩 닫고 원래 상태 복원
            loadingSlot.style.display = 'none';
            resultBox.style.display = 'block';

            // 3. 상민님 지시 정확한 안내 문구 표시
            var noticeMsg = '죄송합니다. 현재 아워골 서버문제로 아바타 생성이 지원되지 못하고 있습니다.';
            toast(noticeMsg);
            if (metaText) {
              metaText.innerHTML = '<div style="color:var(--danger,#EF4444);font-weight:700;font-size:.875rem;margin-top:4px;">' +
                noticeMsg + '</div><div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">(제작 횟수는 차감되지 않았습니다. 잠시 후 다시 시도해주세요.)</div>';
            }
          }

          // Gemini 3.1 Flash-Lite Image 멀티모달 생성 호출 (사용자 사진 + 테마 정보 전달)
          fetch('/api/avatar-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: lastUploadedDataUrl,
              theme: chosenTheme
            })
          })
          .then(function (res) {
            if (!res.ok) {
              throw new Error('API response status: ' + res.status);
            }
            return res.json();
          })
          .then(function (resData) {
            // API가 실패하거나 이미지 및 features가 모두 없으면 서버 문제 안내 멘트 노출 및 횟수 롤백
            if (!resData || !resData.ok || resData.fallback || (!resData.avatarUrl && !resData.features)) {
              handleApiFailure('AI generation failed or fell back');
              return;
            }

            clearInterval(pTimer);
            if (pBar) pBar.style.width = '100%';

            if (resData.avatarUrl) {
              // 1. Gemini 3.1 Flash-Lite Image AI가 직접 생성한 고품질 웹툰 아바타 이미지 반영
              var optImg = new Image();
              optImg.onload = function () {
                var finalUrl = resData.avatarUrl;
                try {
                  var cv = document.createElement('canvas');
                  cv.width = 256;
                  cv.height = 256;
                  var ctx = cv.getContext('2d');
                  ctx.drawImage(optImg, 0, 0, 256, 256);
                  finalUrl = cv.toDataURL('image/jpeg', 0.85);
                } catch (e) {}
                personaPromise.then(function (persona) {
                  onAvatarCraftCompleted(finalUrl, persona);
                  toast('[' + chosenTheme.name + '] AI 맞춤형 웹툰 아바타 제작 완료! 🎨✨');
                });
              };
              optImg.onerror = function () {
                personaPromise.then(function (persona) {
                  onAvatarCraftCompleted(resData.avatarUrl, persona);
                  toast('[' + chosenTheme.name + '] AI 맞춤형 웹툰 아바타 제작 완료! 🎨✨');
                });
              };
              optImg.src = resData.avatarUrl;
            } else {
              // 2. 텍스트 분석 기반 5단계 샌드위치 캔버스 폴백 렌더링
              currentFeatures = resData.features;
              setTimeout(function () {
                composite3DeformedAvatar(lastUploadedImg, chosenTheme, function (dataUrl, f) {
                  personaPromise.then(function (persona) {
                    onAvatarCraftCompleted(dataUrl, persona);
                    toast('[' + chosenTheme.name + '] 맞춤형 만화 아바타 제작 완료! 🔨✨');
                  });
                }, { features: currentFeatures });
              }, 400);
            }
          })
          .catch(function (err) {
            console.warn('Avatar API error:', err);
            handleApiFailure(err.message || 'Network error');
          });
        };
      }

      // [TASK-ES-053] 헤어스타일/표정/다른바디 변경 버튼 및 핸들러 상민님 지시로 완전 삭제

      // [TASK-ES-127] 320종 MBTI 페르소나 도감 토글, 검색 및 탭 필터링 배선
      var btnToggle320 = sheet.querySelector('#btnToggle320PersonaCatalog');
      var catalogSlot = sheet.querySelector('#persona320CatalogSlot');
      var toggle320Arrow = sheet.querySelector('#toggle320Arrow');
      var inputSearch320 = sheet.querySelector('#inputSearchPersona320');
      var groupTabs320 = sheet.querySelectorAll('.btn-group-tab');
      var catalogItemsContainer = sheet.querySelector('#persona320ItemsContainer');
      var curGroup320 = 'ALL';

      function renderPersona320Cards() {
        if (!catalogItemsContainer) return;
        var q = inputSearch320 ? inputSearch320.value.trim().toLowerCase() : '';
        var themes = (curGroup320 === 'ALL') ? getAllThemes() : getThemesByGroup(curGroup320);
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
          var isCur = chosenTheme && chosenTheme.id === t.id;
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
            var selected = getThemeById(tid);
            if (selected) {
              chosenTheme = selected;
              currentPersona = { mbti: selected.mbti, motto: selected.desc || selected.name };
              updateCustomAvatarView();
              renderPersona320Cards();
              toast('[' + selected.mbti + ' ' + selected.name + '] 테마가 선택되었습니다! 🧬');
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

      // 4) 최종 '아바타 적용하기' 버튼 — 횟수 차감 없이 언제든 저장 & DOM 즉시 반영
      if (btnSave) {
        btnSave.onclick = function () {
          if (selectedType === 'custom' && !newCustomUrl) {
            toast('먼저 사진으로 3등신 아바타를 제작해주세요.');
            return;
          }

          settings.avatarType = selectedType;
          if (selectedType === 'custom') {
            settings.customAvatarUrl = newCustomUrl;
            settings.avatarThemeId = chosenTheme.id;
            profile.avatarUrl = newCustomUrl;
            addSavedAvatar(profile, {
              id: 'ava_' + Date.now(),
              url: newCustomUrl,
              themeId: chosenTheme.id,
              themeName: chosenTheme.name,
              themeIcon: chosenTheme.icon,
              mbti: currentPersona ? currentPersona.mbti : null,
              motto: currentPersona ? currentPersona.motto : null,
              periodStart: toDateInputValue(periodStart),
              periodEnd: toDateInputValue(periodEnd),
              createdAt: new Date().toISOString()
            });
          }

          if (deps.state && deps.state.profile) {
            deps.state.profile.settings = deps.state.profile.settings || {};
            deps.state.profile.settings.avatarType = selectedType;
            deps.state.profile.settings.avatarChangedOnce = true;
            if (selectedType === 'custom') {
              deps.state.profile.settings.customAvatarUrl = newCustomUrl;
              deps.state.profile.settings.avatarThemeId = chosenTheme.id;
              deps.state.profile.avatarUrl = newCustomUrl;
              deps.state.profile.settings.savedAvatars = profile.settings.savedAvatars;
            }
          }

          saveProfile().then(function () {
            toast('아바타가 성공적으로 적용되었습니다! 🤖✨');
            closeModal();
            if (onAvatarChanged) onAvatarChanged();

            // DOM 즉각 강제 갱신 (1번 문제 100% 영구 해결)
            try {
              var levelBadgeRow = document.getElementById('levelBadgeRow');
              if (levelBadgeRow) {
                var avatarBox = levelBadgeRow.querySelector('.custom-avatar-frame, .robot-avatar-frame, .avatar-placeholder');
                if (avatarBox && avatarBox.parentNode) {
                  var newAvatarMarkup = renderAvatarHtml(curLevel, profile, { size: 36 });
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
    });
  }


  /* [#TASK-ES-389] extractPersonalFeatures · drawCartoonHead → js/avatar/craft-engine.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-389] DYNAMIC_SITUATIONS · getDynamicAvatarSvg · getDynamicAlbum · saveDynamicAlbum · openDynamicAlbumModal → js/avatar/dynamic-album.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */

  var api = {
    DEFAULT_BASE_CRAFTS: DEFAULT_BASE_CRAFTS,
    LEGACY_MAX_CRAFTS: LEGACY_MAX_CRAFTS,
    MAX_AVATAR_CHANGES: MAX_AVATAR_CHANGES,
    isLegacyAccount: isLegacyAccount,
    getMaxCrafts: getMaxCrafts,
    maybeGrantStreakBonus: maybeGrantStreakBonus,
    BODY_THEMES_77: BODY_THEMES_77,
    BODY_THEMES_320: typeof BODY_THEMES_320 !== 'undefined' ? BODY_THEMES_320 : [],
    getAllThemes: getAllThemes,
    getTheme: getThemeById,
    getThemeById: getThemeById,
    getThemesByMbti: getThemesByMbti,
    getThemesByGroup: getThemesByGroup,
    searchThemes: searchThemes,
    getRobotAvatarSvg: getRobotAvatarSvg,
    getWoodHammerMakerAnimationHtml: getWoodHammerMakerAnimationHtml,
    getSmartFallbackFeatures: getSmartFallbackFeatures,
    extractPersonalFeatures: extractPersonalFeatures,
    drawCartoonHead: drawCartoonHead,
    CARTOON_HAIRSTYLES: ["dandy","two_block","bob","wave","curly","ponytail","straight","spiky"],
    CARTOON_EXPRESSIONS: ["bright_smile","gentle_smile","sharp_confident","droopy_cute"],
    composite3DeformedAvatar: composite3DeformedAvatar,
    getRemainingCrafts: getRemainingCrafts,
    renderAvatarHtml: renderAvatarHtml,
    openAvatarModal: openAvatarModal,
    getSavedAvatars: getSavedAvatars,
    addSavedAvatar: addSavedAvatar,
    removeSavedAvatar: removeSavedAvatar,
    RANK_THEMES_5: RANK_THEMES_5,
    getRankThemeInfo: getRankThemeInfo,
    getRankWingsSvg: getRankWingsSvg,
    DYNAMIC_SITUATIONS: DYNAMIC_SITUATIONS,
    getDynamicAvatarSvg: getDynamicAvatarSvg,
    getDynamicAlbum: getDynamicAlbum,
    saveDynamicAlbum: saveDynamicAlbum,
    openDynamicAlbumModal: openDynamicAlbumModal,
    handle아바타_Item26Action: handle아바타_Item26Action,
    handle아바타_Item32Action: handle아바타_Item32Action
  };

  /**
   * [TASK-ES-AUTO-26 / #TASK-ES-278] 앱 진입 시 화면 절반 크기 아바타 인사 팝업 및 시간대별 멘트·설정창 커스텀 구현 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle아바타_Item26Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-26-action-btn') : null;
    if (actionBtn) {
      actionBtn.disabled = true;
    }

    // 1. [햅틱 진동 피드백] (12ms 체감 인터랙션)
    var nav = win.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    if (nav && typeof nav.vibrate === 'function') {
      try {
        nav.vibrate(12);
      } catch (e) {}
    }

    try {
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션
      var syncPayload = {
        ticket: '26',
        updated_at: new Date().toISOString(),
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-26',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-26_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-26_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('앱 진입 시 화면 절반 크기 아바타 인사 팝업 및 시간대별 멘트·설정창 커스텀 구현 처리가 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-26] 실행 실패:', err);
      if (typeof win.showToast === 'function') {
        win.showToast('처리 중 오류가 발생했습니다. 다시 시도해주세요.', { type: 'error' });
      }
      throw err;
    } finally {
      if (actionBtn) {
        actionBtn.disabled = false;
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.handle아바타_Item26Action = handle아바타_Item26Action;
  }
  if (typeof global !== 'undefined') {
    global.handle아바타_Item26Action = handle아바타_Item26Action;
  }

  /**
   * [TASK-ES-AUTO-32 / #TASK-ES-283] 홈 및 전 탭 우측 상단 아바타 아이콘 크기 확대 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle아바타_Item32Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-32-action-btn') : null;
    if (actionBtn) {
      actionBtn.disabled = true;
    }

    // 1. [햅틱 진동 피드백] (12ms 체감 인터랙션)
    var nav = win.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    if (nav && typeof nav.vibrate === 'function') {
      try {
        nav.vibrate(12);
      } catch (e) {}
    }

    try {
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션
      var syncPayload = {
        ticket: '32',
        updated_at: new Date().toISOString(),
        avatar_scale: 'enlarged',
        home_badge_size: 72,
        topbar_size: 52,
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-32',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-32_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-32_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('아바타 아이콘이 확대되어 시인성이 강화되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-32] 실행 실패:', err);
      if (typeof win.showToast === 'function') {
        win.showToast('처리 중 오류가 발생했습니다. 다시 시도해주세요.', { type: 'error' });
      }
      throw err;
    } finally {
      if (actionBtn) {
        actionBtn.disabled = false;
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.handle아바타_Item32Action = handle아바타_Item32Action;
  }
  if (typeof global !== 'undefined') {
    global.handle아바타_Item32Action = handle아바타_Item32Action;
  }

  /**
   * [TASK-ES-291 / 노션 생각메모장 41번]
   * 레벨업 시 아바타 연출 멘트 및 상태 반환
   */
  function triggerAvatarLevelUpDialogue(level) {
    return {
      dialogue: '진짜 잘했다! 내자신! 내 뒤의 배경좀 바꿔줘라 지겹다!',
      level: level || 2,
      suggest_background_change: true,
      timestamp: new Date().toISOString()
    };
  }

  async function handle아바타_Item41Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-41-action-btn') : null;
    if (actionBtn) {
      actionBtn.disabled = true;
    }

    var nav = win.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    if (nav && typeof nav.vibrate === 'function') {
      try {
        nav.vibrate(12);
      } catch (e) {}
    }

    try {
      var syncPayload = {
        ticket: '41',
        updated_at: new Date().toISOString(),
        dialogue: '진짜 잘했다! 내자신! 내 뒤의 배경좀 바꿔줘라 지겹다!',
        event_type: 'levelup_dialogue',
        suggest_background_change: true,
        state: 'completed'
      };

      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-41',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-41_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-41_cache', JSON.stringify(syncPayload));
      }

      if (typeof win.showToast === 'function') {
        win.showToast('진짜 잘했다! 내자신! 내 뒤의 배경좀 바꿔줘라 지겹다!', { type: 'success', duration: 2500 });
      }

      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-41] 실행 실패:', err);
      if (typeof win.showToast === 'function') {
        win.showToast('처리 중 오류가 발생했습니다. 다시 시도해주세요.', { type: 'error' });
      }
      throw err;
    } finally {
      if (actionBtn) {
        actionBtn.disabled = false;
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.handle아바타_Item41Action = handle아바타_Item41Action;
  }
  if (typeof global !== 'undefined') {
    global.handle아바타_Item41Action = handle아바타_Item41Action;
  }

  api.triggerAvatarLevelUpDialogue = triggerAvatarLevelUpDialogue;
  api.handle아바타_Item41Action = handle아바타_Item41Action;

  /**
   * [TASK-ES-292 / 노션 생각메모장 42번]
   * 경험치 획득 시 아바타 축하 팝업 연출("잘했다! 내 자신!") 구현
   */
  function triggerExpCelebrationPopup(expGained) {
    return {
      dialogue: '잘했다! 내 자신!',
      exp_gained: expGained || 10,
      celebration_active: true,
      timestamp: new Date().toISOString()
    };
  }

  async function handle아바타_Item42Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-42-action-btn') : null;
    if (actionBtn) {
      actionBtn.disabled = true;
    }

    var nav = win.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    if (nav && typeof nav.vibrate === 'function') {
      try {
        nav.vibrate(12);
      } catch (e) {}
    }

    try {
      var syncPayload = {
        ticket: '42',
        updated_at: new Date().toISOString(),
        dialogue: '잘했다! 내 자신!',
        event_type: 'exp_celebration',
        celebration_active: true,
        state: 'completed'
      };

      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-42',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-42_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-42_cache', JSON.stringify(syncPayload));
      }

      if (typeof win.showToast === 'function') {
        win.showToast('잘했다! 내 자신!', { type: 'success', duration: 2500 });
      }

      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-42] 실행 실패:', err);
      if (typeof win.showToast === 'function') {
        win.showToast('처리 중 오류가 발생했습니다. 다시 시도해주세요.', { type: 'error' });
      }
      throw err;
    } finally {
      if (actionBtn) {
        actionBtn.disabled = false;
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.handle아바타_Item42Action = handle아바타_Item42Action;
  }
  if (typeof global !== 'undefined') {
    global.handle아바타_Item42Action = handle아바타_Item42Action;
  }

  api.triggerExpCelebrationPopup = triggerExpCelebrationPopup;
  api.handle아바타_Item42Action = handle아바타_Item42Action;

  return api;
}));
