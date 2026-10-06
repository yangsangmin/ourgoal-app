/**
 * 앱 부팅 및 세션 복원 (app-boot)
 *
 * Supabase Auth 리스너 등록, PKCE 복원, 게스트/로그인 세션 초기화 및 진입을 관장한다.
 * #TASK-ES-581(전체 화면 렌더·앱 부팅 원문 분열 (renderAll 및 appBoot)): index.html 인라인 IIFE 의 구간(이전 전 7807~8033줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalUiHelpers = global.OurgoalUiHelpers || {};

  /* ---- 이전 전 index.html 7807~8033줄(#TASK-ES-581 생성기 표지) ---- */
  function runAppBoot() { /* [#TASK-ES-581] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* ============ Boot ============ */
  (async function boot(){
    // 1. Supabase Auth 전역 리스너 (카카오 OAuth 리다이렉트 및 비밀번호 재설정 감지)
    try {
      L.sb.auth.onAuthStateChange(async function(event, session){
        if(event === 'PASSWORD_RECOVERY'){
          L.openNewPasswordModal();
          return;
        }
        if((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session && session.user){
          if(!L.state.profile || L.state.profile.id !== session.user.id){
            await L.restoreSessionAndEnter(session);
          }
        }
      });
    } catch(e){}
    // 1-1. URL 해시 상의 비밀번호 재설정 토큰 감지
    try {
      var hStr = window.location.hash || '';
      var sStr = window.location.search || '';
      if(hStr.indexOf('type=recovery') !== -1 || sStr.indexOf('type=recovery') !== -1 || hStr.indexOf('reset-password') !== -1){
        setTimeout(L.openNewPasswordModal, 400);
      }
    } catch(e){}
    // 0. PKCE code_verifier 복원 (카카오톡 인앱 브라우저 웹뷰 복귀 시 localStorage 유실 대비)
    try {
      for(var ski = 0; ski < sessionStorage.length; ski++){
        var sKey = sessionStorage.key(ski);
        if(sKey && sKey.indexOf('-code-verifier') !== -1 && !localStorage.getItem(sKey)){
          localStorage.setItem(sKey, sessionStorage.getItem(sKey));
        }
      }
    } catch(e){}
    // 2. URL 해시/쿼리상의 OAuth 에러 처리 및 안전 복구
    try{
      var hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      var searchParams = new URLSearchParams(window.location.search);
      var authErr = hashParams.get('error_description') || searchParams.get('error_description')
        || hashParams.get('error') || searchParams.get('error');
      if(authErr){
        var decoded = decodeURIComponent(authErr.replace(/\+/g, ' '));
        console.warn('OAuth 인가 오류 감지:', decoded);
        try { await L.sb.auth.signOut({ scope: 'local' }); } catch(e){}
        if(window.history && window.history.replaceState){
          window.history.replaceState(null, '', window.location.pathname);
        }
        if(/unable to exchange external code|koe010|bad client credentials|unexpected_failure|code_verifier|invalid_grant|pkce|bad request/i.test(decoded)){
          L.openLoginRescueModal('카카오톡 인앱 환경에서 인증 세션 연결이 지연되었습니다. 닉네임이나 이메일을 입력하시면 기존 기록과 함께 즉시 입장하실 수 있습니다!');
        } else {
          L.toast('로그인 중 문제가 발생했어요: ' + decoded);
        }
      }
    } catch(e){}
    // 3. 최상단 리스너에서 미리 감지된 pending 세션이 있으면 즉시 복원
    if(L._pendingAuthSession && L._pendingAuthSession.user){
      var okPending = await L.restoreSessionAndEnter(L._pendingAuthSession);
      if(okPending) return;
    }
    // 4. OAuth 리다이렉트 콜백 대기 루프 (카카오 리다이렉트 시 4.0초 안전 대기)
    var isOAuthCallback = window.location.hash.indexOf('access_token') !== -1 || window.location.search.indexOf('code=') !== -1;
    if(isOAuthCallback) L.toast('카카오 로그인 세션을 확인 중입니다…');
    try{
      var session = null;
      var maxWait = isOAuthCallback ? 20 : 1; // #TASK-ES-116: 4.0초 대기
      for(var i = 0; i < maxWait; i++){
        var res = await L.sb.auth.getSession();
        session = res.data && res.data.session;
        if(session && session.user) break;
        if(isOAuthCallback && i < maxWait - 1){
          await new Promise(function(r){ setTimeout(r, 200); });
        }
      }
      if(session && session.user){
        var ok = await L.restoreSessionAndEnter(session);
        if(ok) return;
      } else if(isOAuthCallback){
        try { await L.sb.auth.signOut({ scope: 'local' }); } catch(e){}
        if(window.history && window.history.replaceState) window.history.replaceState(null, '', window.location.pathname);
        L.openLoginRescueModal('카카오톡 인앱 브라우저 세션 지연이 발생했습니다. 닉네임이나 이메일을 입력하시면 즉시 내 데이터를 불러와 입장하실 수 있습니다!');
      }
    } catch(e){ /* fall through to guest / landing */ }
    // 5. 게스트 세션 확인 및 자가치유 복구 (#TASK-ES-035)
    try {
      var guestRaw = localStorage.getItem('ourgoal_guest_profile');
      if(guestRaw){
        var gp = JSON.parse(guestRaw);
        if(gp && gp.id){
          var gpUpdated = false;
          if(!gp.records || gp.records.length === 0){
            /* [#TASK-ES-365] 이 사본 주인(gp.id)의 백업만 읽는다 — 새 게스트가 이 기기의 다른 사람 기록을 받아 보지 않게 */
            var recBackup = window.OurgoalAccountIsolation.readOwnCopy('ourgoal_records_backup_', gp.id, null);
            if(Array.isArray(recBackup) && recBackup.length > 0){
              gp.records = recBackup;
              gpUpdated = true;
            }
          }
          if(!gp.bio && (!gp.interests || gp.interests.length === 0) && !gp.region){
            var profBackup = window.OurgoalAccountIsolation.readOwnCopy('ourgoal_profile_backup_', gp.id, null);
            if(profBackup){
              if(profBackup.bio) gp.bio = profBackup.bio;
              if(profBackup.interests && profBackup.interests.length) gp.interests = profBackup.interests;
              if(profBackup.region) gp.region = profBackup.region;
              if(typeof profBackup.regionPublic !== 'undefined') gp.regionPublic = profBackup.regionPublic;
              if(profBackup.itItems && profBackup.itItems.length) gp.itItems = profBackup.itItems;
              gpUpdated = true;
            }
          }
          if(!Array.isArray(gp.goals)){
            var goalBackup = null;
            try { goalBackup = JSON.parse(localStorage.getItem('ourgoal_goals_backup_' + gp.id) || 'null'); } catch(e){}
            if(Array.isArray(goalBackup)){ gp.goals = goalBackup; gpUpdated = true; }
          }
          if(Array.isArray(gp.goals)){
            gp.goals.forEach(function(g){
              if(g && g.visibility === 'followers'){ g.visibility = 'team'; gpUpdated = true; }
            });
          }
          if(Array.isArray(gp.records)){
            gp.records.forEach(function(r){
              if(!r.text && r.content) r.text = r.content;
              if(!r.startAt && r.start_at) r.startAt = r.start_at;
            });
          }
          if(gpUpdated){
            try { localStorage.setItem('ourgoal_guest_profile', JSON.stringify(gp)); } catch(e){}
          }
          L.state.profile = gp;
          document.getElementById('landingScreen').style.display = 'none';
          document.getElementById('authScreen').style.display = 'none';
          L.enterApp();
          L.checkAndHandlePeerInviteUrl();
          setTimeout(function(){
            L.syncServerRecords(false).then(function(hasUpdated){
              if(hasUpdated) L.renderAll();
            }).catch(function(){});
            L.loadProfile(gp.id, gp.username, {}, 'boot_bg_sync').then(function(refreshed){
              if(refreshed && refreshed.records && refreshed.records.length > (L.state.profile.records || []).length){
                L.state.profile.records = refreshed.records;
                L.renderAll();
              }
            }).catch(function(){});
          }, 300);
          return;
        }
      }
    } catch(e){}

    // #TASK-PREVIEW: 프리뷰 환경(포트 8888, localhost, ?preview=1)에서 즉시 풀 경험 진입
    var isPreviewEnv = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '8888' || window.location.search.indexOf('preview') !== -1);
    if(isPreviewEnv && !L.state.profile){
      try {
        var existingGuestRaw = localStorage.getItem('ourgoal_guest_profile');
        var pGuest = existingGuestRaw ? JSON.parse(existingGuestRaw) : null;
        if(!pGuest || !Array.isArray(pGuest.goals) || pGuest.goals.length === 0){
          pGuest = L.defaultProfile('guest-preview-sanctuary', 'guest_preview', '게스트');
          var nowD = new Date();
          pGuest.goals = [
            {
              id: 'goal_preview_run',
              title: '10km 하프마라톤 완주 🏃',
              topic: '운동/건강',
              theme: 'workout',
              progress: 65,
              dueDate: L.dateKey(new Date(nowD.getTime() + 14 * 86400000)),
              milestones: [
                { id: 'ms_01', title: '5km 논스톱 달리기', done: true, dueDate: L.dateKey(nowD) },
                { id: 'ms_02', title: '10km 지속 페이스 5:30 달성', done: false, dueDate: L.dateKey(new Date(nowD.getTime() + 7 * 86400000)) }
              ],
              tasks: [
                { id: 'tk_01', title: '러닝화 카본 플레이트 점검', done: true },
                { id: 'tk_02', title: '주 3회 야간 조깅 루틴', done: false }
              ]
            },
            {
              id: 'goal_preview_read',
              title: '매일 아침 독서 30분 📖',
              topic: '공부/수험',
              theme: 'study',
              progress: 80,
              dueDate: L.dateKey(new Date(nowD.getTime() + 8 * 86400000)),
              milestones: [
                { id: 'ms_03', title: '도서 1권 완독', done: true, dueDate: L.dateKey(nowD) },
                { id: 'ms_04', title: '주요 인사이트 노션 아카이빙', done: false, dueDate: L.dateKey(new Date(nowD.getTime() + 4 * 86400000)) }
              ],
              tasks: []
            }
          ];
          pGuest.records = [];
          var sampleTexts = [
            '5km 러닝 28분 완주! 마지막 1km 페이스 업 성공 🔥',
            '도서 인간관계론 3장 완독. 경청의 힘 메모 📝',
            '알고리즘 코딩 1시간 집중 몰입 완료 💻',
            '아침 공복 러닝 4km 완료, 상쾌한 시작 🏃',
            '독서 30분 및 핵심 문장 노션 정리 📚',
            '인터벌 러닝 30분 및 스트레칭 ⚡',
            '오늘의 목표 회고 및 내일 할 일 계획 🎯',
            '야간 6km 러닝 완주, 페이스 5:25 달성 🌟'
          ];
          for(var sIdx=0; sIdx<sampleTexts.length; sIdx++){
            var recDate = new Date(nowD.getTime() - (sampleTexts.length - 1 - sIdx) * 1.3 * 86400000);
            pGuest.records.push({
              id: 'rec_prev_' + sIdx,
              goal_id: sIdx % 2 === 0 ? 'goal_preview_run' : 'goal_preview_read',
              text: sampleTexts[sIdx],
              content: sampleTexts[sIdx],
              startAt: recDate.toISOString(),
              start_at: recDate.toISOString(),
              created_at: recDate.toISOString(),
              topic: sIdx % 2 === 0 ? '운동/건강' : '공부/수험'
            });
          }
          localStorage.setItem('ourgoal_guest_profile', JSON.stringify(pGuest));
        }
        sessionStorage.setItem('ourgoal_avatar_greeted_session', '1');
        L.state.profile = pGuest;
        document.getElementById('landingScreen').style.display = 'none';
        document.getElementById('authScreen').style.display = 'none';
        L.enterApp();
        return;
      } catch(prevErr){ console.warn('Preview auto init error:', prevErr); }
    }

    // 6. 기본 랜딩 화면
    document.getElementById('landingScreen').style.display = 'flex';
    try{ L.recordLanding(location.search, L.dateKey(L.nowISO())); } catch(e){ /* 계측 실패 무시 */ }
    L.checkAndHandlePeerInviteUrl();
  })();
  } /* runAppBoot */

  K.runAppBoot = runAppBoot;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
