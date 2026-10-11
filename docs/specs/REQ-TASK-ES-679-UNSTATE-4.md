# REQ — #TASK-ES-679 미분화 덩어리 해체 상태 이전 4차: 앱 상태 객체(`state`)와 프롬프트 서랍 접힘 값(`_promptEncyclopediaOpen`)의 소유를 상태 기관으로

- Task ID: **TASK-ES-679** (L012: `gh pr list --state all` · `git ls-remote origin` · `docs/rules/TICKETS.md` 에서 679 가 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-679-unstate-4` 를 먼저 push 해 선점했다. 677 · 678 은 다른 작업의 브랜치·PR 이 이미 있다.) · 분류: INFRA(미분화 덩어리 해체)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main) 열린 지시: **DIR-003**(줄을 지우는 PR 마다 기준선에 inlineScriptLines 기록) · **DIR-004**((가) 닫힌 목록 X4·X5·X6 — 상태 변수의 소유를 상태 기관으로).
- 작업 유형(SNOWBALL 분류): **(가) 표준 — 「상태 이전」 넷째 사례**. 선례 #914 · #927 · #941(#TASK-ES-673 상태 이전 3차)의 절차·실행기·증거 꼴을 그대로 따른다(적용 → 측정 → 주장을 실행기 하나로 · 기준선 기록 · 되짚기 · push 전 로컬 법정). 작업참고 **기준 PR #941**(3c9b9335, 경험칙 119개 — L002 · L010 · L012 · L047 · L064).
- 선행 PR: **#949**(#TASK-ES-672 — `state` 를 맨이름으로 읽던 전문 템플릿 기록 창 조각 함수 여섯이 세포로 갔다) · **#947 · #948**(무결성 게이트와 시험 도우미가 「옛 선언 글자 또는 인라인·세포의 상태 기관 호출(같은 이름·같은 초기값)」을 본다) · **#951**(#TASK-ES-676 구역 이전 2차).
- 이 작업 세션은 빌더(서브에이전트)다. 병합은 하지 않는다(오케스트레이터 몫). push 는 번호 선점 1회 + 마무리 1회다.
- 기준 main: **67ca0e4a**(#951 병합 뒤). push 직전에 origin/main 을 다시 확인했다.
- 설계 정본: `docs/architecture/CELL-REGISTRY-DESIGN.md` 3.3 · 4절 · 5.5 · 5.8.
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 원문의 어느 문장 | 완료 기준 |
|---|---|---|---|
| R1 | index.html 인라인 IIFE 에 남은 통로 노출 상태 이름 2개의 소유를 상태 기관으로 옮긴다 — 생성기 unstate 한 번(손 편집 0). 앱 동작은 그대로다 | 「남은 미분화작업 모두 진행」 · DIR-004 | 게스트 화면 시나리오 넷(여섯 탭 · 기록 저장→다시 열기→새로 고침 유지 · 일정 연동 저장 · 행 지우고 저장)이 기준·작업 통과 · 법정의 생성기 재실행 결과와 index.html 이 바이트 동일 |
| R2 | 옮긴 이름은 상태 기관이 같은 값 · 같은 종류의 접근자로 통로에 내준다 | 설계 3.3 · 증명은 #941 과 같게 | 상태 탐침 차이 0 · 기관이 맡은 이름 67 = 65 + 2 · 통로·window 값 지문 차이 0 · 사라진 이름 0 · 인라인에 선언 없이 남은 참조 0 |
| R3 | 지우고 바꿔 쓰는 대상은 닫힌 목록 X4·X5·X6 의 줄뿐 · names 밖 이름 · 그 밖의 글자 불변 · 바뀐 제품 파일은 index.html 하나 | DIR-004 (가) | 되짚기 결과 == 작업 index.html · 종류 밖 삭제 줄 0 · names 밖 이름 0 |
| R4 | 증명 하한과 기준선 기록 | 설계 4절 · DIR-003 | inlineScriptLines 감소와 `module-guard --update` 기록 · 모듈 로드 새 회귀 0 · npm test 기준/작업 같음 · 무결성 게이트 38/38 · tests/ · 금고 · 생성기 · 상태 기관 변경 0 |
| R5 | 남은 상태 이름과 finalize 전제까지 남은 것 표 | 오케스트레이터 지시 | `reports/TASK-ES-679/remaining-state.json` · `finalize-gap.json` |
| R6 | `state`: 접근자 종류 · 초기값 글자 · window 복사 · 같은 객체(동일성) · 통째 대입 쓰기 왕복 · 템플릿 부품의 `getState` | 오케스트레이터 지시 | 접근자 기준·작업 get+set · 초기값 글자 바이트 동일 · 통로 · window.state · getState() 가 같은 객체 · 통째 대입 왕복이 기준과 같음 |
| R7 | `_promptEncyclopediaOpen`: 초기값 `false` 그대로 · 무결성 게이트 38/38 | 오케스트레이터 지시 | 초기값 글자 바이트 동일 · 처음 값 false · 그 값을 읽고 쓰는 세포 함수가 기준과 같이 돎 · 게이트 종료 코드 0 |

- 원문에 있는데 이 PR 항목에 없는 요구(목표 줄에 남긴다): 이 PR 로 생기는 상태 기관 정의 줄 둘의 구역 이전(구역 이전 3차 — 재철거 3차 병합 뒤) · 서버 주소·공개 키 선언과 `sb` 정의 줄(결심 대기) · 재철거 3차 · sweep · finalize. 「병합도 스스로」 — 이 PR 의 병합은 판정 뒤 오케스트레이터가 한다(이 작업자는 병합하지 않는다).

### 구체 식별자

- 고친 제품 파일: `index.html` 하나(+2 −9).
  - 지운 7줄: `state` 의 expose getter/setter 속성 2줄(`get state(){ return state; }` 만 있던 expose 문 하나와, 다른 이름들과 함께 있던 `get state(){…}, set state(v){…},` 한 줄) · `_promptEncyclopediaOpen` 의 속성 1줄 · 속성이 모두 지워진 expose 문 2개의 머리·꼬리 4줄.
  - 바꿔 쓴 2줄: `var state = { profile: null, activeTab: 'home', … };` → `window.OurgoalAppState.defineVar('state', { … });` · `var _promptEncyclopediaOpen = false;` → `window.OurgoalAppState.defineVar('_promptEncyclopediaOpen', false);`. 초기값 글자는 그대로다(바이트 비교 — 510바이트 · 6바이트).
- 그 이름을 읽고 쓰는 세포(변경 0 — 글자 `L.이름` 그대로): `L.state` 를 읽는 줄 1,468 · 통째로 대입하는 자리 2(`js/tabs/records/archive-toggle.js` 23행 · `js/tabs/records/render.js` 53행 — 둘 다 `if(!L.state) L.state = {};`) · window 복사는 구역 함수 `bootExposeAppState`(`js/core/boot-early-state.js` — `window.state = L.state;`) · 템플릿 부품 초기화는 `bootTemplatePartHandles`(`js/core/boot-app-handles.js` — `getState: function(){ return L.state; }`). `L._promptEncyclopediaOpen` 은 `js/tabs/goals/prompt-encyclopedia.js` 가 읽고(3줄) 쓴다(6곳).
- 새 도구(제품 코드 아님): `reports/TASK-ES-679/unstate-run.cjs`(#941 의 실행기를 본뜸) · `tools/state-object-probe.cjs`(상태 객체 탐침) · `tools/finalize-gap-679.cjs`(#951 의 조사 도구를 본뜸)
- 기록: `docs/architecture/module-baseline.json`(72번째 항목) · `docs/rules/TICKETS.md` · `reports/TASK-ES-679/`
- 손대지 않은 것: `js/**` 전부 · 생성기 · tests/ · 금고 · 생성 지도 3종
- 화면 식별자(시나리오): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` 와 #949 의 기록 창 시나리오 셋(`reports/TASK-ES-672/scenarios/` 의 s10 · s11 · x1 — 단계 그대로)이 쓰는 식별자. 탐침이 만지는 요소: `.navbtn[data-tab="goals"]` · `#btnTogglePromptAccordion` · `#promptEncyclopediaDrawer`(문서 밖 요소에 그린 것)

## 1. [원칙 ①] 문제를 정확히 파악한다

- `state` 는 앱의 중심 상태 객체다(열쇠 32개 — 프로필 · 열린 탭 · 고른 목표 등). 세포 대부분이 `L.state` 로 읽고 그 속성을 바꾼다. 지금까지는 IIFE 에 남은 함수가 맨이름으로 읽어 옮길 수 없었고, #949 가 그 함수들을 세포로 옮긴 뒤 맨이름 참조가 0 이 됐다.
- `_promptEncyclopediaOpen` 은 프롬프트 백과사전 서랍이 펼쳐져 있는지를 담는 참/거짓 값이다. 무결성 게이트가 index.html 에서 `_promptEncyclopediaOpen = false;` 글자를 찾아 옮길 수 없었고, #947 · #948 뒤로 게이트가 상태 기관 호출(같은 이름·같은 초기값)도 받는다.
- 기준 main(67ca0e4a)에서 통로에 노출된 상태 이름은 이 둘뿐이고, 생성기는 둘 다 옮길 수 있다고 판단한다(멈춤 0).

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 상태 하나에 주인 하나. 값은 기관이 보관하고 통로의 접근자도 기관이 단다.
- **원인**: 값이 IIFE 지역 변수여서 이름마다 getter/setter 줄이 index.html 에 있어야 했다. 그 줄과 선언문이 IIFE 를 비우는 일(finalize)을 막는다.
- **중심**: 생성기 unstate 한 번, 설정 `reports/TASK-ES-679/proof.json`(`unstate.names` 2개).
- **핵심**: ① `state` 가 읽기쓰기로 가는가(통째로 대입하는 세포가 있다 — 생성기는 마지막 노출 문에 `set` 이 있었는지로 정한다, L047). ② 읽는 쪽이 전부 **같은 객체**를 받는가(통로 · window 복사 · 템플릿 부품의 getState). ③ `_promptEncyclopediaOpen` 의 초기값 글자가 `false` 그대로이고 게이트가 통과하는가.

## 3. [원칙 ③] 해결 방식

1. 대상을 다시 잰다: 통로에 노출된 상태 이름 2개를 하나씩 생성기에 돌린다 → 옮길 수 있음 2 · 멈춤 0.
2. `unstate-run.cjs apply` → `module-guard --update` → 무결성 게이트.
3. 시나리오 넷: 게스트 여섯 탭 + #949 의 기록 창 시나리오 셋(저장→다시 열기→수정 저장→새로 고침 유지 · 일정 연동 저장 · 행을 지우고 저장) — 상태를 쓰고 읽는 조작이다.
4. `unstate-run.cjs measure` — #941 의 측정 전부 + 상태 객체 탐침(기준 2회 · 작업) + 초기값 글자 바이트 비교 + finalize 전제 조사.
5. `claims`.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **`state` 의 접근자** → 노출 줄이 둘이었다(앞은 get 만, 뒤는 get+set). 생성기는 마지막 노출 문을 본다 — `defineVar`. 통로 접근자는 기준 get+set · 작업 get+set, 주인은 `index.html` → `core/app-state`.
- **같은 객체인가** → 작업 트리에서 통로의 `state` · `window.state` · 템플릿 부품 초기화가 받은 `getState()` 가 같은 객체다(기준과 같다). 속성 하나를 달면 셋 모두에서 보이고, 떼면 사라진다. 목표 탭을 누른 뒤 셋의 `activeTab` 이 모두 `goals` 다(화면 조작이 같은 객체를 바꾼다).
- **통째로 다시 대입(쓰기 왕복)** → 통로에 새 객체를 쓰면 통로와 `getState()` 는 새 객체를 돌려주고 `window.state` 는 예전 객체 그대로다(복사는 로드 때 한 번뿐 — 기준에서도 그렇다). 되돌림이 된다. 기준과 작업의 기록이 같다.
- **통째 대입하는 세포 자리가 실제로 도는가** → 두 자리 다 `if(!L.state) L.state = {};` 꼴이라 상태가 비어 있을 때만 돈다. 화면 조작으로는 닿지 않았다(측정불가 — 통로에 직접 대입하는 왕복으로만 쟀다).
- **초기값 글자** → 두 선언 줄에서 선언 머리(`var X =` → `window.OurgoalAppState.defineVar('X',`)와 끝(`;` → `);`)만 바뀌었다. 머리·끝을 뗀 글자가 기준과 바이트 단위로 같다(`state` 510바이트 한 줄 · `_promptEncyclopediaOpen` 6바이트 `false`).
- **`_promptEncyclopediaOpen` 과 무결성 게이트** → 옮긴 뒤 게이트 38/38(종료 코드 0). 처음 값은 기준·작업 모두 false. 그 값을 읽는 그리기 함수(`renderPromptEncyclopediaHtml`)가 거짓이면 서랍을 `display:none`, 참이면 `display:block` 으로 그리고, 머리 줄 단추 처리기(`#btnTogglePromptAccordion`)가 값을 뒤집는다 — 기준과 같다. 이 서랍은 목표 상세 화면에 있어 게스트(목표 없음)의 화면 시나리오로 닿지 않아 페이지 안에서 그 함수들을 직접 불러 쟀다.
- **선언 전에 읽는 자리** → 선언문은 자리를 옮기지 않았다(초기값 계산 순서 그대로). 기준에서는 통로 getter 가 선언보다 앞줄에서 달렸고(읽으면 undefined), 작업에서는 정의 줄에 와서야 통로에 이름이 생긴다(읽으면 undefined). 값은 같다. 게스트 부팅 예외 수는 기준과 같다(0).
- **허용 종류 밖의 줄** → 되짚기 결과 == 작업 index.html, 종류 밖 삭제 줄 0, names 밖 이름 0.

## 5. [원칙 ⑤] 절차

1. origin/main(67ca0e4a) 기준 worktree · 번호 선점 · `npm ci --ignore-scripts` · 기준 트리.
2. 상태 객체 탐침 작성(이전 전 트리에서 먼저 돌려 봄) → 실행기 → `apply` → `module-guard --update` → 게이트.
3. 시험: npm test(기준 · 작업) · 시험 하나씩(기준 · 작업) → 시나리오 → `measure`.
4. REQ · 작업표 → `claims` → npm test 작업 트리 다시(L064).
5. `verify-integrity-gate` → 커밋 → `recomputeSplit` 직접 호출과 로컬 법정 전체 실행 → origin/main 확인 → push 1회 → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「상태 탐침에서 `state` 는 본질 변동이라 비교에서 빠진다 — 쟀다고 할 수 있나」** → 맞다. 상태 탐침의 값 요약은 `state` 에서 잴 때마다 달라져(기준 2회가 서로 다르다) 비교에서 걸러진다. 그래서 값 요약이 아니라 **동일성**을 재는 상태 객체 탐침을 따로 만들었다(같은 객체인지 · 제자리 변경 · 통째 대입 · 화면 조작 뒤의 값). 그 기록은 기준을 두 번 돌려도 같고, 주인 표시·기관 종류를 가리면 작업과 통째로 같다.
- **반론 2 「화면 시나리오가 상태를 쓰고 읽는가」** → 기록 창 시나리오 셋은 기록을 저장하고(상태의 기록 목록에 들어감) 창을 다시 열어 값이 들어 있는지, 새로 고침 뒤에도 남는지를 본다. #949 가 만든 시나리오를 단계 그대로 가져왔다.
- **반론 3 「프롬프트 서랍은 화면으로 안 눌러 봤다」** → 맞다. 화면 시나리오가 아니라 페이지 안 평가다. 읽는 함수와 쓰는 처리기를 실제로 불러 값이 통로를 거쳐 오가는 것을 봤다. 8절에 한계로 적는다.
- **재검증(되짚기)**: 기준 index.html 2,854줄에서 생성기가 적어 낸 7줄을 빼고, 선언 머리 2 · 선언 끝 2 를 정해진 글자로 바꿔 쓴 결과가 작업 index.html 2,847줄과 글자 그대로 같다.
- **재검증(시험 전부)**: 스크립트 넷과 `tests/*.test.js` 115개를 하나씩 돌린 결과가 기준과 같다(실패 집합 26 = 26, 작업에서만 깨진 것 0).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-679/` 아래. 수치는 `measurement.json` 이 각 결과에서 읽어 모은 것이다(L002).

| 파일 | 무엇 |
|---|---|
| `proof.json` | 생성기 설정: `mode:"unstate"` · `unstate.names` 2개 · cells `js/core/app-state.js` |
| `unstate-meta.json` | 생성기 산출 — defineVar 2 · 지운 줄 7 · 바뀐 줄 2 · index.html 2854 → 2847줄 · 옮길 수 있음 2 · 멈춤 0 · 노출 안 됨 2 |
| `state-probe.{base,base2,work}.json` · `probe-names.json` | 상태 탐침: 이름 2개 · 차이 0(본질 변동 `state` 제외) · 기관 이름 67 = 기준 65 + 설정 2 · 쓰기 왕복 2/2 |
| `state-object-probe.{base,base2,work}.json` | 상태 객체 탐침: 주인 표시·기관 종류를 가리면 기준과 작업이 통째로 같다 · 기준 2회가 서로 같다 |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 등록 기관 대조: 불일치 0 · 통로에서 사라진 이름 0 · 통로·window 값 지문 차이 0 |
| `scenario-local.json` | 시나리오 4개 기준·작업 통과(비공허 단언 13 · 15 · 14 · 20), 예외 0/0 |
| `module-load.json` · `npm-test-compare.json` · `tests-{base,work}.json` · `raw/` | 모듈 로드 새 회귀 0 · npm test 기준/작업 같음(✓ 487 = 487 · ok 203 = 203) · 시험 하나씩 실패 집합 같음 |
| `measurement.json` | 위 전부 + 제품 파일 = index.html 하나 · 되짚기 결과 == 작업 index.html · inlineScriptLines 584 → 577(−7 = 지운 줄 수) · 기준선 마지막 기록 = 측정값 · module-guard 종료 0 · 무결성 게이트 38/38 · 초기값 글자 바이트 동일 |
| `remaining-state.json` · `finalize-gap.json` · `finalize-gap.base.json` | 남은 상태 이름 2개 · finalize 전제까지 남은 것(작업 · 기준) |
| `claims.json` | 주장(보존 4 + 기록) |
| `court-local.json` | 로컬 법정 전체 실행 요약(작업자 PC — 판정 아님) |

### finalize 전제까지 남은 것 — 문 종류별(이 PR 을 반영한 index.html)

생성기 finalize 를 임시 사본에 돌린 오류 글자: 「전제 미충족 — … 밖의 문이 72개 있다(expose 문 6 · 그 밖의 var 2 · 상태 선언(define) 3 · 호출되지 않는 가져오기 61)」. 아래 수는 `finalize-gap.json` 의 것이고 그 글자와 같다. 줄 수는 문이 차지하는 줄만 센 것이다. 기준은 67ca0e4a 다.

| 종류 | 문 수(기준 → 작업) | 줄 수(작업) | 풀리는 조건 |
|---|---|---|---|
| 그 밖의 가져오기(최상위에서 불리지 않음) | 61 → 61 | 61 | 재철거 3차(unwire U1) |
| expose 문(통로 getter·setter) | 8 → 6 | 71 | 재철거 3차(unwire U2). 이 PR 이 `state` · `_promptEncyclopediaOpen` 의 것 둘을 지웠다 |
| 상태 선언(var) | 4 → 2 | 2 | `SUPABASE_URL` · `SUPABASE_ANON_KEY`: 공개 키 글자가 든 줄을 새 파일에 더하는 커밋을 금지 패턴 규칙이 막는다 → 결심 대기 |
| 상태 기관 정의 줄(define) | 1 → 3 | 3 | **`state` · `_promptEncyclopediaOpen`(이 PR 로 새로 생긴 정의 줄 둘): 다음 작업 — 구역 이전 3차로 구역 함수에 넣는다(재철거 3차 병합 뒤)**. `sb`: 위의 두 선언과 한 묶음(같은 결심) |
| **막는 문 합계** | **74 → 72** | **137**(기준 144) | |
| 키트 손잡이 · 구역 함수 가져오기 · 구역 함수 호출문(finalize 가 받는 것) | 60 → 60 | 60 | 손잡이 10 · 가져오기 25 · 호출문 25 |

- 남은 상태 이름(var) 2개: `SUPABASE_URL` · `SUPABASE_ANON_KEY` — 통로에 노출되지 않아 상태 기관 대상이 아니다(위 표).

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 등록 3차(#950 — js 등록 블록만)가 먼저 병합될 수 있다 → push 직전에 합치고 대조 탐침과 npm test 를 다시 확인한다. index.html 을 바꾸는 다른 PR 은 이 PR 이 병합될 때까지 올라오지 않게 순서가 잡혀 있다(오케스트레이터).
- **예상**: 법정의 생성기 재실행 대조 → push 전 `recomputeSplit` 직접 호출과 로컬 법정 전체 실행.
- **측정불가**: 상태를 통째로 다시 대입하는 세포 자리(상태가 비어 있을 때만 도는 줄) · 프롬프트 서랍의 화면 조작(목표 상세 화면 — 게스트에게 목표가 없다) · 로그인 뒤 화면 · 운영 환경.
- **성과 측정**: inlineScriptLines 584 → 577(−7, 출처 `measurement.json` `summary.inlineScriptLines`). 인라인 IIFE 의 상태 이름(var) 4 → 2. 통로에 `index.html` 주인으로 노출된 상태 이름 2 → 0. finalize 를 막는 문 74 → 72.
