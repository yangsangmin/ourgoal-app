# REQ — #TASK-ES-637 미분화 덩어리 해체 상태 이전 1차: 통로에 노출된 상태 이름 49개의 소유를 상태 기관으로

- Task ID: **TASK-ES-637** (L012: 오케스트레이터가 번호를 배정했고, `gh pr list --state all` · `git ls-remote origin` 에서 637 이 비어 있음을 다시 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-637-unstate-1` 을 먼저 push 해 선점했다.)
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「배선 철거」 유형의 상태 판**. 작업참고(기준 PR #908, 5e2fc92c, 경험칙 90개). 철거 선례 #891·#894·#896·#898·#902·#904·#907(일곱 다 R1 동작 보존 확인)의 절차를 그대로 따른다 — 적용 → 측정 → 주장을 실행기 하나로(L072) · 기준선 기록(L071) · 되짚기(L075) · push 전 로컬 법정 전체 실행(L070·L088). 새로운 점은 생성기 **unstate** 모드(#TASK-ES-634, 닫힌 목록 X4·X5·X6)의 첫 실사용이다. 그래서 「지운 줄」뿐 아니라 「바꿔 쓴 줄」도 되짚기로 글자 단위까지 확인하고, 값 요약만으로 같다고 하지 않고 쓰기 왕복 · window 복사 동일성 · 화면 시나리오를 더해 쟀다(L092).
- 기준 main 9022e383(#909 상태 기관 `js/core/app-state.js` + 로드 줄 병합 뒤). 지시함(origin/main) 열린 지시: **DIR-003**(B 트랙 B9 — 상태 · 철거 PR 마다 기준선에 inlineScriptLines 기록) · **DIR-004**((가) 생성기 줄 종류 닫힌 목록 U1~U3 · X1~X9).
- **상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d — 글자 그대로)**
  1. 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마. 지침이나 결심이 필요한점?」
  2. 「결심필요 4번 빼고 모두 권장안대로 진행하고 4번은 자세히 설명해봐 어떤 함수인지 어떤 기능을 하던건지 자세히, 어떻게 진행하는게 좋을지, 권장안이 뭔지」 — 결심 표 묶음 1(상태 변수의 소유를 상태 기관으로 — 닫힌 목록 X4~X6)이 이 PR 이 쓰는 줄 종류다.
- 설계 정본: `docs/architecture/CELL-REGISTRY-DESIGN.md` 3.3(상태 기관 계약 · 구현 기록) · 4절 「배선 철거」 증명 하한 · 5.5(X4·X5·X6). 입력: `reports/TASK-ES-636/unstate-plan.json`(#909 가 남긴 계획 — 대상 49 · 제외 1).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 원문의 어느 문장 | 완료 기준 |
|---|---|---|---|
| R1 | index.html 인라인 IIFE 에서 통로에 노출된 상태 이름 49개의 소유를 상태 기관(`js/core/app-state.js`)으로 옮긴다 — 생성기 unstate 한 번(손 편집 0). 앱 동작은 그대로다 | 원문 1 「남은 미분화작업 모두 진행」 · DIR-003(B9) | 게스트 화면 시나리오 넷이 기준·작업 양쪽에서 통과 · 법정의 생성기 재실행 결과와 index.html 이 바이트 동일 |
| R2 | 옮긴 이름은 상태 기관이 같은 값 · 같은 종류의 접근자로 통로에 내준다 | 설계 3.3 계약 | 통로에 노출된 상태 이름 63개 전부의 값 요약 · 접근자 종류 · window 복사 동일성 · 쓰기 왕복이 기준과 다른 이름 0(본질 변동 제외) · 기관이 맡은 이름 = 설정의 49개 · 통로에서 사라진 이름 0 |
| R3 | 지우고 바꿔 쓰는 대상은 닫힌 목록 X4·X5·X6 의 줄뿐 · names 밖 이름 · 함수 본문 · 그 밖의 글자 불변 · 바뀐 제품 파일은 index.html 하나 | 원문 2(결심 묶음 1) · DIR-004 (가) | 기준 index.html 에 생성기 기록을 되짚어 만든 결과 == 작업 index.html · 종류 밖 삭제 줄 0 · names 밖 이름 0 |
| R4 | 증명 하한과 기준선 기록 | 설계 4절 「배선 철거」 · DIR-003 | inlineScriptLines 감소와 `module-guard --update` 기록 · 모듈 로드 새 회귀 0 · npm test 기준/작업 ✓ 줄 · ok 줄 수 동일 · 폐기 0 · 무결성 게이트 38/38 · tests/ · 금고 · 생성기 · 상태 기관 변경 0 |
| R5 | 남은 상태 이름을 풀리는 조건별로 다시 재서 남긴다 | 오케스트레이터 지시 | `reports/TASK-ES-637/remaining-state.json` |

- 원문에 있는데 이 PR 항목에 없는 요구(목표 줄에 남긴다): 「남은 미분화작업 모두」 가운데 남은 상태 이름 31개(생성기가 멈춘 13 · 시험이 붙잡는 1 · 통로에 노출되지 않은 17), 가져오기 줄 · 함수 · 로드 중 문의 이전(감싸기 · sweep · finalize)은 이 PR 에 없다. 「병합도 스스로」 — 이 PR 의 병합은 판정을 받은 뒤 오케스트레이터가 위임 병합 기준으로 한다(이 작업자는 병합하지 않는다).

### 구체 식별자

- 고친 제품 파일: `index.html` 하나(+53 −124). 내용은 셋뿐이다 — ① `window.OurgoalAppScope.expose('index.html', { get X(){ return X; }, set X(v){ X = v; }, … })` 의 대상 이름 속성 49줄과, 속성이 모두 지워진 expose 문 11개의 머리·꼬리 22줄을 **지움**(71줄) · 뒤 속성이 지워져 줄 끝 쉼표를 뗀 2줄 ② 선언문 49개 `var X = 초기값;` 을 `window.OurgoalAppState.define('X', 초기값);`(읽기 전용 27) · `window.OurgoalAppState.defineVar('X', 초기값);`(읽기쓰기 22)로 **바꿔 씀** — 자리와 초기값 글자는 그대로(여러 줄 선언은 `THEMES` 하나: 머리 줄과 끝 줄 `];` → `]);`) ③ window 복사 1줄 `window.THEMES = THEMES;` → `window.THEMES = window.OurgoalAppScope.scope.THEMES;`
- 옮긴 이름(전체 목록은 `reports/TASK-ES-637/proof.json` `unstate.names`): 읽기 전용 27 — `THEMES`(배열) · `checkAndHandlePeerInviteUrl`(함수) 과 화면 요소 참조 25개(`navButtons` · `screens` · `liveMeta` · `liveCount` · `capInput` 등 — 탐침 값 요약의 종류가 element · nodelist) / 읽기쓰기 22 — `toastTimer` · `_pendingAuthSession` · `__avatarGreetTimer` · `_promptTabState` · `_googleTokenClient` · `_googleOneTapNonce` · `googleTokenClient` · `_modalHistoryPushed` · `_modalDismissGraceUntil` · `focusTimerInterval` · `focusTimerSeconds` · `focusTimerRunning` · `_tplActiveTab` · `_tplAiCurCat` · `REALTIME_CHANNELS_SETUP` · `_cachedSignedCalendarToken` · `SHARED_GROUPS_LOADED` · `REAL_MANITO_PARTNERS_CACHE` · `REAL_MANITO_INBOX_CACHE` · `MANITO_SERVER_LOADED` · `_lastObservedDateKey` · `_isEnteringApp`
- 새 도구(제품 코드 아님): `reports/TASK-ES-637/unstate-run.cjs`(상태 이전 실행기 — `apply` · `measure` · `claims`, 철거 실행기 `unwire-run.js` 와 같은 꼴). 다시 쓴 도구: `reports/TASK-ES-636/state-probe.cjs` · `reports/TASK-ES-614/run-tests-each.cjs` · `scripts/probes/cell-registry-compare.js` · `docs/design/harness/module-split/scenario-local-z56.js`
- 기록: `docs/architecture/module-baseline.json`(`module-guard --update` 가 57번째 항목을 더함) · `docs/rules/TICKETS.md` · `reports/TASK-ES-637/`
- 손대지 않은 것: `js/**` 전부(`js/core/app-state.js` · `js/core/app-scope.js` 포함) · 생성기 `gen-inline-hard.js` · tests/ · 금고 · 생성 지도 3종(L009)
- 화면 식별자(시나리오): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnGoalsSubPersonal` · `#btnGoalsSubRoutine` · `#btnGoalsSubStats` · `#btnGoalsSubTeam` · `#btnGoalPeriodWeek` · `#btnGoalPeriodMonth` · `#homeAddGoal` · `#ngCancelBtn` · `#sanctuaryBellBtn` · `#closeNotifCenterBtn`. 탐침의 보조 조작: `#captureInput` · `#captureCharCount`

## 1. [원칙 ①] 문제를 정확히 파악한다

- #909 뒤 index.html 인라인 줄 수는 2,989(module-metrics, 기준 9022e383)다. 인라인 IIFE 에는 상태 이름(키트 손잡이 · 가져오기를 뺀 최상위 `var`)이 80개 있고, 그중 63개가 통로에 getter/setter 줄로 노출돼 있다 — 다른 세포가 `L.X` 로 읽고 쓰기 위한 중계 줄이다.
- 상태 기관은 #909 로 이미 들어와 있지만 아직 아무도 부르지 않는다. 이 PR 이 처음으로 실제 이름을 기관에 맡긴다.
- 법정은 기준 커밋의 생성기로 설정을 다시 돌려 `index.html` 을 바이트 대조하고, 그 밖의 `js/**` 변경은 받지 않는다. 그래서 이 PR 의 제품 변경은 index.html 하나여야 한다(기관 · 생성기는 앞선 PR 에서 병합됨).

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 상태 하나에 주인 하나. 값은 기관이 보관하고, 통로의 접근자도 기관이 단다. index.html 에는 「이 자리에서 이 초기값으로 만든다」는 한 줄만 남는다.
- **원인**: 상태가 IIFE 지역 변수여서, 통로에 내주려면 이름마다 getter(와 setter) 줄이 index.html 에 있어야 했다.
- **중심**: 생성기 unstate 한 번, 설정 `reports/TASK-ES-637/proof.json`(`unstate.names` 49개 · cells `js/core/app-state.js`).
- **핵심**: 지역 변수가 사라지므로 「IIFE 안에서 그 이름을 맨이름으로 쓰는 곳이 0」인 이름만 옮길 수 있다. 그 판단은 사람이 아니라 생성기가 이름마다 내린다(멈춘 이름 13개는 옮기지 않았다). 그리고 선언문을 **제자리에서** 바꿔 쓰므로 초기값이 계산되는 순서가 그대로다.

## 3. [원칙 ③] 해결 방식

1. 대상을 다시 잰다(main 이 움직였으므로 계획 파일을 그대로 믿지 않는다): 작업 트리 index.html 에서 통로에 노출된 상태 이름 63개를 뽑아 **하나씩** 생성기에 돌린다 → 옮길 수 있는 이름 50 · 생성기가 멈춘 이름 13. 계획(`unstate-plan.json`)과 같다.
2. 시험이 선언 글자를 붙잡는 이름 `_promptEncyclopediaOpen` 을 뺀다(`reports/TASK-ES-636/pinned-state.exclude.json` — 무결성 게이트 23번 검사가 `_promptEncyclopediaOpen = false;` 글자를 본다. 시험은 고치지 않는다) → 49개.
3. `unstate-run.cjs apply` — `proof.json` 을 쓰고 생성기를 작업 트리에 돌린다. `node scripts/module-guard.js --update`.
4. 시나리오 넷(앞선 PR 에서 기준·작업 양쪽 통과가 확인된 단계 그대로) — (가) 게스트 진입 · 인사 팝업 닫기 · 여섯 탭 (나) 목표 하위 탭과 통계 기간 (다) 종 버튼으로 알림 센터 두 번 열고 닫기 · 설정 탭 (라) 「새 목표」 창 열고 취소 · 팀목표 하위 탭. 토스트 조작은 넣지 않았다(L077).
5. `unstate-run.cjs measure` · `claims`.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **옮긴 이름이 통로에서 사라지거나 값이 달라지지 않는가** → 상태 탐침을 기준 2회 · 작업 1회 돌려 63개 이름의 값 요약 · 접근자 종류 · window 값 · 쓰기 왕복을 맞댔다: 다른 이름 0. 기준을 두 번 재도 달라지는 이름은 `state` 하나(옮기지 않은 이름 — 시각이 든 객체)로, 비교에서 뺐다. 등록 기관 대조 탐침도 기준 이름 목록(통로 423)으로 돌려 사라진 이름 0 · 불일치 0 · 지문 차이 0.
- **접근자 종류가 바뀌지 않는가(L047)** → 종류 전이는 넷뿐이다: 읽기 전용 그대로 · 주인만 `index.html` → `core/app-state` 27 / 읽기쓰기 그대로 · 주인만 바뀜 22 / 옮기지 않아 그대로 14(읽기 전용 6 · 읽기쓰기 8). 읽기 전용이 읽기쓰기가 되거나 그 반대인 이름 0.
- **다른 세포가 쓴 값이 실제로 저장되는가** → 쓰기 가능한 이름 30개(옮긴 22 + 남은 8)에 통로로 값을 쓰고 읽어 되돌리는 왕복이 기준 30/30 · 작업 30/30.
- **window 복사** → window 에도 있는 상태 이름 12개 가운데 통로 값과 같은 객체인 것이 기준 11 · 작업 11(다른 하나 `checkAndHandlePeerInviteUrl` 은 기준에서도 다르다 — window 쪽은 다른 파일이 단 함수). `window.THEMES` 는 이제 통로 값을 읽어 복사하고, 같은 객체다.
- **IIFE 안 코드가 그 이름을 아직 쓰는데 지역 변수를 없앤 것은 아닌가** → 생성기가 이름마다 남은 맨이름 참조를 세어 하나라도 있으면 멈춘다(실제로 7개가 그 사유로 멈춤). 게스트 부팅 예외 0 · 콘솔 오류 0(기준도 0).
- **초기값 계산 순서** → 선언문은 자리를 옮기지 않았다. 되짚기가 「바뀐 줄 번호 = 선언 머리 · 선언 끝 · window 복사 줄」임을 확인한다.
- **허용 종류 밖의 줄** → 지운 71줄은 전부 대상 이름의 `return X;` · `X = v;` 꼴 속성 줄과 빈 expose 문 껍데기다(밖 0). names 밖 이름 0.

## 5. [원칙 ⑤] 절차

1. origin/main 기준 worktree · 번호 선점 · `npm ci --ignore-scripts`.
2. 실행기 작성 → `apply`(대상 다시 재기 포함) → `module-guard --update`.
3. 시나리오 작성 → npm test 기준/작업 전경 실행 · 시험 하나씩 기준/작업 → `measure`.
4. REQ · 작업표 → npm test 작업 트리 다시(문서를 다 쓴 뒤 — L064) → `measure` · `claims`.
5. `verify-integrity-gate` → 커밋 → `recomputeSplit` 직접 호출과 로컬 법정 전체 실행(실제 커밋 대상) → origin/main 확인(움직였으면 합치고 생성기를 다시 돌려 다시 잰다 — L049·L089) → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「DOM 참조(`navButtons` · `capInput` 같은 것)는 상태가 아니니 기관에 넣지 말아야 한다」** → 통로에 getter 로 노출돼 있다는 것은 다른 세포가 그 값을 읽는다는 뜻이고, 그 중계 줄을 없애는 길은 닫힌 목록에 X4·X5 하나뿐이다. 기관은 값을 복사하지 않고 그대로 보관한다(같은 요소 객체 — 값 요약의 `태그#id.class` 가 기준과 같다). 통로에 노출되지 않은 DOM 참조 13개는 기관 대상이 아니어서 건드리지 않았다.
- **반론 2 「값 요약이 같다고 동작이 같은 것은 아니다」** → 맞다(L092). 그래서 값 요약에 쓰기 왕복 · window 복사 동일성 · 화면 시나리오 넷 · npm test 를 더했고, 그래도 못 잰 범위는 8절에 측정불가로 적었다.
- **반론 3 「계획 파일이 있으니 다시 잴 필요가 없다」** → 계획은 5e2fc92c 에서 잰 것이고 그 뒤 #909 로 index.html 이 바뀌었다. 다시 재서 같은 49개가 나옴을 확인했다(옮길 수 있음 50 · 멈춤 13 · 제외 1).
- **재검증(되짚기)**: 기준 index.html 5,259줄에서 생성기가 적어 낸 71줄을 빼고, 쉼표 2글자를 떼고, 선언 머리 49 · 선언 끝 49 · window 복사 1 을 정해진 글자로 바꿔 쓴 결과가 작업 index.html 5,188줄과 글자 그대로 같다. 바뀐 줄 번호 51개(머리와 끝이 같은 줄인 선언 48 + `THEMES` 머리·끝 2 + window 복사 1)는 생성기 기록과 같다.
- **재검증(시험 전부)**: npm test 의 스크립트 넷과 `tests/*.test.js` 114개를 하나씩 따로 돌린 결과가 기준과 같다(실패 집합 26 = 26, 꼬리 글자 동일, 작업에서만 깨진 것 0). 새로 시험에 붙잡힌 이름이 없다는 뜻이다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-637/` 아래. 수치는 `measurement.json` · `remaining-state.json` 이 각 결과에서 읽어 모은 것이다(L002).

| 파일 | 무엇 |
|---|---|
| `proof.json` | 생성기 설정: `mode:"unstate"` · `unstate.names` 49개 · cells `js/core/app-state.js` |
| `unstate-meta.json` | 생성기 산출 — 이름별 define/defineVar(27 · 22) · 지운 줄 71(속성 49 · 빈 expose 문 11개) · 쉼표 2 · 바뀐 줄 51 · index.html 5259 → 5188줄 · 옮길 수 있음 50 · 멈춤 13(생성기 원문 사유) · 제외 1 · 노출 안 됨 17 |
| `state-probe.base.json` · `.base2.json` · `.work.json` · `probe-names.json` | 상태 탐침: 이름 63개 · 차이 0(본질 변동 `state` 제외) · 기관 이름 49 = 설정 · 쓰기 왕복 30/30 · window 복사 동일 11/12(기준과 같음) · 부팅 예외 0 |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 등록 기관 대조: 불일치 0 · 통로에서 사라진 이름 0 · 지문 차이 0 |
| `scenario-local.json` | 시나리오 4개 기준·작업 통과(비공허 단언 13 · 10 · 9 · 6), 예외 0/0 |
| `module-load.json` | 새 회귀 0 |
| `npm-test-compare.json` · `raw/` | npm test 기준/작업 종료 코드 · ✓ 줄 · ok 줄 수 · 요약 비교 |
| `tests-base.json` · `tests-work.json` | 시험 하나씩: 스크립트 4개 같음 · 시험 파일 114개 실패 집합 같음 |
| `measurement.json` | 위 전부 + 제품 파일 = index.html 하나 · 되짚기 결과 == 작업 index.html · inlineScriptLines 2989 → 2918(−71 = 지운 줄 수) · 기준선 마지막 기록 = 측정값 · module-guard 종료 0 · 무결성 게이트 38/38 |
| `remaining-state.json` | 남은 상태 이름 31개를 풀리는 조건별로(아래 표) |
| `claims.json` | 주장(보존 4 + 기록 27) |
| `court-local.json` | 로컬 법정 전체 실행 요약(작업자 PC — 판정 아님) |

### 남은 상태 이름 31개 — 풀리는 조건별

| 조건 | 수 | 이름 | 무엇이 되면 풀리는가 |
|---|---|---|---|
| 맨이름 참조가 남음 | 7 | `sb` · `state` · `pendingCapturePhoto` · `capturePhotoInput` · `capturePhotoPreview` · `USER_SESSION_CHANNEL` · `MOCK_GROUPS` | 그 이름을 맨이름으로 쓰는 IIFE 안 코드(함수 본문 · 로드 중 문)가 세포로 옮겨져 통로로 읽게 되면 — 함수 이전 · 구역 감싸기 뒤 unstate 로 다시 |
| 같은 이름의 선언이 둘 | 2 | `_subtabTplCat` · `_subtabTplQuery` | 겹친 선언을 하나로 줄이는 선행 PR(동작 주장이 따로 필요) 뒤 |
| 선언문이 다른 글자와 한 줄을 나눠 씀 | 3 | `_subtabTplDomain` · `_subtabTplType` · `FEED_POSTS_CACHE` | 줄을 나누는 선행 PR(글자 이동만) 뒤, 또는 닫힌 목록을 넓히는 결심 |
| window 복사 줄이 다른 글자와 한 줄을 나눠 씀 | 1 | `shareContent` | 줄을 나누는 선행 PR 뒤, 또는 X6 의 정지 조건을 넓히는 결심 |
| 시험이 상태 선언 글자를 붙잡음 | 1 | `_promptEncyclopediaOpen` | 무결성 게이트 23번 단언을 고치는 결심(금고 · 기준 시험지) 뒤. 시험은 고치지 않았다 |
| 통로에 노출되지 않음 | 17 | DOM 참조 13 · `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `OURGOAL_CONFIG` · `requestClaudeFeedback` | 상태 기관 대상이 아니다. 그 값을 쓰는 로드 중 문과 함께 구역 감싸기(region, X7)로 세포 함수의 지역 변수가 된다 |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: unstate 의 첫 실사용이라 법정의 생성기 재실행 대조에서 어긋날 수 있다 → push 전 `recomputeSplit` 직접 호출과 로컬 법정 전체 실행(실제 커밋 대상, 의존성이 있는 이 작업 폴더를 `--repo` 로 — L088).
- **예상**: index.html 을 고치는 다른 PR(감싸기 이전 #TASK-ES-638)이 먼저 병합되면 → main 을 합치고 같은 설정으로 생성기를 다시 돌려 다시 잰다(L049). 줄 번호가 든 기록(`unstate-meta.json`)은 그때 다시 만들어진다.
- **예상**: 시험이 새로 붙잡는 이름이 생겼을 수 있다 → 시험 하나씩 결과를 기준과 맞대 확인(작업에서만 깨진 것 0).
- **측정불가**: 게스트 화면에서 숨겨져 누를 수 없는 진입로(템플릿 백과 · 앱 평가 창 · 집중 타이머 · 타임 트래커 등 옮긴 이름 다수가 쓰이는 화면)와 로그인 뒤 화면(구글 로그인 · 실시간 채널 · 마니또 · 공유 그룹), 운영 환경. 이 이름들은 탐침의 값 요약 · 접근자 종류 · 쓰기 왕복으로만 쟀다.
- **성과 측정**: inlineScriptLines 2989 → 2918(−71, 출처 `measurement.json` `summary.inlineScriptLines`). 인라인 IIFE 의 상태 이름 80 → 31. 통로에 `index.html` 주인으로 노출된 상태 이름 63 → 14.
