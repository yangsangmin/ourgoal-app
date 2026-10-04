# 요구사항 정의서 (REQ) — #TASK-ES-349 6개 탭 공통 실측 도구 (CORE-01)

> **문서 ID**: REQ-TASK-ES-349-SIX-TAB-HARNESS  
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 CORE-01 (GOALS-01 흡수, 선행 HOME-25)  
> **작성 일시**: 2026-10-04  
> **작성자**: Claude Code 세션 (공통 기반 도구 작업)  
> **성격**: 검증 도구·문서만 추가·변경한다. 제품 파일(`index.html`·`js/**`·`ui.css`)은 건드리지 않는다.

## 지시 원문 (작업 지시서에서 옮김)

- 기존 `docs/design/harness/home-check.js`(PR #651, shots-lib.js 의 newPage 재사용 — 게스트 시드·Supabase mock·외부 호출 차단)를 탭 인자형 공통 도구로 넓힌다: 탭 home·goals·records·calendar·comm·settings × 테마 4종(index.html 의 실제 테마 값) × 375×667·375×812. 각 탭은 그 탭의 주요 상태(예: 서브탭·바텀시트 1개)까지 실제 클릭으로 들어간다 — 들어갔는지 검증하고 못 들어가면 그 사실을 기록(가짜 성공 금지).
- 측정 항목(장별 JSON): 페이지 높이/화면 높이·무스크롤 여부, 44px 미만 조작 요소 목록, 콘솔 오류, 숨은 조작 요소(display:none 부모 아래 버튼 등) 목록과 숨긴 이유, display:none !important 가 걸린 요소 수, 그리고 자동 클릭 Dead-Click 탐지: 보이는 조작 요소를 하나씩 눌러 DOM 변화·네트워크 시도·토스트·화면 전환 중 아무 반응이 없으면 Dead-Click 후보로 기록(눌러서 다른 탭으로 가면 원래 상태로 복귀). 외부로 나가는 동작(window.open, 외부 링크)·삭제/초기화처럼 되돌릴 수 없는 버튼은 누르지 말고 '누르지 않음(사유)'로 기록.
- 홈 도구(home-check.js)는 새 공통 도구로 대체하되, 기존 명령이 깨지지 않게 얇은 호환 래퍼로 남긴다(삭제 금지).
- 산출물은 요약 JSON 만 커밋(PNG 는 커밋하지 말 것), 6탭 각각 1회 실행 결과 요약 파일을 docs/design/harness/out-six-tab-2026-10-04.json 정도로.
- 재현성: 같은 커밋에서 2회 실행해 지표 차이 0 인지 비교(차이가 있으면 원인과 함께 기록).
- 문서: README(도구 사용법 한 단락) 또는 docs/design/harness/ 안 설명, REQ/PLAN(TASK-ES-349), reports/TASK-ES-349/claims.json, TICKETS 1줄, dev_log 항목. 근거: 노션 CORE-01.

노션 CORE-01 완료 기준(참고): "6개 탭 각각 실행 산출물(촬영 48장/탭 + 요약 JSON) 생성, 자동 클릭으로 Dead-Click 목록 출력, 같은 입력에 같은 결과(2회 실행 비교 차이 0)". 이 작업은 작업 지시서의 "주요 상태(서브탭·바텀시트 1개)" 범위를 따라 탭당 16~24장을 찍는다 — 48장/탭과의 차이는 PR 본문과 dev_log 에 적는다.

## 1. [원칙 ①] 문제 파악

- '완료'라던 화면 주장이 실제 화면에서 안 되는 일이 여섯 탭 모두에서 반복됐다. 탭마다 코드만 확인하고 끝냈기 때문이다.
- 홈 실측 도구(`home-check.js`, PR #651)는 홈만 제대로 재고, 다른 탭은 기본 상태만 찍으며 Dead-Click(눌러도 반응 없는 요소)을 재지 않는다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 여섯 탭의 화면 주장(무스크롤·터치 크기·숨김·반응)을 사람 눈이 아니라 같은 측정으로 비교한다.
- **원인**: 측정 도구가 홈 전용이고, 탭별 상태 진입과 자동 클릭이 없다.
- **중심**: `shots-lib.js` 의 `newPage` 를 그대로 쓰고, 탭별 상태 정의만 표로 늘린다.
- **핵심**: 한 측정 함수와 한 클릭 탐지 절차를 모든 탭·테마·뷰포트·상태에 똑같이 적용하고, 두 번 돌려 같은지 확인한다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자

| 항목 | 식별자 |
| :-- | :-- |
| 공통 도구 | `docs/design/harness/tab-check.js` — `main(argv)`, `MEASURE_FN(tab, extraScope)`, `openState()`, `runTab()`, `writeSummary()`, `mergeFull()` |
| 상태 정의 | `docs/design/harness/tab-states.js` — `STATES`, `clickReal()`, `boot()`, `goTab()` |
| Dead-Click | `docs/design/harness/tab-deadclick.js` — `probeState()`, `COLLECT_FN`, `skipReason()`, `ARM_FN`·`SNAP_FN`·`AFTER_FN` |
| 재현성 비교 | `docs/design/harness/tab-compare.js` |
| 호환 래퍼 | `docs/design/harness/home-check.js` → `require('./tab-check.js').main` |
| 상태 | home: `#homeCompassQuest`→`#homeDetailSheet.open` · `#captureInput` 포커스 / goals: `#btnGoalsSubRoutine`→`#routineGoalsView` · `#sAddGoalBtn`→`#ngDescInput` / calendar: `.s-cal-mode-btn` 주간 · `#calAddManualBtn`→`#calEditTitle` / records: `.s-rec-mode-btn` 몰입 타이머→`#sPomodoroDisplay` · 새 기록 작성→`#modalOverlay.active` / comm: `.comm-type-pill[data-feedtype=mine]` · `#btnCommPostFeed`→`#modalOverlay.active` / settings: `#btnSettingsQuickAvatar`→`#modalOverlay.active` |
| 산출물 | `docs/design/harness/out-six-tab-2026-10-04.json`(요약, 커밋), `docs/design/harness/out-six-tab-2026-10-04-repro.json`(2회 비교, 커밋), PNG·전체 결과는 저장소 밖 |

## 4. [원칙 ④] 재검토

- 장마다 새 브라우저 컨텍스트를 쓴다(앞 장의 클릭·저장값이 뒤 장에 섞이지 않게 — 재현성의 전제).
- Dead-Click 판정 전 대기 구간에 저절로 바뀌는 노드·저절로 나가는 요청을 잡음으로 빼서, 타이머가 만든 변화가 반응으로 세지지 않게 한다.
- window.open·confirm·파일 선택창·공유·알림 권한은 가로채서 기록만 한다(실제로 열지 않음). confirm 은 취소로 답한다.

## 5. [원칙 ⑤] 절차

1. 탭별 상태 진입 셀렉터 실측 확인 → 2. 도구 4개 작성·커밋 → 3. 그 커밋에서 6탭 실행 2회 → 4. 요약·비교 JSON 커밋 → 5. 문서·주장 파일 → 6. PR(심사 청구).

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- **반론 1**: "작업자가 만든 도구의 측정값은 증거가 아니다." → 맞다. 그래서 주장 파일은 "도구에 무엇이 들어 있다"·"요약 JSON 에 무엇이 기록되어 있다"는 글자 수준으로만 내고, 수치는 작업자 주장으로만 적는다.
- **반론 2**: "자동 클릭이 되돌릴 수 없는 동작(삭제·외부 전송)을 실제로 일으킬 수 있다." → 이름·글자·data 속성으로 삭제·초기화·게시·결제·외부 링크를 미리 걸러 누르지 않고, 누르는 것도 게스트 시드·목 Supabase·외부 이름 풀이 차단(`--host-resolver-rules`) 안에서만 일어난다. 원격 서버·실계정에는 닿지 않는다.

## 7. [원칙 ⑦] 즉시 실행

- 도구 커밋 `ccf2f2d` 에서 6탭 병렬 실행 2회(실행 A·B), `--merge` 로 요약 묶음, `tab-compare.js` 로 비교.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점

- 성과: 6탭 모두 장별 지표·상태 진입 여부·Dead-Click 결과가 요약 JSON 에 있고, 2회 비교 차이 수가 기록된다.
- 막히는 지점: 6탭 병렬 실행 부하에서 탭 버튼 첫 누름이 안 먹은 일이 1회 있었다(실행 B 달력 첫 장) — 진짜 누름을 2회까지 다시 하도록 고치고 두 실행을 처음부터 다시 했다. 설정 탭은 `scrollIntoView` 가 문서 스크롤을 옮기지 못해 문서 좌표로 다시 스크롤한다(실측). 접힌 `details` 안 요소는 Dead-Click 대상에서 빠진다. 헤드리스 Chrome 은 가상 키보드를 띄우지 않는다.
