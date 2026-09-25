# 요구사항 정의서 (REQ) — 오늘의 미션 및 AI 피드백 조건부 호출 최적화 (API 낭비 방지)

> **문서 ID**: REQ-TASK-ES-264-AI-CONDITIONAL-CALL-OPTIMIZATION  
> **티켓 연계**: #TASK-ES-264 (노션 생각 메모장 [07]번, Page ID: `3dc598db-9096-81cc-8791-d6712eedec15`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **귀속 축**: INFRA / E1 (기반 인프라 및 체크인 루프 최적화)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > *"오늘의 미션이나 기타 ai 피드백은 목표가 변동되거나, 기록이 변동되거나 하는 등의 사용자의 변화가 없으면 앱 새로고침에서 다시 api 호출해서 낭비가 없도록 해. 날짜가(한국시간 00:00 기준, 타 국가는 그 국가의 표준시간 반영) 변동되고 새로 앱을 키거나, 앱 안에서 새로고침 했을 때는 예외로 api 다시 호출해서 피드백을 새로 하게해."*
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 목표가 새로 추가되거나 마일스톤·세부할일이 수정/완료되어 사용자의 실천 상황이 변동되었음에도 불구하고, 이미 당일 캐시가 존재하면 오늘의 미션이 갱신되지 않고 과거 목표 기반 미션이 고착되는 현상.
  2. 날짜 기준이 단순 디바이스 로컬 날짜(`dateKey`)로만 처리되어, 한국시간(KST 00:00) 기준 자정 롤오버 및 해외 사용자의 해당 국가 표준시간대(자정 00:00) 롤오버 규정이 엄밀하게 반영되지 못함.
  3. 앱을 켜둔 채로 자정(00:00)을 넘겼을 때 또는 백그라운드에서 복귀했을 때 날짜 변경을 능동 감지하여 새 미션/피드백을 호출하는 트리거가 부재함.
  4. 데이터 변동이 전혀 없는 단순 새로고침 시에도 일부 조건에서 불필요한 네트워크/API 재호출 가능성이 상존함.
- **표면 아래 기저 층위 분석**:
  - **1층 (낭비/불일치 결함)**: 목표/기록 변동 여부를 캐시 키에 반영하지 못해 무효화 타이밍 상실 또는 불필요 API 호출.
  - **2층 (타임존/시간 규격 부재)**: KST 00:00 및 사용자 국가 표준시 자정 롤오버 정책의 추상화 함수 부재.
  - **3층 (라이프사이클 감지 부재)**: 자정 경과(`midnight`) 및 포커스/복귀(`visibilitychange`) 시점의 자동 감지 파이프라인 결여.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: INFRA / E1 (인프라 회복탄력성 및 체크인 루프)
- **[본질] (Essence)**: 데이터 변동이 없을 때는 1바이트의 불필요한 API 호출도 발생하지 않는 완벽한 0-낭비 캐싱을 보장하고, 날짜 변동(자정 00:00) 또는 사용자 데이터(목표/기록) 변동 시에만 정밀하게 재호출하여 항상 가장 최신의 맞춤형 AI 미션과 피드백을 제공함.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: `todayMissions` 캐시가 목표 상태 해시(`hash`)를 검증하지 않고 날짜(`date`)만 일치하면 재호출을 차단하여, 목표가 바뀌어도 미션이 불일치 상태로 방치됨.
  2. **원인 2**: `refreshGoalStatusSummary`의 경우 날짜 변동 검사가 누락되어 다음 날에도 이전 날의 요약이 갱신되지 못함.
  3. **원인 3**: 국제 표준시/KST 자정 롤오버를 관장하는 `getEffectiveStandardDateKey` 단일 함수 부재.
- **[중심] (Core Bottleneck & Anchor)**:
  - `getEffectiveStandardDateKey(dateOrIso, userTz)` 구축 (한국 KST 00:00, 타 국가는 현지 표준시 00:00 엄격 반영).
  - `todayMissions[goalId]` 캐시에 목표 해시(`hash`)와 표준 날짜(`date`)를 동시 결속.
- **[핵심] (Critical Safety & Termination)**:
  - 데이터 무변경 새로고침 시 API 호출 0회 보장.
  - 날짜 변경 또는 목표 변동 발생 시 즉시 신규 API 호출 및 4대 뷰 원자적 동시 전파.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 앱을 새로고침해도 목표나 기록의 변화가 없다면 즉각 캐시된 오늘의 미션이 지체 없이 뜨고, 목표를 수정하거나 날짜가 바뀌면 즉시 새로운 맞춤 미션과 조언이 생성되어 불필요한 로딩 낭비 없이 쾌적함을 체감한다."*

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 유저 데이터 변경이 없는데도 새로고침할 때마다 API를 재호출하는 낭비 행위 금지.
  - 목표가 바뀌었는데 과거 미션을 그대로 유지하는 불일치 방치 금지.
  - 기존 `dateKey`, `getKSTDateKey` 함수를 파괴하지 않고 상위 호환성 유지.
- **해야 할 것 (Action)**:
  1. `getEffectiveStandardDateKey(dateOrIso, userTz)` 함수를 전역 구축하여 한국 KST 00:00 및 해외 국가 표준시 자정 롤오버 표준화.
  2. `renderTodayMissionCard()` 내 `todayMissions` 캐시 검증 로직에 `goalHash` 및 표준 날짜 동시 검사 배선.
  3. 목표 수정/마일스톤 완료/세부할일 체크/기록 추가 시 캐시 무효화 및 신규 미션 갱신 트리거 보장.
  4. `refreshGoalStatusSummary()`에서 날짜 변경(`dateKey !== todayDateKey`) 시 신규 분석 재요청 허용.
  5. `setupDateRolloverWatcher()` 탑재로 자정 경과 및 탭 복귀(`visibilitychange`) 시 자동 갱신.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**:
  `profiles.settings.todayMissions = { [goalId]: { date: string, text: string, hash: string, updatedAt: string } }`
  `profiles.settings.goalStatusSummaries = { [goalId]: { text: string, hash: string, dateKey: string, updatedAt: string } }`
- **2호 (스마트 스토리지 분기 설계)**: 로컬 `state.profile.settings`에 즉시 반영 및 `saveProfile()`를 통한 Supabase 영구 원장 원자적 보존.
- **3호 (4대 뷰 전파 배선도)**: 미션 또는 AI 조언 갱신 시 `dispatchFullViewPropagation` 또는 `renderHome()` 및 `renderGoalsScreen()` 원자적 동시 갱신.

### 3-2. 전수 인터랙션 명세표 (Zero-Dead-Click)
| 트리거 / 액션 | 조건 | 기대 동작 (비즈니스 로직) | 예외 처리 및 피드백 |
| :--- | :--- | :--- | :--- |
| 앱 새로고침 / 홈 탭 진입 | 목표·기록 무변경 & 당일 | 캐시된 미션 0ms 즉시 렌더링, API 호출 0회 | 불필요 로딩 스피너 미노출 |
| 앱 새로고침 / 홈 탭 진입 | 자정(00:00) 경과로 날짜 변동 | 새로운 날짜 키 감지 ➔ `/api/todaymission` 호출 ➔ 새 미션 렌더링 | 오프라인 시 로컬 룰베이스 미션 안전 폴백 |
| 목표 / 마일스톤 / 할일 수정 | 당일 내 목표 변동 | 목표 해시 불일치 감지 ➔ 새 미션 및 상태조언 재요청 ➔ 4대 뷰 전파 | 실시간 UI 반영 |
| 자정 경과 (`visibilitychange`) | 앱 백그라운드 복귀 | 날짜 변동 감지 ➔ `renderTodayMissionCard()` 자동 재평가 | 자동 갱신 완료 |

---

## 4. [원칙 ④] 스티브 잡스 디테일 (Steve Jobs Details)
- **0ms 즉각 반응의 쾌적함**: 변화가 없을 때는 서버 네트워크 지연(200~1000ms) 없이 캐시에서 번개처럼 즉시 렌더링되어 사용자가 완벽한 쾌속성을 체감.
- **자정의 섬세한 배려**: 한국 사용자는 KST 자정(00:00)에, 해외 사용자는 자신의 표준시 자정에 맞춰 자동으로 "오늘의 미션"이 새롭게 리셋되어 새로운 하루의 실천 동기를 부여.

---

## 5. [원칙 ⑤] 리스크 검토 및 회귀 방지 (Risk Analysis & Regression Prevention)
- **리스크 1**: 타임존 파싱 에러 또는 브라우저 `Intl` 미지원 구형 환경.
  - **대응**: `try-catch` 샌드박싱 및 `getKSTDateKey`로 완벽한 Fallback 구성.
- **리스크 2**: 잦은 목표 수정 시 연속 API 호출로 쿼터 소진 위험.
  - **대응**: `state.todayMissionPending` 플래그 및 `GeminiQuotaDispatcher` 백오프 큐 연동.

---

## 6. [원칙 ⑥] 완료 조건 정의 및 절차 재검증 (Definition of Done & Verification)
1. 목표/기록 변동 없는 새로고침 시 `/api/todaymission` 및 `/api/goalstatus` API 호출 0건 실측 검증.
2. 날짜 변경(KST 00:00 / 로컬 00:00) 시 새 미션 및 조언 자동 재호출 검증.
3. 목표 변경(마일스톤/할일) 시 해시 불일치로 신규 미션 재요청 검증.
4. 단위 테스트 `tests/ai-conditional-call-optimization.test.js` 100% 통과.
5. `scripts/smoke-test.js` 382개 전 항목 ALL PASS.
6. `scripts/verify-integrity-gate.js` 38개 헌법 게이트 100% ALL PASS.
7. `reports/TASK-ES-264/claims.json` 법정 단언문 무결 작성 및 GitHub Court 합격 판정 획득.

---

## 7. [원칙 ⑦] 구현 파일 범위 (Target Files)
- `index.html`: `getEffectiveStandardDateKey`, `renderTodayMissionCard`, `refreshGoalStatusSummary`, `setupDateRolloverWatcher`.
- `tests/ai-conditional-call-optimization.test.js`: 신규 단위 테스트 스위트.
- `scripts/smoke-test.js`: `#TASK-ES-264` 준수 검증 추가.
- `docs/rules/TICKETS.md`: `#TASK-ES-264` 티켓 등록.
- `reports/TASK-ES-264/claims.json`: 법정 주장서.

---

## 8. [원칙 ⑧] 본질 측정 및 헌법 게이트 (Fact-Based Measurement)
- API 호출 절감률: 무변경 시 100% 차단 (N회 ➔ 0회).
- 모바일 375px 규격 준수: 수평 오버플로우 0px, 터치 타겟 44px 유지.
- 4대 뷰 동시 전파: 목표/기록 변동 시 상태 정합성 100% 유지.
