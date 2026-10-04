'use strict';
// 피드 공유 DM 푸시 꼬리표 시험 (#TASK-ES-396 · #701 빌더 발견)
// - 소통 피드 「공유」 모달(openFeedShareModal)에서 동반자에게 DM 으로 보내면 /api/push-dispatch 로 푸시 요청을 보낸다.
// - 대화방 id(getDmThreadId)는 이미 'dm_' 로 시작한다. 예전 꼬리표는 'dm_' + threadId 라 'dm_dm_…' 가 되었다.
// - DM 화면 전송(js/team-dm-room.js)은 꼬리표를 'dm-' + threadId 로 쓴다 — 같은 대화방의 알림이 같은 꼬리표로 묶이도록 형식을 맞춘다.
// - 앱 파일을 그대로 읽어(브라우저와 같은 순서) 가짜 모달·가짜 Supabase·가짜 fetch(요청 본문만 기록)로 버튼을 누르고 꼬리표를 잰다.
// 사용: node <이 시험 파일> [저장소 뿌리 경로] [결과 JSON 경로] — 기준 커밋 사본(git archive)을 넘기면 그 사본을 잰다.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const ME = '11111111-1111-4111-8111-111111111111';
const PEER = '00000000-0000-4000-8000-000000000002';

function loadApp() {
  const sent = [];
  const pushes = [];
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
  const win = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    state: { profile: { id: ME, displayName: '나', companions: [{ id: PEER, nickname: '상대' }] } },
    sb: { from: table },
    fetch: function (url, opts) { pushes.push({ url: url, body: JSON.parse(opts.body) }); return Promise.resolve({ ok: true }); },
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
  const files = listTeamCommParts(ROOT).map(function (f) { return 'js/' + path.basename(f); }).concat(['js/team-invite-comm.js']);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  win.OurgoalTeamInviteComm.init({ toast: function () {} });
  return { win, sent, pushes, buttons };
}

const results = [];
function check(name, fn) {
  return Promise.resolve().then(fn).then(function () { results.push({ name, ok: true }); }, function (e) { results.push({ name, ok: false, err: String(e && e.message || e) }); });
}
const noComments = function (s) { return s.split(/\r?\n/).filter(function (l) { return !/^\s*(\/\/|\/?\*)/.test(l); }).join('\n'); };

(async function () {
  const app = loadApp();
  const api = app.win.OurgoalTeamInviteComm;
  const threadId = api.getDmThreadId(ME, PEER);
  await check('DM 화면 전송(팀 합본)의 푸시 꼬리표 형식은 \'dm-\' + threadId 다', function () {
    const code = noComments(readTeamCommBundle(ROOT));
    assert.ok(code.includes("tag: 'dm-' + threadId"), 'DM 화면 전송 꼬리표 형식');
  });
  await check('피드 공유 → 동반자 DM 버튼을 누르면 푸시 요청이 1건 나간다', async function () {
    api.openFeedShareModal({ id: 'post_1', name: '작성자', goal: '아침 달리기', action: '5km' });
    assert.strictEqual(app.buttons.length, 1, '동반자 버튼 1개');
    await app.buttons[0].onclick();
    assert.strictEqual(app.pushes.length, 1, '푸시 요청 1건');
    assert.strictEqual(app.pushes[0].url, '/api/push-dispatch');
  });
  await check('피드 공유 DM 푸시 꼬리표 = \'dm-\' + 대화방 id (DM 화면 전송과 같은 형식)', function () {
    assert.strictEqual(app.pushes[0].body.tag, 'dm-' + threadId);
  });
  await check('피드 공유 DM 푸시 꼬리표에 접두가 겹치지 않는다(dm_dm_ 없음)', function () {
    assert.ok(String(app.pushes[0].body.tag).indexOf('dm_dm_') < 0, 'dm_dm_ 겹침 없음: ' + app.pushes[0].body.tag);
  });
  await check('대화방 id(team_pings.id)는 그대로 getDmThreadId 값이다', function () {
    const ping = app.sent.find(function (s) { return s.table === 'team_pings'; });
    assert.ok(ping, 'team_pings 행 전송');
    assert.strictEqual(ping.row.id, threadId);
  });
  const fail = results.filter(function (r) { return !r.ok; });
  for (const r of results) console.log((r.ok ? '  ok   ' : '  FAIL ') + r.name + (r.ok ? '' : ' — ' + r.err));
  console.log('feed-share-dm-push-tag: ' + (results.length - fail.length) + '/' + results.length + ' (root: ' + path.basename(ROOT) + ')');
  if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify({ test: 'feed-share-dm-push-tag-es396', root: path.basename(ROOT), total: results.length, passed: results.length - fail.length, failed: fail.length, results: results }, null, 1));
  process.exitCode = fail.length ? 1 : 0;
})();
