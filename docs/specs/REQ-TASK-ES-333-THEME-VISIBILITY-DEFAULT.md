# [요구사항 정의서] #TASK-ES-333: 'theme'(같은 테마 공개) 단계 신설 및 기본 공개범위 전환 & 1초 되돌리기 및 공개 정보 4종 한정

## 1. 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  - 결심 4: "기본 공개범위 -> 같은 테마 공개 (고지 + 되돌리기)"
  - 결심 5: "공개 정보 범위 -> 제목 + 진행률 + 체크인한줄 + 연속일"
  - 2026-10-01 상민님 2순위 작업 지시: "진행"
- **현상 및 기저 층위 심층 분석**:
  - **1층 (표면적 현상)**: 목표 생성 모달(`openAddGoalModal`, `#mGoalVis`)의 기본값이 `private`(나만 보기) 또는 단순 이분법으로 되어 있어, 사용자가 신규 목표를 세울 때 커뮤니티 연결감(동류 연대)을 체감하기 어렵고 고립감을 느낌.
  - **2층 (구조 및 옵션의 부재)**: 공개 범위가 `public`(전체 공개) 아니면 `private`(나만 보기) 또는 폐쇄적인 `team`(팀원 공개)뿐이어서, "나와 동일한 주제/카테고리(테마)를 달리는 사람들에게만 안전하게 나누고 싶다"는 중간 완충 지대(`theme`) 옵션이 누락됨.
  - **3층 (프라이버시 노출 불안)**: 목표를 공개할 때 나의 속마음, 세부 반추/회고 기록, 민감 메모까지 타인에게 무차별 노출될까 봐 전체 공개를 꺼리는 심리적 장벽 존재.
- **대상 사용자 페르소나 및 상황**:
  - 목표를 세우고 꾸준히 달리고 싶지만, SNS식 과시나 사생활 노출은 부담스럽고, 나와 같은 테마(운동, 공부, 개발 등)를 실천하는 러너들과 안전하게 긍정적 자극만 주고받고 싶은 보통의 사용자.

## 2. 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 귀속**: **E3 (동류 소통 루프)**
- **체감 가설**: 신규 목표 생성 시 "같은 테마를 실천하는 동료에게만 안전하게 공유된다"는 명확한 안내와 1초 되돌리기(나만 보기) 안전장치를 제공하고, 공개되는 정보도 핵심 4종으로 엄격히 한정하면, 유저는 프라이버시 침해 불안 없이 즉각적인 동류 소속감과 연대감을 체감할 수 있다.
- **[가목] 본질 (Essence) - 3대 철학 심사**:
  1. **무공해성 (Anti-Pollution)**: 화려한 일상 과시나 불필요한 사생활(회고/메모) 노출을 철저히 차단하고 오직 실천의 팩트 지표만 정갈하게 공유하여 무공해 쉼터 유지.
  2. **RPG식 체감 (Immediate Self-Efficacy)**: 내가 목표를 등록하는 순간 동일 테마 동료들의 실천 궤도에 함께 안착함을 직관적으로 인지.
  3. **동류 연대 (Peer Accompaniment)**: 타인과의 서열 비교가 아니라 같은 길을 걷는 러너들과의 따뜻하고 안전한 연결 형성.
- **[나목] 원인 (Root Causes)**:
  1. `index.html` 내 `VISIBILITY_LABELS`에 `theme` 단계가 정의되어 있지 않음.
  2. `#mGoalVis`의 기본 선택지가 `private`로 설정되어 신규 유저가 커뮤니티의 온기를 경험하지 못함.
  3. 피드 및 소통 화면에서 공개 게시글 렌더링 시 타인에게 노출되는 정보 경계가 명확히 분리되지 않음.
- **[다목] 중심 (Core Bottleneck)**:
  - 목표 생성 모달(`#mGoalVis`), 목표 상세 화면(`#goalsPrivacyBadge`, `#goalVisInput`), 소통 피드 렌더러(`renderCommFeed`), 토스트 배선(`#toast`, `#btnUndoThemePrivacy`) 간의 4위 1체 정합성.
- **[라목] 핵심 (Critical Anchor)**:
  - 100% 무손실 보존: 기존 유저의 `public`, `team`, `private` 설정은 단 1건도 손상되지 않아야 하며, 신규 목표의 기본값만 `theme`로 지정되고 1초 되돌리기(Undo) 액션이 즉각 동작해야 함.

## 3. 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **할 것 (DO)**:
  1. `VISIBILITY_LABELS` 객체에 `theme: '같은 테마 공개'` 추가.
  2. 목표 생성 모달 `#mGoalVis`에 `<option value="theme" selected>🏷️ 같은 테마 공개 (기본)</option>`를 기본값으로 탑재.
  3. 목표 상세 상단 배지 `#goalsPrivacyBadge` 순환 로직에 `theme` 단계 편입 (`private` -> `theme` -> `team` -> `public` -> `private`).
  4. 목표 생성 완료 시 `#toast` 내에 `showUndoPrivacyToast(goalId)`를 구동하여 "🏷️ 같은 테마 러너에게만 공유돼요" 안내와 함께 `[🔒 나만 보기로 변경]` 1초 되돌리기 버튼 배선.
  5. 소통 피드 `renderCommFeed` 렌더링 시 타인 글(`!isMe`)에 대해 공개 정보 범위를 `[목표 제목, 진행률(%), 오늘 체크인 한 줄, 연속 실천일수]` 4종으로 엄격 제한하고, 세부 회고(`recordText`) 및 피드백(`feedback`) 노출 차단.
- **하지 말 것 (DO NOT)**:
  1. 기존 유저의 기존 목표 visibility를 강제로 `theme`로 덮어쓰지 않는다 (기존 데이터 불변 보존).
  2. 되돌리기 버튼을 모달을 닫아버리는 방식으로 만들지 않고, 넌인터럽티브 토스트 내 액션 버튼으로 경량 구현한다.
- **스토리지 원장화 3대 명세 (Storage Blueprint)**:
  - **1호 (원격 DB 스키마 명세)**: Supabase `goals` 테이블의 `visibility` 컬럼은 `text` 타입이므로 별도의 DDL 마이그레이션 없이 `'theme'` 문자열 저장 100% 호환.
  - **2호 (스마트 스토리지 분기 설계)**: 로컬스토리지 `ourgoal_profile_backup_*` 및 `ourgoal_guest_profile` 내 goals 배열에 `visibility: 'theme'`가 투명하게 직렬화/역직렬화됨.
  - **3호 (4대 뷰 전파 배선도)**: 되돌리기 클릭 시 `saveProfile()` 후 `dispatchFullViewPropagation('goal_update')` 호출로 `renderGoalsScreen`, `renderHome`, `renderCommFeed` 동시 동기화.

## 4. 1~3 재검토 · 보완 (Critical Review & Edge Cases)
- **기존 기능과의 충돌 여부**:
  - `goalsPrivacyBadge`를 클릭하여 순환 변경하던 기존 사용자 인터랙션과 완벽 호환 (`theme`가 2번째 단계로 자연스럽게 삽입).
- **게스트 모드 호환성**:
  - 둘러보기 게스트 유저가 목표를 생성할 때도 동일하게 `theme`가 기본 적용되며, 로컬스토리지에 안전하게 보존됨.
- **네트워크 오프라인 엣지 케이스**:
  - 1초 되돌리기 실행 시 오프라인 상태에서도 `state.profile.goals` 및 로컬 백업 키에 즉시 반영되므로 데이터 유실 제로.

## 5. 해결 절차 정리 (Implementation Procedure)
1. `index.html` 내 `VISIBILITY_LABELS` 수정 (`theme:'같은 테마 공개'` 추가).
2. `index.html` 내 `openAddGoalModal`(`#mGoalVis`) 옵션 수정 및 기본값 `theme` 설정.
3. `index.html` 내 목표 생성 저장 핸들러에 `showUndoPrivacyToast(newGoal.id)` 연동.
4. `index.html` 내 `goalsPrivacyBadge` 및 `goalVisInput` 렌더링/순환 로직에 `theme` 대응 코드 추가.
5. `index.html` 내 `renderCommFeed` 피드 아이템 렌더링 시 타인 글 4종 정보(제목, 진행률, 한줄, 연속일) 제한 필터 적용.
6. 로컬 헌법 게이트(`verify-integrity-gate.js`) 및 `npm test` 전수 검증.

## 6. 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점(SPOF) 검증**:
  - `showUndoPrivacyToast` 실행 시 대상 `goalId`가 삭제되었거나 전역 `state.profile.goals`에서 찾을 수 없는 경우, 방어 코드로 null 체크하여 에러 없이 조용히 닫힘.
- **강력한 반대 논거 2가지 및 반박/수용**:
  - **반론 1**: 목표 생성 직후 토스트에 되돌리기 버튼을 두면 사용자가 무심코 화면을 터치하다가 실수로 누르거나 놓칠 수 있다.
    - **반박 및 수용**: 토스트 표시 시간을 5초로 넉넉히 확보하고, 토스트 자체 클릭과 버튼 클릭 이벤트를 `e.stopPropagation()`으로 분리하여 의도치 않은 오동작을 원천 방지한다. 나아가 목표 화면 상단의 `#goalsPrivacyBadge`를 누르면 언제든지 원클릭으로 공개 범위를 다시 변경할 수 있으므로 절대 영구 고립되지 않는다.
  - **반론 2**: 타인의 글에서 세부 회고(`recordText`)를 완전히 가리면 소통 피드가 너무 밋밋해지지 않는가?
    - **반박 및 수용**: 결심 5의 핵심 취지는 "과도한 사생활 노출로 인한 심리적 저항감 해소"이다. 핵심 실천 한 줄(`caption`)과 진행률, 연속일수만으로도 충분히 깊은 동류 의식을 느끼게 하며, 자신이 직접 작성한 글(`isMe`)에서는 본인의 세부 회고가 온전히 노출되므로 만족감을 보존한다.

## 7. 단계별 실행 기준 (Success Metrics & Criteria)
- **C1**: `index.html` 내 `VISIBILITY_LABELS` 객체에 `theme:'같은 테마 공개'`가 존재한다.
- **C2**: `index.html` 내 `#mGoalVis` 셀렉트 박스에 `<option value="theme" selected>`가 존재한다.
- **C3**: `index.html` 내에 `showUndoPrivacyToast` 함수가 구현되어 1초 되돌리기 버튼(`#btnUndoThemePrivacy`)이 배선되어 있다.
- **C4**: `index.html` 내 `#goalsPrivacyBadge` 클릭 시 `theme` 공개 단계로 순환 변경된다.
- **C5**: `index.html` 내 `renderCommFeed`에서 타인 글(`!isMe`)에 대한 세부 회고/피드백 노출 제한 로직이 탑재되어 있다.
- **C6**: `verify-integrity-gate.js` 38개 검증 및 `npm test` 440개 테스트 100% PASS.

## 8. 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**: 기존 스모크 테스트 중 `goalsPrivacyBadge` 텍스트 단언문이나 `VISIBILITY_LABELS` 키 검사가 있을 경우 순서 변경으로 인한 단언 실패 가능성.
- **재검증 트리거**: `npm test` 실행 시 실패하는 테스트가 발생하면 즉시 해당 단언문의 요구 조건을 확인하고, 원칙 4(기존 기능과의 충돌 여부)로 되돌아가 `VISIBILITY_LABELS`의 키 순서 및 뱃지 텍스트를 하위 호환되도록 미세 조율한다.
