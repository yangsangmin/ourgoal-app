'use strict';
// 게스트 실시간 구독 null 가드 시험 (#TASK-ES-377)
// - index.html 인라인 스크립트에서 실시간 구독 함수 소스를 그대로 잘라 와, Supabase 클라이언트(sb)가 없을 때(null)와 있을 때를 돌린다.
//   sb 없음 → 예외 없이 건너뜀(채널 0개), sb 있음 → 예전처럼 채널 3개를 열고 subscribe 한다.
// - 휴지통 되돌리기 안내(#trashUndoToast): 막대는 누름을 통과시키고(pointer-events:none) 「실행 취소」 버튼만 누름을 받는다. 문구·6초는 그대로.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/\r\n/g, '\n');

let n = 0;
async function check(title, fn) {
  await fn();
  n++;
  console.log('  ok · ' + title);
}

// index.html 에서 `head` 로 시작하는 함수 소스를 괄호 짝을 맞춰 잘라 온다(문자열·주석 안 괄호는 건너뛴다).
function sliceFunction(head) {
  const start = HTML.indexOf(head);
  assert.ok(start >= 0, 'index.html 에 ' + head + ' 가 있다');
  assert.strictEqual(HTML.indexOf(head, start + 1), -1, head + ' 는 한 곳뿐이다');
  let i = HTML.indexOf('{', start), depth = 0, q = null;
  for (; i < HTML.length; i++) {
    const ch = HTML[i], nx = HTML[i + 1];
    if (q) { if (ch === '\\') { i++; continue; } if (ch === q) q = null; continue; }
    if (ch === '/' && nx === '/') { i = HTML.indexOf('\n', i); continue; }
    if (ch === '/' && nx === '*') { i = HTML.indexOf('*/', i) + 1; continue; }
    if (ch === '\'' || ch === '"' || ch === '`') { q = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return HTML.slice(start, i + 1); }
  }
  throw new Error('괄호 짝을 못 찾음: ' + head);
}

const SRC = [
  'function setupRealtimeChannelsOnce(){',
  'function setupUserSessionRealtime(){',
  'function setupTeamCommentsRealtime(){',
  'function setupFeedPostsRealtime(){',
  'async function ensureFeedPostsLoaded(){'
].map(sliceFunction).join('\n');

// 잘라 온 함수들을 sb·state 만 보이는 범위에서 만든다.
function build(sb, state) {
  const body = '"use strict";\nvar REALTIME_CHANNELS_SETUP = false; var USER_SESSION_CHANNEL = null; var FEED_POSTS_CACHE = null;\n' +
    'var TEAM_COMMENTS_CACHE = {};\n' + SRC +
    '\nreturn { setupRealtimeChannelsOnce: setupRealtimeChannelsOnce, ensureFeedPostsLoaded: ensureFeedPostsLoaded, feed: function(){ return FEED_POSTS_CACHE; } };';
  const noop = function () {};
  return new Function('sb', 'state', 'getDeviceId', 'performLogout', 'renderTeamGoalsScreen', 'renderCommFeed', 'getFeedComments', 'document', body)(
    sb, state, function () { return 'dev1'; }, noop, noop, noop, function () { return []; }, { getElementById: function () { return null; } });
}

function fakeClient() {
  const opened = [];
  const chan = name => {
    const c = { name: name, ons: 0, subscribed: false };
    c.on = function () { c.ons++; return c; };
    c.subscribe = function () { c.subscribed = true; return c; };
    opened.push(c);
    return c;
  };
  const from = function () {
    const q = { select: function () { return q; }, order: function () { return q; }, eq: function () { return q; }, limit: function () { return Promise.resolve({ data: [{ id: 'p1' }] }); } };
    return q;
  };
  return { channel: chan, removeChannel: function () {}, from: from, opened: opened };
}

(async function main() {
  console.log('게스트 실시간 구독 null 가드 (#TASK-ES-377)');

  await check('Supabase 클라이언트가 없으면(sb=null) 게스트 프로필로 실시간 구독을 불러도 예외가 나지 않는다', async () => {
    const api = build(null, { profile: { id: 'guest_abc1234', isGuest: true }, activeTab: 'home' });
    assert.doesNotThrow(function () { api.setupRealtimeChannelsOnce(); });
    assert.doesNotThrow(function () { api.setupRealtimeChannelsOnce(); });
  });

  await check('Supabase 클라이언트가 없으면 피드 불러오기도 예외 없이 빈 목록으로 끝난다', async () => {
    const api = build(null, { profile: { id: 'guest_abc1234' } });
    await api.ensureFeedPostsLoaded();
    assert.deepStrictEqual(api.feed(), []);
  });

  await check('channel 함수가 없는 불완전한 클라이언트여도 실시간 구독은 건너뛴다', async () => {
    const api = build({ from: function () {} }, { profile: { id: 'u1' } });
    assert.doesNotThrow(function () { api.setupRealtimeChannelsOnce(); });
  });

  await check('클라이언트가 있으면 예전처럼 팀 댓글·피드·사용자 세션 채널 3개를 열고 구독한다', async () => {
    const sb = fakeClient();
    const api = build(sb, { profile: { id: 'u1' }, activeTab: 'home' });
    api.setupRealtimeChannelsOnce();
    assert.deepStrictEqual(sb.opened.map(c => c.name), ['team_comments_channel', 'feed_posts_channel', 'user_session_u1']);
    assert.ok(sb.opened.every(c => c.subscribed && c.ons > 0), '세 채널 모두 on 배선 후 subscribe');
    api.setupRealtimeChannelsOnce();
    assert.strictEqual(sb.opened.length, 3, '두 번째 호출은 다시 열지 않는다');
    await api.ensureFeedPostsLoaded();
    assert.deepStrictEqual(api.feed(), [{ id: 'p1' }]);
  });

  await check('휴지통 되돌리기 안내: 막대는 누름을 통과시키고 「실행 취소」 버튼만 누름을 받으며, 문구와 6초는 그대로다', async () => {
    const src = sliceFunction('function toastWithTrashUndo(msg, trashId){');
    assert.ok(src.includes("z-index:99999;max-width:92vw;pointer-events:none;'"), '막대 pointer-events:none');
    assert.ok(src.includes('flex:0 0 auto;pointer-events:auto;">실행 취소</button>'), '버튼 pointer-events:auto, 글자 실행 취소');
    assert.ok(src.includes('}, 6000);'), '6초 뒤 사라짐');
    assert.ok(!/display\s*:\s*none/i.test(src), '숨김으로 처리하지 않음');
  });

  console.log('게스트 실시간 구독 null 가드: ' + n + '건 모두 통과');
})().catch(function (e) { console.error(e); process.exit(1); });
