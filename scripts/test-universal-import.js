const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 [데이터 가져오기 & 1초 샘플 라이프사이클 및 무결성 검증]');

// 1. universal-stats.js 로드
const uStats = require('../js/universal-stats.js');
assert.ok(uStats, 'universal-stats 모듈 로드 성공');
assert.ok(typeof uStats.openUniversalImportModal === 'function', 'openUniversalImportModal 노출 확인');
console.log('  ✓ 1. 모듈 로드 성공');

// 2. 52주 파워리프팅 동적 날짜 및 isSample 메타데이터 검증
const big3Recs = uStats.generate52WeekPowerliftingSample();
assert.strictEqual(big3Recs.length, 156, '52주 x 3세션 = 156개 세션이어야 함');
assert.strictEqual(big3Recs[0].isSample, true, '모든 샘플 레코드에 isSample: true 필수');
assert.strictEqual(big3Recs[0].sampleCategory, 'big3', 'sampleCategory: big3 확인');
// 최신 세션 날짜가 2026년(현재 연도)이어야 함
const latestBig3 = big3Recs[big3Recs.length - 1];
const latestYear = new Date(latestBig3.startAt).getFullYear();
assert.ok(latestYear >= 2026, '현재 시점 기준 52주 동적 리베이스 확인: ' + latestBig3.startAt);
console.log('  ✓ 2. 52주 파워리프팅 샘플 156세션 동적 날짜 및 isSample 플래그 확인');

// 3. 도메인별 샘플(영업, 개발, 공부 등) isSample 검증
const salesRecs = uStats.generateDomainSample('sales');
assert.strictEqual(salesRecs.length, 52, '52주 영업 실적이어야 함');
assert.strictEqual(salesRecs[0].isSample, true, 'isSample: true 확인');
assert.strictEqual(salesRecs[0].sampleCategory, 'sales', 'sampleCategory 확인');

const codeRecs = uStats.generateDomainSample('coding');
assert.strictEqual(codeRecs.length, 52, '52주 개발 활동이어야 함');
assert.strictEqual(codeRecs[0].isSample, true, 'isSample: true 확인');
console.log('  ✓ 3. 도메인별 52주 샘플(영업, 개발 등) isSample 메타데이터 확인');

// 4. CSV(쉼표) 및 엑셀(탭) 파서 검증
const csvText = 'Date,Item,Value,Note\n2026-09-10,코딩,10,커밋\n2026-09-11,코딩,15,리뷰';
const parsedCsv = uStats.parseCsvToUniversalRecords(csvText, 'general');
assert.strictEqual(parsedCsv.length, 2, 'CSV 2행 파싱 성공');
assert.strictEqual(parsedCsv[0].metrics.value, 10, '수치 파싱 확인');

const tsvText = 'Date\tTask\tDeals\tAmount\n2026-09-12\t영업미팅\t3\t250\n2026-09-13\t계약체결\t5\t400';
const parsedTsv = uStats.parseCsvToUniversalRecords(tsvText, 'general');
assert.strictEqual(parsedTsv.length, 2, '엑셀 탭 구분 2행 파싱 성공');
assert.strictEqual(parsedTsv[1].metrics.amount, 400, '탭 분리 수치 파싱 확인');
console.log('  ✓ 4. CSV 및 엑셀 탭(\t) 구분자 자동 감지 및 수치 파싱 성공');

// 5. 모달 UI 및 1초 로드 & 자가 정화(Purge) 시뮬레이션
const elements = {};
const sampleCard1 = createMockEl('div');
sampleCard1.dataset = { sample: 'sales' };
sampleCard1.textContent = 'B2B 영업 실적';
const sampleCard2 = createMockEl('div');
sampleCard2.dataset = { sample: 'big3_52w' };
sampleCard2.textContent = '3대 운동 52주';

const sampleQuickBtn = createMockEl('button');
sampleQuickBtn.dataset = { quickSample: 'sales' };
sampleQuickBtn.closest = function() { return { textContent: 'B2B 영업 실적 52주' }; };

function createMockEl(tag = 'div') {
  const el = {
    tagName: tag.toUpperCase(),
    className: '',
    classList: {
      add: function(c) { el.className += ' ' + c; },
      remove: function(c) { el.className = el.className.replace(c, '').trim(); },
      contains: function(c) { return el.className.includes(c); },
      toggle: function(c, b) { if(b) el.classList.add(c); else el.classList.remove(c); }
    },
    style: {},
    _innerHTML: '',
    get innerHTML() { return el._innerHTML; },
    set innerHTML(html) {
      el._innerHTML = html;
      el.children = [];
    },
    textContent: '',
    children: [],
    querySelector: function(sel) {
      if (sel.startsWith('#')) {
        const id = sel.substring(1);
        if (!elements[id]) elements[id] = createMockEl('div');
        return elements[id];
      }
      return createMockEl('div');
    },
    querySelectorAll: function(sel) {
      if (sel === '.u-sample-card') {
        return [sampleCard1, sampleCard2];
      }
      if (sel === '.u-sample-quick-btn') {
        return [sampleQuickBtn];
      }
      return [];
    }
  };
  return el;
}

// 실제 유저 기존 데이터 (데이터 무손실 검증용)
const realUserRecords = [
  { id: 'user_rec_1', text: '상민님의 실제 체크인 기록', startAt: '2026-09-14T10:00:00.000Z', isSample: false },
  { id: 'user_rec_2', text: '상민님의 실제 헬스 기록', startAt: '2026-09-13T18:00:00.000Z' }
];

const mockState = {
  profile: {
    id: 'user_test',
    records: JSON.parse(JSON.stringify(realUserRecords))
  },
  recordsSegment: 'feed',
  univPeriod: '1M'
};

let saveProfileCalled = false;
let closeModalCalled = false;
let onDoneCalled = false;
let lastToast = '';

let activeModalSheet = null;

(async function runTest() {
  // 5-1. 모달 오픈 및 1초 원클릭 로더 테스트
  uStats.openUniversalImportModal({
    openModal: function(html, onMount) {
      activeModalSheet = createMockEl('div');
      activeModalSheet.innerHTML = html;
      onMount(activeModalSheet);
    },
    closeModal: function() { closeModalCalled = true; },
    toast: function(msg) { lastToast = msg; },
    state: mockState,
    saveProfile: async function() { saveProfileCalled = true; },
    onDone: function(type, count) { onDoneCalled = true; }
  });

  console.log('  ✓ 5-1. openUniversalImportModal 마운트 성공');

  // 5-2. 원터치 [⚡ 1초 로드] 버튼 클릭 시뮬레이션
  const qBtns = activeModalSheet.querySelectorAll('.u-sample-quick-btn');
  assert.ok(qBtns.length > 0, '1초 로드 버튼 발견');
  await qBtns[0].onclick({ stopPropagation: function(){} });

  // 검증: 52개 영업 데이터가 유저 실제 데이터 2개와 무손실 융합되었는가?
  assert.strictEqual(mockState.profile.records.length, 54, '기존 2개 + 샘플 52개 = 총 54개여야 함');
  assert.strictEqual(mockState.recordsSegment, 'stats', '통계 뷰로 자동 전환 확인');
  assert.strictEqual(mockState.univPeriod, 'all', '전 기간 52주 차트 표출 확인');
  assert.ok(saveProfileCalled, 'saveProfile 호출 확인');
  assert.ok(closeModalCalled, '모달 닫기 확인');
  assert.ok(onDoneCalled, 'onDone 콜백 확인');
  console.log('  ✓ 5-2. [⚡ 1초 로드] 원클릭 융합 및 통계 뷰 즉시 표출 성공');

  // 5-3. 샘플 데이터 자가 정화/되돌리기 (Purge) 안전망 테스트
  let purgeConfirmed = false;
  global.confirm = function(msg) {
    purgeConfirmed = true;
    return true;
  };

  closeModalCalled = false;
  saveProfileCalled = false;

  uStats.openUniversalImportModal({
    openModal: function(html, onMount) {
      assert.ok(html.includes('uSamplePurgeRow'), '샘플이 존재할 때 상단에 정화 배너가 노출되어야 함');
      assert.ok(html.includes('52건'), '52건 샘플 카운트가 표시되어야 함');
      const purgeEl = createMockEl('button');
      elements['uPurgeSampleBtn'] = purgeEl;
      const ms = createMockEl('div');
      ms.innerHTML = html;
      onMount(ms);
    },
    closeModal: function() { closeModalCalled = true; },
    toast: function(msg) { lastToast = msg; },
    state: mockState,
    saveProfile: async function() { saveProfileCalled = true; },
    onDone: function(type, count) { onDoneCalled = true; }
  });

  const purgeBtn = elements['uPurgeSampleBtn'];
  assert.ok(purgeBtn, '샘플 삭제 버튼 존재');
  await purgeBtn.onclick();

  // 검증: 샘플 52개만 깔끔히 삭제되고, 기존 유저 실제 기록 2개는 100% 온전히 보존되었는가?
  assert.strictEqual(mockState.profile.records.length, 2, '샘플만 삭제되고 실제 기록 2개만 남아야 함 (Zero Data Loss)');
  assert.strictEqual(mockState.profile.records[0].id, 'user_rec_1', '유저 기록 1 보존');
  assert.strictEqual(mockState.profile.records[1].id, 'user_rec_2', '유저 기록 2 보존');
  console.log('  ✓ 5-3. [🧹 샘플만 삭제] 자가 정화 안전망 및 유저 실제 데이터 100% 무손실 보존 확인');

  console.log('\n✨ [ALL PASS] 데이터 가져오기 & 1초 샘플 4위 1체 무결성 검증 완료!');
})();
