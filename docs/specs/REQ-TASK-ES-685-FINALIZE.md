# REQ — #TASK-ES-685 미분화 덩어리 해체 마지막 정리(finalize): 남은 시동 문을 js/app/boot.js 로, 서버 연결 블록만 제자리 인라인에

- Task ID: **TASK-ES-685** (L012: `gh pr list --state all` · `git ls-remote origin` · origin/main 의 작업표에서 685 가 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-685-finalize` 를 먼저 push 해 선점했다.)
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「생성기로 옮기기」의 마지막 단계**(설계 `docs/architecture/CELL-REGISTRY-DESIGN.md` 5.8절 X9 finalize · 5.9절 `relay` · `keepInline`). 생성기 모드는 #935(`REQ-TASK-ES-662`), 두 옵션은 #955(`REQ-TASK-ES-681`)가 만들었고 단위 시험과 모의 적용까지 있었다. **이번이 index.html 에 실제로 돌리는 첫 PR 이다.** 측정 꼴은 구역 이전 선례(#951 · #954)를 따랐다.
- 작업참고 기준 PR #934(d55d7595, 경험칙 115개) · 기준 main 4ea2bd73(#957 재철거 5차 병합 뒤). **생성기는 그 main 의 것 그대로다**(이 PR 에서 생성기 · 하네스 변경 0).
- 지시함(origin/main) 열린 지시: **DIR-003**(기준선에 inlineScriptLines 기록) · **DIR-004**((가) 「닫힌 목록(U1~U3 + X1~X9)까지다. **목록 밖의 줄 종류는 다시 결심이다.**」 — finalize 는 X9(목록 안), `relay` · `keepInline` 은 **목록 밖**이다. 아래 결심 기록으로 승인됐다).
- **결심 기록(2026-10-11, 커맨드센터 세션 309dca5d — 오케스트레이터가 전한 글자. 이 작업자는 그 채팅을 직접 보지 못했다)**
  - 오케스트레이터가 [결심 필요] 로 여쭌 세 가지:
    - ① 서버 주소 · 공개 키 · 서버 연결 세 줄: 키 커밋 금지 규칙은 그대로 두고 **제자리 인라인에 남김**(권장 — index.html 에 약 16줄 블록 잔류, 완료 기준이 「PostHog 7줄 · ESC 15줄 + 서버 연결 블록 잔류」로 바뀜)
    - ② `renderTeamGoalsScreen` 통로 연결 2줄을 **글자 그대로 옮김**(권장 — ①을 권장대로 하면 실행 순서 때문에 그 블록 안에 남음)
    - ③ 아무도 읽지 않는 가져오기 한 줄 `a11ySwitch` **삭제**(권장)
  - 상민님 답 원문: **「권장대로 모두 진행」**
  - 이 PR 은 **①과 ②**를 적용한다(③은 #957). **한도: 그 세 자리 밖(다른 문 · 다른 이름)에 이 옵션을 쓰지 않는다** — `keepInline.statements` 에 적은 것은 서버 연결 세 문, `relay` 에 적은 이름은 `renderTeamGoalsScreen` 하나다.
- **상민님 지시 원문(2026-10-11, 같은 세션 — 글자 그대로)**: 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마. 지침이나 결심이 필요한점?」
- 이 작업 세션은 빌더다. 병합은 하지 않는다(오케스트레이터 몫).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 완료 기준 |
|---|---|---|
| R1 | 인라인 IIFE 에 남은 시동 문을 생성기(`mode:"finalize"` · `relay` · `keepInline`)로 부팅 파일 `js/app/boot.js` 로 옮기고 앱 동작을 보존한다 | 게스트 시나리오 30개가 기준 2회 · 작업 1회 통과 · 생성기 재실행 대조 |
| R2 | 서버 연결 세 문과, 실행 차례상 그 앞에서 도는 문(테마 적용 호출 · 통로 중계)과 그것들이 읽는 가져오기 · 손잡이는 제자리 인라인에 바이트 그대로 남긴다. 공개 키 글자는 부팅 파일에 없다. 옵션은 승인된 세 자리에만 쓴다 | 남은 줄 바이트 동일 · 차례 동일 · 부팅 파일에 키 글자 없음 · 실제 커밋 훅 통과 |
| R3 | 옮긴 문은 글자와 차례가 기준과 같고 빠지거나 더해진 문이 없다. IIFE 밖의 글자는 부팅 파일 태그 하나 말고 바뀌지 않는다 | 문 단위 대조 · 되짚기 |
| R4 | 실행 차례와 값이 같다 | 시점 탐침 사건 줄 동일(테마 적용 → 서버 연결 → 나머지) · 대조 불일치 0 · 값 지문 차이 0 |
| R5 | 증명 하한 | 인라인 줄 수 감소와 기준선 기록 · 신고서 종류 · 모듈 로드 · npm test · 시험 하나씩 · tests/ · scripts/ · 금고 · 생성기 변경 0 |

- 범위 밖(하지 않음): 인라인에 남은 서버 연결 블록을 없애는 일(커밋 훅의 키 금지 규칙 변경이 필요하다 — 금고. 결심 ①이 잔류를 정했다) · `renderTeamGoalsScreen` 함수 나누기(덩어리 해체 뒤의 별도 과제) · 다른 인라인 조각(접속 통계 · ESC 키 처리기 — 덩어리가 아니다).

### 구체 식별자

- 파일: `index.html`(인라인 IIFE — 줄 2253~2674 가 16줄 블록으로) · **새 파일 `js/app/boot.js`**(65줄 — 부팅 기관) · `docs/architecture/modules.json`(신고서 — 세포 `app/boot` 추가) · `docs/architecture/cell-descriptions.json`(세포 설명) · `docs/architecture/module-baseline.json`(기준선)
- 생성기 설정 `reports/TASK-ES-685/proof.json`: `mode: "finalize"` · `cells: [{ file: "js/app/boot.js" }]` · `relay: [{ name: "renderTeamGoalsScreen" }]` · `keepInline.statements: ["var SUPABASE_URL", "var SUPABASE_ANON_KEY", "window.OurgoalAppState.define('sb'"]`
- 생성기 `docs/design/harness/module-split/gen-inline-hard.js`(변경 0)
- 부팅 파일이 부르는 구역 함수 26개(키트 `window.OurgoalUiHelpers` 의 `bootAuthStateListener` · `bootAppConfig` · `bootThemeList` · … · `bootInstallAndServiceWorker`) · 인라인에 남은 호출 1개(`bootApplySavedTheme`)
- 새 도구(제품 코드 아님): `reports/TASK-ES-685/tools/finalize-run.cjs`(apply · scenarios · measure · claims) · `tools/order-probe-685.cjs`(시점 탐침 — #954 의 것에 구역 함수 호출 사건을 더함)
- 화면 식별자(시나리오 30개): 등록·철거 12개(#957 의 것 그대로 — `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnGoalsSubPersonal` · `#homeAddGoal` · `#sanctuaryBellBtn` · `#setTermsLink` · `#landLoginLink` · `#micBtn` · `#recSamplePurgeBtn` · `#goalFastAddInput` · `#exportRecordsBtn`) · 전문 템플릿 기록 창 15개(#949 `reports/TASK-ES-672/scenarios/` 그대로 — 창 열기·닫기 · 표 편집 · 템플릿 바꾸기 · 도구 창 · 스톱워치 · 저장·다시 열기·새로 고침 · 일정 연동 저장) · 상태 이전의 저장 3개(#954 `reports/TASK-ES-682/scenarios/` h2~h4 그대로 — 저장 → 다시 열기 → 새로 고침)

## 1. [원칙 ①] 문제를 정확히 파악한다

재철거 5차(#957) 뒤 index.html 의 인라인 IIFE 는 420줄이고 그 가운데 문은 61개(68줄), 나머지 352줄은 주석과 빈 줄이다. 문은 키트 손잡이 2 · 가져오기 28 · 구역 함수 호출문 27 · 통로 중계(expose) 1 · 서버 주소와 공개 키 선언 2 · `sb` 상태 선언 1 이다. 함수 선언도 상태도 배선도 남지 않았다 — 남은 것은 「시동 함수를 차례로 부르는 줄」과 「서버 연결 세 문」뿐이다. 이것을 부팅 파일로 옮기면 덩어리가 없어진다.

걸리는 것이 둘이다. ① 서버 주소·공개 키 선언 줄은 새 파일로 옮기면 커밋 훅의 키 금지 규칙(금고)이 막는다. ② 그 세 문은 실행 차례상 테마 적용 호출 **뒤**, 나머지 26개 호출 **앞**에서 돈다 — 세 문만 남기고 앞의 문을 부팅 파일로 보내면 차례가 뒤집힌다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 문을 한 글자도 바꾸지 않고, 도는 차례도 바꾸지 않고, 자리만 옮긴다.
- **원인**: 서버 연결 세 문이 시동 차례의 한가운데(두 번째)에 있다.
- **중심**: 생성기 finalize 한 번, 설정 `reports/TASK-ES-685/proof.json`.
- **핵심**: **차례**다. 인라인 블록은 부팅 파일 태그보다 앞에 있으니 「인라인 블록 → 부팅 파일」 차례로 돈다. 그래서 세 문보다 앞에서 돌던 문(통로 중계 expose · 테마 적용 호출)은 인라인에 함께 남고, 그 문들이 읽는 가져오기 · 손잡이도 함께 남는다(`keepInline` 의 사양 — 설계 5.9). 결심 ②의 괄호(「①을 권장대로 하면 실행 순서 때문에 그 블록 안에 남음」)가 바로 이 꼴이다.

## 3. [원칙 ③] 해결 방식

1. `finalize-run.cjs apply` — `proof.json` 을 쓰고 생성기를 돌린다. 결과(생성기 출력 — `finalize-meta.json`):
   - index.html 2712 → 2306줄(지운 406줄 = 문 52 · 주석 270 · 빈 줄 84). `js/app/boot.js` 65줄.
   - **인라인에 남은 문 9개**(블록 16줄 = `<script>` · `(function(){` · `"use strict";` · 문 11줄 · `})();` · `</script>`): 손잡이 `_goalsKit` · 통로 중계 expose 문(3줄) · 가져오기 `renderTeamGoalsScreen` · 손잡이 `_uiKit` · 가져오기 `bootApplySavedTheme` · 호출 `bootApplySavedTheme();` · `var SUPABASE_URL` · `var SUPABASE_ANON_KEY` · `window.OurgoalAppState.define('sb', …)`.
   - **부팅 파일의 문 53개**: 손잡이 `_uiKit`(인라인에도 남아 같은 글자로 한 번 더) · 가져오기 26 · 호출 26.
2. 신고서(`module-specs --write`) → **종류 한 칸을 손으로 정한다**(아래) → 세포 설명(`cell-desc-add.js`) → `module-guard --update`(낮아진 값).
3. 측정(`finalize-run.cjs measure`) → 주장.

**손 편집 한 칸(숨기지 않는다)**: 신고서 도구는 새 폴더 `js/app` 의 종류를 정하지 못해 `unclassified` 로 적고 모듈 가드가 멈춘다(종료 1). `docs/architecture/modules.json` 의 `app/boot` 칸 `kind` 를 `organ`(기관)으로 정했다 — 적용 도구가 그 한 칸을 적고 `finalize-meta.json` `spec` 에 전후를 남겼다. 다시 `module-specs --write` 를 돌려도 그 값은 보존되고 모듈 가드는 통과한다(종료 0). 도구와 가드 규칙은 바꾸지 않았다(#955 의 조사 그대로).

## 4. [원칙 ④] 재검토 (반례·부작용)

- **남은 줄이 바뀌지 않았는가** → 생성기와 따로 다시 파싱해 문 단위로 맞댔다(`measurement.json` `summary.words`): 인라인에 남은 문 9개는 전부 기준 IIFE 의 문이고 차례가 같고, 그 줄(11줄)은 기준 줄과 **바이트 단위로**(줄 끝 글자 포함) 같다. 블록 안에 주석만 있는 줄 · 빈 줄 0.
- **공개 키가 새 파일로 가지 않았는가** → 부팅 파일에 `SUPABASE` 라는 이름도 서버 주소도 키 꼴 글자도 없다. 선언 두 줄은 index.html 에서 기준 줄과 바이트로 같다. **실제 커밋이 훅을 통과했다**(우회 없음 — `commit-hook.json`).
- **빠지거나 더해진 문** → 기준 IIFE 의 문 61개가 하나도 빠짐없이 인라인 블록(9)이나 부팅 파일(52 + 손잡이 한 번 더 1) 가운데 한 곳에 있다. 부팅 파일의 몸통은 그 문뿐이다(더한 실행 글자 0).
- **차례** → ① 글자: 값을 읽기만 하는 문(손잡이 · 가져오기)을 뺀 문의 차례가 「기준 IIFE == 인라인 블록 뒤에 부팅 파일」. ② 실행: 시점 탐침으로 부팅 동안의 사건(구역 함수 호출 27 · 상태 정의 67 · 통로 노출 · window 대입 — 합 364건)을 차례로 적어 기준과 맞댔다 — 글자 그대로 같다. 테마 적용 호출(197번째) → `sb` 정의(198번째) → 다음 구역 함수(200번째)의 차례가 기준·작업 같다. 가짜 연결 라이브러리를 심은 방식(연결 만들기가 실제로 불리는 길)에서도 366건이 같다.
- **가져오기를 읽기만 하는 문의 차례가 바뀌어도 되는가** → 인라인에 남은 가져오기 2개와 부팅 파일의 가져오기 26개는 키트 객체의 속성을 읽어 지역 변수에 담을 뿐이다. 구역 함수는 세포 파일이 먼저 키트에 붙여 두고(index.html 의 script 태그 차례 — 변경 0) 그 뒤로 바뀌지 않는다. 부팅 파일 안에서도 가져오기 차례는 기준과 같다.
- **호이스팅** → 기준 IIFE 에서 `var` 는 함수 머리로 끌어올려져 있었다. 통로 중계의 getter 는 `renderTeamGoalsScreen` 을 부를 때 읽는다 — 그 가져오기 줄이 getter 문 뒤에 있는 꼴이 기준과 같다(줄 그대로 남겼다).
- **IIFE 밖** → 기준 index.html 의 IIFE 에서 남긴 줄만 남기고 `</script>` 줄에 부팅 파일 태그를 붙이면 작업 index.html 과 줄 단위로 같다(되짚기). 다른 글자 변경 0.
- **값** → 대조 불일치 0 · 통로에서 사라진 이름 0 · 통로·window 값 지문 차이 0 · 부팅 예외 0.
- **화면** → 시나리오 30개가 기준 2회 · 작업 1회 통과. 모듈 로드 새 회귀 0.
- **시험** → npm test 종료 코드와 검사 줄이 기준과 같고, 시험을 하나씩 돌린 결과도 같다. 깨진 단언 0 — 시험 파일은 고치지 않았다.

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · 번호 선점 · `npm ci --ignore-scripts`.
2. 준비 모의(저장소 밖 사본): 재철거 5차 뒤 상태에 같은 설정으로 생성기를 돌려 결과 꼴을 미리 확인.
3. #957 병합 뒤 그 main 에서 `finalize-run.cjs apply`(생성기 → 신고서 → 종류 한 칸 → 세포 설명 → 기준선).
4. REQ · 작업표 → 시나리오(기준 2회 · 작업 1회) → npm test 와 시험 하나씩(기준 · 작업) → `measure` → `claims`.
5. 무결성 게이트 → 커밋(훅 통과 기록) → `recomputeSplit` 직접 호출 · 로컬 법정 → push 직전 origin/main 재확인 → push 한 번 → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「인라인 블록이 남으면 해체가 끝난 것이 아니다」** → 남은 블록은 함수도 상태도 배선도 없는 16줄(문 9개)이고, 없애려면 커밋 훅의 키 금지 규칙(금고)을 바꿔야 한다. 그 선택은 상민님 결심 ①이 했다(규칙은 그대로, 블록 잔류, 완료 기준 변경). 공식 지표 `inlineScriptLines` 는 442 → 36 이다(남긴 블록 14줄 + 접속 통계 · ESC 키 처리기 22줄).
- **반론 2 「중계 2줄은 『글자 그대로 옮김』(결심 ②)인데 부팅 파일로 가지 않았다」** → 결심 ②의 괄호가 그 경우를 적어 두었다(「①을 권장대로 하면 실행 순서 때문에 그 블록 안에 남음」). 중계 expose 문은 서버 연결 세 문보다 앞에서 돈다 — 부팅 파일로 보내면 세 문 뒤로 밀려 차례가 바뀐다. 생성기는 그 문을 인라인에 줄 그대로 남겼다(`relayed[0].movedTo` = 「index.html(인라인에 남음)」).
- **반론 3 「손잡이 `_uiKit` 가 두 번 적혔다」** → 인라인의 가져오기와 부팅 파일의 가져오기가 둘 다 그 손잡이를 읽는다. 두 파일은 지역 변수를 나눠 쓸 수 없어 같은 글자(`var _uiKit = window.OurgoalUiHelpers;`)를 한 번 더 적었다 — 전역 객체를 읽을 뿐이라 값이 같다. 생성기 사양(설계 5.9)이고 출력 줄에 적힌다.
- **재검증(되돌릴 수 있는가)**: index.html 과 새 파일 하나, 서류 셋이다. 이 PR 을 되돌리면 그대로 돌아온다.

### 알려진 실패 1건(기준에서도 같다 — 이 PR 과 무관)

옛 생성기 단위 시험 `unwire-check-b1.js` 의 T7 은 「작업 트리의 실제 index.html 에서 참조가 남지 않는 `_settingsKit` 가져오기를 골라 철거해 본다」는 검사인데, 재철거 3차(#953)가 그 손잡이를 지운 뒤로는 후보가 없어 「측정불가」로 실패 기록이 된다. 그 한 건이 그 시험을 다시 돌리는 겉의 묶음들(619 · 634 · 643 · 657 · 661 · 662 의 B)에 번진다. 고치지 않은 main 에서도 같다(측정 기록 `reports/TASK-ES-681/prev-suite-base.json`). 이 PR 은 생성기를 바꾸지 않아 그 묶음들을 돌리지 않았고, 그 시험 파일도 고치지 않았다(고치는 일은 따로 PR 이 필요하다 — 작업 끝 보고에 올린다).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-685/` 아래. 수치는 `measurement.json` 이 각 결과에서 읽어 모은 것이다.

| 파일 | 무엇 |
|---|---|
| `proof.json` · `finalize-meta.json` | 생성기 설정 · 산출 기록(남긴 문 · 함께 남긴 문과 까닭 · 부팅 파일 차례 · 신고서 종류 전후). 공개 키 글자는 (가림) |
| `order-probe.{base,work}.json` · `order-probe-fake.{base,work}.json` | 시점 탐침(부팅 동안의 사건 줄) |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 대조 탐침(기준 이름 목록으로 고정) |
| `scenario-local.json` · `scenarios/` | 시나리오 30개 기준 2회 · 작업 1회 |
| `module-load.json` · `raw/` · `tests-base.json` · `tests-work.json` | 모듈 로드 · npm test · 시험 하나씩 |
| `measurement.json` · `claims.json` | 측정 모음(`summary.words` 글자 · `summary.order` 시점) · 주장 |
| `commit-hook.json` | 부팅 파일이 든 실제 커밋의 훅 출력(우회 없음) |
| `remaining-inline.json` | 이 PR 뒤 인라인에 남은 문 목록과 공식 지표 |
| `court-local.json` | `recomputeSplit` 직접 호출과 로컬 법정 실행 기록(작업자 PC — 판정 아님) |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 법정의 생성기 재실행 대조가 로컬과 다를 수 있다(`relay` · `keepInline` 이 든 증명 파일의 첫 재실행 · 새 세포 파일 대조) → push 전에 `recomputeSplit` 을 직접 부른다(L070 · L088).
- **예상**: 시나리오 30개의 법정 소요 시간 → 선례(12개 약 6분 · 전문 템플릿 창 15개 약 10분)로 보아 주장 심사 한도(25분) 안이다. 로컬 법정 실행으로 한 번 더 본다.
- **예상**: 인라인 IIFE 가 없어지는 것을 전제로 한 시험 단언이 블록 잔류와 어긋날 수 있다 → 시험은 고치지 않고 깨지는 것이 있으면 보고한다. 결과: 깨진 단언 0.
- **측정불가**: 로그인 뒤의 동작 · 진짜 서버 연결(법정 브라우저가 외부 통신을 막는다 — 가짜 연결 라이브러리로 「연결 만들기가 불리는 차례」만 쟀다) · 운영 환경.
- **성과 측정**: index.html 2712 → 2306줄. 공식 지표 `inlineScriptLines` **442 → 36**(남긴 서버 연결 블록 14줄 + 다른 인라인 조각 22줄) — `measurement.json` `summary.inlineScriptLines` · `docs/architecture/module-baseline.json` 마지막 기록.

### 이 PR 뒤 인라인 IIFE 에 남은 문(9개 — `remaining-inline.json`)

| # | 문 | 종류 | 왜 남았나 |
|--:|---|---|---|
| 1 | `var _goalsKit = window.OurgoalGoalsKit;` | 손잡이 | 3번이 읽는다 |
| 2 | `window.OurgoalAppScope.expose('index.html', { get renderTeamGoalsScreen(){ … } });`(3줄) | 통로 중계 | 결심 ② — 7~9번보다 앞에서 돈다 |
| 3 | `var renderTeamGoalsScreen = _goalsKit.renderTeamGoalsScreen;` | 가져오기 | 2번의 getter 가 읽는다 |
| 4 | `var _uiKit = window.OurgoalUiHelpers;` | 손잡이 | 5번이 읽는다(부팅 파일에도 한 번 더) |
| 5 | `var bootApplySavedTheme = _uiKit.bootApplySavedTheme;` | 가져오기 | 6번이 부른다 |
| 6 | `bootApplySavedTheme();` | 구역 함수 호출 | 7~9번보다 앞에서 돈다(화면이 그려지기 전에 테마를 입힌다) |
| 7 | `var SUPABASE_URL = …;` | 서버 주소 선언 | 결심 ① |
| 8 | `var SUPABASE_ANON_KEY = …;` | 공개 키 선언 | 결심 ① — 새 파일로 옮기면 커밋 훅이 막는다 |
| 9 | `window.OurgoalAppState.define('sb', …);` | 상태 선언(서버 연결) | 결심 ① — 7·8번을 읽는다 |
