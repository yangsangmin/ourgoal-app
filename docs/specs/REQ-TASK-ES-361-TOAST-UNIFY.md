# REQ/PLAN — TASK-ES-361 공용 토스트 한 통로 (쪼개는 순서 2번 · 노션 CORE-10 동시 해결)

> 상위: [MODULE-BLUEPRINT.md](../architecture/MODULE-BLUEPRINT.md) 8절 순서 2 · [UI-COMPONENTS.md](../architecture/UI-COMPONENTS.md) 3절 1번.
> 숫자는 `node scripts/module-metrics.js` 산출이다(손으로 옮긴 수치 없음).

## 지시 원문(요약 아님 — 작업 지시서 그대로)

- "index.html 정본 토스트 밖에서 각자 만든 토스트 연결 통로 6곳을 공용 토스트 하나로 부르게 바꾼다" — js/auth-safety.js:6 toastFn · js/helpful-reason.js:38 toast · js/reactions.js:45 toast · js/team-invite-comm.js:13 showToast(CORE-10) · js/team-linked-goals.js:18 toast · js/team-visibility-levels.js:17 toast
- "공용 토스트는 js/core/ 아래 한 통로(능력 등록부 js/core/capabilities.js 에 `ui.toast` 능력으로 제공하는 것을 권장)로 노출하고, 6곳은 그것을 부른다."
- "공용 토스트가 아직 준비 안 된 시점(스크립트 로드 순서)에도 메시지를 잃지 않게(대기열 또는 정본 지연 호출) 한다. 사용자에게 보이는 문구·표시 시간·모양은 바꾸지 않는다."
- "CORE-10: init() 전에 불리면 자기 자신을 다시 불러 오류가 try/catch 에 묻혀 토스트가 안 뜸. 이 결함을 없앤다."
- "신고서 갱신(`node scripts/module-specs.js --write`), 모듈 가드 통과. 중복 세포 지표 toast 6 → 0"

## REQ

- 대상 파일: `js/core/toast.js`(신규), `js/auth-safety.js`, `js/helpful-reason.js`, `js/reactions.js`, `js/team-invite-comm.js`, `js/team-linked-goals.js`, `js/team-visibility-levels.js`, `index.html`(스크립트 태그 2줄 — 일정 탭 코드 미접촉), `docs/architecture/modules.json`, `docs/architecture/module-baseline.json`, `scripts/test-shipyard-modular.js`, `tests/core-toast-es361.test.js`(신규)
- 대상 함수: `show`·`bind`·`attach`·`renderer`·`flush`(js/core/toast.js), 6곳의 `toastFn`·`toast`·`showToast`(함수 선언 → 공용 통로가 만든 함수), 정본 `toast(msg)`(index.html, 바꾸지 않음)
- 대상 능력: `ui.toast`(화면), `ui.toast.bind`(세포용 토스트 함수 만들기) — 세포 `core/toast`(organ)
- 대상 DOM ID: `#toast`(정본 요소, 바꾸지 않음) · 화면 확인용 `#btnGoalsSubTeam`·`[data-tgquickjoin]`·`[data-tgpnudge]`·`[data-copyteamgoal]`·`#btnCommPostFeed`·`#shareCaptionInput`·`#shareConfirmBtn`·`[data-rx="cheer"]`

## PLAN — 문제해결 8원칙

- [x] 1. 목표 정의: 토스트를 그리는 곳은 index.html 정본 하나, 부르는 통로도 하나(`ui.toast`). 6곳은 각자 통로를 만들지 않고 공용 통로가 만든 함수를 받는다. CORE-10 재귀 0. 문구·2.2초·모양 불변.
- [x] 2. 현상 분석: `module-metrics` duplicateCellSites.toast = 6. 6벌의 동작이 제각각 — auth-safety 는 init 전 `console.log`(화면 안 뜸), helpful-reason·reactions 는 `deps.toast` 없으면 조용히 버림, team-linked-goals·team-visibility-levels 는 `global.toast` 로 넘김, team-invite-comm 은 `_ctx.toast` 없으면 `global.toast` 가 있을 때 **자기 자신을 다시 부름**(16줄 `return showToast(msg)`) → 무한 재귀 → `try/catch` 가 삼켜 토스트 0회(origin/main 코드로 재현: init 전 호출 시 정본 호출 0회).
- [x] 3. 원인 추정: ① 공용 토스트를 받는 정식 통로가 없어서(능력 등록부가 index.html 에 안 붙어 있었음) 파일마다 주입(`init(deps)`)·전역 폴백을 손으로 짰다. ② 폴백을 손으로 짜다 보니 이름 실수(`global.toast` 확인 후 `showToast` 호출)가 재귀가 됐다. ③ 스크립트 로드 순서상 js 파일이 정본(인라인 IIFE)보다 먼저 실행되어, init 전 호출 경로가 생긴다.
- [x] 4. 대안 탐색: A) 정본 `toast()`·`toastTimer` 를 js/ui/toast.js 로 옮김 — `showUndoPrivacyToast`·`toastWithTrashUndo` 가 같은 `toastTimer` 를 지워 서로의 숨김 타이머를 끊는 관계가 깨질 수 있고 인라인 줄·일정 탭 병행 작업과 충돌 위험. B) 정본은 그대로 두고 js/core/toast.js 를 **부르는 통로**로: 정본이 생기기 전엔 대기열, 생긴 뒤엔 정본(`window.toast`) 또는 `attach(fn)` 로 붙인 함수를 부름 — 문구·시간·모양이 구조적으로 불변. C) 6곳이 `OurgoalCapabilities.call('ui.toast')` 를 직접 부름 — 시험이 주입하는 `deps.toast`(예: scripts/test-team-linked-goals.js, scripts/test-account-purge.js)를 무시하게 되어 기존 시험이 깨짐. → **B + 주입 우선 `ui.toast.bind`** 선택.
- [x] 5. 실행 계획: (1) js/core/toast.js 작성 — `ui.toast`(show: 정본 있으면 즉시, 없으면 대기열 최대 20, 정본이 붙거나 DOMContentLoaded 때 2.4초 간격으로 차례대로), `ui.toast.bind(getOverride)`(주입 토스트 우선, 통로 자신은 고르지 않음 → 재귀 불가), `attach(fn)`. (2) index.html 에 `capabilities.js`·`toast.js` 를 `ui-helpers.js` 다음에 붙임(인라인 스크립트 줄 증가 0). (3) 6곳의 함수 선언을 한 줄 `var … = (ui.toast.bind)(function(){ return <주입 토스트>; })` 로 바꿈(800줄 넘는 파일 줄 수 증가 금지). Node 시험 환경에서는 `require('./core/toast.js')`, 둘 다 없는 vm 상자에서는 주입 토스트만 쓰는 최소 대체. (4) 신고서 `core/toast` provides·6세포 requires `ui.toast.bind`, components 의 계획 능력에서 `ui.toast` 제거(주인 하나). (5) 부품 시험·화면 시나리오·주장.
- [x] 6. 절차 재검증 및 반론 격파:
  - 반론① "이름만 `function toast` → `var toast` 로 바꿔 지표를 속인 것 아니냐" → 6곳에 남은 것은 **로직이 없는 참조 한 줄**이다. 주입 우선·폴백·대기열·재귀 차단 로직은 js/core/toast.js `bind` 한 곳에만 있다. 부품 시험이 6곳 모두 `OurgoalCapabilities.request('ui.toast.bind')` 를 부르는지 확인한다. 브라우저에서 등록부가 없을 때만 쓰는 최소 대체(주입 토스트만 부름)는 예전 reactions·helpful-reason 동작과 같고, 정상 로드 순서에선 실행되지 않는다(시험이 로드 순서를 고정).
  - 반론② "정본을 옮기지 않았으니 한 벌화가 아니다" → 지시의 목표는 "6곳이 공용 토스트 하나를 부른다"이고, 그리는 구현은 이미 하나(index.html `toast`)다. 정본을 옮기면 같은 `#toast` 를 쓰는 되돌리기 토스트 2종과 숨김 타이머를 공유하는 관계를 다시 짜야 해서 "표시 시간 불변"을 깨뜨릴 위험이 크다. 옮기는 일은 `attach(fn)` 자리로 다음 단계(js/ui/toast.js)에서 문구·시간 그대로 할 수 있게 열어 두었다.
- [x] 7. 즉시 실행: 위 (1)~(5) 반영. `node scripts/module-guard.js --update` 로 ④ 기준선 하향(team-invite-comm 4135→4131줄).
- [x] 8. 성과 측정: `module-metrics` duplicateCells.toast 6 → 0 · ③ 전역 직접 대입 282 → 282(새 전역 0) · ① 인라인 줄 증가 0 · 부품 시험 8건 통과(CORE-10: init 전 호출 정본 1회 / origin/main 0회) · npm test 통과 · 게스트 화면 시나리오 3건(팀 찌르기·팀 목표 복사·피드 응원) 작업 커밋과 기준 커밋에서 같은 토스트 글자.
* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.

## 확인 못 한 것

- 실제 폰(L6)에서의 토스트 모양·위치 — 정본 코드가 그대로라 바뀔 이유는 없지만 재지 않았다.
- auth-safety·helpful-reason·team-visibility-levels 토스트의 화면 확인 — 로그인 뒤(비밀번호 변경·탈퇴 복구)·도움돼요 서버 응답·팀장 권한 화면이라 게스트로 닿지 않는다. 같은 `bind` 를 쓰므로 부품 시험·팀 연계/반응 화면 시나리오로 갈음.
- 동작 변화(의도): auth-safety 는 init 전 토스트가 콘솔에만 찍히던 것이 이제 화면에 뜬다(문구 그대로). helpful-reason·reactions 는 주입 전 호출이 버려지던 것이 화면에 뜬다. 정상 부팅 순서에선 init 이 먼저라 사용자 체감 차이는 없다.
