# [PLAN] 일정탭 새 일정 추가 화면 '참고자료 첨부' 버튼 작동 불능 버그 수정 계획서 (#TASK-ES-125)

## 1. 개요 및 중심 배선 (Core Wire)
- **문서 ID**: PLAN-CALENDAR-ATTACHMENT-FIX
- **기반 요구서**: docs/specs/REQ-CALENDAR-ATTACHMENT-FIX.md
- **작성일**: 2026-09-16
- **본질 구분**: `[FIX]` / `[E1]`
- **중심 배선(Core Wire)**:
  `일정 모달 (+참고자료 첨부 클릭)` ──> `window.OurgoalCalendarAttachment.wireEditModalAttachments()` ──> `window.openAddAttachmentModal(dummyTarget, onSaved, onCancel)` ──> `dummyTarget.attachments.push(draftAtt)` ──> `onSaved(dummyTarget.attachments, ctx)` ──> `openCalendarManualEditModal(selDate, eventItem, kind, draft)` ──> `입력값(제목/날짜/메모) 100% 보존 복원 + 첨부 칩 표출`.

---

## 2. 파일별 Before / After 및 변경 예산

### ① `index.html` [MODIFY]
- **변경 사항**:
  - `openAddAttachmentModal`, `openAttachmentViewer`, `renderAttachmentChipsHtml` 3대 함수를 `window` 전역 객체에 안전하게 노출.
  - `openAddAttachmentModal` 내부 닫기 시 `skipHistoryBack` 가드를 적용하여 `popstate` 레이스 컨디션 차단.
- **라인 수 헌법 제18조**: 기존 주석/빈 줄 미세 정돈으로 상쇄, **총 22,196줄 불변(Net 0 lines) 엄수**.

### ② `js/calendar-attachment.js` [MODIFY]
- **변경 사항**:
  - `wireEditModalAttachments` 내 `onAttachmentsChanged(dummyTarget.attachments, ctx)` 콜백 인자에 `ctx` 전달 추가.
  - 미바인딩 방어 fallback: 만약 `window.openAddAttachmentModal`이 없더라도 조용히 씹히지 않고 `toast('참고자료 모듈을 준비 중입니다')` 경고 및 console.warn 출력.

### ③ `scripts/test-calendar-attachments.js` [MODIFY]
- **변경 사항**:
  - `wireEditModalAttachments` 클릭 시 `openAddAttachmentModal` 호출 및 `ctx` 보존 여부 검증 테스트 케이스 추가.

---

## 3. 원인 및 해결책 비교표

| 구분 | 현상 및 원인 (AS-IS) | 해결책 (TO-BE) | 기대 효과 및 무결성 |
| :--- | :--- | :--- | :--- |
| **원인 1<br>(핵심 결함)** | **전역 바인딩 누락**<br>• `index.html` 내부 IIFE 함수인 `openAddAttachmentModal`이 `window` 객체에 노출되지 않음.<br>• `calendar-attachment.js`의 `if(typeof window.openAddAttachmentModal === 'function')`이 항상 `false`가 되어 클릭 무시됨. | **3대 핵심 함수 window 노출**<br>• `window.openAddAttachmentModal = openAddAttachmentModal;`<br>• `window.openAttachmentViewer = openAttachmentViewer;`<br>• `window.renderAttachmentChipsHtml = renderAttachmentChipsHtml;`<br>를 `index.html`에 명시적 바인딩. | 버튼 클릭 즉시 '참고자료 첨부' 팝업 정상 표출.<br>뷰어 및 칩 렌더링까지 전면 정상화. |
| **원인 2<br>(잠재 결함)** | **컨텍스트(ctx) 전달 누락**<br>• 첨부 모달 완료/취소 콜백에서 `onAttachmentsChanged(dummyTarget.attachments)`만 호출하여 2번째 인자인 `ctx`가 전달되지 않음.<br>• 첨부 후 복귀 시 사용자가 적어둔 제목·날짜·메모가 초기화될 위험. | **콜백에 ctx 전달 보정**<br>• `onAttachmentsChanged(dummyTarget.attachments, ctx)`로 컨텍스트 객체를 완벽히 전달.<br>• 복귀 시 기존 입력 데이터 100% 무손실 복원. | 사용자가 미리 작성해둔 일정 내용(제목, 시간, 메모)이 첨부 후에도 1바이트도 날아가지 않고 그대로 유지됨 (Zero Data Loss). |
| **원인 3<br>(UX 결함)** | **단일 모달 덮어쓰기 & 뒤로가기 충돌**<br>• `openAddAttachmentModal`이 첨부 완료 시 `closeModal()`을 불러 `history.back()`을 비동기 발생시킴.<br>• 뒤이어 복귀 모달이 뜰 때 `popstate` 이벤트가 뒤늦게 도달하여 전체 모달이 닫혀버릴 수 있음. | **모달 전환 최적화 (skipHistoryBack)**<br>• 부모 모달 복귀 콜백(`onSaved`/`onCancel`)이 있는 경우 `closeModal(true)`로 히스토리 뒤로가기 스킵 처리.<br>• 부모 모달로 매끄럽게 재진입. | 깜빡임 없는 안전한 모달 복귀 보장 (Zero Dead-Click / Zero UX Regression). |

---

## 4. 5대 무결성 검증 시나리오 (향후 2단계 착수 시 적용)
1. **Zero Dead-Click**: 새 일정 추가 모달에서 [+ 참고자료 첨부] 버튼 클릭 시 모달 100% 정상 팝업.
2. **Zero Data Loss**: 일정 제목("아침 러닝"), 일시, 메모를 입력한 상태에서 참고자료를 첨부하고 돌아왔을 때 모든 입력값 100% 보존.
3. **Full State Propagation**: 첨부 후 일정 저장 시 캘린더 그리드, 일자 허브 모달, 일자 상세 뷰에 첨부 칩(`🎥`, `🖼️`, `📝`, `🔗`) 즉시 전파.
4. **Zero UX Regression**: 기존 목표/마일스톤/할 일의 첨부 기능 및 캘린더 기존 기능(구글 캘린더 연동 등)에 0건의 부작용.
5. **헌법 제18조**: `index.html` 전체 라인 수 22,196줄 불변 엄수.