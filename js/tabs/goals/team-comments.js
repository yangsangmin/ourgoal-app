/**
 * OurGoal Team Comments (목표 탭 — 팀 목표·마일스톤 댓글과 로그인 뒤 실시간 채널)
 *
 * 「RENDER: 팀 목표」 묶음 중 팀 목표 댓글 몫: 관리 권한 확인(canManageTeamGoals) · 댓글 캐시(TEAM_COMMENTS_CACHE) · 댓글 불러오기(ensureTeamCommentsLoaded — 서버 team_comments + 로컬 프로필 댓글 무손실 병합) · 댓글 실시간 수신(setupTeamCommentsRealtime) · 댓글 목록·한 줄·입력 블록 그리기(teamComments·teamCommentItemHtml·teamCommentsBlockHtml),
 * 그리고 로그인 뒤 실시간 채널을 한 번만 여는 setupRealtimeChannelsOnce(팀 댓글·소통 피드·사용자 세션). 채널 상태 변수 REALTIME_CHANNELS_SETUP 는 재대입이 있어 index.html 원래 자리에 두고 L 통로(getter·setter)로 읽는다. 다른 기기 원격 로그아웃 방송을 받는 setupUserSessionRealtime 과 USER_SESSION_CHANNEL 은 원래 자리에 두었다 — USER_SESSION_CHANNEL 은 뒤쪽 P0 이음매(#TASK-ES-442)가 getter 만 노출해 옮긴 코드의 대입이 막힌다(생성기가 앞 자리에 단 setter 를 뒤 노출이 덮는다, 작업자 실측).
 * 게스트로 닿는 몫(예시 팀 체험 → 팀목표 → 댓글 열기·등록)은 게스트 시나리오로, 로그인 뒤 몫(서버 댓글 불러오기·실시간 채널 구독)은 테스트 계정 실계정 하네스로 기준·작업을 맞댔다(#TASK-ES-545).
 * #TASK-ES-545(인라인 3단계 Z2 팀·소통 — 팀 목표 댓글·차단·목표 순서): index.html 인라인 IIFE 의 구간(이전 전 7999~8002 · 8003~8005 · 8008~8014 · 8032~8048 · 8049~8070 · 8224~8229 · 8230~8244 · 8245~8255줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 7999~8002줄(#TASK-ES-545 생성기 표지) ---- */
  function canManageTeamGoals(gid){
    var role = L.groupState(gid).myRole;
    return role==='owner' || role==='manager';
  }
  /* ---- 이전 전 index.html 8003~8005줄(#TASK-ES-545 생성기 표지) ---- */

  /* 팀 목표/마일스톤 댓글 — 역할(팀장·매니저·팀원) 무관 전원 작성·열람 가능, groupState에 로컬 저장 */
  var TEAM_COMMENTS_CACHE = {}; // gid -> team_comments rows

  /* ---- 이전 전 index.html 8008~8014줄(#TASK-ES-545 생성기 표지) ---- */
  function setupRealtimeChannelsOnce(){
    if(L.REALTIME_CHANNELS_SETUP) return;
    L.REALTIME_CHANNELS_SETUP = true;
    setupTeamCommentsRealtime();
    L.setupFeedPostsRealtime();
    L.setupUserSessionRealtime();
  }

  /* ---- 이전 전 index.html 8032~8048줄(#TASK-ES-545 생성기 표지) ---- */
  async function ensureTeamCommentsLoaded(gid){
    if(TEAM_COMMENTS_CACHE[gid]) return;
    TEAM_COMMENTS_CACHE[gid] = []; // 중복 요청 방지용 로딩 가드
    try {
      var res = await L.sb.from('team_comments').select('*').eq('group_id', gid).order('created_at', { ascending:true });
      TEAM_COMMENTS_CACHE[gid] = res.data || [];
    } catch(e){
      TEAM_COMMENTS_CACHE[gid] = [];
    }
    // 로컬 프로필 댓글 병합 (오프라인/게스트/원격실패 100% 무손실 보존 #TASK-ES-174)
    var localList = (L.state.profile && L.state.profile.settings && L.state.profile.settings.localTeamComments && L.state.profile.settings.localTeamComments[gid]) || [];
    localList.forEach(function(lc){
      if(!TEAM_COMMENTS_CACHE[gid].some(function(c){ return c.id === lc.id; })){
        TEAM_COMMENTS_CACHE[gid].push(lc);
      }
    });
  }
  /* ---- 이전 전 index.html 8049~8070줄(#TASK-ES-545 생성기 표지) ---- */
  function setupTeamCommentsRealtime(){ if(!L.sb || typeof L.sb.channel !== 'function') return;
    L.sb.channel('team_comments_channel')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'team_comments' }, function(payload){
        var row = payload.new;
        var list = TEAM_COMMENTS_CACHE[row.group_id];
        if(!list) return; // 아직 이 그룹 댓글을 열어본 적 없으면 다음에 열 때 전체를 새로 불러온다
        if(list.some(function(c){ return c.id===row.id; })) return; // 본인이 낙관적으로 이미 넣은 것과 중복 방지
        list.push(row);
        if(L.state.activeTab==='goals' && L.state.goalsSubTab==='team') L.renderTeamGoalsScreen();
      })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'team_comments' }, function(payload){
        /* 신고 누적으로 hidden이 바뀐 댓글을 다른 사용자 화면에서도 즉시 반영 (P0 5) */
        var row = payload.new;
        var list = TEAM_COMMENTS_CACHE[row.group_id];
        if(!list) return;
        var idx = list.findIndex(function(c){ return c.id===row.id; });
        if(idx === -1) return;
        list[idx] = row;
        if(L.state.activeTab==='goals' && L.state.goalsSubTab==='team') L.renderTeamGoalsScreen();
      })
      .subscribe();
  }

  /* ---- 이전 전 index.html 8224~8229줄(#TASK-ES-545 생성기 표지) ---- */

  function teamComments(gid, targetId){
    var blockedList = (L.state.profile && L.state.profile.settings && L.state.profile.settings.blockedUsers) || [];
    var filtered = L.filterHidden(TEAM_COMMENTS_CACHE[gid]);
    return L.filterBlockedPosts(filtered, blockedList).filter(function(c){ return c.target_id===targetId; });
  }
  /* ---- 이전 전 index.html 8230~8244줄(#TASK-ES-545 생성기 표지) ---- */
  function teamCommentItemHtml(c){
    var isMe = c.user_id === L.state.profile.id;
    var reported = !!((L.state.profile.settings.contentReports||{})['team_comment:'+c.id]);
    return '<div class="feed-item" style="margin-bottom:8px;">' +
        '<div class="feed-avatar'+(isMe?' me':'')+'">'+L.escapeHtml((c.display_name||'').slice(0,1))+'</div>' +
        '<div class="feed-body">' +
          '<div class="feed-head"><span class="feed-name">'+L.escapeHtml(c.display_name)+'</span></div>' +
          '<div class="feed-action">'+L.escapeHtml(c.text)+'</div>' +
          '<div class="feed-foot"><span class="feed-time">'+L.timeAgoStr(c.created_at)+'</span>'+
            (!isMe ? '<button data-reportcmt="'+c.id+'" type="button"'+(reported?' disabled':'')+' style="background:none;border:none;color:var(--ink-faint);font-size:.8125rem;cursor:pointer;">'+(reported?'신고됨':'신고')+'</button>' +
              (c.user_id ? '<button data-blockuser="'+c.user_id+'" data-blockname="'+L.escapeHtml(c.display_name||'사용자')+'" type="button" style="margin-left:8px;background:none;border:none;color:var(--ink-faint);font-size:.8125rem;cursor:pointer;">차단</button>' : '') : '') +
          '</div>' +
        '</div>' +
      '</div>';
  }
  /* ---- 이전 전 index.html 8245~8255줄(#TASK-ES-545 생성기 표지) ---- */
  function teamCommentsBlockHtml(gid, targetId){
    var list = teamComments(gid, targetId);
    return '<div class="team-comments-block" style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--rule);">' +
        '<div class="faint" style="font-size:.8125rem;margin-bottom:8px;">댓글 '+list.length+'개</div>' +
        list.map(teamCommentItemHtml).join('') +
        '<div class="dm-input-row" style="padding:0;border-top:none;display:flex;gap:6px;align-items:center;">' +
          '<input type="text" data-cmtinput="'+targetId+'" data-gid="'+gid+'" placeholder="댓글을 남겨보세요" maxlength="300" style="flex:1;min-height:44px;border-radius:8px;padding:0 12px;border:1px solid var(--rule);background:var(--surface);color:var(--ink);">' +
          '<button class="btn btn-primary btn-sm" data-cmtsend="'+targetId+'" data-gid="'+gid+'" type="button" style="min-height:44px;min-width:60px;padding:0 14px;font-weight:700;border-radius:8px;">등록</button>' +
        '</div>' +
      '</div>';
  }

  K.canManageTeamGoals = canManageTeamGoals;
  K.TEAM_COMMENTS_CACHE = TEAM_COMMENTS_CACHE;
  K.setupRealtimeChannelsOnce = setupRealtimeChannelsOnce;
  K.ensureTeamCommentsLoaded = ensureTeamCommentsLoaded;
  K.setupTeamCommentsRealtime = setupTeamCommentsRealtime;
  K.teamComments = teamComments;
  K.teamCommentItemHtml = teamCommentItemHtml;
  K.teamCommentsBlockHtml = teamCommentsBlockHtml;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
