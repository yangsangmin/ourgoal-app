# REQ/PLAN — TASK-ES-388 시험지가 「팀 합본」을 읽는다 (팀 세포 쪼개기 2차 선행, 시험지)

> 근거: #701(TASK-ES-382) REQ 4·10절 — 원본 `js/team-invite-comm.js` 에 남은 묶음은 기준 시험지가 원본 한 파일을 직접 읽는 단언 때문에 "시험지 합본 선행 PR"이 먼저다. 코디네이터 지시(2026-10-05): 2차 쪼개기(TASK-ES-387) 전에 시험지 선행 PR 을 따로 올린다. 선례 #700(TASK-ES-385 아바타 합본)·#669·#670·#681.
> 제품 코드 변경 0. 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0.

## REQ
- 대상 파일: `scripts/smoke-test.js`, `tests/comm-ai-identity-es348.test.js`, `tests/core-confirm-es374.test.js`, `tests/core-toast-es361.test.js`, `tests/dm-delivery-read-receipt.test.js`, `tests/feed-share-dm-thread-es382.test.js`, `tests/goal-template-legacy-cleanup.test.js`, `tests/manito-ai-limit.test.js`, `tests/remove-ai-companions.test.js`, `tests/unique-display-name.test.js`
- 대상 함수·상수(smoke-test.js 신규): `TEAM_INVITE_COMM_JS`, `isTeamCommPartFile(f)`, `readTeamPartFile(f)`, `TEAM_COMM_PART_FILES`, `TEAM_INVITE_COMM_RAW`, `TEAM_COMM_SRC`
- 대상 함수(tests 9개 신규): `listTeamCommParts(rootDir)`, `readTeamCommBundle(rootDir)`
- 대상 DOM ID: 없음(시험지 변경)

## 1. [원칙 ①] 목표 정의
`js/team-invite-comm.js`(3,276줄)의 남은 묶음(팀 채팅·추천 템플릿·DM·동반자·프로필·검색·자동 생성 핸들러)을 `js/team-*.js` 키트 부품으로 옮겨도(동작 그대로) 기존 글자 단언이 같은 코드를 찾게 한다. 단언 문장·기대값·검사 수는 바꾸지 않는다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 시험은 '팀 소통 코드'를 봐야 하는데 '팀 소통 코드가 들어 있는 파일 한 개'를 보고 있다.
- 원인(측정): `scripts/smoke-test.js` 가 `js/team-invite-comm.js` 를 직접 읽는 곳 23곳(`fs.readFileSync(path.join(__dirname, '..', 'js', 'team-invite-comm.js'), 'utf8')` 20곳 + `fs.readFileSync(modulePath, 'utf8')` 3곳 — ES-104·105·106). tests/ 에서 원본 글자를 읽는 시험 8개, vm 으로 키트 부품을 손으로 나열해 실행하는 시험 1개(feed-share-dm-thread-es382).
- 중심: 법정은 기준 커밋 시험지로 채점한다(`court/vault.json` baseTestRunners = smoke-test·verify-integrity-gate) — 이 PR 이 먼저 병합되지 않으면 ES-387 은 옮긴 글자만큼 실패한다(모의 이전 실측 442/443, 8절).
- 핵심: 읽는 범위를 합본으로 넓히고, 합본 맨 앞이 원본 원문 그대로임을 시험 안에서 단언한다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
- 팀 합본 = `js/team-invite-comm.js` 원문(맨 앞, 손대지 않음) + 키트 부품(이름순). 키트 부품 = `js/` 바로 아래 `team-*.js` 중 `team-invite-comm.js` 가 아니고 `OurgoalTeamCommKit` 글자가 있는 파일(지금 `team-recruit.js`·`team-share.js`). 부품만 생성기 접두 `T.`·`K.` 를 정규식 `/(^|[^A-Za-z0-9_$.])[TK]\.(?=[A-Za-z_$])/g` 로 떼고 읽는다(L.·K.·AV.·MS. 와 같은 방식).
- [기본값] `js/team-*.js` 전부가 아니라 키트 표식이 있는 파일만: `team-linked-goals.js`·`team-visibility-levels.js`·`team-leader-check.js` 는 팀 소통 세포가 아니라 다른 세포다. 넣으면 `잔디` 같은 부재 단언이 오늘 보지 않던 파일을 보게 되어 기대가 달라진다.
- smoke-test.js: 23곳 → `TEAM_COMM_SRC`. `fs.existsSync(modulePath)`·index.html 태그 단언은 그대로(원본 파일은 남는다).
- 합본 단언(check 밖 — 검사 수 443 불변): `TEAM_COMM_SRC.slice(0, 원문 길이) === 원문`(원본에서 찾던 글자는 같은 indexOf 첫 자리), 부품 0개면 `TEAM_COMM_SRC === 원문`.
- tests: 원본 글자를 읽던 줄만 `readTeamCommBundle(rootDir)` 로(comm-ai-identity-es348·dm-delivery-read-receipt·goal-template-legacy-cleanup·manito-ai-limit·remove-ai-companions·unique-display-name). `require('../js/team-invite-comm.js')` 실행 경로는 그대로(원본 머리 이음매가 부품을 require 한다 — #701).
- `tests/feed-share-dm-thread-es382.test.js`: vm 실행 목록 `['js/team-recruit.js', 'js/team-share.js', 'js/team-invite-comm.js']` → `listTeamCommParts(ROOT)` + 원본(지금 같은 3개·같은 순서).
- `tests/core-confirm-es374.test.js`·`tests/core-toast-es361.test.js`: 파일별 "직접 confirm(·자체 토스트 함수 없음" **부재** 단언만 팀 합본을 본다(옮긴 코드도 계속 감시). "공용 통로 사용" **존재** 단언은 원본 한 파일 그대로(통로 줄은 원본에 남는다).

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 쪼개기 PR 마다 단언 경로를 고침: 기준 시험지로 채점되는 법정에서 판정 불가(모의 이전에서 ES-169 가 깨짐).
- B 유일 글자를 원본에 주석으로 남김: 가짜 흔적 — 금지(가짜 구현).
- C 읽는 범위만 합본으로(선례 #700·#669·#670·#681): 단언 0 변경 → C 선택.
- `scripts/verify-integrity-gate.js`(금고)·`scripts/verify-all-clicks.js`: `team-invite-comm` 글자를 읽지 않는다(grep 0). verify-all-clicks 는 `js/` 바로 아래 파일을 모두 읽어 부품 위치(`js/team-*.js`)가 이미 범위 안 → 그대로.
- court/**: 시험지를 읽는 쪽이 아니라 돌리는 쪽 — 손대지 않음.

## 5. [원칙 ⑤] 절차
1) 기준 `git archive origin/main`(2e3558a) 스크래치 사본에서 npm test·tests 13개 측정 → 2) smoke-test.js 수정 → 3) tests 9개 수정 → 4) 작업 트리에서 같은 측정 → 5) 정규화(경로·시간·스택 줄 번호) 후 출력 비교 → 6) 모의 이전 트리를 기준·새 시험지로 채점 → 7) claims·기록 → 8) PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "시험을 느슨하게 한다" → 존재 단언은 같은 글자를 더 넓은 범위에서 찾되 원문이 맨 앞이라 첫 위치가 그대로이고, 부재 단언(`잔디`·`.or('display_name.ilike`·`.eq('id', uid).catch(`·가짜 봇 배열·직접 `confirm(`·자체 토스트 함수)은 부품까지 보게 되어 더 엄격해진다. 지운 단언 줄 0(diff: 바뀐 줄은 읽는 줄·실행 목록·부재 단언 대상 변수뿐).
- 반론② "키트 표식(`OurgoalTeamCommKit`)으로 부품을 고르면, 표식 없는 새 파일로 옮겨 시험을 피할 수 있다" → 옮긴 코드가 원본 스코프 이름을 읽으려면 키트 통로(`K.scope`)를 써야 하고, 원본이 옮긴 함수를 가져오는 곳도 키트다. 표식 없는 파일로 옮기면 원본 글자는 사라지는데 합본에 안 들어가 기존 단언이 **실패**한다 — 피하는 길이 아니라 깨지는 길이다.

## 7. [원칙 ⑦] 즉시 실행 — 결과
scripts/smoke-test.js·tests 9개만 변경. 제품 코드 0, 금고 파일 0, 단언 문장·기대값 0 변경.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — `reports/TASK-ES-388/test-compare.json`·`mock-move.json`:
- 기준(2e3558a git archive) npm test: smoke 443 통과·0 실패 / 무결성 38/38 / 버튼 943/943 / 셀 구조 42개 파일 / 모듈 가드 ① 34058 · ② 669 · ③ 282 · ④ 10 · ⑤ 0.
- 작업 트리 npm test: 같은 수치, smoke 검사 제목 목록 동일. 로그 차이는 기준 사본에 .git 이 없어 생기는 줄뿐.
- tests 13개(원본을 읽거나 require 하는 시험): 종료 코드·출력이 정규화 뒤 기준과 같다. 그중 5개(comm-feed-cleanup·comm-post-feed-button-fix·dm-delivery-read-receipt·dm-keyboard-autofocus-fix·goal-template-legacy-cleanup)는 **기준에서도** 팀 파일과 무관한 단언(renderCalendar·renderGoalsScreen)에서 실패 — 고치지 않음(기대값 변경 금지).
- 모의 이전(스크래치, 저장소에 넣지 않음): 원본 58~287줄(팀 채팅 묶음 230줄)을 키트 부품으로 옮긴 가짜 트리 — 기준 시험지 442/443(ES-169 `team_chat_room_` 등 실패), 새 시험지 443/443.
- 막히는 지점: ES-387 에서 옮긴 함수가 `_teamKit`·`OurgoalTeamCommKit` 이 아닌 다른 통로를 쓰면 합본에서 빠진다 → 생성기는 #701 과 같은 키트 꼴을 쓴다.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
