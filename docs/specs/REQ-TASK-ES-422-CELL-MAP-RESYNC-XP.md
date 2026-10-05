# REQ — #TASK-ES-422 세포지도 다시 만들기(#736 레벨 서버 원장 반영)·xp.award 능력 설명 바로잡기

- 근거: 코디네이터 지시(2026-10-05) — #736(TASK-ES-421, EXP 를 서버 원장으로) 병합 f44e496 뒤 main 에서 `node scripts/cell-map-export.js --check` = 「갱신 필요」. 헌법의 세포지도 상시 연동대로 새 worktree 에서 재생성 PR. 덧붙여 #736 빌더 보고: `modules.json` 의 `xp.award` 능력 설명이 옛 문구(기기 저장)로 남아 있다.
- 범위: `docs/architecture/modules.json`(avatar/xp 의 capabilities 중 xp.award 설명·sideEffect — 손으로 정하는 칸, 코드의 provide meta 와 같게), `docs/architecture/cell-map.json`(재생성), REQ·claims·dev_log·TICKETS. **제품 코드(index.html, js/**)·생성기 코드 변경 0.**

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. main(f44e496) 기준으로 세포지도 저장본을 다시 만든다.
2. 신고서의 `xp.award` 설명을 지금 동작(로그인은 서버 원장, 게스트는 기기)으로 고치고 `module-specs --write` 로 신고서를 재생성한다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 세포지도와 신고서가 지금 앱과 같다. AI 비서가 읽을 능력 설명이 실제 저장 위치를 말한다.
- **원인**: #736 이 js/avatar/xp.js 를 바꿔 줄 수·연결이 달라졌는데 cell-map.json 은 생성 파일이라 병합 뒤 다시 만들어야 한다. 신고서의 `capabilities` 는 손으로 정하는 칸이라 코드 변경을 따라가지 않는다.
- **중심**: 생성 파일은 병합 뒤 main 에서 다시 만든 것만 정본. 손 칸은 코드의 `caps.provide('xp.award', …)` meta 와 같은 글자로.
- **핵심**: xp.award 설명 = 코드 meta 그대로, sideEffect `local` → `server`(코드와 같게).

## 3. [원칙 ③] 해결방식

- modules.json 의 avatar/xp `capabilities[xp.award]` 설명·sideEffect 를 코드 meta 와 같은 글자로 고친 뒤 `node scripts/module-specs.js --write`, `node scripts/cell-map-export.js`.

## 4. [원칙 ④] 재검토 — 한계

- cell-map.json 은 능력 설명 칸을 싣지 않는다(이름·provides 만). 그래서 설명 수정은 신고서에만 반영된다.

## 5. [원칙 ⑤] 절차

1. worktree `C:/dev/wt/cell-map-422`(origin/main f44e496) → 손 칸 수정 → module-specs --write → cell-map-export → --check 최신 → 부품 시험·npm test → PR.
2. 병합 뒤 웹 저장본·노션 갱신(2~5단계), 되읽기 대조.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 "설명 칸은 기능에 영향이 없으니 두어도 된다" → 미래 AI 비서와 상태창이 `describe()`·신고서를 그대로 읽는다. 저장 위치를 틀리게 말하면 개인정보·데이터 판단을 그르친다.
- 반론 2 "sideEffect 를 바꾸면 승인선 판정이 달라진다" → 코드는 이미 `server` 로 등록한다(#736). 신고서를 코드와 맞출 뿐이고 `needsConfirm` 은 그대로(외부 행위 아님).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- `docs/architecture/modules.json` cells[avatar/xp].capabilities[xp.award] · `js/avatar/xp.js` `caps.provide('xp.award', awardXP, {...})`(읽기만) · `cell-map.json` source.short f44e496.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

- 세포 161 · 기준 커밋 f44e496 · `--check` 최신 · module-specs --write 세포 161.
