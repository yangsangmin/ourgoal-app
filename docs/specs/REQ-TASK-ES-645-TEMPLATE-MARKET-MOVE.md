# REQ — 돈 근처 함수 2개 글자 그대로 이전: 템플릿 마켓 창 · 템플릿 복제 본체

- Task ID: **TASK-ES-645** (L012: `gh pr list --state all` · `git ls-remote origin` 에서 645 가 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-645-template-market-move` 를 먼저 push 해 선점했다. 643·644 는 다른 작업 몫이다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- **한도(지시함 DIR-004, origin/main 에서 읽은 글자 그대로)**:
  - 결심 기록: 「③ 돈 근처 코드 3곳 — 내용은 한 글자도 안 바꾸고 자리만 옮기는 것에 한해 허용」
  - 지시 (나): 「돈 근처 3곳(executeDirectTemplateClone · openTemplateMarketModal · OurgoalTemplateCredit 초기화 줄)은 내용을 한 글자도 바꾸지 않고 자리만 옮긴다. 동작·문구·금액·조건을 바꾸는 변경은 승인선 ①로 그때 결심이다.」
  - 이 PR 이 지키는 한도: 생성기가 붙이는 이름 접두(`L.`) 말고는 글자 0 변경 · 동작·문구·금액·조건 0 변경 · 광고·구독·결제 관련 줄을 새로 만들거나 지우지 않는다. 한도를 넘어야만 옮길 수 있으면 옮기지 않고 멈춘다.
- 지시함 **DIR-003**(줄을 지우는 PR 마다 기준선에 inlineScriptLines 기록).
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「어려운 인라인 묶음 함수 이전」**(경험칙 L016 · `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` 2-2·2-10절) + 법정 「동작 보존 확인」 경로. 직전 선례 PR #911 · #913. 경험칙 **L033**(돈 근처 묶음은 옮기지 말고 건너뛰어 보고)에서는 **(나) 이탈**이다 — 사유 네 가지: ① 어느 규칙: L033 ② 왜 맞지 않는가: 그 뒤 상민님이 2026-10-11 결심으로 이 세 곳의 「자리만 옮기기」를 허용했고 지시함 DIR-004 에 병합돼 있다(지시함이 경험칙보다 위) ③ 대신 무엇을 했나: 허용된 한도 그대로 생성기로만 옮기고, 한도 준수를 생성기·검사기와 따로 줄 단위 바이트 비교로 쟀다 ④ 검증 수준: 선례와 같은 증명 전부 + 한도 실측(`prefix-only-check.json`) — 낮추지 않았다. 작업참고 **기준 PR #905**(eab4365b).
- 이 작업 세션은 빌더(서브에이전트)다. 병합은 하지 않는다(오케스트레이터 몫).
- 기준 main: 9014a386(#913 병합 뒤).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

- **R1** `executeDirectTemplateClone`(템플릿 복제 본체) · `openTemplateMarketModal`(템플릿 마켓 창)을 생성기로 세포 `js/tabs/records/template-market.js` 에 글자 그대로 옮긴다. 동작 보존.
- **R2** 한도 준수: 옮긴 구간에서 바뀐 글자는 생성기가 붙인 `L.` 접두뿐이고, 돈 관련 낱말이 든 줄은 수와 글자가 그대로다.
- **R3** 증명 하한(헌법 CELL_SPLIT_PROOF): 토큰 동일·누수 0 · 단독 로드 회귀 0 · 통로·window 이름 값 동일(옮긴 함수의 글자 해시 제외) · npm test 수 동일 · tests·금고·생성기 변경 0.
- **R4** 기준선(`docs/architecture/module-baseline.json`)에 줄어든 inlineScriptLines 를 기록한다(DIR-003).

범위 밖(건드리지 않음): `OurgoalTemplateCredit.init` 초기화 블록(3줄 이하라 생성기 일반 모드가 옮기지 않는다 — 원래 자리) · `OURGOAL_CONFIG` 의 선언·대입·노출 줄(결심 대기) · `openProTemplateRecordModal`(944줄, 다른 작업) · `js/template-credit.js` · 구획 주석(「… 보상형 광고 함수는 상민님 결정(2026-10-06)으로 지웠다 …」)은 index.html 에 그대로 남는다.

### 구체 식별자

- 파일: `index.html`(인라인 IIFE) → 새 세포 `js/tabs/records/template-market.js`(키트 `OurgoalRecordsKit`, 태그는 `js/tabs/records/index.js` 태그 앞 같은 줄)
- 함수: `executeDirectTemplateClone` · `openTemplateMarketModal`
- DOM: `#proTplMarketBtn`(맞춤기록 창의 「마켓」) · `#recOpenMarketQuickBtn` · `#mktGridContainer` · `#mktCategoryPills` `[data-mktcat]` · `#mktSearchInput` · `.mkt-preview-btn` · `.mkt-clone-btn` · `#mktDetailPreviewWrap` · `#mktPreviewCloneBtn`
- 생성기 `docs/design/harness/module-split/gen-inline-hard.js`(변경 0) · 검사기 `verify-inline-hard.js`(변경 0) · 설정 `reports/TASK-ES-645/proof.json`(자리 표지 `HO`)
- 이전 전 index.html(9014a386) 줄: 3383~3411(`executeDirectTemplateClone`) · 3412~3612(`openTemplateMarketModal`, 앞 주석 2줄 포함) (출처 `reports/TASK-ES-645/gen-inline-hard-meta.json` `plan`)

## 1. [원칙 ①] 문제를 정확히 파악한다

인라인 IIFE 최상위에 남은 함수 선언 가운데 두 개가 돈 근처(템플릿 복제의 서버 복제 기록 `OurgoalTemplateCredit.recordCopy` · 복제 수 표시 `fillCounts`)라 그동안 건너뛰었다(L033). 2026-10-11 결심으로 자리 이동만 허용됐다. 마켓 창은 944줄 함수 `openProTemplateRecordModal` 안(`#proTplMarketBtn`)과 세포 두 곳(`js/tabs/records/render.js` · `weekly-recap.js`)에서 `openTemplateMarketModal` 로 불린다. 복제 본체는 마켓 창 안에서만 불린다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 내용은 한 글자도 바꾸지 않고 자리만 옮긴다.
- **원인**: 돈 근처라는 이유로 이전을 미뤄 왔고, 그 사이 다른 함수가 다 빠져나가 이 둘이 덩어리에 남았다.
- **중심**: 생성기 한 번 실행(설정 `reports/TASK-ES-645/proof.json`, 세포 1개 · 함수 이름 2개). 두 함수를 **한 세포**에 두어 복제 본체 호출이 세포 안 직접 호출로 남게 했다 — 복제 본체를 통로에 새로 노출하지 않는다.
- **핵심**: 「접두 말고 글자 0 변경」을 생성기의 말이 아니라 따로 잰 값으로 보이는 것, 그리고 생성기가 새로 다는 통로 이름이 돈 관련 상태가 아닌 것.

## 3. [원칙 ③] 해결 방식

- 세포 하나(`js/tabs/records/template-market.js`, 258줄): 책임 = 템플릿 마켓(둘러보기 창과 복제 본체). 두 세포로 나누면 마켓 창이 복제 본체를 `L.executeDirectTemplateClone` 로 불러야 해 그 이름의 가져오기·getter 가 새로 생긴다 — 돈 근처 함수를 통로에 처음 내놓는 일이라 택하지 않았다.
- 세포 파일 머리 설명(설정 `title` · `desc`)에는 돈 관련 낱말을 쓰지 않았다(첫 생성에서 머리 설명 한 줄에 부품 이름이 들어가 「옮긴 구간 밖의 돈 관련 줄 1」로 잡혀, 설명을 고쳐 다시 생성했다 — 지금 0).
- `OURGOAL_CONFIG` 를 읽지 않는다(옮긴 230줄에 그 이름 0건) → 그 이름의 getter 는 생기지 않았다.
- 등록 블록을 손으로 넣지 않았고 `gen-cell-provide.js` 를 돌리지 않았다(L068).

## 4. [원칙 ④] 재검토 (반례·부작용)

- **한도 준수 실측(`prefix-only-check.json`)** → 기준 index.html 의 옮긴 구간 230줄과 세포 파일의 생성기 표지 아래 230줄을 1:1 로 맞댔다. 바이트 동일 203줄 · `L.` 접두만 다른 줄 27줄 · 그 밖의 차이 **0줄**. 세포 줄에서 통로 이름 앞의 `L.` 만 지우면 기준 줄과 바이트 단위로 같다. 지운 `L.` 38개 = 생성기가 적은 바꿔 쓰기 38개. 돈 관련 낱말이 든 줄은 기준 4줄 · 세포 4줄이고 접두를 지우면 글자가 같다. 옮긴 구간 밖(머리 설명·껍데기)에 돈 관련 낱말이 든 줄 0.
- **생성기가 새로 단 통로 getter 2개** → `saveLocalSettings`(설정 저장 함수 — 기준에서 등록 기관이 이미 통로에 내주던 이름)와 `CURATED_MARKET_TEMPLATES`(마켓에 싣는 표 템플릿 목록 상수 — 통로에 처음 생긴다). 둘 다 돈 관련 상태가 아니다: 목록 상수의 원본 `js/tabs/goals/curated-market-data.js` 에 price·credit·유료·가격 글자 0건(grep). 이 상수를 `L.` 로 읽는 기존 js 코드는 0곳. 상태 기관 이름과 겹치는 getter 0(`accessor-probe.json`).
- **이름 지문** → 통로 이름 430개 중 달라진 것은 `openTemplateMarketModal` 하나(종류·이름·인자 수 같고 함수 글자 해시만 다름 — 본문에 `L.` 접두) · 그 밖 0 · 사라진 이름 0. window 이름 17개 지문 차이 0(`name-fingerprints.json`).
- **호출이 계속 닿는가** → index.html 은 IIFE 머리에서 `var openTemplateMarketModal = _recordsKit.openTemplateMarketModal;` 로 같은 이름을 가져온다(생성기). 그래서 944줄 함수 안의 `openTemplateMarketModal(function(clonedTpl){…})` 호출과 기존 통로 getter(`get openTemplateMarketModal(){…}`)가 그대로 닿는다. 화면으로: 맞춤기록 창의 「마켓」 단추로 실제로 열린다(시나리오).
- **안쪽 지역 함수 `cloneTemplate`** → 마켓 창 안에 같은 이름의 지역 함수가 있다(IIFE 의 `cloneTemplate` 을 가린다). 생성기는 스코프 분석으로 접두를 붙이므로 지역 이름에는 붙지 않았다 — 위 줄 단위 비교에서 그 줄들은 바이트 동일이다.
- **단독 로드(L018)** → 세포 파일은 함수 정의만 한다. 새 파일 단독 로드 ok, 기준 대비 회귀 [].
- **CSS 숨김** → 옮긴 글자에 `!important` 0건.
- **발견(고치지 않음)**: 마켓 창의 「미리보기」 단추는 **기준에서도** 예외로 죽는다 — `sheet.querySelector('#mktPreviewTableBox')` 가 찾는 요소가 창 마크업에 없어 `Cannot set properties of null (setting 'innerHTML')` 가 난다(기준 트리에서 게스트로 눌러 실측, 그 id 는 기준 index.html 에 조회 줄 한 곳뿐). 옮기기 PR 이라 버그도 그대로 옮겼다(CELL_SPLIT 1호). 결함 목록 후보로 보고한다.
- **마켓 창에 닿는 두 길** → ① 기록 탭의 템플릿 카드(`#recProTemplateCard`, 처음엔 접혀 있고 빠른 단추 줄의 펼침 단추로 연다) 안 「템플릿 마켓」 칩(`#recOpenMarketQuickBtn`) — 세포 `js/tabs/records/render.js` 가 통로(`L.openTemplateMarketModal`)로 부른다. ② 맞춤기록 창의 「마켓」 단추(`#proTplMarketBtn`) — 덩어리에 남은 944줄 함수가 IIFE 머리 가져오기 이름으로 부른다. 두 길 모두 시나리오로 쟀다.

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · `npm ci --ignore-scripts` · 기준 작업 폴더(분리 HEAD).
2. 지시함 DIR-004 를 origin/main 에서 읽어 한도 문장 확인 → 옮길 230줄에서 `OURGOAL_CONFIG` · `!important` · `this`/`arguments` 유무 확인.
3. 생성기 실행 → 검사기 ok → 한도 실측(`prefix-only-check.cjs`) → `module-specs --write` · `cell-desc-add.js` · `module-guard --update`(낮아진 값만).
4. 게스트 화면에서 마켓 창에 닿는 길 실측 → 시나리오(쓰기가 일어나는 조작 없음).
5. 측정: 모듈 로드 탐침 · 이름 지문 · 접근자 실측 · 시나리오(기준 2회·작업 1회) · npm test(기준·작업 전경) · tests 전부 종료 코드.
6. 서류 → `verify-integrity-gate.js` → `npm test` → 커밋(훅이 돈 표시로 막으면 우회하지 않고 보고) → 로컬 `recomputeSplit` · 로컬 법정 전체 실행 → origin/main 합치기 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「접두가 붙은 것도 글자 변경이니 『한 글자도 안 바꾸고』에 어긋난다」** → 덩어리 밖으로 옮긴 코드는 덩어리 안의 이름을 통로로만 읽을 수 있다. 접두는 「같은 값을 어디서 읽는가」만 바꾸며 헌법 CELL_SPLIT 1호가 옮기기에서 허용한 유일한 글자다. 문구(따옴표 안 글자)·조건식·숫자·호출 순서에는 닿지 않는다 — 접두가 붙은 27줄은 전부 「`L.` 만 지우면 바이트 동일」로 확인했고, 따옴표·주석 안에는 붙지 않았다(붙었다면 그 줄이 「그 밖의 차이」로 잡힌다). 이 해석이 한도 밖이라고 보시면 병합하지 않으면 된다 — PR 본문에 그대로 적는다.
- **반론 2 「복제를 실제로 눌러 보지 않았으니 복제 동작 보존을 말할 수 없다」** → 맞다, 화면으로는 말하지 않는다. 복제를 누르면 내 템플릿 저장과 서버 복제 기록 호출이 일어나므로 지시대로 넣지 않았다. 복제 본체의 동일성은 생성기 재실행 바이트 대조(proof)·토큰 동일·줄 단위 비교로만 말하고, 화면 시나리오는 마켓 창 열기와 분류·검색 걸러내기까지만 말한다(주장 파일 `outOfScopeReports`).
- **재검증**: 첫 시나리오에 넣었던 「미리보기 열고 닫기」는 기준에서 예외가 나 뺐다(4절 발견). 기준에서 닿지 않거나 깨지는 조작은 넣지 않는다.
- **재검증**: 시험 파일 개별 실행 첫 비교에서 `tests/offline-sync-queue-retain.test.js` 가 작업 쪽에서만 한 번 실패했다. 이 시험은 `js/core/virtual-user-helpers.js` 한 파일만 읽고 그 파일은 이 PR 이 바꾸지 않는다. 기준·작업에서 세 번씩 다시 돌리니 여섯 번 모두 종료 코드 0 이었다(흔들림). 그 뒤 작업 쪽 전체를 다시 돌린 값으로 비교했고, 첫 관측은 `tests-all-flake.json` 에 남겼다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-645/` 아래, 작업자 측정이다.

| 산출물 | 무엇을 쟀나 | 결과 |
|---|---|---|
| `prefix-only-check.json` | 옮긴 230줄의 줄 단위 바이트 비교 · 돈 관련 줄 수·글자 | 그 밖의 차이 0줄 · 접두 38 = 생성기 바꿔 쓰기 38 · 돈 관련 줄 4 = 4 · `ok: true` |
| `verify-inline-hard.json` | 토큰 동일(접두 제외) · 줄 동일 · 남은 글자 동일 · 누수 0 · 미노출 0 · setter 빠짐 0 · this/arguments 0 · 이중 처리기 0 · 800줄 이하 | `ok: true` |
| `measurement.json` | 인라인 줄 수 · index.html 줄 수 · 새 파일 줄 수 · 바뀐 파일 분류 | inlineScriptLines 2615 → 2392(−223) · index.html 함수 선언 수 26 → 19(지표는 안쪽 함수 선언까지 센다 — 마켓 창 안의 지역 함수 5개 포함) · 새 파일 258줄 · tests/금고/생성기/생성 지도 변경 0 |
| `module-load.json` | 법정 모듈 로드 탐침 기준 대 작업 | 회귀 [] · 새 파일 단독 로드 ok |
| `cell-registry-compare.base.json` · `cell-registry-compare.json` · `name-fingerprints.json` | 통로·window 이름 값 지문 | 4절 |
| `accessor-probe.json` · `expose-window.json` | 상태 기관 겹침 · 통로 접근자 · 새 getter 시점 | 겹침 0 · 읽는 이름 8개 모두 통로에 있음 |
| `scenarios/s1-template-market-browse.json` · `s2-records-market-chip.json` · `scenario-local.json` | 게스트: ① 일정 탭 → 일정 관리 창 → 맞춤기록 창 → 「마켓」 → 분류·검색 걸러내기 ② 기록 탭 → 템플릿 카드 펼침 → 「템플릿 마켓」 칩 → 마켓 창 | 둘 다 기준 2회·작업 1회 통과 · 행동 변화 단언 있음 · 예외 0 |
| `raw/npm-test.{base,work}.{log,exit}` · `npm-test-compare.json` | npm test 전경 실행 | 종료 코드 0 · 0, ✓ 줄·ok 줄 수 동일 |
| `tests-all-compare.json` · `tests-all-flake.json` | 시험 파일 개별 실행 | 다른 파일 0(6절의 흔들림 1건 기록) |
| `court-local.json` | 로컬 `recomputeSplit` · 로컬 법정 전체 실행 | 커밋 뒤 기록 |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 커밋 훅의 돈 표시 검사(L033 의 AL1)가 막으면 우회하지 않고 훅 출력 원문과 함께 보고한다. 다른 index.html PR 이 먼저 병합되면 main 판으로 다시 돌린다(L010).
- **측정불가(화면)**: 복제 실행(쓰기가 일어나 넣지 않았다 — 내 템플릿 저장 · 서버 복제 기록) · 복제 수 표시(서버 응답이 필요, 법정은 외부 통신을 막는다) · 미리보기(기준에서도 예외).
- **성과 측정**: inlineScriptLines 2615 → 2392(−223, 출처 `measurement.json` `summary.inlineScriptLines`), IIFE 최상위 함수 선언 2개 감소.
- **남은 것**: 돈 근처 3곳 가운데 `OurgoalTemplateCredit.init` 블록(3줄)은 구역 이전 몫. `OURGOAL_CONFIG` 는 결심 대기. 그 밖에 다시 단 getter 재철거, 944줄 함수, `setupUserSessionRealtime`, `saveGoogleToken`, 구역 이전.
- **PLAN 체크리스트**: [4단계: 심사 청구]까지만 기록한다(`.claude/plan-TASK-ES-645.md`).
