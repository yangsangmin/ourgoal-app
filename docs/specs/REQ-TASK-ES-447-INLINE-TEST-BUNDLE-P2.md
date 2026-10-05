# REQ — #TASK-ES-447 시험지 4개가 인라인 합본을 읽음 — 인라인 스크립트 세포화 구역 P2 선행(스톱워치 위젯·피드 동기화·위젯 설정 창), 단언·기대값·검사 수 그대로

- 근거: 헌법 CELL_SPLIT(시험지 선행), 선례 #TASK-ES-441(#751 — `tests/helpers/inline-bundle.js` 인라인 합본 도우미, P0 구역 선행)·#TASK-ES-426·#TASK-ES-412.
- 범위: `tests/stopwatch-lap-inputs.test.js`·`tests/stopwatch-table-hint.test.js`·`tests/guest-null-client-es377.test.js`·`tests/desktop-widget-suite.test.js` 4개가 index.html 대신 인라인 합본(`withInlineCells` — index.html 원문 맨 앞 + js/tabs 세포, L. 접두만 뗌)을 읽게 한다. 단언·기대값·검사 수 0 변경, 제품 코드 0, 동결 파일 0.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 구역 P2 분열(#750·#TASK-ES-446)에서 기록 카드 단추 연결 `wireRecordCards`·스톱워치 위젯(지도 G140)·피드 동기화(`ensureFeedPostsLoaded`·`setupFeedPostsRealtime`)·위젯 설정 창(`openWidgetSettingsModal`)을 옮기면 시험지가 index.html 글자만 읽어 깨졌다(종료 코드 0→1). 동작은 같으므로 시험지 범위만 넓힌다.
2. `core-confirm-es376`(wireRecordCards 의 휴지통 줄)은 #751 이 이미 합본을 읽게 했다 — 이번 범위 밖.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 시험지가 "기능이 있는가"가 아니라 "index.html 에 글자가 있는가"를 본다.
- **원인**: 인라인 분열 전에 쓴 시험지라 함수가 세포 파일로 옮겨 가는 경우를 몰랐다.
- **중심**: 네 시험지의 index.html 읽기 한 줄.
- **핵심**: 그 한 줄을 #751 의 `withInlineCells` 로 감싼다 — 합본 맨 앞이 원문이라 지금은 같은 글자를 같은 자리에서 찾고, 옮긴 뒤에는 세포 쪽 글자(L. 뗌)에서 찾는다.

## 3. [원칙 ③] 해결방식

- 네 시험지의 index.html 읽기 줄만 `require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(…))` 로 바꾸고 주석 한 줄. 나머지 글자 0 변경.
- 모의 이전 측정 도구 `docs/design/harness/module-split/mock-move-inline-p2.js` + 설정 `mock-move-inline-p2.config.js`(기준 사본에서 위 선언들을 생성기 `gen-inline-p2.js` 로 옮겨 봄 — 저장소 제품 코드는 그대로).

## 4. [원칙 ④] 재검토 — 한계

- `desktop-widget-suite` 는 기준에서도 「헌법 제15조 제6항 4대 뷰 동시 전파 검증」(3 !== 4)으로 실패한다(기존 실패 — 이번에 고치지 않음). 새 시험지는 기준 제품·모의 이전 제품 모두에서 같은 단언까지 통과(4줄)하고 같은 단언에서 멈춘다.
- 생성기 `gen-inline-p2.js` 는 #TASK-ES-446 에 실리므로, 이 PR 의 모의 이전은 그 생성기 사본(작업자 측정)으로 돌렸다.

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/inline-p2-pr1`(브랜치 `feat/2026-10-05-task-es-447-inline-test-bundle`, 기준 origin/main 194ed83) → 시험지 4줄 → 기준 사본 `git archive` + 모의 이전 → 4조합(기준/새 시험지 × 기준/모의 이전 제품) 실행 → 문서 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "합본을 읽으면 원래 index.html 에 없는데 세포에만 있는 글자로 시험이 거짓 통과한다." → 합본은 인라인 이름을 L. 로 읽는 세포(인라인에서 옮긴 것)만 붙인다. 옮기기 전에는 원문과 같은 글자를 원래 자리에서 먼저 찾는다. 측정: 새 시험지 대 기준 시험지, 기준 제품에서 종료 코드·통과 줄·첫 오류 모두 같음.
- 반론 2: "단언을 약하게 바꿨다." → 단언·기대값·검사 수 0 변경(읽기 줄 1줄씩만 바뀜, diff 로 확인 가능).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: `tests/stopwatch-lap-inputs.test.js`(html), `tests/stopwatch-table-hint.test.js`(indexHtml), `tests/guest-null-client-es377.test.js`(HTML), `tests/desktop-widget-suite.test.js`(indexHtml), `tests/helpers/inline-bundle.js`(#751, 변경 0).
- 함수: `withInlineCells`, `renderStopwatchWidgetHtml`·`renderLapRowsHtml`·`STOPWATCH_STATE`·`playTimerBeep`·`wireRecordCards`·`ensureFeedPostsLoaded`·`setupFeedPostsRealtime`·`openWidgetSettingsModal`(모의 이전 대상).

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

| 시험지 | 기준 시험지·기준 제품 | 새 시험지·기준 제품 | 기준 시험지·모의 이전 | 새 시험지·모의 이전 |
| :-- | :-- | :-- | :-- | :-- |
| stopwatch-lap-inputs | 0 | 0 | 1 | 0 |
| stopwatch-table-hint | 0 | 0 | 1 | 0 |
| guest-null-client-es377 | 0 (5건) | 0 (5건) | 1 | 0 (5건) |
| desktop-widget-suite | 1 (기존 실패, 4줄 통과) | 1 (같음) | 1 (2줄에서 멈춤) | 1 (4줄 — 기준과 같음) |

결과: `reports/TASK-ES-447/mock-move.json`.

[4단계: 심사 청구]
