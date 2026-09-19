# 요구사항 정의서 (REQ) — 아워골 최고 헌법 15대 조문 감찰 결함 전면 정비

> **문서 ID**: REQ-CONSTITUTIONAL-AUDIT-INTEGRITY-REMEDIATION  
> **티켓 연계**: #TASK-CONSTITUTIONAL-AUDIT-INTEGRITY-REMEDIATION  
> **작성 일시**: 2026-09-19  
> **작성자**: 3ec346fb (Antigravity)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "헌법 적용해서 아워골 전반을 감찰하고 각 세부항목별 문제점을 파악하고 문제의 원인, 해결방안(권장개선법), 문제해결 후 상태를 표로 보고해" ➔ "모두 진행"
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 서비스워커 `sw.js`의 `CACHE_NAME`이 어제(2026-09-18) 버전으로 남아있어 오늘(2026-09-19) 머지된 일정 탭 전면 복구 업데이트가 기존 유저 브라우저에 캐시 고착됨 (헌법 제14조 제3항 위반).
  2. `index.html` 푸터에 외부 이메일 클라이언트를 강제 실행하는 `mailto:ourgoal.support@gmail.com` 링크가 잔존하여 클릭 시 발송 실패 및 사용자 이탈 유발 (헌법 제3조 제4항, 제14조 제1항 위반).
  3. 체크인 생성 시 홈, 기록, 통계, 캘린더 화면이 원자적으로 동시 갱신되지 않고 `saveProfile`만 호출되어 화면 간 스트릭 및 상태 불일치 발생 (헌법 제1조 제4항 제5호, 제15조 제6항 제3호 위반).
  4. 클릭 무결성 검증기 `verify-all-clicks.js`가 19개 미배선 경고를 출력하면서도 `ALL PASS (exit 0)`로 처리하는 허상 지표(Vanity Metrics) 방조 (헌법 제4조 제1항 제5호, 제7조 제1항 위반).
  5. 런타임 전역 스코프에 `var MOCK_PEOPLE = SIM_PERSONAS;`가 노출되어 가짜 페르소나 의존 위험이 잠재함 (헌법 제1조 제4항 제6호, 제13조 제2항 위반).
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 캐시 무효화 네임 불일치로 인한 구버전 화면 서빙, 외부 `mailto:` 링크 클릭 시 미작동, 뷰 렌더러 간 동시 전파 디스패처 단절.
  - **2층 (구조/프로세스 부재)**: 커밋 시 `CACHE_NAME` 동기화 여부 및 `mailto:` 검출을 기계적으로 막는 게이트키퍼 정적 방화벽의 사각지대 존재. `verify-all-clicks.js`에서 `data-*` 이벤트 위임 매핑 미비로 경고를 경시하고 빌드 통과시키는 느슨한 검증 구조.
  - **3층 (시스템/유저 체감 괴리)**: 체크인 직후 캘린더나 통계 화면으로 이동하면 방금 작성한 기록이 바로 반영되지 않아 유저는 "기록이 날아갔나?"라는 실존적 불안과 앱 불신을 체감함.
- **사용자 상황 및 페르소나**:
  - PWA 설치 유저 및 모바일 웹 유저가 업데이트 후에도 구버전 캐시를 보거나, 체크인 후 탭 전환 시 스트릭 불일치를 겪는 모든 실사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: FIX & INFRA (헌법 제1조 제3항)
- **[본질] (Essence)**:
  - 겉모습은 단위 테스트가 100% 통과(329 PASS)한 것처럼 보이나, 실제로는 캐시 고착, 외부 앱 의존 링크, 뷰 간 상태 불일치, 허상 지표 게이트키퍼가 유저의 신뢰와 헌법적 무결성을 갉아먹고 있는 구조적 위헌 상태의 척결.
  - 3대 철학 심사:
    1. **무공해성**: 외부 이메일 앱 강제 호출 피로를 없애고 100% 인앱 완결 지원.
    2. **RPG식 체감**: 체크인 즉시 4대 뷰에 스트릭과 경험치가 0ms로 동시 전파되어 즉각적인 자기효능감 복원.
    3. **동류 연대**: 가짜 목업 페르소나를 런타임에서 완전히 제거하여 순수 실사용자 연대 확립.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 배포 워크플로에서 `index.html` 변경 시 `sw.js`의 `CACHE_NAME`을 당일 날짜로 동시 범프하지 않은 프로세스 누락.
  2. **원인 2**: 데이터 변경 시 4대 뷰를 일괄 호출하는 단일 진실 공급원(SSOT) 뷰 브로드캐스터 부재.
  3. **원인 3**: `verify-all-clicks.js`의 정적 분석기가 `data-*` 속성 기반 이벤트 위임을 파싱하지 못해 경고를 발생시키면서도 무조건 `exit 0`으로 처리한 허상 지표 관행.
- **[중심] (Core Bottleneck & Anchor)**:
  - 4대 연계 뷰 동시 전파 디스패처 `dispatchFullViewPropagation()`의 부재 및 `verify-all-clicks.js`의 정밀 매핑 부재.
- **[핵심] (Critical Safety & Termination)**:
  - `sw.js` 캐시 갱신을 통한 최신 코드 즉시 서빙, `mailto:` 제거 및 인앱 완결, 4대 뷰 원자적 동시 전파, 클릭 검증기 exit 1 물리 차단 배선.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 체크인을 등록하거나 일정을 추가했을 때, 새로고침이나 재접속 없이도 홈의 히트맵, 기록의 타임라인, 캘린더의 일정 뱃지, 통계의 합계가 단 1초의 오차도 없이 즉시 갱신되어 완벽한 안정감을 체감한다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인(세션, 게스트, 소셜) 영향: 게스트 및 소셜 세션 100% 불변 보존.
  - 홈 화면 및 스트릭 영향: 체크인 즉시 홈 스트릭 및 히트맵 0ms 동기화 보장.
  - 기록/통계/캘린더 탭 영향: 기존 렌더러 함수 손상 없이 동시 전파 파이프라인만 상호 연결.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 기존 정상 작동 렌더러(`renderHome`, `renderCalendarScreen` 등) 내부 로직의 임의 재작성 금지.
  - 외부 라이브러리 추가나 파일 대규모 분할 금지.
  - 무결성 검증 기준을 완화하여 합격시키는 행위 영구 금지.
- **해야 할 것 (Action)**:
  - `sw.js` `CACHE_NAME`을 당일 티켓 버전(`ourgoal-shell-v20260919-constitutional-audit-integrity-remediation`)으로 즉시 범프.
  - `index.html` 푸터의 `mailto:`를 제거하고 인앱 문의 모달 호출 함수(`openInquiryModal()`) 및 클립보드 복사 안내로 치환.
  - `dispatchFullViewPropagation()` 단일 디스패처 함수를 구축하고 `saveQuickCheckin` 등 핵심 저장소에 배선.
  - `verify-all-clicks.js`에 `data-*` 이벤트 위임 매핑 로직을 탑재하고 미배선 버튼 적발 시 즉각 `process.exit(1)`로 차단.
  - `verify-integrity-gate.js`에 `sw.js` 당일 캐시 네임 검사 및 `mailto:` 부재 검사를 기계적으로 배선.
  - 전역 스코프의 `var MOCK_PEOPLE` 제거 및 시뮬레이션 격리.
- **왜 이 방식이어야만 하는가 (Why this approach)**:
  - 헌법 15대 조문에서 적발된 결함들을 외과수술적 최소 변경으로 완벽히 치유하면서, 게이트키퍼를 실질적 방화벽으로 승격시킬 수 있는 유일하고 필연적인 방안이기 때문.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 신규 컬럼/테이블 추가 없음. 기존 Supabase `checkins`, `goals`, `users` 원장 그대로 유지.
- **2호 (스마트 스토리지 분기 설계)**: 기존 localStorage 백업 키(`ourgoal_records_backup_`, `ourgoal_goals_backup_`)와 원격 Supabase DB 간 무손실 연동 유지.
- **3호 (4대 뷰 전파 배선도)**: 데이터 뮤테이션 발생 즉시 `dispatchFullViewPropagation(['home', 'records', 'stats', 'calendar'])`를 통해 `renderHome()`, `renderRecordsScreen()`, `renderCalendarScreen()`, `universalStatsRender()`를 원자적 동시 호출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `footSupportEmailBtn` | 푸터 영역 | 클릭/터치 | 지원 이메일 클립보드 복사 및 인앱 문의 모달 실행 | 토스트: "공식 지원 이메일이 복사되었습니다" |
| `data-setschedule` | 일정 설정 버튼 | 클릭/터치 | 상위 이벤트 위임에 의해 일정 등록 모달 오픈 | 모달 정상 노출 및 콘솔 에러 0건 |
| `data-encycl-cat` | 백과 카테고리 칩 | 클릭/터치 | 상위 이벤트 위임에 의해 해당 카테고리 필터링 | 탭 전환 및 필터링 리스트 표출 |
| `data-taskresult` / `data-msresult` | 태스크/마일스톤 결과 뱃지 | 클릭/터치 | 결과 입력 팝업 토글 | 상태 변경 및 4대 뷰 동시 전파 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 기존 아바타 설정값 및 320종 페르소나 데이터 무손실 보존.
- **목표 데이터 보존**: 기존 목표 목록, 마일스톤, 태스크 100% 유지.
- **기록 데이터 보존**: 과거 체크인, 스트릭, AI 피드백 100% 유지.
- **화면 구성 세팅값 보존**: 다크/라이트 테마, 탭 상태 100% 유지.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - `dispatchFullViewPropagation`이 너무 빈번하게 호출될 경우 화면 깜빡임이 생길 수 있으므로, 비동기 microtask 또는 requestAnimationFrame 디바운스를 적용하여 렌더링 성능을 보장한다.
- **기존 기능과의 충돌 가능성 검토**:
  - 기존 `renderHome()` 등 개별 함수 시그니처를 변경하지 않고 상위에서 감싸 호출하므로 충돌 가능성 0%.
- **엣지 케이스 (Edge Cases)**:
  - 오프라인 상태: Supabase 실패 시에도 로컬 상태 및 4대 뷰는 즉시 갱신되고 `offlineQueue`에 정상 적재됨.
  - 클립보드 API 미지원 환경: `document.execCommand('copy')` 폴백 처리하여 이메일 복사 보장.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. [1단계]: `sw.js` `CACHE_NAME`을 2026-09-19 신규 티켓 버전으로 범프. (에이전트 / 1분)
  2. [2단계]: `index.html` 푸터 내 `mailto:` 링크를 인앱 클립보드 복사 및 문의 모달 배선으로 수정. (에이전트 / 2분)
  3. [3단계]: `index.html`에 `dispatchFullViewPropagation()` 함수 정의 및 `saveQuickCheckin`에 배선. (에이전트 / 3분)
  4. [4단계]: `scripts/verify-all-clicks.js`에 `data-*` 이벤트 위임 정밀 매핑 탑재 및 미배선 시 exit 1 차단 배선. (에이전트 / 3분)
  5. [5단계]: `scripts/verify-integrity-gate.js`에 `sw.js` 당일 캐시 검사 및 `mailto:` 영구 배제 검사 추가. (에이전트 / 2분)
  6. [6단계]: `index.html` 내 전역 `var MOCK_PEOPLE` 제거/정리. (에이전트 / 1분)
  7. [7단계]: `npm test` 및 게이트키퍼 전수 실행하여 100% ALL PASS 확인. (에이전트 / 2분)
- **화면 간 상호연동 전파 규격**:
  - 데이터 변경 발생 지점: `saveQuickCheckin`, 목표 조작
  - 즉시 갱신 화면:
    1. 홈 화면 (`renderHome`): 스트릭 카운트 및 당일 달성 카드 갱신
    2. 기록 탭 (`renderRecordsScreen`): 타임라인 카드 갱신
    3. 통계 탭 (`universalStatsRender`): 통계 차트 및 콕핏 갱신
    4. 캘린더 탭 (`renderCalendarScreen`): 달력 날짜 도트 및 일정 갱신

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**:
  - `dispatchFullViewPropagation()` 내 특정 화면 렌더러에서 예외 발생 시 다른 화면 갱신이 중단되는 SPOF 방지를 위해 각 렌더러 호출을 독립 `try/catch`로 보호하고 로깅.
- **가정의 타당성 검증**:
  - `verify-all-clicks.js`가 `data-*` 속성을 검증할 때 잘못된 속성까지 통과시킬 위험을 방지하기 위해 실제 이벤트 리스너에 명시된 속성 리스트만 엄격 매칭.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - `dispatchFullViewPropagation` 내 각 뷰 렌더러 호출에 개별 예외 방어막을 씌워 특정 뷰의 일시적 오류가 전체 뷰 전파를 차단하지 못하도록 절차 보완.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- `scripts/verify-all-clicks.js` 경고 0건 및 exit 0 정상 통과.
- `index.html` 내 `mailto:` 검색 결과 0건.
- `sw.js` `CACHE_NAME` 당일 날짜(20260919) 갱신 확인.
- `scripts/verify-integrity-gate.js` 100% ALL PASS.
- `npm test` 330개 이상 테스트 전수 통과 (0 failure).

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **잠재적 블로커**:
  - `verify-all-clicks.js` 정밀화 과정에서 실제 미배선 버튼이 추가 발견될 경우.
- **사전 방어 및 우회 로직**:
  - 발견된 미배선 버튼에 대해 즉시 4위 1체 리스너와 핸들러를 보강하여 완전 배선.
- **재검증 트리거**:
  - `npm test` 실패 시 즉시 [원칙 ③ 해결방식] 및 [원칙 ⑤ 절차]로 복귀하여 diff 점검 및 재실행.
