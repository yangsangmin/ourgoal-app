# REQ — 덩어리(IIFE) 안 글자를 붙잡는 시험 단언을 「덩어리에 있거나 옮겨 간 자리에 있다」로 넓히기 (#TASK-ES-666)

- 작업번호: TASK-ES-666 · 종류: **FIX**(시험지 · 기준 시험지 · 시험 도우미 — 앱 코드 `index.html` · `js/**` 변경 0)
- 묶음: 같은 승인으로 나눈 PR 네 개 — TASK-ES-666(시험지·기준 시험지·공용 도우미) · TASK-ES-667(모듈 측정기 ⑤ 규칙) · TASK-ES-668(도구 다섯 개) · TASK-ES-669(금고: 무결성 게이트 한 줄). 책임 단위로 나눴고 어느 순서로 병합돼도 main 의 `npm test` 가 깨지지 않게 했다(아래 4절·6절).
- 작업참고: `C:/dev/agent-knowledge/WORK-REFERENCE.md` **기준 PR #941**(끝까지 읽음 — 이 작업에 쓴 경험칙: L021 · L023 · L048 · L067 · L085 · L110).
- 측정 기준: `origin/main` 42b5511f — 이 가지에 그 커밋을 합친 뒤 측정 한 벌을 전부 다시 돌린 값이다(앞선 기준 커밋에서 잰 값은 싣지 않았다). main 과 함께 움직이는 수는 이 PR 이 가진 `reports/TASK-ES-666/measurement.json` 을 가리킨다(`baseCommit` 칸이 잰 커밋이다).
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

- 하는 것: 모의본 (나)에서 실제로 깨진 시험 단언 7줄을 넓히고, 그 일을 하는 공용 도우미 `tests/helpers/moved-code.js` 와 자체 시험을 더한다.
- 하지 않는 것: 단언·검사를 지우거나 기대값을 바꾸는 일, 앱 코드·생성기·법정·헌법·지시함 변경, 금고 파일(`scripts/verify-integrity-gate.js` — TASK-ES-669), 모듈 측정기(TASK-ES-667), 도구(TASK-ES-668).

### 지시 항목

| ID | 지시 항목 | 나온 곳 |
|---|---|---|
| R1 | index.html 인라인 IIFE(덩어리) 안의 글자를 정답으로 붙잡는 시험 단언을 「그 글자가 있거나, 그 대상이 옮겨 간 자리(세포 파일의 함수 선언·함수의 첫 문·인라인 합본·등록)에 있다」로 넓힌다. 검사 수·단언 수 그대로, 폐기 0(상민님 「결심 1 : 승인, 금고 변경 승인」). | 오케스트레이터 지시문(승인: 원문 2) |
| R2 | 옮겨 간 자리를 보는 일은 공용 도우미에 모으고 파서로 읽는다(느슨한 글자 긁기 금지). 도우미 자체 시험을 둔다. | 오케스트레이터 지시문(승인: 원문 2) |
| R3 | 넓힌 단언이 가짜로 통과하지 않음을 대조군으로 보인다(옮겨 간 대상을 깨뜨리면 그 단언이 실패한다). | 오케스트레이터 지시문(승인: 원문 2) |
| R4 | 고치기 전·후 측정을 싣는다 — 현재 main 은 고치기 전과 같고, 모의본 (가)(나)에서 깨지던 단언 줄이 줄어든다(작업자 측정, 판정 아님). | 오케스트레이터 지시문(승인: 원문 2) |
| R5 | 넓히기로 풀지 못한 것과 범위 밖의 것을 목록으로 보고한다. | 오케스트레이터 지시문(승인: 원문 2) |

- 원문에 있는데 이 PR 에 없는 것: 「메모 선언 글자 하나(_promptEncyclopediaOpen, 금고 파일인 무결성 게이트)」는 TASK-ES-669, 「모듈 가드의 인라인 소유 규칙」은 TASK-ES-667, 「도구 5개」는 TASK-ES-668 에 있다. 「결심 2」는 이 작업의 범위가 아니다(오케스트레이터가 따로 다룬다).

### 구체 식별자

- 새 파일: `tests/helpers/moved-code.js`(`textOrFunctionDefined` · `textOrFunctionStartsWith` · `textOrStateDefined` · `cellFunctions` · `stateDefines` · `cells` · `forRoot`) · `tests/moved-code.test.js` · 측정 도구 `reports/TASK-ES-666/tools/*.cjs`(`make-final-mock.cjs` · `attribute-pins.cjs` · `only-in.cjs` · `relax-mock-limits.cjs` · `control-group.cjs` · `summary.cjs`)
- 바꾼 파일: `scripts/smoke-test.js` · `tests/avatar-10slots-growth.test.js` · `tests/gcal-login-reconnect-fix.test.js` · `tests/goal-template-legacy-cleanup.test.js` · `tests/goals-only-view.test.js` · `tests/goals-schedule-sync.test.js` · `tests/helpers/wiring-exposed.js` · `tests/trio-es143-es145.test.js` · `scripts/test-shipyard-modular.js`(자체 시험을 부르는 `runNode` 한 줄 추가)
- 읽기만 한 것: `js/tabs/settings/avatar-levelup-modal.js`(`function filterHarmfulWords`) · `js/creator-templates-legacy.js`(`function templatesHtml`) · `js/core/app-state.js` · `js/core/gcal-token-save.js` · `tests/helpers/inline-bundle.js` · `court/README.md` · `court/vault.json` · `court/judge.js`
- DOM: 해당 없음(화면 변경 0)

### 작업 유형 분류 (헌법 SNOWBALL)

**(나) 이탈.** 경험칙 L067(시험을 고치지 말고 작업 계획에서 빼라)에서 벗어난다. 사유: ① 붙잡힌 글자는 덩어리의 마지막 줄들이다 — 계속 빼 두면 지시함 DIR-004 의 완료 기준(인라인 IIFE 0)에 닿지 못한다. ② 상민님 「결심 1 : 승인, 금고 변경 승인」 를 받았다. ③ 단언 수 그대로이고 새 갈래는 파서로 읽으며 대조군으로 쟀다(L021 · L023). ④ 선례: #TASK-ES-620 · #TASK-ES-623(PR #900 · #901, 같은 방식으로 병합됨).

### 헌법 제4조 4.4 가 요구하는 세 가지

- ① 목적 변경의 승인 근거: 원문 2 「결심 1 : 승인, 금고 변경 승인」.
- ② 고치기 전·후 기대값: 3절의 표(줄마다 고치기 전 식 · 고친 뒤 식). 옛 글자는 고친 줄에 그대로 남는다(`reports/TASK-ES-666/changed-assertions.json` `summary.legacyTextKeptAllByLiterals` = true).
- ③ 제품 변경과 구분한 표시: 이 PR 에 앱 코드 변경이 없다(`reports/TASK-ES-666/measurement.json` `changedScope.appCode` = []). 고친 기준 시험지 검사는 주장 파일 `retire` 에 검사 제목으로 사유를 적었다.

## 1. [원칙 ①] 문제를 정확히 파악한다

- 증상: 덩어리(index.html 인라인 IIFE)는 인라인 스크립트 1896줄(모듈 측정기 ①)까지 줄었지만, 그 안의 글자를 「index.html 에 이 글자가 있어야 한다」고 붙잡는 단언이 남아 있어 마지막 단계(finalize — IIFE 를 비우고 시동 목록을 `js/app/boot.js` 로)를 하면 시험이 깨진다.
- 측정(시험·기준 시험지 131개를 던지지 않는 단언으로 끝까지 돌림 — `reports/TASK-ES-620/run-asserts.cjs`): 기준에서는 실패하지 않고 모의본에서만 실패하는 단언 줄이 (가) **40줄**, (나) **14줄**이다.
  - (가) 파일별: `scripts/smoke-test.js` 23 · `scripts/test-shipyard-modular.js` 1 · `scripts/verify-integrity-gate.js` 1 · `tests/avatar-10slots-growth.test.js` 1 · `tests/cross-tab-guarded-init-es502.test.js` 1 · `tests/cross-tab-inline-owned-es507.test.js` 1 · `tests/gcal-login-reconnect-fix.test.js` 1 · `tests/goal-template-legacy-cleanup.test.js` 1 · `tests/goals-only-view.test.js` 1 · `tests/goals-schedule-sync.test.js` 1 · `tests/module-guard.test.js` 2 · `tests/new-module.test.js` 1 · `tests/stopwatch-lap-inputs.test.js` 1 · `tests/stopwatch-table-hint.test.js` 3 · `tests/trio-es143-es145.test.js` 1.
  - (나) 파일별: `scripts/smoke-test.js` 1 · `scripts/test-shipyard-modular.js` 1 · `scripts/verify-integrity-gate.js` 1 · `tests/avatar-10slots-growth.test.js` 1 · `tests/cross-tab-guarded-init-es502.test.js` 1 · `tests/cross-tab-inline-owned-es507.test.js` 1 · `tests/gcal-login-reconnect-fix.test.js` 1 · `tests/goal-template-legacy-cleanup.test.js` 1 · `tests/goals-only-view.test.js` 1 · `tests/goals-schedule-sync.test.js` 1 · `tests/module-guard.test.js` 2 · `tests/new-module.test.js` 1 · `tests/trio-es143-es145.test.js` 1.
- 붙잡는 대상으로 나누면(`reports/TASK-ES-666/tools/attribute-pins.cjs` — 단언의 글자가 기준 index.html 의 IIFE 안 어디에 있었는가. 한 줄이 여러 자리의 글자를 붙잡으면 자리마다 센다): (가) 글자를 붙잡는 줄 34(글자가 있던 자리: 함수 선언 24 · 호출문 7 · 주석 3 · 상태·그 밖의 var 1 · if 문 1) · 글자 없이 깨지는 줄 6(모듈 가드의 종료 코드·⑤ 값을 보는 줄 등) / (나) 글자를 붙잡는 줄 8(글자가 있던 자리: 주석 3 · 상태·그 밖의 var 1 · if 문 1 · 함수 선언 4) · 글자 없이 깨지는 줄 6(모듈 가드의 종료 코드·⑤ 값을 보는 줄 등).
- (나)의 14줄을 고칠 몫으로 나누면: 주석 글자를 붙잡는 줄(`scripts/smoke-test.js` · `tests/goal-template-legacy-cleanup.test.js` 의 구획 주석 「(#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화)」, `tests/avatar-10slots-growth.test.js` 의 주석 속 `filterHarmfulWords`) · index.html 만 읽는 글자 단언(`tests/goals-only-view.test.js` · `tests/goals-schedule-sync.test.js` · `tests/trio-es143-es145.test.js` — 글자가 덩어리에 남은 함수 안에 있다) · 배선 글자(`tests/gcal-login-reconnect-fix.test.js`) · 상태 선언 글자(금고 게이트 — TASK-ES-669) · 모듈 가드 ⑤ 로 깨지는 줄(TASK-ES-667).

## 2. [원칙 ②] 본질·원인·중심·핵심

- 본질: 이 단언들이 지키려던 것은 글자가 덩어리 안에 있다는 사실이 아니라 「그 함수가 정의돼 있다 · 그 함수가 무해화돼 있다 · 그 호출이 배선돼 있다」는 사실이다.
- 원인: 단언을 쓸 때는 모든 코드가 index.html 한 파일에 있어서 글자를 찾는 것이 곧 사실을 확인하는 길이었다. 코드가 세포로 옮겨 가면서 그 글자는 주석이나 우연히 남은 한 줄로만 index.html 에 남았고, 덩어리를 비우면 그것마저 사라진다.
- 중심: 단언을 지우거나 약하게 하지 않고, 옛 글자 갈래는 그대로 두면서 「옮겨 간 자리」 갈래가 원래 목적을 진짜로 확인하게 하는 것.
- 핵심: 둘 다 없으면 반드시 실패하는 것(대조군), 그리고 현재 main 에서는 결과가 고치기 전과 같은 것.

## 3. [원칙 ③] 해결 방식

공용 도우미 `tests/helpers/moved-code.js` — index.html 이 `defer`·`async` 없이 읽는 `js/` 파일(세포)을 `@babel/parser` 로 읽는다. 주석 안의 태그·읽지 않는 파일은 세포가 아니다.

| 함수 | 참이 되는 때 |
|---|---|
| `textOrFunctionDefined(source, 옛 글자, 함수 이름)` | 옛 글자가 source 에 있다 **또는** 그 이름의 함수 선언이 세포 파일 맨 위(파일 맨 위·파일을 감싼 IIFE 바로 안)에 있다 |
| `textOrFunctionStartsWith(source, 옛 글자, 함수 이름, 첫 문 글자)` | 옛 글자가 있다 **또는** 그 함수 선언의 본문 첫 문이 주어진 글자와 같다(공백·이름 접두 `L.` 만 떼고 맞댐) |
| `textOrStateDefined(source, '이름 = 초기값;')` | 옛 선언 글자가 있다 **또는** 상태 기관(`js/core/app-state.js`)을 먼저 읽고 그 뒤의 세포에 `window.OurgoalAppState.define·defineVar('이름', 초기값)` 호출이 같은 초기값으로 있다(TASK-ES-669 가 쓴다) |

바꾼 단언(전수 — `reports/TASK-ES-666/changed-assertions.json`):

| 파일:줄 | 고치기 전 | 고친 뒤(옛 글자는 그대로 남는다) | 새 갈래가 확인하는 것 |
|---|---|---|---|
| `scripts/smoke-test.js:9980` | `assert.ok(indexHtml.includes('(#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화)'), 'index.html 내 templatesHtml 무해화 확인');` | `assert.ok(MOVED.textOrFunctionStartsWith(indexHtml, '(#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화)', 'templatesHtml', "if(!window.__FORCE_LEGACY_TEMPLATES_CARD…` | `templatesHtml` 의 첫 문이 무해화 반환문이다(고치기 전에는 구획 주석 글자가 맞았다) |
| `tests/avatar-10slots-growth.test.js:76` | `assert.ok(indexHtml.includes('filterHarmfulWords'), 'filterHarmfulWords 함수가 index.html에 정의되어 있어야 합니다.');` | `assert.ok(require('./helpers/moved-code').textOrFunctionDefined(indexHtml, 'filterHarmfulWords', 'filterHarmfulWords'), 'filterHarmfulWords 함수가 index.…` | `function filterHarmfulWords` 선언이 세포에 있다(고치기 전에는 index.html 의 주석 글자가 맞았다) |
| `tests/gcal-login-reconnect-fix.test.js:25` | `assert.ok(indexHtml.includes('window.saveGoogleToken = saveGoogleToken;'), 'saveGoogleToken 전역 노출');` | `assert.ok(require('./helpers/wiring-exposed').windowExposed(indexHtml, 'window.saveGoogleToken = saveGoogleToken;'), 'saveGoogleToken 전역 노출');…` | 같은 이름·같은 값이 등록으로 window 에 나간다(#TASK-ES-620 도우미) |
| `tests/goal-template-legacy-cleanup.test.js:43` | `assert.ok(indexHtml.includes('(#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화)'), 'index.html 내 templatesHtml 무해화 확인');` | `assert.ok(require('./helpers/moved-code').textOrFunctionStartsWith(indexHtml, '(#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화)', 'templatesHtml', "if(!window.__F…` | `templatesHtml` 의 첫 문이 무해화 반환문이다(고치기 전에는 구획 주석 글자가 맞았다) |
| `tests/goals-only-view.test.js:65` | `assert(indexHtml.includes("renderGoalsScreen();"), '뷰 전환 시 renderGoalsScreen이 정상 호출되어야 합니다.');` | `assert(require('./helpers/inline-bundle').withInlineCells(indexHtml).includes("renderGoalsScreen();"), '뷰 전환 시 renderGoalsScreen이 정상 호출되어야 합니다.');…` | 그 글자가 index.html 이나 인라인에서 옮겨 간 세포에 있다(인라인 합본 — `tests/helpers/inline-bundle.js`) |
| `tests/goals-schedule-sync.test.js:98` | `assert.ok(indexHtml.includes('renderGoalsScreen();') && indexHtml.includes('renderCalendarScreen();'), '목표 및 캘린더 뷰 갱신');` | `assert.ok(require('./helpers/inline-bundle').withInlineCells(indexHtml).includes('renderGoalsScreen();') && require('./helpers/inline-bundle').withInl…` | 그 글자가 index.html 이나 인라인에서 옮겨 간 세포에 있다(인라인 합본 — `tests/helpers/inline-bundle.js`) |
| `tests/trio-es143-es145.test.js:50` | `assert.ok(indexHtml.includes('b.classList.add(\'active\')') \|\| indexHtml.includes('b.classList.remove(\'active\')'), '관심 카테고리 칩 선택 토글이 안정적으로 배선되어야 함…` | `assert.ok(require('./helpers/inline-bundle').withInlineCells(indexHtml).includes('b.classList.add(\'active\')') \|\| require('./helpers/inline-bundle'…` | 그 글자가 index.html 이나 인라인에서 옮겨 간 세포에 있다(인라인 합본 — `tests/helpers/inline-bundle.js`) |

- `tests/helpers/wiring-exposed.js`: 내보내기에 `scriptTags` 한 이름을 더했다(새 도우미가 같은 태그 읽기를 쓴다). 판정 식은 그대로다.
- `scripts/test-shipyard-modular.js`: `runNode('tests/moved-code.test.js');` 한 줄 추가(도우미 자체 시험이 `npm test` 경로에서 돈다). 지운 줄 0.

## 4. [원칙 ④] 재검토 (반례·부작용)

- 반례 — 「주석 글자를 찾던 단언을 함수 선언으로 바꾸면 다른 것을 재는 것 아닌가」: 그 단언의 메시지는 「filterHarmfulWords 함수가 … 정의되어 있어야 합니다」 · 「templatesHtml 무해화 확인」이다. 고치기 전에는 그 함수가 이미 세포로 옮겨 가 index.html 에는 **주석**만 남아 있었고, 단언은 그 주석 글자로 통과하고 있었다. 새 갈래는 메시지가 말하는 것(선언·첫 문)을 직접 본다. 옛 갈래는 한 글자도 바꾸지 않았다.
- 반례 — 「인라인 합본으로 넓힌 세 줄은 느슨해지는가」: `renderGoalsScreen();` 같은 글자는 합본의 여러 세포에 있다(대조군 B3 — 옮겨 간 함수 한 곳에서만 지우면 단언은 참으로 남는다). 고치기 전에도 index.html 에 남은 한 곳(기록 모달 함수 안)이 우연히 붙잡고 있었을 뿐이다. 이 저장소가 세포 이전 때마다 해 온 「시험지 선행 — 읽는 범위만 넓힘, 기대값 0 변경」과 같은 조치다. 합본 전체에서 지우면 실패한다(대조군 B1 · B2).
- 반례 — 도우미가 엉뚱한 글자로 조용히 통과: 옛 글자가 비었거나 이름이 식별자가 아니면 오류를 던진다. 주석·문자열 안의 글자, 함수 식, 안쪽 깊은 선언, 읽지 않는 파일, `defer` 태그는 거짓이다(자체 시험 12줄이 `npm test` 의 ok 줄로 늘었다).
- 알림 — `tests/gcal-login-reconnect-fix.test.js` 의 한 줄은 #TASK-ES-620 도우미의 등록 갈래로 넓혔다. 이 작업을 시작할 때는 `saveGoogleToken` 이 등록되지 않아 넓혀도 풀리지 않았는데, 측정 기준 커밋에는 등록 2차(#940)가 들어와 있어 (나)에서 이 줄이 풀린다. 등록을 되돌리면 다시 실패한다(대조군 R1).
- 알림 — 바꾼 시험 파일 가운데 `tests/goal-template-legacy-cleanup.test.js` · `tests/goals-only-view.test.js` · `tests/goals-schedule-sync.test.js` · `tests/trio-es143-es145.test.js` 는 현재 main 에서도 다른 단언 때문에 종료 코드가 0 이 아니다(`npm test` 경로 밖의 옛 시험 파일 — `measurement.json` `main.plain.base.testFilesFailed`). 이 PR 은 그 줄들을 고치지 않았다.

## 5. [원칙 ⑤] 절차

1. 번호 선점(빈 가지 push) → `origin/main` 기준 새 작업 폴더.
2. 모의본 (가)(나)를 저장소 밖에 만들고 시험 전부를 던지지 않는 단언으로 돌려 깨지는 줄을 전수로 적는다.
3. 깨지는 줄마다 붙잡는 대상과 그 대상이 옮겨 간 자리를 정한다 → 도우미 · 자체 시험 · 단언 편집.
4. 고친 뒤 실측(현재 main · 모의본 · PR 하나씩 · 넷 다) → 대조군.
5. 서류 → `node scripts/verify-integrity-gate.js` → `npm test` → `node scripts/module-guard.js` → 서류 뒤 `npm test` 한 번 더.
6. 커밋(훅 우회 없음) → push 직전 main 합치고 다시 잼 → push 한 번 → PR. **병합하지 않는다.**

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- 반론 1 — 「(가)에서 31줄이 남는데 다 고친 것이 아니지 않은가.」
  - 격파: (가)는 IIFE 를 **통째로** `js/app/boot.js` 한 파일에 담은 모의본이라 덩어리의 글자가 전부 그 파일에 있다. 실제 finalize 는 손잡이·구역 함수 가져오기·호출문만 남았을 때 돈다(설계 5.8) — 그때 함수 본문·상태 초기값 글자는 이미 세포에 있다. 그 꼴이 (나)이고 (나)에서는 한계를 빼면 0줄이다. 합본이 `js/app/boot.js` 까지 읽게 넓히면 (가)의 수는 줄지만, 실제로 오지 않을 꼴을 위해 공용 합본과 기준 시험지를 넓히는 일이라 하지 않았다(지표를 거짓으로 좋게 만들지 않는다). (가)에 남는 줄은 7.2 에 그대로 적었다.
- 반론 2 — 「넓힌 단언은 무엇이든 통과시키는 것 아닌가.」
  - 격파: 대조군 9개(이 PR 몫) — 옮겨 간 대상을 깨뜨리면 그 단언 줄이 새로 실패한다(전부 기대대로 true). 현재 main 에서는 옛 글자 갈래가 그대로 참이라 결과가 같다(새로 실패 0줄).
- 절차 재검증: 측정은 저장소 밖 떼어 낸 작업 폴더에서만 했다(이 작업 폴더·본 체크아웃·다른 세션의 작업 폴더를 고치지 않았다). 줄 번호는 같은 판의 시험지끼리만 맞댔다(「기준 + PR」 과 「모의본 + PR」).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

전부 작업자 측정이며 판정이 아니다. 수는 `reports/TASK-ES-666/measurement.json`(요약 도구 `reports/TASK-ES-666/tools/summary.cjs`)에서 읽는다.

### 7.1 모의본에서만 깨지는 단언 줄 — 고치기 전 → 고친 뒤

| 모의본 | 고치기 전(모의본에서만 깨지는 단언 줄) | 네 PR 을 얹은 뒤 | 남은 것 |
|---|--:|--:|---|
| (가) IIFE 를 통째로 `js/app/boot.js` 로 뺀 것(662 도구) | 40 | 31 | 글자가 `js/app/boot.js` 한 파일에 통째로 있어 합본이 읽지 않는다(실제 finalize 의 꼴이 아니다 — 줄 목록 `measurement.json` `mock.A.afterAll.list`) |
| (나) 남은 줄이 각자 갈 곳으로 간 꼴(`reports/TASK-ES-666/tools/make-final-mock.cjs`) | 14 | 4 | `scripts/test-shipyard-modular.js:150` scripts/module-guard.js must pass (exit 1) · `tests/module-guard.test.js:61` 가드가 통과해야 한다 · `tests/module-guard.test.js:62` The expression evaluated to a falsy value · `tests/new-module.test.js:65` 새 세포를 더해도 모듈 가드 통과 |
| (나) + `saveGoogleToken` 등록 흉내 | – | 4 | `scripts/test-shipyard-modular.js:150` scripts/module-guard.js must pass (exit 1) · `tests/module-guard.test.js:61` 가드가 통과해야 한다 · `tests/module-guard.test.js:62` The expression evaluated to a falsy value · `tests/new-module.test.js:65` 새 세포를 더해도 모듈 가드 통과 |
| (나)에서 흉내의 한계(새 세포 파일에 신고서 없음)를 걷어 낸 것 | 14 | 0 | 없음 |
| (나) + 등록 흉내 + 한계 걷어 냄 | – | 0 | 없음 |

- 「등록 흉내」(`--register saveGoogleToken`)는 이 기준 커밋에서는 아무것도 바꾸지 않는다 — 그 이름은 등록 2차(#940)로 이미 등록 기관에 등록돼 있다(모의본 도구 기록: 「이미 등록 블록이 있다(이 도구는 새 블록만 단다)」). 그래서 「등록 흉내」가 붙은 줄은 붙지 않은 줄과 같다.
- PR 하나만 얹었을 때 (나)에서만 깨지는 줄(「기준 + 그 PR」 과 「(나) + 그 PR」 을 맞댐): 666 만 7줄 · 667 만 12줄 · 669 만 14줄(고치기 전 14줄). 넷을 다 얹어야 위 표의 수가 된다.
- 덩어리에 남은 함수 6개(`openProTemplateRecordModal` · `bindProRecTable` · `bindProRecTools` · `bindProRecTrendChart` · `bindProRecStopwatch` · `bindProRecSave`)는 모의본에서 탭 세포 파일 2개에 나눠 담았다(가장 큰 파일 534줄 — 800줄 단언과 모듈 가드 ④ 에 걸리지 않는다).
- (나)에 남는 모듈 가드 줄들(`scripts/test-shipyard-modular.js` 의 가드 실행 줄 · `tests/module-guard.test.js` · `tests/new-module.test.js`)은 가드가 모의본의 새 파일에 신고서가 없다고 실패해서다(**흉내의 한계**). 그것을 모의본 안에서 걷어 내면 사라진다(표의 넷째·다섯째 줄 — `reports/TASK-ES-666/tools/relax-mock-limits.cjs`).

### 7.2 (가)에 남는 줄 (31줄 — 모의본 (가)의 한계와 범위 밖)

- 파일별: `scripts/smoke-test.js` 22 · `scripts/test-shipyard-modular.js` 1 · `scripts/verify-integrity-gate.js` 1 · `tests/module-guard.test.js` 2 · `tests/new-module.test.js` 1 · `tests/stopwatch-lap-inputs.test.js` 1 · `tests/stopwatch-table-hint.test.js` 3.
- 붙잡는 대상(고치기 전 (가)의 분류 — 글자를 붙잡는 줄 34(글자가 있던 자리: 함수 선언 24 · 호출문 7 · 주석 3 · 상태·그 밖의 var 1 · if 문 1) · 글자 없이 깨지는 줄 6(모듈 가드의 종료 코드·⑤ 값을 보는 줄 등)). 글자가 있던 문: 함수 선언(openProTemplateRecordModal) · 함수 선언(bindProRecTrendChart) · 함수 선언(bindProRecStopwatch) · 호출문 · 주석(문 밖) · 상태·그 밖의 var(_promptEncyclopediaOpen) · if 문 · 함수 선언(bindProRecSave). 전부 (가)에서는 `js/app/boot.js` 에 있어 합본이 읽지 않는다. (나)에서는 그 글자가 세포·구역 세포·상태 기관 호출로 가 있어 풀린다.
- `scripts/verify-all-clicks.js` 도 (가)에서만 종료 코드가 바뀐다(처리기를 `js/app/` 에서 읽지 않는다). (나)에서는 그대로다.
- 줄 목록 전체: `reports/TASK-ES-666/measurement.json` `mock.A.afterAll.list`.

### 7.3 현재 main — 고치기 전과 같은가

| 트리 | `npm test` 종료 코드 | ✓ 줄 | ok 줄 | smoke-test(종료 · ✓ · ✗) | 무결성 게이트(종료 · ✓ · ✗) | 조선소 시험(종료 · ok 줄) | 시험 파일(종료 0 / 전체) |
|---|--:|--:|--:|---|---|---|---|
| 현재 main · 고치기 전 | 0 | 487 | 172 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 | 0 · ok 172 | 88 / 114 |
| 현재 main · 이 PR(666) | 0 | 487 | 184 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 | 0 · ok 184 | 89 / 115 |
| 현재 main · 네 PR | 0 | 487 | 185 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 | 0 · ok 185 | 89 / 115 |

- 줄 단위: 고치기 전에는 실패하지 않다가 이 PR 을 얹으면 실패하는 단언 0줄 · 네 PR 을 다 얹으면 0줄(반대로 사라진 줄 0).
- ok 줄이 172 → 184 로 늘어난 것은 도우미 자체 시험의 줄이다. 시험 파일 수 114 → 115(새 파일 `tests/moved-code.test.js`).

### 7.4 모의본의 종료 코드 · 검사 수

| 트리 | `npm test` 종료 코드 | ✓ 줄 | ok 줄 | smoke-test(종료 · ✓ · ✗) | 무결성 게이트(종료 · ✓ · ✗) | 조선소 시험(종료 · ok 줄) | 시험 파일(종료 0 / 전체) |
|---|--:|--:|--:|---|---|---|---|
| (가) · 고치기 전 | 1 | 427 | 0 | 1 · ✓ 427 · ✗ 12 | 1 · ✓ 37 · ✗ 1 | 1 · ok 0 | 80 / 114 |
| (가) · 네 PR | 1 | 428 | 0 | 1 · ✓ 428 · ✗ 11 | 1 · ✓ 37 · ✗ 1 | 1 · ok 0 | 85 / 115 |
| (나) · 고치기 전 | 1 | 438 | 0 | 1 · ✓ 438 · ✗ 1 | 1 · ✓ 37 · ✗ 1 | 1 · ok 0 | 82 / 114 |
| (나) · 네 PR | 1 | 485 | 0 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 | 1 · ok 0 | 87 / 115 |
| (나) + 등록 흉내 + 한계 걷어 냄 · 네 PR | 0 | 487 | 185 | 0 · ✓ 439 · ✗ 0 | 0 · ✓ 38 · ✗ 0 | 0 · ok 185 | 89 / 115 |

### 7.5 대조군 (`reports/TASK-ES-666/tools/control-group.cjs` → `reports/TASK-ES-666/control-group.json`)

네 PR 을 얹고 한계를 걷어 낸 (나)+등록 트리에서 옮겨 간 대상을 하나씩 깨뜨리고, 깨뜨리기 전에는 실패하지 않던 줄 가운데 새로 실패한 줄을 적는다. 끝난 뒤 트리가 처음과 같은지 확인했다(true).

| 변형 | PR | 무엇을 깨뜨렸나 | 새로 실패한 줄 | 기대한 줄 | 기대대로 |
|---|---|---|--:|--:|---|
| F1 | 666 | 세포 js/tabs/settings/avatar-levelup-modal.js 의 함수 선언 이름을 filterHarmfulWords → filterHarmfulWordsGone 으로 바꿈(그 이름의 함수 선언이 사라짐) | 1 | 1 | true |
| F2 | 666 | index.html 에서 js/tabs/settings/avatar-levelup-modal.js 의 <script src> 태그를 뺌(읽지 않는 파일은 세포가 아니다) | 1 | 1 | true |
| F3 | 666 | 세포 js/tabs/settings/avatar-levelup-modal.js 의 함수 선언 이름을 바꾸고 옛 이름은 주석 안에만 남김(주석 안의 글자는 선언이 아니다) | 1 | 1 | true |
| S1 | 666 | js/creator-templates-legacy.js 의 templatesHtml 첫 문(무해화 반환문)을 다른 문으로 바꿈 | 2 | 2 | true |
| S2 | 666 | js/creator-templates-legacy.js 의 templatesHtml 첫 문 앞에 다른 문을 끼움(무해화 반환문이 둘째 문이 됨) | 2 | 2 | true |
| G1 | 669 | 구역 세포(모의)에서 상태 기관 호출 줄 defineVar('_promptEncyclopediaOpen', false) 를 지움 | 1 | 1 | true |
| G2 | 669 | 상태 기관 호출의 초기값을 false → true 로 바꿈 | 1 | 1 | true |
| G3 | 669 | 상태 기관 호출의 이름을 다른 이름으로 바꿈 | 1 | 1 | true |
| G4 | 669 | 호출을 주석으로 바꿈(주석 안의 호출 글자는 상태 선언이 아니다) | 1 | 1 | true |
| G5 | 669 | index.html 에서 상태 기관(js/core/app-state.js)의 <script src> 태그를 뺌(기관을 읽지 않으면 호출은 값을 만들지 못한다) | 1 | 1 | true |
| R1 | 666 | 세포 js/core/gcal-token-save.js 의 등록 블록 window 목록에서 saveGoogleToken 을 뺌(등록을 되돌림) | 1 | 1 | true |
| B1 | 666 | 합본이 읽는 파일 전부(index.html + 인라인에서 옮겨 간 세포)에서 글자 renderGoalsScreen(); 을 지움 | 2 | 2 | true |
| B2 | 666 | 합본이 읽는 파일 전부에서 글자 b.classList.add('active') · b.classList.remove('active') 를 지움 | 1 | 1 | true |
| B3 | 666 | 옮겨 간 함수의 세포(모의 탭 세포)에서만 글자 renderGoalsScreen(); 을 지움 — 다른 세포에도 그 글자가 있으면 단언은 참으로 남는다(기대: 새로 실패 0) | 0 | 0 | true |
| M1 | 667 | 구역 세포(모의)에서 기관이 window 에 다는 줄 window.SHARED_GROUPS_LOADED = false 를 지움(기관이 주인이 아니게 됨 → ⑤ 가 다시 1) | 6 | 6 | true |
| M2 | 667 | 그 줄을 방어 초기화 꼴(if(!window.X) window.X = false)로 바꿈 — 없으면 채우기는 주인이 아니다(⑤ 가 다시 1) | 6 | 6 | true |
| M3 | 667 | 그 줄을 js/core 밖의 옛 파일(js/zz-control-legacy.js)로 옮김 — 기관이 아닌 파일이 다는 이름은 주인이 아니다(⑤ 가 다시 1) | 6 | 6 | true |

- 전부 기대대로: true (17개 — 666 몫 9 · 667 몫 3 · 669 몫 5). 667·669 몫은 그 PR 의 서류에도 싣는다.
- B3 은 「새로 실패 0」이 기대다 — 그 글자가 합본의 다른 세포에도 있음을 숨기지 않고 보인 것이다(4절).

### 7.6 바뀐 파일의 범위 (`measurement.json` `changedScope`)

- 앱 코드(`index.html` · `js/**` 등): 0개 · 법정·헌법·지시함: 0개 · 기준 시험지: `scripts/smoke-test.js` · `scripts/test-shipyard-modular.js` · 그 밖(법정 분류로는 제품 — 시험지·도우미): 9개.

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

### 법정 판정 예상 (예상이지 판정이 아니다)

- 앱 코드(`index.html` · `js/**`) 변경이 없어 화면 점검 대상이 아닐 것으로 예상한다. 법정은 `tests/**` · `scripts/module-*.js` · `scripts/inline-*.js` 를 제품으로 분류하므로 주장 파일에 그 파일마다 글자 확인 주장을 적었다. 판정은 「통과」 또는 「확인 부족」이 될 것으로 예상한다.
- PR 의 Vercel 검사는 배포 하루 한도에 걸려 실패할 수 있다(오케스트레이터 지시: 무시 — 법정은 자체 서버로 돈다).
- **법정이 어떤 판정을 내든 이 작업 세션은 병합하지 않는다.** 상민님 2026-10-11 승인(금고 변경 승인)에 따라 오케스트레이터 세션이 판정 확인 뒤 병합한다.

- 기준 시험지 `scripts/smoke-test.js` 의 바뀐 검사는 `retire` 에 제목으로 사유를 적었다(1건 — L085 의 20줄 상한과 무관한 크기다).

### 넓히기로 풀지 못한 것 · 범위 밖 (보고)

- (풀림) `window.saveGoogleToken = saveGoogleToken;`(`tests/gcal-login-reconnect-fix.test.js`): 등록 2차(#940)가 main 에 들어와 그 이름이 등록됐다. 넓힌 단언은 (나)에서 등록 갈래로 참이다 — 한계를 걷어 낸 (나)에 남는 줄 0.
- (가)에 남는 글자들의 실제 갈 곳: (나)에서는 함수는 탭 세포로, 상태 초기값은 상태 기관 호출로, 그 밖의 문은 구역 세포(생성기 표지가 있는 `js/core` 파일)로 간 것으로 흉내 냈고 그 꼴에서는 풀린다. 실제로 어디로 갈지는 이 작업이 정하지 않는다(범위 밖). 실제 이전 PR 이 모의 적용 사본에서 다시 재야 한다.
- `js/app/boot.js` 의 신고서: `node scripts/module-specs.js --write` 가 `app` 층 세포의 종류를 `unclassified` 로 쓰고 가드가 그것을 막는다(`relax-mock-limits.cjs` 가 모의본에서 `organ` 으로 적어 넘겼다). finalize PR 이 종류를 정해야 한다.
- 「정의 글자로 함수를 잘라 실행하는 시험」 가운데 (나)에서 깨지는 것은 0건이었다((가)에 남는 줄 목록은 7.2).

### 성과 측정

- 완료 기준: (1) 현재 main 에서 `npm test` 종료 코드가 고치기 전과 같고 새로 실패하는 단언 0줄. (2) (나)에서 이 PR 몫의 단언이 풀린다. (3) 대조군이 전부 기대대로. 값은 7절.
- 이 문서가 말하는 것은 **계획 완료**까지다. 「실제 finalize PR 이 법정을 지난다」(사용 가능)와 「재작업이 줄었다」(효과 확인)는 **미확인**이다.

