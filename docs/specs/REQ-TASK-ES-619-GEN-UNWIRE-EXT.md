# REQ — #TASK-ES-619 생성기 unwire 확장: 여러 실행 · X1(손잡이 이름꼴) · X3(한 줄을 나눠 쓰는 window 대입) · X2(손잡이 줄)

- Task ID: **TASK-ES-619** · 분류: INFRA(생성기·하네스) · 제품 코드(index.html · js/**) · tests/ · 금고 변경 0. 저장소 index.html 의 실제 철거 0.
- 작업 유형(SNOWBALL 분류): **(가) 표준에 가까운 탐색** — 유형 「생성기 모드 추가」의 선례는 B1(#TASK-ES-610, PR #883 — unwire 모드 추가 + 단위 시험 `unwire-check-b1.js`) 하나다. 그 방식을 그대로 따른다: 새 경로는 `CFG.mode === 'unwire'` 안에서만, 사양을 PR 본문에 공개, 단위 시험으로 지우는 글자의 범위를 고정, 기존 경로 바이트 무변화를 A1 시범 재생성으로 증명. 선례에 없는 것(여러 실행 · 줄 안 글자 삭제)은 검증을 더 설계했다(6절).
- 작업참고 기준 PR #890(919b1a49, 경험칙 68개) · 이 PR 의 기준 main 919b1a49(#890 병합 뒤 — 생성기와 index.html 은 a3bad12a 와 같다) · 지시함(origin/main) 열린 지시: **DIR-003**(B 트랙) · **DIR-004**(닫힌 목록 U1~U3 + X1~X9, PR #887 병합 f616a9db).
- **상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d — 글자 그대로)**
  1. 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마. 지침이나 결심이 필요한점?」
  2. 「결심필요 4번 빼고 모두 권장안대로 진행하고 4번은 자세히 설명해봐 어떤 함수인지 어떤 기능을 하던건지 자세히, 어떻게 진행하는게 좋을지, 권장안이 뭔지」 — 결심 표의 묶음 1(생성기가 다루는 줄 종류 확대, 권장 「허용」)이 이 PR 의 근거다. 효력 기록은 지시함 DIR-004 (가)항과 `docs/architecture/CELL-REGISTRY-DESIGN.md` 5.2(X1·X2·X3).
- 설계 정본: `docs/architecture/CELL-REGISTRY-DESIGN.md` 5절(닫힌 목록) — 이 PR 이 5.4(구현된 설정 꼴)를 더한다.

## 0. 요구 (지시 항목)

| ID | 지시 | 원문의 어느 문장 | 완료 기준 |
|---|---|---|---|
| R1 | 여러 실행: 한 설정에서 unwire 실행을 배열로 받아 차례로 적용한다. 단일 객체 꼴은 그대로 동작한다. 안전 검사는 실행마다 그대로 | 원문 1 「남은 미분화작업 모두 진행」 — 법정은 PR 하나에 생성기를 한 번만 돌려 지금은 철거 PR 이 16개가 된다 | 실제 index.html 사본에서 `reports/TASK-ES-614/unwire-plan.json` 16실행을 기준 생성기로 차례로 돌린 결과와 배열 한 번의 결과가 바이트 동일 |
| R2 | X1: `_ui`·`_xp` 처럼 `_xxxKit` 꼴이 아닌 손잡이의 가져오기 줄을 받는다. 아무 식별자나 받지 않고 IIFE 최상위에서 `var <kitVar> = window.…` 로 선언된 손잡이임을 검사한다 | 원문 2(묶음 1 · X1) | 단위 시험 X1a·X1b 와 실제 파일 시험 R2 가 ok |
| R3 | X3: 한 줄을 나눠 쓰는 window 대입을 그 줄 안에서 그 대입 글자만 지운다. 남는 글자를 재파싱으로 확인하고 애매하면 멈춘다 | 원문 2(묶음 1 · X3) | 단위 시험 X3a~X3d 와 R2 가 ok |
| R4 | X2: 손잡이의 맨이름 참조가 0 일 때만 손잡이 줄을 지우는 선택 플래그. 참조가 남으면 멈춘다 | 원문 2(묶음 1 · X2) | 단위 시험 X2a·X2b·R3 가 ok |
| R5 | 기존 경로 무변화와 닫힌 목록: 옮기기 경로는 글자 하나 지나지 않고, 단일 객체 설정의 출력은 바이트 동일하며, 닫힌 목록 밖의 줄은 어떤 플래그로도 지워지지 않는다. 제품 코드·tests·금고 변경 0 | DIR-004 (가) 「목록 밖의 줄 종류는 다시 결심 · 단위 시험으로 목록 밖 글자를 건드리지 않음을 증명」 | B1 시험 8건 재실행 ok · 생성기 diff 가 unwire 구간 안에만 있음 · npm test 기준=작업 |

- 원문에 있는데 이 PR 항목에 없는 요구: 실제 줄 지우기(철거 PR 들) · X4~X9(unstate · region · sweep · finalize) — 이 PR 범위 밖이다. 각각 별도 PR 로 한다(목표 줄에 남는다).

### 구체 식별자

- 고친 파일: `docs/design/harness/module-split/gen-inline-hard.js`(함수 `runUnwire()` — 여러 실행 · 새 함수 `parseUnwireDoc(ls)` · `unwireOnce(U, doc)`, 설정 칸 `unwire[]` · `sharedLine` · `dropKitVar` · `label`) · `docs/architecture/CELL-REGISTRY-DESIGN.md`(5.2 표 세 행 · 5.4 새 절) · `docs/rules/TICKETS.md`
- 새 파일: `docs/design/harness/module-split/unwire-check-ext-619.js`(단위 시험 16건) · `docs/specs/REQ-TASK-ES-619-GEN-UNWIRE-EXT.md` · `reports/TASK-ES-619/`(unwire-ext-unit.json · unwire-b1-rerun.json · measure-619.cjs · measurement.json · raw/npm-test.*.log · claims.json)
- 손대지 않은 것: `index.html` · `js/**` · `tests/**` · `court/**` · 생성 지도 3종 · 생성기의 옮기기 경로(파일 머리 1~51행과 `runUnwire` 뒤 `// smoke-test FN_NAMES` 이후 전부) · 기존 단위 시험 `unwire-check-b1.js`
- 읽기만 한 것: `reports/TASK-ES-614/unwire-plan.json`(실행 16개 · `stoppedByGenerator` · `notRunnableKitVars`) · `court/lib/preserve-source.js`(`recomputeSplit`) · `docs/design/harness/module-split/inline-hard-a1-596.json`
- 실제 대상 줄(기준 a3bad12a 의 index.html): 3588행 `/* … */ window.defaultProfile = defaultProfile;` · 3656행 `if(typeof window !== 'undefined'){ window.loadProfile = loadProfile; window.saveProfile = saveProfile; }` · 3807행 `if(…){ window.setTab = setTab; window.switchTab = setTab; }` · 6041행 `var shareContent = …; window.shareContent = shareContent;` · 손잡이 2261행 `var _ui = window.OurgoalUiHelpers;` · 2266행 `var _xp = window.OurgoalAvatarParts.xp;`
- DOM: 이 PR 은 화면을 바꾸지 않는다(해당 없음).

## 1. [원칙 ①] 문제를 정확히 파악한다

- 법정은 PR 하나에 기준 커밋의 생성기를 **한 번** 돌려 PR 의 index.html 과 바이트 대조한다(`court/lib/preserve-source.js`). 지금 생성기는 실행 하나에 키트 하나·플래그 한 벌이라 `unwire-plan.json` 의 16실행이 PR 16개가 된다.
- 지금 생성기가 멈추는 꼴이 넷 있다(계획 파일 `stoppedByGenerator` · `notRunnableKitVars`): `_ui`·`_xp` 손잡이(이름꼴), 주석과 한 줄을 나눠 쓰는 대입, 한 줄 if 블록 안의 두 대입, 다른 문 뒤에 붙은 대입.
- 손잡이 줄 `var _k = window.X;` 15줄은 가져오기가 모두 지워져도 남는다.
- 이 셋은 2026-10-11 결심으로 닫힌 목록 X1·X3·X2 에 들어갔다. 구현은 아직 없다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 생성기는 법정이 다시 돌리는 도구다. 고칠 때마다 「무엇을 지울 수 있게 되는가」가 넓어지므로, 넓어지는 만큼만 정확히 넓히고 그 밖은 기계가 막아야 한다.
- **원인**: B1 은 안전하게 시작하려고 가장 좁은 꼴(한 줄을 통째로 차지하는 문 · `_xxxKit` 이름 · 실행 하나)만 받았다.
- **중심**: 사후 대조 — 실행마다 결과를 다시 파싱해 토큰열이 「이전 − 지우기로 한 것」과 같은지 본다. 줄 안 글자 삭제(X3)가 다른 글자를 건드렸으면 여기서 멈춘다.
- **핵심**: 새 기능은 전부 기본 꺼짐이거나(X3 `sharedLine` · X2 `dropKitVar`) 더 엄한 검사다(X1 손잡이 검사 · 모르는 칸 정지). 예전 설정은 같은 글자를 낸다.

## 3. [원칙 ③] 해결 방식

1. `runUnwire()` 를 「문서 하나에 실행 하나」(`unwireOnce`)와 「실행을 차례로 도는 바깥」으로 나눈다. 실행 사이에는 결과 줄 배열을 다시 파싱한다(`parseUnwireDoc`). 쓰기는 맨 끝 한 번 — 하나라도 멈추면 아무것도 쓰지 않는다.
2. X1: `kitVar` 이름꼴 검사를 「IIFE 최상위에서 `var <kitVar> = window.…;` 로 한 번 선언된 손잡이」 검사로 바꾼다.
3. X3: `sharedLine` 플래그. 받는 꼴 셋(주석·다른 문과 같은 줄의 대입 / 한 줄 if 블록 안 여러 대입 중 일부 / 주석·다른 문과 같은 줄의 한 줄 블록). 줄 안 열 구간으로 지우고 빈칸 규칙을 고정한다. 잔존 참조 검사는 「지운 글자 안의 참조」만 뺀다.
4. X2: `dropKitVar` 플래그. 그 실행의 삭제를 반영한 뒤 손잡이 바인딩의 남은 참조를 센다.
5. 모르는 칸은 멈춘다.
6. 단위 시험 하네스 `unwire-check-ext-619.js` — 작은 꾸러미 + 기준 커밋의 실제 index.html. 기준 생성기는 `git cat-file` 로 기준 커밋에서 꺼내 같은 입력에 돌려 맞댄다.

## 4. [원칙 ④] 재검토 (반례·부작용)

- 여러 실행에서 앞 실행 결과를 파일에 쓰지 않고 메모리에서 다시 파싱한다 → 「차례로 16번 돌린 것」과 정말 같은가? 줄 배열을 `EOL` 로 이어 쓰고 다시 읽어 `\n` 으로 나누는 왕복은 줄 배열을 바꾸지 않는다. 실측으로 확인했다(R1: 414,353바이트 동일, 단계마다 두 생성기의 결과·메타·출력 동일).
- 손잡이 검사를 `_xxxKit` 이름에도 건다 → 예전에는 선언이 없는 `_xxxKit` 이름도 `imports:false` 로 돌 수 있었다. 지금은 멈춘다. 더 엄해지는 방향이고, 계획 파일의 16실행은 모두 선언된 손잡이라 영향이 없다(R1).
- 모르는 칸 정지 → 예전에는 모르는 칸을 무시했다. 계획 파일이 안내한 설정 꼴(`kitVar` · `imports` · `exposeGetters` · `windowAssign` · `names`)에는 모르는 칸이 없다. `label` 은 받는다.
- X3 가 주석을 지우면 안 된다 → 지우는 것은 문의 글자와 인접 빈칸뿐이다. 사후 대조가 남은 주석 목록이 그대로인지 본다. 지우는 블록 안에 주석이 끼어 있으면 주석 목록이 달라져 멈춘다(애매하면 멈춤).
- X3 로 같은 줄의 다른 문이 그 이름을 계속 쓰는데 가져오기를 지우면 ReferenceError → 잔존 참조 검사가 줄 단위가 아니라 글자 구간 단위로 본다(X3c 의 두 번째 경우가 멈춤을 확인).
- X2 로 아직 쓰이는 손잡이를 지우면 앱이 안 뜬다 → 참조가 하나라도 남으면 멈춘다(X2b · 실제 파일 R3).
- 메타 파일 쓰기에 `'utf8'` 을 명시했다(예전 줄은 인코딩 인자가 없었다) → 글자열 쓰기의 기본이 utf8 이라 바이트는 같다. S1·R1 이 메타 동일을 확인.
- 이 PR 이 병합되기 전의 철거 PR 은 예전 생성기로 심사받는다(법정은 기준 커밋의 생성기를 돌린다) → 진행 중인 #TASK-ES-618 에 영향 없다.

## 5. [원칙 ⑤] 절차

1. 작업 폴더(origin/main a3bad12a) · 번호 619 선점.
2. 생성기의 unwire 구간만 교체(파일 머리와 옮기기 경로는 그대로) → `node --check` → B1 시험 8건.
3. 하네스 `unwire-check-ext-619.js` 작성 → 16건.
4. 설계 5.2·5.4 · REQ · TICKETS.
5. 측정(`reports/TASK-ES-619/measure-619.cjs`): 바뀐 파일 · 생성기 diff 구간 · 단위 시험 · `verify-integrity-gate` · `module-guard` · `module-metrics` · `npm test` 기준/작업.
6. 주장 파일 → 커밋(훅 통과) → origin/main 합치기 → push → PR. 병합은 오케스트레이터가 법정 판정을 본 뒤.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 「여러 실행은 닫힌 목록에 없는 새 기능이다 — 결심 없이 넣으면 안 된다」 → 여러 실행은 줄 **종류**를 넓히지 않는다. 각 실행은 예전과 같은 검사를 거쳐 같은 줄을 지우고, 결과는 PR 을 나눠 차례로 돌린 것과 바이트 단위로 같다(R1 이 그 동일성을 실제 파일에서 증명). 넓어지는 것은 「한 PR 에 담기는 양」이며, PR Diff 한도는 헌법 제5조 제2항이 없앴다. 다만 판단은 오케스트레이터·법정·상민님 몫이라 PR 본문에 그대로 공개한다.
- 반론 2 「줄 안 글자 삭제는 정규식 치환과 다를 바 없다(L020 — 문자열·주석 손상)」 → 지우는 구간은 정규식이 아니라 파서가 준 문 노드의 열 구간이다. 그리고 결과를 다시 파싱해 토큰열과 주석 목록을 맞대므로, 문자열이나 주석 안의 글자가 하나라도 달라지면 멈춘다. X3a 는 주석 안에 지울 이름과 같은 글자(`alpha`)가 있는 줄로 시험했다.
- 재검증: 고친 생성기의 diff 를 측정 스크립트가 앞뒤 공통 줄 수로 재서, 바뀐 구간이 unwire 머리 주석 뒤 ~ `// smoke-test FN_NAMES` 앞에만 있음을 확인한다(`measurement.json` `summary.generator`). A1 시범 재생성(B1 시험 T8)이 옮기기 경로의 바이트 무변화를 따로 확인한다.

## 7. [원칙 ⑦] 단계별 실행

- 생성기: unwire 구간(예전 52~168행)만 교체. 추가 146줄 · 삭제 17줄(`git diff --numstat`). 파일 머리 51줄과 뒤 369줄은 그대로다(측정 `summary.generator.commonPrefixLines` · `commonSuffixLines` — 줄 수는 끝의 빈 줄을 포함한 값).
- 단위 시험 16건 전부 ok(`reports/TASK-ES-619/unwire-ext-unit.json`):
  - B(B1 시험 8건 재실행) · S1(단일 객체 = 기준 생성기) · M1·M2(여러 실행 · 원자성) · X1a·X1b · X3a~X3d · X2a·X2b · C1(모르는 칸) · R1~R3(실제 index.html).
- R1 실측: 16실행 · 단계별 동일 16/16 · 삭제 줄 합 845(계획 파일의 예상 845와 같음) · index.html 6,273줄 → 5,428줄 · 414,353바이트 동일.
- R2 실측: X3 이름 4개(`defaultProfile` · `loadProfile` · `saveProfile` · `setTab`) 4/4, X1 이름 9개(`_ui` 2 · `_xp` 7) 9/9 실행 성공. 지운 줄의 종류는 가져오기·getter·window 대입·빈 껍데기뿐이고 줄 안에서 지운 글자는 `window.X = X;` 뿐이다.
- 주의: R2 는 생성기가 그 줄을 **지울 수 있음**을 보인 것이다. 그 이름들을 실제로 지워도 되는지(시험이 그 글자를 붙잡는지 · 화면 동작)는 철거 PR 이 따로 잰다.

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- 예상한 막힘: 이 PC 는 `core.autocrlf=true` 라 `git show` 가 CRLF 로 바꾼다 → 기준 생성기와 실제 index.html 은 `git cat-file -p` 원시 blob 으로 읽는다(L060). main 이 움직이면 계획 파일의 이름이 이미 지워져 시험이 깨진다 → 하네스가 기준 커밋(a3bad12a)을 상수로 고정해 같은 입력을 읽는다.
- 성과 측정: 이 PR 의 성과는 생성기 줄 수가 아니라, 병합 뒤 철거 PR 수가 줄고(16 → 계획상 1~수 개) X1·X3 대상 이름이 실제로 지워져 `inlineScriptLines` 가 줄어드는지로 잰다. 그 측정은 철거 PR 의 몫이다.
- 판정은 법정이 낸다. 아래 주장은 작업자 측정이며 판정이 아니다.
