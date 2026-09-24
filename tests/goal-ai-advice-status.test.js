/**
 * [TASK-ES-255] 목표탭 현상태 분석 AI 조언 문구/상태 안내 및 재분석 방지 단위 검증
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_TASK = 'TASK-ES-255';

console.log('[TEST] goal-ai-advice-status.test.js: starting execution for ' + SUITE_TASK + '...');

const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// 1. 소스 정적 검증: 문구 단일화 및 레거시 제거
{
  assert.ok(indexHtml.includes('현상태 분석 AI 조언'), '목표 탭 헤더에 "현상태 분석 AI 조언" 표기 확인');
  assert.ok(indexHtml.includes('탭하여 현상태 분석 AI 조언 보기'), '스니펫 플레이스홀더에 "탭하여 현상태 분석 AI 조언 보기" 표기 확인');
  assert.ok(!indexHtml.includes('탭하여 AI 종합현황 보기'), '레거시 "탭하여 AI 종합현황 보기" 완전 제거 확인');
  assert.ok(indexHtml.includes('goalStatusStale = !hasValidCache || goalStatusCache.hash !== goalStatusHash;'), 'goalStatusStale 산출 시 hasValidCache 및 해시 불일치 기준 적용 확인');
  assert.ok(indexHtml.includes('existing && existing.text && existing.hash === hash'), 'refreshGoalStatusSummary 멱등성 가드 탑재 확인');
}

// 2. computeGoalStatusHash 및 해시 변경 감지 검증
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

{
  const goalA = {
    id: 'g1',
    title: '정보처리기사 실기 합격',
    dueDate: '2026-11-20',
    result: null,
    milestones: [
      { id: 'm1', title: '알고리즘 정복', status: 'doing', dueDate: '2026-10-15', result: null, tasks: [{ id: 't1', title: '기출문제 풀이', done: false }] }
    ]
  };

  const hash1 = computeGoalStatusHash(goalA);
  assert.ok(typeof hash1 === 'string' && hash1.length > 0, '해시가 정상 문자열로 산출됨');

  // 동일 상태 시 동일 해시 (결정론적)
  assert.strictEqual(computeGoalStatusHash(goalA), hash1, '동일 목표 상태에서 해시 일관성 보장');

  // 태스크 완료 시 해시 변동
  goalA.milestones[0].tasks[0].done = true;
  const hash2 = computeGoalStatusHash(goalA);
  assert.notStrictEqual(hash1, hash2, '태스크 완료 시 해시 즉각 변동');

  // 마일스톤 타이틀 변경 시 해시 변동
  goalA.milestones[0].title = '알고리즘 및 SQL 완벽 정복';
  const hash3 = computeGoalStatusHash(goalA);
  assert.notStrictEqual(hash2, hash3, '마일스톤 타이틀 변경 시 해시 즉각 변동');
}

// 3. 목표 상세 화면 뱃지 로직 시뮬레이션 검증
function evaluateGoalStatusBadge(goal, cache, isPending) {
  var goalStatusHash = computeGoalStatusHash(goal);
  var hasValidCache = !!(cache && cache.text);
  var goalStatusStale = !hasValidCache || cache.hash !== goalStatusHash;

  var statusBadgeText = '분석완료';
  var statusBadgeColor = '#10b981';
  var statusSnippet = hasValidCache ? (cache.text.slice(0, 38) + (cache.text.length > 38 ? '…' : '')) : '탭하여 현상태 분석 AI 조언 보기';

  if (!goal.milestones || !goal.milestones.length) {
    statusBadgeText = '마일스톤 필요';
    statusBadgeColor = 'var(--ink-faint)';
    statusSnippet = '마일스톤을 추가하면 분석을 시작해요';
  } else if (isPending || (goalStatusStale && !hasValidCache)) {
    statusBadgeText = '진행 상황 분석 중…';
    statusBadgeColor = '#f59e0b';
    if (!hasValidCache) {
      statusSnippet = '목표·마일스톤 진행상황을 분석하고 있어요';
    }
  }

  return {
    badgeText: statusBadgeText,
    badgeColor: statusBadgeColor,
    snippet: statusSnippet,
    stale: goalStatusStale
  };
}

{
  const goal = {
    id: 'g2',
    title: '매일 아침 30분 러닝',
    milestones: [{ id: 'm1', title: '5km 완주', status: 'doing', tasks: [] }]
  };
  const goalHash = computeGoalStatusHash(goal);

  // 시나리오 A: 유효한 캐시가 존재하고 날짜가 어제인 경우 (상민님 지적 버그 재현 방지)
  const yesterdayCache = {
    text: '현재 5km 완주 마일스톤에 집중하고 있으며 페이스 조절이 양호합니다.',
    hash: goalHash,
    dateKey: '2026-09-24', // 어제 날짜
    updatedAt: '2026-09-24T10:00:00Z'
  };

  const evalA = evaluateGoalStatusBadge(goal, yesterdayCache, false);
  assert.strictEqual(evalA.badgeText, '분석완료', '날짜가 지나도 결과 캐시가 있으면 반드시 "분석완료"여야 함');
  assert.strictEqual(evalA.badgeColor, '#10b981', '초록색 뱃지 색상 확인');
  assert.strictEqual(evalA.stale, false, '날짜 변경만으로는 stale이 되지 않아야 함');
  assert.ok(evalA.snippet.includes('현재 5km 완주'), '스니펫에 결과 내용이 정상 표출됨');

  // 시나리오 B: 실제 비동기 분석 중인 경우 (isPending === true)
  const evalB = evaluateGoalStatusBadge(goal, yesterdayCache, true);
  assert.strictEqual(evalB.badgeText, '진행 상황 분석 중…', '실제 분석 진행 중에는 "진행 상황 분석 중…" 표출');
  assert.strictEqual(evalB.badgeColor, '#f59e0b', '주황색 분석 중 뱃지 색상');

  // 시나리오 C: 캐시가 아예 없는 신규 목표
  const evalC = evaluateGoalStatusBadge(goal, null, false);
  assert.strictEqual(evalC.badgeText, '진행 상황 분석 중…', '캐시가 없는 목표는 분석 중 표출');
  assert.strictEqual(evalC.snippet, '목표·마일스톤 진행상황을 분석하고 있어요', '분석 안내 스니펫');

  // 시나리오 D: 마일스톤이 없는 목표
  const noMsGoal = { id: 'g3', title: '아직 마일스톤 없음', milestones: [] };
  const evalD = evaluateGoalStatusBadge(noMsGoal, null, false);
  assert.strictEqual(evalD.badgeText, '마일스톤 필요', '마일스톤 없을 때 "마일스톤 필요" 안내');
}

// 4. refreshGoalStatusSummary 멱등성 및 탭 전환 재분석 방지 시뮬레이션
{
  let apiCallCount = 0;
  const mockState = {
    profile: {
      settings: {
        goalStatusSummaries: {}
      }
    },
    goalStatusPending: {},
    activeGoalId: 'g4',
    activeTab: 'goals',
    goalEditMode: false
  };

  function mockGenerateSummary(g) {
    apiCallCount++;
    return Promise.resolve('분석된 종합 상태: 페이스가 아주 훌륭합니다.');
  }

  function mockRefreshGoalStatusSummary(goal, hash) {
    if(!goal || !goal.id) return;
    if(!mockState.goalStatusPending) mockState.goalStatusPending = {};
    if(mockState.goalStatusPending[goal.id]) return;
    var summaries = (mockState.profile && mockState.profile.settings && mockState.profile.settings.goalStatusSummaries) || {};
    var existing = summaries[goal.id];
    // 멱등성 가드
    if(existing && existing.text && existing.hash === hash) return;

    mockState.goalStatusPending[goal.id] = true;
    return mockGenerateSummary(goal).then(text => {
      delete mockState.goalStatusPending[goal.id];
      mockState.profile.settings.goalStatusSummaries[goal.id] = { text: text, hash: hash, dateKey: '2026-09-25' };
    });
  }

  const goal = { id: 'g4', title: '테스트 목표', milestones: [{ id: 'm1', title: 'M1', tasks: [] }] };
  const hash = computeGoalStatusHash(goal);

  // 1회 호출: 캐시가 없으므로 API 호출 발생
  mockRefreshGoalStatusSummary(goal, hash).then(() => {
    assert.strictEqual(apiCallCount, 1, '최초 1회 API 호출 정상 발생');
    assert.ok(mockState.profile.settings.goalStatusSummaries['g4'].text, '캐시에 요약 텍스트 저장됨');
    assert.strictEqual(mockState.goalStatusPending['g4'], undefined, 'pending 플래그 정상 해제');

    // 2회 호출 (탭을 나갔다가 다시 돌아온 시나리오: 동일 해시)
    mockRefreshGoalStatusSummary(goal, hash);
    assert.strictEqual(apiCallCount, 1, '동일 해시 존재 시 API 재호출 차단(멱등성 유지)');

    // 3회 호출 (다른 화면 전환 후 복귀: 동일 해시)
    mockRefreshGoalStatusSummary(goal, hash);
    assert.strictEqual(apiCallCount, 1, '탭 전환 복귀 시에도 API 재호출 차단 유지');

    // 목표 변경 시나리오 (해시 변동)
    goal.milestones[0].title = 'M1 변경됨';
    const newHash = computeGoalStatusHash(goal);
    assert.notStrictEqual(hash, newHash, '새 해시 산출');

    mockRefreshGoalStatusSummary(goal, newHash).then(() => {
      assert.strictEqual(apiCallCount, 2, '목표 내용 변경 시에만 정상적으로 재분석 호출');
      assert.strictEqual(mockState.profile.settings.goalStatusSummaries['g4'].hash, newHash, '새 해시로 캐시 갱신');
      console.log('[TEST] goal-ai-advice-status.test.js: All assertions passed successfully.');
    });
  });
}
