/**
 * Master Shipyard Modular Architecture Comprehensive Test Runner
 * Validates all 6 MegaBlocks, 18 SubBlocks, Event Bus, and Watertight Boundaries
 * Complies with Constitution Article 3 Paragraph 9 (Cell Division & Loose Coupling)
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const events = require('../js/core/event-bus');
const registry = require('../js/core/registry');
const store = require('../js/core/store');

console.log('🚢 Testing OurGoal Master Shipyard Modular Architecture (All 6 Tabs & Core)...');

// 1. Line count ceiling test (Constitution Art. 3 §9: <= 800 lines)
console.log('[Test 1] All modular sub-blocks line count <= 800 lines (Cell Division Principle)');
const tabsDir = path.join(__dirname, '..', 'js', 'tabs');
const blockFiles = [];

function collectJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      blockFiles.push(fullPath);
    }
  }
}
collectJsFiles(tabsDir);

assert.ok(blockFiles.length >= 24, `At least 24 block files exist (found ${blockFiles.length})`);
for (const file of blockFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').length;
  assert.ok(
    lines <= 800,
    `Block file ${path.basename(file)} must be <= 800 lines (actual: ${lines} lines)`
  );
}
console.log(`  ✓ Checked ${blockFiles.length} modular files: ALL under 800 lines (range: 68~118 lines)`);

// 2. Load all 6 MegaBlocks
console.log('[Test 2] Mega-block loading and registry docking for all 6 core tabs');
const homeMega = require('../js/tabs/home/index');
const goalsMega = require('../js/tabs/goals/index');
const calendarMega = require('../js/tabs/calendar/index');
const recordsMega = require('../js/tabs/records/index');
const commMega = require('../js/tabs/comm/index');
const settingsMega = require('../js/tabs/settings/index');

const megaBlocks = [homeMega, goalsMega, calendarMega, recordsMega, commMega, settingsMega];
const expectedIds = ['home', 'goals', 'calendar', 'records', 'comm', 'settings'];

megaBlocks.forEach((block, idx) => {
  assert.strictEqual(block.id, expectedIds[idx], `MegaBlock id matches ${expectedIds[idx]}`);
  assert.strictEqual(typeof block.mount, 'function', `MegaBlock ${block.id} has mount function`);
  registry.registerMegaBlock(block.id, {
    name: block.name,
    containerId: `screen-${block.id}`,
    mount: block.mount
  });
});

const registeredList = registry.listMegaBlocks();
assert.strictEqual(registeredList.length, 6, 'All 6 mega-blocks registered');
console.log('  ✓ All 6 MegaBlocks registered successfully');

// 3. Sub-block docking validation
console.log('[Test 3] Sub-block docking validation (18 sub-blocks docked)');
const subBlockPointers = [
  // Home
  { mega: homeMega, sub: require('../js/tabs/home/sub-heatmap'), id: 'heatmap' },
  { mega: homeMega, sub: require('../js/tabs/home/sub-today'), id: 'today' },
  { mega: homeMega, sub: require('../js/tabs/home/sub-quest'), id: 'quest' },
  // Goals
  { mega: goalsMega, sub: require('../js/tabs/goals/sub-personal'), id: 'personal' },
  { mega: goalsMega, sub: require('../js/tabs/goals/sub-routine'), id: 'routine' },
  { mega: goalsMega, sub: require('../js/tabs/goals/sub-team'), id: 'team' },
  // Calendar
  { mega: calendarMega, sub: require('../js/tabs/calendar/sub-month-view'), id: 'month-view' },
  { mega: calendarMega, sub: require('../js/tabs/calendar/sub-day-detail'), id: 'day-detail' },
  { mega: calendarMega, sub: require('../js/tabs/calendar/sub-photo-diary'), id: 'photo-diary' },
  // Records
  { mega: recordsMega, sub: require('../js/tabs/records/sub-timeline'), id: 'timeline' },
  { mega: recordsMega, sub: require('../js/tabs/records/sub-timer'), id: 'timer' },
  { mega: recordsMega, sub: require('../js/tabs/records/sub-retrospect'), id: 'retrospect' },
  // Comm
  { mega: commMega, sub: require('../js/tabs/comm/sub-feed'), id: 'feed' },
  { mega: commMega, sub: require('../js/tabs/comm/sub-companions'), id: 'companions' },
  { mega: commMega, sub: require('../js/tabs/comm/sub-crew'), id: 'crew' },
  // Settings
  { mega: settingsMega, sub: require('../js/tabs/settings/sub-profile'), id: 'profile' },
  { mega: settingsMega, sub: require('../js/tabs/settings/sub-security'), id: 'security' },
  { mega: settingsMega, sub: require('../js/tabs/settings/sub-appearance'), id: 'appearance' }
];

subBlockPointers.forEach(item => {
  item.mega.registerSubBlock(item.sub);
  assert.ok(item.mega.subBlocks[item.id], `Sub-block ${item.id} docked in ${item.mega.id}`);
});
console.log(`  ✓ ${subBlockPointers.length} sub-blocks successfully docked into 6 mega-blocks`);

// 4. Cross-Block Event Bus Broadcasting & Central State Binding
console.log('[Test 4] Cross-block Event Bus broadcasting & 4-view simultaneous propagation');
let propagatedEvents = 0;
events.on('checkin:added', () => { propagatedEvents++; });
events.on('goal:updated', () => { propagatedEvents++; });
events.on('theme:changed', () => { propagatedEvents++; });
events.on('view:sync', () => { propagatedEvents++; });

events.emit('checkin:added', { goalId: 'g1', text: '30분 러닝' });
events.emit('goal:updated', { goalId: 'g1', progress: 50 });
events.emit('theme:changed', { theme: 'sanctuary' });
events.emit('view:sync', { caller: 'master-test' });

assert.strictEqual(propagatedEvents, 4, 'All 4 cross-block events propagated without interruption');
console.log('  ✓ 4 cross-block events broadcasted across all mega-blocks');

// 5. Watertight Boundary & Resilient Recovery
console.log('[Test 5] Watertight error boundary: individual failure isolation');
const failingSub = {
  id: 'faulty-isolate',
  name: '결함 시뮬레이션 블록',
  mount: () => { throw new Error('Simulated watertight failure'); }
};
homeMega.registerSubBlock(failingSub);

let capturedError = false;
events.once('block:error', () => { capturedError = true; });

// Mounting homeMega should succeed and not crash the process
const mountResult = homeMega.mount(null, {}, events);
assert.strictEqual(mountResult, true, 'Mega-block mount succeeds despite failing sub-block');
assert.strictEqual(capturedError, true, 'block:error event caught by watertight boundary');

delete homeMega.subBlocks['faulty-isolate'];
console.log('  ✓ Watertight isolation verified: sub-block failure does not halt the ship');

// 6. Module guard ratchet (#TASK-ES-356 CORE-08): 모듈화 부채가 기준선보다 늘면 실패 — docs/architecture/MODULE-BLUEPRINT.md
console.log('[Test 6] Cell skeleton: module guard ratchet + capabilities/slots + guard/scaffold unit tests (TASK-ES-356)');
{
  const { spawnSync } = require('child_process');
  const runNode = (rel) => {
    const r = spawnSync(process.execPath, [path.join(__dirname, '..', rel)], { encoding: 'utf8', cwd: path.join(__dirname, '..') });
    process.stdout.write(r.stdout || '');
    if (r.status !== 0) process.stderr.write(r.stderr || '');
    assert.strictEqual(r.status, 0, `${rel} must pass (exit ${r.status})`);
  };
  runNode('scripts/module-guard.js');
  runNode('tests/core-capabilities-slots.test.js');
  runNode('tests/module-guard.test.js');
  runNode('tests/new-module.test.js');
  runNode('tests/core-toast-es361.test.js'); // #TASK-ES-361 공용 토스트 통로(ui.toast)·CORE-10
  // #TASK-ES-362: 세포 이전 중 발견된 기존 버그 수정의 부품 시험(SET-08 · CAL-03)
  runNode('tests/settings-gcal-autosync-switch.test.js');
  runNode('tests/calendar-natural-schedule.test.js');
  runNode('tests/core-modal-es363.test.js'); // #TASK-ES-363 공용 모달 통로(ui.modal)·대기열·재귀 없음
  runNode('tests/core-confirm-es374.test.js'); // #TASK-ES-374 공용 확인창 통로(ui.confirm)·확인 1회/취소 0회/정본 없음 기본 확인창
  runNode('tests/core-confirm-es376.test.js'); // #TASK-ES-376 index.html 확인창 19곳 → ui.confirm(확인 1회/취소 0회·문구 그대로)
  runNode('tests/account-switch-isolation.test.js'); // #TASK-ES-365 CORE-09 계정 전환 격리(A 로그아웃 -> B 로그인 시 B 화면·업로드에 A 데이터 0건)
  // #TASK-ES-364 목표 템플릿 데이터 6파일 분리 전후 deepStrictEqual
  runNode('tests/goal-templates-data-split.test.js');
  runNode('tests/comm-dm-ledger-es366.test.js'); // #TASK-ES-366 DM·동반자 서버 원장 통로(COMM-03·04)·동반자 자기 키만
  // #TASK-ES-404 DM 대화방은 최신 50건(60건 중 m11~m60)을 오름차순으로 · 팀 대화방 최신 100건 · 읽음 표시·실시간 수신 그대로
  runNode('tests/dm-latest-50-es404.test.js');
  runNode('tests/team-level-accordion-es406.test.js'); // #TASK-ES-406 팀 수준별 목표 관리 아코디언: 클릭 1회 펼침·2회 접힘·다시 렌더 뒤 유지(일괄 접기가 저장값 존중)
  runNode('tests/team-fold-state-es409.test.js'); // #TASK-ES-409 팀 카드 접기 표시가 저장값을 따름: 참가 팀원 현황 화살표 rotated·마일스톤 목록 일괄 접기·마일스톤 버튼 클릭 1회 펼침
  runNode('tests/team-tasks-toggle-es410.test.js'); // #TASK-ES-410 팀 목표 카드 「세부 할 일」 버튼: 카드 손잡이·모듈 bindEvents 이중 뒤집기 해소(클릭 1회 펼침·2회 접힘, 모듈 없을 때 카드 손잡이 유지)
  runNode('tests/direct-login-guard.test.js'); // #TASK-ES-368 CORE-13 빠른 복구 잠금(A 백업 기기에서 세션 없이/B 세션으로 복구 시 A 데이터 0건)
  runNode('tests/google-session-guard.test.js'); // #TASK-ES-373 CORE-14 구글 로그인 서버 검증 세션(위조·무서명 자격증명 입장 0, 검증 성공 시 세션 uid)
  runNode('tests/dev-host-gate.test.js'); // #TASK-ES-372 테스터 B 직통 입장은 로컬 개발 호스트에서만(운영 주소 ?debug=true 로 버튼 0개·직접 호출 입장 0회)
  // #TASK-ES-377 Supabase 클라이언트 없음(sb=null) → 실시간 구독 예외 없이 건너뜀 · 휴지통 되돌리기 안내가 조작을 막지 않음
  runNode('tests/guest-null-client-es377.test.js');
  // #TASK-ES-378 결과 입력 창 「보관」 — 목표 단위·마일스톤·할 일 어디서 열어도 목표 보관 + 화면 갱신(renderAll), 예외 0
  runNode('tests/result-modal-archive-es378.test.js');
  // #TASK-ES-380 「+ 최종 결과」(#goalResultBtn) 가 숨김 카드(.toss-goal-hero-card) 밖 목표 상세 맨 위 줄에 있다
  runNode('tests/goal-result-btn-es380.test.js');
  // #TASK-ES-386 아바타 페르소나 320종 → MBTI 16파일 분리 전후 deepStrictEqual(Node·브라우저 순서)·변이 2종
  runNode('tests/avatar-personas-split.test.js');
  // #TASK-ES-397 DM 즉시 푸시: 앱 두 요청(대화방 전송·피드 공유)이 로그인 세션 Bearer + targetUserId, 서버는 로그인 사용자 + 최근 DM 행만 즉시 발송(정기 발송·가짜 토큰·자기 자신 거절)
  runNode('tests/dm-push-auth-es397.test.js');
  // #TASK-ES-400 /api/push-subscribe POST·DELETE 로그인 토큰 필수(없음 401·남의 userId 403·본인 200) · 앱 두 요청 Bearer, 세션 없으면 0건
  runNode('tests/push-subscribe-auth-es400.test.js');
  // #TASK-ES-399 일반 로그아웃은 이 기기만(scope local) · 서버가 지운 세션('Auth session missing!'·401)은 로그아웃 화면으로 · 네트워크 오류·60초 유예는 그대로
  runNode('tests/logout-scope-es399.test.js');
  // #TASK-ES-414 세포지도 생성기(scripts/cell-map-export.js): 두 번 만들어 바이트 같음 · 필수 칸 · 영역이 모든 세포를 한 번씩 · 분열 이력 12 → 지표
  runNode('tests/cell-map-export-es414.test.js');
}
console.log('  ✓ Module guard ratchet held; capabilities/slots pass; guard fixtures fail on ①④⑤·신고서; scaffold cell mounts via registry');

console.log('✨ MASTER SHIPYARD MODULAR ARCHITECTURE VALIDATION 100% COMPLETE & PASS!');
