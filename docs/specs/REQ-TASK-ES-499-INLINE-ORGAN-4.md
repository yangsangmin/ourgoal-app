# REQ — #TASK-ES-499 인라인 어려움 기관 묶음 이전 4차(마지막) — 「프로필」(프로필 카드·편집 창·위 막대·알림 센터)

- 근거: 코디네이터 지시(2026-10-05 — 기관 빌더, 마지막 기관 「프로필」) · 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` · 헌법 CELL_SPLIT·CELL_SPLIT_PROOF · 앞 PR #790(기관 3차, 병합 5e24487).
- 범위: 「프로필」 묶음(574줄)을 생성기로 글자 그대로 기관 세포 1개로 옮김. 기능 추가·삭제 0, 마크업·CSS 이동 0, 동결 파일 0, 시험 기대값 변경 0, retire 0, 생성 지도 3종 커밋 0.
- 이 PR 로 기관 빌더 몫(16묶음 중 H3 빌더에게 넘긴 「Confetti」·「뱃지 컬렉션」·「전역 7일 유예 통합 휴지통」 3개를 뺀 13개)이 모두 세포로 옮겨진다.
- 함께 싣는 것: 기관 1차(#776) tab-check(홈·목표·일정, 기준 2회·후 1회) 결과 — 코디네이터 지시대로 다음 PR 기록에 싣는다.

## 1. [원칙 ①] 문제 정확히 파악

1. 「프로필」은 모든 화면의 위 막대(updateTopBar)·알림 배지·알림 센터 창과 프로필 카드·편집 창을 가진 공용 부품이다(들어옴 묶음 10개).
2. 묶음 안에 로드 중 바로 도는 문이 있다 — 일정 알림 폴러를 `DOMContentLoaded` 또는 즉시 시작하는 if 문(8줄, window 노출 1줄 포함).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 위 막대·알림이 미분화 덩어리 안에 있어 모든 탭이 그 덩어리에 기댄다.
- **원인**: 프로필 기능이 위 막대·알림 센터까지 한 구획에 쌓였다(800줄 안이라 한 세포로 옮긴다 — 줄 수로 자르지 않음).
- **중심**: 로드 중 시작 문 — window 노출과 등록이 섞인 if 문이라 노출 묶음 규칙(원래 자리)에 해당하지 않으므로, 본문을 `bindScheduleReminderStart` 로 감싸 원래 자리에서 부른다.
- **핵심**: 함수 8개는 `js/core/profile-topbar.js`(키트 OurgoalUiHelpers, ui-helpers 태그 뒤), window 노출 묶음 4개는 원래 자리, 시작 문은 감싸 원래 자리에서 한 번.

## 3. [원칙 ③] 해결방식

- `js/core/profile-topbar.js`(607줄): avatarHtml·renderProfileCard·resizeImageToDataUrl·openProfileEditor·updateTopBar·updateTopNotifBadge·startScheduleReminderPoller·openNotificationCenterModal + bindScheduleReminderStart(감싼 로드 중 문).
- 설정 `docs/design/harness/module-split/inline-organ-4.json`(자리 HO, label 「인라인 어려움 기관 묶음 이전 4차」).

## 4. [원칙 ④] 재검토 — 한계·발견

- **발견(고치지 않음, 결함 빌더 몫)**: 설정 탭 프로필 카드의 「프로필 편집」(`#editProfileBtn`)도 법정 클릭 도구가 그 자리에서 요소를 찾지 못한다(기준 커밋도 같음 — #790 에서 적은 설정 「고급 설정」 펼침과 같은 증상). 그래서 이 세포는 위 막대 알림(종) 단추 → 알림 센터 창으로 잰다.
- 실계정 비교는 하지 않았다(프로필 편집 저장은 로그인·운영 DB 쓰기).

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/inline-organ`(브랜치 `feat/2026-10-05-task-es-499-inline-organ-5`, push 로 번호 선점 — 처음 고른 497 은 다른 빌더가 먼저 써서 풀고 499 로) → main(5e24487) 위로 → 설정 → 생성 → verify → 모듈 로드 탐침 → 신고서·설명 → 게스트 시나리오 + 돌연변이 → 조작 비교 → 시험 → 1차 tab-check 결과 싣기 → main 합치기 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "알림 폴러 시작 if 문을 함수로 감싸면 `DOMContentLoaded` 등록 시점이나 `window.startScheduleReminderPoller` 노출 시점이 달라진다." → 원래 자리에서 같은 순서로 한 번 부른다. 감쌀 수 있는지(끌어올려지는 var·this/arguments·return 0)는 생성기가 검사했다. 측정: verify 처리기 수 421 = 399 + 22(이중 0), 남은 글자 120,357토큰 동일, 게스트 조작 비교 160값 차이 0.
- 반론 2: "위 막대·알림 센터는 모든 탭이 부르는데 기관 키트에 달면 로드 순서에 따라 없을 수 있다." → 세포 태그는 ui-helpers 태그 뒤, 인라인 IIFE 보다 앞(생성기가 검사)이고 index.html 머리에서 같은 이름으로 가져온다. 측정: 알림 센터 시나리오 기준·작업 통과, 키트 이름을 지운 돌연변이는 작업 쪽 실패, 모듈 로드 회귀 0.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#sanctuaryBellBtn`, `#modalOverlay`, `#modalSheet`, `#topNotifBadge`, `#editProfileBtn`(발견).
- 함수: 3절, `OurgoalUiHelpers`.
- 파일: `index.html`, `js/core/profile-topbar.js`, `docs/architecture/modules.json`·`cell-descriptions.json`, `docs/design/harness/module-split/inline-organ-4.json`, `reports/TASK-ES-499/`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 결과 |
| :-- | :-- |
| 인라인 줄 | 이전 전 대비 −541줄 |
| 글자 동일 | `verify-inline-hard.json` ok — 9개 토큰·줄 동일, 남은 글자 120,357토큰 동일, 누수·미노출·setter 빠짐 0, 처리기 421 = 399 + 22, 새 파일 607줄 |
| 단독 로드 | 회귀 0, 새 파일 standaloneOk |
| 화면 시나리오 | 알림 센터 창 기준·작업 통과, 돌연변이(키트 이름 지움) 작업 쪽 실패 |
| 조작 비교 | 160값, 기준 대 후 0 · 기준 대 기준 0 |
| 시험 | tests·scripts/test-* 종료 코드 기준과 같음, smoke 443/0 · 무결성 38/38 · 버튼 943/943 |
| 기관 1차(#776) tab-check | `tab-check.js home,goals,calendar` 기준(91d1496 사본) 2회·후(#776 작업 사본) 1회 → 1,328값, 기준1 대 기준2 0 · 기준1 대 후 0 · 기준2 대 후 0 (`tab-check-organ1/`) |

[4단계: 심사 청구]
