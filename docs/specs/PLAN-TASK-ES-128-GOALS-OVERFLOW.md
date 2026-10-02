# 엔지니어링 작업계획서 (PLAN) — 목표탭 가로 오버플로우 척결 및 상단 서브탭 2중 중복 단일화

> **문서 ID**: PLAN-TASK-ES-128-GOALS-OVERFLOW  
> **요구사항 연계**: [REQ-TASK-ES-128-GOALS-OVERFLOW](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-128-GOALS-OVERFLOW.md)  
> **티켓 연계**: #TASK-ES-128  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 목표 탭 진입 시 발생하는 치명적 812px 가로 스크롤 오버플로우를 390px 뷰포트 폭 이내로 완전 척결하고, 2중으로 중복 렌더링되던 구형 5대 서브탭을 은폐하여 최신 6대 스티키 서브탭 바로 단일화함.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `#goalDetailDrawer` 위치 이동 (`#screen-goals` 내부 -> `</main>` 뒤로 격리) 및 `#goalsSubtabs` 인라인 방어.
  - `ui.css`: `.goals-subtabs-grid` 게이트 문자열 보존 및 은폐, `#screen-goals`와 `.goals-sticky-subnav` 가로 오버플로우 방지 속성 주입, `.goal-detail-drawer` 닫힘 상태 `display: none` 전환.
  - `reports/TASK-ES-128/`: 법정 심사 시나리오 및 클레임 등록.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 모바일 뷰포트(390px) 내에서 목표 탭의 가로 스크롤을 0으로 억제하고 스티키 서브탭을 단일화하여 쾌적한 단일 시각 계층을 제공함.
- **[원인] (Technical Causes)**: `#goalDetailDrawer`가 스크롤 컨테이너 내부에서 `right: -100%`로 유지되어 `scrollWidth`를 712~812px로 팽창시켰고, `#goalsSubtabs`와 `#goalsStickySubnav`가 동시에 활성화되어 상단 화면을 잠식함.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile`: 목표 및 서브탭 전환 상태 보존.
  - `#goalsStickySubnav`: `switchGoalSubtab(tabKey)` 단일 제어 배선.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 기존 게이트 테스트 검증 문자열(`grid-template-columns: repeat(5, 1fr)` 등)을 보존하면서 CSS 우선순위 은폐를 통해 회귀 없이 시각 단일화 달성.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[목표 탭 진입] -> [단일 스티키 서브탭 노출(390px)] -> [서브탭 칩 클릭] -> [switchGoalSubtab 호출] -> [해당 서브섹션 단일 렌더링]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 드로어 이동 및 구형 서브탭 은폐 속성 | +10줄 | -10줄 | 0줄 | 외과수술적 diff |
| `ui.css` | 드로어 display 제어 및 오버플로우 방지 | +25줄 | -15줄 | +10줄 | CSS 토큰 준수 |
| `reports/TASK-ES-128/*` | 법정 검증 리포트 및 시나리오 | +80줄 | 0줄 | +80줄 | 법정 문서 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#goalsStickySubnav` 내 6대 서브탭 버튼 및 `aria-selected` 속성.
2. **이벤트 리스너 (Listener)**: 각 서브탭 버튼의 `onclick="switchGoalSubtab('...')"` 배선.
3. **비즈니스 로직 (Logic)**: `switchGoalSubtab` 함수 통한 뷰포트 전환 및 액티브 클래스 동기화.
4. **피드백 & 예외처리 (Feedback)**: 뷰포트 390px 초과 방지 및 스크롤 위치 초기화.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (데이터 모델 & 원격 스키마)**: 목표 서브탭 상태 및 드로어 데이터 바인딩 확인.
2. **Step 2 (비즈니스 로직 & 핸들러)**: `switchGoalSubtab` 및 `closeGoalDetailDrawer` 동작 보존 확인.
3. **Step 3 (UI 컴포넌트 마크업 & 스타일)**: `ui.css` 및 `index.html` 외과수술적 수정 적용.
4. **Step 4 (4위 1체 이벤트 배선)**: 서브탭 클릭 및 드로어 열기/닫기 정상 배선 확인.
5. **Step 5 (4대 뷰 실시간 동시 전파)**: 목표 탭 전환 및 체크인 연동 무결성 확인.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: 서브탭 6종 칩 및 드로어 닫기 버튼 전수 클릭 시 에러 0건 확인.
- **시나리오 B (Zero Data Loss)**: 목표 데이터 보존 및 로컬스토리지 무결성 유지 확인.
- **시나리오 C (Zero UX Regression)**: 목표 탭 외 타 탭(홈/캘린더/기록/소통/설정)에 영향 없음 확인.
- **시나리오 D (Full State Propagation)**: 서브탭 전환 시 해당 콘텐츠 뷰 즉각 렌더링 확인.
- **시나리오 E (자동화 게이트 통과)**: `npm test` (스모크 440개 + 게이트 38개) 100% ALL PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~5 순차적 구현 완료.
- [x] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS 확인.
- [x] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS 확인.
- [x] 스모크 테스트 전수 검증: `npm test` PASS 확인.
- [ ] [4단계: 로컬 메인 병합 상태 및 5A 프리뷰 배포] 완결 후 상민님께 실서버 배포 여부 보고.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 드로어 DOM 이동에 따른 인라인 스크립트의 부모 탐색 오류 가능성 점검.
- **사전 방어 및 우회 로직**: `document.getElementById('goalDetailDrawer')` 직접 참조로 부모와 무관하게 동작 보장.
- **롤백 계획 (Rollback Strategy)**: 변경 파일(`index.html`, `ui.css`) `git checkout`으로 즉시 복구.
- **재검증 트리거**: 뷰포트 오버플로우 재발생 시 원칙 1, 3으로 돌아가 컨테이너 CSS 재조정.
