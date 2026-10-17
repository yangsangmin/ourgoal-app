# REQ-TASK-ES-G01-SANCTUARY-FUSION-4022560a — `G-01` 성소 화면 vs 옛 화면 기능 무손실 뷰 모드 흡수 융합 요구사항 정의서

- **작업 번호**: `#TASK-ES-G01-SANCTUARY-FUSION-4022560a`
- **본질 축**: `E1` (목표·일정 체크인 루프) · `E2` (기록 회고) · `FIX` (이중 렌더링 및 모달 단절 수리)
- **기준 원격 정본**: `origin/main` (`7dc8b7882dac812c7102f7cd73b899f978bbc2e7`, 기준 PR #975 `docs/agents/WORK-REFERENCE.md`)
- **지시 원문 대응 (2026-10-17)**:
  - 상민님 지시 원문: `"결심필요 2건 모두 승인, 헌법 개정 승인"` (`[결심 필요 2]` 선택지 1: 기능 무손실 흡수 융합 — 옛 화면의 전체 컨트롤·모달·서브탭을 유지한 채 성소 화면의 시각 뷰를 각 탭의 뷰 모드 전환/접이식 옵션으로 편입하고 상·하단 중복 노출만 제거).

---

## 1. 1차 문제해결 8원칙 (요구사항 도출)

### 원칙 1. 문제 파악 (현상 및 실측 수치)
- `origin/main` 기준 목표(`#screen-goals`), 일정(`#screen-calendar`), 기록(`#screen-records`) 3개 탭에서는 상단 성소 컨테이너(`#sanctuaryGoalsView`, `#sanctuaryCalendarView`, `#sanctuaryRecordsView`)와 하단 레거시 컨테이너(`#personalGoalsView`, `#calDayDetail`, `#recViewFeed`)가 **동일한 데이터를 한 화면의 위·아래에 중복 렌더링**하고 있다(`G-01`).
- 구체적으로:
  1. **목표 탭 (`goals`)**: 목표가 1개 이상일 때 상단 `#sanctuaryGoalsView`의 `.mountain-trail-card`가 `.mountain-trail-path`(모든 마일스톤·할 일 목록)를 상시 펼쳐서 그리고, 바로 아래 `#personalGoalsView`의 `#goalDetailBody`가 똑같은 마일스톤·할 일 목록을 다시 그려 첫 화면 본문(`#personalGoalsView`) 진입 위치가 `~780px` 아래로 밀린다. 또한 상단 목표 알약(`[data-sgoalid]`) 클릭 시 `engine.activeGoalId`만 바뀌고 하단 `renderGoalsScreen()`이 호출되지 않아 상·하단이 서로 다른 목표를 가리킨다.
  2. **일정 탭 (`calendar`)**: 월간 모드(`.s-month-cal-card`)와 주간 모드(`.s-week-cal-card`)가 카드 내부에 선택 일자 일정 목록(`.s-cal-day-items-list`, `.s-week-day-detail`)을 그리고, 바로 아래 `#calDayDetail`이 똑같은 선택 일자 일정 상세를 한 번 더 그린다. 또한 `openScheduleDetail`(`js/sanctuary-v3-engine.js:694`)에서 선언되지 않은 `found` 변수를 참조(`if (!editEvent) editEvent = found;`)하여 비커스텀 일정 클릭 시 `ReferenceError` 위험이 있다(`C-01`).
  3. **기록 탭 (`records`)**: `📝 실천 타임라인`(`engine.activeRecMode === 'feed'`) 선택 시 상단 `#sanctuaryRecordsView`가 `.s-feed-container`(성소 기록 피드)를 그리고, 동시에 `window.setRecordsSegment('feed')`로 하단 `#recViewFeed`의 `#recTimelineList`(레거시 기록 타임라인)까지 함께 노출되어 같은 기록 목록이 위·아래 2중으로 뜬다. 또한 상단 성소 피드 카드(`.s-feed-item-card`)에는 클릭 시 기록 상세/수정 모달(`openRecordModal`)을 여는 핸들러가 빠져 있다(`R-04`).

### 원칙 2. 본질 · 원인 · 중심 · 핵심
- **본질**: 두 세대의 UI(`OurgoalSanctuaryV3`와 기존 탭 렌더러)가 각자 고유한 가치(성소의 시각적 등반 트레일·포토 달력·3개 요약 페이저 vs 레거시의 정밀 편집·필터·상세 모달)를 갖고 있음에도, 뷰 전환 스위치 없이 무조건 동시 노출되어 화면 공간을 잠식하고 컨텍스트를 분열시키는 것이다.
- **원인**: 성소 엔진 도입 당시 기존 화면과의 뷰 전환 토글(`trailExpanded`, `calInlineDetailExpanded`, `recLegacyFeedExpanded`) 및 선택/모달 동기화 배선 없이 상단 슬롯에 무조건 전체 본문을 덧붙였기 때문이다.
- **중심**: `js/sanctuary-v3-engine.js`, `js/sanctuary-goal-trail.js`, `js/sanctuary-calendar-views.js`, `js/sanctuary-record-feed.js` 4개 성소 엔진 세포 파일.
- **핵심**: `G01-SANCTUARY-VS-LEGACY-MATRIX.md`에서 확인된 양쪽 고유 기능을 **단 하나도 삭제하지 않고(기능 손실 0)**, 기본 상태에서는 상·하단 중복 목록만 접어 단일 뷰로 보여주며, 헤더의 1클릭 뷰 전환 토글(`#btnToggleMountainTrailPath`, `#btnToggleCalInlineDayList`, `#btnToggleWeekInlineDetail`, `#btnToggleRecLegacyTimeline`)로 언제든 즉시 펼치고 접을 수 있게 융합하는 것이다.

### 원칙 3. 해결 방식 (구체적 식별자 및 변경 명세)
1. **목표 탭 (`js/sanctuary-goal-trail.js`, `js/sanctuary-v3-engine.js`)**:
   - `engine.trailExpanded` 상태(기본값 `false`) 및 `window.OurgoalSanctuaryV3.toggleGoalTrail()` 메서드를 추가한다.
   - `.mountain-head` 내 `#sGoalDetailBtn`(`📋 상세 보기`) 옆에 `#btnToggleMountainTrailPath`(`🏔️ 등반 트레일 펼치기 ▾` / `🏔️ 등반 트레일 접기 ▴`) 버튼을 배치하고, `.mountain-trail-path`(`#sanctuaryMountainTrailPath`)는 `engine.trailExpanded`가 `true`일 때만 펼쳐지도록 한다.
   - 상단 목표 알약(`[data-sgoalid]`) 클릭 시 `window.selectGoal(b.dataset.sgoalid)` 또는 `window.renderGoalsScreen()`을 함께 호출해 상·하단 선택 목표를 즉시 일치시킨다.
2. **일정 탭 (`js/sanctuary-calendar-views.js`, `js/sanctuary-v3-engine.js`)**:
   - `engine.calInlineDetailExpanded` 상태(기본값 `false`) 및 `window.OurgoalSanctuaryV3.toggleCalInlineDetail()` 메서드를 추가한다.
   - 월간 카드(`.s-cal-selected-bar`)에 `#btnToggleCalInlineDayList`(`📋 요약 펼치기 ▾` / `📋 요약 접기 ▴`), 주간 카드(`.s-week-day-detail`)에 `#btnToggleWeekInlineDetail` 토글 버튼을 추가하여 기본 상태에서는 하단 `#calDayDetail` 단일 상세 패널만 노출하고, 토글 클릭 시 카드 내 요약 목록(`.s-cal-inline-detail-wrap`, `.s-week-inline-detail-body`)이 펼쳐지게 한다.
   - `openScheduleDetail`(`js/sanctuary-v3-engine.js:688-696`)에서 `var found = dayItems.find(...)`를 명시적으로 조회하여 `ReferenceError`를 차단한다.
3. **기록 탭 (`js/sanctuary-record-feed.js`, `js/sanctuary-v3-engine.js`)**:
   - `engine.recLegacyFeedExpanded` 상태(기본값 `false`) 및 `window.OurgoalSanctuaryV3.toggleRecLegacyFeed()` 메서드를 추가한다.
   - `renderSanctuaryRecordsFeed`의 `.s-feed-header`에 `#btnToggleRecLegacyTimeline`(`🔍 상세 타임라인 펼치기 ▾` / `🔍 상세 타임라인 접기 ▴`) 버튼을 추가하고, `feed` 모드에서 기본 상태(`recLegacyFeedExpanded === false`)일 때는 하단 중복 타임라인 목록(`#recTimelineList`)을 숨기며(`display: 'none'`), 토글 클릭 시 즉시 펼쳐지게 한다.
   - 성소 피드의 모든 `.s-feed-item-card`에 클릭 시 `OurgoalRecordsKit.openRecordModal(r.id)`를 호출하는 핸들러를 배선한다(`R-04` 해소).

### 원칙 4. 재검토 (부작용 및 회귀 가능성 점검)
- **CSS `!important` 은폐 게이트 저촉 여부**: `ui.css`에 새로운 `display: none !important` 규칙을 단 한 줄도 추가하지 않고, JS 상태 토글에 따른 일반 `display:none;`으로만 제어하므로 `verify-integrity-gate.js` 및 `tab-check.js`의 `importantNoneInScope`에 전혀 걸리지 않는다.
- **`DIR-006` 저장 처리 파일 간섭 여부**: 저장 처리 파일(`device-save.js`, `profile-load.js`, `server-records-sync.js`, `record-ledger.js`, `trash-bin.js`, `bind-save.js`, `feedback-bot-setup.js`)은 단 1바이트도 건드리지 않는다.

### 원칙 5. 절차
1. `docs/rules/TICKETS.md`, 본 `REQ`, `.claude/plan-TASK-ES-G01-SANCTUARY-FUSION-4022560a.md` 작성.
2. `js/sanctuary-goal-trail.js`, `js/sanctuary-calendar-views.js`, `js/sanctuary-record-feed.js`, `js/sanctuary-v3-engine.js` 수정.
3. `node scripts/smoke-test.js`, `node scripts/verify-integrity-gate.js`, `node scripts/essence-gate.js`, `node docs/design/harness/tab-check.js` 실행.
4. `reports/TASK-ES-G01-SANCTUARY-FUSION-4022560a/claims.json` 및 `scenarios/g01-sanctuary-fusion.json` 작성 후 로컬 법정 실행기로 `H` 통과 / `B` 실패 검증.
5. 커밋·푸시 후 초안 PR #992 생성 및 `node court/chat.js 992` 판정 확인.

### 원칙 6. 절차 재검증 (반론 격파)
- *반론*: "`smoke-test.js`가 `sanctuary-v3-engine.js`나 `sanctuary-goal-trail.js`의 특정 문자열을 검사하다가 깨지지 않는가?"
- *격파*: 사전 전수 스캔 결과 `smoke-test.js`가 검사하는 문자열(`renderCalDayDetail()`, `openScheduleDetail(`, `s-cal-dots-row`, `engine.activeCalMode === 'week'`, `shiftTimelineDay`, `shiftWeek`, `window.promptNewGoal()`, `setRecMode('heatmap')` 등)을 100% 원형 보존하며, 수정 직후 `node scripts/smoke-test.js`로 실측 확인한다.

### 원칙 7. 단계별 실행
- 작업계획서(`.claude/plan-TASK-ES-G01-SANCTUARY-FUSION-4022560a.md`)의 1~4단계 순서대로 실행한다.

### 원칙 8. 막히는 지점 예상 및 성과 측정
- 법정 시나리오(`g01-sanctuary-fusion.json`)에서 `symptom` 단계(7단계)가 `origin/main`에서도 존재하는 선택자(`#sanctuaryGoalsView .mountain-trail-path`)의 가시성(`notVisible`)을 검사하도록 설계하여, `origin/main`(`B`)에서는 7단계에서 `failKind: 'expect'`로 정확히 실패하고, `HEAD`(`H`)에서는 7단계 통과 후 `#btnToggleMountainTrailPath` 클릭으로 펼침/접힘까지 완벽히 입증되도록 한다.
