# REQ — 미분화 덩어리 해체 B1: 세포 등록 기관(compare) · 대조 탐침 · 생성기 unwire 모드

- Task ID: **TASK-ES-610** (지시 원문 번호 #TASK-ES-600 — **이 번호는 이미 병합된 PR #868 「빠른 체크인 분리」가 쓰고 있고**(reports/TASK-ES-600 존재) #TASK-ES-601~609 도 TICKETS·reports·브랜치에서 사용 중이라(2026-10-11 실측: gh pr list --search · git ls-remote · git ls-tree) DIR-003 「#TASK-ES-600 부터 PR 마다 새 번호」에 따라 빈 번호 610 으로 확정했다 `[기본값]`. 출처: 양비스 부모 작업 TASK-YV-8aa85377-0805-42a0-8e32-d7607aadd39f(작업자, 기준 0ecaf233) → 오케스트레이터 TASK-YV-8aa85377-0805-42a0-8e32-d7607aadd39f-ORCH-c66825121b9a 가 독립 검토 뒤 origin/main a50ce802 기준 새 트리에 다시 적용·재측정해 제출. 연결 기록 reports/TASK-YV-8aa85377-0805-42a0-8e32-d7607aadd39f-ORCH-c66825121b9a/orchestration-link.json)
- 분류: INFRA · 작업 유형(SNOWBOLL 분류): **(다) 탐색 — 새 유형 「새 기관 추가(대조 모드)」**. 가장 가까운 유형은 세포 분열(CELL_SPLIT)과 법정 수리(court 선례 #597·#598)지만, 이 PR 은 함수를 옮기지 않고(토큰 동일 증명이 성립하지 않음) 제품 코드에 **새 파일 하나와 로드 줄 하나**만 더한다. 증명 하한은 설계 문서 4절 「새 기관 추가」 행을 따른다.
- 작업참고 기준 PR #881(f40ba86a, 오케스트레이터 재측정 시점) · 부모 작업자 기준 PR #873(0ecaf233) · 이 PR 의 기준 main a50ce802293b4f18ecf6e87840d83f889ac4a3a9 · 지시함(origin/main) 열린 지시: **DIR-003**(미분화 덩어리 해체 B 트랙 착수, PR #874 병합 93b6c126) — 이 PR 이 그 B1 이다.
- 결심 근거: 상민님이 2026-10-10 커맨드센터 세션(ff2b0d64)에서 docs/architecture/CELL-REGISTRY-DESIGN.md 8절의 **결심 ⑤(생성기에 「배선 철거 모드」 추가)** 와 **③(IIFE 머리 기관화를 B 트랙으로 대체)** 에 「허용」. 허용 범위는 그 문서 **5절 그대로**(지우는 대상 세 종류 한정). 지시함 DIR-003 등록 PR #874 는 2026-10-10 13:29Z 병합되어(93b6c126) 효력이 있다.
- 설계 정본: docs/architecture/CELL-REGISTRY-DESIGN.md(3.1 등록 기관 · 3.2 대조 탐침 · 4절 증명 하한 · 5절 unwire 사양 · 7절 측정 방법) · docs/specs/MODULE-SPLIT-PROTOCOL.md · docs/architecture/INLINE-HARD-SPLIT-DESIGN.md.

## 0. 요구 (지시 항목)

| ID | 지시 | 완료 기준 |
|---|---|---|
| R1 | `js/core/cell-registry.js` — `OurgoalCellRegistry` (provide · mode · report · note). B1 은 compare 모드만: 등록 값만 보관, `OurgoalAppScope`·window 는 건드리지 않는다. 새 전역은 `OurgoalCellRegistry` 하나. index.html 에는 로드 줄 하나(IIFE 앞, 다른 js/core 기관과 같은 자리)만 더하고 순증가 0 | 게스트 부팅·여섯 탭 시나리오가 기준·작업 양쪽에서 통과(행동이 만든 변화 단언 포함) · module-load 탐침 새 회귀 0 · 새 파일 단독 로드 ok · 전역 1개 |
| R2 | `scripts/probes/cell-registry-compare.js` — 게스트 부팅 뒤 `report()` 를 JSON 으로. 비교 범위 = `OurgoalAppScope.scope` 모든 이름 + index.html window 노출 이름 전부. 함수 `===`, 상태 getter 값 동일, 로드 중 호출 순서 배열. 첫 측정의 불일치·누락 목록을 가공 없이 저장 | `reports/TASK-ES-610/cell-registry-compare.json` 에 scope 이름 수·window 이름 수·불일치 수·누락 수가 숫자로 있다 |
| R3 | `gen-inline-hard.js` 에 `"mode": "unwire"` — 지정 키트(kitVar)의 가져오기 줄 · expose 객체의 해당 getter/setter 속성 · 해당 window 대입 줄, **세 종류만**. names 밖 이름 불변 · 함수 본문 불변 · 그 밖의 글자 불변. B1 은 모드 추가와 단위 시험 증명만(실제 철거는 B3 부터) | 단위 시험 결과 파일 `reports/TASK-ES-610/unwire-unit.json` 의 `ok` 가 true(세 종류 삭제 · names 밖 보존 · 잔존 참조 정지 · 정의문 보호 · 기존 경로 바이트 무변화) |
| R4 | 증명 하한(설계 4절 「새 기관 추가」): npm test 검사 수 동일·폐기 0, inlineScriptLines 가 4,003 에서 늘지 않음, 기존 시험지 수정 0 | `reports/TASK-ES-610/measurement.json` 에 명령·종료 코드·수치가 있고 기준=작업 |

### 구체 식별자

- 새 파일: `js/core/cell-registry.js`(전역 `window.OurgoalCellRegistry` — `provide(owner, values, {window})` · `mode(name[, value])` · `note(owner, name)` · `report({scopeNames, windowNames, callOrder})` · `names()` · `ownerOf(name)`), `scripts/probes/cell-registry-compare.js`, `docs/design/harness/module-split/unwire-check-b1.js`
- 고친 파일: `index.html` 2151행 `<script src="js/core/app-scope.js"></script>` 뒤 같은 줄에 `<script src="js/core/cell-registry.js"></script>`(순증가 0줄) · `docs/design/harness/module-split/gen-inline-hard.js`(`runUnwire()` — `CFG.mode === 'unwire'` 일 때만) · `docs/architecture/modules.json`(세포 `core/cell-registry`, kind organ) · `docs/architecture/cell-descriptions.json`
- 손대지 않은 것: `OurgoalAppScope`(js/core/app-scope.js) · 기존 세포 파일(provide 등록 줄은 B2) · tests/ · 금고(court/** 등) · 생성 지도 3종(L009: module-baseline.json·cell-map.json·inline-script-map.json 은 main 판 그대로)
- 읽기만 한 법정 부품(변경 0): `court/lib/chrome.js` · `court/lib/static-server.js` · `court/lib/site-host.js` · `court/probes/module-load.js` · `court/lib/scenario.js`(docs/design/harness/module-split/scenario-local-z56.js 경유)

## 1. [원칙 ①] 문제를 정확히 파악한다

- index.html 인라인 IIFE 의 남은 줄 대부분은 함수 본문이 아니라 **배선**이다(설계 1절, origin/main 2026-10-10 실측: 키트 가져오기 504줄 — `_settingsKit` 110 · `_goalsKit` 108 · `_uiKit` 101 · `_recordsKit` 94 · `_commKit` 59 …, `OurgoalAppScope.expose` 48회 getter 446·setter 30, window 노출 이름 199개). 「옮기기(CELL_SPLIT)」로는 줄지 않는다.
- 배선을 지우려면 ① 세포가 자기 이름을 스스로 등록하는 기관, ② 옛 경로와 새 경로의 값을 전수 대조하는 탐침, ③ 손이 아니라 생성기로 지우는 철거 모드(법정이 기준 커밋 생성기를 다시 돌려 바이트 대조하므로)가 먼저 있어야 한다. 이 PR(B1)이 그 셋이다.
- 완료는 「동작 변화 0」을 측정으로 보인 것: 게스트 시나리오 기준=작업, module-load 회귀 0, npm test 동일, inlineScriptLines 동일, 새 전역 1.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 세포가 index.html 을 거치지 않고 자기 이름을 내주는 길(등록 기관)을 만들되, 지금은 **대조만** 하고 아무것도 바꾸지 않는다.
- **원인**: 배선은 「세포 → index.html(가져오기) → 세포(통로·window)」로 한 바퀴 돈다. 옮길 원문이 없으니 생성기 옮기기로는 사라지지 않는다.
- **중심**: `OurgoalCellRegistry.report()` 가 이름마다 `===` 로 옛 값과 등록 값을 맞대는 것. B1 의 첫 측정은 등록 0 이므로 「누락 목록 = B2 의 등록 범위」다(scope 423 + window 199 = 622, 출처 `reports/TASK-ES-610/cell-registry-compare.json`).
- **핵심**: unwire 모드는 지우는 대상이 **세 종류뿐**이고(설계 5절 = 상민님 허용 범위), 철거한 이름을 IIFE 안에서 아직 쓰면 멈춘다(ReferenceError 가 될 자리를 생성기가 먼저 잡는다).

## 3. [원칙 ③] 해결 방식

1. 등록 기관(`js/core/cell-registry.js`): compare 전용. `provide` 는 값 보관·이중 등록 기록, `report` 는 scope getter 값·window 값과 `===` 대조, `note` 는 호출 순서 기록(B10 대조 대비). own 모드 요청은 오류로 막는다(B3 부터).
2. 로드 줄: `app-scope.js` 태그 **같은 줄** 뒤에 붙여 index.html 순증가 0(생성기가 세포 태그를 같은 줄에 두는 표준과 같다). 등록 기관이 통로(`OurgoalAppScope`)를 읽으므로 그 뒤에 둔다.
3. 탐침(`scripts/probes/cell-registry-compare.js`): 법정 브라우저 부품(court/lib)을 읽기만 해서 게스트로 진입(`#btnLandingPreviewDirect` → `#btnAvatarGreetClose` → 홈 탭) 뒤 `report()` 를 받는다. window 이름은 설계 7절 방식(@babel/parser 로 IIFE 최상위 `window.X =` 문·대입만 담은 if 블록)으로 센다. 결과는 가공 없이 저장.
4. 생성기 unwire 모드: `CFG.mode === 'unwire'` 면 `runUnwire()` 뒤 바로 끝나 기존 경로는 글자 하나 지나지 않는다. 세 종류만 줄 단위로 지우고, 빈 expose 문·빈 if 블록은 껍데기까지, 새로 마지막이 된 속성의 쉼표만 뗀다. 세포 파일은 쓰지 않는다.
5. 증명: 단위 시험 하네스(저장소 밖 임시 폴더 fixture + 실제 index.html + A1 시범 재생성 바이트 대조) · 게스트 여섯 탭 시나리오 · module-load 탐침 · npm test 기준/작업 · module-metrics.

## 4. [원칙 ④] 재검토 (반례·부작용)

- 등록 기관이 로드될 때 아무것도 만지지 않는가 → 파일에 scope 대입·window 대입이 없다(전역 `OurgoalCellRegistry` 하나만 단다). 단독 로드 탐침 ok, 전역 목록 `["OurgoalCellRegistry"]`.
- 로드 줄을 새 줄로 넣으면 설계 4절 「index.html 순증가 0」을 어긴다 → 같은 줄 덧붙임으로 해결(`git diff --stat index.html` = 1 insertion, 1 deletion).
- unwire 가 `set X(v)` 가 있는 줄을 지우면 그 setter 로 쓰던 세포가 깨진다 → B3 부터 own 모드가 기관에서 setter 를 다시 다는 것이 전제(설계 3.1). B1 은 모드만 더하고 실제 철거 0.
- unwire 가 `window.X = function(){…}` 같은 정의문을 지우면 함수가 사라진다 → 오른쪽이 이름(Identifier)일 때만 지우고 아니면 멈춘다(T4).
- 쉼표 떼기는 「그 밖의 글자 불변」의 예외다 → 문법상 피할 수 없고 단위 시험(T1)이 그 한 글자까지 기대값으로 고정한다.
- 작업번호 충돌(#TASK-ES-600 사용 중) → 남의 보고서를 덮지 않도록 빈 번호 #TASK-ES-610 을 쓴다(L012 — gh pr list --state all · git ls-remote 로 비었음을 확인하고 브랜치를 먼저 push 해 선점).

## 5. [원칙 ⑤] 절차

1. 지시함·작업참고·설계·생성기·법정 재생성 경로 정독 → 작업계획서·연계 기록.
2. `js/core/cell-registry.js` 작성 → `court/probes/module-load.js loadOne` 단독 로드.
3. index.html 로드 줄(같은 줄) → `module-metrics` inlineScriptLines 확인.
4. 탐침 작성 → 작업 트리에서 실행 → `cell-registry-compare.json`.
5. 생성기 unwire 모드 → 단위 시험 하네스 T1~T8 → `unwire-unit.json`.
6. 신고서(`module-specs --write`) · 설명 한 줄 · `module-guard`.
7. 기준 트리(origin/main) 만들기 → 시나리오 로컬 실행(기준·작업) → module-load 비교 → npm test(기준·작업, 전경).
8. claims.json · measurement.json · TICKETS.md · 계획서 갱신 · 연계 sync/check.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- 재검증: 각 단계의 완료 기준을 파일(측정 산출물)로 두고, 보고에는 그 파일의 값만 인용한다. 작업자 측정은 주장이며 판정은 법정만 낸다.
- **반론 1** 「탐침이 등록 0 인 상태에서 불일치 0 을 내는 것은 공허하다」 → 맞다, 그래서 B1 의 주장은 「불일치 0」이 아니라 「측정 결과 파일이 있고 누락 622 가 숫자로 적혀 있다」이며, 그 누락 목록이 B2 의 범위를 정한다(설계 6절). 기관의 대조 논리 자체는 unwire 와 별개로 B2 에서 등록 줄이 들어오면 비로소 뜻을 가진다.
- **반론 2** 「생성기에 모드를 더하면 기존 분열 PR 의 법정 재생성 대조가 깨질 수 있다」 → T8 이 A1 시범 PR(e8c34e42)의 기준 트리에 수정된 생성기를 같은 설정으로 돌려 index.html·세포 2개가 그 커밋 blob 과 바이트 그대로임을 잰다. 분기는 `CFG.mode === 'unwire'` 일 때만 들어가므로 기존 설정(mode 없음)은 기존 경로를 그대로 탄다.
- **반론 3** 「npm test 가 git 추적 파일만 읽는 시험(cell-map-export) 때문에 새 파일이 미추적이면 실패한다」 → 실측에서 그렇게 실패했고, 새 파일을 스테이징하자 17/17 로 돌아왔다. 커밋 뒤에는 추적 상태이므로 법정에서는 문제가 없다. 이 사실을 measurement.json 에 그대로 남긴다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

| 단계 | 산출물 | 측정 |
|---|---|---|
| 등록 기관 | `js/core/cell-registry.js` | 단독 로드 `{"ok":true,"globals":["OurgoalCellRegistry"]}` (court/probes/module-load.js loadOne) · 141줄 |
| 로드 줄 | `index.html` | `git diff --stat` 1 insertion / 1 deletion(순증가 0) · module-metrics inlineScriptLines 4003(기준선 4003) |
| 탐침 | `reports/TASK-ES-610/cell-registry-compare.json` | 값은 그 파일 `counts` 칸(가공 없음) |
| unwire | `reports/TASK-ES-610/unwire-unit.json` | 그 파일 `results[]`·`ok` |
| 신고서 | modules.json · cell-descriptions.json | `module-guard` 종료 0 · `module-specs --check` |
| 시나리오 | `reports/TASK-ES-610/scenario-local.json` | 기준·작업 `passed` |
| module-load | `reports/TASK-ES-610/module-load.json` | `regressions` |
| npm test | `reports/TASK-ES-610/raw/npm-test.*.log` | 종료 코드·검사 수(measurement.json) |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- 예상한 막힘과 실제: ① 작업번호 충돌(예상·실제 발생 → 빈 번호 #TASK-ES-610) ② Chrome 경로(court/lib/chrome.js findChrome 으로 해결) ③ 이 PC 의 `core.autocrlf=true` 가 `git show`·`git archive` 출력을 CRLF 로 바꿔 바이트 대조가 어긋남(예상 못 함 → T8 은 `git cat-file`/`-c core.autocrlf=false -c core.eol=lf` 로 원시 blob 을 읽는다) ④ cell-map-export 시험이 미추적 새 파일에서 실패(예상 못 함 → 스테이징으로 해소, 커밋 뒤에는 무관).
- 성과: 수치는 모두 `reports/TASK-ES-610/measurement.json`·각 결과 파일의 값을 인용한다. 「통과」는 쓰지 않는다 — 작업자 측정이며 판정은 `node court/chat.js <PR>` 만 낸다.
- 다음에 열리는 것: B2(세포별 `provide()` 등록, 누락 0) — 새 작업번호로 다시 지시받는다. 탐침은 `--expect-zero` 로 B2 의 완료 기준을 잰다.

## 9. 오케스트레이터 독립 검토 기록 (TASK-YV-8aa85377-0805-42a0-8e32-d7607aadd39f-ORCH-c66825121b9a · 2026-10-11)

- 검토한 것: 부모 작업자 후보 20개 파일을 지시 원문·CELL-REGISTRY-DESIGN 5절(지우는 대상 세 종류 한정)·승인선 다섯 가지·금고 경로(court/** · .github/** · tests/ 등)와 대조했다. 금고 변경 0 · tests/ 변경 0 · 기존 기능 삭제 0 · 시험 기대값 변경 0 · 새 전역 1(OurgoalCellRegistry).
- 고친 것: ① 작업번호를 TASK-ES-610 으로 확정(claims.json `task` · REQ 파일명 · reports 경로 · TICKETS 한 줄). ② 부모 후보의 TICKETS.md 는 0ecaf233 기준이라 origin/main 에 그 뒤 더해진 #TASK-ES-601·606~609 행을 지우고 있었다 — 그대로 쓰지 않고 origin/main 판에 한 줄만 더했다(삭제 0). ③ 측정 산출물(module-load · 시나리오 · 대조 탐침 · unwire 단위 시험 · npm test 기준/작업 · module-metrics · measurement.json)을 origin/main a50ce802 기준 새 트리에서 전부 다시 돌려 다시 썼다(부모 측정값을 옮겨 적지 않음).
- 고치지 않은 것: 제품 코드(js/core/cell-registry.js · index.html 로드 줄 · 생성기 unwire 모드 · 탐침)는 부모 후보와 바이트 동일(sha256 은 measurement.json `evidence.fileSha256`).
- 판정은 법정이 낸다. 이 절은 검토 기록이지 근거가 아니다.
