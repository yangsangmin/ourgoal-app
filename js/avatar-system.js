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
  /* ============ [#TASK-ES-390] 아바타 부품 이음매 2 — 모달 섹션(js/avatar/modal/*)·기능 카드(js/avatar/feature-cards.js) ============
     위 이음매와 같은 방식: 옮긴 선언을 같은 이름으로 가져오고, 옮긴 코드가 읽는 이 팩토리 이름만 AV 에 getter 로 노출한다. */
  if (typeof module === 'object' && module && module.exports && typeof require === 'function') {
    require('./avatar/feature-cards.js')(AV);
    require('./avatar/modal/index.js')(AV);
    require('./avatar/modal/markup.js')(AV);
    require('./avatar/modal/bind-period.js')(AV);
    require('./avatar/modal/bind-deck.js')(AV);
    require('./avatar/modal/bind-craft.js')(AV);
    require('./avatar/modal/bind-persona.js')(AV);
    require('./avatar/modal/bind-save.js')(AV);
  }
  var showAvatarLegalNotice = AV.showAvatarLegalNotice;
  var openAvatarModal = AV.openAvatarModal;
  var handle아바타_Item26Action = AV.handle아바타_Item26Action;
  var handle아바타_Item32Action = AV.handle아바타_Item32Action;
  var triggerAvatarLevelUpDialogue = AV.triggerAvatarLevelUpDialogue;
  var handle아바타_Item41Action = AV.handle아바타_Item41Action;
  var triggerExpCelebrationPopup = AV.triggerExpCelebrationPopup;
  var handle아바타_Item42Action = AV.handle아바타_Item42Action;
  Object.defineProperties(AV, Object.getOwnPropertyDescriptors({
    get askConfirm() { return askConfirm; }
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

  /* [#TASK-ES-390] showAvatarLegalNotice · openAvatarModal → js/avatar/modal/index.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */


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

  /* [#TASK-ES-390] handle아바타_Item26Action → js/avatar/feature-cards.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */

  if (typeof window !== 'undefined') {
    window.handle아바타_Item26Action = handle아바타_Item26Action;
  }
  if (typeof global !== 'undefined') {
    global.handle아바타_Item26Action = handle아바타_Item26Action;
  }

  /* [#TASK-ES-390] handle아바타_Item32Action → js/avatar/feature-cards.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */

  if (typeof window !== 'undefined') {
    window.handle아바타_Item32Action = handle아바타_Item32Action;
  }
  if (typeof global !== 'undefined') {
    global.handle아바타_Item32Action = handle아바타_Item32Action;
  }

  /* [#TASK-ES-390] triggerAvatarLevelUpDialogue · handle아바타_Item41Action → js/avatar/feature-cards.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */

  if (typeof window !== 'undefined') {
    window.handle아바타_Item41Action = handle아바타_Item41Action;
  }
  if (typeof global !== 'undefined') {
    global.handle아바타_Item41Action = handle아바타_Item41Action;
  }

  api.triggerAvatarLevelUpDialogue = triggerAvatarLevelUpDialogue;
  api.handle아바타_Item41Action = handle아바타_Item41Action;

  /* [#TASK-ES-390] triggerExpCelebrationPopup · handle아바타_Item42Action → js/avatar/feature-cards.js 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */

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
