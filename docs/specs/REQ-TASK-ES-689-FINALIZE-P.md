# REQ — #TASK-ES-689 미분화 덩어리 해체 마지막 정리(finalize · P안): 시동 문을 js/app/boot.js 로, index.html 에는 상수 선언 두 줄만

- Task ID: **TASK-ES-689** (L012: `gh pr list --state all` · `git ls-remote origin` · origin/main 의 작업표에서 689 가 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-12-task-es-689-finalize-p` 를 먼저 push 해 선점했다. 685 는 닫힌 PR #959 의 번호, 687(#961) · 688(#960) 은 다른 몫이다.)
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「생성기로 옮기기」의 마지막 단계**(설계 `docs/architecture/CELL-REGISTRY-DESIGN.md` 5.8절 X9 finalize · 5.9절 `relay` · `keepGlobalConst`). 옵션은 #955 · #961 이 만들었고 단위 시험과 모의 적용까지 있었다. **이번이 index.html 에 실제로 돌리는 PR 이다.**
- 작업참고 기준 PR #934(d55d7595, 경험칙 115개) · 기준 main 13250583(#961 병합 뒤). **생성기는 그 main 의 것 그대로다**(이 PR 에서 생성기 · 하네스 변경 0).
- 지시함(origin/main) 열린 지시: **DIR-003**(기준선에 inlineScriptLines 기록) · **DIR-004**((가) 「닫힌 목록(U1~U3 + X1~X9)까지다. **목록 밖의 줄 종류는 다시 결심이다.**」 — finalize 는 X9(목록 안), `relay` · `keepGlobalConst` 는 **목록 밖**이다. 아래 결심 기록으로 승인됐다).
- **결심 기록(오케스트레이터가 전한 글자. 이 작업자는 그 채팅을 직접 보지 못했다)**
  - **2026-10-11**(커맨드센터 세션 309dca5d): 오케스트레이터가 여쭌 세 가지 가운데 ② 「`renderTeamGoalsScreen` 통로 연결 2줄을 **글자 그대로 옮김**」 — 상민님 답 원문 **「권장대로 모두 진행」**. → `relay`.
  - **2026-10-12**(같은 세션): 승인받았던 꼴(서버 연결 세 줄을 인라인에 남김 — #959)이 독립 확인에서 로그인 사용자 부팅 차이를 보여 병합하지 않았고, 오케스트레이터가 다시 여쭈었다 — **P안**: 서버 주소·공개 키 **선언 두 줄만** index.html 에 남기고 연결 만들기와 나머지는 전부 부팅 파일로(442 → 24줄, 덩어리 0줄, 키 금지 규칙 그대로 / 단점: 두 상수가 전역 변수가 됨 · 목록 밖 종류 하나 추가 / 못 잰 것: 느린 망에서의 테마 적용 시각 · 실서버 로그인 뒤 끝 화면) / Q안 / 나안. 상민님 답 원문: **「p안 승인」**. → `keepGlobalConst`.
  - **한도**: `keepGlobalConst` 는 그 **두 상수 선언에만** 쓴다(`statements` = 두 줄, `readers` = 그 둘을 읽는 `sb` 정의 한 줄). `relay` 는 `renderTeamGoalsScreen` 하나. 그 밖의 문 · 이름에는 쓰지 않는다.
- **상민님 지시 원문(2026-10-11, 같은 세션 — 글자 그대로)**: 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마. 지침이나 결심이 필요한점?」
- 이 작업 세션은 빌더다. 병합은 하지 않는다(오케스트레이터 몫 — 다른 담당의 독립 확인 결과와 법정 판정을 함께 보고 병합한다. 병합되면 곧바로 운영에 나간다).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 알고 병합하는 차이(숨기지 않는다)

| 차이 | 무엇 |
|---|---|
| **전역 이름 둘** | `SUPABASE_URL` · `SUPABASE_ANON_KEY` 가 `window` 의 속성이 된다(지금은 IIFE 지역이라 밖에서 안 보인다). 최상위 `var` 라 지울 수 없다. 값은 지금도 index.html 에 적힌 공개 글자다. 저장소에서 그 이름을 읽거나 「없음」을 전제하는 화면 코드 · 시험 · 가드는 0(생성기의 전역 이름 검사: 스크립트 372개에서 걸림 0). **공식 지표는 최상위 `var` 를 세지 않아 이 변화가 지표로는 보이지 않는다** |
| **script 태그 +1** | `<script src="js/app/boot.js"></script>` — 남긴 `</script>` 바로 뒤 같은 줄. defer · async 없음 |
| **실행 위치** | 시동 문 59개(연결 만들기 포함)가 인라인에서 부팅 파일로. 차례는 같다. 연결 만들기와 두 인증 수신기 걸기는 한 스크립트(부팅 파일) 안에 있다 |
| **테마 적용 시각** | 테마 적용 호출(`bootApplySavedTheme`)이 부팅 파일의 첫 호출이 됐다. 지금은 인라인이라 앞 스크립트들이 끝난 직후에 돌고, 이제는 부팅 파일을 받은 뒤에 돈다 — 요청 하나만큼 늦을 수 있다(로컬에서는 잴 수 없다) |
| **상수 선언의 자리** | 두 선언이 원래(테마 적용 호출 뒤)보다 앞에서 돈다. 문자열 상수라 값도 부수효과도 같다 |

## 0. 요구 (지시 항목)

| ID | 지시 | 완료 기준 |
|---|---|---|
| R1 | 인라인 IIFE 의 시동 문을 생성기(`mode:"finalize"` · `relay` · `keepGlobalConst`)로 부팅 파일 `js/app/boot.js` 로 옮기고 앱 동작을 보존한다 | 게스트 시나리오 30개가 기준 2회 · 작업 1회 통과 · 생성기 재실행 대조 |
| R2 | index.html 에는 서버 주소 · 공개 키 상수 선언 두 줄만 바이트 그대로, IIFE 껍데기 없이 남긴다. 공개 키 글자는 부팅 파일에 없다. 옵션은 승인된 자리에만 쓴다 | 남은 줄 바이트 동일 · 선언뿐 · 부팅 파일에 값 글자 없음 · 실제 커밋 훅 통과 |
| R3 | 옮긴 문은 글자와 차례가 기준과 같고 빠지거나 더해진 문이 없다. 연결 만들기와 인증 수신기 걸기가 한 스크립트 안에 있다. IIFE 밖의 글자는 부팅 파일 태그 하나 말고 바뀌지 않는다 | 문 단위 대조 · 되짚기 |
| R4 | 실행이 같다 — **돌아온 로그인 사용자 부팅**(진짜 라이브러리 두 판 × 세션 있음 · 없음 · 만료)의 인증 사건 줄이 직전 main 과 같고, 게스트 부팅의 사건 줄 · 대조 · 값 지문이 같다 | `auth-race.json` · 시점 탐침 · 대조 탐침 |
| R5 | 증명 하한 | 인라인 줄 수 감소와 기준선 기록 · 신고서 종류 · 모듈 로드 · npm test · 시험 하나씩 · tests/ · scripts/ · 금고 · 생성기 변경 0 |

- 범위 밖(하지 않음): 커밋 훅의 키 금지 규칙 변경(금고) · `renderTeamGoalsScreen` 함수 나누기(덩어리 해체 뒤의 별도 과제) · 다른 인라인 조각(접속 통계 · ESC 키 처리기 — 덩어리가 아니다) · 생성 지도 갱신(병합 뒤의 별도 PR — 선례 #960).

### 구체 식별자

- 파일: `index.html`(인라인 IIFE — 줄 2253~2674 가 4줄로) · **새 파일 `js/app/boot.js`**(부팅 기관) · `docs/architecture/modules.json`(신고서 — 세포 `app/boot`) · `docs/architecture/cell-descriptions.json`(세포 설명) · `docs/architecture/module-baseline.json`(기준선)
- 생성기 설정 `reports/TASK-ES-689/proof.json`: `mode: "finalize"` · `slot: "HO"`(법정이 요구하는 칸 — finalize 는 쓰지 않는다) · `cells: [{ file: "js/app/boot.js" }]` · `relay: [{ name: "renderTeamGoalsScreen" }]` · `keepGlobalConst: { statements: ["var SUPABASE_URL", "var SUPABASE_ANON_KEY"], readers: ["window.OurgoalAppState.define('sb'"] }`
- 생성기 `docs/design/harness/module-split/gen-inline-hard.js`(변경 0)
- 부팅 파일이 부르는 구역 함수 27개(키트 `window.OurgoalUiHelpers` 의 `bootApplySavedTheme` · `bootAuthStateListener` · … · `bootCommSettingsAndStart` · `bootInstallAndServiceWorker`) · 연결 만들기 `window.OurgoalAppState.define('sb', … window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) …)` · 통로 중계 `window.OurgoalAppScope.expose('index.html', { get renderTeamGoalsScreen … })`
- 새 도구(제품 코드 아님): `reports/TASK-ES-689/tools/finalize-run.cjs`(apply · scenarios · authrace · measure · claims) · `tools/order-probe-689.cjs`(시점 탐침) · `tools/remaining-inline.cjs` · `tools/auth-race.cjs`(**독립 확인 담당이 만든 도구를 글자 그대로 옮겨 둔 것** — 돌아온 로그인 사용자 부팅 탐침, `--expired` 포함)
- 화면 식별자(시나리오 30개): 등록·철거 12개(#957 의 것 그대로 — `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnGoalsSubPersonal` · `#homeAddGoal` · `#sanctuaryBellBtn` · `#setTermsLink` · `#landLoginLink` · `#micBtn` · `#recSamplePurgeBtn` · `#goalFastAddInput` · `#exportRecordsBtn`) · 전문 템플릿 기록 창 15개(#949 `reports/TASK-ES-672/scenarios/` 그대로) · 저장 → 다시 열기 → 새로 고침 3개(#954 `reports/TASK-ES-682/scenarios/` h2~h4 그대로)

## 1. [원칙 ①] 문제를 정확히 파악한다

재철거 5차(#957) 뒤 index.html 의 인라인 IIFE 는 420줄이고 문은 61개다 — 키트 손잡이 2 · 가져오기 28 · 구역 함수 호출문 27 · 통로 중계(expose) 1 · 서버 주소와 공개 키 선언 2 · `sb` 상태 선언(연결 만들기) 1. 함수 선언도 상태도 배선도 남지 않았다. 이것을 부팅 파일로 옮기면 덩어리가 없어진다.

걸리는 것이 둘이다.
1. **커밋 훅**: 서버 주소·공개 키 선언 줄은 새 파일로 옮기면 커밋 훅의 키 금지 규칙(금고)이 막는다.
2. **스크립트 경계**(앞선 PR #959 가 넘어진 자리): 그 선언과 연결 만들기를 인라인에 남기고 나머지를 부팅 파일로 보냈더니, 다른 담당의 독립 확인이 「저장된 세션으로 돌아온 로그인 사용자」의 부팅에서 차이를 쟀다 — 앱의 인증 수신기가 `SIGNED_IN` 을 받지 못한다. 연결 만들기(인라인)와 수신기 걸기(부팅 파일) 사이의 스크립트 경계에서 브라우저가 밀린 약속을 먼저 돌려, 라이브러리의 알림이 수신기보다 먼저 나갔기 때문이다. 문 차례는 글자로 같았고, 이 작업자의 그때 측정(게스트 시나리오 · 외부 통신을 막은 시점 탐침)은 그 조건을 재지 않았다(경위와 측정은 `docs/specs/REQ-TASK-ES-687-…` 1절 · 설계 5.9 「keepInline 의 한계」).

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 문을 한 글자도 바꾸지 않고, 도는 차례도 **같은 동기 구간**도 바꾸지 않고, 자리만 옮긴다.
- **원인**: 훅이 막는 줄(키 글자가 든 선언)과 차례에 민감한 줄(연결 만들기)은 서로 다른 줄이다 — 연결 만들기 줄에는 키 글자가 없다(이름만 있다).
- **중심**: 생성기 finalize 한 번, 설정 `reports/TASK-ES-689/proof.json`.
- **핵심**: index.html 에 남기는 것을 **차례에 무관한 문**(부수효과도 다른 이름 읽기도 없는 문자열 상수 선언 두 줄)으로 한정한다. 그러면 연결 만들기와 수신기 걸기가 다시 한 스크립트(부팅 파일) 안에 있다. 대가는 그 두 이름이 전역 이름이 되는 것이고, 그것을 상민님이 승인했다(「p안 승인」).

## 3. [원칙 ③] 해결 방식

1. `finalize-run.cjs apply` — `proof.json` 을 쓰고 생성기를 돌린다. 결과(생성기 출력 — `finalize-meta.json`):
   - index.html 2712 → 2294줄(지운 418줄 = IIFE 껍데기 3 · 문 줄 61 · 주석 270 · 빈 줄 84). `js/app/boot.js` 새 파일.
   - **index.html 에 남은 인라인 스크립트(4줄)**: `<script>` · `var SUPABASE_URL = '…';` · `var SUPABASE_ANON_KEY = '…';` · `</script><script src="js/app/boot.js"></script>`.
   - **부팅 파일의 문 59개**(기준 IIFE 61문에서 그 둘만 빼고 기준 차례 그대로): 손잡이 2 · 가져오기 28 · 통로 중계 1 · 구역 함수 호출 27 · 연결 만들기 1.
   - 생성기의 전역 이름 검사: index.html 이 부르는 로컬 스크립트 372개와 블록 밖 글자에 그 두 이름 0.
2. 신고서(`module-specs --write`) → **종류 한 칸을 손으로 정한다**(아래) → 세포 설명(`cell-desc-add.js`) → `module-guard --update`(낮아진 값).
3. 측정 → 주장.

**손 편집 한 칸(숨기지 않는다)**: 신고서 도구는 폴더 `js/app` 의 종류를 정하지 못해 `unclassified` 로 적고 모듈 가드가 멈춘다(종료 1). `docs/architecture/modules.json` 의 `app/boot` 칸 `kind` 를 `organ`(기관)으로 정했다 — 적용 도구가 그 한 칸을 적고 `finalize-meta.json` `spec` 에 전후를 남겼다. 다시 `module-specs --write` 를 돌려도 그 값은 보존되고 모듈 가드는 통과한다(종료 0). 도구와 가드 규칙은 바꾸지 않았다.

**줄 끝**: 부팅 파일은 생성기 산출 그대로다. 저장소에 들어가는 글자(커밋된 판)의 줄 끝은 다른 세포 파일과 같다(`git ls-files --eol` 로 확인 — 7절).

## 4. [원칙 ④] 재검토 (반례·부작용)

- **#959 가 넘어진 자리를 쟀는가** → 독립 확인 담당의 도구(`tools/auth-race.cjs`)로 **직전 main 과 이 작업 트리**를 맞댔다: 진짜 연결 라이브러리 두 판(저장소에 설치된 판 · 운영이 CDN 에서 받는 판) × 저장된 세션 있음 · 없음 · **만료**(라이브러리가 서버에 갱신을 요청하는 길 — 외부 통신이 막혀 요청은 실패한다). 모든 조건에서 인증 사건 줄이 직전 main 과 글자 그대로 같다. 세션이 있는 부팅에서 앱의 수신기 둘이 `SIGNED_IN` 을 받는다(걸려 있던 수신기 3 · 끝의 대기 세션 있음). 수치는 `auth-race.json` · 8절.
- **인라인에 순서 민감한 문이 남지 않았는가** → index.html 에 남은 블록을 다시 파싱했다: 문은 문자열 상수 선언 둘뿐이고 토큰은 `var` · 이름 · `=` · 문자열 · `;` 뿐이다(괄호 0). 생성기의 사후 대조도 같은 것을 본다.
- **연결 만들기와 수신기 걸기가 한 스크립트에 있는가** → 부팅 파일 안에 `sb` 정의 · `bootAuthStateListener()`(첫 수신기) · `bootCommSettingsAndStart()`(둘째 수신기를 거는 `runAppBoot` 를 부른다)가 그 차례로 있다(`summary.words.boot.createClientAndListenersInOneScript`).
- **빠지거나 더해진 문** → 기준 IIFE 의 문 61개가 겹침 없이 index.html 의 선언 블록(2)이나 부팅 파일(59) 가운데 한 곳에 있다. 부팅 파일의 문 차례는 기준과 같고 몸통은 그 문뿐이다.
- **선언이 앞당겨져도 되는가** → 기준에서 선언보다 앞에 있던 문(손잡이 · 가져오기 · 중계 · 테마 적용 호출) 가운데 그 이름을 읽는 것은 없다. 생성기는 있으면 멈춘다.
- **공개 키가 새 파일로 가지 않았는가** → 부팅 파일에 서버 주소도 키 꼴 글자도 없다(이름만 두 번 — 연결 만들기 줄). 선언 두 줄은 index.html 에서 기준 줄과 바이트로 같다. **실제 커밋이 훅을 통과했다**(우회 없음 — `commit-hook.json`).
- **IIFE 밖** → 기준 index.html 의 `<script>` 줄 뒤에 선언 줄만 남기고 `</script>` 줄에 부팅 파일 태그를 붙이면 작업 index.html 과 줄 단위로 같다(되짚기). 다른 글자 변경 0.
- **게스트 부팅** → 사건 364건(구역 함수 호출 27 · 상태 정의 · 통로 노출 · window 대입) 동일 · 가짜 연결 366건 동일. 이 탐침은 스크립트 경계의 차이를 보지 못한다는 한계를 측정 파일에 적었다(그것은 위 auth-race 가 잰다).
- **값 · 화면 · 시험** → 대조 불일치 0 · 사라진 이름 0 · 값 지문 차이 0 · 시나리오 30개 통과 · 모듈 로드 새 회귀 0 · npm test 와 시험 하나씩이 기준과 같다(깨진 단언 0 — 시험 파일 변경 0).
- **운영 영향** → 새 script 태그 1개. js 파일 목록을 손으로 적는 곳은 없다(`sw.js` 의 캐시 목록은 `APP_SHELL = ['/']` 하나 · `vercel.json` 은 rewrites·headers · `.vercelignore` 는 `js/` 를 빼지 않는다). **병합되면 곧바로 운영에 나간다.**

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · 번호 선점 · `npm ci --ignore-scripts`.
2. `finalize-run.cjs apply`(생성기 → 신고서 → 종류 한 칸 → 세포 설명 → 기준선).
3. REQ · 작업표 → 시나리오(기준 2회 · 작업 1회) → auth-race(직전 main 대 작업 트리) → npm test 와 시험 하나씩(기준 · 작업) → `measure` → `claims`.
4. 무결성 게이트 → 커밋(훅 통과 기록) → `recomputeSplit` 직접 호출 · 로컬 법정 → push 직전 origin/main 재확인 → push 한 번 → PR.
5. 병합 전: 다른 담당이 PR 머리로 독립 확인을 돌린다(인증 사건 · 시나리오 48개 · 실행 순서 · 글자 · 테마 시점).

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「앞선 PR 도 『전부 같다』였는데 틀렸다 — 이번에는 왜 믿는가」** → 믿으라고 하지 않는다. ① 틀렸던 조건(진짜 라이브러리 · 저장된 세션)을 그 조건을 찾아낸 담당의 도구로 직접 쟀고 만료 세션까지 넓혔다. ② 생성기가 인라인에 남기는 문의 **종류**를 「약속을 만들 수 없는 문」으로 묶었다(구조로 막는다). ③ 그래도 못 재는 것을 8절에 적었고, 병합 전에 다른 담당이 독립 확인을 한 번 더 돌린다.
- **반론 2 「전역 이름은 덩어리 해체가 없애려던 것이다」** → 맞다. 값이 바뀌지 않는 공개 상수 둘이고 읽는 곳은 부팅 파일의 한 문이다. 이 대가는 결심(「p안 승인」)이 받았다. 없애는 길은 커밋 훅 규칙(금고)을 바꾸는 것뿐이다.
- **반론 3 「테마가 늦게 입혀질 수 있다」** → 그렇다. 차례는 같지만 부팅 파일을 받은 뒤다. 로컬에서는 잴 수 없어 측정불가로 둔다 — 결심 때 「못 잰 것」으로 올라간 항목이다.
- **재검증(되돌릴 수 있는가)**: index.html 과 새 파일 하나, 서류 셋이다. 이 PR 을 되돌리면 그대로 돌아온다(운영도 다음 배포에서 돌아온다).

### 알려진 실패 1건(기준에서도 같다 — 이 PR 과 무관)

옛 생성기 단위 시험 `unwire-check-b1.js` 의 T7 은 실제 index.html 에서 후보(`_settingsKit` 가져오기)를 찾지 못해 「측정불가」로 실패 기록이 되고 겉의 묶음들에 번진다(고치지 않은 main 에서도 같다 — `reports/TASK-ES-681/prev-suite-base.json`). 이 PR 은 생성기를 바꾸지 않아 그 묶음들을 돌리지 않았고 그 시험 파일도 고치지 않았다. **덧붙임**: 이 PR 뒤에는 작업 트리의 index.html 에 큰 인라인 IIFE 가 없다. 생성기 하네스의 옛 단위 시험 가운데 「작업 트리의 실제 index.html」을 입력으로 삼는 검사가 더 있는지, 있다면 어떻게 되는지는 이번에 돌려 보지 않았다(측정불가 — npm test 에는 들어 있지 않다). 작업 끝 보고에 올린다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-689/` 아래. 수치는 `measurement.json` 이 각 결과에서 읽어 모은 것이다.

| 파일 | 무엇 |
|---|---|
| `proof.json` · `finalize-meta.json` | 생성기 설정 · 산출 기록(남긴 선언 · 읽는 문 · 전역 이름 검사 · 신고서 종류 전후) |
| `auth-race.json` · `auth-race/*.json` | 돌아온 로그인 사용자 부팅 — 직전 main 대 작업 트리(라이브러리 두 판 × 세션 있음 · 없음 · 만료) |
| `order-probe.{base,work}.json` · `order-probe-fake.{base,work}.json` | 시점 탐침(게스트 부팅 · 동기 가짜 연결) |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 대조 탐침 |
| `scenario-local.json` · `scenarios/` | 시나리오 30개 기준 2회 · 작업 1회 |
| `module-load.json` · `raw/` · `tests-base.json` · `tests-work.json` | 모듈 로드 · npm test · 시험 하나씩 |
| `measurement.json` · `claims.json` | 측정 모음(`summary.words` 글자 · `summary.authRace` · `summary.order`) · 주장 |
| `commit-hook.json` | 부팅 파일이 든 실제 커밋의 훅 출력(우회 없음) · 커밋된 판의 줄 끝 |
| `remaining-inline.json` | 이 PR 뒤 index.html 에 남은 인라인 스크립트와 공식 지표 |
| `court-local.json` | `recomputeSplit` 직접 호출과 로컬 법정 실행 기록(작업자 PC — 판정 아님) |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 시나리오 30개의 법정 소요 시간 → #959 의 법정 실행이 같은 30개로 한도 안에 끝났다.
- **예상**: 병합 뒤 생성 지도(`inline-script-map` 등)가 index.html 과 어긋난다 → 선례(#960)대로 병합 뒤 지도 갱신 PR 이 따로 필요하다(이 PR 의 범위 밖 — npm test 는 지금 통과한다).
- **못 잰 것(측정불가)**: ① 진짜 서버로 로그인한 계정의 끝 결과(프로필이 뜨는지) ② OAuth 복귀(서버로 코드 교환) ③ 서비스 워커 캐시가 낀 배포 전환(옛 index.html 과 새 파일이 섞이는 순간) ④ 운영 기기에서 테마가 입혀지는 시각 · 그리기 시각. 만료 세션은 「서버 갱신 요청이 실패하는 길」까지만 쟀다(성공하는 길은 서버가 있어야 한다).
- **성과 측정**: index.html 2712 → 2294줄. 공식 지표 `inlineScriptLines` **442 → 24**(남긴 선언 2줄 + 다른 인라인 조각 22줄 — 덩어리 0줄). 나머지 네 칸은 그대로다.

### 측정 결과(작업자 측정 — 표의 값은 `measurement.json` · `auth-race.json` 에서 옮김)

| 잰 것 | 결과 |
|---|---|
| 생성기 | index.html 2712 → 2294줄 · `js/app/boot.js` 75줄(문 59) · index.html 에 남은 인라인 블록 4줄(선언 2) · 중계는 부팅 파일로 · 전역 이름 검사 스크립트 372개에서 걸림 0 |
| 공식 지표(기준 → 작업) | `inlineScriptLines` 442 → 24(선언 2 + 다른 인라인 조각 22) · `indexFunctionDecls` 1 → 1 · `windowAssignments` 75 → 75(새 전역 둘은 세지 않는다) · `oversizeJsFiles` 0 → 0 · `crossTabRefs` 0 → 0 · 기준선 마지막 기록 = 측정값 |
| 글자 | 남긴 두 줄 바이트 동일 · 선언뿐(괄호 0) · IIFE 껍데기 없음 / 부팅 파일 문 59개 전부 기준 문 · 차례 동일 · 몸통은 문뿐 / 기준 문 61개가 겹침 없이 한 곳에 / 연결 만들기(문 32번) → 첫 수신기 호출(33번) → 둘째 수신기 호출(56번)이 부팅 파일 안에 / 되짚기 일치 · 태그 줄 2256 |
| 돌아온 로그인 사용자 부팅 — 세션 있음 | 저장소 판(2.115.0) 직전 main 2회 · 작업 3회, CDN 판(2.117.3) 2회 · 3회 — 사건 줄 16건이 전부 직전 main 과 같다. 앱 수신기가 받은 `SIGNED_IN` 2 · 걸려 있던 수신기 3 · 끝의 대기 세션 있음 |
| 〃 — 세션 없음 | 두 판 각각 직전 main 1회 · 작업 2회 — 사건 줄 7건 동일 |
| 〃 — 만료된 세션 | 두 판 각각 직전 main 2회 · 작업 2회 — 사건 줄 14건 동일(수신기 둘을 건 뒤에 라이브러리가 서버에 갱신을 요청하고, 외부 통신이 막혀 요청이 실패한다 — 두 쪽 같은 줄). 합 24회 · 부팅 실패 0 |
| 게스트 부팅 | 시점 탐침 364건 동일(구역 함수 호출 27) · 가짜 연결 366건 동일 · 대조 불일치 0 · 사라진 이름 0 · 지문 차이 0/0 · 예외 0 |
| 화면 · 시험 | 시나리오 30개 기준 2회 · 작업 1회 통과 · 모듈 로드 새 회귀 0 · npm test exit 0 · ✓ 487(기준 487) · 시험 하나씩(스크립트 4 · 파일 115) 차이 0 · 모듈 가드 0 · 무결성 게이트 0 |
