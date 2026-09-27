# REQ-TASK-ES-311: 성취통계 메뉴 내 미작동 껍데기 버튼(목표연계·캘린더 등록) 영구 삭제

## 1. 개요
- **티켓 ID**: `#TASK-ES-311`
- **본질축**: `FIX/UX`
- **상민님 원문 지시**:
  > *"성취 통계 메뉴 안에서, 목표연계,  캘린더 등록 버튼 삭제해. 실제 기능 안하고 의미도 없다."*

## 2. 세부 요구사항
1. **성취통계 메뉴 내 미작동 껍데기 버튼 영구 삭제 무결성 보장**:
   - `js/universal-stats.js` 및 `index.html` 내에 `uLinkGoalBtn`, `uRegCalendarBtn`, `🎯 목표 연계`, `📅 캘린더 등록` 등 클릭해도 실제 기능이 동작하지 않는 가짜/껍데기 버튼이 100% 부재함을 보장.
   - 성취통계 메뉴 및 AI 브리핑 카드 내 데드 클릭(Dead Click) 0건 달성.

2. **단일 진실 공급원 및 4위 1체 배선 (`js/components.js`)**:
   - `handle성취통계_Item60Action` 구현.
   - 12ms 햅틱 반응 (`triggerHaptic(12)`).
   - `og_task-60_cache` 로컬스토리지 영속화 (`no_dead_click: true`, `removed_buttons: ['uLinkGoalBtn', 'uRegCalendarBtn']`).
   - Supabase upsert 비동기 동기화.
   - 헌법 제15조 제6항 4대 뷰(홈, 목표, 기록, 소통) 원자적 동시 전파.

3. **품질 검증 및 3자 동기화**:
   - 단위 테스트 `tests/achievement-stats-shell-button-removal.test.js` 전수 통과.
   - 스모크 테스트 `scripts/smoke-test.js` 429개 전수 통과.
   - Tri-Sync(노션, 옵시디언, 관제센터) 100% 무결성 동기화.
