# REQ — #TASK-ES-683 미분화 덩어리 해체 재철거 4차: isoDate 의 가져오기·getter 줄과 참조 0 손잡이 줄(_calendarKit)

- Task ID: **TASK-ES-683** (L012: `gh pr list --state all` · `git ls-remote origin` · origin/main 의 작업표에서 683 이 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-683-unwire-4` 를 먼저 push 해 선점했다. 681 · 682 는 다른 작업 몫이다.)
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「배선 철거」**(경험칙 L069 · L072 · L073 · L075 · L102, 선례 #907 · #920 · #943 · #953). 실행기 `docs/design/harness/module-split/unwire-run.js`(apply → measure → claims)를 그대로 썼다. 새로운 점은 없다.
- 작업참고 기준 PR #934(d55d7595, 경험칙 115개) · 기준 main 9a4b6af9(#954 구역 이전 3차 병합 뒤). **생성기는 그 main 의 것 그대로다** — 열려 있는 생성기 옵션 PR(#955)의 글자는 쓰지 않는다.
- 지시함(origin/main) 열린 지시: **DIR-003**(철거 PR 마다 기준선에 inlineScriptLines 기록) · **DIR-004**((가) 「닫힌 목록(U1~U3 + X1~X9)까지다. 목록 밖의 줄 종류는 다시 결심이다.」 — 이번에 쓰는 것은 **U1(가져오기 줄) · U2(expose getter 줄) · X2(손잡이 줄 `dropKitVar`)**, 전부 목록 안이다).
- **상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d — 글자 그대로)**: 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마. 지침이나 결심이 필요한점?」
- 이 작업 세션은 빌더다. 병합은 하지 않는다(오케스트레이터 몫).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

`unwire-run.js claims` 가 주장 파일에 적는 지시 항목(R1~R4)이 정본이다. 요지:

- **R1** index.html 인라인 IIFE 에서, 등록 기관이 같은 값을 내주는 이름 `isoDate` 의 배선을 생성기(`gen-inline-hard.js` mode:"unwire", 한 칸)로 지우고 앱 동작을 보존한다(손 편집 0).
- **R2** 지운 이름은 등록 기관(own)이 같은 값으로 내준다: 철거 전 이름 목록으로 대조해 불일치 0 · 통로에서 사라진 이름 0 · 이름별 값 지문 차이 0.
- **R3** 지우는 대상은 설정이 허용한 줄 종류뿐이고 names 밖 이름·함수 본문·그 밖의 글자는 바꾸지 않는다. 바뀐 제품 파일은 index.html 하나다.
- **R4** 증명 하한: 인라인 줄 수 감소와 기준선 기록 · 모듈 로드 새 회귀 0 · npm test 검사 수 동일·폐기 0 · tests/ · 금고 · 생성기 · 등록 기관 변경 0.
- (지시 항목 밖의 보고) 이 PR 을 반영한 index.html 에서 남은 배선과 덩어리의 줄 구성을 다시 재서 보고 파일로 남긴다(주장으로 걸지 않는다).

범위 밖(지우지 않음 — 닫힌 목록 밖이라 결심 대기):

| 남기는 것 | 왜 |
|---|---|
| `var a11ySwitch = _ui.a11ySwitch;`(와 손잡이 `_ui`) | IIFE 안에서 읽는 곳이 없는 줄이지만 통로로 나가는 이름이 아니다 — 닫힌 목록의 U1 은 「등록 기관이 같은 값을 내주는 이름의 가져오기 줄」이다. 지우는 종류(`dropDeadImport`)는 #955 에 준비돼 있고 상민님 결심 대기다 |
| `renderTeamGoalsScreen` 의 가져오기 · getter(와 손잡이 `_goalsKit`) | 등록하지 않은 이름(주인 세포 800줄 상한). 옮기는 종류(`relay`)는 #955 — 결심 대기 |
| 구역 함수 `boot…` 가져오기 27줄과 호출문 · 서버 연결 세 문 | finalize(X9)의 몫. 서버 연결 세 문은 `keepInline`(#955) — 결심 대기 |

### 구체 식별자

- 파일: `index.html`(인라인 IIFE 머리의 가져오기 줄 `var isoDate = _calendarKit.isoDate;` · `OurgoalAppScope.expose('index.html', { get isoDate(){ return isoDate; } })` 문 3줄 · 손잡이 줄 `var _calendarKit = window.OurgoalCalendarKit;`) — 바뀐 제품 파일은 이것 하나.
- 실행 한 칸(`reports/TASK-ES-683/proof.json` `unwire`): `_calendarKit` 1차(가져오기·getter 모두) · 이름 `isoDate` · `dropKitVar`
- 생성기 `docs/design/harness/module-split/gen-inline-hard.js`(변경 0) · 실행기 `unwire-run.js`(변경 0) · 등록 목록 `reports/TASK-ES-677/registered-now.cjs`(변경 0)
- 새 도구(제품 코드 아님): `reports/TASK-ES-683/remaining-wiring.cjs`(#953 의 것에서 등록 목록 경로 한 줄만 바꿈) · `reports/TASK-ES-683/iife-composition.cjs`(#920 의 것 그대로)
- 화면 식별자(시나리오 12개 — #953 의 것 그대로): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnGoalsSubPersonal` · `#btnGoalsSubRoutine` · `#btnGoalsSubStats` · `#btnGoalsSubTeam` · `#homeAddGoal` · `#ngCancelBtn` · `#sanctuaryBellBtn` · `#closeNotifCenterBtn` · `#btnToggleGoalAgent` · `#goalAgentInput` · `#setTermsLink` · `#setPrivacyLink` · `#legalBody` · `#landLoginLink` · `#forgotPassBtn` · `#micBtn` · `.comm-subtab[data-sub="group"]` · `#recSamplePurgeBtn` · `#goalFastAddInput` · `#btnGoalFastAddSubmit` · `#exportRecordsBtn` · `#expThemeSel`

## 1. [원칙 ①] 문제를 정확히 파악한다

재철거 3차(#953) 때 `isoDate` 는 IIFE 안의 상태 선언(`defineVar('state', { … isoDate(…) … })`)이 맨이름으로 읽고 있어 가져오기 줄을 지울 수 없었다. 구역 이전 3차(#954)가 그 상태 선언을 구역 함수(`js/core/boot-app-state.js`)로 옮기면서 그 참조는 `L.isoDate` 가 됐고, 옮기기 생성기는 머리에 `get isoDate` expose 문 3줄을 다시 달았다. `isoDate` 는 등록 1차부터 통로용으로 등록된 이름이라 등록 기관이 같은 값을 이미 내준다. 지금 main 에서 재니(`remaining-wiring.before.json`) 등록됐는데 배선이 남은 이름은 이것 하나다(가져오기 1줄 · getter 1줄 · IIFE 안 잔존 참조 0).

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 같은 값을 두 번 내주는 줄을 걷어 낸다.
- **원인**: 옮기기 생성기는 「머리에 getter 가 없으면 단다」만 안다. 구역 이전마다 getter 가 다시 생긴다.
- **중심**: 생성기 unwire 한 칸, 설정 `reports/TASK-ES-683/proof.json`.
- **핵심**: 이번 PR 은 **닫힌 목록 안의 줄 종류만** 쓴다. 지울 수 있어 보여도 목록 밖인 줄(`a11ySwitch`)은 남긴다 — 지시함 DIR-004 (가) 「목록 밖의 줄 종류는 다시 결심이다」.

## 3. [원칙 ③] 해결 방식

1. `reports/TASK-ES-677/registered-now.cjs` 로 지금 등록된 이름 545개를 읽고, `remaining-wiring.cjs` 로 남은 배선을 잰다 → 대상 `isoDate` 하나(통로용 등록 · 잔존 참조 0 → 1차).
2. 손잡이 `_calendarKit` 의 가져오기가 그것뿐이라 `dropKitVar` 를 함께 준다(지운 뒤 맨이름 참조 0 을 생성기가 확인).
3. `unwire-run.js apply --runs _calendarKit:1:dropkit --names-for …` 로 `proof.json` 을 쓰고 생성기를 돌렸다. 생성기가 멈춘 이름 0. 지운 것은 5줄(가져오기 1 · getter 1 · 빈 expose 문의 머리·꼬리 2 · 손잡이 1).

## 4. [원칙 ④] 재검토 (반례·부작용)

- **지운 이름이 통로에서 사라지지 않는가** → 철거 전 이름 목록으로 대조: 통로에서 사라진 이름 0 · 불일치 0 · 이름별 값 지문 차이 통로 0 · window 0(`cell-registry-compare.before.json` · `cell-registry-compare.json` · `measurement.json`).
- **가져오기 줄을 지운 이름을 IIFE 가 아직 쓰는가** → 생성기가 잔존 참조를 보고 멈춘다. 멈춤 0.
- **그 이름을 읽는 구역 함수가 실제로 도는가** → 게스트 부팅이 구역 함수 `bootAppStateObject`(`js/core/boot-app-state.js` — 앱 상태의 초깃값)를 지나고 그 안에서 `L.isoDate` 를 읽는다. 시나리오 12개 전부가 그 부팅을 지난다(기준·작업 통과 · 예외 0).
- **허용 종류 밖의 줄** → 실행을 되짚어 기준 index.html 에서 작업 index.html 을 다시 만들었다: 같음(`onlyDeletions.rebuiltEqualsWork`), 허용 종류 밖 삭제 [] · names 밖 이름 [].
- **시험** → npm test 종료 코드와 검사 줄이 기준과 같고, 시험을 하나씩 돌린 결과도 같다.

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · 번호 선점 · `npm ci --ignore-scripts` · 기준 작업 폴더(분리 HEAD, 저장소 밖).
2. `registered-now.cjs` → `pinned-names.cjs` → `remaining-wiring.cjs`(철거 전) → `unwire-run.js apply` → `remaining-wiring.cjs`(철거 후) → `module-guard --update`.
3. REQ · 작업표 → npm test 와 시험 하나씩(기준 · 작업) → `unwire-run.js measure` → `unwire-run.js claims` → `iife-composition.cjs`.
4. 무결성 게이트 → 커밋 → `recomputeSplit` 직접 호출 · 로컬 법정 → push 직전 origin/main 재확인 → push 한 번 → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「`a11ySwitch` 줄도 같이 지우면 손잡이 `_ui` 까지 한 번에 없어진다」** → 지금 main 의 생성기로도 unwire 의 `names` 에 그 이름을 적으면 글자로는 지워진다(생성기의 가져오기 줄 삭제는 등록 여부를 모른다). 하지만 그것은 닫힌 목록의 U1 이 뜻하는 줄이 아니다 — 그 이름은 통로로 나가지 않고 등록 기관이 내주는 값도 없다. 목록 밖의 줄 종류는 결심 뒤에 지운다(#955 에 그 종류를 준비해 두었다).
- **반론 2 「한 이름 5줄짜리 PR 은 너무 작다」** → 이 PR 뒤에 이어지는 sweep · finalize 가 「닫힌 목록 안에서 더 지울 줄 0」을 재려면 등록된 이름의 겹친 배선이 0 이어야 한다. 이 PR 뒤 그 수는 0 이다(`remaining-wiring.json` `registered.stillWiredNames`).

### 알려진 실패 1건(기준에서도 같다 — 이 PR 과 무관)

옛 생성기 단위 시험 `unwire-check-b1.js` 의 T7 은 「작업 트리의 실제 index.html 에서 참조가 남지 않는 `_settingsKit` 가져오기를 골라 철거해 본다」는 검사인데, 재철거 3차(#953)가 그 손잡이를 지운 뒤로는 후보가 없어 「측정불가」로 실패 기록이 된다. 그 한 건이 그 시험을 다시 돌리는 겉의 묶음들(619 · 634 · 643 · 657 · 661 · 662 의 B)에 실패로 번진다. 고치지 않은 main 에서도 같다(측정 기록 — #955 의 `reports/TASK-ES-681/prev-suite-base.json`). 이 PR 은 생성기를 바꾸지 않아 그 묶음들을 돌리지 않았고, 그 시험 파일도 고치지 않았다(고치는 일은 따로 PR 이 필요하다 — 작업 끝 보고에 올린다).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-683/` 아래. 수치는 `measurement.json` 이 각 결과에서 읽어 모은 것이다.

| 파일 | 무엇 |
|---|---|
| `registered-now.json` · `pinned-names-now.json` | 지금 등록된 이름 545개 · 글자 검색 결과 |
| `proof.json` · `unwire-meta.json` · `raw-runs.txt` · `raw-names-for.txt` | 생성기 설정(한 칸) · 산출 기록 · apply 에 준 인자 |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 대조 탐침(철거 전 이름 목록으로 고정) |
| `scenario-local.json` · `scenarios/` | 시나리오 12개 기준·작업 |
| `module-load.json` · `raw/` · `tests-base.json` · `tests-work.json` | 모듈 로드 · npm test · 시험 하나씩 |
| `measurement.json` · `claims.json` | 측정 모음 · 주장 |
| `remaining-wiring.before.json` · `remaining-wiring.json` · `iife-composition.json` | 남은 배선(철거 전·후) · 덩어리의 줄 구성 |
| `court-local.json` | `recomputeSplit` 직접 호출과 로컬 법정 실행 기록(작업자 PC — 판정 아님) |

### 이 PR 뒤 남는 가져오기 29개(`remaining-wiring.json`)

| 묶음 | 수 | 무엇이 되면 풀리는가 |
|---|--:|---|
| 구역 함수 `boot…`(등록 대상 아님) | 27 | finalize(X9 — 닫힌 목록 안)가 가져오기·호출 줄을 부팅 파일로 옮긴다. 다만 finalize 의 전제를 아래 둘과 서버 연결 세 문이 막는다 |
| `renderTeamGoalsScreen`(getter 1줄도 남음) | 1 | 목록 밖 — `relay`(#955) 결심 뒤 |
| `a11ySwitch` | 1 | 목록 밖 — `dropDeadImport`(#955) 결심 뒤 |

등록된 이름 가운데 배선이 남은 것 0. 남은 손잡이 3개: `_uiKit`(구역 함수 27) · `_goalsKit`(`renderTeamGoalsScreen`) · `_ui`(`a11ySwitch`).

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 법정의 생성기 재실행 대조가 로컬과 다를 수 있다 → push 전에 `recomputeSplit` 을 직접 부른다(L070 · L088).
- **측정불가**: 로그인 뒤의 동작 · 운영 환경.
- **성과 측정**: 지운 줄 5(index.html). `inlineScriptLines` 전→후와 기준선 기록은 `measurement.json` `summary.inlineScriptLines` · `docs/architecture/module-baseline.json` 마지막 기록. 남은 가져오기 30 → 29 · 통로 getter 이름 2 → 1 · 손잡이 4 → 3.
