# 요구사항 정의서 (REQ) — 홈화면 상단 누적 배선용 테스트 카드(og-task-*) 23종 일괄 화면 은폐 및 홈화면 본래 기능 최상단 복원

> **문서 ID**: REQ-TASK-ES-304-HIDE-HOME-DEBUG-CARDS  
> **티켓 연계**: #TASK-ES-304  
> **지시 출처**: 상민님 직접 지시 ("숨겨")  
> **작성 일시**: 2026-09-27  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. 배경 및 목적

- **사용자 원문 지시**: "숨겨" (홈화면이 홈화면 기능을 안 하게 구성되어버린 원인 규명 직후의 즉각 조치 지시)
- **문제점**:
  1. 노션 [26]번부터 [53]번까지 최근 20여 개 태스크의 단위기능 검증/배선용 카드(`og-task-26` ~ `og-task-53`) 23종이 홈화면(`screen-home`) 상단에 세로로 누적 배치되어 약 2,500px~3,000px 높이를 차지함.
  2. 홈화면 본래의 핵심 기능인 오늘의 카드, 14일 잔디 히트맵, 오늘의 3초 체크인, 오늘의 갓생 퀘스트 2열 그리드 등이 화면 밖 아래로 밀려나 홈화면 기능을 완전히 상실함.
- **해결 방안**:
  1. `index.html` 내 홈화면의 23종 배선 컨테이너를 비노출 슬롯 `<div id="ogTaskWireSlot" style="display:none;" aria-hidden="true">`로 일괄 감싸 시각적 높이 0px로 완전 은폐함.
  2. `ui.css`에 `.og-feature-card, .og-avatar-welcome-card, .og-home-layout-card, .og-avatar-enlarge-card, .og-quest-task-card, #ogTaskWireSlot { display: none !important; }`를 부여하여 2중 은폐 방어선 구축.
  3. 기존 421개 스모크 테스트 및 Court 정적 검증 단언문(DOM ID, action-btn, css 선택자 등)은 100% 무결하게 보존.
  4. 홈화면 진입 시 아바타 배지, 오늘의 카드, 14일 잔디, 3초 체크인이 최상단에 산뜻하게 노출되도록 복원.

---

## 2. 요구사항 명세 (Requirements)

| ID | 요구사항 내용 | 검증 기준 |
|:---|:---|:---|
| **R1** | `index.html` 홈화면(`screen-home`) 내의 `og-task-26`부터 `og-task-53`까지 23종 컨테이너가 `#ogTaskWireSlot` 슬롯 내에 격리되어 `style="display:none;"`으로 시각적 은폐된다. | DOM 내 `#ogTaskWireSlot` 존재 및 `display:none` 확인 |
| **R2** | 기존 스모크 테스트 단언문 대상인 23종의 컨테이너 ID 및 액션 버튼 ID, onclick 핸들러가 모두 정상 보존되어 자동화 검증에 지장을 주지 않는다. | `scripts/smoke-test.js` 전수 실행 시 ALL PASS 확인 |
| **R3** | `ui.css`에 배선용 카드 및 슬롯 일괄 은폐 규칙이 탑재되어 화면 비침범이 영속적으로 보장된다. | `ui.css` 내 은폐 룰 탑재 확인 |
| **R4** | 홈화면 최상단에 `#levelBadgeRow`, `#todayMissionCard`, `#homeGrassSummaryCard`, `#captureCardBox`가 가림 없이 즉시 노출된다. | 홈화면 주요 위젯의 시각적 도달성 확보 |
| **R5** | `tests/hide-home-debug-cards.test.js` 및 `scripts/smoke-test.js`에 은폐 및 무결성 검증 테스트가 등록되어 전수 통과한다. | 테스트 실행 시 ALL PASS 검증 |

---

## 3. 예외 및 안전망

- 자동화 테스트나 브라우저 테스트에서 특정 버튼 클릭이 필요할 경우 DOM API(`document.getElementById('og-task-XX-action-btn').click()`)를 통해 트리거할 수 있도록 기능성은 온전히 유지됨.
- 홈화면의 다른 사용자 커스텀 레이아웃(`openHomeCustomizer`)이나 위젯 배치 순서에 악영향을 주지 않음.
