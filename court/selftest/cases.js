'use strict';
// 법정 자가시험 — 가짜·정직 사례집.
// 사례마다 합성 저장소에 작업 커밋을 쌓고, 법정(judge)을 프로그램으로 불러 판정·사유·주장별 결과를 단언한다.
// 기대값은 "법정이 지금 내는 값"이 아니라 "가짜가 걸러지려면 나와야 하는 값"이다. 어긋나면 기대값을 낮추지 말고 법정을 고친다.
const fs = require('node:fs');
const path = require('node:path');
const { insertAt, replaceOnce, MARK, SMOKE_CHECKS } = require('./lab');

const OK_BUCKETS = ['화면에서 눌러 확인', '글자만 확인(이 종류는 그걸로 충분)']; // 지시 항목이 "확인된 것"으로 세지는 칸
const COURT_DIR = path.join(__dirname, '..');

// ───────────── 시나리오·주장 조립 도구 ─────────────
// 실제 앱과 같은 진입 경로: 첫 화면 → "로그인 없이 둘러보기" → 홈. 법정의 표준 점검(court/scenarios/std-*.json)과 같은 머리말이다.
const PRE = [
  { do: 'goto', path: '/index.html' },
  { do: 'waitFor', selector: '#btnLandingPreviewDirect' },
  { do: 'click', selector: '#btnLandingPreviewDirect' },
  { do: 'waitFor', selector: '#homeAddGoal' },
];
const scenario = (id, title, steps, noPre) => ({ id, title, steps: (noPre ? [] : PRE).concat(steps) });
const json = o => JSON.stringify(o, null, 2) + '\n';

// 제품 코드를 "무해하게" 한 줄 바꾼다. 제품 변경이 없으면 법정은 화면 점검·주장 심사를 하지 않으므로, 주장 단위 가짜에는 이 한 줄이 꼭 있어야 한다.
const touchApp = tag => ({ 'js/app.js': insertAt(MARK.initExtra, "var labBuildTag_" + tag + " = '" + tag + "';") });

// 정직한 새 기능: 인사 버튼을 누르면 인사말이 보인다.
const helloFeature = () => ({
  'index.html': insertAt(MARK.homeExtra, '<button id="labHello" class="labbtn" type="button">인사</button>'),
  'js/app.js': insertAt(MARK.initExtra, "$('labHello').addEventListener('click', function () { $('labMsg').textContent = window.LabMod ? window.LabMod.greet('법정') : '안녕하세요'; });"),
});
const helloSteps = cap => [{ do: 'click', selector: '#labHello' }, { expect: 'textContains', selector: '#labMsg', text: '안녕하세요' }, { capture: cap || 'hello' }];
// 취소 버튼으로 새 목표 창 닫기. 머리말 4단계 + 아래 4단계 → "창이 사라져야 함"은 8번째 단계다.
const cancelSteps = [{ do: 'click', selector: '#homeAddGoal' }, { expect: 'visible', selector: '#modalOverlay.active' }, { do: 'click', selector: '#ngCancelBtn' }, { expect: 'notVisible', selector: '#modalOverlay.active' }];
const CANCEL_SYMPTOM_STEP = PRE.length + 4;

function claimsDoc(task, reqs, claims) { return json({ task, requirements: reqs, claims }); }
function behavior(id, req, change, statement, touches, scenarioFile, extra) { return { id, req, kind: 'behavior', change, domain: 'ui-behavior', statement, touches, scenario: scenarioFile, ...(extra || {}) }; }

// ───────────── 판정 읽기 도구 ─────────────
const rejects = v => v.findings.filter(f => f.severity === 'reject');
const findFinding = (v, severity, titleRe, textPart) => v.findings.find(f => (!severity || f.severity === severity) && titleRe.test(f.title) && (!textPart || f.text.includes(textPart)));
const claimOf = (v, id) => (v.claims || []).find(c => c.id === id) || null;
const bucketOf = (v, reqId) => { const r = v.rollup && v.rollup.reqs.find(x => x.id === reqId); return r ? r.bucket : null; };
const stdTitle = file => JSON.parse(fs.readFileSync(path.join(COURT_DIR, 'scenarios', file), 'utf8')).title;

function expectReject(t, v, titleRe, textPart, label) {
  t.eq(v.verdict, '돌려보냄', label + ' — 판정');
  t.ok(!!findFinding(v, 'reject', titleRe, textPart), label + ' — 돌려보낸 이유에 ' + titleRe + (textPart ? ' + “' + textPart + '”' : '') + ' 가 있어야 한다. 실제 사유: ' + JSON.stringify(rejects(v).map(f => f.title)));
}
function expectNotCounted(t, v, reqId, label) {
  const b = bucketOf(v, reqId);
  t.ok(b !== null && !OK_BUCKETS.includes(b), label + ' — 지시 ' + reqId + ' 가 확인된 것으로 세지면 안 된다. 실제 칸: ' + JSON.stringify(b));
}

// ───────────── 단독 사례(사례 하나 = 작업 커밋 하나 = 법정 실행 1회) ─────────────
// mode: quick(화면 점검 없이 충분한 가짜) · full(화면까지 봐야 하는 가짜·정직)
const CASES = [
  {
    id: 'H1', honest: true, mode: 'full', title: '정직: 새 기능(인사 버튼 → 인사말)을 주장 + 시나리오로 제출',
    build(lab) {
      return { head: lab.commit('case/h1', [helloFeature(), {
        'reports/LAB-H1/claims.json': claimsDoc('LAB-H1', [{ id: 'R1', text: '인사 버튼을 누르면 인사말이 보이게 해 달라' }], [behavior('C1', 'R1', 'new', '인사 버튼을 누르면 인사말이 보인다', ['index.html', 'js/app.js'], 'hello.json')]),
        'reports/LAB-H1/hello.json': json(scenario('lab-hello', '인사 버튼을 누르면 인사말이 보인다', helloSteps())),
      }], 'H1 새 기능: 인사 버튼') };
    },
    check(t, v) {
      t.eq(v.verdict, '통과', 'H1 판정(정직한 작업이 막히면 오탐이다)');
      t.eq(rejects(v).length, 0, 'H1 돌려보낸 이유 개수: ' + JSON.stringify(rejects(v).map(f => f.title)));
      const c = claimOf(v, 'C1');
      t.eq(c && c.outcome, '확인됨', 'H1 주장 C1');
      t.eq(c && c.meetsFloor, true, 'H1 주장 C1 필요 수준 충족');
      t.eq(bucketOf(v, 'R1'), '화면에서 눌러 확인', 'H1 지시 R1 칸');
      // 법정에 표준 점검이 새로 생겼는데 실험실의 작은 앱이 그 선택자 계약을 못 따라가면, 그 점검은 "기준 커밋에서도 실패 → 회귀 비교 불가"로 조용히 빠진다.
      // 그러면 가짜(F6 계열)를 넣어도 걸릴 점검이 없는 것이다. 그래서 정직 사례에서 "표준 점검 전부가 기준·작업 양쪽에서 통과"를 같이 단언한다.
      const stdFiles = fs.readdirSync(path.join(COURT_DIR, 'scenarios')).filter(n => /^std-.*.json$/.test(n));
      const std = (v.boot && v.boot.std) || [];
      t.eq(std.length, stdFiles.length, 'H1 실행된 표준 점검 수(법정의 std-*.json 개수와 같아야 한다)');
      const unusable = std.filter(s => !s.base.passed || !s.head.passed).map(s => s.id + '(기준 ' + (s.base.passed ? '통과' : '실패@' + s.base.failedStep) + '/작업 ' + (s.head.passed ? '통과' : '실패@' + s.head.failedStep) + ')');
      t.eq(unusable.length, 0, 'H1 실험실의 작은 앱에서 못 쓰는 표준 점검(lab.js 의 선택자 계약을 법정에 맞춰야 한다): ' + unusable.join(', '));
    },
  },
  {
    id: 'H2', honest: true, mode: 'full', lab: 'cancel-broken', title: '정직: 실제 결함(취소 버튼이 창을 안 닫음) 수정을 fix + symptom 으로 제출',
    build(lab) {
      return { head: lab.commit('case/h2', {
        'js/app.js': replaceOnce(MARK.cancelWire, "$('ngCancelBtn').addEventListener('click', closeModal);"),
        'reports/LAB-H2/claims.json': claimsDoc('LAB-H2', [{ id: 'R1', text: '취소 버튼을 누르면 새 목표 창이 닫혀야 한다' }], [behavior('C1', 'R1', 'fix', '취소 버튼을 눌러도 새 목표 창이 안 닫히던 결함을 고쳤다', ['js/app.js'], 'cancel.json', { symptom: CANCEL_SYMPTOM_STEP })]),
        'reports/LAB-H2/cancel.json': json(scenario('lab-cancel', '새 목표 창에서 취소를 누르면 창이 닫힌다', cancelSteps.concat([{ capture: 'closed' }]))),
      }, 'H2 결함 수정: 취소 버튼') };
    },
    check(t, v) {
      t.eq(v.verdict, '통과', 'H2 판정(정직한 결함 수정이 막히면 오탐이다)');
      const c = claimOf(v, 'C1');
      t.eq(c && c.outcome, '확인됨', 'H2 주장 C1');
      const b = c && c.evidence && c.evidence.base;
      t.ok(!!b && b.passed === false && b.failKind === 'expect' && b.failedStep === CANCEL_SYMPTOM_STEP, 'H2 기준 커밋에서 지정한 증상 단계(' + CANCEL_SYMPTOM_STEP + ')로 실패해야 한다. 실제: ' + JSON.stringify(b && { passed: b.passed, failKind: b.failKind, failedStep: b.failedStep }));
      t.eq(bucketOf(v, 'R1'), '화면에서 눌러 확인', 'H2 지시 R1 칸');
    },
  },
  {
    id: 'F1', mode: 'full', title: '거짓 Before: 기준 커밋에서도 통과하는 시험을 결함 수정(fix)으로 주장',
    build(lab) {
      return { head: lab.commit('case/f1', [touchApp('F1'), {
        'reports/LAB-F1/claims.json': claimsDoc('LAB-F1', [{ id: 'R1', text: '취소 버튼을 누르면 새 목표 창이 닫혀야 한다' }], [behavior('C1', 'R1', 'fix', '취소 버튼을 눌러도 새 목표 창이 안 닫히던 결함을 고쳤다', ['js/app.js'], 'cancel.json', { symptom: CANCEL_SYMPTOM_STEP })]),
        'reports/LAB-F1/cancel.json': json(scenario('lab-cancel', '새 목표 창에서 취소를 누르면 창이 닫힌다', cancelSteps)),
      }], 'F1 거짓 Before') };
    },
    check(t, v) {
      const c = claimOf(v, 'C1');
      t.eq(c && c.outcome, '고칠 게 없었음', 'F1 주장 C1');
      t.eq(bucketOf(v, 'R1'), '고칠 게 없었음', 'F1 지시 R1 칸');
      t.ok(!(v.rollup && v.rollup.counts['화면에서 눌러 확인']), 'F1 “화면에서 눌러 확인” 으로 세지면 안 된다: ' + JSON.stringify(v.rollup && v.rollup.counts));
      t.ok(v.verdict !== '심사 못 함', 'F1 도구 오류 없이 심사돼야 한다: ' + v.headline);
      // 고칠 게 없었던 지시를 "필요한 수준으로 확인했다"고 첫 줄에서 말하면, 거짓 Before 가 첫 줄에서는 확인된 일로 읽힌다.
      t.ok(!/모두 필요한 수준으로 확인/.test(v.headline || ''), 'F1 첫 줄이 고칠 게 없었던 지시를 “모두 필요한 수준으로 확인”이라고 말하면 안 된다. 실제 첫 줄: ' + v.verdict + ' — ' + v.headline);
    },
  },
  {
    id: 'F2', mode: 'full', title: '결함 재현 없는 fix: 작업 커밋에만 있는 선택자를 써서 기준 커밋이 행동 단계에서 멈춤',
    build(lab) {
      return { head: lab.commit('case/f2', [helloFeature(), {
        'reports/LAB-F2/claims.json': claimsDoc('LAB-F2', [{ id: 'R1', text: '인사 버튼을 누르면 인사말이 보여야 한다' }], [behavior('C1', 'R1', 'fix', '인사 버튼을 눌러도 인사말이 안 보이던 결함을 고쳤다', ['index.html', 'js/app.js'], 'hello.json', { symptom: PRE.length + 2 })]),
        'reports/LAB-F2/hello.json': json(scenario('lab-hello', '인사 버튼을 누르면 인사말이 보인다', helloSteps())),
      }], 'F2 결함 재현 없는 fix') };
    },
    check(t, v) {
      const c = claimOf(v, 'C1');
      t.eq(c && c.outcome, '시험 미제출', 'F2 주장 C1');
      t.ok(!!c && c.notes.some(n => n.includes('재현되지 않았다')), 'F2 “기준 커밋에서 결함이 재현되지 않았다” 참고가 있어야 한다: ' + JSON.stringify(c && c.notes));
      expectNotCounted(t, v, 'R1', 'F2');
      t.eq(v.verdict, '확인 부족', 'F2 판정');
    },
  },
  {
    id: 'F3', mode: 'quick', title: '로드 즉시 죽는 부품: js/mod.js 가 정의 안 된 함수를 부름',
    build(lab) { return { head: lab.commit('case/f3', { 'js/mod.js': replaceOnce("  window.LabMod = { version: 1, greet: greet };", "  init();\n  window.LabMod = { version: 1, greet: greet };") }, 'F3 로드 즉시 죽는 부품') }; },
    check(t, v) { expectReject(t, v, /^되던 부품이 고장 남$/, 'js/mod.js', 'F3'); t.ok(!!findFinding(v, 'reject', /부품이 고장/, 'ReferenceError'), 'F3 사유에 ReferenceError 가 보여야 한다'); },
  },
  {
    id: 'F4', mode: 'quick', title: '예외 없이 전역 등록만 사라짐: window.LabMod 등록을 지역 변수로 바꿈',
    build(lab) { return { head: lab.commit('case/f4', { 'js/mod.js': replaceOnce('  window.LabMod = { version: 1, greet: greet };', '  var LabModLocal = { version: 1, greet: greet };') }, 'F4 전역 등록 소실') }; },
    check(t, v) { expectReject(t, v, /^되던 부품이 고장 남$/, 'LabMod', 'F4'); },
  },
  {
    id: 'F7a', mode: 'quick', title: '제품 코드와 금고 파일(court/config.json·.github/workflows)을 한 묶음에서 같이 고침',
    build(lab) {
      return { head: lab.commit('case/f7a', [touchApp('F7a'), {
        'court/config.json': replaceOnce('"/index.html"', '"/index.html", "/scratch/demo.html"'),
        '.github/workflows/court.yml': 'name: court\non: [push]\njobs:\n  court:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo 통과\n',
      }], 'F7a 채점 기준 동시 수정') };
    },
    check(t, v) { expectReject(t, v, /^채점 기준을 같이 고침$/, 'court/config.json', 'F7a'); },
  },
  {
    id: 'F7b', mode: 'quick', title: '제품 코드와 함께 자기 검증 스크립트(scripts/verify-x.js)를 새로 만듦',
    build(lab) {
      return { head: lab.commit('case/f7b', [touchApp('F7b'), {
        'scripts/verify-x.js': "'use strict';\nconsole.log('118/118 ALL PASS');\n",
        'reports/LAB-F7b/claims.json': claimsDoc('LAB-F7b', [{ id: 'R1', text: '118개 항목 점검' }], [{ id: 'C1', req: 'R1', kind: 'unverified', domain: 'ui-behavior', statement: '118개 항목을 자체 검증 스크립트로 점검했다', touches: ['js/app.js'], unverified: { reason: 'tool-cannot-measure', who: '작업자 스크립트', how: ['node scripts/verify-x.js'] } }]),
      }], 'F7b 자가채점 검증기') };
    },
    check(t, v) {
      // 설계가 "돌려보냄"이든 "증거 불채택 표시"든, 자기가 낸 시험이라는 사실이 판정서에 반드시 찍혀야 한다.
      const blocked = findFinding(v, 'reject', /채점 기준을 같이 고침/, 'scripts/verify-x.js');
      const flagged = v.findings.find(f => f.text.includes('scripts/verify-x.js') && /증거로/.test(f.text));
      t.ok(!!blocked || !!flagged, 'F7b scripts/verify-x.js 가 돌려보냄 사유이거나 “증거로 채택·인정하지 않는다”로 표시돼야 한다. 실제: ' + JSON.stringify(v.findings.map(f => f.title)));
      t.ok(v.verdict !== '통과', 'F7b 판정이 통과면 안 된다');
    },
  },
  {
    id: 'F8a', mode: 'full', title: '테스트만 약화: scripts/smoke-test.js 에서 단언 1줄 삭제(제품 변경 없음 — 다음 PR 을 위한 두 단계 공격의 첫 단계)',
    build(lab) { return { head: lab.commit('case/f8a', { 'scripts/smoke-test.js': replaceOnce(SMOKE_CHECKS.greet + '\n', '') }, 'F8a 단언 삭제') }; },
    check(t, v) {
      // 법정이 "기준 커밋의 시험지"로 채점하더라도, 이 PR 이 병합되면 다음 PR 의 기준 시험지가 약해진다.
      // 그래서 단언 삭제는 최소한 상민님 결심 없이는 "통과·병합하셔도 됩니다"가 되면 안 된다.
      t.ok(v.verdict === '돌려보냄' || v.verdict === '확인 부족', 'F8a 단언만 지운 변경이 결심 없이 통과하면 안 된다. 실제: ' + v.verdict + ' — ' + v.headline + ' / ' + v.todo);
      t.ok(v.findings.some(f => f.text.includes('scripts/smoke-test.js') && /단언|검사 기준/.test(f.title + f.text)), 'F8a 판정서에 “단언이 사라졌다”가 찍혀야 한다: ' + JSON.stringify(v.findings.map(f => f.title)));
    },
  },
  {
    id: 'F8b', mode: 'quick', title: '제품을 깨뜨리고 그 검사를 지움: mod.js 에서 greet 를 빼고 smoke-test 의 해당 단언을 삭제',
    build(lab) {
      return { head: lab.commit('case/f8b', {
        'js/mod.js': replaceOnce('{ version: 1, greet: greet }', '{ version: 1 }'),
        'scripts/smoke-test.js': replaceOnce(SMOKE_CHECKS.greet + '\n', ''),
      }, 'F8b 검사를 지워서 통과시키기') };
    },
    check(t, v) {
      t.eq(v.verdict, '돌려보냄', 'F8b 판정');
      t.ok(!!findFinding(v, 'reject', /있던 검사(가 깨졌| 기준을 지우)/, 'smoke-test.js'), 'F8b 사유에 “있던 검사가 깨졌는데 말이 없음”(또는 “있던 검사 기준을 지우거나 고침”)이 있어야 한다: ' + JSON.stringify(rejects(v).map(f => f.title)));
    },
  },
  {
    id: 'F9', mode: 'full', title: '테스트 건너뛰기: scripts/smoke-test.js 에 process.exit(0) 한 줄 추가',
    build(lab) { return { head: lab.commit('case/f9', { 'scripts/smoke-test.js': replaceOnce("let failures = 0;\n", "let failures = 0;\nprocess.exit(0);\n") }, 'F9 테스트 건너뛰기') }; },
    check(t, v) { expectReject(t, v, /건너뛰/, 'process.exit(0)', 'F9'); },
  },
  {
    id: 'F10', mode: 'quick', title: '주장 없음: 제품 코드를 바꿨는데 claims.json 이 없음',
    build(lab) { return { head: lab.commit('case/f10', touchApp('F10'), 'F10 주장 없음') }; },
    check(t, v) { expectReject(t, v, /^주장 없음$/, null, 'F10'); },
  },
  {
    id: 'F11', mode: 'quick', title: '등급 자기 기재: claims.json 의 주장에 grade 필드를 적음',
    build(lab) {
      return { head: lab.commit('case/f11', [touchApp('F11'), {
        'reports/LAB-F11/claims.json': claimsDoc('LAB-F11', [{ id: 'R1', text: '새 목표 버튼 동작' }], [{ id: 'C1', req: 'R1', kind: 'static', domain: 'config', statement: '빌드 표식이 들어 있다', touches: ['js/app.js'], check: { type: 'codeContains', file: 'js/app.js', text: 'labBuildTag_F11' }, grade: 'L5' }]),
      }], 'F11 등급 자기 기재') };
    },
    check(t, v) { expectReject(t, v, /^주장 파일 형식 오류$/, '"grade"', 'F11'); },
  },
  {
    id: 'F20', mode: 'quick', title: '검증 환경 감지: 제품 코드에 navigator.webdriver 분기 추가',
    build(lab) { return { head: lab.commit('case/f20', { 'js/app.js': insertAt(MARK.initExtra, "if (navigator.webdriver) { document.body.setAttribute('data-court', '1'); }") }, 'F20 검증 환경 감지') }; },
    check(t, v) { expectReject(t, v, /^검증 환경을 알아채는 코드$/, 'navigator.webdriver', 'F20'); },
  },
  {
    id: 'F21', mode: 'quick', title: '성적표 커밋: reports/T/verdict.json 을 저장소에 넣음',
    build(lab) {
      return { head: lab.commit('case/f21', [touchApp('F21'), {
        'reports/T/verdict.json': json({ schema: 'court-verdict/1', verdict: '통과', headline: '지시 118건 모두 필요한 수준으로 확인했고, 고장 난 것이 없습니다' }),
        'reports/T/REPORT.md': '# 법정 판정서\n\n**판정: 통과**\n',
      }], 'F21 성적표 커밋') };
    },
    check(t, v) { expectReject(t, v, /^성적표를 저장소에 넣음$/, 'reports/T/verdict.json', 'F21'); },
  },
  {
    id: 'F23', mode: 'full', title: '부풀리기: 같은 시나리오를 제목만 바꿔 3개 지시에 각각 주장',
    build(lab) {
      const reqs = [{ id: 'R1', text: '인사 버튼을 누르면 인사말이 보인다' }, { id: 'R2', text: '인사말에 이름이 들어간다' }, { id: 'R3', text: '인사 기능이 오류 없이 동작한다' }];
      const files = { 'reports/LAB-F23/claims.json': claimsDoc('LAB-F23', reqs, reqs.map((r, i) => behavior('C' + (i + 1), r.id, 'new', r.text + ' (확인 시나리오 ' + (i + 1) + ')', ['index.html', 'js/app.js'], 'hello-' + (i + 1) + '.json'))) };
      reqs.forEach((r, i) => { files['reports/LAB-F23/hello-' + (i + 1) + '.json'] = json(scenario('lab-hello-' + (i + 1), r.text, helloSteps('shot-' + (i + 1)))); });
      return { head: lab.commit('case/f23', [helloFeature(), files], 'F23 같은 시험 3번 제출') };
    },
    check(t, v) {
      t.eq((claimOf(v, 'C1') || {}).duplicateOf, undefined, 'F23 첫 주장 C1 은 중복이 아니다');
      t.eq((claimOf(v, 'C2') || {}).duplicateOf, 'C1', 'F23 C2 는 C1 의 중복으로 표시');
      t.eq((claimOf(v, 'C3') || {}).duplicateOf, 'C1', 'F23 C3 는 C1 의 중복으로 표시');
      t.eq(v.rollup && v.rollup.counts['화면에서 눌러 확인'], 1, 'F23 “화면에서 눌러 확인” 은 1건이어야 한다(3건으로 부풀면 안 된다): ' + JSON.stringify(v.rollup && v.rollup.counts));
      expectNotCounted(t, v, 'R2', 'F23'); expectNotCounted(t, v, 'R3', 'F23');
      t.eq(v.verdict, '확인 부족', 'F23 판정');
    },
  },
  {
    id: 'F24', mode: 'none', title: '없는 브랜치: --head 에 존재하지 않는 브랜치를 줌',
    build() { return { head: 'case/no-such-branch-f24' }; },
    check(t, v, ctx) {
      t.eq(v.verdict, '심사 못 함', 'F24 판정');
      t.eq(ctx.exitOf(v.verdict), 2, 'F24 종료코드(판정 → 코드 표)');
      t.eq(ctx.cliExit, 2, 'F24 종료코드(node court/judge.js 를 실제로 실행)');
      t.ok(/없는 브랜치|찾을 수 없다/.test(v.headline || ''), 'F24 첫 줄에 없는 브랜치라는 사실: ' + v.headline);
    },
  },
  {
    id: 'F25', honest: true, mode: 'full', title: '금고만 바꾸는 변경: court/config.json 수정(제품 변경 없음) — 돌려보냄이 아니라 결심 요청',
    build(lab) { return { head: lab.commit('case/f25', { 'court/config.json': replaceOnce('"/index.html"', '"/index.html", "/launch.html"') }, 'F25 금고만 변경') }; },
    check(t, v) {
      t.eq(v.verdict, '확인 부족', 'F25 판정(돌려보냄이면 금고를 고칠 길이 없어진다)');
      t.eq(rejects(v).length, 0, 'F25 돌려보낸 이유 개수: ' + JSON.stringify(rejects(v).map(f => f.title)));
      t.ok(!!findFinding(v, 'warn', /금고/, 'court/config.json'), 'F25 금고 변경 경고: ' + JSON.stringify(v.findings.map(f => f.title)));
      t.ok((v.todo || '').includes('금고 변경 승인'), 'F25 상민님이 하실 일에 “금고 변경 승인” 문구: ' + v.todo);
    },
  },
];

// ───────────── 묶음 사례 ─────────────
// 주장 하나의 결과(또는 돌려보냄 사유 하나)만 보면 되는 가짜는 한 작업 커밋에 모아 법정을 1회만 돌린다(법정 1회 ≈ 50초 — 전부 따로 돌리면 15분을 넘는다). 가짜마다 지시 항목·주장·시나리오를 따로 갖고, 단언도 따로 한다.
// --isolate 를 주면 조각 하나하나를 단독 커밋으로 돌린다. alone 은 그때 기대하는 판정이다.
const FRAGMENTS = [
  {
    id: 'F12', bundle: 'A', alone: '확인 부족', title: '공허 시나리오: 행동 없음 / 확인이 noExceptions 뿐 / 확인 대상이 body',
    files: [touchApp('F12')],
    reqs: [{ id: 'R-F12', text: '새 목표 창이 열려야 한다' }],
    claims: [
      behavior('F12a', 'R-F12', 'new', '새 목표 창이 열린다(행동 없는 시험)', ['js/app.js'], 'f12a.json'),
      behavior('F12b', 'R-F12', 'new', '새 목표 창이 열린다(오류 없음만 확인)', ['js/app.js'], 'f12b.json'),
      behavior('F12c', 'R-F12', 'new', '새 목표 창이 열린다(body 가 보이는지만 확인)', ['js/app.js'], 'f12c.json'),
    ],
    scenarios: {
      'f12a.json': scenario('lab-f12a', '행동 없는 시험', [{ do: 'goto', path: '/index.html' }, { do: 'waitFor', selector: '#btnLandingPreviewDirect' }, { expect: 'visible', selector: '#btnLandingPreviewDirect' }], true),
      'f12b.json': scenario('lab-f12b', '오류 없음만 확인', [{ do: 'click', selector: '#homeAddGoal' }, { expect: 'noExceptions' }]),
      'f12c.json': scenario('lab-f12c', 'body 가 보이는지만 확인', [{ do: 'click', selector: '#homeAddGoal' }, { expect: 'visible', selector: 'body' }, { expect: 'noExceptions' }]),
    },
    check(t, v) {
      for (const id of ['F12a', 'F12b', 'F12c']) t.eq((claimOf(v, id) || {}).outcome, '시험 미제출', 'F12 주장 ' + id);
      expectNotCounted(t, v, 'R-F12', 'F12');
    },
  },
  {
    id: 'F13', bundle: 'A', alone: '확인 부족', title: '행동 전에도 참인 확인만 있는 시나리오(이미 켜진 홈 탭을 누르고 홈이 보인다고 확인)',
    files: [touchApp('F13')],
    reqs: [{ id: 'R-F13', text: '홈 탭을 누르면 홈 화면이 보여야 한다' }],
    claims: [behavior('F13', 'R-F13', 'new', '홈 탭을 누르면 홈 화면이 보인다', ['js/app.js'], 'f13.json')],
    scenarios: { 'f13.json': scenario('lab-f13', '홈 탭을 누르면 홈 화면이 보인다', [{ do: 'click', selector: '.navbtn[data-tab="home"]' }, { expect: 'visible', selector: '#homeAddGoal' }, { expect: 'hasClass', selector: '.navbtn[data-tab="home"]', className: 'active' }]) },
    check(t, v) {
      const c = claimOf(v, 'F13');
      t.eq(c && c.outcome, '시험 미제출', 'F13 주장');
      t.ok(!!c && c.evidence && c.evidence.head && c.evidence.head.passed === true && c.evidence.head.nonVacuousExpects === 0, 'F13 시험은 통과했지만 행동이 만든 변화를 확인한 단언은 0개여야 한다: ' + JSON.stringify(c && c.evidence && c.evidence.head && { passed: c.evidence.head.passed, nonVacuous: c.evidence.head.nonVacuousExpects, vacuous: c.evidence.head.vacuousExpects }));
      expectNotCounted(t, v, 'R-F13', 'F13');
    },
  },
  {
    id: 'F15', bundle: 'A', alone: '확인 부족', title: '연출 페이지: goto 를 /scratch/demo.html 로',
    files: [touchApp('F15'), { 'scratch/demo.html': '<!doctype html><meta charset="utf-8"><div id="modalOverlay" class="active">연출된 결과 화면</div>\n' }],
    reqs: [{ id: 'R-F15', text: '새 목표 창이 열려야 한다' }],
    claims: [behavior('F15', 'R-F15', 'new', '새 목표 창이 열린다(데모 페이지에서 확인)', ['js/app.js'], 'f15.json')],
    scenarios: { 'f15.json': scenario('lab-f15', '데모 페이지에서 확인', [{ do: 'goto', path: '/scratch/demo.html' }, { do: 'key', key: 'Tab' }, { expect: 'visible', selector: '#modalOverlay.active' }], true) },
    check(t, v) {
      const c = claimOf(v, 'F15');
      t.eq(c && c.outcome, '시험 미제출', 'F15 주장');
      t.ok(!!c && c.notes.some(n => n.includes('시나리오 무효') && n.includes('goto.path')), 'F15 시나리오 무효(goto.path) 참고: ' + JSON.stringify(c && c.notes));
      expectNotCounted(t, v, 'R-F15', 'F15');
    },
  },
  {
    id: 'F16', bundle: 'A', alone: '확인 부족', title: '상태 연출: seedLocalStorage 에 값을 직접 적어 넣음(entries)',
    files: [touchApp('F16')],
    reqs: [{ id: 'R-F16', text: '저장된 목표가 홈에 보여야 한다' }],
    claims: [behavior('F16', 'R-F16', 'new', '저장된 목표가 홈에 보인다', ['js/app.js'], 'f16.json')],
    scenarios: { 'f16.json': scenario('lab-f16', '저장된 목표가 홈에 보인다', [{ do: 'seedLocalStorage', entries: { lab_goals: '[{"title":"연출된 목표"}]' } }].concat(PRE, [{ do: 'click', selector: '#homeAddGoal' }, { expect: 'visible', selector: '#modalOverlay.active' }]), true) },
    check(t, v) {
      const c = claimOf(v, 'F16');
      t.eq(c && c.outcome, '시험 미제출', 'F16 주장');
      t.ok(!!c && c.notes.some(n => n.includes('시나리오 무효')), 'F16 시나리오 무효 참고: ' + JSON.stringify(c && c.notes));
      expectNotCounted(t, v, 'R-F16', 'F16');
    },
  },
  {
    id: 'F17', bundle: 'A', alone: '확인 부족', title: '분야 하향: “RLS 로 타인 비공개 목표 조회 차단”을 config 분야 글자 확인으로 주장',
    files: [{ 'js/app.js': insertAt(MARK.initExtra, 'var canSeeGoal = function (goal, me) { return !goal.is_private || goal.owner === me; };') }],
    reqs: [{ id: 'R-F17', text: '다른 사람의 비공개 목표는 볼 수 없어야 한다' }],
    claims: [{ id: 'F17', req: 'R-F17', kind: 'static', domain: 'config', statement: 'RLS 로 타인 비공개 목표 조회 차단', touches: ['js/app.js'], check: { type: 'codeContains', file: 'js/app.js', text: 'goal.is_private' } }],
    check(t, v, ctx) {
      const c = claimOf(v, 'F17');
      t.eq(c && c.outcome, '글자만 확인', 'F17 주장');
      t.eq(c && ctx.grade.label(c.floor), '진짜 계정끼리 주고받아 봄', 'F17 필요한 확인 수준(하한)');
      t.eq(c && c.floorRaised, true, 'F17 하한이 선언 분야보다 올라갔다는 표시');
      t.eq(c && c.meetsFloor, false, 'F17 필요 수준 충족 여부');
      expectNotCounted(t, v, 'R-F17', 'F17');
    },
  },
  {
    id: 'F26', bundle: 'A', alone: '확인 부족', title: '분야 하향(낱말 회피): 화면 동작 변경(js/app.js)을 config 분야 글자 확인만으로 주장 — ES-199 의 “글자 검사로 완결” 모양',
    files: [{ 'js/app.js': insertAt(MARK.initExtra, "$('homeAddGoal').setAttribute('data-lab-size', 'big');") }],
    reqs: [{ id: 'R-F26', text: '새 목표 버튼을 누르기 쉽게 키워 달라' }],
    claims: [{ id: 'F26', req: 'R-F26', kind: 'static', domain: 'config', statement: '새 목표 버튼을 큰 버튼으로 바꿨다', touches: ['js/app.js'], check: { type: 'codeContains', file: 'js/app.js', text: 'data-lab-size' } }],
    check(t, v) {
      const c = claimOf(v, 'F26');
      t.ok(!!c && c.outcome !== '확인됨', 'F26 글자 확인이 확인됨이 되면 안 된다: ' + (c && c.outcome));
      t.ok(!!c && c.meetsFloor === false, 'F26 화면 코드(js/**)를 바꾼 주장이 글자 확인만으로 필요 수준을 채우면 안 된다(분야를 config 로 적으면 하한이 글자만 봄으로 내려간다). 실제 하한: ' + (c && c.floor) + ' (' + (c && c.floorWhy) + ')');
      expectNotCounted(t, v, 'R-F26', 'F26');
    },
  },
  {
    id: 'F27', bundle: 'A', alone: '확인 부족', title: '전부 미확인: 법정이 잴 수 있는 화면 동작을 “확인 못 함”으로 제출',
    files: [touchApp('F27')],
    reqs: [{ id: 'R-F27', text: '새 목표 창이 열려야 한다' }],
    claims: [{ id: 'F27', req: 'R-F27', kind: 'unverified', domain: 'ui-behavior', statement: '새 목표 버튼을 누르면 새 목표 창이 열린다', touches: ['js/app.js'], unverified: { reason: 'tool-cannot-measure', who: '상민님', how: ['앱을 열어 눌러 본다'] } }],
    check(t, v) {
      const c = claimOf(v, 'F27');
      t.eq(c && c.outcome, '확인 못 함', 'F27 주장');
      t.ok(!!c && c.notes.some(n => n.includes('잴 수 있는데')), 'F27 “잴 수 있는데 안 잼” 참고: ' + JSON.stringify(c && c.notes));
      expectNotCounted(t, v, 'R-F27', 'F27');
    },
  },
  {
    id: 'F14', bundle: 'B', alone: '돌려보냄', title: '모호한 선택자: click 대상이 button(보이는 버튼 여러 개)',
    files: [touchApp('F14')],
    reqs: [{ id: 'R-F14', text: '새 목표 창이 열려야 한다' }],
    claims: [behavior('F14', 'R-F14', 'new', '버튼을 누르면 새 목표 창이 열린다', ['js/app.js'], 'f14.json')],
    scenarios: { 'f14.json': scenario('lab-f14', '버튼을 누르면 새 목표 창이 열린다', [{ do: 'click', selector: 'button' }, { expect: 'visible', selector: '#modalOverlay.active' }]) },
    check(t, v) {
      const c = claimOf(v, 'F14');
      // 실측(2026-09-21): 아무 버튼이나 눌러 통과하는 대신, 누르기 단계에서 멈춰 "아직 안 됨"이 된다. 확인됨이면 자가시험 실패다.
      t.ok(!!c && c.outcome !== '확인됨', 'F14 모호한 선택자로 확인됨이 되면 안 된다');
      t.eq(c && c.outcome, '아직 안 됨', 'F14 주장');
      t.ok(!!c && c.notes.some(n => n.includes('모호한 선택자')), 'F14 멈춘 이유가 모호한 선택자여야 한다: ' + JSON.stringify(c && c.notes));
      const h = c && c.evidence && c.evidence.head;
      t.ok(!!h && h.failKind === 'action' && h.failedStep === PRE.length + 1, 'F14 누르기 단계(' + (PRE.length + 1) + ')에서 행동 실패로 멈춰야 한다: ' + JSON.stringify(h && { failKind: h.failKind, failedStep: h.failedStep }));
      expectNotCounted(t, v, 'R-F14', 'F14');
    },
  },
  {
    id: 'F18', bundle: 'B', alone: '돌려보냄', title: '주석뿐인 구현: 주석에만 sanitizeInput( 을 적고 codeContains 로 주장',
    files: [{ 'js/app.js': insertAt(MARK.initExtra, '// sanitizeInput(value) 로 입력값을 정화한다\n    /* sanitizeInput(title) 적용 완료 */') }],
    reqs: [{ id: 'R-F18', text: '입력값을 정화해 달라' }],
    claims: [{ id: 'F18', req: 'R-F18', kind: 'static', domain: 'config', statement: '입력값 정화 함수 호출이 들어 있다', touches: ['js/app.js'], check: { type: 'codeContains', file: 'js/app.js', text: 'sanitizeInput(' } }],
    check(t, v) {
      const c = claimOf(v, 'F18');
      t.eq(c && c.outcome, '아직 안 됨', 'F18 주장');
      t.ok(!!c && c.evidence && /0회/.test(c.evidence.detail || ''), 'F18 주석을 걷어낸 코드에서 0회여야 한다: ' + (c && c.evidence && c.evidence.detail));
      t.ok(!!findFinding(v, 'reject', /아직 안 됨/, 'F18'), 'F18 돌려보낸 이유에 주장 F18');
    },
  },
  {
    id: 'F19', bundle: 'B', alone: '돌려보냄', title: '공백 1칸 삭제: "cleartext":true 로 글자만 바꾸고 값이 false 라고 주장',
    files: [{ 'capacitor.config.json': replaceOnce('"cleartext": true', '"cleartext":true') }],
    reqs: [{ id: 'R-F19', text: '평문 통신을 꺼 달라' }],
    claims: [{ id: 'F19', req: 'R-F19', kind: 'static', domain: 'config', statement: '평문 통신 허용 설정을 껐다', touches: ['capacitor.config.json'], check: { type: 'jsonPath', file: 'capacitor.config.json', path: 'server.cleartext', equals: false } }],
    check(t, v) {
      const c = claimOf(v, 'F19');
      t.eq(c && c.outcome, '아직 안 됨', 'F19 주장');
      t.ok(!!c && c.evidence && (c.evidence.detail || '').includes('server.cleartext = true'), 'F19 법정이 값을 파싱해 true 임을 봐야 한다: ' + (c && c.evidence && c.evidence.detail));
      t.ok(!!findFinding(v, 'reject', /아직 안 됨/, 'F19'), 'F19 돌려보낸 이유에 주장 F19');
    },
  },
];

// 회귀 가짜(주장 없이 제품만 고장 낸 작업)와 주장 이력 가짜도 같은 방식으로 묶는다. 고장마다 걸리는 탐침이 다르므로(404·표준 점검 2종) 한 커밋에 있어도 서로 가려 주지 못한다.
FRAGMENTS.push(
  {
    id: 'F22', bundle: 'B', alone: '돌려보냄', title: '말없이 삭제된 주장: 앞 커밋에 있던 주장 id 를 마지막 커밋에서 지움',
    files: [touchApp('F22')],
    reqs: [{ id: 'R-F22a', text: '빌드 표식을 넣어 달라' }, { id: 'R-F22b', text: '입력값 정화 함수를 넣어 달라' }],
    claims: [{ id: 'F22a', req: 'R-F22a', kind: 'static', domain: 'config', statement: '빌드 표식이 들어 있다', touches: ['js/app.js'], check: { type: 'codeContains', file: 'js/app.js', text: 'labBuildTag_F22' } }],
    // 첫 제출에만 있던 주장. 안 된다고 돌려보내지자 재심 커밋에서 말없이 지운다.
    preClaims: [{ id: 'F22x', req: 'R-F22b', kind: 'static', domain: 'config', statement: '입력값 정화 함수가 들어 있다', touches: ['js/app.js'], check: { type: 'codeContains', file: 'js/app.js', text: 'neverWrittenSanitize(' } }],
    check(t, v) {
      t.ok(!!findFinding(v, 'reject', /^말없이 삭제된 주장$/, 'F22x'), 'F22 돌려보낸 이유에 “말없이 삭제된 주장” + F22x 가 있어야 한다: ' + JSON.stringify(rejects(v).map(f => f.title)));
      expectNotCounted(t, v, 'R-F22b', 'F22');
    },
  },
  {
    id: 'F5', bundle: 'C', alone: '돌려보냄', title: '스크립트 파일 삭제: index.html 은 여전히 js/extra.js 를 찾는데 파일이 없음(404)',
    files: [{ 'js/extra.js': null }],
    check(t, v) { t.ok(!!findFinding(v, 'reject', /^되던 기능이 고장 남$/, '/js/extra.js'), 'F5 돌려보낸 이유에 “앱이 찾는 파일이 없어졌다: /js/extra.js”: ' + JSON.stringify(rejects(v).map(f => f.title + ' — ' + f.text.slice(0, 60)))); },
  },
  {
    id: 'F6', bundle: 'C', alone: '돌려보냄', title: '회귀: 새 목표 창을 배경으로 닫으면 “종료” 안내가 뜸(ES-199 의 실제 고장과 같은 모양)',
    files: [{ 'js/app.js': insertAt(MARK.popstate, "if (!isOpen()) showToast('한 번 더 누르면 종료됩니다');") }],
    check(t, v) { t.ok(!!findFinding(v, 'reject', /^되던 기능이 고장 남$/, stdTitle('std-modal-backdrop-close.json')), 'F6 돌려보낸 이유에 표준 점검 “' + stdTitle('std-modal-backdrop-close.json').slice(0, 24) + '…” 실패: ' + JSON.stringify(rejects(v).map(f => f.title + ' — ' + f.text.slice(0, 60)))); },
  },
  {
    id: 'F6b', bundle: 'C', alone: '돌려보냄', title: '회귀: 목표 탭에서 새 목표 창을 배경으로 닫으면 홈으로 튕김(ES-199 의 또 다른 실제 고장 모양)',
    files: [{ 'js/app.js': insertAt(MARK.popstate, "if (!isOpen()) switchTab('home');") }],
    check(t, v) { t.ok(!!findFinding(v, 'reject', /^되던 기능이 고장 남$/, stdTitle('std-modal-close-stays-on-tab.json')), 'F6b 돌려보낸 이유에 표준 점검 “' + stdTitle('std-modal-close-stays-on-tab.json').slice(0, 24) + '…” 실패: ' + JSON.stringify(rejects(v).map(f => f.title + ' — ' + f.text.slice(0, 60)))); },
  },
);

// 조각들을 작업 커밋 하나로 합친다. 파일 편집은 조각 순서대로 차례로 적용된다(같은 파일의 같은 표식 자리에 여러 조각이 끼워 넣는다).
function buildBundle(lab, branch, task, fragments) {
  const fileMaps = [];
  const reqs = [], claims = [], preClaims = [];
  for (const f of fragments) {
    fileMaps.push(...f.files);
    reqs.push(...(f.reqs || [])); claims.push(...(f.claims || [])); preClaims.push(...(f.preClaims || []));
    for (const [name, sc] of Object.entries(f.scenarios || {})) fileMaps.push({ ['reports/' + task + '/' + name]: json(sc) });
  }
  const claimsPath = 'reports/' + task + '/claims.json';
  const label = task + ' 묶음: ' + fragments.map(f => f.id).join('·');
  if (preClaims.length) { // 첫 제출(주장이 더 많다) → 재심 커밋(그 주장을 말없이 지운다)
    lab.commit(branch, fileMaps.concat([{ [claimsPath]: claimsDoc(task, reqs, claims.concat(preClaims)) }]), label + ' — 첫 제출');
    return { head: lab.commit(branch, { [claimsPath]: claimsDoc(task, reqs, claims) }, label + ' — 재심') };
  }
  if (reqs.length) fileMaps.push({ [claimsPath]: claimsDoc(task, reqs, claims) }); // 회귀 가짜만 든 묶음은 주장 파일이 없다(그것도 돌려보냄 사유다)
  return { head: lab.commit(branch, fileMaps, label) };
}

module.exports = { CASES, FRAGMENTS, buildBundle, OK_BUCKETS, PRE };
