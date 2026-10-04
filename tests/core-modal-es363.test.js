'use strict';
// 공용 모달 통로 시험 (#TASK-ES-363 · 쪼개는 순서 2번 나머지): js/core/modal.js (능력 ui.modal · ui.modal.close · ui.modal.bind)
// - 정본(index.html 이 단 window.openModal / window.closeModal)이 있으면 그대로 넘긴다(모양·동작 불변).
// - 정본이 아직 없을 때(스크립트 로드 순서·init 전) 열기·닫기 요청을 대기열에 두었다가 정본이 생기는 순간 요청 순서대로 넘긴다.
// - init 으로 넘겨받은 openModal/closeModal 이 있으면 그것을 먼저 쓴다(시험·index.html 배선 호환).
// - 통로가 만든 함수가 주입 자리나 window 자리에 들어와도 자기 자신을 다시 부르지 않는다(재귀 없음).
const assert = require('assert');
const fs = require('fs');
const path = require('path');

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
const ROOT = path.join(__dirname, '..');
const caps = require(path.join(ROOT, 'js/core/capabilities.js'));
const M = require(path.join(ROOT, 'js/core/modal.js'));

let n = 0;
async function check(title, fn) {
  M.reset();
  delete globalThis.openModal;
  delete globalThis.closeModal;
  await fn();
  n++;
  console.log('  ok · ' + title);
}

function fakeCanon(log) {
  return {
    open: function (html, cb) { log.push(['open', html, typeof cb]); if (typeof cb === 'function') cb({ sheet: true }); },
    close: function () { log.push(['close', arguments.length]); }
  };
}

(async () => {
  console.log('[core/modal] 공용 모달 통로 시험');

  await check('능력 등록: ui.modal(화면) · ui.modal.close · ui.modal.bind 를 core/modal 세포가 준다', () => {
    const d = caps.describe();
    const o = d.find(x => x.name === 'ui.modal');
    const c = d.find(x => x.name === 'ui.modal.close');
    const b = d.find(x => x.name === 'ui.modal.bind');
    assert.ok(o && o.cell === 'core/modal' && o.sideEffect === 'screen', 'ui.modal 기술');
    assert.ok(c && c.cell === 'core/modal', 'ui.modal.close 기술');
    assert.ok(b && b.cell === 'core/modal', 'ui.modal.bind 기술');
    assert.strictEqual(caps.request('ui.modal'), M.open);
    assert.strictEqual(caps.request('ui.modal.close'), M.close);
    assert.strictEqual(caps.request('ui.modal.bind'), M.bind);
  });

  await check('정본이 있으면 열기·닫기를 정본에 그대로 1회씩 넘긴다(onMount 도 정본이 부른다)', () => {
    const log = [];
    const canon = fakeCanon(log);
    globalThis.openModal = canon.open;
    globalThis.closeModal = canon.close;
    let mounted = 0;
    M.open('<p>본문</p>', function () { mounted++; });
    M.close();
    assert.deepStrictEqual(log, [['open', '<p>본문</p>', 'function'], ['close', 0]]);
    assert.strictEqual(mounted, 1);
    assert.strictEqual(M.pending(), 0);
  });

  await check('대기열: 정본 준비 전 열기·닫기·열기 요청은 잃지 않고, 정본이 붙는 순간 요청 순서대로 넘긴다', () => {
    M.open('<p>첫째</p>');
    M.close();
    M.open('<p>둘째</p>', function () {});
    assert.strictEqual(M.pending(), 3, '대기열 3');
    const log = [];
    M.attach(fakeCanon(log));
    assert.deepStrictEqual(log, [['open', '<p>첫째</p>', 'undefined'], ['close', 0], ['open', '<p>둘째</p>', 'function']]);
    assert.strictEqual(M.pending(), 0, '대기열 비움');
  });

  await check('대기열: 정본이 window.openModal 로 나중에 생겨도(로드 순서) 다음 호출 때 밀린 것부터 넘긴다', () => {
    M.open('<p>밀린 것</p>');
    assert.strictEqual(M.pending(), 1);
    const log = [];
    const canon = fakeCanon(log);
    globalThis.openModal = canon.open;
    globalThis.closeModal = canon.close;
    M.open('<p>새 것</p>');
    assert.deepStrictEqual(log.map(x => x[1]), ['<p>밀린 것</p>', '<p>새 것</p>']);
    assert.strictEqual(M.pending(), 0);
  });

  await check('대기열: 아무것도 안 열린 채 정본 없이 닫기만 오면 쌓지 않는다(열린 모달이 없다)', () => {
    M.close();
    assert.strictEqual(M.pending(), 0);
  });

  await check('bind: 주입 openModal/closeModal 이 있으면 그것을 쓰고 정본은 부르지 않는다 · open 은 두 인자, close 는 인자 없이', () => {
    const main = [];
    const canon = fakeCanon(main);
    globalThis.openModal = canon.open;
    globalThis.closeModal = canon.close;
    const injected = [];
    const ctx = {
      openModal: function () { injected.push(['open', arguments.length]); },
      closeModal: function () { injected.push(['close', arguments.length]); }
    };
    const m = M.bind(() => ctx);
    m.open('<p>x</p>', function () {}, 'extra');
    m.close({ type: 'click' }); // 클릭 이벤트 객체가 정본 skipHistoryBack 자리로 새지 않는다
    assert.deepStrictEqual(injected, [['open', 2], ['close', 0]]);
    assert.strictEqual(main.length, 0);
  });

  await check('bind: 주입이 없으면 공용 통로(정본)로 · 주입 자리에 통로 자신이 들어와도 재귀하지 않는다', () => {
    const main = [];
    const canon = fakeCanon(main);
    globalThis.openModal = canon.open;
    globalThis.closeModal = canon.close;
    const ctx = {};
    const m = M.bind(() => ctx);
    ctx.openModal = m.open;   // 자기 자신
    ctx.closeModal = m.close;
    m.open('<p>재귀 없음</p>');
    m.close({ type: 'click' });
    assert.deepStrictEqual(main, [['open', '<p>재귀 없음</p>', 'undefined'], ['close', 0]]);
  });

  await check('재귀 없음: window.openModal 자리에 통로가 만든 함수가 있으면 정본으로 보지 않고 대기한다', () => {
    globalThis.openModal = M.open;
    globalThis.closeModal = M.close;
    M.open('<p>대기</p>');
    assert.strictEqual(M.pending(), 1, '자기 자신을 부르지 않고 대기열');
    const log = [];
    M.attach(fakeCanon(log));
    assert.deepStrictEqual(log.map(x => x[1]), ['<p>대기</p>']);
  });

  await check('team-linked-goals: init 전 DM 모달 열기는 정본(window.openModal)으로 가고, init 후에는 주입 openModal 로 간다', () => {
    const main = [];
    globalThis.openModal = (html) => { main.push(['open', html]); }; // onMount 은 DOM 이 필요해 부르지 않는다
    globalThis.closeModal = () => { main.push(['close']); };
    const TLG = require(path.join(ROOT, 'js/team-linked-goals.js')).OurgoalTeamLinkedGoals; // 브라우저 밖에선 module.exports 에 붙는다
    TLG.openTeamGoalMemberDmModal('g-x', 'tg-x', '민수', '🙂');
    assert.strictEqual(main.length, 1, '정본 1회');
    assert.ok(main[0][1].indexOf('민수님과의 1:1 대화') >= 0, 'DM 모달 본문');
    const injected = [];
    TLG.init({ openModal: (h) => injected.push(h), closeModal: () => injected.push('close') });
    TLG.openTeamGoalMemberDmModal('g-x', 'tg-x', '민수', '🙂');
    assert.strictEqual(injected.length, 1, '주입 1회');
    assert.strictEqual(main.length, 1, '정본은 그대로 1회');
    TLG.init({});
  });

  await check('4곳에 각자 만든 openModal 함수가 없다 — 진짜 통로 2곳은 ui.modal.bind 를 부르고, 자체 모달 2곳은 이름을 정정했다(외부 API 키 그대로)', () => {
    ['team-linked-goals', 'team-visibility-levels', 'theme-system', 'time-tracker'].forEach(f => {
      const src = TEAM_GOALS_KIT_SLOTS[f + '.js'] ? readTeamGoalsBundle(ROOT, f + '.js') : fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8');
      assert.ok(!/\bfunction\s+openModal\s*\(/.test(src), f + ': function openModal 없음');
    });
    ['team-linked-goals', 'team-visibility-levels'].forEach(f => {
      const src = fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8');
      assert.ok(src.includes("OurgoalCapabilities.request('ui.modal.bind')"), f + ': 공용 통로 사용');
      assert.ok(src.includes('var openModal = _modal.open, closeModal = _modal.close;'), f + ': 통로가 만든 함수 쌍');
    });
    const theme = require(path.join(ROOT, 'js/theme-system.js')).OurgoalThemeSystem;
    assert.strictEqual(typeof theme.initUI, 'undefined', 'theme-system: 열 수 없던 테마 선택 창(initUI)은 #TASK-ES-367 에서 제거');
    const tt = fs.readFileSync(path.join(ROOT, 'js/time-tracker.js'), 'utf8');
    assert.ok(tt.includes('open: openTrackerOverlay,') && tt.includes('close: closeTrackerOverlay,'), 'OurgoalTimeTracker.open/close 키 그대로');
  });

  await check('index.html: 공용 모달 통로가 공용 토스트 통로 다음, 두 팀 파일보다 먼저 로드된다', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const toast0 = html.indexOf('<script src="js/core/toast.js"></script>');
    const modal0 = html.indexOf('<script src="js/core/modal.js"></script>');
    assert.ok(toast0 > 0 && modal0 > toast0, 'toast.js → modal.js 순서');
    ['js/team-linked-goals.js', 'js/team-visibility-levels.js'].forEach(f => {
      const i = html.indexOf('src="' + f);
      assert.ok(i > modal0, f + ' 는 modal.js 뒤');
    });
  });

  console.log('[core/modal] ' + n + '건 통과');
})().catch(e => { console.error(e); process.exitCode = 1; });
