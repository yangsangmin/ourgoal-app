# REQ — `setupUserSessionRealtime` 이전의 선행: 통로 노출 줄에 `USER_SESSION_CHANNEL` setter 한 칸 더하기

- Task ID: **TASK-ES-652** (L012: `gh pr list --state all` · `git ls-remote origin` 에서 652 가 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-652-user-session-realtime` 를 먼저 push 해 선점했다. 646·649·650·651 은 다른 작업 몫이다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main): **DIR-004**(CELL-REGISTRY-DESIGN.md 6.2절 순서 3 「`USER_SESSION_CHANNEL` setter 선행 → 함수 이전(… 세션 실시간 1개)」 · 9절 「setter(L047) — 그 줄에 setter 를 붙이는 선행 PR(순증가 0, 동작 주장) 뒤에 `setupUserSessionRealtime` 이전」). DIR-003 의 기준선 기록은 줄을 지우는 PR 의 일이다 — 이 PR 은 줄 수를 바꾸지 않는다.
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 경험칙 L047 의 대응(「마지막 노출 줄에 setter 가 있는지 확인하라 … 안 되면 그 대입 함수는 원래 자리에 둔다」)을 설계 9절이 정한 선행 PR 로 푸는 것**. 옮기기가 아니라 **한 줄 고치기(손 편집)** 다 — 생성기를 쓰지 않으므로 법정의 생성기 재실행 대조(proof)는 걸지 않는다. 주장 꼴은 손으로 쓴 새 기관 PR 선례 #909(TASK-ES-636)를 따른다. 작업참고 **기준 PR #905**(eab4365b).
- 이 작업 세션은 빌더(서브에이전트)다. 병합은 하지 않는다(오케스트레이터 몫).
- 기준 main: c6798552(#920 병합 뒤).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

- **R1** index.html 의 `USER_SESSION_CHANNEL` 통로 노출 줄(`OurgoalAppScope.expose('index.html', {…})` 속성 줄)에 setter 한 칸을 더한다. 바뀌는 것은 그 한 줄뿐이고 줄 수는 그대로다. 지금 그 이름을 통로로 쓰는 코드가 없으므로 앱 동작은 그대로다.
- **R2** 더한 뒤 통로에서 `USER_SESSION_CHANNEL` 쓰기 왕복이 된다(써 보고 되읽은 값이 같고 원래 값으로 돌아간다). 더하기 전에는 「only a getter」 오류였다.
- **R3** 증명 하한: 통로·window 이름 값 지문 차이 0 · 모듈 로드 새 회귀 0 · npm test 검사 수 동일 · 인라인 줄 수 불변 · tests·금고·생성기·생성 지도 변경 0.

범위 밖(이번에 하지 않음): `setupUserSessionRealtime` 의 실제 이전(다음 PR — 이 PR 병합 뒤) · `USER_SESSION_CHANNEL` 의 상태 기관 이전(다른 작업) · `saveGoogleToken`(헌법 조항 사안).

### 구체 식별자

- 파일: `index.html` 2631행(기준 c6798552) — `get USER_SESSION_CHANNEL(){ return USER_SESSION_CHANNEL; },` → `get USER_SESSION_CHANNEL(){ return USER_SESSION_CHANNEL; }, set USER_SESSION_CHANNEL(v){ USER_SESSION_CHANNEL = v; },` (생성기가 setter 를 달 때 쓰는 꼴과 같은 글자)
- 이름: 상태 변수 `USER_SESSION_CHANNEL`(`var USER_SESSION_CHANNEL = null;`) · 대입하는 함수 `setupUserSessionRealtime`(덩어리에 그대로) · 읽는 세포 `js/tabs/settings/login-devices.js`(`L.USER_SESSION_CHANNEL`) · 부르는 세포 `js/tabs/goals/team-comments.js`(`L.setupUserSessionRealtime()`)
- 다음 PR 의 새 세포(예정): `js/tabs/settings/user-session-realtime.js`
- 측정 도구: `reports/TASK-ES-652/tools/scope-write-probe.cjs`(통로 쓰기 왕복) · `measure-652.cjs`

## 1. [원칙 ①] 문제를 정확히 파악한다

`setupUserSessionRealtime`(원격 로그아웃 실시간 채널 구독, 17줄)은 `USER_SESSION_CHANNEL` 에 두 번 대입한다. 이 함수를 세포로 옮기면 대입은 `L.USER_SESSION_CHANNEL = …` 가 된다. 현재 main 에서 그대로 옮겨 보았다(작업 트리 모의, 뒤에 원복): 생성기는 머리 자리 표지 아래에 `get`+`set` 줄을 달지만, 그보다 **뒤**(P0 이음매, 2631행)에 있는 기존 노출 줄이 getter 뿐이라 통로 속성을 getter 전용으로 다시 정의한다 — 검사기가 「마지막 노출 setter」에서 FAIL(`lastGetterNoSetter: ["USER_SESSION_CHANNEL"]`)을 냈다. 그 상태로 병합하면 로그인 뒤 채널을 여는 순간 「Cannot set property USER_SESSION_CHANNEL … which has only a getter」가 난다. 이 경로는 로그인 뒤에만 돌아 게스트 시나리오로는 잡히지 않는다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 옮기기 전에, 통로에서 그 이름을 쓸 수 있게 해 둔다.
- **원인**: `OurgoalAppScope.expose` 는 같은 이름을 나중에 노출하면 속성을 다시 정의한다(`js/core/app-scope.js`). 생성기는 머리의 `try{` 줄 앞까지만 보고 getter·setter 유무를 판단하는데, 이 이름의 노출 줄은 그 뒤에 있다.
- **중심**: index.html 한 줄(2631행)에 setter 한 칸.
- **핵심**: 「쓰는 코드가 아직 없으니 동작 0 변경」과 「이제 쓸 수 있다」를 둘 다 측정으로 보이는 것 — 앞의 것은 이름 지문·시나리오·시험으로, 뒤의 것은 브라우저에서 통로 쓰기 왕복으로.

## 3. [원칙 ③] 해결 방식

- 후보 (가)(채택): 마지막 노출 줄에 setter 를 더하는 선행 PR 한 줄 → 병합 뒤 옮기기 PR.
- 후보 (나)(기각): 선행 없이 바로 옮기기 — 1절의 모의에서 검사기 FAIL. 자리 표지를 바꿔도 자리 표지는 모두 그 노출 줄보다 앞이라 풀리지 않는다.
- 후보 (다)(기각): 그 노출 줄의 getter 를 지워 마지막 노출을 생성기 줄로 만들기 — 지우는 것은 철거 생성기의 일이고, 등록되지 않은 이름이라 지금 지우면 `login-devices.js` 가 읽을 값이 없어진다.
- setter 글자는 생성기가 쓰는 꼴(`, set X(v){ X = v; }`) 그대로 썼다. 뒤의 상태 이전 생성기(unstate)는 getter/setter 본문이 `return X;`·`X = v;` 꼴일 때만 지우므로 그 꼴을 지켰다.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **바뀐 글자** → 기준과 작업의 index.html 을 줄 단위로 맞대면 다른 줄은 1줄, 줄 수 같음, 그 줄의 getter 뒤에 ` set USER_SESSION_CHANNEL(v){ USER_SESSION_CHANNEL = v; },` 한 칸이 붙었다(기준 줄은 getter 전용, 작업 줄은 같은 getter + setter)(`measurement.json` `summary.changedLine`). 인라인 줄 수·함수 선언·전역 대입·탭 간 참조 지표 그대로.
- **지금 그 setter 를 부르는 코드가 있는가** → `L.USER_SESSION_CHANNEL` 에 대입하는 js 코드 0곳(`login-devices.js` 는 읽기만 한다). 그래서 이 PR 만으로는 실행 경로가 바뀌지 않는다.
- **통로 쓰기 왕복** → 기준: `Cannot set property USER_SESSION_CHANNEL of #<Object> which has only a getter`(엄격 모드 쓰기). 작업: 써 보고 되읽은 값 같음 · 원래 값(null)으로 되돌림 · 속성은 get+set 접근자(`scope-write.base.json` · `scope-write.work.json`).
- **이름 지문** → 통로 431 · window 17 이름 모두 지문 차이 0 · 사라진 이름 0 · 새 이름 0 · 대조 불일치 0.
- **다음 PR 이 정말 풀리는가(모의, `mock-move.json`)** → 이 PR 의 판에서 같은 설정으로 생성기를 돌리면 검사기 ok, `lastGetterNoSetter` [] · 세포 안 대입 2곳이 모두 `L.USER_SESSION_CHANNEL =` 꼴(맨이름 대입 0) · 통로 쓰기 왕복 ok. 모의 뒤 index.html 은 이 PR 의 판으로 되돌리고 세포 파일은 지웠다(실제 이전 0). 생성기는 이때 머리에 그 이름의 get+set 줄을 하나 더 단다(머리 판단 범위 밖의 줄을 못 보기 때문) — 두 줄 모두 setter 가 있어 문제는 없고, 겹친 줄은 뒤의 상태 이전이 함께 지운다.
- **이전 뒤 그 이름의 맨이름 참조** → 모의에서 덩어리에 남는 것은 선언 줄과 노출 줄뿐이었다(상태 기관으로 갈 조건).

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · `npm ci --ignore-scripts` · 기준 작업 폴더(분리 HEAD).
2. 선행 없는 이전을 모의로 돌려 검사기 FAIL 확인 → 원복.
3. index.html 한 줄 편집 → 통로 쓰기 왕복(기준·작업) → 선행 뒤 이전 모의(검사기·왕복) → 원복.
4. 측정: 대조 탐침·이름 지문 · 시나리오 2개(기준 2회·작업 1회) · 모듈 로드 · npm test(기준·작업 전경) · tests 전부 종료 코드.
5. 서류 → `verify-integrity-gate.js` → `npm test` → 커밋 → 로컬 법정 전체 실행 → origin/main 합치기 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「쓰는 곳이 없는 setter 를 더하는 것은 죽은 코드를 만드는 일이다」** → 쓰는 곳은 다음 PR 에서 생긴다(옮긴 함수의 대입 2곳). 순서를 바꿀 수 없는 이유는 법정이 옮기기 PR 을 「기준 커밋의 생성기 산출과 바이트 동일」로 심사하기 때문이다 — setter 를 옮기기 PR 에 손으로 끼우면 그 대조가 깨진다. 그래서 설계 9절이 선행 PR 로 정해 두었다.
- **반론 2 「게스트 시나리오가 통과해도 setter 가 동작하는지는 알 수 없다」** → 맞다. 시나리오는 「동작이 그대로」만 말한다. setter 가 동작한다는 것은 시나리오가 아니라 브라우저에서 통로에 직접 써 보는 실측으로 말하고, 그 결과 파일을 기록 주장(config)으로 건다. 법정이 그 쓰기를 다시 돌리는 것은 아니다 — 작업자 측정이다.
- **재검증**: 로그인 뒤 실제 채널 구독·원격 로그아웃은 이 PR 에서 경로가 바뀌지 않아(그 함수는 덩어리에 그대로이고 맨이름으로 대입한다) 따로 주장하지 않는다. 다음 PR 에서 로그인 뒤 동작 지시 항목에 needs-login 주장 하나를 건다(L045).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-652/` 아래, 작업자 측정이다.

| 산출물 | 내용 |
|---|---|
| `measurement.json` | 바뀐 줄(1줄·줄 수 같음·더한 글자) · 지표 불변 · 쓰기 왕복 요약 · 이름 지문 · 모듈 로드 · 시나리오 · npm test · 바뀐 파일 분류 |
| `scope-write.base.json` · `scope-write.work.json` | 통로 쓰기 왕복(기준은 getter 전용 오류, 작업은 왕복 ok) |
| `mock-move.json` | 선행 전·후에 이전을 모의로 돌린 검사기 결과와 쓰기 왕복 |
| `cell-registry-compare.base.json` · `cell-registry-compare.json` | 대조 탐침(이름 목록은 기준으로 고정, 지문 포함) |
| `scenarios/c1-guest-boot-six-tabs.json` · `c2-settings-legal-links.json` · `scenario-local.json` | 게스트 시나리오 2개 기준 2회·작업 1회 |
| `module-load.json` · `npm-test-compare.json` · `tests-all-compare.json` · `raw/` | 모듈 로드 · npm test · 시험 파일 개별 실행 |
| `court-local.json` | 로컬 법정 전체 실행(커밋 뒤) |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 다른 index.html PR(상태 이전 2차 · 구역 이전 · 944줄 함수 정리)이 먼저 병합되면 그 줄이 옮겨지거나 지워질 수 있다 → main 을 합쳐 그 이름의 마지막 노출 줄을 다시 찾아 같은 한 칸을 더하고 측정을 다시 한다. 상태 이전이 `USER_SESSION_CHANNEL` 을 먼저 기관으로 옮겼다면(맨이름 참조가 남아 지금은 불가) 이 PR 은 필요 없어진다.
- **측정불가**: 로그인 뒤 실시간 채널 구독·원격 로그아웃 수신(법정은 외부 통신을 막아 로그인할 수 없다 — 이 PR 은 그 경로를 바꾸지 않는다).
- **성과 측정**: 줄 수 변화 0(inlineScriptLines 그대로 — `measurement.json` `summary.ratchet`). 성과는 줄 수가 아니라 「다음 이전이 풀린다」다: 선행 전 모의는 검사기 FAIL, 선행 뒤 모의는 ok(`mock-move.json`).
- **다음에 열리는 것**: 이 PR 병합 뒤 `setupUserSessionRealtime` → `js/tabs/settings/user-session-realtime.js` 이전 PR(생성기, proof). 그 뒤 `USER_SESSION_CHANNEL` 은 상태 기관 이전 대상이 된다.
- **PLAN 체크리스트**: [4단계: 심사 청구]까지만 기록한다(`.claude/plan-TASK-ES-652.md`).
