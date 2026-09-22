# 엔지니어링 작업계획서 (PLAN) — 목표 탭(screen-goals) 토스(Toss)식 UI/UX 전면 혁신

> **문서 ID**: PLAN-TASK-ES-212-GOALS-TOSS-INNOVATION  
> **요구사항 연계**: [REQ-TASK-ES-212-GOALS-TOSS-INNOVATION](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-212-GOALS-TOSS-INNOVATION.md)  
> **티켓 연계**: #TASK-ES-212  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity (Toss Head of UI/UX Pair)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  목표 탭(`screen-goals`) 내 5대 서브탭, 산악 트레일 위젯, 세부 목표 뷰의 이중 분산과 메타 뱃지/2단 필터바의 인지 과부하를 전면 해소하고, "목표 히어로 진행 원카드(`.toss-goal-hero-card`)"와 "1터치 쾌속 퀘스트 보드(`.toss-quest-board`)" 중심으로 화면을 재편하여 12ms 미세 햅틱 피드백과 모던 토스 스타일의 간결한 모바일 경험을 확립한다.
- **영향 받는 파일 목록 전수**:
  - `docs/rules/TICKETS.md`: #TASK-ES-212 티켓 상태 갱신
  - `docs/specs/REQ-TASK-ES-212-GOALS-TOSS-INNOVATION.md`: 요구사항 정의서 (기작성)
  - `docs/specs/PLAN-TASK-ES-212-GOALS-TOSS-INNOVATION.md`: 본 엔지니어링 작업계획서
  - `reports/TASK-ES-212/claims.json`: GitHub 법정 검증 청구서
  - `ui.css`: 토스 목표 전용 스타일 컴포넌트 (`.toss-goal-hero-card`, `.toss-quest-board`, `.toss-ms-row`, 모바일 375px 여백 및 터치 타깃 44px 튜닝)
  - `index.html`: `#screen-goals` 내부 조형 고도화, `renderGoalsScreen()` 내 히어로 원카드 및 12ms 미세 햅틱(`triggerHapticFeedback(12)`) 연동, 38대 헌법 DOM ID 100% 보존
  - `scripts/verify-integrity-gate.js`: 회귀 및 8원칙 린터 정적 검증
  - `dev_log.md`: 개발 로그 기록

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 목표 탭의 기술적 본질은 현재 유저가 도전 중인 핵심 목표 1개를 직관적인 히어로 원카드로 제시하고, 마일스톤과 세부 할 일(`tasks`)을 엄지 터치 한 번으로 즉시 완료 처리(`status: 'done'`)하여 로컬 상태 및 Supabase에 원장화하고, 12ms 햅틱과 함께 홈/기록/통계/캘린더 4대 뷰로 즉각 상태를 동기화하는 **"목표 정복 실행 엔진(E1 Axis)"**이다.
- **[원인] (Technical Causes)**:
  - 5개 서브탭, 산악 트레일 산봉우리 카드, 세부 목표 뷰가 분절적으로 적층되고 7종 메타 배지 및 2단 필터바가 지나치게 많은 화면 공간을 차지하여, 유저의 시선과 엄지 조작이 산만해지고 모바일 사용성이 저하된 것이 기저 원인이다.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.goals`: 현재 활성 목표(`state.activeGoalId`) 추출 및 토스 히어로 원카드 바인딩
  - `state.activeGoalId`: 목표 간 전환 및 게이지/마일스톤 동적 리렌더링
  - `[data-taskcheck]`: 할 일 완료 클릭 시 `triggerHapticFeedback(12)` -> `saveProfile()` -> `renderGoalsScreen()` 및 4대 뷰 동시 전파
  - `[data-mscheck]` / 마일스톤 완료: 상태 순환(`todo` -> `doing` -> `done`) 시 12ms 햅틱 및 진행률 게이지 바 실시간 애니메이션
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 777개 정적 버튼 dead-click 린터 및 38대 헌법 방화벽 셀렉터(`#goalsSubtabs`, `#sanctuaryGoalsView`, `#personalGoalsView`, `#goalAgentCard`, `#goalDetailBody`, `#btnPersonalAddGoalInline`, `#goalEditToggle`, `#goalsPrivacyBadge` 등) 100% 불변 보존.
  - 서브탭 5열 그리드 규격(TASK-ES-195) 100% 준수 (`.goals-subtabs-grid`, `grid-template-columns: repeat(5, 1fr)`).
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[마일스톤/할일 1터치 완료] -> [triggerHapticFeedback(12)] -> [state.profile.goals 업데이트] -> [Supabase DB 원격 동기화] -> [dispatchFullViewPropagation(홈/목표/기록/통계/캘린더)] -> [히어로 게이지 바 및 달성 배지 실시간 점등]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | 토스 목표 히어로 카드 및 퀘스트 보드 스타일링 | +120줄 | 0줄 | +120줄 | CSS 토큰 준수 |
| `index.html` | 목표 히어로 원카드 렌더링 및 12ms 햅틱 배선 | +60줄 | -10줄 | +50줄 | 외과수술적 diff |
| `docs/specs/PLAN-TASK-ES-212-GOALS-TOSS-INNOVATION.md` | 정본 엔지니어링 작업계획서 | +180줄 | 0줄 | +180줄 | 정본 스펙 |
| `reports/TASK-ES-212/claims.json` | 법정 검증 청구서 | +90줄 | 0줄 | +90줄 | 검증 명세 |
| `docs/rules/TICKETS.md` | 티켓 상태 갱신 | +5줄 | -1줄 | +4줄 | 규칙 관리 |

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**:
  - Supabase 테이블(`profiles`, `goals`, `milestones`, `checkins`, `feed_posts`, `app_settings`) DDL 변경 0건 (100% 하위 호환 보장).
- **2호 (스마트 스토리지 분기 설계)**:
  - 목표 및 마일스톤 데이터는 기존 3계층(Supabase DB / IndexedDB / localStorage 메타) 캐시 파이프라인 유지.
- **3호 (4대 뷰 전파 배선도)**:
  - 목표/마일스톤/할 일 상태 갱신 시 `dispatchFullViewPropagation()` 호출을 통해:
    1. `renderGoalsScreen()`: 목표 진행률 원카드 및 마일스톤 실시간 리렌더링
    2. `renderHome()`: 오늘의 원카드 및 당일 퀘스트 목록 즉시 동기화
    3. `renderRecordsScreen()`: 달성 성취 기록 동기화
    4. `renderStatsScreen()`: 히트맵 당일 성취 셀 즉시 점등

### 3-2. 시각적 IA 및 시맨틱 통합 배선도 명세 (헌법 제2조 제6항 준수)
- **1호 (상하 위계 및 서브뷰 공존 설계)**:
  - **[Zone 1: 상단 서브탭 & 헤드라인]**: 5대 서브탭(`.goals-subtabs-grid`) + 문장형 헤드라인 (`#goalsHeadlineSentence`).
  - **[Zone 2: 산악 트레일 산봉우리 카드]**: `#sanctuaryGoalsView` 슬롯 유지.
  - **[Zone 3: 목표 히어로 진행 원카드 (`.toss-goal-hero-card`)]**: 활성 목표 타이틀, D-day 뱃지, 큼직한 퍼센트 숫자, 모던 그라데이션 게이지 바, 정돈된 메타 서브라인.
  - **[Zone 4: 1터치 퀘스트 보드 (`.toss-quest-board`)]**: 마일스톤 리스트 및 세부 할 일 목록 (`#goalDetailBody`), 12ms 미세 햅틱 피드백 연동.
  - **[Zone 5: 슬림 컨트롤 툴바]**: 새 목표 추가, 편집 모드, AI 목표 어시스턴트 접이식 드로어.
- **2호 (기존 기능 슬롯 1:1 이식 매핑표)**:
  - `#goalsSubtabs` ➔ 상단 서브탭 슬롯 100% 보존
  - `#goalsHeadlineSentence` ➔ 문장형 헤드라인 슬롯 100% 보존
  - `#sanctuaryGoalsView` ➔ 산악 트레일 슬롯 100% 보존
  - `#goalAgentCard` ➔ AI 어시스턴트 슬롯 100% 보존
  - `#goalDetailBody` ➔ 마일스톤 및 퀘스트 바디 슬롯 100% 보존

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)

- **비판적 자기 검토 및 약점/한계 인정**:
  - 목표 탭의 마일스톤과 할 일 목록은 이벤트 위임(Event Delegation)으로 촘촘히 묶여 있으므로, 마크업 구조를 무리하게 바꾸면 `data-taskcheck`, `data-msid` 등의 셀렉터가 어긋날 위험이 있음.
  - 따라서 DOM 구조를 파괴하지 않고, 기존 컨테이너에 `.toss-goal-hero-card`를 우아하게 주입하고 마일스톤/할 일 체크 핸들러에 `triggerHapticFeedback(12)`을 외과수술적으로 추가함.
- **기존 기능과의 충돌 가능성 검토**:
  - `verify-integrity-gate.js` 내의 `[검증 19/20] [#TASK-ES-195]` (서브탭 5열 그리드 및 통계 세그먼트 버튼 40px) 린터 통과 보장.
- **엣지 케이스 (Edge Cases)**:
  - **목표가 없는 경우**: `#personalGoalsEmptyGuideSlot`을 통해 토스 스타일 웰컴 가이드 및 원클릭 목표 생성 안내 표출.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

- **구체적 실행 시퀀스**:
  1. **[단계 1 - 계획 및 티켓 동기화]**: `docs/rules/TICKETS.md` 상태 갱신.
  2. **[단계 2 - 법정 검증 청구서 수립]**: `reports/TASK-ES-212/claims.json` 작성 (목표 탭 5대 법정 청구 항목).
  3. **[단계 3 - CSS 토스 목표 토큰 배선]**: `ui.css`에 `.toss-goal-hero-card`, `.toss-quest-board` 등 전용 모던 스타일 추가.
  4. **[단계 4 - 렌더러 리팩토링 및 햅틱 배선]**: `index.html` 내 `renderGoalsScreen()`에 목표 히어로 카드 및 12ms 햅틱(`triggerHapticFeedback(12)`) 연동.
  5. **[단계 5 - 기계적 무결성 전수 검증]**: 335개 테스트, 38개 헌법 게이트, 777개 정적 버튼 dead-click 전수 통과 확인.
  6. **[단계 6 - 로컬 프리뷰 및 보고]**: 로컬 프리뷰 서버(`http://localhost:8888`) 가동 상태 확인 및 상민님께 4-Block 보고.
- **화면 간 상호연동 전파 규격**:
  - 마일스톤/할 일 완료 토글 시 `dispatchFullViewPropagation()` 호출 -> 목표 화면 즉시 리렌더링 및 홈/기록/통계/캘린더 동기화.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

> *(주의: 본 원칙은 절차 정리(⑤)와 단계별 실행(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 타 원칙과 합치는 것은 위헌입니다)*

- **단일 실패점 (SPOF) 점검**:
  - 마일스톤 체크 시 `triggerHapticFeedback` 함수가 브라우저 환경에 따라 미지원될 수 있음.  
  - **대책**: `if(typeof triggerHapticFeedback === 'function') triggerHapticFeedback(12);` 방어 호출 적용.
- **가정의 타당성 검증**:
  - 목표가 1개도 없는 유저의 경우 `goal` 객체가 undefined일 수 있으므로, 히어로 카드는 유효한 목표가 존재할 때만 안전하게 렌더링되도록 방어 코딩.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - 기존 38대 게이트 중 `#TASK-ES-195` 5열 서브탭 린터가 깨지지 않도록 CSS 클래스명을 유지하고 보완 스타일만 추가함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

1. 모든 인터랙티브 버튼 클릭 시 콘솔 에러 0건 (Zero Error).
2. 유저 데이터 무손실 검증(10종 페르소나 딥이퀄) 100% PASS.
3. `npm test` 스모크 335개 및 38개 무결성 게이트 전수 ALL PASS (0 failure).
4. `verify-all-clicks.js` 777개 정적 버튼 Zero Dead-Click 100% 통과.
5. 모바일 375px 뷰포트에서 목표 히어로 원카드 및 퀘스트 보드 시인성 확보.
6. 직관적 6단계 보고 체계 준수.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)

- **예상 블로커 1 (기존 서브탭 그리드 CSS 충돌)**:
  - 린터가 `.goals-subtabs-grid` 내의 `grid-template-columns: repeat(5, 1fr)` 선언을 엄격히 검사함.  
  ➔ **대책**: 해당 CSS 선언을 온전히 유지하며, 새로운 스타일은 추가 클래스로 격리하여 충돌 방지.
- **예상 블로커 2 (할 일 완료 후 리렌더링 시 포커스 튐)**:
  - 리렌더링 후 스크롤 위치가 위로 튀는 현상 방지.  
  ➔ **대책**: 체크박스 클릭 시 스크롤 위치를 보존하거나 가벼운 DOM 토글 활용.
- **재검증 트리거**:
  - 335개 스모크 테스트 또는 38개 무결성 게이트 중 단 1개라도 실패할 경우, 즉시 수정을 중단하고 원칙 ④(재검토)로 회귀하여 셀렉터 정합성을 재검증함.
