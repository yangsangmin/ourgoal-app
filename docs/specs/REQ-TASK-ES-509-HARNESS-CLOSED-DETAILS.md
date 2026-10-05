# REQ — #TASK-ES-509 감사 하네스의 접힌 <details> 오탐 제거

- 근거: 코디네이터 지시(2026-10-05) — 「보이는데 가려져 안 눌림」 오탐이 5번째(#767 R4 홈 피드백 단계 막대·설정 모드 칩, 3차 AI 말투·고급 설정·가이드 다시보기, 4차 프로필 편집·맞춤 피드백 봇). 모두 닫힌 `<details>` 안 요소였다.
- 범위: `docs/design/harness/tab-states.js`(clickReal·VISIBLE_FN), `docs/design/harness/audit.js`(AUDIT_FN vis), `docs/design/harness/closed-details-check.js`(새), `reports/TASK-ES-509/**`.
- 금고 확인: `court/vault.json` frozen 에 `docs/design/harness/**` 없음(문서·기록 neutral). **법정 실행기 자체(`court/lib/scenario.js` 의 `vis` — rect·display·visibility·opacity 만 보고 접힌 details 조상을 보지 않음)는 금고라 고치지 않았다.** 그래서 법정 시나리오로 접힌 details 안 단추를 바로 누르면 계속 「그 자리를 다른 요소가 덮고 있다」로 실패한다 — 시나리오는 summary 를 먼저 누르게 써야 한다(보고).

## 1. [원칙 ①] 문제 정확히 파악
- 접힌 details 의 내용은 그려지지 않지만 getBoundingClientRect 는 0 이 아니다. 하네스가 이를 보이는 요소로 세고, 그 좌표 elementFromPoint 가 뒤 요소를 돌려주어 「가려짐」으로 적었다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- 본질: "보인다"의 정의가 렌더링과 어긋남. 원인: `tab-states.js` `clickReal`·`VISIBLE_FN`, `audit.js` `vis` 가 접힌 details 조상을 보지 않음(같은 폴더의 `tab-deadclick.js` COLLECT_FN·`hidden-entry-sweep.js` 는 이미 거름). 중심: 하네스의 보임 판정. 핵심: 접힌 details 조상(자기 summary 제외)이 있으면 「보이지 않음」.

## 3. [원칙 ③] 해결방식
- `clickReal`: 접힌 details 안이면 누르지 않고 `{clicked:false, hidden:'details-closed', note:'… 보이지 않음(접힌 details … 안 — 먼저 펼쳐야 보인다)'}`. 진짜 가려진 경우의 `covered` 판정은 그대로.
- `VISIBLE_FN`: 같은 조건으로 false. 시험에서 쓰려고 `module.exports` 에 더함.
- `audit.js` `vis`: 같은 조건.

## 4. [원칙 ④] 재검토
- 법정 `court/lib/scenario.js` 는 금고 — 같은 오탐의 근원 하나가 남는다. 고치려면 「금고 변경 승인」이 필요하다(결심 후보).

## 5. [원칙 ⑤] 절차
픽스처 페이지 시험 작성 → 기준 하네스로 실패 확인 → 수정 → 통과 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1: "접힌 details 안을 거르면 진짜 숨은 결함을 놓친다." → 격파: 펼치면 보이는 요소는 숨은 결함이 아니다(사람도 펼쳐서 누른다). 진짜 숨은 진입로는 hidden-entry-sweep 이 「details-closed」 사유와 함께 따로 센다.
- 반론 2: "진짜 가려진 단추까지 안 잡힐 수 있다." → 격파: 시험 2) 가 덮개(#cover)로 가린 단추를 여전히 「가려짐」으로 잡는지 확인한다.

## 7. [원칙 ⑦] 측정(작업자, 판정 아님)
- `docs/design/harness/closed-details-check.js`: 기준 하네스 실패(「접힌 details 안 단추는 보이지 않음」), 작업 통과 — 오탐 0·진짜 가림 여전히 검출(`reports/TASK-ES-509/test-compare.json`).

## 8. [원칙 ⑧] 막히는 지점
- 시험은 크롬이 있어야 돈다(puppeteer-core · 설치된 Chrome).
