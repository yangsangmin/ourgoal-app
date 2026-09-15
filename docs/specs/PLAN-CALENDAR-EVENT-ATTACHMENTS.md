# [PLAN] 캘린더 일정(Event/Schedule) 참고자료 첨부·조회·삭제 엔지니어링 계획서 (#TASK-ES-096)

## 1. 개요 및 중심 배선 (Core Wire)
- **문서 ID**: PLAN-CALENDAR-EVENT-ATTACHMENTS
- **기반 요구서**: docs/specs/REQ-CALENDAR-EVENT-ATTACHMENTS.md
- **작성일**: 2026-09-15
- **본질 구분**: `[E1]` 목표 및 일정 실행 루프의 정보 완결성 강화
- **중심 배선(Core Wire)**:
  `일정 편집 모달 (+참고자료 첨부 버튼 / 드래프트 칩)` ──> `openAddAttachmentModal()` ──> `draft/eventItem.attachments.push()` ──> `saveProfile()` ──> `renderCalendarScreen()` ──> `renderAttachmentChipsHtml()` ──> `wireAttachmentChipClicks()` ──> `openAttachmentViewer()` (영상 재생/이미지 보기/메모/링크 열기 및 개별 삭제).

---

## 2. 파일별 Before / After 및 변경 예산

### ① `js/calendar-attachment.js` [NEW]
- **역할**: 일정 참고자료 전용 헬퍼 및 확장 엔진.
- **주요 기능**:
  - `renderEventAttachmentSectionHtml(attachments, eventId)`: 일정 등록/수정 모달용 참고자료 섹션(라벨, 칩 목록, +참고자료 첨부 버튼) HTML 생성.
  - `wireEventAttachmentSection(sheet, targetItem, onUpdate)`: 모달 내 첨부 버튼 클릭 시 `openAddAttachmentModal` 연결, 칩 클릭 시 `openAttachmentViewer` 연결.
  - `handleCustomScheduleAttachmentClick(chip, idx, id)`: `wireAttachmentChipClicks`의 `custom` kind 핸들러 처리.
  - 모달 닫기/복귀 시 상태 보존.
- **코드 예산**: 약 120~160줄.

### ② `index.html` [MODIFY]
- **역할**:
  1. `<script src="js/calendar-attachment.js"></script>` 로드.
  2. `openCalendarManualEditModal`: 참고자료 첨부 섹션 삽입 및 드래프트 상태 바인딩.
  3. `openCalendarDayEditHubModal`: 각 일정 행에 `renderAttachmentChipsHtml` 추가 및 `wireAttachmentChipClicks(sheet)` 연결.
  4. `wireAttachmentChipClicks`: `kind === 'custom'` 클릭 시 `js/calendar-attachment.js`의 헬퍼 또는 내부 분기 처리 연결.
- **헌법 제18조 예산**: 순증가 **0줄 (Net 0 lines)** 유지 (기존 주석/빈 줄 미세 정리로 상쇄, 총 22,196줄 불변 엄수).

### ③ `scripts/test-calendar-attachments.js` [NEW]
- **역할**: 일정 참고자료 데이터 무결성, 칩 렌더링, 이벤트 위임 및 삭제 시나리오 단위 테스트.
- **코드 예산**: 약 100줄.

### ④ `scripts/smoke-test.js` [MODIFY]
- **역할**: `[#TASK-ES-096]` 캘린더 일정 참고자료 첨부·조회·삭제 무결성 검증 추가.
- **코드 예산**: 약 15~25줄.

---

## 3. 구현 상세 순서

### Step 1: `js/calendar-attachment.js` 모듈 작성
1. `window.OurgoalCalendarAttachment` 네임스페이스 정의.
2. `renderAttachmentSectionHtml(attachments, eventId)` 작성.
3. `wireAttachmentSection(sheet, getEventItem, onRefresh)` 작성.
4. `openScheduleAttachmentViewer(att, idx, targetSchedule, onDone)` 작성.
5. 전역 `wireAttachmentChipClicks` 래퍼/확장 함수 또는 델리게이션 인터셉터 작성.

### Step 2: `index.html` 배선 및 0줄 헌법 사수
1. `index.html`에 `<script src="js/calendar-attachment.js"></script>` 추가.
2. `openCalendarManualEditModal` 함수 내에 참고자료 섹션 마크업 삽입 및 `calEditSaveBtn`에 `attachments: curAttachments` 연동.
3. `openCalendarDayEditHubModal` 내 일정 목록에 `renderAttachmentChipsHtml` 추가.
4. `wireAttachmentChipClicks`에 `kind === 'custom'` 핸들러 연결.
5. 전체 줄 수 검증: 정확히 22,196줄 유지.

### Step 3: 단위 테스트 및 무결성 게이트 검증
1. `scripts/test-calendar-attachments.js` 생성 및 실행.
2. `scripts/smoke-test.js`에 [#TASK-ES-096] 검증 추가.
3. `npm test` 전수 실행 (245개+ All Pass).
4. `scripts/verify-integrity-gate.js` 5대 게이트 100% PASS 확인.

### Step 4: 실제 브라우저 수동 확인 (Phase 3)
1. 로컬 `localhost:8000` 환경에서 Headless Chrome 구동.
2. 일정 수동 추가 모달 열기 -> [참고자료 첨부] 클릭 -> 유튜브 링크 및 텍스트 메모 첨부 -> 칩 생성 확인 -> 저장.
3. 캘린더 일자 상세 및 허브 모달에서 칩 클릭 -> `openAttachmentViewer` 팝업 확인.
4. 스크린샷 캡처 및 `view_file` 시각적 검증.

---

## 4. 5대 무결성 검증 시나리오
1. **Zero Dead-Click**: 일정 모달 내 `+ 참고자료 첨부` 버튼, 칩 클릭 뷰어 열기, 뷰어 내 닫기 및 삭제 버튼 전수 클릭 시 에러 0건.
2. **Zero Data Loss**: 일정에 첨부된 attachments가 localStorage 백업 및 프로필 저장 시 누락 없이 온전히 보존.
3. **Full State Propagation**: 모달에서 첨부자료를 추가/삭제하면 캘린더 화면 일자 상세, 허브 모달, 당일 캘린더 셀에 즉시 반영.
4. **Zero UX Regression**: 기존 목표(Goal, Milestone, Task)의 참고자료 첨부 및 조회 기능에 일체의 영향 없음.
5. **헌법 제18조**: `index.html` 전체 라인 수 22,196줄 정확히 일치.
