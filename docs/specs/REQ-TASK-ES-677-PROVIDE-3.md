# REQ — #TASK-ES-677 미분화 덩어리 해체 등록 3차: 막혔던 두 이름과 #949 뒤 새로 통로로 나간 이름 18개를 주인 세포가 등록

- Task ID: **TASK-ES-677** (L012: `gh pr list --state all` · `git ls-remote origin` · origin/main 의 작업표에서 677 이 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-677-provide-3` 를 먼저 push 해 선점했다. 675 · 676 은 다른 작업 몫이다.)
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「세포 등록」 셋째 사례**. 선례 B2(#884) · B3a(#889) · 등록 2차(#940). 방식은 등록 2차와 같다: 등록 줄은 생성기가 쓴다(`--keep`, 손 편집 0) · 대조 탐침 · 저장소 밖 모의 철거 사본과 대조군. **생성기는 바꾸지 않았다.**
- 작업참고 기준 PR #934(d55d7595, 경험칙 115개) · 기준 main f227a756(#949 944줄 3단계 병합 뒤 — 착수는 d86d8366(#943)였다. #949 가 index.html 을 바꿔, 그 main 에서 등록 계획 · 모의 철거 · 시험 · 측정을 처음부터 다시 했다). 그 뒤 #951(구역 이전 2차 — index.html · 새 세포 둘)을 합쳤고, 오케스트레이터 지시대로 등록 계획(더할 이름 0) · 대조 탐침 · npm test 만 다시 확인했다(`reports/TASK-ES-677/post-merge-check.json`).
- 지시함(origin/main) 열린 지시: **DIR-003**(B 트랙 — 세포가 등록 기관에 스스로 등록) · **DIR-004**.
- **상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d — 글자 그대로)**: 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마. 지침이나 결심이 필요한점?」
- 이 작업 세션은 빌더다. 병합은 하지 않는다(오케스트레이터 몫).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.
- **이 PR 의 경과(숨기지 않는다)**
  1. 처음에는 세 이름(`switchTab` · `handleDeepLinkRouting` · `renderTeamGoalsScreen`)을 등록했다. 셋째는 주인 세포가 798줄이라 등록 블록 10줄을 붙이면 800줄 상한을 넘어, 같은 문장을 한 줄로 이어 쓴 블록을 붙이는 생성기 옵션(`--compact-over-limit`)을 더해 799줄로 맞췄다.
  2. 오케스트레이터가 그것을 받아들이지 않았다 — 「줄 수 상한을 글자 배치로 맞추는 것은 잣대를 피해 가는 꼴이다」. 그 옵션과 그 이름의 등록을 되돌렸다(생성기 · 그 세포는 main 과 같다).
  3. 그 사이 #949 가 병합돼 index.html 에 통로 getter 가 다시 달렸고, 등록되지 않은 이름 16개와 window 전용으로만 등록된 이름 2개가 통로로 나가게 됐다. 오케스트레이터 지시로 그 18개를 이 PR 에 함께 담았다(따로 PR 을 열지 않는다).

## 0. 요구 (지시 항목)

| ID | 지시 | 완료 기준 |
|---|---|---|
| R1 | 통로로 나가는 키트 가져오기 이름 가운데 등록 기관에 없는 18개를 주인 세포의 등록 블록에 **통로 전용**으로 더하고, window 전용으로 등록돼 있던 2개를 통로로도 내주게 올린다. 앱 동작은 그대로다 | 게스트 시나리오 12개가 기준·작업 양쪽 통과 |
| R2 | 등록 줄은 생성기가 쓴다(손 편집 0 · 생성기 변경 0). 기존 등록 불변 · 블록 밖 글자 불변 · 800줄 상한 | 기준의 등록 이름 가운데 사라진 것 0 · 더한 이름 = 계획 · 달라진 기존 항목 = 통로로 올린 2개뿐 · 블록 밖 글자 불변 · 800줄 초과 0 · 한 줄로 이어 쓴 블록 0 |
| R3 | 대조 탐침: 등록 수 증가 · 불일치 0 · 이중 등록 0 · 초과 기준과 같음 · 값 지문 차이 0 | `cell-registry-compare.json` |
| R4 | index.html · tests · 금고 · 철거 생성기 변경 0 · 모듈 로드 · npm test · 시험 하나씩 | 측정 파일의 해당 칸 |
| R5 | 모의 철거: 저장소 밖 사본에서 그 20개 이름의 가져오기·getter 줄을 지워도 대조 · 시나리오 · 시험이 기준과 같다 | 모의 사본의 지문 차이 0 · 시나리오 통과 · 시험 결과 |

- 범위 밖(하지 않음):
  - **`renderTeamGoalsScreen` 은 등록하지 않는다**(오케스트레이터 판단 — 길 (라)). 주인 세포 `js/tabs/goals/team-goals-screen.js` 는 798줄이고 771줄짜리 함수 하나가 전부라, 등록 블록(10줄)을 붙이면 800줄 상한을 넘고 옮길 책임 단위도 파일 안에 따로 없다. 그 가져오기 · getter 중계는 마지막 단계(finalize)가 부팅 파일로 글자 그대로 옮긴다(생성기의 닫힌 목록에 종류를 더하는 일 — 그 생성기 담당의 몫). 함수를 나누는 일은 덩어리 해체 뒤의 별도 과제다.
  - `window.switchTab` · `window.handleDeepLinkRouting` 의 값을 통로 값과 맞추는 일(동작 변경 — 사실만 4절에 적는다) · 실제 재철거(다음 PR) · `a11ySwitch` 가져오기 줄 삭제(사실만 8절에 적는다).

### 구체 식별자

- 생성기: `docs/design/harness/module-split/gen-cell-provide.js`(변경 0) — `--keep --write`
- 고친 세포 15개(전부 **파일 끝의 등록 블록만**):
  - 새 블록 11개: `js/core/deep-link-gateway.js` · `js/tabs/records/` 의 `pro-record-modal.js` · `pro-record-save.js` · `pro-record-stopwatch.js` · `pro-record-table.js` · `pro-record-tools.js` · `pro-record-trend-chart.js`(#949 의 새 세포 여섯) · `stopwatch-format.js` · `table-csv-sync.js` · `vision-table-input.js` · `voice-table-input.js`
  - 기존 블록에 항목이 더해지거나 달라진 4개: `js/core/registry-init.js`(`switchTab`) · `js/tabs/records/pro-template-modals.js` · `pro-templates.js` · `table-stopwatch.js`(`windowOnly` 목록에서 두 이름이 빠짐)
- 더한 이름 18개(전부 통로 전용 `window: []`): `switchTab` · `handleDeepLinkRouting` · `bindProRecSave` · `bindProRecStopwatch` · `bindProRecTable` · `bindProRecTools` · `bindProRecTrendChart` · `openProTemplateRecordModal` · `downloadTableAsCsv` · `formatStopwatchTime` · `getAllProTemplates` · `openCsvImportModal` · `openTemplateColumnEditModal` · `openVisionTableModal` · `openVoiceTableModal` · `openWearableSyncModal` · `playTimerBeep` · `syncRecordToMatchingGoals`
- window 전용에서 통로로 올린 이름 2개: `renderLapRowsHtml` · `renderStopwatchWidgetHtml`
- 새 도구(제품 코드 아님): `reports/TASK-ES-677/provide-run.cjs`(등록 2차의 측정 도구를 가져옴 — 등록 블록 읽기가 줄 머리에 기대지 않게 하고, 한 줄로 이어 쓴 블록이 없음을 센다) · `reports/TASK-ES-677/registered-now.cjs`(#943 의 것에 이 PR 의 계획 기록을 더함 — 다음 재철거의 입력)
- 손대지 않은 것: `index.html` · `tests/**` · `scripts/**` · `court/**` · 등록 생성기 · 철거 생성기 `gen-inline-hard.js` · 등록 기관 `js/core/cell-registry*.js` · `js/tabs/goals/team-goals-screen.js` · 모듈 가드와 상한 값 · 생성 지도
- 화면 식별자(시나리오 12개 — #943 의 것 그대로): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnGoalsSubPersonal` · `#btnGoalsSubRoutine` · `#btnGoalsSubStats` · `#btnGoalsSubTeam` · `#homeAddGoal` · `#ngCancelBtn` · `#sanctuaryBellBtn` · `#closeNotifCenterBtn` · `#btnToggleGoalAgent` · `#goalAgentInput` · `#setTermsLink` · `#setPrivacyLink` · `#legalBody` · `#landLoginLink` · `#forgotPassBtn` · `#micBtn` · `.comm-subtab[data-sub="group"]` · `#recSamplePurgeBtn` · `#goalFastAddInput` · `#btnGoalFastAddSubmit` · `#exportRecordsBtn` · `#expThemeSel`

## 1. [원칙 ①] 문제를 정확히 파악한다

- 재철거 2차(#943) 뒤 index.html 에 남은 통로 getter 가운데 `switchTab` · `handleDeepLinkRouting` 은 키트에서 가져온 이름인데 등록 기관에 없어 getter 를 지울 수 없다. 등록 2차(#940)가 이 둘을 등록하지 않은 까닭은 「통로 값과 window 값이 서로 다르다」(그때의 지시 — 등록하지 않고 보고)였다. 그 값들이 무엇인지는 그때 재지 않았다.
- 944줄 3단계(#949)가 큰 함수를 세포 여섯으로 옮기면서, 그 세포들이 `L.이름` 으로 읽는 이름의 getter 를 index.html 머리에 다시 달았다(통로 getter 이름 7 → 60). 그 가운데 16개는 아직 어느 세포도 등록하지 않은 이름이고(새 세포의 연결 함수 `bindProRec…` 다섯과 `openProTemplateRecordModal`, 그리고 그동안 IIFE 안 코드만 쓰던 이름 열), 2개는 window 전용으로만 등록돼 있다. 등록 기관이 통로에 내주지 않는 이름의 getter 는 재철거가 지울 수 없다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 통로로 나가는 이름은 주인 세포가 통로에 내준다. window 에 무엇이 달려 있는지는 이 일과 별개다.
- **원인(앞의 둘)**: 「통로 값 ≠ window 값」은 등록 기관의 불일치가 아니다. 등록 기관의 불일치는 ① 등록 값과 통로 getter 가 돌려주는 값이 다르거나 ② **index.html 의 IIFE 가 window 에 대입하는 이름**인데 등록 값과 window 값이 다를 때만 선다(`js/core/cell-registry.js` `report()` · 탐침 `scripts/probes/cell-registry-compare.js` 의 window 이름 출처 = IIFE 최상위 window 대입문). 이 둘은 index.html 이 window 에 대입하지 않는다 — window 의 값은 다른 파일이 단다. 그래서 생성기는 처음부터 이 둘을 **통로 전용**(`window: []`)으로 계획했고, 통로 전용 등록은 window 를 건드리지 않는다.
- **원인(뒤의 18)**: 옮기기 생성기는 「머리에 getter 가 없으면 단다」만 알고 등록은 하지 않는다. 등록은 뒤따라가야 한다.
- **중심**: 생성기 `--keep --write` 한 번.
- **핵심**: 탐침의 잣대도 값도 상한도 바꾸지 않는다. 800줄 상한에 걸리는 이름은 등록하지 않는다.

## 3. [원칙 ③] 해결 방식

1. 앞의 두 이름의 통로 값과 window 값을 브라우저에서 잰다(`pre-probe.json` — 4절의 사실).
2. `gen-cell-provide.js --keep --write`(제외 파일 없이). 더한 이름 18 · window 전용에서 통로로 올린 이름 2 · 바뀐 세포 15 · 800줄 상한으로 건너뛴 이름 1 · 두 번째 실행 0 변경.
3. 측정: 블록 전후 대조(정규식 — 생성기와 다른 방법) · 대조 탐침 · 20개 이름의 통로 값 · 시나리오 · 모듈 로드 · npm test · 시험 하나씩 · 모의 철거 · 대조군.

## 4. [원칙 ④] 재검토 (반례·부작용)

### 「통로 값 ≠ window 값」의 실체

브라우저에서 게스트 부팅 뒤 잰 것(`pre-probe.json` `extra` · `names`):

| 이름 | 통로(`L.`)로 읽는 값 | window 에 달린 값 | 누가 window 에 다는가 |
|---|---|---|---|
| `switchTab` | 키트의 `switchTab` — `function switchTab(tab){ return setTab(tab); }`(`js/core/registry-init.js` 144행) | 키트의 `setTab` 그 자체 | 구역 함수 `js/core/boot-entry-wiring.js` 152행 `window.switchTab = L.setTab;` |
| `handleDeepLinkRouting` | 키트의 관문 함수 — `if(window.OurgoalViralSharing) window.OurgoalViralSharing.handleDeepLinkRouting();`(`js/core/deep-link-gateway.js` 19행) | `js/viral-sharing.js` 의 실제 함수 | `js/viral-sharing.js` 337행 `global.handleDeepLinkRouting = handleDeepLinkRouting;` |

- **감싸개인가 다른 함수인가** → 둘 다 감싸개다. 통로 값이 window 값을 부른다: `switchTab` 은 `setTab` 을 그대로 부르고, 관문 함수는 `OurgoalViralSharing.handleDeepLinkRouting` 을 부른다(그 부품이 없으면 아무 일도 하지 않는다).
- **읽는 쪽이 기대하는 값** → 통로로 읽는 쪽(`L.switchTab` — crew-pacing · peer-invite · quest-summary · checkin-feedback · growth-chart · records/render · weekly-recap · tab-guide · `L.handleDeepLinkRouting` — `js/core/boot-finish.js` 29행)은 지금도 감싸개를 받는다. window 로 부르는 쪽(`window.switchTab` — notify-engine · sanctuary-* 와 화면의 onclick 글자)은 지금도 `setTab` 을 받는다. 통로 전용 등록은 통로에 **지금과 같은 감싸개**를 내주고 window 는 건드리지 않으므로 양쪽 모두 지금과 같은 값을 받는다.
- **값을 맞춰야 하는가** → 맞추지 않았고, 맞출 필요도 없다. 맞추는 것은 동작 변경이다(통로로 읽는 쪽이 받는 함수가 바뀐다).

### 그 밖의 재검토

- **window 전용 2개를 통로로 올린 것** → `renderLapRowsHtml` · `renderStopwatchWidgetHtml` 은 등록 블록의 `windowOnly` 목록에서 빠졌다(등록 2차의 8개와 같은 규칙 — 세포가 이제 통로로 읽어 getter 가 생긴 이름). 이름 · 값 · 주인 · window 목록은 그대로다. 올리지 않으면 그 getter 는 지울 수 없다(L102).
- **대조 탐침** → 불일치 0 · 초과는 기준과 같다(더한 이름은 전부 index.html 의 getter 가 내주는 이름이라 「등록됐는데 옛 배선에 없는 이름」이 아니다). 통로 · window 값 지문 차이 0.
- **기존 등록** → 기준의 등록 이름 가운데 사라진 것 0 · 달라진 것은 통로로 올린 2개뿐 · 블록 밖 글자 불변 · 이중 등록 0.
- **모의 철거** → 저장소 밖 사본에서 20개 이름의 가져오기 20줄 · getter 20줄과 빈 expose 문을 철거 생성기로 지웠다(42줄 — 생성기가 멈춘 이름 0). 대조 · 시나리오 · 시험이 기준과 같고, 20개 이름의 통로 값 요약이 기준과 같다. 대조군(등록 없이 같은 줄을 지움)은 부팅 중 예외가 난다. 기준 · 작업 · 모의 철거 사본의 예외는 0 건이다.
- **다시 생긴 getter 가 다음 재철거에서 지워지는가(미리보기 — 주장으로 걸지 않는다)** → 이 PR 뒤의 등록 목록 전체로 저장소 밖 사본에 철거 생성기를 돌려 봤다(`unwire-preview.json`): 115줄 삭제 · 가져오기 78 → 24 · 통로 getter 이름 60 → 6. 남는 getter 이름 6개는 `state`(상태) · `_promptEncyclopediaOpen`(상태) · `renderTeamGoalsScreen`(등록하지 않음) · `XP_RULES` · `awardXP` · `escapeHtml`(손잡이 `_ui` · `_xp` — 모의 도구가 못 돌리는 손잡이 꼴이고, 실제 재철거 실행기는 돌린다).

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · 번호 선점 · `npm ci --ignore-scripts`.
2. 이름의 값 재기 → `--write` → 멱등 확인.
3. 기준 · 모의 · 대조군 임시 트리 → 모의 철거 → REQ · 작업표 → npm test · 시험 하나씩(기준 · 작업 · 모의) → 측정 → 주장.
4. 무결성 게이트 → 커밋 → push 직전 origin/main 재확인 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「등록 2차가 뺀 이름을 이제 넣는 것은 그때의 판단을 뒤집는 것이다」** → 그때 뺀 근거는 「통로 값 ≠ window 값인 이름은 등록하지 않고 보고한다」는 지시였고, 그 값들이 무엇인지는 재지 않았다. 이번에 재 보니 window 의 값은 index.html 이 아닌 다른 파일이 다는 것이고, 등록 꼴은 통로 전용이라 window 와 무관하다. 탐침의 잣대는 그대로다.
- **반론 2 「지금 다 통과하니 충분하다」** → 지금은 옛 배선이 같은 값을 다시 내준다. 그래서 모의 철거 사본과 대조군으로 쟀다(4절).
- **재검증(되돌린 것)**: 한 줄 꼴 블록은 상한 값은 그대로 두면서 재는 대상의 모양을 잣대에 맞춘 것이었다. 받아들여지지 않아 되돌렸다. 되돌린 뒤 등록 생성기와 `team-goals-screen.js` 는 main 과 글자가 같고(`git diff origin/main` 0), 한 줄로 이어 쓴 등록 블록이 저장소에 없음을 측정으로 센다(`summary.oneLineBlockFiles` = []).
- **재검증(새 세포 여섯)**: #949 의 새 세포들은 등록 블록 없이 병합됐다(옮기기 생성기는 등록하지 않는다). 이 PR 이 그 여섯에 블록을 붙인다 — 전부 800줄 아래다(800줄 초과 0 은 측정 파일 `summary.blocks.over800`).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-677/` 아래. 수치는 `measurement.json` 이 각 결과에서 읽어 모은 것이다.

| 파일 | 무엇 |
|---|---|
| `pre-probe.json` · `probe-names.json` | 이름의 통로 값 · window 값(등록 전) |
| `provide-plan.json` | 생성기 계획: 더함 18(전부 통로 전용) · 통로로 올림 2 · 바뀌는 세포 15(새 블록 11) · 800줄 상한으로 건너뜀 1(`renderTeamGoalsScreen`) |
| `cell-registry-compare.{base,base2}.json` · `cell-registry-compare.json` | 대조 탐침 |
| `name-probe.{base,work,mock}.json` | 20개 이름의 통로 값 요약 — 기준·작업·모의 |
| `scenario-local.json` · `scenarios/` | 시나리오 12개 기준·작업 |
| `module-load.json` · `raw/` · `tests-{base,work}.json` | 모듈 로드 · npm test · 시험 하나씩 |
| `mock-plan.json` · `mock-unwire.json` · `cell-registry-compare.mock.json` · `scenario-mock.json` · `tests-mock.json` | 모의 철거(42줄) 사본의 대조 · 시나리오 · 시험 |
| `ctrl-unwire.json` · `cell-registry-compare.ctrl.json` | 대조군 |
| `registered-now.json` · `unwire-preview.json` | 이 PR 뒤 등록된 이름 목록 · 다음 재철거 미리보기(주장 아님) |
| `measurement.json` · `claims.json` · `court-local.json` | 측정 모음 · 주장 · 로컬 법정 실행 기록(판정 아님) |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 다른 PR 이 index.html 을 바꾸면 등록 계획이 달라질 수 있다 → 이번처럼 그 main 에서 계획부터 다시 낸다(구역 이전 2차가 곧 병합된다 — 그 PR 이 getter 를 더 달면 재철거 3차 앞에서 한 번 더 본다).
- **측정불가**: `L.switchTab` 을 부르는 단추(홈 퀘스트의 마일스톤 항목 · 기록 탭의 목표 템플릿 단추)는 게스트 화면에 보이지 않아 시나리오로 누르지 못했다(두 개를 시도해 기준 트리에서도 대상이 없었다 — 뺐다). 프로 템플릿 기록 창(새 세포 여섯이 맡은 화면)을 여는 길도 시나리오에 없다. 그 길들은 통로 값 지문과 모의 철거 사본의 값 요약으로만 쟀다. 초대 주소 딥링크 길 · 로그인 뒤 동작 · 운영 환경.
- **측정불가(로컬 법정)**: 처음 push 전에 로컬 법정 전체 실행을 두 번 돌렸고 두 번 다 판정 전에 실행이 끝났다(`court-local.json`). 원인은 재지 못했다.
- **성과 측정**: 이 PR 자체의 `inlineScriptLines` 변화는 0 이다. 등록 이름은 18개 는다(`measurement.json` `summary.registry.registeredGrewBy`). 이 등록으로 다음 재철거가 지울 수 있는 줄은 모의 철거 기준 42줄이다.

### 사실 보고 — `a11ySwitch`(지우는 PR 은 만들지 않는다)

- index.html 의 `var a11ySwitch = _ui.a11ySwitch;` 는 IIFE 의 지역 변수다. IIFE 안에서 그 변수를 읽는 곳 0 · 대입 0 · 문자열에 그 이름이 든 곳 0 · `eval` · `new Function` · `with` 0(@babel/parser 로 잼). 통로 getter 도 window 대입도 없다.
- 함수 자체는 `js/core/ui-helpers.js` 16행에 있고 설정 탭 세포 여섯 개(`sub-appearance` · `sub-data` · `sub-integrations` · `sub-notify` · `sub-profile` · `sub-security`)가 `U.a11ySwitch(…)` — 키트(`window.OurgoalUiHelpers`)에서 직접 — 로 14번 부른다. index.html 의 지역 변수를 거치지 않는다.
- `tests/` · `scripts/` 에 그 이름의 글자 0. 화면의 onclick 글자에도 없다.
- 그러므로 그 가져오기 줄은 읽는 곳이 없는 줄이다. 지우면 손잡이 `_ui` 의 남는 가져오기는 `escapeHtml` 하나다.
