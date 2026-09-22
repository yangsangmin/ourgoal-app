# 엔지니어링 작업계획서 (PLAN) — 랜딩/로그인 화면 내 개발 디버그 버튼('🧪 2계정 테스트 빠른 입장') 프로덕션 완전 소거

> **문서 ID**: PLAN-TASK-ES-223-PURGE-DEV-DEBUG-BUTTONS  
> **요구사항 연계**: [REQ-TASK-ES-223-PURGE-DEV-DEBUG-BUTTONS](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-223-PURGE-DEV-DEBUG-BUTTONS.md)  
> **티켓 연계**: #TASK-ES-223  
> **작성 일시**: 2026-09-23  
> **작성자**: 프로덕션 보안 & 무결성 릴리즈 엔지니어  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 랜딩 및 로그인 화면에 노출되던 '🧪 2계정 테스트 빠른 입장' 버튼을 프로덕션 환경에서 완전히 소거하고, `localhost`, `127.0.0.1`, `?debug=true` 개발 환경에서만 조건부 렌더링되도록 격리.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `landTesterBWrap`, `authTesterBWrap` 래퍼 추가, `display:none` 기본값 설정 및 `initDevDebugButtons()` 환경 감지기 배선.
  - `docs/rules/TICKETS.md`: `#TASK-ES-223` 티켓 등록 및 상태 관리.
  - `reports/TASK-ES-223/claims.json`: court 검증 청구서 작성.
  - `scripts/smoke-test.js`: 개발 디버그 버튼 프로덕션 격리 단언문 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 실사용자 접점에서 개발용 디버그 노출을 0건으로 통제하는 릴리즈 게이트키핑.
- **[원인] (Technical Causes)**: 마크업에 무조건 포함되어 있던 정적 디버그 요소에 대한 런타임 환경 감지 로직의 부재.
- **[중심 배선] (Core Wire & State)**:
  - `initDevDebugButtons()`: 도메인 기반 격리 실행기.
  - `location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.search.indexOf('debug=true') !== -1`.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 회귀 테스트 `#TASK-ES-169`의 `landTesterBBtn`, `authTesterBBtn` 보존.
  - Vercel 프로덕션 도메인에서 DOM 트리 완전 제거(`remove()`).
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[페이지 로드] -> [initDevDebugButtons()] -> [isDev? display:block : remove()]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 래퍼 마크업 및 `initDevDebugButtons` 함수 추가 | +25줄 | -2줄 | +23줄 | 외과수술적 격리 |
| `docs/rules/TICKETS.md` | 승인 티켓 대장 #TASK-ES-223 등록 | +2줄 | 0줄 | +2줄 | 티켓 관리 |
| `reports/TASK-ES-223/claims.json` | 법정 청구서 C1~C5 | +70줄 | 0줄 | +70줄 | court 검증 규격 |
| `scripts/smoke-test.js` | 단위 테스트 단언문 | +30줄 | 0줄 | +30줄 | 자동화 검증 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#landTesterBWrap`, `#authTesterBWrap`, `#landTesterBBtn`, `#authTesterBBtn`.
2. **이벤트 리스너 (Listener)**: 클릭 이벤트 및 `enterAsTesterB()` 바인딩 보존.
3. **비즈니스 로직 (Logic)**: `initDevDebugButtons()` 도메인 검사 및 `remove()` 제거.
4. **피드백 & 예외처리 (Feedback)**: 개발 환경에서만 노출, 프로덕션에서는 0건 노출.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 정식 카카오 로그인 및 둘러보기 버튼이 정상 작동하는가? (보증)
- [x] 기존 `compliance: [#TASK-ES-169]` 테스트 단언문이 100% 통과하는가? (보증)
- [x] 783개 이상 정적 버튼 Dead-Click 검사가 100% 통과하는가? (보증)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`index.html`)**: `#landTesterBWrap`, `#authTesterBWrap` 래퍼에 `display:none;` 선언.
2. **Step 2 (`index.html`)**: `initDevDebugButtons()` 함수 구현 및 DOM 준비 시 실행.
3. **Step 3 (`reports/TASK-ES-223/claims.json`)**: C1~C5 청구서 생성.
4. **Step 4 (`scripts/smoke-test.js`)**: 스모크 테스트 추가 및 검증.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 개발 모드에서 버튼 클릭 시 정상 로그인 확인.
- **시나리오 B (Zero Data Loss)**: 기존 사용자 계정 및 세션 영향 0건 확인.
- **시나리오 C (Zero UX Regression)**: 랜딩 3대 정식 동선 정돈 확인.
- **시나리오 D (Full State Propagation)**: 프로덕션 환경 시뮬레이션 시 DOM 제거 확인.
- **시나리오 E (자동화 게이트 통과)**: `npm test`, 38대 게이트, Zero Dead-Click ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~4 외과수술적 구현
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` ALL PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` ALL PASS
- [ ] 스모크 테스트 전수 검증: `npm test` ALL PASS
- [ ] Git commit & push, PR 생성 (Assignee & Reviewer: `yangsangmin`)
- [ ] Notion DB [93] 상태 `완료` 업데이트

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 테스트 환경에서 `location` 미존재로 인한 ReferenceError.
- **사전 방어**: `typeof location !== 'undefined'` 방어 코드 적용.
- **롤백 계획**: `git reset --hard` 즉시 롤백 가능.
- **재검증 트리거**: 테스트 실패 시 Step 1~2 재검증.
