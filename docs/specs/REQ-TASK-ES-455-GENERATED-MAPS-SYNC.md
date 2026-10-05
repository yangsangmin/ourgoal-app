# REQ — #TASK-ES-455 생성 지도 3종 일괄 갱신(분열 PR #744~#759 반영)

- 근거: 코디네이터 운영 규칙(2026-10-05) — 분열 PR 은 module-baseline.json·cell-map.json·inline-script-map.json(.md) 를 커밋하지 않고, 세포지도 담당 세션이 main 최신에서 일괄 재생성해 sync PR 로 올린다(충돌 왕복 방지).
- 범위: `docs/architecture/module-baseline.json`(module-guard --update, 낮아진 값만), `docs/architecture/cell-map.json`(cell-map-export), `docs/architecture/inline-script-map.json`·`docs/architecture/INLINE-SCRIPT-MAP.md`(inline-script-map --write), REQ·claims·dev_log·TICKETS. **제품 코드(index.html, js/**)·생성기 스크립트 변경 0.**

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. main(3232cc2) 에서 생성기 3개를 돌려 생성 지도 3종을 지금 코드와 맞춘다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 세포지도·인라인 지도·래칫 기준선이 지금 main 의 실물을 가리켜야 상민님이 보는 구조도와 다음 분열 순서가 맞다.
- **원인**: 분열 PR 이 생성 파일을 함께 커밋하면 서로 충돌해 병합 왕복이 생긴다. 그래서 생성 파일 커밋을 빼기로 했고, 그만큼 main 의 생성 파일이 뒤처졌다.
- **중심**: 생성 파일은 결정적 생성기(같은 입력 → 같은 출력)가 만든다. 사람이 고치지 않는다.
- **핵심**: 한 세션이 main 최신에서 세 생성기를 한 번에 돌려 한 PR 로 올린다.

## 3. [원칙 ③] 해결방식

- `node scripts/module-guard.js --update`(사유 없음 = 낮아진 값만 반영) → `node scripts/cell-map-export.js` → `node scripts/inline-script-map.js --write`.

## 4. [원칙 ④] 재검토 — 한계

- 이 PR 병합 전에 다른 분열 PR 이 병합되면 지도가 다시 한 걸음 뒤처진다. 다음 일괄 갱신에서 따라잡는다(코디네이터가 3~5건마다 호출).

## 5. [원칙 ⑤] 절차

1. worktree `C:/dev/wt/maps-sync-455`(origin/main 3232cc2) → 생성기 3개 → 결정성(두 번 생성 해시 같음)·`--check` 확인 → npm test → PR.
2. 병합 뒤 `cell-map-publish --root .` 로 웹 저장본·노션 게시, 되읽기 대조.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 "기준선을 올려 버릴 수 있다" → `--update` 는 사유(`--reason`)가 없으면 지금 값이 기준선 이하일 때만 쓴다. 이번 실행도 사유 없이 돌렸다.
- 반론 2 "생성기 출력이 실행마다 달라 의미 없는 변경이 생긴다" → 세포지도·인라인 지도를 두 번 생성해 해시가 같음을 확인했고, `cell-map-export --check` 가 「최신」을 낸다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 스크립트: `scripts/module-guard.js`(--update), `scripts/cell-map-export.js`, `scripts/inline-script-map.js`(--write). 산출: 위 4개 파일.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

- `cell-map-export --check`: 최신. 두 번 생성 해시 같음(세포지도·인라인 지도). `module-guard`: 통과.

## 추가 (2026-10-05) — origin/main 4260afb(#760) 합치기 · 요약 줄 「— 」 수정

- #760 병합으로 처음 판(3232cc2 기준)이 낡아, 같은 브랜치에 origin/main 을 합치고(686904c) 생성기 3개를 다시 돌렸다. 주장 C1~C4 는 지우지 않고 같은 id 의 새 도장 값으로 바꿨다.
- 코디네이터 [기본값] 지시: `scripts/cell-map-publish.js` `notionHead` 의 800줄 초과 요약 줄이 초과 파일 0개일 때 「— 」로 끝나던 것을, 파일이 있을 때만 「— 파일 줄수」를 붙이게 한 줄 수정. 부품 시험 1건 추가(0개·1개 두 경우, 고치기 전 실패·고친 뒤 통과 확인).
