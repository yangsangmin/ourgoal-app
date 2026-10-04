# 작업계획서 (PLAN) — #TASK-ES-342 홈 점검 하네스 (home-check.js)

> **문서 ID**: PLAN-TASK-ES-342-HOME-CHECK-HARNESS  
> **요구사항 연계**: [REQ-TASK-ES-342-HOME-CHECK-HARNESS](../specs/REQ-TASK-ES-342-HOME-CHECK-HARNESS.md)  
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 HOME-25 (GOALS-01 공용 도구)  
> **작성 일시**: 2026-10-04  

## 1. 변경 범위 (제품 파일 변경 없음)

| 파일 | 변경 |
| :-- | :-- |
| `docs/design/harness/home-check.js` | 신규 (약 290줄, 800줄 상한 이내) |
| `docs/design/harness/out-home-2026-10-04.json` | 신규 요약 결과(약 26KB, PNG 미포함) |
| `docs/specs/REQ-TASK-ES-342-HOME-CHECK-HARNESS.md` | 신규 |
| `docs/plans/PLAN-TASK-ES-342-HOME-CHECK-HARNESS.md` | 신규(이 문서) |
| `reports/TASK-ES-342/claims.json` | 신규 주장 파일 |
| `docs/rules/TICKETS.md` | `#TASK-ES-342` 한 줄 |
| `dev_log.md` | 작업 기록 |

손대지 않는 것: `docs/design/harness/shots.js`·`shots-lib.js`·`audit.js`, `court/**`, 금고 목록 전체.

## 2. 문제해결 8원칙 체크리스트

- [x] 1. 목표 정의: 테마 4 × 뷰포트 2 × 상태(기본·바텀시트·체크인 포커스) 홈 화면을 같은 측정으로 기록하는 도구.
- [x] 2. 현상 분석: `shots.js` 는 `APP_DIR` 고정·390×844 단일, `audit.js` 는 테마·상태 분리 없음.
- [x] 3. 원인 추정: 경로·뷰포트·상태를 인자/정의로 받지 않는 구조.
- [x] 4. 대안 탐색: (A) `shots.js` 수정 — 지시로 금지. (B) `shots-lib.js` 의 `newPage` 재사용 + 새 스크립트 — 채택.
- [x] 5. 실행 계획: `STATES` 표로 탭별 상태 정의, `MEASURE_FN` 단일 측정, `--summary` 로 작은 요약 JSON.
- [x] 6. 절차 재검증 및 반론 격파: REQ 6절(자기 시험 출력은 증거 아님 → 글자 수준 주장만 / 목 환경 한계 → 확인 못 함으로 명시).
- [x] 7. 즉시 실행: 워크트리 대상 24장 실행, 요약 JSON 생성.
- [x] 8. 성과 측정: 요약 JSON 의 장별 수치를 PR 본문에 예비 확인으로 옮김.

## 3. 단계

- [x] [1단계: REQ]
- [x] [2단계: PLAN]
- [x] [3단계: 구현]
- [x] [4단계: 심사 청구]

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
