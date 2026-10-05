# REQ — #TASK-ES-498 생성 지도 일괄 갱신 2회차(main c1f0a72)

- **생성: 안티그래비티 / 검수·서류: Claude**
- 근거: 코디네이터 운영 규칙(2026-10-05) — 분열 PR 은 생성 파일(`docs/architecture/module-baseline.json`·`cell-map.json`·`inline-script-map.json`·`INLINE-SCRIPT-MAP.md`)을 커밋하지 않고, 일괄 갱신 PR 로 맞춘다. 이번 회차의 생성 커밋 f3bc5a7a 는 안티그래비티가 main c1f0a72 위에서 만들었다(커밋 메시지의 작업 번호 `TASK-ES-AGY-MAPS` 는 이 REQ 의 TASK-ES-498 로 정정한다 — 이력 보존을 위해 amend 하지 않음).
- 범위: 생성 파일 4개 + REQ·claims·dev_log·TICKETS. **제품 코드(index.html, js/**)·생성기 스크립트 변경 0.**

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. main(c1f0a72) 기준으로 생성 지도 4개를 지금 코드와 맞춘다(낮아진 기준선 반영 포함).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 세포지도·인라인 지도·래칫 기준선이 main 의 실물을 가리켜야 구조도와 다음 분열 순서가 맞다.
- **원인**: 분열 PR 이 생성 파일을 빼고 병합되므로(충돌 왕복 방지) main 의 생성 파일이 뒤처진다.
- **중심**: 생성 파일은 결정적 생성기가 만든다. 사람·AI 가 손으로 고치지 않는다.
- **핵심**: 한 번에 세 생성기를 돌려 한 PR 로 올리고, 생성자와 검수자를 나눈다(안티그래비티 생성, Claude 검수).

## 3. [원칙 ③] 해결방식

- `node scripts/module-guard.js --update`(사유 없음 = 낮아진 값만) → `node scripts/cell-map-export.js` → `node scripts/inline-script-map.js --write`.

## 4. [원칙 ④] 재검토 — 한계

- PR 병합 전에 다른 분열 PR 이 들어오면 다시 뒤처진다. 그때는 main 을 합친 뒤 생성 파일을 손으로 풀지 않고 다시 생성한다.

## 5. [원칙 ⑤] 절차

1. 안티그래비티: worktree `C:/dev/wt/agy-maps`(origin/main c1f0a72)에서 생성기 3개 → 커밋 f3bc5a7a.
2. Claude 검수: 같은 트리에서 `cell-map-export --check`(최신)·`module-guard`(통과)·인라인 지도 재생성(커밋본과 차이 0, 줄끝만 다름) 확인, origin/main 이 그 사이 움직이지 않았음 확인.
3. 서류(REQ·claims·dev_log·TICKETS) 커밋 → PR → 법정 판정 → 병합 뒤 웹·노션 세포지도 게시.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 "다른 AI 가 만든 생성 파일을 그대로 믿을 수 없다" → Claude 가 같은 트리에서 생성기를 다시 돌려 커밋본과 내용이 같음을 확인했다(인라인 지도 재생성 차이 0, 세포지도 `--check` 최신).
- 반론 2 "기준선이 올라갔을 수 있다" → `--update` 는 사유 없이는 낮아진 값만 쓴다. 더해진 것은 이력 항목 1개다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 스크립트: `scripts/module-guard.js`(--update) · `scripts/cell-map-export.js` · `scripts/inline-script-map.js`(--write). 산출: 위 4개 파일.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

- `cell-map-export --check`: 최신. `module-guard`: 통과. 인라인 지도 재생성: 커밋본과 차이 0.
