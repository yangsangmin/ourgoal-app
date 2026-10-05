# REQ — #TASK-ES-524 시험지 선행: 인라인 3단계 구역 Z5+Z6(표준 T 묶음) 시험지가 인라인 합본을 읽음

- 근거: 헌법 v2026.10.06-SNOWBALL CELL_SPLIT 3(시험지 선행 — 기대값·단언·검사 수를 바꾸지 않고 읽는 범위만 넓힌다, retire 금지) · 설계 `docs/architecture/INLINE-STAGE3-DESIGN.md` 2절 T 표·6절 구역 Z5·Z6 · 작업참고 `C:/dev/agent-knowledge/WORK-REFERENCE.md` **기준 PR #802**(L021).
- 지시(2026-10-06, 오케스트레이터 배정): 구역 Z5+Z6 표준(T) 36묶음 — 시험지 선행 1 먼저, 그 뒤 표준 이음매 연속 PR.
- 범위: 시험지 4곳의 읽는 줄만 바꾼다. 제품 코드 0, 금고 파일 0, 단언 문장·기대값·검사 수 변경 0.
- 작업 유형(SNOWBALL): (가) 표준 — L021·#779(#TASK-ES-488) 과 같은 방식. 이탈 없음.

## 1. [원칙 ①] 문제 정확히 파악

T 36묶음 중 옮길 코드가 있는 24묶음을 생성기 설정 6벌(이후 옮기기 PR 이 `docs/design/harness/module-split/inline-stage3-z56-pr1~6.json` 으로 낸다)로 모두 옮긴 모의 사본(origin/main git archive)에서 tests 전부·npm test 를 기준 사본과 맞대면(`test-compare-inline-split-2.js`), 종료 코드가 갈린 시험지는 4개다: `scripts/smoke-test.js`(「[#TASK-ES-186] 성소 기준 4대 테마」 검사 한 개 — `OurgoalSanctuaryV3.render(state.activeTab)` 글자, 「Render all」 묶음) · `tests/theme-system-v4.test.js`(「8대 화면 스타일 (테마) 정의」 THEMES) · `tests/today-mission-card-guide.test.js`(「오늘의 미션」) · `tests/quest-task-exp.test.js`(「11인 외부 UI/UX」 renderDailyQuestBar). `tests/module-guard.test.js` 도 갈렸으나 원인은 새 세포 신고서가 아직 없는 것(옮기기 PR 이 신고서를 함께 낸다) — 시험지 문제가 아니다. 설계 2절 표는 선행 2(theme-system-v4·today-mission-card-guide)로 적었는데, tests 전부로 재니 둘 더 나왔다(L021 「실측 도구가 놓치는 시험지」와 같은 모양).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 시험지가 재는 것은 "그 코드가 있다"인데, 읽는 곳이 index.html 한 파일로 묶여 코드가 세포로 옮겨 가면 같은 코드를 못 찾는다.
- **원인**: 4곳이 `fs.readFileSync(index.html)` 만 본다(합본 도구 `tests/helpers/inline-bundle.js` 를 아직 쓰지 않음).
- **중심**: 읽는 범위를 「index.html 원문(맨 앞) + 인라인 세포(js/tabs 앱 스코프 통로 세포 + js/core 생성기 표지 세포, L. 접두만 뗌)」로 넓힌다.
- **핵심**: 단언·기대값은 그대로, 읽는 줄 한 줄씩만 바꾼다.

## 3. [원칙 ③] 해결방식

| 시험지 | 바꾼 줄 |
| :-- | :-- |
| `scripts/smoke-test.js` 「[#TASK-ES-186]」 검사 | `const html = fs.readFileSync(…index.html…)` → `require('../tests/helpers/inline-bundle').withInlineCells(fs.readFileSync(…))` |
| `tests/theme-system-v4.test.js` | `const html = …` 같은 방식 |
| `tests/today-mission-card-guide.test.js` | `const indexHtml = …` 같은 방식 |
| `tests/quest-task-exp.test.js` | `const indexHtml = …` 같은 방식 |

## 4. [원칙 ④] 재검토 — 한계

- 모의 사본의 세포 이름·배치는 이후 옮기기 PR 의 설정과 같다. 합본은 파일 이름에 기대지 않으므로(js/tabs 전체 + js/core 표지 파일) 옮기기 PR 이 세포 이름을 바꿔도 이 4곳은 그대로 맞는다.
- 실측은 작업자 측정이다(판정 아님).

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/stage3-z56`(origin/main 7bf4c36) → 모의 사본에 6벌 설정 차례 적용 → tests 전부 기준 대비 → 깨진 시험지 4곳의 읽는 줄만 바꿈 → 모의·기준·작업 세 곳에서 새 시험지 실행(`docs/design/harness/module-split/stage3-z56-test-first-check.js`) → 작업 트리 npm test → REQ·주장 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "합본을 읽으면 다른 세포 글자가 우연히 맞아 시험이 쉬워진다." → 합본 맨 앞이 원문 그대로라(`withInlineCells` 가 검사) 원문에 있는 글자는 원래 자리에서 먼저 찾힌다. 세포 글자는 L. 접두만 뗀 옮긴 글자 — 같은 코드다. 지금 커밋(기준)에서 새 시험지 4곳 모두 통과(원문만으로도 통과하던 것).
- 반론 2: "smoke-test.js 는 npm test 본체라 한 줄도 건드리면 안 된다." → 금고(`court/vault.json` frozen)에 없고 package.json scripts 영역도 아니다. 앞선 #751·#753 이 같은 파일의 읽기를 합본으로 넓혔다. 이번에도 한 검사 블록의 읽는 줄 하나뿐, 검사 수·기대값 그대로(smoke 443 통과·0 실패 — 기준·작업·모의 동일).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: `scripts/smoke-test.js`(「[#TASK-ES-186]」 블록) · `tests/theme-system-v4.test.js` · `tests/today-mission-card-guide.test.js` · `tests/quest-task-exp.test.js` · 합본 도구 `tests/helpers/inline-bundle.js`(바꾸지 않음) · 실측 도구 `docs/design/harness/module-split/stage3-z56-test-first-check.js` · 모의 설정(옮기기 PR 몫) `inline-stage3-z56-pr1~6.json`.
- 시험 대상 이름(옮기기 PR 몫): `THEMES` · `renderTodayMissionCard` · `computeTodayMissionHash` · `renderDailyQuestBar` · `renderAll`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 결과 (출처) |
| :-- | :-- |
| 모의 이전 사본 | 옛 시험지 4곳 실패 → 새 시험지 4곳 통과(smoke 442/1 → 443/0) (`reports/TASK-ES-524/test-first-check.json`) |
| 기준 사본·작업 트리 | 새 시험지 4곳 통과 (같은 파일) |
| 작업 트리 npm test | 종료 0 (`reports/TASK-ES-524/npm-test.json`) |
| 막힐 지점 | 옮기기 PR 에서 tests 전부 종료 코드를 다시 기준과 맞댄다(L021 — 놓친 시험지) |

[4단계: 심사 청구]
