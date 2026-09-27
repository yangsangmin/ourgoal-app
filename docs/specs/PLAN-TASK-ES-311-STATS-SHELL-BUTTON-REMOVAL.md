# PLAN-TASK-ES-311: 성취통계 메뉴 내 미작동 껍데기 버튼(목표연계·캘린더 등록) 영구 삭제

## 1. 아키텍처 및 구현 설계

### Step 1: 성취통계 메뉴 껍데기 버튼 부재 전수 검증
- `js/universal-stats.js`와 `index.html`에서 `uLinkGoalBtn`, `uRegCalendarBtn`, `🎯 목표 연계`, `📅 캘린더 등록` 요소의 부재를 전수 확인.
- 불필요한 데드 클릭 리스너가 존재하지 않음을 보장.

### Step 2: `js/components.js` 직통 핸들러 및 4대 뷰 동시 전파
- `handle성취통계_Item60Action` 함수 구현:
  ```javascript
  async function handle성취통계_Item60Action(event, customPayload) {
    // 12ms 햅틱, og_task-60_cache 영속화, Supabase upsert, 4대 뷰 원자적 전파
  }
  ```
- `OurgoalComponents`, `window`, `module.exports`에 노출.

### Step 3: 테스트 및 회귀 검증
- `tests/achievement-stats-shell-button-removal.test.js` 작성.
- `scripts/smoke-test.js`에 `#TASK-ES-311` 단언문 추가 및 429개 전수 통과 확인.
- `reports/TASK-ES-311/claims.json` 작성 및 `node court/claims.js` 검증 통과.

### Step 4: 커밋, 푸시, PR 생성 및 GitHub Actions Court 심사, 머지, Tri-Sync 동기화
- Git PR 생성 및 squash 머지.
- TICKETS.md 완료 반영 PR 및 머지.
- 노션 [60]번 완료 PATCH 및 Tri-Sync 100% 무결성 검증.
