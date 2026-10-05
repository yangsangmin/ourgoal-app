# REQ/PLAN — TASK-ES-426 시험지가 「성소 합본」을 읽는다 (포커스 성소 엔진 세포 쪼개기 선행, 시험지)

> 근거: 코디네이터 지시(2026-10-05) — 포커스 성소 엔진 세포 분열(TASK-ES-425: `js/sanctuary-v3-engine.js` 1,964줄 → 800줄 이하)에서 "시험지가 원본 한 파일만 읽어 깨지면 범위만 넓히는 선행 PR 먼저(지운 단언 0)". 선례 #726(TASK-ES-412 컴포넌트 합본)·#720(TASK-ES-408 시간기록 합본)·#707(TASK-ES-393 통계 합본).
> 제품 코드 변경 0. 금고 파일(court/**·AGENTS.md·CLAUDE.md·01_OURGOAL_SUPREME_CONSTITUTION_FULL.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0. 지운 단언 0. 단언 문장·기대값·검사 수 변경 0.

## REQ
- 대상 파일: `scripts/smoke-test.js`, 측정 도구 `docs/design/harness/module-split/test-compare-sanctuary.js`·`mock-move-sanctuary.js`(신규)
- 대상 함수·상수(smoke-test.js 신규): `SANCTUARY_JS`, `isSanctuaryPartFile(f)`, `SANCTUARY_PART_FILES`, `SANCTUARY_RAW`, `SANCTUARY_SRC` (부품 접두 제거는 기존 `readTeamPartFile(f)` 재사용 — 같은 `T.`·`K.` 접두)
- 바꾸는 읽기 자리: smoke-test.js 에서 `js/sanctuary-v3-engine.js` 를 글자로 읽는 11곳(`fs.readFileSync(path.join(__dirname, '..', 'js', 'sanctuary-v3-engine.js'), 'utf8')` 10곳 + `fs.readFileSync(path.join(__dirname, '../js/sanctuary-v3-engine.js'), 'utf8')` 1곳) → `SANCTUARY_SRC`. 변수 이름(`sanctuarySrc`·`engineSrc`·`sanctuaryJs`·`sanctContent`·`v3Engine`·`sanctEngine`)과 단언 줄은 그대로.
- 그대로 두는 것: `scripts/verify-integrity-gate.js`(금고)는 원본 한 파일을 읽는다 — 손대지 않는다. ES-425 는 그 게이트가 찾는 글자(모드 바 `setCalMode`·`setRecMode`, 주간 `s-week-grid`·`dayDetailsHtml`, 목표 알약 `s-goal-pills-wrap empty`·`window.promptNewGoal()`, `openScheduleDetail` 의 `openCalendarManualEditModal` 인자, `s-cal-quick-action-bar`·`폰 잠금화면에서 보기`)가 있는 구간을 원본에 남긴다. tests/*.test.js 중 이 파일을 읽는 시험은 0개(검색).
- 대상 DOM ID: 없음(시험지 변경)

## 1. [원칙 ①] 문제 정확히 파악
ES-425 는 `js/sanctuary-v3-engine.js` 의 레이더 함수 4개·렌더 분기 본문 7개·공개 객체 메서드 28개를 `js/sanctuary-*.js` 7개로 동작 그대로 옮긴다. 옮긴 뒤에도 smoke-test.js 의 성소 글자 단언(러닝메이트 레이더 `getRealRunningMates`·`s-radar-empty-card`, 월간 달력 `s-cal-dots-row`, 뽀모도로 완료 전파 `renderRecordsScreen()` 등)이 같은 코드를 찾아야 한다. 단언 문장·기대값·검사 수는 바꾸지 않는다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- 본질: 시험은 '성소 코드'를 봐야 하는데 '그 코드가 들어 있는 파일 한 개'를 보고 있다.
- 원인(측정): `scripts/smoke-test.js` 가 `js/sanctuary-v3-engine.js` 를 글자로 직접 읽는 곳 11곳. 모의 이전(8절)에서 기준 시험지는 smoke 440/443 — 3개 실패(소통 레이더 실데이터 직결 TASK-SANCTUARY-COMM-RADAR-REAL-INTEGRITY · 일정 탭 정상화 TASK-CALENDAR-TAB-RESTORATION · 레이더 슬림화 ES-246).
- 중심: 법정은 기준 커밋 시험지로 채점한다 — 이 PR 이 먼저 병합되지 않으면 ES-425 는 옮긴 글자만큼 실패한다.
- 핵심: 읽는 범위를 '원본 + 그 원본의 키트 부품' 합본으로 넓히고, 합본 맨 앞이 원본 원문 그대로임을 시험 안에서 단언한다.

## 3. [원칙 ③] 해결방식 — 구체적 식별자
- 성소 합본 = `js/sanctuary-v3-engine.js` 원문(맨 앞, 손대지 않음) + 키트 부품(이름순). 부품 = `js/` 바로 아래 `sanctuary-*.js` 중 원본이 아니고 `OurgoalSanctuaryV3Kit` 표식이 있는 파일. 부품만 생성기 접두 `T.`·`K.` 를 기존 `readTeamPartFile` 정규식으로 떼고 읽는다(컴포넌트·시간기록·팀 합본과 같은 방식).
- 합본 단언(check 밖 — 검사 수 443 불변): `SANCTUARY_SRC.slice(0, 원문 길이) === 원문`, 부품 0개면 `SANCTUARY_SRC === 원문`.

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 쪼개기 PR 안에서 단언 경로를 고침: 기준 시험지로 채점되는 법정에서 판정 불가(모의 이전 440/443).
- B 사라지는 글자를 원본에 주석으로 남김: 가짜 흔적 — 금지.
- C 덜 옮김: 레이더·월간 달력·뽀모도로를 남기면 원본이 800줄 아래로 내려가지 않는다(동결 게이트 글자 구간을 이미 원본에 남기므로 여유가 없다).
- D 읽는 범위만 합본으로(선례 #726·#720·#707): 단언 0 변경 → D 선택.

## 5. [원칙 ⑤] 절차
1) 기준 = origin/main f020065 `git archive` 사본(스크래치에 git init — 추적 파일만 읽는 시험 때문) → 2) smoke-test.js 수정(합본 정의 14줄 + 읽기 11곳 교체) → 3) `test-compare-sanctuary.js` 로 기준 대 작업(npm test 수치·smoke 검사 제목·결과, tests 종료 코드·정규화 출력) → 4) 모의 이전 트리(기준 `git archive` + ES-425 생성기 `gen-sanctuary.js` 산출물 + module-specs·spec-sanctuary·module-guard 갱신)를 기준·새 시험지로 채점(`mock-move-sanctuary.js`) → 5) claims·기록 → 6) PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 "시험을 느슨하게 한다" → 존재 단언은 같은 글자를 더 넓은 범위에서 찾되 원문이 맨 앞이라 첫 위치가 그대로이고(`slice` 단언), 부재 단언(`28명 몰입 중`·`const defaultPeers = [`·`id="sTransplantBtn"`·`일정 추가 창을 준비 중입니다`·`setCalMode(\'timer\')`)은 부품까지 보게 되어 더 엄격해진다. 바뀐 줄은 읽는 곳뿐이고 지운 단언 0. 공개 노출 단언(`toggleRadarCollapse: toggleRadarCollapse`)은 원본 객체에 남는 줄이라 원본에서 찾는다.
- 반론 2 "합본이 다른 sanctuary-*.js 파일을 끌어온다" → 부품은 이름(`sanctuary-` 시작, 원본 제외)과 키트 표식 두 조건으로 거른다. 지금 `js/` 아래 `sanctuary-` 로 시작하는 파일은 원본 하나뿐이라 이 PR 에서 합본 = 원문(단언으로 확인).

## 7. [원칙 ⑦] 단계별 실행 — 결과
`scripts/smoke-test.js`(+14줄 합본 정의, 11곳 읽기 교체)·측정 도구 2개. 제품 코드 0, 금고 파일 0, tests 0, 단언 문장·기대값 0 변경.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — `reports/TASK-ES-426/test-compare.json`·`mock-move.json`:
- 기준(origin/main f020065 `git archive` 사본) 대 작업 npm test: smoke 443 통과·0 실패 · 무결성 38/38 · 버튼 943/943 · 모듈 가드 ① 34007 · ② 663 · ③ 282 · ④ 3 · ⑤ 0 — test-compare.json 의 sameNumbers 로 확인.
- smoke 검사 제목 487줄·결과 같음. tests 107개: 종료 코드 107/107 같음(기준에서도 실패하던 시험은 그대로 — 고치지 않음). 정규화 출력 차이 2개(`avatar-personas-split`·`goal-templates-data-split`)는 기준 사본이 `git archive` 스크래치 저장소라 옛 커밋(ddbb761·9962457)을 못 읽어 지문 비교로 대신한 줄 수 차이다(작업 worktree 는 저장소 이력으로 원본 비교까지 더 함) — 이 PR 변경과 무관, 종료 코드 같음.
- 모의 이전(스크래치, 저장소에 넣지 않음): 기준 시험지 smoke 440/443(3개 실패) → 새 시험지 smoke 443/443, npm test 종료 0, tests 종료 코드 기준과 같음.
- 막히는 지점: ES-425 생성기가 다른 표식·이름을 쓰면 합본에서 빠진다 → 생성기는 `sanctuary-` 이름과 `OurgoalSanctuaryV3Kit` 표식으로 부품을 쓴다(모의 이전에서 확인). 동결 무결성 게이트는 합본으로 넓힐 수 없으므로 ES-425 가 그 글자 구간을 원본에 남긴다.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
