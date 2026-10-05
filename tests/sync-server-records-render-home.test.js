'use strict';
// #TASK-ES-462: 관리자 복구·기록 동기화 syncServerRecords 가 서버 기록을 받아 바뀌었을 때, 홈 탭이면 실제 홈 렌더 함수(renderHome)를 부른다.
// 고치기 전에는 존재하지 않는 renderHomeScreen 을 불러 ReferenceError 가 catch 로 삼켜지고(false 반환) 홈이 갱신되지 않았다.
// 함수 본문을 index.html 에서 글자 그대로 꺼내 가짜 없이 돌릴 수 없는 서버 호출(fetch·토큰)만 바꿔 끼워 실행한다.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'));
const start = html.indexOf('async function syncServerRecords(forceRefresh){');
assert.ok(start >= 0, 'syncServerRecords 정의를 찾는다');
// 함수 끝: 여는 중괄호부터 짝을 센다(문자열 안 중괄호는 이 함수에 없다)
let depth = 0, end = -1;
for (let i = html.indexOf('{', start); i < html.length; i++) {
  const ch = html[i];
  if (ch === '{') depth++;
  else if (ch === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
assert.ok(end > start, 'syncServerRecords 끝을 찾는다');
const src = html.slice(start, end);

async function run(activeTab) {
  const calls = [];
  const warns = [];
  const store = {};
  const ctx = {
    state: { activeTab, profile: { id: 'u-1', username: 'u', displayName: 'U', goals: [], records: [], settings: {} } },
    getSupabaseAuthToken: async () => 'tok',
    fetch: async () => ({ ok: true, json: async () => ({ ok: true, targetUserId: 'u-1', goals: [{ id: 'g1', title: '서버 목표', milestones: [] }] }) }),
    localStorage: { setItem: (k, v) => { store[k] = v; }, getItem: (k) => store[k] || null, removeItem: (k) => { delete store[k]; } },
    renderHome: () => calls.push('renderHome'),
    renderRecordsScreen: () => calls.push('renderRecordsScreen'),
    renderCalendarScreen: () => calls.push('renderCalendarScreen'),
    renderSettingsScreen: () => calls.push('renderSettingsScreen'),
    console: { warn: (...a) => warns.push(a.map(String).join(' ')), log: () => {}, error: () => {} },
    JSON, Date, Math, Object, Array, String, Number, Promise, Set, Map,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  // 응답 주인 확인은 실제 모듈(js/account-isolation.js)을 그대로 불러 쓴다
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'account-isolation.js'), 'utf8'), ctx);
  assert.ok(ctx.OurgoalAccountIsolation && typeof ctx.OurgoalAccountIsolation.isResponseForUid === 'function', 'account-isolation 모듈 로드');
  vm.runInContext(src + '\nthis.__sync = syncServerRecords;', ctx);
  const updated = await ctx.__sync(true);
  return { updated, calls, warns, ctx };
}

(async () => {
  const home = await run('home');
  assert.deepStrictEqual(home.warns.filter(w => /syncServerRecords failed/.test(w)), [], '홈 탭 동기화가 예외 없이 끝난다: ' + home.warns.join(' | '));
  assert.strictEqual(home.updated, true, '서버에서 받은 기록·목표로 갱신됐다고 돌려준다');
  assert.deepStrictEqual(home.calls, ['renderHome'], '홈 탭이면 renderHome 을 한 번 부른다');
  assert.strictEqual(home.ctx.state.profile.goals.length, 1, '빈 목표에 서버 목표가 들어온다');

  const rec = await run('records');
  assert.deepStrictEqual(rec.calls, ['renderRecordsScreen'], '기록 탭 경로는 그대로');
  console.log('sync-server-records-render-home: OK');
})().catch(e => { console.error(e); process.exitCode = 1; });
