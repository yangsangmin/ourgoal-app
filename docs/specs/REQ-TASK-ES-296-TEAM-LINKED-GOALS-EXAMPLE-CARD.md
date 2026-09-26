# REQ-TASK-ES-296: 팀 연계 개인목표 실제 우수 사용사례 예시 이미지 배치 및 생성 시 자동 숨김 처리

## 1. 개요 및 상민님 지시 원문
- **티켓 ID**: `#TASK-ES-296` (노션 생각 메모장 `[46]`번)
- **노션 Page ID**: `3de598db-9096-8186-9e34-f10fb4285d1d`
- **상민님 지시 원문**:
  > *"팀 연계 개인목표에 실제로 사용하면, 내 창에서 어떻게 보일지 실제 우수사용사례 이미지를 예시로 들 필요가 있음. 적용해. 그리고 팀 연계개인목표를 생성하면 예시는 사라지게 해."*
- **본질 축**: `E3 / 팀목표 / 동류 소통 루프 / UX` (팀 연계 개인목표 가이드 및 우수사례 프리뷰 제공)

---

## 2. 8원칙 충족 분석 (본질·원인·중심·핵심)

### ① 본질 (Essence)
- 팀 연계 개인목표 기능을 처음 접하는 사용자가 '이 기능을 사용하면 내 화면에 어떻게 나타나고 팀원들과 어떻게 연계되는지' 명확히 인지할 수 있도록 실전 우수 사용사례 예시 카드/이미지를 제공하고, 사용자가 실제로 팀 연계 개인목표를 생성하여 본인의 데이터가 생성되면 예시가 자연스럽게 숨겨져 실제 목표에 온전히 집중할 수 있도록 한다.

### ② 원인 (Root Cause)
- 기존에는 팀 연계 개인목표 영역이 비어있을 때 구체적인 사용 사례나 결과 형태를 보여주지 않아 사용자가 기능의 효용과 형태를 직관적으로 파악하기 어려웠음.

### ③ 중심 (Center)
- 팀 연계 개인목표 프리뷰 컨테이너 `#og-task-46-container` 및 액션 버튼 `#og-task-46-action-btn`을 마운트하고 4위 1체 배선을 완결한다.
- 우수 사용사례 프리뷰 카드(`#teamLinkedGoalsExampleCard`)를 배치하고, 팀 연계 목표 생성 핸들러(`handle팀목표_Item46Action`) 실행 시 또는 목표 등록 완료 시 예시를 자동으로 숨김 처리한다.

### ④ 핵심 (Core)
- 4위 1체 배선: `#og-task-46-container` 마크업 탑재 ➔ 직통 `handle팀목표_Item46Action` 이벤트 리스너 바인딩 ➔ 로컬 캐시 및 영구 원장 트랜잭션(`og_task-46_cache`) ➔ 12ms 햅틱 및 시각 토스트 피드백 완결.
- 4대 뷰 동시 전파: 목표 생성/숨김 시 `renderCalendar`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen` 원자적 호출.
- 375px 모바일 규격 보장: 가로 오버플로우 0px, 최소 터치 타겟 44px 이상, 폰트 최소 12px 고대비 유지.

---

## 3. 세부 기능 요구사항 (R1~R5)
- **R1**: `index.html` 내에 `#og-task-46-container`와 `#og-task-46-action-btn`, `#teamLinkedGoalsExampleCard` 4위 1체 마크업 마운트.
- **R2**: `js/components.js`에 `handle팀목표_Item46Action(event)` 직통 핸들러 및 `toggleTeamLinkedGoalExample` 구현 및 export (`window.handle팀목표_Item46Action`, `module.exports.handle팀목표_Item46Action`).
- **R3**: 12ms 햅틱 피드백(`navigator.vibrate(12)`), `og_task-46_cache` 원자적 저장 및 4대 뷰 동시 전파 연동.
- **R4**: `ui.css`에 44px 이상 터치 규격 및 375px 모바일 뷰포트 0px 오버플로우 방어 스타일 적용.
- **R5**: 단위 테스트(`tests/team-linked-goals-example-card.test.js`) 및 스모크 테스트 단언문 전수 ALL PASS.
