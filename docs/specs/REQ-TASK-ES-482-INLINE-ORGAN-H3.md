# REQ — #TASK-ES-482 인라인 어려움 기관 묶음: Confetti·뱃지 컬렉션·전역 휴지통을 기관 세포 4개로 이전(동작 그대로)

- 근거: 헌법 v2026.10.05-CELL 세포골격 절(CELL_SKELETON·CELL_SPLIT·CELL_SPLIT_PROOF), 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` 2-8(공용 부품 → 기관 세포)·3절 자리 표지 `HO 기관`, 시험지 선행 #TASK-ES-465(PR #769 — 합본이 js/core 이전 세포를 읽음).
- 지시: 오케스트레이터(2026-10-05) — H3 빌더가 구역 H3 를 마친 뒤 기관 묶음 중 「Confetti」·「뱃지 컬렉션 (명예의 전당)」·「[#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템」을 맡는다(기관 빌더와 나눔).
- 범위: 아래 표의 선언 27개를 글자 그대로 옮긴다. 기능 추가·삭제 0, 마크업·CSS 이동 0, 동결 파일 0, 시험 기대값 변경 0, retire 0, 생성 지도 3종 커밋 0.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 세 기관 묶음을 표준 이음매로 `js/core/*` 기관 세포에 옮긴다. 머리 이음매는 자리 표지 `HO 기관` 아래에만 넣는다.
2. 「전역 휴지통」 구획 주석 아래에는 구글 캘린더 연결 함수들이 이어 붙어 있다(구획 주석 없음) — 책임 단위로 휴지통·구글 캘린더 두 세포로 나눈다.
3. 주장에는 main 이 움직이면 바뀌는 전체 수치를 쓰지 않는다 — 옮긴 묶음 자체의 성질과 게스트 화면 시나리오(세포마다 하나)만.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 여러 탭이 부르는 꽃가루·뱃지·휴지통·구글 캘린더 연결이 아직 index.html 인라인 IIFE 에 있어 탭 세포들이 통로로만 부른다.
- **원인**: 공용 부품(들어오는 묶음 10개 이상, 유형 I)·바깥 파일이 window 이름을 씀(J)·smoke FN_NAMES(F2: `totalCompletedMilestones`·`calendarAvailable`)·최상위 arguments(K: `saveGoogleToken`)·한 줄에 두 문(`defaultProfile` 끝 줄 = `window.defaultProfile` 노출 문)이 섞였다.
- **중심**: 한 묶음을 여러 세포가 이름(`take.names`)으로 나눠 갖고, 옮기지 않는 문은 `keepRest` 로 원래 자리에 둔다.
- **핵심**: 생성기가 두 군데에서 이 묶음을 통째로 거부했다 — ① 한 줄에 두 문이 있으면 그 문을 옮기지 않아도 멈춤 ② 같은 묶음을 두 세포가 나눠 가질 때 한 세포의 `keepRest` 남김이 다른 세포의 이동과 겹쳐 멈춤. 생성기를 "옮기거나 감싸는 문에 걸릴 때만 멈춤"(`sharesPrevLine`·`tailCode`) · "keepRest 남김은 그 문을 옮기는 세포에 양보"(`keepRestOnly`)로 좁혔다. 상태 변수·노출 문과의 겹침은 여전히 멈춘다.

## 3. [원칙 ③] 해결방식

| 새 기관 세포 | 옮긴 것 | 원래 자리에 남긴 것(이유) |
|---|---|---|
| `js/core/confetti.js` | `burstConfetti` · `showUndoPrivacyToast` | `toastTimer`·`toast`(타이머 공유 — 프로토콜 1절)·window 노출 if 문 |
| `js/core/badges.js` | `badgeContext` · `BADGES`(순수 상수) · `openHallOfFame` | `totalCompletedMilestones`(F2) · 프로필 불러오기 쪽(아래) |
| `js/core/trash-bin.js` | `getTrashList` · `autoPurgeExpiredTrash` · `moveToTrash` · `restoreFromTrash` · `permanentDeleteFromTrash` · `emptyTrash` · `toastWithTrashUndo` · `openTrashModal` | — |
| `js/core/gcal-sync.js` | `effectiveGcalClientId` · `isGoogleCalendarConnected` · `tryConnectGoogleCalendar` · `openGoogleCalendarConnectModal` · `fetchGoogleCalendarEvents` · `syncAllToGoogleCalendar` · `nextDayISO` · `restoreGoogleToken` · `gcalTokenStatus` · `ensureGoogleTokenClient` · `requestGoogleToken` · `getGoogleAccessToken` · `openGcalImportModal` · `openGcalExportModal` | `googleTokenClient`(상태, setter 통로) · `calendarAvailable`(F2) · `saveGoogleToken`(최상위 arguments — CELL_SPLIT 5) · window 노출 if 문 |

- 「뱃지 컬렉션」 묶음의 프로필 불러오기 쪽(`defaultProfile`·`resolveUniqueDisplayName`·`formatDisplayNameWithTag`·`ensureUserRow`·`loadProfile`)과 앱 상태 `state` 는 옮기지 않았다 — 로그인(가입·세션 복구·서버 동기화) 뒤에만 보이는 경로라 게스트 화면 시나리오로 잴 수 없다. 별도 PR(실계정 하네스)로 넘긴다.
- 키트: 기관 빌더와 같은 기존 `OurgoalUiHelpers`(`_uiKit`), 태그는 `js/core/ui-helpers.js` 태그 바로 뒤 같은 줄(afterTag, index.html 순증가 0). 새 전역 0.
- 설정: `docs/design/harness/module-split/inline-organ-482.json`.
- 시험지 선행: 첫 이동 시도의 tests 전부 비교가 `tests/core-confirm-es376.test.js`(index.html 원문에서 `permanentDeleteFromTrash`·`emptyTrash` 를 잘라 실행) 종료 코드 차이를 잡았다 → 시험지 선행 #TASK-ES-489(PR #780, 잘라 읽기 원본을 같은 파일의 합본으로) 병합 뒤 이 PR 을 올린다.

## 4. [원칙 ④] 재검토 — 한계

- 게스트·로컬 정적 서버·Supabase 목. 구글 계정 연결 성공·토큰 갱신·일정 불러오기는 바깥 통신(구글)이 필요해 법정·로컬 모두 연결 실패 경로만 잰다(이전 전과 같은 조건).
- 휴지통 되살리기·영구 삭제의 서버 원장 반영은 로그인 뒤 경로 — 게스트 로컬 저장값까지만 잰다(조작 비교 저장값 비교).

## 5. [원칙 ⑤] 절차

1. origin/main → 설정 → 생성기 → `verify-inline-hard.js` ok.
2. `court/probes/module-load.js` 기준 대 작업 회귀 0 · 새 파일 4개 단독 로드.
3. `module-specs --write`(손 칸 kind organ·role) · `cell-descriptions.json` · `module-guard` 통과(기준선 파일 커밋 0).
4. 게스트 시나리오 4개 로컬 기준·작업 통과, 게스트 조작 비교(기준 2회·후 1회), `npm test`·tests 전부 기준=후.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 "생성기 정지 조건을 좁히면 위험한 이동이 통과한다" → 좁힌 것은 "옮기지 않는 문끼리"의 경우뿐이다. 한 줄을 나눠 쓰는 문을 옮기거나 감싸려 하면, 그리고 keepRest 가 아닌 남김(상태 변수·노출 문)과 이동이 겹치면 이전처럼 멈춘다. verify 의 남은 글자 동일·누수 0·이중 처리기 0 이 결과를 다시 잰다.
- 반론 2 "`OurgoalUiHelpers` 는 순수 헬퍼 키트인데 DOM·상태를 만지는 함수를 단다" → 키트는 이름 묶음일 뿐 실행은 함수가 불릴 때다(기관 빌더 #TASK-ES-471 과 같은 선택). 이 키트를 통째로 다시 대입하거나 키를 훑는 파일이 없음을 grep 으로 확인했다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: `index.html`(자리 `/* [어려움 이음매 자리 HO 기관] */` 아래·묶음 자리 표지), `js/core/confetti.js`·`badges.js`·`trash-bin.js`·`gcal-sync.js`, `docs/design/harness/module-split/gen-inline-hard.js`(`sharesPrevLine`·`tailCode`·`keepRestOnly`), `inline-organ-482.json`, `dom-compare-inline-organ-482.js`.
- DOM: `#captureInput`·`#captureSave`·`#confettiLayer .confetti-piece`(꽃가루), `#profileCard`·`#hallOfFameBtn`·`.badge-tile`·`#hofClose`(명예의 전당), `#setGroupDataSummary`·`#btnOpenTrashModal`(휴지통), `.rec-card [data-recdel]`·`#btnSheetConfirmOk`(휴지통으로 옮기기), `#calGcalMiniBadge`(구글 캘린더).

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)

- 막힌 지점: 설정 탭 단추는 접힌 묶음(`details.settings-group-accordion`, overflow hidden) 안에 있어 묶음을 먼저 펼쳐야 눌린다 · 구글 캘린더 배지는 바깥 통신이 막힌 법정에서 연결 실패 토스트로 끝난다(시나리오가 그 토스트를 잰다).
- 측정 파일(`reports/TASK-ES-482/`): `verify-inline-hard.json` · `module-load-probe.json` · `scenario-local.json` · `dom-compare-inline-organ-482.json` · `test-compare.json`.
