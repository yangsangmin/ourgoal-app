# REQ — #TASK-ES-462 세포 분열 중 발견된 기존 결함 묶음

- 근거: 코디네이터 지시(2026-10-05) — 인라인 스크립트 세포화(#TASK-ES-436~456)·성소 엔진 분열(#TASK-ES-429) 중 발견된 기존 결함 9건 + 추가 2건(홈 구성 레벨 배지 문구, 목표 상세 서랍 진입로). 모두 분열 전부터 있던 결함이다(분열 PR 은 "버그도 그대로 옮긴다"는 규칙이라 그때 고치지 않았다).
- 범위(바꾼 파일): `ui.css`(1곳), `js/tabs/goals/render.js`, `js/sanctuary-weekly-recap.js`, `js/sanctuary-v3-engine.js`, `js/sanctuary-goal-trail.js`, `js/customize.js`, `index.html`(인라인 스크립트 3줄 + 마크업 속성 1줄), `tests/sync-server-records-render-home.test.js`(새 시험), `reports/TASK-ES-462/**`.
- 범위 밖(보고만 — 이 PR 의 지시 항목이 아님, `claims.json` requirements 에서 내리고 `outOfScopeReports` 로 옮김, 별도 티켓 후보): 챌린지 룸 창 연결(1), 가려진 버튼(4), desktop-widget-suite 시험(9), 같은 허상 스트릭이 남은 인라인 통계 카드 1곳(index.html `streakVal … || 3`, 인라인 분열 빌더 구역).

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 챌린지 룸 창 `openChallengeRoomModal`(js/tabs/comm/challenge-room.js) 부르는 곳 0 — 동작하면 진입로 연결, 안 하면 보고.
2. PWA 설치 안내 창 `switchPwaOsTab`(js/tabs/settings/pwa-install.js): 단추 활성만 바뀌고 iOS·Android 단계(#pwaGuideIosSteps·#pwaGuideAndroidSteps)가 둘 다 보임.
3. 목표 탭 빈 화면 `#goalTemplateHeroCard` 가 문서에 두 번.
4. 가려져 진짜 마우스로 못 누르는 버튼: 홈 `#checkinFeedbackTierBar`(가리는 것 `#homeCompassCrew`), 설정 `#btnModeGamified` 등.
5. 관리자 복구 `syncServerRecords`(index.html)가 없는 `renderHomeScreen` 호출.
6. 성소 위클리 리캡 카드: `profile.streak || 3` 가짜 「3일 연속」, 하드코딩 「Lv.1」.
7. 기록 탭 윗줄 단추 375px 넘침.
8. 목표 0개 게스트: 홈 「🎯 오늘 목표」 시트에 3대 퀘스트·요약이 안 그려짐.
9. `tests/desktop-widget-suite.test.js` 가 main 에서 실패(「4대 뷰 동시 전파」 3 !== 4).
10. 설정 「홈 구성」 목록의 레벨 배지(#levelBadgeRow)가 잠금 「상단 고정」인데 화면엔 없음(#TASK-ES-140 으로 내림) — 배지를 되살리지 말고 문구만 사실대로, 항목 삭제 금지.
11. 목표 상세 서랍 `#goalDetailDrawer`(index.html `openGoalDetailDrawer`) 부르는 곳 0 — 목표 탭 진입로 연결(기존 카드 탭 동작 유지), 마일스톤 토글의 서버 저장 확인.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- 본질: 코드는 있는데 화면에서 사실과 다르게 보이거나(가짜 수치·두 OS 동시·잠긴 「켜짐」), 닿을 길이 없거나(서랍), 갱신·저장이 끊긴(복구 뒤 홈, 서랍 토글) 배선 결함이다.
- 원인(측정, 기준 origin/main 9258f117):
  - 2: `ui.css` `.pwa-step-grid { display: grid !important }` 가 `switchPwaOsTab` 이 거는 인라인 `display:none` 을 이긴다.
  - 3: `js/tabs/goals/render.js` 가 목표 0개일 때 `#personalGoalsEmptyGuideSlot` 에 안내(`renderPersonalGoalsEmptyGuideHtml`)를 그리는데, 같은 함수가 그 부모 `#personalGoalsView` 를 `goals.length > 0` 일 때만 보이게 한다 — 늘 숨은 칸에 그려 성소 목표 화면(`js/sanctuary-v3-engine.js renderSanctuaryGoals`)의 카드와 id 가 겹친다.
  - 5: index.html `syncServerRecords` 의 홈 분기가 정의 없는 `renderHomeScreen()` → ReferenceError 가 catch 에 삼켜져 `false` 반환·홈 미갱신(시험으로 재현: 기준 「renderHomeScreen is not defined」).
  - 6: `profile.streak` 는 어디서도 채우지 않는 칸이라 `|| 3` 이 늘 이긴다(리캡 카드·리캡 PNG·기록 히트맵 카드 3곳), 레벨은 글자 「Lv.1」.
  - 7: `#sRecModesWrap` 인라인 `grid-template-columns:repeat(3,minmax(min-content,1fr))` + 단추 `white-space:nowrap` → 칸이 글자 폭으로 늘어 117+119+132px(+간격) 가 341px 칸을 넘는다.
  - 8: `renderHome` 이 목표 0개면 시작 카드를 그리고 `return` — 함수 끝의 `renderTodayGlancePill`·`renderDailyQuestBar`·`OurgoalCustomize.apply` 를 건너뛴다.
  - 10: index.html `#levelBadgeRow` 의 `data-widget-label="아바타 & 레벨 배지"` 와 js/customize.js WHITELIST 같은 문구 — 화면(홈 원스크린 아바타 카드)에는 레벨 숫자 없이 경험치 바만 있다.
  - 11: `openGoalDetailDrawer` 는 `window.` 노출만 있고 부르는 곳 0. `toggleMilestoneInDrawer` 는 메모리만 바꾸고 `saveProfile` 을 부르지 않아 새로 고치면 체크가 사라진다(기기·서버 어디에도 저장 안 됨).
- 중심: 화면 상태의 주인 — PWA 단계는 `switchPwaOsTab`(인라인 display), 목표 빈 안내는 성소 목표 화면, 스트릭은 `computeStreakDays`, 레벨은 `levelProgress(settings.xp.total)`(로그인 사용자는 서버 원장 판 #TASK-ES-421), 목표 저장은 `saveProfile`(goals upsert + 기기 사본).
- 핵심: 주인 하나만 그 상태를 정하게 한다 — CSS `!important` 를 빼고, 숨은 칸엔 그리지 않고, 가짜 기본값 대신 실제 함수 값(없으면 줄을 뺌), 조기 반환도 같은 마무리, 서랍 토글도 `saveProfile`.

## 3. [원칙 ③] 해결방식

- 2: `ui.css` `.pwa-step-grid` 의 `display: grid !important;` 한 줄을 지움(마크업 인라인 `display:grid/none` 이 기본값을 이미 줌). 새 `!important` 0.
- 3: `js/tabs/goals/render.js` — `#personalGoalsView` 가 보일 때만 빈 안내를 그림(`guideSlotShown`).
- 5: index.html `renderHomeScreen()` → `renderHome()`.
- 6: `js/sanctuary-weekly-recap.js` 에 `realStreakDays()`(app-scope 통로의 `computeStreakDays`, 0 이면 null)·`realLevel()`(`window.levelProgress(settings.xp.total).level`) — 카드는 값이 없으면 스트릭 줄·「Lv.」를 그리지 않음, PNG 는 「오늘부터 시작」. `js/sanctuary-v3-engine.js` 히트맵 카드의 `s-heat-sub` 도 같은 함수(키트 `OurgoalSanctuaryV3Kit.weeklyRecap.realStreakDays`)로.
- 7: `js/sanctuary-v3-engine.js` 모드 줄 — `minmax(0,1fr)`, 단추 `min-width:0; white-space:normal; word-break:keep-all; line-height:1.15; padding:4px 6px`.
- 8: index.html `renderHome` 조기 반환 직전에 함수 끝과 같은 마무리 3개(한 줄).
- 10: index.html 마크업 `data-widget-label/hint` 와 js/customize.js WHITELIST 문구를 「아바타 & 경험치 바 — 홈 맨 위 아바타 카드에 들어 있어요, 따로 보이는 레벨 배지는 없어요(상단 고정)」로. 항목·잠금·CORE_IDS 그대로.
- 11: `js/sanctuary-goal-trail.js` 트레일 머리(.m-title-col)에 `#sGoalDetailBtn` 「📋 상세 보기」(`data-goalid` → `window.openGoalDetailDrawer`). 노드 누름(`toggleMilestone`) 그대로. index.html `toggleMilestoneInDrawer` 끝에 `saveProfile()`(트레일 토글과 같은 저장 경로).
- 대안 비교: (2) `!important` 로 숨기는 새 규칙 — CSS 은폐 금지, 기각. (3) 성소 쪽 카드 id 바꾸기 — 시험·지도가 id 를 고정, 기각. (6) 레벨을 서버에서 직접 읽기 — 이미 `settings.xp` 가 원장 판을 가리킴(#TASK-ES-421), 같은 값을 두 길로 읽지 않음. (11) 기존 카드 누름을 서랍으로 바꾸기 — 지시가 금지, 기각.

## 4. [원칙 ④] 재검토 — 한계와 모순(정직하게)

- 1(보고만): 챌린지 룸 창의 방 10개는 코드에 박힌 가짜 사람(정지호·김도윤…)·가짜 인원수이고 「참여하기」는 기기 설정에 id 만 넣는다. 진입로를 붙이면 가짜 사람을 사용자에게 보이게 된다(GUARD_02 가짜 봇·제13조, #TASK-ES-348 가짜 사람 정직화와 충돌). 옛 진입 단추 `#homeChallengeRoomBtn` 은 이미 「내 성장 확인하기」(기록 탭 이동)로 바뀌었다. 연결하지 않았다.
- 4(보고만, 결함 아님): 두 버튼 모두 닫힌 `<details>` 안이다(`.checkin-more-options` 「🤖 AI 피드백 모드 설정」, 설정 「🎨 화면 & 홈 구성」). 닫힌 details 내용은 getBoundingClientRect 가 0 이 아니어서 감사 도구가 보이는 것으로 셌고, 그 좌표의 elementFromPoint 는 뒤에 있는 요소(#homeCompassCrew·하단 탭)를 돌려줬다. 법정 실행기로 펼친 뒤 진짜 마우스 클릭을 375·390·1280 에서 쟀더니 기준 커밋에서 모두 눌렸다(`reports/TASK-ES-462/occlusion-check.json`). 고칠 겹침이 없다.
- 9(보고만): 시험이 낡았다. `js/components-widget-actions.js handle전체공통_Item62Action` 은 #TASK-ES-353(28f75b6, 「미정의 renderCalendar 52곳 → renderCalendarScreen」)부터 `win.renderCalendarScreen` 을 부르는데, 시험의 가짜 window 는 아직 `renderCalendar` 만 준다 → 3. 제품이 맞다(앱에 `window.renderCalendar` 는 없고 `window.renderCalendarScreen` 은 있다). 시험 단언·가짜 이름 수정은 시험 고치기라 하지 않았다. 덧붙여 실제 앱에서는 `window.renderHome` 이 전역이 아니라 이 단추가 홈을 다시 그리지 못한다(별도 후보).
- 6 의 남은 곳: index.html 인라인 통계 요약 카드(「포커스 스트릭」 `state.profile.streak || 3`)는 인라인 분열 빌더 구역이라 이번에 안 바꿨다(후속). 리캡 카드의 「누적 N시간」은 시간 없는 기록을 25분으로 센다(`durationMinutes || 25`) — 같은 허상 의심, 이번 지시 범위 밖이라 보고만.
- 8: 인라인 본문 1줄 추가 — 인라인 분열 빌더가 renderHome 을 옮길 때 이 줄도 글자 그대로 옮기면 된다.
- 11: 서버 저장은 `saveProfile` 의 goals upsert 경로라 로그인 계정 실측은 법정이 못 잰다(needs-live-server). 게스트는 새로 고친 뒤에도 체크가 남는 것(기기 사본)을 시나리오로 잰다.
- 로그인 화면·실기기는 재지 않았다.

## 5. [원칙 ⑤] 절차

1. origin/main `git archive` 기준 사본 → 2. 법정 실행기(`court/lib/scenario.js`·`static-server.js`·법정 호스트)로 원인 실측 → 3. 게스트 시나리오 8개 + 노드 시험 1개 → 4. 기준 실패 확인 → 5. 수정 → 6. 작업 통과 → 7. npm test·tests/*.test.js 기준·작업 비교 → 8. module-guard → 9. REQ·claims·dev_log·TICKETS → 10. main 합치기·push·PR·법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "가짜 3일을 빼면 리캡 카드가 빈약해 보여 공유 동기가 준다." → 격파: 헌법 허상지표 금지(`fake_`·`hard_coded_stat`)와 E3 무오염 원칙이 우선이다. 실제 스트릭이 1일 이상이면 그대로 보이고(시나리오 records-recap-real-streak), 0 이면 줄만 빠진다 — 숫자를 지어내지 않는다.
- 반론 2: "숨은 칸에 안내를 그리지 않으면 기능 삭제다." → 격파: 그 칸의 부모는 목표 0개일 때 늘 숨겨지고 안내는 목표 0개일 때만 그려진다 — 두 조건이 겹치는 순간이 없어 사용자가 본 적이 없는 화면이다. 보이는 안내(성소 목표 화면 카드)는 그대로 있고 「+ 담기」도 동작한다(시나리오 goals-template-hero-single).

## 7. [원칙 ⑦] 단계별 실행 — 측정(작업자, 판정 아님)

- 시나리오 8개: 기준 8개 모두 실패(증상 단계에서) · 작업 8개 모두 통과·동작 입증(`reports/TASK-ES-462/scenario-local.json`).
- 노드 시험 `tests/sync-server-records-render-home.test.js`: 기준 실패(「renderHomeScreen is not defined」) · 작업 통과.
- npm test: 작업 종료 코드 0(smoke 443 통과·0 실패, 클릭 감사 38/38). 기준 사본은 git 저장소가 아니라 `cell-map-export-es414` 만 환경 차이로 실패, 같은 수(443·38).
- tests/*.test.js 109개 종료 코드: 작업이 기준보다 실패가 늘지 않음(새 시험 1개 통과, 기존 실패 묶음 동일).
- 새 `!important` 0 · 숨김 패턴 0 · 가짜 스트릭/레벨 글자 5곳 제거·0 추가(`reports/TASK-ES-462/constraints.json`).
- module-guard 통과(새 js 파일 없음).

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정

- 법정 화면 폭: 로컬 Windows 헤드리스는 창 최소 폭이 500px 이라 375 시나리오는 `setViewport` 로 맞췄다(`records-mode-row-375`). 칸 너비 105px×3 은 375px·모드 줄 341px 에서의 값이다.
- 인라인 분열 빌더와 같은 index.html 을 고친다 — 고친 줄이 3줄뿐이라 합칠 때 충돌은 작다. 충돌하면 main 판 위에 같은 3줄을 다시 얹는다.
- 성과: 시나리오 8개 「확인됨」, 정적 주장 「글자만 확인」 아닌 jsonPath 측정값.
