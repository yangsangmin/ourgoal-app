'use strict';
// 법정 자가시험 — 단위 시험(브라우저 불필요). 법정의 부품 하나하나가 "가짜가 새는 구멍"이 아닌지 직접 찔러 본다.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

const COURT = path.join(__dirname, '..');
const strip = require('../lib/strip');
const grade = require('../lib/grade');
const vaultCheck = require('../vault-check');
const scenarioLib = require('../lib/scenario');
const claimsLib = require('../claims');
const report = require('../report');
const staticServer = require('../lib/static-server');

// 브라우저와 달리 경로를 정규화하지 않는 날것의 요청을 보낸다(../ 탈출·금지 경로 우회를 그대로 찔러 보기 위해).
function rawGet(port, rawPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: rawPath, method: 'GET' }, res => {
      let body = ''; res.setEncoding('utf8');
      res.on('data', c => { body += c; }); res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject); req.end();
  });
}

const UNIT_TESTS = [
  {
    id: 'U-strip-js', title: 'strip: JS 주석은 지우고 문자열·템플릿·정규식 리터럴 안의 // 는 남긴다',
    run(t) {
      const s = strip.stripJsComments;
      t.ok(!s('var a = 1; // sanitizeInput(x)').includes('sanitizeInput'), '줄 주석 안의 글자가 남아 있다');
      t.ok(!s('/* sanitizeInput(x)\n 둘째 줄 */ var a = 1;').includes('sanitizeInput'), '블록 주석 안의 글자가 남아 있다');
      t.eq(s('a /* x\ny\nz */ b\n// c\nd').split('\n').length, 5, '줄 수가 보존돼야 한다(줄 번호가 밀리면 안 된다)');
      const str = s('var u = "http://a.b/c"; var k = 1; // 가림');
      t.ok(str.includes('"http://a.b/c"') && str.includes('k = 1') && !str.includes('가림'), '문자열 안의 // 를 주석으로 오인: ' + str);
      const tpl = s('var t = `a // b ${x} /* c */`; var z = 3; // 가림');
      t.ok(tpl.includes('a // b') && tpl.includes('/* c */') && tpl.includes('z = 3') && !tpl.includes('가림'), '템플릿 문자열 처리: ' + tpl);
      const re1 = s('var re = /https?:\\/\\//; var real = 1; // 가림');
      t.ok(re1.includes('real = 1') && !re1.includes('가림'), '정규식 리터럴(이스케이프된 //) 처리: ' + re1);
      const re2 = s('var re = /["\']/g; // 가림\nvar keep = 2;');
      t.ok(re2.includes('keep = 2') && !re2.includes('가림'), '정규식 리터럴 안의 따옴표를 문자열 시작으로 오인: ' + re2);
      const re3 = s('var re = /[/]x*/; var after = 1; // 가림');
      t.ok(re3.includes('after = 1') && !re3.includes('가림'), '정규식 문자 클래스 안의 / 처리: ' + re3);
      const div = s('var x = a / b; var y = c / d; // 가림');
      t.ok(div.includes('a / b') && div.includes('c / d') && !div.includes('가림'), '나눗셈을 정규식으로 오인: ' + div);
      const esc = s("var q = 'it\\'s // not comment'; var w = 1; // 가림");
      t.ok(esc.includes('not comment') && esc.includes('w = 1') && !esc.includes('가림'), '이스케이프된 따옴표 처리: ' + esc);
    },
  },
  {
    id: 'U-strip-html', title: 'strip: HTML 주석과 <script>·<style> 블록 안의 주석을 걷어낸다',
    run(t) {
      const out = strip.stripByExt('index.html', '<!-- sanitizeInput( -->\n<div id="a"></div>\n<script>// 가린함수(\nvar shown = 1; /* 가린블록( */\n</script>\n<style>/* cssHidden */ .a { color: red; }</style>');
      t.ok(!out.includes('sanitizeInput('), 'HTML 주석이 남아 있다');
      t.ok(!out.includes('가린함수(') && !out.includes('가린블록('), '<script> 안 JS 주석이 남아 있다');
      t.ok(out.includes('shown = 1') && out.includes('id="a"'), '진짜 코드가 지워졌다');
      t.ok(!out.includes('cssHidden') && out.includes('color: red'), '<style> 안 CSS 주석 처리');
      t.eq(strip.stripByExt('a.json', '{"a": "// 그대로"}'), '{"a": "// 그대로"}', 'JSON 은 건드리지 않는다');
      t.ok(!strip.stripByExt('a.css', '/* hidden */ .x{}').includes('hidden'), 'CSS 주석');
      t.ok(!strip.stripByExt('A.JS', 'x(); // hidden').includes('hidden'), '확장자 대소문자');
    },
  },
  {
    id: 'U-static-claim', title: '글자 확인(static): 주석뿐인 구현·공백만 바꾼 JSON 은 “아직 안 됨”',
    run(t) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'court-unit-static-'));
      try {
        fs.writeFileSync(path.join(dir, 'app.js'), '// sanitizeInput(v) 적용\nfunction save(v) { return v; }\n', 'utf8');
        fs.writeFileSync(path.join(dir, 'cap.json'), '{"server":{"cleartext":true}}', 'utf8');
        const j = (check) => claimsLib.judgeStatic({ check }, dir);
        t.eq(j({ type: 'codeContains', file: 'app.js', text: 'sanitizeInput(' }).ok, false, '주석에만 있는 글자로 codeContains 통과');
        t.eq(j({ type: 'codeContains', file: 'app.js', text: 'function save' }).ok, true, '진짜 코드의 글자는 찾아야 한다');
        t.eq(j({ type: 'codeNotContains', file: 'app.js', text: 'sanitizeInput(' }).ok, true, 'codeNotContains 도 주석을 걷어내고 본다');
        t.eq(j({ type: 'jsonPath', file: 'cap.json', path: 'server.cleartext', equals: false }).ok, false, '값이 true 인데 false 주장 통과');
        t.eq(j({ type: 'jsonPath', file: 'cap.json', path: 'server.cleartext', equals: true }).ok, true, 'jsonPath 참');
        t.eq(j({ type: 'jsonPath', file: 'cap.json', path: 'server.missing', equals: false }).ok, false, '없는 키를 false 와 같다고 보면 안 된다');
        t.eq(j({ type: 'fileExists', file: 'nope.js' }).ok, false, '없는 파일');
      } finally { fs.rmSync(dir, { recursive: true, force: true }); }
    },
  },
  {
    id: 'U-vault-glob', title: '금고 glob: court/** · .github/** 는 중첩 경로까지, *.js 는 한 단계만',
    run(t) {
      const g = vaultCheck.globToRegExp;
      for (const p of ['court/judge.js', 'court/lib/git.js', 'court/selftest/run.js', 'court/a/b/c/d.json']) t.ok(g('court/**').test(p), 'court/** 가 ' + p + ' 를 못 잡는다');
      for (const p of ['courtx/judge.js', 'src/court/judge.js', 'court']) t.ok(!g('court/**').test(p), 'court/** 가 ' + p + ' 를 잘못 잡는다');
      t.ok(g('.github/**').test('.github/workflows/court.yml') && g('.github/**').test('.github/CODEOWNERS'), '.github/** 중첩 경로');
      t.ok(!g('.github/**').test('xgithub/workflows/a.yml'), '.github 의 점이 아무 글자로 풀리면 안 된다');
      const v = g('scripts/verify-*.js');
      t.ok(v.test('scripts/verify-x.js') && v.test('scripts/verify-integrity-gate.js'), 'scripts/verify-*.js 기본');
      t.ok(!v.test('scripts/verify-x.json') && !v.test('scripts/verify-xjs'), '확장자의 점이 아무 글자로 풀리면 안 된다');
      t.ok(!v.test('scripts/sub/verify-x.js') && !v.test('scripts/verify-a/b.js'), '* 하나는 / 를 넘지 않는다(중첩 경로는 ** 로만)');
      t.ok(!v.test('scripts/verify.js'), 'scripts/verify-*.js 는 하이픈 없는 scripts/verify.js 를 잡지 않는다');
      // 실제 금고 목록으로: 검증기처럼 생긴 새 스크립트는 "동결"이든 "자기가 낸 시험"이든 어느 한쪽에는 반드시 걸려야 한다.
      const vault = vaultCheck.loadVault();
      const frozen = vaultCheck.matcher(vault.frozen), verifierLike = vaultCheck.matcher(vault.verifierLike);
      for (const p of ['scripts/verify.js', 'scripts/verify-x.js', 'scripts/check-118.js', 'scripts/audit-all.js', 'scratch/verify118.js', 'tools/gate.js']) t.ok(frozen(p) || verifierLike(p), p + ' 가 동결에도 검증기 목록에도 안 걸린다');
      for (const p of ['court/judge.js', 'court/vault.json', 'court/selftest/run.js', '.github/workflows/court.yml', '.githooks/pre-push', 'AGENTS.md', 'docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md']) t.ok(frozen(p), p + ' 가 동결 목록에 안 걸린다');
      t.ok(!frozen('js/app.js') && !frozen('index.html'), '제품 코드가 동결로 잡히면 모든 작업이 돌려보내진다');
      t.ok(vaultCheck.matcher(vault.product)('js/reactions.js') && vaultCheck.matcher(vault.product)('index.html'), '제품 코드 목록');
    },
  },
  {
    id: 'U-removed-assertions', title: '단언 비교: 이동·공백 변경은 무시하고 삭제·완화만 잡는다',
    run(t) {
      const base = "const assert = require('assert');\nassert.ok(a === 1, 'a');\nassert.ok(b === 2, 'b');\ncheck('c 가 3', () => { assert.strictEqual(c, 3); });\nif (failures) process.exit(1);\n";
      const r = vaultCheck.removedAssertions;
      t.eq(r(base, base).length, 0, '같은 파일');
      t.eq(r(base, "const assert = require('assert');\n\n  assert.ok(b === 2, 'b');\n      assert.ok(a  ===  1,   'a');\ncheck('c 가 3', () => { assert.strictEqual(c, 3); });\nif (failures) process.exit(1);\n").length, 0, '줄 순서 이동·들여쓰기·공백 변경은 삭제가 아니다');
      t.eq(r(base, base + "assert.ok(d === 4, 'd');\n").length, 0, '단언 추가는 자유다');
      const del = r(base, base.replace("assert.ok(b === 2, 'b');\n", ''));
      t.ok(del.length === 1 && del[0].line.includes('b === 2'), '단언 1줄 삭제를 못 잡는다: ' + JSON.stringify(del));
      const weak = r(base, base.replace('assert.strictEqual(c, 3)', 'assert.ok(true)'));
      t.ok(weak.length === 1 && weak[0].line.includes('strictEqual'), '단언 완화(고쳐 쓰기)를 못 잡는다: ' + JSON.stringify(weak));
      t.ok(r(base, base.replace('if (failures) process.exit(1);\n', '')).length === 1, '실패 종료(process.exit(1)) 삭제를 못 잡는다');
      const dup = "assert.ok(x);\nassert.ok(x);\n";
      t.eq((r(dup, 'assert.ok(x);\n')[0] || {}).count, 1, '같은 단언 2개 중 1개 삭제(다중집합)');
      t.eq(r(base, base.replace("assert.ok(a === 1, 'a');", "// assert.ok(a === 1, 'a');")).length, 1, '단언을 주석 처리한 것도 삭제다');
    },
  },
  {
    id: 'U-scenario-vocab', title: '시나리오 닫힌 어휘: 어휘 밖 동작·키·경로·상태 주입은 전부 무효',
    run(t) {
      const cfg = scenarioLib.loadConfig();
      const base = [{ do: 'goto', path: '/index.html' }, { do: 'click', selector: '#a' }, { expect: 'visible', selector: '#b' }];
      const make = steps => ({ id: 'unit-sc', title: '단위 시험', steps });
      const errs = s => scenarioLib.validateScenario(s, cfg).errors;
      t.eq(errs(make(base)).length, 0, '정상 시나리오가 무효로 나온다: ' + JSON.stringify(errs(make(base))));
      const bad = [
        ['임의 코드 실행(do: eval)', make(base.concat([{ do: 'eval', code: 'openModal()' }]))],
        ['임의 코드 실행(do: evaluate)', make(base.concat([{ do: 'evaluate', script: 'x' }]))],
        ['어휘에 없는 expect', make(base.concat([{ expect: 'jsTruthy', expr: '1' }]))],
        ['허용 안 된 키(click.script)', make([base[0], { do: 'click', selector: '#a', script: 'x()' }, base[2]])],
        ['허용 안 된 키(expect.eval)', make([base[0], base[1], { expect: 'visible', selector: '#b', eval: '1' }])],
        ['허용 안 된 최상위 키', { id: 'unit-sc', title: 't', steps: base, setup: 'x()' }],
        ['do 와 expect 를 한 단계에', make([base[0], { do: 'click', selector: '#a', expect: 'visible' }, base[2]])],
        ['goto 경로 밖(/scratch/demo.html)', make([{ do: 'goto', path: '/scratch/demo.html' }, base[1], base[2]])],
        ['goto 쿼리', make([{ do: 'goto', path: '/index.html?demo=1' }, base[1], base[2]])],
        ['goto 해시', make([{ do: 'goto', path: '/index.html#modal' }, base[1], base[2]])],
        ['goto 외부 주소', make([{ do: 'goto', path: 'https://example.com/' }, base[1], base[2]])],
        ['goto 없음', make([base[1], base[2]])],
        ['seedLocalStorage 값 직접 기재', make([{ do: 'seedLocalStorage', entries: { a: '1' } }].concat(base))],
        ['seedLocalStorage 금고에 없는 이름', make([{ do: 'seedLocalStorage', fixture: 'no-such-fixture' }].concat(base))],
        ['seedLocalStorage 를 goto 뒤에', make([base[0], { do: 'seedLocalStorage', fixture: 'guest-fresh' }, base[1], base[2]])],
        ['확인 대상 body', make([base[0], base[1], { expect: 'visible', selector: 'body' }])],
        ['확인 대상 html', make([base[0], base[1], { expect: 'exists', selector: ' HTML ' }])],
        ['확인 대상 *', make([base[0], base[1], { expect: 'count', selector: '*', min: 1 }])],
        ['어휘에 없는 키 입력', make([base[0], { do: 'key', key: 'F12' }, base[2]])],
        ['click position 밖', make([base[0], { do: 'click', selector: '#a', position: 'anywhere' }, base[2]])],
        ['wait 상한 초과', make([base[0], base[1], { do: 'wait', ms: 600000 }, base[2]])],
        ['timeoutMs 상한 초과', make([base[0], base[1], { expect: 'visible', selector: '#b', timeoutMs: 9999999 }])],
        ['selector 누락', make([base[0], { do: 'click' }, base[2]])],
        ['id 형식', { id: 'Bad Id!', title: 't', steps: base }],
        ['title 누락', { id: 'unit-sc', steps: base }],
        ['steps 61개', make([base[0]].concat(Array.from({ length: 60 }, () => ({ do: 'wait', ms: 1 }))))],
        ['capture 이름', make(base.concat([{ capture: '../../evil' }]))],
        ['시나리오가 배열', []],
      ];
      for (const [name, s] of bad) t.ok(errs(s).length > 0, '무효여야 하는데 통과: ' + name);
      const weak = s => scenarioLib.validateScenario(s, cfg).weaknesses;
      t.ok(scenarioLib.isHollow(weak(make([base[0], { expect: 'visible', selector: '#b' }]))), '행동 없는 시나리오가 공허로 안 잡힌다(W3)');
      t.ok(scenarioLib.isHollow(weak(make([base[0], base[1], { expect: 'noExceptions' }, { expect: 'stillInApp' }, { expect: 'exists', selector: '#b' }]))), '약한 확인만 있는 시나리오가 공허로 안 잡힌다(W2)');
      t.ok(scenarioLib.isHollow(weak(make([base[0], { expect: 'visible', selector: '#b' }, base[1], { expect: 'noExceptions' }]))), '마지막 행동 뒤 확인 없는 시나리오가 공허로 안 잡힌다(W1)');
      t.ok(!scenarioLib.isHollow(weak(make(base))), '정상 시나리오가 공허로 잡힌다');
      // 다중 계정(L4) 및 기기 모의(L5) 어휘 검증
      const multiActorValid = make([
        base[0],
        { do: 'spawnPeer', path: '/index.html' },
        { do: 'click', actor: 'peer', selector: '#a' },
        { expect: 'visible', actor: 'peer', selector: '#b' },
        { do: 'closePeer' },
        { expect: 'visible', selector: '#b' }
      ]);
      t.eq(errs(multiActorValid).length, 0, '정상 다중 계정 시나리오가 무효: ' + JSON.stringify(errs(multiActorValid)));
      t.ok(!scenarioLib.isHollow(weak(multiActorValid)), '정상 다중 계정 시나리오가 공허로 잡힌다');

      const deviceValid = make([
        base[0],
        { do: 'virtualKeyboard', visible: true, height: 280 },
        { expect: 'visible', selector: '#b' },
        { do: 'hardwareBack' },
        { expect: 'notVisible', selector: '#b' }
      ]);
      t.eq(errs(deviceValid).length, 0, '정상 기기 모의 시나리오가 무효: ' + JSON.stringify(errs(deviceValid)));
      t.ok(!scenarioLib.isHollow(weak(deviceValid)), '정상 기기 모의 시나리오가 공허로 잡힌다');

      // 무효 사례 검증: spawnPeer 전에 peer actor 지정, 두 번 spawnPeer, 닫을 peer 없는 closePeer, 잘못된 actor, 잘못된 virtualKeyboard
      t.ok(errs(make([base[0], { do: 'click', actor: 'peer', selector: '#a' }, base[2]])).length > 0, 'spawnPeer 전 peer actor 지정');
      t.ok(errs(make([base[0], { do: 'spawnPeer' }, { do: 'spawnPeer' }, base[2]])).length > 0, 'spawnPeer 중복 생성');
      t.ok(errs(make([base[0], { do: 'closePeer' }, base[2]])).length > 0, '닫을 peer 없는 closePeer');
      t.ok(errs(make([base[0], { do: 'click', actor: 'other', selector: '#a' }, base[2]])).length > 0, '잘못된 actor');
      t.ok(errs(make([base[0], { do: 'virtualKeyboard', visible: 'yes' }, base[2]])).length > 0, 'virtualKeyboard.visible 타입 오류');
      t.ok(errs(make([base[0], { do: 'virtualKeyboard', visible: true, height: 50 }, base[2]])).length > 0, 'virtualKeyboard.height 범위 미달');
      // 법정 자신의 표준 점검도 같은 어휘 검사를 통과해야 한다.
      for (const n of fs.readdirSync(path.join(COURT, 'scenarios')).filter(x => /^std-.*\.json$/.test(x))) {
        const r = scenarioLib.validateScenario(JSON.parse(fs.readFileSync(path.join(COURT, 'scenarios', n), 'utf8')), cfg);
        t.ok(r.errors.length === 0 && !scenarioLib.isHollow(r.weaknesses), '표준 점검 ' + n + ' 가 무효·공허: ' + JSON.stringify(r));
      }
      // 제목·id·캡처 이름만 바꾼 복제는 같은 지문이어야 한다(부풀리기 집계 방지).
      const fp = scenarioLib.scenarioFingerprint;
      t.eq(fp({ id: 'a-1', title: '가', steps: base.concat([{ capture: 'x' }]) }), fp({ id: 'b-2', title: '나', steps: base.concat([{ capture: 'y' }]) }), '제목만 바꾼 시나리오의 지문이 다르다');
      t.ok(fp(make(base)) !== fp(make([base[0], base[1], { expect: 'visible', selector: '#c' }])), '다른 시나리오의 지문이 같다');
    },
  },
  {
    id: 'U-claims-format', title: '주장 파일: 등급·판정을 작업자가 적으면 형식 오류',
    run(t) {
      const ok = { task: 'UNIT-1', requirements: [{ id: 'R1', text: '지시' }], claims: [{ id: 'C1', req: 'R1', kind: 'static', domain: 'config', statement: '설정값이 맞다', touches: ['a.json'], check: { type: 'fileExists', file: 'a.json' } }] };
      t.eq(claimsLib.validateClaims(ok).length, 0, '정상 주장 파일이 오류: ' + JSON.stringify(claimsLib.validateClaims(ok)));
      for (const k of ['grade', 'verdict', 'outcome', 'passed', 'level']) {
        const doc = JSON.parse(JSON.stringify(ok)); doc.claims[0][k] = 'L5';
        t.ok(claimsLib.validateClaims(doc).some(e => e.includes('"' + k + '"')), '"' + k + '" 를 적었는데 형식 오류가 아니다');
      }
      const noReq = JSON.parse(JSON.stringify(ok)); noReq.requirements = [];
      t.ok(claimsLib.validateClaims(noReq).length > 0, '지시 항목 없는 주장 파일');
      const fixNoSymptom = JSON.parse(JSON.stringify(ok)); fixNoSymptom.claims[0] = { id: 'C1', req: 'R1', kind: 'behavior', change: 'fix', domain: 'ui-behavior', statement: '결함을 고쳤다', touches: ['js/a.js'], scenario: 's.json' };
      t.ok(claimsLib.validateClaims(fixNoSymptom).some(e => e.includes('symptom')), 'fix 주장에 symptom 이 없어도 통과');
      const escape = JSON.parse(JSON.stringify(fixNoSymptom)); escape.claims[0].symptom = 3; escape.claims[0].scenario = '../../court/scenarios/std-tab-switch.json';
      t.ok(claimsLib.validateClaims(escape).length > 0, '시나리오 경로 탈출(..)');
    },
  },
  {
    id: 'U-floor', title: '확인 수준 하한: 분야를 낮게 적어도 걸린 파일·문장 낱말로 다시 올린다',
    run(t) {
      const floors = grade.loadFloors();
      const ef = c => claimsLib.effectiveFloor(c, floors);
      const rls = ef({ domain: 'config', statement: 'RLS 로 타인 비공개 목표 조회 차단', touches: ['js/app.js'] });
      t.eq(rls.floor, 'L4', 'RLS 낱말 → 진짜 계정끼리 주고받아 봄'); t.eq(rls.raised, true, 'RLS 상향 표시'); t.eq(rls.declaredFloor, 'L1', '선언 분야(config)의 하한');
      t.eq(ef({ domain: 'config', statement: '정책 파일을 추가했다', touches: ['docs/sql/policy.sql'] }).floor, 'L4', 'docs/sql 경로');
      t.eq(ef({ domain: 'config', statement: '서버 함수를 고쳤다', touches: ['api/push.js'] }).floor, 'L4', 'api 경로');
      t.eq(ef({ domain: 'ui-behavior', statement: '안드로이드 뒤로가기 처리', touches: ['android/app/src/Main.java'] }).floor, 'L5', 'android 경로');
      t.eq(ef({ domain: 'config', statement: '평문 통신을 껐다', touches: ['capacitor.config.json'] }).floor, 'L5', 'capacitor.config.json 경로');
      t.eq(ef({ domain: 'config', statement: '버튼을 누르면 진동이 울린다', touches: ['js/app.js'] }).floor, 'L5', '실기기 낱말(진동)');
      t.eq(ef({ domain: 'config', statement: '응원을 보내면 상대방 화면에 실시간으로 뜬다', touches: ['js/app.js'] }).floor, 'L4', '실시간 낱말');
      t.eq(ef({ domain: 'no-such-domain', statement: '무언가를 했다', touches: ['x.txt'] }).floor, floors.unknownDomainFloor, '모르는 분야는 가장 엄격한 쪽으로');
      const plain = ef({ domain: 'ui-behavior', statement: '새 목표 창이 열린다', touches: ['js/app.js'] });
      t.eq(plain.floor, 'L3', '화면 동작 하한'); t.eq(plain.raised, false, '올릴 이유가 없으면 올리지 않는다');
      t.eq(ef({ domain: 'native-device', statement: '설정값', touches: ['a.json'] }).floor, 'L5', '선언 분야가 더 높으면 그대로');
    },
  },
  {
    id: 'U-grade', title: '확인 수준 비교(meets): 모르는 등급은 어느 쪽에 와도 충족이 아니다',
    run(t) {
      t.eq(grade.meets('L3', 'L3'), true, 'L3 ≥ L3'); t.eq(grade.meets('L5', 'L4'), true, 'L5 ≥ L4'); t.eq(grade.meets('L1', 'L1'), true, 'L1 ≥ L1');
      t.eq(grade.meets('L4', 'L4'), true, 'L4 ≥ L4'); t.eq(grade.meets('L5', 'L5'), true, 'L5 ≥ L5');
      t.eq(grade.meets('L3', 'L4'), false, 'L3 < L4'); t.eq(grade.meets('L4', 'L5'), false, 'L4 < L5');
      t.eq(grade.meets('L1', 'L3'), false, 'L1 < L3'); t.eq(grade.meets('L0', 'L1'), false, 'L0 < L1');
      t.eq(grade.meets('L3', 'L9'), false, '모르는 하한'); t.eq(grade.meets('L9', 'L0'), false, '모르는 달성 등급'); t.eq(grade.meets(undefined, undefined), false, '둘 다 없음'); t.eq(grade.meets('L5', ''), false, '빈 하한');
      t.eq(grade.label('L5'), '진짜 폰에서 해 봄', 'L5 이름'); t.eq(grade.label('L4'), '진짜 계정끼리 주고받아 봄', 'L4 이름'); t.eq(grade.label('L3'), 'PC 화면에서 눌러 봄', 'L3 이름');
      t.ok(grade.GRADES.every((g, i) => g.rank === i && g.id === 'L' + i), '등급 표 순서');
    },
  },
  {
    id: 'U-rollup', title: '집계: 분모는 지시 항목 수, 복제 시험은 1건, 안 된 주장이 섞이면 “안 됨”',
    run(t) {
      const doc = { requirements: [{ id: 'R1', text: 'a' }, { id: 'R2', text: 'b' }, { id: 'R3', text: 'c' }, { id: 'R4', text: 'd' }] };
      const O = claimsLib.OUTCOME;
      const j = [
        { id: 'C1', req: 'R1', outcome: O.CONFIRMED, meetsFloor: true, fingerprint: 'same', notes: [] },
        { id: 'C2', req: 'R2', outcome: O.CONFIRMED, meetsFloor: true, fingerprint: 'same', notes: [] },
        { id: 'C3', req: 'R3', outcome: O.CONFIRMED, meetsFloor: true, notes: [] }, { id: 'C4', req: 'R3', outcome: O.NOT_WORKING, meetsFloor: false, notes: [] },
      ];
      const r = claimsLib.rollup(doc, j);
      t.eq(r.total, 4, '분모는 지시 항목 수'); t.eq(j[1].duplicateOf, 'C1', '복제 표시');
      const b = id => r.reqs.find(x => x.id === id).bucket;
      t.eq(b('R1'), '화면에서 눌러 확인', 'R1'); t.eq(b('R2'), '확인 못 함', 'R2(복제뿐인 지시)'); t.eq(b('R3'), '안 됨', 'R3(확인됨과 안 됨이 섞이면 안 됨)'); t.eq(b('R4'), '확인 못 함', 'R4(주장 없는 지시)');
    },
  },
  {
    id: 'U-report-first-lines', title: '판정서 첫 네 줄: 판정 → 상민님이 하실 일 → 분포 → 심사 대상',
    run(t) {
      const v = { verdict: '돌려보냄', headline: '되던 기능 1개가 고장 났습니다', todo: '없음.', rollup: { total: 2, counts: { '화면에서 눌러 확인': 1, '안 됨': 1 }, reqs: [] }, head: { sha: 'a'.repeat(40) }, base: { sha: 'b'.repeat(40) }, baseSource: 'merge-base', verdictId: 'ABCD1234', whereText: '작업자 PC 에서 실행한 예비 점검', where: 'local', findings: [], claims: [], tool: { node: 'v0', durationMs: 0 } };
      const lines = report.firstLines(v);
      t.eq(lines.length, 4, '첫 블록은 정확히 4줄');
      t.ok(lines[0].startsWith('판정: '), '1줄: ' + lines[0]); t.ok(lines[1].startsWith('상민님이 하실 일: '), '2줄: ' + lines[1]);
      t.ok(lines[0].includes('돌려보냄'), '1줄에 판정 낱말');
      t.ok(lines[2].includes('2건') && lines[2].includes('화면에서 눌러 확인 1') && lines[2].includes('안 됨 1'), '3줄 분포: ' + lines[2]);
      t.ok(lines[3].includes('aaaaaaa') && lines[3].includes('bbbbbbb') && lines[3].includes('ABCD1234'), '4줄 심사 대상: ' + lines[3]);
      t.ok(!lines.join('\n').match(/100%|PERFECT|ALL PASS/i), '첫 네 줄에 100%·PERFECT·ALL PASS 가 없어야 한다');
      const manual = report.firstLines({ ...v, baseSource: 'manual' });
      t.ok(manual[3].includes('손으로 지정'), '기준점을 손으로 바꾸면 4줄에 표시: ' + manual[3]);
      const md = report.render(v);
      t.ok(md.includes('예비 점검') && md.includes('판정 효력이 없습니다'), '작업자 PC 실행본에는 “예비 점검 — 판정 효력 없음”이 찍혀야 한다');
      t.ok(md.indexOf('예비 점검') < md.indexOf('판정: '), '그 표시는 판정 줄보다 위에 있어야 한다');
      const none = report.firstLines({ ...v, rollup: null });
      t.ok(none.length === 4 && /없음/.test(none[2]), '주장이 없을 때도 4줄: ' + none[2]);
    },
  },
  {
    id: 'U-static-server', title: '법정 서버: 배포 안 되는 경로(denyPrefixes)와 폴더 밖(../)은 내주지 않는다',
    async run(t) {
      const outer = fs.mkdtempSync(path.join(os.tmpdir(), 'court-unit-srv-'));
      const root = path.join(outer, 'site');
      fs.mkdirSync(path.join(root, 'scratch'), { recursive: true }); fs.mkdirSync(path.join(root, 'js'), { recursive: true });
      fs.writeFileSync(path.join(root, 'index.html'), '<h1>site</h1>', 'utf8');
      fs.writeFileSync(path.join(root, 'js', 'a.js'), 'var a = 1;', 'utf8');
      fs.writeFileSync(path.join(root, 'scratch', 'demo.html'), 'STAGED-DEMO', 'utf8');
      fs.writeFileSync(path.join(outer, 'secret.txt'), 'OUTSIDE-SECRET', 'utf8');
      const cfg = scenarioLib.loadConfig();
      const srv = await staticServer.start(root, cfg.denyServePrefixes);
      try {
        const get = p => rawGet(srv.port, p);
        t.eq((await get('/index.html')).status, 200, '/index.html'); t.eq((await get('/')).status, 200, '/ → index.html'); t.eq((await get('/js/a.js?v=1')).status, 200, '쿼리 붙은 정상 요청');
        t.eq((await get('/nope.js')).status, 404, '없는 파일');
        for (const p of ['/scratch/demo.html', '/SCRATCH/demo.html', '/scratch%2Fdemo.html', '/%73cratch/demo.html']) { const r = await get(p); t.ok(r.status === 404 && !r.body.includes('STAGED-DEMO'), '금지 경로가 열렸다: ' + p + ' → ' + r.status); }
        for (const p of ['/../secret.txt', '/%2e%2e/secret.txt', '/js/../../secret.txt', '/..%2fsecret.txt', '/..%5csecret.txt', '/js/..%5c..%5csecret.txt']) { const r = await get(p); t.ok(r.status !== 200 && !r.body.includes('OUTSIDE-SECRET'), '폴더 밖 파일이 열렸다: ' + p + ' → ' + r.status); }
        // 금지 경로 검사는 "정규화한 뒤"에 해야 한다. 아니면 같은 파일을 가리키는 다른 표기로 연출 페이지를 불러올 수 있다.
        for (const p of ['/./scratch/demo.html', '//scratch/demo.html', '/js/../scratch/demo.html', '/%5Cscratch/demo.html', '/scratch%5Cdemo.html']) { const r = await get(p); t.ok(!r.body.includes('STAGED-DEMO'), '금지 경로를 다른 표기로 우회: ' + p + ' → ' + r.status); }
        t.ok(srv.requests.some(r => r.denied), '거절 기록이 남아야 한다');
      } finally { await srv.close(); fs.rmSync(outer, { recursive: true, force: true }); }
    },
  },
  {
    id: 'U-module-probe', title: '부품 로드 탐침: 로드 즉시 예외·전역 소실은 회귀, 양쪽 다 죽으면 회귀가 아니라 “못 봄”',
    run(t) {
      const probe = require('../probes/module-load');
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'court-unit-mod-'));
      try {
        const w = (side, name, code) => { const fp = path.join(dir, side, 'js', name); fs.mkdirSync(path.dirname(fp), { recursive: true }); fs.writeFileSync(fp, code, 'utf8'); };
        w('base', 'ok.js', 'window.A = { v: 1 };'); w('head', 'ok.js', 'window.A = { v: 2 };');
        w('base', 'dies.js', 'window.B = 1;'); w('head', 'dies.js', 'init(); window.B = 1;');
        w('base', 'lost.js', 'window.C = 1;'); w('head', 'lost.js', 'var localOnly = 1;');
        w('base', 'both.js', 'notDefinedAnywhere();'); w('head', 'both.js', 'notDefinedAnywhere();');
        w('head', 'new.js', 'window.N = 1;');
        const r = probe.compare(probe.probeModules(path.join(dir, 'base')), probe.probeModules(path.join(dir, 'head')));
        const kinds = r.regressions.map(x => x.file + ':' + x.kind).sort();
        t.eq(JSON.stringify(kinds), JSON.stringify(['js/dies.js:LOAD_THROWS', 'js/lost.js:GLOBAL_LOST']), '회귀 목록');
        t.ok(r.insufficient.some(x => x.file === 'js/both.js'), '양쪽 다 죽는 부품은 “못 봄”으로 남긴다');
        t.ok((r.regressions.find(x => x.file === 'js/dies.js') || {}).detail.includes('ReferenceError'), '예외 종류가 사유에 보인다');
      } finally { fs.rmSync(dir, { recursive: true, force: true }); }
    },
  },
];

// [별표↔JSON 대조] 헌법 정본의 [별표 2]·[별표 3]이 grade-floors.json·vault.json 과 같은가. 모듈이 없으면 건너뛰지 않고 실패로 센다.
const APPENDIX_TEST = {
  id: 'A-appendix', title: '별표↔JSON 대조: 헌법 정본의 [별표 2]·[별표 3]이 grade-floors.json·vault.json 과 같다',
  run(t) {
    let appendix;
    try { appendix = require('../appendix'); }
    catch (e) { t.ok(false, '실패(appendix.js 없음) — court/appendix.js 를 불러올 수 없다: ' + String((e && e.message) || e).split('\n')[0]); return; }
    if (typeof appendix.check !== 'function') { t.ok(false, '실패(appendix.js 에 check 함수가 없다)'); return; }
    const constitution = path.join(COURT, '..', 'docs', 'rules', 'OURGOAL_ABSOLUTE_INTEGRITY_RULES.md');
    const r = appendix.check(constitution);
    const list = ((r && r.mismatches) || []).map(m => (typeof m === 'string' ? m : JSON.stringify(m)));
    t.ok(!!r && r.ok === true && list.length === 0, '헌법 정본과 JSON 이 다르다(' + constitution + '): ' + (list.slice(0, 4).join(' / ') || '사유 없음'));
  },
};

// 검수 반영분(법정 속이기·헌법↔구현·정상 작업 오판)과 법정 댓글 이력의 단위 시험은 파일을 나눠 두었다.
UNIT_TESTS.push(...require('./unit-review').TESTS, ...require('./unit-chat').TESTS);

module.exports = { UNIT_TESTS, APPENDIX_TEST };
