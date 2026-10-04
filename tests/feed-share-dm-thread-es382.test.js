'use strict';
// 피드 공유 DM 대화방 id 시험 (#TASK-ES-382 R · #697 빌더 발견)
// - 소통 피드 「공유」 모달(openFeedShareModal)에서 동반자에게 DM 으로 보내면, 그 메시지가 1:1 대화방 화면·읽음 표시와 같은 대화방 id 에 들어가야 한다.
// - 대화방 화면은 getDmThreadId(myId, peerId) = 'dm_' + 작은 id + '_' + 큰 id 로 읽는다. 예전 피드 공유는 'dm_' 없이 만들어 그 메시지가 대화방에서 빠졌다.
// - 앱 파일을 그대로 읽어(브라우저와 같은 순서) 가짜 모달·가짜 Supabase(보낸 행만 기록)로 버튼을 누르고, team_pings.id·team_ping_replies.ping_id 를 잰다.
// 사용: node <이 시험 파일> [저장소 뿌리 경로] [결과 JSON 경로] — 기준 커밋 사본(git archive)을 넘기면 그 사본을 잰다.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const ME = '11111111-1111-4111-8111-111111111111';
const PEER = '00000000-0000-4000-8000-000000000002';

function loadApp() {
  const sent = [];
  const buttons = [];
  const sheet = {
    querySelector: function () { return null; },
    querySelectorAll: function (sel) { return sel === '[data-sharecompdm]' ? buttons : []; }
  };
  const table = function (name) {
    return {
      upsert: function (row) { sent.push({ table: name, op: 'upsert', row: row }); return Promise.resolve({ error: null }); },
      insert: function (row) { sent.push({ table: name, op: 'insert', row: row }); return Promise.resolve({ error: null }); }
    };
  };
  const toasts = [];
  const win = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    state: { profile: { id: ME, displayName: '나', companions: [{ id: PEER, nickname: '상대' }] } },
    sb: { from: table },
    fetch: function () { return Promise.resolve({ ok: true }); },
    localStorage: { getItem: function () { return null; }, setItem: function () {} },
    openModal: function (html, onMount) {
      const m = /data-sharecompdm="([^"]+)"/.exec(html);
      if (m) buttons.push({ disabled: false, textContent: '', getAttribute: function () { return m[1]; } });
      onMount(sheet);
    },
    closeModal: function () {},
    setTimeout: setTimeout, Promise: Promise, Date: Date, Math: Math, JSON: JSON, String: String, Array: Array, Object: Object
  };
  win.window = win;
  const ctx = vm.createContext(win);
  const files = ['js/team-recruit.js', 'js/team-share.js', 'js/team-invite-comm.js'].filter(function (f) { return fs.existsSync(path.join(ROOT, f)); });
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  win.OurgoalTeamInviteComm.init({ toast: function (m) { toasts.push(m); } });
  return { win, sent, buttons, toasts };
}

const results = [];
function check(name, fn) {
  return Promise.resolve().then(fn).then(function () { results.push({ name, ok: true }); }, function (e) { results.push({ name, ok: false, err: String(e && e.message || e) }); });
}

(async function () {
  const app = loadApp();
  const api = app.win.OurgoalTeamInviteComm;
  await check('getDmThreadId 가 노출되어 있고 dm_ 형식이다', function () {
    assert.strictEqual(typeof api.getDmThreadId, 'function');
    assert.strictEqual(api.getDmThreadId(ME, PEER), 'dm_' + PEER + '_' + ME);
  });
  await check('피드 공유 모달에 동반자 DM 버튼이 그려진다', function () {
    api.openFeedShareModal({ id: 'post_1', name: '작성자', goal: '아침 달리기', action: '5km' });
    assert.strictEqual(app.buttons.length, 1, '동반자 버튼 1개');
  });
  await check('동반자 DM 전송 시 team_pings.id 가 대화방 id(getDmThreadId)와 같다', async function () {
    await app.buttons[0].onclick();
    const ping = app.sent.find(function (s) { return s.table === 'team_pings'; });
    assert.ok(ping, 'team_pings 행 전송');
    assert.strictEqual(ping.row.id, api.getDmThreadId(ME, PEER));
  });
  await check('team_ping_replies.ping_id 도 같은 대화방 id 다(대화방 화면·읽음 표시가 읽는 키)', function () {
    const rep = app.sent.find(function (s) { return s.table === 'team_ping_replies'; });
    assert.ok(rep, 'team_ping_replies 행 전송');
    assert.strictEqual(rep.row.ping_id, api.getDmThreadId(ME, PEER));
  });
  await check('전송 뒤 버튼·토스트 피드백은 그대로다', function () {
    assert.strictEqual(app.buttons[0].textContent, '✓ 전송됨');
    assert.ok(app.toasts.some(function (t) { return t.indexOf('피드 글을 공유했어요') >= 0; }), '토스트');
  });
  const fail = results.filter(function (r) { return !r.ok; });
  for (const r of results) console.log((r.ok ? '  ok   ' : '  FAIL ') + r.name + (r.ok ? '' : ' — ' + r.err));
  console.log('feed-share-dm-thread: ' + (results.length - fail.length) + '/' + results.length + ' (root: ' + path.basename(ROOT) + ')');
  if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify({ test: 'feed-share-dm-thread-es382', root: path.basename(ROOT), total: results.length, passed: results.length - fail.length, failed: fail.length, results: results }, null, 1));
  process.exitCode = fail.length ? 1 : 0;
})();
