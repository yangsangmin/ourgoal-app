# REQ — 옛 배선 글자를 붙잡는 시험을 「옛 배선 글자 또는 등록」으로 넓히기 (#TASK-ES-620)

- 작업번호: TASK-ES-620 · 종류: 시험지 변경(제품 코드 변경 0) · 짝 PR: TASK-ES-623(금고 파일 `scripts/verify-integrity-gate.js` 한 줄 — 별도 PR)
- 작업참고: `C:/dev/agent-knowledge/WORK-REFERENCE.md` **기준 PR #890**(끝까지 읽음)
- 측정 기준: `origin/main` 4134955f(PR #895 병합 뒤). 그 뒤 main 이 움직여 push 전에 합쳤고, 합친 뒤의 빠른 재확인은 7.8절(짝 PR 병합 뒤의 main 을 합친 재확인은 7.9절)에 있다(어느 커밋에서 쟀는지는 그 절과 `post-merge.json`·`post-merge-2.json` 의 `baseCommit`). main 과 함께 움직이는 수는 이 PR 이 가진 `reports/TASK-ES-620/` 의 측정 파일을 가리킨다.
- 이 문서는 작업 세션의 서류다. 효력·근거가 아니며, 아래 수치는 전부 **작업자 측정(판정 아님)** 이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (상민님 원문 · 지시 항목)

### 상민님 원문 (글자 그대로)

1. 2026-10-11, 세션이 올린 결심 6묶음 표에 대한 답(지시함 DIR-004 「결심 기록」에 병합된 글자):
   「결심필요 4번 빼고 모두 권장안대로 진행하고 4번은 자세히 설명해봐 어떤 함수인지 어떤 기능을 하던건지 자세히, 어떻게 진행하는게 좋을지, 권장안이 뭔지」
   - 그 표의 2번 묶음은 「시험지가 옛 연결선 글자를 정답으로 붙잡음(최소 22종)」, 올린 권장은 「승인. 그 전까지 해당 이름은 지우지 않고 남겨 둡니다.」였다(`docs/architecture/CELL-REGISTRY-DESIGN.md` 8.1절). 지시함 DIR-004 (다)항은 「시험의 기대값·단언을 바꾸는 PR 은 따로 올리고, 그 병합에는 상민님의 정확한 문구 『금고 변경 승인』이 그때 필요하다」고 적었다.
2. 2026-10-11, 그 뒤(커맨드센터 세션 309dca5d 채팅):
   「1. 887 병합완료 2. 철거 2차 사전 승인, 금고 변경 승인 3. 함수 이전 사전 승인, 헌법 개정 승인 및 병합 사전 승인 4. 완료기록 병합 사전 승인」
   - 이 가운데 **「2. 철거 2차 사전 승인, 금고 변경 승인」** 이 이 PR 의 승인 문구다.
   - 이 문서를 쓴 빌더는 그 채팅을 직접 보지 못했다. 오케스트레이터(같은 세션 309dca5d)가 빌더 지시문에 옮겨 준 글자를 한 글자도 바꾸지 않고 옮겼다. 병합 때 이 문장을 대조할 수 있게 여기 적는다. 오케스트레이터는 그 뒤 「상민님이 이 세션 채팅에서 그 문구를 직접 주셨고 세션 병합도 사전 승인하셨다」고 빌더에게 알려 왔다(오케스트레이터가 전한 말이며, 빌더가 채팅을 본 것은 아니다).
3. 2026-10-11, 이 작업 전체의 지시(지시함 DIR-004 「결심 기록」에 병합된 글자):
   「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」

### 이 승인으로 하는 것과 하지 않는 것

- 하는 것: **옛 연결선 글자(`window.X = X;`)를 정답으로 붙잡는 시험 단언**을 고치는 것뿐이다.
- 하지 않는 것: 다른 시험·다른 기대값·법정 코드(`court/**`)·헌법·지시함·제품 코드(`index.html`·`js/**`)·생성기. 이 승인을 그 밖의 변경에 쓰지 않았다.
- 상민님이 하지 않은 말을 승인으로 적지 않았다. 위 세 문장 밖의 승인은 없다.

### 지시 항목

| ID | 지시 항목 | 나온 곳 |
|---|---|---|
| R1 | 시험이 옛 배선 글자를 붙잡는 단언을 추측이 아니라 측정으로 전수 조사한다(배선을 전부 지운 사본에서 실제로 깨지는 단언). | 원문 1의 2번 묶음 · 원문 2 |
| R2 | 깨지는 단언을 「그 이름이 실제로 노출된다」는 원래 목적 그대로, 옛 배선 글자와 새 등록 방식 둘 다 받아들이게 넓힌다. 검사 수는 줄이지 않고 폐기는 0 이다. | 원문 2 「금고 변경 승인」 |
| R3 | 넓힌 단언이 가짜로 통과하지 않음을 보인다(도우미 자체 시험 · 등록을 일부러 깨뜨린 대조군). | 원문 2(승인 범위를 지키는 조건) |
| R4 | 금고 파일(`scripts/verify-integrity-gate.js`)의 한 줄은 이 PR 에 넣지 않고 금고만 담은 별도 PR(TASK-ES-623)로 올린다. | 헌법 별표 3 · MERGE_GATE 3 |
| R5 | 제품 코드·생성기·법정·헌법·지시함 변경 0. 고치지 않고 남긴 단언(정의 글자·미등록 이름)은 목록으로 보고한다. | 원문 2의 범위 |

- 원문에 있는데 이 PR 에 없는 것: 원문 3의 「남은 미분화작업 모두 진행」 가운데 철거 2차·함수 이전·상태 이전 등은 각각 다른 PR 이다(지시함 DIR-004 의 순서). 병합: 시험 기대값·단언을 바꾸는 PR 이라 일반 위임 병합 기준만으로는 병합할 수 없고 「금고 변경 승인」 문구가 있어야 한다(헌법 MERGE_GATE 3 · 경험칙 L008). 상민님 2026-10-11 사전 승인(원문 2 「금고 변경 승인」)에 따라 오케스트레이터 세션이 법정 판정을 확인한 뒤 병합한다. 빌더는 병합하지 않는다. (처음 올린 판에는 「병합은 상민님이 하신다」고 적었다 — 빌더가 사전 승인의 범위를 알지 못하던 때의 표기였다.)

### 구체 식별자

- 새 도우미: `tests/helpers/wiring-exposed.js` — `windowExposed(source, legacyText)` · `exposureEnd(source, legacyText, fromIndex)` · `scopeExposed(source, legacyText)` · `registeredOnWindow(name, from)` · `registeredOnScope(name, from)` · `registry()` · `forRoot(root)` · `parseWindowWiring(text)` · `parseGetterWiring(text)`
- 도우미 자체 시험: `tests/wiring-exposed.test.js`(검사 16개) — `scripts/test-shipyard-modular.js` 의 `runNode('tests/wiring-exposed.test.js')` 한 줄로 `npm test` 경로에 넣었다.
- 단언을 넓힌 파일(14개): `scripts/smoke-test.js`(검사 25개 안의 36줄 + `const WIRING = require('../tests/helpers/wiring-exposed')`) · `scripts/test-calendar-attachments.js`(3줄) · `tests/achievement-graph-multiset.test.js` · `tests/ai-conditional-call-optimization.test.js` · `tests/feed-post-preview-modal.test.js` · `tests/gcal-login-reconnect-fix.test.js` · `tests/goal-templates-encyclopedia.test.js` · `tests/goals-smart-attachments.test.js` · `tests/settings-collapse-default.test.js` · `tests/stopwatch-table-hint.test.js` · `tests/team-fold-state-es409.test.js` · `tests/team-goal-guide-hint.test.js` · `tests/team-goals-collapse-default.test.js` · `tests/team-level-accordion-es406.test.js`(12개 파일 17줄)
- 읽기만 한 것: 등록 기관 `js/core/cell-registry.js`(`OurgoalCellRegistry.provide` · `commit`) · `js/core/cell-registry-commit.js` · 세포 파일 끝의 「세포 등록 시작 · gen-cell-provide.js」 블록 167개 · 생성기 `docs/design/harness/module-split/gen-inline-hard.js`(`mode:"unwire"`) · `court/README.md` · `court/vault.json` · `court/probes/base-tests.js`
- DOM: 해당 없음(화면 변경 0)
- 측정 도구(전부 `reports/TASK-ES-620/`): `mock-unwire-all.cjs` · `soft-assert-preload.cjs` · `run-asserts.cjs` · `broken-assertions.cjs` · `run-plain.cjs` · `changed-assertions.cjs` · `control-group.cjs` · `court-sandbox-run.cjs` · `window-text-scan.cjs` · `measure.cjs` · `build-claims.cjs`

### 작업 유형 분류 (헌법 SNOWBALL)

**(나) 이탈.** 네 가지를 적는다.

1. 어느 규칙: 경험칙 L067 「시험이 배선 글자를 단언하는 이름은 시험을 고치지 말고 철거 계획에서 빼라」와 L021 「시험지 선행 PR 은 읽는 범위만 넓히고 단언·기대값·검사 수는 0 변경」.
2. 왜 맞지 않는가(사실): 그 이름 39개를 계속 빼 두면 `index.html` 인라인 IIFE 의 배선 줄이 끝까지 남아 지시함 DIR-004 의 완료 기준(IIFE 줄 수 0)에 닿지 못한다(같은 지시의 (3)항이 이것을 적어 두었다). 읽는 범위만 넓혀서는 풀리지 않는다 — 옛 글자 `window.X = X;` 는 어느 파일에도 남지 않고, 새 방식은 `provide('세포', { X: K.X }, { window: ['X'] })` 라는 다른 글자다.
3. 대신 한 것: 상민님 「금고 변경 승인」(원문 2)을 받아, 깨지는 단언을 「옛 배선 글자가 있다 **또는** 같은 이름·같은 값이 등록으로 나간다」로 넓혔다. 옛 글자 갈래는 고치기 전 단언과 글자 하나 다르지 않다.
4. 검증이 같은 수준 이상인가: 단언 수 그대로(바꾼 56줄 · 지운 줄 0 — `reports/TASK-ES-620/changed-assertions.json` 의 `summary.removedOnly`). 등록 갈래는 글자 찾기가 아니라 파서로 다섯 조건을 모두 본다(3절). 넓힌 갈래가 진짜로 재는지는 대조군 다섯 변형으로 쟀다(7절).

### 헌법 제4조 4.4 가 요구하는 세 가지

- ① 목적 변경의 승인 근거: 위 원문 2 「2. 철거 2차 사전 승인, 금고 변경 승인」. 방향 승인은 원문 1(지시함 DIR-004 병합 기록).
- ② 고치기 전·후 기대값: 고치기 전 = 「시험지가 읽은 글자에 `window.X = X;` 가 있다」. 고친 뒤 = 「그 글자가 있다, 또는 `X` 가 같은 값으로 등록 기관을 거쳐 window 에 나간다(3절의 다섯 조건)」. 단언마다의 고치기 전·후 글자는 `reports/TASK-ES-620/changed-assertions.json` 의 `changed[].before`·`after` 에 전수로 있다.
- ③ 제품 변경과 구분한 표시: 이 PR 에 제품 변경이 없다(`index.html`·`js/**` 변경 0). 법정이 기준 시험지로 삼는 파일(`scripts/smoke-test.js`·`scripts/test-calendar-attachments.js`)의 바뀐 검사는 주장 파일 `retire` 에 검사 제목별로 사유를 적었다(폐기가 아니라 넓힘이라는 것과 승인 원문).

## 1. [원칙 ①] 문제를 정확히 파악한다

- 증상: 생성기 unwire 가 `index.html` 의 옛 배선 줄을 지우면, 「index.html 에 `window.X = X;` 글자가 있다」를 단언하는 시험이 깨진다. 그래서 그런 이름은 철거에서 빼 왔다(PR 889 의 넓은 목록 42개).
- 재현: 저장소 밖 사본에서 현행 생성기(`gen-inline-hard.js` `mode:"unwire"` + `sharedLine`, 손잡이 `_ui`·`_xp` 포함)로 붙잡힌 이름까지 전부 지운 `index.html` 을 만들었다(`reports/TASK-ES-620/mock-unwire-all.cjs`). 5,932줄 → 5,257줄, 등록됐는데 배선이 남은 이름 0, 생성기 정지 0(`reports/TASK-ES-620/mock-unwire-all.json`).
- 측정: 같은 시험지를 현재 main 과 그 사본에서 「던지지 않는 단언」으로 끝까지 돌려 실패하는 단언 줄을 맞댔다(`run-asserts.cjs`). 대상은 `npm test` 경로 스크립트 4개 + 그 밖의 `scripts/test-*.js` 13개 + `tests/*.test.js` 113개다.
- 결과(`reports/TASK-ES-620/broken-assertions.json`): 모의 철거 사본에서만 실패하는 단언 **57줄**. 파일별 `scripts/smoke-test.js` 36(검사 25개) · `scripts/test-calendar-attachments.js` 3 · `scripts/verify-integrity-gate.js` 1 · `tests/` 12개 파일 17. 붙잡는 이름 **39개**. 꼴은 문자열 `includes` 54 · 문자열 `indexOf`(함수 잘라 읽기의 끝 지점) 3 · **정규식 0**.
- 넓은 목록 42개 가운데 실제로는 깨지지 않은 이름 3개: `openModal`(걸린 글자가 `var openModal = _modal.open` — 다른 줄) · `openShareToFeedModal`(같은 글자가 세포 파일 안에도 있다) · `triggerHaptic`(걸린 글자가 비교 `===`).

## 2. [원칙 ②] 본질·원인·중심·핵심

- 본질: 이 단언들이 지키려던 것은 글자가 아니라 「그 이름이 실제로 window 에 노출된다」는 사실이다.
- 원인: 노출을 확인할 길이 그때는 `index.html` 의 배선 줄 글자를 찾는 것뿐이었다. 이제는 세포가 등록 기관에 스스로 등록하고 기관이 인라인 IIFE 직전에 같은 값으로 내주므로(PR 885 · PR 889), 같은 사실이 다른 글자로 적혀 있다.
- 중심: 단언을 지우거나 약하게 만들지 않고, 노출의 두 길(옛 배선 · 등록)을 각각 **진짜로** 확인하는 한 군데(공용 도우미)를 두는 것.
- 핵심: 「둘 중 하나」로 넓히되 둘 다 없으면 반드시 실패해야 한다. 그것을 대조군으로 잰다.

## 3. [원칙 ③] 해결 방식

`tests/helpers/wiring-exposed.js` 하나를 만들고, 깨지는 단언이 모두 그것을 쓰게 했다.

- `windowExposed(source, 'window.A = B;')` = `source.includes('window.A = B;')`(고치기 전 단언 그대로) **또는** 「등록됨」.
- 「등록됨」은 아래 다섯 가지가 모두 참일 때뿐이다. 글자를 긁지 않고 등록 블록을 `@babel/parser` 로 읽는다.
  1. `index.html` 이 등록 기관(`js/core/cell-registry.js`) → 그 세포 파일 → commit 파일(`js/core/cell-registry-commit.js`) 순서로, `defer`·`async` 없는 `<script src>` 로 읽는다.
  2. 그 세포 파일의 등록 블록(「세포 등록 시작 · gen-cell-provide.js」 ~ 「세포 등록 끝」)에 `provide('세포id', { A: K.B }, …)` 문이 있다.
  3. 값이 옛 배선의 오른쪽 이름과 같은 키트 속성이다(`window.showToast = toast;` 였으면 `showToast: K.toast`).
  4. `opts.window` 목록에 `A` 가 있다(통로 단언 `scopeExposed` 는 `opts.windowOnly` 에 없어야 한다).
  5. 그 세포 파일이 등록 블록 앞에서 `K.B` 를 실제로 단다(`….B = …` 대입 또는 객체 속성).
- 「함수 시작 ~ 노출 줄 앞」을 잘라 실행하는 시험 3곳은 끝 지점을 `exposureEnd` 로 계산한다: 옛 노출 줄이 있으면 그 자리(고치기 전과 같다), 없고 등록됐으면 잘라 온 글자의 끝, 둘 다 아니면 -1. 그 아래의 단언 줄(`start > 0 && end > start` 등)은 한 글자도 바꾸지 않았다.
- 옛 배선 글자가 `window.이름 = 이름;` 꼴이 아니면 도우미가 오류를 던진다(엉뚱한 글자를 넣어 조용히 통과하지 못한다).
- 파서는 등록 갈래를 볼 때만 읽는다. 옛 배선 글자가 그대로 있는 지금의 main 에서는 고치기 전과 같은 길로 끝난다.
- 통로 getter 글자(`get X(){ return X; }`)를 붙잡는 단언은 조사에서 0건이었다. `scopeExposed` 는 지시대로 만들고 자체 시험만 달았다(부르는 시험 0).

## 4. [원칙 ④] 재검토 (반례·부작용)

- 반례 1 — 등록 블록에 이름은 있는데 window 목록에 없다: 거짓(자체 시험 · 대조군 V2).
- 반례 2 — 등록 블록이 있는 파일을 `index.html` 이 읽지 않거나 commit 뒤에 읽는다: 거짓(자체 시험 · 대조군 V3).
- 반례 3 — commit 태그가 없다(기관이 내주지 않는다): 넓힌 단언 전부 거짓(대조군 V5).
- 반례 4 — 등록만 있고 세포가 그 값을 달지 않는다: 거짓(자체 시험 · 대조군 V4).
- 반례 5 — 표지 밖의 `provide(` 글자, 주석·문자열 안의 글자: 등록이 아니다(자체 시험).
- 부작용 1 — `scripts/smoke-test.js` 가 `tests/helpers/` 의 새 파일에 기댄다: 이미 같은 폴더의 `inline-bundle.js` 에 기대고 있다(244행). 법정의 기준 시험지 채점은 시험지(`scripts/`)만 기준 커밋 것으로 덮고 나머지는 작업 커밋 것을 쓰므로, 도우미는 이 PR 이 병합된 뒤의 main 에 있다.
- 부작용 2 — 등록 갈래는 `@babel/parser` 가 필요하다: 법정은 기준 시험지에 main 의 `node_modules` 를 `NODE_PATH` 로 준다(`.github/workflows/court.yml` ③-2). 법정의 격리 실행 함수(`court/probes/base-tests.js` `runOne`)를 작업자 PC 에서 그대로 불러 모의 철거 사본에서 돌려 보았다 — 권한 제한에 막히지 않았고 실패 제목이 main 과 같았다(7절 「법정의 격리 실행」). 이것은 작업자 PC 측정이며 GitHub 러너에서의 결과는 측정불가다.
- 부작용 3 — 생성기 `gen-cell-provide.js` 를 다시 돌려 등록이 사라지면(경험칙 L068) 넓힌 단언은 실패한다. 의도한 동작이다(배선도 등록도 없으면 노출되지 않는다).

## 5. [원칙 ⑤] 절차

1. 번호 선점(`gh pr list --state all` · `git ls-remote` 0건 확인 뒤 빈 가지 push) → 필독 문서 정독.
2. 저장소 밖 사본에서 전 키트 모의 철거 → 고치기 전 시험지로 실패 단언 전수 조사(현재 main 과 대조).
3. 도우미와 자체 시험 작성 → 깨지는 줄에만 편집(조사 결과의 파일·줄을 입력으로 한 편집기 — 손으로 고른 줄 0).
4. 네 트리(현재 main · 모의 철거 사본 × 고치기 전·후 시험지)에서 `npm test` 전경 실행과 시험 파일 전부를 그대로 돌려 종료 코드·검사 수를 잰다.
5. 대조군(등록을 일부러 깨뜨림) · 법정의 격리 실행 함수로 재실행 · 남긴 것 목록(시험 소스의 `window.이름 =` 글자 전수 분류).
6. 금고 파일은 두 번째 작업 폴더·작업번호(TASK-ES-623)로 분리.
7. 서류(REQ · TICKETS · 주장 파일) → `node scripts/verify-integrity-gate.js` → `npm test` → `node scripts/module-guard.js` → 마지막에 `npm test` 한 번 더.
8. 커밋(훅 우회 없음) → main 합치기 → push → PR(TEMPLATE_MODE_4A_DRAFT_PR) → `gh pr view` 로 번호·head 되읽기. **병합하지 않는다.**

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- 반론 1 — 「단언을 『또는』으로 넓히는 것은 결국 시험을 약하게 만드는 자가채점이다.」
  - 격파: 헌법 제4조 4.4 는 승인 근거·전후 기대값·구분 표시 셋을 갖추면 시험을 사실대로 고치는 것을 자가채점이 아니라고 정한다(0절에 셋을 적었다). 그리고 약해지지 않았다는 것을 주장이 아니라 측정으로 보였다: 옛 글자 갈래는 고치기 전과 같은 식이고, 등록 갈래는 한 세포의 등록을 깨뜨리면 그 이름의 단언만 실패한다(대조군 V1~V5, 새로 실패한 줄이 기대한 줄과 전부 일치). 판정은 법정이 내고, 병합은 상민님의 사전 승인(원문 2)에 따라 오케스트레이터 세션이 판정을 확인한 뒤 한다.
- 반론 2 — 「등록 블록의 글자만 보고 『노출된다』고 하는 것도 글자 검사다. 브라우저에서 `window.X` 를 봐야 한다.」
  - 격파: 고치기 전 단언도 글자 검사였다(같은 확인 수준 — 「글자만 봄」). 수준을 낮추지 않았고, 오히려 조건을 다섯 개로 늘렸다(읽는 순서·값의 출처·정의 유무). 브라우저에서의 실제 값 대조는 철거 PR 마다 대조 탐침(`scripts/probes/cell-registry-compare.js`, 이름 목록 고정)과 법정의 화면 시나리오가 따로 잰다 — 이 시험들이 그 일을 대신한다고 주장하지 않는다.
- 반론 3 — 「금고 파일까지 한 PR 에 넣는 편이 간단하다.」
  - 격파: `scripts/verify-integrity-gate.js` 는 헌법 별표 3 의 금고다(`court/vault.json` 은 기준 시험지로 분류하지만 별표 3 이 「둘이 다르면 넓은 쪽을 동결로 본다」고 정한다). 금고 변경은 금고만 담은 PR 이어야 한다.
- 절차 재검증: 4단계의 「모의 철거 사본 · 고친 시험지」에서 아직 실패하는 단언이 1줄 남는다(금고 파일의 그 한 줄). 두 PR 을 다 얹은 트리에서는 0줄이다(7절). 그래서 철거 2차는 두 PR 이 모두 병합된 뒤에만 붙잡힌 이름을 지울 수 있다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

전부 작업자 측정이며 판정이 아니다. 수는 `reports/TASK-ES-620/measurement.json`(`measure.cjs` 가 각 도구의 산출을 옮겨 적은 것)에서 읽는다.

서류를 다 쓴 뒤 `npm test` 를 전경으로 끝까지 돌린 원시 로그와 종료 코드는 `reports/TASK-ES-620/raw/npm-test.<이름>.log` · `.exit` 에 있다(`measurement.json` 의 `rawNpmTestLogs` 가 종료 코드와 줄 수를 옮겨 적었다).

### 7.1 전수 조사 (고치기 전 시험지)

- 모의 철거: `reports/TASK-ES-620/mock-unwire-all.json` — `index.html` 5932줄 → 5257줄(675줄 삭제), 생성기 실행 20회, 등록됐는데 배선이 남은 이름 0, 생성기 정지로 뺀 이름 0. 저장소의 `index.html` 은 건드리지 않았다.
- 깨지는 단언: `reports/TASK-ES-620/broken-assertions.json` — **57줄** · 이름 39개 · 꼴 문자열(includes) 54 / 문자열(indexOf — 함수 잘라 읽기의 끝 지점) 3 · 정규식 단언 0 · 이름을 읽지 못한 줄 0 · 현재 main 에서만 실패하는 줄 1.
- 현재 main 에서만 실패한 1줄: `tests/offline-sync-queue-retain.test.js:39` 실패한 항목(r2)은 큐에 남는다 — 남은 큐: [] — 배선이 **있는** 쪽에서만 실패했으므로 배선 글자와 무관하다. 줄 단위 조사를 돌린 여섯 트리 가운데 이 한 번만 나왔고, 그대로 실행(7.3)에서는 여섯 트리 모두 그 파일의 종료 코드가 0 이며, 같은 트리에서 그 파일만 6번 다시 돌린 종료 코드도 `0 0 0 0 0 0` 이었다(작업자 PC, `node tests/offline-sync-queue-retain.test.js`). 측정 중 한 번 흔들린 것으로 보며 원인은 확인하지 않았다(이 PR 의 범위 밖).
- 파일별: `scripts/smoke-test.js` 36 · `scripts/test-calendar-attachments.js` 3 · `scripts/verify-integrity-gate.js` 1 · `tests/achievement-graph-multiset.test.js` 1 · `tests/ai-conditional-call-optimization.test.js` 2 · `tests/feed-post-preview-modal.test.js` 1 · `tests/gcal-login-reconnect-fix.test.js` 4 · `tests/goal-templates-encyclopedia.test.js` 2 · `tests/goals-smart-attachments.test.js` 1 · `tests/settings-collapse-default.test.js` 1 · `tests/stopwatch-table-hint.test.js` 1 · `tests/team-fold-state-es409.test.js` 1 · `tests/team-goal-guide-hint.test.js` 1 · `tests/team-goals-collapse-default.test.js` 1 · `tests/team-level-accordion-es406.test.js` 1.
- 별칭(오른쪽 이름이 다른 배선): `window.copyUserGoalTemplate = copyRealUserTemplate` · `window.openGoalTemplateEncyclopediaModal = openTemplateEncyclopediaModal` · `window.showToast = toast`.

### 7.2 바꾼 단언 전수 표

- `reports/TASK-ES-620/changed-assertions.json`(`changed[]` 에 파일 · 고치기 전 줄 번호 · 고친 뒤 줄 번호 · 고치기 전 글자 · 고친 뒤 글자 · 붙잡는 이름 · 그 줄이 속한 단언 줄 · 검사 제목).
- 바꾼 줄 **56** (includes → windowExposed 53 / indexOf → exposureEnd(끝 지점 계산 줄 — 단언 줄은 그대로) 3) · 파일 14개 · 이름 39개 · smoke-test 검사 25개 · 지우기만 한 줄 0 · 옛 배선 글자가 줄에 그대로 남음 true · 더한 줄 5(도우미 require·설명 주석·시험 실행 줄) · 새 파일 `tests/helpers/wiring-exposed.js` · `tests/wiring-exposed.test.js`.
- 깨지는 57줄 가운데 이 PR 이 바꾼 것이 56줄, 나머지 1줄은 금고 파일(`scripts/verify-integrity-gate.js`)이라 짝 PR(TASK-ES-623)에 있다.

### 7.3 종료 코드 · 검사 수 (시험을 있는 그대로 실행 — `run-plain.cjs`)

| 트리 · 시험지 | `npm test` 종료 코드 | ✓ 줄 | ok 줄 | smoke-test(종료 · ✓ · ✗) | 무결성 게이트(종료 · ✓ · ✗) | 시험 파일(종료 0 / 전체) |
|---|--:|--:|--:|---|---|---|
| 현재 main · 고치기 전 | 0 | 487 | 156 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 | 87 / 113 |
| 현재 main · 고친 시험지(이 PR) | 0 | 487 | 172 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 | 88 / 114 |
| 모의 철거 사본 · 고치기 전 | 1 | 414 | 0 | 1 · ✓ 414 · ✗ 25 | 1 · ✓ 37 · ✗ 1 | 77 / 113 |
| 모의 철거 사본 · 고친 시험지(이 PR) | 1 | 476 | 0 | 0 · ✓ 439 · ✗ 0 | 1 · ✓ 37 · ✗ 1 | 88 / 114 |
| 현재 main · 이 PR + 짝 PR | 0 | 487 | 172 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 | 88 / 114 |
| 모의 철거 사본 · 이 PR + 짝 PR | 0 | 487 | 172 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 | 88 / 114 |

- 현재 main: `npm test` 종료 코드 0 → 0, ✓ 줄 487 → 487, ok 줄 156 → 172(늘어난 16줄은 새 도우미 자체 시험). 고친 시험지로 새로 실패한 시험 파일 0개.
- 종료 코드가 0 이 아닌 시험 파일 113개 중 26개는 고치기 전 main 에서도 그렇다(`npm test` 경로 밖의 옛 시험 파일 — 이 PR 이 만들거나 고친 것이 아니다. 목록은 `measurement.json` `runs.main-before.testFiles.failed`).
- 모의 철거 사본: smoke-test 실패 검사 25 → 0(✓ 414 → 439), 종료 코드가 0 이 아닌 시험 파일 36 → 26(현재 main 의 목록과 같음: true).
- 모의 철거 사본 · 고친 시험지에서 `npm test` 종료 코드가 1 인 까닭은 무결성 게이트의 한 줄(✗ 1)이다 — 금고 파일이라 짝 PR 에 있다. 두 PR 을 다 얹으면 종료 코드 0, ✓ 줄 487(현재 main 487).

### 7.4 고친 시험지로 줄 단위 재조사 (`run-asserts.cjs`)

- 「현재 main · 고친 시험지」와 「모의 철거 사본 · 고친 시험지」를 맞대면 모의 철거 사본에서만 실패하는 단언은 **1줄**이다: `scripts/verify-integrity-gate.js:728` window.promptNewGoal 전역 배선 누락.
- 두 PR 을 다 얹은 트리끼리는 0줄이다.

### 7.5 대조군 — 등록을 일부러 깨뜨린다 (`control-group.cjs` → `reports/TASK-ES-620/control-group.json`)

고친 시험지를 얹은 모의 철거 사본(옛 배선 글자 없음)의 복사본에서 `js/tabs/goals/attachments.js` 의 등록을 깨뜨리고, 새로 실패한 단언 줄이 기대한 줄과 같은지 본다.

| 변형 | 무엇을 깨뜨렸나 | 새로 실패한 줄 | 기대한 줄 | 줄 일치 | 실패한 이름 |
|---|---|--:|--:|---|---|
| V1 | js/tabs/goals/attachments.js 의 등록 블록을 통째로 지움 | 8 | 8 | true | openAddAttachmentModal · openAttachmentViewer · renderAttachmentChipsHtml · renderInlineAttachmentChips |
| V2 | 등록 블록의 window 목록에서 openAttachmentViewer 만 뺌(값·windowOnly 는 남김) | 2 | 2 | true | openAttachmentViewer |
| V3 | index.html 에서 js/tabs/goals/attachments.js 의 <script src> 태그를 뺌 | 8 | 8 | true | openAddAttachmentModal · openAttachmentViewer · renderAttachmentChipsHtml · renderInlineAttachmentChips |
| V4 | js/tabs/goals/attachments.js 가 키트에 openAttachmentViewer 를 다는 줄(K.openAttachmentViewer = openAttachmentViewer;)을 지움 | 2 | 2 | true | openAttachmentViewer |
| V5 | index.html 에서 commit 태그(js/core/cell-registry-commit.js)를 뺌 | 56 | 56 | true | 넓힌 이름 전부(39개) |

- 다섯 변형 모두 기대와 같음: true. 기대하지 않은 줄이 새로 실패한 것 0건.
- 도우미 자체 시험 `tests/wiring-exposed.test.js` 는 같은 반례를 가짜 트리에서 잰다(검사 16개).

### 7.6 법정의 격리 실행 함수로 재실행 (`court-sandbox-run.cjs` — 작업자 PC 에서 부른 것, 판정 아님)

| 트리 · 시험지 | 결과(시험지가 직접 찍은 줄만) |
|---|---|
| 현재 main · 고치기 전 | smoke-test.js ✓ 436 · ✗ 3 / verify-integrity-gate.js ✓ 38 · ✗ 0 |
| 현재 main · 고친 시험지 | smoke-test.js ✓ 436 · ✗ 3 / verify-integrity-gate.js ✓ 38 · ✗ 0 |
| 모의 철거 사본 · 고치기 전 | smoke-test.js ✓ 411 · ✗ 28 / verify-integrity-gate.js ✓ 37 · ✗ 1 |
| 모의 철거 사본 · 고친 시험지 | smoke-test.js ✓ 436 · ✗ 3 / verify-integrity-gate.js ✓ 37 · ✗ 1 |
| 현재 main · 이 PR + 짝 PR | smoke-test.js ✓ 436 · ✗ 3 / verify-integrity-gate.js ✓ 38 · ✗ 0 |
| 모의 철거 사본 · 이 PR + 짝 PR | smoke-test.js ✓ 436 · ✗ 3 / verify-integrity-gate.js ✓ 38 · ✗ 0 |

- 격리 실행에서는 현재 main · 고치기 전 시험지에서도 smoke-test 검사 3개가 실패한다(이 PC 의 권한 제한 때문에 자식 프로세스·임시 파일을 못 쓰는 검사 — 제목은 `measurement.json` `courtSandbox.main-before.runners[0].failedTitles`). 법정은 기준에서도 실패하는 검사를 고장으로 세지 않는다.
- 「모의 철거 사본 · 고친 시험지」의 실패 제목이 「현재 main · 고치기 전」과 같은가: true. 등록 갈래(파서)가 권한 제한에 막히지 않았다는 뜻이다. GitHub 러너에서의 결과는 측정불가다.

### 7.7 바뀐 파일의 범위 (`measurement.json` `changedScope`)

- 제품(`index.html`·`js/**` 등): 0개 · 금고·법정·헌법·지시함·생성기: 0개 · 시험 파일: 17개(문서·기록 파일 목록은 같은 칸의 docsAndReports).

### 7.8 origin/main 을 합친 뒤의 빠른 재확인 (`reports/TASK-ES-620/post-merge.json`)

위 측정을 마친 뒤 main 이 움직였다(공용 키트 배선 철거 PR 등 — `index.html` 이 바뀜). 합친 뒤의 main `1ab4bc0b` 에서 같은 도구로 다시 쟀다. 그대로 실행은 `npm test` 경로만, 줄 단위 조사는 `npm test` 경로 스크립트와 바꾼 시험 파일만 돌렸다(전수 조사는 위 7.1 — 합친 뒤에는 다시 하지 않았다).

- 모의 철거(합친 뒤 main 기준): `index.html` 5753줄 → 5257줄, 등록됐는데 배선이 남은 이름 0, 생성기 정지로 뺀 이름 0.

| 트리 · 시험지 | `npm test` 종료 코드 | ✓ 줄 | ok 줄 | smoke-test(종료 · ✓ · ✗) | 무결성 게이트(종료 · ✓ · ✗) |
|---|--:|--:|--:|---|---|
| 합친 뒤 main · 고치기 전 | 0 | 487 | 156 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 |
| 합친 뒤 main · 고친 시험지(이 PR) | 0 | 487 | 172 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 |
| 모의 철거 사본 · 고치기 전 | 1 | 414 | 0 | 1 · ✓ 414 · ✗ 25 | 1 · ✓ 37 · ✗ 1 |
| 모의 철거 사본 · 고친 시험지(이 PR) | 1 | 476 | 0 | 0 · ✓ 439 · ✗ 0 | 1 · ✓ 37 · ✗ 1 |
| 합친 뒤 main · 두 PR | 0 | 487 | 172 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 |
| 모의 철거 사본 · 두 PR | 0 | 487 | 172 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 |

- 줄 단위: 고치기 전 시험지로 모의 철거 사본에서만 실패하는 단언 57줄 → 이 PR 의 시험지로 1줄 → 두 PR 을 다 얹으면 0줄.
- 합친 뒤 이 PR 이 바꾼 파일의 범위(`changedScope`, 기준 = 합친 main): 제품 0개 · 금고·법정·헌법·지시함·생성기 0개 · 시험 파일 17개.
- 합친 뒤 마지막 `npm test` 전경 실행의 원시 로그: `reports/TASK-ES-620/raw/post-merge/` (`post-merge.json` 의 `rawNpmTestLogs`).

### 7.9 짝 PR 병합 뒤의 main 을 합치고 다시 잰 재확인 (`reports/TASK-ES-620/post-merge-2.json`)

7.8 뒤에 main 이 더 움직였다(기록 키트 배선 철거 · 짝 PR 의 게이트 넓힘 병합 등). 그 main `6d4cba9f` 을 합친 뒤 같은 도구로 다시 쟀다. 이제 「고치기 전」 트리(= 그 main 그대로)에는 넓힌 게이트가 들어 있고 공용 도우미는 아직 없다. 그대로 실행은 `npm test` 경로만, 줄 단위 조사는 `npm test` 경로 스크립트와 바꾼 시험 파일만 돌렸다.

- 모의 철거(그 main 기준, 붙잡힌 이름까지 전부): `index.html` 5610줄 → 5257줄, 등록됐는데 배선이 남은 이름 0, 생성기 정지로 뺀 이름 0.

| 트리 · 시험지 | `npm test` 종료 코드 | ✓ 줄 | ok 줄 | smoke-test(종료 · ✓ · ✗) | 무결성 게이트(종료 · ✓ · ✗) |
|---|--:|--:|--:|---|---|
| 그 main 그대로(게이트 병합됨 · 도우미 없음) | 0 | 487 | 156 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 |
| 그 main + 이 PR(작업 폴더) | 0 | 487 | 172 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 |
| 모의 철거 사본 · 그 main 의 시험지 | 1 | 414 | 0 | 1 · ✓ 414 · ✗ 25 | 1 · ✓ 37 · ✗ 1 |
| 모의 철거 사본 · 이 PR 의 시험지 + 병합된 게이트 | 0 | 487 | 172 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 |

- 줄 단위: 그 main 의 시험지로 모의 철거 사본에서만 실패하는 단언 57줄 → 이 PR 의 시험지 + 병합된 게이트로 **0줄**.
- 합친 뒤 이 PR 이 바꾼 파일의 범위(`changedScope`, 기준 = 그 main): 제품 0개 · 금고·법정·헌법·지시함·생성기 0개 · 시험 파일 17개.
- 마지막 `npm test` 전경 실행의 원시 로그: `reports/TASK-ES-620/raw/post-merge-2/` (`post-merge-2.json` 의 `rawNpmTestLogs`). 그 사이의 합침(`bc8af5bc`) 뒤 `npm test` 로그는 `reports/TASK-ES-620/raw/merge-bc8af5bc/` 에 있다.

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

### 법정 판정 예상 (예상이지 판정이 아니다)

- 법정의 분류(`court/vault.json`): `tests/**` 는 목록에 없어 **제품**으로 분류된다(주장이 걸려야 한다 — 파일마다 글자 확인 주장을 걸었다). `scripts/smoke-test.js`·`scripts/test-*.js` 는 **기준 시험지**다 — 법정은 기준 커밋의 시험지로 작업 커밋의 제품을 채점하고(제품이 그대로이므로 깨질 검사가 없다), 시험지에서 바뀐 단언 줄은 `retire` 의 검사 제목별 사유와 맞춘다.
- `court/probes/base-tests.js` 의 분류 함수(`classifyCheck`)를 기준 커밋의 `scripts/smoke-test.js` 에 돌려 보면, 바뀐 검사 25개 가운데 4개가 「제품 함수를 실제로 돌리던 검사」, 21개가 「글자가 있는지만 보던 검사」로 읽힌다(작업자 PC 에서 돌린 값). 앞의 4개 때문에 판정서는 **「확인 부족 — 기존 검사 4개의 수정 … 상민님 결심이 있어야 합니다」** 꼴이 될 것으로 예상한다. 이것은 `court/README.md` 5절(「제품 함수를 실제로 돌리던 검사의 폐기는 상민님 결심 사항」)이 정한 길이고, 그 결심이 0절의 원문 2다.
- 「돌려보냄」이 나오면 사유를 읽고 고쳐 다시 심사받는다. 예상과 다른 판정이 나와도 이 문서의 예상을 근거로 쓰지 않는다.

### 실제 판정(첫 심사 — `node court/chat.js 900` 출력에서 옮김)

- 심사 대상 커밋 4ffa9cb(기준 bc8af5b) · 판정번호 5BEEC450: 「판정: 확인 부족(막지는 않지만, 확인 못 한 채 나가는 것이 있습니다) — 제품 함수를 실제로 돌리던 기존 검사 4개를 폐기하겠다는 신청이 있습니다 — 상민님 결심이 있어야 합니다」 · 「작업자가 적어 낸 지시 항목 5건 중: 글자만 확인(이 종류는 그걸로 충분) 5」 · 돌려보냄 누적 0회.
- 판정서는 「폐기」라고 부르지만 이 PR 은 그 검사들을 없애지 않았다(단언을 넓혔다 — 0절). 법정은 고친 검사와 없앤 검사를 같은 칸(`retire`)으로 받는다.
- 그 뒤 main(짝 PR 병합 포함)을 합쳐 다시 push 했으므로 새 커밋의 판정은 PR 의 `court` 검사와 `node court/chat.js 900` 을 본다(이 문서에 미리 적지 않는다).

### 판정서의 안내와 `court/README.md` 가 다르게 읽히는 곳 — `retire` 12건(빼지 않았다)

- 판정서(GitHub 실행 38098877926 의 `court-verdict` 자료 `verdict.json` 을 내려받아 읽음)는 `scripts/smoke-test.js` 의 검사 12개(제목에 TASK-ES-234 · 235 · 255 · 256 · 257 · 264 · 265 · 274 · 300 · 301 · 302 · 303 이 든 것)마다 「폐기 신청했지만 깨지지 않은 검사 — … 는 작업 커밋에서도 통과한다 — retire 에서 빼야 한다」는 알림을 실었다. 같은 판정서의 「기존 실행 검사 수정」은 단언 8줄, 「기존 글자 검사 수정」은 `scripts/smoke-test.js` 단언 12줄이다(합 20줄).
- 그런데 그 12개는 이 PR 이 실제로 단언을 고친 검사다(`reports/TASK-ES-620/changed-assertions.json` 의 `changed[].check`). `court/README.md` 5절은 「테스트 파일에서 지우거나 고친 검사는 주장 파일의 retire 에 검사 제목별로 사유를 적는다 … 파일 이름만 맞는 사유 한 줄로 그 파일의 다른 검사까지 덮을 수 없다」고 정한다.
- 어긋나는 까닭(법정 코드를 읽기만 하고, 같은 함수를 작업자 PC 에서 돌려 본 것): `court/vault-check.js` 는 사라지거나 바뀐 단언 줄을 **앞에서 20줄까지만** 제목과 함께 넘긴다(`removed.slice(0, 20)`). 이 PR 은 `scripts/smoke-test.js` 에서 36줄을 바꿨고, 앞 20줄에 걸린 검사 제목이 13개, 21번째 줄부터만 걸린 검사 제목이 정확히 그 12개다(`removedAssertions` 를 기준·작업 커밋의 파일에 돌린 값). 판정서가 센 바뀐 줄도 8 + 12 = 20줄이다. 법정은 그 12개 검사의 바뀐 줄을 제목과 함께 넘겨받지 못해 「바뀐 검사」가 아니라 「깨지지 않은 검사」로 본 것으로 읽힌다 — 이 해석은 추정이다(법정 코드는 고치지 않았다).
- 그래서 12건을 `retire` 에서 빼지 않았다(README 를 따랐다). 빼면 README 의 「검사 제목별로」와 어긋나고, 두면 판정서에 그 알림이 계속 남는다. 어느 쪽이 맞는지는 법정을 고치는 쪽(별도 PR · 결심)의 일이라 이 PR 에서는 정하지 않고 보고만 한다.

### `court/README.md` 와 지시가 달랐던 점

- 지시문은 `scripts/verify-integrity-gate.js` 를 금고라고 했다. `court/README.md` 5절과 `court/vault.json` 은 그 파일을 「테스트 파일(baseTests) — 고칠 수 있다」로 분류한다. 헌법 별표 3 은 금고로 적고 넓은 쪽을 따르라고 하므로 **넓은 쪽(금고)** 으로 다뤄 별도 PR 로 냈다.
- 지시문은 `tests/**` 를 「금고 목록에 없다」고만 했다. 법정은 `tests/**` 를 **제품**으로 분류한다(`court/vault.json` 의 뒤집힌 분류). 그래서 폐기 사유(`retire`)만으로는 부족하고 파일마다 주장이 필요했다.
- 지시문의 「시험지 선행 PR 규칙」은 「단언·기대값·검사 수 0 변경」(경험칙 L021)이라 이 PR 에는 맞지 않는다(단언 글자가 바뀐다). `court/README.md` 5절의 「지우거나 고친 검사는 `retire` 에 검사 제목별로」를 따랐다.

### 고치지 않고 남긴 것 (목록 — `reports/TASK-ES-620/window-text-scan.json`)

시험 소스 135개 파일의 문자열·정규식 리터럴에서 `window.이름 =` 글자 90곳을 파서로 모아 분류했다(고침 60 · 등록됐지만 안 깨짐 2 · 미등록 이름 6 · 찾는 글자 아님 19 · 정의 글자 3). 고친 것 말고는 손대지 않았다.
- **정의 글자를 붙잡는 단언(3곳 — 범위 밖)**: 오른쪽이 이름이 아닌 글자(`window.X = function …` 등)다. 배선이 아니라 정의라서 배선 철거가 지우지 않는다. 이름 2개.
  - `scripts/smoke-test.js:9560` 문자열 `window.sendTeamGoalComment = async function`
  - `tests/core-confirm-es376.test.js:205` 문자열 `window.purgeSampleRecordsOneClick = async function(){`
  - `tests/team-goal-comment-fix.test.js:24` 문자열 `window.sendTeamGoalComment = async function`
- **미등록 이름의 배선 글자를 붙잡는 단언(6곳 — 범위 밖)**: 등록 기관에 window 로 등록되지 않은 이름이라 지워질 줄이 아니다. 이름: `extractNotionDatabaseId` · `renderTeamGoalsScreen` · `saveGoogleToken` · `showNewGoalManualForm`.
  - `scripts/smoke-test.js:5777` 문자열 `window.extractNotionDatabaseId = extractNotionDatabaseId`
  - `scripts/smoke-test.js:7472` 문자열 `window.showNewGoalManualForm = showNewGoalManualForm;`
  - `scripts/smoke-test.js:8451` 문자열 `window.renderTeamGoalsScreen = renderTeamGoalsScreen;`
  - `scripts/verify-integrity-gate.js:729` 문자열 `window.showNewGoalManualForm = showNewGoalManualForm;`
  - `tests/gcal-login-reconnect-fix.test.js:25` 문자열 `window.saveGoogleToken = saveGoogleToken;`
  - `tests/team-goal-guide-hint.test.js:42` 문자열 `window.renderTeamGoalsScreen = renderTeamGoalsScreen;`
- **등록된 이름인데 깨지지 않아 고치지 않은 것(2곳)**: 같은 글자가 세포 파일 등 다른 곳에도 있어 모의 철거 뒤에도 단언이 참이다. 이름: `openShareToFeedModal`.
  - `scripts/smoke-test.js:4659` 문자열 `window.openShareToFeedModal = openShareToFeedModal;`
  - `scripts/smoke-test.js:4706` 문자열 `window.openShareToFeedModal = openShareToFeedModal;`
- **찾는 글자가 아닌 것(19곳)**: 시험이 만든 가짜 소스·단언 문구 등 제품 글자를 붙잡지 않는 리터럴이다(목록은 같은 파일의 `notSearched`).
- 「함수 선언 글자」(`function 이름(` 꼴)를 붙잡는 단언은 이 조사의 대상이 아니다(배선 줄이 아니다 — 배선 철거가 지우지 않는다).
- 이 PR 이 줄을 넓힌 파일 가운데 셋(`scripts/test-calendar-attachments.js` · `tests/goals-smart-attachments.test.js` · `tests/settings-collapse-default.test.js`)은 고치기 전 main 에서도 종료 코드가 0 이 아니다. 배선 글자가 아닌 다른 단언(함수 선언 글자·호출 글자 등)이 이미 실패하기 때문이며 `npm test` 경로 밖이다. 그 단언들은 고치지 않았다. 넓힌 줄 자체는 7.4 의 줄 단위 조사에서 실패하지 않는다.

### 막힐 지점

- main 이 움직이면 `scripts/smoke-test.js` 의 줄 번호가 밀린다: 주장은 줄 번호가 아니라 글자(옛 배선 글자가 든 호출)를 본다.
- 두 PR 의 병합 순서: 금고 PR(TASK-ES-623)의 게이트는 도우미 파일이 있을 때만 그것을 쓰고, 없으면 옛 글자만 본다. 어느 쪽이 먼저 병합돼도 main 의 `npm test` 가 깨지지 않는다(7절의 「게이트만」 측정).
- 다음에 열리는 것: 두 PR 이 병합되면 철거 계획에서 뺀 이름 39개를 철거 2차에 넣을 수 있다(그 PR 의 법정은 고친 시험지를 기준으로 채점한다).

### 성과 측정

- 완료 기준: (1) 현재 main 에서 `npm test` 종료 코드와 ✓ 줄 수가 고치기 전과 같다. (2) 모의 철거 사본에서 고치기 전 시험지로 실패하던 단언 57줄 가운데 이 PR 의 56줄이 고친 시험지로는 실패하지 않는다(남는 1줄은 짝 PR). (3) 대조군 다섯 변형이 기대한 줄만 실패한다. 값은 7절.
- 계획 완료 / 사용 가능 / 효과 확인 구분: 이 문서가 말하는 것은 **계획 완료**까지다. 「붙잡힌 이름 39개를 실제로 지운 철거 PR 이 법정을 지난다」(사용 가능)와 「돌려보냄·재작업이 줄었다」(효과 확인)는 **미확인**이다.
