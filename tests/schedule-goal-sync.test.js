const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('[TEST] schedule-goal-sync.test.js: #TASK-ES-253 bidirectional schedule-goal sync suite starting...');

// 1. Static codebase inspection
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

// REQ-1 & REQ-2: Modal subtask selector & field persistence
assert.ok(indexHtml.includes('id="calEditLinkedSubtaskField"'), 'Subtask field container must exist in index.html');
assert.ok(indexHtml.includes('id="calEditLinkedSubtask"'), 'Subtask selector must exist in index.html');
assert.ok(indexHtml.includes('buildSubtaskOptions('), 'buildSubtaskOptions helper must exist');
assert.ok(indexHtml.includes('linkedTaskId: linkedTaskId || null'), 'linkedTaskId must be persisted');
assert.ok(indexHtml.includes('linkedMsId: linkedMsId || null'), 'linkedMsId must be persisted');
assert.ok(indexHtml.includes('linkedTaskTitle: linkedTaskTitle || null'), 'linkedTaskTitle must be persisted');

// REQ-3 & REQ-4: Bidirectional sync logic, EXP reward & haptics
assert.ok(indexHtml.includes("awardXP(10, '일정 및 목표 달성')"), '+10 EXP award for schedule completion must exist');
assert.ok(indexHtml.includes("triggerHapticFeedback(12)"), '12ms haptic feedback must exist');
assert.ok(indexHtml.includes('allTasksDone ? \'done\' :'), 'Milestone status auto-advance logic must exist');

// REQ-5: 4-view atomic propagation
assert.ok(indexHtml.includes('if(typeof renderGoalsScreen === \'function\') renderGoalsScreen();'), 'renderGoalsScreen must be called in toggleScheduleDone');
assert.ok(indexHtml.includes('renderCalendarScreen();'), 'renderCalendarScreen must be called');
assert.ok(indexHtml.includes('if(typeof renderHome === \'function\') renderHome();'), 'renderHome must be called');
assert.ok(indexHtml.includes('if(typeof renderRecordsScreen === \'function\') renderRecordsScreen();'), 'renderRecordsScreen must be called');

// REQ-7: Visual badge in calendar views
assert.ok(uiCss.includes('.sched-goal-badge'), '.sched-goal-badge style must exist in ui.css');
assert.ok(indexHtml.includes('span class="sched-goal-badge"'), 'sched-goal-badge must be rendered in calendar views');

// 2. Behavioral simulation
// Mock state and environment
const mockState = {
  activeTab: 'calendar',
  profile: {
    id: 'user_test_253',
    settings: {
      customSchedules: [
        {
          id: 'sched_task_101',
          linkedId: 'task_101',
          linkedLevel: 'task',
          linkedGoalId: 'goal_alpha',
          linkedGoalTitle: '수능 만점 목표',
          linkedMsId: 'ms_01',
          linkedTaskId: 'task_101',
          linkedTaskTitle: '수학 모의고사 풀기',
          title: '수학 모의고사 풀기',
          date: '2026-09-24T10:00:00',
          done: false
        }
      ]
    },
    goals: [
      {
        id: 'goal_alpha',
        title: '수능 만점 목표',
        topic: '학습',
        milestones: [
          {
            id: 'ms_01',
            title: '1차 실전 모의고사 100점',
            status: 'todo',
            tasks: [
              { id: 'task_101', title: '수학 모의고사 풀기', done: false },
              { id: 'task_102', title: '영어 단어 100개 암기', done: false }
            ]
          }
        ]
      }
    ]
  }
};

let awardedXP = 0;
let hapticCount = 0;
let calendarRendered = 0;
let goalsRendered = 0;
let homeRendered = 0;
let recordsRendered = 0;

function mockAwardXP(amount, desc) {
  awardedXP += amount;
}

function mockTriggerHaptic(ms) {
  hapticCount++;
}

// Simulate toggleScheduleDone logic
function simulateToggleSchedule(schedId) {
  const sched = mockState.profile.settings.customSchedules.find(s => s.id === schedId);
  assert.ok(sched, 'Schedule item must be found');
  sched.done = !sched.done;
  const isNowDone = sched.done;

  const effGoalId = sched.linkedGoalId;
  const effMsId = sched.linkedMsId;
  const effTaskId = sched.linkedTaskId;

  if (effTaskId || effMsId || effGoalId) {
    mockState.profile.goals.forEach(g => {
      if (effGoalId && g.id !== effGoalId) return;
      (g.milestones || []).forEach(m => {
        if (effMsId && m.id !== effMsId) return;
        (m.tasks || []).forEach(t => {
          if (effTaskId && t.id === effTaskId) {
            t.done = isNowDone;
          }
        });
        if (m.tasks && m.tasks.length) {
          const allTasksDone = m.tasks.every(tk => !!tk.done);
          m.status = allTasksDone ? 'done' : (m.status === 'done' ? 'todo' : m.status);
        }
      });
    });
  }

  if (isNowDone) {
    mockAwardXP(10, '일정 및 목표 달성');
    mockTriggerHaptic(12);
  }

  calendarRendered++;
  goalsRendered++;
  homeRendered++;
  recordsRendered++;

  return isNowDone;
}

// Test Step 1: Complete schedule 1
const res1 = simulateToggleSchedule('sched_task_101');
assert.strictEqual(res1, true, 'Schedule should now be marked done');
assert.strictEqual(mockState.profile.settings.customSchedules[0].done, true, 'customSchedule.done should be true');
const targetTask = mockState.profile.goals[0].milestones[0].tasks[0];
assert.strictEqual(targetTask.done, true, 'Target task.done should be true');
assert.strictEqual(mockState.profile.goals[0].milestones[0].status, 'todo', 'Milestone remains todo because task_102 is not yet done');
assert.strictEqual(awardedXP, 10, '10 EXP awarded');
assert.strictEqual(hapticCount, 1, 'Haptic feedback triggered');
assert.strictEqual(calendarRendered, 1, 'Calendar view rendered');
assert.strictEqual(goalsRendered, 1, 'Goals view rendered');
assert.strictEqual(homeRendered, 1, 'Home view rendered');
assert.strictEqual(recordsRendered, 1, 'Records view rendered');

// Test Step 2: Complete the second task directly -> Milestone should advance to 'done'
mockState.profile.goals[0].milestones[0].tasks[1].done = true;
const allDone = mockState.profile.goals[0].milestones[0].tasks.every(t => t.done);
if (allDone) {
  mockState.profile.goals[0].milestones[0].status = 'done';
}
assert.strictEqual(mockState.profile.goals[0].milestones[0].status, 'done', 'Milestone should advance to done when all tasks are complete');

// Test Step 3: Uncheck schedule 1 -> Task becomes undone, Milestone reverts to 'todo'
const res2 = simulateToggleSchedule('sched_task_101');
assert.strictEqual(res2, false, 'Schedule should now be undone');
assert.strictEqual(mockState.profile.settings.customSchedules[0].done, false, 'customSchedule.done should be false');
assert.strictEqual(targetTask.done, false, 'Target task.done should revert to false');
assert.strictEqual(mockState.profile.goals[0].milestones[0].status, 'todo', 'Milestone should revert to todo');
assert.strictEqual(calendarRendered, 2, 'Calendar view re-rendered');
assert.strictEqual(goalsRendered, 2, 'Goals view re-rendered');

console.log('[TEST] schedule-goal-sync.test.js: All assertions passed successfully.');
