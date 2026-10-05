# REQ — #TASK-ES-465 시험지가 기관 세포 합본을 읽음 — 인라인 어려움 기관(단계 4, 자리 HO) 이전 선행 + 어려움 집계 표 제목 표시 고침

- 근거: 코디네이터 지시(2026-10-05, #762 병합 뒤 — 기관 16묶음 빌더 배정, 설계 문서 1절 구역 표 제목이 「/G/0/2/5/ /X/P/…」처럼 깨짐 고칠 것) · 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` 2-6(시험지 선행) · 헌법 CELL_SPLIT 3(시험지 선행 — 기대값·단언·검사 수를 바꾸지 않고 읽는 범위만 넓힌다, retire 금지) · 선례 #TASK-ES-441(PR #751).
- 범위: 시험 도우미 1개·시험지 4개의 읽는 줄 하나씩·집계 도구 표시 1곳. **제품 코드 0, 금고 파일 0, 단언·기대값·검사 수 변경 0, retire 0.**

## 1. [원칙 ①] 문제 정확히 파악

1. 기관 묶음(여러 구역이 부르는 공용 부품 — Utilities·표준 시간대 날짜 키·Modal helper·조선소 레지스트리 초기화 …)은 `js/core/*.js` 로 옮겨야 한다(세포 종류 organ). 그런데 시험 도우미 `tests/helpers/inline-bundle.js`(#441)는 `js/tabs/**` 세포만 합본에 붙인다.
2. 그래서 기관 묶음을 옮기면, 법정이 기준 커밋의 시험지로 채점할 때 smoke-test 가 `pad`·`nowISO` 같은 FN_NAMES 함수를 못 찾아 죽고(작업자 실측: 「함수를 찾을 수 없음: pad」), 합본 도우미를 쓰는 시험지 4개와 index.html 만 읽는 시험지 3개가 실패한다.
3. 어려움 집계 도구(`scripts/inline-hard-types.js`)가 표 제목의 `|` 를 바꾸는 정규식을 `/|/g`(빈 글자에 맞음)로 써서 제목 글자마다 `/` 가 끼어 있다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 시험지는 "코드가 어디 있든 같은 단언"이어야 하는데, 합본이 탭 세포 칸만 알아 기관 칸으로 옮긴 코드를 못 본다.
- **원인**: #441 은 탭 구역(P0~P2)만을 위해 `js/tabs/**` 로 범위를 정했다. 기관 세포 칸(`js/core`)은 원래 기관(app-scope·event-bus …)과 섞여 있어 그대로 붙이면 줄 세기 시험이 달라질 수 있다.
- **중심**: 합본에 붙일 `js/core` 파일을 "인라인에서 생성기로 옮겨 온 파일"로만 좁히는 표지 — 생성기가 세포 파일에 남기는 `/* ---- 이전 전 index.html a~b줄(#TASK-… 생성기 표지) ---- */`.
- **핵심**: `inlineCellFiles()` = (기존) js/tabs app-scope 세포 + (새) `js/core/*.js` 중 생성기 표지를 담은 파일. 지금 main 에는 그런 core 파일이 0개라 합본은 이전과 바이트가 같다 → 지금 커밋에서 모든 시험 결과가 같고, 이전 PR 이 오면 같은 단언이 세포 글자를 찾는다.

## 3. [원칙 ③] 해결방식

- `tests/helpers/inline-bundle.js`: `coreMovedCellFiles()`(js/core 맨 위 칸, 생성기 표지 정규식 `MOVED_MARK`) 를 더하고 `inlineCellFiles()` 끝에 이어 붙인다. 원문 맨 앞 규칙·`L.` 떼기 규칙 그대로.
- 시험지 4개 — index.html 읽는 줄 하나만 `require('./helpers/inline-bundle').withInlineCells(…)` 로 감쌈: `tests/gcal-login-reconnect-fix.test.js`(구글 캘린더 토큰 격리·휴지통 묶음 글자), `tests/record-ledger-sync.test.js`(뱃지·홈 콕핏 묶음 글자), `tests/unique-display-name.test.js`(뱃지 묶음 글자), `tests/top-page-guide-reposition.test.js`(조선소 레지스트리 초기화 묶음 글자). 대상은 `scripts/inline-hard-test-probe.js --only <기관 16묶음>` 실측(기준 2회 모두 통과였는데 묶음을 비우면 실패, 합본 도우미를 안 쓰는 시험지)으로 뽑았다.
- `scripts/inline-hard-types.js`: 제목 표시 정규식 3곳 `/|/g` → `/\|/g`. 설계 문서 1절 표·`inline-hard-types.json` 을 같은 도구로 다시 만듦(지도 3종은 커밋하지 않음 — 도구는 임시 사본에서 지도를 다시 만들어 돌렸다).

## 4. [원칙 ④] 재검토 — 한계

- 모의 이전은 이전 PR(#TASK-ES-466 예정)의 설정 `inline-organ-1.json` 그대로 임시 사본에서 돌렸다. 「Confetti」·「뱃지 컬렉션」·「전역 휴지통」(H3 빌더가 가져갈 수 있어 맨 뒤)과 나머지 기관 묶음은 모의 이전에 넣지 않았다 — 그 묶음들이 깨는 시험지도 이번에 넓혔다(실측 목록 기준).
- `scripts/smoke-test.js` 는 고치지 않았다(이미 합본 도우미를 읽는다 — #441). 무결성 검사(`verify-integrity-gate.js`, 금고)는 `js/core/*.js` 를 이미 읽어 모의 이전에서도 38/38 이다.

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/inline-organ`(브랜치 `feat/2026-10-05-task-es-465-inline-organ-1`, 기준 origin/main 8472bbc, push 로 번호 선점) → 기관 16묶음 시험지 실측 → 도우미·시험지 4개 → 집계 표시 고침 → 기준·작업·모의 이전(옛/새 시험지) 시험 실행 → 문서 → 커밋 → 법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "합본에 js/core 를 붙이면 줄 세기 시험(core-confirm 확인창 19곳)이 달라진다." → 붙이는 것은 생성기 표지를 담은 파일뿐이고 지금 main 에는 0개다. 측정: 기준 대 작업 tests 123개 종료 코드 차이 0, smoke 443/0·무결성 38/38·버튼 943/943 같음.
- 반론 2: "읽는 범위를 넓히면 단언이 느슨해진다." → 원문이 맨 앞이라 아직 인라인에 있는 글자는 원래 자리에서 먼저 찾힌다. 단언 문장·기대값·검사 수는 한 글자도 안 바뀌었다(바뀐 줄은 읽는 줄 4개·도우미뿐 — diff).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 함수: `coreMovedCellFiles`, `inlineCellFiles`, `withInlineCells`, `readCell`(`tests/helpers/inline-bundle.js`).
- 파일: `tests/helpers/inline-bundle.js`, `tests/gcal-login-reconnect-fix.test.js`, `tests/record-ledger-sync.test.js`, `tests/unique-display-name.test.js`, `tests/top-page-guide-reposition.test.js`, `scripts/inline-hard-types.js`, `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md`, `docs/architecture/inline-hard-types.json`, `reports/TASK-ES-465/`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 결과 |
| :-- | :-- |
| 지금 커밋 | 기준 대 작업 tests·scripts/test-* 123개 종료 코드 차이 0, smoke 443/0 · 무결성 38/38 · 버튼 943/943 같음 (`test-compare.json`) |
| 모의 이전 — 옛 시험지 | 7개 실패(합본 도우미를 쓰는 4개 + index.html 만 읽는 3개), smoke 「함수를 찾을 수 없음: pad」로 중단 (`mock-move.json`) |
| 모의 이전 — 새 시험지 | 실패 0, smoke 443/0 · 무결성 38/38 · 버튼 943/943. 기준과 다른 것은 module-guard 1건(모의 사본은 신고서 등록을 안 함) |
| 표 제목 | 설계 문서 1절 표에 `/G/0` 꼴 0곳 |

[4단계: 심사 청구]
