# REQ — #TASK-ES-684 미분화 덩어리 해체 재철거 5차: 읽는 곳이 없는 가져오기 줄 a11ySwitch 와 참조 0 손잡이 줄(_ui)

- Task ID: **TASK-ES-684** (L012: `gh pr list --state all` · `git ls-remote origin` · origin/main 의 작업표에서 684 가 비어 있음을 확인한 뒤 빈 브랜치를 먼저 push 해 선점했다. 선점 때의 가지 이름은 `feat/2026-10-11-task-es-684-sweep` 였다 — 빈 구획 쓸기를 하려던 번호인데, 그 작업은 하지 않게 돼(finalize 가 주석·빈 줄을 함께 정리한다 — 오케스트레이터 지시) 같은 번호를 이 재철거에 쓰고 가지 이름을 `feat/2026-10-11-task-es-684-unwire-5` 로 바꿨다. 681 · 682 · 683 은 다른 작업 몫이다.)
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「배선 철거」**(경험칙 L069 · L072 · L073 · L075 · L102, 선례 #907 · #920 · #943 · #953 · #956). 실행기 `docs/design/harness/module-split/unwire-run.js`(apply → measure → claims)를 그대로 썼다. 새로운 점은 **`dropDeadImport` 의 첫 실사용**이다(옵션은 #955 가 만들었고 단위 시험과 모의 적용까지 있었다).
- 작업참고 기준 PR #934(d55d7595, 경험칙 115개) · 기준 main 6da0375a(#955 생성기 옵션 셋 병합 뒤). **생성기 · 실행기는 그 main 의 것 그대로다**(이 PR 에서 변경 0).
- 지시함(origin/main) 열린 지시: **DIR-003**(철거 PR 마다 기준선에 inlineScriptLines 기록) · **DIR-004**((가) 「닫힌 목록(U1~U3 + X1~X9)까지다. **목록 밖의 줄 종류는 다시 결심이다.**」 — 이번에 지우는 가져오기 줄은 **목록 밖**이다. 아래 결심 기록으로 승인됐다. 손잡이 줄은 X2(`dropKitVar`), 목록 안이다).
- **결심 기록(2026-10-11, 커맨드센터 세션 309dca5d — 오케스트레이터가 전한 글자. 이 작업자는 그 채팅을 직접 보지 못했다)**
  - 오케스트레이터가 [결심 필요] 로 여쭌 세 가지: ① 서버 주소 · 공개 키 · 서버 연결 세 줄: 키 커밋 금지 규칙은 그대로 두고 **제자리 인라인에 남김**(권장) ② `renderTeamGoalsScreen` 통로 연결 2줄을 **글자 그대로 옮김**(권장) ③ 아무도 읽지 않는 가져오기 한 줄 `a11ySwitch` **삭제**(권장)
  - 상민님 답 원문: **「권장대로 모두 진행」**
  - 이 PR 은 그 가운데 **③ 하나**를 적용한다. **한도: 그 세 자리 밖(다른 문 · 다른 이름)에 이 옵션을 쓰지 않는다** — 이 PR 의 `dropDeadImport` 에 적은 이름은 `a11ySwitch` 하나다.
- **상민님 지시 원문(2026-10-11, 같은 세션 — 글자 그대로)**: 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마. 지침이나 결심이 필요한점?」
- 이 작업 세션은 빌더다. 병합은 하지 않는다(오케스트레이터 몫).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

`unwire-run.js claims` 가 주장 파일에 적는 지시 항목(R1~R4)이 정본이다. 요지:

- **R1** index.html 인라인 IIFE 에서 읽는 곳이 없는 가져오기 줄 `var a11ySwitch = _ui.a11ySwitch;` 와, 그 줄이 없어져 참조가 0 이 된 손잡이 줄 `var _ui = window.OurgoalUiHelpers;` 를 생성기(`gen-inline-hard.js` mode:"unwire", 한 칸)로 지우고 앱 동작을 보존한다(손 편집 0).
- **R2** 지워서 달라지는 값이 없다: 그 이름은 지우기 전에도 통로에 없던 이름이고, 키트의 그 속성은 브라우저에서 데이터 속성이다(읽기만으로 부수효과가 없다). 철거 전 이름 목록으로 대조해 불일치 0 · 통로에서 사라진 이름 0 · 이름별 값 지문 차이 0.
- **R3** 지우는 대상은 설정이 허용한 줄 종류뿐이고(등록 이름 `names` 는 비었다 — `dropDeadImport` 의 한 이름과 손잡이 줄) 그 밖의 글자는 바꾸지 않는다. 바뀐 제품 파일은 index.html 하나다.
- **R4** 증명 하한: 인라인 줄 수 감소와 기준선 기록 · 모듈 로드 새 회귀 0 · npm test 검사 수 동일·폐기 0 · tests/ · 금고 · 생성기 · 등록 기관 변경 0.
- (지시 항목 밖의 보고) 이 PR 을 반영한 index.html 에서 남은 배선과 덩어리의 줄 구성을 다시 재서 보고 파일로 남긴다(주장으로 걸지 않는다).

범위 밖(지우지 않음 — 다음 PR finalize 의 몫):

| 남기는 것 | 왜 |
|---|---|
| `renderTeamGoalsScreen` 의 가져오기 · getter(와 손잡이 `_goalsKit`) | 결심 ② — finalize 의 `relay` 가 글자 그대로 다룬다 |
| 서버 주소 · 공개 키 선언 2줄 + `sb` 상태 선언 | 결심 ① — finalize 의 `keepInline` 이 제자리 인라인에 남긴다 |
| 구역 함수 `boot…` 가져오기 27줄과 호출문 · 손잡이 `_uiKit` · 구획 주석·빈 줄 | finalize(X9) |

### 구체 식별자

- 파일: `index.html`(인라인 IIFE 머리의 손잡이 줄 `var _ui = window.OurgoalUiHelpers;` · 가져오기 줄 `var a11ySwitch = _ui.a11ySwitch;`) — 바뀐 제품 파일은 이것 하나.
- 실행 한 칸(`reports/TASK-ES-684/proof.json` `unwire`): `_ui` 1차 · `names: []` · `dropKitVar` · `dropDeadImport: [{ name: "a11ySwitch", reason, definedIn: "js/core/ui-helpers.js" }]`(입력 `reports/TASK-ES-684/dead-imports.json`)
- 생성기 `docs/design/harness/module-split/gen-inline-hard.js`(변경 0) · 실행기 `unwire-run.js`(변경 0 — `apply --dead-imports`) · 등록 목록 `reports/TASK-ES-677/registered-now.cjs`(변경 0)
- 키트: `window.OurgoalUiHelpers.a11ySwitch`(`js/core/ui-helpers.js` — 설정 탭 세포 여섯이 키트에서 직접 부른다. 이 PR 은 그 파일을 바꾸지 않는다)
- 새 도구(제품 코드 아님): `reports/TASK-ES-684/remaining-wiring.cjs`(#956 의 것에서 경로 한 줄만 바꿈) · `reports/TASK-ES-684/iife-composition.cjs`(#920 의 것 그대로)
- 화면 식별자(시나리오 12개 — #956 의 것 그대로): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnGoalsSubPersonal` · `#btnGoalsSubRoutine` · `#btnGoalsSubStats` · `#btnGoalsSubTeam` · `#homeAddGoal` · `#ngCancelBtn` · `#sanctuaryBellBtn` · `#closeNotifCenterBtn` · `#btnToggleGoalAgent` · `#goalAgentInput` · `#setTermsLink` · `#setPrivacyLink` · `#legalBody` · `#landLoginLink` · `#forgotPassBtn` · `#micBtn` · `.comm-subtab[data-sub="group"]` · `#recSamplePurgeBtn` · `#goalFastAddInput` · `#btnGoalFastAddSubmit` · `#exportRecordsBtn` · `#expThemeSel`

## 1. [원칙 ①] 문제를 정확히 파악한다

인라인 IIFE 머리에 `var a11ySwitch = _ui.a11ySwitch;` 줄이 있다. IIFE 안에서 이 지역 변수를 읽는 곳은 없다 — 설정 탭의 함수들이 세포로 옮겨 가면서 전부 키트(`window.OurgoalUiHelpers.a11ySwitch`)를 직접 부르게 됐다. 통로(expose)로도 window 로도 나가지 않는 이름이라 등록 기관과 무관하고, 그래서 배선 철거의 「등록 기관이 같은 값을 내주는 이름」(U1)에 들지 않아 재철거 1~4차가 지우지 못했다. finalize(X9)는 「호출되지 않는 가져오기」가 있으면 전제에서 멈춘다 — 이 줄이 마지막 단계를 막는 문 여섯 가운데 하나다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 아무도 읽지 않는 줄을 지운다. 앱이 쓰는 값은 하나도 달라지지 않는다.
- **원인**: 옮기기 생성기는 함수가 떠날 때 그 함수만 쓰던 가져오기 줄을 따라 지우지 않는다(통로로 나가는 이름만 다룬다).
- **중심**: 생성기 unwire 한 칸, 설정 `reports/TASK-ES-684/proof.json`(`dropDeadImport` 한 이름 + `dropKitVar`).
- **핵심**: 「읽는 곳이 없다」와 「읽기만으로 부수효과가 없다」를 둘 다 재야 한다 — 앞의 것은 생성기가(참조 · 글자열 · eval/new Function/with · getter · 대입을 보고 하나라도 있으면 멈춘다), 뒤의 것은 브라우저의 속성 기술자로(접근자면 그 줄의 읽기가 코드를 돌린다).

## 3. [원칙 ③] 해결 방식

1. `dead-imports.json` 에 이름 하나(`a11ySwitch`)와 근거 글자 · 정의 파일을 적는다.
2. `unwire-run.js apply --runs _ui:1:dropkit --names-for "_ui:1:dropkit=" --dead-imports …` 로 `proof.json` 을 쓰고 생성기를 돌렸다. 생성기가 멈춘 이름 0. 지운 것은 2줄(가져오기 1 · 손잡이 1). 손잡이 `_ui` 는 그 가져오기가 마지막 사용처라 `dropKitVar` 로 함께 지워진다(지운 뒤 맨이름 참조 0 을 생성기가 확인).
3. `module-guard --update`(낮아진 값) → 측정(실행기 measure — 속성 기술자 탐침 포함) → 주장.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **읽는 곳이 정말 없는가** → 생성기의 정지 조건(IIFE 안 맨이름 참조 · 글자열 속 이름 · eval/new Function/with · getter · 대입 · 단순 꼴이 아닌 초기화)에 하나도 걸리지 않았다(멈춤 0). 생성기와 따로, 지운 뒤의 index.html 을 다시 파싱해 그 이름의 참조가 0 임을 실행기가 확인한다.
- **그 줄의 읽기 자체가 무언가를 하는가** → 기준·작업 트리의 브라우저에서 `Object.getOwnPropertyDescriptor(window.OurgoalUiHelpers, 'a11ySwitch')` 가 데이터 속성(함수 값)이다(`measurement.json` `summary.deadImports`). 접근자가 아니니 읽기만으로 도는 코드가 없다.
- **키트의 그 함수는 그대로인가** → 이 PR 은 `js/**` 를 바꾸지 않는다. 지운 뒤에도 키트의 속성은 같은 꼴이다(작업 트리 탐침).
- **통로에서 사라지는 이름** → 그 이름은 지우기 전에도 통로에 없었다. 철거 전 이름 목록으로 대조: 통로에서 사라진 이름 0 · 불일치 0 · 이름별 값 지문 차이 통로 0 · window 0.
- **손잡이 `_ui` 를 다른 줄이 쓰는가** → 생성기가 지운 뒤의 맨이름 참조 0 을 확인하고서만 손잡이 줄을 지운다.
- **허용 종류 밖의 줄** → 실행을 되짚어 기준 index.html 에서 작업 index.html 을 다시 만들었다: 같음(`onlyDeletions.rebuiltEqualsWork`), 허용 종류 밖 삭제 [] · names 밖 이름 [].
- **설정 탭이 실제로 도는가** → 시나리오 12개 가운데 설정 탭을 여는 것(약관 · 개인정보 링크, 테마 선택)이 키트의 그 함수가 그린 스위치가 있는 화면을 지난다 — 기준·작업 통과 · 예외 0.
- **시험** → npm test 종료 코드와 검사 줄이 기준과 같고, 시험을 하나씩 돌린 결과도 같다.

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · 번호 선점(위) · `npm ci --ignore-scripts`.
2. 준비 모의(저장소 밖 사본, #955 가지의 생성기): 같은 설정으로 돌려 2줄이 지워지고 npm test 가 같음을 미리 확인.
3. #955 병합 뒤 그 main 에서 `unwire-run.js apply` → `module-guard --update`.
4. REQ · 작업표 → npm test 와 시험 하나씩(기준 · 작업) → `unwire-run.js measure` → `claims` → 남은 배선 · 덩어리 구성 측정.
5. 무결성 게이트 → 커밋 → `recomputeSplit` 직접 호출 · 로컬 법정 → push 직전 origin/main 재확인 → push 한 번 → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「한 줄 지우자고 PR 하나를 쓰나 — finalize 에 넣으면 된다」** → finalize 는 「옮기기」다. 그 PR 에 「지우기」를 섞으면 마지막 PR 의 증명(남은 줄 바이트 동일 · 순서 동일)이 흐려진다. 법정의 생성기 재실행 대조도 unwire 증명 파일 하나로 그대로 맞는다(설계 5.10 — 이 옵션을 unwire 에 넣은 까닭).
- **반론 2 「목록 밖의 줄 종류를 지우는 것 아닌가」** → 그렇다. 그래서 재철거 4차(#956)는 이 줄을 남겼고, 결심(③)이 나온 뒤에 이 PR 이 지운다. 옵션에 적은 이름은 승인된 한 줄뿐이다.
- **재검증(되돌릴 수 있는가)**: index.html 의 두 줄이다. 이 PR 을 되돌리면 그대로 돌아온다.

### 알려진 실패 1건(기준에서도 같다 — 이 PR 과 무관)

옛 생성기 단위 시험 `unwire-check-b1.js` 의 T7 은 「작업 트리의 실제 index.html 에서 참조가 남지 않는 `_settingsKit` 가져오기를 골라 철거해 본다」는 검사인데, 재철거 3차(#953)가 그 손잡이를 지운 뒤로는 후보가 없어 「측정불가」로 실패 기록이 된다. 그 한 건이 그 시험을 다시 돌리는 겉의 묶음들(619 · 634 · 643 · 657 · 661 · 662 의 B)에 번진다. 고치지 않은 main 에서도 같다(측정 기록 `reports/TASK-ES-681/prev-suite-base.json`). 이 PR 은 생성기를 바꾸지 않아 그 묶음들을 돌리지 않았고, 그 시험 파일도 고치지 않았다(고치는 일은 따로 PR 이 필요하다 — 작업 끝 보고에 올린다).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-684/` 아래. 수치는 `measurement.json` 이 각 결과에서 읽어 모은 것이다.

| 파일 | 무엇 |
|---|---|
| `dead-imports.json` · `proof.json` · `unwire-meta.json` | 죽은 가져오기 입력 · 생성기 설정 · 산출 기록 |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 대조 탐침(철거 전 이름 목록으로 고정) |
| `scenario-local.json` · `scenarios/` | 시나리오 12개 기준·작업 |
| `module-load.json` · `raw/` · `tests-base.json` · `tests-work.json` | 모듈 로드 · npm test · 시험 하나씩 |
| `measurement.json` · `claims.json` | 측정 모음(`summary.deadImports` — 속성 기술자) · 주장 |
| `registered-now.json` · `remaining-wiring.json` · `iife-composition.json` | 등록 목록 · 남은 배선 · 덩어리의 줄 구성(이 PR 뒤) |
| `court-local.json` | `recomputeSplit` 직접 호출과 로컬 법정 실행 기록(작업자 PC — 판정 아님) |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 법정의 생성기 재실행 대조가 로컬과 다를 수 있다(`dropDeadImport` 가 든 증명 파일의 첫 재실행이다) → push 전에 `recomputeSplit` 을 직접 부른다(L070 · L088).
- **예상**: 지워지는 줄을 글자로 붙잡는 시험 → 준비 모의에서 npm test 가 기준과 같았다.
- **측정불가**: 로그인 뒤의 동작 · 운영 환경.
- **성과 측정**: 지운 줄 2(index.html 2714 → 2712). `inlineScriptLines` 444 → 442 — `measurement.json` `summary.inlineScriptLines` · `docs/architecture/module-baseline.json` 마지막 기록. 이 PR 뒤 finalize 의 전제를 막는 문은 여섯에서 다섯으로 준다(`renderTeamGoalsScreen` 중계 2 · 서버 연결 세 문 3 — 둘 다 finalize 의 승인된 옵션이 다룬다).
