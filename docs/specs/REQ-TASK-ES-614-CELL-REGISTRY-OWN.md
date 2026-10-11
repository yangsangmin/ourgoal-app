# REQ — 미분화 덩어리 해체 B3a: 등록 기관 own 적용(IIFE 직전 commit) · 전 키트 모의 철거 측정

- Task ID: **TASK-ES-614** (L012: 오케스트레이터가 `gh pr list --state all` · `git ls-remote origin` 에서 614 가 비어 있음을 확인하고 빈 브랜치 `feat/2026-10-11-task-es-614-cell-registry-own` 을 먼저 push 해 선점했다. 613 은 생성 지도 갱신 #886, 615 는 지시함 DIR-004 #887 이 쓴다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main): **DIR-003**(B 트랙 착수, PR #874) · **DIR-004**(범위 확대, PR #887 병합 f616a9db) — DIR-004 「지시」의 순서 첫 단계 「own 전환」이 이 PR 이다. DIR-004 (다) 「시험이 글자로 붙잡고 있는 연결선 이름은 지우지 않고 남겨 둔 채 진행한다」를 철거 계획에 그대로 반영했다.
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(다) 탐색 — 「새 기관 추가」의 둘째 꼴(own 전환)**. 작업참고(기준 PR #884)의 L058(배선을 지우는 새 기관은 compare 모드로 먼저 넣고 첫 측정을 가공 없이 저장)·L059(unwire 는 세 종류로 제한)를 빌리되, 이 PR 은 B1·B2 와 달리 **런타임 경로를 실제로 바꾼다**(이름이 IIFE 보다 한 발 먼저 통로·window 에 놓인다). 그래서 검증을 스스로 설계했다: 「옛 배선을 전부 지운 사본에서도 앱이 같게 도는가」를 전 키트 모의 철거로 잰다(7절).
- 작업참고 기준 PR #884(25025be8) · 착수 기준 main c42a61ae(PR #885 병합) · push 전 합친 main f616a9db(#886 생성 지도 갱신 · #887 지시함 — 두 커밋 사이 `js/**`·`index.html`·`scripts/**`·`tests/**`·`court/**` 차이 0, `git diff --stat` 실측).
- 설계 정본: docs/architecture/CELL-REGISTRY-DESIGN.md 3.1절(own 모드·적용 시점 commit·PR 분리) · 3.2절(이름 목록 고정) · 5절(생성기 줄 종류 닫힌 목록) · 6.2절 순서 1.
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 출처 | 완료 기준 |
|---|---|---|---|
| R1 | 등록 기관이 세포가 등록한 이름을 직접 통로(`OurgoalAppScope`)와 window 에 내준다(own). 적용은 `provide` 때가 아니라 **IIFE 바로 앞 한 번(commit)**. 앱 동작은 그대로다 | 설계 3.1 · DIR-004 「own 전환」 | 게스트 부팅·여섯 탭 시나리오와 인라인 처리기 시나리오가 기준·작업 양쪽에서 통과 · module-load 새 회귀 0 · 새 전역 0 · index.html 순증가 0 |
| R2 | own 이 내주는 값이 옛 배선 값과 같다 — 이름 전수 대조. 통로 이름 목록이 늘거나 줄지 않는다 | 설계 3.2 | 대조 결과 own > 0 · 불일치 0 · 초과 0 · 이중 등록 0, 기준 대 작업의 이름별 값 지문 차이 0 |
| R3 | **옛 배선이 없어도 충분한가** — 전 키트 모의 철거. 저장소 밖 사본에서 현행 생성기 unwire 로 지울 수 있는 배선을 지우고, 그 사본에서 대조(이름 목록은 철거 전 것으로 고정)·시나리오·module-load·npm test 가 기준과 같다. 실제 철거는 0 | 오케스트레이터 지시 5·6항 · 설계 6.2 「전 키트 모의 철거로 증명」 | 모의 철거 사본: 불일치 0 · 통로에서 사라진 이름 0 · 이름별 값 지문 차이 0 · 시나리오 통과 · npm test 경로와 시험 파일별 종료 코드가 기준과 같음. 철거 계획 파일이 있다 |
| R4 | 증명 하한: tests/ 변경 0 · 금고 변경 0 · 생성기 gen-inline-hard.js 변경 0 · 800줄 상한 초과 0 · inlineScriptLines 불변 · npm test 검사 수 동일·폐기 0 | 설계 4절 「새 기관 추가」 | measurement.json 의 해당 칸 |

원문에 있는데 이 PR 에 없는 것(목표 줄에 남긴다): 「남은 미분화작업 모두」 — 실제 철거(B3~B8)·함수 이전·상태·부팅 이전은 다음 PR 들이다. 이 PR 은 그 전제(own)와 계획 입력만 만든다.

### 구체 식별자

- 고친 파일: `js/core/cell-registry.js`(`commit()` 신설 · `mode(name[, value])` 실제 모드 · `provide(owner, values, { window, windowOnly })` · `report()` 의 `mode`·`counts.own`·`commit` 칸) · `index.html` 2252행(IIFE 바로 앞 태그 줄) 끝에 `<script src="js/core/cell-registry-commit.js"></script>` 한 태그 덧붙임(순증가 0) · 세포 파일 43개의 등록 블록(`windowOnly: [...]` 칸 추가 — 생성기 산출) · `docs/design/harness/module-split/gen-cell-provide.js`(`blockFor` — window 에만 나가는 이름을 `windowOnly` 로 출력) · `scripts/probes/cell-registry-compare.js`(`--names-from` · `--fingerprints`) · `docs/architecture/modules.json`(세포 `core/cell-registry-commit`, kind organ — `module-specs --write` 산출) · `docs/architecture/cell-descriptions.json` · `docs/architecture/CELL-REGISTRY-DESIGN.md`(3.1·3.2·6.1 에 구현 사실 5줄) · `docs/rules/TICKETS.md`
- 새 파일: `js/core/cell-registry-commit.js`(전역 0, `OurgoalCellRegistry.commit()` 한 번 부름)
- 손대지 않은 것: `docs/design/harness/module-split/gen-inline-hard.js`(법정이 다시 돌리는 생성기 — 변경 0) · `js/core/app-scope.js` · tests/ · 금고(court/** 등) · 생성 지도 3종(L009) · index.html 의 옛 배선 줄(실제 철거 0) · 세포의 등록 블록 밖 글자
- 화면 식별자(시나리오): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose`(onclick=`closeAvatarGreetingPopup`) · `.navbtn[data-tab=…]` · `#btnGoalsSubPersonal`·`#btnGoalsSubRoutine`·`#btnGoalsSubStats`(onclick=`switchGoalsSubTab`) · `#btnGoalPeriodWeek`·`#btnGoalPeriodMonth`(onclick=`switchGoalStatPeriod`)

## 1. [원칙 ①] 문제를 정확히 파악한다

- B2(#885)까지 등록 기관은 값을 보관만 했다. 옛 배선(가져오기 `var X = _kit.X` → 통로 getter → `window.X = X`)을 지우면 그 이름은 통로와 window 에서 사라진다. 지우기 전에 누군가가 같은 값을 같은 이름으로 내주고 있어야 한다 — 그것이 own 이다.
- 법정의 철거 대조(`court/lib/preserve-source.js` `recomputeSplit`)는 철거 PR 에서 `index.html` 과 설정 `cells` 의 파일 말고 `js/**` 변경을 거부한다. 그래서 own 은 철거보다 **먼저, 따로** 병합돼 있어야 한다(설계 3.1 [개정]).
- 위험은 시점이다. window 이름 199개 가운데 13개는 IIFE 밖 파일도 같은 이름을 대입한다. 지금은 맨 뒤의 IIFE 가 다시 덮어 이긴다. 기관이 세포 로드 때 바로 대입하면 뒤에 로드되는 파일이 이겨 승자가 뒤집힌다(재측정: `reports/TASK-ES-614/overlap-names.json` — 겹침 13 · 등록된 것 7 · commit 시점에 이미 다른 값이 들어 있던 이름 6).
- 완료는 「own 을 켠 뒤에도, 그리고 옛 배선을 지운 뒤에도 이름마다 값이 같고 앱이 같게 돈다」를 측정으로 보이는 것이다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 이름을 내주는 주인을 index.html 에서 세포(등록 기관)로 옮긴다. 값은 그대로, 주인만 바뀐다.
- **원인**: 옛 배선은 세포 → index.html → 세포로 한 바퀴 도는 중계였다. 중계를 없애려면 세포 쪽에서 직접 내주는 길이 먼저 서 있어야 한다.
- **중심**: `OurgoalCellRegistry.commit()` 한 번. 바깥 스크립트가 전부 로드된 뒤 — IIFE 바로 앞 — 에 등록된 이름을 통로와 window 에 놓는다. 그 뒤 IIFE 가 옛 배선으로 같은 이름을 같은 값으로 다시 놓는다(이중 노출, 값 동일). 철거 뒤에는 commit 이 놓은 값이 그대로 남는다.
- **핵심**: 증명은 「지금 통과한다」가 아니라 「옛 배선을 지운 사본에서도 통과한다」여야 한다. own 을 켠 트리는 IIFE 가 다시 덮으므로, own 이 틀려도 지금은 티가 나지 않는다. 그래서 모의 철거 사본과 대조군(commit 태그만 뺀 사본)을 함께 쟀다.

## 3. [원칙 ③] 해결 방식

1. **등록 기관**(`js/core/cell-registry.js`): `provide` 는 지금처럼 보관만 한다. `commit()` 이 등록 순서대로 — 통로에는 세포(owner)마다 `OurgoalAppScope.expose(owner, …)` 로 **다시 쓸 수 없는 값 속성**을(함수를 getter 로 감싸지 않는다 — 설계 3.1. 옛 getter 전용 노출처럼 엄격 모드 대입은 오류), window 에는 `opts.window` 이름을 대입한다. 한 번만 돈다. commit 뒤의 등록은 내주지 않고 `lateProvides` 에 기록만 한다. `mode(name)` 은 실제로 내준 이름에 `own`. commit 전 `mode(name, 'compare')` 로 이름을 own 에서 뺄 수 있다(이번에 뺀 이름 0).
2. **commit 태그**: `js/core/cell-registry-commit.js` 를 IIFE 바로 앞 태그 줄 끝에 같은 줄로 붙였다(순증가 0 · 인라인 스크립트 추가 0 · 새 전역 0). commit 과 IIFE 사이 태그 0.
3. **window 에만 나가던 이름**: B2 는 통로 이름과 window 이름을 한 값 지도에 등록했다. 그대로 own 을 켜면 통로 getter 가 없던 84개가 통로에 새로 생긴다(초과). 그래서 세포의 등록 블록이 `windowOnly` 에 그 이름을 적게 했다 — 생성기(`gen-cell-provide.js`)가 43개 파일의 블록을 다시 냈다(블록 밖 글자 0 변경).
4. **탐침**: `--names-from`(철거 전 결과 파일의 통로·window 이름 목록을 고정 입력으로)과 `--fingerprints`(이름마다 통로 값·window 값의 지문 — 함수는 이름·인자 수·글자 해시)를 더했다. 서로 다른 트리(기준·작업·모의 철거)의 값을 이름 단위로 맞댄다.
5. **전 키트 모의 철거**(`reports/TASK-ES-614/mock-unwire.cjs`): 저장소 밖 사본의 index.html 에 **현행 생성기 unwire 를 그대로**(변경 0) 키트마다 1차(세 종류 모두)·2차(가져오기 줄은 남기고 getter·window 줄만) 돌린다. names 는 등록된 이름뿐이다. 생성기가 멈추면 그 이름을 빼고 사유를 적는다.
6. **시험이 붙잡는 이름**(`pinned-names.cjs`): 시험 소스에 배선 글자(`window.N = …` 등)가 있는 이름을 찾아 철거 계획에서 뺀다. 시험은 고치지 않는다(DIR-004 (다)).

## 4. [원칙 ④] 재검토 (반례·부작용)

- **commit 시점에 다른 값이 들어 있던 이름 6개**(`toast` — 요소 id 로 잡히는 DOM 요소 · `collapseAllTeamGoalAccordions` · `copyUserGoalTemplate` · `openGoalTemplateEncyclopediaModal` · `toggleFeedPostPreview` · `collapseAllSettingsSections` — 뒤 다섯은 `js/components.js` 가 대입): commit 이 등록 값으로 덮는다. 지금까지 IIFE 가 덮던 것과 승자가 같다. 세 트리의 window 값 지문이 199개 모두 같다(차이 0).
- **통로 속성이 getter 에서 값 속성으로 바뀐다**: 읽기는 같다. 대입은 둘 다 엄격 모드에서 오류다(getter 전용 / 다시 쓸 수 없는 속성). 다시 대입되는 상태(setter 가 달린 이름 30개)는 등록되지 않았으므로 이 PR 과 무관하다(B9 몫).
- **IIFE 가 가져온 뒤 다시 대입하는 이름이 있으면** 옛 getter 는 새 값을, own 은 등록 때 값을 돌려준다 → unwire 의 안전 검사(지운 줄 밖에 참조·대입이 남으면 정지)가 그런 이름의 가져오기 줄을 지우지 못하게 막고, 대조(불일치 0)와 지문(차이 0)이 값이 같음을 보인다.
- **지금 통과하는 것이 own 의 증거가 아니다**(IIFE 가 다시 덮는다) → 모의 철거 사본에서 재고, 대조군으로 commit 태그만 뺀 사본을 쟀다: 부팅 실패(`TypeError: L.pad is not a function`). own 적용이 실제로 이름을 내주고 있다.
- **철거 뒤 탐침이 지운 이름을 검사에서 빠뜨린다** → `--names-from` 으로 철거 전 목록을 고정했다(모의 철거 사본의 IIFE 에 남은 window 이름은 28개지만 199개를 전부 검사).
- **defer/async 와 IIFE 뒤 스크립트**: defer/async 는 `/ui.js`·구글 GSI 둘, IIFE 뒤 인라인은 6237행 ESC 처리기 하나. 글자 조사에서 commit 뒤에 window 199개 이름을 대입하는 파일 0(`overlap-names.json` `assignedAfterCommit`).
- **서비스워커 캐시**: `sw.js` 의 미리 담는 목록은 `['/']` 뿐이다. 새 파일을 목록에 넣지 않았고 넣을 필요도 없다. 옛 index.html 캐시와 새 js 가 섞이는 경우(옛 index.html 에는 commit 태그가 없다)는 own 이 돌지 않을 뿐 옛 배선이 그대로 있어 동작한다. 실제 서비스워커 갱신 동작은 측정불가(이 PR 의 범위 밖).
- **등록 블록 머리 주석의 「대조(compare) 전용」 문구**: 블록 표지 글자를 바꾸면 세포 167개가 한 줄씩 더 바뀐다. 블록 자신은 지금도 등록만 한다(내주는 것은 기관). 표지는 그대로 두었다.
- **gen-cell-provide.js 는 index.html 의 배선을 읽어 등록 대상을 정한다** → 철거 뒤에 `--write` 로 다시 돌리면 지운 이름의 등록이 사라진다. 철거가 시작되면 이 생성기를 다시 돌리지 않거나, 계획 파일을 입력으로 받게 고친 뒤에 돌려야 한다(보고).

## 5. [원칙 ⑤] 절차

1. 통로 기관(`app-scope.js`)·등록 기관·탐침·B2 산출물·법정 재생성 경로 정독 → 작업계획서(`.claude/plan-TASK-ES-614.md`, 커밋 안 함).
2. 등록 기관 own(commit) 구현 → commit 파일 → index.html 태그(같은 줄) → 생성기 `windowOnly` → 등록 블록 재생성(멱등 확인) → 신고서(`module-specs --write`)·세포 설명 → `module-guard`.
3. 탐침 옵션 → 작업 트리 대조 → 기준 worktree(저장소 밖)·모의 철거 사본(저장소 밖) 생성.
4. 모의 철거(전부) → npm test 경로와 시험 파일 전부를 따로 실행해 깨지는 검사 수집 → 시험이 붙잡는 이름 목록 → 그 이름을 뺀 모의 철거 → 사본에서 대조·시나리오·module-load·시험 전부.
5. 대조군(commit 태그 제거) · 겹침 이름 재측정.
6. origin/main 합침 → npm test 기준/작업 전경 실행 → `measure-b3a.cjs` → 주장 파일 → `verify-integrity-gate` → 커밋 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「own 을 이름 단위로 조금씩 켜야 안전하다(키트마다 own PR 하나)」** → PR 이 두 배(키트 13종 × 2)가 되고, 켜는 순간의 위험은 「값이 같은가·시점이 같은가」로 이름 수와 무관하다. 438개 전부를 한 번에 켜되, 438개 전부를 모의 철거 사본에서 이름 단위로 대조했다(불일치 0 · 지문 차이 0). 어긋나는 이름이 나오면 `mode(name, 'compare')` 로 빼는 길을 남겼다(이번에 뺀 이름 0).
- **반론 2 「세포가 provide 할 때 바로 내주면 commit 파일이 필요 없다」** → 겹침 이름 13개 중 5개를 세포보다 뒤에 로드되는 `js/components.js` 가 다시 대입한다. 바로 내주면 철거 뒤 그 5개의 승자가 등록 값에서 components.js 값으로 뒤집힌다(commit 시점에 실제로 다른 값이 들어 있었다 — `report.commit.windowBefore.different`). commit 을 맨 뒤에 두는 것이 지금의 승자를 보존한다.
- **재검증**: 주장 배치. B1·B2 에서 보존 주장(화면 시나리오)에 법정이 「분열 증거 검증 미달: 증명 파일 지정 누락」을 찍었다 — 이 PR 은 생성기 재실행으로 증명되는 꼴이 아니므로(손으로 쓴 기관 코드) 증명 파일을 지정할 수 없다. 그래서 R1 에는 화면 시나리오 주장(C1·C2)과 함께, 법정이 글자로 잴 수 있는 기록 주장(module-load 회귀 0 · 새 전역 0 · 순증가 0)을 둔다(B1·B2 와 같은 배치). 법정이 R1 을 「글자만 확인」으로 찍더라도 그것은 **법정이 화면 동작을 다시 재었다는 뜻이 아니다** — 화면 동작과 모의 철거는 작업자 측정이다.
- **재검증**: 모의 철거의 names 가 「지금 지울 수 있는 것 전부」인가 → 생성기 자신의 정지 조건으로 걸렀다(내 분류가 틀리면 생성기가 멈춘다). 생성기가 멈춘 이름 4개(`defaultProfile`·`loadProfile`·`saveProfile`·`setTab` — 한 줄을 나눠 쓰는 window 대입, 설계 5.2 X3)와 kitVar 꼴 때문에 못 돈 손잡이 2종(`_ui` 2개·`_xp` 7개 이름 — X1)은 계획 파일에 사유와 함께 남겼다. 생성기는 고치지 않았다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-614/` 아래. 수치는 `measurement.json` 이 각 결과 파일에서 읽어 모은 것이다.

| 파일 | 무엇 |
|---|---|
| `cell-registry-compare.json` | 작업 트리 대조(own): 등록 438 · own 438(통로 354 · window 180) · 대조 534 · 불일치 0 · 초과 0 · 이중 등록 0 · 누락 88(B2 와 같음 — IIFE 소유 84 + 건너뜀 4) · 예외 0 |
| `cell-registry-compare.base.json` | 기준 트리 대조(compare) — 지문 맞대기용 |
| `cell-registry-compare.mock.json` | 모의 철거 사본 대조(이름 목록 = 작업 트리 결과로 고정): 불일치 0 · 통로에서 사라진 이름 0 · 생긴 이름 0 · 예외 0 |
| `cell-registry-compare.mock-without-commit.json` | 대조군 — 같은 사본에서 commit 태그만 뺌: 게스트 부팅 실패 |
| `overlap-names.json` | 겹침 이름 13개 표(대입 파일·시점·commit 때 다른 값 여부·세 트리 지문) |
| `mock-unwire-all.json` · `tests-mock-all.json` | 제외 없이 전부 모의 철거(985줄 · 이름 425) → 그 사본에서 깨지는 검사(smoke-test 25 · verify-integrity-gate 1 · 기준에서는 통과하던 시험 파일 10) |
| `pinned-names.json` | 시험 소스에 배선 글자가 있는 이름 42개(파일별 걸린 수) |
| `mock-unwire-plan-run.json` · `unwire-plan.json` | 그 42개를 뺀 모의 철거(845줄 · 이름 383 · 실행 16) = 철거 계획(B3~B8 입력) |
| `tests-base.json` · `tests-mock.json` | npm test 경로 4개 스크립트와 tests/ 의 시험 파일 113개를 따로 실행 — 기준과 계획 사본의 종료 코드가 전부 같다(사본에서만 실패 0) |
| `scenario-local.json` · `scenario-mock.json` | 시나리오 2개 — 기준 대 작업, 기준 대 모의 철거 사본 |
| `module-load.json` | 법정 모듈 로드 탐침과 같은 비교(기준 대 작업 · 기준 대 사본) + 바뀐 js 44개·새 파일 1개 단독 로드 |
| `npm-test-compare.json` · `raw/` | npm test 기준/작업 전경 실행 로그와 비교 |
| `measurement.json` | 위 전부의 요약과 명령·종료 코드 |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상했고 실제로 만난 것**: 시험이 배선 글자를 단언한다 — 전부 철거하면 smoke-test 25건·무결성 게이트 1건(금고 파일)·시험 파일 10개가 깨진다. 시험을 고치지 않고 그 이름 42개를 철거 계획에서 뺐다(넓게 잡은 목록 — 글자가 있다고 반드시 깨지는 것은 아니다. 좁히는 것은 시험 변경 결심 때의 일이다).
- **예상했고 실제로 만난 것**: 법정은 PR 하나에 생성기를 한 번만 돌린다 → 키트 하나에 1차(세 종류)와 2차(가져오기 줄 남김)가 따로라 철거 계획이 실행 16개다. PR 수를 줄이려면 생성기가 한 설정에서 여러 실행을 받게 해야 하는데, 그것은 생성기 변경이라 이 PR 에서 하지 않았다(보고).
- **측정불가**: 로그인 뒤 화면에서의 값(게스트 부팅 직후 한 시점만 대조) · 서비스워커 갱신 중 동작 · 로드 중 호출 순서(`callOrder` — note 기록 없음) · 운영 환경.
- **성과 측정**: 이 PR 뒤 인라인 줄 수는 그대로다(4,003 = 4,003, 실제 철거 0). 성과는 다음 PR 들에서 잰다 — 철거 계획대로면 4,003 → 3,158(모의 철거 사본의 `module-metrics` 값, 845줄).
