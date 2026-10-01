/**
 * Unit Tests for Calendar Mega-Block and Sub-Blocks (Shipyard Architecture Phase 5)
 */
const assert = require('assert');
const events = require('../js/core/event-bus');
const registry = require('../js/core/registry');
const store = require('../js/core/store');

const monthView = require('../js/tabs/calendar/sub-month-view');
const dayDetail = require('../js/tabs/calendar/sub-day-detail');
const photoDiary = require('../js/tabs/calendar/sub-photo-diary');
const calendarMega = require('../js/tabs/calendar/index');

console.log('🧪 Testing OurGoal Calendar Blocks (Shipyard Architecture Phase 5)...');

// 1. Sub-Block Basic Specs Test
console.log('[Test 1] Sub-blocks metadata and methods');
assert.strictEqual(monthView.id, 'month-view', 'MonthView sub-block id matches');
assert.strictEqual(typeof monthView.mount, 'function', 'MonthView has mount function');
assert.strictEqual(typeof monthView.render, 'function', 'MonthView has render function');

assert.strictEqual(dayDetail.id, 'day-detail', 'DayDetail sub-block id matches');
assert.strictEqual(typeof dayDetail.mount, 'function', 'DayDetail has mount function');

assert.strictEqual(photoDiary.id, 'photo-diary', 'PhotoDiary sub-block id matches');
assert.strictEqual(typeof photoDiary.mount, 'function', 'PhotoDiary has mount function');

// 2. Calendar MegaBlock Registration & Sub-block Docking Test
console.log('[Test 2] Calendar MegaBlock registration and sub-block docking');
global.OurgoalRegistry = registry;
global.OurgoalEvents = events;
global.OurgoalStore = store;
global.state = { profile: { goals: [], records: [], settings: {} }, calDate: '2026-10-02', calView: 'month' };

calendarMega.registerSubBlock(monthView);
calendarMega.registerSubBlock(dayDetail);
calendarMega.registerSubBlock(photoDiary);

assert.strictEqual(calendarMega.id, 'calendar', 'MegaBlock id matches');
assert.ok(calendarMega.subBlocks['month-view'], 'MonthView sub-block is docked');
assert.ok(calendarMega.subBlocks['day-detail'], 'DayDetail sub-block is docked');
assert.ok(calendarMega.subBlocks['photo-diary'], 'PhotoDiary sub-block is docked');

// 3. Mount Execution & Event Trigger Test
console.log('[Test 3] Mount execution and event emission');
let calendarMountedEvent = false;
events.once('calendar:mounted', () => {
  calendarMountedEvent = true;
});

const mountSuccess = calendarMega.mount(null, global.state, events);
assert.strictEqual(mountSuccess, true, 'MegaBlock mount returns true');
assert.strictEqual(calendarMountedEvent, true, 'calendar:mounted event was emitted');

// 4. Watertight Boundary Test in Sub-block Mount
console.log('[Test 4] Watertight error boundary on broken sub-block');
const brokenSubBlock = {
  id: 'broken-calendar-widget',
  name: '고장난 캘린더 소블록',
  mount: () => {
    throw new Error('Simulated calendar sub-block crash');
  }
};
calendarMega.registerSubBlock(brokenSubBlock);

let capturedErrorEvent = null;
events.once('block:error', (data) => {
  capturedErrorEvent = data;
});

// Mounting should NOT throw even with broken sub-block
const resilientMountResult = calendarMega.mount(null, global.state, events);
assert.strictEqual(resilientMountResult, true, 'Mount remains resilient despite broken sub-block');
assert.ok(capturedErrorEvent != null, 'block:error event received');
assert.strictEqual(capturedErrorEvent.subBlockId, 'broken-calendar-widget', 'Error subBlockId matches');

// Clean up broken sub-block
delete calendarMega.subBlocks['broken-calendar-widget'];

// 5. Event Bus view:sync & calendar:dateSelected Propagation Test
console.log('[Test 5] Event Bus calendar:dateSelected & view:sync triggers without error');
let errorOccurred = false;
try {
  events.emit('view:sync');
  events.emit('calendar:dateSelected');
  events.emit('photoDiary:uploaded');
} catch (e) {
  errorOccurred = true;
}
assert.strictEqual(errorOccurred, false, 'view:sync events propagated smoothly');

console.log('✨ ALL 5 Calendar Block Tests Passed Successfully!');
