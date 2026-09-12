/* ============================================================
 * 아워골 — 팀 목표 모임장-팀원 목표달성도 점검 시스템
 * #TASK-ES-026 · 본질 ③ 동류 발견·소통 / ① 체크인 루프
 *
 * 모임장(Owner) 및 운영진(Manager)이 팀원들의 실시간 달성률,
 * 오늘 인증 상태, 스트릭을 점검하고 확인 도장(4종) 및 1초 독려 넛지,
 * 1:1 피드백을 전달할 수 있는 전용 모듈.
 * ============================================================ */
(function(global){
  'use strict';

  var LEADER_STAMPS = {
    perfect: { id:'perfect', label:'완벽해요', icon:'🌟', color:'var(--gold)', bg:'var(--gold-soft)' },
    growth:  { id:'growth',  label:'폭풍성장', icon:'🚀', color:'var(--brand-strong)', bg:'var(--red-soft)' },
    good:    { id:'good',    label:'참잘했어요', icon:'👏', color:'var(--sage)', bg:'var(--sage-soft)' },
    cheer:   { id:'cheer',   label:'힘내요',   icon:'💪', color:'var(--ink-soft)', bg:'var(--rule)' }
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

  function calcGroupMembersProgress(gid, mockGroups, getGroupState, getProfile, getLevelGoals){
    var g = (mockGroups || []).find(function(x){ return x.id === gid; });
    if(!g) return { members: [], summary: { total: 0, doneToday: 0, rate: 0, avgProgress: 0, needCare: 0 } };

    var gs = (typeof getGroupState === 'function') ? getGroupState(gid) : {};
    gs.leaderStamps = gs.leaderStamps || {};
    gs.nudges = gs.nudges || {};
    gs.leaderFeedback = gs.leaderFeedback || {};

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
      '<div style="max-height:280px;overflow-y:auto;padding-right:2px;">' +
        (memberRowsHtml || '<p class="faint" style="font-size:.8125rem;text-align:center;padding:12px 0;">해당 조건의 팀원이 없습니다.</p>') +
      '</div>' +
    '</div>';
  }

  function renderMemberFeedbackBannerHtml(g, deps){
    var progressData = calcGroupMembersProgress(g.id, deps.mockGroups, deps.getGroupState, deps.getProfile, deps.getLevelGoals);
    var p = (typeof deps.getProfile === 'function') ? deps.getProfile() : null;
    var myName = (p && p.displayName) || '나';
    var myItem = progressData.members.find(function(m){ return m.name === myName || m.isMe; });

    if(myItem && myItem.stamp){
      return '<div style="margin-top:10px;margin-bottom:12px;padding:10px 12px;border-radius:10px;background:var(--gold-soft);border:1px solid var(--gold);display:flex;align-items:center;gap:10px;">' +
        '<span style="font-size:1.5rem;">'+myItem.stamp.icon+'</span>' +
        '<div style="flex:1;">' +
          '<div style="font-weight:700;font-size:.875rem;color:var(--ink);">모임장 확인 도장 ['+esc(myItem.stamp.label)+']을 받았어요!</div>' +
          '<div class="faint" style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">모임장님이 오늘 내 인증을 확인하고 응원을 남겼습니다.</div>' +
        '</div>' +
      '</div>';
    }
    return '';
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
  }

  var OurgoalTeamLeaderCheck = {
    LEADER_STAMPS: LEADER_STAMPS,
    calcGroupMembersProgress: calcGroupMembersProgress,
    renderLeaderDashboardHtml: renderLeaderDashboardHtml,
    renderMemberFeedbackBannerHtml: renderMemberFeedbackBannerHtml,
    openLeaderStampSelectModal: openLeaderStampSelectModal,
    openMemberProgressDetailModal: openMemberProgressDetailModal,
    bindEvents: bindEvents,
    getActiveFilter: function(){ return activeFilter; },
    setActiveFilter: function(f){ activeFilter = f; }
  };

  if(typeof module !== 'undefined' && module.exports){
    module.exports = OurgoalTeamLeaderCheck;
  }
  global.OurgoalTeamLeaderCheck = OurgoalTeamLeaderCheck;
})(typeof window !== 'undefined' ? window : global);