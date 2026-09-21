'use strict';
// 법정 자가시험 — 단위 시험(검수 반영분). 독립 검수 3종(법정 속이기 · 헌법↔구현 · 정상 작업 오판)으로 고친 곳마다, 다시 벌어지면 먼저 깨지는 시험을 둔다.
// 브라우저는 쓰지 않는다(GitHub 의 court 워크플로가 심사 전에 --unit-only 로 돌린다).
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const COURT = path.join(__dirname, '..');
const grade = require('../lib/grade');
const siteHost = require('../lib/site-host');
const scenarioLib = require('../lib/scenario');
const chrome = require('../lib/chrome');
const vaultCheck = require('../vault-check');
const claimsLib = require('../claims');
const report = require('../report');
const judgeLib = require('../judge');
const baseTests = require('../probes/base-tests');
const moduleProbe = require('../probes/module-load');
const bootProbe = require('../probes/boot');
const { createLab, baseFiles, replaceOnce, CALC_CHECKS } = require('./lab');

function tempDir(tag) { return fs.mkdtempSync(path.join(os.tmpdir(), 'court-unit-' + tag + '-')); }
function writeTree(dir, files) { for (const [rel, body] of Object.entries(files)) { const fp = path.join(dir, rel); fs.mkdirSync(path.dirname(fp), { recursive: true }); fs.writeFileSync(fp, body, 'utf8'); } }
const lines = (...l) => l.join('\n') + '\n';

const TESTS = [
  {
    id: 'U-site-host', title: '법정 주소: 실행마다 새 호스트 이름을 고르고, 설정으로 고정할 수 없다',
    run(t) {
      const a = siteHost.pickSiteHost({}), b = siteHost.pickSiteHost({ siteHost: 'court.test' });
      t.ok(/^court-[0-9a-f]{8}\.test$/.test(a), '호스트 이름의 모양: ' + a);
      t.ok(b !== 'court.test' && siteHost.isCourtHost(b), '설정에 고정 이름을 적어도 따르지 않는다: ' + b);
      const many = new Set(Array.from({ length: 20 }, () => siteHost.pickSiteHost()));
      t.ok(many.size >= 19, '20번 고르면 (거의) 전부 달라야 한다. 실제 서로 다른 이름 ' + many.size + '개');
      t.eq(siteHost.siteUrlFor(a, 1234), 'http://' + a + ':1234', '앱 주소');
      t.eq(siteHost.hostOf('http://' + a + ':1234/index.html'), a, '주소에서 호스트 꺼내기'); t.eq(siteHost.hostOf('주소 아님'), null, '주소가 아니면 null');
      t.ok(!siteHost.isCourtHost('court.test') && !siteHost.isCourtHost('127.0.0.1') && !siteHost.isCourtHost(null), '옛 고정 이름·IP 는 법정 호스트가 아니다');
      const cfg = JSON.parse(fs.readFileSync(path.join(COURT, 'config.json'), 'utf8'));
      t.ok(!Object.prototype.hasOwnProperty.call(cfg, 'siteHost'), '법정 설정 파일에 고정 호스트 이름(siteHost)이 남아 있으면 안 된다');
      t.eq(cfg.claimBudgetMs, claimsLib.DEFAULT_CLAIM_BUDGET_MS, '주장 심사 시간 예산(설정 파일과 기본값, 25분)');
    },
  },
  {
    id: 'U-added-lines', title: '추가된 줄 검사: 법정을 알아보는 글자는 돌려보냄감, 접속 환경을 읽는 줄은 표시감, 흔한 정상 코드는 어느 쪽도 아니다',
    run(t) {
      const { ENV_HARD, ENV_SOFT, EXIT_CALL, FAKE_TEST_OUTPUT } = judgeLib;
      const hard = ['if (navigator.webdriver) { return; }', 'if (/HeadlessChrome/.test(navigator.userAgent)) skip();', "if (location.hostname.indexOf('court-') === 0) {", 'if (/\\.test$/.test(location.hostname)) {', "if (location.hostname.endsWith('.test')) {", 'if (window.__courtMode) {'];
      const notHard = ['if (re.test(value)) {', 'var ok = /^[a-z]+$/.test(name);', 'const courtesy = 1;', "el.setAttribute('data-testid', 'goal');", "import('./latest.js');"];
      for (const l of hard) t.ok(ENV_HARD.test(l), '법정을 알아보는 줄인데 놓친다: ' + l);
      for (const l of notHard) t.ok(!ENV_HARD.test(l), '정상 코드를 법정 감지로 잡는다: ' + l);
      const soft = ["if (location.hostname === 'ourgoal.app') {", 'if (location.origin !== PROD_ORIGIN) return;', 'if (/iPhone/.test(navigator.userAgent)) {', 'var lang = navigator.language;', "if (document.visibilityState === 'hidden') return;", 'var off = new Date().getTimezoneOffset();', 'var mobile = navigator.userAgentData && navigator.userAgentData.mobile;',
        // 법정은 언제나 http·임의 포트로 연다 — 접속 방식·포트·주소 전체로 가르는 줄(확인 검수 2026-09-21 이 찾은 길)
        "if (location.protocol === 'http:') { show(); }", 'if (location.port) { enableDebug(); }', 'if (/^http:/.test(document.URL)) {', "if (location.href.indexOf('preview') > -1) {", "if (location.search.includes('debug')) {", "if (document.domain !== 'ourgoal.app') return;", 'if (!window.isSecureContext) return;'];
      const notSoft = ["var link = location.origin + '/share/' + id;", 'send({ ua: navigator.userAgent });', "if (window.matchMedia('(max-width: 600px)').matches) {", 'var w = window.innerWidth;',
        "var share = location.href + '#goal';", 'history.replaceState(null, "", location.pathname + location.search);', 'var params = new URLSearchParams(location.search);'];
      for (const l of soft) t.ok(ENV_SOFT.test(l) && !ENV_HARD.test(l), '접속 환경을 읽어 갈라지는 줄인데 표시하지 않는다(또는 돌려보냄으로 잡는다): ' + l);
      for (const l of notSoft) t.ok(!ENV_SOFT.test(l), '흔한 정상 코드를 접속 환경 분기로 잡는다: ' + l);
      t.ok(EXIT_CALL.test('process.exit(1);') && EXIT_CALL.test('process . exit (0)') && !EXIT_CALL.test('process.exitCode = 1;'), '프로세스를 끝내는 호출');
      t.ok(FAKE_TEST_OUTPUT.test("console.log('  ✓ 계산기 더하기');") && FAKE_TEST_OUTPUT.test("process.stdout.write('[PASS] 검사');") && !FAKE_TEST_OUTPUT.test("console.log('저장 완료');"), '시험 결과처럼 보이는 줄');
    },
  },
  {
    id: 'U-where', title: '실행 장소: 환경변수 하나로는 “GitHub 에서 실행”이 되지 않는다(네 가지가 모두 맞아야 한다)',
    run(t) {
      const full = { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'pull_request_target', GITHUB_RUN_ID: '123456', GITHUB_WORKFLOW_REF: 'owner/repo/.github/workflows/court.yml@refs/heads/main' };
      const w = judgeLib.detectWhere(full);
      t.eq(w.where, 'ci', '네 가지가 모두 맞으면 GitHub 실행'); t.eq(w.runId, '123456', '실행 번호'); t.ok(w.whereText.includes('실행 번호 123456'), '넷째 줄에 실행 번호: ' + w.whereText);
      const broken = { 'GITHUB_ACTIONS 만': { GITHUB_ACTIONS: 'true' }, 'CI 만': { CI: 'true' }, '다른 이벤트(pull_request)': { ...full, GITHUB_EVENT_NAME: 'pull_request' }, '다른 워크플로': { ...full, GITHUB_WORKFLOW_REF: 'owner/repo/.github/workflows/other.yml@refs/heads/main' },
        '실행 번호가 숫자가 아님': { ...full, GITHUB_RUN_ID: '12; rm' }, '실행 번호 없음': { ...full, GITHUB_RUN_ID: undefined }, 'GITHUB_ACTIONS 가 true 가 아님': { ...full, GITHUB_ACTIONS: '1' } };
      for (const [name, env] of Object.entries(broken)) { const r = judgeLib.detectWhere(env); t.ok(r.where === 'local' && r.runId === null && r.whereText.includes('예비 점검'), name + ' → 작업자 PC 의 예비 점검으로 찍혀야 한다: ' + JSON.stringify(r)); }
    },
  },
  {
    id: 'U-verdict-id', title: '판정번호: 같은 조건이면 같은 번호, 실행 장소·빠른 점검 여부·GitHub 실행 번호가 다르면 다른 번호',
    run(t) {
      const base = { head: { sha: 'a'.repeat(40) }, base: { sha: 'b'.repeat(40) }, verdict: '돌려보냄', findings: [{ title: '주장 없음', text: 'x' }], claims: [], reheard: [], where: 'local', quick: true, runId: null, tool: { siteHost: 'court-00000000.test', startedAt: '2026-01-01T00:00:00Z' } };
      const id = o => judgeLib.verdictIdOf({ ...base, ...o });
      t.ok(/^[0-9A-F]{8}$/.test(id({})), '모양: ' + id({}));
      t.eq(id({}), id({ tool: { siteHost: 'court-ffffffff.test', startedAt: '2030-01-01T00:00:00Z' } }), '실행마다 바뀌는 값(법정 호스트·시각)은 번호에 넣지 않는다');
      t.ok(id({}) !== id({ quick: false }), '빠른 점검과 전체 심사의 번호가 같다');
      t.ok(id({}) !== id({ where: 'ci', runId: '1' }), '작업자 PC 와 GitHub 의 번호가 같다');
      t.ok(id({ where: 'ci', runId: '1' }) !== id({ where: 'ci', runId: '2' }), 'GitHub 실행 번호가 달라도 번호가 같다');
      t.eq(id({ runId: '999' }), id({}), '작업자 PC 실행에서는 실행 번호 칸을 넣지 않는다(환경변수로 번호를 바꿀 수 없다)');
      t.ok(id({}) !== id({ verdict: '통과' }) && id({}) !== id({ findings: [] }), '판정 내용이 다르면 번호도 다르다');
    },
  },
  {
    id: 'U-title-numbering', title: '검사 제목: 번호 표기([검증 3/4])만 바뀐 것은 사라진 단언이 아니고, 제목만 고친 검사는 본문이 그대로일 때만 “제목만 바뀜”이다',
    run(t) {
      const r = vaultCheck.removedAssertions;
      const multi = n => lines("check('[검증 3/" + n + "] 인사 함수를 등록한다', () => {", '  assert.ok(/greet/.test(mod));', '});');
      t.eq(r(multi(3), multi(4)).length, 0, '번호 표기만 바뀐 여러 줄 검사');
      t.eq(vaultCheck.normalizeNumbering("check('[검증 19/19] 가', () => {"), vaultCheck.normalizeNumbering("check('[검증 19/20] 가', () => {"), '제목 속 번호 표기 정규화');
      const body = n => lines("check('비율', () => {", "  assert.ok(label === '[3/" + n + "]');", '});');
      const inBody = r(body(3), body(4));
      t.ok(inBody.length === 1 && inBody[0].titleOnly === false, '단언 본문 속의 [3/3]→[3/4] 는 정규화하지 않는다(약화를 놓치면 안 된다): ' + JSON.stringify(inBody));
      const retitled = r(multi(3), multi(3).replace('인사 함수를 등록한다', '인사 함수가 등록돼 있다'));
      t.ok(retitled.length === 1 && retitled[0].titleOnly === true && retitled[0].check === '[검증 3/3] 인사 함수를 등록한다', '제목 글자가 바뀐 줄: titleOnly 표시 + 기준 커밋의 제목: ' + JSON.stringify(retitled));
      const one = (n, extra) => "check('[검증 1/" + n + "] 버튼이 있다', () => { assert.ok(html.includes('id=\"a\"')" + extra + '); });\n';
      const weak = r(one(2, " && html.includes('id=\"b\"')"), one(3, ''));
      t.ok(weak.length === 1 && weak[0].titleOnly === false, '한 줄 검사의 단언 완화는 제목 줄로 넘기지 않는다: ' + JSON.stringify(weak));
      for (const [line, want] of [["check('a', () => {", true], ["check('a', async () => {", true], ["await check('a', async function () {", true], ["check('a',", true], ["check('a', (t) => {", true], ["check('a', () => { assert.ok(1); });", false], ["assert.ok(check('a'))", false], ['assert.ok(x)', false]]) t.eq(vaultCheck.isTitleOnlyLine(line), want, '제목 줄 판별 ' + JSON.stringify(line));
      // judge 쪽: 같은 제목인가, 제목만 고쳤는가
      t.ok(judgeLib.sameTitle('[검증 1/2] 가', '[검증 1/3] 가') && !judgeLib.sameTitle('[검증 1/2] 가', '[검증 1/2] 나') && !judgeLib.sameTitle('[검증 1/2]', '[검증 3/4]'), '번호 표기만 다른 제목은 같은 제목(번호 표기뿐인 제목끼리는 같다고 보지 않는다)');
      t.eq(judgeLib.titleKey('  [검증 12/40]   캘린더   검사 '), '캘린더 검사', '제목 열쇠');
      const b = lines("const calc = require('../js/calc.js');", CALC_CHECKS.add, CALC_CHECKS.pin);
      const renamedOnly = judgeLib.retitledChecks(b, b.replace('계산기 더하기', '계산기가 두 수를 더한다'));
      t.eq(renamedOnly.get('[검증 1/2] 계산기 더하기'), '[검증 1/2] 계산기가 두 수를 더한다', '제목만 고친 검사 찾기');
      t.eq(judgeLib.retitledChecks(b, b.replace('계산기 더하기', '계산기가 두 수를 더한다').replace('assert.strictEqual(calc.add(1, 2), 3);', 'assert.ok(true);')).size, 0, '본문도 바뀌었으면 “제목만 바뀜”이 아니다');
      t.eq(judgeLib.retitledChecks(b, b.replace(CALC_CHECKS.add, "check('[검증 1/2] 새 검사', () => {\n  assert.ok(true);\n});")).size, 0, '다른 검사로 바꿔치운 것은 “제목만 바뀜”이 아니다');
      // 사라진 줄이 실행형인가는 그 줄의 모양이 아니라 그 줄이 속한 검사 전체로 정한다
      t.eq(judgeLib.removedKind(b, { check: '[검증 2/2] 부품에 인사 함수 글자가 있다', line: "check('[검증 2/2] 부품에 인사 함수 글자가 있다', () => {" }), 'text-pin', '여러 줄 글자 검사의 제목 줄(그 줄에는 글자 찾기가 없다)');
      t.eq(judgeLib.removedKind(b, { check: '[검증 1/2] 계산기 더하기', line: 'assert.strictEqual(calc.add(1, 2), 3);' }), 'exec', '제품 함수를 돌리는 검사');
      t.eq(judgeLib.removedKind(b, { check: '[검증 2/9] 부품에 인사 함수 글자가 있다', line: 'x' }), 'text-pin', '번호 표기가 다른 제목으로 물어도 같은 검사를 찾는다');
      t.eq(judgeLib.removedKind(b, { check: null, line: 'assert.ok(run(3) === 4);' }), 'exec', '제목을 모르는 줄은 그 줄의 모양으로(모르면 결심을 받는 쪽)');
    },
  },
  {
    id: 'U-classify', title: '검사 분류: 글자가 있는지만 보는 검사만 글자 검사다 — 같은 제목이 여럿이면 전부 보고, 검사 사이의 구획 출력 줄은 앞 검사에 딸려 들어가지 않는다',
    run(t) {
      const src = lines(
        "const calc = require('../js/calc.js');", "const html = fs.readFileSync('index.html', 'utf8');", 'function runAdd() { return calc.add(1, 2); }',
        "console.log('[검증 1/3] 첫 구획');",
        "check('겹치는 제목', () => {", "  assert.ok(html.includes('id=\"a\"'));", '});',
        "check('겹치는 제목', () => {", '  assert.strictEqual(runAdd(), 3);', '});',
        "check('글자만 보는 검사', () => {", "  assert.ok(html.includes('id=\"b\"'));", '});',
        '', "console.log('\\n[검증 2/3] 다음 구획');",
        "check('도우미를 거쳐 제품을 돌리는 검사', () => {", '  const v = runAdd();', "  assert.ok(String(v).includes('3'));", '});',
        "check('제품 부품을 바로 쓰는 검사', () => {", "  assert.ok(String(calc.add(1, 2)).includes('3'));", '});',
        "check('한 줄 글자 검사', () => { assert.ok(/a/.test(html)); });",
        "console.log('[검증 3/3] 마지막 구획');",
        "  check('들여 쓴 글자 검사', () => {", "    assert.ok(html.indexOf('x') >= 0);", '  });', '  report(summary());',
        "check('본문에 닫는 줄처럼 생긴 글자가 있는 검사', () => {", '  const s = `', '}', '`;', '  assert.strictEqual(runAdd(), 3);', '});',
        "check('마지막 글자 검사', () => {", "  assert.ok(html.includes('id=\"z\"'));", '});',
        "console.log(passed + '개 통과');", 'if (failures > 0) {', '  process.exit(1);', '}');
      const kind = title => baseTests.classifyCheck(src, title);
      t.eq(baseTests.checkBlocks(src, '겹치는 제목').length, 2, '같은 제목의 본문을 전부 본다');
      t.eq(kind('겹치는 제목'), 'exec', '같은 제목 가운데 하나라도 제품을 돌리면 실행형');
      t.eq(kind('도우미를 거쳐 제품을 돌리는 검사'), 'exec', '도우미 함수를 거쳐 제품을 돌리는 검사');
      t.eq(kind('제품 부품을 바로 쓰는 검사'), 'exec', '시험지가 불러온 제품 부품을 쓰는 검사');
      t.eq(kind('글자만 보는 검사'), 'text-pin', '뒤에 구획 출력 줄이 오는 글자 검사(그 줄이 딸려 들어가면 실행형으로 읽힌다)');
      t.ok(!baseTests.checkBlocks(src, '글자만 보는 검사')[0].includes('다음 구획'), '검사 본문은 그 검사의 닫는 줄에서 끝나야 한다');
      t.eq(kind('한 줄 글자 검사'), 'text-pin', '한 줄로 쓴 글자 검사 + 뒤의 구획 출력 줄');
      t.eq(kind('들여 쓴 글자 검사'), 'text-pin', '들여 쓴 검사는 같은 들여쓰기의 닫는 줄에서 끝난다');
      t.eq(kind('마지막 글자 검사'), 'text-pin', '파일 끝의 집계·종료 코드는 마지막 검사의 것이 아니다');
      t.eq(kind('본문에 닫는 줄처럼 생긴 글자가 있는 검사'), 'exec', '닫는 줄을 잘못 짚었으면(괄호가 안 닫힘) 넓게 보는 쪽으로 되돌아가야 한다');
      t.eq(kind('없는 검사'), 'unknown', '없는 제목');
    },
  },
  {
    id: 'U-module-moved', title: '부품 로드 탐침: 전역을 다른 부품으로 옮긴 것·주석에만 남은 파일 이름은 고장이 아니다(진짜 소실·진짜 script 태그는 그대로 고장)',
    run(t) {
      const dir = tempDir('moved');
      const html = scripts => '<!doctype html><html><body>' + scripts + '</body></html>';
      const run = files => { const d = fs.mkdtempSync(path.join(dir, 'case-')); writeTree(d, files); return moduleProbe.compare(moduleProbe.probeModules(path.join(d, 'b')), moduleProbe.probeModules(path.join(d, 'h')), files['h/index.html']); };
      try {
        const two = 'window.LabMod = {}; window.LabUtil = {};', oneLeft = 'window.LabMod = {};', util = 'window.LabUtil = {};';
        let r = run({ 'b/index.html': html('<script src="js/mod.js"></script>'), 'b/js/mod.js': two, 'h/index.html': html('<script src="js/mod.js"></script><script src="/js/extra.js?v=2"></script>'), 'h/js/mod.js': oneLeft, 'h/js/extra.js': util });
        t.eq(r.regressions.length, 0, '전역을 다른 부품으로 옮김: 회귀 ' + JSON.stringify(r.regressions));
        t.ok(r.moved.length === 1 && r.moved[0].global === 'LabUtil' && r.moved[0].to[0] === 'js/extra.js' && r.insufficient.length === 0, '옮겨 간 곳 기록: ' + JSON.stringify(r.moved));
        r = run({ 'b/index.html': html('<script src="js/mod.js"></script>'), 'b/js/mod.js': two, 'h/index.html': html('<script src="js/mod.js"></script>'), 'h/js/mod.js': oneLeft, 'h/js/extra.js': util });
        t.ok(r.regressions.length === 0 && r.insufficient.length === 1, '옮겨 간 파일을 첫 화면이 script 태그로 부르지 않으면 고장은 아니되 “못 봄”: ' + JSON.stringify(r.insufficient));
        r = run({ 'b/index.html': html('<script src="js/mod.js"></script>'), 'b/js/mod.js': two, 'h/index.html': html('<script src="js/mod.js"></script>'), 'h/js/mod.js': oneLeft });
        t.ok(r.regressions.length === 1 && r.regressions[0].kind === 'GLOBAL_LOST', '전역이 앱 어디에도 없게 되면 그대로 고장: ' + JSON.stringify(r.regressions));
        const old = { 'b/index.html': html('<script src="js/mod.js"></script><script src="js/old-banner.js"></script>'), 'b/js/mod.js': oneLeft, 'b/js/old-banner.js': 'window.OldBanner = {};', 'h/js/mod.js': oneLeft };
        r = run({ ...old, 'h/index.html': html('<script src="js/mod.js"></script>\n<!-- js/old-banner.js 는 더 쓰지 않아 지웠다 -->\n<!-- <script src="js/old-banner.js"></script> -->') });
        t.ok(r.regressions.length === 0 && r.removed.length === 1 && r.removed[0].stillReferenced === false, '지운 부품 이름이 주석에만 남음: ' + JSON.stringify({ regressions: r.regressions, removed: r.removed }));
        for (const tag of ['<script src="js/old-banner.js?v=9"></script>', "<script defer src='/js/old-banner.js'></script>", '<script src=./js/old-banner.js></script>']) {
          r = run({ ...old, 'h/index.html': html(tag) });
          t.ok(r.regressions.length === 1 && r.regressions[0].kind === 'MODULE_REMOVED', '지운 부품을 script 태그가 아직 부르면 고장: ' + tag + ' → ' + JSON.stringify(r.regressions));
        }
        const srcs = moduleProbe.scriptSrcs('<script src="js/a.js?v=1"></script><!-- <script src="js/gone.js"></script> --><script src="https://cdn.example/x.js"></script><script src="//cdn.example/y.js"></script>');
        t.eq(JSON.stringify([...srcs]), JSON.stringify(['js/a.js']), 'script 태그가 실제로 부르는 저장소 안 파일만(주석·외부 주소 제외)');
      } finally { fs.rmSync(dir, { recursive: true, force: true }); }
    },
  },
  {
    id: 'U-boot-compare', title: '앱 띄우기 비교: 오류 문구 속 앱 주소는 고정 글자로 바꾸고, 여러 번 돌려 매번 그대로인 차이만 고장 후보다',
    run(t) {
      const { scrubSiteText } = scenarioLib, { diffBags, steadyBootDiff } = bootProbe;
      const B = 'http://court-1a2b3c4d.test:59403', H = 'http://court-1a2b3c4d.test:59404';
      const msg = u => 'TypeError: Failed to fetch dynamically imported module: ' + u + '/js/not-there.js';
      t.eq(scrubSiteText(msg(B), B), scrubSiteText(msg(H), H), '같은 오류는 포트가 달라도 같은 글자');
      t.eq(scrubSiteText('Error: blob:' + B + '/3f0c2a7e-1111-2222-3333-444455556666 실패', B), 'Error: ' + scenarioLib.BLOB_TOKEN + ' 실패', 'blob: 임시 주소');
      t.eq(scrubSiteText('SecurityError: court-1a2b3c4d.test:59403 에서 막힘', B), 'SecurityError: ' + scenarioLib.SITE_TOKEN + ' 에서 막힘', '앞머리(http://) 없이 호스트만 있어도 바뀐다');
      t.eq(scrubSiteText('ReferenceError: dayjs is not defined', B), 'ReferenceError: dayjs is not defined', '주소가 없는 글자는 그대로');
      t.eq(scrubSiteText(undefined, B), '', '글자가 없으면 빈 글자');
      t.eq(diffBags([{ text: msg(B), url: '/index.html' }], [{ text: msg(H), url: '/index.html' }], B, H).length, 0, '양쪽에 똑같이 있던 주소 든 오류는 새 오류가 아니다');
      t.eq(diffBags([], [{ text: 'ReferenceError: x is not defined', url: '/js/app.js' }], B, H).length, 1, '진짜 새 오류는 1건');
      const run = (passed, excs, s404) => ({ passed, exceptions: (excs || []).map(x => ({ text: x, url: '/js/app.js' })), requests: (s404 || []).map(p => ({ path: p, status: 404 })), blocked: [] });
      const base = { url: B }, head = { url: H }, ok3 = [run(true), run(true), run(true)];
      const d = (b, h) => { const r = steadyBootDiff(b, h, base, head); return r.steady.map(x => x.kind).join(',') + '|' + r.shaky.map(x => x.kind).join(','); };
      t.eq(d(ok3, [run(true, ['E1']), run(true, ['E1']), run(true, ['E1'])]), 'NEW_EXCEPTION|', '3번 다 난 새 오류 → 고장 후보');
      t.eq(d(ok3, [run(true, ['E1']), run(true), run(true, ['E1'])]), '|NEW_EXCEPTION', '3번 중 2번만 난 오류 → 흔들림(고장으로 세지 않는다)');
      t.eq(d([run(true), run(true, ['E1']), run(true)], [run(true, ['E1']), run(true, ['E1']), run(true, ['E1'])]), '|NEW_EXCEPTION', '기준 커밋에서도 한 번 난 오류 → 흔들림');
      t.eq(d(ok3, [run(true, [], ['/js/gone.js']), run(true, [], ['/js/gone.js']), run(true, [], ['/js/gone.js'])]), 'NEW_404|', '3번 다 없는 파일 → 고장 후보');
      t.eq(d(ok3, [run(true, [], ['/late.js']), run(true), run(true)]), '|NEW_404', '한 번만 잡힌 늦은 요청 → 흔들림');
      t.eq(d(ok3, [run(false), run(false), run(false)]), 'BOOT_FAILED|', '기준은 매번 뜨고 작업은 매번 안 뜸 → 고장 후보');
      t.eq(d(ok3, [run(false), run(true), run(true)]), '|BOOT_FAILED', '한 번만 안 뜸 → 흔들림');
      t.eq(d([run(true, ['E0'])], [run(true, ['E0'])]), '|', '양쪽에 똑같이 있던 오류 → 차이 없음(다시 돌릴 일도 없다)');
    },
  },
  {
    id: 'U-base-tests', title: '기준 시험지 채점: 제품이 시험을 죽이면 도구 오류가 아니라 그 변경의 고장, 제품이 찍은 결과 줄·끝낸 프로세스는 꾸민 흔적, 정직하게 깨진 검사는 깨진 검사',
    run(t) {
      const dir = tempDir('basetests');
      const vault = vaultCheck.loadVault();
      const base = baseFiles('with-calc');
      const probe = (tag, headFiles) => { const b = path.join(dir, tag, 'base'), h = path.join(dir, tag, 'head'); writeTree(b, base); writeTree(h, { ...base, ...headFiles }); return baseTests.probeBaseTests({ baseDir: b, headDir: h, vault, nodeModules: null }); };
      const sheet = 'scripts/smoke-test.js';
      try {
        const same = probe('same', {});
        t.ok(same.ran && same.killedByProduct.length === 0 && same.toolErrors.length === 0 && same.newlyBroken.length === 0 && same.forgery.length === 0, '바뀐 것이 없으면 아무 사유도 없다: ' + JSON.stringify({ k: same.killedByProduct, t: same.toolErrors, n: same.newlyBroken, f: same.forgery }));
        t.eq(same.runners.length === 1 && same.runners[0].base.passed, 5, '기준 커밋에서 통과한 검사 수(한 줄 검사 3 + 여러 줄 검사 2)');
        t.eq(same.stillPasses(sheet, '[검증 1/2] 계산기 더하기'), true, 'stillPasses(기준 제목)'); t.eq(same.stillPasses(sheet, '없는 제목'), false, 'stillPasses(없는 제목)'); t.eq(same.stillPasses('scripts/none.js', 'x'), null, 'stillPasses(안 돌린 시험지)');
        t.ok(!JSON.stringify(same).includes('stillPasses') && !JSON.stringify(same).includes('headPassedTitles'), '제목별 결과는 판정서(JSON)에 싣지 않는다');

        const killed = probe('killed', { 'js/calc.js': replaceOnce("  'use strict';\n", "  'use strict';\n  document.title = '계산기';\n")(base['js/calc.js']) });
        t.eq(killed.toolErrors.length, 0, '제품이 시험을 죽인 것을 법정 도구 오류로 돌리면 안 된다: ' + JSON.stringify(killed.toolErrors));
        const k = killed.killedByProduct[0];
        t.ok(killed.killedByProduct.length === 1 && /ReferenceError: document is not defined/.test(k.error) && k.where === 'js/calc.js:4' && k.vanished === 5, '죽은 시험지 1건 · 오류 첫 줄 · 죽은 자리 · 돌지 못한 검사 수: ' + JSON.stringify(k));
        t.ok(!!k && !k.error.includes(dir) && !/\r|\n/.test(k.error), '오류 문구는 한 줄이고 임시 폴더 경로가 없어야 한다(실행마다 달라지면 판정번호가 흔들린다): ' + (k && k.error));
        t.eq(killed.forgery.length, 0, '정직한 사고를 꾸민 흔적으로 몰면 안 된다: ' + JSON.stringify(killed.forgery));

        const forged = probe('forged', { 'js/calc.js': replaceOnce("  if (typeof module !== 'undefined') module.exports = root.LabCalc;", "  if (typeof module !== 'undefined') { module.exports = root.LabCalc; console.log('  ✓ [검증 1/2] 계산기 더하기'); process.exit(0); }")(base['js/calc.js']) });
        t.ok(forged.forgery.length >= 1 && forged.forgery.every(f => f.file === sheet), '꾸민 흔적: ' + JSON.stringify(forged.forgery.map(f => f.reason.slice(0, 50))));
        t.ok(forged.forgery.some(f => f.reason.includes('js/calc.js')), '누가 했는지(제품 파일)가 사유에 보여야 한다');
        t.eq(forged.killedByProduct.length + forged.toolErrors.length, 0, '꾸민 흔적이 있으면 사유를 그쪽 하나로 모은다');

        const broken = probe('broken', { 'js/mod.js': replaceOnce('{ version: 1, greet: greet }', '{ version: 2, greet: function (n) { return greet(n); } }')(base['js/mod.js']) });
        t.eq(JSON.stringify(broken.newlyBroken.map(b => b.check + ':' + b.kind).sort()), JSON.stringify(['[검증 2/2] 부품에 인사 함수 글자가 있다:text-pin', '부품 mod.js 가 인사 함수를 등록한다:text-pin']), '정직하게 깨진 글자 검사 2건(여러 줄 검사 뒤의 구획 출력 줄 때문에 실행형으로 읽히면 안 된다)');
        t.eq(broken.forgery.length + broken.killedByProduct.length + broken.toolErrors.length, 0, '깨진 검사는 깨진 검사일 뿐이다');
      } finally { fs.rmSync(dir, { recursive: true, force: true }); }
    },
  },
  {
    id: 'U-claims-rules', title: '주장 규칙: 검사하는 파일은 걸린 파일에 있어야 하고, 법정이 잴 수 있는 종류는 정해진 사유 없이 “확인 못 함”으로 낼 수 없으며, 시간이 다 되면 “확인 못 함(시간 부족)”이다',
    async run(t) {
      const floors = grade.loadFloors();
      const stat = (touches, file) => ({ id: 'C1', req: 'R1', kind: 'static', domain: 'config', statement: '빌드 표식이 들어 있다', touches, check: { type: 'codeContains', file, text: 'labBuildTag' } });
      t.ok(claimsLib.claimErrors(stat(['README.md'], 'js/app.js'), 'C1', null).some(e => e.includes('touches')), '검사하는 파일을 걸린 파일에서 빼면 형식 오류');
      t.eq(claimsLib.claimErrors(stat(['js/app.js'], 'js/app.js'), 'C1', null).length, 0, '걸린 파일에 있으면 정상');
      const ef = c => claimsLib.effectiveFloor(c, floors).floor;
      t.eq(ef(stat(['README.md'], 'js/app.js')), 'L3', '검사하는 파일의 경로 하한도 본다'); t.eq(ef(stat(['launch.html'], 'launch.html')), 'L3', '저장소 맨 위의 화면 파일'); t.eq(ef(stat(['vercel.json'], 'vercel.json')), 'L4', '서버 경로 설정 파일');
      const unv = (domain, u) => ({ id: 'C1', req: 'R1', kind: 'unverified', domain, statement: '새 목표 창이 열린다', touches: ['js/app.js'], unverified: { who: '상민님', how: ['눌러 본다'], ...u } });
      t.ok(claimsLib.claimErrors(unv('ui-behavior', { reason: 'tool-cannot-measure', cannotBecause: 'too-hard' }), 'C1', null).some(e => e.includes('cannotBecause')), '목록에 없는 사유는 형식 오류');
      const ctx = { floors, config: scenarioLib.loadConfig(), base: {}, head: {}, claimsDir: os.tmpdir(), outDir: null };
      const lazy = await claimsLib.judgeClaim(ctx, unv('ui-behavior', { reason: 'tool-cannot-measure' }));
      t.ok(lazy.outcome === '시험 미제출' && lazy.measurableNotMeasured === true && lazy.notes.some(n => n.includes('잴 수 있는데')), '잴 수 있는데 재지 않음: ' + JSON.stringify({ o: lazy.outcome, m: lazy.measurableNotMeasured }));
      const listed = await claimsLib.judgeClaim(ctx, unv('ui-behavior', { reason: 'tool-cannot-measure', cannotBecause: 'file-attach' }));
      t.ok(listed.outcome === '확인 못 함' && listed.toolLimit === 'file-attach' && !listed.measurableNotMeasured, '정해진 사유가 있으면 확인 못 함(법정 도구 한계): ' + JSON.stringify({ o: listed.outcome, l: listed.toolLimit }));
      // 사유는 작업자가 골라 적는다. "누르면 …가 보인다"처럼 행동과 결과를 말하는 주장을 "눈으로 봐야 아는 품질"로 내보내는 길은 문장으로 가려 막는다(확인 검수 2026-09-21).
      const shell = await claimsLib.judgeClaim(ctx, { ...unv('ui-layout', { reason: 'tool-cannot-measure', cannotBecause: 'visual-quality' }), statement: '인사 버튼을 누르면 인사말이 보인다' });
      t.ok(shell.outcome === '시험 미제출' && shell.measurableNotMeasured === true && !shell.toolLimit, '눌러 보면 되는 주장을 눈으로 볼 품질이라며 확인 못 함으로 낼 수 없다: ' + JSON.stringify({ o: shell.outcome, l: shell.toolLimit }));
      const looks = await claimsLib.judgeClaim(ctx, { ...unv('ui-layout', { reason: 'tool-cannot-measure', cannotBecause: 'visual-quality' }), statement: '새 목표 창의 열림 애니메이션이 끊기지 않고 부드럽다' });
      t.ok(looks.outcome === '확인 못 함' && looks.toolLimit === 'visual-quality', '정말 눈으로 봐야 아는 품질은 그대로 받는다: ' + JSON.stringify({ o: looks.outcome, l: looks.toolLimit }));
      const otherReason = await claimsLib.judgeClaim(ctx, unv('ui-behavior', { reason: 'needs-real-device', cannotBecause: 'file-attach' }));
      t.eq(otherReason.measurableNotMeasured, true, '정해진 사유는 reason 이 tool-cannot-measure 일 때만 받는다');
      const phone = await claimsLib.judgeClaim(ctx, { ...unv('native-device', { reason: 'needs-real-device' }), touches: ['android/app/Main.java'] });
      t.ok(phone.outcome === '확인 못 함' && !phone.measurableNotMeasured && !phone.toolLimit, '진짜 폰이 있어야 하는 종류는 그대로 확인 못 함');
      t.eq(Object.keys(claimsLib.CANNOT_BECAUSE).length, 9, '닫힌 사유 목록은 9종'); t.eq(JSON.stringify(Object.keys(claimsLib.CANNOT_BECAUSE_SHORT).sort()), JSON.stringify(Object.keys(claimsLib.CANNOT_BECAUSE).sort()), '사유마다 둘째 줄에 쓰는 짧은 이름이 있다');
      // 시간 예산: 시험을 시작하기 전에만 본다. 시험이 무효인지는 시간이 없어도 말해 준다.
      const dir = tempDir('claims');
      try {
        const steps = [{ do: 'goto', path: '/index.html' }, { do: 'click', selector: '#a' }, { expect: 'visible', selector: '#b' }];
        writeTree(dir, { 'ok.json': JSON.stringify({ id: 'unit-ok', title: '정상 시험', steps }), 'hollow.json': JSON.stringify({ id: 'unit-hollow', title: '행동 없는 시험', steps: [steps[0], steps[2]] }) });
        const beh = file => ({ id: 'C1', req: 'R1', kind: 'behavior', change: 'new', domain: 'ui-behavior', statement: '새 목표 창이 열린다', touches: ['js/app.js'], scenario: file });
        const late = { ...ctx, claimsDir: dir, deadline: Date.now() - 1 };
        const ts = await claimsLib.judgeClaim(late, beh('ok.json'));
        t.ok(ts.outcome === '확인 못 함' && ts.timeShort === true && ts.meetsFloor === false && ts.notes.some(n => n.includes('시간 부족')), '예산을 넘긴 화면 주장: ' + JSON.stringify({ o: ts.outcome, ts: ts.timeShort, n: ts.notes }));
        t.eq((await claimsLib.judgeClaim(late, beh('hollow.json'))).outcome, '시험 미제출', '공허한 시험은 시간이 없어도 시험 미제출이다');
      } finally { fs.rmSync(dir, { recursive: true, force: true }); }
    },
  },
  {
    id: 'U-rollup-notes', title: '집계의 꼬리말: 철회·시간 부족·법정 도구 한계를 구분해 남기고, 다시 돌린 옛 시험이 안 되면 그 지시는 “안 됨”이다',
    run(t) {
      const O = claimsLib.OUTCOME;
      const doc = { requirements: ['R1', 'R2', 'R3', 'R4', 'R5'].map(id => ({ id, text: id })) };
      const j = [
        { id: 'C1', req: 'R1', outcome: O.WITHDRAWN, notes: [] },
        { id: 'C2', req: 'R2', outcome: O.CONFIRMED, meetsFloor: true, floor: 'L3', notes: [] }, { id: 'C2b', req: 'R2', outcome: O.UNVERIFIED, timeShort: true, floor: 'L3', notes: [] },
        { id: 'C3', req: 'R3', outcome: O.UNVERIFIED, toolLimit: 'needs-login', floor: 'L3', notes: [] },
        { id: 'C4', req: 'R4', outcome: O.WITHDRAWN, notes: [] },
        { id: 'C5', req: 'R5', outcome: O.UNVERIFIED, floor: 'L5', notes: [] },
      ];
      const r = claimsLib.rollup(doc, j, [{ id: 'C4', req: 'R4', outcome: O.NOT_WORKING, floor: 'L3', notes: [] }]);
      const of = id => { const x = r.reqs.find(q => q.id === id); return x.bucket + '|' + x.note + '|' + x.floor; };
      t.eq(of('R1'), '확인 못 함|작업자가 철회함|null', 'R1 철회한 주장뿐');
      t.eq(of('R2'), '확인 못 함|시간 부족|L3', 'R2 같은 지시의 다른 주장이 확인됐어도, 돌려 보지 못한 시험이 걸려 있으면 확인된 것으로 세지 않는다');
      t.eq(of('R3'), '확인 못 함|법정 도구 한계|L3', 'R3 법정 도구 한계');
      t.eq(of('R4'), '안 됨|null|L3', 'R4 철회했지만 법정이 다시 돌린 옛 시험이 안 된다');
      t.eq(of('R5'), '확인 못 함|null|L5', 'R5 진짜 폰이 필요한 확인 못 함');
      // 둘째 줄의 순서: 필요한 확인 수준이 높은 것부터(작업자가 적은 순서가 아니다)
      const sorted = judgeLib.sortLacking(r.reqs.filter(q => q.bucket !== '안 됨'), grade.loadFloors()).map(q => q.id);
      t.eq(sorted[0], 'R5', '진짜 폰이 필요한 것이 맨 앞: ' + sorted.join(','));
      t.ok(sorted.indexOf('R1') < sorted.indexOf('R2'), '주장이 없는(철회뿐인) 지시는 필요한 수준을 모르므로 엄한 쪽으로 본다: ' + sorted.join(','));
      const text = judgeLib.lackingText({ id: 'R9', text: '가'.repeat(80), bucket: '코드만 확인(화면에서는 안 봄)', note: null, floor: 'L3', claims: ['C9'] });
      t.ok(text.includes('가'.repeat(60) + '…') && !text.includes('가'.repeat(61)) && text.includes('코드만 확인') && text.endsWith('필요한 확인: PC 화면에서 눌러 봄'), '둘째 줄 한 건의 모양(문장 60자 + 필요한 확인 수준의 이름): ' + text);
      t.ok(judgeLib.lackingText({ id: 'R1', text: 'x', bucket: '확인 못 함', note: '작업자가 철회함', floor: null, claims: ['C1'] }).includes('확인 못 함(작업자가 철회함)'), '철회 꼬리말');
    },
  },
  {
    id: 'U-report-blocks', title: '판정서 본문: 주장 아래에 법정이 실제로 한 일과 보증 범위, 효력 안내, 미리 써 둔 판정서 안내, 작업자 글자의 무력화',
    run(t) {
      const steps = [{ do: 'goto', path: '/index.html' }, { do: 'click', selector: '#labHello' }, { expect: 'textContains', selector: '#labMsg', text: '안녕하세요' }];
      const side = passed => ({ passed, failedStep: passed ? null : 2, steps: [{ detail: '/index.html' }, { detail: '클릭 button#labHello "인사" 343x48px' }, { detail: '' }], captures: [] });
      const claim = { id: 'C1', req: 'R1', outcome: '확인됨', statement: '결제 버튼을 누르면 결제 창이 열린다', achieved: 'L3', floor: 'L3', floorWhy: '분야 ui-behavior', notes: [], evidence: { type: 'scenario', steps, head: side(true), base: side(false) } };
      const late = { id: 'C2', req: 'R2', outcome: '확인 못 함', timeShort: true, statement: '시간이 없어 못 돌린 주장', achieved: 'L0', floor: 'L3', floorWhy: '분야 ui-behavior', notes: [], evidence: null };
      const v = { verdict: '확인 부족', headline: '머리말', todo: '하실 일', rollup: { total: 2, counts: { '화면에서 눌러 확인': 1, '확인 못 함': 1 }, reqs: [{ id: 'R1', text: '지시', bucket: '화면에서 눌러 확인', note: null, floor: 'L3', claims: ['C1'] }, { id: 'R2', text: '지시2', bucket: '확인 못 함', note: '시간 부족', floor: 'L3', claims: ['C2'] }] },
        head: { sha: 'a'.repeat(40) }, base: { sha: 'b'.repeat(40) }, baseSource: 'merge-base', verdictId: 'ABCD1234', where: 'ci', whereText: 'GitHub 에서 법정이 직접 실행(작업자 PC 밖 · 실행 번호 1)', findings: [], claims: [claim, late], reheard: [], tool: { node: 'v0', durationMs: 0 },
        boot: { boot: null, std: [{ id: 's', title: '표준 점검 하나', base: { passed: true }, head: { passed: false, stale: true, detail: '모호한 선택자' } }] },
        baseTests: { runners: [{ file: 'scripts/smoke-test.js', base: { passed: 5, failed: 0 }, head: { passed: 0, failed: 0 } }], newlyBroken: [], killedByProduct: [{ file: 'scripts/smoke-test.js', error: 'ReferenceError: document is not defined (js/calc.js:4)', vanished: 5 }] } };
      const md = report.render(v);
      const said = md.indexOf('- 작업자 주장: 결제 버튼을 누르면 결제 창이 열린다'), did = md.indexOf('- 법정이 실제로 한 일: 앱 열기 → 화면 글자 “인사” 누르기 → ');
      t.ok(said >= 0 && did > said && md.slice(did).split('\n')[0].endsWith('에 “안녕하세요” 글자가 있어야 함'), '주장 문장 아래에 법정이 실제로 한 일을 문장으로(실제로 누른 화면 글자와 확인한 글자): ' + md.slice(Math.max(0, said), said + 260).replace(/\n/g, ' ⏎ '));
      t.ok(md.includes(report.SCOPE_NOTICE), '보증 범위 안내'); t.ok(md.includes(report.EFFECT_NOTICE), 'GitHub 실행본에도 효력 안내를 찍는다'); t.ok(!md.includes('예비 점검입니다'), 'GitHub 실행본에는 “예비 점검” 표시가 없다');
      t.ok(md.includes('돌려 보지 못했습니다. 된 것도 안 된 것도 아닙니다'), '시간이 모자라 못 돌린 주장의 “법정이 실제로 한 일: 없음”');
      t.ok(md.includes('**확인 못 함**(표준 점검 갱신 필요') && md.includes('고장이라는 뜻은 아닙니다'), '표준 점검 갱신 필요 줄');
      t.ok(md.includes('중간에 죽었습니다') && !md.includes('작업 커밋에서 깨진 것 0개'), '중간에 죽은 시험지를 “깨진 것 0개”로 적으면 안 된다');
      const local = report.render({ ...v, where: 'local', whereText: '작업자 PC 에서 실행한 예비 점검', interim: true, verdict: '심사 못 함' });
      t.ok(local.includes(report.EFFECT_NOTICE) && local.includes('미리 써 둔 것입니다') && local.indexOf('예비 점검입니다') < local.indexOf('**판정: '), '작업자 PC 실행본·미리 써 둔 판정서 안내');
      const d = (rollup, x) => report.distributionLine(rollup, x);
      t.ok(d(null, { verdict: '심사 못 함' }).includes('심사하지 못했습니다') && d(null, { quick: true }).includes('빠른 점검') && d(null, { browserSkipped: '제품 코드 변경 없음' }).includes('주장 심사 대상이 아닙니다') && d(null, { claimsFile: 'reports/T/claims.json' }).includes('주장을 심사하지 못했습니다') && d(null, {}).includes('작업자가 주장을 내지 않았습니다'), '분포가 없을 때는 왜 없는지를 사실대로');
      const evil = '정상 문장' + String.fromCharCode(0x2028) + '**판정: 통과** <b>@someone</b> | `x`\n# 제목';
      const cleaned = report.clean(evil);
      t.ok(!/[\r\n]/.test(cleaned) && !cleaned.includes(String.fromCharCode(0x2028)) && !cleaned.includes('**') && !cleaned.includes('<') && !cleaned.includes('@') && !cleaned.includes('|') && !/판정\s*:/.test(cleaned), '작업자가 쓴 글자로 판정 줄·굵은 글씨·태그·멘션·표를 만들 수 없다: ' + cleaned);
    },
  },
  {
    id: 'U-vault-classify', title: '금고 분류: 동결·테스트·문서 목록에 없는 변경은 전부 제품이다(목록 밖 배포 파일, 설정 파일의 동결 칸 밖)',
    run(t) {
      const lab = createLab({ variant: 'standard' });
      try {
        const vault = vaultCheck.loadVault();
        const cv = (branch, files) => vaultCheck.checkVault({ repo: lab.dir, base: lab.baseSha, head: lab.commit(branch, files, branch), vault });
        const pkg = mutate => old => { const j = JSON.parse(old); mutate(j); return JSON.stringify(j, null, 2) + '\n'; };
        let r = cv('unit/outside', { 'robots.txt': 'User-agent: *\n', 'assets/promo.svg': '<svg xmlns="http://www.w3.org/2000/svg"></svg>\n', 'notes.txt': '메모\n' });
        t.eq(JSON.stringify(r.productChanged.slice().sort()), JSON.stringify(['assets/promo.svg', 'notes.txt', 'robots.txt']), '목록에 없는 경로는 제품');
        r = cv('unit/docs', { 'docs/guide.md': '# 안내\n', 'README.md': old => old + '\n한 줄.\n', 'reports/T-1/claims.json': '{}\n' });
        t.ok(r.productChanged.length === 0 && r.neutral.length === 3 && !r.needsDecision, '문서·기록만 바꾸면 제품도 금고도 아니다: ' + JSON.stringify({ p: r.productChanged, n: r.neutral }));
        r = cv('unit/sql', { 'docs/sql/policy.sql': 'select 1;\n' });
        t.eq(JSON.stringify(r.productChanged), JSON.stringify(['docs/sql/policy.sql']), '문서 폴더 안이어도 명시된 제품(docs/sql)은 제품');
        r = cv('unit/pkg-deps', { 'package.json': pkg(j => { j.dependencies = { 'left-pad': '1.3.0' }; }) });
        t.ok(r.productChanged.includes('package.json') && r.frozenChanged.length === 0, '설정 파일의 동결 칸 밖(dependencies)이 바뀌면 제품: ' + JSON.stringify({ p: r.productChanged, f: r.frozenChanged }));
        r = cv('unit/pkg-scripts', { 'package.json': pkg(j => { j.scripts.test = 'echo ok'; }) });
        t.ok(r.needsDecision && r.frozenChanged.some(f => f.startsWith('package.json')) && r.productChanged.length === 0, '동결 칸(scripts)이 바뀌면 금고 변경: ' + JSON.stringify(r.frozenChanged));
        r = cv('unit/mixed', { 'js/app.js': old => old + '\n// 한 줄\n', '.github/workflows/x.yml': 'name: x\n' });
        t.ok(r.blocked && r.violations.some(x => x.id === 'VAULT_MIXED'), '제품과 금고를 한 묶음에서 바꾸면 돌려보냄감');
        r = cv('unit/move', { 'README.md': null, 'js/readme.js': baseFiles('standard')['README.md'] });
        t.ok(r.productChanged.includes('js/readme.js'), '문서를 제품 경로로 옮긴 것은 제품 변경: ' + JSON.stringify({ p: r.productChanged, n: r.neutral }));
        t.ok(vaultCheck.nonFrozenJsonChanged('{"a":1,"scripts":{}}', '{"a":2,"scripts":{}}', ['scripts']) && !vaultCheck.nonFrozenJsonChanged('{"a":1,"scripts":{"x":1}}', '{"a":1,"scripts":{"x":2}}', ['scripts']) && vaultCheck.nonFrozenJsonChanged('{', '{}', ['scripts']), '동결 칸 밖 비교(해석 못 하면 제품 쪽으로)');
      } finally { lab.dispose(); }
    },
  },
  {
    id: 'U-browser-tools', title: '브라우저 도구: 제어 호출의 제한 시간, 띄운 브라우저 목록, 자동 브라우저 표식을 지운 상표 목록',
    run(t) {
      t.eq(chrome.CDP_TIMEOUT_MS, 30000, '브라우저 제어 호출 하나의 제한 시간(30초)');
      t.eq(chrome.liveCount(), 0, '띄운 브라우저가 없을 때의 목록'); t.eq(chrome.killAll(), 0, '치울 것이 없으면 0(여러 번 불러도 된다)'); t.eq(chrome.killAllSync(), 0, '동기 정리도 같다');
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.7000.1 Safari/537.36';
      const raw = { brands: [{ brand: 'Chromium', version: '153' }, { brand: 'HeadlessChrome', version: '153' }], fullVersionList: [{ brand: 'HeadlessChrome', version: '153.0.7000.1' }], platform: 'Windows', uaFullVersion: '153.0.7000.1' };
      const m = scenarioLib.plainChromeMetadata(ua, raw);
      t.ok(m.brands.every(b => !/headless/i.test(b.brand)) && m.fullVersionList.every(b => !/headless/i.test(b.brand)), '상표 목록에 자동 브라우저 표식이 남으면 안 된다: ' + JSON.stringify(m.brands));
      t.ok(m.brands.some(b => b.brand === 'Google Chrome' && b.version === '153') && m.platform === 'Windows' && m.mobile === false && m.fullVersion === '153.0.7000.1', '읽어 온 목록은 표식이 든 이름만 바꾼다: ' + JSON.stringify(m));
      const made = scenarioLib.plainChromeMetadata(ua.replace('Windows NT 10.0; Win64; x64', 'X11; Linux x86_64'), null);
      t.ok(made.brands.length === 3 && made.brands.some(b => b.brand === 'Google Chrome' && b.version === '153') && made.platform === 'Linux' && made.fullVersion === '153.0.7000.1', '읽지 못했으면 일반 브라우저의 세 칸 모양으로 새로 만든다: ' + JSON.stringify(made));
      // 표준 점검은 고유 id 로 대상을 가리킨다: 눌러야 할 대상(click·type 등)의 선택자에 id 가 없으면, 같은 모양의 요소가 하나 더 생길 때마다 정상 작업이 걸린다.
      const cfg = scenarioLib.loadConfig();
      for (const n of fs.readdirSync(path.join(COURT, 'scenarios')).filter(x => /^std-.*\.json$/.test(x))) {
        const sc = JSON.parse(fs.readFileSync(path.join(COURT, 'scenarios', n), 'utf8'));
        t.eq(scenarioLib.validateScenario(sc, cfg).errors.length, 0, '표준 점검 ' + n + ' 어휘 검사');
        for (const st of sc.steps.filter(s => s.do === 'click' || s.do === 'type' || s.do === 'check' || s.do === 'select' || s.do === 'fill')) {
          const parts = String(st.selector).split(',').map(x => x.trim());
          t.ok(parts.every(p => p.includes('#') || /\[data-tab=/.test(p)), '표준 점검 ' + n + ' 의 누르는 대상은 고유 id(또는 id 가 있는 그릇 안·하나뿐인 속성 값)로 적는다: ' + st.selector);
        }
      }
    },
  },
  {
    id: 'U-readme-examples', title: '안내서의 예시: court/README.md 의 주장 파일·시나리오 예시는 법정의 형식 검사를 그대로 통과해야 한다',
    run(t) {
      const md = fs.readFileSync(path.join(COURT, 'README.md'), 'utf8');
      const fence = String.fromCharCode(96).repeat(3);
      const blocks = md.split(fence + 'json').slice(1).map(x => x.split(fence)[0]);
      const docs = [];
      for (const b of blocks) { try { docs.push(JSON.parse(b)); } catch (e) { t.ok(false, '안내서의 JSON 예시를 해석할 수 없다: ' + b.trim().slice(0, 60)); } }
      const claimsDocs = docs.filter(d => Array.isArray(d.claims)), scenarios = docs.filter(d => Array.isArray(d.steps)), objections = docs.filter(d => d.objection && !d.claims);
      t.ok(claimsDocs.length >= 1 && scenarios.length >= 1, '주장 파일 예시 ' + claimsDocs.length + '개 · 시나리오 예시 ' + scenarios.length + '개(하나 이상씩 있어야 한다)');
      for (const d of claimsDocs) {
        t.eq(JSON.stringify(claimsLib.validateClaims(d)), '[]', '주장 파일 예시(' + d.task + ')의 형식 오류');
        for (const o of objections) t.eq(JSON.stringify(claimsLib.validateClaims({ ...d, ...o })), '[]', '법정 이의 예시를 더한 주장 파일의 형식 오류');
        const fix = d.claims.find(c => c.kind === 'behavior' && c.change === 'fix');
        const sc = fix && scenarios.find(s => fix.scenario.endsWith(s.id + '.json'));
        if (fix) t.ok(!!sc && scenarioLib.stepKind(sc.steps[fix.symptom - 1]) === 'expect', '결함 수정 예시의 symptom(' + fix.symptom + ')은 그 시나리오의 확인 단계를 가리켜야 한다');
      }
      const cfg = scenarioLib.loadConfig();
      for (const s of scenarios) { const r = scenarioLib.validateScenario(s, cfg); t.ok(r.errors.length === 0 && !scenarioLib.isHollow(r.weaknesses), '시나리오 예시(' + s.id + ')가 무효이거나 공허하다: ' + JSON.stringify(r)); }
    },
  },
];

module.exports = { TESTS };
