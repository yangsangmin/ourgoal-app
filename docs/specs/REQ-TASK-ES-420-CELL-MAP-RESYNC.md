# REQ — #TASK-ES-420 세포지도 다시 만들기(#732 components 분열 반영)·새 세포 11개 짧은 이름

- 근거: 코디네이터 지시(2026-10-05) — #732(components.js 분열, 새 세포 11개) 병합 4fe01ac 뒤 main 에서 `node scripts/cell-map-export.js --check` = 「갱신 필요」(#733 이름표와 #732 가 cell-map.json 을 따로 고침). 절차(scripts/cell-map-sync.md) 1단계로 다시 만들고, 새 세포의 짧은 한국어 이름을 채운다.
- 범위: `docs/architecture/cell-descriptions.json`(names 11개 추가), `docs/architecture/cell-map.json`(재생성), REQ·claims·dev_log·TICKETS. **제품 코드(index.html, js/**)·생성기 코드 변경 0.**

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. main 의 세포지도 저장본을 지금 코드 기준으로 다시 만든다(세포 150 → 161).
2. 새 세포 11개(components-*-actions)에 #733 방식의 짧은 한국어 이름을 채운다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 상민님이 보는 세포지도가 지금 앱과 같다.
- **원인**: 두 PR(#733 이름표, #732 분열)이 각자 cell-map.json 을 만들어 병합 결과가 어느 쪽 생성 결과와도 다르다(생성 파일은 병합으로 합쳐지지 않는다).
- **중심**: 병합 뒤 main 위에서 생성기를 한 번 더 돌린 결과만 정본.
- **핵심**: 새 세포 11개 모두 손 이름 — 이름표 161/161, 「하는 일」 161/161.

## 3. [원칙 ③] 해결방식

- worktree(origin/main 4fe01ac)에서 names 11개를 더하고 `node scripts/cell-map-export.js` 로 재생성. 생성기 코드는 고치지 않는다.

## 4. [원칙 ④] 재검토 — 한계

- 같은 일이 PR 마다 반복된다(생성 파일 충돌) — 절차상 의도된 비용(다른 PR 이 지도를 고치지 않게 하면 충돌은 없지만, #732 처럼 고치는 PR 이 있으면 병합 뒤 한 번 더 만든다).

## 5. [원칙 ⑤] 절차

1. worktree `C:/dev/wt/cell-map-420` → names 11개 → 재생성 → `--check` 최신 → 부품 시험 → npm test → PR.
2. 병합 뒤 웹 저장본·노션 갱신(2~5단계), 되읽기 대조.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 "#732 판 cell-map.json 을 그대로 두면 된다" → #732 판에는 #733 의 name 칸이 없고, #733 판에는 새 세포 11개가 없다. 둘 다 지금 코드와 다르다(`--check` 갱신 필요로 실측).
- 반론 2 "이름을 첫 구절로 자동으로 두면 된다" → 새 세포의 「하는 일」에는 ` — ` 가 없어 이름표가 id(components-…-actions)로 떨어진다. 손 이름이 필요하다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 칸 `names`(cell-descriptions.json) 11개: components-auth-actions … components-widget-actions. 출력 `cell-map.json` summary.cells 161.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

- 세포 161 · 800줄 초과 처음 12 → 지금 3 · 기준 커밋 4fe01ac · 손 이름 161/161 · 「하는 일」 대기 0 · `--check` 최신 · 부품 시험 12/12.
