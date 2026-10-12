'use strict';
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../../..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const claimsFile = 'reports/TASK-ES-695/claims.json', claims = read(claimsFile);
const suffix = '\n2026-10-13 보완 차수 작업자 측정(법정 확인 아님): reports/TASK-ES-695/correction-2026-10-13/summary.json·worker-measurements.md. 첫 원시 결과는 그대로 보존했다. 기존 독립 반례의 고유 자료 보존·복원 실패 결과와 추가 오류/종료/다음 저장을 별도 측정했고, syncServerRecords·migrateGuestDataToUser를 실제 Chrome에서 직접 불렀다(세션·응답은 가짜, 실클릭 E2E가 아니다). 정상 다시 열기·다음 저장·수동 동기화·되돌리기도 기존 도구로 다시 쟀다. 마지막 read→setItem 탭 경쟁은 원래 main과 보완 뒤 모두 남는 경계이고 B의 한 탭 작성자 범위다. 운영 실계정·실기기·실제 강제 종료는 미측정이며 P0 조건 전체 충족·저장 안전 완료로 확대하지 않는다.';
for (const c of claims.claims.filter(c => ['C1', 'C2', 'C3', 'C4'].includes(c.id))) {
  if (!c.unverified.note.includes('2026-10-13 보완 차수 작업자 측정')) c.unverified.note += suffix;
}
const newClaims = [
  ['C23', '독립 검토자의 원래 반례를 그대로 재실행한 보완 측정에서 고유 자료 보존 필드는 모두 true로 기록됐다(작업자 측정 기록; 전체 저장 안전의 판정이 아니다)', 'independent.allRetained', true],
  ['C24', '보완의 기존 부품 시험 실패 수가 0으로 기록됐다(작업자 측정 기록)', 'unit.failed', 0],
  ['C25', '보완의 추가 종료·읽기·다음 저장 순서 단언에서 안 지켜진 단언 수가 0으로 기록됐다(작업자 측정 기록; 최종 read→set 경계는 별도 미해결)', 'sequences.assertionsNotHeld', 0],
  ['C26', '고정 VM에서 두 제품 함수를 직접 불렀을 때 서버 요청·화면 자료·렌더 순서가 첫 PR 머리와 같은 것으로 기록됐다(작업자 측정 기록; 실제 서버가 아니다)', 'directCalls.requestStateRenderUnchanged', true]
];
for (const [id, statement, jsonPath, equals] of newClaims) if (!claims.claims.some(c => c.id === id)) claims.claims.push({ id, req: 'R6', kind: 'static', domain: 'config', statement, touches: ['reports/TASK-ES-695/correction-2026-10-13/summary.json'], check: { type: 'jsonPath', file: 'reports/TASK-ES-695/correction-2026-10-13/summary.json', path: jsonPath, equals } });
claims.correction = { iteration: 2, worker: 'Codex p0_builder', grade: '무거움', reason: '유일한 저장 원문·사진·사본의 교체 실패가 자료 손실로 이어진다', requirements: 'docs/specs/REQ-TASK-ES-695-P0-CORRECTION.md', plan: '.claude/plan-TASK-ES-695-P0-CORRECTION.md', report: 'reports/TASK-ES-695/correction-2026-10-13/worker-measurements.md', originalClaimsUnchanged: 'C1-C22 ID/kind/requirements/expectations maintained; notes only supplemented', processEssenceResultOrder: true, newStandard13Fields: 'definition pending from spec owner; semantic evidence linked, no runtime enforcement claimed' };
const x1 = claims.outOfScopeReports.items.find(x => x.id === 'X1');
x1.correction = '첫 구현의 기록은 유지한다. 이번 보완은 목표 칸을 화면에 되붙이지는 않지만, 다음 실행의 직전 사본 교체/삭제 전에 목표 고유 항목·달라진 목표 원문을 보관한다. 서버외 목표 칸이 직전 사본 한 세대 뒤 모두 폐기되는 지적을 보완했다.';
fs.writeFileSync(path.join(root, claimsFile), JSON.stringify(claims, null, 2) + '\n', 'utf8');
const logPath = path.join(root, 'dev_log.md'); let log = fs.readFileSync(logPath, 'utf8');
const entry = '\n- 2026-10-13 TASK-ES-695 보완 차수(Codex): 독립 확인의 stale/용량오류 복구·사본 고유 기록/목표/깨진 원문·복원 둘째 쓰기 실패·읽기 오류·보관 실패 뒤 다음 저장 지적을 local-keep에서 보완했다. syncServerRecords와 migrateGuestDataToUser도 같은 보호 쓰기를 사용한다. 과정→본질→결과 순·무거움 등급·13칸 명세 연결은 보완 REQ/PLAN에 기록했다. 기존 주장·기대값·원시 증거는 유지하고 이번 작업자 측정은 reports/TASK-ES-695/correction-2026-10-13/summary.json·worker-measurements.md이다. 마지막 read→setItem 경합은 원래 main과 보완 모두 미해결(B의 한 탭 작성자 범위)이며 P0 전체 저장 안전으로 일반화하지 않는다. 원래 독립 확인 담당의 새 고정머리 확인과 법정 판정은 root 담당, push/병합은 하지 않음.\n';
if (!log.includes('TASK-ES-695 보완 차수(Codex)')) fs.writeFileSync(logPath, log + entry, 'utf8');
console.log(JSON.stringify({ claims: claimsFile, count: claims.claims.length, existingIdsKindsExpectationsMaintained: true, supplement: claims.correction }));
