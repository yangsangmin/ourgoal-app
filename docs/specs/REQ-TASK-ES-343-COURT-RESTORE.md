# 요구사항 정의서 (REQ) — #TASK-ES-343 법정(court) 복원 + 변경분 한정 정적 검사 이식

> **문서 ID**: REQ-TASK-ES-343-COURT-RESTORE  
> **작업 일시**: 2026-10-04  
> **작성자**: Claude Code 세션(서브에이전트)  
> **성격**: 금고(동결) 변경 — `court/**`·`.github/workflows/court.yml`. 상민님 승인된 작업이며, 병합은 상민님이 한다.

## 지시 원문 (요약 아님, 위임 브리프의 지시 항목)

1. `.github/workflows/court.yml` 을 PR #650 이전(`a18f22e^`) 내용으로 정확히 복원한다. 관리자 키(service role)·쓰기 권한이 없고 `pull_request_target` + main 의 `court/` 를 쓰는지 확인한다.
2. v4 엔진에 있던 정적 검사를 "PR 이 새로 만든 것만" 잡는 형태로 예전 법정에 이식한다.
   - (a) 800줄 상한: `js/` 아래 `.js` 가 작업 커밋에서 800줄 초과 — 기준 커밋에 없던 파일 / 기준에서 800줄 이하였는데 넘음 / 이미 넘던 파일이 더 길어짐만 위반. 같거나 줄었으면 위반 아님.
   - (b) CSS 은폐: `display\s*:\s*none\s*!important`, `position\s*:\s*absolute\s*;\s*left\s*:\s*-9999px` 가 PR diff 의 추가된 줄에 새로 나온 경우만. 지운 줄은 무시.
   - (c) 금지 키워드: AGENTS.md `anti_pattern_blacklist` 12개 정규식이 제품 파일의 추가된 줄에 새로 나온 경우만.
   - 위반이면 "돌려보냄", 사유에 파일·줄·패턴. 기존 검사 로직·임계값은 바꾸지 않고 추가만. PR 코드를 실행하지 않고 git 데이터만 읽는다.
3. `court/engine.js` 는 지우지 않는다. README 에 "사용되지 않음, 존치 여부는 상민님 결정" 단락을 둔다.
4. README 에 새 검사 3종을 문서화한다.
5. 측정: selftest, 새 검사 3경우(기존 부채만 → 0, 새 `display:none !important` → 검출, 800줄 넘는 새 js → 검출).

## 1. [원칙 ①] 문제 파악

PR #650(커밋 `a18f22e`)이 `.github/workflows/court.yml` 을 v4 엔진(`court/engine.js`)으로 바꾼 뒤, 열린 PR(#651·#652)이 전부 REJECTED 로 막혔다.

## 2. [원칙 ②] 본질·원인 (코드 근거)

| # | 문제 | 근거 |
| :-- | :-- | :-- |
| ① | 저장소 전체 스캔 — 기존 부채를 PR 위반으로 셈 | `court/engine.js` 115행 `targetDirs = ['js/', 'css/', 'index.html']`, 136~170행 파일 전체 내용 검사. 실행 37175028445 에서 `js/avatar-system.js` 7352줄 등으로 REJECTED |
| ② | 가짜 판정 — E2E 미실행인데 "Level 5 … Verified" | `court/engine.js` 182·189행 `return true`, 188행 playwright 호출이 주석, 238행 `Level 5 (Supabase Realtime Actual Account E2E Verified)` |
| ③ | 판사 분리 붕괴·관리자 키 노출 | v4 `court.yml` 4행 `pull_request`(PR 쪽 engine.js 실행), 39행 `SUPABASE_SERVICE_ROLE_KEY` 를 그 단계 환경변수로 전달 |
| ④ | 주장 파일 경로 불일치 | `court/engine.js` 58행 `TASK-PR-<번호>` — 저장소 관례는 `reports/TASK-ES-xxx/` |
| ⑤ | 댓글 게시 403 | 실행 37175028445 의 5단계 `HttpError: Resource not accessible by integration`(권한 블록 없음) |

## 3. [원칙 ③] 해결 방식

- 워크플로를 `a18f22e^` 판으로 되돌린다(예전 법정: `pull_request_target`, `trusted/court/judge.js`, 읽기 권한 둘, 판정 게시는 `court-publish.yml`).
- `court/lib/new-debt.js` 신설: 두 커밋의 `git show`/`git diff -U0` 글자만 읽어 세 가지 새 위반을 센다. `court/judge.js` 의 "2) 추가된 줄 검사" 바로 뒤에서 불러 `reject(제목, 사유)` 로 넣는다.

## 4. [원칙 ④] 재검토

- 판정 범주: README 2절의 "돌려보냄"(종료코드 1). 기존 "추가된 줄 검사"(검증 환경 감지·시험 결과 꾸미기)와 같은 갈래로, 제목에 "고장"을 넣지 않는다(첫 줄의 "되던 기능 N개가 고장" 집계에 섞이지 않게).
- 독립 검토 반영(2026-10-04): 은폐 줄·금지 낱말이 이미 있던 줄의 다른 부분만 고치면 그 줄이 +줄로 나와 기존 부채가 새 위반으로 잡힌다(main 의 `ui.css` 에 해당 줄 다수). 그래서 추가된 줄에 패턴이 있고 **파일 안의 그 패턴 수가 기준 커밋보다 늘었을 때만** 위반으로 센다(`countMatches`). 자가시험에 "기존 줄의 다른 부분만 수정 → 0건", "같은 줄에 하나 더 → 검출" 사례를 넣었다.
- 대상 파일: 법정이 이미 쓰는 "배포되는 제품 파일"(`isDeployed` — 금고 분류의 제품 중 `denyServePrefixes` 밖). 금지 낱말·은폐는 `.js/.css/.html` 만.

## 5. 식별자

| 종류 | 식별자 |
| :-- | :-- |
| 파일(신규) | `court/lib/new-debt.js`, `court/selftest/unit-new-debt.js` |
| 파일(수정) | `court/judge.js`(require 1줄 + 호출 3줄), `court/selftest/unit.js`(등록 1줄), `court/README.md`, `.github/workflows/court.yml`(복원) |
| 함수 | `newDebt.check({repo, base, head, changed, isProduct})`, `countLines`, `lineLimitViolation`, `addedLinesWithNumbers`, `scanAdded` |
| 판정서 사유 제목 | `800줄 상한을 새로 넘김`, `CSS 은폐 줄이 새로 추가됨`, `금지 낱말이 새로 추가됨` |
| 자가시험 id | `U-new-debt-pure`, `U-new-debt-repo`, `U-new-debt-judge` |
| DOM ID | 해당 없음(제품 화면 변경 없음) |

## 6. [원칙 ⑥] 반론과 격파

1. **반론**: "기존 부채를 안 세면 부채가 영원히 남는다." → 격파: 이 검사의 목적은 PR 단위 판정이다. 기존 부채를 PR 에 지우면 모든 PR 이 막혀(실측: #651·#652 모두 REJECTED) 판정이 정보를 잃는다. 부채를 늘리는 변경(이미 넘던 파일이 더 길어짐)은 잡으므로 부채는 줄어들기만 한다.
2. **반론**: "추가된 줄만 보면 파일을 옮기면서 은폐 줄을 다시 넣는 것을 놓친다/또는 옮긴 기존 줄을 오탐한다." → 격파: 이름 변경은 `git diff base:옛경로 head:새경로` 로 옛 판과 맞대어 보므로 옮긴 기존 줄은 세지 않고, 옮기면서 새로 넣은 줄은 추가된 줄로 잡힌다(자가시험 `U-new-debt-repo` 의 이동 사례).

## 7. 범위 밖

- `court/engine.js` 삭제(상민님 결정), `court-publish.yml`·다른 워크플로, 헌법·AGENTS.md·package.json scripts·vercel.json.
- 기존 부채(800줄 초과 12개 파일 등) 정리.
