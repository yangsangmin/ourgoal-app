# REQ — 모듈 가드 ⑤ 의 「인라인 소유」 규칙을 부팅 파일·js/core 기관까지 넓히기 (#TASK-ES-667)

- 작업번호: TASK-ES-667 · 종류: **FIX**(모듈 측정기 `scripts/module-metrics.js` 와 그 시험 — 앱 코드 `index.html` · `js/**` 변경 0)
- 묶음: 같은 승인으로 나눈 PR 네 개 — TASK-ES-666(시험지·기준 시험지·공용 도우미) · TASK-ES-667(모듈 측정기 ⑤ 규칙) · TASK-ES-668(도구 다섯 개) · TASK-ES-669(금고: 무결성 게이트 한 줄). 책임 단위로 나눴고 어느 순서로 병합돼도 main 의 `npm test` 가 깨지지 않게 했다(아래 4절·6절).
- 작업참고: `C:/dev/agent-knowledge/WORK-REFERENCE.md` **기준 PR #941**(끝까지 읽음 — 이 작업에 쓴 경험칙: L021 · L023 · L048 · L067 · L085 · L110).
- 측정 기준: `origin/main` 42b5511f — 이 가지에 그 커밋을 합친 뒤 측정 한 벌을 전부 다시 돌린 값이다(앞선 기준 커밋에서 잰 값은 싣지 않았다). main 과 함께 움직이는 수는 이 PR 이 가진 `reports/TASK-ES-667/measurement.json` 을 가리킨다(`baseCommit` 칸이 잰 커밋이다).
- 이 문서는 작업 세션의 서류다. 효력·근거가 아니며, 아래 수치는 전부 **작업자 측정(판정 아님)** 이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (상민님 원문 · 지시 항목)

### 상민님 원문 (글자 그대로)

1. 2026-10-11, 커맨드센터 세션 309dca5d 채팅 — 오케스트레이터가 올린 [결심 필요] 가운데 이 작업의 항목(오케스트레이터의 글자다. 상민님 말이 아니다):
   「결심 1 — 덩어리 안 글자를 정답으로 붙잡는 시험·가드 넓히기(『금고 변경 승인』 필요): 시험 일부가 "index.html 덩어리 안에 이 글자가 있어야 한다"를 검사한다. 덩어리를 비우면 깨진다(덩어리를 통째로 뺀 모의본에서 시험·가드 14개와 도구 5개가 반응). 예: 주석 글자 하나(filterHarmfulWords), 메모 선언 글자 하나(_promptEncyclopediaOpen, 금고 파일인 무결성 게이트), 모듈 가드의 "인라인 소유" 규칙, smoke-test 의 일부 단언. 하려는 것: 단언을 지우지 않고 "덩어리에 있거나, 옮겨 간 세포 파일에 있다"로 넓힌다. 검사 수는 그대로, 넓힌 단언이 가짜 통과가 아님을 대조군으로 보인다.」
2. 그에 대한 상민님 답 원문:
   「결심 1 : 승인, 금고 변경 승인, 결심 2 : 승인」
   - 이 가운데 **「결심 1 : 승인, 금고 변경 승인」** 이 이 PR 의 승인 문구다.
   - 이 문서를 쓴 빌더는 그 채팅을 직접 보지 못했다. 오케스트레이터(같은 세션 309dca5d)가 빌더 지시문에 옮겨 준 글자를 한 글자도 바꾸지 않고 옮겼다. 병합 전에 이 문장이 상민님 말과 같은지 대조할 수 있게 여기 적는다.
3. 승인 범위(오케스트레이터 지시문 그대로): 덩어리(IIFE) 안에 글자가 있어야 한다고 붙잡는 단언·가드 규칙을 「덩어리에 있거나 옮겨 간 자리에 있다」로 넓히는 것과, IIFE 가 없을 때 오류로 죽는 도구가 「없음 = 0」으로 처리하게 하는 것. 다른 기대값·다른 검사·법정(court/**) 코드에는 이 승인을 쓰지 않는다.
4. 병합: 상민님 2026-10-11 승인(금고 변경 승인)에 따라 오케스트레이터 세션이 판정 확인 뒤 병합한다. 이 문서를 쓴 작업 세션(빌더)은 병합하지 않는다.

- 상민님이 하지 않은 말을 승인으로 적지 않았다. 위 1번은 오케스트레이터가 올린 글자이고, 상민님 말은 2번 한 줄뿐이다.

### 이 승인으로 하는 것과 하지 않는 것

- 하는 것: 승인 항목의 「모듈 가드의 "인라인 소유" 규칙」 — 측정기 ⑤ 의 주인 판정에 「기관이 무조건 다는 이름」을 더하고, 그 시험에 사례를 더한다.
- 하지 않는 것: 기준선(`docs/architecture/module-baseline.json`) 변경 · 가드(`scripts/module-guard.js`)의 비교 로직 변경 · ①~④ 의 셈 변경 · 기존 시험 단언 변경 · 앱 코드·법정·헌법·지시함 변경.

### 지시 항목

| ID | 지시 항목 | 나온 곳 |
|---|---|---|
| R1 | 모듈 측정기(scripts/module-metrics.js)의 ⑤ 탭 간 직접 참조에서 「index.html 인라인이 window 에 다는 이름은 인라인이 주인」이던 규칙을 「부팅 파일(js/app/boot.js)과 js/core 기관 파일이 무조건 다는 이름도 같은 지위」로 넓힌다(상민님 「결심 1 : 승인, 금고 변경 승인」). | 오케스트레이터 지시문(승인: 원문 2) |
| R2 | 지표가 거짓으로 좋아지지 않게 한다 — 진짜 탭 간 참조는 여전히 잡힌다. 오탐 사례와 진짜 사례를 함께 고정하는 시험을 더한다(경험칙 L023). 기존 단언은 바꾸지 않는다. | 오케스트레이터 지시문(승인: 원문 2) |
| R3 | 현재 main 의 지표(①~⑤)는 고치기 전과 같다. | 오케스트레이터 지시문(승인: 원문 2) |
| R4 | 고치기 전·후 측정과 대조군을 싣는다(작업자 측정, 판정 아님). | 오케스트레이터 지시문(승인: 원문 2) |

- 원문에 있는데 이 PR 에 없는 것: 시험 단언·금고 게이트·도구는 TASK-ES-666 · 669 · 668 에 있다.

### 구체 식별자

- 바꾼 파일: `scripts/module-metrics.js` — 새 함수 `stripJsComments(text)` · `organWindowSymbols(root)`, `crossTabRefs(root)` 안의 걸러 내기 한 줄, 내보내기 두 이름 / `tests/cross-tab-inline-owned-es507.test.js` — 검사 8개 추가(기존 5개 그대로) / `scripts/test-shipyard-modular.js` — 그 시험 파일을 부르는 `runNode` 한 줄 추가(지운 줄 0. 고치기 전에는 단독 실행 파일이라 `npm test` 가 돌리지 않았다)
- 읽기만 한 것: `scripts/module-guard.js` · `tests/cross-tab-guarded-init-es502.test.js` · `tests/module-guard.test.js` · `tests/new-module.test.js` · `js/core/boot-finish.js` · `js/core/boot-home-wiring.js` · `js/tabs/goals/team-goals-screen.js` · `js/tabs/comm/shared-groups.js`
- DOM: 해당 없음(화면 변경 0)

### 작업 유형 분류 (헌법 SNOWBALL)

**(가) 표준 — 「측정기 오탐 고치기 + 오탐·진짜 사례 고정」.** 선례 #TASK-ES-502(방어 초기화는 정의가 아니다) · #TASK-ES-507(인라인이 주인). 같은 방식이다: 규칙 한 갈래를 더하고, 오탐이 0 이 되는 사례와 진짜가 여전히 잡히는 사례를 임시 폴더 시험으로 고정한다(L023). 가드 규칙을 바꾸는 일이라 승인을 받았다(설계 문서 9.1 「승인 사안」).

### 헌법 제4조 4.4 가 요구하는 세 가지

- ① 목적 변경의 승인 근거: 원문 2 「결심 1 : 승인, 금고 변경 승인」.
- ② 고치기 전·후 기대값: 고치기 전 = 탭이 무조건 다는 window 이름 가운데 **인라인이 다는 이름**만 그 탭의 정의에서 뺀다. 고친 뒤 = **인라인이 다는 이름 또는 부팅 파일·js/core 기관이 무조건 다는 이름**을 뺀다. 그 밖의 셈(탭 키트 이름 `Ourgoal<탭>…` · 탭 경로 · 블록 id · 방어 초기화)은 그대로다.
- ③ 제품 변경과 구분한 표시: 앱 코드 변경 0(`changedScope.appCode` = []). 기준 시험지는 `scripts/test-shipyard-modular.js` 에 `runNode` 한 줄을 **더하기만** 했다(바뀌거나 지워진 단언 0 — `retire` 없음). 고친 것은 측정기와 그 시험(추가만)이다.

## 1. [원칙 ①] 문제를 정확히 파악한다

- 증상: 덩어리(IIFE)를 비운 모의본에서 모듈 가드가 「⑤ 탭 간 직접 참조 0 → 1」로 실패한다. 걸리는 곳은 `js/tabs/goals/team-goals-screen.js` 가 `window.SHARED_GROUPS_LOADED` 를 읽는 줄이다.
- 그 이름은 인라인 IIFE 가 `window.SHARED_GROUPS_LOADED = false` 로 만들고 comm 세포가 불러온 뒤 `true` 로 바꿔 쓴다. 지금은 「인라인이 주인」 규칙(#TASK-ES-507)이 comm 의 정의로 보지 않게 해 준다. 만드는 줄이 `js/core` 구역 세포나 `js/app/boot.js` 로 옮겨 가면 그 규칙이 듣지 않아, 코드가 한 일은 같은데 지표만 나빠진다(오탐).
- 측정: ⑤ 는 현재 main 0 · 모의본 (가) 1 · 모의본 (나) 1(`reports/TASK-ES-667/measurement.json` `summary.metrics.crossTabRefs`).
- 같은 일이 이미 한 번 있었다: 구역 이전(#933)으로 `window.selectedGoalSmartTag` · `window.currentGoalStatPeriod` 의 첫 대입이 `js/core/boot-home-wiring.js` 로 갔다. 두 이름은 goals 세포가 바꿔 쓴다. 지금은 다른 탭이 읽지 않아 ⑤ 가 0 이지만, 인라인에 있을 때 받던 보호가 이미 빠진 상태다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- 본질: ⑤ 가 재려는 것은 「탭 A 가 탭 B 의 것을 직접 읽는가」다. 탭 밖의 공용 주인(시동 코드)이 만든 이름을 탭이 바꿔 쓰는 것은 탭의 정의가 아니다.
- 원인: 「탭 밖의 주인」을 index.html 인라인 스크립트 한 곳으로만 알아봤다. 시동 코드가 `js/core` 구역 세포와 부팅 파일로 옮겨 가는데 규칙은 따라가지 않았다.
- 중심: 주인의 자리를 「인라인 또는 부팅 파일·js/core 기관」으로 넓히되, 기관이 **무조건 만드는** 이름만 주인으로 세는 것.
- 핵심: 진짜 사례(기관이 읽기만 한다 · 없으면 채우기만 한다 · 기관이 아닌 파일이 단다 · 기관에 없는 새 전역)는 여전히 잡히고, 현재 main 의 지표는 한 칸도 달라지지 않는 것.

## 3. [원칙 ③] 해결 방식

- `organWindowSymbols(root)`: `js/core` **바로 아래** `.js` 파일과 `js/app/boot.js` 에서 `window·global·globalThis.X =` 대입의 이름을 모은다. 주석은 걷어 낸 뒤 본다(`stripJsComments` — 줄 끝·줄 중간 주석 포함, 문자열은 그대로). 방어 초기화 두 꼴(`if(!window.X) window.X = …` · `window.X = window.X || …` — 기존 `isGuardedInit`)은 **세지 않는다**: 없으면 채우는 것은 만든 것이 아니다.
- `crossTabRefs(root)`: 탭이 무조건 다는 이름에서 빼는 집합을 `inlineOwned` 에서 `inlineOwned ∪ organOwned` 로 바꾼다(한 줄).
- 인라인 규칙(`inlineWindowSymbols`)은 건드리지 않았다(인라인은 어느 꼴이든 주인 — #TASK-ES-507 그대로). 기관 쪽만 더 엄하게(무조건 대입만) 잡았다.
- 범위를 좁힌 까닭: `js/` 바로 아래 옛 파일 · `js/core` 하위 폴더 · `js/app` 의 다른 파일 · 탭 파일은 주인으로 세지 않는다. 시동 코드가 가는 자리는 생성기의 구역 세포(`js/core/boot-*.js`)와 finalize 의 `js/app/boot.js` 뿐이다(설계 3.4 · 5.8).
- 시험 추가(`tests/cross-tab-inline-owned-es507.test.js`, 임시 폴더에 가짜 트리를 만들어 실제 `crossTabRefs` 를 돌린다): 모으기 1 · 오탐 2(구역 세포 · 부팅 파일) · 대조 1(그 줄을 지우면 1건) · 진짜 4(읽기만·방어 초기화·주석만 / 기관 아닌 파일 / 기관에 없는 새 전역 / 탭 키트 이름).

## 4. [원칙 ④] 재검토 (반례·부작용)

- 반례 — 「기관 파일에 `window.X = …` 한 줄만 넣으면 어떤 탭 간 참조도 숨길 수 있지 않은가」: 그렇다. 인라인 규칙도 같은 성질이다(인라인에 한 줄을 넣으면 숨는다). `js/core` 는 법정이 제품으로 채점하는 코드이고 그 줄은 실제로 그 전역을 만든다 — 숨기려고 넣는 줄은 동작을 바꾸므로 보존 검사·심사에서 드러난다. 그래도 문이 넓어진 것은 사실이라 적어 둔다.
- 반례 — 「기관이 남의 전역을 덮어쓰는 경우도 주인으로 세는가」: 무조건 대입이면 센다. 탭이 만든 전역을 기관이 무조건 덮어쓰는 코드는 지금 저장소에 없다. 현재 main 에서 「탭도 무조건 달고 기관도 무조건 다는 이름」은 `selectedGoalSmartTag` · `currentGoalStatPeriod` 둘이며, 둘 다 구역 이전(#933)으로 인라인에서 `js/core/boot-home-wiring.js` 로 간 첫 대입이다(1절).
- 반례 — 주석 속 글자: `/* window.X = false; */` 나 줄 끝 주석을 주인으로 세면 안 된다. `stripJsComments` 로 걷어 낸다(시험에 고정). 정규식 리터럴 안의 `//` 를 주석으로 잘못 보면 그 줄의 뒷부분이 지워질 뿐이라 주인이 줄어드는 쪽(더 엄한 쪽)으로만 틀린다.
- 부작용 — 현재 main: 기관이 무조건 다는 이름 32개가 새로 주인이 된다. ⑤ 는 0 → 0, 래칫 다섯 칸 전부 같음(`summary.metrics.mainSame` = true).

## 5. [원칙 ⑤] 절차

1. 번호 선점(빈 가지 push) → `origin/main` 기준 새 작업 폴더.
2. 측정기·가드·시험 넷(`es502` · `es507` · `module-guard.test` · `new-module.test`)을 읽고 ⑤ 가 모의본에서 왜 1 이 되는지 확인.
3. 규칙 추가(무조건 대입만) → 시험에 오탐·진짜 사례 추가 → 현재 main 지표 비교.
4. 모의본 (가)(나)에서 ⑤ 와 가드의 실패 사유 비교 → 대조군(기관 줄을 지우기 · 방어 초기화로 바꾸기 · 기관 아닌 파일로 옮기기).
5. 서류 → `node scripts/verify-integrity-gate.js` → `npm test` → `node scripts/module-guard.js` → 서류 뒤 `npm test` 한 번 더.
6. 커밋(훅 우회 없음) → push 직전 main 합치고 다시 잼 → push 한 번 → PR. **병합하지 않는다.**

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- 반론 1 — 「가드를 느슨하게 해서 통과시키는 것 아닌가(재는 자가 잣대를 고친다).」
  - 격파: 기준선은 건드리지 않았다(⑤ 기준선 0 그대로). 바꾼 것은 「무엇을 탭의 정의로 보는가」의 한 갈래이고, 코드가 한 일이 같은데(같은 줄이 자리만 옮김) 지표가 달라지던 것을 바로잡은 것이다. 진짜 사례 네 종류가 여전히 잡히는 것을 시험에 고정했고, 모의본 대조군에서 기관 줄을 지우거나 방어 초기화로 바꾸거나 기관 아닌 파일로 옮기면 ⑤ 가 다시 1 이 되어 가드와 그 시험이 실패한다(3개 변형 전부 기대대로 true).
- 반론 2 — 「모의본에서 가드가 여전히 실패하지 않는가.」
  - 격파: 남는 사유는 모의본의 한계(새 파일에 신고서 없음)뿐이다. 그것을 모의본 안에서 걷어 내면, 고치기 전에는 가드가 ⑤ 한 가지로 실패하고(사유 1건) 고친 뒤에는 통과한다(종료 코드 0).
- 절차 재검증: 가짜 계산 없이 실제 `crossTabRefs` · 실제 가드 CLI 를 돌렸다. 시험의 가짜 트리는 임시 폴더에만 만든다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

전부 작업자 측정이며 판정이 아니다. 수는 `reports/TASK-ES-667/measurement.json` 에서 읽는다(측정 도구는 TASK-ES-666 의 `reports/TASK-ES-666/tools/*.cjs` · `reports/TASK-ES-620/*.cjs`).

### 7.1 모듈 지표 (`scripts/module-metrics.js` 의 래칫 다섯 칸)

| 트리 | ① 인라인 줄 | ② 함수 선언 | ③ window 대입 | ④ 800줄 초과 | ⑤ 탭 간 참조 | 가드 종료 코드 |
|---|--:|--:|--:|--:|--:|--:|
| 현재 main · 고치기 전 | 1896 | 22 | 75 | 0 | 0 | 0 |
| 현재 main · 이 PR(667) | 1896 | 22 | 75 | 0 | 0 | 0 |
| 현재 main · 네 PR | 1896 | 22 | 75 | 0 | 0 | 0 |
| (가) · 고치기 전 | 22 | 1 | 75 | 1 | 1 | 1 |
| (가) · 네 PR | 22 | 1 | 75 | 1 | 0 | 1 |
| (나) · 고치기 전 | 22 | 1 | 74 | 0 | 1 | 1 |
| (나) · 이 PR(667)만 | 22 | 1 | 74 | 0 | 0 | 1 |
| (나) · 네 PR | 22 | 1 | 74 | 0 | 0 | 1 |

- 현재 main: 다섯 칸 전부 같음(true) · 가드 종료 코드 0 → 0.
- 모의본의 가드 종료 코드가 고친 뒤에도 0 이 아닌 것은 흉내의 한계 때문이다((나)는 새 파일에 신고서가 없어서, (가)는 그에 더해 IIFE 를 통째로 담은 파일이 800줄을 넘어서). 사유 줄: (나) 고치기 전 5건(⑤ 포함) → (나) 이 PR 만 4건(⑤ 없음 — `measurement.json` `guard.afterB667.failures`).
- 현재 main 에서 기관이 무조건 다는 이름 32개: `MANITO_STAMP_COOLDOWN` · `MOCK_GROUPS` · `OURGOAL_CONFIG` · `OurgoalAppScope` · `OurgoalAppState` · `OurgoalBlockRegistry` · `OurgoalCapabilities` · `OurgoalCellRegistry` · `OurgoalEventBus` · `OurgoalEvents` · `OurgoalRegistry` · `OurgoalSlots` · `OurgoalStateStore` · `OurgoalStore` · `OurgoalUiHelpers` · `THEMES` · `_dateRolloverInterval` · `_homeDateOffset` · `_modalOpenAt` · `_schedReminderPoller` · `_subtabTplDomain` · `_subtabTplType` · `checkAndHandleDateRollover` · `currentGoalStatPeriod` · `handleGoalFastAddSubmit` · `renderTeamGoalsScreen` · `selectSmartTag` · `selectedGoalSmartTag` · `setupDateRolloverWatcher` · `startScheduleReminderPoller` · `state` · `switchTab`.

### 7.2 흉내의 한계를 걷어 낸 (나) (`reports/TASK-ES-666/tools/relax-mock-limits.cjs`)

모의본 안에서만: 새 파일의 신고서를 쓴다(`module-specs.js --write`). 800줄을 넘는 새 파일이 있을 때만 기준선 이력 끝에 사유를 단 판을 더해 **④ 칸만** 잰 값으로 맞춘다. ⑤ 기준선은 0 그대로다.

| 트리 | ⑤ 잰 값 | ⑤ 기준선 | 가드 종료 코드 | 남은 실패 사유 |
|---|--:|--:|--:|---|
| (나) · 고치기 전 | 1 | 0 | 1 | ⑤ 탭 간 직접 참조 수: 0 → 1 (+1) — 늘었다 |
| (나) · 네 PR | 0 | 0 | 0 | 없음 |
| (나) + 등록 흉내 · 네 PR | 0 | 0 | 0 | 없음 |

### 7.3 단언 줄 — 모의본에서만 깨지는 줄

| 모의본 | 고치기 전(모의본에서만 깨지는 단언 줄) | 네 PR 을 얹은 뒤 | 남은 것 |
|---|--:|--:|---|
| (가) IIFE 를 통째로 `js/app/boot.js` 로 뺀 것(662 도구) | 40 | 31 | 글자가 `js/app/boot.js` 한 파일에 통째로 있어 합본이 읽지 않는다(실제 finalize 의 꼴이 아니다 — 줄 목록 `measurement.json` `mock.A.afterAll.list`) |
| (나) 남은 줄이 각자 갈 곳으로 간 꼴(`reports/TASK-ES-666/tools/make-final-mock.cjs`) | 14 | 4 | `scripts/test-shipyard-modular.js:150` scripts/module-guard.js must pass (exit 1) · `tests/module-guard.test.js:61` 가드가 통과해야 한다 · `tests/module-guard.test.js:62` The expression evaluated to a falsy value · `tests/new-module.test.js:65` 새 세포를 더해도 모듈 가드 통과 |
| (나) + `saveGoogleToken` 등록 흉내 | – | 4 | `scripts/test-shipyard-modular.js:150` scripts/module-guard.js must pass (exit 1) · `tests/module-guard.test.js:61` 가드가 통과해야 한다 · `tests/module-guard.test.js:62` The expression evaluated to a falsy value · `tests/new-module.test.js:65` 새 세포를 더해도 모듈 가드 통과 |
| (나)에서 흉내의 한계(새 세포 파일에 신고서 없음)를 걷어 낸 것 | 14 | 0 | 없음 |
| (나) + 등록 흉내 + 한계 걷어 냄 | – | 0 | 없음 |

- 「등록 흉내」(`--register saveGoogleToken`)는 이 기준 커밋에서는 아무것도 바꾸지 않는다 — 그 이름은 등록 2차(#940)로 이미 등록 기관에 등록돼 있다(모의본 도구 기록: 「이미 등록 블록이 있다(이 도구는 새 블록만 단다)」). 그래서 「등록 흉내」가 붙은 줄은 붙지 않은 줄과 같다.
- PR 하나만 얹었을 때 (나)에서만 깨지는 줄(「기준 + 그 PR」 과 「(나) + 그 PR」 을 맞댐): 666 만 7줄 · 667 만 12줄 · 669 만 14줄(고치기 전 14줄). 넷을 다 얹어야 위 표의 수가 된다.
- 이 PR 이 푸는 줄: `tests/cross-tab-guarded-init-es502.test.js` · `tests/cross-tab-inline-owned-es507.test.js` 의 「지금 저장소 ⑤ 0」 단언, 그리고 가드 종료 코드를 보는 줄들(`scripts/test-shipyard-modular.js` · `tests/module-guard.test.js` · `tests/new-module.test.js` — 이 셋은 한계를 걷어 내야 0 이 된다).

### 7.4 현재 main — 종료 코드 · 검사 수

| 트리 | `npm test` 종료 코드 | ✓ 줄 | ok 줄 | smoke-test(종료 · ✓ · ✗) | 무결성 게이트(종료 · ✓ · ✗) | 조선소 시험(종료 · ok 줄) | 시험 파일(종료 0 / 전체) |
|---|--:|--:|--:|---|---|---|---|
| 현재 main · 고치기 전 | 0 | 487 | 172 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 | 0 · ok 172 | 88 / 114 |
| 현재 main · 이 PR(667) | 0 | 487 | 185 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 | 0 · ok 185 | 88 / 114 |
| 현재 main · 네 PR | 0 | 487 | 185 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 | 0 · ok 185 | 89 / 115 |

- 줄 단위: 이 PR 을 얹으면 새로 실패하는 단언 0줄. ok 줄 172 → 185(`tests/cross-tab-inline-owned-es507.test.js` 의 검사 13개 — 기존 5 + 더한 8 — 가 `npm test` 경로에서 돌게 됐다. 고치기 전에는 단독 실행 파일이었다. 그래서 늘어난 ok 줄은 13 이다).

### 7.5 대조군 (`reports/TASK-ES-666/tools/control-group.cjs` → `reports/TASK-ES-667/control-group.json`)

네 PR 을 얹고 한계를 걷어 낸 (나)+등록 트리에서 구역 세포(모의)의 `window.SHARED_GROUPS_LOADED = false` 줄을 깨뜨리고, 가드와 그 시험의 단언 줄이 새로 실패하는지 본다.

| 변형 | PR | 무엇을 깨뜨렸나 | 새로 실패한 줄 | 기대한 줄 | 기대대로 |
|---|---|---|--:|--:|---|
| M1 | 667 | 구역 세포(모의)에서 기관이 window 에 다는 줄 window.SHARED_GROUPS_LOADED = false 를 지움(기관이 주인이 아니게 됨 → ⑤ 가 다시 1) | 6 | 6 | true |
| M2 | 667 | 그 줄을 방어 초기화 꼴(if(!window.X) window.X = false)로 바꿈 — 없으면 채우기는 주인이 아니다(⑤ 가 다시 1) | 6 | 6 | true |
| M3 | 667 | 그 줄을 js/core 밖의 옛 파일(js/zz-control-legacy.js)로 옮김 — 기관이 아닌 파일이 다는 이름은 주인이 아니다(⑤ 가 다시 1) | 6 | 6 | true |

- 전부 기대대로: true. 끝난 뒤 트리가 처음과 같음: true.

### 7.6 바뀐 파일의 범위 (`measurement.json` `changedScope`)

- 앱 코드: 0개 · 법정·헌법·지시함: 0개 · 기준 시험지: 1개 · 그 밖(법정 분류로는 제품): `scripts/module-metrics.js` · `tests/cross-tab-inline-owned-es507.test.js`.

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

### 법정 판정 예상 (예상이지 판정이 아니다)

- 앱 코드(`index.html` · `js/**`) 변경이 없어 화면 점검 대상이 아닐 것으로 예상한다. 법정은 `tests/**` · `scripts/module-*.js` · `scripts/inline-*.js` 를 제품으로 분류하므로 주장 파일에 그 파일마다 글자 확인 주장을 적었다. 판정은 「통과」 또는 「확인 부족」이 될 것으로 예상한다.
- PR 의 Vercel 검사는 배포 하루 한도에 걸려 실패할 수 있다(오케스트레이터 지시: 무시 — 법정은 자체 서버로 돈다).
- **법정이 어떤 판정을 내든 이 작업 세션은 병합하지 않는다.** 상민님 2026-10-11 승인(금고 변경 승인)에 따라 오케스트레이터 세션이 판정 확인 뒤 병합한다.

### 막힐 지점 · 범위 밖 (보고)

- 설계 문서 `docs/architecture/CELL-REGISTRY-DESIGN.md` 6.4(③ `window.SHARED_GROUPS_LOADED = false` 블록 — 「세포로 가면 가드가 실패한다」) · 9절 표(module-guard ⑤) · 9.1 은 이 PR 이 병합되면 낡는다. 그 문서는 다른 작업(DIR-004 설계 개정)이 고치고 있어 이 PR 에서 건드리지 않았다 — 오케스트레이터에게 보고한다.
- `window.SHARED_GROUPS_LOADED = false` 줄을 실제로 구역 세포로 옮기는 일은 범위 밖이다(구역 이전의 몫). 이 PR 은 옮겨도 ⑤ 가 늘지 않게 했을 뿐이다. ③(window 대입 수)은 그 줄이 `js/core` 로 가도 줄지 않는다(측정기가 js 파일의 대입도 센다) — 설계 9절 표의 그 말은 그대로 참이다.
- 병합 순서: 다른 세 PR 과 무관하다(이 PR 만으로 현재 main 의 지표·시험이 같다).

### 성과 측정

- 완료 기준: (1) 현재 main 의 래칫 다섯 칸이 고치기 전과 같다. (2) 모의본에서 ⑤ 가 1 → 0. (3) 진짜 사례 시험과 대조군이 전부 기대대로. 값은 7절.
- 이 문서가 말하는 것은 **계획 완료**까지다. 「실제 구역 이전·finalize PR 에서 가드가 통과한다」(사용 가능)는 **미확인**이다.

