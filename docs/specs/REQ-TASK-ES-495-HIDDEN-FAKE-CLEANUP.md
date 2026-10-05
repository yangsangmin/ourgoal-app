# REQ — #TASK-ES-495 숨은·가짜 기능 정리 4건 (히트맵 요약 스위치 · 챌린지 룸 세포 소멸 · 숨은 소통 허브·빠른 게시 띠 · 가짜 응원 바·DM 시트)

- 근거: 상민님 승인 2026-10-05 『결심필요항목들 4건 모두 권장안으로 진행해』(오케스트레이터 전달 — 원문은 오케스트레이터 세션). 승인선 ③(기존 기능의 실제 삭제). 헌법 v2026.10.05-CELL 세포골격 lifecycle 4(소멸: 연결 해제 → 데이터 보존 → 흔적 0 검사 → 신고서 삭제), 제3조 제2항(CSS 은폐 금지), 제6조(가짜 피드백 금지).
- 발견 출처: 인라인 어려움 구역 H4(#TASK-ES-461·#TASK-ES-474)와 시범 #TASK-ES-439 의 발견 목록, 숨김 게이트 허용 목록(`docs/architecture/hidden-entry-baseline.json`).

## 1. [원칙 ①] 문제 정확히 파악 — 지우기 전 실제 동작(코드에서 읽은 그대로)

1. **홈 구성 「최근 히트맵 요약」 스위치** — `js/customize.js` WHITELIST 19행 `{ id: 'homeGrassSummaryCard', label: '최근 히트맵 요약', hint: '최근 2주간의 기록 한눈에' }` 와 index.html 홈 카드 `<div id="homeGrassSummaryCard" style="display:none !important;" data-home-widget=… data-widget-label="최근 히트맵 요약" …>`. 설정 「홈 구성 고르기」(#homeLayoutOpenBtn → OurgoalCustomize.open) 창에 스위치 줄로 나오고, 켜고 끄면 `apply()` 가 그 카드의 인라인 display 만 바꾼다. 그런데 카드는 마크업 인라인 `display:none !important` 라 스위치를 켜도 보이지 않는다(인라인 !important 가 이김) — 누르는 대로 아무 변화가 없는 스위치다. `MINIMAL_HIDDEN` 에도 들어 있었다.
2. **챌린지 룸 세포 `js/tabs/comm/challenge-room.js`** — `openChallengeRoomModal()` 하나: 가상 방 6개(호스트 정지호·김도윤·이지민 … 하드코딩)를 「소규모 챌린지 룸 (동료 페이스메이커)」 창에 그리고, 「참여」를 누르면 `state.profile.settings.challenges` 배열에 방 id 를 넣고 저장·토스트. **부르는 곳 0**(index.html·js 전수 grep: 함수 정의·키트 등록·스모크 글자 검사뿐, 가져오기·onclick·호출 없음). 홈 「내 성장 확인하기」(#homeChallengeRoomBtn)는 이름만 비슷하고 기록 탭으로 이동한다(이 세포를 부르지 않는다).
3. **숨은 소통 허브 #commHubGrid + switchCommSubTab** — 마크업 `<div class="comm-hub-grid" id="commHubGrid" style="display:none !important;" aria-hidden="true">` 안 단추 3개(피드·동반자·팀)가 `onclick="switchCommSubTab(…)"`. `switchCommSubTab` 은 `state.commSubTab` 을 바꾸고 단추 active 를 옮긴 뒤 정의가 없는 `renderFeedList`·`renderCrewScreen`·`renderTeamScreen` 을 `typeof` 로 찾다가 `renderCommScreen` 으로 넘어가고 「○ 탭으로 전환되었습니다」 토스트. 허브가 숨어 있어 누구도 누를 수 없다(숨김 게이트 허용 목록 「옛 소통 허브 격자」). 같은 일은 소통 탭 `.comm-subtab`(피드·팀·동반자·DM·마니또·공유)이 한다.
   **숨은 빠른 게시 띠** — `renderCommFeed` 안 `quickPostBannerHtml = '<div class="comm-quick-strip" style="display:none !important;">' … '<button … id="feedQuickPostBtn" … onclick="openShareToFeedModal()">게시하기</button>'`. 늘 숨어 있다. 같은 일은 보이는 「피드 게시」(#btnCommPostFeed)가 한다(그대로 둔다).
4. **보이는 가짜 피드백** — 소통 탭에 보이는 「무공해 응원:」 바(#commFloatingReactionDock, 🔥👏❤️🚀 단추 4개)가 `triggerFloatingReaction(emoji)` 를 부른다: 화면 숫자 `window._commReactionCounts[emoji]` 만 1 올리고 이모지 떠오름 효과를 붙인 뒤 「따뜻한 응원을 전송했습니다! ✨」 토스트 — **서버·상대에게 보내는 코드가 없다**. `openInAppDmSheet()` 는 숨은 프로필 시트(#commProfileBottomSheet, 하드코딩 「🦁 성장 러너 · 매일 아침 6시 런닝」)를 여닫고 「안전한 인앱 1:1 대화방이 연결되었습니다」 토스트 — **대화방을 열지 않는다**. 이 함수를 부르는 단추(#btnInAppDmStart)는 그 시트 안에 있어 시트가 닫혀 있으면 누를 수 없다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 누르면 반응은 하지만 실제로는 아무 일도 하지 않거나(가짜 피드백·안 보이는 스위치) 아무도 누를 수 없는(숨김·호출 0) 코드가 앱에 남아 신뢰를 깎는다.
- **원인**: 옛 화면을 새 화면으로 바꾸면서 옛 단추를 지우지 않고 `display:none !important` 로 덮었고, 시연용 가짜 동작을 실제 기능으로 바꾸지 않았다.
- **중심**: 지울 것(마크업·함수·노출 줄·세포 파일)과 남길 것(보이는 진입로 #btnCommPostFeed·.comm-subtab, 사용자 저장 칸 settings.challenges, 히트맵 카드 자체)의 경계.
- **핵심**: 전수 grep 으로 부르는 곳 0 을 확인하고 지운 뒤, 흔적 0·숨김 게이트 기준선 감소·게스트 화면 시나리오(사라졌음 + 남은 진입로 정상)로 잰다.

## 3. [원칙 ③] 해결방식
1. `js/customize.js` WHITELIST·MINIMAL_HIDDEN 에서 `homeGrassSummaryCard` 를 빼고, index.html 카드의 `data-home-widget`·`data-widget-label`·`data-widget-hint` 속성을 뺀다(자동 발견 `discoverWidgets` 가 다시 줄을 만들지 않게). 카드 요소·히트맵 그리기(js/tabs/records/heatmap-summary.js · js/tabs/home/sub-heatmap.js)는 그대로.
2. 챌린지 룸 소멸: ① 연결 해제 — index.html script 태그 제거 ② 데이터 보존 — `settings.challenges` 기본값(js/tabs/settings/app-defaults.js)·저장된 사용자 값은 지우지 않는다(읽는 코드만 없어짐) ③ 파일 삭제 ④ 흔적 0 검사 ⑤ 신고서(modules.json·cell-descriptions.json)에서 삭제.
3. index.html 의 #commHubGrid 마크업·`switchCommSubTab` 정의·노출 줄, `renderCommFeed` 의 `quickPostBannerHtml` 정의와 사용 제거.
4. index.html 의 #commFloatingReactionDock·#commProfileBottomSheet 마크업과 `triggerFloatingReaction`·`window._commReactionCounts`·`openInAppDmSheet` 정의·노출 줄 제거.
- 시험지: 지운 것을 「있다」로 재던 글자 검사를 「없다」로 바꾼다(scripts/smoke-test.js 6곳, tests/home-customizer-auto-sync.test.js 기대 목록 1줄). 기준 커밋 시험지로 채점하면 깨지므로 주장 파일 `retire` 에 검사 제목별 사유를 적는다.
- [기본값] ui.css 의 옛 규칙(.comm-hub-grid·.reaction-floating-bar·.btn-reaction-chip·.comm-profile-bottomsheet·.comm-quick-strip·.challenge-room-card)은 이번에 지우지 않았다 — 맞는 요소가 0이 되어 동작이 없고, 여러 선택자를 묶은 규칙(예: 1172행 카드 공통 규칙)을 손으로 쪼개면 다른 화면이 바뀔 위험이 있다. 별도 CSS 정리 티켓.

## 4. [원칙 ④] 재검토 — 한계(정직하게)
- 챌린지 룸은 부르는 곳이 0 이라 「사라졌음」을 화면으로 보일 진입로가 원래 없다 — 신고서 삭제·모듈 로드 탐침(removed)·흔적 grep 으로 잰다.
- 히트맵 요약 카드는 원래 늘 숨어 있었다(인라인 !important). 카드를 살릴지는 이번 범위 밖이다.
- ui.css 옛 규칙은 남았다(위 [기본값]).

## 5. [원칙 ⑤] 절차
main 위 새 worktree → 항목마다 코드 읽기·전수 grep → 지우기 → module-specs·신고서 → 숨김 게이트 `--update`(줄이는 방향) → smoke·tests 전후 비교 → 게스트 시나리오(기준 실패·작업 통과) → 로컬 법정 예비 → PR(병합은 오케스트레이터).

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1: "지운 함수를 바깥 파일이 부를 수 있다." → index.html·js/**·tests·scripts 전수 grep: `switchCommSubTab`·`triggerFloatingReaction`·`openInAppDmSheet` 는 마크업 onclick(지움)과 js/tabs/settings/quick-actions.js 머리 설명 글자뿐(글자 고침), `openChallengeRoomModal` 은 세포 파일·스모크 글자뿐. 단독 로드·tests 전후 비교로 회귀 0 을 잰다.
- 반론 2: "사용자 데이터가 사라진다." → `settings.challenges` 는 지우지 않는다(기본값·저장값 그대로, 읽기만 안 함). 다른 저장 칸은 건드리지 않는다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#homeGrassSummaryCard` · `#kf1LayoutList` · `#homeLayoutOpenBtn` · `#commHubGrid` · `#btnCommHubFeed/Crew/Team` · `#commFloatingReactionDock` · `#btnFloatingReact*` · `#commProfileBottomSheet` · `#btnInAppDmStart` · `.comm-quick-strip` · `#feedQuickPostBtn` · `#btnCommPostFeed`(유지), 함수 `switchCommSubTab` · `triggerFloatingReaction` · `openInAppDmSheet` · `openChallengeRoomModal` · `renderCommFeed`, 파일 `index.html` · `js/customize.js` · `js/tabs/comm/challenge-room.js`(삭제) · `js/tabs/settings/quick-actions.js`(설명 글자) · `docs/architecture/modules.json` · `docs/architecture/cell-descriptions.json` · `docs/architecture/hidden-entry-baseline.json` · `scripts/smoke-test.js` · `tests/home-customizer-auto-sync.test.js`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)
| 항목 | 결과 (출처) |
| :-- | :-- |
| 흔적 | 지운 이름 13개 grep — 제품 파일 0(스모크의 「없다」 단언만 남음), ui.css 옛 규칙만 남음 |
| 숨김 게이트 | 숨은 처리기 요소 60 → 57, 허용 목록 밖 0, 허용 목록 3개 지움(`--update`) (`reports/TASK-ES-495/hidden-entry-guard.json`) |
| npm test | 작업 종료 0 · smoke 443/0 · 버튼 배선 943 → 929(지운 단추) · 원본 단독 로드 회귀 0 (`test-compare.json`·`module-load-probe.json`) |
| tests 전후 | 종료 코드가 갈린 시험지: tests/cell-map-export-es414.test.js(기준 사본 git 이력 없음 — 작업 통과)만. tests/home-customizer-auto-sync.test.js 는 기대 목록 1줄을 고쳐 작업 통과(기준 시험지로는 깨짐 — retire) |
| 게스트 시나리오 | 3개 — 기준 실패(지울 것이 있음)·작업 통과 (`scenario-local.json`) |

[4단계: 심사 청구]
