/**
 * [#TASK-ES-362 SET-08] 설정 > 구글 캘린더 "목표·일정 변경 시 자동 동기화" 스위치 부품 시험
 *
 * 결함: renderIntegrationsSection(js/tabs/settings/sub-integrations.js) 안에서 구글 캘린더 스위치와 노션 자동 전송 스위치가
 * 같은 이름 var isAuto 를 써서 하나의 변수가 됐다. 그려질 때는 맞게 보이지만, 구글 캘린더 스위치를 누르면
 * 마지막에 대입된 노션 값으로 뒤집혀 저장됐다(노션 자동 전송이 꺼져 있으면 자동 동기화를 끌 수 없다).
 * 이 스위치는 구글 캘린더가 연동된 계정에서만 보여 게스트 화면 시나리오로는 누를 수 없다 — 그래서 부품 시험으로 잰다.
 */
'use strict';
const assert = require('assert');
const path = require('path');

console.log('[TEST] settings-gcal-autosync-switch.test.js: starting execution for TASK-ES-362...');

// 가짜 DOM: 이 섹션이 null 검사 없이 쓰는 칸과, 시험할 스위치만 만든다(나머지 id 는 없음 = null).
const els = {};
function el(id) {
  return els[id] || (els[id] = {
    id, className: '', style: {}, attrs: {}, value: '', textContent: '', innerHTML: '', onclick: null, onchange: null,
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return this.attrs[k]; },
    addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
  });
}
const PRESENT = ['gcalAutoSyncSwitch', 'notionAutoPushSwitch', 'notionSwitch', 'notionUrlBlock', 'notionTestBtn'];
global.document = { getElementById: id => (PRESENT.includes(id) ? el(id) : null) };
global.window = global;

let saves = 0;
let rerenders = 0;
global.OurgoalAppScope = { scope: {
  state: { profile: { settings: {} } },
  isGoogleCalendarConnected: () => true,
  gcalTokenStatus: () => 'valid',
  getTrashList: () => [],
  saveProfile: async () => { saves++; },
  toast: () => {},
} };
global.OurgoalSettingsKit = { renderSettingsScreen: () => { rerenders++; } };
require(path.join(__dirname, '..', 'js', 'core', 'ui-helpers.js'));
const Sub = require(path.join(__dirname, '..', 'js', 'tabs', 'settings', 'sub-integrations.js'));
assert.strictEqual(typeof Sub.render, 'function', '연동 섹션 렌더 함수가 있다');

async function run() {
  // 1. 자동 동기화 켜짐 · 노션 자동 전송 꺼짐(기본값) → 자동 동기화 스위치를 누르면 꺼져야 한다
  {
    const settings = { gcalAutoSync: true, notionAutoPush: false };
    Sub.render(settings);
    assert.ok(/\bon\b/.test(el('gcalAutoSyncSwitch').className), '그려질 때 자동 동기화 스위치는 켜짐');
    assert.strictEqual(el('gcalAutoSyncSwitch').attrs['aria-checked'], 'true', '자동 동기화 aria-checked=true');
    await el('gcalAutoSyncSwitch').onclick();
    assert.strictEqual(settings.gcalAutoSync, false, '켜진 자동 동기화 스위치를 누르면 꺼진다(노션 값으로 뒤집히지 않는다)');
    assert.strictEqual(settings.notionAutoPush, false, '노션 자동 전송 값은 그대로');
  }
  // 2. 자동 동기화 꺼짐 · 노션 자동 전송 켜짐 → 누르면 켜져야 한다
  {
    const settings = { gcalAutoSync: false, notionAutoPush: true };
    Sub.render(settings);
    assert.ok(!/\bon\b/.test(el('gcalAutoSyncSwitch').className), '그려질 때 자동 동기화 스위치는 꺼짐');
    await el('gcalAutoSyncSwitch').onclick();
    assert.strictEqual(settings.gcalAutoSync, true, '꺼진 자동 동기화 스위치를 누르면 켜진다');
    assert.strictEqual(settings.notionAutoPush, true, '노션 자동 전송 값은 그대로');
  }
  // 3. 두 값이 같을 때도 각각 자기 값만 뒤집는다(노션 자동 전송 스위치는 이전에도 맞게 동작 — 그대로인지 확인)
  {
    const settings = { gcalAutoSync: true, notionAutoPush: true };
    Sub.render(settings);
    await el('notionAutoPushSwitch').onclick();
    assert.strictEqual(settings.notionAutoPush, false, '노션 자동 전송 스위치를 누르면 노션 값만 꺼진다');
    assert.strictEqual(settings.gcalAutoSync, true, '자동 동기화 값은 그대로');
    Sub.render(settings);
    await el('gcalAutoSyncSwitch').onclick();
    assert.strictEqual(settings.gcalAutoSync, false, '다시 그린 뒤 자동 동기화 스위치를 누르면 자동 동기화만 꺼진다');
    assert.strictEqual(settings.notionAutoPush, false, '노션 자동 전송 값은 그대로');
  }
  assert.ok(saves >= 4 && rerenders >= 4, '누를 때마다 저장하고 설정 화면을 다시 그린다');
  console.log('[PASS] settings-gcal-autosync-switch.test.js: 3 cases');
}
run().catch(e => { console.error(e); process.exit(1); });
