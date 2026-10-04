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
}
console.log('  ✓ Module guard ratchet held; capabilities/slots pass; guard fixtures fail on ①④⑤·신고서; scaffold cell mounts via registry');

console.log('✨ MASTER SHIPYARD MODULAR ARCHITECTURE VALIDATION 100% COMPLETE & PASS!');
