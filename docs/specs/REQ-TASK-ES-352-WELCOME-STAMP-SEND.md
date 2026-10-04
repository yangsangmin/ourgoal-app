# 요구사항 정의서 (REQ) — TASK-ES-352 첫 체크인 축하 창 '웰컴 응원 스탬프' 실제 발송 (COMM-05)

> **문서 ID**: REQ-TASK-ES-352-WELCOME-STAMP-SEND
> **근거**: 상민님 결정(2026-10-04) — "첫 체크인 축하 창의 '웰컴 응원 스탬프' 버튼을 권장안대로 — 실제 발송을 붙인다(안 되는 경우에만 거짓 문구 없이 소통 탭 이동)". 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 COMM-05, PR #659(TASK-ES-348) 보고의 결심 후보.
> **작업 일시**: 2026-10-04
> **브랜치**: `feat/2026-10-04-task-es-352-welcome-stamp`

## 지시 항목 (원문 그대로 옮김)

- R1: 버튼 누름 → 화면에 보인 실제 동류 회원 각각에게 기존 응원 형식으로 team_pings 행을 insert(sender_id = 내 id, receiver_id = 상대). 성공한 수만큼 "N명에게 웰컴 응원을 보냈어요", 실패는 사유 안내.
- R2: 받은 사람의 기존 응원/알림 화면에 도착하도록(없으면 가장 가까운 기존 수신 화면에 연결; 새 화면 만들기는 최소화).
- R3: 중복 방지: 같은 사람에게 하루 1회(기존 쿨다운 규칙 있으면 그것).
- R4: 세션 없는 사용자(게스트 등)·동류 0명: 보내지 않고, 거짓 '보냈어요' 없이 "소통 탭에서 함께하는 분을 찾아보세요" + 소통 탭 이동.
- R5: EXP: 실제로 1명 이상 보냈을 때만 +5(기존 notifyXpGained 경로), 0명이면 지급 안 함.
- R6: 측정: 헤드리스 또는 단위 시험으로 ① 동류 2명 표시 → 누르면 insert 2행(sender·receiver·형식 확인), 토스트 '2명' ② 같은 날 다시 누르면 0행 ③ 게스트/0명 → insert 0, 거짓 문구 0, 소통 탭 이동 ④ EXP 는 ①만 +5. `npm test` 0.
- R7: 실계정 2개로 받는 쪽 도달 확인(레벨 5)은 못 했다고 정직하게.

## 1. [원칙 ① 목표 정의]

첫 체크인 축하 창의 `#firstCheckinCommBtn` 이 누른 사람의 말대로 실제 일을 하게 한다. 보낼 수 있으면 화면에 보인 실제 동류 회원에게 응원 1행씩을 보내고 보낸 수를 말한다. 보낼 수 없으면 '보냈어요' 없이 소통 탭으로 안내한다.

## 2. [원칙 ② 현상 분석 — 본질·원인·중심·핵심]

- 본질: 버튼 글자와 토스트가 "보냈다"고 말하는데 아무것도 보내지 않는다(껍데기 버튼 + 거짓 피드백). EXP 까지 준다.
- 원인: `triggerFirstCheckinCelebrationModal`(index.html) 의 `commBtn` 클릭 처리기가 `toast('💌 동류 러너들에게 웰컴 응원 스탬프를 보냈어요! (+5 EXP)')` 와 +5 EXP 만 하고 서버 호출이 없다. PR #659 이전에는 동류 러너가 하드코딩 가짜 9명이라 보낼 대상 자체가 없었다.
- 중심: PR #659 로 `getPeerRunnersForCategory` 가 feed_posts 실원장의 같은 분야 실제 회원(인증 UUID, 비 AI)만 돌려주게 되어 이제 "보낼 대상"이 실재한다. 버튼 처리기 하나만 바꾸면 된다.
- 핵심: 새 표·새 화면을 만들지 않고, 이미 있는 응원 행 형식(마니또 응원: team_pings · group_id 'manito' · target_type 'manito_cheer' · ping_type 'welcome_cheer')과 그 형식을 읽는 기존 수신 화면(소통 탭 → 마니또 '받은 응원함', `loadServerManitoData` 의 `receiver_id` 조회)에 그대로 싣는다.

## 3. [원칙 ③ 원인 추정]

1. 클릭 처리기에 발송 코드가 없다(위 2절).
2. 받는 쪽 화면: 응원류 team_pings 를 받는 사람 기준(`receiver_id = 나`)으로 읽는 화면은 마니또 '받은 응원함' 하나뿐이다(DM 은 team_ping_replies, 갓생 카드·템플릿 추천 `dm_*` 행은 읽는 화면이 없음). RLS(PR #656 2단계 SQL `es347_auth_select`)도 "나에게 온 마니또 응원"을 receiver_id 로 허용한다.
3. 그 화면은 마니또를 시작한 회원에게만 받은 응원함을 그린다 — 시작하지 않은 회원은 도착한 응원을 볼 곳이 없다.
4. 조사 중 발견: `manitoMajors` 가 목표 topic 을 TOPICS 로 거르지 않아, TOPICS 에 없는 topic(예: 'reading')인 목표가 있으면 마니또 시작 전 화면이 `TOPICS[k].icon` 오류로 빈 화면이 된다 — 받은 응원함까지 못 그린다.

## 4. [원칙 ④ 대안 탐색]

- A: DM(team_pings dm_direct 부모 + team_ping_replies)으로 보낸다 — 받는 쪽 DM 목록에 보이지만, 지시가 요구한 응원 형식이 아니고 낯선 사람에게 1:1 대화방을 여는 것이라 결이 다르다.
- B: 마니또 응원 형식(group_id 'manito', target_type 'manito_cheer', ping_type 'welcome_cheer')으로 보내고, 마니또 시작 전 화면에도 실제로 도착한 응원이 있으면 '받은 응원함' 카드를 그린다 — 기존 형식·기존 수신 화면·기존 RLS 를 그대로 쓴다. **B 선택.**
- 하루 1회: 기존 마니또 쿨다운은 메모리 60초라 하루 1회가 아니다. 행 id 를 `fcw_<날짜>_<보낸 사람>_<받는 사람>` 으로 정해 서버가 같은 날 두 번째 행을 중복 키(23505)로 거절하게 하고, 기기에도 `settings.welcomeStampSent` 에 오늘 보낸 명단을 남겨 아예 다시 보내지 않는다.

## 5. [원칙 ⑤ 실행 계획]

- 대상 DOM: `#firstCheckinCommBtn`(버튼 글자: 보낼 수 있으면 '💌 동류 러너 N명에게 웰컴 응원 보내기 (+5 EXP)', 오늘 이미 다 보냈으면 '✅ 오늘 웰컴 응원 보냄 · 소통 탭 가기', 못 보내면 '🤝 소통 탭에서 함께할 분 찾아보기'), `#firstCheckinPeerRunners`(변경 없음), 새 `#manitoPreJoinInbox`(마니또 시작 전 받은 응원함 카드).
- 대상 함수(index.html): 새 `canSendFirstCheckinWelcome`·`firstCheckinWelcomeSentToday`·`sendFirstCheckinWelcomeStamps`, 수정 `triggerFirstCheckinCelebrationModal`(클릭 처리기), `renderCommManito`(시작 전 화면), `manitoMajors`(TOPICS 거름).
- 시험: `tests/trio-es143-es145.test.js` 의 거짓 토스트 문자열 검사를 사실 문구 검사로 교체. 측정 도구 `docs/design/harness/welcome-stamp-check.js`. 법정 시나리오 `reports/TASK-ES-352/scenarios/guest-welcome-no-false-send.json`.

## 6. [원칙 ⑥ 절차 재검증 및 반론 격파]

- 반론 1: "마니또는 익명인데 실명 닉네임 응원을 마니또 받은 응원함에 넣으면 섞인다." — 받은 응원함은 행의 sender_name 을 그대로 보여 주는 화면이고, 이 응원은 보낸 사람이 피드에 공개한 닉네임으로 보내며 문구가 "첫 체크인을 마치고 같은 분야 동료에게 보낸 웰컴 응원"임을 밝힌다. 익명 마니또 행과 ping_type·id 접두(fcw_)로 구분된다. 새 화면을 만들지 말라는 지시에 가장 가까운 기존 수신 화면이다.
- 반론 2: "행 id 로 중복을 막으면 서버가 실제로 거절하는지 모른다." — team_pings.id 는 기존 코드가 모두 문자열 기본 키로 쓴다(DM 부모 행 upsert 가 같은 id 로 갱신되는 것이 그 증거). 거절되지 않더라도 기기 기록이 먼저 막는다. 23505 는 '이미 보냄'으로 세고 EXP 를 주지 않는다.
- 재검증: 세션 판정은 마니또 풀 등록과 같은 규칙(`state.user` 와 `isValidRealUser(state.profile.id)`) — RLS insert 조건 `sender_id = auth.uid()` 를 못 맞추는 게스트는 아예 보내지 않는다. 새 display:none !important·금지 낱말·.js 800줄 초과 없음(.js 는 측정 도구 1개 신규).

## 7. [원칙 ⑦ 즉시 실행]

위 5절을 구현하고 측정 도구로 origin/main 과 작업 트리를 함께 잰다.

## 8. [원칙 ⑧ 성과 측정]

헤드리스(목이 insert 를 기록) ① 동류 2명 → insert 2행·토스트 '2명'·EXP +5 ② 같은 날 다시 → 0행·EXP 0, 기기 기록을 지워도 서버 중복 거절로 0행 ③ 게스트·로그인 0명 → insert 0·'보냈어요' 0·소통 탭 ④ 받는 쪽(마니또 미시작) 받은 응원함에 도착. `npm test` 종료코드. 실계정 2개(레벨 5)는 확인하지 못함.
