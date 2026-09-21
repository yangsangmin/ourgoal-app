'use strict';
// 법정 자가시험 — 가짜·정직 사례집.
// 사례마다 합성 저장소에 작업 커밋을 쌓고, 법정(judge)을 프로그램으로 불러 판정·사유·주장별 결과를 단언한다.
// 기대값은 "법정이 지금 내는 값"이 아니라 "가짜가 걸러지려면 나와야 하는 값"이다. 어긋나면 기대값을 낮추지 말고 법정을 고친다.
const fs = require('node:fs');
const path = require('node:path');
const { insertAt, replaceOnce, MARK, SMOKE_CHECKS, CALC_CHECKS, SMOKE_END } = require('./lab');
const report = require('../report');

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

function claimsDoc(task, reqs, claims, extra) { return json({ task, requirements: reqs, ...(extra || {}), claims }); } // extra: retire·objection 같은 최상위 칸
function behavior(id, req, change, statement, touches, scenarioFile, extra) { return { id, req, kind: 'behavior', change, domain: 'ui-behavior', statement, touches, scenario: scenarioFile, ...(extra || {}) }; }

// 정직한 작은 제품 변경 + 그 주장(글자 확인). 시험지·부품을 다루는 사례에 같이 넣는다: 제품 변경이 없으면 "테스트만 약화"(결심 요청) 갈래로 빠지고, 주장이 없으면 "주장 없음"이 다른 사유를 가린다.
const noticeFeature = () => ({ 'index.html': insertAt(MARK.homeExtra, '<p id="labNew">새 안내</p>') });
const noticeClaims = (task, extra) => ({ ['reports/' + task + '/claims.json']: claimsDoc(task, [{ id: 'R1', text: '홈 화면에 새 안내 문구를 보여 준다' }], [{ id: 'C1', req: 'R1', kind: 'static', domain: 'config', statement: '홈 화면 마크업에 새 안내 문구 요소가 들어 있다', touches: ['index.html'], check: { type: 'codeContains', file: 'index.html', text: 'id="labNew"' } }], extra) });
// 정직한 새 기능(인사 버튼)과 그 화면 주장 한 건. 화면 점검까지 가는 사례의 공통 바탕이다.
const helloClaimFiles = (task, extraClaims, extraTouches) => ({
  ['reports/' + task + '/claims.json']: claimsDoc(task, [{ id: 'R1', text: '인사 버튼을 누르면 인사말이 보이게 해 달라' }], [behavior('C1', 'R1', 'new', '인사 버튼을 누르면 인사말이 보인다', ['index.html', 'js/app.js'].concat(extraTouches || []), 'hello.json')].concat(extraClaims || [])),
  ['reports/' + task + '/hello.json']: json(scenario('lab-hello', '인사 버튼을 누르면 인사말이 보인다', helloSteps())),
});
const warnsOf = v => v.findings.filter(f => f.severity === 'warn');
const titlesOf = list => JSON.stringify(list.map(f => f.title));
// 판정서에서 주장 하나의 칸만 잘라 낸다("### <id> · …" 부터 다음 제목 앞까지).
function claimSection(md, id) { const at = md.indexOf('### ' + id + ' '); if (at < 0) return ''; const rest = md.slice(at + 4); const end = rest.search(/\n##+ /); return end < 0 ? rest : rest.slice(0, end); }

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
// lab: 출발점이 되는 합성 저장소의 변형(lab.js 의 VARIANTS — 기본 standard) · env: 법정을 부르는 동안만 거는 환경변수
// run(t, ctx): build·check 대신 법정을 스스로 부르는 사례(같은 커밋을 여러 번 심사하기, 자식 프로세스에서 돌리기). id 가 T 로 시작한다.
// id 의 뜻: H = 정직한 작업(막히면 오탐) · F = 가짜(걸러져야 한다) · T = 법정 도구의 동작
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
      // 지운 것은 글자가 있는지만 보던 검사이고, 폐기 신청(retire)을 낸 적도 없다. 첫 줄이 “제품 함수를 실제로 돌리던 검사의 폐기 신청”이라고 말하면 사실이 아니다.
      t.ok(!/제품 함수를 실제로 돌리던/.test(v.headline || '') && /시험지/.test(v.headline || ''), 'F8a 첫 줄은 “시험지만 약하게 만든 변경”이라고 사실대로 말해야 한다. 실제: ' + v.headline);
      t.ok((v.todo || '').includes('금고 변경 승인'), 'F8a 상민님이 하실 일에 “금고 변경 승인” 문구: ' + v.todo);
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

  // ───── 검수 반영(법정 속이기·헌법↔구현)으로 닫은 구멍 ─────
  {
    id: 'F29', mode: 'quick', title: '법정 주소 알아보기: 제품 코드가 법정이 앱을 여는 주소의 모양을 보고 갈라짐',
    build(lab) { return { head: lab.commit('case/f29', { 'js/app.js': insertAt(MARK.initExtra, "if (/\\.test$/.test(location.hostname)) { $('labMsg').textContent = '안녕하세요'; }") }, 'F29 법정 주소 알아보기') }; },
    check(t, v) { expectReject(t, v, /^검증 환경을 알아채는 코드$/, 'location.hostname', 'F29'); },
  },
  {
    id: 'F32', mode: 'quick', lab: 'with-calc', title: '시험 결과 꾸미기: 제품 부품이 고장 난 검사의 통과 줄을 대신 찍고 시험 프로세스를 끝냄',
    build(lab) {
      return { head: lab.commit('case/f32', [noticeFeature(), noticeClaims('LAB-F32'), {
        'js/calc.js': [replaceOnce('function add(a, b) { return a + b; }', 'function add(a, b) { return a - b; }'),
          replaceOnce("  if (typeof module !== 'undefined') module.exports = root.LabCalc;", "  if (typeof module !== 'undefined') { module.exports = root.LabCalc; console.log('  ✓ [검증 1/2] 계산기 더하기'); process.exit(0); }")].reduce((f, g) => old => g(f(old))),
      }], 'F32 시험 결과 꾸미기') };
    },
    check(t, v) {
      // 같은 프로세스에서 도는 제품 코드가 찍은 줄·끝낸 프로세스를 법정이 시험지의 것과 구분해야 한다(글자만 믿으면 "전부 통과"로 읽힌다).
      expectReject(t, v, /^시험 결과를 꾸민 흔적$/, 'js/calc.js', 'F32');
      t.ok(!!findFinding(v, 'reject', /^제품 코드가 프로세스를 끝냄$/, 'js/calc.js'), 'F32 추가된 줄 검사: 제품 코드가 프로세스를 끝냄 — ' + titlesOf(rejects(v)));
      t.ok(!!findFinding(v, 'reject', /^제품 코드가 시험 결과처럼 보이는 줄을 찍음$/, 'js/calc.js'), 'F32 추가된 줄 검사: 시험 결과처럼 보이는 줄 — ' + titlesOf(rejects(v)));
      t.ok(!v.findings.some(f => f.title === '도구 오류'), 'F32 법정 도구 오류로 돌리면 안 된다: ' + JSON.stringify(v.findings.filter(f => f.title === '도구 오류').map(f => f.text.slice(0, 80))));
    },
  },
  {
    // F32 의 대조군. 검사를 정직하게 깨뜨리고(꾸미지 않고) 사유를 적어 냈다 — 꾸민 흔적으로 몰리면 오탐이다.
    // 깨지는 여러 줄 검사 뒤에는 구획 출력 줄이 있다. 그 줄이 앞 검사에 딸려 들어가 "제품 함수를 돌리던 검사"로 읽히면 사실이 아닌 결심 요청이 나간다.
    id: 'H4', honest: true, mode: 'quick', lab: 'with-calc', title: '정직: 인사 함수 등록 방식을 바꿔 글자 검사 2개가 깨졌고, 검사 제목별로 폐기 사유(retire)를 적어 냄',
    build(lab) {
      const retire = [
        { file: 'scripts/smoke-test.js', check: '부품 mod.js 가 인사 함수를 등록한다', reason: '인사 함수를 감싸서 등록하도록 바꿔 옛 글자(greet: greet)가 더는 없다' },
        { file: 'scripts/smoke-test.js', check: '[검증 2/2] 부품에 인사 함수 글자가 있다', reason: '인사 함수를 감싸서 등록하도록 바꿔 옛 글자(greet: greet)가 더는 없다' },
      ];
      return { head: lab.commit('case/h4', {
        'js/mod.js': replaceOnce('{ version: 1, greet: greet }', "{ version: 2, greet: function (name) { return greet(name) + '!'; } }"),
        'reports/LAB-H4/claims.json': claimsDoc('LAB-H4', [{ id: 'R1', text: '인사말 끝에 느낌표를 붙여 달라' }], [{ id: 'C1', req: 'R1', kind: 'static', domain: 'config', statement: '인사 함수가 느낌표를 붙여 돌려준다', touches: ['js/mod.js'], check: { type: 'codeContains', file: 'js/mod.js', text: "greet(name) + '!'" } }], { retire }),
      }, 'H4 정직하게 깨뜨리고 사유 기재') };
    },
    check(t, v) {
      t.eq(rejects(v).length, 0, 'H4 돌려보낸 이유 개수(정직한 작업이 막히면 오탐이다): ' + titlesOf(rejects(v)));
      t.eq((v.baseTests && v.baseTests.newlyBroken || []).length, 2, 'H4 기준 시험지에서 깨진 검사 수');
      t.eq((v.baseTests && v.baseTests.forgery || []).length, 0, 'H4 꾸민 흔적 0건');
      t.eq(warnsOf(v).filter(f => f.title === '기존 글자 검사 폐기').length, 2, 'H4 “기존 글자 검사 폐기” 표시 2건: ' + titlesOf(warnsOf(v)));
      t.ok(!v.retireNeedsDecision, 'H4 글자가 있는지만 보던 검사의 폐기는 결심 사항이 아니다. 실제 결심 요청 수: ' + v.retireNeedsDecision);
    },
  },
  {
    id: 'F34', mode: 'quick', title: '검사하는 파일을 걸린 파일에서 뺌: check.file 은 js/app.js 인데 touches 에는 문서만 적음',
    build(lab) {
      return { head: lab.commit('case/f34', [touchApp('F34'), { 'README.md': old => old + '\n빌드 표식 추가.\n',
        'reports/LAB-F34/claims.json': claimsDoc('LAB-F34', [{ id: 'R1', text: '빌드 표식을 넣어 달라' }], [{ id: 'C1', req: 'R1', kind: 'static', domain: 'config', statement: '빌드 표식이 들어 있다', touches: ['README.md'], check: { type: 'codeContains', file: 'js/app.js', text: 'labBuildTag_F34' } }]),
      }], 'F34 검사 파일을 걸린 파일에서 뺌') };
    },
    check(t, v) { expectReject(t, v, /^주장 파일 형식 오류$/, 'touches', 'F34'); },
  },
  {
    id: 'F35', mode: 'quick', title: '금고의 제품 목록에 없는 배포 파일만 바꿈(robots.txt·assets/) — 주장 없이 통과하면 안 된다',
    build(lab) { return { head: lab.commit('case/f35', { 'robots.txt': 'User-agent: *\nDisallow:\n', 'assets/promo.svg': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>\n' }, 'F35 목록 밖 배포 파일') }; },
    check(t, v) {
      expectReject(t, v, /^주장 없음$/, null, 'F35');
      const product = (v.vault && v.vault.productChanged) || [];
      t.ok(product.includes('robots.txt') && product.includes('assets/promo.svg'), 'F35 목록에 없는 경로도 제품으로 분류돼야 한다: ' + JSON.stringify(product));
    },
  },
  {
    id: 'F36', mode: 'quick', env: { GITHUB_ACTIONS: 'true', CI: 'true' }, title: '실행 장소 속이기: 작업자 PC 에서 GITHUB_ACTIONS 만 켜고 돌림 — GitHub 실행으로 찍히면 안 된다',
    build(lab) { return { head: lab.commit('case/f36', touchApp('F36'), 'F36 실행 장소') }; },
    check(t, v, ctx) {
      t.eq(v.where, 'local', 'F36 실행 장소'); t.eq(v.runId, null, 'F36 실행 번호');
      const lines = ctx.report.firstLines(v), md = ctx.report.render(v);
      t.ok(lines[3].includes('작업자 PC 에서 실행한 예비 점검') && !lines[3].includes('GitHub 에서 법정이 직접 실행'), 'F36 넷째 줄: ' + lines[3]);
      t.ok(md.includes('판정 효력이 없습니다'), 'F36 판정서에 “예비 점검 — 판정 효력이 없습니다”');
      t.ok(md.includes(ctx.report.EFFECT_NOTICE), 'F36 판정서에 효력 안내(어디서 돌렸든 항상)');
    },
  },
  {
    id: 'F37', mode: 'quick', lab: 'with-calc', title: '폐기 사유 하나로 여러 검사 덮기: 검사 2개를 약하게 고치고 사유는 한 검사 제목에만 적음',
    build(lab) {
      return { head: lab.commit('case/f37', [noticeFeature(), {
        'scripts/smoke-test.js': replaceOnce('assert.strictEqual(calc.add(1, 2), 3);', 'assert.ok(calc.add(1, 2));') }, {
        'scripts/smoke-test.js': replaceOnce('  assert.ok(/greet:\\s*greet/.test(mod));\n});', '  assert.ok(/greet/.test(mod));\n});') },
      noticeClaims('LAB-F37', { retire: [{ file: 'scripts/smoke-test.js', check: '[검증 2/2] 부품에 인사 함수 글자가 있다', reason: '인사 함수 글자 찾는 식을 느슨하게 고쳤다' }] })], 'F37 사유 하나로 검사 둘') };
    },
    check(t, v) {
      expectReject(t, v, /^있던 검사 기준을 고쳤는데 사유가 없음$/, '계산기 더하기', 'F37');
      const r = findFinding(v, 'reject', /^있던 검사 기준을 고쳤는데 사유가 없음$/, '계산기 더하기');
      t.ok(!!r && !r.text.includes('인사 함수 글자가 있다'), 'F37 사유를 적은 검사는 돌려보낸 이유에 들어가면 안 된다: ' + (r && r.text.slice(0, 200)));
      t.ok(!!findFinding(v, 'warn', /^기존 글자 검사 수정$/, '느슨하게'), 'F37 사유를 적은 글자 검사는 표시만: ' + titlesOf(warnsOf(v)));
      t.ok(!v.retireNeedsDecision && !findFinding(v, 'warn', /^기존 실행 검사 수정$/), 'F37 여러 줄로 쓴 글자 검사를 사유와 함께 고친 것은 결심 사항이 아니다(제목 줄에 글자 찾기가 없다고 실행형으로 읽으면 안 된다). 실제 결심 요청 수: ' + v.retireNeedsDecision);
    },
  },
  {
    id: 'F38', mode: 'quick', lab: 'with-calc', title: '제목을 고치는 척 검사를 약화: 제목 글자와 함께 본문 단언을 assert.ok(true) 로 바꿈(사유 없음)',
    build(lab) {
      return { head: lab.commit('case/f38', [noticeFeature(), noticeClaims('LAB-F38'), {
        'scripts/smoke-test.js': replaceOnce(CALC_CHECKS.add, CALC_CHECKS.add.replace('계산기 더하기', '계산기가 두 수를 더한다').replace('assert.strictEqual(calc.add(1, 2), 3);', 'assert.ok(true);')) }], 'F38 제목+본문 약화') };
    },
    check(t, v) {
      expectReject(t, v, /^있던 검사 기준을 고쳤는데 사유가 없음$/, 'scripts/smoke-test.js', 'F38');
      t.ok(!findFinding(v, 'warn', /^제목만 바뀜$/), 'F38 본문이 바뀐 검사를 “제목만 바뀜”으로 넘기면 안 된다');
    },
  },
  {
    id: 'F39', mode: 'quick', lab: 'with-calc', title: '검사 바꿔치기: 제품 함수를 돌리던 검사를 지우고 그 자리에 항상 참인 새 검사를 넣음(사유 없음)',
    build(lab) {
      return { head: lab.commit('case/f39', [noticeFeature(), noticeClaims('LAB-F39'), {
        'scripts/smoke-test.js': replaceOnce(CALC_CHECKS.add, "check('[검증 1/2] 새 안내가 있다', () => {\n  assert.ok(html.length > 0);\n});") }], 'F39 검사 바꿔치기') };
    },
    check(t, v) {
      expectReject(t, v, /^있던 검사 기준을 고쳤는데 사유가 없음$/, 'scripts/smoke-test.js', 'F39');
      t.ok(!findFinding(v, 'warn', /^제목만 바뀜$/), 'F39 다른 검사로 바꾼 것을 “제목만 바뀜”으로 넘기면 안 된다');
    },
  },
  {
    id: 'F40', mode: 'quick', lab: 'with-calc', title: '제품이 기존 시험을 죽임: 시험지가 같은 프로세스에서 돌리는 부품(js/calc.js)에 화면 전용 코드를 넣음',
    build(lab) { return { head: lab.commit('case/f40', [noticeFeature(), noticeClaims('LAB-F40'), { 'js/calc.js': replaceOnce("  'use strict';\n", "  'use strict';\n  document.title = '계산기';\n") }], 'F40 제품이 기존 시험을 죽임') }; },
    check(t, v) {
      // 기준 커밋에서는 끝까지 돌던 시험지다. 법정 도구 오류(심사 못 함 — 하실 일 없음)로 나가면 고칠 수 있는 사람이 아무도 없게 된다.
      expectReject(t, v, /^제품 코드가 기존 시험을 죽임$/, 'ReferenceError', 'F40');
      t.ok(v.verdict !== '심사 못 함', 'F40 심사 못 함이면 안 된다: ' + v.headline);
      t.ok(!v.findings.some(f => f.title === '도구 오류'), 'F40 도구 오류로 돌리면 안 된다: ' + JSON.stringify(v.findings.filter(f => f.title === '도구 오류').map(f => f.text.slice(0, 80))));
      const k = ((v.baseTests && v.baseTests.killedByProduct) || [])[0];
      t.ok(!!k && k.where === 'js/calc.js:4', 'F40 죽은 자리(저장소 기준 경로:줄): ' + JSON.stringify(k && k.where));
      t.ok(ctxReportHas(v, '작업 커밋에서는 시험이 끝까지 돌지 못하고 중간에 죽었습니다'), 'F40 판정서의 기준 시험지 줄이 “중간에 죽었다”고 말해야 한다(“깨진 것 0개”로 읽히면 안 된다)');
    },
  },
  {
    id: 'H5', honest: true, mode: 'quick', lab: 'with-calc', title: '정직: 검사를 하나 더하면서 기존 검사 제목의 번호 표기만 고침([검증 1/2] → [검증 1/3])',
    build(lab) {
      return { head: lab.commit('case/h5', [noticeFeature(), noticeClaims('LAB-H5'), {
        'scripts/smoke-test.js': [replaceOnce("check('[검증 1/2] ", "check('[검증 1/3] "), replaceOnce("check('[검증 2/2] ", "check('[검증 2/3] "),
          replaceOnce(SMOKE_END, "check('[검증 3/3] 새 안내가 있다', () => {\n  assert.ok(html.includes('id=\"labNew\"'));\n});\n" + SMOKE_END)].reduce((f, g) => old => g(f(old))) }], 'H5 번호 표기만 고침') };
    },
    check(t, v) {
      t.eq(rejects(v).length, 0, 'H5 돌려보낸 이유 개수: ' + titlesOf(rejects(v)));
      t.ok(!v.retireNeedsDecision, 'H5 폐기한 검사가 없는데 결심을 요구하면 안 된다. 실제: ' + v.retireNeedsDecision);
      const noise = v.findings.filter(f => /검사|단언|약화/.test(f.title));
      t.eq(noise.length, 0, 'H5 검사가 없어지거나 약해진 것이 없으므로 검사에 관한 표시도 없어야 한다: ' + titlesOf(noise));
    },
  },
  {
    id: 'H6', honest: true, mode: 'quick', lab: 'with-calc', title: '정직: 제품 함수를 돌리는 검사의 제목 글자만 고침(본문 그대로)',
    build(lab) { return { head: lab.commit('case/h6', [noticeFeature(), noticeClaims('LAB-H6'), { 'scripts/smoke-test.js': replaceOnce("check('[검증 1/2] 계산기 더하기'", "check('[검증 1/2] 계산기가 두 수를 더한다'") }], 'H6 제목만 고침') }; },
    check(t, v) {
      t.eq(rejects(v).length, 0, 'H6 돌려보낸 이유 개수: ' + titlesOf(rejects(v)));
      t.ok(!!findFinding(v, 'warn', /^제목만 바뀜$/, '계산기가 두 수를 더한다'), 'H6 “제목만 바뀜” 표시: ' + titlesOf(warnsOf(v)));
      t.ok(!v.retireNeedsDecision, 'H6 제목만 고친 것은 결심 사항이 아니다. 실제: ' + v.retireNeedsDecision);
    },
  },
  {
    id: 'H7', honest: true, mode: 'quick', lab: 'with-calc', title: '정직: 제품 함수를 돌리는 검사를 느슨하게 고치고 사유를 적음 — 돌려보내지 않되 상민님 결심 사항으로 올라가야 한다',
    build(lab) {
      return { head: lab.commit('case/h7', [noticeFeature(), {
        'scripts/smoke-test.js': replaceOnce('assert.strictEqual(calc.add(1, 2), 3);', "assert.ok(typeof calc.add(1, 2) === 'number');") },
      noticeClaims('LAB-H7', { retire: [{ file: 'scripts/smoke-test.js', check: '[검증 1/2] 계산기 더하기', reason: '더하기 결과의 값 대신 종류만 보도록 바꿨다' }] })], 'H7 실행 검사 수정 + 사유') };
    },
    check(t, v) {
      t.eq(rejects(v).length, 0, 'H7 돌려보낸 이유 개수: ' + titlesOf(rejects(v)));
      t.eq(v.retireNeedsDecision, 1, 'H7 결심이 필요한 검사 수(줄이 아니라 검사 단위)');
      t.ok(!!findFinding(v, 'warn', /^기존 실행 검사 수정$/, '계산기 더하기'), 'H7 “기존 실행 검사 수정” 표시: ' + titlesOf(warnsOf(v)));
    },
  },
  {
    id: 'H11', honest: true, mode: 'quick', title: '정직: 전역(LabExtra) 등록을 다른 부품 파일로 옮기고 그 파일을 index.html 에서 부름',
    build(lab) {
      return { head: lab.commit('case/h11', {
        'js/extra.js': "// 작은 앱의 두 번째 부품. 오늘 날짜 도우미는 js/extra-date.js 로 옮겼다.\n(function () {\n  'use strict';\n  window.LabExtraReady = true;\n})();\n",
        'js/extra-date.js': "// 오늘 날짜 도우미(js/extra.js 에서 옮겨 옴).\n(function () {\n  'use strict';\n  window.LabExtra = { today: function () { return '오늘'; } };\n})();\n",
        'index.html': replaceOnce('<script src="js/extra.js"></script>', '<script src="js/extra.js"></script>\n<script src="js/extra-date.js"></script>'),
        'reports/LAB-H11/claims.json': claimsDoc('LAB-H11', [{ id: 'R1', text: '날짜 도우미를 별도 파일로 나눠 달라' }], [{ id: 'C1', req: 'R1', kind: 'static', domain: 'config', statement: '날짜 도우미가 별도 파일에 있다', touches: ['js/extra-date.js', 'js/extra.js', 'index.html'], check: { type: 'codeContains', file: 'js/extra-date.js', text: 'window.LabExtra =' } }]),
      }, 'H11 전역을 다른 부품으로 옮김') };
    },
    check(t, v) {
      t.eq(rejects(v).length, 0, 'H11 돌려보낸 이유 개수(파일 나누기가 고장으로 읽히면 오탐이다): ' + JSON.stringify(rejects(v).map(f => f.title + ' — ' + f.text.slice(0, 60))));
      const moved = (v.modules && v.modules.moved) || [];
      t.ok(moved.some(m => m.global === 'LabExtra' && m.to.includes('js/extra-date.js')), 'H11 옮겨 간 곳 기록: ' + JSON.stringify(moved));
    },
  },
  {
    id: 'H12', honest: true, mode: 'quick', title: '정직: 안 쓰는 부품을 지우고 script 태그를 뺌 — 지운 파일 이름이 index.html 의 주석에만 남음',
    build(lab) {
      return { head: lab.commit('case/h12', {
        'js/extra.js': null,
        'index.html': replaceOnce('<script src="js/extra.js"></script>', '<!-- js/extra.js 는 더 쓰지 않아 지웠다: <script src="js/extra.js"></script> -->'),
        'reports/LAB-H12/claims.json': claimsDoc('LAB-H12', [{ id: 'R1', text: '안 쓰는 두 번째 부품을 지워 달라' }], [{ id: 'C1', req: 'R1', kind: 'static', domain: 'config', statement: '첫 화면이 두 번째 부품을 더는 부르지 않는다', touches: ['index.html', 'js/extra.js'], check: { type: 'codeNotContains', file: 'index.html', text: 'src="js/extra.js"' } }]),
      }, 'H12 부품 삭제, 주석에만 이름이 남음') };
    },
    check(t, v) {
      t.eq(rejects(v).length, 0, 'H12 돌려보낸 이유 개수(주석 속 글자를 “아직 부른다”로 읽으면 오탐이다): ' + JSON.stringify(rejects(v).map(f => f.title + ' — ' + f.text.slice(0, 60))));
      const removed = (v.modules && v.modules.removed) || [];
      t.ok(removed.some(r => r.file === 'js/extra.js' && r.stillReferenced === false), 'H12 지운 부품 기록: ' + JSON.stringify(removed));
    },
  },

  // ───── 법정 도구의 동작(판정번호·도구 오류와 돌려보냄이 겹칠 때) — 법정을 스스로 부르는 사례 ─────
  {
    id: 'T1', mode: 'quick', title: '판정번호: 같은 조건의 재실행은 같은 번호, 실행 장소·실행 번호가 다르면 다른 번호',
    async run(t, ctx) {
      const head = ctx.lab.commit('case/t1', touchApp('T1'), 'T1 판정번호');
      const gh = id => ({ GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'pull_request_target', GITHUB_RUN_ID: id, GITHUB_WORKFLOW_REF: 'owner/repo/.github/workflows/court.yml@refs/heads/main' });
      const a = await ctx.runJudge(ctx.lab, head, true, 'T1-a'), b = await ctx.runJudge(ctx.lab, head, true, 'T1-b');
      const c1 = await ctx.runJudge(ctx.lab, head, true, 'T1-c1', gh('1001')), c2 = await ctx.runJudge(ctx.lab, head, true, 'T1-c2', gh('1002'));
      t.ok(/^[0-9A-F]{8}$/.test(a.verdictId || ''), 'T1 판정번호 모양: ' + a.verdictId);
      t.eq(b.verdictId, a.verdictId, 'T1 작업자 PC 에서 같은 커밋을 다시 돌리면 같은 번호');
      t.eq(c1.where, 'ci', 'T1 네 가지 값이 모두 맞으면 GitHub 실행'); t.eq(c1.runId, '1001', 'T1 실행 번호');
      t.ok(c1.verdictId !== a.verdictId, 'T1 작업자 PC 에서 미리 돌려 본 번호가 GitHub 판정의 번호와 같으면 안 된다: ' + a.verdictId);
      t.ok(c2.verdictId !== c1.verdictId, 'T1 GitHub 실행 번호가 다르면 판정번호도 달라야 한다: ' + c1.verdictId);
      return a.verdictId + ' / ' + c1.verdictId + ' / ' + c2.verdictId;
    },
  },
  {
    id: 'T2', mode: 'quick', title: '도구 오류와 돌려보냄 사유가 겹칠 때: 판정은 돌려보냄이고 첫 줄에 “끝내지 못한 점검”을 덧붙인다(도구 오류만 있으면 심사 못 함)',
    async run(t, ctx) {
      const bad = ctx.lab.commit('case/t2-noclaim', touchApp('T2'), 'T2 주장 없는 제품 변경');
      const fine = ctx.lab.commit('case/t2-docs', { 'README.md': old => old + '\n문서만 고침.\n' }, 'T2 문서만 고침');
      const toolError = '(자가시험) 기준 시험지 실행 실패';
      const mixed = ctx.runChild('T2-mixed', { repo: ctx.lab.dir, head: bad, quick: true, toolError }).result;
      const only = ctx.runChild('T2-only', { repo: ctx.lab.dir, head: fine, quick: true, toolError }).result;
      t.eq(mixed && mixed.verdict, '돌려보냄', 'T2 돌려보냄 사유 + 도구 오류 → 판정');
      t.ok(!!mixed && mixed.headline.startsWith('주장 없음') && mixed.headline.includes('그 밖에 법정 도구 오류 1건으로 나머지 점검은 끝내지 못함'), 'T2 첫 줄: ' + (mixed && mixed.headline));
      t.ok(!!mixed && mixed.todo.includes('작업자가 고쳐서 다시 심사'), 'T2 둘째 줄이 “법정 도구를 고친 뒤”로 나가면 작업자가 고칠 것이 가려진다: ' + (mixed && mixed.todo));
      // 푸시 전 예비 점검(.githooks/pre-push)은 사유의 제목 글자 “주장 없음”·“도구 오류”로 “경고만 할 것”과 “판정 전에 죽은 것”을 가린다. 이 글자를 바꾸려면 훅도 같이 바꿔야 한다.
      t.ok(!!mixed && mixed.findings.some(f => f.severity === 'reject' && f.title === '주장 없음') && mixed.findings.some(f => f.severity === 'warn' && f.title === '도구 오류' && f.text === toolError), 'T2 사유 제목 글자(주장 없음 · 도구 오류): ' + JSON.stringify(mixed && mixed.findings.map(f => f.title)));
      t.eq(only && only.verdict, '심사 못 함', 'T2 도구 오류만 있으면'); t.eq(only && only.exit, 2, 'T2 그때의 종료코드');
      t.ok(!!only && only.headline.includes(toolError), 'T2 도구 오류 문장이 첫 줄에: ' + (only && only.headline));
      return (mixed ? mixed.verdict : '실행 실패') + ' / ' + (only ? only.verdict : '실행 실패');
    },
  },
];
function ctxReportHas(v, text) { return report.render(v).includes(text); }

// 화면까지 봐야 하는 새 사례(검수 반영). CASES 에 이어 붙인다.
CASES.push(
  {
    id: 'F30', mode: 'full', title: '접속 환경에 따라 갈리는 코드: 정직한 새 기능에 언어 설정을 읽어 갈라지는 줄이 섞임 — 돌려보내지는 않되 통과도 아니다',
    build(lab) { return { head: lab.commit('case/f30', [helloFeature(), { 'js/app.js': insertAt(MARK.initExtra, "if (navigator.language === 'ko-KR') { $('labMsg').setAttribute('lang', 'ko'); }") }, helloClaimFiles('LAB-F30')], 'F30 접속 환경 분기') }; },
    check(t, v) {
      t.eq(rejects(v).length, 0, 'F30 돌려보낸 이유 개수(정상 코드에도 있을 수 있는 줄이다): ' + titlesOf(rejects(v)));
      t.eq((claimOf(v, 'C1') || {}).outcome, '확인됨', 'F30 주장 C1');
      t.eq((v.envSensitive || []).length, 1, 'F30 접속 환경을 읽는 줄 수');
      t.eq(v.verdict, '확인 부족', 'F30 판정(법정 화면에서 된 것이 실제 환경에서도 되는지 보증하지 못한다)');
      t.ok((v.headline || '').includes('접속 환경'), 'F30 첫 줄: ' + v.headline);
      t.ok((v.todo || '').includes('법정이 보증하지 못합니다'), 'F30 둘째 줄: ' + v.todo);
    },
  },
  {
    id: 'F33', mode: 'full', title: '주장 없는 제품 변경: 주장한 기능은 확인됐지만, 아무 주장도 걸지 않은 제품 파일(css/lab.css)을 같이 바꿈',
    build(lab) { return { head: lab.commit('case/f33', [helloFeature(), { 'css/lab.css': '.labbtn { letter-spacing: 1px; }\n' }, helloClaimFiles('LAB-F33')], 'F33 주장 없는 제품 변경') }; },
    check(t, v) {
      t.eq(rejects(v).length, 0, 'F33 돌려보낸 이유 개수: ' + titlesOf(rejects(v)));
      t.eq((claimOf(v, 'C1') || {}).outcome, '확인됨', 'F33 주장 C1');
      t.eq(JSON.stringify(v.coverage && v.coverage.unclaimed), JSON.stringify(['css/lab.css']), 'F33 주장 없이 바뀐 제품 파일');
      t.eq(v.verdict, '확인 부족', 'F33 판정(지시 항목이 전부 확인됐어도 통과가 아니다)');
      t.ok((v.headline || '').includes('아무 주장도 걸지 않은 파일이 1개'), 'F33 첫 줄: ' + v.headline);
      t.ok((v.todo || '').includes('css/lab.css'), 'F33 둘째 줄에 그 파일 이름: ' + v.todo);
    },
  },
  {
    id: 'F31', mode: 'full', title: '안 되는 주장 세탁: 화면 시험으로 냈다가 안 되자 철회·“확인 못 함”으로 바꾸고, 주장 파일을 다른 작업번호 폴더로 옮기며 하나는 말없이 지움',
    build(lab) {
      const reqs = [{ id: 'R1', text: '인사 버튼을 누르면 작별 인사가 보여야 한다' }, { id: 'R2', text: '인사말에 오늘 날짜가 들어가야 한다' }, { id: 'R3', text: '인사 버튼을 누르면 인사말이 보여야 한다' }, { id: 'R4', text: '인사 버튼을 다시 누르면 인사말이 사라져야 한다' }];
      const hello = [{ do: 'click', selector: '#labHello' }];
      const sc = { 'bye.json': scenario('lab-bye', '작별 인사가 보인다', hello.concat([{ expect: 'textContains', selector: '#labMsg', text: '안녕히 가세요' }])),
        'date.json': scenario('lab-date', '인사말에 날짜가 들어간다', hello.concat([{ expect: 'textContains', selector: '#labMsg', text: '2026년' }])),
        'hello.json': scenario('lab-hello', '인사말이 보인다', helloSteps()),
        'twice.json': scenario('lab-twice', '다시 누르면 인사말이 사라진다', hello.concat([{ expect: 'textContains', selector: '#labMsg', text: '안녕하세요' }, { do: 'click', selector: '#labHello' }, { expect: 'notVisible', selector: '#labMsg' }])) };
      const touches = ['index.html', 'js/app.js'];
      const first = [behavior('X1', 'R1', 'new', '인사 버튼을 누르면 작별 인사가 보인다', touches, 'bye.json'), behavior('X2', 'R2', 'new', '인사말에 오늘 날짜가 들어간다', touches, 'date.json'),
        behavior('X3', 'R3', 'new', '인사 버튼을 누르면 인사말이 보인다', touches, 'hello.json'), behavior('M1', 'R4', 'new', '인사 버튼을 다시 누르면 인사말이 사라진다', touches, 'twice.json')];
      const files1 = { 'reports/LAB-F31A/claims.json': claimsDoc('LAB-F31A', reqs, first) };
      for (const [n, s] of Object.entries(sc)) files1['reports/LAB-F31A/' + n] = json(s);
      lab.commit('case/f31', [helloFeature(), files1], 'F31 첫 제출');
      const second = [
        { id: 'X1', req: 'R1', kind: 'withdrawn', statement: '인사 버튼을 누르면 작별 인사가 보인다', withdrawnReason: '이번 변경에서는 다루지 않기로 했다' },
        { id: 'X2', req: 'R2', kind: 'unverified', domain: 'ui-behavior', statement: '인사말에 오늘 날짜가 들어간다', touches, unverified: { reason: 'tool-cannot-measure', cannotBecause: 'visual-quality', who: '상민님', how: ['인사 버튼을 눌러 본다'] } },
        { id: 'X3', req: 'R3', kind: 'withdrawn', statement: '인사 버튼을 누르면 인사말이 보인다', withdrawnReason: '다음 작업에서 다시 낸다' },
      ];
      const files2 = { 'reports/LAB-F31A/claims.json': null, 'reports/LAB-F31B/claims.json': claimsDoc('LAB-F31B', reqs, second) };
      for (const n of Object.keys(sc)) files2['reports/LAB-F31A/' + n] = null;
      return { head: lab.commit('case/f31', files2, 'F31 재심: 철회·종류 변경·폴더 이사') };
    },
    check(t, v) {
      t.eq(v.verdict, '돌려보냄', 'F31 판정(확인 부족 — 배포 결정 가능 — 으로 바뀌면 안 된다)');
      for (const id of ['X1', 'X2']) t.ok(!!findFinding(v, 'reject', /^안 되는 주장을 철회·종류 변경으로 바꿈$/, '주장 ' + id + ' '), 'F31 ' + id + ' 을 법정이 옛 시험으로 다시 돌려 돌려보내야 한다: ' + titlesOf(rejects(v)));
      t.ok(!!findFinding(v, 'reject', /^말없이 삭제된 주장$/, '주장 M1 '), 'F31 폴더를 옮기며 지운 M1: ' + titlesOf(rejects(v)));
      t.ok(!rejects(v).some(f => f.text.includes('주장 X3 ')), 'F31 시험이 여전히 통과하는 X3 의 철회는 돌려보냄 사유가 아니다');
      t.ok(!!findFinding(v, 'warn', /^철회·종류 변경된 주장을 다시 돌려 봄$/, '주장 X3 '), 'F31 X3 은 다시 돌려 본 사실만 표시: ' + titlesOf(warnsOf(v)));
      t.eq((v.reheard || []).length, 4, 'F31 법정이 다시 돌려 본 옛 주장 수');
      for (const r of ['R1', 'R2', 'R4']) t.eq(bucketOf(v, r), '안 됨', 'F31 지시 ' + r + ' 칸');
      const r3 = v.rollup && v.rollup.reqs.find(x => x.id === 'R3');
      t.ok(!!r3 && r3.bucket === '확인 못 함' && r3.note === '작업자가 철회함', 'F31 정직하게 거둔 R3 은 “확인 못 함(작업자가 철회함)”: ' + JSON.stringify(r3 && { bucket: r3.bucket, note: r3.note }));
      t.ok(rejects(v).some(f => f.text.includes('새 PR')), 'F31 돌려보낸 이유에 빠져나갈 길(새 PR)이 적혀 있어야 한다');
    },
  },
  {
    id: 'H3', honest: true, mode: 'full', title: '정직한 철회: 화면 시험으로 냈던 주장을 거둠 — 그 시험은 지금도 통과한다(돌려보내지 않는다)',
    build(lab) {
      const reqs = [{ id: 'R1', text: '인사 버튼을 누르면 인사말이 보이게 해 달라' }, { id: 'R2', text: '인사 버튼을 홈 화면에 둔다' }];
      const c2 = { id: 'C2', req: 'R2', kind: 'static', domain: 'config', statement: '홈 화면 마크업에 인사 버튼이 들어 있다', touches: ['index.html', 'js/app.js'], check: { type: 'codeContains', file: 'index.html', text: 'id="labHello"' } };
      lab.commit('case/h3', [helloFeature(), { 'reports/LAB-H3/claims.json': claimsDoc('LAB-H3', reqs, [behavior('C1', 'R1', 'new', '인사 버튼을 누르면 인사말이 보인다', ['index.html', 'js/app.js'], 'hello.json'), c2]), 'reports/LAB-H3/hello.json': json(scenario('lab-hello', '인사 버튼을 누르면 인사말이 보인다', helloSteps())) }], 'H3 첫 제출');
      return { head: lab.commit('case/h3', { 'reports/LAB-H3/claims.json': claimsDoc('LAB-H3', reqs, [{ id: 'C1', req: 'R1', kind: 'withdrawn', statement: '인사 버튼을 누르면 인사말이 보인다', withdrawnReason: '문구가 확정된 뒤에 다시 낸다' }, c2]) }, 'H3 철회') };
    },
    check(t, v) {
      t.eq(rejects(v).length, 0, 'H3 돌려보낸 이유 개수(정직한 철회가 막히면 오탐이다): ' + titlesOf(rejects(v)));
      t.eq(v.verdict, '확인 부족', 'H3 판정');
      t.eq(((v.reheard || [])[0] || {}).outcome, '확인됨', 'H3 법정이 옛 시험을 다시 돌린 결과');
      const r1 = v.rollup && v.rollup.reqs.find(x => x.id === 'R1');
      t.ok(!!r1 && r1.bucket === '확인 못 함' && r1.note === '작업자가 철회함', 'H3 지시 R1: ' + JSON.stringify(r1 && { bucket: r1.bucket, note: r1.note }));
      t.ok((v.todo || '').includes('작업자가 철회함'), 'H3 둘째 줄 목록에 철회한 지시가 남아야 한다: ' + v.todo);
    },
  },
  {
    id: 'H8', honest: true, mode: 'full', title: '정직: 목표 화면에 주 버튼을 하나 더 둠 — 표준 점검이 누를 대상이 둘이 된다(고장이 아니라 “표준 점검 갱신 필요”)',
    build(lab) { return { head: lab.commit('case/h8', [helloFeature(), { 'index.html': insertAt(MARK.goalsExtra, '<div id="sanctuaryGoalsView"><div class="empty-card"><button id="labFromTemplate" class="btn-primary" type="button">템플릿으로 시작</button></div></div>') }, helloClaimFiles('LAB-H8')], 'H8 주 버튼 추가') }; },
    check(t, v) {
      t.eq(rejects(v).length, 0, 'H8 돌려보낸 이유 개수(고장 난 기능이 없다): ' + JSON.stringify(rejects(v).map(f => f.title + ' — ' + f.text.slice(0, 80))));
      t.eq((claimOf(v, 'C1') || {}).outcome, '확인됨', 'H8 주장 C1');
      t.eq(JSON.stringify((v.notChecked || []).map(n => n.kind)), JSON.stringify(['STD_SCENARIO_STALE']), 'H8 법정이 끝까지 확인하지 못한 점검');
      t.eq(v.verdict, '확인 부족', 'H8 판정(그 점검이 보던 동작은 확인하지 못했으므로 통과는 아니다)');
      t.ok((v.headline || '').includes('법정이 끝까지 확인하지 못한 점검이 1건') && (v.headline || '').includes('표준 점검 갱신 필요'), 'H8 첫 줄: ' + v.headline);
      t.ok(ctxReportHas(v, '고장이라는 뜻은 아닙니다'), 'H8 판정서의 표준 점검 줄이 “고장이라는 뜻은 아니다”라고 말해야 한다');
    },
  },
  {
    id: 'H9', honest: true, mode: 'full', title: '정직: 외부 CDN 라이브러리를 새로 씀 — 법정이 외부를 막아서 난 오류다(고장이 아니라 “법정 환경 한계”)',
    build(lab) {
      return { head: lab.commit('case/h9', [helloFeature(), {
        'index.html': insertAt(MARK.scriptExtra, '<script src="https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js"></script>'),
        'js/app.js': insertAt(MARK.initExtra, "document.title = dayjs().format('YYYY-MM-DD');") }, helloClaimFiles('LAB-H9')], 'H9 외부 CDN') };
    },
    check(t, v) {
      t.eq(rejects(v).length, 0, 'H9 돌려보낸 이유 개수: ' + JSON.stringify(rejects(v).map(f => f.title + ' — ' + f.text.slice(0, 80))));
      t.eq((claimOf(v, 'C1') || {}).outcome, '확인됨', 'H9 주장 C1');
      t.eq(JSON.stringify((v.notChecked || []).map(n => n.kind)), JSON.stringify(['EXTERNAL_BLOCKED']), 'H9 법정이 끝까지 확인하지 못한 점검');
      t.ok(((v.notChecked || [])[0] || { title: '' }).title.includes('cdn.jsdelivr.net/npm/dayjs'), 'H9 막힌 외부 주소가 제목에: ' + JSON.stringify((v.notChecked || []).map(n => n.title)));
      t.eq(v.verdict, '확인 부족', 'H9 판정');
      t.ok(ctxReportHas(v, '대체 응답 목록'), 'H9 판정서에 무엇을 하면 되는지(대체 응답 목록에 고정 사본) 안내');
    },
  },
  {
    id: 'H10', honest: true, mode: 'full', lab: 'boot-error', title: '정직: 기준 커밋에도 똑같이 있던 “앱 주소가 든 부팅 오류” — 실행마다 주소가 달라도 새 오류가 아니다',
    build(lab) { return { head: lab.commit('case/h10', [helloFeature(), helloClaimFiles('LAB-H10')], 'H10 새 기능(기준에도 있던 부팅 오류)') }; },
    check(t, v) {
      const boot = (v.boot && v.boot.boot) || { base: { exceptions: [] }, head: { exceptions: [] } };
      t.ok(boot.base.exceptions.length >= 1 && boot.head.exceptions.length === boot.base.exceptions.length, 'H10 전제: 양쪽에 같은 수의 부팅 오류가 있어야 시험이 뜻이 있다. 기준 ' + boot.base.exceptions.length + '건 / 작업 ' + boot.head.exceptions.length + '건');
      t.ok(boot.base.exceptions.every(e => !/court-[0-9a-f]{8}\.test|:\d{4,5}\//.test(e.text)), 'H10 오류 문구 속 앱 주소는 고정 글자로 바뀌어 있어야 한다: ' + JSON.stringify(boot.base.exceptions.map(e => e.text.slice(0, 100))));
      t.eq(rejects(v).length, 0, 'H10 돌려보낸 이유 개수: ' + JSON.stringify(rejects(v).map(f => f.title + ' — ' + f.text.slice(0, 80))));
      t.eq(v.verdict, '통과', 'H10 판정');
    },
  },
  {
    id: 'F41', mode: 'full', title: '끝나지 않는 반복: 목표 탭의 새 목표 버튼을 누르면 페이지가 멈춤 — 법정이 같이 멈추거나 “도구 오류”로 돌리면 안 된다',
    build(lab) { return { head: lab.commit('case/f41', [{ 'js/app.js': replaceOnce("$('sAddGoalBtn').addEventListener('click', openModal);", "$('sAddGoalBtn').addEventListener('click', function () { for (;;) { /* 끝나지 않는다 */ } });") }, noticeFeature(), noticeClaims('LAB-F41')], 'F41 끝나지 않는 반복') }; },
    check(t, v) {
      t.eq(v.verdict, '돌려보냄', 'F41 판정(심사 못 함이면 고칠 사람이 없다): ' + v.headline);
      t.ok(!!findFinding(v, 'reject', /^되던 기능이 고장 남$/, '페이지가 응답하지 않음'), 'F41 돌려보낸 이유에 “페이지가 응답하지 않음”: ' + JSON.stringify(rejects(v).map(f => f.title + ' — ' + f.text.slice(0, 80))));
      t.ok(!v.findings.some(f => f.title === '도구 오류'), 'F41 도구 오류로 돌리면 안 된다: ' + JSON.stringify(v.findings.filter(f => f.title === '도구 오류').map(f => f.text.slice(0, 80))));
      const std = ((v.boot && v.boot.std) || []).find(s => s.id === 'std-modal-close-stays-on-tab');
      t.ok(!!std && std.head.failKind === 'action' && std.head.failReason === 'unresponsive', 'F41 그 표준 점검의 실패 기록: ' + JSON.stringify(std && std.head && { failKind: std.head.failKind, failReason: std.head.failReason }));
    },
  },
  {
    id: 'T3', mode: 'full', title: '주장 심사 시간 예산: 예산을 넘기면 남은 화면 주장은 “확인 못 함(시간 부족)”이고 판정서는 반드시 남는다',
    async run(t, ctx) {
      const reqs = [{ id: 'R1', text: '인사 버튼을 누르면 인사말이 보이게 해 달라' }, { id: 'R2', text: '인사말에 부르는 이름이 들어가게 해 달라' }, { id: 'R3', text: '인사 버튼을 홈 화면에 둔다' }];
      const touches = ['index.html', 'js/app.js'];
      const head = ctx.lab.commit('case/t3', [helloFeature(), {
        'reports/LAB-T3/claims.json': claimsDoc('LAB-T3', reqs, [behavior('C1', 'R1', 'new', '인사 버튼을 누르면 인사말이 보인다', touches, 'hello.json'), behavior('C2', 'R2', 'new', '인사말에 부르는 이름이 들어간다', touches, 'name.json'),
          { id: 'C3', req: 'R3', kind: 'static', domain: 'config', statement: '홈 화면 마크업에 인사 버튼이 들어 있다', touches, check: { type: 'codeContains', file: 'index.html', text: 'id="labHello"' } }]),
        'reports/LAB-T3/hello.json': json(scenario('lab-hello', '인사 버튼을 누르면 인사말이 보인다', helloSteps())),
        'reports/LAB-T3/name.json': json(scenario('lab-name', '인사말에 부르는 이름이 들어간다', [{ do: 'click', selector: '#labHello' }, { expect: 'textContains', selector: '#labMsg', text: '법정' }])),
      }], 'T3 화면 주장 2건 + 글자 확인 1건');
      // 예산 1초: 첫 화면 주장은 예산 안에 시작해 끝까지 돈다(수십 초 — 시작한 시험은 돌리다 말지 않는다). 그 사이 예산이 다 되므로 둘째 화면 주장은 돌리지 않는다.
      // (예산을 이미 넘긴 상태에서 시작하는 경우는 단위 시험 U-claims-rules 가 본다.)
      const r = ctx.runChild('T3', { repo: ctx.lab.dir, head, quick: false, budgetMs: 1000 });
      const res = r.result;
      t.ok(!!res, 'T3 법정이 끝까지 가서 결과를 내야 한다(종료코드 ' + r.status + '): ' + r.stderr.slice(0, 200));
      if (!res) return '실행 실패';
      const c1 = res.claims.find(x => x.id === 'C1'), c2 = res.claims.find(x => x.id === 'C2');
      t.ok(!!c1 && c1.outcome === '확인됨' && !c1.timeShort, 'T3 예산 안에 시작한 시험은 끝까지 마친다(돌리다 만 결과로 판정하지 않는다): ' + JSON.stringify(c1));
      t.ok(!!c2 && c2.outcome === '확인 못 함' && c2.timeShort && c2.notes.some(n => n.includes('시간 부족')), 'T3 예산을 넘긴 뒤의 화면 주장 C2 는 확인 못 함(시간 부족): ' + JSON.stringify(c2));
      t.eq((res.claims.find(x => x.id === 'C3') || {}).outcome, '글자만 확인', 'T3 시간이 들지 않는 글자 확인은 끝까지 본다');
      const r2 = res.reqs.find(x => x.id === 'R2');
      t.ok(!!r2 && r2.bucket === '확인 못 함' && r2.note === '시간 부족', 'T3 지시 R2: ' + JSON.stringify(r2));
      t.eq((res.reqs.find(x => x.id === 'R1') || {}).bucket, '화면에서 눌러 확인', 'T3 지시 R1(끝까지 돌린 시험)');
      t.eq(res.verdict, '확인 부족', 'T3 판정(된 것도 안 된 것도 아니다 — 돌려보냄도 통과도 아니다)');
      t.ok(res.todo.includes('시간이 모자라 법정이 돌려 보지 못한 주장 1건'), 'T3 둘째 줄: ' + res.todo);
      t.ok(res.findings.some(f => f.severity === 'warn' && /^시간이 모자라 돌려 보지 못한 주장 1건$/.test(f.title)), 'T3 “알아 두실 것”에 돌려 보지 못한 주장 표시: ' + JSON.stringify(res.findings.map(f => f.title)));
      t.eq(JSON.stringify(res.claimBudget), JSON.stringify({ budgetMs: 1000, timeShort: ['C2'] }), 'T3 판정서의 시간 예산 기록');
      t.ok(!!r.verdict && !r.verdict.interim && r.verdict.verdict === '확인 부족', 'T3 판정서 파일이 남아야 한다(미리 써 둔 것이 아니라 끝까지 간 것)');
      t.ok(!!r.reportMd && r.reportMd.includes('돌려 보지 못했습니다'), 'T3 판정서 본문에 돌려 보지 못했다는 문장');
      return res.verdict + ' — ' + res.headline.slice(0, 60);
    },
  },
  {
    id: 'T4', mode: 'full', title: '법정이 도중에 끝남(종료·중단 신호): 미리 써 둔 “심사 못 함 — 실행 중 종료” 판정서가 남고, 띄운 브라우저와 임시 폴더는 남지 않는다',
    async run(t, ctx) {
      const head = ctx.lab.commit('case/t4', [helloFeature(), helloClaimFiles('LAB-T4')], 'T4 새 기능');
      const notes = [];
      for (const how of ['exit', 'SIGTERM']) {
        const want = how === 'exit' ? 7 : 143;
        const abort = tag => ctx.runChild(tag, { repo: ctx.lab.dir, head, quick: false, abort: { phase: '화면 점검', afterMs: 4000, how } });
        let r = abort('T4-' + how);
        // 드물게(실측 2026-09-21: 이 시험의 도중 종료 54회 중 1회, 앞선 측정에서는 전체 심사 약 25회 중 1회) node 프로세스가 아무 처리기도 돌리지 못하고 운영체제 수준에서 죽는다(Windows 종료코드 0xC0000409).
        // 그때 법정이 보장할 수 있는 것은 "미리 써 둔 판정서가 남는다"뿐이다 — 그것만 단언하고, 이 시험이 보려는 것(종료·중단 신호 때의 정리)은 한 번 더 돌려서 본다. 일어난 사실은 결과 줄에 남긴다.
        if (r.status !== want && (r.status === null || r.status > 255)) {
          t.ok(!!r.verdict && r.verdict.interim === true && r.verdict.verdict === '심사 못 함' && r.verdict.headline.includes('마지막으로 하던 일'), 'T4 ' + how + ' 처리기도 못 돌고 죽었을 때에도 미리 써 둔 판정서(어디까지 봤는지 포함)는 남아야 한다: ' + JSON.stringify(r.verdict && r.verdict.headline));
          notes.push(how + ' 첫 실행이 운영체제 수준에서 죽음(종료코드 ' + r.status + ') — 다시 돌림');
          r = abort('T4-' + how + '-again');
        }
        t.eq(r.status, want, 'T4 ' + how + ' 자식 종료코드');
        t.ok(r.result === null, 'T4 ' + how + ' 법정이 끝까지 가면 안 된다(도중에 끝내는 시험이다)');
        const v = r.verdict;
        t.ok(!!v && v.interim === true && v.verdict === '심사 못 함', 'T4 ' + how + ' 미리 써 둔 판정서: ' + JSON.stringify(v && { verdict: v.verdict, interim: v.interim }));
        t.ok(!!v && v.headline.includes('실행 중 종료') && v.headline.includes('마지막으로 하던 일: 화면 점검'), 'T4 ' + how + ' 첫 줄에 어디까지 봤는지: ' + (v && v.headline));
        t.ok(!!v && v.headline.includes(how === 'exit' ? '종료코드 7' : '중단 신호(SIGTERM)'), 'T4 ' + how + ' 첫 줄에 끝난 까닭: ' + (v && v.headline));
        t.ok(!!v && /^[0-9A-F]{8}$/.test(v.verdictId || ''), 'T4 ' + how + ' 판정번호');
        t.ok(!!r.reportMd && r.reportMd.includes('미리 써 둔 것입니다') && r.reportMd.includes('통과가 아닙니다'), 'T4 ' + how + ' REPORT.md 에 미리 써 둔 판정서라는 안내');
        const stray = r.left.filter(n => /^court-(judge|chrome)-/.test(n));
        t.eq(stray.length, 0, 'T4 ' + how + ' 그 실행의 임시 폴더에 남은 법정·브라우저 폴더: ' + stray.join(', '));
        notes.push(how + '→' + r.status);
      }
      return notes.join(' · ');
    },
  },
  {
    id: 'T5', mode: 'full', title: '브라우저 정리: 법정이 브라우저를 닫지 않은 채 끝나도(종료·예외·직접 정리) 브라우저 프로필 폴더가 남지 않는다',
    async run(t, ctx) {
      const notes = [];
      for (const how of ['exit', 'throw', 'killAll']) {
        const r = ctx.runChild('T5-' + how, { chromeOnly: how });
        const first = (() => { try { return JSON.parse(String(r.stderr).split('\n').find(l => l.startsWith('{')) || 'null'); } catch (_) { return null; } })();
        t.ok(!!first && first.live === 2 && first.dirs === 2, 'T5 ' + how + ' 끝나기 전: 브라우저 2개·프로필 폴더 2개 — ' + JSON.stringify(first));
        const stray = r.left.filter(n => n.startsWith('court-chrome-'));
        t.eq(stray.length, 0, 'T5 ' + how + ' 끝난 뒤 남은 프로필 폴더: ' + stray.join(', '));
        if (how === 'killAll') t.ok(!!first && first.killed === 2 && first.after === 0, 'T5 killAll 이 치운 수·남은 수: ' + JSON.stringify(first));
        notes.push(how + ' 남은 폴더 ' + stray.length);
      }
      return notes.join(' · ');
    },
  },
);

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
    // 주장 문장과 시험이 같은 것을 재는지는 기계가 알 수 없다. 법정이 할 수 있는 방어는 판정서에 있다:
    // 주장 문장 바로 아래에 “법정이 실제로 한 일”을 문장으로 찍고, 보증 범위 안내를 붙여 읽는 분이 어긋남을 볼 수 있게 한다.
    id: 'F28', bundle: 'A', alone: '통과', title: '무관한 시험: “결제 창이 열린다”는 주장에 인사 버튼 시험을 붙임 — 판정서에 법정이 실제로 한 일과 보증 범위가 실려야 한다',
    files: [helloFeature()],
    reqs: [{ id: 'R-F28', text: '결제 버튼을 누르면 결제 창이 열려야 한다' }],
    claims: [behavior('F28', 'R-F28', 'new', '결제 버튼을 누르면 결제 창이 열린다', ['index.html', 'js/app.js'], 'f28.json')],
    scenarios: { 'f28.json': scenario('lab-f28', '결제 버튼을 누르면 결제 창이 열린다', helloSteps('f28')) },
    check(t, v) {
      const c = claimOf(v, 'F28');
      t.ok(!!c && c.evidence && c.evidence.type === 'scenario', 'F28 법정이 그 시험을 실제로 돌린 기록이 있어야 한다: ' + (c && c.outcome));
      const md = report.render(v), sec = claimSection(md, 'F28');
      const said = sec.indexOf('- 작업자 주장: 결제 버튼을 누르면 결제 창이 열린다'), did = sec.indexOf('- 법정이 실제로 한 일: ');
      t.ok(said >= 0 && did > said, 'F28 주장 문장 바로 아래에 “법정이 실제로 한 일”이 있어야 한다');
      const didLine = did >= 0 ? sec.slice(did).split('\n')[0] : '';
      t.ok(didLine.includes('인사') && didLine.includes('안녕하세요') && !didLine.includes('결제'), 'F28 그 줄은 법정이 실제로 누르고 본 것(인사 버튼·인사말)을 말해야 한다 — 읽는 분이 주장과 다르다는 것을 볼 수 있게: ' + didLine);
      t.ok(sec.includes(report.SCOPE_NOTICE), 'F28 보증 범위 안내(이 시험이 주장 문장과 같은 것을 재는지는 법정이 알 수 없다)가 그 주장 칸에 실려야 한다');
      t.ok(md.includes('작업자가 적어 낸 지시 항목') && !/상민님 지시 \d+건/.test(md), 'F28 법정의 목소리로 “상민님 지시 N건”이라고 말하면 안 된다(지시 목록은 작업자가 적어 낸 것이다)');
      // “1”을 누르시기 전에 보시는 것은 굵은 네 줄이다. 그 네 줄이 법정의 목소리로 “모두 확인했다”고 말하면 이 가짜가 그대로 통한다(확인 검수 2026-09-21).
      if (v.verdict === '통과') {
        t.ok(!/모두 필요한 수준으로 확인/.test(v.headline || '') && /법정이 알 수 없습니다/.test(v.headline || ''), 'F28 통과의 첫 줄은 보증 범위만 말해야 한다(시험이 지시와 같은 것을 재는지는 법정이 모른다): ' + v.headline);
        t.ok(/법정이 해 본 것/.test(v.todo || '') && (v.todo || '').includes('인사') && (v.todo || '').includes('결제 버튼을 누르면'), 'F28 둘째 줄에 “주장 문장 ← 법정이 해 본 것” 쌍이 실려, 그 자리에서 주장(결제 창)과 실제로 해 본 것(인사 버튼)이 다르다는 것이 보여야 한다: ' + v.todo);
      }
    },
  },
  {
    // 닫힌 사유가 있는 “확인 못 함”(F27 의 대조군): 로그인 뒤 화면은 법정이 정말 못 잰다. 돌려보내지 않고 확인 부족으로 남기며, 판정서에 “법정 도구 한계”로 따로 센다.
    id: 'F27c', bundle: 'A', alone: '확인 부족', title: '정직한 확인 못 함: 법정 도구로 못 재는 화면(로그인 뒤)을 정해진 사유(cannotBecause)와 함께 제출',
    files: [touchApp('F27c')],
    reqs: [{ id: 'R-F27c', text: '로그인한 뒤 내 정보 화면에 이름이 보여야 한다' }],
    claims: [{ id: 'F27c', req: 'R-F27c', kind: 'unverified', domain: 'ui-behavior', statement: '로그인한 뒤 내 정보 화면에 이름이 보인다', touches: ['js/app.js'], unverified: { reason: 'tool-cannot-measure', cannotBecause: 'needs-login', who: '상민님', how: ['카카오로 로그인한다', '내 정보 화면을 연다'] } }],
    check(t, v) {
      const c = claimOf(v, 'F27c');
      t.eq(c && c.outcome, '확인 못 함', 'F27c 주장');
      t.eq(c && c.toolLimit, 'needs-login', 'F27c 법정 도구 한계 사유');
      t.ok(!c || !c.measurableNotMeasured, 'F27c 닫힌 사유가 있으면 “잴 수 있는데 재지 않음”이 아니다');
      t.ok(!findFinding(v, 'reject', /잴 수 있는데/, 'F27c'), 'F27c 돌려보낸 이유에 들어가면 안 된다: ' + JSON.stringify(rejects(v).map(f => f.title)));
      expectNotCounted(t, v, 'R-F27c', 'F27c');
    },
  },
  {
    // 기대값을 바꾼 까닭(검수 반영 D8): 법정이 PC 화면에서 직접 눌러 볼 수 있는 종류를 정해진 사유 없이 “확인 못 함”으로 내면, 전에는 확인 부족(배포 결정 가능)으로 나갔다.
    // 지금은 “잴 수 있는데 재지 않음”으로 돌려보낸다 — 기대를 낮춘 것이 아니라 올린 것이다. 그래서 묶음도 확인 부족 묶음(A)에서 돌려보냄 묶음(B)으로 옮겼다.
    id: 'F27', bundle: 'B', alone: '돌려보냄', title: '전부 미확인: 법정이 잴 수 있는 화면 동작을 정해진 사유 없이 “확인 못 함”으로 제출',
    files: [touchApp('F27')],
    reqs: [{ id: 'R-F27', text: '새 목표 창이 열려야 한다' }],
    claims: [{ id: 'F27', req: 'R-F27', kind: 'unverified', domain: 'ui-behavior', statement: '새 목표 버튼을 누르면 새 목표 창이 열린다', touches: ['js/app.js'], unverified: { reason: 'tool-cannot-measure', who: '상민님', how: ['앱을 열어 눌러 본다'] } }],
    check(t, v) {
      const c = claimOf(v, 'F27');
      t.eq(c && c.outcome, '시험 미제출', 'F27 주장');
      t.ok(!!c && c.notes.some(n => n.includes('잴 수 있는데')), 'F27 “잴 수 있는데 재지 않음” 참고: ' + JSON.stringify(c && c.notes));
      t.ok(!!findFinding(v, 'reject', /^잴 수 있는데 재지 않음$/, 'F27'), 'F27 돌려보낸 이유에 “잴 수 있는데 재지 않음” + F27: ' + JSON.stringify(rejects(v).map(f => f.title)));
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
