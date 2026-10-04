# REQ/PLAN — TASK-ES-393 시험지가 「통계 합본」을 읽는다 (통계 세포 쪼개기 1차 선행, 시험지)

> 근거: 코디네이터 지시(2026-10-05) — 통계 세포 쪼개기 1차(TASK-ES-392, `js/universal-stats.js` 6,092줄) 전에, 기준 시험지가 `js/universal-stats.js` 한 파일의 글자를 직접 찾으면 시험지 선행 PR 을 먼저 올린다. 선례 #700(TASK-ES-385)·#703(TASK-ES-388).
> 제품 코드 변경 0. 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0.

## REQ
- 대상 파일: `scripts/smoke-test.js`, `tests/achievement-stats-shell-button-removal.test.js`, `tests/core-confirm-es374.test.js`
- 대상 함수·상수(smoke-test.js 신규): `UNIVERSAL_STATS_JS`, `isStatsPartFile(f)`, `readStatsPartFile(f)`, `STATS_PART_FILES`, `UNIVERSAL_STATS_RAW`, `STATS_SRC`
- 대상 함수(tests 2개 신규): `listStatsParts(rootDir)`, `readStatsBundle(rootDir)`
- 대상 검사: smoke `#TASK-ES-060`(new Function 실행)·`#TASK-ES-091`·`#TASK-ES-092`·`#TASK-ES-093`·`#TASK-ES-094`·`#TASK-ES-174`·`#TASK-ES-177`·`#TASK-ES-311`
- 대상 DOM ID: 없음(시험지 변경)

## 1. [원칙 ①] 목표 정의
`js/universal-stats.js` 의 책임 묶음을 `js/stats-*.js` 키트 부품(`OurgoalUniversalStatsKit`)으로 옮겨도(동작 그대로) 기존 글자 단언·실행 단언이 같은 코드를 찾게 한다. 단언 문장·기대값·검사 수는 바꾸지 않는다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 시험은 '통계 코드'를 봐야 하는데 '통계 코드가 들어 있는 파일 한 개'를 보고 있다.
- 원인(측정, `grep universal-stats scripts tests`): `scripts/smoke-test.js` 가 원본 글자를 직접 읽는 곳 7곳(`fs.readFileSync(path.join(__dirname, '..', 'js', 'universal-stats.js'), 'utf8')` 5곳 + `fs.readFileSync(statsJsPath, 'utf8')` 2곳), 원본 한 파일을 `new Function('window', uSrc)(mockWindow)` 로 실행해 함수를 꺼내는 곳 1곳(#TASK-ES-060). tests/ 에서 원본 글자를 읽는 시험 2개. `require('../js/universal-stats.js')` 로 부르는 곳(smoke 10곳·test-universal-import·test-universal-stats-ux)은 원본 머리 이음매가 부품을 require 하므로 그대로 돈다.
- 중심: 법정은 기준 커밋 시험지로 채점한다 — 이 PR 이 먼저 병합되지 않으면 ES-392 는 실패한다(모의 이전 실측 442/443, 8절).
- 핵심: 읽는 범위·실행 범위를 합본으로 넓히고, 합본 맨 앞이 원본 원문 그대로임을 시험 안에서 단언한다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
- 통계 합본 = `js/universal-stats.js` 원문(맨 앞, 손대지 않음) + 키트 부품(이름순). 키트 부품 = `js/` 바로 아래 `stats-` 로 시작하고 `OurgoalUniversalStatsKit` 글자가 있는 파일(지금 0개). 부품만 생성기 접두 `S.`·`K.` 를 정규식 `/(^|[^A-Za-z0-9_$.])[SK]\.(?=[A-Za-z_$])/g` 로 떼고 읽는다(T.·K.·L.·AV. 와 같은 방식).
- [기본값] 부품 위치 `js/stats-*.js`: `js/tabs/**`·`js/core/*` 는 앱 합본(`APP_MODULE_FILES`)에 들어가 `#TASK-ES-155 showToast( 없음` 같은 앱 합본 단언에 새로 걸리고, `js/<폴더>/` 는 `verify-all-clicks.js` 핸들러 소스(`js/` 바로 아래 파일 전부) 밖이 된다. `js/records-stats.js` 는 다른 세포라 이름(`stats-` 로 시작)과 표식 둘 다로 거른다.
- smoke-test.js: 글자 7곳 → `STATS_SRC`. `fs.existsSync(...)`·index.html 태그 단언은 그대로(원본 파일은 남는다). `#TASK-ES-060` 은 `new Function(uSrc)` 문법 검사 그대로, 실행만 키트 부품(이름순, 원문) → 원본 순서로 같은 `mockWindow` 에서(브라우저 `<script>` 순서와 같다).
- 합본 단언(check 밖 — 검사 수 443 불변): `STATS_SRC.slice(0, 원문 길이) === 원문`, 부품 0개면 `STATS_SRC === 원문`.
- tests: `achievement-stats-shell-button-removal` 의 부재 단언 대상 `uStats` → `readStatsBundle(rootDir)`. `core-confirm-es374` 는 "직접 confirm( 없음" **부재** 단언만 통계 합본(옮긴 코드도 계속 감시), "공용 통로 사용" **존재** 단언은 원본 한 파일 그대로(통로 줄 `askConfirm` 은 원본에 남는다).

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 쪼개기 PR 에서 단언 경로를 함께 고침: 기준 시험지로 채점되는 법정에서 판정 불가(모의 이전에서 #TASK-ES-060 이 깨짐).
- B 옮긴 함수를 원본에 껍데기로 남김: 가짜 흔적 — 금지.
- C 읽는 범위만 합본으로(선례 #700·#703): 단언 0 변경 → C 선택.
- `scripts/verify-integrity-gate.js`(금고): `js/universal-stats.js` 의 `잔디` **부재** 검사(용어 헌법)를 원본 한 파일에만 건다. 금고라 고치지 않는다 — 옮긴 부품은 그 검사 범위 밖이 된다(ES-392 에서 부품의 `잔디` 0 을 따로 재고 보고). `verify-all-clicks.js` 는 `js/` 바로 아래 파일을 모두 읽어 부품 위치가 이미 범위 안 → 그대로.

## 5. [원칙 ⑤] 절차
1) 기준 `git archive origin/main`(09f4a99) 사본에서 npm test·tests 2개 측정(git 을 읽는 시험 때문에 같은 커밋의 분리 작업 폴더로도 한 번) → 2) smoke-test.js 수정 → 3) tests 2개 수정 → 4) 작업 트리에서 같은 측정 → 5) 정규화(경로·스택 줄 번호) 후 비교 → 6) 모의 이전 트리를 기준·새 시험지로 채점 → 7) claims·기록 → 8) PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "시험을 느슨하게 한다" → 존재 단언은 같은 글자를 더 넓은 범위에서 찾되 원문이 맨 앞이라 첫 위치가 그대로이고, 부재 단언(`uLinkGoalBtn`·`🎯 목표 연계`·직접 `confirm(`)은 부품까지 보게 되어 더 엄격해진다. 지운 단언 줄 0(diff 의 `-` 줄은 읽는 줄·실행 줄·부재 단언 대상 변수뿐).
- 반론② "표식으로 부품을 고르면, 표식 없는 새 파일로 옮겨 시험을 피할 수 있다" → 옮긴 코드가 원본 스코프 이름을 읽으려면 키트 통로(`K.scope`)를 써야 하고 원본이 옮긴 함수를 가져오는 곳도 키트다. 표식 없는 파일로 옮기면 원본 글자는 사라지는데 합본에 안 들어가 기존 단언이 **실패**한다 — 피하는 길이 아니라 깨지는 길이다.

## 7. [원칙 ⑦] 즉시 실행 — 결과
scripts/smoke-test.js·tests 2개만 변경. 제품 코드 0, 금고 파일 0, 단언 문장·기대값 0 변경.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — `reports/TASK-ES-393/test-compare.json`·`mock-move.json`:
- 기준(09f4a99) npm test: smoke 443 통과·0 실패 / 무결성 38/38 / 버튼 943/943 / 셀 구조 42개 파일 / 모듈 가드 ① 34058 · ② 669 · ③ 282 · ④ 9 · ⑤ 0. 작업 트리: 같은 수치, smoke 검사 제목 443개 목록 동일, 분리 작업 폴더 출력과 경로 줄 말고 같음.
- tests 2개: 종료 코드·출력이 정규화 뒤 기준과 같다. `achievement-stats-shell-button-removal` 은 **기준에서도** 통계와 무관한 단언(renderCalendar 뷰 전파)에서 실패 — 고치지 않음(기대값 변경 금지).
- 모의 이전(스크래치, 저장소에 넣지 않음): ES-392 생성기로 921줄(함수 9개)을 `js/stats-taxonomy.js`·`stats-data-grid.js`·`stats-lenses.js` 로 옮긴 트리 — 기준 시험지 442/443(#TASK-ES-060 실패), 새 시험지 443/443.
- 막히는 지점: ES-392 에서 옮긴 함수가 `OurgoalUniversalStatsKit` 이 아닌 통로를 쓰면 합본에서 빠진다 → 생성기는 #701 팀 세포와 같은 키트 꼴을 쓴다.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
