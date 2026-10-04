# 작업계획서 (PLAN) — #TASK-ES-354 모듈 분할 공통 틀(CORE-07) + 설정 탭 시범 이전(SET-07)

> **문서 ID**: PLAN-TASK-ES-354-SETTINGS-MODULE  
> **요구사항 연계**: [REQ-TASK-ES-354-SETTINGS-MODULE](../specs/REQ-TASK-ES-354-SETTINGS-MODULE.md)  
> **틀 문서**: [MODULE-SPLIT-PROTOCOL](../specs/MODULE-SPLIT-PROTOCOL.md)  
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 CORE-07 · SET-07  
> **작성 일시**: 2026-10-04  

## 변경 범위

| 파일 | 변경 |
| :-- | :-- |
| `index.html` | 설정 렌더 코드(이전 전 38632~39647줄)·공용 헬퍼 3개 삭제, IIFE 맨 위 가져오기·`OurgoalAppScope.expose`, 원래 자리 호출 2줄, `<script>` 6줄 |
| `js/core/app-scope.js`, `js/core/ui-helpers.js` | 신규 — 공용 통로 / 공용 순수 헬퍼 |
| `js/tabs/settings/render.js`, `sub-notify.js`, `sub-integrations.js`, `sub-data.js` | 신규 |
| `js/tabs/settings/sub-profile.js`, `sub-security.js`, `sub-appearance.js` | 껍데기 → 실제 섹션 렌더 |
| `js/tabs/settings/index.js` | 새 소블록 3개 등록 |
| `scripts/smoke-test.js`, `scripts/verify-all-clicks.js` | 소스 글자를 index.html + 옮긴 파일 합본으로 읽음(기대값 그대로) |
| `docs/design/harness/module-split/*.js` | 신규 — 생성기·글자 검사 2종·설정 조작 비교 |
| `docs/specs/MODULE-SPLIT-PROTOCOL.md`, REQ, 이 문서, `reports/TASK-ES-354/*` | 신규 |
| `docs/rules/TICKETS.md`, `dev_log.md` | 한 줄 / 작업 기록 |

손대지 않는 것: 마크업(HTML)·CSS, `court/**`, 금고 목록 전체(`package.json` scripts 포함).

## 1. 목표 정의

- [x] 설정 탭 렌더 코드를 동작 그대로 `js/tabs/settings/` 책임 단위 파일로 옮기고, 공용 부품 통로를 `js/core/` 에 만들고, 다른 탭에도 쓰는 틀 문서를 남긴다.

## 2. 현상 분석 (본질·원인·중심·핵심)

- [x] 본질: 모듈 구조가 이름뿐. 원인: IIFE 클로저 이름 의존·826줄 함수·전역 노출 부작용. 중심: 인라인 스코프 ↔ 파일 이음매. 핵심: 분석으로 뽑은 이름만 core 통로로, 생성기로 글자 그대로.

## 3. 원인 추정

- [x] 기존 설정 소블록이 부르는 함수가 window 에 없음(껍데기), `components.js` 가 전역 `renderSettingsScreen` 을 찾음, `var isAuto` 중복 선언(섹션을 나누면 바뀜).

## 4. 대안 탐색

- [x] (A) 전역 노출 후 옮기기 — `components.js` 분기가 새로 돌아 동작 변경, 기각. (B) `with`/값 복사 — 엄격 모드·살아 있는 값 문제, 기각. (C) core getter 통로 + 순수 헬퍼 실제 이전 + IIFE 맨 위 가져오기 + 생성기 — 채택.

## 5. 실행 계획

- [x] 기준 2회 → 분석 → 생성 → 글자 검사 → npm test → DOM 비교 → 이후 실행 → tab-compare → 문서 → PR.

## 6. 절차 재검증 및 반론 격파

- [x] REQ 6절 — getter 통로의 `this`·살아 있는 값 / 섹션 분할의 지역 변수 공유 / 전역 없이 같은 이름 호출, 셋 다 분석·토큰 비교로 격파.

## 7. 즉시 실행

- [x] 생성기·검사·측정 실행, 결과 JSON 을 `reports/TASK-ES-354/` 에 남김.

## 8. 성과 측정

- [x] REQ 8절 표(작업자 측정). 판정은 법정.

## 단계

- [x] [1단계: REQ]
- [x] [2단계: PLAN]
- [x] [3단계: 구현]
- [x] [4단계: 심사 청구]

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
