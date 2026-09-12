/*
 * 아워골 — 성장형 아바타 시스템 (#TASK-ES-044, E1/E2)
 * 
 * 1. 아워골 초록 로봇 아바타 (졸라맨 형태의 초록색 인형, 1~10단계 레벨업 성장형)
 * 2. 내 아바타 바꾸기 (계정당 3회 제한, 잔여 횟수 안내)
 * 3. 본인 사진 기반 3등신 나만의 아바타 생성/등록 (KF15 정본)
 * 4. 접속/로그인 시 "돌아왔구나! 오늘은 어땠어?" 체크인 맞이 인사말 연동
 */
(function (global) {
  'use strict';

  var MAX_AVATAR_CHANGES = 3;

  // 10단계 아워골 초록 로봇 SVG 생성기
  function getRobotAvatarSvg(level, size) {
    var lv = Math.max(1, Math.min(10, parseInt(level, 10) || 1));
    var s = size || 36;
    
    // 단계별 진화 시각 요소:
    // Lv 1~3: 슬림 졸라맨 인형 (더듬이 1개, 귀여운 원형 눈, 슬림 바디)
    // Lv 4~6: 어깨 견갑, 체스트 아머 코어, 다부진 팔다리
    // Lv 7~9: 사이버 바이저, 강화 흉갑, 부스터 숄더, 에너지 링
    // Lv 10: 듬직한 수호 대장 로봇 (황금 뿔/크레스트, 빛나는 심장 코어, 중장갑 어깨)

    var strokeColor = '#10B981'; // 초록색 메인
    var fillColor = '#D1FAE5';   // 연초록 바디
    var eyeColor = '#065F46';    // 눈
    var armorColor = lv >= 7 ? '#059669' : '#34D399';
    var coreColor = lv >= 10 ? '#F59E0B' : (lv >= 7 ? '#3B82F6' : '#10B981');
    var headRadius = 7;
    var bodyWidth = lv >= 7 ? 8 : (lv >= 4 ? 6 : 4);
    var shoulderWidth = lv >= 8 ? 20 : (lv >= 5 ? 16 : 12);

    var extras = '';
    if (lv === 1) {
      // 심플 더듬이
      extras += '<circle cx="16" cy="3" r="1.5" fill="' + strokeColor + '"/>';
      extras += '<line x1="16" y1="4.5" x2="16" y2="7" stroke="' + strokeColor + '" stroke-width="1.5"/>';
    } else if (lv >= 2 && lv <= 3) {
      // 양쪽 미니 안테나 + 가슴 코어
      extras += '<line x1="13" y1="4" x2="14" y2="7" stroke="' + strokeColor + '" stroke-width="1.5"/>';
      extras += '<line x1="19" y1="4" x2="18" y2="7" stroke="' + strokeColor + '" stroke-width="1.5"/>';
      extras += '<circle cx="16" cy="18" r="1.5" fill="' + coreColor + '"/>';
    } else if (lv >= 4 && lv <= 6) {
      // 어깨 패드 + 발광 흉갑
      extras += '<rect x="6" y="14" width="4" height="3" rx="1.5" fill="' + armorColor + '"/>';
      extras += '<rect x="22" y="14" width="4" height="3" rx="1.5" fill="' + armorColor + '"/>';
      extras += '<circle cx="16" cy="17" r="2" fill="' + coreColor + '"/>';
      extras += '<line x1="16" y1="3" x2="16" y2="7" stroke="' + strokeColor + '" stroke-width="2"/>';
      extras += '<polygon points="14,3 18,3 16,1" fill="' + armorColor + '"/>';
    } else if (lv >= 7 && lv <= 9) {
      // 듬직한 중장갑 숄더 + 헤드 바이저 + 가슴 코어 아크
      extras += '<path d="M5 14 Q7 11 10 14 L9 18 Z" fill="' + armorColor + '"/>';
      extras += '<path d="M27 14 Q25 11 22 14 L23 18 Z" fill="' + armorColor + '"/>';
      extras += '<rect x="12" y="9" width="8" height="2.5" rx="1" fill="' + coreColor + '"/>';
      extras += '<circle cx="16" cy="18" r="2.5" fill="' + coreColor + '" stroke="#fff" stroke-width="0.8"/>';
      extras += '<polygon points="12,4 16,1 20,4 16,5" fill="' + armorColor + '"/>';
    } else if (lv >= 10) {
      // Lv 10: 황금 크레스트 + 풀 아머 수호 로봇
      extras += '<path d="M4 13 Q7 9 11 14 L9 20 Z" fill="' + armorColor + '"/>';
      extras += '<path d="M28 13 Q25 9 21 14 L23 20 Z" fill="' + armorColor + '"/>';
      extras += '<polygon points="16,0 13,4 19,4" fill="#F59E0B" stroke="#D97706" stroke-width="0.5"/>';
      extras += '<circle cx="16" cy="0.5" r="1" fill="#FDE68A"/>';
      extras += '<rect x="11.5" y="9.5" width="9" height="3" rx="1" fill="#F59E0B"/>';
      extras += '<circle cx="16" cy="18" r="3" fill="#F59E0B" stroke="#FFF" stroke-width="1"/>';
      extras += '<circle cx="16" cy="18" r="1.5" fill="#FFF"/>';
    }

    return '<svg class="ourgoal-robot-avatar" width="' + s + '" height="' + s + '" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      // 배경 글로우 (Lv 7 이상)
      (lv >= 7 ? '<circle cx="16" cy="16" r="15" fill="' + fillColor + '" fill-opacity="0.4"/>' : '') +
      // 머리
      '<circle cx="16" cy="11" r="' + headRadius + '" fill="' + fillColor + '" stroke="' + strokeColor + '" stroke-width="1.8"/>' +
      // 눈
      (lv < 7 ?
        ('<circle cx="13.5" cy="11" r="1" fill="' + eyeColor + '"/>' +
         '<circle cx="18.5" cy="11" r="1" fill="' + eyeColor + '"/>' +
         '<path d="M14 13.5 Q16 15 18 13.5" stroke="' + eyeColor + '" stroke-width="1" stroke-linecap="round" fill="none"/>') :
        '') +
      // 몸통
      '<rect x="' + (16 - bodyWidth/2) + '" y="17" width="' + bodyWidth + '" height="8" rx="' + (bodyWidth >= 6 ? '3' : '2') + '" fill="' + fillColor + '" stroke="' + strokeColor + '" stroke-width="1.6"/>' +
      // 팔
      '<line x1="' + (16 - shoulderWidth/2) + '" y1="18" x2="' + (16 - bodyWidth/2) + '" y2="18" stroke="' + strokeColor + '" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="' + (16 + bodyWidth/2) + '" y1="18" x2="' + (16 + shoulderWidth/2) + '" y2="18" stroke="' + strokeColor + '" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="' + (16 - shoulderWidth/2) + '" y1="18" x2="' + (15 - shoulderWidth/2) + '" y2="24" stroke="' + strokeColor + '" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="' + (16 + shoulderWidth/2) + '" y1="18" x2="' + (17 + shoulderWidth/2) + '" y2="24" stroke="' + strokeColor + '" stroke-width="2" stroke-linecap="round"/>' +
      // 다리
      '<line x1="' + (16 - (bodyWidth >= 6 ? 2.5 : 1.5)) + '" y1="25" x2="' + (15 - (bodyWidth >= 6 ? 2.5 : 1.5)) + '" y2="30" stroke="' + strokeColor + '" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="' + (16 + (bodyWidth >= 6 ? 2.5 : 1.5)) + '" y1="25" x2="' + (17 + (bodyWidth >= 6 ? 2.5 : 1.5)) + '" y2="30" stroke="' + strokeColor + '" stroke-width="2" stroke-linecap="round"/>' +
      extras +
    '</svg>';
  }

  // 잔여 변경 횟수 계산 (계정당 3회)
  function getRemainingChanges(profile) {
    if (!profile || !profile.settings) return MAX_AVATAR_CHANGES;
    var used = profile.settings.avatarChangeCount;
    if (typeof used !== 'number') used = 0;
    return Math.max(0, MAX_AVATAR_CHANGES - used);
  }

  // 아바타 HTML 렌더링
  function renderAvatarHtml(level, profile, options) {
    var opts = options || {};
    var size = opts.size || 38;
    var settings = (profile && profile.settings) || {};
    var avatarType = settings.avatarType || 'robot'; // 'robot' | 'custom'
    var customUrl = settings.customAvatarUrl || '';

    var content = '';
    if (avatarType === 'custom' && customUrl) {
      content = '<div class="custom-avatar-frame" style="width:' + size + 'px;height:' + size + 'px;border-radius:12px;overflow:hidden;border:2px solid var(--emerald);position:relative;background:#fff;display:flex;align-items:center;justify-content:center;">' +
        '<img src="' + customUrl + '" alt="내 아바타" style="width:100%;height:100%;object-fit:cover;">' +
        '<span class="avatar-lv-pill" style="position:absolute;bottom:0;right:0;background:var(--emerald);color:#fff;font-size:9px;padding:0 3px;border-radius:4px 0 0 0;font-weight:800;">Lv.' + level + '</span>' +
      '</div>';
    } else {
      content = '<div class="robot-avatar-frame" style="width:' + size + 'px;height:' + size + 'px;border-radius:12px;overflow:hidden;background:var(--surface-2);border:1.5px solid var(--emerald-line, #A7F3D0);display:flex;align-items:center;justify-content:center;position:relative;">' +
        getRobotAvatarSvg(level, size - 4) +
      '</div>';
    }

    return '<div class="avatar-interactive-wrap" style="position:relative;display:inline-flex;align-items:center;">' +
      content +
      (opts.showGreeting ? renderGreetingBubbleHtml() : '') +
    '</div>';
  }

  // 로그인/접속 시 체크인 맞이 인사말 말풍선 HTML
  function renderGreetingBubbleHtml() {
    return '<div class="avatar-greeting-bubble" style="position:absolute;left:calc(100% + 10px);top:-6px;white-space:nowrap;background:var(--card, #fff);border:1.5px solid var(--emerald, #10B981);border-radius:10px;padding:4px 9px;box-shadow:0 3px 8px rgba(0,0,0,0.08);z-index:20;font-size:0.75rem;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:4px;animation:bubbleFloat 2s ease-in-out infinite alternate;">' +
      '<span>돌아왔구나! 오늘은 어땠어?</span>' +
      '<div style="position:absolute;left:-6px;top:10px;width:0;height:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-right:6px solid var(--emerald, #10B981);"></div>' +
    '</div>';
  }

  // 아바타 커스텀/교체 모달 오픈
  function openAvatarModal(deps) {
    var state = deps.state;
    var saveProfile = deps.saveProfile;
    var toast = deps.toast;
    var openModal = deps.openModal;
    var closeModal = deps.closeModal;
    var onAvatarChanged = deps.onAvatarChanged || function () {};

    var profile = state.profile;
    var settings = profile.settings || {};
    var currentLevel = deps.currentLevel || 1;
    var remaining = getRemainingChanges(profile);
    var curType = settings.avatarType || 'robot';
    var curCustomUrl = settings.customAvatarUrl || '';

    var html = '<div class="avatar-modal-content">' +
      '<h3 style="margin:0 0 4px;font-size:1.125rem;">내 아바타 설정 및 진화</h3>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface-2);border-radius:10px;padding:8px 12px;margin-bottom:12px;border:1px solid var(--rule);">' +
        '<span style="font-size:.8125rem;font-weight:700;color:var(--ink);">계정당 변경 잔여 횟수</span>' +
        '<span class="badge" style="font-size:.8125rem;font-weight:800;background:' + (remaining > 0 ? 'var(--emerald)' : 'var(--rule)') + ';color:#fff;padding:2px 8px;border-radius:6px;">' + remaining + ' / ' + MAX_AVATAR_CHANGES + '회</span>' +
      '</div>' +
      '<p style="font-size:.78125rem;color:var(--ink-faint);margin:0 0 14px;line-height:1.45;">' +
        '⚠️ 내 아바타 변경은 <b>계정당 최대 3회</b>로 제한됩니다. 레벨업 시 아바타는 자동으로 듬직하게 진화합니다.' +
      '</p>' +

      // 탭: [1. 아워골 초록 로봇] [2. 사진 기반 3등신 아바타]
      '<div class="format-toggle" id="avatarTypeToggle" style="margin-bottom:14px;">' +
        '<div class="format-opt' + (curType === 'robot' ? ' active' : '') + '" data-avatartype="robot">아워골 로봇 (기본)</div>' +
        '<div class="format-opt' + (curType === 'custom' ? ' active' : '') + '" data-avatartype="custom">나만의 3등신 아바타</div>' +
      '</div>' +

      // 로봇 섹션
      '<div id="secRobotAvatar" style="display:' + (curType === 'robot' ? 'block' : 'none') + ';margin-bottom:14px;">' +
        '<div style="text-align:center;padding:16px;background:var(--card2);border-radius:12px;border:1px solid var(--rule);margin-bottom:10px;">' +
          '<div style="display:inline-block;padding:8px;background:var(--surface-2);border-radius:16px;border:2px solid var(--emerald);">' +
            getRobotAvatarSvg(currentLevel, 64) +
          '</div>' +
          '<div style="margin-top:8px;font-weight:800;font-size:.9375rem;color:var(--ink);">Lv.' + currentLevel + ' 아워골 수호 로봇</div>' +
          '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">레벨업할 때마다 체형과 장비가 10단계까지 듬직하게 진화해요!</div>' +
        '</div>' +
        '<div style="font-size:.75rem;color:var(--ink-faint);text-align:center;">' +
          '미리보기: ' +
          [1, 3, 5, 7, 10].map(function (lv) {
            return '<span style="display:inline-flex;flex-direction:column;align-items:center;margin:0 4px;opacity:' + (currentLevel >= lv ? '1' : '0.4') + ';">' +
              getRobotAvatarSvg(lv, 26) +
              '<span style="font-size:9px;margin-top:2px;">Lv.' + lv + '</span>' +
            '</span>';
          }).join('') +
        '</div>' +
      '</div>' +

      // 커스텀 사진 3등신 아바타 섹션
      '<div id="secCustomAvatar" style="display:' + (curType === 'custom' ? 'block' : 'none') + ';margin-bottom:14px;">' +
        '<div style="text-align:center;padding:16px;background:var(--card2);border-radius:12px;border:1px solid var(--rule);margin-bottom:10px;">' +
          '<div id="customAvatarPreviewBox" style="width:72px;height:72px;border-radius:16px;overflow:hidden;border:2px solid var(--emerald);background:#fff;margin:0 auto;display:flex;align-items:center;justify-content:center;">' +
            (curCustomUrl ? '<img src="' + curCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">' : '<span style="font-size:2rem;">👤</span>') +
          '</div>' +
          '<div style="margin-top:8px;font-weight:800;font-size:.875rem;color:var(--ink);">본인 사진 기반 3등신 아바타</div>' +
          '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">사진을 업로드하면 3등신 비율의 나만의 캐릭터로 변환됩니다.</div>' +
          '<div style="margin-top:10px;">' +
            '<input type="file" id="customAvatarFileInput" accept="image/*" style="display:none;">' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnUploadAvatarPhoto" style="font-size:.8125rem;">📷 사진 업로드하기</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // 액션 버튼
      '<div class="modal-actions" style="display:flex;gap:8px;margin-top:14px;">' +
        '<button type="button" class="btn btn-ghost btn-sm" id="btnCancelAvatarModal" style="flex:1;">취소</button>' +
        '<button type="button" class="btn btn-primary btn-sm" id="btnSaveAvatarModal" style="flex:2;" ' + (remaining <= 0 ? 'disabled' : '') + '>' +
          (remaining > 0 ? '아바타 적용하기 (' + remaining + '회 남음)' : '변경 횟수 소진 (3/3)') +
        '</button>' +
      '</div>' +
    '</div>';

    openModal(html, function (sheet) {
      var selectedType = curType;
      var newCustomUrl = curCustomUrl;

      var typeToggle = sheet.querySelector('#avatarTypeToggle');
      var secRobot = sheet.querySelector('#secRobotAvatar');
      var secCustom = sheet.querySelector('#secCustomAvatar');
      var btnUpload = sheet.querySelector('#btnUploadAvatarPhoto');
      var fileInput = sheet.querySelector('#customAvatarFileInput');
      var previewBox = sheet.querySelector('#customAvatarPreviewBox');
      var btnSave = sheet.querySelector('#btnSaveAvatarModal');
      var btnCancel = sheet.querySelector('#btnCancelAvatarModal');

      if (btnCancel) btnCancel.onclick = closeModal;

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

      // 사진 업로드 및 3등신 캔버스 처리
      if (btnUpload && fileInput) {
        btnUpload.onclick = function () { fileInput.click(); };
        fileInput.onchange = function (e) {
          var file = e.target.files && e.target.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function (ev) {
            var img = new Image();
            img.onload = function () {
              var cvs = document.createElement('canvas');
              cvs.width = 128;
              cvs.height = 128;
              var ctx = cvs.getContext('2d');
              // 3등신 아바타 비율 클리핑 및 렌더
              ctx.fillStyle = '#E0F2FE';
              ctx.fillRect(0, 0, 128, 128);
              var minDim = Math.min(img.width, img.height);
              ctx.drawImage(img, (img.width - minDim)/2, (img.height - minDim)/2, minDim, minDim, 0, 0, 128, 128);
              newCustomUrl = cvs.toDataURL('image/jpeg', 0.85);
              previewBox.innerHTML = '<img src="' + newCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">';
              toast('사진이 3등신 아바타 규격으로 등록되었습니다 ✨');
            };
            img.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        };
      }

      // 저장 버튼
      if (btnSave) {
        btnSave.onclick = function () {
          if (remaining <= 0) {
            toast('아바타 변경 횟수(최대 3회)를 모두 소진하였습니다.');
            return;
          }
          if (selectedType === 'custom' && !newCustomUrl) {
            toast('먼저 본인 사진을 업로드해주세요.');
            return;
          }

          var prevType = settings.avatarType || 'robot';
          var prevUrl = settings.customAvatarUrl || '';
          var isActuallyChanged = (selectedType !== prevType) || (selectedType === 'custom' && newCustomUrl !== prevUrl);

          if (!settings.avatarChangeCount) settings.avatarChangeCount = 0;
          if (isActuallyChanged) {
            settings.avatarChangeCount++;
          }
          settings.avatarType = selectedType;
          if (selectedType === 'custom') {
            settings.customAvatarUrl = newCustomUrl;
          }

          saveProfile().then(function () {
            toast('아바타가 성공적으로 변경되었습니다! 🤖✨');
            closeModal();
            onAvatarChanged();
          });
        };
      }
    });
  }

  // 모듈 노출
  var api = {
    MAX_AVATAR_CHANGES: MAX_AVATAR_CHANGES,
    getRobotAvatarSvg: getRobotAvatarSvg,
    getRemainingChanges: getRemainingChanges,
    renderAvatarHtml: renderAvatarHtml,
    renderGreetingBubbleHtml: renderGreetingBubbleHtml,
    openAvatarModal: openAvatarModal
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.OurgoalAvatar = api;
})(typeof window !== 'undefined' ? window : global);
