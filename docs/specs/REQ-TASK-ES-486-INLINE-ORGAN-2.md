# REQ — #TASK-ES-486 인라인 어려움 기관 묶음 이전 2차 — 잠금화면 허브(연속 기록·앱 배지 기관 몫 분리)·일정 탭 공용·4대 뷰 디스패처

- 근거: 코디네이터 지시(2026-10-05 — 기관 빌더, PR 당 600~1,500줄) · 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` 2-7(800줄 초과 묶음은 책임 단위로 나눔) · 헌법 CELL_SPLIT·CELL_SPLIT_PROOF · 앞 PR #769(시험지 선행)·#776(기관 1차, 병합).
- 범위: 어려움 기관 묶음 3개(줄 합 약 1,200줄)를 생성기로 글자 그대로 세포 4개로 옮김. 기능 추가·삭제 0, 마크업·CSS 이동 0, 동결 파일 0, 시험 기대값 변경 0, retire 0, 생성 지도 3종 커밋 0.
- 뺀 것: 「Confetti」·「뱃지 컬렉션」·「전역 7일 유예 통합 휴지통」(H3 빌더 몫). 다음 PR: 「맞춤 피드백 봇 설정」·「프로필」.

## 1. [원칙 ①] 문제 정확히 파악

1. 「[#TASK-ES-181 & #TASK-ES-182] 폰 잠금화면에서 바로 보기 통합 허브 모달」(829줄, 800줄 초과)은 허브 창 하나와, 여러 탭이 부르는 연속 기록·보호권·앱 배지 도우미가 섞여 있다(smoke FN_NAMES 함수 4개 포함).
2. 「일정(캘린더) 탭」(344줄)은 일정 탭 화면 세포들(render·day-detail·day-edit-hub·lockscreen-live)이 `L.` 로 부르는 공용 함수(날짜별 일정 모음·달력 칸)다.
3. 「4대 연계 뷰 원자적 동시 전파 디스패처」(45줄)는 저장 뒤 홈·목표·기록·일정을 한 번에 다시 그린다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 한 묶음에 책임이 둘(창 하나 + 몸 전체 도우미)이라 한 세포로 옮기면 800줄도 넘고 종류도 틀린다.
- **원인**: 구획 주석이 기능 추가 순서로 붙어, 책임이 다른 함수가 한 구획에 쌓였다.
- **중심**: 설정 `take.names` 로 같은 묶음을 두 세포가 이름으로 나눠 가진다 — 도우미는 기관(`js/core/streak-badge.js`, 키트 OurgoalUiHelpers, ui-helpers 태그 뒤), 허브 창은 일정 탭(`js/tabs/calendar/lockscreen-hub.js`, 키트 OurgoalCalendarKit).
- **핵심**: 줄 수로 자르지 않고 책임으로 나눈다. window 노출 묶음 2개는 원래 자리, 로드 중 문은 없다.

## 3. [원칙 ③] 해결방식

| 세포 | 옮긴 것 |
| :-- | :-- |
| `js/core/streak-badge.js` (113줄, 기관) | STREAK_FREEZE_MAX·computeStreakDays·maybeApplyStreakFreeze·maybeGrantStreakFreeze·maybeGrantAvatarCraftBonus·streakBadgeHtml·updateAppBadge |
| `js/tabs/calendar/lockscreen-hub.js` (756줄, 일정 탭) | openLockScreenHubModal |
| `js/tabs/calendar/calendar-core.js` (376줄, 일정 탭) | calCellHtml·calendarItemsByDate·isoDate·pushCalendarEvent·quickSyncToCalendar·toDateTimeLocalValue·toLocalInputValue |
| `js/core/view-dispatch.js` (64줄, 기관) | dispatchFullViewPropagation |

- 설정 `docs/design/harness/module-split/inline-organ-2.json`(자리 HO, label 「인라인 어려움 기관 묶음 이전 2차」).
- `calCellHtml` 은 예전에 동결 무결성 검사가 index.html 에서 그 글자를 찾아 남겨 두었던 함수다(js/tabs/calendar/render.js 머리 주석) — 지금 무결성 검사는 합본(js/tabs·js/core 포함)을 읽어 옮긴 뒤에도 38/38 이다(측정).

## 4. [원칙 ④] 재검토 — 한계

- 일정 탭 달력 칸은 게스트 화면에서 CSS 로 크기 0(보이지 않음)이라, 시나리오는 칸의 존재와 클래스(`cal-cell`)로 잰다(`visible` 아님). 칸 그리기 키트 이름을 지운 돌연변이는 작업 쪽에서 실패한다.
- 실계정 비교는 하지 않았다(구글 캘린더 일정 넣기는 로그인·외부 통신 — 글자 그대로 이전, 토큰 동일).
- main 이 이 PR 사이에 여러 번 움직여(#783·#784·#775) index.html 은 그때마다 main 판을 입력으로 생성기를 다시 돌려 만들었다(최종 기준 c1f0a72 에서 verify ok·시나리오 3개 기준·작업 통과·모듈 로드 회귀 0·npm test 0 을 다시 쟀다. 조작 비교·시험 종료 코드 비교는 바로 앞 기준 97f41a1 에서 잰 값). tab-check 는 앞 PR #776 분을 이어서 재는 중이다(홈·목표·일정, 기준 2회·후 1회) — 결과는 다음 PR 기록에 싣는다(코디네이터 지시).

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/inline-organ`(브랜치 `feat/2026-10-05-task-es-486-inline-organ-3`, push 로 번호 선점) → 설정 → 생성 → verify → 모듈 로드 탐침 → 신고서·설명 → 게스트 시나리오 3개 + 돌연변이 → 조작 비교 → 시험 → main 합치기(index.html 은 main 판을 입력으로 다시 생성) → push → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "한 묶음을 두 세포로 나누면 묶음 안 이름끼리 부르던 것이 끊긴다." → 다른 세포로 간 이름은 `L.<이름>` getter(가져온 같은 함수)로 부르고 생성기가 노출을 스코프 분석으로 채운다. 측정: verify 미노출 0·안 가져온 사용 0, 잠금화면 카드 저장 시나리오(허브 창 → 연속 기록 일수 → 저장 완료 토스트) 기준·작업 통과.
- 반론 2: "일정 탭 공용 함수를 옮기면 그 함수를 `L.` 로 부르던 일정 화면 세포들이 끊긴다." → index.html 머리에서 같은 이름으로 가져오고 getter 는 그 가져온 이름을 읽는다(같은 함수). 측정: 달력 칸 시나리오 통과, 게스트 조작 비교(일정 탭·잠금화면 창 포함) 160값 차이 0, 모듈 로드 회귀 0.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#calLockScreenBtn`, `#btnDownloadLockscreenCard`, `#toast`, `#screen-calendar [data-caldate]`, `.cal-daynum`, `#captureInput`, `#captureSave`, `#btnCheckinAiGoRecords`, `#screen-records`.
- 함수: 3절 표, `OurgoalUiHelpers`, `OurgoalCalendarKit`.
- 파일: `index.html`, `js/core/streak-badge.js`, `js/core/view-dispatch.js`, `js/tabs/calendar/lockscreen-hub.js`, `js/tabs/calendar/calendar-core.js`, `docs/architecture/modules.json`·`cell-descriptions.json`, `docs/design/harness/module-split/inline-organ-2.json`, `reports/TASK-ES-486/`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 결과 |
| :-- | :-- |
| 인라인 줄 | 이전 전 대비 −1,159줄 |
| 글자 동일 | `verify-inline-hard.json` ok — 16개 토큰·줄 동일, 남은 글자 158,215토큰 동일, 누수·미노출·setter 빠짐 0, 처리기 562 = 548 + 14, 새 파일 113·756·376·64줄 |
| 단독 로드 | `module-load-probe.json` 회귀 0, 새 파일 4개 standaloneOk |
| 화면 시나리오 | 3개 기준·작업 통과(잠금화면 카드 저장·달력 칸·체크인 저장 뒤 기록 탭 전파), 돌연변이(calCellHtml 키트 이름 지움) 작업 쪽 실패 |
| 조작 비교 | `dom-compare-inline-organ.json` 160값, 기준 대 후 0 · 기준 대 기준 0, 콘솔 오류 0 |
| 시험 | tests·scripts/test-* 종료 코드 기준과 같음, smoke 443/0 · 무결성 38/38 · 버튼 943/943 (`test-compare.json`) |

[4단계: 심사 청구]
