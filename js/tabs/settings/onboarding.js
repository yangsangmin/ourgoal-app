/**
 * OurGoal Onboarding (설정 탭 — 첫 가입 온보딩)
 *
 * #TASK-ES-442 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   ONBOARDING_AVATARS — 「Onboarding (first-time, after signup)」(이전 전 6756~6777줄)
 *   startOnboarding — 「Onboarding (first-time, after signup)」(이전 전 6779~6986줄)
 * 첫 가입 뒤 16종 동물 아바타 고르기·첫 목표 안착 온보딩.
 * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  var ONBOARDING_AVATARS = [
    // 🧠 분석형 (4종)
    { mbti: 'INTJ', name: '전략가 부엉이', group: '분석형', emoji: '🦉', desc: '깊은 지혜와 치밀한 설계' },
    { mbti: 'INTP', name: '사색가 고양이', group: '분석형', emoji: '🐱', desc: '끝없는 호기심의 탐구자' },
    { mbti: 'ENTJ', name: '통솔자 불사조', group: '분석형', emoji: '🦅', desc: '목표를 향해 비상하는 리더' },
    { mbti: 'ENTP', name: '발명가 여우', group: '분석형', emoji: '🦊', desc: '창의적 번뜩임의 달인' },
    // 🌿 외교형 (4종)
    { mbti: 'INFJ', name: '통찰가 사슴', group: '외교형', emoji: '🦌', desc: '맑은 눈망울의 예언자' },
    { mbti: 'INFP', name: '치유자 수달', group: '외교형', emoji: '🦦', desc: '따뜻한 마음의 수호자' },
    { mbti: 'ENFJ', name: '지도자 돌고래', group: '외교형', emoji: '🐬', desc: '모두를 이끄는 긍정 에너지' },
    { mbti: 'ENFP', name: '활동가 강아지', group: '외교형', emoji: '🐶', desc: '행복을 전파하는 비타민' },
    // 🛡️ 관리형 (4종)
    { mbti: 'ISTJ', name: '원칙주의 거북', group: '관리형', emoji: '🐢', desc: '꾸준함과 신뢰의 상징' },
    { mbti: 'ISFJ', name: '수호자 반달곰', group: '관리형', emoji: '🐻', desc: '묵묵히 지켜주는 버팀목' },
    { mbti: 'ESTJ', name: '관리자 사자', group: '관리형', emoji: '🦁', desc: '당당한 카리스마의 기둥' },
    { mbti: 'ESFJ', name: '배려자 코끼리', group: '관리형', emoji: '🐘', desc: '모두를 감싸는 다정함' },
    // ⚡ 탐험형 (4종)
    { mbti: 'ISTP', name: '장인 호랑이', group: '탐험형', emoji: '🐯', desc: '과묵하지만 날카로운 해결사' },
    { mbti: 'ISFP', name: '예술가 카멜레온', group: '탐험형', emoji: '🦎', desc: '자유로운 감성과 색채' },
    { mbti: 'ESTP', name: '도전자 치타', group: '탐험형', emoji: '🐆', desc: '거침없는 행동파 러너' },
    { mbti: 'ESFP', name: '연예인 원숭이', group: '탐험형', emoji: '🐵', desc: '언제나 유쾌한 분위기 메이커' }
  ];

  function startOnboarding(){
    window.startOnboarding = startOnboarding;
    var selectedGroup = '분석형';
    var selectedAvatar = ONBOARDING_AVATARS[0]; // 기본 부엉이
    showObStep1();

    function showObStep1(){
      L.track('onboarding_step_viewed', { step: 1, source: 'onboarding', goal_type: null, day_index: L.dayIndexSinceSignup() });

      function renderAvatarGrid(group, activeAvatar){
        var list = ONBOARDING_AVATARS.filter(function(a){ return a.group === group; });
        return '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;">' +
          list.map(function(av){
            var isSel = (activeAvatar && activeAvatar.mbti === av.mbti);
            var borderStyle = isSel ? 'border-color:var(--brand);background:rgba(16,185,129,0.12);' : 'border-color:var(--rule);background:var(--card);';
            return '<div class="ob-avatar-card" data-mbti="'+av.mbti+'" style="border:1.5px solid;border-radius:14px;padding:10px 8px;text-align:center;cursor:pointer;transition:all .2s;'+borderStyle+'">' +
              '<div style="font-size:26px;margin-bottom:2px;">'+av.emoji+'</div>' +
              '<div style="font-size:11px;font-weight:800;color:var(--brand);margin-bottom:2px;">'+av.mbti+'</div>' +
              '<div style="font-size:12px;font-weight:700;color:var(--ink);margin-bottom:2px;">'+L.escapeHtml(av.name)+'</div>' +
              '<div style="font-size:10px;color:var(--ink-faint);line-height:1.3;">'+L.escapeHtml(av.desc)+'</div>' +
            '</div>';
          }).join('') +
        '</div>';
      }

      var groups = ['분석형', '외교형', '관리형', '탐험형'];
      var groupIcons = { '분석형':'🧠', '외교형':'🌿', '관리형':'🛡️', '탐험형':'⚡' };
      var groupsHtml = '<div style="display:flex;gap:6px;margin-bottom:12px;overflow-x:auto;">' +
        groups.map(function(grp){
          var isAct = (grp === selectedGroup);
          var chipStyle = isAct ? 'background:var(--brand);color:#fff;font-weight:700;border-color:var(--brand);' : 'background:var(--card);color:var(--ink-faint);border-color:var(--rule);';
          return '<button type="button" class="ob-grp-chip" data-grp="'+grp+'" style="border:1px solid;border-radius:12px;padding:6px 12px;font-size:12px;cursor:pointer;white-space:nowrap;transition:all .2s;'+chipStyle+'">' +
            groupIcons[grp] + ' ' + grp +
          '</button>';
        }).join('') +
      '</div>';

      var html = 
        '<p class="ob-step-label">1 / 2 · 수호동물 선택 (10초)</p>' +
        '<h3 style="font-size:1.15rem;font-weight:800;margin-bottom:6px;line-height:1.3;">나를 지켜줄 수호 동물을<br>선택해 주세요!</h3>' +
        '<p class="muted" style="margin:0 0 14px;font-size:.85rem;line-height:1.4;">MBTI 성향에 맞는 16종 동물 아바타 중 하나를 콕 찍어보세요. 언제든 변경할 수 있어요.</p>' +
        groupsHtml +
        '<div id="obAvatarGridSlot">' + renderAvatarGrid(selectedGroup, selectedAvatar) + '</div>' +
        '<div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:10px;padding:8px 12px;font-size:11px;color:var(--ink-soft);display:flex;align-items:center;gap:6px;margin-bottom:14px;">' +
          '<span>✨</span><span>추후 <b>내 실제 사진 기반 AI 아바타</b>로도 언제든 진화할 수 있습니다!</span>' +
        '</div>' +
        '<div class="modal-actions"><button class="btn btn-primary btn-block" id="obNext1" type="button">수호동물 확정하고 다음으로 ➔</button></div>' +
        '<button class="land-login-link" id="obSkip1" type="button" style="width:100%;background:none;margin-top:10px;">기본 아바타(부엉이)로 건너뛰기</button>';

      L.openModal(html, function(sheet){
        function wireCards(){
          sheet.querySelectorAll('.ob-avatar-card').forEach(function(card){
            card.addEventListener('click', function(){
              var m = card.dataset.mbti;
              var found = ONBOARDING_AVATARS.find(function(a){ return a.mbti === m; });
              if(found) selectedAvatar = found;
              sheet.querySelector('#obAvatarGridSlot').innerHTML = renderAvatarGrid(selectedGroup, selectedAvatar);
              wireCards();
            });
          });
        }
        wireCards();

        sheet.querySelectorAll('.ob-grp-chip').forEach(function(chip){
          chip.addEventListener('click', function(){
            selectedGroup = chip.dataset.grp;
            sheet.querySelectorAll('.ob-grp-chip').forEach(function(c){
              var isA = (c.dataset.grp === selectedGroup);
              c.style.background = isA ? 'var(--brand)' : 'var(--card)';
              c.style.color = isA ? '#fff' : 'var(--ink-faint)';
              c.style.borderColor = isA ? 'var(--brand)' : 'var(--rule)';
              c.style.fontWeight = isA ? '700' : '400';
            });
            sheet.querySelector('#obAvatarGridSlot').innerHTML = renderAvatarGrid(selectedGroup, selectedAvatar);
            wireCards();
          });
        });

        sheet.querySelector('#obNext1').addEventListener('click', showObStep2);
        sheet.querySelector('#obSkip1').addEventListener('click', function(){
          selectedAvatar = ONBOARDING_AVATARS[0]; // 기본 부엉이
          showObStep2();
        });
      });
    }

    function showObStep2(){
      L.track('onboarding_step_viewed', { step: 2, source: 'onboarding', goal_type: null, day_index: L.dayIndexSinceSignup() });

      var defaultName = L.state.profile.displayName || '새싹러너';
      var chosenPreset = { title: '매일 30분 달리기/걷기', category: 'health' };

      var html =
        '<p class="ob-step-label">2 / 2 · 닉네임 & 1호 목표 (10초)</p>' +
        '<h3 style="font-size:1.15rem;font-weight:800;margin-bottom:6px;">닉네임과 첫 시작 1호 목표</h3>' +
        '<p class="muted" style="margin:0 0 16px;font-size:.85rem;">동류 러너들에게 불릴 이름과 오늘부터 시작할 대표 목표입니다.</p>' +
        '<div style="background:var(--card);border:1px solid var(--rule);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;margin-bottom:14px;">' +
          '<div style="font-size:36px;width:52px;height:52px;border-radius:14px;background:rgba(16,185,129,0.15);display:flex;align-items:center;justify-content:center;">'+selectedAvatar.emoji+'</div>' +
          '<div>' +
            '<div style="font-size:11px;font-weight:800;color:var(--brand);">'+selectedAvatar.mbti+' · '+selectedAvatar.group+'</div>' +
            '<div style="font-size:14px;font-weight:700;color:var(--ink);">'+L.escapeHtml(selectedAvatar.name)+'</div>' +
          '</div>' +
        '</div>' +
        '<div class="field" style="margin-bottom:14px;">' +
          '<label style="font-size:12px;font-weight:700;color:var(--ink-soft);display:block;margin-bottom:6px;">닉네임</label>' +
          '<input type="text" id="obNickInput" maxlength="20" placeholder="닉네임을 입력하세요" value="'+L.escapeHtml(defaultName)+'" style="width:100%;height:44px;background:var(--input-bg);border:1px solid var(--rule);border-radius:10px;padding:0 12px;color:var(--ink);font-size:14px;">' +
        '</div>' +
        '<div class="field" style="margin-bottom:16px;">' +
          '<label style="font-size:12px;font-weight:700;color:var(--ink-soft);display:block;margin-bottom:6px;">3대 대표 킬러 목표 프리셋 (원터치 선택)</label>' +
          '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;" id="obPresetChips">' +
            '<button type="button" class="ob-preset-chip active" data-title="매일 30분 달리기/걷기" data-cat="health" style="font-size:12px;padding:10px 8px;border-radius:12px;border:1.5px solid var(--brand);background:rgba(16,185,129,0.12);color:var(--brand);font-weight:700;cursor:pointer;text-align:center;">🏃 매일 30분 운동</button>' +
            '<button type="button" class="ob-preset-chip" data-title="하루 20분 집중 공부/독서" data-cat="study" style="font-size:12px;padding:10px 8px;border-radius:12px;border:1px solid var(--rule);background:var(--card);color:var(--ink-soft);cursor:pointer;text-align:center;">📚 하루 20분 공부</button>' +
            '<button type="button" class="ob-preset-chip" data-title="아침 7시 기상 & 스트레칭" data-cat="routine" style="font-size:12px;padding:10px 8px;border-radius:12px;border:1px solid var(--rule);background:var(--card);color:var(--ink-soft);cursor:pointer;text-align:center;">⏰ 아침 7시 기상</button>' +
            '<button type="button" class="ob-preset-chip" data-title="" data-cat="" style="font-size:12px;padding:10px 8px;border-radius:12px;border:1px solid var(--rule);background:var(--card);color:var(--ink-faint);cursor:pointer;text-align:center;">⏭️ 나중에 설정하기</button>' +
          '</div>' +
        '</div>' +
        '<div class="modal-actions" style="display:flex;gap:8px;">' +
          '<button class="btn btn-ghost" id="obBack2" type="button" style="flex:1;">이전</button>' +
          '<button class="btn btn-primary" id="obFinish2" type="button" style="flex:2;">아워골 시작하기 (+10 EXP) 🚀</button>' +
        '</div>';

      L.openModal(html, function(sheet){
        sheet.querySelectorAll('.ob-preset-chip').forEach(function(chip){
          chip.addEventListener('click', function(){
            sheet.querySelectorAll('.ob-preset-chip').forEach(function(c){
              c.classList.remove('active');
              c.style.background = 'var(--card)';
              c.style.color = 'var(--ink-soft)';
              c.style.borderColor = 'var(--rule)';
              c.style.fontWeight = '400';
            });
            chip.classList.add('active');
            chip.style.background = 'rgba(16,185,129,0.12)';
            chip.style.color = 'var(--brand)';
            chip.style.borderColor = 'var(--brand)';
            chip.style.fontWeight = '700';
            var title = chip.dataset.title;
            var cat = chip.dataset.cat;
            if(title){
              chosenPreset = { title: title, category: cat };
            } else {
              chosenPreset = null;
            }
          });
        });

        sheet.querySelector('#obBack2').addEventListener('click', showObStep1);
        sheet.querySelector('#obFinish2').addEventListener('click', async function(){
          var nickInput = sheet.querySelector('#obNickInput');
          var name = (nickInput && nickInput.value.trim()) || defaultName;
          await completeOnboarding(name, selectedAvatar, chosenPreset);
        });
      });
    }

    async function completeOnboarding(displayName, avatarObj, chosenGoalPreset){
      L.closeModal();
      L.state.profile.displayName = displayName;
      // 1. 아바타 데이터 무결성 보장: 전역 avatar는 문자열(이모지)로 저장하여 [object Object] 결함 원천 차단
      L.state.profile.avatar = avatarObj.emoji;
      L.state.profile.mbti = avatarObj.mbti;
      L.state.profile.guardianAnimal = {
        emoji: avatarObj.emoji,
        name: avatarObj.name,
        mbti: avatarObj.mbti,
        group: avatarObj.group
      };
      L.state.profile.avatarUrl = '';
      L.state.profile._isNewSignup = false;
      L.state.profile.settings.hasSeenGuide = true; // 30초 무마찰 온보딩을 위해 장문 모달 대신 홈 콕핏 안착
      L.state.profile.firstCheckinPending = true; // 3단계: 첫 체크인 튜토리얼 칩 활성화 플래그
      L.state.profile.firstCheckinCelebrated = false;

      // 2. 1호 목표 칩 선택 시 목표 목록에 추가
      if(chosenGoalPreset && chosenGoalPreset.title){
        var newGoal = {
          id: (typeof L.uid === 'function' ? L.uid('goal') : ('g_' + Date.now())),
          title: chosenGoalPreset.title,
          category: chosenGoalPreset.category || 'health',
          createdAt: (typeof L.nowISO === 'function' ? L.nowISO() : new Date().toISOString()),
          dueDate: null,
          milestones: [
            { id: (typeof L.uid === 'function' ? L.uid('ms') : ('m_1_' + Date.now())), title: '첫 발걸음 실천하기', status: 'todo' },
            { id: (typeof L.uid === 'function' ? L.uid('ms') : ('m_2_' + Date.now())), title: '꾸준히 이어가기', status: 'todo' }
          ]
        };
        L.state.profile.goals = L.state.profile.goals || [];
        L.state.profile.goals.unshift(newGoal);
        L.state.activeGoalId = newGoal.id;
      }

      await L.saveProfile();
      L.enterApp();

      // 3. 실제 경험치 지급 (+10 EXP) 및 레벨업 피드백
      if(typeof L.awardXP === 'function'){
        try { L.awardXP(10, '온보딩 수호동물 안착 축하'); } catch(e){}
      }

      L.toast('🎉 반가워요 ' + displayName + '님! 수호동물 ' + avatarObj.name + '와(과) 함께 시작합니다 (+10 EXP)');
      L.track('onboarding_completed', { source: 'onboarding_fusion', mbti: avatarObj.mbti, day_index: 0 });

      // 4. 3단계 (10초): 첫 체크인 튜토리얼 가이드 칩 홈 콕핏에 렌더링
      if(typeof L.renderFirstCheckinTutorialBanner === 'function'){
        L.renderFirstCheckinTutorialBanner();
      }
    }
  }

  K.ONBOARDING_AVATARS = ONBOARDING_AVATARS;
  K.startOnboarding = startOnboarding;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
