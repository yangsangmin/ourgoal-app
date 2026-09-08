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
  'parseAttribution', 'filterHidden',
  'uid', 'newId', 'nowISO', 'getSid', 'getAttribution', 'recordLanding', 'buildCheckinRecord', 'updateAppBadge',
  'calendarAvailable', 'fmtDateLabel', 'filterRecordsByQuery',
  'generateDynamicNotification',
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
  'var navigator = { badge: null, setAppBadge: function(n){ this.badge = n; return Promise.resolve(); }, clearAppBadge: function(){ this.badge = 0; return Promise.resolve(); } };\n' +
  /* 검색(filterRecordsByQuery)의 분야 매칭 대상 — 실제 TOPICS 전체를 옮기지 않고 테스트에 필요한 만큼만 스텁 */
  'var TOPICS = { workout: { label: "운동" } };\n' +
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
  'parseAttribution, filterHidden, ' +
  'uid, newId, nowISO, getSid, getAttribution, recordLanding, ' +
  'setSearch: function(s){ location.search = s; }, getStorage: function(){ return localStorage; }, ' +
  'buildCheckinRecord, updateAppBadge, ' +
  'getNavigator: function(){ return navigator; }, setNavigator: function(n){ navigator = n; }, ' +
  'calendarAvailable, fmtDateLabel, filterRecordsByQuery, ' +
  'generateDynamicNotification, ' +
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
  assert.ok(rec.id && String(rec.id).length > 0);
  assert.strictEqual(rec.startAt, rec.endAt);
  assert.ok(!isNaN(Date.parse(rec.startAt)));
});

check('buildCheckinRecord: 목표가 없으면 category는 null', () => {
  const rec = fns.buildCheckinRecord('오늘의 기록', null);
  assert.strictEqual(rec.category, null);
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


console.log(passed + '개 통과, ' + failures + '개 실패');
if (failures > 0) {
  process.exit(1);
}
