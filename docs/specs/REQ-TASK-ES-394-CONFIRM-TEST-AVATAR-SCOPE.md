# REQ/PLAN — TASK-ES-394 확인창 시험의 「confirm( 직접 호출 없음」 검사가 아바타 합본을 읽는다 (시험지, 제품 0)

> 근거: #708(TASK-ES-390, 아바타·EXP 쪼개기 PR-4)로 아바타 설정 모달이 `js/avatar/modal/*`, 기능 카드 핸들러가 `js/avatar/feature-cards.js` 로 옮겨졌는데, `tests/core-confirm-es374.test.js` 의 부재 단언은 `js/avatar-system.js` 한 파일만 읽어 옮긴 코드가 검사 밖에 있다. 코디네이터 지시(2026-10-05).
> 제품 코드 변경 0. 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0.

## REQ
- 대상 파일: `tests/core-confirm-es374.test.js` (검사 「index.html 밖 9개 파일에 기본 확인창 직접 호출이 없고 모두 ui.confirm.bind 를 부른다」)
- 대상 함수(신규, 시험 파일 안): `listJsTree(dir, recursive)`, `readAvatarFile(f)`, `readAvatarBundle(rootDir)`
- 대상 변수: 같은 검사의 `scan`(부재 단언이 읽는 글자)
- 대상 DOM ID: 없음(시험지 변경)
- R1: `js/avatar-system.js` 칸의 부재 단언(`confirm(`·`window.confirm(` 없음)이 아바타 합본을 읽는다. 합본 범위·접두 제거는 `scripts/smoke-test.js` `AVATAR_SRC` 와 같다.
- R2: 단언 문장·기대값·검사 수 변경 0, 지운 단언 0. 같은 종류(아바타·팀 원본 한 파일만 글자로 읽는 tests/)를 목록화해 함께 넓힌다.

## 1. [원칙 ①] 목표 정의
아바타 코드가 어느 파일로 옮겨 가도 "기본 확인창을 직접 부르지 않는다" 감시가 그 코드를 계속 본다. 단언은 하나도 바꾸지 않고 읽는 범위만 넓힌다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 시험은 '아바타 코드'를 봐야 하는데 '아바타 코드가 예전에 있던 파일 한 개'를 본다.
- 원인(측정): `scan` 은 팀(`js/team-invite-comm.js` → `readTeamCommBundle`, #703)·통계(`js/universal-stats.js` → `readStatsBundle`, #707)만 합본이고, `js/avatar-system.js` 는 원문 한 파일(`src`). `js/avatar/` 아래 파일 13개(모달 섹션 7 포함)는 검사 밖.
- 중심: 부재 단언은 범위가 좁으면 "없음"을 거짓으로 보여 준다 — 옮긴 파일에 `confirm(` 을 넣어도 통과(변이 실측, 8절).
- 핵심: 아바타 칸만 `scan` 을 아바타 합본으로. 존재 단언(`OurgoalCapabilities.request('ui.confirm.bind')`)은 원문 한 파일 그대로(통로 줄은 원본에 남는다 — #703·#707 과 같은 원칙).

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
- 아바타 합본 = `js/avatar-system.js` + `js/avatar/**/*.js`(재귀, 이름순) + `js/data/avatar-personas/*.js`(이름순) — `scripts/smoke-test.js` `AVATAR_SYSTEM_JS`·`AVATAR_PART_FILES`·`AVATAR_SRC` 와 같은 범위. 파일마다 `readAvatarFile` 로 생성기 접두 `AV.`·`MS.` 를 떼고, `OurgoalAppScope` 를 읽는 파일만 `L.`·`K.` 도 뗀다(smoke `readAvatarFile` 와 같은 정규식).
- `listJsTree` 는 smoke-test.js 와 같은 정의를 시험 파일 안에 둔다(시험 파일 사이 공용 모듈을 새로 만들지 않음 — 선례 #700·#703·#707 도 파일마다 복사).
- 같은 종류 목록화(측정, 8절): tests/ 중 `js/avatar-system.js`·`js/team-invite-comm.js` 를 원문 글자로 읽는 시험 — `core-confirm-es374` 의 아바타 칸 1곳만 남아 있었다. 나머지는 이미 합본(아바타 6개·팀 9개) 이거나 `require`/vm 실행(글자 단언 아님).

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A `files` 배열에 `js/avatar/modal/*.js` 등을 낱낱이 추가: 검사 제목의 "9개 파일"·`ui.confirm.bind` 존재 단언이 새 파일마다 걸려 기대가 바뀐다(새 파일엔 통로 줄이 없다) → 단언 변경이라 금지.
- B smoke-test.js 를 require 해서 `AVATAR_SRC` 를 가져옴: smoke 는 실행하면 전체 검사를 돈다(부작용) → 버림.
- C 아바타 칸 `scan` 만 합본으로(팀·통계와 같은 꼴) → 선택.

## 5. [원칙 ⑤] 절차
1) #707 병합 뒤 origin/main 위에서 시작(충돌 0) → 2) 기준 `git archive origin/main` 스크래치 사본 → 3) 같은 종류 목록화(grep) → 4) 시험 수정 → 5) 기준·작업·변이 트리 실행 비교 → 6) npm test 기준·작업 비교 → 7) claims·기록 → 8) PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "범위를 넓히면 오늘 통과하던 시험이 깨질 수 있다" → 작업 트리 실측 14건 통과(기준과 같음). `js/avatar/**`·`js/data/avatar-personas/**` 에 `confirm` 글자 0(grep). 넓힌 범위는 smoke 가 이미 아바타 글자 단언에 쓰는 범위와 같다.
- 반론② "접두 제거로 글자를 바꿔 읽으면 진짜 코드와 다르다" → 떼는 것은 생성기가 붙인 `AV.`·`MS.`·`L.`·`K.` 접두뿐이고, `confirm(` 앞의 접두를 떼면 오히려 `AV.confirm(` 같은 꼴도 부재 단언에 걸린다(더 엄격). `window.confirm(` 는 접두 제거와 무관하게 그대로 걸린다.

## 7. [원칙 ⑦] 즉시 실행 — 결과
`tests/core-confirm-es374.test.js` 만 변경(+28 −1). 지운 줄 1개는 `scan` 삼항식의 끝 줄(`: src;` 를 다음 줄로 넘김) — 지운 단언 0. 제품 코드 0, 금고 파일 0, 단언 문장·기대값·검사 수(14) 0 변경.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — `reports/TASK-ES-394/test-compare.json`:
- 기준 사본·작업 트리: 확인창 시험 14건 통과·종료 0(같음).
- 변이(스크래치만): `js/avatar/modal/bind-save.js` 에 `confirm(` 탐침 → 기준 시험지 통과(공백 입증)·새 시험지 실패. `js/avatar/feature-cards.js` 에 `window.confirm(` 탐침 → 기준 통과·새 실패.
- npm test: 기준 사본·작업 트리 모두 smoke 443개 통과·0개 실패, 무결성 38/38. 로그 차이는 기준 사본에 .git 이 없어 생기는 줄뿐.
- 막히는 지점: 아바타 세포가 `js/avatar/`·`js/data/avatar-personas/` 밖으로 옮겨 가면 합본에서 빠진다 — smoke `AVATAR_SRC` 와 같이 넓혀야 한다(두 곳 같은 범위 유지).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
