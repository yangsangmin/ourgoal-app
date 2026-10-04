'use strict';
// 모듈 가드 시험 (#TASK-ES-356 · 노션 CORE-08)
// 통과 1: 지금 저장소가 docs/architecture/module-baseline.json 기준선을 넘지 않는다.
// 실패 3: 임시 사본(fixture)에 ① 인라인 스크립트 줄 · ④ 800줄 초과 js · ⑤ 탭 간 직접 참조를 일부러 늘리면 가드가 실패한다.
// 덧붙여: 사유 없이 기준선을 올리는 갱신과, 사유 없이 손으로 올린 기준선 이력을 거부한다. 줄면 "낮출 수 있다"고 알린다.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const GUARD = path.join(ROOT, 'scripts', 'module-guard.js');
const guard = require(GUARD);

function runCli(args) {
  return spawnSync(process.execPath, [GUARD].concat(args), { encoding: 'utf8' });
}

function write(root, rel, text) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text, 'utf8');
}

// 작은 가짜 저장소: index.html(인라인 3줄) + 탭 alpha·beta + 평면 js 1개
function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ourgoal-module-guard-'));
  write(root, 'index.html', [
    '<!doctype html><html><body>',
    '<script src="js/tabs/alpha/index.js"></script>',
    '<script>',
    'function boot(){ return 1; }',
    'window.appBoot = boot;',
    'boot();',
    '</script>',
    '</body></html>',
    ''
  ].join('\n'));
  write(root, 'js/tabs/alpha/index.js', '(function(global){\n  var OurgoalAlphaMegaBlock = { id: "alpha" };\n  global.OurgoalAlphaMegaBlock = OurgoalAlphaMegaBlock;\n})(globalThis);\n');
  write(root, 'js/tabs/beta/index.js', '(function(global){\n  var OurgoalBetaMegaBlock = { id: "beta" };\n  global.OurgoalBetaMegaBlock = OurgoalBetaMegaBlock;\n})(globalThis);\n');
  write(root, 'js/flat.js', 'var x = 1;\n');
  const baseline = path.join(root, 'docs', 'architecture', 'module-baseline.json');
  const u = guard.update({ root, baseline, date: '2026-10-04' });
  assert.ok(u.ok, '기준선 생성: ' + u.message);
  return { root, baseline };
}

const results = [];
function check(title, fn) {
  fn();
  results.push(title);
  console.log('  ✓ ' + title);
}

console.log('[module-guard] 모듈 가드 시험');

// 통과 1 — 실제 저장소
check('통과: 지금 저장소는 기준선을 넘지 않는다(npm test 경로와 같은 CLI)', () => {
  const r = runCli([]);
  assert.strictEqual(r.status, 0, '가드가 통과해야 한다:\n' + r.stdout + r.stderr);
  assert.ok(/모듈 가드 통과/.test(r.stdout));
});

// 실패 ① — 인라인 스크립트 줄이 늘면
check('실패 ①: index.html 인라인 스크립트 줄이 늘면 실패한다', () => {
  const fx = makeFixture();
  try {
    assert.strictEqual(guard.run({ root: fx.root, baseline: fx.baseline, noSpecs: true }).ok, true, '고치기 전에는 통과');
    const html = fs.readFileSync(path.join(fx.root, 'index.html'), 'utf8').replace('boot();', 'boot();\nvar added = 2;\nvar more = 3;');
    write(fx.root, 'index.html', html);
    const r = guard.run({ root: fx.root, baseline: fx.baseline, noSpecs: true });
    assert.strictEqual(r.ok, false);
    assert.ok(r.failures.some(f => f.startsWith('① index.html 인라인 스크립트 줄 수')), r.failures.join('\n'));
    const cli = runCli(['--root', fx.root, '--baseline', fx.baseline, '--no-specs']);
    assert.strictEqual(cli.status, 1, 'CLI 종료 코드 1');
  } finally {
    fs.rmSync(fx.root, { recursive: true, force: true });
  }
});

// 실패 ④ — 800줄 넘는 js 가 새로 생기면, 이미 넘던 파일이 길어지면
check('실패 ④: 800줄을 넘는 js 파일이 새로 생기거나 더 길어지면 실패한다', () => {
  const fx = makeFixture();
  try {
    const big = Array.from({ length: 801 }, (_, i) => 'var v' + i + ' = ' + i + ';').join('\n') + '\n';
    write(fx.root, 'js/flat.js', big);
    const r = guard.run({ root: fx.root, baseline: fx.baseline, noSpecs: true });
    assert.strictEqual(r.ok, false);
    assert.ok(r.failures.some(f => f.includes('④ 800줄 초과 js 파일 수: 0 → 1')), r.failures.join('\n'));
    assert.ok(r.failures.some(f => f.includes('js/flat.js: 새로 800줄을 넘었다(801줄)')), r.failures.join('\n'));
    // 801줄을 사유와 함께 기준선에 올린 뒤 1줄 더 길어지면 다시 실패
    const up = guard.update({ root: fx.root, baseline: fx.baseline, reason: '시험용: 801줄 파일을 기준선에 올린다(사유 20자 이상)' });
    assert.ok(up.ok, up.message);
    write(fx.root, 'js/flat.js', big + 'var tail = 1;\n');
    const r2 = guard.run({ root: fx.root, baseline: fx.baseline, noSpecs: true });
    assert.strictEqual(r2.ok, false);
    assert.ok(r2.failures.some(f => f.includes('js/flat.js: 801 → 802줄')), r2.failures.join('\n'));
  } finally {
    fs.rmSync(fx.root, { recursive: true, force: true });
  }
});

// 실패 ⑤ — 탭 alpha 가 탭 beta 를 직접 참조하면
check('실패 ⑤: js/tabs/alpha 가 js/tabs/beta 의 심볼·경로를 직접 참조하면 실패한다', () => {
  const fx = makeFixture();
  try {
    write(fx.root, 'js/tabs/alpha/sub-peek.js', [
      '(function(global){',
      '  // 주석 속 OurgoalBetaMegaBlock 은 세지 않는다',
      '  var b = global.OurgoalBetaMegaBlock;',
      '  var p = "js/tabs/beta/index.js";',
      '})(globalThis);',
      ''
    ].join('\n'));
    const r = guard.run({ root: fx.root, baseline: fx.baseline, noSpecs: true });
    assert.strictEqual(r.ok, false);
    assert.ok(r.failures.some(f => f.startsWith('⑤ 탭 간 직접 참조 수: 0 → 2')), r.failures.join('\n'));
  } finally {
    fs.rmSync(fx.root, { recursive: true, force: true });
  }
});

// 래칫 — 줄면 통과 + 알림, 사유 없이 올리기 거부, 손으로 올린 이력 거부
check('래칫: 줄면 통과하고 낮출 수 있다고 알리며, 사유 없는 올리기·손으로 올린 이력은 거부한다', () => {
  const fx = makeFixture();
  try {
    write(fx.root, 'index.html', fs.readFileSync(path.join(fx.root, 'index.html'), 'utf8').replace('window.appBoot = boot;\n', ''));
    const r = guard.run({ root: fx.root, baseline: fx.baseline, noSpecs: true });
    assert.strictEqual(r.ok, true);
    assert.ok(r.lowerable.some(l => l.startsWith('③ window 전역 직접 대입 수: 1 → 0')), r.lowerable.join('\n'));
    assert.ok(guard.update({ root: fx.root, baseline: fx.baseline }).ok, '줄어든 값으로는 사유 없이 낮춘다');
    write(fx.root, 'js/tabs/alpha/sub-x.js', 'window.leak = 1;\n');
    const refused = guard.update({ root: fx.root, baseline: fx.baseline });
    assert.strictEqual(refused.ok, false, '늘어난 값은 사유 없이 못 올린다');
    assert.ok(/사유/.test(refused.message));
    const doc = JSON.parse(fs.readFileSync(fx.baseline, 'utf8'));
    const last = JSON.parse(JSON.stringify(doc.history[doc.history.length - 1]));
    last.metrics.windowAssignments += 5;
    delete last.reason;
    doc.history.push(last);
    fs.writeFileSync(fx.baseline, JSON.stringify(doc), 'utf8');
    const r2 = guard.run({ root: fx.root, baseline: fx.baseline, noSpecs: true });
    assert.strictEqual(r2.ok, false, '손으로 올린 이력은 실패');
    assert.ok(r2.failures.some(f => f.includes('사유 없이 값을 올렸다')), r2.failures.join('\n'));
  } finally {
    fs.rmSync(fx.root, { recursive: true, force: true });
  }
});

// 세포 신고서 검증 — 신고서 없는 새 세포 · requires 를 아무도 provide 안 함 · owns 주인 둘 → 실패, 신호 불일치 → 경고
check('신고서: 신고서 없는 세포·주는 세포 없는 requires·데이터 주인 둘·목록 밖 자리·종류 밖 kind 는 실패, 신호 불일치는 경고', () => {
  const specs = require(path.join(ROOT, 'scripts', 'module-specs.js'));
  const fx = makeFixture();
  try {
    const doc = specs.merge(fx.root, null);
    const cell = id => doc.cells.find(c => c.id === id);
    cell('flat').kind = 'organ';
    specs.writeSpec(fx.root, doc);
    let r = guard.run({ root: fx.root, baseline: fx.baseline });
    assert.strictEqual(r.ok, true, '정상 신고서는 통과: ' + r.failures.join(' / '));

    // 신고서 없는 새 세포
    write(fx.root, 'js/tabs/alpha/sub-new.js', '(function(){ var x = 1; })();\n');
    r = guard.run({ root: fx.root, baseline: fx.baseline });
    assert.strictEqual(r.ok, false);
    assert.ok(r.failures.some(f => f.includes('신고서 없는 세포: js/tabs/alpha/sub-new.js')), r.failures.join('\n'));
    fs.unlinkSync(path.join(fx.root, 'js/tabs/alpha/sub-new.js'));

    // requires 를 아무도 provide 하지 않음 → 주는 세포를 더하면 통과
    cell('alpha/index').requires = ['ui.toast'];
    specs.writeSpec(fx.root, doc);
    r = guard.run({ root: fx.root, baseline: fx.baseline });
    assert.ok(r.failures.some(f => f.includes('세포 alpha/index 가 필요한 능력 ui.toast 을 주는 세포가 없다')), r.failures.join('\n'));
    cell('flat').provides = ['ui.toast'];
    cell('flat').capabilities = [{ name: 'ui.toast', description: '짧은 알림 띄우기', sideEffect: 'screen' }];
    specs.writeSpec(fx.root, doc);
    r = guard.run({ root: fx.root, baseline: fx.baseline });
    assert.strictEqual(r.ok, true, 'provide 하면 통과: ' + r.failures.join(' / '));

    // owns 중복(데이터 주인 둘)
    cell('alpha/index').owns = ['data.records'];
    cell('beta/index').owns = ['data.records'];
    specs.writeSpec(fx.root, doc);
    r = guard.run({ root: fx.root, baseline: fx.baseline });
    assert.ok(r.failures.some(f => f.includes('데이터 data.records 의 주인이 둘')), r.failures.join('\n'));
    cell('beta/index').owns = [];

    // 정식 목록 15곳 밖 자리에 기여(신고서) → 실패, 목록 안 자리는 통과
    cell('alpha/index').contributes = ['home.widget'];
    specs.writeSpec(fx.root, doc);
    r = guard.run({ root: fx.root, baseline: fx.baseline });
    assert.ok(r.failures.some(f => f.includes('꽂는 자리 home.widget 는 정식 목록 15곳에 없다')), r.failures.join(' / '));
    cell('alpha/index').contributes = ['home.card'];
    specs.writeSpec(fx.root, doc);
    r = guard.run({ root: fx.root, baseline: fx.baseline });
    assert.ok(!r.failures.some(f => f.includes('꽂는 자리')), r.failures.join(' / '));

    // 세포 종류는 4가지(organ·tab·hybrid·future)뿐
    cell('flat').kind = 'small';
    specs.writeSpec(fx.root, doc);
    r = guard.run({ root: fx.root, baseline: fx.baseline });
    assert.ok(r.failures.some(f => f.includes('세포 flat: 종류(kind)가 "small"')), r.failures.join(' / '));
    cell('flat').kind = 'organ';

    // 신호 불일치 → 경고(실패 아님)
    write(fx.root, 'js/tabs/beta/index.js', fs.readFileSync(path.join(fx.root, 'js/tabs/beta/index.js'), 'utf8') + 'globalThis.OurgoalEvents && globalThis.OurgoalEvents.emit(\'goal:completed\', {});\n');
    specs.writeSpec(fx.root, doc);
    r = guard.run({ root: fx.root, baseline: fx.baseline });
    assert.strictEqual(r.ok, true, '신호 불일치만 있으면 통과: ' + r.failures.join(' / '));
    assert.ok(r.warnings.some(w => w.includes('beta/index emits: 신고서에 없는 신호 goal:completed')), r.warnings.join('\n'));
  } finally {
    fs.rmSync(fx.root, { recursive: true, force: true });
  }
});

console.log(`✓ module-guard 시험 ${results.length}건 통과(통과 1 · 실패 ①④⑤ 3 · 래칫 1 · 신고서 1)`);
