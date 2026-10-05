# REQ — #TASK-ES-446 인라인 스크립트 세포화 구역 P2 첫 PR: 기록 탭 묶음(카드·히트맵·리포트·대화형 기록 비서·표 기록 차트·AI 코칭·노션 내보내기) 세포 이전

- **#750 대체** — #750(#TASK-ES-438)은 판정 363DAAF8 돌려보냄 1회: 주장 C35·C36 이 「기준선 인라인 32509줄」「인라인 지도 IIFE 32487줄」처럼 main 이 움직이면 바뀌는 전체 수치를 주장해, origin/main(#752)을 합치며 철회하자 법정이 옛 시험을 다시 돌려 실패 — 같은 PR 에서 못 푸는 막다른 길. 상민님이 #745 에 승인한 A안 선례대로 #750 을 닫고 최신 origin/main(c222c4d) 위에서 같은 분열을 생성기로 다시 만들었다. 이번 주장에는 전체 수치를 쓰지 않는다(옮긴 묶음 자체의 성질·화면 시나리오만).

- 근거: 헌법 v2026.10.05-CELL 세포골격 절(CELL_SKELETON — `index.html` 인라인 스크립트는 미분화 덩어리, CELL_SPLIT·CELL_SPLIT_PROOF), `docs/specs/MODULE-SPLIT-PROTOCOL.md`, 지도 `docs/architecture/INLINE-SCRIPT-MAP.md`(#TASK-ES-423). 선례: 1차 #TASK-ES-423(#744), 소통 탭 #TASK-ES-379.
- 지시: 코디네이터(2026-10-05) — 상민님 원문 "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나? 지금 왜 적극적으로 진행하지 않는것 같지?" → 병렬 빌더 4명 중 구역 P2(지도 G129~G176, 29묶음) 전담, PR 연달아.
- 범위(이번 PR): 구역 P2 중 기록 탭 묶음 G130·G132·G133·G136·G138·G139·G141·G142·G143 의 최상위 선언 14개를 기록 탭 세포 파일 5개로 글자 그대로 옮긴다. 기능 추가·삭제 0, 마크업·CSS 이동 0, 동결 파일 0, 시험 기대값 변경 0, retire 0.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. `index.html` 인라인 IIFE(기준 origin/main c222c4d 에서 모듈 가드 ① 32,147줄)는 아직 미분화 덩어리다. 구역 P2(지도 G129~G176) 묶음을 동작 그대로 세포 파일로 떼어 인라인 줄을 줄인다(순증가 0 — 줄어야 함).
2. 속도가 최우선이다: 한 PR 에 여러 묶음(800~1,500줄)씩 연달아 낸다. 어려운 묶음은 건너뛰고 목록에 남긴다.
3. 새 세포마다 `cell-descriptions.json` 짧은 이름·하는 일, `modules.json`(module-specs --write), `cell-map.json`·`inline-script-map` 재생성, 기준선 `module-guard --update`.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 기록 탭 화면 세포(`js/tabs/records/render.js`)는 이미 떨어져 있는데, 그 화면이 부르는 카드·히트맵·리포트·대화형 기록 비서 그리기는 아직 3만 줄 IIFE 안에 있어 `L.` 통로로 거꾸로 불러 온다. 기록 탭을 고치면 여전히 `index.html` 을 만진다.
- **원인**: 1차(#744)는 묶음을 "통째로"만 옮길 수 있었다 — 묶음 안에 로드 중 바로 도는 문(`window.X = X` 노출·전역 이벤트 위임)이나 시험지(smoke-test FN_NAMES)가 글자로 잘라 가는 함수가 하나라도 있으면 묶음 전체를 못 옮겼다. 구역 P2 29묶음 중 이런 묶음이 대부분이다(로드 중 문 8묶음, smoke 함수 9개가 7묶음에 섞여 있음).
- **중심**: 묶음이 아니라 **최상위 선언 단위**로 옮기면, 로드 중 문·시험지 함수는 제자리에 두고 나머지(그리기·창 열기 함수, 재대입 없는 상수)만 떼어 낼 수 있다. 상수는 IIFE 머리에서 `var X = _recordsKit.X` 로 같은 값(같은 객체)을 가져오므로 읽는 쪽이 그대로다.
- **핵심**: 생성기 `gen-inline-p2.js`(1차 생성기 일반화)가 선언마다 (앞 최상위 문 끝 줄 + 1) ~ 선언 끝 줄을 글자 그대로 옮기고, 막는 조건(재대입·최상위 this/arguments·smoke 함수와 그 함수가 읽는 이름·변수 초기값이 로드 중 인라인 이름 읽기·같은 줄에 붙은 다른 문)을 기계로 검사해 멈춘다.

## 3. [원칙 ③] 해결방식

### 3-1. 생성기 — `docs/design/harness/module-split/gen-inline-p2.js` + 설정 `gen-inline-p2-1.config.js`

- 1차 생성기(`gen-inline-split-1.js`)와 같은 틀(인라인 스코프 이름만 `L.<이름>`, 같은 세포 안 이름 그대로, 같은 키트의 다른 세포 이름 `K.<이름>`)에 세 가지를 더했다: ① 선언 단위 덩어리 ② 재대입 0 최상위 변수 이전(초기값이 로드 중 읽는 이름은 같은 세포 안 이름만) ③ 이음매를 앞선 인라인 세포화 이음매 중 마지막 블록 바로 다음에(병렬 빌더가 같은 줄을 덜 다투게).
- 새 script 태그는 `js/tabs/records/index.js` 태그 바로 앞 같은 줄(순증가 0줄). 키트는 기존 `OurgoalRecordsKit`(새 전역 0).

### 3-2. 옮긴 선언 (이전 전 index.html 줄)

| 세포(새 파일) | 지도 묶음 | 옮긴 선언 |
| :-- | :-- | :-- |
| `js/tabs/records/record-cards.js` (89줄) | G130 RENDER: RECORDS | `buildRecordCardHtml`(25433~25497) |
| `js/tabs/records/record-heatmap-report.js` (277줄) | G132 기록 히트맵 · G133 주간/월간 리포트 | `renderRecordHeatmap`(25853~25999) · `TOPIC_COLORS` · `svgTrendChart` · `svgCategoryDonut` · `renderReportSummary`(26000~26096) |
| `js/tabs/records/record-assistant.js` (172줄) | G136 대화형 기록 비서 | `parseConversationalRecord` · `handleConversationalRecord` · `openConversationalRecordConfirmModal`(26386~26531) |
| `js/tabs/records/table-analytics-view.js` (121줄) | G138 전문 템플릿 자동 집계 · G139 성장 추이 차트 | `renderAnalyticsHtml`(27555~27568) · `renderTrendSvgChart`(27679~27759) |
| `js/tabs/records/pro-report-export.js` (384줄) | G141 노션 푸시 · G142 AI 코칭 리포트 · G143 노션 표 내보내기 | `pushRecordToNotion` · `openProCoachReportModal` · `openProNotionExportModal`(27858~28215) |

- 제자리에 남긴 것: smoke-test FN_NAMES 함수 `heatmapLevel`·`filterRecordsByQuery`·`computeTableAnalytics`·`computeTrendChartData`(그리고 그 함수가 읽는 `HEATMAP_WEEKS`·`HEATMAP_LEVELS`), 묶음 머리 구획 주석 중 남은 선언 앞의 것.
- 이번 PR 에서 뺀 것(시험지 선행 필요): `wireRecordCards`(G130 — `tests/core-confirm-es376.test.js` 가 index.html 에서 「기록 카드 휴지통」 줄을 셈), G140 스톱워치 위젯 전체(`tests/stopwatch-lap-inputs.test.js`·`tests/stopwatch-table-hint.test.js` 가 index.html 글자로 읽음). 옮겨 보니 세 시험지 종료 코드가 0 → 1 로 바뀌어 되돌렸다(지운 단언 0). 시험지가 인라인 합본을 읽게 넓히는 선행 PR 뒤에 옮긴다.
- index.html: 이음매(가져오기 9줄 + expose getter 11개 — `HEATMAP_LEVELS`·`HEATMAP_WEEKS`·`TOPICS`·`computeTableAnalytics`·`dispatchFullViewPropagation`·`heatmapLevel`·`maybeShowGoalUpdateModal`·`openRecordModal`·`renderFeedbackSlot`·`requestAIFeedback`·`resizeImageToDataUrl`), 옮긴 자리마다 표지 주석 한 줄.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 인라인 줄은 −878(32,147 → 31,269)이다(작업자 측정 — 주장에는 쓰지 않는다). 구역 P2 의 기록 쪽 묶음 중 시험지 의존 3곳(위 3-2)은 선행 PR 이 필요해 이번에 못 옮겼다.
- 게스트 조작 비교의 「노션 바로 보내기」 성공 경로는 두 앱에 같은 조작으로 노션 키를 넣고 비교 서버가 `/api/notion-push` 에 `{ok:true}` 를 돌려준 것이다(실제 노션 전송 아님).
- 지도의 묶음 번호(G130 …)는 이 PR 의 index.html 로 지도를 다시 만들면 바뀐다(이름·구획 주석이 정본).
- 실계정 비교는 이번 PR 에서 하지 않았다(옮긴 함수는 모두 화면 그리기·창 열기 — 게스트 화면 시나리오·조작 비교로 쟀다).

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/inline-p2`(브랜치 `feat/2026-10-05-task-es-446-inline-p2-1b`, 기준 origin/main c222c4d) → 지도·1차/2차 선례 정독 → 묶음별 최상위 문 분석 → 생성기 일반화 → 생성 → verify → 법정 모듈 로드 탐침 → 신고서·설명·가드·지도 → 시험 기준/후(시험지 3개 깨짐 → 해당 선언 빼고 다시 생성) → 게스트 조작 비교(기준 2회·후 1회) → 법정 형식 화면 시나리오 5개 기준/후 → tab-check 기준 2회·후 1회(기록 탭) → 문서 → 커밋 → 세포지도 재생성 → PR → 법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "상수(`TOPIC_COLORS`)를 세포로 옮기면 인라인 코드가 그 값을 다시 대입하거나 로드 순서가 바뀌어 다른 값을 읽는다." → 생성기가 재대입(constantViolations) 0 을 검사했고, 초기값이 로드 중에 읽는 이름은 같은 세포 안 이름만 허용한다(인라인 이름이면 멈춘다). 세포 파일은 인라인 스크립트보다 먼저 로드되고 IIFE 머리 `var` 가져오기는 같은 객체를 가리킨다. 측정: 리포트 30일·7일 전환·카테고리 도넛까지 게스트 조작 비교 차이 0.
- 반론 2: "선언 단위로 떼면 묶음 머리 구획 주석과 남은 문이 갈라져 글자가 어긋나거나 다른 문 일부가 따라간다." → 덩어리는 앞 최상위 문 끝 줄 다음 줄부터라 다른 문 글자가 섞일 수 없고, 같은 줄에 다른 문이 붙은 선언은 생성기가 멈춘다. verify 가 덩어리 줄(주석 포함)을 접두만 떼고 이전 전 줄과 한 줄씩 맞대 14/14 같음.
- 반론 3: "smoke-test 가 index.html 에서 잘라 가는 함수가 옮긴 이름을 읽으면 시험지 안에서 이름이 사라진다." → 생성기가 smoke FN_NAMES 함수와 그 함수가 읽는 이름을 옮기지 않게 막는다(`HEATMAP_*` 이 그래서 남음). 측정: smoke 443/0 기준=후, 검사 제목 486개(세포 파일 수 줄 1개만 다름).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#recQuickDockBar`, `#recAgentInput`, `#recAgentSendBtn`, `#recAiSaveBtn`, `#recAiCancelBtn`, `.rec-card`, `[data-recedit]`, `[data-rectheme]`, `#recMiniPulseBar`, `#recCarouselPills [data-recslide]`, `#recordHeatmap .heatmap-cell`, `#reportPeriodToggle [data-period]`, `#recOpenProTemplateBtn`, `#proTrendChartWrap`, `#proAnalyticsWrap`, `#proAnalyticsBanner`, `#proCoachBtn`, `#coachCloseBtn`, `#proNotionExportBtn`, `#notionDirectPushBtn`, `#notionCloseBtn`, `#modalOverlay`, `#toast`.
- 함수: 3-2 표의 14개, 남은 `heatmapLevel`·`filterRecordsByQuery`·`computeTableAnalytics`·`computeTrendChartData`·`wireRecordCards`·`openProTemplateRecordModal`, `OurgoalAppScope.expose`, `OurgoalRecordsKit`.
- 파일: `index.html`, 3-2 표의 새 파일 5개, `docs/design/harness/module-split/gen-inline-p2.js`·`gen-inline-p2-1.config.js`·`verify-inline-p2.js`·`module-load-inline-p2.js`·`test-compare-inline-p2.js`·`dom-compare-inline-p2.js`·`dom-compare-inline-p2-steps.js`·`scenario-local-inline-p2.js`, `docs/architecture/modules.json`·`cell-descriptions.json`·`cell-map.json`·`module-baseline.json`·`inline-script-map.json`·`INLINE-SCRIPT-MAP.md`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

기준 = origin/main c222c4d(`git archive` 사본). 결과 파일은 `reports/TASK-ES-446/`.

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 인라인 줄 수 | `module-guard` ① | 32,147 → 31,269 (−878), ② 함수 선언 629 → 615, ③ 282 그대로 (작업자 측정 — main 이 움직이면 바뀌는 전체 수치라 주장에는 쓰지 않음) |
| 글자 동일 | `verify-inline-p2.js` | 옮긴 14개 선언 토큰열 동일(L. 접두 제외), 덩어리 14개 줄 단위 동일(주석 포함), 누수 0·미노출 0·남은 정의 0·안 가져온 사용 0, 새 파일 5개 모두 800줄 이하 (`verify-inline-p2-1.json` ok) |
| 원본 단독 로드 | `court/probes/module-load.js` 로컬 | 회귀 0, 새 파일 5개 단독 로드 성공(등록 전역 = 기존 `OurgoalRecordsKit` 1개) |
| 조작 전후(게스트) | `dom-compare-inline-p2.js` 단계 묶음 1 | 33단계 × 13칸 = 429값, 기준 대 후 0, 기준 대 기준 0, 콘솔 오류 2/2/2(posthog 외부 스크립트 차단 — 기준과 같음). 지운 값: 시간·난수, 스톱워치 시계 글자, 실행 시각 근처 HH:MM |
| 화면 시나리오(법정 형식) | `court/lib/scenario.js` runScenario 로컬 | 5개 기준·후 모두 통과, 약점 0 |
| 시험 | `npm test` · tests 110개 | smoke 443/0 · 무결성 38/38 · 버튼 943/943 기준=후, tests 종료 코드 전부 같음, 출력 차이는 기준 사본에 git 이력이 없어 건너뛴 이력 비교·세포 수뿐 |
| 탭 실측 | `tab-check.js records --deadclick off` 기준(c222c4d) 2회·후 1회 → `tab-compare.js` | 기록 탭 24장 408값 — 기준1 대 기준2 0 · 기준1 대 후 0 · 기준2 대 후 0 |

[4단계: 심사 청구]
