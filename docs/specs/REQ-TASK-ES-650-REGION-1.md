# REQ — #TASK-ES-650 미분화 덩어리 해체 구역 이전: 앱이 뜰 때 한 번 도는 문을 구역 15개로 묶어 새 세포 5개로

- Task ID: **TASK-ES-650** (L012: 오케스트레이터가 번호를 배정했고, `gh pr list --state all` · `git ls-remote origin` 에서 650 이 비어 있음을 다시 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-650-region-1` 을 먼저 push 해 선점했다.)
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(나) 변형 — 「구역 감싸기」 유형의 첫 실사용**. 줄 종류와 생성기는 #919(#TASK-ES-643 생성기 region 모드 — 판정 「통과」)가 정했고, 그 PR 이 저장소 밖 사본에서 모의 적용까지 쟀다. 절차는 철거·상태 이전 선례(#907 · #914 · #927)를 따른다 — 적용 → 측정 → 주장을 실행기 하나로 · 기준선 기록 · 되짚기 · push 전 로컬 법정. 처음인 것: 새 세포 파일을 쓰는 region PR 이라 법정이 index.html 과 세포 5개를 함께 바이트 대조한다 · 세포 이름과 책임 단위를 사람이 정한다 · 신고서와 세포 설명을 더한다.
- 작업참고 기준 PR #924(7852fc16, 경험칙 106개) · 착수 기준 main 6eeacd58(#927 상태 이전 2차 병합 뒤) · **합친 main cc325e0a**. 그 사이 병합된 것: #928 · #931 생성 지도 갱신 · #888 지시함 묶음 4 기록 · #929 생성기·검사기(함수 선언을 옮길 때의 arguments 조건 — 옮기기 경로만 고침, region 경로 글자 불변) · **#930 `saveGoogleToken` 함수 이전(index.html 이 바뀌었다)**. #930 을 합칠 때 `index.html` · 기준선 · 신고서 · 세포 설명은 main 판으로 두고 실행기 `apply` 부터 다시 돌렸다(L049 — 새 세포 5개도 지우고 다시 만들었다). 구역 15개 · 문 179개 · 세포 줄 수는 같고 줄 번호만 달라졌다. 측정의 기준 트리는 cc325e0a 다(b145fdde · 8c076e17 · cc325e0a 에서 세 번 전부 쟀고, 이 문서의 수치는 마지막 것이다).
- 지시함(origin/main) 열린 지시: **DIR-003**(B 트랙 B10 — 부팅 · PR 마다 기준선에 inlineScriptLines 기록) · **DIR-004**((가) 닫힌 목록 X7 · (나) 돈 근처는 글자 그대로 자리만).
- **상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d — 글자 그대로)**
  1. 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마. 지침이나 결심이 필요한점?」
  2. 「결심필요 4번 빼고 모두 권장안대로 진행하고 4번은 자세히 설명해봐 어떤 함수인지 어떤 기능을 하던건지 자세히, 어떻게 진행하는게 좋을지, 권장안이 뭔지」 — 결심 표 묶음 1(생성기 줄 종류 확대 — X7 연속 구역 감싸기)과 묶음 6(부팅을 연속 구역 감싸기로)이 이 PR 의 근거다.
- 설계 정본: `docs/architecture/CELL-REGISTRY-DESIGN.md` 3.4 · 4절 「구역 감싸기」 증명 하한 · 5.6.
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 원문의 어느 문장 | 완료 기준 |
|---|---|---|---|
| R1 | index.html 인라인 IIFE 에서 앱이 뜰 때 한 번 도는 문을 구역으로 묶어 세포의 구역 함수로 옮기고 원래 자리에 부르는 한 줄을 남긴다 — 생성기 region 한 번(손 편집 0). 앱 동작은 그대로다 | 원문 1 「남은 미분화작업 모두 진행」 · DIR-003(B10) | 게스트 화면 시나리오 12개(구역이 연결하는 단추를 실제로 누르는 조작 포함)가 기준·작업 양쪽 통과 · 법정의 생성기 재실행 결과와 index.html · 세포 5개가 바이트 동일 |
| R2 | 옮기는 것은 닫힌 목록 X7 의 줄뿐 · 문 순서와 글자(`L.` 접두 밖) 불변 · 돈 근처 줄 · `OURGOAL_CONFIG` · 시험이 붙잡는 글자 · 다른 작업이 옮길 노출 줄은 제자리 | 원문 2 · DIR-004 | 되짚기 결과 == 작업 index.html · 세포 본문에서 `L.` 만 걷으면 이전 전 줄 · 그 줄들이 index.html 에 그대로 |
| R3 | 새 세포는 책임 단위 · 800줄 이하 · 등록 블록 없이 기존 감싸기와 같은 꼴 · 신고서와 세포 설명(사용자 말) 추가 | 오케스트레이터 지시 · 헌법 CELL_SPLIT 7호 | 세포 5개 줄 수 · 모듈 가드 통과 · `modules.json` · `cell-descriptions.json` |
| R4 | 통로·window 값의 이름별 지문 · 상태 기관 이름의 값과 쓰기 왕복 · 사진 첨부 경로가 기준과 같다 | 설계 4절 | 지문 차이 0 · 상태 탐침 차이 0 · 사진 경로 기록 동일 |
| R5 | 증명 하한과 기준선 기록 | 설계 4절 · DIR-003 | inlineScriptLines 감소와 `module-guard --update` 기록 · 모듈 로드 새 회귀 0 · npm test · 시험 하나씩 기준과 같음 · 무결성 게이트 38/38 · tests/ · 금고 · 생성기 · scripts 변경 0 |
| R6 | 늘어나는 통로 getter 의 수와 region 뒤 남는 줄을 재서 남긴다 | 오케스트레이터 지시 | `measurement.json` `summary.moved.gettersAdded` · `summary.remaining` |

- 원문에 있는데 이 PR 항목에 없는 요구(목표 줄에 남긴다): 늘어난 통로 getter 109줄의 재철거 · 남은 로드 중 문 5개 · 함수 선언 2개 · 노출된 상태 var · sweep · finalize. 「병합도 스스로」 — 이 PR 의 병합은 판정 뒤 오케스트레이터가 한다(이 작업자는 병합하지 않는다).

### 구체 식별자

- 고친 제품 파일: `index.html`(+143 −550) — 구역 15곳의 549줄이 부르는 한 줄씩 15줄로, 머리 이음매 자리(`/* [어려움 이음매 자리 HO 기관] */` 아래)에 127줄(주석 1 · `var 구역함수 = _uiKit.구역함수;` 15 · 통로 getter 109 와 그 expose 문 머리·꼬리 2), `js/core/ui-helpers.js` 태그 줄에 새 세포 태그 5개(같은 줄).
- 새 세포 5개(전부 `js/core/`, 키트 `OurgoalUiHelpers` — #911 의 `module-connect.js` 와 같은 자리·같은 키트):

| 세포 | 줄 | 구역 함수(이전 전 index.html 줄) |
|---|--:|---|
| `js/core/boot-early-state.js` | 105 | `bootApplySavedTheme`(2614~2621) · `bootAuthStateListener`(2643~2644) · `bootThemeList`(2674~2693) · `bootAvatarLevelUpWiring`(2717~2733) · `bootExposeAppState`(2742) · `bootPromptTabState`(2762) |
| `js/core/boot-entry-wiring.js` | 200 | `bootEntryAndAccountWiring`(2782~2945) · `bootGoogleTokenState`(2950~2952) |
| `js/core/boot-home-wiring.js` | 278 | `bootHomeAndGoalWiring`(2996~3173) · `bootGoalsAndTeamState`(3205~3271) |
| `js/core/boot-records-wiring.js` | 52 | `bootRecordsWiring`(4255~4270) · `bootRecordsExportWiring`(4276~4278) |
| `js/core/boot-finish.js` | 108 | `bootSharedGroupsState`(4461) · `bootCommSettingsAndStart`(4469~4531) · `bootInstallAndServiceWorker`(4537~4541) |

- 기록: `docs/architecture/modules.json`(`node scripts/module-specs.js --write` — 세포 5개의 신고서) · `docs/architecture/cell-descriptions.json`(이름·하는 일 5줄씩) · `docs/architecture/module-baseline.json`(`module-guard --update` 가 65번째 항목을 더함) · `docs/rules/TICKETS.md` · `reports/TASK-ES-650/`
- 새 도구(제품 코드 아님): `reports/TASK-ES-650/region-run.cjs`(apply · measure · claims) · `region-names.json`(구역의 이름·세포 규칙) · `region-pins.json`(제자리에 두는 문 3건)
- 손대지 않은 것: 그 밖의 `js/**` · 생성기 · tests/ · scripts/ · 금고 · 생성 지도 3종(L009)
- 화면 식별자(시나리오): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnGoalsSubPersonal` · `#btnGoalsSubRoutine` · `#btnGoalsSubStats` · `#btnGoalsSubTeam` · `#btnGoalPeriodWeek` · `#btnGoalPeriodMonth` · `#homeAddGoal` · `#ngCancelBtn` · `#sanctuaryBellBtn` · `#closeNotifCenterBtn` · `#btnToggleGoalAgent` · `#goalAgentInput` · `#setTermsLink` · `#setPrivacyLink` · `#legalBody` · `#legalCloseBtn` · `#landLoginLink` · `#forgotPassBtn` · `#modalSheet` · `#micBtn` · `.mic-perm-backdrop` · `.comm-subtab[data-sub="group"]` · `#recSamplePurgeBtn` · `#recSamplePurgeBox` · `#btnSheetConfirmOk` · `#goalFastAddInput` · `#chipTagStudy` · `#btnGoalFastAddSubmit` · `#exportRecordsBtn` · `#expThemeSel` · `#expFmtSel`. 탐침: `#capturePhotoInput` · `#capturePhotoPreview` · `#captureSave`

## 1. [원칙 ①] 문제를 정확히 파악한다

- 감싸기 이전(#911 · #913)이 4줄 이상인 로드 중 문을 다 옮긴 뒤에도 인라인 IIFE 최상위에는 「앱이 뜰 때 한 번 도는 문」이 흩어져 남았다. 기준 cc325e0a 에서 재면 최상위 문 399개 가운데 가져오기 169 · 손잡이 13 · expose 문 16 · 함수 선언 1 을 뺀 200개가 그런 문이다: 기관 define 줄 56 · 감싼 함수를 부르는 줄 70 · 호출문 16 · if 13 · try 2 · window 대입 17 · var 26.
- 옮기기 경로의 감싸기는 3줄 이하 문 · define 줄 · window 노출 줄 · var 를 원래 자리에 둔다. 이 문들을 접을 길은 닫힌 목록 X7(연속 구역 감싸기)뿐이고, 그 생성기 모드가 #919 로 들어왔다.
- 법정은 기준 커밋의 생성기로 설정을 다시 돌려 `index.html` 과 설정 `cells` 의 파일을 바이트 대조한다. 그래서 이 PR 의 제품 변경은 index.html 과 새 세포 5개뿐이어야 하고, 손 편집이 하나도 없어야 한다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 문을 고치지 않고 자리만 옮긴다 — 흩어진 시동 문 179개를 「부르는 한 줄」 15개로 접는다. 실행 순서는 소스 순서 그대로다.
- **원인**: 시동 문이 한 줄씩 IIFE 에 박혀 있어, 함수와 상태를 다 옮겨도 IIFE 를 비울 수 없었다.
- **중심**: 생성기 region 한 번, 설정 `reports/TASK-ES-650/proof.json`(세포 5 · 구역 15). 설정은 실행기가 만든다 — 구역의 경계는 계획기가 지금의 index.html 에서 다시 재고, 이름과 세포만 `region-names.json` 이 정한다.
- **핵심**: ① 구역 함수가 원래 자리에서 불리므로 순서가 보존된다 — 그것을 「세포 본문에서 `L.` 만 걷으면 이전 전 줄」로 확인한다. ② 생성기가 모르는 것(시험이 붙잡는 글자 · 가드의 셈 · 다른 작업의 입력)은 계획에서 뺀다 — #919 의 모의 적용이 그 둘을 찾아냈다.

## 3. [원칙 ③] 해결 방식

1. 계획기를 지금 main 에서 다시 돌린다(`region-plan.cjs --pins region-pins.json`): 구역에 넣을 수 있는 문이 연달아 있는 줄기 15개 · 문 179개. #919 때(19개)보다 줄었다 — 그 사이 감싸기 이전 2차(#913)와 상태 이전 2차(#927 — 구역을 끊던 var 6개가 define 줄이 됨) 등으로 줄기가 이어졌다.
2. 구역마다 이름과 세포를 정한다(`region-names.json` — 구역의 첫 문 글자로 알아본다. 맞는 규칙이 없으면 멈춘다). 세포는 책임 단위 다섯: 맨 먼저 하는 준비 · 첫 화면과 계정 · 홈과 목표 · 기록 탭 · 마무리와 앱 시작.
3. `region-run.cjs apply` → `module-specs --write` · 세포 설명 → `module-guard --update`.
4. 시나리오 12개: 앞선 PR 에서 기준·작업 통과가 확인된 11개(그 단추의 연결 호출이나 연결 문이 이번에 구역으로 간 것들)와 새 1개(구역이 직접 누름을 거는 「내보내기」 단추).
5. `region-run.cjs measure` · `claims`.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **순서가 바뀌지 않는가** → 구역 함수 본문의 줄에서 `L.` 접두만 걷어 내면 이전 전 구역의 줄과 같다(다른 줄 0). 구역 안 문의 줄 번호는 오름차순이고, 부르는 줄은 구역이 있던 자리에 있다(되짚기). 법정이 같은 것을 바이트로 다시 본다.
- **구역 안에서만 쓰는 var** → 11개가 그 함수의 지역 변수가 됐다(`_initTh` · `btnAvLvConfirm` · `fpBtn` · `btnCloseTplEncycl` · `btnEvalBanner` · `btnEvalClose` · `challengeBtn` · `requestClaudeFeedback` · `tabBtnAi` · `tabBtnReal` · `topBtnGuide`). 생성기가 「노출 안 됨 · 모든 참조가 구역 안」을 확인한 것만이다.
- **기관 define 줄이 세포로 가도 되는가** → 56줄이 글자 그대로 갔다(`window.OurgoalAppState.define…` 은 window 로 시작해 접두가 붙지 않는다). 상태 탐침: 기관이 맡은 이름 56개가 기준과 같고, 이름마다 값 요약 · 접근자 종류 · 주인 · 기관 종류 · 쓰기 왕복이 같다(다른 이름 0, 기준끼리도 달라지는 `state` 제외). 쓰기 왕복 31/31.
- **window 노출의 시점** → 구역에 든 window 대입 13문은 구역 함수가 원래 자리에서 불릴 때 실행된다. window 값 지문 차이 0.
- **통로 getter 109줄이 다시 생긴다** → 구역 본문이 읽는 IIFE 이름(주로 가져오기 이름 — `bind…` · `connect…` · `start…` · `define…` 꼴이 71개)에 getter 가 생긴다. 기존 감싸기와 같은 동작이고 값은 같은 함수다(통로 값 지문 차이 0 · 통로에서 사라진 이름 0). 그래도 index.html 은 407줄 순감소다. 뒤의 재철거가 지운다.
- **탭 간 직접 참조** → 세포를 `js/core/` 에 두어 셈이 그대로다(0 → 0). `window.SHARED_GROUPS_LOADED = false` 줄은 구역에서 빼 인라인 소유가 유지된다.
- **돈 근처 · 결심 대기** → `OurgoalTemplateCredit.init` 블록 3줄과 `OURGOAL_CONFIG` 2줄은 index.html 에 글자 그대로 있고, 새 세포에 그 이름이 없다(생성기도 넣으면 멈춘다).
- **다른 작업과의 충돌** → `saveGoogleToken` 의 window 노출 블록은 제자리에 뒀다 — 그 함수 이전(#930)이 같은 때에 진행돼 먼저 병합됐고, 그 줄은 가져온 함수의 배선이라 재철거가 지울 줄이다. 944줄 함수는 함수 선언이라 구역에 들지 않는다.

## 5. [원칙 ⑤] 절차

1. origin/main 기준 worktree · 번호 선점 · `npm ci --ignore-scripts` · 계획기 재실행 · 구역 내용을 읽어 이름·세포 정함.
2. 실행기 작성 → `apply` → 신고서 · 세포 설명 · `module-guard --update`.
3. 시나리오(새 후보 넷을 이전 전 트리에서 시험 → 닿는 것 하나만 남김) → 기준 임시 트리 → npm test 기준/작업 · 시험 하나씩 → `measure`.
4. REQ · 작업표 → npm test 작업 트리 다시(L064) → `measure` · `claims`.
5. main 이 움직일 때마다(지도 #928 · 생성기 #929 · 함수 이전 #930) 합치고 다시 잼 → `verify-integrity-gate` → 커밋 → `recomputeSplit` 직접 호출과 로컬 법정 전체 실행(요약을 읽어 본 뒤 커밋) → origin/main 확인 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「구역 15개를 한 PR 에 다 넣는 것은 위험하다 — 둘로 나눠라」** → 나누면 index.html PR 이 둘이 되고, 지금처럼 다른 index.html PR 과 병합 순서를 다투는 상황에서 생성기 재실행과 재측정이 배로 는다. 위험을 줄이는 쪽은 나누기보다 재는 것이라고 봤다: 같은 계획을 #919 가 저장소 밖 사본에서 먼저 돌려 봤고(시험 5개가 깨지는 것을 그때 찾아 고쳤다), 이번에는 실제 트리에서 시나리오 12 · 지문 · 상태 · 사진 경로 · 모듈 로드 · npm test · 시험 114개 하나씩을 전부 다시 쟀다. **나누는 쪽이 낫다고 보시면 `region-names.json` 의 구역을 둘로 갈라 다시 돌리면 된다.**
- **반론 2 「세포를 탭 폴더(js/tabs/…)에 둬야 책임 단위다」** → 구역은 여러 탭의 연결을 순서대로 거는 시동 코드라 한 탭의 것이 아니다. 탭 폴더에 두면 다른 탭의 이름을 읽는 줄이 모듈 가드의 탭 간 직접 참조로 잡힌다. #911 도 바깥 부품 연결을 `js/core/module-connect.js`(키트 `OurgoalUiHelpers`)에 뒀다. 책임은 시동의 단계(먼저 하는 준비 → 첫 화면·계정 → 홈·목표 → 기록 → 마무리)로 나눴다.
- **반론 3 「시나리오가 구역이 연결하는 단추를 다 누르지 않는다」** → 맞다. 게스트로 닿는 것만 눌렀다: 아래 탭 · 종 · 새 목표 · AI 어시스턴트 서랍 · 약관 링크 · 비밀번호 찾기 · 마이크 · 모임 구획 · 샘플 정리 · 빠른 목표 추가 · 내보내기. 새 후보 넷 가운데 셋(맞춤 피드백 봇 설정 두 곳 · 주간 요약 카드)은 이전 전 트리에서도 기대한 화면이 보이지 않아 뺐다(단언을 꾸미지 않았다). 닿지 않는 단추(레벨업 창 · 템플릿 백과 · 앱 평가 창 · 로그인 뒤 화면)는 8절에 측정불가로 적는다.
- **재검증(되짚기)**: 기준 index.html 4,581줄에서 구역 549줄을 부르는 15줄로 바꾸고, 머리 127줄을 끼우고, 태그 줄 하나에 세포 태그 5개를 붙여 다시 만든 결과가 작업 index.html 4,174줄과 글자 그대로 같다.
- **재검증(시험 전부)**: 스크립트 넷과 `tests/*.test.js` 114개를 하나씩 돌린 결과가 기준과 같다(실패 집합 26 = 26, 작업에서만 깨진 것 0).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-650/` 아래. 수치는 `measurement.json` 이 각 결과에서 읽어 모은 것이다(L002).

| 파일 | 무엇 |
|---|---|
| `proof.json` | 생성기 설정: `mode:"region"` · 세포 5 · 구역 15(구획 주석 제목과 문 글자 닻) |
| `region-names.json` · `region-pins.json` | 구역의 이름·세포 규칙 · 제자리에 두는 문 3건과 근거 |
| `region-meta.json` | 생성기 산출 — 구역 15 · 문 179 · 옮긴 줄 549 · 지역 변수 11 · 접두 130곳 · 통로로 읽는 이름 117(새 getter 109 · 새 setter 0) · 머리 127줄 · index.html 4581 → 4174줄 · 계획기의 「구역에 못 넣는 문」과 사유 |
| `scenario-local.json` · `scenarios/` | 시나리오 12개 기준·작업 통과, 예외 0 |
| `cell-registry-compare.{before,before2}.json` · `cell-registry-compare.json` | 대조 탐침: 불일치 0 · 통로에서 사라진 이름 0 · 통로·window 지문 차이 0 · 부팅 예외 0 |
| `state-probe.{base,base2,work}.json` · `probe-names.json` | 상태 탐침: 이름 66개(기관 56 + 노출된 var 10) · 차이 0 · 쓰기 왕복 31/31 |
| `photo-probe.{base,work}.json` | 사진 첨부 경로 기록이 기준과 같음 · 확인 칸 전부 참 |
| `module-load.json` · `npm-test-compare.json` · `tests-{base,work}.json` · `raw/` | 모듈 로드 새 회귀 0 · npm test 기준/작업 같음 · 시험 하나씩 실패 집합 같음 |
| `measurement.json` | 위 전부 + 제품 파일 = index.html + 새 세포 5 · 되짚기 · 세포 본문 대조 · inlineScriptLines 2311 → 1904(−407) · 기준선 기록 = 측정값 · 모듈 가드 종료 0 · 탭 간 참조 0 → 0 · 무결성 게이트 38/38 · 남는 줄 표 |
| `claims.json` | 주장(보존 12 + 기록 37) |
| `court-local.json` | 로컬 법정 전체 실행 요약(작업자 PC — 판정 아님) |

### region 뒤 남는 줄 (IIFE 최상위 — `measurement.json` `summary.remaining`)

| 종류 | 이전 전 문·줄 | 이전 뒤 문·줄 | 다음에 없애는 단계 |
|---|--:|--:|---|
| 구역 함수 부르는 줄 | 0 · 0 | 15 · 15 | finalize 가 `js/app/boot.js` 로 |
| 가져오기 줄 | 169 · 169 | 184 · 184 | 구역 함수 것 15 는 finalize · 그 밖은 등록 뒤 unwire |
| 손잡이 줄 | 13 · 13 | 13 · 13 | 가져오기가 지워진 뒤 unwire `dropKitVar` · finalize |
| expose 문(getter/setter) | 16 · 64 | 17 · 175 | 이 PR 이 더한 getter 109줄(+ 머리·꼬리 2)은 재철거 · 상태 이름은 unstate |
| 함수 선언 | 1 · 944 | 1 · 944 | 944줄 함수 제자리 정리(#TASK-ES-646) |
| 노출된 상태 var | 12 · 155 | 13 · 156 | 맨이름 참조가 없어지면 unstate → 그 define 줄을 구역으로. 하나 는 것은 `btnAvLvClose`(구역 본문이 통로로 읽게 돼 getter 가 생김) |
| 노출 안 된 var | 14 · 14 | 3 · 3 | `SUPABASE_URL` · `SUPABASE_ANON_KEY`(노출된 `sb` 의 초기값이 씀) · `OURGOAL_CONFIG`(결심 대기) |
| 그 밖의 로드 중 문 | 174 · 203 | 5 · 9 | `OurgoalTemplateCredit.init` 블록(돈 근처) · `OURGOAL_CONFIG` window 복사(결심 대기) · `saveGoogleToken` window 블록(막 옮긴 함수의 노출 줄 — 재철거의 몫) · `SHARED_GROUPS_LOADED` 줄(모듈 가드) · `shareContent` window 복사(한 줄 나눠 쓰기) |
| 주석 줄 · 빈 줄 | 502 · 224 | 277 · 104 | sweep(X8) · finalize |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상 → 실제로 만난 것**: 다른 index.html PR 이 먼저 병합된다 — `saveGoogleToken` 이전(#930)이 먼저 병합됐다. main 을 합치고 index.html · 기준선 · 신고서 · 세포 설명을 main 판으로 둔 뒤 실행기 `apply` 부터 다시 돌려 전부 다시 쟀다. 944줄 함수 정리(#TASK-ES-646)가 먼저 병합돼도 같은 절차다. 구역 경계가 달라져 이름 규칙이 안 맞으면 실행기가 멈추므로, 이름 없는 구역이 조용히 생기지 않는다.
- **예상**: 새 세포 파일까지 바이트 대조되는 첫 region PR → push 전 `recomputeSplit` 직접 호출과 로컬 법정 전체 실행.
- **측정불가**: 게스트로 닿지 않는 단추(아바타 레벨업 창 · 템플릿 백과 창 · 앱 평가 창 · 맞춤 피드백 봇 설정 · 주간 요약 카드 · 로그인·가입·로그아웃·탈퇴 · 소셜 로그인 · 실시간 채널) · 홈 화면 설치 사건 · 서비스 워커 갱신 · 운영 환경. 그 연결 문은 글자·순서 그대로 옮겼다는 것과 통로 값 지문으로만 쟀다. 호출 순서의 동적 대조 탐침은 없다(미검증).
- **성과 측정**: inlineScriptLines 2311 → 1904(−407, 출처 `measurement.json` `summary.inlineScriptLines`). IIFE 최상위의 「구역 함수 호출 · 가져오기 · 손잡이 · expose 문 · 함수 선언 · 노출된 var」 밖의 문이 188개에서 8개로 줄었다. 통로 getter 는 109줄 늘었다(재철거 대상).
