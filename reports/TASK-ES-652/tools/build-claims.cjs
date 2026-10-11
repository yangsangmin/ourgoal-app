'use strict';
// 주장 파일(reports/TASK-ES-652/claims.json)을 만든다. 값은 측정 파일의 경로로만 건다. 사용: node build-claims.cjs <작업 트리>
const fs = require('fs'), path = require('path');
const WORK = path.resolve(process.argv[2]);
const R = 'reports/TASK-ES-652/';
const out = {
  task: 'TASK-ES-652',
  requirementsSource: 'docs/specs/REQ-TASK-ES-652-SESSION-CHANNEL-SETTER.md',
  requirements: [
    { id: 'R1', text: 'index.html 의 USER_SESSION_CHANNEL 통로 노출 줄에 setter 한 칸을 더한다. 바뀌는 것은 그 한 줄뿐이고 줄 수는 그대로다. 그 이름을 통로로 쓰는 코드가 아직 없으므로 앱 동작은 그대로다.' },
    { id: 'R2', text: '더한 뒤 통로에서 USER_SESSION_CHANNEL 쓰기 왕복이 된다(써 보고 되읽은 값이 같고 원래 값으로 돌아간다). 더하기 전에는 getter 전용 오류였다.' },
    { id: 'R3', text: '증명 하한: 통로·window 이름 값 지문 차이 0 · 모듈 로드 새 회귀 0 · npm test 검사 수 동일 · 인라인 줄 수 불변 · tests·금고·생성기·생성 지도 변경 0.' },
  ],
  outOfScopeReports: [
    { text: '로그인 뒤 실시간 채널 구독·원격 로그아웃 수신은 재지 않았다. 이 PR 은 그 경로를 바꾸지 않는다(setupUserSessionRealtime 은 덩어리에 그대로 있고 맨이름으로 대입한다). 그 함수의 이전은 다음 PR 이다.', cannotBecause: 'out-of-scope-feature' },
    { text: '통로 쓰기 왕복은 작업자 PC 의 브라우저 실측이다(법정 시나리오 단계로는 통로에 값을 쓸 수 없다). 기록 파일의 값을 주장으로 걸었으며, 법정이 그 쓰기를 다시 돌린 것은 아니다.' },
  ],
  claims: [
    { id: 'C1', req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior',
      statement: '게스트로 진입해 홈→목표→기록→일정→소통→설정→홈 순서로 탭을 누르면 누른 탭이 활성이 되고 예외가 없다 — 통로 노출 줄에 setter 를 더하기 전과 같다.',
      touches: ['index.html'], scenario: 'scenarios/c1-guest-boot-six-tabs.json' },
    { id: 'C2', req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior',
      statement: '게스트로 설정 탭 맨 아래 「이용약관」·「개인정보처리방침」 링크를 누르면 각각 약관 창이 열리고 예외가 없다 — 통로 노출 줄에 setter 를 더하기 전과 같다.',
      touches: ['index.html'], scenario: 'scenarios/c2-settings-legal-links.json' },
  ],
};
const st = (id, req, statement, file, p, eq) => out.claims.push({ id, req, kind: 'static', domain: 'config', statement, touches: [R + file], check: { type: 'jsonPath', file: R + file, path: p, equals: eq } });
st('C3', 'R1', '기준과 작업의 index.html 을 줄 단위로 맞대면 다른 줄이 1줄이다.', 'measurement.json', 'summary.changedLine.differingLines', 1);
st('C4', 'R1', 'index.html 의 줄 수 변화가 0 이다.', 'measurement.json', 'summary.changedLine.netLineGrowth', 0);
st('C5', 'R1', '그 한 줄은 기준에서 getter 전용 줄이었고 작업에서는 같은 getter 뒤에 setter 한 칸이 붙은 줄이다.', 'measurement.json', 'summary.changedLine.workIsGetterPlusSetter', true);
st('C6', 'R1', '바뀐 제품 파일은 index.html 하나다.', 'measurement.json', 'summary.changed.onlyIndexHtml', true);
st('C7', 'R2', '작업 트리에서 통로에 USER_SESSION_CHANNEL 을 써 보고 되읽은 값이 같았고 원래 값으로 되돌렸다.', 'scope-write.work.json', 'writeRoundTripOk', true);
st('C8', 'R2', '기준 트리에서는 같은 쓰기가 되지 않았다(getter 전용).', 'scope-write.base.json', 'writeRoundTripOk', false);
st('C9', 'R2', '이 PR 의 판에서 setupUserSessionRealtime 이전을 모의로 돌리면 검사기가 ok 다(선행 전에는 「마지막 노출 setter」 FAIL).', 'mock-move.json', 'afterPreceding.verifyOk', true);
st('C10', 'R3', '기준 이름 목록으로 맞댄 통로 이름의 값 지문이 다른 이름이 없다.', 'measurement.json', 'summary.names.scopeFingerprintDiff', []);
st('C11', 'R3', 'window 이름의 값 지문이 다른 이름이 없다.', 'measurement.json', 'summary.names.windowFingerprintDiff', []);
st('C12', 'R3', '통로에서 사라진 이름이 없다.', 'measurement.json', 'summary.names.scopeLost', []);
st('C13', 'R3', '모듈 로드 탐침 결과에서 기준 대비 새 회귀 목록이 비어 있다.', 'module-load.json', 'regressions', []);
st('C14', 'R3', 'npm test 의 종료 코드·검사 줄 수·요약 줄이 기준 트리와 작업 트리에서 같다.', 'npm-test-compare.json', 'allSame', true);
st('C15', 'R3', '시험 파일을 하나씩 돌렸을 때 종료 코드나 ok 줄 수가 기준과 다른 파일이 0개다.', 'tests-all-compare.json', 'differingCount', 0);
st('C16', 'R3', '인라인 스크립트 줄 수가 기준과 같다.', 'measurement.json', 'summary.ratchet.inlineScriptLinesSame', true);
st('C17', 'R3', '이 작업이 바꾼 파일 가운데 tests/ 아래 파일이 없다.', 'measurement.json', 'summary.changed.testsChanged', []);
st('C18', 'R3', '이 작업이 바꾼 파일 가운데 금고 파일이 없다.', 'measurement.json', 'summary.changed.vaultChanged', []);
st('C19', 'R3', '이 작업이 바꾼 파일 가운데 생성기·생성 지도·기준선 파일이 없다.', 'measurement.json', 'summary.changed.generatedMapsChanged', []);
fs.writeFileSync(path.join(WORK, R, 'claims.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
const errs = require(path.join(WORK, 'court', 'claims.js')).validateClaims(out, { claimsFile: R + 'claims.json' });
console.log('claims', out.claims.length, 'errors', JSON.stringify(errs));
