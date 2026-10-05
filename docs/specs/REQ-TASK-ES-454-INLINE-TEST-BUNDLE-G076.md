# REQ — #TASK-ES-454 시험지 schedule-notification-setting 이 인라인 합본을 읽음 — 인라인 G076 「캘린더 날짜 일정 수정/관리 허브 모달」 세포 이동(#TASK-ES-448) 선행, 단언·기대값·검사 수 그대로

- 근거: 헌법 CELL_SPLIT(시험지 선행), 선례 #TASK-ES-441(#751 — `tests/helpers/inline-bundle.js` 인라인 합본 도우미)·#TASK-ES-447(#753 — 시험지 4개 합본 읽기).
- 범위: `tests/schedule-notification-setting.test.js` 1개가 index.html 대신 인라인 합본(`withInlineCells` — index.html 원문 맨 앞 + js/tabs 세포, L. 접두만 뗌)을 읽게 한다. 단언·기대값·검사 수 0 변경, 제품 코드 0, 동결 파일 0.
- 역할: 시험지 1줄·측정·서류는 Claude(코디네이터 지시). 뒤따르는 #TASK-ES-448 의 코드 이동은 안티그래비티, 검수·서류는 Claude.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. #TASK-ES-448(브랜치 `feat/2026-10-05-task-es-448-agy-g076`)이 인라인 `openCalendarDayEditHubModal`(지도 G076)을 `js/tabs/calendar/day-edit-hub.js` 로 옮기면, `tests/schedule-notification-setting.test.js` 의 [검증 3](`class="sched-notify-badge"`·`정시 알림` 글자)이 index.html 글자만 읽어 깨진다(종료 코드 0→1). 화면 동작은 같다(#448 의 게스트 시나리오 2개가 기준·작업 모두 통과).
2. 코디네이터 지시: 이 시험지를 합본으로 읽게 하는 선행 PR, 같은 이동으로 깨지는 단독 index.html 읽기 시험이 또 있으면 같은 PR 에.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 시험지가 "배지 마크업이 앱에 있는가"가 아니라 "index.html 파일에 그 글자가 있는가"를 본다.
- **원인**: 인라인 분열 전에 쓴 시험지라 함수가 세포 파일로 옮겨 가는 경우를 몰랐다.
- **중심**: 시험지의 index.html 읽기 한 줄(11번째 줄 `indexHtml`).
- **핵심**: 그 한 줄을 #751 의 `withInlineCells` 로 감싼다 — 합본 맨 앞이 원문이라 지금은 같은 글자를 같은 자리에서 찾고, 옮긴 뒤에는 세포 쪽 글자(L. 뗌)에서 찾는다.

## 3. [원칙 ③] 해결방식

- 시험지 읽기 줄만 `require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(…))` 로 바꾸고 줄 끝 주석. 나머지 글자 0 변경.
- 측정 도구 `docs/design/harness/module-split/real-move-test-g076.js`: 모의 이전이 아니라 **실제 이동 사본**(#448 브랜치 17d3303 의 git archive)으로 4조합을 돌리고, tests 108개 전부를 이동 사본에서 다시 돌려 다른 시험지가 또 깨지는지 본다.

## 4. [원칙 ④] 재검토 — 한계

- 다른 시험지 찾기는 글자 검색(`openCalendarDayEditHubModal`·`hubAddNewBtn`·`hubtogglesched`·`cal-day-photo-diary-card`)과 실제 실행 두 가지로 했다. 글자 검색에 걸린 `scripts/smoke-test.js`·`scripts/verify-integrity-gate.js` 는 이미 합본을 읽는다(#TASK-ES-357). 실행 결과 다른 시험지 종료 코드 차이 0.
- 이동 사본은 아직 병합 전인 #448 브랜치 판이다 — #448 이 main 위로 다시 올라가면 그 PR 에서 tests 108개를 다시 잰다.

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/agy-g076-tests`(브랜치 `feat/2026-10-05-task-es-454-inline-test-bundle-g076`, 기준 origin/main f27d63f) → 시험지 1줄 → 기준 사본·이동 사본 `git archive` → 4조합 + 108개 실행 → 문서 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "합본을 읽으면 index.html 에서 사라진 글자를 세포에서 찾아 거짓 통과한다." → 합본은 인라인 이름을 L. 로 읽는 세포(인라인에서 옮긴 것)만 붙이고, 세포는 앱이 실제로 싣는 파일이다. 옮기기 전에는 원문 글자를 원래 자리에서 먼저 찾는다. 측정: 기준 제품에서 새 시험지 = 기준 시험지(종료 코드·출력 줄 수 같음).
- 반론 2: "단언을 약하게 바꿨다." → 단언·기대값·검사 수 0 변경(읽기 줄 1줄만 바뀜, diff 로 확인 가능).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: `tests/schedule-notification-setting.test.js`(indexHtml), `tests/helpers/inline-bundle.js`(#751, 변경 0), `js/tabs/calendar/day-edit-hub.js`(#448 이동 대상, 이 PR 에는 없음).
- 함수: `withInlineCells`, `openCalendarDayEditHubModal`(이동 대상).

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

| 시험지 | 기준 시험지·기준 제품 | 새 시험지·기준 제품 | 기준 시험지·이동 제품 | 새 시험지·이동 제품 |
| :-- | :-- | :-- | :-- | :-- |
| schedule-notification-setting | 0 | 0 | 1 (sched-notify-badge 뱃지 마크업 존재) | 0 |

tests 108개를 이동 제품에서(바꾼 시험지만 새 판) 돌린 종료 코드가 기준 제품과 다른 시험지: 0개. 결과: `reports/TASK-ES-454/real-move.json`.

[4단계: 심사 청구]
