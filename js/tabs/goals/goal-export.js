/**
 * OurGoal Goal Export & Archive (목표 탭 — AI 분석용 내보내기 · 목표 보관 · 완주 인증서)
 *
 * #TASK-ES-375 (목표 탭 세포 이전 2차): index.html 인라인 IIFE 의 아래 함수들을 동작 그대로 옮겼다.
 *   buildGoalSnapshot(이전 전 21046~21097줄)
 *   goalSnapshotSummary(이전 전 21098~21126줄)
 *   exportGoalSnapshot(이전 전 21127~21139줄)
 *   archiveGoal(이전 전 21142~21154줄)
 *   openGoalCertificateModal(이전 전 33273~33324줄)
 * 목표 상세(js/tabs/goals/goal-detail-events.js)의 내보내기·전체 내보내기·보관 버튼이 L.exportGoalSnapshot · L.archiveGoal 로 부르고,
 * 보관한 목표가 100% 달성이면 archiveGoal 이 같은 파일의 openGoalCertificateModal 을 부른다.
 * 보관 구획 주석과 되돌리기(restoreGoal — 보관한 목표 목록 renderArchivedGoals 와 js/sanctuary-v3-engine.js 가 씀)는 index.html 에 남겼다. 인증서 그림(generateGoalCertificateImage)은 공유 카드 그림 묶음이라 L 통로로 읽는다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 목표 키트 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 목표 키트: 목표 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ============ 목표 현황 데이터 내보내기 (AI 분석용) ============ */
  function buildGoalSnapshot(goals){
    var p = L.state.profile;
    var recs = p.records.slice().sort(function(a,b){ return new Date(b.startAt)-new Date(a.startAt); });
    return {
      exportedAt: L.nowISO(),
      purpose: 'AI 분석용 목표 현황 스냅샷',
      user: {
        displayName: p.displayName,
        bio: p.bio || '',
        interests: (p.interests||[]).map(function(t){ return L.topicLabel(t) || t; }),
        region: p.region || null,
        streakDays: L.computeStreakDays(),
        totalRecords: p.records.length
      },
      goals: goals.map(function(g){
        return {
          title: g.title,
          topic: L.topicLabel(g.topic) || null,
          visibility: L.VISIBILITY_LABELS[g.visibility||'private'],
          createdAt: g.createdAt,
          dueDate: g.dueDate || null,
          dDay: g.dueDate ? L.dDay(g.dueDate) : null,
          archived: !!g.archivedAt,
          archivedAt: g.archivedAt || null,
          progressPercent: L.goalProgress(g),
          achievementPercent: L.goalAchievement(g),
          finalResult: g.result || null,
          milestones: g.milestones.map(function(m){
            return {
              title: m.title,
              status: m.status,
              dueDate: m.dueDate || null,
              dDay: m.dueDate ? L.dDay(m.dueDate) : null,
              result: m.result || null,
              tasks: (m.tasks||[]).map(function(t){
                return { title: t.title, done: !!t.done, dueDate: t.dueDate||null, result: t.result||null };
              })
            };
          })
        };
      }),
      recentCheckins: recs.slice(0, 60).map(function(r){
        return { date: L.dateKey(r.startAt), type: r.type, text: r.text,
          minutes: r.endAt ? Math.round((new Date(r.endAt)-new Date(r.startAt))/60000) : null };
      }),
      analysisHints: [
        '목표별 achievementPercent와 마일스톤 result를 비교해 어디서 진행이 막혔는지 찾아주세요',
        'recentCheckins의 날짜 간격으로 실천 주기와 끊긴 구간을 분석해주세요',
        'dDay가 임박하거나 지난 항목 중 결과가 비어 있는 것을 우선순위로 알려주세요'
      ]
    };
  }
  function goalSnapshotSummary(snap){
    var lines = ['# 아워골 목표 현황 (' + L.dateKey(snap.exportedAt) + ')', ''];
    lines.push('사용자: ' + snap.user.displayName + ' · 연속 기록 ' + snap.user.streakDays + '일 · 총 기록 ' + snap.user.totalRecords + '개');
    if(snap.user.region) lines.push('지역: ' + snap.user.region);
    if(snap.user.interests.length) lines.push('관심: ' + snap.user.interests.join(', '));
    lines.push('');
    snap.goals.forEach(function(g){
      lines.push('## ' + g.title + (g.archived ? ' (보관됨)' : ''));
      lines.push('- 카테고리: ' + (g.topic || '미설정') + ' / 공개: ' + g.visibility);
      lines.push('- 마감: ' + (g.dueDate || '없음') + (g.dDay ? ' (' + g.dDay + ')' : '') + ' / 진행률 ' + g.progressPercent + '% · 달성률 ' + g.achievementPercent + '%');
      if(g.finalResult) lines.push('- 최종 결과: ' + (g.finalResult.result||0) + '/' + (g.finalResult.target||'-') + ' ' + (g.finalResult.unit||'') + (g.finalResult.note ? ' · ' + g.finalResult.note : ''));
      g.milestones.forEach(function(m){
        var r = m.result;
        lines.push('  - [' + m.status + '] ' + m.title + (m.dueDate ? ' (' + m.dueDate + ' ' + m.dDay + ')' : '') +
          (r ? ' → ' + (r.result||0) + '/' + (r.target||'-') + ' ' + (r.unit||'') : ''));
        (m.tasks||[]).forEach(function(t){
          var tr = t.result;
          lines.push('    · ' + t.title + (t.dueDate ? ' (' + t.dueDate + ')' : '') +
            (tr ? ' → ' + (tr.result||0) + '/' + (tr.target||'-') + ' ' + (tr.unit||'') : (t.done ? ' → 완료' : '')));
        });
      });
      lines.push('');
    });
    lines.push('## 최근 체크인');
    snap.recentCheckins.slice(0, 30).forEach(function(r){
      lines.push('- ' + r.date + ' · ' + r.text + (r.minutes ? ' (' + r.minutes + '분)' : ''));
    });
    return lines.join('\r\n');
  }
  function exportGoalSnapshot(scope, goal){
    var goals = scope==='one' && goal ? [goal] : L.state.profile.goals;
    if(!goals.length){ L.toast('내보낼 목표가 없어요'); return; }
    var snap = buildGoalSnapshot(goals);
    var stamp = L.dateKey(L.nowISO());
    var fmt = L.state.profile.settings.exportFormat || 'csv';
    if(fmt === 'json'){
      L.download('아워골_목표현황_'+stamp+'.json', JSON.stringify(snap, null, 2), 'application/json');
    } else {
      L.download('아워골_목표현황_'+stamp+'.md', '﻿'+goalSnapshotSummary(snap), 'text/markdown;charset=utf-8');
    }
    L.toast('AI 분석용 파일을 받았어요');
  }

  async function archiveGoal(goal){
    goal.archivedAt = L.nowISO();
    L.state.activeGoalId = null;
    var fullyAchieved = L.goalAchievement(goal) >= 100;
    await L.saveProfile();
    L.renderAll();
    L.setTab('records');
    if(fullyAchieved){
      openGoalCertificateModal(goal);
    } else {
      L.toast('"'+goal.title+'"을(를) 기록으로 옮겼어요');
    }
  }

  async function openGoalCertificateModal(goal){
    var pct = L.goalAchievement(goal);
    var days = Math.max(1, Math.round((new Date(goal.archivedAt||L.nowISO()) - new Date(goal.createdAt))/86400000));
    L.openModal(
      '<h3 style="text-align:center;">완주를 축하해요!</h3>' +
      '<p class="muted" style="text-align:center;margin:-6px 0 16px;">"'+L.escapeHtml(goal.title)+'"을(를) '+pct+'% 달성으로 마쳤어요</p>' +
      '<div id="certImgWrap" style="text-align:center;color:var(--ink-faint);padding:60px 0;">인증서 만드는 중…</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-primary" id="certShareBtn" type="button" disabled>공유하기</button>' +
        '<button class="btn btn-ghost" id="certSaveBtn" type="button" disabled>이미지 저장</button>' +
      '</div>',
      function(){
        if(navigator.vibrate) navigator.vibrate([12,40,24]);
        L.burstConfetti(window.innerWidth/2, window.innerHeight/3);
      }
    );
    var canvas = await L.generateGoalCertificateImage(goal, pct, days);
    var dataUrl = canvas.toDataURL('image/png');
    var wrap = document.getElementById('certImgWrap');
    if(!wrap) return; // 사용자가 모달을 이미 닫음
    wrap.outerHTML = '<img id="certImgWrap" src="'+dataUrl+'" alt="목표 완주 인증서" style="width:100%;border-radius:16px;display:block;">';
    var shareBtn = document.getElementById('certShareBtn');
    var saveBtn = document.getElementById('certSaveBtn');
    if(shareBtn) shareBtn.disabled = false;
    if(saveBtn) saveBtn.disabled = false;
    if(shareBtn) shareBtn.addEventListener('click', async function(){
      var text = '아워골에서 "'+goal.title+'" '+pct+'% 달성으로 완주했어요! 🏆'+L.buildInviteLinkSuffix(goal.id, goal.title);
      try{
        var blob = await (await fetch(dataUrl)).blob();
        var file = new File([blob], 'ourgoal-certificate.png', { type:'image/png' });
        if(navigator.canShare && navigator.canShare({ files:[file] })){
          await navigator.share({ files:[file], title:'아워골', text: text });
          L.toast('공유했어요');
        } else if(navigator.share){
          await navigator.share({ title:'아워골', text: text });
          L.toast('이 기기는 이미지 공유를 지원하지 않아 문구로 공유했어요 · 이미지는 저장 버튼을 써주세요');
        } else if(navigator.clipboard){
          await navigator.clipboard.writeText(text);
          L.toast('공유 문구를 복사했어요 · 이미지는 저장 버튼으로 받아주세요');
        } else {
          L.toast('이미지 저장 버튼으로 받아서 직접 공유해주세요');
        }
      } catch(e){ /* 사용자가 공유 시트를 취소함 */ }
    });
    if(saveBtn) saveBtn.addEventListener('click', function(){
      var a = document.createElement('a');
      a.href = dataUrl;
      a.download = '아워골_완주인증서.png';
      document.body.appendChild(a); a.click(); a.remove();
      L.toast('이미지를 저장했어요');
    });
  }

  K.buildGoalSnapshot = buildGoalSnapshot;
  K.goalSnapshotSummary = goalSnapshotSummary;
  K.exportGoalSnapshot = exportGoalSnapshot;
  K.archiveGoal = archiveGoal;
  K.openGoalCertificateModal = openGoalCertificateModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
