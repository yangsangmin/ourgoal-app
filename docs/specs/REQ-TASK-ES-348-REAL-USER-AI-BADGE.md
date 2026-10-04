# 요구사항 정의서 (REQ) — TASK-ES-348 실제 사용자 AI 오분류 제거 + AI 표시 없는 가짜 사람 정직화 (COMM-01)

> **문서 ID**: REQ-TASK-ES-348-REAL-USER-AI-BADGE
> **근거**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 COMM-01, 원문 TASK-ES-124(가상유저 3인 AI 동반자 투명 뱃지)·TASK-ES-145(실 사용자 정밀 식별)·생각 메모장 37호(동반자 탭 AI 동반자 전면 제거)
> **작업 일시**: 2026-10-04
> **브랜치**: `feat/2026-10-04-task-es-348-real-user-ai-badge`

## 지시 항목 (원문 그대로 옮김)

- R1: AI 판별을 이름 목록이 아니라 실제 표식으로: 실제 AI/시드 계정·데이터에 이미 있는 구분 필드(예: is_ai, isBot, persona, seed 접두 id 등)를 찾아 그것으로 판별. 서버 칸 추가가 필요하면 SQL 파일만 추가(비파괴, 실행하지 않음)하고 보고. 이름 목록은 실명형 이름을 제거하고, 남긴다면 정확 일치 + 다른 표식과 AND 로만.
- R2: 하드코딩 동류 러너: 실제 같은 카테고리 사용자 데이터(이미 쓰는 FEED_POSTS_CACHE 등 실원장)가 있으면 그걸로, 없으면 0명일 때 위젯을 숨김(침묵) 또는 'AI 예시' 배지를 단 예시로. 숫자·연속일수 하드코딩 금지.
- R3: 화면의 모든 AI 요소에 'AI' 배지(기존 배지 스타일이 있으면 재사용).
- R4: 그 밖에 소통 쪽 가짜 수치(마니또 AI 달성률 시드, handle팀목표_Item39Action 의 active_real_users: 25 하드코딩, 피드 '응원 가이드 1건 포함' 거짓 라벨) — 확인해서 같은 PR 에서 정직화 가능한 것은 처리(값 없으면 숨김, AI 는 배지).
- R5: 기존 기능(위젯·버튼) 자체 제거는 하지 말 것.

## 1. [원칙 ① 목표 정의]

닉네임이 '민지'·'도현'·'수아' 같은 흔한 이름인 실제 회원이 AI 로 분류되어 동반자 목록·DM 후보·팀 풀에서 빠지는 일을 없애고, 화면에 나오는 가짜 사람·가짜 수치는 AI 배지를 달거나 값이 없으면 숨긴다.

## 2. [원칙 ② 현상 분석 — 본질·원인·중심·핵심]

- 본질: "누가 진짜 사람인가"를 이름으로 추측했다. 이름은 사람이 고르는 값이라 표식이 될 수 없다.
- 원인: js/team-invite-comm.js 의 KNOWN_AI_BOT_NAMES 에 실명형 이름 '민지'·'김민지'·'도현'·'박도현'·'수아'·'이수아'·'최현아'·'정준호'·'윤태양' 등이 들어 있고, isKnownAiCompanion 이 닉네임 정확 일치만으로 AI 를 판정했다. 렌더 때 자가 치유가 그 결과를 c.isAiBot = true 로 저장하고, 동반자 동기화 필터가 isAiBot 인 동반자를 목록에서 지웠다.
- 중심: isKnownAiCompanion 하나가 동반자 목록 배지·DM 후보(getTeamMembersPool)·동반자 동기화 필터·DM 상대 배지·맞팔 배너를 모두 결정한다.
- 핵심: 판별을 데이터에 이미 있는 표식(is_ai·botBadge·시드 id 접두·오프라인 예시 id)으로 바꾸고, 인증 UUID 계정에는 예전 이름 판별이 남긴 isAiBot 을 믿지 않는다.

## 3. [원칙 ③ 원인 추정]

1. 이름 목록 — 위 2절.
2. index.html getPeerRunnersForCategory 가 '열정부엉이 🔥8일' 등 9명을 하드코딩해 AI 표시 없이 '함께 달리는 동류 러너'로 노출(PR #645).
3. 마니또 AI 동반자 달성률 20+seed%60·연속일수 2+seed%12, 실 회원 값 없을 때 20%·1일 기본값.
4. 피드 단계 라벨 '응원 가이드 1건 포함'·'초기 실천 가이드 (1건)' — TASK-ES-332 이후 AI 글을 섞지 않는데 라벨만 남음.
5. handle팀목표_Item39Action 의 active_real_users: 25(js/team-invite-comm.js, js/components.js 두 곳).
6. 조사 중 추가 발견: 팀 영입 검색 오프라인 폴백 localKnownUsers 6명(user-runner-sm 등)이 AI 표시 없이 실제 회원처럼 노출, 프로필 창 14일 히트맵이 d%3 무늬, 연속일수 기본값 1.

## 4. [원칙 ④ 대안 탐색]

- A: 이름 목록을 지우고 id 표식만 쓴다 — 단순하지만 예전에 저장된 비인증 id 의 페르소나 객체를 놓칠 수 있다.
- B: 표식 우선 + 페르소나 핸들(밑줄 포함 10개)은 정확 일치 AND 인증 UUID 아님일 때만 — 지시 "정확 일치 + 다른 표식과 AND" 와 맞는다. **B 선택.**
- 서버 칸 추가(profiles.is_ai): 현재 실 회원 검색(/api/track search_users, RPC search_users_by_nickname)은 모두 isAiBot:false 로 들어오고, 서버에 AI 계정이 없다(AI 는 모두 클라이언트 시드). 서버 칸이 필요하지 않아 SQL 파일은 추가하지 않았다.

## 5. [원칙 ⑤ 실행 계획]

- 대상 함수: `isKnownAiCompanion`·`hasAiIdMarker`·`isAuthUuid`(js/team-invite-comm.js), `getTeamMembersPool`, `renderCommCompanions`(자가 치유 양방향), `renderCommDM`(isPersonReal·canFollowBack), 동반자 동기화 필터, 팀 영입 검색 결과 배지.
- 대상 함수: `getPeerRunnersForCategory`·`peerCategoryKey`·`triggerFirstCheckinCelebrationModal`(index.html) — DOM `#firstCheckinPeerRunners`(0명이면 그리지 않음).
- 대상 함수: `loadServerManitoData`·`manitoPartners`·`renderCommManito`(index.html) — 값 없으면 게이지·연속일수 숨김, 받은 응원함·웰컴 응원 문구의 AI 에 `.badge-ai` 배지.
- 대상 함수: `renderCommFeed` 단계 라벨, `handle팀목표_Item39Action`(두 파일) active_real_users: null.
- 파일: js/team-invite-comm.js(이미 800줄 초과 — 줄 수를 늘리지 않음), js/components.js, index.html.

## 6. [원칙 ⑥ 절차 재검증 및 반론 격파]

- 반론 1: "실명형 이름을 빼면 예전 AI 동반자가 실 사용자 배지로 보인다." — 예전 시드는 모두 id 표식이 있다(mem_ws_1 등 mem_ 접두, user-minji-runner 등 오프라인 예시 id). 이름 없이도 AI 로 잡힌다(단위 시험 '실제 표식이 있으면 AI 다').
- 반론 2: "인증 UUID 계정의 isAiBot 을 무시하면 진짜 AI 를 놓친다." — AI 계정은 Supabase 인증 UUID 를 갖지 않는다(마니또 mn_, 시뮬 sim_, 사진 ai_photo_). 서버가 is_ai:true 를 주면 그것은 그대로 AI 로 본다.
- 재검증: 법정 정적 검사 — js/team-invite-comm.js 4137→4135줄(늘지 않음), 새 display:none !important·금지 낱말 없음.

## 7. [원칙 ⑦ 즉시 실행]

위 5절을 구현하고, 측정 하네스 docs/design/harness/comm-ai-identity-check.js 와 단위 시험 tests/comm-ai-identity-es348.test.js 를 추가한다.

## 8. [원칙 ⑧ 성과 측정]

① 닉네임 '민지'(인증 UUID) 실사용자 판정 ② 동반자 목록·DM 후보 노출 ③ 동류 러너 고정 0·0명이면 숨김 ④ AI 요소 배지 — 헤드리스·단위 시험 결과와 npm test 종료코드를 PR 본문에 인용. 실계정 2개 확인(레벨 5)은 하지 못함.
