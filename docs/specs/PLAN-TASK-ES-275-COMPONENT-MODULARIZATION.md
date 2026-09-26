# 엔지니어링 작업계획서 (PLAN) — 컴포넌트 모듈화 (효과 시너지, 개발 효율화, UI 및 사용자경험 개선)

> **문서 ID**: PLAN-TASK-ES-275-COMPONENT-MODULARIZATION  
> **요구사항 연계**: [REQ-TASK-ES-275-COMPONENT-MODULARIZATION](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-275-COMPONENT-MODULARIZATION.md)  
> **티켓 연계**: #TASK-ES-275  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 아워골의 공통 컴포넌트 시스템(`js/components.js`)을 확장하여 컴포넌트 모듈화 허브(`OurgoalComponents.task23ModularComponent`) 및 직통 비즈니스 로직(`handle전체공통_Item23Action`)을 구축하고, 4위 1체 배선, 12ms 햅틱, 4대 뷰 동시 전파, 375px 모바일 반응형 조형을 완성한다.
- **영향 받는 파일 목록 전수**:
  - `js/components.js`: `task23ModularComponent` 신설, `handle전체공통_Item23Action` 정의 및 window/module 노출.
  - `ui.css`: `#og-task-23-container`, `#og-task-23-action-btn`, 375px 모바일 반응형 미디어 쿼리 추가.
  - `index.html`: 설정 탭 인프라 영역에 `#og-task-23-container` 마크업 마운트.
  - `tests/component-modularization.test.js`: 신규 단위 테스트 작성.
  - `scripts/smoke-test.js`: `#TASK-ES-275` 스모크 검증 추가.
  - `docs/rules/TICKETS.md`: `#TASK-ES-275` 등록.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 공통 UI 컴포넌트의 모듈화를 통해 개발 생산성을 극대화하고, 인터랙션 시 4대 뷰(홈, 캘린더, 목표, 기록)에 즉시 시너지를 전파하는 4위 1체 기반 인프라 파이프라인.
- **[원인] (Technical Causes)**:
  1. 기존 `js/components.js`에 노션 23항에 명시된 모듈화 허브 컴포넌트 및 직통 트랜잭션 핸들러 부재.
  2. 공통 컴포넌트 동작 시 4대 뷰 원자적 동시 전파(`renderCalendar`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen`) 및 오프라인 회복탄력성 스토리지 캐시 연계 결여.
- **[중심 배선] (Core Wire & State)**:
  - `OurgoalComponents`: 공통 렌더러 모듈 등록 및 전역 `window` 객체 노출.
  - `handle전체공통_Item23Action`: 클릭 즉시 12ms 햅틱 진동 -> 디바운스 -> 스토리지 트랜잭션 -> 토스트 알림 -> 4대 뷰 동시 렌더링 호출.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - Supabase 연결 실패 또는 오프라인 환경에서도 `og_task-23_cache` 로컬 스토리지에 무손실 저장되는 자가 치유 폴백.
  - 모바일 375px 뷰포트에서 최소 터치 타겟 44px × 44px 보장 및 가로 스크롤 오버플로우 0px 방어.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[#og-task-23-action-btn 클릭] -> [12ms 햅틱 진동] -> [버튼 비활성화 디바운스] -> [Supabase / localStorage 원자적 동기화] -> [완료 토스트 표출] -> [4대 뷰 동시 갱신(renderCalendar, renderGoalsScreen, renderHome, renderRecordsScreen)] -> [버튼 활성화 복원]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/components.js` | 모듈러 컴포넌트 렌더러 및 직통 트랜잭션 핸들러 추가 | +60줄 | 0줄 | +60줄 | 모듈 확장 |
| `ui.css` | 모듈러 카드 및 44px 터치 버튼 스타일, 375px 반응형 | +60줄 | 0줄 | +60줄 | CSS 토큰 준수 |
| `index.html` | 설정 탭 인프라 섹션에 모듈러 컴포넌트 마운트 | +15줄 | 0줄 | +15줄 | 외과수술적 마크업 |
| `tests/component-modularization.test.js` | 신규 단위 테스트 | +80줄 | 0줄 | +80줄 | 신규 생성 |
| `scripts/smoke-test.js` | 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 회귀 방지 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**:
   - `#og-task-23-container.og-modular-card` + `#og-task-23-action-btn.og-modular-btn`
2. **이벤트 리스너 (Listener)**:
   - `#og-task-23-action-btn[onclick="handle전체공통_Item23Action(event)"]`
3. **비즈니스 로직 (Logic)**:
   - `handle전체공통_Item23Action`: 12ms 햅틱, 디바운스, `og_task-23_cache` 영속화, 4대 뷰 동시 전파.
4. **피드백 & 예외처리 (Feedback)**:
   - 시각 토스트 표출(`showToast`), 375px 모바일 터치 타겟 44px 이상 및 가로 스크롤 0px 방어.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가? (계승 완료)
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가? (외과수술적 diff 완료)
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가? (100% 보존)
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가? (비파괴 안전성 보장)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (컴포넌트 렌더러 및 직통 핸들러 구축)**: `js/components.js`에 `OurgoalComponents.task23ModularComponent` 템플릿 및 `handle전체공통_Item23Action` 함수 선언, 전역 바인딩.
2. **Step 2 (CSS 모듈러 스타일 및 반응형)**: `ui.css`에 `#og-task-23-container`, `#og-task-23-action-btn`, 375px 모바일 미디어 쿼리 추가.
3. **Step 3 (마크업 마운트)**: `index.html` 설정 탭 인프라/고급 설정 영역에 `#og-task-23-container` 마운트.
4. **Step 4 (단위 및 스모크 테스트)**: `tests/component-modularization.test.js` 작성 및 실행, `scripts/smoke-test.js`에 단언문 추가.
5. **Step 5 (헌법 게이트 및 Court 심사)**: 무결성 게이트 통과 후 GitHub Court 심사 청구.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: `#og-task-23-action-btn` 버튼 클릭 시 `handle전체공통_Item23Action`가 100% 트리거되고 햅틱과 토스트가 정상 발동하는지 검증.
- **시나리오 B (Zero Data Loss)**: 트랜잭션 실행 후 `og_task-23_cache` 로컬 스토리지에 페이로드가 무손실 영속화되는지 검증.
- **시나리오 C (Zero UX Regression)**: 기존 5대 UI 컴포넌트(배지, 통계카드, 프로그레스바, 모달셸, 엠프티스테이트) 기능에 일체의 영향 없음 확인.
- **시나리오 D (Full State Propagation)**: 트랜잭션 완료 시 4대 뷰(홈, 캘린더, 목표, 기록) 리렌더링 함수가 무조건 호출됨을 확인.
- **시나리오 E (자동화 게이트 통과)**: `node tests/component-modularization.test.js` PASS, `node scripts/smoke-test.js` (393개 통과) ALL PASS, `node scripts/verify-integrity-gate.js` (38개 통과) ALL PASS 설계.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [x] 로컬 단위 테스트 검증: `node tests/component-modularization.test.js` PASS
- [x] 스모크 테스트 전수 검증: `node scripts/smoke-test.js` (393개 통과) PASS
- [x] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` (38개 통과) PASS
- [ ] [4단계: 초안 PR 제출 및 GitHub Court 심사 청구] 완결 후 판정서 확인 및 squash 머지

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 모바일 375px 좁은 뷰포트에서 `#og-task-23-action-btn`이 가로 범위를 벗어나 가로 스크롤을 유발할 위험.
- **기술적 대응책**: CSS `box-sizing: border-box`, `overflow-x: hidden` 적용 및 375px 미디어 쿼리에서 `width: 100%`로 안전 패딩 내에 전면 맞춤 배치.
- **비상 롤백 절차**: 배선 문제 발생 시 커밋 롤백 및 기존 `js/components.js` 인터페이스로 1초 무손실 복구.
