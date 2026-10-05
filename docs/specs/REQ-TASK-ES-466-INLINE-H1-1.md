# REQ — #TASK-ES-466 인라인 어려움 구역 H1 1차 — 네 묶음(Social Crew Pacing·피드 공유 모달·평가해주기 팝업·New goal modal)을 세포 4개로 이전(동작 그대로)

- 근거: 상민님 원문(2026-10-05) "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나?" · 헌법 v2026.10.05-CELL 세포골격 절(CELL_SPLIT · CELL_SPLIT_PROOF · claims_hygiene) · 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md`(#TASK-ES-439, 2절 표준 이음매 · 3절 자리 표지 · 4-1 빌더 절차) · 시험지 선행 #TASK-ES-469(#768 병합).
- 범위: 구역 H1(설계 문서 1절 구역 표)의 어려움 묶음 네 개를 #762 생성기 `gen-inline-hard.js` 로 글자 그대로 옮긴다. 이름 참조만 `L.` 접두, 기존 탭 키트(`OurgoalCommKit`·`OurgoalRecordsKit`·`OurgoalSettingsKit`·`OurgoalGoalsKit`)에 이름을 단다(새 전역 0). 머리 이음매는 자리 표지 `H1` 아래에만 넣는다. 생성 지도 3종(module-baseline·cell-map·inline-script-map·INLINE-SCRIPT-MAP.md)은 커밋하지 않는다(main 판 그대로).

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 구역 H1 13묶음 중 표준 이음매로 바로 옮길 수 있고 게스트 화면으로 잴 수 있는 묶음부터 PR 단위(600~1,500줄)로 연속 제출한다.
2. 이번 네 묶음과 새 세포:

| 묶음(구획 주석 제목) | 새 세포 | 옮긴 것 |
| :-- | :-- | :-- |
| Social Crew Pacing (#TASK-ES-228) | `js/tabs/comm/crew-pacing.js` | `applyCrewPacingUI`·`renderCrewPacingWidget`·`focusHomeCheckinInput`·`nudgeCrewMates` (window 노출 4줄은 원래 자리) |
| 목표 & 기록 선택 피드 공유 모달 (전면 고도화) | `js/tabs/records/share-to-feed.js` | `addSimulatedCheerAndReplyToPost`·`openShareToFeedModal` (노출 1줄 원래 자리) |
| [#TASK-ES-146] 아워골 평가해주기 90% 팝업 | `js/tabs/settings/app-evaluation.js` | `openAppEvaluationModal`·`closeAppEvaluationModal`·`resetAppEvaluationForm` + 로드 중 문 3개 감쌈(`bindAppEvalBackdrop`·`bindAppEvalSubmit`·`bindHomeAddGoal`) |
| New goal modal | `js/tabs/goals/new-goal-modal.js` | `promptNewGoal`·`localGoalTemplate`·`generateGoalTemplate`·`showNewGoal*` 4개 + 로드 중 문 1개 감쌈(`bindNewGoalStepExports`) |

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: index.html 인라인 IIFE(미분화 덩어리)에서 책임 단위 세포를 떼어 내되 동작은 하나도 바꾸지 않는다.
- **원인**: 네 묶음은 「어려움」 유형(B1 window 노출 · B2/B3 로드 중 문 · C 인라인 onclick · A1 남의 상태 재대입(`FEED_POSTS_CACHE`) · J 바깥 파일이 이름을 씀 · L 통로에 없는 이름)이라 1차 생성기로는 옮길 수 없었다.
- **중심**: 표준 이음매 — 함수는 옮기고 머리에서 같은 이름으로 가져오기, 상태 변수 선언·window 노출 줄·3줄 이하 문은 원래 자리, 4줄 이상 로드 중 문은 bind 함수로 감싸 원래 자리에서 부르기, 옮긴 코드가 읽는 인라인 이름은 getter·setter 통로.
- **핵심**: 손으로 옮기지 않는다 — 설정 `inline-hard-h1-466.json` 하나로 생성기가 만들고, 검사기·단독 로드·시험·게스트 조작 비교·화면 시나리오로 차이 0 을 잰다.

## 3. [원칙 ③] 해결방식

- 설정 `docs/design/harness/module-split/inline-hard-h1-466.json`(slot `H1`) → `gen-inline-hard.js` → `verify-inline-hard.js`.
- 피드 공유 모달은 기록 탭 키트에 둔다: 기록 탭 세포 `js/tabs/records/period-ai-card.js` 가 `L.openShareToFeedModal()` 을 부르므로, 소통 탭에 두면 모듈 가드 ⑤ 탭 간 직접 참조가 0 → 1 로 늘어 실패했다(작업자 측정). 기록 탭에 두면 0 그대로.
- 신고서 `modules.json`(module-specs --write + 손 칸 role) · 세포지도 설명 `cell-descriptions.json`(cell-desc-add.js).
- 게스트 조작 비교: `dom-compare-inline-h1.js`(dom-compare-inline-p1.js 복제 — 저장값 `maxBaseCrafts` 를 맞대지 않음, 아래 4절) + 단계 `dom-steps-inline-h1-466.js`.

## 4. [원칙 ④] 재검토 — 한계와 발견

- 평가 창 배경 누르기 닫기(`bindAppEvalBackdrop`)는 법정 시나리오 어휘의 누를 자리(위·왼쪽 6%)가 창 본문에 걸려 화면 시나리오로 누를 수 없다 → 시나리오는 × 단추로 닫기를 잰다. 감싼 문은 verify 로 글자 동일·처리기 수 동일을 잰다.
- 같은 기준 앱 두 번 실행에서도 저장값의 `maxBaseCrafts` 가 있다 없다 한다(부팅 직후 저장 시점) → `dom-compare-inline-p1.js` 그대로 돌린 결과 `dom-compare-p1-raw.json`(기준 대 작업 15칸 · 기준 대 기준 15칸, 모두 그 키)을 남기고, 그 키만 빼는 복제 하네스로 다시 쟀다.
- 발견(고치지 않고 그대로 옮김): 「평가해주기」 묶음 끝에 홈 「새 목표」(#homeAddGoal) 처리기가 같은 구획에 들어 있다(책임이 다른 문 — 구획 주석 경계 그대로 옮겨 `bindHomeAddGoal` 로 감쌌다). 「Social Crew Pacing」 의 「오늘 체크인」 단추 id(`btnCrewStartCheckin`)는 화면 글자가 「동반자 피드 ➔」 다.
- 구역 H1 나머지: 「외부 데이터 불러오기 (mock)」(한 줄에 두 문 — 생성기가 멈춤)·「참고자료」(같은 구획 주석이 두 줄 — 생성기가 멈춤)·「기록 기반 목표·마일스톤·할 일 자동 업데이트 제안」(smoke FN_NAMES — 생성기가 멈춤)은 다음 PR 에서 따로 다룬다.

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/inline-h1`(브랜치 `feat/2026-10-05-task-es-466-inline-h1`, 기준 origin/main 94dab54) → 지도·유형 집계(작업 사본) → 시험지 선행 실측 → 선행 PR #768 → 설정·생성 → verify → 모듈 로드 탐침 → 신고서·설명·가드 → 시험 126개 기준/작업 → 게스트 조작 비교(기준 2회·작업 1회) → tab-check 홈·소통 기준 2회·작업 1회(백그라운드) → 법정 형식 시나리오 4개 기준/작업 → 문서·주장 → 커밋 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "감싼 로드 중 문(처리기 등록)이 원래 순서와 다른 때 걸려 이중 처리기·빠진 처리기가 생긴다." → 감싼 함수는 index.html 원래 자리에서 동기적으로 한 번 불린다. verify ⑥ 처리기 수 기준 657 = 작업 619 + 세포 38, ⑦ 부르는 줄 하나씩, ③ 남은 글자 동일. 게스트 조작 비교에서 빈 제출 토스트·새 목표 창이 기준과 같은 값.
- 반론 2: "피드 공유 모달을 소통이 아니라 기록 탭에 두는 것은 책임과 어긋난다." → 이 창은 「목표 & 기록 선택」 게시 창이고 기록 탭 세포가 부른다. 모듈 가드 탭 간 직접 참조 0 을 지키는 자리이며, 키트 이름만 다를 뿐 동작은 같다(시나리오·조작 비교).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#homeCompassCrew`·`#crewPacingWidget`·`#btnNudgeCrewMates`·`#btnCrewStartCheckin`, `#btnCommPostFeed`·`#sharePreviewBtn`·`#sharePreviewSlot`·`#shareConfirmBtn`, `#homeCompassQuest`·`#btnOpenEvalModal`·`#appEvaluationModal`·`#btnAppEvalClose`·`#btnSubmitAppEval`, `#homeAddGoal`·`#ngManualBtn`·`#ngGenBtn`·`#ngBackToAi`·`#mGoalTitle`·`#mSave`, `#toast`.
- 함수: 1절 표 + `OurgoalAppScope.expose`(새 getter 11개: `GOAL_TEMPLATES`·`btnSubmitEval`·`categoryPickerHtml`·`compressImage`·`ensureFeedPostsLoaded`·`modalEvalElem`·`renderCommScreen`·`showUndoPrivacyToast`·`templateMilestones`·`trackGoalCreated`·`wireCategoryPicker`).
- 파일: `index.html`, 새 세포 4개, `docs/architecture/modules.json`·`cell-descriptions.json`, `docs/design/harness/module-split/inline-hard-h1-466.json`·`dom-compare-inline-h1.js`·`dom-steps-inline-h1-466.js`, `reports/TASK-ES-466/*`.

## 8. [원칙 ⑧] 막히는 지점 · 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자 동일 | `verify-inline-hard.js` | ok — 토큰 동일·덩어리 줄 동일·남은 글자 동일·누수 0·미노출 0·setter 빠짐 0·남은 정의 0·안 가져온 사용 0·this/arguments 0·처리기 657 = 619 + 38·부르는 줄 ok (`verify-inline-hard.json`) |
| 새 파일 줄 수 | 생성기 | crew-pacing 258 · share-to-feed 763 · app-evaluation 153 · new-goal-modal 351 (모두 800 이하) |
| index.html | 생성기 | 이 PR 의 이전 전 28,282줄 → 26,939줄(−1,343) |
| 단독 로드 | `court/probes/module-load.js` 로컬 | 회귀 0, 새 파일 4개 단독 로드 ok·등록 전역은 기존 키트 하나씩 (`module-load-probe.json`) |
| 시험 | tests·scripts 126개 + npm test 구성 | 종료 코드 기준 = 작업 126/126(기준 사본에서 원래 실패 31개 포함 같음), smoke 443/0 (`test-compare.json`) |
| 모듈 가드 | `module-guard.js` | 통과(기준선 파일은 main 판 그대로 — 커밋 안 함) |
| 게스트 조작 비교 | `dom-compare-inline-h1.js` | 20단계 × 10칸 = 200값, 기준 대 작업 0 · 기준 대 기준 0, 콘솔 오류 0/0/0 (`dom-compare.json`) |
| 화면 시나리오(법정 형식) | `court/lib/scenario.js` 로컬 | 4개 기준·작업 모두 통과, 약점 0 (`scenario-local.json`) |
| 탭 실측 | `tab-check.js home,comm` 기준 2회·작업 1회 | 제출 시점 측정 중(한 번에 1시간 넘게 걸림) — 끝나면 같은 PR 에 `tab-compare-*.json` 을 더하고 이 줄을 고친다. 그 전까지 이 항목은 주장하지 않는다 |

[4단계: 심사 청구]
