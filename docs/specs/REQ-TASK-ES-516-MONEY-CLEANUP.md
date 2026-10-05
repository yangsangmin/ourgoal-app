# REQ-TASK-ES-516 — 미분화 덩어리의 돈(광고·구독) 묶음 소멸

- 유형: 표준(기능 소멸 — 헌법 lifecycle 4, 선례 #795 REQ-TASK-ES-495·#767 챌린지 룸 소멸). 일부 이탈 2건은 9절에 네 가지로 적었다.
- 상민님 결정 원문(2026-10-06, 오케스트레이터 전달): 「미분화덩어리에서 광고, 구독관련은 삭제해. 어차피 앱런칭도 아직 안했고 런칭 초기에는 유료화를 아무것도 안할꺼니까, 그리고 그것에 대해 구체화하지 않았으니까, 그것과 관련된 아이디어는 어차피 지식기반에 남아있으니 문제 없잖아?」 — 승인선 ①(돈)·③(기능 삭제)에 대한 결정권자 결정.
- 대상: `docs/architecture/INLINE-STAGE3-DESIGN.md` 2절 (라) 돈 승인선 묶음 4개(지도 `node scripts/inline-script-map.js --write` 로 제목 확인, 지도는 커밋하지 않음).
- 선행: 시험지 선행 PR #806(TASK-ES-530) — smoke 가 지울 함수 4개를 추출·실행하지 않게. 이 PR 은 #806 위에 쌓았다(#806 병합 뒤 main 을 합쳐 심사).
- 적용기: `docs/design/harness/money-cleanup/apply-money-cleanup.js`(main 이 움직여 index.html 이 충돌하면 main 판 위에 다시 돌린다, L010).

## 1. [원칙 ①] 문제 정확히 파악 — 지우기 전 각 묶음이 실제로 하던 일(코드에서 읽은 그대로)

| 묶음(지도 제목) | 하던 일 | 부르는 곳 |
|---|---|---|
| G017 「아워골 앱 환경설정 및 보상형 광고 파이프라인 (TASK-ES-013)」 (30줄) | `var OURGOAL_CONFIG = { ENABLE_TEMPLATE_REWARDED_ADS:false, ADMOB_REWARDED_AD_UNIT_ID:'ca-app-pub-3940256099942544/5224354917'(구글 공식 테스트 보상형 동영상 ID), AD_DELAY_SECONDS:5, AD_NOTICE_MESSAGE:'다운받으신 후 … 5초 뒤 광고영상이 시작됩니다', ENABLE_CREDITS:false }` 를 만들고 `window.OURGOAL_CONFIG` 로 노출 | 광고 상수: G118 의 `getTemplateAdNoticeMessage`·`isTemplateRewardedAdEnabled`, `js/template-credit.js` `adFlagOn`. `ENABLE_CREDITS`: `js/credits.js` `flagOn`. `OURGOAL_CONFIG.STREAK_RULES`·`ENABLE_STREAK_BADGES`(값 없음): `js/streaks.js` `rules()`·`enabled()` |
| G023 「구독 상태 (전체 기능 100% 완전 무료 제공)」 (8줄) | `subscriptionState()` — `state.profile.settings.subscription` 이 없으면 `{ isPro:true, plan:'free_all', expiresAt:null, billingKey:null }` 를 넣고 `isPro=true` 로 고정해 돌려준다 | 제품 안 0곳(smoke `FN_NAMES` 만 — #806 에서 뺌) |
| G060 「안내 모달 (전체 기능 100% 완전 무료 제공)」 (31줄) | `openPaywallModal(triggerReason)` — 「🎉 아워골은 100% 평생 무료입니다」·「아워골 완전 무료화 헌법 선언」 안내 창(단추 `#freeManifestConfirmBtn` 「자유롭게 이용하기」 → `closeModal`), `window.openPaywallModal` 노출. `renderProBadge()` — 문서 안 `.pro-badge` 요소를 모두 지운다 | `openPaywallModal`: 제품 안 0곳(옛 페이월 3곳은 이미 지워져 있음 — smoke 「페이월 제거」 단언). `renderProBadge`: `enterApp()`(index.html), `updateTopBar` 역할의 `js/core/profile-topbar.js`(`L.renderProBadge()`, 앱 스코프 노출 `get renderProBadge`). `.pro-badge` 요소를 만드는 코드는 0곳 — 늘 빈 동작 |
| G118 「템플릿 복제 보상형 광고(Rewarded Ad) 파이프라인 (TASK-ES-013)」 (1379줄 중 광고 부분) | `getTemplateAdNoticeMessage`(광고 안내 문구) · `computeAdCountdownProgress`(5초 카운트다운 %) · `isTemplateRewardedAdEnabled`(광고 플래그 판정) · `startTemplateAdCountdown`·`playRewardedAdVideo`·`showWebRewardedAdModal`(본문은 「광고 전면 배제」 주석 + 콜백 즉시 호출뿐) · `handleTemplateCloneWithAd`(이미 복제된 제목이면 알림, 아니면 `executeDirectTemplateClone` 호출 — `adsEnabled` 는 계산만 하고 안 씀) · `window.testTemplateAdFlow`(시연용 전역) | `handleTemplateCloneWithAd`: 마켓 창 `cloneTemplate`(index.html). `playRewardedAdVideo`: 부팅 때 `OurgoalTemplateCredit.init({ … playRewardedAd })` → `js/template-credit.js` `renderAdOptIn`(「광고 보고 크레딧 받기」 단추, `adFlagOn()` 이 `false && …` 라 그리지 않음) ← `js/tabs/settings/render.js` |

같은 G118 안의 돈과 무관한 기능 — `executeDirectTemplateClone`(복제 본체)·`openTemplateMarketModal`(템플릿 마켓)·`openProTemplateRecordModal`(전문 템플릿 기록)·`openTemplateRecordDetailModal`·`checkRecordDeepLink` — 은 **글자 그대로 원래 자리에 남겼다**(묶음 머리 주석만 「템플릿 마켓 · 복제 · 전문 템플릿 기록」으로).

함께 지운 진입 흔적: `ui.css` 의 `.pro-badge`·`.pw-discount`·`.pw-plan-row`·`.pw-plan`·`.pw-plan .pw-price`·`.pw-plan .pw-unit`(단일 규칙 6개 삭제 + 묶음 선택자 목록 3곳에서 `.pro-badge`·`.pw-discount` 5개 제거, 그리는 요소 0), `app-ads.txt`(AdMob 게시자 선언 파일). 광고 SDK 로드 줄은 없었다(index.html·package.json·capacitor.config.json·android 에 admob 0 — grep).

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 런칭 초기에 유료화를 하지 않기로 했으니 돈 코드를 「꺼 둔 채」 들고 있을 이유가 없다 — 꺼 둔 코드는 세포화를 막고(L033 로 계속 건너뜀) 다시 켜질 위험만 남긴다.
- 원인: 광고·구독 코드가 플래그·「100% 무료」 고정값으로 무력화만 된 채 미분화 덩어리에 남아 있었다.
- 중심: 지울 것은 돈 코드와 그것만 부르는 진입 흔적이다. 사용자 데이터 칸과 돈과 무관한 이웃 기능은 동작 그대로 둔다.
- 핵심: 흔적 0(지운 식별자 grep 0) · 데이터 칸 보존 · 템플릿 복제가 광고 없이 그대로 되는 것.

## 3. [원칙 ③] 해결방식
적용기 한 벌(`apply-money-cleanup.js`, 치환마다 정확히 1회 맞아야 함)로 index.html·js 4개·ui.css·app-ads.txt 를 고친다. 마켓 `cloneTemplate` 은 `if(!tpl) return; executeDirectTemplateClone(tpl, onSelectTemplate);` 로 — 옛 `handleTemplateCloneWithAd` 의 중복 검사는 `executeDirectTemplateClone` 안의 같은 검사와 글자까지 같고 반환값은 쓰는 곳이 없어 동작이 같다.

보존한 사용자 데이터 칸(GUARD_03):
- `settings.subscription`(구독 상태) — 이미 저장된 값은 지우지 않는다. 읽는 코드(`subscriptionState`)만 없앴다. 새 계정 기본값(`js/tabs/settings/app-defaults.js` `defaultSettings`)에서는 구독 칸을 뺐다. 저장값 병합은 `js/core/gcal-token.js` `Object.assign(L.defaultSettings(), 저장값)` 이라 기존 칸이 남고, 프로필 설정을 기본값 목록으로 걸러 내는 코드는 없다(grep `defaultSettings` 3곳).
- 제작권 지갑 `settings.maxBaseCrafts`·`bonusCraftCredits`·`lastStreakAwarded`(아바타 제작 횟수 — 돈 아님, `js/avatar/wallet.js`) — 손대지 않음, 기본값 그대로.
- 크레딧 원장(서버 `credit_ledger`, `js/credits.js`) — 손대지 않음(9절 이탈 1).

## 4. [원칙 ④] 재검토
- 반례: 지운 이름을 다른 세포가 부르는가 → 저장소 전체 grep(문서·보고·dev_log 제외) 결과 0. 남는 것은 `scripts/smoke-test.js` 의 「없다」 단언과 `court/vault.json` 의 제품 목록 글자 `app-ads.txt`(금고 — 고치지 않고 보고).
- 부작용: `OURGOAL_CONFIG` 를 통째로 지우면 `js/credits.js`·`js/streaks.js` 가 읽는 자리가 사라진다 → 객체는 남기고 광고 상수만 지웠다.
- 시험: 기준 smoke 가 지운 함수를 추출하다 죽는 문제 → #806 선행. 글자 검사 4개(smoke)·1개(verify-integrity-gate.js)는 깨짐 → retire(아래 7절).

## 5. [원칙 ⑤] 절차
1) 지도로 묶음 확인 → 2) 하던 일 기록(1절) → 3) #806 선행 → 4) 적용기 실행 → 5) smoke 글자 단언 「없다」로 → 6) 신고서(modules.json 역할·cell-descriptions.json) → 7) module-guard·hidden-entry-guard·essence-gate → 8) 게스트 시나리오 기준·작업 → 9) claims → 10) push 직전 main 합치기.

## 6. [원칙 ⑥] 절차 재검증·반론 격파
- 반론 1 「크레딧도 돈이니 같이 지워야 한다」 → 상민님 말씀은 광고·구독이다. 크레딧 원장은 `js/helpful-reason.js` 의 「도움돼요 이유」 태그 정책 읽기(`OurgoalCredits.policy()` → 서버 `credit_policy`)와 얽혀 있어, 지우면 돈과 무관한 기능의 동작이 바뀐다. 서버 정책 값을 이 세션에서 잴 수 없었다. 그래서 크레딧 원장은 남기고 별도 결심 후보로 보고한다(9절 이탈 1). 「광고 보고 크레딧 받기」(광고)는 지웠다.
- 반론 2 「기준에서 실패하는 사라짐 시나리오가 있어야 한다」 → 지운 코드는 기준에서도 화면에 아무것도 그리지 않았다(광고 플래그 꺼짐, 안내 모달 부르는 곳 0, PRO 배지 요소 0, 광고 단추 그리지 않음). 기준 실패를 만들 수 없으므로 인접 기능이 양쪽에서 같은지(복제·설정·상단 바)로 잰다(9절 이탈 2).

## 7. [원칙 ⑦] 단계별 실행
- 실행 결과·측정은 `reports/TASK-ES-516/claims.json`·`scenario-local.json` 에 있다(작업자 측정, 판정 아님).
- 시험 단언 변경(작업 smoke): 「[TASK-ES-013] 광고 파이프라인」 있다→없다 · 「KF-2 API 5종」 → 4종 + `renderAdOptIn` 없음 · 「KF-2 복제 흐름 광고 분리」 → 광고 경로 없음 · 「[#TASK-ES-192] 데드클릭」 4단계 무료 선언 모달 있다→없다 · 「유료 기능 잠금 해제」 6단계 추가(구독·페이월·PRO 배지 코드 없음 — 강화). `scripts/verify-integrity-gate.js` 「[검증 16/16] [#TASK-ES-192] …」 는 고치지 않고 retire 만 적었다.

## 8. [원칙 ⑧] 막히는 지점 예상·성과 측정
- 막힘: #806 이 먼저 병합되지 않으면 기준 smoke 가 죽는다 → 오케스트레이터가 #806(「금고 변경 승인」) 병합 뒤 이 PR 이 main 을 합쳐 재심. main 이동으로 index.html 충돌 → 적용기 재실행.
- 성과: 지운 식별자 grep 0, module-guard 통과(인라인 줄·함수 선언·window 대입 감소), 숨김 게이트 통과, 게스트 시나리오 2개 기준·작업 통과.

## 9. 이탈 기록(SNOWBALL 네 가지)
1. 크레딧 상수 `ENABLE_CREDITS` 와 크레딧 원장
   ① 규칙: 지시 「OURGOAL_CONFIG 의 광고·크레딧 상수」 삭제. ② 왜(사실): `ENABLE_CREDITS` 는 별도 세포 `js/credits.js`(공용 크레딧 원장)의 켜짐 문이고, 그 세포의 `policy()` 는 돈과 무관한 `js/helpful-reason.js` 태그 정책 읽기에 쓰인다. 상수만 지우면 읽는 코드가 흔적으로 남고, 세포까지 지우면 helpful-reason 동작이 바뀐다(서버 정책 값을 이 세션에서 재지 못함). 상민님 원문은 광고·구독이다. ③ 대신: 광고 상수 4개만 지우고 `ENABLE_CREDITS:false` 와 크레딧 원장은 남겼다. 광고에 붙은 크레딧(「광고 보고 크레딧 받기」·`ad_watched` 적립)은 지웠다. 크레딧 원장 소멸은 별도 결심 후보로 보고. ④ 검증: smoke 「OURGOAL_CONFIG.ENABLE_CREDITS 기본값 false」 검사가 그대로 통과, 설정 크레딧 칸 숨김 그대로(시나리오 settings-no-pro-no-ad).
2. 「사라졌음」 시나리오의 기준 실패
   ① 규칙: 묶음마다 기준 실패·작업 통과 게스트 시나리오. ② 왜(사실): 지운 코드는 기준에서 화면에 그린 것이 없다(1절 표 — 플래그 꺼짐·부르는 곳 0·요소 0). ③ 대신: 인접 기능 시나리오 2개(양쪽 통과, 행동 뒤 확인 non-vacuous)와 smoke 「없다」 단언, 흔적 grep. ④ 검증: 옮기기 PR 과 같은 수준(L005 「고칠 게 없었음」)이며, 지운 이름이 남지 않았음은 smoke 단언과 grep 으로 잰다.
