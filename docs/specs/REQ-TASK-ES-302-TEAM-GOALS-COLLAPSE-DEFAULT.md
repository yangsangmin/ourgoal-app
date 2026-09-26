# 요구사항 정의서 (REQ) — 팀 목표 탭 최초 진입 시 접을 수 있는 모든 아코디언 요소 기본 접힘 처리

> **문서 ID**: REQ-TASK-ES-302-TEAM-GOALS-COLLAPSE-DEFAULT  
> **티켓 연계**: #TASK-ES-302  
> **지시 출처**: 노션 생각 메모장 DB [52]번  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. 배경 및 목적

- **사용자 원문 지시**: "팀 목표에서 접을 수 있는 것들은 최초에 모두 접혀있어야 함. 들어가자 마자 피곤함이 심해."
- **문제점**: 팀 목표 탭 진입 시 마일스톤 상세 목록, 세부 할 일, 수준별 관리 아코디언, 팀 대화/댓글 등이 펼쳐져 있거나 시각적으로 과밀하게 노출될 경우 사용자의 정보 인지 피로도가 급격히 상승함.
- **해결 방안**:
  1. 팀 목표 탭(`renderTeamGoalsScreen`) 최초 진입 시 마일스톤 목록(`.ms-list`), 세부 할 일 박스(`.tg-subtask-box`), 팀 댓글(`.tg-ms-comments-content`, `.tg-goal-comments-content`), 수준별 목표 섹션(`.tg-accordion-body`), 수준별 조 상세 바디(`.tg-lg-row-body`) 등 접을 수 있는 모든 요소를 기본 접힘(Collapsed) 상태로 렌더링.
  2. 사용자가 클릭 시에는 기존과 동일하게 부드럽게 토글되도록 인터랙션 안전망 보존.
  3. 4위 1체 배선 (마크업 `#og-task-52-container`, `#og-task-52-action-btn`, `handle팀목표_Item52Action`, 12ms 햅틱, `og_task-52_cache` 로컬 원자적 영속화 및 Supabase 연동, 4대 뷰 동시 전파).
  4. 375px 모바일 뷰포트 반응형 최적화 (터치 타겟 44px 이상, 가로 스크롤 0px 방어).

---

## 2. 요구사항 명세 (Requirements)

| ID | 요구사항 내용 | 검증 기준 |
|:---|:---|:---|
| **R1** | `index.html` 내 팀 목표 화면 렌더링 시 모든 아코디언 요소가 기본 접힘 상태로 정돈되며, 홈 화면에 `#og-task-52-container` 및 `#og-task-52-action-btn`이 마운트된다. | DOM 내 컨테이너 마운트 및 `collapseAllTeamGoalAccordions()` 호출 확인 |
| **R2** | `js/components.js`에 `handle팀목표_Item52Action` 직통 핸들러가 탑재되어 12ms 햅틱 피드백, `og_task-52_cache` 원자적 캐싱, Supabase 연동 및 4대 뷰 동시 전파가 실행된다. | `handle팀목표_Item52Action` 함수 정의 및 실행 검증 |
| **R3** | `ui.css`에 `#og-task-52-container`, `#og-task-52-action-btn` 스타일이 정의되어 44px 터치 규격 및 375px 반응형을 만족한다. | 최소 터치 높이/너비 44px 이상 실측 검증 |
| **R4** | `tests/team-goals-collapse-default.test.js` 및 `scripts/smoke-test.js`에 팀 목표 기본 접힘 상태 검증 테스트가 등록되어 전수 통과한다. | 테스트 실행 시 ALL PASS 검증 |

---

## 3. 예외 및 안전망

- 편집 모드(`state.teamGoalEditMode === true`) 진입 시에는 마일스톤 및 할 일의 편집 용이성을 위해 필요한 입력 필드가 정상 표출됨.
- 네트워크 두절 시에도 `localStorage`를 통한 로컬 캐싱으로 완전 무중단 오프라인 동작 보장.
