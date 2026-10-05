# REQ — #TASK-ES-431 잠금화면용 일정 카드 저장 오류(정의되지 않은 streakDays) 수정

- 근거: 코디네이터 지시(2026-10-05) — #744(TASK-ES-423) 빌더 발견: 일정 탭 「잠금화면용 일정 카드 저장」이 정의되지 않은 `streakDays` 를 읽어 늘 오류 토스트로 끝난다(이전부터). 코드는 지금 `js/tabs/calendar/lockscreen-image.js`.
- 범위: `js/tabs/calendar/lockscreen-image.js` 의 `generateLockScreenScheduleCardImage` 스트릭 줄 앞 1줄, 부품 시험 `tests/lockscreen-card-streak-es431.test.js`, `scripts/test-shipyard-modular.js`(runNode 1줄), `reports/TASK-ES-431/**`.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. `streakDays` 가 원래 무엇을 뜻했는지(스트릭 일수) 앱의 스트릭 계산 함수·상태를 찾아 확인하고 올바른 값으로 연결한다.
2. 다른 동작 변경 0, 카드 그림 내용 외 변경 0.
3. 증명: 게스트 화면 시나리오(법정이 기준·작업 양쪽 실행 — 기준은 오류 토스트, 작업은 저장 성공 토스트)를 처음부터 화면 동작 주장으로. 로컬에서 법정 실행기로 기준 실패·작업 통과를 확인한 뒤 push.
4. 부품 시험(npm test 경로, `process.exitCode`), npm test 기준과 같음.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- 본질: 카드 그리기 함수가 자기 스코프 어디에도 없는 이름을 읽어서, 그리기 도중 ReferenceError 가 나고 저장 단추의 `catch` 가 오류 토스트를 띄운다. 카드는 한 번도 저장된 적이 없다.
- 원인(측정): `generateLockScreenScheduleCardImage`(#TASK-ES-232 에서 생김)의 `ctx.fillText(avatarChar + ' 연속 ' + streakDays + '일째 실천 중 🔥', 540, 285)` 가 지역 선언 없이 `streakDays` 를 읽는다. 같은 이름의 지역 변수는 index.html 의 다른 함수들(주간 회고 카드 등: `var streakDays = typeof computeStreakDays === 'function' ? computeStreakDays() : 0;`)에만 있다 — 그 줄을 이 함수에 빠뜨린 것이다. 기준 커밋에서 게스트 시나리오 단계 11(저장 토스트) 실패, 부품 시험 기준 `streakDays is not defined`(`reports/TASK-ES-431/test-compare.json`). #TASK-ES-423 의 이전 시나리오도 같은 오류 토스트를 기대값으로 기록했다.
- 중심: 스트릭 일수의 정본은 index.html 의 `computeStreakDays()`(기록·스트릭 프리즈 날짜로 오늘/어제부터 역산)다. 이 함수는 이미 app-scope 통로에 `get computeStreakDays(){ return computeStreakDays; }` 로 노출되어 있어, 옮긴 세포는 `L.computeStreakDays()` 로 읽으면 된다(새 노출·새 전역 0).
- 핵심: 지역 변수 한 줄 `var streakDays = (typeof L.computeStreakDays === 'function') ? L.computeStreakDays() : 0;` — 앱의 다른 곳(index.html 주간 회고·설정 탭 `js/tabs/settings/render.js`)과 같은 방어 형태. 카드 글자 「연속 N일째 실천 중」의 N 만 바뀐다.

## 3. [원칙 ③] 해결방식

- `js/tabs/calendar/lockscreen-image.js` `generateLockScreenScheduleCardImage` 의 스트릭 `fillText` 바로 앞에 위 한 줄을 넣는다. 다른 줄·저장 단추 손잡이(index.html `#btnDownloadLockscreenCard`)·토스트 문구는 그대로.
- 대안 비교: (a) index.html 에서 인자로 넘기기 — 부르는 쪽 시그니처를 바꿔 다른 동작 변경이 생김, 기각. (b) `L.state.profile` 로 직접 계산 — 스트릭 계산이 둘로 갈라짐, 기각. (c) 통로의 `computeStreakDays` 읽기 — 채택.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 법정 브라우저에서 다운로드 파일 자체(PNG 바이트)가 저장됐는지는 재지 않는다 — 시나리오는 저장 토스트와 예외 0 까지 본다. 그림의 스트릭 글자는 부품 시험(캔버스 글자 기록)으로 잰다.
- 로그인 사용자 화면·실기기 저장(갤러리)은 재지 않았다 — `unverified` 주장으로 낸다.
- 카드의 보기 좋음(글자 배치)은 사람 눈 확인 대상 — 바뀐 것은 숫자 글자 하나라 배치 변화 없음.

## 5. [원칙 ⑤] 절차

1. 원인 확인(`computeStreakDays` 정의·통로 노출) → 2. 게스트 시나리오 작성 → 3. 법정 실행기(`court/lib/scenario.js`)로 기준 실패(단계 11) 확인 → 4. 한 줄 수정 → 5. 시나리오 작업 통과 확인 → 6. 부품 시험 기준(종료 1)·작업(종료 0) → 7. npm test 기준·작업 비교 → 8. REQ·claims·dev_log·TICKETS·PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "0 으로 고정해도 오류는 사라진다." → 격파: 지시는 원래 뜻(스트릭 일수)에 연결하라는 것이고, 0 고정은 「연속 0일째」라는 거짓 숫자를 그리는 허상지표다. 부품 시험 A2 가 computeStreakDays 값(7)이 그려지는지 잰다. 0 은 통로에 함수가 없을 때의 방어 값일 뿐이다(B1).
- 반론 2: "computeStreakDays 는 index.html 안에 있으니 세포에서 부르면 결합이 늘어난다." → 격파: 이미 app-scope 통로에 노출되어 있고 다른 세포(`js/tabs/goals/goal-export.js`·`js/tabs/settings/render.js`)도 같은 통로로 부른다. 새 노출·새 전역·index.html 변경이 0 이다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#calLockScreenBtn`(일정 탭 잠금화면 단추), `#btnDownloadLockscreenCard`(잠금화면용 일정 카드 저장), `#toast`, `#modalOverlay`, `#btnLandingPreviewDirect`.
- 함수: `generateLockScreenScheduleCardImage`(js/tabs/calendar/lockscreen-image.js), `computeStreakDays`(index.html, app-scope `L.computeStreakDays`).
- 파일: `js/tabs/calendar/lockscreen-image.js`, `tests/lockscreen-card-streak-es431.test.js`, `scripts/test-shipyard-modular.js`, `reports/TASK-ES-431/**`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

수치는 `reports/TASK-ES-431/scenario-local.json`·`test-compare.json` 을 인용한다.

| 측정 | 방법 | 결과 |
| :-- | :-- | :-- |
| 게스트 시나리오 — 일정 카드 저장 | court/lib/scenario.js 로컬 예비 실행(기준 사본·작업) | 기준: 단계 11(저장 토스트) 실패 · 작업: 12단계 통과, 예외 0 |
| 부품 시험 | `node tests/lockscreen-card-streak-es431.test.js`(기준 사본에 같은 파일 복사) | 기준 종료 1(3개 모두 실패, streakDays is not defined) · 작업 종료 0(3개 성립) |
| npm test | 기준·작업 | smoke 443/0 · 무결성 38/38 같음, 둘 다 종료 0 |
