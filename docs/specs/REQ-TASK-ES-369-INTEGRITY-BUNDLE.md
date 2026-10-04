# REQ/PLAN — TASK-ES-369 동결 검사(verify-integrity-gate)가 세포 파일 합본을 읽는다

> 금고(동결 목록) 파일 변경: `scripts/verify-integrity-gate.js`.
> 승인 원문(상민님, 2026-10-04): "끝난 뒤 지침이 필요한 일들 모두 세션권장대로 진행해" — 세션 권장안이 이 변경(읽는 범위만 합본으로, 단언·기대값·검사 수 불변)이다.

## REQ
- 대상 파일: `scripts/verify-integrity-gate.js` (금고 파일 — 바꾼 것은 '무엇을 읽느냐'뿐)
- 대상 함수: `listJsTree(dir, recursive)`·`readAppModule(f)` (신규, `scripts/smoke-test.js` 와 같은 본문), 합본 `html`, 상수 `APP_MODULE_FILES`
- 대상 검사(읽는 곳만 변경): 전역 `html`, 320종 검사 `freshHtml`, 77종 금지 검사 `uiFilesToCheck`, `[검증 18]`~`[검증 22]` 의 `indexContent`, 마지막 검사(#TASK-ES-201)의 `indexHtml`
- 대상 DOM ID: 없음(검사 스크립트 변경, 제품 코드 0)

## 1. [원칙 ①] 목표 정의
탭 코드를 index.html 에서 세포 파일(js/tabs/**, js/core/*)로 옮겨도(동작 그대로) 동결 검사가 같은 단언으로 같은 코드를 찾게 한다. 단언·기대값·검사 수(38)는 바꾸지 않는다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 검사는 '앱 코드'를 봐야 하는데 '앱 코드가 들어 있는 파일 한 개'를 보고 있다.
- 원인: 시험지 `scripts/smoke-test.js` 는 PR #669·#670(ES-357·ES-359)에서 합본 읽기로 바뀌었지만, `verify-integrity-gate.js` 는 금고 파일이라 같이 바뀌지 않았다. 이 스크립트는 index.html 한 파일만 읽는다(원래 27·461·777·799·821·846·875·924줄).
- 중심: 일정 탭 이전(PR #673, TASK-ES-360)에서 `calCellHtml` 을 옮기면 `[검증 21/21] #TASK-ES-197` 의 `cal-photo-diary-bg` 단언이 깨져 index.html 에 남겨야 했다(js/tabs/calendar/render.js 6줄 주석).
- 핵심: 두 검사의 '읽는 범위'를 같게 맞추면 단언을 하나도 건드리지 않고 이전 막힘이 풀린다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
smoke-test.js 의 `listJsTree`·`readAppModule`·합본 식을 같은 글자로 옮기고(경로 기준만 `ROOT_DIR`), index.html 을 직접 읽던 곳(`freshHtml`·`indexContent`×5·`indexHtml`)을 합본 `html` 로, 77종 금지 검사 `uiFilesToCheck` 에 `...APP_MODULE_FILES` 를 더한다.

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 세포 이전 때마다 단언 대상 글자를 index.html 에 남김: 모놀리스 유지, 이전 막힘.
- B 단언마다 세포 파일 경로 추가: 단언 변경, 탭마다 반복.
- C smoke-test 와 같은 합본을 읽게 함: 단언 0 변경 → C 선택.

## 5. [원칙 ⑤] 절차
1) main 기준선 측정 → 2) 읽는 곳 교체 → 3) 변경 후 측정 → 4) calCellHtml 임시 이전 사본에서 전후 실측 + 음성 대조 → 5) claims·기록 → 6) PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "검사를 느슨하게 한다" → 존재 단언은 같은 글자를 더 넓은 범위에서 찾을 뿐이고, 금지 단언(77종·mailto·준비중 토스트 등)은 범위가 넓어져 오히려 엄격해진다. 단언 줄 diff 0, 검사 수 38 그대로. 아래 음성 대조에서 세포 파일의 글자를 지우면 여전히 실패한다.
- 반론② "순서 검사(goalAgentCard < goal-head-row indexOf)가 세포 파일 글자에 걸린다" → 합본은 index.html 을 맨 앞에 두므로 indexOf 첫 위치는 index.html 그대로. main 실측 38/38.

## 7. [원칙 ⑦] 즉시 실행 — 결과
`scripts/verify-integrity-gate.js` +30 −14줄(단언 줄 변경 0). 다른 금고 파일(court/**, AGENTS.md, CLAUDE.md, .github/workflows/**, scripts/essence-gate.js, package.json scripts, vercel.json) 변경 0.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님):
- main(a10c6b2) 변경 전 `node scripts/verify-integrity-gate.js`: 총 38개 중 38개 통과 → 변경 후: 총 38개 중 38개 통과.
- calCellHtml 임시 이전(스크래치 사본, 커밋 안 함): index.html 10558~10635줄(78줄) `function calCellHtml` 을 `js/tabs/calendar/sub-cal-cell.js`(OurgoalAppScope 를 읽는 세포 파일)로 옮기고 index.html 에는 키트 호출 한 줄만 남김.
  - 변경 전 스크립트: 37/38 — `[검증 21/21] [#TASK-ES-197]` FAIL, 사유 "calCellHtml 내 cal-photo-diary-bg 배선 누락".
  - 변경 후 스크립트: 38/38.
  - 음성 대조: 같은 사본에서 세포 파일의 `cal-photo-diary-bg` 를 지우면 변경 후 스크립트도 37/38, 같은 사유로 FAIL(검사가 여전히 문다).
- 막히는 지점: 금고 파일 변경이라 법정이 결심 사항으로 올릴 수 있다(정상 — 상민님 승인 문구로 해소).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
