'use strict';
// #TASK-ES-619 주장 파일 생성 — 수치는 측정 파일에서 읽어 넣는다(손으로 옮기지 않는다). 작업자 측정, 판정 아님.
// 사용: node reports/TASK-ES-619/build-claims.cjs <작업 트리>
const fs = require('fs'), path = require('path');
const WORK = path.resolve(process.argv[2] || '.');
const R = 'reports/TASK-ES-619/';
const read = f => JSON.parse(fs.readFileSync(path.join(WORK, f), 'utf8'));
const unit = read(R + 'unwire-ext-unit.json'), m = read(R + 'measurement.json');
// 시험 id 별 결과를 한 단계 경로로 읽을 수 있게 펼친다(법정 jsonPath 는 점 경로)
const byId = {}; for (const r of unit.results) byId[r.id] = r.ok;
fs.writeFileSync(path.join(WORK, R + 'unit-by-id.json'), JSON.stringify({ source: R + 'unwire-ext-unit.json', type: '작업자 측정, 판정 아님', total: unit.total, passed: unit.passed, byId }, null, 1) + '\n', 'utf8');

const GEN = 'docs/design/harness/module-split/gen-inline-hard.js', HAR = 'docs/design/harness/module-split/unwire-check-ext-619.js';
const DES = 'docs/architecture/CELL-REGISTRY-DESIGN.md', REQ = 'docs/specs/REQ-TASK-ES-619-GEN-UNWIRE-EXT.md', TIC = 'docs/rules/TICKETS.md';
const jp = (id, req, file, p, equals, statement, more) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [file].concat(more || []), check: { type: 'jsonPath', file, path: p, equals } });
const cc = (id, req, file, text, statement) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [file], check: { type: 'codeContains', file, text } });
const s = m.summary;
const claims = [
  jp('C1', 'R1', R + 'measurement.json', 'summary.sixteenVsOne.same', true, '기준 커밋의 실제 index.html 사본에서 unwire-plan.json 의 실행을 기준 생성기로 차례로 돌린 결과와, 고친 생성기에 배열 한 번으로 돌린 결과가 바이트 단위로 같다.', [GEN, HAR]),
  jp('C2', 'R1', R + 'measurement.json', 'summary.sixteenVsOne.runs', s.sixteenVsOne.runs, '그 대조에 쓴 실행 수(계획 파일의 실행 전부).'),
  jp('C3', 'R1', R + 'measurement.json', 'summary.sixteenVsOne.stepsSame', s.sixteenVsOne.stepsSame, '단계마다 두 생성기(기준 · 고친 것)의 단일 실행 결과 · 메타 · 출력 줄이 같았던 단계 수(실행 수와 같다).'),
  jp('C4', 'R1', R + 'unit-by-id.json', 'byId.M1', true, '작은 꾸러미에서 여러 실행(배열) 한 번 = 단일 객체 설정을 차례로 돌린 결과.', [GEN]),
  jp('C5', 'R1', R + 'unit-by-id.json', 'byId.M2', true, '뒤 실행이 멈추면 index.html 을 쓰지 않고 몇 번째 실행인지 알린다. 빈 배열은 멈춘다.'),
  jp('C6', 'R2', R + 'unit-by-id.json', 'byId.X1a', true, '`_ui` 처럼 `_xxxKit` 꼴이 아닌 손잡이의 가져오기 줄을 지운다.', [GEN]),
  jp('C7', 'R2', R + 'unit-by-id.json', 'byId.X1b', true, '손잡이가 아닌 kitVar(선언 없음 · window 가 아닌 초기값 · 상태 변수 · 선언자 둘 · 이름이 아닌 글자)는 멈춘다.'),
  jp('C8', 'R3', R + 'unit-by-id.json', 'byId.X3a', true, '주석과 한 줄을 나눠 쓰는 window 대입 — sharedLine 이면 대입 글자만 지우고 주석은 남긴다. 플래그가 없으면 예전처럼 멈춘다.', [GEN]),
  jp('C9', 'R3', R + 'unit-by-id.json', 'byId.X3b', true, '한 줄 if 블록의 두 대입 중 하나만 지우면 나머지가 남고, 둘 다 대상이면 줄째 지운다.'),
  jp('C10', 'R3', R + 'unit-by-id.json', 'byId.X3c', true, '다른 문 뒤에 붙은 대입은 대입 글자만 지우고, 같은 줄의 다른 문이 그 이름을 쓰면 잔존 참조로 멈춘다.'),
  jp('C11', 'R3', R + 'unit-by-id.json', 'byId.X3d', true, 'sharedLine 이어도 쉼표 연쇄 · 오른쪽이 이름이 아닌 대입 · 여러 줄 if 블록 안의 나눠 쓴 줄은 멈춘다.'),
  jp('C12', 'R3', R + 'unit-by-id.json', 'byId.R2', true, '실제 index.html 사본에서 X3 · X1 대상 이름을 지웠을 때 지운 줄은 가져오기 · getter · window 대입(과 빈 껍데기)뿐이고 줄 안에서 지운 글자는 window 대입뿐이며 나머지 줄은 순서대로 같다.'),
  jp('C13', 'R4', R + 'unit-by-id.json', 'byId.X2a', true, 'dropKitVar: 손잡이 참조가 0 이면 손잡이 줄을 지운다.', [GEN]),
  jp('C14', 'R4', R + 'unit-by-id.json', 'byId.X2b', true, 'dropKitVar: 손잡이 참조가 남으면 멈춘다. 플래그 없이 names 가 비면 예전처럼 멈춘다.'),
  jp('C15', 'R4', R + 'unit-by-id.json', 'byId.R3', true, '실제 index.html 사본에서 가져오기가 남은 손잡이에 dropKitVar 를 주면 멈추고 쓰지 않는다.'),
  jp('C16', 'R5', R + 'unwire-b1-rerun.json', 'ok', true, 'B1 단위 시험(unwire-check-b1.js) 8건이 고친 생성기에서 그대로 통과한다 — 단일 객체 설정의 출력과 기존 옮기기 경로(A1 시범 재생성 바이트 대조) 무변화.', [GEN]),
  jp('C17', 'R5', R + 'unit-by-id.json', 'byId.S1', true, '단일 객체 설정에서 고친 생성기와 기준 생성기가 같은 index.html · 메타 · 출력 줄을 낸다.'),
  jp('C18', 'R5', R + 'unit-by-id.json', 'byId.C1', true, '모르는 칸(닫힌 목록 밖 기능 · 플래그 오타)은 멈춘다.'),
  jp('C19', 'R5', R + 'measurement.json', 'summary.generator.movePathLinesChanged', 0, '생성기의 바뀐 구간이 unwire 머리 주석 뒤 ~ 옮기기 경로(smoke-test 주석) 앞에만 있다(옮기기 경로에서 바뀐 줄 0).', [GEN]),
  jp('C20', 'R5', R + 'measurement.json', 'summary.protectedChanged.count', 0, '제품 코드(js/** · index.html) · tests/ · 금고 · 지시함 · 생성 지도에서 바뀐 파일이 0 개다.'),
  jp('C21', 'R5', R + 'measurement.json', 'summary.npmTest.same', true, 'npm test 를 기준 트리와 작업 트리에서 전경으로 끝까지 돌려 종료 코드 0 이고 검사 줄 수·요약 줄이 같다.'),
  jp('C22', 'R5', R + 'measurement.json', 'summary.inlineScriptLines.same', true, 'inlineScriptLines 가 기준과 같다(저장소 index.html 의 실제 철거 0).'),
  jp('C23', 'R5', R + 'unit-by-id.json', 'total', unit.total, '확장 단위 시험의 건수.', [HAR]),
  jp('C24', 'R5', R + 'unit-by-id.json', 'passed', unit.total, '확장 단위 시험이 전부 ok 다(통과 수 = 건수).'),
  cc('C25', 'R1', GEN, "const isList = Array.isArray(CFG.unwire);", '생성기가 unwire 설정을 배열로 받는다.'),
  cc('C26', 'R5', GEN, "if (CFG.mode === 'unwire') { runUnwire(); return; }", '새 경로는 mode 가 unwire 일 때만 들어간다(진입 줄은 예전 그대로).'),
  cc('C27', 'R5', GEN, "'sharedLine', 'dropKitVar', 'label'].includes(k)) fail(", '생성기가 받는 실행 칸이 닫혀 있다(그 밖의 칸은 멈춘다).'),
  cc('C28', 'R5', DES, '### 5.4 구현된 unwire 설정 꼴 — 여러 실행 · X1 · X2 · X3 (#TASK-ES-619)', '설계 문서 5.4 에 구현된 설정 꼴이 적혀 있다.'),
  cc('C29', 'R5', REQ, '「결심필요 4번 빼고 모두 권장안대로 진행하고 4번은 자세히 설명해봐 어떤 함수인지 어떤 기능을 하던건지 자세히, 어떻게 진행하는게 좋을지, 권장안이 뭔지」', 'REQ 머리에 상민님 원문이 글자 그대로 있다.'),
  cc('C30', 'R5', TIC, '- #TASK-ES-619 | INFRA | 생성기 unwire 확장', '티켓 대장에 ES-619 한 줄이 있다.')
];
// 자가 검사: 주장의 글자·값이 실제 파일과 맞는가
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
for (const c of claims) {
  const fp = path.join(WORK, c.check.file);
  if (c.check.type === 'jsonPath') { const v = getPath(JSON.parse(fs.readFileSync(fp, 'utf8')), c.check.path); if (JSON.stringify(v) !== JSON.stringify(c.check.equals)) throw new Error(c.id + ' 값 불일치: ' + c.check.path + ' = ' + JSON.stringify(v)); }
  else { const src = fs.readFileSync(fp, 'utf8'); if (!src.includes(c.check.text)) throw new Error(c.id + ' 글자 없음: ' + c.check.text); if (/\.js$/.test(c.check.file) && src.split('\n').filter(l => l.includes(c.check.text)).every(l => /^\s*\/\//.test(l))) throw new Error(c.id + ' 글자가 주석에만 있다'); }
  if (!c.touches.includes(c.check.file)) throw new Error(c.id + ' check.file 이 touches 에 없다');
}
const out = {
  task: 'TASK-ES-619', requirementsSource: REQ,
  requirements: [
    { id: 'R1', text: '여러 실행: 한 설정에서 unwire 실행을 배열로 받아 차례로 적용한다(앞 실행이 지운 결과 위에 다음 실행). 단일 객체 꼴은 그대로 동작하고, 안전 검사는 실행마다 그대로다. 새 줄 종류가 아니다.' },
    { id: 'R2', text: 'X1: `_xxxKit` 꼴이 아닌 손잡이(`_ui`·`_xp`)의 가져오기 줄을 받되, IIFE 최상위에서 `var <kitVar> = window.…` 로 선언된 손잡이임을 검사한다.' },
    { id: 'R3', text: 'X3: 한 줄을 나눠 쓰는 window 대입을 그 줄 안에서 그 대입 글자만 지운다(선택 플래그 sharedLine). 남는 글자를 재파싱으로 대조하고 애매하면 멈춘다.' },
    { id: 'R4', text: 'X2: 손잡이의 맨이름 참조가 0 일 때만 손잡이 줄을 지우는 선택 플래그(dropKitVar). 참조가 남으면 멈춘다.' },
    { id: 'R5', text: '기존 경로 무변화와 닫힌 목록: 옮기기 경로는 글자 하나 지나지 않고, 단일 객체 설정의 출력은 바이트 동일하며, 닫힌 목록 밖의 줄은 어떤 플래그로도 지워지지 않는다. 제품 코드·tests·금고 변경 0, 저장소 index.html 실제 철거 0.' }
  ],
  outOfScopeReports: [
    { text: '실제 철거(이 확장으로 지울 이름을 고르는 일 · 시험이 그 글자를 붙잡는 이름 제외 · 화면 시나리오)는 이 PR 에 없다. 단위 시험 R2 는 생성기가 그 줄을 지울 수 있음을 보인 것이며, 그 이름을 실제로 지워도 되는지는 철거 PR 이 잰다.', cannotBecause: 'out-of-scope-feature' },
    { text: 'unstate · region · sweep · finalize 모드(X4~X9)는 이 PR 에 없다.', cannotBecause: 'out-of-scope-feature' }
  ],
  claims
};
fs.writeFileSync(path.join(WORK, R + 'claims.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log('claims', claims.length, '· unit', unit.passed + '/' + unit.total);
