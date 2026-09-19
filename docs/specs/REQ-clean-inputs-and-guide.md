# 요구사항 정의서 (REQ) — 아워골 전반 입력창 지움 피로도 7대 전수 근절 및 목표 가이드 미작동 버튼 영구 삭제

> **문서 ID**: REQ-clean-inputs-and-guide  
> **티켓 연계**: #TASK-ES-191 (생각 메모장 [90]번 포함)  
> **작성 일시**: 2026-09-19  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  1. "이런 유사한 문제들을 아워골 전반에서 찾아서 표 형태로 보고해"
  2. "노션의 💡 아워골 생각 메모장 (명령대기 & 아이디어 DB) 도 확인해서 대기상태인 작업목록과 너가 파악한 문제랑 같이 표로 정리해서 다시 보고해"
  3. "88번은 완료처리하고, 나머지 모두 진행해"
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 3초 체크인과 동일하게, 사용자가 직접 자신의 생각/계획을 적어야 하는 입력창 모달들에서 예시 텍스트나 칩을 클릭했을 때 또는 모달이 열렸을 때 `input.value`에 긴 텍스트가 강제로 주입되어 사용자가 백스페이스로 글자를 일일이 지우고 써야 하는 극심한 피로도가 아워골 전반(7개소)에 산재해 있음.
  - 또한, 생각 메모장 [90]번 항목인 목표 탭 상단 활용가이드 모달 내 '첫 목표 만들기' 버튼(`btnGuideAddFirstGoal`)은 클릭해도 아무런 동작을 하지 않는 무반응 껍데기 버튼으로 남아 사용자에게 혼란과 클릭 피로도를 유발함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: [90]번 버튼은 이벤트 리스너가 누락된 채 UI에만 노출된 고스트 버튼이며, 입력창 7개소는 칩 클릭 시 `value`를 직접 덮어씌움.
  - **2층 (구조/프로세스 부재)**: '사용자 안내/예시'를 '실제 값'으로 오인하여 주입하는 설계 결함.
  - **3층 (시스템/유저 체감 괴리)**: 사용자는 "내가 쓸 내용을 적으려는데 왜 기존 글자를 지우는 헛수고를 시키는가?"라는 사용성 불쾌감을 느낌.
- **사용자 상황 및 페르소나**: 아워골의 목표 생성, 피드 공유, 온보딩, 일정 첨부, 템플릿 커스텀, 아바타 설정 등을 수행하는 모든 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E1(체크인/입력 경험) + E2(목표 관리) / FIX
- **[본질] (Essence)**: 입력 필드는 사용자가 아무런 사전 삭제 동작 없이 즉각 타이핑할 수 있도록 순수한 빈 상태(`value = ''`)여야 하며, 추천 템플릿이나 칩은 백스페이스가 필요 없는 `placeholder` 힌트여야 함. 또한 작동하지 않는 껍데기 버튼은 지체 없이 영구 제거되어야 함.
- **[원인] (Root Causes - 기저 원인 8가지)**:
  1. `openShareToFeedModal`: 기본 `value`에 공유 멘트가 강제 할당되어 사용자가 지워야 함.
  2. `openTeamLinkedPersonalGoalModal`: `tlpTitleInput`에 `['+teamName+'] 나의 실천 미션`이 value로 강제 주입됨.
  3. 온보딩 첫 실천 기록 (`obFirstNote`): 칩 클릭 시 `ta.value`에 텍스트가 강제 주입됨.
  4. 일정 스마트 첨부 (`openAddAttachmentModal`): 4대 프리셋 칩 클릭 시 제목/메모에 긴 텍스트가 value로 강제 주입됨.
  5. 팀 목표 추가 모달 (`tgTitleInput`): 추천 템플릿 클릭 시 제목 value가 강제 덮어씌워짐.
  6. AI 커스텀 표/노션 모달 (`openCreateCustomTemplateModal`): 6대 칩 클릭 시 프롬프트 value가 강제 대입됨.
  7. 아바타 기본 인사말 (`agDayMsgInput`, `agNightMsgInput`): 커스텀 저장된 값이 없음에도 기본 인사말이 value에 들어가 사용자가 지우고 써야 함.
  8. 생각 메모장 [90]번: 목표 탭 가이드 모달 내 `btnGuideAddFirstGoal`이 이벤트 배선 없는 빈 껍데기 버튼으로 방치됨.
- **[중심] (Core Bottleneck & Anchor)**: 모든 입력창의 칩/가이드 인터랙션을 "value 대입 ➔ placeholder 힌트화 + focus()" 패턴으로 전수 통일하고, [90]번 미작동 버튼을 DOM에서 영구 소거하는 것.
- **[핵심] (Critical Safety & Termination)**: 기존 스모크 테스트 및 22개 헌법 게이트가 깨지지 않도록 ID와 비즈니스 이벤트 흐름의 무결성을 100% 유지하는 것.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 아워골의 어느 모달에서든 추천 칩을 누르면 예시가 placeholder로 은은하게 안내되고, 입력창은 깨끗하게 비어 있어 백스페이스를 단 한 번도 누르지 않고 즉시 자신의 내용을 빠르게 작성하게 된다."*

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 칩 클릭 시 `input.value`에 사용자가 지워야 하는 문자열을 강제 삽입하는 행위 금지.
  - 사용자가 저장한 적 없는 기본값을 `input.value`에 하드코딩하는 행위 금지.
  - 작동하지 않는 가짜 버튼(`btnGuideAddFirstGoal`)을 방치하는 행위 금지.
- **해야 할 것 (Action)**:
  - 7대 입력 지점의 칩/초기화 로직을 `value = ''` 및 `placeholder = '예: ...'`로 완전 전환하고 즉각 포커스.
  - [90]번 버튼 및 불필요한 마크업 영구 삭제.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- 기존 스토리지 스키마 변경 없음 (UI/입력 인터랙션 개선).
- 저장 시 실제 입력된 내용(`input.value.trim()`)이 기존 스토리지에 정상 저장되는 무결성 100% 보존.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `captionInput` | 피드 공유 모달 | 모달 오픈 | `value = ''`, `placeholder = '오늘 실천 완료! 어땠는지 한 줄 기록을 남겨보세요...'` | 백스페이스 없이 바로 입력 |
| `tlpTitleInput` | 팀 연계 목표 모달 | 모달 오픈 | `value = ''`, `placeholder = '예: [' + escapeHtml(teamName) + '] 나의 실천 미션'` | 빈 입력창에 바로 타이핑 가능 |
| `[data-chip]` | 온보딩 첫 실천 모달 | 칩 클릭 | `ta.value = ''`, `ta.placeholder = '예: ' + chipText`, `ta.focus()` | 지울 필요 없이 바로 작성 |
| `.attach-preset-chip` | 일정 스마트 첨부 | 칩 클릭 | `titleInput.value = ''`, `titleInput.placeholder = ...`, `noteInput.value = ''`, `noteInput.placeholder = ...` | placeholder로 힌트 제공 후 포커스 |
| `.tg-tpl-chip` | 팀 목표 생성 모달 | 템플릿 클릭 | `tgTitleInput.value = ''`, `tgTitleInput.placeholder = '예: ' + title`, `tgTitleInput.focus()` | 지움 피로도 없이 즉시 작성 |
| `.prompt-chip` | 커스텀 표/노션 모달 | 칩 클릭 | `titleInp.placeholder = ...`, `proseInp.placeholder = ...`, `value` 강제 삽입 제거 | 힌트 안내 후 바로 작성 |
| `agDayMsgInput`, `agNightMsgInput` | 설정 아바타 인사말 | 화면 오픈 | 저장된 커스텀 값 없을 때 `value = ''`, `placeholder = 기본 인사말` | 빈 상태에서 자유 입력 |
| `btnGuideAddFirstGoal` | 목표 가이드 모달 | N/A | DOM에서 영구 제거 (죽은 버튼 완전 소거) | 무반응 클릭 원천 방지 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 아바타 설정, 팀 목표, 개인 목표, 일정 첨부 데이터 기존 저장소와 100% 무손실 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: 칩 클릭 시 value가 채워지는 것을 기대했던 극소수 사용자가 있을 수 있으나, 미입력 상태에서 바로 저장을 누를 경우 placeholder의 힌트가 스마트 fallback으로 적용되도록 설계하여 편의성을 양방향으로 100% 만족함.
- **기존 기능과의 충돌 가능성 검토**: 기존 스모크 테스트 및 헌법 5대 게이트 검증과의 충돌 없음.
- **엣지 케이스 (Edge Cases)**:
  - 칩 클릭 후 사용자가 아무것도 타이핑하지 않고 확인/저장을 누른 경우: 스마트 fallback으로 안내된 추천 문구가 자동 채택되어 유효성 에러 방지.
  - 사용자가 이미 타이핑 중인 상태에서 칩을 누른 경우: 기입력된 텍스트가 지워지지 않고 빈 칸일 때만 placeholder가 갱신됨.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. 1단계: 피드 공유 모달 captionInput의 value 강제 주입 제거 및 placeholder 힌트화.
  2. 2단계: 팀 연계 개인목표 모달 tlpTitleInput의 value 제거 및 placeholder 힌트화.
  3. 3단계: 온보딩 첫 실천 모달 obFirstNote 칩 클릭 시 ta.value 제거 및 placeholder 힌트화.
  4. 4단계: 일정 스마트 첨부 모달 4대 프리셋 칩 클릭 시 placeholder 힌트화.
  5. 5단계: 팀 목표 추가 모달 추천 템플릿 클릭 시 placeholder 힌트화.
  6. 6단계: AI 커스텀 표 모달 제목 input value 비우기 및 placeholder 힌트화.
  7. 7단계: 설정 아바타 기본 인사말 빈 value 및 placeholder 안내.
  8. 8단계: 목표 탭 가이드 모달 내 미작동 btnGuideAddFirstGoal 영구 삭제.
- **화면 간 상호연동 전파 규격**:
  - 각 모달에서 저장/생성 시 관련 뷰(홈, 목표, 피드, 캘린더, 설정)에 100% 정상 전파.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
> *(주의: 본 원칙은 절차 정리(⑤)와 단계별 실행(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 타 원칙과 합치는 것은 위헌입니다)*
- **단일 실패점 (SPOF) 점검**: 각 모달에서 input 요소를 찾지 못해도 if 가드가 있어 JS 에러가 전파되지 않음.
- **가정의 타당성 검증**: 스모크 테스트 단언문 및 기존 비즈니스 이벤트 흐름이 그대로 유지되는지 확인.
- **재검증 결과 도출된 절차 수정/보완사항**: 빈 값 제출 시 힌트 문구가 스마트 fallback으로 안전하게 들어가도록 전 모달에 이중 안전망을 배선함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 7대 입력창에서 칩 클릭 혹은 초기 진입 시 input.value 길이 = 0, input.placeholder 길이 > 0.
- DOM 내 #btnGuideAddFirstGoal 존재 여부 = null (완전 소거).
- `node scripts/verify-integrity-gate.js` 22개 게이트 ALL PASS.
- `npm test` 328+ 스모크 테스트 ALL PASS.
- Chrome CDP 실측 캡처로 빈 입력창 및 힌트 작동 시각적 증거 확보.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 스모크 테스트 단언문 불일치 가능성.
- **사전 방어 및 우회 로직**: 기존 기능의 주요 ID 및 함수 인터페이스 완벽 보존.
- **롤백 계획 (Rollback Strategy)**: 실패 시 `git reset --hard HEAD`를 통해 시작 지점으로 안전 롤백.
- **재검증 트리거**: 무결성 게이트나 스모크 테스트 실패 시 4번(재검토)으로 돌아가 코드 변경점 정밀 진단.
