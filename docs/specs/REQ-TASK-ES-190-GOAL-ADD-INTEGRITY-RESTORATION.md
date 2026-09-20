# 요구사항 정의서 (REQ) — [#TASK-ES-190] 목표 추가 기능 전면 복원 및 4위 1체 UX 고도화

> **문서 ID**: REQ-TASK-ES-190-GOAL-ADD-INTEGRITY-RESTORATION  
> **티켓 연계**: #TASK-ES-190  
> **작성 일시**: 2026-09-20  
> **작성자**: Antigravity (세션 11fcefcf)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "아워골 목표추가가 기능 안함. 개선해"
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 목표 화면(`screen-goals`)의 마운틴 트레일 성소 상단에 위치한 `+ 새 목표` 버튼(`#sAddGoalBtn`)을 클릭하면 실제 새 목표 생성 창이 열리지 않고 "새 목표 추가 창을 엽니다"라는 껍데기 토스트만 잠시 나타났다 사라짐.
  2. 목표가 0개일 때 표시되는 빈 상태(Empty State) 마운틴 트레일 카드의 `+ 새 목표 만들기` 버튼을 클릭해도 아무런 반응이 없는 데드 클릭(Dead Click) 상태임.
  3. 세부 마일스톤 및 할 일 뷰(`personalGoalsView`) 상단 헤더 영역에 목표 추가 버튼이 아예 누락되어 있으며, 칩 바(`goalChipRow`)는 `display:none;`으로 은폐되어 있어 목표 탭 내에서 신규 목표 진입로가 완전히 차단됨.
  4. 홈 화면에서 새 목표(`homeAddGoal`) 모달 진입 후 AI 도우미 템플릿 생성을 진행할 때, 로컬 스마트 폴백 데이터(`localGoalTemplate`)의 `tasks`가 객체 배열(`[{title, done}]`)로 반환되는 구조적 불일치로 인해 리뷰 화면에서 `· [object Object]`로 흉하게 깨져 렌더링되고, 적용 시 `title`에 객체가 할당되어 데이터가 오염됨.
  5. "직접 설정할게요" 폼(`showNewGoalManualForm`)에서 제목 미입력 시 안내 피드백 없이 침묵하며, '기타(etc)' 카테고리 선택 시 기본 마일스톤이 빈 배열(`[]`)로 생성되어 목표를 만들어도 빈 껍데기로 남아 유저에게 실망을 줌.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: `index.html` 스크립트 스코프 내부에 선언된 `promptNewGoal()` 함수가 전역 `window.promptNewGoal`에 할당되지 않아, 외부 스크립트인 `js/sanctuary-v3-engine.js`의 인라인 핸들러에서 `window.promptNewGoal`을 호출할 때 항상 `undefined`로 평가되어 분기 처리가 실패함.
  - **2층 (구조/프로세스 부재)**: 템플릿 생성 API(`/api/goaltemplate`)와 로컬 스마트 폴백 함수 간 `milestones.tasks` 데이터 계약(Data Contract: string[] vs {title, done}[])이 정규화되지 않았고, 이를 기계적으로 걸러내는 단위 린터가 누락되어 런타임 객체 렌더링 결함을 사전에 포착하지 못함.
  - **3층 (시스템/유저 체감 괴리)**: 아워골 앱의 핵심 존재 이유인 "나의 목표를 세우고 매일 성장하는 경험(E1 루프)"의 출발선인 '목표 추가'가 먹통임에 따라, 유저는 앱의 기본 기능조차 신뢰하지 못하고 이탈하게 되는 치명적 불안감을 느낌.
- **사용자 상황 및 페르소나**: 
  - 신규 가입 유저(게스트/소셜): 첫 목표를 세우고 등반을 시작하려 하나 빈 화면의 `+ 새 목표 만들기` 버튼이 먹통이라 시작조차 못함.
  - 기존 활동 유저: 새로운 분기/월간 목표를 추가하고자 목표 탭에서 `+ 새 목표`를 누르나 더미 토스트만 뜨고 모달이 열리지 않아 당혹감을 느낌.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: **E1 (체크인 루프)** & **FIX (무결성 복원 및 4위 1체 배선)**
- **[본질] (Essence)**:
  - 겉모습의 착시(단순 버튼 이벤트 누락)를 걷어낸 이 문제의 실체는, **"유저가 자신의 삶의 방향성과 갓생 목표를 앱에 투영하는 유일한 진입로(Goal Creation Gateway)가 스코프 분리와 데이터 규격 불일치로 인해 완전히 차단되어 앱의 핵심 효능감(E1)이 마비된 결함"**이다.
  - **3대 철학 심사**:
    1. **무공해성 (Anti-Pollution)**: 허황된 광고나 결제 유도 없이, 유저가 원하는 목표를 막힘없이 온전히 세울 수 있는 무공해 쉼터 환경을 완벽히 복원한다.
    2. **RPG식 체감 (Immediate Self-Efficacy)**: 목표를 추가하는 순간 즉시 나만의 마운틴 트레일 등반로가 시각적으로 열리고, 첫 마일스톤과 세부 퀘스트가 주어지는 즉각적 자기효능감을 체감하게 한다.
    3. **동류 연대 (Peer Accompaniment)**: 생성된 목표가 실시간으로 프로필과 4대 뷰에 반영되어 러닝메이트와 함께 달릴 준비가 완료되도록 한다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (전역 인터페이스 배선 누락)**: `index.html`의 메인 스코프 내부 함수 `promptNewGoal()`이 `window.promptNewGoal = promptNewGoal;`로 전역화되지 않아, 분리된 모듈 `js/sanctuary-v3-engine.js`에서 호출 불가.
  2. **원인 2 (데이터 모델 스키마 파편화)**: 원격 AI API(`/api/goaltemplate`)는 tasks를 `string[]`으로 반환하고, 로컬 폴백은 `{title, done}[]`으로 반환하는 스키마 괴리 및 리뷰/저장 로직에서의 타입 정규화 부재.
  3. **원인 3 (UI 진입로 단절 및 피드백 부재)**: 세부 마일스톤 뷰에 목표 추가 액션 버튼이 없고, 직접 입력 폼에서 유효성 검사 실패 시 안내 토스트가 없어 유저 액션이 무반응으로 끝남.
- **[중심] (Core Bottleneck & Anchor)**:
  - 문제 해결의 핵심 병목은 **"어느 화면(홈, 성소 트레일, 세부 마일스톤 뷰, 모달)에서든 단일하고 안전한 `window.promptNewGoal()` 진입로를 보장하고, AI 생성/직접 입력/템플릿 복제 등 모든 경로에서 생성된 데이터가 정규화된 스키마로 4대 뷰에 즉각 전파되는 무결성 파이프라인의 구축"**이다.
- **[핵심] (Critical Safety & Termination)**:
  - 무너지지 않아야 할 파이프라인 종점은 **"기존 유저의 기존 목표 및 기록 데이터 100% 무손실 보존(Zero Data Loss), 생성 즉시 Supabase 원격 DB upsert 및 4대 뷰(`renderHome`, `renderGoalsScreen`, `renderCalendar`, `renderRecordsScreen`) 실시간 동시 전파, 그리고 375px 모바일 뷰포트에서의 데드클릭 0건"**이다.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 목표 탭이나 홈 화면에서 `+ 새 목표`를 눌렀을 때, 0.1초 만에 깔끔한 모달이 열려 AI 줄글 템플릿 생성 또는 직접 설정을 통해 손쉽게 목표를 생성하고, 즉시 마운틴 트레일과 4대 뷰에 생생한 등반로와 퀘스트가 펼쳐져 '내가 올바른 방향으로 나아갈 준비가 되었다'는 벅찬 성취감을 체감한다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인: 게스트 모드 및 소셜 로그인 세션에 일체 부정적 영향 없음. 생성된 목표는 세션 프로필에 안전하게 저장됨.
  - 홈 화면: `homeGoalList`, `homePositionStrip`, 크루 레이스에 신규 목표가 즉시 반영됨.
  - 기록/통계/캘린더 탭: 신규 목표 생성 즉시 캘린더 마감일 및 통계 지표에 정상 연동됨.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 기존 마운틴 트레일 조형이나 모달 CSS 토큰을 임의로 뜯어고치거나 불필요한 라이브러리를 추가하는 행위 금지.
  - 기존 유저의 `goals` 배열이나 마일스톤 데이터를 리셋/삭제하는 일체의 파괴적 행위 금지.
- **해야 할 것 (Action)**:
  - `window.promptNewGoal = promptNewGoal;` 및 `window.showNewGoalManualForm = showNewGoalManualForm;` 물리적 전역 배선.
  - `sanctuary-v3-engine.js`의 `+ 새 목표` 버튼 및 빈 화면 `+ 새 목표 만들기` 버튼 핸들러를 4위 1체로 완결.
  - `personalGoalsView` 상단 헤더(`goal-head-row`)에 직관적인 `+ 새 목표` 버튼 추가 배선.
  - AI 템플릿 생성 및 폴백 로직에서 `tasks` 배열의 타입을 안전하게 문자열로 상호 정규화(`typeof tk === 'string' ? tk : tk.title`).
  - 직접 입력 폼(`showNewGoalManualForm`)에서 제목 필수 검증 토스트 추가, 'etc' 기본 마일스톤 3종 제공, 엔터 키 전송 지원.
  - 목표 추가 완료 시 `dispatchFullViewPropagation` 또는 4대 뷰 동시 전파 리렌더링 완벽 결속.
- **왜 이 방식이어야만 하는가 (Why this approach)**:
  - 기존 아워골의 모달 프레임워크와 상태 관리(`state.profile.goals`), 스토리지 원장(`saveProfile`) 파이프라인을 100% 계승하면서, 단절된 배선과 데이터 불일치만 외과수술적으로 완벽히 교정하여 회귀 결함 제로(0)를 보장할 수 있는 유일무이한 해법이기 때문.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase `profiles` 테이블의 `goals` jsonb 컬럼 및 `user_goals` 테이블. 신규 목표 객체 구조 `{ id, title, dueDate, category, topic, createdAt, visibility, archivedAt, result, milestones }` 완벽 부합.
- **2호 (스마트 스토리지 분기 설계)**: 목표 텍스트 메타데이터는 Supabase DB 원격 저장 및 `localStorage` 3중 백업(`ourgoal_state_v1`, `ourgoal_profile_backup_v1`, `ourgoal_self_healing_vault_v1`)에 즉시 동기화.
- **3호 (4대 뷰 전파 배선도)**: 목표 추가 완료 즉시 `renderHome()`, `renderGoalsScreen()`, `renderCalendarScreen()`, `renderRecordsScreen()`, `window.OurgoalSanctuaryV3.render('goals')`가 순차적으로 동시 호출되어 화면 간 상태 불일치 제로 실현.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Selector) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#homeAddGoal` | 홈 화면 퀘스트 헤더 | 클릭/터치 | `promptNewGoal()` 호출 -> 새 목표 모달 표출 | 쿨다운 가드 + 모달 오픈 |
| `#sAddGoalBtn` | 목표 탭 마운틴 트레일 알약 | 클릭/터치 | `window.promptNewGoal()` 호출 -> 모달 표출 | 모달 미정의 시 안전 폴백 + 오픈 |
| `.empty-card .btn-primary` | 목표 탭 빈 트레일 카드 | 클릭/터치 | `window.promptNewGoal()` 호출 -> 모달 표출 | 빈 상태에서도 즉시 모달 오픈 |
| `#btnPersonalAddGoalInline` | 목표 탭 세부 마일스톤 헤더 | 클릭/터치 | `window.promptNewGoal()` 호출 -> 모달 표출 | 클릭 즉시 모달 오픈 |
| `#ngGenBtn` | 새 목표 AI 모달 | 클릭/터치 | 줄글 기반 AI/로컬 템플릿 생성 후 리뷰 단계 진입 | 공백 시 토스트('목표를 먼저 적어주세요') |
| `#ngApplyBtn` | 새 목표 리뷰 모달 | 클릭/터치 | 마일스톤/태스크 정규화 -> `state.profile.goals` 추가 -> 원격 저장 -> 4대 뷰 동시 전파 | 제목 누락 시 토스트 + 입력창 포커스 |
| `#ngManualBtn` | 새 목표 AI 모달 | 클릭/터치 | `showNewGoalManualForm()` 호출 -> 직접 입력 폼 전환 | 즉시 수동 입력 폼 렌더링 |
| `#mSave` | 새 목표 수동 입력 폼 | 클릭/터치 | 제목 검증 -> 기본 마일스톤 결속 -> 저장 -> 4대 뷰 동시 전파 | 제목 공백 시 토스트('목표 제목을 입력해주세요') |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 기존 아바타 설정값, 레벨, 320종 보관함 불변 보존.
- **목표 데이터 보존**: 기존에 등록된 목표 목록 및 완료 마일스톤/태스크 순서 100% 보존(`goals.push(newGoal)` 비파괴 추가).
- **기록 데이터 보존**: 과거 체크인 기록, 일일 회고, 스트릭 데이터 단 1바이트도 훼손 없음.
- **화면 구성 세팅값 보존**: 테마, 폰트, 알림 설정 등 기존 환경설정 100% 유지.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - 단순 `window.promptNewGoal = promptNewGoal;` 한 줄만 추가하면 될 것 같았으나, 코드베이스 전수 분석 결과 AI 템플릿의 로컬 폴백 tasks 객체화 버그, 직접 입력 폼의 'etc' 마일스톤 빈 배열 결함, 세부 마일스톤 뷰 상단의 목표 추가 진입로 부재 등 연쇄적인 결함들이 얽혀 있음을 확인하여 이를 종합 패키지로 해결해야 함을 인정함.
- **기존 기능과의 충돌 가능성 검토**:
  - 기존 목표 편집 모드(`state.goalEditMode`), 드래그 순서 변경, 마일스톤 체크인 기능과의 충돌 가능성 검토 결과, 신규 목표 추가 로직은 기존 데이터 구조를 그대로 준수하므로 충돌 제로.
- **엣지 케이스 (Edge Cases)**:
  - **오프라인/네트워크 불안정 상태**: AI API가 실패하더라도 로컬 스마트 폴백(`localGoalTemplate`)이 100% 즉시 동작하여 템플릿을 생성하고 로컬 스토리지에 즉시 영속화.
  - **특수문자 및 초장문 입력**: 500자 초과 방어, HTML 특수문자 `escapeHtml` 완벽 적용으로 XSS 원천 차단.
  - **카테고리 미선택 상태 생성**: 기본 카테고리('etc')에서도 3단계 실천 마일스톤을 자동 생성하여 빈 껍데기 목표 방지.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. [Step 1]: `index.html` 내 `promptNewGoal`, `showNewGoalManualForm`을 `window` 전역 객체에 명시적으로 노출 및 export.
  2. [Step 2]: `localGoalTemplate` 및 `showNewGoalReviewStep`의 tasks 데이터 구조 상호 정규화 (`typeof tk === 'string' ? tk : (tk.title || '')`) 배선.
  3. [Step 3]: 직접 입력 폼(`showNewGoalManualForm`) 유효성 검사 토스트 배선 및 'etc' 기본 마일스톤 템플릿 보강, 엔터 키 submit 이벤트 바인딩.
  4. [Step 4]: `js/sanctuary-v3-engine.js`의 `+ 새 목표` 버튼 및 빈 상태 버튼 핸들러를 방어적 전역 호출 체계로 강화.
  5. [Step 5]: `index.html` 세부 마일스톤 헤더(`goal-head-row`)에 `+ 새 목표` 인라인 버튼(`#btnPersonalAddGoalInline`) 신설 및 이벤트 결속.
  6. [Step 6]: 목표 추가 완료 후 4대 뷰 동시 전파(`dispatchFullViewPropagation` 및 `renderHome`, `renderGoalsScreen`, `renderCalendarScreen`, `renderRecordsScreen`, 성소 렌더) 배선.
- **화면 간 상호연동 전파 규격**:
  - 데이터 변경 발생 지점: `promptNewGoal` -> AI/수동 목표 생성 완료 (`saveProfile`)
  - 즉시 갱신되어야 할 연계 화면 목록:
    1. 홈 화면 (`renderHome`): `homeGoalList`에 신규 목표 카드 즉시 노출.
    2. 목표 탭 (`renderGoalsScreen` & `renderSanctuaryGoals`): 마운틴 트레일 알약 및 등반로 즉시 갱신, 활성 목표로 선택.
    3. 캘린더 탭 (`renderCalendarScreen`): 목표 마감일 배지 및 D-day 동기화.
    4. 기록 탭 (`renderRecordsScreen`): 1줄 체크인 드롭다운 목표 목록에 즉시 추가.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
> *(주의: 본 원칙은 절차 정리(⑤)와 단계별 실행(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 타 원칙과 합치는 것은 위헌입니다)*
- **단일 실패점 (SPOF) 점검**:
  - Vercel 서버리스 `/api/goaltemplate` 장애 시 모달이 멈추거나 먹통이 될 수 있는가? -> 타임아웃 및 try/catch를 통해 즉각 `localGoalTemplate` 스마트 폴백으로 전환되므로 SPOF 제로.
  - `window.promptNewGoal` 로딩 전 버튼이 클릭될 수 있는가? -> 스크립트 실행 즉시 최상위에서 `window.promptNewGoal`을 안전하게 선점 정의하여 지연 호출 보장.
- **가정의 타당성 검증**:
  - "사용자가 목표 제목만 쓰고 바로 만들기를 원할 수 있다"는 가정 -> 카테고리 선택 없이도 최적의 기본 마일스톤 3종을 제공하므로 사용자 경험 극대화.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - 재검증 결과, 목표 탭 내에서 `sanctuaryGoalsView` 뿐만 아니라 하단 `personalGoalsView`의 상단 헤더에도 `+ 새 목표` 버튼이 있어야 유저가 스크롤을 내린 상태에서도 즉시 목표를 추가할 수 있음을 발견하여 Step 5에 이를 추가 반영함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 홈 화면 `#homeAddGoal` 클릭 시 새 목표 모달 100% 정상 오픈
- 목표 탭 마운틴 트레일 `#sAddGoalBtn` 클릭 시 모달 100% 정상 오픈 (더미 토스트 제거)
- 목표가 0개일 때 빈 상태 카드 `+ 새 목표 만들기` 클릭 시 모달 100% 정상 오픈
- 세부 마일스톤 헤더 `#btnPersonalAddGoalInline` 클릭 시 모달 100% 정상 오픈
- AI 템플릿 생성 시 리뷰 화면에서 `· [object Object]` 없이 깨끗한 세부 할 일 텍스트 렌더링 검증
- 수동 직접 설정 시 공백 검증 토스트 동작 및 정상 저장 검증
- 신규 목표 생성 즉시 4대 뷰(홈, 목표, 캘린더, 기록) 동시 반영 확인
- `npm test` 스모크 테스트 및 무결성 게이트 전수 ALL PASS (0 failure)
- CDP 모바일(375px) 실측 감사 5대 항목 ALL PASS

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **구체적 블로커 시나리오**:
  1. 목표 추가 직후 `state.activeGoalId`가 신규 목표로 설정되었으나 마운틴 트레일 알약에 active 클래스가 즉시 반영되지 않는 현상 -> `engine.activeGoalId = newGoal.id` 동시 설정으로 방어.
  2. 모달 닫기 애니메이션 중 연속 클릭으로 인한 중복 생성 -> `isModalDismissCooldown()` 및 버튼 disabled 처리로 방어.
- **재검증 트리거**:
  - 목표 생성 후 홈 화면 또는 목표 탭에서 새 목표가 보이지 않는 경우: 즉시 원칙 ②(종단간 배선) 및 원칙 ⑤(4대 뷰 전파 순서)로 복귀하여 `dispatchFullViewPropagation` 호출 시점을 재검증한다.
