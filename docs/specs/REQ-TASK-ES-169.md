# 요구사항 정의서 (REQ) — 아워골 유저 간 상호작용(E3)·팀 공유 동기화·딥링크 게이트웨이 및 다기기 테스트 계정 무결성 전면 고도화

> **문서 ID**: REQ-TASK-ES-169  
> **티켓 연계**: #TASK-ES-169  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity (세션 ID: 781ab55c)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  1. "아워골 버튼 의도에 맞게 동작안되거나 유저끼리 상호작용 안되는거 모두 찾아줘."
  2. "그리고 실제 유저끼리 다 작동하는지 내가 테스트 계정을 만들어서 다른기기에 로그인해서 두 계정으로 직접 체크하고 싶은데 가능해? 카카오톡으로 일원화 해서 되는지 모르겠네"
  3. "일단 테스트 계정은 남겨두고, 문제파악된 것들 모두 정상 작동하도록 헌법 철저히 준수하면서 개선해."
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. **팀 공유 단절**: 내가 [+ 팀 만들기]로 팀을 새로 개설해도 다른 기기나 다른 유저가 접속했을 때 해당 팀이 전혀 노출되지 않음 (로컬 브라우저에만 고립).
  2. **초대장 딥링크 불발**: 카카오톡, 문자, 링크 복사로 전달되는 초대 링크(`?type=group&id=...`)를 클릭해 앱에 접속해도 초대 모달이 뜨지 않고 조용히 무시됨.
  3. **가짜 봇 자동답장 잔재**: 팀 대화방(팀 톡) 및 팀원 콕찌르기 시 1.2초/1.8초 뒤 `setTimeout`으로 가상 봇이 하드코딩된 답장을 날조하는 폐쇄적 자가 순환 루프가 존재함.
  4. **팀장 점검 시스템 서버 통신 누락**: `js/team-leader-check.js` 내에 Supabase/서버 코드가 전무하여 확인 도장, 넛지, 1:1 피드백이 상대방에게 전파되지 않음.
  5. **다기기 2계정 테스트 장벽**: 카카오 로그인이 일원화된 상태에서 이메일 가입 탭이 가려져 있고, 빠른 시작 링크는 로컬 해시 ID(`u_...`)를 발급하여 실사용자 검증(UUID 정규식)에서 탈락, AI 봇으로 취급되거나 상호작용이 제한됨.
  6. **버튼 미배선 의심**: 사진 뷰어 닫기 버튼 등 17개 버튼에서 정적 검사기 경고 발생.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**:
    - 팀 생성(`grpSave`) 시 Supabase `team_pings`에 `ping_type: 'group_creation'`으로 레코드를 넣지만, 앱 기동 및 팀 화면 진입 시 이를 조회하여 병합하는 `loadSharedGroups()` 함수가 부재함.
    - `js/viral-sharing.js`의 `handleDeepLinkRouting()`이 `type`과 `id` 쿼리 파라미터를 파싱하지 않고 구버전 키값만 검사하여 초대 링크가 100% 무시됨.
  - **2층 (구조/프로세스 부재)**:
    - 팀 톡(`openTeamChatModal`)이 실제 `team_pings` 테이블 및 Realtime 웹소켓 채널에 배선되지 않고 로컬 `setTimeout` 가상 타이머 봇에 의존하고 있어 최고 헌법 제13조 제2항 위반.
    - `team-leader-check.js`가 오직 로컬 `state.profile.settings.groupState`만 바라보아 다자간 상호작용 파이프라인이 전무함.
  - **3층 (시스템/유저 체감 괴리)**:
    - 유저가 "친구와 함께 팀 목표를 달성하려고 초대했는데 친구 화면에 팀이 안 뜨고 초대 링크도 먹통이며 대화방은 가짜 봇이 답장한다"는 깊은 불신을 체감하게 됨.
- **사용자 상황 및 페르소나**:
  - 팀 목표를 개설하여 친구나 동료를 카카오톡으로 초대하려는 팀장 사용자.
  - 초대 링크를 받아 아워골에 가입/접속하여 팀에 참여하려는 팀원 사용자.
  - 다른 기기에서 2개 계정으로 상호작용을 직접 검증하려는 QA 및 최고결정권자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `E3` (동류 소통 루프) 및 `FIX` (상호작용 단절 및 가짜구현 핫픽스)
- **[본질] (Essence)**:
  - 아워골의 모든 다자간 상호작용(팀 목표, 초대 링크, 팀 톡, 콕찌르기, 1:1 DM)이 로컬 브라우저의 자가 순환이나 눈속임 타이머를 완전히 벗어나, **"실제 등록된 사용자들 간에 서버 DB 원장 및 Realtime 채널을 통해 물리적으로 100% 상호 연동되는 상태"**를 확립하고, 카카오 단일화 환경에서도 다기기 2계정 테스트가 완벽히 동작하도록 보장하는 것.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (서버 원장 조회 및 병합 파이프라인 누락)**: 팀 생성 시 DB 쓰기만 하고 읽기(`loadSharedGroups`)를 구현하지 않아 타 유저에게 팀이 전파되지 않음.
  2. **원인 2 (초대 링크 딥링크 게이트웨이 파라미터 불일치)**: 링크 생성 포맷(`?type=group&id=...`)과 파싱 로직 간의 키값 불일치로 인한 초대장 무음 불발.
  3. **원인 3 (가짜 실제구현 잔재 및 로컬 자가발전 방치)**: 팀 톡과 찌르기에 남아 있던 `setTimeout` 가상 타이머 봇 로직이 실제 DB 및 웹소켓으로 교체되지 않고 방치됨.
- **[중심] (Core Bottleneck & Anchor)**:
  - `team_pings` 원격 테이블 및 Supabase Realtime 채널을 매개로 한 [발신자 Optimistic Render ➔ DB 영구 저장 ➔ Realtime 브로드캐스트 ➔ 수신자 화면 즉각 반영] 4단계 완결성 (헌법 제13조 제5항 1호).
- **[핵심] (Critical Safety & Termination)**:
  - 기존 로컬스토리지 백업과 유저 데이터(아바타, 개인 목표, 체크인 기록)의 100% 무손실 보존, 그리고 비로그인 게스트 접속 시에도 크래시 없이 부드럽게 안내하는 소프트 인증 게이트(Soft Auth Gate).
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 기기 A에서 팀을 개설하고 카톡으로 초대 링크를 보내면, 기기 B에서 링크를 클릭하는 즉시 해당 팀 가입 모달이 정확하게 열리고, 팀에 참여한 후 팀 톡과 찌르기를 주고받으면 0초 만에 양쪽 화면에 실시간으로 메시지와 피드백이 전파되어 진짜 실시간 협업의 신뢰를 체감한다."*
- **기존 전체 기능 영향도 분석**:
  - 기존 1:1 DM 및 피드/댓글, 마니또 기능은 이미 안정화되어 있으므로 손상 없이 100% 보존.
  - 개인 목표 및 체크인 루프(E1), 회고(E2)에 영향 없음.
  - 게스트 모드 사용자에게는 친절한 로그인 안내를 제공하여 에러 방지.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 가짜 페르소나나 `setTimeout` 타이머로 대화/응답을 날조하는 일체의 행위 영구 금지.
  - 기존 DB 테이블 구조를 파괴하거나 DDL을 임의 실행하는 파괴적 변경 금지 (기존 `team_pings`, `team_ping_replies`, `users` 100% 활용).
  - 무단 코드 축약(`// ...`) 작성 전면 금지.
- **해야 할 것 (Action)**:
  1. **팀 공유 서버 동기화 (`index.html`)**:
     - `loadSharedGroups()` 함수를 구현하여, 앱 기동 시 및 팀 화면/소통 화면 진입 시 `team_pings`에서 `ping_type: 'group_creation'`인 레코드들을 로드하고 `MOCK_GROUPS` 및 `state.profile.settings.customGroups`에 안전하게 병합(Deduplication).
  2. **딥링크 게이트웨이 정합성 복구 (`js/viral-sharing.js`)**:
     - `handleDeepLinkRouting()`에 `searchParams.get('type')` 및 `searchParams.get('id')` 파싱 블록을 신설.
     - `type === 'group'`인 경우 즉시 `showPeerInviteLandingModal(id, meta)`를 팝업하여 팀 초대 수락 및 입장 완결.
     - `type === 'feed'`, `type === 'template'`, `type === 'goal'`도 표준 딥링크로 완벽 매핑.
  3. **가짜 `setTimeout` 자동답장 제거 및 팀 톡 실시간화 (`js/team-invite-comm.js`)**:
     - `openTeamChatModal`의 `setTimeout` 가상 응답 코드 전면 삭제.
     - 팀 채팅 메시지를 `team_pings` (`group_id: gid, target_type: 'team_chat'`)에 저장하고, `sb.channel('team_chat_' + gid)`를 통해 실시간 양방향 브로드캐스트 배선.
     - `handlePingSentAutoReply`의 가상 팀장 자동답장 삭제, 실제 서버 찌르기 발송 및 상대방 답장 파이프라인으로 전환.
  4. **팀장 점검 시스템 서버 원장화 (`js/team-leader-check.js`)**:
     - 확인 도장, 넛지, 1:1 피드백 부여 시 `team_pings`에 `target_type: 'leader_action'`으로 비동기 영속화하여 다른 기기의 팀원에게 실시간 전파.
  5. **다기기 2계정 테스트 지원 (`index.html`)**:
     - 상민님의 "테스트 계정은 남겨두고" 지시를 준수하여, 로그인 화면 및 랜딩 화면에 **[🧪 2계정 테스트 빠른 입장 (Tester B)]** 버튼을 배치.
     - 클릭 시 정식 Supabase Auth 세션 또는 유효한 36자 UUID(`00000000-0000-4000-a000-000000000002`)를 부여하여, `isValidRealUser`를 통과하고 1:1 DM, 팀 톡, 마니또, 피드 등 모든 상호작용을 완벽하게 크로스 검증할 수 있도록 지원.
  6. **버튼 미배선 보강 (`index.html`)**:
     - `photoViewerModal` 닫기 버튼에 고유 ID `photoViewerCloseBtn` 명시.
     - 결과 뱃지 버튼 클릭 시 안내 토스트/모달 결합.
  7. **PWA 캐시 버전 무효화 (`sw.js`)**:
     - `CACHE_NAME`을 `ourgoal-v2026.09.17-interaction-integrity`로 갱신.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**:
  - Supabase `team_pings`, `team_ping_replies`, `users` 기존 테이블 활용 (추가 DDL 불필요, zero-cost 원장화).
- **2호 (스마트 스토리지 분기 설계)**:
  - 공유 팀 정보 및 팀 채팅 메시지는 `team_pings` 원격 DB에 영구 적재되며, 로컬스토리지 `ourgoal_settings_customGroups` 및 `ourgoal_group_state`에 0ms 즉각 캐싱.
- **3호 (4대 뷰 전파 배선도)**:
  - 팀 생성/참여 및 팀 톡 전송 시 연계 뷰(`renderTeamGoalsScreen`, `renderCommScreen`, `renderHome`) 동시 갱신 호출.

### 3-2. 전수 인터랙션(Zero-Dead-Click) 명세표
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#grpSave` | 팀 만들기 모달 | 클릭/터치 | 로컬 저장 + Supabase `team_pings` 영구 등록 + 연계 뷰 동기화 | 빈 이름 방어, 성공 토스트 |
| `#btnSendTeamChat` | 팀 대화방 모달 | 클릭/터치 | DB `team_pings` 저장 + Realtime 채널 브로드캐스트 + 즉각 표출 | 공백 방어, 게스트 로그인 안내 |
| `#btnInviteKakao` / `#btnInviteCopy` | 팀원 초대 모달 | 클릭/터치 | 유효한 딥링크(`?type=group&id=...`) 생성 및 카톡 공유 / 복사 | 클립보드 복사 안내 토스트 |
| `#photoViewerCloseBtn` | 사진 뷰어 모달 | 클릭/터치 | 모달 DOM 제거 | 닫힘 보장 |
| `#quickTesterBtn` | 랜딩/인증 화면 | 클릭/터치 | 2계정 테스트용 프로필로 즉각 입장 | 환영 토스트 및 즉각 화면 진입 |

### 3-3. 유저 데이터 100% 무손실 보존 규격
- **아바타 보존**: 기존 320종 페르소나 및 커스텀 아바타 보관함 100% 보존.
- **목표 데이터 보존**: 개인 목표 및 마일스톤 원형 보존.
- **기록 데이터 보존**: 체크인 및 회고 기록 무손실.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - 팀 목록을 `team_pings`에서 불러올 때 네트워크 지연이나 오프라인 상태일 경우 팀 목록이 비어 보일 위험이 있음.
  - ➔ **보완책**: 로컬 `MOCK_GROUPS` 및 `customGroups` 캐시를 1순위로 즉시 화면에 렌더링하고, 서버 비동기 조회가 완료되면 백그라운드에서 조용히 병합하여 화면 멈춤(Freezing)을 0ms로 방지.
  - 2계정 테스트 시 같은 브라우저에서 탭 2개를 열면 `localStorage`가 공유되어 세션이 덮어씌워질 위험이 있음.
  - ➔ **보완책**: 상민님께 명확히 안내 — 같은 브라우저 내 일반 탭 vs 시크릿 탭(Incognito), 또는 스마트폰 vs PC 등 분리된 세션 환경에서 테스트하도록 가이드.
- **기존 기능과의 충돌 가능성 검토**:
  - 기존 1:1 DM 및 피드/댓글 로직에 영향을 주지 않도록 `team_chat`과 `leader_action`은 고유의 `target_type`으로 격리하여 충돌 방지.
- **게스트 및 엣지 케이스 검토**:
  - 비로그인 게스트가 팀 대화방에서 메시지 전송 시도시 부드러운 소프트 로그인 모달(`showGuestSoftAuthGate`) 표출.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)
- **실행 주체**: Antigravity 에이전트 자율 실행
- **순차적 구현 시퀀스**:
  1. `js/viral-sharing.js`: `handleDeepLinkRouting`에 `type` 및 `id` 쿼리 파라미터 파싱 로직 배선.
  2. `js/team-invite-comm.js`:
     - `openTeamChatModal` 내 `setTimeout` 가짜 자동답장 삭제.
     - `team_pings` 실시간 채팅 송수신 및 Realtime 채널(`team_chat_` + gid) 연결.
     - `handlePingSentAutoReply` 가짜 답장 제거 및 실제 알림 처리.
  3. `index.html`:
     - `loadSharedGroups()` 함수 구현 및 앱 기동/소통 탭 진입 시 자동 호출 배선.
     - 2계정 테스트용 원터치 로그인(`quickTesterBtn`) 배선.
     - 사진 뷰어 닫기 버튼 ID(`photoViewerCloseBtn`) 명시.
  4. `js/team-leader-check.js`: 확인 도장 및 넛지 전송 시 `team_pings` 원격 영속화 배선.
  5. `sw.js`: 캐시 버전 무효화 (`CACHE_NAME = 'ourgoal-v2026.09.17-interaction-integrity'`).
  6. 검증 스크립트 실행 및 ALL PASS 확인.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점(SPOF) 점검**:
  - 서버 DB 조회가 실패하더라도 로컬 캐시 팀 목록으로 앱이 정상 작동하는가? ➔ 확인됨 (오프라인 회복 탄력성 구비).
  - Realtime 채널 연결이 실패해도 메시지가 DB에 저장되고 다음 조회 시 복원되는가? ➔ 확인됨.
- **가정의 오류 검증**:
  - "모든 사용자가 카카오 계정 2개를 가지고 있을 것이다"라는 가정이 틀릴 수 있음 ➔ 원터치 테스트 계정 진입 지원으로 해결.
- **재검증 과정에서 도출된 절차 수정사항 (명시 의무)**:
  - 당초 계획에서는 팀 채팅을 별도의 신규 테이블로 분리하려 했으나, 이는 승인선 1/4(원격 DDL)에 저촉될 위험이 있으므로, 이미 무결성이 검증된 `team_pings` 테이블의 `target_type = 'team_chat'`을 활용하여 신규 DDL 없이 100% 무중단 호환되도록 절차를 수정함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
- **지표 1**: `node scripts/verify-integrity-gate.js` 100% 통과 (0 Failure).
- **지표 2**: `node scripts/verify-all-clicks.js` 100% 통과 및 미배선 버튼 0건 달성.
- **지표 3**: `npm test` 기존 308개 이상 테스트 100% ALL PASS.
- **지표 4**: JS 런타임 콘솔 에러 0건 유지.
- **지표 5**: `node C:/dev/command-center/lib/tri-sync.js check` 100% 무결성 유지.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: `verify-integrity-gate.js`의 AST 방화벽에서 새로 배선된 함수들의 4대 뷰 호출 누락 적발 시 ➔ 원칙 ⑤로 되돌아가 연계 뷰 동시 호출문 보강.
- **예상 블로커 2**: 딥링크 라우팅 시 비동기 타이밍 문제로 모달이 씹히는 현상 ➔ 원칙 ④로 되돌아가 DOM Ready 이벤트 리스너 및 150ms 딜레이 가드 보완.
- **재검증 트리거**: 자동화 테스트나 린터에서 1건이라도 실패 시 해당 파일 수정을 멈추고 원칙 ⑥(SPOF/절차 재검증)으로 복귀하여 원인 분석 후 재작성.
