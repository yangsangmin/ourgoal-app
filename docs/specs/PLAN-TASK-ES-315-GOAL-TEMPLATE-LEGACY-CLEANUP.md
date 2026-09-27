# [구현 계획서] #TASK-ES-315: [64] 기존 'AI 추천 목표템플릿 예시 60선' 창 영구 제거 (목표탭·소통탭 템플릿백과사전 일원화)

- **작성일**: 2026-09-27
- **담당자**: 양상민 님 & Gemini / Antigravity
- **상태**: 구현 중
- **티켓**: `#TASK-ES-315` (UI/UX 개선 / 목표탭 / P1)

---

## 1. 구현 단계별 세부 계획

### Step 1: 문서 및 티켓 등록
- `docs/specs/REQ-TASK-ES-315-GOAL-TEMPLATE-LEGACY-CLEANUP.md` (완료)
- `docs/specs/PLAN-TASK-ES-315-GOAL-TEMPLATE-LEGACY-CLEANUP.md` (본 문서)
- `docs/rules/TICKETS.md`에 `#TASK-ES-315` [진행중] 등록

### Step 2: 목표탭 및 소통탭 구형 60선 창 영구 제거 (`index.html`, `js/team-invite-comm.js`)
1. `index.html`:
   - `renderGoalsScreen` 내 `goalsTemplateAccordionSlot`의 `innerHTML` 주입 및 이벤트 바인딩 호출 코드를 제거하여, 목표탭 렌더링 시 구형 카드가 생성되지 않도록 함.
   - `goalsTemplateAccordionSlot` 컨테이너 자체는 기존 테스트와의 하위 호환성을 위해 빈 상태(`display:none;`)로 안전하게 보존.
2. `js/team-invite-comm.js`:
   - `renderTemplatesAccordionHtml()`: 빈 문자열 `""`을 반환하여, 외부나 소통탭 어디서 호출되더라도 구형 카드 마크업이 렌더링되지 않도록 원천 차단.
   - `wireTemplatesAccordionEvents()`: 컨테이너 내 토글 버튼이 없으면 안전하게 no-op 리턴.

### Step 3: 직통 핸들러 구현 (`js/components.js`)
- `handle목표탭_Item64Action(options)`:
  - 12ms 햅틱 트리거 (`triggerHaptic(12)`).
  - 로컬 영속화: `localStorage.setItem('og_task-64_cache', JSON.stringify({ cleaned: true, timestamp: Date.now() }))`.
  - 프로필 설정 갱신: `state.profile.settings.task64LegacyTemplatesCleaned = true`.
  - Supabase/로컬 스토리지 동기화 및 4대 메인 뷰 원자적 전파 (`renderAll()`).
  - 템플릿백과사전 모달 호출 옵션(`openEncyclopedia`) 지원.
  - `OurgoalComponents.handle목표탭_Item64Action`, `window.handle목표탭_Item64Action`, `module.exports` 노출.

### Step 4: 단위 테스트 작성 (`tests/goal-template-legacy-cleanup.test.js`)
- 목표탭 및 소통탭에서 구형 60선 카드 미노출 검증.
- 템플릿백과사전 버튼 및 모달 정상 연계 검증.
- `handle목표탭_Item64Action` 직통 핸들러 4위 1체 동작 검증.
- Node 24 read-only global.navigator 안전성 준수 (winMock 사용).

### Step 5: 스모크 테스트 업데이트 (`scripts/smoke-test.js`)
- `#TASK-ES-315` 전용 검증 블록 추가.
- 전체 433개 테스트 전수 통과 (0개 실패) 확인.

### Step 6: 법정 주장서 작성 및 사전 검증 (`reports/TASK-ES-315/claims.json`)
- `node court/claims.js TASK-ES-315` 검증 통과.

### Step 7: 커밋, 푸시, PR 생성 및 GitHub Actions Court 검사 완료 후 머지
- `git commit`, `git push`, `gh pr create`.
- `gh pr checks` 감시 및 `node court/chat.js <PR번호>` 판정서 굵은 네 줄 확인 후 squash 머지.

### Step 8: `TICKETS.md` 완료 갱신 및 3자 동기화 (Tri-Sync)
- TICKETS.md 완료 갱신 PR 생성 및 머지.
- 노션 [64]번 완료 PATCH, 관제센터 저널 append, 옵시디언 동기화, `node C:/dev/command-center/lib/tri-sync.js check` 무결성 검증.
