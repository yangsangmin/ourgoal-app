# REQ/PLAN — TASK-ES-378 결과 입력 창 「보관」(#rsJustArchive) Dead-Click·ReferenceError 수정

> 숫자는 부품 시험·법정 러너(`court/lib/scenario.js`) 로컬 실행 산출이다(손으로 옮긴 수치 없음). 로컬 실행은 판정이 아니다.

## 지시 원문(작업 지시서 요지)

- 결과 입력 모달의 "보관" 버튼 `#rsJustArchive`(js/tabs/goals/result-modal.js — #693 으로 옮겨짐): ① 목표 단위 결과에서 열면 `goal` 인자가 없어 눌러도 아무 일 없음(Dead-Click) ② 마일스톤·할 일에서 열면 보관·저장은 되지만 `ReferenceError: renderGoalDetail is not defined`(renderHomeGoals 도 미정의) — 화면 갱신 실패.
- 목표: 두 경우 모두 보관이 되고 화면이 갱신되며 완료 피드백(기존 토스트)이 뜬다. 없는 함수 대신 실제 존재하는 렌더 경로를 부른다. 문구 변경 0.
- `#goalResultBtn` 을 숨기는 ui.css 규칙(`#goalDetailBody > .toss-goal-hero-card { display:none !important }`)은 손대지 않는다(화면 배치 결정은 상민님께 따로).

## REQ

- 대상 DOM ID: `#rsJustArchive`(보관) · `#rsSaveAndArchive`(저장 및 보관함으로 이동) · 확인용 `#toast` · `#goalsHeadlineSentence` · 여는 쪽 `#goalResultBtn` · `[data-msresult]` · `[data-taskresult]`
- 대상 함수: `openResultModal(kind, obj, onSaved, goal)`(js/tabs/goals/result-modal.js) — 새 지역 변수 `archiveGoalTarget`, 화면 갱신은 `L.renderAll()`(index.html `renderAll` = renderHome·renderGoalsScreen·기록·일정·소통·설정 전부, js/core/app-scope 통로의 getter)
- 수정/생성 파일: `js/tabs/goals/result-modal.js`(수정) · `tests/result-modal-archive-es378.test.js`(신규) · `scripts/test-shipyard-modular.js`(1줄 등록) · `reports/TASK-ES-378/`(주장·시나리오) · `dev_log.md` · `docs/rules/TICKETS.md`
- 손대지 않는 것: `ui.css`, `index.html`(인라인 줄 수 0 증가), 모든 토스트·버튼 문구.
- [기본값] 같은 원인(목표 단위에서 `goal` 인자 없음)으로 「저장 및 보관함으로 이동」도 목표 단위에서 토스트만 "보관함으로 이동 완료"라 하고 실제로는 보관하지 않았다 — 같은 `archiveGoalTarget` 으로 함께 고쳤다(문구 그대로, 토스트가 말한 대로 동작).

## PLAN — 문제해결 8원칙

## 1. [원칙 ①] 목표 정의
목표·마일스톤·할 일 어디서 결과 입력 창을 열든 「보관」을 누르면 그 목표(마일스톤·할 일이면 상위 목표)에 `archivedAt` 이 찍혀 저장되고, 기존 토스트 「목표가 보관함으로 이동되었습니다 📦」가 뜨고, 창이 닫히고, 화면이 갱신되며 미처리 예외가 0건이다.

## 2. [원칙 ②] 현상 분석 — 본질·원인·중심·핵심 파악
- 기준 커밋(9b2545e) `result-modal.js` 232줄 `if(goal){ … }` — 목표 단위 호출부(goal-detail-events.js 184·198줄 `L.openResultModal('goal', goal, onSaved)`)는 넷째 인자가 없어 `goal` 이 undefined → 처리기가 아무것도 안 함.
- 238·239줄 `renderGoalDetail(); renderHomeGoals();` — 두 이름은 어느 파일에도 정의가 없다(index.html·js 전체 검색 0건). 마일스톤·할 일 경로에서는 보관·저장·토스트·onSaved(renderGoalsScreen) 뒤 ReferenceError 로 비동기 처리기가 거부(unhandled rejection)되고 홈 등 다른 화면은 갱신되지 않는다.
- 로컬 법정 러너: 기준 커밋에서 시나리오 27단계 `ReferenceError: renderGoalDetail is not defined (/js/tabs/goals/result-modal.js:238)`.

## 3. [원칙 ③] 원인 추정
인라인 시절 렌더 함수 이름이 바뀐 뒤(renderGoalsScreen·renderAll 로 통합) 이 처리기만 옛 이름을 남겼고, 보관 대상 목표를 "넘겨받은 goal" 하나로만 정해 목표 단위 호출(obj 가 곧 목표)을 빠뜨렸다.

## 4. [원칙 ④] 대안 탐색
- 보관 대상: (A) 지역 변수 `archiveGoalTarget = goal || (kind==='goal' ? obj : null)` / (B) 호출부 184·198줄에 넷째 인자로 goal 을 넘김 / (C) `goal` 변수 자체를 덮어씀. → (A): 한 곳에서 끝나고 호출부·`convertTextToNotionDbRecord(…, goal)`·마일스톤 축하(`celebrateMs` 의 `!!goal`) 동작을 바꾸지 않는다. (C)는 목표 단위 저장 때 축하·변환 인자가 달라질 수 있다.
- 화면 갱신: (A) `L.renderAll()` / (B) `K.renderGoalsScreen()` 만 / (C) 신호 view:sync. → (A): 지운 두 이름의 뜻(목표 상세 + 홈 목표)을 모두 덮는 실제 존재 경로이고, 같은 파일의 목표 단위 호출부가 이미 onSaved 로 쓰는 경로다. renderGoalsScreen 은 보관된 activeGoalId 를 스스로 다음 목표로 바꾼다(render.js 65줄).

## 5. [원칙 ⑤] 실행 계획
result-modal.js 3곳 수정(대상 변수 1줄 + 보관 처리기 + 저장 및 보관) → 부품 시험(실제 모듈을 불러 L 만 기록용으로) → 게스트 시나리오(마일스톤 경로) → claims → npm test → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론 1: "목표 단위 경로(#goalResultBtn)는 CSS 로 가려져 사람이 못 누르니 고칠 필요가 없다." → 가림 규칙은 상민님 결정 대기 중인 별개 사안이다. 가림을 풀면 바로 Dead-Click 이 드러나고, 「편집 → 📦 보관」 경로(198줄)도 같은 함수를 목표 단위로 연다. 부품 시험이 목표 단위 경로를 직접 잰다.
- 반론 2: "onSaved 가 이미 renderGoalsScreen 이나 archiveGoal 을 부르는데 renderAll 을 또 부르면 이중 렌더·이중 토스트가 난다." → 198줄 경로는 결과가 없을 때만 창을 열므로 「보관」 버튼(결과가 있을 때만 그림)이 나오지 않는다. 184·333·369줄 경로는 onSaved 가 렌더만 하므로 renderAll 한 번 더는 같은 화면을 다시 그릴 뿐 상태·문구를 바꾸지 않는다(원래 코드도 onSaved 뒤 렌더 2개를 더 부르는 구조였다).

## 7. [원칙 ⑦] 즉시 실행
완료 — 커밋 참조.

## 8. [원칙 ⑧] 성과 측정
- 부품 시험 `tests/result-modal-archive-es378.test.js` 5건: 기준 커밋 모듈에서는 첫 검사(목표 단위 보관)가 `archivedAt` undefined 로 실패, 작업 커밋에서 5건 통과.
- 시나리오 `goals-ms-result-archive`: 기준 커밋 27단계(`noExceptions` — ReferenceError renderGoalDetail)에서 멈춤, 작업 커밋 전 단계 통과(보관 토스트 → 창 닫힘 → 목표 탭 빈 목표 안내 → 예외 0).
- 시나리오 `goals-task-result-archive`(할 일 경로, 법정 1차 판정 "R3 코드만 확인" 뒤 추가): 기준 커밋 30단계(같은 ReferenceError)에서 멈춤, 작업 커밋 전 단계 통과.
* 체크리스트 마감 규칙: [4단계: 심사 청구]까지만 등록.

## 확인 못 한 것
- 목표 단위 「보관」의 화면 클릭: `#goalResultBtn` 이 ui.css 로 가려져 있고, 「편집 → 📦 보관」 경로는 결과가 없을 때만 창을 열어 「보관」 버튼이 그려지지 않는다 → 게스트 화면 시나리오로 닿지 않는다. 부품 시험으로만 잰다.
- 실계정(서버 원장 archived_at 반영)은 재지 않았다 — 저장 경로는 기존 `saveProfile` 그대로다.
