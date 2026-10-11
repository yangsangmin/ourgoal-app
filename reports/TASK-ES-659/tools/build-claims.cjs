'use strict';
// 주장 파일(reports/TASK-ES-659/claims.json)을 만든다. 값은 측정 파일의 경로로만 건다. 사용: node build-claims.cjs <작업 트리>
const fs = require('fs'), path = require('path');
const WORK = path.resolve(process.argv[2]);
const R = 'reports/TASK-ES-659/';
const delta = JSON.parse(fs.readFileSync(path.join(WORK, R, 'measurement.json'), 'utf8')).summary.inlineScriptLines.delta; // 주장 문장에 적을 변화량(측정 파일에서 읽는다 — 손으로 옮기지 않는다)
const CELL = 'js/core/gcal-token-save.js';
const out = {
  task: 'TASK-ES-659',
  requirementsSource: 'docs/specs/REQ-TASK-ES-659-SAVE-GOOGLE-TOKEN-MOVE.md',
  requirements: [
    { id: 'R1', text: 'saveGoogleToken(구글 캘린더 토큰 저장)을 생성기(gen-inline-hard.js)로 세포 js/core/gcal-token-save.js 에 글자 그대로 옮긴다. 게스트 화면의 동작을 보존한다(손 편집 0).' },
    { id: 'R2', text: '옮긴 함수가 쓰는 arguments 는 헌법 CELL_SPLIT 5호(v2026.10.11-ARGUMENTS)가 허용한 꼴(함수 선언 자신의 것)뿐이고, 인자 수를 바꿔 직접 부른 결과가 이전 전과 같다.' },
    { id: 'R3', text: '구글 캘린더 연동 뒤 동작(구글 동의로 받은 토큰이 로그인한 계정의 키에 저장되고 다시 열었을 때 복원됨)이 이전 전과 같다.' },
    { id: 'R4', text: '증명 하한(헌법 CELL_SPLIT_PROOF): 옮긴 구간의 토큰 동일·누수 0 · 모듈 단독 로드 새 회귀 0 · 통로·window 이름의 값 지문이 옮긴 함수 말고 같음 · npm test 검사 줄 수 동일 · tests·금고·생성기 변경 0.' },
    { id: 'R5', text: '기준선(docs/architecture/module-baseline.json)에 줄어든 인라인 스크립트 줄 수를 기록한다(지시함 DIR-003).' },
  ],
  outOfScopeReports: [
    { text: '직접 호출 실측(save-token-probe.json)은 게스트로 띄운 임시 브라우저에서 가짜 토큰 객체로 함수를 부른 작업자 PC 측정이다. 법정이 그 호출을 다시 돌린 것은 아니다. 다섯 경우 가운데 둘(D · E)은 state.profile 을 임시 객체로 바꿔 부른 뒤 되돌렸다.' },
    { text: '함수 선언 바로 앞에 있던 표지 주석 두 줄(#TASK-ES-575 · #TASK-ES-482 이전 표지)이 생성기 규칙(앞 주석 포함)에 따라 함수와 함께 세포로 옮겨졌다. 실행되는 글자가 아니다.' },
    { text: '통로·window 이름 가운데 saveGoogleToken 하나는 값 지문의 함수 글자 해시가 달라졌다(본문의 인라인 이름에 L. 접두). 종류·이름·인자 수는 같고 그 밖에 달라진 이름은 0 이다. 생성기가 머리에 새로 단 통로 getter 는 gcalCurrentUid · purgeLegacySharedGcalKeys 둘이다(둘 다 이미 통로에 있던 이름 — 등록 기관이 내주던 것).' },
  ],
  claims: [
    { id: 'C1', req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior',
      statement: '게스트로 진입해 아바타 인사 팝업을 닫고 홈→목표→기록→일정→소통→설정→홈 순서로 탭을 누르면 누른 탭이 활성이 되고 예외가 없다. 바뀐 파일은 생성기 설정(proof.json)을 기준 커밋에서 다시 돌린 결과와 바이트 단위로 같다.',
      touches: ['index.html', CELL], scenario: 'scenarios/s1-guest-boot-six-tabs.json', proof: 'proof.json' },
    { id: 'C2', req: 'R3', kind: 'unverified', domain: 'server-api',
      statement: '실계정으로 로그인해 구글 캘린더를 연동하면(구글 동의 창에서 계정 선택) 받은 접근 토큰이 그 계정의 키에 저장되고, 앱을 다시 열었을 때 연동 상태가 복원된다 — 이전 전과 같다.',
      touches: [CELL],
      unverified: { reason: 'needs-live-server',
        who: '실서버에 실계정으로 로그인하고 구글 계정 동의까지 할 수 있는 사람 — 법정은 외부 통신을 막아 로그인도 구글 동의 창도 열 수 없다',
        how: ['실계정으로 로그인한다', '설정 → 연동(또는 일정 탭의 구글 캘린더 연결)에서 구글 캘린더 연결을 누르고 구글 동의 창에서 계정을 고른다', '연결됨 표시가 뜨는지 보고, 브라우저 저장소에 ourgoal_gcal_token_v1_<내 계정 id> 키가 생겼는지(값의 email 이 고른 구글 계정인지) 본다', '앱을 새로고침해 연결 상태가 남아 있는지 본다', '기준 커밋과 작업 커밋에서 같은 순서로 해 보고 결과를 맞댄다'] } },
  ],
};
const st = (id, req, statement, file, p, eq) => out.claims.push({ id, req, kind: 'static', domain: 'config', statement, touches: [R + file], check: { type: 'jsonPath', file: R + file, path: p, equals: eq } });
st('C3', 'R2', '세포의 arguments 는 옮긴 함수 선언 자신의 것뿐이다 — 화살표 함수 안 arguments 0 · 그 함수 층의 this 0(생성기·검사기와 따로 센 값).', 'arguments-check.json', 'withinClause', true);
st('C4', 'R2', '그 함수의 arguments · this · 안쪽 함수 수가 기준 index.html 의 같은 함수에서 센 값과 같고, arguments 를 쓰는 줄의 글자가 같다.', 'arguments-check.json', 'sameAsBase', true);
st('C5', 'R2', '따로 센 arguments 수가 생성기 메타·검사기 보고의 ownArguments 수와 같다.', 'arguments-check.json', 'countsAgree', true);
st('C6', 'R2', '검사기 보고의 this/arguments 위반 목록이 비어 있다.', 'verify-inline-hard.json', 'thisArgs', []);
st('C7', 'R2', '가짜 토큰으로 인자 수를 바꿔(없음 · 둘 · 하나 · 셋) 통로와 window 양쪽으로 부른 다섯 경우의 저장 결과가 기준 트리와 작업 트리에서 같다.', 'save-token-probe.json', 'compare.allCasesSame', true);
st('C8', 'R2', '작업 트리에서 둘째 인자가 저장된 값의 email 이 된다(arguments[1] 이 그 함수 자신의 인자를 읽는다).', 'save-token-probe.json', 'expected.secondArgBecomesEmail', true);
st('C9', 'R2', '직접 호출 실측 전체가 기대대로다(경우별 동일 · 기대값 여덟 · 되돌림 · 예외 수).', 'save-token-probe.json', 'ok', true);
st('C10', 'R4', '검사기(verify-inline-hard.js) 결과가 ok 다 — 토큰 동일(접두 제외) · 줄 동일 · 남은 글자 동일 · 누수 0 · 미노출 0 · setter 빠짐 0 · 이중 처리기 0 · 800줄 이하.', 'verify-inline-hard.json', 'ok', true);
st('C11', 'R4', '옮긴 구간을 기준과 줄 단위로 맞댔을 때 L. 접두 말고 다른 줄이 0줄이다.', 'prefix-only-check.json', 'totals.otherDiffLines', 0);
st('C12', 'R4', '모듈 로드 탐침 결과에서 기준 대비 새 회귀 목록이 비어 있다.', 'module-load.json', 'regressions', []);
st('C13', 'R4', '통로 이름 가운데 이번에 본문을 옮긴 함수 말고 값 지문이 달라진 이름이 없다.', 'name-fingerprints.json', 'scope.unexpectedDiff', []);
st('C14', 'R4', '통로에서 사라진 이름이 없다.', 'name-fingerprints.json', 'scopeLost', []);
st('C15', 'R4', 'window 이름 가운데 이번에 본문을 옮긴 함수 말고 값 지문이 달라진 이름이 없다.', 'name-fingerprints.json', 'window.unexpectedDiff', []);
st('C16', 'R4', '세포가 읽는 통로 이름이 모두 있고, 상태 기관 이름과 겹치는 새 getter 가 없다.', 'accessor-probe.json', 'ok', true);
st('C17', 'R4', 'npm test 의 검사 줄(✓) 수가 기준 트리와 작업 트리에서 같다.', 'npm-test-compare.json', 'same.checkLines', true);
st('C18', 'R4', '시험 파일을 하나씩 돌렸을 때 종료 코드나 ok 줄 수가 기준과 다른 파일이 0개다(tests/gcal-login-reconnect-fix.test.js 포함).', 'tests-all-compare.json', 'differingCount', 0);
st('C19', 'R4', '이 작업이 바꾼 파일 가운데 tests/ 아래 파일이 없다.', 'measurement.json', 'changedFiles.tests', []);
st('C20', 'R4', '이 작업이 바꾼 파일 가운데 금고 파일이 없다.', 'measurement.json', 'changedFiles.vault', []);
st('C21', 'R4', '이 작업이 바꾼 파일 가운데 생성기·검사기(docs/design/harness/) 파일이 없다.', 'measurement.json', 'changedFiles.generator', []);
st('C22', 'R5', '이 작업의 측정 기록에서 인라인 스크립트 줄 수 변화가 ' + delta + ' 이다.', 'measurement.json', 'summary.inlineScriptLines.delta', delta);
st('C23', 'R5', '기준선 마지막 기록의 인라인 스크립트 줄 수가 측정값과 같다.', 'measurement.json', 'baseline.recordedEqualsMeasured', true);
fs.writeFileSync(path.join(WORK, R, 'claims.json'), JSON.stringify(out, null, 2) + '\n', { encoding: 'utf8' });
const errs = require(path.join(WORK, 'court', 'claims.js')).validateClaims(out, { claimsFile: R + 'claims.json' });
console.log('claims', out.claims.length, 'delta', delta, 'errors', JSON.stringify(errs));
