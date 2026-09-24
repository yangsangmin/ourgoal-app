// tests/security-audit.test.js
// #TASK-ES-252: 사용자 계정 및 데이터 관리·보관 5계층 보안 방어선 전수 침투 및 검증 테스트 슈트

var assert = require('assert');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

// Helper to create mock req and res
function createMockReqRes(options) {
  options = options || {};
  var resData = {
    statusCode: 200,
    headers: {},
    body: null,
    ended: false
  };

  var req = {
    method: options.method || 'GET',
    url: options.url || '/',
    headers: options.headers || {},
    body: options.body || {},
    query: options.query || {}
  };

  var res = {
    status: function(code) {
      resData.statusCode = code;
      return res;
    },
    setHeader: function(key, val) {
      resData.headers[key.toLowerCase()] = val;
      return res;
    },
    json: function(data) {
      resData.body = data;
      resData.ended = true;
      return res;
    },
    send: function(data) {
      resData.body = data;
      resData.ended = true;
      return res;
    },
    end: function() {
      resData.ended = true;
      return res;
    },
    _getData: function() {
      return resData;
    }
  };

  return { req: req, res: res, resData: resData };
}

async function runSecurityTests() {
  // =========================================================================
  // Layer 1: api/track.js - IDOR & Unauthenticated Access Block
  // =========================================================================
  var trackHandler = require('../api/track');

  // Test 1: POST /api/track with sync_records WITHOUT token -> 401 Unauthorized
  {
    var mock = createMockReqRes({
      method: 'POST',
      body: { action: 'sync_records', userId: 'user-victim-123' },
      headers: { 'content-type': 'application/json' }
    });
    await trackHandler(mock.req, mock.res);
    assert.strictEqual(mock.resData.statusCode, 401, 'Unauthenticated sync_records must return 401');
    assert.strictEqual(mock.resData.body.ok, false);
  }

  // Test 2: POST /api/track with sync_companions WITHOUT token -> 401 Unauthorized
  {
    var mock = createMockReqRes({
      method: 'POST',
      body: { action: 'sync_companions', userId: 'user-victim-123' },
      headers: { 'content-type': 'application/json' }
    });
    await trackHandler(mock.req, mock.res);
    assert.strictEqual(mock.resData.statusCode, 401, 'Unauthenticated sync_companions must return 401');
  }

  // =========================================================================
  // Layer 2: api/push-subscribe.js - Calendar HMAC Verification
  // =========================================================================
  var pushSubHandler = require('../api/push-subscribe');
  var CALENDAR_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || 'ourgoal_calendar_sign_key_2026';

  // Test 3: GET /api/calendar with unsigned raw userId -> 403 Forbidden
  {
    var mock = createMockReqRes({
      method: 'GET',
      url: '/api/calendar?token=raw-user-uuid-1234',
      query: { token: 'raw-user-uuid-1234' }
    });
    await pushSubHandler(mock.req, mock.res);
    assert.strictEqual(mock.resData.statusCode, 403, 'Unsigned raw calendar token must be blocked with 403');
  }

  // Test 4: GET /api/calendar with forged HMAC token -> 403 Forbidden
  {
    var mock = createMockReqRes({
      method: 'GET',
      url: '/api/calendar?token=user-1234.forgedhmac123456',
      query: { token: 'user-1234.forgedhmac123456' }
    });
    await pushSubHandler(mock.req, mock.res);
    assert.strictEqual(mock.resData.statusCode, 403, 'Forged HMAC token must be blocked with 403');
  }

  // Test 5: GET /api/calendar with token=demo -> 200 OK with valid iCal
  {
    var mock = createMockReqRes({
      method: 'GET',
      url: '/api/calendar?token=demo',
      query: { token: 'demo' }
    });
    await pushSubHandler(mock.req, mock.res);
    assert.strictEqual(mock.resData.statusCode, 200, 'token=demo must return 200 OK');
    assert.ok(typeof mock.resData.body === 'string' && mock.resData.body.indexOf('BEGIN:VCALENDAR') !== -1, 'iCal structure required');
  }

  // Test 6: GET /api/calendar with legitimate HMAC signed token -> 200 OK with iCal
  {
    var testUid = 'user-legit-777';
    var testSig = crypto.createHmac('sha256', CALENDAR_SECRET).update(testUid).digest('hex').slice(0, 16);
    var validToken = testUid + '.' + testSig;
    var mock = createMockReqRes({
      method: 'GET',
      url: '/api/calendar?token=' + validToken,
      query: { token: validToken }
    });
    await pushSubHandler(mock.req, mock.res);
    assert.strictEqual(mock.resData.statusCode, 200, 'Valid HMAC token must return 200 OK');
    assert.ok(typeof mock.resData.body === 'string' && mock.resData.body.indexOf('BEGIN:VCALENDAR') !== -1);
  }

  // =========================================================================
  // Layer 3: api/push-dispatch.js - Fail-Closed Posture
  // =========================================================================
  var pushDispatchHandler = require('../api/push-dispatch');

  // Test 7: POST /api/push-dispatch without Authorization token -> 401 Unauthorized
  {
    var mock = createMockReqRes({
      method: 'POST',
      body: { targetUserId: 'victim-123', title: '스팸', body: '공격' }
    });
    await pushDispatchHandler(mock.req, mock.res);
    assert.strictEqual(mock.resData.statusCode, 401, 'Anonymous instant push must be blocked with 401');
  }

  // Test 8: CRON push dispatch without valid Bearer token -> 401 Unauthorized
  {
    var mock = createMockReqRes({
      method: 'POST',
      body: {}
    });
    await pushDispatchHandler(mock.req, mock.res);
    assert.strictEqual(mock.resData.statusCode, 401, 'Anonymous cron push dispatch must return 401');
  }

  // =========================================================================
  // Layer 4: api/vision-table.js - Open Proxy Abuse Block
  // =========================================================================
  var visionTableHandler = require('../api/vision-table');

  // Test 9: POST /api/vision-table with action=notion_push without apiKey -> 400 Bad Request
  {
    var mock = createMockReqRes({
      method: 'POST',
      body: { action: 'notion_push', title: '무단 페이지 생성' }
    });
    await visionTableHandler(mock.req, mock.res);
    assert.strictEqual(mock.resData.statusCode, 400, 'notion_push without apiKey must return 400');
  }

  // =========================================================================
  // Layer 5: index.html - Client Authentication Token Wiring
  // =========================================================================
  {
    var indexHtmlPath = path.join(__dirname, '..', 'index.html');
    var indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

    assert.ok(indexHtml.indexOf('getSupabaseAuthToken') !== -1, 'index.html must define getSupabaseAuthToken helper');
    assert.ok(indexHtml.indexOf('fetchSignedCalendarToken') !== -1, 'index.html must define fetchSignedCalendarToken');
    assert.ok(indexHtml.indexOf("'Authorization': 'Bearer ' + sToken") !== -1, 'sync_records must pass Authorization Bearer header');
  }
}

if (require.main === module) {
  runSecurityTests().catch(function(err) {
    throw err;
  });
}

module.exports = { runSecurityTests: runSecurityTests };
