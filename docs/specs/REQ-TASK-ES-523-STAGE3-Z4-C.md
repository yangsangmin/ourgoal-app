# REQ — #TASK-ES-523 인라인 3단계 Z4 이동 2차: 활용가이드·공개 범위 배지·스톱워치 시간 글자를 세포 3개로 동작 그대로 이전

- 근거: 헌법 CELL_SPLIT·CELL_SPLIT_PROOF, `docs/architecture/INLINE-STAGE3-DESIGN.md` 4절(「이미 풀림」)·6절 Z4, 작업참고 기준 PR #802(L001·L005·L015·L016·L025·L026·L046·L047).
- 작업 유형(SNOWBALL): (가) 표준. 이탈 없음. 머리 이음매 자리 H4 `[기본값]`(1차 #TASK-ES-520 은 H3 — 내 PR 끼리 머리 충돌을 줄임). L046: 가져오기 줄(2893~) > 키트 선언(`_settingsKit` 2318·`_recordsKit` 2383). L047: verify assignedL 0(setter 덮어쓰기 위험 없음).

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지
| 묶음(제목) | 새 세포 | 옮긴 것 | 원래 자리에 남긴 것 |
|---|---|---|---|
| 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합 (활용 가이드 책임) | `js/tabs/settings/first-login-guide.js` | maybeShowFirstLoginGuide · startFirstLoginGuide | window.startFirstLoginGuide 노출 줄 · navButtons · screens(로드 중 DOM 읽는 상태) |
| 같은 묶음 (공개 범위 책임) | `js/tabs/settings/privacy-badges.js` | getPrivacyLabel · updatePrivacyBadges · openPrivacyPickerModal | — |
| ⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯 | `js/tabs/records/stopwatch-format.js` | formatStopwatchTime | window.renderStopwatchWidgetHtml·renderLapRowsHtml 노출 묶음 |

생성기 산출(작업자 측정): 옮김 6 · 남김 4, 새 파일 236·97·39줄(`reports/TASK-ES-523/gen-meta.json`).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 인라인 미분화 덩어리에서 책임 단위 세포를 떼어 낸다.
- **원인**: getPrivacyLabel·formatStopwatchTime 가 smoke FN_NAMES 라 앞 단계에서 남았다 — 합본 읽기로 풀렸다.
- **중심**: 한 묶음에 책임이 둘(활용 가이드 / 공개 범위 배지)이라 take.names 로 두 세포에 나눴다(책임 단위 — 줄 수 분할 아님).
- **핵심**: 세포마다 게스트 화면 시나리오 하나(가이드 다시보기 · 일정 탭 공개 범위 배지 · 전문 템플릿 스톱워치).

## 3. [원칙 ③] 해결방식
설정 `docs/design/harness/module-split/inline-stage3-z4-c.json` → `gen-inline-hard.js` → `verify-inline-hard.js` → `module-load-stage3-z4.js` → 신고서·`cell-descriptions.json` → tests 전후 → 게스트 조작 비교(`real-account-stage3-z4-c-steps.json`, --guest) → 시나리오 3개 로컬 기준·작업.

## 4. [원칙 ④] 재검토 — 한계·남긴 묶음
- 「방해금지 시간대(DND)」(isWithinDND)·「맥락 기반 다이내믹 알림 문구」(generateDynamicNotification)는 이번에도 옮기지 않았다: 부르는 곳이 알림 시계(setupNotifyTimer — 20초 간격, 알림 켜기·체크인 시각 일치 필요)와 설정 「테스트 알림」의 알림 엔진 없는 분기뿐이라(알림 엔진 js/notify-engine.js 가 늘 있어 그 분기는 안 돈다) 게스트 시나리오로 닿지 않는다. 같은 경로를 쓰는 Z3 「Notifications」 묶음과 함께 옮기는 것이 맞다(보고).
- 「5대 테마 온톨로지 & 경량 AI 분류기」는 classifyRecordTheme 가 로그인 뒤 기록 불러오기 경로에서만 불려(게스트 빠른 기록·체크인 실측 0회) 실계정 비교가 붙는 별도 PR 로 둔다.
- maybeShowFirstLoginGuide 는 호출부 0(죽은 함수) — 그대로 옮기고 결함 목록에 적는다.
- 공개 범위 배지는 목표 탭(#personalGoalsView 숨김)·기록 탭(.screen-head 숨김)에서는 게스트 첫 화면에 보이지 않아 일정 탭 배지로 잰다(같은 함수 updatePrivacyBadges·openPrivacyPickerModal).

## 5. [원칙 ⑤] 절차
3절. push 직전 origin/main 합치기(충돌 시 main 판 index.html 로 생성기 재실행, L010).

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 "한 묶음을 두 세포로 나누면 이음매가 늘어 위험하다" → 생성기가 같은 묶음의 이름을 세포별로 나눠 가져가는 방식(#482)이고, 공개 범위 세포는 가이드 세포를 부르지 않는다(가져오기 3개 — startFirstLoginGuide·updatePrivacyBadges·formatStopwatchTime). verify 의 누수 0·미노출 0 이 잰다.
- 반론 2 "스톱워치 시나리오는 시간에 따라 흔들린다" → 시작 뒤 1.2초 기다려 멈추고 「00:01.」 앞부분만 본다(클릭 지연을 더해도 1~2초 범위). 로컬 기준·작업 통과.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#setGroupDataSummary`·`#btnRestartGuide`·`#miniGuideOverlay`·`#btnMiniGuideNext`·`#btnMiniGuideClose`·`#calPrivacyBadge`·`#modalSheet [data-privopt]`·`#swDisplay`·`#swStartPauseBtn` · 함수 1절 표 · 파일 1절 표 + 설정·도구.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
| 측정 | 결과 |
|---|---|
| verify | ok — 토큰 동일·덩어리 줄 동일·남은 글자 동일·누수 0·this/arguments 0·이중 처리기 0·800줄 이하 (`verify-inline-hard.json`) |
| 단독 로드 | 회귀 0, 새 파일 3개 단독 로드 ok (`module-load-probe.json`) |
| tests 전후 | `tests-exit-compare.json`: tests 113개 종료 코드 기준 사본 = 작업 트리(npm test 없이 파일마다 번갈아, `docs/design/harness/module-split/tests-exit-compare-z4.js`). 기존 도구 `test-compare.json`(npm test 를 먼저 돌림)에서는 두 번 모두 작업 쪽 tests/offline-sync-queue-retain.test.js 만 종료 1 — 그 시험은 index.html 을 읽지 않고(js/core/virtual-user-helpers.js 만) 따로 3회씩·순서대로 돌리면 기준·작업 모두 종료 0 이라 실행 환경 흔들림으로 보고 그대로 기록했다 |
| 게스트 조작 비교 | 6단계(홈·일정 배지·목표·기록·설정·가이드 단추) 기준1 대 작업 0 · 기준1 대 기준2 0 (41값, `guest-compare.json`) |
| 게스트 시나리오 | 3개 기준·작업 통과 (`scenario-local.json`) |

발견 결함(고치지 않고 그대로 옮김): maybeShowFirstLoginGuide 호출부 0(죽은 함수).
