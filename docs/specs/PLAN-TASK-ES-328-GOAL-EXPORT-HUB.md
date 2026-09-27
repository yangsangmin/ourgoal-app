# PLAN-TASK-ES-328: [77] 목표탭 '현 상태로 데이터 받기' 최하단 재배치 및 AI 데이터분석 허브 고도화 실행계획서

## 1. 개요 및 목적
- **목표**: `#goalDetailBody` 내부에 갇혀 있던 목표 데이터 내보내기 카드를 목표 탭 개인 뷰 최하단 `#goalAnalysisHubSlot`으로 독립 재배치하고, 모바일 친화적인 [1초 텍스트 복사]와 프롬프트 백과사전과의 스마트 넛지 연동을 완결한다.

---

## 2. 작업 단계별 실행 계획

### Step 1: 마크업 및 슬롯 신설 (`index.html`)
- `#personalGoalsView` 내부 최하단에 `<div id="goalAnalysisHubSlot" class="goal-analysis-hub-slot"></div>` 신설.
- `renderGoalsScreen()`에서:
  - `body.innerHTML`에서 `exportCardHtml`과 `renderPromptEncyclopediaHtml('goals')` 제거.
  - `#goalAnalysisHubSlot`에 `exportCardHtml`과 `renderPromptEncyclopediaHtml('goals')`을 렌더링.
  - `state.goalEditMode` 활성화 시 슬롯을 `display: none;` 처리.

### Step 2: 모던 카드 UI 및 1초 텍스트 복사 구현 (`index.html`, `ui.css`)
- 라벨을 `🤖 AI 분석용 목표 데이터 내보내기`로 정직화하고, 서브 가이드 문구 보강.
- 신규 버튼 `#goalExportCopyBtn` ("📋 텍스트 복사") 추가:
  - 클릭 시 `goalSnapshotSummary(buildGoalSnapshot(goals))` 문자열을 `navigator.clipboard.writeText`로 복사.
  - 12ms 햅틱 반응 및 *"AI 분석용 데이터가 복사되었어요! 아래 프롬프트와 함께 사용해보세요 ✨"* 토스트 연동.
- `#goalExportBtn` 및 `#goalExportAllBtn` 클릭 시에도 12ms 햅틱과 프롬프트 넛지 토스트 연동.
- `ui.css`: 44px 모바일 터치타겟(`min-height: 44px;`), 모던 카드 스타일링, 반응형 래핑.

### Step 3: 직통 핸들러 배선 (`js/components.js`)
- `handle목표탭_Item77Action` 구현:
  - 12ms 햅틱 반응.
  - `og_task-77_cache` 로컬 영속화.
  - 4대 뷰 원자적 전파.
  - 3자 노출(`OurgoalComponents`, `window`, `module.exports`).

### Step 4: 검증 및 법정 심사
- 단위 테스트 `tests/goal-export-hub.test.js` 작성.
- `scripts/verify-all-clicks.js` 893+ 버튼 전수 통과 확인.
- `scripts/smoke-test.js` 440+ 테스트 전수 통과 확인.
- CDP 375px 모바일 실측 스크린샷 캡처 및 아티팩트 보관.
- `reports/TASK-ES-328/claims.json` 작성 및 정적/동작 심사 청구.
