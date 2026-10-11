# REQ — #TASK-ES-681 생성기 명시적 옵션 셋: finalize 의 `relay` · `keepInline`, unwire 의 `dropDeadImport` (이 PR 은 옵션 추가까지 — 세 자리에 대한 적용은 2026-10-11 승인, 다음 PR)

- Task ID: **TASK-ES-681** (L012: `gh pr list --state all` · `git ls-remote origin` · origin/main 의 작업표에서 681 이 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-681-gen-finalize-relay-keep` 를 먼저 push 해 선점했다. 679 · 680 은 다른 작업 몫이다.)
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「생성기 모드·옵션 추가」**(설계 4절 표의 「생성기 모드 추가 — 문서·하네스 변경, 사양을 PR 본문에 공개, 단위 시험」). 선례: finalize 모드(#935, `REQ-TASK-ES-662`) · 잠긴 이름의 명시적 허용 `allowGuarded`(#938, `REQ-TASK-ES-670` — 「조용히 풀리지 않는 명시적 허용」 꼴).
- 작업참고 기준 PR #934(d55d7595, 경험칙 115개) · 기준 main ba5b46e2(#953 재철거 3차 병합 뒤 — 착수는 f7d14ee5(#950)였고 #952 · #953 을 차례로 합쳤다. 둘 다 생성기 · 하네스 · 설계 문서를 바꾸지 않았다). 전체 단위 시험(89건)과 모의 적용은 그 ba5b46e2 에서 쟀다. 그 뒤 #954(구역 이전 3차 — index.html · 새 세포 하나, 생성기 · 하네스 · 설계 문서 변경 0)를 합쳤고, 합친 뒤에는 단위 시험의 빠른 판(앞선 묶음 재실행을 뺀 88건)과 npm test 만 다시 확인했다. #954 는 모의의 준비 단계가 흉내 낸 꼴 그대로다(남은 상태 선언 둘이 구역 함수로, `isoDate` getter 가 다시 생김). 결심이 나온 뒤 #956(재철거 4차 — index.html 만)을 합쳤고, 그때도 빠른 판 88건과 npm test 만 다시 확인했다.
- 지시함(origin/main) 열린 지시: **DIR-004**((가) 생성기 줄 종류 닫힌 목록 · 완료 기준).
- **상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d — 글자 그대로)**: 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마. 지침이나 결심이 필요한점?」
- 이 작업 세션은 빌더다. 병합은 하지 않는다(오케스트레이터 몫).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.
- **결심 기록(2026-10-11, 커맨드센터 세션 309dca5d — 오케스트레이터가 전한 글자. 이 작업자는 그 채팅을 직접 보지 못했다)**
  - 지시함 DIR-004 (가) 원문: 「생성기가 지우거나 옮기거나 바꿔 쓰는 줄 종류는 … 닫힌 목록(U1~U3 + X1~X9)까지다. **목록 밖의 줄 종류는 다시 결심이다.**」 이 PR 의 세 옵션은 목록 밖이다. 그래서 오케스트레이터가 이 PR 을 병합 보류하고 세 가지를 [결심 필요] 로 여쭈었다:
    - ① 서버 주소 · 공개 키 · 서버 연결 세 줄: 키 커밋 금지 규칙은 그대로 두고 **제자리 인라인에 남김**(권장 — index.html 에 약 16줄 블록 잔류, 완료 기준이 「PostHog 7줄 · ESC 15줄 + 서버 연결 블록 잔류」로 바뀜)
    - ② `renderTeamGoalsScreen` 통로 연결 2줄을 **글자 그대로 옮김**(권장 — ①을 권장대로 하면 실행 순서 때문에 그 블록 안에 남음)
    - ③ 아무도 읽지 않는 가져오기 한 줄 `a11ySwitch` **삭제**(권장)
  - 상민님 답 원문: **「권장대로 모두 진행」**
  - 이로써 `keepInline` · `relay` · `dropDeadImport` 세 옵션의 추가와 **그 세 자리에 대한 적용**이 승인됐다. **한도: 그 세 자리 밖(다른 문 · 다른 이름)에 이 옵션을 쓰지 않는다.**
- **이 PR 의 지위(숨기지 않는다)**
  1. **옵션 추가만이다.** index.html · `js/**` · tests · scripts · 금고는 바뀌지 않는다. 적용은 다음 PR 들이다 — 재철거 5차(`dropDeadImport` 로 `a11ySwitch`) · finalize(`relay` · `keepInline`).
  2. `keepInline` 을 쓰면 작은 인라인 IIFE(모의에서 16줄 블록)가 남는다 — 위 결심 ①로 완료 기준이 그에 맞게 바뀌었다.
  3. 세 옵션은 설계 5.2 의 **닫힌 목록에 없던 줄 종류**를 다룬다. 그 표에는 줄을 더하지 않았고 5.3(「이 목록으로 풀리지 않는 것」)에 사안 셋과 위 결심을 적었다.
  4. (결심 전의 경과) 처음 올린 판은 `relay` · `dropDeadImport` 를 오케스트레이터의 기본값 판단·지시로, `keepInline` 을 결심 대기로 적었고, 「닫힌 목록을 넓히는 일에 결심이 필요하다고 보시면 적용 PR 전에 확인할 지점」이라고 올렸다. 그 확인이 위 결심이다.

## 0. 요구 (지시 항목)

| ID | 지시 | 완료 기준 |
|---|---|---|
| R1 | 생성기에 명시적 옵션 셋을 더한다 — 기본은 꺼져 있고 설정에 이름과 근거 글자를 적은 경우에만 동작한다 | 채운 꾸러미(relay 2 · keepInline 5 · dropDeadImport 2)가 기대 글자와 같고 vm 실행 등가 5건이 통과 |
| R2 | 조용히 풀리지 않는다 — 쓴 것마다 표준 출력 한 줄 + 메타 기록. 조건이 어긋나면 멈추고 아무것도 쓰지 않는다 | 정지 꾸러미 67건(relay 19 · keepInline 20 · dropDeadImport 28)이 전부 멈추고 index.html 바이트 그대로 |
| R3 | 기존 경로의 출력은 달라지지 않는다. 제품 코드 · tests · scripts · 금고 변경 0 | 옵션 없이 기준 생성기와 동일 · 앞선 단위 시험의 출력 검사 전부 통과 · 바뀐 파일 범위 |
| R4 | 현재 main 사본의 모의 적용에서 끝까지 돌고, 남긴 인라인 줄 바이트 동일 · 부팅 · 시나리오 · 시험이 기준과 같고, 모의 커밋이 커밋 훅의 금지 패턴 단계를 지난다. 부팅 파일의 신고서 종류 문제를 조사해 적는다 | `reports/TASK-ES-681/mock/mock-apply.json` |

- 범위 밖(하지 않음): 실제 적용(재철거 5차 · finalize — 다음 PR) · 커밋 훅 규칙(금고) 변경 · 신고서 도구·모듈 가드 규칙 변경 · `renderTeamGoalsScreen` 함수 나누기.

### 구체 식별자

- 생성기: `docs/design/harness/module-split/gen-inline-hard.js` — finalize 구간 `runFinalize`(설정 칸 `relay` · `keepInline`) · unwire 한 실행 `unwireOnce`(설정 칸 `dropDeadImport`). 그 밖의 구간은 글자가 같다.
- 실행기: `docs/design/harness/module-split/unwire-run.js` — `apply --dead-imports <파일.json>` · `measure` 의 `summary.deadImports`(브라우저에서 키트 속성 기술자) · `claims` 의 주장 넷(해당이 있을 때만).
- 단위 시험: `docs/design/harness/module-split/finalize-check-681.js`
- 설계: `docs/architecture/CELL-REGISTRY-DESIGN.md` 3.4(가리킴 한 줄) · 5.3(사안 셋) · **5.9**(relay · keepInline) · **5.10**(dropDeadImport)
- 설정 꼴:
  - `"relay": [{ "name": "renderTeamGoalsScreen", "reason": "…" }]`
  - `"keepInline": { "statements": ["var SUPABASE_URL", "var SUPABASE_ANON_KEY", "window.OurgoalAppState.define('sb'"], "reason": "…" }`
  - unwire 한 실행 안: `"dropDeadImport": [{ "name": "a11ySwitch", "reason": "…", "definedIn": "js/core/ui-helpers.js" }]`
- 모의 적용 도구(제품 코드 아님): `reports/TASK-ES-681/tools/mock-apply.cjs` · 측정 모음 `tools/measure.cjs` · 주장 `tools/build-claims.cjs`
- 부팅 파일 `js/app/boot.js` · 부팅 태그 `<script src="js/app/boot.js"></script>`(모의 사본에서만 생긴다)
- 화면 식별자(모의의 시나리오 12개 — #953 의 것): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnGoalsSubTeam` · `#homeAddGoal` · `#sanctuaryBellBtn` · `#btnToggleGoalAgent` · `#setTermsLink` · `#forgotPassBtn` · `#micBtn` · `#recSamplePurgeBtn` · `#goalFastAddInput` · `#exportRecordsBtn`

## 1. [원칙 ①] 문제를 정확히 파악한다

재철거 3차(#953) 뒤 인라인 IIFE 의 최상위 문은 63개다. finalize(5.8)의 전제는 「손잡이 · 구역 함수 가져오기 · 구역 함수 호출문뿐」인데, 구역 이전 3차가 남은 상태 선언 둘을 옮기고 재철거 4차가 `isoDate` 를 지운 뒤에도 전제 밖의 문이 세 무리 남는다.

| 남는 것 | 문 | 왜 지금 길이 없는가 |
|---|---|---|
| `renderTeamGoalsScreen` 의 통로 중계 | 가져오기 1 + getter expose 문 1 | 주인 세포가 798줄이라 등록 블록을 붙이면 800줄 상한을 넘는다(#950). 등록하지 못하니 unwire 로 지울 수 없고, finalize 는 expose 문과 「호출되지 않는 가져오기」에서 멈춘다 |
| 서버 주소 · 공개 키 선언과 `define('sb', …)` | var 2 + 상태 선언 1 | 커밋 훅의 `HARDCODED_SECRET` 규칙(금고)이 그 줄을 새 파일로 옮기는 것을 막는다. finalize 는 「그 밖의 var · 상태 선언」에서 멈춘다 |
| `var a11ySwitch = _ui.a11ySwitch;` | 가져오기 1 | IIFE 안에서 읽는 곳이 없는 줄이다(#950 사실 보고). 통로로 나가는 이름이 아니라 unwire 의 대상(「같은 값을 두 번 내주는 줄」)이 아니고, finalize 는 「호출되지 않는 가져오기」에서 멈춘다 |

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 생성기가 다루는 줄 종류는 닫힌 목록이고, 목록 밖의 줄은 **이름과 근거를 적은 경우에만** 다룬다. 스위치(`true`)로 풀리지 않고, 쓴 흔적이 출력과 메타에 남는다(`allowGuarded` 와 같은 꼴).
- **원인**: 세 무리는 서로 다른 까닭으로 「등록 → 철거 → 옮기기」의 보통 길에 타지 못한다(줄 수 상한 · 커밋 훅 규칙 · 읽는 곳이 없음). 규칙을 굽히지 않으려면 생성기 쪽에 좁은 길을 따로 내야 한다.
- **중심**: `runFinalize` 의 전제 판정과 줄 가르기, `unwireOnce` 의 삭제 목록.
- **핵심**: 실행 순서와 읽기의 부수효과를 생성기가 스스로 따진다 — ① `keepInline` 은 「인라인이 먼저, 부팅 파일이 뒤」이므로 남길 문보다 앞에서 도는 문을 뒤로 보내지 않는다 ② `dropDeadImport` 는 읽기 한 번을 없애므로 그 읽기에 부수효과가 없음을(단순 속성 읽기 · 데이터 속성) 확인한다 ③ `relay` 는 글자를 한 글자도 고치지 않는다.

## 3. [원칙 ③] 해결 방식

설정 꼴 · 하는 일 · 멈추는 것 전부는 설계 5.9 · 5.10 이 정본이다. 요지:

1. **`relay`**(finalize): 이름마다 「가져오기 1 + getter 1」(그 expose 문의 속성이 전부 relay 이름의 `get N(){ return N; }`)을 전제가 받아들이고, 다른 문과 함께 글자 그대로 · 같은 순서로 옮긴다.
2. **`keepInline`**(finalize): 지정한 문(앞머리로 꼭 하나씩 · var 선언과 상태 선언뿐 · 연달아)을 인라인에 **줄 그대로** 남긴다. 함께 남는 것 = 그 문보다 앞에서 도는 호출문 · relay expose 문 + 그 문들이 읽는 가져오기 · 손잡이 줄. 나머지는 부팅 파일로 가고, 부팅 태그는 남긴 `</script>` 줄 끝에 붙는다. 양쪽이 함께 쓰는 손잡이 줄은 부팅 파일에 같은 글자로 한 번 더.
3. **`dropDeadImport`**(unwire): 읽는 곳이 없는 가져오기 줄 하나를 지운다. unwire 에 넣은 까닭 — 재철거 PR 이 다른 unwire 실행과 함께 한 PR 에서 지울 수 있고, 법정의 생성기 재실행 대조(unwire 증명 파일)가 그대로 맞는다.
4. 실행기 `unwire-run.js` 에 `--dead-imports` 와 그 측정(브라우저에서 속성 기술자)을 더한다 — 재철거 PR 이 선례 절차 그대로 쓸 수 있게(재철거 4차 #956 은 결심 전이라 이 옵션 없이 `isoDate` 만 지웠다 — `a11ySwitch` 는 재철거 5차).

## 4. [원칙 ④] 재검토 (반례·부작용)

- **옵션을 적지 않은 기존 설정이 달라지지 않는가** → 같은 꾸러미를 기준 생성기(기준 커밋의 글자)와 고친 생성기로 돌려 index.html · 부팅 파일 · 표준 출력 · 메타 · 오류 글자가 같다(단위 시험 G1 · G2). 앞선 finalize 단위 시험 45건(그 안의 661 · 657 · 643 · 634 · 619 · B1 과 병합된 PR 재생성)의 출력 검사가 통과한다(P) — 실패는 생성기 diff 모양 검사와, 생성기와 무관한 한 건(B1 의 T7 — 6절)뿐이다.
- **`keepInline` 이 실행 순서를 바꾸지 않는가** → 규칙: 남길 문보다 앞에 있는 문 가운데 **손잡이 · 가져오기만** 뒤(부팅 파일)로 갈 수 있다. 그 둘은 키트의 값을 읽기만 한다. vm 실행 등가(E1 · E3 · E4)가 원래 IIFE 와 「남긴 인라인 → 부팅 파일」의 호출 순서 · this · 인자 수 · 상태 선언 값 · 다음 호출이 본 값을 맞댄다. 다른 빌더의 포착 탐침(저장소 밖): 가져오기 72개의 값이 IIFE 머리 · 서버 연결 직후 · 끝에서 같았다.
- **두 옵션을 함께 쓰면 relay 가 어디로 가는가** → relay 의 expose 문이 남길 문보다 **앞**이면 인라인에 남는다(뒤로 보내면 남긴 호출문과의 순서가 바뀐다). 지금 main 의 꼴이 그렇다 — 모의에서 `renderTeamGoalsScreen` 중계 세 문은 인라인에 남았고 메타가 `movedTo: "index.html(인라인에 남음)"` 으로 적었다. 그래서 `keepInline` 을 쓰지 않는 경우에만 그 중계가 부팅 파일로 간다.
- **남긴 var 를 부팅 파일이 읽으면** → 두 파일이 따로 IIFE 라 ReferenceError 가 된다. 생성기가 멈춘다(S46 · 사후 대조).
- **`dropDeadImport` 가 살아 있는 이름을 지우지 않는가** → IIFE 안 참조(안쪽 함수 포함) · 그 이름이 낱말로 든 문자열 · `eval` · `new Function` · `with` · getter·setter · `….이름 = …` 대입이 하나라도 있으면 멈춘다(#950 사실 보고에서 쓴 기준 그대로 — S75~S83).
- **읽기 한 번을 없애도 되는가** → 오른쪽이 「손잡이.이름」 단순 속성 읽기가 아니면 멈추고(S70~S73), 정의 파일이 그 속성을 접근자로 정의하면 멈춘다(S85 · S86). vm E5 가 데이터 속성이면 전후 실행 흔적이 같고 접근자였다면 지우기 전에만 읽기 흔적이 남음을 보인다. 실제 키트 객체에서의 확인은 모의에서 쟀다: `window.OurgoalUiHelpers` 의 `a11ySwitch` 는 데이터 속성 · 접근자 아님 · 통로에 없는 이름(`mock-apply.json` `deadImportRuntime`).
- **멈춤은 아무것도 쓰지 않는가** → 정지 꾸러미 67건 전부 index.html 바이트 그대로 · 부팅 파일 없음.
- **실제 index.html 에 지금 돌리면** → 옵션을 실제 이름으로 줘도 전제 밖의 문이 남아 있어 멈춘다(X1 — 그 기준 커밋에서는 구역 이전 3차 · 재철거가 먼저였다).

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · 번호 선점 · `npm ci --ignore-scripts` · 선례(REQ 662 · 670 · `finalize-check-662.js` · 설계 3.4 · 5.x · 6.4 · 9절) 읽기.
2. `runFinalize` 에 relay · keepInline → `finalize-check-681.js` → 기존 묶음(빠른 판)으로 기본 경로 회귀 확인.
3. (오케스트레이터 추가 지시) `unwireOnce` 에 dropDeadImport → 단위 시험 추가 → 실행기에 `--dead-imports` 와 측정.
4. 모의 적용 도구(`mock-apply.cjs`) → 설계 문서 5.9 · 5.10 · 5.3 → REQ · 작업표.
5. 전체 단위 시험(앞선 묶음 재실행 포함) → npm test → 측정 모음 · 주장 → 무결성 게이트 → 커밋 → push 직전 origin/main 재확인 → push 한 번 → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「등록되지 않은 이름도 기존 unwire 의 가져오기 줄 삭제(U1)로 글자로는 지워진다 — 옵션이 왜 필요한가」** → 맞다, 생성기의 U1 은 등록 여부를 모른다(처음 모의에서 `names: ["a11ySwitch"]` 로도 지워졌다). 하지만 unwire 의 `names` 는 「등록 기관이 같은 값을 내주는 이름」을 적는 칸이고, 실행기와 주장(R2 「지운 이름은 등록 기관이 같은 값으로 내준다」)이 그 뜻에 기대어 있다. 죽은 줄을 그 칸에 섞으면 그 뜻이 흐려진다. 그리고 U1 은 문자열 · 동적 접근 · 접근자를 보지 않는다. 따로 적는 칸과 더 좁은 정지 조건을 두었다.
- **반론 2 「`keepInline` 은 완료 기준(인라인 IIFE 0)을 스스로 깬다」** → 그렇다. 그래서 처음에는 옵션을 준비만 하고 쓸지를 상민님 결심으로 남겼다. 2026-10-11 결심 ①(제자리 인라인에 남김 — 키 커밋 금지 규칙은 그대로)로 쓰기로 정해졌고, 완료 기준이 「서버 연결 블록 잔류」로 바뀌었다(REQ 머리의 결심 기록). 쓰지 않는 길은 커밋 훅 규칙(금고)을 고치는 것뿐이었다.
- **반론 3 「relay 는 통로 중계를 영구히 남긴다」** → 맞다. 부팅 파일(또는 인라인)에 `expose('index.html', { get renderTeamGoalsScreen… })` 한 건이 남는다. 없애려면 그 함수(771줄)를 나눠 주인 세포를 800줄 아래로 내려야 한다 — 덩어리 해체 뒤의 별도 과제로 올린다(#950 조사).
- **재검증(생성기 diff 모양)**: 이번 변경은 한 자리 끼워 넣기가 아니다(전제 판정 줄 · 부팅 파일 조립 줄을 바꿨다). 그래서 앞선 묶음의 diff 모양 검사(662 의 D0 등)는 구조적으로 거짓이 된다(L110). 그 시험 파일은 고치지 않았고, 이번 시험의 D 가 「두 구간 밖의 세 토막은 기준과 글자가 같다」를 다시 잰다.
- **재검증(생성기와 무관하게 실패하는 앞선 검사 한 건 — 숨기지 않는다)**: 앞선 묶음을 다시 돌리니 diff 모양 검사 말고도 실패가 있었다. 따라가 보니 B1(`unwire-check-b1.js`)의 T7 이다 — 「작업 트리의 실제 index.html 에서 참조가 남지 않는 `_settingsKit` 가져오기를 골라 철거해 본다」는 검사인데, 재철거 3차(#953)가 그 손잡이를 지운 뒤로는 후보가 없어 「측정불가」로 실패 기록이 된다. 그 한 건이 겉의 B 들(619 · 634 · 643 · 657)에 번진다. **고치지 않은 main(ba5b46e2)에서도 같은 실패가 난다**(`prev-suite-base.json` — B1 7/8 · 619 15/16 · 634 33/34). 이번 시험의 P 는 B1 을 따로 한 번 더 돌려 실패가 T7 의 「측정불가」뿐임을 직접 확인한 경우에만 번진 B 를 허용한다. 그 시험 파일들은 고치지 않았다 — 고칠지는 따로 정할 일이다(지금의 index.html 에 기대는 검사라 덩어리가 줄수록 이런 일이 는다).
- **재검증(모의 도구의 함정)**: 모의본에서 `tests/cell-map-export-es414.test.js` 가 처음에 깨졌다 — 그 시험은 git 이 추적하는 파일만 읽는데 새 파일(`js/app/boot.js`)이 추적 전이었다(L060). `git add -N` 뒤 통과했다. 실제 finalize PR 은 새 파일을 커밋하므로 해당이 없다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-681/` 아래. 수치는 측정 파일이 정본이다.

| 파일 | 무엇 |
|---|---|
| `finalize-options-unit.json` · `unit-summary.json` | 단위 시험 89건 결과와 묶음별 요약 |
| `prev-suite-base.json` | 고치지 않은 main 에서 앞선 단위 시험 셋(B1 · 619 · 634)을 돌린 결과 — 생성기와 무관하게 실패하는 검사 |
| `mock/step1-region.json` · `mock/step2-dead-imports.json` · `mock/step2-unwire-proof.json` · `mock/step2-unwire-meta.json` · `mock/step3-finalize.json` · `mock/step3-finalize-meta.json` | 모의 적용의 설정과 생성기 산출 기록 |
| `mock/mock-apply.json` | 모의 적용 전체 결과(아래 표) |
| `mock/compare.{base,mock}.json` · `mock/name-probe.{base,mock}.json` · `mock/scenario-local.json` · `mock/tests-{base,mock}.json` | 대조 탐침 · 이름 탐침(속성 기술자) · 시나리오 · 시험 하나씩 |
| `measurement.json` · `claims.json` | 바뀐 파일 범위 · npm test · 요약 · 주장 |

### 모의 적용(저장소 밖 사본 — 기준 ba5b46e2, 작업자 측정)

| 단계 | 한 일 | 결과 |
|---|---|---|
| 1 region | 남은 상태 선언 둘(`defineVar('state'…)` · `defineVar('_promptEncyclopediaOpen'…)`)을 구역 함수 둘로(구역 이전 3차를 흉내 낸 준비) | index.html 2715 → 2719줄 |
| 2 unwire(실행기) | `isoDate`(가져오기 · getter · 손잡이 `_calendarKit`) + **dropDeadImport** `a11ySwitch`(손잡이 `_ui` 함께) | 7줄 삭제 → 2712줄. 생성기 정지 0 |
| 3 finalize | **relay** `renderTeamGoalsScreen` + **keepInline** 세 문 | 406줄 삭제 → 2306줄. 인라인에 문 9개(11줄 + 껍데기 5줄)가 남고 부팅 파일에 문 53개(65줄) |
| 4 신고서 | `module-specs --write` → `app/boot` 종류를 `organ` 으로 정함 → 세포 설명 → `module-guard --update` | 아래 「부팅 파일의 신고서 종류」 |
| 5 측정 | 대조 탐침 불일치 0 · 통로에서 사라진 이름 0 · 지문 차이 0 · 부팅 예외 0 · 시나리오 12개 기준·모의 통과 · npm test 종료 0 · ✓ 487 = 487 · 시험 하나씩 다른 것 0 | 기준과 같다 |
| 6 커밋 훅 | 사본의 임시 가지에 실제로 커밋(훅을 건너뛰지 않음 · push 하지 않음 · 끝나고 가지 삭제) | 커밋 종료 코드 0 · 「금지 패턴 없음」 · `HARDCODED_SECRET` 막지 않음 |

- 남긴 인라인 블록(16줄): 껍데기 + `var _goalsKit` · relay expose 문 3줄 · `var renderTeamGoalsScreen` · `var _uiKit` · `var bootApplySavedTheme` · `bootApplySavedTheme();` · 서버 주소 · 공개 키 · `define('sb', …)`. 전부 finalize 직전 줄과 바이트가 같고 순서가 같다. 공개 키 글자는 부팅 파일에 없다.
- 다른 빌더의 대조군(저장소 밖 — 이 PR 의 측정이 아니다): 세 문까지 부팅 파일로 옮긴 모의 커밋은 훅이 `HARDCODED_SECRET` 으로 막았다.

### 부팅 파일의 신고서 종류 — 사실과 권고

- 사실: `scripts/module-specs.js` 의 기본 종류는 `js/core/` → organ · `js/tabs/` → tab · `js/ui|services/` → organ · **그 밖 → unclassified** 다(`defaultKind`). `js/app/boot.js` 는 unclassified 로 올라가고 모듈 가드가 「세포 app/boot: 종류가 unclassified — organ·tab·hybrid·future 중 하나로 정한다」로 막는다. 도구의 머리 주석이 그 뜻을 적는다 — 「사람이 종류를 정한다」.
- 사실: 종류(kind)는 손으로 정하는 칸이라 `--write` 가 보존한다. 모의에서 `modules.json` 의 `app/boot` 칸을 `organ` 으로 정한 뒤 `--write` 를 다시 돌려도 `organ` 이 남았고 가드가 통과했다.
- 권고: finalize PR 이 `module-specs --write` 뒤 그 한 칸을 `organ` 으로 정한다(도구가 뜻한 흐름). **신고서 도구 · 가드 규칙은 바꾸지 않아도 된다.** 부팅 파일을 `js/core/` 로 옮기는 길은 설계 3.4 가 경로를 `js/app/boot.js` 로 정해 두어 택하지 않는다.

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 구역 이전 3차가 실제로 만드는 꼴이 모의와 다를 수 있다(구역 함수 이름 · `isoDate` getter 의 자리) → 재철거 5차와 finalize 는 그때의 main 에서 다시 잰다(#954 는 모의가 흉내 낸 꼴 그대로였다). 옵션의 정지 조건이 걸리면 멈춘 사유를 그대로 보고한다.
- **예상**: 두 finalize 옵션을 함께 쓰면 `renderTeamGoalsScreen` 중계가 부팅 파일이 아니라 인라인 블록에 남는다(결심 ②의 괄호 — 「①을 권장대로 하면 실행 순서 때문에 그 블록 안에 남음」과 같은 꼴). finalize PR 에서 그 꼴을 그대로 잰다.
- **측정불가**: 로그인 뒤의 동작(법정 브라우저가 외부 통신을 막아 서버 연결 객체가 null 이다) · 운영 환경 · 서비스워커 캐시와의 섞임(9.1 의 소견 그대로).
- **성과 측정**: 이 PR 자체의 `inlineScriptLines` 변화는 0 이다. 모의 기준으로 재철거(그때는 `isoDate` 포함)는 7줄, finalize(keepInline 사용 시)는 406줄을 지운다 — 인라인에 16줄 블록이 남는다. 그 뒤 재철거 4차(#956)가 `isoDate` 의 5줄을 먼저 지웠다.
