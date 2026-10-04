/**
 * OurGoal Avatar Cell: 초기 페르소나 복원 · 사진 업로드·제작 실행 (#TASK-ES-390 · 아바타·EXP 쪼개기 PR-4)
 *
 * 이전 전 openAvatarModal(js/avatar-system.js 378~385줄)의 이 섹션을 동작 그대로 옮겼다.
 * 이전 전 openAvatarModal(js/avatar-system.js 700~896줄)의 이 섹션을 동작 그대로 옮겼다.
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

  /* [#TASK-ES-390] 섹션: 초기 페르소나 복원 — openAvatarModal(js/avatar/modal/index.js)이 원래 자리에서 부른다(이전 전 줄 378~385). */
  function restoreAvatarModalPersona(MS) {
      (function preloadCurrentPersona() {
        for (var pi = 0; pi < MS.savedList.length; pi++) {
          if (MS.savedList[pi].url === MS.curCustomUrl && MS.savedList[pi].mbti) {
            MS.currentPersona = { mbti: MS.savedList[pi].mbti, motto: MS.savedList[pi].motto };
            break;
          }
        }
      })();
  }

  /* [#TASK-ES-390] 섹션: 사진 업로드·제작 실행 — openAvatarModal(js/avatar/modal/index.js)이 원래 자리에서 부른다(이전 전 줄 700~896). */
  function bindAvatarModalCraft(MS) {
      // 1) 사진 선택 시: 즉시 3등신 아바타 틀 위에 사진 미리보기 적용 & '아바타 제작' 버튼 활성화
      if (MS.btnUpload && MS.fileInput) {
        MS.btnUpload.onclick = function () {
          if (!MS.profile.settings.hasAgreedAvatarLegalNotice) {
            AV.showAvatarLegalNotice(function () {
              MS.profile.settings.hasAgreedAvatarLegalNotice = true;
              if (MS.saveProfile) MS.saveProfile();
              MS.fileInput.click();
            });
          } else {
            MS.fileInput.click();
          }
        };
        MS.fileInput.onchange = function (e) {
          var file = e.target.files && e.target.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function (ev) {
            MS.lastUploadedDataUrl = ev.target.result;
            var img = new Image();
            img.onload = function () {
              MS.lastUploadedImg = img;
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
                MS.lastUploadedDataUrl = normCv.toDataURL('image/jpeg', 0.85);
              } catch (cvErr) {}

              MS.currentFeatures = AV.extractPersonalFeatures(MS.lastUploadedImg);
              // 사진 미리보기 반영
              MS.previewBox.innerHTML = '<img src="' + MS.lastUploadedDataUrl + '" style="width:100%;height:100%;object-fit:cover;">';
              MS.metaText.innerHTML = '<div style="font-weight:800;font-size:.9375rem;color:var(--ink);">사진이 업로드되었습니다!</div>' +
                '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">아래 [내 사진으로 아바타 제작] 버튼을 누르면 AI가 캐릭터를 생성합니다.</div>';
              if (MS.btnRunCraft) {
                MS.btnRunCraft.style.display = 'inline-block';
                MS.updateRemainingUI();
              }
              MS.toast('사진이 등록되었습니다. [아바타 제작]을 눌러주세요!');
            };
            img.src = MS.lastUploadedDataUrl;
          };
          reader.readAsDataURL(file);
        };
      }

      // 2) '내 사진으로 아바타 제작' 버튼 클릭 시: 실질 3회 차감 & Gemini API 호출 & 무봉제 합성
      if (MS.btnRunCraft) {
        MS.btnRunCraft.onclick = function () {
          if (!MS.lastUploadedImg || !MS.lastUploadedDataUrl) {
            MS.toast('먼저 사진을 선택해주세요.');
            return;
          }
          var r = AV.getRemainingCrafts(MS.profile);
          if (r <= 0) {
            MS.toast('아바타 제작 가능 횟수(' + AV.getMaxCrafts(MS.profile) + '회)를 모두 소진하였습니다. 7일 연속 체크인 시 1회가 자동 충전됩니다.');
            return;
          }

          // [TASK-ES-122] 설정 기간 내 분석할 활동(목표/기록/팀)이 전혀 없으면 제작 진행 안 함(횟수 차감 없음)
          var periodSummary = AV.collectPeriodPersonaSummary(MS.profile, MS.deps.mockGroups, MS.periodStart, MS.periodEnd);
          if (periodSummary.isEmpty) {
            MS.toast('설정하신 기간에 분석할 목표·팀·기록이 없어요. 기간을 다시 선택하거나 넓혀보세요.');
            return;
          }
          var personaPromise = AV.fetchAvatarPersona(periodSummary.summaryText);

          // 횟수 실질 1회 차감!
          MS.settings.avatarCraftCount = (MS.settings.avatarCraftCount || 0) + 1;
          if (MS.deps.state && MS.deps.state.profile && MS.deps.state.profile.settings) {
            MS.deps.state.profile.settings.avatarCraftCount = MS.settings.avatarCraftCount;
          }
          MS.updateRemainingUI();

          // 나무망치 애니메이션 가동
          MS.resultBox.style.display = 'none';
          MS.loadingSlot.style.display = 'block';
          MS.loadingSlot.innerHTML = AV.getWoodHammerMakerAnimationHtml(MS.userNick);

          var pBar = MS.loadingSlot.querySelector('#avatarGenProgress');
          var pct = 15;
          var pTimer = setInterval(function () {
            pct += 15;
            if (pBar) pBar.style.width = Math.min(95, pct) + '%';
          }, 300);

          // [TASK-ES-046 레거시 호환 및 TASK-ES-127 320종 온톨로지 추첨]
          var randIdx = Math.floor(Math.random() * AV.BODY_THEMES_77.length);
          var themePool = AV.BODY_THEMES_320 && AV.BODY_THEMES_320.length ? AV.BODY_THEMES_320 : AV.BODY_THEMES_77;
          randIdx = Math.floor(Math.random() * themePool.length);
          MS.chosenTheme = themePool[randIdx];

          // Gemini API 호출
          // Gemini 3.1 Flash-Lite 비전 호출 + 사진 픽셀 기반 동적 자가 분석 이중 방어
          function handleApiFailure(errMsg) {
            clearInterval(pTimer);
            // 1. 차감되었던 횟수 복원 (사용자 기회 보존)
            MS.settings.avatarCraftCount = Math.max(0, (MS.settings.avatarCraftCount || 1) - 1);
            if (MS.deps.state && MS.deps.state.profile && MS.deps.state.profile.settings) {
              MS.deps.state.profile.settings.avatarCraftCount = MS.settings.avatarCraftCount;
            }
            MS.updateRemainingUI();

            // 2. 로딩 닫고 원래 상태 복원
            MS.loadingSlot.style.display = 'none';
            MS.resultBox.style.display = 'block';

            // 3. 상민님 지시 정확한 안내 문구 표시
            var noticeMsg = '죄송합니다. 현재 아워골 서버문제로 아바타 생성이 지원되지 못하고 있습니다.';
            MS.toast(noticeMsg);
            if (MS.metaText) {
              MS.metaText.innerHTML = '<div style="color:var(--danger,#EF4444);font-weight:700;font-size:.875rem;margin-top:4px;">' +
                noticeMsg + '</div><div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">(제작 횟수는 차감되지 않았습니다. 잠시 후 다시 시도해주세요.)</div>';
            }
          }

          // Gemini 3.1 Flash-Lite Image 멀티모달 생성 호출 (사용자 사진 + 테마 정보 전달)
          fetch('/api/avatar-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: MS.lastUploadedDataUrl,
              theme: MS.chosenTheme
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
                  MS.onAvatarCraftCompleted(finalUrl, persona);
                  MS.toast('[' + MS.chosenTheme.name + '] AI 맞춤형 웹툰 아바타 제작 완료! 🎨✨');
                });
              };
              optImg.onerror = function () {
                personaPromise.then(function (persona) {
                  MS.onAvatarCraftCompleted(resData.avatarUrl, persona);
                  MS.toast('[' + MS.chosenTheme.name + '] AI 맞춤형 웹툰 아바타 제작 완료! 🎨✨');
                });
              };
              optImg.src = resData.avatarUrl;
            } else {
              // 2. 텍스트 분석 기반 5단계 샌드위치 캔버스 폴백 렌더링
              MS.currentFeatures = resData.features;
              setTimeout(function () {
                AV.composite3DeformedAvatar(MS.lastUploadedImg, MS.chosenTheme, function (dataUrl, f) {
                  personaPromise.then(function (persona) {
                    MS.onAvatarCraftCompleted(dataUrl, persona);
                    MS.toast('[' + MS.chosenTheme.name + '] 맞춤형 만화 아바타 제작 완료! 🔨✨');
                  });
                }, { features: MS.currentFeatures });
              }, 400);
            }
          })
          .catch(function (err) {
            console.warn('Avatar API error:', err);
            handleApiFailure(err.message || 'Network error');
          });
        };
      }
  }

  AV.restoreAvatarModalPersona = restoreAvatarModalPersona;
  AV.bindAvatarModalCraft = bindAvatarModalCraft;
}));
