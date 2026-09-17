# 엔지니어링 작업계획서 (PLAN) — #TASK-ES-176 팀 목표창 View ↔ Edit 완전 분리(A안) · 3대 본질 시너지 및 60선 대형창 제거

> **문서 ID**: PLAN-TASK-ES-176-TEAM-GOALS-VIEW-EDIT-CLEAN  
> **티켓 연계**: #TASK-ES-176  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity Gemini Session  
> **규범 준수**: OURGOAL_ABSOLUTE_INTEGRITY_RULES 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **지시 사항 요약**:
  1. 팀 목표 편집버튼(A안) 확정: 평소에는 100% 클린한 텍스트 대시보드(무입력창·무삭제버튼), [편집] 토글 시에만 목표/마일스톤 인라인 수정·마감일·우선순위·40px 순서변경·세부할일 편집 및 하단 플로팅 액션바 활성화.
  2. 일반 멤버는 상단 [편집] 버튼 자체를 원천 숨김 (팀장/매니저만 활성화).
  3. 3대 본질 시너지 구축:
     - E1: 팀 목표 생성창에서 '📖 템플릿백과사전' 원터치 연계.
     - E2: 팀 목표/마일스톤 수정 시 팀 연계 개인목표(teamLinked) 자동 양방향 동기화.
     - E3: 팀 목표 편집 완료 시 팀 피드(team_comments) 공지 자동 게시.
  4. 대형창 정리: 목표 탭 및 소통 탭의 거대 '아워골 AI 추천 목표 템플릿 테마별 예시 60선' 창 완전 제거 및 '템플릿백과사전' 모달로 단일화.
- **영향 파일**:
  - `index.html`: 60선 아코디언 숨김/제거, canManageAny 가드, 템플릿백과사전 버튼 연동, 마감일/우선순위/순서변경/세부할일 이벤트 리스너 배선, confirm 모달화.
  - `js/goal-edit-ux.js`: commitAndFinishTeamGoalEdit 고도화, 팀 연계 동기화 호출, team_comments 시스템 공지 브로드캐스트, 하단 플로팅 액션바 배선.
  - `js/team-linked-goals.js`: syncWithTeamGoals(teamGoals, groupId) 구현 및 내보내기.
  - `js/team-visibility-levels.js`: renderTeamCardContent의 isEdit 조건부 렌더링.
  - `scripts/smoke-test.js`: #TASK-ES-176 무결성 검증 추가.
  - `docs/rules/TICKETS.md`: 티켓 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별
- **본질**: 목표 달성 몰입을 방해하는 상시 편집 UI(테두리, x 버튼 등)의 시각적 노이즈를 제거하고, 실제 편집 시에만 모던 인라인 워크스페이스를 제공함과 동시에 팀 목표-개인목표-소통 3대 축을 유기적으로 결합.
- **중심 배선**:
  - `state.teamGoalEditMode`: 팀 목표 편집 활성화 플래그.
  - `OurgoalTeamLinkedGoals.syncWithTeamGoals(teamGoals, groupId)`: 연계 개인목표 무결성 유지.
  - `OurgoalGoalEditUX.commitAndFinishTeamGoalEdit()`: 마감일/우선순위/할일 수집 및 팀 피드 공지.
  - `#goalEditFloatingBar`: 뷰포트 하단 고정 편집 완료 액션바.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산
- `index.html`: +113 / -59 (넷 +54)
- `js/goal-edit-ux.js`: +116 / -2 (넷 +114)
- `js/team-linked-goals.js`: +47 / -1 (넷 +46)
- `js/team-visibility-levels.js`: +54 / -18 (넷 +36)
- `scripts/smoke-test.js`: +33 / -0 (넷 +33)

---

## 4. [원칙 ④] 무손실 보증 및 검증
- 314개 스모크 테스트 100% PASS.
- 20개 무결성 게이트 100% PASS.
- CDP 브라우저 실측 검증 (일반 조회 모드, 인라인 편집 모드, 완료 후 복원 모드, 목표탭 60선 제거, 소통탭 60선 제거, 팀모달 백과사전 연계) 전수 검증 완료.

---

## 5. [원칙 ⑤] 실행 상태
- 4단계(로컬 및 CDP 브라우저 실측 검증 완료, PR/배포 대기)
