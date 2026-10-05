/**
 * OurGoal Sanctuary Cell: 목표 탭 성소 마운틴 트레일 — 고른 목표의 마일스톤 길 그리기(renderSanctuaryGoalTrail)와 마일스톤·할 일 토글, 마일스톤 체크인 연결, 샘플 루틴 담기 (#TASK-ES-429 · 포커스 성소 엔진 세포 쪼개기)
 *
 * js/sanctuary-v3-engine.js(1964줄)에서 동작 그대로 옮겼다(이전 전 줄 번호):
 *   분기 본문 renderSanctuaryGoalTrail(218~283)
 *   메서드 toggleMilestone·toggleTask·openMilestoneCheckin·transplantSampleRoutine(1585~1670)
 * 바꾼 글자는 원본 스코프 이름 앞 T. 접두뿐이다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalSanctuaryV3 로 부른다(메서드는 원본 객체의 같은 자리에서 펼치고, 함수는 원본이 같은 이름으로 가져온다). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window) {
  'use strict';
  // T = js/sanctuary-v3-engine.js 의 스코프 통로 — 원본 IIFE 에 남은 상태(engine)·함수를 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 성소 세포 키트의 goalTrail 칸 — 옮긴 함수·메서드 묶음을 담는다(전역 이름은 키트 OurgoalSanctuaryV3Kit 하나만 는다).
  // root = window 인자(키트 등록 전용 별칭 — 컴포넌트·팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalSanctuaryV3Kit = root.OurgoalSanctuaryV3Kit || {};
  var K = KIT.goalTrail = KIT.goalTrail || {};
  var T = K.scope = K.scope || {};

  // [#TASK-ES-429] renderSanctuaryGoals 의 「!activeGoal」 아닌(else) 분기 본문 — 이전 전 218~283줄 글자 그대로.
  //   렌더 함수 지역 변수(activeGoal·trailHtml)는 인자로 받는다, 바뀐 trailHtml 을 돌려준다.
  function renderSanctuaryGoalTrail(activeGoal, trailHtml) {
      var msList = activeGoal.milestones || [];
      var totalMs = msList.length;
      var doneMs = msList.filter(function(m) { return m.status === 'done' || m.done; }).length;
      var pct = totalMs > 0 ? Math.round((doneMs / totalMs) * 100) : (activeGoal.progress || 0);
      var ddayText = activeGoal.dueDate ? (window.dDay ? window.dDay(activeGoal.dueDate) : 'D-day') : '';

      // 마일스톤 노드 리스트 생성 (정상이 상단, 시작이 하단)
      var nodesHtml = '';
      if (totalMs === 0) {
        nodesHtml = '<div style="text-align:center;padding:24px;color:var(--ink-sub);font-size:0.875rem;">마일스톤을 추가하여 등반 트레일을 완성해보세요 🚩</div>';
      } else {
        // 복제본 생성 후 역순 정렬 (정상이 맨 위)
        var reversedMs = msList.slice().reverse();
        nodesHtml = reversedMs.map(function(m, idx) {
          var isSummit = (idx === 0);
          var isDone = (m.status === 'done' || m.done);
          var isDoing = (!isDone && (m.status === 'doing' || idx === reversedMs.length - 1));
          var nodeClass = isDone ? 'done' : (isDoing ? 'doing' : 'todo');
          var pointIcon = isSummit ? '🏁' : (isDone ? '✓' : (isDoing ? '⚡' : '○'));
          var subText = isDone ? ('완료됨 · ' + (m.dueDate || '달성')) : (isDoing ? '진행 중 · 실천 중' : '대기 · 예정');

          // 하위 할일 목록(Tasks) 바인딩
          var tasksHtml = '';
          if (m.tasks && m.tasks.length > 0) {
            tasksHtml = '<div class="trail-tasks-sublist">' +
              m.tasks.map(function(t) {
                var tDone = !!t.done;
                return '<div class="trail-task-row ' + (tDone ? 'done' : '') + '" onclick="event.stopPropagation(); window.OurgoalSanctuaryV3.toggleTask(\'' + activeGoal.id + '\', \'' + m.id + '\', \'' + t.id + '\');">' +
                  '<span class="trail-task-check">' + (tDone ? '☑' : '☐') + '</span>' +
                  '<span class="trail-task-title">' + T.escapeHtml(t.title) + '</span>' +
                '</div>';
              }).join('') +
            '</div>';
          }

          var actionChip = isDoing ?
            '<span class="trail-action-chip" onclick="event.stopPropagation(); window.OurgoalSanctuaryV3.openMilestoneCheckin(\'' + T.escapeHtml(m.title) + '\');">기록 입력</span>' :
            (isDone ? '<span class="trail-done-badge">완료</span>' : '');

          return '<div class="trail-node ' + nodeClass + '" onclick="window.OurgoalSanctuaryV3.toggleMilestone(\'' + activeGoal.id + '\', \'' + m.id + '\');">' +
            '<div class="trail-node-point ' + (isDoing ? 'beacon' : (isDone ? 'check' : '')) + '">' + pointIcon + '</div>' +
            '<div class="trail-node-content">' +
              '<div class="trail-node-title">' + T.escapeHtml(m.title) + '</div>' +
              '<div class="trail-node-sub">' + subText + (m.dueDate ? ' (' + m.dueDate + ')' : '') + '</div>' +
              tasksHtml +
            '</div>' +
            actionChip +
          '</div>' +
          (idx < reversedMs.length - 1 ? '<div class="trail-connector ' + (isDone ? 'done' : (isDoing ? 'doing' : '')) + '"></div>' : '');
        }).join('');
      }

      trailHtml = '<div class="mountain-trail-card">' +
        '<div class="mountain-head">' +
          '<div class="m-title-col">' +
            '<span class="m-badge">등반 로드맵 (Mountain Trail)</span>' +
            '<h3 class="m-goal-title">' + T.escapeHtml(activeGoal.title) + '</h3>' +
            /* [#TASK-ES-462] 목표 상세 서랍(#goalDetailDrawer · index.html openGoalDetailDrawer — 진척 막대·마일스톤 체크)을 부르는 곳이 없었다 → 트레일 머리에 「상세」 단추. 트레일 노드 누름 동작은 그대로 */
            '<button type="button" class="btn btn-ghost btn-sm" id="sGoalDetailBtn" title="누르면: 진척도와 마일스톤 체크 목록이 오른쪽 서랍으로 열려요" data-goalid="' + T.escapeHtml(String(activeGoal.id)) + '" onclick="window.openGoalDetailDrawer(this.dataset.goalid);" style="align-self:flex-start;margin-top:6px;min-height:44px;padding:0 12px;font-size:0.8125rem;font-weight:700;border-radius:10px;">📋 상세 보기</button>' +
          '</div>' +
          '<div class="m-summit-badge">' +
            '<span>' + (pct >= 100 ? '🎉 정상 정복 완료!' : ('정상까지 ' + (100 - pct) + '% 남음 🏔️')) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="mountain-trail-path">' +
          nodesHtml +
        '</div>' +
      '</div>';
    return trailHtml;
  }

  // [#TASK-ES-429] window.OurgoalSanctuaryV3 메서드 toggleMilestone·toggleTask·openMilestoneCheckin·transplantSampleRoutine — 이전 전 1585~1670줄 글자 그대로. 원본 객체 리터럴의 같은 자리에서 펼친다(...).
  K.methodsFrom_toggleMilestone = {
    toggleMilestone: async function(goalId, msId) {
      var goals = (window.state && window.state.profile && window.state.profile.goals) || [];
      var g = goals.find(function(item) { return item.id === goalId; });
      if (!g) return;
      var ms = (g.milestones || []).find(function(m) { return m.id === msId; });
      if (!ms) return;

      // 상태 순환: todo -> doing -> done -> todo
      if (ms.status === 'done' || ms.done) {
        ms.status = 'todo';
        ms.done = false;
      } else if (ms.status === 'doing') {
        ms.status = 'done';
        ms.done = true;
      } else {
        ms.status = 'doing';
        ms.done = false;
      }

      var total = g.milestones.length;
      var done = g.milestones.filter(function(m) { return m.status === 'done' || m.done; }).length;
      g.progress = total > 0 ? Math.round((done / total) * 100) : 0;

      if (window.saveProfile) await window.saveProfile();
      if (window.triggerHaptic) window.triggerHaptic(15);
      toast('마일스톤 상태가 변경되었습니다! ✨ (' + (ms.status === 'done' ? '완료' : '진행') + ')');
      T.renderSanctuaryGoals();
    },
    toggleTask: async function(goalId, msId, taskId) {
      var goals = (window.state && window.state.profile && window.state.profile.goals) || [];
      var g = goals.find(function(item) { return item.id === goalId; });
      if (!g) return;
      var ms = (g.milestones || []).find(function(m) { return m.id === msId; });
      if (!ms || !ms.tasks) return;
      var t = ms.tasks.find(function(tk) { return tk.id === taskId; });
      if (!t) return;

      t.done = !t.done;
      if (window.saveProfile) await window.saveProfile();
      if (window.triggerHaptic) window.triggerHaptic(10);
      toast('할 일을 ' + (t.done ? '완료했습니다! (+5P)' : '미완료로 변경했습니다.'));
      T.renderSanctuaryGoals();
    },
    openMilestoneCheckin: function(msTitle) {
      if (typeof setTab === 'function') setTab('home');
      setTimeout(function() {
        var inp = document.getElementById('captureInput');
        if (inp) {
          inp.value = '#' + msTitle + ' ';
          inp.focus();
          toast('체크인 입력창에 마일스톤을 연결했습니다. 실천 내용을 적어보세요!');
        }
      }, 150);
    },
    transplantSampleRoutine: async function() {
      var routine = {
        id: 'goal_transplant_' + Date.now(),
        title: '10km 하프마라톤 4주 완주 🏃',
        topic: '운동/건강',
        theme: 'workout',
        progress: 25,
        dueDate: T.getTodayStr(),
        milestones: [
          { id: 'ms_t1', title: '5km 논스톱 달리기', status: 'done', done: true, dueDate: T.getTodayStr() },
          { id: 'ms_t2', title: '10km 지속 페이스 5:30 달성', status: 'doing', done: false, dueDate: T.getTodayStr() },
          { id: 'ms_t3', title: '하프코스 21.0975km 완주', status: 'todo', done: false, dueDate: T.getTodayStr() }
        ],
        tasks: [
          { id: 'tk_t1', title: '카본 러닝화 점검', done: true },
          { id: 'tk_t2', title: '주 3회 야간 조깅', done: false }
        ]
      };

      if (!window.state) window.state = {};
      if (!window.state.profile) window.state.profile = { goals: [] };
      if (!Array.isArray(window.state.profile.goals)) window.state.profile.goals = [];

      window.state.profile.goals.unshift(routine);
      T.engine.activeGoalId = routine.id;
      window.state.activeGoalId = routine.id;

      if (window.saveProfile) await window.saveProfile();
      if (window.triggerHaptic) window.triggerHaptic(20);
      toast('⚡ [10km 하프마라톤 완주] 루틴이 내 목표에 1초 만에 담겼습니다! 🎉');
      T.renderSanctuaryGoals();
    },
  };

  K.renderSanctuaryGoalTrail = renderSanctuaryGoalTrail;
})(window);
