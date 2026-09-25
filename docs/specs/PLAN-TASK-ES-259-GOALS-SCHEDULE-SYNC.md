# 엔지니어링 작업계획서 (PLAN) — 목표탭 구글 캘린더 일정 설정 버튼 및 디데이(기간) 표시 연동

> **문서 ID**: PLAN-TASK-ES-259-GOALS-SCHEDULE-SYNC  
> **요구사항 연계**: [REQ-TASK-ES-259-GOALS-SCHEDULE-SYNC](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-259-GOALS-SCHEDULE-SYNC.md)  
> **티켓 연계**: #TASK-ES-259  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 목표(Goal), 마일스톤(Milestone), 세부할일(Task) 3계층 모두 구글 달력 연동 버튼 바로 왼쪽에 [일정설정]/[디데이/기간] 버튼을 일체형으로 배치.
  - 일정 미설정 시 `일정설정`, 단일일자 시 `D-Day`, 기간형 시 `YYYY.MM.DD.~YYYY.MM.DD.` 표시.
  - 버튼 클릭 시 일정 모달 오픈, 저장 시 로컬 스토리지/원격 원장 저장 및 4대 뷰 원자적 동시 전파.
  - 달력 아이콘 클릭 시 구글 캘린더 연동 및 미설정 시 일정 설정 모달 유도.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `formatSchedulePillHtml`, `metaStrip` 목표 헤더, `renderSingleTaskRow`, `ms-sub-meta-right`, `goalDetailBody` 이벤트 위임 (`data-calsyncgoal`, `data-calsyncms`, `data-calsynctask`), `quickSyncToCalendar` 보강.
  - `ui.css`: `.schedule-pill-btn`, `.schedule-pill-combo`, 375px 모바일 미디어 쿼리 최적화.
  - `docs/rules/TICKETS.md`: `#TASK-ES-259` 티켓 등록.
  - `tests/goals-schedule-sync.test.js`: 신규 검증 스위트 작성 (`const SUITE_TASK = 'TASK-ES-259';`).
  - `scripts/smoke-test.js`: `#TASK-ES-259` 단언문 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 3계층 목표 데이터와 캘린더 엔진의 양방향 일체화 및 원터치 일정 설정/구글 캘린더 동기화 파이프라인.
- **[원인] (Technical Causes)**:
  - `renderGoalsScreen` 내 목표 헤더에 달력 아이콘 버튼 및 `[data-calsyncgoal]` 핸들러 누락.
  - 세부할일 메타 라인에서 일정 버튼과 달력 버튼의 분산 배치.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.goals`: 목표, 마일스톤, 할일의 `startDate`, `dueDate` 필드.
  - `state.profile.settings.customSchedules`: 캘린더 전역 일정 원장.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `saveProfile()`를 통한 영구 저장.
  - 4대 뷰 동시 전파: `renderGoalsScreen`, `renderCalendarScreen`, `renderHome`, `renderRecordsScreen`.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[목표/마일스톤/할일 [일정설정]/[D-Day] 클릭]` ➔ `[openScheduleSetupModal 오픈]` ➔ `[일정 선택 후 저장 클릭]` ➔ `[applyScheduleUpdate 실행]` ➔ `[state.profile & customSchedules 동기화]` ➔ `[saveProfile() 호출]` ➔ `[4대 뷰 리렌더링]` ➔ `[달력 아이콘 클릭]` ➔ `[quickSyncToCalendar -> Google Calendar API 푸시]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 3계층 일정/달력 버튼 배치 및 이벤트 결속 | +40줄 | -10줄 | +30줄 | 외과수술적 diff |
| `ui.css` | 일정 배지 375px 모바일 조형 및 고대비 토큰 | +20줄 | 0줄 | +20줄 | CSS 토큰 준수 |
| `tests/goals-schedule-sync.test.js` | 신규 단위 검증 스위트 신설 | +100줄 | 0줄 | +100줄 | 신규 파일 |
| `scripts/smoke-test.js` | 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 회귀 방지 |
| `docs/rules/TICKETS.md` | 작업 티켓 등록 | +5줄 | 0줄 | +5줄 | 문서 갱신 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**:
   - 목표: `<button class="schedule-pill-btn" data-setschedule="1" data-schedlevel="goal" ...>` + `<button class="icon-btn" data-calsyncgoal="...">`
   - 마일스톤: `<button class="schedule-pill-btn" data-setschedule="1" data-schedlevel="ms" ...>` + `<button class="icon-btn" data-calsyncms="...">`
   - 할일: `<button class="schedule-pill-btn" data-setschedule="1" data-schedlevel="task" ...>` + `<button class="icon-btn" data-calsynctask="...">`
2. **이벤트 리스너 (Listener)**:
   - `[data-setschedule]`: `openScheduleSetupModal(level, gid, msId, tid)` 호출
   - `[data-calsyncgoal]`, `[data-calsyncms]`, `[data-calsynctask]`: `quickSyncToCalendar` 호출
3. **비즈니스 로직 (Logic)**:
   - `applyScheduleUpdate`: 목표/마일스톤/할일 필드 갱신, `customSchedules` 동기화, `saveProfile` 실행 후 4대 뷰 동시 호출
4. **피드백 & 예외처리 (Feedback)**:
   - 햅틱 12ms 진동, 토스트("일정이 저장되었습니다 ✨", "캘린더에 반영했어요 📅"), 미입력 시 친절한 유도 모달

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가? (계승 완료)
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가? (외과수술적 diff 적용)
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가? (100% 무손실 보존)
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가? (원자적 렌더링 유지)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`index.html`)**:
   - `formatSchedulePillHtml`: 기간 포맷 `${sYear}.${sMonth}.${sDay}.~${dYear}.${dMonth}.${dDay}.` 적용.
   - `metaStrip` 내 목표 일정 버튼 및 달력 버튼 배선, `goalDetailBody` 내 `[data-calsyncgoal]` 클릭 이벤트 리스너 추가.
   - `renderSingleTaskRow`: `formatSchedulePillHtml`을 `data-calsynctask` 바로 왼쪽으로 이동, 뷰 모드 중복 태그 정돈.
   - `quickSyncToCalendar`: 날짜 미설정 시 즉시 `openScheduleSetupModal` 오픈 폴백 배선.
2. **Step 2 (`ui.css`)**:
   - `.schedule-pill-btn`: 모바일 터치 타깃 44px 및 375px 화면 가로 넘침 방지 규칙 강화.
3. **Step 3 (`tests/` & `scripts/`)**:
   - `tests/goals-schedule-sync.test.js` 신설 및 실행.
   - `scripts/smoke-test.js`에 검증 단언문 추가.
   - `scripts/verify-integrity-gate.js` 게이트 검증.
4. **Step 4 (청구 및 심사)**:
   - `reports/TASK-ES-259/claims.json` 작성, 커밋, 푸시, PR 생성, `node court/chat.js <PR번호>` 심사.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**:
  - `openScheduleSetupModal`에서 시작일만 입력하거나 마감일만 입력하더라도 정상 처리되도록 방어.
  - 구글 캘린더 OAuth 토큰 만료 또는 네트워크 장애 시에도 로컬 앱 캘린더에는 100% 저장되도록 `saveProfile` 우선 완결 보장.
- **가정의 타당성 검증**:
  - `state.profile.settings.customSchedules`가 초기 상태에서 `undefined`인 경우 자동 빈 배열 초기화.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - 사용자가 달력 버튼을 클릭했을 때 일정이 없으면 "먼저 일정을 설정해주세요" 토스트와 함께 즉시 해당 항목의 일정 설정 모달을 자동으로 열어 마찰을 완전히 제거.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- `tests/goals-schedule-sync.test.js` 단위 테스트 100% PASS.
- `scripts/smoke-test.js` 스모크 테스트 377개 ALL PASS (0 failure).
- `scripts/verify-integrity-gate.js` 38개 헌법 게이트 100% 통과.
- 모바일 375px 수평 스크롤 오버플로우 0px.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: 목표 삭제 또는 마일스톤 삭제 시 연관된 `customSchedules` 항목의 고립 가능성 -> `applyScheduleUpdate` 및 삭제 핸들러에서 연계 id 기반 정리 로직 확보.
- **재검증 트리거**: GitHub Court 검사에서 Claim 실패 시 즉시 원칙 ⑤의 DOM 구조 검증으로 회귀하여 선택자 일치 여부 재확인.
