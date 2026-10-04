'use strict';
// [#TASK-ES-348] COMM-01 — AI 판별은 이름 목록이 아니라 표식(is_ai·botBadge·시드 id 접두·오프라인 예시 id·비인증 id 의 isAiBot)으로 한다.
// 실행: node --test tests/comm-ai-identity-es348.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

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

const ROOT = path.join(__dirname, '..');
const UUID = '3f6c2a1e-8b4d-4c2a-9e1f-0a1b2c3d4e5f';

global.state = { profile: { id: 'aaaaaaaa-0000-4000-8000-000000000000', companions: [] } };
const C = require(path.join(ROOT, 'js', 'team-invite-comm.js'));

test('실명형 닉네임 민지(인증 UUID)는 AI 가 아니다 — 예전 이름 판별이 남긴 isAiBot:true 도 믿지 않는다', () => {
  assert.strictEqual(C.isKnownAiCompanion({ id: UUID, nickname: '민지' }), false);
  assert.strictEqual(C.isKnownAiCompanion({ id: UUID, nickname: '민지', isAiBot: true }), false);
  assert.strictEqual(C.isKnownAiCompanion({ id: UUID, nickname: '김민지' }), false);
  assert.strictEqual(C.isKnownAiCompanion({ id: UUID, nickname: '새벽러너_민지' }), false);
  assert.strictEqual(C.isKnownAiCompanion('민지'), false);
});

test('실제 표식이 있으면 AI 다', () => {
  assert.strictEqual(C.isKnownAiCompanion({ id: UUID, nickname: 'x', is_ai: true }), true);
  assert.strictEqual(C.isKnownAiCompanion({ id: 'mem_ws_1', nickname: '이지수 팀장' }), true);
  assert.strictEqual(C.isKnownAiCompanion({ id: 'user-minji-runner', nickname: '새벽러너_민지' }), true);
  assert.strictEqual(C.isKnownAiCompanion({ id: 'local-1', nickname: '새벽러너_민지' }), true);
  assert.strictEqual(C.isKnownAiCompanion({ id: 'local-1', nickname: 'x', isAiBot: true }), true);
  assert.strictEqual(C.isKnownAiCompanion('mn_health'), true);
});

test('민지(인증 UUID)는 DM 후보(getTeamMembersPool)에 남는다', () => {
  global.state.profile.companions = [{ id: UUID, nickname: '민지', name: '민지', isAiBot: true }];
  const pool = C.getTeamMembersPool();
  assert.ok(pool.some((p) => p.id === UUID));
});

test('KNOWN_AI_BOT_NAMES 에 실명형 이름이 없다(밑줄 핸들만)', () => {
  const src = readTeamCommBundle(ROOT);
  const m = src.match(/var KNOWN_AI_BOT_NAMES = \[([^\]]*)\]/);
  assert.ok(m);
  const names = m[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
  assert.ok(names.length > 0);
  for (const n of names) assert.ok(n.indexOf('_') !== -1, '실명형 항목: ' + n);
});

test('getPeerRunnersForCategory 에 고정 러너 명단·연속일수 하드코딩이 없다', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const start = html.indexOf('function getPeerRunnersForCategory(');
  const end = html.indexOf('function triggerFirstCheckinCelebrationModal(');
  const body = html.slice(start, end);
  for (const n of ['열정부엉이', '코딩마스터', '새벽독서러', '미라클모닝', '성실토끼', '루틴요정', '달리는치타', '철인도전']) assert.ok(body.indexOf(n) === -1, n);
  assert.ok(!/streak:\s*\d+/.test(body));
});
