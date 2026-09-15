# [REQ] 캘린더 일정(Event/Schedule) 참고자료 첨부·조회·삭제 시스템 (#TASK-ES-096)

## 1. 개요 및 배경
- **문서 ID**: REQ-CALENDAR-EVENT-ATTACHMENTS
- **작성일**: 2026-09-15
- **요청자**: 상민님 직접 지시 ("일정에서도 목표에 넣는것처럼 참고자료 넣을 수 있게 해줄래?")
- **본질 구분**: `[E1]` 목표 및 일정 실행 루프의 정보 완결성 강화
- **목적**: 기존 목표(Goal, Milestone, Task)에만 국한되어 있던 참고자료(유튜브/영상, 이미지, 텍스트 메모, 웹링크) 첨부·조회·삭제 기능을 캘린더 일정(Event/Schedule) 등록 및 수정 모달, 일자 허브 모달, 캘린더 화면 일자 상세 뷰까지 전면 확장하여 실행 편의성을 극대화한다.

---

## 2. 문제해결 8원칙 적용 분석

### ① 문제 파악
- 기존 아워골은 목표·마일스톤·할 일에 대해서만 참고자료(Attachments: 영상, 이미지, 메모, 링크)를 첨부하고 칩(`📎`, `🎥`, `🖼️`, `📝`, `🔗`)으로 확인 및 뷰어(`openAttachmentViewer`)를 호출할 수 있었음.
- 캘린더 일정(`state.profile.settings.customSchedules`)은 데이터 계층에서 `attachments` 필드를 일부 수용할 수 있었으나, **일정 등록/수정 모달(`openCalendarManualEditModal`)에 첨부 기능 UI가 전혀 없었고**, 캘린더 뷰에서 일정 칩을 클릭했을 때 이벤트 위임(`wireAttachmentChipClicks`)에 `kind === 'custom'` 처리가 누락되어 아무 동작도 하지 않는 데드 클릭(Dead Click) 상태였음.
- 일자별 일정 허브 모달(`openCalendarDayEditHubModal`)에서도 첨부자료 칩이 시각적으로 표시되지 않아 일정에 연결된 자료를 즉시 확인할 수 없었음.

### ② 본질·원인·핵심 파악
- **본질**: 일정 실행 시 필요한 지식(운동 가이드 영상, 스터디 자료 링크, 회의 아젠다 메모, 약속 장소 약도 등)을 일정 카드에 직접 연동하여 1초 만에 확인하고 실행할 수 있는 원터치 참조 루프 구축.
- **원인**: 목표 모듈에만 참고자료 UI와 이벤트 리스너가 작성되어 일정 편집 모달 및 허브 모달에 연계되지 못함.
- **핵심**:
  1. 일정 수동 편집 모달에 [참고자료 첨부] 버튼 및 첨부된 자료 칩 렌더링/삭제 지원.
  2. 신규 일정 작성 시에도 Draft 첨부자료를 모달에서 즉시 확인하고 저장할 수 있는 상태 머신 구축.
  3. 일자 허브 모달 및 캘린더 일자 상세 뷰에서 첨부 칩 클릭 시 `openAttachmentViewer`를 정상 호출하고 삭제/열기 동기화.
  4. AI 일정 비서 및 외부 연동 데이터와의 하위 호환성 100% 보장.

### ③ 해결 방식
- **UI 계층**:
  - `openCalendarManualEditModal`: 메모 필드 아래에 [참고자료] 섹션 추가. 현재 첨부된 칩 목록 표시 및 `+ 참고자료 첨부` 버튼 제공.
  - `openCalendarDayEditHubModal`: 각 일정 행(row)에 `renderAttachmentChipsHtml` 추가 및 리스너 바인딩.
- **로직 계층**:
  - `wireAttachmentChipClicks`에 `kind === 'custom'` 분기 추가: `state.profile.settings.customSchedules`에서 `schedId` 매칭하여 첨부 뷰어 열기 및 삭제 시 영구 반영.
  - 모달 내 드래프트 첨부 지원: 신규 등록 시에도 `draftAttachments` 배열을 유지하여 첨부 추가 후 일정 저장 시 함께 `customSchedules`에 푸시.
- **모듈화 및 헌법 준수**:
  - `js/calendar-attachment.js` 독립 모듈로 격리 구현하여 단일 책임 원칙 준수 및 `index.html` 순증가 0줄 헌법 완벽 사수.

### ④ 재검토 및 보완
- 유튜브 영상 URL 파싱 (일반 watch URL, 단축 youtu.be, embed URL) 자동 iframe 변환.
- 로컬 이미지 파일 선택(FileReader DataURL) 및 웹 이미지 주소 지원.
- 텍스트 메모 및 외부 웹링크(새 탭 열기) 지원.
- 삭제 시 `confirm` 대화상자 및 토스트 안내 제공.

### ⑤ 절차
1. 요구사항 정의서(REQ) 및 엔지니어링 계획서(PLAN) 작성.
2. `js/calendar-attachment.js` 구현.
3. `index.html` 내 배선 연동 및 줄 수 불변 유지 (순증가 0줄).
4. 자동화 테스트 스크립트 작성 (`scripts/test-calendar-attachments.js`).
5. `npm test` 244개+ 전수 All Pass 검증.
6. 실제 브라우저(Headless Chrome) 스크린샷 캡처 및 [3단계: 로컬 수동 확인 상태] 검증.
7. 로컬 main 병합 [4단계] 및 보고.

### ⑥ 절차 재검증
- 기존 캘린더 기능(날짜 이동, 일정 추가/수정/삭제, 구글 캘린더 동기화)에 0건의 부작용 보장.
- 가상 페르소나 10종 데이터 무손실 딥이퀄 100% 통과 확인.

### ⑦ 단계별 실행 기준
- [1단계]: REQ/PLAN 완료, 작업계획서 동기화.
- [2단계]: `calendar-attachment.js` 배선, `npm test` 100% 통과.
- [3단계]: 로컬 브라우저에서 모달 첨부 및 뷰어 팝업 스크린샷 육안 확인.
- [4단계]: 로컬 `main` 병합 및 5A 프리뷰 배포 준비.

### ⑧ 막히는 지점 예상 및 대응
- **신규 일정 생성 중 첨부 추가**: 일정 ID가 생성되기 전이므로 `draftAttachments` 배열로 관리하고, `openAddAttachmentModal`의 더미 객체에 푸시한 뒤 최종 저장 시 정식 일정 객체에 이관.
- **모달 중첩(Modal Stacking)**: 참고자료 추가 모달(`openAddAttachmentModal`)을 열 때 부모 일정 편집 모달의 입력값(제목, 일시, 메모)이 유실되지 않도록 모달 복귀 상태 보존.

---

## 3. 기능 상세 규격 (Specifications)

### 3.1 일정 편집 모달 내 참고자료 UI
- 위치: `calEditNote` 메모 필드 하단, 완료 스위치 상단.
- 구성:
  - 라벨: `참고자료 (영상, 사진, 메모, 링크)`
  - 칩 목록 컨테이너: 등록된 첨부자료가 있을 경우 `renderAttachmentChipsHtml`을 사용하여 표출.
  - 첨부 버튼: `+ 참고자료 첨부` (클릭 시 `openAddAttachmentModal` 호출).
  - 칩 클릭 시: `openAttachmentViewer`를 호출하여 조회 및 개별 삭제 가능.

### 3.2 캘린더 일자 허브 모달 내 칩 표시
- 위치: 각 일정 항목(`evs.map`)의 제목/시간 하단.
- 구성: 첨부자료가 1개 이상 존재할 경우 칩 목록 표출 (`.att-chip`).
- 클릭 시: 즉시 `openAttachmentViewer` 팝업.

### 3.3 캘린더 일자 상세 뷰 (`#calDayDetail`)
- 기존 렌더링 코드에 누락되었던 `wireAttachmentChipClicks`의 `custom` kind 핸들러를 배선하여 칩 클릭 시 뷰어가 정상 작동하도록 수정.

### 3.4 데이터 스키마
```javascript
{
  id: "sched_xxxx",
  title: "일정 제목",
  date: "2026-09-15T15:00",
  note: "메모",
  done: false,
  createdAt: "2026-09-15T12:00:00.000Z",
  attachments: [
    {
      id: "att_xxxx",
      type: "video" | "image" | "text" | "link",
      title: "참고자료 제목",
      url: "https://...",
      note: "상세 설명"
    }
  ]
}
```
