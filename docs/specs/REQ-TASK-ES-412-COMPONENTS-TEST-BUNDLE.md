# REQ/PLAN — TASK-ES-412 시험지가 「컴포넌트 합본」을 읽는다 (공통 UI 컴포넌트 세포 쪼개기 선행, 시험지)

> 근거: 코디네이터 지시(2026-10-05) — 공통 UI 컴포넌트 세포 분열(TASK-ES-411: `js/components.js` 3,861줄 1차)에서 "시험지가 원본 한 파일만 읽어 깨지면 기대값을 바꾸지 말고 범위만 넓히는 시험지 선행 PR 을 먼저(제품 0, 지운 단언 0)". 선례 #720(TASK-ES-408 시간기록 합본)·#715(TASK-ES-403 팀 목표 합본)·#703(TASK-ES-388 팀 합본)·#707(TASK-ES-393 통계 합본).
> 제품 코드 변경 0. 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0. 지운 단언 0. 단언 문장·기대값·검사 수 변경 0.

## REQ
- 대상 파일: `scripts/smoke-test.js`, `tests/helpers/components-bundle.js`(신규), `tests/*.test.js` 31개(아래 목록), 측정 도구 `docs/design/harness/module-split/test-compare-components.js`·`mock-move-components.js`(신규)
- 대상 함수·상수(smoke-test.js 신규): `COMPONENTS_JS`, `isComponentsPartFile(f)`, `COMPONENTS_PART_FILES`, `COMPONENTS_RAW`, `COMPONENTS_SRC` (부품 접두 제거는 기존 `readTeamPartFile(f)` 재사용 — 같은 `T.`·`K.` 접두)
- 대상 함수(tests 공용 도우미 신규): `componentsPartFiles()`, `readComponentsBundle()`, `componentsLoadOrder()`
- 바꾸는 읽기 자리: smoke-test.js 에서 `fs.readFileSync(path.join(__dirname, '..', 'js', 'components.js'), 'utf8')` 38곳 → `COMPONENTS_SRC`(ES-162·ES-275·ES-284~ES-322·ES-330 직통 핸들러 글자 검사). tests 31개에서 `js/components.js` 글자 읽기 → `readComponentsBundle()`. `tests/quest-task-exp.test.js` 의 `vm.runInContext(compJs, context)` → `componentsLoadOrder()` 순서(부품 → 원본)로 같은 컨텍스트에서 읽기.
- 그대로 두는 것: `require('../js/components.js')` 실행 경로(원본 머리 이음매가 부품을 require 한다), index.html 태그 단언(`src="js/components.js?v=20260917-es162"`), `window.X = X`·`module.exports.X = X` 노출 줄 단언(노출 줄은 원본에 남는다).
- 대상 DOM ID: 없음(시험지 변경)

## 1. [원칙 ①] 문제 정확히 파악
ES-411 은 `js/components.js` 의 탭별 직통 핸들러(`handle<탭>_ItemNNAction` 38개 + 그 핸들러를 부르거나 같은 탭 일을 하는 작은 함수 18개, 모두 56개)를 `js/components-*-actions.js` 11개로 동작 그대로 옮긴다. 옮긴 뒤에도 기존 글자 단언이 같은 코드를 찾아야 하고, vm 으로 원본 글자를 직접 돌리는 시험(`quest-task-exp`)도 브라우저와 같은 코드를 돌려야 한다. 단언 문장·기대값·검사 수는 바꾸지 않는다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- 본질: 시험은 '직통 핸들러 코드'를 봐야 하는데 '그 코드가 들어 있는 파일 한 개'를 보고 있다.
- 원인(측정): `scripts/smoke-test.js` 가 `js/components.js` 를 글자로 직접 읽는 곳 38곳, tests 31개가 같은 파일을 글자로 읽는다(1개는 vm 으로 그 글자를 실행). 모의 이전(8절)에서 기준 시험지는 smoke 408/443(35개 실패 — ES-284~ES-322 직통 핸들러 글자 검사), tests 21개가 기준에서 통과하다 실패한다.
- 중심: 법정은 기준 커밋 시험지로 채점한다 — 이 PR 이 먼저 병합되지 않으면 ES-411 은 옮긴 글자만큼 실패한다.
- 핵심: 읽는 범위를 '원본 + 그 원본의 키트 부품' 합본으로 넓히고, 합본 맨 앞이 원본 원문 그대로임을 시험 안에서 단언한다. 실행 시험은 브라우저 읽는 순서(부품 → 원본)를 따른다.

## 3. [원칙 ③] 해결방식 — 구체적 식별자
- 컴포넌트 합본 = `js/components.js` 원문(맨 앞, 손대지 않음) + 키트 부품(이름순). 부품 = `js/` 바로 아래 `components-*.js` 중 `OurgoalComponentsKit` 표식이 있는 파일. 부품만 생성기 접두 `T.`·`K.` 를 기존 `readTeamPartFile` 정규식으로 떼고 읽는다(시간기록·팀 합본과 같은 방식).
- 합본 단언(check 밖 — 검사 수 443 불변): 파일 머리에서 `COMPONENTS_SRC.slice(0, 원문 길이) === 원문`, 부품 0개면 `COMPONENTS_SRC === 원문`. tests 도우미 `readComponentsBundle()` 도 같은 두 조건을 던지기로 지킨다.
- tests 31개: `achievement-collapse-toggle`·`achievement-graph-multiset`·`achievement-metric-multiselect`·`achievement-stats-shell-button-removal`·`avatar-exp-celebration`·`avatar-icon-enlarge-all`·`avatar-levelup-dialogue`·`feed-ai-bot-reduction`·`feed-post-category-diversity`·`feed-post-photo-upload`·`feed-post-preview-modal`·`feed-post-selectable-targets`·`feed-share-latest-record`·`goal-template-legacy-cleanup`·`goal-templates-encyclopedia`·`home-goal-board-cleanup`·`manito-ai-limit`·`quest-task-exp`·`remove-ai-companions`·`schedule-dual-bg`·`schedule-notification-setting`·`settings-collapse-default`·`settings-reorganization`·`stopwatch-lap-activity-safety`·`story-card-diversity`·`team-goal-comment-fix`·`team-goals-collapse-default`·`team-linked-goals-example-card`·`time-record-modal-compact`·`trio-es143-es145`·`two-factor-auth` — 글자 읽기 한 줄을 `readComponentsBundle()` 로, 도우미 require 한 줄 추가. 그 밖의 줄 0 변경.
- `quest-task-exp`: `componentsLoadOrder().forEach(f => vm.runInContext(fs.readFileSync(f, 'utf-8'), context))` — 부품 0개면 `js/components.js` 하나를 이전과 같은 글자로 돌린다.

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 쪼개기 PR 안에서 단언 경로를 고침: 기준 시험지로 채점되는 법정에서 판정 불가(모의 이전 408/443).
- B 사라지는 글자를 원본에 주석으로 남김: 가짜 흔적 — 금지.
- C 덜 옮김: 핸들러마다 단언 글자(`og_task-NN_cache`·플래그 이름·`async function handle…(`)가 있어 어느 묶음을 옮겨도 깨진다.
- D 읽는 범위만 합본으로(선례 #720·#715·#703·#707): 단언 0 변경 → D 선택. tests 는 31개라 같은 규칙을 한 도우미(`tests/helpers/components-bundle.js`)에 두고 한 줄씩 부른다(규칙이 31벌로 갈라지지 않게).
- `scripts/verify-integrity-gate.js`(금고)는 `components.js` 를 읽지 않는다 — 손대지 않는다.

## 5. [원칙 ⑤] 절차
1) 기준 `git worktree add --detach`(origin/main 31e5703) → 2) smoke-test.js 수정 → 3) tests 도우미·31개 수정 → 4) `test-compare-components.js` 로 기준 대 작업(npm test 수치·smoke 검사 제목·결과, tests 105개 종료 코드·정규화 출력) → 5) 모의 이전 트리(기준 `git archive` + ES-411 생성기 산출물 + module-specs·module-guard 갱신)를 기준·새 시험지로 채점(`mock-move-components.js`) → 6) claims·기록 → 7) PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 "시험을 느슨하게 한다" → 존재 단언은 같은 글자를 더 넓은 범위에서 찾되 원문이 맨 앞이라 첫 위치가 그대로이고(`slice` 단언), 부재 단언(예: `remove-ai-companions` 의 AI 동반자 글자 없음)은 부품까지 보게 되어 더 엄격해진다. 바뀐 줄은 읽는 곳뿐이고 지운 단언 0. 노출 줄 단언(`window.handle…Action = handle…Action;`)은 원본에 남는 줄이라 그대로 원본에서 찾는다.
- 반론 2 "vm 시험을 부품 → 원본 순서로 바꾸면 다른 코드를 돌린다" → 부품 0개면 읽는 파일 목록이 `[js/components.js]` 하나라 이전과 같은 글자다. 부품이 생기면 index.html 이 읽는 것과 같은 순서(부품 태그가 원본 태그 바로 앞)라 브라우저에서 도는 코드와 같다. 기준 대 작업 tests 종료 코드·정규화 출력이 같다(8절).

## 7. [원칙 ⑦] 단계별 실행 — 결과
`scripts/smoke-test.js`(+15줄 합본 정의, 38곳 읽기 교체)·tests 31개(각 +1줄 require, 1줄 읽기 교체, `quest-task-exp` 은 vm 읽기 1줄 → 2줄)·도우미 1개·측정 도구 2개. 제품 코드 0, 금고 파일 0, 단언 문장·기대값 0 변경.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — `reports/TASK-ES-412/test-compare.json`·`mock-move.json`:
- 기준(origin/main 31e5703 분리 worktree) 대 작업 npm test: smoke 443 통과·0 실패(검사 제목·결과 목록 487줄 동일) · 무결성 38/38 · 버튼 943/943 · 모듈 가드 ① 34007 · ② 663 · ③ 282 · ④ 4 · ⑤ 0 — 같음.
- tests 105개: 종료 코드 105/105 같음(27개는 기준에서도 실패 — 기존, 고치지 않음), 경로·시간·스택 줄 번호를 지운 출력 차이 0(줄 번호는 시험지에 require 한 줄을 더해 실패 위치가 1 밀리는 것 — 정규화에 넣었다).
- 모의 이전(스크래치, 저장소에 넣지 않음): 기준 시험지 smoke 408/443(35개 실패), tests 21개가 기준과 달리 실패 → 새 시험지 smoke 443/443, npm test 종료 0, tests 종료 코드 기준과 같음.
- 막히는 지점: ES-411 생성기가 다른 표식·이름을 쓰면 합본에서 빠진다 → 생성기는 `components-` 이름과 `OurgoalComponentsKit` 표식으로 부품을 쓴다(모의 이전에서 확인).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
