# REQ — #TASK-ES-527 시험지 선행: 인라인 3단계 Z3(알림·시간·주소)·기관(데일리 루틴 상세 창) 이동 전 시험지 읽는 범위 넓히기

- 근거: 헌법 CELL_SPLIT 3(시험지 선행 — 기대값·단언·검사 수를 바꾸지 않고 읽는 범위만 넓힌다), 설계 `docs/architecture/INLINE-STAGE3-DESIGN.md` 6절(Z3 선행 push-subscribe-auth-es400 · 기관 데일리 루틴), 합본 도구 `tests/helpers/inline-bundle.js`(#TASK-ES-441·#TASK-ES-465), 작업참고 `C:/dev/agent-knowledge/WORK-REFERENCE.md` 기준 PR #802(L021).
- 범위: 시험지 2개의 읽는 줄만. 제품 코드 0, 단언·기대값·검사 수 0 변경, retire 0.
- 작업 유형(SNOWBALL): (가) 표준 — L021 시험지 선행(#780 #TASK-ES-489 와 같은 4칸 측정).

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지
Z3 「Web Push」 묶음(`syncPushSubscription`·`removePushSubscription`)을 `js/tabs/settings/web-push.js` 로, 기관 「데일리 루틴 서브탭」 묶음의 `openRoutineDetailModal` 을 `js/tabs/goals/routine-detail-modal.js` 로 옮기면(다음 PR), 시험지 2개가 index.html 글자만 읽어 실패한다(실측: 생성기로 옮긴 사본에서 tests 전부 종료 코드를 기준과 맞댄 결과 이 둘만 새로 실패 — 신고서 없는 세포로 실패하는 module-guard 시험은 이동 PR 이 신고서를 더해 푼다).
- `tests/push-subscribe-auth-es400.test.js` `loadApp` → `extractFn` 이 index.html 에서 두 함수를 잘라 노드 vm 에서 돌린다 → "index.html 에 syncPushSubscription 정의" 단언 실패.
- `tests/core-confirm-es376.test.js` 「기본 확인창은 목표 탭 루틴 삭제 2곳만 남는다」 → `HTML_ROUTINE`(index.html + routine-screen.js)에 둘째 곳이 없어 1곳으로 실패.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 시험지가 "함수가 index.html(또는 정해 둔 한 세포)에 있다"를 가정한다.
- **원인**: 읽는 범위가 이동 전 위치에 묶여 있다.
- **중심**: push 시험은 같은 저장소의 합본(`withInlineCells`)을, 확인창 시험은 #TASK-ES-488 이 쓴 "옮겨 갈 파일만 더한다" 방식 그대로 새 목적지 파일을 더한다.
- **핵심**: 합본은 원문이 맨 앞이고 세포 글자의 `L.` 접두만 뗀다 — 이동 전에는 결과가 기준과 같고, 이동 뒤에는 이전 전 글자 그대로 찾는다.

## 3. [원칙 ③] 해결방식
1. `tests/push-subscribe-auth-es400.test.js` `loadApp` 의 `src` 를 `require('./helpers/inline-bundle').withInlineCells(…)` 로(1줄 + 주석 1줄).
2. `tests/core-confirm-es376.test.js` `HTML_ROUTINE` 에 `ROUTINE_DETAIL_CELL`(js/tabs/goals/routine-detail-modal.js — 있을 때만, `L.` 만 뗌)을 더한다(같은 식 한 벌 + 주석).

## 4. [원칙 ④] 재검토 — 한계
- 확인창 검사를 합본 전체로 넓히지 않았다 — 이미 세포였던 파일의 확인창이 섞이면 기대값이 달라진다(#TASK-ES-488 주석과 같은 이유). 새 목적지 한 파일만 더한다.
- `extractFn` 은 첫 일치를 쓴다 — 원문이 맨 앞이라 이동 전에는 원래 자리, 이동 뒤에는 세포 글자를 찾는다. 이동 PR 의 verify 가 원문에 남은 정의 0 을 잰다.

## 5. [원칙 ⑤] 절차
worktree(origin/main) → 생성기로 옮긴 사본에서 tests 전부 종료 코드 기준 대비(깨지는 시험지 전수) → 시험지 2개 읽는 줄 → `docs/design/harness/module-split/real-move-test-stage3-z3o.js` 4칸 측정 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 "합본이면 시험이 느슨해진다" → 단언 문장·기대값·검사 수 그대로, 세포 글자는 옮긴 원문 글자 그대로다(이동 PR verify 가 토큰 동일을 잰다). 노드에서 실제로 도는 코드가 옮긴 함수 글자라 오히려 이동 뒤 동작을 그대로 잰다.
- 반론 2 "실측 도구(inline-hard-test-probe)가 core-confirm 을 못 잡았다" → 그래서 도구 대신 옮긴 사본에서 tests 전부를 기준과 맞댔다(L021 #780 교훈). 새로 실패한 것은 이 둘과 신고서 시험뿐이다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
`tests/push-subscribe-auth-es400.test.js` `loadApp`·`extractFn`, `tests/core-confirm-es376.test.js` `ROUTINE_CELL`·`ROUTINE_DETAIL_CELL`·`HTML_ROUTINE`, 측정 `docs/design/harness/module-split/real-move-test-stage3-z3o.js`, 결과 `reports/TASK-ES-527/real-move.json`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
`reports/TASK-ES-527/real-move.json`: 두 시험지 모두 새 시험지·기준 제품 = 기준 시험지·기준 제품, 기준 시험지는 이동 제품에서 깨짐, 새 시험지는 이동 제품에서 기준과 같음. 막힐 지점: 다른 구역 빌더가 같은 시험지를 고치면 병합 충돌 — 읽는 줄만 바뀌어 합집합으로 푼다.

[4단계: 심사 청구]
