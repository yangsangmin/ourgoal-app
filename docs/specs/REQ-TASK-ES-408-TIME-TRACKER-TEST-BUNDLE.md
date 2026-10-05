# REQ/PLAN — TASK-ES-408 시험지가 「시간기록 합본」을 읽는다 (시간기록 세포 쪼개기 선행, 시험지)

> 근거: 코디네이터 지시(2026-10-05) — 시간기록 세포 쪼개기(TASK-ES-407: `js/time-tracker.js` 1,220줄을 800줄 이하로)에서 "시험지가 원본 한 파일만 읽어 깨지면 기대값을 바꾸지 말고 범위만 넓히는 선행 PR 을 먼저(제품 0, 지운 단언 0)". 선례 #715(TASK-ES-403 팀 목표 합본)·#703(TASK-ES-388 팀 합본)·#707(TASK-ES-393 통계 합본).
> 제품 코드 변경 0. 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0. 지운 단언 0.

## REQ
- 대상 파일: `scripts/smoke-test.js`, `tests/core-modal-es363.test.js`, `tests/core-confirm-es374.test.js`
- 대상 함수·상수(smoke-test.js 신규): `TIME_TRACKER_JS`, `isTimeTrackerPartFile(f)`, `TIME_TRACKER_PART_FILES`, `TIME_TRACKER_RAW`, `TIME_TRACKER_SRC` (부품 접두 제거는 기존 `readTeamPartFile(f)` 재사용 — 같은 `T.`·`K.` 접두)
- 대상 함수(tests 2개 신규): `readTimeTrackerBundle(rootDir)`
- 바꾸는 읽기 자리: smoke `[#TASK-ES-090]` 의 `trackerJs`, `[#TASK-ES-174]`·`[#TASK-ES-175]` 의 `trackerSrc` → `TIME_TRACKER_SRC`. core-modal 「function openModal 없음」·core-confirm 「confirm( 직접 호출 없음」 부재 단언의 `time-tracker` 칸 → 합본.
- 대상 DOM ID: 없음(시험지 변경)

## 1. [원칙 ①] 문제 정확히 파악
ES-407 은 `js/time-tracker.js` 에서 응집된 묶음 3개 — 몰입 화면 만들기·버튼 배선(`initDOM`·`bindEvents`), 구간 메모 패널(`openLapMemoModal`), 기록 작성·저장(`openReviewView`·`handleSaveRecord`) — 를 `js/time-tracker-*.js` 로 동작 그대로 옮긴다. 옮긴 뒤에도 기존 글자 단언이 같은 코드를 찾아야 한다. 단언 문장·기대값·검사 수는 바꾸지 않는다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- 본질: 시험은 '시간기록 코드'를 봐야 하는데 '그 코드가 들어 있는 파일 한 개'를 보고 있다.
- 원인(측정): `scripts/smoke-test.js` 가 `js/time-tracker.js` 를 글자로 직접 읽는 곳 3곳(ES-090 `trackerJs` · ES-174 `trackerSrc` · ES-175 `trackerSrc`). 모의 이전(8절)에서 기준 시험지는 440/443 — ES-090(`btnTtActionStart` 등 버튼 배선은 `bindEvents`/`initDOM`, `state.profile.records.unshift` 는 `handleSaveRecord` 안)·ES-174(`시간별로 세부 내용을 작성할 수 있어요`·`maxWidth = '340px'`, 구간 메모 패널 안)·ES-175(`tt-memo-active`·`btn-quick-lap-tag`·`tt-review-lap-card` 등, 구간 메모·기록 작성 안)가 깨진다.
- 중심: 법정은 기준 커밋 시험지로 채점한다 — 이 PR 이 먼저 병합되지 않으면 ES-407 은 옮긴 글자만큼 실패한다.
- 핵심: 읽는 범위를 '원본 + 그 원본의 키트 부품' 합본으로 넓히고, 합본 맨 앞이 원본 원문 그대로임을 시험 안에서 단언한다.

## 3. [원칙 ③] 해결방식 — 구체적 식별자
- 시간기록 합본 = `js/time-tracker.js` 원문(맨 앞, 손대지 않음) + 키트 부품(이름순). 부품 = `js/` 바로 아래 `time-tracker-*.js` 중 `OurgoalTimeTrackerKit` 표식이 있는 파일. 부품만 생성기 접두 `T.`·`K.` 를 기존 `readTeamPartFile` 정규식(`/(^|[^A-Za-z0-9_$.])[TK]\.(?=[A-Za-z_$])/g`)으로 떼고 읽는다(팀 합본 #703·#715 와 같은 방식).
- 합본 단언(check 밖 — 검사 수 443 불변): 파일 머리에서 `TIME_TRACKER_SRC.slice(0, 원문 길이) === 원문`, 부품 0개면 `TIME_TRACKER_SRC === 원문`.
- smoke 3곳 → `TIME_TRACKER_SRC`. ES-090 의 `fs.existsSync(trackerJsPath)`·index.html 태그 단언은 그대로(원본 파일·태그는 남는다).
- tests 2개: **부재** 단언만 합본을 본다 — `core-modal-es363`(「function openModal 없음」), `core-confirm-es374`(「confirm( 직접 호출 없음」). 같은 시험의 **존재** 단언(`open: openTrackerOverlay,` 노출 키 · `OurgoalCapabilities.request('ui.confirm.bind')` 공용 통로 줄 — 둘 다 원본에 남는다)은 원본 한 파일 그대로.

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 쪼개기 PR 안에서 단언 경로를 고침: 기준 시험지로 채점되는 법정에서 판정 불가(모의 이전 440/443).
- B 사라지는 글자를 원본에 주석으로 남김: 가짜 흔적 — 금지.
- C 다른 묶음을 고름: 1,220 → 800 이하로 420줄 이상을 옮겨야 하고, 큰 묶음(화면 만들기·배선 288줄, 기록 작성·저장 157줄, 구간 메모 89줄) 모두 단언 글자를 가진다.
- D 읽는 범위만 합본으로(선례 #715·#703·#707): 단언 0 변경 → D 선택.
- `scripts/verify-integrity-gate.js`(금고)는 `time-tracker` 를 읽지 않는다(검색 0건) — 손대지 않는다.
- `scripts/test-time-tracker-lifecycle.js`(npm test 밖): 기준에서도 이미 실패한다 — `eval` 로 원본을 돌릴 때 원본 머리의 `require('./core/confirm.js')` 가 `scripts/` 기준으로 풀려 MODULE_NOT_FOUND(#TASK-ES-374 이후 기존 결함, 고치지 않음 — 8절). 이 PR 에서 바꾸지 않는다.

## 5. [원칙 ⑤] 절차
1) 기준 `git worktree --detach origin/main`(0529229) 에서 npm test·tests 102개 + `scripts/test-time-tracker-lifecycle.js` 측정 → 2) smoke-test.js 수정 → 3) tests 2개 수정 → 4) 작업 트리에서 같은 측정 → 5) 비교(검사 제목·결과 목록·통과 수·종료 코드·정규화 출력) → 6) 모의 이전 트리(기준 `git archive` + ES-407 산출물: 원본·부품 3개·index.html·신고서)를 기준·새 시험지로 채점 → 7) claims·기록 → 8) PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 "시험을 느슨하게 한다" → 존재 단언은 같은 글자를 더 넓은 범위에서 찾되 원문이 맨 앞이라 첫 위치가 그대로이고(`slice` 단언), 부재 단언(직접 `confirm(`·`function openModal`)은 부품까지 보게 되어 더 엄격해진다. 바뀐 줄은 읽는 곳뿐이고 지운 단언 0.
- 반론 2 "표식(`OurgoalTimeTrackerKit`)이 없는 파일로 옮기면 시험을 피할 수 있다" → 옮긴 코드가 원본 스코프 이름(`tracker` 등)을 읽으려면 키트 통로(`K.scope`)를 써야 하고 원본이 옮긴 함수를 가져오는 곳도 키트다. 표식 없는 파일로 옮기면 원본 글자는 사라지는데 합본에 안 들어가 존재 단언이 실패한다 — 피하는 길이 아니라 깨지는 길이다.

## 7. [원칙 ⑦] 단계별 실행 — 결과
`scripts/smoke-test.js`·tests 2개만 변경. 제품 코드 0, 금고 파일 0, 단언 문장·기대값 0 변경.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — `reports/TASK-ES-408/test-compare.json`·`mock-move.json`:
- 기준(origin/main 0529229) 대 작업 npm test: smoke 443 통과·0 실패(검사 제목·결과 목록 동일) · 무결성 38/38 · 버튼 943/943 · 모듈 가드 ① 34007 · ② 663 · ③ 282 · ④ 5 · ⑤ 0 — 같음.
- tests 102개 + `scripts/test-time-tracker-lifecycle.js`: 종료 코드 103/103 같음(28개는 기준에서도 실패 — 기존, 고치지 않음 · lifecycle 포함), 경로·시간을 지운 출력 차이 0.
- 모의 이전(스크래치, 저장소에 넣지 않음): 기준 시험지 440/443(ES-090·ES-174·ES-175 실패), 새 시험지 443/443 · 38/38 · 943/943 · 모듈 가드 ④ 4, npm test 종료 0, tests 종료 코드 기준 시험지와 같음.
- 막히는 지점: ES-407 생성기가 다른 표식을 쓰면 합본에서 빠진다 → 생성기는 `OurgoalTimeTrackerKit` 표식과 `T.`·`K.` 접두로 부품을 쓴다.
- 새로 본 기존 결함(고치지 않음, 별도 티켓): `scripts/test-time-tracker-lifecycle.js` 가 기준 커밋에서도 실패한다(위 4절).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
