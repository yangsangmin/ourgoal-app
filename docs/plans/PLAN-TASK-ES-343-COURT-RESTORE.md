# 구현 계획서 (PLAN) — #TASK-ES-343 법정(court) 복원 + 변경분 한정 정적 검사 이식

> **문서 ID**: PLAN-TASK-ES-343-COURT-RESTORE  
> **요구사항**: `docs/specs/REQ-TASK-ES-343-COURT-RESTORE.md`  
> **작업 일시**: 2026-10-04  
> **브랜치**: `feat/2026-10-04-task-es-343-court-restore`

## 문제해결 8원칙 체크리스트

- [x] 1. 목표 정의: PR 이 새로 만든 위반만 돌려보내고, 판사 분리(main 의 court/ · 읽기 권한 · 시크릿 없음)를 되살린다.
- [x] 2. 현상 분석: v4 법정에서 #651·#652 모두 REJECTED(기존 800줄 초과 파일 12개 등), 판정 댓글 403.
- [x] 3. 원인 추정: REQ 2절 ①~⑤(전체 스캔·가짜 Level 5·pull_request+관리자 키·주장 경로·권한 없는 댓글).
- [x] 4. 대안 탐색: (A) v4 엔진 수리 — 판사 분리·시크릿 문제가 워크플로 구조에 있어 수리 범위가 크다. (B) 예전 법정 복원 + 정적 검사만 변경분 한정으로 이식 — 예전 법정의 격리·자가시험·판정 게시가 그대로 산다. **B 선택.**
- [x] 5. 실행 계획: ① `git show a18f22e^:.github/workflows/court.yml` 로 복원 ② `court/lib/new-debt.js` 작성 ③ `court/judge.js` 2) 추가된 줄 검사 뒤에 호출 ④ 자가시험 `court/selftest/unit-new-debt.js` 추가·등록 ⑤ README ⑥ 측정 ⑦ 문서·PR.
- [x] 6. 절차 재검증 및 반론 격파: REQ 6절(기존 부채 방치 반론, 파일 이동 반론). 추가: `court/judge.js` 는 703줄로 800줄 상한 안 — 검사 본체는 새 소블록 파일로 분리했다.
- [x] 7. 즉시 실행: 위 ①~⑦ 실행.
- [x] 8. 성과 측정: `node court/selftest/run.js --unit-only` 결과, 새 검사 3경우 실측(PR 본문·dev_log 에 출력 인용).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.

## 단계

- [x] [1단계: REQ]
- [x] [2단계: PLAN]
- [x] [3단계: 코드]
- [x] [4단계: 심사 청구] — PR 생성. 이 PR 은 현재 main 의 v4 설정으로 심사되므로 REJECTED 가 날 수 있으며, 우회하지 않고 결과를 기록한다.
