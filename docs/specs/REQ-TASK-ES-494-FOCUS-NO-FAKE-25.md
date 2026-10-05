# REQ — #TASK-ES-494 주간 집중 시간 25분 기본값 삭제(상민님 승인 A안)

- 근거: 상민님 승인 2026-10-05 원문 「주간 집중 시간 A안으로 진행해」(코디네이터 전달). A안 = `calculateWeeklyFocusStats` 의 endAt 누락 25분 기본값 삭제(endAt 없으면 0분, 진행 중 기록은 몰입에 안 셈) + `scripts/smoke-test.js` 해당 검사 기대값만 25→0, 검사 이름은 사실대로.
- 범위: `js/core/virtual-user-helpers.js`(calculateWeeklyFocusStats), `scripts/smoke-test.js`(검사 1개 이름·기대값), `reports/TASK-ES-494/**`.
- 금고 확인: `court/vault.json` frozen 목록에 `scripts/smoke-test.js` 없음(frozen 의 scripts 는 essence-gate·install-essence-gate·hook-smoke-on-index 뿐). smoke-test.js 는 baseTests(고칠 수 있으나 법정은 기준 판으로 채점) — 바뀐 검사는 claims `retire` 에 승인 문구와 함께 적는다.

## 1. [원칙 ①] 문제 정확히 파악
- 진행 중(종료 시간 없음) 기록 하나만 있어도 홈 오늘 요약(#todayGlancePill)이 「0시간 25분 몰입」을 보인다 — 재지 않은 25분.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- 본질: 몰입 시간은 잰 시간만. 원인: `calculateWeeklyFocusStats` 의 `else { totalMins += 25; }`, 그리고 그 동작을 정답으로 고정한 smoke 검사(기대값 25). 중심: 홈 요약·주간 통계가 이 함수 하나를 쓴다. 핵심: 기본값 삭제 + 검사 기대값 사실화(상민님 승인).

## 3. [원칙 ③] 해결방식
- 함수: endAt·startAt 이 다 있을 때만 (0, 1440) 분 범위로 더한다. 나머지는 0.
- smoke 검사: 이름 「calculateWeeklyFocusStats: endAt 누락 기록은 몰입시간에 넣지 않는다」, 기대값 0. `totalSessions === 1` 단언·검사 수 그대로.
- 몰입이 0 이면 홈 요약은 이미 있는 「25분 집중 추천」 문구를 보인다(추천 문구는 수치가 아님).

## 4. [원칙 ④] 재검토
- 진행 중 기록이 많은 사용자는 주간 몰입 시간이 줄어 보인다 — 사실값이다. 기록 종료 시간을 넣으면 그대로 센다.

## 5. [원칙 ⑤] 절차
기준 사본 → 시나리오 기준 실패 → 수정 → 작업 통과 → npm test → claims(retire 포함) → PR → 법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1: "시험 기대값을 바꾸는 것은 금지다." → 격파: 제품 함수를 돌리는 검사의 변경은 상민님 결심 사항이고, 이번엔 승인 원문이 있다. 법정은 기준 판 시험지로 채점하므로 깨지는 검사를 `retire` 에 승인 문구와 함께 적는다.
- 반론 2: "0분이면 홈 요약이 비어 보인다." → 격파: 이미 「25분 집중 추천」이 0분일 때의 문구로 있다(시나리오로 확인).

## 7. [원칙 ⑦] 측정(작업자, 판정 아님)
- 시나리오 1개 기준 18단계 실패(「0시간 25분 몰입」)·작업 통과. npm test 종료 0, smoke 443/0, 바뀐 검사 통과.

## 8. [원칙 ⑧] 막히는 지점
- 기준 판 smoke 의 옛 검사(기대값 25)가 작업 제품에서 깨진다 — retire 에 적어 법정이 사유를 보게 한다.
