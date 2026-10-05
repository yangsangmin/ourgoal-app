# REQ — #TASK-ES-514 숨김 기능 조사에서 나온 결함 수정(빠른 목표 추가 저장 · 템플릿백과사전 이중 처리기 · 성소 새 기록 중계 · 숨김 기준선 사유 정정)

- 근거: 코디네이터 지시(2026-10-06, 세션 f747dcaa) — 숨김 기능 조사 보고(scratchpad `unhidden-click.json`·`sum-click.txt`)에서 나온 결함 4건 + 문서 1건. 기준 작업참고 PR #801(76b1be5c).
- 유형 분류: (가) 표준 — 결함 수정(기준 실패·작업 통과 시나리오). 아래 「이탈 기록」 두 건은 (나) 이탈이며 사유 네 가지를 적었다.
- 승인선: 다섯 가지에 걸리지 않음(기능 삭제 0 — `#recAddBtn` 그대로, 시험 단언 변경 0, 돈·개인정보·바깥 행위·규범 변경 0).
- 범위(파일): `index.html`(handleGoalFastAddSubmit · `#btnGoalTemplateEncyclopedia` 마크업), `js/sanctuary-record-feed.js`, `js/sanctuary-v3-engine.js`, `docs/architecture/hidden-entry-sweep-baseline.json`(사유 문구), `docs/architecture/modules.json`(코드에서 뽑는 칸 `dependsOn` — `node scripts/module-specs.js --write` 산출), `reports/TASK-ES-514/**`.
- 지시 2번(`#btnCustomHomeLayout` 이중 처리기)은 별도 PR(#TASK-ES-531)로 냈다 — 이탈 기록 ②.

## 1. [원칙 ①] 문제 정확히 파악
- R1 `handleGoalFastAddSubmit`(index.html, 빠른 목표 추가 `#goalFastAddInput`·`#btnGoalFastAddSubmit`)는 `state.profile.goals.unshift(newGoal)` 뒤 토스트·`dispatchFullViewPropagation()` 만 하고 `saveProfile()` 을 부르지 않는다.
- R3 `#btnGoalTemplateEncyclopedia` 에 처리기가 두 벌: 인라인 `onclick`(openGoalTemplateEncyclopediaModal → window.openTemplateEncyclopediaModal) + index.html `btnHeaderTplEncycl.addEventListener('click', …)`(stopPropagation · `state.goalsSubTab='templateEncyclopedia'` · openTemplateEncyclopediaModal). 한 번 누르면 여는 함수가 두 번 돈다.
- R4 성소 기록 「+ 새 기록 작성」(히트맵 모드, js/sanctuary-v3-engine.js)·「+ 새 기록」(피드 머리 두 곳, js/sanctuary-record-feed.js)의 onclick 이 정의되지 않은 `window.openAddRecordModal` 을 먼저 보고, 없으니 숨은 `#recAddBtn`(index.html, `display:none !important`)을 `.click()` 으로 대신 누른다(중계).
- R5 `docs/architecture/hidden-entry-sweep-baseline.json` 의 `#levelBadgeRow > *` 사유가 「상민님 지시 TASK-ES-140 「아바타 레벨표시 제거」로 4테마 숨김」 — git 이력과 다르다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- 본질: 동작이 「우연한 배선」에 기대고 있다(저장은 다른 경로의 부수 저장에, 새 기록 창은 숨은 단추에, 템플릿 창은 겹친 두 처리기에).
- 원인: R1 — 빠른 추가 함수에 저장 호출이 빠짐. R3 — #TASK-ES-187/303 때 addEventListener 를 붙이면서 #53 의 인라인 onclick 을 지우지 않음. R4 — 노출된 적 없는 이름(openAddRecordModal)을 부르고 실패 경로로 숨은 단추에 기댐. R5 — 사유를 적을 때 커밋 이력 대신 비슷한 이름의 티켓을 인용.
- 중심: 각 단추의 처리기 한 벌과 저장 경로.
- 핵심: 처리기는 한 벌, 여는 함수는 노출된 이름으로 직접, 데이터 변경 뒤에는 saveProfile.

## 3. [원칙 ③] 해결방식
- R1 index.html `handleGoalFastAddSubmit`: 성공 토스트 줄 뒤에 `saveProfile().catch(…)` — 실패하면 콘솔 경고 + 「목표를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요」 토스트(L028). 목표 상세 서랍 마일스톤 토글(#TASK-ES-462)과 같은 꼴. 같은 줄에 붙여 인라인 줄 수 순증가 0.
- R3 index.html `#btnGoalTemplateEncyclopedia` 의 인라인 `onclick` 속성을 지우고 addEventListener 한 벌을 남김. 남긴 쪽이 지운 쪽의 동작(같은 창 `openTemplateEncyclopediaModal()` 을 기본 탭으로 엶)을 모두 포함하고 `goalsSubTab`·전파 차단까지 하므로 동작이 같다(CELL_SPLIT 6항).
- R4 세 단추의 onclick 을 `OurgoalRecordsKit.openRecordModal(null)` 직접 호출로 바꿈 — 숨은 `#recAddBtn` 의 처리기(index.html `openRecordModal(null)`)가 부르는 함수와 같은 함수(`js/tabs/records/weekly-recap.js` `K.openRecordModal`, index.html 이 `_recordsKit.openRecordModal` 로 가져오는 것). `#recAddBtn` 자체는 지우지 않음(삭제는 승인선 ③).
- R5 사유 문구만 정정: b2b79182(#TASK-UIUX-FOCUS-SANCTUARY, 2026-09-18) 성소 테마 숨김 → 3ecf8f00(#TASK-ES-186) 4테마로 넓힘. TASK-ES-140 은 아바타 창 `.avatar-lv-pill` 제거(2273963a REQ R1)로 「아바타 레벨표시 제거」 의도와 합치하지만 이 줄의 숨김 근거는 아님. 키 목록·다른 그룹 변경 0.

## 4. [원칙 ④] 재검토
- R1 실측(작업자, es514/trace3.js — 게스트, 진짜 페이지): 기준 커밋에서도 빠른 추가 목표는 새로 고침 뒤 남는다. 제출 뒤 약 300ms 안에 「오늘의 미션」(index.html requestTodayMission → `await saveProfile()`)·「AI 종합상황」(js/tabs/goals/ai-status-refresh.js → `await L.saveProfile()`) 부수 저장이 돌기 때문이다. 조사 보고의 `persistedAfterReload:false` 는 하네스 `shots-lib.js newPage` 의 `evaluateOnNewDocument`(새 문서마다 `localStorage.clear()` 후 시드 재주입)가 새로 고침 때 저장분을 지운 측정 착시다. 그래도 부수 저장은 생성 글이 비면(`if(!text) return;`) 건너뛰고 대기 표식(pending)이 있으면 돌지 않으므로, 빠른 추가가 스스로 저장하게 했다(GUARD_03·L029). 작업 커밋은 제출 직후(t+0) 기기 사본에 들어감을 같은 도구로 확인.
- R3 남긴 처리기는 `e.stopPropagation()` 을 한다 — 지운 인라인 onclick 은 같은 요소의 처리기라 순서만 앞섰을 뿐 전파에 영향 없음.
- R4 `OurgoalRecordsKit` 는 js/ 루트 세포에서 읽는 탭 키트 — `scripts/module-metrics.js` 의 탭 간 직접 참조(⑤)는 js/tabs/A → B 만 세므로 늘지 않음(모듈 가드 ⑤ 0 유지).
- 발견만(이번 범위 밖, 고치지 않음): js/sanctuary-v3-engine.js 히트맵 날짜 미리보기 「+ 기록」(선택 날짜에 기록 0건일 때)이 `window.openAddRecordModal` 만 부르는 죽은 클릭이다. 고치려면 선택 날짜를 새 기록에 넣을지(설계 결정)가 필요해 보고만 한다.

## 5. [원칙 ⑤] 절차
1. 기준(origin/main) 추출 사본·작업 트리에서 게스트 시나리오 3개를 로컬 법정 실행기(court/lib/scenario.js)로 돌림.
2. 처리기 수·여는 함수 실행 수를 작업자 하네스(puppeteer + CDP `DOMDebugger.getEventListeners`)로 기준·작업 측정 → `reports/TASK-ES-514/constraints.json`(스크립트 산출).
3. npm test·모듈 가드·숨김 게이트·module-specs.
4. origin/main 합치기 → push → PR → 판정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1: "R1 은 기준에서도 통과하니 고칠 게 없다 — 바꾸지 말아야 한다." → 격파: 지금 남는 것은 AI 요약·오늘의 미션이 부수적으로 저장하기 때문이다. 그 경로는 글이 비거나 대기 중이면 건너뛰고, 그 기능이 바뀌면 빠른 추가는 조용히 저장을 잃는다. 데이터 변경 함수가 스스로 저장하는 것이 GUARD_03 이며, 추가 호출은 같은 saveProfile 이라 동작 차이는 저장 시점이 앞당겨지는 것뿐이다. 판정은 「고칠 게 없었음」으로 정직하게 받는다.
- 반론 2: "R3 에서 인라인 onclick 대신 addEventListener 를 지워야 시험 글자(onclick)가 남는다." → 격파: 템플릿 단추의 onclick 글자를 고정한 시험은 없다(tests·smoke 전수 grep — `id="btnGoalTemplateEncyclopedia"`·`window.openGoalTemplateEncyclopediaModal = openTemplateEncyclopediaModal` 만 고정, 둘 다 남음). addEventListener 쪽이 `goalsSubTab` 을 바꾸므로 그쪽을 지우면 동작이 달라진다.

## 7. [원칙 ⑦] 단계별 실행 · 측정(작업자, 판정 아님)
- 시나리오(로컬 법정 실행기, 기준=origin/main 추출 사본 / 작업=이 브랜치): `goals-fast-add-persist` 기준 통과·작업 통과, `goals-template-encyclopedia-open` 기준 통과·작업 통과, `records-new-record-direct` 기준 통과·작업 통과(콘솔 예외 0). 세 개 모두 동작 동일 확인이며, 법정 판정은 「고칠 게 없었음」이 예상된다.
- 처리기 측정: `reports/TASK-ES-514/constraints.json` `templateEncyclopediaButton` — 기준 click 처리기 2벌·인라인 onclick 있음·여는 함수 2회, 작업 1벌·없음·1회, 양쪽 창 display flex·goalsSubTab 같음.
- 중계 제거: 같은 파일 `recAddBtnRelayLeftInSanctuaryCells` 0, `directOpenRecordModalInSanctuaryCells` 3.

## 8. [원칙 ⑧] 막히는 지점 · 성과 측정
- 세 시나리오 모두 기준에서도 통과 → 결함 PR 인데 「확인됨」이 0 건일 수 있다. 병합 여부는 오케스트레이터 판단(이탈 기록 ①).
- main 이동 시 dev_log.md·TICKETS.md 끝줄 충돌 → union 병합(L011).

## 이탈 기록 (작업참고 0-1 (나))
- ① 규칙: 지시의 「R1 시나리오 기준 실패·작업 통과」. 왜 안 맞나(사실): 기준에서도 부수 저장(오늘의 미션·AI 종합상황, 제출 뒤 ~300ms)으로 새로 고침 뒤 목표가 남는다 — 오프라인 변형(setOffline)으로도 남음(es514/probe-c). 조사 보고의 실패는 하네스가 새 문서마다 localStorage 를 지운 측정 착시. 대신 한 것: 같은 시나리오를 양쪽 통과 형태로 내고, 저장 시점 실측(기준 t+300ms, 작업 t+0)을 REQ 에 적음. 검증 수준: 같은 게스트 화면 시나리오(PC 화면에서 눌러 봄) + 시점 실측 — 동급, 다만 「확인됨」 대신 「고칠 게 없었음」.
- ② 규칙: 지시 4건을 한 PR 로. 왜 안 맞나(사실): `#btnCustomHomeLayout` 은 ui.css `#btnCustomHomeLayout, … { display:none !important }` 와 4테마 `.home-head-row` 숨김에 갇혀 게스트 시나리오로 누를 수 없다(L042) — 그 항목은 글자 확인만 가능해 이 PR 전체의 병합 기준을 막는다. 대신 한 것: 별도 PR #TASK-ES-531 로 분리(같은 하네스로 숨김을 측정용으로만 풀어 호출 수 2→1 실측). 검증 수준: 동급(두 PR 모두 같은 측정 도구).
