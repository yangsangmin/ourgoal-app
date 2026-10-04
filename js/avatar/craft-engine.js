/**
 * OurGoal Avatar Cell: 사진 → 3등신 합성 · 기간 페르소나 분석 (#TASK-ES-389 · 아바타·EXP 쪼개기 PR-3)
 *
 * js/avatar-system.js(이전 전 3222줄)에서 이 책임 묶음의 선언을 동작 그대로 옮겼다(이전 전 줄: 288~640, 809~877, 2351~2526).
 *   composite3DeformedAvatar · getSmartFallbackFeatures · collectPeriodPersonaSummary · fetchAvatarPersona · extractPersonalFeatures · drawCartoonHead
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

  // ================= 5단계 샌드위치 무봉제 만화형 아바타 캔버스 엔진 =================
  function composite3DeformedAvatar(userImg, theme, callback, options) {
    var size = 160;
    var cvs = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (!cvs) {
      if (callback) callback('');
      return '';
    }

    cvs.width = size;
    cvs.height = size;
    var ctx = cvs.getContext('2d');
    var opts = options || {};
    var features = opts.features || getSmartFallbackFeatures();

    var skin = features.skinColor || '#FFDFBF';
    var hair = (features.hair && features.hair.color) || '#1E293B';
    var hairStyle = (features.hair && features.hair.style) || 'dandy';
    var hairParting = (features.hair && features.hair.parting) || 'none';
    var hairLength = (features.hair && features.hair.length) || 'short';
    var hasGlasses = !!features.hasGlasses;
    var glassesShape = features.glassesShape || 'none';
    var glassesColor = features.glassesColor || '#1E293B';
    var eyeType = (features.eyes && features.eyes.type) || 'round_bright';
    var strokeColor = '#1E293B';

    var cx = 80;
    var cy = 50;
    var r = 36;

    // ----------------------------------------------------
    // [Z-0] 둥근 배경 (테마별 파스텔 톤 & 테두리)
    // ----------------------------------------------------
    ctx.fillStyle = theme.subColor || '#F1F5F9';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = theme.color || '#10B981';
    ctx.lineWidth = 3;
    ctx.stroke();

    // ----------------------------------------------------
    // [Z-1] 뒷머리 레이어 (Back Hair) — 긴머리/단발이 어깨 뒤로 자연스럽게 깔림
    // ----------------------------------------------------
    if (hairLength === 'long' || hairStyle === 'bob' || hairStyle === 'wave' || hairStyle === 'curly' || hairStyle === 'ponytail') {
      ctx.fillStyle = hair;
      ctx.beginPath();
      if (hairStyle === 'ponytail') {
        ctx.arc(cx + r + 2, cy - 6, 12, 0, Math.PI * 2);
        ctx.fill();
        // 머리끈
        ctx.fillStyle = theme.color || '#10B981';
        ctx.beginPath();
        ctx.arc(cx + r - 2, cy - 2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.arc(cx, cy + 8, r + 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ----------------------------------------------------
    // [Z-2] 77종 바디 레이어 (다리, 신발, 몸통, 양팔, 손, 가슴 뱃지)
    // ----------------------------------------------------
    // 짧고 귀여운 3등신 다리
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(58, 126, 18, 22, 6) : ctx.rect(58, 126, 18, 22);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(84, 126, 18, 22, 6) : ctx.rect(84, 126, 18, 22);
    ctx.fill();

    // 신발
    ctx.fillStyle = theme.color || '#10B981';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(54, 140, 24, 12, [4, 8, 4, 4]) : ctx.rect(54, 140, 24, 12);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(82, 140, 24, 12, [8, 4, 4, 4]) : ctx.rect(82, 140, 24, 12);
    ctx.fill();

    // 몸통 (의상 컬러)
    ctx.fillStyle = theme.color || '#10B981';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(50, 88, 60, 42, 12) : ctx.rect(50, 88, 60, 42);
    ctx.fill();

    // 양팔
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(34, 92, 18, 30, 8) : ctx.rect(34, 92, 18, 30);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(108, 92, 18, 30, 8) : ctx.rect(108, 92, 18, 30);
    ctx.fill();

    // 동글동글 손끝
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(43, 124, 7.5, 0, Math.PI * 2);
    ctx.arc(117, 124, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // 가슴 테마 아이콘 장식
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(theme.icon || '⭐', 80, 114);

    // ----------------------------------------------------
    // [Z-3] 목선(Neck) 깊숙이 삽입 — 바디의 가슴 안쪽(y:88)까지 12px 파고듦
    // ----------------------------------------------------
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.rect(cx - 9, cy + r - 8, 18, 22);
    ctx.fill();

    // ----------------------------------------------------
    // [Z-4] 턱선 앰비언트 그림자 (Occlusion Shadow) — 턱 아래에 떨어져 경계선 소멸
    // ----------------------------------------------------
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    ctx.beginPath();
    ctx.arc(cx, cy + r - 3, 12, 0, Math.PI);
    ctx.fill();

    // ----------------------------------------------------
    // [Z-5] 바디의 넥 칼라(옷깃/카라) 오버랩 — 셔츠 깃이 목선 앞을 덮어 이음새 완전 은폐!
    // ----------------------------------------------------
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(66, 86);
    ctx.lineTo(80, 100);
    ctx.lineTo(94, 86);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // ----------------------------------------------------
    // [Z-6] 만화형 얼굴(Face) + 이목구비 + 안경 + 앞머리 일체형 안착
    // ----------------------------------------------------
    // 1. 귀
    ctx.fillStyle = skin;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx - r + 3, cy + 4, 7, 0, Math.PI * 2);
    ctx.arc(cx + r - 3, cy + 4, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. 둥근 얼굴 윤곽
    ctx.fillStyle = skin;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. 발그레한 볼터치 (Blush)
    ctx.fillStyle = features.blushColor || 'rgba(251, 113, 133, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx - 18, cy + 13, 6.5, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 18, cy + 13, 6.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. 눈썹 (인물의 눈썹 형태와 머리색 반영)
    ctx.strokeStyle = hair;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    var browShape = (features.eyebrows && features.eyebrows.shape) || 'arched';
    if (browShape === 'straight') {
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy - 5);
      ctx.lineTo(cx - 12, cy - 5);
      ctx.moveTo(cx + 12, cy - 5);
      ctx.lineTo(cx + 24, cy - 5);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx - 18, cy - 3, 7, Math.PI * 1.15, Math.PI * 1.85);
      ctx.arc(cx + 18, cy - 3, 7, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }

    // 5. 눈 (Eye Slant & Style)
    ctx.fillStyle = strokeColor;
    if (eyeType === 'sharp_confident') {
      // 자신감 넘치고 또렷한 눈매
      ctx.beginPath();
      ctx.ellipse(cx - 16, cy + 4, 5.2, 4.5, -0.15, 0, Math.PI * 2);
      ctx.ellipse(cx + 16, cy + 4, 5.2, 4.5, 0.15, 0, Math.PI * 2);
      ctx.fill();
    } else if (eyeType === 'gentle_smile') {
      // 부드러운 반달 눈웃음
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx - 16, cy + 6, 6, Math.PI * 1.15, Math.PI * 1.85);
      ctx.arc(cx + 16, cy + 6, 6, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else {
      // 맑고 초롱초롱한 만화 눈망울 (round_bright)
      ctx.beginPath();
      ctx.arc(cx - 16, cy + 4, 5.2, 0, Math.PI * 2);
      ctx.arc(cx + 16, cy + 4, 5.2, 0, Math.PI * 2);
      ctx.fill();
      // 별빛 하이라이트
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx - 17.5, cy + 2.5, 1.9, 0, Math.PI * 2);
      ctx.arc(cx - 14.2, cy + 5.8, 1, 0, Math.PI * 2);
      ctx.arc(cx + 14.5, cy + 2.5, 1.9, 0, Math.PI * 2);
      ctx.arc(cx + 17.8, cy + 5.8, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. 안경 (Gemini 비전이 감지한 실제 안경 렌더링)
    if (hasGlasses && glassesShape !== 'none') {
      ctx.strokeStyle = glassesColor || strokeColor;
      ctx.lineWidth = glassesShape === 'black_thick' ? 2.8 : (glassesShape === 'square_horn' ? 2.4 : 1.8);

      if (glassesShape === 'square_horn' || glassesShape === 'black_thick') {
        // 사각 뿔테 안경
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(cx - 26, cy - 2, 20, 15, 3) : ctx.rect(cx - 26, cy - 2, 20, 15);
        ctx.roundRect ? ctx.roundRect(cx + 6, cy - 2, 20, 15, 3) : ctx.rect(cx + 6, cy - 2, 20, 15);
        ctx.stroke();
      } else {
        // 동글이 메탈테 안경 (round_wire, half_rim)
        ctx.beginPath();
        ctx.arc(cx - 16, cy + 4, 9, 0, Math.PI * 2);
        ctx.arc(cx + 16, cy + 4, 9, 0, Math.PI * 2);
        ctx.stroke();
      }
      // 안경 브릿지(코걸이)
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + 3);
      ctx.lineTo(cx + 6, cy + 3);
      ctx.stroke();
    }

    // 7. 앙증맞은 코 & 미소 입
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.arc(cx, cy + 9, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F43F5E';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy + 16, 5, 0.1, Math.PI - 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 혀 포인트
    ctx.fillStyle = '#FDA4AF';
    ctx.beginPath();
    ctx.arc(cx, cy + 18, 3, Math.PI, Math.PI * 2);
    ctx.fill();

    // 8. 앞머리 헤어스타일 (실제 인물의 가르마, 앞머리 형태 반영)
    ctx.fillStyle = hair;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();

    if (hairParting === 'center') {
      // 5:5 가르마 헤어 (Curtain Bangs)
      ctx.arc(cx, cy - 3, r + 2, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(cx + r, cy + 2);
      ctx.quadraticCurveTo(cx + 12, cy - 8, cx, cy - 1);
      ctx.quadraticCurveTo(cx - 12, cy - 8, cx - r, cy + 2);
    } else if (hairParting === 'left' || hairParting === 'right') {
      // 사이드 가르마 (6:4 or 7:3 댄디 투블럭)
      ctx.arc(cx, cy - 3, r + 2, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(cx + r, cy + 2);
      ctx.quadraticCurveTo(cx + 6, cy - 10, cx - 10, cy - 2);
      ctx.quadraticCurveTo(cx - 20, cy - 6, cx - r, cy + 2);
    } else if (hairStyle === 'short' || hairStyle === 'spiky') {
      // 스포티 숏컷
      ctx.arc(cx, cy - 4, r + 2, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(cx + r, cy - 4);
      ctx.lineTo(cx + 14, cy - 6);
      ctx.lineTo(cx + 2, cy - 4);
      ctx.lineTo(cx - 12, cy - 6);
      ctx.lineTo(cx - r, cy - 4);
    } else if (hairStyle === 'bob') {
      // 단발 뱅 앞머리
      ctx.arc(cx, cy - 3, r + 3, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(cx + r + 2, cy + 10);
      ctx.quadraticCurveTo(cx + 16, cy + 2, cx, cy - 2);
      ctx.quadraticCurveTo(cx - 16, cy + 2, cx - r - 2, cy + 10);
    } else {
      // 기본 댄디 볼륨 컷
      ctx.arc(cx, cy - 3, r + 2, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(cx + r, cy + 2);
      ctx.quadraticCurveTo(cx + 18, cy - 4, cx + 6, cy - 2);
      ctx.quadraticCurveTo(cx - 6, cy - 6, cx - 18, cy - 3);
      ctx.lineTo(cx - r, cy + 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 헤어 윤기 엔젤링
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy - 5, r - 8, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();

    // [중요 요구사항 4]: 좌측 상단 #(번호) (아바타이름) 뱃지 렌더링 코드 완전 삭제!
    // (캔버스에는 순수한 캐릭터 일러스트만 깔끔하게 남김)

    var finalUrl = cvs.toDataURL('image/png');
    if (callback) callback(finalUrl, features);
    return finalUrl;
  }

  function getSmartFallbackFeatures() {
    return {
      hasGlasses: false,
      glassesShape: 'none',
      glassesColor: '#1E293B',
      skinColor: '#FFDFBF',
      blushColor: 'rgba(251,113,133,0.45)',
      hairColor: '#1E293B',
      hair: {
        style: 'dandy',
        parting: 'none',
        hasBangs: true,
        length: 'short',
        color: '#1E293B'
      },
      eyes: {
        type: 'round_bright',
        hasDoubleEyelid: true
      },
      eyebrows: {
        shape: 'arched',
        color: '#1E293B'
      },
      mouth: {
        expression: 'bright_smile'
      },
      similarityNote: '화사하고 밝은 3등신 만화 캐릭터'
    };
  }

  // [TASK-ES-122] 기간 내 목표/기록/팀 활동 요약 텍스트 생성 (MBTI/좌우명 분석 입력)
  function collectPeriodPersonaSummary(profile, mockGroups, startDate, endDate) {
    var startTs = startDate.getTime();
    var endTs = endDate.getTime();
    var goals = ((profile && profile.goals) || []).filter(function (g) {
      var created = g.createdAt || g.startAt || null;
      if (!created) return false;
      var t = new Date(created).getTime();
      return !isNaN(t) && t >= startTs && t <= endTs;
    });
    var records = ((profile && profile.records) || []).filter(function (r) {
      if (!r.startAt) return false;
      var t = new Date(r.startAt).getTime();
      return !isNaN(t) && t >= startTs && t <= endTs;
    });
    var teamLines = [];
    try {
      var gState = (profile && profile.settings && profile.settings.groupState) || {};
      (mockGroups || []).forEach(function (g) {
        var gs = gState[g.id];
        if (!gs || !gs.joined) return;
        var role = gs.myRole || 'member';
        var teamGoals = g.teamGoals || [];
        if (teamGoals.length === 0) {
          teamLines.push((g.name || '팀') + '(역할:' + role + ') 참여 중');
          return;
        }
        teamGoals.forEach(function (tg) {
          var ms = tg.milestones || [];
          var doneCnt = ms.filter(function (m) { return m.status === 'done'; }).length;
          teamLines.push((g.name || '팀') + '(역할:' + role + ') 팀목표 "' + (tg.title || '') + '" 진행 ' + doneCnt + '/' + ms.length);
        });
      });
    } catch (e) {}

    var lines = [];
    if (goals.length) {
      lines.push('[목표 ' + goals.length + '건] ' + goals.map(function (g) { return g.title || g.name || '목표'; }).slice(0, 20).join(', '));
    }
    if (records.length) {
      lines.push('[기록 ' + records.length + '건] ' + records.map(function (r) { return r.title || r.type || r.category || '실천 기록'; }).slice(0, 30).join(', '));
    }
    if (teamLines.length) {
      lines.push('[팀 활동] ' + teamLines.join(' / '));
    }

    return {
      goalsCount: goals.length,
      recordsCount: records.length,
      teamCount: teamLines.length,
      isEmpty: goals.length === 0 && records.length === 0 && teamLines.length === 0,
      summaryText: lines.join('\n')
    };
  }

  // [TASK-ES-122] 서버(Gemini)에 기간 요약을 전달해 MBTI·좌우명 생성
  function fetchAvatarPersona(summaryText) {
    return fetch('/api/avatar-persona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'avatar-persona', summaryText: summaryText })
    }).then(function (res) {
      if (!res.ok) throw new Error('persona API status ' + res.status);
      return res.json();
    }).then(function (data) {
      if (data && data.persona && data.persona.mbti && data.persona.motto) return data.persona;
      return null;
    }).catch(function () { return null; });
  }

  // [TASK-ES-047 호환] 사진 기반 퍼스널 컬러 및 특징 추출
  function extractPersonalFeatures(img) {
    var defaultFeatures = getSmartFallbackFeatures();
    if (!img || typeof document === 'undefined') return defaultFeatures;

    try {
      var scanCvs = document.createElement('canvas');
      var scanW = 64;
      var scanH = 64;
      scanCvs.width = scanW;
      scanH = scanH;
      var scanCtx = scanCvs.getContext('2d');
      if (!scanCtx) return defaultFeatures;

      scanCtx.drawImage(img, 0, 0, scanW, scanH);
      var imgData = scanCtx.getImageData(0, 0, scanW, scanH).data;

      // 1. 얼굴 중심부 픽셀 샘플링 (피부톤 감지: x:22~42, y:24~44)
      var skinR = 0, skinG = 0, skinB = 0, skinCount = 0;
      for (var y = 24; y < 44; y++) {
        for (var x = 22; x < 42; x++) {
          var idx = (y * scanW + x) * 4;
          var r = imgData[idx];
          var g = imgData[idx + 1];
          var b = imgData[idx + 2];
          // 사람 피부 대략 필터링 (R > B, R > 70)
          if (r > 70 && r >= b) {
            skinR += r;
            skinG += g;
            skinB += b;
            skinCount++;
          }
        }
      }

      var chosenSkin = '#FFDFBF';
      var blushTone = 'rgba(251,113,133,0.45)';
      if (skinCount > 0) {
        var avgR = Math.round(skinR / skinCount);
        var avgG = Math.round(skinG / skinCount);
        var avgB = Math.round(skinB / skinCount);
        var brightness = (avgR * 299 + avgG * 587 + avgB * 114) / 1000;

        if (brightness > 210) {
          chosenSkin = '#FFF0E5'; // 뽀샤시 쿨베이지
          blushTone = 'rgba(253,164,175,0.45)';
        } else if (brightness > 185) {
          chosenSkin = '#FFE3D1'; // 맑은 웜베이지
          blushTone = 'rgba(251,113,133,0.45)';
        } else if (brightness > 155) {
          chosenSkin = '#FAD2B0'; // 내추럴 피치
          blushTone = 'rgba(244,114,182,0.45)';
        } else if (brightness > 125) {
          chosenSkin = '#E8B68E'; // 건강한 탠
          blushTone = 'rgba(236,72,153,0.35)';
        } else {
          chosenSkin = '#D2966E'; // 차분한 브론즈
          blushTone = 'rgba(225,29,72,0.35)';
        }
      }

      // 2. 머리 상단부 픽셀 샘플링 (헤어 컬러 감지: x:18~46, y:6~18)
      var hairR = 0, hairG = 0, hairB = 0, hairCount = 0;
      for (var hy = 6; hy < 18; hy++) {
        for (var hx = 18; hx < 46; hx++) {
          var hidx = (hy * scanW + hx) * 4;
          var hr = imgData[hidx];
          var hg = imgData[hidx + 1];
          var hb = imgData[hidx + 2];
          hairR += hr;
          hairG += hg;
          hairB += hb;
          hairCount++;
        }
      }

      var chosenHair = '#1E293B';
      var hairStyle = 'dandy';
      var hairParting = 'none';
      var hairLength = 'short';

      if (hairCount > 0) {
        var hAvgR = Math.round(hairR / hairCount);
        var hAvgG = Math.round(hairG / hairCount);
        var hAvgB = Math.round(hairB / hairCount);
        var hBrightness = (hAvgR * 299 + hAvgG * 587 + hAvgB * 114) / 1000;

        if (hBrightness < 50) {
          chosenHair = '#0F172A'; // 딥 제트블랙
        } else if (hAvgR > hAvgB + 25 && hAvgR > hAvgG) {
          chosenHair = '#78350F'; // 체스넛 브라운
        } else if (hBrightness > 110) {
          chosenHair = '#92400E'; // 골드/라이트 브라운
        } else if (hBrightness > 75) {
          chosenHair = '#451A03'; // 다크 모카
        } else {
          chosenHair = '#1E293B'; // 내추럴 흑갈색
        }
      }

      // 3. 측면 헤어 기장 감지 (어깨선/귀 옆 y:32~48 영역)
      var sideHairCount = 0;
      for (var sy = 32; sy < 48; sy++) {
        for (var sx = 6; sx < 16; sx++) {
          var sidx = (sy * scanW + sx) * 4;
          var sBri = (imgData[sidx] * 299 + imgData[sidx + 1] * 587 + imgData[sidx + 2] * 114) / 1000;
          if (sBri < 80) sideHairCount++;
        }
        for (var sx2 = 48; sx2 < 58; sx2++) {
          var sidx2 = (sy * scanW + sx2) * 4;
          var sBri2 = (imgData[sidx2] * 299 + imgData[sidx2 + 1] * 587 + imgData[sidx2 + 2] * 114) / 1000;
          if (sBri2 < 80) sideHairCount++;
        }
      }

      if (sideHairCount > 60) {
        hairLength = 'long';
        hairStyle = 'wave';
      } else if (sideHairCount > 30) {
        hairLength = 'medium';
        hairStyle = 'bob';
      } else {
        hairLength = 'short';
        // 가르마/투블럭 다양성
        var hairSeed = (skinR + hairR) % 4;
        if (hairSeed === 0) { hairStyle = 'two_block'; hairParting = 'left'; }
        else if (hairSeed === 1) { hairStyle = 'curtain'; hairParting = 'center'; }
        else if (hairSeed === 2) { hairStyle = 'spiky'; hairParting = 'none'; }
        else { hairStyle = 'dandy'; hairParting = 'none'; }
      }

      // 4. 안경 감지 (미간 및 눈 주위 명암 대비)
      var eyeBri1 = 0, eyeBri2 = 0;
      for (var ex = 18; ex < 28; ex++) {
        var eidx = (30 * scanW + ex) * 4;
        eyeBri1 += (imgData[eidx] * 299 + imgData[eidx + 1] * 587 + imgData[eidx + 2] * 114) / 1000;
      }
      var hasGlasses = (eyeBri1 / 10) < 65;

      return {
        hasGlasses: hasGlasses,
        glassesShape: hasGlasses ? 'round_wire' : 'none',
        glassesColor: '#1E293B',
        skinColor: chosenSkin,
        blushColor: blushTone,
        hair: {
          style: hairStyle,
          parting: hairParting,
          hasBangs: true,
          length: hairLength,
          color: chosenHair
        },
        eyes: {
          type: (skinR % 3 === 0) ? 'gentle_smile' : ((skinR % 3 === 1) ? 'sharp_confident' : 'round_bright'),
          hasDoubleEyelid: true
        },
        eyebrows: {
          shape: 'arched',
          color: chosenHair
        },
        mouth: {
          expression: 'bright_smile'
        },
        similarityNote: '사진의 실제 톤을 정밀 반영한 맞춤형 만화 캐릭터'
      };
    } catch (e) {
      console.warn('extractPersonalFeatures error:', e);
      return defaultFeatures;
    }
  }

  // [TASK-ES-047 호환] 3등신 만화형 헤드 렌더러
  function drawCartoonHead(ctx, cx, cy, r, features, theme) {
    // composite3DeformedAvatar 샌드위치 렌더러와 통합
    return true;
  }

  AV.composite3DeformedAvatar = composite3DeformedAvatar;
  AV.getSmartFallbackFeatures = getSmartFallbackFeatures;
  AV.collectPeriodPersonaSummary = collectPeriodPersonaSummary;
  AV.fetchAvatarPersona = fetchAvatarPersona;
  AV.extractPersonalFeatures = extractPersonalFeatures;
  AV.drawCartoonHead = drawCartoonHead;
}));
