# REQ — #TASK-ES-432 index.html 인라인 스크립트 세포화 2차: 받은 응원 알림

- 근거: 헌법 v2026.10.05-CELL 세포골격 절(CELL_SKELETON · CELL_SPLIT · CELL_SPLIT_PROOF · claims_hygiene), `docs/specs/MODULE-SPLIT-PROTOCOL.md`, 1차 #TASK-ES-423(PR #744).
- 범위: 인라인 IIFE 의 「받은 응원 알림」 묶음 1개(함수 3개)를 세포 파일 1개로 글자 그대로 옮긴다. 기능 추가·삭제 0, 마크업·CSS 이동 0, 동결 파일 0, 시험 기대값 변경 0, retire 0.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 1차(#TASK-ES-423) 지도 권장 순서의 다음 안전 묶음을 세포 파일(800줄 이하, 하는 일 이름, part1/part2 금지)로 옮긴다. 전역 노출·호출 순서·동작 그대로, 원본 결함도 그대로 옮기고 발견하면 보고한다.
2. 처음 고른 4묶음(게이지 `gaugeSvg` · 스트릭 프리즈 `checkStreakFreeze` · 받은 응원 알림 · 소통 투어 `showCommTourModal`) 중 셋은 작업 도중 다른 구역 PR(P0·P1·P2, 병렬 빌더)이 main 에 옮겼다(main 3232cc2 에서 `js/tabs/goals/result-input.js`·`js/tabs/records/checkin-helpers.js`·`js/tabs/settings/comm-tour.js`). 코디네이터 지시에 따라 남은 「받은 응원 알림」 1묶음만 옮긴다(다른 묶음은 구역 빌더가 줄 구간으로 나눠 맡고 있어 새로 고르지 않는다).
3. 화면 파일(index.html·js 세포)에 걸린 동작 주장은 처음부터 법정 형식 게스트 화면 시나리오로 낸다(#745 판례). 생성 지도 3종(`module-baseline.json`·`cell-map.json`·`inline-script-map.json`·`INLINE-SCRIPT-MAP.md`)은 커밋·주장하지 않고 main 판 그대로 둔다. main 이 움직이면 바뀌는 전체 수치(인라인 줄 수·세포 수 등)는 주장에 쓰지 않는다. push 직전 main 을 합친다.
4. 증명: `git archive` 기준 사본 대비 토큰 동일·누수 0, 원본 단독 로드, tab-check 6탭 기준 2회·후 1회 차이 0, 옮긴 묶음 게스트 조작 DOM 비교 0, npm test·tests 동일, 로그인 화면 읽기 전용 비교.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 인라인 IIFE 는 아직 한 스코프다. 한 묶음씩 떼어 낼 때마다 "옮긴 뒤에도 화면에서 같은 일을 한다"를 법정이 직접 돌려 볼 수 있어야 분열이 안전하게 쌓인다.
- **원인**: 「받은 응원 알림」(`totalFeedCheers`·`checkSocialNotifications`·`showSocialNotifyBanner`)은 앱에 들어올 때(`enterApp`)만 한 번 불리고, 새 응원이 있을 때만 홈에 띠를 그린다. 빈 게스트로 들어가면 응원이 0 이라 아무것도 그리지 않아, 그냥 들어가 보는 것으로는 옮긴 코드가 도는지 보이지 않는다.
- **중심**: 게스트가 화면만으로 「새 응원」을 만드는 길 — 소통 탭 「마니또」에서 「마니또 시작하기」를 누르면 AI 마니또가 배정되고 첫 마니또가 응원 1건을 보낸 것으로 계산된다(`manitoInbox`). 앱을 다시 열면 `checkSocialNotifications` 가 그 1건을 새 응원으로 세어 띠를 그린다.
- **핵심**: 이 길을 기준 앱에서 먼저 법정 실행기로 고정(`manito-reentry-cheer-banner`, 기준 통과)한 뒤 생성기로 글자 그대로 옮기고, 같은 시나리오가 작업 쪽에서도 통과하는지 본다. 묶음의 성질: 상태 대입 0·로드 중 문 0·인라인 on*= 처리기 0·window 이름 0·smoke FN_NAMES 0·index.html 단독 시험지 의존 0(기준 지도).

## 3. [원칙 ③] 해결방식

| 묶음 | 옮긴 선언 | 새 세포(줄) | 게스트로 닿는 길(시나리오) |
| :-- | :-- | :-- | :-- |
| 받은 응원 알림 (실제 내 게시물 응원 수 + 마니또 받은 응원함), 34줄 | `totalFeedCheers`·`checkSocialNotifications`·`showSocialNotifyBanner` | `js/tabs/comm/cheer-notify.js`(60) | 소통 「마니또」 → 「마니또 시작하기」 → 다시 열기 → 홈 「응원이 도착했어요 · 마니또 응원 1개」 → 「확인하기」 → 띠 사라짐·소통 탭(`manito-reentry-cheer-banner`) |

- 생성기 `docs/design/harness/module-split/gen-inline-split-2.js`(1차 gen-inline-split-1.js 틀): 묶음을 구획 주석부터 마지막 선언 끝 줄까지 통째로 옮기고, 묶음 안에 옮기지 않는 문이 있으면 멈춘다. 이름 참조만 `L.<이름>`(app-scope getter 6개 — `FEED_POSTS_CACHE`·`manitoInbox`·`manitoState`·`saveProfile`·`setTab`·`state`, 새로 노출한 것은 `manitoInbox`·`manitoState` 2개). 옮긴 함수의 최상위 `this`·`arguments` 0, 재대입 0, smoke FN_NAMES 0 을 검사한다. 키트는 이미 있는 `OurgoalCommKit` 를 같이 쓴다 → 새 전역 0.
- index.html: 1차 이음매(#TASK-ES-423) expose 블록 바로 다음에 2차 이음매(가져오기 1줄 `var checkSocialNotifications = _commKit.checkSocialNotifications;` + expose getter 2개), 옮긴 자리에 표지 주석 한 줄, 새 `<script>` 태그는 소통 탭 `index.js` 태그 바로 앞 같은 줄(순증가 0줄).
- 등록: `modules.json`(module-specs --write, 손 칸 role), `cell-descriptions.json`(짧은 이름 「받은 응원 알림」·하는 일 한 줄). 생성 지도 3종은 main 판 그대로(모듈 가드는 값이 줄면 기준선 갱신 없이 통과한다). 옮긴 뒤 다시 만든 인라인 지도는 측정 기록 `reports/TASK-ES-432/inline-script-map-after.json` 으로만 남긴다.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- **발견한 기존 결함·문제(이번에 고치지 않음 — 별도 티켓)**:
  1. `checkSocialNotifications` 는 앱에 들어올 때만 불린다 — 앱을 켜 둔 채로 응원이 와도 띠는 다음에 다시 들어올 때까지 뜨지 않는다.
  2. 게스트 마니또의 「받은 응원」 1건은 실제 사람이 보낸 것이 아니라 첫 AI 마니또 몫으로 계산된 것인데, 띠는 「응원이 도착했어요」로 똑같이 알린다(AI 표시 없음).
  3. 처음 고른 묶음을 찾다가 본 것(지금 main 기준, 이 PR 범위 밖): 부르는 곳이 없는 함수 `hybridDashboardHtml`(「목표 현황판」)·`openAiResultAssistantModal`·`maybeShowFirstLoginGuide`, 늘 실리는 모듈의 대비 경로뿐인 `openUserProfileModal`, 창이 window 노출로만 열리는 `openPaywallModal`. 설정 「앱 기본 가이드 다시보기」 단추는 접힌 `<details>` 안에 있어 펼치지 않으면 보이는 크기로 잡혀도 눌리지 않는다. 지우는 것은 승인선 ③이라 보고만 한다.
- 게스트로는 내 피드 글 응원 수(`totalFeedCheers`)가 늘 0 이다(피드는 서버 글) — 이 경로는 실계정 읽기 비교에서 그 계정 상태대로만 본다(테스트 계정 A 는 새 응원 0, 띠 없음 — 세 번 모두 같음).

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/inline-split-2`(브랜치 `feat/2026-10-05-task-es-432-inline-split-2`) → 헌법 세포골격 절·1차 REQ·생성기·하네스·법정 주장 규칙(court/claims.js `effectiveFloor`·`rollup`)·#745 판정 정독 → 게스트로 닿는 길을 법정 실행기로 기준 앱에서 탐침 → (처음 4묶음으로 생성·측정까지 했으나 main 이 셋을 먼저 옮겨) origin/main 3232cc2 로 다시 시작 → 기준 사본 `git archive 3232cc2`(stash 없음; git 을 읽는 시험을 위해 그 사본에 main 이력을 받아 3232cc2 로 맞춤 — 작업 트리 차이 0) → 생성기 → verify → 모듈 로드 탐침 → 신고서·설명·가드 → 시나리오 로컬 기준·작업 → 게스트 조작 비교(기준 2회·후 1회) → 실계정 읽기 비교(기준·후·기준) → tab-check 기준 2회·후 1회 → npm test·tests 기준/후 → 문서 → 커밋 → main 합치기 → PR → 법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "`checkSocialNotifications` 는 앱에 들어올 때 부르는데, 함수 선언이 IIFE 머리의 `var` 가져오기로 바뀌면 들어가는 순간 `undefined` 일 수 있다." → 가져오기 줄은 IIFE 머리(앞선 이음매 다음)에 있고 `enterApp` 은 로드가 끝난 뒤(게스트 시작·로그인·다시 열기) 불린다. 세포 파일 태그는 인라인 스크립트보다 앞에 있어 키트가 먼저 채워진다. 측정: 시나리오의 「다시 열기 → 띠」 기준·작업 통과, 게스트 조작 비교 다시 열기 3회 포함 130값 차이 0·콘솔 오류 기준과 같음.
- 반론 2: "`L.manitoInbox()` 처럼 객체 경유로 부르면 그 함수 안의 `this` 가 바뀐다." → 새로 통로에 올린 `manitoState`·`manitoInbox` 본문에 `this`·`arguments` 0(작업자 확인), 나머지(state·setTab·saveProfile·FEED_POSTS_CACHE)는 선례와 같은 통로다. `FEED_POSTS_CACHE` 는 다시 대입되는 변수지만 getter 는 읽을 때마다 살아 있는 값을 돌려준다.
- 반론 3: "1묶음 34줄은 지시(3~5묶음)보다 작다." → 지시 뒤 main 이 움직여 셋이 이미 옮겨졌고, 남은 쉬움·보통 묶음은 구역 빌더가 맡고 있어 코디네이터가 새로 고르지 말라고 했다. 겹쳐 옮기면 같은 줄을 두 PR 이 고쳐 충돌·이중 처리기 위험이 생긴다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#btnLandingPreviewDirect`, `.navbtn[data-tab="comm"]`, `#commBody [data-sub="manito"]`, `#mnJoin`, `#toast`, `#socialNotifySlot`, `#socialNotifySlot .notify-banner`, `#sbOpen`, `#screen-comm`.
- 함수: `totalFeedCheers`, `checkSocialNotifications`, `showSocialNotifyBanner`, `enterApp`(남음), `manitoState`·`manitoInbox`(남음), `OurgoalAppScope.expose`, `OurgoalCommKit`.
- 파일: `index.html`, `js/tabs/comm/cheer-notify.js`, `docs/architecture/modules.json`·`cell-descriptions.json`, `docs/design/harness/module-split/gen-inline-split-2.js`·`verify-inline-split-2.js`·`module-load-inline-split-2.js`·`scenario-local-inline-split-2.js`·`dom-compare-inline-split-2.js`·`test-compare-inline-split-2.js`·`real-account-inline-split-2.js`·`real-account-compare-inline-split-2.js`·`line-counts-inline-split-2.js`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

기준 = origin/main 3232cc2(`git archive` 사본). 결과 파일은 `reports/TASK-ES-432/`.

MEASURE_TABLE

[4단계: 심사 청구]
