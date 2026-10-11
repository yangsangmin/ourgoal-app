# REQ — #TASK-ES-636 상태 기관 js/core/app-state.js + 로드 줄 (B9 「새 기관 추가」)

- Task ID: **TASK-ES-636** · 분류: INFRA(새 기관) · 이 PR 의 제품 변경은 새 파일 `js/core/app-state.js` 와 `index.html` 의 로드 태그 한 개(기존 태그와 같은 줄 — 순증가 0)뿐이다. 실제 상태 이전 0 · tests/ · 금고 · 생성기 · 생성 지도 3종 변경 0.
- 작업 유형(SNOWBALL 분류): **(가) 표준** — 유형 「새 기관 추가」. 선례 B1(#TASK-ES-610, PR #883 등록 기관) · B3a(#TASK-ES-614, PR #889 own 모드). 그 방식을 따른다: 기관은 로드될 때 아무것도 만지지 않는다 · 로드 줄은 같은 줄에 덧붙인다 · 충분성은 「지금 통과」가 아니라 저장소 밖 **모의 이전 사본**과 **기관 태그만 뺀 대조군**으로 증명한다(L066) · 시험이 붙잡는 이름은 시험을 고치지 않고 계획에서 뺀다(L067) · 화면이 닿는 범위가 좁으면 이름 전수 대조와 값 요약을 중심 증거로 쓰고 측정불가를 적는다(L079).
- 작업참고 기준 PR #905(eab4365b, 경험칙 87개) · 이 PR 의 기준 main 5e2fc92c(#907 철거 2차와 #908 생성 지도 갱신 병합 뒤). 브라우저 측정(상태 탐침 · 시나리오 · 대조군)은 #907 병합 커밋 b57a8a10 위에서, 시험 전부 · npm test · 모듈 로드 · 지표는 #908 까지 합친 이 기준 위에서 다시 쟀다 — #908 은 생성 지도와 문서만 바꿨다(제품·시험 파일 변경 0, 측정 파일 `summary.browserMeasuredOn`) · 지시함(origin/main) 열린 지시: **DIR-003**(B 트랙 — B9 상태 기관) · **DIR-004**.
- **상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d — 글자 그대로)**
  1. 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마. 지침이나 결심이 필요한점?」
  2. 「결심필요 4번 빼고 모두 권장안대로 진행하고 4번은 자세히 설명해봐 어떤 함수인지 어떤 기능을 하던건지 자세히, 어떻게 진행하는게 좋을지, 권장안이 뭔지」 — 결심 표 묶음 1(상태 변수의 소유를 상태 기관으로 — 닫힌 목록 X4~X6)의 앞 단계다.
- 설계 정본: `docs/architecture/CELL-REGISTRY-DESIGN.md` 3.3 「기관 API — 확정(#TASK-ES-634)」. 이 PR 이 그 계약을 그대로 구현한다.

## 0. 요구 (지시 항목)

| ID | 지시 | 원문의 어느 문장 | 완료 기준 |
|---|---|---|---|
| R1 | 상태 기관 `js/core/app-state.js`(`OurgoalAppState.define` · `defineVar`)를 설계 3.3 계약 표 그대로 더하고, index.html 에 로드 태그 하나를 통로(app-scope.js) 뒤 · IIFE 와 등록 기관 commit 앞에 **같은 줄로** 덧붙인다. 앱 동작은 그대로다 — 새 전역은 `OurgoalAppState` 하나, index.html 순증가 0 | 원문 1 「남은 미분화작업 모두 진행」 · DIR-003(B9 상태 기관) | 게스트 여섯 탭 · 목표 하위 탭 시나리오가 기준·작업 양쪽에서 통과 · module-load 새 회귀 0 · 새 파일 단독 로드 전역 1개 · index.html 순증가 0 |
| R2 | 기관이 계약대로 동작한다: 접근자를 첫 define 때 한 번 · 이미 있던 속성을 다시 정의해 덮음 · 같은 이름 두 번은 오류 · 값을 복사하지 않음 · window 에 달지 않음 | 설계 3.3 계약 표 | 기관 단위 시험(진짜 app-scope.js 위) 전부 ok |
| R3 | **모의 이전**으로 충분성을 증명한다: 저장소 밖 사본에 기관 + 로드 줄 + 생성기 unstate 를 실제 적용해, 시나리오 · 이름별 통로 값 요약과 접근자 종류 · window 복사의 동일성 · module-load · 시험 전부가 기준과 같다. 대조군(기관 태그만 뺌)은 부팅에 실패한다 | 원문 1 | 모의 사본의 값 요약 차이 0(본질 변동 제외) · 시험 실패 집합이 기준과 같음 · 대조군 부팅 실패 |
| R4 | 상태 배선 글자를 붙잡는 시험이 깨지는지 실측하고, 깨지는 단언을 파일·줄·이름 표로 남긴다(시험은 고치지 않는다). 「시험에 안 걸리고 지금 이전 가능한 이름 목록」을 계획 파일로 남긴다 | 원문 1 | `reports/TASK-ES-636/unstate-plan.json` 에 대상 이름 · 제외한 이름과 근거가 있다 |
| R5 | 증명 하한: tests/ · 금고 · 생성기(gen-inline-hard.js) · 생성 지도 3종 변경 0 · 800줄 상한 초과 0 · `inlineScriptLines` 불변 · npm test 검사 수 동일·폐기 0 | DIR-004 (가) | 측정 파일의 해당 칸 |

- 원문에 있는데 이 PR 항목에 없는 요구: 실제 상태 이전(index.html 의 getter/setter 삭제와 선언문 바꿔 쓰기)은 이 PR 에 없다 — 다음 PR 이 계획 파일을 입력으로 한다(목표 줄에 남는다). `region` · `sweep` · `finalize` 도 없다.

### 구체 식별자

- 새 파일: `js/core/app-state.js`(전역 `window.OurgoalAppState` — `define(name, value)` · `defineVar(name, value)` · 점검용 `names()` · `kindOf(name)`, 오류 코드 `NAME_REQUIRED` · `ALREADY_DEFINED` · `SCOPE_MISSING`, 통로 주인 표시 `'core/app-state'`)
- 고친 파일: `index.html` 2151행 — `<script src="js/core/app-scope.js"></script><script src="js/core/cell-registry.js"></script>` 뒤 같은 줄에 `<script src="js/core/app-state.js"></script>`(순증가 0줄) · `docs/architecture/modules.json`(세포 `core/app-state`, kind organ — `node scripts/module-specs.js --write` 산출) · `docs/architecture/cell-descriptions.json`(이름·설명 한 줄씩) · `docs/architecture/CELL-REGISTRY-DESIGN.md`(3.3 구현 기록) · `docs/rules/TICKETS.md`
- 측정 도구(새 파일, `reports/TASK-ES-636/`): `organ-unit.cjs`(기관 단위 시험) · `mock-unstate.cjs`(모의 이전) · `state-probe.cjs`(상태 값 탐침) · `measure-636.cjs` · `build-claims.cjs` · 시나리오 `scenarios/b9a-guest-boot-six-tabs.json` · `scenarios/b9a-goals-subtabs-periods.json`
- 손대지 않은 것: `js/core/app-scope.js` · `js/core/cell-registry*.js` · 그 밖의 `js/**` · `tests/**` · `court/**` · `scripts/verify-integrity-gate.js` · `docs/design/harness/module-split/gen-inline-hard.js` · 생성 지도 3종
- DOM(시나리오): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnGoalsSubPersonal` · `#btnGoalsSubRoutine` · `#btnGoalsSubStats` · `#btnGoalPeriodWeek` · `#btnGoalPeriodMonth`. 탐침의 보조 조작: `#captureInput` · `#captureCharCount`

## 1. [원칙 ①] 문제를 정확히 파악한다

- 생성기 unstate 모드(#TASK-ES-634)는 상태 변수의 선언문을 `window.OurgoalAppState.define('X', 초기값);` 으로 바꿔 쓴다. 그 줄이 IIFE 안에서 실행될 때 `window.OurgoalAppState` 가 이미 있어야 한다 — 지금은 없다.
- 법정의 생성기 재실행 대조는 설정 `cells` 의 파일(`js/core/app-state.js`)이 기준 커밋에 있어야 하고, 이전 PR 에서는 index.html 만 바뀔 수 있다. 그래서 기관 파일과 로드 줄은 이전보다 먼저 별도 PR 로 병합돼 있어야 한다.
- 「지금 통과」는 증거가 못 된다: 기관을 넣기만 한 트리에서는 아무도 기관을 부르지 않는다. 기관이 실제로 옛 배선을 대신할 수 있는지는 배선을 바꿔 쓴 사본에서만 드러난다(L066).

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 상태 하나에 주인 하나. 기관이 값을 보관하고 통로에 접근자를 달아, 다른 세포가 지금과 똑같이 `L.X` 로 읽고 쓴다.
- **원인**: 상태 변수가 IIFE 지역 변수라, 통로에 내주려면 index.html 에 getter/setter 줄이 있어야 했다.
- **중심**: 접근자를 **그 이름의 첫 define 때** 단다. 그래서 초기값이 평가되는 자리·순서(선언 줄)가 그대로 남고, 이전 PR 은 index.html 만 바뀐다.
- **핵심**: 이미 있던 속성을 다시 정의해 덮는다(예전에 선언 줄의 초기값이 앞선 쓰기를 덮던 것과 같다) · 같은 이름 두 번은 오류 · window 에는 달지 않는다(일회 복사 줄이 제자리에서 한다).

## 3. [원칙 ③] 해결 방식

1. 기관 `js/core/app-state.js`: `put(name, value, writable)` 하나가 값을 보관하고 `OurgoalAppScope.expose('core/app-state', { get/set })` 으로 통로에 단다. 로드될 때는 전역 하나만 단다(통로·window 에 쓰지 않는다). 통로가 없으면 `SCOPE_MISSING` 으로 던진다.
2. 로드 줄: 2151행 app-scope.js · cell-registry.js 태그와 **같은 줄** 뒤에 붙인다. 통로 뒤 · IIFE 앞 · 등록 기관 commit 태그 앞이다.
3. 기관 단위 시험: 진짜 `app-scope.js` 와 진짜 기관을 vm 에 올려 계약 항목마다 잰다. 생성기가 바꿔 쓴 꾸러미를 진짜 기관 위에서 실행해 전·후 관찰값을 맞댄다.
4. 모의 이전: 기준 worktree 를 하나 더 만들어 이 PR 의 바뀐 파일을 덮고, `mock-unstate.cjs` 가 노출된 상태 이름을 전부 뽑아 하나씩 생성기에 돌려 옮길 수 있는 이름을 가른 뒤 한 번에 적용한다(커밋하지 않는다).
5. 그 사본에서: 시나리오(기준 대 사본) · 상태 탐침(이름별 값 요약 · 접근자 종류 · window 동일성 · 쓰기 왕복) · module-load · 시험 전부(`npm test` 의 네 스크립트와 `tests/*.test.js` 를 하나씩).
6. 시험이 깨지면 그 이름을 빼고 다시 적용해 같은 측정을 반복한다. 깨지는 단언은 표로 남긴다.
7. 대조군: 사본에서 기관 태그만 빼고 부팅을 잰다.

## 4. [원칙 ④] 재검토 (반례·부작용)

- 기관 태그를 등록 기관 commit 보다 뒤에 두면? commit 은 세포가 등록한 이름만 다루고 상태 이름과 겹치지 않지만, 요구는 「IIFE 안의 define 줄이 실행될 때 기관이 있을 것」이다. 통로 바로 뒤 줄에 두어 순서 의존을 없앴다.
- 로드 줄을 새 줄로 넣으면 순증가 0 을 어긴다 → 같은 줄 덧붙임(`git diff --numstat index.html` = 1/1).
- 화면 시나리오가 상태를 충분히 누르지 못한다: 게스트로 닿는 화면에서 템플릿 백과 버튼(`#personalGoalsView` 가 숨김) · 앱 평가 배너(숨은 시트 안) · 체크인 글자 수 칸(`.capture-live-meta` 가 CSS 로 숨김)은 보이지 않아 누를 수 없었다(탐침으로 실측). 그래서 시나리오는 탭 전환과 목표 하위 탭·기간까지만 재고, 상태 이름 전수는 탐침의 값 요약·접근자 종류·쓰기 왕복으로 쟀다. 탐침의 보조 조작(입력 사건을 보내 글자 수 칸이 갱신되는지)은 화면 시나리오가 아니라 페이지 안 평가다 — 그렇게 적는다.
- 실행마다 달라지는 값: 기준을 두 번 재어 거른다(L026). 두 번 사이에 달라진 이름은 비교에서 빼고 이름을 적는다.
- 시험이 붙잡는 글자: 금고 파일 `scripts/verify-integrity-gate.js` 가 index.html 에 `_promptEncyclopediaOpen = false;` 글자가 있는지 단언한다. 바꿔 쓰면 그 글자가 사라진다 → 시험을 고치지 않고 그 이름을 계획에서 뺐다. 고치는 것이 상민님의 사전 승인 범위에 드는지는 오케스트레이터가 판단한다.
- 모의 사본에서 새 파일이 git 미추적이면 `tests/cell-map-export-es414.test.js` 가 실패한다(L060) — 상태 이전과 무관한 사본 준비 문제였다. 사본에서 그 파일을 색인에 올린 뒤 다시 쟀다(커밋 없음).
- `names()` · `kindOf()` 는 계약 표에 없던 점검용 읽기 함수다. 값을 바꾸지 않는다. 설계 3.3 에 적었다.

## 5. [원칙 ⑤] 절차

1. 작업 폴더(origin/main — 처음 f1a0b06c, #907 병합 뒤 5e2fc92c 로 올려 다시 측정) · 번호 636 선점.
2. 기관 파일 → 단독 로드(`court/probes/module-load.js loadOne`) → 로드 줄 → `module-specs --write` · 설명 한 줄 → `module-guard`.
3. 기관 단위 시험 → 시나리오(기준 대 작업).
4. 모의 사본 준비 → 전 대상 모의 이전 → 시나리오 · 탐침 · 시험 전부 → 깨지는 단언 확인 → 그 이름을 뺀 계획으로 다시 → 같은 측정 → 대조군.
5. 설계 3.3 · REQ · TICKETS → `verify-integrity-gate` → `npm test` 기준/작업(전경) → 측정 집계(`measure-636.cjs`) → 주장 파일.
6. push 직전 `gh pr list` 로 철거 2차(#TASK-ES-632)의 병합 여부를 확인한다. 병합 전이면 PR 을 열지 않고 대기한다(L049: index.html 을 바꾸는 PR 은 한 번에 하나). 병합 뒤에는 origin/main 을 합쳐 다시 잰다.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 「기관만 넣는 PR 은 아무 동작도 바꾸지 않으니 모의 이전까지 할 필요가 없다」 → 이 PR 이 병합되면 다음 PR 은 index.html 만 바꿀 수 있다(법정 제약). 기관의 계약이 틀렸다면 그때는 기관을 고칠 수 없어 막다른 길이 된다. 그래서 지금 사본에서 실제로 옮겨 보고(49개), 값 요약 차이 0 · 시험 동일 · 대조군 실패를 확인한다.
- 반론 2 「값 요약(typeof · 길이 · 해시)이 같다고 동작이 같다는 보장은 없다」 → 맞다. 요약은 「같은 값이 같은 종류의 접근자로 통로에 있다」까지다. 그 위에 쓰기 가능한 이름 전부의 쓰기 왕복(쓴 값이 그대로 읽히고 되돌려지는가), window 복사의 동일성(`window[n] === scope[n]`), 화면 시나리오 둘, 시험 전부를 더했다. 로그인 뒤 화면과 숨겨진 진입로는 재지 못했다 — 측정불가로 적는다.
- 재검증: 대조군(같은 사본에서 기관 태그만 뺌)이 `TypeError: Cannot read properties of undefined (reading 'defineVar')` 로 부팅에 실패한다 — 사본의 상태 접근이 실제로 기관을 지나가고 있음을 보인다.

## 7. [원칙 ⑦] 단계별 실행

수치는 `reports/TASK-ES-636/measurement.json` 과 그 폴더의 결과 파일에서 인용한다(작업자 측정).

- 기관: 61줄, 단독 로드 전역 `["OurgoalAppState"]`. index.html 순증가 0(1줄 추가 · 1줄 삭제 = 같은 줄 덧붙임).
- 기관 단위 시험 12/12 ok(`organ-unit.json`).
- 모의 이전(전 대상): 통로에 노출된 상태 이름 63개 중 옮길 수 있는 50개를 한 번에 적용(지워지는 줄 72 · 바뀌는 줄 52). 시험 전부를 돌리면 새로 깨지는 검사는 1건이다: `scripts/verify-integrity-gate.js` 의 「[FAIL] [검증 23/23] #TASK-ES-201: 전 탭 상단 네비게이션 Sticky & 어포던스 4대 무결성 검증」(사유: 프롬프트 백과사전 아코디언 접힘 구조 누락). 붙잡힌 자리: `scripts/verify-integrity-gate.js` 954행(법정의 기준 시험지 `court/vault.json` baseTests 이자 헌법 별표 3 금고 목록의 파일) — 이름 `_promptEncyclopediaOpen` — 단언이 index.html 에 `_promptEncyclopediaOpen = false;` 글자가 있는지 본다. 같은 글자가 시험 소스에 있지만 깨지지 않은 이름은 3개(`_googleOneTapNonce` · `_modalHistoryPushed` · `REALTIME_CHANNELS_SETUP`)이며 빼지 않았다.
- 모의 이전(계획 = 그 이름을 뺀 49개: define 27 · defineVar 22 — 지워지는 줄 71 · 바뀌는 줄 51 · index.html 5259줄 → 5188줄): `npm test` 의 네 스크립트 결과와 `tests/*.test.js` 114개의 실패 집합이 기준과 같다(기준에서도 실패하는 26개는 사본에서도 같은 꼬리 글자로 실패 — npm test 경로 밖의 파일들이다).
- 상태 탐침(63개 이름): 기준 대 사본에서 값 요약 · 접근자 종류 · window 동일성 · 쓰기 왕복이 다른 이름은 0개다. 기준을 두 번 재도 달라지는 본질 변동 이름(`state`)은 비교에서 뺐다 — 옮기지 않는 이름이다. 쓰기 가능한 이름의 쓰기 왕복은 기준 30/30 · 사본 30/30.
- 시나리오 둘: 기준 · 작업 · 사본 모두 통과, 예외 0.
- 대조군: 부팅 실패.

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- 예상한 막힘(실제로 있었다): 철거 2차(#TASK-ES-632, PR #907)가 index.html 을 고치는 중이었다 → 그 PR 이 병합된 뒤(5e2fc92c) origin/main 을 합쳐 기관 시험 · 모의 이전 · 탐침 · 시나리오 · 시험 전부를 다시 쟀다. 이 PR 의 index.html 변경은 한 줄(2151행)이라 겹치지 않았다. 작업 폴더에 `npm ci --ignore-scripts` 로 의존성을 설치했다(#900 이 넓힌 시험 도우미가 @babel/parser 를 부른다 — node_modules 는 커밋되지 않는다).
- 다음 PR(실제 이전)에서 막힐 것: `_promptEncyclopediaOpen` 은 금고 시험이 붙잡는다 — 시험을 고치려면 상민님의 「금고 변경 승인」 범위인지 판단이 필요하다. 나머지 13개(맨이름 참조가 남음 7 · 같은 이름의 선언이 둘 2 · 선언문이 다른 글자와 한 줄을 나눠 씀 3 · window 복사 줄이 다른 글자와 한 줄을 나눠 씀 1)는 생성기가 멈춘다.
- 성과 측정: 이 PR 의 성과는 기관 파일이 아니라, 다음 PR 에서 계획의 이름이 실제로 옮겨져 `inlineScriptLines` 가 줄고(계획상 71줄) 앱이 그대로 도는지로 잰다.
- 판정은 법정이 낸다. 아래 주장은 작업자 측정이며 판정이 아니다.
