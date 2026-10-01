# 요구사항 정의서 (REQ) — 가상 페르소나·목업 모임 전면 삭제 및 팔로워만 공개 옵션 제거

> **문서 ID**: REQ-TASK-ES-332-PURGE-MOCK-PERSONAS-FOLLOWERS  
> **티켓 연계**: #TASK-ES-332  
> **작성 일시**: 2026-10-01  
> **작성자**: Antigravity Pair Programmer (Gemini 3.8 Flash)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2항 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > *"수익화 열린 결심 빼고 번호대로 하나씩 내게 뭘 세부적으로 어떻게 결심하면 될지 결심안 3가지와 세부내용, 각 안으로 결심했을때의 장단점, 추천안과 왜 추천하는지 보고하고 하나씩 처리해 나갈려고 해."*  
  > *"권장안대로 가자."*  
  > *"진행"* (1단계 결심 490108 '안 A: 즉시 전면 삭제', 490102 '안 A: 팔로워만 제거 및 team 전환', 490601 '안 A: 기능 삭제 묶음 자동 해소' 확정 승인)

- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. **위조 페르소나 및 가짜 응원 난립**: `index.html` 내 `SIM_PERSONAS`(40인) 및 `defaultSettings().virtualCheerEnabled: true` 설정으로 인해, 유저가 첫 체크인을 하거나 피드에 글을 공유할 때 1.6초 만에 가짜 봇 페르소나('김도윤', '박준서' 등)가 진짜 사람인 것처럼 자동 응원 댓글과 리액션을 날조함. 이는 헌법 제4조 제1항 1호(위조 숫자 날조 금지) 및 7호(가짜 실제구현 전면 금지)에 정면 위배됨.
  2. **미작동 껍데기 '팔로워만' 옵션 잔존**: 목표 생성 모달(`index.html` 19203행 `<option value="followers">팔로워만</option>`) 및 `VISIBILITY_LABELS`(33117행)에 '팔로워만' 선택지가 있으나, 앱 내에 팔로우 관계 그래프나 이를 조회하여 열람을 제한하는 백엔드 함수가 전무하여 껍데기 옵션으로 방치됨.
  3. **가짜 크루 카운트 오염 위험**: 홈 콕핏(`applyCrewPacingUI`, `renderCrewPacingWidget`) 및 팀 목록에서 가상 목업 데이터가 잔존할 경우 실제 유저가 0명임에도 다수가 활동하는 것처럼 보이는 다크패턴 위험 존재.

- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: `followers` 값으로 저장된 목표가 있더라도 열람 권한 검사 함수(`can_view_goal`)가 없어 공개 여부가 제대로 통제되지 않고, 생성 모달(전체·팔로워·나만)과 설정 화면(전체·팀원·나만)의 선택지 묶음이 불일치함.
  - **2층 (구조/프로세스 부재)**: 초기 개발 당시 앱 활성화를 시연하기 위해 하드코딩했던 `SIM_PERSONAS`와 가상 피드 주입 로직이 상용 프로덕션 전환 단계에서 체계적으로 격리/삭제되지 못함.
  - **3층 (시스템/유저 체감 괴리)**: 유저는 진짜 동반자의 응원을 기대하지만, 로컬에서 조작된 기계적 봇 텍스트를 마주하며 서비스 전체의 진정성과 무공해 가치에 심각한 배신감을 느낌.

- **사용자 상황 및 페르소나**:
  - 조용하고 진솔하게 자신의 인생 목표를 관리하려는 1인 메이트 지향 사용자. 가짜 봇의 영혼 없는 자동 댓글이 아닌, 순수 실사용자의 팩트 데이터와 자기 자신의 성장에만 몰입하고 싶은 상황.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: **E3 (동류 소통 및 무공해 진정성)** & **INFRA (헌법 제4조 무결성)**
- **[본질] (Essence)**: 아워골은 과시형 SNS와 인위적 봇 조작을 배격하는 **'무공해 성장 도피처'**이므로, 단 1개의 가짜 응원이나 위조 계정도 존재해서는 안 되며, 작동하지 않는 껍데기 옵션은 완전히 도려내야 한다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (`SIM_PERSONAS` 하드코딩 잔존)**: 32884행부터 40명의 이름, 직업, 가짜 목표가 명시되어 있고, 온보딩/피드 함수에서 이를 참조하여 봇 응원을 스케줄링함.
  2. **원인 2 (`virtualCheerEnabled` 기본 활성화)**: `defaultSettings()`에 가상 응원이 기본 `true`로 설정되어 신규 사용자에게 자동으로 봇 인터랙션을 트리거함.
  3. **원인 3 (`followers` 도메인 미구현)**: 소셜 기능 로드맵에서 '팔로우' 모델을 채택하지 않고 '같은 테마 동반자' 모델로 전환했음에도 UI 선택지가 방치됨.
- **[중심] (Core Bottleneck & Anchor)**: `SIM_PERSONAS` 배열을 안전하게 제거(0건화)하고, 가짜 응원 생성기(`triggerFirstCheerResponse`, `addSimulatedCheerAndReplyToPost`)를 완전히 차단하며, `followers` 옵션을 `team`(팀원 공개)으로 정돈/마이그레이션하는 작업의 원자적 단행.
- **[핵심] (Critical Safety & Termination)**: 기존 사용자 목표 중 혹시라도 `followers`로 저장된 데이터의 무손실 보존(`team` 안전 이전), `scripts/smoke-test.js` 및 `scripts/verify-integrity-gate.js` 100% 무결성 통과 유지, Zero Dead-Click 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 첫 체크인을 하거나 피드에 글을 남겼을 때, 날조된 가짜 봇 응원이 즉시 뜨지 않고, 홈 화면의 크루 카운터에 실 사용자만의 숫자가 정직하게 표시됨으로써 서비스의 무공해 철학에 깊은 신뢰를 느낀다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인: 영향 없음 (세션 유지).
  - 홈 화면: `applyCrewPacingUI`는 이미 실데이터 집계(`FEED_POSTS_CACHE`) 기반이므로 가짜 크루 오염 없이 순수 팩트 카운트 유지.
  - 기록/소통 탭: 피드 렌더링 시 가짜 봇(`singleAiGuide`)이 삽입되지 않고 100% 실제 게시물만 표시.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - `MOCK_GROUPS`를 사용하는 템플릿 예시 컴포넌트(`💡 이런 팀을 만들 수 있어요`)의 마크업 구조를 임의 파괴하여 테스트(`smoke-test.js:7701`)를 깨뜨리는 행위 금지.
  - 가짜 페르소나 삭제 과정에서 일반 실사용자 게시글(`FEED_POSTS_CACHE`) 렌더링 파이프라인 손상 금지.
  - 레거시 데이터 마이그레이션 없이 `followers`를 단순 삭제하여 기존 목표가 깨지게 만드는 파괴적 행위 금지.
- **해야 할 것 (Action)**:
  - `SIM_PERSONAS` 배열 내 40인 가상 데이터 전면 제거(`var SIM_PERSONAS = [];`), `MOCK_PEOPLE = []`.
  - `defaultSettings().virtualCheerEnabled`를 `false`로 수정하고 가짜 응원 스케줄러 비활성화.
  - `renderCommFeed`에서 `singleAiGuide` 가상 봇 삽입 로직 전면 삭제.
  - `mGoalVis` 선택지에서 `<option value="followers">` 삭제, `VISIBILITY_LABELS` 정돈.
  - 목표 로드/렌더링 시 `vis === 'followers'`인 레거시 항목은 즉시 `'team'`으로 안전 정규화.
- **왜 이 방식이어야만 하는가 (Why this approach)**:
  - 헌법 제4조 제1항 1호/7호의 기계적 무결성을 만족하면서도, 기기 로컬에 저장된 기존 목표의 유효성을 100% 보존하는 가장 안전하고 완전한 방법이기 때문.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase `goals` 테이블의 `visibility` 컬럼 ('public', 'team', 'private'). 본 작업은 클라이언트 런타임에서 'followers' 값을 'team'으로 치환하여 동기화하므로 추가 DDL 없이 기존 스키마 호환 유지.
- **2호 (스마트 스토리지 분기 설계)**: 로컬스토리지 `ourgoal_profile` 내 `goals[*].visibility`가 `'followers'`인 경우 로드 시점에 `'team'`으로 인메모리 및 영구 원장 무손실 치환.
- **3호 (4대 뷰 전파 배선도)**: 공개범위 변경 및 목표 로드 시 `renderHome()`, `renderRecordsScreen()`, `renderStatsScreen()`, `renderCalendar()`가 일관되게 'team' 라벨 및 아이콘(👥)으로 표기.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#mGoalVis` | 목표 생성 모달 | 드롭다운 선택 | '전체 공개', '나만 보기' 2개 표준 옵션만 제공 | 유효하지 않은 값 선택 불가 |
| `#goalsPrivacyBadge` | 목표 상세 화면 | 탭/클릭 | `private` ➔ `team` ➔ `public` 순환 토글 | 즉시 뱃지 텍스트/아이콘 변경 및 저장 |
| `#btnGoLiveFeed` | 홈 크루 위젯 | 클릭 | 소통 탭 실시간 피드로 즉시 이동 | 피드 렌더링 시 가짜 봇 노출 0건 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 기존 아바타 100% 보존.
- **목표 데이터 보존**: 과거 `followers`로 저장된 목표는 삭제 없이 `team`으로 승계.
- **기록 데이터 보존**: 기존 모든 체크인 및 피드백 100% 보존.
- **화면 구성 세팅값 보존**: `state.profile.settings` 내 타 설정 일체 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - 가짜 페르소나와 봇 응원을 삭제하면, 신규 가입 직후 초기 유저가 피드에 들어왔을 때 아무 글도 없어 다소 썰렁하게 느껴질 수 있음. 그러나 가짜 참여로 눈속임하는 것보다 정직한 콜드스타트 화면("아직 피드가 비어있어요. 첫 번째 주인공이 되어보세요!")을 보여주는 것이 헌법과 포지셔닝에 완전히 부합함.
- **기존 기능과의 충돌 가능성 검토**:
  - `js/viral-sharing.js`에서 `global.SIM_PERSONAS`를 찾던 폴백 로직이 안전하게 메타데이터나 '아워골 러너' 기본값으로 폴백하는지 확인 완료.
  - `scripts/smoke-test.js`에서 검사하는 `isMockGroup` 및 템플릿 그룹 식별자(`g-workshop`, `g-travel`)가 훼손되지 않도록 보호 설계.
- **엣지 케이스 (Edge Cases)**:
  - 기기 오프라인 상태에서 과거 `followers` 목표를 편집할 때: 로컬 치환기가 즉시 `team`으로 정규화하여 저장.
  - 피드 게시물이 0개인 극초기 상태: 봇 대신 안내 텍스트 노출.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. **Step 1 (`index.html` 데이터 및 설정 정비)**: `SIM_PERSONAS` 배열을 빈 배열 `[]`로 정리, `defaultSettings().virtualCheerEnabled = false`.
  2. **Step 2 (`index.html` 봇 생성기 및 피드 정비)**: `triggerFirstCheerResponse`, `addSimulatedCheerAndReplyToPost` 내부 가짜 응원 생성 중단, `renderCommFeed` 내 `singleAiGuide` 주입 제거.
  3. **Step 3 (`index.html` followers 정리)**: `<option value="followers">` 제거, `VISIBILITY_LABELS` 정돈, `goals` 로드 시 `followers` -> `team` 마이그레이션 삽입.
  4. **Step 4 (`js/viral-sharing.js` 정돈)**: 페르소나 폴백 제거 및 기본 메타 호환 유지.
  5. **Step 5 (로컬 검증)**: `node scripts/verify-integrity-gate.js` 및 `npm test` 전수 실행.
- **화면 간 상호연동 전파 규격**:
  - 목표 공개범위 변경 시 `renderHome()`, `renderRecordsScreen()`, `renderCommScreen()`에 즉시 반영.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: `SIM_PERSONAS`를 참조하던 외부 파일이 `undefined` 참조 에러를 낼 위험 점검 ➔ `var SIM_PERSONAS = [];`로 빈 배열 형태를 유지하여 참조 에러(TypeError)를 원천 방지함.
- **가정의 타당성 검증**: '소통 탭에 가짜 페르소나가 없어도 앱이 정상 작동하는가?' ➔ `FEED_POSTS_CACHE` 및 실사용자 목표 매핑 로직이 독립적으로 완비되어 있어 100% 정상 작동함.
- **가장 강력한 반대 논거 2가지 및 반박/수용**:
  - **반론 1**: "런칭 초기 피드가 텅 비어있으면 초기 유저가 바로 이탈할 수 있으므로, AI 표시를 명확히 달고 1~2개의 샘플 가이드는 남겨둬야 하지 않는가?"
    - **반박/수용 결과**: 헌법 제4조 제1항 7호(가짜 실제구현 전면 금지)와 결정권자 상민님의 결심 1번(즉시 전면 삭제 안 A)에 따라 가짜 계정 활동은 완전 배제한다. 대신 정직한 온보딩 가이드 배너를 제공하는 것이 무공해 철학에 부합한다.
  - **반론 2**: "'followers' 옵션을 제거하면 기존에 이를 선택했던 유저의 목표가 사라지거나 비공개로 바뀌어 불만을 사지 않는가?"
    - **반박/수용 결과**: 비공개로 떨어뜨리지 않고 상민님 승인안대로 '팀원 공개(team)'로 승계하여 유저의 공유 의도를 보존하고, 데이터 삭제 없이 무손실 마이그레이션한다.
- **재검증 결과 도출된 절차 수정/보완사항**: `SIM_PERSONAS` 변수 자체를 `delete`하지 않고 빈 배열 `[]`로 선언해 두어, 레거시 코드의 문법적 안전성을 100% 보장하도록 수정함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- `SIM_PERSONAS` 내 가짜 인물 데이터 40인 잔존 0건 (`SIM_PERSONAS.length === 0`).
- 신규 체크인/피드 공유 시 가짜 응원/댓글 발생 0건.
- 목표 생성 모달 내 `followers` 선택지 노출 0건.
- `node scripts/verify-integrity-gate.js` 무결성 검증 100% 통과 (PASS).
- `npm test` 440개 테스트 100% 통과 (0 failed).

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**: `smoke-test.js`의 기존 가상 그룹 테스트(`isMockGroup`, `g-workshop`)와 충돌할 가능성.
- **사전 방어**: 템플릿용 모임 정의와 활성 페르소나 데이터의 역할을 명확히 분리하여 스모크 테스트 불파괴 유지.
- **재검증 트리거**: `npm test` 실행 중 `smoke-test.js`에서 실패가 발생할 경우, 즉시 원칙 ③으로 되돌아가 테스트 단언문이 요구하는 템플릿 식별자의 보존 상태를 재검토한다.
