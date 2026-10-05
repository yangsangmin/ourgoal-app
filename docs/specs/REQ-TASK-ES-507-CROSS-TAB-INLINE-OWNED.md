# REQ — #TASK-ES-507 모듈 가드 ⑤(탭 간 직접 참조) 측정기 오탐 2 — index.html 인라인이 주인인 window 이름을 탭의 정의로 세지 않음

- 근거: 코디네이터 [기본값] ② 방침(2026-10-05, #TASK-ES-502 — "측정기 오탐 수정이 정답, 기준선을 올리면 지표가 거짓이 된다") · 헌법 GUARD_05 · 경험칙 L023.
- 범위: `scripts/module-metrics.js` 의 `crossTabRefs` 한 곳(+ `inlineWindowSymbols`) + 새 시험지 1개. 기준선·생성 지도·제품 코드·금고 0, 기존 단언 변경 0.

## 1. [원칙 ①] 문제 정확히 파악

#TASK-ES-502 병합 뒤 main 을 합친 구역 H2 3차(#TASK-ES-497, `renderTeamGoalsScreen` 이전) 작업 트리에서 ⑤ 가 0 → 1. 옮긴 줄 `if(typeof L.loadSharedGroups === 'function' && !window.SHARED_GROUPS_LOADED){` 의 `SHARED_GROUPS_LOADED` 를 측정기가 「comm 탭이 정의한 전역」으로 봤다 — `js/tabs/comm/shared-groups.js`(다른 빌더가 옮긴 세포)가 `window.SHARED_GROUPS_LOADED = true;` 로 값을 바꿔 쓰기 때문이다. 그런데 이 이름은 index.html 인라인이 `var SHARED_GROUPS_LOADED = false;` + `window.SHARED_GROUPS_LOADED = false;` 로 만든 인라인 공용 상태이고, comm 세포는 그 값을 갱신할 뿐이다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: ⑤ 는 「한 탭이 다른 탭의 내부를 직접 만진다」를 재야 한다. 인라인(미분화 덩어리)이 주인인 공용 상태를 두 세포가 같이 읽고 쓰는 것은 통로 L 로 인라인 상태를 쓰는 것과 같은 결합이지 탭 간 참조가 아니다.
- **원인**: 측정기가 세포 파일의 `window.X =` 를 그 탭의 정의로 셀 때, 같은 이름을 index.html 인라인이 이미 만든다는 것을 보지 않는다.
- **중심**: 주인 판별 — 인라인이 window 에 다는 이름은 인라인 소유.
- **핵심**: 인라인 스크립트의 `window/global/globalThis.X =` 이름 집합을 만들어 각 탭 정의 목록에서 뺀다. 인라인에 없는 새 전역을 세포가 정의하면 그대로 센다.

## 3. [원칙 ③] 해결방식

- `scripts/module-metrics.js`: `inlineWindowSymbols(root)`(index.html 인라인 스크립트만 — `maskToInlineScripts` — 에서 window 대입 이름을 모음)를 더하고, `crossTabRefs` 가 탭 정의 심볼에서 그 이름을 뺀다. 시험에서 부르도록 내보낸다.
- `tests/cross-tab-inline-owned-es507.test.js`: 임시 폴더에 index.html·세포를 만들어 실제 `crossTabRefs` 로 잰다 — 오탐 0건, 인라인에 없는 새 전역을 다른 탭이 쓰면 1건, index.html 이 없으면 예전처럼 셈, 지금 저장소 ⑤ 0.

## 4. [원칙 ④] 재검토 — 한계

- 인라인이 window 에 다는 이름 중에는 옮겨 간 함수의 노출 줄(`window.renderX = renderX` — 표준 이음매상 원래 자리에 남음)도 있다. 그 이름을 세포가 window 에 다시 다는 일은 표준 이음매에서 없으므로(새 전역 0) 빼도 잃는 참조가 없다. 지금 저장소 ⑤ 0 그대로, 측정기 다른 출력 같음(측정).

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/inline-h2-tf`(브랜치 `feat/2026-10-05-task-es-507-cross-tab-inline-owned`, origin/main) → 금고 확인(`scripts/module-metrics.js` 는 `court/vault.json` frozen 밖, #TASK-ES-502 와 같음) → 측정기 수정 → 새 시험지 → 고치기 전 측정기로 같은 시험지(실패) → 측정기 다른 출력 같음 → #502 시험지 그대로 통과 → npm test → 주장 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "comm 세포가 전역 값을 바꾸고 goals 세포가 읽는 것은 진짜 결합이다." → 결합은 맞지만 탭 간 결합이 아니라 인라인 공용 상태를 통한 결합이다(두 세포 모두 그 상태의 주인이 아니다). 인라인이 줄어 그 상태가 기관 세포로 옮겨 가면 `requires` 능력으로 드러난다 — ⑤ 의 대상이 아니다.
- 반론 2: "이름 집합을 빼면 진짜 참조가 숨을 수 있다." → 빼는 것은 index.html 인라인이 window 에 다는 이름뿐이고, 시험 「진짜」 사례(인라인에 없는 `openCommThing`)는 그대로 잡힌다. 지금 저장소 값·측정기 다른 출력이 같다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: `scripts/module-metrics.js`(`inlineWindowSymbols`·`crossTabRefs`·`maskToInlineScripts`), `tests/cross-tab-inline-owned-es507.test.js`, `reports/TASK-ES-507/metric-check.json`. 사례 이름: `SHARED_GROUPS_LOADED`(index.html 인라인 · `js/tabs/comm/shared-groups.js` · `js/tabs/goals/team-goals-screen.js` 예정).

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 결과 (`reports/TASK-ES-507/metric-check.json`) |
| :-- | :-- |
| 새 시험지 | 고친 뒤 5건 통과(종료 0), 고치기 전 측정기로는 실패(종료 1) |
| #TASK-ES-502 시험지 | 그대로 통과 |
| 지금 저장소 ⑤ | 0 (변화 없음) |
| 측정기 다른 출력 | `module-metrics --json` 이 측정 시각 말고 고치기 전과 같다 |
| 구역 H2 3차 작업 트리 | ⑤ 1 → 0 |

[4단계: 심사 청구]
