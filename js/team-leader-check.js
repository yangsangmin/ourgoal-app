/* ============================================================
 * 아워골 — 팀 목표 모임장-팀원 목표달성도 점검 시스템
 * #TASK-ES-026 · #TASK-ES-027 · 본질 ③ 동류 발견·소통 / ① 체크인 루프
 *
 * 1. 모임장(Owner) 및 운영진(Manager):
 *    - 팀원들의 실시간 달성률, 오늘 인증 상태, 스트릭 점검
 *    - 확인 도장(4종) 및 1초 독려 넛지, 1:1 피드백 전달
 *    - 팀원 찌르기 수신 및 1:1 DM 반응(대화)
 *
 * 2. 팀원(Member):
 *    - 목표/마일스톤/세부할일 달성 시: 🎉 [달성자랑 찌르기]
 *    - 미달성/정체기 시: 🥺 [힘들어요 찌르기]
 *    - 모임장 1:1 DM 답장 수신 및 양방향 대화
 * ============================================================ */
(function(global){
  'use strict';

  var LEADER_STAMPS = {
    perfect: { id:'perfect', label:'완벽해요', icon:'🌟', color:'var(--gold)', bg:'var(--gold-soft)' },
    growth:  { id:'growth',  label:'폭풍성장', icon:'🚀', color:'var(--brand-strong)', bg:'var(--red-soft)' },
    good:    { id:'good',    label:'참잘했어요', icon:'👏', color:'var(--sage)', bg:'var(--sage-soft)' },
    cheer:   { id:'cheer',   label:'힘내요',   icon:'💪', color:'var(--ink-soft)', bg:'var(--rule)' }
  };

  var PING_TYPES = {
    boast: {
      id: 'boast',
      label: '달성자랑 찌르기',
      icon: '🎉',
      badgeText: '달성자랑',
      badgeColor: 'var(--gold)',
      badgeBg: 'var(--gold-soft)',
      desc: '목표나 마일스톤을 달성했을 때 모임장님에게 뿌듯함을 자랑해요!',
      templates: [
        '목표 달성 완료했습니다! 모임장님 칭찬해주세요 🎉',
        '오늘 할 일 끝내고 마일스톤 돌파했어요! ✨',
        '뿌듯해서 모임장님께 먼저 자랑 남깁니다! 🚀'
      ]
    },
    struggle: {
      id: 'struggle',
      label: '힘들어요 찌르기',
      icon: '🥺',
      badgeText: '힘들어요',
      badgeColor: 'var(--brand-strong)',
      badgeBg: 'var(--red-soft)',
      desc: '목표 달성이 막히거나 지칠 때 모임장님께 조언과 격려를 요청해요.',
      templates: [
        '이 부분이 너무 막혀서 진행이 어려워요 🥺',
        '시간 분배가 힘들어서 조언이 필요해요..',
        '잠시 정체기인데 모임장님 팁 부탁드려요! 💪'
      ]
    }
  };

  var activeFilter = 'all';

  function esc(s){
    if(s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var TEAM_PINGS_CACHE = {}; // gid -> array of pings
  var REALTIME_CHANNEL = null;
  var globalDeps = null;

  async function ensureTeamPingsLoaded(gid, deps){
    var d = deps || globalDeps;
    var sb = d && d.sb;
    if(!sb) return;
    if(TEAM_PINGS_CACHE[gid]) return;
    TEAM_PINGS_CACHE[gid] = [];
    try {
      var res = await sb.from('team_pings')
        .select('*, team_ping_replies(*)')
        .eq('group_id', gid)
        .order('created_at', { ascending: false });
      if(!res.error && res.data){
        TEAM_PINGS_CACHE[gid] = res.data.map(function(row){
          return {
            id: row.id,
            gid: row.group_id,
            senderId: row.sender_id,
            senderName: row.sender_name,
            receiverId: row.receiver_id,
            pingType: row.ping_type,
            targetType: row.target_type,
            targetId: row.target_id,
            targetTitle: row.target_title,
            message: row.message,
            status: row.status,
            createdAt: row.created_at,
            replies: (row.team_ping_replies || []).map(function(rep){
              return {
                id: rep.id,
                senderId: rep.sender_id,
                senderName: rep.sender_name,
                receiverId: rep.receiver_id,
                message: rep.message,
                createdAt: rep.created_at
              };
            })
          };
        });
        if(d && typeof d.getGroupState === 'function'){
          var gs = d.getGroupState(gid);
          if(gs){
            var existingLocal = gs.memberPings || [];
            var map = {};
            TEAM_PINGS_CACHE[gid].forEach(function(p){ map[p.id] = p; });
            existingLocal.forEach(function(p){ if(!map[p.id]) map[p.id] = p; });
            gs.memberPings = Object.keys(map).map(function(k){ return map[k]; }).sort(function(a,b){
              return new Date(b.createdAt) - new Date(a.createdAt);
            });
          }
        }
      }
    } catch(e){}
  }

  async function dispatchPingToDb(ping, deps){
    var d = deps || globalDeps;
    var sb = d && d.sb;
    if(sb && ping.senderId){
      try {
        await sb.from('team_pings').insert({
          id: ping.id,
          group_id: ping.gid,
          sender_id: ping.senderId,
          sender_name: ping.senderName,
          receiver_id: ping.receiverId,
          target_type: ping.targetType,
          target_id: ping.targetId,
          target_title: ping.targetTitle,
          ping_type: ping.pingType,
          message: ping.message,
          status: 'sent',
          created_at: ping.createdAt
        });
      } catch(e){}
    }
    try {
      if(typeof fetch === 'function' && ping.receiverId){
        fetch('/api/push-dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUserId: ping.receiverId,
            title: ping.senderName + '님의 ' + (ping.pingType === 'boast' ? '🎉 달성자랑' : '🥺 힘들어요') + ' 찌르기',
            body: ping.message,
            url: '/?tab=goals&sub=team&gid=' + encodeURIComponent(ping.gid)
          })
        }).catch(function(){});
      }
    } catch(e){}
  }

  async function dispatchReplyToDb(reply, ping, deps){
    var d = deps || globalDeps;
    var sb = d && d.sb;
    if(sb && reply.senderId){
      try {
        await sb.from('team_ping_replies').insert({
          id: reply.id,
          ping_id: ping.id,
          group_id: ping.gid,
          sender_id: reply.senderId,
          sender_name: reply.senderName,
          receiver_id: reply.receiverId,
          message: reply.message,
          created_at: reply.createdAt
        });
        await sb.from('team_pings').update({
          status: 'replied',
          updated_at: new Date().toISOString()
        }).eq('id', ping.id);
      } catch(e){}
    }
    try {
      if(typeof fetch === 'function' && reply.receiverId){
        fetch('/api/push-dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUserId: reply.receiverId,
            title: reply.senderName + '님의 1:1 DM 답장 💬',
            body: reply.message,
            url: '/?tab=goals&sub=team&gid=' + encodeURIComponent(ping.gid)
          })
        }).catch(function(){});
      }
    } catch(e){}
  }

  function setupTeamPingsRealtime(deps){
    var d = deps || globalDeps;
    var sb = d && d.sb;
    if(!sb || REALTIME_CHANNEL) return;
    try {
      REALTIME_CHANNEL = sb.channel('team_pings_realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_pings' }, function(payload){
          var row = payload.new;
          if(!row || !row.group_id) return;
          var myP = (d.getProfile && d.getProfile());
          var myUid = myP ? myP.id : null;
          var isTargetLeader = (row.receiver_id === myUid) || (!row.receiver_id && d.canManage && d.canManage(row.group_id));
          if(myUid && isTargetLeader && row.sender_id !== myUid){
            if(d.toast) d.toast(row.sender_name + '님에게서 새 찌르기가 도착했습니다! 👑');
            if(d.haptic) d.haptic('success');
          }
          var list = TEAM_PINGS_CACHE[row.group_id];
          if(list && !list.find(function(x){ return x.id === row.id; })){
            list.unshift(row);
          }
          if(d.getGroupState){
            var gs = d.getGroupState(row.group_id);
            if(gs){
              gs.memberPings = gs.memberPings || [];
              if(!gs.memberPings.find(function(x){ return x.id === row.id; })){
                gs.memberPings.unshift({
                  id: row.id,
                  gid: row.group_id,
                  senderId: row.sender_id,
                  senderName: row.sender_name,
                  receiverId: row.receiver_id,
                  pingType: row.ping_type,
                  targetType: row.target_type,
                  targetId: row.target_id,
                  targetTitle: row.target_title,
                  message: row.message,
                  status: row.status,
                  createdAt: row.created_at,
                  replies: []
                });
              }
            }
          }
          if(d.onRefresh) d.onRefresh();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_ping_replies' }, function(payload){
          var row = payload.new;
          if(!row || !row.ping_id) return;
          var myP = (d.getProfile && d.getProfile());
          var myUid = myP ? myP.id : null;
          if(myUid && row.receiver_id === myUid){
            if(d.toast) d.toast(row.sender_name + '님이 1:1 DM 답장을 보냈습니다! 💬');
            if(d.haptic) d.haptic('success');
          }
          if(d.getGroupState){
            var gs = d.getGroupState(row.group_id);
            if(gs && gs.memberPings){
              var targetPing = gs.memberPings.find(function(p){ return p.id === row.ping_id; });
              if(targetPing){
                targetPing.replies = targetPing.replies || [];
                if(!targetPing.replies.find(function(r){ return r.id === row.id; })){
                  targetPing.replies.push({
                    id: row.id,
                    senderId: row.sender_id,
                    senderName: row.sender_name,
                    receiverId: row.receiver_id,
                    message: row.message,
                    createdAt: row.created_at
                  });
                  targetPing.status = 'replied';
                }
              }
            }
          }
          if(typeof window !== 'undefined' && window.dispatchEvent){
            try {
              window.dispatchEvent(new CustomEvent('ourgoal:team_ping_reply_received', { detail: { pingId: row.ping_id, reply: row } }));
            } catch(_e){}
          }
          if(d.onRefresh) d.onRefresh();
        })
        .subscribe();
    } catch(e){}
  }

  function calcGroupMembersProgress(gid, mockGroups, getGroupState, getProfile, getLevelGoals){
    var g = (mockGroups || []).find(function(x){ return x.id === gid; });
    if(!g) return { members: [], summary: { total: 0, doneToday: 0, rate: 0, avgProgress: 0, needCare: 0 } };

    var gs = (typeof getGroupState === 'function') ? getGroupState(gid) : {};
    gs.leaderStamps = gs.leaderStamps || {};
    gs.nudges = gs.nudges || {};
    gs.leaderFeedback = gs.leaderFeedback || {};
    gs.memberPings = gs.memberPings || [];

    var roster = g.roster || [];
    var verifs = g.verifications || [];
    var lgs = (typeof getLevelGoals === 'function') ? (getLevelGoals(gid) || []) : [];

    var members = roster.map(function(r, idx){
      var v = verifs.find(function(item){ return item.userName === r.n; });
      var isToday = v && (v.time.indexOf('오늘') !== -1 || v.time.indexOf('07:') !== -1 || v.time.indexOf('08:') !== -1);
      var lg = lgs[idx % (lgs.length || 1)];
      var lgName = lg ? lg.name : '';
      var progress = Math.min(100, Math.max(15, Math.round(((r.c || 1) / ((g.weeklyTarget / (g.members || 5)) || 5)) * 100)));
      var streak = Math.max(1, Math.round((r.c || 1) * 0.6));
      var stamp = gs.leaderStamps[r.n] || null;
      var feedbackList = gs.leaderFeedback[r.n] || [];
      var lastNudge = gs.nudges[r.n] || null;

      return {
        id: 'mem_' + gid + '_' + idx,
        name: r.n,
        role: (g.ownerName === r.n) ? 'owner' : 'member',
        avatar: (v && v.userAvatar) ? v.userAvatar : (idx % 2 === 0 ? '🏃‍♂️' : '🏃‍♀️'),
        levelGroup: lgName,
        weeklyCount: r.c || 0,
        todayCheckedIn: !!isToday,
        todayTime: isToday ? v.time : null,
        photoUrl: (v && v.photoUrl) ? v.photoUrl : null,
        note: (v && v.note) ? v.note : null,
        progressPct: progress,
        streak: streak,
        stamp: stamp,
        feedback: feedbackList,
        lastNudge: lastNudge
      };
    });

    var p = (typeof getProfile === 'function') ? getProfile() : null;
    var myName = (p && p.displayName) || '나';
    if(!members.some(function(m){ return m.name === myName; })){
      var myRole = gs.myRole || 'member';
      var myProgress = (g.teamGoals && g.teamGoals[0])
        ? Math.round((g.teamGoals[0].milestones.filter(function(m){ return m.status === 'done'; }).length / (g.teamGoals[0].milestones.length || 1)) * 100)
        : 65;
      members.unshift({
        id: 'mem_' + gid + '_me',
        name: myName,
        role: myRole,
        avatar: (p && p.avatar) || '😎',
        levelGroup: lgs.length ? lgs[0].name : '',
        weeklyCount: 5,
        todayCheckedIn: true,
        todayTime: '오늘 09:15',
        photoUrl: null,
        note: '오늘 목표 루틴 완벽 완수!',
        progressPct: myProgress,
        streak: (p && p.streak) || 7,
        stamp: gs.leaderStamps[myName] || null,
        feedback: gs.leaderFeedback[myName] || [],
        lastNudge: null,
        isMe: true
      });
    }

    var total = members.length;
    var doneToday = members.filter(function(m){ return m.todayCheckedIn; }).length;
    var rate = total ? Math.round(doneToday / total * 100) : 0;
    var avgProgress = total ? Math.round(members.reduce(function(acc, m){ return acc + m.progressPct; }, 0) / total) : 0;
    var needCare = members.filter(function(m){ return !m.todayCheckedIn && m.progressPct < 50; }).length;

    return {
      members: members,
      summary: { total: total, doneToday: doneToday, rate: rate, avgProgress: avgProgress, needCare: needCare }
    };
  }

  function renderMemberPingButtonHtml(gid, targetType, targetId, title, isDone){
    var pingType = isDone ? 'boast' : 'struggle';
    var pDef = PING_TYPES[pingType];
    var safeTitle = esc(title || '');
    return '<button class="btn btn-ghost btn-sm tg-ping-btn" type="button" ' +
      'data-openping="' + esc(gid) + ':' + esc(targetType) + ':' + esc(targetId) + ':' + (isDone ? '1' : '0') + '" ' +
      'data-targettitle="' + safeTitle + '" ' +
      'style="font-size:.75rem;padding:2px 7px;border-radius:6px;border:1px solid ' + (isDone ? 'var(--gold)' : 'var(--red-line)') + ';' +
      'background:' + (isDone ? 'var(--gold-soft)' : 'var(--red-soft)') + ';' +
      'color:' + (isDone ? 'var(--gold)' : 'var(--brand-strong)') + ';font-weight:700;display:inline-flex;align-items:center;gap:3px;flex:0 0 auto;" ' +
      'title="' + (isDone ? '모임장에게 달성자랑 찌르기' : '모임장에게 힘들어요 찌르기') + '">' +
      pDef.icon + ' ' + (isDone ? '달성자랑' : '힘들어요') +
    '</button>';
  }

  function renderLeaderPingsSectionHtml(g, deps){
    var gs = (typeof deps.getGroupState === 'function') ? deps.getGroupState(g.id) : {};
    var pings = gs.memberPings || [];
    if(!pings.length) return '';

    var pingsListHtml = pings.slice().reverse().map(function(p){
      var pDef = PING_TYPES[p.pingType] || PING_TYPES.boast;
      var replyCount = (p.replies || []).length;
      var replyBadge = replyCount > 0
        ? '<span style="font-size:.6875rem;color:var(--sage);background:var(--sage-soft);padding:1px 6px;border-radius:4px;font-weight:700;">대화 ' + replyCount + '건 ✓</span>'
        : '<span style="font-size:.6875rem;color:var(--brand-strong);background:var(--red-soft);padding:1px 6px;border-radius:4px;font-weight:700;">미답변 ⏳</span>';

      return '<div style="background:var(--card);border:1px solid var(--rule);border-radius:10px;padding:9px 11px;margin-bottom:6px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;gap:6px;">' +
          '<div style="display:flex;align-items:center;gap:6px;min-width:0;">' +
            '<span style="font-size:1.1rem;">' + (p.senderAvatar || '🏃') + '</span>' +
            '<b style="font-size:.875rem;color:var(--ink);">' + esc(p.senderName) + '</b>' +
            '<span style="font-size:.6875rem;font-weight:700;color:' + pDef.badgeColor + ';background:' + pDef.badgeBg + ';padding:1px 6px;border-radius:4px;">' + pDef.icon + ' ' + pDef.badgeText + '</span>' +
          '</div>' +
          replyBadge +
        '</div>' +
        '<div class="faint" style="font-size:.75rem;margin-bottom:4px;">' +
          '📌 ' + (p.targetType === 'teamgoal' ? '팀 목표' : (p.targetType === 'task' ? '세부할일' : '마일스톤')) + ': <b>' + esc(p.targetTitle) + '</b>' +
        '</div>' +
        '<div style="font-size:.8125rem;color:var(--ink);background:var(--card2);padding:6px 9px;border-radius:6px;line-height:1.4;margin-bottom:6px;">' +
          '💬 "' + esc(p.message) + '"' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<span class="faint" style="font-size:.6875rem;">' + (p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '') + '</span>' +
          '<button class="btn btn-primary btn-sm" data-openleaderdm="' + esc(g.id) + ':' + esc(p.id) + '" type="button" style="font-size:.75rem;padding:3px 9px;font-weight:700;">' +
            (replyCount > 0 ? '💬 대화 이어하기 (' + replyCount + ')' : '💬 1:1 DM 반응하기') +
          '</button>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--rule);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<span style="font-size:1rem;">📩</span>' +
          '<b style="font-size:.875rem;color:var(--ink);">팀원 찌르기 알림</b>' +
          '<span class="tag" style="font-size:.6875rem;background:var(--gold-soft);color:var(--gold);font-weight:700;">' + pings.length + '건</span>' +
        '</div>' +
      '</div>' +
      '<div style="max-height:220px;overflow-y:auto;padding-right:2px;">' +
        pingsListHtml +
      '</div>' +
    '</div>';
  }

  function renderLeaderDashboardHtml(g, deps){
    var progressData = calcGroupMembersProgress(g.id, deps.mockGroups, deps.getGroupState, deps.getProfile, deps.getLevelGoals);
    var summary = progressData.summary;
    var filter = deps.currentMemberFilter || activeFilter || 'all';

    var filteredMembers = progressData.members.filter(function(m){
      if(filter === 'done') return m.todayCheckedIn;
      if(filter === 'pending') return !m.todayCheckedIn;
      if(filter === 'care') return !m.todayCheckedIn && m.progressPct < 50;
      return true;
    });

    var memberRowsHtml = filteredMembers.map(function(m){
      var todayBadge = m.todayCheckedIn
        ? '<span style="font-size:.75rem;font-weight:700;color:var(--sage);background:var(--sage-soft);padding:2px 7px;border-radius:6px;">오늘 완료 ✓</span>'
        : '<span style="font-size:.75rem;font-weight:700;color:var(--brand-strong);background:var(--red-soft);padding:2px 7px;border-radius:6px;">미인증 ⏳</span>';

      var stampBtnHtml = m.todayCheckedIn
        ? (m.stamp
            ? '<button class="btn btn-ghost btn-sm" data-stampmember="'+g.id+':'+esc(m.name)+'" type="button" style="padding:2px 8px;font-size:.75rem;color:var(--gold);border-color:var(--gold-soft);font-weight:700;">'+m.stamp.icon+' '+esc(m.stamp.label)+'</button>'
            : '<button class="btn btn-ghost btn-sm" data-stampmember="'+g.id+':'+esc(m.name)+'" type="button" style="padding:2px 8px;font-size:.75rem;color:var(--ink-soft);border-color:var(--rule);">👑 도장 찍기</button>')
        : '<button class="btn btn-ghost btn-sm" data-nudgemember="'+g.id+':'+esc(m.name)+'" type="button" style="padding:2px 8px;font-size:.75rem;color:var(--brand-strong);border-color:var(--red-line);">👉 콕 찌르기</button>';

      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:10px;background:var(--card);border:1px solid var(--rule);margin-bottom:6px;gap:8px;">' +
        '<div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1;">' +
          '<span style="font-size:1.3rem;">'+m.avatar+'</span>' +
          '<div style="min-width:0;flex:1;">' +
            '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
              '<span style="font-weight:700;font-size:.875rem;color:var(--ink);">'+esc(m.name)+'</span>' +
              (m.levelGroup ? '<span class="faint" style="font-size:.6875rem;background:var(--card2);padding:1px 5px;border-radius:4px;">'+esc(m.levelGroup)+'</span>' : '') +
              todayBadge +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;margin-top:3px;">' +
              '<div class="group-bar" style="flex:1;height:4px;"><span style="width:'+m.progressPct+'%;"></span></div>' +
              '<span class="faint" style="font-size:.6875rem;flex:0 0 auto;">'+m.progressPct+'%</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;flex:0 0 auto;">' +
          stampBtnHtml +
          '<button class="btn btn-ghost btn-sm" data-detailmember="'+g.id+':'+esc(m.name)+'" type="button" style="padding:2px 6px;font-size:.75rem;color:var(--ink-soft);" title="상세보기">></button>' +
        '</div>' +
      '</div>';
    }).join('');

    var pingsSectionHtml = renderLeaderPingsSectionHtml(g, deps);

    return '<div style="margin-top:10px;margin-bottom:14px;padding:12px;border-radius:12px;background:var(--card2);border:1.5px solid var(--rule);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<span style="font-size:1.1rem;">📊</span>' +
          '<b style="font-size:.9375rem;color:var(--ink);">팀원 목표달성도 점검</b>' +
          '<span class="tag" style="font-size:.6875rem;background:var(--sage-soft);color:var(--sage);">모임장 전용</span>' +
        '</div>' +
        '<span class="faint" style="font-size:.75rem;">오늘 완료율 '+summary.rate+'%</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:6px;margin-bottom:10px;text-align:center;">' +
        '<div style="background:var(--card);padding:6px 4px;border-radius:8px;border:1px solid var(--rule);">' +
          '<div class="faint" style="font-size:.6875rem;">전체 팀원</div>' +
          '<div style="font-weight:700;font-size:.9375rem;color:var(--ink);margin-top:2px;">'+summary.total+'명</div>' +
        '</div>' +
        '<div style="background:var(--card);padding:6px 4px;border-radius:8px;border:1px solid var(--rule);">' +
          '<div class="faint" style="font-size:.6875rem;">오늘 완료</div>' +
          '<div style="font-weight:700;font-size:.9375rem;color:var(--sage);margin-top:2px;">'+summary.doneToday+'명</div>' +
        '</div>' +
        '<div style="background:var(--card);padding:6px 4px;border-radius:8px;border:1px solid var(--rule);">' +
          '<div class="faint" style="font-size:.6875rem;">평균 달성</div>' +
          '<div style="font-weight:700;font-size:.9375rem;color:var(--brand-strong);margin-top:2px;">'+summary.avgProgress+'%</div>' +
        '</div>' +
        '<div style="background:var(--card);padding:6px 4px;border-radius:8px;border:1px solid var(--rule);">' +
          '<div class="faint" style="font-size:.6875rem;">집중 케어</div>' +
          '<div style="font-weight:700;font-size:.9375rem;color:var(--gold);margin-top:2px;">'+summary.needCare+'명</div>' +
        '</div>' +
      '</div>' +
      '<div class="goal-chip-row" style="margin-bottom:8px;gap:4px;">' +
        '<button class="goal-chip'+(filter==='all'?' active':'')+'" data-tgmemfilter="all" type="button" style="font-size:.75rem;padding:3px 8px;">전체 ('+summary.total+')</button>' +
        '<button class="goal-chip'+(filter==='done'?' active':'')+'" data-tgmemfilter="done" type="button" style="font-size:.75rem;padding:3px 8px;">오늘 완료 ('+summary.doneToday+')</button>' +
        '<button class="goal-chip'+(filter==='pending'?' active':'')+'" data-tgmemfilter="pending" type="button" style="font-size:.75rem;padding:3px 8px;">미인증 ('+(summary.total - summary.doneToday)+')</button>' +
        '<button class="goal-chip'+(filter==='care'?' active':'')+'" data-tgmemfilter="care" type="button" style="font-size:.75rem;padding:3px 8px;">집중 케어 ('+summary.needCare+')</button>' +
      '</div>' +
      '<div style="max-height:260px;overflow-y:auto;padding-right:2px;">' +
        (memberRowsHtml || '<p class="faint" style="font-size:.8125rem;text-align:center;padding:12px 0;">해당 조건의 팀원이 없습니다.</p>') +
      '</div>' +
      pingsSectionHtml +
    '</div>';
  }

  function renderMemberDmNotificationBannerHtml(g, deps){
    var gs = (typeof deps.getGroupState === 'function') ? deps.getGroupState(g.id) : {};
    var p = (typeof deps.getProfile === 'function') ? deps.getProfile() : null;
    var myName = (p && p.displayName) || '나';
    var pings = (gs.memberPings || []).filter(function(item){
      return (item.senderName === myName || item.senderName === '나') && (item.replies && item.replies.length > 0);
    });
    if(!pings.length) return '';

    var lastPing = pings[pings.length - 1];
    var lastReply = lastPing.replies[lastPing.replies.length - 1];
    var pDef = PING_TYPES[lastPing.pingType] || PING_TYPES.boast;

    return '<div style="margin-top:8px;margin-bottom:12px;padding:10px 12px;border-radius:10px;background:var(--card2);border:1.5px solid var(--brand-strong);display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
      '<div style="min-width:0;flex:1;">' +
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
          '<span style="font-size:1.1rem;">💬</span>' +
          '<b style="font-size:.875rem;color:var(--ink);">모임장님의 DM 답장이 도착했어요!</b>' +
          '<span style="font-size:.6875rem;font-weight:700;color:'+pDef.badgeColor+';background:'+pDef.badgeBg+';padding:1px 5px;border-radius:4px;">'+pDef.icon+' '+pDef.badgeText+'</span>' +
        '</div>' +
        '<div class="faint" style="font-size:.75rem;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
          '👑 "' + esc(lastReply.message) + '"' +
        '</div>' +
      '</div>' +
      '<button class="btn btn-primary btn-sm" data-openleaderdm="' + esc(g.id) + ':' + esc(lastPing.id) + '" type="button" style="font-size:.75rem;padding:4px 10px;font-weight:700;flex:0 0 auto;">대화 보기</button>' +
    '</div>';
  }

  function renderMemberFeedbackBannerHtml(g, deps){
    var progressData = calcGroupMembersProgress(g.id, deps.mockGroups, deps.getGroupState, deps.getProfile, deps.getLevelGoals);
    var p = (typeof deps.getProfile === 'function') ? deps.getProfile() : null;
    var myName = (p && p.displayName) || '나';
    var myItem = progressData.members.find(function(m){ return m.name === myName || m.isMe; });

    var stampBanner = '';
    if(myItem && myItem.stamp){
      stampBanner = '<div style="margin-top:10px;margin-bottom:12px;padding:10px 12px;border-radius:10px;background:var(--gold-soft);border:1px solid var(--gold);display:flex;align-items:center;gap:10px;">' +
        '<span style="font-size:1.5rem;">'+myItem.stamp.icon+'</span>' +
        '<div style="flex:1;">' +
          '<div style="font-weight:700;font-size:.875rem;color:var(--ink);">모임장 확인 도장 ['+esc(myItem.stamp.label)+']을 받았어요!</div>' +
          '<div class="faint" style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">모임장님이 오늘 내 인증을 확인하고 응원을 남겼습니다.</div>' +
        '</div>' +
      '</div>';
    }

    var dmBanner = renderMemberDmNotificationBannerHtml(g, deps);
    return stampBanner + dmBanner;
  }

  function openLeaderStampSelectModal(gid, memberName, deps){
    var gs = deps.getGroupState(gid);
    gs.leaderStamps = gs.leaderStamps || {};
    var currentStamp = gs.leaderStamps[memberName] || null;

    var stampsHtml = Object.keys(LEADER_STAMPS).map(function(key){
      var s = LEADER_STAMPS[key];
      var isSelected = currentStamp && currentStamp.type === key;
      return '<button class="btn btn-ghost" data-selectstamp="'+key+'" type="button" style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;border:1.5px solid '+(isSelected?'var(--brand-strong)':'var(--rule)')+';background:'+(isSelected?'var(--card2)':'var(--card)')+';text-align:left;width:100%;">' +
        '<span style="font-size:1.6rem;">'+s.icon+'</span>' +
        '<div style="flex:1;">' +
          '<div style="font-weight:700;font-size:.9375rem;color:var(--ink);">'+s.label+'</div>' +
          '<div class="faint" style="font-size:.75rem;margin-top:2px;">팀원의 오늘 기록에 격려와 인정을 전합니다</div>' +
        '</div>' +
        (isSelected ? '<span style="color:var(--brand-strong);font-weight:700;">✓ 선택됨</span>' : '') +
      '</button>';
    }).join('');

    deps.openModal(
      '<h3>👑 확인 도장 찍기</h3>' +
      '<p class="faint" style="font-size:.875rem;margin:4px 0 14px;"><b>'+esc(memberName)+'</b>님의 오늘 체크인 기록을 확인하고 도장을 찍어주세요.</p>' +
      '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">' + stampsHtml + '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost" id="closeStampModalBtn" type="button">닫기</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#closeStampModalBtn').addEventListener('click', deps.closeModal);
        sheet.querySelectorAll('[data-selectstamp]').forEach(function(btn){
          btn.addEventListener('click', async function(){
            var stampKey = btn.dataset.selectstamp;
            var stampObj = LEADER_STAMPS[stampKey];
            gs.leaderStamps[memberName] = {
              type: stampKey,
              label: stampObj.label,
              icon: stampObj.icon,
              stampedAt: new Date().toISOString()
            };
            await deps.saveProfile();
            if(deps.haptic) deps.haptic('success');
            deps.toast('"' + memberName + '"님에게 ' + stampObj.icon + ' ' + stampObj.label + ' 도장을 찍었어요!');
            deps.closeModal();
            if(deps.onRefresh) deps.onRefresh();
          });
        });
      }
    );
  }

  function openMemberProgressDetailModal(gid, memberName, deps){
    var progressData = calcGroupMembersProgress(gid, deps.mockGroups, deps.getGroupState, deps.getProfile, deps.getLevelGoals);
    var m = progressData.members.find(function(item){ return item.name === memberName; });
    if(!m) return;
    var gs = deps.getGroupState(gid);
    var canManage = deps.canManage(gid);

    var stampInfo = m.stamp ?
      '<div style="display:inline-flex;align-items:center;gap:6px;background:var(--card2);padding:4px 10px;border-radius:999px;border:1px solid var(--rule);font-size:.8125rem;font-weight:700;color:var(--ink);">' +
        '<span>'+m.stamp.icon+'</span> <span>모임장 확인 도장: '+esc(m.stamp.label)+'</span>' +
      '</div>' :
      '<span class="faint" style="font-size:.8125rem;">아직 모임장 확인 도장이 없습니다</span>';

    var photoHtml = m.photoUrl ?
      '<div style="margin:10px 0;border-radius:12px;overflow:hidden;border:1px solid var(--rule);max-height:220px;">' +
        '<img src="'+m.photoUrl+'" alt="인증사진" style="width:100%;height:auto;display:block;object-fit:cover;">' +
      '</div>' : '';

    var noteHtml = m.note ?
      '<div style="background:var(--card2);padding:10px 12px;border-radius:10px;border:1px solid var(--rule);font-size:.875rem;color:var(--ink);margin:8px 0;line-height:1.5;">' +
        '💬 "' + esc(m.note) + '"' +
      '</div>' : '<p class="faint" style="font-size:.8125rem;margin:6px 0;">작성된 인증 일지가 없습니다.</p>';

    var feedbackListHtml = (m.feedback && m.feedback.length) ?
      m.feedback.map(function(fb){
        return '<div style="background:var(--card2);border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:.8125rem;">' +
          '<div style="display:flex;justify-content:space-between;color:var(--ink-soft);font-size:.75rem;margin-bottom:2px;">' +
            '<b>👑 모임장 피드백</b> <span>'+new Date(fb.createdAt).toLocaleDateString()+'</span>' +
          '</div>' +
          '<div style="color:var(--ink);">'+esc(fb.message)+'</div>' +
        '</div>';
      }).join('') : '<p class="faint" style="font-size:.8125rem;">아직 모임장 피드백이 없습니다.</p>';

    var manageActionsHtml = canManage ?
      '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--rule);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
          '<b style="font-size:.875rem;color:var(--ink);">👑 모임장 체크 액션</b>' +
          '<button class="btn btn-primary btn-sm" id="btnStampInDetail" type="button" style="font-size:.8125rem;padding:4px 10px;">' +
            (m.stamp ? '도장 변경' : '확인 도장 찍기') +
          '</button>' +
        '</div>' +
        '<div style="display:flex;gap:6px;margin-top:8px;">' +
          '<input id="leaderFbInput" type="text" placeholder="팀원에게 격려와 피드백을 남겨보세요" style="flex:1;padding:8px 10px;border-radius:8px;border:1px solid var(--rule);background:var(--card);color:var(--ink);font-size:.875rem;">' +
          '<button class="btn btn-ghost btn-sm" id="sendLeaderFbBtn" type="button" style="flex:0 0 auto;font-weight:700;">전송</button>' +
        '</div>' +
      '</div>' : '';

    deps.openModal(
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' +
        '<span style="font-size:2rem;">'+m.avatar+'</span>' +
        '<div style="flex:1;min-width:0;">' +
          '<h3 style="margin:0;font-size:1.125rem;">'+esc(m.name)+(m.levelGroup ? ' <span class="faint" style="font-size:.8125rem;font-weight:normal;">('+esc(m.levelGroup)+')</span>' : '')+'</h3>' +
          '<div style="display:flex;align-items:center;gap:6px;margin-top:2px;">' +
            '<span class="streak-pill" style="font-size:.6875rem;">🔥 '+m.streak+'일 연속</span>' +
            '<span class="faint" style="font-size:.8125rem;">목표 진행률 '+m.progressPct+'%</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:12px;">' + stampInfo + '</div>' +
      '<div style="margin-bottom:12px;">' +
        '<b style="font-size:.875rem;color:var(--ink-soft);">📸 오늘 인증 및 일지</b>' +
        photoHtml +
        noteHtml +
      '</div>' +
      '<div style="margin-bottom:12px;">' +
        '<b style="font-size:.875rem;color:var(--ink-soft);">💬 모임장 피드백 내역</b>' +
        '<div style="margin-top:6px;">' + feedbackListHtml + '</div>' +
      '</div>' +
      manageActionsHtml +
      '<div class="modal-actions" style="margin-top:14px;">' +
        '<button class="btn btn-block btn-ghost" id="closeDetailModalBtn" type="button">닫기</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#closeDetailModalBtn').addEventListener('click', deps.closeModal);
        var stampBtn = sheet.querySelector('#btnStampInDetail');
        if(stampBtn){
          stampBtn.addEventListener('click', function(){
            deps.closeModal();
            openLeaderStampSelectModal(gid, memberName, deps);
          });
        }
        var sendFbBtn = sheet.querySelector('#sendLeaderFbBtn');
        if(sendFbBtn){
          sendFbBtn.addEventListener('click', async function(){
            var inp = sheet.querySelector('#leaderFbInput');
            var msg = (inp && inp.value.trim()) || '';
            if(!msg) return;
            gs.leaderFeedback = gs.leaderFeedback || {};
            gs.leaderFeedback[memberName] = gs.leaderFeedback[memberName] || [];
            gs.leaderFeedback[memberName].push({
              message: msg,
              createdAt: new Date().toISOString()
            });
            await deps.saveProfile();
            deps.toast('"' + memberName + '"님에게 피드백을 전달했어요!');
            deps.closeModal();
            if(deps.onRefresh) deps.onRefresh();
          });
        }
      }
    );
  }

  function openSendPingModal(gid, targetType, targetId, title, isDone, deps){
    var gs = deps.getGroupState(gid);
    var p = (typeof deps.getProfile === 'function') ? deps.getProfile() : null;
    var myName = (p && p.displayName) || '나';
    var myAvatar = (p && p.avatar) || '😎';

    var selectedType = isDone ? 'boast' : 'struggle';

    function renderModalBody(){
      var bDef = PING_TYPES.boast;
      var sDef = PING_TYPES.struggle;
      var activeDef = PING_TYPES[selectedType];

      var typeButtonsHtml =
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">' +
          '<button class="btn btn-ghost" id="btnSelectBoast" type="button" style="padding:10px 8px;border-radius:10px;border:1.5px solid '+(selectedType==='boast'?'var(--gold)':'var(--rule)')+';background:'+(selectedType==='boast'?'var(--gold-soft)':'var(--card)')+';color:'+(selectedType==='boast'?'var(--gold)':'var(--ink)')+';font-weight:700;font-size:.875rem;">' +
            bDef.icon + ' ' + bDef.label +
          '</button>' +
          '<button class="btn btn-ghost" id="btnSelectStruggle" type="button" style="padding:10px 8px;border-radius:10px;border:1.5px solid '+(selectedType==='struggle'?'var(--brand-strong)':'var(--rule)')+';background:'+(selectedType==='struggle'?'var(--red-soft)':'var(--card)')+';color:'+(selectedType==='struggle'?'var(--brand-strong)':'var(--ink)')+';font-weight:700;font-size:.875rem;">' +
            sDef.icon + ' ' + sDef.label +
          '</button>' +
        '</div>';

      var templatesHtml = activeDef.templates.map(function(tmpl, idx){
        return '<button class="btn btn-ghost btn-sm tg-tmpl-chip" data-tmplidx="'+idx+'" type="button" style="font-size:.75rem;padding:4px 8px;border-radius:6px;border:1px solid var(--rule);background:var(--card);text-align:left;white-space:normal;line-height:1.3;color:var(--ink-soft);">' +
          esc(tmpl) +
        '</button>';
      }).join('');

      return '<h3>' + activeDef.icon + ' 모임장에게 찌르기</h3>' +
        '<div style="background:var(--card2);padding:8px 10px;border-radius:8px;border:1px solid var(--rule);margin:8px 0 12px;font-size:.8125rem;">' +
          '📌 ' + (targetType === 'teamgoal' ? '팀 목표' : (targetType === 'task' ? '세부할일' : '마일스톤')) + ': <b style="color:var(--ink);">' + esc(title) + '</b>' +
        '</div>' +
        typeButtonsHtml +
        '<p class="faint" style="font-size:.75rem;margin-bottom:8px;">' + esc(activeDef.desc) + '</p>' +
        '<div style="margin-bottom:8px;"><b style="font-size:.8125rem;color:var(--ink);">추천 메시지 템플릿</b></div>' +
        '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:12px;">' + templatesHtml + '</div>' +
        '<div style="margin-bottom:14px;">' +
          '<label for="pingMsgInput" style="display:block;font-size:.8125rem;font-weight:700;margin-bottom:4px;color:var(--ink);">모임장님께 보낼 한 줄 메시지</label>' +
          '<input id="pingMsgInput" type="text" value="' + esc(activeDef.templates[0]) + '" placeholder="메시지를 입력해주세요" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid var(--rule);background:var(--card);color:var(--ink);font-size:.875rem;box-sizing:border-box;">' +
        '</div>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-ghost" id="cancelPingBtn" type="button">취소</button>' +
          '<button class="btn btn-primary" id="sendPingBtn" type="button" style="font-weight:700;">모임장에게 전송</button>' +
        '</div>';
    }

    deps.openModal(renderModalBody(), function(sheet){
      function setupListeners(){
        sheet.querySelector('#cancelPingBtn').addEventListener('click', deps.closeModal);

        var btnB = sheet.querySelector('#btnSelectBoast');
        var btnS = sheet.querySelector('#btnSelectStruggle');
        if(btnB){
          btnB.addEventListener('click', function(){
            selectedType = 'boast';
            sheet.innerHTML = renderModalBody();
            setupListeners();
          });
        }
        if(btnS){
          btnS.addEventListener('click', function(){
            selectedType = 'struggle';
            sheet.innerHTML = renderModalBody();
            setupListeners();
          });
        }

        sheet.querySelectorAll('.tg-tmpl-chip').forEach(function(chip){
          chip.addEventListener('click', function(){
            var idx = parseInt(chip.dataset.tmplidx, 10);
            var activeDef = PING_TYPES[selectedType];
            var inp = sheet.querySelector('#pingMsgInput');
            if(inp && activeDef.templates[idx]){
              inp.value = activeDef.templates[idx];
            }
          });
        });

        var sendBtn = sheet.querySelector('#sendPingBtn');
        if(sendBtn){
          sendBtn.addEventListener('click', async function(){
            var inp = sheet.querySelector('#pingMsgInput');
            var msg = (inp && inp.value.trim()) || PING_TYPES[selectedType].templates[0];

            gs.memberPings = gs.memberPings || [];
            var myUid = (p && p.id) || ('guest_' + Math.random().toString(36).substr(2, 9));
            var groupObj = (deps.mockGroups || []).find(function(x){ return x.id === gid; });
            var leaderId = (groupObj && groupObj.ownerId) || (gs.ownerId) || '';

            var newPing = {
              id: 'ping_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              gid: gid,
              senderId: myUid,
              senderName: myName,
              senderAvatar: myAvatar,
              receiverId: leaderId,
              pingType: selectedType,
              targetType: targetType,
              targetId: targetId,
              targetTitle: title,
              message: msg,
              createdAt: new Date().toISOString(),
              status: 'sent',
              replies: []
            };
            gs.memberPings.push(newPing);
            await deps.saveProfile();
            await dispatchPingToDb(newPing, deps);

            if(deps.haptic) deps.haptic('success');
            var pDef = PING_TYPES[selectedType];
            deps.toast('모임장님에게 ' + pDef.icon + ' ' + pDef.label + '를 보냈어요!');
            deps.closeModal();
            if(deps.onRefresh) deps.onRefresh();
          });
        }
      }
      setupListeners();
    });
  }

  function openLeaderMemberDmModal(gid, pingId, deps){
    var gs = deps.getGroupState(gid);
    var pings = gs.memberPings || [];
    var ping = pings.find(function(x){ return x.id === pingId; });
    if(!ping) return;

    var p = (typeof deps.getProfile === 'function') ? deps.getProfile() : null;
    var myName = (p && p.displayName) || '나';
    var myAvatar = (p && p.avatar) || '😎';
    var canManage = deps.canManage(gid);
    var myRole = canManage ? 'owner' : 'member';

    var pDef = PING_TYPES[ping.pingType] || PING_TYPES.boast;

    function renderDmModalHtml(){
      var repliesHtml = (ping.replies || []).map(function(rep){
        var isMe = rep.senderName === myName;
        var roleTag = rep.senderRole === 'owner'
          ? '<span style="font-size:.6875rem;background:var(--sage-soft);color:var(--sage);padding:1px 5px;border-radius:4px;font-weight:700;">모임장</span>'
          : '<span style="font-size:.6875rem;background:var(--card2);color:var(--ink-soft);padding:1px 5px;border-radius:4px;">팀원</span>';

        return '<div style="display:flex;flex-direction:column;align-items:'+(isMe?'flex-end':'flex-start')+';margin-bottom:8px;">' +
          '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;font-size:.75rem;color:var(--ink-soft);">' +
            (isMe ? '' : '<span>'+(rep.senderAvatar || '🏃')+'</span>') +
            '<b>'+esc(rep.senderName)+'</b> ' + roleTag +
            (isMe ? '<span>'+(rep.senderAvatar || '🏃')+'</span>' : '') +
          '</div>' +
          '<div style="max-width:85%;padding:8px 12px;border-radius:12px;font-size:.875rem;line-height:1.4;background:'+(isMe?'var(--brand-strong)':'var(--card2)')+';color:'+(isMe?'#fff':'var(--ink)')+';border:'+(isMe?'none':'1px solid var(--rule)')+';word-break:break-word;">' +
            esc(rep.message) +
          '</div>' +
          '<span class="faint" style="font-size:.6875rem;margin-top:2px;">' +
            (rep.createdAt ? new Date(rep.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '') +
          '</span>' +
        '</div>';
      }).join('');

      var quickReplies = canManage ? [
        '너무 멋져요! 최고입니다 🎉',
        '조금만 더 힘내봐요! 항상 응원해요 💪',
        '어려운 점은 언제든 편하게 질문해주세요 😊',
        '이 부분은 오늘 저녁에 같이 살펴봐요!'
      ] : [
        '응원 감사드립니다! 끝까지 해볼게요 🔥',
        '조언해주신 방법으로 다시 도전해볼게요!',
        '감사합니다! 바로 반영하겠습니다 ✨'
      ];

      var quickRepliesHtml = quickReplies.map(function(qr, idx){
        return '<button class="btn btn-ghost btn-sm tg-dm-quick-chip" data-qridx="'+idx+'" type="button" style="font-size:.6875rem;padding:2px 7px;border-radius:6px;border:1px solid var(--rule);background:var(--card);color:var(--ink-soft);flex:0 0 auto;">' +
          esc(qr) +
        '</button>';
      }).join('');

      return '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<span style="font-size:1.2rem;">💬</span>' +
          '<h3 style="margin:0;font-size:1rem;color:var(--ink);">1:1 DM 대화</h3>' +
          '<span style="font-size:.6875rem;font-weight:700;color:'+pDef.badgeColor+';background:'+pDef.badgeBg+';padding:1px 6px;border-radius:4px;">'+pDef.icon+' '+pDef.badgeText+'</span>' +
        '</div>' +
        '<span class="faint" style="font-size:.75rem;">' + esc(ping.senderName) + ' 님과의 대화</span>' +
      '</div>' +
      '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:10px;padding:8px 10px;margin-bottom:10px;font-size:.8125rem;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">' +
          '<span class="faint">📌 ' + (ping.targetType === 'teamgoal' ? '팀 목표' : (ping.targetType === 'task' ? '세부할일' : '마일스톤')) + ': <b>' + esc(ping.targetTitle) + '</b></span>' +
          '<span class="faint" style="font-size:.6875rem;">' + (ping.createdAt ? new Date(ping.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '') + '</span>' +
        '</div>' +
        '<div style="font-weight:700;color:var(--ink);">' + (ping.senderAvatar || '🏃') + ' ' + esc(ping.senderName) + ': "' + esc(ping.message) + '"</div>' +
      '</div>' +
      '<div id="dmTimelineBox" style="max-height:220px;min-height:100px;overflow-y:auto;padding:6px 2px;margin-bottom:8px;border-bottom:1px solid var(--rule);">' +
        (repliesHtml || '<p class="faint" style="font-size:.8125rem;text-align:center;padding:16px 0;">아직 대화 내역이 없습니다. 첫 답장을 보내보세요!</p>') +
      '</div>' +
      '<div style="display:flex;gap:4px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px;">' +
        quickRepliesHtml +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:8px;">' +
        '<input id="dmReplyInput" type="text" placeholder="' + (canManage ? '팀원에게 답장과 조언을 남겨보세요' : '모임장님께 답장을 남겨보세요') + '" style="flex:1;padding:8px 10px;border-radius:8px;border:1px solid var(--rule);background:var(--card);color:var(--ink);font-size:.875rem;">' +
        '<button class="btn btn-primary btn-sm" id="sendDmReplyBtn" type="button" style="flex:0 0 auto;font-weight:700;padding:8px 14px;">전송</button>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-block btn-ghost" id="closeDmModalBtn" type="button">닫기</button>' +
      '</div>';
    }

    deps.openModal(renderDmModalHtml(), function(sheet){
      function scrollTimelineToBottom(){
        var box = sheet.querySelector('#dmTimelineBox');
        if(box) box.scrollTop = box.scrollHeight;
      }
      scrollTimelineToBottom();

      var replyEventListener = function(ev){
        if(ev && ev.detail && ev.detail.pingId === pingId){
          sheet.innerHTML = renderDmModalHtml();
          setupDmHandlers();
          scrollTimelineToBottom();
        }
      };
      if(typeof window !== 'undefined'){
        window.addEventListener('ourgoal:team_ping_reply_received', replyEventListener);
      }

      function setupDmHandlers(){
        sheet.querySelector('#closeDmModalBtn').addEventListener('click', deps.closeModal);

        sheet.querySelectorAll('.tg-dm-quick-chip').forEach(function(chip){
          chip.addEventListener('click', function(){
            var inp = sheet.querySelector('#dmReplyInput');
            if(inp) inp.value = chip.textContent.trim();
          });
        });

        var sendBtn = sheet.querySelector('#sendDmReplyBtn');
        if(sendBtn){
          sendBtn.addEventListener('click', async function(){
            var inp = sheet.querySelector('#dmReplyInput');
            var text = (inp && inp.value.trim()) || '';
            if(!text) return;

            ping.replies = ping.replies || [];
            var myUid = (p && p.id) || ('guest_' + Math.random().toString(36).substr(2, 9));
            var targetReceiverId = (myRole === 'owner')
              ? (ping.senderId || '')
              : (ping.receiverId || (ping.replies && ping.replies.length ? ping.replies[0].senderId : ''));

            var newReply = {
              id: 'reply_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              senderId: myUid,
              senderName: myName,
              senderRole: myRole,
              senderAvatar: myAvatar,
              receiverId: targetReceiverId,
              message: text,
              createdAt: new Date().toISOString()
            };
            ping.replies.push(newReply);
            ping.status = 'replied';

            await deps.saveProfile();
            await dispatchReplyToDb(newReply, ping, deps);
            if(deps.haptic) deps.haptic('success');
            deps.toast('DM 답장을 전송했어요! 💬');

            sheet.innerHTML = renderDmModalHtml();
            setupDmHandlers();
            scrollTimelineToBottom();
            if(deps.onRefresh) deps.onRefresh();
          });
        }
      }
      setupDmHandlers();
    });
  }

  function bindEvents(view, deps){
    if(!view) return;

    view.querySelectorAll('[data-tgmemfilter]').forEach(function(btn){
      btn.addEventListener('click', function(){
        activeFilter = btn.dataset.tgmemfilter;
        if(deps.onRefresh) deps.onRefresh();
      });
    });

    view.querySelectorAll('[data-stampmember]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var parts = btn.dataset.stampmember.split(':');
        openLeaderStampSelectModal(parts[0], parts[1], deps);
      });
    });

    view.querySelectorAll('[data-nudgemember]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var parts = btn.dataset.nudgemember.split(':');
        var gid = parts[0];
        var memberName = parts[1];
        var gs = deps.getGroupState(gid);
        gs.nudges = gs.nudges || {};
        var lastNudge = gs.nudges[memberName];
        var now = Date.now();
        if(lastNudge && (now - lastNudge < 60000)){
          deps.toast('방금 응원 넛지를 보냈어요. 잠시 후 다시 보낼 수 있어요.');
          return;
        }
        gs.nudges[memberName] = now;
        await deps.saveProfile();
        if(deps.haptic) deps.haptic('success');
        deps.toast('"' + memberName + '"님에게 1초 응원 넛지를 보냈어요! 🔥');
      });
    });

    view.querySelectorAll('[data-detailmember]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var parts = btn.dataset.detailmember.split(':');
        openMemberProgressDetailModal(parts[0], parts[1], deps);
      });
    });

    // 찌르기 모달 트리거 바인딩 (팀원 시점)
    view.querySelectorAll('[data-openping]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var parts = btn.dataset.openping.split(':');
        var gid = parts[0];
        var targetType = parts[1];
        var targetId = parts[2];
        var isDone = parts[3] === '1';
        var title = btn.dataset.targettitle || '목표 항목';
        openSendPingModal(gid, targetType, targetId, title, isDone, deps);
      });
    });

    // 모임장 찌르기 DM 모달 트리거 바인딩
    view.querySelectorAll('[data-openleaderdm]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var parts = btn.dataset.openleaderdm.split(':');
        var gid = parts[0];
        var pingId = parts[1];
        openLeaderMemberDmModal(gid, pingId, deps);
      });
    });
  }

  var OurgoalTeamLeaderCheck = {
    LEADER_STAMPS: LEADER_STAMPS,
    PING_TYPES: PING_TYPES,
    init: function(deps){
      globalDeps = deps;
      if(deps && deps.sb) setupTeamPingsRealtime(deps);
    },
    ensureTeamPingsLoaded: ensureTeamPingsLoaded,
    setupTeamPingsRealtime: setupTeamPingsRealtime,
    dispatchPingToDb: dispatchPingToDb,
    dispatchReplyToDb: dispatchReplyToDb,
    calcGroupMembersProgress: calcGroupMembersProgress,
    renderLeaderDashboardHtml: renderLeaderDashboardHtml,
    renderLeaderPingsSectionHtml: renderLeaderPingsSectionHtml,
    renderMemberFeedbackBannerHtml: renderMemberFeedbackBannerHtml,
    renderMemberPingButtonHtml: renderMemberPingButtonHtml,
    renderMemberDmNotificationBannerHtml: renderMemberDmNotificationBannerHtml,
    openLeaderStampSelectModal: openLeaderStampSelectModal,
    openMemberProgressDetailModal: openMemberProgressDetailModal,
    openSendPingModal: openSendPingModal,
    openLeaderMemberDmModal: openLeaderMemberDmModal,
    bindEvents: bindEvents,
    getActiveFilter: function(){ return activeFilter; },
    setActiveFilter: function(f){ activeFilter = f; }
  };

  if(typeof module !== 'undefined' && module.exports){
    module.exports = OurgoalTeamLeaderCheck;
  }
  global.OurgoalTeamLeaderCheck = OurgoalTeamLeaderCheck;
})(typeof window !== 'undefined' ? window : global);
