# 실행계획서 (PLAN) — 팀 목표 탭 최초 진입 시 접을 수 있는 모든 아코디언 요소 기본 접힘 처리

> **문서 ID**: PLAN-TASK-ES-302-TEAM-GOALS-COLLAPSE-DEFAULT  
> **티켓 연계**: #TASK-ES-302  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. 개요 및 목적
- **목적**: 노션 생각 메모장 DB [52]번 지시사항에 따라, 팀 목표 탭 진입 시 사용자가 마주하는 정보 피로도를 해소하기 위해 마일스톤, 세부 할 일, 댓글/대화, 수준별 관리 아코디언 등 접을 수 있는 모든 요소를 최초 진입 시 기본 접힘(Collapsed) 상태로 완결한다.
- **적용 대상**: `index.html`, `js/team-visibility-levels.js`, `js/components.js`, `ui.css`, `tests/team-goals-collapse-default.test.js`, `scripts/smoke-test.js`

---

## 2. 세부 실행 계획

### Step 1: `index.html` & `js/team-visibility-levels.js` 수정
1. 홈 화면 기능 카드 영역에 `#og-task-52-container` 및 `#og-task-52-action-btn` 마운트.
2. `renderTeamGoalsScreen` 진입 시 `collapseAllTeamGoalAccordions()` 호출 연결.
3. `window.collapseAllTeamGoalAccordions = collapseAllTeamGoalAccordions` 전역 헬퍼 노출:
   - 화면 내 존재하는 `.ms-list`, `.tg-subtask-box`, `.tg-ms-comments-content`, `.tg-goal-comments-content`, `.tg-accordion-body`, `.tg-lg-row-body` 요소를 일괄 `display: none`으로 초기화.
   - 아코디언 화살표 및 접기/펼치기 버튼 텍스트 정돈.
4. `js/team-visibility-levels.js`:
   - 마일스톤 목록(`data-tgmslist`), 수준별 아코디언(`data-tglevelbody`), 조별 아코디언(`data-tglgbody`) 기본 접힘 보장.

### Step 2: `js/components.js` 4위 1체 배선
1. `handle팀목표_Item52Action(event)` 작성:
   - 12ms 햅틱 진동 피드백 (`navigator.vibrate(12)`).
   - `og_task-52_cache` 로컬 캐시 원자적 갱신 및 Supabase `user_interactions` 동기화.
   - 시각 토스트 피드백 ('팀 목표 탭 최초 진입 시 접을 수 있는 모든 아코디언 요소 기본 접힘 처리가 완료되었습니다.').
   - 헌법 제15조 제6항 4대 뷰 원자적 동시 전파.
2. `collapseAllTeamGoalAccordions`, `toggleTeamGoalAccordionCollapse` 헬퍼 함수 정의 및 export.

### Step 3: `ui.css` 스타일 및 모바일 반응형
1. `#og-task-52-container`, `#og-task-52-action-btn` 스타일 추가.
2. 최소 44px 터치 규격 및 375px 반응형 최적화.

### Step 4: 검증 테스트 및 스모크 테스트 연동
1. `tests/team-goals-collapse-default.test.js` 작성 및 통과 확인.
2. `scripts/smoke-test.js`에 `TASK-ES-302` 단언문 추가 및 420개 전수 통과 확인.

### Step 5: Court 주장 파일 작성 및 GitHub 심사
1. `reports/TASK-ES-302/claims.json` 작성.
2. 커밋 및 `npm run court:quick -- --head HEAD` 예비 점검.
3. 원격 푸시 및 PR 생성 후 GitHub Court 판정 확인.
4. Squash 머지 후 TICKETS.md 완료 갱신 PR 머지, 노션 상태 완료, 저널 기록, Tri-Sync 무결성 검증.
