# REQ — #TASK-ES-370 목표 탭 메인 렌더를 js/tabs/goals/ 세포로 옮기기 (동작 그대로)

- 근거: `docs/architecture/MODULE-BLUEPRINT.md` 8절 쪼개는 순서, 틀 `docs/specs/MODULE-SPLIT-PROTOCOL.md` 4절("로그인 흐름이 많은 목표·소통은 실계정 확인(CORE-02) 뒤"). 선례: 설정 #666(TASK-ES-354, 800줄 넘는 화면 함수의 섹션 분할), 기록 #671(TASK-ES-358), 일정 #673(TASK-ES-360, 생성기·검사기·조작 비교의 틀). 시험지 합본 읽기 #669·#670·#681.
- 범위: `index.html` 인라인 IIFE 의 목표 탭 메인 렌더 `renderGoalsScreen`(이전 전 24185~25228, 1,044줄)과 그것만 쓰는 렌더 헬퍼 `resultBadgeHtml`·`formatDateTimeBadge` → `js/tabs/goals/render.js`·`goal-detail.js`·`goal-detail-events.js`. 통로는 기존 `js/core/app-scope.js`(바꾸지 않음).
- 기능 추가·삭제 0. 마크업(HTML)·CSS 는 옮기지 않았다. 다른 탭 코드, `loadProfile`·`loginWithDirectIdentifier`·`migrateGuestDataToUser`·`syncServerRecords`·`performLogout`, `js/team-*`·`js/tabs/comm/*`, `js/theme-system.js`·`ui.css` 는 건드리지 않았다.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. index.html 인라인 스크립트 안의 목표 탭 렌더 함수와 그것만 쓰는 헬퍼를 `js/tabs/goals/` 세포로 옮긴다. 화면 결과 전후 차이 0.
2. 범위가 크면 책임 단위로 나눠 이번 PR 은 목표 탭 메인 렌더 묶음까지만 하고 나머지는 보고한다. 새 파일은 800줄 이하, `part1/part2` 같은 줄 수 분할 금지.
3. 목표 탭은 로그인 흐름이 많아 게스트 실측만으로는 회귀를 못 잡는다 — 실계정 하네스의 목표 시나리오(`RA-GOALS-*`)를 이전 전(운영)·이전 후(로컬)로 돌려 같거나 나은지 본다.
4. 신고서(`modules.json`)는 `module-specs --write`, 자리는 `goal.template`·`goal.detail` 중 실제로 꽂는 것만(아니면 planned). 모듈 가드 통과·기준선 낮춤. 동결 파일·기대값 변경 0, retire 0.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 목표 탭이 그려지는 코드가 3만 8천 줄짜리 index.html 한 덩어리 안에 있어, 목표 탭을 고칠 때마다 다른 탭과 같은 파일·같은 스코프를 만진다(충돌·회귀의 원천).
- **원인**: 목표 탭 껍데기 세포(`js/tabs/goals/sub-personal.js` 등)는 `window.renderGoalsScreen` 에 위임만 하고, 실제 렌더 코드는 IIFE 지역 스코프 이름(state·saveProfile·toast·escapeHtml … 52개)에 묶여 있었다. 게다가 `renderGoalsScreen` 한 함수가 1,044줄이라 그대로 한 파일로 옮기면 800줄 상한을 넘는다.
- **중심**: `renderGoalsScreen` — 머리(서브탭 칩·서브탭 분기·목표 칩·편집 토글·빈 상태, 이른 `return` 7곳), 상세 마크업(마일스톤 목록·진행 요약·AI 상태 요약 미니바·내보내기 카드 → `#goalDetailBody`), 상세 이벤트 배선(마감일·공개 범위·필터·선택·마일스톤 행·할 일 체크·일정·캘린더 동기화·마일스톤 추가).
- **핵심**: 글자 그대로 옮기고 이름 참조만 `L.<이름>`(app-scope getter)·`K.<이름>`(목표 키트 `OurgoalGoalsKit`)으로 바꾼다. 800줄을 넘는 함수는 설정 탭 선례처럼 책임 단위 구간으로 나누되, 구간을 넘는 지역 변수는 인자·반환값으로만 넘기고 재대입이 없음을 생성기가 검사한다.

## 3. [원칙 ③] 해결방식

- 생성기 `docs/design/harness/module-split/gen-goals.js`: 일정 `gen-calendar.js` 를 복제하고 설정 `gen-settings.js` 의 구간 분할을 더했다. 손으로 옮긴 글자 0.
  - 구간 경계는 줄 수가 아니라 문(statement)으로 정한다: 머리 끝 = `if(!goal){ … return; }`(이 뒤로는 renderGoalsScreen 자신의 `return` 이 없다), 상세 마크업 끝 = 최상위 `body.innerHTML = …` 한 문.
  - 생성기 검사: ① 경계가 문을 가르지 않음 ② 지역 변수 교차는 정한 이름·방향만(머리→상세: `goal`·`body`, 머리→이벤트: `goal`·`body`, 상세→이벤트: `allCollapsed`·`goalStatusHash`·`isDateStale`·`goalStatusStale`), 모두 재대입 0 ③ 옮기는 두 구간에 renderGoalsScreen 자신의 `return`·`this`·`arguments`·`await` 0 ④ 옮긴 이름의 재대입·중복 선언 0, 옮긴 코드 밖 참조는 가져오기 목록(`renderGoalsScreen`)뿐 ⑤ 앞선 이음매(설정·기록·일정)가 이미 노출한 이름은 다시 달지 않음.
  - 같은 함수 안 `var totalMs` 두 번 선언(이전 전 24390·24465)은 두 줄 모두 상세 마크업 구간 안에 있어 같은 뜻으로 옮겨졌다(버그 그대로 — 고치는 것은 별도 티켓).
- 결과 파일(모두 800줄 이하, 책임 단위):
  - `js/tabs/goals/render.js`(225줄): `renderGoalsScreen` = 머리(이전 전 24186~24379) + `K.renderGoalDetailBody(goal, body)` → `K.wireGoalDetailEvents(goal, body, …4개)` 를 원래 순서로 부르는 조립자
  - `js/tabs/goals/goal-detail.js`(441줄): `resultBadgeHtml` · `formatDateTimeBadge` · `renderGoalDetailBody`(이전 전 24380~24770, 끝에 다음 구간이 쓰는 지역 변수 4개를 돌려주는 `return` 한 줄만 덧붙임)
  - `js/tabs/goals/goal-detail-events.js`(483줄): `wireGoalDetailEvents`(이전 전 24771~25228)
- index.html IIFE 머리: 일정 이음매(#TASK-ES-360) 다음에 목표 이음매 — `var _goalsKit = window.OurgoalGoalsKit; var renderGoalsScreen = _goalsKit.renderGoalsScreen;` + `window.OurgoalAppScope.expose('index.html', { getter 35개 })`. 옮긴 코드가 쓰는 52개 이름 중 17개는 앞 이음매가 이미 노출. 옮긴 코드가 이름 자체에 대입하는 인라인 이름은 0(`state.goalsSubTab = …` 같은 속성 대입뿐) → 새 setter 0.
- `window.renderGoalsScreen = renderGoalsScreen` 노출 줄은 원래 자리 그대로. 다른 파일(`js/components.js` 등 20여 곳)은 이전 전처럼 `win.renderGoalsScreen` 을 찾는다.
- `<script>`: 목표 파일 3개는 `sub-team.js` 다음·`js/tabs/goals/index.js` 앞(인라인 IIFE 보다 먼저 읽힘).

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- **이번에 옮기지 않은 목표 탭 범위**(다음 PR — 각각 다른 책임 단위): 결과 입력 모달 `openResultModal`(349줄, 목표 상세만 씀), 프롬프트 백과사전 묶음(`renderPromptEncyclopediaHtml`·`wirePromptEncyclopediaEvents`·`openAddUserPromptModal`·`getUserPrompts`·`getLikedPromptIds`·`getPromptLikesMap`·`_promptTabState`·`_promptEncyclopediaOpen`, 약 460줄 — 상태 변수 재대입이 있어 묶음째 옮겨야 함), 내보내기·보관 묶음(`exportGoalSnapshot`·`buildGoalSnapshot`·`goalSnapshotSummary`·`archiveGoal`·`openGoalCertificateModal`), 서브탭 화면들(`renderTeamGoalsScreen` 771줄·`renderRoutineGoalsScreen` 402줄·`renderTemplateEncyclopediaScreen` 479줄·`renderGoalStatsChart`·`renderRoutineMatrixGrid`), 목표 순서(`sortGoalsByOrder`·`shiftGoalOrder` — 홈도 씀, `sortGoalsByOrder` 는 smoke-test FN_NAMES), `renderPersonalGoalsEmptyGuideHtml`(다른 곳도 씀).
- 공용 헬퍼를 `js/core/ui-helpers.js` 로 옮기는 단계는 하지 않았다(지시 범위 밖). `escapeHtml` 은 이미 거기 있고 L 통로로 같은 함수를 읽는다.
- 소블록(`sub-personal` 등)은 여전히 `window.renderGoalsScreen` 에 위임하는 껍데기다. `goal.detail` 자리에 실제로 꽂는 일(`slots.contribute`)은 등록 순서·오류 경로가 바뀌므로 하지 않았다 → 신고서 `planned.contributes`.
- 키트 전역 `window.OurgoalGoalsKit` 하나가 새로 생긴다(일정 `OurgoalCalendarKit`·설정 `OurgoalSettingsKit` 과 같은 틀). 옮긴 함수 이름(`renderGoalDetailBody` 등)은 window 에 달지 않았다.

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/goals-cell`(브랜치 `feat/2026-10-05-task-es-370-goals-cell`, 기준 origin/main 57bf33e) → 직전 커밋·선례 정독 → 대상 확정(바인딩 참조 분석) → 기준 앱 풀기(`git archive 57bf33e`) → 생성기 → 글자·누수 검사 → 신고서·가드 → `npm test`(기준·후) → 조작 비교(기준 2회·후 1회) → 기준 2회·후 1회 tab-check → 실계정 RA-GOALS-03(운영·로컬 기준·로컬 후) + 로그인 상태 목표 탭 조작 비교 → 법정 형식 게스트 시나리오 기준·후 → 문서 → PR → 법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "1,044줄 함수를 세 함수로 나누면 `var` 끌어올림·클로저 공유가 바뀌어 동작이 달라진다." → 생성기가 renderGoalsScreen 지역 바인딩 전부를 선언·참조·대입 위치로 세어, 두 구간에 걸치는 것은 정한 6개뿐이고 모두 재대입 0 임을 확인했다. 재대입이 없으니 인자·반환값으로 넘겨도 클로저가 읽는 값은 같다(`goal` 은 같은 객체를 가리키고 속성 변경은 그대로 공유된다). 구간 함수 안의 `var` 끌어올림은 그 구간 안에서만 쓰이는 이름이라 영향이 없다. 결과: `verify-goals.js` 가 세 파일을 이어 붙인 토큰열(9,190개)이 이전 전 renderGoalsScreen 과 같음을, 조립자가 덧붙인 두 문과 반환 문의 모양을 확인했다.
- 반론 2: "구간 안에 `return` 이 있으면 구간 함수만 끝나고 조립자는 계속 돈다." → 이른 `return` 7곳(`#goalsSubtabs` 없음 1·서브탭 분기 5·`!goal` 1)은 모두 머리에 있고 머리는 조립자 renderGoalsScreen 안에 그대로 남았다. 옮긴 두 구간에는 renderGoalsScreen 자신의 `return`·`this`·`arguments`·`await` 가 0 임을 생성기가 검사한다(중첩 함수 안 것은 제외).
- 반론 3: "게스트 시드로는 로그인 상태 차이를 못 잡는다." → 실계정 A(운영 Supabase)로 로컬 기준·후 앱에 각각 로그인해 목표 탭 조작 20단계(표식 목표 만들기 → 칩 선택 → 편집 → 마일스톤 2개 추가 → 필터·보기·접기·밀도·상태 요약 → 선택 → 팀·팀 연계·루틴·개인 서브탭 → 다시 그리기)의 `#screen-goals` HTML·상태를 맞댔다: 120값 중 다른 값 0. 표식 목표는 끝에 지우고 남은 0건을 셌다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM(옮긴 코드가 그리고 잇는 곳, 마크업 자체는 index.html 그대로): `#screen-goals`, `#goalsStickySubnav .goals-subtab-chip`(`#btnGoalsSubPersonal`·`#btnGoalsSubRoutine` …), `#goalsSubtabs [data-gsub]`, `#goalsHeadlineSentence`, `#sanctuaryGoalsView`·`#personalGoalsView`·`#routineGoalsView`·`#teamGoalsView`·`#templateEncyclopediaView`·`#statsGoalsView`, `#goalChipRow [data-chip]`·`#chipAdd`, `#goalEditToggle`, `#goalDetailBody`, `#msFilterToggle`·`#msViewToggle`·`#msCollapseAllBtn`·`#msDensityToggleBtn`·`#goalStatusToggleBtn`, `#goalDueInput`·`#goalVisInput`·`#goalsPrivacyBadge`, `#selAllBtn`·`#selDeleteBtn`·`#selDeleteAllBtn`, `#goalResultBtn`·`#goalExportBtn`·`#goalExportAllBtn`·`#goalArchiveBtn`·`#addMsBtn`, `.ms-row`·`[data-taskcheck]`·`[data-setschedule]`·`[data-calsyncgoal]`.
- 함수: `renderGoalsScreen`, `renderGoalDetailBody`, `wireGoalDetailEvents`, `resultBadgeHtml`, `formatDateTimeBadge`, `OurgoalAppScope.expose`, `OurgoalGoalsKit`.
- 파일: `index.html`, `js/tabs/goals/render.js`·`goal-detail.js`·`goal-detail-events.js`, `docs/architecture/modules.json`·`module-baseline.json`, `docs/design/harness/module-split/gen-goals.js`·`verify-goals.js`·`dom-compare-goals.js`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

기준 = origin/main 57bf33e(`git archive` 사본). 결과 파일은 `reports/TASK-ES-370/`.

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자 동일 | `verify-goals.js` | renderGoalsScreen 9,190 토큰(세 파일 이어 붙여 비교)·resultBadgeHtml 122·formatDateTimeBadge 62 전부 동일(L./K. 접두 제외), 조립자 두 문·반환 문 모양 일치, 누수 0·미노출 0·남은 정의 0·안 가져온 사용 0 (`verify-goals.json` `ok: true`) |
| 조작 전후(게스트) | `dom-compare-goals.js` | 36단계(목표 칩 2·필터 2·보기 2·접기 2·밀도·상태 요약·완료 할 일 접기·할 일 체크·마일스톤 행·결과 모달·편집 켜기·칩 순서·마일스톤 선택·전체 선택·마감일·공개 범위·마일스톤 추가·편집 끄기·내보내기·새 목표 시트·서브탭 6·탭 왕복·다시 그리기) × 11칸 = 396값, 기준 대 후 다른 값 0, 기준 대 기준(본질 변동) 다른 값 0, 콘솔 오류 0/0/0. 지운 값: 시간·난수, 마일스톤 추가가 만든 id(`uid('ms')`), 목표 상태 요약 캐시의 hash(그 id 를 섞어 만듦), 저장값 객체 키 순서(비동기 도착 순) |
| 탭 실측 | `tab-check.js … goals` 기준 2회·후 1회 → `tab-compare.js` | 아래 「탭 실측」 줄 |
| 실계정 RA-GOALS-03 | `real-account-check.js --only RA-GOALS-03` | 운영(이전 전) **통과** · 로컬 127.0.0.2 + /api 운영 전달 기준 사본 **통과** · 같은 방식 이 변경 **통과**(세 번 모두 `onA2: true`, 정리 goals 1행 삭제·남은 0). 주소·계정 가림 |
| 실계정 로그인 상태 조작 | 작업자 보조 스크립트(같은 로컬 방식, 계정 A) | 20단계 × 6칸 = 120값, 다른 값 0. 콘솔 오류 기준 48 = 후 48(같은 종류 — 정적 서버에 없는 자원 404). 표식 목표 각 1개 만들고 지움, 남은 0 (`real-account-goals-dom-compare.json`) |
| 화면 시나리오(법정 형식) | `court/lib/scenario.js` runScenario, 법정 정적 서버·무작위 호스트 | `goals-subtab-routine`·`goals-new-goal-milestone` 기준·후 모두 통과, 약점 0 |
| 모듈 가드 | `node scripts/module-guard.js` | ① 인라인 스크립트 35,822 → 34,806(-1,016) · ② 함수 선언 691 → 686 · ③ 282 그대로 · ④ 11 그대로 · ⑤ 0. 기준선 낮춤(`--update`) |
| index.html 전체 줄 | wc -l | 38,198 → 37,185 |
| 새 파일 줄 수 | wc -l | render.js 225 · goal-detail.js 441 · goal-detail-events.js 483 (모두 800 이하) |
| npm test | `NODE_PATH=… npm test` | 기준·후 같음 — smoke-test 443/443 · verify-integrity-gate 38/38 · verify-all-clicks 957/957 · test-shipyard-modular 통과 |

폐기(retire) 청구 없음. 시험 기대값 변경 0. 동결 파일 변경 0.

확인 못 함: 실제 폰(레벨 6), 팀장·팀원 계정의 팀목표 서브탭 내용(계정 A 는 팀 없음 — 그 화면은 이번에 옮기지 않은 `renderTeamGoalsScreen` 이 그림), 구글 캘린더 연동 상태의 `[data-calsyncgoal]` 동기화(외부 OAuth), AI 상태 요약 실서버 응답 문구(게스트·실계정 모두 로컬 요약 경로).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
