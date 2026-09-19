# 작업계획서 (PLAN) — 아워골 일정 탭 전수 결함 정상화 및 4위 1체 시맨틱 복원
# (헌법 버전: 2026.09.18-SUPREME-15-ARTICLES-VISUAL-INTEGRITY-ENHANCED 준수 정본)

> **문서 상태**: 엔지니어링 계획 수립 완료 (자율 무중단 집행 개시)  
> **세션 ID**: `c7bf0bb4`  
> **티켓 번호**: `#TASK-CALENDAR-TAB-RESTORATION`  
> **귀속 본질 축**: **FIX (회귀 결함 복구 및 무결성 보완)** & **E1 (체크인 루프)**  
> **마감 상한선**: **[4단계: 로컬 메인 병합 및 5A 프리뷰 배포]** (헌법 제9조 제3항 준수)  

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)

### 1-1. REQ 핵심 요약 및 작업 목표
- 성소 테마 적용 과정에서 발생한 일정 탭의 상하 2단 듀얼레이어 중복 노출, 월/주/일 토글 먹통, 상하 날짜 불일치, 버튼 중복 난립, 모바일 날짜 셀 글자 짤림 등 14대 결함을 헌법 제3조 제5항(시맨틱 통합)에 입각하여 완전히 복구하고 단일하고 완결된 캘린더 화면으로 완성한다.

### 1-2. 영향받는 파일 전수 목록
| 파일 경로 | 파일 역할 | 변경 범위 및 목적 |
| :--- | :--- | :--- |
| `index.html` | 메인 단일 마크업 및 캘린더 렌더러 | `#screen-calendar` 헤더 위치 정상화, 중복 버튼 정돈, 렌더러 연계 배선 |
| `js/sanctuary-v3-engine.js` | 성소 V3 엔진 | 날짜 선택 시 하단 상세 동시 갱신, 타임라인 클릭 분기(토글/편집), 4대 뷰 전파 배선 |
| `ui.css` | 전역 스타일시트 | 파괴적 `#calGrid { display: none !important; }` 정상화, 모드별 가시성 제어, 375px 반응형 최적화 |
| `scripts/smoke-test.js` | 자동화 스모크 테스트 | 일정 탭 14대 결함 정상화 자동 검증 케이스 추가 |

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

### 2-1. [본질] (Essence)
- 본 엔지니어링의 본질은 **"독립되어 겉돌던 성소 뷰와 기존 캘린더 핵심 엔진을 1:1로 직결하여, 하나의 통합된 인터페이스에서 데이터 변경과 렌더링이 즉각 동기화되는 4위 1체 배선을 완성하는 것"**이다.

### 2-2. [원인] (Root Causes - 기저 원인 3가지)
1. **[원인 1] 가짜 듀얼레이어 및 CSS 강제 은폐 (`display: none !important;`)**: 기존 뷰를 숨기고 새 뷰를 상단에 얹으면서 하단 슬롯과의 DOM 위계가 파괴됨.
2. **[원인 2] 상태 변경 시 연계 뷰 동시 전파 누락**: `selectCalDay`와 `finishPomodoroSession` 등에서 연계 뷰(`renderCalDayDetail`, `renderHome`, `renderRecordsScreen`)를 호출하지 않아 화면 간 불일치 초래.
3. **[원인 3] 컴포넌트 및 버튼의 2~3중 중복 난립**: 동일한 기능의 버튼(`+ 일정 추가`, `🖼️ 배경사진`, `📅 허브`)이 상하 뷰에 각각 별개로 렌더링되어 IA가 왜곡됨.

### 2-3. [중심] (Core Bottleneck)
- **"상단 성소 3대 모드(월간/타임라인/뽀모도로)와 하단 핵심 기능(일간 상세, 모달, 4대 뷰 전파)의 완벽한 1:1 시맨틱 통합 배선"**:
  - 모드에 맞게 레이아웃이 깔끔하게 정돈되고, 날짜 클릭 시 상하가 실시간 연동되며, 모든 버튼이 검증된 실제 비즈니스 로직과 100% 바인딩되는 것.

### 2-4. [핵심] (Critical Anchor)
- **Zero Data Loss, Zero Dead-Click, Full State Propagation**:
  - 기존 등록된 일정, 마일스톤, 사진 배경 100% 무손실 보존.
  - 모든 버튼 클릭 시 JS 에러 0건, 100% 실제 동작.
  - 4대 뷰 동시 전파로 홈/일정/기록/통계 화면 간 완벽한 일치 보장.

### 2-5. 전역 상태(`state`) 영향 분석
- `state.calSelectedDate`: 성소 달력에서 날짜 클릭 시 실시간 동기화 (`dateKey`)
- `state.calDate`: 월간 달력 기준 연월 및 주간/일간 기준일 동기화
- `state.calView`: 뷰 모드 (`month` / `week` / `day`)와 성소의 `activeCalMode` (`month` / `timeline` / `timer`) 상호 연동
- `state.profile.settings.customSchedules`: 일정 완료/수정/추가 시 영속화 및 4대 뷰 전파

### 2-6. 종단간 데이터 흐름 다이어그램
```
[사용자 터치: 날짜 셀]
       │
       ▼
window.OurgoalSanctuaryV3.selectCalDay(dateKey)
       │
       ├── 1. engine.selectedCalDate = dateKey
       ├── 2. window.state.calSelectedDate = dateKey
       ├── 3. renderSanctuaryCalendar() ➔ 상단 달력 하이라이트 & 컨트롤 바 갱신
       └── 4. renderCalDayDetail(itemsByDate) ➔ 하단 일간 상세 카드 즉시 갱신 (100% 동기화)

[사용자 터치: 타임라인 행 본문]
       │
       ▼
openCalendarManualEditModal(dateKey, schedId, kind, ...) ➔ 일정 상세/수정 모달 오픈
       │
       ▼ (저장 완료 시)
saveProfile() ➔ Supabase DB 영속화 & renderCalendarScreen() + 4대 뷰 동시 전파
```

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

### 3-1. 파일별 예상 Diff Budget
| 파일명 | 변경 내용 | 예상 추가 줄 | 예상 삭제 줄 |
| :--- | :--- | :---: | :---: |
| `index.html` | `.screen-head` 위치 최상단 이동, 렌더러 연계 배선 | +40 | -30 |
| `js/sanctuary-v3-engine.js` | 날짜 선택 시 상세 갱신, 타임라인 분기, 4대 뷰 전파 배선 | +60 | -20 |
| `ui.css` | 모드별 가시성 클래스, display:none 정리, 375px 반응형 스타일 | +50 | -20 |
| `scripts/smoke-test.js` | 일정 탭 정상화 검증 테스트 추가 | +25 | -0 |

### 3-2. 4위 1체 배선 명세 (헌법 제3조 제2항)
1. **마크업 (Markup)**:
   - 최상단: `.screen-head` (일정 타이틀, 나만 보기 뱃지, 구글 캘린더 미니 뱃지)
   - 중단: `#sanctuaryCalendarView` (통합 모드 바 + 월간/타임라인/타이머 카드)
   - 하단: `#calDayDetail` (월간 모드 시에만 연동되어 노출되는 세부 일정 목록)
   - 부속 편의: `#calAgentCard` (자연어 일정 등록), `#calLockScreenBtn` (잠금화면 연동)
2. **이벤트 리스너 (Listener)**:
   - 날짜 셀 클릭 ➔ `selectCalDay`
   - 타임라인 체크박스 클릭 ➔ `toggleScheduleItem`
   - 타임라인 본문 클릭 ➔ `openCalendarManualEditModal`
   - 컨트롤 바 `+ 일정 추가` 클릭 ➔ `openAddScheduleModal`
3. **실제 비즈니스 로직 (Handler & Logic)**:
   - Supabase DB 원장 저장 (`custom_schedules`, `records`) 및 로컬 상태 반영.
4. **사용자 피드백 (Feedback)**:
   - 햅틱 피드백(`triggerHaptic`), 완료 토스트, 로딩 인디케이터, 비프음(`playTimerBeep`).

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Critical Review)

### 4-1. 기존 기능 불파괴 검증
- **구글 캘린더 연동 보존**: `syncAllToGoogleCalendar`, `isGoogleCalendarConnected` 완벽 보존.
- **폰 잠금화면 라이브 연동 보존**: `calLockScreenBtn` 및 `openLockScreenHubModal` 완벽 보존.
- **AI 일정 등록 보존**: `calAgentSendBtn`, `sendGoalAgentMessage` 완벽 보존.
- **배경사진 및 일자 종합 허브 보존**: `openCalendarDayBgPickerModal`, `openCalendarDayEditHubModal` 100% 정상 작동.
- **유저 데이터 100% 보존**: 기존 일정, 목표, 마일스톤 데이터 1바이트도 변경 없이 보존.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **[Step 1: Git 브랜치 생성]**
   - `git checkout -b feat/2026-09-19-task-calendar-tab-restoration`
2. **[Step 2: `js/sanctuary-v3-engine.js` 핵심 배선 수정]**
   - `selectCalDay`: `renderCalDayDetail(itemsByDate)` 동시 호출 추가.
   - 타임라인 렌더러: 체크박스 영역(토글)과 제목/시간 영역(수정 모달 오픈) 분리.
   - 타임라인 시간 표시: 시간 없는 일정은 `종일` 뱃지로 세련되게 렌더링.
   - 뽀모도로 완료(`finishPomodoroSession`): 4대 연계 뷰 동시 호출 배선.
   - 날짜 셀 렌더링: 긴 텍스트 오버플로우 대신 일정 도트(인디케이터 점)로 반응형 가독성 극대화.
3. **[Step 3: `index.html` 마크업 및 렌더러 연계 정돈]**
   - `#screen-calendar` 내부에서 `.screen-head`를 `#sanctuaryCalendarView` 위로 이동.
   - 중복 버튼 정돈 및 뷰 모드 클래스 결속.
4. **[Step 4: `ui.css` 스타일 및 모드 제어 정리]**
   - `[data-theme="focus-sanctuary"] #calGrid` 강제 은폐 규칙을 모드 종속형으로 수정.
   - 모드별(`activeCalMode === 'month' | 'timeline' | 'timer'`) 서브 슬롯 가시성 클래스 추가.
   - 375px 모바일 뷰포트 반응형 최적화.
5. **[Step 5: 테스트 코드 추가 및 5대 무결성 검증]**
   - `scripts/smoke-test.js`에 일정 탭 무결성 검증 추가.
   - `npm test`, `verify-integrity-gate.js`, `verify-all-clicks.js` 실행.
6. **[Step 6: 로컬 메인 병합 및 5A 프리뷰 배포]**
   - `main` 브랜치에 안전하게 로컬 병합 후 Vercel 프리뷰 배포 실행.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Anti-SPOF)

| 검증 영역 | 검증 시나리오 | 기대 결과 | 통과 기준 |
| :--- | :--- | :--- | :---: |
| **A. 전수 클릭 (Zero Dead-Click)** | 일정 탭 내 모든 버튼(모드 버튼, 날짜 셀, 화살표, 추가, 사진, 허브, 잠금화면, AI등록) 전수 클릭 | JS 콘솔 에러 0건, 모달 정상 표출, 토글 정상 작동 | 100% PASS |
| **B. 데이터 무손실 (Zero Data Loss)** | 일정 추가 ➔ 수정 ➔ 완료 체크 ➔ 새로고침 후 대조 | 기존 일정 및 신규 일정 1바이트 손실 없이 유지 | 100% PASS |
| **C. 전 UX 회귀 (Zero Regression)** | 게스트 로그인, 소셜 로그인, 홈/목표/기록 탭 정상 동작 확인 | 타 탭에 영향 0건, 스트릭 정상 반영 | 100% PASS |
| **D. 화면 연동 (Full State Propagation)** | 일정 완료 시 홈 화면 미니 달력 및 스트릭 실시간 반영 | 4대 뷰 동시 최신화 | 100% PASS |
| **E. 자동화 게이트 (Automated Gates)** | `npm test` 및 AST 정적 방화벽 스크립트 실행 | 263개 테스트 전수 통과 (0 failure) | 100% PASS |

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)

- [ ] **[1단계: 기획·설계 상태]** REQ 및 PLAN 수립, Tri-Sync 저널 기록 완료
- [ ] **[2단계: 내부 시뮬레이션 상태]** 피처 브랜치에서 코드 구현 및 스모크 테스트 통과
- [ ] **[3단계: 로컬 수동 확인 상태]** 로컬 환경(`localhost:8000`)에서 일정 탭 시각 감사 및 전수 인터랙션 점검
- [ ] **[4단계: 로컬 메인 병합 상태]** 로컬 `main` 브랜치에 안전 병합 및 Vercel 프리뷰 배포(5A) 자동 실행

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Blockers & Fallbacks)

- **잠재 블로커**: 모드 전환 시 CSS 가시성 규칙이 충돌하여 일부 요소가 보이지 않는 현상.
- **해결책**: 루트 섹션(`#screen-calendar`)에 `data-cal-mode="month|timeline|timer"` 속성을 명시적으로 토글하고, CSS에서 속성 선택자로 단일하고 명확하게 가시성을 제어한다.
- **롤백 계획**: 문제 발생 시 `git checkout main`으로 즉시 안전 롤백 가능.
