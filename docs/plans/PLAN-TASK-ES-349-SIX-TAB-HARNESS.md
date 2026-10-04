# 작업계획서 (PLAN) — #TASK-ES-349 6개 탭 공통 실측 도구 (CORE-01)

> **문서 ID**: PLAN-TASK-ES-349-SIX-TAB-HARNESS  
> **요구사항 연계**: [REQ-TASK-ES-349-SIX-TAB-HARNESS](../specs/REQ-TASK-ES-349-SIX-TAB-HARNESS.md)  
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 CORE-01  
> **작성 일시**: 2026-10-04  

## 변경 범위 (제품 파일 변경 없음)

| 파일 | 변경 |
| :-- | :-- |
| `docs/design/harness/tab-check.js` | 신규 — 공통 실측 도구 본체 |
| `docs/design/harness/tab-states.js` | 신규 — 6탭 주요 상태 정의·실제 클릭 진입 |
| `docs/design/harness/tab-deadclick.js` | 신규 — 자동 클릭 Dead-Click 탐지 |
| `docs/design/harness/tab-compare.js` | 신규 — 2회 실행 비교 |
| `docs/design/harness/home-check.js` | 호환 래퍼로 축소(삭제하지 않음, 예전 명령 그대로) |
| `docs/design/harness/README.md` | 신규 — 사용법 |
| `docs/design/harness/out-six-tab-2026-10-04.json` | 신규 — 6탭 요약(PNG 미포함) |
| `docs/design/harness/out-six-tab-2026-10-04-repro.json` | 신규 — 2회 실행 비교 결과 |
| `docs/specs/REQ-TASK-ES-349-SIX-TAB-HARNESS.md`, 이 문서 | 신규 |
| `reports/TASK-ES-349/claims.json` | 신규 주장 파일 |
| `docs/rules/TICKETS.md`, `dev_log.md` | 한 줄 / 작업 기록 |

손대지 않는 것: `shots.js`·`shots-lib.js`·`audit.js`, `court/**`, 금고 목록 전체, 제품 파일.

## 1. 목표 정의

- [x] 탭 × 테마 4 × 뷰포트 2 × 주요 상태를 같은 측정으로 기록하고, 보이는 조작 요소를 자동으로 눌러 Dead-Click 후보를 내는 도구 1개.

## 2. 현상 분석 (본질·원인·중심·핵심)

- [x] 본질: 화면 주장을 측정으로 바꾼다. 원인: 도구가 홈 전용. 중심: `newPage` 재사용. 핵심: 한 측정·한 클릭 절차를 모든 장에 적용.

## 3. 원인 추정

- [x] `home-check.js` 의 `STATES` 가 홈만 정의, Dead-Click 탐지 없음, 장끼리 같은 페이지를 써서 상태가 섞일 수 있음.

## 4. 대안 탐색

- [x] (A) 탭별 도구 6개 — 노션 CORE-01 이 금지(공통 도구 1개). (B) `home-check.js` 를 넓혀 공통 도구로, 홈 파일은 래퍼 — 채택. 800줄 상한을 지키도록 본체·상태·클릭 탐지를 세 파일로 나눔.

## 5. 실행 계획

- [x] `tab-states.js`·`tab-deadclick.js`·`tab-check.js`·`tab-compare.js` 작성, `home-check.js` 래퍼화, 커밋 후 같은 커밋에서 2회 실행.

## 6. 절차 재검증 및 반론 격파

- [x] REQ 6절 — 자기 도구 출력은 증거 아님(글자 수준 주장만) / 되돌릴 수 없는 클릭은 미리 거르고 외부 이름 풀이를 막음.

## 7. 즉시 실행

- [x] 6탭 병렬 실행 A·B, `--merge`·`tab-compare.js` 로 요약·비교 JSON 생성.

## 8. 성과 측정

- [x] 요약 JSON 의 탭별 수치와 비교 결과를 PR 본문에 작업자 주장으로 옮김.

## 단계

- [x] [1단계: REQ]
- [x] [2단계: PLAN]
- [x] [3단계: 구현]
- [x] [4단계: 심사 청구]

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
