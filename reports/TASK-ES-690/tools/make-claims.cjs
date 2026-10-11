#!/usr/bin/env node
'use strict';
// #TASK-ES-690 — 주장 파일(claims.json)을 만든다. 숫자가 든 주장은 대장에서 만든 문장(numbers.cjs)을 그대로 쓴다.
// 사용: node reports/TASK-ES-690/tools/make-claims.cjs
const fs = require('fs'), path = require('path');
const { F } = require('./numbers.cjs');
const DIR = path.resolve(__dirname, '..');
const A = 'docs/directives/ACTIVE.md';
const has = (id, req, statement, file, text) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [file], check: { type: 'codeContains', file, text } });
const not = (id, req, statement, file, text) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [file], check: { type: 'codeNotContains', file, text } });
const claims = [
  has('C1', 'R1', '열린 지시 칸이 비어 있다', A, '(열린 지시 없음)'),
  has('C2', 'R1', 'DIR-003 이 완료된 지시에 종결로 적혀 있다', A, '### DIR-003 — 미분화 덩어리 해체 B 트랙 착수 (종결)'),
  has('C3', 'R1', 'DIR-004 가 완료된 지시에 종결로 적혀 있다', A, '### DIR-004 — 미분화 덩어리 해체 범위 확대 (종결)'),
  has('C4', 'R2', '지시함의 덩어리 줄 수 문장이 대장에서 만든 문장과 같다', A, F.lump),
  has('C5', 'R2', '지시함의 공식 지표 문장이 대장에서 만든 문장과 같다', A, F.inline),
  has('C6', 'R2', '지시함의 판정 집계 문장이 대장에서 만든 문장과 같다', A, F.verdicts),
  has('C7', 'R2', '병합 PR 대장이 있다', 'reports/TASK-ES-690/pr-ledger.md', '# DIR-003·DIR-004 구간의 병합 PR 대장'),
  has('C8', 'R3', '남은 인라인이 지시와 다른 점을 적었다', A, '**남은 인라인이 지시와 다르다.**'),
  has('C9', 'R3', '완료 기준 (2)와 다른 판정을 적었다', A, F.removedNotPassed),
  has('C10', 'R3', '줄 수가 늘어난 PR 을 적었다', A, F.grew),
  has('C11', 'R3', '병합하지 않고 닫은 PR 을 적었다', A, '**병합하지 않고 닫은 PR 이 있다.** PR #959'),
  has('C12', 'R3', '법정 도구 결함을 비켜 간 것을 적었다', A, '**법정 도구의 결함 하나를 고치지 않고 비켜 갔다.**'),
  has('C13', 'R3', '동시에 열린 index.html PR 을 적었다', A, F.overlaps),
  has('C14', 'R4', '작성자가 채팅을 보지 못했다는 점을 적었다', A, '이 기록의 작성자는 채팅을 직접 보지 못했다.'),
  has('C15', 'R4', '결심 원문 「p안 승인」을 날짜와 함께 적었다', A, '2026-10-12 「p안 승인」'),
  has('C16', 'R4', '결심 원문 「권장대로 모두 진행」을 날짜와 함께 적었다', A, '2026-10-11 「권장대로 모두 진행」'),
  has('C24', 'R4', '배포 한도 때의 결심 원문을 날짜와 함께 적었다', A, '2026-10-11 「기본값으로 진행하고 병합 계속 진행하고, 배포만 안되는 상황인거잖아?'),
  not('C17', 'R5', '결심 대기 표에 arguments 조항 줄이 없다(풀림)', A, '| saveGoogleToken 의 arguments — 헌법 CELL_SPLIT 5호'),
  not('C18', 'R5', '결심 대기 표에 시험 변경 줄이 없다(풀림)', A, '| 옛 연결선 글자(window.X = X; 등)를 단언하는 시험의 기대값·단언 변경'),
  not('C19', 'R5', '결심 대기 표에 OURGOAL_CONFIG 줄이 없다(풀림)', A, '| OURGOAL_CONFIG(빈 설정 객체 선언과 window 복사 줄'),
  has('C20', 'R5', '풀린 것을 완료 기록에 주소와 함께 적었다', A, '- **결심 대기에서 풀린 것**:'),
  has('C21', 'R5', '결심 대기 표의 다른 줄은 그대로다', A, '| Google Play 개발자 계정 등록($25 결제·신분 확인) | 돈 |'),
  not('C22', 'R2', '채우지 않은 자리표가 지시함에 남아 있지 않다', A, '【'),
  has('C23', 'R1', '티켓 대장에 ES-690 한 줄이 있다', 'docs/rules/TICKETS.md', '- #TASK-ES-690 | INFRA | 지시함 DIR-003·DIR-004 완료 기록'),
];
const out = {
  task: 'TASK-ES-690', requirementsSource: 'docs/specs/REQ-TASK-ES-690-DIR-003-004-DONE.md',
  requirements: [
    { id: 'R1', text: 'DIR-003 · DIR-004 를 「열린 지시」에서 「완료된 지시」로 옮긴다(선례 형식 — 결과 · 근거 주소).' },
    { id: 'R2', text: '완료 기준 대비 측정을 붙인다. 숫자 · 판정 글자 · 판정번호 · 주소는 손으로 옮기지 않고 스크립트로 뽑는다.' },
    { id: 'R3', text: '지시와 달라진 것을 숨기지 않고 적는다.' },
    { id: 'R4', text: '결심 기록에서 빠진 원문을 더한다(날짜 · 무엇을 여쭈었는지). 작성자가 채팅을 보지 못했다는 점을 적는다.' },
    { id: 'R5', text: '「결심 대기」 표에서 풀린 세 줄(arguments 조항 · 시험 변경 · OURGOAL_CONFIG)을 결과와 PR 주소를 붙여 닫는다.' },
  ],
  outOfScopeReports: [
    { text: '새로 남는 결심 대기 줄을 표에 올리는 일은 이 PR 에 없다. 따로 낸 PR(#TASK-ES-691)에 있다 — 사전 승인(완료기록 병합)의 범위를 넘는다고 보아 갈랐다.', cannotBecause: 'out-of-scope-feature' },
    { text: '각 PR 의 작업자 측정(접두만 다른 줄 수 · 지운 단언 0 등)은 다시 재지 않고 그 PR 의 기록을 가리켰다. 상민님과의 채팅은 작성자가 보지 못했다.', cannotBecause: 'out-of-scope-feature' },
  ],
  claims,
};
fs.writeFileSync(path.join(DIR, 'claims.json'), JSON.stringify(out, null, 2) + '\n', { encoding: 'utf8' });
// 스스로 확인: 지금 파일들에 대해 주장이 참인가
const root = path.resolve(DIR, '..', '..'); const bad = [];
for (const c of claims) { const s = fs.readFileSync(path.join(root, c.check.file), 'utf8'); const hit = s.includes(c.check.text); if ((c.check.type === 'codeContains') !== hit) bad.push(c.id); }
console.log(JSON.stringify({ claims: claims.length, notTrueNow: bad }));
