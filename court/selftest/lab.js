'use strict';
// 법정 자가시험 — 합성 git 저장소 제작기(실험실).
// 법정을 의심하려면 "정답을 아는 피고"가 필요하다. 실제 앱으로는 무엇이 가짜인지 미리 알 수 없으므로,
// 실제 앱과 같은 선택자 계약을 가진 작은 앱을 임시 저장소에 만들고 그 위에 가짜·정직 커밋을 쌓는다.
// 주의: 여기서 쓰는 git commit·checkout 은 전부 os.tmpdir() 아래 합성 저장소에만 한다. 실제 작업 저장소는 건드리지 않는다.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

// git 훅(pre-push 등) 안에서 자가시험이 돌면 GIT_DIR·GIT_INDEX_FILE 이 환경에 실려 온다.
// 그 값은 -C 보다 우선하므로, 지우지 않으면 합성 커밋이 "진짜 저장소"에 쌓인다. 법정의 git 모듈도 process.env 를 그대로 쓰므로 프로세스 환경에서 지운다.
const GIT_LOCATION_VARS = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_COMMON_DIR', 'GIT_PREFIX', 'GIT_NAMESPACE'];
function sanitizeGitEnv() { for (const k of GIT_LOCATION_VARS) delete process.env[k]; }
sanitizeGitEnv();

// ───────────── 작은 앱(기준 커밋의 내용) ─────────────
// 표식(LAB:…)은 가짜·정직 사례가 코드를 끼워 넣는 자리다. 표식이 HTML 주석·JS 블록 주석인 이유: 앱 동작에 영향을 주지 않기 위해서다.
const MARK = { homeExtra: '<!-- LAB:HOME-EXTRA -->', goalsExtra: '<!-- LAB:GOALS-EXTRA -->', scriptExtra: '<!-- LAB:SCRIPT-EXTRA -->', initExtra: '/* LAB:INIT-EXTRA */', popstate: '/* LAB:POPSTATE */', cancelWire: '/* LAB:CANCEL-WIRE */' };

const INDEX_HTML = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>법정 자가시험용 작은 앱</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: sans-serif; }
  #landing { padding: 48px 16px; text-align: center; }
  #btnLandingPreviewDirect { min-width: 220px; min-height: 48px; font-size: 16px; }
  #appRoot { display: none; }
  body.entered #landing { display: none; }
  body.entered #appRoot { display: block; }
  .screen { display: none; padding: 16px 16px 80px; }
  .screen.active { display: block; }
  #homeAddGoal, .labbtn, .btn-primary { display: block; width: 100%; min-height: 48px; margin: 12px 0; font-size: 16px; }
  #modalOverlay { display: none; position: fixed; left: 0; top: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, .55); z-index: 50; align-items: flex-end; }
  #modalOverlay.active { display: flex; }
  #ngSheet { width: 100%; min-height: 260px; padding: 16px; background: #fff; border-radius: 16px 16px 0 0; }
  #ngCancelBtn { min-width: 96px; min-height: 48px; }
  .navbar { position: fixed; left: 0; right: 0; bottom: 0; height: 56px; display: flex; background: #fff; border-top: 1px solid #ddd; z-index: 10; }
  .navbtn { flex: 1; border: 0; background: none; font-size: 15px; }
  .navbtn.active { font-weight: 700; color: #1a7f4b; }
  #toast { display: none; position: fixed; left: 16px; right: 16px; bottom: 72px; padding: 12px; background: #222; color: #fff; border-radius: 8px; z-index: 60; text-align: center; }
  #toast.show { display: block; }
</style>
</head>
<body>
<div id="landing">
  <h1>작은 앱</h1>
  <button id="btnLandingPreviewDirect" type="button">로그인 없이 둘러보기</button>
</div>
<div id="appRoot">
<div id="screen-home" class="screen active">
  <h1>홈</h1>
  <button id="homeAddGoal" type="button">새 목표</button>
  ${MARK.homeExtra}
  <p id="labMsg"></p>
</div>
<div id="screen-goals" class="screen">
  <h1>목표</h1>
  <button id="sAddGoalBtn" class="btn-primary" type="button">새 목표 만들기</button>
  ${MARK.goalsExtra}
</div>
<div id="screen-records" class="screen">
  <h1>기록</h1>
  <p>기록이 아직 없습니다.</p>
</div>
<div id="modalOverlay">
  <div id="ngSheet">
    <h2>새 목표</h2>
    <input id="ngTitle" type="text" placeholder="목표 이름">
    <button id="ngCancelBtn" type="button">취소</button>
  </div>
</div>
<div id="toast"></div>
<nav class="navbar">
  <button class="navbtn active" type="button" data-tab="home">홈</button>
  <button class="navbtn" type="button" data-tab="goals">목표</button>
  <button class="navbtn" type="button" data-tab="records">기록</button>
</nav>
</div>
${MARK.scriptExtra}
<script src="js/mod.js"></script>
<script src="js/extra.js"></script>
<script src="js/app.js"></script>
</body>
</html>
`;

const MOD_JS = `// 작은 앱의 부품. 전역 LabMod 를 등록한다(법정의 부품 로드 탐침이 "등록하던 전역이 사라졌는가"를 본다).
(function () {
  'use strict';
  function greet(name) { return '안녕하세요, ' + name; }
  window.LabMod = { version: 1, greet: greet };
})();
`;

// 두 번째 부품. F5(스크립트 파일 삭제 → 404)가 이 파일을 지운다. 부품이 2개 이상이어야 하나를 지워도 부품 로드 탐침이 "하나도 못 읽음"(도구 오류)으로 빠지지 않는다.
const EXTRA_JS = `// 작은 앱의 두 번째 부품. 전역 LabExtra 를 등록한다.
(function () {
  'use strict';
  window.LabExtra = { today: function () { return '오늘'; } };
})();
`;

// cancelWired=false 는 "진짜 결함이 있는 기준 커밋"(취소 버튼이 새 목표 창을 닫지 않는다)을 만든다 — 정직한 결함 수정(H2)의 출발점.
function appJs(opts) {
  const cancelWired = !(opts && opts.cancelWired === false);
  return `// 작은 앱 본체. 실제 앱과 같은 선택자 계약(#btnLandingPreviewDirect·#homeAddGoal·#sAddGoalBtn·#modalOverlay·.navbtn·#toast)만 흉내 낸다. 외부 통신 없음.
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  var toastTimer = 0;
  function showToast(msg) {
    var t = $('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }
  function isOpen() { var o = $('modalOverlay'); return !!o && o.classList.contains('active'); }
  function openModal() { $('modalOverlay').classList.add('active'); history.pushState({ labModal: 1 }, ''); }
  function closeModal() {
    if (!isOpen()) return;
    $('modalOverlay').classList.remove('active');
    if (history.state && history.state.labModal) history.back();
  }
  function switchTab(name) {
    var btns = document.querySelectorAll('.navbtn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].getAttribute('data-tab') === name);
    var screens = document.querySelectorAll('.screen');
    for (var j = 0; j < screens.length; j++) screens[j].classList.toggle('active', screens[j].id === 'screen-' + name);
  }
  function onPopState() {
    ${MARK.popstate}
    $('modalOverlay').classList.remove('active');
  }
  function init() {
    var add = $('homeAddGoal');
    if (!add) return; // 부품 로드 탐침(vm)에는 화면이 없다 — 거기서 죽으면 회귀 비교가 안 된다
    $('btnLandingPreviewDirect').addEventListener('click', function () { document.body.classList.add('entered'); }); // 실제 앱의 "로그인 없이 둘러보기"
    add.addEventListener('click', openModal);
    $('sAddGoalBtn').addEventListener('click', openModal); // 법정 표준 점검(std-modal-close-stays-on-tab)이 누르는 목표 탭의 주 버튼
    $('modalOverlay').addEventListener('click', function (e) { if (e.target === this) closeModal(); });
    ${cancelWired ? "$('ngCancelBtn').addEventListener('click', closeModal);" : MARK.cancelWire}
    window.addEventListener('popstate', onPopState);
    var btns = document.querySelectorAll('.navbtn');
    for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', function () { switchTab(this.getAttribute('data-tab')); });
    ${MARK.initExtra}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.LabApp = { showToast: showToast, switchTab: switchTab };
})();
`;
}

// 단언 3줄짜리 테스트. F8(단언 삭제)·F9(건너뛰기 줄 추가)의 출발점.
// 출력 형식("  ✓ 제목" / "  ✗ 제목")은 실제 앱의 scripts/smoke-test.js 와 같다 — 법정의 기준 시험지 채점(vault.json 의 baseTestRunners)이 이 형식을 읽는다.
const SMOKE_CHECKS = {
  addGoal: "check('새 목표 버튼이 있다', () => { assert.ok(html.includes('id=\"homeAddGoal\"')); });",
  modal: "check('새 목표 창이 있다', () => { assert.ok(html.includes('id=\"modalOverlay\"')); });",
  greet: "check('부품 mod.js 가 인사 함수를 등록한다', () => { assert.ok(/greet:\\s*greet/.test(mod)); });",
};
const SMOKE_TEST_JS = `'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const mod = fs.readFileSync(path.join(__dirname, '..', 'js', 'mod.js'), 'utf8');
let failures = 0;
function check(label, fn) {
  try { fn(); console.log('  ✓ ' + label); }
  catch (err) { failures++; console.error('  ✗ ' + label); }
}
${SMOKE_CHECKS.addGoal}
${SMOKE_CHECKS.modal}
${SMOKE_CHECKS.greet}
if (failures) process.exitCode = 1;
`;

// 변형 with-calc: 시험지가 제품 부품(js/calc.js)을 같은 프로세스에서 실제로 돌린다 — 실제 앱의 시험지와 같은 모양이다.
// 여러 줄로 쓴 검사 2개(제품 함수를 돌리는 검사 · 글자가 있는지만 보는 검사)와, 실제 게이트처럼 검사 사이에 구획을 알리는 출력 줄이 있다.
// 검사 제목 고치기·번호 표기·폐기 사유(retire)·제품이 시험을 죽이는 경우·시험 결과 꾸미기 사례의 출발점.
const CALC_JS = `// 작은 앱의 계산 부품. 화면(전역 LabCalc)과 시험지(require) 양쪽에서 쓴다.
(function (root) {
  'use strict';
  function add(a, b) { return a + b; }
  root.LabCalc = { add: add };
  if (typeof module !== 'undefined') module.exports = root.LabCalc;
})(typeof window !== 'undefined' ? window : globalThis);
`;
const CALC_CHECKS = {
  add: "check('[검증 1/2] 계산기 더하기', () => {\n  assert.strictEqual(calc.add(1, 2), 3);\n});",
  pin: "check('[검증 2/2] 부품에 인사 함수 글자가 있다', () => {\n  assert.ok(/greet:\\s*greet/.test(mod));\n});",
};
const CALC_SECTION = "console.log('[구획] 계산 부품 검사');";
const CALC_FOOTER = "console.log('[구획] 검사 끝');";
const SMOKE_END = 'if (failures) process.exitCode = 1;';
const SMOKE_TEST_CALC_JS = SMOKE_TEST_JS
  .replace('let failures = 0;', () => "const calc = require('../js/calc.js');\nlet failures = 0;")
  .replace(SMOKE_END, () => [CALC_SECTION, CALC_CHECKS.add, CALC_CHECKS.pin, CALC_FOOTER, SMOKE_END].join('\n'));

// 변형 boot-error: 기준 커밋부터 "앱 주소가 든 오류"가 앱을 띄울 때마다 난다(없는 파일을 불러오려다 실패). 이번 변경이 만든 오류가 아니다.
const PREEXISTING_BOOT_ERROR = '<script>import("/js/not-there.js");</script>';

// "cleartext": true — 콜론 뒤 공백 1칸이 있는 원본. F19 가 이 공백만 지운다(값은 그대로 true).
const CAPACITOR_JSON = '{\n  "appId": "lab.court.selftest",\n  "server": {\n    "cleartext": true\n  }\n}\n';
const PACKAGE_JSON = JSON.stringify({ name: 'court-selftest-lab', private: true, version: '1.0.0', scripts: { test: 'node scripts/smoke-test.js' } }, null, 2) + '\n';
// 합성 저장소 안의 court/config.json 은 "금고 경로에 있는 파일"일 뿐이다. 법정은 자기 옆의 config.json 을 읽지 이 파일을 읽지 않는다.
const LAB_COURT_CONFIG = JSON.stringify({ _설명: '합성 저장소의 금고 자리 표시 파일(법정은 이 파일을 읽지 않는다)', allowedPaths: ['/', '/index.html'] }, null, 2) + '\n';

const VARIANTS = ['standard', 'cancel-broken', 'with-calc', 'boot-error'];
function baseFiles(variant) {
  if (!VARIANTS.includes(variant)) throw new Error('모르는 실험실 변형: ' + variant);
  const files = {
    'index.html': variant === 'boot-error' ? INDEX_HTML.replace(MARK.scriptExtra, () => PREEXISTING_BOOT_ERROR + '\n' + MARK.scriptExtra) : INDEX_HTML,
    'js/mod.js': MOD_JS,
    'js/extra.js': EXTRA_JS,
    'js/app.js': appJs({ cancelWired: variant !== 'cancel-broken' }),
    'scripts/smoke-test.js': variant === 'with-calc' ? SMOKE_TEST_CALC_JS : SMOKE_TEST_JS,
    'capacitor.config.json': CAPACITOR_JSON,
    'package.json': PACKAGE_JSON,
    'court/config.json': LAB_COURT_CONFIG,
    'README.md': '# 법정 자가시험용 합성 저장소\n\n이 저장소는 자가시험이 만들고 지운다.\n',
  };
  if (variant === 'with-calc') files['js/calc.js'] = CALC_JS;
  return files;
}

// ───────────── 합성 저장소 ─────────────
function norm(p) { return path.resolve(p).replace(/\\/g, '/').toLowerCase(); }

function createLab(opts) {
  const variant = (opts && opts.variant) || 'standard';
  const tmpRoot = fs.realpathSync.native(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(tmpRoot, 'court-lab-'));
  // 상위 폴더로 올라가 다른 저장소를 찾지 못하게 천장을 친다(임시 폴더가 어떤 저장소 안에 있어도 안전하게).
  const env = { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(dir), GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0' };
  for (const k of GIT_LOCATION_VARS) delete env[k];
  const git = args => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }).replace(/\s+$/, '');

  git(['init', '-q']);
  // 안전 확인: 지금부터 커밋을 쌓을 저장소가 정말 방금 만든 임시 폴더인가. 아니면 아무것도 하지 않고 멈춘다.
  const top = git(['rev-parse', '--show-toplevel']);
  if (norm(top) !== norm(dir) || !norm(dir).startsWith(norm(tmpRoot) + '/')) throw new Error('실험실 안전 확인 실패: 합성 저장소 위치가 임시 폴더가 아니다(' + top + ')');
  git(['symbolic-ref', 'HEAD', 'refs/heads/main']);
  const emptyHooks = path.join(dir, '.git', 'hooks-empty');
  fs.mkdirSync(emptyHooks, { recursive: true });
  const localConfig = {
    'user.name': 'court-selftest', 'user.email': 'court-selftest@example.invalid',
    'core.hooksPath': emptyHooks.replace(/\\/g, '/'), // 전역 훅(essence-gate 등)이 합성 커밋을 막거나 고치지 못하게 빈 폴더로 돌린다
    'core.autocrlf': 'false', 'core.safecrlf': 'false', 'commit.gpgsign': 'false', 'gc.auto': '0', 'advice.detachedHead': 'false',
  };
  for (const [k, v] of Object.entries(localConfig)) git(['config', '--local', k, v]);

  const abs = rel => {
    const fp = path.resolve(dir, rel);
    if (!norm(fp).startsWith(norm(dir) + '/') || norm(fp).startsWith(norm(path.join(dir, '.git')) + '/')) throw new Error('실험실 밖 경로: ' + rel);
    return fp;
  };
  const read = rel => { try { return fs.readFileSync(abs(rel), 'utf8'); } catch (_) { return null; } };
  // files: { '경로': '내용' | null(삭제) | (옛 내용) => 새 내용 } 또는 그 배열(차례로 적용 — 같은 파일을 여러 번 고칠 수 있다)
  const apply = files => {
    if (Array.isArray(files)) { for (const m of files) apply(m); return; }
    for (const [rel, val] of Object.entries(files || {})) {
      const fp = abs(rel);
      if (val === null) { fs.rmSync(fp, { force: true }); continue; }
      const next = typeof val === 'function' ? val(read(rel)) : val;
      if (typeof next !== 'string') throw new Error('실험실: ' + rel + ' 의 새 내용이 문자열이 아니다');
      fs.mkdirSync(path.dirname(fp), { recursive: true });
      fs.writeFileSync(fp, next, 'utf8');
    }
  };
  const commitAll = message => { git(['add', '-A']); git(['commit', '-q', '--allow-empty', '-m', message]); return git(['rev-parse', 'HEAD']); };

  apply(baseFiles(variant));
  const baseSha = commitAll('기준: 법정 자가시험용 작은 앱(' + variant + ')');
  // judge 의 기본 기준점은 merge-base(origin/main, head) 다. 원격 없이도 그 경로가 돌도록 원격 추적 참조만 만들어 둔다.
  git(['update-ref', 'refs/remotes/origin/main', baseSha]);

  const lab = {
    dir, variant, baseSha, git, read,
    // branch 가 없으면 from(기본: 기준 커밋)에서 새로 따고, 있으면 그 끝에 커밋을 하나 더 쌓는다.
    commit(branch, files, message, from) {
      const exists = (() => { try { git(['rev-parse', '--verify', '--quiet', 'refs/heads/' + branch]); return true; } catch (_) { return false; } })();
      if (exists) git(['checkout', '-q', branch]); else git(['checkout', '-q', '-B', branch, from || baseSha]);
      apply(files);
      return commitAll(message || branch);
    },
    dispose() {
      for (let i = 0; i < 5; i++) { try { fs.rmSync(dir, { recursive: true, force: true }); return; } catch (_) { /* Windows 파일 잠금: 잠깐 뒤 다시 */ Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200); } }
    },
  };
  return lab;
}

// 표식 자리에 코드를 끼워 넣는 편집기. 표식이 없으면 조용히 넘어가지 않고 던진다(가짜가 "안 만들어진 채" 통과하는 것을 막는다).
function insertAt(mark, code) {
  return old => {
    if (typeof old !== 'string' || !old.includes(mark)) throw new Error('실험실: 표식 ' + mark + ' 이 파일에 없다');
    return old.replace(mark, () => code + '\n    ' + mark); // 함수로 넘긴다: 끼워 넣는 코드 안의 $ 가 치환 패턴($& 등)으로 해석되면 안 된다
  };
}
function replaceOnce(from, to) {
  return old => {
    if (typeof old !== 'string' || old.split(from).length !== 2) throw new Error('실험실: 바꿀 문자열이 정확히 1번 나오지 않는다: ' + from.slice(0, 40));
    return old.replace(from, () => to);
  };
}

module.exports = { createLab, baseFiles, insertAt, replaceOnce, MARK, SMOKE_CHECKS, CALC_CHECKS, SMOKE_END, VARIANTS, sanitizeGitEnv, GIT_LOCATION_VARS };
