# REQ — #TASK-ES-427 세포지도: 병합 이력 칸(prs)을 --check 에서 빼고 게시 때 다시 계산

- 근거: 코디네이터 지시(2026-10-05) — #739(TASK-ES-425 전문가 템플릿 분열) 병합 890f7d5 뒤 main `--check` = 「갱신 필요」. 도장 외 차이는 세포별 `prs` 에 #739 가 추가되는 것뿐. PR 번호는 병합 뒤에만 생기므로 구조 PR 마다 후속 갱신이 생기는 구조.
- 번호: TASK-ES-426 은 다른 worktree(sanctuary-test-bundle)가 사용 → 427 [기본값].
- 범위: `scripts/cell-map-export.js`(HISTORY_FIELDS·withoutHistoryPair·compareSaved), `scripts/cell-map-publish.js`(--root·mapForPublish), `tests/cell-map-export-es414.test.js`(1건 추가, 기존 단언 그대로), `scripts/cell-map-sync.md`(2단계 명령), REQ·claims·dev_log·TICKETS. **제품 코드(index.html, js/**)·cell-map.json 변경 0.**

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. `--check` 는 병합 이력에서 파생되는 칸(prs)도 도장처럼 비교에서 뺀다.
2. 웹·노션 게시는 게시 시점 main 이력으로 prs 를 새로 계산해 싣는다.
3. 시험 추가, 기존 단언 삭제 금지.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 「갱신 필요」는 앱 구조가 바뀌었을 때만, 화면의 PR 목록은 언제나 지금 이력대로.
- **원인**: 세포별 prs 는 첫 부모 줄기의 병합 커밋에서 나온다. 구조를 바꾼 PR 안에서 만든 지도에는 자기 PR 번호가 아직 없다 → 병합 순간 저장본이 낡는다. prs 에서 온 작업 번호(tasks)와 그 REQ(reqs)도 함께 달라진다(실측: prs 7세포·tasks 1·reqs 1).
- **중심**: 이력 칸은 저장본의 「내용」이 아니라 게시 때 붙이는 「주석」. 비교는 이력 칸 밖에서, 게시는 이력을 새로 계산해서.
- **핵심**: `withoutHistoryPair` — 두 지도 모두에서 prs 를 지우고, 어느 한쪽 prs 에서 온 작업 번호와 그 REQ 를 양쪽에서 같이 지운다. 그 밖의 칸(줄 수·머리 주석·연결·이름…)은 그대로 비교.

## 3. [원칙 ③] 해결방식

- export: `HISTORY_FIELDS=['prs']`, `withoutHistoryPair`, `compareSaved` 가 도장 비교 뒤 이력 칸을 빼고 한 번 더 비교(이때만 `historyOnly: true`; 기존 반환 모양 유지).
- publish: `--root <저장소>` 면 그 자리에서 `build()` 로 새로 만들고 `mapForPublish(저장본, 새 판)` — 도장·이력만 다르면 새 판(게시 시점 이력)을 싣고, 내용이 다르면 게시하지 않음(종료 코드 1).

## 4. [원칙 ④] 재검토 — 한계

- 머리 주석에도 같은 작업 번호가 적혀 있으면 그 번호도 비교에서 같이 빠진다. 다만 머리 주석이 바뀌면 header 칸이 달라져 「갱신 필요」로 잡힌다(시험).
- 저장소의 cell-map.json 안 prs 는 마지막 갱신 때 값으로 남는다. 최신 PR 목록은 게시본(웹·노션)에 있다.

## 5. [원칙 ⑤] 절차

1. worktree `C:/dev/wt/cell-map-427`(origin/main 890f7d5) → 수정 → 부품 시험 → main 에서 `--check` 「최신(도장·병합 이력만 다름)」 → `--root .` 게시 재료 생성 → npm test → PR.
2. 병합 뒤 `--root` 로 웹 저장본·노션 갱신, 되읽기 대조.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 "prs 만 빼면 된다" → prs 에서 파생된 tasks·reqs 도 같이 바뀐다(실측 1세포). 그것까지 빼지 않으면 「갱신 필요」가 남는다.
- 반론 2 "이력을 빼면 게시본 PR 목록이 낡는다" → 게시는 `--root` 로 그 시점 이력을 다시 계산한 판을 싣는다. 저장본과 내용이 다를 때는 게시를 막아, 낡은 구조가 새 이력과 섞여 나가지 않는다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- `HISTORY_FIELDS`·`withoutHistoryPair`·`compareSaved`(cell-map-export.js), `mapForPublish`·`--root`(cell-map-publish.js). 시험 「병합 이력 칸(prs·그 PR 의 작업 번호·REQ)만 다르면 최신…」.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

- main 890f7d5 에서 `--check`: 「세포지도 최신: 내용이 같다(기준 커밋 도장·병합 이력(PR 목록)만 다름: 저장본 265e162 · 지금 890f7d5 …)」. `--root .` 게시 재료: 「저장소에서 새로 만든 판(기준 커밋 890f7d5, 병합 이력 다시 계산)」. 부품 시험 15/15.
