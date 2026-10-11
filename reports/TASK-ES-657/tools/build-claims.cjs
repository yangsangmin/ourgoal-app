'use strict';
// 주장 파일(reports/TASK-ES-657/claims.json)을 만든다. 값은 측정 파일의 경로로만 건다. 사용: node build-claims.cjs <작업 트리>
const fs = require('fs'), path = require('path');
const WORK = path.resolve(process.argv[2]);
const R = 'reports/TASK-ES-657/';
const u = JSON.parse(fs.readFileSync(path.join(WORK, R, 'fn-arguments-unit.json'), 'utf8')); // 주장 문장에 적을 수(측정 파일에서 읽는다)
const out = {
  task: 'TASK-ES-657',
  requirementsSource: 'docs/specs/REQ-TASK-ES-657-GEN-FN-ARGUMENTS.md',
  requirements: [
    { id: 'R1', text: '생성기(gen-inline-hard.js) 일반 모드의 「유형 K」 정지를 헌법 v2026.10.11-ARGUMENTS CELL_SPLIT 5호의 범위만큼만 푼다: 함수 선언을 선언째로 옮길 때 그 함수 자신의 arguments 만 허용하고, 함수 선언 최상위 this · 화살표 함수 안 arguments/this 는 예전처럼 멈추며, 감싸는 로드 중 문은 예전처럼 감싸지 않는다.' },
    { id: 'R2', text: '검사기(verify-inline-hard.js)의 this/arguments 검사를 같은 범위만큼만 푼다: 선언째로 옮긴 함수 선언 자신의 arguments 는 허용해 수를 싣고, 그 함수 층의 this · 화살표 함수 안 arguments 는 예전처럼 FAIL 이다.' },
    { id: 'R3', text: '기존 경로의 출력은 달라지지 않는다: 병합된 옮기기 PR 넷의 재생성이 바이트 동일하고 검사기 출력이 같으며, 구역·상태·철거 단위 시험 묶음은 생성기 diff 모양 검사(D0) 말고 모두 통과한다.' },
    { id: 'R4', text: '현재 main 에서 saveGoogleToken 모의 이전이 생성·검사 ok 이고, 그 사본의 시험이 기준과 같다(실제 이전은 다음 PR).' },
    { id: 'R5', text: '제품 코드(index.html · js/**) · tests/ · 금고 변경 0.' },
  ],
  outOfScopeReports: [
    { text: '구역 감싸기 단위 시험 묶음(region-check-643.js) 67건 가운데 D0 한 건은 고친 생성기에서 실패한다. D0 는 생성기 파일과 #643 이전 생성기의 차이가 한 자리에 끼워 넣은 줄뿐인지 보는 모양 비교여서, 일반 모드의 다른 자리를 고치면 구조적으로 거짓이 된다(출력 비교가 아니다). 그 시험 파일은 고치지 않았다.' },
    { text: '화살표 함수 안의 arguments 는 선언째로 옮기면 뜻이 같다고 볼 여지가 있으나, 조문이 「그대로 0 이어야 한다」의 예로 든 꼴이라 허용하지 않고 멈추게 했다(좁게 읽음).' },
    { text: 'saveGoogleToken 모의 이전 사본의 시험 개별 실행 첫 비교에서 tests/offline-sync-queue-retain.test.js 가 모의 쪽에서 한 번 실패했다. 모의 이전이 바꾸지 않는 한 파일만 읽는 시험이고, 기준·모의 세 번씩 재실행과 모의 전체 재실행에서는 통과했다(흔들림 — reports/TASK-ES-657/mock-tests.json 에 첫 관측을 그대로 실었다).' },
  ],
  claims: [],
};
const st = (id, req, statement, file, p, eq) => out.claims.push({ id, req, kind: 'static', domain: 'config', statement, touches: [R + file], check: { type: 'jsonPath', file: R + file, path: p, equals: eq } });
st('C1', 'R1', '허용 꾸러미(함수 선언 자신의 arguments · 안쪽 보통 함수의 arguments)가 모두 기대대로다.', 'unit-summary.json', 'allAllowedOk', true);
st('C2', 'R1', '정지·그대로 꾸러미 여섯(함수 선언 최상위 this · 화살표 안 arguments · 자기 arguments 와 화살표 안 arguments 함께 · 화살표 안 this · 감싸려는 로드 중 문의 arguments · var 함수식)이 모두 기준 생성기와 같은 결과다.', 'unit-summary.json', 'allStopsOk', true);
st('C3', 'R1', '생성기 diff 에서 기준의 줄이 사라진 곳은 함수 선언 검사 호출 한 줄뿐이고 unwire · unstate · region 구간의 글자는 기준과 같다.', 'unit-summary.json', 'diff.generatorOk', true);
st('C4', 'R2', '검사기가 옮긴 함수 선언 안의 화살표 함수 안 arguments · this 를 FAIL 로 잡는다(꾸러미 둘).', 'unit-summary.json', 'allVerifierStopsOk', true);
st('C5', 'R2', '검사기 diff 에서 기준의 줄이 사라진 곳은 ⑤ 검사 두 줄과 OK 문구 한 줄뿐이다.', 'unit-summary.json', 'diff.verifierOk', true);
st('C6', 'R3', '병합된 옮기기 PR 넷(#911 · #913 · #917 · #923)의 기준 트리에서 고친 생성기가 index.html·세포 파일을 바이트 그대로 다시 만든다.', 'unit-summary.json', 'existingPaths.allRegeneratedByteSame', true);
st('C7', 'R3', '그 넷의 결과에 고친 검사기와 기준 검사기가 내는 출력이 글자 그대로 같다.', 'unit-summary.json', 'existingPaths.allVerifierOutputSame', true);
st('C8', 'R3', '구역 감싸기 단위 시험 묶음을 다시 돌렸을 때 실패는 생성기 diff 모양 검사 D0 하나뿐이다.', 'unit-summary.json', 'region643.onlyD0Failed', true);
st('C9', 'R3', '단위 시험 ' + u.total + '건이 모두 기대대로다.', 'fn-arguments-unit.json', 'ok', true);
st('C10', 'R4', 'saveGoogleToken 모의 이전: 검사기 ok · window 노출 줄은 index.html 에 그대로 · 모듈 가드 통과 · gcal-login-reconnect-fix 시험 종료 코드 같음 · 시험 파일 개별 실행 차이 0(재실행 기준).', 'mock-tests.json', 'ok', true);
st('C11', 'R4', '실제 index.html 에서 기준 생성기는 멈추고 고친 생성기는 옮기며, 옮긴 줄에서 L. 접두 말고 다른 줄이 없다.', 'unit-summary.json', 'realIndexMock.ok', true);
st('C12', 'R5', '이 작업이 바꾼 파일 가운데 제품 코드(index.html · js/**)가 없다.', 'measurement.json', 'changed.productFiles', []);
st('C13', 'R5', '이 작업이 바꾼 파일 가운데 tests/ 아래 파일이 없다.', 'measurement.json', 'changed.testsChanged', []);
st('C14', 'R5', '이 작업이 바꾼 파일 가운데 금고 파일이 없다.', 'measurement.json', 'changed.vaultChanged', []);
st('C15', 'R5', 'npm test 의 종료 코드·검사 줄 수·요약 줄이 기준 트리와 작업 트리에서 같다.', 'measurement.json', 'npmTest.allSame', true);
out.claims.push({ id: 'C16', req: 'R1', kind: 'static', domain: 'config', statement: '생성기에 함수 선언 전용 검사 fnDeclThisArgs 가 있다.', touches: ['docs/design/harness/module-split/gen-inline-hard.js'], check: { type: 'codeContains', file: 'docs/design/harness/module-split/gen-inline-hard.js', text: 'const fnDeclThisArgs = st => {' } });
out.claims.push({ id: 'C17', req: 'R2', kind: 'static', domain: 'config', statement: '검사기가 허용한 자기 arguments 를 ownArguments 에 싣는다.', touches: ['docs/design/harness/module-split/verify-inline-hard.js'], check: { type: 'codeContains', file: 'docs/design/harness/module-split/verify-inline-hard.js', text: 'if (own) ownArguments.push({ name: fp.node.id.name, file: f, count: own });' } });
fs.writeFileSync(path.join(WORK, R, 'claims.json'), JSON.stringify(out, null, 2) + '\n', { encoding: 'utf8' });
const errs = require(path.join(WORK, 'court', 'claims.js')).validateClaims(out, { claimsFile: R + 'claims.json' });
console.log('claims', out.claims.length, 'unit', u.total, 'errors', JSON.stringify(errs));
