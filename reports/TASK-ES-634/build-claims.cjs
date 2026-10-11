'use strict';
// #TASK-ES-634 주장 파일 생성 — 수치는 측정 파일에서 읽어 넣는다(손으로 옮기지 않는다). 작업자 측정, 판정 아님.
// 사용: node reports/TASK-ES-634/build-claims.cjs <작업 트리>
const fs = require('fs'), path = require('path');
const WORK = path.resolve(process.argv[2] || '.');
const R = 'reports/TASK-ES-634/';
const read = f => JSON.parse(fs.readFileSync(path.join(WORK, f), 'utf8'));
const m = read(R + 'measurement.json'), s = m.summary, plan = read(R + 'unstate-plan.json');
const M = R + 'measurement.json', P = R + 'unstate-plan.json';
const GEN = 'docs/design/harness/module-split/gen-inline-hard.js', HAR = 'docs/design/harness/module-split/unstate-check-634.js';
const DES = 'docs/architecture/CELL-REGISTRY-DESIGN.md', REQ = 'docs/specs/REQ-TASK-ES-634-GEN-UNSTATE.md', TIC = 'docs/rules/TICKETS.md';
const jp = (id, req, file, p, equals, statement, more) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [file].concat(more || []), check: { type: 'jsonPath', file, path: p, equals } });
const cc = (id, req, file, text, statement) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [file], check: { type: 'codeContains', file, text } });
const u = id => 'summary.unit.byId.' + id;
const zIds = Object.keys(s.unit.byId).filter(k => /^Z\d+$/.test(k)).sort();
const claims = [
  jp('C1', 'R1', M, u('T1'), true, 'S1 getter/setter 줄 삭제 · R1 선언문 → define/defineVar(여러 줄 초기값 포함) · R2 window 복사 세 꼴의 오른쪽 바꿔 쓰기가 기대한 글자와 바이트 단위로 같고, names 밖은 그대로다.', [GEN, HAR]),
  jp('C2', 'R1', M, u('S1'), true, 'expose 문의 속성이 모두 대상이면 문 전체를 지우고, 대상이 없는 expose 문은 끝 쉼표까지 그대로다.'),
  jp('C3', 'R1', M, u('R1'), true, '초기값 글자(괄호 · 주석 · 문자열 안의 같은 글자 · 함수식 · `;` 앞 빈칸)가 그대로 남는다.'),
  jp('C4', 'R2', M, u('K1'), true, 'define/defineVar 는 지우기 직전 마지막 노출 문에 set 이 있었는가로 생성기가 정한다(앞에 set 이 있었어도 마지막이 getter 뿐이면 define).', [GEN]),
  ...zIds.map((z, i) => jp('C' + (5 + i), 'R3', M, u(z), true, '정지 조건 시험 ' + z + ': ' + ((read(R + 'unstate-unit.json').results.find(r => r.id === z) || {}).title || '') + ' — 멈추고 index.html 을 쓰지 않는다(Z22 는 조용한 경우 통과).', i === 0 ? [GEN] : [])),
];
let n = 5 + zIds.length;
const add = c => { c.id = 'C' + (n++); claims.push(c); };
add(jp('', 'R4', M, u('M1'), true, '여러 실행: 배열(unstate · { unwire } · unstate) 한 번 = 단계를 따로 차례로 돌린 결과(바이트 동일).', [GEN]));
add(jp('', 'R4', M, u('M2'), true, '뒤 실행이 멈추면 쓰지 않고 몇 번째 실행인지 알린다. 빈 배열 · unwire 단계의 다른 칸 · 단일 객체 꼴의 unwire 칸은 멈춘다.'));
add(jp('', 'R5', M, 'summary.generator.insertOnly', true, '생성기의 기준 줄은 한 줄도 바뀌지 않았다(앞 공통 줄 수 + 뒤 공통 줄 수 = 기준 줄 수 — 끼워 넣기뿐).', [GEN]));
add(jp('', 'R5', M, 'summary.generator.baseLinesChanged', 0, '생성기에서 바뀌거나 지워진 기준 줄이 0 이다.'));
add(jp('', 'R5', M, 'summary.generator.insertedAfterUnwire', true, '끼워 넣은 자리는 unwire 블록(unwireOnce) 뒤다.'));
add(jp('', 'R5', M, 'summary.generator.insertedBeforeMovePath', true, '끼워 넣은 자리는 옮기기 경로(smoke-test 주석) 앞이다.'));
add(jp('', 'R5', M, u('B'), true, 'unwire 확장 시험 16건(#TASK-ES-619 — 그 안에서 B1 시험 8건과 A1 시범 재생성 바이트 대조)이 고친 생성기에서 그대로 통과한다.', [GEN]));
add(jp('', 'R5', M, u('U1'), true, 'unwire 설정(단일 객체 · 배열)을 고친 생성기와 기준 생성기에 돌린 결과 · 메타 · 출력 줄이 같다.'));
add(jp('', 'R5', M, 'summary.protectedChanged.count', 0, '제품 코드(js/** · index.html) · tests/ · 금고 · 지시함 · 생성 지도에서 바뀐 파일이 0 개다.'));
add(jp('', 'R5', M, 'summary.npmTest.same', true, 'npm test 를 기준 트리와 작업 트리에서 전경으로 끝까지 돌려 종료 코드 0 이고 검사 줄 수·요약 줄이 같다.'));
add(jp('', 'R5', M, 'summary.inlineScriptLines.same', true, 'inlineScriptLines 가 기준과 같다(저장소 index.html 의 실제 상태 이전 0).'));
add(jp('', 'R5', M, 'summary.unit.total', s.unit.total, '단위 시험의 건수.', [HAR]));
add(jp('', 'R5', M, 'summary.unit.passed', s.unit.total, '단위 시험이 전부 ok 다(통과 수 = 건수).'));
add(jp('', 'R6', M, u('V1'), true, '모의 기관 등가: 진짜 js/core/app-scope.js 와 설계 3.3 계약대로 만든 견본 기관에서, 바꿔 쓰기 전·후 꾸러미의 관찰값이 같다(견본이며 진짜 기관의 증명이 아니다).', [HAR]));
add(cc('', 'R6', DES, '**기관 API — 확정(#TASK-ES-634)**', '설계 3.3 에 기관 API 계약이 확정돼 있다.'));
add(cc('', 'R6', DES, '| 접근자를 다는 시점 | 그 이름의 **첫 define/defineVar 호출 때 한 번**.', '설계 3.3 계약 표에 접근자를 다는 시점이 적혀 있다.'));
add(jp('', 'R7', M, u('P1'), true, '기준 커밋의 실제 index.html 사본에서 지금 옮길 수 있는 노출 상태 이름 전부를 한 번에 돌려 성공하고 결과가 다시 파싱된다.', [GEN]));
add(jp('', 'R7', M, u('P2'), true, '그 결과를 줄 단위로 맞대 — 지운 줄은 대상 이름의 getter/setter(와 빈 expose 껍데기)뿐, 바뀐 줄은 선언 머리 · 선언 끝 · window 복사 오른쪽뿐, 나머지 줄은 순서대로 같다.'));
add(jp('', 'R7', M, u('P3'), true, '계획 파일에 대상 이름 · 이름별 API · 멈춘 이름과 사유가 있다.'));
add(jp('', 'R7', P, 'totals.movable', plan.totals.movable, '계획 파일의 지금 옮길 수 있는 이름 수(기준 커밋 ' + plan.basis.pin.slice(0, 8) + ' 에 고정된 입력 — main 을 합쳐도 이 파일의 값은 그대로다).'));
add(jp('', 'R7', P, 'totals.exposed', plan.totals.exposed, '계획 파일의 통로에 노출된 상태 이름 수.'));
add(jp('', 'R7', P, 'totals.deletedLines', plan.totals.deletedLines, '계획 파일의 모의 적용 시 지워지는 줄 수.'));
add(cc('', 'R1', GEN, "if (CFG.mode === 'unstate') { runUnstate(); return; }", '새 경로는 mode 가 unstate 일 때만 들어간다.'));
add(cc('', 'R3', GEN, "if (!['names', 'label'].includes(k)) fail(", 'unstate 실행의 칸이 닫혀 있다(그 밖의 칸은 멈춘다).'));
add(cc('', 'R5', DES, '### 5.5 구현된 unstate 설정 꼴 — X4 · X5 · X6 (#TASK-ES-634)', '설계 문서 5.5 에 구현된 설정 꼴이 적혀 있다.'));
add(cc('', 'R5', REQ, '「결심필요 4번 빼고 모두 권장안대로 진행하고 4번은 자세히 설명해봐 어떤 함수인지 어떤 기능을 하던건지 자세히, 어떻게 진행하는게 좋을지, 권장안이 뭔지」', 'REQ 머리에 상민님 원문이 글자 그대로 있다.'));
add(cc('', 'R5', TIC, '- #TASK-ES-634 | INFRA | 생성기 unstate 모드', '티켓 대장에 ES-634 한 줄이 있다.'));
// 자가 검사
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
for (const c of claims) {
  const fp = path.join(WORK, c.check.file);
  if (c.check.type === 'jsonPath') { const v = getPath(JSON.parse(fs.readFileSync(fp, 'utf8')), c.check.path); if (JSON.stringify(v) !== JSON.stringify(c.check.equals)) throw new Error(c.id + ' 값 불일치: ' + c.check.path + ' = ' + JSON.stringify(v)); }
  else { const src = fs.readFileSync(fp, 'utf8'); if (!src.includes(c.check.text)) throw new Error(c.id + ' 글자 없음: ' + c.check.text); if (/\.js$/.test(c.check.file) && src.split('\n').filter(l => l.includes(c.check.text)).every(l => /^\s*\/\//.test(l))) throw new Error(c.id + ' 글자가 주석에만 있다'); }
  if (!c.touches.includes(c.check.file)) throw new Error(c.id + ' check.file 이 touches 에 없다');
}
const out = {
  task: 'TASK-ES-634', requirementsSource: REQ,
  requirements: [
    { id: 'R1', text: 'gen-inline-hard.js 에 mode:"unstate" 를 더한다 — S1(X4) 상태 이름의 expose getter/setter 삭제 · R1(X5) `var X = 초기값;` 을 window.OurgoalAppState.define/defineVar(\'X\', 초기값); 로 1:1 바꿔 쓰기 · R2(X6) 일회 window 복사 줄의 오른쪽 바꿔 쓰기.' },
    { id: 'R2', text: 'define 과 defineVar 의 선택은 지우기 직전 마지막 노출 문에 set 이 있었는가로 생성기가 정한다(L047).' },
    { id: 'R3', text: '안전 정지: 맨이름 참조가 남음 · 선언문이 다른 문과 한 줄을 나눠 씀 · 선언자가 여럿 · 초기값에 자기 이름 · 닫힌 목록 밖 줄(모르는 칸 포함).' },
    { id: 'R4', text: '여러 실행 배열과 함께 쓸 수 있다(unstate 단계와 { unwire } 단계). 하나라도 멈추면 쓰지 않는다.' },
    { id: 'R5', text: '기존 경로(옮기기 · unwire)는 글자 하나 지나지 않고 바이트 무변화다. 제품 코드·tests·금고 변경 0, 저장소 index.html 실제 상태 이전 0.' },
    { id: 'R6', text: '기관 API(이름 · 인자 · 접근자를 다는 시점)를 설계 3.3 에 확정해 적는다.' },
    { id: 'R7', text: '기준 커밋의 실제 index.html 사본에서 지금 옮길 수 있는 노출 상태 이름을 다시 재고 모의 적용한다. 대상 이름과 예상 줄 변화를 계획 파일로 남긴다.' }
  ],
  outOfScopeReports: [
    { text: '상태 기관 파일(js/core/app-state.js)과 로드 줄, 실제 상태 이전(index.html 변경)은 이 PR 에 없다. 모의 적용 사본의 앱 부팅·화면 동작은 기관이 없어 재지 않았다(측정불가). 시험 V1 의 기관은 설계 계약대로 만든 견본이다.', cannotBecause: 'out-of-scope-feature' },
    { text: '계획 파일의 대상 이름이 시험이 붙잡는 글자인지는 재지 않았다(이전 PR 이 npm test 로 잰다). region · sweep · finalize 모드(X7~X9)는 이 PR 에 없다.', cannotBecause: 'out-of-scope-feature' }
  ],
  claims
};
fs.writeFileSync(path.join(WORK, R + 'claims.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log('claims', claims.length, '· unit', s.unit.passed + '/' + s.unit.total, '· plan', plan.totals.movable + '/' + plan.totals.exposed);
