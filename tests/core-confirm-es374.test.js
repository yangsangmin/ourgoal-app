'use strict';
// 공용 확인창 통로 시험 (#TASK-ES-374 · 기본 확인창 → 앱 바텀시트 1단계): js/core/confirm.js (능력 ui.confirm · ui.confirm.bind)
// - 정본(index.html 이 단 window.openBottomSheetConfirm)이 있으면 그것으로 띄우고, 확인 → 동작 1회 · 취소 → 0회.
// - 정본이 없으면 브라우저 기본 확인창(window.confirm)으로 떨어진다(동작 손실 방지).
// - 문구는 호출부가 넘긴 그대로 본문으로 간다(정본이 innerHTML 로 넣으므로 글자 그대로 보이게 이스케이프만).
// - 한 번에 하나만 띄우고 겹친 요청은 차례를 기다린다. 통로가 만든 함수가 주입 자리에 와도 재귀하지 않는다.
// - 열린 정본 모달 안에서 띄우면 밑 모달 노드를 떼어 두었다가 확인창이 닫힌 뒤 같은 노드를 다시 붙이고 나서 결과를 돌려준다.
// - 실제 호출부(js/customize.js 홈 구성 되돌리기)를 그대로 돌려 확인 → 되돌림 1회, 취소 → 0회를 잰다.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// #TASK-ES-388 (팀 세포 쪼개기 2차 선행): 팀 코드가 js/team-invite-comm.js 에서 js/team-*.js 키트 부품(OurgoalTeamCommKit 에 함수를 담는 파일)으로 옮겨 가도
// 같은 단언이 같은 코드를 찾도록 '팀 합본' = js/team-invite-comm.js(원문 그대로, 맨 앞) + 키트 부품(이름순, 생성기 접두 T.·K. 를 떼고) 를 읽는다. 단언·기대값은 그대로다.
function listTeamCommParts(rootDir) {
  const dir = path.join(rootDir, 'js');
  return fs.readdirSync(dir).filter((n) => n.indexOf('team-') === 0 && n !== 'team-invite-comm.js' && n.endsWith('.js')).sort()
    .map((n) => path.join(dir, n)).filter((f) => fs.statSync(f).isFile() && fs.readFileSync(f, 'utf8').indexOf('OurgoalTeamCommKit') >= 0);
}
function readTeamCommBundle(rootDir) {
  const raw = fs.readFileSync(path.join(rootDir, 'js', 'team-invite-comm.js'), 'utf8');
  const parts = listTeamCommParts(rootDir);
  const src = [raw, ...parts.map((f) => fs.readFileSync(f, 'utf8').replace(/(^|[^A-Za-z0-9_$.])[TK]\.(?=[A-Za-z_$])/g, '$1'))].join('\n');
  // 합본 맨 앞은 원문 그대로다(원본에서 찾던 글자는 같은 자리에서 찾는다). 부품 파일이 없으면 합본 = 원문.
  assert.strictEqual(src.slice(0, raw.length), raw, '팀 합본 맨 앞 = js/team-invite-comm.js 원문');
  if (parts.length === 0) assert.strictEqual(src, raw, '팀 합본 = js/team-invite-comm.js (부품 파일이 없을 때)');
  return src;
}

// #TASK-ES-393 (통계 세포 쪼개기 1차 선행): 통계 코드가 js/universal-stats.js 에서 js/stats-*.js 키트 부품(OurgoalUniversalStatsKit 에 함수를 담는 파일)으로 옮겨 가도
// 같은 단언이 같은 코드를 찾도록 '통계 합본' = js/universal-stats.js(원문 그대로, 맨 앞) + 키트 부품(이름순, 생성기 접두 S.·K. 를 떼고) 를 읽는다. 단언·기대값은 그대로다.
function listStatsParts(rootDir) {
  const dir = path.join(rootDir, 'js');
  return fs.readdirSync(dir).filter((n) => n.indexOf('stats-') === 0 && n.endsWith('.js')).sort()
    .map((n) => path.join(dir, n)).filter((f) => fs.statSync(f).isFile() && fs.readFileSync(f, 'utf8').indexOf('OurgoalUniversalStatsKit') >= 0);
}
function readStatsBundle(rootDir) {
  const raw = fs.readFileSync(path.join(rootDir, 'js', 'universal-stats.js'), 'utf8');
  const parts = listStatsParts(rootDir);
  const src = [raw, ...parts.map((f) => fs.readFileSync(f, 'utf8').replace(/(^|[^A-Za-z0-9_$.])[SK]\.(?=[A-Za-z_$])/g, '$1'))].join('\n');
  // 합본 맨 앞은 원문 그대로다(원본에서 찾던 글자는 같은 자리에서 찾는다). 부품 파일이 없으면 합본 = 원문.
  assert.strictEqual(src.slice(0, raw.length), raw, '통계 합본 맨 앞 = js/universal-stats.js 원문');
  if (parts.length === 0) assert.strictEqual(src, raw, '통계 합본 = js/universal-stats.js (부품 파일이 없을 때)');
  return src;
}
// #TASK-ES-394 (시험 범위 공백, #708 후속): 아바타 코드가 js/avatar-system.js 에서 js/avatar/**/*.js(모달 섹션 js/avatar/modal/*·기능 카드 js/avatar/feature-cards.js 등)로 옮겨 가도
// 「confirm( 직접 호출 없음」 부재 단언이 옮긴 코드까지 보도록 '아바타 합본' 을 scripts/smoke-test.js 의 AVATAR_SRC 와 같은 범위·같은 접두 제거 방식으로 읽는다.
// 범위 = js/avatar-system.js + js/avatar/**/*.js + js/data/avatar-personas/*.js(이름순). 생성기 접두 AV.·MS. 를 떼고, OurgoalAppScope 를 읽는 파일만 L.·K. 도 뗀다. 단언·기대값은 그대로다.
function listJsTree(dir, recursive) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    const p = path.join(dir, e.name);
    if (e.isFile() && e.name.endsWith('.js')) out.push(p);
    else if (recursive && e.isDirectory()) out.push(...listJsTree(p, true));
  }
  return out;
}
function readAvatarFile(f) {
  let src = fs.readFileSync(f, 'utf8').replace(/(^|[^A-Za-z0-9_$.])(?:AV|MS)\.(?=[A-Za-z_$])/g, '$1');
  if (src.indexOf('OurgoalAppScope') >= 0) src = src.replace(/(^|[^A-Za-z0-9_$.])[LK]\.(?=[A-Za-z_$])/g, '$1');
  return src;
}
function readAvatarBundle(rootDir) {
  const single = path.join(rootDir, 'js', 'avatar-system.js');
  const parts = [...listJsTree(path.join(rootDir, 'js', 'avatar'), true), ...listJsTree(path.join(rootDir, 'js', 'data', 'avatar-personas'), false)];
  const src = [single, ...parts].map(readAvatarFile).join('\n');
  // 부품 파일이 없으면 합본 = js/avatar-system.js 한 파일 글자.
  if (parts.length === 0) assert.strictEqual(src, fs.readFileSync(single, 'utf8'), '아바타 합본 = js/avatar-system.js (부품 파일이 없을 때)');
  return src;
}
// #TASK-ES-403 (팀 세포 쪼개기 3차 선행): 팀 목표 코드가 js/team-visibility-levels.js · team-leader-check.js · team-linked-goals.js 에서 팀 목표 세포 키트(OurgoalTeamGoalsKit)의
// 원본별 칸에 함수를 담는 js/team-*.js 부품으로 옮겨 가도 부재 단언이 옮긴 코드도 계속 보도록 '팀 목표 합본' = 원본(원문 그대로, 맨 앞) + 그 칸의 부품(이름순, 생성기 접두 T.·K. 를 떼고) 를 읽는다. 단언·기대값은 그대로다.
const TEAM_GOALS_KIT_SLOTS = { 'team-visibility-levels.js': 'visibilityLevels', 'team-leader-check.js': 'leaderCheck', 'team-linked-goals.js': 'linkedGoals' };
function readTeamGoalsBundle(rootDir, name) {
  const dir = path.join(rootDir, 'js');
  const slot = TEAM_GOALS_KIT_SLOTS[name];
  const raw = fs.readFileSync(path.join(dir, name), 'utf8');
  const parts = fs.readdirSync(dir).filter((n) => n.indexOf('team-') === 0 && !TEAM_GOALS_KIT_SLOTS[n] && n.endsWith('.js')).sort().map((n) => path.join(dir, n))
    .filter((f) => { if (!fs.statSync(f).isFile()) return false; const t = fs.readFileSync(f, 'utf8'); return t.indexOf('OurgoalTeamGoalsKit') >= 0 && t.indexOf('KIT.' + slot + ' = ') >= 0; });
  const src = [raw, ...parts.map((f) => fs.readFileSync(f, 'utf8').replace(/(^|[^A-Za-z0-9_$.])[TK]\.(?=[A-Za-z_$])/g, '$1'))].join('\n');
  assert.strictEqual(src.slice(0, raw.length), raw, '팀 목표 합본 맨 앞 = js/' + name + ' 원문');
  if (parts.length === 0) assert.strictEqual(src, raw, '팀 목표 합본 = js/' + name + ' (부품 파일이 없을 때)');
  return src;
}
// #TASK-ES-408 (시간기록 세포 쪼개기 선행): 시간기록 코드가 js/time-tracker.js 에서 시간기록 세포 키트(OurgoalTimeTrackerKit)에 함수를 담는 js/time-tracker-*.js 부품으로 옮겨 가도
// 부재 단언이 옮긴 코드도 계속 보도록 '시간기록 합본' = js/time-tracker.js(원문 그대로, 맨 앞) + 부품(이름순, 생성기 접두 T.·K. 를 떼고) 를 읽는다. 단언·기대값은 그대로다.
function readTimeTrackerBundle(rootDir) {
  const dir = path.join(rootDir, 'js');
  const raw = fs.readFileSync(path.join(dir, 'time-tracker.js'), 'utf8');
  const parts = fs.readdirSync(dir).filter((n) => n.indexOf('time-tracker-') === 0 && n.endsWith('.js')).sort().map((n) => path.join(dir, n))
    .filter((f) => fs.statSync(f).isFile() && fs.readFileSync(f, 'utf8').indexOf('OurgoalTimeTrackerKit') >= 0);
  const src = [raw, ...parts.map((f) => fs.readFileSync(f, 'utf8').replace(/(^|[^A-Za-z0-9_$.])[TK]\.(?=[A-Za-z_$])/g, '$1'))].join('\n');
  assert.strictEqual(src.slice(0, raw.length), raw, '시간기록 합본 맨 앞 = js/time-tracker.js 원문');
  if (parts.length === 0) assert.strictEqual(src, raw, '시간기록 합본 = js/time-tracker.js (부품 파일이 없을 때)');
  return src;
}
const ROOT = path.join(__dirname, '..');
const caps = require(path.join(ROOT, 'js/core/capabilities.js'));
const C = require(path.join(ROOT, 'js/core/confirm.js'));

let n = 0;
function clean() {
  C.reset();
  delete globalThis.openBottomSheetConfirm;
  delete globalThis.confirm;
  delete globalThis.document;
  delete globalThis.openModal;
  delete globalThis.MutationObserver;
  delete globalThis.addEventListener;
  delete globalThis.removeEventListener;
}
async function check(title, fn) {
  clean();
  await fn();
  clean();
  n++;
  console.log('  ok · ' + title);
}
const tick = () => new Promise(r => setImmediate(r));

// 정본 openBottomSheetConfirm 흉내: 받은 인자를 적어 두고, 시험이 확인/취소를 누르게 한다.
function fakeSheetConfirm(log) {
  const calls = [];
  const fn = function (title, message, okText, cancelText, onOk, onCancel) {
    log.push(['sheet', title, message, okText, cancelText]);
    calls.push({ ok: onOk, cancel: onCancel });
  };
  fn.calls = calls;
  return fn;
}

// 아주 작은 가짜 DOM (노드 이동·classList·style 만)
function el(id) {
  const node = {
    id: id, parent: null, kids: [], style: {}, handlers: {},
    classList: {
      set: new Set(),
      add(c) { this.set.add(c); node._mut(); }, remove(c) { this.set.delete(c); node._mut(); }, contains(c) { return this.set.has(c); }
    },
    get firstChild() { return this.kids[0] || null; },
    appendChild(c) {
      if (c.isFragment) { while (c.kids.length) this.appendChild(c.kids[0]); return c; }
      if (c.parent) c.parent.removeChild(c);
      c.parent = this; this.kids.push(c); return c;
    },
    removeChild(c) { const i = this.kids.indexOf(c); if (i >= 0) this.kids.splice(i, 1); c.parent = null; return c; },
    _observers: [],
    _mut() { this._observers.forEach(o => o()); }
  };
  return node;
}
function fakeDom() {
  const overlay = el('modalOverlay');
  const sheet = el('modalSheet');
  const doc = {
    getElementById(id) { return id === 'modalOverlay' ? overlay : id === 'modalSheet' ? sheet : null; },
    createDocumentFragment() { const f = el('#frag'); f.isFragment = true; return f; }
  };
  return { overlay, sheet, doc };
}

(async () => {
  console.log('[core/confirm] 공용 확인창 통로 시험');

  await check('능력 등록: ui.confirm(화면) · ui.confirm.bind 를 core/confirm 세포가 준다', () => {
    const d = caps.describe();
    const a = d.find(x => x.name === 'ui.confirm');
    const b = d.find(x => x.name === 'ui.confirm.bind');
    assert.ok(a && a.cell === 'core/confirm' && a.sideEffect === 'screen', 'ui.confirm 기술');
    assert.ok(b && b.cell === 'core/confirm', 'ui.confirm.bind 기술');
    assert.strictEqual(caps.request('ui.confirm'), C.confirm);
    assert.strictEqual(caps.request('ui.confirm.bind'), C.bind);
  });

  await check('정본 있음 · 확인을 누르면 뒤따르는 동작이 1회 실행되고, 본문은 넘긴 문구 그대로다', async () => {
    const log = [];
    const sheetFn = fakeSheetConfirm(log);
    globalThis.openBottomSheetConfirm = sheetFn;
    let nativeCalls = 0;
    globalThis.confirm = function () { nativeCalls++; return true; };
    const ask = C.bind(() => null);
    let ran = 0;
    const handler = async function () { if (!(await ask('이 마일스톤을 삭제할까요?'))) return; ran++; };
    const p = handler();
    await tick();
    assert.strictEqual(ran, 0, '누르기 전에는 동작 0회');
    assert.deepStrictEqual(log, [['sheet', '', '이 마일스톤을 삭제할까요?', '', '']]);
    sheetFn.calls[0].ok();
    await p;
    assert.strictEqual(ran, 1, '확인 → 동작 1회');
    assert.strictEqual(nativeCalls, 0, '기본 확인창은 뜨지 않는다');
  });

  await check('정본 있음 · 취소를 누르면 동작 0회', async () => {
    const log = [];
    const sheetFn = fakeSheetConfirm(log);
    globalThis.openBottomSheetConfirm = sheetFn;
    const ask = C.bind(() => null);
    let ran = 0;
    const p = (async function () { if (!(await ask('해당 기록을 삭제하시겠습니까?'))) return; ran++; })();
    await tick();
    sheetFn.calls[0].cancel();
    await p;
    assert.strictEqual(ran, 0, '취소 → 동작 0회');
    assert.strictEqual(C.pending(), 0);
  });

  await check('정본 없음 · 브라우저 기본 확인창으로 떨어진다(같은 문구 1회, 결과 그대로)', async () => {
    const seen = [];
    globalThis.confirm = function (m) { seen.push(m); return seen.length === 1; };
    const ask = C.bind(() => null);
    let ran = 0;
    const h = async function (m) { if (!(await ask(m))) return; ran++; };
    await h('구글 캘린더 연동을 해제하시겠습니까?');
    await h('홈 구성을 처음 상태로 되돌릴까요?');
    assert.deepStrictEqual(seen, ['구글 캘린더 연동을 해제하시겠습니까?', '홈 구성을 처음 상태로 되돌릴까요?']);
    assert.strictEqual(ran, 1, '기본 확인창 확인 → 1회, 취소 → 0회');
  });

  await check('정본도 기본 확인창도 없으면 동작하지 않는다(false)', async () => {
    assert.strictEqual(await C.confirm('x'), false);
  });

  await check('문구에 꺾쇠·따옴표·줄바꿈이 있어도 글자 그대로 보이게 이스케이프만 하고 줄바꿈은 둔다', async () => {
    const log = [];
    const sheetFn = fakeSheetConfirm(log);
    globalThis.openBottomSheetConfirm = sheetFn;
    const p = C.confirm('정말 "<b>팀</b>" 조를 삭제할까요?\n(복구 불가)');
    sheetFn.calls[0].cancel();
    assert.strictEqual(await p, false);
    assert.strictEqual(log[0][2], '정말 &quot;&lt;b&gt;팀&lt;/b&gt;&quot; 조를 삭제할까요?\n(복구 불가)');
  });

  await check('겹친 요청은 대기열에서 차례를 기다린다 — 첫째가 닫힌 뒤에 둘째를 띄운다', async () => {
    const log = [];
    const sheetFn = fakeSheetConfirm(log);
    globalThis.openBottomSheetConfirm = sheetFn;
    const p1 = C.confirm('첫째');
    const p2 = C.confirm('둘째');
    assert.strictEqual(log.length, 1, '둘째는 아직 안 뜬다');
    assert.strictEqual(C.pending(), 2);
    sheetFn.calls[0].ok();
    assert.strictEqual(await p1, true);
    assert.strictEqual(log.length, 2);
    assert.strictEqual(log[1][2], '둘째');
    sheetFn.calls[1].cancel();
    assert.strictEqual(await p2, false);
    assert.strictEqual(C.pending(), 0);
  });

  await check('bind: 주입 확인 함수가 있으면 그것을 쓰고, 통로 자신이 주입돼도 재귀 없이 정본으로 1회 간다', async () => {
    const log = [];
    const sheetFn = fakeSheetConfirm(log);
    globalThis.openBottomSheetConfirm = sheetFn;
    const injected = [];
    const a = C.bind(() => function (m) { injected.push(m); return true; });
    assert.strictEqual(await a('주입'), true);
    assert.deepStrictEqual(injected, ['주입']);
    assert.strictEqual(log.length, 0);
    const self = C.bind(() => C.confirm);
    const p = self('재귀 없음');
    assert.strictEqual(log.length, 1);
    sheetFn.calls[0].ok();
    assert.strictEqual(await p, true);
    globalThis.openBottomSheetConfirm = C.confirm;
    globalThis.confirm = function () { return false; };
    assert.strictEqual(await C.confirm('정본 자리에 통로 자신'), false, '자기 자신을 정본으로 보지 않고 기본 확인창으로');
  });

  await check('열린 정본 모달 안에서 띄우면 밑 모달 노드를 떼었다가 닫힌 뒤 같은 노드를 다시 붙이고, 그 다음에 동작한다', async () => {
    const dom = fakeDom();
    globalThis.document = dom.doc;
    const under = el('kf1ResetBtn');
    under.handlers.click = 'live';
    dom.sheet.appendChild(under);
    dom.overlay.classList.add('active');
    let pop = null;
    globalThis.addEventListener = function (t, f) { if (t === 'popstate') pop = f; };
    globalThis.removeEventListener = function () {};
    const reopened = [];
    globalThis.openModal = function (html, onMount) { reopened.push(html); dom.overlay.classList.add('active'); onMount(dom.sheet); };
    const log = [];
    globalThis.openBottomSheetConfirm = function (t, m, ok, cancel, onOk, onCancel) {
      log.push(m);
      assert.strictEqual(dom.sheet.kids.length, 0, '확인창을 그리기 전 밑 모달 노드가 떼어져 있다');
      assert.strictEqual(dom.overlay.style.zIndex, '2147483000', '확인창이 떠 있는 동안 맨 위 층');
      dom.sheet.appendChild(el('btnSheetConfirmOk'));
      log.onOk = onOk;
    };
    let ran = 0;
    let sawUnder = null;
    const p = (async function () { if (!(await C.confirm('홈 구성을 처음 상태로 되돌릴까요?'))) return; ran++; sawUnder = dom.sheet.kids[0]; })();
    await tick();
    dom.overlay.classList.remove('active'); // 정본 closeModal
    log.onOk();
    await tick();
    assert.strictEqual(ran, 0, 'history.back 의 popstate 전에는 아직 동작하지 않는다');
    pop();
    await p;
    assert.strictEqual(ran, 1, '확인 → 동작 1회');
    assert.deepStrictEqual(reopened, [''], '밑 모달을 정본 openModal 로 1회 다시 연다');
    assert.strictEqual(sawUnder, under, '동작할 때 시트에는 원래 노드(이벤트 연결 그대로)가 붙어 있다');
    assert.strictEqual(under.handlers.click, 'live');
    assert.strictEqual(dom.overlay.style.zIndex, '', '층 높이는 원래대로');
  });

  await check('✕·바깥 탭·뒤로가기로 닫히면(onOk/onCancel 없음) 취소로 보고 동작 0회', async () => {
    const dom = fakeDom();
    globalThis.document = dom.doc;
    globalThis.MutationObserver = function (cb) {
      this.observe = function (node) { node._observers.push(cb); this.node = node; };
      this.disconnect = function () { if (this.node) this.node._observers = []; };
    };
    globalThis.openBottomSheetConfirm = function () { dom.overlay.classList.add('active'); };
    let ran = 0;
    const p = (async function () { if (!(await C.confirm('이 조언을 지울까요?'))) return; ran++; })();
    await tick();
    dom.overlay.classList.remove('active');
    await p;
    assert.strictEqual(ran, 0);
  });

  await check('정본이 그리지 못하면(#modalOverlay 가 안 열림) 기본 확인창으로 떨어진다', async () => {
    const dom = fakeDom();
    globalThis.document = dom.doc;
    globalThis.openBottomSheetConfirm = function () { throw new Error('그리기 실패'); };
    const seen = [];
    globalThis.confirm = function (m) { seen.push(m); return true; };
    const warn = console.warn; console.warn = function () {};
    try { assert.strictEqual(await C.confirm('아워골 피드에 게시할까요?'), true); } finally { console.warn = warn; }
    assert.deepStrictEqual(seen, ['아워골 피드에 게시할까요?']);
  });

  await check('실제 호출부 js/customize.js 홈 구성 되돌리기: 취소 → 되돌림 0회 · 확인 → 되돌림 1회', async () => {
    const K = require(path.join(ROOT, 'js/customize.js'));
    const log = [];
    const sheetFn = fakeSheetConfirm(log);
    globalThis.openBottomSheetConfirm = sheetFn;
    const settings = { homeLayout: { hidden: ['todayMissionCard'], version: 1 } };
    let saves = 0, closes = 0;
    const buttons = {};
    const sheet = { querySelectorAll() { return []; }, querySelector(sel) { return buttons[sel] || (buttons[sel] = {}); } };
    K.open({ state: { profile: { settings } }, saveProfile() { saves++; }, toast() {}, closeModal() { closes++; }, openModal(html, cb) { cb(sheet); } });
    const reset = buttons['#kf1ResetBtn'].onclick;
    assert.strictEqual(typeof reset, 'function');
    let p = reset();
    await tick();
    assert.strictEqual(log[0][2], '홈 구성을 처음 상태로 되돌릴까요?');
    sheetFn.calls[0].cancel();
    await p;
    assert.deepStrictEqual(settings.homeLayout.hidden, ['todayMissionCard'], '취소 → 그대로');
    assert.strictEqual(saves + closes, 0, '취소 → 저장·닫기 0회');
    p = reset();
    await tick();
    sheetFn.calls[1].ok();
    await p;
    assert.deepStrictEqual(settings.homeLayout.hidden, [], '확인 → 되돌림');
    assert.strictEqual(saves, 1, '확인 → 저장 1회');
    assert.strictEqual(closes, 1, '확인 → 닫기 1회');
  });

  await check('index.html 밖 9개 파일에 기본 확인창 직접 호출이 없고 모두 ui.confirm.bind 를 부른다', () => {
    const files = ['js/avatar-system.js', 'js/customize.js', 'js/reactions.js', 'js/tabs/settings/sub-integrations.js', 'js/team-invite-comm.js',
      'js/team-linked-goals.js', 'js/team-visibility-levels.js', 'js/time-tracker.js', 'js/universal-stats.js'];
    files.forEach(f => {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8').split(/\r?\n/).filter(l => !/^\s*(\/\/|\/?\*)/.test(l)).join('\n');
      const scan = f === 'js/team-invite-comm.js' ? readTeamCommBundle(ROOT).split(/\r?\n/).filter(l => !/^\s*(\/\/|\/?\*)/.test(l)).join('\n')
        : TEAM_GOALS_KIT_SLOTS[path.basename(f)] ? readTeamGoalsBundle(ROOT, path.basename(f)).split(/\r?\n/).filter(l => !/^\s*(\/\/|\/?\*)/.test(l)).join('\n')
        : f === 'js/time-tracker.js' ? readTimeTrackerBundle(ROOT).split(/\r?\n/).filter(l => !/^\s*(\/\/|\/?\*)/.test(l)).join('\n')
        : f === 'js/universal-stats.js' ? readStatsBundle(ROOT).split(/\r?\n/).filter(l => !/^\s*(\/\/|\/?\*)/.test(l)).join('\n')
        : f === 'js/avatar-system.js' ? readAvatarBundle(ROOT).split(/\r?\n/).filter(l => !/^\s*(\/\/|\/?\*)/.test(l)).join('\n') : src;
      assert.ok(!/(?:^|[^.\w$])confirm\(|\bwindow\.confirm\(/.test(scan), f + ': confirm( 직접 호출 없음');
      assert.ok(src.includes("OurgoalCapabilities.request('ui.confirm.bind')"), f + ': 공용 확인창 통로 사용');
    });
  });

  await check('index.html: 공용 확인창 통로가 공용 모달 통로 바로 다음, 호출부 파일보다 먼저 로드된다', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const modal0 = html.indexOf('<script src="js/core/modal.js"></script>');
    const conf0 = html.indexOf('<script src="js/core/confirm.js"></script>');
    assert.ok(modal0 > 0 && conf0 > modal0, 'modal.js → confirm.js 순서');
    ['js/tabs/settings/sub-integrations.js', 'js/reactions.js', '/js/customize.js', 'js/avatar-system.js', 'js/universal-stats.js'].forEach(f => {
      const i = html.indexOf('src="' + f);
      assert.ok(i > conf0, f + ' 는 confirm.js 뒤');
    });
  });

  console.log('[core/confirm] ' + n + '건 통과');
})().catch(e => { console.error(e); process.exitCode = 1; });
