/**
 * OurGoal Focus Auto-Pilot & MZ Story Card (목표 — 1순위 대표 목표 AI 초집중 모드·MZ 갓생 스토리 카드)
 *
 * 대표 목표 초집중 모드 창(openFocusAutoPilotModal)과 홈 「내 성장 자랑하기」로 여는 「오늘의 MZ 갓생 스토리 카드」 창(openMzShareCardModal).
 * 초집중 타이머 상태 변수(focusTimerInterval·focusTimerSeconds·focusTimerRunning)와 FEED_POSTS_CACHE 는 index.html 에 그대로 있고 L getter·setter 로 읽고 쓴다.
 * #TASK-ES-476(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 9594~9726 · 9727~10083줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ---- 이전 전 index.html 9594~9726줄(#TASK-ES-476 생성기 표지) ---- */

  function openFocusAutoPilotModal(goalId){
    L.triggerHaptic(25);
    var goals = (L.state.profile && L.state.profile.goals) || [];
    var goal = goals.find(function(g){ return g.id === goalId; }) || goals[0];
    if(!goal){
      L.toast('초집중을 시작할 목표가 없습니다.');
      return;
    }

    var milestones = goal.milestones || [];
    var activeMilestone = milestones.find(function(m){ return m && m.status !== 'done'; }) || milestones[0];
    var actionTitle = activeMilestone ? activeMilestone.title : (goal.title + ' 오늘의 핵심 몰입');

    L.focusTimerSeconds = 25 * 60;
    L.focusTimerRunning = false;
    if(L.focusTimerInterval){ clearInterval(L.focusTimerInterval); L.focusTimerInterval = null; }

    function renderTimerStr(sec){
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    var modalHtml = ''
      + '<div style="text-align:center;">'
      + '  <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:16px;background:var(--surface-2);color:var(--info);font-size:0.8rem;font-weight:700;margin-bottom:10px;">'
      + '    ⚡ 1순위 대표 목표 AI 초집중 모드'
      + '  </div>'
      + '  <h3 style="margin:0 0 6px;font-size:1.25rem;font-weight:700;color:var(--ink);">' + L.escapeHtml(goal.title) + '</h3>'
      + '  <div style="font-size:0.85rem;color:var(--ink-faint);margin-bottom:14px;">지금 집중할 단 1개의 액션: <strong style="color:var(--ink);">' + L.escapeHtml(actionTitle) + '</strong></div>'
      + '  <div style="background:var(--brand);border-radius:16px;padding:24px 16px;margin:0 auto 16px;border:1px solid var(--rule);box-shadow:0 12px 35px var(--violet-line);">'
      + '    <div style="font-size:0.75rem;letter-spacing:2px;color:rgba(255,255,255,0.6);font-weight:700;">FOCUS POMODORO</div>'
      + '    <div id="focusTimerDisplay" style="font-size:3.2rem;font-weight:700;font-variant-numeric:tabular-nums;color:#FFFFFF;text-shadow:0 0 25px var(--violet-line);margin:8px 0 16px;">25:00</div>'
      + '    <div style="display:flex;justify-content:center;gap:8px;">'
      + '      <button class="btn btn-sm" id="btnFocusStartPause" type="button" style="background:var(--info);color:#fff;border:none;border-radius:12px;font-weight:700;padding:8px 18px;font-size:0.85rem;">집중 시작</button>'
      + '      <button class="btn btn-sm" id="btnFocusReset" type="button" style="background:rgba(255,255,255,0.1);color:#fff;border:none;border-radius:12px;font-weight:600;padding:8px 14px;font-size:0.85rem;">리셋</button>'
      + '    </div>'
      + '  </div>'
      + '  <button class="btn btn-primary" id="btnFocusQuickCheckin" type="button" style="width:100%;padding:13px;font-size:0.95rem;font-weight:700;border-radius:12px;background:var(--brand);border:none;color:#fff;cursor:pointer;">'
      + '    ⚡ 지금 25분 몰입 완료 체크인'
      + '  </button>'
      + '  <div style="margin-top:8px;font-size:0.75rem;color:var(--ink-faint);">체크인 즉시 스트릭과 마일스톤이 전격 갱신됩니다.</div>'
      + '</div>';

    L.openModal(modalHtml, function(sheet){
      var displayEl = sheet.querySelector('#focusTimerDisplay');
      var startBtn = sheet.querySelector('#btnFocusStartPause');
      var resetBtn = sheet.querySelector('#btnFocusReset');
      var checkinBtn = sheet.querySelector('#btnFocusQuickCheckin');

      if(startBtn){
        startBtn.addEventListener('click', function(){
          L.triggerHaptic(15);
          if(!L.focusTimerRunning){
            L.focusTimerRunning = true;
            startBtn.textContent = '일시정지';
            startBtn.style.background = 'var(--brand)';
            L.focusTimerInterval = setInterval(function(){
              if(L.focusTimerSeconds > 0){
                L.focusTimerSeconds--;
                if(displayEl) displayEl.textContent = renderTimerStr(L.focusTimerSeconds);
                if(L.focusTimerSeconds === 0){
                  clearInterval(L.focusTimerInterval);
                  L.focusTimerRunning = false;
                  if(startBtn){ startBtn.textContent = '▶ 집중 시작'; startBtn.style.background = 'var(--info)'; }
                  L.triggerHaptic([40, 50, 60]);
                  L.burstConfetti(window.innerWidth/2, window.innerHeight/3, 40);
                  L.toast('25분 초집중 세션 달성! 완료 체크인을 눌러주세요.');
                }
              }
            }, 1000);
          } else {
            L.focusTimerRunning = false;
            clearInterval(L.focusTimerInterval);
            startBtn.textContent = '▶ 다시 시작';
            startBtn.style.background = 'var(--info)';
          }
        });
      }

      if(resetBtn){
        resetBtn.addEventListener('click', function(){
          L.triggerHaptic(10);
          if(L.focusTimerInterval) clearInterval(L.focusTimerInterval);
          L.focusTimerRunning = false;
          L.focusTimerSeconds = 25 * 60;
          if(displayEl) displayEl.textContent = '25:00';
          if(startBtn){ startBtn.textContent = '▶ 집중 시작'; startBtn.style.background = 'var(--info)'; }
        });
      }

      if(checkinBtn){
        checkinBtn.addEventListener('click', async function(){
          if(L.focusTimerInterval) clearInterval(L.focusTimerInterval);
          var nowIso = new Date().toISOString();
          var recordText = '[초집중 25분 몰입] ' + actionTitle + ' 완결 ⚡';

          var newRecord = {
            id: 'rec_' + Date.now(),
            goalId: goal.id,
            text: recordText,
            theme: goal.category || 'workout',
            startAt: nowIso,
            endAt: nowIso
          };
          L.state.profile.records = L.state.profile.records || [];
          L.state.profile.records.unshift(newRecord);

          if(activeMilestone){
            activeMilestone.status = 'done';
            activeMilestone.completedAt = nowIso;
          }

          await L.saveProfile();
          try {
            if(window.OurgoalEvents && typeof window.OurgoalEvents.emit === 'function'){
              window.OurgoalEvents.emit('checkin:created', newRecord);
              window.OurgoalEvents.emit('record:saved', newRecord);
            }
            if(window.OurgoalStore && typeof window.OurgoalStore.set === 'function'){
              window.OurgoalStore.set('profile.records', L.state.profile.records);
            }
          } catch(evErr){ console.warn('[focusCheckin] OurgoalEvents error:', evErr); }
          L.closeModal();
          L.triggerHaptic([30, 40, 60]);
          L.burstConfetti(window.innerWidth/2, window.innerHeight/3, 50);
          L.toast('25분 초집중 완료! 스트릭과 마일스톤이 전격 갱신되었습니다 ✨');
          if(typeof L.renderHome === 'function') L.renderHome();
        });
      }
    });
  }
  /* ---- 이전 전 index.html 9727~10083줄(#TASK-ES-476 생성기 표지) ---- */

  function openMzShareCardModal(){
    L.triggerHaptic(20);
    var streak = L.computeStreakDays();
    var userName = L.state.profile.name || '아워골 메이커';
    var nowK = L.dateKey(new Date());
    var todayRec = (L.state.profile.records || []).find(function(r){ return r && r.startAt && L.dateKey(r.startAt) === nowK; });
    var quote = todayRec ? (todayRec.text ? todayRec.text.slice(0, 60) : '오늘의 몰입 완료') : '목표를 향해 한 걸음씩, 꾸준함이 비범함을 만든다 ✨';

    var userGoals = (L.state.profile && L.state.profile.goals) || [];
    var curGoal = userGoals.find(function(g){ return !g.archivedAt; }) || userGoals[0] || null;
    var goalTitle = curGoal ? curGoal.title : '매일 성장하는 나만의 목표';
    var curFeedback = (todayRec && todayRec.feedback && todayRec.feedback.comment) || 'AI 코치: 완벽한 몰입 페이스! 오늘의 루틴을 성공적으로 돌파했습니다 ✨';

    var curRatio = '9:16';
    var curTheme = 'neon';
    var hasParticles = false;

    var incGoal = true;
    var incAvatar = true;
    var incRecord = true;
    var incFeedback = true;

    L.openModal(
      '<h3>오늘의 MZ 갓생 스토리 카드</h3>'
      + '<p class="faint" style="margin:-8px 0 12px;font-size:.8125rem;">인스타그램 스토리(9:16)·피드(1:1)·카카오톡에 오늘의 성취를 고화질 그래픽 카드로 인증하세요.</p>'
      + '<div class="mz-ratio-selector" style="display:flex;gap:5px;justify-content:center;margin:0 0 10px;flex-wrap:wrap;">'
      + '  <button class="btn btn-sm mz-ratio-chip" data-ratio="9:16" type="button" style="padding:4px 9px;font-size:0.75rem;border-radius:12px;font-weight:700;border:1px solid var(--brand);background:var(--brand);color:#fff;">9:16 (스토리)</button>'
      + '  <button class="btn btn-sm mz-ratio-chip" data-ratio="1:1" type="button" style="padding:4px 9px;font-size:0.75rem;border-radius:12px;font-weight:700;border:1px solid var(--rule);background:transparent;color:var(--ink);">1:1 (피드)</button>'
      + '  <button class="btn btn-sm mz-ratio-chip" data-ratio="3:4" type="button" style="padding:4px 9px;font-size:0.75rem;border-radius:12px;font-weight:700;border:1px solid var(--rule);background:transparent;color:var(--ink);">3:4 (세로)</button>'
      + '  <button class="btn btn-sm mz-ratio-chip" data-ratio="4:3" type="button" style="padding:4px 9px;font-size:0.75rem;border-radius:12px;font-weight:700;border:1px solid var(--rule);background:transparent;color:var(--ink);">4:3 (가로)</button>'
      + '  <button class="btn btn-sm mz-ratio-chip" data-ratio="16:9" type="button" style="padding:4px 9px;font-size:0.75rem;border-radius:12px;font-weight:700;border:1px solid var(--rule);background:transparent;color:var(--ink);">16:9 (가로)</button>'
      + '</div>'
      + '<div class="mz-include-selector" style="display:flex;gap:10px;justify-content:center;margin:0 0 10px;flex-wrap:wrap;background:var(--card2);padding:7px 10px;border-radius:12px;border:1px solid var(--rule);">'
      + '  <label style="display:flex;align-items:center;gap:4px;font-size:0.75rem;font-weight:700;cursor:pointer;"><input type="checkbox" id="chkStoryIncGoal" checked> <span>🎯 목표</span></label>'
      + '  <label style="display:flex;align-items:center;gap:4px;font-size:0.75rem;font-weight:700;cursor:pointer;"><input type="checkbox" id="chkStoryIncAvatar" checked> <span>👤 아바타</span></label>'
      + '  <label style="display:flex;align-items:center;gap:4px;font-size:0.75rem;font-weight:700;cursor:pointer;"><input type="checkbox" id="chkStoryIncRecord" checked> <span>📝 기록</span></label>'
      + '  <label style="display:flex;align-items:center;gap:4px;font-size:0.75rem;font-weight:700;cursor:pointer;"><input type="checkbox" id="chkStoryIncFeedback" checked> <span>🤖 AI피드백</span></label>'
      + '</div>'
      + '<div class="mz-theme-selector" style="display:flex;gap:6px;justify-content:center;margin:4px 0 12px;flex-wrap:wrap;">'
      + '  <button class="btn btn-sm mz-theme-chip" data-mztheme="neon" type="button" style="padding:3px 9px;font-size:0.75rem;border-radius:12px;font-weight:700;border:1px solid var(--brand);background:var(--brand-line);color:var(--brand);">갓생네온</button>'
      + '  <button class="btn btn-sm mz-theme-chip" data-mztheme="cyber" type="button" style="padding:3px 9px;font-size:0.75rem;border-radius:12px;font-weight:700;border:1px solid rgba(0,242,254,0.3);background:transparent;color:var(--info);">사이버</button>'
      + '  <button class="btn btn-sm mz-theme-chip" data-mztheme="gold" type="button" style="padding:3px 9px;font-size:0.75rem;border-radius:12px;font-weight:700;border:1px solid rgba(243,156,18,0.3);background:transparent;color:var(--gold);">골드</button>'
      + '  <button class="btn btn-sm mz-theme-chip" data-mztheme="aurora" type="button" style="padding:3px 9px;font-size:0.75rem;border-radius:12px;font-weight:700;border:1px solid rgba(253,121,168,0.3);background:transparent;color:var(--brand);">오로라</button>'
      + '  <button class="btn btn-sm" id="btnBurstStoryParticles" type="button" style="padding:3px 9px;font-size:0.75rem;border-radius:12px;font-weight:700;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.08);color:#fff;">파티클</button>'
      + '</div>'
      + '<div class="mz-card-preview" id="mzShareCardCanvas" style="padding:14px;background:var(--brand);border:1px solid var(--brand-line);border-radius:16px;">'
      + '  <canvas id="mzStoryCanvasEl" style="width:100%;max-width:260px;height:auto;aspect-ratio:9/16;border-radius:12px;display:block;margin:0 auto;background:#0E0C18;"></canvas>'
      + '  <div id="mzRatioLabel" style="font-size:0.75rem;color:var(--gold);font-weight:700;margin-top:10px;text-align:center;">9:16 인스타 스토리 맞춤 고해상도 카드</div>'
      + '</div>'
      + '<div class="modal-actions" style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">'
      + '  <button class="btn btn-primary btn-block" id="btnShareStoryToFeed" type="button" style="width:100%;margin-bottom:8px;font-weight:800;padding:12px;border-radius:12px;background:linear-gradient(135deg, var(--brand), #8b5cf6);color:#fff;border:none;box-shadow:0 4px 14px rgba(108,92,231,0.35);">🌟 아워골 피드에 공유하기</button>'
      + '  <div style="width:100%;display:flex;gap:8px;margin-bottom:4px;">'
      + '    <button class="btn btn-ghost" id="btnShareStoryToCompanion" type="button" style="flex:1;font-weight:700;padding:10px 8px;border-radius:10px;border:1.5px solid var(--brand);color:var(--brand);background:var(--card2);font-size:.8125rem;">🤝 동반자에게 보내기</button>'
      + '    <button class="btn btn-ghost" id="btnShareStoryToTeam" type="button" style="flex:1;font-weight:700;padding:10px 8px;border-radius:10px;border:1.5px solid var(--sage);color:var(--sage);background:var(--card2);font-size:.8125rem;">👥 팀 단체방에 인증</button>'
      + '  </div>'
      + '  <button class="btn btn-primary" id="saveMzStoryPngBtn" type="button" style="flex:1;background:var(--brand);font-weight:700;border:none;padding:12px 14px;border-radius:12px;">이미지 저장 (PNG)</button>'
      + '  <button class="btn btn-secondary" id="shareMzStoryWebBtn" type="button" style="flex:1;font-weight:700;padding:12px 14px;border-radius:12px;">친구에게 바로 공유</button>'
      + '  <div style="width:100%;display:flex;gap:8px;">'
      + '    <button class="btn btn-ghost btn-sm" id="copyMzCardTextBtn" type="button" style="flex:1;">텍스트 복사</button>'
      + '    <button class="btn btn-ghost btn-sm" id="copyMzCardLinkBtn" type="button" style="flex:1;">링크 복사</button>'
      + '  </div>'
      + '  <button class="btn btn-ghost btn-sm" id="mzCardCloseBtn" type="button" style="width:100%;">닫기</button>'
      + '</div>',
      function(sheet){
        sheet.querySelector('#mzCardCloseBtn').onclick = L.closeModal;
        var canvasEl = sheet.querySelector('#mzStoryCanvasEl');
        var ratioLabel = sheet.querySelector('#mzRatioLabel');

        var chkGoal = sheet.querySelector('#chkStoryIncGoal');
        var chkAvatar = sheet.querySelector('#chkStoryIncAvatar');
        var chkRec = sheet.querySelector('#chkStoryIncRecord');
        var chkFeedback = sheet.querySelector('#chkStoryIncFeedback');

        function redrawStoryCard(){
          if(!canvasEl) return;
          try {
            incGoal = chkGoal ? chkGoal.checked : true;
            incAvatar = chkAvatar ? chkAvatar.checked : true;
            incRecord = chkRec ? chkRec.checked : true;
            incFeedback = chkFeedback ? chkFeedback.checked : true;

            L.generateMzStoryCanvas({
              canvas: canvasEl,
              streak: streak,
              userName: userName,
              quote: quote,
              theme: curTheme,
              particles: hasParticles,
              ratio: curRatio,
              includeGoal: incGoal,
              includeAvatar: incAvatar,
              includeRecord: incRecord,
              includeFeedback: incFeedback,
              goalTitle: goalTitle,
              feedback: curFeedback
            });
          } catch(e){
            console.error('Canvas render error', e);
          }
        }
        redrawStoryCard();

        // Ratio chips
        sheet.querySelectorAll('.mz-ratio-chip').forEach(function(chip){
          chip.onclick = function(){
            L.triggerHaptic(15);
            curRatio = chip.getAttribute('data-ratio');
            sheet.querySelectorAll('.mz-ratio-chip').forEach(function(c){
              c.style.background = 'transparent';
              c.style.color = 'var(--ink)';
              c.style.borderColor = 'var(--rule)';
            });
            chip.style.background = 'var(--brand)';
            chip.style.color = '#fff';
            chip.style.borderColor = 'var(--brand)';

            if(curRatio === '9:16'){
              canvasEl.style.aspectRatio = '9/16';
              canvasEl.style.maxWidth = '260px';
              if(ratioLabel) ratioLabel.textContent = '9:16 인스타 스토리 맞춤 고해상도 카드';
            } else if(curRatio === '1:1'){
              canvasEl.style.aspectRatio = '1/1';
              canvasEl.style.maxWidth = '290px';
              if(ratioLabel) ratioLabel.textContent = '1:1 정사각 피드 맞춤 고해상도 카드';
            } else if(curRatio === '3:4'){
              canvasEl.style.aspectRatio = '3/4';
              canvasEl.style.maxWidth = '275px';
              if(ratioLabel) ratioLabel.textContent = '3:4 세로형 맞춤 그래픽 카드';
            } else if(curRatio === '4:3'){
              canvasEl.style.aspectRatio = '4/3';
              canvasEl.style.maxWidth = '330px';
              if(ratioLabel) ratioLabel.textContent = '4:3 가로형 맞춤 그래픽 카드';
            } else if(curRatio === '16:9'){
              canvasEl.style.aspectRatio = '16/9';
              canvasEl.style.maxWidth = '350px';
              if(ratioLabel) ratioLabel.textContent = '16:9 가로 와이드 맞춤 그래픽 카드';
            }
            redrawStoryCard();
          };
        });

        // Checkbox events
        [chkGoal, chkAvatar, chkRec, chkFeedback].forEach(function(chk){
          if(chk) chk.onchange = function(){
            L.triggerHaptic(10);
            redrawStoryCard();
          };
        });

        // Theme chips
        sheet.querySelectorAll('.mz-theme-chip').forEach(function(chip){
          chip.onclick = function(){
            L.triggerHaptic(15);
            curTheme = chip.getAttribute('data-mztheme');
            sheet.querySelectorAll('.mz-theme-chip').forEach(function(c){
              c.style.background = 'transparent';
              c.style.borderWidth = '1px';
            });
            chip.style.background = 'rgba(255,255,255,0.15)';
            chip.style.borderWidth = '1.5px';
            redrawStoryCard();
          };
        });

        var particleBtn = sheet.querySelector('#btnBurstStoryParticles');
        if(particleBtn){
          particleBtn.onclick = function(){
            hasParticles = !hasParticles;
            particleBtn.style.background = hasParticles ? 'rgba(255,107,74,0.35)' : 'rgba(255,255,255,0.08)';
            particleBtn.style.color = hasParticles ? '#FFD54F' : '#fff';
            redrawStoryCard();
            L.triggerHaptic([20, 30, 40]);
            L.burstConfetti(window.innerWidth/2, window.innerHeight/3, 30);
            L.toast(hasParticles ? '반짝이는 세레머니 파티클이 적용되었어요!' : '파티클 효과를 껐습니다.');
          };
        }

        // 🌟 아워골 피드에 공유하기 버튼 (#TASK-ES-172 [35])
        var shareFeedBtn = sheet.querySelector('#btnShareStoryToFeed');
        if(shareFeedBtn && canvasEl){
          shareFeedBtn.onclick = async function(){
            try {
              L.triggerHaptic(25);
              var dataUrl = canvasEl.toDataURL('image/png');
              var curGoalCat = (curGoal && curGoal.category) || 'study';

              var postId = 'post_' + L.newId();
              var post = {
                id: postId,
                user_id: L.state.profile.id,
                display_name: L.state.profile.displayName || L.state.profile.name || '아워골 메이커',
                avatar_url: L.state.profile.avatarUrl || null,
                goal_title: goalTitle,
                caption: '오늘의 성취를 담은 갓생 스토리 카드를 공유합니다! ✨ (' + streak + '일 연속 몰입)',
                cheers_count: 0,
                created_at: L.nowISO(),
                extra: {
                  category: curGoalCat,
                  includeRecord: incRecord,
                  recordText: quote,
                  photo: dataUrl,
                  includeFeedback: incFeedback,
                  includeGoal: incGoal,
                  goalPct: 100,
                  milestones: [],
                  comments: []
                }
              };

              try {
                await L.sb.from('feed_posts').insert(post);
              } catch(e){
                console.warn('Supabase feed post insert fallback:', e);
              }

              if(!L.state.profile.settings.myFeedPosts) L.state.profile.settings.myFeedPosts = [];
              L.state.profile.settings.myFeedPosts.unshift(post);
              await L.saveProfile();

              if(!L.FEED_POSTS_CACHE) L.FEED_POSTS_CACHE = [];
              L.FEED_POSTS_CACHE.unshift(post);

              L.closeModal();
              L.triggerHaptic([30, 40, 50]);
              L.burstConfetti(window.innerWidth / 2, window.innerHeight / 3, 35);
              L.toast('갓생 스토리 카드가 아워골 피드에 게시되었습니다! 🌟');

              L.state.commSubTab = 'feed';
              L.setTab('comm');
              L.renderCommScreen();
            } catch(err){
              console.error('Share story to feed error', err);
              L.toast('피드 게시에 실패했습니다.');
            }
          };
        }

        var savePngBtn = sheet.querySelector('#saveMzStoryPngBtn');
        if(savePngBtn && canvasEl){
          savePngBtn.onclick = function(){
            try {
              var dataUrl = canvasEl.toDataURL('image/png');
              var a = document.createElement('a');
              a.href = dataUrl;
              a.download = 'ourgoal-streak-' + streak + 'days-' + curRatio.replace(':', 'x') + '.png';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              L.triggerHaptic(30);
              L.burstConfetti(window.innerWidth/2, window.innerHeight/3, 25);
              L.toast(curRatio + ' 갓생 그래픽 이미지가 저장되었어요! SNS에 공유해보세요.');
            } catch(e){
              L.toast('이미지 저장에 실패했습니다. 화면을 캡처해주세요.');
            }
          };
        }

        var shareWebBtn = sheet.querySelector('#shareMzStoryWebBtn');
        if(shareWebBtn && canvasEl){
          shareWebBtn.onclick = function(){
            L.triggerHaptic(20);
            if(navigator.share && canvasEl.toBlob){
              canvasEl.toBlob(async function(blob){
                if(!blob) return;
                try {
                  var file = new File([blob], 'ourgoal-streak-' + streak + 'd.png', { type: 'image/png' });
                  if(navigator.canShare && navigator.canShare({ files: [file] })){
                    await navigator.share({
                      title: '아워골 ' + streak + '일 연속 몰입 인증',
                      text: '오늘 목표 달성! ' + streak + '일 연속 몰입 중\r\nhttps://ourgoal-app.vercel.app',
                      files: [file]
                    });
                    L.toast('성공적으로 공유되었습니다!');
                    return;
                  }
                } catch(err){
                  if(err && err.name === 'AbortError') return;
                }
                try {
                  await navigator.share({
                    title: '아워골 ' + streak + '일 연속 몰입 인증',
                    text: '오늘 목표 달성! ' + streak + '일 연속 몰입 중\r\n' + quote + '\r\n\r\n나만의 목표 완주하기 👉 https://ourgoal-app.vercel.app',
                    url: 'https://ourgoal-app.vercel.app'
                  });
                } catch(e){
                  if(savePngBtn) savePngBtn.click();
                }
              }, 'image/png');
            } else {
              if(savePngBtn) savePngBtn.click();
            }
          };
        }

        var copyTxtBtn = sheet.querySelector('#copyMzCardTextBtn');
        if(copyTxtBtn){
          copyTxtBtn.onclick = function(){
            var text = '아워골 ' + streak + '일 연속 몰입 달성!\r\n' + userName + '님의 오늘의 한 줄:\r\n"' + quote + '"\r\n\r\n나만의 목표 완주하기 👉 https://ourgoal-app.vercel.app';
            if(navigator.clipboard && navigator.clipboard.writeText){
              navigator.clipboard.writeText(text).then(function(){
                L.toast('성취 텍스트가 클립보드에 복사되었어요! 인스타 스토리에 붙여넣으세요.');
              });
            } else {
              prompt('아래 문구를 복사하세요:', text);
            }
          };
        }
        var copyLnkBtn = sheet.querySelector('#copyMzCardLinkBtn');
        if(copyLnkBtn){
          copyLnkBtn.onclick = function(){
            var url = 'https://ourgoal-app.vercel.app?ref=mz_share_' + encodeURIComponent(userName);
            if(navigator.clipboard && navigator.clipboard.writeText){
              navigator.clipboard.writeText(url).then(function(){
                L.toast('공유 링크가 복사되었어요!');
              });
            } else {
              prompt('공유 링크:', url);
            }
          };
        }

        // 🤝 동반자에게 보내기 (#TASK-MZ-STORY-INAPP-SOCIAL)
        var shareCompanionBtn = sheet.querySelector('#btnShareStoryToCompanion');
        if(shareCompanionBtn){
          shareCompanionBtn.onclick = function(){
            L.triggerHaptic(15);
            var compList = (L.state.profile && L.state.profile.settings && L.state.profile.settings.companions) || [];
            if(!compList.length && window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.ensureDefaultCompanions){
              compList = window.OurgoalTeamInviteComm.ensureDefaultCompanions();
            }
            if(!compList || !compList.length){
              L.toast('등록된 동반자가 없습니다. 소통 탭에서 동반자를 추가해보세요!');
              return;
            }
            L.openSelectCompanionForStoryModal(compList, streak, userName, quote, canvasEl);
          };
        }

        // 👥 팀 단체방에 인증 (#TASK-MZ-STORY-INAPP-SOCIAL)
        var shareTeamBtn = sheet.querySelector('#btnShareStoryToTeam');
        if(shareTeamBtn){
          shareTeamBtn.onclick = function(){
            L.triggerHaptic(15);
            var myTeams = (typeof L.MOCK_GROUPS !== 'undefined' ? L.MOCK_GROUPS : []).filter(function(g){
              return typeof L.groupState === 'function' && L.groupState(g.id).joined;
            });
            if(!myTeams.length){
              L.toast('참여 중인 팀 목표가 없습니다. 팀 목표를 개설하거나 참여해보세요!');
              return;
            }
            L.openSelectTeamForStoryModal(myTeams, streak, userName, quote, canvasEl);
          };
        }
      }
    );
  }

  K.openFocusAutoPilotModal = openFocusAutoPilotModal;
  K.openMzShareCardModal = openMzShareCardModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
