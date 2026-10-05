'use strict';
/**
 * [TASK-ES-410] 팀 목표 카드 「세부 할 일」 버튼([data-tgtoggletasks]) 이중 손잡이 부품 시험
 *  A. 모듈(js/team-visibility-levels.js)이 있을 때: index.html 카드 손잡이 + 모듈 bindEvents 손잡이가 같은 버튼에 걸려도
 *     클릭 1회 → 상자 펼침·화살표 ▲, 클릭 2회 → 상자 접힘·화살표 ▼ (예전에는 두 손잡이가 한 번씩 뒤집어 1회 클릭이 무효)
 *  B. 모듈이 없을 때: index.html 카드 손잡이 혼자 예전처럼 뒤집는다(대체 경로 유지)
 * 제품 코드(js/team-visibility-levels.js · index.html 원문 조각)를 그대로 돌린다.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const levels = require(path.join(ROOT, 'js', 'team-visibility-levels.js'));
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let failures = 0;
function check(title, fn) {
  try { fn(); console.log('[ES-410] ok   ' + title); }
  catch (e) { failures++; console.log('[ES-410] FAIL ' + title + ' :: ' + (e && e.message)); }
}

const KEY = 'tg-ws-1:tgm-ws-1a';
function makeDom() {
  const arrow = { textContent: '▼' };
  const box = { style: { display: 'none' } };
  const btn = {
    handlers: [],
    dataset: { tgtoggletasks: KEY },
    addEventListener: (t, f) => { if (t === 'click') btn.handlers.push(f); },
    querySelector: sel => (sel === '.t-arrow' ? arrow : null),
  };
  const root = {
    querySelectorAll: sel => (sel === '[data-tgtoggletasks]' ? [btn] : []),
    querySelector: sel => (sel === '[data-tgtaskbox="' + KEY + '"]' ? box : null),
  };
  return { arrow, box, btn, root };
}
async function click(btn) { for (const h of btn.handlers) await h({ target: btn, stopPropagation() {} }); }

// index.html 카드 루프의 [data-tgtoggletasks] 손잡이 원문
function loadIndexTasksHandler() {
  const start = indexHtml.indexOf("        tgEl.querySelectorAll('[data-tgtoggletasks]').forEach(function(btn){");
  const end = indexHtml.indexOf("        tgEl.querySelectorAll('[data-tgtoggletask]').forEach(function(el){", start);
  assert.ok(start > 0 && end > start, 'index.html 에 카드의 [data-tgtoggletasks] 손잡이 원문이 있다');
  return new Function('tgEl', 'window', indexHtml.slice(start, end));
}

const state = { profile: { settings: {}, goals: [] }, teamGoalEditMode: false };
levels.init({ getState: () => state, getProfile: () => state.profile, saveProfile: async () => {}, triggerHaptic: () => {}, renderTeamGoalsScreen: () => {}, toast: () => {} });

(async () => {
  // A. 모듈 있음 — 두 손잡이가 같은 버튼에 걸린 실제 화면 배선 그대로(카드 손잡이 먼저, 모듈 bindEvents 다음)
  const a = makeDom();
  loadIndexTasksHandler()(a.root, { OurgoalTeamVisibilityLevels: levels });
  levels.bindEvents(a.root);
  check('A0 같은 버튼에 손잡이 2개가 걸림(카드 + 모듈)', () => { assert.strictEqual(a.btn.handlers.length, 2); });
  await click(a.btn);
  check('A1 클릭 1회: 세부 할 일 상자 펼침(display:block)·화살표 ▲', () => {
    assert.strictEqual(a.box.style.display, 'block');
    assert.strictEqual(a.arrow.textContent, '▲');
  });
  await click(a.btn);
  check('A2 클릭 2회: 상자 접힘(display:none)·화살표 ▼', () => {
    assert.strictEqual(a.box.style.display, 'none');
    assert.strictEqual(a.arrow.textContent, '▼');
  });

  // B. 모듈 없음 — 카드 손잡이 혼자 일한다
  const b = makeDom();
  loadIndexTasksHandler()(b.root, {});
  await click(b.btn);
  check('B1 모듈 없음 클릭 1회: 카드 손잡이가 상자 펼침·화살표 ▲', () => {
    assert.strictEqual(b.box.style.display, 'block');
    assert.strictEqual(b.arrow.textContent, '▲');
  });
  await click(b.btn);
  check('B2 모듈 없음 클릭 2회: 상자 접힘·화살표 ▼', () => {
    assert.strictEqual(b.box.style.display, 'none');
    assert.strictEqual(b.arrow.textContent, '▼');
  });

  console.log('[ES-410] team-tasks-toggle: ' + (failures ? failures + ' failed' : 'all checks held'));
  process.exitCode = failures ? 1 : 0;
})().catch(e => { console.log('[ES-410] error ' + (e && e.stack || e)); process.exitCode = 1; });
