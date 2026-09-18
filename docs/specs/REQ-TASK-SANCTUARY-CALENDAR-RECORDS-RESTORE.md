# 요구사항 정의서 (REQ) — 성소 UI 일정 및 기록 탭 무결성 복원 및 4위 1체 배선

> **문서 ID**: REQ-TASK-SANCTUARY-CALENDAR-RECORDS-RESTORE  
> **티켓 연계**: #TASK-SANCTUARY-CALENDAR-RECORDS-RESTORE  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity AI  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  - "아래내용 이해했는지만 답해. 코드수정하지말고. 아워골 이번에 ui/ux 전면 개선하고나서 일정 기능들이 제대로 작동안해 일정탭의 모든 기능들 정상 작동하도록 개선해야함."
  - "다른세션 작업중이니까 방해되지 않을 선까지만 작업해."
  - "추가로 이번에 ui/ux 전면 개선하면서 누락된 창이나 기능들 전부 확인해봐"
  - "이번 ui 변화를 적용하면서 잘 살릴 수 있나? 매우 세부적으로 내가 항목별로 이해하기 쉽게 알려줘"
  - "진행"
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 포커스 성소(Focus Sanctuary V4) UI 적용 과정에서 `ui.css` 내 강제 숨김 규칙(`[data-theme="focus-sanctuary"] #calGrid, #calDayDetail, #calAgentCard, .cal-nav-row, .cal-sub-guide, #recSegmentBar { display: none !important; }`)으로 인해 기존의 정상 작동하던 캘린더 그리드, 일간 상세, 타임테이블, 세그먼트 바가 전부 은폐됨.
  2. 신규 성소 뷰(`sanctuaryCalendarView`) 내부의 버튼들이 가짜 토스트(◀, ▶ 클릭 시 `toast('이전 달로 이동합니다')`)를 띄우거나, 존재하지 않는 함수(`openAddScheduleModal`)를 호출하여 모달이 열리지 않는 Dead-Click 결함 발생.
  3. 기록 탭의 상단 세그먼트 바(`#recSegmentBar`)가 숨겨져 성취 통계 뷰(`#recViewStats`)와 보관함 뷰(`#recViewArchive`)로의 진입 경로가 완전히 차단됨.
  4. 365일 히트맵 기간 필터(오늘/이번주/이번달 등)의 클릭 리스너 부재 및 위클리 리캡 이미지 다운로드 버튼의 가짜 토스트 방치.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 성소 신규 뷰가 기존 검증된 모달 함수(`openCalendarManualEditModal`, `openCalendarDayEditHubModal`, `calShift`, `setRecordsSegment`)와 물리적으로 배선되지 않고 별개의 껍데기 HTML로 렌더링됨.
  - **2층 (구조/프로세스 부재)**: 신규 UI/UX 테마 개발 시 기존 엔진을 계승(Skinning)하지 않고 독립 뷰를 얹은 뒤 기존 요소를 일괄 display: none 처리하는 분리형 개발 방식으로 인한 회귀 발생.
  - **3층 (시스템/유저 체감 괴리)**: 유저는 비주얼이 개선된 줄 알고 들어왔으나 달력 넘기기, 일정 등록, 타임라인 체크, 통계 조회가 전혀 동작하지 않아 시스템 전체에 대한 불신과 불편을 겪음.
- **사용자 상황 및 페르소나**:
  - 모바일 및 웹에서 아워골을 켜고 이번 주/이번 달 일정을 확인하거나, 오늘 실천할 목표를 캘린더 타임라인에 등록하려는 모든 사용자 및 지난주 성취 통계를 확인하려는 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: FIX / E1 (체크인 루프) / INFRA
- **[본질] (Essence)**:
  - 겉으로는 '일정 탭과 기록 탭의 단순 먹통 버그'로 보이지만, 본질은 **'신규 포커스 성소 디자인 언어(Visual Shell)와 기존의 탄탄한 데이터 처리 및 모달 엔진(Business Logic Engine) 간의 단절'**이다. 진짜 엔진에 성소의 글래스모피즘 옷을 입혀 4위 1체로 직결해야 한다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (파괴적 CSS 은폐)**: `ui.css`에서 `#calGrid`, `#calDayDetail`, `#recSegmentBar` 등을 `display: none !important;`로 가로막아 기존 검증된 기능에 접근하지 못하게 차단함.
  2. **원인 2 (미정의 함수 호출 및 가짜 핸들러 삽입)**: `js/sanctuary-v3-engine.js`에서 존재하지 않는 `openAddScheduleModal`을 부르거나, 실제 이동 없는 `toast()` 가짜 알림으로 때움.
  3. **원인 3 (상태 및 뷰 전파 단절)**: 성소 모드에서 일정 완료 시 4대 연계 뷰 동시 전파(`renderCalendar`, `renderHome`, `renderRecordsScreen`, `renderStatsScreen`)를 호출하지 않고 로컬스토리지 일부만 건드려 데이터 불일치를 초래함.
- **[중심] (Core Bottleneck & Anchor)**:
  - '성소 3대 모드(월간/타임라인/뽀모도로) 및 기록 5대 모드'와 '기존 캘린더 엔진(`calShift`, `openCalendarManualEditModal`, `renderCalendarScreen`) 및 기록 세그먼트 엔진(`setRecordsSegment`)'의 1:1 양방향 함수 바인딩.
- **[핵심] (Critical Safety & Termination)**:
  - 헌법 제3조(4위 1체 배선), 제4조(가짜 구현 금지), 제15조(4대 뷰 동시 전파 및 데이터 무손실) 엄수. 사용자의 목표·기록·일정 데이터 100% 무손실 보존 및 콘솔 에러 0건 보장.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 성소 테마의 세련된 다크 에메랄드 화면에서 ◀, ▶를 누르면 달력이 부드럽게 넘어가고, 날짜를 누르면 일간 종합 허브가 즉각 열리며, + 일정 추가를 누르면 시간/링크 첨부가 가능한 모달이 떠서 완벽히 등록되고 타임라인에 실시간 반영되는 완결된 경험을 누린다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인(세션, 게스트, 소셜)에 미치는 영향: 무영향 (기존 인증 세션 및 게스트 프로필 완벽 승계).
  - 홈 화면 및 스트릭에 미치는 영향: 일정 완료 체크 시 홈 스트릭 및 미니 캘린더에 즉시 연동 반영(4대 뷰 전파).
  - 기록/통계/캘린더 탭에 미치는 영향: 완전히 복원되어 다차원 통계, 보관함, 구글 캘린더 연동, 폰 잠금화면 라이브 연동이 100% 정상 가동.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 기존 성소 UI의 미려한 카드 조형(다크 에메랄드, 마운틴 트레일, 24시간 타임라인, 히트맵 매트릭스)을 파괴하거나 구버전으로 롤백하지 않는다.
  - 가짜 토스트나 스텁 함수를 남기지 않는다.
  - `index.html`의 기존 검증된 핵심 모달 함수들을 중복 재작성하지 않고 그대로 재사용·직결한다.
- **해야 할 것 (Action)**:
  - `ui.css`의 파괴적 `display: none !important;`를 정밀 제거하고, 성소 뷰와 기존 슬롯이 상호 조화롭게 렌더링되도록 스킨화.
  - `js/sanctuary-v3-engine.js`의 모든 버튼 핸들러를 실제 함수(`calShift`, `openCalendarManualEditModal`, `openCalendarDayEditHubModal`, `toggleScheduleDone`, `setRecordsSegment`)로 100% 교체.
  - 히트맵 기간 필터링 및 위클리 리캡 Canvas 실제 이미지 다운로드 파이프라인 완성.
  - 구글 캘린더 배지, 잠금화면 라이브 버튼, AI 일정 등록 카드를 성소 UI 톤앤매너로 재배치.
- **왜 이 방식이어야만 하는가 (Why this approach)**:
  - UI 롤백 없이 '성소의 최신 비주얼'과 '아워골의 기존 풀 기능'을 모두 만족시키는 유일한 정공법이며, 코드베이스의 단일성과 유지보수성을 극대화하기 때문.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 기존 Supabase `custom_schedules`, `records`, `goals`, `user_profiles` 테이블 구조 유지. 신규 DDL 변경 불필요(기존 스키마 100% 호환).
- **2호 (스마트 스토리지 분기 설계)**: 일정 첨부사진 및 리캡 캔버스는 localStorage 용량 초과 방지를 위해 3계층 스마트 스토리지(메타데이터 로컬 + IndexedDB 원본 캐시) 규격 준수.
- **3호 (4대 뷰 전파 배선도)**: 데이터 추가/수정/삭제 시 동시 호출될 4대 연계 뷰(`renderHome`, `renderRecordsScreen`, `renderStatsScreen`, `renderCalendar`) 렌더러 함수명 명시 및 `OurgoalSanctuaryV3.render()` 동시 호출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `s-cal-arrow (◀, ▶)` | 성소 월간 캘린더 헤더 | 클릭 | `calShift(-1)` / `calShift(1)` 호출하여 실제 연/월 이동 및 달력 재렌더링 | 이동 후 해당 연월 텍스트 갱신 및 토스트 안내 |
| `s-cal-day-cell` | 성소 월간 캘린더 그리드 | 클릭 | `state.calSelectedDate = dateKey`, 날짜 선택 하이라이트 및 `renderCalDayDetail` 갱신 | 터치 햅틱 + 일정 요약 갱신 |
| `+ 일정 추가 (btn)` | 성소 월간 캘린더 하단 | 클릭 | `openCalendarManualEditModal(selectedDate, ...)` 호출하여 실제 일정 모달 오픈 | 닫기/저장 시 4대 뷰 동시 전파 |
| `s-timeline-row` | 성소 일간 타임라인 | 클릭 | `toggleScheduleDone` 호출하여 마일스톤/일정/gcal 완료 토글 및 EXP 적립 | 햅틱 + 완료 배지 즉각 표출 + 4대 뷰 전파 |
| `+ 새 일정 등록 (btn)` | 성소 타임라인 하단 | 클릭 | `openCalendarManualEditModal` 호출 | 유효성 검증 후 저장 |
| `s-seg-pill (오늘~전체)` | 성소 365일 히트맵 | 클릭 | 히트맵 표시 기간(오늘/주/월/년/전체) 필터링 및 매트릭스 재계산 | 활성 알약 스타일 전환 + 매트릭스 갱신 |
| `s-rec-mode-btn` | 성소 기록 탭 서브 내비 | 클릭 | `setRecMode(mode)` 및 `setRecordsSegment(seg)` 연동으로 통계/보관함/피드 전환 | 해당 뷰 노출 및 active 스타일 토글 |
| `💾 이미지 다운로드` | 성소 위클리 리캡 | 클릭 | HTML5 Canvas로 리캡 카드 렌더링 후 실제 PNG 파일 다운로드 실행 | 저장 완료 토스트 및 브라우저 다운로드 트리거 |
| `📱 잠금화면 연동` | 성소 캘린더 퀵바 | 클릭 | `openLockScreenHubModal()` 호출하여 잠금화면 허브 모달 오픈 | 실시간 연동 상태 제어 |
| `구글캘린더 배지` | 성소 캘린더 헤더 | 클릭 | `syncAllToGoogleCalendar(true)` 동기화 또는 연동 모달 오픈 | 동기화 중 토스트 및 상태 갱신 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 기존 아바타 테마, 320종 페르소나 설정, 보관함 100% 보존.
- **목표 데이터 보존**: 기존 목표 목록, 마일스톤 완료 상태, 진행률 1바이트 유실 없이 보존.
- **기록 데이터 보존**: 과거 체크인, 전문 템플릿 표 기록, 스톱워치 기록, 스트릭 일수 완전 보존.
- **화면 구성 세팅값 보존**: 테마 설정, 캘린더 뷰 모드, 기록 세그먼트 설정 불변 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - 기존 성소 엔진(`sanctuary-v3-engine.js`)과 레거시 캘린더 함수들 사이에 날짜 포맷(`YYYY-MM-DD` vs `Date 객체`) 차이가 존재할 수 있음. 이를 해결하기 위해 `dateKey()` 표준 포매터를 단일 기준으로 통일한다.
- **기존 기능과의 충돌 가능성 검토**:
  - 성소 테마가 아닌 타 테마(white, black, deep-sea 등)로 전환했을 때 캘린더와 기록 탭이 깨지지 않도록 CSS 셀렉터를 `[data-theme="focus-sanctuary"]` 스코프로 안전하게 격리한다.
- **엣지 케이스 (Edge Cases)**:
  - **네트워크 단절/오프라인 상태**: 로컬 IndexedDB 및 localStorage 우선 저장 후 재연결 시 동기화.
  - **일정이 하나도 없는 날짜 선택**: 빈 상태 가이드 UI와 함께 `+ 일정 추가` 버튼을 친절하게 제공.
  - **구글 캘린더 토큰 만료**: 자동 토큰 갱신 시도 및 실패 시 우아한 재인증 안내 가이드 제공.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. [단계 1: UI.CSS 정밀 정비] (에이전트 / 10분): 파괴적 `display: none !important;`를 걷어내고, 성소 캘린더 퀵바/배지/모달 컨테이너의 글래스모피즘 스타일 정의.
  2. [단계 2: 일정 탭 엔진 직결] (에이전트 / 15분): `sanctuary-v3-engine.js`의 월 이동(`calShift`), 날짜 셀 클릭(hub modal), 일정 추가(`openCalendarManualEditModal`), 타임라인 토글(`toggleScheduleDone`) 실제 배선.
  3. [단계 3: 기록/통계 탭 서브모드 확장] (에이전트 / 15분): 서브탭에 [성취 통계 분석]과 [보관함]을 추가하고 `setRecordsSegment`와 1:1 연동. 히트맵 기간 필터 및 Canvas 이미지 다운로드 로직 탑재.
  4. [단계 4: 소통 탭 및 헤더 액션 보완] (에이전트 / 10분): 상단 피드 글쓰기 버튼(`btnCommPostFeed`) 복원 및 레이더 프로필 연동 안정화.
  5. [단계 5: 5대 무결성 검증 및 빌드] (에이전트 / 10분): `verify-integrity-gate.js` 및 `npm test` 전수 통과 확인.
- **화면 간 상호연동 전파 규격**:
  - 데이터 변경 발생 지점: 일정 완료 체크 / 신규 일정 추가
  - 즉시 갱신되어야 할 4대 연계 화면:
    1. 홈 화면 (`renderHome`): 투데이 체크인 카드 및 미니 캘린더 도트 갱신
    2. 기록 탭 (`renderRecordsScreen`): 내 기록 피드 및 히트맵 셀 레벨 즉각 상승
    3. 통계 탭 (`renderStatsScreen`): 주간/월간 실천 시간 및 카테고리별 차트 갱신
    4. 캘린더 탭 (`renderCalendarScreen`): 캘린더 도트 뱃지, 타임라인 체크 칩 즉각 갱신

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**:
  - `renderSanctuaryCalendar` 실행 도중 에러가 나면 캘린더 탭 전체가 백지가 될 위험이 있는가?  
    -> *방어책*: 모든 성소 렌더러 함수 내부에 try-catch 가드를 장착하고, 실패 시 레거시 `renderCalendarScreen()`으로 즉시 폴백(Fallback)되도록 안전핀 배선.
- **가정의 타당성 검증**:
  - '모든 모달 함수가 전역 스코프(`window`)에 존재한다'는 전제가 참인가?  
    -> *검증*: `window.openCalendarManualEditModal`, `window.openCalendarDayEditHubModal` 등이 `index.html`에서 `window.`로 노출되어 있는지 확인하고, 누락된 경우 명시적으로 바인딩.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - 당초 계획했던 독립 모달 신설안을 전면 폐기하고, 기존에 수백 번의 무결성 검증을 통과한 `openCalendarManualEditModal` 및 `openCalendarDayEditHubModal`을 100% 재사용하는 것으로 절차를 수정·확정함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- **인터랙션 무결성**: 캘린더 ◀, ▶, 날짜 셀, `+ 일정 추가`, 타임라인 체크, 히트맵 필터 클릭 시 콘솔 에러 0건 및 0ms 즉각 반응.
- **데이터 무손실**: 가상 유저 10종 페르소나 딥이퀄 대조 100% 통과 (`scripts/verify-integrity-gate.js` PASS).
- **자동화 게이트**: `npm test` 263개 스모크 테스트 100% 통과 (0 failure).
- **직관적 6단계 보고**: [4단계: 로컬 메인 병합 상태] 및 [5A 프리뷰 배포] 물리적 완결.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Rollback)
- **막히는 지점 예상**:
  - Vercel 배포 시 PWA 서비스워커 캐시로 인해 구버전 JS가 남아 새 배선이 반영되지 않는 현상.
  - *대응책*: `sw.js`의 `CACHE_NAME` 버전을 당일 날짜 및 신규 티켓 버전으로 즉시 갱신 (헌법 제14조 제3항 준수).
- **재검증 트리거 (Rollback / Fallback Trigger)**:
  - 타임라인 완료 토글 시 4대 뷰 동시 전파 중 1개라도 누락될 경우: 즉시 [원칙 ③ 4대 뷰 전파 배선도]로 되돌아가 호출 체인 점검.
  - 모달 호출 시 `ReferenceError` 발생 시: 즉시 [원칙 ⑥ 가정의 타당성]으로 되돌아가 전역 함수 바인딩 재확인.
  - 문제 발생 시 `git checkout main`으로 즉시 무손실 롤백 가능한 분기 브랜치 안전장치 유지.
