# REQ — 미분화 덩어리 함수 이전: `setupUserSessionRealtime`(원격 로그아웃 실시간 채널 구독)

- Task ID: **TASK-ES-653** (L012: `gh pr list --state all` · `git ls-remote origin` 에서 653 이 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-653-user-session-realtime-move` 를 먼저 push 해 선점했다. 646·649·650 은 다른 작업 몫이다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main): **DIR-003**(줄을 지우는 PR 마다 기준선에 inlineScriptLines 기록) · **DIR-004**(CELL-REGISTRY-DESIGN.md 6.2절 순서 3 「`USER_SESSION_CHANNEL` setter 선행 → 함수 이전(… 세션 실시간 1개)」 — 기존 CELL_SPLIT, 함수 본문의 글자는 고치지 않는다).
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「어려운 인라인 묶음 함수 이전」**(경험칙 L016 · L047, `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` 2-1절 「공유 상태 재대입 → 선언은 원래 자리, 옮긴 코드는 getter·setter 통로」) + 법정 「동작 보존 확인」 경로. 직전 선례 #913 · #917. 선행 PR #922(TASK-ES-652, setter 한 칸)가 병합된 뒤의 본 이전이다. 작업참고 **기준 PR #905**(eab4365b).
- 이 작업 세션은 빌더(서브에이전트)다. 병합은 하지 않는다(오케스트레이터 몫).
- 기준 main: 94ada512(#922 병합 뒤).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

- **R1** `setupUserSessionRealtime` 을 생성기로 세포 `js/tabs/settings/user-session-realtime.js` 에 글자 그대로 옮긴다. 게스트 화면의 동작을 보존한다(손 편집 0).
- **R2** 옮긴 코드가 `USER_SESSION_CHANNEL` 에 대입하는 지점이 전부 통로를 거치고, 통로에서 그 이름의 쓰기 왕복이 된다.
- **R3** 로그인 뒤 동작(세션 채널 구독 · 다른 기기의 원격 로그아웃 방송을 받아 로그아웃)이 이전 전과 같다.
- **R4** 증명 하한(헌법 CELL_SPLIT_PROOF): 토큰 동일·누수 0 · 단독 로드 회귀 0 · 통로·window 이름 값 지문이 옮긴 함수 말고 같음 · npm test 수 동일 · tests·금고·생성기 변경 0.
- **R5** 기준선(`docs/architecture/module-baseline.json`)에 줄어든 inlineScriptLines 를 기록한다(DIR-003).

범위 밖(건드리지 않음): `USER_SESSION_CHANNEL` 의 선언 줄(`var USER_SESSION_CHANNEL = null;` — 원래 자리)과 상태 기관 이전(다른 작업) · `saveGoogleToken`(헌법 조항 사안) · `openProTemplateRecordModal` · 부르는 쪽 `js/tabs/goals/team-comments.js`(`L.setupUserSessionRealtime()`) · 읽는 쪽 `js/tabs/settings/login-devices.js`.

### 구체 식별자

- 파일: `index.html`(인라인 IIFE) → 새 세포 `js/tabs/settings/user-session-realtime.js`(키트 `OurgoalSettingsKit`, 태그는 `js/tabs/settings/index.js` 태그 앞 같은 줄)
- 함수: `setupUserSessionRealtime` · 상태: `USER_SESSION_CHANNEL` · 통로로 읽는 이름: `sb` · `state` · `getDeviceId` · `performLogout`
- 생성기 `docs/design/harness/module-split/gen-inline-hard.js`(변경 0) · 검사기 `verify-inline-hard.js`(변경 0) · 설정 `reports/TASK-ES-653/proof.json`(자리 표지 `HO`, 구획 「RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만)」에서 이름으로 고름, keepRest)
- 이전 전 index.html(94ada512) 줄: 3272~3289(앞 주석 한 줄 포함 18줄) (출처 `reports/TASK-ES-653/gen-inline-hard-meta.json` `plan`)

## 1. [원칙 ①] 문제를 정확히 파악한다

IIFE 최상위에 남은 함수 선언 3개 가운데 하나다. 이 함수는 상태 변수 `USER_SESSION_CHANNEL` 을 읽고(2곳) 대입한다(2곳 — 닫을 때 `null`, 열 때 채널 객체). 로그인 뒤 `setupRealtimeChannelsOnce`(세포 `team-comments.js`)가 통로로 부른다. 게스트에서는 불리지 않는다(첫 줄에서 `state.profile.id` 가 없으면 돌아간다 — 애초에 호출부가 로그인 뒤 경로다).

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 함수 글자를 그대로 세포로 옮기고, 상태 변수는 덩어리에 둔 채 통로의 get·set 으로 읽고 쓴다.
- **원인**: 대입하는 이름의 마지막 통로 노출 줄이 getter 뿐이라 옮길 수 없었다(L047). 선행 PR #922 가 그 줄에 setter 를 더해 풀렸다.
- **중심**: 생성기 한 번 실행(설정 `reports/TASK-ES-653/proof.json`, 세포 1개 · 함수 이름 1개).
- **핵심**: 이 함수의 대입 경로는 로그인 뒤에만 돌아 게스트 시나리오로는 잡히지 않는다. 그래서 「대입이 전부 통로를 거친다」는 정적 집계와 「통로에서 실제로 써진다」는 브라우저 실측이 증명의 급소다.

## 3. [원칙 ③] 해결 방식

- 표준 이음매: 함수는 옮기고(2-2), 재대입 상태는 선언을 원래 자리에 두고 통로 getter·setter(2-1). 새 세포 파일 하나, 기존 키트 `OurgoalSettingsKit` 에 함수를 단다(새 window 전역 0). 원격 로그아웃 기기 목록 세포(`login-devices.js`)와 같은 설정 탭에 두었다.
- index.html 은 IIFE 머리에서 `var setupUserSessionRealtime = _settingsKit.setupUserSessionRealtime;` 로 같은 이름을 가져오고, 기존 통로 getter(`get setupUserSessionRealtime(){…}`)는 그대로다 — 부르는 세포의 `L.setupUserSessionRealtime()` 가 같은 이름으로 닿는다.
- 등록 블록을 손으로 넣지 않았고 `gen-cell-provide.js` 를 돌리지 않았다(L068).

## 4. [원칙 ④] 재검토 (반례·부작용)

- **대입이 전부 통로를 거치는가(정적, `assign-count.json`)** → 기준 함수 안의 맨이름 대입 2곳·읽기 2곳이 세포에서 `L.USER_SESSION_CHANNEL =` 2곳·`L.USER_SESSION_CHANNEL` 읽기 2곳이 됐다. 세포 안 맨이름 대입 0 · 맨이름 읽기 0. 이전 뒤 index.html 에 그 이름이 남은 줄은 선언 줄 하나와 통로 노출 줄 둘뿐이다.
- **통로에서 실제로 써지는가(브라우저, `accessor-probe.json`)** → 부팅 뒤 통로의 `USER_SESSION_CHANNEL` 에 표식을 써 보고 되읽은 값이 같았고 원래 값으로 되돌렸다. 그 이름의 노출 줄 둘(생성기가 머리에 단 줄 · 선행 PR 이 고친 줄) 모두 get+set 이다. 검사기 「setter 빠짐 0 · 마지막 노출 setter」 ok.
- **상태 기관과의 겹침** → 기관 이름 50개 가운데 세포가 읽는 이름 0 · 대입하는 이름 0 · 새 getter 와 겹치는 이름 0.
- **생성기가 새로 단 통로 getter 3개** → `USER_SESSION_CHANNEL`(이미 있던 이름 — 생성기가 머리의 판단 범위 밖에 있는 기존 줄을 못 봐 한 줄 더 단다) · `getDeviceId` · `performLogout`(둘 다 등록 기관이 내주던 이름). 통로에 처음 생기는 이름 0.
- **이름 지문** → 통로 431개 중 달라진 것은 `setupUserSessionRealtime` 하나(종류·이름·인자 수 같고 함수 글자 해시만 — 본문에 `L.` 접두) · 그 밖 0 · 사라진 이름 0 · 새 이름 0. window 17개 차이 0.
- **바뀐 글자** → 옮긴 18줄을 기준과 줄 단위로 맞대면 바이트 동일 10줄 · `L.` 접두만 다른 줄 8줄 · 그 밖 0줄, 접두 13개 = 생성기 바꿔 쓰기 13개(`prefix-only-check.json`).
- **단독 로드(L018)** → 세포 파일은 함수 정의만 한다. 새 파일 단독 로드 ok, 기준 대비 회귀 [].
- **`async` 콜백 안의 `await performLogout(…)`** → `await L.performLogout(…)` 가 됐다. 같은 함수 값을 부른다(지문 대조에 포함).

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · `npm ci --ignore-scripts` · 기준 작업 폴더(분리 HEAD).
2. 생성기 실행 → 검사기 ok → `module-specs --write` · `cell-desc-add.js` · `module-guard --update`(낮아진 값만).
3. 정적 집계(`assign-count.cjs`) · 통로 쓰기 왕복(`accessor-probe.cjs`) · 줄 단위 비교(`prefix-only-check.cjs`).
4. 측정: 모듈 로드 · 이름 지문 · 시나리오(기준 2회·작업 1회) · npm test(기준·작업 전경) · tests 전부 종료 코드.
5. 서류 → `verify-integrity-gate.js` → `npm test` → 커밋 → 로컬 `recomputeSplit` · 로컬 법정 전체 실행 → origin/main 합치기 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「게스트 시나리오가 이 함수를 한 번도 부르지 않는데 동작 보존을 말할 수 있나」** → 화면으로 말하는 것은 게스트 동작(시동과 여섯 탭)이 그대로라는 것뿐이다. 함수 본문의 동일성은 생성기 재실행 바이트 대조(proof)·토큰 동일·줄 단위 비교로, 대입 경로는 정적 집계와 통로 쓰기 실측으로 말한다. 로그인 뒤 실제 구독·원격 로그아웃 수신은 법정이 로그인할 수 없어 잴 수 없다 — 그 지시 항목(R3)에는 「확인 못 함」 주장 하나만 걸었다(L045). 사유는 처음에 화면 분야의 needs-login 으로 적었는데, 로컬 법정이 문장의 「실시간·상대방 화면」 때문에 필요한 확인 수준을 「진짜 계정끼리 주고받아 봄」으로 올려 보고 그 사유 칸을 쓰지 않았다(needs-login 은 PC 화면으로 잴 수 있는 종류에만 붙는 사유다). 그래서 분야를 여러 사용자(multi-user), 사유를 실서버 필요(needs-live-server)로 사실대로 바꿨다 — 문장을 고쳐 수준 올림을 피하지 않았다. 게스트로 잴 수 있는 것을 한계로 돌리지 않았다.
- **반론 2 「통로 쓰기 실측은 표식 객체를 쓴 것이지 진짜 채널을 쓴 것이 아니다」** → 맞다. 실측이 보이는 것은 「통로의 그 속성에 값이 써지고 덩어리의 변수에 닿는다」(되읽은 값이 같음)까지다. 채널 객체를 만드는 `sb.channel(…)` 은 서버 연결이 필요하다. 그 차이를 한계로 적는다.
- **재검증**: 위 사유 변경은 push 전의 일이다(같은 PR 에서 판정받은 주장을 바꾼 것이 아니다).
- **재검증**: 선행 PR 뒤에도 생성기가 그 이름의 get+set 줄을 머리에 하나 더 단다는 것은 선행 PR 의 모의(`reports/TASK-ES-652/mock-move.json`)에서 미리 봤고 이번 실제 실행에서도 같았다. 두 줄 모두 setter 가 있어 뒤의 줄이 덮어도 쓰기는 유지된다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-653/` 아래, 작업자 측정이다.

| 산출물 | 무엇을 쟀나 | 결과 |
|---|---|---|
| `verify-inline-hard.json` | 토큰 동일(접두 제외) · 줄 동일 · 남은 글자 동일 · 누수 0 · 미노출 0 · setter 빠짐 0 · 마지막 노출 setter · this/arguments 0 · 800줄 이하 | `ok: true` |
| `assign-count.json` | 세포 안 대입·읽기가 통로를 거치는 수 · 덩어리에 남은 그 이름의 줄 | 대입 2/2 통로 · 맨이름 0 · 선언 줄과 노출 줄만 남음 |
| `accessor-probe.json` | 통로 쓰기 왕복 · 상태 기관 겹침 · 읽는 이름 5개 존재 | `ok: true` |
| `prefix-only-check.json` | 옮긴 18줄의 줄 단위 바이트 비교 | 그 밖의 차이 0줄 |
| `measurement.json` | 인라인 줄 수 · 새 파일 줄 수 · 바뀐 파일 분류 | inlineScriptLines 2350 → 2340(−10) · index.html 함수 선언 수 19 → 18 · 새 파일 43줄 · tests/금고/생성기/생성 지도 변경 0 |
| `module-load.json` | 법정 모듈 로드 탐침 기준 대 작업 | 회귀 [] · 새 파일 단독 로드 ok |
| `cell-registry-compare.base.json` · `cell-registry-compare.json` · `name-fingerprints.json` · `expose-window.json` | 이름 지문 · 새 getter 시점 | 4절 |
| `scenarios/s1-guest-boot-six-tabs.json` · `scenario-local.json` | 게스트 여섯 탭, 기준 2회·작업 1회 | 통과 · 예외 0 |
| `raw/npm-test.{base,work}.{log,exit}` · `npm-test-compare.json` · `tests-all-compare.json` | npm test · 시험 파일 개별 실행 | 종료 코드 0 · 0, ✓ 줄 같음 · 다른 파일 0 |
| `court-local.json` | 로컬 `recomputeSplit` · 로컬 법정 전체 실행 | 커밋 뒤 기록 |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 상태 이전 2차(649) · 구역 이전(650)이 먼저 병합되면 main 판 index.html 로 같은 설정을 다시 돌린다(L010). 그때 `USER_SESSION_CHANNEL` 의 노출 줄이 여전히 get+set 인지(또는 기관으로 갔는지) 다시 잰다.
- **측정불가**: 로그인 뒤 세션 채널 구독 · 다른 기기의 원격 로그아웃 방송 수신과 그에 따른 로그아웃(법정은 외부 통신을 막아 로그인할 수 없다 — 실계정 두 기기가 필요하다).
- **성과 측정**: inlineScriptLines 2350 → 2340(−10, 출처 `measurement.json` `summary.inlineScriptLines`). IIFE 최상위 함수 선언 3 → 2(남는 것은 `saveGoogleToken` · `openProTemplateRecordModal` — 둘 다 결심 대기·다른 작업).
- **다음에 열리는 것**: `USER_SESSION_CHANNEL` 의 맨이름 참조가 선언 줄과 노출 줄만 남아 상태 기관 이전 대상이 된다(다른 작업).
- **PLAN 체크리스트**: [4단계: 심사 청구]까지만 기록한다(`.claude/plan-TASK-ES-653.md`).
