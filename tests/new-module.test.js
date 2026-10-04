'use strict';
// 새 세포 스캐폴드 시험 (#TASK-ES-356 · 노션 CORE-08)
// node scripts/new-module.js records zz-scaffold-probe --provides records.zz-scaffold-probe --contributes record.type 로
// 실제 저장소에 빈 작은 세포·시험 뼈대·신고서 항목을 만들고,
// ① 만든 시험 뼈대가 통과한다(레지스트리 경유 마운트·구독 1개·능력 요청·자리 기여·dispose 흔적 0)
// ② 모듈 가드가 여전히 통과한다(새 세포는 window 대입·탭 간 참조·800줄 초과를 늘리지 않고, 신고서가 있다)
// ③ 신고서 항목을 지우면 가드가 "신고서 없는 세포"로 실패한다 ④ 이름 규칙·중복 생성·없는 탭은 거부한다
// — 를 본 뒤 생성물을 지우고 modules.json 을 원문 그대로 되돌린다.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const NEW_MODULE = path.join(ROOT, 'scripts', 'new-module.js');
const GUARD = path.join(ROOT, 'scripts', 'module-guard.js');
const SPEC = path.join(ROOT, 'docs', 'architecture', 'modules.json');
const TAB = 'records';
const NAME = 'zz-scaffold-probe';
const CELL_ID = TAB + '/sub-' + NAME;
const MOD = path.join(ROOT, 'js', 'tabs', TAB, 'sub-' + NAME + '.js');
const TEST = path.join(ROOT, 'tests', 'module-' + TAB + '-' + NAME + '.test.js');

function node(args) {
  return spawnSync(process.execPath, args, { encoding: 'utf8', cwd: ROOT });
}

const specOriginal = fs.readFileSync(SPEC, 'utf8');
function cleanup() {
  for (const f of [MOD, TEST]) if (fs.existsSync(f)) fs.unlinkSync(f);
  fs.writeFileSync(SPEC, specOriginal, 'utf8');
}

console.log('[new-module] 세포 스캐폴드 시험');
cleanup();
try {
  const gen = node([NEW_MODULE, TAB, NAME, '--provides', 'records.zz-scaffold-probe', '--contributes', 'record.type']);
  assert.strictEqual(gen.status, 0, gen.stdout + gen.stderr);
  assert.ok(fs.existsSync(MOD) && fs.existsSync(TEST), '세포·시험 파일 생성');
  assert.ok(/<script src="js\/tabs\/records\/sub-zz-scaffold-probe\.js"><\/script>/.test(gen.stdout), 'index.html 에 넣을 줄을 안내한다');
  const src = fs.readFileSync(MOD, 'utf8');
  for (const tag of ['@module records/sub-zz-scaffold-probe', '@kind tab (size small', 'var CELL = {', '"provides": [', '"contributes": [', '"owns": [', '"capabilities": [', 'var ABILITIES = {']) {
    assert.ok(src.includes(tag), '신고서·능력 기술: ' + tag);
  }
  for (const fn of ['mount: function', 'dispose: function', 'render: function', 'bindEvents: function', 'provideAbilities: function', 'contributeSlots: function']) {
    assert.ok(src.includes(fn), '인터페이스: ' + fn);
  }
  assert.ok(!/\bwindow\s*\.\s*\w+\s*=[^=]/.test(src), '만든 세포는 window 에 대입하지 않는다');
  const spec = JSON.parse(fs.readFileSync(SPEC, 'utf8'));
  const decl = spec.cells.find(c => c.id === CELL_ID);
  assert.ok(decl, '세포 신고서(modules.json)에 항목이 생긴다');
  assert.strictEqual(decl.kind, 'tab');
  assert.strictEqual(decl.size, 'small');
  assert.deepStrictEqual(decl.provides, ['records.zz-scaffold-probe']);
  assert.deepStrictEqual(decl.contributes, ['record.type']);
  assert.deepStrictEqual(decl.listens, ['view:sync']);
  assert.strictEqual(decl.capabilities[0].name, 'records.zz-scaffold-probe', '능력 기술(capabilities)이 신고서에 있다');
  console.log('  ok · 세포·시험 뼈대·신고서 생성(provides·contributes·capabilities 포함)');

  const t = node([TEST]);
  assert.strictEqual(t.status, 0, '만든 시험 뼈대 통과:\n' + t.stdout + t.stderr);
  console.log('  ok · 만든 빈 세포가 레지스트리 경유로 마운트되고 능력·자리·구독이 dispose 로 흔적 0');

  const g = node([GUARD]);
  assert.strictEqual(g.status, 0, '새 세포를 더해도 모듈 가드 통과:\n' + g.stdout + g.stderr);
  console.log('  ok · 신고서 있는 새 세포 — 모듈 가드 통과');

  const noDecl = JSON.parse(fs.readFileSync(SPEC, 'utf8'));
  noDecl.cells = noDecl.cells.filter(c => c.id !== CELL_ID);
  fs.writeFileSync(SPEC, JSON.stringify(noDecl, null, 2) + '\n', 'utf8');
  const g2 = node([GUARD]);
  assert.strictEqual(g2.status, 1, '신고서 없는 새 세포는 가드 실패');
  assert.ok(/신고서 없는 세포: js\/tabs\/records\/sub-zz-scaffold-probe\.js/.test(g2.stderr), g2.stderr);
  console.log('  ok · 신고서를 지우면 가드가 "신고서 없는 세포"로 실패');

  const dup = node([NEW_MODULE, TAB, NAME]);
  assert.strictEqual(dup.status, 1, '같은 이름 다시 만들기 거부');
  const bad = node([NEW_MODULE, TAB, 'Bad_Name']);
  assert.strictEqual(bad.status, 1, '이름 규칙(kebab-case) 위반 거부');
  const badCap = node([NEW_MODULE, TAB, 'zz-other', '--provides', 'NoDot']);
  assert.strictEqual(badCap.status, 1, '능력 이름 규칙 위반 거부');
  const badSlot = node([NEW_MODULE, TAB, 'zz-other', '--contributes', 'home.widget']);
  assert.strictEqual(badSlot.status, 1, '정식 목록 15곳 밖 자리 기여 거부');
  assert.ok(/정식 목록 15곳에 없다/.test(badSlot.stderr), badSlot.stderr);
  const noTab = node([NEW_MODULE, 'no-such-tab', 'x']);
  assert.strictEqual(noTab.status, 1, '큰 세포 없는 탭 거부');
  console.log('  ok · 중복·이름 규칙 위반·목록 밖 자리·없는 탭 거부');
} finally {
  cleanup();
}
assert.ok(!fs.existsSync(MOD) && !fs.existsSync(TEST), '생성물 삭제');
assert.strictEqual(fs.readFileSync(SPEC, 'utf8'), specOriginal, 'modules.json 원문 복원');
console.log('ok · new-module 시험 통과(생성물 삭제·신고서 원문 복원 확인)');
