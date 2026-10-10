# REQ — 미분화 덩어리 해체 B2: 세포별 provide 등록(대조 불일치 0)

- Task ID: **TASK-ES-611** (L012: `gh pr list --state all` · `git ls-remote origin` 에서 611 이 비어 있음을 확인하고 빈 브랜치를 먼저 push 해 선점. 그 뒤 다른 세션이 #TASK-ES-612 를 PR #884 로 병합했다 — 번호 충돌 없음)
- **상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d)**: 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
  - 이 PR 이 맡는 문장: 「남은 미분화작업 모두 진행해」의 첫 단계(B2). 「병합도 스스로 진행해」는 오케스트레이터 세션이 법정 판정 뒤 위임 병합 기준(MODE_4B MERGE_GATE)으로 처리한다 — 이 PR 의 작업자(빌더)는 병합하지 않는다.
  - 원문에 있고 이 PR 에 없는 것: B3~B10(키트별 배선 철거·상태 기관·부팅 기관)과 남은 함수 이전. 범위 밖 사유 = 설계 6절 「한 번에 1 PR」. 목표 줄(인라인 IIFE 줄 수 0)에 그대로 남는다.
- 지시함(origin/main) 열린 지시: **DIR-003** — 「B1 병합 뒤 B2(세포별 provide 등록, 불일치 0) → B3~B8 …」. 이 PR 이 그 B2 다.
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(다) 탐색 — 「새 기관 추가(대조 모드)」**. 작업참고에 이 유형의 경험칙이 아직 없다. 선례는 B1(#TASK-ES-610, PR #883 — 법정 판정 「통과」 판정번호 D5B45398)이고, 가장 가까운 표준 유형은 세포 분열(CELL_SPLIT)이다. 다른 점: 함수를 옮기지 않는다(토큰 동일 증명 대신 「등록 블록을 걷어 내면 기준 파일과 글자가 같다」를 잰다). 증명 하한은 설계 4절 「새 기관 추가(B1·B2, 대조 모드)」 행.
- 작업참고 기준 PR #881(f40ba86a) · 기준 main 25025be8(PR #884 병합 뒤 — 착수 때는 f0af028f 였고 push 전에 합쳤다. 두 커밋 사이 제품 파일 차이 0)
- 설계 정본: docs/architecture/CELL-REGISTRY-DESIGN.md(2절 방식 · 3.1 등록 기관 · 3.2 대조 탐침 · 4절 증명 하한 · 6절 순서)

## 0. 요구 (지시 항목)

| ID | 지시 | 완료 기준 |
|---|---|---|
| R1 | 세포가 키트에 단 이름을 등록 기관(`OurgoalCellRegistry.provide`)에 스스로 등록하는 줄을 세포 파일 끝에 더한다. 등록 기관은 compare 모드라 값을 보관만 하므로 앱 동작은 그대로다 | 게스트 부팅·여섯 탭 시나리오가 기준·작업 양쪽에서 통과(행동이 만든 변화 단언 포함) |
| R2 | 대조: 등록한 이름마다 옛 경로(통로 getter 값 · window 값)와 등록 값이 `===` 로 같다. 등록 수 > 0(공허하지 않음), 불일치 0, 이중 등록 0, 초과 0. 등록하지 못한 이름은 누락으로 남기고 사유를 적는다 | `reports/TASK-ES-611/cell-registry-compare.json` 의 counts: registered > 0 · checked > 0 · mismatches 0 · conflicts 0 · extra 0, 누락은 숫자 그대로 |
| R3 | 등록 줄은 손이 아니라 결정론 생성기로 넣는다(멱등). 세포의 기존 글자·함수 본문은 바꾸지 않는다 | `measurement.json` 의 appendOnly.allSame = true(등록 블록을 걷어 내면 기준 파일과 같다) · 생성기 두 번째 실행의 변경 0 |
| R4 | 증명 하한: index.html 변경 0 · 새 전역 0 · 800줄 상한 초과 0 · module-load 새 회귀 0 · npm test 검사 수 동일·폐기 0 · inlineScriptLines 불변 · tests/ 변경 0 · 금고 변경 0 | `reports/TASK-ES-611/measurement.json` 에 명령·종료 코드·수치가 있고 기준 = 작업 |

### 구체 식별자

- 새 파일: `docs/design/harness/module-split/gen-cell-provide.js`(등록 줄 생성기 — `readIndex()` · `kitAssignmentsOf()` · `plan()` · `blockFor()` · `stripBlock()` · `applyBlock()`), `reports/TASK-ES-611/measure-b2.cjs`(측정 기록 생성기)
- 고친 파일: 세포 파일 **167개**(목록·세포 id·이름 수는 `reports/TASK-ES-611/provide-plan.json` 의 `files[]`) — 각 파일 맨 끝에 표지(`/* ==== [세포 등록 시작 · gen-cell-provide.js] … ==== */` ~ `/* ==== [세포 등록 끝] ==== */`) 사이의 등록 블록 하나. 블록 안 호출: `OurgoalCellRegistry.provide('<신고서 세포 id>', { 이름: K.이름, … }, { window: ['이름', …] })`
- 읽는 식별자(변경 0): `index.html` 인라인 IIFE(2254~6234행)의 가져오기 줄 `var X = _settingsKit.X` 등 키트 변수 15개(`_ui` · `_xp` · `_settingsKit` · `_recordsKit` · `_calendarKit` · `_goalsKit` · `_commKit` · `_modalOpenKit` · `_authSocialKit` · `_creatorTemplatesLegacyKit` · `_visionTableInputKit` · `_curatedMarketDataKit` · `_levelBadgeKit` · `_uiKit` · `_homeKit`) · `window.OurgoalAppScope.expose('index.html', { get X(){ return X; } })` · `window.X = X` · 등록 기관 태그(`index.html` 2151행 `<script src="js/core/cell-registry.js">`)
- 시나리오 DOM: `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab="home|goals|records|calendar|comm|settings"]`
- 손대지 않은 것: `index.html` · `js/core/cell-registry.js` · `js/core/app-scope.js` · tests/ · 금고(court/** 등) · 생성 지도 3종(L009) · `docs/architecture/modules.json`(`module-specs --write` 를 돌렸으나 내용 변화 0)

## 1. [원칙 ①] 문제를 정확히 파악한다

- B1 첫 대조(PR #883)의 측정값: 통로 이름 423 · window 노출 이름 199 · 등록 0 · 누락 622. 등록이 0 이라 「불일치 0」은 공허했다.
- 배선은 「세포 → index.html(가져오기) → 세포(통로·window)」로 돈다. 이 고리를 끊으려면(B3 부터 배선 철거) 먼저 세포가 index.html 을 거치지 않고 같은 값을 내놓는다는 것을 이름마다 `===` 로 보여야 한다.
- 이 PR 의 완료는 「등록 > 0 인 상태에서 불일치 0」과 「동작 변화 0」을 측정으로 보인 것이다. 측정값: 등록 438 · 대조 534 · 불일치 0 · 누락 88 · 초과 0 · 이중 등록 0(출처 `reports/TASK-ES-611/cell-registry-compare.json` counts).

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 이름의 주인(그 이름을 키트에 단 세포)이 자기 이름을 스스로 내놓게 하되, 지금은 대조만 한다 — 값의 흐름은 한 글자도 바꾸지 않는다.
- **원인**: IIFE 가 키트에서 514개 이름을 끌어와(`var X = _kit.X`) 그중 일부를 통로 getter·window 로 다시 내준다. 세포는 자기 이름이 어디로 나가는지 모르고, index.html 만 안다.
- **중심**: 「어느 파일이 그 이름의 주인인가」를 글자가 아니라 구조로 정하는 것 — index.html 은 @babel/parser 로 읽고(가져오기·getter 가 돌려주는 이름·window 대입 오른쪽), 세포 파일은 스코프 분석(@babel/traverse)으로 키트 별칭을 풀어 `K.x = …` · `키트 = { … }` · `Object.assign(K, { … })` 를 찾는다. 같은 이름을 여러 파일이 달면 문서 순서상 마지막 파일이 주인이다(IIFE 가 읽는 값이 그것이다).
- **핵심**: 등록 값이 옳은지는 생성기가 아니라 **대조 탐침**이 정한다. 생성기가 주인을 잘못 짚으면 `===` 가 깨져 불일치로 드러난다. 그래서 완료 기준은 생성기 산출이 아니라 탐침 결과 파일이다.

## 3. [원칙 ③] 해결 방식

1. 생성기 `gen-cell-provide.js`: 등록할 이름 = (통로 getter 가 가져오기 이름을 돌려주는 이름) ∪ (window 대입 오른쪽이 가져오기 이름인 이름). 주인 파일의 맨 끝에 등록 블록을 덧붙인다. 블록은 독립 IIFE 이고 `if (!R) return;` 으로 기관이 없을 때(법정 module-load 탐침의 단독 로드) 아무것도 하지 않는다.
2. 멱등: 표지 사이를 걷어 내고 다시 붙인다. 덧붙인 뒤 파서로 「원본 문장 수 + 1」인지 확인한다(앞 식에 붙어 호출로 읽히는 것을 막는다 — 원본이 `;` 로 끝나지 않으면 `;` 한 줄을 먼저 둔다. 이번 167 파일은 모두 `;` 로 끝나 해당 0).
3. 등록하지 않는 것(누락으로 남긴다): ① IIFE 안에 정의가 남은 이름(세포 없음) ② setter 가 달린 통로 이름(다시 대입되는 상태 — B9 몫) ③ 통로와 window 가 서로 다른 가져오기 이름을 가리키는 이름 ④ 등록 블록을 붙이면 800줄을 넘는 세포의 이름.
4. 대조: B1 탐침(`scripts/probes/cell-registry-compare.js`)을 그대로 쓴다(탐침 변경 0).
5. 증명: 게스트 여섯 탭 시나리오(기준·작업) · module-load(탐침 CLI 와 같은 비교 + 바뀐 세포 파일 167개 전부 단독 로드) · npm test 기준/작업 · module-metrics · 「등록 블록을 걷어 내면 기준과 같다」 대조.

## 4. [원칙 ④] 재검토 (반례·부작용)

- 등록 블록이 로드될 때 동작을 바꾸는가 → compare 모드의 `provide` 는 내부 표에 값만 넣는다(js/core/cell-registry.js 에 scope 대입·window 대입 없음 — B1 에서 확인, 이 PR 은 그 파일을 바꾸지 않았다). 블록은 키트 값을 **읽기만** 한다.
- 키트 값이 getter 면 읽는 순간 부작용이 날 수 있다 → 키트는 `K.x = 함수` 꼴의 평범한 속성이다. 대조 탐침의 게스트 부팅 예외 0 · 콘솔 오류 0 · 시나리오 noExceptions 로 확인.
- 등록 시점의 값과 IIFE 가 읽는 시점의 값이 다르면(나중 파일이 덮어씀) → 마지막 파일이 등록하게 했고, 어긋나면 탐침이 불일치로 잡는다(측정 0).
- 세포 파일이 800줄을 넘는다 → `js/tabs/goals/team-goals-screen.js` 한 파일이 798 → 810줄이 된다. 상한이 먼저이므로 생성기가 이 파일을 건너뛰고 그 이름(`renderTeamGoalsScreen`, 통로+window)을 누락으로 남겼다. 블록 형식을 줄여 맞추지 않았다(최소 형식도 800을 넘는다). 이 세포는 책임 단위로 나눈 뒤 등록한다(별도 작업 — 보고).
- 새 전역이 생기는가 → 블록은 `var` 를 IIFE 안에만 둔다. 바뀐 파일 167개의 단독 로드 전역 목록이 기준과 같다(측정 `measurement.json` summary.newGlobals.count 0).
- 신고서가 바뀌는가 → `node scripts/module-specs.js --write` 산출의 내용 변화 0(git diff 0).

## 5. [원칙 ⑤] 절차

1. 정독(B1 REQ·reports·탐침·판정 댓글) → 작업계획서.
2. index.html 가져오기 줄 전수 분석(514개 · 키트 변수 15개) → 생성기 작성 → 계획만 실행(파일 0 변경) → 건너뛴 이름·사유 확인.
3. `--write` → 두 번째 실행 changed 0 확인 → `module-guard` → 800줄 초과 발견 → 상한 규칙 추가 → 재실행.
4. 대조 탐침 → 결과 파일.
5. 기준 트리(origin/main 임시 worktree) → 시나리오(기준·작업) → module-load → npm test(기준·작업, 전경).
6. REQ · claims · TICKETS → `verify-integrity-gate` → `npm test` → `measure-b2.cjs`.
7. origin/main 합치기 → 커밋 → 법정 예비 점검 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- 재검증: 단계마다 완료 기준을 결과 파일로 두고 보고에는 그 파일의 값만 인용한다. 작업자 측정은 주장이며 판정은 법정만 낸다.
- **반론 1** 「누락이 88 이나 남았는데 '불일치 0 달성'이라 할 수 있는가」 → 불일치와 누락은 다른 값이다. 불일치는 「등록했는데 값이 다름」(0), 누락은 「등록하지 않음」(88)이다. 누락 88 은 전부 사유가 있다: IIFE 안에 정의가 남은 이름 84(통로 67 · window 17) + 생성기가 건너뛴 이름 4(switchTab 2 · renderTeamGoalsScreen 2). 사유 없는 누락 0(`measurement.json` summary.compare.missingClass.unexplained 가 빈 배열). IIFE 소유 이름은 등록할 세포가 없어 함수 이전·B9·B10 에서 사라진다 — 지금 등록하면 거짓 주인을 만드는 것이다.
- **반론 2** 「167개 파일을 한 PR 에서 바꾸면 위험하다. 키트별로 나눠야 한다」 → 바뀌는 것은 파일마다 맨 끝의 등록 블록 하나뿐이고(걷어 내면 기준과 글자가 같다 — 167/167), 등록 기관은 값을 보관만 한다. 나누면 키트별 대조가 서로 「초과」로 엇갈리지 않지만 PR 이 6개가 되어 병합마다 생성기 재실행이 필요하다. 설계 6절도 B2 를 한 행으로 둔다. 헌법 제5조 제2항(Diff 상한 없음).
- **반론 3** 「생성기가 주인을 잘못 짚어도 우연히 값이 같으면 모른다」 → 값이 같다는 것은 그 파일 끝에서 읽은 키트 값이 IIFE 가 쓰는 값과 같은 함수라는 뜻이라 철거(own 모드)에 필요한 조건은 충족한다. 주인 표기(세포 id)는 `provide-plan.json` 의 `assigners[]`(그 이름을 다는 파일 전부)로 검토할 수 있게 남겼다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

| 단계 | 산출물 | 측정 |
|---|---|---|
| 생성기 | `docs/design/harness/module-split/gen-cell-provide.js` · `reports/TASK-ES-611/provide-plan.json` | 그 파일 `counts`(등록 이름 · 파일 수 · 건너뜀) · `byKit` · 두 번째 실행 changed 0 |
| 등록 블록 | 세포 파일 167개 | `measurement.json` summary.appendOnly(걷어 내면 기준과 같은 파일 수) |
| 대조 | `reports/TASK-ES-611/cell-registry-compare.json` | 그 파일 `counts`(가공 없음) |
| 시나리오 | `reports/TASK-ES-611/scenario-local.json` | 기준·작업 `passed` · nonVacuousExpects |
| module-load | `reports/TASK-ES-611/module-load.json` | `regressions` · changedCellFiles |
| npm test | `reports/TASK-ES-611/raw/npm-test.*.log` · `npm-test-compare.json` | 종료 코드·검사 줄 수·요약 줄 |
| 가드 | `measurement.json` summary.ratchet · guard | module-metrics 다섯 지표 [기준, 작업] · module-guard 종료 코드 |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- 예상한 막힘과 실제: ① 800줄 상한(예상·발생 → 그 세포는 건너뛰고 보고) ② origin/main 이동(예상·발생: PR #884 병합 → 합침, 제품 파일 차이 0) ③ 키트에 이름을 다는 방식이 파일마다 달라 글자로 못 찾는 이름(예상 → 실제 0: `provide-plan.json` skipped 에 「찾지 못했다」 사유 0건) ④ 등록 기관 태그보다 앞에서 로드되는 세포(예상 → 실제 0) ⑤ cell-map-export 시험이 미추적 새 파일에서 실패(B1 선례 → 스테이징 뒤 실행).
- 성과: 수치는 모두 `reports/TASK-ES-611/measurement.json` 과 각 결과 파일의 값을 인용한다. 「통과」는 쓰지 않는다 — 작업자 측정이며 판정은 `node court/chat.js <PR>` 만 낸다.
- B3~B8 계획용 참고(글자 분석, 판정 아님): 키트별 「등록됐고 IIFE 안에 getter·window 대입 말고는 참조가 없는 이름(철거 후보)」과 「IIFE 안 다른 코드가 아직 쓰는 이름」 수는 `provide-plan.json` 의 `byKit` 에 있다.
- 발견(고치지 않음, 보고만): `switchTab` 은 통로에서는 `switchTab` 을, window 에서는 `setTab` 을 가리킨다(`window.switchTab = setTab`). 두 값이 다르므로 한 이름으로 등록할 수 없어 건너뛰었다 — 철거 때 따로 다뤄야 한다.
- 다음에 열리는 것: B3(`_settingsKit` 철거 + 등록 기관 own 모드).
