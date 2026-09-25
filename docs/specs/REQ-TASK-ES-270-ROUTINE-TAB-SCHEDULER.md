# 요구사항 정의서 (REQ) — 목표탭 상단 독립 루틴 탭 구축 및 요일별 반복·교대근무 가변 스케줄러 완결

> **문서 ID**: REQ-TASK-ES-270-ROUTINE-TAB-SCHEDULER  
> **티켓 연계**: #TASK-ES-270 (노션 생각 메모장 [27]번, Page ID: `3de598db-9096-8156-a2f0-f9ea3bec968c`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > *"목표탭의 상단에 개인목표 왼쪽에 ‘루틴’칸 추가하고 매일 해야하는 일들을 설정할 수 있는 칸을 만들자. 지금의 시스템으로는 매일해야하는 일들을 관리하기 어려워. 이 ‘루틴’칸 안에서는 나의 루틴을 만들고 그 루틴을 요일별로 설정할 수 있게 하자. 예를들어 금토일 쉬는사람은 월~목 매일 해야하는 업무를 시간대별로 설정하고 매일 따로 알람설정을 안해도 그 맞춘 시간이 되면 자동을로 알람을 받고 잊지 않게 해주는거지. 내가 설정한 루틴을 하루동안 모두 채우면 EXP 10 주게 반영하자."*
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 기존 목표 탭 상단 서브탭(`goalsSubtabs`)에서 `['personal', '개인']`이 첫 번째, `['routine', '루틴']`이 두 번째에 위치하여 '개인 목표 왼쪽'에 루틴이 있어야 한다는 상민님의 직관적 UI/동선 지시와 불일치.
  - `#routineGoalsView` 화면에서 오늘 뿐 아니라 특정 요일(월~일) 및 전체 루틴을 즉시 필터링하여 조회할 수 있는 요일별 칩 필터 바(`#routineDayFilterBar`)가 부재함.
  - 교대근무 4종 캡슐 버튼(`btnShiftDay`, `btnShiftNight`, `btnShiftDuty`, `btnShiftOff`) 클릭 시 모드 텍스트만 바뀌고 `applyShiftWorkRoutines(mode, true)` 1초 교체 파이프라인이 자동 트리거되지 않아 유저가 추가 모달을 여는 비효율 존재.
  - 당일 루틴 전수 완주 시 +10 EXP 지급 로직이 요일별 필터 전환 시에도 안전하게 '오늘 요일 기준 완주'를 판정해야 함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 서브탭 배열 순서 및 요일 칩 필터 부재로 요일별 루틴 탐색 단절.
  - **2층 (구조/프로세스 부재)**: 교대 캡슐 버튼에 원클릭 1초 안전 교체 파이프라인 미배선.
  - **3층 (시스템/유저 체감 괴리)**: 요일별 반복과 알림이 설정되어 있어도 특정 요일에 어떤 일정이 도는지 확인하기 어려움.
- **사용자 상황 및 페르소나**:
  - 주 4일 근무자, 교대근무자(주/야/비/휴), 요일별 다른 일과를 수행하는 유저가 목표 탭에 들어와 루틴을 직관적으로 확인하고 실천하고자 하는 상황.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E1 (체크인·루틴 지속 실천 루프)
- **[본질] (Essence)**:
  - 사용자의 매일 반복 생활 패턴(월~일 요일별 반복, 시간대별 알림, 교대근무 순환)을 목표 탭의 가장 앞자리(개인 목표 왼쪽)에서 원클릭으로 스케줄링하고 전수 완주 시 성취 보상(+10 EXP)을 즉각 체감시키는 데일리 루틴 허브.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: `renderGoalsScreen` 내 `subtabsList`에서 `personal`이 `routine`보다 앞서 정의되어 있었음.
  2. **원인 2**: `renderRoutineGoalsScreen`에 오늘 날짜(`dayOfWeek`)만 필터링하는 로직만 있고 요일별 칩 선택 상태(`state.routineFilterDay`) 인터페이스가 결여되어 있었음.
  3. **원인 3**: 상단 교대근무 4종 버튼이 단순 상태 저장 후 토스트만 띄우고 `applyShiftWorkRoutines(mode, true)` 호출을 누락함.
- **[중심] (Core Bottleneck & Anchor)**:
  - 요일별 칩 필터 바(`#routineDayFilterBar`: `[오늘]`, `[월]`, `[화]`, `[수]`, `[목]`, `[금]`, `[토]`, `[일]`, `[전체]`)와 `state.routineFilterDay` 실시간 렌더링 결속.
- **[핵심] (Critical Safety & Termination)**:
  - 교대근무 1초 치환 시 개인 고유 루틴(`isShiftRoutine !== true`) 100% 무손실 보존 및 당일 루틴 완주 시 일일 1회 한정 +10 EXP 정직 지급.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 목표 탭에 들어섰을 때 가장 왼쪽에 위치한 '루틴' 탭을 누르고, 요일별 칩을 눌러 월~목 또는 특정 요일 루틴을 확인하며 체크를 완료하면 +10 EXP 축하를 받고 매일 성취감을 느낀다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인: 영향 없음 (기존 프로필 세팅 내 `routines` 및 `shiftSettings` 완벽 연동).
  - 홈 화면: 오늘 루틴 달성 상태와 연동 유지.
  - 기록/통계/캘린더 탭: 루틴 완료 날짜 기록 보존.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 기존 38대 헌법 방화벽 셀렉터(`#routineGoalsView`, `#personalGoalsView`, `#goalsSubtabs`)의 ID나 클래스 변경 금지.
  - 교대근무 루틴 변경 시 사용자가 직접 등록한 개인 루틴 삭제 금지.
- **해야 할 것 (Action)**:
  - `subtabsList` 순서를 `['routine', '루틴']`을 첫 번째(개인 왼쪽)로 변경.
  - `#routineGoalsView` 상단에 요일별 칩 필터 바(`#routineDayFilterBar`) 신설 및 실시간 필터링 배선.
  - 교대근무 4종 버튼 클릭 시 `applyShiftWorkRoutines(mode, true)` 즉시 교체 적용 배선.
  - 당일 루틴 전수 완주 시 +10 EXP 지급 및 중복 지급 방지 유지.
- **왜 이 방식이어야만 하는가 (Why this approach)**:
  - 지시 원문 그대로 개인 목표 왼쪽에 루틴을 배치하고, 요일별 확인과 교대근무 1초 치환이 한 화면에서 완성되어야 사용자의 매일 반복 일과 관리 피로도가 0이 됨.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase `profiles.settings.routines`, `profiles.settings.shiftSettings` 내 완벽 영속화.
- **2호 (스마트 스토리지 분기 설계)**: 로컬스토리지 및 Supabase 양방향 동기화.
- **3호 (4대 뷰 전파 배선도)**: 루틴 상태 변경 시 `renderGoalsScreen`, `renderRoutineGoalsScreen` 및 `renderHome` 갱신.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `[data-gsub="routine"]` | 목표 상단 서브탭 | 클릭/터치 | 루틴 화면(`renderRoutineGoalsScreen`) 전환 | 12ms 햅틱 피드백 |
| `#routineDayFilterBar .routine-day-chip` | 루틴 상단 | 클릭/터치 | 선택된 요일/오늘/전체 루틴 즉시 필터링 | 12ms 햅틱 및 active 강조 |
| `.routine-card` | 루틴 목록 | 클릭/터치 | `openRoutineDetailModal(routineId)` 모달 오픈 | 체크/삭제 버튼 클릭 시 모달 제외 |
| `#btnShiftDay` 등 4종 | 교대 스케줄러 | 클릭/터치 | `applyShiftWorkRoutines(mode, true)` 1초 교체 | 개인 루틴 보존 토스트 알림 |
| `[data-rtchk]` | 루틴 카드 체크박스 | 클릭/터치 | 당일 완수 토글 및 전수 완주 시 +10 EXP 지급 | 콘페티 폭죽 및 토스트 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **개인 루틴 보존**: 교대근무 루틴 변경 시 `isShiftRoutine !== true`인 개인 루틴 100% 영구 보존.
- **완수 기록 보존**: `completedDates` 배열 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - 요일 필터가 '월'로 선택된 상태에서 체크박스를 누르면 '오늘 날짜'의 완수가 토글되므로, 오늘이 아닌 다른 요일을 보고 있을 때는 칩에 '오늘' 여부를 명확히 표시하여 혼란 방지.
- **기존 기능과의 충돌 가능성 검토**:
  - `subtabsList` 순서를 바꾸어도 기존 `state.goalsSubTab` 라우팅 분기(`if(state.goalsSubTab==='routine') renderRoutineGoalsScreen();`)와 100% 호환됨.
- **엣지 케이스 (Edge Cases)**:
  - 등록된 루틴이 0건일 때: 친절한 안내 문구 표출.
  - 특정 요일에 배정된 루틴이 없을 때: "해당 요일에 예정된 루틴이 없습니다" 안내문 표출.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. `index.html` 21565행: `subtabsList` 배열에서 `['routine', '루틴']`을 첫 번째로 이동.
  2. `index.html` 20305행: `#routineGoalsView` 내 `#routineDayFilterBar` 9개 칩(`[오늘]`, `[월]`, `[화]`, `[수]`, `[목]`, `[금]`, `[토]`, `[일]`, `[전체]`) 렌더링 및 필터링 로직 구현.
  3. `index.html` 20536행: 4종 교대 캡슐 버튼 클릭 이벤트에 `applyShiftWorkRoutines(mode, true)` 호출 배선.
  4. `ui.css`: `.routine-day-chip` 스타일 및 모바일 375px 가로 스크롤/터치 타겟 규격 배선.
- **화면 간 상호연동 전파 규격**:
  - 루틴 체크 완료 시 `renderRoutineGoalsScreen` 및 프로필 영속화 즉시 전파.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**:
  - 요일 칩 클릭 시 `state.routineFilterDay`가 깨질 경우 기본값 `'today'`로 안전 대체(Self-Healing).
- **가정의 타당성 검증**:
  - 요일 번호 체계(월=1 ~ 일=7)가 자바스크립트의 `getDay()`(일=0, 월=1)와 어긋나지 않도록 `dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()` 변환 유지.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - 교대근무 캡슐 버튼 클릭 시 비동기 `await applyShiftWorkRoutines(mode, true)`로 처리하여 상태 저장 순서 보장.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 목표 탭 상단 서브탭 1열 첫 번째가 '루틴', 두 번째가 '개인'으로 노출됨.
- `#routineDayFilterBar` 요일별 칩 클릭 시 해당 요일 루틴만 필터링 렌더링됨.
- 교대근무 4종 캡슐 버튼 클릭 시 해당 모드 루틴 3종으로 1초 교체되고 개인 루틴은 보존됨.
- 당일 루틴 전수 완주 시 +10 EXP 지급 확인.
- 단위 테스트 `tests/routine-tab-scheduler.test.js` ALL PASS.
- 스모크 테스트 388개 ALL PASS 및 무결성 게이트 38개 ALL PASS.

---

## 8. [원칙 ⑧] 즉시/단계별 적용 (Rollout & Verification)
- C1: `index.html` 내 `subtabsList`에서 `['routine', '루틴']`이 `['personal', '개인']` 앞에 위치한다.
- C2: `index.html` 내 `#routineGoalsView`에 `#routineDayFilterBar` 및 요일별 칩 필터 렌더러가 구현되어 있다.
- C3: `index.html` 내에 교대근무 4종 캡슐 버튼 클릭 시 `applyShiftWorkRoutines` 1초 교체 파이프라인이 결속되어 있다.
- C4: `index.html` 내에 당일 루틴 전수 완주 시 `awardXP(10, ...)` 지급 배선이 존재한다.
- C5: `ui.css` 내에 `.routine-day-chip` 스타일 및 모바일 반응형 규격이 구현되어 있다.
