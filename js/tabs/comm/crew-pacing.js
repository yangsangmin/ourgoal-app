/**
 * OurGoal Crew Pacing (소통 — 홈 「동반자」 페이스메이커 라이브 위젯·응원 보내기)
 *
 * 홈 「🏃 동반자」 창의 페이스메이커 라이브 위젯 그리기(renderCrewPacingWidget·applyCrewPacingUI)와 「응원 보내기」(nudgeCrewMates)·「오늘 체크인」(focusHomeCheckinInput) 동작.
 * window 노출 네 줄은 index.html 원래 자리에 그대로 있다(인라인 onclick·바깥 파일이 그 이름을 찾는다).
 * #TASK-ES-466(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 9722~9858 · 9859~9921 · 9922~9940 · 9941~9948줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  /* ---- 이전 전 index.html 9722~9858줄(#TASK-ES-466 생성기 표지) ---- */
  function applyCrewPacingUI(activeCount, myCheckedToday, nick){
    var headlineEl = document.getElementById('userCrewHeadline');
    var badgeEl = document.getElementById('userCrewBadge');
    var scoreEl = document.getElementById('userCrewScore');
    var progressEl = document.getElementById('userCrewProgressBar');
    var subtextEl = document.getElementById('userCrewSubtext');
    var coldStartBox = document.getElementById('userCrewColdStartBox');
    var coldStartIcon = document.getElementById('userCrewColdStartIcon');
    var coldStartDesc = document.getElementById('userCrewColdStartDesc');
    var btnCheckin = document.getElementById('btnCrewStartCheckin');

    if(activeCount === 0){
      if(headlineEl) headlineEl.innerHTML = '오늘의 1호 완주자가 되어보세요! 🏃';
      if(badgeEl){
        badgeEl.textContent = '⚡ 첫 완주 페이스';
        badgeEl.style.background = 'rgba(16, 185, 129, 0.12)';
        badgeEl.style.color = '#10b981';
      }
      if(scoreEl){
        scoreEl.textContent = '1호 페이스메이커 대기 중';
        scoreEl.style.color = '#10b981';
      }
      if(progressEl){
        progressEl.style.width = '8%';
        progressEl.style.background = 'linear-gradient(90deg, #10b981, #06b6d4)';
      }
      if(subtextEl){
        subtextEl.textContent = '아직 오늘 출발선을 통과한 동반자가 없어요. 지금 3초 체크인을 남겨보세요!';
      }
      if(coldStartBox){
        coldStartBox.style.display = 'flex';
        coldStartBox.style.background = 'rgba(16, 185, 129, 0.05)';
        coldStartBox.style.borderColor = 'rgba(16, 185, 129, 0.25)';
      }
      if(coldStartIcon) coldStartIcon.textContent = '⚡';
      if(coldStartDesc) coldStartDesc.textContent = '오늘 첫 번째로 실천을 완료하고 러너들의 듬직한 페이스메이커가 되어보세요!';
      if(btnCheckin){
        btnCheckin.style.display = 'inline-flex';
        btnCheckin.textContent = '오늘 체크인 ✏️';
        btnCheckin.style.background = '#10b981';
        btnCheckin.onclick = focusHomeCheckinInput;
      }
    } else if(activeCount === 1 && myCheckedToday){
      if(headlineEl) headlineEl.innerHTML = nick ? ('오늘 <b>' + L.escapeHtml(nick) + '</b>님이 영광의 <b>첫 완주 페이스메이커</b>입니다 👏') : '오늘 영광의 <b>첫 완주 페이스메이커</b>가 되셨어요 👏';
      if(badgeEl){
        badgeEl.textContent = '🏆 오늘의 첫 완주';
        badgeEl.style.background = 'rgba(245, 158, 11, 0.14)';
        badgeEl.style.color = '#f59e0b';
      }
      if(scoreEl){
        scoreEl.textContent = '완주 달성 🎉';
        scoreEl.style.color = '#f59e0b';
      }
      if(progressEl){
        progressEl.style.width = '100%';
        progressEl.style.background = 'linear-gradient(90deg, #10b981, #06b6d4)';
      }
      if(subtextEl){
        subtextEl.textContent = '오늘의 첫 번째 완주를 멋지게 해내셨어요! 곧 이어 달릴 동반자들을 기다리고 있어요 👏';
      }
      if(coldStartBox){
        coldStartBox.style.display = 'flex';
        coldStartBox.style.background = 'rgba(245, 158, 11, 0.08)';
        coldStartBox.style.borderColor = 'rgba(245, 158, 11, 0.35)';
      }
      if(coldStartIcon) coldStartIcon.textContent = '🏆';
      if(coldStartDesc) coldStartDesc.textContent = nick ? ('멋진 선두 주자! 곧 다른 동반자들이 ' + nick + '님의 뒤를 이어 합류할 예정이에요.') : '멋진 선두 주자! 곧 다른 동반자들이 뒤를 이어 합류할 예정이에요.';
      if(btnCheckin){
        btnCheckin.style.display = 'inline-flex';
        btnCheckin.textContent = '동반자 피드 ➔';
        btnCheckin.style.background = '#10b981';
        btnCheckin.onclick = function(){
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          L.state.commSubTab = 'feed';
          if(typeof L.setTab === 'function') L.setTab('comm');
          else if(typeof L.switchTab === 'function') L.switchTab('comm');
          if(typeof L.renderCommScreen === 'function') L.renderCommScreen();
        };
      }
    } else if(activeCount === 1 && !myCheckedToday){
      if(headlineEl) headlineEl.innerHTML = '오늘 벌써 <b>1명</b>의 동반자가 완주 페이스를 기록했어요 🏃';
      if(badgeEl){
        badgeEl.textContent = '🟢 LIVE · 러닝메이트';
        badgeEl.style.background = 'rgba(16, 185, 129, 0.12)';
        badgeEl.style.color = '#10b981';
      }
      if(scoreEl){
        scoreEl.textContent = '1명 완주 페이스 기록';
        scoreEl.style.color = 'var(--brand)';
      }
      if(progressEl){
        progressEl.style.width = '25%';
        progressEl.style.background = 'linear-gradient(90deg, #10b981, #06b6d4)';
      }
      if(subtextEl){
        subtextEl.textContent = '오늘의 3초 체크인을 남기면 함께 달리는 동반자로 합류합니다 ⚡';
      }
      if(coldStartBox){
        coldStartBox.style.display = 'flex';
        coldStartBox.style.background = 'rgba(16, 185, 129, 0.05)';
        coldStartBox.style.borderColor = 'rgba(16, 185, 129, 0.25)';
      }
      if(coldStartIcon) coldStartIcon.textContent = '🏃';
      if(coldStartDesc) coldStartDesc.textContent = '오늘 첫 러너가 이미 출발했어요! 지금 체크인하고 2호 주자로 합류하세요.';
      if(btnCheckin){
        btnCheckin.style.display = 'inline-flex';
        btnCheckin.textContent = '함께 체크인 ✏️';
        btnCheckin.style.background = '#10b981';
        btnCheckin.onclick = focusHomeCheckinInput;
      }
    } else {
      if(badgeEl){
        badgeEl.textContent = '🟢 LIVE · 러닝메이트';
        badgeEl.style.background = 'rgba(16, 185, 129, 0.12)';
        badgeEl.style.color = '#10b981';
      }
      if(scoreEl){
        scoreEl.textContent = activeCount + '명 완주 진행 중';
        scoreEl.style.color = 'var(--brand)';
      }
      if(progressEl){
        var pct = Math.min(100, Math.max(20, activeCount * 18));
        progressEl.style.width = pct + '%';
        progressEl.style.background = 'linear-gradient(90deg, #10b981, #06b6d4)';
      }
      if(coldStartBox){
        coldStartBox.style.display = 'none';
      }
      if(myCheckedToday){
        if(headlineEl) headlineEl.innerHTML = (nick ? ('오늘 <b>' + L.escapeHtml(nick) + '</b>님과 함께 페이스를 맞추는 동반자 <b>') : '오늘 함께 페이스를 맞추는 동반자 <b>') + activeCount + '명</b> ⚡';
        if(subtextEl) subtextEl.textContent = '오늘 체크인 완주! 동반자들의 피드를 응원해보세요 ✨';
      } else {
        if(headlineEl) headlineEl.innerHTML = '오늘 벌써 <b>' + activeCount + '명</b>의 동반자가 달리고 있어요 🏃';
        if(subtextEl) subtextEl.textContent = '오늘의 3초 체크인을 남기면 함께 달리는 크루에 합류합니다 ⚡';
      }
    }
  }
  /* ---- 이전 전 index.html 9859~9921줄(#TASK-ES-466 생성기 표지) ---- */

  function renderCrewPacingWidget(){
    var w = document.getElementById('crewPacingWidget');
    if(!w) return;
    w.style.display = 'block';

    var nick = (L.state.profile && (L.state.profile.nickname || L.state.profile.displayName)) || ''; // [HOME-21] 닉네임 없으면 이름 없는 문장
    var today = typeof L.dateKey === 'function' ? L.dateKey() : (new Date()).toISOString().slice(0, 10);

    // 1. 내가 오늘 체크인했는지 여부
    var myRecords = (L.state.profile && L.state.profile.records) || [];
    var myCheckedToday = myRecords.some(function(r){
      var rDate = r.date || (r.startAt ? (typeof L.dateKey === 'function' ? L.dateKey(r.startAt) : r.startAt.slice(0, 10)) : null);
      return rDate === today;
    });

    // 2. 실데이터: 오늘 체크인/피드 발행한 실 사용자(Unique User ID) 집계
    var activeUserMap = {};
    if(myCheckedToday && L.state.profile && L.state.profile.id){
      activeUserMap[L.state.profile.id] = true;
    }

    if(typeof L.FEED_POSTS_CACHE !== 'undefined' && Array.isArray(L.FEED_POSTS_CACHE)){
      L.FEED_POSTS_CACHE.forEach(function(post){
        if(!post) return;
        var pDate = post.created_at ? (typeof L.dateKey === 'function' ? L.dateKey(post.created_at) : post.created_at.slice(0, 10)) : null;
        if(pDate === today && post.user_id){
          activeUserMap[post.user_id] = true;
        }
      });
    }

    var activeCount = Object.keys(activeUserMap).length;
    applyCrewPacingUI(activeCount, myCheckedToday, nick);

    var btnFeed = document.getElementById('btnGoLiveFeed');
    if(btnFeed){
      btnFeed.onclick = function(){
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
        L.state.commSubTab = 'feed';
        if(typeof L.setTab === 'function') L.setTab('comm');
        else if(typeof L.switchTab === 'function') L.switchTab('comm');
        if(typeof L.renderCommScreen === 'function') L.renderCommScreen();
      };
    }

    // 피드 캐시 비어있으면 비동기 자동 로드 후 갱신
    if(typeof L.ensureFeedPostsLoaded === 'function' && !L.FEED_POSTS_CACHE){
      L.ensureFeedPostsLoaded().then(function(){
        var reUsers = {};
        if(myCheckedToday && L.state.profile && L.state.profile.id) reUsers[L.state.profile.id] = true;
        if(Array.isArray(L.FEED_POSTS_CACHE)){
          L.FEED_POSTS_CACHE.forEach(function(post){
            if(!post) return;
            var pDate = post.created_at ? (typeof L.dateKey === 'function' ? L.dateKey(post.created_at) : post.created_at.slice(0, 10)) : null;
            if(pDate === today && post.user_id) reUsers[post.user_id] = true;
          });
        }
        var reCount = Object.keys(reUsers).length;
        applyCrewPacingUI(reCount, myCheckedToday, nick);
      }).catch(function(){});
    }
  }
  /* ---- 이전 전 index.html 9922~9940줄(#TASK-ES-466 생성기 표지) ---- */

  function focusHomeCheckinInput(){
    if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
    else if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
    var box = document.getElementById('captureCardBox');
    var inp = document.getElementById('captureInput');
    if(box){
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if(inp){
      setTimeout(function(){
        try {
          inp.focus();
        } catch(e){}
      }, 300);
    }
    L.toast('오늘의 1호 완주자로 등록할 준비가 되었습니다! ✍️');
    if(window._recordHesitation) window._recordHesitation('crewStartCheckin');
  }
  /* ---- 이전 전 index.html 9941~9948줄(#TASK-ES-466 생성기 표지) ---- */

  function nudgeCrewMates(){
    if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(15);
    else if(typeof L.triggerHaptic === 'function') L.triggerHaptic(15);
    L.burstConfetti(window.innerWidth / 2, window.innerHeight / 2, 16);
    L.toast('오늘 함께 달리는 동반자들에게 뜨거운 응원을 보냈어요! 📣');
    if(window._recordHesitation) window._recordHesitation('nudgeCrewMates');
  }

  K.applyCrewPacingUI = applyCrewPacingUI;
  K.renderCrewPacingWidget = renderCrewPacingWidget;
  K.focusHomeCheckinInput = focusHomeCheckinInput;
  K.nudgeCrewMates = nudgeCrewMates;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
