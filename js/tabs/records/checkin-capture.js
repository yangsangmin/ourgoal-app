/**
 * OurGoal Checkin Capture (기록 — 홈 체크인 입력 글자수 힌트·기록 저장 처리기)
 *
 * 홈 체크인 입력칸(#captureInput) 글자수 힌트 처리기와 「기록」 단추(#captureSave) 저장 처리기 — 기록 추가·XP·축하·AI 피드백·노션 전송까지 이전 전과 같은 순서로 돈다.
 * 두 처리기는 index.html 로드 중 바로 걸리던 문이다. 본문을 bindCaptureLiveMeta · bindCaptureSave 로 감싸 옮기고, index.html 원래 자리에서 그 함수를 부른다(등록 순서 보존, 이중 처리기 0).
 * 입력칸 요소를 담은 상태 변수(liveMeta · liveCount · capInput)와 사진 대기값(pendingCapturePhoto)은 index.html 에 그대로 있고 L getter·setter 로 읽고 쓴다.
 * #TASK-ES-439(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 14978~14989 · 14990~15176줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ---- 이전 전 index.html 14978~14989줄(#TASK-ES-439 생성기 표지) ---- */
  function bindCaptureLiveMeta() { /* [#TASK-ES-439] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */

  if(L.capInput && L.liveMeta){
    L.capInput.addEventListener('input', function(){
      var val = L.capInput.value.trim();
      if(val.length > 0){
        L.liveMeta.style.display = 'flex';
        if(L.liveCount) L.liveCount.textContent = val.length + '자';
      } else {
        L.liveMeta.style.display = 'none';
      }
    });
  }
  } /* bindCaptureLiveMeta */
  /* ---- 이전 전 index.html 14990~15176줄(#TASK-ES-439 생성기 표지) ---- */
  function bindCaptureSave() { /* [#TASK-ES-439] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */

  document.getElementById('captureSave').addEventListener('click', async function(){
    var saveBtn = document.getElementById('captureSave');
    if(!saveBtn || saveBtn.disabled) return;
    var t = document.getElementById('captureInput');
    var text = t.value.trim();
    if(!text && !L.pendingCapturePhoto) return;
    if(!text && L.pendingCapturePhoto) text = '사진 인증';
    saveBtn.disabled = true;
    var origSaveBtnHtml = saveBtn.innerHTML;
    saveBtn.textContent = '기록 중…';
    try {
      var goal = L.state.profile.goals.find(function(g){ return g.id===L.state.activeGoalId; }) || L.state.profile.goals[0];
      var cat = goal ? goal.category : null;
      var isFirst = (L.state.profile.records.length === 0);

      // 테마 결정: 사용자가 고르는 창이 없으므로(#TASK-ES-367) 비강제 일상 테마
      var themePayload = (typeof OurgoalThemeSystem !== 'undefined')
        ? OurgoalThemeSystem.buildCheckinThemePayload(null)
        : { theme: 'daily', subTheme: '', themeMetadata: null };

      var notionRec = (typeof L.convertTextToNotionDbRecord === 'function')
        ? L.convertTextToNotionDbRecord(text, 'note', { title: text }, goal)
        : null;
      var recPhoto = L.pendingCapturePhoto || null;
      var slEnergy = document.getElementById('sliderEnergy');
      var slFocus = document.getElementById('sliderFocus');
      var recEnergy = slEnergy ? parseInt(slEnergy.value, 10) : 80;
      var recFocus = slFocus ? parseInt(slFocus.value, 10) : 80;
      L.state.profile.records.unshift({
        id: L.newId(),
        type: 'note',
        text: text,
        photo: recPhoto,
        startAt: L.nowISO(),
        endAt: L.nowISO(),
        createdAt: L.nowISO(),
        category: cat,
        visibility: 'private',
        theme: themePayload.theme,
        subTheme: themePayload.subTheme,
        themeConfidence: 0.5,
        themeMetadata: themePayload.themeMetadata,
        notionDb: notionRec ? notionRec.notionSchema : null,
        structured: notionRec || null,
        energy: recEnergy,
        focus: recFocus
      });
      t.value = '';
      t.placeholder = '예: 오늘 실천한 멋진 일을 한 줄로 적어보세요';
      if(slEnergy) { slEnergy.value = 80; var ve = document.getElementById('valEnergy'); if(ve) ve.textContent = '80%'; }
      if(slFocus) { slFocus.value = 80; var vf = document.getElementById('valFocus'); if(vf) vf.textContent = '80%'; }
      var activeChips = document.querySelectorAll('.quick-checkin-chips .btn-quick-chip');
      if(activeChips && activeChips.length){
        activeChips.forEach(function(b){
          b.style.borderColor = 'rgba(49,130,246,0.22)';
          b.style.background = 'rgba(49,130,246,0.08)';
          b.style.fontWeight = '600';
        });
      }
      if(L.liveMeta) L.liveMeta.style.display = 'none';
      L.pendingCapturePhoto = null;
      if(L.capturePhotoPreview){ L.capturePhotoPreview.innerHTML = ''; L.capturePhotoPreview.style.display = 'none'; }
      if(L.capturePhotoInput) L.capturePhotoInput.value = '';

      var xpRes = L.awardXP(L.XP_RULES.checkin, '체크인');

      var freezeGranted = L.maybeGrantStreakFreeze();
      L.maybeGrantAvatarCraftBonus();
      await L.saveProfile();
      try {
        if(window.OurgoalEvents && typeof window.OurgoalEvents.emit === 'function'){
          window.OurgoalEvents.emit('checkin:created', L.state.profile.records[0]);
          window.OurgoalEvents.emit('record:saved', L.state.profile.records[0]);
        }
        if(window.OurgoalStore && typeof window.OurgoalStore.set === 'function'){
          window.OurgoalStore.set('profile.records', L.state.profile.records);
        }
      } catch(evErr){ console.warn('[captureSave] OurgoalEvents error:', evErr); }

      // 홈 화면 히트맵 및 스트릭 즉시 반영 (#TASK-ES-043)
      L.renderHomeGrassSummary();
      var streak = L.computeStreakDays();
      L.updateAppBadge(streak);
      var badgeEl = document.getElementById('streakBadge');
      if(badgeEl) badgeEl.innerHTML = streak > 0 ? L.streakBadgeHtml(streak) : '';

      try {
        if(typeof L.dispatchFullViewPropagation === 'function') L.dispatchFullViewPropagation();
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
      } catch(propErr) { console.warn('[captureSave] full view propagation error:', propErr); }

      // 오프라인 상태일 경우 오프라인 동기화 큐에 보관 (가상유저 요청 P5)
      if(typeof navigator !== 'undefined' && !navigator.onLine){
        L.OfflineSyncManager.enqueue({ type: 'record', data: L.state.profile.records[0] });
      }

      L.track('checkin', { first: isFirst, has_goal: !!goal, has_photo: !!recPhoto, len: text.length<20 ? 's' : (text.length<80 ? 'm' : 'l') });
      L.track('checkin_completed', { source: 'voice', goal_type: goal && goal.category, day_index: L.dayIndexSinceSignup() });
      var isFirstCheckinCelebration = isFirst || (L.state.profile && L.state.profile.firstCheckinPending) || (L.state.profile && !L.state.profile.firstCheckinCelebrated);
      if(isFirstCheckinCelebration){
        if(L.state.profile){
          L.state.profile.firstCheckinPending = false;
          L.state.profile.firstCheckinCelebrated = true;
        }
        var tutBanner = document.getElementById('firstCheckinTutorialBanner');
        if(tutBanner) tutBanner.style.display = 'none';
        L.triggerFirstCheerResponse(goal, text);
        if(typeof L.triggerFirstCheckinCelebrationModal === 'function'){
          L.triggerFirstCheckinCelebrationModal(goal, text, function(){
            var curRec = L.state.profile.records[0];
            if(curRec && curRec.feedback){
              L.showCheckinFeedbackSheet(curRec, curRec.feedback);
            }
          });
        }
      }
      // [#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시 안전 백업 넛지
      try {
        if(typeof L.checkGuestBackupNudge === 'function') L.checkGuestBackupNudge();
      } catch(e){}
      var checkinToastMsg = freezeGranted
        ? '스트릭 프리즈를 1개 획득했어요! 하루를 놓쳐도 연속 기록이 지켜져요'
        : (notionRec
            ? '오늘의 실천이 안전하게 기록되었어요 (' + notionRec.status + (notionRec.metric ? ' · ' + notionRec.metric : '') + ')'
            : (recPhoto ? '사진과 함께 안전하게 기록했어요' : '오늘의 실천이 안전하게 기록되었어요'));
      var cardBox = document.getElementById('captureCardBox');
      if(cardBox){
        cardBox.classList.remove('celebration-pulse-05s');
        void cardBox.offsetWidth;
        cardBox.classList.add('celebration-pulse-05s');
        setTimeout(function(){ if(cardBox) cardBox.classList.remove('celebration-pulse-05s'); }, 500);
      }
      L.toast(checkinToastMsg + ' ✨ (+10 EXP)');
      L.triggerHaptic(12);
      var btnRect = saveBtn.getBoundingClientRect();
      L.burstConfetti(btnRect.left+btnRect.width/2, btnRect.top, 8);
      saveBtn.classList.remove('btn-cs-pulse');
      void saveBtn.offsetWidth;
      saveBtn.classList.add('btn-cs-pulse');
      L.renderFeedbackSlot(null);
      L.renderRecordFeedbackSlot(null);
      L.renderLevelBadge();
      if(xpRes.leveledUp) L.showLevelUpBanner(L.levelForXP(xpRes.total));
      L.renderDailyQuestBar(true);

      var newRec = L.state.profile.records[0];
      var fb = null;
      var targetGoal = goal || (L.state.profile.goals && L.state.profile.goals[0]) || { title: '나의 일상 성장', milestones: [] };
      if(!isFirstCheckinCelebration){
        L.renderFeedbackSlot('loading');
        L.renderRecordFeedbackSlot('loading');
        L.showCheckinFeedbackSheet(newRec, 'loading');
      }
      try {
        fb = await L.requestAIFeedback(targetGoal, text, newRec ? newRec.theme : null);
      } catch(aiErr){
        console.warn('AI feedback request failed, using instant celebration:', aiErr);
      }
      if(!fb){
        fb = {
          verdict: '실천 완료',
          fact_insight: '오늘의 멋진 실천을 성공적으로 기록하셨습니다! 꾸준한 실천이 큰 성장을 만듭니다.',
          next_action: '내일도 같은 시간에 목표를 이어가보세요!'
        };
      }
      if(newRec && fb){
        newRec.feedback = fb;
        await L.saveProfile();
      }
      L.state.lastCapture = { record: newRec, goal: targetGoal, feedback: fb };
      L.renderFeedbackSlot(fb);
      L.renderRecordFeedbackSlot(fb);
      if(!isFirstCheckinCelebration){
        L.showCheckinFeedbackSheet(newRec, fb);
      }
      if(targetGoal && targetGoal.milestones && targetGoal.milestones.length > 0){
        L.maybeShowGoalUpdateModal(targetGoal, fb);
      }
      L.sendToNotion(newRec, fb);
    } finally {
      if(saveBtn){
        saveBtn.disabled = false;
        saveBtn.innerHTML = origSaveBtnHtml;
      }
    }
  });
  } /* bindCaptureSave */

  K.bindCaptureLiveMeta = bindCaptureLiveMeta;
  K.bindCaptureSave = bindCaptureSave;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
