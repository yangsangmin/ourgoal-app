/**
 * OurGoal Avatar Cell: 모달 HTML 문자열 (#TASK-ES-390 · 아바타·EXP 쪼개기 PR-4)
 *
 * 이전 전 openAvatarModal(js/avatar-system.js 197~362줄)의 이 섹션을 동작 그대로 옮겼다.
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

  /* [#TASK-ES-390] 섹션: 모달 HTML 문자열 — openAvatarModal(js/avatar/modal/index.js)이 원래 자리에서 부른다(이전 전 줄 197~362). */
  function renderAvatarModalMarkup(MS) {
    var html = '<div class="modal-sheet-inner" style="max-width:620px;/* max-width:560px */margin:0 auto;text-align:left;">' +
      '<div class="modal-header-custom" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
        '<div style="font-weight:900;font-size:1.1875rem;color:var(--ink);">아바타 설정</div>' +
        '<div style="font-size:0.8125rem;color:var(--ink-soft);font-weight:700;">' +
          '아바타 제작 잔여: <strong id="topRemainingCraftsTxt" style="color:' + (MS.remainingCrafts > 0 ? 'var(--emerald)' : '#EF4444') + ';">' + MS.remainingCrafts + '회</strong> / <span id="topMaxCraftsSpan">' + MS.maxCrafts + '회</span>' +
        '</div>' +
      '</div>' +

      '<div style="background:var(--surface-2);border:1px solid var(--border-soft);border-radius:12px;padding:10px 14px;font-size:0.8125rem;color:var(--ink-soft);line-height:1.45;margin-bottom:16px;">' +
        '💡 <strong>아바타 제작 안내</strong>: 신규 가입 시 <strong>기본 3회</strong>(기존 계정 최대 10회)가 제공되며, <strong>7일 연속 체크인</strong>할 때마다 제작권 1회가 자동 보너스로 충전됩니다.<br>' +
        '제작된 아바타는 <strong>내 아바타 서랍</strong>에 영구 보관되며 횟수 차감 없이 언제든 자유롭게 변경·착용할 수 있습니다.' +
      '</div>' +

      // 5대 상징 랭크 백그라운드 안내 카드 (#TASK-ES-159)
      '<div id="avatarRankThemeCard" class="avatar-rank-summary-card" style="background:linear-gradient(135deg, ' + AV.getRankThemeInfo(MS.curLevel).mainColor + '18, ' + AV.getRankThemeInfo(MS.curLevel).subColor + '10);border:1px solid ' + AV.getRankThemeInfo(MS.curLevel).mainColor + '40;border-radius:14px;padding:12px 14px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:40px;height:40px;border-radius:10px;background:var(--card, #fff);border:1.5px solid ' + AV.getRankThemeInfo(MS.curLevel).mainColor + ';display:flex;align-items:center;justify-content:center;font-size:1.4rem;box-shadow:0 0 8px ' + AV.getRankThemeInfo(MS.curLevel).glow + ';">' +
            AV.getRankThemeInfo(MS.curLevel).icon +
          '</div>' +
          '<div>' +
            '<div style="font-weight:800;font-size:0.9375rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
              AV.getRankThemeInfo(MS.curLevel).title +
              '<span style="background:' + AV.getRankThemeInfo(MS.curLevel).badgeGradient + ';color:#fff;font-size:0.75rem;padding:1px 6px;border-radius:6px;font-weight:800;">Lv.' + MS.curLevel + '</span>' +
            '</div>' +
            '<div style="font-size:0.78125rem;color:var(--ink-soft);margin-top:2px;">' + AV.getRankThemeInfo(MS.curLevel).desc + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0;">' +
          (AV.getRankThemeInfo(MS.curLevel).nextTier ?
            '<div style="font-size:0.72rem;color:var(--ink-soft);">다음 진화</div><div style="font-size:0.8125rem;font-weight:700;color:' + AV.getRankThemeInfo(MS.curLevel).nextTier.mainColor + ';">' + AV.getRankThemeInfo(MS.curLevel).nextTier.icon + ' ' + AV.getRankThemeInfo(MS.curLevel).nextTier.name + ' (Lv.' + AV.getRankThemeInfo(MS.curLevel).nextLv + ')</div>' :
            '<div style="font-size:0.75rem;font-weight:800;color:var(--violet);">🌌 우주 마스터 달성</div>'
          ) +
        '</div>' +
      '</div>' +

      // 탭 토글
      '<div class="format-toggle" id="avatarTypeToggle" style="margin-bottom:18px;display:flex;background:var(--surface-3);border-radius:10px;padding:3px;">' +
        '<div class="format-opt ' + (MS.curType === 'robot' ? 'active' : '') + '" data-avatartype="robot" style="flex:1;text-align:center;padding:8px;border-radius:8px;font-weight:800;font-size:.875rem;cursor:pointer;">🤖 초록 로봇 (성장형)</div>' +
        '<div class="format-opt ' + (MS.curType === 'custom' ? 'active' : '') + '" data-avatartype="custom" style="flex:1;text-align:center;padding:8px;border-radius:8px;font-weight:800;font-size:.875rem;cursor:pointer;">🎨 만화형 3등신 아바타</div>' +
      '</div>' +

      // 로봇 아바타 선택 섹션
      '<div id="secRobotAvatar" style="display:' + (MS.curType === 'robot' ? 'block' : 'none') + ';">' +
        '<div style="background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;padding:16px;text-align:center;">' +
          '<div style="width:72px;height:72px;margin:0 auto;display:flex;align-items:center;justify-content:center;">' +
            AV.getRobotAvatarSvg(MS.curLevel, 68) +
          '</div>' +
          '<div style="margin-top:10px;font-weight:800;font-size:1rem;color:var(--ink);">현재 성장 단계: Lv.' + MS.curLevel + '</div>' +
          '<div style="font-size:.78125rem;color:var(--ink-soft);margin-top:4px;">기록과 실천이 쌓일수록 안테나, 귀마개, 가슴 엠블럼, 날개가 진화합니다.</div>' +
        '</div>' +
      '</div>' +

      // 만화형 3등신 아바타 섹션
      '<div id="secCustomAvatar" style="display:' + (MS.curType === 'custom' ? 'block' : 'none') + ';">' +
        // 제작 로딩 슬롯
        '<div id="avatarMakerLoadingSlot" style="display:none;background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;"></div>' +

        // 결과 및 등록 박스
        '<div id="avatarMakerResultBox" style="background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;padding:18px 14px;text-align:center;">' +
          '<div id="customAvatarPreviewBox" style="width:110px;height:110px;border-radius:20px;overflow:hidden;border:2.5px solid var(--emerald);background:#fff;margin:0 auto;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(16,185,129,0.18);">' +
            (MS.curCustomUrl ? '<img src="' + MS.curCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">' : '<span style="font-size:2.8rem;">👤</span>') +
          '</div>' +
          '<div id="customAvatarMetaText" style="margin-top:10px;">' +
            '<div style="font-weight:800;font-size:.9375rem;color:var(--ink);">내 사진 기반 만화형 3등신 아바타</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">사진을 업로드한 후 [내 사진으로 아바타 제작]을 누르면 Gemini 비전 AI가 맞춤형 아바타를 제작합니다.</div>' +
          '</div>' +
          '<div style="margin-top:14px;display:flex;justify-content:center;gap:6px;flex-wrap:wrap;">' +
            '<input type="file" id="customAvatarFileInput" accept="image/*" style="display:none;">' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnUploadAvatarPhoto" style="font-size:.8125rem;">📷 사진 선택하기</button>' +
            '<button type="button" class="btn btn-primary btn-sm" id="btnRunCraftAvatar" style="font-size:.8125rem;display:none;">' +
              '✨ 내 사진으로 아바타 제작 <span id="craftBtnCountSpan">(' + MS.remainingCrafts + '/' + MS.maxCrafts + '회)</span>' +
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
                '<input type="date" id="avatarPeriodStartInput" value="' + MS.toDateInputValue(MS.defaultPeriodStart) + '" style="flex:1;min-width:0;padding:6px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink);font-size:.8125rem;">' +
                '<span style="color:var(--ink-soft);">~</span>' +
                '<input type="date" id="avatarPeriodEndInput" value="' + MS.toDateInputValue(MS.defaultPeriodEnd) + '" style="flex:1;min-width:0;padding:6px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink);font-size:.8125rem;">' +
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
            '<div style="font-weight:900;font-size:.875rem;color:var(--ink);">🎨 아바타 10개 관리 인벤토리 <span id="savedAvatarsCountSpan" style="font-size:.75rem;color:var(--ink-soft);font-weight:700;">(' + MS.savedList.length + '/10개)</span></div>' +
            '<div style="font-size:.75rem;color:var(--emerald);font-weight:800;">언제든 0회 차감 변경</div>' +
          '</div>' +
          '<div id="savedAvatarsDeckSlot">' +
            AV.renderSavedAvatarsDeckHtml(MS.savedList, MS.curCustomUrl, MS.curCustomUrl) +
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
              '<input type="text" id="avatarModalGrowthPromptInput" placeholder="예: 더 강하게, 카리스마 넘치게" value="' + (MS.profile.settings && MS.profile.settings.avatarGrowthPrompt ? MS.profile.settings.avatarGrowthPrompt : '더 강하게') + '" style="flex:1;font-size:.8125rem;padding:5px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-2);color:var(--ink);">' +
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
    return html;
  }

  AV.renderAvatarModalMarkup = renderAvatarModalMarkup;
}));
