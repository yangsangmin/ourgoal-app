# REQ/PLAN — TASK-ES-363 공용 모달 한 통로 (쪼개는 순서 2번 나머지)

> 상위: [MODULE-BLUEPRINT.md](../architecture/MODULE-BLUEPRINT.md) 8절 순서 2 · [UI-COMPONENTS.md](../architecture/UI-COMPONENTS.md) 2-2·3절 2번. 앞선 같은 방식: [REQ-TASK-ES-361-TOAST-UNIFY.md](REQ-TASK-ES-361-TOAST-UNIFY.md)(#675, `js/core/toast.js`).
> 숫자는 `node scripts/module-metrics.js` 산출이다(손으로 옮긴 수치 없음).

## 지시 원문(요약 아님 — 작업 지시서 그대로)

- "`node scripts/module-metrics.js` 의 duplicateCellSites 중 modalBridge(각자 만든 openModal 통로 4곳: team-linked-goals, team-visibility-levels, theme-system, time-tracker)를 공용 통로로 바꾼다."
- "방금 병합된 토스트 통합 PR #675(js/core/toast.js, 능력 ui.toast, 대기열, bind)를 정독하고 같은 방식으로 js/core/ 에 공용 모달 통로(능력 ui.modal 권장)를 만든다."
- "그리는 것은 지금처럼 index.html 정본 openModal 이 하게 해서 모양·동작이 바뀌지 않게."
- "selfOverlay(직접 만든 덮개 9곳)와 nativeConfirm(41곳)은 이번 범위가 아니다 — 목록·권장 순서만 보고에 적는다."
- "신고서 module-specs --write, 모듈 가드 통과, modalBridge 4→0 측정 보고."
- "부품 시험(tests/)으로 통로 대기열·재귀 없음 증명, npm test 경로에 넣기." · "게스트로 여는 모달 2~3개가 열리고 닫히는지."

## REQ

- 대상 파일: `js/core/modal.js`(신규, 세포 `core/modal`), `js/team-linked-goals.js`(19·20줄), `js/team-visibility-levels.js`(18·19줄), `js/theme-system.js`(`initUI` 안 `openModal`/`closeModal` 지역 함수), `js/time-tracker.js`(`openModal`/`closeModal` 지역 함수), `index.html`(스크립트 태그 1줄 — 인라인 스크립트 미접촉), `docs/architecture/modules.json`, `scripts/test-shipyard-modular.js`, `tests/core-modal-es363.test.js`(신규)
- 대상 함수: `open`·`close`·`bind`·`attach`·`renderer`·`flush`(js/core/modal.js) · 두 팀 파일의 `openModal`·`closeModal`(함수 선언 → 공용 통로가 만든 함수 쌍) · `openThemeSelector`·`closeThemeSelector`(theme-system, 옛 이름 `openModal`·`closeModal`) · `openTrackerOverlay`·`closeTrackerOverlay`(time-tracker, 옛 이름 `openModal`·`closeModal`) · 정본 `openModal(html, onMount)`·`closeModal(skipHistoryBack)`(index.html, 바꾸지 않음)
- 대상 능력: `ui.modal`(화면) · `ui.modal.close`(화면) · `ui.modal.bind`(세포용 함수 쌍 만들기)
- 대상 DOM ID: `#modalOverlay`·`#modalSheet`(정본, 바꾸지 않음) · 화면 확인용 `#btnGoalsSubTeam`·`[data-tgquickjoin]`·`[data-tgpdm]`·`#btnCloseTgDmModal`·`#tgDmInputText` · `#recQuickDockBar`·`#timeTrackerOverlay`·`#ttDigits`·`#btnTtClose`

## PLAN — 문제해결 8원칙

## 1. 목표 정의

- [x] 정본 모달(index.html `openModal`)로 넘기는 통로는 공용 하나(`ui.modal`)뿐. 세포는 각자 통로를 만들지 않고 공용 통로가 만든 함수 쌍을 받는다. 지표 modalBridge 4 → 0. 모양·동작(뒤로가기·✕·덮개 탭 닫기) 불변.

## 2. 현상 분석 — 본질·원인·중심·핵심 파악

- [x] 4곳을 열어 보니 성격이 둘이다. ① team-linked-goals:19·team-visibility-levels:18 — `_ctx/_deps.openModal` → 없으면 `global.openModal` 로 넘기기만 하는 **연결 통로**(같은 코드가 두 벌, 정본 준비 전엔 조용히 버림). ② theme-system:635·time-tracker:1184 — 정본으로 넘기지 않고 **자기 DOM 을 여는 자체 모달**(`#themeSelectorModal` 을 `style.display='flex'`, `#timeTrackerOverlay` 의 `hidden` 클래스 제거). 지표 정규식(`function openModal(`)은 이름만 보므로 ②도 셌다.

## 3. 원인 추정

- [x] ① 공용 모달을 받는 정식 통로가 없어서 파일마다 주입·전역 폴백을 손으로 짰다(#675 토스트와 같은 원인). ② 자체 모달이 지역 함수 이름으로 정본과 같은 `openModal` 을 써서 "연결 통로"로 오인된다 — 이름이 하는 일을 거짓으로 말한다.

## 4. 대안 탐색

- [x] A) ②까지 정본 `openModal` 로 옮김 — 테마 창(정적 마크업·자체 CSS)과 전체화면 시간 기록(가로 회전·자체 덮개)의 모양이 바뀐다 → 지시("모양·동작이 바뀌지 않게") 위반. B) ①만 공용 통로로, ②는 지표에서 빼는 규칙을 module-metrics 에 더함 — 지표를 고쳐 숫자를 맞추는 것이라 거부. C) ①은 `js/core/modal.js` 의 `ui.modal.bind` 로 융합, ②는 하는 일대로 이름을 정정(`openThemeSelector`·`openTrackerOverlay`)하고 덮개 흡수 트랙(UI-COMPONENTS 3절 4번)으로 분류 — 밖으로 드러난 API 키(`themeUI.openModal`·`OurgoalTimeTracker.open`)는 그대로. → **C 선택**.

## 5. 실행 계획

- [x] (1) js/core/modal.js — `ui.modal`(정본 있으면 즉시, 없으면 열기·닫기 요청을 순서대로 대기열 최대 20 → `attach`·DOMContentLoaded·다음 호출 때 차례대로), `ui.modal.close`, `ui.modal.bind(getOverrides)`(주입 우선 · open 은 두 인자, close 는 인자 없이 — 예전 통로와 같아 클릭 이벤트가 정본 `skipHistoryBack` 자리로 새지 않음 · 통로가 만든 함수는 고르지 않음 → 재귀 불가). (2) index.html 에 `toast.js` 다음 1줄. (3) 두 팀 파일의 함수 선언 2줄 → 같은 2줄(`var _modal = …(ui.modal.bind)…` · `var openModal = _modal.open, closeModal = _modal.close;`) — 800줄 넘는 두 파일 줄 수 증가 0. (4) theme-system·time-tracker 지역 함수 이름 정정(줄 수 증가 0). (5) 신고서·부품 시험·화면 시나리오·주장.

## 6. 절차 재검증 및 반론 격파

- [x] 반론 2가지와 격파:
  - 반론① "theme-system·time-tracker 는 이름만 바꿔 지표를 속인 것 아니냐" → 그 둘은 처음부터 정본으로 가는 통로가 아니었다(코드에 `global.openModal`·주입 openModal 호출이 없다). 지표의 정의는 "index.html openModal 밖에서 각자 만든 openModal 함수 = 모달 연결 통로"인데, 자기 DOM 을 여는 함수가 같은 이름을 써서 잘못 잡혔다. 이름을 하는 일대로 바꾼 것은 오분류를 바로잡은 것이고, 그 둘이 공용 모달을 안 쓰는 부채는 사라지지 않고 덮개 지표(selfOverlay — time-tracker.js:131 `tt-overlay`)와 정적 덮개 요소 집계(`theme-modal-backdrop`)에 그대로 남아 있다. 보고·UI-COMPONENTS 2-2 에 이 구분을 적었다.
  - 반론② "대기열은 모달에서 위험하다 — 정본 준비 전에 쌓인 창이 나중에 갑자기 뜬다" → 정상 부팅 순서에선 index.html 인라인 IIFE 가 `window.openModal` 을 단 뒤 `init()` 으로 정본을 주입하므로 대기열은 비어 있다(부품 시험이 로드 순서를 고정). 대기열은 "정본보다 먼저 불린 요청을 조용히 버리던" 예전 동작(두 팀 통로)을 "정본이 생기는 순간 요청 순서대로 넘김"으로 바꾼 것이고, 정본은 한 번에 창 하나(2중 적재 방지)라 순서대로 넘기면 정본이 처음부터 있었을 때와 같은 결과다. 닫기만 단독으로 오면(열린 창 없음) 쌓지 않는다.

## 7. 즉시 실행

- [x] 위 (1)~(5) 반영. 모듈 가드 통과(① 35905 · ② 691 · ③ 282 · ④ 12 · ⑤ 0 — 변동 없음, 기준선 갱신 불필요).

## 8. 성과 측정

- [x] `module-metrics` duplicateCellSites.modalBridge 4 → 0(기준 origin/main 9962457 에서 4) · toast 0 · recap 3 · timer 4 · selfOverlay 9 · nativeConfirm 41(범위 밖, 불변) · ③ 282 → 282(새 전역 0) · ① 35905 → 35905 · 부품 시험 11건 통과 · 게스트 화면 시나리오 2건(팀 DM 모달 열고 닫기 · 시간 기록 창 열고 닫기) 작업 커밋·기준 커밋 모두 통과(동작 불변이라 정상).
* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.

## 범위 밖 — 목록과 권장 순서(지시: 보고만)

- **selfOverlay 9**(정의 서명 수, 덮개로는 7곳): index.html:7800 · 15642·15646(`mic-perm-backdrop`) · 15949 · 17751(`checkin-ai-backdrop`) · js/avatar-system.js:5567·5568 · js/time-tracker.js:131(`tt-overlay`) · js/universal-stats.js:5184. 권장 순서: (1) index.html:7800·15949 처럼 HTML 을 그려 넣기만 하는 단순 덮개 → `ui.modal` (2) 마이크 권한 덮개 → `ui.modal` (3) avatar-system·universal-stats 덮개 → 그 세포를 분열할 때(쪼개는 순서 5·7) (4) 체크인 직후 시트 `checkin-ai-backdrop` → `checkin.after` 자리 기여(UI-COMPONENTS 3절 4번) (5) 전체화면 시간 기록·테마 선택 창 → 전체화면 변형(`ui.modal` 에 전체화면 모양 선택지)을 정한 뒤 마지막.
- **nativeConfirm 41**: index.html 26 · universal-stats 4 · team-invite-comm 2 · team-linked-goals 2 · time-tracker 2 · avatar-system·customize·reactions·team-visibility-levels·tabs/settings/sub-integrations 각 1. 권장 순서: 먼저 `openBottomSheetConfirm` 을 `ui.confirm` 능력으로 `js/core/` 에 노출(이 PR 과 같은 방식) → 탭 이전 PR 마다 그 탭 몫을 바꾼다. 기본 `confirm()` 은 동기(true/false 즉시)이고 바텀시트 확인은 콜백이라 호출부 흐름을 바꿔야 하므로 한 곳씩, 삭제·탈퇴처럼 되돌릴 수 없는 동작의 문구는 바꾸지 않는다.

## 확인 못 한 것

- 실제 폰(L6)에서의 모달 모양·뒤로가기 — 정본 코드가 그대로라 바뀔 이유는 없지만 재지 않았다.
- team-visibility-levels 의 조 상세 모달(`openLevelGroupDetailModal`) 화면 확인 — 팀장 권한 화면이라 게스트로 닿지 않는다. 같은 `ui.modal.bind` 를 쓰므로 부품 시험·팀 DM 화면 시나리오로 갈음.
- 테마 선택 창 화면 확인 — 아래 결함 때문에 게스트·로그인 모두 화면에서 열 길이 없다(부품 시험으로 `initUI` 가 같은 API 키를 돌려주는 것만 확인).

## 새로 찾은 결함(고치지 않음)

- 테마 선택 창(`#themeSelectorModal`)을 여는 입구 두 곳 — `#captureLiveTheme`(들어 있는 `#captureLiveMeta`)와 `#btnOpenThemeModal`(들어 있는 `#captureThemeQuickBar`) — 이 ui.css 5824·5955 줄 규칙으로 앱 테마 4종(focus-sanctuary·black·white·urban-city) 모두에서 `display:none !important` 다. 저장된 테마도 이 4종으로만 정규화되므로(index.html `_initTh`) 지금 사용자는 테마 선택 창을 열 수 없다. 살릴지·지울지는 기능 삭제 승인선이라 상민님 결정.
