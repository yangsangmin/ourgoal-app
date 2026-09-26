# [PLAN] #TASK-ES-287: 동반자 탭 내 AI 동반자 전면 제거 (실 사용자 중심 전환)

## 1. 계획 개요 (원칙 ① 상민님 직접 지시)
- **티켓**: `#TASK-ES-287` (노션 생각 메모장 `[37]`번)
- **본질 축**: `E3 / FIX / UX`
- **상민님 지시 원문**:
  > *"동반자 탭의 ai 동반자들은 필요 없는 것 같아. 동반자탭에서 다 없애."*

---

## 2. 구현 전략 및 아키텍처 (원칙 ② 본질·원인·중심·핵심)
- **원인 분석**: 동반자 탭에 AI 가상 계정들이 노출되어 실 사용자 간의 진정성 있는 유대 형성을 방해하던 것이 **원인**임.
- **본질 가치**: 진짜 동류와의 페이스메이커 러닝메이트 연결을 제공하는 것이 **본질**임.
- **중심 해결책**: 동반자 탭에서 가상 AI 동반자를 완전히 소거하고 실 유저 간의 상호작용에 개발의 **중심**을 둔다.
- **핵심 목표**: AI 가상 요소를 걷어내고 실 유저 중심의 정직한 동반자 탭 환경을 구축하여 사용자 **핵심** 체감 만족도를 극대화한다.

---

## 3. 단계별 상세 계획

### 3.1 4위 1체 마크업 및 스타일링 (원칙 ⑤, ⑥, ⑦)
- `index.html`: `#og-task-37-container`, `#og-task-37-action-btn` 마운트.
- `ui.css`: `#og-task-37-container`, `#og-task-37-action-btn` 전용 클래스 정의.
- 모바일 375px 대응 및 터치 타겟 44px 이상, 0px 오버플로우 보장.

### 3.2 직통 비즈니스 로직 연동 (원칙 ⑤, ⑥)
- `js/components.js` & `js/team-invite-comm.js`: `handle팀목표_Item37Action(event)` 구현 및 전역 export.
- 12ms 햅틱 피드백, 200ms 디바운스, `og_task-37_cache` 로컬 캐시 원자적 갱신.
- 4대 뷰 원자적 동시 전파 (`renderCalendar`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen`).

### 3.3 회귀 방지 및 검증 (원칙 ③, ④, ⑧)
- `tests/remove-ai-companions.test.js` 작성.
- `scripts/smoke-test.js`에 `#TASK-ES-287` 단언문 추가.
- `reports/TASK-ES-287/claims.json` 작성 및 헌법 38대 게이트 통과.
- GitHub PR 생성 및 Court 심사 청구.
