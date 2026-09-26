# 엔지니어링 작업계획서 (PLAN) — 전 탭 상위 중복 '홈구성' 버튼 제거 및 '나만의 홈 구성' 단일화

> **문서 ID**: PLAN-TASK-ES-282-REMOVE-DUPLICATE-HOME-LAYOUT-BUTTON  
> **요구사항 연계**: [REQ-TASK-ES-282-REMOVE-DUPLICATE-HOME-LAYOUT-BUTTON](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-282-REMOVE-DUPLICATE-HOME-LAYOUT-BUTTON.md)  
> **티켓 연계**: #TASK-ES-282  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 상위 탑바 내 중복 `⚙️ 홈구성` 버튼(`#topHomeLayoutBtn`, `#topbarActions`) 완전 소거, 홈 화면 본문 `#btnCustomHomeLayout` 단일 정통 진입점 확립, `handle홈_Item31Action` 직통 핸들러 배선, 4위 1체 마크업 및 모바일 375px 44px 터치 규격 만족, 4대 뷰 동시 전파 완결.
- **영향 받는 파일 목록 전수**:
  - `index.html`: 상단 바 중복 버튼 소거 및 홈 화면 내 `#og-task-31-container` 마크업 마운트.
  - `js/customize.js`: `handle홈_Item31Action` 직통 핸들러 구현 및 영속화.
  - `ui.css`: 모바일 375px 44px 터치 규격 및 상위 중복 버튼 소거 CSS 규칙 탑재.
  - `tests/remove-duplicate-home-layout-button.test.js`: 신규 단위 테스트 스위트.
  - `scripts/smoke-test.js`: #TASK-ES-282 스모크 단언문 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 전 탭 상위 탑바 시인성 확보 및 홈 구성 커스텀 진입점의 100% 무결한 단일화.
- **[원인] (Technical Causes)**: 상단 바와 본문 헤더 간 중복 버튼 배치로 인한 시각적 소음 및 인터랙션 중복.
- **[중심 배선] (Core Wire & State)**:
  - `handle홈_Item31Action`: 직통 트랜잭션 핸들러.
  - `og_task-31_cache`: 로컬 캐시 영속화.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 4대 뷰 동시 전파(`dispatchFullViewPropagation`), 12ms 햅틱, 디바운스 버튼 잠금.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[나만의 홈 구성 탭] -> [12ms 햅틱 & 디바운스 락] -> [openHomeCustomizer 안전 호출] -> [캐시 영속화] -> [4대 뷰 동시 전파]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/customize.js` | 직통 핸들러 및 영속화 로직 | +80줄 | 0줄 | +80줄 | 모듈화 |
| `index.html` | 중복 버튼 소거 및 4위 1체 마크업 배선 | +15줄 | -2줄 | +13줄 | 외과수술적 |
| `ui.css` | 반응형 스타일 및 중복 소거 규칙 | +70줄 | 0줄 | +70줄 | CSS 토큰 준수 |
| `tests/remove-duplicate-home-layout-button.test.js` | 단위 테스트 | +110줄 | 0줄 | +110줄 | 테스트 신설 |
| `scripts/smoke-test.js` | 스모크 단언문 | +20줄 | 0줄 | +20줄 | 회귀 방지 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#og-task-31-container`, `#og-task-31-action-btn`, `#btnCustomHomeLayout`
2. **이벤트 리스너 (Listener)**: 클릭/터치 이벤트 바인딩
3. **비즈니스 로직 (Logic)**: `handle홈_Item31Action` 실제 홈 구성 커스텀 연동 및 뷰 동기화
4. **피드백 & 예외처리 (Feedback)**: 12ms 햅틱, 토스트 피드백, 4대 뷰 동시 전파

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 홈 위젯 구성 및 순서 설정 데이터를 100% 무손실 보존했는가?
- [x] 전체 파일 덮어쓰기 없이 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 본문 필수 DOM ID(`#btnCustomHomeLayout`)가 불변 보존되는가?
- [x] 375px 모바일 뷰포트에서 가로 넘침(0px) 및 터치 영역 44px을 만족하는가?

---

## 5. [원칙 ⑤] 해결 절차 상세화 (Step-by-Step Execution Plan)
1. **Step 1 (JS 구현)**: `js/customize.js`에 `handle홈_Item31Action` 정의 및 `window` 바인딩.
2. **Step 2 (HTML 마운트)**: `index.html` 상위 탑바의 `#topHomeLayoutBtn` 소거/숨김 및 홈 탭 내 `#og-task-31-container` 탑재.
3. **Step 3 (CSS 스타일링)**: `ui.css`에 상단 중복 버튼 소거 및 44px 터치 규격 모바일 스타일 추가.
4. **Step 4 (단위/통합 테스트)**: `tests/remove-duplicate-home-layout-button.test.js` 및 `scripts/smoke-test.js` 단언문 실행.
5. **Step 5 (검증 및 심사 청구)**: claims 검증, PR 발행 및 Court 판정 수신.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 1 (상위 중복 버튼 소거)**: 상위 탑바에서 `topHomeLayoutBtn`이 완전 제거/은폐되어 보이지 않음을 검증.
- **시나리오 2 (본문 나만의 홈 구성 정상 동작)**: `#btnCustomHomeLayout` 터치 시 12ms 햅틱과 함께 커스텀 모달 오픈 검증.
- **시나리오 3 (4위 1체 배선 무결성)**: `#og-task-31-action-btn` 클릭 시 `handle홈_Item31Action` 실행 및 `og_task-31_cache` 저장 검증.
- **시나리오 4 (4대 뷰 동시 전파)**: 액션 발동 시 4대 뷰 렌더러가 순차/동시 에러 없이 실행되는지 검증.
- **시나리오 5 (모바일 375px 레이아웃)**: 가로 스크롤(0px) 및 최소 44px 터치 크기 만족 여부 확인.

---

## 7. [원칙 ⑦] 단계별 성공 판정 기준 (Verification Gates)
- `node tests/remove-duplicate-home-layout-button.test.js`: ALL PASS.
- `node scripts/smoke-test.js`: 400개 단언문 100% 통과.
- `node scripts/verify-integrity-gate.js`: 38대 게이트 무결점 ALL PASS.
- GitHub Court 검사: PASS (Success).

---

## 8. [원칙 ⑧] 비상 롤백 및 차단선 (Rollback & Defense Line)
- 비정상 동작 발생 시 `git checkout main -- index.html js/customize.js ui.css`로 안전 원복.
- 로컬 캐시 오염 시 `localStorage.removeItem('og_task-31_cache')`로 자가 복구.
