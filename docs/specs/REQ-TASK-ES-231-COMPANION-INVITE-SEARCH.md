# 요구사항 정의서 (REQ) — 소통 탭 내 [🔗 내 전용 동반자 초대 링크 복사] 및 [가입자 닉네임 검색] 상단 신설

> **문서 ID**: REQ-TASK-ES-231-COMPANION-INVITE-SEARCH  
> **티켓 연계**: #TASK-ES-231  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문**:
  > *"90번 완료처리하고, 89번부터. 번호대로 계속 하나씩 간다"*  
  > ➔ 노션 '💡 아워골 생각 메모장 (명령대기 & 아이디어 DB)' 101번 항목:  
  > **"소통 탭 내 [🔗 내 전용 동반자 초대 링크 복사] 및 [가입자 닉네임 검색] 상단 신설"** 착수.
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. **초대 경로 부재로 인한 외부 친구 영입 단절**:
     - 소통 탭 동반자(companion) 화면 진입 시 외부 메신저(카카오톡, 문자, SNS 등)로 내 동반자로 즉시 합류할 수 있는 전용 초대 링크를 복사/공유하는 버튼이 상단에 눈에 띄게 제공되지 않아, 외부 지인을 영입하려는 유저의 공유 여정이 가로막힘.
  2. **가입자 닉네임 검색의 반응성(디바운스 실시간 검색) 미비**:
     - 기존 닉네임 검색은 검색 버튼을 누르거나 엔터를 쳐야만 동작하여, 타이핑 도중 실시간으로 일치하는 유저가 표시되는 모던 인터랙션(200ms 디바운스 실시간 검색)이 부재하여 번거로움.
  3. **모바일 375px 규격 및 미세 햅틱 피드백 부재**:
     - 초대 링크 복사 시 15ms 미세 햅틱과 토스트 피드백, 검색 결과 유저에 대한 [🤝 동반자 신청] 원클릭 시 12ms 햅틱 반응이 미비함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**:
     - 외부 공유용 내 고유 래퍼럴 초대 링크(https://ourgoal-app.vercel.app?ref=...) 원클릭 복사/공유(navigator.share / clipboard) 파이프라인 결여.
  - **2층 (구조/프로세스 부재)**:
     - 0.2초(200ms) 디바운스 인풋 이벤트 리스너와 로컬 캐시/RPC 연계 실시간 가입자 필터링 파이프라인 부재.
  - **3층 (시스템/유저 체감 괴리)**:
     - 유저는 앱 내에서 친구를 부르고 바로 함께 달리고 싶어 하지만, 초대 링크 버튼이 없어 지인에게 앱을 소개하고 동반자로 맺는 여정이 복잡하고 단절됨.
- **사용자 상황 및 페르소나**:
  - 친구나 스터디원과 함께 매일 실천하기 위해 자신의 초대 링크를 공유하거나, 이미 아워골에 가입한 동료의 닉네임을 빠르게 찾아 동반자 신청을 보내고 싶은 열정적인 목표 실천가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 축 (Essence Axis)**: E3 (동류 발견 및 상호 지지 소통 루프)
- **[본질] (Essence)**:
  - 동반자 화면의 본질은 **"외부 지인을 손쉽게 초대(초대 링크 복사)하고, 이미 가입된 회원을 즉시 탐색(실시간 닉네임 검색)하여 동반자 관계를 맺고 상호 응원을 시작하는 상호 작용의 시발점"**이다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (초대 액션 앵커 부재)**:
     - 동반자 탭 상단에 유저의 자부심을 고취하고 링크를 공유하도록 유도하는 영롱한 초대 히어로 카드가 부재함.
  2. **원인 2 (실시간 검색 인터랙션 부재)**:
     - 인풋 타이핑 시 200ms 디바운스를 통해 자동으로 결과를 좁혀주는 실시간 인풋 파이프라인 부재.
  3. **원인 3 (햅틱 및 피드백 결여)**:
     - 링크 복사/공유 및 동반자 신청 시 손끝으로 전해지는 12~15ms 햅틱과 명확한 토스트 안내 부족.
- **[중심] (Core Bottleneck & Anchor)**:
  - 동반자 탭 상단에 영롱한 그라데이션의 초대 히어로 카드와 #btnCopyCompanionInviteLink를 배치하고, #companionNicknameSearchInput에 200ms 디바운스 실시간 검색 및 검색 결과 카드 내 [🤝 동반자 신청] 버튼을 4위 1체로 완벽 배선.
- **[핵심] (Critical Safety & Termination)**:
  - navigator.share 미지원 환경(데스크톱 브라우저 등)에서도 navigator.clipboard.writeText 및 document.execCommand('copy')를 통한 100% 클립보드 복사 성공 보장.
  - 기존 동반자 목록, DM 연결, 아바타 모달 조회 등 기존 인터랙션 100% 무손실 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 동반자 탭에 들어섰을 때 상단의 영롱한 초대 카드에서 [🔗 내 전용 동반자 초대 링크 복사]를 1터치하여 친구에게 손쉽게 보내고, 검색창에 닉네임을 몇 글자만 쳐도 0.2초 만에 실시간으로 회원이 나타나 [🤝 동반자 신청]을 보내며 진정한 함께 달림의 기쁨을 느낀다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인(세션, 게스트, 소셜)에 미치는 영향: 게스트 사용자의 경우 로그인 소프트 게이트 호출, 회원은 자신의 닉네임이 반영된 초대 링크 즉시 생성.
  - 홈 화면 및 스트릭에 미치는 영향: 영향 없음 (독립적 소통 탭 UI/UX 강화).
  - 기록/통계/캘린더 탭에 미치는 영향: 영향 없음.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말아야 할 것 (Avoid)**:
  - 기존 동반자 목록 렌더링 로직이나 DM 연결 버튼 구조를 파괴하지 않는다.
  - 외부 라이브러리(Lodash debounce 등) 의존성을 추가하지 않고 순수 JS 타이머 기반으로 경량 구현한다.
  - 검증되지 않은 버튼 클래스를 사용하여 데드클릭 린터를 깨뜨리지 않는다.
- **해야 할 것 (Action)**:
  - js/team-invite-comm.js 내 renderCommCompanions(body) 상단에 .companion-hero-card 및 #btnCopyCompanionInviteLink 배치.
  - #companionNicknameSearchInput 및 200ms 디바운스 실시간 검색 이벤트 배선.
  - 검색 결과 내 data-request-companion="userId" 버튼 및 12ms 미세 햅틱 배선.
  - ui.css에 모바일 375px 기준 44px 터치 타깃 및 영롱한 그라데이션 카드 스타일 추가.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**:
  - 기존 team_pings / profiles 테이블 활용, 추가 DDL 없음.
- **2호 (스마트 스토리지 분기 설계)**:
  - 동반자 신청 및 추가 정보는 localStorage 및 프로필 원장에 영속화.
- **3호 (4대 뷰 전파 배선도)**:
  - 동반자 추가 시 state.profile.companions 갱신 및 소통 화면 즉시 리렌더링.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| #btnCopyCompanionInviteLink | 동반자 상단 히어로 카드 | 클릭/터치 | 초대 링크 생성, navigator.share 호출 또는 클립보드 복사, 15ms 햅틱 | 클립보드 권한 거부 시 fallback 복사 및 성공 토스트 |
| #companionNicknameSearchInput | 동반자 상단 검색 영역 | 키보드 입력 | 200ms 디바운스 후 실시간 닉네임 검색 실행 | 검색어 공백 시 목록 초기화 |
| #companionSearchBtn | 동반자 상단 검색 영역 | 클릭/터치 | 즉시 닉네임 검색 실행 및 12ms 햅틱 | 유저 미발견 시 안내 문구 표출 |
| [data-request-companion] | 검색 결과 카드 | 클릭/터치 | 12ms 햅틱 + 동반자 신청/추가 및 영속화 | 이미 동반자일 경우 안내 토스트 표출 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 기존 동반자 목록 및 세션 정보 100% 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)

- **비판적 자기 검토 및 약점/한계 인정**:
  - navigator.share는 HTTPS 환경 및 특정 모바일 브라우저에서만 동작하므로 반드시 클립보드 복사(navigator.clipboard.writeText) 및 레거시 document.execCommand('copy') 삼중 폴백을 완비해야 함.
- **기존 기능과의 충돌 가능성 검토**:
  - 기존 #companionSearchInput을 #companionNicknameSearchInput과 상호 호환하여 기존 코드나 테스트가 깨지지 않도록 방어.
- **엣지 케이스 (Edge Cases)**:
  - 게스트 유저: 초대 링크 생성 시 닉네임 기본값('mate') 적용 및 동반자 신청 시 소프트 로그인 게이트 안내.
  - 검색어 타이핑이 매우 빠른 경우: 200ms 디바운스 타이머가 이전 요청을 취소하여 불필요한 네트워크 트래픽 차단.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

- **구체적 실행 시퀀스**:
  1. [단계 1]: ui.css에 .companion-hero-card, .companion-search-input, .companion-search-result-card 등 모바일 375px 전용 스타일 정의.
  2. [단계 2]: js/team-invite-comm.js의 renderCommCompanions 상단에 영롱한 초대 히어로 카드 및 #btnCopyCompanionInviteLink 렌더링.
  3. [단계 3]: 200ms 디바운스 실시간 검색 인풋(#companionNicknameSearchInput) 및 검색 결과 내 [data-request-companion] 신청 버튼 배선.
  4. [단계 4]: 스모크 테스트(scripts/smoke-test.js)에 #TASK-ES-231 검증 단언문 4종 추가.
  5. [단계 5]: npm test 실행 및 38개 헌법 게이트, Zero Dead-Click 100% PASS 확인.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - Web Share API 실패나 클립보드 API 미지원 브라우저 환경이 SPOF가 될 수 있으나, 3중 폴백(navigator.share -> navigator.clipboard -> textarea execCommand)을 통해 무조건 링크 복사가 성공하도록 설계.
- **가정의 타당성 검증**:
  - /api/track 또는 Supabase RPC가 오프라인이거나 느릴 때 검색 인풋이 블로킹되지 않도록 비동기 처리 및 에러 핸들링 완료.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - 기존 #companionSearchInput ID 셀렉터를 그대로 유지하면서 신규 #companionNicknameSearchInput과 동시 바인딩하여 하위 호환성 100% 확보.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- 모든 인터랙티브 버튼 클릭 시 콘솔 에러 0건.
- npm test 335개 이상 전체 PASS (0 failure).
- 헌법 무결성 5대 게이트 38개 전수 ALL PASS.
- Zero Dead-Click 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 연계 티켓: #TASK-ES-231 (본질축: E3)
- 노션 DB 101번 항목과 완벽히 1:1 일치.
