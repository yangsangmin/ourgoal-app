'use strict';
// #TASK-ES-643 주장 파일 생성 — 수치는 측정 파일에서 읽어 넣는다(손으로 옮기지 않는다). 작업자 측정, 판정 아님.
// 사용: node reports/TASK-ES-643/build-claims.cjs <작업 트리>
const fs = require('fs'), path = require('path');
const WORK = path.resolve(process.argv[2] || '.');
const R = 'reports/TASK-ES-643/';
const read = f => JSON.parse(fs.readFileSync(path.join(WORK, f), 'utf8'));
const m = read(R + 'measurement.json'), s = m.summary, plan = read(R + 'region-plan.json'), unit = read(R + 'region-unit.json');
const M = R + 'measurement.json', P = R + 'region-plan.json', K = R + 'region-mock.json';
const GEN = 'docs/design/harness/module-split/gen-inline-hard.js', HAR = 'docs/design/harness/module-split/region-check-643.js';
const DES = 'docs/architecture/CELL-REGISTRY-DESIGN.md', REQ = 'docs/specs/REQ-TASK-ES-643-GEN-REGION.md', TIC = 'docs/rules/TICKETS.md';
const claims = []; let n = 1;
const jp = (req, file, p, equals, statement, more) => claims.push({ id: 'C' + (n++), req, kind: 'static', domain: 'config', statement, touches: [file].concat(more || []), check: { type: 'jsonPath', file, path: p, equals } });
const cc = (req, file, text, statement) => claims.push({ id: 'C' + (n++), req, kind: 'static', domain: 'config', statement, touches: [file], check: { type: 'codeContains', file, text } });
const u = id => 'summary.unit.byId.' + id, title = id => (unit.results.find(r => r.id === id) || {}).title || '';
// R1 — 줄 종류
jp('R1', M, u('M1'), true, title('M1'), [GEN, HAR]);
for (const id of ['M1a', 'M1b', 'M1c', 'M1d', 'M1e']) jp('R1', M, u(id), true, id + ': ' + title(id));
jp('R1', M, u('V1'), true, title('V1'), [HAR]);
cc('R1', GEN, "if (CFG.mode === 'region') { runRegion(); return; }", '새 경로는 mode 가 region 일 때만 들어간다.');
// R2 — 경계
for (const id of ['M2', 'M3', 'M7']) jp('R2', M, u(id), true, title(id));
cc('R2', GEN, "if (!['name', 'group', 'groupTo', 'from', 'to', 'headerPick'].includes(k)) fail(", '구역 설정의 칸이 닫혀 있다 — 줄 번호를 받는 칸이 없다(그 밖의 칸은 멈춘다).');
// R3 — 정지 조건
Object.keys(s.unit.byId).filter(k => /^Z\d+$/.test(k)).sort().forEach((z, i) => jp('R3', M, u(z), true, z + ' ' + title(z) + ' — 멈추고 index.html 을 쓰지 않고 세포 파일을 만들지 않는다.', i === 0 ? [GEN] : []));
jp('R3', M, 'summary.unit.stops', s.unit.stops, '정지 조건 시험의 건수.');
jp('R3', M, 'summary.unit.stopsPassed', s.unit.stops, '정지 조건 시험이 전부 ok 다(통과 수 = 건수).');
// R4 — 세포 파일 꼴
for (const id of ['M4', 'M6', 'M8', 'M9']) jp('R4', M, u(id), true, title(id));
cc('R4', GEN, "'  var K = global.' + c.kit + ' = global.' + c.kit + ' || {};',", '구역 세포 파일은 옮기기 경로와 같은 글자로 이미 있는 키트에 단다.');
// R5 — 기존 경로 무변화 · 범위
jp('R5', M, 'summary.generator.insertOnly', true, '생성기의 기준 줄은 한 줄도 바뀌지 않았다(앞 공통 줄 수 + 뒤 공통 줄 수 = 기준 줄 수 — 끼워 넣기뿐).', [GEN]);
jp('R5', M, 'summary.generator.baseLinesChanged', 0, '생성기에서 바뀌거나 지워진 기준 줄이 0 이다.');
jp('R5', M, 'summary.generator.insertedAfterUnstate', true, '끼워 넣은 자리는 unstate 블록(unstateOnce) 뒤다.');
jp('R5', M, 'summary.generator.insertedBeforeMovePath', true, '끼워 넣은 자리는 옮기기 경로(smoke-test 주석) 바로 앞이다.');
jp('R5', M, 'summary.generator.callsIntoMovePath', false, '끼워 넣은 줄은 옮기기 경로의 이름(groupRange · wrapSafe · finalPlan · outPieces · smokeFn)을 쓰지 않는다 — 새 경로다.');
jp('R5', M, u('B'), true, title('B'), [GEN]);
jp('R5', M, u('D0'), true, title('D0'));
jp('R5', M, u('G1'), true, title('G1'));
jp('R5', M, u('U1'), true, title('U1'));
jp('R5', M, 'summary.protectedChanged.count', 0, '제품 코드(js/** · index.html) · tests/ · scripts/ · 금고 · 지시함 · 생성 지도·신고서에서 바뀐 파일이 0 개다.');
jp('R5', M, 'summary.npmTest.same', true, 'npm test 를 기준 트리와 작업 트리에서 전경으로 끝까지 돌려 종료 코드 0 이고 검사 줄 수·요약 줄이 같다.');
jp('R5', M, 'summary.inlineScriptLines.same', true, 'inlineScriptLines 가 기준과 같다(저장소 index.html 의 실제 구역 이전 0).');
jp('R5', M, 'summary.integrityGate.exitCode', 0, '무결성 게이트 종료 코드가 0 이다.');
jp('R5', M, 'summary.unit.total', s.unit.total, '단위 시험의 건수.', [HAR]);
jp('R5', M, 'summary.unit.passed', s.unit.total, '단위 시험이 전부 ok 다(통과 수 = 건수).');
// R6 — 설계 문서
cc('R6', DES, '### 5.6 구현된 region 설정 꼴 — X7 (#TASK-ES-643)', '설계 문서 5.6 에 구현된 설정 꼴이 적혀 있다.');
cc('R6', DES, '**옮기기 경로의 감싸기와의 관계 — 새 경로다(옮기기 경로의 코드를 부르지 않는다)**', '설계 5.6 에 옮기기 경로의 감싸기와 무엇이 다르고 재사용하는지가 적혀 있다.');
cc('R6', DES, '- **등록 기관과의 관계**: 구역 함수는 등록 블록(`OurgoalCellRegistry.provide`)을 만들지 않는다.', '설계 5.6 에 등록 기관과의 관계가 적혀 있다.');
cc('R6', DES, '- **구현 기록(#TASK-ES-643 — 설정 꼴과 세부 규칙은 5.6)**', '설계 3.4 에 구현 기록이 있다.');
// R7 — 실제 사본 계획·모의 적용
for (const id of ['P1', 'P2', 'P3']) jp('R7', M, u(id), true, title(id), id === 'P1' ? [GEN] : []);
jp('R7', P, 'totals.regions', plan.totals.regions, '구역 계획의 구역 수(계획 기준 커밋 ' + plan.basis.commit.slice(0, 8) + ' 에 고정된 입력 — main 을 합쳐도 이 파일의 값은 그대로다).', [R + 'region-plan.cjs']);
jp('R7', P, 'totals.statementsInRegions', plan.totals.statementsInRegions, '구역 계획에 든 최상위 문 수.');
jp('R7', P, 'generator.ok', true, '구역 계획의 설정을 저장소 밖 사본에 생성기로 돌리면 성공한다.');
jp('R7', M, 'summary.plan.holdInRegions', 0, '돈 근처(OurgoalTemplateCredit)·결심 대기(OURGOAL_CONFIG) 줄이 든 구역이 0 개다.');
jp('R7', M, 'summary.unit.realCopy.holdSame', true, '모의 적용 뒤에도 돈 근처·결심 대기 줄은 index.html 에 글자 그대로 있다.');
jp('R7', M, 'summary.mock.scenariosAllPassedBoth', true, '모의 사본에서 게스트 화면 시나리오가 기준·모의 양쪽 통과한다(앱이 실제로 뜬다).', [K]);
jp('R7', M, 'summary.mock.scopeLost', [], '모의 사본: 대조 탐침(기준 이름 목록 고정)에서 통로에서 사라진 이름이 없다.');
jp('R7', M, 'summary.mock.differingScope', [], '모의 사본: 이름별 통로 값 지문 차이가 없다.');
jp('R7', M, 'summary.mock.differingWindow', s.mock.differingWindow, '모의 사본: window 값 지문이 다른 이름 목록(구역에 든 window 함수식 정의문의 이름 — 함수 글자에 L. 접두가 붙어 지문이 달라진다. 없으면 빈 목록).');
jp('R7', M, 'summary.mock.bootExceptions', 0, '모의 사본: 게스트 부팅 예외가 0 건이다.');
jp('R7', M, 'summary.mock.stateDiffering', [], '모의 사본: 상태 탐침(값 요약 · 접근자 종류 · 주인 · 쓰기 왕복)이 기준과 다른 이름이 없다.');
jp('R7', M, 'summary.mock.moduleLoadRegressions', 0, '모의 사본: 모듈 로드 새 회귀가 없다.');
jp('R7', M, 'summary.mock.npmSameCounts', true, '모의 사본: npm test 의 종료 코드 · ✓ 줄 · ok 줄 수가 기준과 같다.');
jp('R7', M, 'summary.mock.testsEachNewFail', [], '모의 사본: 시험을 하나씩 돌렸을 때 모의에서만 깨지는 시험 파일이 없다(붙잡힌 글자 두 건을 계획에서 뺀 뒤).', [R + 'region-pins.json']);
jp('R7', K, 'summary.inlineScriptLines.after', read(K).summary.inlineScriptLines.after, '모의 적용 뒤 inlineScriptLines 예상값(계획 기준 커밋에 고정된 측정).');
cc('R5', REQ, '「결심필요 4번 빼고 모두 권장안대로 진행하고 4번은 자세히 설명해봐 어떤 함수인지 어떤 기능을 하던건지 자세히, 어떻게 진행하는게 좋을지, 권장안이 뭔지」', 'REQ 머리에 상민님 원문이 글자 그대로 있다.');
cc('R5', TIC, '- #TASK-ES-643 | INFRA | 생성기 region 모드', '티켓 대장에 ES-643 한 줄이 있다.');
// 자가 검사
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
for (const c of claims) {
  const fp = path.join(WORK, c.check.file);
  if (c.check.type === 'jsonPath') { const v = getPath(JSON.parse(fs.readFileSync(fp, 'utf8')), c.check.path); if (JSON.stringify(v) !== JSON.stringify(c.check.equals)) throw new Error(c.id + ' 값 불일치: ' + c.check.path + ' = ' + JSON.stringify(v)); }
  else { const src = fs.readFileSync(fp, 'utf8'); if (!src.includes(c.check.text)) throw new Error(c.id + ' 글자 없음: ' + c.check.text); if (/\.js$/.test(c.check.file) && src.split('\n').filter(l => l.includes(c.check.text)).every(l => /^\s*\/\//.test(l))) throw new Error(c.id + ' 글자가 주석에만 있다'); }
  if (!c.touches.includes(c.check.file)) throw new Error(c.id + ' check.file 이 touches 에 없다');
}
const out = {
  task: 'TASK-ES-643', requirementsSource: REQ,
  requirements: [
    { id: 'R1', text: 'gen-inline-hard.js 에 mode:"region" 을 더한다 — 연달아 있는 로드 중 문(M1a 3줄 이하 포함 호출문·if·try·식 문 · M1b 기관 define 줄 · M1c 구역 안에서만 쓰는 노출 안 된 var · M1d 남은 window 복사 줄 · M1e 구역 안 주석·빈 줄)을 순서 그대로 세포 함수 본문으로 옮기고, 원래 자리에 부르는 한 줄과 머리에 가져오기 한 줄을 남긴다.' },
    { id: 'R2', text: '구역 경계는 줄 번호가 아니라 구획 주석 제목(과 문 글자 닻)으로 지정한다.' },
    { id: 'R3', text: '안전 정지: 구역 안의 함수 선언 · 키트 가져오기 · 손잡이 · expose 문 · 노출된 이름의 var 선언 · 구역 밖에서 참조되는 var · 최상위 this/arguments/return · 줄 중간에서 시작하거나 끝나는 구역 · 닫힌 목록 밖의 문 종류와 칸. 멈추면 아무것도 쓰지 않는다.' },
    { id: 'R4', text: '생성되는 세포 파일의 꼴(키트에 다는 방식 · L. 접두 · 800줄 상한 · 한 세포에 구역 여럿)은 옮기기 경로의 감싸기 산출과 맞춘다. 등록 블록을 만들지 않는다.' },
    { id: 'R5', text: '기존 경로(옮기기 · unwire · unstate)는 바이트 무변화다. 제품 코드(js/** · index.html) · tests/ · 금고 변경 0, 저장소 index.html 의 실제 구역 이전 0.' },
    { id: 'R6', text: '옮기기 경로의 감싸기와 무엇이 다른지, 그 경로를 부르는지 새 경로인지를 설계 5절에 적는다.' },
    { id: 'R7', text: '지금 main 의 실제 모양을 다시 재서 구역 계획(구획 주석 제목으로 경계 지정)을 남기고, 사본에 모의 적용한 결과가 파싱되고 · 실행 순서가 보존되고 · 저장소 밖 사본에서 앱이 실제로 뜨는지 잰다. 돈 근처 줄과 OURGOAL_CONFIG 는 구역에서 뺀다.' }
  ],
  outOfScopeReports: [
    { text: '실제 구역 이전(index.html 변경) · sweep · finalize 모드(X8·X9)는 이 PR 에 없다. 구역 함수 이름 · 세포 파일 · 키트는 계획기의 가칭이며 실제 PR 이 정한다.', cannotBecause: 'out-of-scope-feature' },
    { text: '모의 사본의 화면 시나리오는 게스트 범위까지다 — 로그인 뒤 화면과 숨겨진 진입로는 측정불가. 호출 순서의 동적 대조 탐침(설계 3.4 의 안)은 만들지 않았다(미검증) — 순서는 줄 순서의 정적 대조와 꾸러미의 vm 실행 등가로만 쟀다.', cannotBecause: 'out-of-scope-feature' }
  ],
  claims
};
fs.writeFileSync(path.join(WORK, R + 'claims.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log('claims', claims.length, '· unit', s.unit.passed + '/' + s.unit.total, '· regions', plan.totals.regions);
