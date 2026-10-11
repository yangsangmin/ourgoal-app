# REQ — 무결성 게이트의 옛 배선 글자 단언 한 줄을 「옛 배선 글자 또는 등록」으로 넓히기 (#TASK-ES-623 · 금고 변경)

- 작업번호: TASK-ES-623 · 종류: **금고 변경**(헌법 별표 3 의 `scripts/verify-integrity-gate.js` 한 파일 + 서류) · 짝 PR: TASK-ES-620(그 밖의 시험지와 공용 도우미)
- 작업참고: `C:/dev/agent-knowledge/WORK-REFERENCE.md` **기준 PR #890**(끝까지 읽음)
- 측정 기준: `origin/main` 4134955f(PR #895 병합 뒤). 그 뒤 main 이 움직여 push 전에 합쳤고, 합친 뒤의 빠른 재확인은 7.6절에 있다(어느 커밋에서 쟀는지는 그 절과 `post-merge.json` 의 `baseCommit`). main 과 함께 움직이는 수는 이 PR 이 가진 `reports/TASK-ES-623/` 의 측정 파일을 가리킨다.
- 이 문서는 작업 세션의 서류다. 효력·근거가 아니며, 아래 수치는 전부 **작업자 측정(판정 아님)** 이다. 판정은 GitHub 법정만 내고, 병합은 상민님이 하신다.

## 0. 요구 (상민님 원문 · 지시 항목)

### 상민님 원문 (글자 그대로)

1. 2026-10-11, 세션이 올린 결심 6묶음 표에 대한 답(지시함 DIR-004 「결심 기록」에 병합된 글자):
   「결심필요 4번 빼고 모두 권장안대로 진행하고 4번은 자세히 설명해봐 어떤 함수인지 어떤 기능을 하던건지 자세히, 어떻게 진행하는게 좋을지, 권장안이 뭔지」
   - 그 표의 2번 묶음은 「시험지가 옛 연결선 글자를 정답으로 붙잡음(최소 22종)」, 올린 권장은 「승인. 그 전까지 해당 이름은 지우지 않고 남겨 둡니다.」였다(`docs/architecture/CELL-REGISTRY-DESIGN.md` 8.1절).
2. 2026-10-11, 그 뒤(커맨드센터 세션 309dca5d 채팅):
   「1. 887 병합완료 2. 철거 2차 사전 승인, 금고 변경 승인 3. 함수 이전 사전 승인, 헌법 개정 승인 및 병합 사전 승인 4. 완료기록 병합 사전 승인」
   - 이 가운데 **「2. 철거 2차 사전 승인, 금고 변경 승인」** 이 이 PR 의 승인 문구다.
   - 이 문서를 쓴 빌더는 그 채팅을 직접 보지 못했다. 오케스트레이터(같은 세션 309dca5d)가 빌더 지시문에 옮겨 준 글자를 한 글자도 바꾸지 않고 옮겼다. 병합 때 상민님이 이 문장이 본인 말과 같은지 대조하실 수 있게 여기 적는다.
3. 2026-10-11, 이 작업 전체의 지시(지시함 DIR-004 「결심 기록」에 병합된 글자):
   「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」

### 이 승인으로 하는 것과 하지 않는 것

- 하는 것: 무결성 게이트의 검사 「[검증 15/15] [#TASK-ES-190] 목표 추가 파이프라인 및 4위 1체 전역 배선 검사」 안에서, 옛 연결선 글자 `window.promptNewGoal = promptNewGoal;` 을 찾던 **단언 한 줄**을 넓히는 것뿐이다.
- 하지 않는 것: 게이트의 다른 검사·다른 단언·검사 수(38개 그대로), 그 검사의 다른 줄(`window.showNewGoalManualForm = showNewGoalManualForm;` 은 등록되지 않은 이름이라 그대로 둔다), 법정 코드·헌법·지시함·제품 코드·생성기.
- 상민님이 하지 않은 말을 승인으로 적지 않았다.

### 지시 항목

| ID | 지시 항목 | 나온 곳 |
|---|---|---|
| R1 | 금고 파일 `scripts/verify-integrity-gate.js` 의 옛 배선 글자 단언 한 줄을 「그 글자가 있거나, 같은 이름·같은 값이 등록으로 window 에 나간다」로 넓힌다. 검사 수 그대로, 폐기 0. | 원문 2 「금고 변경 승인」 |
| R2 | 금고 변경은 금고만 담은 별도 PR 로 올린다(이 PR 의 변경 파일은 금고 파일 하나와 서류뿐). | 헌법 별표 3 · MERGE_GATE 3 |
| R3 | 짝 PR(TASK-ES-620)과 병합 순서가 바뀌어도 main 의 게이트가 죽거나 느슨해지지 않는다. | 경험칙 L048 |
| R4 | 고치기 전·후 측정을 싣는다(작업자 측정, 판정 아님). | 헌법 GUARD_05 |

- 원문에 있는데 이 PR 에 없는 것: 원문 3의 「병합도 스스로」는 이 PR 에 쓰지 않는다 — 금고 변경이라 위임 병합 대상이 아니다(헌법 MERGE_GATE 3).

### 구체 식별자

- 바꾼 파일: `scripts/verify-integrity-gate.js` — 머리의 `WIRING_HELPER` · `WIRING` · `windowExposed(source, legacyText)` 6줄 추가, 검사 「[검증 15/15] …」 안의 단언 1줄 변경
- 기대는 파일(짝 PR 이 들여온다): `tests/helpers/wiring-exposed.js` 의 `windowExposed(source, legacyText)`
- 읽기만 한 것: `js/tabs/goals/new-goal-modal.js` 끝의 등록 블록(`promptNewGoal: K.promptNewGoal`, `window: [… 'promptNewGoal']`) · `js/core/cell-registry.js` · `js/core/cell-registry-commit.js` · `court/README.md` · `court/vault.json`
- DOM: 해당 없음(화면 변경 0)

### 작업 유형 분류 (헌법 SNOWBALL)

**(나) 이탈.** 경험칙 L067(시험을 고치지 말고 철거 계획에서 빼라)에서 벗어난다. 사유 네 가지는 짝 PR 의 `docs/specs/REQ-TASK-ES-620-WIRING-TEXT-TESTS.md` 0절과 같다: ① L067·L021 ② 그 이름을 계속 빼 두면 지시함 DIR-004 의 완료 기준(인라인 IIFE 0)에 닿지 못한다 ③ 상민님 「금고 변경 승인」을 받아 단언을 넓혔다 ④ 단언 수 그대로이고 등록 갈래는 파서로 다섯 조건을 보며, 대조군으로 쟀다.

### 헌법 제4조 4.4 가 요구하는 세 가지

- ① 목적 변경의 승인 근거: 원문 2 「2. 철거 2차 사전 승인, 금고 변경 승인」.
- ② 고치기 전·후 기대값: 고치기 전 = `html.includes('window.promptNewGoal = promptNewGoal;')`. 고친 뒤 = 그 글자가 있거나, `promptNewGoal` 이 같은 값(`K.promptNewGoal`)으로 등록 기관을 거쳐 window 에 나간다(도우미의 다섯 조건). 도우미 파일이 없으면 고치기 전 식 그대로다.
- ③ 제품 변경과 구분한 표시: 이 PR 에 제품 변경이 없고 금고 파일 하나만 바꿨다. 바뀐 검사는 주장 파일 `retire` 에 검사 제목으로 사유를 적었다.

## 1. [원칙 ①] 문제를 정확히 파악한다

- 증상: 배선 철거가 `index.html` 의 `window.promptNewGoal = promptNewGoal;` 줄을 지우면 무결성 게이트의 검사 15/15 가 「window.promptNewGoal 전역 배선 누락」으로 실패한다.
- 측정: 배선을 전부 지운 저장소 밖 사본에서 게이트는 ✓ 37 · ✗ 1 이다(`reports/TASK-ES-623/measurement.json` `summary.compare.mockGateFailsBefore`). 짝 PR 의 시험지만 얹어도 이 한 줄은 그대로 남는다(`summary.compare.mockGateFailsAfter`).
- 이 한 줄 때문에 `promptNewGoal` 은 철거에서 계속 빠진다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- 본질: 이 단언이 지키려던 것은 글자가 아니라 「새 목표 창을 여는 `promptNewGoal` 이 window 에 노출된다」는 사실이다.
- 원인: 그때는 노출을 확인할 길이 `index.html` 의 배선 줄 글자뿐이었다. 지금은 세포 `js/tabs/goals/new-goal-modal.js` 가 등록 기관에 등록하고 기관이 인라인 IIFE 직전에 같은 값으로 내준다.
- 중심: 금고의 잣대를 지우거나 약하게 하지 않고, 노출의 두 길을 각각 진짜로 확인하게 하는 것.
- 핵심: 둘 다 없으면 반드시 실패하고, 짝 PR 과 병합 순서가 바뀌어도 게이트가 죽지 않는 것.

## 3. [원칙 ③] 해결 방식

- 게이트 머리에 `windowExposed(source, legacyText)` 를 둔다. 공용 도우미 `tests/helpers/wiring-exposed.js` 가 있으면 그 판정(옛 배선 글자 **또는** 등록 — 다섯 조건)을 쓰고, 없으면 `source.includes(legacyText)`(고치기 전 식)만 쓴다.
- 단언 한 줄을 `assert.ok(windowExposed(html, 'window.promptNewGoal = promptNewGoal;'), …)` 로 바꾼다. 옛 배선 글자는 줄에 그대로 남는다.
- 게이트는 이미 같은 폴더의 `tests/helpers/inline-bundle.js` 에 기댄다(19행). 새 기대도 같은 종류다.

## 4. [원칙 ④] 재검토 (반례·부작용)

- 반례 — 도우미 파일이 있는데 고장 났다: `require` 가 오류를 던져 게이트가 시끄럽게 실패한다(조용히 옛 식으로 내려가지 않는다 — 있는지만 보고 읽는다).
- 반례 — 등록이 사라졌다: 옛 글자도 없으면 실패한다(대조군).
- 부작용 — 금고 파일이 금고 밖 도우미(`tests/helpers/`)에 기댄다: 도우미를 바꾸면 게이트의 판정이 바뀔 수 있다. 법정은 `tests/**` 를 제품으로 분류해 주장 없이는 지나가지 못하게 하지만, 금고만큼 엄하지는 않다. 이 점은 숨기지 않고 PR 본문에 적는다(도우미를 금고 목록에 넣을지는 상민님 결정 사안이다 — 이 PR 은 금고 목록을 바꾸지 않는다).

## 5. [원칙 ⑤] 절차

1. 번호 선점(빈 가지 push) → 두 번째 작업 폴더(`origin/main` 기준, 짝 PR 과 다른 가지).
2. 게이트 편집(7줄 추가·1줄 변경) → 단독 실행.
3. 측정: 현재 main · 모의 철거 사본 × (게이트만 · 짝 PR 과 함께).
4. 대조군: 두 PR 을 얹은 모의 철거 사본에서 `js/tabs/goals/new-goal-modal.js` 의 등록을 깨뜨린다.
5. 서류 → `node scripts/verify-integrity-gate.js` → `npm test` → `node scripts/module-guard.js` → 마지막에 `npm test` 한 번 더.
6. 커밋(훅 우회 없음) → main 합치기 → push → PR. **병합하지 않는다.**

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- 반론 1 — 「도우미가 없을 때 옛 식으로 내려가는 갈래는 시험을 건너뛰는 길이 아닌가.」
  - 격파: 내려가는 식은 고치기 전 단언 그대로다(더 엄한 쪽). 건너뛰는 것이 아니라 넓히지 않을 뿐이다. 이 갈래가 없으면 이 PR 이 짝 PR 보다 먼저 병합됐을 때 main 의 게이트가 `require` 오류로 죽어 모든 작업의 `npm test` 가 막힌다(경험칙 L048 의 사고와 같은 꼴). 측정: 도우미 없는 현재 main 에서 게이트 ✓ 38 · ✗ 0, 도우미 없는 모의 철거 사본에서 ✓ 37 · ✗ 1(고치기 전과 같다).
- 반론 2 — 「한 줄이면 짝 PR 에 넣어도 된다.」
  - 격파: `scripts/verify-integrity-gate.js` 는 헌법 별표 3 의 금고다. `court/vault.json` 은 기준 시험지로 분류하지만 별표 3 은 둘이 다르면 넓은 쪽을 동결로 보라고 정한다. 금고 변경은 금고만 담은 PR 이어야 한다.
- 절차 재검증: 이 PR 만으로는 모의 철거 사본의 게이트가 통과하지 않는다(도우미가 없다). 두 PR 이 모두 병합된 뒤의 트리에서 통과한다 — 그것을 「둘 다 얹은」 트리로 쟀다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

전부 작업자 측정이며 판정이 아니다. 수는 `reports/TASK-ES-623/measurement.json` 에서 읽는다(측정 도구는 짝 PR 의 `reports/TASK-ES-620/*.cjs`).

서류를 다 쓴 뒤 `npm test` 를 전경으로 끝까지 돌린 원시 로그와 종료 코드는 `reports/TASK-ES-623/raw/npm-test.<이름>.log` · `.exit` 에 있다(`measurement.json` 의 `rawNpmTestLogs` 가 종료 코드와 줄 수를 옮겨 적었다).

### 7.1 바꾼 줄

- `reports/TASK-ES-623/changed-assertions.json` — 바꾼 줄 1(`scripts/verify-integrity-gate.js:728` → `:734` 이름 `promptNewGoal`) · 지우기만 한 줄 0 · 옛 배선 글자가 줄에 그대로 남음 true · 더한 줄 6(머리의 설명 주석 3줄 · `WIRING_HELPER` · `WIRING` · `windowExposed`).
- 고치기 전: `assert.ok(html.includes('window.promptNewGoal = promptNewGoal;'), 'window.promptNewGoal 전역 배선 누락');`
- 고친 뒤: `assert.ok(windowExposed(html, 'window.promptNewGoal = promptNewGoal;'), 'window.promptNewGoal 전역 배선 누락');`
- 검사 제목: 「[검증 15/15] [#TASK-ES-190] 목표 추가 파이프라인 및 4위 1체 전역 배선 검사」

### 7.2 종료 코드 · 검사 수 (시험을 있는 그대로 실행)

| 트리 · 시험지 | `npm test` 종료 코드 | ✓ 줄 | ok 줄 | smoke-test(종료 · ✓ · ✗) | 무결성 게이트(종료 · ✓ · ✗) | 시험 파일(종료 0 / 전체) |
|---|--:|--:|--:|---|---|---|
| 현재 main · 고치기 전 | 0 | 487 | 156 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 | 87 / 113 |
| 현재 main · 고친 게이트만(이 PR, 도우미 없음) | 0 | 487 | 156 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 | 돌리지 않음 |
| 모의 철거 사본 · 고치기 전 | 1 | 414 | 0 | 1 · ✓ 414 · ✗ 25 | 1 · ✓ 37 · ✗ 1 | 77 / 113 |
| 모의 철거 사본 · 고친 게이트만(이 PR, 도우미 없음) | 1 | 414 | 0 | 1 · ✓ 414 · ✗ 25 | 1 · ✓ 37 · ✗ 1 | 돌리지 않음 |
| 모의 철거 사본 · 짝 PR 만 | 1 | 476 | 0 | 0 · ✓ 439 · ✗ 0 | 1 · ✓ 37 · ✗ 1 | 88 / 114 |
| 현재 main · 이 PR + 짝 PR | 0 | 487 | 172 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 | 88 / 114 |
| 모의 철거 사본 · 이 PR + 짝 PR | 0 | 487 | 172 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 | 88 / 114 |

- 이 PR 만(도우미 없음): 현재 main 에서 `npm test` 종료 코드 0, 게이트 ✓ 38 · ✗ 0. 모의 철거 사본에서 게이트 ✓ 37 · ✗ 1(고치기 전 ✗ 1 와 같은 판정 — 넓히지 않았을 뿐 느슨해지지 않았다).
- 두 PR 을 다 얹으면: 모의 철거 사본에서 게이트 ✓ 38 · ✗ 0, `npm test` 종료 코드 0, ✓ 줄 487(현재 main 487). 줄 단위 재조사에서 모의 철거 사본에서만 실패하는 단언 0줄.
- 「모의 철거 사본 · 짝 PR 만」 행은 이 PR 이 왜 필요한지를 보인다: 짝 PR 만으로는 게이트 ✗ 1 이 남는다.

### 7.3 대조군 (`reports/TASK-ES-620/control-group.cjs` → `reports/TASK-ES-623/control-group.json`)

두 PR 을 얹은 모의 철거 사본의 복사본에서 `js/tabs/goals/new-goal-modal.js` 의 등록을 깨뜨리고 게이트의 그 단언이 실패하는지 본다.

| 변형 | 무엇을 깨뜨렸나 | 새로 실패한 줄 | 기대한 줄 | 줄 일치 |
|---|---|--:|--:|---|
| V1 | js/tabs/goals/new-goal-modal.js 의 등록 블록을 통째로 지움 | 1 | 1 | true |
| V2 | 등록 블록의 window 목록에서 promptNewGoal 만 뺌(값·windowOnly 는 남김) | 1 | 1 | true |
| V3 | index.html 에서 js/tabs/goals/new-goal-modal.js 의 <script src> 태그를 뺌 | 1 | 1 | true |
| V4 | js/tabs/goals/new-goal-modal.js 가 키트에 promptNewGoal 를 다는 줄(K.promptNewGoal = promptNewGoal;)을 지움 | 1 | 1 | true |
| V5 | index.html 에서 commit 태그(js/core/cell-registry-commit.js)를 뺌 | 1 | 1 | true |

- 다섯 변형 모두 기대와 같음: true.

### 7.4 법정의 격리 실행 함수로 재실행 (작업자 PC 에서 부른 것, 판정 아님)

| 트리 · 시험지 | 결과(시험지가 직접 찍은 줄만) |
|---|---|
| 현재 main · 고치기 전 | smoke-test.js ✓ 436 · ✗ 3 / verify-integrity-gate.js ✓ 38 · ✗ 0 |
| 모의 철거 사본 · 고치기 전 | smoke-test.js ✓ 411 · ✗ 28 / verify-integrity-gate.js ✓ 37 · ✗ 1 |
| 현재 main · 이 PR + 짝 PR | smoke-test.js ✓ 436 · ✗ 3 / verify-integrity-gate.js ✓ 38 · ✗ 0 |
| 모의 철거 사본 · 이 PR + 짝 PR | smoke-test.js ✓ 436 · ✗ 3 / verify-integrity-gate.js ✓ 38 · ✗ 0 |

### 7.5 바뀐 파일의 범위 (`measurement.json` `changedScope`)

- 금고·법정·헌법·지시함·생성기: `scripts/verify-integrity-gate.js` · 제품: 0개 · 그 밖의 시험 파일: 0개(문서·기록 파일 목록은 같은 칸의 docsAndReports).

### 7.6 origin/main 을 합친 뒤의 빠른 재확인 (`reports/TASK-ES-623/post-merge.json`)

위 측정을 마친 뒤 main 이 움직였다(공용 키트 배선 철거 PR 등 — `index.html` 이 바뀜). 합친 뒤의 main `1ab4bc0b` 에서 같은 도구로 다시 쟀다. 그대로 실행은 `npm test` 경로만, 줄 단위 조사는 `npm test` 경로 스크립트와 바꾼 시험 파일만 돌렸다(전수 조사는 짝 PR 의 REQ 7.1 — 합친 뒤에는 다시 하지 않았다).

- 모의 철거(합친 뒤 main 기준): `index.html` 5753줄 → 5257줄, 등록됐는데 배선이 남은 이름 0, 생성기 정지로 뺀 이름 0.

| 트리 · 시험지 | `npm test` 종료 코드 | ✓ 줄 | ok 줄 | smoke-test(종료 · ✓ · ✗) | 무결성 게이트(종료 · ✓ · ✗) |
|---|--:|--:|--:|---|---|
| 합친 뒤 main · 고치기 전 | 0 | 487 | 156 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 |
| 합친 뒤 main · 고친 게이트만(이 PR) | 0 | 487 | 156 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 |
| 모의 철거 사본 · 고치기 전 | 1 | 414 | 0 | 1 · ✓ 414 · ✗ 25 | 1 · ✓ 37 · ✗ 1 |
| 모의 철거 사본 · 짝 PR 만 | 1 | 476 | 0 | 0 · ✓ 439 · ✗ 0 | 1 · ✓ 37 · ✗ 1 |
| 합친 뒤 main · 두 PR | 0 | 487 | 172 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 |
| 모의 철거 사본 · 두 PR | 0 | 487 | 172 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 |

- 줄 단위: 고치기 전 시험지로 모의 철거 사본에서만 실패하는 단언 57줄 → 짝 PR 의 시험지만으로 1줄 → 두 PR 을 다 얹으면 0줄.
- 합친 뒤 이 PR 이 바꾼 파일의 범위(`changedScope`, 기준 = 합친 main): 제품 0개 · 금고·법정·헌법·지시함·생성기 `scripts/verify-integrity-gate.js` · 시험 파일 0개.
- 합친 뒤 마지막 `npm test` 전경 실행의 원시 로그: `reports/TASK-ES-623/raw/post-merge/` (`post-merge.json` 의 `rawNpmTestLogs`).

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

### 법정 판정 예상 (예상이지 판정이 아니다)

- 법정(`court/vault.json`)은 이 파일을 기준 시험지로 분류한다. 제품 변경이 없으므로 화면 점검은 건너뛰고, 바뀐 단언 줄을 `retire` 의 사유와 맞춘다. `court/probes/base-tests.js` 의 분류 함수로는 이 검사가 「글자가 있는지만 보던 검사」로 읽힌다(작업자 PC 에서 돌린 값). 그러면 판정서에 「기존 글자 검사 수정」 알림이 실리고 판정은 「통과」 또는 「확인 부족」이 될 것으로 예상한다.
- **법정이 「통과」를 내더라도 이 PR 은 세션이 병합하지 않는다.** 헌법 별표 3 의 금고 변경이고(넓은 쪽), MERGE_GATE 3 에 따라 상민님의 「금고 변경 승인」과 상민님 병합이 필요하다.

### `court/README.md` 와 지시가 달랐던 점

- 지시문은 이 파일을 금고라고 했고, `court/README.md` 5절·`court/vault.json` 은 「테스트 파일 — 고칠 수 있다」로 분류한다. 헌법 별표 3 의 넓은 쪽 규칙에 따라 금고로 다뤘다. 법정 판정서에는 「채점 기준(금고) 변경」 표시가 나오지 않을 수 있다.

### 막힐 지점

- 병합 순서: 어느 쪽이 먼저여도 main 의 `npm test` 는 깨지지 않는다(3절). 다만 붙잡힌 이름을 실제로 지우는 철거 2차는 두 PR 이 모두 병합된 뒤여야 한다.
- 다음에 열리는 것: 두 PR 병합 뒤 `promptNewGoal` 을 포함한 붙잡힌 이름 39개를 철거 계획에 넣을 수 있다.

### 성과 측정

- 완료 기준: (1) 현재 main 에서 게이트 ✓ 38 · ✗ 0, `npm test` 종료 코드가 고치기 전과 같다. (2) 두 PR 을 얹은 모의 철거 사본에서 게이트 ✓ 38 · ✗ 0. (3) 대조군에서 등록을 깨뜨리면 이 단언이 실패한다. 값은 7절.
- 이 문서가 말하는 것은 **계획 완료**까지다. 「`promptNewGoal` 배선을 실제로 지운 철거 PR 이 법정을 지난다」(사용 가능)와 「재작업이 줄었다」(효과 확인)는 **미확인**이다.
