/**
 * OurGoal Avatar Cell: 아바타 설정 모달 조립자 · 초상권 안내 (#TASK-ES-390 · 아바타·EXP 쪼개기 PR-4)
 *
 * 이전 전 js/avatar-system.js(1448줄)의 showAvatarLegalNotice(135~169줄)·openAvatarModal(171~1050줄)을 동작 그대로 옮겼다.
 * openAvatarModal 은 머리(공유 변수 선언까지)와 openModal 뼈대만 남은 조립자다 — 섹션 6개(markup·bind-*)를 원래 순서·원래 자리에서 부른다.
 * 섹션이 같이 쓰는 지역 이름은 모달 상태 객체 MS 의 getter 로 넘긴다(살아 있는 값). 섹션이 다시 대입하는 9개(selectedType·newCustomUrl·lastUploadedImg·lastUploadedDataUrl·currentFeatures·chosenTheme·periodStart·periodEnd·currentPersona)만 setter 가 있다.
 * avatar-system.js·다른 부품 이름은 AV.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
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
    var maxCrafts = AV.getMaxCrafts(profile);
    var remainingCrafts = AV.getRemainingCrafts(profile);
    var userNick = profile.nickname || '회원';
    var savedList = AV.getSavedAvatars(profile);

    var todayForPeriod = new Date();
    var defaultPeriodEnd = todayForPeriod;
    var defaultPeriodStart = new Date(todayForPeriod.getTime() - 29 * 24 * 60 * 60 * 1000);
    var toDateInputValue = function (d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };

    /* [#TASK-ES-390] MS F 시작 — 섹션이 같이 쓰는 openAvatarModal 지역 이름(목록은 스코프 분석으로 뽑음). getter 는 살아 있는 값, setter 는 섹션이 다시 대입하는 이름만 */
    var MS = {};
    Object.defineProperties(MS, {
      closeModal: { get: function () { return closeModal; } },
      curCustomUrl: { get: function () { return curCustomUrl; } },
      curLevel: { get: function () { return curLevel; } },
      curType: { get: function () { return curType; } },
      defaultPeriodEnd: { get: function () { return defaultPeriodEnd; } },
      defaultPeriodStart: { get: function () { return defaultPeriodStart; } },
      deps: { get: function () { return deps; } },
      maxCrafts: { get: function () { return maxCrafts; } },
      onAvatarChanged: { get: function () { return onAvatarChanged; } },
      profile: { get: function () { return profile; } },
      remainingCrafts: { get: function () { return remainingCrafts; } },
      saveProfile: { get: function () { return saveProfile; } },
      savedList: { get: function () { return savedList; } },
      settings: { get: function () { return settings; } },
      toDateInputValue: { get: function () { return toDateInputValue; } },
      toast: { get: function () { return toast; } },
      userNick: { get: function () { return userNick; } }
    });
    /* [#TASK-ES-390] MS F 끝 */
    var html = AV.renderAvatarModalMarkup(MS); /* [#TASK-ES-390] 모달 HTML 문자열 → js/avatar/modal/markup.js 로 옮김(동작 그대로) */

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
      var chosenTheme = AV.getThemeById(curThemeId);
      var periodStart = defaultPeriodStart;
      var periodEnd = defaultPeriodEnd;
      var currentPersona = null;
      /* [#TASK-ES-390] MS C 시작 — 섹션이 같이 쓰는 openModal 콜백 지역 이름(목록은 스코프 분석으로 뽑음). getter 는 살아 있는 값, setter 는 섹션이 다시 대입하는 이름만 */
      Object.defineProperties(MS, {
        btnRunCraft: { get: function () { return btnRunCraft; } },
        btnSave: { get: function () { return btnSave; } },
        btnSetPeriod: { get: function () { return btnSetPeriod; } },
        btnUpload: { get: function () { return btnUpload; } },
        chosenTheme: { get: function () { return chosenTheme; }, set: function (v) { chosenTheme = v; } },
        craftCountSpan: { get: function () { return craftCountSpan; } },
        currentFeatures: { get: function () { return currentFeatures; }, set: function (v) { currentFeatures = v; } },
        currentPersona: { get: function () { return currentPersona; }, set: function (v) { currentPersona = v; } },
        fileInput: { get: function () { return fileInput; } },
        lastUploadedDataUrl: { get: function () { return lastUploadedDataUrl; }, set: function (v) { lastUploadedDataUrl = v; } },
        lastUploadedImg: { get: function () { return lastUploadedImg; }, set: function (v) { lastUploadedImg = v; } },
        loadingSlot: { get: function () { return loadingSlot; } },
        metaText: { get: function () { return metaText; } },
        newCustomUrl: { get: function () { return newCustomUrl; }, set: function (v) { newCustomUrl = v; } },
        periodEnd: { get: function () { return periodEnd; }, set: function (v) { periodEnd = v; } },
        periodEndInput: { get: function () { return periodEndInput; } },
        periodErrorText: { get: function () { return periodErrorText; } },
        periodInputsBox: { get: function () { return periodInputsBox; } },
        periodStart: { get: function () { return periodStart; }, set: function (v) { periodStart = v; } },
        periodStartInput: { get: function () { return periodStartInput; } },
        periodSummarySpan: { get: function () { return periodSummarySpan; } },
        previewBox: { get: function () { return previewBox; } },
        resultBox: { get: function () { return resultBox; } },
        secCustom: { get: function () { return secCustom; } },
        secRobot: { get: function () { return secRobot; } },
        selectedType: { get: function () { return selectedType; }, set: function (v) { selectedType = v; } },
        sheet: { get: function () { return sheet; } },
        topRemainingTxt: { get: function () { return topRemainingTxt; } },
        typeToggle: { get: function () { return typeToggle; } }
      });
      /* [#TASK-ES-390] MS C 끝 */
      AV.restoreAvatarModalPersona(MS); /* [#TASK-ES-390] 초기 페르소나 복원 → js/avatar/modal/bind-craft.js 로 옮김(동작 그대로) */

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

      AV.bindAvatarModalPeriod(MS); /* [#TASK-ES-390] 생성 기준 기간·퀵 칩 → js/avatar/modal/bind-period.js 로 옮김(동작 그대로) */

      AV.bindAvatarModalDeck(MS); /* [#TASK-ES-390] 탭 토글·남은 횟수·보기 갱신·보관함 슬롯·성장 성향·제작 완료 인입 → js/avatar/modal/bind-deck.js 로 옮김(동작 그대로) */

      AV.bindAvatarModalCraft(MS); /* [#TASK-ES-390] 사진 업로드·제작 실행 → js/avatar/modal/bind-craft.js 로 옮김(동작 그대로) */

      AV.bindAvatarModalPersona(MS); /* [#TASK-ES-390] 320종 도감 토글·검색·탭 → js/avatar/modal/bind-persona.js 로 옮김(동작 그대로) */

      AV.bindAvatarModalSave(MS); /* [#TASK-ES-390] 최종 적용하기 → js/avatar/modal/bind-save.js 로 옮김(동작 그대로) */
    });
  }

  AV.showAvatarLegalNotice = showAvatarLegalNotice;
  AV.openAvatarModal = openAvatarModal;
}));
