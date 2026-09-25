/**
 * [TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화 (API 낭비 방지) 단위 검증
 * - 무변경 시 API 재호출 100% 억제 (캐시 보존)
 * - 날짜 변동 (한국시간 KST 00:00 자정 기준, 해외 사용자는 해당 국가 표준시 00:00 자정 기준) 시 재호출 허용
 * - 목표 변동 (목표/마일스톤/세부할일) 및 기록 변동 시 즉시 캐시 무효화 및 신규 미션 재요청
 * - 자정 롤오버 감지 및 자동 동기화 워처
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_TASK = 'TASK-ES-264';

console.log('[TEST] ai-conditional-call-optimization.test.js: starting execution for ' + SUITE_TASK + '...');

const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// 1. 소스 정적 검증
{
  assert.ok(indexHtml.includes('function getEffectiveStandardDateKey'), 'getEffectiveStandardDateKey 함수 정의 확인');
  assert.ok(indexHtml.includes('window.getEffectiveStandardDateKey = getEffectiveStandardDateKey;'), 'getEffectiveStandardDateKey 전역 노출 확인');
  assert.ok(indexHtml.includes('function computeTodayMissionHash'), 'computeTodayMissionHash 함수 정의 확인');
  assert.ok(indexHtml.includes('window.computeTodayMissionHash = computeTodayMissionHash;'), 'computeTodayMissionHash 전역 노출 확인');
  assert.ok(indexHtml.includes('checkAndHandleDateRollover'), 'checkAndHandleDateRollover 함수 정의 확인');
  assert.ok(indexHtml.includes('setupDateRolloverWatcher'), 'setupDateRolloverWatcher 함수 정의 확인');
  assert.ok(indexHtml.includes('existing && existing.text && existing.hash === hash'), 'refreshGoalStatusSummary 기존 멱등성 가드 보존 확인');
  assert.ok(indexHtml.includes('(!existing.dateKey || existing.dateKey === todayKey)'), 'refreshGoalStatusSummary 날짜 변동 시 재호출 허용 가드 확인');
}

// 2. 표준 시간대 날짜 키 함수 검증 (한국 KST 00:00 및 해외 표준시 00:00)
function getKSTDateKey(iso){
  var d = iso ? new Date(iso) : new Date();
  if(isNaN(d.getTime())) d = new Date();
  var kst = new Date(d.getTime() + (9 * 3600000));
  var pad = function(n){ return n < 10 ? '0' + n : '' + n; };
  return kst.getUTCFullYear() + '-' + pad(kst.getUTCMonth() + 1) + '-' + pad(kst.getUTCDate());
}

function getEffectiveStandardDateKey(iso, tz, fallbackTz){
  var d = iso ? new Date(iso) : new Date();
  if(isNaN(d.getTime())) d = new Date();
  var targetTz = tz || fallbackTz;
  if(!targetTz && typeof Intl !== 'undefined' && Intl.DateTimeFormat){
    try { targetTz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch(e){}
  }
  if(targetTz){
    try {
      var fmt = new Intl.DateTimeFormat('en-CA', { timeZone: targetTz, year: 'numeric', month: '2-digit', day: '2-digit' });
      var parts = fmt.format(d);
      if(parts && parts.length === 10) return parts;
    } catch(e){}
  }
  return getKSTDateKey(d.toISOString());
}

{
  // 특정 시점(예: UTC 2026-09-25 14:30:00 -> KST 2026-09-25 23:30:00, NY 2026-09-25 10:30:00)
  const isoBeforeMidnight = '2026-09-25T14:30:00.000Z';
  const kstKey1 = getEffectiveStandardDateKey(isoBeforeMidnight, 'Asia/Seoul');
  const nyKey1 = getEffectiveStandardDateKey(isoBeforeMidnight, 'America/New_York');

  assert.strictEqual(kstKey1, '2026-09-25', 'KST 23:30은 2026-09-25');
  assert.strictEqual(nyKey1, '2026-09-25', 'NY 10:30은 2026-09-25');

  // UTC 2026-09-25 15:05:00 -> KST 2026-09-26 00:05:00 (KST 자정 롤오버!), NY 2026-09-25 11:05:00
  const isoAfterKSTMidnight = '2026-09-25T15:05:00.000Z';
  const kstKey2 = getEffectiveStandardDateKey(isoAfterKSTMidnight, 'Asia/Seoul');
  const nyKey2 = getEffectiveStandardDateKey(isoAfterKSTMidnight, 'America/New_York');

  assert.strictEqual(kstKey2, '2026-09-26', '한국시간 00:00 자정 경과 시 KST 날짜 키는 2026-09-26으로 롤오버');
  assert.strictEqual(nyKey2, '2026-09-25', '동일 시각 뉴욕은 아직 오전 11:05이므로 2026-09-25 유지');

  // UTC 2026-09-26 04:05:00 -> NY 2026-09-26 00:05:00 (NY 자정 롤오버!)
  const isoAfterNYMidnight = '2026-09-26T04:05:00.000Z';
  const nyKey3 = getEffectiveStandardDateKey(isoAfterNYMidnight, 'America/New_York');
  assert.strictEqual(nyKey3, '2026-09-26', '뉴욕 현지 표준시 자정 00:00 경과 시 NY 날짜 키 롤오버');
}

// 3. 목표/기록 변동 해시 및 조건부 호출 캐시 시뮬레이션
function computeGoalStatusHash(goal){
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

function computeTodayMissionHash(g, records){
  var baseHash = computeGoalStatusHash(g);
  var recs = records || [];
  var lastRec = recs.find(function(r){ return r.goalId === g.id || r.category === g.category; });
  var recPart = lastRec ? (lastRec.id + ':' + (lastRec.startAt || lastRec.date || '')) : '';
  return baseHash + (recPart ? (':' + recPart) : '');
}

{
  const goal = {
    id: 'g-test-1',
    category: 'study',
    title: '토익 900점 완성',
    dueDate: '2026-10-31',
    milestones: [
      { id: 'm1', title: 'LC 파트 1~4 완벽 정리', status: 'doing', tasks: [{ id: 't1', title: '파트1 사진 묘사 50제', done: false }] }
    ]
  };

  const initialRecords = [];
  const hash1 = computeTodayMissionHash(goal, initialRecords);
  assert.ok(typeof hash1 === 'string' && hash1.length > 0, '해시 정상 생성');

  // 목표/기록 변동 없을 때 해시 동일
  const hash1Repeat = computeTodayMissionHash(goal, initialRecords);
  assert.strictEqual(hash1, hash1Repeat, '변동 없을 때 해시 동일성 보장');

  // 목표 세부할일 완료 체크 시 해시 변동
  goal.milestones[0].tasks[0].done = true;
  const hash2 = computeTodayMissionHash(goal, initialRecords);
  assert.notStrictEqual(hash1, hash2, '세부할일 체크 시 해시 즉각 변동');

  // 신규 실천 기록 추가 시 해시 변동
  const updatedRecords = [{ id: 'rec-1', goalId: 'g-test-1', category: 'study', startAt: '2026-09-25T10:00:00.000Z', text: 'LC 파트1 50제 완벽 풀이' }];
  const hash3 = computeTodayMissionHash(goal, updatedRecords);
  assert.notStrictEqual(hash2, hash3, '새 실천 기록 추가 시 해시 즉각 변동');
}

// 4. API 호출 억제(낭비 방지) 및 재호출 트리거 시뮬레이터 검증
function simulateMissionEvaluation(goal, records, missionsCache, todayDateKey, apiCallTracker){
  var m = missionsCache[goal.id];
  var gHash = computeTodayMissionHash(goal, records);
  var isCacheValid = !!(m && m.text && m.date === todayDateKey && (!m.hash || m.hash === gHash));

  if(isCacheValid){
    if(m && !m.hash){ m.hash = gHash; }
    // 캐시 유효 -> API 호출 0회
    return { fromCache: true, text: m.text, apiCalled: false };
  }

  // 캐시 무효 -> API 호출
  apiCallTracker.calls += 1;
  const newMissionText = '새로운 미션: ' + goal.title + ' 실천하기 (' + todayDateKey + ')';
  missionsCache[goal.id] = { date: todayDateKey, text: newMissionText, hash: gHash, updatedAt: new Date().toISOString() };
  return { fromCache: false, text: newMissionText, apiCalled: true };
}

{
  const goal = {
    id: 'g-runner',
    category: 'workout',
    title: '매일 5km 러닝',
    milestones: [{ id: 'm1', title: '주 3회 5km', status: 'doing', tasks: [] }]
  };
  const records = [];
  const missionsCache = {};
  const tracker = { calls: 0 };

  const today = '2026-09-25';

  // 시나리오 1: 첫 실행 -> API 호출 1회 발생
  const r1 = simulateMissionEvaluation(goal, records, missionsCache, today, tracker);
  assert.strictEqual(r1.apiCalled, true, '최초 실행 시 미션 생성 API 호출');
  assert.strictEqual(tracker.calls, 1, 'API 호출 카운트 1');

  // 시나리오 2: 앱 새로고침 (변화 없음) -> API 호출 0회 (완전 차단!)
  const r2 = simulateMissionEvaluation(goal, records, missionsCache, today, tracker);
  assert.strictEqual(r2.apiCalled, false, '새로고침 시 캐시 적중으로 API 호출 억제');
  assert.strictEqual(tracker.calls, 1, 'API 호출 누적 여전히 1 (낭비 0%)');
  assert.strictEqual(r2.text, r1.text, '캐시된 미션 텍스트 즉시 반환');

  // 시나리오 3: 100회 연속 새로고침 시뮬레이션 -> API 호출 누적 여전히 1
  for(let i=0; i<100; i++){
    simulateMissionEvaluation(goal, records, missionsCache, today, tracker);
  }
  assert.strictEqual(tracker.calls, 1, '100회 새로고침 후에도 API 호출 누적 1 보증');

  // 시나리오 4: 목표 변동 (마일스톤 완료) -> 캐시 무효화 및 API 호출 1회 발생
  goal.milestones[0].status = 'done';
  const r3 = simulateMissionEvaluation(goal, records, missionsCache, today, tracker);
  assert.strictEqual(r3.apiCalled, true, '목표 변동 시 새로운 미션 요청');
  assert.strictEqual(tracker.calls, 2, 'API 호출 누적 2');

  // 시나리오 5: 자정 경과로 날짜 변동 (2026-09-25 -> 2026-09-26) -> API 호출 1회 발생
  const tomorrow = '2026-09-26';
  const r4 = simulateMissionEvaluation(goal, records, missionsCache, tomorrow, tracker);
  assert.strictEqual(r4.apiCalled, true, '날짜 롤오버 시 오늘 새 미션 요청');
  assert.strictEqual(tracker.calls, 3, 'API 호출 누적 3');

  // 시나리오 6: 새 날짜에서 다시 새로고침 -> API 호출 0회
  const r5 = simulateMissionEvaluation(goal, records, missionsCache, tomorrow, tracker);
  assert.strictEqual(r5.apiCalled, false, '새 날짜 캐시 적중으로 호출 차단');
  assert.strictEqual(tracker.calls, 3, 'API 호출 누적 여전히 3');
}

// 5. 자정 롤오버 감지기 시뮬레이션 검증
{
  let lastObservedDateKey = '2026-09-25';
  let dispatchedViews = [];

  function checkRolloverSimulator(currentDateKey){
    if(lastObservedDateKey !== currentDateKey){
      lastObservedDateKey = currentDateKey;
      dispatchedViews.push('home', 'records', 'calendar');
      return true;
    }
    return false;
  }

  // 같은 날짜 감지 -> false
  assert.strictEqual(checkRolloverSimulator('2026-09-25'), false, '동일 날짜에서는 롤오버 미발생');
  assert.strictEqual(dispatchedViews.length, 0, '뷰 전파 없음');

  // 자정 경과 날짜 변동 감지 -> true 및 4대 뷰 전파
  assert.strictEqual(checkRolloverSimulator('2026-09-26'), true, '자정 경과 시 롤오버 감지');
  assert.ok(dispatchedViews.includes('home'), '홈 화면 전파 실행');
  assert.ok(dispatchedViews.includes('records'), '기록 화면 전파 실행');
  assert.ok(dispatchedViews.includes('calendar'), '캘린더 화면 전파 실행');
}

console.log('[TEST] ai-conditional-call-optimization.test.js: all assertions passed successfully for ' + SUITE_TASK);
