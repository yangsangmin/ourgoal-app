/**
 * [REL-02] 문의·평가·신고 접수가 "원장에 실제로 저장됐을 때만" 성공으로 돌아오는지 부품 단위로 확인한다.
 * - 실제 서버·Supabase·Notion·Telegram 을 부르지 않는다(가짜 응답으로만 돈다).
 * - 이 시험은 '글자'가 아니라 api/track.js 의 handler 를 실제로 호출해 응답 코드와 본문을 본다.
 * 사용: node scripts/test-inquiry-receipt.js   (TRACK_PATH 로 다른 판의 track.js 를 지정해 전후 비교 가능)
 */
'use strict';
const assert = require('assert');
const path = require('path');
const Module = require('module');

const TRACK = process.env.TRACK_PATH
  ? path.resolve(process.env.TRACK_PATH)
  : path.join(__dirname, '..', 'api', 'track.js');

// --- 가짜 Supabase: insert 결과를 시험마다 바꾼다 ---
let sbPlan = { error: null, id: 7 };
const fakeSupabase = {
  createClient() {
    return {
      from() {
        return {
          insert() {
            return {
              select() {
                return {
                  single() {
                    return Promise.resolve(sbPlan.error
                      ? { data: null, error: { message: sbPlan.error } }
                      : { data: { id: sbPlan.id }, error: null });
                  }
                };
              }
            };
          }
        };
      }
    };
  }
};
const origLoad = Module._load;
Module._load = function (request) {
  if (request === '@supabase/supabase-js') return fakeSupabase;
  return origLoad.apply(this, arguments);
};

// --- 가짜 fetch: 주소별로 성공/실패를 정한다 ---
let netPlan = { notion: true, telegram: true };
globalThis.fetch = async function (url) {
  const u = String(url);
  if (u.indexOf('api.notion.com') !== -1) {
    return { ok: netPlan.notion, status: netPlan.notion ? 200 : 500, text: async () => 'fake', json: async () => ({}) };
  }
  if (u.indexOf('api.telegram.org') !== -1) {
    return { ok: netPlan.telegram, status: netPlan.telegram ? 200 : 500, text: async () => 'fake', json: async () => ({}) };
  }
  throw new Error('unexpected fetch: ' + u);
};

const handler = require(TRACK);

function fakeRes() {
  const r = { code: null, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.end = () => r;
  return r;
}

async function call({ supabase, notion, telegram, noSupabaseKey }) {
  sbPlan = supabase === 'fail' ? { error: 'boom', id: null } : { error: null, id: 42 };
  netPlan = { notion: !!notion, telegram: !!telegram };
  if (noSupabaseKey) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-key';
  process.env.NOTION_TOKEN = 'fake-notion';
  process.env.TELEGRAM_BOT_TOKEN = 'fake-telegram';
  const res = fakeRes();
  await handler({
    method: 'POST',
    url: '/api/inquiry',
    headers: { 'user-agent': 'test' },
    body: { action: 'inquiry', content: '시험 문의', inquiryType: 'other', userId: 'u1', userNickname: '시험' }
  }, res);
  return res;
}

const origWarn = console.warn;
console.warn = function () {}; // 의도한 실패 시험의 경고 소음을 줄인다

(async function main() {
  const cases = [];
  function t(name, fn) { cases.push({ name, fn }); }

  t('저장 원장(Supabase·Notion)이 모두 실패하면 접수 성공으로 알리지 않는다', async () => {
    const r = await call({ supabase: 'fail', notion: false, telegram: true });
    assert.notStrictEqual(r.code, 200, '저장이 전혀 안 됐는데 200 을 돌려줌');
    assert.strictEqual(r.body.ok, false);
  });

  t('Telegram 알림만 성공한 경우도 저장으로 세지 않는다', async () => {
    const r = await call({ supabase: 'fail', notion: false, telegram: true });
    assert.strictEqual(r.body.ok, false);
  });

  t('Supabase 키가 없고 Notion 도 실패하면 성공으로 알리지 않는다', async () => {
    const r = await call({ noSupabaseKey: true, notion: false, telegram: false });
    assert.strictEqual(r.body.ok, false);
  });

  t('Supabase 에 저장되면 접수 ID(영수증)를 돌려준다', async () => {
    const r = await call({ supabase: 'ok', notion: true, telegram: true });
    assert.strictEqual(r.code, 200);
    assert.strictEqual(r.body.ok, true);
    assert.ok(r.body.receipt, 'receipt 없음');
    assert.strictEqual(r.body.receipt.id, 42);
  });

  t('저장은 됐고 Notion·Telegram 알림만 실패하면 성공 + 알림 실패를 구분한다', async () => {
    const r = await call({ supabase: 'ok', notion: false, telegram: false });
    assert.strictEqual(r.code, 200);
    assert.strictEqual(r.body.ok, true);
    assert.strictEqual(r.body.receipt.id, 42);
    assert.strictEqual(r.body.notify.telegram, false);
  });

  t('Supabase 가 실패해도 Notion 원장에 저장됐으면 성공(영수증 ID 는 없음)', async () => {
    const r = await call({ supabase: 'fail', notion: true, telegram: false });
    assert.strictEqual(r.code, 200);
    assert.strictEqual(r.body.ok, true);
    assert.strictEqual(r.body.receipt.id, null);
    assert.strictEqual(r.body.receipt.stored.notion, true);
  });

  let failed = 0;
  for (const c of cases) {
    try { await c.fn(); console.log('  ✓ ' + c.name); }
    catch (e) { failed++; console.log('  ✗ ' + c.name + '\n      → ' + (e && e.message)); }
  }
  console.warn = origWarn;
  console.log('\n[test-inquiry-receipt] ' + (cases.length - failed) + '/' + cases.length + ' 통과 (대상: ' + path.relative(process.cwd(), TRACK) + ')');
  process.exit(failed ? 1 : 0);
})();
