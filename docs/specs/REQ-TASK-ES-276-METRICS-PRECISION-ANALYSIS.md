# 요구사항 정의서 (REQ) — 측정지표 분석할 항목별 차등 지정 및 정밀화·고도화

> **문서 ID**: REQ-TASK-ES-276-METRICS-PRECISION-ANALYSIS  
> **티켓 연계**: #TASK-ES-276  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "측정지표 분석할 항목별로 다르게 지정, 정밀화 고도화"
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 기록/통계 탭에서 다양한 실천 항목(운동, 공부, 독서, 생활루틴 등)에 대해 측정지표 분석이 획일화되어 있거나 항목별 맞춤 분석 기능과의 직통 상호작용 배선이 부재함.
  2. 사용자가 항목별로 특화된 측정지표(시간, 횟수, 거리, 무게 등)의 분석 허브를 원클릭으로 조작하고 영속화할 수 있는 마크업과 4위 1체 배선이 누락되어 있음.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 기록/스톱워치 화면에 `#og-task-24-container` 및 `#og-task-24-action-btn` DOM 요소가 미배치되어 이벤트 연결 단절.
  - **2층 (구조/프로세스 부재)**: 항목별 차등 측정지표 데이터의 스토리지 원장 저장 및 4대 뷰 동시 전파 파이프라인 결여.
  - **3층 (시스템/유저 체감 괴리)**: 유저는 자신의 고유한 실천 항목에 맞춰 정밀화된 분석 결과를 원하지만 조작과 시각적 피드백이 연계되지 못함.
- **사용자 상황 및 페르소나**: 운동(세트·무게·페이스)과 공부(순공시간·몰입도) 등 서로 다른 성격의 목표를 동시에 추적하며 항목별로 차등화된 정밀 분석을 확인하고자 하는 갓생러.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `E2 / UX` (기록 회고 루프 및 실존적 데이터 자산화)
- **[본질] (Essence)**: 실천 항목별 고유한 특성을 반영하여 측정지표를 차등 지정하고 정밀화·고도화함으로써 유저가 흘러간 시간을 객관적 숫자로 확인하고 실질적 성취를 체감하도록 돕는 회고 시스템.
- **[원인] (Root Causes - 기저 원인 2가지)**:
  1. **원인 1**: `js/records-stats.js` 내에 노션 24항 규격의 측정지표 정밀화 직통 트랜잭션 핸들러(`handle기록스톱워치_Item24Action`) 부재.
  2. **원인 2**: 기록 탭 내 고유 DOM 마크업 및 4대 뷰 원자적 동시 전파(`renderCalendar`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen`) 연계 미비.
- **[중심] (Core Bottleneck & Anchor)**: 모바일 375px 실기기에서 최소 터치 타겟 44px × 44px 이상을 확보하며 가로 넘침(Overflow) 0px을 방어하는 반응형 UI 조형.
- **[핵심] (Critical Safety & Termination)**: 오프라인 및 Supabase 두절 시에도 `og_task-24_cache` 로컬 캐시로 안전하게 폴백되는 무손실 회복탄력성 보증.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 기록 탭에서 측정지표 정밀화 동기화 버튼을 누르면 12ms 햅틱 진동과 함께 항목별 차등 지표가 즉시 적용·영속화되고, 피드백 토스트와 함께 4대 뷰가 동시 갱신되어 나만의 정밀 분석 대시보드를 체감한다."*
- **기존 전체 기능 영향도 분석**:
  - 기존 통계 히트맵, 리캡, 스톱워치 기록 100% 무손실 보존.
  - 사용자 프로필, 목표, 계정 데이터에 영향 없음.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**: 기존 `records-stats.js`의 통계 로직이나 히트맵 렌더러를 훼손하는 전체 덮어쓰기 금지.
- **해야 할 것 (Action)**: `handle기록스톱워치_Item24Action` 직통 핸들러 신설, `index.html` 기록 탭 통계 영역에 `#og-task-24-container` 마운트, `ui.css` 반응형 토큰 배선.
- **왜 이 방식이어야만 하는가 (Why this approach)**: 기존에 잘 동작하는 통계 컴포넌트를 온전히 계승하면서, 4위 1체(마크업-리스너-로직-피드백)를 완결하여 가장 안전하고 효율적으로 정밀 분석을 구축할 수 있음.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase `user_interactions` 테이블에 `interaction_key: 'task-24'`, `metadata: { ticket: '24', state: 'completed' }` 적재.
- **2호 (스마트 스토리지 분기 설계)**: 오프라인/실패 시 `localStorage.getItem('og_task-24_cache')`로 무손실 즉각 폴백.
- **3호 (4대 뷰 전파 배선도)**: 실행 즉시 `renderCalendar()`, `renderGoalsScreen()`, `renderHome()`, `renderRecordsScreen()` 동시 전파.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#og-task-24-action-btn` | 기록 탭 측정지표 허브 | 클릭/터치 | `handle기록스톱워치_Item24Action(event)` 호출 | 12ms 햅틱, 디바운스, 스토리지 저장, 토스트 표출, 4대 뷰 전파 |

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: 기록 탭 상단 카드 영역의 여백이 좁을 수 있으므로 마진을 8px로 압축하고 모바일 375px에서 버튼 너비를 100%로 맞춰 조작 편의 극대화.
- **기존 기능과의 충돌 가능성 검토**: 독립 고유 ID `#og-task-24-container`와 네임스페이스 격리로 기존 차트 및 히트맵과의 스타일/스크립트 충돌 제로.
- **엣지 케이스 (Edge Cases)**:
  - 진동 미지원 기기: 안전 try-catch로 무음 진행.
  - 네트워크 단절: 로컬 스토리지 무손실 적재 및 에러 없이 완결.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. [단계 1]: `js/records-stats.js`에 `handle기록스톱워치_Item24Action` 함수 정의 및 전역 window 노출 (1분)
  2. [단계 2]: `ui.css`에 `#og-task-24-container`, `#og-task-24-action-btn` 스타일 및 375px 반응형 추가 (1분)
  3. [단계 3]: `index.html` 기록 탭 통계 상단 영역에 `#og-task-24-container` 마크업 마운트 (1분)
  4. [단계 4]: `tests/records-stats-metrics.test.js` 단위 테스트 작성 및 통과 검증 (1분)
  5. [단계 5]: `scripts/smoke-test.js` 및 헌법 게이트 100% 통과 확인 (1분)
- **화면 간 상호연동 전파 규격**:
  - 트리거 지점: `#og-task-24-action-btn` 클릭
  - 즉시 갱신 연계 화면:
    1. 홈 화면 (`renderHome`)
    2. 캘린더 화면 (`renderCalendar`)
    3. 목표 화면 (`renderGoalsScreen`)
    4. 기록 화면 (`renderRecordsScreen`)

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: Supabase 트랜잭션 오류 시 `catch` 블록에서 `localStorage`로 즉시 우회하여 저장 중단 방지.
- **가정의 타당성 검증**: 브라우저와 Node.js 실행 환경 양쪽에서 안전하도록 `win` 및 `doc` 방어 참조 구비.
- **재검증 결과 도출된 절차 수정/보완사항**: `finally` 블록에서 액션 버튼의 `disabled = false` 복원을 보장하여 버튼 영구 잠금 현상 방지.

---

## 7. [원칙 ⑦] 시각화 및 모바일 규격 명세
- **모바일 375px 터치 타겟**: `#og-task-24-action-btn`에 `min-width: 44px; min-height: 44px;` 적용하여 WCAG AAA 접근성 완비.
- **가로 스크롤 방어**: `box-sizing: border-box; overflow-x: hidden;` 적용으로 375px 실기기 가로 넘침 0px 보장.

---

## 8. [원칙 ⑧] GitHub 법정(court) 심사 단언문 (Court Claims)
- **Claim 1**: `#og-task-24-container` 컨테이너가 DOM 트리에 누락 없이 렌더링되며 375px 모바일 뷰포트에서 가로 스크롤 오버플로우가 0px임을 검증.
- **Claim 2**: `#og-task-24-action-btn` 버튼의 터치 바운딩 박스가 44px × 44px 이상임을 실측 검증.
- **Claim 3**: `#og-task-24-action-btn` 클릭 시 직통 함수 `handle기록스톱워치_Item24Action`가 트리거되어 상태 페이로드가 스토리지에 정상 저장됨을 검증.
- **Claim 4**: 처리 완료 즉시 시각 토스트 알림이 표출되고 4대 뷰 동시 전파 함수가 무조건 호출됨을 실측 검증.
- **Claim 5**: 네트워크 오프라인 상태에서도 에러로 중단되지 않고 로컬 캐시에 무손실 적재됨을 검증.
