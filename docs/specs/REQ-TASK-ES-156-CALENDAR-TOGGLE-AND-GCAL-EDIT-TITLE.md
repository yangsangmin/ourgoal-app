# 요구사항 정의서 (REQ) — 캘린더 일정 토글 및 구글 연동 편집 결함 해결

- **문서 ID**: REQ-TASK-ES-156-CALENDAR-TOGGLE-AND-GCAL-EDIT-TITLE
- **티켓**: #TASK-ES-156 (E1 체크인/캘린더 UX 고도화 및 FIX)
- **작성 일시**: 2026-09-17
- **적용 지침**: 아워골 최고 헌법 제2조 (2중 8원칙) 및 제12조 (단계별 멈춤: 다른 세션 작업 보호)

---

## 1. 문제 정확히 파악 (Problem Identification)

### 상민님 지시 원문
> 1. 일정의 토글을 누르면 체크완료 안됨. 해결해야하고,
> 2. 일정에서 편집(펜버튼)을 누르면 제목이 이미 있는 일정인데 일정 제목이 빈칸으로 나옴(구글연동의 경우).
> 
> 다른세션 작업중이니까 방해 안되는 지점까지만 작업해

### 기저 층위 분석
- **1층 (표면적 현상)**:
  - 캘린더 화면(일간 상세, 허브 모달, 시간표)에서 일정 체크박스(토글)를 클릭해도 완료(✓) 표시로 바뀌지 않고 미완료 상태에 머무름.
  - 구글 캘린더 연동 일정의 펜 아이콘(편집 버튼)을 누르면 분명 구글 캘린더 상에 제목이 존재하는 일정임에도 편집 모달의 '일정 제목' 인풋이 빈칸("")으로 렌더링됨.
- **2층 (구조적 결함)**:
  - calendarItemsByDate() 함수에서 구글 캘린더 이벤트 매핑 시 schedId 필드가 누락되고 done: false로 하드코딩되어 생성됨.
  - HTML 데이터 속성(data-detailtogglesched, data-hubtogglesched, data-togglesched) 생성 시 (e.schedId || e.goalId || '')를 읽는데, 구글 캘린더 일정은 두 필드가 모두 없어 gcal:::: 형태로 생성되어 ID가 전달되지 않음.
  - 토글 이벤트 핸들러에서 kind === 'gcal' 분기 시 schedId가 null로 들어가 무시됨.
  - 펜버튼 편집 리스너([data-caledit], [data-hubedit])에서 k === 'gcal'에 대한 타깃 이벤트 검색 분기가 누락되어 targetEvent가 null로 openCalendarManualEditModal에 전달됨.
- **3층 (시스템 및 환경적 제약)**:
  - 현재 다른 세션이 원격 저장소(main 및 배포)에서 작업을 진행 중이므로, 본 세션은 main 브랜치 머지 및 실서버 배포를 단행하지 않고 **독립 브랜치 완결 및 로컬 무결성 검증 상태**에서 안전하게 대기해야 함.

---

## 2. 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **[가목] 본질 (Essence)**:
  - 캘린더 데이터 어댑터(calendarItemsByDate)와 모달 뷰(openCalendarManualEditModal), 액션 디스패처(toggleScheduleDone) 간 구글 연동 데이터 필드 누락 및 라우팅 분기 부재로 인한 데이터 단절 현상.
- **[나목] 원인 (Root Causes)**:
  1. calendarItemsByDate 내 구글 캘린더 객체에 schedId: ge.id 누락 및 done: false 하드코딩.
  2. toggleScheduleDone 호출 인자 전달부에서 kind === 'gcal'일 때의 ID 인자 전달 누락.
  3. [data-caledit] 및 [data-hubedit] 핸들러에서 k === 'gcal' 처리 분기 누락으로 targetEvent = null 전달.
- **[다목] 중심 (Core Bottleneck)**:
  - 구글 캘린더 객체의 식별자(id/schedId) 일관성 및 state.gcalEventsCache와의 상호 참조 보장.
- **[라목] 핵심 (Critical Anchor)**:
  - 구글 연동 일정도 일반 일정과 동일하게 완료 체크 토글 및 인메모리/스토리지 영구 보존이 가능해야 하며, 편집창 진입 시 기존 제목/일시/메모가 100% 프리필되어야 함.

---

## 3. 효과적 · 효율적 해결방식 결정 (Effective Solutions)

### 할 것 (Must-Do)
1. calendarItemsByDate()에서 구글 캘린더 이벤트 객체 생성 시 schedId: ge.id, done: !!ge.done 설정.
2. state.profile.settings.gcalDoneEvents 영구 원장 키를 신설하여 구글 캘린더 이벤트의 완료 상태를 영구 보존.
3. fetchGoogleCalendarEvents() 실행 시 기존 gcalDoneEvents 원장을 조회하여 done 상태를 자동 승계.
4. toggleScheduleDone 호출부 3곳(data-detailtogglesched, data-hubtogglesched, data-togglesched)에서 kind === 'gcal'의 ID를 정확히 첫 번째 인자로 전달.
5. [data-caledit] 및 [data-hubedit]에서 k === 'gcal'일 때 state.gcalEventsCache에서 대상 이벤트를 조회하여 targetEvent로 전달.
6. openCalendarManualEditModal에서 kind === 'gcal' 일정 수정 시 state.gcalEventsCache 갱신 및 백그라운드 pushCalendarEvent 자동 동기화 지원.
7. 독립 브랜치(fix/2026-09-17-cal-toggle-and-gcal-edit-title-es156)에서 작업하여 다른 세션의 main 작업을 100% 보호.

### 하지 말 것 (Must-Not)
- 상민님의 사전 명시적 승인 없이 main 브랜치에 직접 커밋하거나 PR을 머지하지 않는다.
- 프로덕션 실서버 배포 파이프라인을 임의 발동시키지 않는다.

---

## 4. 1~3 재검토 · 보완 (Critical Review & Edge Cases)

- **엣지 케이스 1**: 구글 캘린더가 연동되지 않은 상태에서 캐시된 일정 수정 시 -> 로컬 캐시 및 로컬스토리지에 즉시 반영되어 UI가 정상 갱신되며, 구글 동기화는 조용히 스킵됨.
- **엣지 케이스 2**: 구글 캘린더 일정을 새로고침(fetchGoogleCalendarEvents)했을 때 유저가 체크해둔 완료 상태가 초기화되는 문제 -> state.profile.settings.gcalDoneEvents 맵에 ID별 완료 여부를 영구 기록하여 재동기화 후에도 완료 상태 보존.
- **엣지 케이스 3**: 일간 상세 뷰와 허브 모달 모두에서 편집 및 토글이 동작해야 함 -> 두 진입점 모두 동일한 분기 적용.

---

## 5. 해결 절차 정리 (Implementation Procedure)

1. index.html 내 calendarItemsByDate 구글 캘린더 매핑 수정 (schedId, done 필드 보존).
2. fetchGoogleCalendarEvents 내 완료 상태 승계 로직 보강.
3. toggleScheduleDone 내 구글 캘린더 완료 상태를 state.profile.settings.gcalDoneEvents에 영구 기록하도록 개선.
4. 3대 뷰(renderCalDayDetail, openCalendarDayEditHubModal, renderCalendarTimetable)의 토글 클릭 이벤트 핸들러 보강.
5. [data-caledit] 및 [data-hubedit] 핸들러에 k === 'gcal' 분기 추가.
6. openCalendarManualEditModal 내 kind === 'gcal' 저장/삭제 핸들러 보강.
7. scripts/smoke-test.js에 #TASK-ES-156 검증 테스트 추가.
8. npm test 및 AST 게이트 검증 수행.
9. 독립 작업 브랜치 커밋 및 원격 브랜치 푸시.

---

## 6. 절차 재검증 (Procedure Verification & Anti-SPOF)

- 단일 실패점(SPOF): 구글 토큰 만료 시 편집 모달 저장이 블로킹되는가?
  - 아니오. 로컬 캐시 및 UI를 즉시 갱신하고, 구글 API 통신은 백그라운드 비동기로 실행하여 토큰 만료 시에도 유저 경험에 전혀 지장을 주지 않음.
- 헌법 제12조 준수: 다른 세션 작업 방해 방지를 위해 PR 머지 및 프로덕션 배포를 제외한 독립 브랜치 푸시까지만 진행함.

---

## 7. 단계별 실행 기준 (Success Metrics & Criteria)

1. 구글 연동 일정의 체크 토글 클릭 시 즉시 완료(✓) 표시 토글 및 새로고침 후에도 영구 유지.
2. 구글 연동 일정의 펜버튼 클릭 시 모달의 일정 제목 인풋에 기존 제목이 완벽히 프리필됨.
3. npm test 294개 이상 테스트 전체 통과 (0 failure).
4. 로컬 무결성 헌법 5대 게이트 100% ALL PASS.
5. 독립 브랜치에만 커밋/푸시되어 main 브랜치 및 타 세션 무간섭 달성.

---

## 8. 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)

- 만약 구글 캘린더 이벤트 ID에 콜론(:) 특수문자가 포함되어 split(':') 시 ID가 잘리는 문제가 발생할 경우:
  - split(':') 대신 kind 뒤의 전체 나머지 문자열을 ID로 취급하도록 파싱 로직 보강.
