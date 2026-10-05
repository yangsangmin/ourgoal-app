# REQ — #TASK-ES-502 모듈 가드 ⑤(탭 간 직접 참조) 측정기 오탐 — 「없으면 만들어 두는」 window 방어 초기화를 탭의 정의로 세지 않음

- 근거: 코디네이터 지시(2026-10-05, [기본값] ② — "측정기 오탐 수정이 정답, 기준선을 올리면 지표가 거짓이 된다") · 헌법 GUARD_05(상태는 측정) · `docs/architecture/MODULE-BLUEPRINT.md` 「래칫」.
- 범위: `scripts/module-metrics.js` 의 `tabDefinedSymbols` 한 곳 + 새 시험지 1개. 기준선 파일·생성 지도·제품 코드·금고 0. 기존 시험 단언 변경 0.

## 1. [원칙 ①] 문제 정확히 파악

인라인 어려움 구역 H2 3차(#TASK-ES-497)가 `renderTeamGoalsScreen` 을 `js/tabs/goals/team-goals-screen.js` 로 글자 그대로 옮기자 모듈 가드 ⑤ 가 0 → 25 로 올라 npm test 가 실패했다. 옮긴 함수 안의 `if(!window.FEED_POSTS_CACHE) window.FEED_POSTS_CACHE = [];` 한 줄 때문에 측정기가 FEED_POSTS_CACHE 를 「goals 탭이 정의한 전역」으로 보고, comm·records 세포가 통로로 읽는 `L.FEED_POSTS_CACHE` 25곳을 탭 간 직접 참조로 셌다. 동작은 바뀌지 않았다(FEED_POSTS_CACHE 의 주인은 index.html 인라인).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: ⑤ 는 「한 탭이 다른 탭의 내부를 직접 만진다」를 재야 하는데, 남의 전역을 비어 있을 때만 채우는 방어 코드를 그 탭의 소유로 오해했다.
- **원인**: `tabDefinedSymbols` 가 `window.X =` 꼴이면 조건과 상관없이 모두 정의로 센다.
- **중심**: 정의(무조건 대입 — 새 전역을 그 탭이 만든다)와 방어 초기화(조건부 — 이미 있을 전역을 비었을 때만 채운다)의 구분.
- **핵심**: 같은 줄·같은 이름의 두 꼴만 뺀다 — ① `if(!window.X) window.X = …` ② `window.X = window.X || …`(global·globalThis·공백 변형 포함). 그 밖은 그대로 센다.

## 3. [원칙 ③] 해결방식

- `scripts/module-metrics.js`: `isGuardedInit(text, at, len, name)` 를 더하고 `tabDefinedSymbols` 가 그 꼴을 건너뛴다. `tabDefinedSymbols` 를 시험에서 부르도록 내보낸다.
- `tests/cross-tab-guarded-init-es502.test.js`: 임시 폴더에 `js/tabs/<탭>/` 파일을 만들어 실제 `crossTabRefs` 로 잰다 — 오탐 사례(①·②) 0건, 진짜 사례(무조건 `window.Y = function…` 를 다른 탭이 씀) 여전히 1건, 이름이 다른 조건부(`if(!window.A) window.B = …`)·무조건 `window.X = X` 는 정의로 셈, 지금 저장소 ⑤ 0.

## 4. [원칙 ④] 재검토 — 한계

- 여러 줄에 걸친 방어 초기화(`if(!window.X){\n window.X = … }`)는 여전히 정의로 센다(같은 줄만 본다). 지금 저장소에는 그 꼴로 생기는 탭 간 참조가 없다(⑤ 0). 넓히면 진짜 정의를 놓칠 수 있어 좁게 둔다.

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/inline-h2-tf`(브랜치 `feat/2026-10-05-task-es-502-cross-tab-metric`, origin/main) → 금고 확인(`court/vault.json` frozen 에 `scripts/module-metrics.js` 없음) → 측정기 수정 → 새 시험지 → 고치기 전 측정기로 같은 시험지(실패 확인) → 측정기 다른 출력 같음 확인 → npm test → 주장 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "예외를 두면 진짜 탭 간 참조를 숨기는 구멍이 된다." → 빼는 것은 같은 이름을 조건으로 확인한 같은 줄 대입뿐이다. 무조건 정의는 그대로 잡힌다(시험 「진짜」 3건). 방어 초기화로 새 전역을 「정의」할 수도 있지만, 그 경우 그 전역의 주인이 어느 탭인지 측정기가 알 수 없고 먼저 실행된 쪽이 만든다 — 한 탭의 소유로 세는 것이 오히려 거짓이다.
- 반론 2: "기준선을 올리는 것이 더 빠르다." → 기준선을 올리면 ⑤ 지표가 25 개의 가짜 참조를 품고, 나중에 진짜 참조가 생겨도 그만큼 가려진다(GUARD_05 위반). 측정기 다른 출력은 고치기 전과 같다(측정 `metricsOtherFieldsSame`).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: `scripts/module-metrics.js`(`isGuardedInit`·`tabDefinedSymbols`·`crossTabRefs`), `tests/cross-tab-guarded-init-es502.test.js`, `reports/TASK-ES-502/metric-check.json`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 결과 (`reports/TASK-ES-502/metric-check.json`) |
| :-- | :-- |
| 새 시험지 | 고친 뒤 6건 통과(종료 0), 고치기 전 측정기로는 실패(종료 1) |
| 지금 저장소 ⑤ | 0 (변화 없음) |
| 측정기 다른 출력 | `module-metrics --json` 이 측정 시각 말고 고치기 전과 같다 |
| 구역 H2 3차 작업 트리 | ⑤ 25 → 0 (오탐만 빠짐) |
| npm test | 작업 트리 종료 코드 0 |

[4단계: 심사 청구]
