# 엔지니어링 작업계획서 (PLAN) — 캘린더 일정 토글 및 구글 연동 편집 결함 해결

- **문서 ID**: PLAN-TASK-ES-156-CALENDAR-TOGGLE-AND-GCAL-EDIT-TITLE
- **요구사항 연계**: [REQ-TASK-ES-156-CALENDAR-TOGGLE-AND-GCAL-EDIT-TITLE](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-156-CALENDAR-TOGGLE-AND-GCAL-EDIT-TITLE.md)
- **티켓 연계**: #TASK-ES-156
- **작성 일시**: 2026-09-17
- **규범 준수**: OURGOAL_ABSOLUTE_INTEGRITY_RULES 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 캘린더 일정 토글 완료 체크 정상화, 구글 연동 일정 수동 편집 시 기존 제목/일시 프리필 정상화, 다른 세션 작업 보호를 위한 독립 브랜치 완결 및 main 무간섭 보장.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `fetchGoogleCalendarEvents` 완료 상태 승계, `calendarItemsByDate` 내 `schedId` 및 `done` 보존, `toggleScheduleDone` 내 `gcalDoneEvents` 영구 원장화, 3대 뷰(`renderCalDayDetail`, `openCalendarDayEditHubModal`, `renderCalendarTimetable`) 토글 속성 및 리스너 보강, `[data-caledit]`/`[data-hubedit]` 타깃 이벤트 검색 보강, `openCalendarManualEditModal` 구글 일정 삭제/저장 지원.
  - `sw.js`: 캐시 네임 `ourgoal-shell-v20260917-es156` 갱신.
  - `scripts/smoke-test.js`: `#TASK-ES-156` 컴플라이언스 테스트 추가.
  - `docs/rules/TICKETS.md`: `#TASK-ES-156` 티켓 등록.
  - `dev_log.md`: 작업 상세 내역 기록.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 캘린더 데이터 어댑터와 모달 뷰, 액션 디스패처 간의 구글 연동 일정 객체 필드(`schedId`, `done`) 및 편집 대상 라우팅 결측 복구.
- **[원인] (Technical Causes)**: `calendarItemsByDate`에서 `schedId` 미부여 및 `done: false` 하드코딩, 3대 뷰 토글 핸들러에서 `gcal` ID 미전달, 편집 펜버튼 리스너에서 `k === 'gcal'` 분기 누락으로 `targetEvent = null` 전달.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.settings.gcalDoneEvents`: 구글 캘린더 이벤트 완료 상태 영구 원장화.
  - `state.gcalEventsCache`: 로컬 런타임 구글 캘린더 이벤트 캐시.
  - `calendarItemsByDate()`: 캘린더 렌더링 시 `schedId: ge.id`, `done: isGeDone` 일관 공급.
- **[핵심 안전장치] (Critical Safety & Persistence)**: `saveLocalSettings` 및 `saveProfile()`을 통한 Supabase DB / LocalStorage 이중 영속화, 구글 토큰 만료 시에도 로컬 캐시 즉시 갱신 및 백그라운드 무음 동기화(Silent Sync).
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[구글 캘린더 / 캐시] -> [calendarItemsByDate (schedId, done 매핑)] -> [캘린더 3대 뷰 UI] -> [토글/펜버튼 인터랙션] -> [toggleScheduleDone / openCalendarManualEditModal] -> [gcalDoneEvents / 캐시 갱신] -> [saveProfile() 원격 원장화] -> [renderCalendarScreen() 전파 렌더링]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 토글 배선, gcal 편집 프리필 및 저장/삭제 | +45줄 | -12줄 | +33줄 | 외과수술적 diff |
| `sw.js` | 캐시 네임 es156 갱신 | +1줄 | -1줄 | 0줄 | 캐시 무효화 |
| `scripts/smoke-test.js` | #TASK-ES-156 컴플라이언스 테스트 | +27줄 | 0줄 | +27줄 | 회귀 방지 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `div.sched-check[data-detailtogglesched]`, `[data-hubtogglesched]`, `[data-togglesched]`에 `gcalId` 포함한 4단 복합 키 명시.
2. **이벤트 리스너 (Listener)**: 클릭 시 `ev.stopPropagation()` 및 `toggleScheduleDone((kind==='custom'||kind==='gcal')?id:null, ...)` 완전 배선.
3. **비즈니스 로직 (Logic)**: `gcalDoneEvents` 영구 원장 저장, `pushCalendarEvent` PATCH 원격 동기화.
4. **피드백 & 예외처리 (Feedback)**: 햅틱 진동 + '일정을 완료했어요! 🎯' / '일정을 미완료로 변경했어요' 토스트 피드백.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?
- [x] 다른 세션의 작업을 방해하지 않도록 main 머지 및 배포 파이프라인을 철저히 격리했는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (데이터 모델 & 캐시)**: `calendarItemsByDate` 및 `fetchGoogleCalendarEvents` 완료 상태 연동.
2. **Step 2 (액션 배선)**: `toggleScheduleDone` 내 `gcalDoneEvents` 영구 원장화.
3. **Step 3 (뷰 리스너)**: 3대 뷰 토글 핸들러 및 `data-caledit`/`data-hubedit` 타깃 이벤트 검색 배선.
4. **Step 4 (모달 편집/삭제)**: `openCalendarManualEditModal` 구글 일정 저장 및 삭제 핸들러 보강.
5. **Step 5 (자동화 검증)**: `smoke-test.js` 컴플라이언스 테스트 및 `npm test` 실행.
6. **Step 6 (로컬 검증)**: CDP 헤드리스 브라우저 실동작 시뮬레이션.
7. **Step 7 (안전 격리 푸시)**: 독립 브랜치 커밋 및 원격 브랜치 푸시 (main 머지 없음).

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **검증 A (전수 클릭)**: 일간 상세 체크박스, 허브 모달 체크박스, 시간표 체크박스, 일간 상세 펜버튼, 허브 모달 수정 버튼 클릭.
- **검증 B (데이터 무손실)**: gcal 일정 완료 체크 후 새로고침 및 재조회 시에도 완료 상태 100% 보존.
- **검증 C (전 UX 회귀)**: 일반 일정(`custom`), 목표(`goal`), 마일스톤(`ms`), 할 일(`task`) 기존 동작 정상.
- **검증 D (화면 상호연동)**: 일간 상세에서 체크 토글 시 달력 칩 및 허브 모달에 동시 전파.
- **검증 E (자동화 게이트)**: `npm test` 296개 ALL PASS 및 게이트키퍼 통과.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트
- [x] 1. `index.html` 코드 패치 완료
- [x] 2. `sw.js` 캐시 네임 갱신 완료
- [x] 3. `scripts/smoke-test.js` 컴플라이언스 테스트 추가 완료
- [ ] 4. `npm test` 100% ALL PASS 재검증
- [ ] 5. CDP 헤드리스 브라우저 2대 시나리오 실동작 검증
- [ ] 6. `docs/rules/TICKETS.md` 및 `dev_log.md` 갱신
- [ ] 7. 독립 브랜치 Git Commit & Push (다른 세션 무간섭 보호: main 머지 및 배포 차단)
- [ ] 8. 상민님께 단계별 멈춤 보고 (배포 결심 대기)

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **막히는 지점**: 다른 세션과의 충돌 위험
- **대응책**: 본 세션은 독립 브랜치(`fix/2026-09-17-cal-toggle-and-gcal-edit-title-es156`)에만 커밋/푸시하며, main 브랜치 머지나 원격 main 배포를 일절 실행하지 않아 다른 세션과 0% 충돌을 보장함.
