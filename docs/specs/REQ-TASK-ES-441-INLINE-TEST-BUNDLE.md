# REQ — #TASK-ES-441 시험지가 인라인 합본을 읽음: index.html 인라인 스크립트 세포화(P0 구역 2차) 선행, 단언·기대값·검사 수 그대로

- 근거: 헌법 v2026.10.05-CELL 세포골격 절, `docs/specs/MODULE-SPLIT-PROTOCOL.md` 5절(시험지가 인라인에서 함수를 뽑으면 시험지를 먼저 고친 선행 PR — 제품 0·기대값 0 — 을 병합한 뒤 옮긴다, retire 금지). 선례: #TASK-ES-412(컴포넌트 합본 `tests/helpers/components-bundle.js`), #TASK-ES-426(성소 합본), #TASK-ES-357(smoke-test 합본 읽기).
- 범위: 시험지 11곳의 **읽는 범위만** 넓힌다. 제품 코드 0, 동결 파일 0, 지운 단언 0, 기대값 변경 0, 검사 수 변경 0, retire 0.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. P0 구역 1차(#749, #TASK-ES-437)에서 옮기지 못한 10묶음(G023·G024·G025·G026·G036·G039·G048·G054·G068·G074)은, 시험지가 index.html **글자에서** 함수 본문을 잘라 가짜 환경에서 실행하거나 글자를 세기 때문에 옮기면 기준 시험지가 깨진다.
2. 법정은 기준 커밋의 시험지로 작업 커밋을 채점하므로, 시험지가 세포 파일도 읽도록 먼저 넓혀 병합해야 그 묶음을 옮길 수 있다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 시험이 "그 함수가 index.html 에 있다"는 위치 가정에 묶여 있어, 동작을 바꾸지 않는 옮기기도 시험 실패로 보인다. 시험이 보는 것은 함수의 글자·동작이지 파일 위치가 아니어야 한다.
- **원인**: 시험지 11곳이 `fs.readFileSync('index.html')` 한 파일만 읽고, smoke-test 는 인라인 스크립트(`mainScript`)에서만 함수를 뽑는다.
- **중심**: 세포는 이름 참조에만 `L.` 접두를 붙여 옮긴다 → 세포 글자에서 `L.` 만 떼면 인라인에 있던 글자와 같다(1차 verify 의 토큰 동일과 같은 규칙).
- **핵심**: `tests/helpers/inline-bundle.js` 의 `withInlineCells(html)` = index.html 원문(맨 앞, 그대로) + `js/tabs/**/*.js` 중 app-scope 통로(`OurgoalAppScope`)를 쓰는 세포(경로순, `L.` 접두 제거). 원문이 맨 앞이라 아직 인라인에 있는 함수는 원래 자리에서 먼저 찾힌다 → 지금 커밋에서 결과가 같다.

## 3. [원칙 ③] 해결방식

- `tests/helpers/inline-bundle.js` 새로(제품 아님 — 시험 도우미).
- 읽는 줄 하나만 감쌈(단언 그대로): `account-switch-isolation`·`direct-login-guard`·`dev-host-gate`·`device-session-control`·`logout-scope-es399`·`two-factor-auth`·`onboarding-first-checkin`·`records-tab-rename`·`schedule-goal-sync`(9곳 — `html`/`indexHtml` 변수 = 합본).
- `core-confirm-es376`: 확인창 19곳 **줄 세기만** 합본(`HTML_CELLS`)으로. "인라인 기본 확인창은 2곳만" 검사·태그 순서 검사·`sliceFunction` 은 index.html 원문 그대로(합본으로 넓히면 js/tabs 의 다른 확인창까지 세어 뜻이 바뀐다 — 측정으로 확인).
- `scripts/smoke-test.js`: 인라인에서 함수를 잘라 실행하는 세 곳(FN_NAMES 추출 원본 `fnSource`, `parseJwtPayload`, `convertTextToNotionDbRecord`)의 원본 뒤에 세포 글자(`L.` 제거)를 붙인다. 글자 검사(합본 읽기)는 그대로.

## 4. [원칙 ④] 재검토 — 한계

- 합본은 `js/tabs/**` 세포만 본다(시험지 합본 읽기 #357 과 같은 범위). 다른 경로로 옮기는 세포는 이 도우미를 넓혀야 한다.
- `L.` 접두 제거는 세포 파일 전체에 적용된다 — 시험이 세포 글자를 직접 세는 단언은 없다(합본 뒤쪽은 함수 잘라 오기·줄 세기에만 쓰임). 지금 커밋 측정에서 tests 108개 종료 코드·smoke 443/0 가 기준과 같다.
- 다른 구역(P1·P2) 빌더도 같은 도우미를 쓸 수 있다(시험지 줄 하나 감싸기).

## 5. [원칙 ⑤] 절차

기준 origin/main 0719592 `git archive` 사본 → 시험지 패치(스크립트, 손 편집 아님) → 기준 대 작업 tests·npm test 종료 코드 비교 → 모의 이전(구역 전체를 #749 생성기로 옮긴 사본)에서 옛 시험지 11곳 실패 · 새 시험지 통과 확인 → 문서 → 커밋 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "합본으로 넓히면 원래 실패해야 할 경우(함수가 지워짐)도 세포 쪽 글자로 통과해 버린다." → 세포는 실제로 브라우저가 읽는 파일이고(script 태그), 함수가 세포에 있으면 앱에도 있다. 둘 다 없으면 지금처럼 실패한다(합본에도 없다).
- 반론 2: "`L.` 를 떼면 시험이 세포의 진짜 글자와 다른 것을 실행한다." → 시험 환경은 인라인 스코프 이름을 전역으로 흉내 낸다. 인라인에 있을 때의 글자(= `L.` 없는 글자)를 그대로 돌리는 것이 지금 시험과 같은 조건이다. 옮긴 뒤의 `L.` 통로 자체는 게스트 조작 비교·화면 시나리오가 따로 잰다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: `tests/helpers/inline-bundle.js`(`withInlineCells`·`inlineCellFiles`·`readCell`), `scripts/smoke-test.js`(`INLINE_CELLS_SRC`), 위 3절 tests 10개, `reports/TASK-ES-441/`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 결과 |
| :-- | :-- |
| 기준 대 작업(지금 커밋) | tests 종료 코드·npm test(smoke 443/0·무결성 38/38) — `reports/TASK-ES-441/test-compare.json` |
| 모의 이전(P0 구역 전체 이전 사본) | 옛 시험지: 10곳 실패 + smoke 442/1(convertTextToNotionDbRecord) → 새 시험지: 10곳 통과 + smoke 443/0 — `reports/TASK-ES-441/mock-move.json` |
| 지운 단언 | 0 (바뀐 줄은 읽는 줄·합본 변수 선언뿐) |

[4단계: 심사 청구]
