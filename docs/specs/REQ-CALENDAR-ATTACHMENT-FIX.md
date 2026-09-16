# [REQ] 일정탭 새 일정 추가 화면 '참고자료 첨부' 버튼 작동 불능 버그 수정 (#TASK-ES-125)

## 1. 개요 및 배경
- **문서 ID**: REQ-CALENDAR-ATTACHMENT-FIX
- **작성일**: 2026-09-16
- **요청자**: 상민님 직접 지시 ("아워골 일정탭의 새 일정 추가 화면에서 참고자료 첨부 버튼이 작동 안함. 원인파악 및 해결책 표로 알기쉽게 보고해. 1단계까지만 진행해")
- **본질 구분**: `[FIX]` / `[E1]` 목표 및 일정 실행 루프의 장애 복구
- **목적**: 캘린더 일정탭 '새 일정 추가' 모달(`openCalendarManualEditModal`)에서 [+ 참고자료 첨부] 버튼(`#calEditAddAttBtn`)을 클릭했을 때 발생하는 데드 클릭(Dead Click / Silent Fail) 현상의 근본 원인을 규명하고, 상민님 승인 후 즉시 안전하게 적용할 수 있는 표준 규격 및 해결책을 정의한다.

---

## 2. 문제해결 8원칙 적용 정밀 분석

### ① 문제 정확히 파악
- **증상**: 일정 탭에서 '+ 새 일정 추가' 버튼을 눌러 모달을 띄운 뒤, [참고자료 (영상, 이미지, 메모, 링크)] 섹션의 [+ 참고자료 첨부] 버튼을 누르면 콘솔 에러도 없이 아무런 반응이 없음(먹통 현상).
- **영향 범위**:
  1. 새 일정 추가 모달 (`openCalendarManualEditModal(sel, null)`)
  2. 기존 일정 편집 모달 (`openCalendarManualEditModal(sel, eventItem)`)
  3. 첨부자료 칩 클릭 조회 (`openAttachmentViewer`)
  4. 일자 허브 모달 내 일정 첨부 버튼 (`[data-hubaddatt]`)

### ② 본질·원인·중심·핵심 파악
- **본질**: 독립 모듈(`js/calendar-attachment.js`)과 메인 앱 스코프(`index.html` IIFE) 간의 **글로벌 스코프 배선 단절(Scope Isolation)**.
- **근본 원인 3요소**:
  1. **[원인 1: 전역 바인딩 누락 (핵심)]**:
     - `index.html`은 전체가 즉시 실행 함수 `(function(){ "use strict"; ... })();`로 감싸져 있음.
     - `openAddAttachmentModal`, `openAttachmentViewer`, `renderAttachmentChipsHtml` 함수가 `index.html` 로컬 스코프에만 선언되어 있고 `window` 전역 객체에 노출되지 않음.
     - 외부 스크립트인 `js/calendar-attachment.js`의 `wireEditModalAttachments`는 `if(typeof window.openAddAttachmentModal === 'function')`으로 존재 여부를 체크하고 호출하도록 설계됨.
     - `window.openAddAttachmentModal`이 `undefined`이므로 조건문이 항상 `false`가 되어 **클릭 리스너가 조용히 무시(Silent Failure)**됨.
  2. **[원인 2: 콜백 인자 누락으로 인한 기존 입력값 유실 (부작용 1)]**:
     - `index.html`은 모달을 다시 열 때 `function(updatedAtts, ctx)`로 컨텍스트(사용자가 입력 중이던 제목, 날짜, 메모)를 받아 복원하도록 작성됨.
     - 그러나 `js/calendar-attachment.js`에서 콜백 호출 시 `onAttachmentsChanged(dummyTarget.attachments)`만 넘기고 `ctx`를 넘겨주지 않아, 첨부 완료/취소 후 돌아오면 사용자가 작성 중이던 제목/날짜/메모가 초기화될 위험이 존재함.
  3. **[원인 3: 단일 모달 덮어쓰기 및 뒤로가기(popstate) 레이스 컨디션 (부작용 2)]**:
     - `openAddAttachmentModal` 내부에서 첨부 완료/취소 시 `closeModal()`을 호출함.
     - `closeModal()`은 `history.back()`을 비동기로 실행하는데, 직후 `onSaved()` 콜백에서 `openCalendarManualEditModal`이 열리면서 브라우저 `popstate` 이벤트가 뒤늦게 도착하여 부모 모달까지 연쇄적으로 닫혀버리는 플리커/글리치 위험이 있음.

### ③ 해결 방식
- **해결안 A (표준 정본 연계: index.html 0줄 불변 + 글로벌 노출 & ctx 보정)** [권장]:
  1. `index.html` 내부 8640라인 부근에 `window.openAddAttachmentModal = openAddAttachmentModal;`, `window.openAttachmentViewer = openAttachmentViewer;`, `window.renderAttachmentChipsHtml = renderAttachmentChipsHtml;` 3개 함수를 `window`에 안전하게 바인딩. (라인 수 유지를 위해 주변 주석/공백 3줄 압축 상쇄로 22,196줄 100% 엄수)
  2. `js/calendar-attachment.js`의 `wireEditModalAttachments`에서 `onAttachmentsChanged(dummyTarget.attachments, ctx)`로 `ctx`를 전달하도록 보정.
  3. `openAddAttachmentModal`에서 `onSaved`/`onCancel` 콜백이 주어졌을 때는 `closeModal()`로 히스토리를 닫지 않고 인플레이스로 모달 내용을 교체하거나 `closeModal(true)`(히스토리백 스킵)를 적용하여 깜빡임 및 뒤로가기 꼬임 방지.

### ④ 1~3 재검토 및 보완
- 기존 목표/마일스톤/할 일의 첨부 기능에 사이드이펙트가 발생하지 않는지 전수 검증.
- `index.html`의 총 줄 수(22,196줄)가 단 1줄도 늘어나지 않도록 사전 측정.

### ⑤ 절차
- 1단계: 원인 및 해결책 보고서 작성 (현재 완료) 및 상민님 승인 대기.
- 2단계: 승인 시 `index.html` 및 `js/calendar-attachment.js` 수정, 단위 테스트 보강.
- 3단계: 로컬 브라우저 수동 확인 (일정 모달 -> 첨부 버튼 클릭 -> 첨부 완료 -> 일정 저장).
- 4단계: 로컬 main 병합 및 5A 프리뷰 배포 준비.

### ⑥ 절차 재검증
- `npm test` 263개 테스트 및 `verify-integrity-gate.js` 100% PASS 보장.

### ⑦ 단계별 실행 기준
- 상민님의 "1단계까지만 진행해" 지시에 따라, 코드는 작성하지 않고 1단계(보고)에서 즉시 정지.

### ⑧ 막히는 지점 예상 및 대응
- `index.html` 라인 수 제약: 정확한 공백 치환으로 라인 수 22,196줄 정확히 보존.