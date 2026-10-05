# REQ — #TASK-ES-410 팀 목표 카드 「세부 할 일」 버튼 이중 손잡이(죽은 클릭) 측정·수정

- 근거: 코디네이터 지시(2026-10-05) — #723(TASK-ES-409) 빌더 발견: 팀 목표 카드의 세부 할 일 버튼 `[data-tgtoggletasks]` 에 index.html 카드 손잡이와 모듈 `bindEvents`(js/team-visibility-levels.js) 손잡이가 둘 다 걸려 한 번 누르면 두 번 뒤집혀 변화가 없다는 의심.
- 범위: `index.html` 카드 루프의 `[data-tgtoggletasks]` 손잡이 한 줄(같은 줄 안 수정 — 줄 수 증가 0), 부품 시험 `tests/team-tasks-toggle-es410.test.js`, `scripts/test-shipyard-modular.js`(runNode 1줄), `reports/TASK-ES-410/**`.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 먼저 측정: 기준 코드에서 게스트로 버튼을 눌러 실제로 안 펼쳐지는지 확인. 결함이 아니면 PR 없이 끝.
2. 결함이면 #723 방식으로 수정(처리기를 지우지 말고 양보). 일괄 접기(`collapseAllTeamGoalAccordions`)가 저장된 펼침을 덮는지도 확인.
3. 같은 이중 처리기가 다른 팀 카드 버튼에도 있는지 `data-tg*` 선택자를 index.html 과 js/team-*.js 양쪽에서 대조해 목록화, 같은 결함은 같이 고침.
4. 증명: 게스트 화면 시나리오(기준 실패·작업 통과), 부품 시험(npm test 경로, `process.exitCode`).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- 본질: 버튼 하나에 「뒤집기」 손잡이가 둘이면 클릭 한 번이 두 번 뒤집혀 제자리로 돌아온다. 화면은 모듈(js/team-visibility-levels.js)이 그리는데, 모듈이 없던 시절의 카드 손잡이(index.html)가 모듈이 생긴 뒤에도 같은 버튼을 계속 묶는다.
- 원인(측정): `renderTeamGoalsScreen` 이 `OurgoalTeamVisibilityLevels.bindEvents(view)` 로 `[data-tgtoggletasks]` 를 묶고, 이어서 카드 루프(`card.querySelectorAll('[data-teamgoal]')` → `tgEl.querySelectorAll('[data-tgtoggletasks]')`)가 같은 버튼을 또 묶는다. 둘 다 `box.style.display` 를 none↔block 으로 뒤집고 화살표 `.t-arrow` 를 ▼↔▲ 로 바꾼다 → 클릭 1회 뒤 상자 none·화살표 ▼(변화 없음). 게스트 시나리오 기준 사본(origin/main 42cd3c6) 단계 15 「세부 할 일 상자 보임」 실패(`reports/TASK-ES-410/scenario-local.json`), 부품 시험 기준 A1 실패(`'none' !== 'block'`).
- 중심: 모듈이 있으면 모듈 손잡이 하나만 뒤집는다. 카드 손잡이는 모듈이 없을 때의 대체 경로로 남긴다(#TASK-ES-409 의 `[data-tgfoldlist]` 와 같은 방식).
- 핵심: 세부 할 일 상자는 저장값이 없다(프로필에 펼침 기록 없음, 렌더는 늘 `display:none` — 편집 모드만 펼침). 그래서 일괄 접기가 「저장된 펼침」을 덮는 문제는 이 버튼에는 없다 — 판정 함수(isMsListOpen 류)를 새로 만들 대상이 아니다. 저장 기능 신설은 이번 범위가 아니다.

## 3. [원칙 ③] 해결방식

- `index.html` 카드 `[data-tgtoggletasks]` 손잡이: `if(!box) return;` → `if(!box || window.OurgoalTeamVisibilityLevels) return;` (같은 줄, 줄 수 증가 0). 손잡이 원문 시작 글자 `tgEl.querySelectorAll('[data-tgtoggletasks]').forEach(function(btn){`(ES-409 부품 시험이 구간 끝 표지로 읽음)는 그대로.
- 모듈 `bindEvents` 의 손잡이는 그대로(햅틱 포함).

### 이중 처리기 대조표 (data-tg* · 팀 카드 버튼)

| 선택자 | index.html 묶음 | js/team-*.js 묶음 | 판정 |
| :-- | :-- | :-- | :-- |
| `[data-tgtoggletasks]` | 카드 루프 `tgEl` (+ 예시 모달 `container`, 버튼이 `#tgTasks_*` 별도) | team-visibility-levels.js `bindEvents` | **이중 뒤집기 — 이번 수정** |
| `[data-tgfoldlist]` | 카드 루프 | team-visibility-levels.js `bindEvents` | 이중이었음 — #723(TASK-ES-409) 해소 |
| `[data-tgfoldms]` | 예시 모달만 | 없음 | 단일 |
| `[data-tgtogglemscomments]`·`[data-tgtogglegoalcomments]` | 없음(state.lastOpenCommentKey 복원만) | team-visibility-levels.js | 단일 |
| `[data-tglevelaccordion]`·`[data-tgcardaccordion]`·`[data-tgselectgoal]`·`[data-tglevelmode]`·`[data-tgcopyteamlevels]` | 없음 | team-visibility-levels.js | 단일 |
| `[data-tgparttoggle]`·`[data-tgpnudge]`·`[data-tgpcmt]`·`[data-tgpdm]` | 없음(일괄 접기는 화살표 판정만) | team-linked-goals.js | 단일 |
| `[data-tgmemfilter]` | 없음 | team-leader-check.js | 단일 |
| `[data-tgtoggletask]`·`[data-tgdeltask]`·`[data-tgaddtask]`·`[data-tgaddtaskmodal]`·`[data-tgcycle]`·`[data-tgmdel]`·`[data-tgaddms]`·`[data-tgdel]`·`[data-tgmup]`·`[data-tgmdown]`·`[data-openleveldetail]`·`[data-addlevelgroup]` | index.html 만 | 없음 | 단일 |
| `[data-tgtitle]`·`[data-tgmtitle]`·`[data-tgtasktitle]`·`[data-tgmprio]` | index.html `change` | js/goal-edit-ux.js 는 편집 완료 때 값 수집(손잡이 아님) | 뒤집기 아님(같은 값 저장, 무해) |

→ 이중 「뒤집기」 손잡이는 `[data-tgtoggletasks]` 1건이 남은 전부다. 같은 결함 추가 수정 대상 없음.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 세부 할 일 상자는 저장값이 없어서, 펼친 뒤 화면이 다시 그려지면(예: 관리자가 할 일 체크 → `renderTeamGoalsScreen`) 다시 접힌다. 기존 동작 그대로이고 이번 지시(죽은 클릭) 범위 밖이다 — 펼침 저장은 별도 기능 결정.
- 로그인 사용자 화면·실기기는 재지 않았다(바뀐 것은 클릭 손잡이 조건 하나, 저장 경로 변경 없음).
- 모듈이 없을 때의 카드 손잡이 경로는 부품 시험 B1·B2 로만 확인(실제 화면은 늘 모듈을 싣는다).

## 5. [원칙 ⑤] 절차

1. `git archive` 기준 사본(42cd3c6) → 2. 게스트 시나리오로 기준 결함 측정 → 3. data-tg* 대조표 → 4. 수정 → 5. 부품 시험 기준·작업 → 6. 시나리오 작업 쪽 → 7. npm test·tests/ 종료 코드 기준·작업 비교 → 8. REQ·claims·dev_log·TICKETS·PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "카드 손잡이를 지우면 더 깔끔하다." → 격파: 그 손잡이는 모듈이 없을 때의 길이고 지우면 기능 삭제가 된다. 모듈이 있을 때만 비키는 조건 하나로 줄 수 증가 0·기존 시험 변경 0 으로 이중 뒤집기를 끊는다(부품 시험 B1·B2 가 대체 경로 유지를 잰다).
- 반론 2: "#723 처럼 저장값 판정 함수와 일괄 접기 수정도 같이 해야 한다." → 격파: 마일스톤은 #TASK-ES-258 이 `unfoldMsList` 를 저장하는데 일괄 접기가 덮어서 고친 것이다. 세부 할 일은 저장하는 값 자체가 없다(`grep unfoldTasks|foldTasks` 0건). 일괄 접기가 덮을 저장값이 없으니 판정 함수를 만들면 쓰이지 않는 코드가 된다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `[data-tgtoggletasks="<tgid>:<mid>"]`(세부 할 일 버튼), `.t-arrow`, `[data-tgtaskbox="<tgid>:<mid>"]`(상자), `[data-tgfoldlist]`, `[data-tgmslist]`, `[data-tgexampletab="workshop"]`, `[data-tgquickjoin="g-workshop"]`, `#btnGoalsSubTeam`.
- 함수: `renderTeamGoalsScreen`·`collapseAllTeamGoalAccordions`(index.html), `bindEvents`·`renderTeamCardContent`(js/team-visibility-levels.js).
- 파일: `index.html`, `tests/team-tasks-toggle-es410.test.js`, `scripts/test-shipyard-modular.js`, `reports/TASK-ES-410/**`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

수치는 `reports/TASK-ES-410/test-compare.json`·`scenario-local.json` 을 인용한다.

| 측정 | 방법 | 결과 |
| :-- | :-- | :-- |
| 게스트 시나리오 — 세부 할 일 펼침·접힘 | court/lib/scenario.js 로컬 예비 실행 | 기준: 단계 15(상자 보임) 실패 · 작업: 20단계 통과 |
| 부품 시험 | `node tests/team-tasks-toggle-es410.test.js`(기준 사본에 같은 파일 복사) | 기준 종료 1(A1 실패) · 작업 종료 0(5개 성립) |
| npm test | 기준·작업 | smoke 443/0 · 무결성 38/38 같음, 둘 다 종료 0 |
| tests/ 종료 코드 | 기준 104개·작업 105개 각각 실행 | 기준과 다른 파일 0, 추가 1개(종료 0) |
