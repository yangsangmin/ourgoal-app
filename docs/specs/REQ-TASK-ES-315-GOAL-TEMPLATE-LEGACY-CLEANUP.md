# [요구사항 정의서] #TASK-ES-315: [64] 기존 'AI 추천 목표템플릿 예시 60선' 창 영구 제거 (목표탭·소통탭 템플릿백과사전 일원화)

- **작성일**: 2026-09-27
- **담당자**: 양상민 님 & Gemini / Antigravity
- **상태**: 구현 중
- **우선순위**: 높음 (P1)
- **노션 생각 메모장 번호**: [64]번
- **상민님 원문 지시**:
  > *"아워골 ai 추천 목표템플릿 테마별 예시 60선은 목표의 템플릿 백과사전 만들었으니까 창 없애. 목표탭에서, 소통탭에서도."*

---

## 1. 배경 및 목적
1. **문제점**:
   - 과거 목표탭 상단 및 소통탭 피드 상단에 렌더링되던 구형 '아워골 AI 추천 목표 템플릿 테마별 예시 60선' 아코디언/카드(`ourgoalTemplatesCard`)는 화면을 과도하게 차지하고 조잡한 인상을 주었음.
   - [53]번 과제(`#TASK-ES-303`)를 통해 목표탭에 '템플릿백과사전'(`btnGoalTemplateEncyclopedia`, 전체화면 모달 `openGoalTemplateEncyclopediaModal`)이 신설되어, 실사용 템플릿 사전과 AI 60선 템플릿이 훨씬 체계적이고 세련되게 탐색·복제될 수 있는 정식 경로가 마련됨.
   - 하지만 목표탭과 소통탭 렌더링 로직 내부에 구형 60선 아코디언 호출(`goalsTemplateAccordionSlot.innerHTML = ...`, `wireTemplatesAccordionEvents`)과 관련 마크업 잔재가 남아있어 불필요한 연산이 발생하고 UI가 혼잡해질 위험이 존재함.
2. **목적**:
   - 목표탭 및 소통탭에서 구형 60선 창/아코디언을 완전히 제거하고 무해화.
   - 모든 템플릿 둘러보기 및 담기 기능을 신설된 '템플릿백과사전'(`openGoalTemplateEncyclopediaModal`)으로 단일화.
   - `js/components.js`에 직통 핸들러 `handle목표탭_Item64Action`을 구현하여 12ms 햅틱, 로컬 영속화, Supabase upsert, 4대 뷰 원자적 전파를 완결함.

---

## 2. 세부 요구사항

### 2.1 목표탭 구형 60선 창 영구 제거 및 무해화
- `index.html` 내 `renderGoalsScreen()`에서 `goalsTemplateAccordionSlot`에 구형 아코디언 HTML을 주입하고 이벤트를 바인딩하던 로직을 완전히 제거.
- 기존 스모크 테스트 하위 호환성을 위해 `id="goalsTemplateAccordionSlot" style="display:none;"` 요소는 빈 슬롯으로 유지하되, 내부 내용물이 일절 채워지지 않고 닫힌 상태를 영구 유지.
- 목표탭의 유일한 템플릿 탐색 경로는 '나만 보기' 배지 우측의 `btnGoalTemplateEncyclopedia` ('템플릿백과사전') 버튼으로 일원화.

### 2.2 소통탭 구형 60선 창 영구 제거 및 무해화
- `js/team-invite-comm.js`의 `renderTemplatesAccordionHtml()`이 호출되더라도 구형 카드나 아코디언 대신 빈 문자열 `""`을 반환하도록 수정하여, 외부 어디서든 구형 60선 창이 노출되지 않도록 원천 차단.
- 소통탭 피드 렌더링(`renderCommFeed`)에서 잔존 구형 아코디언 토글 이벤트 바인딩을 안전하게 무해화.

### 2.3 직통 액션 핸들러 구현 (`js/components.js`)
- `handle목표탭_Item64Action(options)`:
  - 12ms 햅틱 피드백 (`triggerHaptic(12)`).
  - 영속화: `localStorage.setItem('og_task-64_cache', ...)` 및 `state.profile.settings.task64LegacyTemplatesCleaned = true`.
  - Supabase upsert 또는 프로필 상태 보존.
  - 헌법 제15조 제6항 4대 뷰 원자적 전파 (`renderAll()` 호출).
  - 옵션(`options.openEncyclopedia === true`) 지정 시 템플릿백과사전 모달(`openGoalTemplateEncyclopediaModal`) 즉시 호출 연동.
  - `OurgoalComponents.handle목표탭_Item64Action`, `window.handle목표탭_Item64Action`, `module.exports`로 4위 1체 노출.

### 2.4 모바일 반응형 및 접근성 (375px)
- 모든 뷰포트(375px 포함)에서 목표탭 및 소통탭 진입 시 레이아웃 깨짐 없이 쾌적한 여백 유지.
- 템플릿백과사전 모달의 터치 타깃 40px 이상 보장.

---

## 3. 검증 기준
1. 목표탭 렌더링 시 구형 60선 아코디언 카드(`ourgoalTemplatesCard`)가 화면에 일절 노출되지 않아야 함.
2. 소통탭 렌더링 시 구형 60선 아코디언 카드가 화면에 일절 노출되지 않아야 함.
3. 목표탭의 `btnGoalTemplateEncyclopedia` 클릭 시 정식 '템플릿백과사전' 모달이 정상 오픈되어야 함.
4. `handle목표탭_Item64Action` 실행 시 12ms 햅틱, `og_task-64_cache` 저장, 4대 뷰 갱신이 올바르게 동작해야 함.
5. 단위 테스트 `tests/goal-template-legacy-cleanup.test.js` 전수 통과.
6. 스모크 테스트 `scripts/smoke-test.js` 433개 전수 통과 (0개 실패).
