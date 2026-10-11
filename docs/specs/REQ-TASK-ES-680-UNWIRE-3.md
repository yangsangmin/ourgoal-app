# REQ — #TASK-ES-680 미분화 덩어리 해체 재철거 3차: 등록 기관이 내주는 이름 58개의 가져오기·getter 줄과 참조 0 손잡이 줄 6개

- Task ID: **TASK-ES-680** (L012: `gh pr list --state all` · `git ls-remote origin` · origin/main 의 작업표에서 680 이 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-680-unwire-3` 를 먼저 push 해 선점했다. 678 · 679 는 다른 작업 몫이다.)
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「배선 철거」**(경험칙 L069 · L072 · L073 · L075 · L102, 선례 #907 · #920 · #943). 실행기 `docs/design/harness/module-split/unwire-run.js`(apply → measure → claims)를 그대로 썼다. 새로운 점은 없다.
- 작업참고 기준 PR #934(d55d7595, 경험칙 115개) · 기준 main d7789c89(#952 상태 이전 4차 병합 뒤 — 오케스트레이터가 #950 · #952 병합을 알린 뒤 그 main 에서 등록 목록 · 모의 · 생성기 실행을 했다).
- 지시함(origin/main) 열린 지시: **DIR-003**(철거 PR 마다 기준선에 inlineScriptLines 기록 — 줄지 않으면 실패) · **DIR-004**((가) 생성기 줄 종류 닫힌 목록 — 이번에 쓰는 것은 U1(가져오기 줄) · U2(expose getter 줄) · X1(`_ui` · `_xp` 손잡이) · X2(손잡이 줄 `dropKitVar`)).
- **상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d — 글자 그대로)**: 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마. 지침이나 결심이 필요한점?」
- 이 작업 세션은 빌더다. 병합은 하지 않는다(오케스트레이터 몫).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

`unwire-run.js claims` 가 주장 파일에 적는 지시 항목(R1~R4)이 정본이다. 요지:

- **R1** index.html 인라인 IIFE 에서, 등록 기관이 같은 값을 내주는 이름의 배선을 생성기(`gen-inline-hard.js` mode:"unwire", 한 설정 10칸)로 지우고 앱 동작을 보존한다(손 편집 0).
- **R2** 지운 이름은 등록 기관(own)이 같은 값으로 내준다: 철거 전 이름 목록으로 대조해 불일치 0 · 통로에서 사라진 이름 0 · 이름별 값 지문 차이 0.
- **R3** 지우는 대상은 설정이 허용한 줄 종류뿐이고 names 밖 이름·함수 본문·그 밖의 글자는 바꾸지 않는다. 바뀐 제품 파일은 index.html 하나다.
- **R4** 증명 하한: 인라인 줄 수 감소와 기준선 기록 · 모듈 로드 새 회귀 0 · npm test 검사 수 동일·폐기 0 · tests/ · 금고 · 생성기 · 등록 기관 변경 0.
- (지시 항목 밖의 보고) 이 PR 을 반영한 index.html 에서 남은 배선과 덩어리의 줄 구성을 다시 재서 보고 파일로 남긴다(다음 단계 계획의 입력 — 주장으로 걸지 않는다).

범위 밖(지우지 않음): `renderTeamGoalsScreen` 의 가져오기 · getter 줄(등록하지 않은 이름 — 주인 세포가 800줄 상한에 걸린다. 그 중계는 마지막 단계 finalize 가 부팅 파일로 옮긴다, 오케스트레이터 판단) · 구역 함수 `boot…` 가져오기 25줄과 호출문(finalize 몫) · `a11ySwitch` 가져오기 줄(등록되지 않은 참조 0 줄 — 닫힌 목록에 맞는 종류가 없다) · `isoDate` 가져오기 줄(IIFE 안 코드가 아직 맨이름으로 쓴다) · 상태 선언.

### 구체 식별자

- 파일: `index.html`(인라인 IIFE 머리의 가져오기 줄 · `OurgoalAppScope.expose('index.html', {…})` 속성 줄과 빈 expose 문 · 손잡이 줄) — 바뀐 제품 파일은 이것 하나. `js/core/cell-registry.js` · 세포 파일은 기준과 같다.
- 실행 10칸(`reports/TASK-ES-680/proof.json` `unwire` 배열, 이름 58개 — 전부 1차(가져오기·getter 모두). 등록 3차가 더하거나 통로로 올린 이름 20 · 그 전에 등록된 이름 38):
  - `_goalsKit` 2(`maybeShowGoalUpdateModal` · `renderGoalsScreen`) · `_uiKit` 15(`switchTab` · `handleDeepLinkRouting` · `saveGoogleToken` · `toast` · `closeModal` · `saveProfile` · `uid` 등) · `_recordsKit` 31(`bindProRec…` 5 · `openProTemplateRecordModal` · `renderRecordsScreen` · `renderStopwatchWidgetHtml` · `renderLapRowsHtml` 등, + `dropKitVar`) · `_commKit` 1(`daysFromNow`, + `dropKitVar`) · `_calendarKit` 3(`renderCalendarScreen` 등) · `_levelBadgeKit` 1(`renderLevelBadge`, + `dropKitVar`) · `_modalOpenKit` 1(`openModal`, + `dropKitVar`) · `_visionTableInputKit` 1(`openVisionTableModal`, + `dropKitVar`) · `_xp` 2(`XP_RULES` · `awardXP`, + `dropKitVar`) · `_ui` 1(`escapeHtml`)
- 생성기 `docs/design/harness/module-split/gen-inline-hard.js`(변경 0) · 실행기 `unwire-run.js`(변경 0) · 모의 철거 `reports/TASK-ES-614/mock-unwire.cjs`(변경 0 — 실행을 키트·차수로 나누는 데 썼다) · 등록 목록 `reports/TASK-ES-677/registered-now.cjs`(변경 0)
- 새 도구(제품 코드 아님): `reports/TASK-ES-680/remaining-wiring.cjs`(#943 의 것에서 등록 목록 경로 한 줄만 바꿈) · `reports/TASK-ES-680/iife-composition.cjs`(#920 의 것 그대로)
- 화면 식별자(시나리오 12개 — #943 의 것 그대로): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnGoalsSubPersonal` · `#btnGoalsSubRoutine` · `#btnGoalsSubStats` · `#btnGoalsSubTeam` · `#homeAddGoal` · `#ngCancelBtn` · `#sanctuaryBellBtn` · `#closeNotifCenterBtn` · `#btnToggleGoalAgent` · `#goalAgentInput` · `#setTermsLink` · `#setPrivacyLink` · `#legalBody` · `#landLoginLink` · `#forgotPassBtn` · `#micBtn` · `.comm-subtab[data-sub="group"]` · `#recSamplePurgeBtn` · `#goalFastAddInput` · `#btnGoalFastAddSubmit` · `#exportRecordsBtn` · `#expThemeSel`

## 1. [원칙 ①] 문제를 정확히 파악한다

재철거 2차(#943) 뒤 세 가지가 index.html 의 배선을 바꿨다. 944줄 3단계(#949)는 큰 함수를 세포 여섯으로 옮기면서 그 세포들이 `L.이름` 으로 읽는 이름의 getter 를 머리에 다시 달았고, IIFE 안 코드가 맨이름으로 쓰던 가져오기의 참조를 0 으로 만들었다. 구역 이전 2차(#951)는 로드 시점 문을 구역 함수로 옮기면서 `daysFromNow` getter 를 달았다. 등록 3차(#950)는 그 이름들 가운데 등록되지 않았던 18개를 등록하고 2개를 통로로 올렸다. 지금 main 에서 재니(`remaining-wiring.before.json`) 등록됐는데 배선이 남은 이름이 59개 — 가져오기 59줄 · getter 58줄이다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 같은 값을 두 번 내주는 줄을 걷어 낸다. 이름과 값은 그대로, 내주는 길만 등록 기관 하나로 줄인다.
- **원인**: 옮기기 생성기는 「머리에 getter 가 없으면 단다」만 안다. 옮기기 PR 마다 getter 가 다시 생기고, 등록이 뒤따른 다음에야 지울 수 있다.
- **중심**: 생성기 unwire 한 번, 설정 `reports/TASK-ES-680/proof.json` 의 `unwire` 배열 10칸.
- **핵심**: 「등록됐다」와 「기관이 통로에 내준다」는 다르다(L102). 대상은 지금의 등록 블록에서 **통로로 나가게** 등록된 이름의 getter 뿐이다 — window 전용으로 등록된 이름의 getter 는 넣지 않는다(이번 대상에 그런 이름 0). 등록되지 않은 `renderTeamGoalsScreen` 의 getter 는 그대로 둔다.

## 3. [원칙 ③] 해결 방식

1. `reports/TASK-ES-677/registered-now.cjs` — 세포 파일 끝의 등록 블록을 글자로 읽어 지금 등록된 이름 545개의 목록을 만든다(블록과 등록 계획 기록 세 벌이 어긋나면 멈춘다).
2. `mock-unwire.cjs` 를 저장소 밖 사본에서 돌려 대상을 키트·차수로 나눈다(등록이 window 뿐인데 getter 가 있는 이름 · getter 가 돌려주는 이름이 등록한 가져오기 이름과 다른 이름은 넣지 않는다 · 참조가 남으면 2차). 이번에는 55개 전부 1차다.
3. 모의 도구가 못 돌리는 손잡이 꼴 `_ui` · `_xp`(X1)의 세 이름(`escapeHtml` · `XP_RULES` · `awardXP` — IIFE 안 잔존 참조 0)을 1차 실행 둘로 더한다.
4. 손잡이 줄: 그 키트의 가져오기가 전부 지워져 참조가 0 이 되는 `_recordsKit` · `_commKit` · `_levelBadgeKit` · `_modalOpenKit` · `_visionTableInputKit` · `_xp` 에 `dropKitVar`(한 번 돌려 본 뒤 남은 배선 표의 「참조 0 손잡이」로 확인하고 다시 돌렸다).
5. `unwire-run.js apply --runs … --names-for …` 로 `proof.json` 을 쓰고 생성기를 돌렸다. 생성기가 멈춘 이름 0(58개 전부). 뺀 이름 0.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **지운 이름이 통로에서 사라지지 않는가** → 철거 전 이름 목록으로 대조: 통로에서 사라진 이름 0 · 불일치 0 · 이름별 값 지문 차이 통로 0 · window 0(`cell-registry-compare.before.json` · `cell-registry-compare.json` · `measurement.json` `summary.compare` · `fingerprints`).
- **가져오기 줄을 지운 이름을 IIFE 가 아직 쓰는가** → 생성기가 실행마다 잔존 참조를 보고 멈춘다. 멈춤 0.
- **`saveGoogleToken` 을 이번에는 지웠다** → 재철거 2차에서는 `tests/gcal-login-reconnect-fix.test.js` 가 index.html 의 `window.saveGoogleToken = saveGoogleToken;` 글자를 붙잡아 뺐다. #944 가 그 단언을 「옛 배선 글자 또는 등록」으로 넓혔고, #951 이 그 window 줄을 구역 함수로 옮겼다(지금 IIFE 최상위의 window 대입 0). 남은 것은 가져오기 · getter 두 줄이다. 시험이 붙잡는지는 시험이 잰다: npm test 와 시험 하나씩이 기준과 같다(8절).
- **글자 검색이 「시험이 붙잡음」으로 잡은 네 이름**(`isGoogleCalendarConnected` · `openModal` · `renderStopwatchWidgetHtml` · `saveGoogleToken`) → 글자 검색(`pinned-names.cjs`)은 시험 소스에 `window.이름 =` 같은 글자가 있으면 넓게 잡는다. 넷 다 index.html 에 window 줄이 없고 가져오기 · getter 줄뿐이다. 지운 뒤 npm test 와 시험 하나씩이 기준과 같다(재철거 2차에서 받아들여진 판단과 같은 기준).
- **허용 종류 밖의 줄** → 실행 10칸을 차례로 되짚어 기준 index.html 에서 작업 index.html 을 다시 만들었다: 같음(`onlyDeletions.rebuiltEqualsWork`), 허용 종류 밖 삭제 [] · names 밖 이름 []. 지운 것은 가져오기 58줄 · getter 속성 58줄 · 속성이 다 빠진 expose 문 5개의 머리·꼬리 줄 · 손잡이 6줄(합 132줄)과 쉼표 5글자(`unwire-meta.json` `totals`).
- **세포가 실제로 그 이름을 읽는 길** → 시나리오 12개가 지운 이름을 통로로 읽는 구역 함수와 세포를 실제로 지난다(게스트 부팅 · 여섯 탭 · 목표 하위 탭 · 종 모달 · 새 목표 창 · AI 어시스턴트 서랍 · 약관·개인정보 링크 · 비밀번호 찾기 · 마이크 안내 창 · 모임 구획 · 샘플 정리 · 빠른 목표 추가 · 내보내기 테마). 프로 템플릿 기록 창(새 세포 여섯)과 로그인 뒤에만 불리는 이름은 이름 전수 대조와 값 지문으로 잰다.
- **시험** → npm test 종료 코드와 검사 줄이 기준과 같고, 시험을 하나씩 돌린 결과도 같다(8절).

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · 번호 선점 · `npm ci --ignore-scripts` · 기준 · 모의 작업 폴더(분리 HEAD, 저장소 밖).
2. `registered-now.cjs` → `pinned-names.cjs` → `remaining-wiring.cjs`(철거 전) → `mock-unwire.cjs`(실행 나누기).
3. `unwire-run.js apply` → `remaining-wiring.cjs`(철거 후 — 참조 0 손잡이 확인) → 다시 apply → `module-guard --update`.
4. REQ · 작업표 → npm test 와 시험 하나씩(기준 · 작업, 전경으로 끝까지) → `unwire-run.js measure` → `unwire-run.js claims` → `iife-composition.cjs`.
5. 무결성 게이트 → 커밋 → `recomputeSplit` 직접 호출 · 로컬 법정 전체 실행(요약을 읽은 뒤 커밋) → push 직전 origin/main 재확인 → push 한 번 → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「준비 모의에서 이미 쟀다」** → 준비 모의는 #952 전의 main 과 #950 을 겹친 사본에서 한 것이다. 이번은 #952 까지 든 main 에서 다시 나누고(이름 수 55 → 58: `_ui` · `_xp` 의 셋을 실제 실행기로 더했다), 손잡이 6줄을 더해 지웠다. 대조 · 시나리오 · 시험을 전부 다시 쟀다.
- **반론 2 「`renderTeamGoalsScreen` 의 getter 한 줄을 남기면 expose 문이 하나 남는다」** → 맞다. 그 이름은 등록 기관이 내주지 않으므로 지우면 세포가 `L.renderTeamGoalsScreen` 을 못 읽는다. 남은 통로 getter 이름은 그것 하나다(`remaining-wiring.json` `iife.getterNames`).
- **반론 3 「손잡이 줄 6개를 한 번에 지우는 것은 위험하다」** → 손잡이 줄은 생성기가 「그 실행의 삭제를 반영한 뒤 맨이름 참조 0」을 확인하고 지운다. 되짚기에서 6줄 모두 손잡이 줄로 분류됐고(`unwire-meta.json` `removed.kitVarLine`), push 전에 `recomputeSplit` 직접 호출로 생성기 재실행 대조를 확인한다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-680/` 아래. 수치는 `measurement.json` 이 각 결과에서 읽어 모은 것이다.

| 파일 | 무엇 |
|---|---|
| `registered-now.json` | 지금 등록된 이름 545개(등록 블록에서 읽음) |
| `pinned-names-now.json` | 글자 검색 결과(넓게 잡는다 — 실제로 붙잡는지는 시험이 잰다) |
| `mock-unwire.json` · `raw-runs.txt` · `raw-names-for.txt` | 실행 나누기(저장소 밖 사본) · apply 에 준 인자 |
| `proof.json` · `unwire-meta.json` | 생성기 설정(실행 10칸) · 생성기 산출 기록(지운 줄 번호 · 종류) |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 대조 탐침(철거 전 이름 목록으로 고정) |
| `scenario-local.json` · `scenarios/` | 시나리오 12개 기준·작업 |
| `module-load.json` · `raw/` · `tests-base.json` · `tests-work.json` | 모듈 로드 · npm test · 시험 하나씩 |
| `measurement.json` · `claims.json` | 측정 모음 · 주장 |
| `remaining-wiring.before.json` · `remaining-wiring.json` · `iife-composition.json` | 남은 배선(철거 전·후) · 덩어리의 줄 구성 |
| `court-local.json` | `recomputeSplit` 직접 호출과 로컬 법정 실행 기록(작업자 PC — 판정 아님) |

### 남은 가져오기 이름과 풀리는 조건 (`remaining-wiring.json` — 이 PR 뒤 28개)

| 묶음 | 수 | 무엇이 되면 풀리는가 |
|---|--:|---|
| 구역 함수 `boot…`(등록 대상 아님) | 25 | finalize 가 가져오기·호출 줄을 함께 부팅 파일로 옮긴다 |
| 등록 안 됨 · 주인 세포 800줄 상한(`renderTeamGoalsScreen` — getter 1줄도 남음) | 1 | finalize 가 그 중계를 부팅 파일로 옮긴다(생성기 옵션 `relay` — 별도 PR). 함수 나누기는 덩어리 해체 뒤의 과제 |
| 등록됨 · IIFE 안 코드가 아직 맨이름으로 씀(`isoDate`) | 1 | 그 코드(남은 로드 중 문)가 구역 함수로 옮겨지면 참조가 0 이 된다(구역 이전 3차) |
| 등록 안 됨 · 참조 0(`a11ySwitch`, 손잡이 `_ui`) | 1 | 닫힌 목록에 「등록되지 않은 참조 0 가져오기 줄」 종류가 없다 — 보고만 한다 |

남은 손잡이 4개: `_uiKit`(구역 함수 가져오기 25) · `_goalsKit`(`renderTeamGoalsScreen`) · `_calendarKit`(`isoDate`) · `_ui`(`a11ySwitch`).

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 다른 index.html PR 이 먼저 병합된다 → index.html · 기준선을 main 판으로 두고 등록 목록부터 생성기까지 다시 돌린다(L010). 오케스트레이터가 이 PR 병합 전까지 index.html 을 바꾸는 다른 PR 을 멈춰 두었다.
- **예상**: 법정의 생성기 재실행 대조가 로컬과 다를 수 있다 → push 전에 `recomputeSplit` 을 직접 부른다(L070 · L088).
- **측정불가**: 로그인 뒤에만 불리는 연결 함수 · 프로 템플릿 기록 창의 동작 — 이름 전수 대조와 값 지문으로만 쟀다. 운영 환경.
- **성과 측정**: 지운 줄 132(index.html). `inlineScriptLines` 전→후와 기준선 기록은 `measurement.json` `summary.inlineScriptLines` · `docs/architecture/module-baseline.json` 마지막 기록. 남은 가져오기 86 → 28 · 통로 getter 이름 59 → 1 · 손잡이 10 → 4(`remaining-wiring.before.json` · `remaining-wiring.json` `iife`).
