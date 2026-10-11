# REQ — #TASK-ES-677 미분화 덩어리 해체 등록 3차: 막혔던 세 이름(switchTab · handleDeepLinkRouting · renderTeamGoalsScreen)을 통로 전용으로 등록

- Task ID: **TASK-ES-677** (L012: `gh pr list --state all` · `git ls-remote origin` · origin/main 의 작업표에서 677 이 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-677-provide-3` 를 먼저 push 해 선점했다. 675 · 676 은 다른 작업 몫이다.)
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「세포 등록」 셋째 사례**. 선례 B2(#884) · B3a(#889) · 등록 2차(#940). 방식은 등록 2차와 같다: 등록 줄은 생성기가 쓴다(`--keep`, 손 편집 0) · 대조 탐침 · 저장소 밖 모의 철거 사본과 대조군. 새로운 점은 생성기 옵션 하나(`--compact-over-limit` — 한 줄 꼴 블록)다.
- 작업참고 기준 PR #934(d55d7595, 경험칙 115개) · 기준 main da5116c4(착수는 d86d8366(#943)였고, 작업 중 #944(시험 단언 넓히기) · #945(모듈 가드 규칙) · #946(도구 다섯 개) · #947(무결성 게이트)이 병합됐다 — 넷 다 `index.html` · `js/**` · 등록 생성기 차이 0. 합칠 때마다 등록 생성기를 다시 돌려 0 변경(멱등)임을 확인하고, 기준 · 모의 철거 사본 · 대조군을 그 main 에서 다시 만들어 시험 · 측정을 전부 다시 했다).
- 지시함(origin/main) 열린 지시: **DIR-003**(B 트랙 — 세포가 등록 기관에 스스로 등록) · **DIR-004**.
- **상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d — 글자 그대로)**: 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마. 지침이나 결심이 필요한점?」
- 이 작업 세션은 빌더다. 병합은 하지 않는다(오케스트레이터 몫).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 완료 기준 |
|---|---|---|
| R1 | 등록 2차에서 막혔던 세 이름을 주인 세포의 등록 블록에 **통로 전용**으로 더한다. 앱 동작은 그대로다 | 게스트 시나리오 12개가 기준·작업 양쪽 통과 |
| R2 | 등록 줄은 생성기가 쓴다(손 편집 0). 기존 등록 불변 · 블록 밖 글자 불변 · 800줄 상한(상한·가드 값 변경 0) | 기준의 등록 이름 가운데 사라진 것 0 · 더한 이름 = 계획 · 블록 밖 글자 불변 · 800줄 초과 0 · 한 줄 꼴 세포 = 계획 |
| R3 | 대조 탐침: 등록 수 증가 · 불일치 0 · 이중 등록 0 · 초과 기준과 같음 · 값 지문 차이 0 | `cell-registry-compare.json` |
| R4 | index.html · tests · 금고 · 철거 생성기 변경 0 · 모듈 로드 · npm test · 시험 하나씩 | 측정 파일의 해당 칸 |
| R5 | 모의 철거: 저장소 밖 사본에서 세 이름의 가져오기·getter 줄을 지워도 대조 · 시나리오 · 시험이 기준과 같다 | 모의 사본의 지문 차이 0 · 시나리오 통과 · 시험 결과 |

- 범위 밖(하지 않음): `window.switchTab` · `window.handleDeepLinkRouting` 에 달린 값을 통로 값과 맞추는 일(동작 변경 — 사실만 4절에 적는다) · 실제 재철거(다음 PR) · `a11ySwitch` 가져오기 줄 삭제(사실만 8절에 적는다).

### 구체 식별자

- 고친 생성기: `docs/design/harness/module-split/gen-cell-provide.js` — `--compact-over-limit`(보통 꼴 블록을 붙이면 800줄을 넘는 세포에만 한 줄 꼴 블록) · `blockFor(entry, oneLine)` · `--keep` 이 한 줄 꼴로 붙어 있던 블록을 한 줄 꼴로 다시 만들어 맞댄다. 옵션 없이 돌린 계획은 고치기 전과 같다(같은 트리에서 두 판의 계획 JSON 동일).
- 고친 세포 3개(전부 **파일 끝의 등록 블록만**):
  - `js/core/registry-init.js` — 기존 블록에 `switchTab: K.switchTab` 한 항목(166줄 그대로)
  - `js/core/deep-link-gateway.js` — 새 블록 `R.provide('core/deep-link-gateway', { handleDeepLinkRouting: K.handleDeepLinkRouting }, { window: [] })`(26 → 36줄)
  - `js/tabs/goals/team-goals-screen.js` — 새 블록 **한 줄 꼴** `R.provide('goals/team-goals-screen', { renderTeamGoalsScreen: K.renderTeamGoalsScreen }, { window: [] })`(798 → 799줄 — 보통 꼴이면 808줄)
- 새 도구(제품 코드 아님): `reports/TASK-ES-677/provide-run.cjs`(등록 2차의 것에서 등록 블록 읽기를 한 줄 꼴까지 넓힘 — 작업 트리의 보통 꼴 블록 189개는 옛 식과 새 식의 읽기 결과가 같다)
- 손대지 않은 것: `index.html` · `tests/**` · `scripts/**` · `court/**` · 철거 생성기 `gen-inline-hard.js` · 등록 기관 `js/core/cell-registry*.js` · 모듈 가드와 상한 값 · 생성 지도
- 화면 식별자(시나리오 12개 — #943 의 것 그대로): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnGoalsSubPersonal` · `#btnGoalsSubRoutine` · `#btnGoalsSubStats` · `#btnGoalsSubTeam` · `#homeAddGoal` · `#ngCancelBtn` · `#sanctuaryBellBtn` · `#closeNotifCenterBtn` · `#btnToggleGoalAgent` · `#goalAgentInput` · `#setTermsLink` · `#setPrivacyLink` · `#legalBody` · `#landLoginLink` · `#forgotPassBtn` · `#micBtn` · `.comm-subtab[data-sub="group"]` · `#recSamplePurgeBtn` · `#goalFastAddInput` · `#btnGoalFastAddSubmit` · `#exportRecordsBtn` · `#expThemeSel`

## 1. [원칙 ①] 문제를 정확히 파악한다

재철거 2차(#943) 뒤 index.html 에 남은 통로 getter 이름 7개 가운데 셋 — `switchTab` · `handleDeepLinkRouting` · `renderTeamGoalsScreen` — 은 키트에서 가져온 이름인데 등록 기관에 없어 getter 를 지울 수 없다. 등록 2차(#940)가 이 셋을 등록하지 않은 까닭은 둘이었다: 앞의 둘은 「통로 값과 window 값이 서로 다르다」(그때의 지시 — 등록하지 않고 보고), 마지막 하나는 주인 세포가 798줄이라 10줄짜리 등록 블록을 붙이면 800줄 상한을 넘는다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 통로로 나가는 이름은 주인 세포가 통로에 내준다. window 에 무엇이 달려 있는지는 이 일과 별개다.
- **원인(앞의 둘)**: 「통로 값 ≠ window 값」은 등록 기관의 불일치가 아니다. 등록 기관의 불일치는 ① 등록 값과 통로 getter 가 돌려주는 값이 다르거나 ② **index.html 의 IIFE 가 window 에 대입하는 이름**인데 등록 값과 window 값이 다를 때만 선다(`js/core/cell-registry.js` `report()` · 탐침 `scripts/probes/cell-registry-compare.js` 의 window 이름 출처 = IIFE 최상위 window 대입문). 이 둘은 index.html 이 window 에 대입하지 않는다 — window 의 값은 다른 파일이 단다. 그래서 생성기는 처음부터 이 둘을 **통로 전용**(`window: []`)으로 계획했고, 통로 전용 등록은 window 를 건드리지 않는다.
- **원인(마지막 하나)**: 주인 세포 `team-goals-screen.js` 는 772줄짜리 함수 하나(`renderTeamGoalsScreen`)가 전부다. 떼어 낼 책임 단위가 파일 안에 따로 없다.
- **중심**: 생성기 `--keep --compact-over-limit` 한 번.
- **핵심**: 탐침의 잣대도, 상한도 바꾸지 않는다. 앞의 둘은 등록 꼴(통로 전용)이 처음부터 맞았고, 마지막 하나는 같은 문장을 한 줄로 이어 쓴 블록으로 상한 안에 든다.

## 3. [원칙 ③] 해결 방식

1. 세 이름의 통로 값과 window 값을 브라우저에서 잰다(`pre-probe.json` — 4절의 사실).
2. 생성기에 `--compact-over-limit` 를 더한다: 보통 꼴 블록을 붙인 줄 수가 800 을 넘는 세포에 한해 한 줄 꼴(보통 꼴의 각 줄을 앞뒤 공백만 떼고 빈칸 하나로 이은 것 — 문장 · 이름 · 순서가 같다)을 본다. 그래도 넘으면 예전처럼 건너뛴다.
3. `--keep --compact-over-limit --write`(제외 파일 없이). 더한 이름 3 · 바뀐 세포 3 · 두 번째 실행 0 변경.
4. 측정: 블록 전후 대조(정규식 — 생성기와 다른 방법) · 대조 탐침 · 세 이름의 통로 값 · 시나리오 · 모듈 로드 · npm test · 시험 하나씩 · 모의 철거 · 대조군.

### `renderTeamGoalsScreen` — 두 풀이를 견준 것

| 풀이 | 무엇을 하는가 | 본 것 |
|---|---|---|
| (가) 한 줄 꼴 블록 | 등록 블록 10줄을 한 줄로 이어 쓴다 → 799줄 | 생성기 옵션 하나 · 세포의 기존 글자 변경 0 · 상한 값 변경 0. **택함** |
| (나) 책임 단위를 다른 세포로 옮김 | 줄 수를 줄인 뒤 보통 꼴 블록 | 이 세포는 함수 하나(772줄)라 옮길 단위가 없다 — 함수 안을 손으로 쪼개야 하고(생성기 「옮기기」가 아니다) 동작 주장이 필요하다. 택하지 않음 |

(가)의 한계: 이 세포는 여전히 상한 바로 아래(799줄)다. 함수가 한 줄이라도 길어지면 가드에 걸린다 — 그때는 (나)가 필요하다. 그 세포가 가벼워져 보통 꼴이 들어가게 되면 생성기의 다음 실행은 보통 꼴로 쓴다(규칙이 줄 수만 본다).

## 4. [원칙 ④] 재검토 (반례·부작용) — 「통로 값 ≠ window 값」의 실체

브라우저에서 게스트 부팅 뒤 잰 것(`pre-probe.json` `extra` · `names`):

| 이름 | 통로(`L.`)로 읽는 값 | window 에 달린 값 | 누가 window 에 다는가 |
|---|---|---|---|
| `switchTab` | 키트의 `switchTab` — `function switchTab(tab){ return setTab(tab); }`(`js/core/registry-init.js` 144행) | 키트의 `setTab` 그 자체 | 구역 함수 `js/core/boot-entry-wiring.js` 152행 `window.switchTab = L.setTab;` |
| `handleDeepLinkRouting` | 키트의 관문 함수 — `if(window.OurgoalViralSharing) window.OurgoalViralSharing.handleDeepLinkRouting();`(`js/core/deep-link-gateway.js` 19행) | `js/viral-sharing.js` 의 실제 함수 | `js/viral-sharing.js` 337행 `global.handleDeepLinkRouting = handleDeepLinkRouting;` |
| `renderTeamGoalsScreen` | 키트의 함수 | 같은 함수 | (값이 같다 — index.html 이 대입하지 않는 이름) |

- **감싸개인가 다른 함수인가** → 둘 다 감싸개다. 통로 값이 window 값을 부른다: `switchTab` 은 `setTab` 을 그대로 부르고, 관문 함수는 `OurgoalViralSharing.handleDeepLinkRouting` 을 부른다(그 부품이 없으면 아무 일도 하지 않는다).
- **읽는 쪽이 기대하는 값** → 통로로 읽는 쪽(`L.switchTab` — crew-pacing · peer-invite · quest-summary · checkin-feedback · growth-chart · records/render · weekly-recap · tab-guide · `L.handleDeepLinkRouting` — `js/core/boot-finish.js` 29행)은 지금도 감싸개를 받는다. window 로 부르는 쪽(`window.switchTab` — notify-engine · sanctuary-* 와 화면의 onclick 글자)은 지금도 `setTab` 을 받는다. 통로 전용 등록은 통로에 **지금과 같은 감싸개**를 내주고 window 는 건드리지 않으므로 양쪽 모두 지금과 같은 값을 받는다.
- **값을 맞춰야 하는가** → 맞추지 않았고, 맞출 필요도 없다. 맞추는 것은 동작 변경이다(통로로 읽는 쪽이 받는 함수가 바뀐다).
- **대조 탐침** → 불일치 0 · 초과는 기준과 같다(세 이름 모두 index.html 의 getter 가 내주는 이름이라 「등록됐는데 옛 배선에 없는 이름」이 아니다). 통로 값 지문 차이 0.
- **기존 등록** → 기준 527개 가운데 사라진 것 0 · 달라진 것 0 · 블록 밖 글자 불변 · 이중 등록 0.
- **한 줄 꼴 블록을 다른 코드가 읽지 못하는가** → 블록 글자를 읽는 것은 생성기(`--keep` — AST 로 읽어 꼴과 무관) · `tests/helpers/wiring-exposed.js`(문 단위로 읽는다) · 작업자 도구(이번에 읽기를 넓혔다)다. npm test 와 시험 하나씩이 기준과 같다.
- **모의 철거** → 저장소 밖 사본에서 세 이름의 가져오기 3줄 · getter 3줄과 빈 expose 문을 지웠다(10줄). 대조 · 시나리오 · 시험이 기준과 같고, 세 이름의 통로 값 요약이 기준과 같다. 대조군(등록 없이 같은 줄을 지움)은 부팅 중 예외가 난다 — `TypeError: L.checkAndHandlePeerInviteUrl is not a function`(구역 함수가 통로에서 `handleDeepLinkRouting` 을 못 읽어 그 이름으로 정의한 값이 비었다). 화면은 뜨고 게스트 진입 단계는 지나간다 — 등록 2차의 대조군처럼 부팅이 멈추지는 않는다. 기준 · 작업 · 모의 철거 사본의 예외는 0 건이다.

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · 번호 선점 · `npm ci --ignore-scripts`.
2. 세 이름의 값 재기 → 생성기 옵션 구현 → 옵션 없이 계획 동일 확인 → `--write` → 멱등 확인.
3. 기준 · 모의 · 대조군 임시 트리 → 모의 철거 → REQ · 작업표 → npm test · 시험 하나씩(기준 · 작업 · 모의) → 측정 → 주장.
4. 무결성 게이트 → 커밋 → 로컬 법정(요약을 읽은 뒤 커밋) → push 직전 origin/main 재확인 → push 한 번 → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「등록 2차가 뺀 이름을 이제 넣는 것은 그때의 판단을 뒤집는 것이다」** → 그때 뺀 근거는 「통로 값 ≠ window 값인 이름은 등록하지 않고 보고한다」는 지시였고, 그 값들이 무엇인지는 재지 않았다. 이번에 재 보니 window 의 값은 index.html 이 아닌 다른 파일이 다는 것이고, 등록 꼴은 통로 전용이라 window 와 무관하다. 탐침의 잣대는 그대로다.
- **반론 2 「한 줄 꼴은 줄 수 상한을 글자 배치로 피한 것이다」** → 그렇게 읽힐 수 있다. 상한이 막으려는 것은 한 세포가 책임을 더 떠안는 것인데, 등록 블록은 책임이 아니라 「이 이름의 주인이 나」라는 신고 한 문장이다. 그리고 이 세포에는 옮길 단위가 없다. 그래도 상한의 뜻을 글자 그대로 지켜야 한다고 보시면(= 블록 줄 수도 책임으로 센다) **돌려보낼 지점이다** — 그러면 이 이름은 그 함수가 쪼개질 때까지 등록하지 않는다(나머지 둘만 등록하면 된다 — `--compact-over-limit` 를 빼고 돌리면 그렇게 된다).
- **반론 3 「지금 다 통과하니 충분하다」** → 지금은 옛 배선이 같은 값을 다시 내준다. 그래서 모의 철거 사본과 대조군으로 쟀다(4절).
- **재검증(읽기 도구)**: 등록 블록을 글자로 읽는 작업자 도구의 식이 줄 머리에 기댔다. 한 줄 꼴에서는 못 읽는다. 식을 넓혔고, 작업 트리의 보통 꼴 블록 189개를 옛 식과 새 식으로 읽은 결과가 같음을 확인했다(다른 것은 한 줄 꼴 블록 하나 — 옛 식은 못 읽는다).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-677/` 아래. 수치는 `measurement.json` 이 각 결과에서 읽어 모은 것이다.

| 파일 | 무엇 |
|---|---|
| `pre-probe.json` · `probe-names.json` | 세 이름의 통로 값 · window 값(등록 전) |
| `provide-plan.json` | 생성기 계획: 더함 3(전부 통로 전용) · 바뀌는 세포 3 · 한 줄 꼴 1(`oneLineBlocks` — 798 → 보통 꼴 808 / 한 줄 꼴 799) · 건너뜀 0 |
| `cell-registry-compare.{base,base2}.json` · `cell-registry-compare.json` | 대조 탐침 |
| `name-probe.{base,work,mock}.json` | 세 이름의 통로 값 요약 — 기준·작업·모의 |
| `scenario-local.json` · `scenarios/` | 시나리오 12개 기준·작업 |
| `module-load.json` · `raw/` · `tests-{base,work}.json` | 모듈 로드 · npm test · 시험 하나씩 |
| `mock-plan.json` · `mock-unwire.json` · `cell-registry-compare.mock.json` · `scenario-mock.json` · `tests-mock.json` | 모의 철거(10줄) 사본의 대조 · 시나리오 · 시험 |
| `ctrl-unwire.json` · `cell-registry-compare.ctrl.json` | 대조군 |
| `measurement.json` · `claims.json` · `court-local.json` | 측정 모음 · 주장 · 로컬 법정 요약(판정 아님) |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 다른 PR 이 같은 세포를 고친다 → main 판 세포에 생성기를 다시 돌린다(멱등). index.html PR 과는 충돌하지 않는다(이 PR 은 index.html 을 바꾸지 않는다). 다만 등록 계획은 index.html 의 배선에서 읽으므로 index.html 이 바뀌면 계획이 그대로인지 다시 본다.
- **측정불가**: `L.switchTab` 을 부르는 단추(홈 퀘스트의 마일스톤 항목 · 기록 탭의 목표 템플릿 단추)는 게스트 화면에 보이지 않아 시나리오로 누르지 못했다(두 개를 시도해 기준 트리에서도 대상이 없었다 — 뺐다). 그 길은 통로 값 지문과 모의 철거 사본의 값 요약으로만 쟀다. 초대 주소로 들어오는 딥링크 길 · 운영 환경.
- **성과 측정**: 이 PR 자체의 `inlineScriptLines` 변화는 0 이다. 등록 이름 527 → 530. 이 등록으로 다음 재철거가 지울 수 있는 줄은 모의 철거 기준 10줄이다.

### 사실 보고 — `a11ySwitch`(지우는 PR 은 만들지 않는다)

- index.html 2263행 `var a11ySwitch = _ui.a11ySwitch;` 는 IIFE 의 지역 변수다. IIFE 안에서 그 변수를 읽는 곳 0 · 대입 0 · 문자열에 그 이름이 든 곳 0 · `eval` · `new Function` · `with` 0(@babel/parser 로 잼). 통로 getter 도 window 대입도 없다.
- 함수 자체는 `js/core/ui-helpers.js` 16행에 있고 설정 탭 세포 여섯 개(`sub-appearance` · `sub-data` · `sub-integrations` · `sub-notify` · `sub-profile` · `sub-security`)가 `U.a11ySwitch(…)` — 키트(`window.OurgoalUiHelpers`)에서 직접 — 로 14번 부른다. index.html 의 지역 변수를 거치지 않는다.
- `tests/` · `scripts/` 에 그 이름의 글자 0. 화면의 onclick 글자에도 없다.
- 그러므로 그 가져오기 줄은 읽는 곳이 없는 줄이다. 지우면 손잡이 `_ui` 의 남는 가져오기는 `escapeHtml` 하나다.
