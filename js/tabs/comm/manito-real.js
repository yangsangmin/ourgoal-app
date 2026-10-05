/**
 * OurGoal Comm Manito Real Users (소통 탭 — 마니또 실 유저 익명 응원·짝·받은 응원함·마니또 화면)
 *
 * 실 유저 판별(isValidRealUser) · 서버 마니또 자료 불러오기(loadServerManitoData) · 짝·보낸 응원·연속·서로 응원·받은 응원함(manitoPartners · manitoSentToday · manitoStreak · manitoMutualCount · manitoInbox) · 마니또 화면(renderCommManito) · 마니또 대화(renderManitoDm).
 * 서버 자료 캐시(REAL_MANITO_PARTNERS_CACHE · REAL_MANITO_INBOX_CACHE · MANITO_SERVER_LOADED)는 index.html 에 그대로 있고 L getter·setter 로 읽고 쓴다. window.isValidRealUser 노출 줄도 원래 자리에 있다.
 * #TASK-ES-461(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 25556~25569 · 25571~25632 · 25633~25677 · 25678~25681 · 25682~25690 · 25691~25693 · 25694~25714 · 25715~25961 · 25962~26010줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 25556~25569줄(#TASK-ES-461 생성기 표지) ---- */

  /* 실제 인증 가입 회원(Supabase Auth UUID) 정밀 식별기 (#TASK-ES-145) */
  function isValidRealUser(id){
    if(!id || typeof id !== 'string') return false;
    var cleanId = id.trim().toLowerCase();
    if(cleanId.indexOf('guest') === 0) return false;
    if(cleanId.indexOf('test') === 0 || cleanId.indexOf('probe') === 0 || cleanId.indexOf('sim_') === 0 ||
       cleanId.indexOf('comp_') === 0 || cleanId.indexOf('mem_') === 0 || cleanId.indexOf('mn_') === 0 ||
       cleanId.indexOf('mock_') === 0 || cleanId.indexOf('anon_') === 0 || cleanId.indexOf('u_tester') === 0){
      return false;
    }
    // Supabase Auth UUID (36자 표준 UUID: 8-4-4-4-12)
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
  }

  /* ---- 이전 전 index.html 25571~25632줄(#TASK-ES-461 생성기 표지) ---- */

  async function loadServerManitoData(){
    try {
      // 1. 실제 가입자 풀 조회 (엄격한 실 사용자 검증 필터 적용 #TASK-ES-145)
      var poolRes = await L.sb.from('team_pings').select('*')
        .eq('group_id', 'manito_pool')
        .neq('sender_id', L.state.profile ? L.state.profile.id : '')
        .limit(20);

      L.REAL_MANITO_PARTNERS_CACHE = [];
      if(poolRes.data && poolRes.data.length){
        poolRes.data.forEach(function(row){
          // 게스트 계정 및 가상/비인증 엔티티 원천 차단 (#TASK-ES-145)
          if(!isValidRealUser(row.sender_id)) return;
          if(row.hidden === true || row.status === 'inactive') return;
          var info = {}; try { info = JSON.parse(row.message); } catch(e){}
          var major = row.target_id || info.major || 'health';
          // [#TASK-ES-348] 값이 없으면 null(화면에서 숨김). 예전 기본값 1일·20% 는 측정값이 아니었다.
          var realStreak = typeof info.streak === 'number' ? Math.max(0, info.streak) : null;
          var realPct = typeof info.pct === 'number' ? Math.max(0, Math.min(100, info.pct)) : null;
          var realLogs = (Array.isArray(info.logs) && info.logs.length) ? info.logs : [
            '아직 작성된 기록이 없습니다',
            '응원을 보내 목표 달성을 격려해보세요!',
            '함께 완주해요'
          ];
          L.REAL_MANITO_PARTNERS_CACHE.push({
            id: row.sender_id,
            major: major,
            emoji: row.sender_avatar || (L.MANITO_EMOJI[major] || '🎯'),
            name: row.sender_name || '동료 러너',
            sub: info.sub || (L.TOPICS[major] ? L.TOPICS[major].subs[0] : '함께 완주'),
            goalTitle: row.target_title || info.goalTitle || '목표 달성',
            pct: realPct,
            streak: realStreak,
            logs: realLogs,
            is_ai: false
          });
        });
      }

      // 2. 나에게 도착한 실제 익명 응원 조회
      var inboxRes = await L.sb.from('team_pings').select('*').eq('group_id', 'manito').eq('receiver_id', L.state.profile ? L.state.profile.id : '').order('created_at', { ascending: false }).limit(20);
      if(inboxRes.data && inboxRes.data.length){
        L.REAL_MANITO_INBOX_CACHE = inboxRes.data.map(function(row){
          var stampObj = L.MANITO_STAMPS.find(function(s){ return s.id === row.target_id; }) || { id: 'heart', icon: '❤️', label: '응원' };
          return {
            from: { id: row.sender_id, name: row.sender_name || '익명 마니또', is_ai: false },
            stamp: stampObj,
            when: L.fmtTime(row.created_at) || '방금',
            text: row.message || stampObj.msg || '응원을 보냈어요'
          };
        });
      }
      L.MANITO_SERVER_LOADED = true;
      if(L.state.activeTab === 'comm' && L.state.commSubTab === 'manito'){
        var subBody = document.getElementById('commSubBody');
        if(subBody && !L.state.manitoDm) renderCommManito(subBody);
      }
    } catch(e){
      console.warn('[Manito] server sync warn:', e);
    }
  }
  /* ---- 이전 전 index.html 25633~25677줄(#TASK-ES-461 생성기 표지) ---- */

  /* 관심 카테고리 기반 익명 파트너 (실 유저 풀 우선 매칭 + 콜드스타트 투명 AI 동반자) */
  function manitoPartners(){
    var ms = L.manitoState();
    var majors = L.manitoMajors();
    var today = L.dateKey(L.nowISO());
    var out = [];
    var realCount = (L.REAL_MANITO_PARTNERS_CACHE && L.REAL_MANITO_PARTNERS_CACHE.length) || 0;
    // 실 유저 풀 20명 이상이면 AI 0명, 미만이면 최대 1명 콜드스타트 완충 (#TASK-ES-172 [39])
    var maxAiCount = realCount >= 20 ? 0 : 1;
    if(realCount > 0){
      L.REAL_MANITO_PARTNERS_CACHE.slice(0, 3).forEach(function(rp){
        out.push(rp);
      });
    }
    var neededAi = Math.min(maxAiCount, 3 - out.length);
    if(neededAi > 0){
      majors.slice(0, neededAi).forEach(function(major, i){
        var seed = L.hashStr(major + ms.seed + (out.length + i));
        var subs = L.TOPICS[major] ? L.TOPICS[major].subs : ['기록'];
        var sub = subs[seed % subs.length];
        var tmpl = L.CREATOR_TEMPLATES.find(function(t){ return t.category===major; });
        var goalTitle = tmpl ? tmpl.title : (L.TOPICS[major] ? L.TOPICS[major].label+' · '+sub+' 3개월 도전' : '꾸준한 실천');
        var daySeed = L.hashStr(today + major + ms.seed);
        var logs = [
          ['오늘 30분 채웠어요, 생각보다 할 만하네요','컨디션 별로였지만 15분은 했어요','드디어 한 단계 넘었다! 기록 남깁니다','오늘은 쉬는 날. 대신 내일 계획 세움','같이 하는 사람 있으니까 안 빼먹게 돼요'][daySeed % 5],
          ['어제 밀린 거 오늘 몰아서 함','작은 목표부터 다시 시작','꾸준히가 제일 어렵다는 걸 느끼는 중','주간 목표 60% 달성','새로운 루틴 시도해봤어요'][(daySeed>>3) % 5],
          ['첫 주 완료! 뿌듯','오늘은 기록만 남김','페이스 조절 배우는 중','친구한테 자랑함','내일은 더 일찍 시작할 것'][(daySeed>>6) % 5]
        ];
        out.push({
          id: 'mn_'+major,
          major: major,
          emoji: L.MANITO_EMOJI[major] || '🎯',
          name: L.genAnonName(major, seed),
          sub: sub,
          goalTitle: goalTitle,
          pct: null, // [#TASK-ES-348] AI 동반자에게 시드로 만든 달성률·연속일수를 붙이지 않는다
          streak: null,
          logs: logs,
          is_ai: true
        });
      });
    }
    return out;
  }
  /* ---- 이전 전 index.html 25678~25681줄(#TASK-ES-461 생성기 표지) ---- */
  function manitoSentToday(pid){
    var today = L.dateKey(L.nowISO());
    return L.manitoState().sent.filter(function(x){ return x.to===pid && x.date===today; }).map(function(x){ return x.stamp; });
  }
  /* ---- 이전 전 index.html 25682~25690줄(#TASK-ES-461 생성기 표지) ---- */
  function manitoStreak(){
    var days = {};
    L.manitoState().sent.forEach(function(x){ days[x.date] = true; });
    var streak = 0, cursor = new Date(); cursor.setHours(0,0,0,0);
    while(days[cursor.getFullYear()+'-'+L.pad(cursor.getMonth()+1)+'-'+L.pad(cursor.getDate())]){
      streak++; cursor.setDate(cursor.getDate()-1);
    }
    return streak;
  }
  /* ---- 이전 전 index.html 25691~25693줄(#TASK-ES-461 생성기 표지) ---- */
  function manitoMutualCount(pid){
    return L.manitoState().sent.filter(function(x){ return x.to===pid; }).length;
  }
  /* ---- 이전 전 index.html 25694~25714줄(#TASK-ES-461 생성기 표지) ---- */
  /* 받은 응원함 (실제 수신함 우선 표출 + 기본 환영 응원) */
  function manitoInbox(){
    var ms = L.manitoState();
    var partners = manitoPartners();
    var today = L.dateKey(L.nowISO());
    var items = [];
    if(L.REAL_MANITO_INBOX_CACHE && L.REAL_MANITO_INBOX_CACHE.length){
      items = items.concat(L.REAL_MANITO_INBOX_CACHE);
    }
    var myGoal = (L.state.profile && L.state.profile.goals) ? L.state.profile.goals.filter(function(g){ return !g.archivedAt; })[0] : null;
    partners.forEach(function(p, i){
      var seed = L.hashStr(today + p.id + ms.seed);
      var st = L.MANITO_STAMPS[seed % L.MANITO_STAMPS.length];
      var got = manitoMutualCount(p.id);
      if(items.length === 0 && (i===0 || got>0)){
        items.push({ from:p, stamp:st, when: i===0 ? '오늘' : (got>=3 ? '어제' : '2일 전'),
          text: myGoal ? '"'+myGoal.title+'" 잘 가고 있네요. '+st.msg : st.msg, is_ai: !!p.is_ai });
      }
    });
    return items;
  }
  /* ---- 이전 전 index.html 25715~25961줄(#TASK-ES-461 생성기 표지) ---- */

  function renderCommManito(body){
    if(!L.MANITO_SERVER_LOADED){
      loadServerManitoData();
    }
    var ms = L.manitoState();
    if(!ms.joined){
      var majors = L.manitoMajors();
      // [#TASK-ES-352] 마니또를 시작하지 않은 회원에게도 실제로 도착한 응원(첫 체크인 웰컴 응원 등)은 보여 준다.
      var preJoinInbox = (L.REAL_MANITO_INBOX_CACHE || []).slice(0, 5);
      body.innerHTML =
        (preJoinInbox.length ? '<div class="card" id="manitoPreJoinInbox"><div class="card-title-row"><h3>받은 응원함</h3><span class="dday-pill">'+preJoinInbox.length+'</span></div>' +
          preJoinInbox.map(function(it){
            return '<div class="cheer-in"><div class="ci">'+it.stamp.icon+'</div><div class="cb"><b>'+L.escapeHtml(it.from.name)+'</b> · <span class="ct">'+it.when+'</span><div>'+L.escapeHtml(it.text)+'</div></div></div>';
          }).join('') + '</div>' : '') +
        '<div class="manito-hero">' +
          '<h3>마니또를 만나볼까요?</h3>' +
          '<p>관심 카테고리가 비슷한 사람들과 <b>익명으로</b> 엮여요. 서로의 목표와 오늘 기록을 보며 응원을 주고받고, 마음이 맞으면 DM까지.</p>' +
          '<p class="faint" style="margin-top:8px;">이름·사진은 절대 공개되지 않아요 · 언제든 그만둘 수 있어요</p>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-title-row"><h3>이렇게 매칭돼요</h3></div>' +
          '<div class="tag-row" style="margin-top:0;">' + majors.map(function(k){ return '<span class="tag on">'+L.TOPICS[k].icon+' '+L.TOPICS[k].label+'</span>'; }).join('') + '</div>' +
          '<p class="faint" style="margin:10px 0 0;">'+((L.state.profile.interests||[]).length ? '내 관심 카테고리 기준으로 3명이 배정돼요' : '관심 카테고리를 아직 안 골라서 기본 카테고리로 매칭돼요 · 설정 → 프로필 편집에서 바꿀 수 있어요')+'</p>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-title-row"><h3>익명 닉네임</h3><button class="btn btn-ghost btn-sm" id="mnRegen" type="button">다시 뽑기</button></div>' +
          '<div style="font-weight:700;font-size:1.125rem;" id="mnPreviewName">'+L.escapeHtml(ms.anonName || L.genAnonName(majors[0], ms.seed))+'</div>' +
          '<p class="faint" style="margin:6px 0 0;">마니또에게는 이 이름만 보여요</p>' +
        '</div>' +
        '<div class="mission-card"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg></div><div><b>매일 미션</b><span>마니또 1명에게 응원 스탬프 보내기 → 마니또 스트릭이 쌓여요</span></div></div>' +
        '<div class="mission-card"><div class="mi">🔓</div><div><b>DM 열기</b><span>서로 3번 이상 응원하면 DM이 열려요 (양쪽 모두 허용해야 해요)</span></div></div>' +
        '<div class="mission-card"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/></svg></div><div><b>정체 공개</b><span>7일 동안 응원을 주고받으면 서로 원할 때 정체를 공개할 수 있어요</span></div></div>' +
        '<button class="mz-btn" id="mnJoin" type="button" style="background:var(--brand);box-shadow:0 16px 32px -14px var(--violet-line);">마니또 시작하기</button>';
      var previewName = ms.anonName || L.genAnonName(majors[0], ms.seed);
      document.getElementById('mnRegen').addEventListener('click', function(){
        ms.seed = Math.floor(Math.random()*100000);
        previewName = L.genAnonName(majors[Math.floor(Math.random()*majors.length)], ms.seed);
        document.getElementById('mnPreviewName').textContent = previewName;
      });
      document.getElementById('mnJoin').addEventListener('click', async function(){
        ms.joined = true; ms.joinedAt = L.nowISO(); ms.anonName = previewName; ms.allowDm = true;
        await L.saveProfile();

        var isGuest = !L.state.user || (L.state.profile && (String(L.state.profile.id).indexOf('guest') === 0 || !isValidRealUser(L.state.profile.id)));

        // 게스트 모드일 경우 서버 team_pings manito_pool 등록 차단 (로컬 AI 동반자 안전 격리 #TASK-ES-145)
        if(isGuest){
          if(navigator.vibrate) navigator.vibrate([12,40,24]);
          L.burstConfetti(window.innerWidth/2, window.innerHeight/3);
          L.toast('게스트 모드로 AI 마니또 3명이 배정됐어요 🎁 (실 유저 풀에 참여하려면 로그인해주세요)');
          renderCommManito(body);
          return;
        }

        // 인증된 실 사용자(UUID)만 Supabase team_pings 마니또 풀 등록 (#TASK-ES-133, #TASK-ES-145)
        var myGoal = (L.state.profile && L.state.profile.goals && L.state.profile.goals.filter(function(g){ return !g.archivedAt; })[0]) || null;
        var myStreak = (typeof L.computeStreakDays === 'function') ? L.computeStreakDays() : 1;
        var myPct = myGoal ? Math.round(((myGoal.milestones||[]).filter(function(m){ return m.done; }).length / Math.max(1, (myGoal.milestones||[]).length)) * 100) : 20;
        var myRecs = (L.state.profile && L.state.profile.records || []).slice(0, 3).map(function(r){ return r.text; });
        if(!myRecs.length) myRecs = ['목표를 향해 첫 발걸음을 뗐어요!'];

        var poolJoin = {
          id: 'mn_pool_' + L.state.profile.id,
          group_id: 'manito_pool',
          sender_id: L.state.profile.id,
          sender_name: previewName,
          sender_avatar: L.MANITO_EMOJI[majors[0]] || '🎯',
          receiver_id: '',
          target_type: 'manito_member',
          target_id: majors[0],
          target_title: myGoal ? myGoal.title : '목표 달성',
          ping_type: 'join',
          message: JSON.stringify({
            major: majors[0],
            anonName: previewName,
            goalTitle: myGoal ? myGoal.title : '목표 달성',
            sub: (L.TOPICS[majors[0]] ? L.TOPICS[majors[0]].subs[0] : '함께 완주'),
            streak: myStreak,
            pct: myPct,
            logs: myRecs
          }),
          status: 'active',
          hidden: false,
          created_at: L.nowISO()
        };
        L.sb.from('team_pings').upsert(poolJoin).then(function(r){
          if(r.error) console.warn('[ManitoPool] Supabase upsert warn:', r.error.message);
        });

        if(navigator.vibrate) navigator.vibrate([12,40,24]);
        L.burstConfetti(window.innerWidth/2, window.innerHeight/3);
        L.toast('마니또 3명이 배정됐어요 🎁');
        renderCommManito(body);
      });
      return;
    }

    if(L.state.manitoDm){
      return renderManitoDm(body, L.state.manitoDm);
    }

    var partners = manitoPartners();
    var streak = manitoStreak();
    var today = L.dateKey(L.nowISO());
    var sentToday = ms.sent.filter(function(x){ return x.date===today; }).length;
    var inbox = manitoInbox();
    var totalSent = ms.sent.length;

    var firstPartner = partners.length ? partners[0] : null;
    var welcomeHeroCardHtml = firstPartner ?
      '<div class="manito-welcome-card" id="manitoWelcomeHeroCard">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">' +
          '<span class="manito-welcome-badge">🎁 마니또 매칭 완료</span>' +
          '<span style="font-size:0.75rem;color:var(--ink-faint);font-weight:600;">1초 원클릭 응원</span>' +
        '</div>' +
        '<h3 class="manito-welcome-title">' +
          '<span>' + firstPartner.emoji + ' ' + L.escapeHtml(firstPartner.name) + '님에게 웰컴 응원 보내기' + (firstPartner.is_ai ? ' <span class="feed-c-badge badge-ai">AI</span>' : '') + '</span>' +
        '</h3>' +
        '<p class="manito-welcome-desc">' +
          '목표: "<b>' + L.escapeHtml(firstPartner.goalTitle) + '</b>"<br>' +
          '비밀 친구에게 따뜻한 웰컴 스탬프를 눌러 첫 응원을 선물해보세요!' +
        '</p>' +
        '<div class="manito-welcome-grid">' +
          L.MANITO_WELCOME_STAMPS.map(function(st){
            return '<button class="manito-welcome-stamp-btn" data-mwelcome-stamp="' + st.id + '" data-mwelcome-to="' + firstPartner.id + '" type="button">' +
              '<span>' + st.icon + ' ' + st.label + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>' : '';

    body.innerHTML =
      welcomeHeroCardHtml +
      '<div class="manito-hero">' +
        '<div class="faint" style="font-size:.8125rem;letter-spacing:0;">MY MANITO</div>' +
        '<h3>'+L.escapeHtml(ms.anonName)+'</h3>' +
        '<p>보낸 응원 <b>'+totalSent+'</b> · 받은 응원 <b>'+inbox.length+'</b> · 마니또 스트릭 <b>'+streak+'일</b></p>' +
        '<div class="tag-row" style="margin-top:10px;">' +
          (streak>=7 ? '<span class="tag" style="background:rgba(255,255,255,.2);color:#fff;">7일 응원러</span>' : '') +
          (totalSent>=10 ? '<span class="tag" style="background:rgba(255,255,255,.2);color:#fff;">응원 10회</span>' : '') +
          (totalSent===0 ? '<span class="tag" style="background:rgba(255,255,255,.2);color:#fff;">첫 응원을 보내보세요</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="mission-card">' +
        '<div class="mi">'+(sentToday ? '✅' : '🎯')+'</div>' +
        '<div><b>'+(sentToday ? '오늘 미션 완료!' : '오늘의 미션')+'</b><span>'+(sentToday ? '내일도 한 명에게 마음을 전해요' : '마니또 1명에게 응원 스탬프 보내기')+'</span></div>' +
      '</div>' +
      (inbox.length ? '<div class="card"><div class="card-title-row"><h3>받은 응원함</h3><span class="dday-pill">'+inbox.length+'</span></div>' +
        inbox.map(function(it){
          return '<div class="cheer-in"><div class="ci">'+it.stamp.icon+'</div><div class="cb"><b>'+L.escapeHtml(it.from.name)+'</b>'+((it.is_ai || (it.from && it.from.is_ai)) ? ' <span class="feed-c-badge badge-ai">AI</span>' : '')+' · <span class="ct">'+it.when+'</span><div>'+L.escapeHtml(it.text)+'</div></div></div>';
        }).join('') + '</div>' : '') +
      '<p class="faint" style="margin:4px 0 10px;">내 마니또 '+partners.length+'명 · 익명이에요</p>' +
      partners.map(function(p){
        var sent = manitoSentToday(p.id);
        var mutual = manitoMutualCount(p.id);
        var dmOpen = ms.allowDm && mutual>=3;
        var canReveal = mutual>=7;
        var color = p.pct>=67 ? '#1FC98E' : (p.pct>=34 ? '#FF9F1C' : '#FF4F64');
        var isActuallyReal = !p.is_ai && isValidRealUser(p.id);
        var partnerBadgeHtml = isActuallyReal
          ? '<span class="badge-real" style="font-size:.6875rem;font-weight:700;padding:2px 6px;border-radius:6px;background:rgba(16,185,129,.12);color:#10b981;margin-left:6px;vertical-align:middle;">[✨ 실 유저]</span>'
          : '<span class="badge-ai" style="font-size:.6875rem;font-weight:700;padding:2px 6px;border-radius:6px;background:rgba(99,102,241,.12);color:#6366f1;margin-left:6px;vertical-align:middle;">[🤖 AI 동반자]</span>';
        return '<div class="manito-card">' +
          '<div class="manito-head">' +
            '<div class="manito-avatar">'+p.emoji+'</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div class="manito-name">'+L.escapeHtml(p.name)+partnerBadgeHtml+'</div>' +
              '<div class="manito-sub">'+L.TOPICS[p.major].icon+' '+L.TOPICS[p.major].label+' · '+L.escapeHtml(p.sub)+(p.streak > 0 ? ' · 🔥 '+p.streak+'일 연속' : '')+'</div>' +
            '</div>' +
            (typeof p.pct === 'number' ? '<div class="gauge">'+L.gaugeSvg(p.pct, 46, color)+'</div>' : '') +
          '</div>' +
          '<div style="font-weight:700;font-size:.9375rem;margin-bottom:2px;">'+L.escapeHtml(p.goalTitle)+'</div>' +
          '<div class="manito-rec"><span class="d">오늘</span><span>'+L.escapeHtml(p.logs[0])+'</span></div>' +
          '<div class="manito-rec"><span class="d">어제</span><span>'+L.escapeHtml(p.logs[1])+'</span></div>' +
          '<div class="manito-rec"><span class="d">2일전</span><span>'+L.escapeHtml(p.logs[2])+'</span></div>' +
          '<div class="stamp-row">' +
            L.MANITO_WELCOME_STAMPS.map(function(st){
              var on = sent.indexOf(st.id)!==-1;
              return '<button class="stamp'+(on?' sent':'')+'" data-stamp="'+st.id+'" data-to="'+p.id+'" type="button">'+st.icon+' '+st.label+'</button>';
            }).join('') +
          '</div>' +
          '<div style="display:flex;gap:8px;margin-top:10px;align-items:center;">' +
            '<span class="faint" style="flex:1;">주고받은 응원 '+mutual+'회'+
              (dmOpen ? ' · 💬 DM 열림' :
                (!ms.allowDm ? ' · 내 DM 허용을 켜면 열려요' :
                  ' · '+(Math.max(0,3-mutual))+'번 더 하면 DM'))+'</span>' +
            (dmOpen ? '<button class="btn btn-primary btn-sm" data-mndm="'+p.id+'" type="button" style="background:var(--brand);box-shadow:none;">DM</button>'
                    : '<button class="btn btn-ghost btn-sm" type="button" disabled>DM</button>') +
            (canReveal ? '<button class="btn btn-ghost btn-sm" data-mnreveal="'+p.id+'" type="button">정체 공개 제안</button>' : '') +
          '</div>' +
          (ms.revealed[p.id] ? '<p class="faint" style="margin:8px 0 0;color:var(--ink);">정체 공개를 제안했어요 · 상대가 수락하면 서로 프로필이 열려요</p>' : '') +
        '</div>';
      }).join('') +
      '<div class="card">' +
        '<div class="card-title-row"><h3>마니또 설정</h3></div>' +
        '<div class="toggle-row" style="box-shadow:none;background:var(--card2);"><div class="t">DM 허용<div class="faint" style="font-size:.8125rem;">끄면 서로 3회 응원해도 DM이 열리지 않아요</div></div><div class="switch'+(ms.allowDm?' on':'')+'" id="mnAllowDm"></div></div>' +
        '<div style="display:flex;gap:8px;margin-top:10px;">' +
          '<button class="btn btn-ghost btn-sm" id="mnReshuffle" type="button" style="flex:1;">마니또 다시 매칭</button>' +
          '<button class="btn btn-danger btn-sm" id="mnQuit" type="button" style="flex:1;">그만두기</button>' +
        '</div>' +
      '</div>';

    body.querySelectorAll('[data-mwelcome-stamp]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var pid = btn.dataset.mwelcomeTo;
        var sid = btn.dataset.mwelcomeStamp;
        L.sendManitoWelcomeStamp(pid, sid, btn, body);
      });
    });

    body.querySelectorAll('[data-stamp]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var pid = btn.dataset.to, sid = btn.dataset.stamp;
        L.sendManitoWelcomeStamp(pid, sid, btn, body);
      });
    });
    body.querySelectorAll('[data-mndm]').forEach(function(btn){
      btn.addEventListener('click', function(){ L.state.manitoDm = btn.dataset.mndm; renderCommManito(body); });
    });
    body.querySelectorAll('[data-mnreveal]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var pid = btn.dataset.mnreveal;
        if(!(await OurgoalCapabilities.call('ui.confirm', '정체 공개를 제안할까요? 상대도 수락해야 서로 프로필이 열려요.'))) return;
        ms.revealed[pid] = L.nowISO();
        await L.saveProfile();
        L.toast('정체 공개를 제안했어요 🎭');
        renderCommManito(body);
      });
    });
    document.getElementById('mnAllowDm').addEventListener('click', async function(){
      ms.allowDm = !ms.allowDm; await L.saveProfile(); renderCommManito(body);
    });
    document.getElementById('mnReshuffle').addEventListener('click', async function(){
      if(!(await OurgoalCapabilities.call('ui.confirm', '지금 마니또와의 응원 기록은 유지되고, 새 마니또 3명이 배정돼요. 진행할까요?'))) return;
      ms.seed = Math.floor(Math.random()*100000);
      await L.saveProfile();
      L.toast('새 마니또가 배정됐어요 🎁');
      renderCommManito(body);
    });
    document.getElementById('mnQuit').addEventListener('click', async function(){
      if(!(await OurgoalCapabilities.call('ui.confirm', '마니또를 그만둘까요? 보낸 응원 기록은 남아요.'))) return;
      ms.joined = false;
      await L.saveProfile();
      renderCommManito(body);
    });
  }
  /* ---- 이전 전 index.html 25962~26010줄(#TASK-ES-461 생성기 표지) ---- */

  function renderManitoDm(body, pid){
    var ms = L.manitoState();
    var p = manitoPartners().find(function(x){ return x.id===pid; });
    if(!p){ L.state.manitoDm = null; return renderCommManito(body); }
    if(!ms.threads[pid]) ms.threads[pid] = [{ from:'them', text:'안녕하세요! 응원 감사해요 😊 서로 목표 얘기해요', time: L.fmtTime(L.nowISO()) }];
    var thread = ms.threads[pid];
    body.innerHTML = '<span class="dm-back" id="mnDmBack">‹ 마니또로</span>' +
      '<div class="dm-thread-wrap">' +
        '<div class="dm-msgs" id="mnDmMsgs">' + thread.map(function(m){
          var isMe = (m.from === 'me');
          var timeStr = m.time || '방금';
          if(isMe){
            return '<div class="dm-row me" style="display:flex;justify-content:flex-end;align-items:flex-end;gap:5px;margin:4px 0;">' +
              '<span style="font-size:0.6875rem;color:var(--ink-faint);line-height:1;white-space:nowrap;">' + L.escapeHtml(timeStr) + '</span>' +
              '<div class="dm-msg me" style="max-width:72%;padding:9px 13px;border-radius:14px 14px 2px 14px;background:var(--brand-strong);color:#fff;font-size:0.875rem;line-height:1.45;word-break:break-word;">' + L.escapeHtml(m.text) + '</div>' +
            '</div>';
          } else {
            return '<div class="dm-row them" style="display:flex;justify-content:flex-start;align-items:flex-end;gap:5px;margin:4px 0;">' +
              '<div class="dm-msg them" style="max-width:72%;padding:9px 13px;border-radius:14px 14px 14px 2px;background:var(--surface-2);color:var(--ink);border:1px solid var(--rule);font-size:0.875rem;line-height:1.45;word-break:break-word;">' + L.escapeHtml(m.text) + '</div>' +
              '<span style="font-size:0.6875rem;color:var(--ink-faint);line-height:1;white-space:nowrap;">' + L.escapeHtml(timeStr) + '</span>' +
            '</div>';
          }
        }).join('') + '</div>' +
        '<div class="dm-input-row"><input id="mnDmInput" type="text" placeholder="익명으로 메시지 보내기"><button class="btn btn-primary btn-sm" id="mnDmSend" type="button">전송</button></div>' +
      '</div>' +
      '<p class="faint" style="margin-top:10px;">서로 익명이에요 · 불편하면 마니또 설정에서 DM을 끌 수 있어요</p>';
    document.getElementById('mnDmBack').addEventListener('click', function(){ L.state.manitoDm = null; renderCommManito(body); });
    var msgsEl = document.getElementById('mnDmMsgs');
    msgsEl.scrollTop = msgsEl.scrollHeight;
    var replies = ['저도 오늘 딱 그랬어요 ㅋㅋ','같이 하니까 좀 덜 외롭네요','내일 인증 같이 해요!','오 그 방법 좋다, 저도 해볼게요','응원 덕분에 오늘 채웠어요 🙏'];
    async function send(){
      var input = document.getElementById('mnDmInput');
      var text = input.value.trim();
      if(!text) return;
      thread.push({ from:'me', text:text, time: L.fmtTime(L.nowISO()) });
      input.value = '';
      L.track('dm_sent', { source: 'manito', goal_type: null, day_index: L.dayIndexSinceSignup(), partner_id: pid });
      await L.saveProfile();
      if(document.body.contains(body) && L.state.manitoDm===pid) renderManitoDm(body, pid);
      setTimeout(async function(){
        thread.push({ from:'them', text: replies[Math.floor(Math.random()*replies.length)], time: L.fmtTime(L.nowISO()) });
        await L.saveProfile();
        if(document.body.contains(body) && L.state.manitoDm===pid) renderManitoDm(body, pid);
      }, 800+Math.random()*700);
    }
    document.getElementById('mnDmSend').addEventListener('click', send);
    document.getElementById('mnDmInput').addEventListener('keydown', function(e){ if(e.key==='Enter') send(); });
  }

  K.isValidRealUser = isValidRealUser;
  K.loadServerManitoData = loadServerManitoData;
  K.manitoPartners = manitoPartners;
  K.manitoSentToday = manitoSentToday;
  K.manitoStreak = manitoStreak;
  K.manitoMutualCount = manitoMutualCount;
  K.manitoInbox = manitoInbox;
  K.renderCommManito = renderCommManito;
  K.renderManitoDm = renderManitoDm;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
