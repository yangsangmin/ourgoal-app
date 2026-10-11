#!/usr/bin/env node
'use strict';
// #TASK-ES-623 주장 파일 생성기 — reports/TASK-ES-623/claims.json 을 측정 파일에서 만든다(값을 손으로 옮기지 않는다).
// 사용: node reports/TASK-ES-623/build-claims.cjs <작업 폴더>
const fs = require('fs'), path = require('path');
const WT = path.resolve(process.argv[2] || '.'), TASK = 'TASK-ES-623', DIR = path.join(WT, 'reports', TASK), REL = 'reports/' + TASK + '/';
const REQ = 'docs/specs/REQ-TASK-ES-623-GATE-WIRING-TEXT.md', GATE = 'scripts/verify-integrity-gate.js';
const rj = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const CH = rj('changed-assertions.json');
const APPROVAL = '상민님 2026-10-11 「2. 철거 2차 사전 승인, 금고 변경 승인」(원문은 ' + REQ + ' 0절)';
const get = (o, p) => p.split('.').reduce((x, k) => (x && typeof x === 'object' ? x[k] : undefined), o);
const requirements = [
  { id: 'R1', text: '금고 파일 scripts/verify-integrity-gate.js 의 옛 배선 글자 단언 한 줄(window.promptNewGoal = promptNewGoal;)을 「그 글자가 있거나, 같은 이름·같은 값이 등록으로 window 에 나간다」로 넓힌다. 검사 수 그대로, 폐기 0(상민님 「금고 변경 승인」).' },
  { id: 'R2', text: '금고 변경은 금고만 담은 별도 PR 로 올린다 — 이 PR 의 변경 파일은 금고 파일 하나와 서류뿐이다.' },
  { id: 'R3', text: '짝 PR(TASK-ES-620)과 병합 순서가 바뀌어도 main 의 게이트가 죽거나 느슨해지지 않는다(공용 도우미가 없으면 고치기 전 식 그대로).' },
  { id: 'R4', text: '고치기 전·후 측정을 싣는다(작업자 측정, 판정 아님).' },
];
const claims = [];
let n = 0;
const add = (req, statement, touches, check) => claims.push({ id: 'C' + (++n), req, kind: 'static', domain: 'config', statement, touches, check });
const text = (file, t) => { const src = fs.readFileSync(path.join(WT, file), 'utf8'); if (!src.includes(t)) throw new Error('글자 없음: ' + file + ' :: ' + t); return { type: 'codeContains', file, text: t }; };
const json = (f, p) => { const v = get(rj(f), p); if (v === undefined) throw new Error('값 없음: ' + f + ' ' + p); return { type: 'jsonPath', file: REL + f, path: p, equals: v }; };
const rec = (req, statement, f, p) => add(req, statement, [REL + f], json(f, p));

add('R1', '게이트의 그 단언이 옛 배선 글자를 그대로 둔 채 넓힌 판정 함수를 거친다.', [GATE], text(GATE, "assert.ok(windowExposed(html, 'window.promptNewGoal = promptNewGoal;'), 'window.promptNewGoal 전역 배선 누락');"));
add('R3', '게이트의 판정 함수는 공용 도우미가 있으면 그것을, 없으면 고치기 전 식(글자가 있는가)을 쓴다.', [GATE], text(GATE, 'function windowExposed(source, legacyText) { return WIRING ? WIRING.windowExposed(source, legacyText) : source.includes(legacyText); }'));
add('R3', '도우미는 파일이 있을 때만 읽는다(없으면 죽지 않고, 있는데 고장 났으면 오류로 드러난다).', [GATE], text(GATE, 'const WIRING = fs.existsSync(WIRING_HELPER) ? require(WIRING_HELPER) : null;'));
rec('R1', '변경 기록: 바꾼 시험 줄 수.', 'changed-assertions.json', 'summary.changedLines');
rec('R1', '변경 기록: 지우기만 한 시험 줄 수.', 'changed-assertions.json', 'summary.removedOnly');
rec('R1', '변경 기록: 옛 배선 글자가 바꾼 줄에 그대로 남아 있는지.', 'changed-assertions.json', 'summary.legacyTextKeptAll');
rec('R2', '범위 기록: 이 변경이 바꾼 금고 파일 목록.', 'measurement.json', 'changedScope.vaultCourtConstitutionDirectivesGenerator');
rec('R2', '범위 기록: 이 변경이 바꾼 제품 파일 목록.', 'measurement.json', 'changedScope.product');
rec('R2', '범위 기록: 이 변경이 바꾼 그 밖의 시험 파일 목록.', 'measurement.json', 'changedScope.tests');
rec('R3', '측정 기록: 현재 main · 고친 게이트만(도우미 없음)의 npm test 종료 코드.', 'measurement.json', 'summary.compare.gateOnlyMainNpmTestExit');
rec('R3', '측정 기록: 현재 main · 고친 게이트만의 게이트 ✓ 줄 수.', 'measurement.json', 'summary.compare.gateOnlyMainGateCheckLines');
rec('R3', '측정 기록: 현재 main · 고친 게이트만의 게이트 실패 검사 수.', 'measurement.json', 'summary.compare.gateOnlyMainGateFails');
rec('R3', '측정 기록: 모의 철거 사본 · 고친 게이트만(도우미 없음)의 게이트 실패 검사 수 — 고치기 전과 같은 판정.', 'measurement.json', 'summary.compare.gateOnlyMockGateFails');
rec('R4', '측정 기록: 모의 철거 사본 · 고치기 전의 게이트 실패 검사 수.', 'measurement.json', 'summary.compare.mockGateFailsBefore');
rec('R4', '측정 기록: 두 PR 을 다 얹은 모의 철거 사본의 게이트 ✓ 줄 수.', 'measurement.json', 'summary.compare.bothMockGateCheckLines');
rec('R4', '측정 기록: 두 PR 을 다 얹은 모의 철거 사본의 게이트 실패 검사 수.', 'measurement.json', 'summary.compare.bothMockGateFails');
rec('R4', '측정 기록: 두 PR 을 다 얹은 모의 철거 사본의 npm test 종료 코드.', 'measurement.json', 'summary.compare.bothMockNpmTestExit');
rec('R4', '측정 기록: 두 PR 을 다 얹은 현재 main 의 npm test 종료 코드.', 'measurement.json', 'summary.compare.bothMainNpmTestExit');
rec('R4', '측정 기록: 두 PR 을 다 얹은 트리에서 모의 철거 사본에서만 실패하는 단언 줄 수.', 'measurement.json', 'summary.remaining.main-both__mock-both');
rec('R4', '대조군 기록: 등록을 깨뜨린 다섯 변형 모두 새로 실패한 줄이 기대한 줄과 같은지.', 'control-group.json', 'summary.allAsExpected');
// origin/main 을 합친 뒤의 빠른 재확인 기록(있을 때만)
if (fs.existsSync(path.join(DIR, 'post-merge.json'))) {
  rec('R3', '합친 뒤 재확인 기록: 고친 게이트만(도우미 없음)의 npm test 종료 코드.', 'post-merge.json', 'summary.compare.gateOnlyMainNpmTestExit');
  rec('R3', '합친 뒤 재확인 기록: 고친 게이트만의 게이트 ✓ 줄 수.', 'post-merge.json', 'summary.compare.gateOnlyMainGateCheckLines');
  rec('R4', '합친 뒤 재확인 기록: 두 PR 을 다 얹은 모의 철거 사본의 게이트 실패 검사 수.', 'post-merge.json', 'summary.compare.bothMockGateFails');
  rec('R4', '합친 뒤 재확인 기록: 두 PR 을 다 얹은 모의 철거 사본의 npm test 종료 코드.', 'post-merge.json', 'summary.compare.bothMockNpmTestExit');
  rec('R4', '합친 뒤 재확인 기록: 두 PR 을 다 얹은 트리에서 모의 철거 사본에서만 실패하는 단언 줄 수.', 'post-merge.json', 'summary.remaining.main-both__mock-both');
  rec('R2', '합친 뒤 범위 기록: 이 변경이 바꾼 금고 파일 목록.', 'post-merge.json', 'changedScope.vaultCourtConstitutionDirectivesGenerator');
  rec('R2', '합친 뒤 범위 기록: 이 변경이 바꾼 제품 파일 목록.', 'post-merge.json', 'changedScope.product');
}

const rows = CH.changed.filter(r => r.file === GATE);
const retire = [...new Set(rows.map(r => r.check))].map(title => ({ file: GATE, check: title,
  reason: '폐기가 아니라 넓힘이다(검사 수 38 그대로 · 단언 수 그대로). 이 검사 안의 「index.html 에 ' + rows.filter(r => r.check === title).map(r => r.legacyText.trim()).join(' / ') + ' 글자가 있다」 단언 ' + rows.filter(r => r.check === title).length + '줄을 「그 글자가 있거나, 같은 이름·같은 값이 세포의 등록 블록(OurgoalCellRegistry.provide)으로 window 에 나간다」로 넓혔다(공용 도우미 tests/helpers/wiring-exposed.js — 없으면 고치기 전 식 그대로). 승인: ' + APPROVAL }));

const floors = JSON.parse(fs.readFileSync(path.join(WT, 'court', 'grade-floors.json'), 'utf8'));
for (const c of claims) for (const k of floors.keywordFloors || []) if (new RegExp(k.pattern, 'i').test(c.statement)) throw new Error('문장이 낱말 하한에 걸린다(' + k.label + '): ' + c.id + ' ' + c.statement);
const doc = { task: TASK, requirementsSource: REQ, requirements,
  outOfScopeReports: [
    { text: '같은 검사 안의 다음 줄 window.showNewGoalManualForm = showNewGoalManualForm; 은 등록 기관에 등록되지 않은 이름의 배선 글자라 고치지 않았다(배선 철거가 지우는 줄이 아니다).' },
    { text: '그 밖의 시험지(scripts/smoke-test.js 등)와 공용 도우미는 짝 PR(TASK-ES-620)에 있다. 이 PR 만으로는 모의 철거 사본의 게이트가 통과하지 않는다(도우미가 없다 — summary.compare.gateOnlyMockGateFails).' },
  ],
  claims, retire };
fs.writeFileSync(path.join(DIR, 'claims.json'), JSON.stringify(doc, null, 1) + '\n', 'utf8');
console.log('claims', claims.length, '· retire', retire.length, '· requirements', requirements.length);
