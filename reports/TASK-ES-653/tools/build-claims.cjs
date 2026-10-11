'use strict';
// 주장 파일(reports/TASK-ES-653/claims.json)을 만든다. 값은 측정 파일의 경로로만 건다. 사용: node build-claims.cjs <작업 트리>
const fs = require('fs'), path = require('path');
const WORK = path.resolve(process.argv[2]);
const R = 'reports/TASK-ES-653/';
const delta = JSON.parse(fs.readFileSync(path.join(WORK, R, 'measurement.json'), 'utf8')).summary.inlineScriptLines.delta; // 주장 문장에 적을 변화량(측정 파일에서 읽는다 — 손으로 옮기지 않는다)
const out = {
  task: 'TASK-ES-653',
  requirementsSource: 'docs/specs/REQ-TASK-ES-653-USER-SESSION-REALTIME-MOVE.md',
  requirements: [
    { id: 'R1', text: 'setupUserSessionRealtime(원격 로그아웃 실시간 채널 구독)을 생성기(gen-inline-hard.js)로 세포 js/tabs/settings/user-session-realtime.js 에 글자 그대로 옮긴다. 게스트 화면의 동작을 보존한다(손 편집 0).' },
    { id: 'R2', text: '옮긴 코드가 USER_SESSION_CHANNEL 에 대입하는 지점이 전부 통로를 거치고, 통로에서 그 이름의 쓰기 왕복이 된다.' },
    { id: 'R3', text: '로그인 뒤 동작(세션 채널 구독 · 다른 기기의 원격 로그아웃 방송을 받아 로그아웃)이 이전 전과 같다.' },
    { id: 'R4', text: '증명 하한(헌법 CELL_SPLIT_PROOF): 옮긴 구간의 토큰 동일·누수 0 · 모듈 단독 로드 새 회귀 0 · 통로·window 이름의 값 지문이 옮긴 함수 말고 같음 · npm test 검사 줄 수 동일 · tests·금고·생성기 변경 0.' },
    { id: 'R5', text: '기준선(docs/architecture/module-baseline.json)에 줄어든 인라인 스크립트 줄 수를 기록한다(지시함 DIR-003).' },
  ],
  outOfScopeReports: [
    { text: '통로 쓰기 왕복은 표식 객체를 써 보고 되읽은 작업자 PC 브라우저 실측이다. 진짜 채널 객체를 만드는 sb.channel(…) 호출은 서버 연결이 필요해 돌리지 않았다. 법정이 그 쓰기를 다시 돌린 것은 아니다.' },
    { text: '통로 이름 가운데 setupUserSessionRealtime 하나는 값 지문의 함수 글자 해시가 달라졌다(본문의 인라인 이름에 L. 접두). 종류·이름·인자 수는 같고 그 밖에 달라진 이름은 0 이다. 생성기가 머리에 새로 단 통로 getter 는 USER_SESSION_CHANNEL(이미 있던 이름의 겹친 줄, get+set) · getDeviceId · performLogout 셋이다.' },
  ],
  claims: [
    { id: 'C1', req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior',
      statement: '게스트로 진입해 아바타 인사 팝업을 닫고 홈→목표→기록→일정→소통→설정→홈 순서로 탭을 누르면 누른 탭이 활성이 되고 예외가 없다. 바뀐 파일은 생성기 설정(proof.json)을 기준 커밋에서 다시 돌린 결과와 바이트 단위로 같다.',
      touches: ['index.html', 'js/tabs/settings/user-session-realtime.js'], scenario: 'scenarios/s1-guest-boot-six-tabs.json', proof: 'proof.json' },
    { id: 'C2', req: 'R3', kind: 'unverified', domain: 'multi-user',
      statement: '로그인한 뒤 세션 채널이 구독되고, 다른 기기에서 모든 기기 원격 로그아웃을 실행하면 이 기기가 로그아웃된다 — 이전 전과 같다.',
      touches: ['js/tabs/settings/user-session-realtime.js'],
      unverified: { reason: 'needs-live-server',
        who: '실서버에 실계정으로 두 기기에서 로그인할 수 있는 사람 — 법정은 외부 통신을 막아 로그인도 실시간 방송도 할 수 없다(운영 실계정 하네스 docs/design/harness/real-account-check.js 또는 진짜 기기 두 대)',
        how: ['같은 계정으로 기기 A · 기기 B 에 로그인한다', '기기 A 의 설정 → 계정 보안 → 다른 기기 로그아웃을 실행한다', '기기 B 가 「다른 기기에서 모든 기기 원격 로그아웃이 실행되어 로그아웃되었습니다.」 안내와 함께 로그아웃되는지 본다', '기준 커밋과 작업 커밋에서 같은 순서로 해 보고 결과를 맞댄다'] } },
  ],
};
const st = (id, req, statement, file, p, eq) => out.claims.push({ id, req, kind: 'static', domain: 'config', statement, touches: [R + file], check: { type: 'jsonPath', file: R + file, path: p, equals: eq } });
st('C3', 'R2', '세포 안의 USER_SESSION_CHANNEL 대입이 전부 통로(L.)를 거친다(맨이름 대입 0, 통로 대입 수 = 기준 함수의 대입 수).', 'assign-count.json', 'allAssignmentsViaScope', true);
st('C4', 'R2', '이전 뒤 index.html 에 그 이름이 남은 줄은 선언 줄과 통로 노출 줄뿐이다.', 'assign-count.json', 'onlyDeclarationAndExposeLeft', true);
st('C5', 'R2', '브라우저에서 통로의 USER_SESSION_CHANNEL 에 써 보고 되읽은 값이 같았고, 상태 기관 이름과 겹치는 새 getter 가 없으며, 세포가 읽는 통로 이름이 모두 있다.', 'accessor-probe.json', 'ok', true);
st('C6', 'R4', '검사기(verify-inline-hard.js) 결과가 ok 다 — 토큰 동일(접두 제외) · 줄 동일 · 남은 글자 동일 · 누수 0 · 미노출 0 · setter 빠짐 0 · 마지막 노출 setter · this/arguments 0 · 이중 처리기 0 · 800줄 이하.', 'verify-inline-hard.json', 'ok', true);
st('C7', 'R4', '옮긴 구간을 기준과 줄 단위로 맞댔을 때 L. 접두 말고 다른 줄이 0줄이다.', 'prefix-only-check.json', 'totals.otherDiffLines', 0);
st('C8', 'R4', '모듈 로드 탐침 결과에서 기준 대비 새 회귀 목록이 비어 있다.', 'module-load.json', 'regressions', []);
st('C9', 'R4', '통로 이름 가운데 이번에 본문을 옮긴 함수 말고 값 지문이 달라진 이름이 없다.', 'name-fingerprints.json', 'scope.unexpectedDiff', []);
st('C10', 'R4', '통로에서 사라진 이름이 없다.', 'name-fingerprints.json', 'scopeLost', []);
st('C11', 'R4', 'window 이름의 값 지문 차이가 0 이다.', 'name-fingerprints.json', 'window.diff', 0);
st('C12', 'R4', 'npm test 의 검사 줄(✓) 수가 기준 트리와 작업 트리에서 같다.', 'npm-test-compare.json', 'same.checkLines', true);
st('C13', 'R4', '시험 파일을 하나씩 돌렸을 때 종료 코드나 ok 줄 수가 기준과 다른 파일이 0개다.', 'tests-all-compare.json', 'differingCount', 0);
st('C14', 'R4', '이 작업이 바꾼 파일 가운데 tests/ 아래 파일이 없다.', 'measurement.json', 'changedFiles.tests', []);
st('C15', 'R5', '이 작업의 측정 기록에서 인라인 스크립트 줄 수 변화가 ' + delta + ' 이다.', 'measurement.json', 'summary.inlineScriptLines.delta', delta);
st('C16', 'R5', '기준선 마지막 기록의 인라인 스크립트 줄 수가 측정값과 같다.', 'measurement.json', 'baseline.recordedEqualsMeasured', true);
fs.writeFileSync(path.join(WORK, R, 'claims.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
const errs = require(path.join(WORK, 'court', 'claims.js')).validateClaims(out, { claimsFile: R + 'claims.json' });
console.log('claims', out.claims.length, 'delta', delta, 'errors', JSON.stringify(errs));
