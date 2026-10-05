# REQ-TASK-ES-530 — 돈(광고·구독) 묶음 소멸의 시험지 선행: smoke 가 지울 함수 4개를 추출·실행하지 않게

- 유형: 시험지 선행(표준 — 경험칙 L021·L008). 본 작업은 TASK-ES-516(돈 묶음 소멸, 별도 PR)이다.
- 상민님 결정 원문(2026-10-06, 오케스트레이터 전달): 「미분화덩어리에서 광고, 구독관련은 삭제해. 어차피 앱런칭도 아직 안했고 런칭 초기에는 유료화를 아무것도 안할꺼니까, 그리고 그것에 대해 구체화하지 않았으니까, 그것과 관련된 아이디어는 어차피 지식기반에 남아있으니 문제 없잖아?」
- 바뀌는 파일: `scripts/smoke-test.js` 하나(제품 코드 0, 금고 0).
- 병합 조건: 제품 함수를 실제로 돌리던 검사의 폐기이므로 상민님 「금고 변경 승인」 문구가 필요하다(L008, court/README 5절).

## 1. [원칙 ①] 문제 정확히 파악
`scripts/smoke-test.js` 의 `extractFunction(fnSource, name)` 은 `FN_NAMES` 의 모든 이름을 인라인 스크립트에서 잘라 샌드박스에 넣는다. 이름 하나라도 없으면 `throw new Error('함수를 찾을 수 없음: ' + name)` 로 스크립트 전체가 [2/2] 단계 전에 죽는다.
TASK-ES-516 이 지우는 `subscriptionState`(구독 상태)·`getTemplateAdNoticeMessage`·`computeAdCountdownProgress`·`isTemplateRewardedAdEnabled`(보상형 광고)가 `FN_NAMES` 에 있다. 법정은 기준 커밋의 시험지로 작업 커밋 제품을 채점하므로, 이 선행 없이 TASK-ES-516 을 올리면 기준 smoke 가 죽어 [2/2] 의 모든 검사가 「새로 깨짐」이 된다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 기능 소멸은 그 기능을 실행하던 시험의 폐기를 동반한다 — 숨길 일이 아니라 결심 기록으로 남길 일이다.
- 원인: smoke 의 이름 목록 추출은 함수 하나가 없으면 전체가 죽는 구조다.
- 중심: 지울 4개 함수의 추출·내보내기와 그 함수를 실행하는 검사만 뺀다. 다른 검사·기대값은 손대지 않는다.
- 핵심: 이 PR 은 제품이 그대로인 main 에서 npm test 가 통과해야 하고, TASK-ES-516 병합 뒤의 기준 시험지가 되어야 한다.

## 3. [원칙 ③] 해결방식
`FN_NAMES`·`module.exports` 에서 4개 이름 제거, 샌드박스의 광고 설정 스텁 줄(`var OURGOAL_CONFIG = { ENABLE_TEMPLATE_REWARDED_ADS … }`) 제거, 실행 검사 3개(`getTemplateAdNoticeMessage:`·`computeAdCountdownProgress:`·`isTemplateRewardedAdEnabled:`) 제거, 「유료 기능 잠금이 전면 해제…」 검사의 6번 단계(`fns.subscriptionState().isPro`) 제거. 글자 존재 검사(`html.includes('playRewardedAdVideo')` 등)는 main 에서 참이므로 이 PR 에서 남기고 TASK-ES-516 에서 「없다」로 바꾼다.

## 4. [원칙 ④] 재검토
- 반례: 4개 함수를 다른 검사가 간접으로 부르는가 → `fns.` 사용처 grep 결과 위 4곳뿐.
- 부작용: 스텁 `OURGOAL_CONFIG` 를 읽는 다른 추출 함수가 있는가 → 인라인에서 `OURGOAL_CONFIG` 를 읽는 함수는 광고 함수 2개뿐(getTemplateAdNoticeMessage·isTemplateRewardedAdEnabled).

## 5. [원칙 ⑤] 절차
1) 스크립트 치환(CRLF 보존) 2) `node scripts/smoke-test.js` 0 실패 3) `npm test` 종료 0 4) claims(retire 4건, 승인 원문 인용) 5) PR.

## 6. [원칙 ⑥] 절차 재검증·반론 격파
- 반론 1 「시험을 약하게 하는 것이다」 → 맞다. 그래서 retire 에 검사 제목별로 적고 「금고 변경 승인」을 받아 병합한다. 지운 기능을 시험하는 것은 불가능하므로 다른 길이 없다. 「없다」 단언은 제품이 바뀌는 TASK-ES-516 에서 더한다.
- 반론 2 「한 PR 로 합치면 된다」 → 법정은 기준 시험지로 채점하므로 같은 PR 의 smoke 수정은 판정에 쓰이지 않고, 기준 smoke 가 죽어 수백 검사가 깨진 것으로 나온다. 선행 분리가 유일한 길이다.

## 7. [원칙 ⑦] 단계별 실행
위 5절 순서대로 실행. 측정은 `reports/TASK-ES-530/claims.json` 에 적었다(작업자 측정, 판정 아님).

## 8. [원칙 ⑧] 막히는 지점 예상·성과 측정
- 막힘: 법정이 실행형 검사 폐기를 「확인 부족 — 상민님 결심」으로 표시 → 오케스트레이터가 「금고 변경 승인」을 받아 병합.
- 성과: main 제품으로 smoke 0 실패·npm test 종료 0, TASK-ES-516 작업 제품으로도 이 smoke 가 죽지 않는다(글자 검사만 깨짐 → TASK-ES-516 retire).
