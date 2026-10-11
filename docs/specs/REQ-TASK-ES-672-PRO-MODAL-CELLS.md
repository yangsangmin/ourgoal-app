# REQ — 전문 템플릿 기록 창 조각 여섯을 세포로 글자 그대로 이전 (944줄 함수 A안의 3단계)

- Task ID: **TASK-ES-672** (L012: `gh pr list --state all --limit 80` · `git ls-remote origin` 에서 672 가 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-672-pro-modal-cells` 를 먼저 push 해 선점했다. 664·666~671 은 다른 작업 몫이다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」 · 이 함수에 대한 결심 원문: 「권장안대로 진행해.」
- **근거(지시함 DIR-004 (라), origin/main 에서 읽은 글자 그대로)**: 「944줄 함수 openProTemplateRecordModal(전문 템플릿 기록 창)은 A안으로 진행한다: ① 안전망 … ② 제자리 정리 … ③ 조각마다 세포로 글자 그대로 옮긴다(기존 CELL_SPLIT · 생성기 · 법정 바이트 대조). 저장 조각은 맨 마지막이고 「저장 후 새로 고침해도 기록이 남는다」를 따로 확인한다. 순서는 연결선 철거·다른 함수 이전·돈 근처 이전 뒤다. 하지 않는 것: 한 번에 다시 써서 옮기기, 800줄 상한 예외로 통째 옮기기(금고 변경).」
  - ①②는 PR **#936**(TASK-ES-646, 병합 ce9c52fd)으로 끝났다. **이 PR 은 ③이다.**
  - 「저장 조각은 맨 마지막」: 여섯 조각을 생성기 한 번으로 옮겼고(법정은 PR 하나에 생성기를 한 번 돌린다 — L073), 설정의 세포 순서에서 저장 조각을 맨 뒤에 두었다. 「저장 후 새로 고침해도 기록이 남는다」는 따로 확인했다(시나리오 s10 · s11 · x1 — 6·7절).
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「어려운 인라인 묶음 함수 이전」**(경험칙 L016 · L099 · `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` 2-2 · 2-7 · 2-10절) + 법정 「동작 보존 확인」 경로. 직전 선례 PR #917(TASK-ES-645 — 함수 선언 이전) · #930(TASK-ES-659) · #923(TASK-ES-653). 한 묶음을 여러 세포가 이름으로 나눠 가져가는 꼴(설계 2-7)이다.
- 작업참고 **기준 PR #934**(d55d7595).
- 이 작업 세션은 빌더(서브에이전트)다. 병합은 하지 않는다(오케스트레이터 몫).
- 기준 main: <!--BASE_HEAD_LINE-->d86d8366(#943 병합 뒤).<!--/BASE_HEAD_LINE-->
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

- **R1** 진입점 `openProTemplateRecordModal` 을 생성기로 세포 `js/tabs/records/pro-record-modal.js` 에 글자 그대로 옮긴다. 여는 길 셋과 닫는 길의 동작을 보존한다(손 편집 0).
- **R2** 표 편집 조각 `bindProRecTable` → `js/tabs/records/pro-record-table.js`. 동작 보존.
- **R3** 도구 단추 조각 `bindProRecTools` → `js/tabs/records/pro-record-tools.js`. 동작 보존. 「템플릿 마켓」 단추 연결 줄은 접두 말고 글자 0 변경.
- **R4** 성장 추이 차트 조각 `bindProRecTrendChart` → `js/tabs/records/pro-record-trend-chart.js`. 동작 보존.
- **R5** 스톱워치·인터벌 타이머 조각 `bindProRecStopwatch` → `js/tabs/records/pro-record-stopwatch.js`. 동작 보존.
- **R6** 저장·닫기 조각 `bindProRecSave` → `js/tabs/records/pro-record-save.js`. 동작 보존 — 저장한 뒤 닫았다 다시 열어도, 새로 고침한 뒤에도 기록이 남는다.
- **R7** 증명 하한(헌법 CELL_SPLIT_PROOF): 토큰 동일·누수 0 · 줄 단위로 접두 말고 다른 줄 0 · 단독 로드 회귀 0 · 통로·window 이름 값 지문이 옮긴 함수 말고 같음 · 조각 호출 순서·등록 의존 그대로 · npm test 수 동일 · tests·금고·생성기 변경 0.
- **R8** 기준선(`docs/architecture/module-baseline.json`)에 줄어든 값을 기록한다(DIR-003).
- **R9** 로그인 뒤 저장 경로(서버 동기화 · 구글 캘린더 자동 동기화 · Notion 자동 전송) — 법정 도구 한계(needs-login).
- **R10** 사진 첨부 · AI 사진 인식 결과 넣기 — 법정 도구 한계(file-attach). 작업자 탐침으로는 쟀다.

범위 밖(건드리지 않음): 조각 본문의 글자(6칸 들여쓰기 포함 — 정돈하지 않는다) · 통로의 기존 getter `get openProTemplateRecordModal(){…}` · 이 함수를 부르는 세포들(`js/tabs/records/render.js` · `record-card-wire.js` · `template-record-detail.js` · `weekly-recap.js` · `js/tabs/calendar/day-edit-hub.js`) · 이미 세포로 간 `openTemplateMarketModal`(`js/tabs/records/template-market.js`) · 같은 구획에 남는 문 하나(생성기 `keepRest`) · 생성기가 새로 단 통로 getter 와 가져오기 줄의 재철거(철거 담당 몫) · 발견한 결함의 수정(9절) · 생성 지도 3종(L009).

### 구체 식별자

- 파일: `index.html`(인라인 IIFE, 구획 「템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013)」) → 새 세포 여섯(키트 `OurgoalRecordsKit`, 태그는 `js/tabs/records/index.js` 태그 앞 같은 줄 — index.html 순증가 0줄).
- 함수와 이전 전 줄(출처 `reports/TASK-ES-672/gen-inline-hard-meta.json` `plan`): <!--PLAN_LINES-->`openProTemplateRecordModal` 2712~2867행(156줄) · `bindProRecTable` 2868~2937행(70줄) · `bindProRecTools` 2938~3175행(238줄) · `bindProRecTrendChart` 3176~3222행(47줄) · `bindProRecStopwatch` 3223~3486행(264줄) · `bindProRecSave` 3487~3673행(187줄)<!--/PLAN_LINES-->
- 생성기 `docs/design/harness/module-split/gen-inline-hard.js`(변경 0) · 검사기 `verify-inline-hard.js`(변경 0) · 설정 `reports/TASK-ES-672/proof.json`(자리 표지 `HO`, 세포 6 · 이름 6, `keepRest`).
- DOM(시나리오가 누르는 것): `#recOpenProTemplateBtn` · `#recQuickTemplateChips [data-quicktpl]` · `#hubAddProRecBtn` · `#proTable` · `.pro-tpl-cell-input[data-row][data-col]` · `.pro-tpl-row-del[data-delrow]` · `#proAddRowBtn` · `#proAddRowBtn2` · `#proAnalyticsWrap` · `#proTplSelect` · `.pro-trend-filter-chip[data-period]` · `#swStartPauseBtn` · `#swLapBtn` · `#swResetBtn` · `#swInjectBtn` · `.pro-sw-mode-chip[data-swmode]` · `.sw-lap-inject-btn` · `#proGeneralSaveBtn` · `#proCalendarSaveBtn` · `#proCancelBtn` · `#proRecBackToHubBtn` · 도구 단추 `#proQuickLoadBtn` · `#proCoachBtn` · `#proNotionExportBtn` · `#proCsvImportBtn` · `#proCsvExportBtn` · `#proWearableSyncBtn` · `#proTplMarketBtn` · `#proVisionOcrBtn` · `#proVoiceInputBtn` · `#proEditColsBtn` · `#proCreateTplBtn` · 음성 창 `#btnCloseMicGuide` · `[data-voicesim]` · `#voiceConfirmRowBtn`.

### 세포를 여섯으로 나눈 까닭

| 세포 | 함수 | 책임 | 줄 수 |
|---|---|---|--:|
<!--CELL_TABLE-->
| `js/tabs/records/pro-record-modal.js` | `openProTemplateRecordModal` | 전문 템플릿 기록 창의 진입점과 창 틀 | 182 |
| `js/tabs/records/pro-record-table.js` | `bindProRecTable` | 전문 템플릿 기록 창의 표 편집 | 95 |
| `js/tabs/records/pro-record-tools.js` | `bindProRecTools` | 전문 템플릿 기록 창의 도구 단추 | 263 |
| `js/tabs/records/pro-record-trend-chart.js` | `bindProRecTrendChart` | 전문 템플릿 기록 창의 성장 추이 차트 | 72 |
| `js/tabs/records/pro-record-stopwatch.js` | `bindProRecStopwatch` | 전문 템플릿 기록 창의 스톱워치·인터벌 타이머 | 289 |
| `js/tabs/records/pro-record-save.js` | `bindProRecSave` | 전문 템플릿 기록 창의 저장·닫기 | 212 |
<!--/CELL_TABLE-->

- 책임 단위로 나눴고 줄 수로 자르지 않았다(`-part1` 없음). 여섯을 한 파일로 합치면 800줄 상한을 넘는다(위 표의 줄 수 합).
- 파일 이름은 같은 폴더의 이웃(`pro-templates.js` · `pro-template-modals.js` · `pro-report-export.js`)과 같은 꼴로 `pro-record-*.js` 로 했다. 폴더를 새로 파지 않았다(시험·도구가 `js/tabs/<탭>/*.js` 를 읽는다).
- 세포 머리 설명(설정 `title` · `desc`)에 돈 관련 낱말을 쓰지 않았다(L100 — 줄 단위 비교의 「옮긴 구간 밖 돈 관련 줄」 0).

## 1. [원칙 ①] 문제를 정확히 파악한다

PR #936 으로 944줄 함수가 IIFE 최상위 함수 여섯으로 나뉘었고, 조각끼리는 꾸러미 `ctx` 로만 값을 주고받는다. 서로를 이름으로 부르는 곳은 진입점이 조각 다섯을 부르는 다섯 줄뿐이다. 이제 각 조각은 「최상위 함수 선언 · 최상위 this/arguments 0 · 800줄 이하」라서 생성기가 선언째로 글자 그대로 옮길 수 있다. 덩어리에 남은 IIFE 최상위 함수 선언은 이 여섯이 전부다(작업 트리의 인라인 스크립트를 파싱해 센 값 — 8절).

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 함수 선언 여섯을 선언째로 글자 그대로 세포 여섯에 옮긴다. 바뀌는 글자는 덩어리 이름 앞의 `L.` 뿐이다.
- **원인**: 2단계에서 「함께 보던 지역 이름」을 꾸러미로 바꿔 두었기 때문에 조각이 서로의 지역을 이름으로 보지 않는다 — 그래서 조각을 다른 파일로 떼어도 닿지 않는 이름이 없다.
- **중심**: 생성기 한 번 실행(설정 `proof.json` — 세포 6 · 이름 6). 진입점 세포는 조각 이름 다섯을 통로(`L.bindProRec…`)로 읽고, 생성기가 그 getter 와 가져오기 줄을 index.html 머리에 단다.
- **핵심**: ⓐ 진입점이 조각을 부르는 **순서**가 그대로일 것(도구 조각의 처리기가 차트 조각이 등록하는 함수를 부른다 — 4절) ⓑ 「접두 말고 글자 0 변경」을 생성기의 말이 아니라 따로 잰 값으로 보일 것 ⓒ 저장 뒤 새로 고침 유지를 따로 확인할 것.

## 3. [원칙 ③] 해결 방식

- 표준 이음매(INLINE-HARD-SPLIT-DESIGN 2-2 · 2-7 · 2-10): 함수는 옮기고, 인라인 이름은 통로 `L.<이름>` 로 읽는다. 한 구획의 함수 여섯을 세포 여섯이 이름으로 나눠 가져간다(`take.names`, `keepRest`).
- index.html 은 IIFE 머리(자리 표지 `HO`)에서 `var openProTemplateRecordModal = _recordsKit.openProTemplateRecordModal;` 등 여섯 이름을 같은 이름으로 가져온다. 기존 통로 getter(`get openProTemplateRecordModal(){…}`)는 그대로라, 이 함수를 부르는 다섯 세포의 `L.openProTemplateRecordModal(…)` 가 같은 함수 값에 닿는다.
- 조각 이름 다섯은 통로에 새로 생긴다(`get bindProRecTable(){ return bindProRecTable; }` …) — 진입점 세포가 `L.bindProRecTable(ctx)` 로 부른다. 옮긴 코드가 읽는 인라인 이름 가운데 통로에 없던 것도 생성기가 getter 를 달아 통로에 새로 생긴다(이름은 `name-fingerprints.json` `scopeAdded`). 새 window 전역은 0 이다.
- 등록 블록을 손으로 넣지 않았고 `gen-cell-provide.js` 를 돌리지 않았다(L068).
- 생성 뒤: `module-specs --write`(신고서 6칸 추가) · `cell-descriptions.json` 에 세포 설명 6개 · `module-guard --update`(낮아진 값만, 사유 없음).

## 4. [원칙 ④] 재검토 (반례·부작용)

- **조각 호출 순서 의존(PR #936 독립 검토가 남긴 주의)** → 도구 조각(둘째로 불림)의 처리기 둘(템플릿 변경 · 템플릿 생성)이 `ctx.updateTrendChart()` 를 부르는데, 그 등록 `ctx.updateTrendChart = updateTrendChart;` 는 차트 조각(셋째 조각 — 도구 조각 뒤에 불림)의 첫 문이다. 처리기는 창이 다 연결된 뒤 단추를 눌러야 돌므로 지금 순서에서는 등록이 항상 먼저다. **진입점의 조각 호출 순서를 바꾸면 이 전제가 깨져 TypeError 가 날 수 있다 — 순서를 바꾸지 않는다.** 이전 뒤 세포 파일에서 직접 쟀다(`order-check.json`): 진입점 콜백의 문 순서가 「`ctx.sheet = sheet` → 표 → 도구 → `ctx.bindRowEvents()` → 차트 → 스톱워치 → 저장」 그대로이고, 등록 문은 주인 조각의 맨 앞이며, 연결 중에 바로 부르는 꾸러미 함수는 `ctx.bindRowEvents()` 하나뿐이고 나머지 꾸러미 호출은 전부 처리기 안이다. 이 주의는 진입점 세포의 머리 설명에도 적었다.
- **진입점이 조각 이름을 통로로 읽는다** → 세포는 `L.bindProRecTable(ctx)` 처럼 부른다. 통로로 부르면 `this` 가 통로 객체가 되는데, 조각 함수 다섯과 그 안쪽 함수에 `this` 가 0 이다(검사기 `thisArgs` []). 새로 단 getter 는 가져오기 줄의 지역 변수를 돌려주고, 그 값은 세포 태그가 IIFE 앞에 있어 IIFE 머리에서 이미 정해져 있다.
- **「템플릿 마켓」 단추 연결 줄(돈 근처)** → 그 줄들을 글자째 따로 실었다(`prefix-only-check.json` `marketLines`): 접두를 떼면 기준 줄과 바이트 단위로 같다. 붙은 접두는 `L.openTemplateMarketModal` 과 `L.openProTemplateRecordModal` 둘이다. `openTemplateMarketModal` 은 이미 세포(`template-market.js`)에 있고 통로 getter 가 있다 — 화면으로도 「마켓」 단추로 창이 열린다(s06).
- **바뀐 글자** → 옮긴 줄 전부를 기준과 줄 단위로 맞댔다(7절 표): 접두만 다른 줄 말고 다른 줄 0, 지운 `L.` 수 = 생성기 바꿔 쓰기 수. 돈 관련 낱말이 든 줄 0.
- **함께 옮겨진 주석** → 진입점 선언 바로 앞의 주석 두 줄(「[#TASK-ES-645] … 로 옮김」 표지 한 줄 · 「📋 전문적(내 전용 템플릿) 기록하기 메인 창」)이 생성기 규칙(앞 주석 포함)으로 진입점 세포에 함께 갔다. 실행되는 글자가 아니다. 사실대로 적는다.
- **생성기가 새로 단 통로 getter** → 옮긴 코드가 읽는 인라인 이름 가운데 머리에 getter 가 없던 것을 생성기가 달았다(수와 이름은 `measurement.json` `generator`). 값이 정해지는 줄이 getter 줄보다 뒤인 이름도 있지만 그 사이에 실행되는 문은 0 이다(`expose-window.json`). 상태 기관 이름과 겹치는 getter 0 · 새 세포가 읽는 이름은 모두 통로에 있다(`accessor-probe.json`).
- **이름 지문** → 통로 이름 가운데 값 지문이 달라진 것은 본문을 옮긴 `openProTemplateRecordModal` 하나(종류·이름·인자 수 같고 함수 글자 해시만)다. 통로에 새로 생긴 이름은 조각 이름 다섯과, 옮긴 코드가 읽는 인라인 이름 가운데 전에는 통로에 없던 것들이다(수와 이름은 7절 표). 사라진 이름 0 · window 이름 차이 0.
- **단독 로드(L018)** → 세포 여섯은 함수 정의만 한다. 새 파일 단독 로드 ok, 기준 대비 회귀 [].
- **글자를 찾는 시험** → `scripts/smoke-test.js` 는 `openProTemplateRecordModal` 글자를 index.html + 세포 합본에서 찾는다. 시험 파일을 하나씩 돌린 결과가 기준과 모두 같다(시험 변경 0).
- **CSS 숨김 · 금지 낱말** → 옮긴 글자에 `!important` 숨김 0. 새 파일은 각각 800줄 이하.
- **화면 대조에서 뺀 것**(`scenario-local.json` `normalize`): #936 과 같은 목록(난수 ID · 시각 · 색종이 · 돌아가는 시계 · 랩 토스트 · 시:분 글자 · 토스트 보임 표시 · 콘솔 오류 개수 · 인라인 스크립트 소스 글자 · 저장 용량 추정치) + 이 PR 이 새로 넣은 세포 파일 여섯의 `<script src>` 태그(작업 쪽에만 있다 — 이 PR 의 변경 그 자체).

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · 번호 선점 · `npm ci --ignore-scripts` · 기준 작업 폴더(분리 HEAD).
2. 설정 작성 → 생성기 실행 → 검사기 ok → `module-specs --write` · 세포 설명 · `module-guard --update`.
3. 줄 단위 비교 · 조각 호출 순서 점검 · 새 getter 시점 · 통로 접근자 · 이름 지문 · 모듈 로드.
4. 시나리오 16개(#936 의 12개 + 독립 검토자의 추가 4개)를 기준 2회 · 작업 1회, CSV 내려받기 · 사진 첨부 · Notion 본문 탐침, npm test(기준·작업 전경) · 시험 파일 전부.
5. 서류 → `verify-integrity-gate.js` → `npm test` → 커밋 → 로컬 `recomputeSplit` · 로컬 법정 전체 실행 → push(완성 뒤 한 번) → PR.
6. main 이 움직여 index.html 이 충돌하면 손으로 풀지 않고 main 판 index.html 로 같은 설정을 다시 돌려 다시 잰다(L010).

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「여섯을 한 번에 옮기면 어느 조각이 깨졌는지 가르기 어렵다. 차트 → 타이머 → 도구 → 표+창 틀 → 저장 순서로 다섯 PR 이 안전하다」** → 조각끼리는 꾸러미로만 주고받고 본문은 2단계에서 이미 굳었다. 이번에 바뀌는 것은 조각마다 「덩어리 이름 앞의 `L.`」뿐이고, 그것은 조각별로 따로 잰다 — 줄 단위 비교가 세포마다 구간을 나눠 싣고, 시나리오는 조각마다 자기 것이 있으며(주장 15개가 세포별 지시 항목 R1~R6 에 나뉘어 걸린다), 법정도 주장마다 따로 판정한다. 다섯 PR 로 나누면 그 사이 조각이 덩어리와 세포에 걸친 중간 상태가 네 번 생기고(그때마다 가져오기 줄·getter 가 달렸다 지워진다), main 이 그동안 계속 움직여 PR 마다 다시 돌려야 하며, push 가 다섯 배가 된다(배포 한도 — L115). 법정이 PR 하나에 생성기를 한 번 돌리므로 여섯을 한 설정에 담는 것이 선례(L073)와도 맞다. 저장 조각은 설정의 맨 뒤에 두고 새로 고침 유지를 따로 확인했다.
- **반론 2 「화면 시나리오가 닿지 않는 가지는 같다는 보증이 없다」** → 화면으로는 말하지 않는다. 닿지 않는 가지(로그인 뒤 서버 동기화 · 진짜 Notion · 구글 캘린더)는 법정 도구 한계로 「확인 못 함」을 냈다. 그 부분의 동일성은 법정의 생성기 재실행 바이트 대조(proof)와 토큰 동일 · 줄 단위 비교로 말한다. 작업자 탐침으로 더 잰 것(사진 첨부 · 같은 출처로 나가는 Notion 요청 본문 · CSV 파일)은 작업자 측정이라고 적었다.
- **재검증**: 독립 검토자의 사진 첨부·Notion 탐침을 가져와 처음 돌렸을 때 Notion 쪽이 「기준과 다름」으로 나왔다. 갈린 것은 Notion 요청이 아니라 같은 출처로 나간 다른 요청(AI 피드백) 본문 속 기록 ID 하나(실행마다 새로 만들어진다)였다. 요청 기록 전체에서 실행별 ID·시각을 가린 뒤 다시 돌려 같음을 확인했다. 가린 것은 탐침 파일 머리에 적었다.
- **재검증**: 독립 검토자의 시나리오 x4(음성 시뮬레이션 칩)에는 사라지는 토스트를 보는 단언이 둘 있었다. 법정이 기준을 두 번 돌릴 때 시점에 흔들릴 수 있어(L077) 그 둘을 빼고 가져왔다 — 단추가 보이고 사라지는 것으로 잰다.
- **재검증**: 화면 대조 첫 두 번의 전체 실행에서 각각 한 칸이 「차이」로 나왔다(첫 번째는 x3 의 6단계 결과 글자, 두 번째는 s09 의 6단계 결과 글자). 첫 번째는 갈린 글자가 남지 않아 원인을 볼 수 없었다 — 대조 도구가 갈린 칸의 글자를 남기게 고친 뒤(`compare.diffValues`) 두 번째에서 봤다: 첫 화면 인사 창의 닫기 단추를 누른 단계에서 실행기가 적는 단추 크기가 `47x47px` 대 `46x46px` 로 갈린 것이다(창이 커지며 나타나는 중에 눌린다 — 기록 창을 열기 전 단계이고 옮긴 코드와 닿지 않는다). 그 단추의 크기 글자만 가리고 전체를 다시 돌렸다. 가린 것은 `scenario-local.json` `normalize` 에 적었다. x3 만 세 번 따로 돌렸을 때는 차이 0 이었다.
- **재검증**: 그렇게 다시 돌린 세 번째 전체 실행에서는 s12 하나의 화면 칸 34개가 첫 상태부터 전부 「차이」로 나왔다(나머지 15개는 0). s12 의 기준 두 번은 18시 전에, 작업 한 번은 18시 뒤에 돌았다. 홈 화면의 인사말이 시각대로 갈린다(`js/tabs/home/sub-onescreen.js` — 5·12·18·22시가 경계, 이 PR 이 건드리지 않는 파일). s12 만 18시 뒤에 다시 돌리니 차이 0 이었고, 그 뒤 16개 전체를 한 번 더 돌린 것이 `scenario-local.json` 이다. 가리지 않았다 — **대조를 다시 돌릴 때는 기준·작업 실행이 5·12·18·22시를 사이에 두지 않게 한다.**
- **재검증**: CSV 내려받기 탐침의 첫 실행에서 작업 쪽이 「보이는 대상 없음: #btnAvatarGreetClose」로 끝나 파일이 생기지 않았다. 다시 돌려 기준·작업 모두 파일이 생기고 바이트가 같음을 확인했다(그 뒤 전체 재실행에서도 같았다). 첫 실행이 왜 그랬는지는 확인하지 못했다 — 재실행에서 같았다는 사실만 적는다.
- **재검증**: npm test 첫 실행은 작업 쪽 종료 코드가 1 이었다. 새 세포 파일 여섯이 아직 git 에 올라가지 않은(미추적) 상태라 `tests/cell-map-export-es414.test.js` 가 「세포 수가 신고서와 같고 세포마다 필수 칸이 있다 — records/pro-record-modal: 줄 수」로 떨어졌다(그 시험은 git 이 추적하는 파일만 읽는다). 새 파일을 `git add` 한 뒤 다시 돌려 종료 코드 0 을 확인했다. 검사 줄 글자는 한 줄이 기준과 다르다 — 세포 파일 수를 적는 줄(「Checked N modular files」)의 N 이 새 파일 수만큼 늘었다. 그 줄을 그대로 실었다(`npm-test-compare.json` `same.textDiffLines`).
- **재검증**: 측정 도중 main 이 네 번 움직였다. ① #939(index.html 변경) — 손으로 맞추지 않고 생성 결과를 되돌린 뒤 main 을 받아 같은 설정으로 생성기를 다시 돌렸다(L010). 다시 만든 세포 파일 여섯은 앞서 만든 것과 바이트 단위로 같았다(`cmp`). ② #940(등록 2차 — index.html · 신고서 · 기준선 변경 0, 세포 49개에 등록 블록) — 커밋 전이라 main 을 그대로 받았고(티켓 줄 · 기준선 기록은 다시 적용) 기준 트리도 새 main 으로 바꿨다. ③ #941(상태 이전 3차 — index.html 변경, 조각 구간 밖) · #942(생성 지도 갱신) — ①과 같은 순서로 되돌리고 받아서 다시 돌렸다(순서를 도구로 두었다: `tools/regen.sh`). 다시 만든 세포 여섯은 앞서 것과 「이전 전 index.html N~M줄」 표지 줄의 줄 번호와 머리 설명의 줄 번호만 다르다(`diff`). ④ #943(재철거 2차 — index.html 의 가져오기 줄·getter 줄 삭제, 조각 구간 글자는 그대로) — 42b5511f 판으로 측정과 로컬 커밋까지 마친 뒤였다. push 전이라 그 커밋을 풀고 ①과 같은 순서로 다시 돌렸다(이때 되돌리기 도구가 스테이징된 판을 꺼내 와 되돌려지지 않는 결함을 겪어 `git checkout HEAD --` 로 고쳤다). 재철거가 지운 getter 가운데 옮긴 코드가 읽는 이름은 생성기가 다시 달았다(수는 7절 표). 네 번 모두 측정은 전부 새 기준으로 다시 했다. 생성 결과가 새 main 판과 맞는지는 커밋 뒤 `recomputeSplit` 직접 호출로 본다(7절 표).
- **재검증(측정 겹침)**: main 이 움직일 때마다 돌던 측정을 중단시키고 새로 시작했는데, 중단시킨 실행의 자식 프로세스가 끝나지 않고 남아 다음 실행과 겹쳐 돌며 같은 결과 파일에 썼다. 알아챈 경위: 새 기준(그때는 42b5511f)으로 돌린 실행이 끝났는데 `scenario-local.json` 의 기준 커밋 칸이 앞선 기준(aa7ed6c7)이었고, 그 실행의 시나리오 기록은 한 줄(s01)뿐이었다(왜 한 줄에서 끝났는지는 확인하지 못했다). 같은 실행에서 CSV 탐침은 기준 쪽이 「보이는 대상 없음: #btnAvatarGreetClose」로 끝났다. 그래서 그 실행의 결과는 쓰지 않았다 — 남은 프로세스가 0 임을 프로세스 목록으로 확인한 뒤 한 벌 전체를 처음부터 끝까지 중단 없이 다시 돌렸고, 7절 표의 수치는 전부 그 실행의 것이다. 위 「재검증」들에 적은 앞선 흔들림(단추 크기 1px · CSV 첫 실행) 가운데 일부는 이 겹침의 영향이었을 수 있으나 가려 보지 못했다.
- **재검증**: 로컬 법정 전체 실행은 같은 커밋으로 두 번 돌렸다. 첫 실행은 주장 심사 도중 종료 코드 127 로 끝나 「실행 중 종료」 판정서만 남았다(왜 끝났는지는 확인하지 못했다). 둘째 실행은 끝까지 돌았고 그 결과가 `court-local.json` 이다(작업자 PC 예비 점검 — 판정 아님).
- **재검증**: 조각 호출 순서 점검 도구의 첫 판은 진입점의 `ctx.bindRowEvents()` 를 「처리기 안」으로 잘못 세었다(창을 붙일 때 바로 도는 콜백을 안쪽 함수로 봤다). 그 콜백 안을 「연결 중」으로 보게 고쳐 다시 쟀다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-672/` 아래, 작업자 측정이다. 숫자의 정본은 각 파일이다.

<!--MEASURE_TABLE-->
기준 d86d8366 · 측정 2026-10-11T10:12:20.901Z

| 산출물 | 무엇을 쟀나 | 결과 |
|---|---|---|
| `proof.json` · `gen-inline-hard-meta.json` · `verify-inline-hard.json` | 생성기 설정 · 생성기 메타 · 검사기 보고 | 옮김 6 · 감싸기 0 · 남김 1 · 가져오기 줄 6 · 새 통로 getter 53 · 바꿔 쓰기(접두) 133 · 검사기 `ok: true` · this/arguments [] · 미노출 [] · 남은 글자 동일 true |
| `prefix-only-check.json` | 옮긴 줄 전부의 줄 단위 바이트 비교(생성기·검사기와 따로) | 옮긴 줄 962 · 바이트 동일 853 · 접두만 다른 줄 109 · 그 밖의 차이 **0** · 지운 접두 133 = 생성기 바꿔 쓰기 133 · 「템플릿 마켓」 단추 줄 7줄 접두 떼면 동일 **true** · 돈 관련 낱말 줄 0 · 옮긴 구간 밖 돈 관련 줄 0 |
| `order-check.json` | 진입점의 조각 호출 순서 · 꾸러미 등록 자리 · 연결 중 바로 부르는 꾸러미 함수 | `ok: true` · 순서 그대로 true(ctx.sheet = sheet → bindProRecTable(ctx) → bindProRecTools(ctx) → ctx.bindRowEvents() → bindProRecTrendChart(ctx) → bindProRecStopwatch(ctx) → bindProRecSave(ctx)) · 연결 중 바로 부르는 것 ctx.bindRowEvents() |
| `expose-window.json` · `accessor-probe.json` | 새 getter 줄과 값이 정해지는 줄의 순서 · 새 세포가 읽는 통로 이름 · 상태 기관 겹침 | 새 getter 53개 중 값이 먼저 정해진 것 44 · 뒤에 정해지는 것 9(그 사이 실행되는 문이 있는 이름 0) · 접근자 `ok: true` · 새 세포가 읽는 이름 55개 중 통로에 없는 이름 [] · 값이 정해지지 않은 이름 [] · 상태 기관 이름 9개와 겹치는 것: 읽는 이름 [] · 새 getter [] |
| `cell-registry-compare.base.json` · `cell-registry-compare.json` · `name-fingerprints.json` | 통로 · window 이름의 값 지문(기준 이름 목록 고정) | 통로 522개 중 달라진 것 1(`openProTemplateRecordModal`) · 그 밖 0 · 사라진 이름 0 · 새로 생긴 이름 17(`bindProRecSave`, `bindProRecStopwatch`, `bindProRecTable`, `bindProRecTools`, `bindProRecTrendChart`, `downloadTableAsCsv`, `formatStopwatchTime`, `getAllProTemplates`, `openCsvImportModal`, `openTemplateColumnEditModal`, `openVisionTableModal`, `openVoiceTableModal`, `openWearableSyncModal`, `playTimerBeep`, `renderLapRowsHtml`, `renderStopwatchWidgetHtml`, `syncRecordToMatchingGoals`) · window 3개 차이 0 |
| `module-load.json` | 법정 모듈 로드 탐침 기준 대 작업 · 새 파일 단독 로드 | 회귀 [] · 새 파일 여섯 단독 로드 ok true |
| `scenarios/*.json`(15개) · `scenarios-local/*.json`(1개) · `scenario-local.json` | 게스트 화면 시나리오 기준 2회 · 작업 1회 + 단계별 화면 · 저장값 · 토스트 · 단계 결과 대조 | 시나리오 16개 전부 통과 true · 행동 변화 단언 있음 true · 기준 2회 일치 true · 맞댄 칸 7508 중 같은 칸 7508 · 차이 **0** · 기준끼리 달라 뺀 칸 0 · 예외 0 |
| `photo-notion-probe.json` | 사진 첨부(파일 입력에 그림을 넣음) · Notion 자동 전송 요청 본문(같은 출처의 로컬 서버로 나가는 것) | 사진 첨부 기준과 같음 true · Notion 본문 기준과 같음 true(요청 1건) · 오류 [] |
| `csv-download.json` | 「CSV 다운로드」 단추가 만든 파일 | 파일 생김 기준 true · 작업 true · 이름·바이트 같음 true |
| `raw/npm-test.{base,work}.{log,exit}` · `npm-test-compare.json` | npm test 전경 실행 | 종료 코드 0 · 0 · ✓ 줄 487 · 487 · ok 줄 196 · 196 · 글자가 갈린 검사 줄 1(세포 파일 수를 적는 줄 — 196 → 202) · 그 숫자를 가리면 같음 true |
| `tests-all-compare.json` | 시험 파일 119개를 하나씩 실행 | 기준과 다른 파일 **0** (종료 코드가 0 이 아닌 파일은 기준 26 · 작업 26 — 같은 파일, 이 PR 과 무관한 기존 상태) |
| `measurement.json` | 지표 · 새 파일 줄 수 · 바뀐 파일 | 인라인 스크립트 줄 수 1645 → 751(**-894**) · index.html 함수 선언 수 22 → 1(-21) · index.html 3914 → 3020줄 · window 대입 75 → 75 · 새 파일 최장 289줄 · 세포 밖 js 변경 0 · 시험 0 · 금고 0 · 생성기 0 · 생성 지도 0 · 모듈 가드 종료 코드 0 |
| `court-local.json` | 로컬 `recomputeSplit` 직접 호출 · 로컬 법정 전체 실행(작업자 PC 예비 점검 — 판정 아님) | recomputeSplit `ok: true` · 판정 줄 「확인 부족」 · 작업자가 적어 낸 지시 항목 10건 중 2건은 필요한 수준까지 확인하지 못했습니다 · 종료 코드 3 · 끝까지 돌았는가 true |
<!--/MEASURE_TABLE-->

### 7.1 재현 방법 (한 줄씩)

기준 트리 = 이 PR 의 merge-base 를 분리 HEAD 로 꺼낸 작업 폴더, 작업 트리 = 이 브랜치(`npm ci --ignore-scripts`). 전부 작업 트리에서 돌린다.

| 무엇 | 명령 | 기대 출력 |
|---|---|---|
| 생성기 재실행 대조 | `MODULE_SPLIT_OUT=<임시> node docs/design/harness/module-split/gen-inline-hard.js <기준 사본> reports/TASK-ES-672/proof.json` 뒤 그 사본의 `index.html` · 세포 여섯을 이 브랜치의 것과 `cmp` | 일곱 파일 바이트 동일(법정의 `recomputeSplit` 이 하는 일) |
| 검사기 | `node docs/design/harness/module-split/verify-inline-hard.js <기준>/index.html . reports/TASK-ES-672/proof.json` | 마지막 줄 `OK: 토큰 동일(접두 제외) · …` |
| 줄 단위 접두-만 비교 | `node reports/TASK-ES-672/tools/prefix-only-check.cjs <기준>/index.html . reports/TASK-ES-672/gen-inline-hard-meta.json reports/TASK-ES-672/proof.json <임시>/p.json` | `"ok":true` · `otherDiffLines 0` · `market [7,true]` |
| 조각 호출 순서 | `node reports/TASK-ES-672/tools/order-check.cjs . reports/TASK-ES-672/proof.json <임시>/o.json` | `"ok":true,"problems":[]` |
| 시나리오 16개 기준 2회 · 작업 1회 | `node reports/TASK-ES-672/tools/scenario-local.cjs <기준> . <임시>/s.json reports/TASK-ES-672/scenarios/*.json reports/TASK-ES-672/scenarios-local/*.json` | 시나리오마다 base·base2·work true · 마지막 줄 `allPassed true · diffs 0 · exceptions 0` |
| 사진 첨부 · Notion 본문 | `node reports/TASK-ES-672/tools/photo-notion-probe.cjs <기준> . <임시>/pn.json` | 두 줄 모두 `base==head: true` |
| 한 벌 전체 | `sh reports/TASK-ES-672/tools/run-all.sh <기준> <저장소 밖 임시 폴더>` | 마지막 `staticMismatch 0` |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 다른 빌더의 index.html PR(재철거 2차 · 구역 이전)이 먼저 병합되면 충돌한다 → main 판 index.html 로 같은 설정을 다시 돌려 다시 잰다(L010). 생성기가 다시 단 getter 는 재철거 담당 몫이다.
- **측정불가(화면)**: 로그인 뒤 서버 동기화 · 진짜 Notion 전송 · 구글 캘린더 자동 동기화(needs-login) · 사진 고르기(file-attach — 작업자 탐침으로는 잼) · 스마트워치 선택 · 마켓 복제 · AI 코치 적용(쓰기·바깥 실행이라 넣지 않음) · 차트 점 설명과 기록 2건 상태(기준에서도 죽어 있음).
- **성과 측정**: <!--SUMMARY_LINE-->인라인 스크립트 줄 수 1645 → 751(-894) · index.html 함수 선언 수 22 → 1 · index.html 3914 → 3020줄 · 새 세포 여섯 합 1113줄(최장 289줄)(출처 `measurement.json`). 기준선 70번째 기록.<!--/SUMMARY_LINE-->
- **다음에 열리는 것**: <!--NEXT_LINE-->이 PR 뒤 IIFE 최상위 함수 선언은 0개다(작업 트리의 인라인 스크립트를 파싱해 센 값). 남은 것은 생성기가 다시 단 통로 getter 와 가져오기 줄의 재철거, 남은 구역 이전, 마지막 정리(finalize)다 — 모두 다른 작업 몫이다. 조각이 세포로 가면서 `state` 의 맨이름 참조가 `L.state` 로 바뀌었다(새 세포 여섯에 35곳 — 세포 파일에서 센 값). 그래서 `state` 의 상태 기관 이전이 풀린다(다른 작업 몫).<!--/NEXT_LINE-->
- **PLAN 체크리스트**: [4단계: 심사 청구]까지만 기록한다(`.claude/plan-TASK-ES-672.md`).

## 9. 그대로 둔 결함 (고치지 않았다 — 옮기기는 고치기가 아니다)

PR #936 의 REQ 9절에 적은 것들이 글자 그대로 세포로 옮겨졌다: 같은 템플릿 기록이 2건 이상이면 창이 열리지 않는 것(`js/tabs/records/table-analytics-engine.js` 의 `val` 미선언 — 이 PR 이 건드리지 않는 파일) · 차트 점 설명이 보이지 않는 것 · 도구 창이 기록 창을 덮어써 입력하던 표가 사라지는 것 · `#proCancelBtn` 처리기 이중 대입 · `var summaryText` 중복 선언 · 행 추가 직후 기입이 종목 칸에 들어가는 것 · 스톱워치 단추 글자 불일치. 시나리오는 기록 2건 상태를 피한다(템플릿마다 기록 1건).
