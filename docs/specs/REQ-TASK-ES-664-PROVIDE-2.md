# REQ — #TASK-ES-664 미분화 덩어리 해체 등록 2차: 아직 중계되는 키트 이름 89개를 주인 세포가 등록 기관에 등록

- Task ID: **TASK-ES-664** (L012: `gh pr list --state all` · `git ls-remote origin` 에서 664 가 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-664-provide-2` 를 먼저 push 해 선점했다. 646 · 662 · 663 은 다른 작업.)
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「세포 등록」 둘째 사례**. 선례 B2(#TASK-ES-611, PR #884 — 세포가 스스로 등록) · B3a(#TASK-ES-614, PR #889 — own 적용 · window 전용 · 모의 철거). 그 방식을 따른다: 등록 줄은 생성기가 쓴다(손 편집 0) · 대조 탐침으로 옛 배선 값과 등록 값이 같은지 본다 · 충분성은 저장소 밖 **모의 철거 사본**과 **대조군**으로 잰다(L066·L091) · 시험이 붙잡는 이름은 시험을 고치지 않고 목록으로 남긴다(L067). 새로운 점은 하나 — 철거가 진행된 뒤라 생성기를 그대로 다시 돌리면 이미 지운 이름의 등록이 사라진다. 그래서 생성기에 **기존 등록 보존 모드**를 더해 그것으로 썼다.
- 작업참고 기준 PR #931(cc325e0a, 경험칙 111개) · 착수 기준 main 0b643c58(#933 구역 이전 병합 뒤) · 합친 main 5c567cd9(#934 생성 지도 갱신 · #935 철거 생성기 finalize 모드 · #937 상태 선언 아홉 문 다듬기 — #937 만 index.html 을 16줄 바꿨고 `js/**` · `tests/**` · `scripts/**` · `court/**` · 등록 생성기 차이는 0). 측정의 기준 트리는 5c567cd9 다. main 을 합칠 때마다 등록 생성기를 다시 돌려 0 변경(멱등 — #937 의 index.html 변경은 가져오기·getter 줄을 건드리지 않아 등록 계획이 같다)임을 확인했고, 마지막으로 기준 트리를 5c567cd9 로 옮겨 npm test(기준 · 작업) · 시험 하나씩 · 탐침 · 시나리오를 다시 쟀다. **모의 철거 사본과 대조군은 d55d7595 의 index.html 로 만든 것을 그대로 썼다**(#937 뒤의 index.html 로 다시 만들지 않았다 — 재철거 PR 이 그때의 main 에서 실제로 잰다).
- 지시함(origin/main) 열린 지시: **DIR-003**(B 트랙 — 세포가 등록 기관에 스스로 등록) · **DIR-004**.
- **상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d — 글자 그대로)**
  1. 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마. 지침이나 결심이 필요한점?」
  2. 「결심필요 4번 빼고 모두 권장안대로 진행하고 4번은 자세히 설명해봐 어떤 함수인지 어떤 기능을 하던건지 자세히, 어떻게 진행하는게 좋을지, 권장안이 뭔지」
- 설계 정본: `docs/architecture/CELL-REGISTRY-DESIGN.md` 2절(새 기관을 추가하고, 대조하고, 옛 배선을 철거한다) · 3.1 · 3.2 · 4절 「새 기관 추가」 증명 하한.
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 원문의 어느 문장 | 완료 기준 |
|---|---|---|---|
| R1 | index.html 에 남은 키트 가져오기 이름 가운데 등록 기관에 없는 것을, 그 이름을 키트에 다는 세포의 등록 블록에 더한다. 앱 동작은 그대로다 | 원문 1 「남은 미분화작업 모두 진행」 · 오케스트레이터 지시 | 게스트 시나리오 12개가 기준·작업 양쪽 통과 |
| R2 | 손으로 등록 줄을 넣지 않는다 — 생성기에 기존 등록을 보존하고 지정한 이름만 더하는 모드를 더해 그것으로 쓴다. 기존 블록의 이름이 하나도 빠지지 않았음을 전후 대조로 보인다. 800줄 상한 | 오케스트레이터 지시 | 기준의 등록 이름 가운데 사라진 것 0 · 더한 이름 = 계획 · 블록 밖 글자 불변 · 800줄 초과 0 |
| R3 | 대조 탐침: 등록 수 증가 · 불일치 0 · 이중 등록 0 · 초과 0 · 값 지문 차이 0 | B2·B3a 선례 | `cell-registry-compare.json` |
| R4 | index.html 변경 0 · tests · 금고 · 철거 생성기 변경 0 · module-load · npm test | 오케스트레이터 지시 | 측정 파일의 해당 칸 |
| R5 | 모의 철거: 저장소 밖 사본에서 새로 등록한 이름의 배선을 지운 뒤 대조 · 시나리오 · 시험이 기준과 같은지 잰다. 시험이 글자로 붙잡는 이름은 목록으로 | 오케스트레이터 지시 | 모의 사본의 지문 차이 0 · 시나리오 통과 · 시험 결과 · `pinned-names.json` |

- 원문에 있는데 이 PR 항목에 없는 요구(목표 줄에 남긴다): 실제 재철거(다음 PR) · 등록하지 않은 이름 · sweep · finalize. 「병합도 스스로」 — 병합은 판정 뒤 오케스트레이터가 한다.

### 구체 식별자

- 고친 생성기: `docs/design/harness/module-split/gen-cell-provide.js` — `--keep`(기존 등록 보존) · `--exclude <names.json>`(더하지 않을 이름과 사유) · 함수 `parseBlock(code, file)`(이미 붙어 있는 등록 블록 읽기). `--keep` 없이 돌리면 계획이 예전과 같다(같은 트리에서 고치기 전·후 계획 JSON 동일).
- 고친 세포 파일 49개(전부 **파일 끝의 등록 블록만** — 그 밖의 글자 불변): 블록이 새로 붙은 21개(`js/core/` 의 `app-boot.js` · `gcal-token-save.js` · `module-connect.js` · `pwa-service-worker.js` / `js/tabs/goals/` 의 `curated-market-data.js` · `goal-agent-toggle.js` · `goal-fast-add.js` · `team-comment-send.js` / `js/tabs/records/` 의 `ai-feedback-providers.js` · `checkin-capture.js` · `checkin-input-wiring.js` · `external-import.js` · `sample-purge.js` · `template-market.js` / `js/tabs/settings/` 의 `auth-screen-actions.js` · `boot-wiring.js` · `guide-buttons.js` · `support-inquiry-bind.js` · `user-session-realtime.js` · `widget-modal-opener.js` · `withdraw-modal.js`) + 기존 블록에 이름이 더해지거나 통로로 올린 이름이 든 28개. 목록은 `reports/TASK-ES-664/provide-plan.json` `keep.filesToChange`.
- 등록 블록의 꼴(생성기 산출 — 예): `R.provide('settings/boot-wiring', { bindPrivacyLinks: K.bindPrivacyLinks, … }, { window: [] });`
- 더한 이름 89개(`provide-plan.json` `keep.addedNames`): `bind…` 60 · `connect…` 5 · `open…` 5 · `start…` 4 · `define…` 2 · `init…` 2 · 그 밖의 함수 9(`runAppBoot` · `selectSmartTag` · `saveGoogleToken` 등)와 자료 2(`MOCK_PEOPLE` · `CURATED_MARKET_TEMPLATES`). window 로도 나가는 이름은 `saveGoogleToken` 하나, 나머지 88개는 통로만.
- window 전용에서 통로로 올린 이름 8개: `checkKakaoInAppBrowser` · `closeAppEvaluationModal` · `closeAvatarLevelUpModal` · `closeFeedbackSetup` · `initDevDebugButtons` · `openAppEvaluationModal` · `openMzShareCardModal` · `showLegalModal`
- 새 도구(제품 코드 아님): `reports/TASK-ES-664/provide-run.cjs`(mockplan · measure · claims). 다시 쓴 도구: `reports/TASK-ES-614/mock-unwire.cjs` · `run-tests-each.cjs` · `reports/TASK-ES-636/state-probe.cjs` · `scripts/probes/cell-registry-compare.js`
- 손대지 않은 것: `index.html` · `tests/**` · `scripts/**` · `court/**` · 철거 생성기 `gen-inline-hard.js` · 등록 기관 `js/core/cell-registry*.js` · 생성 지도
- 화면 식별자(시나리오 — #933 의 12개를 그대로): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnGoalsSubPersonal` · `#btnGoalsSubRoutine` · `#btnGoalsSubStats` · `#btnGoalsSubTeam` · `#homeAddGoal` · `#ngCancelBtn` · `#sanctuaryBellBtn` · `#closeNotifCenterBtn` · `#btnToggleGoalAgent` · `#goalAgentInput` · `#setTermsLink` · `#setPrivacyLink` · `#legalBody` · `#landLoginLink` · `#forgotPassBtn` · `#micBtn` · `.comm-subtab[data-sub="group"]` · `#recSamplePurgeBtn` · `#goalFastAddInput` · `#btnGoalFastAddSubmit` · `#exportRecordsBtn` · `#expThemeSel`

## 1. [원칙 ①] 문제를 정확히 파악한다

- 구역 이전(#933) 뒤 인라인 IIFE 의 큰 몫은 가져오기 184줄 · 통로 노출 175줄 · 손잡이 13줄이다. 구역 함수와 감싸기 세포가 `L.이름` 으로 읽는 이름들은 index.html 이 `var X = _kit.X;` 로 끌어와 `get X(){ return X; }` 로 다시 내주고 있다.
- 그 getter 를 지우려면 다른 누군가가 같은 값을 통로에 내줘야 한다. 그 일을 하는 것이 등록 기관이고, 기관은 **세포가 등록한 이름만** 내준다. 지금 그 이름들 대부분은 등록돼 있지 않다 — B2 때는 IIFE 안 코드만 쓰던 이름이라 통로에 나가지 않았고(등록 대상이 아니었다), 감싸기·구역 이전으로 세포가 읽게 되면서 getter 가 새로 생겼다.
- 등록 생성기(`gen-cell-provide.js`)는 index.html 의 배선을 읽어 등록 대상을 정하고, `--write` 때 모든 세포의 블록을 걷어 낸 뒤 지금 계획대로 다시 붙인다. 철거가 진행된 지금 그대로 돌리면 **이미 배선을 지운 이름의 등록 블록 126개가 사라진다**(계획만 내 보면 `staleBlocksRemoved: 126`). 그 이름들은 이제 기관만 내주고 있어, 등록이 사라지면 앱이 깨진다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 이름의 주인이 그 이름을 내준다. index.html 의 중계 줄을 지우기 전에, 주인 세포가 기관에 등록해 기관이 같은 값을 내주게 한다.
- **원인**: 등록 대상을 「지금 index.html 이 내주는 이름」에서 읽는 생성기라, 철거 뒤에는 과거의 등록을 알 길이 index.html 에 없다. 과거의 등록은 세포 파일의 블록에만 남아 있다.
- **중심**: 생성기 `--keep` — 세포 파일의 기존 블록을 읽어 그대로 두고, 아직 어느 세포도 등록하지 않은 이름만 더한다.
- **핵심**: 「기존 블록을 읽어 다시 만든 글자 == 원래 글자」를 생성기가 스스로 확인한다(다르면 멈춘다). 그래야 이름을 더한 파일에서 달라지는 것이 더한 이름뿐이다. 그리고 등록이 충분한지는 「지금 통과」로는 알 수 없다 — 옛 배선이 같은 값을 다시 내주고 있기 때문이다. 배선을 지운 사본에서 재야 한다.

## 3. [원칙 ③] 해결 방식

1. 생성기에 `--keep` · `--exclude` 를 더한다. `--keep` 은 ① 모든 세포의 기존 블록을 읽고(생성기 꼴이 아니면 멈춤) ② 다시 만든 글자가 원래와 같은지 확인하고 ③ 지금의 계획에서 이미 등록된 이름을 빼 「더할 이름」을 정하고 ④ 그 이름이 든 세포 파일만 블록을 다시 쓴다. 더할 이름이 없는 세포는 건드리지 않는다.
2. window 전용으로 등록됐던 이름에 지금 통로 getter 가 있으면(세포가 `L.이름` 으로 읽게 된 것) `windowOnly` 목록에서 뺀다 — B3a 의 규칙(통로로 나가는 이름은 값 지도에, window 전용만 `windowOnly`) 그대로다. 값 · 주인 · window 목록은 그대로다.
3. 통로 값과 window 값이 서로 다른 이름은 브라우저에서 재서(`pre-probe.json`) `--exclude` 로 뺀다.
4. `--keep --exclude … --write` 로 쓴다. 두 번째 실행은 0 변경(멱등).
5. 측정: 블록 전후 대조(생성기와 다른 방법 — 정규식) · 대조 탐침 · 새 이름의 통로 값 · 시나리오 · 모듈 로드 · npm test · 시험 하나씩.
6. 모의 철거: 저장소 밖 사본에 이 PR 의 세포 파일을 넣고 새로 등록한 이름의 배선을 철거 생성기로 지운다 → 대조 · 시나리오 · 시험. 대조군: 등록 없이 같은 배선만 지운다.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **기존 등록이 빠지거나 달라지지 않았는가** → 기준과 작업 트리의 `js/**` 전부에서 등록 블록을 정규식으로 읽어 이름 단위로 맞댔다: 기준 438개 가운데 사라진 것 0 · 달라진 것은 통로로 올린 8개뿐(`scope` 칸만) · 같은 이름을 두 세포가 등록한 것 0 · 더한 89개가 계획과 같다. 바뀐 49개 파일에서 블록 밖 글자는 기준과 같다.
- **등록 값이 옛 배선 값과 같은가** → 대조 탐침: 불일치 0(등록 값 === 통로의 getter 가 돌려주는 값). 이름별 통로·window 값 지문 차이 0. 등록 438 → 527.
- **「초과 0」** → 탐침의 초과(등록됐는데 옛 배선에 없는 이름)는 기준 76 · 작업 76 으로 같다. 그 76개는 앞선 철거가 배선을 지운 이름이다(등록만 남음 — 정상). 이번에 더한 89개는 전부 옛 배선(getter)에 있는 이름이라 초과가 늘지 않았다.
- **통로로 올린 8개** → 기관이 통로에 내주는 값은 등록 값이고, index.html 의 getter 가 돌려주는 값과 같다(불일치 0). 지금은 getter 가 뒤에 다시 달려 접근자는 그대로 getter 다(이름 탐침: 97개 전부 `get · index.html`). 모의 철거 사본에서는 97개 전부 기관이 내준 값 속성이 되고 값 요약이 기준과 같다.
- **구역 함수 이름(`boot…` 15개)은 등록하지 않았다** → 통로에도 window 에도 나가지 않는 이름이다(IIFE 가 `bootX();` 로 부를 뿐). 등록하면 탐침의 초과가 15 늘고 통로에 새 이름이 생긴다. 그 가져오기 줄은 호출 줄과 함께 finalize 가 지운다.
- **800줄** → `renderTeamGoalsScreen` 은 주인 세포 `js/tabs/goals/team-goals-screen.js` 가 798줄이라 블록을 붙이면 808줄이 된다. 생성기가 건너뛰었다(등록하지 않음 — 그 세포를 나눈 뒤 등록).
- **모듈 가드** → 통과. 800줄 초과 0 · 탭 간 직접 참조 0 → 0.

## 5. [원칙 ⑤] 절차

1. origin/main 기준 worktree · 번호 선점 · `npm ci --ignore-scripts` · 선례(REQ 611 · 614)와 생성기 · 등록 기관 읽기.
2. 지금 계획을 쓰기 없이 내 봄 → 걷어 낼 블록 126 을 확인 → `--keep` 구현 → 고치기 전·후 계획 동일 확인.
3. 더할 이름의 통로·window 값을 브라우저에서 잼 → 제외 2개 → `--write` → 멱등 확인.
4. 기준 · 모의 · 대조군 임시 트리 → 모의 철거 → npm test · 시험 하나씩(기준 · 작업 · 모의) → 측정 → 붙잡힌 이름 1개를 찾아 빼고 모의 철거 다시 → 측정.
5. REQ · 작업표 → npm test 작업 트리 다시(L064) → 측정 · 주장 → 무결성 게이트 → 커밋 → 로컬 법정(요약을 읽은 뒤 커밋) → push 한 번 → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「이름을 더하는 스크립트를 따로 쓰면 되지 생성기를 왜 고치나」** → 등록 블록의 글자(줄 나눔 · 정렬 · window 목록)는 생성기의 `blockFor` 가 정한다. 따로 쓴 스크립트는 그 글자를 흉내 내야 하고, 다음에 생성기를 돌릴 때 글자가 달라질 수 있다. 같은 함수로 쓰게 하고 「읽어서 다시 만든 글자 == 원래 글자」를 확인하는 편이 결정론이 분명하다. 고친 것은 더한 것뿐이다 — `--keep` 없이 돌린 계획은 고치기 전과 같다.
- **반론 2 「window 전용을 통로로 올린 것은 기존 등록을 바꾼 것이다」** → 맞다, 그 8개는 `windowOnly` 목록에서 빠졌다. 올리지 않으면 그 이름의 getter 는 영영 지울 수 없다(L102 — window 전용으로 등록된 이름의 getter 는 지우면 안 된다). B3a 가 window 전용으로 둔 까닭은 그때 통로에 나가지 않던 이름이라서였고, 지금은 세포가 통로로 읽는다. 이름 · 값 · 주인 · window 목록은 그대로다. **기존 등록을 건드리지 말아야 한다고 보시면 돌려보낼 지점이다.**
- **반론 3 「지금 다 통과하니 충분하다」** → 지금은 옛 배선이 같은 값을 다시 내주므로 등록이 틀려도 통과한다. 그래서 모의 철거를 했다: 새로 등록한 이름의 배선 195줄(붙잡힌 이름 하나를 뺀 것)을 지운 사본에서 대조 불일치 0 · 통로에서 사라진 이름 0 · 지문 차이 0 · 시나리오 12개 통과 · npm test 와 시험 하나씩이 기준과 같다. 대조군(등록 없이 같은 배선을 지움)은 `TypeError: L.bindSupabaseAuthStateListener is not a function` 으로 부팅이 멈춘다.
- **재검증(법정이 이 PR 을 재는 방식 — 숨기지 않는다)**: R1 의 화면 주장 12건은 동작 보존(`change: preserve`) 주장이다. 법정은 보존 주장에 생성기 재실행 증명 파일(CELL_SPLIT 용 `proof`)을 요구하는데, 이 PR 은 index.html 을 바꾸지 않고 철거 생성기를 돌리지 않아 그 증명 형식이 성립하지 않는다. 그래서 법정은 그 12건을 「확인 못 함(분열 증거 검증 미달: 증명 파일 지정 누락)」으로 찍는다(로컬 법정 예비 점검에서 그렇게 찍혔다 — B1 · B2 · B3a 와 같은 꼴). 선례와 같은 배치로 R1 에 법정이 글자로 잴 수 있는 기록 주장(모듈 로드 새 회귀 0 · index.html 변경 0 · 게스트 부팅 예외 0)을 함께 둔다. 법정이 R1 을 「글자만 확인」으로 찍더라도 그것은 **법정이 화면 동작을 다시 재었다는 뜻이 아니다** — 화면 동작 · 대조 탐침 · 모의 철거는 작업자 측정이다.
- **재검증(붙잡힌 이름)**: 붙잡힌 이름을 빼지 않고 202줄을 다 지운 사본에서는 `tests/gcal-login-reconnect-fix.test.js` 25행이 깨진다 — index.html 에 `window.saveGoogleToken = saveGoogleToken;` 글자가 있는지 보는 단언이다(같은 파일의 다른 단언은 #TASK-ES-620 에서 「옛 배선 글자 또는 등록」으로 넓혔는데 이 줄은 그대로다). `pinned-names.json` 에 적었고, 시험은 고치지 않았다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-664/` 아래. 수치는 `measurement.json` 이 각 결과에서 읽어 모은 것이다(L002).

| 파일 | 무엇 |
|---|---|
| `provide-plan.json` | 생성기 계획(`--keep`): 기존 등록 438개(세포 167개) · 지금 계획 126 · 이미 등록됨 34 · **더함 89** · 통로로 올림 8 · 제외 2 · 건너뜀 1(800줄) · 바뀌는 파일 49(새 블록 21) |
| `provide-exclude.json` · `pre-probe.json` | 더하지 않는 이름 2개와 근거(통로 값 ≠ window 값 — 브라우저 측정) |
| `cell-registry-compare.{base,base2}.json` · `cell-registry-compare.json` | 대조 탐침: 등록 438 → 527 · 불일치 0 · 이중 등록 0 · 초과 76 = 76 · 누락 164 → 74 · 통로에서 사라진 이름 0 · 지문 차이 0 · 예외 0 |
| `name-probe.{base,work,mock}.json` · `probe-names.json` | 새 이름 97개(더한 89 + 올린 8)의 통로 값 요약 — 기준·작업·모의 동일 |
| `scenario-local.json` · `scenarios/` | 시나리오 12개 기준·작업 통과 |
| `module-load.json` · `raw/` · `tests-{base,work}.json` | 모듈 로드 새 회귀 0 · npm test 기준/작업 같음 · 시험 하나씩 같음 |
| `mock-plan.json` · `mock-unwire-all.json` · `tests-mock-all.json` · `pinned-names.json` | 모의 철거(전부): 202줄 삭제 → 시험 1개 깨짐 → 붙잡힌 이름 `saveGoogleToken` |
| `mock-unwire.json` · `cell-registry-compare.mock.json` · `scenario-mock.json` · `tests-mock.json` | 모의 철거(붙잡힌 이름 제외): 195줄 삭제 · 가져오기 184 → 89 · 대조 불일치 0 · 사라진 이름 0 · 지문 차이 0 · 시나리오 12개 통과 · npm test · 시험 하나씩 기준과 같음 |
| `ctrl-unwire.json` · `cell-registry-compare.ctrl.json` | 대조군(등록 없이 같은 배선 삭제): 게스트 부팅이 예외로 멈춤 |
| `measurement.json` | 위 전부 + 블록 전후 대조 · 바뀐 파일 범위 · 모듈 가드 · 무결성 게이트 · inlineScriptLines 기준 = 작업 |
| `claims.json` | 주장(보존 12 + 기록) |
| `court-local.json` | 로컬 법정 전체 실행 요약(작업자 PC — 판정 아님) |

### 등록하지 않은 이름 (다음 단계의 입력)

| 이름 | 수 | 왜 | 무엇이 되면 풀리는가 |
|---|--:|---|---|
| `switchTab` · `handleDeepLinkRouting` | 2 | 통로 값과 window 값이 서로 다르다(지시: 등록하지 않고 보고) | 값을 하나로 맞추는 선행 PR(동작 주장 필요) |
| `renderTeamGoalsScreen` | 1 | 주인 세포가 798줄 — 블록을 붙이면 800줄을 넘는다 | 그 세포를 책임 단위로 나눈 뒤 등록 |
| 구역 함수 `boot…` | 15 | 통로·window 로 나가지 않는 이름(IIFE 가 부를 뿐) — 등록하면 초과 | finalize 가 가져오기·호출 줄을 함께 지운다 |
| 그 밖의 가져오기 | — | IIFE 안 코드(남은 944줄 함수 등)만 맨이름으로 쓰고 통로·window 로 나가지 않는다 | 그 코드가 세포로 옮겨져 getter 가 생기면 그때 등록 |
| (재철거에서 제외) `saveGoogleToken` 의 window 줄 | 1 | 시험이 그 글자를 붙잡는다 | 시험 수정 결심 |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 다른 PR 이 세포 파일을 고쳐 충돌할 수 있다(등록 블록은 파일 끝) → main 을 합친 뒤 세포 파일을 main 판으로 두고 생성기를 다시 돌린다(멱등).
- **예상**: 등록 블록을 붙인 세포가 법정의 800줄 · 모듈 로드 탐침에 걸릴 수 있다 → 생성기가 800줄을 넘는 세포를 건너뛰고, 모듈 로드 탐침 새 회귀 0 을 쟀다.
- **측정불가**: 로그인 뒤에만 불리는 연결 함수(로그인 · 로그아웃 · 세션 채널 등)의 동작 — 대조 탐침의 값 일치와 지문으로만 쟀다. 운영 환경.
- **성과 측정**: 이 PR 자체의 `inlineScriptLines` 변화는 0 이다(index.html 변경 0). 등록 이름 438 → 527. 이 등록으로 다음 재철거가 지울 수 있는 줄은 모의 철거 기준 195줄이다(`inlineScriptLines` 1904 → 1709 예상, 가져오기 184 → 89).
