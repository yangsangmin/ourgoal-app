# REQ — #TASK-ES-471 인라인 어려움 기관 묶음 이전 1차 — 공용 부품 8묶음을 js/core 세포 7개로(동작 그대로)

- 근거: 코디네이터 지시(2026-10-05 — 기관 16묶음 빌더, 들어오는 묶음 많은 순, PR 당 600~1,500줄) · 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md`(표준 이음매 2절·자리 표지 3절) · 헌법 CELL_SPLIT·CELL_SPLIT_PROOF · 시험지 선행 #TASK-ES-465(PR #769, 병합됨).
- 범위: 어려움 기관 묶음 8개(줄 합 약 850줄)를 생성기로 글자 그대로 `js/core/*.js` 7개로 옮김. 기능 추가·삭제 0, 마크업·CSS 이동 0, 동결 파일 0, 시험 기대값 변경 0, retire 0, 생성 지도 3종(module-baseline·cell-map·inline-script-map) 커밋 0.
- 뺀 것: 「Confetti」·「뱃지 컬렉션」·「전역 7일 유예 통합 휴지통」은 H3 빌더가 맡았다(2026-10-05 코디네이터). 다음 PR: 「폰 잠금화면 통합 허브 모달」·「맞춤 피드백 봇 설정」·「프로필」·「일정(캘린더) 탭」·「4대 연계 뷰 디스패처」(다음 PR).

## 1. [원칙 ①] 문제 정확히 파악

1. 기관 묶음은 여러 구역(H1~H4)이 부르는 공용 부품이라, 이것이 인라인에 남아 있으면 구역 빌더가 옮긴 세포가 계속 인라인 스코프(`L.` 통로)에 기대야 한다. 들어오는 묶음이 많은 것부터 옮긴다.
2. 이번 대상(들어옴 묶음 수 — 지도 fanIn): 「[#TASK-UIUX-PHASE3-HOME-COCKPIT] 홈 1초 조망 ↔ 무저항 체크인 콕핏」 54 · 「Utilities」 50 · 「Modal helper & Android Hardware Back Handler」 43 · 「가상유저 개선 10대 핵심 헬퍼 함수」 33 · 「[#TASK-ES-264] 표준 시간대 기준 날짜 키」 30 · 「조선소 블록 레지스트리 6대 메가블록 초기화」 24 · 「계측(익명 이벤트)」 24 · 「[#TASK-ES-345 CAL-02] 구글 캘린더 토큰·일정 캐시 계정 격리」 12. (「Confetti」 68 은 H3 빌더 몫.)

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 공용 부품이 미분화 덩어리 안에 있어 모든 세포가 그 덩어리에 기대는 의존의 뿌리다.
- **원인**: 기관 칸(`js/core`)으로 옮길 시험지 합본·생성기 규칙이 없었다 — #769 로 합본이 js/core 이전 세포를 읽게 됐고, 이번에 생성기가 (1) 합본이 읽는 칸이면 smoke FN_NAMES 함수도 옮기고 (2) `if(typeof window…){ window.X = X; … }` 노출 묶음을 원래 자리에 두게 했다.
- **중심**: 기관 키트 — 새 전역을 만들지 않고 이미 있는 `OurgoalUiHelpers`(js/core/ui-helpers.js)에 이름을 단다. ui-helpers.js 가 그 전역을 통째로 새로 대입하므로(유형 M) 세포 태그는 ui-helpers 태그 **뒤**(`afterTag`), app-scope.js 는 그보다 앞이라 `L` 통로가 살아 있다.
- **핵심**: 함수·순수 상수는 세포로, window 노출·상태 변수·3줄 이하 문·최상위 arguments 를 쓰는 `openModal` 은 원래 자리, 로드 중 등록 문 2개(탭 단추 클릭·뒤로가기 처리)는 함수로 감싸 원래 자리에서 부른다.

## 3. [원칙 ③] 해결방식

| 세포 | 옮긴 묶음 | 함수(감싼 함수) |
| :-- | :-- | :-- |
| `js/core/time-keys.js` (85줄) | Utilities · 표준 시간대 날짜 키 | uid·newId·pad·nowISO·fmtTime·fmtDateLabel·getKSTDateKey·getEffectiveStandardDateKey·dateKey |
| `js/core/telemetry.js` (137줄) | 계측(익명 이벤트) | getSid·getAttribution·parseAttribution·recordLanding·dDay 등 |
| `js/core/virtual-user-helpers.js` (181줄) | 가상유저 개선 10대 핵심 헬퍼 | triggerHaptic·triggerHapticFeedback·reorderMilestones·filterFeedByCategory·calculateWeeklyFocusStats·exportRecordsToCsv·exportRecordsToMarkdown·OfflineSyncManager |
| `js/core/gcal-token.js` (78줄) | 구글 캘린더 토큰 격리 | purgeLegacySharedGcalKeys·gcalCurrentUid·gcalEventsKey·ensureGcalOwner |
| `js/core/home-cockpit.js` (269줄) | 홈 1초 조망 ↔ 체크인 콕핏 | initHomeCockpit·initDimensionSliders·renderQuickCheckinGuideChips·switchHomeDate·saveProfile |
| `js/core/registry-init.js` (154줄) | 조선소 레지스트리 초기화 | initShipyardRegistry·setTab·switchTab (bindNavButtonsClick) |
| `js/core/modal-helper.js` (114줄) | Modal helper(openModal 제외) | closeModal·isModalDismissCooldown·openBottomSheetAlert·openBottomSheetConfirm (bindModalPopstateBack) |

- 생성기 `gen-inline-hard.js` 설정 `inline-organ-1.json`(자리 HO). 생성기 고침: smoke FN_NAMES 허용 조건(합본이 읽는 칸), window 노출 if 묶음 원래 자리, 표지 글자 설정(`label`). 검사기 고침: 세포 파일 줄 끝(CRLF) 정규화.

## 4. [원칙 ④] 재검토 — 한계·발견

- **「가상유저 10대 헬퍼」 발견(고치지 않음 — 옮기기만)**: 이름과 달리 가짜 봇·가짜 데이터는 없다(진동·정렬·거르기·통계·내보내기·오프라인 대기열). 다만 ① `calculateWeeklyFocusStats` 는 끝 시각이 없는 기록을 25분으로 세어 주간 집중 분(`totalMinutes`)에 더한다 — 재지 않은 값을 채우는 추정치라 허상지표 규칙(GUARD_05) 쪽 검토가 필요하다. ② `OfflineSyncManager.flush` 는 각 항목 동기화 오류를 삼킨 뒤 대기열을 통째로 지운다 — 실패한 항목이 사라질 수 있다(데이터 보존 GUARD_03 쪽). 둘 다 별도 티켓.
- 실계정 비교는 하지 않았다: 옮긴 코드에 로그인 뒤에만 도는 경로(saveProfile 의 원격 저장·구글 캘린더 토큰)가 있으나, 글자 그대로 이전(토큰 동일)이며 「기록」 실계정 저장은 운영 DB 에 행을 쓴다.
- tab-check 는 이번 세포가 닿는 홈·목표·일정 3탭만 쟀다.

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/inline-organ`(브랜치 `feat/2026-10-05-task-es-471-inline-organ-2`, push 로 번호 선점, #769 위) → 기관 16묶음 유형·시험지 실측 → 설정 → 생성 → verify → 모듈 로드 탐침 → 신고서·설명 → 게스트 시나리오 5개 기준·작업 + 돌연변이 2개 → 조작 비교 → tab-check → 시험 → 문서 → main 합치기 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "공용 부품을 `OurgoalUiHelpers` 에 달면 ui-helpers.js 가 나중에 그 객체를 새로 만들어 이름이 사라진다." → 세포 태그는 ui-helpers 태그 **뒤 같은 줄**(afterTag)이고, 생성기는 덮어쓰는 파일이 있는데 afterTag 가 없으면 멈춘다. 측정: 모듈 로드 탐침 회귀 0, 새 파일 7개 단독 로드 ok(등록 전역 = OurgoalUiHelpers 1개), 게스트 시나리오 5개 작업 쪽 통과.
- 반론 2: "탭 단추 클릭·뒤로가기 등록을 함수로 감싸면 등록 시점·횟수가 바뀌어 이중 처리기나 죽은 클릭이 생긴다." → 원래 자리에서 한 번 부른다. 측정: verify ⑥ 처리기 수 657 = 646 + 11(이중 0), 돌연변이(부르는 줄 지움) → 탭 전환 시나리오·뒤로가기 시나리오 작업 쪽 실패(6·18단계), 원본은 통과.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `.navbtn[data-tab]`, `#screen-records`·`#screen-goals`·`#screen-home`·`#screen-calendar`, `#calLockScreenBtn`, `#modalOverlay`, `#captureInput`, `#captureSave`, `[data-feedcat]`.
- 함수: 위 3절 표, `OurgoalAppScope.expose`, `OurgoalUiHelpers`.
- 파일: `index.html`, `js/core/time-keys.js`·`telemetry.js`·`virtual-user-helpers.js`·`gcal-token.js`·`home-cockpit.js`·`registry-init.js`·`modal-helper.js`, `docs/architecture/modules.json`·`cell-descriptions.json`, `docs/design/harness/module-split/gen-inline-hard.js`·`verify-inline-hard.js`·`dom-compare-inline-organ.js`·`inline-organ-1.json`, `reports/TASK-ES-471/`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

기준 = origin/main(`git archive` 사본, index.html 은 621c53c 와 같은 글자).

| 항목 | 결과 |
| :-- | :-- |
| 인라인 줄 | 이전 전 대비 −681줄(index.html 28,282 → 27,601줄) |
| 글자 동일 | `verify-inline-hard.json` ok — 함수·감싼 문 47개 토큰 동일, 표지 구간 47개 줄 동일, 남은 글자 196,203토큰 동일, 누수·미노출·setter 빠짐·this/arguments 0, 처리기 657 = 646 + 11 |
| 단독 로드 | `module-load-probe.json` 회귀 0, 새 파일 7개 standaloneOk |
| 화면 시나리오 | 5개 기준·작업 통과(체크인 저장·탭 전환·모달 닫기/뒤로가기·피드 분야 칩·일정 그리기), 돌연변이 2개 작업 쪽 실패 |
| 조작 비교 | `dom-compare-inline-organ.json` 16단계 × 10칸 = 160값, 기준 대 후 0 · 기준 대 기준 0, 콘솔 오류 0/0/0 (탭 단추 3·잠금화면 창 열기/닫기/뒤로가기·피드 칩 2·체크인 저장 뒤 기록 26건·내용 같음) |
| 탭 실측 | `tab-check.js home,goals,calendar` 기준 2회·후 1회 — 측정 중(기준 1회차 완료), 결과는 같은 PR 후속 커밋으로 싣는다 |
| 시험 | `npm test` 작업 종료 코드 0 · smoke 443/0 · 무결성 38/38 · 버튼 943/943 기준=후, tests 123개 회귀 0(다른 2개는 git 이력 없는 기준 사본에서만 실패 — `test-compare.json`) |

[4단계: 심사 청구]
