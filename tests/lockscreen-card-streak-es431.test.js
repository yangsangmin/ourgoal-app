'use strict';
/**
 * [TASK-ES-431] 잠금화면용 9:16 일정 카드 그리기(generateLockScreenScheduleCardImage) 스트릭 줄 부품 시험
 *  예전: 카드 그리기가 정의되지 않은 이름 streakDays 를 읽어 ReferenceError → 저장 단추가 늘 오류 토스트로 끝남
 *  지금: streakDays = 앱 스트릭 계산 computeStreakDays()(app-scope 통로 L.computeStreakDays) 값
 *  A1 카드 그리기가 예외 없이 캔버스를 돌려준다
 *  A2 스트릭 줄 글자가 computeStreakDays() 값(7)으로 그려진다
 *  B1 computeStreakDays 가 통로에 없으면 0일로 그린다(예외 없음)
 * 제품 파일(js/tabs/calendar/lockscreen-image.js)을 그대로 불러 돌린다. 캔버스만 글자 기록용 가짜 문맥이다.
 */
const assert = require('assert');
const path = require('path');

const FILE = path.join(__dirname, '..', 'js', 'tabs', 'calendar', 'lockscreen-image.js');

let failures = 0;
async function check(title, fn) {
  try { await fn(); console.log('[ES-431] ok   ' + title); }
  catch (e) { failures++; console.log('[ES-431] FAIL ' + title + ' :: ' + (e && e.message)); }
}

function fakeCanvas(texts) {
  const grad = { addColorStop() {} };
  const ctx = new Proxy({}, {
    get(t, k) {
      if (k === 'fillText') return (s) => { texts.push(String(s)); };
      if (k === 'measureText') return (s) => ({ width: String(s).length * 20 });
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => grad;
      if (k in t) return t[k];
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
  });
  return { width: 0, height: 0, getContext: () => ctx };
}

// 제품 파일을 새로 불러온다(파일 머리에서 app-scope 통로 L 을 잡으므로 통로를 먼저 세운다)
function loadKit(scope, texts) {
  delete require.cache[require.resolve(FILE)];
  delete globalThis.OurgoalCalendarKit;
  globalThis.OurgoalAppScope = { scope };
  globalThis.document = { createElement: () => fakeCanvas(texts) };
  return require(FILE);
}

const profile = { avatar: '🦊', records: [], settings: {} };

(async () => {
  const textsA = [];
  const kitA = loadKit({ state: { theme: 'dark', profile }, computeStreakDays: () => 7 }, textsA);
  let canvasA = null;
  await check('A1 카드 그리기가 예외 없이 캔버스를 돌려준다', async () => {
    canvasA = await kitA.generateLockScreenScheduleCardImage([], [], { theme: 'dark' });
    assert.ok(canvasA && typeof canvasA.getContext === 'function');
  });
  await check('A2 스트릭 줄이 computeStreakDays() 값으로 그려진다', async () => {
    assert.ok(textsA.includes('🦊 연속 7일째 실천 중 🔥'), '그린 글자: ' + JSON.stringify(textsA.slice(0, 4)));
  });

  const textsB = [];
  const kitB = loadKit({ state: { theme: 'dark', profile } }, textsB);
  await check('B1 computeStreakDays 가 통로에 없으면 0일로 그린다', async () => {
    await kitB.generateLockScreenScheduleCardImage([], [], { theme: 'light' });
    assert.ok(textsB.includes('🦊 연속 0일째 실천 중 🔥'), '그린 글자: ' + JSON.stringify(textsB.slice(0, 4)));
  });

  console.log('[ES-431] lockscreen-card-streak: ' + (failures ? failures + ' failed' : 'all checks held'));
  process.exitCode = failures ? 1 : 0;
})().catch(e => { console.log('[ES-431] error ' + (e && e.stack || e)); process.exitCode = 1; });
