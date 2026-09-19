# 작업계획서 (PLAN) — 일정 탭 최고 헌법 15대 조문 기반 전면 무결성 복구
# (헌법 버전: 2026.09.19-SUPREME-15-ARTICLES-PHILOSOPHY-INTEGRATED 준수 정본)

> **문서 ID**: `PLAN-TASK-CALENDAR-TAB-PERFECT-RESTORATION`  
> **티켓 연계**: `#TASK-CALENDAR-TAB-PERFECT-RESTORATION`  
> **작성 일시**: 2026-09-19  
> **작성자**: Antigravity AI  
> **규범 준수**: [AGENTS.md](file:///C:/Users/HP/AGENTS.md) 준수 (헌법 제2조 2중 8원칙 엄수)  
> **마감 상한선**: **[4단계: 로컬 메인 병합 및 5A 프리뷰 배포]** (헌법 제9조 제3항 준수)  

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Problem Identification & Scope)

### 1-1. 상민 대표님 지시 및 감사 결과 요약
- 상민 대표님 지시: "일정탭 문제파악해. 헌법 적용해서." ➔ 감사 완료 및 실행 단계 승인.
- 전수 감사 결과:
  1. 가짜 듀얼레이어 및 CSS 은폐 (`#calGrid`, `#calViewToggle`, `.cal-nav-row` 은폐 및 `ui.css:7480`의 `display: none !important;`)
  2. 375px 모바일 텍스트 오버플로우 (`⏱️ 일간 타임라`/`인`, `2026-`/`09-19`, `D-`/`day` 깨짐 및 셀 태그 오버플로우)
  3. 날짜 셀 찌그러짐 (22px) 및 터치 타겟 규격(44px) 미달
  4. 하단 상세 우측 `[+ 일정 추가]` 버튼 뷰포트 이탈 잘림
  5. 주간(Week) 뷰 완전 실종 및 타임라인 모드 내 날짜 이동 내비게이션 부재
  6. 일반 일정(`custom`)의 구글 캘린더 연동 Dead-Click 결함
  7. AI 일정 등록 카드의 오배선 (일정이 아닌 목표 생성)
  8. 4대 연계 뷰(`renderHome`, `renderRecordsScreen`, `renderStatsScreen`, `renderCalendarScreen`) 동시 전파 누락
  9. 배경사진 Base64 저장에 따른 localStorage 5MB 쿼터 초과 위험

### 1-2. 영향받는 파일 전수 목록
1. `index.html`: 마크업 슬롯 정돈, 4대 뷰 동시 전파, 구글 캘린더 일반 일정 반영 배선, AI 일정 등록 핸들러 배선
2. `js/sanctuary-v3-engine.js`: 상단 모드 바(월간/주간/일간) 정돈, 셀 균등 그리드 및 터치 타겟(min 44px) 확보, 타임라인 내 날짜 내비게이션 추가, 태그 오버플로우 방지
3. `ui.css`: 모드 탭 줄바꿈 방지, 7열 균등 그리드(`repeat(7, 1fr)`), 강제 은폐 셀렉터 정돈, 375px 모바일 여백 최적화
4. `scripts/smoke-test.js`: 복구된 기능 및 무결성 회귀 방지 테스트 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 성소 테마 적용 과정에서 발생한 가짜 듀얼레이어와 CSS 은폐를 헌법 제3조 제5항에 입각하여 완전히 걷어내고, 월간/주간/일간 3단 체계와 완벽한 시각 조형(Zero Overflow, Zero Clipping, 44px 터치 타겟), 4대 뷰 동시 전파를 온전히 복원하는 것.
  - 무공해성: 불필요한 배너 난립과 2중 복제 버튼을 제거하여 정갈하고 차분한 캘린더 경험 제공.
  - RPG식 체감: 일정 완료 시 즉각적인 4대 뷰 갱신으로 성취감 직결.
  - 5대 축 귀속: FIX (버그 수정 및 회귀 결함 복구) & E1 (체크인 루프 및 일정 실천).
- **[원인] (Technical Causes)**:
  1. 성소 뷰 신설 시 기존 마크업을 은폐(`display:none`)하고 대체 뷰를 중첩시킨 듀얼레이어 편의주의.
  2. 375px 모바일 반응형 실측 감사 없이 하드코딩된 여백 및 텍스트 줄바꿈.
  3. 일반 일정과 구글 캘린더 연동 간의 데이터 매핑 누락 및 4대 뷰 렌더러 호출 누락.
- **[중심 배선] (Core Wire & State)**:
  - `OurgoalSanctuaryV3` 엔진과 `index.html` 레거시 비즈니스 파이프라인의 1:1 무결 결속.
  - `state.profile.settings.customSchedules` 및 `state.profile.calendarDayBackgrounds` 100% 무손실 배선.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - Zero Data Loss: 기존 일정, 배경사진, 목표 데이터 단 1바이트도 유실 없음.
  - Zero Dead-Click: 일반 일정 구글 반영, AI 일정 등록 등 모든 버튼의 100% 정상 작동.
  - Zero Visual Defect: 375px/430px 모바일 화면에서 글자 짤림, 버튼 잘림 0건 달성.
  - 종단간 파이프라인: `[일정 조작] -> [Local State 갱신] -> [Supabase DB 원격 저장] -> [4대 연계 뷰 전파 리렌더링] -> [피드백]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

### 3-1. 하지 말아야 할 것과 해야 할 것
- **하지 말아야 할 것 (PROHIBITED)**:
  - 기존 일정 데이터 구조(`customSchedules`, `calendarDayBackgrounds`) 파괴 금지.
  - `display: none !important;` 편의주의 꼼수 재도입 금지.
- **해야 할 것 (MANDATORY)**:
  - 모드 탭을 `[📅 월간 | 📆 주간 | ⏱️ 타임라인 | 🧘 타이머]`의 완결된 4단 모드로 정돈하거나 직관적 전환 지원.
  - 375px 모바일에서 7열 균등 그리드 및 날짜 셀 터치 타겟 min 44px 확보.
  - 타임라인 모드에 `◀`, `YYYY-MM-DD`, `▶`, `오늘` 내비게이션 완벽 장착.
  - `quickSyncToCalendar`에 `kind === 'custom'` 지원 추가.
  - `toggleScheduleDone` 및 편집 모달 저장 시 4대 뷰 동시 호출 배선.

### 3-2. 기획 단계 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
1. **1호 (원격 DB 스키마 명세)**: Supabase `custom_schedules`, `records`, `user_profiles` 구조 100% 유지.
2. **2호 (스마트 스토리지 분기 설계)**: 배경사진 DataURL 저장 시 IndexedDB 캐시 우선 및 localStorage 경량 메타데이터 안전 분기.
3. **3호 (4대 뷰 전파 배선도)**: 일정 완료/수정/삭제 시 `renderCalendarScreen`, `renderHome`, `renderRecordsScreen`, `renderStatsScreen` 동시 호출.

### 3-3. 시각적 IA 및 시맨틱 통합 배선도 (헌법 제2조 제6항 준수)
```
#screen-calendar (통합 일정 탭)
├── .screen-head (헤더: 제목 '일정' + 공개범위 + 구글 연동 배지)
├── #sanctuaryCalendarView (성소 통합 컨테이너)
│   ├── .s-cal-modes-wrap (모드 선택: 📅 월간 | 📆 주간 | ⏱️ 타임라인 | 🧘 타이머)
│   ├── [Mode A: 월간 뷰] 7열 균등 그리드(min 44px) + 날짜별 멀티도트/말줄임태그
│   ├── [Mode B: 주간 뷰] 7일 주간 아젠다 카드 + 시간대별 일정 슬롯
│   ├── [Mode C: 타임라인 뷰] 날짜 이동 내비게이션(◀ YYYY-MM-DD ▶ 오늘) + 24시간 타임라인
│   └── [Mode D: 타이머 뷰] 뽀모도로 세션 (오늘의 선택 일정 연계)
├── #calDayDetail (월간/주간 뷰 하단: 선택된 날짜 상세 일정 목록 + 단일화된 액션 바)
└── #calAgentCard (자연어 일정 등록 카드: 실제 customSchedules 등록 배선)
```

### 3-4. Diff Budget
- `index.html`: +50 / -25
- `js/sanctuary-v3-engine.js`: +90 / -40
- `ui.css`: +60 / -20
- `scripts/smoke-test.js`: +40 / -0

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Critical Review & Non-Breaking)

1. **기존 데이터 보존**: 기존 유저의 `customSchedules` 및 `calendarDayBackgrounds` 데이터 100% 불변 보존.
2. **모바일 반응형 검증**: 375px(iPhone SE/13 mini) 및 430px(iPhone 15 Pro Max) 환경에서 글자 짤림 및 버튼 이탈 0건 보증.
3. **오프라인/게스트 세션 보호**: 게스트 모드 및 네트워크 단절 시에도 에러 없이 자가 치유 작동.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **1단계 (스타일 및 모바일 조형 최적화 - `ui.css`)**:
   - 모드 탭 버튼 줄바꿈 방지 (`white-space: nowrap; flex-shrink: 0; font-size: 0.8125rem;`).
   - 7열 균등 그리드 (`grid-template-columns: repeat(7, 1fr);`) 및 셀 min-height 44px 보장.
   - `#calDayDetail` 헤더 줄바꿈 및 버튼 잘림 방지 (`flex-wrap: wrap; gap: 6px;`).
   - 불필요한 `display: none !important;` 룰셋 정돈.
2. **2단계 (성소 엔진 캘린더 로직 고도화 - `js/sanctuary-v3-engine.js`)**:
   - 주간(Week) 뷰 모드 추가 및 렌더링 배선.
   - 월간 달력 날짜 셀 태그 오버플로우 방지 (`max-width: 90%; overflow: hidden; text-overflow: ellipsis;`).
   - 타임라인 모드 헤더에 날짜 이동 내비게이션(`◀`, `YYYY-MM-DD`, `▶`, `오늘`) 추가.
   - 타이머 모드 시 오늘 선택된 일정과의 연계 타이틀 표출.
3. **3단계 (핵심 비즈니스 로직 및 4대 뷰 동시 전파 - `index.html`)**:
   - `toggleScheduleDone`에 `renderHome`, `renderRecordsScreen`, `renderStatsScreen` 동시 호출 배선.
   - `openCalendarManualEditModal` 저장/삭제 시 4대 뷰 동시 호출 배선.
   - `quickSyncToCalendar`에 `kind === 'custom'` 일반 일정 연동 로직 배선.
   - `calAgentSendBtn` 클릭 시 자연어 일정 파싱(`parseScheduleNaturalText`) 후 `customSchedules`에 실제 저장 배선.
   - 중복된 2중 버튼 정돈.
4. **4단계 (무결성 자동화 테스트 및 시각 감사 실측)**:
   - `scripts/smoke-test.js`에 주간 뷰, 타임라인 내비게이션, 일반 일정 구글 연동 테스트 추가.
   - Chrome CDP 스크립트로 375px/430px 모바일 실측 스크린샷 재촬영 및 5대 시각 감사 100% 통과 확인.
   - `npm test` 및 `node scripts/verify-integrity-gate.js` 100% ALL PASS 확인.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Verification & Anti-SPOF)

1. **A 시나리오 (Zero Dead-Click)**: 월간/주간/일간/타이머 전환, 날짜 이동(◀, ▶, 오늘), 일반 일정 구글 반영, AI 일정 등록, 일정 완료 체크 시 JS 에러 0건 및 100% 동작 확인.
2. **B 시나리오 (Zero Data Loss)**: 기존 일정 데이터 및 배경사진 100% 보존 딥이퀄 검증.
3. **C 시나리오 (Zero UX Regression)**: 게스트/소셜 로그인 및 타 탭(홈, 목표, 기록, 통계) 정상 동작 확인.
4. **D 시나리오 (Full State Propagation)**: 일정 완료/추가 시 홈 탭과 통계 탭의 EXP/달성도가 즉시 갱신됨을 실측.
5. **E 시나리오 (시각 및 공간 조형)**: 375px 환경에서 텍스트 오버플로우 0건, 버튼 잘림 0건, 셀 최소 44px 확보 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)

- [ ] 1. `ui.css` 스타일 및 7열 균등 그리드, 줄바꿈 방지 룰셋 수정
- [ ] 2. `js/sanctuary-v3-engine.js` 주간 뷰 복원, 타임라인 날짜 내비게이션 장착, 셀 오버플로우 방지
- [ ] 3. `index.html` 4대 뷰 동시 전파, 일반 일정 구글 반영, AI 일정 등록 배선, 중복 버튼 정돈
- [ ] 4. `scripts/smoke-test.js` 신규 테스트 추가 및 `npm test` 100% 통과
- [ ] 5. Chrome CDP 375px/430px 실측 재검증 및 5대 시각 감사 통과
- [ ] 6. 로컬 main 병합 (4단계) 및 Vercel 프리뷰 배포 (5A단계) 준비

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Blockers & Rollback)

- **잠재적 위험**: 주간 뷰 추가 시 상단 모드 바 버튼이 4개로 늘어나 375px 모바일에서 가로폭이 좁아질 수 있음.
- **우회 및 대응책**: `.s-cal-modes-wrap`에 `overflow-x: auto; scrollbar-width: none;`과 `flex-wrap: nowrap;`을 적용하고 칩 버튼 패딩을 컴팩트하게 조율하여 부드러운 가로 스크롤 및 탭 전환을 보장한다.
- **롤백 계획**: 문제 발생 시 `git reset --hard HEAD~1`을 통해 안전하게 직전 상태로 무손실 복구.
