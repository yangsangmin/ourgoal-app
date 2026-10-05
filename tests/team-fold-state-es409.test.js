'use strict';
/**
 * [TASK-ES-409] 팀 카드 접기 표시가 저장값을 따르는지 보는 부품 시험
 *  A. 「참가 팀원 달성 현황」([data-tgparttoggle]) — 일괄 접기(index.html collapseAllTeamGoalAccordions)는 목록을 접지 않으므로
 *     화살표 rotated 도 저장값(foldParticipants[tgid])을 따라야 한다(기본 펼침 → rotated 유지, 접힘 저장 → rotated 없음)
 *  B. 마일스톤 목록(.ms-list) — 사용자가 펼친 저장값(unfoldMsList[tgid] === true)이면 일괄 접기가 목록·버튼 글자를 덮지 않는다(저장값 없으면 기본 접힘 그대로)
 *  C. 「마일스톤 펼치기」 버튼 — index.html 카드 손잡이와 모듈 bindEvents 손잡이가 한 번씩 뒤집던 것을 한 번으로(클릭 1회 → 펼침·저장값 true)
 * 제품 코드(js/team-linked-goals.js · js/team-visibility-levels.js · index.html 원문 조각)를 그대로 돌린다.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const levels = require(path.join(ROOT, 'js', 'team-visibility-levels.js'));
const linkedExports = require(path.join(ROOT, 'js', 'team-linked-goals.js'));
const linked = linkedExports.OurgoalTeamLinkedGoals || global.OurgoalTeamLinkedGoals;
const indexHtml = require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));

let failures = 0;
function check(title, fn) {
  try { fn(); console.log('[ES-409] ok   ' + title); }
  catch (e) { failures++; console.log('[ES-409] FAIL ' + title + ' :: ' + (e && e.message)); }
}

// ---- 최소 가짜 DOM 요소 ----
function fakeEl(attrs, display, text) {
  const classes = new Set();
  const el = {
    attrs: Object.assign({}, attrs), style: { display: display }, parent: null, handlers: [], textContent: text || '',
    classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c), toggle: (c, on) => { const v = on === undefined ? !classes.has(c) : !!on; if (v) classes.add(c); else classes.delete(c); return v; } },
    getAttribute: n => (n in el.attrs ? el.attrs[n] : null),
    get dataset() { const d = {}; Object.keys(el.attrs).forEach(k => { if (k.indexOf('data-') === 0) d[k.slice(5).replace(/-(\w)/g, (m, c) => c.toUpperCase())] = el.attrs[k]; }); return d; },
    addEventListener: (t, f) => { if (t === 'click') el.handlers.push(f); },
    closest: sel => { const m = /^\[([\w-]+)\]$/.exec(sel); for (let e = el; e; e = e.parent) { if (m && m[1] in e.attrs) return e; } return null; },
    querySelector: () => null,
  };
  return el;
}
async function clickAll(el) { for (const h of el.handlers) await h({ target: el, stopPropagation() {} }); }

// index.html 의 collapseAllTeamGoalAccordions 원문을 꺼내 가짜 document 위에서 돌린다
function loadCollapseAll(doc, win, st) {
  const start = indexHtml.indexOf('  function collapseAllTeamGoalAccordions() {');
  const end = indexHtml.indexOf('  window.collapseAllTeamGoalAccordions = collapseAllTeamGoalAccordions;');
  assert.ok(start > 0 && end > start, 'index.html 에 collapseAllTeamGoalAccordions 원문이 있다');
  const src = indexHtml.slice(start, end);
  return new Function('document', 'window', 'state', 'console', src + '\nreturn collapseAllTeamGoalAccordions;')(doc, win, st, console);
}

const GID = 'team_alpha';
const TGID = 'tg_1';
const group = { id: GID, name: '알파 러닝팀', icon: '🏃', roster: [{ n: '김민우', c: 6 }, { n: '이서연', c: 4 }], teamGoals: [{ id: TGID, title: '하프마라톤 완주', milestones: [{ id: 'm1', title: '10km', done: false }] }] };
const state = { profile: { settings: {}, goals: [] }, teamGoalEditMode: false, groups: {} };
const ctx = {
  getState: () => state, getProfile: () => state.profile, saveProfile: async () => {},
  triggerHaptic: () => {}, renderTeamGoalsScreen: () => {}, toast: () => {},
  MOCK_GROUPS: [group], getMockGroups: () => [group], getGroupLevelGoals: () => [], canManageTeamGoals: () => false,
  groupState: () => ({}), getGroupState: () => ({}),
};
levels.init(ctx);
linked.init(ctx);
const win = { OurgoalTeamVisibilityLevels: levels, OurgoalTeamLinkedGoals: linked };

// ---- A. 참가 팀원 달성 현황 ----
function renderParticipants() {
  const html = linked.renderTeamGoalCardSections(group, group.teamGoals[0], false).participantsSectionHtml;
  const arrowM = /<span class="tg-accordion-arrow ([^"]*)"/.exec(html);
  const listM = new RegExp('data-tgpartlist="' + TGID + '" style="display:(\\w+);"').exec(html);
  assert.ok(arrowM && listM, '렌더 HTML 에 참가 팀원 화살표·목록이 있다');
  const header = fakeEl({ 'data-tgparttoggle': GID + ':' + TGID });
  const arrow = fakeEl({});
  arrow.parent = header;
  if (arrowM[1].indexOf('rotated') >= 0) arrow.classList.add('rotated');
  const list = fakeEl({ 'data-tgpartlist': TGID }, listM[1]);
  header.querySelector = sel => (sel === '.tg-accordion-arrow' ? arrow : null);
  const doc = { querySelectorAll: sel => (sel === '.tg-accordion-arrow' ? [arrow] : []) };
  loadCollapseAll(doc, win, state)();
  const view = {
    querySelectorAll: sel => (sel === '[data-tgparttoggle]' ? [header] : []),
    querySelector: sel => (sel === '[data-tgpartlist="' + TGID + '"]' ? list : null),
  };
  linked.bindTeamGoalEvents(view);
  return { header, arrow, list };
}

// ---- B. 마일스톤 목록 일괄 접기 ----
function collapseMilestones(listDisplay) {
  const msList = fakeEl({ 'data-tgmslist': TGID }, listDisplay);
  const foldBtn = fakeEl({ 'data-tgfoldlist': TGID }, '', '마일스톤 펼치기 ▼');
  const doc = {
    querySelectorAll: sel => {
      if (sel === '.ms-list, [data-tgmslist]') return [msList];
      if (sel === '.tg-fold-btn, [data-tgfoldlist]') return [foldBtn];
      return [];
    },
  };
  loadCollapseAll(doc, win, state)();
  return { msList, foldBtn };
}

// ---- C. 마일스톤 버튼에 걸린 두 손잡이(index.html 카드 손잡이 + 모듈 bindEvents) ----
function loadIndexFoldHandler() {
  const start = indexHtml.indexOf("        tgEl.querySelectorAll('[data-tgfoldlist]').forEach(function(btn){");
  const end = indexHtml.indexOf("        tgEl.querySelectorAll('[data-tgtoggletasks]').forEach(function(btn){", start);
  assert.ok(start > 0 && end > start, 'index.html 에 카드의 [data-tgfoldlist] 손잡이 원문이 있다');
  return new Function('tgEl', 'window', 'state', 'saveProfile', indexHtml.slice(start, end));
}

(async () => {
  // A
  let s = renderParticipants();
  check('A1 저장값 없음: 목록 펼침(display:flex)이고 일괄 접기 뒤에도 화살표 rotated 유지', () => {
    assert.strictEqual(s.list.style.display, 'flex');
    assert.strictEqual(s.arrow.classList.contains('rotated'), true);
  });
  check('A2 isParticipantsOpen: 저장값 없음 → 펼침', () => { assert.strictEqual(linked.isParticipantsOpen(TGID), true); });
  await clickAll(s.header);
  check('A3 머리 클릭 1회: 목록 접힘·화살표 rotated 없음·저장값 foldParticipants true', () => {
    assert.strictEqual(s.list.style.display, 'none');
    assert.strictEqual(s.arrow.classList.contains('rotated'), false);
    assert.strictEqual(state.profile.settings.foldParticipants[TGID], true);
  });
  s = renderParticipants();
  check('A4 접힘 저장 뒤 렌더 + 일괄 접기: 목록 접힘·화살표 rotated 없음', () => {
    assert.strictEqual(s.list.style.display, 'none');
    assert.strictEqual(s.arrow.classList.contains('rotated'), false);
  });
  await clickAll(s.header);
  s = renderParticipants();
  check('A5 다시 클릭 뒤 렌더 + 일괄 접기: 목록 펼침·화살표 rotated', () => {
    assert.strictEqual(state.profile.settings.foldParticipants[TGID], false);
    assert.strictEqual(s.list.style.display, 'flex');
    assert.strictEqual(s.arrow.classList.contains('rotated'), true);
  });

  // B
  state.profile.settings.unfoldMsList = {};
  let m = collapseMilestones('display-from-render');
  check('B1 저장값 없음: 일괄 접기가 마일스톤 목록을 접고 버튼은 「마일스톤 펼치기 ▼」(기본 접힘 그대로)', () => {
    assert.strictEqual(m.msList.style.display, 'none');
    assert.strictEqual(m.foldBtn.textContent, '마일스톤 펼치기 ▼');
  });
  state.profile.settings.unfoldMsList[TGID] = true;
  m = collapseMilestones('');
  check('B2 펼침 저장(unfoldMsList true): 일괄 접기 뒤에도 목록이 보이고 버튼은 「마일스톤 접기 ▲」', () => {
    assert.notStrictEqual(m.msList.style.display, 'none');
    assert.strictEqual(m.foldBtn.textContent, '마일스톤 접기 ▲');
  });
  check('B3 isMsListOpen: 펼침 저장 → 참', () => { assert.strictEqual(levels.isMsListOpen(TGID), true); });
  state.profile.settings.unfoldMsList[TGID] = false;
  m = collapseMilestones('');
  check('B4 접힘 저장(unfoldMsList false): 일괄 접기가 목록을 접음', () => { assert.strictEqual(m.msList.style.display, 'none'); });

  // C
  state.profile.settings.unfoldMsList = {};
  const list = fakeEl({ 'data-tgmslist': TGID }, 'none');
  const btn = fakeEl({ 'data-tgfoldlist': TGID }, '', '마일스톤 펼치기 ▼');
  const tgEl = { querySelectorAll: sel => (sel === '[data-tgfoldlist]' ? [btn] : []), querySelector: sel => (sel === '[data-tgmslist="' + TGID + '"]' ? list : null) };
  loadIndexFoldHandler()(tgEl, win, state, async () => {});
  levels.bindEvents({ querySelectorAll: sel => (sel === '[data-tgfoldlist]' ? [btn] : []), querySelector: sel => (sel === '[data-tgmslist="' + TGID + '"]' ? list : null) });
  await clickAll(btn);
  check('C1 「마일스톤 펼치기」 클릭 1회: 목록 펼침·버튼 「마일스톤 접기 ▲」·저장값 unfoldMsList true', () => {
    assert.strictEqual(list.style.display, 'block');
    assert.strictEqual(btn.textContent, '마일스톤 접기 ▲');
    assert.strictEqual(state.profile.settings.unfoldMsList[TGID], true);
  });
  await clickAll(btn);
  check('C2 클릭 2회: 목록 접힘·저장값 false', () => {
    assert.strictEqual(list.style.display, 'none');
    assert.strictEqual(state.profile.settings.unfoldMsList[TGID], false);
  });

  console.log('[ES-409] team-fold-state: ' + (failures ? failures + ' failed' : 'all checks held'));
  process.exitCode = failures ? 1 : 0;
})().catch(e => { console.log('[ES-409] error ' + (e && e.stack || e)); process.exitCode = 1; });
