# REQ — #TASK-ES-536 인라인 3단계 Z3(알림·시간·주소): Notifications · Web Push · 자정 날짜 변경 · 통합 딥링크 게이트웨이 → 세포 4개

- 근거: 헌법 v2026.10.06-SNOWBALL(CELL_SPLIT · CELL_SPLIT_PROOF · claims_hygiene), 설계 `docs/architecture/INLINE-STAGE3-DESIGN.md` 3절·6절(구역 Z3), 작업참고 `C:/dev/agent-knowledge/WORK-REFERENCE.md` 기준 PR #802(L001·L002·L006·L009·L010·L015·L016·L045, 그리고 오케스트레이터 공지 L046 — 기관 키트 세포는 slot HO).
- 선행: 시험지 선행 #TASK-ES-527(PR #805, 병합 1c9193d) — push-subscribe-auth-es400·core-confirm-es376 읽는 범위.
- 설정: `docs/design/harness/module-split/inline-stage3-z3.json`(자리 **HO** — `_uiKit` 선언이 HO 자리 바로 위에 있어 H1~H4 에 넣으면 가져오기 줄이 키트 선언보다 앞서 IIFE 머리 TypeError).
- 작업 유형(SNOWBALL): (가) 표준 — L016 표준 이음매 + 설계 3-1 도달 실측. 이탈 없음. 설계 2절은 이 4묶음을 (가)「게스트로 닿지 않는 경로」로 분류했으나, 도달 실측 결과 옮긴 함수 중 **로그인해야만 불리는 것은 없다**(아래 8절) — 못 재는 몫은 로그인이 아니라 「오래 기다림」(체크인 시각·자정)과 「알림 권한 창」이다. 그래서 `needs-login` 주장은 없고 그 몫마다 `long-duration`·`native-dialog` 주장 하나씩 낸다.

## 1. [원칙 ①] 문제 정확히 파악
| 묶음(제목) | 옮긴 것 | 새 세포 | 원래 자리에 남긴 것 |
| :-- | :-- | :-- | :-- |
| Notifications (best-effort, tab must be open) | `setupNotifyTimer` · `showNotifyBanner` | `js/tabs/settings/notify-timer.js` | — |
| Web Push (앱이 꺼져 있어도 오는 알림) | `urlBase64ToUint8Array` · `syncPushSubscription` · `removePushSubscription` | `js/tabs/settings/web-push.js` | — |
| [#TASK-ES-264] 자정 날짜 변경 감지 및 자동 동기화 워처 | `checkAndHandleDateRollover` · `setupDateRolloverWatcher` | `js/core/date-rollover.js`(기관, OurgoalUiHelpers) | `var _lastObservedDateKey`(재대입 상태 — L getter/setter) |
| 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 | `handleDeepLinkRouting` | `js/core/deep-link-gateway.js`(기관) | `var checkAndHandlePeerInviteUrl = handleDeepLinkRouting`(실행되는 초기값) · 마니또 window 노출 if 문 2 |

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 동작 0 변경으로 인라인 IIFE 의 알림·시간·주소 책임을 세포로 떼어 낸다.
- **원인**: 설계가 이 구역을 「게스트로 못 잰다」로 묶어 두어 앞선 단계에서 남았다.
- **중심**: 도달을 먼저 재고(설계 3-1), 닿는 몫은 게스트 시나리오(법정이 직접 잼), 기다림·권한 창 몫은 정확한 도구 한계 사유로.
- **핵심**: 생성기 글자 그대로(손 글자 0), 앱 부팅이 포함된 시나리오(L046 — verify·노드 시험이 못 잡는 머리 순서 오류를 잡는다).

## 3. [원칙 ③] 해결방식
생성기 `gen-inline-hard.js` + 설정(자리 HO, 세포 4: take.all 3 · names+keepRest 1). 신고서 `module-specs --write` + `cell-descriptions.json` 8줄. 단독 로드 `module-load-stage3-z3o.js`(새). 실계정·게스트 비교 `real-account-split-check.js` + 단계 `real-account-stage3-z3-steps.json`(새).

## 4. [원칙 ④] 재검토 — 한계(정직하게)
- 법정 실행기는 시계를 바꿀 수 없다(court/lib/scenario.js — 시간대 Asia/Seoul 고정 `Emulation.setTimezoneOverride` 만, `do` 목록에 시계 조작 없음, 한 시험 3분 상한). → 알림 시계가 체크인 시각에 울리는 경로와 날짜가 실제로 바뀌는 분기는 `long-duration`.
- `showNotifyBanner` 는 게스트·테스트 계정 모두 0회(설정 「테스트 알림」은 `OurgoalNotifyEngine` 이 있으면 그쪽으로 가서 이 함수를 안 부른다) — 알림 시계가 울릴 때만 불린다 → 같은 `long-duration` 주장에 포함.
- `syncPushSubscription` 은 알림 스위치 켜기(브라우저 알림 권한 창) 뒤에만 서버 요청 단계로 간다 → `native-dialog`. 앱 쪽 요청 모양(세션 있으면 Bearer, 없으면 요청 0)은 `tests/push-subscribe-auth-es400.test.js` 가 옮긴 함수 글자를 노드에서 돌려 잰다(#805 선행으로 합본을 읽음).
- 딥링크 쿼리 분기(초대·피드·템플릿·인증서)는 `js/viral-sharing.js` 쪽 코드이며 이 PR 이 바꾸지 않았다. 법정 `goto` 는 쿼리 붙은 주소를 거부한다(scenario.js 「쿼리·해시·임의 페이지로 이동할 수 없다」) — 닫힌 사유 목록에 맞는 것이 없어 지시 항목으로 올리지 않고, 관문 함수의 쿼리 없는 경로(랜딩·게스트 진입 끝 호출)만 시나리오로 낸다.

## 5. [원칙 ⑤] 절차
origin/main → 지도 묶음 제목 확인 → 생성기(HO) → verify → 가져오기 줄 위치 > 키트 선언 위치 확인 → 신고서 → 단독 로드 → tests 전부 종료 코드 기준 대비 → 도달 실측(--guest·계정 --count) → 게스트·계정 기준1/작업/기준2 → 게스트 시나리오 로컬(기준·작업) → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 「(가) 구역이면 실계정 needs-login 이 표준이다」 → 표준(3-4)은 로그인 뒤에만 도는 몫에 대한 것이다. 도달 실측에서 옮긴 함수 8개 중 계정만 닿는 것은 0 이었다(게스트 1회·계정 2회 또는 둘 다 0). 잴 수 없는 이유를 사실대로(기다림·권한 창) 적는 것이 L006 이다. 실계정 비교는 기록 항목으로 그대로 남겼다(검증을 줄이지 않음).
- 반론 2 「1차 생성(자리 H3)은 verify·노드 시험·단독 로드를 모두 통과했다」 → 그런데 실계정 하네스 작업 실행에서 pageerror 1·단계 0(앱이 안 뜸)이 나왔다. 원인은 `_uiKit` 선언(HO 자리 위)보다 앞선 H3 자리의 가져오기 줄. 자리 HO 로 다시 생성해 가져오기 줄(3041·3042행)이 `var _uiKit`(2895행)보다 뒤임을 확인했고, 네 시나리오 모두 앱 부팅부터 시작한다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#notifyBannerSlot` · `#nbOpen` · `#notifySwitch` · `#logoutBtn` · `#setGroupDataSummary` · `#authScreen` · `#toast` · `#landingScreen` · `#btnLandingPreviewDirect` · `#modalOverlay` · `#screen-home`·`#screen-records`·`#screen-calendar`, 함수 `setupNotifyTimer` · `showNotifyBanner` · `urlBase64ToUint8Array` · `syncPushSubscription` · `removePushSubscription` · `checkAndHandleDateRollover` · `setupDateRolloverWatcher` · `handleDeepLinkRouting`, 파일 `js/tabs/settings/notify-timer.js` · `js/tabs/settings/web-push.js` · `js/core/date-rollover.js` · `js/core/deep-link-gateway.js` · `index.html` · `docs/design/harness/module-split/inline-stage3-z3.json`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
| 항목 | 결과 (출처) |
| :-- | :-- |
| verify | ok · 토큰 동일 · 남은 글자 동일 · 이중 처리기 0 (`reports/TASK-ES-536/verify-inline-hard.json`) |
| 새 파일 줄 수 | 58 · 81 · 59 · 26 (800 이하) |
| 단독 로드 | 회귀 0 · 새 파일 4 단독 로드 ok (`module-load-probe.json`) |
| tests 전후 | tests 전부 종료 코드 기준 사본 = 작업 트리(차이 0) |
| 도달 | 게스트: setupNotifyTimer·setupDateRolloverWatcher·handleDeepLinkRouting 각 1, 나머지 0 · 테스트 계정: 같은 셋 각 2, 나머지 0 (`real-account-reach-*.json`) |
| 게스트·계정 비교 | 5단계 기준1 대 작업 0 · 기준1 대 기준2 0 · pageerror 0 (`guest-compare.json` · `real-account-compare.json`) |
| 게스트 시나리오 | 4개 기준·작업 통과 (`scenario-local.json`) |
| 발견 결함(고치지 않음) | `setupDateRolloverWatcher` 는 renderAll 마다 불려 `visibilitychange` 익명 처리기를 매번 하나씩 더하고, 그때마다 `_lastObservedDateKey` 를 지금 날짜로 다시 맞춘다(자정 뒤 renderAll 이 먼저 돌면 날짜 변경 처리가 건너뛰어짐) — 별도 고치기 티켓 후보 |

[4단계: 심사 청구]
