/**
 * OurGoal Avatar Level-Up Modal (설정 — 아바타 레벨업 대형 팝업 & 성장 성향 키워드)
 *
 * 레벨이 오르면 뜨는 「LEVEL UP!」 대형 팝업 열기·닫기(openAvatarLevelUpModal·closeAvatarLevelUpModal)와 성장 성향 키워드 저장(유해 단어 거름 filterHarmfulWords)·공유·이미지 저장 처리기.
 * 처리기 등록 문 네 개는 bind 함수로 감싸 index.html 원래 자리에서 부른다. window 노출 두 줄·단추 요소 변수 선언·3줄 이하 등록은 원래 자리에 그대로 있다.
 * #TASK-ES-476(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 3303~3310 · 3311~3353 · 3354~3358 · 3368~3372 · 3375~3398 · 3401~3414 · 3417~3459줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* ---- 이전 전 index.html 3303~3310줄(#TASK-ES-476 생성기 표지) ---- */
  function filterHarmfulWords(text){
    if(!text) return { clean: '', hasHarmful: false };
    var harmfulRegex = /씨발|시발|병신|개새|지랄|존나|썅|꺼져|죽어|자살|섹스|야동|보지|자지|바보|멍청이/gi;
    if(harmfulRegex.test(text)){
      return { clean: text.replace(harmfulRegex, '***'), hasHarmful: true };
    }
    return { clean: text, hasHarmful: false };
  }
  /* ---- 이전 전 index.html 3311~3353줄(#TASK-ES-476 생성기 표지) ---- */

  function openAvatarLevelUpModal(level){
    var m = document.getElementById('avatarLevelUpModal');
    if(!m) return;
    var xpTotal = (L.state.profile && L.state.profile.settings && L.state.profile.settings.xp && L.state.profile.settings.xp.total) || 0;
    var curLv = level || L.levelForXP(xpTotal);
    
    var titleEl = document.getElementById('avatarLevelUpTitle');
    if(titleEl) titleEl.textContent = '🎉 LEVEL UP! Lv.' + curLv + ' 달성!';
    
    var themeInfo = (window.OurgoalAvatar && window.OurgoalAvatar.getRankThemeInfo) ? window.OurgoalAvatar.getRankThemeInfo(curLv) : { title: 'Lv.' + curLv + ' 달성', badgeGradient: 'linear-gradient(135deg,#6366f1,#a855f7)', icon: '⭐', glow: 'rgba(99,102,241,0.5)' };

    var badgeEl = document.getElementById('avatarLevelUpBadge');
    var curPrompt = (L.state.profile && L.state.profile.settings && L.state.profile.settings.avatarGrowthPrompt) || '더 강하게';
    if(badgeEl) {
      badgeEl.innerHTML = '<span class="badge" style="background:' + themeInfo.badgeGradient + ';color:#fff;font-size:.9rem;padding:4px 14px;border-radius:12px;font-weight:800;display:inline-flex;align-items:center;gap:6px;box-shadow:0 0 10px ' + themeInfo.glow + ';">' + themeInfo.icon + ' ' + themeInfo.title + ' (Lv.' + curLv + ')</span>' +
        '<div style="margin-top:6px;font-size:0.8125rem;font-weight:800;color:var(--violet);background:rgba(139,92,246,0.12);padding:3px 10px;border-radius:8px;border:1px solid rgba(139,92,246,0.3);display:inline-block;">✨ 성장 성향: "' + curPrompt + '" 반영 진화</div>';
    }

    var imgContainer = document.getElementById('avatarLevelUpImgContainer');
    if(imgContainer){
      if(window.OurgoalAvatar && window.OurgoalAvatar.renderAvatarHtml){
        imgContainer.innerHTML = window.OurgoalAvatar.renderAvatarHtml(curLv, L.state.profile, { size: 130, withRankBg: true });
      } else if(L.state.profile && L.state.profile.avatarImage){
        imgContainer.innerHTML = '<img src="' + L.state.profile.avatarImage + '" alt="아바타" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">';
      } else {
        imgContainer.innerHTML = '<span style="font-size:5rem;">🧑‍🚀</span>';
      }
    }

    var promptInput = document.getElementById('avatarGrowthPromptInput');
    if(promptInput){
      var curPrompt = (L.state.profile && L.state.profile.settings && L.state.profile.settings.avatarGrowthPrompt) || '';
      promptInput.value = curPrompt;
    }

    var subTitleEl = document.getElementById('avatarLevelUpSubtitle');
    if(subTitleEl){
      subTitleEl.innerHTML = '💬 "진짜 잘했다! 내자신! 내 뒤의 배경좀 바꿔줘라 지겹다!"';
    }

    m.style.display = 'flex';
  }
  /* ---- 이전 전 index.html 3354~3358줄(#TASK-ES-476 생성기 표지) ---- */

  function closeAvatarLevelUpModal(){
    var m = document.getElementById('avatarLevelUpModal');
    if(m) m.style.display = 'none';
  }

  /* ---- 이전 전 index.html 3368~3372줄(#TASK-ES-476 생성기 표지) ---- */
  function bindAvatarLevelUpBackdrop() { /* [#TASK-ES-476] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.avLvModalElem){
    L.avLvModalElem.addEventListener('click', function(e){
      if(e.target === L.avLvModalElem) closeAvatarLevelUpModal();
    });
  }
  } /* bindAvatarLevelUpBackdrop */

  /* ---- 이전 전 index.html 3375~3398줄(#TASK-ES-476 생성기 표지) ---- */
  function bindAvatarGrowthPromptSave() { /* [#TASK-ES-476] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.btnSaveGrowth){
    L.btnSaveGrowth.addEventListener('click', function(){
      var promptInp = document.getElementById('avatarGrowthPromptInput');
      var rawVal = promptInp ? promptInp.value.trim() : '';
      var res = filterHarmfulWords(rawVal);
      if(res.hasHarmful){
        L.toast('부적절한 단어가 포함되어 정화되었습니다.');
        if(promptInp) promptInp.value = res.clean;
      }
      if(!L.state.profile.settings) L.state.profile.settings = {};
      L.state.profile.settings.avatarGrowthPrompt = res.clean;
      if(Array.isArray(L.state.profile.settings.savedAvatars)){
        var curUrl = L.state.profile.settings.customAvatarUrl || '';
        for(var si = 0; si < L.state.profile.settings.savedAvatars.length; si++){
          if(L.state.profile.settings.savedAvatars[si].url === curUrl){
            L.state.profile.settings.savedAvatars[si].growthPrompt = res.clean;
            break;
          }
        }
      }
      L.saveProfile();
      L.toast('아바타 성장 성향이 저장되었습니다 ✨');
    });
  }
  } /* bindAvatarGrowthPromptSave */

  /* ---- 이전 전 index.html 3401~3414줄(#TASK-ES-476 생성기 표지) ---- */
  function bindAvatarLevelUpShare() { /* [#TASK-ES-476] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.btnShareLv){
    L.btnShareLv.addEventListener('click', function(){
      var xpTotal = (L.state.profile && L.state.profile.settings && L.state.profile.settings.xp && L.state.profile.settings.xp.total) || 0;
      var curLv = L.levelForXP(xpTotal);
      var shareText = '🎉 아워골에서 레벨 ' + curLv + '을(를) 달성했어요! 함께 목표를 달성해요 🚀\nhttps://ourgoal-app.vercel.app';
      if(navigator.share){
        navigator.share({ title: '아워골 레벨업 달성!', text: shareText, url: 'https://ourgoal-app.vercel.app' }).catch(function(){});
      } else if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(shareText).then(function(){ L.toast('공유 문구가 복사되었습니다! 📋'); });
      } else {
        L.toast('공유 문구가 준비되었습니다: ' + shareText);
      }
    });
  }
  } /* bindAvatarLevelUpShare */

  /* ---- 이전 전 index.html 3417~3459줄(#TASK-ES-476 생성기 표지) ---- */
  function bindAvatarLevelUpSaveImage() { /* [#TASK-ES-476] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.btnSaveLvImg){
    L.btnSaveLvImg.addEventListener('click', function(){
      try {
        var xpTotal = (L.state.profile && L.state.profile.settings && L.state.profile.settings.xp && L.state.profile.settings.xp.total) || 0;
        var curLv = L.levelForXP(xpTotal);
        var canvas = document.createElement('canvas');
        canvas.width = 440;
        canvas.height = 440;
        var ctx = canvas.getContext('2d');
        var grad = ctx.createLinearGradient(0, 0, 440, 440);
        grad.addColorStop(0, '#4f46e5');
        grad.addColorStop(1, '#9333ea');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 440, 440);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OURGOAL LEVEL UP!', 220, 60);
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('Lv.' + curLv, 220, 110);
        ctx.font = '16px sans-serif';
        ctx.fillText((L.state.profile && L.state.profile.name ? L.state.profile.name : '크루원') + '님의 눈부신 성장', 220, 145);
        ctx.font = '60px sans-serif';
        ctx.fillText('✨ 🧑‍🚀 ✨', 220, 240);
        var promptText = (L.state.profile && L.state.profile.settings && L.state.profile.settings.avatarGrowthPrompt) || '';
        if(promptText){
          ctx.font = 'italic 15px sans-serif';
          ctx.fillText('"' + promptText + '"', 220, 310);
        }
        ctx.font = '14px sans-serif';
        ctx.fillText('https://ourgoal-app.vercel.app', 220, 400);

        var link = document.createElement('a');
        link.download = 'ourgoal_avatar_lv' + curLv + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        L.toast('아바타 레벨업 카드가 저장되었습니다! 💾');
      } catch(imgErr){
        console.error('[btnSaveLevelUpImage error]', imgErr);
        L.toast('이미지 저장 중 오류가 발생했습니다.');
      }
    });
  }
  } /* bindAvatarLevelUpSaveImage */

  K.filterHarmfulWords = filterHarmfulWords;
  K.openAvatarLevelUpModal = openAvatarLevelUpModal;
  K.closeAvatarLevelUpModal = closeAvatarLevelUpModal;
  K.bindAvatarLevelUpBackdrop = bindAvatarLevelUpBackdrop;
  K.bindAvatarGrowthPromptSave = bindAvatarGrowthPromptSave;
  K.bindAvatarLevelUpShare = bindAvatarLevelUpShare;
  K.bindAvatarLevelUpSaveImage = bindAvatarLevelUpSaveImage;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
