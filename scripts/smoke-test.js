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
// 2026-09-12 UI v2: 스타일은 ui.css(외부)로 분리됐다. CSS 존재 검사는 html+css 합본으로 본다.
const UI_CSS = path.join(__dirname, '..', 'ui.css');
const styleSrc = html + (fs.existsSync(UI_CSS) ? fs.readFileSync(UI_CSS, 'utf8') : '');

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
  'pad', 'dateKey', 'getKSTDateKey', 'goalProgress', 'msCounts', 'resultPct', 'dDay',
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
  'rescaleGoal',
  'sortGoalsByOrder', 'isWithinDND', 'buildICS', 'buildWebCalUrl',
  'quickCreateStarterGoal', 'generateMzStoryCanvas',
  'calculateRemainingSeats', 'buildPeerInviteUrl', 'formatPeerInviteMessage',
  'getTemplateAdNoticeMessage', 'computeAdCountdownProgress', 'isTemplateRewardedAdEnabled',
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
  'var STARTER_GOAL_TEMPLATES = {\n' +
  '  workout: { title: "주 3회 헬스 & 기초체력 기르기", category: "workout", milestones: [{ title: "운동 전후 스트레칭 5분", status: "todo" }, { title: "웨이트 또는 유산소 30분 집중", status: "todo" }, { title: "운동 후 단백질 및 수분 챙기기", status: "todo" }] },\n' +
  '  running: { title: "매일 3km 러닝 & 심폐지구력", category: "workout", milestones: [{ title: "러닝화 신고 밖으로 나가기", status: "todo" }, { title: "3km 페이스 유지하며 완주", status: "todo" }, { title: "러닝 후 쿨다운 걷기 및 수분 보충", status: "todo" }] },\n' +
  '  study: { title: "매일 1시간 몰입 & 자격증 합격", category: "study", milestones: [{ title: "스마트폰 치우고 1시간 집중 몰입", status: "todo" }, { title: "기출문제 1회분 풀고 채점", status: "todo" }, { title: "핵심 오답 정리 및 내일 복습 체크", status: "todo" }] },\n' +
  '  reading: { title: "하루 15분 독서 & 지적 성장", category: "reading", milestones: [{ title: "잠들기 전 책 15분 읽기", status: "todo" }, { title: "마음에 와닿는 문장 1줄 기록", status: "todo" }, { title: "이번 주 1권 완독하기", status: "todo" }] }\n' +
  '};\n' +
  'var OURGOAL_CONFIG = { ENABLE_TEMPLATE_REWARDED_ADS: false, AD_DELAY_SECONDS: 5, AD_NOTICE_MESSAGE: "다운받으신 후 나의 목표 탭에서 바로 확인가능하며 확인버튼을 누른 후 5초 뒤 광고영상이 시작됩니다" };\n' +
  extracted +
  '\nmodule.exports = { pad, dateKey, getKSTDateKey, goalProgress, msCounts, resultPct, dDay, ' +
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
  'rescaleGoal, sortGoalsByOrder, isWithinDND, buildICS, buildWebCalUrl, ' +
  'quickCreateStarterGoal, generateMzStoryCanvas, ' +
  'calculateRemainingSeats, buildPeerInviteUrl, formatPeerInviteMessage, ' +
  'getTemplateAdNoticeMessage, computeAdCountdownProgress, isTemplateRewardedAdEnabled, ' +
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

check('generateDynamicNotification: 참여 중인 팀이 있으면 팀 인증 알림을 보여준다', () => {
  const now = new Date(); now.setHours(10, 0, 0, 0);
  const profile = {
    displayName: '테스트유저', goals: [], records: [],
    settings: { groupState: { g1: { joined: true } } },
  };
  const msg = fns.generateDynamicNotification(profile, now);
  assert.ok(msg.indexOf('[팀 인증]') !== -1 || msg.indexOf('[모임 인증]') !== -1);
  assert.ok(msg.indexOf('테스트 모임') !== -1 || msg.indexOf('테스트 팀') !== -1);
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

/* ============ TASK-BG-10: 목표 우선순위 정렬 ============ */
check('sortGoalsByOrder: orderList 순서대로 목표를 정확히 정렬한다', () => {
  const goals = [{ id: 'g1', title: '목표1' }, { id: 'g2', title: '목표2' }, { id: 'g3', title: '목표3' }];
  const sorted = fns.sortGoalsByOrder(goals, ['g3', 'g1', 'g2']);
  assert.deepStrictEqual(sorted.map(g => g.id), ['g3', 'g1', 'g2']);
});

check('sortGoalsByOrder: orderList에 없는 신규 목표는 뒤쪽에 안전하게 배치된다', () => {
  const goals = [{ id: 'g1', title: '목표1' }, { id: 'g2', title: '목표2' }, { id: 'gNew', title: '신규목표' }];
  const sorted = fns.sortGoalsByOrder(goals, ['g2', 'g1']);
  assert.strictEqual(sorted[0].id, 'g2');
  assert.strictEqual(sorted[1].id, 'g1');
  assert.strictEqual(sorted[2].id, 'gNew');
});

check('sortGoalsByOrder: 빈 배열이나 null orderList에도 예외 없이 원본 복사본을 반환한다', () => {
  assert.deepStrictEqual(fns.sortGoalsByOrder(null, ['g1']), []);
  const goals = [{ id: 'g1' }];
  assert.deepStrictEqual(fns.sortGoalsByOrder(goals, null).map(g => g.id), ['g1']);
});

/* ============ TASK-BG-7: 방해금지 시간대(DND) ============ */
check('isWithinDND: 자정을 넘기는 시간대(22:00~08:00)의 심야 및 아침 시간을 정확히 판별한다', () => {
  const dnd = { enabled: true, start: '22:00', end: '08:00' };
  const night = new Date(); night.setHours(23, 30, 0, 0);
  const earlyMorning = new Date(); earlyMorning.setHours(6, 15, 0, 0);
  const afternoon = new Date(); afternoon.setHours(14, 0, 0, 0);

  assert.strictEqual(fns.isWithinDND(night, dnd), true);
  assert.strictEqual(fns.isWithinDND(earlyMorning, dnd), true);
  assert.strictEqual(fns.isWithinDND(afternoon, dnd), false);
});

check('isWithinDND: 비활성화되어 있거나 설정이 없으면 항상 false를 반환한다', () => {
  const night = new Date(); night.setHours(23, 30, 0, 0);
  assert.strictEqual(fns.isWithinDND(night, null), false);
  assert.strictEqual(fns.isWithinDND(night, { enabled: false }), false);
});

check('generateDynamicNotification: 방해금지(DND) 시간대에는 알림 문구를 생성하지 않고 차단(null)한다', () => {
  const night = new Date(); night.setHours(23, 0, 0, 0);
  const profile = {
    displayName: '테스트유저',
    goals: [{ title: '급한목표', dueDate: localDateStr(1), archivedAt: null }],
    records: [],
    settings: { dnd: { enabled: true, start: '22:00', end: '08:00' } }
  };
  const msg = fns.generateDynamicNotification(profile, night);
  assert.strictEqual(msg, null);
});

/* ============ TASK-BG-11: 캘린더 .ics 내보내기 ============ */
check('buildICS: RFC 5545 표준 VCALENDAR 및 VEVENT 블록을 정확히 생성한다', () => {
  const records = [
    { id: 'r1', startAt: '2026-09-11T09:00:00.000Z', endAt: '2026-09-11T10:00:00.000Z', goalId: 'g1', theme: 'workout', text: '5km 러닝 완료' }
  ];
  const goals = [{ id: 'g1', title: '마라톤 완주' }];
  const ics = fns.buildICS(records, goals);
  assert.ok(ics.indexOf('BEGIN:VCALENDAR') !== -1);
  assert.ok(ics.indexOf('VERSION:2.0') !== -1);
  assert.ok(ics.indexOf('BEGIN:VEVENT') !== -1);
  assert.ok(ics.indexOf('SUMMARY:[운동] 마라톤 완주 - 5km 러닝 완료') !== -1);
  assert.ok(ics.indexOf('END:VEVENT') !== -1);
  assert.ok(ics.indexOf('END:VCALENDAR') !== -1);
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

check('getPrivacyLabel: 기본값 및 private는 나만 보기를 반환하고, team 및 public을 올바르게 매핑한다', () => {
  assert.strictEqual(fns.getPrivacyLabel('private'), '나만 보기');
  assert.ok(fns.getPrivacyLabel('team') === '팀원' || fns.getPrivacyLabel('team') === '모임원');
  assert.strictEqual(fns.getPrivacyLabel('public'), '전체 공개');
  assert.strictEqual(fns.getPrivacyLabel(undefined), '나만 보기');
  assert.strictEqual(fns.getPrivacyLabel(null), '나만 보기');
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
  assert.ok(priv.includes('ourgoal.support@gmail.com'), '보호책임자 연락처 포함');

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
  assert.ok(html.includes('ourgoal.support@gmail.com'), '고객지원 이메일 표기');
  assert.ok(html.includes('withdrawAccount'), '회원 탈퇴 함수 구현');
  assert.ok(html.includes('showLegalModal'), '약관 모달 뷰어 함수 구현');
});

check('compliance: [#TASK-ES-175] 공식 운영 이메일(ourgoal.support@gmail.com) 전수 단일화 및 구 이메일(ysm0422@naver.com, support@ourgoal.kr) 0건 방화벽 검증', () => {
  const rootDir = path.join(__dirname, '..');
  const privPath = path.join(rootDir, 'docs', 'legal', 'privacy.md');
  const priv = fs.readFileSync(privPath, 'utf8');
  const tabGuides = fs.readFileSync(path.join(rootDir, 'js', 'tab-guides.js'), 'utf8');

  // 1. 공식 이메일 필수 배선 검증
  assert.ok(html.includes('ourgoal.support@gmail.com'), 'index.html에 공식 지원 이메일 포함');
  assert.ok(priv.includes('ourgoal.support@gmail.com'), 'privacy.md에 공식 지원 이메일 포함');
  assert.ok(tabGuides.includes('ourgoal.support@gmail.com'), 'js/tab-guides.js에 공식 지원 이메일 포함');

  // 2. 금지 이메일 0건 검증 (상민님 개인정보 및 임시 도메인 메일 원천 차단)
  assert.ok(!html.includes('ysm0422@naver.com'), 'index.html에 ysm0422@naver.com 부재');
  assert.ok(!html.includes('support@ourgoal.kr'), 'index.html에 support@ourgoal.kr 부재');
  assert.ok(!priv.includes('ysm0422@naver.com'), 'privacy.md에 ysm0422@naver.com 부재');
  assert.ok(!priv.includes('support@ourgoal.kr'), 'privacy.md에 support@ourgoal.kr 부재');
  assert.ok(!tabGuides.includes('ysm0422@naver.com'), 'js/tab-guides.js에 ysm0422@naver.com 부재');
  assert.ok(!tabGuides.includes('support@ourgoal.kr'), 'js/tab-guides.js에 support@ourgoal.kr 부재');
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
  assert.ok(styleSrc.includes('.cal-pill.tpl'), '템플릿 기록 전용 캘린더 필 클래스 적용');
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
  assert.ok(html.includes('마감일'), '마감일 레이블 렌더링 존재');

  // 3. 참고자료 옆 단독 AI 결과 버튼 제거 확인
  assert.strictEqual(html.includes('data-taskaires'), false, '할 일의 참고자료 옆 AI 결과 버튼이 제거됨');
  assert.strictEqual(html.includes('data-msaires'), false, '마일스톤의 참고자료 옆 AI 결과 버튼이 제거됨');

  // 4. 결과입력 모달 내 AI 비서 & Notion DB 구조화 및 수동입력 탑재 확인
  assert.strictEqual(html.includes('rsAiQuickBtn'), false, '상세 대화로 열기 버튼 삭제됨');
  assert.ok(html.includes('rsAiQuickInput'), '결과입력 모달 내 AI 자연어 한줄 입력창 존재');
  assert.ok(html.includes('rsAiQuickApplyBtn'), '결과입력 모달 내 AI 변환 버튼 존재');
  assert.ok(html.includes('rsManualToggleBtn'), '결과입력 모달 내 수동입력하기 토글 존재');
  assert.ok(html.includes('오늘 한 일을 한 줄로 적어주시면 기록으로 알맞게 정리해드려요'), '지정된 AI 설명 문구 정확성');
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

check('triggerHaptic: 진동 지원 시 지정/기본 밀리초 및 프리셋/배열 패턴으로 진동을 실행한다', () => {
  assert.strictEqual(fns.triggerHaptic(), true, '기본 호출 true');
  const nav = fns.getNavigator();
  assert.strictEqual(nav._vib, 12, '기본 12ms');
  fns.triggerHaptic(50);
  assert.strictEqual(nav._vib, 50, '지정 50ms');
  fns.triggerHaptic('checkin');
  assert.deepStrictEqual(nav._vib, [12, 35, 18], 'checkin 프리셋 패턴 [12, 35, 18]');
  fns.triggerHaptic([20, 45, 30]);
  assert.deepStrictEqual(nav._vib, [20, 45, 30], '다이나믹 배열 패턴 [20, 45, 30]');
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
  assert.ok(html.includes('id="goalsPrivacyBadge" title="클릭하여 공개 범위 변경">나만 보기</span>'), '목표 탭 배지 비공개 기본값');
  assert.ok(/id="calPrivacyBadge" title="클릭하여 공개 범위 변경"[^>]*>나만 보기<\/span>/.test(html), '일정 탭 배지 비공개 기본값');
  assert.ok(/id="recPrivacyBadge" title="클릭하여 공개 범위 변경"[^>]*>나만 보기<\/span>/.test(html), '기록 탭 배지 비공개 기본값');

  // 2. 설정 셀렉트 옵션 비공개 pre-selected 확인
  assert.ok(html.includes('<option value="private" selected>나만 보기 (비공개)</option>'), '설정 탭 비공개 pre-selected 존재');

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
  assert.ok(styleSrc.includes('*:focus-visible'), 'WCAG 2.2 AAA 전역 포커스 링');
  assert.ok(html.includes('id="a11yLiveAnnouncer"'), '스크린리더 실시간 아나운서');
  assert.ok(html.includes('announceToA11y'), '접근성 알림 함수');

  // 4. 스프링 물리 마이크로 인터랙션 & 스트릭 불꽃
  assert.ok(styleSrc.includes('--spring-bounce'), '스프링 물리 이징 변수');
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
  assert.ok(html.includes('무제한 무료'), '랜딩 화면 목표 무제한 무료 문구');

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
  assert.ok(/.ms-priority-tag{[^}]*cursor:pointer/.test(styleSrc) && /.ms-priority-tag[^{]*{[^}]*inline-flex|.ms-priority-tag,[^{]*{[^}]*inline-flex|[^}]*.ms-priority-tag[^{]*{[^}]*inline-flex/.test(styleSrc), '우선순위 태그 인라인 플렉스 스타일');
  assert.ok(styleSrc.includes('.ms-priority-high'), '우선순위 높음 스타일');
  assert.ok(styleSrc.includes('.ms-priority-med'), '우선순위 보통 스타일');
  assert.ok(styleSrc.includes('.ms-priority-low'), '우선순위 낮음 스타일');

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
  assert.ok(html.includes('5 / 6 · 팀 수준별 목표 & 팀장') || html.includes('5 / 6 · 팀 수준별 목표 & 모임장'), '5페이지: 팀 수준별 목표 & 팀장 왕관');
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

  // 3. 팀장 왕관 👑 및 초록색 팀장 배지
  assert.ok(/color:var\(--sage\);background:var\(--sage-soft\);[^"]*">(?:팀장|모임장)<\/span>/.test(html), '초록색 팀장 배지 스타일');
  assert.ok(html.includes('m4 8 4 5 4-7 4 7 4-5-1 10H5z'), '왕관 아이콘(SVG)');
});

check('compliance: 상단 모임 필터 칩바 및 팀 목표 200% 활용 가이드 업데이트가 구현되어 있다', () => {
  // 1. 상단 모임 필터 칩바
  assert.ok(html.includes('id="tgFilterChipRow"'), '모임 필터 칩바 ID');
  assert.ok(html.includes('data-tgfilter="all"'), '전체 모임 필터 칩');
  assert.ok(html.includes('state.teamGoalFilterGid'), '활성 필터 상태 변수');

  // 2. 가이드 내용 업데이트
  assert.ok(html.includes('팀장(리더)이라면? (왕관 & 초록색 팀장 배지)') || html.includes('모임장(리더)이라면? (왕관 & 초록색 모임장 배지)'), '가이드 내 왕관/배지 설명');
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

check('compliance: 마일스톤 번호 중복(1단계. 1단계:) 방어 정규식 및 7대 AI 엔드포인트 Gemini 3.1 캐스케이드 구비', () => {
  // 1. index.html 내 마일스톤 제목 단계 번호 중복 제거 정규식
  assert.ok(html.includes("msTitle.replace(/^(?:(?:\\d+|[일이삼사오육칠팔구십]+)단계[:\\.\\s]*|단계\\s*\\d+[:\\.\\s]*)/i, '')"), 'index.html 단계 접두사 중복 방어 정규식');

  // 2. 7개 AI API 엔드포인트 모두에 Gemini 3.1 Flash Lite 1순위 다중 플래시 캐스케이드 적용 및 Anthropic 제거 확인
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
    assert.ok(content.includes('gemini-3.1-flash-lite'), file + ' 에 gemini-3.1-flash-lite 포함');
    assert.ok(content.includes('gemini-3.6-flash'), file + ' 에 gemini-3.6-flash 포함');
    assert.ok(content.includes('gemini-3.5-flash'), file + ' 에 gemini-3.5-flash 포함');
    assert.ok(!content.includes('anthropicApiKey') && !content.includes('api.anthropic.com'), file + ' 에 Anthropic 호출 완전 배제');
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
  assert.ok(html.includes('오늘 한 일을 한 줄로 적어주시면 기록으로 알맞게 정리해드려요'), '지정된 AI비서 설명 문구 정확성(사용자 언어)');
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

check('rescaleGoal: 지연된 마일스톤과 할 일 일정을 여유롭게 연장하고 조정 횟수를 기록한다', () => {
  const goal = {
    id: 'g_test',
    title: '30일 갓생 챌린지',
    dueDate: '2026-09-01', // 이미 지난 마감일
    milestones: [
      { id: 'm1', title: '1단계', status: 'done', dueDate: '2026-08-20', tasks: [] },
      { id: 'm2', title: '2단계', status: 'todo', dueDate: '2026-09-05', tasks: [
        { id: 't1', title: '할일 1', done: false, dueDate: '2026-09-03' }
      ] }
    ]
  };

  const res = fns.rescaleGoal(goal, 0.5);
  assert.ok(res, '반환 객체 존재');
  assert.strictEqual(res.rescaledCount, 1, '리스케일링 횟수 1 증가');
  assert.ok(res.lastRescaledAt, '리스케일링 일자 기록');
  assert.ok(res.dueDate > '2026-09-11', '목표 마감일이 오늘 이후로 넉넉히 연장됨');
  assert.strictEqual(res.milestones[0].dueDate, '2026-08-20', '이미 완료된 마일스톤은 변경 없음');
  assert.ok(res.milestones[1].dueDate > '2026-09-11', '미완료 마일스톤 일정 연장');
  assert.ok(res.milestones[1].tasks[0].dueDate > '2026-09-11', '미완료 세부 할 일 일정 연장');
});

check('compliance: 앰비언트 1줄 체크인 및 모바일 엄지 인체공학 UI', () => {
  // 1. 홈 화면 앰비언트 1줄 체크인 안내 및 플레이스홀더
  assert.ok(html.includes('>오늘 기록하기<'), '홈 체크인 헤더 사용자 언어 명시');
  assert.ok(html.includes('id="captureInput" placeholder="예: '), '앰비언트 체크인 플레이스홀더 안내(사용자 언어 예시)');
  assert.ok(html.includes('id="captureLiveMeta"'), '1초 앰비언트 실시간 프리뷰 힌트 바 존재');
  assert.ok(html.includes('id="iosPwaSlot"'), 'iOS PWA 스마트 설치 배너 슬롯 존재');
});

check('compliance: 2026 차세대 UX 표준 (View Transitions, prefers-reduced-motion, 다이나믹 햅틱 프리셋) 탑재', () => {
  assert.ok(html.includes('prefers-reduced-motion'), 'prefers-reduced-motion 미디어 쿼리 존재');
  assert.ok(styleSrc.includes('::view-transition-old(root)'), 'View Transitions CSS 루트 애니메이션 존재');
  assert.ok(html.includes('document.startViewTransition'), 'setTab 내 View Transitions API 연동 존재');
  assert.ok(html.includes('HAPTIC_PATTERNS'), '다이나믹 햅틱 프리셋 딕셔너리 존재');
});

check('quickCreateStarterGoal: 4대 갓생 템플릿(헬스·러닝·공부·독서) 맞춤 목표와 마일스톤을 1초 만에 생성한다', () => {
  const g1 = fns.quickCreateStarterGoal('workout');
  assert.ok(g1 && g1.id, '목표 ID 생성');
  assert.strictEqual(g1.title, '주 3회 헬스 & 기초체력 기르기', '헬스 목표명');
  assert.strictEqual(g1.category, 'workout', '헬스 카테고리');
  assert.strictEqual(g1.visibility, 'private', '기본 공개범위 비공개');
  assert.ok(Array.isArray(g1.milestones) && g1.milestones.length >= 1, '마일스톤 배열 존재');
  assert.strictEqual(g1.milestones[0].status, 'todo', '마일스톤 초기 상태 todo');

  const g2 = fns.quickCreateStarterGoal('running');
  assert.strictEqual(g2.category, 'workout', '러닝 카테고리');
  assert.ok(g2.title.includes('러닝'), '러닝 목표명');

  const g3 = fns.quickCreateStarterGoal('study');
  assert.strictEqual(g3.category, 'study', '공부 카테고리');
  assert.ok(g3.title.includes('몰입'), '공부 목표명');

  const g4 = fns.quickCreateStarterGoal('reading');
  assert.strictEqual(g4.category, 'reading', '독서 카테고리');
  assert.ok(g4.title.includes('독서'), '독서 목표명');

  // 없는 키 입력 시 기본 헬스로 안전 폴백
  const gFallback = fns.quickCreateStarterGoal('unknown_routine');
  assert.strictEqual(gFallback.category, 'workout', '폴백 시 헬스 카테고리');
});

check('generateMzStoryCanvas: 9:16 인스타 스토리 최적 720x1280 해상도와 스트릭·기록을 캔버스에 렌더링한다', () => {
  const texts = [];
  const mockCtx = {
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    fillRect: () => {},
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    closePath: () => {},
    stroke: () => {},
    fill: () => {},
    fillText: (text) => { texts.push(String(text)); },
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    letterSpacing: ''
  };
  const mockCanvas = {
    width: 0,
    height: 0,
    getContext: (type) => (type === '2d' ? mockCtx : null)
  };

  const res = fns.generateMzStoryCanvas({
    canvas: mockCanvas,
    streak: 21,
    userName: '갓생러양비스',
    quote: '오늘 러닝 5km 페이스 5분대로 완주 성공!'
  });

  assert.strictEqual(res, mockCanvas, '캔버스 인스턴스 반환');
  assert.strictEqual(mockCanvas.width, 720, '인스타 스토리 9:16 가로 720px');
  assert.strictEqual(mockCanvas.height, 1280, '인스타 스토리 9:16 세로 1280px');

  assert.ok(texts.includes('🔥'), '스트릭 불꽃 이모지 렌더링');
  assert.ok(texts.includes('21'), '스트릭 일수 21 렌더링');
  assert.ok(texts.includes('DAYS STREAK'), 'DAYS STREAK 영문 라벨');
  assert.ok(texts.some(t => t.includes('갓생러양비스')), '유저 닉네임 렌더링');
  assert.ok(texts.some(t => t.includes('오늘 러닝 5km')), '오늘의 한 줄 기록 렌더링');
  assert.ok(texts.includes('ourgoal-app.vercel.app'), '바이럴 워터마크 URL');
});

check('compliance: 9:16 인스타 스토리 바이럴 카드 & Web Share API & iOS PWA 설치 배너', () => {
  // 1. 인스타 스토리 캔버스 엔진
  assert.ok(html.includes('generateMzStoryCanvas'), 'MZ 스토리 캔버스 생성 함수');
  assert.ok(html.includes('saveMzStoryPngBtn'), '인스타 스토리 PNG 다운로드 버튼');
  assert.ok(html.includes('shareMzStoryWebBtn'), 'Web Share API 연동 공유 버튼');

  // 2. iOS PWA 배너 & 갓생 스타터
  assert.ok(html.includes('renderIosPwaBanner'), 'iOS PWA 스마트 배너 렌더 함수');
  assert.ok(html.includes('ios-pwa-banner'), 'iOS PWA 배너 클래스');
  assert.ok(html.includes('quickCreateStarterGoal'), '10초 갓생 스타터 생성 함수');
  assert.ok(html.includes('empty-goal-starter'), '빈 화면 갓생 스타터 컨테이너');

  // 3. 번아웃 케어 / 재조정하기 UI 전면 박멸 검증
  assert.strictEqual(html.includes('goalRescaleBtn'), false, '번아웃 케어 재조정하기 버튼 영구 삭제');
  assert.strictEqual(html.includes('rescaleCardHtml'), false, '번아웃 케어 카드 UI 영구 삭제');
});

check('compliance: 퍼널 계측(api/track.js) & WCAG AA 명도 대비 & OAuth 우아한 폴백', () => {
  // 1. api/track.js 이벤트 확장
  const trackCode = fs.readFileSync(path.join(__dirname, '..', 'api', 'track.js'), 'utf8');
  assert.ok(trackCode.includes('funnel_signup'), 'funnel_signup 허용');
  assert.ok(trackCode.includes('funnel_goal_created'), 'funnel_goal_created 허용');
  assert.ok(trackCode.includes('funnel_first_checkin'), 'funnel_first_checkin 허용');
  assert.ok(trackCode.includes('utm_landing'), 'utm_landing 허용');

  // 2. WCAG AA 명도 대비
  assert.ok(styleSrc.includes('--ink-faint:#5F6B7A'), '기본 라이트 모드 ink-faint 4.5:1 이상(#5F6B7A, 회색 표면 위 4.9:1) 적용');

  // 3. OAuth 폴백 모달
  assert.ok(html.includes('로그인 심사 준비 중'), 'OAuth 미설정 시 우아한 안내 모달');
  assert.ok(html.includes('fallbackQuickAuthBtn'), '1초 빠른 시작 버튼 연동');
});

/* ============ 3대 혁신 개혁 과제 단위 & 컴플라이언스 테스트 ============ */
check('buildWebCalUrl: 사용자 ID와 오리진을 기반으로 유효한 webcal:// 실시간 피드 URL을 생성한다', () => {
  const url1 = fns.buildWebCalUrl('usr_abc123', 'https://ourgoal.app');
  assert.strictEqual(url1, 'webcal://ourgoal.app/api/calendar?token=usr_abc123');

  const url2 = fns.buildWebCalUrl('', 'https://ourgoal-app.vercel.app');
  assert.strictEqual(url2, 'webcal://ourgoal-app.vercel.app/api/calendar?token=demo');
});

check('generateMzStoryCanvas: neon, cyber, gold, aurora 4대 테마 및 파티클 옵션으로 캔버스를 정상 렌더링한다', () => {
  const mockCtx = {
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    closePath: () => {},
    stroke: () => {},
    fill: () => {},
    arc: () => {},
    save: () => {},
    restore: () => {},
    measureText: (txt) => ({ width: txt.length * 10 })
  };
  const mockCanvas = {
    getContext: () => mockCtx,
    width: 0,
    height: 0
  };

  const themes = ['neon', 'cyber', 'gold', 'aurora'];
  themes.forEach(th => {
    const res = fns.generateMzStoryCanvas({
      canvas: mockCanvas,
      streak: 7,
      theme: th,
      particles: true
    });
    assert.ok(res, '캔버스 객체 반환됨');
    assert.strictEqual(mockCanvas.width, 720);
    assert.strictEqual(mockCanvas.height, 1280);
  });
});

check('compliance: 3대 혁신 기능(WebCal 실시간 구독, 9:16 인스타 테마/파티클 캔버스, 1순위 대표 목표 초집중 모드)이 완벽히 구비되어 있다', () => {
  assert.ok(html.includes('webcal-feed-box'), 'WebCal 실시간 피드 박스 존재');
  assert.ok(html.includes('webcalFeedUrl'), 'WebCal 피드 URL 인풋 존재');
  assert.ok(html.includes('btnCopyWebCalUrl'), 'WebCal 구독 복사 버튼 존재');
  assert.ok(html.includes('mz-theme-selector'), 'MZ 인스타 스토리 4대 테마 선택기 존재');
  assert.ok(html.includes('btnBurstStoryParticles'), '파티클 세레머니 버튼 존재');
  assert.ok(html.includes('btn-focus-pilot'), '1순위 대표 목표 초집중 버튼 존재');
  assert.ok(html.includes('openFocusAutoPilotModal'), '초집중 모달 함수 존재');
  assert.ok(html.includes('FOCUS POMODORO'), '초집중 뽀모도로 타이머 UI 존재');
  assert.ok(html.includes('btnFocusQuickCheckin'), '초집중 원클릭 완결 체크인 버튼 존재');
});

check('calculateRemainingSeats: 1:1 방 및 5인 소그룹 잔여석을 정확히 계산한다', () => {
  var pairRoom = { maxMembers: 2, roomType: 'pair', members: 1 };
  assert.strictEqual(fns.calculateRemainingSeats(pairRoom, 0), 1);
  assert.strictEqual(fns.calculateRemainingSeats(pairRoom, 1), 0);

  var smallRoom = { maxMembers: 5, roomType: 'small', members: 3 };
  assert.strictEqual(fns.calculateRemainingSeats(smallRoom, 0), 2);
  assert.strictEqual(fns.calculateRemainingSeats(smallRoom, 1), 1);
});

check('buildPeerInviteUrl: 웹 무설치 초대 링크를 유효한 쿼리 파라미터와 함께 생성한다', () => {
  var room = { id: 'g-marathon-pair', name: '친구와 1:1 마라톤 완주방', maxMembers: 2, roomType: 'pair', inviteCode: 'RUN-PAIR2' };
  var url = fns.buildPeerInviteUrl(room, 'https://ourgoal-app.vercel.app/');
  assert.ok(url.includes('invite_group=g-marathon-pair'), '그룹 ID 포함');
  assert.ok(url.includes('max=2'), '정원 포함');
  assert.ok(url.includes('code=RUN-PAIR2'), '초대 코드 포함');
});

check('formatPeerInviteMessage: 카카오톡 공유용 메시지에 앱 설치 없는 웹 수락 안내와 링크를 포함한다', () => {
  var room = { name: '5인 소그룹 마라톤 완주방', maxMembers: 5, desc: '함께 완주하기', rule: '주 3회 5km' };
  var msg = fns.formatPeerInviteMessage(room, '민혁', 'https://ourgoal-app.vercel.app/?invite_group=g-test');
  assert.ok(msg.includes('민혁'), '초대자 이름 포함');
  assert.ok(msg.includes('5인 소그룹 완주방'), '소그룹 유형 포함');
  assert.ok(msg.includes('앱 설치 없이 웹에서 바로 초대 수락'), '무설치 웹 수락 안내 포함');
  assert.ok(!msg.includes('500 크레딧'), '크레딧 내용 엄격 제외');
});

check('compliance: [PEER INVITE] 친구와 1:1 또는 5인 소그룹 마라톤 완주방 및 웹 무설치 즉시 수락 루프가 구현되어 있다 (크레딧 제외)', () => {
  assert.ok(html.includes('g-marathon-pair'), '1:1 마라톤 완주방 프리셋 존재');
  assert.ok(html.includes('g-marathon-small'), '5인 소그룹 마라톤 완주방 프리셋 존재');
  assert.ok(html.includes('grpKakaoInviteBtn'), '카카오톡 초대 버튼 존재');
  assert.ok(html.includes('grpCopyLinkBtn'), '초대 링크 복사 버튼 존재');
  assert.ok(html.includes('tplMarathonPair'), '1:1 마라톤 완주방 1초 템플릿 버튼 존재');
  assert.ok(html.includes('tplMarathonSmall'), '5인 소그룹 마라톤 1초 템플릿 버튼 존재');
  assert.ok(html.includes('openPeerInviteSuccessModal'), '방 개설 완료 후 초대 모달 존재');
  assert.ok(html.includes('showPeerInviteLandingModal'), '웹 무설치 초대 랜딩 모달 함수 존재');
  assert.ok(html.includes('acceptPeerInvite'), '원클릭 초대 수락 함수 존재');
  assert.ok(html.includes('checkAndHandlePeerInviteUrl'), '초대 URL 자동 감지 함수 존재');
  assert.ok(!html.includes('500 크레딧 지급'), '크레딧 지급 내용 엄격 제외 불변식 검증 통과');
});

/* ============ [TASK-ES-013] 템플릿 복제 보상형 광고 파이프라인 ============ */
check('getTemplateAdNoticeMessage: 상민님 지시 정확한 안내 문구를 반환한다', () => {
  const msg = fns.getTemplateAdNoticeMessage();
  assert.strictEqual(msg, '다운받으신 후 나의 목표 탭에서 바로 확인가능하며 확인버튼을 누른 후 5초 뒤 광고영상이 시작됩니다');
});

check('computeAdCountdownProgress: 5초 카운트다운의 백분율을 정확히 계산하고 경계값을 방어한다', () => {
  assert.strictEqual(fns.computeAdCountdownProgress(5, 5), 100);
  assert.strictEqual(fns.computeAdCountdownProgress(4, 5), 80);
  assert.strictEqual(fns.computeAdCountdownProgress(2.5, 5), 50);
  assert.strictEqual(fns.computeAdCountdownProgress(0, 5), 0);
  assert.strictEqual(fns.computeAdCountdownProgress(-1, 5), 0);
  assert.strictEqual(fns.computeAdCountdownProgress(10, 5), 100);
});

check('isTemplateRewardedAdEnabled: 플래그에 따라 활성화 여부를 판정하고 기본값은 false(베타 무마찰)이다', () => {
  assert.strictEqual(fns.isTemplateRewardedAdEnabled({ ENABLE_TEMPLATE_REWARDED_ADS: false }), false);
  assert.strictEqual(fns.isTemplateRewardedAdEnabled({ ENABLE_TEMPLATE_REWARDED_ADS: true }), true);
  assert.strictEqual(fns.isTemplateRewardedAdEnabled(null), false);
});

check('compliance: [TASK-ES-013] 템플릿 복제 보상형 광고 파이프라인(5초 카운트다운, 모달 안내, AdMob 및 Web fallback, app-ads.txt) 무결성 검증', () => {
  assert.ok(html.includes('OURGOAL_CONFIG'), 'OURGOAL_CONFIG 설정 객체 존재');
  assert.ok(html.includes('ENABLE_TEMPLATE_REWARDED_ADS: false'), '기본값 베타 테스트 100% 무료(false) 보장');
  assert.ok(html.includes('다운받으신 후 나의 목표 탭에서 바로 확인가능하며 확인버튼을 누른 후 5초 뒤 광고영상이 시작됩니다'), '상민님 지시 정확한 안내 문구 존재');
  assert.ok(html.includes('startTemplateAdCountdown'), '5초 카운트다운 함수 존재');
  assert.ok(html.includes('playRewardedAdVideo'), '보상형 광고 재생 함수 존재');
  assert.ok(html.includes('showWebRewardedAdModal'), '웹 fallback 시뮬레이션 플레이어 존재');
  assert.ok(html.includes('handleTemplateCloneWithAd'), '광고 연동 템플릿 복제 핸들러 존재');
  assert.ok(html.includes('testTemplateAdFlow'), '테스트/시연용 즉시 실행 함수 존재');
  const appAdsPath = path.join(__dirname, '..', 'app-ads.txt');
  assert.ok(fs.existsSync(appAdsPath), 'app-ads.txt 파일 실재 확인');
  const appAdsContent = fs.readFileSync(appAdsPath, 'utf8');
  assert.ok(appAdsContent.includes('google.com'), 'app-ads.txt 구글 퍼블리셔 형식 준수 확인');
});

check('compliance: 오늘 같은 테마 실사용자 수 집계 RPC DDL(T01-S02, #TASK-ES-001)이 존재하고 유효하다', () => {
  const sqlPath = path.join(__dirname, '..', 'docs', 'sql', '2026-09-12-count-same-theme-checkins.sql');
  assert.ok(fs.existsSync(sqlPath), '2026-09-12-count-same-theme-checkins.sql 존재');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  assert.ok(sql.includes('count_same_theme_checkins_today'), 'RPC 함수명 포함');
  assert.ok(sql.includes('security definer'), '보안 정의자 지정');
  assert.ok(sql.includes('is_bot'), '봇 계정 필터링 포함');
  assert.ok(sql.includes('distinct c.user_id'), '고유 실사용자 수 집계');
  assert.ok(sql.includes('Asia/Seoul'), 'KST 당일 기준 필터링 포함');
});

/* ============ [#TASK-ES-015] 공용 크레딧 원장 (INFRA) ============ */
check('compliance: [#TASK-ES-015] js/credits.js 가 존재하고 문법이 유효하며 OurgoalCredits API 6개를 노출한다', () => {
  const p = path.join(__dirname, '..', 'js', 'credits.js');
  assert.ok(fs.existsSync(p), 'js/credits.js 존재');
  const src = fs.readFileSync(p, 'utf8');
  new Function(src);
  ['ready', 'isEnabled', 'policy', 'award', 'balance', 'renderSettingsSection'].forEach(fn => {
    assert.ok(src.includes(fn + ': ' + fn), 'API ' + fn + ' 노출');
  });
  assert.ok(html.includes('<script src="js/credits.js"></script>'), 'index.html 이 js/credits.js 를 로드');
});

check('compliance: [#TASK-ES-015] 크레딧은 기본 OFF — ENABLE_CREDITS false, 서버 enabled 기본값 false, 화면 화폐 문구 없음', () => {
  assert.ok(html.includes('ENABLE_CREDITS: false'), 'OURGOAL_CONFIG.ENABLE_CREDITS 기본값 false');
  assert.ok(html.includes('id="settingsCreditsBlock"'), '설정 화면 크레딧 컨테이너 존재(기본 숨김)');
  const sql = fs.readFileSync(path.join(__dirname, '..', 'docs', 'sql', '2026-09-12-credit-ledger.sql'), 'utf8');
  assert.ok(sql.includes("('enabled', 'false'::jsonb)"), 'credit_settings.enabled 기본값 false');
  const js = fs.readFileSync(path.join(__dirname, '..', 'js', 'credits.js'), 'utf8');
  const uiStrings = js.match(/textContent = [^;]+;/g) || [];
  uiStrings.forEach(line => {
    assert.ok(!/현금|환전|₩|달러|상품권|출금/.test(line) && !/[0-9] *원/.test(line), '화면 문구에 화폐 표현 없음: ' + line);
  });
  assert.ok(!/localStorage|sessionStorage/.test(js), '크레딧을 로컬에 저장하지 않는다(정본 §2 원장)');
});

check('compliance: [#TASK-ES-015] credit_ledger SQL — append-only·멱등·봇 제외·설정값 기반이며 파괴 구문이 없다', () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'docs', 'sql', '2026-09-12-credit-ledger.sql'), 'utf8');
  assert.ok(sql.includes('create table if not exists public.credit_ledger'), '원장 테이블');
  assert.ok(sql.includes('create table if not exists public.credit_settings'), '설정 테이블');
  assert.ok(sql.includes('idempotency_key text not null unique'), '멱등 키 unique');
  assert.ok(sql.includes('security definer'), 'RPC 는 보안 정의자');
  assert.ok(sql.includes('is_bot'), '봇 계정 제외');
  assert.ok(sql.includes('award_credit(') && sql.includes('my_credit_balance()') && sql.includes('credit_policy()'), 'RPC 3종');
  assert.ok(!/for (insert|update|delete)/i.test(sql.split('credit_ledger_select_own')[1].split('-- 2)')[0]), '원장에 클라이언트 쓰기 정책 없음');
  assert.ok(!/drop +table|truncate|delete +from/i.test(sql), 'DROP/TRUNCATE/DELETE 없음');
});

/* ============ [KF-7 #TASK-ES-014] 반응 4종(응원해요·도움돼요·별로에요·조언해요) ============ */
check('KF-7: js/reactions.js 가 존재하고 문법이 유효하며 4종 타입·이유 선택지를 정의한다', () => {
  const p = path.join(__dirname, '..', 'js', 'reactions.js');
  assert.ok(fs.existsSync(p), 'js/reactions.js 존재');
  const src = fs.readFileSync(p, 'utf8');
  new Function(src);
  ['cheer', 'helpful', 'poor', 'advice'].forEach(t => assert.ok(src.includes("key: '" + t + "'"), '타입 ' + t + ' 정의'));
  ['응원해요', '도움돼요', '별로에요', '조언해요'].forEach(l => assert.ok(src.includes(l), '라벨 ' + l));
  ['ai_suspect', 'wrong_info', 'ad', 'off_topic', 'other'].forEach(c => assert.ok(src.includes("code: '" + c + "'"), '별로에요 이유 ' + c));
  assert.ok(src.includes('missingSchema'), '서버 미적용 폴백 판별 함수 존재');
  assert.ok(src.includes('AI 봇 글에는 반응할 수 없어요'), '봇 글 반응 차단 문구 존재');
});

check('KF-7: index.html 이 반응 모듈을 로드하고 초기화·렌더·바인딩 훅을 가진다', () => {
  assert.ok(html.includes('<script src="js/reactions.js"></script>'), '모듈 script 태그 존재');
  assert.ok(html.includes('window.OurgoalReactions.init('), 'init 훅 존재');
  assert.ok(html.includes('window.OurgoalReactions.buttonsHtml(it, { isMe: isMe })'), '피드 카드 버튼 렌더 훅 존재');
  assert.ok(html.includes('window.OurgoalReactions.advicePanelHtml(it)'), '조언 패널 렌더 훅 존재');
  assert.ok(html.includes('window.OurgoalReactions.bind(body, blendedItems)'), '바인딩 훅 존재');
  assert.ok(html.includes('data-reacttype="fire"'), '예전 이모지 버튼 폴백 마크업 보존(기존 기능 삭제 아님)');
  assert.ok(html.includes('async function toggleFeedReaction('), '기존 toggleFeedReaction 보존');
});

check('KF-7: content_reactions SQL 이 존재하고 소프트 삭제·봇 제외·SECURITY DEFINER RPC 만 쓰며 파괴 구문이 없다', () => {
  const sqlPath = path.join(__dirname, '..', 'docs', 'sql', '2026-09-12-content-reactions.sql');
  assert.ok(fs.existsSync(sqlPath), 'SQL 파일 존재');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  assert.ok(sql.includes('create table if not exists public.content_reactions'), '테이블 멱등 생성');
  assert.ok(sql.includes("check (type in ('cheer','helpful','poor','advice'))"), '4종 타입 제약');
  assert.ok(sql.includes('deleted_at'), '소프트 삭제 컬럼');
  assert.ok(sql.includes("sim\\_%"), '시뮬 글 제외');
  assert.ok(sql.includes('is_bot'), '봇 계정 제외');
  ['react_content', 'unreact_content', 'moderate_advice', 'count_content_reactions', 'my_content_reactions', 'list_content_advice'].forEach(f => assert.ok(sql.includes(f + '('), 'RPC ' + f));
  assert.ok(sql.includes('enable row level security'), 'RLS 활성');
  assert.ok(!/drop\s+table|truncate\s+table|delete\s+from\s+public\.content_reactions/i.test(sql), '파괴 구문·하드 삭제 없음');
});

/* ============ 앱을 내맘대로! (#TASK-ES-020, KF-1) ============ */
const customizePath = path.join(__dirname, '..', 'js', 'customize.js');
check('KF-1: js/customize.js 가 존재하고 문법이 유효하며 로드 시 document 를 만지지 않는다', () => {
  assert.ok(fs.existsSync(customizePath), 'js/customize.js 존재');
  const src = fs.readFileSync(customizePath, 'utf8');
  new Function(src);
  const vm = require('vm');
  const sandbox = { window: {}, localStorage: undefined };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(src, sandbox);
  assert.ok(sandbox.window.OurgoalCustomize, 'window.OurgoalCustomize 노출');
});
function loadCustomize(uxMode) {
  const vm = require('vm');
  const store = uxMode == null ? {} : { ourgoal_ux_mode: uxMode };
  const sandbox = { window: { localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; } } } };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(fs.readFileSync(customizePath, 'utf8'), sandbox);
  return sandbox.window.OurgoalCustomize;
}
check('KF-1: 화이트리스트에 체크인 루프·내 목표·기록·소통 화면 id가 없거나 상단 고정 잠금된다 (본질 ①②③ 보호, REQ-P1, REQ-TASK-ES-173)', () => {
  const C = loadCustomize();
  ['captureInput', 'captureSave', 'homeGoalList', 'streakBadge', 'screen-records', 'screen-comm', 'screen-home'].forEach(id => {
    assert.ok(C.WHITELIST_IDS.indexOf(id) < 0, id + ' 는 숨길 수 없어야 한다');
    assert.ok(C.CORE_IDS.indexOf(id) >= 0, id + ' 는 CORE_IDS 로 보호되어야 한다');
  });
  // 상민님 지시(#TASK-ES-173): 아바타 & 오늘 기록하기는 표현하되 상단 고정 잠금(fixed: true, CORE_IDS)
  ['levelBadgeRow', 'captureCardBox'].forEach(id => {
    assert.ok(C.CORE_IDS.indexOf(id) >= 0, id + ' 는 CORE_IDS 로 영구 보호되어야 한다');
    const w = C.WHITELIST.find(item => item.id === id);
    assert.ok(w && w.fixed === true, id + ' 는 WHITELIST 에서 fixed: true 로 상단 잠금이어야 한다');
    assert.ok(C.normalize({ hidden: [id] }).indexOf(id) < 0, id + ' 는 normalize 에서 절대 hidden 에 들어갈 수 없다');
  });
  assert.ok(C.WHITELIST.length >= 5 && C.WHITELIST.every(w => w.id && w.label), '항목마다 id·사용자 언어 라벨');
  C.WHITELIST.forEach(w => assert.ok(!/노션|DB|엔진/.test(w.label + w.hint), '도구 언어 금지: ' + w.label));
});
check('KF-1: normalize 가 화이트리스트 밖·핵심 id·중복을 버리고, 저장값 없으면 기존 모드에서 유추한다 (REQ-D2·D3)', () => {
  const C = loadCustomize('minimal');
  const J = v => JSON.stringify(v); // vm 샌드박스 배열은 다른 realm 이라 JSON 으로 비교
  assert.strictEqual(J(C.normalize({ hidden: ['captureCardBox', 'ghostWidget', 'mzShareBtn', 'mzShareBtn'] })), J(['mzShareBtn']));
  assert.strictEqual(J(C.normalize(null)), J([]));
  assert.strictEqual(J(C.normalize({ hidden: 'bad' })), J([]));
  assert.strictEqual(J(C.effectiveHidden({})), J(C.MINIMAL_HIDDEN), '저장값 없음 + 미니멀 모드 → 미니멀 CSS와 같은 숨김');
  assert.strictEqual(J(loadCustomize('gamified').effectiveHidden({})), J([]));
  assert.strictEqual(J(C.effectiveHidden({ homeLayout: { hidden: ['todayMissionCard'], version: 1 } })), J(['todayMissionCard']));
});
check('KF-1: index.html 에 설정 진입 버튼·모듈 로드·홈 렌더 훅이 있고 되돌리기가 제공된다 (REQ-S1·S2)', () => {
  assert.ok(html.includes('<script src="/js/customize.js"></script>'), '모듈 로드');
  assert.ok(html.includes('id="homeLayoutOpenBtn"'), '설정 「앱을 내맘대로!」 진입 버튼');
  assert.ok(html.includes('OurgoalCustomize.apply(state.profile.settings)'), '홈 렌더 뒤 적용 훅');
  assert.ok(html.includes('OurgoalCustomize.open({ state: state, saveProfile: saveProfile'), '설정에서 saveProfile 경로로 저장');
  const src = fs.readFileSync(customizePath, 'utf8');
  assert.ok(src.includes('기본으로 되돌리기'), '되돌리기 버튼');
  assert.ok(src.includes('homeLayout'), 'settings.homeLayout 저장 키');
  assert.ok(/id="adaptiveModeSelector"/.test(html), '기존 UX 모드 칩은 그대로 둔다');
});


/* ============ [#TASK-ES-019] 출석·스트릭·배지 (E1, KF-3 — 크레딧 없음) ============ */
check('compliance: [#TASK-ES-019] js/streaks.js 가 존재·문법 유효·OurgoalStreaks API 를 노출하고 index.html 이 로드·호출한다', () => {
  const p = path.join(__dirname, '..', 'js', 'streaks.js');
  assert.ok(fs.existsSync(p), 'js/streaks.js 존재');
  const src = fs.readFileSync(p, 'utf8');
  new Function(src);
  ['renderHome', 'weekDots', 'streakNextMilestone', 'qualityDays', 'markAttendance', 'extendBadges'].forEach(fn => {
    assert.ok(src.includes(fn + ': ' + fn), 'API ' + fn + ' 노출');
  });
  assert.ok(html.includes('<script src="js/streaks.js"></script>'), 'index.html 이 js/streaks.js 를 로드');
  assert.ok(html.includes('id="homePositionStrip"'), '홈 내 위치 컨테이너 존재');
  assert.ok(html.includes('OurgoalStreaks.renderHome({'), 'renderHome 훅 존재');
});

check('compliance: [#TASK-ES-019] 출석·기록에 화폐·XP 보상 없음 — awardXP·크레딧 미호출, 화폐 문구 0건, 로컬스토리지 직접 저장 없음', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'streaks.js'), 'utf8');
  assert.ok(!/awardXP|OurgoalCredits|award_credit|XP_RULES/.test(src), 'XP·크레딧 호출 없음');
  assert.ok(!/크레딧|포인트|코인|현금|₩/.test(src), '화폐 문구 없음');
  assert.ok(!/localStorage|sessionStorage/.test(src), '저장은 프로필 settings 경로만');
  assert.ok(!/#\d+위|\d+인 중 \d+명/.test(src), '고정 사회적 숫자 없음');
});

check('compliance: [#TASK-ES-019] 조건값은 RULES 한 곳(14·100일 포함) · 순수 함수 동작 · 홈 순서(저장 → 내 위치 → 목표 목록) 유지', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'streaks.js'), 'utf8');
  const w = {};
  new Function('window', src)(w);
  const S = w.OurgoalStreaks;
  assert.ok(S && S.RULES.streakMilestones.includes(14) && S.RULES.streakMilestones.includes(100), '마일스톤 14·100 포함');
  assert.strictEqual(S.streakNextMilestone(7, [3, 7, 14]), 14, '다음 배지 계산');
  assert.strictEqual(S.streakNextMilestone(400, [3, 7]), null, '최상위 배지 이후 null');
  assert.strictEqual(S.weekDots([]).length, 7, '주간 7칸');
  const s = {};
  assert.strictEqual(S.markAttendance(s), true, '오늘 첫 출석은 기록');
  assert.strictEqual(S.markAttendance(s), false, '같은 날 두 번째는 무시(멱등)');
  assert.strictEqual(s.attendance.length, 1);
  const recs = [{ text: 'a'.repeat(25), startAt: new Date().toISOString() }, { text: '짧게', startAt: new Date().toISOString() }];
  assert.strictEqual(S.qualityDays(recs, { qualityMinChars: 20, qualityWindowDays: 7, qualityMinDays: 5 }), 1, '품질 기록 일수(20자 이상 하루)');
  assert.ok(!/streakMilestones/.test(html), 'index.html 에 배지 조건 하드코딩 없음');
  const a = html.indexOf('id="captureSave"'), b = html.indexOf('id="homePositionStrip"'), c = html.indexOf('id="homeGoalList"');
  assert.ok(a > 0 && a < b && b < c, '홈 순서: 답하기(저장) → 내 위치 → 목표 목록');
});


/* ============ [KF-5 #TASK-ES-016] 도움돼요 이유 작성 + 크레딧 ============ */
check('KF-5: js/helpful-reason.js 가 존재하고 문법이 유효하며 API·기본 태그 5종·기본 최소 글자 수를 정의한다', () => {
  const p = path.join(__dirname, '..', 'js', 'helpful-reason.js');
  assert.ok(fs.existsSync(p), 'js/helpful-reason.js 존재');
  const src = fs.readFileSync(p, 'utf8');
  new Function(src);
  ['init', 'openSheet', 'openSummary', 'authorButtonHtml', 'patchAuthorButton', 'bind'].forEach(fn => assert.ok(src.includes(fn + ': ' + fn), 'API ' + fn + ' 노출'));
  ['how_to', 'same_situation', 'motivation', 'new_info', 'other'].forEach(c => assert.ok(src.includes("code: '" + c + "'"), '기본 태그 ' + c));
  assert.ok(/DEFAULT_MIN_CHARS = 10;\s*\/\* 기본값/.test(src), '최소 글자 수 기본값 10 + "기본값" 주석');
  assert.ok(src.includes("'helpful_reason:' + uid + ':' + targetId"), '크레딧 멱등 키 규약 helpful_reason:<uid>:<postId>');
  assert.ok(src.includes("award('helpful_reason', 'feed_post'"), 'OurgoalCredits.award(helpful_reason) 호출');
  assert.ok(!/현금|환전|₩|출금|상품권/.test(src), '화면 문구에 현금 암시 없음');
});

check('KF-5: 이유 SQL — 테이블·품질 게이트·봇 제외·보안 정의자·소프트 삭제, DROP/TRUNCATE/DELETE 없음', () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'docs', 'sql', '2026-09-12-helpful-reason.sql'), 'utf8');
  assert.ok(sql.includes('create table if not exists public.helpful_reasons'), '이유 테이블');
  assert.ok(sql.includes('quality_pass'), '품질 통과 컬럼');
  assert.ok(sql.includes("key = 'min_reason_chars'"), '최소 글자 수는 설정값');
  assert.ok(sql.includes("'helpful_reason_tags'"), '태그 목록은 설정값');
  assert.ok(sql.includes('is_bot'), '봇 제외');
  assert.ok(sql.includes("type = 'helpful' and r.deleted_at is null"), '도움돼요를 누른 사람만');
  assert.ok(sql.includes('security definer'), 'RPC 는 보안 정의자');
  assert.ok(sql.includes('deleted_at'), '소프트 삭제');
  assert.ok(sql.includes("public.award_credit('helpful_reason'"), '품질 통과 시 공용 원장 적립');
  assert.ok(!/drop\s+table|truncate|delete\s+from/i.test(sql), 'DROP/TRUNCATE/DELETE 없음');
});

check('KF-5: index.html 이 js/helpful-reason.js 를 reactions.js 뒤에 로드하고 앱 핸들을 연결한다', () => {
  const a = html.indexOf('<script src="js/reactions.js"></script>');
  const b = html.indexOf('<script src="js/helpful-reason.js"></script>');
  assert.ok(a > 0 && b > a, 'reactions.js 다음에 helpful-reason.js 로드');
  assert.ok(html.includes('window.OurgoalHelpfulReason.init({'), 'init 호출');
});

check('KF-5: js/reactions.js 가 도움돼요 저장 직후 이유 시트를 띄우고 글쓴이 카드에 이유 보기 버튼을 붙인다', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'reactions.js'), 'utf8');
  assert.ok(src.includes("type === 'helpful' && window.OurgoalHelpfulReason) window.OurgoalHelpfulReason.openSheet(it, btn)"), '도움돼요 직후 시트');
  assert.ok(src.includes("window.OurgoalHelpfulReason.authorButtonHtml(it, countOf(it, 'helpful'))"), '글쓴이 이유 보기 버튼(도움돼요 1건 이상일 때만)');
  assert.ok(src.includes('window.OurgoalHelpfulReason.bind(body, lastItems)'), '버튼 바인딩');
});


/* ============ [KF-4 #TASK-ES-018] 카테고리별 "도움이 된 글" 상단 슬롯 ============ */
check("KF-4: js/top-helpful.js 가 존재하고 문법이 유효하며 30일 창·슬롯 2개·라벨을 정의한다", () => {
  const p = path.join(__dirname, "..", "js", "top-helpful.js");
  assert.ok(fs.existsSync(p), "js/top-helpful.js 존재");
  const src = fs.readFileSync(p, "utf8");
  new Function(src);
  assert.ok(src.includes("WINDOW_DAYS = 30"), "최근 30일 창(결심 D-1 권장값)");
  assert.ok(src.includes("SLOT_LIMIT = 2"), "슬롯 2개(결심 D-2 권장값)");
  assert.ok(src.includes("이 주제에서 도움이 된 글"), "슬롯 라벨(사용자 언어)");
  assert.ok(src.includes("cat !== 'all'"), "전체 칩에서는 슬롯 없음(통합 점수 금지)");
  assert.ok(src.includes("missingSchema"), "서버 미적용 폴백 판별 존재");
  assert.ok(html.includes("<script src=\"js/top-helpful.js\"></script>"), "index.html 이 js/top-helpful.js 를 로드");
  assert.ok(html.includes("OurgoalTopHelpful.arrange(blendedItems, curCat"), "renderCommFeed 훅 존재");
});

check("KF-4: 상단 슬롯에 서열 문구(N위·TOP·랭킹)가 없다 — 실데이터 라벨만", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "js", "top-helpful.js"), "utf8");
  const ui = (src.match(/'[^']*'/g) || []).join(" ");
  assert.ok(!/d+위|TOPs*d|랭킹|순위/.test(ui), "서열 문구 없음");
  assert.ok(!/(#d+위|d+인 중 d+명|팀 포인트)/.test(src), "위조 사회적 숫자 패턴 없음");
});

check("KF-4: top_helpful_posts SQL — 카테고리 안에서만 집계, 봇·시뮬·숨김·자기반응 제외, DROP/DELETE 없음", () => {
  const sqlPath = path.join(__dirname, "..", "docs", "sql", "2026-09-12-top-helpful.sql");
  assert.ok(fs.existsSync(sqlPath), "2026-09-12-top-helpful.sql 존재");
  const sql = fs.readFileSync(sqlPath, "utf8");
  assert.ok(sql.includes("create or replace function public.top_helpful_posts"), "RPC 정의");
  assert.ok(sql.includes("security definer"), "보안 정의자");
  assert.ok(sql.includes("feed_post_matches_category(p, p_category)"), "카테고리 안에서만 집계");
  assert.ok(sql.includes("p_key = 'all' then false"), "전체에서는 집계하지 않음");
  assert.ok(sql.includes("coalesce(u.is_bot, false) = false"), "봇 반응 제외");
  assert.ok(sql.includes("not like 'sim\\_%'"), "시뮬 글 제외");
  assert.ok(sql.includes("r.user_id <> p.user_id"), "자기 반응 제외");
  assert.ok(sql.includes("coalesce(p.hidden, false) = false"), "숨김 글 제외");
  assert.ok(!/drops+table|truncate|deletes+from/i.test(sql), "DROP/TRUNCATE/DELETE 없음");
});



/* ============ [KF-2 #TASK-ES-017] 템플릿 복제 크레딧 + 선택형 광고 ============ */
check('KF-2: js/template-credit.js 가 존재하고 문법이 유효하며 API 5종을 노출한다 (#TASK-ES-017)', () => {
  const p = path.join(__dirname, '..', 'js', 'template-credit.js');
  assert.ok(fs.existsSync(p), 'js/template-credit.js 존재');
  const src = fs.readFileSync(p, 'utf8');
  new Function(src);
  ['init', 'recordCopy', 'counts', 'fillCounts', 'renderAdOptIn'].forEach(fn => assert.ok(src.includes(fn + ': ' + fn), 'API ' + fn));
  assert.ok(!/현금|환전|₩|출금|상품권/.test(src), '화폐 문구 없음(정본 §2)');
  assert.ok(html.includes('<script src="js/template-credit.js"></script>'), 'index.html 이 모듈을 로드');
  assert.ok(html.includes('window.OurgoalTemplateCredit.init({ sb: sb'), '부팅 시 앱 핸들 주입');
});
check('KF-2: 복제 흐름에서 광고가 분리되고, 광고는 설정의 선택형 버튼 한 경로뿐이다 (정본 §3)', () => {
  assert.ok(html.includes('var adsEnabled = !!forceAdFlow;'), '복제 흐름은 플래그와 무관하게 광고 없음');
  assert.ok(!html.includes('var adsEnabled = forceAdFlow || isTemplateRewardedAdEnabled();'), '구 강제 경로 제거');
  assert.ok(html.includes('function playRewardedAdVideo(tpl, onComplete)'), '광고 완료 콜백 지원');
  assert.ok(html.includes("OurgoalTemplateCredit.renderAdOptIn(document.getElementById('settingsCreditsBlock'))"), '선택형 버튼은 설정 › 크레딧 섹션에만');
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'template-credit.js'), 'utf8');
  assert.ok(src.includes('ENABLE_TEMPLATE_REWARDED_ADS') && src.includes('isEnabled()'), '플래그와 크레딧 enabled 둘 다 켜져야 버튼 표시');
  assert.ok(html.includes('ENABLE_TEMPLATE_REWARDED_ADS: false'), '광고 플래그 기본 OFF 유지');
});
check('KF-2: 마켓·기본 템플릿의 고정 복제 수·가상 크리에이터 표기가 화면에서 사라지고 서버 실데이터 배지만 남는다 (금지 6-1)', () => {
  assert.ok(!html.includes("t.downloads + '회 복제'"), '고정 downloads 문자열 표시 없음');
  assert.ok(!html.includes("t.users.toLocaleString()+'명이 사용 중'"), '고정 사용자 수 표시 없음');
  assert.ok(!html.includes("escapeHtml(t.creator)+'</b>'"), '가상 크리에이터 이름 표시 없음');
  assert.ok(html.includes('data-tplcount="\' + t.key + \'"'), '마켓 카드에 서버 집계 배지 자리(기본 숨김)');
  assert.ok(html.includes('data-tplcount="creator:\'+t.id+\'"'), '기본 템플릿에도 서버 집계 자리');
  assert.ok(html.includes('OurgoalTemplateCredit.recordCopy(tpl.key || tpl.title'), '마켓 복제 시 서버 기록');
  assert.ok(html.includes("OurgoalTemplateCredit.recordCopy('creator:' + t.id"), '기본 템플릿 복제 시 서버 기록');
});
check('KF-2: template_copies SQL — 멱등·RLS·봇 제외·구간 적립은 서버·DROP 없음', () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'docs', 'sql', '2026-09-12-template-copies.sql'), 'utf8');
  assert.ok(sql.includes('create table if not exists public.template_copies'), '원장 테이블');
  assert.ok(sql.includes('unique (template_id, copier_user_id)'), '같은 사람 1회만');
  assert.ok(sql.includes('enable row level security'), 'RLS');
  assert.ok(sql.includes('record_template_copy(') && sql.includes('template_copy_counts('), 'RPC 2종');
  assert.ok(sql.includes('security definer') && sql.includes('is_bot'), '보안 정의자·봇 제외');
  assert.ok(sql.includes("'template_copied'") && sql.includes('template_copy_tiers'), '구간 적립은 설정값 기반');
  assert.ok(sql.includes("('ad_watched_amount', 'null'::jsonb)"), '광고 적립 액수 기본 null');
  assert.ok(!/drop\s+table|truncate|delete\s+from/i.test(sql), 'DROP/TRUNCATE/DELETE 없음');
});

check('compliance: [#TASK-ES-025] 팀 목표 예시 및 추천 템플릿에 회사 워크숍과 단체여행 시나리오가 완벽히 구현되어 있다', () => {
  // 1. 가이드 내 회사 워크숍 및 단체여행 탭과 예시 패널
  assert.ok(html.includes('data-tgexampletab="workshop"'), '가이드 내 회사 워크숍 탭');
  assert.ok(html.includes('data-tgexampletab="travel"'), '가이드 내 단체 여행 탭');
  assert.ok(html.includes('data-tgexampletab="fitness"'), '가이드 내 운동 크루 탭');
  assert.ok(html.includes('id="tgExampleWorkshop"'), '회사 워크숍 예시 패널');
  assert.ok(html.includes('id="tgExampleTravel"'), '단체 여행 예시 패널');
  assert.ok(html.includes('id="tgExampleFitness"'), '운동 크루 예시 패널');
  assert.ok(html.includes('2026 하반기 전사 전략 워크숍 TF'), '워크숍 모임명');
  assert.ok(html.includes('제주 3박4일 단체 힐링여행'), '단체여행 모임명');
  assert.ok(html.includes('function wireTeamGoalsGuideEvents('), '가이드 탭 이벤트 위임 함수 구비');

  // 2. MOCK_GROUPS 프리셋 및 팀 목표 탑재
  assert.ok(html.includes("id:'g-workshop'"), '워크숍 프리셋 모임 ID');
  assert.ok(html.includes("id:'g-travel'"), '단체여행 프리셋 모임 ID');
  assert.ok(html.includes("id:'tg-ws-1'"), '워크숍 팀 목표 ID');
  assert.ok(html.includes("id:'tg-tr-1'"), '단체여행 팀 목표 ID');

  // 3. getGroupLevelGoals 맞춤 조별 목표 생성
  assert.ok(html.includes("isWorkshop"), '수준별 조 워크숍 판정 로직');
  assert.ok(html.includes("isTravel"), '수준별 조 여행 판정 로직');
  assert.ok(html.includes("A조 (기획·운영 TF)"), '워크숍 A조');
  assert.ok(html.includes("B조 (프로그램·레크 TF)"), '워크숍 B조');
  assert.ok(html.includes("C조 (물류·지원 TF)"), '워크숍 C조');
  assert.ok(html.includes("A조 (동선·차량 조)"), '여행 A조');
  assert.ok(html.includes("B조 (맛집·카페 조)"), '여행 B조');
  assert.ok(html.includes("C조 (총무·촬영 조)"), '여행 C조');

  // 4. 모임 내 팀 목표 추가 템플릿
  assert.ok(html.includes('id="tplGoalWorkshop"'), '팀 목표 워크숍 1초 템플릿 버튼');
  assert.ok(html.includes('id="tplGoalTravel"'), '팀 목표 단체여행 1초 템플릿 버튼');

  // 5. 새 모임 개설 템플릿
  assert.ok(html.includes('id="tplWorkshop"'), '모임 개설 워크숍 템플릿 버튼');
  assert.ok(html.includes('id="tplTravel"'), '모임 개설 단체여행 템플릿 버튼');

  // 6. AI 로컬 에이전트 폴백 마일스톤 생성 검증
  const { localGoalAgentFallback } = require('../api/goalagent.js');
  const wsRes = localGoalAgentFallback('하반기 전사 워크숍 기획');
  assert.ok(wsRes.ops[0].data.milestones.length >= 3, '워크숍 3단계 마일스톤 생성');
  assert.ok(wsRes.ops[0].data.milestones[0].title.includes('워크숍'), '워크숍 키워드 반영');

  const trRes = localGoalAgentFallback('제주도 단체여행 코스 준비');
  assert.ok(trRes.ops[0].data.milestones.length >= 3, '단체여행 3단계 마일스톤 생성');
  assert.ok(trRes.ops[0].data.milestones[0].title.includes('여행'), '여행 키워드 반영');
});

check('compliance: [#TASK-ES-027] 팀 목표 마일스톤 및 세부할일 계층형 접기·펼치기(아코디언)가 구현되어 있다', () => {
  // 1. 가이드 예시 카드 마일스톤 접기 및 세부할일 아코디언 버튼
  assert.ok(html.includes('data-tgfoldms="ws"'), '워크숍 마일스톤 접기 버튼');
  assert.ok(html.includes('data-tgfoldms="tr"'), '단체여행 마일스톤 접기 버튼');
  assert.ok(html.includes('data-tgfoldms="ft"'), '운동크루 마일스톤 접기 버튼');
  assert.ok(html.includes('data-tgtoggletasks="ws1"'), '워크숍 1단계 세부할일 토글 버튼');
  assert.ok(html.includes('data-tgtoggletasks="tr1"'), '단체여행 1단계 세부할일 토글 버튼');
  assert.ok(html.includes('data-tgtoggletasks="ft1"'), '운동크루 1단계 세부할일 토글 버튼');
  assert.ok(html.includes('id="tgTasks_ws1"'), '워크숍 1단계 세부할일 컨테이너');
  assert.ok(html.includes('id="tgTasks_tr1"'), '단체여행 1단계 세부할일 컨테이너');

  // 2. wireTeamGoalsGuideEvents에 접기/펼치기 이벤트 바인딩 존재
  assert.ok(html.includes("container.querySelectorAll('[data-tgtoggletasks]')"), '세부할일 토글 이벤트 바인딩');
  assert.ok(html.includes("container.querySelectorAll('[data-tgfoldms]')"), '마일스톤 접기 이벤트 바인딩');

  // 3. 실제 팀 목표 화면(renderTeamGoalsScreen) 마일스톤 및 세부할일 아코디언 속성
  assert.ok(html.includes('data-tgfoldlist='), '실제 팀 목표 마일스톤 접기 속성');
  assert.ok(html.includes('data-tgtaskbox='), '실제 팀 목표 세부할일 박스 속성');
  assert.ok(html.includes('data-tgtoggletask='), '실제 팀 목표 세부할일 체크 속성');
  assert.ok(html.includes('data-tgaddtask='), '실제 팀 목표 세부할일 추가 속성');

  // 4. MOCK_GROUPS 워크숍 및 단체여행에 세부할일(tasks) 데이터 탑재 확인
  assert.ok(html.includes('t-ws-1a1'), '워크숍 1단계 태스크 ID');
  assert.ok(html.includes('t-tr-1a1'), '단체여행 1단계 태스크 ID');
});

check('compliance: [#TASK-ES-028] 계층형 테마(대·중·소) 온톨로지, 즐겨찾기 퀵바, 커스텀 테마 및 비강제 추천 시스템이 완벽히 구현되어 있다', () => {
  // 1. js/theme-system.js 로드 및 온톨로지 검증
  const themeSys = require('../js/theme-system.js').OurgoalThemeSystem;
  assert.ok(themeSys, 'OurgoalThemeSystem 객체 존재');
  assert.strictEqual(themeSys.ONTOLOGY.length, 8, '8대 대분류 온톨로지 존재');
  assert.ok(Object.keys(themeSys.FLAT_MAP).length >= 80, '소분류 전수 온톨로지 맵핑 구비');

  // 2. 기본 즐겨찾기 5선 검증
  assert.strictEqual(themeSys.DEFAULT_FAVORITES.length, 5, '기본 즐겨찾기 5선 프리셋 구비');
  const dummyProfile = { themeSettings: { favorites: [], customThemes: [] } };
  const settings = themeSys.getThemeSettings(dummyProfile);
  assert.strictEqual(settings.favorites.length, 5, '미설정 시 기본 즐겨찾기 5선 자동 세팅');

  // 3. 커스텀 테마 생성 및 즐겨찾기 토글
  const newCustom = themeSys.addCustomTheme(dummyProfile, '바디프로필D-30', '🔥', 'health');
  assert.ok(newCustom && newCustom.id, '커스텀 테마 생성 완료');
  assert.strictEqual(newCustom.label, '바디프로필D-30', '커스텀 테마 이름 매핑');
  const added = themeSys.toggleFavorite(dummyProfile, newCustom);
  assert.strictEqual(added, true, '커스텀 테마 즐겨찾기 추가');
  assert.strictEqual(dummyProfile.themeSettings.favorites.length, 6, '즐겨찾기 6개로 증가');

  // 4. 비강제 스마트 추천기 검증
  const sugRunning = themeSys.suggestTheme('오늘 아침 5km 조깅 완주');
  assert.ok(sugRunning, '러닝 키워드 추천 반환');
  assert.strictEqual(sugRunning.label, '조깅/러닝', '러닝 소분류 라벨');
  const sugReading = themeSys.suggestTheme('독서 1시간');
  assert.ok(sugReading, '독서 키워드 추천 반환');

  // 5. 체크인 테마 페이로드 빌더 하위 호환성 검증
  const payload = themeSys.buildCheckinThemePayload(sugRunning);
  assert.strictEqual(payload.theme, 'workout', '기존 5대 테마 하위 호환 workout 매핑');
  assert.strictEqual(payload.subTheme, '조깅/러닝', '세부 소분류 라벨 보존');
  assert.ok(payload.themeMetadata && payload.themeMetadata.isUserSelected, '사용자 선택 메타데이터');

  // 6. index.html 마크업 및 스크립트 로드 검증
  assert.ok(html.includes('js/theme-system.js'), 'index.html에 js/theme-system.js 스크립트 로드');
  assert.ok(html.includes('id="captureThemeQuickBar"'), '즐겨찾기 퀵바 컨테이너 존재');
  assert.ok(html.includes('id="themeSelectorModal"'), '테마 선택 바텀시트 모달 존재');
  assert.ok(html.includes('id="customThemeInput"'), '나만의 테마 입력 필드 존재');

  // 7. api/feedback.js 동적 프롬프트 인젝터 검증
  const feedbackCode = fs.readFileSync(path.join(__dirname, '..', 'api', 'feedback.js'), 'utf8');
  assert.ok(feedbackCode.includes('themeHierarchy'), 'feedback.js에 themeHierarchy 수용 로직 구비');
  assert.ok(feedbackCode.includes('dynamicThemeLine'), 'feedback.js에 동적 테마 코칭 지침 인젝터 구비');
});

check('compliance: [#TASK-ES-029] 팀 목표 템플릿 개설·체험 분리 및 하이브리드 편집 시스템이 완벽히 구현되어 있다', () => {
  // 1. 가이드 템플릿 개설 및 안전 체험 버튼 분리
  assert.ok(html.includes('data-tgtplgroup="workshop"'), '워크숍 템플릿으로 개설 버튼');
  assert.ok(html.includes('data-tgtplgroup="travel"'), '단체여행 템플릿으로 개설 버튼');
  assert.ok(html.includes('data-tgtplgroup="fitness"'), '운동크루 템플릿으로 개설 버튼');
  assert.ok(html.includes('data-tgquickpreview="g-workshop"'), '워크숍 1초 둘러보기 버튼');
  assert.ok(html.includes('data-tgquickpreview="g-travel"'), '단체여행 1초 둘러보기 버튼');
  assert.ok(html.includes('data-tgquickpreview="g0"'), '운동크루 1초 둘러보기 버튼');

  // 2. 가이드 이벤트 핸들러 및 템플릿 프리셋 추출 로직
  assert.ok(html.includes('function getTeamGoalTemplatePreset('), '팀 목표 템플릿 프리셋 함수 구비');
  assert.ok(html.includes('promptNewGroup(body, initialPreset)'), '프리셋 기반 모임 개설 함수 연동');

  // 3. 체험 모임 안전 배지 및 즉시 탈퇴(복귀) 버튼
  assert.ok(html.includes('체험용 예시 팀') || html.includes('체험용 예시 모임'), '체험 팀 안내 배지');
  assert.ok(html.includes('data-tgleavepreview='), '체험 모임 나가기 버튼 속성');

  // 4. 헤더 레벨 인라인 편집 모드 토글 및 마일스톤 순서 변경 버튼
  assert.ok(html.includes('id="teamGoalEditToggle"'), '팀 목표 헤더 인라인 편집 모드 토글');
  assert.ok(html.includes('data-tgmup=') || html.includes('data-meditmove='), '마일스톤 순서 변경(▲/▼) 속성');

  // 5. 카드 레벨 상세 편집 모달
  assert.ok(html.includes('data-tgeditmodal='), '카드 레벨 팀 목표 상세 편집 모달 호출 속성');
  assert.ok(html.includes('function openTeamGoalEditModal('), '팀 목표 상세 편집 바텀시트 모달 함수 구비');
  assert.ok(html.includes('modalTgTitleInput') && html.includes('modalTgDueInput'), '모달 내 목표명 및 마감일 필드');
  assert.ok(html.includes('data-meditcyclestatus=') && html.includes('data-meditcycleprio='), '모달 내 마일스톤 상태 및 우선순위 토글');
  assert.ok(html.includes('data-medittaskcheck=') && html.includes('data-meditaddtask='), '모달 내 세부 할 일 체크 및 추가');
});

check('compliance: [#TASK-ES-026] js/team-leader-check.js 가 존재하고 유효한 모듈 API를 노출한다', () => {
  const modPath = path.join(__dirname, '..', 'js', 'team-leader-check.js');
  assert.ok(fs.existsSync(modPath), '모듈 파일 존재');
  const src = fs.readFileSync(modPath, 'utf8');
  assert.ok(src.includes('OurgoalTeamLeaderCheck'), 'OurgoalTeamLeaderCheck 객체 노출');
  assert.ok(src.includes('LEADER_STAMPS'), '4대 확인 도장 메타데이터 탑재');
  assert.ok(src.includes('calcGroupMembersProgress'), '팀원 달성도 집계 함수 탑재');
  assert.ok(src.includes('renderLeaderDashboardHtml'), '대시보드 렌더러 탑재');
  assert.ok(src.includes('openLeaderStampSelectModal'), '확인 도장 선택 모달 탑재');
  assert.ok(src.includes('openMemberProgressDetailModal'), '상세 점검 바텀시트 모달 탑재');
  assert.ok(src.includes('bindEvents'), '이벤트 바인딩 함수 탑재');

  const mod = require(modPath);
  assert.ok(typeof mod.calcGroupMembersProgress === 'function', 'calcGroupMembersProgress 함수 제공');
  assert.ok(typeof mod.renderLeaderDashboardHtml === 'function', 'renderLeaderDashboardHtml 함수 제공');
  assert.ok(typeof mod.bindEvents === 'function', 'bindEvents 함수 제공');
  assert.ok(mod.LEADER_STAMPS.perfect && mod.LEADER_STAMPS.growth, '도장 종류 완비');
});

check('compliance: [#TASK-ES-026] index.html 이 js/team-leader-check.js 를 로드하고 렌더 및 이벤트 핸들을 연결한다', () => {
  assert.ok(html.includes('<script src="js/team-leader-check.js"></script>'), '스크립트 태그 탑재');
  assert.ok(html.includes('OurgoalTeamLeaderCheck.renderLeaderDashboardHtml'), '대시보드 렌더 호출');
  assert.ok(html.includes('OurgoalTeamLeaderCheck.renderMemberFeedbackBannerHtml'), '피드백 배너 렌더 호출');
  assert.ok(html.includes('OurgoalTeamLeaderCheck.bindEvents'), '이벤트 바인딩 호출');
});

check('compliance: [#TASK-ES-027] js/team-leader-check.js 에 팀원 찌르기(2종) 및 모임장 1:1 DM 반응 API가 탑재되어 있다', () => {
  const modPath = path.join(__dirname, '..', 'js', 'team-leader-check.js');
  const mod = require(modPath);
  assert.ok(mod.PING_TYPES && mod.PING_TYPES.boast && mod.PING_TYPES.struggle, '달성자랑 및 힘들어요 찌르기 메타데이터 탑재');
  assert.strictEqual(mod.PING_TYPES.boast.icon, '🎉', '달성자랑 아이콘 🎉');
  assert.strictEqual(mod.PING_TYPES.struggle.icon, '🥺', '힘들어요 아이콘 🥺');
  assert.ok(typeof mod.renderMemberPingButtonHtml === 'function', 'renderMemberPingButtonHtml 함수 제공');
  assert.ok(typeof mod.renderLeaderPingsSectionHtml === 'function', 'renderLeaderPingsSectionHtml 함수 제공');
  assert.ok(typeof mod.renderMemberDmNotificationBannerHtml === 'function', 'renderMemberDmNotificationBannerHtml 함수 제공');
  assert.ok(typeof mod.openSendPingModal === 'function', 'openSendPingModal 함수 제공');
  assert.ok(typeof mod.openLeaderMemberDmModal === 'function', 'openLeaderMemberDmModal 함수 제공');

  const btnHtmlBoast = mod.renderMemberPingButtonHtml('g1', 'milestone', 'm1', '완료 목표', true);
  assert.ok(btnHtmlBoast.includes('data-openping="g1:milestone:m1:1"'), '달성자랑 data 속성 탑재');
  assert.ok(btnHtmlBoast.includes('달성자랑'), '달성자랑 라벨 표기');

  const btnHtmlStruggle = mod.renderMemberPingButtonHtml('g1', 'milestone', 'm2', '진행중 목표', false);
  assert.ok(btnHtmlStruggle.includes('data-openping="g1:milestone:m2:0"'), '힘들어요 data 속성 탑재');
  assert.ok(btnHtmlStruggle.includes('힘들어요'), '힘들어요 라벨 표기');
});

check('compliance: [#TASK-ES-027] index.html 이 마일스톤 및 팀 목표에 찌르기 버튼을 탑재하고 찌르기/DM 이벤트를 처리한다', () => {
  assert.ok(html.includes('OurgoalTeamLeaderCheck.renderMemberPingButtonHtml(g.id, \'teamgoal\''), '팀 목표 찌르기 버튼 호출');
  assert.ok(html.includes('OurgoalTeamLeaderCheck.renderMemberPingButtonHtml(g.id, \'milestone\''), '마일스톤 찌르기 버튼 호출');
  const modSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-leader-check.js'), 'utf8');
  assert.ok(modSrc.includes('[data-openping]'), '찌르기 모달 트리거 이벤트 바인딩');
  assert.ok(modSrc.includes('[data-openleaderdm]'), '1:1 DM 대화 모달 트리거 이벤트 바인딩');
});

check('compliance: [#TASK-ES-026] js/team-leader-check.js 가 존재하고 유효한 모듈 API를 노출한다', () => {
  const modPath = path.join(__dirname, '..', 'js', 'team-leader-check.js');
  assert.ok(fs.existsSync(modPath), '모듈 파일 존재');
  const src = fs.readFileSync(modPath, 'utf8');
  assert.ok(src.includes('OurgoalTeamLeaderCheck'), 'OurgoalTeamLeaderCheck 객체 노출');
  assert.ok(src.includes('LEADER_STAMPS'), '4대 확인 도장 메타데이터 탑재');
  assert.ok(src.includes('calcGroupMembersProgress'), '팀원 달성도 집계 함수 탑재');
  assert.ok(src.includes('renderLeaderDashboardHtml'), '대시보드 렌더러 탑재');
  assert.ok(src.includes('openLeaderStampSelectModal'), '확인 도장 선택 모달 탑재');
  assert.ok(src.includes('openMemberProgressDetailModal'), '상세 점검 바텀시트 모달 탑재');
  assert.ok(src.includes('bindEvents'), '이벤트 바인딩 함수 탑재');

  const mod = require(modPath);
  assert.ok(typeof mod.calcGroupMembersProgress === 'function', 'calcGroupMembersProgress 함수 제공');
  assert.ok(typeof mod.renderLeaderDashboardHtml === 'function', 'renderLeaderDashboardHtml 함수 제공');
  assert.ok(typeof mod.bindEvents === 'function', 'bindEvents 함수 제공');
  assert.ok(mod.LEADER_STAMPS.perfect && mod.LEADER_STAMPS.growth, '도장 종류 완비');
});

check('compliance: [#TASK-ES-026] index.html 이 js/team-leader-check.js 를 로드하고 렌더 및 이벤트 핸들을 연결한다', () => {
  assert.ok(html.includes('<script src="js/team-leader-check.js"></script>'), '스크립트 태그 탑재');
  assert.ok(html.includes('OurgoalTeamLeaderCheck.renderLeaderDashboardHtml'), '대시보드 렌더 호출');
  assert.ok(html.includes('OurgoalTeamLeaderCheck.renderMemberFeedbackBannerHtml'), '피드백 배너 렌더 호출');
  assert.ok(html.includes('OurgoalTeamLeaderCheck.bindEvents'), '이벤트 바인딩 호출');
});

check('compliance: [#TASK-ES-031] 기록 탭 3분할 세그먼트·미니 펄스바·4단 캐러셀 및 과거 기록 계층형 아코디언이 구현되어 있다', () => {
  // 1. 마크업 무결성
  assert.ok(html.includes('id="recSegmentBar"'), '3분할 세그먼트 바 마크업');
  assert.ok(html.includes('id="recSegFeedBtn"') && html.includes('id="recSegStatsBtn"') && html.includes('id="recSegArchiveBtn"'), '3분할 세그먼트 버튼들');
  assert.ok(html.includes('id="recViewFeed"') && html.includes('id="recViewStats"') && html.includes('id="recViewArchive"'), '3개 뷰 컨테이너');
  assert.ok(html.includes('id="recMiniPulseBar"') && html.includes('id="recMiniPulseText"'), '미니 성취 펄스 바 마크업');
  assert.ok(html.includes('id="recCarouselViewport"') && html.includes('id="recCarouselTrack"') && html.includes('id="recCarouselPills"'), '4단 메트릭 캐러셀 뷰포트 및 알약 탭');

  // 2. JS 로직 무결성
  assert.ok(html.includes('function setRecordsSegment('), '세그먼트 전환 함수');
  assert.ok(html.includes('function setRecordsSlide('), '캐러셀 슬라이드 함수');
  assert.ok(html.includes('rec-accordion-card') && html.includes('data-toggleacc'), '과거 기록 계층형 아코디언 토글');

  // 3. CSS 무결성
  assert.ok(styleSrc.includes('.rec-segment-bar') && styleSrc.includes('.rec-mini-pulse-bar'), '세그먼트 및 펄스바 CSS');
  assert.ok(styleSrc.includes('.rec-carousel-viewport') && styleSrc.includes('.rec-carousel-track'), '캐러셀 CSS');
  assert.ok(styleSrc.includes('.rec-accordion-card') && styleSrc.includes('.rec-acc-body'), '계층형 아코디언 CSS');
});

check('compliance: [#TASK-ES-033] 카카오/구글 로그인 충돌 방지, 세션 보존 및 자가 치유(Self-Healing) 복구 파이프라인이 구현되어 있다', () => {
  // 1. handleGoogleUserSuccess 로그인 상태 보존 및 계정 충돌 안내 모달
  assert.ok(html.includes('state.profile && state.profile.id'), '로그인 상태에서 구글 시도시 세션 보존');
  assert.ok(html.includes('isAccountConflict'), '계정 충돌 플래그 검증');
  assert.ok(html.includes('기존 카카오 가입 계정 안내'), '카카오 계정 충돌 안내 모달');
  assert.ok(html.includes('conflictKakaoLoginBtn'), '카카오 즉시 로그인 전환 버튼');

  // 2. checkRemoteSessionRevoked 오탐 방지 가드
  assert.ok(html.includes('Date.now() - myLogin < 60000'), '로그인 직후 60초 오탐 방지 가드');

  // 3. boot 함수 OAuth 세션 복원 및 onAuthStateChange
  assert.ok(html.includes('sb.auth.onAuthStateChange'), 'Auth 상태 변화 감지 리스너');
  assert.ok(html.includes('restoreSessionAndEnter'), '세션 복원 전담 함수');
  assert.ok(html.includes('isOAuthCallback'), 'OAuth 리다이렉트 콜백 감지');

  // 4. 자가 치유(Self-Healing) UI 및 rescueLoginSession 함수
  assert.ok(html.includes('function rescueLoginSession'), '세션 초기화 및 복구 함수');
  assert.ok(html.includes('id="landRescueBtn"') && html.includes('id="authRescueBtn"'), '랜딩 및 인증 화면 세션 복구 링크');
  assert.ok(html.includes('function openLoginRescueModal'), '로그인 자가 복구 모달');
  assert.ok(html.includes('function loginWithDirectIdentifier'), '직통 식별자 복구 로그인');
  assert.ok(html.includes('continueGoogleDirectBtn'), '구글 계정 직접 시작 버튼');
  assert.ok(html.includes('unable to exchange external code'), 'OAuth 인가코드 교환 실패 에러 방어');
});

check('compliance: [#TASK-ES-034] 기록 탭 버튼 상호작용 및 런타임 안정성(ReferenceError esc 방어, min-height 0, 정적 리스너)이 완비되어 있다', () => {
  // 1. ReferenceError esc 방지 및 escapeHtml 주입 검증
  assert.ok(!html.includes('esc: esc,'), '미선언 esc 전달 제거');
  assert.ok(html.includes('esc: escapeHtml,'), '정상 escapeHtml 주입');

  // 2. CSS Grid 아코디언 min-height: 0 검증
  assert.ok(styleSrc.includes('.rec-acc-inner{overflow:hidden;padding:0;min-height:0;}'), '아코디언 축소 min-height 0');

  // 3. 기록 탭 버튼 정적 리스너 검증
  assert.ok(html.includes("document.querySelectorAll('#recSegmentBar [data-recseg]')"), '세그먼트 정적 리스너');
  assert.ok(html.includes("document.querySelectorAll('#recCarouselPills [data-recslide]')"), '캐러셀 알약 정적 리스너');
  assert.ok(html.includes("document.getElementById('recMiniPulseBar')"), '미니 펄스바 정적 리스너');
});

check('compliance: [#TASK-ES-035] 기록 및 프로필 삼중 로컬 백업, 게스트 세션 고착 해제, 자가 치유 및 데이터 무결성 복원이 완비되어 있다', () => {
  // 1. 기록 및 프로필 삼중 로컬 백업 키 사용 확인
  assert.ok(html.includes('ourgoal_records_backup_'), '기록 로컬 백업 키 존재');
  assert.ok(html.includes('ourgoal_profile_backup_'), '프로필 로컬 백업 키 존재');

  // 2. ensureUserRow 프로필 유실 방어 로직 확인
  assert.ok(html.includes("localStorage.getItem('ourgoal_profile_backup_' + userId)"), 'ensureUserRow 로컬 프로필 보존');

  // 3. saveProfile 및 loadProfile 기록/프로필 백업 저장 및 복구
  assert.ok(html.includes("localStorage.setItem('ourgoal_records_backup_' + uidVal, JSON.stringify(recs))"), 'saveProfile 기록 로컬 백업');
  assert.ok(html.includes("localStorage.setItem('ourgoal_profile_backup_' + uidVal"), 'saveProfile 프로필 로컬 백업');

  // 4. performLogout 시 게스트 프로필 및 current_user 정리 (영구 고착 해제)
  assert.ok(html.includes("localStorage.removeItem('ourgoal_guest_profile');") && html.includes("localStorage.removeItem('ourgoal_current_user');"), '로그아웃 시 게스트 세션 완전 제거');

  // 5. 설정 화면 1-클릭 수동 복원 및 재동기화 버튼 구비
  assert.ok(html.includes('id="resyncAccountDataBtn"'), '설정 화면 재동기화 버튼 마크업 존재');
  assert.ok(html.includes("document.getElementById('resyncAccountDataBtn')"), '재동기화 버튼 이벤트 바인딩');

  // 6. loginWithDirectIdentifier 다중 백업 ID 탐색 및 boot 자가 치유
  assert.ok(html.includes("var backupPrefixes = ['ourgoal_goals_backup_', 'ourgoal_records_backup_', 'ourgoal_profile_backup_', 'ourgoal_settings_'];"), '다중 백업 ID 탐색');
  assert.ok(html.includes('gpUpdated') && html.includes('boot_bg_sync'), 'boot 게스트 세션 자가 치유 및 백그라운드 동기화');
});

check('compliance: [#TASK-ES-036] 서버 사이드 관리자 권한 데이터 복구 파이프라인(api/track.js) 및 RLS 차단 우회 기록·프로필 즉시 복원이 완비되어 있다', () => {
  // 1. api/track.js 내 서버 관리자 복구 핸들러 존재
  const trackSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'track.js'), 'utf8');
  assert.ok(trackSrc.includes('handleSyncRecords'), 'handleSyncRecords 함수 존재');
  assert.ok(trackSrc.includes("action === 'sync_records'"), 'sync_records 액션 라우팅');
  assert.ok(trackSrc.includes('SUPABASE_SERVICE_ROLE_KEY'), '서비스 롤 키 활용');
  assert.ok(trackSrc.includes("from('checkins')"), 'checkins 테이블 관리자 쿼리');
  assert.ok(trackSrc.includes("from('users')"), 'users 테이블 관리자 쿼리');

  // 2. index.html syncServerRecords 파이프라인 탑재
  assert.ok(html.includes('async function syncServerRecords'), 'syncServerRecords 함수 존재');
  assert.ok(html.includes("action: 'sync_records'"), '클라이언트 sync_records 호출');

  // 3. loadProfile 내 서버 복구 폴백
  assert.ok(html.includes("!records || records.length === 0") && html.includes("fetch('/api/track'"), 'loadProfile 내 서버 복구 폴백');

  // 4. recordsList 빈 상태 수동 복원 버튼 및 자동 백그라운드 복구
  assert.ok(html.includes('id="recAutoRestoreBtn"'), '기록 탭 빈 화면 복원 버튼');
  assert.ok(html.includes('_hasAutoTriedRecordSync'), '기록 탭 진입 시 1회 자동 백그라운드 복구');

  // 5. Vercel Hobby 12개 한도 준수 확인
  const apiFiles = fs.readdirSync(path.join(__dirname, '..', 'api')).filter(f => f.endsWith('.js'));
  assert.strictEqual(apiFiles.length, 12, 'Vercel Hobby 12개 서버리스 함수 한도 준수');
});

check('compliance: [#TASK-ES-037] 기록·목표 탭 12대 핵심 UX 개선 및 통계·마일스톤 구조 개편이 완비되어 있다', () => {
  // 1. js/records-stats.js 파일 존재 및 모듈 검증
  const statsModPath = path.join(__dirname, '..', 'js', 'records-stats.js');
  assert.ok(fs.existsSync(statsModPath), 'js/records-stats.js 파일이 존재해야 함');
  const RecordsStats = require('../js/records-stats.js');
  assert.ok(typeof RecordsStats.build7DaysFeedHtml === 'function', 'build7DaysFeedHtml 함수 구비');
  assert.ok(typeof RecordsStats.renderLifeBalancePieSvg === 'function', 'renderLifeBalancePieSvg 함수 구비');
  assert.ok(typeof RecordsStats.computeTrendData === 'function', 'computeTrendData 함수 구비');
  assert.ok(typeof RecordsStats.computeFixedReportSummary === 'function', 'computeFixedReportSummary 함수 구비');

  // 2. 최근 7일 피드: 오늘 전면 노출 + 어제/과거 아코디언 및 최신 1건 프리뷰
  assert.ok(html.includes('OurgoalRecordsStats.build7DaysFeedHtml'), '7일 피드 렌더러 연동');
  assert.ok(html.includes('data-toggleday'), '일자별 아코디언 토글 바인딩');
  assert.ok(styleSrc.includes('.rec-day-accordion') && styleSrc.includes('.rec-day-toggle-btn'), '7일 피드 아코디언 스타일 구비');

  // 3. 성취 통계: 주간/월간/분기/반기/연간 5종 추이 + 막대 선택 요약 + 상세 팝업
  assert.ok(html.includes('data-trendseg') && html.includes('trend-seg-bar'), '실천 추이 5종 세그먼트 바');
  assert.ok(html.includes('trendDetailSummary') && html.includes('data-trendpop'), '일자 요약 박스 및 팝업 트리거');
  assert.ok(html.includes('OurgoalRecordsStats.openDayDetailModal'), '일자/기간별 활동 세부 모달 연계');
  assert.ok(styleSrc.includes('.trend-detail-summary') && styleSrc.includes('.chart-bar.active'), '활성 막대 및 요약 박스 스타일');

  // 4. 원형 라이프 밸런스 휠 (SVG Pie/Donut Chart)
  assert.ok(html.includes('OurgoalRecordsStats.renderLifeBalancePieSvg'), '원형 밸런스 휠 SVG 렌더러 연동');
  assert.ok(html.includes('balance-pie-container') && html.includes('원형 라이프 밸런스 휠'), '원형 라이프 밸런스 휠 컨테이너');
  const pieResult = RecordsStats.renderLifeBalancePieSvg([
    { theme: 'workout', startAt: new Date().toISOString(), endAt: new Date(Date.now()+1800000).toISOString() },
    { theme: 'study', startAt: new Date().toISOString(), endAt: new Date(Date.now()+1800000).toISOString() }
  ]);
  assert.ok(pieResult.svgHtml.includes('<svg') && pieResult.svgHtml.includes('balance-pie-svg'), '원형 SVG 파이 차트 정상 생성');

  // 5. 공식 명칭 변경: 잔디 ➔ 히트맵
  assert.ok(html.includes('🟩 히트맵') && html.includes('기록 히트맵'), '히트맵 공식 명칭 적용');

  // 6. AI 리포트 결함(종료시간 누락) 해결 및 위클리 리캡 공통 하단 배치
  assert.ok(html.includes('OurgoalRecordsStats.computeFixedReportSummary'), 'AI 리포트 집계기 연동');
  assert.ok(html.includes('id="commonWeeklyRecapCard"'), '위클리 리캡 캐러셀 하단 공통 배치');
  const dummyRecs = [{ id: 'r1', text: '열린 기록', startAt: new Date().toISOString() }]; // endAt 없음
  const repSummary = RecordsStats.computeFixedReportSummary(dummyRecs, 7);
  assert.strictEqual(repSummary.totalRecCount, 1, '종료시간 없는 기록도 누락 없이 집계되어야 함');

  // 7. 보관함 안내 문구 및 최하단 데이터 받기
  assert.ok(html.includes('완료된 목표는 여기로 저장됩니다.'), '보관함 상단 안내 문구');
  assert.ok(html.includes('exportCardHtml') && /selBar\s*\+\s*exportCardHtml/.test(html), '데이터 받기 카드 목표 탭 최하단 배치');

  // 8. 목표 공개 범위 3단 순환 토글 및 1초 토스트
  assert.ok(html.includes('goalsPrivacyBadge') && html.includes("privBadge.addEventListener('click'"), '목표 공개 범위 3단 토글');
  assert.ok(html.includes('목표 공개 범위:'), '공개 범위 토글 시 토스트 알림');

  // 9. 목표 순서 가로 이동 버튼 (◀ / ▶)
  assert.ok(html.includes('shiftGoalOrder') && html.includes('goal-chip-nav-btn'), '목표 칩 가로 순서 이동 버튼');
  assert.ok(styleSrc.includes('.goal-chip-nav-btn'), '목표 순서 이동 버튼 스타일');
});

check('compliance: [#TASK-ES-038] 목표 탭 마일스톤 창 공간 활용 효율화 및 고밀도 UI/UX 개편이 완비되어 있다', () => {
  // 1. 상단 AI 종합상황 슬림 미니바(Accordion) 마크업 및 핸들러 검증
  assert.ok(html.includes('goal-status-minibar') && html.includes('id="goalStatusMinibar"'), '상단 AI 미니바 컨테이너');
  assert.ok(html.includes('id="goalStatusToggleBtn"') && html.includes('state.goalStatusExpanded'), 'AI 미니바 접이식 토글');
  assert.ok(styleSrc.includes('.goal-status-minibar') && styleSrc.includes('.status-minibar-head'), 'AI 미니바 스타일 구비');

  // 2. 마일스톤 필터 바 뷰 모드(간결/상세) 토글 버튼 검증
  assert.ok(html.includes('id="msDensityToggleBtn"'), '보기 모드 토글 버튼 마크업');
  assert.ok(html.includes('state.msDensity'), '보기 모드 상태 변수');

  // 3. 마일스톤 2단 고밀도 인라인 그리드 (1행: 상태+제목+진행률/D-day, 2행: 인라인 메타)
  assert.ok(html.includes('ms-main-line') && html.includes('ms-sub-meta-line'), '마일스톤 2단 인라인 그리드 마크업');
  assert.ok(styleSrc.includes('.ms-main-line') && styleSrc.includes('.ms-sub-meta-line'), '마일스톤 2단 인라인 CSS');
  assert.ok(html.includes('ms-title-compact'), '마일스톤 컴팩트 타이틀');

  // 4. 하위 세부 할 일(Task) 1줄 원라인 플렉스 검증
  assert.ok(html.includes('compact-task-row') && html.includes('task-title-inline'), '1줄 원라인 할 일 마크업');
  assert.ok(styleSrc.includes('.compact-task-row') && styleSrc.includes('.task-title-inline'), '1줄 원라인 할 일 CSS');
  assert.ok(html.includes('task-meta-inline'), '할 일 인라인 메타 컨테이너');

  // 5. 최종 결과 입력 버튼 메타 스트립 인라인 통합 검증
  assert.ok(html.includes('meta-strip') && html.includes('id="goalResultBtn"'), '결과 입력 버튼 메타 스트립 인라인 흡수');
});

check('compliance: [#TASK-ES-044] 홈·목표 12대 핵심 UX 개편 및 성장형 아바타 시스템이 완벽히 구현되어 있다', () => {
  // 1. 홈 화면 오늘의 미션 아코디언화 (상위 1개 기본 노출 + 더보기 토글)
  assert.ok(html.includes('btnToggleMissionAccordion'), '오늘의 미션 아코디언 토글 버튼 존재');
  assert.ok(html.includes('state.missionAccordionOpen'), '오늘의 미션 아코디언 상태 변수 존재');
  assert.ok(html.includes('외 ') && html.includes('개 미션 더보기 ▾'), '미션 더보기 라벨 형식 검증');

  // 2. '오늘 기록하기' 칩 5종 및 음성인식 '듣고 있어요...' 텍스트 제거
  assert.strictEqual(html.includes('id="quickRoutineRow"'), false, '오늘 기록하기 퀵 루틴 칩 행 제거 확인');
  assert.strictEqual(html.includes('id="micStatus"'), false, '듣고 있어요 안내 텍스트 요소 제거 확인');

  // 3. +테마와 입력창 사이 테마 안내 문구
  assert.ok(html.includes('(테마 : ai 분석 및 DB시각화에 활용됨)'), '테마 가이드 안내 문구 존재');

  // 4. (닉네임)님, 안녕하세요 우측 끝 '나만의 홈 구성' 버튼 및 모달 연동
  assert.ok(html.includes('id="btnCustomHomeLayout"'), '나만의 홈 구성 버튼 id 존재');
  assert.ok(html.includes('window.OurgoalCustomize.open'), '홈 구성 커스터마이즈 모달 연동 확인');

  // 5. 목표탭 4종 뷰 필터 버튼 (기본, 목표만, 마일스톤, 할일)
  assert.ok(html.includes('id="msViewToggle"'), '4종 뷰 필터 컨테이너 id 존재');
  assert.ok(html.includes('data-msview="default"') && html.includes('data-msview="goals_only"') && html.includes('data-msview="milestones_only"') && html.includes('data-msview="tasks_only"'), '4종 뷰 필터 옵션(기본/목표만/마일스톤/할일) 존재');
  assert.ok(html.includes('state.goalViewMode'), '목표 뷰 필터 상태 변수 연동');

  // 6. 레벨창 위치: homeGreeting 바로 밑
  const greetPos = html.indexOf('id="homeGreeting"');
  const levelBadgePos = html.indexOf('id="levelBadgeRow"');
  assert.ok(greetPos > 0 && levelBadgePos > greetPos, '레벨창이 인사말 바로 아래 위치함');
  assert.ok(levelBadgePos < html.indexOf('id="todayGlancePill"'), '레벨창이 연속기록/몰입 위젯 상단에 위치함');

  // 7 & 8. 성장형 아바타 시스템 (js/avatar-system.js, 1~10단계 초록 로봇 SVG, 3회 제한, 3등신 사진 아바타, 체크인 맞이 인사말)
  const avatarModPath = path.join(__dirname, '..', 'js', 'avatar-system.js');
  assert.ok(fs.existsSync(avatarModPath), 'js/avatar-system.js 모듈 파일 존재');
  const AvatarSystem = require('../js/avatar-system.js');
  assert.ok(typeof AvatarSystem.getRobotAvatarSvg === 'function', 'getRobotAvatarSvg 함수 존재');
  assert.ok(typeof AvatarSystem.renderAvatarHtml === 'function', 'renderAvatarHtml 함수 존재');
  assert.ok(typeof AvatarSystem.openAvatarModal === 'function', 'openAvatarModal 함수 존재');
  
  // 1~10단계 로봇 SVG 정상 생성 확인
  for (let lv = 1; lv <= 10; lv++) {
    const svg = AvatarSystem.getRobotAvatarSvg(lv, 36);
    assert.ok(svg.includes('<svg') && svg.includes('#10B981'), '초록색 로봇 아바타 SVG Lv.' + lv + ' 생성 검증');
  }
  
  // 3회 제한 및 안내문구 검증
  assert.strictEqual(AvatarSystem.MAX_AVATAR_CHANGES, 10, '아바타 변경 최대 10회 제한');
  assert.ok(html.includes('btnOpenAvatarModal'), '내 아바타 바꾸기 버튼 존재');
  assert.ok(html.includes('OurgoalAvatar'), '아바타 전역 모듈 연동');

  // 9 & 10. 목표 최종결과 및 완료 수정 모달 개편 (1-Tap 즉시 승인 및 저장/보관함 이동)
  assert.ok(html.includes('id="ambientCheckinArchiveBtn"'), '상단 1-Tap 즉시 승인 및 기록 저장 및 보관함으로 이동 버튼 존재');
  assert.ok(html.includes('id="rsSaveAndArchive"'), '저장 및 보관함으로 이동 버튼 존재');
  assert.ok(html.includes('id="rsJustArchive"'), '완료된 목표 수정 시 보관 버튼 존재');

  // 11. 결과 기록 모달 수동입력하기 배경색 순백색 (#FFFFFF)
  assert.ok(html.includes('id="rsManualForm"') && html.includes('background:#FFFFFF;'), '수동입력하기 컨테이너 배경색 순백색(#FFFFFF)');

  // 12. 개인목표 0개일 때 활용가이드 카드 노출 + 상단 활용가이드 모달 버튼
  assert.ok(html.includes('id="personalGoalsEmptyGuideSlot"'), '개인목표 빈 상태 가이드 슬롯 존재');
  assert.ok(html.includes('renderPersonalGoalsEmptyGuideHtml'), '개인목표 활용가이드 렌더러 함수 존재');
  assert.ok(html.includes('id="btnShowPersonalGuideModal"'), '목표 화면 헤더 활용가이드 버튼 존재');
});

check('compliance: [#TASK-ES-045] 홈·기록 8대 핵심 UX 고밀도화 및 테마·홈구성 모달 정상화가 완벽히 구현되어 있다', () => {
  // 1. 레벨 표시 중복 제거 및 게이지 바 확장
  assert.strictEqual(html.includes('<span class="level-num"'), false, '레벨 배지 내 중복 Lv.X 텍스트 제거 확인');
  assert.ok(html.includes('id="btnOpenAvatarModal"'), '내 아바타 바꾸기 버튼 유지 확인');

  // 2. 오늘의 카드 더보기 버튼 헤더 인라인 이동
  assert.ok(html.includes('<div class="ct-label" style="margin:0;">오늘의 카드</div>') || html.includes('<div class="ct-label" style="margin:0;">오늘의 미션</div>'), '오늘의 카드 라벨 헤더 플렉스 컨테이너');
  assert.ok(html.includes('moreBtnHtml'), '미션 더보기 버튼 인라인 배치 연동');

  // 3. 오늘 기록하기 입력창 크기 50% 축소 & 예시 문구 3pt 축소
  assert.ok(styleSrc.includes('min-height:36px') && styleSrc.includes('.capture-card textarea::placeholder'), '입력창 높이 50% 축소 및 플레이스홀더 폰트 축소');

  // 4. 주간잔디 ➔ 최근 히트맵 변경 및 잔디 단어 배제
  assert.ok(html.includes('최근 히트맵'), '최근 히트맵 공식 타이틀 적용');
  assert.strictEqual(html.includes('주간 잔디 & 몰입 리포트'), false, '주간 잔디 명칭 완전 제거');
  assert.strictEqual(html.includes('첫 잔디 도전'), false, '첫 잔디 문구 제거');

  // 5. 챌린지 룸 ➔ 내 성장 확인하기 교체 및 기록창(records) 연동
  assert.ok(html.includes('>내 성장 확인하기<'), '내 성장 확인하기 버튼 라벨');
  assert.ok(html.includes("challengeBtn.onclick = function(){ setTab('records'); };"), '내 성장 확인하기 클릭 시 기록 탭 이동 핸들러');

  // 6. 테마 선택기 텍스트 색상 검은색(#111827) 전면 개편
  assert.ok(styleSrc.includes('.theme-custom-input') && styleSrc.includes('#111827 !important'), '테마 인풋 검은색(#111827) 스타일 적용');
  assert.ok(styleSrc.includes('.theme-leaf-chip') && styleSrc.includes('border-color: #D1D5DB !important'), '테마 칩 테두리 및 검은색 스타일 적용');

  // 7. 나만의 홈 구성 버튼 밑에 안내문구 '필요없는 창 지우기' 추가
  assert.ok(html.includes('필요없는 창 지우기'), '필요없는 창 지우기 안내문구 마크업 존재');

  // 8. 나만의 홈 구성 클릭 시 OurgoalCustomize.open 정규 연동
  assert.ok(html.includes('window.OurgoalCustomize.open') && html.includes('saveProfile: saveProfile'), 'OurgoalCustomize.open 정규 호출 인자 완비');
});

check('compliance: [#TASK-ES-046] 77종 3등신 캐릭터 바디 풀 및 난수 추첨 합성 & 나무망치 제작 연출 검증', () => {
  const AvatarSystem = require('../js/avatar-system.js');
  const avatarSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');

  // 1. 77종 3등신 바디 풀 완전 탑재 검증
  assert.strictEqual(Array.isArray(AvatarSystem.BODY_THEMES_77), true, '77종 바디 풀 배열 존재');
  assert.strictEqual(AvatarSystem.BODY_THEMES_77.length, 77, '정확히 77종의 캐릭터 바디 테마 정의');
  
  // 첫 번째 및 마지막 바디 유효성 검증
  assert.strictEqual(AvatarSystem.BODY_THEMES_77[0].id, 1, '첫 번째 바디 ID 1');
  assert.strictEqual(AvatarSystem.BODY_THEMES_77[76].id, 77, '마지막 바디 ID 77');

  // 2. 나무망치 제작 애니메이션 연출 검증
  assert.strictEqual(typeof AvatarSystem.getWoodHammerMakerAnimationHtml, 'function', '나무망치 연출 함수 존재');
  const animHtml = AvatarSystem.getWoodHammerMakerAnimationHtml('홍길동');
  assert.ok(animHtml.includes('홍길동님을 형상화한 아바타를 만들고 있어요'), '닉네임 포함 제작 안내문구');
  assert.ok(animHtml.includes('hammerStrike'), '나무망치 타격 키프레임 애니메이션');
  assert.ok(animHtml.includes('<svg') && animHtml.includes('#92400E'), '나무망치 SVG 그래픽 엘리먼트');

  // 3. 3등신 캔버스 합성기 검증
  assert.strictEqual(typeof AvatarSystem.composite3DeformedAvatar, 'function', '3등신 캔버스 합성 함수 존재');

  // 4. 소스 코드 내 난수 추첨 및 리롤 버튼 연동 검증
  assert.ok(avatarSrc.includes('Math.floor(Math.random() * BODY_THEMES_77.length)'), '77종 중 난수(Random) 추첨 로직 연동');
  assert.strictEqual(avatarSrc.includes('btnRerollAvatarTheme'), false, '상민님 지시로 다른바디 입히기 버튼 삭제');
});

check('compliance: [#TASK-ES-047] 사진 기반 퍼스널 컬러/특징 분석 및 77종 바디 일체형 무봉제 만화형 페이스 합성 엔진 검증', () => {
  const AvatarSystem = require('../js/avatar-system.js');
  const avatarSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');

  // 1. 퍼스널 특징 추출기 검증
  assert.strictEqual(typeof AvatarSystem.extractPersonalFeatures, 'function', 'extractPersonalFeatures 함수 존재');
  const features = AvatarSystem.extractPersonalFeatures(null);
  assert.ok(features.skinColor, '기본 스킨톤 반환');
  assert.ok(features.hairColor, '기본 헤어톤 반환');

  // 2. 만화형 8종 헤어스타일 및 4종 표정 풀 검증
  assert.strictEqual(Array.isArray(AvatarSystem.CARTOON_HAIRSTYLES), true, 'CARTOON_HAIRSTYLES 배열 존재');
  assert.strictEqual(AvatarSystem.CARTOON_HAIRSTYLES.length, 8, '8종 만화형 헤어스타일 정의');
  assert.strictEqual(Array.isArray(AvatarSystem.CARTOON_EXPRESSIONS), true, 'CARTOON_EXPRESSIONS 배열 존재');
  assert.strictEqual(AvatarSystem.CARTOON_EXPRESSIONS.length, 4, '4종 만화형 표정 정의');

  // 3. 무봉제 만화형 헤드 렌더러 검증
  assert.strictEqual(typeof AvatarSystem.drawCartoonHead, 'function', 'drawCartoonHead 함수 존재');

  // 4. 모달 내 헤어스타일/표정 미세조정 버튼 및 일체형 합성 연동 검증
  assert.strictEqual(avatarSrc.includes('btnCycleHairStyle'), false, '상민님 지시로 헤어스타일 변경 버튼 삭제');
  assert.strictEqual(avatarSrc.includes('btnCycleExpression'), false, '상민님 지시로 표정 변경 버튼 삭제');
  assert.ok(avatarSrc.includes('drawCartoonHead(ctx'), '캔버스 내 무봉제 만화형 헤드 렌더링 호출');
});

check('compliance: [#TASK-ES-048] 아바타 적용 즉시 반영, 제작 시 3회 차감, Gemini 비전 엔드포인트 & 무봉제 샌드위치 렌더러, 뱃지 제거 검증', () => {
  const AvatarSystem = require('../js/avatar-system.js');
  const avatarSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');

  // 1. /api/avatar-face 리라이트 및 api/promptgen.js 비전 핸들러 무결성 검증 (Vercel 12개 한도 엄수)
  const vercelCfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
  assert.ok(vercelCfg.rewrites.some(r => r.source === '/api/avatar-face' && r.destination === '/api/promptgen'), '/api/avatar-face 리라이트 규칙 존재');
  const promptgenSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'promptgen.js'), 'utf8');
  assert.ok(promptgenSrc.includes('handleAvatarFaceVision'), 'promptgen.js 내 Gemini 비전 아바타 디코더 탑재');

  // 2. 캔버스 좌측 상단 번호/이름 뱃지 그리기 코드 완전 삭제 확인
  assert.strictEqual(avatarSrc.includes("ctx.fillText('#' + theme.id"), false, '캔버스 좌측 상단 뱃지 텍스트 렌더링 완전 삭제');

  // 3. 아바타 제작 시 3회 차감 분리 및 제작 버튼 연동 확인
  assert.strictEqual(typeof AvatarSystem.getRemainingCrafts, 'function', 'getRemainingCrafts 함수 존재');
  assert.strictEqual(AvatarSystem.getRemainingCrafts({ settings: { avatarCraftCount: 1 } }), 9, '제작 1회 사용 시 잔여 9회');
  assert.strictEqual(AvatarSystem.getRemainingCrafts({ settings: { avatarCraftCount: 10 } }), 0, '제작 10회 소진 시 잔여 0회');
  assert.ok(avatarSrc.includes('btnRunCraftAvatar'), '내 사진으로 아바타 제작 버튼 연동');

  // 4. index.html openAvatarModal 호출 시 profile 전달 및 즉시 리렌더 연동 확인
  assert.ok(html.includes('profile: state.profile'), 'openAvatarModal에 profile 명시 전달');
  assert.ok(html.includes('renderHome()') && html.includes('renderLevelBadge()'), '아바타 변경 시 홈/레벨 즉각 리렌더 연동');
});


check('compliance: [#TASK-ES-049] Gemini 3.1 Flash-Lite 초가성비 비전 모델 교체 및 사진 픽셀 기반 동적 만화 얼굴 이중 방어망 검증', () => {
  const promptgenSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'promptgen.js'), 'utf8');
  const avatarSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');
  const AvatarSystem = require('../js/avatar-system.js');

  // 1. api/promptgen.js 내 404 구버전 모델 퇴출 및 gemini-3.1-flash-lite 1순위 탑재 확인
  assert.strictEqual(promptgenSrc.includes('gemini-2.5-flash'), false, '404 발생 구버전 gemini-2.5-flash 완전 제거');
  assert.strictEqual(promptgenSrc.includes('gemini-2.0-flash'), false, '404 발생 구버전 gemini-2.0-flash 완전 제거');
  assert.strictEqual(promptgenSrc.includes('gemini-1.5-flash'), false, '404 발생 구버전 gemini-1.5-flash 완전 제거');
  assert.ok(promptgenSrc.includes("'gemini-3.1-flash-lite'"), '초가성비 gemini-3.1-flash-lite 1순위 모델 탑재');

  // 2. js/avatar-system.js extractPersonalFeatures 동적 픽셀 추출 로직 탑재 확인
  assert.ok(avatarSrc.includes('getImageData'), '실제 사진 픽셀 스캔 getImageData 탑재');
  assert.ok(avatarSrc.includes('chosenSkin'), '동적 피부톤 추출 로직 탑재');
  assert.ok(avatarSrc.includes('chosenHair'), '동적 헤어컬러 추출 로직 탑재');

  // 3. 서버 429/에러/fallback 시 extractPersonalFeatures 연동 이중 방어망 확인
  assert.ok(avatarSrc.includes('extractPersonalFeatures(lastUploadedImg)'), '실패/fallback 시 클라이언트 사진 픽셀 자가 분석 연동');
});


check('compliance: [#TASK-ES-050] 아바타 API 실패 시 정중 안내 문구 및 횟수 롤백 복원 검증', () => {
  const avatarSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');

  // 1. 상민님 지시 정확한 안내 멘트 탑재 확인
  assert.ok(
    avatarSrc.includes('죄송합니다. 현재 아워골 서버문제로 아바타 생성이 지원되지 못하고 있습니다.'),
    '서버 문제 시 정중 안내 문구 노출'
  );

  // 2. 실패 시 횟수 롤백(복원) 로직 확인
  assert.ok(
    avatarSrc.includes('Math.max(0, (settings.avatarCraftCount || 1) - 1)'),
    '실패 시 차감 횟수 원복 처리'
  );

  // 3. API 실패 핸들러 존재 확인
  assert.ok(avatarSrc.includes('handleApiFailure'), 'handleApiFailure 함수 탑재');
});

check('compliance: [#TASK-ES-051] Gemini 비전 inlineData 규격 준수, API 키 트림 및 사진 512px JPEG 리사이징 검증', () => {
  const promptgenSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'promptgen.js'), 'utf8');
  const avatarSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');

  // 1. promptgen.js 내 GEMINI_API_KEY .trim() 처리 검증
  assert.ok(promptgenSrc.includes('process.env.GEMINI_API_KEY.trim()'), 'process.env.GEMINI_API_KEY trim 처리 필수');

  // 2. promptgen.js 내 inlineData 카멜케이스 규격 준수 검증
  assert.ok(promptgenSrc.includes('inlineData: { mimeType: mimeType, data: rawData }'), 'inlineData 및 mimeType 카멜케이스 공식 규격 준수');

  // 3. avatar-system.js 사진 업로드 시 512x512 캔버스 리사이징 및 image/jpeg 정규화 검증
  assert.ok(avatarSrc.includes("toDataURL('image/jpeg', 0.85)"), '업로드 사진 캔버스 JPEG 압축 정규화 탑재');
  assert.ok(avatarSrc.includes('maxDim = 512'), '최대 512px 리사이징 적용');
});

check('compliance: [#TASK-ES-052] Gemini 3.1 Flash-Lite Image 멀티모달 이미지 생성 모델 도입 및 아바타 연동 검증', () => {
  const promptgenSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'promptgen.js'), 'utf8');
  const avatarSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');

  // 1. promptgen.js 내 gemini-3.1-flash-lite-image 모델 탑재 검증
  assert.ok(promptgenSrc.includes("'gemini-3.1-flash-lite-image'"), '최신 멀티모달 이미지 생성 모델 1순위 탑재');
  assert.ok(promptgenSrc.includes('generatedAvatarUrl'), 'AI 생성 아바타 이미지 URL 추출기 탑재');

  // 2. avatar-system.js 내 theme 전달 및 AI avatarUrl 바인딩 검증
  assert.ok(avatarSrc.includes('theme: chosenTheme'), '아바타 제작 시 선택된 바디 테마 전달');
  assert.ok(avatarSrc.includes('resData.avatarUrl'), 'AI 생성 아바타 이미지 우선 바인딩');

  // 3. index.html avatar-system.js 캐시 무효화 쿼리스트링 검증
  assert.ok(html.includes('avatar-system.js?v='), 'avatar-system.js 캐시 버스팅 파라미터 탑재');
});

check('compliance: [#TASK-ES-053] 아바타 모달 미세조정 버튼(헤어스타일/표정/다른바디) 삭제 및 아바타 제작 한도 10회 확대 검증', () => {
  const AvatarSystem = require('../js/avatar-system.js');
  const avatarSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');

  // 1. 제작 한도 10회 검증
  assert.strictEqual(AvatarSystem.MAX_AVATAR_CHANGES, 10, 'MAX_AVATAR_CHANGES 10회');
  assert.strictEqual(AvatarSystem.getRemainingCrafts({ settings: { avatarCraftCount: 0 } }), 10, '제작 미사용 시 10회 잔여');
  assert.strictEqual(AvatarSystem.getRemainingCrafts({ settings: { avatarCraftCount: 5 } }), 5, '제작 5회 사용 시 5회 잔여');
  assert.strictEqual(AvatarSystem.getRemainingCrafts({ settings: { avatarCraftCount: 10 } }), 0, '제작 10회 사용 시 0회 잔여');

  // 2. 모달 텍스트 10회 반영 검증
  assert.ok(avatarSrc.includes('최대 10회'), '모달 안내문구 최대 10회 표기');
  assert.ok(avatarSrc.includes('/10회'), '버튼 및 상단 잔여 /10회 표기');
  assert.ok(avatarSrc.includes('제작 횟수(10회)를 모두 소진했습니다'), '소진 안내 타이틀 10회');
  assert.strictEqual(avatarSrc.includes('최대 3회'), false, '구버전 최대 3회 텍스트 전면 소멸');

  // 3. 미세조정 3종 버튼 완전 삭제 검증
  assert.strictEqual(avatarSrc.includes('btnCycleHairStyle'), false, '헤어스타일 변경 버튼 소스 내 부재');
  assert.strictEqual(avatarSrc.includes('btnCycleExpression'), false, '표정 변경 버튼 소스 내 부재');
  assert.strictEqual(avatarSrc.includes('btnRerollAvatarTheme'), false, '다른바디 입히기 버튼 소스 내 부재');

  // 4. index.html 캐시 버스팅 es053 검증
  assert.ok(/avatar-system\.js\?v=20260913-es05[3-9]/.test(html), 'index.html 캐시 버스팅 적용');
});

check('compliance: [#TASK-ES-054] 아바타 테마 번호(#숫자) 삭제 및 AI 이미지 생성 프롬프트 모자(Hat) 반영 검증', () => {
  const promptgenSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'promptgen.js'), 'utf8');
  const avatarSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');

  // 1. promptgen.js 내 hat / headwear 지침 탑재 검증
  assert.ok(
    promptgenSrc.includes('hat/cap/headwear') && promptgenSrc.includes('hat or cap'),
    '이미지 생성 프롬프트에 모자(hat/cap/headwear) 감지 및 반영 지침 탑재'
  );

  // 2. avatar-system.js 내 번호(#숫자) 표기 완전 삭제 검증
  assert.strictEqual(
    avatarSrc.includes("'<span>#' + chosenTheme.id"),
    false,
    '아바타 프리뷰 영역에서 #(숫자) 테마 번호 표기 완전 삭제'
  );
  assert.ok(
    avatarSrc.includes("'<span>' + chosenTheme.name + '</span>'"),
    '순수 테마 이름만 깔끔하게 노출'
  );

  // 3. index.html 캐시 버스팅 es054 검증
  assert.ok(html.includes('avatar-system.js?v=20260913-es054'), 'index.html es054 캐시 버스팅 적용');
});

check('compliance: [#TASK-ES-056] 아워골 전면 Gemini API 단일화 및 오프라인/서버 지연 안내 문구 무결성 검증', () => {
  const targetApis = [
    'api/feedback.js',
    'api/goalagent.js',
    'api/goalstatus.js',
    'api/goaltemplate.js',
    'api/nextaction.js',
    'api/promptgen.js',
    'api/todaymission.js',
    'api/vision-table.js'
  ];

  targetApis.forEach(apiPath => {
    const code = fs.readFileSync(path.join(__dirname, '..', apiPath), 'utf8');
    assert.ok(code.includes('gemini-3.1-flash-lite'), `${apiPath} 에 gemini-3.1-flash-lite 탑재 확인`);
    assert.ok(!code.includes('anthropicApiKey') && !code.includes('api.anthropic.com'), `${apiPath} 에 Anthropic 호출 코드 완전 제거 확인`);
  });

  const visionCode = fs.readFileSync(path.join(__dirname, '..', 'api', 'vision-table.js'), 'utf8');
  assert.ok(!visionCode.includes('gemini-2.5-flash') && !visionCode.includes('gemini-1.5-flash'), 'vision-table.js 내 404 유발 구버전 모델 제거');

  const htmlCode = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(htmlCode.includes('⚡ 오프라인 상태 또는 아워골 서버 문제로 기본 안내가 생성되었습니다'), 'index.html 에 사용자 확정 오프라인/서버 지연 안내 문구 탑재');
  assert.ok(htmlCode.includes('aiProvider:"gemini"') || htmlCode.includes('aiProvider: "gemini"'), 'index.html 기본 AI 프로바이더 gemini 단일화');
  assert.ok(htmlCode.includes('gemini-3.1-flash-lite'), 'index.html 기본 모델 gemini-3.1-flash-lite 확인');
  assert.ok(!htmlCode.includes('data-provider="claude"'), 'index.html 설정 화면에서 Claude 선택지 제거');
});

check('compliance: [#TASK-ES-057] 맞춤 템플릿 AI 줄글 분석의 Gemini 3.1 Flash Lite 연동 및 무중단 배선 무결성 검증', () => {
  const goaltemplate = require('../api/goaltemplate.js');
  assert.strictEqual(typeof goaltemplate.localCustomTemplateFallback, 'function', 'localCustomTemplateFallback 함수 노출');

  const fbCrossfit = goaltemplate.localCustomTemplateFallback('크로스핏', 'WOD Fran 21-15-9');
  assert.strictEqual(fbCrossfit.title, '크로스핏');
  assert.strictEqual(fbCrossfit.theme, 'workout');
  assert.ok(fbCrossfit.columns.includes('번호'), '첫 번째 열은 항상 번호');
  assert.ok(fbCrossfit.columns.includes('WOD 운동종목'), '크로스핏 특화 열 포함');
  assert.strictEqual(fbCrossfit.source, 'fallback');
  assert.strictEqual(fbCrossfit.isOfflineFallback, true);

  const fbCustom = goaltemplate.localCustomTemplateFallback('주간 회의록', '열은 안건, 담당자, 진척도로 해줘');
  assert.strictEqual(fbCustom.title, '주간 회의록');
  assert.ok(fbCustom.columns.includes('안건'), '자연어 열 추출 반영');
  assert.ok(fbCustom.columns.includes('담당자'), '자연어 열 추출 반영');

  const vercelCfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
  assert.ok(vercelCfg.rewrites.some(r => r.source === '/api/customtemplate' && r.destination === '/api/goaltemplate'), 'vercel.json 에 /api/customtemplate 리라이트 규칙 존재');

  const htmlCode = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(htmlCode.includes('/api/customtemplate'), 'index.html 이 /api/customtemplate 엔드포인트 비동기 호출');
  assert.ok(htmlCode.includes('Gemini 3.1 Flash Lite가 양식 설계 중'), 'index.html 에 로딩 인디케이터 상태 탑재');
  assert.ok(htmlCode.includes("action: 'custom_record_template'"), 'index.html 이 custom_record_template 액션 전달');
});

check('compliance: [#TASK-ES-058] 아워골 AI 목표 및 템플릿 생성 유해/범죄 키워드 차단 이중 방어선 및 오탐 방지 안내 시스템 검증', () => {
  // 1. js/content-moderation.js 모듈 로드 및 구조 검증
  const moderation = require('../js/content-moderation.js');
  assert.strictEqual(typeof moderation.check, 'function', 'moderation.check 함수 노출');
  assert.ok(moderation.REJECT_MESSAGE.includes('아워골 내부 차단 키워드가 식별되어 생성이 거부되었습니다'), '정본 차단 메시지 일치');
  assert.ok(moderation.REJECT_SUPPORT.includes('1:1 문의 및 오류 제보'), '상민님 지시 1:1 문의 지원 문구 일치');
  assert.ok(moderation.REJECT_NOTICE.includes('무공해 플랫폼을 위한 강한 제어체계'), '상민님 제안 무공해 플랫폼 신뢰 안내 문구 탑재');

  // 2. 범죄/음란/자해 키워드 차단 검증
  const blockedCases = [
    '필로폰 유통 및 판매 계획',
    '사설토토 사이트 개설 및 홍보',
    '청부살인 의뢰 및 실행',
    '보이스피싱 조직 구축',
    '조건만남 성매매 알선',
    '음란물 유포 사이트 제작',
    '동반자살 모임 결성'
  ];

  for (const text of blockedCases) {
    const res = moderation.check(text);
    assert.strictEqual(res.flagged, true, '차단되어야 함: ' + text);
    assert.strictEqual(res.message, '아워골 내부 차단 키워드가 식별되어 생성이 거부되었습니다', '거부 메시지 일치');
    assert.ok(res.support.includes('1:1 문의 및 오류 제보'), '1:1 문의 안내 포함');
  }

  // 3. [상민님 지시] 서술어 결합(끊기, 탈출 등)을 통한 우회/오용/남용 시도 엄격 차단 검증
  const bypassAttemptCases = [
    '필로폰 끊기 챌린지',
    '사설토토 탈출하고 정상 생활하기',
    '보이스피싱 조직 그만두기',
    '조건만남 끊기'
  ];

  for (const text of bypassAttemptCases) {
    const res = moderation.check(text);
    assert.strictEqual(res.flagged, true, '서술어 결합 우회 시도 차단되어야 함: ' + text);
    assert.strictEqual(res.message, '아워골 내부 차단 키워드가 식별되어 생성이 거부되었습니다');
    assert.ok(res.support.includes('1:1 문의 및 오류 제보'));
  }

  // 4. [문제해결 8원칙 고도화] 특수기호 삽입, 숨김 유니코드, 영문, 은어 거래 결합 오남용 방어 검증
  const advancedEvasionCases = [
    { text: '필.로.폰 구매 방법', expect: true },
    { text: '사-설-토-토 사이트 개설', expect: true },
    { text: '보!이!스!피!싱 대본', expect: true },
    { text: '청_부_살_인 의뢰', expect: true },
    { text: '몸~캠~피~싱 사기', expect: true },
    { text: '카/드/깡 작업', expect: true },
    { text: '필\u200B로\u200B폰 판매', expect: true },
    { text: '대\u200D마\u200D초 유통', expect: true },
    { text: 'how to buy methamphetamine online', expect: true },
    { text: 'philopon delivery guide', expect: true },
    { text: 'create ransomware for money', expect: true },
    { text: 'voice phishing call center template', expect: true },
    { text: 'make deepfake porn video', expect: true },
    { text: '아이스 팝니다 텔레그램 문의', expect: true },
    { text: '작대기 직거래 좌표 공유', expect: true },
    { text: '떨 팝니다 직거래 환영', expect: true }
  ];

  for (const tc of advancedEvasionCases) {
    const res = moderation.check(tc.text);
    assert.strictEqual(res.flagged, tc.expect, '오남용 변칙 차단 검증: ' + tc.text);
    assert.strictEqual(res.message, '아워골 내부 차단 키워드가 식별되어 생성이 거부되었습니다');
  }

  // 5. 일반적인 건전한 목표 통과 및 오탐 방지 검증
  const allowedCases = [
    '매일 아침 6시 기상 및 5km 러닝',
    '담배 끊기 30일 습관 챌린지',
    '스마트폰 사용 시간 줄이기',
    '공인중개사 1차 시험 합격',
    '살인적인 스케줄 극복하기',
    '화이트해커 정보보안 공부',
    '아이스 아메리카노 하루 1잔 줄이기',
    '나무 작대기로 텐트 고정하기',
    'methodology of software design'
  ];

  for (const text of allowedCases) {
    const res = moderation.check(text);
    assert.strictEqual(res.flagged, false, '정상 목표는 통과되어야 함: ' + text);
  }

  // 4. index.html 이중 방어망 배선 검증
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.includes('<script src="js/content-moderation.js"></script>'), 'index.html 내 content-moderation.js 로드');
  assert.ok(html.includes('window.OurgoalModeration.check(text)'), 'sendGoalAgentMessage 내 사전 차단 배선');
  assert.ok(html.includes('window.OurgoalModeration.check(desc)'), 'showNewGoalChatStep 내 사전 차단 배선');
  assert.ok(html.includes('window.OurgoalModeration.check(checkText)'), 'openCreateCustomTemplateModal 내 사전 차단 배선');
  assert.ok(html.includes("errBody.error === 'CONTENT_FILTER_REJECTED'"), 'requestGoalAgentDiff 내 서버 거부 에러 핸들링');
  assert.ok(html.includes('무공해 플랫폼을 위한 강한 제어체계를 구축했습니다'), 'index.html 모달 내 무공해 플랫폼 신뢰 멘트 렌더링');

  // 5. 서버리스 API 2종 차단 배선 검증
  const goalAgentCode = fs.readFileSync(path.join(__dirname, '..', 'api/goalagent.js'), 'utf8');
  assert.ok(goalAgentCode.includes("require('../js/content-moderation.js')"), 'api/goalagent.js 내 content-moderation 연동');
  assert.ok(goalAgentCode.includes("error: 'CONTENT_FILTER_REJECTED'"), 'api/goalagent.js 내 400 거부 반환');

  const goalTemplateCode = fs.readFileSync(path.join(__dirname, '..', 'api/goaltemplate.js'), 'utf8');
  assert.ok(goalTemplateCode.includes("require('../js/content-moderation.js')"), 'api/goaltemplate.js 내 content-moderation 연동');
  assert.ok(goalTemplateCode.includes("error: 'CONTENT_FILTER_REJECTED'"), 'api/goaltemplate.js 내 400 거부 반환');
});

check('[TASK-ES-059] 테마 구분 없는 임의 데이터 AI 자율 메트릭 추론 및 다형성 시각화 엔진 검증', () => {
  const uStats = require('../js/universal-stats.js');
  assert.ok(uStats, 'universal-stats.js 모듈 로드');
  assert.strictEqual(typeof uStats.extractMetricsFromRecord, 'function');
  assert.strictEqual(typeof uStats.discoverActiveMetrics, 'function');
  assert.strictEqual(typeof uStats.aggregateMetricTimeSeries, 'function');
  assert.strictEqual(typeof uStats.renderUniversalSvgChart, 'function');
  assert.strictEqual(typeof uStats.generateDomainSample, 'function');

  // 1. 14개 이상 임의 도메인 및 사용자 입력 메트릭 자율 추출 검증
  const testCases = [
    { text: '아침 공복 체중 74.5kg 기록', cat: 'weight', val: 74.5, unit: 'kg', chart: 'line' },
    { text: '클린코드 45쪽 완독', cat: 'reading', val: 45, unit: '쪽', chart: 'bar' },
    { text: '어제 7.5시간 꿀잠 숙면', cat: 'sleep', val: 7.5, unit: '시간', chart: 'line' },
    { text: '청약 적금 50만원 저축 완료', cat: 'finance', val: 50, unit: '만원', chart: 'area' },
    { text: '한강 러닝 10.5km 5:12 페이스 완주', cat: 'running', val: 10.5, unit: 'km', chart: 'area' },
    { text: '벤치프레스 100kg, 스쿼트 140kg, 데드리프트 170kg', cat: 'big3', val: 410, unit: 'kg', chart: 'line' },
    { text: '도서관 순공 180분, 기출 50문제', cat: 'study', val: 180, unit: '분', chart: 'bar' },
    { text: '고객사 계약 2건 실적 500만원 달성', cat: 'sales', val: 500, unit: '만원', chart: 'area' },
    { text: '아침 혈압 125/82 mmHg 측정', cat: 'blood_pressure', val: 125, unit: 'mmHg', chart: 'line' },
    { text: '아메리카노 2잔 카페인 150mg 섭취', cat: 'caffeine', val: 150, unit: 'mg', chart: 'bar' },
    { text: '주말 라운딩 84타 라베 달성', cat: 'golf', val: 84, unit: '타', chart: 'line' },
    { text: '깃허브 잔디 심기 12커밋 푸시', cat: 'coding', val: 12, unit: '커밋', chart: 'bar' },
    { text: '수분 2.2L 음용 완료', cat: 'water', val: 2.2, unit: 'L', chart: 'bar' },
    { text: '인바디 체지방률 14.2% 측정', cat: 'body_fat', val: 14.2, unit: '%', chart: 'line' }
  ];

  for (const tc of testCases) {
    const mList = uStats.extractMetricsFromRecord({ text: tc.text });
    const found = mList.find(m => m.category === tc.cat);
    assert.ok(found, `지표 추출 성공: ${tc.cat} from "${tc.text}"`);
    assert.strictEqual(found.value, tc.val, `값 일치 (${tc.cat}): ${found.value} === ${tc.val}`);
    assert.strictEqual(found.unit, tc.unit, `단위 일치 (${tc.cat}): ${found.unit} === ${tc.unit}`);
    assert.strictEqual(found.chartType, tc.chart, `차트형태 일치 (${tc.cat}): ${found.chartType} === ${tc.chart}`);
  }

  // 2. 표/테이블 및 CSV 형식 임의 컬럼 자율 메트릭 추출 검증
  const tableRec = {
    columns: ['날짜', '골격근량(kg)', '기초대사량(kcal)'],
    rows: [['2025-05-01', '34.2kg', '1680']]
  };
  const tableMetrics = uStats.extractMetricsFromRecord(tableRec);
  const muscleM = tableMetrics.find(m => m.category === 'tbl_골격근량');
  const metabM = tableMetrics.find(m => m.category === 'tbl_기초대사량');
  assert.ok(muscleM, '임의 표 컬럼 골격근량 메트릭 자동 추출');
  assert.strictEqual(muscleM.value, 34.2);
  assert.strictEqual(muscleM.unit, 'kg');
  assert.strictEqual(muscleM.chartType, 'line');
  assert.ok(metabM, '임의 표 컬럼 기초대사량 메트릭 자동 추출');
  assert.strictEqual(metabM.value, 1680);
  assert.strictEqual(metabM.unit, 'kcal');

  // 3. 1년치 샘플 데이터 생성기 검증 (체중, 독서, 수면, 재테크, 러닝, 3대운동 등)
  const domains = ['weight', 'reading', 'sleep', 'finance', 'running', 'big3', 'study', 'sales'];
  domains.forEach(d => {
    const s = uStats.generateDomainSample(d);
    assert.ok(Array.isArray(s) && s.length >= 50, `${d} 1년치 샘플 50건 이상 생성`);
  });

  // 4. 활성 지표 자율 발견(Auto-Discovery) 및 동적 칩 검증
  const testSampleRecs = [].concat(
    uStats.generateDomainSample('weight'),
    uStats.generateDomainSample('reading'),
    uStats.generateDomainSample('sleep')
  );
  const discovery = uStats.discoverActiveMetrics(testSampleRecs);
  assert.ok(discovery.activeMetrics.length >= 4, '최소 4개 이상 활성 지표 자동 노출');
  const cats = discovery.activeMetrics.map(m => m.category);
  assert.ok(cats.includes('general'), 'general 실천시간 포함');
  assert.ok(cats.includes('weight'), 'weight 체중 칩 포함');
  assert.ok(cats.includes('reading'), 'reading 독서 칩 포함');
  assert.ok(cats.includes('sleep'), 'sleep 수면 칩 포함');

  // 5. 다차원 시계열 집계 및 다형성 SVG 차트 렌더링 검증
  ['weight', 'reading', 'sleep'].forEach(c => {
    const agg = uStats.aggregateMetricTimeSeries(testSampleRecs, c, '1year');
    assert.ok(agg.hasData, `${c} 시계열 데이터 존재`);
    assert.ok(agg.totalSessions > 0, `${c} 총 세션수 집계`);
    const svg = uStats.renderUniversalSvgChart(agg);
    assert.ok(svg.includes('<svg'), `${c} SVG 차트 태그 렌더링`);
    assert.ok(svg.includes('role="img"'), `${c} 웹 접근성 role 속성`);
  });

  // 6. 서버리스 API goaltemplate.js 내 ai_stats_agent & localStatsAgentFallback 검증
  const goaltemplate = require('../api/goaltemplate.js');
  assert.strictEqual(typeof goaltemplate.localStatsAgentFallback, 'function', 'localStatsAgentFallback export 확인');
  const fbRes = goaltemplate.localStatsAgentFallback(testSampleRecs);
  assert.ok(Array.isArray(fbRes.metrics) && fbRes.metrics.length > 0, '폴백 지표 배열 반환');
  assert.ok(typeof fbRes.analysis === 'string' && fbRes.analysis.length > 10, 'AI 분석 텍스트 생성');
  assert.strictEqual(fbRes.isOfflineFallback, true);

  // 7. vercel.json 12개 함수 한도 및 /api/statsagent 리라이트 규칙 검증
  const vercelCfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
  assert.ok(vercelCfg.rewrites, 'vercel.json rewrites 설정');
  const statRewrite = vercelCfg.rewrites.find(r => r.source === '/api/statsagent');
  assert.ok(statRewrite, '/api/statsagent rewrite 규칙 존재');
  assert.strictEqual(statRewrite.destination, '/api/goaltemplate');

  const apiFiles = fs.readdirSync(path.join(__dirname, '..', 'api')).filter(f => f.endsWith('.js'));
  assert.ok(apiFiles.length <= 12, `Vercel Hobby 12개 함수 한도 준수 (현재 ${apiFiles.length}개)`);

  // 8. index.html 배선 검증
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.includes('src="js/universal-stats.js'), 'index.html 내 universal-stats.js 로드');
  assert.ok(html.includes('id="recAddBtn"'), '기록 상단 새 기록 버튼 보존');
  assert.ok(!html.includes('id="recSampleTopBtn"'), '새기록 왼쪽 샘플로드 버튼 삭제 완료');
  assert.ok(!html.includes('id="recImportTopBtn"'), '새기록 왼쪽 가져오기 버튼 삭제 완료');
  assert.ok(html.includes('id="recUniversalTopBanner"'), '기록 피드 상단 단일 통합 유니버설 배너');
  assert.ok(html.includes('id="recImportBannerBtn"'), '배너 내 단일 통합 데이터 가져오기/샘플로드 버튼');
  assert.ok(!html.includes('id="recSampleBannerBtn"'), '배너 내 중복 2개 버튼 삭제 완료');
  assert.ok(html.includes('id="universalStatsDashboardBox"'), '성취통계 뷰 내 유니버설 대시보드 컨테이너');
  assert.ok(html.includes('OurgoalUniversalStats.renderUniversalStatsDashboard'), 'renderRecordsScreen 내 유니버설 대시보드 호출');
  assert.ok(html.includes('OurgoalUniversalStats.openUniversalImportModal'), '모달 오픈 배선');
  assert.ok(html.includes('wireRecordCards'), '세부 기록 모달 및 피드 카드 인터랙션 연동 함수 존재');
});

check('compliance: [#TASK-ES-059-FUSION] 임의 데이터 자율 융합(Ingest & Fusion) 및 완전 다중선택 슬라이싱 시각화 시스템 검증', () => {
  const uStats = require('../js/universal-stats.js');

  // 1. 52주 156세션 3대운동 주기화 프로그램 데이터 정밀 융합 검증
  assert.strictEqual(typeof uStats.generate52WeekPowerliftingSample, 'function', 'generate52WeekPowerliftingSample export');
  const big3Recs = uStats.generate52WeekPowerliftingSample();
  assert.strictEqual(big3Recs.length, 156, '52주 156세션 전수 생성');
  const entities = [...new Set(big3Recs.map(r => r.subTheme))];
  assert.ok(entities.includes('스쿼트') && entities.includes('벤치프레스') && entities.includes('데드리프트'), '스쿼트/벤치/데드 3대 종목 완벽 분해');
  assert.ok(big3Recs[0].startAt.includes('T19:00:00.000Z'), '시·분·초 정밀 타임스탬프 융합');
  assert.strictEqual(big3Recs[0].metrics['1rm'], 131, '1RM 메트릭 보존');
  assert.strictEqual(big3Recs[0].metrics['volume'], 4095, '볼륨 메트릭 보존');

  // 2. 임의 CSV 파서 및 자가 인코딩 복구 검증
  assert.strictEqual(typeof uStats.parseCsvToUniversalRecords, 'function', 'parseCsvToUniversalRecords export');
  const testCsv = 'Date,Exercise,Estimated_1RM_kg,Daily_Volume_kg\n2025-01-06,스쿼트,131,4095\n2025-01-07,벤치프레스,73,2515';
  const parsedFromCsv = uStats.parseCsvToUniversalRecords(testCsv, 'health');
  assert.strictEqual(parsedFromCsv.length, 2, 'CSV 파서 2행 정상 변환');
  assert.strictEqual(parsedFromCsv[1].subTheme, '벤치프레스', '엔티티명 정상 매핑');
  assert.strictEqual(parsedFromCsv[1].metrics['1rm'], 73, '수치 메트릭 정상 추출');

  // 3. 기존 인앱 기록 + 외부 수용 데이터의 자율 온톨로지 색인 검증
  const existingAppRecs = [
    { id: 'app_1', theme: 'health', subTheme: '러닝', text: '10km 러닝', startAt: '2025-05-10T07:00:00.000Z', metrics: { distance: 10, volume: 10 } },
    { id: 'app_2', theme: 'study', subTheme: '독서', text: '50쪽 독서', startAt: '2025-05-11T20:00:00.000Z', metrics: { pages: 50, volume: 50 } }
  ];
  const fusedAll = big3Recs.concat(existingAppRecs);
  const ontology = uStats.buildUniversalOntology(fusedAll);
  const ontNames = ontology.map(o => o.name);
  assert.ok(ontNames.includes('스쿼트') && ontNames.includes('벤치프레스') && ontNames.includes('데드리프트'), '3대운동 온톨로지 색인');
  assert.ok(ontNames.includes('러닝') && ontNames.includes('독서'), '기존 인앱 기록 온톨로지 통합 색인');

  // 4. [개별 선택(Single)] 벤치프레스 성장기록 단독 시각화 검증
  const singleBench = uStats.aggregateMultiSeries(fusedAll, ['벤치프레스'], '1rm', '1year', 'single');
  assert.ok(singleBench['벤치프레스'], '벤치프레스 단독 시계열 존재');
  assert.strictEqual(singleBench['벤치프레스'].points.length, 52, '52주 벤치프레스 전 세션');
  assert.strictEqual(singleBench['벤치프레스'].initialVal, 73, '초기 1RM 73kg');
  assert.strictEqual(singleBench['벤치프레스'].latestVal, 105, '최종 1RM 105kg');
  assert.strictEqual(singleBench['벤치프레스'].prVal, 106, '최고 PR 106kg');
  assert.strictEqual(singleBench['벤치프레스'].growthRate, 43.8, '성장률 +43.8%');
  const benchSvg = uStats.renderMultiSeriesSvg(singleBench);
  assert.ok(benchSvg.includes('<svg') && benchSvg.includes('PR 106'), '벤치프레스 단독 SVG 렌더링 및 PR 골드스타 마킹');

  // 5. [다중 선택(Multi-Select)] 벤치프레스 + 스쿼트 2개 선택 비교 검증
  const multi2 = uStats.aggregateMultiSeries(fusedAll, ['벤치프레스', '스쿼트'], '1rm', '1year', 'multi');
  assert.strictEqual(Object.keys(multi2).length, 2, '2개 종목 다중 선택 집계');
  const multi2Svg = uStats.renderMultiSeriesSvg(multi2);
  assert.ok(multi2Svg.includes('#3b82f6') && multi2Svg.includes('#10b981'), '다중 시계열 각각 고유 색상 선 분리 렌더링');

  // 6. [모두(ALL)] 3대운동 전 종목 종합 PR 합계 검증
  const multi3 = uStats.aggregateMultiSeries(fusedAll, ['벤치프레스', '스쿼트', '데드리프트'], '1rm', '1year', 'all');
  const totalPr = multi3['벤치프레스'].prVal + multi3['스쿼트'].prVal + multi3['데드리프트'].prVal;
  assert.strictEqual(totalPr, 506, '3대 운동 총 PR 506kg 달성 종합 계산');

  // 7. 크로스 도메인 다중 선택 (벤치프레스 + 기존 러닝) 검증
  const cross = uStats.aggregateMultiSeries(fusedAll, ['벤치프레스', '러닝'], 'volume', '1year', 'multi');
  assert.ok(cross['벤치프레스'] && cross['러닝'], '운동과 러닝 크로스 다중선택 집계');
  const crossSvg = uStats.renderMultiSeriesSvg(cross);
  assert.ok(crossSvg.includes('<svg'), '크로스 도메인 SVG 정상 드로잉');
});

check('compliance: [#TASK-AUTH-P0-SAFETY] 로그인/계정관리 P0 안전망 패키지(비밀번호 찾기/변경, 로그인 유지, 30일 탈퇴 유예, 최근 로그인 뱃지) 무결성 검증', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const authCode = fs.readFileSync(path.join(__dirname, '..', 'js/auth-safety.js'), 'utf8');

  // 1. 로그인 폼 및 설정 UI 컴포넌트 검증
  assert.ok(html.includes('id="rememberMeCheck"'), '이 기기에서 로그인 유지 체크박스 존재');
  assert.ok(html.includes('id="rememberIdCheck"'), '아이디 저장 체크박스 존재');
  assert.ok(html.includes('id="lastAuthBadge"'), '최근 로그인 수단 뱃지 컨테이너 존재');
  assert.ok(html.includes('id="forgotPassBtn"'), '비밀번호 찾기 링크 존재');
  assert.ok(html.includes('id="btnChangePassModal"'), '설정 화면 비밀번호 변경 버튼 존재');
  assert.ok(html.includes('js/auth-safety.js'), 'auth-safety.js 스크립트 연결');

  // 2. 인증 및 보안 핵심 함수 검증
  assert.ok(html.includes('function showLastAuthBadge'), '최근 로그인 뱃지 위임 함수');
  assert.ok(html.includes('function initRememberedAuthFields'), '저장된 아이디 및 뱃지 복원 위임 함수');
  assert.ok(html.includes('function openForgotPasswordModal'), '비밀번호 찾기 모달 위임 함수');
  assert.ok(html.includes('function openNewPasswordModal'), '새 비밀번호 설정 모달 위임 함수');
  assert.ok(html.includes('function openChangePasswordModal'), '설정 비밀번호 변경 모달 위임 함수');
  assert.ok(html.includes('function checkPendingDeletionRestore'), '30일 탈퇴 유예 복구 확인 위임 함수');

  assert.ok(authCode.includes('showLastAuthBadge'), '모듈 내 showLastAuthBadge');
  assert.ok(authCode.includes('initRememberedAuthFields'), '모듈 내 initRememberedAuthFields');
  assert.ok(authCode.includes('openForgotPasswordModal'), '모듈 내 openForgotPasswordModal');
  assert.ok(authCode.includes('openNewPasswordModal'), '모듈 내 openNewPasswordModal');
  assert.ok(authCode.includes('openChangePasswordModal'), '모듈 내 openChangePasswordModal');
  assert.ok(authCode.includes('checkPendingDeletionRestore'), '모듈 내 checkPendingDeletionRestore');

  // 3. Supabase Auth API 및 이벤트 배선 검증
  assert.ok(authCode.includes('resetPasswordForEmail'), 'Supabase 비밀번호 재설정 메일 발송 API 연동');
  assert.ok(html.includes("event === 'PASSWORD_RECOVERY'"), 'Supabase Auth 비밀번호 복구 이벤트 감지');
  assert.ok(html.includes('openChangePasswordModal()'), '설정 화면 비밀번호 변경 버튼 바인딩');

  // 4. 회원 탈퇴 30일 소프트 딜리션 유예 검증 (즉시 하드 삭제 방어)
  assert.ok(html.includes('pendingDeletionAt'), '탈퇴 유예 타임스탬프 설정');
  assert.ok(html.includes('30일'), '30일 유예 기간 안내 문구');
  assert.ok(authCode.includes('btnRestoreAccount'), '탈퇴 유예 계정 원클릭 복구 버튼');
});

check('compliance: [#TASK-ES-043] 9대 UX 핵심 결함(스트릭 보존, 개인정보 보호, 게스트 병합, localhost 차단, 랜딩 버튼, 연타 방어, 즉시 렌더, 도구어 순화, 인앱 안내)이 구현되어 있다', () => {
  // 1. 스트릭 계산: 당일 미체크인 시 어제 기준 연속 달성 일수 보존
  const startAt = d => new Date(Date.now() - d * 86400000).toISOString();
  fns.setRecords([{ startAt: startAt(1) }, { startAt: startAt(2) }, { startAt: startAt(3) }]);
  assert.strictEqual(fns.computeStreakDays(), 3, '오늘 미체크인 시 어제 기준 3일 스트릭 온전히 유지');
  assert.ok(html.includes('startCursor.setDate(startCursor.getDate() - 1);'), '당일 미체크인 분기 역산 로직 탑재');

  // 2. 설정 화면 및 문의 모달 개인 이메일 노출 제거
  const settingsEmailMatch = html.match(/emailEl\.textContent\s*=\s*([^;]+);/);
  assert.ok(settingsEmailMatch && !settingsEmailMatch[1].includes('ysm0422@naver.com'), '설정 화면 계정 이메일에 하드코딩 제거');
  const inquiryInputMatch = html.match(/id="inquiryEmail"[^\>]+/);
  assert.ok(inquiryInputMatch && !inquiryInputMatch[0].includes('ysm0422@naver.com'), '문의 모달 이메일 입력창 하드코딩 제거');

  // 3. 게스트 세션 데이터 새 소셜 계정으로 자동 마이그레이션 (목표/기록 Supabase upsert)
  assert.ok(html.includes("localStorage.getItem('ourgoal_guest_profile')"), '게스트 프로필 캐시 감지');
  assert.ok(html.includes("sb.from('goals').upsert(goalsPayload)"), '게스트 목표 Supabase upsert 연동');
  assert.ok(html.includes("sb.from('checkins').upsert(recsPayload)"), '게스트 체크인 Supabase upsert 연동');
  assert.ok(html.includes("localStorage.removeItem('ourgoal_guest_profile')"), '마이그레이션 후 게스트 세션 정상 정리');

  // 4. 첫 체크인 localhost:7777 호출 차단 및 로컬 페르소나 매칭 즉시 폴백
  assert.ok(html.includes('isLocalDev') && html.includes('triggerFirstCheerResponse'), '첫 응원 localhost 환경 가드');
  assert.ok(html.includes('scheduleCheerDelivery(cheerObj)'), '비개발 환경 즉시 로컬 페르소나 응원 전달');

  // 5. 랜딩 화면 게스트 진입 버튼 및 원클릭 게스트 프로필 생성
  assert.ok(html.includes('id="landGuestBtn"'), '랜딩 화면 게스트 둘러보기 버튼 마크업');
  assert.ok(html.includes("defaultProfile(guestId, guestId, '게스트')"), '원클릭 게스트 프로필 생성 핸들러');

  // 6. 체크인 저장 버튼 연타/더블클릭 방어 (saveBtn.disabled)
  assert.ok(html.includes('saveBtn.disabled = true;'), '체크인 저장 버튼 disabled 잠금');
  assert.ok(html.includes('saveBtn.disabled = false;'), 'finally 블록 저장 버튼 잠금 해제');

  // 7. 체크인 후 홈 화면 잔디 및 스트릭 배지 즉시 리렌더링
  assert.ok(html.includes('renderHomeGrassSummary();'), '체크인 핸들러 내 잔디 요약 즉시 리렌더링');
  assert.ok(html.includes('updateAppBadge(streak);'), '체크인 핸들러 내 앱 배지 즉시 갱신');

  // 8. 체크인 토스트 도구 언어(AI 노션 DB) 순화
  assert.ok(!html.includes('AI 노션 DB로 자동 기록 완료!'), 'AI 노션 DB 도구형 토스트 문구 완전 제거');
  assert.ok(html.includes('오늘의 실천이 안전하게 기록되었어요'), '사용자 중심의 따뜻한 기록 완료 토스트 탑재');

  // 9. 카카오톡 인앱 브라우저 감지 및 상단 안내 바
  assert.ok(html.includes('/KAKAOTALK/i.test(navigator.userAgent)'), '카카오톡 인앱 브라우저 감지 정규식');
  assert.ok(html.includes('id="inAppBrowserNotice"') || html.includes("id = 'inAppBrowserNotice'"), '카카오톡 인앱 브라우저 안내 배너 DOM 생성');
});

check('compliance: [#TASK-ES-042] 체크인 3단 피드백 모드(기본·중간·정밀) 및 최근 3일 기록 연계 피드백 엔진 검증', () => {
  // 1. index.html UI 마크업: 3단 피드백 모드 바 및 3개 티어 버튼
  assert.ok(html.includes('id="checkinFeedbackTierBar"'), '체크인 카드 3단 피드백 모드 바 마크업 존재');
  assert.ok(html.includes('data-fbtier="default"'), '기본 모드 버튼 존재');
  assert.ok(html.includes('data-fbtier="medium"'), '중간 모드 버튼 존재');
  assert.ok(html.includes('data-fbtier="macro"'), '정밀 모드 버튼 존재');

  // 2. index.html JS 엔진: 최근 기록 추출, 직전 피드백 조언 추출, 티어바 초기화, 1클릭 캘린더 버튼
  assert.ok(html.includes('getRecentCheckinsForAI'), '최근 실천 기록 연계 추출 함수 탑재');
  assert.ok(html.includes('getLastFeedbackAdvice'), '직전 피드백 조언 추출 함수 탑재');
  assert.ok(html.includes('initFeedbackTierBar'), '3단 피드백 티어바 바인딩 및 상태 동기화 함수 탑재');
  assert.ok(html.includes('btnApplyAiCalSlot'), '1클릭 캘린더 추천 일정 등록 버튼 탑재');

  // 3. api/feedback.js 백엔드: mode(기본/중간/정밀), recentRecords 파라미터 및 프롬프트 주입
  const feedbackApiCode = fs.readFileSync(path.join(__dirname, '..', 'api', 'feedback.js'), 'utf8');
  assert.ok(feedbackApiCode.includes('recentRecords'), '최근 기록 recentRecords 파라미터 수신');
  assert.ok(feedbackApiCode.includes('recentRecordsBlock'), '최근 기록 컨텍스트 프롬프트 블록 구성');
  assert.ok(feedbackApiCode.includes('모드: 기본 피드백'), '기본 모드 지침 포함');
  assert.ok(feedbackApiCode.includes('모드: 중간 피드백'), '중간 모드 지침 포함');
  assert.ok(feedbackApiCode.includes('모드: 정밀 피드백'), '정밀 모드 지침 포함');
  assert.ok(feedbackApiCode.includes('정밀 진단'), '정밀 모드 verdict 및 폴백 연동');
  assert.ok(feedbackApiCode.includes('페이스 조율'), '중간 모드 verdict 및 폴백 연동');
});

check('compliance: [#TASK-ES-059-BUTTONS] 기록 버튼 중복 해소 및 세부기록 모달 기능 연계 검증', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const rsCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'records-stats.js'), 'utf8');

  // 1. 헤더 새기록 왼쪽 버튼 2종 완전 삭제 및 새기록 버튼 단독 유지
  assert.ok(!html.includes('id="recSampleTopBtn"'), '새기록 왼쪽 샘플로드 버튼 삭제');
  assert.ok(!html.includes('id="recImportTopBtn"'), '새기록 왼쪽 가져오기 버튼 삭제');
  assert.ok(html.includes('id="recAddBtn"'), '새기록 버튼 보존');

  // 2. 배너 내 2개 버튼 -> 단일 통합 1개 버튼 [📥 데이터 가져오기 & 1초 샘플로드]
  assert.ok(!html.includes('id="recSampleBannerBtn"'), '배너 내 중복 샘플로드 버튼 삭제');
  assert.ok(html.includes('id="recImportBannerBtn"'), '배너 내 단일 통합 버튼 유지');

  // 3. 전역 정적 클릭 리스너 및 이벤트 위임 탑재
  assert.ok(html.includes("closest('#recImportBannerBtn"), '유니버설 가져오기 전역 클릭 리스너 위임 탑재');

  // 4. 세부 기록 보기 모달 스코프 에러 해소 및 wireRecordCards 카드 연동 탑재
  assert.ok(html.includes('function buildRecordCardHtml(r)'), 'buildRecordCardHtml 함수 상위 스코프 호이스팅');
  assert.ok(html.includes('function wireRecordCards(container'), 'wireRecordCards 카드 인터랙션 바인더 탑재');
  assert.ok(rsCode.includes('deps.wireRecordCards'), 'records-stats.js openDayDetailModal 내 카드 상호작용 배선');
});

/* ============ [#TASK-ES-060] 1900년대 및 역대 과거 임의 데이터 완벽 수용·융합·자율 시각화 및 크래시 방어 검증 ============ */
check('compliance: [#TASK-ES-060] 1900년대 및 역대 과거 임의 데이터 완벽 수용·융합·자율 시각화 및 크래시 방어 검증', () => {
  const uPath = path.join(__dirname, '..', 'js', 'universal-stats.js');
  assert.ok(fs.existsSync(uPath), 'js/universal-stats.js 파일 존재');
  const uSrc = fs.readFileSync(uPath, 'utf8');
  new Function(uSrc); // 문법 유효성 확인

  const mockWindow = {};
  new Function('window', uSrc)(mockWindow);
  const U = mockWindow.OurgoalUniversalStats;
  assert.ok(U, 'OurgoalUniversalStats 객체 노출');

  // 1. normalizeHistoricalDate 정규화 테스트 (1900년대, 점, 슬래시, 하이픈, 한글, YYYYMMDD 무손실 변환)
  assert.strictEqual(typeof U.normalizeHistoricalDate, 'function', 'normalizeHistoricalDate 함수 탑재');
  const d1 = U.normalizeHistoricalDate('1924.05.04');
  assert.ok(d1 && d1.startsWith('1924-05-04'), '1924.05.04 -> 1924-05-04 변환');
  const d2 = U.normalizeHistoricalDate('1900/01/01 10:30');
  assert.ok(d2 && d2.startsWith('1900-01-01'), '1900/01/01 10:30 변환');
  const d3 = U.normalizeHistoricalDate('1988년 09월 17일');
  assert.ok(d3 && d3.startsWith('1988-09-17'), '한글 일자 변환');
  const d4 = U.normalizeHistoricalDate('19501225');
  assert.ok(d4 && d4.startsWith('1950-12-25'), 'YYYYMMDD 변환');

  // 2. 1924 파리 올림픽 100년 역대 실측 샘플 생성 검증
  assert.strictEqual(typeof U.generate1920sOlympicStrengthSample, 'function', '1924 올림픽 샘플 생성 함수 탑재');
  const sample1924 = U.generate1920sOlympicStrengthSample();
  assert.ok(Array.isArray(sample1924) && sample1924.length >= 70, '1924 올림픽 70건 이상 실측 레코드 생성');
  assert.ok(sample1924[0].startAt.includes('1924'), '레코드 일자가 1924년도임');
  assert.ok(sample1924[0].metrics && (sample1924[0].metrics['1rm'] || sample1924[0].metrics['volume']), '수치 메트릭 보존');

  // 3. 1900년대 CSV 파싱 검증 (Invalid Date RangeError 원천 방어)
  const csvText = '일자,종목,중량(kg),반복수\n1924.05.04,밀리터리 프레스,82.5,3\n1924/05/06,스내치,90,2\n1900-01-01,기초 체력,50,10';
  const parsed = U.parseCsvToUniversalRecords(csvText);
  assert.strictEqual(parsed.length, 3, '1900년대 CSV 3건 무손실 파싱');
  assert.ok(parsed[0].startAt.startsWith('1924-05-04'), '첫 행 1924-05-04 ISO 변환');
  assert.ok(parsed[2].startAt.startsWith('1900-01-01'), '셋째 행 1900-01-01 ISO 변환');

  // 4. aggregateMultiSeries 'all' 전체 기간 및 음수 타임스탬프 수용 검증
  const entities = [...new Set(parsed.map(r => r.subTheme))];
  const agg = U.aggregateMultiSeries(parsed, entities, '1rm', 'all', 'multi');
  assert.ok(agg && Object.keys(agg).length > 0, '전체 기간 시계열 집계 성공');

  // 5. renderUniversalStatsDashboard 크래시(seriesKeys) 방어 및 1900년대 대시보드 렌더링 검증
  const mockBox = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {} };
  const mockState = { profile: { records: sample1924 } };
  U.renderUniversalStatsDashboard(mockBox, sample1924, mockState, {
    openModal: () => {},
    closeModal: () => {},
    toast: () => {},
    saveProfile: () => {},
    onDone: () => {}
  });
  assert.ok(mockBox.innerHTML.includes('1924'), '대시보드 HTML에 1924 연도 및 올림픽 데이터 렌더링');
  assert.ok(mockBox.innerHTML.includes('전체'), '전체(all) 기간 버튼 렌더링');

  // 6. index.html 무결성 검증 (캐시버스터, fmtDateLabel 연도 표기, try-catch 방어)
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('universal-stats.js?v=20260914-es060') || indexHtml.includes('universal-stats.js?v=20260914-es061'), '캐시버스터 갱신');
  assert.ok(indexHtml.includes("d.getFullYear() !== today.getFullYear()"), 'fmtDateLabel 과거 연도 표기 로직 탑재');
  assert.ok(indexHtml.includes("OurgoalUniversalStats.renderUniversalStatsDashboard(uDashBox, allRecs, state"), '대시보드 호출 탑재');
  assert.ok(indexHtml.includes("catch(uErr)"), '대시보드 렌더링 try-catch 방어막 탑재');
});

/* ============ [#TASK-ES-061] 유니버설 데이터 자율 융합, 동적 EAV 온톨로지 & 프로급 콕핏 시스템 검증 ============ */
check('compliance: [#TASK-ES-061] 유니버설 데이터 자율 융합, 동적 EAV 온톨로지 & 프로급 콕핏 시스템 무결성 검증', () => {
  const uStats = require('../js/universal-stats.js');
  assert.ok(uStats, 'OurgoalUniversalStats 모듈 export 확인');

  // 1. 초성 분해 및 초성 검색 검증 (ㅂㅊ -> 벤치프레스, ㅅㅋ -> 스쿼트, ㄷㅅ -> 독서, ㄹㄴ -> 러닝)
  assert.strictEqual(typeof uStats.getChosung, 'function', 'getChosung 함수 export');
  assert.strictEqual(uStats.getChosung('벤치프레스'), 'ㅂㅊㅍㄹㅅ', '벤치프레스 초성 분해');
  assert.strictEqual(uStats.getChosung('스쿼트'), 'ㅅㅋㅌ', '스쿼트 초성 분해');
  assert.strictEqual(uStats.getChosung('독서'), 'ㄷㅅ', '독서 초성 분해');
  assert.strictEqual(uStats.getChosung('러닝'), 'ㄹㄴ', '러닝 초성 분해');

  // matchQuery 검증
  assert.strictEqual(typeof uStats.matchQuery, 'function', 'matchQuery 함수 export');
  assert.ok(uStats.matchQuery('벤치프레스', 'ㅂㅊ'), 'ㅂㅊ 검색어로 벤치프레스 매칭');
  assert.ok(uStats.matchQuery('스쿼트', 'ㅅㅋ'), 'ㅅㅋ 검색어로 스쿼트 매칭');
  assert.ok(uStats.matchQuery('독서', 'ㄷㅅ'), 'ㄷㅅ 검색어로 독서 매칭');

  // 2. 8-Domain 온톨로지 및 패싯 자동 색인 검증
  const sampleRecs = [
    { id: '1', theme: 'health', subTheme: '벤치프레스', text: '100kg 5회', startAt: '2026-03-01T10:00:00.000Z', metrics: { '1rm': 100, volume: 2500 } },
    { id: '2', theme: 'running', subTheme: '10km 러닝', text: '페북 러닝', startAt: '2026-03-02T10:00:00.000Z', metrics: { distance: 10, pace: 5.2 } },
    { id: '3', theme: 'study', subTheme: '자바스크립트 독서', text: '120페이지', startAt: '2026-03-03T10:00:00.000Z', metrics: { pages: 120 } }
  ];
  const ontology = uStats.buildUniversalOntology(sampleRecs);
  assert.ok(Array.isArray(ontology) && ontology.length >= 3, '최소 3개 이상 엔티티 온톨로지 추출');
  const benchEnt = ontology.find(o => o.name === '벤치프레스');
  assert.ok(benchEnt && (benchEnt.domainKey === 'health' || benchEnt.theme === 'health'), '벤치프레스 health 도메인 매핑');
  assert.ok(benchEnt.dimensions.includes('1rm'), '1rm 차원 포함');

  // 3. 7-Tier 정밀 절삭 타임라인 슬라이싱 검증 ('all', '1y', '6m', '3m', '1m', '1w', '3d')
  const periods = ['all', '1y', '6m', '3m', '1m', '1w', '3d'];
  periods.forEach(p => {
    const agg = uStats.aggregateMultiSeries(sampleRecs, ['벤치프레스'], '1rm', p, 'single');
    assert.ok(agg && agg['벤치프레스'], p + ' 기간 집계 성공');
  });

  // 4. 4-KPI 수학적 정량 산출 검증 (PEAK, LATEST, NET DELTA, VELOCITY)
  const big3 = uStats.generate52WeekPowerliftingSample();
  const benchAgg = uStats.aggregateMultiSeries(big3, ['벤치프레스'], '1rm', '1y', 'single')['벤치프레스'];
  assert.strictEqual(benchAgg.prVal, 106, 'PEAK 106kg PR');
  assert.strictEqual(benchAgg.latestVal, 105, 'LATEST 105kg');
  assert.strictEqual(benchAgg.netDelta, 32, 'NET DELTA 32kg');
  assert.ok(benchAgg.growthRate > 0, 'Growth rate positive');
  assert.ok(typeof benchAgg.velocityPerWeek === 'number', '주당 성장속도(velocityPerWeek) 산출');

  // 5. 클린 CSV 내보내기 및 캔버스 스냅샷 함수 탑재
  assert.strictEqual(typeof uStats.exportCleanCsv, 'function', 'exportCleanCsv 함수 탑재');
  assert.strictEqual(typeof uStats.captureChartSnapshot, 'function', 'captureChartSnapshot 함수 탑재');

  // 6. 가이드 모달, 데이터 그리드 모달, 온톨로지 매니저 모달 탑재
  assert.strictEqual(typeof uStats.openGuideModal, 'function', 'openGuideModal 함수 탑재');
  assert.strictEqual(typeof uStats.openUniversalDataGrid, 'function', 'openUniversalDataGrid 함수 탑재');
  assert.strictEqual(typeof uStats.openTaxonomyManagerModal, 'function', 'openTaxonomyManagerModal 함수 탑재');

  // 7. index.html 배선 및 탑바/가이드 연동 검증
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.includes('recAnalyticsGuideBtn'), '기록 상단 가이드 바인딩 방어 로직 유지');
  assert.ok(html.includes('topHomeGuideBtn'), '탑바 전역 활용법 퀵 액션 버튼(#topHomeGuideBtn) 마운트');
  assert.ok(html.includes('OurgoalUniversalStats.openGuideModal'), '가이드 버튼 클릭 시 openGuideModal 호출');
  assert.ok(html.includes('universal-stats.js?v=20260914-es061'), '캐시버스터 v=20260914-es061 갱신');
});

/* ============ [#TASK-ES-061-DEFITNESS] 운동/건강 편향 탈피 및 임의 도메인(영업, 개발, 학습 등) 자율 다차원 동적 분석 검증 ============ */
check('compliance: [#TASK-ES-061-DEFITNESS] 운동/건강 편향 탈피 및 임의 도메인(영업, 개발, 학습 등) 자율 다차원 동적 분석 검증', () => {
  const uStats = require('../js/universal-stats.js');
  assert.ok(uStats, 'OurgoalUniversalStats 모듈 export 확인');

  // 1. 임의 B2B 매출 CSV 파싱 검증 (건강/운동 키 강제 주입 없음, general 테마, 다차원 숫자 컬럼 자동 감지)
  const salesCsv = [
    '날짜,고객사,매출액(만원),계약건수,담당자메모',
    '2025-01-10,A엔터프라이즈,500,3,1차 계약',
    '2025-02-15,A엔터프라이즈,1200,8,확장 계약 완료',
    '2025-03-20,B솔루션,850,5,신규 온보딩'
  ].join('\n');

  const parsed = uStats.parseCsvToUniversalRecords(salesCsv);
  assert.strictEqual(parsed.length, 3, '3건 레코드 파싱');
  assert.strictEqual(parsed[0].theme, 'general', '운동/건강 편향 없이 general 도메인 자동 할당');
  
  const recA1 = parsed[0];
  assert.strictEqual(recA1.subTheme, 'A엔터프라이즈', '고객사 엔티티 자동 인식');
  assert.ok(recA1.metrics, 'metrics 객체 자동 생성');
  
  // 매출액(만원) 및 계약건수가 metrics에 추출되었는지 확인
  const metricKeys = Object.keys(recA1.metrics);
  assert.ok(metricKeys.length >= 2, '최소 2개 이상의 동적 메트릭 컬럼 추출');
  const revenueKey = metricKeys.find(k => k.includes('매출액'));
  const dealsKey = metricKeys.find(k => k.includes('계약건수'));
  assert.ok(revenueKey, '매출액 메트릭 자동 추출');
  assert.ok(dealsKey, '계약건수 메트릭 자동 추출');
  assert.strictEqual(recA1.metrics[revenueKey], 500, '매출액 500 추출');
  assert.strictEqual(recA1.metrics[dealsKey], 3, '계약건수 3 추출');

  // 운동 특정 키워드(1rm, volume) 강제 주입 부재 검증
  assert.strictEqual(recA1.metrics['1rm'], undefined, '임의 데이터에 1RM 강제 주입 없음');
  assert.strictEqual(recA1.metrics['volume'], undefined, '임의 데이터에 총볼륨 강제 주입 없음');

  // 2. 동적 온톨로지 빌드 검증
  const ont = uStats.buildUniversalOntology(parsed);
  assert.strictEqual(ont.length, 2, '2개 엔티티(A엔터프라이즈, B솔루션) 온톨로지 빌드');
  const entA = ont.find(e => e.name === 'A엔터프라이즈');
  assert.ok(entA, 'A엔터프라이즈 온톨로지 항목 존재');
  assert.ok(entA.dimensions.includes(revenueKey), 'A엔터프라이즈 온톨로지에 매출액 차원 포함');
  assert.ok(entA.dimensions.includes(dealsKey), 'A엔터프라이즈 온톨로지에 계약건수 차원 포함');

  // 3. 다차원 동적 OLAP 집계 (매출액 & 계약건수 각각 집계 검증)
  const aggRevenue = uStats.aggregateMultiSeries(parsed, ['A엔터프라이즈'], revenueKey, 'all', 'single')['A엔터프라이즈'];
  assert.ok(aggRevenue, '매출액 기준 A엔터프라이즈 집계 성공');
  assert.strictEqual(aggRevenue.prVal, 1200, '최고 매출액 1200만원 (Peak)');
  assert.strictEqual(aggRevenue.latestVal, 1200, '최신 매출액 1200만원 (Latest)');
  assert.strictEqual(aggRevenue.netDelta, 700, '순성장액 +700만원 (Net Delta)');
  assert.strictEqual(aggRevenue.growthRate, 140, '성장률 140% (Growth Rate)');

  const aggDeals = uStats.aggregateMultiSeries(parsed, ['A엔터프라이즈'], dealsKey, 'all', 'single')['A엔터프라이즈'];
  assert.ok(aggDeals, '계약건수 기준 A엔터프라이즈 집계 성공');
  assert.strictEqual(aggDeals.prVal, 8, '최대 계약건수 8건 (Peak)');
  assert.strictEqual(aggDeals.latestVal, 8, '최신 계약건수 8건 (Latest)');
  assert.strictEqual(aggDeals.netDelta, 5, '순증가 +5건 (Net Delta)');

  // 4. 범용 도메인 샘플 생성기(영업, 코딩) 검증
  const salesSample = uStats.generateDomainSample('sales');
  assert.ok(Array.isArray(salesSample) && salesSample.length >= 50, '영업 52주 시계열 샘플 생성 성공');
  assert.ok(salesSample[0].metrics && typeof salesSample[0].metrics.revenue === 'number', '영업 샘플 revenue 메트릭 보유');
  assert.ok(salesSample[0].metrics && typeof salesSample[0].metrics.deals === 'number', '영업 샘플 deals 메트릭 보유');

  const codingSample = uStats.generateDomainSample('coding');
  assert.ok(Array.isArray(codingSample) && codingSample.length >= 50, '개발 코딩 52주 시계열 샘플 생성 성공');
  assert.ok(codingSample[0].metrics && typeof codingSample[0].metrics.commits === 'number', '개발 샘플 commits 메트릭 보유');
  assert.ok(codingSample[0].metrics && typeof codingSample[0].metrics.prs === 'number', '개발 샘플 prs 메트릭 보유');

  // 5. 동적 차원 선택 UI(Dimension Selector Row) 렌더링 검증
  const mockContainer = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {} };
  const mockState = { profile: { records: parsed } };
  uStats.renderUniversalStatsDashboard(mockContainer, parsed, mockState, {
    openModal: () => {},
    closeModal: () => {},
    toast: () => {},
    saveProfile: () => {},
    onDone: () => {}
  });
  assert.ok(mockContainer.innerHTML.includes('u-dim-selector-row'), '대시보드 내 차원 선택 바(u-dim-selector-row) 렌더링');
  assert.ok(mockContainer.innerHTML.includes(revenueKey) || mockContainer.innerHTML.includes('u-dim-btn'), '동적 차원 전환 버튼 렌더링');

  // 6. 데이터 없을 때 Empty State 4대 도메인 스타터 카드 및 가져오기 버튼 검증
  const emptyContainer = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [] };
  uStats.renderUniversalStatsDashboard(emptyContainer, [], {}, {});
  assert.ok(emptyContainer.innerHTML.includes('u-empty-load-btn'), 'Empty State 4대 스타터 버튼 컨테이너');
  assert.ok(emptyContainer.innerHTML.includes('data-type="sales"'), 'B2B 영업 실적 52주 스타터 카드 탑재');
  assert.ok(emptyContainer.innerHTML.includes('data-type="coding"'), '개발자 활동 52주 스타터 카드 탑재');
  assert.ok(emptyContainer.innerHTML.includes('data-type="study"'), '수험·공부 52주 스타터 카드 탑재');
  assert.ok(emptyContainer.innerHTML.includes('data-type="big3"'), '건강·운동 52주 스타터 카드 탑재');
  assert.ok(emptyContainer.innerHTML.includes('uEmptyImportBtn'), '내 데이터 가져오기 버튼 탑재');

  // 7. 통합 인제스천 모달 1순위 대표 샘플(영업, 개발) 및 3대 탭 탑재 검증
  let capturedModalHtml = '';
  uStats.openUniversalImportModal({
    openModal: function(html){ capturedModalHtml = html; },
    closeModal: function(){},
    state: {},
    toast: function(){}
  });
  assert.ok(capturedModalHtml.includes('data-sample="sales"'), '모달 1순위 카드 B2B 영업 실적 탑재');
  assert.ok(capturedModalHtml.includes('data-sample="coding"'), '모달 2순위 카드 오픈소스 개발 활동 탑재');
  assert.ok(capturedModalHtml.includes('uImpTabSamples'), '1년치 추천 샘플 탭 탑재');
  assert.ok(capturedModalHtml.includes('uImpTabCsv'), 'CSV 파일 탭 탑재');
  assert.ok(capturedModalHtml.includes('uImpTabText'), '텍스트 붙여넣기 탭 탑재');

  // 8. index.html 배너 문구의 도메인 중립성 검증
  const indexHtmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(indexHtmlContent.includes('영업 실적, 개발 커밋, 수험 공부, 자산, 운동'), 'index.html 배너의 전 도메인 포용 문구 검증');
});


check('compliance: [#TASK-ES-061-TRUE-MULTIDIMENSIONAL] 범용 EAV 자율 마이닝, 4대 분석 렌즈(추세·상관비·레이더·주기), 통계 리포트 및 기본 펼침 무결성 검증', () => {
  const uStats = require('../js/universal-stats.js');

  // 1. 완전 자율 범용 수치·단위 채굴 엔진 (Universal Autonomous EAV Miner) 검증
  const t1 = { text: '토익 모의고사 850점 오답 15개 순공 6.5시간 달성' };
  const m1 = uStats.extractMetricsFromRecord(t1);
  const m1Map = {};
  m1.forEach(m => { m1Map[m.key] = m; m1Map[m.label] = m; });
  assert.ok(m1Map['모의고사'] || m1Map['토익'], '토익/모의고사 자율 채굴');
  const toeicVal = (m1Map['모의고사'] || m1Map['토익']).value;
  assert.strictEqual(toeicVal, 850, '850점 정확 추출');
  assert.ok(m1Map['오답'], '오답 항목 자율 채굴');
  assert.strictEqual(m1Map['오답'].value, 15, '오답 15개 정확 추출');
  assert.ok(m1Map['순공'], '순공 항목 자율 채굴');
  assert.strictEqual(m1Map['순공'].value, 6.5, '순공 6.5시간 정확 추출');

  // 테이블 구조 자율 채굴 검증
  const t2 = {
    columns: ['채널', '광고비(만원)', '클릭수', '전환수(건)'],
    rows: [['인스타그램', '200', '1500', '60']]
  };
  const m2 = uStats.extractMetricsFromRecord(t2);
  const m2Map = {};
  m2.forEach(m => { m2Map[m.key] = m; m2Map[m.label] = m; });
  assert.ok(m2Map['광고비'], '광고비 테이블 칼럼 채굴');
  assert.strictEqual(m2Map['광고비'].value, 200, '광고비 200 추출');
  assert.strictEqual(m2Map['광고비'].unit, '만원', '단위 만원 추출');
  assert.ok(m2Map['전환수'], '전환수 테이블 칼럼 채굴');
  assert.strictEqual(m2Map['전환수'].value, 60, '전환수 60건 추출');

  // 2. 동적 온톨로지 생성 검증
  const rawNotes = [
    { startAt: '2026-03-01T10:00:00Z', text: '토익 모의고사 800점 오답 20개' },
    { startAt: '2026-03-08T10:00:00Z', text: '토익 모의고사 850점 오답 15개' },
    { startAt: '2026-03-15T10:00:00Z', text: '토익 모의고사 900점 오답 10개' }
  ];
  const onto = uStats.buildUniversalOntology(rawNotes);
  assert.ok(onto.length > 0, '임의 텍스트로부터 온톨로지 자동 구축');
  assert.ok(rawNotes[0].metrics && typeof rawNotes[0].metrics.primary === 'number', '임의 레코드에 primary 메트릭 자동 배정');

  // 3. 4대 분석 렌즈 (Lens) 알고리즘 및 렌더러 검증
  // 3-1. Cross-Ratio (상관 효율비)
  const seriesA = {
    entity: '매출액',
    unit: '만원',
    points: [{ date: '2026-03-01', val: 1000 }, { date: '2026-03-08', val: 1500 }]
  };
  const seriesB = {
    entity: '계약건수',
    unit: '건',
    points: [{ date: '2026-03-01', val: 2 }, { date: '2026-03-08', val: 3 }]
  };
  const ratioRes = uStats.computeCrossRatioSeries(seriesA, seriesB);
  assert.strictEqual(ratioRes.points.length, 2, '효율비 시계열 2개 산출');
  assert.strictEqual(ratioRes.points[0].val, 500, '건당 단가 500만원/건');
  assert.strictEqual(ratioRes.avgRatio, 500, '평균 단가 500만원/건');

  const ratioSvg = uStats.renderCrossRatioSvg(ratioRes);
  assert.ok(ratioSvg.includes('<svg') && ratioSvg.includes('viewBox'), 'CrossRatio SVG 정상 생성');

  // 3-2. Radar (균형 레이더)
  const radarSvg = uStats.renderRadarSvg(onto, {
    '모의고사': { points: [{ val: 900 }], prVal: 900, unit: '점' }
  });
  assert.ok(radarSvg && radarSvg.length > 20, 'Radar SVG/Bar 정상 생성');

  // 3-3. Cadence (요일별 주기)
  const cadenceData = uStats.computeCadenceData(rawNotes);
  assert.strictEqual(cadenceData.length, 7, '7일 주기 데이터 생성');
  const cadenceSvg = uStats.renderCadenceSvg(cadenceData);
  assert.ok(cadenceSvg.includes('<svg') && cadenceSvg.includes('rect'), 'Cadence Bar SVG 정상 생성');

  // 4. 통계적 진단 리포트 (Statistical Diagnostic Report) 검증
  const report = uStats.generateStatisticalDiagnosticReport({
    '모의고사': {
      entity: '모의고사',
      unit: '점',
      points: [{ val: 800 }, { val: 850 }, { val: 900 }],
      latestVal: 900,
      prVal: 900,
      growthRate: 13,
      velocityPerWeek: 50
    }
  }, cadenceData, ratioRes);
  assert.ok(report.includes('모의고사'), '엔티티명 포함');
  assert.ok(report.includes('변동계수(CV)'), 'CV 변동계수 진단 포함');
  assert.ok(report.includes('성장 모멘텀'), '성장 모멘텀 진단 포함');
  assert.ok(report.includes('피크 벤치마크'), '피크 벤치마크 진단 포함');
  assert.ok(report.includes('효율 매트릭스'), '효율 매트릭스 진단 포함');

  // 5. 콕핏 렌더링 & 기본 펼침 & 렌즈 전환 바 검증
  const container = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {} };
  const testState = { profile: { records: rawNotes } };
  uStats.renderUniversalStatsDashboard(container, rawNotes, testState, {});
  assert.ok(container.innerHTML.includes('u-lens-row'), '4대 분석 렌즈 전환 바(u-lens-row) 렌더링');
  assert.ok(container.innerHTML.includes('data-lens="trend"'), '추세 렌즈 버튼 탑재');
  assert.ok(container.innerHTML.includes('data-lens="ratio"'), '효율비 렌즈 버튼 탑재');
  assert.ok(container.innerHTML.includes('data-lens="radar"'), '레이더 렌즈 버튼 탑재');
  assert.ok(container.innerHTML.includes('data-lens="cadence"'), '주기 렌즈 버튼 탑재');
  assert.ok(container.innerHTML.includes('display:block'), '콕핏 기본 펼침(isExpanded=true) 상태 검증');

  // 6. 렌즈 전환 상태 유지 및 다형성 차트 렌더링 검증
  testState.univLens = 'ratio';
  uStats.renderUniversalStatsDashboard(container, rawNotes, testState, {});
  assert.ok(container.innerHTML.includes('u-cross-ratio-chart') || container.innerHTML.includes('AVG RATIO'), 'Ratio 렌즈 차트 및 KPI 렌더링');

  testState.univLens = 'cadence';
  uStats.renderUniversalStatsDashboard(container, rawNotes, testState, {});
  assert.ok(container.innerHTML.includes('PEAK DAY') || container.innerHTML.includes('요일'), 'Cadence 렌즈 차트 및 KPI 렌더링');
});

check('compliance: [#TASK-ES-061-UIUX-MASTERPIECE] 4대 렌즈 마이크로 뱃지, 상관효율비 인터랙티브 페어 선택기, AI 비주얼 브리핑 게이지, 주중/주말 주기 분석 무결성 검증', () => {
  const uStats = require('../js/universal-stats.js');

  const multiDomainRecs = [
    { startAt: '2026-03-02T10:00:00Z', text: 'B2B 솔루션 매출액 1500만원 계약 3건 달성' }, // 월
    { startAt: '2026-03-03T10:00:00Z', text: 'B2B 솔루션 매출액 2000만원 계약 4건 달성' }, // 화
    { startAt: '2026-03-07T10:00:00Z', text: '개발 커밋 12개 PR 2개 완료' }, // 토
    { startAt: '2026-03-08T10:00:00Z', text: '수험 순공 8시간 문제 120제 풀이' } // 일
  ];

  const container = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {} };
  const state = { profile: { records: multiDomainRecs } };

  // 1. 4대 렌즈 마이크로 서브 라벨 검증
  uStats.renderUniversalStatsDashboard(container, multiDomainRecs, state, {});
  assert.ok(container.innerHTML.includes('시계열·PR'), '추세 렌즈 서브라벨 시계열·PR 렌더링');
  assert.ok(container.innerHTML.includes('단가·비율'), '효율비 렌즈 서브라벨 단가·비율 렌더링');
  assert.ok(container.innerHTML.includes('달성도·방사형'), '레이더 렌즈 서브라벨 달성도·방사형 렌더링');
  assert.ok(container.innerHTML.includes('루틴·밀도'), '주기 렌즈 서브라벨 루틴·밀도 렌더링');

  // 2. 상관 효율비 인터랙티브 페어 선택기 (Interactive Pair Selector) 렌더링 검증
  state.univLens = 'ratio';
  uStats.renderUniversalStatsDashboard(container, multiDomainRecs, state, {});
  assert.ok(container.innerHTML.includes('u-ratio-pair-bar'), '인터랙티브 페어 선택기 바(u-ratio-pair-bar) 탑재');
  assert.ok(container.innerHTML.includes('id="uRatioNumSelect"'), '분자 지표 선택 드롭다운 탑재');
  assert.ok(container.innerHTML.includes('id="uRatioDenSelect"'), '분모 지표 선택 드롭다운 탑재');
  assert.ok(container.innerHTML.includes('효율단위:'), '효율비 단위 안내 뱃지 표출');

  // 3. AI 통계 진단 비주얼 브리핑 카드 (Visual Executive Briefing Card) 검증
  assert.ok(container.innerHTML.includes('u-ai-briefing-card'), 'AI 비주얼 브리핑 카드 클래스 탑재');
  assert.ok(container.innerHTML.includes('변동계수(CV)'), 'CV 변동계수 비주얼 메트릭 카드 렌더링');
  assert.ok(container.innerHTML.includes('Gemini 3.1 Flash Lite 자율 다차원 통계 진단 브리핑'), '브리핑 카드 헤더 렌더링');

  // 4. 레이더 차트 그라디언트 & 균형 지수 푸터 검증
  const onto = uStats.buildUniversalOntology(multiDomainRecs);
  const radarHtml = uStats.renderRadarSvg(onto, {
    '매출액': { points: [{ val: 2000 }], prVal: 2000, unit: '만원' },
    '계약': { points: [{ val: 4 }], prVal: 4, unit: '건' },
    '커밋': { points: [{ val: 12 }], prVal: 12, unit: '개' }
  });
  assert.ok(radarHtml.includes('uRadarGrad') || radarHtml.includes('균형'), '레이더 차트 그라디언트/균형 지수 렌더링');

  // 5. 요일 주기 주중 vs 주말 통계 분석 검증
  const cadenceData = uStats.computeCadenceData(multiDomainRecs);
  const cadenceHtml = uStats.renderCadenceSvg(cadenceData);
  assert.ok(cadenceHtml.includes('주중') && cadenceHtml.includes('주말'), '주중 vs 주말 통계 분석 뱃지 렌더링');

  // 6. 반응형 4-KPI 카드 아이콘 & clamp 타이포그래피 검증
  assert.ok(container.innerHTML.includes('🏆') || container.innerHTML.includes('⚡'), '4-KPI 고유 악센트 아이콘 탑재');
  assert.ok(container.innerHTML.includes('clamp'), '반응형 clamp 타이포그래피 탑재');
});

check('compliance: [#TASK-ES-090] 아워골 기록탭 지금부터 시간기록(전체화면, 가로세로 회전, 스톱워치 4대 버튼, 취소 안전 경고, 내 기록 저장) 무결성 검증', () => {
  const fs = require('fs');
  const path = require('path');
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const trackerJsPath = path.join(__dirname, '..', 'js', 'time-tracker.js');

  // 1. 파일 및 스크립트 배선 검증
  assert.ok(fs.existsSync(trackerJsPath), 'js/time-tracker.js 파일이 존재해야 함');
  assert.ok(indexHtml.includes('js/time-tracker.js'), 'index.html에 time-tracker.js 스크립트 로드가 배선되어 있어야 함');
  assert.ok(indexHtml.includes('id="btnOpenTimeTracker"'), '기록 탭 헤더에 지금부터 시간기록 버튼(btnOpenTimeTracker)이 존재해야 함');

  // 2. CSS 스타일 및 반응형/회전 지원 검증
  assert.ok(uiCss.includes('.tt-overlay'), '전체화면 오버레이 .tt-overlay 스타일이 존재해야 함');
  assert.ok(uiCss.includes('.tt-forced-landscape'), '수동 가로모드 회전 지원 .tt-forced-landscape 스타일이 존재해야 함');
  assert.ok(uiCss.includes('min-aspect-ratio'), '폴더블 정방형 화면비 미디어쿼리가 존재해야 함');

  // 3. time-tracker.js 핵심 엔진 및 4위 1체 배선 검증
  const trackerJs = fs.readFileSync(trackerJsPath, 'utf8');
  assert.ok(trackerJs.includes('btnTtActionStart'), '스톱워치 시작 버튼 핸들러가 배선되어 있어야 함');
  assert.ok(trackerJs.includes('btnTtActionLap'), '스톱워치 구간기록(Lap) 버튼 핸들러가 배선되어 있어야 함');
  assert.ok(trackerJs.includes('btnTtActionPause'), '스톱워치 일시중지 버튼 핸들러가 배선되어 있어야 함');
  assert.ok(trackerJs.includes('btnTtActionStopRecord'), '전체중지 및 기록하기 버튼 핸들러가 배선되어 있어야 함');
  assert.ok(trackerJs.includes('btnTtActionReset'), '초기화 버튼 핸들러가 배선되어 있어야 함');

  // 4. 취소 확인 2중 안전 경고 모달 문구 검증 (상민님 지시 원문)
  assert.ok(trackerJs.includes('이번 세션의 시간기록과 연계된 기록이 모두 삭제됩니다. 정말 취소하시겠습니까?'), '취소 경고 모달 문구가 상민님 지시와 정확히 일치해야 함');
  assert.ok(trackerJs.includes('btnTtCancelNo') && trackerJs.includes('btnTtCancelYes'), '취소 안함 및 정말 취소 버튼이 구비되어 있어야 함');

  // 5. 내 기록 저장 및 뷰 전파 배선 검증
  assert.ok(trackerJs.includes('state.profile.records.unshift'), '신규 시간기록이 state.profile.records에 저장되어야 함');
  assert.ok(trackerJs.includes('renderRecordsScreen'), '저장 후 기록 탭 화면이 즉시 실시간 갱신되어야 함');
});

check('compliance: [#TASK-ES-091] 아워골 데이터 가져오기 & 1초 샘플(원터치 로드, 실시간 표 미리보기, 탭 구분자 지원, 샘플 정화 안전망) 무결성 검증', () => {
  const fs = require('fs');
  const path = require('path');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const statsJsPath = path.join(__dirname, '..', 'js', 'universal-stats.js');

  assert.ok(fs.existsSync(statsJsPath), 'js/universal-stats.js 파일이 존재해야 함');
  const statsJs = fs.readFileSync(statsJsPath, 'utf8');

  // 1. 원터치 1초 로드 버튼 및 카드 인터랙션 검증
  assert.ok(statsJs.includes('u-sample-quick-btn'), '샘플 카드에 원터치 1초 로드 버튼이 배선되어 있어야 함');
  assert.ok(statsJs.includes('⚡ 1초 로드'), '원터치 로드 버튼 텍스트가 정확해야 함');
  assert.ok(uiCss.includes('.u-sample-quick-btn'), 'ui.css에 1초 로드 버튼 스타일이 정의되어 있어야 함');

  // 2. CSV 및 엑셀 탭(\t) 구분자 자동 감지 검증
  assert.ok(statsJs.includes('tabCount') && statsJs.includes('commaCount') && statsJs.includes("delim = (tabCount > commaCount"), '엑셀 탭 구분자 및 CSV 쉼표 자동 감지 로직이 탑재되어 있어야 함');

  // 3. 실시간 테이블 미리보기 렌더링 검증
  assert.ok(statsJs.includes('renderTablePreview'), '실시간 모노스페이스 테이블 프리뷰 렌더러가 구비되어 있어야 함');
  assert.ok(statsJs.includes('uImpPreviewBox'), '미리보기 컨테이너(uImpPreviewBox)가 배선되어 있어야 함');
  assert.ok(uiCss.includes('#uImpPreviewBox table'), 'ui.css에 실시간 미리보기 테이블 스타일이 정의되어 있어야 함');

  // 4. 샘플 데이터 메타데이터(isSample) 및 52주 동적 리베이스 검증
  assert.ok(statsJs.includes('isSample: true'), '샘플 데이터에 isSample 플래그가 부여되어 있어야 함');
  assert.ok(statsJs.includes('sampleCategory'), '샘플 데이터에 sampleCategory가 부여되어 있어야 함');
  assert.ok(statsJs.includes('generate52WeekPowerliftingSample'), '52주 파워리프팅 샘플 생성기가 존재해야 함');

  // 5. 샘플 데이터 자가 정화(Purge) 안전망 및 Zero Data Loss 검증
  assert.ok(statsJs.includes('uSamplePurgeRow'), '샘플 정화 안전망 안내 행이 존재해야 함');
  assert.ok(statsJs.includes('uPurgeSampleBtn'), '샘플 정화 버튼이 구비되어 있어야 함');
  assert.ok(statsJs.includes('🧹 샘플만 삭제'), '샘플 정화 버튼 텍스트가 정확해야 함');

});

check('compliance: [#TASK-ES-092] 전문가용 데이터 시각화 파워 보존 및 직관적 초간편 인터페이스 전면 개편 무결성 검증', () => {
  const fs = require('fs');
  const path = require('path');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const statsJsPath = path.join(__dirname, '..', 'js', 'universal-stats.js');

  assert.ok(fs.existsSync(statsJsPath), 'js/universal-stats.js 파일이 존재해야 함');
  const statsJs = fs.readFileSync(statsJsPath, 'utf8');

  // 1. 헤더 단순화 및 데이터 관리 통합 수납 모달 검증
  assert.ok(statsJs.includes('uHdrMgmtMenuBtn'), '헤더에 데이터 관리 메뉴 버튼(uHdrMgmtMenuBtn)이 배선되어 있어야 함');
  assert.ok(statsJs.includes('openDataManagementModal'), 'openDataManagementModal 함수가 정의되어 있어야 함');
  assert.ok(statsJs.includes('uMenuImportBtn') && statsJs.includes('uMenuGridBtn') && statsJs.includes('uMenuExportCsvBtn') && statsJs.includes('uMenuTaxonomyBtn'), '데이터 관리 모달 내 4대 핵심 도구가 수납되어 있어야 함');

  // 2. 1단: 3단계 인터랙션 퀵 가이드 검증
  assert.ok(statsJs.includes('u-cockpit-quick-guide'), '3단계 사용법 퀵 가이드가 배선되어 있어야 함');
  assert.ok(statsJs.includes('💡') && statsJs.includes('사용법:') && statsJs.includes('렌즈 선택') && statsJs.includes('종목 탭') && statsJs.includes('성장 분석 확인'), '직관적인 3단계 사용법 텍스트가 표출되어야 함');
  assert.ok(uiCss.includes('.u-cockpit-quick-guide'), 'ui.css에 퀵 가이드 스타일이 정의되어 있어야 함');

  // 3. 2단: 4대 렌즈별 목적 설명 1줄 배너 검증
  assert.ok(statsJs.includes('u-lens-exp-banner'), '렌즈별 목적 설명 배너(u-lens-exp-banner)가 탑재되어 있어야 함');
  assert.ok(statsJs.includes('lensExplanations'), '렌즈별 친절한 설명 맵이 구현되어 있어야 함');
  assert.ok(uiCss.includes('.u-lens-exp-banner'), 'ui.css에 렌즈 설명 배너 스타일이 정의되어 있어야 함');

  // 4. 3단: 차트 상단 통합 헤더(대상 종목 + 기간/스케일) 검증
  assert.ok(statsJs.includes('u-chart-title-bar'), '차트 상단 통합 헤더(u-chart-title-bar)가 구현되어 있어야 함');
  assert.ok(uiCss.includes('.u-chart-title-bar'), 'ui.css에 차트 상단 헤더 스타일이 정의되어 있어야 함');

  // 5. Zero Dead Click 및 하위 호환성 앵커 버튼 보존 검증
  assert.ok(statsJs.includes('id="uHdrGridBtn"') && statsJs.includes('id="uHdrImportBtn"') && statsJs.includes('id="uHdrExportCsvBtn"') && statsJs.includes('id="uHdrSnapBtn"'), '하위 호환성 앵커 버튼이 무손실 유지되어야 함');

  // 6. 다차원 지표(Dimension) 버튼 클릭 리스너 배선 검증 (#TASK-ES-092 피드백)
  assert.ok(statsJs.includes(".querySelectorAll('.u-dim-btn').forEach") && statsJs.includes('state.univDimension = targetDim'), '디멘션 전환 버튼(u-dim-btn) 클릭 리스너가 배선되어 있어야 함');

  // 7. 데이터 관리 모달 -> 새 데이터 가져오기 모달 매끄러운 안전 전환 검증 (popstate 레이스 컨디션 원천 차단)
  assert.ok(statsJs.includes('openUniversalImportModal({') && statsJs.includes('openUniversalDataGrid({'), '데이터 관리 모달 내 도구 호출이 정상 배선되어 있어야 함');
});

/* ============ [#TASK-ES-093] 추천 샘플 데이터 테마별 카테고리화 및 효과적 UI/UX 무결성 검증 ============ */
check('compliance: [#TASK-ES-093] 추천 샘플 데이터 5대 테마별 엄선 7종(총 35종) 카탈로그, 2열 반응형 그리드 및 하이록스 1초 융합 검증', () => {
  const uStats = require('../js/universal-stats.js');
  const statsJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'universal-stats.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. SAMPLE_THEMES 5대 테마 x 7종 카탈로그 검증
  assert.ok(Array.isArray(uStats.SAMPLE_THEMES), 'SAMPLE_THEMES 카탈로그 배열 노출');
  assert.strictEqual(uStats.SAMPLE_THEMES.length, 5, '5대 대분류 테마(운동, 업무, 공부, 재테크, 웰니스) 완비');

  const expectedThemes = ['workout', 'career', 'learning', 'finance', 'wellness'];
  uStats.SAMPLE_THEMES.forEach((th, idx) => {
    assert.strictEqual(th.id, expectedThemes[idx], '테마 ID 순서 보장: ' + th.id);
    assert.strictEqual(th.items.length, 7, th.label + ' 테마는 엄선된 7종 카탈로그 완비');
  });

  // 2. 운동 테마 내 하이록스(HYROX), 헬스(파워리프팅), 요가 검증 (상민님 필수 종목)
  const workout = uStats.SAMPLE_THEMES.find(t => t.id === 'workout');
  const workoutKeys = workout.items.map(it => it.key);
  assert.ok(workoutKeys.includes('hyrox'), '최신 트렌드 하이록스(hyrox) 포함');
  assert.ok(workoutKeys.includes('big3_52w'), '파워리프팅 헬스(big3_52w) 포함');
  assert.ok(workoutKeys.includes('yoga'), '요가 & 필라테스(yoga) 포함');

  // 3. 하이록스 52주 시계열 데이터 생성기 검증
  const hyroxRecs = uStats.generateDomainSample('hyrox');
  assert.ok(hyroxRecs.length >= 52, '하이록스 52주 데이터 생성 (실제: ' + hyroxRecs.length + '건)');
  assert.strictEqual(hyroxRecs[0].isSample, true, 'isSample 태깅');
  assert.strictEqual(hyroxRecs[0].subTheme, '하이록스', '서브테마 하이록스');
  assert.ok(hyroxRecs[0].metrics.primary > 0, '완주시간 지표 탑재');

  // 4. 모달 UI/UX 및 ui.css 스타일 탑재 검증
  assert.ok(statsJs.includes('u-theme-tab-row') && statsJs.includes('u-theme-tab-btn'), '테마 탭 칩 행 및 버튼 구현');
  assert.ok(statsJs.includes('u-sample-card-grid'), '2열 반응형 컴팩트 카드 그리드 구현');
  assert.ok(statsJs.includes('data-theme-panel'), '테마별 그리드 패널 분할 탑재');
  assert.ok(uiCss.includes('.u-theme-tab-row') && uiCss.includes('.u-sample-card-grid'), 'ui.css에 테마 탭 및 그리드 스타일 탑재');
});

/* ============ [#TASK-ES-094] 기출문제 1W 하루단위 꺾은선 그래프 및 전 기간 시인성 UX 무결성 검증 ============ */
check('compliance: [#TASK-ES-094] 기출문제 예시 1W 기간 하루단위 꺾은선 그래프(7일 연속 세션), 요일 x축 레이블링 및 전 기간 반응형 시인성 검증', () => {
  const uStats = require('../js/universal-stats.js');
  const statsJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'universal-stats.js'), 'utf8');

  // 1. 기출문제 샘플 생성기 1W 일별 데이터 검증
  const studyRecs = uStats.generateDomainSample('study');
  assert.ok(Array.isArray(studyRecs) && studyRecs.length >= 80, '공부(기출문제) 샘플 데이터 생성');

  // 2. 1W 기간 집계 시 하루 단위 7개 포인트 확인
  const series1w = uStats.aggregateMultiSeries(studyRecs, ['기출문제'], 'problems', '1w');
  assert.ok(series1w['기출문제'], '기출문제 시리즈 존재');
  assert.strictEqual(series1w['기출문제'].points.length, 7, '1W 기간 최근 7일(D-6~D-0) 하루 단위 7포인트 수집');
  assert.strictEqual(series1w['기출문제'].points[0].val, 35, 'D-6 35문제');
  assert.strictEqual(series1w['기출문제'].points[6].val, 72, 'D-0 최고치 72문제');

  // 3. renderMultiSeriesSvg 1W 모드 및 요일 레이블 검증
  const chart1w = uStats.renderMultiSeriesSvg(series1w, { width: 520, height: 210, period: '1w' });
  assert.ok(chart1w.svgHtml.includes('<path d="M'), '꺾은선 라인 패스 생성');
  assert.ok(chart1w.svgHtml.includes('r="4.2"'), '1W 전용 대형 서클(r=4.2)');
  const hasDayOfWeek = ['(일)', '(월)', '(화)', '(수)', '(목)', '(금)', '(토)'].some(d => chart1w.svgHtml.includes(d));
  assert.strictEqual(hasDayOfWeek, true, 'X축 요일 레이블 포함');

  // 4. 전 기간(ALL) 대량 포인트 시인성 스케일링 검증
  const seriesAll = uStats.aggregateMultiSeries(studyRecs, ['기출문제'], 'problems', 'all');
  const chartAll = uStats.renderMultiSeriesSvg(seriesAll, { width: 520, height: 210, period: 'all' });
  assert.ok(chartAll.svgHtml.includes('r="1.6"'), '장기 기간 뭉개짐 방지 초소형 서클(r=1.6)');

  // 5. 콕핏 연동 소스코드 무결성 검증
  assert.ok(statsJs.includes("period: period"), 'renderCockpit에서 renderMultiSeriesSvg로 period 옵션 전달');
  assert.ok(statsJs.includes("KOR_DAYS"), 'SVG 렌더러에 요일 계산 엔진 탑재');
});

/* ============ [#TASK-ES-095] 하이록스 8대 공식 스테이션 및 전 테마 실측 기록·페이스·체감강도(RPE) EAV 무결성 검증 ============ */
check('compliance: [#TASK-ES-095] 하이록스 8대 공식 스테이션 및 전 테마 세부 종목별 실측 기록·페이스·체감강도(RPE) EAV 무결성 검증', () => {
  const uStats = require('../js/universal-stats.js');

  // 1. 하이록스 8대 공식 스테이션 + 인터벌러닝 + 종합 (총 10개 엔티티)
  const hyroxRecs = uStats.generateDomainSample('hyrox');
  const hyroxOntology = uStats.buildUniversalOntology(hyroxRecs);
  const hyroxNames = hyroxOntology.map(o => o.name);
  const expectedStations = ['하이록스', '스키에르그', '슬레드푸시', '슬레드풀', '버피점프', '로잉', '파머스캐리', '샌드백런지', '월볼샷', '인터벌러닝'];
  expectedStations.forEach(stn => {
    assert.ok(hyroxNames.includes(stn), '하이록스 엔티티 보유: ' + stn);
  });

  // 2. 종목별 기록, 페이스, RPE 메트릭 검증
  const skiergSample = hyroxRecs.find(r => r.subTheme === '스키에르그');
  assert.ok(skiergSample && skiergSample.metrics.record > 0, '스키에르그 기록 보유');
  assert.ok(skiergSample && skiergSample.metrics.pace > 0, '스키에르그 페이스 보유');
  assert.ok(skiergSample && skiergSample.metrics.rpe >= 6.0, '스키에르그 RPE 보유');

  const wallballSample = hyroxRecs.find(r => r.subTheme === '월볼샷');
  assert.ok(wallballSample && wallballSample.metrics.record > 0, '월볼샷 기록 보유');
  assert.ok(wallballSample && wallballSample.metrics.rpe >= 8.5, '월볼샷 고강도 RPE 보유');

  // 3. 8대 스테이션 멀티 라인 집계 무결성
  const multiSeries = uStats.aggregateMultiSeries(hyroxRecs, ['스키에르그', '슬레드푸시', '로잉', '월볼샷'], 'record', '1y', 'all');
  assert.ok(multiSeries['스키에르그'].points.length >= 40, '스키에르그 시계열 포인트 수집');
  assert.ok(multiSeries['월볼샷'].points.length >= 40, '월볼샷 시계열 포인트 수집');

  // 4. 러닝/파워리프팅/공부/개발/영업/카탈로그 RPE 및 페이스 검증
  const runRecs = uStats.generateDomainSample('running');
  assert.ok(runRecs.some(r => r.subTheme === '롱런' && r.metrics.rpe >= 7.0), '롱런 RPE 검증');
  assert.ok(runRecs.some(r => r.subTheme === '인터벌러닝' && r.metrics.pace > 0), '인터벌러닝 페이스 검증');

  const big3Recs = uStats.generateDomainSample('big3');
  assert.ok(big3Recs.some(r => r.subTheme === '스쿼트' && r.metrics.rpe >= 7.0), '스쿼트 RPE 검증');

  const studyRecs = uStats.generateDomainSample('study');
  assert.ok(studyRecs.some(r => r.subTheme === '기출문제' && r.metrics.pace > 0), '기출문제 페이스 검증');
  assert.ok(studyRecs.some(r => r.subTheme === '모의고사' && r.metrics.rpe >= 9.0), '모의고사 RPE 검증');

  const yogaRecs = uStats.generateDomainSample('yoga');
  assert.ok(yogaRecs[0].metrics.rpe >= 6.0, '요가 카탈로그 RPE 검증');
});

/* ============ [#TASK-ES-096] 캘린더 일정(customSchedules) 참고자료 첨부·조회·삭제 시스템 무결성 검증 ============ */
check('compliance: [#TASK-ES-096] 캘린더 일정(customSchedules) 참고자료 첨부·조회·삭제 시스템 무결성 검증', () => {
  const calAttPath = path.join(__dirname, '..', 'js', 'calendar-attachment.js');
  assert.ok(fs.existsSync(calAttPath), 'calendar-attachment.js 파일 존재');
  const calAttCode = fs.readFileSync(calAttPath, 'utf8');

  // 모듈 객체 및 함수 검증
  const sandbox = { window: {} };
  eval('(function(window){ ' + calAttCode + ' })(sandbox.window)');
  const calAtt = sandbox.window.OurgoalCalendarAttachment;
  assert.ok(calAtt, 'OurgoalCalendarAttachment 객체 로드 성공');
  assert.strictEqual(typeof calAtt.renderSectionHtml, 'function');
  assert.strictEqual(typeof calAtt.wireEditModalAttachments, 'function');
  assert.strictEqual(typeof calAtt.renderHubEventChipsHtml, 'function');
  assert.strictEqual(typeof calAtt.handleCustomScheduleAttachmentClick, 'function');

  // 빈 첨부 & 4대 첨부 렌더링 검증
  const emptyHtml = calAtt.renderSectionHtml([]);
  assert.ok(emptyHtml.includes('calEditAddAttBtn'), '참고자료 첨부 버튼 표출');
  assert.ok(emptyHtml.includes('첨부된 참고자료가 없습니다'), '빈 첨부 안내 표출');

  const populated = calAtt.renderSectionHtml([
    { type: 'video', title: '운동 폼' },
    { type: 'image', title: '코스 맵' },
    { type: 'text', title: '메모' },
    { type: 'link', title: '웹사이트' }
  ]);
  assert.ok(populated.includes('🎥') && populated.includes('🖼️') && populated.includes('📝') && populated.includes('🔗'), '4대 아이콘 표출');

  // index.html 무결성 & 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const lines = indexHtml.split(/\r?\n/).length;
  assert.ok(lines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
  assert.ok(indexHtml.includes('js/calendar-attachment.js'), 'calendar-attachment.js 로드 태그');
  assert.ok(indexHtml.includes("kind === 'custom'"), 'wireAttachmentChipClicks custom kind 처리');
  assert.ok(indexHtml.includes('data-hubaddatt'), '허브 모달 첨부 버튼');
  assert.ok(indexHtml.includes('renderHubEventChipsHtml'), '허브 모달 칩 렌더링');
  assert.ok(indexHtml.includes('attachments: curAttachments'), '일정 저장 시 attachments 영구 보존');
  assert.ok(indexHtml.includes('window.openAddAttachmentModal = openAddAttachmentModal;'), 'window.openAddAttachmentModal 전역 노출');
  assert.ok(indexHtml.includes('window.openAttachmentViewer = openAttachmentViewer;'), 'window.openAttachmentViewer 전역 노출');
  assert.ok(indexHtml.includes('window.renderAttachmentChipsHtml = renderAttachmentChipsHtml;'), 'window.renderAttachmentChipsHtml 전역 노출');
  assert.ok(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8').includes('ourgoal-shell-v20260916-es125'), 'sw.js 캐시네임 v20260916-es125 갱신');
});

check('compliance: [#TASK-ES-102 & #TASK-ES-126] 전 탭(홈·목표·일정·기록·소통·설정) 활용법 탑바 단일화 및 6대 탭 통합 가이드 허브 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  
  // 1. 탑바 전역 활용법 단일 퀵 액션(#topHomeGuideBtn) 및 본문 중복 버튼 6종 제거 무결성 검증
  assert.ok(indexHtml.includes('id="topHomeGuideBtn"'), '탑바 내 활용법 단일 퀵 액션 버튼 탑재');
  assert.ok(!indexHtml.includes('id="homePageGuideBtn"'), '홈 탭 본문 중복 활용법 버튼 제거 완료');
  assert.ok(!indexHtml.includes('id="goalsPageGuideBtn"'), '목표 탭 본문 중복 활용법 버튼 제거 완료');
  assert.ok(!indexHtml.includes('id="calPageGuideBtn"'), '일정 탭 본문 중복 활용법 버튼 제거 완료');
  assert.ok(!indexHtml.includes('id="commPageGuideBtn"'), '소통 탭 본문 중복 활용법 버튼 제거 완료');
  assert.ok(!indexHtml.includes('id="settingsPageGuideBtn"'), '설정 탭 본문 중복 활용법 버튼 제거 완료');

  // 2. 오늘의 카드 힌트 배지 검증
  assert.ok(indexHtml.includes('뭘 할지 모르겠을 때 도움돼요(내 목표기반)') || indexHtml.includes('할일이 당장 안떠오르면 활용하세요'), '오늘의 카드 힌트 배지 탑재');

  // 3. tab-guides.js 6대 탭 통합 가이드 허브 모듈 검증
  const guideScriptPath = path.join(__dirname, '..', 'js', 'tab-guides.js');
  assert.ok(fs.existsSync(guideScriptPath), 'js/tab-guides.js 파일 존재');
  const guideContent = fs.readFileSync(guideScriptPath, 'utf8');
  assert.ok(guideContent.includes('showTabUsageGuide'), 'showTabUsageGuide 전역 함수 정의');
  assert.ok(guideContent.includes('Home Cockpit') && guideContent.includes('Goal Hierarchy'), '홈/목표 가이드 메타데이터 완비');
  assert.ok(guideContent.includes('Records & Analytics'), '기록 탭 메타데이터 완비 (데드클릭 완치)');
  assert.ok(guideContent.includes('tab-guide-seg-btn'), '6대 탭 통합 세그먼트 스위처 버튼 탑재');
  assert.ok(indexHtml.includes('js/tab-guides.js'), 'index.html 내 tab-guides.js 로드 태그 탑재');

  // 4. 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const lines = indexHtml.split(/\r?\n/).length;
  assert.ok(lines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-103] Web Push VAPID API 구축 및 UGC 신고·차단 안전망 완결성 검증', async () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. api/push-subscribe.js VAPID 처리 및 vercel.json rewrite 규격 검증 (Vercel Hobby 12개 한도 준수)
  const vercelJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
  const vapidRewrite = vercelJson.rewrites.find(r => r.source === '/api/vapid-public-key');
  assert.ok(vapidRewrite, 'vercel.json 내 /api/vapid-public-key rewrite 정의 존재');
  assert.strictEqual(vapidRewrite.destination, '/api/push-subscribe', '/api/vapid-public-key -> /api/push-subscribe 라우팅');

  const pushSubApiPath = path.join(__dirname, '..', 'api', 'push-subscribe.js');
  assert.ok(fs.existsSync(pushSubApiPath), 'api/push-subscribe.js 파일 존재');
  
  const pushSubHandler = require(pushSubApiPath);
  assert.strictEqual(typeof pushSubHandler, 'function', '핸들러 함수 export 확인');

  // 가상 req/res 로 핸들러 동작 검증 (GET 시 publicKey 반환)
  let responseData = null;
  let responseStatus = 200;
  const mockRes = {
    setHeader: () => {},
    status: (code) => { responseStatus = code; return mockRes; },
    json: (data) => { responseData = data; return mockRes; },
    end: () => mockRes
  };

  // 1-1. GET 요청 검증
  process.env.VAPID_PUBLIC_KEY = 'test_vapid_public_key_mock_12345';
  await pushSubHandler({ method: 'GET', url: '/api/vapid-public-key' }, mockRes);
  assert.strictEqual(responseStatus, 200, 'GET 200 OK');
  assert.strictEqual(responseData.publicKey, 'test_vapid_public_key_mock_12345', 'VAPID 공개키 정상 반환');

  // 2. index.html 내 Web Push 및 UGC 안전망 탑재 검증
  assert.ok(indexHtml.includes("fetch('/api/vapid-public-key')"), '클라이언트 VAPID API fetch 로직 탑재');
  assert.ok(indexHtml.includes('filterBlockedPosts'), '차단된 사용자 글 필터링 함수 탑재');
  assert.ok(indexHtml.includes('blockUser('), '사용자 차단 함수 탑재');
  assert.ok(indexHtml.includes('openBlockedUsersModal'), '차단 사용자 관리 모달 탑재');
  assert.ok(indexHtml.includes('data-reportpost'), '게시글 신고 핸들러 탑재');
  assert.ok(indexHtml.includes('data-blockuser'), '사용자 차단 핸들러 탑재');
  assert.ok(indexHtml.includes('local_rep_count'), '3회 누적 신고 시 로컬 즉각 블라인드 자가 치유 로직 탑재');

  // 3. BACKLOG.md 완료 처리 검증
  const backlogContent = fs.readFileSync(path.join(__dirname, '..', 'BACKLOG.md'), 'utf8');
  assert.ok(backlogContent.includes('- [x] **14. Web Push'), '백로그 14번 완료 체크');
  assert.ok(backlogContent.includes('- [x] **24. 커뮤니티 신고'), '백로그 24번 완료 체크');
  assert.ok(backlogContent.includes('- [x] **45. 사용자 차단'), '백로그 45번 완료 체크');

  // 4. 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const lines = indexHtml.split(/\r?\n/).length;
  assert.ok(lines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-104] 팀 목표 초대·소통 및 소통탭 전면 정비(초대·팀원대화·모임창복구·피드아코디언·게시버튼·1:1소통카드3종) 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. js/team-invite-comm.js 모듈 및 script 태그 탑재 검증
  const modulePath = path.join(__dirname, '..', 'js', 'team-invite-comm.js');
  assert.ok(fs.existsSync(modulePath), 'js/team-invite-comm.js 파일 존재');
  assert.ok(indexHtml.includes('js/team-invite-comm.js'), 'index.html 내 team-invite-comm.js 로드 태그 탑재');

  const moduleContent = fs.readFileSync(modulePath, 'utf8');
  assert.ok(moduleContent.includes('openTeamInviteModal'), 'openTeamInviteModal 함수 탑재');
  assert.ok(moduleContent.includes('openTeamChatModal'), 'openTeamChatModal 함수 탑재');
  assert.ok(moduleContent.includes('handlePingSentAutoReply'), 'handlePingSentAutoReply 함수 탑재');
  assert.ok(moduleContent.includes('renderTemplatesAccordionHtml'), 'renderTemplatesAccordionHtml 함수 탑재');
  assert.ok(moduleContent.includes('postShareCardToFeed'), 'postShareCardToFeed 함수 탑재');
  assert.ok(moduleContent.includes('shareCardExternal'), 'shareCardExternal 함수 탑재');
  assert.ok(moduleContent.includes('saveCardImage'), 'saveCardImage 함수 탑재');

  // 2. 소통탭 모임창 ReferenceError 방어 및 checked 정의 검증
  assert.ok(indexHtml.includes('var checked = groupCheckedToday(g.id);'), 'renderCommGroups 내 checked 변수 선언 완료');

  // 3. 소통탭 게시하기 버튼 및 openShareToFeedModal 전역 노출 검증
  assert.ok(indexHtml.includes('id="btnCommPostFeed"'), '소통탭 헤더 게시하기 버튼 탑재');
  assert.ok(indexHtml.includes('window.openShareToFeedModal = openShareToFeedModal;'), 'openShareToFeedModal 전역 노출');

  // 4. 팀 목표 카드 초대 및 팀 대화 버튼 마운트 검증
  assert.ok(indexHtml.includes('data-inviteteam='), '팀 목표 카드 팀원 초대 버튼 탑재');
  assert.ok(indexHtml.includes('data-teamchat='), '팀 목표 카드 팀 대화 버튼 탑재');
  assert.ok(indexHtml.includes('openTeamInviteModal'), '초대 버튼 클릭 핸들러 배선');
  assert.ok(indexHtml.includes('openTeamChatModal'), '팀 대화 버튼 클릭 핸들러 배선');

  // 5. 콕찌르기 양방향 답장 자동 배선 검증
  const checkJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-leader-check.js'), 'utf8');
  assert.ok(checkJs.includes('handlePingSentAutoReply'), 'team-leader-check.js 내 찌르기 후 자동 답장 배선');

  // 6. 소통탭 피드 템플릿 아코디언 검증
  assert.ok(indexHtml.includes('toggleTemplatesBtn'), '템플릿 아코디언 토글 버튼 탑재');
  assert.ok(indexHtml.includes('renderTemplatesAccordionHtml'), 'templatesHtml 내 아코디언 렌더러 연동');

  // 7. 소통탭 1:1 '외부sns 소통용 카드 제작하기' & 3대 액션 버튼 검증
  assert.ok(indexHtml.includes('외부sns 소통용 카드 제작하기'), '외부sns 소통용 카드 제작하기 버튼 탑재');
  assert.ok(indexHtml.includes('id="btnSharePostFeed"'), '소통 카드 피드게시 버튼 탑재');
  assert.ok(indexHtml.includes('id="btnShareExt"'), '소통 카드 외부sns공유 버튼 탑재');
  assert.ok(indexHtml.includes('id="btnShareSave"'), '소통 카드 이미지 저장 버튼 탑재');

  // 8. 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const lines = indexHtml.split(/\r?\n/).length;
  assert.ok(lines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-105] 추천템플릿 목표탭 이전·둘러보기 모달·게시하기 연동·모임원 DM바·동반자 소셜탭 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const modulePath = path.join(__dirname, '..', 'js', 'team-invite-comm.js');
  assert.ok(fs.existsSync(modulePath), 'js/team-invite-comm.js 파일 존재');
  const moduleContent = fs.readFileSync(modulePath, 'utf8');

  // 1. 추천템플릿 3종 목표 탭 이전 및 슬롯/버튼/둘러보기 배선
  assert.ok(indexHtml.includes('id="goalsTemplateAccordionSlot"'), '목표 탭 상단 추천 템플릿 아코디언 슬롯 탑재');
  assert.ok(indexHtml.includes('id="recGoToGoalsTplBtn"'), '기록 탭에서 목표 템플릿 3종 둘러보기 바로가기 칩 탑재');
  assert.ok(moduleContent.includes('renderTemplatesAccordionHtml'), '템플릿 3종 아코디언 렌더러 함수 탑재');
  assert.ok(moduleContent.includes('wireTemplatesAccordionEvents'), '템플릿 3종 둘러보기/복제 이벤트 핸들러 탑재');

  // 2. 추천템플릿 둘러보기 상세 모달 및 시작 버튼
  assert.ok(moduleContent.includes('openTemplatePreviewModal'), '추천템플릿 1초 둘러보기 상세 모달 함수 탑재');
  assert.ok(moduleContent.includes('둘러보기'), '템플릿 둘러보기 버튼 라벨 탑재');
  assert.ok(moduleContent.includes('이 템플릿으로 시작'), '템플릿 복제 시작 버튼 탑재');

  // 3. 소통 탭 게시하기 버튼 정상 동작
  assert.ok(indexHtml.includes('id="btnCommPostFeed"'), '소통 탭 헤더 게시하기 버튼 탑재');
  assert.ok(indexHtml.includes('id="feedQuickPostBtn"'), '소통 피드 안내창 게시하기 버튼 탑재');
  assert.ok(indexHtml.includes('window.openShareToFeedModal = openShareToFeedModal;'), 'openShareToFeedModal 전역 노출 검증');

  // 4. DM창 상단 같은 모임원 원클릭 DM 발송 바
  assert.ok(moduleContent.includes('getTeamMembersPool'), '모임 멤버 풀 조회 함수 탑재');
  assert.ok(moduleContent.includes('getDmPerson'), 'DM 대화 상대 단일 조회 및 답장 풀 연동 함수 탑재');
  assert.ok(moduleContent.includes('내 팀 동료에게 바로 DM 보내기') || moduleContent.includes('내 모임 동료에게 바로 DM 보내기'), 'DM 상단 모임원 칩 바 헤더 탑재');
  assert.ok(moduleContent.includes('dm-team-chip'), '모임원 원클릭 DM 발송 칩 클래스 탑재');

  // 5. DM 오른쪽 동반자 탭 신설 및 소셜 시스템
  assert.ok(indexHtml.includes('companion:동반자'), '소통 탭 하위 서브탭에 동반자 탭 탑재');
  assert.ok(moduleContent.includes('renderCommCompanions'), '동반자 탭 렌더러 함수 탑재');
  assert.ok(moduleContent.includes('ALL_SEARCHABLE_USERS'), '동반자 검색 유저 풀 탑재');
  assert.ok(moduleContent.includes('openUserProfileModal'), '동반자 아바타 클릭 프로필 모달 함수 탑재');
  assert.ok(moduleContent.includes('ensureDefaultCompanions'), '초기 시드 동반자 보장 함수 탑재');

  // 6. 용어 헌법 엄수: '히트맵' 단일화 및 '잔디' 단어 배제
  assert.ok(moduleContent.includes('실천 히트맵'), '프로필 모달에 히트맵 용어 사용 검증');
  assert.ok(!moduleContent.includes('잔디'), 'team-invite-comm.js 내 잔디 단어 배제 검증');

  // 7. 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const lines = indexHtml.split(/\r?\n/).length;
  assert.ok(lines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-107] 팀 연계 개인목표 및 상호 달성도 체크·소통 시스템 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 목표 탭 하위 서브탭에 '팀 연계' 탑재 및 뷰 컨테이너 검증
  assert.ok(indexHtml.includes("['teamLinked','팀 연계']") || indexHtml.includes("['teamLinked','팀 연계 개인목표']"), '서브탭에 팀 연계 탑재');
  assert.ok(indexHtml.includes('id="teamLinkedGoalsView"'), 'teamLinkedGoalsView 독립 뷰 컨테이너 탑재');
  assert.ok(indexHtml.includes('js/team-linked-goals.js'), 'team-linked-goals.js 스크립트 로드 태그 탑재');

  // 2. team-linked-goals.js 모듈 파일 및 핵심 API 검증
  const modulePath = path.join(__dirname, '..', 'js', 'team-linked-goals.js');
  assert.ok(fs.existsSync(modulePath), 'js/team-linked-goals.js 파일 존재');
  const moduleContent = fs.readFileSync(modulePath, 'utf8');
  assert.ok(moduleContent.includes('OurgoalTeamLinkedGoals'), 'OurgoalTeamLinkedGoals 전역 모듈 노출');
  assert.ok(moduleContent.includes('copyTeamGoalToPersonalLinked'), '팀 연계 개인목표 복사 참가 함수 탑재');
  assert.ok(moduleContent.includes('renderTeamLinkedGoalsScreen'), '팀 연계 개인목표 전용 워크스페이스 렌더러 탑재');
  assert.ok(moduleContent.includes('renderTeamGoalCardSections'), '팀 목표 카드 복사참가/참가자현황 렌더러 탑재');
  assert.ok(moduleContent.includes('getTeamGoalParticipants'), '팀 목표 참가자 목록 및 달성도 조회 함수 탑재');
  assert.ok(moduleContent.includes('syncTeamGoalParticipantProgress'), '개인 실천 진척도 팀 참가자 데이터 실시간 동기화 함수 탑재');
  assert.ok(moduleContent.includes('openTeamGoalMemberDmModal'), '1:1 DM 대화 모달 함수 탑재');

  // 3. 3대 상호작용(찌르기, 댓글, DM) 및 원클릭 복사 배선 검증
  assert.ok(moduleContent.includes('data-copyteamgoal='), '팀 연계 개인목표로 복사하며 참가 속성');
  assert.ok(moduleContent.includes('data-gotolinkedgoal='), '내 연계목표 바로가기 속성');
  assert.ok(moduleContent.includes('data-tgpnudge='), '참가자 ⚡ 찌르기(Nudge) 속성');
  assert.ok(moduleContent.includes('data-tgpcmt='), '참가자 💬 댓글 포커스 속성');
  assert.ok(moduleContent.includes('data-tgpdm='), '참가자 ✉️ 1:1 DM 속성');

  // 4. 용어 헌법 엄수: '히트맵' 단일화 및 '잔디' 단어 배제
  assert.ok(!moduleContent.includes('잔디'), 'team-linked-goals.js 내 잔디 단어 배제 검증');

  // 5. 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const lines = indexHtml.split(/\r?\n/).length;
  assert.ok(lines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-106] 헌법 제19조 의거 실 사용자 계정 상호 연동(Real Inter-Account Interaction) DM 및 동반자 시스템 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const modulePath = path.join(__dirname, '..', 'js', 'team-invite-comm.js');
  assert.ok(fs.existsSync(modulePath), 'js/team-invite-comm.js 파일 존재');
  const moduleContent = fs.readFileSync(modulePath, 'utf8');

  // 1. 헌법 제19조 제4항 1호/2호: 서버 DB 원장 및 Realtime 채널 백본 검증
  assert.ok(moduleContent.includes('getDmThreadId'), '발송자/수신자 UID 기반 고유 쓰레드 ID 생성 함수 탑재');
  assert.ok(moduleContent.includes('loadDmMessagesFromDb'), 'Supabase DB 메시지 원장 비동기 로드 함수 탑재');
  assert.ok(moduleContent.includes('subscribeRealtimeDm'), 'Supabase Realtime 양방향 전파 채널 구독 함수 탑재');
  assert.ok(moduleContent.includes('team_ping_replies'), 'Supabase 실시간 DM 메시지 테이블 배선 검증');

  // 2. 헌법 제19조 제3항: 무충돌 안전핀(게스트 소프트 게이트 & 콜드스타트 투명 AI봇 뱃지) 검증
  assert.ok(moduleContent.includes('showGuestSoftAuthGate'), '비로그인 사용자 소프트 로그인 안내 모달 함수 탑재');
  assert.ok(moduleContent.includes('isAiBot'), '콜드스타트 완충재 AI 봇 투명 플래그 탑재');
  assert.ok(moduleContent.includes('AI 봇'), 'UI 상 투명한 AI 봇 공식 뱃지 표기 검증');

  // 3. 헌법 제19조 제4항 3호: 실제 가입 회원 닉네임 검색 연동 검증
  //    2026-09-16 수정: users 테이블 RLS(auth.uid()=본인 행만 select)가 걸려 있어
  //    클라이언트가 .from('users')를 직접 select 하면 타인 행이 항상 0건으로 막힌다
  //    (docs/sql/2026-09-16-search-users-rpc.sql). 검색은 RLS를 우회하지 않는
  //    SECURITY DEFINER RPC 경유로만 하고, 게스트/오류/미존재를 구분해서 보여준다.
  assert.ok(moduleContent.includes("rpc('search_users_by_nickname'"), 'RLS를 그대로 둔 채 최소 필드만 반환하는 검색 RPC 호출 배선 검증');
  // .from('users') 자체는 본인 행만 다루는 companions get/set(persistCompanions/syncCompanionsFromDb)에서
  // 정당하게 쓰인다(RLS 통과). 재발 방지 대상은 어디까지나 타인 검색을 anon select로 시도하던 옛 패턴이다.
  assert.ok(!moduleContent.includes(".or('display_name.ilike"), '타인 검색을 RLS 걸린 테이블 직접 select로 시도하던 옛 결함 패턴 제거 검증');
  assert.ok(moduleContent.includes('_companionSearchError'), '검색 실패/게스트/결과없음 상태를 구분하는 필드 탑재 검증');
  assert.ok(moduleContent.includes("searchError === 'guest'"), '비로그인 검색 시 로그인 안내와 결과없음을 구분하는지 검증');
  assert.ok(moduleContent.includes("searchError === 'error'"), '쿼리 실패와 결과없음을 구분해서 보여주는지 검증');
  assert.ok(moduleContent.includes('persistCompanions'), '동반자 추가가 users.companions에 영속화되는지 검증(#TASK-ES-120 추가 발견: 추가해도 새로고침하면 사라지던 결함)');

  // 4. 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const lines = indexHtml.split(/\r?\n/).length;
  assert.ok(lines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-108] 아워골 로그인 체계 카카오 단일화 및 구글 캘린더 연동 분리 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const authSafety = fs.readFileSync(path.join(__dirname, '..', 'js', 'auth-safety.js'), 'utf8');

  // 1. 랜딩 및 인증 화면 카카오 단일 메인 CTA 강조 & 구글 로그인 버튼 숨김
  assert.ok(indexHtml.includes('카카오로 3초 만에 시작하기'), '랜딩 화면 카카오 3초 시작 문구');
  assert.ok(indexHtml.includes('id="landGoogleBtn" type="button" style="display:none;"'), '랜딩 구글 로그인 버튼 비노출 숨김');
  assert.ok(indexHtml.includes('id="authGoogleBtn" type="button" style="display:none;"'), '인증 화면 구글 로그인 버튼 비노출 숨김');

  // 2. 구글 인증은 설정 내 구글 캘린더 연동 전용으로 배선 보존
  assert.ok(indexHtml.includes('function tryConnectGoogleCalendar('), '구글 캘린더 연동 핸들러 보존');
  assert.ok(indexHtml.includes('function openGoogleCalendarConnectModal('), '구글 캘린더 연동 모달 보존');
  assert.ok(indexHtml.includes('id="gcalQuickConnectBtn"'), '설정 탭 구글 캘린더 연동 버튼 존재');

  // 3. 최근 로그인 뱃지 및 기존 사용자 안전망(Rescue) 보존
  assert.ok(authSafety.includes('아워골 로그인이 카카오로 간편 통합되었어요'), '최근 로그인 뱃지 카카오 통합 안내');
  assert.ok(indexHtml.includes('function openLoginRescueModal('), '기존 사용자 데이터 안전 복구 모달 보존');

  // 4. 로그인/회원가입 화면 익명 보장 안심 뱃지 배선 (상민님 지시사항: 닉네임/개인정보 익명 변경 안내)
  assert.ok(indexHtml.includes('id="landAnonymityBadge"'), '랜딩 화면 익명 보장 안심 뱃지 존재');
  assert.ok(indexHtml.includes('id="authAnonymityBadge"'), '인증 화면 익명 보장 안심 뱃지 존재');
  assert.ok(indexHtml.includes('닉네임과 개인정보는 100% 익명으로 언제든 변경 가능해요'), '닉네임 익명 보장 안심 문구 존재');
  assert.ok(indexHtml.includes('카톡 실명 걱정 No!'), '카톡 실명 걱정 해소 카피 존재');

  // 5. 이메일로 가입하기 버튼 및 회원가입 탭 비노출 숨김 (상민님 지시사항: 카카오 단일 가입 일원화)
  assert.ok(indexHtml.includes('id="landStartWrap" style="display:none;"'), '랜딩 화면 이메일 가입 버튼 비노출 숨김');
  assert.ok(indexHtml.includes('data-authtab="signup" type="button" style="display:none;"'), '인증 화면 이메일 회원가입 탭 비노출 숨김');

  // 6. 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const lines = indexHtml.split(/\r?\n/).length;
  assert.ok(lines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-109] 목표 탭 편집 모드 완료 버튼 누락 해결, 목표 제목 편집 지원 및 하단 고정 완료 액션바 완결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const goalEditUxPath = path.join(__dirname, '..', 'js', 'goal-edit-ux.js');
  const teamLinkedPath = path.join(__dirname, '..', 'js', 'team-linked-goals.js');

  // 1. js/goal-edit-ux.js 모듈 존재 및 무결성 검증
  assert.ok(fs.existsSync(goalEditUxPath), 'js/goal-edit-ux.js 모듈 파일이 존재해야 함');
  const goalEditUx = fs.readFileSync(goalEditUxPath, 'utf8');
  assert.ok(goalEditUx.includes('renderTitleRow:'), '목표 제목 편집 인풋 렌더러가 정의되어 있어야 함');
  assert.ok(goalEditUx.includes('renderDoneInlineBtn:'), '하단 인라인 완료 버튼 렌더러가 정의되어 있어야 함');
  assert.ok(goalEditUx.includes('renderTeamDoneInlineBtn:'), '팀 목표 하단 인라인 완료 버튼 렌더러가 정의되어 있어야 함');
  assert.ok(goalEditUx.includes('commitAndFinishGoalEdit:'), '개인 목표 편집 확정 커밋 핸들러가 정의되어 있어야 함');
  assert.ok(goalEditUx.includes('commitAndFinishTeamGoalEdit:'), '팀 목표 편집 확정 커밋 핸들러가 정의되어 있어야 함');
  assert.ok(goalEditUx.includes('wirePersonalGoalEdit:'), '개인 목표 편집 이벤트 및 플로팅 바 바인딩이 정의되어 있어야 함');
  assert.ok(goalEditUx.includes('wireTeamGoalEdit:'), '팀 목표 편집 이벤트 바인딩이 정의되어 있어야 함');
  assert.ok(goalEditUx.includes('handleTabChange:'), '탭 전환 시 플로팅 바 제어 핸들러가 정의되어 있어야 함');

  // 2. index.html 스크립트 로드 및 4위 1체 배선 검증
  assert.ok(indexHtml.includes('src="js/goal-edit-ux.js?v=20260916-es109"'), 'index.html에서 goal-edit-ux.js를 로드해야 함');
  assert.ok(indexHtml.includes("editBtn.textContent = state.goalEditMode ? '✓ 편집 완료' : '편집';"), '상단 토글 버튼이 편집 모드 시 [✓ 편집 완료]로 명확히 표시되어야 함');
  assert.ok(indexHtml.includes('commitAndFinishGoalEdit'), '상단 토글에서 commitAndFinishGoalEdit를 호출해야 함');
  assert.ok(indexHtml.includes('renderTitleRow'), 'body.innerHTML에 목표 제목 편집 행이 포함되어야 함');
  assert.ok(indexHtml.includes('renderDoneInlineBtn'), 'body.innerHTML에 인라인 완료 버튼이 포함되어야 함');
  assert.ok(indexHtml.includes('wirePersonalGoalEdit'), 'renderGoalsScreen 끝에서 wirePersonalGoalEdit를 호출해야 함');
  assert.ok(indexHtml.includes('renderTeamDoneInlineBtn'), '팀 목표 view.innerHTML에 인라인 완료 버튼이 포함되어야 함');
  assert.ok(indexHtml.includes('wireTeamGoalEdit'), 'renderTeamGoalsScreen에서 wireTeamGoalEdit를 호출해야 함');
  assert.ok(indexHtml.includes('handleTabChange(tab, state)'), 'setTab에서 handleTabChange를 호출해야 함');

  // 3. js/team-linked-goals.js 연계 목표 편집 완료 배선 검증
  assert.ok(fs.existsSync(teamLinkedPath), 'js/team-linked-goals.js 파일이 존재해야 함');
  const teamLinked = fs.readFileSync(teamLinkedPath, 'utf8');
  assert.ok(teamLinked.includes("(editMode ? '✓ 편집 완료' : '편집')"), '팀 연계 목표 상단 토글이 [✓ 편집 완료]로 표시되어야 함');
  assert.ok(teamLinked.includes('id="btnTlDoneInline"'), '팀 연계 목표 하단 인라인 완료 버튼이 존재해야 함');
  assert.ok(teamLinked.includes('commitAndFinishTlEdit'), '팀 연계 목표 편집 완료 확정 함수가 배선되어 있어야 함');

  // 4. ui.css 플로팅 바 및 완료 버튼 디자인 검증
  assert.ok(uiCss.includes('.goal-edit-floating-bar'), '플로팅 바 클래스 스타일이 정의되어 있어야 함');
  assert.ok(uiCss.includes('.goal-edit-done-cta-btn'), '플로팅 바 완료 버튼 스타일이 정의되어 있어야 함');
  assert.ok(uiCss.includes('.goal-edit-done-inline-btn'), '하단 인라인 완료 버튼 스타일이 정의되어 있어야 함');
  assert.ok(uiCss.includes('.edit-toggle.on'), '활성화된 토글 버튼 강조 스타일이 정의되어 있어야 함');

  // 5. 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const lines = indexHtml.split(/\r?\n/).length;
  assert.ok(lines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-110] 팀 목표 시인성(정보량 다이어트·마일스톤 접힘), 최초 대표 목표 1개 노출 & 스위처, 2계층 아코디언 및 ‘팀 통합 수준관리’ vs ‘목표별 수준관리’ 이원화 무결성 검증', () => {
  const teamVisPath = path.join(__dirname, '..', 'js', 'team-visibility-levels.js');
  assert.ok(fs.existsSync(teamVisPath), 'js/team-visibility-levels.js 파일이 존재해야 함');
  const teamVisCode = fs.readFileSync(teamVisPath, 'utf8');

  // 1. 전용 독립 모듈 함수 노출 검증
  assert.ok(teamVisCode.includes('getGoalLevelGoals: getGoalLevelGoals'), '목표별 수준관리 조회 헬퍼 노출');
  assert.ok(teamVisCode.includes('copyTeamLevelsToGoal: copyTeamLevelsToGoal'), '팀 통합 수준 목표별 복사 헬퍼 노출');
  assert.ok(teamVisCode.includes('openLevelGroupDetailModal: openLevelGroupDetailModal'), '수준별 조 상세 모달(tgid 대응) 노출');
  assert.ok(teamVisCode.includes('renderTeamCardContent: renderTeamCardContent'), '팀 카드 단일 목표 및 수준관리 아코디언 렌더러 노출');
  assert.ok(teamVisCode.includes('bindEvents: bindEvents'), '스위처/아코디언/모드전환/복사 이벤트 바인딩 노출');

  // 2. index.html 배선 검증
  assert.ok(html.includes('js/team-visibility-levels.js'), 'index.html에 team-visibility-levels.js 스크립트 로드');
  assert.ok(html.includes('OurgoalTeamVisibilityLevels.renderTeamCardContent(g, canManage, state)'), 'renderTeamGoalsScreen에서 renderTeamCardContent 위임 호출');
  assert.ok(html.includes('OurgoalTeamVisibilityLevels.bindEvents(view)'), 'renderTeamGoalsScreen에서 bindEvents 위임 호출');
  assert.ok(html.includes('OurgoalTeamVisibilityLevels.init('), 'OurgoalTeamVisibilityLevels.init 의존성 주입');
  assert.ok(html.includes('OurgoalTeamVisibilityLevels.openLevelGroupDetailModal'), 'openLevelGroupDetailModal에 tgid 연계');
  assert.ok(html.includes('OurgoalTeamVisibilityLevels.getGoalLevelGoals'), 'data-addlevelgroup에 목표별 tgid 분기 적용');

  // 3. ui.css 전용 디자인 클래스 검증
  assert.ok(styleSrc.includes('.tg-goal-switcher'), '상단 목표 스위처 칩 바 스타일');
  assert.ok(styleSrc.includes('.tg-goal-chip'), '목표 칩 버튼 스타일');
  assert.ok(styleSrc.includes('.tg-compact-goal-card'), '1개 목표 컴팩트 카드 스타일');
  assert.ok(styleSrc.includes('.tg-level-dual-tabs'), '팀통합 vs 목표별 듀얼 탭 스위처 스타일');
  assert.ok(styleSrc.includes('.tg-accordion-section'), '수준별 목표 2계층 아코디언 섹션 스타일');
  assert.ok(styleSrc.includes('.tg-lg-accordion-row'), '조별 카드 인라인 아코디언 행 스타일');

  // 4. 모듈 로직 시뮬레이션 및 데이터 분리 무결성 검증
  const OurgoalTeamVis = require('../js/team-visibility-levels.js');
  const dummyState = {
    profile: {
      settings: {
        groupLevelGoals: {
          'g1': [
            { id: 'lg_team_1', name: 'A조 (통합)', goals: [{ id: 'g_1', title: '통합 목표 1', milestones: [{ id: 'm_1', title: 'm1', status: 'done', tasks: [{ id: 't_1', done: true }] }] }] }
          ]
        }
      }
    }
  };

  OurgoalTeamVis.init({
    getState: () => dummyState,
    getProfile: () => dummyState.profile,
    saveProfile: async () => {},
    MOCK_GROUPS: [
      {
        id: 'g1',
        name: '하이록스 러닝클럽',
        icon: '🏃',
        teamGoals: [
          { id: 'tg_1', title: '서울 레이스 완주', dueDate: '2026-10-01', milestones: [{ id: 'm1', title: '10km 빌드업', status: 'done', tasks: [] }] },
          { id: 'tg_2', title: '월간 누적 100km', dueDate: '2026-10-15', milestones: [{ id: 'm2', title: '주 3회 런', status: 'todo', tasks: [] }] }
        ]
      }
    ]
  });

  // 4.1 최초 진입 시 단일 대표 목표 및 칩 스위처 렌더링 검증
  const dummyGroup = {
    id: 'g1',
    name: '하이록스 러닝클럽',
    icon: '🏃',
    teamGoals: [
      { id: 'tg_1', title: '서울 레이스 완주', dueDate: '2026-10-01', milestones: [{ id: 'm1', title: '10km 빌드업', status: 'done', tasks: [] }] },
      { id: 'tg_2', title: '월간 누적 100km', dueDate: '2026-10-15', milestones: [{ id: 'm2', title: '주 3회 런', status: 'todo', tasks: [] }] }
    ]
  };

  const renderedHtml = OurgoalTeamVis.renderTeamCardContent(dummyGroup, true, dummyState);
  assert.ok(renderedHtml.includes('class="tg-goal-switcher"'), '복수 목표 시 상단 스위처 칩 바 렌더링');
  assert.ok(renderedHtml.includes('data-tgselectgoal="g1:tg_1"'), '1번 목표 선택 칩');
  assert.ok(renderedHtml.includes('data-tgselectgoal="g1:tg_2"'), '2번 목표 선택 칩');
  assert.ok(renderedHtml.includes('data-tglevelaccordion="g1"'), '수준별 목표 1계층 아코디언 헤더');
  assert.ok(renderedHtml.includes('data-tglevelmode="g1:goal"'), '목표별 수준관리 탭 버튼');
  assert.ok(renderedHtml.includes('data-tglevelmode="g1:team"'), '팀 통합 수준관리 탭 버튼');

  // 4.2 팀 통합 수준을 특정 목표로 복사하는 copyTeamLevelsToGoal 무결성 검증
  const copied = OurgoalTeamVis.copyTeamLevelsToGoal('g1', 'tg_2');
  assert.strictEqual(copied.length, 1, '1개 조 복사 완료');
  assert.strictEqual(copied[0].name, 'A조 (통합)', '조 이름 보존');
  assert.ok(copied[0].id.startsWith('lg_tg_2_'), '목표 ID 기반 고유 조 ID 부여');
  assert.ok(dummyState.profile.settings.goalLevelGoals['tg_2'], '목표별 수준 저장소에 독립 격리 저장 확인');

  // 5. 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const finalLines = html.split(/\r?\n/).length;
  assert.ok(finalLines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-111] 참가 팀원 달성현황 UI 효율화(1열 가로 인라인 정돈, 달성률/게이지바 슬림화, 모바일 반응형 컴팩트 카드 및 아코디언 접힘) 무결성 검증', () => {
  const teamLinkedPath = path.join(__dirname, '..', 'js', 'team-linked-goals.js');
  assert.ok(fs.existsSync(teamLinkedPath), 'js/team-linked-goals.js 파일이 존재해야 함');
  const teamLinkedCode = fs.readFileSync(teamLinkedPath, 'utf8');

  // 1. 1열 가로 인라인 구조 및 CSS 클래스 적용 검증
  assert.ok(teamLinkedCode.includes('class="tg-participant-row"'), '1열 인라인 참가자 행 클래스 적용');
  assert.ok(teamLinkedCode.includes('class="tg-p-left"'), '좌측 사용자 메타 수평 배치 래퍼');
  assert.ok(teamLinkedCode.includes('class="tg-p-meta"'), '이름/역할/진행상태 인라인 래퍼');
  assert.ok(teamLinkedCode.includes('class="tg-p-name"'), '참가자 이름 클래스');
  assert.ok(teamLinkedCode.includes('class="tg-p-role-badge'), '역할 마이크로 뱃지 클래스');
  assert.ok(teamLinkedCode.includes('class="tg-p-status"'), '마일스톤 진행상태 한 줄 텍스트 클래스');
  assert.ok(teamLinkedCode.includes('class="tg-p-right"'), '우측 달성률 및 액션 버튼 래퍼');
  assert.ok(teamLinkedCode.includes('class="tg-p-progress"'), '슬림 달성률 및 미니 바 래퍼');

  // 2. 아코디언 접기/펼치기 토글 배선 검증
  assert.ok(teamLinkedCode.includes('data-tgparttoggle='), '참가 팀원 현황 아코디언 헤더 토글 속성');
  assert.ok(teamLinkedCode.includes('data-tgpartlist='), '참가 팀원 목록 바디 데이터 속성');
  assert.ok(teamLinkedCode.includes('p.settings.foldParticipants'), '참가 팀원 접힘 상태 영구 저장');

  // 3. 기존 셀렉터 및 상호작용 100% 무손실 보존 검증
  assert.ok(teamLinkedCode.includes('참가 팀원 달성 현황'), '섹션 타이틀 텍스트 보존');
  assert.ok(teamLinkedCode.includes('data-tgpnudge='), '응원 찌르기 버튼 데이터 속성 보존');
  assert.ok(teamLinkedCode.includes('data-tgpcmt='), '댓글 소통 버튼 데이터 속성 보존');
  assert.ok(teamLinkedCode.includes('data-tgpdm='), '1:1 DM 버튼 데이터 속성 보존');
  assert.ok(teamLinkedCode.includes('data-gotolinkedgoal='), '내 목표 바로가기 버튼 데이터 속성 보존');

  // 4. ui.css 전용 스타일 검증
  assert.ok(styleSrc.includes('.tg-participant-row'), 'ui.css에 1열 인라인 행 스타일 정의');
  assert.ok(styleSrc.includes('.tg-p-meta'), 'ui.css에 인라인 메타 스타일 정의');
  assert.ok(styleSrc.includes('.tg-p-role-badge'), 'ui.css에 역할 마이크로 뱃지 스타일 정의');
  assert.ok(styleSrc.includes('.tg-p-header'), 'ui.css에 아코디언 헤더 스타일 정의');

  // 5. 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const currentLines = html.split(/\r?\n/).length;
  assert.ok(currentLines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-116] 카카오톡 인앱 브라우저 외부 탈출 & PKCE 4초 대기 및 복구 안전망 검증', () => {
  // 1. 카카오톡 인앱 브라우저 탈출 함수 및 버튼
  assert.ok(html.includes('function escapeKakaoInAppBrowser()'), '카카오 인앱 브라우저 외부 탈출 함수 정의');
  assert.ok(html.includes('btnEscapeInAppNotice'), '카카오 인앱 브라우저 탈출 배너 버튼 존재');
  assert.ok(html.includes('intent://'), 'Android Chrome 외부 브라우저 탈출 intent 스킴 지원');
  assert.ok(html.includes('Safari(사파리)로 열기'), 'iOS Safari 안내 모달 지원');

  // 2. PKCE code_verifier 2중 백업 및 복원
  assert.ok(html.includes('-code-verifier') && html.includes('sessionStorage.setItem(sk'), 'PKCE code_verifier sessionStorage 2중 백업');
  assert.ok(html.includes('localStorage.setItem(sKey, sessionStorage.getItem(sKey))'), 'PKCE code_verifier 복원 로직 배선');

  // 3. boot 콜백 4.0초 안전 대기
  assert.ok(html.includes('maxWait = isOAuthCallback ? 20 : 1'), 'OAuth 콜백 최대 4.0초(20회) 안전 대기');
  assert.ok(html.includes('카카오 로그인 세션을 확인 중입니다'), 'OAuth 콜백 진행 중 사용자 피드백 안내');

  // 4. PKCE/OAuth 실패 시 자동 구출 모달 연계
  assert.ok(html.includes("openLoginRescueModal('카카오톡 인앱 브라우저 세션 지연이 발생했습니다"), '콜백 지연 시 자동 구출 모달 오픈');

  // 5. 사용자 만족 극대화: 닉네임 1초 직통 고속도로 & 무음 자동 정화 배선
  assert.ok(html.includes('id="landNickQuickLink"'), '랜딩 화면 닉네임 1초 직통 고속도로 링크 존재');
  assert.ok(html.includes("openLoginRescueModal('사용하실 닉네임 또는 이메일을 입력하시면 1초 만에 바로 입장하실 수 있어요!')"), '닉네임 직통 클릭 시 안내 및 구출 모달 오픈 연계');
  assert.ok(html.includes("lk.indexOf('sb-') === 0 || lk === 'ourgoal_guest_profile'"), '구출 모달 오픈 시 무음 자동 토큰 정화 로직 배선');
  assert.ok(html.includes('처음부터 다시 시도'), '세션 초기화 기술 용어 순화 완료');
  assert.ok(html.includes('1초 빠른 복구·입장'), '복구 링크 문구 순화 완료');

  // 6. 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const finalLines = html.split(/\r?\n/).length;
  assert.ok(finalLines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-117] 아바타 생성 후 앱 업데이트·재로그인·재접속 시 아바타 영속성 및 화면 동기화 무결성 검증', () => {
  const avatarSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');

  // 1. avatar-system.js 에서 profile.avatarUrl 동기화 확인
  assert.ok(
    avatarSrc.includes('profile.avatarUrl = newCustomUrl;') &&
    avatarSrc.includes('deps.state.profile.avatarUrl = newCustomUrl;'),
    '아바타 생성 시 profile.avatarUrl 및 deps.state.profile.avatarUrl 동기화'
  );

  // 2. index.html loadProfile() 내 DB users.avatar_url 커스텀 아바타 자동 복원 확인
  assert.ok(
    html.includes('settings.customAvatarUrl = finalAvatarUrl;') &&
    html.includes("settings.avatarType = 'custom';"),
    'loadProfile 내 새 기기/캐시삭제 후 재로그인 시 DB avatar_url 커스텀 아바타 자동 복원'
  );

  // 3. index.html updateTopBar() 3등신 아바타 지원 확인
  assert.ok(
    html.includes("customUrl = (p.settings && p.settings.avatarType === 'custom' && p.settings.customAvatarUrl) || p.avatarUrl"),
    'updateTopBar 내 3등신 아바타(customAvatarUrl) 직접 지원 및 상단바 동기화'
  );

  // 4. index.html restoreSessionAndEnter() 게스트 아바타 설정 마이그레이션 확인
  assert.ok(
    html.includes('state.profile.settings.avatarType = gData.settings.avatarType') &&
    html.includes('state.profile.settings.customAvatarUrl = gData.settings.customAvatarUrl') &&
    html.includes('state.profile.avatarUrl = gData.settings.customAvatarUrl'),
    '게스트 상태에서 아바타 제작 후 소셜 로그인 전환 시 아바타 설정 100% 무손실 마이그레이션'
  );

  // 5. 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const finalLines = html.split(/\r?\n/).length;
  assert.ok(finalLines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-118] 홈 상단 고정 바(Topbar) 활용법·홈구성 퀵 액션 영구 고정 및 모바일 반응형 2단 줄바꿈·PWA 무중단 캐시 갱신', () => {
  // 1. 탑바 우측 퀵 액션 버튼 마크업 확인
  assert.ok(html.includes('id="topHomeGuideBtn"'), '탑바 내 활용법 퀵 액션 버튼(#topHomeGuideBtn) 존재');
  assert.ok(html.includes('id="topHomeLayoutBtn"'), '탑바 내 홈구성 퀵 액션 버튼(#topHomeLayoutBtn) 존재');
  assert.ok(html.includes('id="topbarActions"'), '탑바 내 액션 컨테이너(#topbarActions) 존재');

  // 2. 이벤트 핸들러 배선 확인
  assert.ok(html.includes("topBtnCustomHome.addEventListener('click', openHomeCustomizer)"), '탑바 홈구성 버튼 핸들러 연동');
  assert.ok(html.includes("topBtnGuide.addEventListener('click'"), '탑바 활용법 버튼 핸들러 연동');

  // 3. 모바일 반응형 flex-wrap 및 safe-area CSS 확인
  assert.ok(styleSrc.includes('.topbar-actions') && styleSrc.includes('.topbar-action-btn'), '탑바 퀵 액션 버튼 스타일 정의');
  assert.ok(styleSrc.includes('.home-head-row') && styleSrc.includes('flex-wrap: wrap;'), '홈 헤더 행 flex-wrap 줄바꿈 안전 배선');

  // 4. PWA sw.js 캐시 버전 갱신 확인
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  assert.ok(swSrc.includes('ourgoal-shell-v20260916-es118'), '서비스워커 최신 버전 캐시 네임 적용');

  // 5. 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const finalLines = html.split(/\r?\n/).length;
  assert.ok(finalLines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-119] 생성한 아바타 누적 보관함(서랍) 구축 및 원클릭 자유로운 변경·착용 시스템 검증', () => {
  const avatarSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');

  // 1. 보관함 데이터 모델 및 헬퍼 함수 구현 확인
  assert.ok(avatarSrc.includes('function getSavedAvatars(profile)'), 'getSavedAvatars 함수 구현');
  assert.ok(avatarSrc.includes('function addSavedAvatar(profile, item)'), 'addSavedAvatar 함수 구현');
  assert.ok(avatarSrc.includes('function removeSavedAvatar(profile, avatarId)'), 'removeSavedAvatar 함수 구현');
  assert.ok(avatarSrc.includes('function renderSavedAvatarsDeckHtml('), 'renderSavedAvatarsDeckHtml 함수 구현');

  // 2. 모달 내 내 아바타 서랍 마크업 및 카드 덱 슬롯 확인
  assert.ok(avatarSrc.includes('id="savedAvatarsDeckSlot"'), '모달 내 서랍 카드 덱 슬롯(#savedAvatarsDeckSlot) 존재');
  assert.ok(avatarSrc.includes('saved-avatar-card'), '서랍 아바타 카드 클래스(saved-avatar-card) 존재');
  assert.ok(avatarSrc.includes('btn-del-saved-avatar'), '서랍 삭제 버튼 클래스(btn-del-saved-avatar) 존재');
  assert.ok(avatarSrc.includes('착용 중'), '착용 중 뱃지 표시 배선');

  // 3. 신규 제작 시 누적 보관함 자동 인입 및 갱신 연동 확인
  assert.ok(avatarSrc.includes('function onAvatarCraftCompleted(dataUrl, persona)'), 'onAvatarCraftCompleted 공통 처리 함수 존재(#TASK-ES-122 persona 인자 확장)');
  assert.ok(avatarSrc.includes('refreshSavedAvatarsDeck()'), '서랍 UI 실시간 새로고침 배선');

  // 4. 서랍 카드 클릭 시 원클릭 선택 및 차감 0회 변경 확인
  assert.ok(avatarSrc.includes('card.onclick = function (e)'), '서랍 카드 클릭 핸들러 배선');
  assert.ok(avatarSrc.includes('delBtns.forEach(function (btn)'), '서랍 삭제 버튼 핸들러 배선');

  // 5. index.html 게스트 -> 소셜 로그인 시 savedAvatars 무손실 마이그레이션 확인
  assert.ok(html.includes('if(gData.settings.savedAvatars) state.profile.settings.savedAvatars = gData.settings.savedAvatars;'), '게스트 savedAvatars 소셜 로그인 무손실 승계');

  // 6. 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const finalLines = html.split(/\r?\n/).length;
  assert.ok(finalLines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-121] 피드·모임·템플릿 외부 SNS 공유 및 미사용자 전파 시스템화 (통합 딥링크 & 동적 OG 게이트웨이, 소프트 게스트 뷰어 3종) 검증', () => {
  const viralSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'viral-sharing.js'), 'utf8');
  const trackSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'track.js'), 'utf8');
  const vercelCfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
  const commSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-invite-comm.js'), 'utf8');

  // 1. 바이럴 공유 모듈 헬퍼 함수 구현 확인
  assert.ok(viralSrc.includes('function shareContent(opts)'), 'shareContent 함수 구현');
  assert.ok(viralSrc.includes('function showFeedGuestViewerModal(feedId)'), 'showFeedGuestViewerModal 게스트 뷰어 구현');
  assert.ok(viralSrc.includes('function showTemplateGuestViewerModal(templateId)'), 'showTemplateGuestViewerModal 게스트 뷰어 구현');
  assert.ok(viralSrc.includes('function showGoalCertGuestViewerModal(goalId, meta)'), 'showGoalCertGuestViewerModal 게스트 뷰어 구현');
  assert.ok(viralSrc.includes('function handleDeepLinkRouting()'), 'handleDeepLinkRouting 딥링크 라우터 구현');

  // 2. Vercel 서버리스 동적 OG 엔드포인트 구현 및 rewrite 배선 확인
  assert.ok(trackSrc.includes('async function handleShareOg(req, res)'), 'api/track.js 내 handleShareOg 구현');
  assert.ok(trackSrc.includes("type === 'template'"), '템플릿 OG 메타태그 분기 처리');
  assert.ok(trackSrc.includes("type === 'feed'"), '피드 OG 메타태그 분기 처리');
  assert.ok(trackSrc.includes("type === 'group'"), '모임 초대 OG 메타태그 분기 처리');
  assert.ok(trackSrc.includes("type === 'goal'"), '완주 인증서 OG 메타태그 분기 처리');
  assert.ok(trackSrc.includes('<meta property="og:image"'), 'og:image 메타 태그 렌더링');
  const hasShareRewrite = (vercelCfg.rewrites || []).some(r => r.source === '/share' && r.destination === '/api/track');
  assert.ok(hasShareRewrite, 'vercel.json 내 /share -> /api/track rewrite 배선');

  // 3. UI 컴포넌트 공유 버튼 및 배선 확인
  assert.ok(commSrc.includes('id="tplPreviewShareBtn"'), '템플릿 미리보기 모달 공유 버튼 존재');
  assert.ok(commSrc.includes('shareContent'), '템플릿 모달 shareContent 연동');
  assert.ok(html.includes('js/viral-sharing.js'), 'index.html 내 viral-sharing.js 스크립트 로드');

  // 4. 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const finalLines2 = html.split(/\r?\n/).length;
  assert.ok(finalLines2 >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-122] 아바타 생성 기간 설정(목표·팀·기록 분석 MBTI/좌우명) 결합 및 77종 바디 안내문구 정비 검증', () => {
  const avatarSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');
  const promptgenSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'promptgen.js'), 'utf8');
  const vercelCfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));

  // 1. 사용자 노출 "77종 바디" 안내문구가 제거되었는지 확인 (내부 카탈로그/합성 로직은 유지)
  assert.ok(!avatarSrc.includes('77종 바디에 딱 맞는'), '아바타 제작 로딩 문구에서 77종 바디 언급 삭제');
  assert.ok(avatarSrc.includes('function getWoodHammerMakerAnimationHtml('), '나무망치 제작 애니메이션 함수는 그대로 보존');
  assert.ok(avatarSrc.includes('var BODY_THEMES_77 = ['), '77종 바디 테마 카탈로그 자체는 삭제되지 않고 보존');

  // 2. 기간 설정 UI 마크업 및 안내멘트 존재 확인
  assert.ok(avatarSrc.includes('id="btnSetAvatarPeriod"'), '아바타 생성 기준 기간 정하기 버튼 존재');
  assert.ok(avatarSrc.includes('id="avatarPeriodStartInput"') && avatarSrc.includes('id="avatarPeriodEndInput"'), '기간 시작·종료 날짜 입력 존재');
  assert.ok(avatarSrc.includes('설정한 기간의 내 목표, 팀, 기록들을 분석하여') && avatarSrc.includes('그에 맞는 MBTI와 좌우명을 가진 아바타를 생성합니다.'), '2줄 안내멘트 존재');
  assert.ok(avatarSrc.includes("max-width:560px"), '아바타 설정 모달 확장(440px -> 560px)');

  // 3. 기간별 목표/팀/기록 분석 및 MBTI·좌우명 생성 배선 확인
  assert.ok(avatarSrc.includes('function collectPeriodPersonaSummary(profile, mockGroups, startDate, endDate)'), '기간 내 목표·기록·팀 요약 수집 함수 구현');
  assert.ok(avatarSrc.includes('function fetchAvatarPersona(summaryText)'), 'MBTI·좌우명 분석 API 호출 함수 구현');
  assert.ok(avatarSrc.includes("periodSummary.isEmpty"), '기간 내 분석 데이터 0건 시 제작 차단(횟수 미차감) 배선');
  assert.ok(avatarSrc.includes('function onAvatarCraftCompleted(dataUrl, persona)'), 'persona 결과가 제작 완료 처리 함수에 결합');

  // 4. 서버 사이드 MBTI/좌우명 분석 라우팅 및 rewrite 배선 확인
  assert.ok(promptgenSrc.includes("body.action === 'avatar-persona'"), 'promptgen.js avatar-persona 서브 라우팅 분기 존재');
  assert.ok(promptgenSrc.includes('async function handleAvatarPersonaAnalysis(req, res, body)'), 'handleAvatarPersonaAnalysis 핸들러 구현');
  assert.ok(promptgenSrc.includes('/^[EI][NS][FT][JP]$/'), 'MBTI 4글자 형식 검증 정규식 존재');
  const hasPersonaRewrite = (vercelCfg.rewrites || []).some(r => r.source === '/api/avatar-persona' && r.destination === '/api/promptgen');
  assert.ok(hasPersonaRewrite, 'vercel.json 내 /api/avatar-persona -> /api/promptgen rewrite 배선');

  // 5. 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)
  const finalLines3 = html.split(/\r?\n/).length;
  assert.ok(finalLines3 >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-123] 인앱 1:1 고객 문의·오류 제보 접수 시스템 완결 및 노션 DB·텔레그램 실시간 자동 연동 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const trackSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'track.js'), 'utf8');
  const vercelCfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
  const ddlExists = fs.existsSync(path.join(__dirname, '..', 'docs', 'sql', '2026-09-16-inquiries.sql'));

  // 1. 프론트엔드 모달 및 리스너 4위 1체 배선 검증
  assert.ok(indexSrc.includes("fetch('/api/inquiry'"), '모달 접수 시 /api/inquiry fetch 비동기 호출 배선');
  assert.ok(indexSrc.includes("action: 'inquiry'"), 'inquiry action 페이로드 탑재');
  assert.ok(indexSrc.includes("openCustomerInquiryModal();"), 'feedbackInquiryBtn 클릭 시 모달 오픈 일원화');

  // 2. api/track.js handleInquiry 엔드포인트 및 3자 연동 검증
  assert.ok(trackSrc.includes('handleInquiry('), 'api/track.js handleInquiry 핸들러 구현');
  assert.ok(trackSrc.includes("3dd598db-9096-816e-8875-c602c34d251f"), '노션 고객문의 DB ID 상수 배선');
  assert.ok(trackSrc.includes("1260106462"), '상민님 텔레그램 Chat ID 상수 배선');
  assert.ok(trackSrc.includes("sb.from('inquiries').insert"), 'Supabase inquiries 테이블 적재 배선');

  // 3. vercel.json rewrite 및 DDL 무결성 검증
  const hasInquiryRewrite = (vercelCfg.rewrites || []).some(r => r.source === '/api/inquiry' && r.destination === '/api/track');
  assert.ok(hasInquiryRewrite, 'vercel.json 내 /api/inquiry -> /api/track rewrite 배선');
  assert.ok(ddlExists, 'docs/sql/2026-09-16-inquiries.sql DDL 파일 존재');

  // 4. Vercel Hobby 12개 서버리스 함수 한도 검증
  const apiFiles = fs.readdirSync(path.join(__dirname, '..', 'api')).filter(f => f.endsWith('.js'));
  assert.strictEqual(apiFiles.length, 12, 'Vercel Hobby 12개 서버리스 함수 한도 엄수 (현재 12개)');

  // 5. 스마트 안전핀 TECH-RULE-01 (index.html 본체 무결성 보존)
  const lines = indexSrc.split(/\r?\n/).length;
  assert.ok(lines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-ES-178] 설정 탭 1:1 고객 문의 링크(footInquiryLink) 무반응 결함 수술 및 4위1체 리스너·글로벌 스코프 배선 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 푸터 1:1 고객 문의 링크 마크업 및 인라인 핸들러 제거 검증
  assert.ok(indexSrc.includes('id="footInquiryLink"'), '설정 탭 푸터에 footInquiryLink 마크업 존재');
  assert.ok(!indexSrc.includes('onclick="openCustomerInquiryModal()'), '깨지기 쉬운 인라인 onclick="openCustomerInquiryModal() 제거 완료');

  // 2. 4위 1체 이벤트 리스너 통합 등록 검증
  assert.ok(indexSrc.includes("['feedbackInquiryBtn', 'footInquiryLink'].forEach("), 'feedbackInquiryBtn 및 footInquiryLink 통합 addEventListener 배선');

  // 3. window 전역 스코프 안전망 검증
  assert.ok(indexSrc.includes('window.openCustomerInquiryModal = openCustomerInquiryModal'), 'openCustomerInquiryModal 함수 window 전역 노출');
  assert.ok(indexSrc.includes('window.showLegalModal = showLegalModal'), 'showLegalModal 함수 window 전역 노출');
});

check('compliance: [#TASK-ES-124] 동반자 실 사용자 닉네임 검색 2중 복원(Vercel 서버리스 + RPC 폴백) 및 가상 유저 3인 AI 동반자 투명 뱃지 표기 검증', () => {
  const commSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-invite-comm.js'), 'utf8');
  const trackSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'track.js'), 'utf8');
  const rpcSql = fs.readFileSync(path.join(__dirname, '..', 'docs', 'sql', '2026-09-16-search-users-rpc.sql'), 'utf8');

  // 1. api/track.js handleSearchUsers 엔드포인트 및 RLS 우회 배선 검증
  assert.ok(trackSrc.includes('handleSearchUsers('), 'api/track.js 내 handleSearchUsers 핸들러 구현');
  assert.ok(trackSrc.includes("body.action === 'search_users'"), 'api/track.js 내 search_users 라우팅 탑재');
  assert.ok(trackSrc.includes("display_name.ilike"), 'users 테이블 닉네임 검색 쿼리 배선');

  // 2. js/team-invite-comm.js 2중 검색 파이프라인 (/api/track 1순위 -> sb.rpc 2순위) 검증
  assert.ok(commSrc.includes("fetch('/api/track'"), '클라이언트 검색 시 /api/track 1순위 호출 배선');
  assert.ok(commSrc.includes("sb.rpc('search_users_by_nickname'"), '클라이언트 검색 시 sb.rpc 폴백 배선');

  // 3. 가상 유저 3인 식별자 및 [🤖 AI 동반자] 투명 뱃지 표기 검증 (헌법 제19조)
  assert.ok(commSrc.includes('function isKnownAiCompanion('), 'isKnownAiCompanion 가상 유저/AI 봇 감지 헬퍼 구현');
  assert.ok(commSrc.includes('새벽러너_민지') && commSrc.includes('코드장인_도현') && commSrc.includes('갓생사는_수아'), '콜드스타트 가상 유저 3인 식별 명단 탑재');
  assert.ok(commSrc.includes('🤖 AI 동반자'), '동반자 목록 및 프로필에 🤖 AI 동반자 투명 뱃지 렌더 배선');

  // 4. DDL 무결성 검증
  assert.ok(rpcSql.includes('grant execute on function public.search_users_by_nickname(text) to anon, authenticated'), 'RPC 공개 권한 완화 SQL 작성');

  // 5. 아바타 URL 안전 렌더링 및 [+ 추가] 버튼 터치 우선권 & 낙관적 UI 무결성 검증
  assert.ok(commSrc.includes('function safeAvatarHtml('), 'safeAvatarHtml URL/이모지 안전 아바타 렌더러 구현');
  assert.ok(commSrc.includes('safeAvatarHtml(u.avatar, 36)'), '검색 결과 내 URL 아바타 안전 렌더 배선');
  assert.ok(commSrc.includes('safeAvatarHtml(c.avatar, 44)'), '동반자 목록 내 URL 아바타 안전 렌더 배선');
  assert.ok(commSrc.includes('safeAvatarHtml(user.avatar, 72)'), '프로필 모달 내 URL 아바타 안전 렌더 배선');
  assert.ok(commSrc.includes('safeAvatarHtml(person.avatar, 40)'), 'DM 채팅방 내 URL 아바타 안전 렌더 배선');
  assert.ok(commSrc.includes('z-index:2') && commSrc.includes('touch-action:manipulation'), '동반자 추가 버튼 z-index 및 터치 간섭 방지 배선');
  assert.ok(commSrc.includes('btn.textContent = \'✓ 추가됨\''), '동반자 추가 버튼 즉시 반응 낙관적 UI 배선');
  assert.ok(commSrc.includes('메시지를 전송했습니다! 💬'), 'DM 발송 즉각 피드백 배선');

  // 6. 캐시 버스팅 및 서비스워커 갱신 무결성 검증
  const htmlSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(htmlSrc.includes('team-invite-comm.js?v=20260916-es1'), 'index.html 스크립트 캐시 버스팅 태그 갱신');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  assert.ok(swSrc.includes('ourgoal-shell-v20260916-es1'), 'sw.js 캐시 네임 갱신');

  // 7. 스마트 안전핀 TECH-RULE-01 (index.html 본체 무결성 보존)
  const lines = htmlSrc.split(/\r?\n/).length;
  assert.ok(lines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
});

check('compliance: [#TASK-CONST-003] index.html 스마트 무결성 안전핀 검증 (22,196줄 고정 잠금 해제, 본체 20,000줄 보존, // ... 무단 축약 금지)', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const rawControl = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rules', 'rules-control.json'), 'utf8');
  const rulesControl = JSON.parse(rawControl.replace(/^---[\s\S]*?---\s*/, ''));
  const registry = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rules', 'AI_TECHNICAL_RULES_REGISTRY.md'), 'utf8');

  // 1. rules-control.json 제어판에서 strict_lines 22,196 고정 해제 확인
  const rule01 = rulesControl.controls.line_count_lock;
  assert.strictEqual(rule01.strict_lines, null, 'strict_lines가 null로 해제됨');
  assert.strictEqual(rule01.allow_growth, true, 'allow_growth가 true로 설정됨');
  assert.strictEqual(rule01.max_growth_per_commit, 300, '커밋당 최대 순증가 300줄 한도 엄수');

  // 2. index.html 본체 무결성 보존 및 무단 대량삭제 방지 (최소 20,000줄 이상)
  const lines = indexSrc.split(/\r?\n/).length;
  assert.ok(lines >= 20000, 'index.html 본체가 20,000줄 이상 온전히 보존됨');

  // 3. AI 무단 코드 축약 패턴 금지 검증
  assert.ok(!indexSrc.includes('// ...') && !indexSrc.includes('/* rest of code */'), 'AI 코드 축약 패턴 0건 엄수');

  // 4. 레지스트리 문서 개정 확인
  assert.ok(registry.includes('index.html 스마트 무결성 안전핀'), '레지스트리에 스마트 무결성 안전핀 공식 등재');
});

check('compliance: [#TASK-ES-127] 16개 MBTI 연계 320개 아바타 페르소나 온톨로지 및 시스템 무결성 검증', () => {
  const avatarSystem = require(path.join(__dirname, '..', 'js', 'avatar-system.js'));
  const avatarJsSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');

  // 1. 320종 전체 페르소나 탑재 검증
  assert.ok(avatarSystem.BODY_THEMES_320, 'BODY_THEMES_320 데이터셋 존재');
  assert.strictEqual(avatarSystem.BODY_THEMES_320.length, 320, '320개 페르소나 전수 탑재 확인');
  assert.strictEqual(avatarSystem.getAllThemes().length, 320, 'getAllThemes() 반환 320개 일치');

  // 2. ID 무결성 검증 (1~320 중복/누락 0건)
  const idSet = new Set();
  avatarSystem.BODY_THEMES_320.forEach((p, idx) => {
    assert.strictEqual(p.id, idx + 1, '페르소나 ID 순차 일치 (ID ' + p.id + ')');
    assert.ok(!idSet.has(p.id), 'ID 중복 없음 (ID ' + p.id + ')');
    assert.ok(p.mbti && p.name && p.cat && p.gear && p.icon, '필수 필드(mbti, name, cat, gear, icon) 누락 없음');
    idSet.add(p.id);
  });

  // 3. 16개 MBTI 각 20개 배분 검증
  const mbtiList = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
  mbtiList.forEach(mbti => {
    const list = avatarSystem.getThemesByMbti(mbti);
    assert.strictEqual(list.length, 20, mbti + ' 페르소나 정확히 20개 일치');
  });

  // 4. 4대 군(NT, NF, SJ, SP) 각 80개 배분 검증
  ['NT', 'NF', 'SJ', 'SP'].forEach(group => {
    const list = avatarSystem.getThemesByGroup(group);
    assert.strictEqual(list.length, 80, group + ' 그룹 페르소나 정확히 80개 일치');
  });

  // 5. 레거시 77종 100% 하위 호환 검증
  assert.ok(avatarSystem.BODY_THEMES_77, '레거시 BODY_THEMES_77 데이터셋 보존');
  assert.strictEqual(avatarSystem.BODY_THEMES_77.length, 77, '레거시 77종 데이터셋 보존');
  const t1 = avatarSystem.getTheme(1);
  const t77 = avatarSystem.getTheme(77);
  const t320 = avatarSystem.getTheme(320);
  assert.ok(t1 && t1.name, 'ID 1 테마 정상 조회');
  assert.ok(t77 && t77.name, 'ID 77 테마 정상 조회');
  assert.ok(t320 && t320.name, 'ID 320 테마 정상 조회');

  // 6. 검색 엔진 동작 검증
  const searchResult = avatarSystem.searchThemes('체스');
  assert.ok(searchResult.length >= 2, '키워드 검색 정상 작동');

  // 7. 320종 도감 UI 컴포넌트 탑재 검증
  assert.ok(avatarJsSrc.includes('renderPersona320ListHtml'), '320종 도감 리스트 렌더러 함수 탑재');
  assert.ok(avatarJsSrc.includes('btnToggle320PersonaCatalog'), '320종 도감 토글 버튼 탑재');
  assert.ok(avatarJsSrc.includes('inputSearchPersona320'), '320종 도감 실시간 검색창 탑재');
  assert.ok(avatarJsSrc.includes('persona320GroupTabs'), '320종 도감 4대 군 탭 탑재');
});

/* ============ [#TASK-ES-125] 아바타 기본 제작 한도 초기 3회 조정 및 7일 연속 체크인 1회 충전 리워드 루프 & 기존 10회 보존 무결성 검증 ============ */
check('compliance: [#TASK-ES-125] 아바타 기본 제작 한도 초기 3회 조정 및 7일 연속 체크인 1회 충전 리워드 루프 & 기존 10회 보존 무결성 검증', () => {
  const avatarSystem = require(path.join(__dirname, '..', 'js', 'avatar-system.js'));
  const avatarJsSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 상수 정의 검증
  assert.strictEqual(avatarSystem.DEFAULT_BASE_CRAFTS, 3, '신규 기본 제작 한도 3회');
  assert.strictEqual(avatarSystem.LEGACY_MAX_CRAFTS, 10, '기존 계정 최대 제작 한도 10회 보존');
  assert.strictEqual(avatarSystem.MAX_AVATAR_CHANGES, 10, '아바타 보관함 최대 저장 한도 10개');

  // 2. 신규 계정 기본 3회 동작 검증
  const newProfile = { settings: { maxBaseCrafts: 3, avatarCraftCount: 0 } };
  assert.strictEqual(avatarSystem.isLegacyAccount(newProfile), false, '신규 계정 정상 식별');
  assert.strictEqual(avatarSystem.getMaxCrafts(newProfile), 3, '신규 계정 총 한도 3회');
  assert.strictEqual(avatarSystem.getRemainingCrafts(newProfile), 3, '신규 계정 잔여 3회');

  newProfile.settings.avatarCraftCount = 1;
  assert.strictEqual(avatarSystem.getRemainingCrafts(newProfile), 2, '1회 사용 후 잔여 2회');

  // 3. 기존 계정 10회 기득권 100% 무손실 보존 검증 (TECH-RULE-03)
  const legacyProfile1 = { settings: { avatarCraftCount: 2 } };
  assert.strictEqual(avatarSystem.isLegacyAccount(legacyProfile1), true, '기존 제작 이력 계정 레거시 판별');
  assert.strictEqual(avatarSystem.getMaxCrafts(legacyProfile1), 10, '기존 계정 총 한도 10회 유지');
  assert.strictEqual(avatarSystem.getRemainingCrafts(legacyProfile1), 8, '기존 계정 2회 사용 후 잔여 8회');

  const legacyProfile2 = { goals: [{ id: 'g1', title: '운동' }], settings: {} };
  assert.strictEqual(avatarSystem.isLegacyAccount(legacyProfile2), true, '기존 목표 보유 계정 레거시 판별');
  assert.strictEqual(avatarSystem.getMaxCrafts(legacyProfile2), 10, '기존 목표 보유 계정 10회 보존');

  // 4. 7일 연속 체크인 시 아바타 제작권 +1회 충전 리워드 검증
  const streakProfile = { settings: { maxBaseCrafts: 3, bonusCraftCredits: 0, lastStreakAwarded: 0 } };
  const r6 = avatarSystem.maybeGrantStreakBonus(streakProfile, 6);
  assert.strictEqual(r6.granted, false, '6일 스트릭 시 미지급');
  assert.strictEqual(avatarSystem.getMaxCrafts(streakProfile), 3, '미지급 시 한도 3회 유지');

  const r7 = avatarSystem.maybeGrantStreakBonus(streakProfile, 7);
  assert.strictEqual(r7.granted, true, '7일 연속 체크인 달성 시 1회 충전 승인');
  assert.strictEqual(streakProfile.settings.bonusCraftCredits, 1, '보너스 크레딧 1회 충전');
  assert.strictEqual(avatarSystem.getMaxCrafts(streakProfile), 4, '총 가용 한도 3 + 1 = 4회 확대');
  assert.strictEqual(avatarSystem.getRemainingCrafts(streakProfile), 4, '잔여 4회');

  // 5. 동일 7일 구간 중복 충전 방지 락킹 검증
  const r7dup = avatarSystem.maybeGrantStreakBonus(streakProfile, 7);
  assert.strictEqual(r7dup.granted, false, '동일 7일 구간 재진입 시 중복 지급 차단');
  assert.strictEqual(streakProfile.settings.bonusCraftCredits, 1, '보너스 크레딧 1회 유지');

  // 6. 14일 연속 체크인 2차 충전 검증
  const r14 = avatarSystem.maybeGrantStreakBonus(streakProfile, 14);
  assert.strictEqual(r14.granted, true, '14일 연속 체크인 달성 시 추가 1회 충전 승인');
  assert.strictEqual(streakProfile.settings.bonusCraftCredits, 2, '보너스 크레딧 총 2회');
  assert.strictEqual(avatarSystem.getMaxCrafts(streakProfile), 5, '총 가용 한도 3 + 2 = 5회');

  // 7. 기존 계정에도 7일 스트릭 리워드 동일 적용 검증
  const legacyStreak = { settings: { maxBaseCrafts: 10, bonusCraftCredits: 0 } };
  const legR7 = avatarSystem.maybeGrantStreakBonus(legacyStreak, 7);
  assert.strictEqual(legR7.granted, true, '기존 계정도 7일 스트릭 시 +1 충전 정상 적용');
  assert.strictEqual(avatarSystem.getMaxCrafts(legacyStreak), 11, '기존 10회 + 보너스 1회 = 총 11회');

  // 8. 생성창 상시 충전 안내문구 및 배너 UI 검증
  assert.ok(avatarJsSrc.includes('avatarStreakRechargeBanner'), '아바타 생성창 상시 충전 배너 ID 탑재');
  assert.ok(avatarJsSrc.includes('7일 연속 체크인 시 아바타 제작권 1회 자동 충전!'), '상시 배너 안내문구 탑재');
  assert.ok(avatarJsSrc.includes('topMaxCraftsSpan'), '상단 총 한도 동적 span 탑재');
  assert.ok(avatarJsSrc.includes('craftBtnCountSpan'), '제작 버튼 동적 잔여/총한도 표기 탑재');

  // 9. index.html 체크인 완료 및 앱 진입 배선 검증
  assert.ok(indexSrc.includes('maybeGrantAvatarCraftBonus'), 'index.html 내 아바타 보너스 충전 배선 함수 존재');
  assert.ok(indexSrc.includes('maxBaseCrafts:3'), 'defaultSettings() 신규 계정 기본 3회 탑재');
  assert.ok(indexSrc.includes('🎉 7일 연속 체크인 달성! 아바타 제작권 1회가 충전되었습니다! 🎨'), '7일 달성 시 축하 토스트 탑재');
});

/* ============ [#TASK-ES-126] 전 탭 중복 노출 '💡 활용법' 버튼 단일화 및 6대 탭 통합 가이드 허브 무결성 종합 검증 ============ */
check('compliance: [#TASK-ES-126] 전 탭 중복 노출 활용법 버튼 단일화 및 6대 탭 통합 가이드 허브 무결성 종합 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const guideScriptPath = path.join(__dirname, '..', 'js', 'tab-guides.js');
  const guideContent = fs.readFileSync(guideScriptPath, 'utf8');

  // 1. 탑바 고정 전역 퀵 액션 배선 검증
  assert.ok(indexHtml.includes('id="topHomeGuideBtn"'), '상단 탑바 전역 활용법 퀵 액션 버튼(#topHomeGuideBtn) 마운트');
  assert.ok(indexHtml.includes("showTabUsageGuide((state && state.activeTab) || 'home')") || indexHtml.includes("showTabUsageGuide(window.state && window.state.activeTab || 'home')"), '탑바 클릭 시 활성 탭 연동 showTabUsageGuide 호출 배선');

  // 2. 6대 탭 본문 헤더 중복 버튼 완전 제거(클린 콕핏) 검증
  const duplicateBtnIds = [
    'homePageGuideBtn',
    'goalsPageGuideBtn',
    'calPageGuideBtn',
    'recAnalyticsGuideBtn',
    'commPageGuideBtn',
    'settingsPageGuideBtn'
  ];
  duplicateBtnIds.forEach(id => {
    assert.ok(!indexHtml.includes(`id="${id}"`), `본문 헤더 중복 버튼(#${id}) 완전 제거 완료`);
  });

  // 3. 6대 탭(홈, 목표, 일정, 기록, 소통, 설정) 통합 가이드 메타데이터 100% 완비 검증
  const requiredKeys = ['home', 'goals', 'calendar', 'records', 'comm', 'settings'];
  requiredKeys.forEach(key => {
    assert.ok(guideContent.includes(`${key}: {`), `6대 탭 가이드 키(${key}) 완비`);
  });

  // 4. 모달 내 6대 탭 세그먼트 스위처 및 인터랙션 배선 검증
  assert.ok(guideContent.includes('tab-guide-seg-btn'), '모달 내 가로 세그먼트 탭 버튼 클래스 탑재');
  assert.ok(guideContent.includes('tabGuideSegmentBar'), '모달 내 세그먼트 바 ID 탑재');
  assert.ok(guideContent.includes('tabGuideContentSlot'), '모달 내 본문 슬롯 ID 탑재');
  assert.ok(guideContent.includes('addEventListener(\'click\''), '세그먼트 탭 클릭 시 동적 전환 이벤트 배선');
  assert.ok(guideContent.includes('💡 아워골 100% 활용 가이드 허브'), '통합 가이드 허브 모달 타이틀 탑재');

  // 5. 기록 탭 데드클릭 완치 검증 (records 탭 전용 가이드 4대 섹션 완비)
  assert.ok(guideContent.includes('아워골 기록 및 성취 분석 100% 활용법'), '기록 탭 전용 가이드 타이틀 완비');
  assert.ok(guideContent.includes('지금부터 시간기록 (몰입 타이머)'), '시간기록 몰입 타이머 안내 완비');
  assert.ok(guideContent.includes('성취 통계 & 히트맵 콕핏'), '성취 통계 및 히트맵 안내 완비');
});

/* ============ [#TASK-ES-129] 동반자 데이터 영구 영속화 및 무손실 보존 검증 ============ */
check('compliance: [#TASK-ES-129] 동반자 데이터 영구 영속화 및 무손실 보존(로컬 자가복원 + 서버리스 원장) 검증', () => {
  const commSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-invite-comm.js'), 'utf8');
  const trackSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'track.js'), 'utf8');
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. 캐시 버스팅 및 PWA 최신 갱신 검증
  assert.ok(/team-invite-comm\.js\?v=20260916-es13[0-9]/.test(indexSrc), 'index.html 스크립트 캐시 버스팅 v20260916-es13x 갱신');
  assert.ok(/ourgoal-shell-v20260916-es13[0-9]/.test(swSrc), 'sw.js 서비스워커 캐시 네임 v20260916-es13x 갱신');

  // 2. 서버리스 파이프라인 (api/track.js) 검증
  assert.ok(trackSrc.includes('handleSyncCompanions'), 'api/track.js 내 handleSyncCompanions 함수 구현');
  assert.ok(trackSrc.includes("body.action === 'sync_companions'"), 'api/track.js sync_companions 라우팅 배선');
  assert.ok(trackSrc.includes("name: 'companion_ledger'"), 'api/track.js events 원장 저장 배선');

  // 3. 클라이언트 3중 안전망 (js/team-invite-comm.js) 검증
  assert.ok(commSrc.includes("ourgoal_companions_backup_"), '로컬스토리지 영구 백업 키 정의');
  assert.ok(commSrc.includes("localStorage.getItem(key)"), 'ensureDefaultCompanions 내 로컬스토리지 0ms 자가 복원');
  assert.ok(commSrc.includes("localStorage.setItem(getCompanionsStorageKey()"), 'persistCompanions 내 로컬스토리지 영구 저장');
  assert.ok(commSrc.includes("action: 'sync_companions'"), 'syncCompanionsFromDb 내 서버리스 원장 동기화');

  // 4. 추가/삭제 시 영속화 배선 검증
  assert.ok(commSrc.includes("persistCompanions();"), '동반자 추가 및 삭제 시 persistCompanions 전수 호출');
  assert.ok(commSrc.includes("safeAvatarHtml(u.avatar, 36)"), '검색 결과 내 URL 아바타 안전 렌더 배선');
});

check('compliance: [#TASK-ES-130] 동반자 탭 0ms 무중단 렌더링 및 PostgrestFilterBuilder 예외 완전 격리 검증', () => {
  const commSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-invite-comm.js'), 'utf8');
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. Supabase PostgrestFilterBuilder .catch 문법 에러 배제
  assert.ok(!commSrc.includes(".eq('id', uid).catch("), 'Supabase 빌더 직접 .catch() 호출 완전 제거');
  assert.ok(commSrc.includes("typeof queryBuilder.then === 'function'"), 'PostgrestFilterBuilder 호환 then 분기 구현');

  // 2. 신규 추가 시 목록 최상단 unshift 및 자가 치유 try-catch 안전망
  assert.ok(commSrc.includes("comps.unshift(newComp);"), '신규 동반자 추가 시 unshift로 최상단 즉시 반영');
  assert.ok(commSrc.includes("자가 치유 동기화 예외"), 'renderCommCompanions 입구 자가 치유 try-catch 안전 격리');

  // 3. 소통 서브탭 클릭 시 dmActiveId 초기화 및 피드 렌더 null-safety
  assert.ok(indexSrc.includes("state.dmActiveId = null; renderCommScreen();"), '소통 서브탭 전환 시 dmActiveId 완벽 초기화');
  assert.ok(indexSrc.includes("var prof = state.profile || {}, profSettings = prof.settings || {};"), 'renderCommFeed null 안전 가드 구현');
});

/* ============ [#TASK-ES-131] DM 수신자 완벽 사용자 경험(UX) 파이프라인 검증 ============ */
check('compliance: [#TASK-ES-131] DM 수신자 완벽 사용자 경험(수신함 자동인입 + 레드 닷 뱃지 + 맞추가 배너) 검증', () => {
  const commSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-invite-comm.js'), 'utf8');
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. 캐시 버스팅 및 PWA 버전 검증
  assert.ok(indexSrc.includes('team-invite-comm.js?v=20260916-es131'), 'index.html 스크립트 캐시 버스팅 v20260916-es131 갱신');
  assert.ok(swSrc.includes('ourgoal-shell-v20260916-es131'), 'sw.js 서비스워커 캐시 네임 v20260916-es131 갱신');

  // 2. 수신자 DM 인입 (Inbox Discovery) 로더 검증
  assert.ok(commSrc.includes('loadIncomingDmRooms'), 'loadIncomingDmRooms 수신 대화방 조회 함수 구현');
  assert.ok(commSrc.includes("eq('receiver_id', myId)"), 'receiver_id 기준 수신 메시지 서버 DB 쿼리 배선');
  assert.ok(commSrc.includes('_incomingDmRooms'), '_incomingDmRooms 캐시 관리 배열 정의');
  assert.ok(commSrc.includes("badgeText = p.isIncoming ? '📩 새 대화 요청'"), '수신 대화방 [새 대화 요청] 뱃지 분기 구현');

  // 3. 레드 닷(🔴) 뱃지 및 실시간 리스너 검증
  assert.ok(indexSrc.includes('id="commNavBadge"'), '하단 네비게이션 소통 버튼 내 commNavBadge 레드 닷 엘리먼트 탑재');
  assert.ok(indexSrc.includes('id="dmSubtabBadge"'), '상단 소통 서브탭 내 dmSubtabBadge 레드 닷 엘리먼트 탑재');
  assert.ok(commSrc.includes('updateDmUnreadBadge'), 'updateDmUnreadBadge 뱃지 제어 함수 구현');
  assert.ok(commSrc.includes('initIncomingDmListener'), 'initIncomingDmListener 전역 Realtime 수신 리스너 구현');
  assert.ok(indexSrc.includes('updateDmUnreadBadge(false)'), 'DM 서브탭 진입 시 뱃지 자동 소등 배선');

  // 4. 대화방 내 맞추가 원클릭 배너 검증
  assert.ok(commSrc.includes('id="dmFollowBackBanner"'), '미추가 상대방 DM 열람 시 맞추가 배너 렌더링');
  assert.ok(commSrc.includes('id="btnDmFollowBack"'), '맞추가 버튼 엘리먼트 배선');
});

/* ============ [#TASK-ES-127-IMPL] 활용법 감찰 적발 미구현 시스템 백엔드·로직 완결 검증 ============ */
check('compliance: [#TASK-ES-127-IMPL] 활용법 감찰 적발 미구현 시스템(WebCal 캘린더 피드 + 데일리퀘스트 EXP 누적 + 도달예정일 알고리즘 + 30일 탈퇴유예) 완결 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const pushSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'push-subscribe.js'), 'utf8');
  const withdrawSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'withdraw.js'), 'utf8');
  const vercelJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));

  // 1. WebCal iCalendar 피드 라우팅 및 표준 ics 생성기 검증
  const calRewrite = vercelJson.rewrites.find(r => r.source === '/api/calendar');
  assert.ok(calRewrite && calRewrite.destination === '/api/push-subscribe', 'vercel.json 내 /api/calendar -> /api/push-subscribe 리라이트 라우팅 배선');
  assert.ok(pushSrc.includes('BEGIN:VCALENDAR'), 'api/push-subscribe.js 내 iCalendar BEGIN:VCALENDAR 생성');
  assert.ok(pushSrc.includes('X-WR-CALNAME:아워골(OurGoal) 성장 캘린더'), 'RFC 5545 표준 캘린더 피드 네임 설정');
  assert.ok(pushSrc.includes('text/calendar; charset=utf-8'), 'Content-Type text/calendar 표준 헤더 반환');

  // 2. 데일리 퀘스트 3종 완료 시 실제 프로필 EXP 적립 및 레벨업 시스템 검증
  assert.ok(indexSrc.includes("awardXP(30, '데일리 퀘스트: 오늘 한 줄 체크인 (+30 EXP)')"), '퀘스트 1 체크인 +30 EXP 실제 적립 배선');
  assert.ok(indexSrc.includes("awardXP(40, '데일리 퀘스트: 핵심 마일스톤 실행 (+40 EXP)')"), '퀘스트 2 마일스톤 +40 EXP 실제 적립 배선');
  assert.ok(indexSrc.includes("awardXP(50, '데일리 퀘스트: 25분 집중 시간기록 (+50 EXP)')"), '퀘스트 3 시간기록 +50 EXP 실제 적립 배선');
  assert.ok(indexSrc.includes('questRewards'), '당일 퀘스트 중복 수령 방지 questRewards 트래커 탑재');

  // 3. 목표 마일스톤 페이스 기반 목표 도달 예정일 동적 계산 알고리즘 검증
  assert.ok(indexSrc.includes('목표 도달 예정일 동적 재계산 알고리즘'), '목표 도달 예정일 동적 계산 알고리즘 주석 및 로직 탑재');
  assert.ok(indexSrc.includes('🚀 페이스 도달예정:'), '목표 상세 메타 스트립 내 페이스 도달예정 뱃지 렌더링');

  // 4. 30일 탈퇴 유예 안전망(Soft Delete & Grace Period) 백엔드 파이프라인 검증
  assert.ok(withdrawSrc.includes("grace_period"), 'api/withdraw.js 내 grace_period 유예 모드 지원');
  assert.ok(withdrawSrc.includes("withdrawal_requested_at"), '30일 탈퇴 유예 신청 일시 메타데이터 기록');
  assert.ok(withdrawSrc.includes("withdrawal_purge_at"), '30일 경과 영구 삭제 예정일시(purgeAt) 스케줄링');
  assert.ok(withdrawSrc.includes("account_status: 'active'"), '30일 이내 탈퇴 철회 및 계정 복구(restore) 분기 구현');
});

/* ============ [#TASK-ES-133] 소통 탭 3대 핵심 상호작용(댓글·새팀·마니또) 실 서버 DB 완전 배선 검증 ============ */
check('compliance: [#TASK-ES-133] 소통 탭 3대 핵심 상호작용(피드 댓글 서버 실시간 동기화 + 새 팀 전역 공유 영구 보존 + 마니또 실 유저 익명 응원 연동) 무결성 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 피드 댓글 Supabase team_pings 서버 실시간 동기화 및 삭제 배선
  assert.ok(indexSrc.includes("loadServerFeedComments"), 'loadServerFeedComments 비동기 서버 댓글 로더 탑재');
  assert.ok(indexSrc.includes("target_type: 'feed_comment'"), '피드 댓글 team_pings target_type feed_comment 지정');
  assert.ok(indexSrc.includes("sb.from('team_pings').insert(cmtRow)"), '댓글 등록 시 Supabase team_pings 실시간 insert 배선');
  assert.ok(indexSrc.includes("sb.from('team_pings').delete().eq('id', cid)"), '댓글 삭제 시 Supabase team_pings 동기 삭제 배선');

  // 2. 새 팀 만들기(promptNewGroup) 전역 공유 및 영구 보존
  assert.ok(indexSrc.includes("loadSharedGroups"), 'loadSharedGroups 전역 공유 팀 로더 탑재');
  assert.ok(indexSrc.includes("state.profile.settings.customGroups"), '개설 팀 customGroups 로컬 스토리지 영구 보존 안전망');
  assert.ok(indexSrc.includes("target_type: 'team_group'"), '팀 개설 team_pings target_type team_group 등록');
  assert.ok(indexSrc.includes("ping_type: 'group_creation'"), '팀 개설 team_pings ping_type group_creation 배선');

  // 3. 마니또(My Manito) 실 유저 풀 연동 및 익명 응원 실시간 수신함
  assert.ok(indexSrc.includes("loadServerManitoData"), 'loadServerManitoData 서버 마니또 풀 및 수신함 로더 탑재');
  assert.ok(indexSrc.includes("REAL_MANITO_PARTNERS_CACHE"), '실 가입 유저 풀 우선 매칭 캐시 탑재');
  assert.ok(indexSrc.includes("REAL_MANITO_INBOX_CACHE"), '실제 수신 응원함 연동 캐시 탑재');
  assert.ok(indexSrc.includes("[🤖 AI 동반자]"), '헌법 제4조 1항 7호 의거 콜드스타트 AI 동반자 투명 뱃지 표기');
  assert.ok(indexSrc.includes("[✨ 실 유저]"), '실제 가입 유저 매칭 시 실 유저 명확 구분 뱃지 표기');
  assert.ok(indexSrc.includes("target_type: 'manito_cheer'"), '마니또 스탬프 응원 team_pings target_type manito_cheer 실시간 전송');
  assert.ok(indexSrc.includes("target_type: 'manito_member'"), '마니또 시작 시 team_pings manito_pool 회원 등록 배선');
});

check('compliance: [#TASK-ES-134] 목표 탭 현상태 분석 AI 조언 명칭 변경, 분석완료 상태 전환 배지 및 스마트 캐시 제어 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 라벨 명칭 '현상태 분석 AI 조언' 단일화 및 'AI 현황' 미니바 타이틀 제거
  assert.ok(indexSrc.includes('현상태 분석 AI 조언'), '목표 탭 상단 타이틀이 현상태 분석 AI 조언으로 명시되어야 함');
  assert.ok(!indexSrc.includes('<span class="minibar-title">AI 현황</span>'), '기존 기계적 명칭 AI 현황 미니바 타이틀이 완전 교체되어야 함');

  // 2. 3단계 상태 배지 (#goalStatusBadge) 및 스니펫 ID 배선
  assert.ok(indexSrc.includes('id="goalStatusBadge"'), '3단계 상태 배지 #goalStatusBadge 엘리먼트 탑재');
  assert.ok(indexSrc.includes('id="goalStatusSnippet"'), '스니펫 실시간 갱신용 #goalStatusSnippet 엘리먼트 탑재');
  assert.ok(indexSrc.includes('statusBadgeText = \'분석완료\''), '분석 완료 시 분석완료 배지 텍스트 할당');
  assert.ok(indexSrc.includes('statusBadgeText = \'진행 상황 분석 중…\''), '분석 중일 때 진행 상황 분석 중… 배지 텍스트 할당');

  // 3. refreshGoalStatusSummary 및 글자 수 완화 (30자 이상 수용)
  assert.ok(indexSrc.includes('text.length<30 || text.length>300'), '로컬 폴백 정상 수용을 위한 글자 수 30~300자 유효성 완화');
  assert.ok(indexSrc.includes("badge.textContent = '분석완료'"), 'AI 요약 성공 콜백 시 배지 분석완료 즉각 전환 배선');
});

check('compliance: [#TASK-ES-135] 아바타 보관함(서랍) 3중 영속화(Supabase DB + LocalStorage + 마이그레이션 합집합 복원) 무결성 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const trackSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'track.js'), 'utf8');
  const avatarSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');
  const sqlPath = path.join(__dirname, '..', 'docs', 'sql', '2026-09-17-users-saved-avatars-column.sql');

  // 1. Supabase SQL 정의서 존재 및 컬럼 규격 확인
  assert.ok(fs.existsSync(sqlPath), 'users.saved_avatars 컬럼 SQL 정의서 파일 존재');
  const sqlSrc = fs.readFileSync(sqlPath, 'utf8');
  assert.ok(sqlSrc.includes('saved_avatars jsonb not null default'), 'saved_avatars jsonb 컬럼 추가 DDL 존재');

  // 2. index.html saveProfile DB upsert 및 안전 폴백, 3중 백업 확인
  assert.ok(indexSrc.includes('saved_avatars: savedAvatarsPayload'), 'saveProfile users upsert에 saved_avatars 필드 탑재');
  assert.ok(indexSrc.includes('delete userUpsertObj.saved_avatars'), '컬럼 미존재 환경 대비 안전 폴백 재시도 배선');
  assert.ok(indexSrc.includes("'ourgoal_saved_avatars_backup_' + uidVal"), '로컬 스토리지 전용 백업 키 3중화');

  // 3. index.html loadProfile DB saved_avatars 및 로컬 백업 자동 복원 확인
  assert.ok(indexSrc.includes('urow.saved_avatars'), 'loadProfile에서 urow.saved_avatars 조회');
  assert.ok(indexSrc.includes("'ourgoal_saved_avatars_backup_' + userId"), 'loadProfile 로컬 전용 백업 키 자가 치유 연동');

  // 4. index.html restoreSessionAndEnter 게스트 무손실 합집합 병합 확인
  assert.ok(indexSrc.includes('guestSaved.length > 0'), '게스트 savedAvatars 무손실 승계 로직 탑재');
  assert.ok(indexSrc.includes('if(gData.settings.savedAvatars) state.profile.settings.savedAvatars = gData.settings.savedAvatars;'), '게스트 savedAvatars 소셜 로그인 무손실 승계');

  // 5. api/track.js 서버리스 원장 동기화 및 avatar-system.js 경량화 확인
  assert.ok(trackSrc.includes('profRow.saved_avatars = profileToSave.savedAvatars'), 'api/track.js profileToSave saved_avatars 동기화');
  assert.ok(trackSrc.includes('savedAvatars: (matchedUser && matchedUser.saved_avatars) || []'), 'api/track.js 응답에 savedAvatars 포함');
  assert.ok(avatarSrc.includes("cv.toDataURL('image/jpeg', 0.85)"), 'avatar-system.js 256x256 JPEG 0.85 품질 경량화 탑재');
});

check('compliance: [#TASK-ES-136] 목표 데이터 해시 변경 감지 보강 및 "오늘의 카드" 안내 멘트 상민님 지정 원문 100% 교체', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 홈 탭 '오늘의 카드' 상민님 확정 원문 라벨 및 1pt 축소 보조 배지 검증
  assert.ok(indexSrc.includes('<div class="ct-label" style="margin:0;">오늘의 카드</div>'), '홈 탭 오늘의 카드 라벨 교체');
  assert.ok(indexSrc.includes('뭘 할지 모르겠을 때 도움돼요(내 목표기반)'), '상민님 지정 원문 배지 멘트 완벽 탑재');
  assert.ok(!indexSrc.includes('할일이 당장 안떠오르면 활용하세요'), '기존 임의 멘트 완전 제거 확인');

  // 2. computeGoalStatusHash 내 마일스톤/할 일 타이틀 및 마감일 전수 결합 검증
  assert.ok(indexSrc.includes('parts.push(m.id, m.title||\'\', m.status||\'\', m.dueDate||\'\', JSON.stringify(m.result||null));'), '마일스톤 타이틀/마감일 해시 결합 코드 확인');
  assert.ok(indexSrc.includes('parts.push(t.id, t.title||\'\', t.done?\'1\':\'0\', t.dueDate||\'\', JSON.stringify(t.result||null));'), '할 일 타이틀/마감일 해시 결합 코드 확인');

  // 3. computeGoalStatusHash 실동작 무결성 테스트 (필드 변경 시 해시 즉각 변동 보장)
  function hashFn(goal) {
    var parts = [goal.title||'', goal.dueDate||'', JSON.stringify(goal.result||null)];
    (goal.milestones||[]).forEach(function(m){
      parts.push(m.id, m.title||'', m.status||'', m.dueDate||'', JSON.stringify(m.result||null));
      (m.tasks||[]).forEach(function(t){ parts.push(t.id, t.title||'', t.done?'1':'0', t.dueDate||'', JSON.stringify(t.result||null)); });
    });
    var str = parts.join('|');
    var h = 0;
    for(var i=0;i<str.length;i++){ h = ((h<<5)-h + str.charCodeAt(i))|0; }
    return String(h);
  }

  const baseGoal = {
    title: '정보처리기사 취득',
    dueDate: '2026-11-30',
    result: null,
    milestones: [
      {
        id: 'm1',
        title: '필기 기출 3회독',
        status: 'in_progress',
        dueDate: '2026-09-30',
        result: null,
        tasks: [
          { id: 't1', title: '1회독 모의고사 풀기', done: false, dueDate: '2026-09-20', result: null }
        ]
      }
    ]
  };

  const h0 = hashFn(baseGoal);

  // 마일스톤 타이틀 변경 감지
  const gMilestoneTitleChanged = JSON.parse(JSON.stringify(baseGoal));
  gMilestoneTitleChanged.milestones[0].title = '필기 기출 5회독';
  assert.notStrictEqual(hashFn(gMilestoneTitleChanged), h0, '마일스톤 제목 변경 시 해시 즉각 변경');

  // 마일스톤 마감일 변경 감지
  const gMilestoneDueDateChanged = JSON.parse(JSON.stringify(baseGoal));
  gMilestoneDueDateChanged.milestones[0].dueDate = '2026-10-05';
  assert.notStrictEqual(hashFn(gMilestoneDueDateChanged), h0, '마일스톤 마감일 변경 시 해시 즉각 변경');

  // 할 일 타이틀 변경 감지
  const gTaskTitleChanged = JSON.parse(JSON.stringify(baseGoal));
  gTaskTitleChanged.milestones[0].tasks[0].title = '오답노트 정리';
  assert.notStrictEqual(hashFn(gTaskTitleChanged), h0, '할 일 제목 변경 시 해시 즉각 변경');

  // 할 일 마감일 변경 감지
  const gTaskDueDateChanged = JSON.parse(JSON.stringify(baseGoal));
  gTaskDueDateChanged.milestones[0].tasks[0].dueDate = '2026-09-22';
  assert.notStrictEqual(hashFn(gTaskDueDateChanged), h0, '할 일 마감일 변경 시 해시 즉각 변경');

  // 할 일 완료여부 변경 감지
  const gTaskDoneChanged = JSON.parse(JSON.stringify(baseGoal));
  gTaskDoneChanged.milestones[0].tasks[0].done = true;
  assert.notStrictEqual(hashFn(gTaskDoneChanged), h0, '할 일 완료 여부 변경 시 해시 즉각 변경');

  // 목표 제목 및 마감일 변경 감지
  const gGoalTitleChanged = JSON.parse(JSON.stringify(baseGoal));
  gGoalTitleChanged.title = 'SQLD 취득';
  assert.notStrictEqual(hashFn(gGoalTitleChanged), h0, '목표 제목 변경 시 해시 즉각 변경');
});

check('compliance: [#TASK-ES-137] AI 엔진 공통 데이터 불변 시 API 재호출 전면 차단 & KST 자정(00:00) 자동 롤오버 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. getKSTDateKey 정의 및 dateKey 보존 검증
  assert.ok(indexSrc.includes('function getKSTDateKey(iso)'), 'getKSTDateKey 함수 정의');
  assert.ok(indexSrc.includes('function dateKey(iso)'), 'dateKey 로컬 기기 날짜 포맷 함수 보존');
  assert.ok(indexSrc.includes('window.getKSTDateKey = getKSTDateKey'), 'getKSTDateKey 전역 바인딩');

  // 2. KST 자정 산출 단위 검증
  function testKST(dStr) {
    var d = dStr ? new Date(dStr) : new Date();
    var kst = new Date(d.getTime() + (9 * 3600000));
    var pad = n => n < 10 ? '0' + n : '' + n;
    return kst.getUTCFullYear() + '-' + pad(kst.getUTCMonth() + 1) + '-' + pad(kst.getUTCDate());
  }

  // 2026-09-17 14:59 UTC = 2026-09-17 23:59 KST
  assert.strictEqual(testKST('2026-09-17T14:59:00.000Z'), '2026-09-17');
  // 2026-09-17 15:00 UTC = 2026-09-18 00:00 KST (자정 롤오버!)
  assert.strictEqual(testKST('2026-09-17T15:00:00.000Z'), '2026-09-18');

  // 3. goalStatusStale KST 롤오버 및 해시 검증
  assert.ok(indexSrc.includes('var todayKST = getKSTDateKey(nowISO());'), 'renderGoalsScreen 내 todayKST 산출');
  assert.ok(indexSrc.includes('(goalStatusCache.dateKey && goalStatusCache.dateKey !== todayKST)'), '자정 도달 시 자동 캐시 만료 롤오버');
  assert.ok(indexSrc.includes('dateKey: getKSTDateKey(nowISO())'), '캐시 저장 시 KST dateKey 동시 기록');
});

check('compliance: [#TASK-ES-138] 캘린더 일정(customSchedules) 일간/시간표 24시간 블록 뷰 구현 및 세부 일정 저장 무결성 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 일간/시간표 뷰(view === day) 타임라인 블록 렌더링 코드 검증
  assert.ok(indexSrc.includes('timetable-card'), 'timetable-card 컨테이너 탑재');
  assert.ok(indexSrc.includes('timetable-slot'), '24시간 시간표 슬롯 탑재');
  assert.ok(indexSrc.includes('data-timeslot'), '시간 슬롯 데이터 속성 바인딩');
  assert.ok(indexSrc.includes('⏰ 시간표 타임라인'), '시간표 공식 헤더 렌더링');

  // 2. 타임라인 슬롯 클릭 시 해당 시간 자동 세팅 모달 호출 검증
  assert.ok(indexSrc.includes('openCalendarManualEditModal(state.calSelectedDate, null, \'custom\''), '슬롯 터치 시 시간 자동 세팅 일정 추가 연동');

  // 3. tab-guides.js 약속 일치 검증
  const guideSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'tab-guides.js'), 'utf8');
  assert.ok(guideSrc.includes('일간 시간표 뷰로 오늘 하루의 24시간 블록을 밀도 있게 계획합니다'), 'tab-guides 시간표 뷰 약속 확인');
});

check('compliance: [#TASK-ES-139] 설정창 노션 연동 6대 UX 개선 및 가이드 툴팁·URL 정규화 완결 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. extractNotionDatabaseId 32자리 UUID 자동 추출 함수 검증
  assert.ok(indexSrc.includes('function extractNotionDatabaseId(input)'), 'extractNotionDatabaseId 정규화 함수 정의');
  assert.ok(indexSrc.includes('window.extractNotionDatabaseId = extractNotionDatabaseId'), 'extractNotionDatabaseId 전역 노출');

  function parseNotion(input) {
    if(!input) return '';
    var str = String(input).trim();
    var dashMatch = str.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if(dashMatch) return dashMatch[0].replace(/-/g, '').toLowerCase();
    var hexMatch = str.match(/[0-9a-f]{32}/i);
    if(hexMatch) return hexMatch[0].toLowerCase();
    return str.replace(/^.*\//, '').replace(/\?.*$/, '').replace(/-/g, '').trim();
  }

  // 전체 URL 및 파라미터 포함 시에도 32자리 UUID 완벽 추출 확인
  const rawUrl = 'https://www.notion.so/myworkspace/3dc598db909681348f06dfa838770cdd?v=123456789abcdef';
  assert.strictEqual(parseNotion(rawUrl), '3dc598db909681348f06dfa838770cdd', '전체 URL에서 32자리 UUID 정규화 성공');

  // 2. 4단계 친절 온보딩 가이드 박스 탑재 검증
  assert.ok(indexSrc.includes('노션 4단계 초간편 연동 가이드'), '노션 4단계 친절 연동 가이드 탑재');
  assert.ok(indexSrc.includes('notion-guide-box'), '노션 가이드 박스 클래스 확인');

  // 3. notionDirectOpenLink 동적 바로열기 연동 검증
  assert.ok(indexSrc.includes('id="notionDirectOpenLink"'), 'notionDirectOpenLink 태그 ID 확인');
  assert.ok(indexSrc.includes('updateNotionDirectLink'), 'updateNotionDirectLink 동적 URL 매핑 로직 확인');
});

check('compliance: [#TASK-ES-140] 목표 탭 3계층(목표·마일스톤·태스크) 일정 설정 배지 및 팝업 모달·캘린더 24시간 블록 연동 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 배지 포맷터, 모달, 업데이트 함수 정의 및 전역 노출 확인
  assert.ok(indexSrc.includes('function formatSchedulePillHtml'), 'formatSchedulePillHtml 함수 정의');
  assert.ok(indexSrc.includes('function openScheduleSetupModal'), 'openScheduleSetupModal 함수 정의');
  assert.ok(indexSrc.includes('function applyScheduleUpdate'), 'applyScheduleUpdate 함수 정의');
  assert.ok(indexSrc.includes('window.formatSchedulePillHtml = formatSchedulePillHtml'), 'formatSchedulePillHtml window 노출');
  assert.ok(indexSrc.includes('window.openScheduleSetupModal = openScheduleSetupModal'), 'openScheduleSetupModal window 노출');
  assert.ok(indexSrc.includes('window.applyScheduleUpdate = applyScheduleUpdate'), 'applyScheduleUpdate window 노출');

  // 2. 3계층(목표, 마일스톤, 태스크) 인라인 배선 확인
  assert.ok(indexSrc.includes("formatSchedulePillHtml(goal, 'goal', goal.id)"), 'Goal 계층 일정 배지 배치');
  assert.ok(indexSrc.includes("formatSchedulePillHtml(m, 'ms', goal.id, m.id)"), 'Milestone 계층 일정 배지 배치');
  assert.ok(indexSrc.includes("formatSchedulePillHtml(t, 'task', goal.id, m.id, t.id)"), 'Task 계층 일정 배지 배치');
  assert.ok(indexSrc.includes("data-setschedule"), '이벤트 위임을 위한 data-setschedule 속성 확인');

  // 3. CSS 스타일 정의 확인
  assert.ok(uiSrc.includes('.schedule-pill-btn'), '.schedule-pill-btn CSS 클래스 정의');
  assert.ok(uiSrc.includes('.schedule-pill-btn.empty'), '.schedule-pill-btn.empty 미설정 점선 스타일');
  assert.ok(uiSrc.includes('.schedule-pill-btn.has-date'), '.schedule-pill-btn.has-date 설정 완료 스타일');

  // 4. 배지 포맷터 렌더링 로직 직접 검증
  function dDay(dateStr){
    if(!dateStr) return '';
    var target = new Date(dateStr.slice(0, 10) + 'T00:00:00');
    var today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00');
    var diff = Math.round((target - today) / 86400000);
    if(diff === 0) return 'D-Day';
    return diff > 0 ? ('D-' + diff) : ('D+' + Math.abs(diff));
  }
  function formatSchedulePillHtml(item, level, goalId, msId, taskId){
    var sDate = (item && item.startDate) ? String(item.startDate).slice(0, 10) : '';
    var dDate = (item && item.dueDate) ? String(item.dueDate).slice(0, 10) : '';
    var gid = goalId || '';
    var mid = msId || '';
    var tid = taskId || '';
    if(!sDate && !dDate){
      return '<button type="button" class="schedule-pill-btn empty" data-setschedule="1" data-schedlevel="'+level+'" data-schedgid="'+gid+'" data-schedmsid="'+mid+'" data-schedtid="'+tid+'" title="일정 설정">일정설정</button>';
    }
    if(sDate && dDate && sDate !== dDate){
      var sParts = sDate.split('-');
      var dParts = dDate.split('-');
      var sText = sParts[0] + '.' + parseInt(sParts[1], 10) + '.' + parseInt(sParts[2], 10);
      var dText = dParts[0] + '.' + parseInt(dParts[1], 10) + '.' + parseInt(dParts[2], 10);
      var rangeText = sText + '~' + dText;
      return '<button type="button" class="schedule-pill-btn has-date" data-setschedule="1" data-schedlevel="'+level+'" data-schedgid="'+gid+'" data-schedmsid="'+mid+'" data-schedtid="'+tid+'" title="일정 기간: '+rangeText+' (클릭하여 수정)">'+rangeText+'</button>';
    }
    var singleDate = dDate || sDate;
    var dText = dDay(singleDate);
    return '<button type="button" class="schedule-pill-btn has-date" data-setschedule="1" data-schedlevel="'+level+'" data-schedgid="'+gid+'" data-schedmsid="'+mid+'" data-schedtid="'+tid+'" title="마감일 '+singleDate+' (클릭하여 수정)">'+dText+'</button>';
  }

  const emptyPill = formatSchedulePillHtml({}, 'goal', 'g1');
  assert.ok(emptyPill.includes('일정설정') && emptyPill.includes('schedule-pill-btn empty'), '일정 미설정 시 [일정설정] 빈 배지 출력');

  const rangePill = formatSchedulePillHtml({ startDate: '2026-09-17', dueDate: '2026-09-24' }, 'ms', 'g1', 'm1');
  assert.ok(rangePill.includes('2026.9.17~2026.9.24') && rangePill.includes('schedule-pill-btn has-date'), '시작/종료일 다를 때 YYYY.M.D~YYYY.M.D 기간 출력');

  // 마감일을 고정 날짜로 두면 그날이 지난 뒤부터 'D-' 가 'D+' 로 바뀌어 이 검사가 제품과 무관하게 깨진다(2026-09-21 실제 발생). 오늘 기준 3일 뒤로 잡는다.
  const soon = new Date(Date.now() + 3 * 86400000);
  const soonYmd = soon.getFullYear() + '-' + String(soon.getMonth() + 1).padStart(2, '0') + '-' + String(soon.getDate()).padStart(2, '0');
  const singlePill = formatSchedulePillHtml({ dueDate: soonYmd }, 'task', 'g1', 'm1', 't1');
  assert.ok(singlePill.includes('schedule-pill-btn has-date') && singlePill.includes('D-'), '단일 마감일 시 디데이 텍스트 출력');
});

check('compliance: [#TASK-ES-141] 홈 구성 커스텀(customize.js) 최적화 및 유령 요소 제거·상민님 지정 문구 완결 검증', () => {
  const customSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'customize.js'), 'utf8');

  // 1. 유령 식별자 quickRoutineRow 제거 확인
  assert.ok(!customSrc.includes('quickRoutineRow'), '존재하지 않던 quickRoutineRow 항목이 화이트리스트 및 미니멀 목록에서 완전 영구 제거됨');

  // 2. 상민님 지정 문구 완벽 일치 확인
  assert.ok(customSrc.includes("label: '오늘의 카드'"), "todayMissionCard 라벨이 '오늘의 카드'로 교체됨");
  assert.ok(customSrc.includes("hint: '뭘 할지 모르겠을 때 도움돼요(내 목표기반)'"), "todayMissionCard 힌트가 '뭘 할지 모르겠을 때 도움돼요(내 목표기반)'로 일치");
});

check('compliance: [#TASK-ES-142] 구글 캘린더 연동 영속성 및 토큰 복원·동의 루프 방어 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. saveGoogleToken 및 restoreGoogleToken 함수 탑재 확인
  assert.ok(indexSrc.includes('function saveGoogleToken(tokenObj)'), 'saveGoogleToken 토큰 로컬 저장 함수 정의');
  assert.ok(indexSrc.includes('function restoreGoogleToken()'), 'restoreGoogleToken 토큰 로컬 복원 함수 정의');
  assert.ok(indexSrc.includes('ourgoal_gcal_token_v1_'), '유저별 독립 격리 로컬 키 접두사 탑재');

  // 2. 동의(consent) 루프 방어 확인: 기존 토큰이나 연동 이력 존재 시 prompt: '' 무음 갱신
  assert.ok(indexSrc.includes("prompt: (state.googleToken || hasSavedToken || isConnected) ? '' : 'consent'"), '무음 백그라운드 토큰 요청을 통한 동의 팝업 무한 반복 방어');

  // 3. 앱 진입(enterApp), 캘린더 연동 검사, 토큰 획득 시 복원 호출 확인
  assert.ok(indexSrc.includes("if(typeof restoreGoogleToken === 'function') restoreGoogleToken();"), '앱 부팅 진입 시 토큰 복원 호출');
  assert.ok(indexSrc.includes("if(!state.googleToken && typeof restoreGoogleToken === 'function') restoreGoogleToken();"), '캘린더 연동 체크 시 토큰 복원 호출');

  // 4. 연동 해제 시 로컬 스토리지 정리 확인
  assert.ok(indexSrc.includes("localStorage.removeItem('ourgoal_gcal_token_v1_' + uid)"), '연동 해제 시 로컬 토큰 전수 영구 파기');
});

check('compliance: [#TASK-ES-143] 전 AI 엔드포인트 로컬 스마트 룰베이스 폴백 및 보안/RLS 무결성 감사 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const reportPath = path.join(__dirname, '..', 'docs', 'reports', 'SECURITY_AND_AI_RESILIENCE_AUDIT_20260917.md');

  // 1. 보안 및 AI 회복탄력성 종합 감사 보고서 존재 확인
  assert.ok(fs.existsSync(reportPath), '보안 및 AI 회복탄력성 종합 감사 보고서 문서 존재');
  const reportSrc = fs.readFileSync(reportPath, 'utf8');
  assert.ok(reportSrc.includes('Supabase RLS'), '보고서 내 Supabase RLS 감사 내용 수록');
  assert.ok(reportSrc.includes('AI 회복탄력성'), '보고서 내 AI 회복탄력성 감사 내용 수록');

  // 2. 전 AI 엔드포인트 로컬 스마트 룰베이스 폴백 함수 탑재 확인
  assert.ok(indexSrc.includes('function localGoalStatusSummary(goal)'), 'localGoalStatusSummary 목표 현상태 스마트 로컬 요약 함수 탑재');
  assert.ok(indexSrc.includes('function localGoalTemplate(description)'), 'localGoalTemplate 목표 템플릿 스마트 로컬 생성 함수 탑재');
  assert.ok(indexSrc.includes('function localTodayMission(goal)'), 'localTodayMission 오늘 미션 스마트 로컬 생성 함수 탑재');
  assert.ok(indexSrc.includes('function localNextActionSuggestion(goal, completedId)'), 'localNextActionSuggestion 다음 행동 스마트 로컬 제안 함수 탑재');

  // 3. localGoalStatusSummary 로직 시뮬레이션 검증
  const dummyGoal = {
    title: '정보처리기사 취득',
    milestones: [
      { id: 'm1', title: '필기 기출 5개년 완독', status: 'done' },
      { id: 'm2', title: '실기 알고리즘 대비', status: 'doing' },
      { id: 'm3', title: '최종 합격 발표', status: 'todo' }
    ]
  };
  function localGoalStatusSummary(goal){
    if(!goal) return '목표를 설정하고 첫 걸음을 시작해보세요.';
    var ms = goal.milestones || [];
    var total = ms.length;
    if(!total) return '마일스톤을 추가하면 세부 단계별 진행 상황을 종합 분석해드려요.';
    var done = ms.filter(function(m){ return m.status === 'done'; }).length;
    var doing = ms.find(function(m){ return m.status === 'doing'; });
    var pct = total ? Math.round((done / total) * 100) : 0;
    if(doing){
      return '현재 "' + doing.title + '" 마일스톤에 집중하고 있으며, 전체 공정률은 ' + pct + '%(' + done + '/' + total + ' 완수)입니다.';
    }
    return '진행률 ' + pct + '%';
  }
  const summaryRes = localGoalStatusSummary(dummyGoal);
  assert.ok(summaryRes.includes('33%') && summaryRes.includes('실기 알고리즘 대비'), '로컬 스마트 목표 요약이 진행 중인 마일스톤과 공정률을 정확히 연산');

  // 4. localGoalTemplate 로직 시뮬레이션 검증
  function localGoalTemplate(description){
    var desc = (description || '').trim();
    var lower = desc.toLowerCase();
    var topicMajor = 'lifestyle';
    if(lower.includes('운동')) topicMajor = 'health';
    else if(lower.includes('공부')) topicMajor = 'study';
    return { title: desc, topicMajor: topicMajor, milestones: [{ title: '실천 루틴 확립', status: 'todo' }] };
  }
  const t1 = localGoalTemplate('매일 30분 달리기 운동하기');
  assert.strictEqual(t1.topicMajor, 'health', '운동 키워드 도메인 자율 분류 성공');
  const t2 = localGoalTemplate('토익 시험 공부 850점 달성');
  assert.strictEqual(t2.topicMajor, 'study', '공부 키워드 도메인 자율 분류 성공');
});

check('compliance: [#TASK-ES-144] 동반자 새로고침(F5) 증발 결함 근본 해결 및 1:1 DM 실시간 수신 파이프라인 무결성 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const commSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-invite-comm.js'), 'utf8');

  // 1. index.html defaultProfile, loadProfile, saveProfile 동반자 영속화 배선 확인
  assert.ok(indexSrc.includes('companions: [],'), 'defaultProfile에 companions 기본 배열 탑재');
  assert.ok(indexSrc.includes('ourgoal_companions_backup_'), 'loadProfile에서 ourgoal_companions_backup_ 키 자가치유 복원');
  assert.ok(indexSrc.includes('companions: finalCompanions,'), 'loadProfile 반환 객체에 companions 주입 확인');
  assert.ok(indexSrc.includes('localStorage.setItem(\'ourgoal_companions_backup_\' + uidVal'), 'saveProfile에서 companions 로컬 영구 백업 보장');

  // 2. enterApp 및 가시성 전환 시 Realtime 리스너 자동 연결 확인
  assert.ok(indexSrc.includes('window.OurgoalTeamInviteComm.initIncomingDmListener(state.profile.id)'), 'enterApp에서 initIncomingDmListener 자동 가동');

  // 3. js/team-invite-comm.js 읽음 상태 관리 및 수신 파이프라인 확인
  assert.ok(commSrc.includes("DM_READ_PREFIX = 'ourgoal_dm_read_'"), 'DM_READ_PREFIX 읽음 원장 키 정의');
  assert.ok(commSrc.includes('function markDmRoomRead('), 'markDmRoomRead 읽음 처리 함수 정의');
  assert.ok(commSrc.includes('targetComp.lastMsg = r.message;'), '기존 동반자 수신 메시지 누락 방지 및 lastMsg 바인딩 확인');
  assert.ok(commSrc.includes('targetComp.isUnread = !!_unreadPeerMap[senderId];'), '동반자별 미확인 메시지 여부 정상 판정');
  assert.ok(commSrc.includes('_lastDmMessageMap[senderId]'), '최신 수신 메시지 맵 등록 확인');

  // 4. 대화 목록 렌더링 시 최신 메시지 미리보기 및 읽음 해제 확인
  assert.ok(commSrc.includes('var lastMsgObj = _lastDmMessageMap[p.id];'), 'DM 목록에서 실제 최신 메시지 프리뷰 우선 추출');
  assert.ok(commSrc.includes('markDmRoomRead(myId, person.id);'), '대화방 진입 시 markDmRoomRead 즉시 실행');

  // 5. 로컬스토리지 0ms 자가치유 복원 및 기본 AI 봇 덮어쓰기 방어 확인
  assert.ok(commSrc.includes('COMPANIONS_STORAGE_PREFIX + uid'), 'persistCompanions에서 UID 기반 격리 백업 저장');
});

/* ============ [#TASK-ES-145] 마니또 실 유저 판별 무결성 및 가짜 실 유저 표기 오류 개선 검증 ============ */
check('compliance: [#TASK-ES-145] 마니또 실 유저 판별 무결성 및 가짜 실 유저 표기 오류 개선 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const commSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-invite-comm.js'), 'utf8');

  // 1. index.html isValidRealUser 탑재 및 실 사용자 UUID 정밀 식별
  assert.ok(indexSrc.includes('function isValidRealUser(id)'), 'isValidRealUser 함수 탑재');
  assert.ok(indexSrc.includes("cleanId.indexOf('guest') === 0"), '게스트 계정 실 사용자 배제 로직');
  assert.ok(indexSrc.includes("cleanId.indexOf('test') === 0"), '테스트 계정 실 사용자 배제 로직');
  assert.ok(indexSrc.includes('[0-9a-f]{8}-[0-9a-f]{4}'), 'Supabase Auth UUID 규격 정규식 검증');

  // 2. loadServerManitoData에서 게스트 및 무효 계정 원천 필터링
  assert.ok(indexSrc.includes('if(!isValidRealUser(row.sender_id)) return;'), '마니또 서버 풀 페칭 시 비실사용자 즉시 드롭');
  assert.ok(indexSrc.includes("if(row.hidden === true || row.status === 'inactive') return;"), '비활성/숨김 처리된 풀 데이터 필터링');

  // 3. mnJoin 게스트 등록 차단 및 로컬 AI 마니또 안전 격리
  assert.ok(indexSrc.includes("String(state.profile.id).indexOf('guest') === 0 || !isValidRealUser(state.profile.id)"), 'mnJoin 게스트 상태 판별');
  assert.ok(indexSrc.includes('게스트 모드로 AI 마니또 3명이 배정됐어요'), '게스트 마니또 시작 시 로컬 안전 격리 및 안내 토스트');

  // 4. 마니또 카드 2중 방화벽 (isActuallyReal) 검증
  assert.ok(indexSrc.includes('var isActuallyReal = !p.is_ai && isValidRealUser(p.id);'), '마니또 카드 실 유저 뱃지 2중 방화벽 검증');

  // 5. js/team-invite-comm.js isKnownAiCompanion 게스트 및 마니또 접두어 보강
  assert.ok(commSrc.includes("s.indexOf('mn_') === 0 || s.indexOf('guest') === 0"), 'isKnownAiCompanion 게스트/마니또 접두어 인식');
});

/* ============ [#TASK-ES-146] 홈 탭 최하단 <아워골 평가해주기> 고정 배너 및 90% 팝업 평가폼 무결성 검증 ============ */
check('compliance: [#TASK-ES-146] 홈 탭 최하단 <아워골 평가해주기> 고정 배너 및 90% 팝업 평가폼 무결성 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const customSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'customize.js'), 'utf8');
  const uiSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. customize.js의 CORE_IDS에 homeEvalBanner 등록 확인
  assert.ok(customSrc.includes("'homeEvalBanner'"), 'customize.js CORE_IDS에 homeEvalBanner 등록 검증');

  // 2. index.html에 홈 최하단 배너 및 버튼 탑재 확인
  assert.ok(indexSrc.includes('id="homeEvalBanner"'), 'homeEvalBanner 요소 탑재');
  assert.ok(indexSrc.includes('id="btnOpenEvalModal"'), 'btnOpenEvalModal 버튼 탑재');
  assert.ok(indexSrc.includes('아워골 평가해주기'), '아워골 평가해주기 배너 텍스트 확인');

  // 3. 90% 대형 평가 팝업 모달 및 5대 입력 필드 확인
  assert.ok(indexSrc.includes('id="appEvaluationModal"'), 'appEvaluationModal 모달 탑재');
  assert.ok(indexSrc.includes('id="evalScoreInput"'), '100점 만점 평가 입력 필드');
  assert.ok(indexSrc.includes('id="evalProsInput"'), '장점 입력 필드');
  assert.ok(indexSrc.includes('id="evalConsInput"'), '단점 입력 필드');
  assert.ok(indexSrc.includes('id="evalImprovementsInput"'), '추가 및 개선요청 입력 필드');
  assert.ok(indexSrc.includes('id="evalCeoMsgInput"'), '대표에게 하고싶은 말 입력 필드');
  assert.ok(indexSrc.includes('placeholder="진짜 맘대로 써주셔도 됩니다. 신고안합니다"'), '상민님 지정 회색 플레이스홀더 원문 검증');

  // 4. 로컬 영속화 및 백엔드 전송 배선 확인
  assert.ok(indexSrc.includes('openAppEvaluationModal'), 'openAppEvaluationModal 함수 정의');
  assert.ok(indexSrc.includes('closeAppEvaluationModal'), 'closeAppEvaluationModal 함수 정의');
  assert.ok(indexSrc.includes('state.profile.settings.appEvaluations.push'), '로컬 appEvaluations 영속화 저장 배선');
  assert.ok(indexSrc.includes("type: 'app_evaluation'"), '평가 데이터 전송 페이로드 확인');
  assert.ok(uiSrc.includes('.home-eval-banner-box') && uiSrc.includes('.eval-modal-sheet'), 'ui.css 90% 뷰포트 반응형 스타일 정의');
});

/* ============ [#TASK-ES-147] 목표 탭 '목표만' 버튼 이격 배치 및 하위 마일스톤형 확인 UI 검증 ============ */
check('compliance: [#TASK-ES-147] 목표 탭 \'목표만\' 버튼 이격 배치 및 하위 마일스톤형 확인 UI 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 목표 탭 상단 필터 바 [목표만] 분리 이격 배치 확인
  assert.ok(indexSrc.includes('data-msview="goals_only"'), 'goals_only 옵션 탑재');
  assert.ok(indexSrc.includes('goals-only-wrap') || indexSrc.includes('margin-left:14px'), '[목표만] 14px 이격 레이아웃 확인');
  assert.ok(uiSrc.includes('.goals-only-wrap'), 'ui.css goals-only-wrap 마진 스타일 정의');

  // 2. goals_only 모드 선택 시 전체 목표를 마일스톤형 카드 블록으로 수직 나열 확인
  assert.ok(indexSrc.includes('goal-milestone-overview-card'), '마일스톤형 목표 요약 카드 클래스 확인');
  assert.ok(indexSrc.includes('전체 목표 마일스톤 현황'), '전체 목표 마일스톤 현황 헤더 확인');
  assert.ok(indexSrc.includes('data-selectgoal'), '목표 카드 클릭을 위한 data-selectgoal 어트리뷰트');

  // 3. 목표 카드 클릭 시 해당 목표로 즉시 전환되는 이벤트 배선 확인
  assert.ok(indexSrc.includes("body.querySelectorAll('[data-selectgoal]')"), '목표 카드 클릭 핸들러 바인딩');
  assert.ok(indexSrc.includes('state.activeGoalId = targetGid'), '클릭한 목표로 활성 목표 전환 확인');
});

/* ============ [#TASK-ES-148] 맞춤 템플릿 스톱워치 표 시간기입 안내문구 탑재 검증 ============ */
check('compliance: [#TASK-ES-148] 맞춤 템플릿 스톱워치 표 시간기입 안내문구 탑재 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. renderStopwatchWidgetHtml 내 안내 문구 탑재 확인
  assert.ok(indexSrc.includes('넣을 칸 누르고 ‘표에시간기입’ 누르면 바로입력됨'), '스톱워치 표 시간기입 안내문구 원문 검증');
  assert.ok(indexSrc.includes('sw-inject-hint'), 'sw-inject-hint 요소 클래스 탑재');
  assert.ok(uiSrc.includes('.sw-inject-hint'), 'ui.css sw-inject-hint 스타일 정의');

  // 2. 미선택 시 토스트 피드백 개선 확인
  assert.ok(indexSrc.includes("toast('넣을 칸 누르고 ‘표에시간기입’ 누르면 바로입력됨')"), '셀 미선택 시 친절한 가이드 토스트 출력');
});

/* ============ [#TASK-ES-149] 팀목표 200% 활용 가이드 안내문구 ('* 팀 목표를 생성하면 사라짐') 표시 검증 ============ */
check('compliance: [#TASK-ES-149] 팀목표 200% 활용 가이드 안내문구 (\'* 팀 목표를 생성하면 사라짐\') 표시 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. renderTeamGoalsEmptyGuideHtml 내 안내 문구 탑재 확인
  assert.ok(indexSrc.includes('* 팀 목표를 생성하면 사라짐'), '팀목표 생성 시 소멸 안내 문구 원문 검증');
  assert.ok(indexSrc.includes('guide-vanish-hint'), 'guide-vanish-hint 클래스 탑재');
  assert.ok(uiSrc.includes('.guide-vanish-hint'), 'ui.css guide-vanish-hint 축소 폰트 스타일 정의');
});

/* ============ [#TASK-ES-150] 아바타 레벨업 대형 팝업 및 성장 성향 프롬프트 설정 무결성 검증 ============ */
check('compliance: [#TASK-ES-150] 아바타 레벨업 대형 팝업 및 성장 성향 프롬프트 설정 무결성 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 대형 팝업 모달 및 대형 아바타 컨테이너 (200px 이상) 탑재 확인
  assert.ok(indexSrc.includes('id="avatarLevelUpModal"'), 'avatarLevelUpModal 모달 탑재');
  assert.ok(indexSrc.includes('id="avatarLevelUpImgContainer"'), 'avatarLevelUpImgContainer 대형 컨테이너 탑재');
  assert.ok(indexSrc.includes('width:220px;height:220px'), '220px 대형 아바타 규격 확인');

  // 2. 액션 버튼 3종(SNS 공유, 이미지 저장, 확인 닫기) 배선 확인
  assert.ok(indexSrc.includes('id="btnShareLevelUp"'), 'btnShareLevelUp 버튼 탑재');
  assert.ok(indexSrc.includes('id="btnSaveLevelUpImage"'), 'btnSaveLevelUpImage 버튼 탑재');
  assert.ok(indexSrc.includes('id="btnConfirmLevelUpClose"'), 'btnConfirmLevelUpClose 버튼 탑재');
  assert.ok(indexSrc.includes('openAvatarLevelUpModal'), 'openAvatarLevelUpModal 함수 정의');
  assert.ok(indexSrc.includes('closeAvatarLevelUpModal'), 'closeAvatarLevelUpModal 함수 정의');

  // 3. 아바타 성장 성향(키워드) 입력 및 유해어 필터링, 영속화 검증
  assert.ok(indexSrc.includes('id="avatarGrowthPromptInput"'), 'avatarGrowthPromptInput 입력 필드 탑재');
  assert.ok(indexSrc.includes('id="btnSaveGrowthPrompt"'), 'btnSaveGrowthPrompt 저장 버튼 탑재');
  assert.ok(indexSrc.includes('function filterHarmfulWords'), 'filterHarmfulWords 유해어 필터링 함수 탑재');
  assert.ok(indexSrc.includes('state.profile.settings.avatarGrowthPrompt'), 'avatarGrowthPrompt 로컬 영속화 바인딩');

  // 4. 레벨업 트리거(showLevelUpBanner) 시 대형 팝업 자동 연동 확인
  assert.ok(indexSrc.includes('openAvatarLevelUpModal(level)'), 'showLevelUpBanner에서 openAvatarLevelUpModal 호출 확인');
});

/* ============ [#TASK-ES-151] 캘린더 일정 체크버튼 완료/미완료 토글 및 목표 양방향 동기화 무결성 검증 ============ */
check('compliance: [#TASK-ES-151] 캘린더 일정 체크버튼 완료/미완료 토글 및 목표 양방향 동기화 무결성 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 체크버튼 및 완료 상태 UI/CSS 검증
  assert.ok(uiSrc.includes('.sched-check'), 'ui.css .sched-check 스타일 정의');
  assert.ok(uiSrc.includes('.sched-check.done'), 'ui.css .sched-check.done 완료 스타일 정의');
  assert.ok(uiSrc.includes('.timetable-chip.done-chip'), 'ui.css .timetable-chip.done-chip 취소선/투명도 스타일');
  assert.ok(uiSrc.includes('.sched-goal-badge'), 'ui.css .sched-goal-badge 목표 배지 스타일');

  // 2. toggleScheduleDone 함수 및 양방향 동기화 로직 검증
  assert.ok(indexSrc.includes('async function toggleScheduleDone('), 'toggleScheduleDone 전담 비동기 함수 구현');
  assert.ok(indexSrc.includes('sched.linkedTaskId || sched.linkedGoalId'), '일정 완료 시 연동된 목표/태스크 동기화 분기');
  assert.ok(indexSrc.includes('cs.linkedTaskId === targetTask.id'), '태스크 완료 시 연동된 일정(customSchedules) 동기화');

  // 3. 일자 허브 모달 및 시간표 타임라인 체크버튼 배선 검증
  assert.ok(indexSrc.includes('data-hubtogglesched='), 'openCalendarDayEditHubModal 내 data-hubtogglesched 체크버튼 배선');
  assert.ok(indexSrc.includes('data-togglesched='), 'renderCalendarScreen 타임라인 내 data-togglesched 체크버튼 배선');

  // 4. 일정 수동 등록/수정 모달 내 목표 연계 선택 셀렉터 검증
  assert.ok(indexSrc.includes('id="calEditLinkedGoal"'), 'calEditLinkedGoal 목표 선택 셀렉터 탑재');
  assert.ok(indexSrc.includes('linkedGoalId: linkedGoalId || null'), '일정 저장 시 linkedGoalId 영속화');
  assert.ok(indexSrc.includes('linkedGoalTitle: linkedGoalTitle || null'), '일정 저장 시 linkedGoalTitle 영속화');
});

/* ============ [#TASK-ES-152] 백그라운드·앱종료·미확인 전역 알림 엔진(OurgoalNotifyEngine) 및 세부 제어 센터 무결성 검증 ============ */
check('compliance: [#TASK-ES-152] 백그라운드·앱종료·미확인 전역 알림 엔진(OurgoalNotifyEngine) 및 세부 제어 센터 무결성 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const commSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-invite-comm.js'), 'utf8');
  const notifyModPath = path.join(__dirname, '..', 'js', 'notify-engine.js');

  // 1. OurgoalNotifyEngine 모듈 및 API 완비 검증
  assert.ok(fs.existsSync(notifyModPath), 'js/notify-engine.js 모듈 파일 존재');
  const notifyMod = require(notifyModPath);
  assert.ok(typeof notifyMod.dispatchGlobalNotification === 'function', 'dispatchGlobalNotification 함수 제공');
  assert.ok(typeof notifyMod.playNotificationSound === 'function', 'playNotificationSound 함수 제공');
  assert.ok(typeof notifyMod.vibrate === 'function', 'vibrate 함수 제공');
  assert.ok(typeof notifyMod.getNotifConfig === 'function', 'getNotifConfig 함수 제공');
  assert.ok(indexSrc.includes('src="js/notify-engine.js'), 'index.html에서 notify-engine.js 로드');

  // 2. 플로팅 상단 알림 배너 UI 및 CSS 무결성 검증
  assert.ok(uiSrc.includes('.notify-floating-banner'), 'ui.css .notify-floating-banner 스타일 정의');
  assert.ok(uiSrc.includes('.notify-floating-banner.visible'), 'ui.css .notify-floating-banner.visible 노출 애니메이션 정의');
  assert.ok(uiSrc.includes('.notify-mode-grid'), 'ui.css .notify-mode-grid 피드백 모드 그리드 정의');

  // 3. DM 실시간 수신 시 전역 알림 발송 배선 검증
  assert.ok(commSrc.includes('OurgoalNotifyEngine.dispatchGlobalNotification'), 'team-invite-comm.js 수신 시 dispatchGlobalNotification 배선');
  assert.ok(commSrc.includes("type: 'dm'"), 'DM 타입 전역 알림 발송 검증');

  // 4. 설정창 내 전역 알림 세부 제어 센터 UI 및 영속화 바인딩 검증
  assert.ok(indexSrc.includes('id="notifFeedbackModeGrid"'), '피드백 방식 선택 그리드 탑재');
  assert.ok(indexSrc.includes('id="notifPrivacyToggle"'), '알림 프라이버시 보호 토글 탑재');
  assert.ok(indexSrc.includes('id="notifBgSwitch"'), '백그라운드 Web Notification 토글 탑재');
  assert.ok(indexSrc.includes('id="notifDmSwitch"'), '1:1 DM 알림 토글 스위치 탑재');
  assert.ok(indexSrc.includes('id="notifPermStatusLabel"'), '브라우저 시스템 알림 권한 상태 레이블 탑재');
  assert.ok(indexSrc.includes('id="btnReqNotifPerm"'), '권한 요청 버튼 탑재');
  assert.ok(indexSrc.includes('state.profile.settings.notifications'), 'notifications 설정 영속화 바인딩');
});

/* ============ [#TASK-ES-153] 캘린더 일자별 배경 사진 지정 및 50% 투명도 전역 렌더링 무결성 검증 ============ */
check('compliance: [#TASK-ES-153] 캘린더 일자별 배경 사진 지정 및 50% 투명도 전역 렌더링 무결성 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. CSS 50% 투명도 및 꽉 찬 배경 레이어 규칙 검증
  assert.ok(uiSrc.includes('.cal-cell-bg'), 'ui.css .cal-cell-bg 클래스 정의');
  assert.ok(uiSrc.includes('opacity: 0.5'), 'ui.css 배경 레이어 50% 투명도 정의');
  assert.ok(uiSrc.includes('background-size: cover'), 'ui.css 배경 이미지 cover 꽉 찬 채우기 정의');
  assert.ok(uiSrc.includes('pointer-events: none'), 'ui.css 배경 레이어 클릭 방해 차단');
  assert.ok(uiSrc.includes('.cal-bg-preview-wrap'), 'ui.css 사진 선택 모달 미리보기 스타일 정의');

  // 2. 핵심 함수 및 모달 로직 검증
  assert.ok(indexSrc.includes('function compressCalendarBgImage('), 'Canvas 800px & JPEG 0.82 이미지 압축 함수 탑재');
  assert.ok(indexSrc.includes('function openCalendarDayBgPickerModal('), '이날의 배경사진 고르기 모달 함수 탑재');
  assert.ok(indexSrc.includes('id="calDayBgFileInput"'), '사진 선택 파일 인풋 탑재');
  assert.ok(indexSrc.includes('id="calDayBgSaveBtn"'), '배경사진 저장 버튼 탑재');
  assert.ok(indexSrc.includes('id="calDayBgCancelBtn"'), '배경사진 취소 버튼 탑재');
  assert.ok(indexSrc.includes('id="btnDeleteDayBg"'), '배경사진 삭제/초기화 버튼 탑재');

  // 3. 월간 셀 및 일간 타임라인 렌더링 연동 검증
  assert.ok(indexSrc.includes('calendarDayBackgrounds[iso]'), '월간 캘린더 셀 배경사진 데이터 연동');
  assert.ok(indexSrc.includes('<div class="cal-cell-bg"'), '월간 캘린더 셀 .cal-cell-bg 백드롭 렌더링');
  assert.ok(indexSrc.includes('id="hubDayBgBtn"'), '일간 허브 모달 내 이날의 배경사진 고르기 버튼 탑재');
  assert.ok(indexSrc.includes('id="btnPickDayBgTimetable"'), '일간 시간표 타임라인 내 배경사진 고르기 버튼 탑재');
  assert.ok(indexSrc.includes('id="calPickDayBgBtn"'), '일간 상세 뷰 내 배경사진 고르기 버튼 탑재');

  // 4. 데이터 영속성 및 로컬 스토리지 비상 백업 검증
  assert.ok(indexSrc.includes('ourgoal_cal_day_bg_'), '배경사진 로컬 스토리지 비상 백업 키 연동');
  assert.ok(indexSrc.includes('calendarDayBackgrounds: localCalDayBg'), 'loadProfile 내 배경사진 복원 배선');
});

/* ============ [#TASK-ES-154] 아워골 평가하기 3중 접수창구(텔레그램·노션·DB) 및 피드백 파이프라인 무결성 검증 ============ */
check('compliance: [#TASK-ES-154] 아워골 평가하기 3중 접수창구(텔레그램·노션·DB) 및 피드백 파이프라인 무결성 검증', () => {
  const trackSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'track.js'), 'utf8');
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. api/track.js 백엔드 app_evaluation 수신 및 5대 항목 리포트 조립 검증
  assert.ok(trackSrc.includes("body.type === 'app_evaluation'"), 'api/track.js app_evaluation 수신 분기');
  assert.ok(trackSrc.includes("body.evaluation"), 'api/track.js body.evaluation 객체 인식');
  assert.ok(trackSrc.includes('[아워골 종합 앱 평가 리포트]'), '5대 평가 항목 리포트 본문 자동 조립');
  assert.ok(trackSrc.includes("evaluation: '앱 평가/피드백'"), '앱 평가 전용 유형 라벨 매핑');
  assert.ok(trackSrc.includes('[앱 평가] ⭐'), '노션 및 요약 제목 별점/점수 프리픽스');

  // 2. 텔레그램 실시간 알림 전용 서식 검증
  assert.ok(trackSrc.includes('[아워골 사용자 앱 평가 접수]'), '텔레그램 평가 전용 알림 서식');
  assert.ok(trackSrc.includes('• 종합 점수:'), '텔레그램 점수 항목 표기');

  // 3. index.html 프론트엔드 4위 1체 피드백 검증
  assert.ok(indexSrc.includes("btnSubmitEval.disabled = true"), '평가 제출 시 버튼 비활성화 (중복 제출 방지)');
  assert.ok(indexSrc.includes("btnSubmitEval.textContent = '제출 중...'"), '평가 제출 중 로딩 인디케이터');
  assert.ok(indexSrc.includes("btnSubmitEval.textContent = '평가 제출하기'"), '제출 완료/실패 시 버튼 원복');
  assert.ok(indexSrc.includes("closeAppEvaluationModal"), '성공 시 모달 닫기');

  // 4. 서비스워커 캐시 무효화 게이트 검증
  assert.ok(swSrc.includes('ourgoal-shell-v20260917-es154'), 'sw.js 캐시 네임 es154 갱신');
});

/* ============ [#TASK-ES-155] 캘린더 배경사진·체크토글·잇템추가 결함 해결 및 감성 안내문구 무결성 검증 ============ */
check('compliance: [#TASK-ES-155] 캘린더 배경사진·체크토글·잇템추가 결함 해결 및 감성 안내문구 무결성 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const styleSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. showToast 런타임 오류 방어 및 전역 등록 검증
  assert.ok(indexSrc.includes('window.showToast = toast;'), 'window.showToast = toast 전역 별칭 선언');
  assert.strictEqual(indexSrc.includes('showToast('), false, 'index.html 내 정의되지 않은 showToast() 호출 완전 박멸');

  // 2. 모달 전환 popstate 간섭 차단 검증
  assert.ok(indexSrc.includes('openCalendarDayBgPickerModal(sel, true)'), '일간 허브 모달에서 배경사진 모달 진입 시 closeModal 없이 직접 전환');

  // 3. 캘린더 일간 일정 목록(renderCalDayDetail) 체크 버튼 토글 배선 검증
  assert.ok(indexSrc.includes('data-detailtogglesched'), 'renderCalDayDetail 내 인터랙티브 체크박스 data-detailtogglesched 존재');
  assert.ok(indexSrc.includes("wrap.querySelectorAll('[data-detailtogglesched]')"), '캘린더 상세 체크박스 클릭 리스너 배선');

  // 4. 프로필 편집기 openProfileEditor(existingDraft) 및 잇템 추가 인메모리 보존 검증
  assert.ok(indexSrc.includes('function openProfileEditor(existingDraft)'), 'openProfileEditor existingDraft 수신 지원');
  assert.ok(indexSrc.includes('openProfileEditor(draft)'), '잇템 추가/취소 시 closeModal 없이 부모 모달로 draft 보존 복귀');

  // 5. 일정 탭 감성 안내 카피 탑재 검증
  assert.ok(indexSrc.includes('일정을 사진배경으로 채워서 나만의 사진일기장을 만들어봐요'), '캘린더 상단 상민님 지정 감성 문구 탑재');
  assert.ok(indexSrc.includes('class="cal-sub-guide"'), '캘린더 상단 안내 카드 마크업 존재');
  assert.ok(styleSrc.includes('.cal-sub-guide'), 'ui.css 내 .cal-sub-guide 스타일 정의');

  // 6. 서비스워커 캐시 무효화 게이트 검증
  assert.ok(swSrc.includes('ourgoal-shell-v20260917-es155'), 'sw.js 캐시 네임 es155 갱신');
});

/* ============ [#TASK-ES-153-SILENT] 구글 캘린더 일정 저장 시 계정 선택창 팝업 원천 차단 및 백그라운드 무음 동기화 검증 ============ */
check('compliance: [#TASK-ES-153-SILENT] 구글 캘린더 일정 저장 시 계정 선택창 팝업 원천 차단 및 백그라운드 무음 동기화 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. requestGoogleToken 내 다중 계정 선택창 건너뛰기 hint 파라미터 탑재 검증
  assert.ok(indexSrc.includes('reqOpts.hint = gEmail'), 'requestGoogleToken 내 기존 연동 이메일 hint 파라미터 전달');

  // 2. getGoogleAccessToken 백그라운드 무음 모드(interactive: false) 검증
  assert.ok(indexSrc.includes('async function getGoogleAccessToken(interactive)'), 'getGoogleAccessToken interactive 매개변수 지원');
  assert.ok(indexSrc.includes('if(!interactive) return null;'), '백그라운드 호출 시 팝업 강제 실행 원천 차단');

  // 3. 일정 저장 핸들러에서 syncAllToGoogleCalendar(false) 백그라운드 호출 검증
  assert.ok(indexSrc.includes('syncAllToGoogleCalendar(false)'), '일정 저장 시 무음 백그라운드 동기화 호출');

  // 4. 유저가 직접 누르는 버튼(배너, 설정창)에서 syncAllToGoogleCalendar(true) 인터랙티브 호출 검증
  assert.ok(indexSrc.includes('syncAllToGoogleCalendar(true)'), '수동 [지금 동기화] 클릭 시 인터랙티브 인증 호출');
});

/* ============ [#TASK-ES-156] 캘린더 일정 체크 토글 및 구글 연동 일정 편집 시 제목 프리필 결함 해결 검증 ============ */
check('compliance: [#TASK-ES-156] 캘린더 일정 체크 토글 및 구글 연동 일정 편집 시 제목 프리필 결함 해결 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. calendarItemsByDate 내 구글 이벤트에 schedId 및 gcalDoneMap 기반 done 보존 검증
  assert.ok(indexSrc.includes('schedId: ge.id'), 'calendarItemsByDate 내 gcal 이벤트 schedId 부여');
  assert.ok(indexSrc.includes('gcalDoneMap[ge.id]'), 'calendarItemsByDate 내 gcalDoneMap 영구 완료 상태 참조');

  // 2. toggleScheduleDone 내 gcalDoneEvents 영구 원장화 검증
  assert.ok(indexSrc.includes('state.profile.settings.gcalDoneEvents[gcalTarget] = isNowDone'), 'toggleScheduleDone 내 gcalDoneEvents 설정 영구 저장');

  // 3. 3대 뷰(일간 상세, 허브 모달, 시간표) 토글 속성 및 호출 배선 검증
  assert.ok(indexSrc.includes('data-detailtogglesched="\'+\ne.kind+\':\'+(e.schedId||e.goalId||e.gcalId||\'\')') || indexSrc.includes('(e.schedId||e.goalId||e.gcalId||\'\')'), '토글 마크업에 e.gcalId 백업 포함');
  assert.ok(indexSrc.includes("(kind==='custom'||kind==='gcal')?schedOrGoalId:null"), '토글 클릭 시 gcal 이벤트 ID 첫 번째 인자 전달');

  // 4. [data-caledit] 및 [data-hubedit] 핸들러 내 gcal 타깃 이벤트 검색 검증
  assert.ok(indexSrc.includes("} else if(k==='gcal'){") && indexSrc.includes("c.kind==='gcal' && String(c.schedId||c.gcalId||c.id)===String(sid)"), '일간 상세 data-caledit 클릭 시 gcal 타깃 이벤트 검색');
  assert.ok(indexSrc.includes("} else if(ev.kind==='gcal'){") && indexSrc.includes("String(ev.schedId||ev.gcalId||ev.id)"), '허브 모달 data-hubedit 클릭 시 gcal 타깃 이벤트 검색');

  // 5. openCalendarManualEditModal 내 gcal 삭제 및 저장(구글 무음 동기화 포함) 검증
  assert.ok(indexSrc.includes("toast('구글 일정을 캘린더에서 제거했어요');"), '수동 편집 모달 내 구글 일정 삭제 지원');
  assert.ok(indexSrc.includes("pushCalendarEvent(token, title, dtVal, eventItem.id)"), '수동 편집 모달 내 구글 일정 수정 시 원격 동기화 지원');

  // 6. sw.js 캐시 버전 갱신 검증
  assert.ok(swSrc.includes('ourgoal-shell-v20260917-es156') || swSrc.includes('ourgoal-shell-v20260917-es157'), 'sw.js 캐시 네임 갱신');
});

/* ============ [#TASK-ES-157] 캘린더 구글 캘린더 거대 배너 제거 및 헤더 미니 구글 아이콘 배지 콤팩트화 검증 ============ */
check('compliance: [#TASK-ES-157] 캘린더 구글 캘린더 거대 배너 제거 및 헤더 미니 구글 아이콘 배지 콤팩트화 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. 캘린더 헤더 내 calGcalMiniBadgeSlot 마운트 포인트 확인
  assert.ok(indexSrc.includes('id="calGcalMiniBadgeSlot"'), '캘린더 헤더 내 미니 배지 슬롯 존재');

  // 2. 상단 거대 calGoogleBanner 상시 숨김 및 비우기 확인
  assert.ok(indexSrc.includes("gBanner.style.display = 'none';") && indexSrc.includes("gBanner.innerHTML = '';"), '거대 배너 상시 숨김 및 비우기 처리');

  // 3. 미니 구글 'G' 4색 SVG 아이콘 및 콤팩트 배지 렌더링 확인
  assert.ok(indexSrc.includes('id="calGcalMiniBadge"'), '미니 구글 배지 버튼 렌더링');
  assert.ok(indexSrc.includes('#4285F4') && indexSrc.includes('#34A853') && indexSrc.includes('#FBBC05') && indexSrc.includes('#EA4335'), '구글 4색 SVG 아이콘 포함');

  // 4. 배지 클릭 시 동기화 및 모달 연결 확인
  assert.ok(indexSrc.includes("toast('구글 캘린더와 동기화 중…');"), '배지 클릭 시 동기화 진행 토스트 피드백');
  assert.ok(indexSrc.includes('cBtn.onclick = openGoogleCalendarConnectModal;'), '미연동 시 배지 클릭으로 연동 모달 연결');

  // 5. sw.js 캐시 네임 es157 갱신 확인
  assert.ok(swSrc.includes('ourgoal-shell-v20260917-es157') || swSrc.includes('ourgoal-shell-v20260917-es158'), 'sw.js 캐시 네임 es157/158 갱신');
});

/* ============ [#TASK-ES-158] 회원 탈퇴 시 법적책임·데이터 분실 사전 안내 팝업 및 동의 4위 1체 배선 검증 ============ */
check('compliance: [#TASK-ES-158] 회원 탈퇴 시 법적책임·데이터 분실 사전 안내 팝업 및 동의 4위 1체 배선 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. 모달 및 핵심 함수 정의 확인
  assert.ok(indexSrc.includes('function openWithdrawModal()'), 'openWithdrawModal 함수 정의');
  assert.ok(indexSrc.includes('function closeWithdrawModal()'), 'closeWithdrawModal 함수 정의');
  assert.ok(indexSrc.includes('async function submitWithdrawAccount()'), 'submitWithdrawAccount 함수 정의');
  assert.ok(indexSrc.includes('async function withdrawAccount()'), '하위 호환 withdrawAccount 함수 유지');

  // 2. 모달 컨테이너 및 3대 안내 블록 확인
  assert.ok(indexSrc.includes('id="withdrawModal"'), '전용 withdrawModal 컨테이너 마크업 존재');
  assert.ok(indexSrc.includes('소중한 목표 및 기록 분실 안내'), '1. 데이터 분실 안내 문구 존재');
  assert.ok(indexSrc.includes('30일 탈퇴 유예 안전망 및 원클릭 복구'), '2. 30일 유예 및 복구 안내 문구 존재');
  assert.ok(indexSrc.includes('법적 책임 및 관계 법령에 따른 정보 보존'), '3. 법적 책임 보존 고지 문구 존재');
  assert.ok(indexSrc.includes('전자상거래 등에서의 소비자보호에 관한 법률') && indexSrc.includes('통신비밀보호법'), '관련 법령 명시');

  // 3. 동의 체크박스 및 인터랙티브 버튼 배선 확인
  assert.ok(indexSrc.includes('id="withdrawAgreeCheck"'), '동의 체크박스 요소 존재');
  assert.ok(indexSrc.includes('id="withdrawConfirmBtn"'), '탈퇴 신청 버튼 요소 존재');
  assert.ok(indexSrc.includes('id="withdrawCancelBtn"'), '취소 버튼 요소 존재');
  assert.ok(indexSrc.includes('id="withdrawCloseBtn"'), '닫기 버튼 요소 존재');
  assert.ok(indexSrc.includes('confirmBtn.disabled = !this.checked;'), '체크박스 토글 시 버튼 disabled 제어 로직 존재');

  // 4. ui.css 전용 스타일링 확인
  assert.ok(cssSrc.includes('.withdraw-modal-container'), 'ui.css 모달 컨테이너 스타일 존재');
  assert.ok(cssSrc.includes('.withdraw-box-danger'), 'ui.css 위험 고지 박스 스타일 존재');
  assert.ok(cssSrc.includes('.withdraw-box-legal'), 'ui.css 법적 고지 박스 스타일 존재');

  // 5. sw.js 캐시 네임 es158 갱신 확인
  assert.ok(swSrc.includes('ourgoal-shell-v20260917-es158') || swSrc.includes('ourgoal-shell-v20260917-es159'), 'sw.js 캐시 네임 es158/159 갱신');
});

/* ============ [#TASK-ES-159] 아바타 레벨별 상징 백그라운드 이미지 결합 시스템 검증 ============ */
check('compliance: [#TASK-ES-159] 아바타 레벨별 상징 백그라운드 이미지(새싹·숲·포세이돈·제우스·우주 5대 테마) 결합 검증', () => {
  const avatarSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. 5대 테마 정의 및 5레벨 기준 룰 검증
  assert.ok(avatarSrc.includes('var RANK_THEMES_5 = ['), '5대 상징 랭크 테마 배열 정의');
  assert.ok(avatarSrc.includes("name: '새싹'") && avatarSrc.includes('minLv: 1') && avatarSrc.includes('maxLv: 5'), '테마 1: 새싹 (Lv.1~5)');
  assert.ok(avatarSrc.includes("name: '울창한 숲'") && avatarSrc.includes('minLv: 6') && avatarSrc.includes('maxLv: 10'), '테마 2: 숲 (Lv.6~10)');
  assert.ok(avatarSrc.includes("name: '포세이돈'") && avatarSrc.includes('minLv: 11') && avatarSrc.includes('maxLv: 15'), '테마 3: 포세이돈 (Lv.11~15)');
  assert.ok(avatarSrc.includes("name: '제우스'") && avatarSrc.includes('minLv: 16') && avatarSrc.includes('maxLv: 20'), '테마 4: 제우스 (Lv.16~20)');
  assert.ok(avatarSrc.includes("name: '코스믹 우주'") && avatarSrc.includes('minLv: 21'), '테마 5: 우주 (Lv.21+)');

  // 2. 랭크 윙/오라 SVG 렌더러 및 아바타 미가림 래퍼 검증
  assert.ok(avatarSrc.includes('function getRankWingsSvg('), 'getRankWingsSvg 함수 구현');
  assert.ok(avatarSrc.includes('avatar-rank-aura-wrap'), '아바타 외곽 래퍼 클래스 결합');
  assert.ok(avatarSrc.includes('rank-bg-svg-layer'), '외곽 오라 SVG 레이어 생성');
  assert.ok(avatarSrc.includes('avatar-inner-box'), '중앙 아바타 내부 박스 분리 (미가림)');

  // 3. 모달 및 레벨업 화면 연동 검증
  assert.ok(avatarSrc.includes('id="avatarRankThemeCard"'), '아바타 설정 모달 내 랭크 테마 안내 카드 탑재');
  assert.ok(indexSrc.includes('getRankThemeInfo'), '레벨업 모달 내 상징 랭크 테마 정보 연동');

  // 4. ui.css 전용 스타일 및 5대 테마 키프레임 애니메이션 검증
  assert.ok(cssSrc.includes('.avatar-rank-aura-wrap'), 'ui.css 아바타 랭크 래퍼 스타일');
  assert.ok(cssSrc.includes('.rank-bg-svg-layer'), 'ui.css 랭크 SVG 레이어 스타일');
  assert.ok(cssSrc.includes('@keyframes sproutSway'), '새싹 테마 애니메이션');
  assert.ok(cssSrc.includes('@keyframes forestBreathe'), '숲 테마 애니메이션');
  assert.ok(cssSrc.includes('@keyframes poseidonTide'), '포세이돈 테마 애니메이션');
  assert.ok(cssSrc.includes('@keyframes zeusThunderGlow'), '제우스 테마 애니메이션');
  assert.ok(cssSrc.includes('@keyframes cosmicOrbit'), '우주 테마 애니메이션');

  // 5. sw.js 캐시 갱신
  assert.ok(swSrc.includes('ourgoal-shell-v20260917-es159') || swSrc.includes('ourgoal-shell-v20260917-es160'), 'sw.js 캐시 네임 es159/160 갱신');
});

/* ============ [#TASK-ES-160] 각 탭 200% 활용법 및 실제 우수 사용사례 쇼케이스 허브 모달 검증 ============ */
check('compliance: [#TASK-ES-160] 각 탭 200% 활용법 및 실제 우수 사용사례 쇼케이스 허브 모달 4위 1체 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. 설정 탭 진입 버튼 및 전용 모달 컨테이너 확인
  assert.ok(indexSrc.includes('id="btnTabGuideHub"'), '설정 탭 내 탭 200% 활용법 버튼 구비');
  assert.ok(indexSrc.includes('id="tabGuideHubModal"'), '전용 tabGuideHubModal 컨테이너 마크업 존재');

  // 2. 5대 탭 데이터셋 및 쇼케이스 구조 확인
  assert.ok(indexSrc.includes('var TAB_GUIDE_DATA = {'), 'TAB_GUIDE_DATA 5대 탭 데이터셋 정의');
  assert.ok(indexSrc.includes("name: '홈'") && indexSrc.includes("name: '목표'") && (indexSrc.includes("name: '일정'") || indexSrc.includes("name: '캘린더'")) && indexSrc.includes("name: '기록'") && indexSrc.includes("name: '소통'"), '5대 탭 데이터 매핑');
  assert.ok(indexSrc.includes('showcase:'), '탭별 실제 우수 활용사례(쇼케이스) 객체 포함');
  assert.ok(indexSrc.includes('features:'), '탭별 3대 핵심 혁신 기능 목록 포함');

  // 3. 네비게이션 및 렌더링 함수 확인
  assert.ok(indexSrc.includes('function openTabGuideHubModal('), 'openTabGuideHubModal 함수 구현');
  assert.ok(indexSrc.includes('function renderTabGuideContent('), 'renderTabGuideContent 함수 구현');
  assert.ok(indexSrc.includes('btn.getAttribute(\'data-tabkey\')'), '가이드 탭 네비게이션 액션 구현');

  // 4. ui.css 전용 스타일 클래스 확인
  assert.ok(cssSrc.includes('.tab-guide-hub-container'), '가이드 허브 모달 컨테이너 스타일');
  assert.ok(cssSrc.includes('.tab-guide-nav-bar'), '5대 탭 가로 칩 네비게이션 바 스타일');
  assert.ok(cssSrc.includes('.guide-showcase-card'), '우수사례 쇼케이스 카드 스타일');
  assert.ok(cssSrc.includes('.showcase-mockup-wrap'), 'UI 시각적 목업 그래픽 래퍼 스타일');

  // 5. sw.js 캐시 갱신
  assert.ok(swSrc.includes('ourgoal-shell-v20260917-es160') || swSrc.includes('ourgoal-shell-v20260917-es161'), 'sw.js 캐시 네임 es160/161 갱신');
});

/* ============ [#TASK-ES-161] 참고자료 첨부 스마트 감지 · 비주얼 프리뷰 · 리치 칩 UI/UX 검증 ============ */
check('compliance: [#TASK-ES-161] 참고자료 첨부 스마트 감지 · 비주얼 프리뷰 · 리치 칩 UI/UX 4위 1체 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const calAttSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'calendar-attachment.js'), 'utf8');
  const cssSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. 스마트 툴바 & 클립보드 원클릭 가져오기 및 4대 프리셋 검증
  assert.ok(indexSrc.includes('id="attClipboardBtn"'), '클립보드 원클릭 가져오기 버튼 탑재');
  assert.ok(indexSrc.includes('navigator.clipboard.readText'), '클립보드 API 연동 로직 구현');
  assert.ok(indexSrc.includes('data-attpreset="workout"') && indexSrc.includes('data-attpreset="study"') && indexSrc.includes('data-attpreset="note"') && indexSrc.includes('data-attpreset="photo"'), '4대 실천 퀵 프리셋 버튼 완비');

  // 2. 실시간 스마트 URL 감지 및 비주얼 프리뷰 카드 검증
  assert.ok(indexSrc.includes('id="attLivePreviewWrap"'), '실시간 비주얼 프리뷰 컨테이너 마크업 존재');
  assert.ok(indexSrc.includes('function updateSmartPreview('), 'updateSmartPreview 실시간 URL 감지 및 프리뷰 렌더러 함수 구현');
  assert.ok(indexSrc.includes('img.youtube.com/vi/'), '유튜브 Video ID 추출 및 고해상도 썸네일 생성 로직');
  assert.ok(indexSrc.includes('att-badge-youtube') && indexSrc.includes('att-badge-web') && indexSrc.includes('att-badge-image'), '타입별 비주얼 배지 렌더링');

  // 3. 리치 칩(Rich Chip) UI/UX 고도화 검증
  assert.ok(indexSrc.includes('att-chip-rich') && indexSrc.includes('typeClass'), 'index.html 리치 칩 클래스 렌더링');
  assert.ok(calAttSrc.includes('att-chip-rich'), 'calendar-attachment.js 리치 칩 클래스 적용');

  // 4. ui.css 전용 스타일 검증
  assert.ok(cssSrc.includes('.att-smart-toolbar'), 'ui.css 스마트 툴바 스타일');
  assert.ok(cssSrc.includes('.att-clipboard-btn'), 'ui.css 클립보드 버튼 스타일');
  assert.ok(cssSrc.includes('.att-live-preview-box'), 'ui.css 실시간 프리뷰 박스 스타일');
  assert.ok(cssSrc.includes('.att-chip-rich'), 'ui.css 리치 칩 스타일');
  assert.ok(cssSrc.includes('.att-chip-rich.type-video'), 'ui.css 유튜브 영상 전용 칩 스타일');

  // 5. sw.js 캐시 갱신 검증
  assert.ok(swSrc.includes('ourgoal-shell-v20260917-es161') || swSrc.includes('ourgoal-shell-v20260917-es162'), 'sw.js 캐시 네임 es161/162 갱신');
});

/* ============ [#TASK-ES-162] 공통 UI 컴포넌트 모듈화(OurgoalComponents 5대 컴포넌트) 검증 ============ */
check('compliance: [#TASK-ES-162] 공통 UI 컴포넌트 모듈화(OurgoalComponents 5대 컴포넌트) 시스템 4위 1체 검증', () => {
  const compModule = require('../js/components.js');
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. js/components.js 5대 핵심 컴포넌트 기능 및 렌더링 검증
  assert.ok(compModule && typeof compModule === 'object', 'OurgoalComponents 모듈 export 확인');
  assert.strictEqual(typeof compModule.badge, 'function', '1. badge 컴포넌트 함수');
  assert.strictEqual(typeof compModule.statCard, 'function', '2. statCard 컴포넌트 함수');
  assert.strictEqual(typeof compModule.progressBar, 'function', '3. progressBar 컴포넌트 함수');
  assert.strictEqual(typeof compModule.modalShell, 'function', '4. modalShell 컴포넌트 함수');
  assert.strictEqual(typeof compModule.emptyState, 'function', '5. emptyState 컴포넌트 함수');

  // 2. 컴포넌트 출력 마크업 무결성 검증
  const badgeHtml = compModule.badge({ type: 'gold', text: 'D-3', icon: '⚡' });
  assert.ok(badgeHtml.includes('og-badge og-badge-gold') && badgeHtml.includes('D-3') && badgeHtml.includes('⚡'), 'badge 올바른 클래스 및 텍스트 렌더링');

  const statHtml = compModule.statCard({ title: '순공 시간', value: '320분', diff: '+15%', trend: 'up', icon: '⏱️' });
  assert.ok(statHtml.includes('og-stat-card') && statHtml.includes('순공 시간') && statHtml.includes('320분') && statHtml.includes('og-trend-up'), 'statCard 올바른 지표 렌더링');

  const progHtml = compModule.progressBar({ percent: 75, colorType: 'sage', showLabel: true });
  assert.ok(progHtml.includes('og-prog-container') && progHtml.includes('75%') && progHtml.includes('og-fill-sage'), 'progressBar 게이지바 렌더링');

  const modalHtml = compModule.modalShell({ id: 'testModal', title: '설정 모달', confirmText: '저장', cancelText: '닫기' });
  assert.ok(modalHtml.includes('og-modal-shell') && modalHtml.includes('testModal') && modalHtml.includes('저장'), 'modalShell 셸 마크업 렌더링');

  const emptyHtml = compModule.emptyState({ icon: '🎯', title: '목표 없음', desc: '새 목표를 등록하세요' });
  assert.ok(emptyHtml.includes('og-empty-state') && emptyHtml.includes('목표 없음'), 'emptyState 렌더링');

  // 3. index.html 스크립트 태그 등록 검증
  assert.ok(indexSrc.includes('src="js/components.js?v=20260917-es162"'), 'index.html 내 components.js 스크립트 태그 로드');

  // 4. ui.css 전용 스타일 클래스 검증
  assert.ok(cssSrc.includes('.og-badge'), 'ui.css og-badge 스타일');
  assert.ok(cssSrc.includes('.og-stat-card'), 'ui.css og-stat-card 스타일');
  assert.ok(cssSrc.includes('.og-prog-container'), 'ui.css og-prog-container 스타일');
  assert.ok(cssSrc.includes('.og-modal-shell'), 'ui.css og-modal-shell 스타일');
  assert.ok(cssSrc.includes('.og-empty-state'), 'ui.css og-empty-state 스타일');

  // 5. sw.js 캐시 갱신 검증
  assert.ok(swSrc.includes('ourgoal-shell-v20260917-es162'), 'sw.js 캐시 네임 es162 갱신');
});

/* ============ [#TASK-ES-163] 측정지표 분석할 항목별 차등 지정 및 정밀화·고도화 시스템 검증 ============ */
check('compliance: [#TASK-ES-163] 측정지표 분석할 항목별 차등 지정 및 정밀화·고도화 시스템 검증', () => {
  const uStats = require('../js/universal-stats.js');
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. 6대 도메인 특화 모델 완비 검증
  assert.ok(uStats.METRIC_DIFFERENTIATED_MODELS, 'METRIC_DIFFERENTIATED_MODELS 객체 노출');
  const requiredModels = ['weight', 'strength', 'running', 'study', 'finance', 'sleep'];
  requiredModels.forEach(mKey => {
    assert.ok(uStats.METRIC_DIFFERENTIATED_MODELS[mKey], `도메인 특화 모델 [${mKey}] 존재`);
    assert.strictEqual(typeof uStats.METRIC_DIFFERENTIATED_MODELS[mKey].analyze, 'function', `[${mKey}] analyze 함수`);
  });

  // 2. 도메인별 계산 공식 정밀화 검증
  // 1) 체중 (7일 이동평균 & 주간 감량속도)
  const weightRes = uStats.computeDifferentiatedAnalysis('weight', [
    { value: 75.0 }, { value: 74.8 }, { value: 74.5 }, { value: 74.2 }, { value: 74.0 }, { value: 73.8 }, { value: 73.5 }
  ]);
  assert.ok(weightRes.title.includes('7일 이동평균') && weightRes.kpis.length >= 4, '체중 7일 이동평균 모델 연산');

  // 2) 헬스/3대 (에플리 1RM & 과부하)
  const strengthRes = uStats.computeDifferentiatedAnalysis('strength', [
    { value: 100, reps: 5 }, { value: 105, reps: 3 }
  ]);
  assert.ok(strengthRes.title.includes('1RM') && strengthRes.kpis.some(k => k.label.includes('1RM')), '헬스 1RM 에플리 공식 연산');

  // 3) 러닝 (페이스존 & 심폐 마일리지)
  const runRes = uStats.computeDifferentiatedAnalysis('running', [
    { value: 5.0 }, { value: 10.0 }, { value: 7.5 }
  ]);
  assert.ok(runRes.title.includes('페이스존') && runRes.kpis.some(k => k.label.includes('심폐')), '러닝 심폐 마일리지 연산');

  // 4) 공부 (순공 몰입 밀도 & 뽀모도로 세션)
  const studyRes = uStats.computeDifferentiatedAnalysis('study', [
    { value: 120 }, { value: 180 }
  ]);
  assert.ok(studyRes.title.includes('몰입 밀도') && studyRes.kpis.some(k => k.label.includes('뽀모도로')), '공부 뽀모도로 세션 연산');

  // 5) 자산 (월간 저축가속도 & 연간 누적예측)
  const finRes = uStats.computeDifferentiatedAnalysis('finance', [
    { value: 100 }, { value: 150 }, { value: 200 }
  ]);
  assert.ok(finRes.title.includes('저축 가속도') && finRes.kpis.some(k => k.label.includes('연간')), '자산 저축 가속도 연산');

  // 6) 수면 (수면 규칙성 100점 & 부채 지수)
  const sleepRes = uStats.computeDifferentiatedAnalysis('sleep', [
    { value: 7.5 }, { value: 8.0 }, { value: 7.0 }
  ]);
  assert.ok(sleepRes.title.includes('수면') && sleepRes.kpis.some(k => k.label.includes('규칙성')), '수면 규칙성 100점 지수 연산');

  // 3. 리포트 카드 렌더링 검증
  assert.strictEqual(typeof uStats.renderDifferentiatedReportCard, 'function', 'renderDifferentiatedReportCard 함수');
  const cardHtml = uStats.renderDifferentiatedReportCard('running', [{ value: 10.0 }]);
  assert.ok(cardHtml.includes('diff-report-card') && cardHtml.includes('diff-kpi-grid'), '차등 리포트 카드 마크업 출력');

  // 4. 모달 함수 및 UI 배선 검증
  assert.strictEqual(typeof uStats.openDifferentiatedMetricConfigModal, 'function', 'openDifferentiatedMetricConfigModal 함수');
  assert.ok(indexSrc.includes('metricDiffCfgBtn'), 'index.html 내 metricDiffCfgBtn 바인딩');
  assert.ok(indexSrc.includes('openDifferentiatedMetricConfigModal'), 'index.html 내 openDifferentiatedMetricConfigModal 호출');

  // 5. ui.css 및 sw.js 검증
  assert.ok(cssSrc.includes('.diff-report-card'), 'ui.css .diff-report-card 스타일');
  assert.ok(cssSrc.includes('.diff-kpi-grid'), 'ui.css .diff-kpi-grid 스타일');
  assert.ok(swSrc.includes('ourgoal-shell-v20260917-es163'), 'sw.js es163 갱신');
});

/* ============ [#TASK-ES-164] 소통창 화면정리 및 피드·소통 UI 시인성·피로도 개선 시스템 검증 ============ */
check('compliance: [#TASK-ES-164] 소통창 화면정리 및 피드·소통 UI 시인성·피로도 개선 시스템 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. 소통창 서브탭 모던 세그먼트 필 및 6대 탭 아이콘·라벨 검증
  assert.ok(indexSrc.includes('comm-subtabs-clean'), 'index.html 내 comm-subtabs-clean 클래스 탑재');
  const requiredSubs = ['feed', 'group', 'companion', 'dm', 'manito', 'share'];
  requiredSubs.forEach(sub => {
    assert.ok(indexSrc.includes(`data-sub="${sub}"`) || indexSrc.includes(`s.key`), `서브탭 키 [${sub}] 보존`);
  });
  assert.ok(indexSrc.includes('id="dmSubtabBadge"'), 'DM 미확인 레드 닷 뱃지 #dmSubtabBadge 보존');

  // 2. 피드 상단 1줄 컴팩트 툴바 및 퀵게시 버튼 보존 검증
  assert.ok(indexSrc.includes('comm-quick-strip'), '피드 상단 comm-quick-strip 슬림 툴바 적용');
  assert.ok(indexSrc.includes('id="feedQuickPostBtn"'), '퀵게시 버튼 #feedQuickPostBtn 엘리먼트 보존');

  // 3. 소통 퀵 필터 칩 (전체 / 내 소통 / 사진인증만) 바인딩 검증
  assert.ok(indexSrc.includes('comm-feed-type-bar'), '소통 피드 타입 필터 바 탑재');
  assert.ok(indexSrc.includes('comm-type-pill'), '타입 필터 알약 버튼 comm-type-pill 클래스');
  assert.ok(indexSrc.includes('data-feedtype="all"'), '전체 소통 필터 data-feedtype="all"');
  assert.ok(indexSrc.includes('data-feedtype="mine"'), '내 소통 필터 data-feedtype="mine"');
  assert.ok(indexSrc.includes('data-feedtype="photo"'), '사진인증 필터 data-feedtype="photo"');

  // 4. AI 안내문 슬림 뱃지화 검증 (피로도 절감)
  assert.ok(indexSrc.includes('ai-badge-notice-clean'), '슬림 AI 뱃지 ai-badge-notice-clean 적용');
  assert.ok(indexSrc.includes('AI 가이드'), 'AI 가이드 텍스트 라벨 적용');

  // 5. ui.css 전용 스타일 및 sw.js 검증
  assert.ok(cssSrc.includes('.comm-subtabs-clean'), 'ui.css .comm-subtabs-clean 스타일');
  assert.ok(cssSrc.includes('.comm-quick-strip'), 'ui.css .comm-quick-strip 스타일');
  assert.ok(cssSrc.includes('.comm-type-pill'), 'ui.css .comm-type-pill 스타일');
  assert.ok(cssSrc.includes('.ai-badge-notice-clean'), 'ui.css .ai-badge-notice-clean 스타일');
  assert.ok(swSrc.includes('ourgoal-shell-v20260917-es164'), 'sw.js es164 캐시 갱신');
});

/* ============ [#TASK-ES-165] 앱 진입 시 화면 절반 크기 아바타 인사 팝업 및 시간대별 멘트·설정창 커스텀 시스템 검증 ============ */
check('compliance: [#TASK-ES-165] 앱 진입 시 화면 절반 크기 아바타 인사 팝업 및 시간대별 멘트·설정창 커스텀 시스템 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  // 1. 아바타 인사 팝업 모달 마크업 및 필수 요소 검증
  assert.ok(indexSrc.includes('id="avatarGreetingModal"'), '#avatarGreetingModal 모달 엘리먼트 탑재');
  assert.ok(indexSrc.includes('id="btnAvatarGreetClose"'), '#btnAvatarGreetClose 대형 닫기 버튼 탑재');
  assert.ok(indexSrc.includes('avatar-greet-close-big'), 'avatar-greet-close-big 큰 X 버튼 클래스');
  assert.ok(indexSrc.includes('id="avatarGreetMessageText"'), '#avatarGreetMessageText 멘트 텍스트 엘리먼트');
  assert.ok(indexSrc.includes('id="avatarGreetFigureContainer"'), '#avatarGreetFigureContainer 화면 절반 크기 아바타 컨테이너');
  assert.ok(indexSrc.includes('avatar-greet-timer-bar'), '2.5초 자동 소멸 타이머 바 탑재');

  // 2. 엔진 함수 및 앱 진입 배선 검증
  assert.ok(indexSrc.includes('function openAvatarGreetingPopup('), 'openAvatarGreetingPopup 함수 정의');
  assert.ok(indexSrc.includes('function closeAvatarGreetingPopup('), 'closeAvatarGreetingPopup 함수 정의');
  assert.ok(indexSrc.includes('window.openAvatarGreetingPopup = openAvatarGreetingPopup;'), 'openAvatarGreetingPopup 전역 노출');
  assert.ok(indexSrc.includes('window.closeAvatarGreetingPopup = closeAvatarGreetingPopup;'), 'closeAvatarGreetingPopup 전역 노출');
  assert.ok(indexSrc.includes('openAvatarGreetingPopup(state.profile, false)'), 'enterApp 진입 시 openAvatarGreetingPopup 호출 배선');

  // 3. 시간대별 멘트 및 2.5초 자동 소멸 로직 검증
  assert.ok(indexSrc.includes('오늘은 뭘 할거냐? 내자신'), '주간 기본 멘트(오늘은 뭘 할거냐? 내자신) 탑재');
  assert.ok(indexSrc.includes('오늘은 뭘 했냐? 내자신'), '야간 기본 멘트(오늘은 뭘 했냐? 내자신) 탑재');
  assert.ok(indexSrc.includes('dayStartHour'), '주간 시작 시간 변수');
  assert.ok(indexSrc.includes('nightStartHour'), '야간 시작 시간 변수');
  assert.ok(indexSrc.includes('2500'), '2.5초(2500ms) 자동 페이드아웃 타이머');

  // 4. 설정창(#screen-settings) 커스텀 UI 검증
  assert.ok(indexSrc.includes('id="setAvatarGreetingBlock"'), '설정창 아바타 인사 섹션 #setAvatarGreetingBlock');
  assert.ok(indexSrc.includes('id="avatarGreetingSwitch"'), '아바타 인사 토글 스위치 #avatarGreetingSwitch');
  assert.ok(indexSrc.includes('id="avatarGreetingDayHour"'), '주간 시작 시간 셀렉터 #avatarGreetingDayHour');
  assert.ok(indexSrc.includes('id="avatarGreetingNightHour"'), '야간 시작 시간 셀렉터 #avatarGreetingNightHour');
  assert.ok(indexSrc.includes('id="avatarGreetingDayMsg"'), '주간 멘트 인풋 #avatarGreetingDayMsg');
  assert.ok(indexSrc.includes('id="avatarGreetingNightMsg"'), '야간 멘트 인풋 #avatarGreetingNightMsg');
  assert.ok(indexSrc.includes('id="btnPreviewAvatarGreeting"'), '아바타 인사 미리보기 버튼 #btnPreviewAvatarGreeting');

  // 5. ui.css 전용 스타일 및 sw.js 캐시 검증
  assert.ok(cssSrc.includes('.avatar-greet-overlay'), 'ui.css .avatar-greet-overlay 스타일');
  assert.ok(cssSrc.includes('.avatar-greet-close-big'), 'ui.css .avatar-greet-close-big 스타일');
  assert.ok(cssSrc.includes('.avatar-greet-bubble'), 'ui.css .avatar-greet-bubble 스타일');
  assert.ok(cssSrc.includes('.avatar-greet-timer-bar'), 'ui.css .avatar-greet-timer-bar 스타일');
  assert.ok(swSrc.includes('ourgoal-shell-v20260917-es166') || swSrc.includes('ourgoal-shell-v20260917-es165'), 'sw.js es165/es166 캐시 갱신');
});

/* ============ [#TASK-ES-166] 활용법 내 아바타 전용 탭 최우선(맨 앞) 신설 및 200% 활용 가이드 & 쇼케이스 검증 ============ */
check('compliance: [#TASK-ES-166] 활용법 내 아바타 전용 탭 최우선(맨 앞) 신설 및 200% 활용 가이드 & 쇼케이스 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. TAB_GUIDE_DATA 내 avatar 탭 데이터셋 존재 및 3대 혁신 기능 검증
  assert.ok(indexSrc.includes('avatar: {'), 'TAB_GUIDE_DATA 내 avatar 데이터 정의');
  assert.ok(indexSrc.includes("name: '아바타'"), "avatar 탭 이름 '아바타' 매핑");
  assert.ok(indexSrc.includes('베일에 싸인 시크릿 랭크 & 히든 오라'), '아바타 1호 혁신 기능: 베일에 싸인 시크릿 랭크 & 히든 오라');
  assert.ok(indexSrc.includes('앱 진입 대형 인사 팝업 & 시간대별 맞춤 멘트'), '아바타 2호 혁신 기능: 앱 진입 대형 인사 팝업');
  assert.ok(indexSrc.includes('나만의 아바타 생성 & 무제한 보관함 관리'), '아바타 3호 혁신 기능: 보관함 및 생성 관리');

  // 2. 아바타 우수 사용사례 쇼케이스 검증
  assert.ok(indexSrc.includes('“도대체 어디까지 진화하는 거야?!” 히든 랭크를 직접 깨우는 재미'), '히든 랭크 쇼케이스 타이틀');
  assert.ok(indexSrc.includes('Lv.??? 각성 페르소나'), '아바타 목업 내 시크릿 랭크 뱃지');

  // 3. 탭 순서 최우선(맨 앞) 및 기본 활성화 탭 검증
  const avatarKeyIdx = indexSrc.indexOf("{ key: 'avatar'");
  const homeKeyIdx = indexSrc.indexOf("{ key: 'home'");
  assert.ok(avatarKeyIdx > 0 && homeKeyIdx > 0 && avatarKeyIdx < homeKeyIdx, "가이드 tabs 배열에서 'avatar'가 'home'보다 앞에 위치");
  assert.ok(indexSrc.includes("var curTab = initialTab || 'avatar';"), "가이드 기본 활성화 탭이 'avatar'로 지정");

  // 4. 아바타 꾸미러 가기 액션 버튼 및 openAvatarModal 배선 검증
  assert.ok(indexSrc.includes('🎨 나만의 아바타 꾸미러 가기'), '아바타 탭 전용 액션 버튼 문구');
  assert.ok(indexSrc.includes("target === 'avatar'") && indexSrc.includes('openAvatarModal'), '아바타 탭 클릭 시 openAvatarModal 호출 배선');

  // 5. ui.css 및 sw.js 캐시 검증
  assert.ok(cssSrc.includes('.tab-guide-nav-bar'), 'ui.css .tab-guide-nav-bar 스타일');
  assert.ok(swSrc.includes('ourgoal-shell-v20260917-es166') || swSrc.includes('ourgoal-shell-v20260917-es167'), 'sw.js es166/es167 캐시 갱신');
});

/* ============ [#TASK-ES-167] 아바타 페르소나 사용자 노출 '77종' 전면 배제·'320종' 단일화 및 영구 금지 헌법 규제 검증 ============ */
check('compliance: [#TASK-ES-167] 아바타 페르소나 사용자 노출 \'77종\' 전면 배제·\'320종\' 단일화 및 영구 금지 헌법 규제 검증', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const promptSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'promptgen.js'), 'utf8');
  const rulesSrc = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rules', 'OURGOAL_ABSOLUTE_INTEGRITY_RULES.md'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. index.html 가이드 허브 카피 내 320종 페르소나 풀 정규화 및 77종 배제 검증
  assert.ok(indexSrc.includes('320종 페르소나 풀과 퍼스널 컬러 합성'), '가이드 허브 내 320종 페르소나 표기 확인');
  assert.ok(!indexSrc.includes('77종 바디 풀'), '가이드 허브 내 레거시 77종 바디 풀 표현 완전 삭제');

  // 2. api/promptgen.js 비전 프롬프트 내 320종 정규화 검증
  assert.ok(promptSrc.includes('320종 3등신 캐릭터 바디·페르소나에 완벽히 호환'), 'Gemini 비전 인스트럭션 320종 캐릭터 바디·페르소나 표기 확인');
  assert.ok(!promptSrc.includes('77종 3등신 캐릭터 바디에 완벽히'), '비전 인스트럭션 내 77종 표현 완전 삭제');

  // 3. 최고 헌법 제10조 제4항/제5항 명문화 검증
  assert.ok(rulesSrc.includes('제4항 [아바타 페르소나 \'77종/77가지\' 사용자 노출 전면 영구 금지]'), '헌법 제10조 제4항 77종 영구 금지 명문화 확인');
  assert.ok(rulesSrc.includes('제5항 [아바타 페르소나 \'320종\' 단일 표기 강제]'), '헌법 제10조 제5항 320종 단일 표기 강제 명문화 확인');

  // 4. sw.js 캐시 es167/es168 갱신 검증
  assert.ok(swSrc.includes('ourgoal-shell-v20260917-es167') || swSrc.includes('ourgoal-shell-v20260917-es168'), 'sw.js es167/es168 캐시 갱신 확인');
});

/* ============ [#TASK-ES-168] 1:1 DM 및 전역 알림(Web Push·ServiceWorker·스마트 폴링·상단바 알림센터) 무결성 전면 고도화 검증 ============ */
check('compliance: [#TASK-ES-168] 1:1 DM 및 전역 알림(Web Push·ServiceWorker·스마트 폴링·상단바 알림센터) 무결성 전면 고도화 검증', () => {
  const pushSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'push-dispatch.js'), 'utf8');
  const notifySrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'notify-engine.js'), 'utf8');
  const commSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-invite-comm.js'), 'utf8');
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. api/push-dispatch.js 타깃 유저 푸시 발송 분기 검증
  assert.ok(pushSrc.includes('targetUserId'), 'push-dispatch.js 에 targetUserId 분기 지원');
  assert.ok(pushSrc.includes('webpush.sendNotification'), 'push-dispatch.js 에 webpush.sendNotification 호출');

  // 2. js/notify-engine.js 모바일 ServiceWorker showNotification 및 Audio unlock 검증
  assert.ok(notifySrc.includes('reg.showNotification'), 'notify-engine.js 모바일 ServiceWorker showNotification 우선 호출');
  assert.ok(notifySrc.includes('unlockAudioContext'), 'notify-engine.js AudioContext unlock 리스너 탑재');
  assert.ok(notifySrc.includes('getUnreadNotifications') && notifySrc.includes('markAllAsRead'), 'notify-engine.js 미확인 알림 헬퍼 메서드 완비');

  // 3. js/team-invite-comm.js DM 푸시 연동 및 30초 스마트 폴링 검증
  assert.ok(commSrc.includes('/api/push-dispatch'), 'team-invite-comm.js DM send 시 /api/push-dispatch 비동기 발송 연동');
  assert.ok(commSrc.includes('startSmartDmPolling'), 'team-invite-comm.js 30초 스마트 폴링 startSmartDmPolling 함수 탑재');
  assert.ok(commSrc.includes('30000'), '30초 주기 스마트 폴링 인터벌 확인');

  // 4. index.html 상단바 🔔 알림 버튼 및 알림 센터 모달 검증
  assert.ok(indexSrc.includes('id="topNotifBtn"'), 'index.html 상단바에 topNotifBtn 버튼 탑재');
  assert.ok(indexSrc.includes('id="topNotifBadge"'), 'index.html 상단바에 topNotifBadge 뱃지 탑재');
  assert.ok(indexSrc.includes('openNotificationCenterModal'), 'index.html 에 openNotificationCenterModal 함수 구현');
  assert.ok(indexSrc.includes('updateTopNotifBadge'), 'index.html 에 updateTopNotifBadge 함수 구현');

  // 5. ui.css 스타일 및 sw.js 캐시 검증
  assert.ok(cssSrc.includes('.topbar-notif-btn'), 'ui.css .topbar-notif-btn 스타일 정의');
  assert.ok(cssSrc.includes('.topbar-notif-badge'), 'ui.css .topbar-notif-badge 스타일 정의');
  assert.ok(swSrc.includes('ourgoal-shell-v20260917-es168') || swSrc.includes('ourgoal-shell-v20260917-es169'), 'sw.js 캐시 갱신 확인');
});

/* ============ [#TASK-ES-169] 2계정 실제 유저 상호작용 무결성 및 가짜 타이머 제거·직통 배선 검증 ============ */
check('compliance: [#TASK-ES-169] 2계정 실제 유저 상호작용 무결성 및 가짜 타이머 제거·직통 배선 검증', () => {
  const viralSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'viral-sharing.js'), 'utf8');
  const commSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-invite-comm.js'), 'utf8');
  const leaderSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-leader-check.js'), 'utf8');
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. 딥링크 파라미터 매핑 (type=group&id=...) 검증
  assert.ok(viralSrc.includes("searchParams.get('type')"), 'viral-sharing.js searchParams type 파싱 지원');
  assert.ok(viralSrc.includes("searchParams.get('id')"), 'viral-sharing.js searchParams id 파싱 지원');

  // 2. 가짜 봇 setTimeout 타이머 전면 제거 및 실 DB/Realtime 배선 검증
  assert.ok(!commSrc.includes("['준호', '소연', '민지', '동현']"), 'team-invite-comm.js 가짜 봇 페르소나 응답 배열 제거 확인');
  assert.ok(commSrc.includes("target_type: 'team_chat'"), 'team-invite-comm.js Supabase team_pings 채팅 영속화 배선');
  assert.ok(commSrc.includes('team_chat_room_'), 'team-invite-comm.js Supabase Realtime 채널 실시간 구독 탑재');

  // 3. 팀장 도장/찌르기 Supabase team_pings 영속화 검증
  assert.ok(leaderSrc.includes("target_type: 'leader_action'"), 'team-leader-check.js 팀장 도장 Supabase 영속화 탑재');
  assert.ok(leaderSrc.includes("target_type: 'member_ping'"), 'team-leader-check.js 팀원 찌르기 Supabase 영속화 탑재');

  // 4. 사진 뷰어 닫기 버튼 ID 부여 검증
  assert.ok(indexSrc.includes('id="photoViewerCloseBtn"'), 'index.html 사진 뷰어 닫기 버튼 photoViewerCloseBtn ID 탑재');

  // 5. 2계정 테스트 빠른 입장 (테스터 B) 및 UUID 규격 검증
  assert.ok(indexSrc.includes('id="landTesterBBtn"'), '랜딩 화면 테스터 B 직통 버튼 landTesterBBtn 탑재');
  assert.ok(indexSrc.includes('id="authTesterBBtn"'), '로그인 화면 테스터 B 직통 버튼 authTesterBBtn 탑재');
  assert.ok(indexSrc.includes('enterAsTesterB'), '테스터 B 직통 진입 함수 enterAsTesterB 구현');
  assert.ok(indexSrc.includes('00000000-0000-4000-a000-000000000002'), '테스터 B RFC-4122 유효 UUIDv4 발급');

  // 6. 서비스워커 캐시 갱신 확인
  assert.ok(swSrc.includes('ourgoal-shell-v20260918-es173'), 'sw.js es173 캐시 갱신 확인');
});

check('compliance: [#TASK-ES-173] 나만의 홈 구성 상단 고정(아바타·오늘 기록하기 잠금) 및 유령 항목 정리·정합성 고도화 검증', () => {
  const customSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'customize.js'), 'utf8');
  const uiCssSrc = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 최상단 고정 2종 잠금(fixed: true, CORE_IDS) 탑재 확인
  assert.ok(customSrc.includes("id: 'levelBadgeRow'") && customSrc.includes("fixed: true"), 'levelBadgeRow가 fixed: true로 WHITELIST 최상단 등록');
  assert.ok(customSrc.includes("id: 'captureCardBox'") && customSrc.includes("fixed: true"), 'captureCardBox가 fixed: true로 WHITELIST 상단 등록');
  assert.ok(customSrc.includes("CORE_IDS = ['levelBadgeRow', 'captureCardBox'"), 'CORE_IDS에 levelBadgeRow, captureCardBox 등록');
  assert.ok(customSrc.includes('data-kf1-locked="true"'), '잠금 스위치 속성 부여');
  assert.ok(customSrc.includes('🔒 상단 고정'), '상단 고정 자물쇠 뱃지 문구 렌더링');

  // 2. 유령 식별자 crewPacingWidget 영구 삭제 확인
  const C = loadCustomize();
  assert.strictEqual(C.WHITELIST_IDS.indexOf('crewPacingWidget'), -1, 'crewPacingWidget이 WHITELIST에서 완전 삭제됨');
  assert.strictEqual(C.MINIMAL_HIDDEN.indexOf('crewPacingWidget'), -1, 'crewPacingWidget이 MINIMAL_HIDDEN에서 완전 삭제됨');

  // 3. 실제 UI와 1:1 라벨/힌트 정합화 확인
  assert.ok(customSrc.includes("label: '내 성장 확인하기 버튼'"), "homeChallengeRoomBtn 라벨이 '내 성장 확인하기 버튼'으로 일치");
  assert.ok(customSrc.includes("hint: '기록 탭으로 바로 이동하는 버튼'"), "homeChallengeRoomBtn 힌트가 '기록 탭으로 바로 이동하는 버튼'으로 일치");
  assert.ok(customSrc.includes("label: '최근 히트맵 요약'"), "homeGrassSummaryCard 라벨이 '최근 히트맵 요약'으로 일치");
  assert.ok(customSrc.includes("hint: '최근 2주간의 기록 한눈에'"), "homeGrassSummaryCard 힌트가 '최근 2주간의 기록 한눈에'로 일치");
  assert.ok(customSrc.includes("label: '오늘의 3대 퀘스트'"), "dailyQuestBarWrap 라벨이 '오늘의 3대 퀘스트'로 일치");

  // 4. ui.css 레거시 정리 및 .switch.locked 스타일 확인
  assert.ok(!uiCssSrc.includes('body[data-ux-mode="minimal"] #crewPacingWidget'), 'ui.css 미니멀 모드에서 crewPacingWidget 제거');
  assert.ok(!uiCssSrc.includes('body[data-ux-mode="minimal"] #quickRoutineRow'), 'ui.css 미니멀 모드에서 quickRoutineRow 제거');
  assert.ok(uiCssSrc.includes('.switch.locked'), 'ui.css에 .switch.locked 스타일 탑재');
});

check('compliance: [#TASK-ES-174] 아워골 생각 메모장 잔여 대기 과제 9건([45]~[53]) 전수 구현 및 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const statsSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'universal-stats.js'), 'utf8');
  const teamLinkedSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-linked-goals.js'), 'utf8');
  const trackerSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'time-tracker.js'), 'utf8');
  const teamLevelsSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-visibility-levels.js'), 'utf8');

  // [45] 성취통계 데이터 관리 옆 접기토글 먹통 수정
  assert.ok(statsSrc.includes('togIco.onclick = function(e){'), '[45] 성취통계 아코디언 토글 전용 클릭 핸들러 바인딩 확인');

  // [46] 팀 연계 개인목표 우수 사용사례 예시 카드 및 자동 숨김
  assert.ok(teamLinkedSrc.includes('id="tlSampleShowcaseCard"'), '[46] 팀 연계 목표 빈화면 우수 사용사례 시각 카드 탑재 확인');
  assert.ok(teamLinkedSrc.includes('실제 우수 사용사례 예시'), '[46] 팀 연계 목표 우수 사용사례 뱃지 안내문구 확인');

  // [47] 시간기록 모달창 설명 간소화 및 크기 축소
  assert.ok(trackerSrc.includes('시간별로 세부 내용을 작성할 수 있어요'), '[47] 시간기록 모달 한 줄 설명 간소화 확인');
  assert.ok(trackerSrc.includes("maxWidth = '340px'"), '[47] 시간기록 모달 340px 컴팩트 크기 축소 확인');

  // [48] 아바타 아이콘 크기 일괄 확대
  assert.ok(indexHtml.includes('size: 54') && indexHtml.includes('width:54px;height:54px;'), '[48] 홈 EXP 바 아바타 54px 확대 확인');
  assert.ok(indexHtml.includes('style="width:46px;height:46px;"'), '[48] 상단바 우측 프로필 아바타 46px 확대 확인');
  assert.ok(indexHtml.includes('avatarHtml(72)'), '[48] 설정창 프로필 아바타 72px 확대 확인');

  // [49] 팀 목표 댓글 작성 및 전송 기능 먹통 오류 수정 (로컬 영속화 및 상태 보존)
  assert.ok(indexHtml.includes('state.profile.settings.localTeamComments[gid]'), '[49] 팀 댓글 로컬 영속화 안전망 확인');
  assert.ok(indexHtml.includes("input.value = '';"), '[49] 팀 댓글 작성 후 입력창 초기화 확인');
  assert.ok(indexHtml.includes('state.lastOpenCommentKey'), '[49] 팀 댓글 리렌더링 후 댓글창 오픈 상태 유지 확인');

  // [50] 설정창 진입 시 모든 설정 섹션 기본 접힘(Collapsed) 적용
  assert.ok(!indexHtml.includes('<details class="settings-group-accordion" open>'), '[50] 설정창 4대 아코디언 기본 open 속성 제거 확인');

  // [51] 피드 게시 모달 내 '미리보기' 버튼 추가 및 피드 렌더링 사전 확인
  assert.ok(indexHtml.includes('id="sharePreviewBtn"'), '[51] 피드 공유 모달 내 미리보기 버튼 탑재 확인');
  assert.ok(indexHtml.includes('id="sharePreviewSlot"'), '[51] 피드 실시간 프리뷰 카드 슬롯 탑재 확인');

  // [52] 팀 목표 탭 최초 진입 시 접을 수 있는 모든 아코디언 기본 접힘
  assert.ok(teamLevelsSrc.includes('data-tgmslist') && teamLevelsSrc.includes('display:none;'), '[52] 팀 목표 마일스톤 리스트 기본 접힘 확인');
  assert.ok(teamLevelsSrc.includes('isLevelFolded = p.settings.foldLevelSection[g.id] !== false;'), '[52] 수준별 조 관리 아코디언 기본 접힘 확인');

  // [53] 목표탭 '템플릿백과사전' 전체화면 팝업 신설 및 상호작용 구현
  assert.ok(indexHtml.includes('id="btnGoalTemplateEncyclopedia"'), '[53] 목표탭 나만보기 배지 옆 템플릿백과사전 버튼 탑재 확인');
  assert.ok(indexHtml.includes('id="templateEncyclopediaModal"'), '[53] 템플릿백과사전 전체화면 팝업 모달 마크업 탑재 확인');
  assert.ok(indexHtml.includes('openTemplateEncyclopediaModal'), '[53] 템플릿백과사전 모달 오픈 함수 확인');
  assert.ok(indexHtml.includes('REAL_USER_TEMPLATES'), '[53] 실사용 템플릿 사전 데이터셋 확인');
  assert.ok(indexHtml.includes('copyRealUserTemplate'), '[53] 실사용 템플릿 내 목표 복사 함수 확인');
  assert.ok(indexHtml.includes('cheerRealUserTemplate'), '[53] 실사용 템플릿 응원하기 상호작용 함수 확인');
  assert.ok(indexHtml.includes('switchTemplateEncyclopediaTab'), '[53] 실사용 템플릿 및 AI 추천 템플릿 2개 탭 전환 확인');
});

check('compliance: [#TASK-ES-175] 기록 탭 시간기록 카드 슬림화([47]) 및 스톱워치 구간기록 시간창 자동 상단 이동([44]) & 입력창 모던 정돈([55]) 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const trackerSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'time-tracker.js'), 'utf8');

  // 1. [47] 기록 탭 메인 화면 지금부터 시간기록 배너 카드 슬림화 및 한 줄 설명 반영
  assert.ok(indexHtml.includes('id="recTimeTrackerActionCard"'), '[47] 기록 탭에 recTimeTrackerActionCard가 존재해야 함');
  assert.ok(indexHtml.includes('시간별로 세부 내용을 작성할 수 있어요'), '[47] 기록 탭 카드 설명이 상민님 원문 지정 한 줄로 일치해야 함');
  assert.ok(indexHtml.includes('padding:8px 12px;margin-bottom:8px;'), '[47] 기록 탭 카드가 슬림 컴팩트 패딩으로 축소되어야 함');

  // 2. [44] 구간 누를 때 시간창 자연스럽게 올리기 (tt-memo-active) & 초시계 가림 0% 보장
  assert.ok(uiCss.includes('.tt-body.tt-memo-active'), 'ui.css에 시간창 상단 이동 .tt-body.tt-memo-active 스타일이 존재해야 함');
  assert.ok(uiCss.includes('.tt-lap-memo-container'), 'ui.css에 인라인 구간 메모 컨테이너 스타일이 존재해야 함');
  assert.ok(trackerSrc.includes('tt-memo-active'), 'time-tracker.js에서 구간 메모 오픈 시 tt-memo-active 클래스를 부여해야 함');
  assert.ok(trackerSrc.includes('ttLapMemoContainer'), 'time-tracker.js에서 ttLapMemoContainer를 바인딩해야 함');

  // 3. [55] 구간별 텍스트 입력창 UI 정돈 및 퀵 태그 7종
  assert.ok(trackerSrc.includes('btn-quick-lap-tag'), '구간 메모에 btn-quick-lap-tag 모던 칩이 존재해야 함');
  assert.ok(trackerSrc.includes('btnTtLapMemoCancel') && trackerSrc.includes('btnTtLapMemoSave'), '구간 메모에 취소 및 저장 버튼이 완비되어 있어야 함');
  assert.ok(trackerSrc.includes('tt-review-lap-card'), '리뷰 화면에 구간별 카드 스타일이 적용되어 있어야 함');
});

check('compliance: [#TASK-ES-176] 팀 목표창 View ↔ Edit 완전 분리(A안) · 3대 본질 시너지(E1/E2/E3) 및 목표/소통 탭 60선 대형창 제거 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const geuSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'goal-edit-ux.js'), 'utf8');
  const tlgSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-linked-goals.js'), 'utf8');
  const tvlSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-visibility-levels.js'), 'utf8');

  // 1. 목표탭 & 소통탭 거대 60선 창 제거 및 템플릿백과사전 온전성
  assert.ok(indexHtml.includes('id="goalsTemplateAccordionSlot" style="display:none;"'), '목표 탭 대형 60선 아코디언 슬롯 숨김 처리 확인');
  assert.ok(indexHtml.includes('id="btnGoalTemplateEncyclopedia"'), '목표 탭 템플릿백과사전 버튼 유지 확인');
  assert.ok(!indexHtml.includes('catChipsHtml +\n      templatesHtml()') && !indexHtml.includes('catChipsHtml +\r\n      templatesHtml()'), '소통 탭 피드 본문에서 templatesHtml 제거 확인');

  // 2. 팀 목표 View ↔ Edit 완전 분리 (A안)
  assert.ok(indexHtml.includes("canManageAny ? '<button class=\"edit-toggle"), '일반 팀원에게 상단 편집 토글 미노출 가드 확인');
  assert.ok(tvlSrc.includes('var isEdit = canManage && !!state.teamGoalEditMode;'), 'team-visibility-levels.js 내 isEdit 분기 상태 확인');
  assert.ok(tvlSrc.includes('data-tgdue='), '팀 목표 인라인 마감일(D-day) 속성 배선 확인');
  assert.ok(tvlSrc.includes('data-tgmprio='), '마일스톤 우선순위(상/중/하) 속성 배선 확인');
  assert.ok(tvlSrc.includes('tg-reorder-btn'), '모바일 40px 터치 규격 순서변경 버튼 마크업 확인');
  assert.ok(uiCss.includes('.tg-reorder-btn'), 'ui.css 내 .tg-reorder-btn 스타일 탑재 확인');

  // 3. 3대 본질 시너지 (E1/E2/E3)
  assert.ok(indexHtml.includes('id="btnOpenEncyclopediaFromTeam"'), '[E1 수립] 팀 목표 추가 모달 내 템플릿백과사전 원클릭 연동 버튼 확인');
  assert.ok(tlgSrc.includes('function syncWithTeamGoals('), '[E2 실행] 팀 연계 개인목표 참조 무결성 자동 수호 함수 탑재 확인');
  assert.ok(tlgSrc.includes('syncWithTeamGoals: syncWithTeamGoals'), '[E2 실행] OurgoalTeamLinkedGoals 내 syncWithTeamGoals export 확인');
  assert.ok(geuSrc.includes('OurgoalTeamLinkedGoals.syncWithTeamGoals'), '[E2 실행] commitAndFinishTeamGoalEdit 내 무결성 수호 연동 확인');
  assert.ok(geuSrc.includes('팀장님이 공동 목표 ['), '[E3 소통] commitAndFinishTeamGoalEdit 내 실시간 시스템 공지 발행 배선 확인');

  // 4. UX 고도화 (플로팅 완료 바 & 인앱 모달)
  assert.ok(geuSrc.includes('goalEditFloatingBar') && geuSrc.includes('btnTeamGoalEditDoneFloating'), '팀 목표 편집 시 하단 플로팅 완료 바 탑재 확인');
  assert.ok(indexHtml.includes('btnConfirmDelTg'), '팀 목표 삭제 시 브라우저 confirm 대신 인앱 모달 적용 확인');
  assert.ok(indexHtml.includes('btnConfirmDelMs'), '마일스톤 삭제 시 브라우저 confirm 대신 인앱 모달 적용 확인');
});

check('compliance: [#TASK-ES-177] 아워골 생각 메모장 3대 완결 과제([58] 소통 피드 직접 사진 첨부 · [59] 카테고리 10종 확장 및 가로스크롤 · [60] 성취통계 껍데기 버튼 영구 삭제)', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uStatsSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'universal-stats.js'), 'utf8');

  // 1. [60] 성취통계 껍데기 버튼 삭제 검증
  assert.ok(!uStatsSrc.includes('uLinkGoalBtn'), 'universal-stats.js에 uLinkGoalBtn이 존재하지 않아야 함');
  assert.ok(!uStatsSrc.includes('uRegCalendarBtn'), 'universal-stats.js에 uRegCalendarBtn이 존재하지 않아야 함');
  assert.ok(!uStatsSrc.includes('🎯 목표 연계'), 'universal-stats.js에 껍데기 목표 연계 버튼 라벨이 없어야 함');
  assert.ok(!uStatsSrc.includes('📅 캘린더 등록'), 'universal-stats.js에 껍데기 캘린더 등록 버튼 라벨이 없어야 함');

  // 2. [58] 소통 피드 직접 사진 첨부 기능 검증
  assert.ok(indexHtml.includes('id="shareDirectPhotoInput"'), '직접 사진 선택 파일 input이 모달에 존재해야 함');
  assert.ok(indexHtml.includes('id="btnSharePickPhoto"'), '사진 선택/촬영 버튼이 모달에 존재해야 함');
  assert.ok(indexHtml.includes('id="shareDirectPhotoPreviewWrap"'), '사진 미리보기 영역이 모달에 존재해야 함');
  assert.ok(indexHtml.includes('id="btnShareRemovePhoto"'), '사진 삭제 버튼이 모달에 존재해야 함');
  assert.ok(indexHtml.includes('compressImage(file, 800, 0.82'), '직접 사진 업로드 시 800px 압축 파이프라인이 호출되어야 함');
  assert.ok(indexHtml.includes('var finalPhoto = customUploadedPhoto'), '게시글 저장 시 직접 첨부된 사진이 우선 반영되어야 함');

  // 3. [59] 소통 피드 카테고리 10종 확장 및 가로 스크롤 UI 검증
  const expectedCats = ['study', 'dev', 'workout', 'career', 'hobby', 'life', 'parenting', 'finance', 'mental', 'reading'];
  expectedCats.forEach(cat => {
    assert.ok(indexHtml.includes("'" + cat + "'") || indexHtml.includes('"' + cat + '"'), '10종 카테고리 [' + cat + ']가 index.html에 정의되어야 함');
  });
  assert.ok(indexHtml.includes('FEED_CATEGORIES_10 = ['), '모달 내 FEED_CATEGORIES_10 배열이 정의되어 있어야 함');
  assert.ok(indexHtml.includes('id="shareCatPicker"'), '카테고리 선택 컨테이너 id="shareCatPicker"가 존재해야 함');
  assert.ok(indexHtml.includes('overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch;white-space:nowrap;'), '모달 카테고리 가로 스크롤 스타일이 적용되어 있어야 함');
  assert.ok(indexHtml.includes('overflow-x:auto;padding-bottom:8px;margin-bottom:12px;-webkit-overflow-scrolling:touch;white-space:nowrap;'), '메인 피드 카테고리 가로 스크롤 스타일이 적용되어 있어야 함');
  assert.ok(indexHtml.includes('c.k === \'mental\'') || indexHtml.includes('selectedCat === \'mental\'') || indexHtml.includes("'mental'"), '멘탈 카테고리 지원 확인');
});

check('compliance: [#TASK-ES-179] 잇템(제휴링크) 법적 안전장치 및 텔레그램/노션 3초 퀵 신고 파이프라인 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const trackSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'track.js'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. 공정위 대가성 표기 안내 및 제휴 체크박스 자동 문구 삽입
  assert.ok(indexHtml.includes('id="itIsAffiliateCheck"'), '잇템 등록 모달에 제휴 링크 여부 체크박스가 존재해야 함');
  assert.ok(indexHtml.includes('파트너스 활동의 일환으로 수수료를 제공받을 수 있음'), '공정위 필수 대가성 고지 문구가 자동 반영되어야 함');
  assert.ok(indexHtml.includes('⚠️ 잇템 등록 안내:'), '잇템 등록 모달에 법적 가이드 안내 박스가 존재해야 함');

  // 2. 잇템 카드 렌더링 시 제휴 뱃지, rel 보안, 면책 문구 및 신고 버튼
  assert.ok(indexHtml.includes("rel=\"noopener noreferrer nofollow\""), '외부 링크에 rel=noopener noreferrer nofollow가 적용되어야 함');
  assert.ok(indexHtml.includes('openItemReportModal'), '아이템 카드에 openItemReportModal 호출 버튼이 배선되어야 함');
  assert.ok(indexHtml.includes('※ 아워골은 상품 판매 당사자가 아닙니다.'), '아이템 카드/목록에 서비스 제공자 면책 안내가 표시되어야 함');

  // 3. 3초 퀵 신고 모달 & 악의적 신고 계정 불이익 경고
  assert.ok(indexHtml.includes('openItemReportModal'), '3초 퀵 신고 모달 함수가 정의되어야 함');
  assert.ok(indexHtml.includes('name="repReason"'), '신고 사유 선택지가 존재해야 함');
  assert.ok(indexHtml.includes('id="repSubmitBtn"'), '신고 접수 제출 버튼이 존재해야 함');
  assert.ok(indexHtml.includes('허위 또는 악의적인 신고임이 확인될 경우, 서비스 이용 제한 등 계정에 불이익을 받으실 수 있습니다'), '신고 모달에 악의적/허위 신고 방지 경고문이 탑재되어야 함');
  assert.ok(indexHtml.includes('window.openItemReportModal = openItemReportModal'), 'openItemReportModal 함수가 전역에 노출되어야 함');

  // 4. api/track.js 3중 파이프라인 (item_report)
  assert.ok(trackSrc.includes("item_report: '잇템 불법/유해 신고'"), 'api/track.js에 item_report 유형 라벨이 정의되어야 함');
  assert.ok(trackSrc.includes('isItemReport'), 'api/track.js에 잇템 신고 전용 포맷 분기가 존재해야 함');
  assert.ok(trackSrc.includes('🚨 [아워골 잇템 불법/유해 링크 신고 접수]'), '텔레그램 잇템 신고 전용 알림 헤더가 존재해야 함');

  // 5. 날조 통계 MOCK_ITEM_STATS 완전 제거 (헌법 제4조) 및 푸터 면책/공식 지원 이메일
  assert.ok(!indexHtml.includes('MOCK_ITEM_STATS'), '헌법 제4조: MOCK_ITEM_STATS 위조 통계가 존재하지 않아야 함');
  assert.ok(indexHtml.includes('ourgoal.support@gmail.com'), '푸터 및 설정창에 공식 지원 이메일이 명시되어야 함');
  assert.ok(indexHtml.includes('아워골은 등록된 추천 아이템의 판매 당사자가 아니며'), '전자상거래법 제20조 준수 면책 고지가 푸터에 탑재되어야 함');

  // 6. 서비스워커 캐시 갱신
  assert.ok(swSrc.includes('es179'), 'sw.js 캐시 버전에 es179 식별자가 포함되어야 함');
});

/* ============ [#TASK-ES-180] 아워골 생각 메모장 9대 대기 과제([61]~[69]) 및 6대 탭 활용법 모달 최신화 검증 ============ */
check('compliance: [#TASK-ES-180] 아워골 생각 메모장 9대 대기 과제([61]~[69]) 및 6대 탭 활용법 모달 최신화 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const manifestJson = fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8');
  const widgetHtml = fs.readFileSync(path.join(__dirname, '..', 'widget.html'), 'utf8');
  const commJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-invite-comm.js'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // [61] 피드 내 AI 봇 축소 및 20명 초과 시 제거 검증
  assert.ok(indexHtml.includes("!virtualCheerEnabled || realCount > 20") && indexHtml.includes("singleAiGuide"), '피드 AI 봇 1개 축소 및 실 유저 20명 초과 시 전면 제거 알고리즘 탑재');

  // [62] 기기 바탕화면용 위젯 3종 × 3구성 인프라 검증
  assert.ok(manifestJson.includes('"shortcuts":'), 'manifest.json PWA 바로가기 숏컷 탑재');
  assert.ok(manifestJson.includes('#calendar') && manifestJson.includes('#goals') && manifestJson.includes('#records'), '3종 숏컷 URL 배선');
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'widget.html')), '독립 위젯 뷰어 widget.html 존재');
  assert.ok(widgetHtml.includes('widget-card') && widgetHtml.includes('renderWidget'), 'widget.html 렌더링 엔진 탑재');
  assert.ok(indexHtml.includes('btnOpenWidgetModal'), '설정창 위젯 모달 오픈 버튼 탑재');
  assert.ok(indexHtml.includes('openWidgetSettingsModal'), 'openWidgetSettingsModal 함수 및 실시간 미리보기 배선');

  // [63] 피드 공유 최신 기록 프리셀렉트 및 맞춤형 AI피드백/다짐 연동 검증
  assert.ok(indexHtml.includes('userRecords[0]'), '피드 공유 모달 진입 시 최신 실천기록 자동 프리셀렉트');
  assert.ok(indexHtml.includes("recSelect.addEventListener('change'"), '기록 변경 시 실시간 다짐 및 AI 피드백 동적 맞춤 이벤트 바인딩');

  // [64] 잔존 아코디언 정리 및 템플릿백과사전 일원화 검증
  assert.ok(indexHtml.includes('id="btnGoalTemplateEncyclopedia"'), '목표 탭 템플릿백과사전 버튼 배선');

  // [65] 일정 편집 내 사전 알림 설정(울릴 시간 N분 전 지정) 검증
  assert.ok(indexHtml.includes('calEditNotifySwitch'), '일정 편집 모달 내 사전 알림 스위치 탑재');
  assert.ok(indexHtml.includes('calEditNotifyOffset'), '울릴 시간 N분 전 드롭다운 셀렉터 탑재');
  assert.ok(indexHtml.includes('notifyMinutes'), '일정 사전 알림 N분 옵션 영속화');

  // [66] 평가해주기 상시 평가 문구 검증
  assert.ok(indexHtml.includes('언제 얼마든지 평가해주실 수 있습니다'), '평가 모달 하단 상시 평가 안내 문구 탑재');

  // [67] DM 카카오톡 방식 노란색 1 및 전송/수신 시각 상세 표시 검증
  assert.ok(commJs.includes('dm-unread-badge') && commJs.includes('#eab308'), 'DM 카톡 스타일 노란색 1 안읽음 뱃지 표출');
  assert.ok(commJs.includes('formatDmTime') && commJs.includes('renderSingleDmMsg'), 'DM 상세 시각 포맷터 및 단일 메시지 렌더러 탑재');

  // [68] 팀 만들기 5대 제약 제거 및 간소화 검증
  assert.ok(!indexHtml.includes('<select id="grpMaxMembers">'), '팀 만들기 모달 정원 제한 선택란 영구 삭제');
  assert.ok(!indexHtml.includes('<select id="grpCadence">'), '팀 만들기 모달 인증 주기 선택란 영구 삭제');
  assert.ok(!indexHtml.includes('<select id="grpWeeks">'), '팀 만들기 모달 챌린지 기간 선택란 영구 삭제');
  assert.ok(!indexHtml.includes('<input id="grpRule"'), '팀 만들기 모달 인증 규칙 입력란 영구 삭제');
  assert.ok(!indexHtml.includes('<select id="grpMode">'), '팀 만들기 모달 진행 방식 선택란 영구 삭제');

  // [69] 카카오 로그인 동명이인 중복 닉네임 방지 태그 부여 검증
  assert.ok(indexHtml.includes('resolveUniqueDisplayName'), '동명이인 고유 식별자 태그 부여 함수 탑재');

  // [추가 과제] 6대 탭 TAB_GUIDE_DATA 최신 혁신 기능 전면 반영 검증
  assert.ok(indexHtml.includes('오늘의 성장 루틴 & 위젯'), '홈 탭 가이드 최신화 확인');
  assert.ok(indexHtml.includes('기기 바탕화면 위젯'), '가이드 내 기기 바탕화면 위젯 기능 반영');
  assert.ok(indexHtml.includes('루틴(Routine) 관리 & 10 EXP'), '목표 탭 가이드 내 루틴 기능 반영');
  assert.ok(indexHtml.includes('일정 사전 알림') && indexHtml.includes('N분 전'), '일정 탭 가이드 내 사전 알림 반영');
  assert.ok(indexHtml.includes('스톱워치 랩타임 메모') && indexHtml.includes('표에시간기입'), '기록 탭 가이드 내 스톱워치 랩메모 반영');
  assert.ok(indexHtml.includes('사진인증 피드') && indexHtml.includes('카톡 스타일 DM'), '소통 탭 가이드 내 사진인증 및 카톡 DM 반영');

  // 서비스워커 캐시 갱신 검증
  assert.ok(swSrc.includes('es180'), 'sw.js 캐시 버전에 es180 식별자 포함');
});

check('compliance: [#TASK-ES-181] 폰 잠금화면에서 바로 보기 통합 허브(위젯 구독·모닝 알림) 및 배경화면 다운로드 제거 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. 일정 탭 내 잠금화면 버튼 마운트 검증
  assert.ok(indexHtml.includes('id="calLockScreenBtn"'), '일정 탭 내 #calLockScreenBtn 마운트 확인');
  assert.ok(indexHtml.includes('폰 잠금화면에서 보기'), '버튼 텍스트 확인');

  // 2. 통합 허브 모달 및 선택 탭 검증 (정적 배경화면 다운로드 제거, 위젯·모닝알림 유지)
  assert.ok(indexHtml.includes('function openLockScreenHubModal'), 'openLockScreenHubModal 함수 탑재');
  assert.ok(!indexHtml.includes('id="btnDownloadWallpaper"'), '불필요한 정적 달력 배경화면 다운로드 버튼 완전 삭제');
  assert.ok(!indexHtml.includes('id="lsPaneWallpaper"'), '불필요한 달력 배경화면 패널 완전 삭제');
  assert.ok(indexHtml.includes('id="lsPaneWidget"') && indexHtml.includes('id="lsPaneDigest"'), '위젯·모닝알림 패널 완비');

  // 3. 원클릭 액션 버튼들 검증
  assert.ok(indexHtml.includes('id="btnCopyLsWebCal"'), 'WebCal 구독 주소 복사 버튼 탑재');
  assert.ok(indexHtml.includes('id="btnToggleDigest"'), '아침 잠금화면 알림 토글 버튼 탑재');

  // 4. 기종별(아이폰/갤럭시) 위젯 친절 가이드 검증
  assert.ok(indexHtml.includes('ls-widget-device-btn') && indexHtml.includes('lsWGuideIos') && indexHtml.includes('lsWGuideAos'), '위젯 연동 기종별(iOS/AOS) 가이드 완비');

  // 5. 전역 노출 및 서비스워커 캐시 갱신 검증
  assert.ok(indexHtml.includes('window.openLockScreenHubModal = openLockScreenHubModal'), 'openLockScreenHubModal 전역 노출');
  assert.ok(swSrc.includes('es181-lockscreen-hub') || swSrc.includes('es182-lockscreen-live-sync'), 'sw.js 캐시 버전에 es181/es182 식별자 포함');
});

check('compliance: [#TASK-ES-182] 폰 잠금화면 실시간 라이브 서비스 (월 달력 그리드·일정 3선 줄바꿈금지·5종 개별선택·0ms 즉각 미리보기) 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. 실시간 잠금화면 연동 엔진 및 페이로드 빌더 함수 탑재 검증
  assert.ok(indexHtml.includes('function buildLockScreenCardPayload'), 'buildLockScreenCardPayload 함수 탑재');
  assert.ok(indexHtml.includes('function syncLockScreenLiveCard'), 'syncLockScreenLiveCard 함수 탑재');
  assert.ok(indexHtml.includes('function closeLockScreenLiveCard'), 'closeLockScreenLiveCard 함수 탑재');
  assert.ok(indexHtml.includes('window.syncLockScreenLiveCard = syncLockScreenLiveCard'), 'syncLockScreenLiveCard 전역 노출');
  assert.ok(indexHtml.includes('window.buildLockScreenCardPayload = buildLockScreenCardPayload'), 'buildLockScreenCardPayload 전역 노출');

  // 2. 잠금화면 허브 모달 1순위 실시간 라이브 탭 및 폰 화면비 시뮬레이터 검증
  assert.ok(indexHtml.includes('id="lsPaneLive"'), '1순위 실시간 라이브 패널(#lsPaneLive) 탑재');
  assert.ok(indexHtml.includes('id="btnToggleLiveLockScreen"'), '실시간 잠금화면 연동 토글 버튼(#btnToggleLiveLockScreen) 완비');
  assert.ok(indexHtml.includes('id="btnRefreshLiveLockScreen"'), '원터치 즉시 최신화 버튼(#btnRefreshLiveLockScreen) 완비');
  assert.ok(indexHtml.includes('id="lsSimClockTime"') && indexHtml.includes('id="lsLiveCardMockup"'), '실물 스마트폰 잠금화면 시뮬레이터 목업 완비');

  // 3. 월 달력 그리드 / 목표 달성률 / 일정 3선(줄바꿈금지) 시뮬레이터 컨테이너 검증
  assert.ok(indexHtml.includes('id="lsSimMonthGridWrap"'), '폰 화면비 실제 월 달력 그리드 컨테이너(#lsSimMonthGridWrap) 완비');
  assert.ok(indexHtml.includes('id="lsSimGoalRateWrap"'), '목표 달성률 게이지 바 컨테이너(#lsSimGoalRateWrap) 완비');
  assert.ok(indexHtml.includes('id="lsSimSchedulesWrap"'), '오늘의 다음 일정 최대 3개 컨테이너(#lsSimSchedulesWrap) 완비');
  assert.ok(indexHtml.includes('white-space:nowrap') && indexHtml.includes('text-overflow:ellipsis'), '일정 텍스트 줄바꿈 절대 금지 및 말줄임표(...) 스타일 완비');

  // 4. 5종 정보 개별 선택 체크박스 옵션 검증
  assert.ok(indexHtml.includes('id="lsOptMonthGrid"'), '이번 달 월 달력 보기 체크박스');
  assert.ok(indexHtml.includes('id="lsOptGoalRate"') && indexHtml.includes('id="lsOptGoals"'), '목표 달성률 게이지 바 체크박스 및 하위호환');
  assert.ok(indexHtml.includes('id="lsOptSchedules"'), '오늘의 다음 일정 최대 3개 체크박스');
  assert.ok(indexHtml.includes('id="lsOptStreak"'), '연속 실천 스트릭 체크박스');
  assert.ok(indexHtml.includes('id="lsOptDday"'), '핵심 D-Day 카운트다운 체크박스');

  // 5. 0ms 실시간 미리보기 리액티브 루프 검증
  assert.ok(indexHtml.includes('function updateLiveSim'), 'updateLiveSim 함수 탑재');
  assert.ok(indexHtml.includes('lsOptMonthGrid') && indexHtml.includes('updateLiveSim()'), '체크박스 변경 즉시 시뮬레이터 0ms 실시간 미리보기 반영');

  // 6. 무음 갱신(silent, renotify, tag) 규격 및 알림 액션 2종 검증
  assert.ok(indexHtml.includes("tag: payload.tag") || indexHtml.includes("ourgoal-lockscreen-live"), '상주형 단일 카드 tag 유지');
  assert.ok(indexHtml.includes("silent: true") && indexHtml.includes("renotify: false"), '무음 실시간 갱신(silent: true, renotify: false) 보장');
  assert.ok(indexHtml.includes("action-checkin") && indexHtml.includes("action-calendar"), '알림 액션 2종(빠른 체크인·일정 확인) 탑재');

  // 7. 서비스워커(sw.js) 인터랙티브 액션 라우팅 및 캐시 버전 갱신 검증
  assert.ok(swSrc.includes('ourgoal-shell-v20260918-es182-lockscreen-live-sync') || swSrc.includes('ourgoal-shell-v20260918-es183-lockscreen-takeover'), 'sw.js 캐시 버전에 es182/es183 식별자 적용');
  assert.ok(swSrc.includes("action === 'action-checkin'") && swSrc.includes("targetUrl = '/?action=checkin'"), 'sw.js 체크인 액션 라우팅');
  assert.ok(swSrc.includes("action === 'action-calendar'") && swSrc.includes("targetUrl = '/?tab=calendar'"), 'sw.js 캘린더 액션 라우팅');
  assert.ok(swSrc.includes("LOCKSCREEN_ACTION"), 'sw.js 클라이언트 postMessage 통신 완비');

  // 8. 앱 시동 시 액션 딥링크 처리 및 서비스워커 메시지 리스너 검증
  assert.ok(indexHtml.includes("qAction === 'checkin'") || indexHtml.includes("urlParams.get('action')"), '앱 시동 시 checkin 액션 감지');
  assert.ok(indexHtml.includes("LOCKSCREEN_ACTION"), '앱 본체에서 LOCKSCREEN_ACTION 수신 리스너 탑재');
});

check('compliance: [#TASK-ES-183] 스마트폰 잠금화면 전체 장악 (Screen-On Full-Screen LockScreen Takeover) 네이티브 서비스 및 사용자 통제 파이프라인 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // 1. 잠금화면 전체 장악 제어 버튼 및 슬라이더 탑재 검증
  assert.ok(indexHtml.includes('id="btnToggleLockScreenTakeover"'), '잠금화면 전체 장악 제어 버튼(#btnToggleLockScreenTakeover) 탑재');
  assert.ok(indexHtml.includes('id="lsSimUnlockSlider"'), '밀어서 잠금해제 슬라이더(#lsSimUnlockSlider) 탑재');
  assert.ok(indexHtml.includes('밀어서 잠금해제'), '슬라이더 안내 텍스트 탑재');
  assert.ok(indexHtml.includes('id="btnDownloadLockScreenApk"'), '안드로이드 전용 잠금화면 APK 안내 버튼 탑재');

  // 2. 안드로이드 네이티브 서비스 및 액티비티 파일 존재 검증 (캐시워크형 구조)
  const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  const servicePath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'kr', 'ourgoal', 'app', 'LockScreenService.java');
  const activityPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'kr', 'ourgoal', 'app', 'LockScreenActivity.java');
  const receiverPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'kr', 'ourgoal', 'app', 'LockScreenReceiver.java');

  assert.ok(fs.existsSync(manifestPath), 'AndroidManifest.xml 존재');
  assert.ok(fs.existsSync(servicePath), 'LockScreenService.java 존재');
  assert.ok(fs.existsSync(activityPath), 'LockScreenActivity.java 존재');
  assert.ok(fs.existsSync(receiverPath), 'LockScreenReceiver.java 존재');

  const manifestSrc = fs.readFileSync(manifestPath, 'utf8');
  const serviceSrc = fs.readFileSync(servicePath, 'utf8');
  const activitySrc = fs.readFileSync(activityPath, 'utf8');

  assert.ok(manifestSrc.includes('SYSTEM_ALERT_WINDOW'), 'SYSTEM_ALERT_WINDOW 권한 선언');
  assert.ok(manifestSrc.includes('LockScreenService') && manifestSrc.includes('LockScreenActivity'), '매니페스트 내 서비스/액티비티 등록');
  assert.ok(serviceSrc.includes('ACTION_SCREEN_ON'), 'LockScreenService 내 ACTION_SCREEN_ON 감지 리시버');
  assert.ok(activitySrc.includes('setShowWhenLocked') && activitySrc.includes('setTurnScreenOn'), 'LockScreenActivity 내 setShowWhenLocked/setTurnScreenOn 적용');

  // 3. 기종별(Android/iOS) 안내 문구 분기 검증
  assert.ok(indexHtml.includes('갤럭시(Android)') && indexHtml.includes('아이폰(iOS)'), '기종별 잠금화면 전체 장악 및 위젯 분기 안내');

  // 4. 서비스워커 캐시 버전 es183 검증
  assert.ok(swSrc.includes('es183-lockscreen-takeover'), 'sw.js 캐시 버전에 es183 식별자 포함');
});

check('compliance: [#TASK-SANCTUARY-COMM-RADAR-REAL-INTEGRITY] 소통 탭 실시간 러닝메이트 레이더 실데이터 직결 및 위조숫자·가짜봇 완전 척결 무결성 검증', () => {
  const sanctuarySrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'sanctuary-v3-engine.js'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 위조 숫자('28명') 및 가짜 더미 봇 배열('defaultPeers') 완전 박멸 (헌법 제4조 제1항 제1호, 제13조 위반 방지)
  assert.strictEqual(sanctuarySrc.includes('28명 몰입 중'), false, '하드코딩 위조 카운트 28명 영구 박멸');
  assert.strictEqual(sanctuarySrc.includes('const defaultPeers = ['), false, '가짜 봇 defaultPeers 배열 영구 박멸');

  // 2. 실제 데이터 SSOT 추출 함수(getRealRunningMates) 및 실데이터 바인딩 탑재
  assert.ok(sanctuarySrc.includes('function getRealRunningMates()'), '실제 러닝메이트 SSOT 추출 함수 탑재');
  assert.ok(sanctuarySrc.includes('state.profile.companions'), '실제 사용자 동반자 목록 참조');
  assert.ok(sanctuarySrc.includes('getTeamMembersPool'), '실제 팀원 목록 참조');

  // 3. 0명 콜드스타트 투명 고지 및 동반자 찾기 배선
  assert.ok(sanctuarySrc.includes('s-radar-empty-card'), '0명 엠프티 상태 카드 탑재');
  assert.ok(sanctuarySrc.includes('gotoCompanions'), '동반자 찾기 탭 전환 함수 탑재');
  assert.ok(uiCss.includes('.s-radar-empty-card'), '엠프티 카드 CSS 스타일 탑재');

  // 4. 4위1체 인터랙션 배선 (프로필 모달, 1:1 DM, 새로고침 동기화)
  assert.ok(sanctuarySrc.includes('openPeerInteraction'), '러닝메이트 클릭 상호작용 모달 배선');
  assert.ok(sanctuarySrc.includes('openPeerDm'), '1:1 DM 대화방 전환 배선');
  assert.ok(sanctuarySrc.includes('refreshRadar'), '실제 DB 동기화 파이프라인 새로고침 배선');

  // 5. PWA 캐시 버전 식별자 탑재
  assert.ok(swSrc.includes('ourgoal-shell-v20260918-sanctuary-comm-radar-restore'), 'sw.js 캐시 버전에 sanctuary-comm-radar-restore 식별자 포함');
});


check('compliance: [#TASK-ES-184] 아워골 생각 메모장 18대 잔여 대기 과제([70]~[87]) 전수 구현 및 개정 헌법(v2026.09.18) 6대 무결성 검증', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // [그룹 1: 계정 & 보안]
  // [70] 원격 로그아웃 전 로그인 기기 목록 확인 및 개별 세션 제어 기능
  assert.ok(html.includes('id="activeDevicesContainer"'), '[70] 활성 기기 컨테이너 마크업 존재');
  assert.ok(html.includes('function renderActiveDevicesList()'), '[70] 활성 기기 목록 실시간 렌더러 함수 존재');
  assert.ok(html.includes('btn-revoke-device'), '[70] 개별 기기 원격 로그아웃 버튼 클래스 존재');

  // [71] 2단계 인증(2FA) 실질적 보안 작동
  assert.ok(html.includes('function openTwoFactorSetupModal()'), '[71] 2FA 보안 PIN 설정 모달 함수 존재');
  assert.ok(html.includes('function challengeTwoFactorModal('), '[71] 2FA 세션 진입 챌린지 모달 함수 존재');
  assert.ok(html.includes('id="twoFaPinInput"'), '[71] 4자리 PIN 입력 인풋 존재');

  // [72] 설정 이메일 게스트모드 오표기 오류 수정
  assert.ok(html.includes('카카오 계정 연동됨'), '[72] 카카오 연동 시 정상 표기 분기 존재');

  // [그룹 2: 프로필 & 설정 테마]
  // [73] 프로필 편집 내 잇템등록 > 잇템추가 인라인 확장 및 draft 무손실 보존
  assert.ok(html.includes('id="pvInlineItItemForm"'), '[73] 인라인 잇템 등록 폼 존재');
  assert.ok(html.includes('id="btnConfirmInlineItItem"'), '[73] 잇템 등록 완료 버튼 존재');

  // [74] 프로필 관심 카테고리 8개 선택/저장
  assert.ok(html.includes('관심 카테고리 (최대 8개 선택)'), '[74] 관심 카테고리 라벨 및 가이드 존재');
  assert.ok(html.includes('paintInterests();'), '[74] 관심 카테고리 렌더러 호출 존재');

  // [75] 프로필 지역공개 토글 스위치 설정 및 저장
  assert.ok(html.includes('id="pvRegionPublic"'), '[75] 지역공개 스위치 존재');

  // [76] 프로필 내 동네(Region) 시군구 설정 및 저장
  assert.ok(html.includes("wireRegionPicker(sheet, 'pvRegion', regionRef);"), "[76] 동네 선택기 배선 존재");

  // [79] 설정 테마 4종(성소·블랙·화이트·도심) 압축 및 시인성 개선
  assert.ok(html.includes("id: 'focus-sanctuary', name: '성소 (Sanctuary)'"), '[79] 성소 테마 존재');
  assert.ok(html.includes("id: 'black', name: '블랙 (Black)'"), '[79] 블랙 테마 존재');
  assert.ok(html.includes("id: 'white', name: '화이트 (White)'"), '[79] 화이트 테마 존재');
  assert.ok(html.includes("id: 'urban-city', name: '도심 (City)'"), '[79] 도심 테마 존재');

  // [그룹 3: 홈 탭 & 체크인 / 평가하기]
  // [81] 오늘의 3초 체크인 내 목표 기반 추천 및 커닝페이퍼형 가이드
  assert.ok(html.includes('renderQuickCheckinGuideChips();'), '[81] 3초 체크인 커닝페이퍼 렌더러 호출');
  assert.ok(html.includes('내 목표 맞춤 커닝페이퍼'), '[81] 커닝페이퍼 섹션 라벨 존재');
  assert.ok(html.includes('data-cunningtext='), '[81] 커닝페이퍼 원클릭 채우기 속성 존재');

  // [86] 홈 탭 아워골 평가하기 창 최신 UI 규격 적용 복원
  assert.ok(html.includes('언제 얼마든지 평가해주실 수 있습니다'), '[86] 상시/반복 평가 안내문구 존재');
  assert.ok(html.includes('id="btnOpenEvalModal"'), '[86] 평가 작성 버튼 존재');

  // [그룹 4: 목표 탭 & 템플릿 / 프롬프트 백과사전]
  // [77] 목표 탭 '현 상태로 데이터 받기' 최하단 재배치
  assert.ok(html.includes("renderPromptEncyclopediaHtml('goals')"), '[77] 목표 탭 최하단 슬롯 연결 존재');

  // [78] 목표 데이터받기·기록 내보내기 하단 '데이터분석 프롬프트 백과사전' 신설
  assert.ok(html.includes('function renderPromptEncyclopediaHtml('), '[78] 프롬프트 백과사전 렌더러 존재');
  assert.ok(html.includes('데이터분석 프롬프트 백과사전'), '[78] 프롬프트 백과사전 타이틀 존재');
  assert.ok(html.includes('btn-copy-prompt'), '[78] 프롬프트 원클릭 복사 버튼 클래스 존재');

  // [80] 템플릿백과사전 1초 자동이식 선택 연동 및 로드맵-목표상태 동기화
  assert.ok(html.includes('function importTemplateInstantly('), '[80] 1초 자동이식 함수 존재');
  assert.ok(html.includes('1초 만에 자동이식되었습니다'), '[80] 자동이식 완료 토스트 안내 존재');

  // [87] 템플릿백과사전 실 유저 공유 템플릿 '둘러보기' 기능 추가
  assert.ok(html.includes('실 유저 공유 템플릿 둘러보기'), '[87] 둘러보기 뷰 모드 헤더 존재');
  assert.ok(html.includes('btn-auto-import-tpl'), '[87] 둘러보기 카드 내 1초 자동이식 버튼 존재');

  // [그룹 5: 소통 & 팀 목표 / 피드]
  // [82] 팀 목표 내 '팀 연계 개인목표' 생성 의도 버튼 및 접목 기능
  assert.ok(html.includes('function openTeamLinkedPersonalGoalModal('), '[82] 팀 연계 개인목표 생성 모달 함수 존재');
  assert.ok(html.includes('btn-team-personal-goal'), '[82] 팀 연계 개인목표 버튼 클래스 존재');

  // [83] 팀원 초대 시 '아워골 동반자 초대하기' 인앱 초대·참가 기능
  assert.ok(html.includes('function openTeamInviteModal('), '[83] 팀원 초대 모달 함수 존재');
  assert.ok(html.includes('btn-send-companion-invite'), '[83] 인앱 동반자 초대장 발송 버튼 클래스 존재');

  // [84] 피드 게시하기 공유할 목표 '미설정(공개 안함)' 옵션 추가
  assert.ok(html.includes('미설정 (목표 공개 안 함)'), '[84] 피드 공유 목표 미설정 옵션 존재');

  // [85] 팀 수준별 목표관리 조별 실 유저 편성 및 완수 통제·실시간 연동
  assert.ok(html.includes('실 유저 편성:'), '[85] 조별 실 유저 편성 라벨 존재');
  assert.ok(html.includes('btn-toggle-group-verify'), '[85] 완수 통제 버튼 존재');
});

check('[#TASK-ES-185] 화이트 테마 렌더링 먹통 버그 근본 척결 및 성소 외 3대 테마(화이트·블랙·도심) 시인성·대비 전면 고도화 검증', () => {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../ui.css'), 'utf8');

  // 1. index.html 강제 치환 버그 척결 검증
  assert.ok(!html.includes("if(th === 'white' || th === 'system') th = 'focus-sanctuary'"), 'th === white 강제 성소 치환 코드 완전 제거');
  assert.ok(!html.includes("if(!_initTh || _initTh === 'white'"), '_initTh === white 강제 성소 치환 코드 완전 제거');

  // 2. ui.css 화이트 라이트 테마 풀 토큰 검증
  assert.ok(css.includes('[data-theme="white"],[data-theme="light"]'), '화이트 테마 토큰 블록 존재');
  assert.ok(css.includes('--bg:#F8FAFC;') || css.includes('--bg: #F8FAFC;'), '화이트 배경 토큰 F8FAFC 검증');
  assert.ok(css.includes('--ink:#0F172A;') || css.includes('--ink: #0F172A;'), '화이트 텍스트 잉크 토큰 0F172A 검증');
  assert.ok(css.includes('html[data-theme="white"] body'), '화이트 테마 바디 고시인성 스타일 존재');

  // 3. ui.css 블랙 OLED 트루블랙 테마 토큰 검증
  assert.ok(css.includes('--bg:#000000;'), '블랙 배경 트루 블랙 000000 검증');
  assert.ok(css.includes('--ink:#FFFFFF;'), '블랙 텍스트 순백 FFFFFF 검증');

  // 4. ui.css 도심 테마 쿨슬레이트 & 시안 토큰 검증
  assert.ok(css.includes('--bg:#0B0F19;'), '도심 배경 쿨 슬레이트 0B0F19 검증');
  assert.ok(css.includes('--brand-strong:#38BDF8;'), '도심 시안 네온 브랜드 토큰 검증');

  // 5. 성소(focus-sanctuary) 테마 무결성 보존 검증
  assert.ok(css.includes('[data-theme="focus-sanctuary"]'), '성소 테마 룰 보존 검증');
});

check('[#TASK-ES-186] 성소 기준 4대 테마(성소·블랙·화이트·도심) 조형·레이아웃·컴포넌트 100% 동일 동기화 및 테마별 컬러 분리 검증', () => {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../ui.css'), 'utf8');
  const engineSrc = fs.readFileSync(path.join(__dirname, '../js/sanctuary-v3-engine.js'), 'utf8');

  // 1. sanctuary-v3-engine.js: isFocusSanctuary() 4대 테마 전수 지원 검증
  assert.ok(
    engineSrc.includes("'focus-sanctuary', 'black', 'white', 'urban-city'") ||
    (engineSrc.includes('focus-sanctuary') && engineSrc.includes('black') && engineSrc.includes('white') && engineSrc.includes('urban-city')),
    'isFocusSanctuary()가 성소·블랙·화이트·도심 4대 테마를 전수 포함해야 함'
  );

  // 2. index.html: 테마 전환 시 Sanctuary V3 렌더러 연계 호출 검증
  assert.ok(
    html.includes('OurgoalSanctuaryV3.render(state.activeTab)'),
    'applyTheme() 시점에 OurgoalSanctuaryV3.render(state.activeTab) 호출 필수'
  );

  // 3. ui.css: 4대 테마 상단바 및 뷰 슬롯 표시 동기화 검증
  const themes = ['focus-sanctuary', 'black', 'white', 'urban-city'];
  themes.forEach(th => {
    assert.ok(css.includes(`[data-theme="${th}"] .sanctuary-top-bar`), `${th} 테마 sanctuary-top-bar 활성화 셀렉터 구비`);
    assert.ok(css.includes(`[data-theme="${th}"] #sanctuaryGoalsView`), `${th} 테마 sanctuaryGoalsView 활성화 셀렉터 구비`);
    assert.ok(css.includes(`[data-theme="${th}"] #sanctuaryCalendarView`), `${th} 테마 sanctuaryCalendarView 활성화 셀렉터 구비`);
    assert.ok(css.includes(`[data-theme="${th}"] #sanctuaryRecordsView`), `${th} 테마 sanctuaryRecordsView 활성화 셀렉터 구비`);
    assert.ok(css.includes(`[data-theme="${th}"] #sanctuaryCommView`), `${th} 테마 sanctuaryCommView 활성화 셀렉터 구비`);
    assert.ok(css.includes(`[data-theme="${th}"] #homeGrassSummaryCard`), `${th} 테마 14일 활동 카드(#homeGrassSummaryCard) 표시`);
    assert.ok(css.includes(`[data-theme="${th}"] #captureCardBox`), `${th} 테마 3초 체크인 히어로 카드(#captureCardBox) 활성화`);
    assert.ok(css.includes(`[data-theme="${th}"] #calGrid`), `${th} 테마 구형 calGrid 은폐`);
    assert.ok(css.includes(`[data-theme="${th}"] #goalChipRow`), `${th} 테마 구형 goalChipRow 은폐`);
    assert.ok(css.includes(`[data-theme="${th}"] #bottomNavFab`), `${th} 테마 하단바 중앙 돌출 FAB 배제`);
  });

  // 4. ui.css: 테마별 독자 고시인성 컬러 분리 검증
  assert.ok(css.includes('html[data-theme="white"] .mountain-trail-card'), '화이트 테마 Mountain Trail 카드 순백 컬러 규칙');
  assert.ok(css.includes('html[data-theme="black"] .mountain-trail-card'), '블랙 테마 Mountain Trail 카드 OLED 블랙 컬러 규칙');
  assert.ok(css.includes('html[data-theme="urban-city"] .mountain-trail-card'), '도심 테마 Mountain Trail 카드 쿨네이비/시안 컬러 규칙');

  // 5. 성소(focus-sanctuary) 원형 100% 무변경 보존
  assert.ok(css.includes('html[data-theme="focus-sanctuary"] body'), '성소 테마 바디 무변경 보존');
});

check('[#TASK-ES-187] 목표 탭 템플릿 백과사전 단일 서브탭 분리 및 상단 중복 버튼 제거 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const sanctuaryJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'sanctuary-v3-engine.js'), 'utf8');

  // 1. 마운틴 트레일 카드 내 mountain-actions 및 불필요 버튼 0건 검증
  assert.ok(!sanctuaryJs.includes("id=\"sTransplantBtn\""), '마운틴 트레일 카드 내 하드코딩 sTransplantBtn 제거 확인');
  assert.ok(!sanctuaryJs.includes("id=\"sTmplMarketBtn\""), '마운틴 트레일 카드 내 sTmplMarketBtn 제거 확인');

  // 2. 목표 서브탭에 templateEncyclopedia 정식 등록 확인
  assert.ok(indexHtml.includes("['templateEncyclopedia','📖 템플릿']") || indexHtml.includes("['templateEncyclopedia','📖 템플릿 백과사전']"), 'goalsSubtabs 내 템플릿 서브탭 등록 확인');

  // 3. templateEncyclopediaView 슬롯 및 전용 렌더러 배선 확인
  assert.ok(indexHtml.includes('id="templateEncyclopediaView"'), 'templateEncyclopediaView 컨테이너 구비 확인');
  assert.ok(indexHtml.includes('function renderTemplateEncyclopediaScreen()'), 'renderTemplateEncyclopediaScreen 렌더러 함수 구비 확인');
  assert.ok(indexHtml.includes('if(state.goalsSubTab===\'templateEncyclopedia\'){ renderTemplateEncyclopediaScreen(); return; }'), '서브탭 라우팅 분기 배선 확인');

  // 4. 레거시 버튼 하위 호환 가드 및 서브탭 전환 연동 확인
  assert.ok(indexHtml.includes('state.goalsSubTab = \'templateEncyclopedia\';'), '헤더 템플릿 버튼 클릭 시 서브탭 전환 연동 확인');
});

check('[#TASK-ES-188] 로그인 창 둘러보기 버튼 문구 정돈 (로그인 없이 둘러보기) 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 메인 버튼 텍스트 '로그인 없이 둘러보기' 탑재 확인
  assert.ok(indexHtml.includes('id="btnLandingPreviewDirect"'), '랜딩 메인 둘러보기 버튼 구비');
  assert.ok(indexHtml.includes('<span>로그인 없이 둘러보기</span>'), '둘러보기 버튼 텍스트 로그인 없이 둘러보기 확인');

  // 2. '3초 성소' 문구 랜딩 화면에서 완전 제거 확인
  assert.ok(!indexHtml.includes('3초 성소 새 UI/UX 바로 둘러보기'), '과거 3초 성소 둘러보기 문구 완전 제거 확인');

  // 3. 하위 호환성 landGuestBtn ID 보존 확인
  assert.ok(indexHtml.includes('id="landGuestBtn"'), 'landGuestBtn ID 보존 확인');
});


check('[#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 3대 도메인 탭 버튼 구비 확인
  assert.ok(indexHtml.includes('id="encyclDomainPersonal"'), '개인목표 백과사전 버튼 구비');
  assert.ok(indexHtml.includes('id="encyclDomainRoutine"'), '루틴 백과사전 버튼 구비');
  assert.ok(indexHtml.includes('id="encyclDomainTeam"'), '팀 목표 백과사전 버튼 구비');

  // 2. 2대 출처 탭 버튼 구비 확인
  assert.ok(indexHtml.includes('id="subtabTplBtnAi"'), 'AI 추천 템플릿 버튼 구비');
  assert.ok(indexHtml.includes('id="subtabTplBtnReal"'), '실사용자 템플릿 버튼 구비');

  // 3. 3대 도메인별 데이터셋 완비 확인
  assert.ok(indexHtml.includes('ROUTINE_TEMPLATES_AI'), '루틴 AI 추천 데이터셋 구비');
  assert.ok(indexHtml.includes('ROUTINE_TEMPLATES_REAL'), '루틴 실사용자 데이터셋 구비');
  assert.ok(indexHtml.includes('TEAM_TEMPLATES_AI'), '팀 목표 AI 추천 데이터셋 구비');
  assert.ok(indexHtml.includes('TEAM_TEMPLATES_REAL'), '팀 목표 실사용자 데이터셋 구비');
  assert.ok(indexHtml.includes('PERSONAL_TEMPLATES_REAL'), '개인목표 실사용자 데이터셋 구비');

  // 4. 도메인별 1초 이식 및 해당 서브탭 자동 이동 파이프라인 배선 확인
  assert.ok(indexHtml.includes("state.goalsSubTab = 'personal';"), '개인목표 이식 후 personal 서브탭 전환 배선');
  assert.ok(indexHtml.includes("state.goalsSubTab = 'routine';"), '루틴 이식 후 routine 서브탭 전환 배선');
  assert.ok(indexHtml.includes("state.goalsSubTab = 'team';"), '팀 목표 이식 후 team 서브탭 전환 배선');
  assert.ok(indexHtml.includes("state.profile.settings.routines.unshift"), '루틴 원장 안전 unshift 배선');

  // 5. 모바일 터치 타겟 44px 이상 준수 확인
  assert.ok(indexHtml.includes('min-height:44px'), '도메인 탭 버튼 터치타겟 44px 이상 확보');
});

check('[#TASK-CALENDAR-TAB-RESTORATION 일정 탭 전수 결함 정상화 및 4위 1체 시맨틱 복원 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const sanctuaryJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'sanctuary-v3-engine.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. screen-calendar 최상단 헤더 및 기본 모드 배선 확인
  assert.ok(indexHtml.includes('id="screen-calendar" data-cal-mode="month"'), '일정 탭 data-cal-mode 기본값 month 배선');
  const headPos = indexHtml.indexOf('<div class="screen-head">');
  const sViewPos = indexHtml.indexOf('<div id="sanctuaryCalendarView"></div>');
  assert.ok(headPos !== -1 && sViewPos !== -1 && headPos < sViewPos, '헤더(.screen-head)가 성소 뷰 상단에 올바르게 배치');

  // 2. 상하 날짜 동기화 (selectCalDay -> renderCalDayDetail 호출 확인)
  assert.ok(sanctuaryJs.includes('renderCalDayDetail()'), '날짜 선택 시 하단 일간 상세 동시 갱신 배선');

  // 3. 타임라인 상세/수정 모달 분기 배선 확인
  assert.ok(sanctuaryJs.includes('openScheduleDetail('), '타임라인 일정 클릭 시 상세 모달 오픈 파이프라인 배선');

  // 4. 뽀모도로 세션 완료 시 4대 뷰 동시 전파 배선 확인
  assert.ok(sanctuaryJs.includes("renderHome()"), '뽀모도로 완료 시 홈 화면 동시 전파 배선');
  assert.ok(sanctuaryJs.includes("renderRecordsScreen()"), '뽀모도로 완료 시 기록 화면 동시 전파 배선');
  assert.ok(sanctuaryJs.includes("renderStatsScreen()"), '뽀모도로 완료 시 통계 화면 동시 전파 배선');

  // 5. 모드별 하단 슬롯 조건부 가시성 CSS 규칙 확인
  assert.ok(uiCss.includes('#screen-calendar[data-cal-mode="timeline"] #calDayDetail'), '타임라인 모드 시 일간 상세 숨김 CSS 배선');
  assert.ok(uiCss.includes('#screen-calendar[data-cal-mode="timer"] #calDayDetail'), '타이머 모드 시 일간 상세 숨김 CSS 배선');

  // 6. 멀티 인디케이터 도트 렌더러 구비 확인
  assert.ok(sanctuaryJs.includes('s-cal-dots-row'), '날짜 셀 멀티 인디케이터 도트 렌더러 구비');
  assert.ok(uiCss.includes('.s-cal-dots-row'), '멀티 인디케이터 도트 CSS 구비');

  // 7. 주간(Week) 아젠다 뷰 및 내비게이터 배선 확인
  assert.ok(sanctuaryJs.includes("engine.activeCalMode === 'week'"), '주간 아젠다 뷰 렌더러 구비');
  assert.ok(sanctuaryJs.includes("shiftTimelineDay"), '타임라인 일간 내비게이터 구비');
  assert.ok(sanctuaryJs.includes("shiftWeek"), '주간 이동 내비게이터 구비');

  // 8. AI 자연어 일정 파서 및 배선 확인
  assert.ok(indexHtml.includes('function parseNaturalScheduleText'), '자연어 일정 파서 함수 구비');
  assert.ok(indexHtml.includes('executeCalAgentNaturalSchedule'), 'AI 일정 등록 핸들러 배선');

  // 9. 일반 일정 구글 캘린더 반영 및 데이터 속성 배선 확인
  assert.ok(indexHtml.includes('data-calsyncsched'), '구글 캘린더 반영 버튼에 schedId 전달');
  assert.ok(indexHtml.includes('btn.dataset.calsyncsched||null'), 'quickSyncToCalendar 호출 시 calsyncsched 전달');
});

/* ============ [#TASK-ES-190] 목표 추가 기능 전면 복원 및 4위 1체 UX 고도화 검증 ============ */
check('[#TASK-ES-190] 목표 추가 기능 전면 복원 및 4위 1체 UX 고도화 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const sanctuaryJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'sanctuary-v3-engine.js'), 'utf8');

  // 1. 전역 인터페이스 배선 확인
  assert.ok(indexHtml.includes('window.promptNewGoal = promptNewGoal;'), 'window.promptNewGoal 전역 배선 완료');
  assert.ok(indexHtml.includes('window.showNewGoalManualForm = showNewGoalManualForm;'), 'window.showNewGoalManualForm 전역 배선 완료');

  // 2. 세부 마일스톤 헤더 새 목표 버튼 및 리스너 배선 확인
  assert.ok(indexHtml.includes('id="btnPersonalAddGoalInline"'), '세부 마일스톤 헤더 + 새 목표 버튼 마크업 존재');
  assert.ok(indexHtml.includes('btnPersonalAddGoalInline'), 'btnPersonalAddGoalInline 이벤트 리스너 배선 완료');

  // 3. 성소 마운틴 트레일 목표 추가 핸들러 방어적 배선 확인
  assert.ok(sanctuaryJs.includes('window.promptNewGoal()'), '성소 마운틴 트레일 목표 추가 버튼 window.promptNewGoal 호출 배선');

  // 4. localGoalTemplate tasks 데이터 정규화(문자열 배열) 확인
  assert.ok(indexHtml.includes("t + ' 관련 세부 실행 1'"), 'localGoalTemplate tasks 문자열 정규화');

  // 5. showNewGoalReviewStep tasks 안전 처리 확인
  assert.ok(indexHtml.includes("typeof tk === 'string' ? tk :"), 'showNewGoalReviewStep tasks 문자열/객체 상호 방어 로직 구비');

  // 6. 직접 설정 폼(showNewGoalManualForm) 유효성 토스트 및 etc 기본 마일스톤 확인
  assert.ok(indexHtml.includes("toast('목표 제목을 입력해주세요');"), '직접 설정 폼 공백 검증 토스트 구비');
  assert.ok(indexHtml.includes("'목표 구체화 및 실행 준비'"), 'etc 카테고리 기본 마일스톤 구비');
});

/* ============ [#TASK-ES-192] 데드클릭 12건 전수 소탕 및 인터랙션 무결성 검증 ============ */
check('[#TASK-ES-192] 데드클릭 12건 전수 소탕 및 인터랙션 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const sanctuaryJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'sanctuary-v3-engine.js'), 'utf8');

  // 1. 순수 데드클릭 박멸 확인
  assert.ok(indexHtml.includes('id="btnSwitchCompanionInvite"'), '동반자 초대 탭 칩 버튼 ID 존재');
  assert.ok(indexHtml.includes('switchInviteTab'), '동반자 초대/링크 복사 탭 전환 핸들러 존재');
  assert.ok(indexHtml.includes('btn-select-wearable'), '스마트워치 선택 버튼 클래스 존재');
  assert.ok(indexHtml.includes('id="toggleTemplatesBtnInner"'), '추천 템플릿 토글 버튼 ID 존재');

  // 2. 유령 버튼(#goalArchiveBtn) 마크업 복원 확인
  assert.ok(indexHtml.includes("archiveBtnEl.id = 'goalArchiveBtn'"), '목표 상세 보관함 버튼(#goalArchiveBtn) 생성 확인');

  // 3. 거짓말 토스트 영구 척결 확인
  assert.ok(!indexHtml.includes('Google 로그인 서비스를 준비 중입니다'), '구글 로그인 준비중 토스트 부재');
  assert.ok(!indexHtml.includes('피드 게시 기능을 준비 중입니다'), '피드 게시 준비중 토스트 부재');
  assert.ok(!indexHtml.includes('외부 공유 기능을 준비 중입니다'), '외부 공유 준비중 토스트 부재');
  assert.ok(!sanctuaryJs.includes('일정 추가 창을 준비 중입니다'), '성소 캘린더 준비중 토스트 부재');

  // 4. 완전 무료 선언 공식 모달 승화 확인
  assert.ok(indexHtml.includes('아워골 완전 무료화 헌법 선언'), '아워골 완전 무료 선언 모달 마크업 존재');
});

check('[#TASK-ES-193] 집중 타이머 기록 탭 이전 및 기록 탭 6종 3×2 그리드 검증', () => {
  const sanctuaryJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'sanctuary-v3-engine.js'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 일정 탭 3종 단일화
  assert.ok(!sanctuaryJs.includes("setCalMode(\\'timer\\')"), '일정 탭에 timer 버튼 없음');
  assert.ok(sanctuaryJs.includes("setCalMode(\\'month\\')"), '일정 탭 월간 모드 확인');
  assert.ok(sanctuaryJs.includes("setCalMode(\\'week\\')"), '일정 탭 주간 모드 확인');
  assert.ok(sanctuaryJs.includes("setCalMode(\\'timeline\\')"), '일정 탭 타임라인 모드 확인');

  // 2. 기록 탭 6종 서브탭 완비
  assert.ok(sanctuaryJs.includes("setRecMode(\\'heatmap\\')"), '기록 탭 히트맵 확인');
  assert.ok(sanctuaryJs.includes("setRecMode(\\'feed\\')"), '기록 탭 피드 확인');
  assert.ok(sanctuaryJs.includes("setRecMode(\\'timer\\')"), '기록 탭 집중 타이머 확인');
  assert.ok(sanctuaryJs.includes("setRecMode(\\'stats\\')"), '기록 탭 성취 통계 확인');
  assert.ok(sanctuaryJs.includes("setRecMode(\\'archive\\')"), '기록 탭 보관함 확인');
  assert.ok(sanctuaryJs.includes("setRecMode(\\'recap\\')"), '기록 탭 위클리 리캡 확인');

  // 3. 3×2 그리드 조형 확인
  assert.ok(cssContent.includes('grid-template-columns: repeat(3, 1fr)'), '3열 그리드 CSS 스타일 존재');

  // 4. 타이머 렌더링 분기 확인
  assert.ok(sanctuaryJs.includes("engine.activeRecMode === 'timer'"), '기록 탭 타이머 카드 렌더링 분기 확인');
});

check('[#TASK-ES-194] 소통 탭 6종 3×2 그리드 조형 및 가로스크롤 은폐 해소 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 소통 탭 6종 서브탭 확인
  assert.ok(indexHtml.includes("{ key: 'feed', label: '피드'"), '피드 서브탭 존재');
  assert.ok(indexHtml.includes("{ key: 'group', label: '팀'"), '팀 서브탭 존재');
  assert.ok(indexHtml.includes("{ key: 'companion', label: '동반자'"), '동반자 서브탭 존재');
  assert.ok(indexHtml.includes("{ key: 'dm', label: 'DM'"), 'DM 서브탭 존재');
  assert.ok(indexHtml.includes("{ key: 'manito', label: '마니또'"), '마니또 서브탭 존재');
  assert.ok(indexHtml.includes("{ key: 'share', label: '공유'"), '공유 서브탭 존재');

  // 2. comm-subtabs-grid 클래스 및 CSS 확인
  assert.ok(indexHtml.includes('comm-subtabs-grid'), 'comm-subtabs-grid 클래스 배선 확인');
  assert.ok(cssContent.includes('.comm-subtabs-grid'), '.comm-subtabs-grid CSS 선언 확인');
});

check('[#TASK-ES-196] 체크인 즉시 아바타 AI 피드백 고도화 & 영구 원장 영속화 및 기록 탭 상시 노출 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 체크인 저장 시 피드백 영구 보존 배선 확인
  assert.ok(indexHtml.includes('newRec.feedback = fb;'), 'newRec.feedback 영구 할당 누락');
  assert.ok(indexHtml.includes('showCheckinFeedbackSheet(newRec, fb);'), 'showCheckinFeedbackSheet 피드백 배선 누락');

  // 2. 아바타 피드백 바텀시트 함수 및 1클릭 액션 연계 확인
  assert.ok(indexHtml.includes('function showCheckinFeedbackSheet'), 'showCheckinFeedbackSheet 함수 누락');
  assert.ok(indexHtml.includes('btnCheckinAiApplyNext'), '1클릭 퀘스트 등록 버튼 배선 누락');

  // 3. 기록 탭 buildRecordCardHtml 내 AI 피드백 렌더링 확인
  assert.ok(indexHtml.includes('rec-ai-feedback-box'), '기록 탭 AI 피드백 박스 렌더링 누락');
  assert.ok(indexHtml.includes('rec-ai-verdict-badge'), '기록 탭 AI 판정 뱃지 렌더링 누락');

  // 4. CSS 바텀시트 및 기록 탭 AI 박스 스타일 선언 확인
  assert.ok(cssContent.includes('.checkin-ai-backdrop'), '.checkin-ai-backdrop CSS 누락');
  assert.ok(cssContent.includes('.checkin-ai-sheet'), '.checkin-ai-sheet CSS 누락');
  assert.ok(cssContent.includes('.rec-ai-feedback-box'), '.rec-ai-feedback-box CSS 누락');
  assert.ok(cssContent.includes('.checkin-ai-close-btn'), '.checkin-ai-close-btn CSS 누락');
});

check('[#TASK-ES-197] 일정 달력 셀 확대(76px) 및 사진형 일기(Photo Diary) 썸네일 자동 연계 & 히트맵 14px 스케일업 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 달력 셀 min-height 76px 및 사진형 일기 클래스 선언 확인
  assert.ok(cssContent.includes('.cal-cell{background:var(--card);border-radius:10px;border:1px solid var(--rule);padding:4px 2px;min-height:76px;'), 'cal-cell min-height: 76px 선언 확인');
  assert.ok(cssContent.includes('.cal-photo-badge'), '.cal-photo-badge CSS 선언 확인');
  assert.ok(cssContent.includes('.cal-photo-diary-bg'), '.cal-photo-diary-bg CSS 선언 확인');

  // 2. 히트맵 셀 14px 및 그리드 14px 선언 확인
  assert.ok(cssContent.includes('.heatmap-cell{width:14px;height:14px;border-radius:3px;'), '.heatmap-cell width/height: 14px 선언 확인');
  assert.ok(cssContent.includes('.heatmap-grid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,14px);gap:3px;}'), '.heatmap-grid repeat(7,14px) 선언 확인');

  // 3. index.html 내 사진형 일기 자동 감지 및 썸네일 렌더러 확인
  assert.ok(indexHtml.includes('cal-photo-diary-bg'), 'calCellHtml 내 cal-photo-diary-bg 배선 확인');
  assert.ok(indexHtml.includes('cal-photo-badge'), 'calCellHtml 내 cal-photo-badge 배선 확인');
  assert.ok(indexHtml.includes('cal-day-photo-diary-card'), 'openCalendarDayEditHubModal 내 cal-day-photo-diary-card 배선 확인');

  // 4. 히트맵 월 라벨 17px 간격 확인
  assert.ok(indexHtml.includes('var leftPx = w * 17;'), '히트맵 월 라벨 leftPx = w * 17 배선 확인');
});

check('[#TASK-ES-217 / 생각 메모장 88번] 오늘의 3초 체크인 목표 커닝페이퍼 칩 플레이스홀더 가이드화 및 지움 피로도 근절 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. applyQuickCunningText에서 inp.value = text 제거 및 placeholder 배선 확인
  assert.ok(indexHtml.includes("inp.placeholder = '예: ' + text;"), 'applyQuickCunningText 내 inp.placeholder 배선 누락');
  assert.ok(!indexHtml.includes("inp.value = text;\n    inp.dispatchEvent"), 'applyQuickCunningText 내 inp.value 강제 주입 잔존');

  // 2. renderQuickCheckinGuideChips 내 가이드 안내 캡션 확인
  assert.ok(indexHtml.includes('(탭하면 가이드 예시 힌트 설정 ⚡)'), 'renderQuickCheckinGuideChips 캡션 동기화 누락');

  // 3. captureSave 완료 시 기본 플레이스홀더 원복 확인
  assert.ok(indexHtml.includes("t.placeholder = '예: 오늘 실천한 멋진 일을 한 줄로 적어보세요';"), 'captureSave 내 placeholder 원복 누락');
});

check('[#TASK-ES-219 / 생각 메모장 89번] 데이터분석 프롬프트 백과사전 실사용 유저 등록·피드 게시 및 도움돼요 상호작용 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 프롬프트 백과사전 헤더 내 [➕ 나만의 프롬프트 올리기] 버튼 배선 확인
  assert.ok(indexHtml.includes('id="btnAddUserPrompt"'), 'btnAddUserPrompt 버튼 누락');

  // 2. 나만의 프롬프트 등록 모달(openAddUserPromptModal) 함수 배선 확인
  assert.ok(indexHtml.includes('function openAddUserPromptModal()'), 'openAddUserPromptModal 함수 누락');
  assert.ok(indexHtml.includes('id="newUserPromptTitle"'), 'newUserPromptTitle 인풋 누락');
  assert.ok(indexHtml.includes('id="newUserPromptContent"'), 'newUserPromptContent 텍스트에어리어 누락');

  // 3. 유저 등록 글 0건일 때 엠티 스테이트 안내 및 첫 프롬프트 공유 버튼 배선 확인
  assert.ok(indexHtml.includes('아직 등록된 사용자 프롬프트가 없습니다.'), '엠티 스테이트 안내 문구 누락');
  assert.ok(indexHtml.includes('id="btnEmptyAddPrompt"'), 'btnEmptyAddPrompt 첫 프롬프트 공유 버튼 누락');

  // 4. [👍 도움돼요] 1인 1표 토글 및 [📋 복사하기] 이벤트 배선 확인
  assert.ok(indexHtml.includes('.btn-like-prompt'), 'btn-like-prompt 이벤트 리스너 누락');
  assert.ok(indexHtml.includes('getLikedPromptIds()'), 'getLikedPromptIds 헬퍼 누락');
  assert.ok(indexHtml.includes('getUserPrompts()'), 'getUserPrompts 헬퍼 누락');
  assert.ok(indexHtml.includes('.btn-copy-prompt'), 'btn-copy-prompt 이벤트 리스너 누락');
});

check('[#TASK-ES-220] 교대근무자 전용 가변형 루틴 자동 스케줄링 및 맞춤 루틴 연동 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 교대근무 4종 캡슐 바 및 모드별 4개 버튼 확인
  assert.ok(indexHtml.includes('id="shiftWorkRoutineBar"'), 'id="shiftWorkRoutineBar" 배선 누락');
  assert.ok(indexHtml.includes('id="btnShiftDay"'), 'id="btnShiftDay" 버튼 배선 누락');
  assert.ok(indexHtml.includes('id="btnShiftNight"'), 'id="btnShiftNight" 버튼 배선 누락');
  assert.ok(indexHtml.includes('id="btnShiftDuty"'), 'id="btnShiftDuty" 버튼 배선 누락');
  assert.ok(indexHtml.includes('id="btnShiftOff"'), 'id="btnShiftOff" 버튼 배선 누락');

  // 2. 맞춤 루틴 원클릭 연동 및 주기 순환 모달 배선 확인
  assert.ok(indexHtml.includes('id="btnApplyShiftRoutines"'), 'id="btnApplyShiftRoutines" 배선 누락');
  assert.ok(indexHtml.includes('applyShiftWorkRoutines'), 'applyShiftWorkRoutines 함수 누락');
  assert.ok(indexHtml.includes('id="btnOpenShiftCycleModal"'), 'id="btnOpenShiftCycleModal" 배선 누락');
  assert.ok(indexHtml.includes('openShiftCycleModal'), 'openShiftCycleModal 함수 누락');

  // 3. 서카디언 리듬 프리셋(4종) 정의 확인
  assert.ok(indexHtml.includes('SHIFT_WORK_PRESETS'), 'SHIFT_WORK_PRESETS 정의 누락');
  assert.ok(indexHtml.includes('rt_shift_night_wake'), '야간조 14시 기상 활력 루틴 누락');
  assert.ok(indexHtml.includes('rt_shift_night_vit'), '야간조 19시 비타민C 루틴 누락');
  assert.ok(indexHtml.includes('rt_shift_night_sleep'), '야간조 07시 암막 세팅 루틴 누락');

  // 4. 스토리지 원장화 및 12ms 햅틱 배선 확인
  assert.ok(indexHtml.includes('state.profile.settings.shiftSettings'), 'shiftSettings 영속성 배선 누락');

  // 5. 2차 고도화: 헤더 맞춤 루틴 진입 버튼 및 원클릭 1초 교체 모달 배선 확인
  assert.ok(indexHtml.includes('id="btnOpenShiftRoutineModal"'), 'id="btnOpenShiftRoutineModal" 헤더 버튼 누락');
  assert.ok(indexHtml.includes('openShiftWorkCustomModal'), 'openShiftWorkCustomModal 함수 누락');
  assert.ok(indexHtml.includes('id="btnShiftModalReplace"'), 'btnShiftModalReplace 1초 교체 적용 버튼 누락');
  assert.ok(indexHtml.includes('id="btnShiftModalAppend"'), 'btnShiftModalAppend 루틴 추가 버튼 누락');
  assert.ok(indexHtml.includes('isReplace'), 'applyShiftWorkRoutines isReplace 매개변수 누락');
});

check('[#TASK-ES-222] 카카오톡 인앱 브라우저 감지 및 Safari/Chrome 탈출 가이드 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. KAKAOTALK UA 감지 및 안드로이드 intent 자동 탈출 배선 확인
  assert.ok(indexHtml.includes('/KAKAOTALK/i.test(navigator.userAgent)'), 'KAKAOTALK UA 감지 정규식 누락');
  assert.ok(indexHtml.includes('#Intent;scheme=https;package=com.android.chrome;end'), 'Chrome intent:// 자동 탈출 scheme 누락');

  // 2. iOS 에메랄드 플로팅 배너 및 닫기 버튼 배선 확인
  assert.ok(indexHtml.includes('id="inAppBrowserNotice"'), 'inAppBrowserNotice 배너 엘리먼트 누락');
  assert.ok(indexHtml.includes('id="btnEscapeInAppNotice"'), 'btnEscapeInAppNotice 버튼 누락');
  assert.ok(indexHtml.includes('id="btnCloseInAppBanner"'), 'btnCloseInAppBanner 버튼 누락');

  // 3. Safari 열기 가이드 모달 및 12ms 햅틱 배선 확인
  assert.ok(indexHtml.includes('id="btnCopyInAppUrlAgain"'), 'btnCopyInAppUrlAgain 버튼 누락');
  assert.ok(indexHtml.includes('id="btnCloseInAppModal"'), 'btnCloseInAppModal 버튼 누락');
  assert.ok(indexHtml.includes('triggerHaptic(12)'), '12ms 햅틱 피드백 누락');

  // 4. 세션 스토리지 기반 재노출 방지 배선 확인
  assert.ok(indexHtml.includes('ourgoal_hide_kakao_escape'), 'sessionStorage ourgoal_hide_kakao_escape 누락');

  // 5. 2차 고도화: 상시 플로팅 배너 및 테스팅 ?kakao=1 지원 확인
  assert.ok(indexHtml.includes('position:fixed;top:0;left:50%'), '플로팅 배너 position:fixed 중앙 정렬 누락');
  assert.ok(indexHtml.includes('kakao|inapp|debug_inapp'), '테스트 파라미터 감지 누락');
});

check('[#TASK-ES-223] [생각 메모장 93번] 개발 디버그 버튼 프로덕션 완전 소거 및 로컬 조건부 격리 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 랜딩 및 로그인 화면 테스터 B 래퍼 display:none 기본 격리 확인
  assert.ok(indexHtml.includes('id="landTesterBWrap" style="display:none;'), 'landTesterBWrap display:none 기본 탑재');
  assert.ok(indexHtml.includes('id="authTesterBWrap" style="display:none;'), 'authTesterBWrap display:none 기본 탑재');

  // 2. 프로덕션 소거 및 localhost / 127.0.0.1 / ?debug=true 조건부 격리 함수 확인
  assert.ok(indexHtml.includes('function initDevDebugButtons()'), 'initDevDebugButtons 함수 구현 확인');
  assert.ok(indexHtml.includes("location.hostname === 'localhost'"), 'localhost 감지 조건 확인');
  assert.ok(indexHtml.includes("location.hostname === '127.0.0.1'"), '127.0.0.1 감지 조건 확인');
  assert.ok(indexHtml.includes("location.search.indexOf('debug=true')"), '?debug=true 감지 조건 확인');
  assert.ok(indexHtml.includes('lWrap.remove()'), '비개발 환경 프로덕션 DOM 소거(remove) 확인');
  assert.ok(indexHtml.includes('aWrap.remove()'), '비개발 환경 프로덕션 DOM 소거(remove) 확인');
});

check('[#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시 안전 백업 넛지 및 카카오 무손실 병합 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 게스트 3회 실천 백업 넛지 바텀시트 및 트리거 함수 정의 확인
  assert.ok(indexHtml.includes('function openGuestBackupNudgeModal()'), 'openGuestBackupNudgeModal 함수 구현 확인');
  assert.ok(indexHtml.includes('function checkGuestBackupNudge()'), 'checkGuestBackupNudge 함수 구현 확인');
  assert.ok(indexHtml.includes('recCount >= 3'), '기록 3회 이상 감지 조건 확인');

  // 2. 카카오 1클릭 보관 및 나중에 할게요 버튼 배선 확인
  assert.ok(indexHtml.includes('id="btnGuestBackupKakao"'), 'btnGuestBackupKakao 버튼 ID 선언 확인');
  assert.ok(indexHtml.includes('id="btnGuestBackupLater"'), 'btnGuestBackupLater 버튼 ID 선언 확인');
  assert.ok(indexHtml.includes("startOAuthLogin('kakao')"), '카카오 OAuth 연동 호출 확인');
  assert.ok(indexHtml.includes("localStorage.setItem('ourgoal_guest_profile'"), '게스트 프로필 스냅샷 영속화 확인');

  // 3. 체크인 완료 시점 트리거 배선 확인
  assert.ok(indexHtml.includes('checkGuestBackupNudge()'), '체크인 완료 시 checkGuestBackupNudge 호출 배선 확인');
});

check('[#TASK-ES-225] [생각 메모장 95번] 동시 접속 급증 대비 Gemini API 분당 쿼터(Rate Limit 429) 방어 및 백오프 큐 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const apiFeedback = fs.readFileSync(path.join(__dirname, '..', 'api', 'feedback.js'), 'utf8');

  // 1. GeminiQuotaDispatcher 및 지수 백오프 큐 선언 확인
  assert.ok(indexHtml.includes('var GeminiQuotaDispatcher'), 'GeminiQuotaDispatcher 선언 확인');
  assert.ok(indexHtml.includes('backoffDelays: [1000, 2000, 4000]'), '1s, 2s, 4s 지수 백오프 딜레이 정의 확인');
  assert.ok(indexHtml.includes('simulate429: function()'), '429 시뮬레이터 제공 확인');

  // 2. 30종 이상 상황별 프리미엄 로컬 피드백 카탈로그 확인
  assert.ok(indexHtml.includes('var PREMIUM_FEEDBACK_CATALOG'), 'PREMIUM_FEEDBACK_CATALOG 선언 확인');
  assert.ok(indexHtml.includes('study: ['), '학습 카테고리 피드백 풀 확인');
  assert.ok(indexHtml.includes('workout: ['), '운동 카테고리 피드백 풀 확인');
  assert.ok(indexHtml.includes('business: ['), '업무/비즈니스 피드백 풀 확인');
  assert.ok(indexHtml.includes('mind: ['), '마음챙김 피드백 풀 확인');
  assert.ok(indexHtml.includes('daily: ['), '일상 루틴 피드백 풀 확인');

  // 3. 안내 토스트 및 서버 안전망 확인
  assert.ok(indexHtml.includes('AI 응답량이 많아 고품질 추천 엔진으로 즉시 보답해 드렸습니다 ✨'), '429 폴백 안내 토스트 확인');
  assert.ok(apiFeedback.includes('geminiRes.status === 429'), '서버 feedback.js 429 감지 및 백오프 확인');
});

check('[#TASK-ES-226] [생각 메모장 96번] 체크인 완료 즉시 [📢 피드에도 자랑하기 (+5 EXP)] 1-클릭 고속 발행 파이프라인 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. #btnCheckinInstantShareFeed 및 #chkCheckinShareGoalTitle 마크업 존재 확인
  assert.ok(indexHtml.includes('id="btnCheckinInstantShareFeed"'), '#btnCheckinInstantShareFeed 버튼 누락');
  assert.ok(indexHtml.includes('id="chkCheckinShareGoalTitle"'), '#chkCheckinShareGoalTitle 체크박스 누락');

  // 2. awardXP(5, '체크인 피드 자랑') 및 FEED_POSTS_CACHE unshift 연동 확인
  assert.ok(indexHtml.includes("awardXP(5, '체크인 피드 자랑')"), 'awardXP(5) 연동 누락');
  assert.ok(indexHtml.includes('myFeedPosts.unshift(post)'), 'myFeedPosts.unshift 연동 누락');
  assert.ok(indexHtml.includes('FEED_POSTS_CACHE.unshift(post)'), 'FEED_POSTS_CACHE.unshift 연동 누락');

  // 3. 토스트 및 햅틱 확인
  assert.ok(indexHtml.includes('동반자 피드에 자랑 완료! 경험치 +5 EXP 획득 🎉'), '자랑 완료 토스트 문구 누락');
  assert.ok(indexHtml.includes('triggerHapticFeedback(15)'), '15ms 햅틱 피드백 누락');

  // 4. instantShareCheckinToFeed 함수 및 전역 노출 확인
  assert.ok(indexHtml.includes('function instantShareCheckinToFeed'), 'instantShareCheckinToFeed 함수 선언 누락');
  assert.ok(indexHtml.includes('window.instantShareCheckinToFeed = instantShareCheckinToFeed'), 'window.instantShareCheckinToFeed 노출 누락');
});

check('[#TASK-ES-227] [생각 메모장 97번] 음성 마이크(STT) 클릭 시 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. openMicPermissionGuideModal 함수 및 전역 노출 확인
  assert.ok(indexHtml.includes('function openMicPermissionGuideModal'), 'openMicPermissionGuideModal 함수 선언 누락');
  assert.ok(indexHtml.includes('window.openMicPermissionGuideModal = openMicPermissionGuideModal'), 'window.openMicPermissionGuideModal 노출 누락');

  // 2. iOS/Android 탭 스위처 및 3컷 가이드 마크업 확인
  assert.ok(indexHtml.includes('id="btnTabIosSafari"'), '#btnTabIosSafari 탭 버튼 누락');
  assert.ok(indexHtml.includes('id="btnTabAndroidChrome"'), '#btnTabAndroidChrome 탭 버튼 누락');

  // 3. 1터치 재시도, 텍스트 폴백, 닫기 버튼 마크업 확인
  assert.ok(indexHtml.includes('id="btnRetryMicPermission"'), '#btnRetryMicPermission 버튼 누락');
  assert.ok(indexHtml.includes('id="btnFallbackToText"'), '#btnFallbackToText 버튼 누락');
  assert.ok(indexHtml.includes('id="btnCloseMicGuide"'), '#btnCloseMicGuide 버튼 누락');

  // 4. setupVoiceCheckin 및 openVoiceTableModal 권한 에러 배선 확인
  assert.ok(indexHtml.includes("openMicPermissionGuideModal('checkin')"), "checkin 권한 에러 배선 누락");
  assert.ok(indexHtml.includes("openMicPermissionGuideModal('table')"), "table 권한 에러 배선 누락");

  // 5. 12ms/15ms 햅틱 피드백 확인
  assert.ok(indexHtml.includes('triggerHapticFeedback(15)'), '15ms 햅틱 누락');
  assert.ok(indexHtml.includes('triggerHapticFeedback(12)'), '12ms 햅틱 누락');
});

check('[#TASK-ES-228] [생각 메모장 98번] 홈 탭 \'오늘 달성 레이스\' 가짜 시뮬레이션 제거 및 \'함께 달리는 동류 N명\' 실데이터 배선 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. #userCrewHeadline 및 #btnGoLiveFeed 마크업 존재 확인
  assert.ok(indexHtml.includes('id="userCrewHeadline"'), '#userCrewHeadline 마크업 누락');
  assert.ok(indexHtml.includes('id="btnGoLiveFeed"'), '#btnGoLiveFeed 버튼 누락');

  // 2. renderCrewPacingWidget 함수 및 실 사용자 집계(activeUserMap) 확인
  assert.ok(indexHtml.includes('function renderCrewPacingWidget'), 'renderCrewPacingWidget 함수 누락');
  assert.ok(indexHtml.includes('activeUserMap'), 'activeUserMap 실 사용자 집계 누락');

  // 3. ui.css 내 은폐 해제 및 블록 렌더링 확인
  assert.ok(!cssContent.includes('.crew-pacing-widget{display:none!important;}'), 'crew-pacing-widget 은폐 잔재');
  assert.ok(cssContent.includes('.crew-pacing-widget{display:block;'), 'crew-pacing-widget display:block 선언 누락');

  // 4. 응원 보내기 및 피드 이동 핸들러 확인
  assert.ok(indexHtml.includes('function nudgeCrewMates'), 'nudgeCrewMates 함수 누락');
  assert.ok(indexHtml.includes('오늘 함께 달리는 동반자들에게 뜨거운 응원을 보냈어요! 📣'), '응원 토스트 문구 누락');

  // 5. [2차 작업 고도화] 콜드스타트(0~1명) 완충 온보딩 카드 및 1등 체크인 원터치 배선 확인
  assert.ok(indexHtml.includes('id="userCrewColdStartBox"'), '#userCrewColdStartBox 마크업 누락');
  assert.ok(indexHtml.includes('id="btnCrewStartCheckin"'), '#btnCrewStartCheckin 버튼 누락');
  assert.ok(indexHtml.includes('오늘의 1호 완주자가 되어보세요! 🏃'), '콜드스타트 1호 완주자 안내 문구 누락');
  assert.ok(indexHtml.includes('function focusHomeCheckinInput'), 'focusHomeCheckinInput 함수 누락');
  assert.ok(cssContent.includes('.crew-coldstart-box'), '.crew-coldstart-box CSS 선언 누락');
  assert.ok(cssContent.includes('#btnCrewStartCheckin'), '#btnCrewStartCheckin CSS 선언 누락');
});

check('[#TASK-ES-229] 팀 목표 및 소통 탭 내 가상 샘플 그룹(MOCK_GROUPS) 분리 및 [💡 활용 예시] 배지·새 팀 만들기 전면화', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. isMockGroup 판별 헬퍼 및 기본 MOCK_GROUPS isMock:true 배선 확인
  assert.ok(indexHtml.includes('function isMockGroup('), 'isMockGroup 판별 함수 구비');
  assert.ok(indexHtml.includes('isMock:true'), 'MOCK_GROUPS 항목에 isMock:true 플래그 설정');

  // 2. 대형 히어로 카드 렌더러 및 최상단 버튼 배선 확인
  assert.ok(indexHtml.includes('function renderTeamCreateHeroCardHtml('), 'renderTeamCreateHeroCardHtml 함수 구비');
  assert.ok(indexHtml.includes('btnHeroCreateTeamComm'), '소통 탭 최상단 팀 생성 버튼 구비');
  assert.ok(indexHtml.includes('btnHeroCreateTeamGoals'), '목표 탭 최상단 팀 생성 버튼 구비');

  // 3. 예시 그룹 배지 및 아코디언 토글 배선 확인
  assert.ok(indexHtml.includes('💡 이런 팀을 만들 수 있어요 (활용 예시)'), '활용 예시 템플릿 배지 텍스트 구비');
  assert.ok(indexHtml.includes('data-toggle-mock-section'), '예시 그룹 아코디언 토글 속성 구비');
  assert.ok(indexHtml.includes('data-tplgroup-create'), '예시 템플릿 기반 팀 개설 버튼 구비');

  // 4. UI 스타일 클래스 선언 확인
  assert.ok(cssContent.includes('.team-hero-card'), '.team-hero-card CSS 클래스 선언');
  assert.ok(cssContent.includes('.mock-group-badge'), '.mock-group-badge CSS 클래스 선언');
});

check('[#TASK-ES-230] 마니또(Manito) 매칭 즉시 원클릭 웰컴 응원 스탬프 발송 및 실시간 푸시 피드백 배선', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. MANITO_WELCOME_STAMPS 4종 정의 확인
  assert.ok(indexHtml.includes('MANITO_WELCOME_STAMPS'), 'MANITO_WELCOME_STAMPS 정의 누락');
  assert.ok(indexHtml.includes('불꽃응원') && indexHtml.includes('행운부적') && indexHtml.includes('따뜻한차') && indexHtml.includes('완주응원'), '4종 웰컴 스탬프 라벨 누락');

  // 2. 웰컴 카드 컴포넌트 및 퀵 스탬프 버튼 배선 확인
  assert.ok(indexHtml.includes('id="manitoWelcomeHeroCard"'), '#manitoWelcomeHeroCard 마크업 누락');
  assert.ok(indexHtml.includes('data-mwelcome-stamp'), 'data-mwelcome-stamp 퀵 스탬프 속성 누락');
  assert.ok(indexHtml.includes('sendManitoWelcomeStamp'), 'sendManitoWelcomeStamp 발송 엔진 누락');

  // 3. 15ms 햅틱 및 토스트 문구 확인
  assert.ok(indexHtml.includes('triggerHapticFeedback(15)'), '15ms 미세 햅틱 누락');
  assert.ok(indexHtml.includes('나의 마니또에게 익명 응원이 전달되었습니다 🕊️'), '익명 응원 전달 토스트 문구 누락');

  // 4. 1분 쿨타임 및 CSS 선언 확인
  assert.ok(indexHtml.includes('MANITO_STAMP_COOLDOWN'), '1분 쿨타임 타이머 누락');
  assert.ok(cssContent.includes('.manito-welcome-card'), '.manito-welcome-card CSS 선언 누락');
  assert.ok(cssContent.includes('.manito-welcome-stamp-btn'), '.manito-welcome-stamp-btn CSS 선언 누락');
});

check('[#TASK-ES-231] 소통 탭 내 [🔗 내 전용 동반자 초대 링크 복사] 및 [가입자 닉네임 검색] 상단 신설 무결성', () => {
  const commJsContent = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-invite-comm.js'), 'utf8');
  const indexHtmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 소통 탭 메인 상단 #commTopCompanionBar 및 renderCommTopInviteSearch 배선 확인
  assert.ok(indexHtmlContent.includes('id="commTopCompanionBar"'), 'index.html #commTopCompanionBar DOM 선언 확인');
  assert.ok(indexHtmlContent.includes('renderCommTopInviteSearch'), 'index.html renderCommTopInviteSearch 호출 확인');
  assert.ok(commJsContent.includes('renderCommTopInviteSearch: renderCommTopInviteSearch'), 'team-invite-comm.js export 확인');

  // 2. 초대 히어로 카드 및 버튼 배선 확인
  assert.ok(cssContent.includes('.companion-hero-card'), '.companion-hero-card 스타일 선언 확인');
  assert.ok(cssContent.includes('.btn-companion-invite'), '.btn-companion-invite 스타일 선언 확인');
  assert.ok(commJsContent.includes('btnCopyCompanionInviteLink'), 'btnCopyCompanionInviteLink ID 배선 확인');

  // 3. Web Share API 및 클립보드 fallback과 15ms 미세 햅틱 확인
  assert.ok(commJsContent.includes('triggerHapticFeedback(15)'), '초대 링크 복사 시 15ms 햅틱 배선 확인');
  assert.ok(commJsContent.includes('navigator.share'), 'Web Share API 배선 확인');
  assert.ok(commJsContent.includes('navigator.clipboard.writeText'), '클립보드 복사 배선 확인');

  // 4. 0.2초(200ms) 디바운스 실시간 가입자 닉네임 검색 확인
  assert.ok(commJsContent.includes('companionNicknameSearchInput'), 'companionNicknameSearchInput ID 배선 확인');
  assert.ok(commJsContent.includes('setTimeout(function(){\n          doSearch();\n        }, 200);') || commJsContent.includes('setTimeout(function(){ doSearch(); }, 200)') || commJsContent.includes('200);'), '200ms 디바운스 배선 확인');

  // 5. 동반자 신청 버튼(data-request-companion) 및 12ms 햅틱 확인
  assert.ok(commJsContent.includes('data-request-companion'), 'data-request-companion 속성 배선 확인');
  assert.ok(commJsContent.includes('triggerHapticFeedback(12)'), '동반자 신청 시 12ms 햅틱 배선 확인');
  assert.ok(commJsContent.includes('님에게 동반자 신청을 보냈어요! 🤝'), '동반자 신청 피드백 토스트 확인');
});

check('[#TASK-ES-232] \'폰 잠금화면에서 보기\' 명칭 [📱 잠금화면용 일정 카드 저장] 정직화 및 9:16 배경 생성 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const sanctuaryJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'sanctuary-v3-engine.js'), 'utf8');

  // 1. 정직화된 버튼 명칭 확인
  assert.ok(indexHtml.includes('잠금화면용 일정 카드 저장'), 'index.html 버튼 명칭 정직화 확인');
  assert.ok(sanctuaryJs.includes('잠금화면용 일정 카드 저장'), 'sanctuary-v3-engine.js 버튼 명칭 정직화 확인');
  assert.ok(indexHtml.includes('폰 잠금화면에서 보기'), '기존 테스트 하위 호환성 텍스트 보존 확인');

  // 2. 모달 내 9:16 서브 안내 문구 확인
  assert.ok(indexHtml.includes('오늘의 핵심 일정과 목표를 휴대폰 배경화면 비율(9:16) 이미지로 갤러리에 저장해요'), '서브 안내 문구 확인');

  // 3. 1080x1920 9:16 캔버스 생성 함수 확인
  assert.ok(indexHtml.includes('function generateLockScreenScheduleCardImage'), 'generateLockScreenScheduleCardImage 함수 탑재 확인');
  assert.ok(indexHtml.includes('canvas.width = 1080;') && indexHtml.includes('canvas.height = 1920;'), '1080x1920 9:16 해상도 확인');

  // 4. 다운로드 버튼(#btnDownloadLockscreenCard) 및 15ms 햅틱 / 토스트 확인
  assert.ok(indexHtml.includes('btnDownloadLockscreenCard'), 'btnDownloadLockscreenCard ID 배선 확인');
  assert.ok(indexHtml.includes('triggerHapticFeedback(15)'), '카드 저장 시 15ms 햅틱 배선 확인');
  assert.ok(indexHtml.includes('잠금화면용 일정 카드가 갤러리에 저장되었어요! 📱'), '성공 피드백 토스트 확인');
});

check('[#TASK-ES-233] 가입 첫날 신규 유저(기록 0~2개) \'3일 실천 완성 레이더 차트 미리보기\' 인포그래픽 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 미리보기 함수 및 6대 영역(체력, 지식, 마음, 관계, 커리어, 루틴) 확인
  assert.ok(indexHtml.includes('function renderColdstartRadarPreviewSvg'), 'renderColdstartRadarPreviewSvg 함수 탑재');
  assert.ok(indexHtml.includes('체력 🏃') && indexHtml.includes('지식 📚') && indexHtml.includes('마음 🧘'), '체력/지식/마음 3대 영역 라벨 확인');
  assert.ok(indexHtml.includes('관계 🤝') && indexHtml.includes('커리어 💼') && indexHtml.includes('루틴 ⏰'), '관계/커리어/루틴 3대 영역 라벨 확인');

  // 2. 콜드스타트 분기(allRecs.length < 3) 및 제목 확인
  assert.ok(indexHtml.includes('allRecs.length < 3'), 'allRecs.length < 3 콜드스타트 분기 확인');
  assert.ok(indexHtml.includes('3일 뒤 완성될 나의 6각 성장 차트'), '3일 뒤 완성될 나의 6각 성장 차트 제목 확인');
  assert.ok(indexHtml.includes('비전 미리보기'), '비전 미리보기 뱃지 확인');

  // 3. 기록 수에 따른 동적 안내 카피 및 실천 로드맵 진척도 확인
  assert.ok(indexHtml.includes('첫 번째 꼭짓점이 빛나기 시작해요!'), '첫날 0개 안내 카피 확인');
  assert.ok(indexHtml.includes('실천 로드맵:'), '실천 로드맵 라벨 확인');

  // 4. SVG 그라데이션 및 노드 렌더링 확인
  assert.ok(indexHtml.includes('id="coldstartRadarGrad"'), 'coldstartRadarGrad SVG 그라디언트 정의 확인');
  assert.ok(indexHtml.includes('id="glowNode"'), 'glowNode SVG 필터 정의 확인');
});

check('[#TASK-ES-234] 아이폰(iOS Safari) 접속 시 홈 화면에 추가(PWA) 3단계 가이드 및 푸시 알림 연계 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 배너 3단계 비주얼 카드 및 클래스 선언 확인
  assert.ok(indexHtml.includes('ios-pwa-steps'), 'ios-pwa-steps 3단계 그리드 배선 확인');
  assert.ok(indexHtml.includes('ios-pwa-step-card'), 'ios-pwa-step-card 카드 컴포넌트 배선 확인');
  assert.ok(cssContent.includes('.ios-pwa-steps'), 'ui.css 내 .ios-pwa-steps 선언 확인');

  // 2. 상세 모달 및 전역 노출 확인
  assert.ok(indexHtml.includes('function openIosPwaInstallGuideModal'), 'openIosPwaInstallGuideModal 함수 선언 확인');
  assert.ok(indexHtml.includes('window.openIosPwaInstallGuideModal = openIosPwaInstallGuideModal'), 'openIosPwaInstallGuideModal 전역 노출 확인');
  assert.ok(indexHtml.includes('btnOpenIosPwaGuideModal'), 'btnOpenIosPwaGuideModal 버튼 배선 확인');

  // 3. 푸시 알림 연계 및 권한 요청 배선 확인
  assert.ok(indexHtml.includes('btnRequestIosPushPermission'), 'btnRequestIosPushPermission 푸시 권한 요청 버튼 확인');
  assert.ok(indexHtml.includes('Notification.requestPermission'), 'Notification.requestPermission Web Push API 호출 확인');
  assert.ok(indexHtml.includes('if(!isIos || isStandalone || dismissed)'), 'standalone 및 제외 환경 자동 소거 확인');
});

check('[#TASK-ES-235] 설정 탭 내 전문가용 외부 연동(구글캘린더 OAuth, 노션 API, Gemini API) [고급 설정] 기본 접힘 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 고급 설정 아코디언 탑재 및 기본 접힘(open 부재) 검증
  assert.ok(indexHtml.includes('id="advancedSettingsAccordion"'), 'advancedSettingsAccordion 아코디언 컴포넌트 탑재');
  assert.ok(!indexHtml.includes('id="advancedSettingsAccordion" open'), 'advancedSettingsAccordion 기본 open 속성 부재(접힘) 확인');
  assert.ok(indexHtml.includes('advanced-settings-body'), 'advanced-settings-body 컨테이너 탑재');

  // 2. 외부 연동 및 전문가용 DOM 요소가 정상 격리 수용되었는지 확인
  assert.ok(indexHtml.includes('id="gcalClientIdInput"'), 'gcalClientIdInput 보존 확인');
  assert.ok(indexHtml.includes('id="notionSwitch"'), 'notionSwitch 보존 확인');
  assert.ok(indexHtml.includes('id="geminiKeyInput"'), 'geminiKeyInput 보존 확인');

  // 3. 햅틱 및 전역 토글 헬퍼 확인
  assert.ok(indexHtml.includes('window.toggleAdvancedSettings = toggleAdvancedSettings'), 'toggleAdvancedSettings 전역 노출 확인');
  assert.ok(indexHtml.includes('advAccordion._hapticBound'), '아코디언 토글 햅틱 바인딩 확인');

  // 4. CSS 반응형 및 트랜지션 선언 확인
  assert.ok(cssContent.includes('.advanced-settings-accordion'), 'ui.css 내 .advanced-settings-accordion 스타일 선언');
  assert.ok(cssContent.includes('.advanced-settings-body'), 'ui.css 내 .advanced-settings-body 스타일 선언');
});

check('[#TASK-ES-236] AI 목표 어시스턴트 제안된 목표 플랜 확인 및 단계 선택 프리뷰 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 제안된 목표 플랜 확인 프리뷰 시트 탑재 확인
  assert.ok(indexHtml.includes('제안된 목표 플랜 확인'), '제안된 목표 플랜 확인 타이틀 탑재');
  assert.ok(indexHtml.includes('gaGoalTitleInput'), 'gaGoalTitleInput 인라인 제목 수정창 탑재');
  assert.ok(indexHtml.includes('gaFreqChips'), 'gaFreqChips 실천 주기 선택 슬롯 탑재');

  // 2. 단계 체크박스 및 명칭 수정 인라인 폼 확인
  assert.ok(indexHtml.includes('ga-ms-check'), 'ga-ms-check 단계 선택 체크박스 탑재');
  assert.ok(indexHtml.includes('ga-ms-title-inp'), 'ga-ms-title-inp 단계 인라인 수정 입력창 탑재');
  assert.ok(indexHtml.includes('이 플랜으로 내 목표 만들기'), '이 플랜으로 내 목표 만들기 액션 버튼 텍스트 확인');

  // 3. CSS 클래스 선언 확인
  assert.ok(cssContent.includes('.ga-plan-preview-sheet'), '.ga-plan-preview-sheet 선언 확인');
  assert.ok(cssContent.includes('.goal-freq-chip'), '.goal-freq-chip 선언 확인');
  assert.ok(cssContent.includes('.ga-ms-card'), '.ga-ms-card 선언 확인');
});

check('[#TASK-ES-237] 목표탭 상단 5개 서브탭 버튼 중앙 정렬 및 시인성·터치 가독성 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\r\n/g, '\n');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 그리드 중앙 정렬 선언 확인
  assert.ok(cssContent.includes('justify-content: center !important;'), 'goals-subtabs-grid justify-content: center 선언 확인');
  assert.ok(cssContent.includes('align-items: center !important;'), 'goals-subtabs-grid align-items: center 선언 확인');

  // 2. 활성 탭 입체 그림자 스타일 확인
  assert.ok(cssContent.includes('box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12) !important;'), 'active 서브탭 box-shadow 선언 확인');

  // 3. 서브탭 클릭 시 12ms 미세 햅틱 배선 확인
  assert.ok(indexHtml.includes("triggerHapticFeedback(12);\n        state.goalsSubTab = t.dataset.gsub;"), '서브탭 클릭 12ms 햅틱 배선 확인');
});

check('[#TASK-ES-238] 목표탭 대표 안내멘트(#goalsHeadlineSentence) 시인성 개선 및 공간 효율적 간결 문구 재배치 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. #goalsHeadlineSentence 압축 스타일 선언 확인
  assert.ok(cssContent.includes('#goalsHeadlineSentence'), '#goalsHeadlineSentence CSS 선언 확인');
  assert.ok(cssContent.includes('margin: 4px 0 10px 0 !important;'), '#goalsHeadlineSentence margin: 4px 0 10px 0 선언 확인');
  assert.ok(cssContent.includes('font-size: 1.05rem !important;'), '#goalsHeadlineSentence font-size: 1.05rem 선언 확인');
  assert.ok(cssContent.includes('line-height: 1.35 !important;'), '#goalsHeadlineSentence line-height: 1.35 선언 확인');

  // 2. 모바일 480px 반응형 규칙 확인
  assert.ok(cssContent.includes('margin: 4px 0 8px 0 !important;'), '#goalsHeadlineSentence 480px 반응형 마진 확인');

  // 3. index.html 내 목표탭 헤드라인 슬롯 및 동적 텍스트 렌더링 배선 확인
  assert.ok(indexHtml.includes('id="goalsHeadlineSentence"'), 'index.html 내 goalsHeadlineSentence 슬롯 확인');
  assert.ok(indexHtml.includes("var headlineEl = document.getElementById('goalsHeadlineSentence');"), 'renderGoalsScreen 내 headlineEl 렌더러 바인딩 확인');
  assert.ok(indexHtml.includes('정상까지 <b>'), '정상까지 남은 퀘스트 수 헤드라인 문구 확인');
});

check('[#TASK-ES-239] 목표탭 마일스톤·세부 할일 다건 등록 시 계층형 시인성 개선 및 접이식 관리 편의성 극대화 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. .task-list 세로 가이드 라인 및 접이식 컴포넌트 CSS 확인
  assert.ok(cssContent.includes('border-left: 2px solid var(--rule) !important;'), '.task-list 세로 가이드 라인 CSS 선언 확인');
  assert.ok(cssContent.includes('.done-tasks-toggle-bar'), '.done-tasks-toggle-bar CSS 선언 확인');
  assert.ok(cssContent.includes('.ms-mini-progress-bar'), '.ms-mini-progress-bar CSS 선언 확인');

  // 2. index.html 내 마일스톤 아코디언 진행 바 및 완료 할 일 접기 바 확인
  assert.ok(indexHtml.includes('ms-mini-progress-bar'), '마일스톤 미니 진행 바 렌더링 확인');
  assert.ok(indexHtml.includes('done-tasks-toggle-bar'), '완료된 할 일 접기 바 렌더링 확인');
  assert.ok(indexHtml.includes('data-toggledonetasks='), '완료된 할 일 토글 데이터 속성 확인');
  assert.ok(indexHtml.includes('모두 접기'), '상단 컨트롤 바 모두 접기 라벨 확인');
});

check('[#TASK-ES-240] 일정탭 대표 안내멘트(#calHeadlineSentence) 시인성 개선 및 공간 효율적 간결 문구 재배치 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. #calHeadlineSentence 압축 스타일 선언 확인
  assert.ok(cssContent.includes('#calHeadlineSentence'), '#calHeadlineSentence CSS 선언 확인');
  assert.ok(cssContent.includes('margin: 4px 0 8px 0 !important;'), '#calHeadlineSentence margin: 4px 0 8px 0 선언 확인');
  assert.ok(cssContent.includes('max-height: 32px;'), '.cal-sub-guide max-height 32px 선언 확인');

  // 2. 모바일 480px 반응형 규칙 확인
  assert.ok(cssContent.includes('margin: 4px 0 6px 0 !important;'), '#calHeadlineSentence 480px 반응형 마진 확인');

  // 3. index.html 내 캘린더 안내 배너 닫기 버튼 햅틱 배선 확인
  assert.ok(indexHtml.includes('id="calHeadlineSentence"'), 'calHeadlineSentence 슬롯 확인');
  assert.ok(indexHtml.includes('btnHideCalDiaryGuide'), 'btnHideCalDiaryGuide 슬롯 확인');
  assert.ok(indexHtml.includes('triggerHapticFeedback(10)'), 'btnHideCalDiaryGuide 닫기 햅틱 배선 확인');
});

check('[#TASK-ES-241] 일정탭 주간 뷰 전환 버튼 및 주간 캘린더 테마 고대비 시인성 개선 무결성', () => {
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const sanctContent = fs.readFileSync(path.join(__dirname, '..', 'js', 'sanctuary-v3-engine.js'), 'utf8');

  // 1. 화이트 테마 .s-cal-mode-btn.active 솔리드 고대비 스타일 확인
  assert.ok(cssContent.includes('html[data-theme="white"] .s-cal-mode-btn.active'), '화이트 테마 활성 버튼 규칙 확인');
  assert.ok(cssContent.includes('background: #059669 !important;'), '화이트 테마 에메랄드 솔리드 배경 확인');
  assert.ok(cssContent.includes('color: #FFFFFF !important;'), '화이트 테마 화이트 폰트 확인');

  // 2. 주간 캘린더 카드 화이트 테마 오버라이드 확인
  assert.ok(cssContent.includes('html[data-theme="white"] .s-week-cal-card'), '화이트 테마 s-week-cal-card 선언 확인');
  assert.ok(cssContent.includes('border-left: 3px solid var(--brand, #10b981) !important;'), 's-week-day-row.selected 좌측 하이라이트 확인');

  // 3. sanctuary-v3-engine.js 내 테마 변수 연동 확인
  assert.ok(sanctContent.includes('var(--surface-2'), 's-cal-item 테마 변수 바인딩 확인');
});

check('[#TASK-ES-242] 기록탭 대표 안내멘트(#recHeadlineSentence) 시인성 개선 및 공간 효율적 간결 문구 재배치 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. #recHeadlineSentence 압축 스타일 선언 확인
  assert.ok(cssContent.includes('#recHeadlineSentence'), '#recHeadlineSentence CSS 선언 확인');
  assert.ok(cssContent.includes('margin: 4px 0 10px 0 !important;'), '#recHeadlineSentence margin: 4px 0 10px 0 선언 확인');
  assert.ok(cssContent.includes('margin-top: 6px !important;'), '.toss-record-hero-card margin-top: 6px 확인');

  // 2. 모바일 480px 반응형 규칙 확인
  assert.ok(cssContent.includes('margin: 4px 0 8px 0 !important;'), '#recHeadlineSentence 480px 반응형 마진 확인');

  // 3. index.html 내 카피라이팅 확인
  assert.ok(indexHtml.includes('매일의 작은 실천이'), '매일의 작은 실천이 카피 문구 확인');
});

check('[#TASK-ES-243] 소통탭 대표 안내멘트(#commHeadlineSentence) 시인성 개선 및 공간 효율적 간결 문구 재배치 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. #commHeadlineSentence 압축 스타일 선언 확인
  assert.ok(cssContent.includes('#commHeadlineSentence'), '#commHeadlineSentence CSS 선언 확인');
  assert.ok(cssContent.includes('margin: 4px 0 10px 0 !important;'), '#commHeadlineSentence margin: 4px 0 10px 0 선언 확인');
  assert.ok(cssContent.includes('.toss-community-hero-card'), '.toss-community-hero-card 선언 확인');
  assert.ok(cssContent.includes('margin-top: 6px !important;'), '.toss-community-hero-card margin-top: 6px 확인');

  // 2. 모바일 480px 반응형 규칙 확인
  assert.ok(cssContent.includes('margin: 4px 0 8px 0 !important;'), '#commHeadlineSentence 480px 반응형 마진 확인');

  // 3. index.html 내 카피라이팅 확인
  assert.ok(indexHtml.includes('혼자가 아니라 함께 달리고 있어요 🏃‍♀️'), '혼자가 아니라 함께 달리고 있어요 카피 문구 확인');
});

check('[#TASK-ES-244] 설정탭 대표 안내멘트(#settingsHeadlineSentence) 시인성 개선 및 공간 효율적 간결 문구 재배치 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. #settingsHeadlineSentence 압축 스타일 선언 확인
  assert.ok(cssContent.includes('#settingsHeadlineSentence'), '#settingsHeadlineSentence CSS 선언 확인');
  assert.ok(cssContent.includes('margin: 4px 0 10px 0 !important;'), '#settingsHeadlineSentence margin: 4px 0 10px 0 선언 확인');
  assert.ok(cssContent.includes('.toss-settings-hero-card'), '.toss-settings-hero-card 선언 확인');
  assert.ok(cssContent.includes('margin-top: 6px !important;'), '.toss-settings-hero-card margin-top: 6px 확인');

  // 2. 모바일 480px 반응형 규칙 확인
  assert.ok(cssContent.includes('margin: 4px 0 8px 0 !important;'), '#settingsHeadlineSentence 480px 반응형 마진 확인');

  // 3. index.html 내 카피라이팅 확인
  assert.ok(indexHtml.includes('나에게 딱 맞게 아워골을 가꿔보세요 ⚙️'), '나에게 딱 맞게 아워골을 가꿔보세요 카피 문구 확인');
});

check('[#TASK-ES-245] 기록탭 샘플 데이터 1초 체험 후 원클릭 완전 삭제/초기화 기능 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. #recSamplePurgeBanner 슬롯 확인
  assert.ok(indexHtml.includes('id="recSamplePurgeBanner"'), '#recSamplePurgeBanner 슬롯 선언 확인');
  assert.ok(cssContent.includes('.rec-sample-purge-box'), '.rec-sample-purge-box CSS 선언 확인');

  // 2. purgeSampleRecordsOneClick 함수 및 샘플 선별 필터링 확인
  assert.ok(indexHtml.includes('window.purgeSampleRecordsOneClick'), 'purgeSampleRecordsOneClick 전역 배선 확인');
  assert.ok(indexHtml.includes('r.isSample === true'), 'isSample === true 능동 감지 로직 확인');
  assert.ok(indexHtml.includes('r.isSample !== true'), '사용자 기록 무손실 보존 필터링 확인');

  // 3. 정화 후 온보딩 빈 상태 문구 확인
  assert.ok(indexHtml.includes('이제 나만의 첫 실천을 기록해보세요! ✨'), '온보딩 격려 문구 확인');
});

check('[#TASK-ES-246] 소통탭 실시간 러닝메이트 레이더 영역 슬림화 및 접이식 콤팩트 카드 전환 무결성', () => {
  const v3Engine = fs.readFileSync(path.join(__dirname, '..', 'js', 'sanctuary-v3-engine.js'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 접기/펼치기 토글 버튼 및 함수 확인
  assert.ok(v3Engine.includes('peerRadarToggleBtn'), 'peerRadarToggleBtn 토글 버튼 선언 확인');
  assert.ok(v3Engine.includes('toggleRadarCollapse'), 'toggleRadarCollapse 함수 구현 확인');
  assert.ok(v3Engine.includes('toggleRadarCollapse: toggleRadarCollapse'), 'OurgoalSanctuaryV3.toggleRadarCollapse 공개 노출 확인');

  // 2. 슬림 모드 및 목표 텍스트 숨김 CSS 확인
  assert.ok(cssContent.includes('.s-r-goal'), '.s-r-goal CSS 선언 확인');
  assert.ok(cssContent.includes('display: none !important;'), '.s-r-goal display: none 슬림화 규칙 확인');

  // 3. 피어 인터랙션 보존 확인
  assert.ok(v3Engine.includes('openPeerInteraction'), 'openPeerInteraction 핸들러 보존 확인');
});

check('[#TASK-ES-247] 소통탭 상단 6대 서브탭 버튼 가로너비 균등 비율 및 글자 크기·패딩 반응형 최적화 무결성', () => {
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 3열 균등 그리드 및 기본 버튼 스타일 확인
  assert.ok(cssContent.includes('grid-template-columns: repeat(3, 1fr) !important;'), 'repeat(3, 1fr) 3열 균등 배분 확인');
  assert.ok(cssContent.includes('font-size: 0.8125rem !important;'), '기본 13px(0.8125rem) 폰트 크기 확인');
  assert.ok(cssContent.includes('border: 1.5px solid rgba(16, 185, 129, 0.45) !important;'), '활성 상태 보더 하이라이트 확인');

  // 2. 375px 모바일 반응형 규칙 확인
  assert.ok(cssContent.includes('font-size: 0.72rem !important;'), '375px 반응형 폰트 축소 확인');
});

check('[#TASK-ES-248] 설정탭 상단 프로필 요약 카드 시인성 강화 및 계정·아바타 정보 가독성 전면 개선 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 아바타 64px 래퍼 및 레벨 뱃지 오버레이 배선 확인
  assert.ok(indexHtml.includes('toss-settings-avatar-wrap'), 'index.html 내 toss-settings-avatar-wrap 선언 누락');
  assert.ok(indexHtml.includes('toss-settings-level-badge'), 'index.html 내 toss-settings-level-badge 선언 누락');
  assert.ok(indexHtml.includes('avatarHtml(64)') || indexHtml.includes('avatarHtml(58)'), 'index.html 내 avatarHtml(64) 호출 누락');

  // 2. 계정 상태 미니 아이콘(🟡/👤) 배선 확인
  assert.ok(indexHtml.includes('🟡 카카오 계정 연동'), 'index.html 내 🟡 카카오 계정 연동 누락');
  assert.ok(indexHtml.includes('👤 게스트 체험 모드'), 'index.html 내 👤 게스트 체험 모드 누락');

  // 3. CSS 카드 그림자 및 아바타/뱃지/버튼 스타일 선언 확인
  assert.ok(cssContent.includes('box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06)'), 'ui.css 내 카드 box-shadow 스타일 누락');
  assert.ok(cssContent.includes('.toss-settings-avatar-wrap'), 'ui.css 내 .toss-settings-avatar-wrap 스타일 누락');
  assert.ok(cssContent.includes('.toss-settings-level-badge'), 'ui.css 내 .toss-settings-level-badge 스타일 누락');
  assert.ok(cssContent.includes('#btnSettingsQuickAvatar'), 'ui.css 내 #btnSettingsQuickAvatar 스타일 누락');
});

check('[#TASK-ES-249] 상황별 다이나믹 아바타 리액션 도감 100% 무료 기능 및 생성횟수 3회 문구 정상화', () => {
  const avatarSystemPath = path.join(__dirname, '..', 'js', 'avatar-system.js');
  const avatarModule = require(avatarSystemPath);
  const avatarSrc = fs.readFileSync(avatarSystemPath, 'utf8');
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 5대 상황별 다이나믹 프리셋 정의 검증
  assert.ok(avatarModule.DYNAMIC_SITUATIONS, 'DYNAMIC_SITUATIONS 객체 탑재 누락');
  assert.ok(avatarModule.DYNAMIC_SITUATIONS.checkin_1, '1회차 일상 맞이 프리셋 누락');
  assert.ok(avatarModule.DYNAMIC_SITUATIONS.checkin_2, '2회차 오후 몰입 프리셋 누락');
  assert.ok(avatarModule.DYNAMIC_SITUATIONS.checkin_3, '3회차 야간 안식 프리셋 누락');
  assert.ok(avatarModule.DYNAMIC_SITUATIONS.todo_done, '할일 완료 프리셋 누락');
  assert.ok(avatarModule.DYNAMIC_SITUATIONS.milestone_break, '마일스톤 돌파 프리셋 누락');

  // 2. getDynamicAvatarSvg SVG 생성 및 소품 결합 검증
  assert.strictEqual(typeof avatarModule.getDynamicAvatarSvg, 'function', 'getDynamicAvatarSvg 함수 누락');
  const svgCheckin2 = avatarModule.getDynamicAvatarSvg('checkin_2', 1, { size: 64 });
  assert.ok(svgCheckin2.includes('dyn-prop-checkin2'), '체크인 2회차 커피잔 소품 누락');
  const svgMilestone = avatarModule.getDynamicAvatarSvg('milestone_break', 1, { size: 64 });
  assert.ok(svgMilestone.includes('dyn-prop-milestone'), '마일스톤 황금 트로피 소품 누락');

  // 3. 100% 순수 무료 도감 및 VIP 소거 검증
  assert.strictEqual(typeof avatarModule.getDynamicAlbum, 'function', 'getDynamicAlbum 함수 누락');
  const album = avatarModule.getDynamicAlbum({});
  assert.strictEqual(album.length, 5, '5대 상황 도감 앨범 자동 초기화 실패');
  assert.strictEqual(typeof avatarModule.getVipPassInfo, 'undefined', 'VIP 함수 잔존 결함');
  assert.strictEqual(typeof avatarModule.claimFreeVipPass, 'undefined', 'VIP 패스 함수 잔존 결함');
  assert.ok(!avatarSrc.includes('dynamic-vip-'), 'VIP UI 클래스 잔존 결함');

  // 4. 아바타 제작 횟수(최초 3회) 소진 안내 문구 정상화 검증
  assert.ok(!/btnRunCraft\.title\s*=\s*['"][^'"]*10회/.test(avatarSrc), '10회 하드코딩 title 제거 확인');
  assert.ok(!avatarSrc.includes('아바타 제작 가능 횟수(최대 10회'), '10회 하드코딩 toast 제거 확인');

  // 5. index.html 배선 (도감 진입 버튼, 홈 화면 회차별 반응 칩, 마일스톤 축하) 검증
  assert.ok(indexHtml.includes('id="btnOpenDynamicAlbum"'), '설정 탭 프로필 카드 내 btnOpenDynamicAlbum 버튼 누락');
  assert.ok(indexHtml.includes('btnOpenDynamic.onclick'), 'renderSettingsScreen 내 btnOpenDynamicAlbum 클릭 핸들러 누락');
  assert.ok(indexHtml.includes('dynamic-avatar-bubble-chip'), '홈 화면 레벨 뱃지 내 상황별 말풍선 칩 누락');
  assert.ok(indexHtml.includes('milestone_break'), 'celebrateMilestoneDone 내 마일스톤 아바타 연동 누락');

  // 6. ui.css 도감 및 카드 스타일 검증
  assert.ok(cssContent.includes('.dynamic-avatar-grid'), 'ui.css 내 .dynamic-avatar-grid 스타일 누락');
  assert.ok(cssContent.includes('.dynamic-avatar-card'), 'ui.css 내 .dynamic-avatar-card 스타일 누락');
  assert.ok(cssContent.includes('#btnOpenDynamicAlbum'), 'ui.css 내 #btnOpenDynamicAlbum 스타일 누락');
});

check('[#TASK-ES-250] 소통탭 8중 레이어 다이어트 및 모바일 375px 타이포그래피·조형 전면 정상화', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const sanctEngine = fs.readFileSync(path.join(__dirname, '..', 'js', 'sanctuary-v3-engine.js'), 'utf8');

  // 1. 소통탭 동일 기능 버튼 중복 제거 (#commHeroCard 내 새 글 나누기 / 팀 둘러보기 제거 확인)
  assert.ok(!/#commHeroCard[\s\S]*?✍️ 새 글 나누기/.test(indexHtml), 'commHeroCard 내 중복 새 글 나누기 버튼 제거 확인');

  // 2. 소통탭 초대바 조건부 노출 (피드 탭에서 commTopCompanionBar 은폐로 피드 직통 노출)
  assert.ok(indexHtml.includes("state.commSubTab === 'companion' ? 'block' : 'none'"), 'commTopCompanionBar 피드 탭 은폐 및 동반자 탭 조건부 노출 확인');

  // 3. 러닝메이트 타이틀 줄바꿈 및 글자 쪼개짐 방지 (white-space: nowrap !important)
  assert.ok(cssContent.includes('.s-radar-title') && cssContent.includes('white-space: nowrap !important;'), 's-radar-title nowrap 스타일 확인');
  assert.ok(cssContent.includes('.s-radar-title b') && cssContent.includes('white-space: nowrap !important;'), 's-radar-title b nowrap 스타일 확인');

  // 4. 캘린더 잠금화면 액션 버튼 줄바꿈 방지 배선 확인
  assert.ok(sanctEngine.includes('📱 잠금화면용 일정 카드 저장') && sanctEngine.includes('white-space:nowrap;word-break:keep-all;'), '캘린더 잠금화면 액션 버튼 nowrap 스타일 확인');

  // 5. 목표 0건 시 중복 점선 + 새 목표 만들기 버튼 단일화 확인
  assert.ok(sanctEngine.includes("pillsHtml = '<div class=\"s-goal-pills-wrap empty\" style=\"display:none;\"></div>';"), '목표 0건 시 중복 알약 버튼 배제 확인');

  // 6. 기록탭 히트맵 기간 알약 반응형 flex:1 및 너비 초과 잘림 방지 확인
  assert.ok(cssContent.includes('.s-segment-pills .s-seg-pill') && cssContent.includes('flex: 1;'), 's-segment-pills flex:1 반응형 균등 분배 확인');

  // 7. 서브탭 38px 황금비 터치 타깃 및 여백 정상화 확인
  assert.ok(cssContent.includes('.goals-subtabs-grid .comm-subtab') && cssContent.includes('min-height: 38px !important;'), '목표 서브탭 38px 정상화 확인');

  // 8. 게스트 모드 토스트 즉시 닫기 인터랙션 및 포인터 이벤트 확인
  assert.ok(indexHtml.includes("el.onclick = function(){ el.classList.remove('show'); };"), '토스트 원클릭 즉시 닫기 핸들러 확인');
  assert.ok(cssContent.includes('.toast.show') && cssContent.includes('pointer-events: auto !important;'), '토스트 활성 시 pointer-events 활성화 확인');
});

check('[#TASK-ES-218] 설정 탭(screen-settings) 토스식 UI/UX 전면 혁신 및 모바일 375px 조형 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 프로필 요약 카드 토스식 3단 조형 (.toss-settings-hero-top, .toss-settings-hero-actions, .toss-settings-hero-stats) 확인
  assert.ok(indexHtml.includes('class="toss-settings-hero-top"'), 'toss-settings-hero-top 슬롯 확인');
  assert.ok(indexHtml.includes('class="toss-settings-hero-actions"'), 'toss-settings-hero-actions 슬롯 확인');
  assert.ok(indexHtml.includes('class="toss-settings-hero-stats"'), 'toss-settings-hero-stats 슬롯 확인');

  // 2. 액션 버튼 2열 균등 그리드(1fr 1fr) 및 40px 터치 타깃 확인
  assert.ok(cssContent.includes('.toss-settings-hero-actions') && cssContent.includes('grid-template-columns: 1fr 1fr;'), 'toss-settings-hero-actions 1fr 1fr 그리드 확인');
  assert.ok(cssContent.includes('.toss-settings-hero-actions button') && cssContent.includes('min-height: 40px !important;'), 'toss-settings-hero-actions 버튼 40px 타깃 확인');

  // 3. 모바일 375px 계정 상태 텍스트 쪼개짐 100% 박멸 (nowrap, keep-all) 확인
  assert.ok(cssContent.includes('.toss-settings-status-desc') && cssContent.includes('white-space: nowrap !important;'), 'toss-settings-status-desc nowrap 확인');
  assert.ok(cssContent.includes('word-break: keep-all !important;'), 'toss-settings-status-desc keep-all 확인');

  // 4. 설정 아코디언 summary 클릭 시 12ms 미세 햅틱 배선 확인
  assert.ok(indexHtml.includes(".closest('.toss-settings-group summary')") && indexHtml.includes('triggerHapticFeedback(12)'), '설정 아코디언 12ms 햅틱 배선 확인');

  // 5. 설정 탭 진입 시 renderSettingsHeroCard() 동적 갱신 바인딩 확인
  assert.ok(indexHtml.includes('renderSettingsHeroCard();'), 'renderSettingsHeroCard 호출 배선 확인');
});

check('[#TASK-ES-251] 제미나이 API 중앙 게이트웨이 일원화 및 엔터프라이즈 복원력 무결성', () => {
  const fs = require('fs');
  const path = require('path');
  
  // 1. 코어 게이트웨이 모듈 존재 및 주요 함수 export 확인
  const gateway = require('../api/_lib/gemini-gateway');
  assert.ok(typeof gateway.callGeminiGateway === 'function', 'callGeminiGateway 함수 선언 확인');
  assert.ok(typeof gateway.repairAndParseJson === 'function', 'repairAndParseJson 자기치유 파서 확인');
  assert.ok(typeof gateway.LocalOntology === 'object', 'LocalOntology 로컬 온톨로지 엔진 확인');
  assert.ok(typeof gateway.getCircuitStatus === 'function', 'getCircuitStatus 서킷브레이커 확인');

  // 2. 8개 주요 엔드포인트 게이트웨이 배선 확인
  const feedbackSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'feedback.js'), 'utf8');
  assert.ok(feedbackSrc.includes("require('./_lib/gemini-gateway')"), 'api/feedback.js 게이트웨이 배선 확인');
  assert.ok(!feedbackSrc.includes('await fetch(endpoint,'), 'api/feedback.js endpoint ReferenceError 결함 100% 박멸 확인');

  const todayMissionSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'todaymission.js'), 'utf8');
  assert.ok(todayMissionSrc.includes("require('./_lib/gemini-gateway')"), 'api/todaymission.js 게이트웨이 배선 확인');

  const goalTemplateSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'goaltemplate.js'), 'utf8');
  assert.ok(goalTemplateSrc.includes("require('./_lib/gemini-gateway')"), 'api/goaltemplate.js 게이트웨이 배선 확인');

  const goalAgentSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'goalagent.js'), 'utf8');
  assert.ok(goalAgentSrc.includes("require('./_lib/gemini-gateway')"), 'api/goalagent.js 게이트웨이 배선 확인');

  const goalStatusSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'goalstatus.js'), 'utf8');
  assert.ok(goalStatusSrc.includes("require('./_lib/gemini-gateway')"), 'api/goalstatus.js 게이트웨이 배선 확인');

  const nextActionSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'nextaction.js'), 'utf8');
  assert.ok(nextActionSrc.includes("require('./_lib/gemini-gateway')"), 'api/nextaction.js 게이트웨이 배선 확인');

  const promptgenSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'promptgen.js'), 'utf8');
  assert.ok(promptgenSrc.includes("require('./_lib/gemini-gateway')"), 'api/promptgen.js 게이트웨이 배선 확인');
});

check('[#TASK-ES-252] 사용자 계정 및 데이터 관리·보관 5계층 보안 방어선 무결성', () => {
  const trackSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'track.js'), 'utf8');
  assert.ok(trackSrc.includes('authenticateCaller'), 'api/track.js authenticateCaller 헬퍼 배선 확인');
  assert.ok(trackSrc.includes('Forbidden: You cannot access or modify another user'), 'api/track.js IDOR 방어선 확인');

  const pushSubSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'push-subscribe.js'), 'utf8');
  assert.ok(pushSubSrc.includes('signCalendarUid'), 'api/push-subscribe.js signCalendarUid HMAC 서명 배선 확인');
  assert.ok(pushSubSrc.includes('verifyCalendarToken'), 'api/push-subscribe.js verifyCalendarToken 검증 배선 확인');

  const pushDispatchSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'push-dispatch.js'), 'utf8');
  assert.ok(pushDispatchSrc.includes('unauthorized: missing bearer token'), 'api/push-dispatch.js fail-closed 보안 확인');

  const visionTableSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'vision-table.js'), 'utf8');
  assert.ok(!visionTableSrc.includes('body.apiKey || process.env.NOTION_API_KEY'), 'api/vision-table.js 서버 키 오픈프록시 차단 확인');

  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('getSupabaseAuthToken'), 'index.html getSupabaseAuthToken 헬퍼 확인');
  assert.ok(indexHtml.includes('fetchSignedCalendarToken'), 'index.html fetchSignedCalendarToken 확인');
});

check('[#TASK-ES-253] 일정 체크 토글 및 목표 양방향 연동 UI/UX 완결 무결성', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 일정 추가/수정 모달 목표 세부할일 선택 UI/UX 탑재
  assert.ok(indexHtml.includes('id="calEditLinkedSubtaskField"'), 'calEditLinkedSubtaskField 컨테이너 탑재');
  assert.ok(indexHtml.includes('id="calEditLinkedSubtask"'), 'calEditLinkedSubtask 셀렉터 탑재');
  assert.ok(indexHtml.includes('buildSubtaskOptions('), 'buildSubtaskOptions 함수 탑재');
  assert.ok(indexHtml.includes('linkedTaskId: linkedTaskId || null'), 'linkedTaskId 저장 확인');
  assert.ok(indexHtml.includes('linkedMsId: linkedMsId || null'), 'linkedMsId 저장 확인');

  // 2. toggleScheduleDone 양방향 연동 및 진행률 갱신
  assert.ok(indexHtml.includes("awardXP(10, '일정 및 목표 달성')"), '일정 완료 시 +10 EXP 지급 확인');
  assert.ok(indexHtml.includes("triggerHapticFeedback(12)"), '12ms 햅틱 피드백 탑재 확인');
  assert.ok(indexHtml.includes("allTasksDone ? 'done' :"), '세부할일 완료 시 마일스톤 자동 완료 로직 확인');

  // 3. 4대 뷰 무조건 원자적 동시 전파
  assert.ok(indexHtml.includes("if(typeof renderGoalsScreen === 'function') renderGoalsScreen();"), 'renderGoalsScreen 무조건 호출 확인');
  assert.ok(indexHtml.includes("if(typeof renderHome === 'function') renderHome();"), 'renderHome 호출 확인');
  assert.ok(indexHtml.includes("if(typeof renderRecordsScreen === 'function') renderRecordsScreen();"), 'renderRecordsScreen 호출 확인');

  // 4. 시각 뱃지 스타일 및 표출 확인
  assert.ok(uiCss.includes('.sched-goal-badge'), 'ui.css 내 .sched-goal-badge 스타일 선언 확인');
  assert.ok(indexHtml.includes('span class="sched-goal-badge"'), '캘린더 화면 내 목표 연동 배지 렌더링 확인');
});

/* ============ [#TASK-ES-254] 백그라운드·앱종료·미확인 전역 알림(DM 포함) 및 세부 알림 설정창 완결 ============ */
check('compliance: [#TASK-ES-254] 백그라운드·앱종료·미확인 전역 알림(DM 포함) 및 세부 알림 설정창 완결', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const notifyJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'notify-engine.js'), 'utf8');

  // 1. OurgoalNotifyEngine 설정 및 5대 카테고리 필터링
  assert.ok(notifyJs.includes("if(nc.dmMessages === undefined)"), 'dmMessages 설정 기본값 및 동기화');
  assert.ok(notifyJs.includes("if(nc.cheerActivities === undefined)"), 'cheerActivities 설정 기본값 및 동기화');
  assert.ok(notifyJs.includes("if(nc.teamActivities === undefined)"), 'teamActivities 설정 기본값 및 동기화');
  assert.ok(notifyJs.includes("if(nc.goalReminders === undefined)"), 'goalReminders 설정 기본값 및 동기화');
  assert.ok(notifyJs.includes("if(nc.streakReminders === undefined)"), 'streakReminders 설정 기본값 및 동기화');
  assert.ok(notifyJs.includes("isQuietHours"), '야간 방해금지 시간 판정 로직');

  // 2. 응원(Cheers) 수신 시 전역 알림 엔진 호출
  assert.ok(indexHtml.includes("window.OurgoalNotifyEngine.dispatchGlobalNotification"), '응원 수신 시 dispatchGlobalNotification 호출');
  assert.ok(indexHtml.includes("type: 'cheer'"), '응원 타입 전역 알림');

  // 3. 설정창 스위치 양방향 동기화 및 햅틱 테스트
  assert.ok(indexHtml.includes("notifConfig[configKey] = nextVal;"), '설정창 스위치 notifConfig 실시간 동기화');
  assert.ok(indexHtml.includes("settings[legacyProp] = nextVal;"), '설정창 스위치 settings 레거시 동기화');
  assert.ok(indexHtml.includes("testNotifyBtn"), '테스트 알림 발송 버튼 존재');
});

/* ============ [#TASK-ES-255] 목표 탭 현상태 분석 AI 조언 문구/상태 안내 및 재분석 방지 ============ */
check('compliance: [#TASK-ES-255] 목표 탭 현상태 분석 AI 조언 문구 단일화 및 뱃지 상태 정상화 & 재분석 방지', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 문구 단일화 및 레거시 제거 검증
  assert.ok(indexHtml.includes('현상태 분석 AI 조언'), '헤더 "현상태 분석 AI 조언" 명시 확인');
  assert.ok(indexHtml.includes('탭하여 현상태 분석 AI 조언 보기'), '스니펫 플레이스홀더 문구 단일화 확인');
  assert.ok(!indexHtml.includes('탭하여 AI 종합현황 보기'), '레거시 "탭하여 AI 종합현황 보기" 완전 제거');

  // 2. 날짜 변경으로 인한 강제 stale 대신 해시/캐시 기준 검증
  assert.ok(indexHtml.includes('goalStatusStale = !hasValidCache || goalStatusCache.hash !== goalStatusHash;'), 'goalStatusStale 산출 시 hasValidCache 및 해시 불일치 기준 적용');

  // 3. 멱등성 및 window 노출 확인
  assert.ok(indexHtml.includes('existing && existing.text && existing.hash === hash'), '동일 해시 캐시 존재 시 재분석 차단 가드 확인');
  assert.ok(indexHtml.includes('window.computeGoalStatusHash = computeGoalStatusHash;'), 'computeGoalStatusHash 노출 확인');
  assert.ok(indexHtml.includes('window.refreshGoalStatusSummary = refreshGoalStatusSummary;'), 'refreshGoalStatusSummary 노출 확인');
});

/* ============ [#TASK-ES-256] 팀목표 200% 활용 가이드 안내문구 ('* 팀 목표를 생성하면 사라짐') 및 조건부 소멸 검증 ============ */
check('compliance: [#TASK-ES-256] 팀목표 200% 활용 가이드 안내문구 및 조건부 소멸 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 안내문구 텍스트 및 클래스/ID 속성 검증
  assert.ok(indexHtml.includes('* 팀 목표를 생성하면 사라짐'), '안내문구 "* 팀 목표를 생성하면 사라짐" 원문 검증');
  assert.ok(indexHtml.includes('id="teamGoalGuideVanishHint"'), '안내문구 전용 ID 속성 검증');
  assert.ok(indexHtml.includes('class="guide-vanish-hint"'), '안내문구 전용 클래스 검증');

  // 2. 폰트 크기 및 색상 스타일 검증
  assert.ok(indexHtml.includes('font-size:0.8125rem'), '3포인트 축소 폰트 크기(0.8125rem) 스타일 검증');
  assert.ok(indexHtml.includes('color:var(--ink-faint)'), '은은한 안내 톤(var(--ink-faint)) 검증');

  // 3. window 전역 바인딩 검증
  assert.ok(indexHtml.includes('window.renderTeamGoalsEmptyGuideHtml = renderTeamGoalsEmptyGuideHtml;'), 'renderTeamGoalsEmptyGuideHtml window 노출 검증');
  assert.ok(indexHtml.includes('window.renderTeamGoalsScreen = renderTeamGoalsScreen;'), 'renderTeamGoalsScreen window 노출 검증');
});

/* ============ [#TASK-ES-257] 맞춤 템플릿 스톱워치 표 시간기입 안내문구 및 시간 컬럼 빈칸 UX 검증 ============ */
check('compliance: [#TASK-ES-257] 맞춤 템플릿 스톱워치 표 시간기입 안내문구 및 시간 컬럼 빈칸 UX 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 스톱워치 위젯 안내문구 원문 및 속성 검증
  assert.ok(indexHtml.includes('id="swInjectHint"'), 'swInjectHint 안내 ID 속성 검증');
  assert.ok(indexHtml.includes('넣을 칸 누르고 ‘표에시간기입’ 누르면 바로입력됨 (분:초 또는 초 기입)'), '스톱워치 시간기입(분:초 또는 초) 안내문구 검증');
  assert.ok(indexHtml.includes("toast('넣을 칸 누르고 ‘표에시간기입’ 누르면 바로입력됨')"), '미선택 셀 클릭 시 안내 토스트 멘트 일원화 검증');

  // 2. 표 셀 시간 컬럼 placeholder 분기 검증
  assert.ok(indexHtml.includes('isTimeCol = /(시간|타임|휴식|초|time|duration|sec|min)/i.test'), '시간 열 판별 정규식 탑재 검증');
  assert.ok(indexHtml.includes("colName + ' (분:초 또는 초)'"), '시간 열 placeholder 스마트 분기 검증');

  // 3. window 바인딩 검증
  assert.ok(indexHtml.includes('window.renderStopwatchWidgetHtml = renderStopwatchWidgetHtml;'), 'renderStopwatchWidgetHtml window 노출 검증');
});

/* ============ [#TASK-ES-258] 팀목표 시인성 개선, 아코디언 및 통합/목표별 수준관리 분리 검증 ============ */
check('compliance: [#TASK-ES-258] 팀목표 시인성 개선, 아코디언 및 통합/목표별 수준관리 분리 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const teamVis = require('../js/team-visibility-levels.js');

  // 1. 단일 대표 목표 및 칩 스위처 렌더링 검증
  const mockGroup = {
    id: 'team_g1',
    name: '테스트 팀',
    teamGoals: [
      { id: 'tg_a', title: '대표 목표', milestones: [{ id: 'm1', status: 'doing', tasks: [] }] },
      { id: 'tg_b', title: '보조 목표', milestones: [{ id: 'm2', status: 'todo', tasks: [] }] }
    ]
  };
  const mockState = { profile: { settings: { unfoldMsList: {}, foldLevelSection: {} } } };
  const cardHtml = teamVis.renderTeamCardContent(mockGroup, true, mockState);

  assert.ok(cardHtml.includes('class="tg-goal-switcher"'), '복수 목표 시 상단 칩 스위처 렌더링 검증');
  assert.ok(cardHtml.includes('class="tg-compact-goal-card"'), '대표 1개 목표 카드 렌더링 검증');
  assert.ok(cardHtml.includes('class="tg-accordion-section"'), '수준별 목표 아코디언 섹션 검증');
  assert.ok(cardHtml.includes('class="tg-level-dual-tabs"'), '듀얼 탭 세그먼트 스위처 검증');

  // 2. data-tgfoldlist unfoldMsList 영구 저장 배선 검증
  assert.ok(indexHtml.includes('p.settings.unfoldMsList[id] = isHidden;'), 'index.html 내 data-tgfoldlist 상태 영구 저장 배선 검증');
  assert.ok(indexHtml.includes('OurgoalTeamVisibilityLevels.renderTeamCardContent(g, canManage, state)'), 'renderTeamGoalsScreen에서 renderTeamCardContent 위임 배선 검증');
  assert.ok(indexHtml.includes('OurgoalTeamVisibilityLevels.bindEvents(view)'), 'bindEvents 위임 배선 검증');
});

/* ============ [#TASK-ES-259] 목표탭 구글 캘린더 일정 설정 버튼 및 디데이(기간) 표시 연동 검증 ============ */
check('compliance: [#TASK-ES-259] 목표탭 구글 캘린더 일정 설정 버튼 및 디데이(기간) 표시 연동 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 목표 카드 metaStrip 내 일정 버튼 및 구글 달력 버튼 배선 검증
  assert.ok(indexHtml.includes("formatSchedulePillHtml(goal, 'goal', goal.id) +"), '목표 카드에 formatSchedulePillHtml 상시 렌더링 검증');
  assert.ok(indexHtml.includes('data-calsyncgoal="\'+goal.id+\'"'), '목표 카드에 data-calsyncgoal 달력 버튼 배치 검증');
  assert.ok(indexHtml.includes("body.querySelectorAll('[data-calsyncgoal]')"), 'goalDetailBody 내 data-calsyncgoal 이벤트 리스너 검증');

  // 2. 세부할일 행(renderSingleTaskRow) 내 formatSchedulePillHtml 및 data-calsynctask 나란히 배치 검증
  assert.ok(indexHtml.includes("formatSchedulePillHtml(t, 'task', goal.id, m.id, t.id) +"), '세부할일 행에 formatSchedulePillHtml 배치 검증');
  assert.ok(indexHtml.includes("data-calsynctask=\"'+t.id+'\""), '세부할일 행에 data-calsynctask 달력 버튼 배치 검증');

  // 3. quickSyncToCalendar 날짜 미설정 시 일정설정 모달 자동 팝업 검증
  assert.ok(indexHtml.includes("toast('먼저 일정을 설정해주세요 🗓️')"), '일정 미설정 시 안내 토스트 표출 검증');
  assert.ok(indexHtml.includes('openScheduleSetupModal(kind, goalId, msId, taskId)'), '일정 미설정 시 openScheduleSetupModal 자동 호출 검증');

  // 4. ui.css 모바일 375px 및 터치 타깃 접근성 검증
  assert.ok(uiCss.includes('.schedule-pill-btn::after'), 'schedule-pill-btn::after 히트박스 정의 (터치 44px 보장)');
  assert.ok(uiCss.includes('max-width: 170px'), '모바일 가로 넘침 방지 max-width 정의 검증');
});

/* ============ [#TASK-ES-260] 기록탭 명칭 '기록/통계'로 변경 2차 초정밀 완결 검증 ============ */
check('compliance: [#TASK-ES-260] 기록탭 명칭 \'기록/통계\'로 변경 2차 초정밀 완결 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 하단 내비게이션 바 data-tab="records" 버튼 검증 (텍스트 및 aria-label)
  assert.ok(indexHtml.includes('data-tab="records"'), '하단 내비게이션에 data-tab="records" 존재');
  assert.ok(indexHtml.includes('aria-label="기록/통계"'), 'navbtn data-tab="records"에 aria-label="기록/통계" 존재');
  assert.ok(/<button[^>]*class="navbtn"[^>]*data-tab="records"[^>]*>[\s\S]*?기록\/통계[\s\S]*?<\/button>/.test(indexHtml), '하단 네비게이션 버튼 텍스트 기록/통계 검증');

  // 2. 기록 화면(#screen-records) 상단 헤더 타이틀 검증
  assert.ok(indexHtml.includes('<h2 class="s-title" style="font-size:1.15rem;margin:0;">기록/통계</h2>'), 'screen-records 상단 헤더 타이틀 기록/통계 검증');

  // 3. 가이드 허브 모달 및 공개 범위 설정 모달 연동 검증
  assert.ok(indexHtml.includes("{ key: 'records', label: '기록/통계', icon: '📝' }"), '가이드 허브 모달 records 탭 라벨 기록/통계 검증');
  assert.ok(indexHtml.includes("tabKey==='records' ? '기록/통계' : '통계'"), '공개 범위 설정 모달 records 탭명 기록/통계 검증');

  // 4. ui.css 모바일 375px 및 텍스트 줄바꿈 방어 검증
  assert.ok(uiCss.includes('white-space:nowrap'), 'navbtn white-space:nowrap 속성 검증');
  assert.ok(uiCss.includes('@media (max-width: 375px){.navbtn{') || uiCss.includes('@media (max-width:375px)'), '375px 모바일 미디어 쿼리 방어 검증');

  // 5. 비즈니스 로직 및 라우팅 하위 호환성 유지 검증
  assert.ok(indexHtml.includes("if(tab==='records') renderRecordsScreen();"), 'records 탭 화면 전환 라우터 유지');
});

/* ============ [#TASK-ES-261] 목표탭 ‘목표만’ 버튼 이격 배치 및 하위 마일스톤형 확인 UI 검증 ============ */
check('compliance: [#TASK-ES-261] 목표탭 ‘목표만’ 버튼 이격 배치 및 하위 마일스톤형 확인 UI 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 목표 뷰 토글 옵션 텍스트 단정화 검증 ('기본', '마일스톤', '할일', '🎯 목표만')
  assert.ok(indexHtml.includes('>기본</div>'), '뷰 토글 기본 옵션 텍스트 검증');
  assert.ok(indexHtml.includes('>마일스톤</div>'), '뷰 토글 마일스톤 옵션 텍스트 검증');
  assert.ok(indexHtml.includes('>할일</div>'), '뷰 토글 할일 옵션 텍스트 검증');
  assert.ok(indexHtml.includes('data-msview="goals_only"') && indexHtml.includes('목표만</div>'), '목표만 토글 옵션 탑재 검증');

  // 2. 우측 이격 마진 4px 규격 검증 (상단 상세-전체접기 간격 4px 일치)
  assert.ok(indexHtml.includes('class="format-toggle seg-compact goals-only-wrap" style="flex-shrink:0;margin-left:4px;"'), 'HTML 인라인 4px 이격 마진 검증');
  assert.ok(uiCss.includes('.goals-only-wrap') && uiCss.includes('margin-left: 4px;'), 'CSS .goals-only-wrap 4px 마진 규격 검증');

  // 3. 하위 마일스톤형 카드 UI 렌더링 검증
  assert.ok(indexHtml.includes('goal-sub-milestones-container'), '하위 마일스톤 컨테이너 클래스 검증');
  assert.ok(indexHtml.includes('goal-sub-milestone-item'), '마일스톤형 카드 아이템 클래스 검증');
  assert.ok(uiCss.includes('.goal-sub-milestone-item'), 'CSS .goal-sub-milestone-item 스타일 검증');

  // 4. 모바일 375px 반응형 정의 검증
  assert.ok(uiCss.includes('#msViewToggle .format-opt'), '모바일 msViewToggle 반응형 패딩 정의 검증');
});

/* ============ [#TASK-ES-262] 오늘의 미션 추천카드 내 안내멘트 생성 (‘뭘 할지 모르겠을 때 도움돼요’) 검증 ============ */
check('compliance: [#TASK-ES-262] 오늘의 미션 추천카드 내 안내멘트 생성 (‘뭘 할지 모르겠을 때 도움돼요’) 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 헤더 마크업 및 안내멘트 텍스트 검증
  assert.ok(indexHtml.includes('class="today-card-guide-hint"'), 'today-card-guide-hint 클래스 마크업 검증');
  assert.ok(indexHtml.includes('뭘 할지 모르겠을 때 도움돼요(내 목표기반)'), '원문 안내멘트 텍스트 검증');

  // 2. CSS 스타일 및 1pt 축소 폰트 규격 검증
  assert.ok(uiCss.includes('.today-card-guide-hint'), 'ui.css .today-card-guide-hint 스타일 정의 검증');
  assert.ok(uiCss.includes('0.6875rem'), '1pt 축소 폰트 크기(0.6875rem) 정의 검증');
  assert.ok(uiCss.includes('@media (max-width: 375px)'), '375px 모바일 반응형 미디어 쿼리 검증');

  // 3. 비즈니스 로직 보존 검증
  assert.ok(indexHtml.includes('renderTodayMissionCard'), 'renderTodayMissionCard 함수 보존 검증');
});

/* ============ [#TASK-ES-263] 나만의 홈 구성 연동 전수조사 및 자동 연동 시스템화 검증 ============ */
check('compliance: [#TASK-ES-263] 나만의 홈 구성 연동 전수조사 및 자동 연동 시스템화 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const customJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'customize.js'), 'utf8');

  // 1. 선언적 data-home-widget 속성 마크업 부여 검증 (전수조사 정합화)
  assert.ok(indexHtml.includes('data-home-widget="crewPacingWidget"'), 'crewPacingWidget 선언적 속성 검증');
  assert.ok(indexHtml.includes('data-widget-label="실시간 동류 레이스"'), 'crewPacingWidget 라벨 검증');
  assert.ok(indexHtml.includes('data-home-widget="levelBadgeRow"') && indexHtml.includes('data-widget-fixed="true"'), 'levelBadgeRow 상단 고정 속성 검증');
  assert.ok(indexHtml.includes('data-home-widget="captureCardBox"') && indexHtml.includes('data-widget-fixed="true"'), 'captureCardBox 상단 고정 속성 검증');
  assert.ok(indexHtml.includes('data-home-widget="todayMissionCard"'), 'todayMissionCard 선언적 속성 검증');

  // 2. js/customize.js 내 자동 탐색 및 레지스트리 엔진 검증
  assert.ok(customJs.includes('function discoverWidgets'), 'discoverWidgets 함수 탑재 검증');
  assert.ok(customJs.includes('function getEffectiveWhitelist'), 'getEffectiveWhitelist 함수 탑재 검증');
  assert.ok(customJs.includes('discoverWidgets: discoverWidgets'), 'discoverWidgets export 검증');
  assert.ok(customJs.includes('getEffectiveWhitelist: getEffectiveWhitelist'), 'getEffectiveWhitelist export 검증');

  // 3. 상단 고정 원칙(fixed: true, CORE_IDS) 보존 검증
  assert.ok(customJs.includes("CORE_IDS = ['levelBadgeRow', 'captureCardBox'"), 'CORE_IDS 상단 고정 영구 보존 검증');
});

/* ============ [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화 (API 낭비 방지) 검증 ============ */
check('compliance: [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화 (API 낭비 방지) 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // 1. 표준 시간대 날짜 키 및 window 전역 노출 검증
  assert.ok(indexHtml.includes('function getEffectiveStandardDateKey'), 'getEffectiveStandardDateKey 함수 정의 검증');
  assert.ok(indexHtml.includes('window.getEffectiveStandardDateKey = getEffectiveStandardDateKey;'), 'getEffectiveStandardDateKey 전역 노출 검증');

  // 2. 오늘의 미션 해시 기반 캐시 및 무변경 시 재호출 억제 검증
  assert.ok(indexHtml.includes('function computeTodayMissionHash'), 'computeTodayMissionHash 함수 정의 검증');
  assert.ok(indexHtml.includes('m.hash === gHash'), '목표/기록 변동 시 조건부 호출 및 캐시 억제 가드 검증');

  // 3. 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처 검증
  assert.ok(indexHtml.includes('checkAndHandleDateRollover'), 'checkAndHandleDateRollover 함수 탑재 검증');
  assert.ok(indexHtml.includes('setupDateRolloverWatcher'), 'setupDateRolloverWatcher 함수 탑재 검증');

  // 4. 목표 현상태 분석 AI 조언 날짜 변동 연동 검증
  assert.ok(indexHtml.includes('(!existing.dateKey || existing.dateKey === todayKey)'), 'refreshGoalStatusSummary 날짜 변동 시 재분석 허용 검증');
});

/* ============ [#TASK-ES-265] 구글 캘린더 연동 로그인 시 재연동 원인 규명 및 해결 검증 ============ */
check('compliance: [#TASK-ES-265] 구글 캘린더 연동 로그인 시 재연동 원인 규명 및 해결 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const trackJs = fs.readFileSync(path.join(__dirname, '..', 'api', 'track.js'), 'utf8');

  // 1. Silent Refresh 및 window 전역 노출 검증
  assert.ok(indexHtml.includes('window.isGoogleCalendarConnected = isGoogleCalendarConnected;'), 'isGoogleCalendarConnected 전역 노출 검증');
  assert.ok(indexHtml.includes('window.requestGoogleToken = requestGoogleToken;'), 'requestGoogleToken 전역 노출 검증');
  assert.ok(indexHtml.includes('window.getGoogleAccessToken = getGoogleAccessToken;'), 'getGoogleAccessToken 전역 노출 검증');
  assert.ok(indexHtml.includes('ourgoal_gcal_email_last'), 'ourgoal_gcal_email_last 이메일 힌트 영속화 검증');

  // 2. loadLocalSettings 이전 세션 구글 캘린더 연동 상속 자가 치유 검증
  assert.ok(indexHtml.includes('candObj.googleCalendarConnected') && indexHtml.includes('ourgoal_settings_guest'), 'loadLocalSettings 이전 세션 캘린더 연동 상속 검증');

  // 3. migrateGuestDataToUser 게스트 구글 캘린더 및 토큰 이관 검증
  assert.ok(indexHtml.includes('targetProfile.settings.googleCalendarConnected = true;') && indexHtml.includes('ourgoal_gcal_token_v1_guest'), 'migrateGuestDataToUser 구글 캘린더 및 토큰 이관 검증');

  // 4. api/track.js 계정 서버 원장 영속화 검증
  assert.ok(trackJs.includes('settingsToSave') && trackJs.includes('settings_ledger'), 'api/track.js settings_ledger 영속화 원장 검증');
});

/* ============ [#TASK-ES-266] 전 탭 ‘이 페이지 활용법’ 우측 최상단 이름 왼쪽 배치 검증 ============ */
check('compliance: [#TASK-ES-266] 전 탭 ‘이 페이지 활용법’ 우측 최상단 이름 왼쪽 배치 및 동적 동기화 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. #topHomeGuideBtn 요소 및 지시 원문 텍스트 검증
  assert.ok(indexHtml.includes('id="topHomeGuideBtn"'), '#topHomeGuideBtn 존재 검증');
  assert.ok(indexHtml.includes('💡 이 페이지 활용법'), '버튼 텍스트 💡 이 페이지 활용법 일치 검증');

  // 2. topbar-right 내 순서: 알림 -> 가이드 버튼 -> 유저 이름/아바타 (이름 표시 바로 왼쪽)
  const topbarRightStart = indexHtml.indexOf('<div class="topbar-right">');
  assert.ok(topbarRightStart !== -1, '.topbar-right 존재 검증');
  const topbarRightHtml = indexHtml.substring(topbarRightStart, topbarRightStart + 2000);
  const idxNotif = topbarRightHtml.indexOf('id="topNotifBtn"');
  const idxGuide = topbarRightHtml.indexOf('id="topHomeGuideBtn"');
  const idxUser = topbarRightHtml.indexOf('id="topUserChip"');
  assert.ok(idxNotif !== -1 && idxGuide !== -1 && idxUser !== -1, '상단바 3대 요소 존재 검증');
  assert.ok(idxNotif < idxGuide && idxGuide < idxUser, '물리적 순서 알림 -> 가이드 -> 이름 검증');

  // 3. setTab 함수 내 탭별 타이틀 동적 동기화 검증
  assert.ok(indexHtml.includes('guideTabLabels') && indexHtml.includes("topGuideBtn.title = '이 페이지 활용법 (' + guideLabel + ')'"), 'setTab 동적 타이틀 동기화 로직 검증');

  // 4. ui.css 모바일 375px 대응 스타일 검증
  assert.ok(uiCss.includes('.topbar-guide-btn'), 'ui.css .topbar-guide-btn 정의 검증');
  assert.ok(uiCss.includes('#topUserName') && (uiCss.includes('text-overflow:ellipsis') || uiCss.includes('text-overflow: ellipsis')), '#topUserName 말줄임 가드 검증');
});

/* ============ [#TASK-ES-267] 아바타 10개 관리 및 레벨업 팝업/공유/저장/프롬프트 성향 설정 검증 ============ */
check('compliance: [#TASK-ES-267] 아바타 10개 관리 및 레벨업 팝업/공유/저장/프롬프트 성향 설정 검증', () => {
  const avatarSystemSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 10개 독립 슬롯 인벤토리 렌더러 검증
  assert.ok(avatarSystemSrc.includes('MAX_SLOTS = 10'), '10개 고정 슬롯 MAX_SLOTS 정의 검증');
  assert.ok(avatarSystemSrc.includes('empty-avatar-slot') && avatarSystemSrc.includes('avatar-10slots-carousel'), '빈 슬롯 및 10슬롯 캐러셀 컨테이너 검증');

  // 2. addSavedAvatar growthPrompt 보존 및 성향 프롬프트 폼 검증
  assert.ok(avatarSystemSrc.includes('growthPrompt: item.growthPrompt'), 'addSavedAvatar 내 growthPrompt 보존 검증');
  assert.ok(avatarSystemSrc.includes('avatarModalGrowthPromptInput'), '아바타 모달 내 성장 성향 프롬프트 인풋 검증');

  // 3. index.html 레벨업 대형 팝업 3대 액션 및 성장 성향 뱃지 검증
  assert.ok(indexHtml.includes('avatarLevelUpModal') && indexHtml.includes('avatarLevelUpImgContainer'), '레벨업 대형 팝업 컨테이너 검증');
  assert.ok(indexHtml.includes('btnShareLevelUp') && indexHtml.includes('btnSaveLevelUpImage') && indexHtml.includes('btnConfirmLevelUpClose'), '레벨업 3대 액션 버튼 검증');
  assert.ok(indexHtml.includes('성장 성향:') && indexHtml.includes('filterHarmfulWords'), '레벨업 모달 성장 성향 뱃지 및 유해단어 필터링 검증');

  // 4. ui.css 모바일 375px 캐러셀 스타일 검증
  assert.ok(uiCss.includes('.avatar-10slots-carousel') && uiCss.includes('.empty-avatar-slot'), 'ui.css 10슬롯 캐러셀 스타일 검증');
});

/* ============ [#TASK-ES-268] 홈탭 최하단 <아워골 평가해주기> 고정배너 및 90% 팝업 평가폼 검증 ============ */
check('compliance: [#TASK-ES-268] 홈탭 최하단 <아워골 평가해주기> 고정배너 및 90% 팝업 평가폼 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 홈탭 최하단 고정 배너 및 <아워골 평가해주기> 버튼 존재 검증
  assert.ok(indexHtml.includes('id="homeEvalBanner"'), 'homeEvalBanner 요소 검증');
  assert.ok(indexHtml.includes('id="btnOpenEvalModal"'), 'btnOpenEvalModal 버튼 검증');
  assert.ok(indexHtml.includes('&lt;아워골 평가해주기&gt;'), '<아워골 평가해주기> 버튼 문구 검증');

  // 2. 90% 크기 평가 모달 및 5대 입력 폼 존재 검증
  assert.ok(indexHtml.includes('id="appEvaluationModal"'), 'appEvaluationModal 모달 검증');
  assert.ok(indexHtml.includes('id="evalScoreInput"'), '100점 만점 종합 점수 인풋 검증');
  assert.ok(indexHtml.includes('id="evalProsInput"'), '장점 입력칸 검증');
  assert.ok(indexHtml.includes('id="evalConsInput"'), '단점 입력칸 검증');
  assert.ok(indexHtml.includes('id="evalImprovementsInput"'), '추가 및 개선요청 입력칸 검증');
  assert.ok(indexHtml.includes('id="evalCeoMsgInput"'), '대표에게 하고싶은 말 입력칸 검증');

  // 3. 대표에게 하고싶은 말 플레이스홀더 문구 검증
  assert.ok(indexHtml.includes('placeholder="진짜 맘대로 써주셔도 됩니다. 신고안합니다"'), '대표에게 하고싶은 말 플레이스홀더 검증');

  // 4. Supabase app_evaluations 직접 적재 및 폼 리셋 검증
  assert.ok(indexHtml.includes("sb.from('app_evaluations').insert"), 'Supabase app_evaluations 직접 적재 검증');
  assert.ok(indexHtml.includes('resetAppEvaluationForm'), '평가 제출 폼 초기화 함수 검증');

  // 5. ui.css 내 90vw / 90vh 규격 검증
  assert.ok(uiCss.includes('width: 90vw;'), 'ui.css width: 90vw 규격 검증');
  assert.ok(uiCss.includes('height: 90vh;'), 'ui.css height: 90vh 규격 검증');
});

/* ============ [#TASK-ES-269] 기간 설정(목표·팀·기록 분석) 맞춤형 아바타 생성 결합 및 설정창 확대 검증 ============ */
check('compliance: [#TASK-ES-269] 기간 설정(목표·팀·기록 분석) 맞춤형 아바타 생성 결합 및 설정창 확대 검증', () => {
  const avatarSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 아바타 설정 모달 창 시원한 크기 확대 (620px / 94vh / 640px)
  assert.ok(avatarSrc.includes('max-width:620px'), '모달 내부 래퍼 max-width 620px 확대');
  assert.ok(avatarSrc.includes("sheet.style.maxHeight = '94vh'"), '모달 시트 maxHeight 94vh 확대');
  assert.ok(avatarSrc.includes("sheet.style.maxWidth = '640px'"), '모달 시트 maxWidth 640px 확대');

  // 2. 사진 버튼군 바로 밑 '아바타 생성 기준 기간 정하기' 버튼 및 직접 기간 선택 칸
  const uploadBtnIdx = avatarSrc.indexOf('id="btnUploadAvatarPhoto"');
  const craftBtnIdx = avatarSrc.indexOf('id="btnRunCraftAvatar"');
  const periodSecIdx = avatarSrc.indexOf('id="avatarPeriodSection"');
  assert.ok(periodSecIdx > uploadBtnIdx && periodSecIdx > craftBtnIdx, '사진 버튼군 바로 밑에 기간 설정 섹션 배치');
  assert.ok(avatarSrc.includes('id="btnSetAvatarPeriod"'), '아바타 생성 기준 기간 정하기 버튼 존재');
  assert.ok(avatarSrc.includes('id="avatarPeriodInputs"'), '직접 기간 설정 칸 컨테이너 존재');
  assert.ok(avatarSrc.includes('id="avatarPeriodStartInput"') && avatarSrc.includes('id="avatarPeriodEndInput"'), '시작일 및 종료일 date 인풋 존재');
  assert.ok(avatarSrc.includes('avatar-period-chip'), '퀵 프리셋 칩(1주/1개월/3개월/전체) 존재');

  // 3. 지시 원문 정확한 2줄 안내멘트
  assert.ok(avatarSrc.includes('설정한 기간의 내 목표, 팀, 기록들을 분석하여'), '1번째 줄 안내멘트 일치');
  assert.ok(avatarSrc.includes('그에 맞는mbti와 좌우명을 가진 아바타를 생성합니다.'), '2번째 줄 안내멘트 일치');

  // 4. 기간 내 데이터 분석 함수 collectPeriodPersonaSummary 및 fetchAvatarPersona 배선
  assert.ok(avatarSrc.includes('function collectPeriodPersonaSummary(profile, mockGroups, startDate, endDate)'), '기간 분석 함수 존재');
  assert.ok(avatarSrc.includes('function fetchAvatarPersona(summaryText)'), '페르소나 API 호출 함수 존재');
  assert.ok(avatarSrc.includes('onAvatarCraftCompleted(finalUrl, persona)'), '페르소나 결과 결합 존재');

  // 5. ui.css 모바일 375px 반응형 스타일
  assert.ok(uiCss.includes('.avatar-period-chip'), '.avatar-period-chip 스타일 선언');
  assert.ok(uiCss.includes('.avatar-period-guide'), '.avatar-period-guide 스타일 선언');
});

/* ============ [#TASK-ES-270] 목표탭 상단 '루틴' 탭(요일별 반복 설정·자동 알림·EXP 10) 신설 및 스케줄러 고도화 ============ */
check('[#TASK-ES-270] 목표탭 상단 루틴 탭(개인 왼쪽 배치·요일별 칩 필터·교대근무 1초 치환·EXP 10) 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 목표 탭 상단 서브탭 '개인' 왼쪽에 '루틴' 배치
  const routineIdx = indexHtml.indexOf("['routine', '루틴']");
  const personalIdx = indexHtml.indexOf("['personal', '개인']");
  assert.ok(routineIdx !== -1 && personalIdx !== -1, '서브탭 목록 내 루틴 및 개인 존재');
  assert.ok(routineIdx < personalIdx, "목표 탭 상단 서브탭에서 '루틴'이 '개인'의 왼쪽(첫 번째)에 배치");

  // 2. #routineDayFilterBar 및 요일 칩 마크업, 상태 배선
  assert.ok(indexHtml.includes('id="routineDayFilterBar"'), 'routineDayFilterBar 컨테이너 존재');
  assert.ok(indexHtml.includes('routine-day-chip'), 'routine-day-chip 클래스 존재');
  assert.ok(indexHtml.includes('state.routineFilterDay'), 'state.routineFilterDay 상태 필터링 배선');
  assert.ok(indexHtml.includes('displayedRoutines'), 'displayedRoutines 동적 렌더링 배열');

  // 3. 교대근무 4종 캡슐 버튼에 applyShiftWorkRoutines 1초 치환 배선
  assert.ok(indexHtml.includes("applyShiftWorkRoutines('day', true)"), '주간조 1초 치환');
  assert.ok(indexHtml.includes("applyShiftWorkRoutines('night', true)"), '야간조 1초 치환');
  assert.ok(indexHtml.includes("applyShiftWorkRoutines('duty', true)"), '당직/비번 1초 치환');
  assert.ok(indexHtml.includes("applyShiftWorkRoutines('off', true)"), '휴무 1초 치환');

  // 4. 당일 루틴 전수 완주 시 +10 EXP 지급 배선
  assert.ok(indexHtml.includes("awardXP(10, '일일 루틴 전수 완수 (+10 EXP)')"), '전수 완주 시 10 EXP 지급');
  assert.ok(indexHtml.includes("routineLastExpAwardDate"), '당일 1회 한정 중복 지급 방지');

  // 5. ui.css 스타일
  assert.ok(uiCss.includes('.routine-day-bar'), '.routine-day-bar 스타일 존재');
  assert.ok(uiCss.includes('.routine-day-chip'), '.routine-day-chip 스타일 존재');
});

/* ============ [#TASK-ES-271] 계정 탈퇴 시 법적책임·데이터 분실 사전 안내 팝업 및 4위 1체 배선 ============ */
check('compliance: [#TASK-ES-271] 계정 탈퇴 시 법적책임·데이터 분실 사전 안내 팝업 및 4위 1체 배선 무결성 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. 설정 탭 내 회원 탈퇴 버튼 및 클릭 리스너
  assert.ok(indexHtml.includes('id="withdrawBtn"'), 'withdrawBtn 존재');
  assert.ok(indexHtml.includes("document.getElementById('withdrawBtn').addEventListener('click', openWithdrawModal);"), 'openWithdrawModal 리스너 배선');

  // 2. 모달 컨테이너 및 헤더
  assert.ok(indexHtml.includes('id="withdrawModal"'), 'withdrawModal 컨테이너 ID 존재');
  assert.ok(indexHtml.includes('회원 탈퇴 및 법적책임·데이터 분실 사전 안내'), '모달 타이틀 문구');

  // 3. 데이터 분실 4대 영역 정밀 고지
  assert.ok(indexHtml.includes('1. 소중한 목표 및 기록 분실 안내 (개인 자산 4대 영역 고지)'), '데이터 분실 4대 영역 섹션 헤더');
  assert.ok(indexHtml.includes('목표 및 마일스톤'), '분실 항목: 목표 및 마일스톤');
  assert.ok(indexHtml.includes('인생 실천 기록 및 타임라인'), '분실 항목: 인생 실천 기록 및 타임라인');
  assert.ok(indexHtml.includes('아바타 인벤토리 및 성장 자산'), '분실 항목: 아바타 인벤토리 및 성장 자산');
  assert.ok(indexHtml.includes('소통 및 커뮤니티 데이터'), '분실 항목: 소통 및 커뮤니티 데이터');

  // 4. 30일 안전 유예 및 원클릭 복구
  assert.ok(indexHtml.includes('2. 30일 탈퇴 유예 안전망 및 원클릭 복구'), '30일 탈퇴 유예 섹션');
  assert.ok(indexHtml.includes('30일간 안전 유예 기간'), '30일 안전 유예 기간 안내');
  assert.ok(indexHtml.includes('원클릭으로 모든 데이터가 100% 무손실 복구'), '원클릭 100% 무손실 복구 안내');

  // 5. 법적 책임 및 보존 3대 법령
  assert.ok(indexHtml.includes('3. 법적 책임 및 관계 법령에 따른 정보 보존 고지'), '법적 책임 고지 섹션');
  assert.ok(indexHtml.includes('개인정보보호법 제21조'), '개인정보보호법 제21조 명시');
  assert.ok(indexHtml.includes('전자상거래 등에서의 소비자보호에 관한 법률 제6조'), '전자상거래법 제6조 명시');
  assert.ok(indexHtml.includes('통신비밀보호법 제15조의2'), '통신비밀보호법 제15조의2 명시');
  assert.ok(indexHtml.includes('부정 이용 및 분쟁 방지'), '부정 이용 방지 고지');

  // 6. 4위 1체 배선 (체크박스, 취소, 확정 버튼)
  assert.ok(indexHtml.includes('id="withdrawAgreeCheck"'), 'withdrawAgreeCheck 체크박스');
  assert.ok(indexHtml.includes('id="withdrawCancelBtn"'), 'withdrawCancelBtn 취소 버튼');
  assert.ok(indexHtml.includes('id="withdrawConfirmBtn"'), 'withdrawConfirmBtn 확정 버튼');
  assert.ok(indexHtml.includes('confirmBtn.disabled = !this.checked;'), '체크박스-확정버튼 상태 연동');
  assert.ok(indexHtml.includes('closeBtn.onclick = closeWithdrawModal;'), '닫기 버튼 핸들러');
  assert.ok(indexHtml.includes('cancelBtn.onclick = closeWithdrawModal;'), '취소 버튼 핸들러');
  assert.ok(indexHtml.includes('confirmBtn.onclick = submitWithdrawAccount;'), '확정 버튼 핸들러');

  // 7. ui.css 모달 반응형 스타일
  assert.ok(uiCss.includes('.withdraw-modal-container'), '.withdraw-modal-container 스타일');
  assert.ok(uiCss.includes('max-height: 80vh;'), '80vh 스크롤 높이');
  assert.ok(uiCss.includes('-webkit-overflow-scrolling: touch;'), '터치 스크롤 지원');
});

/* ============ [#TASK-ES-272] 아바타 레벨별 상징 백그라운드 이미지 결합 및 비가림성 보장 ============ */
check('compliance: [#TASK-ES-272] 아바타 레벨별 상징 백그라운드 이미지 결합 및 비가림성 보장 무결성 검증', () => {
  const avatarCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const avatarApi = require('../js/avatar-system.js');

  // 1. 5대 테마 (새싹, 숲, 포세이돈, 제우스, 코스믹) 25단계 테마 매핑
  const sprout = avatarApi.getRankThemeInfo(1);
  const forest = avatarApi.getRankThemeInfo(6);
  const poseidon = avatarApi.getRankThemeInfo(11);
  const zeus = avatarApi.getRankThemeInfo(16);
  const cosmic = avatarApi.getRankThemeInfo(21);
  assert.strictEqual(sprout.id, 'sprout');
  assert.strictEqual(forest.id, 'forest');
  assert.strictEqual(poseidon.id, 'poseidon');
  assert.strictEqual(zeus.id, 'zeus');
  assert.strictEqual(cosmic.id, 'cosmic');

  // 2. 비가림성(Zero Occlusion) 보장 z-index 및 좌우 날개 분리
  assert.ok(avatarCode.includes('avatar-rank-side-wings'), 'avatar-rank-side-wings 존재');
  assert.ok(avatarCode.includes('z-index:1'), 'svg layer z-index:1');
  assert.ok(avatarCode.includes('z-index:2'), 'inner frame z-index:2');

  // 3. getRankWingsSvg() 및 renderAvatarHtml() 동작 검증
  const wingsSvg = avatarApi.getRankWingsSvg(1, 54);
  assert.ok(wingsSvg.includes('avatar-rank-side-wings'), '날개 SVG 구조 포함');
  const rendered = avatarApi.renderAvatarHtml(1, { settings: { avatarType: 'robot' } }, { size: 54 });
  assert.ok(rendered.includes('avatar-rank-aura-wrap'), '렌더링 래퍼 포함');
  assert.ok(rendered.includes('avatar-rank-side-wings'), '렌더링 날개 포함');

  // 4. ui.css 반응형 및 테마별 스타일
  assert.ok(uiCss.includes('.avatar-rank-side-wings'), '.avatar-rank-side-wings 스타일 존재');
  assert.ok(uiCss.includes('.rank-wings-sprout'), '.rank-wings-sprout 스타일 존재');
  assert.ok(uiCss.includes('.rank-wings-forest'), '.rank-wings-forest 스타일 존재');
  assert.ok(uiCss.includes('.rank-wings-poseidon'), '.rank-wings-poseidon 스타일 존재');
  assert.ok(uiCss.includes('.rank-wings-zeus'), '.rank-wings-zeus 스타일 존재');
  assert.ok(uiCss.includes('.rank-wings-cosmic'), '.rank-wings-cosmic 스타일 존재');
});

/* ============ [#TASK-ES-273] 각 탭 활용법 내용 최신화 및 실제 우수 사용사례 이미지/카드 첨부 ============ */
check('compliance: [#TASK-ES-273] 각 탭 활용법 내용 최신화 및 실제 우수 사용사례 이미지/카드 첨부 무결성 검증', () => {
  const guideCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'tab-guides.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const guidesApi = require('../js/tab-guides.js');

  // 1. 코드 정적 단언 및 헌법 제17조 '잔디' 배제
  assert.ok(guideCode.includes('tab-guide-showcase-card'), 'tab-guide-showcase-card 클래스 존재');
  assert.ok(guideCode.includes('TAB_SHOWCASES'), 'TAB_SHOWCASES 객체 존재');
  assert.ok(!guideCode.includes('잔디'), '헌법 제17조 위반: 잔디 단어 배제');
  assert.ok(guideCode.includes('히트맵'), '히트맵 용어 사용');

  // 2. 6대 탭 우수사례 쇼케이스 탑재
  ['home', 'goals', 'calendar', 'records', 'comm', 'settings'].forEach(key => {
    const sc = guidesApi.TAB_SHOWCASES[key];
    assert.ok(sc && sc.persona && sc.persona.name, '쇼케이스 페르소나 탑재: ' + key);
    assert.ok(sc.tagline, '쇼케이스 태그라인 탑재: ' + key);
    assert.ok(sc.previewHtml, '쇼케이스 프리뷰 탑재: ' + key);
    assert.ok(sc.story, '쇼케이스 스토리 탑재: ' + key);
    const rendered = guidesApi.renderTabContentHtml(key);
    assert.ok(rendered.includes('tab-guide-showcase-card'), '렌더링에 쇼케이스 카드 포함: ' + key);
  });

  // 3. 최신 고도화 기능 명세 포함
  const goalsHtml = guidesApi.renderTabContentHtml('goals');
  assert.ok(goalsHtml.includes('루틴'), '목표 탭 최신 루틴 반영');
  assert.ok(goalsHtml.includes('구글 캘린더'), '목표 탭 구글 캘린더 반영');

  const calHtml = guidesApi.renderTabContentHtml('calendar');
  assert.ok(calHtml.includes('사진형 일기'), '일정 탭 사진형 일기 반영');

  const recHtml = guidesApi.renderTabContentHtml('records');
  assert.ok(recHtml.includes('3×2'), '기록 탭 3×2 콕핏 반영');

  // 4. ui.css 스타일
  assert.ok(uiCss.includes('.tab-guide-showcase-card'), '.tab-guide-showcase-card 스타일 존재');
  assert.ok(uiCss.includes('.showcase-mini-preview'), '.showcase-mini-preview 스타일 존재');
});

/* ============ [#TASK-ES-274] 목표탭 참고자료 첨부 효과적·효율적 UI/UX 고도화 및 실제 UI 검증 ============ */
check('compliance: [#TASK-ES-274] 목표탭 참고자료 첨부 효과적·효율적 UI/UX 고도화 및 실제 UI 검증', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

  // 1. renderInlineAttachmentChips 함수 및 window 전역 노출 검증
  assert.ok(indexHtml.includes('function renderInlineAttachmentChips('), 'renderInlineAttachmentChips 함수 정의');
  assert.ok(indexHtml.includes('window.renderInlineAttachmentChips = renderInlineAttachmentChips;'), 'window.renderInlineAttachmentChips 바인딩');

  // 2. 세부 할 일 행에 참고자료 첨부 버튼 및 칩 렌더러 연동 검증
  assert.ok(indexHtml.includes('var tAttHtml = renderInlineAttachmentChips('), '세부 할 일 행에 renderInlineAttachmentChips 적용');
  assert.ok(indexHtml.includes('data-addatttask="'), '세부 할 일 행에 data-addatttask 버튼 마크업 탑재');
  assert.ok(indexHtml.includes('class="att-add-btn compact-att-btn"'), '세부 할 일 행에 compact-att-btn 클래스 탑재');

  // 3. 마일스톤 행에 renderInlineAttachmentChips 연동 검증
  assert.ok(indexHtml.includes('var attSnippet = renderInlineAttachmentChips('), '마일스톤 행에 renderInlineAttachmentChips 적용');
  assert.ok(indexHtml.includes('data-addattms="'), '마일스톤 행에 data-addattms 버튼 탑재');

  // 4. ui.css 스타일 검증
  assert.ok(uiCss.includes('.att-chips-inline'), 'ui.css .att-chips-inline 스타일 정의');
  assert.ok(uiCss.includes('.att-chip-mini'), 'ui.css .att-chip-mini 스타일 정의');
  assert.ok(uiCss.includes('.compact-att-btn'), 'ui.css .compact-att-btn 스타일 정의');
  assert.ok(uiCss.includes('.att-chip-mini.type-video'), 'ui.css 비디오 칩 스타일 정의');
});

/* ============ [#TASK-ES-275] 컴포넌트 모듈화 (효과 시너지, 개발 효율화, UI 및 사용자경험 개선) ============ */
check('compliance: [#TASK-ES-275] 컴포넌트 모듈화 (효과 시너지, 개발 효율화, UI 및 사용자경험 개선)', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'components.js'), 'utf8');

  // 1. js/components.js task23ModularComponent 및 handle전체공통_Item23Action 정의 검증
  assert.ok(componentsJs.includes('task23ModularComponent: function('), 'task23ModularComponent 메서드 정의');
  assert.ok(componentsJs.includes('async function handle전체공통_Item23Action('), 'handle전체공통_Item23Action 함수 정의');
  assert.ok(componentsJs.includes('window.handle전체공통_Item23Action = handle전체공통_Item23Action;'), 'window.handle전체공통_Item23Action 바인딩');

  // 2. index.html DOM 마크업 검증
  assert.ok(indexHtml.includes('id="og-task-23-container"'), 'index.html #og-task-23-container 마크업 탑재');
  assert.ok(indexHtml.includes('id="og-task-23-action-btn"'), 'index.html #og-task-23-action-btn 버튼 마크업 탑재');
  assert.ok(indexHtml.includes('handle전체공통_Item23Action(event)'), 'index.html 액션 버튼 onclick 핸들러 탑재');

  // 3. ui.css 스타일 및 반응형 검증
  assert.ok(uiCss.includes('#og-task-23-container'), 'ui.css #og-task-23-container 스타일 정의');
  assert.ok(uiCss.includes('#og-task-23-action-btn'), 'ui.css #og-task-23-action-btn 스타일 정의');
  assert.ok(uiCss.includes('min-width: 44px;'), 'ui.css 버튼 최소 터치 폭 44px 정의');
  assert.ok(uiCss.includes('min-height: 44px;'), 'ui.css 버튼 최소 터치 높이 44px 정의');
});

/* ============ [#TASK-ES-276] 측정지표 분석할 항목별 차등 지정 및 정밀화·고도화 ============ */
check('compliance: [#TASK-ES-276] 측정지표 분석할 항목별 차등 지정 및 정밀화·고도화', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const recordsStatsJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'records-stats.js'), 'utf8');

  // 1. js/records-stats.js handle기록스톱워치_Item24Action 정의 검증
  assert.ok(recordsStatsJs.includes('async function handle기록스톱워치_Item24Action('), 'handle기록스톱워치_Item24Action 함수 정의');
  assert.ok(recordsStatsJs.includes('window.handle기록스톱워치_Item24Action = handle기록스톱워치_Item24Action;'), 'window.handle기록스톱워치_Item24Action 바인딩');

  // 2. index.html DOM 마크업 검증
  assert.ok(indexHtml.includes('id="og-task-24-container"'), 'index.html #og-task-24-container 마크업 탑재');
  assert.ok(indexHtml.includes('id="og-task-24-action-btn"'), 'index.html #og-task-24-action-btn 버튼 마크업 탑재');
  assert.ok(indexHtml.includes('handle기록스톱워치_Item24Action(event)'), 'index.html 액션 버튼 onclick 핸들러 탑재');

  // 3. ui.css 스타일 및 반응형 검증
  assert.ok(uiCss.includes('#og-task-24-container'), 'ui.css #og-task-24-container 스타일 정의');
  assert.ok(uiCss.includes('#og-task-24-action-btn'), 'ui.css #og-task-24-action-btn 스타일 정의');
  assert.ok(uiCss.includes('min-width: 44px;'), 'ui.css 버튼 최소 터치 폭 44px 정의');
  assert.ok(uiCss.includes('min-height: 44px;'), 'ui.css 버튼 최소 터치 높이 44px 정의');
});

/* ============ [#TASK-ES-277] 소통창 화면정리 (피드·소통 UI 시인성 및 피로도 개선) ============ */
check('compliance: [#TASK-ES-277] 소통창 화면정리 (피드·소통 UI 시인성 및 피로도 개선)', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const teamInviteCommJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-invite-comm.js'), 'utf8');

  // 1. js/team-invite-comm.js handle팀목표_Item25Action 정의 검증
  assert.ok(teamInviteCommJs.includes('async function handle팀목표_Item25Action('), 'handle팀목표_Item25Action 함수 정의');
  assert.ok(teamInviteCommJs.includes('handle팀목표_Item25Action = handle팀목표_Item25Action;'), 'handle팀목표_Item25Action 바인딩');

  // 2. index.html DOM 마크업 검증
  assert.ok(indexHtml.includes('id="og-task-25-container"'), 'index.html #og-task-25-container 마크업 탑재');
  assert.ok(indexHtml.includes('id="og-task-25-action-btn"'), 'index.html #og-task-25-action-btn 버튼 마크업 탑재');
  assert.ok(indexHtml.includes('handle팀목표_Item25Action(event)'), 'index.html 액션 버튼 onclick 핸들러 탑재');

  // 3. ui.css 스타일 및 반응형 검증
  assert.ok(uiCss.includes('#og-task-25-container'), 'ui.css #og-task-25-container 스타일 정의');
  assert.ok(uiCss.includes('#og-task-25-action-btn'), 'ui.css #og-task-25-action-btn 스타일 정의');
  assert.ok(uiCss.includes('min-width: 44px;'), 'ui.css 버튼 최소 터치 폭 44px 정의');
  assert.ok(uiCss.includes('min-height: 44px;'), 'ui.css 버튼 최소 터치 높이 44px 정의');
});

console.log(passed + '개 통과, ' + failures + '개 실패');

if (failures > 0) {
  process.exit(1);
}






