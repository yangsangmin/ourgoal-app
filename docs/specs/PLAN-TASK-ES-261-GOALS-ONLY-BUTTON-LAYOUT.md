# 엔지니어링 작업계획서 (PLAN) — 목표탭 ‘목표만’ 버튼 이격 배치 및 하위 마일스톤형 확인 UI

> **문서 ID**: PLAN-TASK-ES-261-GOALS-ONLY-BUTTON-LAYOUT  
> **요구사항 연계**: [REQ-TASK-ES-261-GOALS-ONLY-BUTTON-LAYOUT](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-261-GOALS-ONLY-BUTTON-LAYOUT.md)  
> **티켓 연계**: #TASK-ES-261 (노션 생각 메모장 [04]번, Page ID: `3dc598db-9096-817b-9714-db4fed4e4bd3`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 목표 탭 상단 뷰 토글 옵션 텍스트를 상민님 원문 지정(`기본`, `마일스톤`, `할일`, `목표만`)으로 정돈.
  - 우측 이격 버튼인 '목표만'(`.goals-only-wrap`)의 간격을 상단 상세(`densityBtn`)와 전체접기(`msCollapseAllBtn`)의 간격 규격(`gap: 4px`)과 정확히 일치(`margin-left: 4px` 또는 부모 컨테이너 `gap: 4px`).
  - '목표만'(`goals_only`) 선택 시, 등록된 각 목표 카드 아래에 그에 속한 마일스톤들을 '마일스톤형 카드' 형태로 직관적으로 렌더링 (진척률 %, 상태 배지, 디데이/기간 표시, 빈 마일스톤 시 인라인 추가 안내).
  - 375px 모바일 뷰포트에서 가로 스크롤 없이 44px 터치 높이를 보장하고, 기존 `default`, `milestones_only`, `tasks_only` 기능에 일절 영향이 없도록 무손실 격리.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `msViewToggle` 마크업 및 `goals_only` 뷰 렌더링 로직 정밀화.
  - `ui.css`: `.goals-only-wrap`, `.goal-milestone-overview-card`, `.goal-sub-milestone-item` 4px 이격 마진 및 375px 반응형 스타일.
  - `docs/rules/TICKETS.md`: `#TASK-ES-261` 승인 티켓 등록.
  - `tests/goals-only-view.test.js`: 신규 단위 테스트 스위트 (`const SUITE_TASK = 'TASK-ES-261';`).
  - `scripts/smoke-test.js`: `#TASK-ES-261` 검증 단언문 추가.
  - `reports/TASK-ES-261/claims.json`: GitHub Court 심사 청구서.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 사용자가 설정한 목표와 그에 직결된 하위 마일스톤들의 전체 진척도를 한눈에 마일스톤형 카드로 직관적으로 확인하고 조망할 수 있는 구조적 뷰 제공.
- **[원인] (Technical Causes)**:
  - 뷰 토글 세그먼트 옵션 텍스트가 `기본 뷰`, `마일스톤만`, `할일만`, `🎯 목표별 요약` 등으로 상민님 지시 원문(`기본`, `마일스톤`, `할일`, `목표만`)과 불일치.
  - 우측 이격 배치가 상단 상세-전체접기 간격(`gap: 4px`)과 엄격히 연동되지 않고 제각각 마진으로 적용됨.
  - '목표만' 선택 시 하위 마일스톤을 보여주는 카드가 마일스톤 고유의 시각적 형태(배지, 진척바, 디데이 등)를 충분히 살리지 못함.
- **[중심 배선] (Core Wire & State)**:
  - `gView` 상태값(`default`, `milestones_only`, `tasks_only`, `goals_only`)의 스키마와 이벤트 바인딩(`data-msview`)을 유지하여 100% 호환성 보장.
  - DOM 생성기: `msViewToggle` 내 좌측 세그먼트(`기본`, `마일스톤`, `할일`)와 우측 4px 이격된 `.goals-only-wrap`(`🎯 목표만` 또는 `목표만`) 분리 배선.
  - `gView === 'goals_only'` 일 때 각 목표 카드(`goal-milestone-overview-card`) 하위에 속한 마일스톤들을 `.goal-sub-milestone-item`으로 마일스톤형 카드 렌더링.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존의 목표 완료, 마일스톤 추가/수정/삭제, 세부할일 체크 로직에 부작용 제로 보장.
  - 375px 모바일 뷰포트에서 줄바꿈 없이 4개 토글이 매끄럽게 안착되도록 폰트 크기 및 패딩 미세 조정.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `['목표만' 토글 클릭]` ➔ `[data-msview="goals_only" 감지]` ➔ `[gView = 'goals_only' 갱신]` ➔ `[renderGoalsScreen() 실행]` ➔ `[목표별 카드 및 하위 마일스톤형 카드 렌더링]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 토글 옵션 텍스트 단정화, 4px 이격 클래스 및 하위 마일스톤형 렌더링 보강 | +20줄 | -10줄 | +10줄 | 외과수술적 diff |
| `ui.css` | 4px 이격 간격 규격화 및 마일스톤형 카드 반응형 스타일 | +30줄 | -5줄 | +25줄 | CSS 토큰 준수 |
| `tests/goals-only-view.test.js` | 신규 단위 검증 스위트 신설 | +70줄 | 0줄 | +70줄 | 신규 파일 |
| `scripts/smoke-test.js` | 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 회귀 방지 |
| `docs/rules/TICKETS.md` | 작업 티켓 등록 | +1줄 | 0줄 | +1줄 | 문서 갱신 |

---

## 4. [원칙 ④] 세부 계획 수립 및 헌법 8원칙 준수 (Detailed Planning)
- 승인선 5대 영역(돈, 개인정보, 기능삭제, 바깥행위, 규범변경) 해당 없음.
- 헌법 제3조 제1항 기존 기능 훼손 금지 엄수 (기존 3개 뷰 정상 작동).
- 헌법 제7조 제8항 375px 모바일 시각 규격 준수 (가로 오버플로우 0px, 44px 터치 높이).

---

## 5. [원칙 ⑤] 외과수술적 구현 (Surgical Implementation)
- **마크업**: `index.html` 내 `msViewToggle` 마크업
  - 좌측 세그먼트: `기본`, `마일스톤`, `할일`
  - 우측 이격 컨테이너: `.goals-only-wrap` 내 `목표만` (또는 `🎯 목표만`)
  - 간격: 상단 `densityBtn`과 `msCollapseAllBtn` 간격과 동일한 `4px` (`gap: 4px;` 또는 `margin-left: 4px;`)
- **렌더링**: `goals_only` 선택 시 각 목표 카드 내에 하위 마일스톤 목록을 마일스톤형 카드(`.goal-sub-milestone-item`)로 렌더링.
  - 마일스톤 제목, 상태 배지(진행중/완료), 진척률(%), 일정/디데이 표시 포함.
- **CSS**: `ui.css` 내 `.goals-only-wrap` 및 `.goal-milestone-overview-card`, `.goal-sub-milestone-item` 반응형 정의.

---

## 6. [원칙 ⑥] 재검증 계획 (Re-verification Plan)
- **단위 테스트**: `tests/goals-only-view.test.js` 100% ALL PASS
- **스모크 테스트**: `scripts/smoke-test.js` 379개 이상 ALL PASS
- **헌법 게이트**: `scripts/verify-integrity-gate.js` 38개 전 항목 통과
- **Court 법정 심사**: `reports/TASK-ES-261/claims.json` 작성 및 GitHub Court 합격 판정 획득

---

## 7. [원칙 ⑦] 회귀 결함 방지 (Regression Prevention)
- `gView`의 기존 3가지 뷰(`default`, `milestones_only`, `tasks_only`)의 렌더링 브랜치 및 클릭 핸들러를 온전히 보존.
- 탭 전환(`switchTab`), 목표 추가 모달, 마일스톤 접기/펼치기 기능 동작 일체 불변.

---

## 8. [원칙 ⑧] 법정 심사 청구 명세 (Court Claims)
- 파일: `reports/TASK-ES-261/claims.json`
- Claim 1: 목표 탭 뷰 토글에 '기본', '마일스톤', '할일' 세그먼트와 우측에 분리된 '목표만' 버튼이 렌더링됨
- Claim 2: '목표만' 버튼은 상단 상세-전체접기 간격과 동일한 4px 간격으로 이격 배치됨
- Claim 3: '목표만' 뷰 선택 시 전체 목표 카드 아래에 각 하위 마일스톤이 마일스톤형 카드 형태로 진척도와 함께 렌더링됨
- Claim 4: 375px 모바일 뷰포트에서 msViewToggle 토글이 가로 스크롤이나 넘침 없이 44px 이상 터치 높이로 안정 배치됨
- Claim 5: 기존의 '기본', '마일스톤', '할일' 뷰 전환 동작이 정상 작동하며 회귀 결함이 없음
