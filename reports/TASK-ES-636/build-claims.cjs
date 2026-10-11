#!/usr/bin/env node
'use strict';
// #TASK-ES-636 주장 파일 생성 — 수치는 측정 파일에서 읽어 넣는다(손으로 옮기지 않는다). 작업자 측정, 판정 아님.
// 주장 배치는 B3a(#TASK-ES-614, PR #889) 선례: 화면 시나리오(보존) + 모듈 로드 · 전역 · 순증가 기록.
// 사용: node reports/TASK-ES-636/build-claims.cjs <작업 트리>
const fs = require('fs'), path = require('path');
const WORK = path.resolve(process.argv[2] || '.');
const R = 'reports/TASK-ES-636/';
const read = f => JSON.parse(fs.readFileSync(path.join(WORK, f), 'utf8'));
const M = R + 'measurement.json', P = R + 'unstate-plan.json', ML = R + 'module-load.json', OU = R + 'organ-unit.json';
const m = read(M).summary, plan = read(P);
const ORGAN = 'js/core/app-state.js', IDX = 'index.html', DES = 'docs/architecture/CELL-REGISTRY-DESIGN.md', REQ = 'docs/specs/REQ-TASK-ES-636-APP-STATE-ORGAN.md', TIC = 'docs/rules/TICKETS.md';
const jp = (id, req, file, p, equals, statement, more) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [file].concat(more || []), check: { type: 'jsonPath', file, path: p, equals } });
const cc = (id, req, file, text, statement) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [file], check: { type: 'codeContains', file, text } });
const sc = (id, req, scenario, statement) => ({ id, req, kind: 'behavior', change: 'preserve', domain: 'ui-behavior', statement, touches: [IDX, ORGAN], scenario });
const claims = [
  sc('C1', 'R1', 'scenarios/b9a-guest-boot-six-tabs.json', '게스트로 진입해 홈→목표→기록→일정→소통→설정→홈 순서로 탭을 누르면 누른 탭이 활성이 되고 앞 탭은 비활성이 되며 예외가 없다 — 상태 기관 로드 태그를 더하기 전과 같다.'),
  sc('C2', 'R1', 'scenarios/b9a-goals-subtabs-periods.json', '목표 탭에서 하위 탭(개인·루틴·통계)과 통계 기간(주·월)을 누르면 누른 것이 활성이 되고 앞의 것은 비활성이 되며 예외가 없다 — 상태 기관 로드 태그를 더하기 전과 같다.'),
  jp('C3', 'R1', ML, 'work.regressions', [], '모듈 로드 탐침(기준 대 작업)의 새 회귀가 없다.'),
  jp('C4', 'R1', M, 'summary.newGlobals.onlyOrganGlobal', true, '새 파일 js/core/app-state.js 를 단독으로 로드하면 오류가 없고 만드는 전역은 OurgoalAppState 하나다.', [ORGAN]),
  jp('C5', 'R1', M, 'summary.changed.indexHtml.netLineGrowth', 0, 'index.html 순증가가 0 줄이다.'),
  jp('C6', 'R1', M, 'summary.loadTag.appendedOnly', true, 'index.html 의 바뀐 줄은 하나이고, 기존 줄 끝에 기관 태그 하나를 덧붙인 것뿐이다.', [IDX]),
  jp('C7', 'R1', M, 'summary.loadTag.afterScopeTag', true, '기관 태그는 통로(app-scope.js) 태그 뒤에 있다.'),
  jp('C8', 'R1', M, 'summary.loadTag.beforeCommitTag', true, '기관 태그는 등록 기관 commit 태그보다 앞에 있다.'),
  jp('C9', 'R1', M, 'summary.loadTag.beforeIife', true, '기관 태그는 인라인 IIFE 보다 앞에 있다.'),
  jp('C10', 'R1', M, 'summary.loadTag.deferOrAsync', false, '기관 태그에 defer·async 가 없다(동기 로드).'),
  jp('C11', 'R2', OU, 'ok', true, '기관 단위 시험(진짜 app-scope.js 위에서 계약 항목마다: getter 전용 · get/set · 첫 define 때 접근자 · 이미 있던 속성 덮기 · 같은 이름 두 번 오류 · 같은 객체 · window 에 달지 않음 · 통로 없으면 오류 · 생성기가 바꿔 쓴 꾸러미의 전·후 등가)이 전부 ok 다.', [ORGAN]),
  jp('C12', 'R2', OU, 'total', read(OU).total, '기관 단위 시험의 건수.'),
  jp('C13', 'R2', OU, 'passed', read(OU).total, '기관 단위 시험의 통과 수(건수와 같다).'),
  jp('C14', 'R3', M, 'summary.stateProbe.baseVsMockPlan.count', 0, '계획대로 옮긴 모의 이전 사본과 기준에서, 통로에 노출된 상태 이름의 값 요약 · 접근자 종류 · window 동일성 · 쓰기 왕복이 다른 이름이 0 개다(기준을 두 번 재도 달라지는 이름은 뺀다).'),
  jp('C15', 'R3', M, 'summary.stateProbe.baseVsMockPlan.organMatchesPlan', true, '모의 이전 사본에서 기관이 맡은 이름과 종류(읽기 전용·읽기쓰기)가 계획과 같다.'),
  jp('C16', 'R3', M, 'summary.stateProbe.baseVsMockAll.count', 0, '옮길 수 있는 이름을 전부 옮긴 사본에서도 같은 차이가 0 개다.'),
  jp('C17', 'R3', M, 'summary.stateProbe.baseVsWork.count', 0, '기관과 로드 줄만 더한 작업 트리에서도 같은 차이가 0 개다.'),
  jp('C18', 'R3', M, 'summary.scenarios.allPassed', true, '시나리오 둘이 기준 · 작업 · 모의 이전 사본(계획 · 전부) 모두에서 통과하고 예외가 없다.'),
  jp('C19', 'R3', M, 'summary.mockUnstate.plan.testsSameAsBase', true, '계획대로 옮긴 모의 이전 사본에서 npm test 의 스크립트 결과와 tests/*.test.js 의 실패 집합·꼬리 글자가 기준과 같다.'),
  jp('C20', 'R3', ML, 'mock.regressions', [], '모듈 로드 탐침(기준 대 모의 이전 사본)의 새 회귀가 없다.'),
  jp('C21', 'R3', M, 'summary.mockUnstate.withoutOrganTag.guestBootOk', false, '대조군: 같은 모의 이전 사본에서 기관 태그만 빼면 게스트 부팅이 실패한다.'),
  jp('C22', 'R4', P, 'totals.names', plan.totals.names, '계획 파일의 이전 대상 이름 수(시험에 걸리는 이름을 뺀 것 — 이 PR 이 소유한 기록).'),
  jp('C23', 'R4', P, 'totals.excludedBecauseTestsPinStateText', plan.totals.excludedBecauseTestsPinStateText, '계획 파일의 시험이 붙잡아 뺀 이름 수.'),
  jp('C24', 'R4', M, 'summary.pinnedByTests.unexplainedFailingFiles', [], '전부 옮긴 사본에서 새로 깨진 시험 가운데, 붙잡은 이름을 찾지 못한 시험 파일이 없다.'),
  jp('C25', 'R5', M, 'summary.changed.testsChanged', [], 'tests/ 변경이 없다.'),
  jp('C26', 'R5', M, 'summary.changed.vaultChanged', [], '금고 변경이 없다.'),
  jp('C27', 'R5', M, 'summary.changed.generatorInlineHardChanged', [], '생성기 gen-inline-hard.js 변경이 없다.'),
  jp('C28', 'R5', M, 'summary.changed.generatedMapsChanged', [], '생성 지도 3종 변경이 없다.'),
  jp('C29', 'R5', M, 'summary.lines.over800', [], '800줄을 넘는 바뀐 js 파일이 없다.'),
  jp('C30', 'R5', M, 'summary.ratchet.inlineScriptLinesSame', true, 'inlineScriptLines 가 기준과 같다(실제 상태 이전 0).'),
  jp('C31', 'R5', M, 'summary.npmTest.same', true, 'npm test 를 기준 트리와 작업 트리에서 전경으로 끝까지 돌려 종료 코드 0 이고 검사 줄·요약이 같다(폐기 0).'),
  cc('C32', 'R2', ORGAN, "scopeApi.expose(OWNER, source);", '기관이 통로의 expose 로 접근자를 단다(통로를 직접 고치지 않는다).'),
  cc('C33', 'R1', IDX, '<script src="js/core/app-scope.js"></script><script src="js/core/cell-registry.js"></script><script src="js/core/app-state.js"></script>', '기관 태그가 통로 태그와 같은 줄 뒤에 있다.'),
  cc('C34', 'R5', DES, '- **구현(#TASK-ES-636)**: `js/core/app-state.js`', '설계 3.3 에 구현 기록이 있다.'),
  cc('C35', 'R5', REQ, '「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마. 지침이나 결심이 필요한점?」', 'REQ 머리에 상민님 원문이 글자 그대로 있다.'),
  cc('C36', 'R5', TIC, '- #TASK-ES-636 | INFRA | 상태 기관 js/core/app-state.js', '티켓 대장에 ES-636 한 줄이 있다.')
];
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
for (const c of claims) {
  if (c.kind === 'behavior') { if (!fs.existsSync(path.join(WORK, R, c.scenario))) throw new Error(c.id + ' 시나리오 파일 없음: ' + c.scenario); continue; }
  const fp = path.join(WORK, c.check.file);
  if (c.check.type === 'jsonPath') { const v = getPath(JSON.parse(fs.readFileSync(fp, 'utf8')), c.check.path); if (JSON.stringify(v) !== JSON.stringify(c.check.equals)) throw new Error(c.id + ' 값 불일치: ' + c.check.path + ' = ' + JSON.stringify(v)); }
  else { const src = fs.readFileSync(fp, 'utf8'); if (!src.includes(c.check.text)) throw new Error(c.id + ' 글자 없음: ' + c.check.text); }
  if (!c.touches.includes(c.check.file)) throw new Error(c.id + ' check.file 이 touches 에 없다');
}
const out = {
  task: 'TASK-ES-636', requirementsSource: REQ,
  requirements: [
    { id: 'R1', text: '상태 기관 js/core/app-state.js(OurgoalAppState.define · defineVar)를 더하고 index.html 에 로드 태그 하나를 통로 뒤 · IIFE 와 등록 기관 commit 앞에 같은 줄로 덧붙인다. 앱 동작은 그대로다 — 모듈 로드 회귀 0, 새 전역은 OurgoalAppState 하나, index.html 순증가 0.' },
    { id: 'R2', text: '기관이 설계 3.3 계약대로 동작한다: 접근자를 첫 define 때 한 번 · 이미 있던 속성을 다시 정의해 덮음 · 같은 이름 두 번은 오류 · 값을 복사하지 않음 · window 에 달지 않음.' },
    { id: 'R3', text: '모의 이전으로 충분성을 잰다: 저장소 밖 사본에 기관 + 로드 줄 + 생성기 unstate 를 실제 적용해 시나리오 · 이름별 통로 값 요약 · 모듈 로드 · 시험이 기준과 같고, 기관 태그만 뺀 대조군은 부팅에 실패한다. 저장소의 실제 상태 이전은 0 이다.' },
    { id: 'R4', text: '상태 배선 글자를 붙잡는 시험이 깨지는지 실측해 그 이름을 계획에서 빼고(시험은 고치지 않는다), 지금 이전 가능한 이름 목록을 계획 파일로 남긴다.' },
    { id: 'R5', text: '증명 하한: tests/ · 금고 · 생성기 gen-inline-hard.js · 생성 지도 3종 변경 0 · 800줄 상한 초과 0 · inlineScriptLines 불변 · npm test 검사 수 동일·폐기 0.' }
  ],
  outOfScopeReports: [
    { text: '실제 상태 이전(index.html 의 getter/setter 삭제와 선언문 바꿔 쓰기)은 이 PR 에 없다. 계획 파일 reports/TASK-ES-636/unstate-plan.json 이 다음 PR 의 입력이다.', cannotBecause: 'out-of-scope-feature' },
    { text: '게스트 화면에서 숨겨져 누를 수 없는 진입로(템플릿 백과 · 앱 평가 · 체크인 글자 수 칸)와 로그인 뒤 화면의 동작은 화면 시나리오로 재지 못했다. 상태 이름 전수는 탐침의 값 요약 · 접근자 종류 · 쓰기 왕복(작업자 측정)으로 쟀고, 법정이 그것을 다시 재는 것은 아니다.', cannotBecause: 'out-of-scope-feature' }
  ],
  claims
};
fs.writeFileSync(path.join(WORK, R + 'claims.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log('claims', claims.length, '· plan', plan.totals.names, '· excluded', plan.totals.excludedBecauseTestsPinStateText);
