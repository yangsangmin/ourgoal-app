# REQ — #TASK-ES-649 미분화 덩어리 해체 상태 이전 2차: 새로 옮길 수 있게 된 상태 이름 6개의 소유를 상태 기관으로

- Task ID: **TASK-ES-649** (L012: 오케스트레이터가 번호를 배정했고, `gh pr list --state all` · `git ls-remote origin` 에서 649 가 비어 있음을 다시 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-649-unstate-2` 를 먼저 push 해 선점했다.)
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「상태 이전」 둘째 사례**. 선례 #914(#TASK-ES-637 상태 이전 1차 — 판정 「통과」, R1 동작 보존 확인)의 절차·실행기·증거 꼴을 그대로 따른다(적용 → 측정 → 주장을 실행기 하나로 · 기준선 기록 · 되짚기 · push 전 로컬 법정). 이번에 더한 것은 하나다 — 옮기는 이름 가운데 세포가 통로로 **대입**하는 이름이 둘(`pendingCapturePhoto` · `USER_SESSION_CHANNEL`)이라, 대입 자리가 전부 통로를 거치는지 정적으로 가르고, 게스트로 닿는 사진 첨부 경로는 페이지 안에서 실제로 돌려 기준과 맞댔다(값 요약만으로 같다고 하지 않는다 — L092).
- 작업참고 기준 PR #918(27d0d857, 경험칙 101개) · 착수 기준 main dcf80387(#919 생성기 region 모드 병합 뒤) · **합친 main 529e4370**. 그 사이 index.html 을 바꾸는 PR 셋이 먼저 병합됐다 — #920(다시 생긴 배선 재철거) · #922(통로 노출 줄 선행 수정) · #923(`setupUserSessionRealtime` 함수 이전). 합칠 때마다 `index.html` 과 기준선은 main 판으로 두고 생성기를 그 위에서 다시 돌렸으며(L049), 마지막으로 기준 트리를 529e4370 으로 옮겨 npm test(기준 · 작업) · 시험 하나씩 · 측정을 전부 다시 했다. 이 문서의 수치는 그 결과다. 그 뒤 #924(생성 지도 갱신 — `index.html` · `js/**` · `scripts/**` · `tests/**` · `court/**` · 생성기 · 기준선 차이 0)를 합쳤고, 합친 커밋에서 npm test(작업 트리) · 무결성 게이트 · `recomputeSplit` · 로컬 법정을 다시 돌렸다(탐침·시나리오는 다시 돌리지 않았다 — 제품 파일이 같다).
- **대상이 5 → 6 이 됐다**: 오케스트레이터가 짚은 다섯(`qRoutineRow` · `pendingCapturePhoto` · `capturePhotoBtn` · `capturePhotoInput` · `capturePhotoPreview`)에 `USER_SESSION_CHANNEL` 이 더해졌다. #923 이 그 이름을 맨이름으로 쓰던 함수를 세포로 옮겨 IIFE 안 맨이름 참조가 0 이 됐고, 생성기가 옮길 수 있다고 판단했다(「현재 origin/main 에서 다시 재서 확정」).
- 지시함(origin/main) 열린 지시: **DIR-003**(B 트랙 B9 — 상태 · 철거 PR 마다 기준선에 inlineScriptLines 기록) · **DIR-004**((가) 닫힌 목록 X4·X5).
- **상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d — 글자 그대로)**
  1. 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마. 지침이나 결심이 필요한점?」
  2. 「결심필요 4번 빼고 모두 권장안대로 진행하고 4번은 자세히 설명해봐 어떤 함수인지 어떤 기능을 하던건지 자세히, 어떻게 진행하는게 좋을지, 권장안이 뭔지」 — 결심 표 묶음 1(상태 변수의 소유를 상태 기관으로 — 닫힌 목록 X4~X6)이 이 PR 이 쓰는 줄 종류다.
- 설계 정본: `docs/architecture/CELL-REGISTRY-DESIGN.md` 3.3 · 4절 · 5.5.
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 원문의 어느 문장 | 완료 기준 |
|---|---|---|---|
| R1 | index.html 인라인 IIFE 에서 새로 옮길 수 있게 된 통로 노출 상태 이름 6개의 소유를 상태 기관으로 옮긴다 — 생성기 unstate 한 번(손 편집 0). 앱 동작은 그대로다 | 원문 1 「남은 미분화작업 모두 진행」 · DIR-003(B9) | 게스트 화면 시나리오 다섯이 기준·작업 양쪽 통과 · 법정의 생성기 재실행 결과와 index.html 이 바이트 동일 |
| R2 | 옮긴 이름은 상태 기관이 같은 값 · 같은 종류의 접근자로 통로에 내준다. `pendingCapturePhoto` 는 읽기쓰기(defineVar)로 가고, 사진 첨부 경로의 대입 자리가 전부 통로를 거친다 | 설계 3.3 · 오케스트레이터 지시 | 통로 노출 상태 이름 16개의 값 요약 · 접근자 종류 · window 복사 · 쓰기 왕복이 기준과 다른 이름 0 · 사진 첨부 경로를 돌린 기록이 기준과 같음 · 맨이름으로 읽고 쓰는 줄 0 |
| R3 | 지우고 바꿔 쓰는 대상은 닫힌 목록 X4·X5 의 줄뿐 · names 밖 이름 · 그 밖의 글자 불변 · 바뀐 제품 파일은 index.html 하나 | 원문 2 · DIR-004 (가) | 되짚기 결과 == 작업 index.html · 종류 밖 삭제 줄 0 · names 밖 이름 0 |
| R4 | 증명 하한과 기준선 기록 | 설계 4절 · DIR-003 | inlineScriptLines 감소와 `module-guard --update` 기록 · 모듈 로드 새 회귀 0 · npm test 기준/작업 같음 · 무결성 게이트 38/38 · tests/ · 금고 · 생성기 · 상태 기관 변경 0 |
| R5 | 남은 상태 이름을 풀리는 조건별로 다시 재서 남긴다 | 오케스트레이터 지시 | `reports/TASK-ES-649/remaining-state.json` |

- 원문에 있는데 이 PR 항목에 없는 요구(목표 줄에 남긴다): 남은 상태 이름 24개(생성기가 멈춘 9 · 시험이 붙잡는 1 · 통로에 노출되지 않은 14) · 구역 이전(#TASK-ES-650) · sweep · finalize. 「병합도 스스로」 — 이 PR 의 병합은 판정 뒤 오케스트레이터가 한다(이 작업자는 병합하지 않는다).

### 구체 식별자

- 고친 제품 파일: `index.html` 하나(+7 −16). ① 대상 이름의 expose getter/setter 속성 7줄(`USER_SESSION_CHANNEL` 은 두 expose 문에 한 줄씩 있었다)과 속성이 모두 지워진 expose 문 1개의 머리·꼬리 2줄을 지움(9줄) · 뒤 속성이 지워져 줄 끝 쉼표를 뗀 1줄 ② 선언문 6개를 제자리에서 바꿔 씀 — `var qRoutineRow = …;` · `var capturePhotoBtn = …;` · `var capturePhotoInput = …;` · `var capturePhotoPreview = …;` → `window.OurgoalAppState.define('이름', 초기값);`(읽기 전용 4) · `var pendingCapturePhoto = null;` · `var USER_SESSION_CHANNEL = null;` → `window.OurgoalAppState.defineVar('이름', null);`(읽기쓰기 2). window 복사 줄 없음.
- 그 이름을 읽고 쓰는 세포(변경 0 — 글자 `L.이름` 그대로): `js/tabs/records/checkin-input-wiring.js`(`bindQuickRoutineChips` · `bindCapturePhoto` — 대입 116행 · 128행) · `js/tabs/records/checkin-capture.js`(`bindCaptureSave` — 대입 97행) · `js/tabs/settings/user-session-realtime.js`(`setupUserSessionRealtime` — 대입 24행 · 27행) · `js/tabs/settings/login-devices.js`(읽기 182 · 183행)
- 새 도구(제품 코드 아님): `reports/TASK-ES-649/unstate-run.cjs`(#914 의 실행기를 본뜸 + 사진 경로 측정 · 정적 분류) · `reports/TASK-ES-649/photo-probe.cjs`(사진 첨부 경로 탐침)
- 기록: `docs/architecture/module-baseline.json`(`module-guard --update` 가 63번째 항목을 더함) · `docs/rules/TICKETS.md` · `reports/TASK-ES-649/`
- 손대지 않은 것: `js/**` 전부 · 생성기 · tests/ · 금고 · 생성 지도 3종
- 화면 식별자(시나리오 — #914 의 다섯을 그대로): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnGoalsSubPersonal` · `#btnGoalsSubRoutine` · `#btnGoalsSubStats` · `#btnGoalsSubTeam` · `#btnGoalPeriodWeek` · `#btnGoalPeriodMonth` · `#homeAddGoal` · `#ngCancelBtn` · `#sanctuaryBellBtn` · `#closeNotifCenterBtn` · `#btnToggleGoalAgent` · `#goalAgentInput`. 탐침이 만지는 요소: `#capturePhotoInput` · `#capturePhotoPreview`(`.photo-preview-img` · `.photo-preview-del`) · `#captureInput` · `#captureSave` · `#captureCharCount`

## 1. [원칙 ①] 문제를 정확히 파악한다

- 상태 이전 1차(#914) 때 이 여섯 이름은 옮길 수 없었다: `pendingCapturePhoto` · `capturePhotoInput` · `capturePhotoPreview` · `USER_SESSION_CHANNEL` 은 IIFE 안 코드가 맨이름으로 썼고(생성기 정지), `qRoutineRow` · `capturePhotoBtn` 은 통로에 노출되지 않았다.
- 감싸기 이전 2차(#913)가 퀵 루틴 칩 연결과 사진 첨부 연결을 세포 `checkin-input-wiring.js` 로, 함수 이전(#923)이 `setupUserSessionRealtime` 을 세포 `user-session-realtime.js` 로 옮겼다. 그 뒤로 IIFE 안에 이 이름들의 맨이름 참조가 없고, 여섯 다 통로 getter(둘은 setter 도)로 노출돼 있다 — 생성기가 옮길 수 있다고 판단한다.
- `pendingCapturePhoto` 는 사진을 고른 뒤 기록하기 전까지 그 그림을 들고 있는 값이고, `USER_SESSION_CHANNEL` 은 로그인한 사용자의 세션 채널 객체다. 둘 다 세포가 통로로 **대입**한다. 접근자가 읽기 전용이 되면 대입이 조용히 사라진다(엄격 모드에서는 예외).

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 상태 하나에 주인 하나. 값은 기관이 보관하고 통로의 접근자도 기관이 단다.
- **원인**: 값이 IIFE 지역 변수여서 이름마다 getter/setter 줄이 index.html 에 있어야 했다.
- **중심**: 생성기 unstate 한 번, 설정 `reports/TASK-ES-649/proof.json`(`unstate.names` 6개).
- **핵심**: 읽기쓰기 이름이 읽기쓰기로 가는가. 생성기는 지우기 직전 마지막 노출 문에 `set` 이 있었는지로 정하고(L047), 이번에 그 판단이 두 이름 모두 `defineVar` 로 났다. 그것이 실제로 도는지는 대입 자리를 봐야 안다.

## 3. [원칙 ③] 해결 방식

1. 대상을 다시 잰다: 작업 트리에서 통로에 노출된 상태 이름 16개를 하나씩 생성기에 돌린다 → 옮길 수 있음 7 · 멈춤 9. 시험이 선언 글자를 붙잡는 `_promptEncyclopediaOpen` 을 뺀다 → 6개.
2. `unstate-run.cjs apply` → `module-guard --update`.
3. 시나리오 다섯(#914 의 것 그대로).
4. `unstate-run.cjs measure` — #914 의 측정 전부 + 사진 첨부 경로 탐침(기준 · 작업) + 옮긴 이름이 저장소에서 나오는 줄의 정적 분류.
5. `claims`.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **대입하는 두 이름이 defineVar 로 갔는가** → 생성기 기록 `api.pendingCapturePhoto = defineVar` · `api.USER_SESSION_CHANNEL = defineVar`. 작업 트리에서 두 이름 다 통로 접근자 get+set · 주인 `core/app-state`.
- **쓰기 왕복** → 상태 탐침: 쓰기 가능한 이름 9개(옮긴 2 + 남은 7)에 통로로 값을 쓰고 읽어 되돌리는 왕복이 기준 9/9 · 작업 9/9.
- **대입 자리가 통로를 거치는가(정적)** → 저장소 `js/**` 와 index.html 인라인에서 여섯 이름이 나오는 줄을 갈랐다: `pendingCapturePhoto` 의 대입은 세 줄(`checkin-input-wiring.js` 116 · 128, `checkin-capture.js` 97), `USER_SESSION_CHANNEL` 의 대입은 두 줄(`user-session-realtime.js` 24 · 27)이고 전부 `L.이름 = …` 꼴이다. 여섯 이름을 맨이름으로 읽거나 쓰는 줄 0 · 분류 밖 줄 0.
- **대입 자리가 실제로 도는가(동적 — 사진 경로)** → 사진 첨부 경로를 페이지 안에서 돌렸다: ① 파일 입력칸에 작은 그림을 넣고 change → 대기값에 `data:image/…` 가 들어가고 미리보기 그림의 주소가 그 값 ② 미리보기의 지우기 단추 → 대기값 null · 미리보기 비움 ③ 다시 넣고 기록 단추 → 기록 1건 추가 · 그 기록의 사진이 대기값과 같음 · 대기값 null. 확인 칸이 작업에서 전부 참이고 기준의 기록과 같다. 예외 0 · 콘솔 오류 0.
- **`USER_SESSION_CHANNEL` 의 대입 자리는 돌려 보지 못했다** → 로그인한 뒤에만 도는 함수라 게스트로 닿지 않는다. 이 이름은 정적 분류 · 접근자 종류 · 쓰기 왕복으로만 쟀다(8절 측정불가). 대입 문의 글자(`L.USER_SESSION_CHANNEL = …`)와 통로 접근자의 종류(get+set)는 기준과 같다.
- **없는 요소를 가리키는 이름** → `qRoutineRow` 의 값은 지금 null 이다(`#quickRoutineRow` 요소가 화면에 없다 — 기준에서도 null). 기관은 null 을 그대로 보관하고 세포의 `if(L.qRoutineRow)` 가 기준과 같이 건너뛴다(값 요약 동일).
- **초기값 계산 순서 · 허용 종류 밖의 줄** → 선언문은 자리를 옮기지 않았다. 되짚기 결과 == 작업 index.html, 종류 밖 삭제 줄 0, names 밖 이름 0.

## 5. [원칙 ⑤] 절차

1. origin/main 기준 worktree · 번호 선점 · `npm ci --ignore-scripts`.
2. 사진 경로 탐침 작성(이전 전 트리에서 먼저 돌려 봄) → 실행기 → `apply` → `module-guard --update` → 시나리오 → 시험 → `measure`.
3. main 이 세 번 움직였다(#920 · #922 · #923 이 index.html 을 바꿈) → 그때마다 합치고 index.html · 기준선을 main 판으로 둔 뒤 `apply` 부터 다시 → 시험 기준/작업 · 시험 하나씩 → `measure`.
4. REQ · 작업표 → npm test 작업 트리 다시(L064) → `measure` · `claims`.
5. `verify-integrity-gate` → 커밋 → `recomputeSplit` 직접 호출과 로컬 법정 전체 실행 → origin/main 확인 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「값 요약과 쓰기 왕복이 같으면 충분하다」** → 쓰기 왕복은 탐침이 통로에 직접 쓴 것이다. 실제 사용 경로(세포의 사건 처리기가 `L.pendingCapturePhoto = …` 로 쓰는 것)가 도는지는 따로다. 그래서 사진 고르기 · 지우기 · 기록의 세 대입 자리를 처리기를 통해 돌렸다.
- **반론 2 「파일 고르기 창을 열지 않았으니 진짜 조작이 아니다」** → 맞다. 화면 시나리오가 아니라 페이지 안 평가다(입력칸에 파일을 넣고 change 사건을 보냄). 사진 첨부 단추의 누름(`L.capturePhotoBtn` 처리기가 `L.capturePhotoInput.click()` 을 부르는 한 줄)은 돌리지 않았다 — 두 이름이 같은 요소를 가리킨다는 것(통로 값 === `getElementById` 결과)까지만 쟀다. 8절에 측정불가로 적는다.
- **반론 3 「`USER_SESSION_CHANNEL` 은 지시에 없던 이름이다」** → 지시는 「현재 origin/main 에서 다시 재서 확정」이다. 대상은 사람이 고르지 않고 생성기가 고른다 — 이 이름은 #923 병합 뒤 다시 재자 옮길 수 있는 쪽으로 넘어왔다. 빼려면 설정에서 이름 하나를 지우고 다시 돌리면 된다. **로그인 뒤 경로를 돌려 보지 못한 이름이라 빼는 쪽이 낫다고 보시면 돌려보낼 지점이다.**
- **재검증(되짚기)**: 기준 index.html 4,610줄에서 생성기가 적어 낸 9줄을 빼고, 쉼표 1글자를 떼고, 선언 머리 6 · 선언 끝 6 을 정해진 글자로 바꿔 쓴 결과가 작업 index.html 4,601줄과 글자 그대로 같다.
- **재검증(시험 전부)**: 스크립트 넷과 `tests/*.test.js` 114개를 하나씩 돌린 결과가 기준과 같다(실패 집합 26 = 26, 작업에서만 깨진 것 0).
- **재검증(main 이동)**: dcf80387 · faf40354 · 94ada512 · 529e4370 네 번 전부 쟀다. 앞의 세 번은 대상 5개(지운 7줄 · 바뀐 5줄)였고, #923 뒤 네 번째에 6개(지운 9줄 · 바뀐 6줄)가 됐다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-649/` 아래. 수치는 `measurement.json` 이 각 결과에서 읽어 모은 것이다(L002).

| 파일 | 무엇 |
|---|---|
| `proof.json` | 생성기 설정: `mode:"unstate"` · `unstate.names` 6개 · cells `js/core/app-state.js` |
| `unstate-meta.json` | 생성기 산출 — define 4 · defineVar 2 · 지운 줄 9 · 쉼표 1 · 바뀐 줄 6 · index.html 4610 → 4601줄 · 옮길 수 있음 7 · 멈춤 9 · 제외 1 · 노출 안 됨 14 |
| `photo-probe.base.json` · `photo-probe.work.json` | 사진 첨부 경로 기록(고르기 · 지우기 · 다시 고르고 기록) — 기준과 작업이 같고 작업의 확인 칸 전부 참 · 예외 0 |
| `state-probe.{base,base2,work}.json` · `probe-names.json` | 상태 탐침: 이름 16개 · 차이 0(본질 변동 `state` 제외) · 기관 이름 56 = 기준 50 + 설정 6 · 쓰기 왕복 9/9 · window 복사 동일 8/8 |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 등록 기관 대조: 불일치 0 · 통로에서 사라진 이름 0 · 지문 차이 0 |
| `scenario-local.json` | 시나리오 5개 기준·작업 통과(비공허 단언 13 · 10 · 9 · 6 · 3), 예외 0/0 |
| `module-load.json` · `npm-test-compare.json` · `tests-{base,work}.json` · `raw/` | 모듈 로드 새 회귀 0 · npm test 기준/작업 같음 · 시험 하나씩 실패 집합 같음 |
| `measurement.json` | 위 전부 + 제품 파일 = index.html 하나 · 되짚기 결과 == 작업 index.html · inlineScriptLines 2340 → 2331(−9 = 지운 줄 수) · 기준선 마지막 기록 = 측정값 · module-guard 종료 0 · 무결성 게이트 38/38 · 사진 경로와 정적 분류(`summary.photoPath`) |
| `remaining-state.json` | 남은 상태 이름 24개를 풀리는 조건별로 |
| `claims.json` | 주장(보존 5 + 기록 32) |
| `court-local.json` | 로컬 법정 전체 실행 요약(작업자 PC — 판정 아님) |

### 남은 상태 이름 24개 — 풀리는 조건별

| 조건 | 수 | 이름 | 무엇이 되면 풀리는가 |
|---|---|---|---|
| 맨이름 참조가 남음 | 3 | `sb` · `state` · `MOCK_GROUPS` | 그 이름을 맨이름으로 쓰는 IIFE 안 코드(함수 본문 · 로드 중 문)가 세포로 옮겨지면 — 구역 이전(#TASK-ES-650) · 함수 이전 뒤 unstate 로 다시 |
| 같은 이름의 선언이 둘 | 2 | `_subtabTplCat` · `_subtabTplQuery` | 겹친 선언을 하나로 줄이는 선행 PR(동작 주장 필요) |
| 선언문이 다른 글자와 한 줄을 나눠 씀 | 3 | `_subtabTplDomain` · `_subtabTplType` · `FEED_POSTS_CACHE` | 줄을 나누는 선행 PR, 또는 닫힌 목록을 넓히는 결심 |
| window 복사 줄이 한 줄을 나눠 씀 | 1 | `shareContent` | 줄을 나누는 선행 PR, 또는 X6 정지 조건을 넓히는 결심 |
| 시험이 상태 선언 글자를 붙잡음 | 1 | `_promptEncyclopediaOpen` | 무결성 게이트 23번 단언을 고치는 결심(금고 · 기준 시험지) |
| 통로에 노출되지 않음 | 14 | 화면 요소 참조 10 · `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `OURGOAL_CONFIG` · `requestClaudeFeedback` | 구역 감싸기로 세포 함수의 지역 변수가 되거나, 구역이 그 값을 통로로 읽게 돼 getter 가 생기면 그때 unstate 대상 |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 다른 index.html PR 이 먼저 병합된다 → 실제로 #920 · #922 · #923 이 먼저 병합됐고, 그때마다 합친 뒤 생성기를 다시 돌려 전부 다시 쟀다.
- **예상**: 법정의 생성기 재실행 대조 → push 전 `recomputeSplit` 직접 호출과 로컬 법정 전체 실행.
- **측정불가**: `USER_SESSION_CHANNEL` 을 대입하는 로그인 뒤 경로(세션 채널 구독 · 다른 기기 로그아웃 알림) · 사진 첨부 단추의 실제 누름과 파일 고르기 창(브라우저 창이라 자동 조작 밖) · 퀵 루틴 칩(요소가 화면에 없다) · 운영 환경.
- **성과 측정**: inlineScriptLines 2340 → 2331(−9, 출처 `measurement.json` `summary.inlineScriptLines`). 인라인 IIFE 의 상태 이름 30 → 24. 통로에 `index.html` 주인으로 노출된 상태 이름 16 → 10. 이 여섯 줄이 기관 define 줄이 되어, 구역 이전(#TASK-ES-650)에서 구역을 끊지 않는다.
