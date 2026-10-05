'use strict';
/**
 * [TASK-ES-406] 팀 카드 「팀 수준별 목표 관리」 아코디언([data-tglevelaccordion]) 죽은 클릭 수정 부품 시험
 *  - 클릭 1회 → 저장값 foldLevelSection[gid] === false(펼침), 다시 그린 본문 display:block
 *  - 렌더 직후 일괄 접기(index.html collapseAllTeamGoalAccordions)가 그 펼침을 덮지 않음(화살표 rotated 유지)
 *  - 클릭 2회 → 접힘(저장값 true, display:none), 일괄 접기 뒤에도 접힘
 *  - 다시 렌더 + 일괄 접기 뒤에도 마지막 상태 유지
 *  - 일괄 접기가 의도된 다른 아코디언(조별 본문·마일스톤·댓글·details)은 그대로 접힘
 * 제품 코드(js/team-visibility-levels.js 와 index.html 의 collapseAllTeamGoalAccordions 원문)를 그대로 돌린다.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const mod = require(path.join(ROOT, 'js', 'team-visibility-levels.js'));
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let failures = 0;
function check(title, fn) {
  try { fn(); console.log('[ES-406] ok   ' + title); }
  catch (e) { failures++; console.log('[ES-406] FAIL ' + title + ' :: ' + (e && e.message)); }
}

// ---- 최소 가짜 DOM 요소 ----
function fakeEl(attrs, display) {
  const classes = new Set();
  const el = {
    attrs: Object.assign({}, attrs), style: { display: display }, parent: null, handlers: {},
    classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c), toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) },
    getAttribute: n => (n in el.attrs ? el.attrs[n] : null),
    get dataset() { const d = {}; Object.keys(el.attrs).forEach(k => { if (k.indexOf('data-') === 0) d[k.slice(5)] = el.attrs[k]; }); return d; },
    addEventListener: (t, f) => { el.handlers[t] = f; },
    closest: sel => { const m = /^\[([\w-]+)\]$/.exec(sel); for (let e = el; e; e = e.parent) { if (m && m[1] in e.attrs) return e; } return null; },
    querySelector: () => null,
  };
  return el;
}

// index.html 의 collapseAllTeamGoalAccordions 원문을 꺼내 가짜 document 위에서 돌린다
function loadCollapseAll(doc, win, state) {
  const fnSrc = require('./helpers/inline-bundle').cutFunctionWithExposure(indexHtml, '  function collapseAllTeamGoalAccordions() {', '  window.collapseAllTeamGoalAccordions = collapseAllTeamGoalAccordions;'); // #TASK-ES-519 원래 자리면 원문 그대로, 세포로 옮겨 가면 함수는 합본(세포)에서 괄호 짝으로 자르고 노출 줄은 index.html 원래 자리에서 찾아 잇는다(단언 그대로)
  const start = fnSrc.indexOf('  function collapseAllTeamGoalAccordions() {');
  const end = fnSrc.indexOf('  window.collapseAllTeamGoalAccordions = collapseAllTeamGoalAccordions;');
  assert.ok(start > 0 && end > start, 'index.html 에 collapseAllTeamGoalAccordions 원문이 있다');
  const src = fnSrc.slice(start, end);
  return new Function('document', 'window', 'state', 'console', src + '\nreturn collapseAllTeamGoalAccordions;')(doc, win, state, console);
}

const GID = 'team_alpha';
const group = { id: GID, name: '알파 러닝팀', icon: '🏃', teamGoals: [{ id: 'tg_1', title: '하프마라톤 완주', milestones: [] }] };
const state = { profile: { settings: {} }, teamGoalEditMode: false };
let renders = 0;
mod.init({
  getState: () => state, getProfile: () => state.profile, saveProfile: async () => {},
  triggerHaptic: () => {}, renderTeamGoalsScreen: () => { renders++; },
  MOCK_GROUPS: [group], getGroupLevelGoals: () => [], canManageTeamGoals: () => false,
});

// 화면 한 장: 렌더 HTML 에서 본문 display·화살표 rotated 를 읽어 가짜 요소로 세우고, 일괄 접기를 돌린다(renderTeamGoalsScreen 순서와 같다)
function renderScreen() {
  const html = mod.renderTeamCardContent(group, false, state);
  const bodyM = new RegExp('data-tglevelbody="' + GID + '" style="display:(\\w+);"').exec(html);
  const arrowM = /<span class="tg-accordion-arrow ([^"]*)">/.exec(html);
  assert.ok(bodyM && arrowM, '렌더 HTML 에 수준별 본문·화살표가 있다');
  const header = fakeEl({ 'data-tglevelaccordion': GID });
  const arrow = fakeEl({});
  arrow.parent = header;
  if (arrowM[1].indexOf('rotated') >= 0) arrow.classList.add('rotated');
  const body = fakeEl({ 'data-tglevelbody': GID }, bodyM[1]);
  const lgBody = fakeEl({ 'data-tglgbody': 'lg_1' }, 'block');
  const msList = fakeEl({ 'data-tgmslist': 'tg_1' }, '');
  const details = { open: true };
  const doc = {
    querySelectorAll: sel => {
      if (sel === '.tg-accordion-body, [data-tglevelbody]') return [body];
      if (sel === '.tg-lg-row-body, [data-tglgbody]') return [lgBody];
      if (sel === '.tg-accordion-arrow') return [arrow];
      if (sel === '.ms-list, [data-tgmslist]') return [msList];
      if (sel === '#teamGoalsView details') return [details];
      return [];
    },
  };
  const win = { OurgoalTeamVisibilityLevels: mod };
  loadCollapseAll(doc, win, state)();
  const view = { querySelectorAll: sel => (sel === '[data-tglevelaccordion]' ? [header] : []) };
  mod.bindEvents(view);
  return { header, body, arrow, lgBody, msList, details };
}

async function click(screen) {
  assert.strictEqual(typeof screen.header.handlers.click, 'function', '머리에 클릭 리스너가 걸려 있다');
  await screen.header.handlers.click({ target: screen.header });
}

(async () => {
  let s = renderScreen();
  check('처음: 저장값 없음 → 본문 접힘', () => {
    assert.strictEqual(s.body.style.display, 'none');
    assert.strictEqual(s.arrow.classList.contains('rotated'), false);
  });

  const before = renders;
  await click(s);
  check('클릭 1회: 저장값 false(펼침)·화면 다시 그림 요청', () => {
    assert.strictEqual(state.profile.settings.foldLevelSection[GID], false);
    assert.strictEqual(renders, before + 1);
  });
  s = renderScreen();
  check('클릭 1회 뒤 렌더 + 일괄 접기: 본문 펼침(display:block)·화살표 rotated 유지', () => {
    assert.strictEqual(s.body.style.display, 'block');
    assert.strictEqual(s.arrow.classList.contains('rotated'), true);
  });
  check('일괄 접기가 의도된 다른 아코디언은 그대로 접힘(조별 본문·마일스톤·details)', () => {
    assert.strictEqual(s.lgBody.style.display, 'none');
    assert.strictEqual(s.msList.style.display, 'none');
    assert.strictEqual(s.details.open, false);
  });

  s = renderScreen();
  check('다시 렌더 뒤에도 펼침 유지', () => { assert.strictEqual(s.body.style.display, 'block'); });

  await click(s);
  check('클릭 2회: 저장값 true(접힘)', () => { assert.strictEqual(state.profile.settings.foldLevelSection[GID], true); });
  s = renderScreen();
  check('클릭 2회 뒤 렌더 + 일괄 접기: 본문 접힘·화살표 rotated 없음', () => {
    assert.strictEqual(s.body.style.display, 'none');
    assert.strictEqual(s.arrow.classList.contains('rotated'), false);
  });
  s = renderScreen();
  check('다시 렌더 뒤에도 접힘 유지', () => { assert.strictEqual(s.body.style.display, 'none'); });

  await click(s);
  s = renderScreen();
  check('클릭 3회: 다시 펼침', () => {
    assert.strictEqual(state.profile.settings.foldLevelSection[GID], false);
    assert.strictEqual(s.body.style.display, 'block');
  });

  console.log('[ES-406] team-level-accordion: ' + (failures ? failures + ' failed' : 'all checks held'));
  process.exitCode = failures ? 1 : 0;
})().catch(e => { console.log('[ES-406] error ' + (e && e.stack || e)); process.exitCode = 1; });
