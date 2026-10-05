# REQ — #TASK-ES-418 세포지도 구조도 이름표: 세포 짧은 한국어 이름

- 근거: 코디네이터 지시(2026-10-05, 상민님 구조도 검토) — "노드 이름표가 코드 id(team-dm-room, comm/dm-ledger)라 비개발자인 상민님이 알아보기 어렵다. 이름표는 하는 일 짧은 한국어 이름(예: DM 대화방)을 크게, 코드 id 는 작게. 짧은 이름이 없으면 cell-descriptions 의 첫 구절(— 앞), 그래도 없으면 id."
- 범위: `docs/architecture/cell-descriptions.json`(names 칸 150), `scripts/cell-map-export.js`(shortName·name·nameSource), `docs/architecture/cell-map.json`(재생성), `tests/cell-map-export-es414.test.js`(1건), REQ·claims·dev_log·TICKETS. **제품 코드(index.html, js/**) 변경 0.**
- 바깥 화면(이 PR 밖): 세포지도 웹페이지 구조도 탭이 `name` 을 이름표로 쓴다(PR 본문 「저장소 밖 확인」).

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 구조도 노드 이름표를 사용자가 알아보는 짧은 한국어 이름으로, 코드 id 는 보조로.
2. 이름이 없을 때의 대체 순서: 짧은 이름 → 「하는 일」 첫 구절(— 앞) → id.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 결정권자가 그림만 보고 "이게 무슨 기능인지" 안다.
- **원인**: 세포지도 데이터에 사람이 읽는 이름 칸이 없어 화면이 파일에서 나온 id 를 이름표로 썼다. 「하는 일」은 문장이라 이름표로는 길다.
- **중심**: 이름은 생성기 입력(`cell-descriptions.json`)에 한 번 적고, 모든 화면이 같은 `name` 칸을 읽는다.
- **핵심**: 150개 세포 모두 손으로 쓴 짧은 이름(평균 7자 안팎). 새 세포가 생겨 이름이 빠져도 대체 규칙으로 빈칸이 없다.

## 3. [원칙 ③] 해결방식

- `cell-descriptions.json` 에 `names: { 세포 id: 짧은 이름 }` 150개.
- `scripts/cell-map-export.js` `shortName(hand, does, id)` — 손 이름 → `does` 를 ` — ` 로 나눈 앞 구절(20자 이하이고 문장 전체가 아닐 때) → id. 세포마다 `name`·`nameSource('hand'|'derived')`.

## 4. [원칙 ④] 재검토 — 한계

- 짧은 이름은 사람이 붙인 이름이다. 기능이 바뀌면 `names` 를 고쳐야 한다(설명 파일과 같은 관리 방식).
- 결정성 그대로(현재 시각 미사용). 기존 칸은 바뀌지 않고 칸 두 개만 늘어난다.

## 5. [원칙 ⑤] 절차

1. worktree `C:/dev/wt/cell-names`(`feat/2026-10-05-task-es-418-cell-short-names`, origin/main 107aa52).
2. 이름 150개 → 생성기 → 재생성 → 부품 시험 → npm test.
3. 커밋·PR → 법정. 웹페이지 저장본 갱신(세션).

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 "화면에서 이름을 만들어 쓰면 PR 이 필요 없다" → 이름이 화면 소스에만 있으면 노션·다른 화면이 같은 이름을 못 쓰고, 생성기 출력과 화면이 따로 논다. 이름은 데이터라 생성기 입력에 둔다.
- 반론 2 "하는 일 첫 구절로 충분하다" → 150개 중 ` — ` 가 있는 문장은 일부뿐이고, 없는 것은 id 로 떨어진다(예: home/index). 그래서 손 이름을 정본으로 두고 첫 구절은 대체로만 쓴다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 함수 `shortName`(scripts/cell-map-export.js), 칸 `names`(cell-descriptions.json)·`name`·`nameSource`(cell-map.json).
- 시험: `tests/cell-map-export-es414.test.js` 「세포마다 짧은 이름표(name)…」.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

- 손 이름 150/150, `team-dm-room` → 「DM 대화방」. 부품 시험 12/12. `--check` 최신.
