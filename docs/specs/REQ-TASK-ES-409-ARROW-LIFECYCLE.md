# REQ — #TASK-ES-409 팀 카드 접기 표시가 저장값을 따르게 + 시간기록 수명주기 시험지 경로

- 근거: 코디네이터 지시(2026-10-05) — #721(TASK-ES-406) 빌더 발견: 「참가 팀원 달성 현황」 목록(`[data-tgparttoggle]`)은 일괄 접기가 접지 않는데 화살표 `rotated` 만 떼어 「목록은 펼침·화살표는 접힘」으로 보인다. #722(TASK-ES-407) 빌더 발견: `scripts/test-time-tracker-lifecycle.js` 가 기준 코드에서도 실패한다.
- 범위: `js/team-linked-goals.js`(판정 `isParticipantsOpen`), `js/team-visibility-levels.js`(판정 `isMsListOpen`), `index.html`(`collapseAllTeamGoalAccordions` 와 카드의 `[data-tgfoldlist]` 손잡이, 같은 줄 안 수정 — 줄 수 증가 0), `scripts/test-time-tracker-lifecycle.js`(시험 도구의 `require` 경로만).

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 참가 팀원 현황 화살표가 목록 상태와 일치하게 — #721 방식(저장값을 따르게). CSS 은폐·`!important` 금지, index.html 인라인 줄 수 증가 0.
2. 마일스톤 `.ms-list`: 일괄 접기가 저장값 `unfoldMsList` 를 무시하는 것이 의도인지 코드·커밋 이력으로 확인 — 사용자가 펼친 상태가 저장되는데 렌더마다 접히는 것이면 같은 방식으로 고친다.
3. `scripts/test-time-tracker-lifecycle.js`: 경로 해석만 고쳐 기준 코드에서 통과(단언·기대값 그대로, 지운 단언 0). npm test 경로에 있는지 보고(없으면 등록하지 않음).
4. 증명: 게스트 화면 시나리오(기준 실패·작업 통과), 부품 시험(npm test 경로, `process.exitCode`), 수명주기 시험지 기준 실패 → 작업 통과.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- 본질: 접기 상태 하나(프로필 저장값)를 렌더·클릭·일괄 접기 세 곳이 따로 판정한다. 일괄 접기(#TASK-ES-302)가 「모두 접힘」 한 규칙으로 덮어 저장값과 화면이 갈라졌다. 시험지는 eval 한 원본의 상대 `require` 를 원본이 아닌 시험지 위치로 풀었다.
- 원인(측정):
  ① 참가 팀원 현황: 렌더(`renderTeamGoalCardSections`)는 저장값 `foldParticipants[tgid]` 가 없으면 목록 `display:flex` + 화살표 `rotated` 로 그린다. `collapseAllTeamGoalAccordions` 은 목록(`.tg-p-list`)은 대상에 없는데 `.tg-accordion-arrow` 전부에서 `rotated` 를 뗀다 → 목록은 보이는데 화살표는 접힘(게스트 시나리오 기준 단계 10 `class="tg-accordion-arrow"`).
  ② 마일스톤 목록(두 겹): (가) 「마일스톤 펼치기 ▼」 버튼에 손잡이가 둘 — `index.html` 카드 루프(`tgEl.querySelectorAll('[data-tgfoldlist]')`, #TASK-ES-027)와 모듈 `bindEvents`(`js/team-visibility-levels.js`, #TASK-ES-258). 한 번 누르면 둘이 차례로 뒤집어 펼침이 바로 접히고 저장값도 false 로 돌아간다(죽은 클릭, 기준 시나리오 단계 12). (나) 그 손잡이를 하나로 해도, 다시 그릴 때 일괄 접기가 `unfoldMsList[tgid] === true` 인 목록까지 `display:none` 으로 덮고 버튼 글자를 「펼치기」로 바꾼다(손잡이만 고친 사본에서 단계 16 실패 — 작업자 측정).
  ③ 시험지: `eval(code)` 안의 `require('./core/confirm.js')`·`require('./time-tracker-screen.js')` 가 eval 을 부른 `scripts/` 파일 기준으로 풀려 MODULE_NOT_FOUND. ES-407 분열 뒤 기준(323f804)의 첫 오류는 `./time-tracker-screen.js`.
- 중심: 저장값 하나가 「펼침」을 정한다 — `isParticipantsOpen(tgid)`(저장값 true 가 아니면 펼침, 기본 펼침), `isMsListOpen(tgid)`(저장값 true 일 때만 펼침, 기본 접힘). 렌더·일괄 접기가 같은 판정을 쓴다.
- 핵심: 저장값이 없는 기본 상태는 #TASK-ES-302 그대로(마일스톤 접힘, 참가 팀원 목록 펼침 — 목록은 원래 일괄 접기 대상이 아님). 다른 아코디언(세부 할 일·댓글·조별 본문·details)은 건드리지 않는다.

### 마일스톤 판단 근거 — 의도된 기본 접힘이 아니라 결함으로 본 이유

- #TASK-ES-258(045b7fa, 2026-09-25) REQ 가 `unfoldMsList` 를 「화면 이동 후 재진입 시 상태가 초기화되는 피로감」을 없애려고 프로필 원장에 저장하도록 만들었다(렌더도 저장값이 참이면 펼쳐 그림).
- #TASK-ES-302(f225849, 2026-09-26) REQ 의 지시는 「최초 진입 시」 기본 접힘이다. 하지만 `collapseAllTeamGoalAccordions` 은 최초 진입이 아니라 `renderTeamGoalsScreen` 마다 불려, 사용자가 펼친 저장값까지 덮는다 — 같은 모양의 수준별 섹션(`foldLevelSection`)을 #721 이 결함으로 고쳤다.
- 따라서 저장값을 따르게 고친다(저장값 없으면 여전히 접힘).

## 3. [원칙 ③] 해결방식

- `js/team-linked-goals.js`: `function isParticipantsOpen(tgid)` 추가, 렌더의 `isFolded` 를 `!isParticipantsOpen(tg.id)` 로, 노출 객체에 `isParticipantsOpen` 키.
- `js/team-visibility-levels.js`: `function isMsListOpen(tgid)` 추가, 노출 객체에 `isMsListOpen` 키.
- `index.html` `collapseAllTeamGoalAccordions`: 첫 줄 끝에 지역 함수 `isTeamMsListOpen`·`isTeamParticipantsOpen`(모듈이 없으면 false = 예전 동작). 마일스톤 목록 줄은 `!isTeamMsListOpen(...)` 일 때만 접고, 버튼 글자 줄은 저장값대로, 화살표 줄은 `[data-tgparttoggle]` 머리 안 화살표면 저장값대로 `rotated` 를 맞추고 끝(#721 의 수준별 판정 글자는 그대로 둠).
- `index.html` 카드 `[data-tgfoldlist]` 손잡이: `if(!list || window.OurgoalTeamVisibilityLevels) return;` — 모듈이 같은 버튼을 이미 묶을 때는 비켜서 한 번만 뒤집힌다(모듈이 없을 때는 예전처럼 이 손잡이가 일함). `p.settings.unfoldMsList[id] = isHidden;` 글자(기존 시험들이 보는 글자)는 그대로.
- `scripts/test-time-tracker-lifecycle.js`: `Module.createRequire(js/time-tracker.js)` 로 만든 `require` 를 블록 안에 두고 그 안에서 `eval(code)`. 단언 37개·기대값·출력 그대로.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 이미 `foldParticipants`·`unfoldMsList` 가 저장된 사용자는 그 저장값대로 보인다 — 화면과 저장값이 일치하게 된 결과다.
- 세부 할 일 `[data-tgtoggletasks]` 도 index.html 카드 루프와 모듈 `bindEvents` 양쪽에 손잡이가 있다(같은 모양의 이중 뒤집기 의심). 이번 지시 범위 밖이라 고치지 않았고 재지도 않았다.
- `scripts/test-time-tracker-lifecycle.js` 는 npm test 경로(`smoke-test.js`·`verify-integrity-gate.js`·`verify-all-clicks.js`·`test-shipyard-modular.js`·`package.json`)에 없다 — 지시대로 등록하지 않았다. 출력의 기존 `✓` 줄은 단언·출력 그대로 두라는 지시라 바꾸지 않았다.
- 로그인 사용자 화면·실기기는 재지 않았다(저장 경로는 기존 `saveProfile` 그대로).

## 5. [원칙 ⑤] 절차

1. `git archive` 기준 사본(323f804) → 2. 게스트 탐침으로 기준 결함 측정(화살표·마일스톤) → 3. 수정 → 4. 부품 시험 `tests/team-fold-state-es409.test.js` 기준 사본·작업 → 5. 게스트 시나리오 2개 로컬 예비 실행(court/lib/scenario.js 그대로) → 6. 수명주기 시험지 기준·작업 → 7. npm test 기준·작업, tests/ 종료 코드 비교 → 8. REQ·claims·dev_log·TICKETS·PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "마일스톤은 #TASK-ES-302 가 「모두 접힘」을 지시했으니 의도다." → 격파: 그 지시는 「최초 진입 시」 기본 상태다. #TASK-ES-258 은 펼침을 저장해 재진입 때 유지하라고 만들었고, 일괄 접기는 렌더마다 돈다. 저장값이 없으면 여전히 접힘이라 두 지시를 다 지킨다(부품 시험 B1·B2).
- 반론 2: "index.html 카드 손잡이를 지우면 더 깔끔하다." → 격파: 그 손잡이는 모듈이 없을 때의 길이고, 기존 시험(`scripts/smoke-test.js`·`tests/team-level-management.test.js`)이 그 글자를 본다. 지우면 기능 삭제·시험 변경이 된다. 모듈이 있을 때만 비키게 하는 한 조건이 줄 수 증가 0·시험 변경 0 으로 이중 뒤집기를 끊는다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `[data-tgparttoggle="<gid>:<tgid>"]`(참가 팀원 머리), `[data-tgpartlist="<tgid>"]`(목록), `.tg-accordion-arrow`, `[data-tgfoldlist="<tgid>"]`(마일스톤 버튼), `[data-tgmslist="<tgid>"]`(마일스톤 목록), `#btnGoalsSubTeam`, `#btnGoalsSubTeamLinked`.
- 함수: `isParticipantsOpen`(신규, `js/team-linked-goals.js`), `isMsListOpen`(신규, `js/team-visibility-levels.js`), `renderTeamGoalCardSections`, `bindTeamGoalEvents`, `bindEvents`, `collapseAllTeamGoalAccordions`·`renderTeamGoalsScreen`(index.html).
- 파일: `js/team-linked-goals.js`, `js/team-visibility-levels.js`, `index.html`, `scripts/test-time-tracker-lifecycle.js`, `tests/team-fold-state-es409.test.js`, `scripts/test-shipyard-modular.js`(runNode 1줄), `reports/TASK-ES-409/**`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

수치는 `reports/TASK-ES-409/test-compare.json`·`scenario-local.json` 을 인용한다.

| 측정 | 방법 | 결과 |
| :-- | :-- | :-- |
| 부품 시험 | `node tests/team-fold-state-es409.test.js`(기준 사본에 같은 파일 복사) | 기준 종료 1(11개 중 6개 실패: A1·A2·A5·B2·B3·C1) · 작업 종료 0(11/11) |
| 게스트 시나리오 — 참가 팀원 화살표 | court/lib/scenario.js 로컬 예비 실행 | 기준: 단계 10(화살표 rotated) 실패 · 작업: 22단계 통과 |
| 게스트 시나리오 — 마일스톤 다시 그린 뒤 유지 | 같음 | 기준: 단계 12(펼친 목록 보임) 실패 · 작업: 21단계 통과 |
| 수명주기 시험지 | `node scripts/test-time-tracker-lifecycle.js` 각자 트리 | 기준 종료 1(MODULE_NOT_FOUND `./time-tracker-screen.js`) · 작업 종료 0(✓ 줄 15·ALL PASS), 단언 호출 37 → 37 |
| npm test | 기준·작업 | smoke 443/0 · 무결성 38/38 · 버튼 943 같음, tests/ 103개 종료 코드 기준과 차이 0 |
