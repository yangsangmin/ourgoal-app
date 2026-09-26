# REQ-TASK-ES-295: 성취통계 데이터 관리 옆 접기토글 작동 안함 오류 수정

## 1. 개요 및 상민님 지시 원문
- **티켓 ID**: `#TASK-ES-295` (노션 생각 메모장 `[45]`번)
- **노션 Page ID**: `3de598db-9096-8175-9066-c8e2bc190afd`
- **상민님 지시 원문**:
  > *"성취통계의 데이터 관리 옆 접기토글 작동 안함"*
- **본질 축**: `FIX / E2 / 기록 회고 루프 / UX` (성취통계 데이터 관리 섹션 접기/펼치기 토글 정상화)

---

## 2. 8원칙 충족 분석 (본질·원인·중심·핵심)

### ① 본질 (Essence)
- 성취통계 뷰 내에서 데이터 관리 섹션을 사용자가 원하는 대로 접거나 펼쳐 화면 공간을 효율적으로 활용하고, 불필요한 시각적 노이즈를 제어할 수 있도록 접기/펼치기 토글 인터랙션을 온전히 복원한다.

### ② 원인 (Root Cause)
- 성취통계 내 '데이터 관리' 영역의 접기토글 버튼에 클릭 리스너 연결이 누락되거나 비활성화되어 사용자가 토글 버튼을 터치해도 접힘/펼침 애니메이션 및 상태 변경이 유발되지 않던 문제.

### ③ 중심 (Center)
- 성취통계 데이터 관리 접기토글 컨테이너 `#og-task-45-container` 및 직통 액션 버튼 `#og-task-45-action-btn`을 마운트하고 4위 1체 배선을 완결한다.
- 토글 시 아코디언 접기/펼치기 상태(`is_collapsed`)를 즉각 반전시키고, 로컬 스토리지 원자적 캐시(`og_task-45_cache`)와 영구 연동한다.

### ④ 핵심 (Core)
- 4위 1체 배선: `#og-task-45-container` 마크업 탑재 ➔ 직통 `handle성취통계_Item45Action` 이벤트 리스너 바인딩 ➔ 로컬 캐시 및 영구 원장 트랜잭션(`og_task-45_cache`) ➔ 12ms 햅틱 및 시각 토스트 피드백 완결.
- 4대 뷰 동시 전파: 토글 상태 변경 시 `renderCalendar`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen` 원자적 호출.
- 375px 모바일 규격 보장: 가로 오버플로우 0px, 최소 터치 타겟 44px 이상, 폰트 최소 12px 고대비 유지.

---

## 3. 세부 기능 요구사항 (R1~R5)
- **R1**: `index.html` 내에 `#og-task-45-container`와 `#og-task-45-action-btn` 4위 1체 마크업 마운트.
- **R2**: `js/components.js`에 `handle성취통계_Item45Action(event)` 직통 핸들러 구현 및 export (`window.handle성취통계_Item45Action`, `module.exports.handle성취통계_Item45Action`).
- **R3**: 12ms 햅틱 피드백(`navigator.vibrate(12)`), `og_task-45_cache` 원자적 저장 및 4대 뷰 동시 전파 연동.
- **R4**: `ui.css`에 44px 이상 터치 규격 및 375px 모바일 뷰포트 0px 오버플로우 방어 스타일 적용.
- **R5**: 단위 테스트(`tests/achievement-collapse-toggle.test.js`) 및 스모크 테스트 단언문 전수 ALL PASS.
