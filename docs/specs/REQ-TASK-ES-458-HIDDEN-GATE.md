# REQ — #TASK-ES-458 숨김 게이트(W98 재발 방지)

- 근거: 코디네이터 지시(2026-10-05, #763 병합 뒤) — #TASK-ES-433·#TASK-ES-440 에서 살아 있는 기능 7개가 `display:none !important`·인라인 숨김에 갇혀 보이는 진입로가 0개였던 일이 다시 생기지 않게, 새로 갇히는 것을 시험이 막는다. 지금 남은 것은 사유 달린 허용 목록에 두는 「증가 금지」(module-guard 와 같은 래칫).
- 범위: 새 파일 `scripts/hidden-entry-guard.js`(정적판) · `tests/hidden-entry-guard.test.js` · `docs/architecture/hidden-entry-baseline.json`(정적판 허용 목록) · `docs/design/harness/hidden-entry-sweep.js`(브라우저판, 수동) · `docs/architecture/hidden-entry-sweep-baseline.json`(브라우저판 허용 목록) · `scripts/test-shipyard-modular.js` 에 시험 한 줄 등록 · `reports/TASK-ES-458/**`. 제품 코드(index.html·ui.css·js/**) 변경 0. 동결 파일 변경 0.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. sweep.js 기반 검사기: 처리기(onclick·리스너)가 있는 요소가 늘 숨김(`display:none !important`·인라인 숨김)에만 있고 보이는 진입로가 0 이면 실패.
2. 지금 main 의 남은 대상은 허용 목록(사유 1줄씩 — 상민님 지시로 숨김 TASK-ES-139·140 등)에 넣고 새로 생기는 것만 막는다(증가 금지).
3. `npm test` 에서 도는 빠른 정적판(ui.css·index.html 의 새 `!important` 숨김이 처리기 요소를 덮는지) + 느린 브라우저판은 수동 스크립트.
4. 동결 파일(court/**·.github/workflows/**·package.json scripts·essence-gate·verify-integrity-gate) 수정 금지. tests/ 아래 새 시험 파일을 npm test 가 자동으로 줍는지 확인.
5. 주장: 시험 파일 존재 · 고의로 숨긴 픽스처에서 실패 · 현재 main 에서 통과. 전체 수치 주장 금지, 생성 지도 3종 커밋 금지, push 직전 main 합치기.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- 본질: 숨김 규칙 하나가 「눌러야 들어가는 길」을 통째로 지워도 아무 시험도 실패하지 않았다. 사고가 나도 사람이 화면을 전수로 재야만 알았다(ES-440 숨김 전수 실측).
- 원인: (1) 숨김 규칙을 더하는 PR 이 그 아래에 처리기 요소가 있는지 보는 장치가 없었다 — b2b7918 의 성소 전용 숨김을 ES-185/186 이 4테마로 복사할 때도 통과. (2) `npm test` 의 Dead-Click 검사(verify-all-clicks)는 처리기가 걸렸는지만 보고 보이는지는 보지 않는다. (3) 숨긴 사람의 의도(상민님 결정·검증 전용 슬롯)와 사고를 가를 기록이 없어, 정리하는 쪽도 무엇이 사고인지 알 수 없었다.
- 중심: 「처리기 요소 ↔ 그것을 덮는 !important 숨김」의 짝. 정적으로는 ui.css 규칙을 index.html 마크업 나무에 맞춰 보고, 동적으로는 실제 화면에서 「늘 숨고 같은 일을 하는 보이는 요소도 없음」을 본다.
- 핵심: 지금의 짝을 사유와 함께 허용 목록에 박제하고, 목록 밖의 새 짝이 생기면 실패하는 래칫. 정적판은 `npm test`(빠름, 0.3초대), 브라우저판은 수동(68장, 10분대).

## 3. [원칙 ③] 해결방식

- `npm test` 가 tests/ 를 자동으로 줍는가: **아니다**. `package.json` 의 test 는 `scripts/smoke-test.js && verify-integrity-gate && verify-all-clicks && scripts/test-shipyard-modular.js` 이고, 단위 시험은 `scripts/test-shipyard-modular.js` 의 `runNode('tests/…')` 목록에 한 줄씩 등록된다(이 파일은 동결 목록 court/vault.json `frozen` 에 없다 — 다른 작업들도 같은 자리에 등록해 왔다). 그래서 그 목록에 `runNode('tests/hidden-entry-guard.test.js')` 한 줄을 더했다. package.json 은 그대로.
- 정적판 `scripts/hidden-entry-guard.js`:
  - 숨김 규칙: ui.css 에서 선언에 `display:none !important`·`visibility:hidden !important` 가 있는 규칙(@media print 제외, :hover·::before 같은 상태·가상 선택자 제외) + index.html 마크업의 인라인 style 같은 선언.
  - 처리기 요소: 마크업의 onclick 요소, 또는 index.html 인라인 스크립트·js/**·ui.js 에서 `getElementById('id')`/`querySelector('#id')` 에 click 처리기를 거는(변수에 담아 거는 꼴 포함) id 의 요소.
  - 처리기 요소 자신이나 조상이 숨김 규칙에 맞으면 「숨은 처리기 요소」(키 `#id`, id 없으면 `#가까운조상id > 태그 "글자"`).
  - 허용 목록 `docs/architecture/hidden-entry-baseline.json` — 묶음마다 사유(20자 이상). 목록 밖이면 종료 1, 더는 숨지 않으면 `--update` 로 줄임, 새로 허용은 `--allow 키 --reason 사유` 로만.
  - 의존성 없음(마크업·CSS 선택자 맞춤을 직접 구현 — 저장소에 jsdom·parse5 없음).
- 시험 `tests/hidden-entry-guard.test.js`: 지금 저장소 통과 + 임시 픽스처에 일부러 숨긴 경우 실패(4테마 !important · 조상 인라인 · 클래스 선택자 — ES-433 `.home-actions` 사례 · id 없는 onclick 단추 — ES-440 오늘의 카드 사례 · js 파일 변수 담기 꼴 처리기) + 실패하면 안 되는 경우(처리기 없는 요소·:hover·!important 없는 숨김·@media print·홈 첫 화면으로 좁혀 옮긴 요소) + 허용 목록 형식.
- 브라우저판 `docs/design/harness/hidden-entry-sweep.js`(ES-440 숨김 전수 도구 sweep.js 를 저장소로 옮기고 판정부를 붙임): 게스트 4테마 × 6탭 × 상태, 장마다 누르는 요소와 숨긴 까닭을 모아 「한 장에서도 보이지 않고, !important 숨김이며, 같은 처리기·같은 함수·같은 글자의 보이는 요소가 없는」 요소를 허용 목록 `docs/architecture/hidden-entry-sweep-baseline.json` 과 견준다. `--from 원자료.json` 으로 다시 열지 않고 판정만 할 수 있다.
- 대안 비교: (a) 브라우저판을 npm test 에 — 10분대·Chrome 필요, 기각. (b) package.json 에 새 스크립트 — 동결, 기각. (c) 법정 탐침으로 — court/** 동결, 기각. (d) 허용 목록 없이 0 강제 — 지금 main 이 바로 실패하고 상민님 결정(ES-139·140)·검증 슬롯까지 지워야 함, 기각. (e) 채택 — 정적 래칫 + 수동 브라우저판.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 정적판은 자바스크립트가 문자열로 그리는 마크업(예: 성소 엔진의 숨김 칸, 레벨 배지 줄의 「내 아바타 바꾸기」)과 실행 중에만 붙는 클래스로 맞는 규칙을 못 본다. 그래서 ES-440 이전 커밋(eb9e6e4)을 재생하면 오늘의 카드·퀘스트(자바스크립트가 그림)는 못 잡는다 — 그건 브라우저판 몫. ES-433 이전(0719592)을 재생하면 `#mzShareBtn`(.home-actions) 은 정적판이 잡는다(reports/TASK-ES-458/replay.json).
- 정적판 허용 목록의 `#btnOpenEvalModal`·`#todayGlancePill` 은 정적 마크업에서는 홈 첫 화면 숨김에 맞지만 실행 중 「🎯 오늘 목표」 시트로 옮겨져 보인다(ES-440 시나리오) — 정적판 한계라고 사유에 적었다.
- 「보이는 진입로」 판단(브라우저판)은 같은 처리기 위치·같은 함수 이름·같은 글자로 찾는 근사다. 다른 이름의 함수로 같은 화면을 여는 대체 진입로는 못 알아봐 허용 목록에 사유로 적었다(예: 옛 세그먼트바 → 성소 기록 모드).
- 브라우저판은 게스트 화면만 본다(로그인 뒤 화면·실기기 못 봄). 상민님 지시로 내린 TASK-ES-140(레벨 배지)은 브라우저판 허용 목록에 사유와 함께 있고, TASK-ES-139(홈 히트맵 요약)는 렌더러가 내용을 비워 처리기 요소가 없어 어느 쪽 목록에도 잡히지 않는다.
- 브라우저판은 수동이라 아무도 돌리지 않으면 재지 않은 것이다 — 숨김을 건드리는 PR 의 작업자가 돌려 결과를 주장 파일에 싣는 것을 권한다(강제 장치는 법정·워크플로 동결이라 이번에 만들지 않음).

## 5. [원칙 ⑤] 절차

1. npm test 경로 확인 → 2. 정적판 작성·main 측정 → 3. 허용 목록(사유) → 4. 시험(픽스처) → 5. 과거 커밋 재생(0719592·eb9e6e4) → 6. 브라우저판 이식·main 측정·허용 목록 → 7. 브라우저판 main 재측정(통과)·일부러 숨긴 사본(실패) → 8. npm test 등록 경로로 실패 재현(사본) → 9. npm test 기준·작업 → 10. REQ·claims·dev_log·TICKETS → 11. push 직전 main 합치기·PR·판정 줄.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "허용 목록에 지금 것을 다 넣으면 사고까지 박제하는 것 아닌가." → 격파: 묶음마다 까닭을 적었다(검증 슬롯 C·대체 진입로 있음 B·결정 기록 D·상민님 지시 ES-140). 진입로 0 인 사고(A)는 ES-433·ES-440 이 이미 고쳐 목록에 없다. 목록은 줄이는 방향(`--update`)만 손 없이 되고, 늘리려면 사유가 남는다.
- 반론 2: "정적판이 자바스크립트가 그린 것을 못 보면 ES-440 같은 사고를 못 막는다." → 격파: 정적판은 가장 흔한 길(ui.css 규칙 복사·인라인 !important)을 0.3초에 막고, 못 보는 길은 브라우저판이 같은 기준으로 잰다. 브라우저판은 ES-440 의 원래 사고 측정 도구를 그대로 쓴 것이라 그 사고를 재현해 잡는다(일부러 숨긴 사본에서 실패 — reports/TASK-ES-458/sweep-check.json).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: `scripts/hidden-entry-guard.js`(measure·check·parseCss·parseMarkup·compileRules·selectorMatches·handlerIds·baselineErrors), `tests/hidden-entry-guard.test.js`, `docs/architecture/hidden-entry-baseline.json`, `docs/design/harness/hidden-entry-sweep.js`(INSTRUMENT·COLLECT·analyze·compare), `docs/architecture/hidden-entry-sweep-baseline.json`, `scripts/test-shipyard-modular.js`(runNode 한 줄).
- 픽스처 DOM: `#bellBtn`·`#topRight`·`#shareBtn`·`.home-actions`·`#missionCard`·`#plainBtn`(시험 안 임시 저장소), 브라우저판 픽스처: 사본 ui.css 에 4테마 `#sanctuaryBellBtn { display:none !important }`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

결과는 `reports/TASK-ES-458/` 의 `guard-check.json`(정적판 main 통과·npm test 경로 실패 재현)·`replay.json`(과거 커밋 재생)·`sweep-check.json`(브라우저판 main 통과·픽스처 실패)·`test-compare.json` 을 인용한다. 전체 수치는 주장하지 않는다.
