# REQ/PLAN — TASK-ES-403 시험지가 「팀 목표 합본」을 읽는다 (팀 세포 쪼개기 3차 선행, 시험지)

> 근거: 코디네이터 지시(2026-10-05) — 팀 세포 쪼개기 3차(TASK-ES-402: `js/team-visibility-levels.js` 837 · `js/team-leader-check.js` 975 · `js/team-linked-goals.js` 982줄을 각각 800줄 이하로)에서 "시험지가 원본 한 파일만 읽어 깨지면 기대값을 바꾸지 말고 범위만 넓히는 시험지 선행 PR 을 먼저". 선례 #703(TASK-ES-388 팀 합본)·#707(TASK-ES-393 통계 합본)·#700(TASK-ES-385 아바타 합본).
> 제품 코드 변경 0. 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0. 지운 단언 0.

## REQ
- 대상 파일: `scripts/smoke-test.js`, `tests/core-confirm-es374.test.js`, `tests/core-modal-es363.test.js`, `tests/core-toast-es361.test.js`
- 대상 함수·상수(smoke-test.js 신규): `TEAM_GOALS_KIT_SLOTS`, `teamGoalsPartFiles(origFile)`, `readTeamGoalsBundle(origFile)` (부품 접두 제거는 기존 `readTeamPartFile(f)` 재사용)
- 대상 함수·상수(tests 3개 신규): `TEAM_GOALS_KIT_SLOTS`, `readTeamGoalsBundle(rootDir, name)`
- 대상 DOM ID: 없음(시험지 변경)

## 1. [원칙 ①] 문제 정확히 파악
3차 쪼개기는 세 파일에서 묶음 하나씩(수준별 조 상세 모달 `openLevelGroupDetailModal` · 팀원 점검 모달 `openLeaderStampSelectModal`·`openMemberProgressDetailModal` · 팀 연계 워크스페이스 화면 `renderTeamLinkedGoalsScreen`)을 새 `js/team-*.js` 로 동작 그대로 옮긴다. 옮긴 뒤에도 기존 글자 단언이 같은 코드를 찾아야 한다. 단언 문장·기대값·검사 수는 바꾸지 않는다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- 본질: 시험은 '팀 목표 코드'를 봐야 하는데 '그 코드가 들어 있는 파일 한 개'를 보고 있다.
- 원인(측정): `scripts/smoke-test.js` 가 세 파일을 글자로 직접 읽는 곳 13곳(`team-leader-check.js` 5 · `team-linked-goals.js` 6 · `team-visibility-levels.js` 3 — `fs.readFileSync(...)`). 모의 이전(8절)에서 기준 시험지는 440/443 — ES-109(`[✓ 편집 완료]`, `renderTeamLinkedGoalsScreen` 안)·ES-169(`target_type: 'leader_action'`, 확인 도장 모달 안)·ES-174(`id="tlSampleShowcaseCard"`, 워크스페이스 화면 안)가 깨진다.
- 중심: 법정은 기준 커밋 시험지로 채점한다 — 이 PR 이 먼저 병합되지 않으면 ES-402 는 옮긴 글자만큼 실패한다.
- 핵심: 읽는 범위를 '원본 + 그 원본의 키트 부품' 합본으로 넓히고, 합본 맨 앞이 원본 원문 그대로임을 시험 안에서 단언한다.

## 3. [원칙 ③] 해결방식 — 구체적 식별자
- 팀 목표 합본(원본마다 따로) = 원본 원문(맨 앞, 손대지 않음) + 그 원본 칸의 키트 부품(이름순). 부품 = `js/` 바로 아래 `team-*.js` 중 원본 셋이 아니고, `OurgoalTeamGoalsKit` 표식과 원본 칸 대입 글자(`KIT.visibilityLevels = ` · `KIT.leaderCheck = ` · `KIT.linkedGoals = `)가 둘 다 있는 파일. 부품만 생성기 접두 `T.`·`K.` 를 기존 `readTeamPartFile` 정규식으로 떼고 읽는다(팀 합본 #703 과 같은 방식).
- 원본별 칸으로 나누는 이유: 한 원본의 부재 단언(`잔디` 등)이 다른 원본의 부품까지 보면 오늘 보지 않던 코드를 보게 되어 기대가 달라진다.
- smoke-test.js 13곳 → `readTeamGoalsBundle(<같은 경로>)`. `fs.existsSync`·`require(...)`·index.html 태그 단언은 그대로(원본 파일은 남고, 원본 머리 이음매가 node 에서 부품을 require 한다).
- 합본 단언(check 밖 — 검사 수 443 불변): 세 원본 각각 `src.slice(0, 원문 길이) === 원문`, 부품 0개면 `src === 원문`. 파일 머리에서 세 원본을 한 번씩 읽어 단언한다.
- tests 3개: 파일별 **부재** 단언만 합본을 본다 — `core-confirm-es374`(「confirm( 직접 호출 없음」, `team-linked-goals.js`·`team-visibility-levels.js` 칸), `core-toast-es361`(「자체 토스트 함수 없음」), `core-modal-es363`(「function openModal 없음」). 같은 시험의 **존재** 단언(공용 통로 줄 — 원본 머리에 남는다)은 원본 한 파일 그대로.

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 쪼개기 PR 안에서 단언 경로를 고침: 기준 시험지로 채점되는 법정에서 판정 불가(모의 이전 440/443).
- B 사라지는 글자를 원본에 주석으로 남김: 가짜 흔적 — 금지.
- C 다른 묶음을 고름: 세 파일 모두 800줄 아래로 내리려면 화면·모달 묶음을 옮겨야 하고, 그 안에 단언 글자가 있다(팀 연계 파일은 남은 큰 묶음 둘 다 단언 글자를 가짐).
- D 읽는 범위만 합본으로(선례 #703·#707·#700): 단언 0 변경 → D 선택.
- `scripts/verify-integrity-gate.js`(금고): `team-linked-goals.js` 의 `잔디` 부재 등 원본 한 파일만 본다 — 손대지 않는다. 부품의 같은 글자는 ES-402 검사기가 따로 잰다.
- `scripts/test-team-linked-goals.js`(npm test 밖): 원본을 `new Function` 으로 실행하고 옮기지 않는 함수만 부른다 — 그대로.

## 5. [원칙 ⑤] 절차
1) 기준 `git archive origin/main` 스크래치 사본에서 npm test·tests 100개 + scripts/test-team-linked-goals.js 측정 → 2) smoke-test.js 수정 → 3) tests 3개 수정 → 4) 작업 트리에서 같은 측정 → 5) 비교(검사 제목 목록·통과 수·종료 코드·정규화 출력) → 6) 모의 이전 트리를 기준·새 시험지로 채점 → 7) claims·기록 → 8) PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 "시험을 느슨하게 한다" → 존재 단언은 같은 글자를 더 넓은 범위에서 찾되 원문이 맨 앞이라 첫 위치가 그대로이고(`slice` 단언), 부재 단언(`잔디`·직접 `confirm(`·자체 토스트·`function openModal`)은 부품까지 보게 되어 더 엄격해진다. 바뀐 줄은 읽는 곳뿐이고 지운 단언 0.
- 반론 2 "표식(`OurgoalTeamGoalsKit`·`KIT.<칸> = `)이 없는 파일로 옮기면 시험을 피할 수 있다" → 옮긴 코드가 원본 스코프 이름을 읽으려면 키트 통로(`K.scope`)를 써야 하고 원본이 옮긴 함수를 가져오는 곳도 키트다. 표식 없는 파일로 옮기면 원본 글자는 사라지는데 합본에 안 들어가 존재 단언이 실패한다 — 피하는 길이 아니라 깨지는 길이다.

## 7. [원칙 ⑦] 단계별 실행 — 결과
`scripts/smoke-test.js`·tests 3개만 변경. 제품 코드 0, 금고 파일 0, 단언 문장·기대값 0 변경.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — `reports/TASK-ES-403/test-compare.json`·`mock-move.json`:
- 기준(origin/main `git archive`) 대 작업 npm test: smoke 443 통과·0 실패(검사 제목·결과 목록 동일) · 무결성 38/38 · 버튼 943/943 · 모듈 가드 ① 34007 · ② 663 · ③ 282 · ④ 8 · ⑤ 0 — 같음.
- tests 100개 + `scripts/test-team-linked-goals.js`: 종료 코드 101/101 같음(27개는 기준에서도 실패 — 기존, 고치지 않음). 경로·시간을 지운 출력은 2개(`avatar-personas-split`·`goal-templates-data-split`)만 다름 — 기준 사본에 `.git` 이 없어 git 대조 줄이 바뀌는 기존 차이(같은 `git archive` 트리끼리인 모의 이전에서는 0).
- 모의 이전(스크래치, 저장소에 넣지 않음, ES-402 산출물을 얹은 트리): 기준 시험지 440/443(ES-109·ES-169·ES-174 실패), 새 시험지 443/443 · 38/38 · 943/943, tests 종료 코드 기준과 같음.
- 막히는 지점: ES-402 생성기가 다른 표식을 쓰면 합본에서 빠진다 → 생성기는 `OurgoalTeamGoalsKit` + `KIT.<칸> = KIT.<칸> || {}` 꼴로 부품 머리를 쓴다.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
