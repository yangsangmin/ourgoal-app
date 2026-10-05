# REQ — #TASK-ES-424 세포지도 --check 순환 끊기: 기준 커밋 도장은 빼고 내용만 비교

- 근거: 코디네이터 지시(2026-10-05) — #737(지도 갱신 PR) 병합 f020065 뒤 main `--check` 가 또 「갱신 필요」. 차이는 `source`(commit·short·committedAt·subject) 칸뿐. 지도 갱신 PR 을 병합하면 그 병합 커밋 때문에 다시 낡아지는 순환.
- 범위: `scripts/cell-map-export.js`(compareSaved·withoutStamp·STAMP_FIELDS, --check), `tests/cell-map-export-es414.test.js`(1건 추가, 기존 단언 그대로), `scripts/cell-map-sync.md`(1줄), REQ·claims·dev_log·TICKETS. **제품 코드(index.html, js/**)·cell-map.json 변경 0.**

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. `--check` 가 내용이 같은데 「갱신 필요」를 내지 않게 한다.
2. 시험에 「내용 같고 HEAD 만 다르면 최신」 단언을 더한다. 기존 단언은 지우지 않는다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 「갱신 필요」는 지도 내용이 앱과 달라졌을 때만 뜬다.
- **원인**: 기준 커밋은 `git log -1 --first-parent HEAD -- <입력 경로>`. 지도 갱신 PR 이 입력 경로(modules.json 등)를 건드리면 병합 커밋이 새 기준이 되는데, PR 안에서 만든 cell-map.json 은 그 병합 커밋을 미리 알 수 없다. 첫 부모를 빼도 같은 PR 안에서 입력과 지도를 같이 커밋하면 커밋 뒤 기준이 바뀐다 — 도장을 비교에 넣는 한 순환은 남는다.
- **중심**: 도장은 「언제 만들었나」 기록이고 「무엇이 들어 있나」가 아니다. 비교는 내용만.
- **핵심**: `compareSaved(saved, built)` — 바이트가 같으면 최신, 아니면 도장 4칸을 뺀 내용이 같을 때 최신(stampOnly). 그 밖의 칸(repo·basisPaths·generator 포함)은 그대로 비교.

## 3. [원칙 ③] 해결방식

- `STAMP_FIELDS = ['commit','short','committedAt','subject']`, `withoutStamp(doc)`, `compareSaved(savedText, builtText)` 를 더하고 `--check` 가 이것을 쓴다. 도장만 다르면 「세포지도 최신: 내용이 같다(기준 커밋 도장만 다름: 저장본 X · 지금 Y — 다시 만들 필요 없음)」.

## 4. [원칙 ④] 재검토 — 한계

- 저장본의 도장은 마지막으로 다시 만든 때의 커밋으로 남는다(내용이 같으면 그대로 둔다). 화면의 「기준 커밋」은 그 내용을 처음 만든 커밋이라는 뜻이 된다.

## 5. [원칙 ⑤] 절차

1. worktree `C:/dev/wt/cell-map-424`(origin/main f020065) → 수정 → 부품 시험 → `--check`(main 에서 「최신: 도장만 다름」) → npm test → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 "기준 커밋을 결정적으로(입력 파일을 마지막으로 바꾼 커밋) 정하면 비교를 바꿀 필요가 없다" → 같은 PR 에서 입력과 지도를 함께 커밋하면 커밋 전에 만든 지도의 기준은 커밋 뒤의 기준과 다르다(그 커밋 자체가 입력을 바꿨으므로). 커밋 해시를 지도 안에 미리 적을 수 없어 도장 비교로는 순환이 남는다.
- 반론 2 "도장을 빼면 낡은 지도를 최신으로 잘못 볼 수 있다" → 도장 4칸만 뺀다. 세포·줄 수·연결·PR 목록 등 내용이 한 글자라도 다르면 「갱신 필요」(시험: 줄 수 1 증가 → 갱신 필요, repo 칸 변경 → 갱신 필요).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 함수 `compareSaved`·`withoutStamp`·상수 `STAMP_FIELDS`(scripts/cell-map-export.js). 시험 「저장본과 내용이 같고 기준 커밋 도장만 다르면 최신으로 본다…」.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

- main(f020065) 에서 고친 --check: 「세포지도 최신: 내용이 같다(기준 커밋 도장만 다름: 저장본 f44e496 · 지금 f020065)」. 부품 시험 14/14.
