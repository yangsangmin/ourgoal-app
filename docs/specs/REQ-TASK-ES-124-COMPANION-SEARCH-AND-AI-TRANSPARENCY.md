# [요구사항 정의서] #TASK-ES-124 아워골 동반자 검색 2중 복원 및 가상 유저 AI 투명 뱃지 표기

## 1. 문서 메타데이터
- **문서 ID**: REQ-TASK-ES-124-COMPANION-SEARCH-AND-AI-TRANSPARENCY
- **작성일자**: 2026-09-16
- **작성자**: Antigravity (Gemini 3.8 Flash)
- **승인자**: 상민님 직접 지시
- **적용 규정**: 아워골 최고 헌법 12대 조문 (특히 제19조 실 사용자 계정 상호 연동 헌법 제3항 1호)
- **본질 축**: E3(동류 소통) / FIX(버그 수정 및 투명성)

---

## 2. 문제해결 8원칙 적용 요구사항 분석

### ① 문제 정확히 파악 (Problem Identification)
1. **동반자 검색 먹통**:
   - 모바일 웹뷰, 카카오 인앱, PWA 등에서 닉네임 검색 시 42501(Permission Denied) 오류가 발생하여 "로그인 세션이 만료됐어요" 또는 "검색 중 문제가 발생했어요"가 뜨며 검색이 불가함.
   - 게스트 상태에서 검색 시도시 결과를 아예 보여주지 않고 소프트 게이트로 차단됨.
   - 검색자가 본인 닉네임을 검색하거나 1인 테스트 시 `u.id <> auth.uid()` 조건으로 인해 0건이 반환됨.
2. **동반자 목록 가상 유저 3인 AI 미표기**:
   - 현재 동반자 목록에 초기 콜드스타트 가상 유저 3인(`새벽러너_민지`, `코드장인_도현`, `갓생사는_수아` 등)이 등록되어 있으나, `isAiBot` 플래그 누락으로 인해 `실 사용자` 뱃지가 붙어 있음.
   - 실제 유저들이 볼 때 AI인지 안 적혀 있어 기만성 또는 신뢰성 문제(헌법 제19조)를 야기함.

### ② 본질·원인·중심·핵심 (Root Cause & Essence)
- **원인 1**: Supabase RPC `search_users_by_nickname`의 anon revoke 및 `auth.uid() is not null` 제약으로 인해 세션 미주입 클라이언트에서 검색이 전면 차단됨.
- **원인 2**: RLS/세션 장애 발생 시 우회 가능한 서버리스 API 파이프라인 부재.
- **원인 3**: 클라이언트 코드(`renderCommCompanions`)의 단순 뱃지 분기로 인해 가상 유저 식별자(`comp_` 등)가 있더라도 `실 사용자`로 오표기됨.
- **원인 4**: 프로필 모달 및 1:1 대화 진입로에서도 AI 동반자 안내가 부재함.

### ③ 해결방식 결정 (Adopted Solution)
- **해결 1 (Vercel 서버리스 1순위 검색 파이프라인)**:
  - `api/track.js`에 `handleSearchUsers(sb, body, res)` 엔드포인트를 탑재 (`action: 'search_users'`).
  - Vercel의 `SUPABASE_SERVICE_ROLE_KEY`를 활용하여 RLS 및 클라이언트 세션 만료 문제 없이 100% 안전하게 실제 회원 닉네임 검색.
  - 검색 결과에는 닉네임, 아바타, 한줄소개, 테마, 레벨, 스트릭 등 공개 필드만 반환하여 보안성 확보.
- **해결 2 (클라이언트 2중 검색 파이프라인 & 게스트 친화 UX)**:
  - `js/team-invite-comm.js`의 `doSearch()`가 `/api/track`을 우선 호출하고, 실패 시 `global.sb.rpc`를 폴백 호출.
  - 게스트 유저도 검색 결과를 볼 수 있게 허용하며, "+ 동반자 추가" 또는 "1:1 DM" 클릭 시에만 소프트 로그인 가이드를 제공.
- **해결 3 (가상 유저 자가 치유 및 [🤖 AI 동반자] 투명 뱃지 표기)**:
  - `isKnownAiCompanion(user)` 헬퍼를 도입하여 `isAiBot`, ID 접두사(`comp_`, `mem_`, `mock_`, `bot_`), 또는 알려진 가상 닉네임을 감지.
  - 감지 시 `isAiBot: true`로 즉시 자가 치유(Self-Healing)하고, DB `users.companions` 및 로컬스토리지에 재영속화(`persistCompanions`).
  - 동반자 카드 및 프로필 모달에 눈에 띄는 `[🤖 AI 동반자]` 뱃지 및 안내 문구 표기.

### ④ 1~3 재검토·보완 (Review & Edge Cases)
- Vercel Hobby 12개 함수 한도 제약: 신규 파일 생성 대신 기존 `api/track.js` 내에 라우팅 통합 (TECH-RULE-01 준수).
- 실 사용자와 AI 동반자의 명확한 시각적 대비: 실 사용자는 기존 알약, AI 동반자는 보라색/브랜드 톤의 `[🤖 AI 동반자]`로 명시.
- 데이터 유실 0건 보장: 기존 동반자 데이터 구조를 변경하지 않고 `isAiBot: true` 필드만 보정.

### ⑤ 구현 절차 (Procedure)
1. `api/track.js`: `handleSearchUsers` 구현 및 라우팅 추가.
2. `js/team-invite-comm.js`: `isKnownAiCompanion`, 2중 검색, AI 뱃지 표기 개선, 자가 치유 배선.
3. `docs/sql/2026-09-16-search-users-rpc.sql`: RPC 권한 완화 갱신본 작성.
4. `scripts/smoke-test.js`: `#TASK-ES-124` 검증 테스트 추가.
5. `npm test` 261개+ 전수 통과 확인.
6. 로컬 메인 병합 (4단계) 및 Vercel 프리뷰 배포.

---

## 3. 기능 요구사항 명세 (Functional Requirements)
- **FR-01 (서버리스 회원 검색 API)**: `POST /api/track`에 `{ action: 'search_users', query: '...' }` 요청 시 일치하는 실제 회원을 최대 20건 반환해야 한다.
- **FR-02 (2중 검색 파이프라인)**: 클라이언트 검색 시 `/api/track` ➔ `sb.rpc('search_users_by_nickname')` 순으로 순차 시도해야 한다.
- **FR-03 (게스트 검색 조회 허용)**: 비로그인(게스트) 상태에서도 닉네임 검색 결과를 확인할 수 있어야 하며, 추가 시도시 소프트 게이트가 떠야 한다.
- **FR-04 (AI 가상 유저 자가 치유)**: 동반자 목록에 존재하는 가상 유저 3인은 로드 시 자동으로 `isAiBot: true`가 주입되고 저장되어야 한다.
- **FR-05 (투명한 AI 뱃지 노출)**: 동반자 카드 및 프로필 모달에서 AI 유저는 `[🤖 AI 동반자]` 뱃지가 명확히 노출되어야 하며, 절대 `[실 사용자]`로 표기되어서는 안 된다.
- **FR-06 (헌법 제19조 준수)**: 2인 이상 상호작용 기능의 실제 구현 원칙과 콜드스타트 봇 투명 표기 규정을 완벽히 준수해야 한다.
