# 요구사항 정의서 (REQ) — #TASK-ES-145 마니또 실 유저 판별 무결성 및 가짜 실 유저 표기 오류 개선

> **문서 ID**: REQ-TASK-ES-145-REAL-USER-VERIFICATION-MANITO  
> **티켓 연계**: #TASK-ES-145  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity 세션 4db64ddd  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > "실제 유저가 아닌데 실 유저로 표현되고 있음. 오류개선필요." (마니또 화면 스크린샷: 집중하는 러너 #558 [✨ 실 유저])
- **현재 발생하는 결함 및 원인**:
  1. **가짜 실 유저 위장 표출**:
     마니또 카드에서 '집중하는 러너 #558'이라는 템플릿 닉네임과 함께 '[✨ 실 유저]' 뱃지가 표출됨.
  2. **원인 1: 비회원 게스트의 마니또 서버 풀 유입**:
     비회원 게스트 상태에서 마니또 시작(mnJoin)을 누르면 state.profile.id(guest-mu3tbym6qdd5)가 Supabase team_pings의 manito_pool 테이블에 그대로 upsert됨.
  3. **원인 2: loadServerManitoData()의 무조건적인 is_ai: false 매핑**:
     loadServerManitoData()는 team_pings에서 행을 가져올 때 sender_id가 실제 등록된 유저인지 검증하지 않고, 모든 행을 is_ai: false로 처리하여 실 유저 뱃지([✨ 실 유저])를 붙임.
  4. **원인 3: 가짜 스트릭·진행률·기록 하드코딩 (헌법 제4조 제1항 1호 위반)**:
     loadServerManitoData()에서 pct: 50, streak: 3, logs: ['오늘도 목표를...', '꾸준히...', '함께...']를 하드코딩하여, 유저에게 완전한 실 유저인 것처럼 오인시키는 위조 데이터를 날조함.
  5. **원인 4: 게스트 계정의 isKnownAiCompanion 누락**:
     동반자/프로필 로직에서도 guest- 계정이 AI 봇으로도, 실 사용자로도 정밀 분류되지 못하는 갭 존재.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Root Cause & Essence)
- **근본 원인**:
  실제 인증된 회원(Supabase Auth UUID 보유)과 임시 게스트(guest-*) 및 테스트 계정 간의 '실 사용자 식별(Identity Engine)' 방화벽이 누락되어, 서버 테이블에 들어간 모든 레코드를 맹목적으로 '실 유저'로 신뢰함.
- **본질 축 (Essence Axis)**: **E3 (동류 소통) + FIX (버그 수정)**
- **체감 가설 (User Experience Hypothesis)**:
  > *"마니또 매칭 시 실제 가입하여 활동 중인 진짜 회원만 [✨ 실 유저]로 표출되고, 콜드스타트 동반자는 투명하게 [🤖 AI 동반자]로 명시되며, 게스트는 안전하게 분리됨으로써 사용자는 앱의 소통 시스템에 대해 100% 투명성과 신뢰를 체감할 수 있다."*
- **기존 전체 기능 영향도 분석**:
  - 기존 마니또 스탬프 전송, DM 열기, 익명 닉네임 생성 기능 100% 정상 보존.
  - 게스트 모드 사용자도 로컬 AI 마니또와는 문제없이 상호작용 가능.
  - 기존 283개 테스트 100% ALL PASS 유지.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Functional Specifications)
- **스토리지 원장화 3대 명세 (제2조 제4항)**:
  - **1호 (원격 DB 스키마 명세)**: Supabase team_pings(group_id: 'manito_pool'). 신규 테이블 불필요. 기존 불량 게스트 레코드(mn_pool_guest-mu3tbym6qdd5) 격리/무효화(hidden: true, status: 'inactive').
  - **2호 (스마트 스토리지 분기 설계)**: 마니또 파트너 캐시(REAL_MANITO_PARTNERS_CACHE)는 메모리 및 로컬 백업 유지.
  - **3호 (4대 뷰 전파 배선도)**: 마니또 상태 변경 시 renderCommManito 즉시 재렌더링.

### 3-1. 세부 기능 요구사항 (Functional Requirements)
- **FR-01: 엄격한 실 사용자 식별 검증기 (isValidRealUser) 구축**:
  - sender_id가 null/빈값/문자열이 아니면 배제.
  - guest-로 시작하는 모든 게스트 계정 배제 (!/^guest/i.test(id)).
  - 테스트/가상 접두사(test_, probe_, sim_, comp_, mem_, mn_, mock_) 배제.
  - 유효한 Supabase Auth UUID 규격(^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$) 통과 여부 검증.
  - status === 'active' 및 hidden !== true 확인.
- **FR-02: 게스트 마니또 참여 격리 및 소프트 로그인 가이드 (제13조 제3항 제2호)**:
  - mnJoin 클릭 시, 사용자가 게스트(guest-*)인 경우:
    - 원격 Supabase team_pings manito_pool에 게스트 ID 등록을 차단.
    - 로컬에서는 3명의 AI 동반자와 정상 매칭되어 경험 유지.
    - 친절한 소프트 안내: '게스트 모드에서는 AI 동반자와 마니또가 진행돼요. 실 유저 풀에 참여하려면 로그인해주세요 ✨'.
  - 사용자가 인증된 실 사용자(UUID)인 경우에만 team_pings manito_pool에 등록.
- **FR-03: 가짜 하드코딩 스트릭 및 위조 기록 전면 제거 (제4조 제1항 제1호)**:
  - 실 유저의 경우 row.message나 실 사용자 목표 정보를 반영하되, 기록이 없으면 '아직 작성된 기록이 없습니다' 등 진실된 상태 표출.
  - 하드코딩된 더미 스트릭(3일 연속) 및 진행률(50%)을 실 데이터 연동 값으로 안전 처리.
- **FR-04: 콜드스타트 투명 표기 철저화 (제13조 제3항 제1호)**:
  - 실 유저 풀이 비어있거나 매칭 인원이 부족할 때 투입되는 AI 동반자는 100% [🤖 AI 동반자] 뱃지 표기 유지.
  - 절대로 AI나 게스트가 [✨ 실 유저]로 표시되지 않도록 2중 방어선 구축.
- **FR-05: isKnownAiCompanion 게스트 식별 방어선 보강**:
  - js/team-invite-comm.js 내 isKnownAiCompanion에 guest 및 mn_ prefix 추가하여 프로필/동반자 모달에서 게스트나 마니또 가상 엔티티가 실 사용자 배지를 달지 못하도록 방어.

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Review & Refinement)
- 검토: 게스트가 마니또 풀에 들어가지 못하면 게스트 모드에서 마니또 기능 자체가 먹통이 되는가?
  - 답변: 아니다. 로컬 manitoPartners()는 실 유저 풀이 없거나 부족할 때 자동으로 is_ai: true인 AI 동반자 3명을 생성하므로, 게스트는 로컬에서 AI 동반자와 완벽하게 마니또 스탬프와 응원을 주고받을 수 있다.
- 검토: 기존 Supabase DB에 남아있는 mn_pool_guest-mu3tbym6qdd5는 어떻게 되는가?
  - 답변: isValidRealUser 함수가 guest-로 시작하는 ID를 클라이언트 페칭 단계에서 100% 드롭하며, Supabase 상에서도 해당 레코드를 무효화(hidden: true) 처리하여 2중으로 차단한다.

---

## 5. [원칙 ⑤] 단계별 절차 정리 (Procedure)
1. 작업 브랜치 생성: fix/2026-09-17-manito-real-user-verification-es145
2. index.html 내 isValidRealUser 헬퍼 함수 작성 및 loadServerManitoData() 필터링 배선.
3. index.html 내 mnJoin 이벤트 게스트 차단 및 소프트 로그인 안내 배선.
4. index.html 내 마니또 실 유저/AI 뱃지 렌더링 무결성 강화 및 하드코딩 가짜 수치 정비.
5. js/team-invite-comm.js 내 isKnownAiCompanion 게스트/마니또 접두어 보강.
6. Supabase team_pings 내 불량 게스트 레코드 무효화.
7. scripts/smoke-test.js에 #TASK-ES-145 컴플라이언스 테스트 추가.
8. npm test 및 무결성 게이트 전수 통과 확인.
9. CDP 브라우저 수동 확인 (3단계 로컬 화면 캡처).
10. 로컬 메인 병합 (4단계) 및 Vercel 프리뷰 배포 (5A단계) 자동 실행.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification Plan)
- npm test: 기존 283개 + 신규 1개 = 284개 이상 ALL PASS 확인.
- scripts/verify-integrity-gate.js: 무결성 5대 게이트 ALL PASS 확인.
- scratch 시뮬레이션을 통해 loadServerManitoData() 실행 시 guest-mu3tbym6qdd5가 절대 실 유저로 매핑되지 않음을 단위 테스트로 증명.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Definition of Done)
- [ ] 게스트 계정은 마니또 manito_pool에 등록되지 않음.
- [ ] 마니또 화면에서 게스트나 가상 봇이 [✨ 실 유저]로 표출되는 현상 0건.
- [ ] 인증된 실 가입자만 [✨ 실 유저]로 표출되고, 그 외는 [🤖 AI 동반자]로 투명하게 표시됨.
- [ ] 모든 테스트 통과 및 로컬 메인 병합 (4단계) 완료.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 대책 (Blocker Countermeasures)
- 예상 1: 기존에 저장된 guest-mu3tbym6qdd5 레코드가 캐시 또는 DB에서 계속 조회될 가능성.
  - 대책: 클라이언트 isValidRealUser에서 ID 레벨 필터링을 최우선 적용하고, DB에서도 hidden: true로 마킹하여 캐시/네트워크 모두에서 완벽 차단.
- 예상 2: #TASK-ES-133 기존 스모크 테스트의 단언문 충돌 여부.
  - 대책: 기존 테스트는 그대로 보존되며 실 사용자 검증 로직이 추가되는 형식이므로 회귀 없이 100% 통과 보장.
