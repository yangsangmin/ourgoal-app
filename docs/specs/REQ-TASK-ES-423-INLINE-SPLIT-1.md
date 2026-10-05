# REQ — #TASK-ES-423 index.html 인라인 스크립트 세포화 1차: 책임 묶음 지도 + 첫 분열(잠금화면 이미지 · 갓생 카드 보내기)

- 근거: 헌법 v2026.10.05-CELL 세포골격 절(CELL_SKELETON — `index.html` 인라인 스크립트는 미분화 덩어리, 분열 절차 CELL_SPLIT, 증명 CELL_SPLIT_PROOF), `docs/specs/MODULE-SPLIT-PROTOCOL.md`. 선례: 소통 탭 #TASK-ES-379(인라인 → `js/tabs/comm/`), 목표 탭 #TASK-ES-370·375, 컴포넌트 #TASK-ES-411(#732).
- 범위: ① 인라인 IIFE 의 책임 묶음 지도(도구 산출, 결정적) ② 지도 권장 순서 상위에서 고른 묶음 4개를 세포 파일 2개로 글자 그대로 옮김. 기능 추가·삭제 0, 마크업·CSS 이동 0, 동결 파일 0, 시험 기대값 변경 0, retire 0.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 아워골 앱에서 가장 큰 미분화 덩어리는 `index.html` 인라인 스크립트다(기준 origin/main f020065 에서 모듈 가드 ① 34,007줄, 처음 기준선 38,207줄). 이 덩어리의 책임 묶음 지도를 **도구로** 뽑아(손으로 세지 않음) PR 에 문서로 싣는다 — 묶음별 줄 수, 상태 읽기/쓰기, 전역 노출(window.X 282개 중 인라인 몫), 이벤트 처리기, 호출 관계, 옮기기 난이도(상태 공유·로드 순서·인라인 onclick 의존), 권장 순서.
2. 상태를 거의 안 건드리고 다른 묶음이 덜 부르는 묶음 2~4개를 세포 파일(800줄 이하, 하는 일 이름)로 옮긴다. 생성기(글자 그대로, 스코프 접두만)·verify·dom-compare·tab-check·실계정 읽기 비교로 동작 그대로를 측정한다.
3. index.html 인라인 줄 순증가 0(줄어야 함), 전역 노출·호출 순서·동작 그대로. 새 세포마다 `cell-descriptions.json` 짧은 이름·하는 일, `cell-map.json` 재생성, 신고서 `module-specs --write`, 기준선 `module-guard --update`.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 3만 4천 줄 IIFE 한 스코프 안에 552개 최상위 함수·174개 최상위 변수가 섞여 있어, 어느 기능을 고쳐도 같은 파일·같은 스코프를 만진다. 무엇을 먼저 떼어야 안전한지 근거가 없었다.
- **원인**: 지금까지의 분열은 탭 단위로 "그 탭 렌더 함수"를 골라 옮겼다. 탭에 속하지 않거나 여러 탭에 걸친 묶음(잠금화면·갓생 카드·휴지통·템플릿 백과사전 …)은 목록조차 없었고, 어느 묶음이 상태를 쓰는지·로드 중 바로 도는 문이 있는지·시험지가 글자를 잘라 가는지 매번 손으로 확인했다.
- **중심**: 구획 주석(`/* ============ 제목 ============ */`) 단위 192개 묶음과, 각 묶음이 다른 묶음의 상태를 대입·변경·읽는 수, 로드 중 바로 도는 최상위 문 수, 인라인 on*="…" 이 부르는 이름, 들어오는 호출 묶음 수, index.html 한 파일만 읽는 시험지의 글자 의존.
- **핵심**: 지도를 스코프 분석(`@babel/traverse` 바인딩·참조)으로 결정적으로 만들고 난이도 점수로 정렬한다 → 점수가 낮은(상태 대입 0·로드 중 문 0·인라인 처리기 0·시험지 단독 의존 0) 묶음부터 생성기로 글자 그대로 옮긴다.

## 3. [원칙 ③] 해결방식

### 3-1. 지도 — `scripts/inline-script-map.js` → `docs/architecture/INLINE-SCRIPT-MAP.md` · `inline-script-map.json`

- 큰 인라인 IIFE(세포 생성기와 같은 찾기 규칙)를 파싱 → 최상위 문의 앞 구획 주석으로 묶음을 나눈다(192개, 이음매 7·빈 구획 21·옮길 대상 164).
- 묶음마다: 함수·변수 선언, 다른 묶음 최상위 변수에 대한 대입(stateWrite)·속성 변경(stateMutate)·읽기(stateRead), 로드 중 바로 도는 최상위 문(loadTime, 종류별), `window.X =` 대입(module-metrics ③ 과 같은 정규식 — 인라인 몫 246줄, 나머지 1줄은 posthog 머리 블록), addEventListener·on<이벤트> 대입, 마크업·템플릿의 on*="이름(…)" 이 부르는 함수, 들어옴/나감 묶음(바인딩 참조), window 이름을 쓰는 바깥 js 파일, 시험지 글자 의존(이름 6자 이상·문자열 8자 이상 양방향, 흔한 글자 제외 — index.html 단독 읽기 시험지를 따로 셈), smoke-test FN_NAMES.
- 점수 = 4×stateWrite + 2×stateMutate + 1×stateRead + 2×loadTime + 2×inlineHandler + 1×fanInGroup + 1×windowName + 1×externalFile + 3×testIndexOnly + 5×smokeFn. 쉬움 ≤ 8 < 보통 ≤ 25 < 어려움. 권장 순서 = 점수 오름차순, 같으면 큰 묶음 먼저.
- 결정적: 시각·난수 없음, 목록 정렬, 출처는 index.html 내용 해시. 같은 입력 두 번 → 바이트 동일(작업자 측정).
- 기준(origin/main) 지도는 `reports/TASK-ES-423/inline-script-map-base.json`, 저장소의 지도는 이 PR 의 index.html 로 다시 만든 것.

### 3-2. 첫 분열 — 기준 지도 권장 순서에서 고른 4묶음

| 묶음(기준 지도) | 점수 | 옮긴 선언 | 새 세포 |
| :-- | --: | :-- | :-- |
| G077 [#TASK-ES-181] 폰 잠금화면용 월간 달력 배경화면 캔버스 엔진(278줄) | 2 | `lsDrawRoundRect` · `generateLockScreenCalendarImage` | `js/tabs/calendar/lockscreen-image.js` |
| G079 [#TASK-ES-232] 9:16 잠금화면 일정 카드 캔버스 엔진(223줄) | 5 | `generateLockScreenScheduleCardImage` | `js/tabs/calendar/lockscreen-image.js` |
| G092 MZ 갓생 카드: 동반자 1:1 DM 전송 모달(63줄) | 6 | `openSelectCompanionForStoryModal` | `js/tabs/comm/story-card-send.js` |
| G093 MZ 갓생 카드: 팀 단체방 인증 전송 모달(71줄) | 3 | `openSelectTeamForStoryModal` | `js/tabs/comm/story-card-send.js` |

- 공통: 상태 대입 0·로드 중 문 0·인라인 on*= 처리기 0·window 이름 0(G077 의 `window.generateLockScreenCalendarImage` 노출 줄은 G080 에 있고 그대로 둠)·smoke FN_NAMES 0. 시험지 의존은 합본 읽기(smoke-test)뿐 → 세포를 `js/tabs/**` 에 두면 기준 시험지가 같은 글자를 찾는다(시험지 선행 PR 불필요).
- 생성기 `docs/design/harness/module-split/gen-inline-split-1.js`(소통 1차 gen-comm.js 틀): 묶음을 구획 주석부터 마지막 선언 끝 줄까지 통째로 옮기고(주석 글자도 그대로), 묶음 안에 옮기지 않는 문이 있으면 멈춘다. 이름 참조만 `L.<이름>`(app-scope getter 8개 — `burstConfetti`·`closeModal`·`escapeHtml`·`groupState`·`openModal`·`state`·`toast`·`triggerHaptic`, 새 노출은 `groupState` 1개). 옮긴 함수의 최상위 `this`·`arguments` 0, 재대입 0 검사. 키트는 이미 있는 `OurgoalCalendarKit`·`OurgoalCommKit` 를 같이 쓴다 → 새 전역 0.
- index.html: IIFE 머리 소통 이음매 다음에 이번 이음매(가져오기 4줄 `var X = _calendarKit.X` / `_commKit.X` + expose getter 1개), 옮긴 자리마다 표지 주석 한 줄(이웃은 합침 — 3줄), 새 `<script>` 태그는 그 탭 `index.js` 태그 앞 같은 줄(순증가 0줄).

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- **발견한 기존 결함(이번에 고치지 않음 — 옮기기는 결함도 그대로 옮긴다)**: `generateLockScreenScheduleCardImage` 는 정의되지 않은 이름 `streakDays` 를 읽어(옮긴 파일 366줄, 이전 전 index.html 11971줄) 항상 `ReferenceError` 를 던진다 → 잠금화면 허브의 「잠금화면용 일정 카드 저장」은 이전 전부터 늘 오류 토스트 「카드 생성 중 오류가 발생했습니다」로 끝난다(게스트·실계정 모두 기준에서 확인). 별도 티켓으로 고친다.
- **발견한 진입 경로 문제**: 갓생 카드 창(`openMzShareCardModal`)을 여는 단추 `#recStoryCardBtn`(기록 탭 머리)·`#mzShareBtn`(홈 `.home-actions`)는 4개 테마 모두에서 CSS `display:none !important`(ui.css 7657~7665 · 5540~5543) 로 숨어 있어 화면에서 누를 수 없다. 그래서 법정 형식 화면 시나리오는 잠금화면 묶음만 만들었고, 갓생 카드 보내기 두 창은 게스트 조작 비교(단추 `.click()` 직접 호출, 두 앱 같은 조작)로 쟀다.
- 게스트 시드에는 동반자·참여 팀이 없어 두 보내기 창이 열리지 않는다(「없습니다」 토스트) → 이 빈 경로를 먼저 맞대고, 그다음 두 앱에 같은 조작으로 동반자 1명·참여 팀 1개를 넣어 옮긴 두 창의 열기·닫기·전송·팀 채팅 낙관적 반영까지 맞댔다. 실계정 테스트 계정 A 도 동반자·팀이 없어 실계정 비교는 빈 경로(토스트)까지만 쟀다 — 실계정으로 「전송」·「인증」은 team_pings 행을 쓰므로 누르지 않았다(읽기 전용).
- `generateLockScreenCalendarImage` 는 앱 안에 부르는 곳이 없다(`window` 노출만). 게스트·실계정 비교에서 window 이름으로 직접 불러 캔버스 해시를 맞댔다.
- 지도의 시험지 글자 의존은 이름·글자 포함 여부만 본 넉넉한 근사다. 실제로 깨지는지는 옮겨 보고 시험으로 확인한다(이번 4묶음은 시험 107개 종료 코드 전후 같음).

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/inline-split-1`(브랜치 `feat/2026-10-05-task-es-423-inline-split-1`, 기준 origin/main f020065) → 헌법 세포골격 절·분열 규칙·선례 정독 → 지도 생성기·지도 → 대상 4묶음 선정 → 기준 사본 `git archive f020065`(stash 없음) → 생성기 → verify(토큰·덩어리 줄·누수) → 법정 모듈 로드 탐침 → 신고서·설명·가드 → `npm test`·시험 107개 기준/후 → 게스트 조작 비교(기준 2회·후 1회) → 법정 형식 화면 시나리오 기준/후 → 실계정 읽기 비교(기준·후·기준) → tab-check 기준 2회·후 1회 → 문서 → 커밋 → 세포지도 재생성 → PR → 법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "함수 선언(끌어올림)이 IIFE 머리의 `var` 가져오기로 바뀌어, 그 줄보다 먼저 부르는 곳이 있으면 `undefined` 다." → 이번 이음매는 IIFE 머리(앞선 이음매들 바로 다음)이고 그 앞에는 getter 정의뿐이다. 옮긴 함수를 부르는 곳(G080 잠금화면 허브 클릭 처리기·G091 갓생 카드 창 클릭 처리기·`window.generateLockScreenCalendarImage = …` 노출 줄)은 모두 그 뒤에 실행된다. 측정: 게스트 조작 27단계 콘솔 오류 기준·후 같음(기존 streakDays 1건씩), 실계정 pageerror 0/0/0, `window.generateLockScreenCalendarImage` 종류 function 전후 같음.
- 반론 2: "`L.toast()`·`L.openModal()` 처럼 객체 경유 호출이 되면 `this` 가 바뀌어 동작이 달라진다." → 옮긴 코드가 부르는 인라인 함수 8개는 선례(#379·#411)와 같은 getter 통로이며, 생성기가 옮긴 함수 자신의 최상위 `this`·`arguments` 0 을 검사했다. 측정: 보내기 창 열기·닫기·전송 토스트·confetti 뒤 화면·팀 채팅 낙관적 반영 메시지까지 기준과 같은 값(270값 차이 0).
- 반론 3: "지도 점수는 작업자가 정한 가중치라 '안전'의 근거가 아니다." → 점수는 순서를 정하는 데만 쓰고, 안전은 옮긴 뒤 측정(토큰 동일·조작 비교·tab-check·시험 107개·실계정)으로 따로 보였다. 가중치는 지도 머리에 그대로 적어 다른 세션이 바꿔 볼 수 있다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#calLockScreenBtn`, `#modalOverlay`, `#modalSheet`, `#btnDownloadLockscreenCard`, `#toast`, `#recStoryCardBtn`, `#btnShareStoryToCompanion`, `#btnShareStoryToTeam`, `[data-sendcompstory]`, `[data-sendteamstory]`, `#closeCompStoryModalBtn`, `#closeTeamStoryModalBtn`.
- 함수: `lsDrawRoundRect`, `generateLockScreenCalendarImage`, `generateLockScreenScheduleCardImage`, `openSelectCompanionForStoryModal`, `openSelectTeamForStoryModal`, `openLockScreenHubModal`(남음), `openMzShareCardModal`(남음), `OurgoalAppScope.expose`, `OurgoalCalendarKit`, `OurgoalCommKit`.
- 파일: `index.html`, `js/tabs/calendar/lockscreen-image.js`, `js/tabs/comm/story-card-send.js`, `scripts/inline-script-map.js`, `docs/architecture/INLINE-SCRIPT-MAP.md`·`inline-script-map.json`·`modules.json`·`cell-descriptions.json`·`cell-map.json`·`module-baseline.json`, `docs/design/harness/module-split/gen-inline-split-1.js`·`verify-inline-split-1.js`·`dom-compare-inline-split-1.js`·`real-account-inline-split-1.js`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

기준 = origin/main f020065(`git archive` 사본). 결과 파일은 `reports/TASK-ES-423/`.

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 인라인 줄 수 | `module-guard` ① | 34,007 → 33,385 (−622), ② 함수 선언 663 → 658, ③ 282 그대로, ④ 3 그대로 |
| 글자 동일 | `verify-inline-split-1.js` | 옮긴 5개 함수 토큰열 동일(L. 접두 제외: lsDrawRoundRect 172·generateLockScreenCalendarImage 2020·generateLockScreenScheduleCardImage 1709·openSelectCompanionForStoryModal 462·openSelectTeamForStoryModal 479), 덩어리 4개 줄 단위 동일(구획 주석 포함, 278·223·63·71줄), 누수 0·미노출 0·남은 정의 0·안 가져온 사용 0, 새 파일 530·161줄 (`verify-inline-split-1.json` ok) |
| 원본 단독 로드 | `court/probes/module-load.js` 로컬 | 회귀 0, 새 파일 2개 단독 로드 성공(등록 전역 = 기존 키트 1개씩) |
| 조작 전후(게스트) | `dom-compare-inline-split-1.js` | 27단계 × 10칸 = 270값, 기준 대 후 0, 기준 대 기준 0, 콘솔 오류 1/1/1(기존 streakDays). 지운 값: 시간·난수, 잠금화면 미리보기 시계(분 단위 지금 시각), 정적 서버 무작위 포트 |
| 화면 시나리오(법정 형식) | `court/lib/scenario.js` runScenario 로컬 | `calendar-lockscreen-card-save` 기준·후 모두 통과, 약점 0 |
| 시험 | `npm test` · tests 107개 | smoke 443/0 · 무결성 38/38 · 버튼 943/943 기준=후, 107개 종료 코드 전부 같음(통과 80·기존 실패 27 동일), 출력 차이는 기준 사본에 git 이력이 없어 건너뛴 이력 비교 단언 3곳·경로 글자뿐 |
| 실계정(읽기 전용) | `real-account-inline-split-1.js` 로컬 127.0.0.2 + /api 운영 전달, 테스트 계정 A | 39값, 기준1 대 후 0 · 기준1 대 기준2 0 · 기준2 대 후 0, pageerror 0, 쓴 행 0 |
| 탭 실측 | `tab-check.js all` 기준 2회·후 1회 → `tab-compare.js` | §8 아래 표(실행 결과로 채움) |

[4단계: 심사 청구]
