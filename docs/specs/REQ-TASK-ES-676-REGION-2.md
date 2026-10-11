# REQ — #TASK-ES-676 미분화 덩어리 해체 구역 이전 2차: 남은 로드 시점 문(상태 기관 정의 줄 · window 대입 줄)을 구역 함수로

- Task ID: **TASK-ES-676** (L012: 처음에는 675 를 확인하고 빈 브랜치 `feat/2026-10-11-task-es-675-region-2` 를 push 해 선점했다. 그 뒤 같은 번호를 쓴 생성 지도 갱신 PR #942(`chore/2026-10-11-task-es-675-cell-map-sync`)가 먼저 병합돼 main 에 `reports/TASK-ES-675/` · 작업표 675 줄이 생겼다. 번호가 겹쳐 **676 으로 옮겼다** — `gh pr list --state all` · `git ls-remote origin` · `docs/rules/TICKETS.md` 에서 676 이 비어 있음을 확인하고 빈 브랜치 `feat/2026-10-11-task-es-676-region-2` 를 push 했다. 675 이름의 빈 브랜치는 원격에 남아 있다(커밋 없음).) · 분류: INFRA(미분화 덩어리 해체)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main) 열린 지시: **DIR-003**(줄을 지우는 PR 마다 기준선에 inlineScriptLines 기록) · **DIR-004**((가) 닫힌 목록 X7 region — 연속 구역 감싸기).
- 작업 유형(SNOWBALL 분류): **(가) 표준 — 「구역 감싸기(region) 이전」 셋째 사례**. 선례 #933(#TASK-ES-650 구역 이전 1차) · #939(#TASK-ES-671 — 줄 단위 접두-만 비교 · 관측 탐침)의 절차·증거 꼴을 따른다. 작업참고 **기준 PR #941**(3c9b9335, 경험칙 119개 — L002 · L010 · L012 · L064 · L110).
- 선행 PR: **#941**(#TASK-ES-673 상태 이전 3차 — 이번에 옮기는 정의 줄들은 그 PR 이 `var …` 선언을 `window.OurgoalAppState.define…` 으로 바꿔 쓴 줄이다) · **#944**(시험 단언 넓히기) · **#945**(모듈 가드 ⑤ — `js/core` 바로 아래 파일이 window 에 다는 이름의 주인) — 뒤의 둘이 처음에 붙잡혀 있던 두 문을 풀었다(4절).
- 이 작업 세션은 빌더(서브에이전트)다. 병합은 하지 않는다(오케스트레이터 몫). push 는 번호 선점 + 마무리 1회다(번호가 겹쳐 선점 push 가 한 번 더 들었다).
- 기준 main: **f227a756**(#949 944줄 함수 3단계 병합 뒤). 3c9b9335 · 42b5511f · d86d8366 에서 차례로 재고, 마지막에 f227a756 판 index.html · 기준선에 같은 설정으로 생성기를 다시 돌려 시험·측정을 전부 다시 했다(L010 — 손으로 충돌을 풀지 않았다). 아래 줄 번호와 수치는 f227a756 에서 다시 잰 값이다.
- 설계 정본: `docs/architecture/CELL-REGISTRY-DESIGN.md` 3.4 · 5.6(region) · 5.8(finalize 전제).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 원문의 어느 문장 | 완료 기준 |
|---|---|---|---|
| R1 | 인라인 IIFE 에 남은 로드 시점 문 11개를 생성기 region 으로 구역 함수 8개(새 세포 둘)로 옮긴다. 앱 동작은 그대로다(손 편집 0) | 「남은 미분화작업 모두 진행」 · DIR-004 X7 | 게스트 화면 시나리오 다섯이 기준(2회)·작업 통과 · 법정의 생성기 재실행 결과와 바뀐 파일이 바이트 동일 |
| R2 | 바꾸는 글자는 통로 접두 `L.` 뿐. 서버 주소·공개 키의 값 글자는 한 글자도 바꾸지 않는다 | 오케스트레이터 지시 | 옮긴 187줄 가운데 접두 말고 다른 줄 0 · 되짚기 결과 == 작업 index.html · 서버 주소·공개 키 줄은 옮기지 않았고 index.html 에 바이트 그대로 · 생성기가 다시 단 통로 getter 는 이름 목록으로 적는다 |
| R3 | 같은 자리·같은 순서 | 오케스트레이터 지시(「같은 자리·같은 순서, 시점 탐침」) | 부팅 사건 줄(정의 · 노출 · window 대입)이, 다시 달린 getter 의 노출 사건 하나를 빼면 기준과 글자 그대로 같음 |
| R4 | 옮긴 이름의 값 · 접근자 · 주인 · window 복사가 기준과 같다 | 증명은 #933·#939 와 같게 | 손잡이 탐침 통째로 같음 · 상태 탐침에서 다른 이름은 getter 가 다시 달린 이름 하나뿐 · 통로·window 값 지문 차이 0 · 사라진·새로 생긴 이름 0 |
| R5 | 증명 하한과 기준선 기록 | 설계 4절 · DIR-003 | 모듈 로드 새 회귀 0 · npm test · 시험 하나씩 동일 · 모듈 가드·무결성 게이트 통과 · tests·금고·생성기·생성 지도·기관 파일 변경 0 · `module-guard --update` 기록 |
| R6 | finalize 전제까지 남은 것 표(문 종류별 줄 수와 풀리는 조건) | 오케스트레이터 지시 | `reports/TASK-ES-676/finalize-gap.json` |

- 원문에 있는데 이 PR 항목에 없는 요구(목표 줄에 남긴다): **서버 주소·공개 키 선언과 `sb` 정의 줄의 구역 이전(커밋 훅이 막았다 — 4절)** · `state` · `_promptEncyclopediaOpen` 의 상태 이전과 그 정의 줄의 구역 이전 · 재철거 3차 · sweep · finalize. 「병합도 스스로」 — 이 PR 의 병합은 판정 뒤 오케스트레이터가 한다(이 작업자는 병합하지 않는다).

### 구체 식별자

- 고친 제품 파일: `index.html`(+21 −188) · 새 세포 `js/core/boot-state-seeds.js`(61줄) · `js/core/boot-comm-seeds.js`(215줄).
- 구역 함수 8개(이전 전 index.html 줄 — 기준 f227a756)
  - `bootAvatarCloseButton` 2603~2606 — `define('btnAvLvClose', document.getElementById('btnAvatarLevelUpClose'))` + 앞의 자리 표지 주석 · 줄 주석.
  - `bootGoogleTokenSaveHandle` 2662~2666 — `if(typeof window !== 'undefined'){ window.saveGoogleToken = saveGoogleToken; }`(접두 1곳) + 앞의 자리 표지 주석 두 줄.
  - `bootTemplateSubtabFilterState` 2729~2731 — `defineVar('_subtabTplCat', 'all')` · `defineVar('_subtabTplQuery', '')` + 구획 주석.
  - `bootTemplateSubtabKindState` 2733~2736 — `defineVar('_subtabTplDomain', 'personal')` · `defineVar('_subtabTplType', 'ai')` + 줄 주석 둘.
  - `bootSampleGroups` 2787~2932 — `define('MOCK_GROUPS', [ … ])`(144줄 배열. 접두 17곳 — 전부 `daysFromNow(` → `L.daysFromNow(`).
  - `bootShareHandle` 2933~2953 — `define('shareContent', function(opts){…})` · `window.shareContent = window.OurgoalAppScope.scope.shareContent;` + 앞의 자리 표지 주석·빈 줄.
  - `bootFeedCacheState` 2961~2963 — `defineVar('FEED_POSTS_CACHE', null)` + 구획 주석 · 줄 주석.
  - `bootSharedGroupsFlag` 2970 — `if(typeof window !== 'undefined'){ window.SHARED_GROUPS_LOADED = false; }`.
- index.html 에 더한 줄: 머리 이음매 자리의 주석 1줄 + 가져오기 8줄(`var <이름> = _uiKit.<이름>;`) + **통로 getter 한 개의 expose 문 3줄**(`get daysFromNow(){ return daysFromNow; }` — 4절) · 원래 자리의 부르는 줄 8줄 · script 태그 줄 1줄 수정(`js/core/ui-helpers.js` 태그 뒤에 새 세포 태그 둘).
- 새 도구(제품 코드 아님): `reports/TASK-ES-676/tools/order-probe.cjs`(시점 탐침) · `handle-probe.cjs`(#941 의 손잡이 탐침을 본뜸) · `measure-676.cjs` · `finalize-gap-676.cjs` · `build-claims.cjs`
- 기록: `docs/architecture/module-baseline.json`(71번째 항목) · `modules.json` · `cell-descriptions.json`(세포 둘 추가) · `docs/rules/TICKETS.md` · `reports/TASK-ES-676/`
- 손대지 않은 것: 그 밖의 `js/**` · 생성기 · tests/ · 금고(`docs/rules/rules.json` 포함) · 생성 지도 3종
- 화면 식별자(시나리오 — #941 의 다섯을 그대로): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnGoalsSubTemplate` · `#encyclDomainPersonal` · `#encyclDomainRoutine` · `#encyclDomainTeam` · `#subtabTplBtnAi` · `#subtabTplBtnReal` · `#templateEncyclopediaView [data-subtcat=…]` · `#subtabTplSearchInp` · `#subtabTplSearchClear` · `.comm-subtab[data-sub="feed"]` · `#commSubBody` · `#commBody [data-sub="group"]` · `[data-open-group="g-workshop"]` · `#grpBack` · `#btnHeroCreateTeamComm` · `#tplMarathonSmall` · `#gTopicMajor` · `#gTopicSub` · `#grpSave`. 탐침이 만지는 요소: `#btnAvatarLevelUpClose` · `#avatarLevelUpModal`

## 1. [원칙 ①] 문제를 정확히 파악한다

- finalize(X9)의 전제는 IIFE 최상위 문이 「키트 손잡이 · 구역 함수 가져오기 · 구역 함수 호출문」 세 종류뿐인 것이다(설계 5.8). 상태 기관 정의 줄(`window.OurgoalAppState.define…`)도 전제 밖이다 — 생성기 finalize 는 「상태 선언(define)」을 막는 종류로 센다.
- 기준 main(f227a756)의 IIFE 최상위 문 128개 가운데 가져오기·노출 말고 남은 로드 시점 문은 16개다: 서버 주소·공개 키 선언 2 · 정의 줄 9 · `var state` · `var _promptEncyclopediaOpen` · if 문 2(`window.saveGoogleToken` · `window.SHARED_GROUPS_LOADED`) · window 복사 1(`window.shareContent`). 함수 선언은 #949 로 0 이 됐다.
- `state` · `_promptEncyclopediaOpen` 은 아직 `var` 선언이라 구역 이전이 아니라 상태 이전(unstate)이 먼저다(이 PR 밖). 나머지 14개가 후보다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 앱이 뜰 때 한 번 도는 문을 세포의 구역 함수로 묶고, index.html 에는 그 함수를 원래 자리에서 부르는 한 줄만 남긴다.
- **원인**: 상태 이전이 선언을 정의 줄로 바꿔 썼지만 그 줄 자체는 IIFE 최상위에 남는다. finalize 는 그 줄을 받지 않는다.
- **중심**: 생성기 region 한 번, 설정 `reports/TASK-ES-676/proof.json`(세포 2 · 구역 8).
- **핵심**: ① 정의가 일어나는 **때**가 같은가(구역 함수는 원래 자리에서 불리지만, 그것을 사건 순서로 재서 보인다). ② 접두 말고 글자가 그대로인가. ③ 시험·가드·커밋 훅이 글자를 붙잡는 문을 데려가지 않았는가.

## 3. [원칙 ③] 해결 방식

1. 후보 전부를 저장소 밖 모의 폴더에 생성기로 적용 → 생성기는 전부 받는다(정의 줄은 글자 그대로 간다 — 생성기 규칙 M1b).
2. 모의 폴더에서 모듈 가드 · 시험 하나씩 · npm test 를 돌려 깨지는 것을 찾는다.
3. 깨지는 문 · 커밋 훅이 막는 문을 빼고 설정을 확정 → 생성기 적용 → 세포 설명 · 신고서 · `module-guard --update`.
4. 측정: 줄 단위 접두-만 비교와 되짚기 · 시점 탐침 · 손잡이 탐침 · 상태 탐침 · 대조 탐침 지문 · 시나리오 · 모듈 로드 · npm test · 시험 하나씩 · finalize 전제 조사.
5. 주장 파일.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **생성기가 정의 줄을 구역으로 받는가 · 정의 시점이 같은가** → 받는다(호출문으로 취급, 글자 그대로). 시점은 탐침으로 쟀다: 부팅 동안의 사건(기준 326개 — 상태 기관 정의 65 · 통로 노출 · window 대입 7)을 일어난 차례로 적은 줄과, 사건마다 그 순간 통로에 달려 있던 이름 수가, 작업 쪽에 하나 더 있는 사건(다시 달린 getter 의 노출 — 아래)을 빼면 기준(2회)과 글자 그대로 같다.
- **알고 넘어가는 차이 — 통로 getter 하나가 다시 생겼다(`daysFromNow`)** → 재철거 2차(#943)가 index.html 의 `get daysFromNow` 를 지웠다(등록 기관이 그 이름을 통로에 내준다). `MOCK_GROUPS` 배열은 `daysFromNow(…)` 를 17번 부르고, 구역 본문은 그것을 `L.daysFromNow(…)` 로 읽는다. 생성기는 「구역 본문이 통로로 읽는 이름인데 index.html 에 getter 가 없으면 getter 를 단다」(설계 5.6 — 등록 기관이 내주는지는 보지 않는다). 그래서 머리에 expose 문 하나(3줄)가 생겼다. 재 본 것: 그 노출 사건 앞뒤로 통로의 이름 수가 같다(이미 있던 이름을 다시 단다) · 통로에 새로 생긴 이름 0 · 값 지문 동일(같은 함수) · **접근자 종류가 data → get, 주인 표시가 `comm/sample-data` → `index.html` 로 바뀐다**(상태 탐침에서 달라진 이름은 이것 하나). 다음 재철거(U1 · U2)가 이 getter 와 가져오기 줄을 지운다. 오케스트레이터가 이 차이를 알고 받아들였다(값 지문 동일 · 다음 재철거가 지운다).
- **처음에 붙잡혀 있던 두 문 — 이제 풀렸다** → 3c9b9335 의 모의 적용에서는 둘이 깨졌다: ① 닫기 단추 정의 줄(`btnAvLvClose`)을 옮기면 앞 주석이 따라가 `tests/avatar-10slots-growth.test.js` 가 깨졌고(「filterHarmfulWords …」), ② `window.SHARED_GROUPS_LOADED = false` 줄을 옮기면 모듈 가드의 탭 간 직접 참조가 0 → 1 이 돼 모듈 가드 · 시험 넷 · npm test 가 깨졌다. 그 뒤 #944(그 단언을 「옛 글자 또는 세포의 함수 선언」으로 넓힘)와 #945(모듈 가드가 `js/core` 바로 아래 파일이 window 에 무조건 다는 이름을 주인으로 봄)가 병합됐다. f227a756 의 모의 적용(구역 8개)에서 다시 쟀다: 모듈 가드 통과 · 시험 하나씩 115개의 실패 집합이 기준과 같음(작업에서만 깨진 것 0) · npm test 종료 코드 0. **둘 다 옮겼다.** `SHARED_GROUPS_LOADED` 줄은 `js/core/boot-comm-seeds.js`(`js/core` 바로 아래)로 갔고 탭 간 직접 참조는 0 → 0 이다.
- **붙잡힌 글자 — 서버 주소·공개 키 선언 + `sb` 정의 줄(커밋 훅)** → 셋을 한 구역(`bootServerClient`)으로 옮기면 생성기·시험·탐침은 전부 기준과 같았다(42b5511f 에서 측정 — 두 선언 줄은 세포에서 기준 줄과 바이트 동일, 가짜 연결 라이브러리로 「연결 만들기 → sb 정의」의 자리도 같음). 그러나 커밋에서 금지 패턴 규칙 `HARDCODED_SECRET`(`docs/rules/rules.json` — 대상 파일 전부, 「API 키·토큰 커밋 금지」)이 공개 키 글자가 든 줄을 새 파일에 더하는 것을 막았다. 그 줄은 지금도 index.html 에 있는 글자지만 규칙은 **더해지는 줄**을 본다. 규칙에 예외를 두는 것은 금고·규범 변경이고, 키 글자를 바꾸는 것은 한도 밖이다. **셋 다 제자리에 뒀다**(훅을 건너뛰지 않았다). → finalize 는 이 세 문에서 다시 막힌다. 풀려면 결심이 필요하다(8절).
- **`window.saveGoogleToken` 블록 — 시험이 깨지는가** → 깨지지 않았다. `tests/gcal-login-reconnect-fix.test.js` 는 index.html 과 세포를 합친 글(세포 쪽은 접두를 뗀 것 — `tests/helpers/inline-bundle.js`)에서 그 대입 글자를 찾는다. 작업 트리에서 그 시험의 결과가 기준과 같다. **옮겼다.** 이 대입은 등록 기관이 이미 window 에 다는 이름을 한 번 더 다는 줄이다(시점 탐침의 window 대입 줄에 이 이름이 두 번 나온다 — 기준 · 작업 동일).
- **`btnAvLvClose`** → 통로 값이 문서의 `#btnAvatarLevelUpClose` 와 같은 요소이고, 레벨업 창을 열어 그 요소를 누르면 닫힌다(손잡이 탐침 — 기준과 같다). 그 단추에 닫기 배선을 거는 구역 함수 `bootAvatarLevelUpWiring()` 은 바로 다음 문이라 순서가 그대로다.
- **`shareContent`** → 함수식이 세포 파일로 자리를 옮기지만 글자는 그대로다(IIFE 이름을 쓰지 않아 접두 0). 함수 지문(이름 · 인자 수 · 본문 해시)이 기준과 같고, 대역 엔진으로 부른 호출 기록이 같다.
- **`MOCK_GROUPS`** → 배열 안의 `daysFromNow(…)` 17곳이 `L.daysFromNow(…)` 가 된다. 구역 함수가 원래 자리에서 불리므로 날짜 계산 시점은 같다. 배열의 길이 · 내용 해시 · 제자리 변경이 통로로 보이는 것이 기준과 같다.
- **주석의 행방** → 구역 첫 문의 앞 주석·빈 줄이 생성기 규칙으로 세포에 함께 갔다(다른 작업의 자리 표지 주석 · 구획 주석 2줄 포함). 그 글자를 index.html 에서 찾는 시험은 작업 트리에서 깨지지 않았다.

## 5. [원칙 ⑤] 절차

1. origin/main 기준 worktree · 번호 선점 · `npm ci --ignore-scripts` · 기준 트리.
2. IIFE 최상위 문 조사 → 후보 → 모의 폴더 적용 → 모듈 가드 · 시험 → 붙잡힌 둘 제외(3c9b9335).
3. 번호가 겹친 것을 발견(#942) → 676 으로 새 브랜치·새 작업 폴더(42b5511f).
4. 커밋 훅이 서버 연결 구역을 막음 → 그 구역을 빼고 생성기부터 다시.
5. #943(재철거 2차) 병합 → main 판에 같은 설정으로 다시(d86d8366). 오케스트레이터 지시로 push 를 미루고 대기.
6. #944~#949 병합 통보 → origin/main 을 합치고 index.html · 기준선 · 신고서 · 세포 설명을 main 판으로 둔 뒤, 모의 폴더에서 붙잡혔던 둘을 다시 재서 넣고(구역 8) 생성기 → 시험(기준 · 작업) · 측정 · 주장을 f227a756 에서 전부 다시.
7. `verify-integrity-gate` → npm test → 커밋 → `recomputeSplit` 직접 호출과 로컬 법정 전체 실행 → origin/main 확인 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「구역 함수가 원래 자리에서 불리니 시점은 당연히 같다」** → 소스 순서로는 그렇다. 그래도 쟀다 — 가져오기 줄이 머리로 올라가고 세포 파일이 먼저 로드되는 변화가 정의·노출·window 대입의 순서에 닿지 않는다는 것을 사건 줄 비교로 보였다(기준 326 · 작업 327 — 더 있는 하나는 다시 달린 getter 의 노출이고, 그것을 빼면 글자 그대로 같다).
- **반론 2 「한 줄짜리 정의를 함수로 감싸면 줄이 오히려 는다」** → 문 하나짜리 구역은 부르는 줄 + 가져오기 줄로 바뀐다. 그러나 두 줄 다 finalize 가 받는 종류다. 이 PR 전체로는 인라인 스크립트 줄 수가 751 → 584 다.
- **반론 3 「세포 둘에 성격이 다른 것이 섞였다」** → 묶은 기준은 「앱이 뜰 때 상태 기관에 맡기는 초깃값과 window 손잡이」이고, 닫기 단추·템플릿 하위 탭·토큰 저장 손잡이(시동 쪽)와 예시 모임·공유·피드·공유 팀 표시(소통 쪽)로 갈랐다. 구역 함수는 이름마다 하나의 일만 한다. finalize 뒤에는 `js/app/boot.js` 가 이 함수들을 차례로 부른다.
- **반론 4 「`window.saveGoogleToken` 줄은 재철거가 지울 배선인데 세포로 데려갔다」** → 그 줄은 여러 줄 if 블록이라 재철거가 받는 꼴(한 줄 대입 · 한 줄 if 블록)이 아니다. 지시에 후보로 올라 있고 시험이 깨지지 않아 옮겼다. 같은 이름을 두 번 다는 것은 기준과 같다. **제자리에 두는 쪽이 낫다고 보시면 돌려보낼 지점이다**: 설정에서 그 구역을 지우고 다시 돌리면 된다.
- **반론 5 「공개 키는 원래 공개된 값인데 왜 못 옮기나」** → 규칙의 정규식은 값의 공개 여부를 가리지 않는다. 작업자가 규칙을 고치거나 훅을 건너뛰는 것은 권한 밖이다. 사실만 적는다.
- **반론 6 「재철거가 지운 getter 를 다시 달았으니 뒷걸음이다」** → expose 문이 하나 는 것은 사실이다(7 → 8). 대신 144줄짜리 정의 문이 IIFE 에서 나갔고, 그 getter 와 가져오기 줄은 등록된 이름이라 다음 재철거가 지울 수 있다. 이 getter 는 `MOCK_GROUPS` 를 언제 옮기든 생긴다(생성기 규칙).
- **재검증(되짚기)**: 기준 index.html 3,021줄에서 구역 187줄을 빼고 그 자리에 부르는 줄 8, 머리에 12줄(주석 1 + 가져오기 8 + getter expose 문 3)을 넣고 script 태그 줄 하나를 바꾼 것이 작업 index.html 2,854줄과 줄 단위로 같다.
- **재검증(시험 전부)**: 스크립트 넷과 `tests/*.test.js` 115개를 하나씩 돌린 결과가 기준과 같다(실패 집합 26 = 26, 작업에서만 깨진 것 0).
- **재검증(main 이동)**: 3c9b9335 · 42b5511f · d86d8366 · f227a756 네 번 쟀다. 앞의 두 번은 새 getter 0 이었고 #943 뒤부터 1 이다. 붙잡혔던 두 문은 #944 · #945 뒤 네 번째에 풀렸다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-676/` 아래. 수치는 `measurement.json` 이 각 결과에서 읽어 모은 것이다(L002).

| 파일 | 무엇 |
|---|---|
| `proof.json` · `region-meta.json` | 생성기 설정(세포 2 · 구역 8)과 생성기 산출 — 문 11 · 옮긴 줄 187 · 지역 변수 0 · 접두 18 · 다시 단 getter 1(`daysFromNow`) · 가져오기 8 · index.html 3021 → 2854줄 |
| `prefix-only-check.json` | 옮긴 187줄: 바이트 동일 169 · 접두만 다른 줄 18(접두 18 = 생성기 바꿔 쓰기 18) · 그 밖 0 · 되짚기 · 서버 주소·공개 키 줄은 옮긴 줄에 0 · index.html 에 바이트 그대로 2 · 세포 파일에 0 |
| `order-probe.{base,base2,work}.json` · `order-probe-fake.{base,work}.json` | 시점 탐침: 사건 줄(기준 326 · 작업 327)이 다시 달린 getter 의 노출 사건 하나를 빼면 기준과 글자 그대로 같음 · 가짜 연결 방식에서도 같음 |
| `handle-probe.{base,base2,work}.json` · `handle-probe-fake.{base,work}.json` | 손잡이 탐침: 기준과 통째로 같음(주인 · 기관 종류 · 함수 이름 포함) |
| `state-probe.{base,base2,work}.json` · `probe-names.json` | 상태 탐침: 이름 69개(상태 기관이 맡은 65 + 4) · 달라진 이름 1(`daysFromNow` — 접근자 종류 · 주인 표시) · 그 밖 0(본질 변동 `state` 제외) · 기관 이름 65 = 65 |
| `cell-registry-compare.base.json` · `cell-registry-compare.json` | 대조 탐침: 통로 539 · window 3 이름의 값 지문 차이 0 · 사라진 이름 0 · 새로 생긴 이름 0 |
| `scenario-local.json` | 시나리오 5개 기준 2회·작업 1회 통과, 예외 0 |
| `module-load.json` · `npm-test-compare.json` · `tests-{base,work}.json` · `raw/` | 모듈 로드 새 회귀 0 · 새 세포 둘 단독 로드 · npm test 기준/작업 같음(✓ 487 = 487 · ok 203 = 203) · 시험 하나씩 실패 집합 같음 |
| `finalize-gap.json` · `finalize-gap.base.json` | finalize 전제까지 남은 것(작업 · 기준) · 남은 상태 선언의 상태 이전 미리 보기 |
| `measurement.json` | 위 전부 + inlineScriptLines 751 → 584(−167) · 탭 간 직접 참조 0 → 0 · 기준선 마지막 기록 = 측정값 · 모듈 가드 0 · 무결성 게이트 38/38 |
| `claims.json` | 주장(보존 5 + 기록) |
| `court-local.json` | 로컬 법정 전체 실행 요약(작업자 PC — 판정 아님) |

### finalize 전제까지 남은 것 — 문 종류별(이 PR 을 반영한 index.html)

생성기 finalize 를 임시 사본에 돌린 오류 글자: 「전제 미충족 — … 밖의 문이 74개 있다(expose 문 8 · 그 밖의 var 4 · 상태 선언(define) 1 · 호출되지 않는 가져오기 61)」. 아래 수는 `finalize-gap.json` 의 것이고 그 글자와 같다. 줄 수는 문이 차지하는 줄만 센 것이다(주석·빈 줄은 sweep 이 지운다). 기준은 f227a756 이다.

| 종류 | 문 수(기준 → 작업) | 줄 수(작업) | 풀리는 조건 |
|---|---|---|---|
| 그 밖의 가져오기(최상위에서 불리지 않음) | 61 → 61 | 61 | 재철거 3차(unwire U1) — 등록 기관이 내주는 이름의 가져오기를 지운다. `daysFromNow` 는 이 PR 뒤 getter 만 쓰므로 getter 와 함께 풀린다 |
| expose 문(통로 getter·setter) | 7 → 8 | 78 | 재철거 3차(unwire U2). **늘어난 하나는 이 PR 이 다시 단 `daysFromNow` getter(3줄)**. `state` · `_promptEncyclopediaOpen` 의 getter·setter 는 그 이름의 상태 이전 때 지워진다 |
| 상태 선언(var) | 4 → 4 | 4 | `state` · `_promptEncyclopediaOpen`: **지금 상태 이전(unstate)이 가능하다** — 임시 사본에서 생성기가 둘 다 받았다(#949 · #948 덕). 상태 이전 뒤 그 정의 줄을 구역으로 옮긴다. `SUPABASE_URL` · `SUPABASE_ANON_KEY`: 공개 키 글자가 든 줄을 새 파일에 더하는 커밋을 금지 패턴 규칙이 막는다 → **결심 필요**(규칙의 예외 · 키를 두는 자리 · 또는 finalize 가 그 문을 인라인에 남기는 길) |
| 상태 기관 정의 줄(define) | 9 → 1 | 1 | `sb`: 위의 두 선언을 읽는다 — 그 둘과 한 묶음(같은 결심) |
| if 문 | 2 → 0 | 0 | (이 PR 로 풀림) |
| window 대입 | 1 → 0 | 0 | (이 PR 로 풀림) |
| **막는 문 합계** | **84 → 74** | **144**(기준 297) | |
| 키트 손잡이 · 구역 함수 가져오기 · 구역 함수 호출문(finalize 가 받는 것) | 44 → 60 | 60 | 손잡이 10 · 가져오기 25 · 호출문 25 |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 다른 index.html PR 이 먼저 병합된다 → 실제로 재철거 2차(#943)와 944줄 함수 3단계(#949)가 먼저 병합됐고, 그때마다 합친 뒤 index.html · 기준선을 main 판으로 두고 같은 설정으로 생성기를 다시 돌려 전부 다시 쟀다(L010). push 직전에 origin/main 을 다시 확인했다.
- **실제로 막힌 것 ①**: 작업 번호가 겹쳤다(#942 가 675 를 썼다) → 676 으로 옮기고 전부 다시 쟀다.
- **실제로 막힌 것 ② — 결심이 필요한 지점**: 서버 주소·공개 키 선언과 `sb` 정의 줄은 금지 패턴 규칙 때문에 index.html 밖 파일로 갈 수 없다. finalize 는 IIFE 를 통째로 `js/app/boot.js` 로 옮기므로, 이 세 문이 최상위에 남아 있는 한 전제를 채울 수 없고, 구역 함수로 옮기는 길도 같은 규칙에 걸린다. 길은 작업자가 고르지 않는다(오케스트레이터가 상민님께 여쭙는 중이다): 규칙에 이 공개 키 줄의 예외를 둔다(금고·규범 변경) / finalize 가 그 세 문과 앞의 호출 하나를 인라인에 그대로 남긴다(생성기 옵션 — 따로 조사해 보고했다) / 키를 설정 파일로 옮기는 별도 설계.
- **측정불가**: 로그인 뒤에만 도는 길(서버 피드가 피드 캐시를 채우는 것 · 구글 캘린더 연동 뒤 토큰 저장 · 공유 팀 불러오기 — 그 값을 맡기는 정의 줄·window 대입 줄이 같은 때 같은 값으로 도는 것까지만 쟀다) · 운영 환경.
- **성과 측정**: inlineScriptLines 751 → 584(−167, 출처 `measurement.json` `metrics`). IIFE 최상위에 남은 상태 기관 정의 줄 9 → 1, finalize 를 막는 문 84 → 74(그 줄 수 297 → 144).
