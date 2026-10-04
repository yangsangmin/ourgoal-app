'use strict';
// 공용 토스트 통로 시험 (#TASK-ES-361 · 쪼개는 순서 2번 · 노션 CORE-10): js/core/toast.js (능력 ui.toast · ui.toast.bind)
// - CORE-10: team-invite-comm 이 init() 전에 토스트를 부르면 예전엔 자기 자신을 다시 불러(재귀) 오류가 try/catch 에 묻혀 토스트가 안 떴다.
//   지금은 정본(index.html 이 단 window.toast)을 1회 부른다.
// - 정본이 아직 없을 때(스크립트 로드 순서) 메시지를 대기열에 두었다가 정본이 붙는 순간 띄운다.
// - init 으로 넘겨받은 토스트(deps.toast)가 있으면 그것을 먼저 쓴다(시험·index.html 배선 호환).
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const caps = require(path.join(ROOT, 'js/core/capabilities.js'));
const T = require(path.join(ROOT, 'js/core/toast.js'));

let n = 0;
async function check(title, fn) {
  T.reset();
  delete globalThis.toast;
  await fn();
  n++;
  console.log('  ok · ' + title);
}

(async () => {
  console.log('[core/toast] 공용 토스트 통로 시험');

  await check('능력 등록: ui.toast(화면) · ui.toast.bind 를 core/toast 세포가 준다', () => {
    const d = caps.describe();
    const t = d.find(x => x.name === 'ui.toast');
    const b = d.find(x => x.name === 'ui.toast.bind');
    assert.ok(t && t.cell === 'core/toast' && t.sideEffect === 'screen', 'ui.toast 기술');
    assert.ok(b && b.cell === 'core/toast', 'ui.toast.bind 기술');
    assert.strictEqual(caps.request('ui.toast'), T.show);
    assert.strictEqual(caps.request('ui.toast.bind'), T.bind);
  });

  await check('CORE-10: team-invite-comm 이 init() 전에 토스트를 부르면 정본 토스트가 정확히 1회 뜬다(재귀 없음)', () => {
    const seen = [];
    globalThis.toast = (m) => { seen.push(m); }; // index.html 정본이 다는 window.toast 자리
    const C = require(path.join(ROOT, 'js/team-invite-comm.js'));
    C.handlePingSentAutoReply({}, 'g1'); // init 전 호출
    assert.deepStrictEqual(seen, ['💬 팀원들에게 응원 찌르기를 보냈어요! 팀원이 확인하면 1:1 대화로 이어집니다 🔥']);
    assert.strictEqual(T.pending(), 0, '대기열에 남은 것 없음');
  });

  await check('정본 준비 전 호출은 대기열에 두었다가 정본이 붙는 순간 1회 띄운다(메시지 손실 0)', () => {
    const C = require(path.join(ROOT, 'js/team-invite-comm.js'));
    C.handlePingSentAutoReply({}, 'g1'); // 정본 없음(globalThis.toast 없음) → 대기
    assert.strictEqual(T.pending(), 1, '대기열 1');
    const seen = [];
    T.attach((m) => { seen.push(m); });
    assert.strictEqual(seen.length, 1, '붙는 순간 1회 표시');
    assert.ok(seen[0].indexOf('응원 찌르기') >= 0);
    assert.strictEqual(T.pending(), 0);
  });

  await check('정본이 window.toast 로 나중에 생겨도(DOMContentLoaded 전 로드 순서) 다음 호출 때 밀린 것부터 차례대로 띄운다', async () => {
    T.show('첫째');
    const seen = [];
    globalThis.toast = (m) => { seen.push(m); };
    T.show('둘째');
    assert.deepStrictEqual(seen, ['첫째'], '밀린 것 먼저');
    await new Promise(r => setTimeout(r, 2600));
    assert.deepStrictEqual(seen, ['첫째', '둘째'], '다음 것은 표시 시간 뒤');
  });

  await check('init 으로 넘겨받은 토스트가 있으면 그것을 쓰고 정본은 부르지 않는다', () => {
    const main = [];
    const injected = [];
    globalThis.toast = (m) => { main.push(m); };
    const C = require(path.join(ROOT, 'js/team-invite-comm.js'));
    C.init({ toast: (m) => injected.push(m) });
    C.handlePingSentAutoReply({}, 'g1');
    assert.strictEqual(injected.length, 1);
    assert.strictEqual(main.length, 0);
    C.init({}); // 다음 시험을 위해 주입 해제
  });

  await check('bind: 주입 자리에 통로 자신이 들어와도 재귀하지 않는다 · 주입 토스트 오류는 삼키고 흐름을 막지 않는다', () => {
    const seen = [];
    globalThis.toast = (m) => { seen.push(m); };
    let self = null;
    self = T.bind(() => self);
    self('재귀 없음');
    assert.deepStrictEqual(seen, ['재귀 없음']);
    const boom = T.bind(() => () => { throw new Error('x'); });
    const origWarn = console.warn; console.warn = () => {};
    try { boom('오류'); } finally { console.warn = origWarn; }
  });

  await check('6곳(auth-safety·helpful-reason·reactions·team-invite-comm·team-linked-goals·team-visibility-levels)이 각자 만든 토스트 함수 없이 ui.toast.bind 를 부른다', () => {
    ['auth-safety', 'helpful-reason', 'reactions', 'team-invite-comm', 'team-linked-goals', 'team-visibility-levels'].forEach(f => {
      const src = fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8');
      assert.ok(!/\bfunction\s+(toast|showToast)\s*\(|\btoastFn\s*=\s*function\b/.test(src), f + ': 자체 토스트 함수 없음');
      assert.ok(src.includes("OurgoalCapabilities.request('ui.toast.bind')"), f + ': 공용 통로 사용');
    });
  });

  await check('index.html: 능력 등록부·공용 토스트 통로가 6개 파일보다 먼저 로드된다', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const caps0 = html.indexOf('<script src="js/core/capabilities.js"></script>');
    const toast0 = html.indexOf('<script src="js/core/toast.js"></script>');
    assert.ok(caps0 > 0 && toast0 > caps0, 'capabilities.js → toast.js 순서');
    ['js/reactions.js', 'js/helpful-reason.js', 'js/auth-safety.js', 'js/team-invite-comm.js', 'js/team-linked-goals.js', 'js/team-visibility-levels.js'].forEach(f => {
      const i = html.indexOf('src="' + f);
      assert.ok(i > toast0, f + ' 는 toast.js 뒤');
    });
  });

  console.log('[core/toast] ' + n + '건 통과');
})().catch(e => { console.error(e); process.exit(1); });
