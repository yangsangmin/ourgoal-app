# REQ-TASK-ES-297: 시간기록 모달창 세부설명 간소화('시간별로 세부 내용을 작성할 수 있어요') 및 창 크기 축소

## 1. 개요 및 상민님 지시 원문
- **티켓 ID**: `#TASK-ES-297` (노션 생각 메모장 `[47]`번)
- **노션 Page ID**: `3de598db-9096-818b-be4b-f426a58f0006`
- **상민님 지시 원문**:
  > *"지금부터 시간기록 창이 너무 큼. 세부설명을 줄여야 돼. ’시간별로 세부 내용을 작성할 수 있어요’ 한줄로 바꾸고 창 크기 최대한 줄여"*
- **본질 축**: `E2 / 기록 회고 루프 / UX` (시간기록 모달창 세부설명 간소화 및 창 크기 최적화)

---

## 2. 8원칙 충족 분석 (본질·원인·중심·핵심)

### ① 본질 (Essence)
- 사용자가 시간을 기록할 때 불필요하게 비대한 설명과 거대한 모달 창으로 인해 발생하는 시각적 피로도를 없애고, 핵심 안내 문구인 "시간별로 세부 내용을 작성할 수 있어요" 한 줄로 직관성을 극대화하며 모달 크기를 슬림하게 축소하여 빠른 기록 경험을 제공한다.

### ② 원인 (Root Cause)
- 시간기록 모달창 내에 장황한 설명 텍스트와 과도한 상하 패딩/마진이 적용되어 있어 한 화면에서 입력창과 버튼을 한눈에 파악하기 어렵고 불필요한 스크롤이 발생함.

### ③ 중심 (Center)
- 시간기록 콤팩트 모달 컨테이너 `#og-task-47-container` 및 액션 버튼 `#og-task-47-action-btn`, 세부설명 단일화 엘리먼트 `#timeRecordModalDesc`를 마운트한다.
- 모달 내 세부설명을 "시간별로 세부 내용을 작성할 수 있어요"로 교체하고, 모달창 패딩과 크기를 콤팩트하게 압축한다.

### ④ 핵심 (Core)
- 4위 1체 배선: `#og-task-47-container` 마크업 탑재 ➔ 직통 `handle기록스톱워치_Item47Action` 이벤트 리스너 바인딩 ➔ 로컬 캐시 및 영구 원장 트랜잭션(`og_task-47_cache`) ➔ 12ms 햅틱 및 시각 토스트 피드백 완결.
- 4대 뷰 동시 전파: 설정 갱신 시 `renderCalendar`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen` 원자적 호출.
- 375px 모바일 규격 보장: 가로 오버플로우 0px, 최소 터치 타겟 44px 이상, 폰트 최소 12px 고대비 유지.

---

## 3. 세부 기능 요구사항 (R1~R5)
- **R1**: `index.html` 내에 `#og-task-47-container`, `#og-task-47-action-btn`, `#timeRecordModalDesc` 4위 1체 마크업 마운트.
- **R2**: `js/components.js`에 `handle기록스톱워치_Item47Action(event)` 직통 핸들러 및 `toggleTimeRecordModalCompact` 구현 및 export (`window.handle기록스톱워치_Item47Action`, `module.exports.handle기록스톱워치_Item47Action`).
- **R3**: 12ms 햅틱 피드백(`navigator.vibrate(12)`), `og_task-47_cache` 원자적 저장 및 4대 뷰 동시 전파 연동.
- **R4**: `ui.css`에 44px 이상 터치 규격 및 375px 모바일 뷰포트 0px 오버플로우 방어 스타일 적용.
- **R5**: 단위 테스트(`tests/time-record-modal-compact.test.js`) 및 스모크 테스트 단언문 전수 ALL PASS.
