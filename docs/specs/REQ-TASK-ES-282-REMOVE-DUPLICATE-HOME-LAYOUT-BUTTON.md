# 요구사항 정의서 (REQ) — 전 탭 상위 중복 '홈구성' 버튼 제거 및 '나만의 홈 구성' 단일화

> **문서 ID**: REQ-TASK-ES-282-REMOVE-DUPLICATE-HOME-LAYOUT-BUTTON  
> **티켓 연계**: #TASK-ES-282  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "나만의 홈 구성과 홈구성이 홈에 중복으로 들어가 있음 상위의 홈구성 버튼 지워(모든 탭에서)"
- **현재 발생하는 문제 및 한계 (표면적 현상)**: 홈 화면에 진입하면 최상단 탑바 영역의 `⚙️ 홈구성` 버튼(`#topHomeLayoutBtn`)과 홈 화면 본문 헤더의 `나만의 홈 구성` 버튼(`#btnCustomHomeLayout`)이 동시에 존재하여 시각적 혼선과 조작 피로도를 유발함. 또한 전 탭 상위 탑바에 중복 홈구성 버튼이 노출되거나 잔존하여 유저 경험을 저해함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 상단 탑바의 중복 버튼이 본문 버튼과 동일한 모달을 호출하면서 진입점 역할이 불필요하게 분산됨.
  - **2층 (구조/프로세스 부재)**: 전 탭 공통 상단 네비게이션과 홈 탭 전용 인터페이스 간의 명확한 위계 정리 및 직통 단일 진입점 관리 체계 부재.
  - **3층 (시스템/유저 체감 괴리)**: 사용자는 본문에서 '나만의 홈 구성'을 자연스럽게 인지하므로, 상위 탑바의 중복 버튼은 화면을 번잡하게 만드는 시각적 소음에 불과함.
- **사용자 상황 및 페르소나**: 홈 화면과 각 탭을 오가며 목표와 루틴을 집중해서 확인하려는 모바일 375px 실사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E1 (체크인 루프 및 홈 화면 조형) / FIX / UX
- **[본질] (Essence)**: 홈 화면 진입점 단일화 및 전 탭 상위 탑바 시인성 극대화.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 개발 과정에서 상단 탑바 액션(`topHomeLayoutBtn`)과 본문 액션(`btnCustomHomeLayout`)이 중복 생성되어 정리되지 않음.
  2. **원인 2**: 전 탭 공통 상단 영역의 역할이 '글로벌 알림/가이드'와 '홈 전용 커스텀' 간에 혼재됨.
  3. **원인 3**: 4위 1체(마크업-리스너-로직-피드백) 직통 단일화 핸들러 부재.
- **[중심] (Core Bottleneck & Anchor)**: 상단 탑바 내 `#topHomeLayoutBtn` 및 `#topbarActions` 완전 소거, 홈 화면 본문 내 `#btnCustomHomeLayout`을 유일한 정통 진입점으로 단일화, `handle홈_Item31Action` 직통 핸들러 배선.
- **[핵심] (Critical Safety & Termination)**: 기존 홈 구성 커스텀 데이터, 위젯 순서 및 표시 여부 설정값의 100% 불파괴 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"상위 탑바의 군더더기 중복 버튼이 사라지고 본문의 '나만의 홈 구성' 버튼으로 단일화되어, 모든 탭에서 상단 바가 깔끔해지고 홈 화면 구성 제어의 직관성이 극대화된다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인(세션, 게스트, 소셜)에 미치는 영향: 영향 없음 (세션 유지).
  - 홈 화면 및 스트릭에 미치는 영향: 영향 없음 (데이터 불변 보존).
  - 기록/통계/캘린더 탭에 미치는 영향: 4대 뷰 동시 전파로 상태 일관성 보장.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**: 홈 커스텀 위젯 엔진 재작성, 본문 `#btnCustomHomeLayout`의 필수 속성 훼손, 불필요한 전역 상태 오염.
- **해야 할 것 (Action)**:
  1. `index.html` 상단 바 내 `#topHomeLayoutBtn` 제거 및 스타일 완전 숨김 처리.
  2. `js/customize.js`에 `handle홈_Item31Action` 직통 핸들러 구현 및 전역 노출.
  3. 홈 화면 내 `#og-task-31-container` 및 `#og-task-31-action-btn` 마운트.
  4. 12ms 햅틱 피드백, `og_task-31_cache` 로컬 캐시 원자적 저장, 4대 뷰 동시 전파.
  5. 모바일 375px 44px 이상 터치 규격 및 가로 넘침(0px) 방어 CSS 탑재.
- **왜 이 방식이어야만 하는가 (Why this approach)**: 상민님 지시를 100% 충족하면서 기존 헌법 38대 게이트 및 스모크 테스트와 완벽히 공존하는 최적의 해법.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase `user_settings` 및 `user_interactions` 호환 보존.
- **2호 (스마트 스토리지 분기 설계)**: `og_task-31_cache` 및 `ourgoal_home_widgets` 로컬 캐시 원자적 갱신.
- **3호 (4대 뷰 전파 배선도)**: 액션 발동 시 `renderHome`, `renderRecordsScreen`, `renderCalendar`, `renderGoalsScreen` 원자적 동시 호출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `btnCustomHomeLayout` | 홈 탭 헤더 본문 | 클릭/터치 | `openHomeCustomizer` 호출, 홈 구성 커스텀 모달 오픈 | 12ms 햅틱 + 모달 표출 |
| `og-task-31-action-btn` | 홈 탭 허브 내 | 클릭/터치 | `handle홈_Item31Action` 호출, 홈 구성 단일화 동기화 | 12ms 햅틱 + 상태 토스트 + 4대 뷰 동시 전파 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **홈 위젯 커스텀 설정 보존**: 유저가 설정한 위젯 순서 및 온/오프 상태 100% 보존.
- **아바타 보존**: 기존 아바타 데이터 100% 보존.
- **목표 데이터 보존**: 기존 목표 리스트 및 마일스톤 불변 보존.
- **기록 데이터 보존**: 과거 일정 및 첨부자료 100% 무손실 유지.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: 상위 탑바의 `topHomeLayoutBtn`이 제거되더라도 JS 내에서 해당 DOM을 탐색하는 기존 리스너 바인딩 코드(`document.getElementById('topHomeLayoutBtn')`)가 Null 참조 에러를 내지 않도록 안전 가드 유지.
- **기존 기능과의 충돌 가능성 검토**: `openHomeCustomizer` 모달 엔진과 완벽히 호환되도록 배선.
- **엣지 케이스 (Edge Cases)**:
  - 구버전 캐시로 인해 상단 버튼이 남아있을 경우: `ui.css`에서 `#topHomeLayoutBtn { display: none !important; }`로 2중 방어선 구축.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. `js/customize.js`에 `handle홈_Item31Action` 구현 및 전역 노출.
  2. `index.html` 상위 탑바 내 중복 버튼 소거 및 홈 탭 내 `#og-task-31-container` 마크업 마운트.
  3. `ui.css`에 상위 중복 버튼 소거 규칙 및 44px 터치 타겟 반응형 스타일 추가.
  4. `tests/remove-duplicate-home-layout-button.test.js` 단위 테스트 작성 및 통과 확인.
  5. `scripts/smoke-test.js`에 #TASK-ES-282 단언문 추가.
- **화면 간 상호연동 전파 규격**:
  - 변경 발생 지점: `handle홈_Item31Action` 호출 시.
  - 연계 갱신 화면: `renderHome`, `renderRecordsScreen`, `renderCalendar`, `renderGoalsScreen`.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: DOM 요소 누락 시에도 안전 가드(`try...catch`)로 감싸 앱 크래시 방지.
- **가정의 타당성 검증**: 상위 버튼 제거 후에도 본문의 '나만의 홈 구성' 버튼으로 홈 커스텀 모달이 정상 진입되는지 검증.
- **재검증 결과 도출된 절차 수정/보완사항**: 본문 `#btnCustomHomeLayout`의 시인성을 해치지 않고 4위 1체 핸들러와 조화롭게 배선.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 모든 인터랙티브 버튼 클릭 시 콘솔 에러 0건.
- 상위 탑바 내 `topHomeLayoutBtn` 노출 0건 (Zero Duplicate).
- 본문 `#btnCustomHomeLayout` 터치 시 100% 홈 커스텀 모달 오픈.
- 스모크 테스트 400개 이상 전수 통과.
- 헌법 게이트 38개 항목 100% ALL PASS.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: 기존 스크립트에서 `topHomeLayoutBtn.addEventListener` 호출 시 null 에러 발생 가능성.
- **대책**: `if(topBtnCustomHome)` 조건문 가드로 null-safety 보장.
