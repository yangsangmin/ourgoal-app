'use strict';
// 주장 파일(reports/TASK-ES-661/claims.json)을 만든다. 값은 측정 파일의 경로로만 건다. 사용: node build-claims.cjs <작업 트리>
const fs = require('fs'), path = require('path');
const WORK = path.resolve(process.argv[2]);
const R = 'reports/TASK-ES-661/';
const u = JSON.parse(fs.readFileSync(path.join(WORK, R, 'sweep-unit.json'), 'utf8')); // 주장 문장에 적을 수(측정 파일에서 읽는다)
const GEN = 'docs/design/harness/module-split/gen-inline-hard.js';
const out = {
  task: 'TASK-ES-661',
  requirementsSource: 'docs/specs/REQ-TASK-ES-661-GEN-SWEEP.md',
  requirements: [
    { id: 'R1', text: '생성기(gen-inline-hard.js)에 mode:"sweep" 을 더한다 — 문이 없는 구획의 주석 줄과 빈 줄만 지운다. 대상은 적용 시점의 index.html 을 재서 정하고, 제목으로 가리킨 구획에 문이 있으면 멈춘다.' },
    { id: 'R2', text: '정지·제외: 실행 문이 있는 구획 · 도구가 찾는 표지(구획 주석 · 자리 표지 · 1차 이음매 주석) · keep 으로 지키는 주석 · 닫힌 목록 밖 줄. 실행 글자는 한 글자도 바뀌지 않는다(주석을 뺀 토큰열이 이전과 같다).' },
    { id: 'R3', text: '설정 꼴을 unwire · unstate · region 과 맞춘다(단계 배열 포함). 모르는 칸은 멈춘다.' },
    { id: 'R4', text: '기존 경로(옮기기 · unwire · unstate · region)는 바이트 무변화이고, 제품 코드(js/** · index.html) · tests/ · 금고 변경 0 · 실제 쓸기 0 이다.' },
    { id: 'R5', text: '지금 main 사본의 모의 적용에서 주석을 뺀 토큰열이 같고, 앱이 뜨고(게스트 여섯 탭), 지문 차이가 0 이고, 모듈 로드·npm test·시험 하나씩의 결과가 기준과 같고, 지도 도구가 돈다. 예상 줄 수와 남는 주석의 종류별 표를 남긴다.' },
  ],
  outOfScopeReports: [
    { text: '앞선 단위 시험 재실행에서 두 건이 실패한다: 657 묶음의 D1(생성기 diff 의 새 줄이 #657 의 것뿐인지) · 그 안 643 묶음의 D0(#643 이전 생성기와의 차이가 한 자리뿐인지). 둘 다 출력이 아니라 생성기 파일의 diff 모양을 옛 기준과 맞대는 검사라 생성기에 줄을 더하면 구조적으로 거짓이 된다. 그 시험 파일은 고치지 않았다.' },
    { text: '구획 주석은 지우지 않는다(닫힌 목록 X8 의 정지 조건 · 지도 도구가 묶음을 이것으로 가른다). 그래서 지금 main 에서 문이 없는 구획 40개의 구획 주석 54줄이 쓸고 난 뒤에도 남는다.' },
    { text: '시험·가드가 글자로 붙잡는 주석은 생성기가 알지 못한다. sweep 을 쓰는 PR 이 모의 적용 사본에서 시험 전부를 돌려 찾아 keep 에 적어야 한다. 지금 main 에서는 지워지는 주석 88개 가운데 붙잡힌 것이 없었다(구역 이전 뒤에는 달라질 수 있다).' },
    { text: '모의 적용 수치(지워지는 줄 153 등)는 측정 시점 main(bb0b2ea6)의 참고값이다. 구역 이전이 병합되면 문이 없는 구획이 늘어 값이 달라진다.' },
  ],
  claims: [],
};
const st = (id, req, statement, file, p, eq) => out.claims.push({ id, req, kind: 'static', domain: 'config', statement, touches: [R + file], check: { type: 'jsonPath', file: R + file, path: p, equals: eq } });
st('C1', 'R1', '지우는 꼴 꾸러미 여섯("all" · 제목 배열 · 연달아 빈 구획과 여러 줄 구획 주석 · 같은 제목 둘 · CRLF · label)이 모두 기대한 글자를 낸다.', 'unit-summary.json', 'allDeletesOk', true);
st('C2', 'R1', '실제 index.html 사본 항목 넷(모의 적용과 따로 센 값의 일치 · 지도 도구 · 재실행 정지 · keep)이 모두 기대대로다.', 'unit-summary.json', 'allRealIndexOk', true);
st('C3', 'R2', '남기는 꼴 꾸러미 셋(keep · 줄을 나눠 쓰는 주석 · 구획 주석과 같은 줄)이 모두 기대대로다.', 'unit-summary.json', 'allKeepsOk', true);
st('C4', 'R2', '제외 꾸러미 둘(자리 표지 구획 · 1차 이음매 구획)이 통째로 남는다.', 'unit-summary.json', 'allExcludedOk', true);
st('C5', 'R2', '건드리지 않는 것 꾸러미 셋(머리 · 문이 있는 구획 · 문 안과 문 옆 주석)이 그대로다.', 'unit-summary.json', 'allUntouchedOk', true);
st('C6', 'R2', '정지 꾸러미 스물하나가 모두 멈추고 index.html 을 바이트 그대로 둔다.', 'unit-summary.json', 'allStopsOk', true);
st('C7', 'R2', '생성기와 따로 다시 파싱한 감사에서, 성공한 꾸러미와 실제 index.html 전부의 주석을 뺀 토큰열이 이전과 같고 사라진 줄은 실행 글자가 없는 줄뿐이다.', 'unit-summary.json', 'audit.ok', true);
st('C8', 'R3', '여러 실행 꾸러미 둘(unwire 단계 + sweep 단계 = 따로 차례로 돌린 결과 · 뒤 단계가 멈추면 쓰지 않음)이 기대대로다.', 'unit-summary.json', 'allMultiStepOk', true);
st('C9', 'R4', '생성기 diff 는 기준 커밋 대비 한 자리에 끼워 넣은 줄뿐이고 검사기는 기준과 같다.', 'unit-summary.json', 'generatorDiff.ok', true);
st('C10', 'R4', '병합된 unwire · unstate · 옮기기 PR 셋의 기준 트리에서 고친 생성기가 index.html·세포 파일을 바이트 그대로 다시 만든다.', 'unit-summary.json', 'allMergedRegeneratedByteSame', true);
st('C11', 'R4', '앞선 단위 시험 재실행에서 실패는 생성기 diff 모양 검사 둘(657 의 D1 · 643 의 D0)뿐이다.', 'unit-summary.json', 'earlierSuites.onlyShapeChecksFailed', true);
st('C12', 'R4', '단위 시험 ' + u.total + '건이 모두 기대대로다.', 'sweep-unit.json', 'ok', true);
st('C13', 'R4', '이 작업이 바꾼 파일 가운데 제품 코드(index.html · js/**)가 없다.', 'measurement.json', 'changed.productFiles', []);
st('C14', 'R4', '이 작업이 바꾼 파일 가운데 tests/ 아래 파일이 없다.', 'measurement.json', 'changed.testsChanged', []);
st('C15', 'R4', '이 작업이 바꾼 파일 가운데 금고 파일이 없다.', 'measurement.json', 'changed.vaultChanged', []);
st('C16', 'R4', 'npm test 의 종료 코드·검사 줄 수·요약 줄이 기준 트리와 작업 트리에서 같다.', 'measurement.json', 'npmTest.allSame', true);
st('C17', 'R5', '모의 적용 사본 측정 전체가 기대대로다(토큰열 동일 · 따로 만든 집계와 일치 · 모듈 로드 회귀 0 · 지문 차이 0 · 시나리오 · 시험 하나씩 차이 0 · npm test 동일 · 지표 변화 = 지운 줄 수 · 가드 · 지도 도구).', 'mock-apply.json', 'ok', true);
st('C18', 'R5', '모의 적용 사본에서 주석을 뺀 토큰열이 기준과 같다.', 'mock-apply.json', 'tokens.same', true);
st('C19', 'R5', '모의 적용 사본에서 시험 파일을 하나씩 돌렸을 때 종료 코드나 ok 줄 수가 기준과 다른 파일이 0개다.', 'mock-apply.json', 'testsAll.differingCount', 0);
st('C20', 'R5', '모의 적용에서 keep 없이 돌렸고 남긴(붙잡힌) 주석이 0개다.', 'mock-apply.json', 'pinnedComments.count', 0);
out.claims.push({ id: 'C21', req: 'R1', kind: 'static', domain: 'config', statement: '생성기에 sweep 모드의 들머리가 있다.', touches: [GEN], check: { type: 'codeContains', file: GEN, text: "if (CFG.mode === 'sweep') { runSweep(); return; }" } });
out.claims.push({ id: 'C22', req: 'R2', kind: 'static', domain: 'config', statement: '생성기가 지운 뒤 토큰열이 이전과 다르면 쓰지 않고 멈춘다.', touches: [GEN], check: { type: 'codeContains', file: GEN, text: "fail('지운 뒤 토큰열이 이전과 다르다(실행 글자 변화) — 쓰지 않는다: 토큰 ' + diffAt);" } });
fs.writeFileSync(path.join(WORK, R, 'claims.json'), JSON.stringify(out, null, 2) + '\n', { encoding: 'utf8' });
const errs = require(path.join(WORK, 'court', 'claims.js')).validateClaims(out, { claimsFile: R + 'claims.json' });
console.log('claims', out.claims.length, 'unit', u.total, 'errors', JSON.stringify(errs));
