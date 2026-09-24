// tests/gemini-gateway.test.js
// #TASK-ES-251: 제미나이 게이트웨이 복원력 및 내결함성 단위 테스트 슈트

var assert = require('assert');
var gateway = require('../api/_lib/gemini-gateway');

async function runTests() {
  // Test 1: JSON 자기치유 파서 검증
  var mdJson = '```json\n{"title": "마크다운 테스트", "count": 10}\n```';
  var p1 = gateway.repairAndParseJson(mdJson);
  assert.strictEqual(p1.title, '마크다운 테스트');
  assert.strictEqual(p1.count, 10);

  var commaJson = '{"title": "쉼표 테스트", "items": [1, 2, ], }';
  var p2 = gateway.repairAndParseJson(commaJson);
  assert.strictEqual(p2.title, '쉼표 테스트');
  assert.strictEqual(p2.items.length, 2);

  var truncatedJson = '{"title": "잘린 텍스트", "milestones": [{"name": "1단계"';
  var p3 = gateway.repairAndParseJson(truncatedJson);
  assert.strictEqual(p3.title, '잘린 텍스트');
  assert.strictEqual(p3.milestones[0].name, '1단계');

  // Test 2: Local Ontology 오프라인 폴백 검증
  var gGoal = gateway.LocalOntology.getGoalTemplate('매일 3km 러닝');
  assert.strictEqual(gGoal.topicMajor, 'health');
  assert.ok(Array.isArray(gGoal.milestones) && gGoal.milestones.length >= 3);

  var sGoal = gateway.LocalOntology.getGoalTemplate('토익 900점 완성');
  assert.strictEqual(sGoal.topicMajor, 'study');

  var fb = gateway.LocalOntology.getFeedback('5km 완주', '뿌듯함', '러닝');
  assert.ok(fb.cheer && fb.coach);

  var mission = gateway.LocalOntology.getMission('헬스장 가기');
  assert.ok(mission.length > 5);

  // Test 3: Circuit Breaker 상태 전이 검증
  gateway._resetStateForTests();
  assert.strictEqual(gateway.getCircuitStatus(), 'CLOSED');

  gateway.recordCircuitFailure();
  assert.strictEqual(gateway.getCircuitStatus(), 'CLOSED');
  gateway.recordCircuitFailure();
  assert.strictEqual(gateway.getCircuitStatus(), 'CLOSED');
  gateway.recordCircuitFailure(); // 3번째 실패
  assert.strictEqual(gateway.getCircuitStatus(), 'OPEN');

  var calledFallback = false;
  var fallbackResult = await gateway.callGeminiGateway({
    task: 'test',
    prompt: '임의 프롬프트',
    localFallback: function() {
      calledFallback = true;
      return { ok: true, fallback: true };
    }
  });

  assert.strictEqual(calledFallback, true);
  assert.strictEqual(fallbackResult.fallback, true);

  // Test 4: SHA-256 캐시 동작 검증
  gateway._resetStateForTests();
  var callCount = 0;

  await gateway.callGeminiGateway({
    task: 'cache-test',
    prompt: '동일한 프롬프트',
    cacheTtlMs: 5000,
    localFallback: function() {
      callCount++;
      return { val: 'first-call', count: callCount };
    }
  });

  // Test 5: Key Cooldown & Rate Limit 감지 검증
  gateway.markKeyRateLimited('test-api-key-1234567890');

  // Test 6: 주요 엔드포인트 핸들러 무장애 200 OK 검증 (외부 키 부재/오프라인 시 폴백 완벽 보장)
  function createMockRes() {
    var resObj = {
      statusCode: 0,
      jsonData: null,
      status: function(code) {
        resObj.statusCode = code;
        return resObj;
      },
      json: function(data) {
        resObj.jsonData = data;
        return resObj;
      }
    };
    return resObj;
  }

  // 6-1. api/feedback.js 핸들러 검증
  var feedbackHandler = require('../api/feedback');
  var fbRes = createMockRes();
  await feedbackHandler({
    method: 'POST',
    body: {
      goalTitle: '매일 러닝 5km',
      text: '오늘 5km 25분 만에 완주했습니다.',
      theme: 'workout'
    }
  }, fbRes);
  assert.strictEqual(fbRes.statusCode, 200);
  assert.ok(fbRes.jsonData.verdict && fbRes.jsonData.comment);

  // 6-2. api/todaymission.js 핸들러 검증
  var missionHandler = require('../api/todaymission');
  var misRes = createMockRes();
  await missionHandler({
    method: 'POST',
    body: {
      goalTitle: '토익 900점 달성',
      milestones: [{ title: '단어 50개 암기', status: 'todo' }]
    }
  }, misRes);
  assert.strictEqual(misRes.statusCode, 200);
  assert.ok(misRes.jsonData.mission && misRes.jsonData.mission.length > 5);

  // 6-3. api/goaltemplate.js 핸들러 검증
  var templateHandler = require('../api/goaltemplate');
  var tplRes = createMockRes();
  await templateHandler({
    method: 'POST',
    body: {
      description: '건강한 식습관 및 체중 5kg 감량'
    }
  }, tplRes);
  assert.strictEqual(tplRes.statusCode, 200);
  assert.ok(tplRes.jsonData.title && Array.isArray(tplRes.jsonData.milestones));

  // 6-4. api/goalstatus.js 핸들러 검증
  var statusHandler = require('../api/goalstatus');
  var stRes = createMockRes();
  await statusHandler({
    method: 'POST',
    body: {
      goalTitle: '코딩 공부',
      milestones: [{ title: '자바스크립트 완독', status: 'done' }]
    }
  }, stRes);
  assert.strictEqual(stRes.statusCode, 200);
  assert.ok(stRes.jsonData.summary && stRes.jsonData.summary.length > 10);
}

runTests().catch(function(err) {
  throw err;
});
