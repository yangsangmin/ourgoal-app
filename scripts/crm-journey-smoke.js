#!/usr/bin/env node
/*
 * [T045] CRM 캘린더(온보딩·스트릭유지·윈백 저니) 드라이런 스모크 테스트.
 * 실DB 없이 api/push-dispatch.js 의 순수 함수(__test 익스포트)만으로
 * 경과일 판정·빈도상한 로직이 브리프대로 동작하는지 검증한다.
 * 실행: node scripts/crm-journey-smoke.js
 */
'use strict';
const assert = require('assert');
const dispatch = require('../api/push-dispatch.js');
const t = dispatch.__test;

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

console.log('[1/3] 온보딩 저니 — 첫 체크인 경과일');
check('D0: 오늘 첫 체크인이면 즉시 대상', () => {
  const key = t.dateKeyInTz(new Date(), 'Asia/Seoul');
  const days = t.daysBetweenKeys(key, key);
  assert.strictEqual(days, 0);
  const step = t.ONBOARDING_STEPS.find(s => s.key === 'd0');
  assert.ok(days >= step.minDay, 'd0 는 경과 0일부터 대상이어야 함');
});
check('D1/D3/D7: 경과일 미만이면 대상 아님, 이상이면 대상', () => {
  const from = '2026-09-01';
  assert.strictEqual(t.daysBetweenKeys(from, '2026-09-02'), 1);
  assert.strictEqual(t.daysBetweenKeys(from, '2026-09-04'), 3);
  assert.strictEqual(t.daysBetweenKeys(from, '2026-09-08'), 7);
  const d7 = t.ONBOARDING_STEPS.find(s => s.key === 'd7');
  assert.strictEqual(t.daysBetweenKeys(from, '2026-09-07') < d7.minDay, true, '6일차는 아직 d7 대상 아님');
  assert.strictEqual(t.daysBetweenKeys(from, '2026-09-08') >= d7.minDay, true, '7일차는 d7 대상');
});
check('단계 4개가 브리프(D0/D1/D3/D7)와 정확히 일치', () => {
  assert.deepStrictEqual(t.ONBOARDING_STEPS.map(s => s.key), ['d0', 'd1', 'd3', 'd7']);
});

console.log('[2/3] 윈백 저니 — 비활성 경과일');
check('단계 3개가 브리프(D3/D7/D14)와 정확히 일치', () => {
  assert.deepStrictEqual(t.WINBACK_STEPS.map(s => s.key), ['d3', 'd7', 'd14']);
});
check('D14 비활성 경과 판정', () => {
  assert.strictEqual(t.daysBetweenKeys('2026-09-01', '2026-09-15'), 14);
});

console.log('[3/3] 빈도상한 — 비트랜잭션 3회/24h · 행동형 2회/24h + 4시간 간격');
check('빈 로그는 발송 가능', () => {
  assert.strictEqual(t.crmCanSend({ crm_notif_log: [] }, 'non_transactional'), true);
  assert.strictEqual(t.crmCanSend({ crm_notif_log: [] }, 'behavioral'), true);
});
check('24시간 내 비트랜잭션 3건이면 종류 무관 차단', () => {
  const now = Date.now();
  const log = [0, 1, 2].map(h => ({ at: new Date(now - h * 3600 * 1000).toISOString(), kind: 'non_transactional' }));
  assert.strictEqual(t.crmCanSend({ crm_notif_log: log }, 'non_transactional'), false);
  assert.strictEqual(t.crmCanSend({ crm_notif_log: log }, 'behavioral'), false);
});
check('24시간 내 행동형 2건이면 행동형만 차단(비트랜잭션 총합 3 미만이면 비트랜잭션은 가능)', () => {
  const now = Date.now();
  const log = [1, 2].map(h => ({ at: new Date(now - h * 3600 * 1000).toISOString(), kind: 'behavioral' }));
  assert.strictEqual(t.crmCanSend({ crm_notif_log: log }, 'behavioral'), false);
  assert.strictEqual(t.crmCanSend({ crm_notif_log: log }, 'non_transactional'), true);
});
check('행동형 발송 4시간 이내 재발송 차단(24h 카운트가 남아 있어도)', () => {
  const now = Date.now();
  const log = [{ at: new Date(now - 1 * 3600 * 1000).toISOString(), kind: 'behavioral' }];
  assert.strictEqual(t.crmCanSend({ crm_notif_log: log }, 'behavioral'), false, '1시간 전 발송 — 4시간 간격 미충족');
});
check('행동형 발송 4시간 지나면 재발송 허용', () => {
  const now = Date.now();
  const log = [{ at: new Date(now - 5 * 3600 * 1000).toISOString(), kind: 'behavioral' }];
  assert.strictEqual(t.crmCanSend({ crm_notif_log: log }, 'behavioral'), true);
});
check('crmLogSend 는 최근 20건만 유지', () => {
  let log = [];
  for (let i = 0; i < 25; i++) log = t.crmLogSend(log, 'behavioral');
  assert.strictEqual(log.length, 20);
});

console.log('\n' + passed + ' passed, ' + failures + ' failed');
if (failures > 0) process.exit(1);
