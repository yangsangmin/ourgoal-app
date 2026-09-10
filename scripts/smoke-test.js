#!/usr/bin/env node
/*
 * 최소 자동 스모크 테스트: index.html의 <script> 블록 문법 검증 +
 * 핵심 순수 함수 몇 개(goalProgress, applySuggestion 등) 단위 테스트.
 * 실행: node scripts/smoke-test.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const INDEX_HTML = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(INDEX_HTML, 'utf8');

let failures = 0;
let passed = 0;

function check(label, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + label);
  } catch (err) {
    failures++;
    console.error('  ✗ ' + label);
    console.error('      ' + (err && err.message ? err.message : err));
  }
}

/* ============ 1. <script> 문법 검증 ============ */
console.log('[1/2] index.html 인라인 <script> 문법 검증');

const scriptMatches = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter(m => !/\bsrc=/.test(m[1]))
  .map(m => m[2])
  .filter(code => code.trim().length > 0);

assert.ok(scriptMatches.length > 0, 'index.html 안에서 인라인 <script> 블록을 찾지 못했습니다.');

const mainScript = scriptMatches.reduce((a, b) => (b.length > a.length ? b : a), '');

check('메인 <script> 블록이 유효한 JS 문법이다 (new Function 파싱)', () => {
  // 실행하지 않고 컴파일만 하므로 브라우저 전용 API(window, supabase 등) 없이도 안전하게 검증 가능.
  // eslint-disable-next-line no-new-func
  new Function(mainScript);
});

/* ============ 2. 핵심 순수 함수 단위 테스트 ============ */
console.log('[2/2] 핵심 함수 단위 테스트');

// index.html의 IIFE 안에 캡슐화된 순수 함수들을 이름으로 추출해
// 격리된 샌드박스에서 실행한다. (index.html 자체는 수정하지 않음)
function extractFunction(source, name) {
  const startMatch = new RegExp('function\\s+' + name + '\\s*\\(').exec(source);
  if (!startMatch) throw new Error('함수를 찾을 수 없음: ' + name);
  const braceStart = source.indexOf('{', startMatch.index);
  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(startMatch.index, i + 1);
    }
  }
  throw new Error('함수의 닫는 중괄호를 찾지 못함: ' + name);
}

const FN_NAMES = [
  'pad', 'dateKey', 'goalProgress', 'msCounts', 'resultPct', 'dDay',
  'computeStreakDays', 'findSuggestionTarget', 'sanitizeSuggestions',
  'applySuggestion', 'describeSuggestion', 'localTodayMission',
  'maybeGrantStreakFreeze', 'maybeApplyStreakFreeze',
  'xpForLevel', 'levelForXP', 'levelProgress',
  'totalCompletedMilestones',
  'heatmapLevel', 'localNextActionSuggestion',
  'goalAchievement', 'weeklyRecapStats',
  'parseAttribution', 'filterHidden', 'filterBlockedPosts',
  'uid', 'newId', 'nowISO', 'getSid', 'getAttribution', 'recordLanding', 'buildCheckinRecord', 'updateAppBadge',
  'calendarAvailable', 'fmtDateLabel', 'filterRecordsByQuery',
  'generateDynamicNotification',
  'fmtYYMMDD', 'recommendTemplateFromAI',
  'computeTableAnalytics',
  'parseNaturalLanguageTemplateSpec', 'parseCsvText', 'parseVoiceToTableRow',
  'fmtTime', 'getAIAnalysisPrompt', 'buildCSV', 'buildMarkdownExport',
  'triggerHaptic', 'reorderMilestones', 'filterFeedByCategory',
  'calculateWeeklyFocusStats', 'exportRecordsToCsv', 'exportRecordsToMarkdown',
  'defaultSettings', 'getPrivacyLabel', 'subscriptionState',
  'computeTrendChartData', 'formatStopwatchTime',
];

const extracted = FN_NAMES.map(name => extractFunction(mainScript, name)).join('\n');

const sandboxSrc =
  'var STREAK_FREEZE_MAX = 3;\n' +
  'var state = { profile: { records: [], settings: { streakFreeze: { available: 0, usedDates: [], grantedTier: 0 } } } };\n' +
  /* 브라우저 전역 스텁 — localStorage/location에 의존하는 게이트 로직(getSid·getAttribution)을 불변식 테스트로 고정하기 위함 (AUD-1·AUD-6) */
  'var window = {};\n' +
  'var location = { search: "" };\n' +
  'var localStorage = { _m: {}, getItem: function(k){ return Object.prototype.hasOwnProperty.call(this._m, k) ? this._m[k] : null; }, setItem: function(k, v){ this._m[k] = String(v); }, removeItem: function(k){ delete this._m[k]; }, clear: function(){ this._m = {}; } };\n' +
  /* Badging API 스텁 — updateAppBadge 불변식 검증용 (setNavigator(null)로 미지원 환경 재현) */
  'var navigator = { badge: null, _vib: null, setAppBadge: function(n){ this.badge = n; return Promise.resolve(); }, clearAppBadge: function(){ this.badge = 0; return Promise.resolve(); }, vibrate: function(d){ this._vib = d; return true; } };\n' +
  /* 검색(filterRecordsByQuery)의 분야 매칭 대상 — 실제 TOPICS 전체를 옮기지 않고 테스트에 필요한 만큼만 스텁 */
  'var TOPICS = { workout: { label: "운동" }, study: { label: "공부" } };\n' +
  'var RECORD_THEMES = { daily: { label: "일상" }, study: { label: "공부" }, workout: { label: "운동" } };\n' +
  // generateDynamicNotification의 모임 인증 분기 테스트용 최소 스텁(실제 MOCK_GROUPS는 추출하지 않음).
  'var MOCK_GROUPS = [{ id: "g1", name: "테스트 모임", activity: ["a", "b", "c"] }];\n' +
  extracted +
  '\nmodule.exports = { pad, dateKey, goalProgress, msCounts, resultPct, dDay, ' +
  'computeStreakDays, findSuggestionTarget, sanitizeSuggestions, applySuggestion, describeSuggestion, ' +
  'localTodayMission, ' +
  'maybeGrantStreakFreeze, maybeApplyStreakFreeze, ' +
  'xpForLevel, levelForXP, levelProgress, totalCompletedMilestones, ' +
  'heatmapLevel, ' +
  'localNextActionSuggestion, ' +
  'goalAchievement, weeklyRecapStats, ' +
  'parseAttribution, filterHidden, filterBlockedPosts, ' +
  'uid, newId, nowISO, getSid, getAttribution, recordLanding, ' +
  'setSearch: function(s){ location.search = s; }, getStorage: function(){ return localStorage; }, ' +
  'buildCheckinRecord, updateAppBadge, ' +
  'getNavigator: function(){ return navigator; }, setNavigator: function(n){ navigator = n; }, ' +
  'calendarAvailable, fmtDateLabel, filterRecordsByQuery, ' +
  'generateDynamicNotification, fmtYYMMDD, recommendTemplateFromAI, computeTableAnalytics, ' +
  'parseNaturalLanguageTemplateSpec, parseCsvText, parseVoiceToTableRow, ' +
  'triggerHaptic, reorderMilestones, filterFeedByCategory, calculateWeeklyFocusStats, exportRecordsToCsv, exportRecordsToMarkdown, ' +
  'defaultSettings, getPrivacyLabel, subscriptionState, computeTrendChartData, formatStopwatchTime, ' +
  'setRecords: function(r){ state.profile.records = r; }, ' +
  'setStreakFreeze: function(sf){ state.profile.settings.streakFreeze = sf; } };\n';

const os = require('os');
const sandboxPath = path.join(os.tmpdir(), 'ourgoal-smoke-sandbox-' + process.pid + '.js');
fs.writeFileSync(sandboxPath, sandboxSrc);
let fns;
try {
  fns = require(sandboxPath);
} finally {
  fs.unlinkSync(sandboxPath);
}

function makeGoal(milestoneStatuses) {
  return {
    id: 'g1',
    milestones: milestoneStatuses.map((status, i) => ({
      id: 'm' + i,
      title: '마일스톤 ' + i,
      status: status,
      tasks: [],
    })),
  };
}

check('goalProgress: 마일스톤이 없으면 0%', () => {
  assert.strictEqual(fns.goalProgress({ milestones: [] }), 0);
});

check('goalProgress: 4개 중 1개 완료면 25%', () => {
  assert.strictEqual(fns.goalProgress(makeGoal(['done', 'todo', 'doing', 'todo'])), 25);
});

check('goalProgress: 전부 완료면 100%', () => {
  assert.strictEqual(fns.goalProgress(makeGoal(['done', 'done'])), 100);
});

check('msCounts: 상태별 개수를 정확히 센다', () => {
  const counts = fns.msCounts(makeGoal(['done', 'done', 'doing', 'todo']));
  assert.deepStrictEqual(counts, { total: 4, todo: 1, doing: 1, done: 2 });
});

check('resultPct: target/result가 없으면 null', () => {
  assert.strictEqual(fns.resultPct(null), null);
  assert.strictEqual(fns.resultPct({ target: '', result: '' }), null);
});

check('resultPct: 5/10 -> 50%', () => {
  assert.strictEqual(fns.resultPct({ target: '10', result: '5' }), 50);
});

check('resultPct: 999%로 상한 고정', () => {
  assert.strictEqual(fns.resultPct({ target: '1', result: '100' }), 999);
});

// dDay()는 dateStr을 로컬 자정('T00:00:00')으로 파싱해 로컬 '오늘'과 비교한다.
// 기대값을 toISOString()(UTC 날짜)로 만들면 UTC 날짜가 로컬 날짜보다 뒤처지는 시간대
// (KST 기준 매일 00:00~09:00)에 하루 어긋나 실패하므로, 앱과 같은 dateKey()로 로컬 날짜를 만든다.
function localDateStr(offsetDays) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return fns.dateKey(d);
}

check('dDay: 오늘이면 D-day', () => {
  assert.strictEqual(fns.dDay(localDateStr(0)), 'D-day');
});

check('dDay: 내일이면 D-1', () => {
  assert.strictEqual(fns.dDay(localDateStr(1)), 'D-1');
});

check('computeStreakDays: 기록이 없으면 0', () => {
  fns.setRecords([]);
  assert.strictEqual(fns.computeStreakDays(), 0);
});

check('computeStreakDays: 오늘/어제/그제 연속 기록이면 3', () => {
  const startAt = d => new Date(Date.now() - d * 86400000).toISOString();
  fns.setRecords([{ startAt: startAt(0) }, { startAt: startAt(1) }, { startAt: startAt(2) }]);
  assert.strictEqual(fns.computeStreakDays(), 3);
});

check('computeStreakDays: 하루 빠지면 오늘부터의 연속만 센다', () => {
  const startAt = d => new Date(Date.now() - d * 86400000).toISOString();
  fns.setRecords([{ startAt: startAt(0) }, { startAt: startAt(2) }]);
  assert.strictEqual(fns.computeStreakDays(), 1);
});

check('findSuggestionTarget: 마일스톤 타입', () => {
  const goal = makeGoal(['todo']);
  const target = fns.findSuggestionTarget(goal, { type: 'milestone', id: 'm0' });
  assert.strictEqual(target.milestone.id, 'm0');
});

check('findSuggestionTarget: 존재하지 않는 id는 null', () => {
  const goal = makeGoal(['todo']);
  assert.strictEqual(fns.findSuggestionTarget(goal, { type: 'milestone', id: 'nope' }), null);
});

check('sanitizeSuggestions: 이미 done인 마일스톤을 done으로 바꾸는 제안은 걸러낸다', () => {
  const goal = makeGoal(['done']);
  const result = fns.sanitizeSuggestions(goal, [{ type: 'milestone', id: 'm0', field: 'status', value: 'done' }]);
  assert.strictEqual(result.length, 0);
});

check('sanitizeSuggestions: 유효한 status 변경 제안은 통과시킨다', () => {
  const goal = makeGoal(['todo']);
  const result = fns.sanitizeSuggestions(goal, [{ type: 'milestone', id: 'm0', field: 'status', value: 'done' }]);
  assert.strictEqual(result.length, 1);
});

check('applySuggestion: 마일스톤 status 변경이 실제로 반영된다', () => {
  const goal = makeGoal(['todo']);
  const ok = fns.applySuggestion(goal, { type: 'milestone', id: 'm0', field: 'status', value: 'done' });
  assert.strictEqual(ok, true);
  assert.strictEqual(goal.milestones[0].status, 'done');
});

check('applySuggestion: result가 target 이상이면 자동으로 done 처리된다', () => {
  const goal = makeGoal(['todo']);
  goal.milestones[0].result = { target: '10', result: '', unit: '회', note: '' };
  fns.applySuggestion(goal, { type: 'milestone', id: 'm0', field: 'result', value: '12' });
  assert.strictEqual(goal.milestones[0].result.result, '12');
  assert.strictEqual(goal.milestones[0].status, 'done');
});

check('describeSuggestion: status 변경 라벨을 생성한다', () => {
  const goal = makeGoal(['todo']);
  const d = fns.describeSuggestion(goal, { type: 'milestone', id: 'm0', field: 'status', value: 'done' });
  assert.ok(d.label.indexOf('완료로') !== -1);
});

check('localTodayMission: 미완료 마일스톤이 있으면 그 제목을 언급한다', () => {
  const goal = makeGoal(['done', 'todo']);
  const msg = fns.localTodayMission(goal);
  assert.ok(msg.indexOf(goal.milestones[1].title) !== -1);
});

check('localTodayMission: 전부 완료면 회고를 제안한다', () => {
  const goal = makeGoal(['done', 'done']);
  const msg = fns.localTodayMission(goal);
  assert.ok(msg.indexOf('돌아보며') !== -1);
});

check('maybeGrantStreakFreeze: 7일 연속을 달성하면 프리즈를 1개 지급한다', () => {
  const startAt = d => new Date(Date.now() - d * 86400000).toISOString();
  fns.setRecords([0, 1, 2, 3, 4, 5, 6].map(d => ({ startAt: startAt(d) })));
  fns.setStreakFreeze({ available: 0, usedDates: [], grantedTier: 0 });
  const granted = fns.maybeGrantStreakFreeze();
  assert.strictEqual(granted, true);
});

check('maybeGrantStreakFreeze: 같은 티어에서는 중복 지급하지 않는다', () => {
  const startAt = d => new Date(Date.now() - d * 86400000).toISOString();
  fns.setRecords([0, 1, 2, 3, 4, 5, 6].map(d => ({ startAt: startAt(d) })));
  fns.setStreakFreeze({ available: 1, usedDates: [], grantedTier: 1 });
  const granted = fns.maybeGrantStreakFreeze();
  assert.strictEqual(granted, false);
});

check('maybeApplyStreakFreeze: 어제를 놓쳤어도 그제 기록이 있고 프리즈가 있으면 자동 적용된다', () => {
  const startAt = d => new Date(Date.now() - d * 86400000).toISOString();
  fns.setRecords([{ startAt: startAt(0) }, { startAt: startAt(2) }]); // 어제(1)만 비어있음
  fns.setStreakFreeze({ available: 1, usedDates: [], grantedTier: 0 });
  const applied = fns.maybeApplyStreakFreeze();
  assert.strictEqual(applied, true);
});

check('maybeApplyStreakFreeze: 프리즈가 없으면 적용되지 않는다', () => {
  const startAt = d => new Date(Date.now() - d * 86400000).toISOString();
  fns.setRecords([{ startAt: startAt(0) }, { startAt: startAt(2) }]);
  fns.setStreakFreeze({ available: 0, usedDates: [], grantedTier: 0 });
  const applied = fns.maybeApplyStreakFreeze();
  assert.strictEqual(applied, false);
});

check('xpForLevel: 레벨 1은 0 XP', () => {
  assert.strictEqual(fns.xpForLevel(1), 0);
});

check('levelForXP: 경계값 미만이면 이전 레벨을 유지한다', () => {
  assert.strictEqual(fns.levelForXP(0), 1);
  assert.strictEqual(fns.levelForXP(fns.xpForLevel(3) - 1), 2);
  assert.strictEqual(fns.levelForXP(fns.xpForLevel(3)), 3);
});

check('levelProgress: 현재 레벨 구간 안에서의 진행률을 계산한다', () => {
  const p = fns.levelProgress(fns.xpForLevel(3));
  assert.strictEqual(p.level, 3);
  assert.strictEqual(p.into, 0);
  assert.strictEqual(p.pct, 0);
});

check('totalCompletedMilestones: 여러 목표에 걸친 완료 마일스톤 수를 정확히 센다', () => {
  const p = {
    goals: [
      { milestones: [{ status: 'done' }, { status: 'todo' }] },
      { milestones: [{ status: 'done' }, { status: 'done' }] },
    ],
  };
  assert.strictEqual(fns.totalCompletedMilestones(p), 3);
});

check('heatmapLevel: 기록이 없으면 0단계', () => {
  assert.strictEqual(fns.heatmapLevel(0, 5), 0);
});

check('heatmapLevel: 최댓값이면 최고 단계(4)', () => {
  assert.strictEqual(fns.heatmapLevel(5, 5), 4);
});

check('heatmapLevel: 비율에 따라 중간 단계로 나뉜다', () => {
  assert.strictEqual(fns.heatmapLevel(1, 5), 1);
  assert.strictEqual(fns.heatmapLevel(3, 5), 3);
});

check('localNextActionSuggestion: 남은 마일스톤이 있으면 그 제목을 제안한다', () => {
  const goal = makeGoal(['done', 'todo', 'doing']);
  const msg = fns.localNextActionSuggestion(goal, 'm0');
  assert.ok(msg.indexOf(goal.milestones[1].title) !== -1);
});

check('localNextActionSuggestion: 남은 마일스톤이 없으면 결과 기록을 제안한다', () => {
  const goal = makeGoal(['done']);
  const msg = fns.localNextActionSuggestion(goal, 'm0');
  assert.ok(msg.indexOf('결과를 기록') !== -1);
});

check('goalAchievement: 마일스톤이 전부 done이면 100', () => {
  assert.strictEqual(fns.goalAchievement(makeGoal(['done', 'done'])), 100);
});

check('goalAchievement: 일부만 done이면 100 미만', () => {
  assert.ok(fns.goalAchievement(makeGoal(['done', 'todo'])) < 100);
});

check('goalAchievement: 목표 자체에 수치 결과가 있으면 그 비율을 우선한다', () => {
  const goal = makeGoal(['todo']);
  goal.result = { target: '10', result: '10', unit: '회', note: '' };
  assert.strictEqual(fns.goalAchievement(goal), 100);
});

check('weeklyRecapStats: 기록이 없으면 count 0, 시간 0', () => {
  const stats = fns.weeklyRecapStats([], new Date());
  assert.strictEqual(stats.count, 0);
  assert.strictEqual(stats.totalMs, 0);
  assert.strictEqual(stats.topCategory, null);
});

check('weeklyRecapStats: 7일 이전 기록은 제외한다', () => {
  const now = new Date('2026-09-05T12:00:00.000Z');
  const old = new Date(now.getTime() - 10 * 86400000);
  const stats = fns.weeklyRecapStats([{ startAt: old.toISOString(), endAt: old.toISOString(), category: 'study' }], now);
  assert.strictEqual(stats.count, 0);
});

check('weeklyRecapStats: 이번 주 기록 시간과 최다 분야를 정확히 계산한다', () => {
  const now = new Date('2026-09-05T12:00:00.000Z');
  const recs = [
    { startAt: new Date(now.getTime() - 86400000).toISOString(), endAt: new Date(now.getTime() - 86400000 + 3600000).toISOString(), category: 'study' },
    { startAt: new Date(now.getTime() - 2 * 86400000).toISOString(), endAt: new Date(now.getTime() - 2 * 86400000 + 1800000).toISOString(), category: 'health' },
  ];
  const stats = fns.weeklyRecapStats(recs, now);
  assert.strictEqual(stats.count, 2);
  assert.strictEqual(stats.totalMs, 3600000 + 1800000);
  assert.strictEqual(stats.topCategory, 'study');
});

check('generateDynamicNotification: D-3 이내 마감 목표가 있으면 D-day 알림을 최우선한다', () => {
  const profile = {
    displayName: '테스트유저', settings: {}, records: [],
    goals: [{ title: '시험 준비', dueDate: localDateStr(2), archivedAt: null }],
  };
  const msg = fns.generateDynamicNotification(profile);
  assert.ok(msg.indexOf('[D-day 임박]') !== -1);
  assert.ok(msg.indexOf('시험 준비') !== -1);
  assert.ok(msg.indexOf('2일') !== -1);
});

check('generateDynamicNotification: 보관된 목표의 마감일은 D-day 알림에서 무시한다', () => {
  const profile = {
    displayName: '테스트유저', settings: {}, records: [],
    goals: [{ title: '지난 목표', dueDate: localDateStr(1), archivedAt: '2020-01-01T00:00:00.000Z' }],
  };
  const msg = fns.generateDynamicNotification(profile);
  assert.ok(msg.indexOf('[D-day 임박]') === -1);
});

check('generateDynamicNotification: 저녁 8시 이후 미체크인이고 어제까지 스트릭이 있으면 경보 문구', () => {
  const now = new Date(); now.setHours(21, 0, 0, 0);
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const dayBefore = new Date(now); dayBefore.setDate(dayBefore.getDate() - 2);
  const profile = {
    displayName: '테스트유저', settings: {}, goals: [],
    records: [{ startAt: yesterday.toISOString() }, { startAt: dayBefore.toISOString() }],
  };
  const msg = fns.generateDynamicNotification(profile, now);
  assert.ok(msg.indexOf('[스트릭 경보]') !== -1);
  assert.ok(msg.indexOf('2일 연속') !== -1);
});

check('generateDynamicNotification: 오늘 이미 체크인했으면 스트릭 경보를 띄우지 않는다', () => {
  const now = new Date(); now.setHours(21, 0, 0, 0);
  const profile = {
    displayName: '테스트유저', settings: {}, goals: [],
    records: [{ startAt: now.toISOString() }],
  };
  const msg = fns.generateDynamicNotification(profile, now);
  assert.ok(msg.indexOf('[스트릭 경보]') === -1);
});

check('generateDynamicNotification: 참여 중인 모임이 있으면 모임 인증 알림을 보여준다', () => {
  const now = new Date(); now.setHours(10, 0, 0, 0);
  const profile = {
    displayName: '테스트유저', goals: [], records: [],
    settings: { groupState: { g1: { joined: true } } },
  };
  const msg = fns.generateDynamicNotification(profile, now);
  assert.ok(msg.indexOf('[모임 인증]') !== -1);
  assert.ok(msg.indexOf('테스트 모임') !== -1);
  assert.ok(msg.indexOf('3회') !== -1);
});

check('generateDynamicNotification: 해당하는 조건이 없으면 기본 메시지를 보여준다', () => {
  const now = new Date(); now.setHours(10, 0, 0, 0);
  const profile = { displayName: '테스트유저', goals: [], records: [], settings: {} };
  const msg = fns.generateDynamicNotification(profile, now);
  assert.strictEqual(msg, '테스트유저님, 오늘의 성장을 기록할 시간이에요 ✨');
});

check('generateDynamicNotification: 일요일 저녁 18~22시에 기록이 있으면 위클리 리캡 문구', () => {
  const sundayEvening = new Date('2026-09-13T19:00:00'); // 2026-09-13 is Sunday
  const profile = {
    displayName: '테스트유저',
    goals: [],
    records: [{ startAt: '2026-09-10T12:00:00.000Z' }],
    settings: {}
  };
  const msg = fns.generateDynamicNotification(profile, sundayEvening);
  assert.ok(msg.indexOf('[위클리 리캡]') !== -1);
  assert.ok(msg.indexOf('이번 주 나의 성취') !== -1);
});

/* ============ 계측: 유입 속성 파싱 ============ */
check('parseAttribution: utm/ref만 추출하고 나머지 파라미터는 버린다', () => {
  const a = fns.parseAttribution('?utm_source=instagram&utm_medium=social&utm_campaign=launch&ref=user-1&goal=g1&foo=bar');
  assert.deepStrictEqual(a, { utm_source: 'instagram', utm_medium: 'social', utm_campaign: 'launch', ref: 'user-1' });
});

check('parseAttribution: 빈 값·빈 문자열·잘못된 인코딩에도 예외 없이 빈 객체를 돌려준다', () => {
  assert.deepStrictEqual(fns.parseAttribution(''), {});
  assert.deepStrictEqual(fns.parseAttribution(undefined), {});
  assert.deepStrictEqual(fns.parseAttribution('?utm_source=&ref='), {});
  assert.deepStrictEqual(fns.parseAttribution('?utm_source=%E0%A4%A&ref=ok'), { ref: 'ok' });
});

check('parseAttribution: 값은 80자로 자르고 +는 공백으로 복원한다', () => {
  const long = 'x'.repeat(200);
  const a = fns.parseAttribution('?utm_campaign=' + long + '&utm_source=kakao+talk');
  assert.strictEqual(a.utm_campaign.length, 80);
  assert.strictEqual(a.utm_source, 'kakao talk');
});

/* ============ 신고 자동 숨김: 숨김 필터 ============ */
check('filterHidden: hidden:true·null 항목은 제외하고 나머지는 순서를 유지한다', () => {
  const a = { id: 'a' };
  const b = { id: 'b', hidden: true };
  const c = { id: 'c', hidden: false };
  const result = fns.filterHidden([a, b, null, c]);
  assert.deepStrictEqual(result, [a, c]);
});

check('filterHidden: undefined나 빈 배열을 넣으면 빈 배열을 돌려준다', () => {
  assert.deepStrictEqual(fns.filterHidden(undefined), []);
  assert.deepStrictEqual(fns.filterHidden([]), []);
});

/* ============ 차단 유저 격리: filterBlockedPosts ============ */
check('filterBlockedPosts: 차단된 사용자의 글/댓글은 필터링되고 나머지는 유지된다', () => {
  const p1 = { id: 'p1', userId: 'user_good' };
  const p2 = { id: 'p2', userId: 'user_bad' };
  const p3 = { id: 'p3', userId: 'user_another' };
  const blocked = [{ id: 'user_bad', name: '나쁜유저' }];
  const res = fns.filterBlockedPosts([p1, p2, p3], blocked);
  assert.deepStrictEqual(res, [p1, p3]);
});

check('filterBlockedPosts: 문자열 ID 배열 및 null/undefined 에도 안전하다', () => {
  assert.deepStrictEqual(fns.filterBlockedPosts(undefined, ['u1']), []);
  assert.deepStrictEqual(fns.filterBlockedPosts([], []), []);
  const p1 = { id: 'p1', user_id: 'u1' };
  const p2 = { id: 'p2', user_id: 'u2' };
  assert.deepStrictEqual(fns.filterBlockedPosts([p1, p2], ['u1']), [p2]);
});

/* ============ 계측 게이트 불변식 (localStorage/location 스텁) ============ */
check('getSid: 같은 기기에서는 항상 같은 익명 id를 돌려주고 localStorage에 보존한다', () => {
  fns.getStorage().clear();
  const a = fns.getSid();
  const b = fns.getSid();
  assert.ok(typeof a === 'string' && a.length > 8);
  assert.strictEqual(a, b);
  assert.strictEqual(fns.getStorage().getItem('ourgoal_sid'), a);
  fns.getStorage().clear();
  assert.notStrictEqual(fns.getSid(), a);
});

check('getAttribution: 첫 유입만 저장하고 이후 다른 UTM으로 와도 첫 값을 유지한다(first-touch)', () => {
  fns.getStorage().clear();
  fns.setSearch('?utm_source=instagram&ref=user-1&goal=g1');
  const first = fns.getAttribution();
  assert.strictEqual(first.utm_source, 'instagram');
  assert.strictEqual(first.ref, 'user-1');
  assert.ok(first.landed_at && !isNaN(Date.parse(first.landed_at)));
  assert.strictEqual(first.goal, undefined);
  fns.setSearch('?utm_source=tiktok');
  assert.strictEqual(fns.getAttribution().utm_source, 'instagram');
});

check('getAttribution: UTM 없는 오가닉 방문은 아무것도 저장하지 않고, localStorage가 깨져도 예외 없이 빈 객체', () => {
  fns.getStorage().clear();
  fns.setSearch('');
  assert.deepStrictEqual(fns.getAttribution(), {});
  assert.strictEqual(fns.getStorage().getItem('ourgoal_attrib'), null);
  const st = fns.getStorage();
  const saved = st.getItem;
  st.getItem = function(){ throw new Error('storage disabled'); };
  try {
    fns.setSearch('?utm_source=x');
    assert.deepStrictEqual(fns.getAttribution(), {});
  } finally {
    st.getItem = saved;
  }
});

/* ============ 온보딩 첫 기록 ============ */
check('buildCheckinRecord: 목표가 있으면 category를 물려받고 type=note·startAt=endAt(ISO)·id 비어있지 않음', () => {
  const goal = { category: 'health' };
  const rec = fns.buildCheckinRecord('헬스장 등록하고 왔다', goal);
  assert.strictEqual(rec.type, 'note');
  assert.strictEqual(rec.category, 'health');
  assert.strictEqual(rec.visibility, 'private');
  assert.ok(rec.id && String(rec.id).length > 0);
  assert.strictEqual(rec.startAt, rec.endAt);
  assert.ok(!isNaN(Date.parse(rec.startAt)));
});

check('buildCheckinRecord: 목표가 없으면 category는 null, visibility는 private', () => {
  const rec = fns.buildCheckinRecord('오늘의 기록', null);
  assert.strictEqual(rec.category, null);
  assert.strictEqual(rec.visibility, 'private');
});

/* ============ 최초 로그인 시 모든 공개 범위 비공개 ('private') ============ */
check('defaultSettings: 최초 로그인 기본 설정에서 모든 공개 범위(goals, calendar, records, stats)가 private이다', () => {
  const s = fns.defaultSettings();
  assert.ok(s.privacy, 'privacy 설정 객체 존재');
  assert.strictEqual(s.privacy.goals, 'private');
  assert.strictEqual(s.privacy.calendar, 'private');
  assert.strictEqual(s.privacy.records, 'private');
  assert.strictEqual(s.privacy.stats, 'private');
});

check('getPrivacyLabel: 기본값 및 private는 🔒 나만 보기를 반환하고, team 및 public을 올바르게 매핑한다', () => {
  assert.strictEqual(fns.getPrivacyLabel('private'), '🔒 나만 보기');
  assert.strictEqual(fns.getPrivacyLabel('team'), '👥 모임원');
  assert.strictEqual(fns.getPrivacyLabel('public'), '🌐 전체 공개');
  assert.strictEqual(fns.getPrivacyLabel(undefined), '🔒 나만 보기');
  assert.strictEqual(fns.getPrivacyLabel(null), '🔒 나만 보기');
});

/* ============ PWA 앱 배지 (불변식: 미지원 환경 no-op·throw 없음 / 스트릭>0 → 숫자 / 0 → clear) ============ */
check('updateAppBadge: 스트릭이 있으면 아이콘 배지에 그 숫자를 설정한다', () => {
  assert.strictEqual(fns.updateAppBadge(7), true);
  assert.strictEqual(fns.getNavigator().badge, 7);
});

check('updateAppBadge: 스트릭 0·음수·비숫자면 배지를 지운다', () => {
  fns.updateAppBadge(3);
  assert.strictEqual(fns.updateAppBadge(0), true);
  assert.strictEqual(fns.getNavigator().badge, 0);
  fns.updateAppBadge(3);
  fns.updateAppBadge(undefined);
  assert.strictEqual(fns.getNavigator().badge, 0);
});

check('updateAppBadge: Badging API가 없는 환경에서는 예외 없이 false를 돌려준다', () => {
  const saved = fns.getNavigator();
  try {
    fns.setNavigator({});
    assert.strictEqual(fns.updateAppBadge(5), false);
    fns.setNavigator(null);
    assert.strictEqual(fns.updateAppBadge(5), false);
  } finally {
    fns.setNavigator(saved);
  }
});

/* ============ 캘린더 가용성 게이팅 ============ */
check('calendarAvailable: 앱/사용자 ID가 모두 비어 있거나 공백만이면 false', () => {
  assert.strictEqual(fns.calendarAvailable('', {}), false);
  assert.strictEqual(fns.calendarAvailable('  ', { gcalClientId: '  ' }), false);
});

check('calendarAvailable: 앱 ID 또는 사용자 ID 중 하나라도 있으면 true (settings null 포함)', () => {
  assert.strictEqual(fns.calendarAvailable('', { gcalClientId: 'x' }), true);
  assert.strictEqual(fns.calendarAvailable('app', {}), true);
  assert.strictEqual(fns.calendarAvailable('app', null), true);
});

/* ============ 기록 검색 (성장 백로그 P0 9) ============ */
check('filterRecordsByQuery: 검색어가 비어있으면 전체 목록을 그대로 돌려준다', () => {
  const recs = [{ id: 'a', text: '헬스장 다녀옴', startAt: '2020-03-15T10:00:00' }];
  assert.strictEqual(fns.filterRecordsByQuery(recs, ''), recs);
  assert.strictEqual(fns.filterRecordsByQuery(recs, '   '), recs);
});

check('filterRecordsByQuery: 본문 텍스트를 대소문자 구분 없이 부분일치로 찾는다', () => {
  const a = { id: 'a', text: '토익 RC 30문제 풀이', startAt: '2020-03-15T10:00:00' };
  const b = { id: 'b', text: '헬스장 다녀옴', startAt: '2020-03-16T10:00:00' };
  assert.deepStrictEqual(fns.filterRecordsByQuery([a, b], 'rc'), [a]);
  assert.deepStrictEqual(fns.filterRecordsByQuery([a, b], '헬스'), [b]);
});

check('filterRecordsByQuery: 날짜(월/일 라벨·dateKey)로도 찾는다', () => {
  const a = { id: 'a', text: '아무 내용', startAt: '2020-03-15T10:00:00' };
  const b = { id: 'b', text: '아무 내용', startAt: '2020-04-20T10:00:00' };
  assert.deepStrictEqual(fns.filterRecordsByQuery([a, b], '3월'), [a]);
  assert.deepStrictEqual(fns.filterRecordsByQuery([a, b], '2020-04'), [b]);
});

check('filterRecordsByQuery: 분야(TOPICS 라벨)로도 찾고, 일치하는 게 없으면 빈 배열', () => {
  const a = { id: 'a', text: '아무 내용', category: 'workout', startAt: '2020-03-15T10:00:00' };
  const b = { id: 'b', text: '아무 내용', startAt: '2020-03-16T10:00:00' };
  assert.deepStrictEqual(fns.filterRecordsByQuery([a, b], '운동'), [a]);
  assert.deepStrictEqual(fns.filterRecordsByQuery([a, b], '존재하지않는검색어'), []);
});

/* ============ 결과 요약 ============ */
console.log('');
/* ── 랜딩 진입 게이트 (AUD-8) ────────────────────────────────────────
   부트 IIFE 안에 있던 로직을 recordLanding 으로 뺀 뒤 불변식을 고정한다.
   핵심은 "유입 저장"과 "하루 1회 조회 기록"의 주기가 다르다는 것이다. */

check('recordLanding: 첫 방문이면 유입을 저장하고 landing_view도 기록한다', () => {
  fns.getStorage().clear();
  fns.setSearch('');
  const r = fns.recordLanding('?utm_source=instagram&utm_campaign=launch', '2026-09-08');
  assert.strictEqual(r.attrib.utm_source, 'instagram');
  assert.strictEqual(r.attrib.utm_campaign, 'launch');
  assert.strictEqual(r.viewed, true);
  assert.strictEqual(fns.getStorage().getItem('ourgoal_lv_day'), '2026-09-08');
});

check('recordLanding: lv_day가 오늘이어도 ?utm_source 유입은 저장된다 (AUD-8 회귀)', () => {
  const st = fns.getStorage();
  st.clear();
  fns.setSearch('');
  /* 오늘 이미 랜딩을 본 상태 — 유입 기록은 아직 없다 */
  st.setItem('ourgoal_lv_day', '2026-09-08');
  const r = fns.recordLanding('?utm_source=youtube&ref=friend-1', '2026-09-08');
  /* landing_view 는 하루 1회라 안 남지만, 유입은 반드시 잡혀야 한다 */
  assert.strictEqual(r.viewed, false, 'landing_view는 하루 1회여야 한다');
  assert.strictEqual(r.attrib.utm_source, 'youtube', '오늘 이미 방문했어도 유입은 저장되어야 한다');
  const saved = JSON.parse(st.getItem('ourgoal_attrib'));
  assert.strictEqual(saved.utm_source, 'youtube');
  assert.strictEqual(saved.ref, 'friend-1');
});

check('recordLanding: 첫 유입(first-touch)만 보존하고 나중 유입으로 덮어쓰지 않는다', () => {
  const st = fns.getStorage();
  st.clear();
  fns.setSearch('');
  fns.recordLanding('?utm_source=instagram', '2026-09-08');
  const r = fns.recordLanding('?utm_source=naver', '2026-09-09');
  assert.strictEqual(r.attrib.utm_source, 'instagram', '첫 유입이 유지되어야 한다');
  assert.strictEqual(JSON.parse(st.getItem('ourgoal_attrib')).utm_source, 'instagram');
});

check('recordLanding: 유입 파라미터가 없어도 예외 없이 하루 1회 게이트만 동작한다', () => {
  const st = fns.getStorage();
  st.clear();
  fns.setSearch('');
  const a = fns.recordLanding('', '2026-09-08');
  assert.deepStrictEqual(a.attrib, {});
  assert.strictEqual(a.viewed, true);
  const b = fns.recordLanding('', '2026-09-08');
  assert.strictEqual(b.viewed, false, '같은 날 두 번째 진입은 기록하지 않는다');
});



/* ── docs/sql 문법 검사 (실행계획 순서 37, AUD-7) ──────────────────────
   SQL 은 사람이 Supabase 콘솔에 붙여넣어야 실행돼서 CI 가 돌려보지 못한다.
   2026-09-08 에 실제로 42601 로 붙여넣기가 통째로 실패했다.
   실행은 못 해도 **읽어서 잡을 수 있는 실수**는 병합 전에 잡는다. */
const { lintSql } = require('./sql-lint');

check('sql-lint: 마지막 문장의 세미콜론 누락을 잡는다', () => {
  const p = lintSql('create table t (id int);\nalter table t add column x int');
  assert.ok(p.some(m => m.includes('세미콜론')), '세미콜론 누락을 못 잡았다: ' + JSON.stringify(p));
});

check('sql-lint: 달러 인용($$) 짝 불일치를 잡는다', () => {
  const p = lintSql('create function f() returns int language plpgsql as $$ begin return 1; end;');
  assert.ok(p.some(m => m.includes('달러 인용')), '달러 인용 불일치를 못 잡았다: ' + JSON.stringify(p));
});

check('sql-lint: create policy 뒤 on <테이블> 누락을 잡는다', () => {
  const p = lintSql('create policy "p" for select using (true);');
  assert.ok(p.some(m => m.includes('on <테이블>')), 'on 누락을 못 잡았다: ' + JSON.stringify(p));
});

check('sql-lint: 괄호 짝 불일치를 잡는다', () => {
  const p = lintSql('create table t (id int;');
  assert.ok(p.some(m => m.includes('괄호')), '괄호 불일치를 못 잡았다: ' + JSON.stringify(p));
});

check('sql-lint: 정상 SQL 은 통과시킨다 (거짓 경보 없음)', () => {
  const ok = 'create table if not exists t (id int);\n'
    + 'create policy "p" on t for select using (true);\n'
    + 'create function f() returns int language plpgsql as $fn$ begin return 1; end; $fn$;\n'
    + '-- 주석의 세미콜론(;) 과 따옴표는 무시된다\n'
    + 'insert into t values (1); -- 끝';
  assert.deepStrictEqual(lintSql(ok), []);
});

check('docs/sql 의 모든 .sql 파일이 문법 검사를 통과한다', () => {
  const dir = path.join(__dirname, '..', 'docs', 'sql');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));
  assert.ok(files.length > 0, 'docs/sql 에 .sql 파일이 없다');
  const bad = [];
  for (const f of files) {
    const problems = lintSql(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (problems.length) bad.push(f + ': ' + problems.join(' / '));
  }
  assert.deepStrictEqual(bad, [], '문법 문제가 있는 SQL 파일: ' + bad.join(' | '));
});

/* ── 신고 스키마 검증기 판정 (실행계획 순서 24) ─────────────────────────
 * 네트워크는 타지 않는다. classify() 가 PostgREST 오류 코드를 올바르게 '미적용'으로 읽는지만 본다.
 * 2026-09-08 에 '완료' 표시된 항목이 실제로는 서버가 없었던 일이 있어, 판정 규칙 자체를 고정한다. */
const { classify: classifyReportSchema } = require('./verify-report-schema');

check('verify-report-schema: 42703(컬럼 없음)·PGRST205·PGRST202 는 미적용', () => {
  assert.strictEqual(classifyReportSchema(400, { code: '42703' }).applied, false);
  assert.strictEqual(classifyReportSchema(404, { code: 'PGRST205' }).applied, false);
  assert.strictEqual(classifyReportSchema(404, { code: 'PGRST202' }).applied, false);
});

check('verify-report-schema: 200 과 42501(anon 실행 거부) 은 적용', () => {
  assert.strictEqual(classifyReportSchema(200, []).applied, true);
  assert.strictEqual(classifyReportSchema(401, { code: '42501' }).applied, true);
});

check('verify-report-schema: 예상 밖 응답은 적용/미적용이 아니라 판정불가(null)', () => {
  assert.strictEqual(classifyReportSchema(500, null).applied, null);
});

/* ── Gate 1 컴플라이언스 & 런칭 요건 (순서 41~44) ─────────────────────── */
check('compliance: docs/legal/privacy.md 및 terms.md 가 존재하고 필수 조항을 포함한다', () => {
  const privPath = path.join(__dirname, '..', 'docs', 'legal', 'privacy.md');
  const termsPath = path.join(__dirname, '..', 'docs', 'legal', 'terms.md');
  assert.ok(fs.existsSync(privPath), 'privacy.md 파일 존재');
  assert.ok(fs.existsSync(termsPath), 'terms.md 파일 존재');

  const priv = fs.readFileSync(privPath, 'utf8');
  assert.ok(priv.includes('개인정보처리방침'), '개인정보처리방침 제목 포함');
  assert.ok(priv.includes('파기'), '파기 절차 포함');
  assert.ok(priv.includes('ysm0422@naver.com'), '보호책임자 연락처 포함');

  const terms = fs.readFileSync(termsPath, 'utf8');
  assert.ok(terms.includes('이용약관'), '이용약관 제목 포함');
  assert.ok(terms.includes('회원 탈퇴'), '회원 탈퇴 조항 포함');
  assert.ok(terms.includes('면책'), '면책 조항 포함');
});

check('compliance: index.html 에 회원탈퇴·약관·문의·버전 마커가 존재한다', () => {
  assert.ok(html.includes('id="withdrawBtn"'), '회원 탈퇴 버튼 마커');
  assert.ok(html.includes('id="feedbackInquiryBtn"'), '1:1 고객 문의 버튼 마커');
  assert.ok(html.includes('id="viewTermsBtn"'), '약관 보기 버튼 마커');
  assert.ok(html.includes('id="viewPrivacyBtn"'), '방침 보기 버튼 마커');
  assert.ok(html.includes('v1.0.0'), '앱 버전 v1.0.0 표기');
  assert.ok(html.includes('ysm0422@naver.com'), '고객지원 이메일 표기');
  assert.ok(html.includes('withdrawAccount'), '회원 탈퇴 함수 구현');
  assert.ok(html.includes('showLegalModal'), '약관 모달 뷰어 함수 구현');
});

check('compliance: api/withdraw.js 가 유효한 핸들러 모듈이다', () => {
  const handler = require('../api/withdraw.js');
  assert.strictEqual(typeof handler, 'function', 'api/withdraw.js 핸들러 함수 존재');
});

/* ── 전문적(내 전용 템플릿) 기록하기 & 일정 연동 단위 테스트 ─────────────────────── */
check('fmtYYMMDD: 날짜를 6자리 YYMMDD 형식으로 정확히 변환한다', () => {
  assert.strictEqual(fns.fmtYYMMDD('2026-09-10T12:00:00Z'), '260910');
  assert.strictEqual(fns.fmtYYMMDD('2026-01-05T09:30:00Z'), '260105');
  assert.strictEqual(fns.fmtYYMMDD('2026-12-31T23:59:59Z'), '261231');
});

check('recommendTemplateFromAI: 헬스 입력 시 운동종목, 세트, 횟수, 시간, 거리, 강도(100점) 컬럼을 추천한다', () => {
  const res = fns.recommendTemplateFromAI('헬스');
  assert.strictEqual(res.title, '헬스');
  assert.strictEqual(res.icon, '🏋️');
  assert.strictEqual(res.theme, 'workout');
  assert.deepStrictEqual(res.columns, ['번호', '운동종목', '세트', '횟수', '시간', '거리', '강도(100점)']);
  assert.ok(res.defaultRows.length >= 1, '최소 1개 이상의 기본 예시 행 제공');
});

check('recommendTemplateFromAI: 하이록스, 공부, 영업 등 테마별 특화 속성을 지능형으로 추천한다', () => {
  const hyrox = fns.recommendTemplateFromAI('하이록스');
  assert.strictEqual(hyrox.title, '하이록스');
  assert.ok(hyrox.columns.includes('종목/스테이션'));
  assert.ok(hyrox.columns.includes('심박수'));
  assert.ok(hyrox.columns.includes('페이스'));

  const study = fns.recommendTemplateFromAI('공부');
  assert.strictEqual(study.title, '공부');
  assert.ok(study.columns.includes('과목/주제'));
  assert.ok(study.columns.includes('공부시간(분)'));
  assert.ok(study.columns.includes('집중도(100점)'));

  const biz = fns.recommendTemplateFromAI('영업');
  assert.strictEqual(biz.title, '영업');
  assert.ok(biz.columns.includes('고객/사명'));
  assert.ok(biz.columns.includes('제안금액'));
  assert.ok(biz.columns.includes('계약가능성(%)'));
});

check('compliance: 전문적(내 전용 템플릿) 기록하기 UI 요소 및 안내멘트가 존재한다', () => {
  assert.ok(html.includes('id="recProTemplateCard"'), '전문 템플릿 카드 존재');
  assert.ok(html.includes('id="recOpenProTemplateBtn"'), '맞춤 기록창 열기 버튼 존재');
  assert.ok(html.includes('id="recQuickTemplateChips"'), '퀵 템플릿 칩 컨테이너 존재');
  assert.ok(html.includes('맞춤형으로 생성됩니다. 일자별로 그기록을 저장하고 일정과 연동할 수 있습니다.'), '생성 안내멘트 포함');
  assert.ok(html.includes('*일정연동 저장은 오늘 기록이 링크화되어 일정에 기록됩니다.'), '일정연동 안내멘트 포함');
});

check('compliance: 전문 템플릿 모달, 속성 편집, 상세 조회 및 일정 링크 딥링크 함수가 존재한다', () => {
  assert.ok(html.includes('openProTemplateRecordModal'), 'openProTemplateRecordModal 함수 구현');
  assert.ok(html.includes('openCreateCustomTemplateModal'), 'openCreateCustomTemplateModal 함수 구현');
  assert.ok(html.includes('openTemplateColumnEditModal'), 'openTemplateColumnEditModal 함수 구현');
  assert.ok(html.includes('openTemplateRecordDetailModal'), 'openTemplateRecordDetailModal 함수 구현');
  assert.ok(html.includes('checkRecordDeepLink'), 'checkRecordDeepLink 함수 구현');
  assert.ok(html.includes('pro-notion-table'), '노션 표 스타일 CSS 클래스 존재');
  assert.ok(html.includes('data-calviewrec'), '캘린더 일정에 기록 보기 링크 버튼 연동');
});

check('computeTableAnalytics: 헬스/운동 템플릿의 총 볼륨(kg)과 총 세트를 정확히 집계한다', () => {
  const tpl = { title: '헬스', theme: 'workout' };
  const cols = ['번호', '운동종목', '세트', '횟수', '무게(kg)'];
  const rows = [
    ['1', '벤치프레스', '4', '10', '60'],
    ['2', '스쿼트', '5', '5', '100'],
  ];
  const res = fns.computeTableAnalytics(tpl, cols, rows);
  const vol = res.stats.find(s => s.label === '총 볼륨');
  const sets = res.stats.find(s => s.label === '총 세트');
  const items = res.stats.find(s => s.label === '운동 종목');

  assert.ok(vol, '총 볼륨 통계 존재');
  // 4*10*60 = 2400, 5*5*100 = 2500 -> 4900 kg
  assert.strictEqual(vol.value, '4,900 kg');
  assert.ok(sets, '총 세트 통계 존재');
  assert.strictEqual(sets.value, '9 세트');
  assert.ok(items, '운동 종목 통계 존재');
  assert.strictEqual(items.value, '2 개');
});

check('computeTableAnalytics: 공부 템플릿의 총 학습시간과 평균 집중도를 정확히 집계한다', () => {
  const tpl = { title: '공부', theme: 'study' };
  const cols = ['번호', '과목/주제', '공부시간(분)', '집중도(100점)'];
  const rows = [
    ['1', '수학', '90', '90'],
    ['2', '영어', '60', '80'],
  ];
  const res = fns.computeTableAnalytics(tpl, cols, rows);
  const time = res.stats.find(s => s.label === '총 학습시간');
  const score = res.stats.find(s => s.label === '평균 집중도');

  assert.ok(time, '총 학습시간 통계 존재');
  assert.strictEqual(time.value, '2시간 30분');
  assert.ok(score, '평균 집중도 통계 존재');
  assert.strictEqual(score.value, '85점');
});

check('computeTableAnalytics: 영업 템플릿의 총 파이프라인 금액과 가중 예상매출을 정확히 계산한다', () => {
  const tpl = { title: '영업', theme: 'business' };
  const cols = ['번호', '고객/사명', '제안금액', '계약가능성(%)'];
  const rows = [
    ['1', '(주)에이비씨', '1,500만원', '80%'],
    ['2', '(주)디이에프', '500만원', '60%'],
  ];
  const res = fns.computeTableAnalytics(tpl, cols, rows);
  const pipe = res.stats.find(s => s.label === '총 파이프라인');
  const exp = res.stats.find(s => s.label === '가중 예상매출');

  assert.ok(pipe, '총 파이프라인 통계 존재');
  assert.strictEqual(pipe.value, '2,000만원');
  assert.ok(exp, '가중 예상매출 통계 존재');
  // 1500 * 0.8 = 1200, 500 * 0.6 = 300 -> 1500만원
  assert.strictEqual(exp.value, '1,500만원');
});

check('compliance: 4대 혁신 기능(자동 통계, 1초 루틴 로드, AI 프로 코치, Notion 연동) 및 캘린더 일자 수정 허브 모달이 모두 구현되어 있다', () => {
  assert.ok(html.includes('computeTableAnalytics'), '실시간 자동 통계 엔진 존재');
  assert.ok(html.includes('pro-analytics-banner'), '실시간 통계 배너 CSS 클래스 존재');
  assert.ok(html.includes('id="proQuickLoadBtn"'), '1초 루틴 불러오기 버튼 존재');
  assert.ok(html.includes('openProCoachReportModal'), 'AI 프로 코치 리포트 함수 구현');
  assert.ok(html.includes('openProNotionExportModal'), '노션 표 직수출/클립보드 복사 함수 구현');
  assert.ok(html.includes('openCalendarDayEditHubModal'), '캘린더 일자 수정/관리 허브 모달 함수 구현');
  assert.ok(html.includes('id="hubAddProRecBtn"'), '캘린더 허브 모달 내 맞춤기록 작성 버튼 존재');
  assert.ok(html.includes('.cal-pill.tpl'), '템플릿 기록 전용 캘린더 필 클래스 적용');
});

check('recommendTemplateFromAI: 크로스핏과 하이록스를 엄격히 분리하고 하이록스는 8대 공식 스테이션을 모두 제공한다', () => {
  // 크로스핏 분리 검증
  const cf = fns.recommendTemplateFromAI('크로스핏');
  assert.strictEqual(cf.title, '크로스핏');
  assert.strictEqual(cf.icon, '🔥');
  assert.ok(cf.columns.includes('WOD 운동종목'));
  assert.ok(cf.columns.includes('Rx/Scaled'));
  assert.ok(cf.defaultRows.length >= 6, 'Fran WOD 6개 행 제공');

  // 하이록스 8대 공식 종목 검증
  const hyrox = fns.recommendTemplateFromAI('하이록스');
  assert.strictEqual(hyrox.title, '하이록스');
  assert.strictEqual(hyrox.icon, '🏃');
  assert.strictEqual(hyrox.defaultRows.length, 9, '8대 공식 기능성 스테이션 + 1km 러닝 = 총 9행');
  const stations = hyrox.defaultRows.map(r => r[1]);
  assert.ok(stations.some(s => s.includes('러닝')), '1km 러닝 포함');
  assert.ok(stations.some(s => s.includes('SkiErg')), 'SkiErg 포함');
  assert.ok(stations.some(s => s.includes('Sled Push')), 'Sled Push 포함');
  assert.ok(stations.some(s => s.includes('Sled Pull')), 'Sled Pull 포함');
  assert.ok(stations.some(s => s.includes('Burpee Broad Jumps')), 'Burpee Broad Jumps 포함');
  assert.ok(stations.some(s => s.includes('Rowing')), 'Rowing 포함');
  assert.ok(stations.some(s => s.includes('Farmers Carry')), 'Farmers Carry 포함');
  assert.ok(stations.some(s => s.includes('Sandbag Lunges')), 'Sandbag Lunges 포함');
  assert.ok(stations.some(s => s.includes('Wall Balls')), 'Wall Balls 포함');
});

check('recommendTemplateFromAI: 세부 입력(자격증, 주식 등)을 통합 테마로 뭉개지 않고 맞춤 유지한다', () => {
  const exam = fns.recommendTemplateFromAI('공인중개사 민법');
  assert.strictEqual(exam.title, '공인중개사 민법');
  assert.strictEqual(exam.icon, '📝');
  assert.ok(exam.columns.includes('문제번호/범위'));
  assert.ok(exam.columns.includes('오답원인/핵심개념'));

  const stock = fns.recommendTemplateFromAI('주식 매매일지');
  assert.strictEqual(stock.title, '주식 매매일지');
  assert.strictEqual(stock.icon, '📈');
  assert.ok(stock.columns.includes('종목명/티커'));
  assert.ok(stock.columns.includes('매수가'));
  assert.ok(stock.columns.includes('수익률(%)'));
});

check('parseNaturalLanguageTemplateSpec: 줄글 설명으로부터 열 속성과 행 데이터를 자연어로 맞춤 파싱한다', () => {
  const prose = "열은 '운동종목, 무게(lb), 횟수, 타임캡, Rx 여부'로 해주고 행은 Fran 기준으로 쓰러스터 21-15-9와 풀업 넣어줘";
  const parsed = fns.parseNaturalLanguageTemplateSpec('크로스핏', prose, [], []);
  assert.ok(parsed.columns.includes('운동종목'));
  assert.ok(parsed.columns.includes('무게(lb)'));
  assert.ok(parsed.columns.includes('Rx 여부'));
  assert.strictEqual(parsed.defaultRows.length, 6, 'Fran 와드 6행 자동 생성');
  assert.ok(parsed.explanation.length > 0, 'AI 분석 설명문 제공');
});

check('parseCsvText: 콤마 및 탭 구분 텍스트를 2차원 배열로 안전하게 파싱한다', () => {
  const csv = '운동종목,세트,횟수,무게\n벤치프레스,4,10,60kg\n"스쿼트, 파워",5,5,100kg';
  const parsed = fns.parseCsvText(csv);
  assert.strictEqual(parsed.length, 3);
  assert.strictEqual(parsed[0][0], '운동종목');
  assert.strictEqual(parsed[2][0], '스쿼트, 파워');
});

check('compliance: 엑셀/CSV 가져오기·내보내기, 스마트워치 연동, 목표 3각 추적 엔진이 구현되어 있다', () => {
  assert.ok(html.includes('downloadTableAsCsv'), 'CSV 다운로드 함수 존재');
  assert.ok(html.includes('openCsvImportModal'), 'CSV 가져오기 모달 함수 존재');
  assert.ok(html.includes('openWearableSyncModal'), '스마트워치 연동 모달 함수 존재');
  assert.ok(html.includes('syncRecordToMatchingGoals'), '목표 3각 자동 추적 엔진 함수 존재');
  assert.ok(html.includes('id="proCsvImportBtn"'), 'CSV 가져오기 버튼 마크업 존재');
  assert.ok(html.includes('id="proCsvExportBtn"'), 'CSV 내보내기 버튼 마크업 존재');
  assert.ok(html.includes('id="proWearableSyncBtn"'), '스마트워치 연동 버튼 마크업 존재');
  assert.ok(html.includes('id="customTplProseInput"'), '줄글 설명 입력창 마크업 존재');
  assert.ok(html.includes('quick-prose-chip'), '줄글 설명 퀵 칩 클래스 존재');
  assert.ok(html.includes('id="customTplTablePreview"'), '실시간 표 미리보기 컨테이너 존재');
});

check('compliance: 다른 기기 원격 로그아웃, 마일스톤·할일 마감일/D-day 및 결과입력 AI 비서가 구현되어 있다', () => {
  // 1. 원격 로그아웃 실시간 엔진
  assert.ok(html.includes('checkRemoteSessionRevoked'), '원격 세션 무효화 검증 함수 존재');
  assert.ok(html.includes('getDeviceId'), '기기 식별자 함수 존재');
  assert.ok(html.includes('getDeviceLoginTime'), '기기 로그인 시각 조회 함수 존재');
  assert.ok(html.includes('setupUserSessionRealtime'), '유저 세션 Realtime 브로드캐스트 리스너 존재');
  assert.ok(html.includes('id="logoutOtherDevicesBtn"'), '다른 기기 원격 로그아웃 버튼 마크업 존재');
  assert.ok(html.includes('signOut({ scope: \'others\' })'), 'Supabase GoTrue others 세션 무효화 호출 존재');
  assert.ok(html.includes('ourgoal_remote_logout_trigger'), '동일 브라우저 타 탭 연동 트리거 존재');

  // 2. 마일스톤 및 할일 마감일과 D-day 표시
  assert.ok(html.includes('taskDueHtml'), '할 일 마감일/D-day 렌더링 로직 존재');
  assert.ok(html.includes('msDueHtml'), '마일스톤 마감일/D-day 렌더링 로직 존재');
  assert.ok(html.includes('📅 마감일'), '마감일 레이블 렌더링 존재');

  // 3. 참고자료 옆 단독 AI 결과 버튼 제거 확인
  assert.strictEqual(html.includes('data-taskaires'), false, '할 일의 참고자료 옆 AI 결과 버튼이 제거됨');
  assert.strictEqual(html.includes('data-msaires'), false, '마일스톤의 참고자료 옆 AI 결과 버튼이 제거됨');

  // 4. 결과입력 모달 내 AI 비서 & Notion DB 구조화 및 수동입력 탑재 확인
  assert.strictEqual(html.includes('rsAiQuickBtn'), false, '상세 대화로 열기 버튼 삭제됨');
  assert.ok(html.includes('rsAiQuickInput'), '결과입력 모달 내 AI 자연어 한줄 입력창 존재');
  assert.ok(html.includes('rsAiQuickApplyBtn'), '결과입력 모달 내 AI 변환 버튼 존재');
  assert.ok(html.includes('rsManualToggleBtn'), '결과입력 모달 내 수동입력하기 토글 존재');
  assert.ok(html.includes('오늘 달성한 내용을 줄글로 적어주시면 DB화에 알맞게 바꿔드려요(향후 데이터 활용우수)'), '지정된 AI 설명 문구 정확성');
  assert.ok(html.includes('convertTextToNotionDbRecord'), 'Notion DB 구조화 변환 함수 존재');
});

check('parseVoiceToTableRow: 헬스 및 운동 음성 문장에서 종목, 무게, 횟수, 세트를 추출하여 표 열에 맞춤 매핑한다', () => {
  const cols = ['번호', '운동종목', '세트', '무게', '횟수', '시간', '거리', '강도(100점)'];
  const tpl = { title: '헬스' };
  const row = fns.parseVoiceToTableRow('벤치프레스 80kg 10회 3세트 45분', tpl, cols);
  assert.ok(Array.isArray(row), '배열 반환');
  assert.strictEqual(row.length, cols.length, '열 개수 일치');
  assert.strictEqual(row[0], '1', '첫 번호 기본값');
  assert.ok(row[1].includes('벤치프레스'), '종목명 추출');
  assert.strictEqual(row[2], '3', '세트수 추출');
  assert.strictEqual(row[3], '80kg', '무게 추출');
  assert.strictEqual(row[4], '10', '횟수 추출');
  assert.strictEqual(row[5], '45분', '시간 추출');
});

check('parseVoiceToTableRow: 크로스핏 및 공부 음성 문장을 정확히 인식하여 표 열에 배치한다', () => {
  const cfCols = ['구간', '운동종목', '무게(lb)', '목표횟수', '수행시간', 'Rx여부'];
  const cfTpl = { title: '크로스핏' };
  const cfRow = fns.parseVoiceToTableRow('쓰러스터 45파운드 21개 5분 알엑스', cfTpl, cfCols);
  assert.ok(cfRow[1].includes('쓰러스터'), '쓰러스터 종목명 추출');
  assert.strictEqual(cfRow[2], '45lb', '파운드 단위 추출');
  assert.strictEqual(cfRow[3], '21', '횟수 추출');
  assert.strictEqual(cfRow[4], '5분', '시간 추출');
  assert.strictEqual(cfRow[5], 'Rx', 'Rx 인식');

  const studyCols = ['번호', '과목명', '소요시간', '페이지', '집중도'];
  const studyTpl = { title: '공부' };
  const studyRow = fns.parseVoiceToTableRow('민법 50분 15페이지 90점', studyTpl, studyCols);
  assert.ok(studyRow[1].includes('민법'), '과목명 추출');
  assert.strictEqual(studyRow[2], '50분', '공부 시간 추출');
  assert.strictEqual(studyRow[3], '15', '페이지수 추출');
  assert.strictEqual(studyRow[4], '90', '점수/집중도 추출');
});

check('compliance: AI 비전 OCR, 음성 입력, 템플릿 마켓플레이스 및 큐레이션 데이터가 완벽하게 구현되어 있다', () => {
  // 1. AI Vision OCR
  assert.ok(html.includes('compressImageForVision'), '클라이언트 캔버스 압축 함수 존재');
  assert.ok(html.includes('getVisionDailyQuota'), '비전 일일 쿼터 함수 존재');
  assert.ok(html.includes('openVisionTableModal'), 'AI 비전 OCR 모달 함수 존재');
  assert.ok(html.includes('id="proVisionOcrBtn"'), '모달 내 AI 사진인식 버튼 마크업 존재');

  // 2. Voice-to-Table
  assert.ok(html.includes('openVoiceTableModal'), '음성 인식 모달 함수 존재');
  assert.ok(html.includes('id="proVoiceInputBtn"'), '모달 내 음성 입력 버튼 마크업 존재');
  assert.ok(html.includes('voice-wave-ring'), '음성 파동 애니메이션 클래스 존재');

  // 3. Template Marketplace
  assert.ok(html.includes('CURATED_MARKET_TEMPLATES'), '템플릿 마켓 큐레이션 데이터 존재');
  assert.ok(html.includes('openTemplateMarketModal'), '템플릿 마켓플레이스 모달 함수 존재');
  assert.ok(html.includes('id="proTplMarketBtn"'), '기록 모달 내 마켓 버튼 마크업 존재');
  assert.ok(html.includes('id="recOpenMarketQuickBtn"'), '기록 탭 내 마켓 퀵 버튼 마크업 존재');

  // 4. API vision-table.js
  const fs = require('fs');
  assert.ok(fs.existsSync('api/vision-table.js'), 'api/vision-table.js 서버리스 함수 파일 존재');
});

check('triggerHaptic: 진동 지원 시 지정/기본 밀리초로 진동을 실행하고 true를 반환한다', () => {
  assert.strictEqual(fns.triggerHaptic(), true, '기본 호출 true');
  const nav = fns.getNavigator();
  assert.strictEqual(nav._vib, 12, '기본 12ms');
  fns.triggerHaptic(50);
  assert.strictEqual(nav._vib, 50, '지정 50ms');
});

check('reorderMilestones: 마일스톤 순서를 올바르게 교체하고 경계 밖 인덱스에는 원본을 보존한다', () => {
  const goal = { milestones: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }] };
  const res = fns.reorderMilestones(goal, 0, 2);
  assert.strictEqual(goal.milestones[0].id, 'm2');
  assert.strictEqual(goal.milestones[1].id, 'm3');
  assert.strictEqual(goal.milestones[2].id, 'm1');
  assert.strictEqual(res.length, 3);
  fns.reorderMilestones(goal, -1, 5);
  assert.strictEqual(goal.milestones[0].id, 'm2');
});

check('filterFeedByCategory: 전체 또는 지정 카테고리(공부, 개발, 운동 등)에 따라 피드 아이템을 정확히 필터링한다', () => {
  const items = [
    { goal: '토익 900점 완성', action: '기출문제 1회독 풀이' },
    { goal: 'React 오픈소스 기여', action: 'GitHub 풀리퀘스트 생성' },
    { goal: '체지방 감량', action: '헬스장 웨이트 1시간' },
    { goal: '스타트업 매출 2배', action: 'B2B 영업 미팅 3건' },
    { goal: '자작곡 작곡', action: '기타 멜로디 녹음' }
  ];
  assert.strictEqual(fns.filterFeedByCategory(items, 'all').length, 5, '전체 조회');
  assert.strictEqual(fns.filterFeedByCategory(items, null).length, 5, 'null 기본값');
  
  const study = fns.filterFeedByCategory(items, 'study');
  assert.strictEqual(study.length, 1);
  assert.ok(study[0].goal.includes('토익'));

  const dev = fns.filterFeedByCategory(items, 'dev');
  assert.strictEqual(dev.length, 1);
  assert.ok(dev[0].goal.includes('오픈소스'));

  const workout = fns.filterFeedByCategory(items, 'workout');
  assert.strictEqual(workout.length, 1);
  assert.ok(workout[0].goal.includes('체지방'));

  const career = fns.filterFeedByCategory(items, 'career');
  assert.strictEqual(career.length, 1);
  assert.ok(career[0].goal.includes('매출'));

  const hobby = fns.filterFeedByCategory(items, 'hobby');
  assert.strictEqual(hobby.length, 1);
  assert.ok(hobby[0].goal.includes('작곡'));
});

check('calculateWeeklyFocusStats: 최근 7일간의 세션 수, 누적 집중 시간 및 활동 일수를 정확히 계산한다', () => {
  const now = new Date();
  const d1 = new Date(now.getTime() - 1 * 86400000).toISOString();
  const d1End = new Date(now.getTime() - 1 * 86400000 + 3600000).toISOString(); // 60분
  const d2 = new Date(now.getTime() - 2 * 86400000).toISOString();
  const d2End = new Date(now.getTime() - 2 * 86400000 + 1800000).toISOString(); // 30분
  const oldDate = new Date(now.getTime() - 15 * 86400000).toISOString(); // 15일 전 (제외)

  const records = [
    { startAt: d1, endAt: d1End },
    { startAt: d2, endAt: d2End },
    { startAt: oldDate, endAt: oldDate }
  ];

  const stats = fns.calculateWeeklyFocusStats(records);
  assert.strictEqual(stats.totalSessions, 2, '최근 7일 세션 수 2건');
  assert.strictEqual(stats.totalMinutes, 90, '누적 90분');
  assert.strictEqual(stats.activeDays, 2, '활동일 2일');
});

check('exportRecordsToCsv: UTF-8 BOM을 포함하고 테마별 필터링이 적용된 CSV 텍스트를 생성한다', () => {
  const records = [
    { startAt: '2026-09-10T10:00:00Z', endAt: '2026-09-10T10:45:00Z', theme: 'study', text: '형법 총론 공부' },
    { startAt: '2026-09-10T15:00:00Z', endAt: '2026-09-10T16:00:00Z', theme: 'workout', text: '하체 스쿼트' }
  ];
  const csvAll = fns.exportRecordsToCsv(records, 'all');
  assert.ok(csvAll.startsWith('\uFEFF'), 'UTF-8 BOM 헤더 포함');
  assert.ok(csvAll.includes('형법 총론 공부'), '전체 내보내기에 공부 포함');
  assert.ok(csvAll.includes('하체 스쿼트'), '전체 내보내기에 운동 포함');

  const csvStudy = fns.exportRecordsToCsv(records, 'study');
  assert.ok(csvStudy.includes('형법 총론 공부'), '공부 테마 필터링 포함');
  assert.strictEqual(csvStudy.includes('하체 스쿼트'), false, '운동 테마 필터링 제외');
});

check('exportRecordsToMarkdown: 마크다운 표 구조 및 외부 AI 프롬프트 번들을 포함하여 생성한다', () => {
  const records = [
    { startAt: '2026-09-10T10:00:00Z', endAt: '2026-09-10T10:50:00Z', theme: 'study', subTheme: '민법', text: '계약총론 판례정리' }
  ];
  const mdWithPrompt = fns.exportRecordsToMarkdown(records, 'study', true);
  assert.ok(mdWithPrompt.includes('| 날짜 | 시간 | 소요 | 테마 | 소주제 | 내용 |'), '마크다운 표 헤더');
  assert.ok(mdWithPrompt.includes('계약총론 판례정리'), '기록 내용 포함');
  assert.ok(mdWithPrompt.includes('[외부 AI 분석 프롬프트'), '외부 AI 프롬프트 포함');

  const mdWithoutPrompt = fns.exportRecordsToMarkdown(records, 'study', false);
  assert.strictEqual(mdWithoutPrompt.includes('[외부 AI 분석 프롬프트'), false, '프롬프트 미포함 플래그 준수');
});

check('filterFeedByCategory: 특수문자나 빈 항목, 미매칭 카테고리 입력에도 예외 없이 안전하다', () => {
  assert.deepStrictEqual(fns.filterFeedByCategory([], 'study'), [], '빈 배열');
  assert.deepStrictEqual(fns.filterFeedByCategory(null, 'study'), [], 'null 배열');
  const items = [{ goal: '일상 일기' }];
  assert.deepStrictEqual(fns.filterFeedByCategory(items, 'unknown'), items, '알 수 없는 카테고리는 기본 전체 반환');
});

check('reorderMilestones: 동일 인덱스 이동 시 배열 순서를 그대로 유지한다', () => {
  const goal = { milestones: [{ id: 'a' }, { id: 'b' }] };
  fns.reorderMilestones(goal, 1, 1);
  assert.strictEqual(goal.milestones[0].id, 'a');
  assert.strictEqual(goal.milestones[1].id, 'b');
});

check('calculateWeeklyFocusStats: endAt 누락 기록은 기본 몰입시간(25분)을 반영한다', () => {
  const now = new Date();
  const d = new Date(now.getTime() - 10000).toISOString();
  const records = [{ startAt: d }]; // endAt 없음
  const stats = fns.calculateWeeklyFocusStats(records);
  assert.strictEqual(stats.totalSessions, 1);
  assert.strictEqual(stats.totalMinutes, 25, '기본 25분 산정');
});

check('exportRecordsToMarkdown: 본문 내 파이프 기호(|)와 줄바꿈을 안전하게 이스케이프한다', () => {
  const records = [{ startAt: '2026-09-10T10:00:00Z', theme: 'daily', text: '할일 1 | 할일 2\n다음 줄 내용' }];
  const md = fns.exportRecordsToMarkdown(records, 'all', false);
  assert.ok(md.includes('할일 1 \\| 할일 2 다음 줄 내용'), '파이프 이스케이프 및 개행 공백 치환');
});

check('exportRecordsToCsv: 따옴표(")가 포함된 본문을 CSV 표준에 맞게 더블 쿼트로 치환한다', () => {
  const records = [{ startAt: '2026-09-10T10:00:00Z', theme: 'daily', text: '그는 "할 수 있다"고 말했다' }];
  const csv = fns.exportRecordsToCsv(records, 'all');
  assert.ok(csv.includes('""할 수 있다""'), 'CSV 이중따옴표 이스케이프');
});

/* ============ 혁신 3종 신기능 (트렌드 차트 / 스톱워치 / 노션 푸시) 단위 & 규격 테스트 ============ */
const { buildNotionPagePayload } = require('../api/vision-table.js');

check('computeTrendChartData: 실 기록 2개 이상일 때 정확한 통계치와 성장률을 계산한다', () => {
  const records = [
    {
      type: 'template',
      templateKey: 'health',
      startAt: '2026-09-01T09:00:00Z',
      columns: ['세트', '종목', '무게', '횟수'],
      rows: [['1', '스쿼트', '100', '10'], ['2', '스쿼트', '100', '10']] // volume = 1*100*10 + 2*100*10 = 3000
    },
    {
      type: 'template',
      templateKey: 'health',
      startAt: '2026-09-08T09:00:00Z',
      columns: ['세트', '종목', '무게', '횟수'],
      rows: [['1', '스쿼트', '120', '10'], ['2', '스쿼트', '120', '10']] // volume = 1*120*10 + 2*120*10 = 3600
    }
  ];
  const chart = fns.computeTrendChartData('health', records, '7');
  assert.strictEqual(chart.isSample, false, '실제 기록 기반 계산');
  assert.strictEqual(chart.points.length, 2, '2개 포인트 생성');
  assert.strictEqual(chart.points[0].value, 3000, '첫 포인트 3000kg 볼륨');
  assert.strictEqual(chart.points[1].value, 3600, '두번째 포인트 3600kg 볼륨');
  assert.strictEqual(chart.max, 3600, '최고값 3600');
  assert.strictEqual(chart.min, 3000, '최소값 3000');
  assert.strictEqual(chart.growthRate, 20, '20% 성장률 (+600/3000)');
  assert.strictEqual(chart.unit, 'kg', '헬스 템플릿 단위 kg');
});

check('computeTrendChartData: 기록 부족 시(0~1개) 시뮬레이션 데이터를 제공하며 도메인별 메트릭을 매핑한다', () => {
  const studyChart = fns.computeTrendChartData('study_tracker', [], '7');
  assert.strictEqual(studyChart.isSample, true, '샘플 시뮬레이션 플래그');
  assert.strictEqual(studyChart.metricName, '순공 시간');
  assert.strictEqual(studyChart.unit, '분');
  assert.ok(studyChart.points.length >= 5, '최소 5개 시뮬레이션 포인트');
  assert.ok(studyChart.growthRate > 0, '양의 성장률 시뮬레이션');

  const hyroxChart = fns.computeTrendChartData('hyrox_workout', [], '7');
  assert.strictEqual(hyroxChart.metricName, '소요 시간');
  assert.strictEqual(hyroxChart.unit, '분');
});

check('formatStopwatchTime: 밀리초를 분:초.소수점 형식으로 정확히 변환하며 무효값을 방어한다', () => {
  assert.strictEqual(fns.formatStopwatchTime(0, true), '00:00.0', '0초 포맷');
  assert.strictEqual(fns.formatStopwatchTime(65432, true), '01:05.4', '1분 5.4초 포맷');
  assert.strictEqual(fns.formatStopwatchTime(65432, false), '01:05', '소수점 제외 포맷');
  assert.strictEqual(fns.formatStopwatchTime(3665432, true), '01:01:05.4', '1시간 1분 5.4초 포맷');
  assert.strictEqual(fns.formatStopwatchTime(-500, true), '00:00.0', '음수 방어');
  assert.strictEqual(fns.formatStopwatchTime(NaN, true), '00:00.0', 'NaN 방어');
});

check('buildNotionPagePayload: 노션 API 공식 스펙에 부합하는 중첩 표 블록과 메타데이터 페이로드를 생성한다', () => {
  const payload = buildNotionPagePayload({
    databaseId: 'test_db_id_123',
    title: '크로스핏 와드 기록',
    date: '2026-09-10T15:30:00.000Z',
    columns: ['라운드', '종목', '무게', '시간'],
    rows: [['1', '버피', '체중', '01:20'], ['2', '쓰러스터', '43kg', '02:15']],
    memo: '오늘 타임캡 18분 완주'
  });

  assert.strictEqual(payload.parent.database_id, 'test_db_id_123', '데이터베이스 부모 ID 매핑');
  assert.strictEqual(payload.properties.title.title[0].text.content, '크로스핏 와드 기록', '페이지 제목 매핑');
  assert.ok(payload.children && payload.children.length >= 2, '콜아웃 및 테이블 블록 포함');

  const tableBlock = payload.children.find(b => b.type === 'table');
  assert.ok(tableBlock, '테이블 타입 블록 존재');
  assert.strictEqual(tableBlock.table.table_width, 4, '컬럼 개수 4개');
  assert.strictEqual(tableBlock.table.has_column_header, true, '컬럼 헤더 플래그 true');
  assert.strictEqual(tableBlock.table.children.length, 3, '헤더 1행 + 데이터 2행');
  assert.strictEqual(tableBlock.table.children[0].table_row.cells[1][0].text.content, '종목', '헤더 컬럼 텍스트 매핑');
  assert.strictEqual(tableBlock.table.children[1].table_row.cells[1][0].text.content, '버피', '행1 종목 매핑');
  assert.strictEqual(tableBlock.table.children[2].table_row.cells[3][0].text.content, '02:15', '행2 시간 매핑');
});

check('compliance: 3종 혁신 기능(비주얼 성장 차트, 인앱 스톱워치, 노션 다이렉트 푸시) UI 및 연동 스펙이 완벽히 구비되어 있다', () => {
  // 1. 성장 추이 차트 UI
  assert.ok(html.includes('pro-trend-chart-card'), '추이 차트 카드 CSS 클래스');
  assert.ok(html.includes('pro-trend-svg-wrap'), '추이 차트 SVG 래퍼');
  assert.ok(html.includes('trend-tooltip'), '인터랙티브 툴팁 CSS');
  assert.ok(html.includes('computeTrendChartData'), '추이 데이터 계산 함수');
  assert.ok(html.includes('renderTrendSvgChart'), 'SVG 차트 렌더 함수');
  assert.ok(html.includes('proTrendChartWrap'), '기록 모달 내 차트 컨테이너');
  assert.ok(html.includes('detailTrendChartWrap'), '상세 모달 내 차트 컨테이너');

  // 2. 인앱 스톱워치 & 인터벌 타이머
  assert.ok(html.includes('pro-stopwatch-widget'), '스톱워치 위젯 컨테이너');
  assert.ok(html.includes('pro-sw-clock'), '디지털 시계 디스플레이');
  assert.ok(html.includes('cell-highlight-flash'), '표 셀 기입 하이라이트 애니메이션');
  assert.ok(html.includes('formatStopwatchTime'), '스톱워치 시간 포맷 함수');
  assert.ok(html.includes('renderStopwatchWidgetHtml'), '스톱워치 HTML 렌더 함수');
  assert.ok(html.includes('swStartPauseBtn'), '시작/일시정지 제어 버튼');
  assert.ok(html.includes('swInjectBtn'), '표에 시간 기입 버튼');

  // 3. 노션 다이렉트 자동 푸시
  assert.ok(html.includes('notionApiKeyInput'), '설정 탭 노션 API 토큰 입력');
  assert.ok(html.includes('notionDbIdInput'), '설정 탭 노션 DB ID 입력');
  assert.ok(html.includes('notionAutoPushSwitch'), '설정 탭 노션 자동 푸시 토글');
  assert.ok(html.includes('notionDirectPushBtn'), '노션 모달 즉시 전송 버튼');
  assert.ok(html.includes('pushRecordToNotion'), '노션 백그라운드 자동 전송 함수');
  assert.ok(html.includes('/api/notion-push'), 'Vercel Hobby 리라이트 엔드포인트 호출');

  // 4. Vercel 설정 검증 (12개 함수 한도 준수)
  const vercelJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
  assert.ok(vercelJson.rewrites && vercelJson.rewrites.some(r => r.source === '/api/notion-push' && r.destination === '/api/vision-table'), 'vercel.json /api/notion-push rewrite 등록');

  const apiFiles = fs.readdirSync(path.join(__dirname, '..', 'api')).filter(f => f.endsWith('.js'));
  assert.strictEqual(apiFiles.length, 12, 'Vercel Hobby 12개 서버리스 함수 한도 엄수 (정확히 12개)');
});

check('compliance: 가상 페르소나 40인 및 유저 피드백 TOP 10 핵심 개선사항이 index.html에 모두 구현되어 있다', () => {
  // P1. 사진 인증 및 뷰어
  assert.ok(html.includes('id="capturePhotoInput"'), '사진 첨부 input 존재');
  assert.ok(html.includes('id="capturePhotoBtn"'), '사진 첨부 버튼 존재');
  assert.ok(html.includes('id="capturePhotoPreview"'), '사진 미리보기 컨테이너 존재');
  assert.ok(html.includes('openPhotoViewerModal'), '사진 확대 뷰어 모달 함수 존재');
  assert.ok(html.includes('checkin-photo-thumb'), '피드 사진 썸네일 클래스 존재');

  // P2. 피드 카테고리 필터링
  assert.ok(html.includes('feed-filter-bar'), '피드 카테고리 필터 바 클래스 존재');
  assert.ok(html.includes('data-feedcat'), '피드 카테고리 속성 선택자 존재');

  // P3. 마일스톤 우선순위 태그 및 토글
  assert.ok(html.includes('ms-priority-tag'), '마일스톤 우선순위 태그 클래스 존재');
  assert.ok(html.includes('data-cyclepriority'), '마일스톤 우선순위 순환 클릭 속성 존재');

  // P4. 마일스톤 순서 드래그/재정렬 헬퍼
  assert.ok(html.includes('reorderMilestones'), '마일스톤 순서 재정렬 함수 존재');

  // P5. 오프라인 모드 배너 및 오프라인 싱크 매니저
  assert.ok(html.includes('id="offlineNoticeBanner"'), '오프라인 알림 배너 마크업 존재');
  assert.ok(html.includes('OfflineSyncManager'), '오프라인 동기화 큐 매니저 존재');

  // P6. 추천 4회 루틴 프리셋 버튼
  assert.ok(html.includes('id="presetTimesBtn"'), '추천 루틴 프리셋 버튼 마크업 존재');

  // P7 & P9. 주간 잔디 & 몰입 리포트 카드
  assert.ok(html.includes('id="homeGrassSummaryCard"'), '홈 잔디 요약 카드 마크업 존재');
  assert.ok(html.includes('renderHomeGrassSummary'), '홈 잔디 렌더링 함수 존재');
  assert.ok(html.includes('calculateWeeklyFocusStats'), '주간 몰입 통계 계산 함수 존재');

  // P8 & P17. 소규모 챌린지 룸 및 동료 페이스메이커
  assert.ok(html.includes('id="homeChallengeRoomBtn"'), '소규모 챌린지 룸 버튼 마크업 존재');
  assert.ok(html.includes('openChallengeRoomModal'), '소규모 챌린지 룸 모달 함수 존재');
  assert.ok(html.includes('정지호') && html.includes('김도윤') && html.includes('이지민'), '페이스메이커 페르소나 데이터 존재');

  // P10. 시인성 강화 (고대비 모드 및 4단계 폰트)
  assert.ok(html.includes('id="highContrastSwitch"'), '고대비 모드 스위치 마크업 존재');
  assert.ok(html.includes('data-high-contrast'), '고대비 CSS 데이터 속성 존재');
  assert.ok(html.includes('data-fs="small"') && html.includes('data-fs="xlarge"'), '4단계 글자크기 옵션 존재');
  assert.ok(html.includes('triggerHaptic'), '촉각 피드백(진동) 함수 존재');
});

check('compliance: 최초 로그인 시 모든 공개 범위(헤더 배지, 설정 셀렉트, 목표/기록 기본값)가 비공개로 설정되어 있다', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 헤더 배지 초기 마크업 비공개 확인
  assert.ok(html.includes('id="goalsPrivacyBadge" title="클릭하여 공개 범위 변경">🔒 나만 보기</span>'), '목표 탭 배지 비공개 기본값');
  assert.ok(html.includes('id="calPrivacyBadge" title="클릭하여 공개 범위 변경" style="margin-top:10px;">🔒 나만 보기</span>'), '일정 탭 배지 비공개 기본값');
  assert.ok(html.includes('id="recPrivacyBadge" title="클릭하여 공개 범위 변경" style="margin-top:10px;">🔒 나만 보기</span>'), '기록 탭 배지 비공개 기본값');

  // 2. 설정 셀렉트 옵션 비공개 pre-selected 확인
  assert.ok(html.includes('<option value="private" selected>🔒 나만 보기 (비공개)</option>'), '설정 탭 비공개 pre-selected 존재');

  // 3. 목표 생성 모달 공개 범위 셀렉트 private pre-selected 확인
  assert.ok(html.includes('<option value="private" selected>나만 보기</option>'), '목표 모달 비공개 pre-selected 존재');

  // 4. 온보딩 및 AI 목표 생성 시 visibility: 'private' 확인
  assert.ok(html.includes("visibility:'private'"), '온보딩 목표 비공개 설정');
  assert.ok(html.includes("visibility: 'private'"), '기본 목표 비공개 설정');
});

check('compliance: 가상 페르소나 200인 및 2배 다양화(신경다양성, 테크, 기기, 습관루프) 무결성 검증', () => {
  const pPath = path.join(__dirname, '..', 'sim', 'personas.json');
  assert.ok(fs.existsSync(pPath), 'sim/personas.json 파일 존재');
  const personas = JSON.parse(fs.readFileSync(pPath, 'utf8'));
  assert.strictEqual(personas.length, 200, '200명 페르소나 완전 등록');

  const males = personas.filter(p => p.gender === '남');
  const females = personas.filter(p => p.gender === '여');
  assert.strictEqual(males.length, 100, '남성 페르소나 100명');
  assert.strictEqual(females.length, 100, '여성 페르소나 100명');

  const mbtis = new Set(personas.map(p => p.mbti));
  assert.strictEqual(mbtis.size, 16, '16대 MBTI 전수 표본');

  personas.forEach(p => {
    assert.ok(p.neurodiversity, `페르소나 ${p.id} 신경다양성 속성`);
    assert.ok(p.techLiteracy, `페르소나 ${p.id} 테크 리터러시 속성`);
    assert.ok(p.device, `페르소나 ${p.id} 기기 환경 속성`);
    assert.ok(p.painTrigger, `페르소나 ${p.id} 페인 트리거 속성`);
    assert.ok(p.habitLoopStyle, `페르소나 ${p.id} 습관 루프 스타일`);
    assert.ok(p.emotionalState, `페르소나 ${p.id} 감정 상태`);
  });
});

check('compliance: 11인 외부 UI/UX 감시 및 개선팀 1차 전면 개선사항이 index.html에 구현되어 있다', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 모바일 하단 플로팅 엄지독 제거 (사용자 UX 개선 요청으로 번잡한 퀵이동 버튼 삭제)
  assert.ok(!html.includes('id="bottomThumbDock"'), '하단 플로팅 엄지독 컨테이너 제거 확인');
  assert.ok(!html.includes('id="dockQuickCheckinBtn"'), '1초 퀵기록 버튼 제거 확인');
  assert.ok(!html.includes('setupBottomThumbDock'), '엄지독 바인딩 함수 제거 확인');

  // 2. 상단 상태 필 & 일일 퀘스트 바
  assert.ok(html.includes('id="todayGlancePill"'), '상단 몰입 상태 필 마크업');
  assert.ok(html.includes('renderTodayGlancePill'), '상단 상태 필 렌더링 함수');
  assert.ok(html.includes('id="dailyQuestBarWrap"'), '일일 퀘스트 바 마크업');
  assert.ok(html.includes('renderDailyQuestBar'), '일일 퀘스트 렌더링 함수');

  // 3. WCAG AAA 접근성 포커스 & 스크린리더
  assert.ok(html.includes('*:focus-visible'), 'WCAG 2.2 AAA 전역 포커스 링');
  assert.ok(html.includes('id="a11yLiveAnnouncer"'), '스크린리더 실시간 아나운서');
  assert.ok(html.includes('announceToA11y'), '접근성 알림 함수');

  // 4. 스프링 물리 마이크로 인터랙션 & 스트릭 불꽃
  assert.ok(html.includes('--spring-bounce'), '스프링 물리 이징 변수');
  assert.ok(html.includes('streak-flame-pulse'), '스트릭 불꽃 맥동 애니메이션');

  // 5. MZ 성취 공유 카드
  assert.ok(html.includes('openMzShareCardModal'), 'MZ 성취 카드 모달 함수');
  assert.ok(html.includes('mz-card-preview'), 'MZ 카드 프리뷰 클래스');

  // 6. 200 페르소나 챌린지 룸 확장
  assert.ok(html.includes('윤다은') && html.includes('송하준') && html.includes('서예진'), '200 페르소나 다양성 챌린지 룸');
});

check('compliance: 유료 기능 잠금이 전면 해제되고 모든 기능(무제한 목표, AI 코치, 30일 리포트)이 100% 무료로 제공된다', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 토스 결제 위젯 제거 확인
  assert.strictEqual(html.includes('tosspayments.com/v1/payment-widget'), false, '토스페이먼츠 스크립트 제거');

  // 2. 랜딩 화면 목표 무제한 무료 문구 확인
  assert.ok(html.includes('목표 · 무제한 무료'), '랜딩 화면 목표 무제한 무료 문구');

  // 3. 목표 개수 제한 페이월 제거 확인
  assert.strictEqual(html.includes("openPaywallModal('goalLimit')"), false, '목표 생성/복제 시 페이월 제거');

  // 4. AI 맞춤 코치 페이월 제거 확인
  assert.strictEqual(html.includes("openPaywallModal('customFeedback')"), false, '맞춤 AI 피드백 봇 페이월 제거');

  // 5. 30일 리포트 페이월 제거 확인
  assert.strictEqual(html.includes("openPaywallModal('report30d')"), false, '30일 리포트 열람 시 페이월 제거');

  // 6. subscriptionState() 호출 시 항상 isPro: true 반환 확인
  const sub = fns.subscriptionState();
  assert.strictEqual(sub.isPro, true, '모든 유저 isPro: true 무제한 무료 제공');
});

check('compliance: 기록/달력 6대 UX 개선사항(기록 탭 AI 피드백, 히트맵 기간·횟수 시각화, 위클리 리캡 항목선택, 기간별 AI 피드백, 퀵도크 삭제, 일정 허브 모달 정상동작)이 모두 구현되어 있다', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 기록 탭 실시간 AI 피드백 슬롯 및 렌더러
  assert.ok(html.includes('id="recFeedbackSlot"'), '기록 탭 피드백 슬롯 마커 존재');
  assert.ok(html.includes('function renderRecordFeedbackSlot'), '기록 탭 피드백 렌더러 함수 존재');

  // 2. 기록 히트맵 기간/횟수 디자인 & UX 개선
  assert.ok(html.includes('heatmap-stat-bar'), '히트맵 상단 기간 및 핵심 통계 바');
  assert.ok(html.includes('heatmap-month-row'), '히트맵 월별 헤더 눈금');
  assert.ok(html.includes('id="heatmapSelectedInfo"'), '히트맵 셀 터치/클릭 인터랙티브 상세 패널');
  assert.ok(html.includes('0건') && html.includes('5건+'), '히트맵 구체적 건수 범례');

  // 3. 위클리 리캡 정보 선택 포함 기능
  assert.ok(html.includes('recapOptionsGrid'), '위클리 리캡 포함할 정보 선택 체크박스 그리드');
  assert.ok(html.includes('recapOptCount') && html.includes('recapOptDuration') && html.includes('recapOptStreak'), '위클리 리캡 세부 선택 옵션들');

  // 4. 기간별 기록 AI 피드백 카드
  assert.ok(html.includes('id="periodAiCard"'), '체크인 기록 상단 기간별 AI 피드백 카드 마커');
  assert.ok(html.includes('id="periodStartDate"') && html.includes('id="periodEndDate"'), '기간 설정 시작일/종료일 인풋');
  assert.ok(html.includes('id="periodAiRequestBtn"'), '기간 AI 피드백 받기 버튼');
  assert.ok(html.includes('function initPeriodAiCard'), '기간별 기록 AI 피드백 초기화 함수');

  // 5. 번잡한 하단 퀵이동 도크 및 버튼 완전 삭제
  assert.strictEqual(html.includes('bottomThumbDock'), false, '하단 퀵이동 도크 DOM 완전 제거');
  assert.strictEqual(html.includes('setupBottomThumbDock'), false, '하단 퀵이동 함수 완전 제거');

  // 6. 일정 탭 달력 날짜 관리창 새일정추가 및 맞춤기록 정상 작동
  assert.ok(html.includes('openCalendarDayEditHubModal'), '캘린더 일자 허브 모달 함수');
  assert.ok(html.includes('openCalendarManualEditModal'), '새 일정 추가 모달 연결');
  assert.ok(html.includes('openProTemplateRecordModal'), '맞춤 기록 작성 모달 연결');
  assert.ok(html.includes('calEditBackToHubBtn'), '일정 편집창 뒤로가기 허브 복귀 버튼');
});

check('distributeSequentialDates: 30일 마라톤 일일계획의 dueDate가 마지막 날 하나로 몰리지 않고 1일차~30일차로 순차 분배된다', () => {
  const { distributeSequentialDates } = require('../api/goalagent.js');
  const mockOps = [{
    type: 'CREATE',
    level: 'goal',
    data: {
      title: '한달뒤 마라톤 완주',
      dueDate: '2026-10-10',
      topicMajor: 'health',
      milestones: Array.from({ length: 30 }, (_, i) => ({
        title: 'Day ' + (i + 1) + ': 러닝 훈련',
        dueDate: '2026-10-10', // 모델이 잘못 준 동일 날짜
        tasks: ['기초 조깅 3km']
      }))
    }
  }];

  const res = distributeSequentialDates(mockOps, '2026-09-10', '전문 코치의 일일단위 한달 계획 요청');
  const ms = res[0].data.milestones;
  assert.strictEqual(ms.length, 30, '30개 마일스톤 온전히 유지');
  assert.strictEqual(ms[0].dueDate, '2026-09-11', '1일차 마감일은 2026-09-11');
  assert.strictEqual(ms[1].dueDate, '2026-09-12', '2일차 마감일은 2026-09-12');
  assert.strictEqual(ms[14].dueDate, '2026-09-25', '15일차 마감일은 2026-09-25');
  assert.strictEqual(ms[29].dueDate, '2026-10-10', '30일차 마감일은 2026-10-10');

  // 중복 날짜 검사: 30일이 모두 서로 다른 날짜인지 확인
  const uniqueDates = new Set(ms.map(m => m.dueDate));
  assert.strictEqual(uniqueDates.size, 30, '모든 30일차 날짜가 서로 고유하게 분배됨');
});

check('distributeSequentialDates: 공부/다이어트/주차별 등 다른 테마에서도 순차 날짜가 올바르게 분배된다', () => {
  const { distributeSequentialDates } = require('../api/goalagent.js');

  // 1. 공부 테마 (토익 30일 일일단위)
  const studyOps = [{
    type: 'CREATE',
    level: 'goal',
    data: {
      title: '토익 900점 달성',
      dueDate: '2026-10-10',
      topicMajor: 'study',
      milestones: Array.from({ length: 30 }, (_, i) => ({
        title: (i + 1) + '일차: 단어 50개',
        dueDate: '2026-10-10',
        tasks: ['단어 암기']
      }))
    }
  }];
  distributeSequentialDates(studyOps, '2026-09-10', '토익 일일단위 계획');
  const studyMs = studyOps[0].data.milestones;
  assert.strictEqual(studyMs[0].dueDate, '2026-09-11');
  assert.strictEqual(studyMs[29].dueDate, '2026-10-10');

  // 2. 주차별 테마 (4주차)
  const weeklyOps = [{
    type: 'CREATE',
    level: 'goal',
    data: {
      title: '체지방 감량',
      dueDate: '2026-10-10',
      topicMajor: 'health',
      milestones: [
        { title: '1주차: 식습관 개선', dueDate: '2026-10-10' },
        { title: '2주차: 칼로리 제한', dueDate: '2026-10-10' },
        { title: '3주차: 공복 유산소', dueDate: '2026-10-10' },
        { title: '4주차: 최종 점검', dueDate: '2026-10-10' }
      ]
    }
  }];
  distributeSequentialDates(weeklyOps, '2026-09-10', '주차별 한달 다이어트 계획');
  const weeklyMs = weeklyOps[0].data.milestones;
  assert.strictEqual(weeklyMs[0].dueDate, '2026-09-17', '1주차: 7일 뒤');
  assert.strictEqual(weeklyMs[1].dueDate, '2026-09-24', '2주차: 14일 뒤');
  assert.strictEqual(weeklyMs[2].dueDate, '2026-10-01', '3주차: 21일 뒤');
  assert.strictEqual(weeklyMs[3].dueDate, '2026-10-08', '4주차: 28일 뒤');
});

check('localGoalAgentFallback: 한달 일일 계획 요청 시 30개 항목과 순차 날짜가 생성된다', () => {
  const { localGoalAgentFallback } = require('../api/goalagent.js');
  const res = localGoalAgentFallback('한달뒤 마라톤 완주 [추가수정보완 1회차]: 전문 코치의 일일단위 한달 계획 요청', [], '2026-09-10', {});
  assert.ok(res.ops && res.ops.length > 0, 'ops 생성됨');
  const ms = res.ops[0].data.milestones;
  assert.strictEqual(ms.length, 30, '30일치 일일 마일스톤 생성');
  assert.strictEqual(ms[0].dueDate, '2026-09-11', '1일차는 내일');
  assert.strictEqual(ms[29].dueDate, '2026-10-10', '30일차는 한달뒤');
});

check('compliance: index.html에 normalizeSequentialMilestoneDates 및 35개 마일스톤 지원 로직이 존재한다', () => {
  assert.ok(html.includes('normalizeSequentialMilestoneDates'), '클라이언트 날짜 정규화 함수 존재');
  assert.ok(html.includes('normalizeSequentialMilestoneDates(rawMilestones, data.dueDate)'), '목표 빌드 시 정규화 연동');
});

check('compliance: 소통 탭 헤더 우측 [내 목표 / 기록 게시하기] 버튼 및 피드 전면 상호소통(리액션·댓글·페르소나 인터랙션)이 구현되어 있다', () => {
  // 1. 소통 탭 상단 헤더 우측 [내 목표 / 기록 게시하기] 버튼
  assert.ok(html.includes('id="btnCommPostFeed"'), '소통 헤더 우측 게시 버튼 id 존재');
  assert.ok(html.includes('openShareToFeedModal()'), '모달 오픈 핸들러 연결');
  assert.ok(html.includes('내 목표 / 기록 게시하기'), '버튼 라벨 정확성');

  // 2. 범용 피드 게시 모달 (목표/기록/마일스톤/피드백/사진/소감 선택)
  assert.ok(html.includes('id="shareGoalSelect"'), '목표 선택 드롭다운 존재');
  assert.ok(html.includes('id="shareRecordSelect"'), '기록 선택 드롭다운 존재');
  assert.ok(html.includes('id="chkIncRecord"'), '기록 내용 포함 체크박스');
  assert.ok(html.includes('id="shareCaptionInput"'), '소감/한마디 텍스트영역');
  assert.ok(html.includes('addSimulatedCheerAndReplyToPost'), '가상 페르소나 축하 및 답글 트리거 존재');

  // 3. 피드 카드 내 다채로운 리액션 및 상호소통 댓글 시스템
  assert.ok(html.includes('getFeedComments'), '댓글 조회 헬퍼');
  assert.ok(html.includes('setFeedComments'), '댓글 저장 헬퍼');
  assert.ok(html.includes('handleUserCommentSubmit'), '유저 댓글 등록 및 페르소나 자동응답 로직');
  assert.ok(html.includes('toggleFeedReaction'), '다채로운 리액션 토글 함수');
  assert.ok(html.includes('data-reacttype="fire"'), '🔥 파이팅 리액션 버튼');
  assert.ok(html.includes('data-reacttype="clap"'), '👏 대단해요 리액션 버튼');
  assert.ok(html.includes('data-reacttype="heart"'), '❤️ 응원해요 리액션 버튼');
  assert.ok(html.includes('data-reacttype="sparkle"'), '💡 자극받아요 리액션 버튼');
  assert.ok(html.includes('data-togglecomments'), '댓글 토글 버튼');
  assert.ok(html.includes('feed-quick-chips-row'), '1초 빠른 응원 메시지 칩 UI');
  assert.ok(html.includes('data-quickreply'), '빠른 응원 메시지 데이터 속성');
  assert.ok(html.includes('feed-comments-panel'), '댓글 패널 컨테이너');
});

check('compliance: 모달 오버레이 탭 시 고스트 클릭(터치 관통) 방어 및 쿨다운 가드가 구현되어 있다', () => {
  assert.ok(html.includes('_modalDismissGraceUntil'), '모달 닫힘 쿨다운 타임스탬프 변수 존재');
  assert.ok(html.includes('isModalDismissCooldown'), '고스트 클릭 판정 헬퍼 함수 존재');
  assert.ok(html.includes('overlay.ontouchend'), '모바일 터치엔드 이벤트 방어 핸들러 등록');
  assert.ok(html.includes('e.stopPropagation()'), '오버레이 탭 시 이벤트 전파 차단');
  assert.ok(html.includes('openFeedbackSetupGated'), '피드백 게이트 함수 존재');
  assert.ok(html.includes('id="chipAdd"'), '목표 추가 칩 상시 존재');
});

check('parseJwtPayload: JWT base64url 페이로드를 올바른 JSON 객체로 디코딩한다', () => {
  const parseFn = eval('(' + extractFunction(mainScript, 'parseJwtPayload') + ')');
  const payload = { sub: 'google_1234567890', email: 'ourgoal_user@gmail.com', name: '김목표' };
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const dummyToken = 'eyJhbGciOiJSUzI1NiJ9.' + b64 + '.signature';
  const decoded = parseFn(dummyToken);
  assert.ok(decoded, '페이로드가 null이 아니어야 함');
  assert.strictEqual(decoded.email, 'ourgoal_user@gmail.com');
  assert.strictEqual(decoded.sub, 'google_1234567890');
  assert.strictEqual(decoded.name, '김목표');
});

check('compliance: Google OAuth 2.0 실제 연동 로직(클라이언트 ID, 버튼, 세션 브릿지, One-Tap)이 완벽히 구현되어 있다', () => {
  // 1. Google OAuth Client ID 설정
  assert.ok(html.includes('GOOGLE_OAUTH_CLIENT_ID = \'441950547594-brg1nvritlb3hlucoktq11ga6vtn943a.apps.googleusercontent.com\''), '유효한 Google OAuth 클라이언트 ID 정의');

  // 2. Google Identity Services 라이브러리 로드
  assert.ok(html.includes('https://accounts.google.com/gsi/client'), 'Google Identity Services 스크립트 로드');

  // 3. 버튼 UI 및 SVG 로고
  assert.ok(html.includes('id="landGoogleBtn"'), '랜딩 화면 구글 로그인 버튼 존재');
  assert.ok(html.includes('id="authGoogleBtn"'), '인증 화면 구글 로그인 버튼 존재');
  assert.ok(html.includes('Google로 계속하기'), '공식 구글 버튼 텍스트');
  assert.ok(html.includes('viewBox="0 0 24 24"'), '공식 구글 컬러 로고 SVG');

  // 4. 세션 브릿지 및 One-Tap 함수
  assert.ok(html.includes('function startGoogleLogin('), 'Google 로그인 시작 핸들러');
  assert.ok(html.includes('function handleGoogleUserSuccess('), 'Google 유저 인증 성공 및 Supabase 세션 브릿지');
  assert.ok(html.includes('function initGoogleOneTap('), 'Google One-Tap 초기화 핸들러');
  assert.ok(html.includes('function getGoogleTokenClient('), 'Google OAuth2 Token Client 생성기');
  assert.ok(html.includes('https://www.googleapis.com/oauth2/v3/userinfo'), 'Google 사용자 정보 API 엔드포인트 연동');
  assert.ok(html.includes('google.accounts.id.disableAutoSelect'), '로그아웃 시 구글 자동선택 비활성화');
});

check('compliance: 마일스톤 우선순위 태그(🔴 높음 / 🟡 보통 / 🟢 낮음)가 마일스톤 제목 위 독립 행에 최소 여백으로 배치되어 제목 입력을 가리지 않는다', () => {
  // 1. 우선순위 태그 CSS 및 인라인 플렉스
  assert.ok(html.includes('.ms-priority-tag{display:inline-flex;align-items:center;cursor:pointer;'), '우선순위 태그 인라인 플렉스 스타일');
  assert.ok(html.includes('.ms-priority-high'), '우선순위 높음 스타일');
  assert.ok(html.includes('.ms-priority-med'), '우선순위 보통 스타일');
  assert.ok(html.includes('.ms-priority-low'), '우선순위 낮음 스타일');

  // 2. 마일스톤 렌더링 시 제목 입력 바로 위 독립 행 배치 (제목을 가리지 않고 100% 폭 보장)
  assert.ok(html.includes('style="display:flex;align-items:center;gap:6px;margin-bottom:2px;line-height:1;min-height:16px;"'), '제목 상단 독립 행');
  assert.ok(html.includes('data-cyclepriority='), '클릭 시 우선순위 순환 핸들러 속성');
  assert.ok(html.includes('data-msinput="1"'), '마일스톤 제목 입력 필드');
});

check('compliance: 향후 30일간의 일정 연계 AI 피드백 엔진 및 무관한 피드백 엄격 금지 규칙이 구현되어 있다', () => {
  // 1. 30일 일정 추출 헬퍼 함수
  assert.ok(html.includes('function getUpcomingSchedulesForAI('), '30일 일정 추출 함수 정의');

  // 2. buildFeedbackPrompt 및 api/feedback.js의 엄격한 프롬프트 지침
  assert.ok(html.includes('[향후 30일간의 다가오는 일정 목록]'), '프롬프트 내 30일 일정 목록 섹션');
  assert.ok(html.includes('관련없는 피드백을 위한 피드백은 엄격히 금지'), '무관한 피드백 금지 지침 in index.html');
  const apiFeedbackJs = fs.readFileSync('api/feedback.js', 'utf8');
  assert.ok(apiFeedbackJs.includes('관련없는 피드백을 위한 피드백은 절대 금지'), '무관한 피드백 금지 지침 in api/feedback.js');
  assert.ok(apiFeedbackJs.includes('upcomingSchedules'), 'api/feedback.js 일정 수신');

  // 3. 로컬 폴백 localFeedback에서도 무관한 참견 방어 및 관련/긴급 일정만 선택적 리마인드
  assert.ok(html.includes('upcomingSchedules || getUpcomingSchedulesForAI(30)'), 'localFeedback 내 일정 연계');
  assert.ok(html.includes('다가오는 일정 알림:'), '선택적 다가오는 일정 알림 문구');
});

check('compliance: 최근 업데이트가 전면 반영된 6페이지 최초로그인 안내 및 설정 다시보기 버튼이 구현되어 있다', () => {
  // 1. 6페이지 온보딩 가이드 스텝
  assert.ok(html.includes('1 / 6 · 환영 & 완전 무료'), '1페이지: 100% 완전 무료화 & 페이월 제거');
  assert.ok(html.includes('2 / 6 · 지능형 AI 코칭'), '2페이지: 30일 일정 연계 AI 코칭');
  assert.ok(html.includes('3 / 6 · 구글 캘린더 상호 연동'), '3페이지: 구글 캘린더 양방향 상호 동기화');
  assert.ok(html.includes('4 / 6 · 전문 템플릿 3대 혁신'), '4페이지: 차트/스톱워치/노션 연동');
  assert.ok(html.includes('5 / 6 · 팀 수준별 목표 & 모임장'), '5페이지: 팀 수준별 목표 & 모임장 왕관');
  assert.ok(html.includes('6 / 6 · 음성 기록 & 안심 보안'), '6페이지: 10초 음성 체크인 & 기본 비공개');

  // 2. 6단계 전진/후진 핸들러 체인
  assert.ok(html.includes('showGuideStep1'), 'Step 1 함수');
  assert.ok(html.includes('showGuideStep6'), 'Step 6 함수');
  assert.ok(html.includes('guideFinish6'), '최종 시작하기 버튼');

  // 3. 설정 탭 가이드 다시보기 버튼 및 전역 바인딩
  assert.ok(html.includes('id="btnRestartGuide"'), '설정 탭 가이드 다시보기 버튼');
  assert.ok(html.includes('window.startFirstLoginGuide = startFirstLoginGuide;'), '전역 바인딩');
});

check('compliance: 팀 수준별 목표 관리(조별 목표·마일스톤·할일, 컴팩트 요약, 상세 관리 모달) 및 모임장 왕관 시스템이 구현되어 있다', () => {
  // 1. 팀 수준별 목표 데이터 및 헬퍼
  assert.ok(html.includes('function getGroupLevelGoals('), '조별 목표 데이터 생성 및 조회 헬퍼');
  assert.ok(html.includes('openLevelGroupDetailModal('), '상세 관리 모달 오픈 함수');

  // 2. 카드 내 컴팩트 요약 (목표, 마일스톤, 할일 개수 및 진행률)
  assert.ok(html.includes('팀 수준별 목표 관리'), '수준별 목표 관리 섹션');
  assert.ok(html.includes('data-openleveldetail='), '자세히보기 버튼 데이터 속성');
  assert.ok(html.includes('data-addlevelgroup='), '새 조/그룹 추가 버튼');

  // 3. 모임장 왕관 👑 및 초록색 모임장 배지
  assert.ok(html.includes('color:#2e7d32;background:#e8f5e9;border:1px solid #c8e6c9;padding:2px 8px;border-radius:999px;">모임장</span>'), '초록색 모임장 배지 스타일');
  assert.ok(html.includes('👑</span>'), '왕관 아이콘');
});

check('compliance: 상단 모임 필터 칩바 및 팀 목표 200% 활용 가이드 업데이트가 구현되어 있다', () => {
  // 1. 상단 모임 필터 칩바
  assert.ok(html.includes('id="tgFilterChipRow"'), '모임 필터 칩바 ID');
  assert.ok(html.includes('data-tgfilter="all"'), '전체 모임 필터 칩');
  assert.ok(html.includes('state.teamGoalFilterGid'), '활성 필터 상태 변수');

  // 2. 가이드 내용 업데이트
  assert.ok(html.includes('모임장(리더)이라면? (왕관 & 초록색 모임장 배지)'), '가이드 내 왕관/배지 설명');
  assert.ok(html.includes('팀 수준별 목표 관리 (A·B·C조 맞춤 시스템)'), '가이드 내 수준별 조 목표 설명');
  assert.ok(html.includes('id="btnShowTeamGuideModal"'), '모임 목표 화면 내 가이드 모달 버튼');
});

check('compliance: 기존 계정 목표 보존, saveProfile 비파괴성 및 최초로그인 온보딩 오작동 원천 차단', () => {
  // 1. saveProfile에서 무조건적 또는 배열 비었을 때의 전체 삭제(delGoals/delRecs) 패턴 제거 확인
  assert.ok(!html.includes('var delGoals = sb.from(\'goals\').delete()'), 'saveProfile 내 blind delGoals 제거 확인');
  assert.ok(!html.includes('var delRecs = sb.from(\'checkins\').delete()'), 'saveProfile 내 blind delRecs 제거 확인');

  // 2. 로컬 백업 자동 복구 및 자가 치유 안전망 구비
  assert.ok(html.includes('ourgoal_goals_backup_'), '로컬 목표 백업 키 사용 확인');

  // 3. 기존 데이터가 있는 계정의 신규가입 오판정 방어
  assert.ok(html.includes('var hasExistingData = (goals && goals.length > 0) || (records && records.length > 0) || (localCachedGoals && localCachedGoals.length > 0);'), '기존 데이터 보유 유저 정밀 판정 로직 존재');
  assert.ok(html.includes('var isActuallyNew = ures.isNew && !hasExistingData;'), '실제 신규 여부 계산 확인');

  // 4. boot 진입 시 기존 목표 보유자는 절대 온보딩으로 빠지지 않음
  assert.ok(html.includes('state.profile._isNewSignup && (!state.profile.goals || state.profile.goals.length === 0)'), 'boot 시 목표 보유자 온보딩 진입 차단');

  // 5. 사용자의 명시적 목표 및 기록 삭제 시 개별 ID 기준 삭제 수행
  assert.ok(html.includes("await sb.from('goals').delete().eq('id', goal.id).eq('user_id', state.profile.id);"), '목표 개별 명시적 삭제 로직 구비');
  assert.ok(html.includes("await sb.from('checkins').delete().eq('id', id).eq('user_id', state.profile.id);"), '기록 개별 명시적 삭제 로직 구비');
});

check('localGoalAgentFallback: 25년5월17일생 아기 만 3살까지 건강 육아 요청 시 영유아 검진 일정 및 2028-05-17 마감일 생성 검증', () => {
  const { localGoalAgentFallback, distributeSequentialDates } = require('../api/goalagent.js');
  const userMsg = '25년5월17일생 아기를 만 3살까지 건강하게 키우고싶어. 놓치지 말아야할것들 싹다 정리 [수정보완 1회차]: 아기 건강검진 일자등 아기한테 꼭 놓치면 안될 것들과 그 날짜를 정리 25년 5월 17일생.';
  const res = localGoalAgentFallback(userMsg, [], '2026-09-10', {});
  res.ops = distributeSequentialDates(res.ops, '2026-09-10', userMsg);

  assert.ok(res.ops && res.ops.length > 0, 'ops 생성됨');
  const goal = res.ops[0].data;
  assert.strictEqual(goal.title, '2025년 5월 17일생 아기 만 3세 건강 성장 관리', '정제된 목표 제목');
  assert.strictEqual(goal.dueDate, '2028-05-17', '만 3세 생일 기준 목표 마감일 계산');
  assert.ok(!goal.title.includes('[수정보완 1회차]'), '대화 메타태그 제거 확인');

  const ms = goal.milestones;
  assert.ok(ms.length >= 3, '최소 3개 이상의 마일스톤 생성');
  
  // 영유아 검진 관련 마일스톤 및 성인 운동 배제 확인
  const allTitles = ms.map(m => m.title).join(' ');
  assert.ok(allTitles.includes('영유아 건강검진') || allTitles.includes('검진') || allTitles.includes('예방접종'), '영유아 건강검진 마일스톤 포함');
  assert.ok(!allTitles.includes('운동 계획') && !allTitles.includes('웨이트') && !allTitles.includes('스쿼트'), '성인 운동 루틴 배제');

  // 첫 마일스톤 날짜(4차 검진 마감: 2027-05-17) 및 2028년 마일스톤 할일 날짜 검증
  assert.strictEqual(ms[0].dueDate, '2027-05-17', '4차 검진 24개월 마감일 정확성');
  assert.strictEqual(ms[ms.length - 1].dueDate, '2028-05-17', '최종 마일스톤 날짜 정확성');
  
  // 3단계 마일스톤의 세부 할일이 영유아 검진 내용으로 구성되고, dueDate 존재 시 2026년으로 뭉개지지 않는지 검증
  const lastMsTasks = ms[ms.length - 1].tasks;
  assert.ok(lastMsTasks && lastMsTasks.length >= 2, '세부 할 일 목록 존재');
  const taskTexts = lastMsTasks.map(t => typeof t === 'string' ? t : (t.title || '')).join(' ');
  assert.ok(taskTexts.includes('5차') || taskTexts.includes('검진') || taskTexts.includes('예방접종'), '영유아 검진 세부 할 일 포함');
  lastMsTasks.forEach(t => {
    if (t && typeof t === 'object' && t.dueDate) {
      assert.ok(t.dueDate >= '2027-11-17' && t.dueDate <= '2028-05-17', '할일 날짜가 2026년으로 뭉개지지 않고 마일스톤 기간 내에 위치함: ' + t.dueDate);
    }
  });
});

check('localGoalAgentFallback: 비운동성 의료 건강 및 자격증 요청 시 도메인 분리 검증', () => {
  const { localGoalAgentFallback } = require('../api/goalagent.js');
  // 1. 비운동성 건강검진
  const medRes = localGoalAgentFallback('종합건강검진 예약 및 위대장 내시경 복약 준비', [], '2026-09-10', {});
  const medTitles = medRes.ops[0].data.milestones.map(m => m.title).join(' ');
  assert.ok(medTitles.includes('검진') || medTitles.includes('병원') || medTitles.includes('복약'), '의료 검진 관련 마일스톤');
  assert.ok(!medTitles.includes('운동') && !medTitles.includes('러닝') && !medTitles.includes('웨이트'), '운동 루틴 오배정 없음');

  // 2. 자격증
  const certRes = localGoalAgentFallback('정보처리기사 실기 시험 합격하기', [], '2026-09-10', {});
  const certTitles = certRes.ops[0].data.milestones.map(m => m.title).join(' ');
  assert.ok(certTitles.includes('필기') || certTitles.includes('실기') || certTitles.includes('기출') || certTitles.includes('이론'), '자격증 시험 관련 마일스톤');
  assert.ok(!certTitles.includes('식단') && !certTitles.includes('운동'), '자격증에 식단/운동 오배정 없음');
});

check('compliance: 마일스톤 번호 중복(1단계. 1단계:) 방어 정규식 및 7대 AI 엔드포인트 캐스케이드 구비', () => {
  // 1. index.html 내 마일스톤 제목 단계 번호 중복 제거 정규식
  assert.ok(html.includes("msTitle.replace(/^(?:(?:\\d+|[일이삼사오육칠팔구십]+)단계[:\\.\\s]*|단계\\s*\\d+[:\\.\\s]*)/i, '')"), 'index.html 단계 접두사 중복 방어 정규식');

  // 2. 7개 AI API 엔드포인트 모두에 다중 플래시 캐스케이드 및 최신 Claude 모델 적용 확인
  const apiFiles = [
    'api/goalagent.js',
    'api/goaltemplate.js',
    'api/feedback.js',
    'api/goalstatus.js',
    'api/nextaction.js',
    'api/promptgen.js',
    'api/todaymission.js'
  ];

  for (const file of apiFiles) {
    const content = fs.readFileSync(file, 'utf8');
    assert.ok(content.includes('gemini-3.6-flash'), file + ' 에 gemini-3.6-flash 포함');
    assert.ok(content.includes('gemini-3.5-flash'), file + ' 에 gemini-3.5-flash 포함');
    assert.ok(content.includes('claude-3-7-sonnet-20250219'), file + ' 에 최신 Claude 모델 포함');
  }
});

check('convertTextToNotionDbRecord: 자연어 줄글 입력을 노션 DB 프로퍼티 규격으로 구조화 변환한다', () => {
  const fnCode = extractFunction(mainScript, 'convertTextToNotionDbRecord');
  const convertFn = eval('(' + fnCode + ')');
  const res = convertFn('오늘 20km 1시간 40분 완주했어 땀 많이 흘림', 'ms', { title: '러닝 완주' }, { category: 'exercise' });

  assert.ok(res, '변환 결과 객체 반환');
  assert.strictEqual(res.status, '완료', '완료 상태 인식');
  assert.strictEqual(res.progress, 100, '완주 시 달성률 100%');
  assert.ok(res.metric.includes('20km'), '거리 메트릭 추출');
  assert.ok(res.metric.includes('1시간 40분'), '시간 메트릭 추출');
  assert.ok(res.tags.includes('운동'), '카테고리 기반 태그 추출');
  assert.ok(res.tags.includes('완료'), '상태 기반 태그 추출');

  // 노션 공식 DB 스키마 구조 검증
  assert.ok(res.notionSchema.Name.title[0].text.content, 'Notion Title 프로퍼티');
  assert.strictEqual(res.notionSchema.Status.select.name, '완료', 'Notion Select 상태');
  assert.strictEqual(res.notionSchema.Progress.number, 100, 'Notion Number 달성률');
  assert.ok(res.notionSchema.Metric.rich_text[0].text.content, 'Notion RichText 메트릭');
  assert.ok(res.notionSchema.KeyTakeaway.rich_text[0].text.content, 'Notion RichText 핵심성과');
  assert.ok(res.notionSchema.Date.date.start, 'Notion Date 일자');
});

check('compliance: 목표탭 결과입력 UI/UX 혁신 (커리큘럼 정하기·수치단위·메모 삭제, 노션 DB AI비서, 수동입력하기)', () => {
  // 1. 커리큘럼 정하기 템플릿 제거 및 결과입력 모달 방어
  assert.strictEqual(html.includes("ms:['커리큘럼 정하기'"), false, "공부 템플릿에서 '커리큘럼 정하기'가 제거됨");
  assert.ok(html.includes("obj.title !== '커리큘럼 정하기'"), '결과입력 모달 내 커리큘럼 정하기 노출 방어');

  // 2. 비실용적인 목표치, 실제달성, 단위, 메모(선택) 입력창 삭제 검증
  assert.strictEqual(html.includes('<label>목표치</label>'), false, '목표치 필드가 삭제됨');
  assert.strictEqual(html.includes('<label>실제 달성</label>'), false, '실제 달성 필드가 삭제됨');
  assert.strictEqual(html.includes('<label>메모 (선택)</label>'), false, '메모 (선택) 필드가 삭제됨');
  assert.strictEqual(html.includes('id="rsTarget"'), false, 'rsTarget 엘리먼트가 제거됨');
  assert.strictEqual(html.includes('id="rsResult"'), false, 'rsResult 엘리먼트가 제거됨');
  assert.strictEqual(html.includes('id="rsNote"'), false, 'rsNote 엘리먼트가 제거됨');

  // 3. AI 비서 안내 문구 및 상세 대화로 열기 삭제 검증
  assert.ok(html.includes('오늘 달성한 내용을 줄글로 적어주시면 DB화에 알맞게 바꿔드려요(향후 데이터 활용우수)'), '지정된 AI비서 설명 문구 정확성');
  assert.strictEqual(html.includes('상세 대화로 열기'), false, "'상세 대화로 열기' 버튼이 완전히 삭제됨");
  assert.strictEqual(html.includes('id="rsAiQuickBtn"'), false, 'rsAiQuickBtn이 제거됨');

  // 4. 수동입력하기 토글 및 입력 폼 탑재 검증
  assert.ok(html.includes('id="rsManualToggleBtn"'), '수동입력하기 토글 버튼 존재');
  assert.ok(html.includes('id="rsManualForm"'), '수동입력 폼 컨테이너 존재');
  assert.ok(html.includes('id="rsManualTitle"'), '수동 실천내용 입력창 존재');
  assert.ok(html.includes('id="rsManualStatus"'), '수동 상태 셀렉트 존재');
  assert.ok(html.includes('id="rsManualPct"'), '수동 달성률 입력창 존재');
  assert.ok(html.includes('id="rsManualMetric"'), '수동 수치/소요시간 입력창 존재');
  assert.ok(html.includes('id="rsManualKeyTakeaway"'), '수동 성과/배운점 입력창 존재');
  assert.ok(html.includes('수동입력하기'), '수동입력하기 라벨 텍스트 존재');

  // 5. 노션 DB 프리뷰 카드 검증
  assert.ok(html.includes('id="rsNotionDbPreview"'), 'Notion DB 미리보기 컨테이너 존재');
  assert.ok(html.includes('Notion DB 변환 규격'), 'Notion DB 변환 배지 텍스트 존재');
});

console.log(passed + '개 통과, ' + failures + '개 실패');
if (failures > 0) {
  process.exit(1);
}


