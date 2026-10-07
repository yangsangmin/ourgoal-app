# REQ-TASK-ES-597 — 법정 「동작 보존 확인」 경로의 저장소 경로 누락 결함 수리

- 상민님 결심: 2026-10-07 23:36 "금고변경승인" (PR #864 판정 뒤 보고의 권장안 1 — 법정 수리 먼저)
- 분류: INFRA · 금고(court/**) 전용 PR

## 배경
PR #864(TASK-ES-596, A1)는 「동작 보존 확인」 경로를 쓴 첫 PR이다. GitHub 법정 판정 D956DC5D(실행 37635972274)에서 시나리오는 기준 2회·작업 1회 모두 통과했는데도 분열 증명 검증이
`Git diff 실행 실패 … Could not access 'd18d475…'` 로 미달 처리되어 R1 이 「확인 못 함」이 되었다.

원인: `court/claims.js` 의 judgeClaim 이 `verifyCellSplitProof` 를 부를 때 `repoDir` 를 넘기지 않았다. 그래서 `git diff` 가 저장소가 아닌 법정 작업 폴더에서 돌았고(git 의 no-index 모드), 기준 커밋을 찾지 못했다.
기존 자체 점검은 verifyCellSplitProof 를 통째로 가짜로 바꾸고, 실제 판정에 쓰이지 않는 `judgePreserve` 만 시험했기 때문에 이 결함을 잡지 못했다.

## 요구
- R1: judgeClaim 이 분열 증명 검증에 저장소 경로(repoDir)를 넘겨, 진짜 저장소에서 git diff 가 성공한다.
- R2: repoDir 없이 불리면 git 을 엉뚱한 폴더에서 돌리지 않고 "법정 내부 결함"으로 바로 드러낸다.
- R3: 자체 점검이 실제 judgeClaim 경로로 이 결함을 잡는다(수리를 되돌리면 점검이 어긋남으로 바뀐다 — 변이 확인).

## 범위 밖
- 판정 기준·하한·등급 변경 없음. 「동작 보존 확인」의 요건은 그대로다.
