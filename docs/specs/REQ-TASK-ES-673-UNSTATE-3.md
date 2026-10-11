# REQ — #TASK-ES-673 미분화 덩어리 해체 상태 이전 3차: 새로 옮길 수 있게 된 상태 이름 9개의 소유를 상태 기관으로

- Task ID: **TASK-ES-673** (L012: `gh pr list --state all` · `git ls-remote origin` · `docs/rules/TICKETS.md` 에서 673 이 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-673-unstate-3` 를 먼저 push 해 선점했다. 672 는 다른 작업의 브랜치가 이미 있다.) · 분류: INFRA(미분화 덩어리 해체)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main) 열린 지시: **DIR-003**(B 트랙 — 줄을 지우는 PR 마다 기준선에 inlineScriptLines 기록) · **DIR-004**((가) 닫힌 목록 X4·X5·X6 — 상태 변수의 소유를 상태 기관으로).
- 작업 유형(SNOWBALL 분류): **(가) 표준 — 「상태 이전」 셋째 사례**. 선례 #914(#TASK-ES-637 상태 이전 1차) · #927(#TASK-ES-649 상태 이전 2차)의 절차·실행기·증거 꼴을 그대로 따른다(적용 → 측정 → 주장을 실행기 하나로 · 기준선 기록 · 되짚기 · push 전 로컬 법정). 작업참고 **기준 PR #934**(d55d7595, 경험칙 115개 — L002 · L010 · L012 · L047 · L064 · L110).
- 선행 PR: **#937**(#TASK-ES-665 — 상태 선언 줄 다듬기. `_subtabTplCat` · `_subtabTplQuery` 의 겹친 선언, `_subtabTplDomain` · `_subtabTplType` · `FEED_POSTS_CACHE` 의 줄 끝 주석, `shareContent` 의 한 줄 두 문을 풀었다) · **#939**(#TASK-ES-671 — 템플릿 부품 초기화 블록을 세포로 옮겨 IIFE 안에서 `sb` 를 맨이름으로 읽던 마지막 자리가 없어졌다).
- 이 작업 세션은 빌더(서브에이전트)다. 병합은 하지 않는다(오케스트레이터 몫). push 는 번호 선점 1회 + 마무리 1회다.
- 기준 main: **2a1507eb**(#939 병합 뒤). push 직전에 origin/main 을 다시 확인했다.
- 설계 정본: `docs/architecture/CELL-REGISTRY-DESIGN.md` 3.3 · 4절 · 5.5.
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 원문의 어느 문장 | 완료 기준 |
|---|---|---|---|
| R1 | index.html 인라인 IIFE 에서 새로 옮길 수 있게 된 통로 노출 상태 이름 9개의 소유를 상태 기관으로 옮긴다 — 생성기 unstate 한 번(손 편집 0). 앱 동작은 그대로다 | 「남은 미분화작업 모두 진행」 · DIR-003 | 게스트 화면 시나리오 다섯이 기준·작업 양쪽 통과 · 법정의 생성기 재실행 결과와 index.html 이 바이트 동일 |
| R2 | 옮긴 이름은 상태 기관이 같은 값 · 같은 종류의 접근자로 통로에 내준다 | 설계 3.3 · 오케스트레이터 지시(상태 탐침 · 대조 탐침 지문 · 쓰기 왕복 · window 복사 동일성 · 기관이 맡은 이름 수) | 통로 노출 상태 이름 11개의 값 요약 · 접근자 종류 · window 복사 · 쓰기 왕복에서 함수 이름 칸 말고 다른 것이 있는 이름 0 · 통로에서 사라진 이름 0 · 인라인에 선언 없이 남은 참조 0 |
| R3 | 지우고 바꿔 쓰는 대상은 닫힌 목록 X4·X5·X6 의 줄뿐 · names 밖 이름 · 그 밖의 글자 불변 · 바뀐 제품 파일은 index.html 하나 | DIR-004 (가) | 되짚기 결과 == 작업 index.html · 종류 밖 삭제 줄 0 · names 밖 이름 0 |
| R4 | 증명 하한과 기준선 기록 | 설계 4절 · DIR-003 | inlineScriptLines 감소와 `module-guard --update` 기록 · 모듈 로드 새 회귀 0 · npm test 기준/작업 같음 · 무결성 게이트 38/38 · tests/ · 금고 · 생성기 · 상태 기관 변경 0 |
| R5 | 남은 상태 이름을 풀리는 조건별로 다시 재서 남긴다 | 오케스트레이터 지시 「끝에 남은 상태 이름 표(풀리는 조건별)」 | `reports/TASK-ES-673/remaining-state.json` |
| R6 | 서버 연결 객체 `sb`: 접근자 종류(원래 노출 줄 기준)와 `L.sb` 로 읽는 쪽이 같은 값을 받는지 탐침으로 확인 | 오케스트레이터 지시 | 접근자 기준·작업 모두 get 만 · 값 null/null · 엄격 모드 대입 결과 같음 · 가짜 연결 라이브러리로 「null 이 아닐 때 같은 객체」 확인 |
| R7 | 공유 함수 `shareContent`: `define(…)` 인자가 되면 함수의 `.name` 이 빈 글자가 된다 — 동작에 영향이 있는지 실측 | 오케스트레이터 지시 | name 을 읽는 자리 정적 0 · 덫에 걸린 읽기 0 · 호출 기록 기준과 같음 |
| R8 | 진짜 서버에 붙은 상태에서 `sb` 로 하는 일이 이전 전과 같다 | 오케스트레이터 지시 「실서버에서만 드러나는 부분은 한계로 사실대로(needs-live-server 주장 하나)」 | **이 PR 에서 확인 못 함** — 사람이 실계정으로 확인(절차는 주장에 적음) |

- 원문에 있는데 이 PR 항목에 없는 요구(목표 줄에 남긴다): 남은 상태 이름 4개(`state` · `_promptEncyclopediaOpen` · `SUPABASE_URL` · `SUPABASE_ANON_KEY`) · 944줄 함수 3단계 · 재철거 2차 · sweep · finalize. 「병합도 스스로」 — 이 PR 의 병합은 판정 뒤 오케스트레이터가 한다(이 작업자는 병합하지 않는다).

### 구체 식별자

- 고친 제품 파일: `index.html` 하나(+11 −32).
  - 지운 21줄: 대상 이름의 expose getter/setter 속성 11줄(`FEED_POSTS_CACHE` · `MOCK_GROUPS` 는 두 expose 문에 한 줄씩 있었다)과, 속성이 모두 지워진 expose 문 5개의 머리·꼬리 10줄.
  - 바꿔 쓴 11줄: 선언문 9개 — `var sb = …;` · `var btnAvLvClose = …;` · `var MOCK_GROUPS = [ … ];`(144줄짜리 배열, 머리와 끝 두 줄만) · `var shareContent = function(opts){…};` → `window.OurgoalAppState.define('이름', 초기값);`(읽기 전용 4) · `var _subtabTplCat = 'all';` · `var _subtabTplQuery = '';` · `var _subtabTplDomain = 'personal';` · `var _subtabTplType = 'ai';` · `var FEED_POSTS_CACHE = null;` → `window.OurgoalAppState.defineVar('이름', 초기값);`(읽기쓰기 5) · window 복사 1줄 `window.shareContent = shareContent;` → `window.shareContent = window.OurgoalAppScope.scope.shareContent;`
- 그 이름을 읽고 쓰는 세포(변경 0 — 글자 `L.이름` 그대로): `L.sb` 를 읽는 줄 81(대입 0) · `L.MOCK_GROUPS` 51(대입 0 — 배열 제자리 변경 `unshift` 는 `js/tabs/comm/shared-groups.js` · `feed-posts-sync.js` · `peer-invite.js`) · `L.FEED_POSTS_CACHE` 28(대입 7곳 — `js/tabs/comm/feed-list.js` · `feed-posts-sync.js` · `goal-certificate-share.js` · `js/tabs/goals/focus-autopilot.js` · `js/tabs/records/checkin-feedback.js` · `share-to-feed.js`) · `L._subtabTpl*` 넷(대입 8곳 전부 `js/tabs/goals/template-encyclopedia.js`) · `L.shareContent` 2(`js/tabs/comm/feed-list.js` · `js/tabs/records/template-market.js`) · `L.btnAvLvClose` 1(`js/core/boot-early-state.js` 의 `bootAvatarLevelUpWiring`).
- 새 도구(제품 코드 아님): `reports/TASK-ES-673/unstate-run.cjs`(#927 의 실행기를 본뜸) · `reports/TASK-ES-673/tools/handle-probe.cjs`(손잡이 탐침) · `reports/TASK-ES-673/tools/name-readers-scan.cjs`(공유 함수 정적 검사) · `reports/TASK-ES-673/tools/state-bare-refs.cjs`(남은 이름 `state` 의 참조 위치)
- 기록: `docs/architecture/module-baseline.json`(`module-guard --update` 가 68번째 항목을 더함) · `docs/rules/TICKETS.md` · `reports/TASK-ES-673/`
- 손대지 않은 것: `js/**` 전부 · 생성기 · tests/ · 금고 · 생성 지도 3종
- 화면 식별자(시나리오): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnGoalsSubTemplate` · `#encyclDomainPersonal` · `#encyclDomainRoutine` · `#encyclDomainTeam` · `#subtabTplBtnAi` · `#subtabTplBtnReal` · `#templateEncyclopediaView [data-subtcat=…]` · `#subtabTplSearchInp` · `#subtabTplSearchClear` · `.comm-subtab[data-sub="feed"]` · `#commSubBody` · `#commBody [data-sub="group"]` · `[data-open-group="g-workshop"]` · `#grpBack` · `#btnHeroCreateTeamComm` · `#tplMarathonSmall` · `#gTopicMajor` · `#gTopicSub` · `#grpSave`. 탐침이 만지는 요소: `#btnAvatarLevelUpClose` · `#avatarLevelUpModal` · `.mkt-preview-btn` · `#mktPreviewShareBtn`

## 1. [원칙 ①] 문제를 정확히 파악한다

- 상태 이전 2차(#927) 때 이 이름들은 옮길 수 없었다: `sb` · `MOCK_GROUPS` 는 IIFE 안 코드가 맨이름으로 썼고, `_subtabTplCat` · `_subtabTplQuery` 는 선언이 둘이었고, `_subtabTplDomain` · `_subtabTplType` · `FEED_POSTS_CACHE` · `shareContent` 는 선언문이 다른 글자와 한 줄을 나눠 썼다. `btnAvLvClose` 는 통로에 노출되지 않았다.
- 그 뒤 #933(#TASK-ES-650 구역 이전 — `btnAvLvClose` 를 쓰는 닫기 배선이 세포 `js/core/boot-early-state.js` 의 `bootAvatarLevelUpWiring` 으로 가며 통로 getter 가 생겼다) · #937(선언 줄 다듬기) · #939(`sb` 를 맨이름으로 읽던 블록 이전)가 병합됐고, `MOCK_GROUPS` 를 IIFE 안에서 맨이름으로 쓰던 자리도 세포로 옮겨졌다. 현재 main 에서 통로에 노출된 상태 이름 11개를 하나씩 생성기에 돌리면 **옮길 수 있음 10 · 멈춤 1(`state`)** 이다.
- 이 가운데 둘은 값의 성격이 다르다. `sb` 는 서버 연결 객체이고 법정·작업자 PC 의 브라우저에서는 null 이다(외부 통신이 막혀 연결 라이브러리가 뜨지 않는다). `shareContent` 는 함수이고, 선언문 `var shareContent = function(opts){…};` 이 `define('shareContent', function(opts){…});` 가 되면 그 함수의 `.name` 이 `'shareContent'` 에서 `''` 로 바뀐다(변수 선언의 오른쪽에 있는 이름 없는 함수식에는 엔진이 변수 이름을 붙여 주지만, 호출 인자 자리의 함수식에는 붙이지 않는다).

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 상태 하나에 주인 하나. 값은 기관이 보관하고 통로의 접근자도 기관이 단다.
- **원인**: 값이 IIFE 지역 변수여서 이름마다 getter/setter 줄이 index.html 에 있어야 했다. 그 줄과 선언문이 IIFE 를 비우는 일(finalize)을 막는다.
- **중심**: 생성기 unstate 한 번, 설정 `reports/TASK-ES-673/proof.json`(`unstate.names` 9개).
- **핵심**: ① 읽기쓰기 이름이 읽기쓰기로 가는가(생성기는 지우기 직전 마지막 노출 문에 `set` 이 있었는지로 정한다 — L047). ② `sb` 가 원래와 같은 읽기 전용 접근자로 가고, 읽는 쪽이 같은 값을 받는가. ③ `shareContent` 의 name 변화가 동작에 닿는가.

## 3. [원칙 ③] 해결 방식

1. 대상을 다시 잰다: 작업 트리에서 통로에 노출된 상태 이름 11개를 하나씩 생성기에 돌린다 → 옮길 수 있음 10 · 멈춤 1. 무결성 게이트가 선언 글자를 붙잡는 `_promptEncyclopediaOpen` 을 뺀다(`reports/TASK-ES-636/pinned-state.exclude.json`) → 9개.
2. `unstate-run.cjs apply` → `module-guard --update`.
3. 시나리오 다섯: 게스트 여섯 탭 · 템플릿 하위 탭의 분류·검색·종류·영역 · 소통 피드 · 예시 모임 목록과 상세 · 팀 개설(모임 목록 배열에 끼워 넣기).
4. `unstate-run.cjs measure` — #927 의 측정 전부 + 손잡이 탐침(기준 2회 · 작업, 가짜 연결 라이브러리 방식 같은 세 번) + 공유 함수 정적 검사(기준 · 작업) + 인라인 문법 분석(선언 없이 남은 참조).
5. `claims`.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **읽기쓰기 다섯이 defineVar 로 갔는가** → 생성기 기록 `api`: `_subtabTplCat` · `_subtabTplQuery` · `_subtabTplDomain` · `_subtabTplType` · `FEED_POSTS_CACHE` = defineVar. 작업 트리에서 다섯 다 통로 접근자 get+set · 주인 `core/app-state`. 쓰기 왕복은 쓰기 가능한 이름 7개(옮긴 5 + 남은 2)에서 기준 7/7 · 작업 7/7.
- **`FEED_POSTS_CACHE` 는 노출 줄이 둘이었다(앞은 get 만, 뒤는 get+set)** → 생성기는 마지막 노출 문을 본다 — defineVar. 대입하는 세포 7곳이 전부 `L.FEED_POSTS_CACHE = …` 꼴이다.
- **`sb` 의 접근자** → 원래 노출 줄은 `get sb(){ return sb; }` 하나(set 없음). 생성기가 `define` 을 골랐고, 통로 접근자는 기준 get · 작업 get. 엄격 모드로 `L.sb = …` 를 시도하면 기준·작업 모두 TypeError 이고 값은 그대로다. 저장소에 `L.sb = …` 대입 자리는 0 곳이다.
- **`sb` 를 읽는 쪽이 같은 값을 받는가** → 게스트 부팅에서 값은 기준·작업 모두 null, 템플릿 부품 초기화가 건네받은 값이 통로의 값과 같다(기준 · 작업). null 끼리의 비교만으로는 약하므로, 페이지가 뜨기 전에 가짜 연결 라이브러리(`window.supabase.createClient` 가 기록용 대역 객체를 돌려줌)를 심어 한 번 더 쟀다: 연결 만들기 1회(인자 2개 — 주소 글자 40자 · 키 글자 208자, 값은 적지 않았다), 그 객체가 통로 · `window.sb` · 부품 초기화에 같은 것으로 닿고, 부팅 동안 그 객체의 맨 위 속성을 읽은 기록(`auth` 6번)이 기준(2회)과 작업에서 같다. **이것은 진짜 서버가 아니다** — 서버 동작은 R8 로 남긴다.
- **`shareContent` 의 name** → ① 정적 검사: 제품 코드 375개 파일(인라인 스크립트 포함)에서 이 함수 객체가 쓰이는 자리는 「부른다 5 · 있는지만 본다 2 · 딴 이름에 담아 부른다 2 · 같은 이름으로 window 에 단다 2」와 엔진 파일(`js/viral-sharing.js`)의 선언·내보내기뿐이고, 속성(`name` · `length` · `toString` 등)을 읽는 자리 0 · window 나 통로를 통째로 훑는 줄 0. ② 덫: 함수가 `window.shareContent` 에 달리는 순간 `name` 을 「읽힌 횟수를 적는 getter」로 바꿔 두고 부팅 · 여섯 탭 · 호출 · 장터 미리보기 공유 단추를 돌렸다 — 읽기 0번(기준 · 작업 · 가짜 연결 방식 기준 · 작업). ③ 호출: 공유 엔진을 기록용 대역으로 잠깐 바꾸고 통로와 window 로 불렀다 — 같은 인자 객체가 넘어가고 엔진의 반환값이 그대로 돌아오며, 장터 미리보기의 공유 단추가 엔진을 1번 부르고(종류 `template`, id 가 그 템플릿의 키), 엔진이 없으면 Promise 가 돌아온다. 기록이 기준과 같다. → **동작에 닿는 자리를 찾지 못했다. 그래서 이 이름을 대상에 넣었다.**
- **그 대신 지문이 달라진다** → 상태 탐침과 등록 기관 대조 탐침의 함수 지문은 `function:<name>:<인자 수>:<본문 해시>` 꼴이라 이 이름 하나에서 달라진다(`function:shareContent:1:be1cd1b1` → `function::1:be1cd1b1`). 「차이 0」이라고 쓰지 않고, 「함수 이름 칸만 다른 이름 1 · 그 밖 0」으로 갈라 주장에 적었다.
- **`MOCK_GROUPS` 는 세포가 제자리에서 바꾸는 배열이다** → 기관은 같은 배열 객체를 돌려준다(두 번 읽어 같은 것 · 끝에 하나 넣으면 통로로 보임 · 빼면 원래대로 — 기준과 같다). 팀 개설 시나리오(u5)가 `unshift` 한 것이 목록 화면에 그려지는 길을 지난다.
- **`btnAvLvClose`** → 통로 값이 문서의 `#btnAvatarLevelUpClose` 와 같은 요소이고, 레벨업 창을 열어 그 요소를 누르면 닫힌다(작업 트리 — 닫기 배선이 돈다).
- **선언 전에 읽는 자리** → 선언문은 자리를 옮기지 않았다(초기값 계산 순서 그대로). 다만 기준에서는 통로 getter 가 선언보다 앞줄에서 달렸고(읽으면 undefined), 작업에서는 define 줄에 와서야 통로에 이름이 생긴다(읽으면 undefined). 값은 같고, 그 사이에 `'이름' in L` 을 보는 코드는 찾지 못했다. 게스트 부팅 예외 수는 기준과 같다.
- **허용 종류 밖의 줄** → 되짚기 결과 == 작업 index.html, 종류 밖 삭제 줄 0, names 밖 이름 0.

## 5. [원칙 ⑤] 절차

1. origin/main(2a1507eb) 기준 worktree · 번호 선점 · `npm ci --ignore-scripts` · 기준 트리(분리 worktree).
2. 실행기 `apply`(조사 겸) → `shareContent` name 조사(정적 검사 · 덫) → 손잡이 탐침 작성 → `module-guard --update`.
3. 시험: npm test(기준 · 작업) · 시험 하나씩(기준 · 작업) → 시나리오 다섯 → `measure`.
4. REQ · 작업표 → npm test 작업 트리 다시(L064) → `measure` · `claims`.
5. `verify-integrity-gate` → 커밋 → `recomputeSplit` 직접 호출과 로컬 법정 전체 실행 → origin/main 확인 → push 1회 → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「name 이 바뀌면 동작 보존이 아니다」** → 함수 객체의 한 속성이 달라지는 것은 사실이다. 숨기지 않았다(R7 · 주장 · 범위 밖 보고). 다만 그 속성을 읽는 코드가 제품에 없고(정적 0 · 덫 0), 부르는 쪽이 받는 것(인자 전달 · 반환값)은 같다. 사람이 개발자 도구에서 보는 호출 스택의 이름은 달라진다 — 재지 않았다. **이것을 이유로 이 이름을 빼는 쪽이 낫다고 보시면 돌려보낼 지점이다**: `proof.json` 의 names 에서 `shareContent` 를 지우고 다시 돌리면 된다(8개).
- **반론 2 「null 인 값의 접근자만 재서는 `sb` 를 쟀다고 할 수 없다」** → 맞다. 그래서 가짜 연결 라이브러리로 null 이 아닌 값의 길을 따로 쟀고, 그것도 서버 동작은 아니라고 적었다. 진짜 서버에서의 동작은 R8(확인 못 함)이다.
- **반론 3 「팀 개설 시나리오는 쓰는 조작이다」** → 게스트는 서버 연결 객체가 null 이라 그 브라우저 안에서만 만들어진다(법정의 임시 브라우저). 앞선 작업의 시나리오 `reports/TASK-ES-448/scenarios/comm-team-create-category.json` 을 그대로 가져온 것이다. 읽기만 하는 모임 목록·상세 시나리오(u4)를 따로 두었다.
- **반론 4 「`btnAvLvClose` 는 지시에 없던 이름이다」** → 지시는 「그 밖에 생성기가 옮길 수 있다고 하는 이름」을 포함한다. 대상은 사람이 고르지 않고 생성기가 고른다.
- **재검증(되짚기)**: 기준 index.html 4,187줄에서 생성기가 적어 낸 21줄을 빼고, 선언 머리 9 · 선언 끝 9 · window 복사 오른쪽 1 을 정해진 글자로 바꿔 쓴 결과가 작업 index.html 4,166줄과 글자 그대로 같다(쉼표를 뗀 줄 0).
- **재검증(시험 전부)**: 스크립트 넷과 `tests/*.test.js` 114개를 하나씩 돌린 결과가 기준과 같다(실패 집합 26 = 26, 작업에서만 깨진 것 0).
- **재검증(탐침의 본질 변동)**: 상태 탐침과 손잡이 탐침을 기준에서 두 번 돌렸다. 상태 탐침에서 두 번 사이에 달라지는 이름은 `state` 하나이고(비교에서 뺐다) 손잡이 탐침은 두 번이 통째로 같다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-673/` 아래. 수치는 `measurement.json` 이 각 결과에서 읽어 모은 것이다(L002).

| 파일 | 무엇 |
|---|---|
| `proof.json` | 생성기 설정: `mode:"unstate"` · `unstate.names` 9개 · cells `js/core/app-state.js` |
| `unstate-meta.json` | 생성기 산출 — define 4 · defineVar 5 · 지운 줄 21 · 쉼표 0 · 바뀐 줄 11 · index.html 4187 → 4166줄 · 옮길 수 있음 10 · 멈춤 1 · 제외 1 · 노출 안 됨 2 |
| `state-probe.{base,base2,work}.json` · `probe-names.json` | 상태 탐침: 이름 11개 · 달라진 이름 1(`shareContent` — 함수 이름 칸만) · 그 밖 0(본질 변동 `state` 제외) · 기관 이름 65 = 기준 56 + 설정 9 · 쓰기 왕복 7/7 · window 복사 동일 5/5 |
| `handle-probe.{base,base2,work}.json` · `handle-probe-fake.{base,base2,work}.json` | 손잡이 탐침(게스트 부팅 + 여섯 탭 / 가짜 연결 라이브러리): 주인 표시·기관 종류·함수 이름 칸을 가리면 기준과 작업이 통째로 같다 |
| `name-readers.{base,work}.json` | 공유 함수 정적 검사: 속성을 읽는 자리 0 · 통째로 훑는 줄 0 |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 등록 기관 대조: 불일치 0 · 통로에서 사라진 이름 0 · 지문이 달라진 이름 통로 1 · window 1(둘 다 `shareContent`, 함수 이름 칸만) |
| `scenario-local.json` | 시나리오 5개 기준·작업 통과(비공허 단언 13 · 20 · 1 · 4 · 1), 예외 0/0 |
| `module-load.json` · `npm-test-compare.json` · `tests-{base,work}.json` · `raw/` | 모듈 로드 새 회귀 0 · npm test 기준/작업 같음(✓ 487 = 487 · ok 172 = 172) · 시험 하나씩 실패 집합 같음 |
| `measurement.json` | 위 전부 + 제품 파일 = index.html 하나 · 되짚기 결과 == 작업 index.html · inlineScriptLines 1917 → 1896(−21 = 지운 줄 수) · 기준선 마지막 기록 = 측정값 · module-guard 종료 0 · 무결성 게이트 38/38 |
| `remaining-state.json` · `state-bare-refs.json` | 남은 상태 이름 4개를 풀리는 조건별로 · `state` 를 맨이름으로 읽는 자리가 든 함수 |
| `claims.json` | 주장(보존 5 + 기록 + 확인 못 함 1) |
| `court-local.json` | 로컬 법정 전체 실행 요약(작업자 PC — 판정 아님) |

### 남은 상태 이름 4개 — 풀리는 조건별

| 조건 | 수 | 이름 | 무엇이 되면 풀리는가 |
|---|---|---|---|
| 맨이름 참조가 남음 | 1 | `state` | IIFE 에 남은 함수 넷이 이 이름을 맨이름으로 읽는다 — `openProTemplateRecordModal`(2곳) · `bindProRecTools`(1) · `bindProRecTrendChart`(2) · `bindProRecSave`(30), 합 35곳(`state-bare-refs.json`). 이 함수들이 세포로 옮겨져(944줄 함수 3단계) `L.state` 로 읽게 되면 unstate 로 다시 |
| 무결성 게이트가 상태 선언 글자를 붙잡음 | 1 | `_promptEncyclopediaOpen` | `scripts/verify-integrity-gate.js` 가 index.html 에서 `_promptEncyclopediaOpen = false;` 글자를 찾는다. 그 단언을 넓히는 PR(금고 변경 승인분)이 병합된 뒤 unstate 로. 생성기는 지금도 옮길 수 있다고 판단한다 |
| 통로에 노출되지 않음 | 2 | `SUPABASE_URL` · `SUPABASE_ANON_KEY` | 상태 기관 대상이 아니다(통로로 읽는 세포가 없다). 이 둘을 쓰는 문은 `sb` 의 define 줄 하나다 — 그 줄과 함께 구역 감싸기(region, X7)로 세포 함수의 지역 변수가 되면 된다 |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 다른 index.html PR(재철거 2차 · 944줄 함수 3단계)이 먼저 병합된다 → 합친 뒤 index.html · 기준선을 main 판으로 두고 `apply` 부터 다시 돌린다(L010). push 직전까지 origin/main 은 2a1507eb 그대로였다.
- **예상**: 법정의 생성기 재실행 대조 → push 전 `recomputeSplit` 직접 호출과 로컬 법정 전체 실행.
- **예상**: 판정은 「확인 부족」으로 나온다 — R8(실서버 필요)이 법정 도구로는 확인할 수 없는 주장이기 때문이다(#939 와 같은 꼴).
- **측정불가**: 진짜 서버에 붙은 `sb` 로 도는 화면(로그인 · 서버 피드 · 실시간 구독 · 저장) · 로그인 뒤에만 도는 `FEED_POSTS_CACHE` 채우기(게스트는 서버 피드를 불러오지 않는다 — 접근자 종류 · 쓰기 왕복 · 대입 자리 글자로만 쟀다) · 개발자 도구의 호출 스택 표시 · 레벨업 창이 실제로 뜨는 경로(레벨이 오르는 순간) · 운영 환경.
- **성과 측정**: inlineScriptLines 1917 → 1896(−21, 출처 `measurement.json` `summary.inlineScriptLines`). 인라인 IIFE 의 상태 이름 13 → 4. 통로에 `index.html` 주인으로 노출된 상태 이름 11 → 2.
