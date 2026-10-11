# REQ — 944줄 함수 openProTemplateRecordModal 「안전망 → 제자리 정리」 (세포 이전의 1·2단계)

- Task ID: **TASK-ES-646** (L012: `gh pr list --state all --limit 60` · `git ls-remote origin` 에서 646 이 비어 있음을 확인한 뒤 빈 브랜치 `refactor/2026-10-11-task-es-646-pro-modal-inplace` 를 먼저 push 해 선점했다. 643·644·645 는 다른 작업 몫이다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 이 함수에 대한 상민님 결심 원문(같은 날 같은 세션 채팅, 오케스트레이터가 설명한 선택지 A~D 가운데 권장 A안에 대한 답): 「권장안대로 진행해.」
  - **A안 요지**: ① 이 창의 지금 동작을 시험(시나리오)으로 먼저 고정하는 안전망 → ② 덩어리 안에서 다섯 조각으로 나누는 제자리 정리(함께 보던 작업 메모를 꾸러미 하나로 묶어 건네는 방식, 동작 변화 0 을 안전망 전후 동일로 증명) → ③ 조각마다 세포로 글자 그대로 옮기기(기존 생성기 · 법정 바이트 대조). 저장 조각은 맨 마지막이고 「저장 후 새로 고침해도 기록이 남는다」를 따로 확인한다. 하지 않는 것: 한 번에 다시 써서 옮기기 · 800줄 예외로 통째 이사.
  - **이 PR 의 범위는 ①과 ②까지다.** ③은 다음 PR 이다.
  - **근거(지시함 DIR-004, origin/main 에서 읽은 글자 그대로)**: 이 결심을 지시함에 적는 PR **#888**(TASK-ES-616)을 상민님이 병합하셨다(병합 커밋 ce448f39, 2026-10-11). 병합된 DIR-004 결심 기록: 「④ 944줄 함수 — A안 허용(안전망 → 제자리 다섯 조각 → 조각별 옮기기, 아래 (라))」. 지시 (라): 「944줄 함수 openProTemplateRecordModal(전문 템플릿 기록 창)은 A안으로 진행한다: ① 안전망 — 이 창의 지금 동작을 시험(시나리오)으로 먼저 고정한다(창 열기 → 행 추가 → 값 입력 → 스톱워치 랩을 표에 넣기 → 저장 → 닫았다 다시 열어도 그대로 → CSV 내려받기). 게스트로 이 창이 열리는지는 미측정이며, 로그인이 필요하면 안전망은 실계정 하네스로 만든다. ② 제자리 정리 — 덩어리 안에서 다섯 조각(창 틀·표 편집 / 도구 버튼 13종 / 성장 추이 차트 / 스톱워치·인터벌 타이머 / 저장)으로 나눈다. 조각들이 함께 보던 작업 메모를 꾸러미 하나로 묶어 건네주는 방식이고, 동작 변화 0 을 안전망 시험 전후 동일로 증명한다. 이 단계는 옮기기가 아니라 고치기 PR 이므로 일반 개발 절차(헌법 MODE_4A · 화면 시나리오 주장 · 법정 판정)로 간다 — 생성기 바이트 대조(「동작 보존 확인」)의 대상이 아니다.」
  - **경위(사실대로)**: 이 작업을 시작할 때는 #888 이 열려 있어 origin/main 의 DIR-004 가 이 함수를 「보류」로 적고 있었고, 빌더는 오케스트레이터의 지시문으로 상민님 채팅 원문(위)을 전달받아 착수했다. 작업 도중 #888 이 병합돼 지금은 병합된 지시함이 근거다. (라)의 「게스트로 이 창이 열리는지는 미측정」은 이 PR 이 쟀다 — 열린다(8.1절). 그래서 실계정 하네스 없이 게스트 시나리오로 안전망을 만들었다.
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(다) 탐색 — 새 유형 「큰 함수 제자리 정리」**. 작업참고에 「한 함수를 덩어리 안에서 여러 함수로 나누는」 유형이 없다.
  - 가까운 유형: ① 어려운 인라인 묶음 함수 이전(L016 — 함수를 세포로 글자 그대로 옮김) ② 로드 중 문 감싸기(INLINE-HARD-SPLIT-DESIGN 2-3 — 문을 함수로 감싸고 원래 자리에서 부름) ③ 상태 이전(L095 — 값이 사는 자리를 바꾸고 읽기·쓰기를 접근자로 돌림).
  - 안 맞는 점: 셋 다 생성기가 만들고 법정이 생성기를 다시 돌려 바이트를 맞댄다. 이번은 생성기가 없는 「고치기」다 — 함수 안쪽 함수들이 바깥 함수의 지역 변수를 함께 보므로, 글자 그대로 옮길 수 있는 꼴(최상위 함수)로 **먼저 바꾸는** 일이다. 법정에는 손으로 고친 보존을 바이트로 확인하는 길이 없다.
  - 그래서 스스로 설계한 검증: (a) 정리 전후 토큰열 대조(허용한 차이 넷 말고 0) (a') 접두 기대 대조(정리 전 스코프 분석으로 따로 계산) (b) 조각 경계를 넘는 맨이름 0 (c) 대조기가 가짜로 통과하지 않음을 보이는 대조군 (d) 게스트 화면 시나리오 12개를 기준 2회 · 작업 1회 돌려 단계별 화면 · 저장값까지 대조 (e) 저장 뒤 새로 고침 유지 (f) npm test · 시험 파일 전부 · 모듈 로드 · 이름 지문. 검증을 줄인 곳은 없다.
- 작업참고 **기준 PR #915**(f4932332).
- 이 작업 세션은 빌더(서브에이전트)다. 병합은 하지 않는다(오케스트레이터 · 상민님 몫).
- 기준 main: ed20750c(#932 병합 뒤). 작업 중 main 이 계속 움직여 작업 폴더를 일곱 번 다시 맞췄다(9014a386 → e5f34779 → c0658b2c → 529e4370 → 7852fc16 → 6eeacd58 → 8c076e17 → ed20750c). 그때마다 main 판 index.html 에 변환기를 다시 돌리고 측정을 다시 했다.
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

원문의 어느 문장에서 나왔는지: R1~R6 은 A안 ①「이 창의 지금 동작을 시험으로 먼저 고정」과 ②「동작 변화 0 을 안전망 전후 동일로 증명」, R6 의 새로 고침은 「저장 후 새로 고침해도 기록이 남는다를 따로 확인」, R7·R8 은 ②「덩어리 안에서 다섯 조각으로 나누는 제자리 정리(꾸러미 하나로 묶어 건네는 방식)」, R9 는 헌법 ratchet_baseline, R10~R12 는 ①의 범위 가운데 법정 도구로 잴 수 없는 부분이다.

- **R1** 창 틀 — 여는 길 셋과 닫는 길이 정리 전과 같다.
- **R2** 표 편집 — 행 추가 · 칸 입력 · 행 삭제가 정리 전과 같다.
- **R3** 도구 단추 — 템플릿 변경 · 지난 루틴 불러오기 · 창이 뜨는 단추들의 열기·닫기와 로컬 반영이 정리 전과 같다(전송·연동·복제·AI 호출은 실행하지 않는다).
- **R4** 성장 추이 차트 — 기간 칩이 정리 전과 같다.
- **R5** 스톱워치·인터벌 타이머 — 시작 · 랩 · 정지 · 리셋 · 모드 · 표 기입 · 시간이 다 되면 멈춤이 정리 전과 같다.
- **R6** 저장 — 일반저장 · 일정연동저장 · 수정 저장이 정리 전과 같고, 닫았다 다시 열어도 · 새로 고침한 뒤에도 기록이 남는다.
- **R7** 제자리 정리의 글자 대조 — 허용한 차이 말고 0, 이 함수 구간 밖 · js · 시험 · 금고 변경 0.
- **R8** IIFE 최상위 함수 여러 개(각 800줄 이하, 최상위 this/arguments 0). 진입점의 이름 · 인자는 그대로.
- **R9** 일시적으로 늘어난 래칫 값을 사유와 함께 기준선에 기록.
- **R10** 로그인 뒤 저장 경로(서버 동기화 · 구글 캘린더 자동 동기화 · Notion 자동 전송) — 법정 도구 한계(needs-login).
- **R11** 사진 첨부 · AI 사진 인식 결과 넣기 — 법정 도구 한계(file-attach).
- **R12** 음성으로 말한 행 넣기 — 법정 도구 한계(camera-mic-share).

범위 밖(하지 않음): ③ 조각별 세포 이전 · 버그 수정(9절 목록) · 들여쓰기 정돈 · 이 함수가 부르는 세포(`js/tabs/records/*` 등) · 시험 · 금고 · 생성기 · 생성 지도(`cell-map.json` · `inline-script-map.json` · `INLINE-SCRIPT-MAP.md` — L009).

### 구체 식별자

- 파일: `index.html`(인라인 IIFE, 정리 전 3311~4254행 = 944줄 — 기준 ed20750c). 제품 변경은 이 구간뿐이다.
- 진입점: `openProTemplateRecordModal(editRec, initialTplKey, initialDate)` — 이름 · 인자 · 통로 getter(`get openProTemplateRecordModal(){…}`) 그대로. 여는 곳: `js/tabs/records/render.js` · `record-card-wire.js` · `template-record-detail.js` · `weekly-recap.js` · `js/tabs/calendar/day-edit-hub.js` · 이 함수 안의 「마켓」 콜백(자기 자신을 다시 부름).
- 새 IIFE 최상위 함수(조각): `bindProRecTable` · `bindProRecTools` · `bindProRecTrendChart` · `bindProRecStopwatch` · `bindProRecSave` — 모두 인자는 꾸러미 `ctx` 하나.
- 안쪽 함수(이름 그대로, 15개): `renderModal` · `renderRowsHtml`(진입점 안) · `syncCurrentRowsFromDOM` · `updateAnalyticsBanner` · `refreshTableBody` · `bindRowEvents` · `addNewRow`(표) · `bindChartEvents` · `updateTrendChart`(차트) · `updateSwDisplay` · `stopSwTimer` · `resetSw` · `renderLapsUI` · `injectLapIntoTable`(스톱워치) · `executeSave`(저장).
- DOM: `#recOpenProTemplateBtn` · `#recQuickTemplateChips [data-quicktpl]` · `#hubAddProRecBtn` · `#proTable` · `#proTableBody` · `.pro-tpl-cell-input[data-row][data-col]` · `.pro-tpl-row-del[data-delrow]` · `#proAddRowBtn` · `#proAddRowBtn2` · `#proAnalyticsWrap` · `#proTplSelect` · `.pro-tpl-badge` · `#proTrendChartWrap` · `.pro-trend-filter-chip[data-period]` · `#swDisplay` · `#swStartPauseBtn` · `#swResetBtn` · `#swLapBtn` · `#swInjectBtn` · `.pro-sw-mode-chip[data-swmode]` · `.sw-lap-row` · `.sw-lap-inject-btn` · `#proRecMemo` · `#proRecDate` · `#proCancelBtn` · `#proRecBackToHubBtn` · `#proGeneralSaveBtn` · `#proCalendarSaveBtn` · 도구 단추 `#proQuickLoadBtn` · `#proCoachBtn` · `#proNotionExportBtn` · `#proCsvImportBtn` · `#proCsvExportBtn` · `#proWearableSyncBtn` · `#proTplMarketBtn` · `#proVisionOcrBtn` · `#proVoiceInputBtn` · `#proEditColsBtn` · `#proCreateTplBtn` · `#proPhotoPickBtn`.
- 저장 키(게스트): `ourgoal_settings_<게스트 id>`(`saveLocalSettings` — `proTemplateRecords` · `customSchedules`) · `ourgoal_guest_profile`(`saveProfile` — `records`).
- 도구(이 PR 이 더한 것, 전부 `reports/TASK-ES-646/tools/`): `inplace-split.cjs`(변환기) · `verify-inplace.cjs`(대조기) · `control-group.cjs`(대조군) · `build-scenarios.cjs` · `scenario-local.cjs` · `csv-download-probe.cjs` · `module-load.cjs` · `run-tests.cjs` · `measure.cjs` · `build-claims.cjs` · `run-all.sh`.

## 1. [원칙 ①] 문제를 정확히 파악한다

- 인라인 덩어리에 944줄짜리 함수가 하나 남아 있다. 함수 안에 안쪽 함수가 15개 있고, 그 안쪽 함수들과 단추 처리기들이 바깥 함수의 지역 변수(지금 고른 템플릿 · 표의 열 · 표의 행 · 붙인 사진 · 타이머 상태 · 창의 뿌리 요소 …)를 **이름으로 함께 본다**.
- 그래서 ⓐ 조각을 글자 그대로 다른 파일로 옮기면 그 이름들이 닿지 않고 ⓑ 통째로 옮기면 944줄 파일이 돼 법정이 「800줄 상한을 새로 넘김」으로 막는다(`court/lib/new-debt.js`).
- 측정: 정리 전 함수의 지역 이름은 62개다(진입점 스코프 14 + 콜백 스코프 48 — `verify-inplace.json` `closureVariables`). 그 가운데 책임 단위 경계를 넘어 쓰이는 것이 16개, 한 단위 안에서만 쓰이는 것이 46개다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 동작은 한 글자도 바꾸지 않고, 「함께 보던 이름」을 「건네받은 꾸러미」로 바꿔 조각이 서로의 지역을 이름으로 보지 않게 만든다.
- **원인**: 함수 하나가 창 틀 · 표 편집 · 도구 13종 · 차트 · 타이머 · 저장을 모두 품고, 안쪽 함수가 클로저로 상태를 나눠 쓰도록 자라났다.
- **중심**: 경계를 넘는 16개 이름만 꾸러미(`ctx`)로 보내고, 나머지 46개는 각 조각의 지역으로 그대로 둔다 — 바뀌는 글자를 가장 적게 한다. 문의 실행 순서는 그대로다(콜백이 조각을 원래 순서로 부른다).
- **핵심**: 「값이 갈라지지 않는다」를 사람이 믿는 것이 아니라 기계로 보인다 — 꾸러미로 간 값은 읽기·쓰기 **모두** `ctx.` 를 거치고(지역 사본 0), 꾸러미로 안 간 이름은 조각 밖에서 한 번도 쓰이지 않는다.

## 3. [원칙 ③] 해결 방식

### 3.1 나누는 꼴

```
function openProTemplateRecordModal(editRec, initialTplKey, initialDate){
  var ctx = { editRec: editRec, initialDate: initialDate, renderRowsHtml: renderRowsHtml };
  ctx.isNew = …; ctx.allTpls = …; ctx.curTpl = …; ctx.columns = …; ctx.rows = …; ctx.attachedPhoto = …;   // var X = … 였던 줄
  function renderModal(){ … }            // 그 자리 그대로
  function renderRowsHtml(rList, cList){ … }
  openModal(renderModal(), function(sheet){
    ctx.sheet = sheet;
    bindProRecTable(ctx);                // 원래 순서 그대로
    bindProRecTools(ctx);
    ctx.bindRowEvents();                 // 원래 그 자리에 있던 bindRowEvents();
    bindProRecTrendChart(ctx);
    bindProRecStopwatch(ctx);
    bindProRecSave(ctx);
  });
}
function bindProRecTable(ctx){ ctx.syncCurrentRowsFromDOM = syncCurrentRowsFromDOM; …; <원래 줄 그대로> }
function bindProRecTools(ctx){ <원래 줄 그대로> }
function bindProRecTrendChart(ctx){ ctx.updateTrendChart = updateTrendChart; <원래 줄 그대로> }
function bindProRecStopwatch(ctx){ ctx.stopSwTimer = stopSwTimer; <원래 줄 그대로> }
function bindProRecSave(ctx){ <원래 줄 그대로> }
```

| 조각(책임) | 함수 | 줄 수 | 다음 단계의 세포(안) |
|---|---|--:|---|
| 창 틀(머리 · 마크업 · 조립) | `openProTemplateRecordModal` | 153 | 창 틀·표 편집 세포 |
| 표 편집 | `bindProRecTable` | 70 | 〃 |
| 도구 단추 13종 | `bindProRecTools` | 238 | 도구 세포 |
| 성장 추이 차트 | `bindProRecTrendChart` | 47 | 차트 세포 |
| 스톱워치·인터벌 타이머 | `bindProRecStopwatch` | 264 | 타이머 세포 |
| 저장·닫기 | `bindProRecSave` | 187 | 저장 세포(맨 마지막) |

줄 수 출처: `reports/TASK-ES-646/verify-inplace.json` `after.functions`. 가장 긴 것이 264줄이다.

### 3.2 바꾼 글자는 네 가지뿐이다

1. **이름 앞 `ctx.`** — 경계를 넘는 값 9개(`editRec` · `initialDate` · `isNew` · `allTpls` · `curTpl` · `columns` · `rows` · `attachedPhoto` · `sheet`)의 모든 읽기·쓰기, 그리고 경계를 넘어 불리는 안쪽 함수 7개(`renderRowsHtml` · `syncCurrentRowsFromDOM` · `updateAnalyticsBanner` · `refreshTableBody` · `bindRowEvents` · `updateTrendChart` · `stopSwTimer`)를 **주인 조각 밖에서** 부르는 자리. 246곳.
2. **선언 `var X = …` → `ctx.X = …`** — 꾸러미로 간 변수 6개(`isNew` · `allTpls` · `curTpl` · `columns` · `rows` · `attachedPhoto`).
3. **꾸러미를 만드는 문** — `var ctx = {…};` 1줄 · `ctx.sheet = sheet;` 1줄 · 주인 조각 머리의 등록 `ctx.F = F;` 6개(3줄).
4. **조각 함수의 머리 · 닫는 괄호 · 부르는 줄** — 머리 5 · 닫는 줄 5 · 부르는 줄 5.

그 밖에: 조각 사이의 빈 줄 5개를 없앴고, 설명 주석 6개를 더했다(모두 `[#TASK-ES-646]` 표지). 들여쓰기는 그대로 두었다(조각 본문이 6칸 들여쓰기로 남는다 — 줄 단위 차이를 실제로 바뀐 줄로만 두기 위해서다. 정돈은 별도 작업).

### 3.3 바꾸지 않은 것

문구 · 조건 · 문의 순서 · 저장 키 · 서버 호출 · DOM id · 이벤트 연결 방식(`.onclick =` · `addEventListener`) · 타이머 간격(60ms · 1400ms · 200ms) · 예외 처리 흐름 · `async`/`await` 자리. 「마켓」 단추 줄은 접두 둘(`ctx.sheet` · `ctx.initialDate`)이 붙은 것 말고 글자가 같다. 광고·구독·결제 줄을 만들거나 지우지 않았다(그런 줄이 이 함수에 없다).

### 3.4 클로저 변수 표 (전수 62개)

출처: `reports/TASK-ES-646/verify-inplace.json` `closureVariables`(정리 전 index.html 의 스코프 분석 + 정리 후 토큰의 조각 소속). 「읽는 곳」·「바꾸는 곳」의 숫자는 그 조각 안의 횟수다.

| 이름 | 종류 | 선언한 곳 | 읽는 곳(횟수) | 바꾸는 곳(횟수) | 꾸러미 |
|---|---|---|---|---|---|
| `editRec` | 인자 | 진입점 | 진입점 22 · 저장 6 | — | **감** (28곳) |
| `initialTplKey` | 인자 | 진입점 | 진입점 3 | — | 안 감(한 조각 안) |
| `initialDate` | 인자 | 진입점 | 진입점 4 · 도구 1 · 저장 5 | — | **감** (10곳) |
| `isNew` | 변수 | 진입점 | 진입점 1 · 저장 2 | — | **감** (4곳) |
| `allTpls` | 변수 | 진입점 | 진입점 5 · 도구 1 | 도구 1 | **감** (8곳) |
| `curTpl` | 변수 | 진입점 | 진입점 11 · 표 1 · 도구 18 · 차트 1 · 저장 8 | 도구 2 | **감** (42곳) |
| `columns` | 변수 | 진입점 | 진입점 4 · 표 4 · 도구 19 · 스톱워치 7 · 저장 3 | 도구 3 | **감** (41곳) |
| `rows` | 변수 | 진입점 | 진입점 2 · 표 9 · 도구 12 · 저장 2 | 진입점 3 · 표 1 · 도구 5 | **감** (35곳) |
| `defaultDateVal` | 변수 | 진입점 | 진입점 1 | — | 안 감(한 조각 안) |
| `recordDateVal` | 변수 | 진입점 | 진입점 2 | — | 안 감(한 조각 안) |
| `memoVal` | 변수 | 진입점 | 진입점 1 | — | 안 감(한 조각 안) |
| `attachedPhoto` | 변수 | 진입점 | 진입점 2 · 저장 1 | 도구 1 | **감** (5곳) |
| `renderModal` | 안쪽 함수 | 진입점 | 진입점 1 | — | 안 감(한 조각 안) |
| `renderRowsHtml` | 안쪽 함수 | 진입점 | 진입점 1 · 표 1 | — | **감** (1곳) |
| `sheet` | 인자(콜백) | 진입점 | 표 8 · 도구 21 · 차트 2 · 스톱워치 11 · 저장 7 | — | **감** (49곳) |
| `syncCurrentRowsFromDOM` | 안쪽 함수 | 표 | 표 3 · 도구 9 · 스톱워치 2 · 저장 1 | — | **감** (12곳) |
| `updateAnalyticsBanner` | 안쪽 함수 | 표 | 표 2 · 스톱워치 2 | — | **감** (2곳) |
| `refreshTableBody` | 안쪽 함수 | 표 | 표 2 · 도구 8 | — | **감** (8곳) |
| `bindRowEvents` | 안쪽 함수 | 표 | 표 1 · 진입점 1 | — | **감** (1곳) |
| `addNewRow` | 안쪽 함수 | 표 | 표 2 | — | 안 감(한 조각 안) |
| `tableBody` · `addBtn2` | 변수 | 표 | 표 2 · 표 2 | — | 안 감(한 조각 안) |
| `quickLoadBtn` · `coachBtn` · `notionBtn` · `csvImportBtn` · `csvExportBtn` · `wearableBtn` · `marketBtn` · `visionBtn` · `voiceBtn` · `createBtn` · `photoBtn` | 변수 | 도구 | 도구 각 2 | — | 안 감(한 조각 안) |
| `tplSelect` · `fileInp` · `photoPrev` | 변수 | 도구 | 도구 4 · 3 · 1 | — | 안 감(한 조각 안) |
| `curChartPeriod` | 변수 | 차트 | 차트 2 | 차트 1 | 안 감(한 조각 안) |
| `bindChartEvents` | 안쪽 함수 | 차트 | 차트 2 | — | 안 감(한 조각 안) |
| `updateTrendChart` | 안쪽 함수 | 차트 | 도구 2 · 차트 1 | — | **감** (2곳) |
| `swTimerId` · `swRunning` | 변수 | 스톱워치 | 스톱워치 각 2 | 스톱워치 각 2 | 안 감(한 조각 안) |
| `swMode` | 변수 | 스톱워치 | 스톱워치 11 | 스톱워치 1 | 안 감(한 조각 안) |
| `swTargetMs` · `swElapsedMs` · `swLastTick` | 변수 | 스톱워치 | 스톱워치 5 · 7 · 1 | 스톱워치 5 · 3 · 2 | 안 감(한 조각 안) |
| `swLaps` · `lastFocusedCell` | 변수 | 스톱워치 | 스톱워치 8 · 6 | 스톱워치 각 1 | 안 감(한 조각 안) |
| `swDisplay` · `swStartPauseBtn` · `swResetBtn` · `swLapBtn` · `swInjectBtn` · `swLapsList` · `swModeChips` | 변수 | 스톱워치 | 스톱워치 4 · 5 · 2 · 2 · 2 · 10 · 2 | — | 안 감(한 조각 안) |
| `updateSwDisplay` · `resetSw` · `renderLapsUI` · `injectLapIntoTable` | 안쪽 함수 | 스톱워치 | 스톱워치 3 · 2 · 1 · 1 | — | 안 감(한 조각 안) |
| `stopSwTimer` | 안쪽 함수 | 스톱워치 | 스톱워치 3 · 저장 4 | — | **감** (4곳) |
| `executeSave` | 안쪽 함수 | 저장 | 저장 2 | — | 안 감(한 조각 안) |
| `backBtn` · `cancelBtn` | 변수 | 저장 | 저장 각 2 | — | 안 감(한 조각 안) |

- 꾸러미 구성원 16개(값 9 + 함수 7). 값을 넣는 자리는 이름마다 정확히 하나다(`verify-inplace.json` `ctx.providedBy`): `editRec` · `initialDate` · `renderRowsHtml` = 꾸러미 만드는 문, `sheet` = 콜백 첫 문, 변수 6개 = 바뀐 선언, 함수 6개 = 주인 조각 머리의 등록.
- 인자 `editRec` · `initialDate` · `sheet` 와 `isNew` 는 어디서도 다시 대입되지 않는다(위 표 「바꾸는 곳」 —). 꾸러미에 담긴 것은 같은 값(같은 객체)이다.
- 안쪽 함수를 `ctx.F()` 로 부르면 `this` 가 꾸러미가 된다. 이 함수 전체에 `this` · `arguments` 가 0 이라(변환기가 있으면 멈춘다) 영향이 없다.
- 다른 조각이 부르는 것은 전부 단추를 누른 뒤(이벤트 때)다. 조립 중에 부르는 것은 `ctx.bindRowEvents()` 하나이고 그때 표 조각은 이미 등록을 마쳤다.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **지역 사본 사고(한쪽에서 바꾼 값을 다른 쪽이 못 봄)** → 꾸러미로 간 값은 맨이름으로 한 번도 읽히지 않는다. 대조기 (a')가 「붙어야 하는 자리 469곳」을 정리 전 스코프 분석으로 따로 계산해 실제와 맞댄다(어긋남 0). 대조군 M7(조각 안에 `var rows = ctx.rows;` 를 만들어 읽음)을 대조기가 잡는다.
- **속성 이름에 접두가 붙는 사고**(L020 의 `empty-L.state` 꼴) → `prev.rows` · `editRec.columns` · `columns: columns` 의 왼쪽 같은 자리는 스코프 분석상 참조가 아니라 건드리지 않는다. 대조군 M2 가 잡는다. 문자열 · 주석 안 글자는 토큰 원문 비교로 같음을 본다(M4 · M8).
- **조각 경계를 넘는 맨이름**(다른 조각의 지역을 이름으로 부름 → 그 순간 ReferenceError) → 대조기 (b) 새 함수 여섯의 「함수 밖 이름」을 모아 정리 전 지역 이름 62개와 겹치는 것 0. 창을 여는 콜백의 예외는 `openModal` 이 삼켜 콘솔에만 찍으므로(`js/core/modal-open.js` `try { finalOnMount(sheet); } catch(mErr){ console.error(…) }`) 화면 시나리오의 예외 0 만으로는 부족하다 — 그래서 정적 분석을 중심 증거로 두고, 시나리오 대조에는 콘솔 오류 목록도 넣었다.
- **실행 순서** → 대조기 (a)는 콜백의 부르는 줄을 조각 본문으로 되돌려 한 줄로 편 뒤 정리 전 토큰열과 맞댄다. 순서가 하나라도 바뀌면 불일치다(대조군 M3 · M6).
- **끌어올림** → 안쪽 함수 선언은 조각 함수 안에서도 끌어올려진다. 정리 전에 「선언보다 먼저 읽어 undefined 에 기대던」 콜백 지역은 없다(모두 처리기 안에서만 읽는다). 조각으로 갈린 뒤 다른 조각의 `var` 를 읽는 자리는 (b)에서 0.
- **저장 경로(GUARD_03)** → `executeSave` 토큰 1,252개가 접두 28곳 말고 같고, 호출 67개의 순서가 같다(`verify-inplace.json` `save`): 타이머 정지 → 표 읽기 → 기록 객체 만들기 → (일정 연동) → `saveLocalSettings`(기기 즉시 저장) → `syncRecordToMatchingGoals` → 화면 갱신 넷 → 창 닫기/허브 → `await saveProfile()` → Notion 자동 전송 → 토스트 · 색종이 → (새 기록이면) AI 피드백. 실패 처리(`.catch`)도 그대로다. 대조군 M13(저장 문 하나 빠짐)을 잡는다.
- **화면 대조에서 뺀 것과 사유**(`scenario-local.json` `normalize`): 난수 ID(기록 · 게스트 · 기기 · 일정 · 랩 · 템플릿 키 — 같은 값은 같은 번호로 바꿔 일대일 대응을 남김, L053) · 시각(값과 동일성 모두 제외) · 마니또 씨앗 값(`"seed":N`) · 색종이 조각(위치가 난수이고 뿌린 뒤 스스로 사라져 갈무리 시점에 따라 있기도 없기도 하다 — 조각 요소를 통째로 제외) · 돌아가는 스톱워치 표시와 돌아가는 중에 찍은 랩 시간 · 그 랩 토스트 글자의 시간 · 저장한 기록·일정 옆에 찍히는 지금 시각(시:분만 든 글자 마디 — 실행이 분 경계를 넘으면 갈린다) · 토스트 보임 표시(L077) · 콘솔 오류의 개수(종류로만 비교 — 법정 실행기는 외부 통신을 막고 돌리는데 막힌 실시간 연결의 재시도 횟수가 실행 시간에 따라 3번 · 4번으로 갈린다) · 인라인 `<script>` 요소의 소스 글자(이번 변경 그 자체) · 설정 탭의 「약 N KB 사용 중 (브라우저 추정치)」(index.html 이 약 3 KB 커져 달라진다 — 동작이 아니라 파일 크기의 반영).
- **시험이 함수 글자를 붙잡는가** → `git grep -n "openProTemplateRecordModal\|executeSave\|renderRowsHtml" -- tests scripts` 는 `scripts/smoke-test.js` 두 줄(`html.includes('openProTemplateRecordModal')`)뿐이고 이름은 그대로다. 시험 파일 119개를 하나씩 돌린 종료 코드·ok 줄 수가 기준과 모두 같다. 깨진 시험 0 · 시험 변경 0.
- **800줄** → 조각을 책임 단위로 나눴고 줄 수로 자르지 않았다(`-part1` 없음). 다음 단계에서 세포 파일이 되어도 가장 긴 조각이 264줄이다.

## 5. [원칙 ⑤] 절차

1. 새 작업 폴더(origin/main) · 번호 선점 · `npm ci --ignore-scripts` · 기준 작업 폴더(분리 HEAD).
2. **1단계 도달 실측** — 법정 실행기(`court/lib/scenario.js`)를 읽기만 써서 기준 트리에서 게스트로 창이 열리는지, 어떤 조작이 닿는지 쟀다(8절 표).
3. **시나리오 12개** 작성 → 기준 트리 2회에서 흔들리지 않음을 확인(`stage1-base-stability.json`). 저장 · 핵심 경로가 게스트로 닿으므로 2단계로 갔다.
4. **2단계** — 변환기(`inplace-split.cjs`)로 나눔 → 대조기 · 대조군 → 모듈 가드 `--update --reason` → 측정 한 벌(`run-all.sh`).
5. main 이 움직일 때마다: index.html 을 main 판으로 되돌리고 변환기를 다시 돌린 뒤 측정 한 벌을 다시 돌린다(L010 과 같은 방식 — 손으로 충돌을 풀지 않는다).
6. 서류 → `verify-integrity-gate.js` → `npm test` → 커밋 → 로컬 법정 전체 실행 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「대조기도 작업자가 만들었으니 자기 채점이다. 변환기가 틀리면 대조기도 같이 틀린다」** → 대조기는 변환기의 분류를 읽지 않는다. 정리 전 · 후 두 파일만 받아 토큰을 스스로 맞대고, 「어디에 접두가 붙어야 하는가」를 정리 전 스코프 분석으로 따로 계산한다. 그리고 대조기가 가짜로 통과하지 않음을 대조군 14개(접두 빠짐 · 속성에 접두 · 문 순서 · 문구 · 등록 빠짐 · 조각 순서 · 지역 사본 · 주석 · 조건 · 함수 밖 글자 · 필요 없는 접두 · 타이머 간격 · 저장 문 빠짐 · 새 최상위 함수)로 쟀다 — 전부 잡았고 망가뜨리지 않은 사본은 통과했다(L084). 그래도 이것은 작업자 측정이다. 그래서 화면 시나리오 12개를 법정이 기준 · 작업 양쪽에서 직접 돌리게 주장으로 걸었다.
- **반론 2 「게스트 화면이 닿지 않는 부분은 같다는 보증이 없다」** → 맞다, 화면으로는 말하지 않는다. 닿지 않는 것(로그인 뒤 서버 동기화 · 사진 첨부 · 음성 인식)은 법정 도구 한계 사유로 「확인 못 함」 주장을 냈고, 지시로 실행하지 않은 것(스마트워치 선택 · 마켓 복제 · Notion 전송 · AI 코치 적용)과 기준에서도 죽는 것(툴팁 · 기록 2건 상태)은 「범위 밖 보고」에 적었다. 그 부분의 동일성은 토큰열 대조로만 말한다 — 토큰열이 접두 말고 같고 접두가 붙은 값이 같은 값이면, 닿지 않는 가지도 같은 글자를 같은 값으로 돈다.
- **주장의 `change` 칸을 무엇으로 걸었나(선택과 근거)** → `new` 로 걸었다. ⓐ 법정 설명서 4절은 화면 동작 주장에 `change`(`fix`·`new`)를 적게 하고 「고치기 전에도 통과하면 법정은 『고칠 게 없었음』으로 판정한다(위반은 아니다)」라고 적는다(`court/README.md`). ⓑ 동작 0 변경 선례가 모두 그 꼴이다 — `reports/TASK-ES-461/claims.json` · `reports/TASK-ES-466/claims.json` · `reports/TASK-ES-474/claims.json` · `reports/TASK-ES-476/claims.json` 의 화면 주장이 `kind: behavior` · `change: new` · 문장 「옮긴 뒤에도 …」이고, 그 PR 들이 「확인 부족 — 고칠 게 없었음」으로 병합됐다(경험칙 L005). ⓒ `preserve` 는 생성기 설정(proof)을 다시 돌려 바이트를 맞대는 길이다(`court/claims.js` — 시나리오를 기준 2회 · 작업 1회 돌린 뒤 proof 가 없으면 「확인 부족(분열 증거 검증 미달): 증명 파일 지정 누락」). 지시함 DIR-004 (라)가 이 단계를 「생성기 바이트 대조(동작 보존 확인)의 대상이 아니다」라고 적었으므로 그 길에 올리지 않았다. ⓓ `new` 는 「새 동작을 만들었다」는 뜻으로 읽힐 수 있어, 주장 문장마다 「정리한 뒤에도 … 제자리 정리 전후가 같다」고 적고 주장 파일의 범위 밖 보고 첫 줄에 이 사정을 적었다. 두 배치 모두 법정이 시나리오를 기준 · 작업 양쪽에서 실제로 돌린다. **법정이 다시 재지 않는 것**: 「글자가 같다」(토큰열 대조) — 이것은 작업자 대조기와 병합 전 독립 검토에 기댄다.
- **재검증**: 첫 스톱워치 시나리오는 「행을 추가한 뒤 기입하면 비어 있는 첫 시간 칸에 들어간다」고 기대했는데 기준에서 실패했다 — 행 추가가 새 행의 둘째 칸에 초점을 주어 그 칸이 대상이 되기 때문이다(9절 발견 6). 기대를 기준의 실제 동작에 맞췄고(행 삭제 뒤에는 초점 칸이 없어 첫 빈 시간 칸에 들어간다), 버그로 보이는 것은 고치지 않고 적었다.
- **재검증**: 화면 대조 첫 실행에서 모든 단계의 화면이 달랐다. 원인은 둘이었다 — 화면 HTML 에 인라인 스크립트의 소스 글자가 들어 있었고(이번 변경 그 자체), 설정 탭의 저장 용량 추정치가 파일 크기를 따라 3 KB 달랐다. 둘을 사유와 함께 비교에서 뺀 뒤 차이가 0 이 됐다. 뺀 것을 숨기지 않고 4절과 결과 파일에 적었다.
- **재검증**: 60초 인터벌 시나리오에서 돌아가는 시계의 0.1초 자리가 기준 두 번은 우연히 같고 작업만 달라 차이 1로 나왔다. 돌아가는 표시를 비교에서 빼고(멈춘 값은 시나리오 단언이 직접 잰다) 다시 쟀다.
- **재검증**: 측정 한 벌을 다시 돌렸을 때 차이가 11칸 나왔다(스톱워치 시나리오의 화면·토스트 10칸, 일정 저장 시나리오의 화면 1칸). 갈무리를 남겨 다시 돌려 보니 하나는 색종이 조각이 기준에는 남아 있고 작업에서는 이미 사라진 것이었고(같은 칸이 앞선 실행에서는 기준 두 번 사이에서 갈렸다), 나머지는 돌아가는 중에 찍은 랩의 토스트 글자 「랩 1 (00:00.9) 기록!」의 0.1초 자리였다(그 토스트가 화면 HTML 에 남는 다섯 단계와 정확히 겹친다). 두 가지를 사유와 함께 비교에서 빼고 전체를 다시 쟀다. 기준 두 번이 우연히 같으면 시점 흔들림이 「차이」로 보일 수 있다는 것이 이 대조 방식의 한계다 — 그래서 차이가 나오면 갈무리로 글자를 직접 확인했다.
- **재검증**: 그 다음 측정에서도 차이가 4칸 나왔다(저장 시나리오 둘의 화면). 갈무리로 보니 저장한 기록 옆에 찍히는 지금 시각이 기준 두 번은 14:37, 다음 실행은 14:38 이었다 — 실행이 분 경계를 넘은 것이다. 시:분만 든 글자 마디를 비교에서 빼고 전체를 다시 쟀다(7절 표가 그 결과다).
- **재검증**: 그 다음 측정에서도 차이가 2칸 나왔다. 하나는 콘솔 오류 목록이었다 — 막힌 실시간 연결 주소의 같은 오류가 기준 3번 · 작업 4번(재시도 횟수, 그 실행이 0.2초 길었다). 다른 하나는 또 색종이였다(조각을 「없앤」 것이 아니라 표지 글자로 「바꿔」 놓아 있고 없음이 여전히 드러났다 — 도구의 실수). 콘솔 오류는 종류로 비교하게 하고 조각은 통째로 없애게 고친 뒤 다시 쟀다.
- **재검증**: 첫 커밋을 커밋 훅이 막았다(`HARDCODED_SECRET` — 결과 파일에 실린 콘솔 오류 글자 속 실시간 연결 주소의 공개 키 토큰). 훅을 우회하지 않고 실행기가 토큰 꼴 글자를 「«토큰 가림»」으로 바꿔 적게 고친 뒤 결과 파일을 다시 만들었다.
- **재검증**: 도구를 고치다 Git Bash heredoc 이 역슬래시를 반으로 접어 정규식이 깨진 적이 두 번 있었다(정규화가 듣지 않아 「기준끼리 다름」이 1,057칸으로 늘어 바로 드러났다). 그 줄은 Edit 도구로 다시 썼고 `node --check` 로 확인했다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-646/` 아래, 작업자 측정이다. 숫자의 정본은 각 파일이다.

<!-- measure:begin (reports/TASK-ES-646/tools/render-docs.cjs 가 쓴다 — 손으로 고치지 않는다) -->
기준 ed20750c · 측정 2026-10-11T06:34:33.727Z

| 산출물 | 무엇을 쟀나 | 결과 |
|---|---|---|
| `inplace-split-meta.json` | 변환기가 한 일 | 정리 전 3311~4254행 944줄 → 함수 여섯(`openProTemplateRecordModal` 153줄 · `bindProRecTable` 70줄 · `bindProRecTools` 238줄 · `bindProRecTrendChart` 47줄 · `bindProRecStopwatch` 264줄 · `bindProRecSave` 187줄) · 가장 긴 것 264줄 · 고친 자리 200(읽기) + 16(쓰기) + 30(다른 조각의 함수 호출) + 6(선언) · 없앤 빈 줄 5 |
| `verify-inplace.json` | (a) 토큰열 (a′) 접두 기대 (b) 스코프 (c) 꾸러미 빠짐 (d) 저장 경로 · 함수 밖 글자 | `ok: true` · 토큰 6739개 대 7237개(편 것) — 허용 밖 차이 **0** · 접두 246곳 · 선언 바꿈 6 · 더한 코드 토큰 119 · 주석 25개 같음(더한 주석 6) · 접두 기대 469곳 중 어긋남 **0** · 경계를 넘는 맨이름 **0** · 새 바깥 의존은 조각 함수 이름 5개뿐 · 최상위 this/arguments 0 · 저장 경로 토큰 1252개 같음(접두 28곳) · 호출 67개 순서 같음 · 함수 밖 글자 같음 true |
| `control-group.json` | 대조기가 가짜로 통과하지 않는가(일부러 망가뜨린 사본) | 망가뜨린 사본 14개 중 잡은 것 **14** · 놓친 것 0 · 망가뜨리지 않은 사본 통과 true |
| `scenarios/*.json`(12개) · `scenario-local.json` | 게스트 화면 시나리오 기준 2회 · 작업 1회(s01 · s02 · s03 · s04 · s05 · s06 · s07 · s08 · s09 · s10 · s11 · s12) + 단계별 화면 · 저장값 · 토스트 · 단계 결과 대조 | 전부 통과 true · 행동 변화 단언 있음 true · 기준 2회 일치 true · 맞댄 칸 5482 중 같은 칸 5482 · 차이 **0** · 기준끼리 달라 뺀 칸 0 · 예외 0 |
| `stage1-base-stability.json` | 1단계: 시나리오가 기준 트리 2회에서 흔들리지 않는가 | 시나리오 12개 · 전부 통과 true · 기준 2회 일치 true · 맞댄 칸 5481 중 같은 칸 5481 · 기준끼리 달라 뺀 칸 1 · 예외 0 |
| `csv-download.json` | 「CSV 다운로드」 단추가 만든 파일(진짜 마우스 입력, 내려받은 파일을 읽음) | 파일 생김 기준 true · 작업 true · 이름·바이트 같음 **true**(273 바이트) |
| `cell-registry-compare.base.json` · `cell-registry-compare.json` · `name-fingerprints.json` | 통로 · window 이름의 값 지문(기준 이름 목록 고정) | 통로 431개 중 달라진 것 1(`openProTemplateRecordModal` — 본문을 고친 그 함수, 종류·이름·인자 수 같음 true) · 그 밖 0 · 사라진 이름 0 · 생긴 이름 0 · window 17개 차이 0 |
| `module-load.json` | 법정 모듈 로드 탐침 기준 대 작업 | 회귀 [](82/83 대 기준 82/83) |
| `raw/npm-test.{base,work}.{log,exit}` · `npm-test-compare.json` | npm test 전경 실행 | 종료 코드 0 · 0 · ✓ 줄 487 · 487 · ok 줄 196 · 196 · 검사 줄 글자 같음 true |
| `tests-all-compare.json` | 시험 파일 119개를 하나씩 실행 | 기준과 다른 파일 **0** (종료 코드가 0 이 아닌 파일은 기준 26 · 작업 26 — 같은 파일, 이 PR 과 무관한 기존 상태) |
| `measurement.json` | 지표 · 바뀐 파일 | 인라인 스크립트 줄 수 2311 → 2326(**+15**) · index.html 함수 선언 수 17 → 22(**+5**) · window 대입 75 → 75 · index.html +204 −189 · 바뀐 제품 파일 ["index.html"] · js 0 · 시험 0 · 금고 0 · 생성기 0 · 생성 지도 0 · 모듈 가드 종료 코드 0 · 기준선 사유 기록 true |
| `court-local.json` | 로컬 법정 전체 실행(작업자 PC 예비 점검 — 판정 아님) | 판정 줄 「확인 부족」 · 작업자가 적어 낸 지시 항목 12건 중 9건은 필요한 수준까지 확인하지 못했습니다 · 종료 코드 3 · 끝까지 돌았는가 true |
<!-- measure:end -->

### 7.1 재현 방법 (독립 검토용 — 한 줄씩)

준비: 기준 트리 = 이 PR 의 merge-base(측정 때 `ed20750c`)를 분리 HEAD 로 꺼낸 작업 폴더(예 `git worktree add --detach <기준> ed20750c`), 작업 트리 = 이 브랜치. 작업 트리에서 `npm ci --ignore-scripts` 뒤 `export NODE_PATH=<작업 트리>/node_modules`. 아래는 전부 작업 트리에서 돌린다. Chrome 과 Node 22 이상이 필요하다.

| 무엇 | 명령 | 기대 출력 |
|---|---|---|
| 정리 전후 대조(토큰열 · 접두 기대 · 스코프 · 꾸러미 · 저장 경로) | `node reports/TASK-ES-646/tools/verify-inplace.cjs <기준>/index.html index.html <임시>/verify.json` | 종료 코드 0 · `"ok": true` · `"problems": []` · `tokens.old 6739` · `prefix 246` · `expect.mismatches 0` · `scope.leaks 0` · `save.tokensSame true` · `save.sameOrder true` · `restSame true` |
| 대조군(대조기가 가짜로 통과하지 않는가) | `node reports/TASK-ES-646/tools/control-group.cjs <기준>/index.html index.html <임시>/control.json` | 종료 코드 0 · M0 「통과」 · M1~M14 「잡음」 · 마지막 줄 `"caught":14,"missed":[]` |
| 변환기 재실행(같은 결과가 나오는가) | `node reports/TASK-ES-646/tools/inplace-split.cjs <기준> --out <임시>/index.html` 뒤 `git diff --no-index <임시>/index.html index.html` (줄 끝은 `-c core.autocrlf=false` 로 꺼낸 기준이면 LF) | 차이 0(줄 끝 차이 제외) |
| 저장 경로만 눈으로 | `git diff -U0 <merge-base> -- index.html` 에서 `async function executeSave` 부터 닫는 괄호까지 | 바뀐 줄은 `ctx.` 가 붙은 줄뿐(`stopSwTimer` · `syncCurrentRowsFromDOM` · `sheet` · `rows` · `editRec` · `curTpl` · `columns` · `attachedPhoto` · `isNew` · `initialDate`) |
| 시나리오 12개 기준 2회 · 작업 1회 + 단계별 화면 · 저장값 대조 | `node reports/TASK-ES-646/tools/scenario-local.cjs <기준> . <임시>/scenario.json reports/TASK-ES-646/scenarios/*.json` (약 8분) | 시나리오마다 `"base":true,"base2":true,"work":true` · 마지막 줄 `"allPassed":true,"allProveBehavior":true,"baseRunsAgree":true,…,"diffs":0,…,"exceptions":0` (`ignored` 는 실행마다 조금 다르다 — 기준끼리 달라 뺀 칸) |
| 차이가 나오면 글자 확인 | 위 명령에 `--dump <저장소 밖 폴더>` 를 `<임시>/scenario.json` 뒤에 넣는다 | `<폴더>/<시나리오>/{base,base2,work}/NN.dom.html` 을 맞대 본다 |
| CSV 내려받기 파일 | `node reports/TASK-ES-646/tools/csv-download-probe.cjs <기준> . <임시>/csv.json` | `"created":{"base":true,"work":true},"same":true` |
| npm test · 시험 파일 전부 · 지문 · 모듈 로드까지 한 벌 | `sh reports/TASK-ES-646/tools/run-all.sh <기준> <저장소 밖 임시 폴더>` (약 20분 — 이 파일이 CRLF 줄 끝으로 꺼내졌으면 `tr -d '\r' < reports/TASK-ES-646/tools/run-all.sh > <임시>/run-all.sh` 로 줄 끝을 고친 사본을 작업 트리에서 돌린다) | 단계마다 한 줄, 마지막 `staticMismatch 0` |
| 발견 1 재현(같은 템플릿 기록 2건이면 창이 안 열림 — **기준에서도**) | 9절 1번의 절차 | 세 번째로 여는 단추를 눌러도 `#proTable` 이 보이지 않고 콘솔에 `ReferenceError: val is not defined` |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

### 8.1 도달 실측(1단계) — 게스트(`#btnLandingPreviewDirect`)로 기준 트리에서

| 조작 | 닿는가 | 근거 |
|---|---|---|
| 창 열기 — 기록 탭 「📋 템플릿」 독 단추로 카드 펼침 → `#recOpenProTemplateBtn` | 닿음 | s01 |
| 창 열기 — 빠른 칩 `[data-quicktpl]`(처음 고른 템플릿) | 닿음 | s01 |
| 창 열기 — 일정 탭 `#calOpenHubBtn` → 날짜 허브 `#hubAddProRecBtn`(날짜를 받아 열림) | 닿음 | s02 |
| 닫기 — 취소 · 돌아가기 · 저장 뒤 허브 복귀 | 닿음 | s01 · s02 |
| 행 추가 · 칸 입력(분석 띠 갱신) · 행 삭제 · 마지막 행 비우기 | 닿음 | s03 |
| 템플릿 변경 | 닿음 | s04 · s08 |
| 도구 창 열기 9종(AI 코치 · Notion · CSV 가져오기 · 스마트워치 · 마켓 · AI 사진 인식 · 음성 입력 · 표 속성 편집 · 새 템플릿) | 닿음 | s05 · s06 |
| CSV 「반영」 · 표 속성 「표에 적용」 · 새 템플릿 저장(콜백이 돈다) | 닿음 | s05 · s06 |
| 지난 루틴 불러오기(저장한 기록이 있을 때) | 닿음 | s07 |
| 차트 기간 칩 | 닿음 | s08 |
| 스톱워치 시작 · 랩 · 정지 · 리셋 · 모드 · 랩 기입 · 표에 시간 기입 · 60초 뒤 스스로 멈춤 | 닿음 | s09 · s12 |
| 일반저장 · 수정 저장 · 일정연동저장 · 같은 일정 갱신 · 새로 고침 뒤 유지 | 닿음 | s10 · s11 |
| CSV 내려받기(파일 생성) | 닿음(시나리오 어휘 밖 → 탐침) | `csv-download.json` |
| 차트 점 설명(툴팁) | **안 닿음** | 기준에서도 보이지 않는다(9절 발견 2) — 점을 진짜 마우스로 눌러도 `#trendTooltip` 보임 0 |
| 같은 템플릿 기록 2건 이상인 상태에서 창 열기 | **안 닿음** | 기준에서도 예외로 창이 안 열린다(9절 발견 1) |
| 사진 첨부(`#proPhotoPickBtn` → 파일 고르기) | 안 닿음 | 파일 고르는 창(법정 도구 한계 file-attach) |
| AI 사진 인식 분석 · 음성 인식 | 안 닿음 | 파일 · 마이크와 서버 호출이 필요 |
| 로그인 뒤 서버 동기화 · 구글 캘린더 자동 동기화 · Notion 자동 전송 | 안 닿음 | 게스트는 설정이 꺼져 있고 로그인이 필요(needs-login) |
| 스마트워치 세션 「선택」 · 마켓 복제 · Notion 전송 · AI 코치 적용 | 재지 않음 | 지시: 바깥으로 나가거나 크레딧·결제에 닿을 수 있는 실행은 하지 않는다 |
| 새 기록 저장 뒤 AI 피드백 응답 처리 | 재지 않음 | 외부 통신을 막고 돌린다(요청은 정리 전과 같이 자동으로 시작된다) |

### 8.2 막힐 지점 · 남은 것

- **법정 판정(예상)**: 화면 동작 주장 12건은 기준에서도 통과하므로 법정은 「고칠 게 없었음」을 낼 것이다 — 「이 작업이 화면 동작을 바꾸지 않았다」는 뜻이고, 동작 0 변경 PR 의 정상 판정이다(L005). 그래서 전체 판정은 「통과」가 아니라 「확인 부족」이 예상되며, 부족 목록은 「고칠 게 없었음」(R1~R6)과 법정 도구 한계(R10~R12)뿐이어야 한다. 다른 사유가 나오면 고친다. 실제 로컬 법정 결과는 `court-local.json` 에 적는다. 법정은 「글자가 같다」를 다시 재지 않는다 — 그 부분은 작업자 측정과 병합 전 독립 검토 몫이다. 병합 판단은 오케스트레이터 · 상민님 몫이다.
- **main 이 움직임**: 다른 빌더가 index.html 의 다른 구간을 계속 고친다. 이 함수 구간이 충돌하면 5절 5번대로 다시 돌린다.
- **측정불가(화면)**: 8.1 표의 「안 닿음」·「재지 않음」.
- **성과 측정**: 이 PR 은 줄을 줄이지 않는다 — 일시적으로 인라인 줄 수와 함수 선언 수가 는다(7절). 성과는 「다음 PR 에서 생성기가 이 여섯 함수를 글자 그대로 옮길 수 있게 됨」이고, 그 뒤 인라인 줄 수가 이 함수 몫만큼 줄어드는 것으로 잰다.
- **PLAN 체크리스트**: [4단계: 심사 청구]까지만 기록한다(`.claude/plan-TASK-ES-646.md`).

## 9. 발견한 것 (고치지 않았다 — 정리는 고치기가 아니다)

1. **[큼] 같은 템플릿으로 저장한 기록이 2건 이상이면 전문 템플릿 기록 창이 열리지 않는다.** `js/tabs/records/table-analytics-engine.js` 249행 `val = parseFloat(…)` 에서 `val` 을 선언한 적이 없고 파일이 `'use strict'` 라 `ReferenceError: val is not defined` 가 난다(추이 차트 계산 `computeTrendChartData` 의 「기록 2건 이상」 가지). 기준 트리에서 게스트로 실측: 헬스 기록을 두 번 일반저장한 뒤 여는 단추를 누르면 창이 뜨지 않고 예외 2건. 이 함수 밖이라 손대지 않았다. 안전망 시나리오는 이 상태를 피하도록(템플릿마다 기록 1건) 짰다.
   - **재현 절차(게스트, main 그대로)**: ① 앱을 열고 「로그인 없이 둘러보기」(`#btnLandingPreviewDirect`) → 인사 창 닫기 ② 아래 탭 「기록/통계」 ③ 빠른 단추 줄의 「📋 템플릿」을 눌러 카드를 펼치고 카드의 여는 단추(`#recOpenProTemplateBtn`)를 누른다 → 창이 열린다 ④ 「일반저장」 ⑤ 다시 여는 단추 → 창이 열린다 → 「일반저장」(헬스 기록이 2건이 된다) ⑥ 다시 여는 단추를 누른다 → **창이 열리지 않는다**. 콘솔: `ReferenceError: val is not defined` (`js/tabs/records/table-analytics-engine.js` 249행). 법정 실행기로 잰 단계 결과: 23번째 단계(세 번째 여는 단추 클릭)까지 통과, 24번째 「`#proTable` 이 보여야 함」에서 보이는 요소 0개, 행동 뒤 예외 2건(두 번째 저장 직후 화면 갱신 때 1건 · 여는 단추 때 1건으로 보인다 — 어느 호출에서 났는지는 나눠 재지 않았다).
   - 영향 범위(코드 읽기, 화면으로는 위 한 길만 쟀다): `computeTrendChartData` 를 부르는 곳은 이 창(`renderModal` · `updateTrendChart`)과 기록 상세 창(`js/tabs/records/template-record-detail.js`)이다.
2. **성장 추이 차트의 점 설명(툴팁)이 보이지 않는다.** `ui.css` 1010~1011행은 `.trend-tooltip{opacity:0}` · `.trend-tooltip.show{opacity:1}` 인데, 처리기(`bindChartEvents`)는 `tip.style.display = 'block'` 만 하고 `show` 를 붙이지 않는다. 기준에서 점을 눌러도 보임 0.
3. **도구 창이 기록 창을 덮어써 입력하던 표가 사라진다.** 공용 창은 하나뿐이라(`js/core/modal-open.js` `sheet.innerHTML = finalHtml`) AI 코치 · Notion · CSV 가져오기 · 스마트워치 · 마켓 · AI 사진 인식 · 음성 입력 · 표 속성 편집 · 새 템플릿을 누르면 기록 창이 그 창으로 바뀐다. 「반영」·「표에 적용」을 누르면 창이 닫히고 콜백은 이미 없는 표를 찾다 그냥 돌아오는데, 「CSV 표 데이터 N개 행을 성공적으로 가져왔어요!」 같은 성공 토스트는 뜬다(기준 화면 갈무리로 확인). 사용자가 넣던 값과 가져온 값이 모두 사라진다.
4. **`#proCancelBtn` 처리기를 두 번 단다.** 앞의 것(`stopSwTimer(); closeModal();`)은 뒤의 것에 덮여 한 번도 돌지 않는다(죽은 코드).
5. **`executeSave` 안에서 `var summaryText` 를 두 번 선언한다.** 동작은 같지만 뒤의 대입이 앞의 값을 덮는다(읽기 헷갈림).
6. **행을 추가한 직후 랩 「기입」·「표에 시간 기입」을 누르면 시간이 새 행의 둘째 칸(종목 칸)에 들어간다.** `addNewRow` 가 새 행 둘째 칸에 초점을 주고, 초점 추적이 그 칸을 「누른 칸」으로 기억하기 때문이다(코드 읽기 + 기준에서 시간 칸이 비어 있음을 실측).
7. **스톱워치 단추 글자가 처음에는 「시작」, 한 번 멈춘 뒤에는 「▶ 시작」이다**(`renderStopwatchWidgetHtml` 과 `stopSwTimer` 의 글자가 다르다).
8. **기록 탭 템플릿 카드의 창 여는 단추(`#recOpenProTemplateBtn`) 글자가 「닫기」다**(`index.html` 마크업 — 누르면 창이 열린다).
9. (이 함수 밖 · 결심 후보) 기록이 2건 미만이면 추이 차트가 「(초기 시뮬레이션)」이라는 만든 값으로 그려진다(`computeTrendChartData` `isSample` — L030 허상지표 후보). 스마트워치 창은 코드에 박힌 예시 세션 3건을 「자동 매핑」한다(`js/tabs/records/table-csv-sync.js` `sampleActivities` — L031 후보). CSV 내려받기의 줄 끝이 `\r\r\n` 이다(같은 파일 `downloadTableAsCsv`).

## 10. 3단계(조각별 세포 이전)에 넘기는 메모

- 옮길 최상위 함수는 여섯이다: `openProTemplateRecordModal` · `bindProRecTable` · `bindProRecTools` · `bindProRecTrendChart` · `bindProRecStopwatch` · `bindProRecSave`. 모두 함수 선언이고 최상위 this/arguments 가 0, 가장 긴 것이 264줄이다. 생성기 설정에서는 이름(`take.names`)으로 고른다.
- 조각끼리는 `ctx` 로만 값을 주고받는다. 서로를 이름으로 부르는 곳은 진입점이 조각 다섯을 부르는 다섯 줄뿐이다 — 조각을 다른 세포로 옮기면 그 다섯 줄만 `L.bindProRec…` 가 되고(생성기가 getter 를 단다, L093), 진입점이 덩어리에 남아 있는 동안은 IIFE 머리 가져오기 줄로 닿는다.
- 권장 순서: 차트 → 타이머 → 도구 → 표 편집+창 틀 → **저장(맨 마지막)**. 저장 조각을 옮기는 PR 은 s10 · s11(저장 → 다시 열기 → 새로 고침)을 다시 건다.
- 「마켓」 단추의 콜백이 `openProTemplateRecordModal` 을 다시 부른다(도구 조각 안). 도구 조각을 진입점보다 먼저 옮기면 그 호출이 `L.openProTemplateRecordModal` 이 된다(통로 getter 가 이미 있다).
- 이 함수들이 읽는 덩어리 이름(상태 `state` · `XP_RULES`, 함수 `toast` · `openModal` · `closeModal` · `saveProfile` · `renderRecordsScreen` …)은 `verify-inplace.json` 에서 센 「함수 밖 이름」이다. 대부분 통로에 이미 있다 — 없는 것은 생성기가 getter 를 단다.
- 들여쓰기: 조각 본문이 6칸으로 남아 있다. 옮긴 뒤 세포 파일에서 정돈하려면 별도 작업으로 한다(옮기기 PR 에서는 글자 그대로).
- 이 PR 의 시나리오 12개(`reports/TASK-ES-646/scenarios/`)와 조립기 · 실행기는 3단계에서 그대로 다시 쓸 수 있다. 기록 2건 상태(9절 1)는 피해야 한다.
- 변환기 · 대조기는 이 함수 전용이다. 다른 큰 함수에 쓰려면 경계 표지 문과 기대 목록(DATA · FUNCS)을 그 함수에 맞게 다시 재야 한다.
