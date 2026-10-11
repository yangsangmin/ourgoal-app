# REQ — #TASK-ES-674 미분화 덩어리 해체 재철거 2차: 등록 2차로 풀린 이름 122개의 가져오기·getter 줄과 참조 0 손잡이 줄 3개

- Task ID: **TASK-ES-674** (L012: `gh pr list --state all` · `git ls-remote origin` · origin/main 의 작업표에서 674 가 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-674-unwire-2` 를 먼저 push 해 선점했다. 664~673 은 다른 작업 몫이다.)
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「배선 철거」**(경험칙 L069 · L072 · L073 · L075 · L102, 선례 #907 · #920). 실행기 `docs/design/harness/module-split/unwire-run.js`(apply → measure → claims)를 그대로 썼다. 새로운 점은 없다 — 대상 이름을 「지금의 등록 블록」에서 읽는 것만 다르다(등록 2차 #940 뒤라 1차 등록 계획 기록만으로는 모자라다).
- 작업참고 기준 PR #934(d55d7595, 경험칙 115개) · 기준 main 3c9b9335(#941 상태 이전 3차 병합 뒤 — 착수는 aa7ed6c7(#940)였고 #941 이 먼저 병합돼 그 main 에서 등록 목록 · 모의 · 생성기 실행을 처음부터 다시 했다, L010).
- 지시함(origin/main) 열린 지시: **DIR-003**(철거 PR 마다 기준선에 inlineScriptLines 기록 — 줄지 않으면 실패) · **DIR-004**((가) 생성기 줄 종류 닫힌 목록 — 이번에 쓰는 것은 U1(가져오기 줄) · U2(expose getter 줄) · X2(손잡이 줄 `dropKitVar`) · (다) 시험이 글자로 붙잡은 이름은 남겨 둔다).
- **상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d — 글자 그대로)**: 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마. 지침이나 결심이 필요한점?」
- 이 작업 세션은 빌더다. 병합은 하지 않는다(오케스트레이터 몫).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

`unwire-run.js claims` 가 주장 파일에 적는 지시 항목(R1~R4)이 정본이다. 요지:

- **R1** index.html 인라인 IIFE 에서, 등록 기관이 같은 값을 내주는 이름의 배선을 생성기(`gen-inline-hard.js` mode:"unwire", 한 설정 11칸)로 지우고 앱 동작을 보존한다(손 편집 0).
- **R2** 지운 이름은 등록 기관(own)이 같은 값으로 내준다: 철거 전 이름 목록으로 대조해 불일치 0 · 통로에서 사라진 이름 0 · 이름별 값 지문 차이 0.
- **R3** 지우는 대상은 설정이 허용한 줄 종류뿐이고 names 밖 이름·함수 본문·그 밖의 글자는 바꾸지 않는다. 바뀐 제품 파일은 index.html 하나다.
- **R4** 증명 하한: 인라인 줄 수 감소와 기준선 기록 · 모듈 로드 새 회귀 0 · npm test 검사 수 동일·폐기 0 · tests/ · 금고 · 생성기 · 등록 기관 변경 0.
- (지시 항목 밖의 보고) 이 PR 을 반영한 index.html 에서 남은 배선과 덩어리의 줄 구성을 다시 재서 보고 파일로 남긴다(다음 단계 계획의 입력 — 주장으로 걸지 않는다).

범위 밖(지우지 않음): `saveGoogleToken` 의 가져오기 · getter · window 줄(시험이 window 줄 글자를 붙잡는다 — 3절) · 등록되지 않은 이름(구역 함수 `boot…` 17개 · `switchTab` · `handleDeepLinkRouting` · `renderTeamGoalsScreen` 등)의 줄 · 상태 기관이 맡은 이름 · IIFE 안 잔존 참조가 있는 가져오기 줄 · window 줄 `SHARED_GROUPS_LOADED` · `shareContent`.

### 구체 식별자

- 파일: `index.html`(인라인 IIFE 머리의 가져오기 줄 · `OurgoalAppScope.expose('index.html', {…})` 속성 줄과 빈 expose 문 · 손잡이 줄) — 바뀐 제품 파일은 이것 하나. `js/core/cell-registry.js` · 세포 파일은 기준과 같다.
- 실행 11칸(`reports/TASK-ES-674/proof.json` `unwire` 배열, 이름 122개 — 등록 2차가 더하거나 통로로 올린 이름 96 · 그 전에 등록된 이름 26):
  - 1차(가져오기·getter 모두): `_settingsKit` 45(`bind…` 29 · `checkKakaoInAppBrowser` · `closeAppEvaluationModal` · `showLegalModal` · `performLogout` 등, + `dropKitVar`) · `_goalsKit` 21(`bindTeamCommentClick` · `TEAM_COMMENTS_CACHE` · `groupState` 등) · `_uiKit` 26(`bindSupabaseAuthStateListener` · `connect…` 5 · `runAppBoot` · `setTab` · `triggerHaptic` 등) · `_recordsKit` 18(`bindCapturePhoto` · `openRecordModal` · `openMicPermissionGuideModal` · `openShareToFeedModal` 등) · `_commKit` 1(`MOCK_PEOPLE`) · `_authSocialKit` 2(`bindGoogleLoginClicks` · `bindKakaoLoginClicks`, + `dropKitVar`) · `_curatedMarketDataKit` 1(`CURATED_MARKET_TEMPLATES`, + `dropKitVar`)
  - 2차(가져오기 줄은 남김, getter 만 — IIFE 안 코드가 아직 맨이름으로 쓴다): `_uiKit` 4(`closeModal` · `saveProfile` · `toast` · `uid`) · `_recordsKit` 2(`openTemplateMarketModal` · `renderRecordsScreen`) · `_commKit` 1(`daysFromNow`) · `_modalOpenKit` 1(`openModal`)
- 생성기 `docs/design/harness/module-split/gen-inline-hard.js`(변경 0) · 실행기 `unwire-run.js`(변경 0) · 모의 철거 `reports/TASK-ES-614/mock-unwire.cjs`(변경 0 — 실행을 키트·차수로 나누는 데 썼다)
- 새 도구(제품 코드 아님): `reports/TASK-ES-674/registered-now.cjs`(세포 파일의 등록 블록에서 지금 등록된 이름 목록을 읽는다) · `reports/TASK-ES-674/remaining-wiring.cjs`(#920 의 것에서 등록 목록의 출처 한 줄만 바꿈) · `reports/TASK-ES-674/iife-composition.cjs`(#920 의 것 그대로)
- 화면 식별자(시나리오 12개 — #940 의 것 그대로): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnGoalsSubPersonal` · `#btnGoalsSubRoutine` · `#btnGoalsSubStats` · `#btnGoalsSubTeam` · `#homeAddGoal` · `#ngCancelBtn` · `#sanctuaryBellBtn` · `#closeNotifCenterBtn` · `#btnToggleGoalAgent` · `#goalAgentInput` · `#setTermsLink` · `#setPrivacyLink` · `#legalBody` · `#landLoginLink` · `#forgotPassBtn` · `#micBtn` · `.comm-subtab[data-sub="group"]` · `#recSamplePurgeBtn` · `#goalFastAddInput` · `#btnGoalFastAddSubmit` · `#exportRecordsBtn` · `#expThemeSel`

## 1. [원칙 ①] 문제를 정확히 파악한다

감싸기 · 구역 이전으로 세포가 `L.이름` 으로 읽게 된 이름마다 index.html 머리에 `var X = _kit.X;` 와 `get X(){ return X; }` 두 줄이 달려 있다. 등록 2차(#940)가 그 이름들을 주인 세포의 등록 블록에 더해, 이제 등록 기관이 IIFE 직전 commit 에서 같은 값을 통로에 먼저 내준다. index.html 의 두 줄은 같은 값을 한 번 더 내주는 겹친 줄이 됐다. 지금 main 에서 다시 재니(`remaining-wiring.before.json`) 등록됐는데 배선이 남은 이름이 155개 — getter 줄이 남은 것 123 · 가져오기 줄만 남은 것 32 다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 같은 값을 두 번 내주는 줄을 걷어 낸다. 이름과 값은 그대로, 내주는 길만 등록 기관 하나로 줄인다.
- **원인**: 옮기기 생성기는 「머리에 getter 가 없으면 단다」만 알고, 그때는 등록되지 않은 이름이라 등록 기관이 내줄 수 없었다. 등록이 뒤따라온 지금 지울 수 있다.
- **중심**: 생성기 unwire 한 번, 설정 `reports/TASK-ES-674/proof.json` 의 `unwire` 배열 11칸.
- **핵심**: 「등록됐다」와 「기관이 통로에 내준다」는 다르다(L102). 대상은 지금의 등록 블록에서 **통로로 나가게** 등록된 이름의 getter 뿐이다 — window 전용으로 등록된 이름의 getter 는 넣지 않는다(이번 대상에 그런 이름 0). 그리고 철거 전 이름 목록으로 고정한 대조에서 「통로에서 사라진 이름 0」으로 확인한다.

## 3. [원칙 ③] 해결 방식

1. `registered-now.cjs` — 세포 파일 끝의 등록 블록을 글자로 읽어 지금 등록된 이름 527개의 목록을 만든다(통로 346 · 통로+window 105 · window 전용 76). 블록과 등록 계획 기록(1차 · 2차)이 어긋나면 멈춘다.
2. `mock-unwire.cjs` 를 저장소 밖 사본에서 돌려 대상을 키트·차수로 나눈다. 이 도구의 규칙: 등록이 window 뿐인데 getter 가 있는 이름 · getter 가 돌려주는 이름이 등록한 가져오기 이름과 다른 이름은 넣지 않는다 · 가져오기 줄과 자기 getter 줄을 지운 뒤 IIFE 안 다른 줄에 참조가 남지 않으면 1차, 남으면 2차(getter 만).
3. 뺀 이름은 하나 — `saveGoogleToken`. `tests/gcal-login-reconnect-fix.test.js` 25행이 index.html 의 `window.saveGoogleToken = saveGoogleToken;` 글자를 붙잡는다(#940 의 모의 철거에서 그 줄을 지운 사본만 그 시험이 깨졌다). 생성기의 한 실행은 한 이름의 줄 종류를 따로 고르지 못해 이름째 뺐다(가져오기 · getter · window 세 줄이 남는다).
4. 손잡이 줄: 그 키트의 가져오기가 전부 지워져 참조가 0 이 되는 `_settingsKit` · `_authSocialKit` · `_curatedMarketDataKit` 에 `dropKitVar`.
5. `unwire-run.js apply --runs … --names-for …` 로 `proof.json` 을 쓰고 생성기를 돌렸다. 생성기가 멈춘 이름 0(122개 전부).

## 4. [원칙 ④] 재검토 (반례·부작용)

- **지운 이름이 통로에서 사라지지 않는가** → 철거 전 이름 목록으로 대조: 통로에서 사라진 이름 0 · 불일치 0 · 이름별 값 지문 차이 통로 0 · window 0(`cell-registry-compare.before.json` · `cell-registry-compare.json` · `measurement.json` `summary.compare` · `fingerprints`).
- **가져오기 줄을 지운 이름을 IIFE 가 아직 쓰는가** → 생성기가 실행마다 잔존 참조를 보고 멈춘다. 멈춤 0. 참조가 남는 8개는 2차(가져오기 줄을 남김)로 돌렸다.
- **글자 검색이 「시험이 붙잡음」으로 잡은 다섯 이름을 지웠다**(`openMicPermissionGuideModal` · `openModal` · `openShareToFeedModal` · `showLegalModal` · `triggerHaptic`) → 글자 검색(`pinned-names.cjs`)은 시험 소스에 `window.이름 =` 같은 글자가 있으면 넓게 잡는다. 이 다섯은 index.html 에 window 줄이 이미 없고 남은 것은 가져오기 · getter 줄뿐이다. 시험이 실제로 붙잡는지는 시험이 잰다: npm test 와 시험 하나씩이 기준과 같다(8절). 깨졌다면 그 이름을 빼고 다시 돌렸을 것이다.
- **허용 종류 밖의 줄** → 실행 11칸을 차례로 되짚어 기준 index.html 에서 작업 index.html 을 다시 만들었다: 같음(`onlyDeletions.rebuiltEqualsWork`), 허용 종류 밖 삭제 [] · names 밖 이름 []. 지운 것은 가져오기 114줄 · getter 속성 122줄 · 속성이 다 빠진 expose 문 6개의 머리·꼬리 줄 · 손잡이 3줄(합 251줄)과 쉼표 5글자(`unwire-meta.json` `totals`).
- **세포가 실제로 그 이름을 읽는 길** → 시나리오 12개가 지운 이름을 통로로 읽는 구역 함수와 세포를 실제로 지난다: 게스트 부팅(구역 함수 전부가 `L.bind…` · `L.connect…` · `L.runAppBoot` 를 읽는다 — 등록이 없던 대조군은 여기서 멈췄다, #940) · 여섯 탭 · 목표 하위 탭 · 종 모달 · 새 목표 창 · AI 어시스턴트 서랍 · 약관·개인정보 링크 · 비밀번호 찾기 · 마이크 안내 창 · 모임 구획 · 샘플 정리 · 빠른 목표 추가 · 내보내기 테마. 시나리오가 누르지 않는 이름(로그인 뒤에만 불리는 것)은 이름 전수 대조와 값 지문으로 잰다.
- **시험** → npm test 종료 코드와 검사 줄이 기준과 같고, 시험을 하나씩 돌린 결과도 같다(8절).

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · 번호 선점 · `npm ci --ignore-scripts` · 기준 · 모의 작업 폴더(분리 HEAD, 저장소 밖).
2. `registered-now.cjs` → `pinned-names.cjs` → `remaining-wiring.cjs`(철거 전) → `mock-unwire.cjs`(실행 나누기).
3. `unwire-run.js apply` → `remaining-wiring.cjs`(철거 후 — 참조 0 손잡이 확인) → `module-guard --update`.
4. REQ · 작업표 → npm test 와 시험 하나씩(기준 · 작업, 전경으로 끝까지) → `unwire-run.js measure` → `unwire-run.js claims` → `iife-composition.cjs`.
5. 무결성 게이트 → 커밋 → `recomputeSplit` 직접 호출 · 로컬 법정 전체 실행(요약을 읽은 뒤 커밋) → push 직전 origin/main 재확인 → push 한 번 → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「모의 철거 사본에서 이미 쟀으니(#940) 다시 잴 것이 없다」** → #940 의 모의는 그때의 index.html 에서 이름 96개를 지운 것이다. 이번은 그 뒤 병합된 #941 까지 든 main 에서, 앞서 등록된 이름 26개와 손잡이 3줄을 더해 지운다. 그래서 대조 · 시나리오 · 시험을 전부 다시 쟀다.
- **반론 2 「글자 검색이 붙잡았다고 한 다섯 이름을 지운 것은 지시(시험이 붙잡는 줄은 뺀다)에 어긋난다」** → 지시의 기준은 「npm test 가 기준과 같아야 한다」다. 다섯 이름의 시험 글자는 window 대입 꼴 · 세포 파일 안의 글자 · 시험 보조 자료이고, index.html 의 가져오기 · getter 줄을 보지 않는다. 지운 뒤 npm test 와 시험 하나씩이 기준과 같다. **글자 검색에 걸린 이름은 측정과 상관없이 남겨야 한다고 보시면 돌려보낼 지점이다**(그 다섯을 빼고 다시 돌리면 된다 — 10줄이 남는다).
- **반론 3 「`saveGoogleToken` 의 getter 는 지워도 된다」** → 맞다, 붙잡힌 것은 window 줄뿐이다. 하지만 unwire 한 실행은 켠 줄 종류를 names 전체에 적용한다(1차 = 세 종류, 2차 = getter · window). getter 만 지우는 칸이 없어 이름째 뺐다. 시험 넓히기 PR 이 병합되면 세 줄을 한 번에 지운다.
- **재검증(등록 목록의 출처)**: `remaining-wiring.cjs` 의 #920 판은 1차 등록 계획 기록(438개)을 읽는다. 그대로 쓰면 등록 2차의 89개가 「등록되지 않은 이름」으로 잡혀 대상에서 빠진다. 등록 블록을 직접 읽는 목록으로 바꿨고, 블록과 계획 기록 두 벌이 이름 · 주인 파일 · 키트 · 멤버까지 맞는지 도구가 확인한다(어긋나면 멈춤).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-674/` 아래. 수치는 `measurement.json` 이 각 결과에서 읽어 모은 것이다.

| 파일 | 무엇 |
|---|---|
| `registered-now.json` | 지금 등록된 이름 527개(등록 블록에서 읽음) |
| `pinned-names-now.json` · `unwire-exclude.json` | 글자 검색 결과 · 뺀 이름 1개와 사유 |
| `mock-unwire.json` · `raw-runs.txt` · `raw-names-for.txt` | 실행 나누기(저장소 밖 사본) · apply 에 준 인자 |
| `proof.json` · `unwire-meta.json` | 생성기 설정(실행 11칸) · 생성기 산출 기록(지운 줄 번호 · 종류) |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 대조 탐침(철거 전 이름 목록으로 고정) |
| `scenario-local.json` · `scenarios/` | 시나리오 12개 기준·작업 |
| `module-load.json` · `raw/` · `tests-base.json` · `tests-work.json` | 모듈 로드 · npm test · 시험 하나씩 |
| `measurement.json` · `claims.json` | 측정 모음 · 주장 |
| `remaining-wiring.before.json` · `remaining-wiring.json` · `iife-composition.json` | 남은 배선(철거 전·후) · 덩어리의 줄 구성 |
| `court-local.json` | `recomputeSplit` 직접 호출과 로컬 법정 전체 실행 요약(작업자 PC — 판정 아님) |

### 남은 가져오기 이름과 풀리는 조건 (`remaining-wiring.json` — 이 PR 뒤 72개)

| 묶음 | 수 | 무엇이 되면 풀리는가 |
|---|--:|---|
| 등록됨 · IIFE 안 코드가 아직 맨이름으로 씀 | 40 | 그 코드(남은 함수 여섯 · 로드 중 문)가 세포로 옮겨지면 참조가 0 이 된다 → 재철거 3차(944줄 3단계 병합 뒤) |
| 등록됨 · 시험이 글자로 붙잡음(`saveGoogleToken`) | 1 | 시험 넓히기 PR 병합 뒤 |
| 등록 안 됨 · 구역 함수 `boot…` | 17 | finalize 가 가져오기·호출 줄을 함께 옮긴다 |
| 등록 안 됨 · 통로 값 ≠ window 값(`switchTab` · `handleDeepLinkRouting`) | 2 | 값을 하나로 맞추는 선행 PR 뒤 등록 → 철거 |
| 등록 안 됨 · 주인 세포 800줄 상한(`renderTeamGoalsScreen`) | 1 | 그 세포를 나눈 뒤 등록 → 철거 |
| 등록 안 됨 · IIFE 안 코드만 씀(통로로 안 나감) | 10 | 그 코드가 세포로 옮겨져 getter 가 생기면 등록 → 철거 |
| 등록 안 됨 · 참조 0(`a11ySwitch`, 손잡이 `_ui`) | 1 | 닫힌 목록에 「등록되지 않은 참조 0 가져오기 줄」 종류가 없다 — sweep · finalize 의 몫으로 보고만 한다 |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 다른 index.html PR(944줄 3단계 등)이 먼저 병합된다 → index.html · 기준선을 main 판으로 두고 등록 목록부터 생성기까지 다시 돌린다(L010). 이번에도 #941 뒤 한 번 그렇게 했다.
- **예상**: 법정의 생성기 재실행 대조가 로컬과 다를 수 있다 → push 전에 `recomputeSplit` 을 직접 부르고 로컬 법정을 전체 실행한다(L070 · L088).
- **측정불가**: 로그인 뒤에만 불리는 연결 함수(로그인 · 로그아웃 · 탈퇴 · 세션 채널 · 소셜 로그인)의 동작 — 이름 전수 대조와 값 지문으로만 쟀다. 운영 환경.
- **성과 측정**: 지운 줄 251(index.html). `inlineScriptLines` 전→후와 기준선 기록은 `measurement.json` `summary.inlineScriptLines` · `docs/architecture/module-baseline.json` 마지막 기록. 남은 가져오기 186 → 72 · 통로 getter 이름 129 → 7 · 손잡이 13 → 10(`remaining-wiring.before.json` · `remaining-wiring.json` `iife`).
