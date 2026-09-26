# 엔지니어링 작업계획서 (PLAN) — 홈 및 전 탭 우측 상단 아바타 아이콘 크기 확대 (애정도·시인성 강화)

> **문서 ID**: PLAN-TASK-ES-283-ENLARGE-AVATAR-ICONS  
> **요구사항 연계**: [REQ-TASK-ES-283-ENLARGE-AVATAR-ICONS](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-283-ENLARGE-AVATAR-ICONS.md)  
> **티켓 연계**: #TASK-ES-283  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 홈 탭 레벨 배지 아바타(54px -> 72px) 및 전 탭 상단 탑바 아바타(40px/46px -> 52px/54px) 크기 확대, 주변 UI와의 조형 균형 유지, `handle아바타_Item32Action` 직통 핸들러 배선, 4위 1체 마크업 및 모바일 375px 44px 터치 규격 만족, 4대 뷰 동시 전파 완결.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `levelBadgeHtml` 및 `updateTopAvatar`의 아바타 렌더 크기 확대, `#og-task-32-container` 마운트.
  - `js/avatar.js`: `handle아바타_Item32Action` 직통 핸들러 구현 및 영속화.
  - `ui.css`: 확대된 아바타의 모바일 375px 조형 균형 및 44px 터치 타겟 스타일.
  - `tests/enlarge-avatar-icons.test.js`: 신규 단위 테스트 스위트.
  - `scripts/smoke-test.js`: #TASK-ES-283 스모크 단언문 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 아바타 아이콘 크기 확대를 통한 시각적 효능감과 캐릭터 애착 증대.
- **[원인] (Technical Causes)**: 초기 고정 픽셀(54px, 40px)로 인한 시인성 제약.
- **[중심 배선] (Core Wire & State)**:
  - `handle아바타_Item32Action`: 직통 트랜잭션 핸들러.
  - `og_task-32_cache`: 로컬 캐시 영속화.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 4대 뷰 동시 전파(`dispatchFullViewPropagation`), 12ms 햅틱, 디바운스 버튼 잠금.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[아바타 터치] -> [12ms 햅틱 & 디바운스 락] -> [확대된 아바타 뷰 렌더링] -> [캐시 영속화] -> [4대 뷰 동시 전파]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/avatar.js` | 직통 핸들러 및 영속화 로직 | +80줄 | 0줄 | +80줄 | 모듈화 |
| `index.html` | 아바타 크기 확대 및 마크업 배선 | +20줄 | -4줄 | +16줄 | 외과수술적 |
| `ui.css` | 반응형 스타일 | +70줄 | 0줄 | +70줄 | CSS 토큰 준수 |
| `tests/enlarge-avatar-icons.test.js` | 단위 테스트 | +110줄 | 0줄 | +110줄 | 테스트 신설 |
| `scripts/smoke-test.js` | 스모크 단언문 | +20줄 | 0줄 | +20줄 | 회귀 방지 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#og-task-32-container`, `#og-task-32-action-btn`, `#topAvatar`
2. **이벤트 리스너 (Listener)**: 클릭/터치 이벤트 바인딩
3. **비즈니스 로직 (Logic)**: `handle아바타_Item32Action` 아바타 크기 상태 동기화 및 뷰 전파
4. **피드백 & 예외처리 (Feedback)**: 12ms 햅틱, 토스트 피드백, 4대 뷰 동시 전파

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 320종 아바타 및 유저 커스텀 설정 데이터를 100% 무손실 보존했는가?
- [x] 전체 파일 덮어쓰기 없이 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 필수 DOM ID(`#topAvatar`, `#topUserChip`, `#levelBadgeRow`)가 불변 보존되는가?
- [x] 375px 모바일 뷰포트에서 가로 넘침(0px) 및 터치 영역 44px을 만족하는가?

---

## 5. [원칙 ⑤] 해결 절차 상세화 (Step-by-Step Execution Plan)
1. **Step 1 (JS 구현)**: `js/avatar.js`에 `handle아바타_Item32Action` 정의 및 `window` 바인딩.
2. **Step 2 (HTML 마운트)**: `index.html` 내 아바타 사이즈를 72px 및 52px로 확대하고 `#og-task-32-container` 탑재.
3. **Step 3 (CSS 스타일링)**: `ui.css`에 확대된 아바타 래퍼 및 375px 반응형 스타일 추가.
4. **Step 4 (단위/통합 테스트)**: `tests/enlarge-avatar-icons.test.js` 및 `scripts/smoke-test.js` 단언문 실행.
5. **Step 5 (검증 및 심사 청구)**: claims 검증, PR 발행 및 Court 판정 수신.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 1 (홈 배지 아바타 확대 검증)**: 홈 화면의 아바타가 72px 규격으로 선명하게 렌더링되는지 검증.
- **시나리오 2 (탑바 아바타 확대 검증)**: 모든 탭 상단 탑바의 아바타가 52px/54px 규격으로 정상 표출되는지 검증.
- **시나리오 3 (4위 1체 배선 무결성)**: `#og-task-32-action-btn` 클릭 시 `handle아바타_Item32Action` 실행 및 `og_task-32_cache` 저장 검증.
- **시나리오 4 (4대 뷰 동시 전파)**: 액션 발동 시 4대 뷰 렌더러가 순차/동시 에러 없이 실행되는지 검증.
- **시나리오 5 (모바일 375px 레이아웃)**: 가로 스크롤(0px) 및 최소 44px 터치 크기 만족 여부 확인.

---

## 7. [원칙 ⑦] 단계별 성공 판정 기준 (Verification Gates)
- `node tests/enlarge-avatar-icons.test.js`: ALL PASS.
- `node scripts/smoke-test.js`: 401개 단언문 100% 통과.
- `node scripts/verify-integrity-gate.js`: 38대 게이트 무결점 ALL PASS.
- GitHub Court 검사: PASS (Success).

---

## 8. [원칙 ⑧] 비상 롤백 및 차단선 (Rollback & Defense Line)
- 비정상 동작 발생 시 `git checkout main -- index.html js/avatar.js ui.css`로 안전 원복.
- 로컬 캐시 오염 시 `localStorage.removeItem('og_task-32_cache')`로 자가 복구.
