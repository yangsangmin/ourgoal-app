# REQ — #TASK-ES-402 팀 세포 쪼개기 3차: 800줄을 조금 넘는 팀 파일 3개에서 묶음 하나씩 떼기 (동작 그대로)

- 근거: 코디네이터 지시(2026-10-05) — `js/team-visibility-levels.js`(837)·`js/team-leader-check.js`(975)·`js/team-linked-goals.js`(982)를 각각 800줄 이하로. 선례 #701·#705(팀 1·2차)·#712(통계 1차, index.html 같은 줄 태그)·#713(아바타). 선행 시험지 #715(TASK-ES-403, 팀 목표 합본 — 병합됨).
- 범위(책임 단위 3묶음, 함수 4개):
  ① `js/team-visibility-levels.js` → `js/team-level-group-modal.js` — 수준별 조 상세 모달 `openLevelGroupDetailModal`
  ② `js/team-leader-check.js` → `js/team-member-review.js` — 팀장의 팀원 점검 모달 `openLeaderStampSelectModal`·`openMemberProgressDetailModal`
  ③ `js/team-linked-goals.js` → `js/team-linked-goals-screen.js` — 팀 연계 개인목표 워크스페이스 화면 `renderTeamLinkedGoalsScreen`
- 기능 추가·삭제 0, 버그 수정 0. 전역 노출(`window.OurgoalTeamVisibilityLevels`·`OurgoalTeamLeaderCheck`·`OurgoalTeamLinkedGoals` 키와 순서)·호출 순서·동작 그대로. 새 전역 1개(키트 `window.OurgoalTeamGoalsKit`).

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 세 파일에서 응집된 책임 묶음 하나씩을 새 파일(800줄 이하, part1/part2 이름 금지, 하는 일 이름)로 뗀다. 전역 노출·호출 순서·동작 그대로.
2. 선례의 REQ·생성기(글자 그대로)·verify(토큰 동일·누수 0)·dom-compare 방식을 따른다. index.html 태그는 원본 태그 앞 같은 줄(순증가 0줄).
3. 시험지가 원본 한 파일만 읽어 깨지면 기대값을 바꾸지 않고 범위만 넓히는 시험지 선행 PR 을 먼저 — #715(TASK-ES-403)로 올렸고 병합됐다(ea70e75). 그 뒤 main 을 합쳐 이 PR.
4. 증명: `git archive` 기준 사본(stash 금지) 대비 토큰 동일, 탭 실측 기준 2회·후 1회 차이 0, npm test 통과 수 동일, 로그인 화면은 로컬 127.0.0.2 + /api 운영 전달 실계정.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- 본질: 세 파일 모두 "화면 렌더·이벤트 묶음 + 그 화면에서 여는 큰 모달/작업 화면 하나"가 한 IIFE 에 같이 있다. 쪼개는 단위는 화면 입구가 따로인 큰 함수 묶음 — 같이 바뀌는 코드다.
- 원인(측정): 함수별 줄 수 — `openLevelGroupDetailModal` 305줄(파일의 36%), `openLeaderStampSelectModal`+`openMemberProgressDetailModal` 262줄(이어 붙어 있음, 팀원 한 명을 점검하는 두 모달 — 상세 모달 안의 「확인 도장」 버튼이 도장 모달을 연다), `renderTeamLinkedGoalsScreen` 402줄(자기 자신만 다시 부르는 화면 함수).
- 중심: 상태는 **원본에 그대로 둔다**. 옮긴 코드는 키트 칸 `OurgoalTeamGoalsKit.<칸>.scope` 의 getter 로 원본 스코프 이름을 읽는다. 이번 묶음은 원본 상태에 대입하지 않아 setter 0개(검사기가 잼).
- 핵심 제약: 기준 시험지가 세 원본 글자를 직접 읽었다 → #715 가 「팀 목표 합본」(원본 + `OurgoalTeamGoalsKit` 표식·원본 칸 대입이 있는 `js/team-*.js`)을 읽게 했다. 부품 머리는 그 표식(`var K = KIT.<칸> = KIT.<칸> || {};`)을 쓴다.

## 3. [원칙 ③] 해결방식

- 생성기 `docs/design/harness/module-split/gen-team-split-3.js`: `@babel/traverse` 스코프 분석으로 옮길 함수가 읽는 원본 IIFE 이름을 뽑아 `T.<이름>` 으로 바꾼다(같은 파일 안 호출·IIFE 인자 `global` 은 그대로). 함수 바로 위 붙은 주석 함께, 원본 그 자리에 한 줄 안내 주석.
- 원본 머리 이음매('use strict' 바로 다음): `var _goalsKit = global.OurgoalTeamGoalsKit && global.OurgoalTeamGoalsKit.<칸>;` → node 에서는 `require('./<부품>.js')`(부품 `module.exports` = 그 칸) → `var <함수> = _goalsKit.<함수>;`(함수 선언 끌어올림과 같은 효과 — 이 줄보다 먼저 도는 문이 없다) → `Object.defineProperties(_goalsKit.scope, …)` getter 통로(①14 ②3 ③11개).
- `team-linked-goals.js` 는 IIFE 인자가 node 에서 `this`(= module.exports)라 키트를 전역이 아니라 require 반환값으로 받는다(브라우저는 window). `scripts/test-team-linked-goals.js` 처럼 require 없이 원본만 실행하면 키트가 비어 `renderTeamLinkedGoalsScreen` 만 undefined — 그 시험은 그 함수를 부르지 않아 8/8 그대로.
- 원본에 남긴 것: 상태(`_deps`·`_ctx`·`activeFilter` 등), 공용 함수(`esc`·`getGroupState`·`getProfile`…), 노출 객체와 키 순서, `module.exports`·`global.Ourgoal…` 대입 — 자리·순서 그대로.
- `index.html`: 원본 태그 바로 앞 같은 줄에 새 태그 3개(순증가 0줄). 원본 태그 글자는 시험이 고정하므로 그대로.
- 위치 [기본값]: `js/` 바로 아래(1·2차와 같은 이유 — `js/tabs/**` 는 #TASK-ES-155 단언, `js/<폴더>/` 는 verify-all-clicks 범위 밖).
- 키트 [기본값]: 원본마다 전역을 따로 두지 않고 `OurgoalTeamGoalsKit` 하나에 칸 셋(`visibilityLevels`·`leaderCheck`·`linkedGoals`) — 새 전역 1개(통계 #712 와 같은 수).

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 줄 수: 837 → 554, 975 → 728, 982 → 602. 새 파일 331·286·425줄. 세 원본 모두 800줄 이하 → 모듈 가드 ④ 8 → 5.
- 게스트 조작 비교에서 누르지 못한 단계(기준·작업 같음): 확인창이 뜨지 않는 삭제(조 할 일·마일스톤 삭제는 바로 지움 → `*-ok` 단계 'no-btn'), `[data-tgcopyteamlevels]`(목표별 조가 이미 있으면 버튼이 없음), 상세 점검 모달의 「응원 찌르기」·「동반자 추가」·「DM」(체험 팀원 상태에서 버튼이 그려지지 않음), 팀 연계 화면의 할 일 단계(복사된 목표 마일스톤에 할 일 0개).
- 실계정: 테스트 계정 A 가 팀이 없어 수준별 조 모달·팀원 점검 모달은 로그인 화면에서 열리지 않았다(팀 서브탭 빈 화면·팀 연계 서브탭·노출 객체 키만 비교). 두 모달은 게스트 조작 비교에서 열고 눌렀다. 실계정 확인은 읽기만 — 쓴 행 0, 정리할 행 0.
- 새로 본 기존 결함(기준·작업 같음, 고치지 않음 — 별도 티켓): 팀 카드 「팀 수준별 목표 관리」 아코디언 머리(`[data-tglevelaccordion]`)를 진짜 클릭으로 눌러도 펼쳐지지 않는다. 클릭 처리기가 `foldLevelSection` 을 뒤집고 다시 그리지만, 렌더 뒤 `collapseAllTeamGoalAccordions`(index.html 24919 · js/components.js 3524·3580)가 `[data-tglevelbody]` 를 다시 `display:none` 으로 덮는다(실측: 두 번째 클릭 뒤 저장값 false 인데 본문 style `display: none;`). 그래서 수준별 조 상세 모달은 게스트가 마우스로 여는 길이 없어 화면 시나리오로 청구하지 못했고, 게스트 조작 비교(스크립트 클릭)로만 쟀다. 팀장 점검 모달도 게스트가 팀장이 되는 클릭 경로가 없어 같은 방식으로 쟀다.
- `scripts/verify-integrity-gate.js`(금고)의 `team-linked-goals.js` `잔디` 부재 검사는 원본 한 파일만 본다 — 부품의 같은 글자는 검사기가 따로 쟀다(0).

## 5. [원칙 ⑤] 절차

1. 묶음 선정(함수 줄 수·호출 관계·시험 글자) → 2. 생성기 → 3. 모의 이전으로 기준 시험지 실패 확인(440/443) → 시험지 선행 #715 → 병합 뒤 origin/main 합침. 도중에 #716·#717·#718 이 main 에 들어와 원본 3개·index.html 을 main 판으로 되돌리고 main(a9427b7)을 합친 뒤 생성기를 다시 돌렸고, 기준 사본도 그 커밋 `git archive` 로 바꿔 4~8 단계를 모두 다시 쟀다(8절 수치는 그 기준) → 4. `verify-team-split-3.js` → 5. `module-specs --write` → `spec-team-split-3.js`(손 칸 kind·role·spans, 원본 세포 값 읽음) → `module-specs --write` → `module-guard --update` → 6. 게스트 조작 비교 `dom-compare-team-3.js`(기준 2회·후 1회) + `tab-check.js goals,comm`(기준 2회·후 1회) + 법정 모듈 로드 탐침(로컬) → 7. 실계정 `real-account-team-3.js`(기준1·작업·기준2) → 8. npm test·tests 기준·작업 → 9. REQ·claims·dev_log·TICKETS·PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "키트 전역 하나가 늘었다 — 원칙 4(전역 이름을 늘리지 않는다) 위반 아닌가." → 원칙 4 가 막는 것은 옮긴 함수를 `window` 에 새로 달아 그 이름을 찾던 다른 파일의 분기가 새로 도는 일이다. 옮긴 함수 4개는 window 에 달리지 않고(검사기: window 새 이름 = 키트 1개뿐), 키트 이름은 어느 파일도 찾지 않는다. 2차 `OurgoalTeamCommKit`·통계 `OurgoalUniversalStatsKit` 와 같은 꼴이다.
- 반론 2: "팀장 점검 모달 둘을 한 파일로 묶은 것은 줄 수 맞추기다." → 상세 점검 모달 안의 「확인 도장」이 도장 선택 모달을 부르는 한 흐름(팀원 한 명을 점검)이고 원본에서도 이어 붙어 있다. 줄 수만 보면 상세 모달 하나만 옮겨도 800 이하가 되지만, 도장 모달이 원본에 남으면 부품 → 원본 역방향 통로가 하나 더 생긴다(지금은 `T.` 통로 3개뿐).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- `js/team-level-group-modal.js`(331줄) — `openLevelGroupDetailModal(gid, lgId, tgid)`, DOM `#modalLgNameInput`·`#modalSaveLgNameBtn`·`#modalAddLgGoalBtn`·`#modalDelLgBtn`·`#modalCloseLgBtn`·`[data-lgaddms]`·`[data-lgaddtask]`·`[data-lgtoggletask]`·`[data-lgcyclestatus]`·`[data-lgdelgoal]`·`[data-lgdelms]`·`[data-lgdeltask]`.
- `js/team-member-review.js`(286줄) — `openLeaderStampSelectModal(gid, memberName, deps)`·`openMemberProgressDetailModal(gid, memberName, deps)`, DOM `[data-selectstamp]`·`#closeStampModalBtn`·`#leaderFbInput`·`#sendLeaderFbBtn`·`#btnStampInDetail`·`#btnNudgeMemberInDetail`·`#btnAddCompanionInDetail`·`#btnDmMemberInDetail`·`#closeDetailModalBtn`.
- `js/team-linked-goals-screen.js`(425줄) — `renderTeamLinkedGoalsScreen(containerEl)`, DOM `#teamLinkedGoalsView`·`#tlSampleShowcaseCard`·`#btnToggleTlEdit`·`#tlGoalTitleInput`·`#btnAddTlMs`·`#btnTlDoneInline`·`#btnDeleteTlGoal`·`#btnGoToTeamOrigin`·`#btnExploreMoreTeamGoals`·`#btnGoToTeamGoalsExplore`·`[data-tlchip]`·`[data-tlcyclems]`·`[data-tlmstitle]`·`[data-tlmsdel]`.
- 원본 이음매 `_goalsKit`·`Object.defineProperties(_goalsKit.scope || (_goalsKit.scope = {}), …)`.
- 도구: `gen-team-split-3.js`·`verify-team-split-3.js`·`spec-team-split-3.js`·`dom-compare-team-3.js`·`real-account-team-3.js`(모두 `docs/design/harness/module-split/`).
- 신고서: `docs/architecture/modules.json` 새 세포 3개(hybrid, spans goals·comm — 원본 값), 기준선 `docs/architecture/module-baseline.json` ④ 세 파일 항목 없어짐.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자 동일 | `verify-team-split-3.js` | 4개 함수 토큰열 동일(`T.` 접두·주석 제외), 누수 0·미노출 0·노출됐는데 안 씀 0·setter 0(대입 0)·원본에 남은 정의 0·안 가져온 함수 0, 원본·부품 모두 800줄 이하, 부품 `잔디` 0. 실행: 세 노출 객체 키·순서 동일(브라우저 순서 vm·node require 둘 다), 옮긴 함수 = 키트 함수, window 새 이름 = `OurgoalTeamGoalsKit` 1개 — `reports/TASK-ES-402/verify-team-split-3.json` `ok: true` |
| npm test | `NODE_PATH=… npm test` 기준(`git archive`)·작업 | smoke 443/0(검사 제목·결과 목록 동일) · 무결성 38/38 · 버튼 943/943 · 셀 구조 통과 같음, 모듈 가드 ④ 8 → 5 — `reports/TASK-ES-402/test-compare.json` |
| tests 전부 | `tests/*.test.js` 100개 + `scripts/test-team-linked-goals.js` 기준·작업 | 종료 코드 101/101 같음(27개는 기준에서도 실패 — 기존). 경로·시간을 지운 출력 차이 2개(`avatar-personas-split`·`goal-templates-data-split`)는 기준 사본에 `.git` 이 없어 git 대조 줄이 바뀌는 기존 차이 |
| 법정 모듈 로드 탐침 | `court/probes/module-load.js`(로컬 호출) | 회귀 0, 새 파일 3개 단독 로드 성공 |
| 조작 전후(게스트) | `dom-compare-team-3.js`(기준 2회·후 1회) | 91단계 × 12칸 = 1,092값(77단계에서 실제로 누름), 기준 대 후 0, 기준 대 기준 0, 콘솔 오류 0/0 — `reports/TASK-ES-402/dom-compare-team-3.json`. 같은 기준의 바로 앞 회차(`dom-compare-team-3-run1.json`)는 첫 2단계(목표 탭 진입·팀 서브탭) localStorage 에서 2값 다름 — 기준 쪽에만 `maxBaseCrafts`·`bonusCraftCredits`·`lastStreakAwarded` 가 먼저 써져 있던 저장 시점 차이(팀 코드와 무관한 설정 키, 3단계부터 같음), 다시 잰 회차 0 |
| 화면 시나리오(게스트, 법정 재실행용) | `reports/TASK-ES-402/scenarios/team-linked-goals-screen.json` 를 법정 실행기(`court/lib/scenario.js` runScenario)로 로컬 실행 | 기준·작업 모두 통과 |
| 탭 실측(게스트) | `tab-check.js goals,comm --deadclick off` 기준 2회·후 1회 → `tab-compare.js` | 816값, 기준 대 기준 0 · 기준1 대 작업 0 · 기준2 대 작업 0 |
| 실계정(읽기만) | `real-account-team-3.js`, 로컬 127.0.0.2 + /api 운영 전달, 테스트 계정 A | 기준1·작업·기준2 팀 서브탭·팀 연계 서브탭 글자 해시·속성 해시·노출 객체 키 해시 같음, pageerror 0 — `reports/TASK-ES-402/real-account-team-3.json` |
| 모듈 가드 | `node scripts/module-guard.js` | ④ 8 → 5, 기준선 낮춤(`--update`) |

폐기(retire) 청구 없음. 시험 기대값 변경 0. 동결 파일 변경 0. 시험 파일 변경 0(시험지 범위는 #715 에서).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
