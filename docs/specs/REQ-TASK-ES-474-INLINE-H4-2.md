# REQ — #TASK-ES-474 인라인 어려움 구역 H4 2차 (전역 공유 팀 로더·팀 화면 · 기록 내보내기 · 위클리 리캡)

- 근거: 헌법 v2026.10.05-CELL 세포골격 절(CELL_SPLIT · CELL_SPLIT_PROOF · claims_hygiene), 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md`(2절 표준 이음매 · 3절 자리 표지 H4), 시험지 선행 #TASK-ES-468(PR #770, 병합), 1차 #TASK-ES-461(PR #773).
- 지시(2026-10-05, 상민님): "미분화 덩어리 분열 작업을 우선순위로" → 코디네이터 배정: 어려움 구역 H4.
- 범위: 생성기(`gen-inline-hard.js`, 설정 `docs/design/harness/module-split/inline-h4-pr2.json`)로 글자 그대로 옮긴다. 동작 0 변경.
  - 「전역 공유 팀 로더 & 렌더링 (#TASK-ES-133)」 → `js/tabs/comm/shared-groups.js` (loadSharedGroups · renderCommGroups · renderGroupDetail · collectiveGaugeHtml · promptNewGroup)
  - 「캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명)」 함수 → `js/tabs/records/export-theme.js` (fetchSignedCalendarToken · buildWebCalUrl · buildICS · buildMarkdownExport · openExportThemeModal · exportAllCheckins)
  - 「위클리 리캡 카드 (스포티파이 랩드 스타일, 공유 캔버스 인프라 재사용)」 → `js/tabs/records/weekly-recap.js` (weeklyRecapStats · fitBigFont · generateWeeklyRecapImage · findBestMoment · openWeeklyRecapModal · openLegacyRecapCanvasModal · openRecordModal · 로드 중 등록 문 5개 → bindRecTimeTrackerBtn · bindRecSegmentBar · bindRecPulseBar · bindRecCarouselPills · bindRecDocumentClick). 결함 PR #767(가짜 연속·하드코딩 레벨 수정) 병합 뒤 main 판을 옮겼다.
- 생성기 한 곳 고침: 「한 줄에 두 문」·「문 끝 줄 뒤 다른 코드」 검사를 그 문을 옮기거나 감쌀 때만 멈추게 했다(원래 자리에 남는 문은 그 줄을 손대지 않는다). 캘린더 묶음 끝의 `var shareContent = …; window.shareContent = shareContent;` 한 줄 때문에 묶음 전체가 멈추던 것을 푼다.

## 1. [원칙 ①] 문제 정확히 파악
세 묶음은 지도 등급 「어려움」(A2 내 상태를 남이 씀 · B1·B2·B3 로드 중 문 · D 큰 상수 · E 순환 · F1m 시험지 선행 · F2 smoke FN_NAMES · L 통로 밖 이름)이다. 공유 팀 묶음의 시험지 선행은 #770 으로 풀렸다(시험지 합본 읽기). 캘린더 묶음은 생성기가 한 줄 두 문에서 멈췄다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 소통 탭 팀 화면과 기록 내보내기 창이 index.html 미분화 덩어리 안에 있어 세포 경계(신고서·가드)가 닿지 않는다.
- **원인**: 공유 상태(`SHARED_GROUPS_LOADED` · `_cachedSignedCalendarToken` · `MOCK_GROUPS`)를 다른 묶음과 같이 쓰고, smoke-test 가 잘라 가는 순수 함수(buildWebCalUrl · buildICS · buildMarkdownExport)와 로드 중 한 줄 문이 섞여 있다.
- **중심**: 표준 이음매(상태·노출·한 줄 문은 원래 자리, 함수만 세포로, 머리 가져오기는 자리 표지 H4 아래).
- **핵심**: 손으로 옮긴 글자 0, verify ①~⑦ 통과, 게스트 화면 차이 0.

## 3. [원칙 ③] 해결방식
설정 `inline-h4-pr2.json`(slot H4; 공유 팀은 `take.all`, 캘린더·리캡은 `take.names` + `keepRest`(리캡은 wrap 이름 5개)) → 생성기 → 검사기 → 신고서(`module-specs --write` · role 손 칸) · `cell-descriptions.json`. 생성 지도 3종은 커밋하지 않는다.

## 4. [원칙 ④] 재검토 — 한계(정직하게)
- 서버 공유 팀 불러오기(loadSharedGroups)·캘린더 서명 토큰(fetchSignedCalendarToken)은 로그인·서버가 있어야 돈다 — 게스트로는 팀 화면·새 팀 창, 내보내기 창까지 잰다. 글자는 verify 토큰 동일로 보증한다.
- smoke FN_NAMES 함수(weeklyRecapStats · buildWebCalUrl · buildICS · buildMarkdownExport)는 #TASK-ES-465 뒤 smoke-test 가 인라인 합본(js/tabs 세포 포함)에서 잘라 가므로 생성기가 허용해 같이 옮겼다(smoke 443 통과 그대로). `MOCK_GROUPS` 는 초기값에 실행되는 식(호출)이 있어 생성기 규칙대로 원래 자리(상태 변수 취급).
- 발견(고치지 않음): 기록 탭 세그먼트 막대(#recSegmentBar)는 네 테마 모두 ui.css 의 display:none !important 로 숨어 있고, 기록 추가 단추(#recAddBtn)도 마크업 인라인 display:none !important 다 — 그 단추만 부르는 bindRecSegmentBar 경로·openRecordModal 진입은 게스트가 누를 수 없다(시나리오는 미니 성취 펄스 막대로 잰다). 시간 기록 단추(#btnOpenTimeTracker)는 직접 처리기와 문서 위임 클릭 처리기 둘 다에 걸려 있다(이전 전과 같음).
- 생성기 고침은 옮기는 문의 검사를 느슨하게 하지 않는다(옮기거나 감싸는 문이 한 줄을 나누면 여전히 멈춘다).

## 5. [원칙 ⑤] 절차
main 위 worktree → 설정 → 생성기 → verify → 모듈 로드 탐침 → 신고서 → tests 전후 → 게스트 조작 비교(기준 2회·후 1회) → 게스트 시나리오 3개 로컬(기준·작업) → 로컬 법정 예비 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1: "생성기 검사를 풀면 한 줄에 섞인 코드가 잘려 옮겨질 수 있다." → 푼 것은 남는 문뿐이다. 옮기거나 감싸는 문에 줄 문제가 있으면 계획 단계에서 같은 문구로 멈춘다(`lineIssue`). verify 의 남은 글자 동일이 그 줄이 그대로임을 잰다.
- 반론 2: "팀 만들기 창 시험지가 깨진다." → #770 이 시험지를 합본 읽기로 넓혔다(단언·기대값 그대로). 이 PR 의 tests 전후 비교에서 그 시험지 종료 코드가 같다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#weeklyRecapBtn` · `#recMiniPulseBar` · `#btnRecapOpenCanvas` · `#btnRecapTopClose` · `#btnHeroCreateTeamComm` · `#grpSave` · `#grpCancel` · `#exportRecordsBtn` · `#expThemeSel` · `#mExpCopyPrompt`, 함수 `loadSharedGroups` · `renderCommGroups` · `renderGroupDetail` · `collectiveGaugeHtml` · `promptNewGroup` · `openWeeklyRecapModal` · `bindRecPulseBar` · `fetchSignedCalendarToken` · `openExportThemeModal` · `exportAllCheckins`, 파일 `js/tabs/comm/shared-groups.js` · `js/tabs/records/export-theme.js` · `js/tabs/records/weekly-recap.js` · `docs/design/harness/module-split/gen-inline-hard.js` · `docs/design/harness/module-split/inline-h4-pr2.json` · `docs/design/harness/module-split/dom-steps-inline-h4-474.js`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)
| 항목 | 결과 (출처) |
| :-- | :-- |
| verify | ok · 토큰 동일 · 남은 글자 동일 · 이중 처리기 0 (`reports/TASK-ES-474/verify-inline-hard.json`) |
| 새 파일 줄 수 | 621 · 310 · 666 (800 이하) |
| 원본 단독 로드 | 회귀 0, 새 파일 3개 단독 로드 ok (`module-load-probe.json`) |
| tests 전후 | 종료 코드 같음, npm test 통과·실패 수 같음, smoke 443/0 (`test-compare.json`) |
| 게스트 조작 비교 | 21단계 기준 대 후 차이 0 · 기준 대 기준 0 (`dom-compare-inline-h4.json`) |
| 게스트 시나리오 | 3개 기준·작업 통과 (`scenario-local.json`) |

[4단계: 심사 청구]
