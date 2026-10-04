'use strict';
// 결과 입력 창 「보관」(#rsJustArchive) 시험 (#TASK-ES-378)
// - js/tabs/goals/result-modal.js 를 그대로 불러, 앱 공용 통로(L)만 기록하는 가짜로 바꿔 끼우고 창을 연 뒤 버튼 처리기를 직접 돌린다.
// - 목표 단위(goal 인자 없음)에서 열어도, 마일스톤·할 일에서 열어도 「보관」을 누르면 목표가 보관(archivedAt)되고
//   저장(saveProfile) → 기존 토스트 → 창 닫기 → 화면 갱신(renderAll)이 예외 없이 이어진다.
// - 「저장 및 보관함으로 이동」도 목표 단위에서 실제로 목표를 보관한다(토스트가 말한 그대로).
const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');

let calls = [];
let mounted = null;
let openedHtml = '';

function makeEl(id) {
  const handlers = {};
  return {
    id: id, value: '', textContent: '', innerHTML: '', style: {},
    addEventListener: function (type, fn) { handlers[type] = fn; },
    click: function () { return handlers.click ? handlers.click({ preventDefault: function () {} }) : undefined; },
    fire: function (type) { return handlers[type] ? handlers[type]({ preventDefault: function () {} }) : undefined; }
  };
}

function makeSheet(html) {
  const ids = {};
  html.replace(/id="([^"]+)"/g, function (_, id) { ids[id] = makeEl(id); return _; });
  return {
    els: ids,
    querySelector: function (sel) { return sel.charAt(0) === '#' ? (ids[sel.slice(1)] || null) : null; }
  };
}

const L = {
  resultPct: function (r) { return r && r.pct != null ? r.pct : 0; },
  isoDate: function () { return '2026-10-05'; },
  nowISO: function () { return '2026-10-05T09:00:00.000Z'; },
  escapeHtml: function (s) { return String(s == null ? '' : s); },
  md: function (s) { return String(s == null ? '' : s); },
  openModal: function (html, onMount) {
    openedHtml = html;
    mounted = makeSheet(html);
    onMount(mounted);
  },
  closeModal: function () { calls.push('closeModal'); },
  saveProfile: async function () { calls.push('saveProfile'); },
  toast: function (msg) { calls.push('toast:' + msg); },
  renderAll: function () { calls.push('renderAll'); },
  renderLevelBadge: function () { calls.push('renderLevelBadge'); },
  triggerHaptic: function () {},
  burstConfetti: function () {},
  awardXP: function () { return null; },
  XP_RULES: { milestoneDone: 10 },
  levelForXP: function () { return 1; },
  showLevelUpBanner: function () {},
  celebrateMilestoneDone: function () { calls.push('celebrate'); },
  convertTextToNotionDbRecord: function (text) {
    return { title: text, status: '완료', progress: 100, metric: '100%', keyTakeaway: text, tags: ['실천'], date: '2026-10-05' };
  }
};

// 모듈은 window 가 있으면 window 를 전역으로 쓴다 — 같은 전역 하나로 맞춘다(innerWidth 는 저장 축하 효과가 읽는다).
global.window = global; global.innerWidth = 375; global.innerHeight = 800;
global.OurgoalAppScope = { scope: L };
const K = require(path.join(ROOT, 'js/tabs/goals/result-modal.js'));

let n = 0;
async function check(title, fn) {
  calls = []; mounted = null; openedHtml = '';
  await fn();
  n++;
  console.log('  ok · ' + title);
}

function savedResult() {
  return { target: 100, result: 100, unit: '%', pct: 100, note: '정리', summary: '정리', dbProperties: { title: '정리', status: '완료', progress: 100, metric: '100%', keyTakeaway: '정리', tags: ['실천'], date: '2026-10-05' } };
}

function newGoal() {
  return { id: 'g1', title: '시험 목표', milestones: [{ id: 'm1', title: '첫 마일스톤', status: 'todo', tasks: [{ id: 't1', title: '첫 할 일', done: false }] }] };
}

(async function main() {
  console.log('결과 입력 창 「보관」 시험 (#TASK-ES-378)');

  await check('목표 단위(goal 인자 없음)에서 연 창의 「보관」이 그 목표를 보관하고 저장·토스트·닫기·화면 갱신까지 이어진다', async function () {
    const goal = newGoal(); goal.result = savedResult();
    let onSavedRuns = 0;
    K.openResultModal('goal', goal, function () { onSavedRuns++; });
    const btn = mounted.querySelector('#rsJustArchive');
    assert.ok(btn, '결과가 있으면 「보관」 버튼이 그려진다');
    await btn.click();
    assert.strictEqual(goal.archivedAt, '2026-10-05T09:00:00.000Z', '목표에 보관 시각이 찍힌다');
    assert.deepStrictEqual(calls, ['saveProfile', 'toast:목표가 보관함으로 이동되었습니다 📦', 'closeModal', 'renderAll']);
    assert.strictEqual(onSavedRuns, 1, '부른 쪽 마무리(onSaved)도 한 번 돈다');
  });

  await check('마일스톤에서 연 창의 「보관」이 상위 목표를 보관하고 화면 갱신에서 예외가 나지 않는다', async function () {
    const goal = newGoal(); const ms = goal.milestones[0]; ms.result = savedResult();
    let onSavedRuns = 0;
    K.openResultModal('ms', ms, function () { onSavedRuns++; }, goal);
    await mounted.querySelector('#rsJustArchive').click();
    assert.strictEqual(goal.archivedAt, '2026-10-05T09:00:00.000Z');
    assert.strictEqual(ms.archivedAt, undefined, '마일스톤 자체가 아니라 목표가 보관된다');
    assert.deepStrictEqual(calls, ['saveProfile', 'toast:목표가 보관함으로 이동되었습니다 📦', 'closeModal', 'renderAll']);
    assert.strictEqual(onSavedRuns, 1);
  });

  await check('할 일에서 연 창의 「보관」도 상위 목표를 보관하고 화면을 갱신한다', async function () {
    const goal = newGoal(); const task = goal.milestones[0].tasks[0]; task.result = savedResult();
    K.openResultModal('task', task, function () {}, goal);
    await mounted.querySelector('#rsJustArchive').click();
    assert.strictEqual(goal.archivedAt, '2026-10-05T09:00:00.000Z');
    assert.strictEqual(calls[calls.length - 1], 'renderAll');
  });

  await check('결과가 아직 없으면 「보관」 버튼은 그려지지 않는다(기존 그대로)', async function () {
    const goal = newGoal();
    K.openResultModal('goal', goal, function () {});
    assert.strictEqual(mounted.querySelector('#rsJustArchive'), null);
    assert.ok(openedHtml.indexOf('rsSaveAndArchive') >= 0, '「저장 및 보관함으로 이동」은 그대로 있다');
  });

  await check('목표 단위에서 「저장 및 보관함으로 이동」을 누르면 결과가 저장되고 목표도 실제로 보관된다', async function () {
    const goal = newGoal();
    K.openResultModal('goal', goal, function () {});
    mounted.els.rsManualTitle.value = '목표 최종 정리';
    mounted.els.rsManualStatus.value = '완료';
    mounted.els.rsManualPct.value = '100';
    await mounted.querySelector('#rsSaveAndArchive').click();
    await new Promise(function (r) { setImmediate(r); });
    assert.strictEqual(goal.result.summary, '목표 최종 정리');
    assert.strictEqual(goal.archivedAt, '2026-10-05T09:00:00.000Z', '토스트가 말한 대로 목표가 보관된다');
    assert.ok(calls.indexOf('toast:결과 저장 및 보관함으로 이동 완료! 📦') >= 0);
  });

  console.log('결과 입력 창 「보관」 시험 ' + n + '건 통과');
})().catch(function (e) { console.error(e && e.stack || e); process.exitCode = 1; });
