# 요구사항 정의서 (REQ) — 컴포넌트 모듈화 (효과 시너지, 개발 효율화, UI 및 사용자경험 개선)

> **문서 ID**: REQ-TASK-ES-275-COMPONENT-MODULARIZATION  
> **티켓 연계**: #TASK-ES-275  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "컴포넌트 모듈화 → 효과 시너지, 효율화, UI 및 사용자경험 개선"
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 아워골의 공통 컴포넌트 시스템(`js/components.js`)에 모듈화 허브 컴포넌트 및 직통 트랜잭션 배선이 완결되지 않아 여러 화면 간 시너지 창출과 개발 효율화가 제한됨.
  2. 공통 모듈 실행 시 4대 뷰(홈, 캘린더, 목표, 기록)로 원자적 상태가 즉시 전파되지 않아 데이터 일관성이 저해될 수 있음.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 설정 및 공통 화면에 컴포넌트 모듈화 허브 마크업(`#og-task-23-container`, `#og-task-23-action-btn`)이 누락되어 직통 상호작용 부재.
  - **2층 (구조/프로세스 부재)**: 4위 1체(마크업-리스너-로직-피드백) 배선과 오프라인 회복탄력성 스토리지 캐시 결여.
  - **3층 (시스템/유저 체감 괴리)**: 공통 인프라가 유저의 인터랙션에 즉각 반응하지 못하고 모바일 환경에서 터치 영역 미달 위험 존재.
- **사용자 상황 및 페르소나**: 최신화된 일관된 UI와 빠른 반응 속도로 아워골의 모든 기능을 유기적으로 제어하고자 하는 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `INFRA / UX` (기반 인프라 구축 및 사용자 경험 극대화)
- **[본질] (Essence)**: 공통 컴포넌트의 모듈화를 통해 일관된 UI 조형을 확립하고, 직통 비즈니스 로직과 4대 뷰 원자적 전파로 개발 효율화 및 유저 체감 시너지를 완결하는 시스템.
- **[원인] (Root Causes - 기저 원인 2가지)**:
  1. **원인 1**: `js/components.js` 내에 노션 23항 규격에 부합하는 모듈화 허브 렌더러 및 직통 트랜잭션 핸들러 미탑재.
  2. **원인 2**: 트랜잭션 완료 후 4대 연계 뷰 동시 전파(`renderCalendar`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen`) 배선 부재.
- **[중심] (Core Bottleneck & Anchor)**: 모바일 375px 좁은 뷰포트에서 터치 44px 이상을 보장하며 가로 넘침(Overflow) 0px을 방어하는 반응형 컴포넌트 조형.
- **[핵심] (Critical Safety & Termination)**: 오프라인 및 Supabase 두절 시에도 `og_task-23_cache` 로컬 캐시로 안전하게 폴백되는 회복탄력성 보증.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 컴포넌트 모듈화 허브에서 동기화 버튼을 탭하면, 12ms 햅틱 진동과 함께 즉각 피드백 토스트가 표출되고 4대 뷰가 원자적으로 갱신되어 최적의 앱 일관성을 체감한다."*
- **기존 전체 기능 영향도 분석**:
  - 기존 5대 UI 컴포넌트(배지, 통계카드, 프로그레스바, 모달셸, 엠프티스테이트) 100% 무손실 보존.
  - 사용자 계정, 아바타, 목표, 기록 데이터에 무영향.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**: 기존 `OurgoalComponents`의 메서드를 임의 수정하거나 브레이킹 체인지를 가하는 행위 금지.
- **해야 할 것 (Action)**: `task23ModularComponent` 렌더러 추가, `handle전체공통_Item23Action` 직통 핸들러 배선, `ui.css` 반응형 토큰 탑재, `index.html` 설정 탭 인프라 섹션에 마운트.
- **왜 이 방식이어야만 하는가 (Why this approach)**: 단일 모듈 내에서 4위 1체를 완결하고 전역 네임스페이스와 모듈 시스템 양쪽을 지원하여 최고의 유지보수성을 달성하기 위함.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase `user_interactions` 테이블에 `interaction_key: 'task-23'`, `metadata: { ticket: '23', state: 'completed' }` 적재.
- **2호 (스마트 스토리지 분기 설계)**: 네트워크 두절 시 `localStorage.getItem('og_task-23_cache')`로 무손실 즉각 폴백.
- **3호 (4대 뷰 전파 배선도)**: 트랜잭션 즉시 `renderCalendar()`, `renderGoalsScreen()`, `renderHome()`, `renderRecordsScreen()` 동시 전파.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#og-task-23-action-btn` | 설정 탭 인프라 허브 | 클릭/터치 | `handle전체공통_Item23Action(event)` 호출 | 12ms 햅틱, 디바운스, 스토리지 저장, 토스트 표출, 4대 뷰 전파 |

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: 버튼 텍스트가 모바일 375px에서 길어질 수 있으므로 `box-sizing: border-box`, 미디어 쿼리 `width: 100%`를 강제하여 가로 넘침을 원천 차단.
- **기존 기능과의 충돌 가능성 검토**: 독립 네임스페이스 및 고유 ID(`#og-task-23-container`)를 사용하여 기존 설정 폼과의 충돌 제로.
- **엣지 케이스 (Edge Cases)**:
  - 브라우저 진동 API 미지원 환경: 예외 발생 없이 무음 패스.
  - 더블 클릭: 즉시 `disabled = true` 처리로 중복 트랜잭션 방어.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. [단계 1]: `js/components.js`에 `OurgoalComponents.task23ModularComponent` 템플릿 및 `handle전체공통_Item23Action` 정의 (1분)
  2. [단계 2]: `ui.css`에 `#og-task-23-container`, `#og-task-23-action-btn` 스타일 및 375px 반응형 추가 (1분)
  3. [단계 3]: `index.html` 설정 탭 인프라 섹션에 컴포넌트 마크업 마운트 (1분)
  4. [단계 4]: `tests/component-modularization.test.js` 단위 테스트 작성 및 검증 (1분)
  5. [단계 5]: `scripts/smoke-test.js` 회귀 검증 및 헌법 게이트 통과 (1분)
- **화면 간 상호연동 전파 규격**:
  - 트리거 지점: `#og-task-23-action-btn` 클릭
  - 즉시 갱신 연계 화면:
    1. 홈 화면 (`renderHome`)
    2. 캘린더 화면 (`renderCalendar`)
    3. 목표 화면 (`renderGoalsScreen`)
    4. 기록 화면 (`renderRecordsScreen`)

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: Supabase 호출 실패 시 앱이 멈추지 않고 `catch` 블록에서 `localStorage`로 즉시 우회 저장되도록 안전 처리 완료.
- **가정의 타당성 검증**: 브라우저 환경 및 Node.js 테스트 환경 양쪽에서 안전하게 실행되도록 `win` 및 `doc` 객체 방어 로직 완비.
- **재검증 결과 도출된 절차 수정/보완사항**: 디바운스 버튼 상태를 `finally`에서 항상 복원하여 네트워크 오류 시에도 버튼이 영구 비활성화되지 않도록 보장.

---

## 7. [원칙 ⑦] 시각화 및 모바일 규격 명세
- **모바일 375px 터치 타겟**: `#og-task-23-action-btn`의 최소 바운딩 박스를 `min-width: 44px; min-height: 44px;`로 지정하여 WCAG AAA 접근성 완비.
- **가로 스크롤 방어**: `overflow-x: hidden; box-sizing: border-box;` 적용으로 375px 실기기 가로 넘침 0px 보장.

---

## 8. [원칙 ⑧] GitHub 법정(court) 심사 단언문 (Court Claims)
- **Claim 1**: `#og-task-23-container` 컨테이너가 DOM 트리에 누락 없이 렌더링되며 375px 모바일 뷰포트에서 가로 스크롤 오버플로우가 0px임을 검증.
- **Claim 2**: `#og-task-23-action-btn` 버튼의 터치 바운딩 박스가 44px × 44px 이상임을 실측 검증.
- **Claim 3**: `#og-task-23-action-btn` 클릭 시 직통 함수 `handle전체공통_Item23Action`가 트리거되어 상태 페이로드가 스토리지에 정상 저장됨을 검증.
- **Claim 4**: 처리 완료 즉시 시각 토스트 알림이 표출되고 4대 뷰 동시 전파 함수가 무조건 호출됨을 실측 검증.
- **Claim 5**: 네트워크 오프라인 상태에서도 에러로 중단되지 않고 로컬 캐시에 무손실 적재됨을 검증.
