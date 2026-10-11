# REQ — 미분화 덩어리 시동 배선 감싸기 2차: 체크인 입력 연결 · 팀 목표 댓글 보내기 · 샘플 기록 정리 · 빠른 목표 추가

- Task ID: **TASK-ES-640** (L012: `gh pr list --state all` · `git ls-remote origin` 에서 640 이 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-640-wrap-boot-2` 를 먼저 push 해 선점했다. 637·639·641 은 다른 작업 몫이다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main): **DIR-003**(줄을 지우는 PR 마다 기준선에 inlineScriptLines 기록 — 줄지 않으면 실패) · **DIR-004**(CELL-REGISTRY-DESIGN.md 6.2절 순서 3 「함수 이전·감싸기」 — 기존 CELL_SPLIT, 함수 본문의 글자는 고치지 않는다 · index.html 을 바꾸는 PR 은 한 번에 하나).
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「어려운 인라인 묶음 감싸기·함수 이전」**(경험칙 L016 · `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` 2-1·2-2·2-3절) + 법정 「동작 보존 확인」 경로. 직전 선례 PR #911(TASK-ES-638, 판정 「통과」·동작 보존 확인 4)과 같은 방식·서류·증명이다. 작업참고 **기준 PR #905**(eab4365b).
- 이 작업 세션은 빌더(서브에이전트)다. 병합은 하지 않는다(오케스트레이터 몫).
- 기준 main: 453ba6b7(#914 상태 이전 TASK-ES-637 병합 뒤). 착수·첫 push 는 b76c29e9 → eb653a7e(#912) 기준이었다. #914 가 index.html 의 상태 이름 50개 선언을 `window.OurgoalAppState.define/defineVar` 호출로 바꾸고 그 getter/setter 를 지웠으므로, 손으로 합치지 않고 main 판 index.html 로 같은 `proof.json` 을 다시 돌렸고(L010) 신고서·세포 설명·기준선도 main 판에서 다시 만들었으며 측정을 전부 다시 했다.
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

원문의 「남은 미분화작업 모두 진행해」에서 나온 이번 PR 의 몫이다. 원문 전체(인라인 IIFE 0)는 이 PR 로 닫히지 않는다 — 남는 것은 8절.

- **R1** 체크인 입력칸 둘레의 시동 연결 세 문(퀵 루틴 칩 · 음성 체크인 · 사진 첨부)을 생성기로 세포 `js/tabs/records/checkin-input-wiring.js` 에 글자 그대로 옮기고 원래 자리에서 부른다. 동작 보존.
- **R2** 팀 목표 댓글 보내기(`window.sendTeamGoalComment`)와 문서 전체 누름·Enter 위임 두 문을 세포 `js/tabs/goals/team-comment-send.js` 에 옮긴다. 동작 보존.
- **R3** 샘플 기록 정리(`window.purgeSampleRecordsOneClick`)를 세포 `js/tabs/records/sample-purge.js` 에 옮긴다. 동작 보존.
- **R4** 빠른 목표 추가 함수 둘(`selectSmartTag` · `handleGoalFastAddSubmit`)을 세포 `js/tabs/goals/goal-fast-add.js` 에 옮긴다. 동작 보존.
- **R5** 증명 하한(헌법 CELL_SPLIT_PROOF): 토큰 동일·누수 0 · 단독 로드 회귀 0 · 통로 이름 값 동일 · npm test 수 동일 · tests·금고·생성기 변경 0.
- **R6** 기준선(`docs/architecture/module-baseline.json`)에 줄어든 inlineScriptLines 를 기록한다(DIR-003).

범위 밖(건드리지 않음): 테마 try 문 · `setupUserSessionRealtime` · `saveGoogleToken` · `executeDirectTemplateClone` · `openTemplateMarketModal` · `OurgoalTemplateCredit.init` 블록 · `OURGOAL_CONFIG` · `openProTemplateRecordModal` · 3줄 이하 호출문 · 상태 변수 선언(`pendingCapturePhoto` · `capturePhotoBtn` · `capturePhotoInput` · `capturePhotoPreview` · `qRoutineRow` 의 선언 줄은 원래 자리에 그대로 있다) · #911 이 다시 단 통로 getter 의 재철거(철거 빌더 몫).

### 구체 식별자

- 파일: `index.html`(인라인 IIFE) → 새 세포 `js/tabs/records/checkin-input-wiring.js` · `js/tabs/goals/team-comment-send.js` · `js/tabs/records/sample-purge.js` · `js/tabs/goals/goal-fast-add.js`
- 감싼 함수 7개: `bindQuickRoutineChips` · `startVoiceCheckin` · `bindCapturePhoto`(키트 `OurgoalRecordsKit`) / `defineSendTeamGoalComment` · `bindTeamCommentClick` · `bindTeamCommentKeydown`(`OurgoalGoalsKit`) / `definePurgeSampleRecords`(`OurgoalRecordsKit`). 옮긴 함수 2개: `selectSmartTag` · `handleGoalFastAddSubmit`(`OurgoalGoalsKit`)
- DOM: `#quickRoutineRow` · `[data-quickroutine]` · `#captureInput` · `#captureSave` · `#micBtn` · `#micStatus` · `#capturePhotoBtn` · `#capturePhotoInput` · `#capturePhotoPreview` · `[data-cmtsend]` · `[data-cmtinput]` · `#recSamplePurgeBtn` · `#recSamplePurgeBox` · `#btnSheetConfirmOk` · `#goalFastAddInput` · `#btnGoalFastAddSubmit` · `#chipTagHealth` · `#chipTagStudy` · `#chipTagCareer` · `#chipTagHabit`
- 생성기 `docs/design/harness/module-split/gen-inline-hard.js`(변경 0) · 검사기 `verify-inline-hard.js`(변경 0) · 설정 `reports/TASK-ES-640/proof.json`(자리 표지 `HO`)
- 이전 전 index.html(453ba6b7) 문 줄: 3065~3072 · 3078~3146 · 3156~3184 · 3471~3508 · 3510~3531 · 3533~3554 · 4774~4796(감싸기) · 3354~3364 · 3368~3398(함수) (출처 `reports/TASK-ES-640/measurement.json` `generator.wrapped` · `gen-inline-hard-meta.json` `plan`)

## 1. [원칙 ①] 문제를 정확히 파악한다

#911 뒤 인라인 IIFE 에 남은 4줄 이상 로드 중 문 가운데 체크인 입력 3문·팀 댓글 3문·샘플 정리 1문과, 마크업의 `onclick`·`onkeydown` 이 부르는 작은 함수 2개가 남아 있다. 이 가운데 사진 첨부 문은 상태 변수 `pendingCapturePhoto` 에 **대입**한다 — 그 이름은 맨이름 참조가 남아 상태 이전(TASK-ES-637) 대상에서 빠져 있고, 이 문이 덩어리를 떠나야 풀린다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 글자를 고치지 않고 자리만 옮긴다. 문은 세포 함수가 되어 원래 자리에서 같은 순서로 한 번 불리고, 함수는 세포로 가되 `window.X = X;` 노출 줄은 원래 자리에 남는다.
- **원인**: 로드 중 문·함수식 window 대입은 1차 생성기로 옮길 수 없었고, 두 함수는 마크업 on*= 이 부르는 이름이라 어려움 묶음으로 남아 있었다.
- **중심**: 생성기 한 번 실행(설정 `reports/TASK-ES-640/proof.json`, 세포 4개 · take 6개 · wrap 이름 7개 · 함수 이름 2개).
- **핵심**: 옮긴 코드가 `L.pendingCapturePhoto = …` 로 쓰는 대입이 원래 변수에 닿는가(setter), 그리고 window 에 다는 두 함수식(`sendTeamGoalComment` · `purgeSampleRecordsOneClick`)이 같은 시점에 같은 이름으로 달리는가.

## 3. [원칙 ③] 해결 방식

- 표준 이음매: 로드 중 문은 감싸기(2-3), 대입하는 상태는 선언을 원래 자리에 두고 통로 getter·setter(2-1), 함수는 옮기고 노출 줄은 원래 자리(2-2). 새 세포 파일 넷, 기존 탭 키트에 함수를 단다(새 window 전역 0). 기존 세포 파일에 덧붙이지 않았다(생성기 일반 모드는 파일을 통째로 새로 써 기존 등록 블록을 지운다). 등록 블록을 손으로 넣지 않았고 `gen-cell-provide.js` 를 돌리지 않았다(L068).
- `window.sendTeamGoalComment = async function…` 과 `window.purgeSampleRecordsOneClick = async function…` 은 4줄 이상인 식 문이라 생성기가 문 전체를 `defineSendTeamGoalComment()` · `definePurgeSampleRecords()` 로 감싼다. 원래 자리에서 그 함수를 부르므로 window 에 달리는 시점과 순서는 같다. 시험이 단언하는 글자 `window.sendTeamGoalComment = async function` · `window.purgeSampleRecordsOneClick = async function` 은 세포 파일에 그대로 있고 시험은 합본을 읽는다(시험 변경 0).
- 신고서 손 칸: `records/sample-purge` 의 `requires` 에 `ui.confirm` 을 적었다(옮긴 코드가 `OurgoalCapabilities.call('ui.confirm', …)` 를 부른다 — 사실대로). 도구 `reports/TASK-ES-640/tools/set-requires.cjs`.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **대입 이름 `pendingCapturePhoto`(L047)** → index.html 에서 이 이름의 통로 노출은 한 줄뿐이고 그 줄에 `get`·`set` 이 함께 있다(생성 뒤 index.html 2355행, grep). 검사기: `assignedL` = [`pendingCapturePhoto`] · `noSetter` [] · `lastGetterNoSetter` []. 이전 뒤 덩어리 안의 이 이름은 선언 줄과 그 노출 줄뿐이다. 다만 대입이 실제로 도는 길(사진을 골랐을 때)은 파일 고르기 창이 필요해 화면으로 재지 못했다(8절).
- **window 이름의 값 지문** → window 이름 19개 중 4개(`selectSmartTag` · `handleGoalFastAddSubmit` · `sendTeamGoalComment` · `purgeSampleRecordsOneClick`)의 지문이 달라졌다. 지문은 「종류:이름:인자 수:함수 글자 해시」인데, 네 함수는 본문이 세포로 옮겨지며 인라인 이름에 `L.` 접두가 붙어 **해시만** 달라졌고 종류·이름·인자 수는 같다. 이 넷 말고 달라진 window 이름은 0, 통로 이름 428개는 지문 차이 0, 사라진 이름 0(`name-fingerprints.json`). 본문의 토큰 동일은 검사기가 본다.
- **새 통로 getter 10개** → 8개는 기준에서 등록 기관이 내주던 이름, 2개(`capturePhotoBtn` · `qRoutineRow`)는 통로에 처음 생긴다(이 둘을 `L.` 로 읽는 기존 js 코드 0곳). getter 줄 뒤에 값이 정해지는 것은 이 둘뿐이다(`expose-window.json`). 재철거는 철거 빌더 몫으로 남긴다(오케스트레이터 결정).
- **`typeof X` 꼴** → 옮긴 코드의 `typeof TEAM_COMMENTS_CACHE !== 'undefined'` · `typeof MOCK_GROUPS !== 'undefined'` · `typeof toast === 'function'` 등은 `typeof L.X` 가 된다. 이 이름들은 통로에 값이 있어 결과가 같다(통로 지문 대조에 포함).
- **상태 기관과의 겹침(#914 뒤 재확인, `accessor-probe.json`)** → index.html 의 상태 기관 이름은 50개다. 새 세포가 `L.` 로 읽는 이름 22개 가운데 기관이 주인인 이름 0 · 새 세포가 대입하는 이름(`pendingCapturePhoto`) 가운데 기관이 주인인 이름 0 · 생성기가 새로 단 getter 10개 가운데 기관 이름과 겹치는 것 0. 그래서 index.html 의 노출이 기관의 접근자를 뒤에서 덮어 setter 가 사라지는 일(L047 꼴)은 이번 범위에 없다. 브라우저에서 부팅 뒤 실측: 22개 이름 모두 통로에 있고 값이 undefined 인 것 0, 주인은 22개 모두 `index.html`, `pendingCapturePhoto` 는 get·set 접근자이고 실제로 써 보고 되읽은 값이 같았으며 원래 값으로 돌려놓았다.
- **단독 로드(L018)** → 세포 파일은 함수 정의만 한다. 새 파일 넷 단독 로드 ok, 기준 대비 회귀 [].
- **이중 처리기** → `addEventListener`·`on<이벤트>` 대입 수가 이전 전 IIFE = 새 IIFE + 새 세포(검사기 `listeners`).
- **모듈 가드** → 전역 직접 대입 75 → 75, 탭 간 직접 참조 0 → 0(window 대입 글자가 세포로 갔지만 지표는 늘지 않았다 — `measurement.json` `summary`).
- **돈 근처·CSS 숨김** → 옮긴 글자에 `credit` · `subscription` · `paywall` · `OURGOAL_CONFIG` · `!important` 0건(새 파일 넷 grep).
- **발견(고치지 않음)**: 퀵 루틴 칩 줄 `#quickRoutineRow` 는 지금 index.html 마크업에 없다. `bindQuickRoutineChips` 는 요소가 없어 아무 일도 하지 않는다(이전 전과 같다). 지울지는 승인선 ③ 이라 보고만 한다.

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · `npm ci --ignore-scripts` · 기준 작업 폴더(분리 HEAD).
2. 생성기 실행 → 검사기 ok → `module-specs --write` → `set-requires.cjs` → `cell-desc-add.js`(세포 설명 4건) → `module-guard --update`(낮아진 값만).
3. 게스트 화면에서 닿는 범위 실측(보이는 요소 탐색) → 시나리오 4개.
4. 측정: 모듈 로드 탐침 · 이름 지문 대조 · 시나리오(기준 2회·작업 1회) · npm test(기준·작업 전경) · tests 전부 종료 코드.
5. 서류 → `verify-integrity-gate.js` → `npm test` → 커밋 → 로컬 `recomputeSplit` · 로컬 법정 전체 실행 → origin/main 합치기 → push → PR.
6. TASK-ES-637(상태 이전)이 먼저 병합되면 main 판 index.html 로 같은 설정을 다시 돌리고 측정을 다시 한다(L010).

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「팀 댓글·사진 첨부·음성 받아 적기는 화면으로 끝까지 잴 수 없으니 옮기면 안 된다」** → 닿는 범위를 실측한 뒤 나눠 주장했다. 음성 체크인은 마이크 단추를 실제로 눌러 권한 안내 창이 뜨는 데까지, 샘플 정리는 샘플 적용 → 정리 → 확인 → 안내 상자가 사라지는 데까지, 빠른 목표 추가는 칩 고르기와 새 목표가 목록에 생기는 데까지 화면으로 잰다. 팀 댓글은 게스트 화면에 보내기 단추가 없어(실측: 소통 탭 모임 구획·목표 탭에서 보이는 `[data-cmtsend]` 0개) 문서 전체 위임이 다른 누름·Enter 를 그냥 지나가는 것까지만 화면으로 재고, 댓글을 실제로 보내는 길과 사진을 고른 뒤의 길은 토큰 동일·생성기 재실행 바이트 대조·단독 로드·이름 지문으로만 말한다. 못 잰 것은 `outOfScopeReports` 와 8절에 적었고 도구 한계 사유로 돌려 주장하지 않았다.
- **반론 2 「window 에 다는 함수식을 세포로 옮기면 인라인이 주인이던 window 이름의 주인이 바뀐다」** → 다는 시점·이름·순서는 같다(원래 자리에서 감싼 함수를 부른다). 모듈 가드의 전역 직접 대입·탭 간 직접 참조 지표는 그대로였고, 글자를 단언하는 시험(`scripts/smoke-test.js` · `tests/team-goal-comment-fix.test.js` · `tests/core-confirm-es376.test.js`)은 기준·작업에서 종료 코드와 ok 줄 수가 같다(`tests-all-compare.json`).
- **재검증**: 빠른 추가 칸(`#goalFastAddInput`)은 목표가 0개면 부모(`#personalGoalsView`)가 숨겨져 보이지 않았다. 템플릿 목표를 하나 담으면 보인다(실측). 새 목표 이름은 `#personalGoalsView` 가 아니라 `#sanctuaryGoalsView` 의 보이는 글자에 나타났다 — 첫 시나리오의 단언 자리를 그렇게 고쳤다(기준에서 먼저 실패를 보고 고친 것이며 단언을 약하게 하지 않았다).
- **재검증**: 사라지는 토스트는 단언하지 않았다(L077).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-640/` 아래, 작업자 측정이다.

| 산출물 | 무엇을 쟀나 | 결과 |
|---|---|---|
| `verify-inline-hard.json` | 토큰 동일(접두 제외) · 줄 동일 · 남은 글자 동일 · 누수 0 · 미노출 0 · setter 빠짐 0 · this/arguments 0 · 이중 처리기 0 · 키트 변수 뒤 가져오기 · 마지막 노출 setter · 800줄 이하 | `ok: true` |
| `measurement.json` | 인라인 줄 수 · index.html 줄 수 · 새 파일 줄 수 · 바뀐 파일 분류 | inlineScriptLines 2849 → 2615(−234) · 함수 선언 29 → 26 · index.html 5118 → 4884 · 새 파일 146 · 122 · 53 · 72줄 · tests/금고/생성기/생성 지도 변경 0 |
| `module-load.json` | 법정 모듈 로드 탐침 기준 대 작업 | 회귀 [] · 새 파일 넷 단독 로드 ok |
| `cell-registry-compare.base.json` · `cell-registry-compare.json` · `name-fingerprints.json` | 통로·window 이름 값 지문(기준 이름 목록 고정) | 통로 428 지문 차이 0 · 사라진 이름 0 · 새로 생긴 이름 2 · window 19 중 옮긴 함수 4개만 해시 차이(4절) |
| `expose-window.json` | 새 getter 10개의 값이 정해지는 시점 | 4절 |
| `accessor-probe.json` | 상태 기관 이름과의 겹침(정적) · 통로 접근자 꼴과 대입 실측(브라우저) | 겹침 0 · `pendingCapturePhoto` 쓰기·되읽기 같음 |
| `scenarios/*.json` · `scenario-local.json` | 게스트 시나리오 4개, 기준 2회·작업 1회 | 4개 모두 세 실행 통과 · 행동이 만든 변화 단언 있음 · 예외 0 |
| `raw/npm-test.{base,work}.{log,exit}` · `npm-test-compare.json` | npm test 전경 실행 | 종료 코드 0 · 0, ✓ 줄 487 · 487, ok 줄 196 · 196 |
| `tests-all-compare.json` | tests/*.test.js 전부와 npm test 네 단계·module-guard 를 파일마다 실행 | 119개 파일 중 종료 코드·ok 줄 수가 다른 파일 0 |
| `court-local.json` | 로컬 `recomputeSplit`(mockOverrides 없이) · 로컬 법정 전체 실행 | 커밋 뒤 기록 |

시험지 선행 PR 은 필요 없었다(#911 의 `reports/TASK-ES-638/test-probe.json` 모의 실측과 이번 실제 이전의 `tests-all-compare.json`).

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상했고 실제로 만난 것**: TASK-ES-637(#914)이 먼저 병합됐다 → main 판 index.html 로 같은 설정을 다시 돌렸다(L010). 다시 확인한 것은 4절 「상태 기관과의 겹침」.
- **측정불가(화면)**: 퀵 루틴 칩(요소가 마크업에 없다) · 음성 인식이 실제로 켜져 받아 적는 길(헤드리스 브라우저에서는 권한 안내 창으로 간다) · 사진을 고른 뒤 미리보기·첨부 대기·지우기(파일 고르기 창) · 팀 목표 댓글을 실제로 보내는 길(게스트 화면에 보내기 단추 없음, 팀은 로그인 필요) · 빠른 추가의 서버 저장(게스트는 로컬 저장).
- **성과 측정**: inlineScriptLines 2849 → 2615(−234, 출처 `measurement.json` `summary.inlineScriptLines`). 감싼 문 7개 211줄(앞 주석 포함 구간 221줄) + 함수 2개. 대신 생긴 줄은 호출 7 · 가져오기 9 · 표지 1 · getter 10 + 껍데기 2 · 옮김 표지 2.
- **남은 것(원문 「남은 미분화작업 모두」 대비)**: 4줄 이상 로드 중 문 가운데 이번까지로 감싸기 묶음 W1~W7 은 끝난다. 남는 것은 다시 단 getter 의 재철거, 돈 근처 3곳, 상태 이전(637~), `setupUserSessionRealtime`, 3줄 이하 호출문·var 의 구역 이전, 그리고 결심 대기(944줄 함수 · `saveGoogleToken`).
- **PLAN 체크리스트**: [4단계: 심사 청구]까지만 기록한다(`.claude/plan-TASK-ES-640.md`).
