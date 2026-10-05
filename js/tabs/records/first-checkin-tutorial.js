/**
 * OurGoal First Check-in Tutorial (기록 — 첫 체크인 튜토리얼 가이드 및 축하 연출)
 *
 * 첫 체크인 안내 배너(renderFirstCheckinTutorialBanner)와 첫 체크인 축하 창(triggerFirstCheckinCelebrationModal), 같은 분야 동료 러너 고르기·환영 도장 보내기(getPeerRunnersForCategory·sendFirstCheckinWelcomeStamps 등).
 * window 노출 세 줄은 index.html 원래 자리에 그대로 있다.
 * #TASK-ES-476(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 5151~5182 · 5183~5195 · 5196~5217 · 5219~5227 · 5228~5234 · 5235~5273 · 5275~5391줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 5151~5182줄(#TASK-ES-476 생성기 표지) ---- */
  function renderFirstCheckinTutorialBanner(){
    var banner = document.getElementById('firstCheckinTutorialBanner');
    if(!banner) return;
    var isPending = L.state.profile && L.state.profile.firstCheckinPending && (!L.state.profile.records || L.state.profile.records.length === 0);
    if(!isPending){
      banner.style.display = 'none';
      return;
    }
    var av = (L.state.profile && L.state.profile.guardianAnimal) || { emoji: '🦉', name: '수호동물' };
    var g = (L.state.profile && L.state.profile.goals && L.state.profile.goals[0]);
    var emojiEl = document.getElementById('firstCheckinTutorialEmoji');
    if(emojiEl) emojiEl.textContent = av.emoji || '🦉';
    var titleEl = document.getElementById('firstCheckinTutorialTitle');
    if(titleEl){
      titleEl.textContent = g ? ('🌱 1호 목표 [' + g.title + '] 첫 체크인을 남겨보세요!') : '🌱 첫 체크인으로 +10 EXP를 획득해보세요!';
    }
    banner.style.display = 'block';
    var closeBtn = document.getElementById('closeFirstCheckinTutorialBtn');
    if(closeBtn){
      closeBtn.onclick = function(){
        banner.style.display = 'none';
        if(L.state.profile) L.state.profile.firstCheckinPending = false;
      };
    }
    var inp = document.getElementById('captureInput');
    if(inp){
      inp.placeholder = g ? ('예: 오늘 ' + g.title + ' 10초 실천 완료!') : '예: 오늘 실천한 멋진 일을 한 줄로 적어보세요';
      setTimeout(function(){
        try { inp.focus(); } catch(e){}
      }, 300);
    }
  }
  /* ---- 이전 전 index.html 5183~5195줄(#TASK-ES-476 생성기 표지) ---- */

  /* [#TASK-ES-348] 동류 러너는 실원장(feed_posts → FEED_POSTS_CACHE)의 같은 분야 실제 회원만. 고정 명단·연속일수 하드코딩 없음.
   * 연속일수는 피드 글에 없는 값이라 표시하지 않는다. 0명이면 빈 배열 → 위젯을 그리지 않는다(침묵). */
  function peerCategoryKey(cat){
    var c = String(cat || '');
    if(/공부|학습|시험|자격증/.test(c)) return 'study';
    if(/독서|책/.test(c)) return 'reading';
    if(/기상|모닝/.test(c)) return 'morning';
    if(/생활|루틴|습관/.test(c)) return 'life';
    if(/러닝|달리기|마라톤/.test(c)) return 'running';
    if(/운동|헬스|체력/.test(c)) return 'workout';
    return null;
  }
  /* ---- 이전 전 index.html 5196~5217줄(#TASK-ES-476 생성기 표지) ---- */
  function getPeerRunnersForCategory(category, posts){
    var cat = category || '운동';
    var src = Array.isArray(posts) ? posts : (Array.isArray(L.FEED_POSTS_CACHE) ? L.FEED_POSTS_CACHE : []);
    var myId = L.state.profile ? String(L.state.profile.id || '') : '';
    var items = src.filter(function(p){
      return p && !p.is_ai && L.isValidRealUser(String(p.user_id || '')) && String(p.user_id) !== myId;
    }).map(function(p){
      var ex = p.extra || {};
      return { userId: String(p.user_id), name: p.display_name || '', goal: p.goal_title || '', action: p.caption || '', category: ex.category || '' };
    });
    var key = peerCategoryKey(cat);
    var matched = key ? L.filterFeedByCategory(items, key) : items.filter(function(it){
      return (it.goal + ' ' + it.action + ' ' + it.category).indexOf(cat) !== -1;
    });
    var seen = {}, out = [];
    matched.forEach(function(it){
      if(out.length >= 3 || seen[it.userId] || !it.name) return;
      seen[it.userId] = true;
      out.push({ userId: it.userId, name: it.name, emoji: it.name.slice(0, 1), goal: it.goal });
    });
    return out;
  }

  /* ---- 이전 전 index.html 5219~5227줄(#TASK-ES-476 생성기 표지) ---- */

  /* [#TASK-ES-352] 첫 체크인 축하 창 웰컴 응원 — 화면에 보인 실제 동류 회원에게 기존 마니또 응원 형식
   * (team_pings · group_id 'manito' · target_type 'manito_cheer' · ping_type 'welcome_cheer')으로 1명당 1행을 보낸다.
   * 받는 사람은 소통 탭 → 마니또 '받은 응원함'(loadServerManitoData 의 receiver_id 조회)에서 본다.
   * 같은 사람에게 하루 1회: 행 id 를 날짜·보낸 사람·받는 사람으로 정해 서버가 같은 날 두 번째 행을 거절하고, 기기에도 오늘 보낸 명단을 남긴다. */
  function canSendFirstCheckinWelcome(){
    var myId = L.state.profile ? String(L.state.profile.id || '') : '';
    return !!(L.sb && L.state.user && L.isValidRealUser(myId));
  }
  /* ---- 이전 전 index.html 5228~5234줄(#TASK-ES-476 생성기 표지) ---- */
  function firstCheckinWelcomeSentToday(){
    var s = L.state.profile && L.state.profile.settings;
    if(!s) return {};
    var today = L.dateKey(L.nowISO());
    if(!s.welcomeStampSent || s.welcomeStampSent.date !== today) s.welcomeStampSent = { date: today, to: {} };
    return s.welcomeStampSent.to;
  }
  /* ---- 이전 전 index.html 5235~5273줄(#TASK-ES-476 생성기 표지) ---- */
  async function sendFirstCheckinWelcomeStamps(peers){
    var out = { sent: 0, already: 0, failed: 0, reason: '' };
    var myId = String(L.state.profile.id);
    var myName = L.state.profile.displayName || L.state.profile.name || '아워골 회원';
    var today = L.dateKey(L.nowISO());
    var sentTo = firstCheckinWelcomeSentToday();
    for(var i = 0; i < peers.length; i++){
      var peerId = String(peers[i].userId || '');
      if(!L.isValidRealUser(peerId) || peerId === myId) continue;
      if(sentTo[peerId]){ out.already++; continue; }
      var row = {
        id: 'fcw_' + today + '_' + myId + '_' + peerId,
        group_id: 'manito',
        sender_id: myId,
        sender_name: myName,
        sender_avatar: '🌱',
        receiver_id: peerId,
        target_type: 'manito_cheer',
        target_id: 'seed',
        target_title: '첫 체크인 웰컴 응원',
        ping_type: 'welcome_cheer',
        message: myName + '님이 첫 체크인을 마치고 같은 분야 동료에게 웰컴 응원을 보냈어요. 함께 꾸준히 가요! 🌱',
        status: 'sent',
        hidden: false,
        created_at: L.nowISO()
      };
      try {
        var res = await L.sb.from('team_pings').insert(row);
        var err = res && res.error;
        if(!err){ out.sent++; sentTo[peerId] = L.nowISO(); }
        else if(String(err.code || '') === '23505'){ out.already++; sentTo[peerId] = L.nowISO(); }
        else { out.failed++; out.reason = err.message ? '서버 응답: ' + String(err.message).slice(0, 40) : '서버가 거절함'; }
      } catch(e){
        out.failed++;
        out.reason = '연결 오류';
      }
    }
    return out;
  }

  /* ---- 이전 전 index.html 5275~5391줄(#TASK-ES-476 생성기 표지) ---- */

  function triggerFirstCheckinCelebrationModal(goal, checkinText, onDismiss){
    var av = (L.state.profile && L.state.profile.guardianAnimal) || { emoji: '🦉', name: '수호동물 부엉이' };
    var goalTitle = goal ? goal.title : (checkinText || '첫 실천');
    var goalCat = (goal && goal.category) || '운동';
    var peers = getPeerRunnersForCategory(goalCat);
    var canSendWelcome = peers.length > 0 && canSendFirstCheckinWelcome();
    var welcomeSentMap = canSendWelcome ? firstCheckinWelcomeSentToday() : {};
    var welcomePending = peers.filter(function(p){ return !welcomeSentMap[p.userId]; }).length;

    var peersHtml = peers.map(function(peer){
      return '<div style="flex:1;min-width:0;background:var(--card);border:1px solid var(--rule);border-radius:10px;padding:8px 6px;text-align:center;">' +
        '<div style="font-size:22px;margin-bottom:2px;">' + peer.emoji + '</div>' +
        '<div style="font-weight:700;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink);">' + L.escapeHtml(peer.name) + '</div>' +
        '<div style="font-size:10px;color:var(--ink-faint);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + L.escapeHtml(peer.goal || '') + '</div>' +
      '</div>';
    }).join('');

    var html =
      '<div style="text-align:center;padding:12px 6px 8px;">' +
        '<div style="font-size:54px;margin-bottom:8px;animation:celebrationPulse .8s ease infinite alternate;">' + (av.emoji || '🦉') + '</div>' +
        '<div style="display:inline-block;padding:4px 12px;border-radius:12px;background:rgba(16,185,129,0.15);color:var(--brand);font-size:12px;font-weight:800;margin-bottom:8px;">' +
          '🌱 첫 체크인(E1) 완주 · 레벨 1 달성' +
        '</div>' +
        '<h3 style="font-size:1.25rem;font-weight:800;margin-bottom:8px;line-height:1.3;">' +
          '축하합니다! 첫 걸음을 내디뎠어요 🎉' +
        '</h3>' +
        '<p style="font-size:.875rem;color:var(--ink-soft);line-height:1.5;margin-bottom:14px;">' +
          '<b>' + L.escapeHtml(av.name) + '</b>이(가) 당신의 첫 시작을 힘차게 응원합니다!<br>' +
          '<b>"' + L.escapeHtml(goalTitle) + '"</b> 실천이 안전하게 기록되었습니다.' +
        '</p>' +
        '<div style="background:var(--card);border:1px solid var(--rule);border-radius:12px;padding:10px 12px;display:flex;align-items:center;justify-content:space-around;margin-bottom:14px;">' +
          '<div>' +
            '<div style="font-size:11px;color:var(--ink-faint);">보너스 경험치</div>' +
            '<div style="font-size:15px;font-weight:800;color:var(--brand);">+10 EXP ✨</div>' +
          '</div>' +
          '<div style="width:1px;height:24px;background:var(--rule);"></div>' +
          '<div>' +
            '<div style="font-size:11px;color:var(--ink-faint);">현재 랭크</div>' +
            '<div style="font-size:15px;font-weight:800;color:var(--ink);">🌱 새싹 러너 (Lv.1)</div>' +
          '</div>' +
        '</div>' +
        (peers.length ? '<div id="firstCheckinPeerRunners" style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:12px;margin-bottom:16px;text-align:left;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<span style="font-size:12px;font-weight:800;color:var(--ink);">🤝 함께 달리는 동류 러너</span>' +
            '<span style="font-size:11px;color:var(--brand);font-weight:700;">' + L.escapeHtml(goalCat) + ' 분야</span>' +
          '</div>' +
          '<div style="display:flex;gap:6px;">' + peersHtml + '</div>' +
          '<div style="font-size:11px;color:var(--ink-faint);margin-top:8px;line-height:1.4;">' +
            '※ 같은 분야에서 피드에 실천을 공유한 실제 회원이에요. 서로의 발자국을 지켜보며 함께 성장합니다.' +
          '</div>' +
        '</div>' : '') +
        '<div style="display:flex;flex-direction:column;gap:8px;">' +
          '<button class="btn btn-primary btn-block" id="firstCheckinCommBtn" type="button" style="padding:12px;font-size:14px;font-weight:800;background:linear-gradient(135deg, var(--brand), #8b5cf6);border:none;box-shadow:0 4px 14px rgba(108,92,231,0.3);">' +
            (canSendWelcome ? (welcomePending ? ('💌 동류 러너 ' + welcomePending + '명에게 웰컴 응원 보내기 (+5 EXP)') : '✅ 오늘 웰컴 응원 보냄 · 소통 탭 가기') : '🤝 소통 탭에서 함께할 분 찾아보기') +
          '</button>' +
          '<button class="btn btn-ghost btn-block" id="firstCheckinDoneBtn" type="button" style="padding:10px;font-size:13px;font-weight:700;color:var(--ink-soft);">' +
            '홈 콕핏 둘러보기 ➔' +
          '</button>' +
        '</div>' +
      '</div>';

    L.openModal(html, function(sheet){
      L.triggerHaptic(20);
      L.burstConfetti(window.innerWidth/2, window.innerHeight/2, 20);
      setTimeout(function(){
        L.burstConfetti(window.innerWidth/2, window.innerHeight/2 - 60, 16);
      }, 250);

      var commBtn = sheet.querySelector('#firstCheckinCommBtn');
      if(commBtn){
        commBtn.addEventListener('click', async function(){
          if(commBtn.disabled) return;
          L.triggerHaptic(20);
          var goComm = function(msg){
            L.closeModal();
            if(typeof L.setTab === 'function'){
              L.state.commSubTab = 'feed';
              L.setTab('comm');
            }
            L.toast(msg);
            if(typeof onDismiss === 'function') onDismiss();
          };
          // [#TASK-ES-352] 세션 없는 사용자·동류 0명: 보내지 않는다. '보냈어요' 문구·EXP 없이 소통 탭으로만.
          if(!(peers.length > 0 && canSendFirstCheckinWelcome())){
            goComm('🤝 소통 탭에서 함께하는 분을 찾아보세요');
            return;
          }
          commBtn.disabled = true;
          commBtn.textContent = '💌 보내는 중…';
          var r = await sendFirstCheckinWelcomeStamps(peers);
          if(r.sent > 0){
            L.burstConfetti(window.innerWidth/2, window.innerHeight/2, 25);
            if(L.state.profile && L.state.profile.settings && L.state.profile.settings.xp){
              L.state.profile.settings.xp.total = (L.state.profile.settings.xp.total || 0) + 5;
              L.notifyXpGained(5, L.state.profile.settings.xp.total);
            }
            L.saveProfile();
            goComm('💌 ' + r.sent + '명에게 웰컴 응원을 보냈어요! (+5 EXP)' + (r.failed ? ' · ' + r.failed + '명은 못 보냈어요(' + r.reason + ')' : ''));
          } else if(r.failed > 0){
            goComm('웰컴 응원을 보내지 못했어요(' + r.reason + '). 소통 탭에서 함께하는 분을 찾아보세요');
          } else {
            L.saveProfile();
            goComm('오늘은 이미 웰컴 응원을 보냈어요. 소통 탭에서 함께하는 분을 찾아보세요');
          }
        });
      }

      var doneBtn = sheet.querySelector('#firstCheckinDoneBtn');
      if(doneBtn){
        doneBtn.addEventListener('click', function(){
          L.closeModal();
          if(typeof onDismiss === 'function') onDismiss();
        });
      }
    });
  }

  K.renderFirstCheckinTutorialBanner = renderFirstCheckinTutorialBanner;
  K.peerCategoryKey = peerCategoryKey;
  K.getPeerRunnersForCategory = getPeerRunnersForCategory;
  K.canSendFirstCheckinWelcome = canSendFirstCheckinWelcome;
  K.firstCheckinWelcomeSentToday = firstCheckinWelcomeSentToday;
  K.sendFirstCheckinWelcomeStamps = sendFirstCheckinWelcomeStamps;
  K.triggerFirstCheckinCelebrationModal = triggerFirstCheckinCelebrationModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
