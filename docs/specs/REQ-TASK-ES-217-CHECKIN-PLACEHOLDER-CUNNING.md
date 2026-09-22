# 요구사항 정의서 (REQ) — 오늘의 3초 체크인 목표 커닝페이퍼 칩 플레이스홀더 가이드화

> **문서 ID**: REQ-TASK-ES-217-CHECKIN-PLACEHOLDER-CUNNING  
> **티켓 연계**: #TASK-ES-217  
> **작성 일시**: 2026-09-23  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "88번부터 진행" (노션 생각 메모장 88번: "오늘의 3초 체크인에서 내 목표와 관련된 버튼들이 나오는데 이걸 누르면 어떤 내용을 쓰면 좋은지 실제 타이핑창에 글자가 들어가는게 아니라, 그 타이핑창의 백그라운드로 어떤 항목들을 적으면 차후에 데이터로 활용하기에 좋은지 예시를 실제 글자가 안들어가면서 보여주는거야 지금 예: 오늘 실천한 멋진 일을 한줄로 적어보세요! 가 들어가 있는 것 처럼.")
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 홈 탭 "오늘의 3초 체크인" 영역에서 "내 목표 맞춤 커닝페이퍼" 칩 버튼을 클릭하면, applyQuickCunningText(text) 함수가 captureInput 텍스트에어리어의 .value 프로퍼티에 텍스트를 강제로 주입함.
  - 사용자는 자신이 직접 타이핑하려 할 때, 이미 채워진 텍스트를 백스페이스 키로 일일이 지우고 써야 하는 번거로운 지움 피로도를 겪게 됨.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 커닝페이퍼 칩 클릭 이벤트가 inp.placeholder를 변경하지 않고 inp.value에 직접 쓰기 작업을 수행함.
  - **2층 (구조/프로세스 부재)**: 칩 클릭 시 가이드 예시 안내 의도와 실제 폼 전송 페이로드 간의 역할 분리가 미비하여, 클릭 즉시 폼이 "입력 완료" 상태로 오인됨.
  - **3층 (시스템/유저 체감 괴리)**: 사용자는 "영감이나 예시 힌트를 얻으려고 눌렀는데 왜 내 의사와 상관없이 글자가 다 채워져서 귀찮게 지우게 만드느냐"는 불편을 느낌.
- **사용자 상황 및 페르소나**:
  - 오늘 실천을 3초 만에 빠르게 남기려는 사용자. 목표 칩을 탭했을 때 영감을 얻고 곧바로 타이핑을 시작하길 원함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E1 (체크인 루프) & FIX (버그 수정)
- **[본질] (Essence)**:
  - 사용자가 실천을 기록하는 찰나의 순간에 단 1초의 지체나 불필요한 조작(지움 클릭) 없이 즉시 생각과 다짐을 타이핑할 수 있도록 보장하는 극저저항 모바일 입력 인터랙션의 완성.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. applyQuickCunningText 내부에서 inp.value = text 할당문 잔존.
  2. 안내 문구가 (탭하면 자동 입력 ⚡)으로 표기되어 있어 플레이스홀더 가이드 의도와 불일치.
  3. 칩 클릭 시 활성 상태(Active visual feedback)가 명확히 인디케이터로 표현되지 않아 어떤 가이드가 선택되었는지 불분명.
- **[중심] (Core Bottleneck & Anchor)**:
  - captureInput.placeholder에 동적으로 예: [가이드문구]를 주입하고 captureInput.value는 비워둔 채 즉시 포커스하는 4위 1체 배선.
- **[핵심] (Critical Safety & Termination)**:
  - 칩을 눌러 플레이스홀더만 설정된 상태에서 사용자가 텍스트를 적지 않고 "기록"을 누를 때 빈 문자열이 전송되지 않도록 방어하는 유효성 검사 유지.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 홈 탭에서 내 목표 커닝페이퍼 칩을 눌렀을 때, 입력창에 지워야 할 글자가 채워지지 않고 연한 회색의 가이드 예시 힌트가 우아하게 나타나며 커서가 즉시 깜빡여, 사용자는 지움 피로 없이 3초 만에 자신만의 실천을 타이핑할 수 있다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인(세션, 게스트, 소셜)에 미치는 영향: 영향 없음 (순수 클라이언트 UI 입력 인터랙션).
  - 홈 화면 및 스트릭에 미치는 영향: 체크인 완료 시 기존 스트릭 계산 및 4대 뷰 전파 그대로 유지.
  - 기록/통계/캘린더 탭에 미치는 영향: 체크인 저장 후 정상 전파 보장.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 목표 칩의 데이터 모델이나 기존 data-cunningtext 속성을 파괴하지 말 것.
  - 3초 체크인의 음성 녹음(STT)이나 사진 첨부 등 기존 정상 동작 파이프라인을 손상시키지 말 것.
- **해야 할 것 (Action)**:
  - applyQuickCunningText(text)에서 inp.value 주입 제거, inp.placeholder = "예: " + text 배선.
  - 클릭된 칩의 시각적 활성 상태(Active Ring / 배경 강조) 피드백 제공.
  - 기록 저장 완료 시 기본 플레이스홀더(예: 오늘 실천한 멋진 일을 한 줄로 적어보세요)로 자동 복원.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 신규 컬럼 없음 (기존 records 테이블 text 필드 그대로 활용).
- **2호 (스마트 스토리지 분기 설계)**: 텍스트 기록으로 localStorage 및 Supabase records 원장 동시 저장.
- **3호 (4대 뷰 전파 배선도)**: 저장 시 dispatchFullViewPropagation 및 renderHome, renderRecordsScreen, renderStatsScreen, renderCalendar 연계 호출 보존.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| .btn-quick-chip | 홈 탭 체크인 카드 | 클릭/터치 | inp.placeholder에 예시 텍스트 설정, inp.value 공백 유지, inp.focus() | 15ms 햅틱 + 토스트 알림 + 칩 테두리 강조 |
| #captureInput | 홈 탭 체크인 카드 | 타이핑 | 사용자 입력값 실시간 반영 | placeholder는 타이핑 시 자동 가려짐 |
| #captureSave | 홈 탭 체크인 카드 | 클릭/터치 | 실 텍스트 검증 후 체크인 저장 | 공백일 경우 전송 차단 (placeholder 전송 0건) |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 기존 아바타 설정값 및 EXP 100% 보존.
- **목표 데이터 보존**: 기존 목표 리스트, 마일스톤 불변 보존.
- **기록 데이터 보존**: 과거 체크인 기록 및 스트릭 100% 보존.
- **화면 구성 세팅값 보존**: 테마, 홈 화면 구성 설정 유지.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - 플레이스홀더 길이가 모바일 375px 화면에서 너무 길면 말줄임 처리될 수 있음 -> 가이드 텍스트를 핵심 요약형으로 명확히 전달.
- **기존 기능과의 충돌 가능성 검토**:
  - 음성 마이크로 입력 시 baseText 충돌 여부 검토: 음성은 ta.value에 추가되므로 placeholder와 독립적으로 정상 동작함.
- **엣지 케이스 (Edge Cases)**:
  - 이미 사용자가 텍스트를 일부 타이핑한 상태에서 칩을 누른 경우: 사용자 입력값이 있으면 불필요한 초기화 없이 placeholder만 갱신.
  - 전송 버튼 클릭 시 inp.value가 비어있으면 inp.placeholder가 전송되지 않고 차단됨 확인.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. index.html 내 applyQuickCunningText(text) 함수 수정 (inp.value 제거, inp.placeholder 설정 및 포커스 배선).
  2. renderQuickCheckinGuideChips() 헤더 캡션 동기화 및 칩 클릭 시 활성 스타일 배선.
  3. captureSave 완료 후 기본 플레이스홀더 복원 로직 배선.
  4. 로컬 스모크 테스트 및 CDP 실측 검증.
- **화면 간 상호연동 전파 규격**:
  - 체크인 저장 완료 시 기존 4대 연계 뷰(renderHome, renderRecordsScreen, renderStatsScreen, renderCalendar) 동시 전파.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점(SPOF) 검증**:
  - captureInput 엘리먼트가 존재하지 않을 경우 if(!inp) return; 가드로 무중단 보호.
- **재검증 시 도출된 수정사항**:
  - 체크인 제출 후 입력창이 비워질 때 플레이스홀더를 초기 기본 문구로 원복시켜야 다음 체크인 시 혼선이 없음.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Execution & Success Metrics)
- **측정 가능한 확인 기준**:
  1. 커닝페이퍼 칩 클릭 시 inp.value === "" 이고 inp.placeholder가 "예: "로 시작하는가?
  2. 칩 클릭 즉시 키보드 포커스가 입력창에 맺히는가?
  3. 사용자가 글자를 지울 필요 없이 바로 타이핑 가능한가?
  4. npm test 및 무결성 게이트 38/38 통과하는가?

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**:
  - CSS에서 ::placeholder 스타일이 너무 옅거나 짙어서 실제 입력 텍스트와 혼동되는 경우.
- **대응책 및 재검증 트리거**:
  - ui.css 내 placeholder 컬러가 var(--ink-faint, #94a3b8)로 은은하게 유지되는지 확인하고, 혼동 시 원칙 ③으로 되돌아가 스타일 조정.
