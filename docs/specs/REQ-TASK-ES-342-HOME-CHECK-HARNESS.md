# 요구사항 정의서 (REQ) — #TASK-ES-342 홈 점검 하네스 (home-check.js)

> **문서 ID**: REQ-TASK-ES-342-HOME-CHECK-HARNESS  
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 HOME-25 (GOALS-01 과 공유하는 검증 도구)  
> **작성 일시**: 2026-10-04  
> **작성자**: Claude Code 세션 (검증 도구 작업)  
> **성격**: 검증 도구·문서만 추가한다. 제품 파일(`index.html`·`js/**`·`ui.css`)은 건드리지 않는다.

## 지시 원문 (작업 지시서에서 옮김)

- docs/design/harness/ 의 shots.js·shots-lib.js·audit.js 를 읽고, 재사용해 새 스크립트 docs/design/harness/home-check.js 를 만든다.
- 인자: `<APP_DIR(워크트리 경로)> <outDir>`. APP_DIR 하드코딩 금지(기존 shots.js 는 C:/dev/ourgoal-app 하드코딩 — 그 파일은 고치지 말고 새 스크립트에서 인자로).
- 테마 4종(html[data-theme] focus-sanctuary·black·white·urban-city — index.html 의 실제 테마 값 확인) × 뷰포트 375×667·375×812 = 8장 홈 촬영 + 홈 상세 바텀시트 열림 상태 + 체크인 입력 포커스 상태.
- 각 장마다 JSON: 문서 스크롤 높이(무스크롤 여부), 44px 미만 클릭 타겟 수, 콘솔 에러 수, 화면에 있으나 display:none 등으로 숨겨진 상호작용 요소 수와 id 목록, 'Lv.'·'EXP' 텍스트가 홈에 보이는지.
- 나중에 목표탭에도 쓰도록 탭 이름을 인자로 받을 수 있게(기본 home) 설계하되, 이 작업은 홈만 검증.
- 실행해서 산출물 생성(원격 서버·실계정 쓰지 말 것: 기존 shots-lib 의 게스트 프로필 시드·Supabase 목 방식 그대로). 산출물 PNG 는 저장소에 커밋하지 말고 요약 JSON 1개만 docs/design/harness/out-home-<날짜>.json 정도로(용량 작게).
- 검증: 스크립트를 실제로 돌린 출력 수치를 보고(예비 확인). 미측정을 통과로 적지 말 것.

## 1. [원칙 ①] 문제 파악

- 홈 개편 티켓(HOME-01~13)이 "375×667 무스크롤", "44px 터치 타겟" 등을 주장하지만, 테마 4종 × 기기 높이 2종을 한 번에 같은 잣대로 재는 도구가 없다.
- 기존 `docs/design/harness/shots.js` 는 앱 경로가 `C:/dev/ourgoal-app` 으로 고정되어 워크트리(`C:/dev/wt/*`)를 잴 수 없고, 뷰포트도 390×844 하나다.
- 기존 `audit.js` 는 탭별 합계 지표만 내고 테마·뷰포트·상태(바텀시트 열림, 입력 포커스)를 나누지 않는다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 홈 화면에 대한 주장(무스크롤·타겟 크기·숨김 요소·Lv/EXP 노출)을 사람 눈이 아니라 같은 측정으로 비교할 수 있게 한다.
- **원인**: 하네스가 경로·뷰포트·상태를 인자로 받지 않는다.
- **중심**: `shots-lib.js` 의 `newPage(browser, seedGuest, theme)`(게스트 프로필 시드 + Supabase 목 + 외부 호출 차단)를 그대로 재사용한다.
- **핵심**: 측정 함수 `MEASURE_FN(tab, extraScope)` 하나를 모든 장에 똑같이 적용한다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자

| 항목 | 식별자 |
| :-- | :-- |
| 새 파일 | `docs/design/harness/home-check.js` |
| 재사용 | `docs/design/harness/shots-lib.js` → `newPage` (수정하지 않음) |
| 인자 | `node home-check.js <APP_DIR> <outDir> [tab] [--summary <file.json>]` — `TAB` 기본값 `home` |
| 테마 | `THEMES = ['focus-sanctuary', 'black', 'white', 'urban-city']` (index.html `ourgoal_current_theme` 허용 목록과 동일) |
| 뷰포트 | `VIEWPORTS = 375×667, 375×812` |
| 상태(home) | `STATES.home`: `base` · `sheet`(`#homeCompassQuest` 실제 클릭 → `#homeDetailSheet.open`) · `focus`(`#captureInput` 실제 클릭 → `document.activeElement`) |
| 진입 팝업 | `#modalOverlay.active`, `#avatarGreetingModal`(닫기 `#btnAvatarGreetClose` 실제 클릭) — 떠 있었으면 `bootOverlays` 에 기록 |
| 측정 | `docScrollHeight`·`noScroll`·`innerScrollers`·`lowestInTab`·`smallTargets`·`smallTargetList`·`consoleErrors`·`hiddenInteractive`·`hiddenInteractiveIds`·`lvVisible`·`lvInFirstView`·`expVisible`·`expInFirstView` |
| 산출물 | `<outDir>/<tab>-<theme>-<w>x<h>-<state>.png`, `<outDir>/<tab>-check.json`(전체), `docs/design/harness/out-home-2026-10-04.json`(요약, 커밋) |

## 4. [원칙 ④] 재검토

- 숨김 판정은 `hidden` 속성·`display:none`·`visibility:hidden`·`opacity:0`·접힌 `<details>`·크기 0·화면 밖 좌표를 조상까지 올라가며 보고 사유를 함께 남긴다(사유가 있어야 "의도한 접힘"과 "죽은 버튼"을 사람이 가른다).
- 바텀시트 버튼이 첫 화면에서 다른 요소에 가려져 있으면 그 사실을 `enterNote` 에 남기고, 가운데로 스크롤해 한 번 더 누른다(가림 자체도 측정 결과다).

## 5. [원칙 ⑤] 절차

1. `home-check.js` 작성 → 2. 워크트리 대상으로 실행(24장) → 3. 요약 JSON 커밋, PNG 는 저장소 밖 → 4. 주장 파일·PLAN·TICKETS 기록 → 5. PR(심사 청구).

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- **반론 1**: "작업자가 만든 측정 스크립트의 출력은 증거가 아니다." → 맞다(법정 README 5절). 그래서 이 PR 은 앱 동작을 주장하지 않는다. 주장은 "스크립트에 무엇이 들어 있다"·"요약 JSON 에 무엇이 기록되어 있다"는 글자 수준까지만 낸다. 수치는 예비 확인으로만 보고한다.
- **반론 2**: "목 Supabase·게스트 시드는 실사용 화면과 다르다." → 맞다. 지시가 원격 서버·실계정 사용을 금했다. 로그인 사용자 화면·실폰 가상 키보드는 이 도구로 판단하지 않으며 보고서에 "확인 못 함"으로 적는다.

## 7. [원칙 ⑦] 즉시 실행

- 2026-10-04 워크트리 `C:/dev/wt/home-25-harness` 대상 실행 완료(24장, 약 47초).

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점

- 성과: 24장 모두 상태 진입 여부(`entered`)와 지표가 요약 JSON 에 기록된다.
- 막히는 지점: iPhone UA 로 띄우므로 iOS 홈 화면 추가 배너(`#iosPwaSlot`)가 떠 문서 높이에 포함된다(실제 iPhone Safari 사용자 화면과 같은 조건). 헤드리스 크롬은 가상 키보드를 띄우지 않는다.
