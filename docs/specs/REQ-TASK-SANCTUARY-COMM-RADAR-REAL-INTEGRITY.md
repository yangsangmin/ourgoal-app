# 요구사항 정의서 (REQ) — 포커스 성소 실시간 러닝메이트 레이더 실기능 100% 복구 및 헌법 개정안 준수

> **문서 ID**: REQ-TASK-SANCTUARY-COMM-RADAR-REAL-INTEGRITY  
> **티켓 연계**: #TASK-SANCTUARY-COMM-RADAR-REAL-INTEGRITY  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity AI  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) v2026.09.18 준수 (헌법 제2조 1~6항 전수 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문**:
  > "실시간 러닝메이트 레이더 정상작동 안함(일단 하나만 먼저 확인해봤음) 오늘기준 헌법 개정 다시 했는데, 그 헌법 기준대로 처음부터 다시 작업해"

- **기저 층위별 심층 분석**:
  1. **1층 (표면 결함 및 미작동)**:
     - 소통 탭 상단의 '실시간 러닝메이트 레이더' 카드 내 아이템 클릭 시 바인딩된 `window.OurgoalSanctuaryV3.openPeerDm` 함수가 코드베이스 어디에도 정의되어 있지 않아 클릭 시 일체의 반응이 없거나 런타임 에러(TypeError)가 발생함.
     - 새로고침 버튼 클릭 시 실제 데이터 동기화 없이 `toast('새로운 러닝메이트 레이더를 스캔했습니다!')`라는 가짜 껍데기 알림만 노출됨.
  2. **2층 (구조적 결함 및 헌법 위반)**:
     - 레이더 카운트에 실측 데이터와 무관한 `28명 몰입 중`이라는 하드코딩된 위조 숫자 노출 (헌법 제4조 제1항 제1호 허상 지표 날조 위반).
     - `defaultPeers` 배열에 '도윤', '민지', '수진' 등 실 계정이 없는 하드코딩 가상 인물들이 실 유저인 것처럼 표시됨 (헌법 제13조 실 사용자 계정 상호 연동 헌법 위반).
  3. **3층 (시스템 괴리 및 시각 IA 부재)**:
     - 성소 뷰와 기존 소통 탭 핵심 서브시스템(피드/팀/동반자/DM/마니또/공유) 간의 시맨틱 통합 배선이 부재하여 상단 레이더와 하단 실제 대화방·프로필 간 상태 전파가 단절됨.
     - 최신 개정 헌법(v2026.09.18)의 제2조 제6항(시각 IA 및 시맨틱 통합 배선도 명세) 및 제7조 제8항(시각 자가감사)이 적용되지 않은 상태로 릴리즈됨.

- **대상 페르소나 및 발생 상황**:
  - 소통 탭에 진입하여 러닝메이트 레이더를 보고 동료의 아바타를 클릭해 대화를 시도하거나 응원을 보내려던 사용자. 클릭해도 아무 반응이 없어 앱이 고장 났다고 인지하게 됨.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **[본질] (Essence)**:
  - 겉으로만 그럴듯하게 보이는 하드코딩 껍데기 레이더를 완전히 걷어내고, 사용자의 실제 동반자 및 팀원 데이터베이스와 직결된 '진짜 실시간 러닝메이트 인터페이스'로 전환하는 것.
- **[원인] (Root Causes)**:
  1. 원인 1: 성소 V4 개편 시 디자인 시안을 빠르게 구현하는 과정에서 가짜 더미 유저 배열(`defaultPeers`)과 하드코딩 숫자(`28명`)를 그대로 방치함.
  2. 원인 2: 레이더 아이템 클릭 이벤트(`openPeerDm`)의 실제 핸들러 구현을 누락하여 데드 클릭(Dead Click) 발생.
  3. 원인 3: 새로고침 버튼에 서버리스 동기화 파이프라인 대신 단순 가짜 토스트만 배선함.
- **[중심] (Core Bottleneck)**:
  - 실제 동반자/팀원 데이터(`state.profile.companions`, `getTeamMembersPool()`)를 단일 진실 원천(SSOT)으로 삼고, 클릭 시 기존 검증된 DM 시스템(`state.commSubTab = 'dm'`, `renderCommScreen()`) 및 프로필 모달과 1:1 결속시키는 배선.
- **[핵심] (Critical Anchor)**:
  - 헌법 제13조(실 사용자 계정 연동) 및 제4조 제1항 제1호(위조 숫자 절대 금지) 준수: 실 동반자가 0명일 때 위조 숫자를 띄우지 않고 투명한 안내와 `[+ 동반자 찾기]` 다이렉트 CTA를 제공하여 진실하고 결함 없는 UX 확립.
- **귀속 축 및 체감 가설**:
  - **귀속 축**: **E3 (동류 소통 루프) & FIX (버그 수정)**
  - **체감 가설**: 레이더에서 실제 내 동반자와 팀원을 한눈에 확인하고, 원클릭으로 1:1 대화방을 열어 소통할 수 있게 되면 사용자는 신뢰감을 회복하고 동류 의식을 강하게 체감한다.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

### 1) 하지 말 것 (Don'ts)
- 하드코딩된 가짜 유저(도윤, 민지 등) 유지 금지.
- 실측과 무관한 하드코딩 카운트('28명 몰입 중') 유지 금지.
- 실제 동작 없는 가짜 토스트(`toast('...스캔했습니다')`) 유지 금지.
- 쓰이지 않는 더미 함수(`cheerPost`, `transplantSampleRoutine`) 방치 금지.

### 2) 할 것 (Dos)
- 실제 데이터 SSOT 직결:
  - `state.profile.companions` (실제 추가된 동반자)
  - `window.OurgoalTeamInviteComm.getTeamMembersPool()` (실제 참가 중인 팀원)
  - 중복 제거 합집합으로 실제 러닝메이트 풀 구성.
- 실제 활성 인원 수 표기:
  - `실제 인원 N명 몰입 중` (실제 결합된 인원 수).
  - 0명일 때: `0명 (동반자를 추가해보세요!)` + `[+ 동반자 찾기]` 버튼 노출.
- 4위 1체 클릭 배선:
  - `openPeerInteraction(peerId)`: 클릭 시 프로필 모달(`openUserProfileModal`) 호출 또는 `state.commSubTab = 'dm'`, `state.dmActiveId = peerId` 설정 후 `renderCommScreen()` 호출하여 즉시 1:1 DM 활성화.
- 새로고침 실제 파이프라인:
  - `refreshRadar(btn)`: 버튼 회전 인디케이터 + `syncCompanionsFromDb()` 비동기 호출 + 최신 데이터로 레이더 재렌더링 + 실제 팩트 토스트.

### 3) 스토리지 원장화 3대 명세 (헌법 제2조 제4항)
- **1호 (원격 DB 스키마 명세)**:
  - 대상 테이블: `users` (컬럼: `companions` jsonb) 및 `team_pings` (실시간 브로드캐스트)
  - 기존 스키마 100% 호환 (신설/파괴 없음).
- **2호 (스마트 스토리지 분기 설계)**:
  - `ourgoal_companions_backup_{uid}` localStorage 0ms 동기식 복원 + `/api/track` 비동기 서버리스 동기화.
- **3호 (4대 뷰 전파 배선도)**:
  - 동반자 변경 및 DM 발송 시 `renderCommScreen()` 및 `renderSanctuaryComm()` 실시간 동시 전파.

### 4) 시각적 IA 및 시맨틱 통합 배선도 (헌법 제2조 제6항)
- **1호 (상하 위계 및 서브뷰 공존 설계)**:
  ```text
  [screen-comm 소통 화면]
    ├── [sanctuaryCommView] (상단 조형)
    │     └── .s-peer-radar-card (실시간 러닝메이트 레이더)
    │           ├── .s-radar-head (라이브 닷 + 실측 인원수 카운트 + 새로고침 버튼)
    │           └── .s-radar-scroll (가로 스크롤 동반자/팀원 카드 덱 or 0명 시 엠프티 CTA)
    ├── .screen-head (중간 헤더)
    │     ├── h2 "소통"
    │     └── #btnCommPostFeed "게시하기"
    └── #commBody (하단 핵심 실행 뷰)
          ├── .comm-subtabs (6대 서브탭: 피드 / 팀 / 동반자 / DM / 마니또 / 공유)
          └── #commSubBody (각 서브탭 실제 렌더링 컨테이너)
  ```
- **2호 (기존 기능 슬롯 1:1 이식 매핑표)**:
  | 기존 기능 | 레이더 슬롯 연계 | 동작 결과 |
  | :--- | :--- | :--- |
  | 동반자 프로필 | 레이더 아바타 클릭 | `OurgoalTeamInviteComm.openUserProfileModal(peer)` 호출 |
  | 1:1 DM 대화 | 레이더 DM 버튼 / 직접 클릭 | `state.commSubTab = 'dm'; state.dmActiveId = peer.id; renderCommScreen();` |
  | 동반자 검색 | 0명 시 `[+ 동반자 찾기]` 클릭 | `state.commSubTab = 'companion'; renderCommScreen();` 후 검색 인풋 포커스 |
  | 동반자 동기화 | 레이더 새로고침 클릭 | `syncCompanionsFromDb()` 호출 후 실시간 UI 갱신 |
- **3호 (모바일 반응형 뷰포트 여백 예산 - 375px / 430px)**:
  - 레이더 아이템: 가로 56px, 마진/갭 12px, 터치 타겟 최소 44×44px(아바타 링).
  - 텍스트 말줄임: `width: 100%; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;` 엄격 적용으로 375px 뷰포트에서도 글자 짤림 방지.

### 5) 전수 인터랙션 명세표 (Zero Dead-Click)
| 요소 | 식별자 | 이벤트 | 핸들러 | 기대 결과 |
| :--- | :--- | :--- | :--- | :--- |
| 레이더 아바타 | `.s-radar-item` | click | `window.OurgoalSanctuaryV3.openPeerInteraction(id)` | DM 대화방 전환 또는 프로필 모달 오픈 |
| 새로고침 버튼 | `.s-radar-refresh-btn` | click | `window.OurgoalSanctuaryV3.refreshRadar(this)` | 스피너 회전 및 DB 동기화 후 레이더 갱신 |
| 엠프티 CTA | `#sRadarEmptyBtn` | click | `window.OurgoalSanctuaryV3.gotoCompanions()` | 소통 탭 동반자 서브탭으로 즉시 이동 |

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)

- **비판적 재검토**:
  - 만약 사용자가 동반자도 없고 팀에도 가입하지 않은 완전 신규 사용자(Cold Start)라면 레이더가 텅 비게 됨.
  - *보완책*: 헌법 제13조 제3항 규정에 따라, 가짜 유저를 실유저로 속이지 않고 친절한 빈 상태 안내 카드(`아직 연결된 러닝메이트가 없습니다`)와 `[+ 동반자 검색하러 가기]` 버튼을 제공하여 자연스럽게 동반자 추가로 유도함.
- **오프라인 / 게스트 세션 검토**:
  - 게스트 모드일 때도 localStorage 백업 키에서 동반자를 읽어올 수 있으며, 새로고침 시 로그인 소프트 게이트(`showGuestSoftAuthGate`)가 안전하게 동작하도록 가드 탑재.
- **기존 소통 서브탭과의 충돌 여부**:
  - 레이더는 상단 보조 네비게이션/상태창이며 하단의 `commBody`를 전혀 침범하거나 숨기지 않으므로 상호 공존성 100% 보장.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)

1. **시퀀스 1: `js/sanctuary-v3-engine.js` 외과수술적 직결**:
   - `renderSanctuaryComm()` 내 하드코딩 위조 데이터(28명, defaultPeers) 완전 삭제.
   - `state.profile.companions` 및 `OurgoalTeamInviteComm.getTeamMembersPool()` 실시간 합집합 구성 로직 탑재.
   - `OurgoalSanctuaryV3.openPeerDm`, `OurgoalSanctuaryV3.refreshRadar`, `OurgoalSanctuaryV3.gotoCompanions` 정식 함수 구현 및 window 노출.
   - 미사용 더미 변수/코드(`feedSampleHtml`, `cheerPost`, `transplantSampleRoutine`) 영구 제거.
2. **시퀀스 2: `ui.css` 시각 조형 및 터치 타겟 정밀화**:
   - `.s-radar-item` 44×44px 터치 타겟 규격 준수.
   - 엠프티 스테이트 카드 및 새로고침 스피너 애니메이션 추가.
3. **시퀀스 3: `sw.js` PWA 캐시 갱신**:
   - `CACHE_NAME` 버전 갱신 (헌법 제14조 제3항).
4. **시퀀스 4: 6대 무결성 검증 및 CDP 실측**:
   - 게이트키퍼(22/22) 및 npm test(321+) 통과 확인.
   - Chrome CDP 모바일(375px, 430px) 캡처 및 5대 시각 자가감사 수행.
5. **시퀀스 5: 로컬 main 병합 및 5A 프리뷰 배포**:
   - 헌법 제9조 제1항에 따라 Vercel 5A 프리뷰 배포 자동 실행 및 상민님 승인 대기.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **SPOF 점검**:
  - `OurgoalTeamInviteComm` 모듈이 아직 로드되지 않은 시점에 레이더가 렌더링될 경우:
    - `window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.getTeamMembersPool` 안전 가드 탑재하여 빈 배열 폴백 처리.
- **재검증에 따른 절차 수정사항**:
  - 레이더 아이템 클릭 시 곧바로 DM 창으로 갈 수도 있지만, 유저의 프로필(목표, 스트릭, 히트맵)을 먼저 보고 싶을 수도 있으므로, 프로필 모달(`openUserProfileModal`)을 열고 그 모달 안에 `[1:1 DM 보내기]` 버튼이 직결되어 있으므로 프로필 모달을 최우선으로 열도록 결속함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)

1. 레이더 상단 인원수 카운트가 실제 동반자/팀원 수와 1:1로 일치할 것 (위조 숫자 0건).
2. 레이더의 어떤 아바타나 카드를 클릭해도 콘솔 에러 0건 및 지정된 프로필 모달 또는 DM 대화방이 100% 열릴 것 (데드 클릭 0건).
3. 새로고침 버튼 클릭 시 실제 동기화 함수가 호출되고 팩트 토스트가 표출될 것.
4. 동반자가 0명일 때 엠프티 CTA를 누르면 즉시 동반자 탭으로 전환될 것.
5. `npm test` 및 `verify-integrity-gate.js` 100% 통과 (0 failure).
6. Chrome CDP 실측 캡처에서 5대 시각 자가감사(글자짤림, 대칭성, 뷰공존, 기능가시성, 터치타겟) ALL PASS 판정.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)

- **예상 블로커**:
  - 프로필 모달 오픈 시 CSS z-index 충돌로 성소 뷰 뒤에 모달이 가려질 위험.
  - *대응책*: `#modalSheet` 및 `#modalOverlay`의 z-index가 성소 뷰포트(9990)보다 높은 z-index: 10000 이상으로 유지되고 있는지 사전 점검.
- **재검증 트리거**:
  - 만약 아바타 클릭 시 프로필 모달이 열리지 않는 경우: [원칙 ⑥]으로 되돌아가 `OurgoalTeamInviteComm.openUserProfileModal` 및 `openModal` 바인딩을 즉시 재검증.
