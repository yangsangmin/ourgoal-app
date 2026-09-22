# 엔지니어링 작업계획서 (PLAN) — 목표 탭 Phase 1 컨트롤 슬림화 및 스크롤 단축

> **문서 ID**: PLAN-TASK-ES-209-GOALS-UX-PHASE1-CLEANUP  
> **요구사항 연계**: [REQ-TASK-ES-209-GOALS-UX-PHASE1-CLEANUP](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-209-GOALS-UX-PHASE1-CLEANUP.md)  
> **티켓 연계**: #TASK-ES-209  
> **작성 일시**: 2026-09-22  
> **작성자**: Antigravity Omnichannel Session  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 목표 탭 진입 시 12개 이상의 제어 컨트롤 난립과 모바일 375px 긴 스크롤(2.5회 이상)로 인한 인지 과부하를 해소하기 위해, 2단 분산 필터바/뷰토글을 단일 1열 바로 압축하고 AI 어시스턴트 카드 및 여백을 최적화하여 마일스톤 액션 도달 스크롤을 50% 단축한다.
- **영향 받는 파일 목록 전수**:
  - `docs/rules/TICKETS.md`: [수정] #TASK-ES-209 티켓 등록.
  - `docs/specs/REQ-TASK-ES-209-GOALS-UX-PHASE1-CLEANUP.md`: [신설] 요구사항 정의서.
  - `docs/specs/PLAN-TASK-ES-209-GOALS-UX-PHASE1-CLEANUP.md`: [신설] 엔지니어링 작업계획서.
  - `index.html`: [수정] `#goalAgentCard` 마크업 슬림화 및 `msFilterBar` 1열 통합 템플릿 리팩토링.
  - `ui.css`: [수정] 목표 탭 상하 여백 압축 및 `.goals-filter-strip` 콤팩트 스타일링.
  - `dev_log.md`: [수정] 작업 로그 자동 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 기존 비즈니스 로직과 상태 변수(`state.msFilter`, `state.goalViewMode`, `state.msDensity`)를 100% 무손실로 계승하면서, DOM 레이아웃과 CSS 박스 모델만을 콤팩트하게 압축하는 무결성 시맨틱 리팩토링.
- **[원인] (Technical Causes)**: 상하 2단으로 각각 독립 생성된 `.ms-filter-bar`와 `#msViewToggle` 컨테이너로 인해 불필요한 마진과 래퍼가 누적된 구조적 원인.
- **[중심 배선] (Core Wire & State)**:
  - `state.msFilter`: `all | doing | todo | done` 상태 필터링 바인딩.
  - `state.goalViewMode`: `default | goals_only` 뷰 전환 바인딩.
  - `btnPersonalAddGoalInline`: 신규 목표 생성 모달 호출 핸들러.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 린터 및 스모크 테스트의 필수 검증 ID/클래스 100% 보존.
  - 모바일 375px에서 가로 스크롤 오버플로우 방지 (`gap: 4px; overflow-x: auto; flex-wrap: nowrap;`).
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[유저 필터/뷰 탭 클릭] ➔ [state 변수 갱신] ➔ [renderGoalsScreen() 1회 호출] ➔ [슬림 1열 바 active 클래스 즉각 갱신 & 마일스톤 필터링 렌더링]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `docs/rules/TICKETS.md` | #TASK-ES-209 티켓 등록 | +1줄 | 0줄 | +1줄 | 규범 문서 |
| `docs/specs/REQ-*.md` | 1차 8원칙 요구사항 정의서 | +120줄 | 0줄 | +120줄 | 사양 문서 |
| `docs/specs/PLAN-*.md` | 2차 8원칙 엔지니어링 작업계획서 | +130줄 | 0줄 | +130줄 | 사양 문서 |
| `index.html` | `#goalAgentCard` 슬림화 및 `msFilterBar` 1열 통합 | +35줄 | -45줄 | -10줄 | UI 템플릿 |
| `ui.css` | `.goals-filter-strip`, `.goals-agent-slim` 스타일 추가 | +45줄 | 0줄 | +45줄 | CSS 스타일 |
| `dev_log.md` | 개발 로그 갱신 | +20줄 | 0줄 | +20줄 | 감사 로그 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup / Protocol)**: `#msFilterToggle`와 `#msViewToggle`를 감싸는 상위 `.goals-filter-strip` 단일 래퍼 구성.
2. **이벤트 리스너 (Listener / Handler)**: `[data-msfilter]` 및 `[data-msview]` 클릭 이벤트 100% 직결.
3. **비즈니스 로직 (Logic)**: `state.msFilter` 전환 및 마일스톤 필터링, `state.goalViewMode` 전환 완결.
4. **피드백 & 예외처리 (Feedback)**: 클릭 즉시 `active` 클래스 시각 전환 및 0ms 렌더링.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] `#btnPersonalAddGoalInline` 마크업 ID 및 `btnPersonalAddGoalInline` 핸들러가 온전히 보존되는가? (YES)
- [x] `window.promptNewGoal` 등 린터 검증 글로벌 바인딩이 그대로 유지되는가? (YES)
- [x] 기존 목표, 마일스톤, 할 일 데이터가 100% 보존되는가? (YES)
- [x] 4대 테마(성소/블랙/화이트/도심) 전반에서 배경색/글자색 시인성이 보장되는가? (YES)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `ui.css`에 `.goals-filter-strip`, `.goals-agent-slim` 컴팩트 룰셋 정의.
2. **Step 2**: `index.html` 280행 `#goalAgentCard` 마크업을 슬림 인라인 바 구조로 개선.
3. **Step 3**: `index.html` 17950행 `msFilterBar` HTML 생성 로직을 단일 1열 통합 플렉스 바로 리팩토링.
4. **Step 4**: `npm test` 실행하여 38개 무결성 게이트 및 335개 테스트 전수 통과 확인.
5. **Step 5**: `node scripts/verify-all-clicks.js` 실행하여 Zero Dead-Click 100% 확인.
6. **Step 6**: `dev_log.md`에 공식 작업 내역 기록.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (필터 동작 검증)**: '진행' 클릭 시 `doing` 마일스톤만 노출되고 '전체' 클릭 시 전수 노출되는지 확인.
- **시나리오 B (뷰 토글 동작 검증)**: '🎯 목표별 요약' 클릭 시 전체 목표 카드 요약 화면으로 전환되는지 확인.
- **시나리오 C (새 목표 추가 버튼 검증)**: 헤더의 `+ 새 목표`(`#btnPersonalAddGoalInline`) 클릭 시 생성 모달 정상 팝업 확인.
- **시나리오 D (AI 어시스턴트 접힘 검증)**: 헤더 바 클릭 시 드로어가 부드럽게 열리고 닫히는지 확인.
- **시나리오 E (자동화 게이트 통과)**: `scripts/smoke-test.js` 및 `verify-integrity-gate.js` 100% ALL PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~3 코드 수정 완결 (`// ...` 축약 0건)
- [ ] `node scripts/smoke-test.js` 335개 전수 PASS 확인
- [ ] `node scripts/verify-integrity-gate.js` 38개 게이트 ALL PASS 확인
- [ ] `node scripts/verify-all-clicks.js` 데드클릭 0건 확인
- [ ] `dev_log.md` 자동 갱신 및 커밋 완료

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 필터바 DOM 구조 변경 시 `msFilterToggle` 내부 셀렉터가 깨져 이벤트가 누락될 위험.
- **사전 방어 및 우회 로직**: `id="msFilterToggle"` 및 `id="msViewToggle"` ID 컨테이너를 그대로 유지하고 상위 레이아웃만 플렉스로 감싸 이벤트 리스너 셀렉터의 무결성을 100% 보장.
- **롤백 계획 (Rollback Strategy)**: 문제 발생 시 `git checkout .`으로 0초 복구 가능.
- **재검증 트리거**: 단위 테스트 실패 시 즉시 원칙 ①~④로 복귀하여 코드 및 셀렉터 재조정.
