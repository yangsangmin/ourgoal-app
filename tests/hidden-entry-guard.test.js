'use strict';
// 숨김 게이트 정적판 시험 (#TASK-ES-458 · W98 재발 방지)
// 통과 1: 지금 저장소의 숨은 처리기 요소가 모두 허용 목록(docs/architecture/hidden-entry-baseline.json)에 사유와 함께 있다.
// 실패 4: 임시 사본에 일부러 숨긴 픽스처 — ① ui.css 4테마 !important 규칙 ② 조상 인라인 !important ③ 클래스 선택자로 조상 숨김
//          ④ 자바스크립트 처리기(getElementById … addEventListener)만 있는 id 숨김 — 이면 가드가 실패하고 그 키를 이름 댄다.
// 통과 3: 상태 선택자(:hover)·!important 없는 display:none·홈 첫 화면으로 좁힌 선택자(#screen-home > #id)로 옮겨 간 요소는 실패시키지 않는다.
// 허용 목록 형식: 사유 20자 미만·키 중복은 실패, --allow 는 사유 없이 거부(종료 2).
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const GUARD = path.join(ROOT, 'scripts', 'hidden-entry-guard.js');
const guard = require(GUARD);
const BASELINE = path.join(ROOT, 'docs', 'architecture', 'hidden-entry-baseline.json');

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; console.log('  ✗ ' + name + '\n      ' + (e && e.message)); }
}
function write(root, rel, text) { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text, 'utf8'); }

// 작은 가짜 저장소
function fixture(extraCss, htmlPatch, js) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ourgoal-hidden-guard-'));
  let html = [
    '<!doctype html><html lang="ko"><body>',
    '<main class="screens">',
    '<section class="screen active" id="screen-home">',
    '  <div class="top-right" id="topRight"><button type="button" id="bellBtn" onclick="openBell()">알림</button></div>',
    '  <div class="home-actions"><button type="button" id="shareBtn">자랑하기</button></div>',
    '  <div id="missionCard"><button type="button" onclick="toggleMission()">더보기</button></div>',
    '  <button type="button" id="plainBtn">그냥</button>',
    '</section>',
    '</main>',
    '<script>document.getElementById("shareBtn").addEventListener("click", function(){ openShare(); });</script>',
    '</body></html>', ''
  ].join('\n');
  if (htmlPatch) html = htmlPatch(html);
  write(root, 'index.html', html);
  write(root, 'ui.css', '.top-right{display:flex;}\n' + (extraCss || ''));
  write(root, 'js/tabs/home/x.js', js || '');
  write(root, 'docs/architecture/hidden-entry-baseline.json', JSON.stringify({ groups: [] }));
  return root;
}
const keysOf = (r) => r.added.map(a => a.key);

console.log('숨김 게이트 정적판 시험');

t('지금 저장소: 숨은 처리기 요소가 모두 허용 목록 안에 있고 허용 목록 형식이 맞다(가드 통과)', () => {
  const r = guard.check(ROOT, BASELINE);
  assert.deepStrictEqual(r.errors, [], '허용 목록 형식 오류: ' + r.errors.join(' / '));
  assert.deepStrictEqual(keysOf(r), [], '허용 목록 밖: ' + keysOf(r).join(', '));
  assert.strictEqual(r.ok, true);
});

t('지금 저장소 CLI: 종료 코드 0', () => {
  const p = spawnSync(process.execPath, [GUARD, '--quiet'], { encoding: 'utf8' });
  assert.strictEqual(p.status, 0, p.stdout + p.stderr);
});

t('깨끗한 픽스처: 숨은 처리기 요소 0', () => {
  const r = guard.check(fixture(), null);
  assert.strictEqual(r.measured.hidden.length, 0, JSON.stringify(r.measured.hidden));
  assert.strictEqual(r.ok, true);
});

t('① ui.css 에 4테마 !important 숨김 규칙을 더하면 실패 — #bellBtn', () => {
  const css = ['focus-sanctuary', 'black', 'white', 'urban-city'].map(th => '[data-theme="' + th + '"] #bellBtn').join(',\n') + ' {\n  display: none !important;\n}\n';
  const root = fixture(css);
  const r = guard.check(root, path.join(root, 'docs/architecture/hidden-entry-baseline.json'));
  assert.strictEqual(r.ok, false);
  assert.ok(keysOf(r).includes('#bellBtn'), keysOf(r).join(', '));
  const p = spawnSync(process.execPath, [GUARD, '--root', root], { encoding: 'utf8' });
  assert.strictEqual(p.status, 1, 'CLI 종료 코드 1 이어야 함: ' + p.stdout);
  assert.ok(/새로 숨은 처리기 요소 #bellBtn/.test(p.stdout), p.stdout);
});

t('② 조상에 인라인 display:none !important 를 넣으면 실패 — 조상 #topRight 안의 #bellBtn', () => {
  const root = fixture('', h => h.replace('id="topRight"', 'id="topRight" style="display:none !important;"'));
  const r = guard.check(root, null);
  assert.ok(keysOf(r).includes('#bellBtn'), keysOf(r).join(', '));
  assert.ok(r.added.find(a => a.key === '#bellBtn').by.some(b => /조상 #topRight/.test(b) && /inline/.test(b)));
});

t('③ 클래스 선택자로 조상을 숨기면(.home-actions — ES-433 사례) 실패 — 자바스크립트 처리기만 있는 #shareBtn', () => {
  const r = guard.check(fixture('html[data-theme="black"] .home-actions { display: none !important; }\n'), null);
  assert.ok(keysOf(r).includes('#shareBtn'), keysOf(r).join(', '));
});

t('④ id 없는 onclick 단추도 잡는다 — 조상 #missionCard 숨김(ES-440 오늘의 카드 사례)', () => {
  const r = guard.check(fixture('[data-theme="white"] #missionCard { display: none !important; }\n'), null);
  assert.ok(keysOf(r).some(k => /^#missionCard > button "더보기"$/.test(k)), keysOf(r).join(', '));
});

t('④-2 js 파일의 변수 담기 꼴 처리기(var b = getElementById; b.onclick =)도 처리기로 센다', () => {
  const root = fixture('#plainBtn { display: none !important; }\n', null, 'var pb = document.getElementById("plainBtn");\nif (pb) pb.onclick = function(){ go(); };\n');
  assert.ok(keysOf(guard.check(root, null)).includes('#plainBtn'));
});

t('처리기 없는 요소를 숨기는 것은 실패가 아니다', () => {
  assert.strictEqual(guard.check(fixture('#plainBtn { display: none !important; }\n'), null).ok, true);
});

t(':hover·::before 같은 상태 선택자, !important 없는 display:none 은 실패가 아니다', () => {
  const r = guard.check(fixture('#bellBtn:hover { display: none !important; }\n#topRight::before { display:none !important; }\n#bellBtn { display: none; }\n@media print { #bellBtn { display: none !important; } }\n'), null);
  assert.strictEqual(r.ok, true, keysOf(r).join(', '));
});

t('홈 첫 화면으로 좁힌 선택자(#screen-home > #id)는 그 자리에 있을 때만 맞는다', () => {
  const css = '[data-theme="black"] #screen-home > #missionCard { display: none !important; }\n';
  assert.strictEqual(guard.check(fixture(css), null).ok, false, '바로 아래에 있으면 숨김');
  const moved = fixture(css, h => h.replace('  <div id="missionCard">', '  <div id="sheet"><div id="missionCard">').replace('더보기</button></div>', '더보기</button></div></div>'));
  assert.strictEqual(guard.check(moved, null).ok, true, '시트 안으로 옮기면 맞지 않음');
});

t('허용 목록: 사유가 있으면 통과, 사유 20자 미만·키 중복은 실패', () => {
  const css = '[data-theme="black"] #bellBtn { display: none !important; }\n';
  const root = fixture(css);
  const bl = path.join(root, 'docs/architecture/hidden-entry-baseline.json');
  fs.writeFileSync(bl, JSON.stringify({ groups: [{ reason: '상민님 지시로 내린 기능 — 시험용 사유 문장입니다', keys: ['#bellBtn'] }] }));
  assert.strictEqual(guard.check(root, bl).ok, true);
  fs.writeFileSync(bl, JSON.stringify({ groups: [{ reason: '짧음', keys: ['#bellBtn'] }] }));
  assert.strictEqual(guard.check(root, bl).ok, false);
  fs.writeFileSync(bl, JSON.stringify({ groups: [{ reason: '상민님 지시로 내린 기능 — 시험용 사유 문장입니다', keys: ['#bellBtn', '#bellBtn'] }] }));
  assert.strictEqual(guard.check(root, bl).ok, false);
});

t('--allow 는 사유 없이 거부(종료 2), 사유가 있으면 허용 목록에 올라 통과, --update 는 더는 숨지 않는 항목을 지운다', () => {
  const root = fixture('[data-theme="black"] #bellBtn { display: none !important; }\n');
  const bl = path.join(root, 'docs/architecture/hidden-entry-baseline.json');
  assert.strictEqual(spawnSync(process.execPath, [GUARD, '--root', root, '--allow', '#bellBtn'], { encoding: 'utf8' }).status, 2);
  assert.strictEqual(spawnSync(process.execPath, [GUARD, '--root', root, '--allow', '#bellBtn', '--reason', '상민님 지시(TASK-ES-000)로 내린 시험용 단추입니다'], { encoding: 'utf8' }).status, 0);
  assert.strictEqual(spawnSync(process.execPath, [GUARD, '--root', root], { encoding: 'utf8' }).status, 0);
  fs.writeFileSync(path.join(root, 'ui.css'), '.top-right{display:flex;}\n');
  assert.strictEqual(spawnSync(process.execPath, [GUARD, '--root', root, '--update'], { encoding: 'utf8' }).status, 0);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(bl, 'utf8')).groups, []);
});

console.log('\n' + passed + '개 통과, ' + failed + '개 실패');
if (failed) process.exit(1);
