# REQ-TASK-ES-598 — 법정 「동작 보존 확인」 재생성 단계의 의존성 누락 결함 수리

- 상민님 결심: 2026-10-07 23:36 "금고변경승인"(법정 수리 먼저 — 권장안 1)의 연장. 병합은 이 PR 판정 뒤 다시 결심을 받는다.
- 분류: INFRA · 금고(court/**) 전용 PR

## 배경
TASK-ES-597(#865)로 git diff 결함을 고친 뒤 PR #864 를 다시 심사했다(판정 F53D61B2, 실행 37639922809). 이번에는 바로 다음 단계에서 막혔다:
`Generator failed: … Error: Cannot find module '@babel/parser'`.

원인: GitHub 법정은 심사 대상 저장소(pr)에 아무것도 설치하지 않는다(court.yml ③-2 — 잣대 쪽 trusted 에만 `npm ci`). 그런데 `court/lib/preserve-source.js` 는 기준 커밋의 생성기를 돌릴 때 심사 대상 쪽 node_modules 만 찾았다.
작업자 PC 재현: node_modules 없는 worktree 를 심사 대상으로 두고 수리 전 법정 코드를 돌리면 같은 오류가 나고, 수리 뒤에는 `ok:true`(index.html·세포 2개 바이트 일치)가 나온다.

## 요구
- R1: 심사 대상 쪽에 node_modules 가 없으면, 생성기가 법정 자신(잣대 쪽 main, main 의 package-lock 으로 설치)의 node_modules 를 NODE_PATH 로 쓴다. PR 이 바꿀 수 있는 의존성은 쓰지 않는다.
- R2: 의존성이 어디에도 없으면 생성기 실패로 정직하게 드러난다(통과로 바뀌지 않는다).
- R3: 자체 점검이 실제 recomputeSplit 으로 이것을 확인한다(수리를 되돌리면 어긋남 — 변이 확인).

## 범위 밖
- 판정 기준·하한·등급 변경 없음.
