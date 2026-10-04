'use strict';
// 목표 상세 「+ 최종 결과」 버튼 위치 시험 (#TASK-ES-380)
// - js/tabs/goals/goal-detail.js 를 그대로 불러, 앱 공용 통로(L)만 가짜로 바꿔 끼우고 목표 상세 마크업을 만든다.
// - ui.css 의 `#goalDetailBody > .toss-goal-hero-card { display:none !important }` 가 숨기는 카드 안에 #goalResultBtn 이 남아 있으면 실패한다.
// - 버튼은 #goalDetailBody 바로 아래 줄(.goal-result-row)에 있고, 문구는 결과 없으면 「+ 최종 결과」, 있으면 「📝 결과 수정」 + 달성률 요약이다.
// - 편집 모드에서는 버튼을 그리지 않는다(예전과 같다).
// 사용: node tests/goal-result-btn-es380.test.js [저장소 뿌리 경로] — 기준 커밋 사본(git archive)을 넘기면 그 사본의 모듈을 잰다.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));

function makeState(editMode) {
  return {
    goalEditMode: !!editMode, msSel: {}, taskSel: {}, collapsedMilestones: {}, msFilter: 'all',
    profile: { goals: [], settings: {} }, activeGoalId: 'g1'
  };
}

let state = makeState(false);
const L = {
  get state() { return state; },
  VISIBILITY_LABELS: { private: '나만 보기', theme: '같은 테마 공개', public: '전체 공개' },
  dDay: function () { return 'D-10'; },
  escapeHtml: function (s) { return String(s == null ? '' : s); },
  formatSchedulePillHtml: function () { return ''; },
  goalAchievement: function () { return 0; },
  resultPct: function (r) { return r && r.pct != null ? r.pct : null; },
  toDateTimeLocalValue: function () { return ''; },
  topicPill: function () { return ''; },
  computeGoalStatusHash: function () { return 'h'; },
  getKSTDateKey: function () { return '2026-10-05'; },
  getEffectiveStandardDateKey: function () { return '2026-10-05'; },
  nowISO: function () { return '2026-10-05T09:00:00.000Z'; },
  renderInlineAttachmentChips: function () { return ''; },
  renderPromptEncyclopediaHtml: function () { return ''; }
};

global.window = global;
global.OurgoalAppScope = { scope: L };
const K = require(path.join(ROOT, 'js/tabs/goals/goal-detail.js'));

function newGoal(result) {
  return {
    id: 'g1', title: '결과 버튼 확인 목표', icon: '🎯', visibility: 'private', createdAt: '2026-10-01T00:00:00.000Z',
    milestones: [{ id: 'm1', title: '첫 단계', status: 'todo', tasks: [] }],
    result: result || null
  };
}

function render(goal, editMode) {
  state = makeState(editMode);
  const body = { innerHTML: '' };
  K.renderGoalDetailBody(goal, body);
  return body.innerHTML;
}

// html 안에서 open 위치에서 시작하는 <div …> 의 짝 </div> 끝 위치를 찾는다(마크업은 이 모듈이 만든 문자열이라 div 짝이 맞는다).
function divEnd(html, open) {
  const re = /<div\b|<\/div>/g;
  re.lastIndex = open;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) return re.lastIndex;
  }
  return html.length;
}

// #goalDetailBody 바로 아래(깊이 0)에서 시작하는 요소들의 [시작, 끝] 목록
function topLevelDivs(html) {
  const out = [];
  let i = 0;
  while (true) {
    const open = html.indexOf('<div', i);
    if (open < 0) break;
    const end = divEnd(html, open);
    out.push({ start: open, end: end, head: html.slice(open, html.indexOf('>', open) + 1) });
    i = end;
  }
  return out;
}

let n = 0;
let failed = 0;
function check(title, fn) {
  try { fn(); n++; console.log('  ok · ' + title); }
  catch (e) { failed++; console.error('  실패 · ' + title + '\n    ' + e.message); }
}

check('숨김 규칙(#goalDetailBody > .toss-goal-hero-card)은 ui.css 에 그대로 있다', function () {
  const css = fs.readFileSync(path.join(ROOT, 'ui.css'), 'utf8');
  assert.ok(/#goalDetailBody\s*>\s*\.toss-goal-hero-card\s*\{\s*display:\s*none\s*!important;?\s*\}/.test(css), '숨김 규칙이 없다');
});

check('결과 없는 목표: #goalResultBtn 이 있고 숨김 카드 밖, #goalDetailBody 바로 아래 줄에 있다', function () {
  const html = render(newGoal(null), false);
  const btnAt = html.indexOf('id="goalResultBtn"');
  assert.ok(btnAt >= 0, '#goalResultBtn 이 없다');
  const tops = topLevelDivs(html);
  const hidden = tops.filter(function (d) { return /class="[^"]*\btoss-goal-hero-card\b/.test(d.head); });
  assert.strictEqual(hidden.length, 1, '숨김 카드 수');
  assert.ok(!(btnAt > hidden[0].start && btnAt < hidden[0].end), '#goalResultBtn 이 숨김 카드(.toss-goal-hero-card) 안에 있다');
  const holder = tops.filter(function (d) { return btnAt > d.start && btnAt < d.end; });
  assert.strictEqual(holder.length, 1, '#goalResultBtn 을 감싼 맨 위 줄이 없다');
  assert.ok(/class="[^"]*\bgoal-result-row\b/.test(holder[0].head), '버튼을 감싼 줄이 .goal-result-row 가 아니다: ' + holder[0].head.slice(0, 80));
  assert.ok(hidden[0].end <= holder[0].start, '결과 줄이 숨김 카드 뒤(목표 상세 맨 위)에 오지 않는다');
});

check('결과 없는 목표: 문구는 「+ 최종 결과」, 요약 줄 없음', function () {
  const html = render(newGoal(null), false);
  assert.ok(/id="goalResultBtn"[^>]*>\+ 최종 결과<\/button>/.test(html), '문구가 다르다');
  assert.ok(html.indexOf('id="goalResultSummary"') < 0, '결과가 없는데 요약이 있다');
});

check('결과 있는 목표: 문구 「📝 결과 수정」 + 「최종 결과 · 달성률 80%」 요약', function () {
  const html = render(newGoal({ target: 100, result: 80, unit: '%', pct: 80 }), false);
  assert.ok(/id="goalResultBtn"[^>]*>📝 결과 수정<\/button>/.test(html), '문구가 다르다');
  assert.ok(html.indexOf('최종 결과 · 달성률 80%') >= 0, '달성률 요약이 없다');
});

check('편집 모드: #goalResultBtn 을 그리지 않는다', function () {
  const html = render(newGoal(null), true);
  assert.ok(html.indexOf('id="goalResultBtn"') < 0, '편집 모드에 버튼이 있다');
});

console.log('  goal-result-btn-es380: ' + n + '건 통과 · ' + failed + '건 실패');
if (failed) process.exitCode = 1;
