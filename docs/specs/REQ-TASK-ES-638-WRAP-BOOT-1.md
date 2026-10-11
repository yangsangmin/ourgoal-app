# REQ — 미분화 덩어리 시동 배선 감싸기 1차: 설정 시동 연결 · AI 목표 어시스턴트 서랍 · 바깥 부품 연결 · 서비스 워커

- Task ID: **TASK-ES-638** (L012: `gh pr list --state all --limit 60` · `git ls-remote origin` 에서 638 이 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-638-wrap-boot-1` 를 먼저 push 해 선점했다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main): **DIR-003**(줄을 지우는 PR 마다 기준선에 inlineScriptLines 기록 — 줄지 않으면 실패) · **DIR-004**(CELL-REGISTRY-DESIGN.md 6.2절 순서 3 「함수 이전·감싸기」 — 기존 CELL_SPLIT, 함수 본문의 글자는 고치지 않는다 · 돈 근처 3곳은 자리만 · index.html 을 바꾸는 PR 은 한 번에 하나).
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「어려운 인라인 묶음 감싸기」**(경험칙 L016 · `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` 2-3절 「로드 중 문은 본문만 세포 함수로, 원래 자리에 부르는 한 줄」) + 법정 「동작 보존 확인」 경로(선례 PR #864 TASK-ES-596: 주장에 proof 를 걸면 법정이 기준 커밋의 생성기를 다시 돌려 바이트 대조). 작업참고 **기준 PR #905**(eab4365b).
- 이 작업 세션은 빌더(서브에이전트)다. 병합은 하지 않는다(오케스트레이터 몫).
- 기준 main: 9022e383(#909 상태 기관 js/core/app-state.js 병합 뒤). 착수 b57a8a10 → 5e2fc92c(#908, index.html 그대로) → 9022e383(#909 가 index.html 의 태그 줄을 고쳐 충돌했다 — 손으로 풀지 않고 main 판 index.html 로 같은 설정의 생성기를 다시 돌렸고(L010), 신고서·세포 설명·기준선도 main 판에서 다시 만들었으며 측정을 전부 다시 했다).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

원문의 「남은 미분화작업 모두 진행해」에서 나온 이번 PR 의 몫이다. 원문 전체(인라인 IIFE 0)는 이 PR 하나로 닫히지 않는다 — 남는 것은 8절에 적었다.

- **R1** 설정 시동 연결 네 줄(약관 링크 · 개인정보처리방침 링크 · 시험 계정 단추 정리 · 키보드 가림 방지)을 생성기로 세포 `js/tabs/settings/boot-wiring.js` 에 글자 그대로 옮기고 원래 자리에서 부른다. 동작 보존.
- **R2** 목표 탭 「AI 목표 어시스턴트」 서랍 여닫기 연결을 세포 `js/tabs/goals/goal-agent-toggle.js` 에 옮긴다. 동작 보존.
- **R3** 바깥 부품 다섯 개의 init 연결을 세포 `js/core/module-connect.js` 에 옮긴다. 동작 보존.
- **R4** 서비스 워커 등록 문을 세포 `js/core/pwa-service-worker.js` 에 옮긴다. 동작 보존.
- **R5** 증명 하한(헌법 CELL_SPLIT_PROOF): 토큰 동일·누수 0 · 단독 로드 회귀 0 · 통로·window 이름 값 동일 · npm test 수 동일 · tests·금고·생성기 변경 0.
- **R6** 기준선(`docs/architecture/module-baseline.json`)에 줄어든 inlineScriptLines 를 기록한다(DIR-003).

범위 밖(이번에 건드리지 않음): 체크인 입력 묶음(`qRoutineRow` · `setupVoiceCheckin` · `capturePhotoBtn`) · 팀 댓글 위임(`window.sendTeamGoalComment` 외 2문) · 샘플 정리(`window.purgeSampleRecordsOneClick`) · 빠른 목표 추가 함수(`selectSmartTag` · `handleGoalFastAddSubmit`) — 다음 PR. 테마 try 문 · `setupUserSessionRealtime` · `saveGoogleToken` · `executeDirectTemplateClone` · `openTemplateMarketModal` · `OurgoalTemplateCredit.init` 블록 · `OURGOAL_CONFIG` · `openProTemplateRecordModal` · 3줄 이하 호출문 · 상태 변수 선언.

### 구체 식별자

- 파일: `index.html`(인라인 IIFE) → 새 세포 `js/tabs/settings/boot-wiring.js` · `js/tabs/goals/goal-agent-toggle.js` · `js/core/module-connect.js` · `js/core/pwa-service-worker.js`
- 감싼 함수 11개: `startDevDebugButtons` · `bindTermsLinks` · `bindPrivacyLinks` · `startKeyboardShield`(키트 `OurgoalSettingsKit`) / `bindGoalAgentToggle`(`OurgoalGoalsKit`) / `connectAuthSafety` · `connectReactions` · `connectHelpfulReason` · `connectTeamInviteComm` · `connectTeamLinkedGoals` · `bindServiceWorker`(`OurgoalUiHelpers`)
- DOM id: `#viewTermsBtn` · `#authTermsLink` · `#setTermsLink` · `#viewPrivacyBtn` · `#authPrivacyLink` · `#setPrivacyLink` · `#landTesterBWrap` · `#authTesterBWrap` · `#btnToggleGoalAgent` · `#goalAgentDrawer` · `#goalAgentChevron` · `#goalAgentInput` · `#captureInput` · `#forgotPassBtn` · `#legalBody`
- 생성기 `docs/design/harness/module-split/gen-inline-hard.js`(변경 0) · 검사기 `verify-inline-hard.js`(변경 0) · 설정 `reports/TASK-ES-638/proof.json`(자리 표지 `HO`)
- 이전 전 index.html(9022e383) 문 줄: 2852~2856 · 2924~2927 · 2928~2931 · 3348~3361 · 3478~3482 · 5121~5132 · 5136~5148 · 5155~5161 · 5164~5170 · 5172~5178 · 5186~5216 (출처 `reports/TASK-ES-638/measurement.json` `generator.wrapped`)

## 1. [원칙 ①] 문제를 정확히 파악한다

배선 철거(#891~#907) 뒤 인라인 IIFE 에 남은 것 가운데 「앱이 뜰 때 한 번 도는 문」이 있다. 이 문들은 IIFE 안의 이름(`sb` · `state` · `toast` …)을 맨이름으로 써서, 그 이름들의 가져오기 줄을 지우지 못하게 붙잡고 있다(CELL-REGISTRY-DESIGN.md 6.2 「잔존 참조를 가장 많이 푸는 것은 로드 중 문 이전」). 현재 origin/main 에서 최상위 문을 다시 재니(`@babel/parser`, 저장소 밖 스크립트) 4줄 이상인 로드 중 문은 조사 때의 묶음 W1~W7 과 같은 자리에 그대로 있었다. 이번 PR 은 그중 위험이 낮은 11문(109줄)을 옮긴다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 글자를 고치지 않고 자리만 옮긴다. 문은 세포 함수가 되고 원래 자리에서 같은 순서로 한 번 불린다.
- **원인**: 로드 중 문은 함수가 아니라서 1차 생성기로는 옮길 수 없었고, 인라인 이름을 맨이름으로 쓰기 때문에 덩어리에 남아 있었다.
- **중심**: 생성기 한 번 실행(설정 `reports/TASK-ES-638/proof.json`, 세포 4개 · take 10개 · wrap 이름 11개). 법정은 이 설정으로 기준 커밋의 생성기를 다시 돌려 index.html 과 세포 네 파일을 바이트 대조한다.
- **핵심**: 감싼 코드는 인라인 이름을 `L.<이름>`(통로)으로 읽는다. 그 이름이 통로에 예전과 같은 값으로 있는지가 동작 보존의 급소다 — 이름 지문 대조로 잰다(4절).

## 3. [원칙 ③] 해결 방식

- 후보 A(채택): 표준 이음매 「감싸기」. 새 세포 파일 넷, 기존 탭 키트·기관 키트에 함수를 단다(새 window 전역 0). 기관 키트(`OurgoalUiHelpers`)를 쓰는 두 세포는 그 키트를 통째로 대입하는 `js/core/ui-helpers.js` 태그 **뒤**(`afterTag`)에 둔다(유형 M). 자리 표지는 `HO`(가져오기 줄이 키트 손잡이 선언 뒤에 오게 — L046).
- 후보 B(기각): 기존 세포 파일(`dev-debug-gate.js` · `pwa-install.js` 등)에 덧붙이기 — 생성기 일반 모드는 세포 파일을 통째로 새로 쓰므로 기존 파일의 등록 블록(「세포 등록 시작 · gen-cell-provide.js」)을 지운다. 하지 않는다.
- 후보 C(기각): 남은 묶음까지 한 PR 에 — 모의 실행으로는 가능했지만(8절) 화면 시나리오를 세포마다 따로 세워야 하고 대입 이름(`pendingCapturePhoto`)·함수식 window 대입이 섞인다. 위험이 낮은 것부터 나눈다.
- 등록 기관과의 관계: 새 세포의 감싼 함수는 지금 방식(IIFE 머리 가져오기 줄 + 원래 자리 호출 한 줄)으로 둔다. 등록 블록을 손으로 넣지 않았고 `gen-cell-provide.js` 를 돌리지 않았다(L068).

## 4. [원칙 ④] 재검토 (반례·부작용)

- **생성기가 통로 getter 를 다시 단다(발견)** → 감싼 코드가 읽는 인라인 이름 31개 중 27개는 index.html 머리에 getter 가 없어 생성기가 `get X(){ return X; }` 를 새로 달았다(29줄: 속성 27 + 껍데기 2). 그중 22개는 기준 트리에서 등록 기관이 통로에 내주던 이름이다(22개 모두 대조 결과의 등록 이름 438개에 들어 있다 — `cell-registry-compare.base.json` `registeredNames`). index.html 머리에는 그 getter 가 없고 가져오기 줄만 있었다. 5개(`MOCK_PEOPLE` · `initDevDebugButtons` · `initKeyboardShield` · `showLegalModal` · `toggleAgentBtn`)는 통로에 처음 생긴다 — 이 다섯 이름을 `L.` 로 읽는 기존 js 코드는 0곳이다(새 세포 넷을 뺀 `js/**` grep). 값이 같은가: 기준 트리와 작업 트리에서 대조 탐침을 `--fingerprints` 로 돌려 맞댔다 — 통로 이름 423개 지문 차이 0 · window 이름 19개 지문 차이 0 · 통로에서 사라진 이름 0(`name-fingerprints.json`).
- **getter 를 단 줄과 값이 정해지는 줄 사이** → 새 getter 27개 중 22개는 값이 getter 줄보다 먼저 정해진다. 뒤에 정해지는 5개 가운데 `groupState` · `MOCK_PEOPLE` 은 그 사이에 실행되는 문이 0 이고, `initDevDebugButtons` · `showLegalModal` · `toggleAgentBtn` 은 이번에 통로에 처음 생기는 이름이라 그 사이에 읽는 코드가 없다(`expose-window.json`).
- **대입하는 이름(L047)** → 이번 묶음은 인라인 이름에 대입하지 않는다(`verify-inline-hard.json` `assignedL` · `noSetter` · `lastGetterNoSetter` 비어 있음).
- **로드 중에 아직 안 옮긴 인라인 함수를 부르는가(L018)** → 세포 파일은 함수 정의만 한다. 법정 모듈 로드 탐침으로 새 파일 넷을 하나씩 단독 로드: 넷 다 ok(`module-load.json` `newFilesLoadOne`).
- **`this`** → 감싼 코드의 `L.initDevDebugButtons()` 같은 호출은 `this` 가 통로 객체가 된다. 부르는 함수들은 앞선 분열 PR 이 옮긴 세포 함수로 최상위 `this` 가 0 이다(CELL_SPLIT 5호). 감싼 문 자체의 최상위 `this`/`arguments` 는 검사기가 0 으로 확인했다(`thisArgs`).
- **이중 처리기** → `addEventListener` · `on<이벤트>` 대입 수가 이전 전 IIFE = 새 IIFE + 새 세포(`verify-inline-hard.json` `listeners`).
- **구획 주석** → 묶음에 남는 문이 없는 두 곳(「개발 디버그 버튼 …」·「Phase 7 모바일 하드웨어 …」)은 구획 주석이 세포로 따라갔다(생성기 규칙). 지도의 묶음 수가 줄 수 있으며, 생성 지도는 이 PR 에서 건드리지 않는다(L009).
- **돈 근처·CSS 숨김** → 옮긴 글자에 `credit` · `subscription` · `paywall` · `OURGOAL_CONFIG` · `!important` 0건(새 파일 넷 grep). `OurgoalTemplateCredit.init` 블록은 따로 구획이라 건드리지 않았다.

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · `npm ci --ignore-scripts` · 기준 작업 폴더(분리 HEAD, 읽기 전용 측정용).
2. 저장소 밖 사본에서 모의 실행 → 시험 전체 종료 코드 비교(시험지 선행 필요 여부, `test-probe.json`).
3. 작업 폴더에서 생성기 실행 → 검사기 ok.
4. `node scripts/module-specs.js --write` · `cell-desc-add.js`(세포 설명 4건) · `node scripts/module-guard.js --update`(낮아진 값만, 사유 없이).
5. 측정: 모듈 로드 탐침 · 이름 지문 대조 · 게스트 시나리오 4개(기준 2회·작업 1회) · npm test(기준·작업 전경) · tests 전부 종료 코드.
6. 서류(REQ · claims · TICKETS) → `node scripts/verify-integrity-gate.js` → `npm test` → 커밋 → 로컬 `recomputeSplit` · 로컬 법정 전체 실행 → origin/main 합치기 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「getter 27개를 다시 다는 것은 철거를 되돌리는 일이다. 손으로 빼거나 생성기를 고쳐야 한다」** → 손으로 빼면 법정의 바이트 대조가 깨지고, 생성기를 고치면 이 PR 이 「생성기 변경 0」을 어긴다(법정은 기준 커밋의 생성기를 돌린다). 다시 단 getter 는 같은 값을 돌려주며(지문 차이 0), 줄 수는 그래도 68줄 줄었다. 다시 단 22개는 등록 기관이 같은 값을 내주는 이름이라 다음 철거(가져오기 줄은 남기는 2차 꼴)의 대상이 될 것으로 본다(추정 — 모의 철거로 재지 않았다). 이번 이전으로 그 이름들의 IIFE 안 맨이름 참조는 줄었다(옮긴 109줄 안의 참조가 통로 읽기로 바뀌었다). 이 사실을 숨기지 않고 보고한다.
- **반론 2 「부품 연결·서비스 워커는 화면 시나리오로 직접 잴 수 없으니 옮기면 안 된다」** → 직접 잴 수 없는 부분이 있는 것은 사실이다. 게스트 피드에는 글이 없어 반응·도움돼요·프로필 창을 누를 수 없고, 서비스 워커 등록 여부는 시나리오 단계로 읽을 수 없다. 그래서 주장을 나눴다: 시나리오는 「연결된 계정 보안 부품이 비밀번호 찾기 창을 연다」와 「시동이 끝까지 돌아 탭이 바뀐다」까지만 말하고, 건네는 손잡이가 같다는 것은 생성기 재실행 바이트 대조(proof)·토큰 동일·이름 지문 차이 0 으로 말한다. 못 잰 것은 주장 파일 `outOfScopeReports` 와 8절에 적었다.
- **재검증**: 첫 시나리오 후보 둘이 기준 트리에서 닿지 않았다 — 목표 탭의 `#btnToggleGoalAgent` 는 목표가 하나도 없으면 보이지 않고, 소통 탭 게스트 피드에는 `[data-feedprof]` 가 0개다. 앞의 것은 템플릿 목표를 하나 담는 단계를 넣어 풀었고(선례 `reports/TASK-ES-436/scenarios/goals-agent-send.json`), 뒤의 것은 버리고 로그인 화면의 비밀번호 찾기 경로로 바꿨다. 사라지는 토스트는 단언하지 않았다(L077).
- **재검증**: 법정 모듈 로드 탐침의 기본 범위는 `js/*.js` 뿐이라 새 세포가 들어가지 않는다. `js/core` · `js/tabs/settings` · `js/tabs/goals` 를 더해 다시 돌렸다(기준 217 · 작업 221, 회귀 0).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-638/` 아래, 작업자 측정이다.

| 산출물 | 무엇을 쟀나 | 결과 |
|---|---|---|
| `verify-inline-hard.json` | 토큰 동일(접두 제외) · 줄 동일 · 남은 글자 동일 · 누수 0 · 미노출 0 · setter 빠짐 0 · this/arguments 0 · 이중 처리기 0 · 키트 변수 뒤 가져오기 · 마지막 노출 setter · 800줄 이하 | `ok: true` |
| `measurement.json` | 인라인 줄 수 · index.html 줄 수 · 새 파일 줄 수 · 바뀐 파일 분류 | inlineScriptLines 2989 → 2921(−68) · index.html 5258 → 5190 · 새 파일 69 · 40 · 96 · 57줄 · tests/금고/생성기/생성 지도 변경 0 |
| `module-load.json` | 법정 모듈 로드 탐침 기준 대 작업 | 회귀 [] · 새 파일 넷 단독 로드 ok |
| `cell-registry-compare.base.json` · `cell-registry-compare.json` · `name-fingerprints.json` | 통로·window 이름 값 지문(기준 이름 목록 고정) | 통로 423 · window 19 지문 차이 0 · 사라진 이름 0 · 새로 생긴 이름 5 |
| `expose-window.json` | 새 getter 27개의 값이 정해지는 시점 | 4절 |
| `scenarios/*.json` · `scenario-local.json` | 게스트 시나리오 4개, 기준 2회·작업 1회 | 4개 모두 세 실행 통과 · 행동이 만든 변화 단언 있음 · 예외 0 |
| `raw/npm-test.{base,work}.{log,exit}` · `npm-test-compare.json` | npm test 전경 실행 | 종료 코드 0 · 0, ✓ 줄 487 · 487, ok 줄 196 · 196 (서류를 쓴 뒤 다시 돌린 값으로 갱신) |
| `tests-all-compare.json` | tests/*.test.js 전부와 npm test 네 단계·module-guard 를 파일마다 실행 | 119개 파일 중 종료 코드·ok 줄 수가 다른 파일 0 |
| `test-probe.json` | 시험지 선행 필요 실측(저장소 밖 사본) | 이번 범위·남은 묶음 모두 신고서 없음으로 인한 module-guard 계열 3개만 달라짐(신고서를 만들면 통과) |
| `court-local.json` | 로컬 `recomputeSplit`(mockOverrides 없이) · 로컬 법정 전체 실행 | 커밋 뒤 기록 |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: main 이 움직여 index.html 이 충돌하면 손으로 풀지 않고 main 판 index.html 로 같은 설정을 다시 돌린다(L010). 지금 상태 기관 PR(TASK-ES-636·637)이 index.html 을 고치고 있다.
- **예상**: 법정이 「확인 부족 — 고칠 게 없었음」을 내면 옮기기 PR 의 정상 판정이다(L005).
- **측정불가**: 가상 키보드 가림 방지의 실제 동작(진짜 폰) · 시험 계정 단추 영역이 개발 환경에서 보이는지(법정 호스트에서의 표시는 재지 않았다) · 서비스 워커 등록 성공·새 버전 알림·잠금화면 알림 단추 신호(시나리오 단계로 읽을 수 없다) · 반응·도움돼요 이유·팀 초대·소통·팀 연계 개인목표 부품의 로그인 뒤 화면 동작.
- **성과 측정**: inlineScriptLines 2989 → 2921(−68, 출처 `measurement.json` `summary.inlineScriptLines`). 옮긴 문 11개 109줄(앞 주석 포함 구간 120줄), 대신 생긴 줄은 호출 11 · 가져오기 11 · 표지 1 · getter 27 + 껍데기 2.
- **남은 것(원문 「남은 미분화작업 모두」 대비)**: 다음 PR 후보 — 체크인 입력 3문 · 팀 댓글 위임 3문 · 샘플 정리 1문 · 빠른 목표 추가 함수 2개. 저장소 밖 사본에서 이번 범위와 함께 모의로 돌리니 index.html 5259 → 4954줄(끝의 빈 줄 포함 세기), 모듈 가드 기준으로 인라인 2989 → 2684 · 함수 선언 29 → 26 이고 검사기 ok 였다(`test-probe.json` `mockAllBundles`). 실제 이전은 이 PR 병합 뒤 따로 잰다. 그 밖에 다시 단 getter 22개의 재철거, 돈 근처 3곳, 상태 이전, 구역 이전이 남는다.
- **PLAN 체크리스트**: [4단계: 심사 청구]까지만 기록한다(`.claude/plan-TASK-ES-638.md`).
