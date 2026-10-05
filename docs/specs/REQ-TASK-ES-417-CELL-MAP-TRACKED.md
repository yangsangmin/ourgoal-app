# REQ/PLAN — TASK-ES-417 세포지도 생성기가 git 추적 파일만 읽게

> 지시(2026-10-05, 코디네이터 경유): `scripts/cell-map-export.js` 가 저장소에 커밋되지 않은 파일까지 읽어 `--check` 가 오탐한다. 생성기가 파일 목록·내용을 git 추적 파일에서만 얻게 하고, 결정성 시험에 "미추적 파일을 만들어도 출력 불변" 단언을 더한다.
>
> 범위: `scripts/cell-map-export.js` · `tests/cell-map-export-es414.test.js` · `scripts/cell-map-sync.md` 한 문장 · 이 REQ · claims · dev_log · TICKETS. 제품 코드(js/**·index.html) 0, 금고 파일 0.

## 1. [원칙 ①] 문제 정확히 파악

- 1층(드러난 현상): 메인 작업 폴더 `C:/dev/ourgoal-app`(main, 23b8012)에서 `node scripts/cell-map-export.js --check` → 「세포지도 갱신 필요」. 같은 커밋의 깨끗한 worktree 에서는 「최신」.
- 실측 차이: 생성 결과와 저장본 diff 는 한 줄 — 어느 세포의 `reqs` 에 `docs/specs/REQ-TASK-ES-126-AVATAR-320-PERSONAS.md` 가 더 들어간다. 이 파일은 다른 세션이 남긴 미추적(`??`) 문서다.
- 2층(구조): 생성기가 `fs.readdirSync(docs/specs)`·`metrics.measure(root)`(js/** 디렉터리 순회) 등 작업 트리를 그대로 읽는다. 같은 커밋이라도 작업 폴더에 무엇이 흩어져 있느냐에 따라 출력이 달라진다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 세포지도는 "저장소의 이 커밋"을 그린 것이어야 한다. 같은 커밋 → 어느 작업 폴더에서든 같은 바이트. 그래야 `--check` 의 「갱신 필요」가 진짜 갱신 신호가 된다. 5대 축 귀속: INFRA.
- **원인**: 입력 범위를 "작업 트리 전체"로 잡았다(`reqFiles` 의 `readdirSync`, `module-metrics.listJs` 의 디렉터리 순회, 세포 파일 `existsSync`). git 추적 여부를 보는 곳이 없다.
- **중심**: `build(root)` 한 곳. 여기서 입력 파일 집합을 정하면 아래 모든 읽기(`readJson`·`reqFiles`·`metrics.measure`·`require(slots.js)`)가 따라온다.
- **핵심**: (1) 목록은 `git ls-files -z -- js index.html ui.js docs/architecture docs/specs`. (2) 내용은 그 파일들의 작업 트리 내용(추적 파일을 고친 뒤 지도를 다시 만들어 같은 커밋에 넣는 기존 절차 유지). (3) `module-metrics.js` 는 `module-guard` 도 쓰므로 고치지 않는다 — 추적 파일만 임시 폴더에 옮겨 그 폴더를 root 로 넘긴다. (4) git 이력 칸(병합 PR·기준 커밋)은 원래 저장소에서 읽는다.

## 3. [원칙 ③] 해결방식

| 식별자 | 변경 |
| :-- | :-- |
| `scripts/cell-map-export.js` `buildFrom(root, gitRoot)` | 기존 `build` 본문. 파일은 `root`, git 은 `gitRoot` 에서 |
| `scripts/cell-map-export.js` `INPUT_PATHS` · `trackedInputs(root)` | 추적 입력 파일 목록(작업 트리에 있는 것만). git 이 없으면 `null` |
| `scripts/cell-map-export.js` `build(root)` | 추적 파일을 `os.tmpdir()` 임시 폴더에 복사 → `buildFrom(snap, root)` → `finally` 에서 임시 폴더 삭제. git 이 없으면 작업 트리 그대로 |
| `tests/cell-map-export-es414.test.js` | 단언 「#TASK-ES-417 미추적 파일을 만들어도 출력이 바뀌지 않는다」: 미추적 REQ·800줄 넘는 js 를 만들고, 대조군(`buildFrom(root, root)`)엔 들어가고 `build(root)` 출력은 기존과 같음 |

## 4. [원칙 ④] 재검토

- 대안 A `git show HEAD:<파일>` 로 커밋 내용만 읽기 → 추적 파일을 고친 뒤 커밋 전에 지도를 다시 만드는 절차(`scripts/cell-map-sync.md`)가 깨진다. 기각.
- 대안 B `module-metrics.js` 에 파일 목록 인자 추가 → `module-guard` 공용 부품을 건드려 영향 범위가 넓다. 기각.
- 채택: 추적 파일 스냅샷. 기존 읽기 코드는 그대로, 입력 집합만 바뀐다.

## 5. [원칙 ⑤] 절차

1. `git worktree add C:/dev/wt/cell-map-tracked -b fix/2026-10-05-task-es-417-cell-map-tracked origin/main`(23b8012).
2. 전 측정: 메인 작업 폴더 `--check` → 「갱신 필요」, diff 1줄.
3. 생성기 수정 → 시험 단언 추가 → 지도 재생성(내용 변화 확인).
4. REQ · claims · dev_log · TICKETS → `NODE_PATH=C:/dev/ourgoal-app/node_modules npm test` → 커밋(훅 우회 없음) → PR(초안 아님, 병합 안 함).

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 "매번 700여 파일을 복사하면 느리고, 임시 폴더가 남는다" → 입력 경로 5곳의 추적 파일만(실측 767개), `finally` 에서 `fs.rmSync(..., { recursive: true, force: true })`. 시험 전체가 수 초 안에 끝난다.
- 반론 2 "새 단언이 실제로 미추적 파일을 거르는지 증명하지 못하고 그냥 통과할 수 있다" → 단언 안에 대조군을 넣었다: 작업 트리를 그대로 읽으면(`buildFrom(root, root)`) 미추적 REQ 경로가 출력에 들어가야 한다. 또 `trackedInputs` 를 끈 생성기로 돌리면 이 단언이 실패함을 실측했다(10/11).
- 절차 재검증: 메인 작업 폴더에 `--root C:/dev/ourgoal-app --check` 로 새 생성기를 돌려 「최신」을 확인. 메인 작업 폴더의 미추적 파일은 지우거나 옮기지 않는다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: `scripts/cell-map-export.js`(함수 `build`·`buildFrom`·`trackedInputs`, 상수 `INPUT_PATHS`) · `tests/cell-map-export-es414.test.js` · `scripts/cell-map-sync.md` · `docs/specs/REQ-TASK-ES-417-CELL-MAP-TRACKED.md` · `reports/TASK-ES-417/claims.json` · `dev_log.md` · `docs/rules/TICKETS.md`.
- DOM ID·제품 함수: 없음(제품 코드 변경 0).
- 체크리스트: [1단계 REQ] [2단계 PLAN] [3단계 코드] [4단계: 심사 청구]까지만 표기한다.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정

막히는 지점: 추적 목록에 있으나 작업 트리에서 지워진 파일(존재 확인으로 건너뜀) · git 없는 환경(작업 트리 직접 읽기로 후퇴) · `-z` 출력의 경로 인코딩(따옴표 없이 그대로 받음).

| 측정 | 명령 | 결과(작업자 실측 — 주장일 뿐, 판정은 법정) |
| :-- | :-- | :-- |
| 수정 전 메인 작업 폴더 | `node scripts/cell-map-export.js --check`(main 판) | 세포지도 갱신 필요(diff 1줄, 미추적 REQ-TASK-ES-126) |
| 수정 후 메인 작업 폴더 | `node scripts/cell-map-export.js --root C:/dev/ourgoal-app --check`(이 PR 판) | 세포지도 최신 |
| 수정 후 worktree | `node scripts/cell-map-export.js --check` | 세포지도 최신 |
| 부품 시험 | `node tests/cell-map-export-es414.test.js` | 11/11 |
| 단언 유효성 | `trackedInputs` 를 끈 생성기로 같은 시험 | 10/11(새 단언 실패) |
| `cell-map.json` | 재생성 후 `git diff --ignore-cr-at-eol` | 내용 변화 0(커밋 안 함) |
