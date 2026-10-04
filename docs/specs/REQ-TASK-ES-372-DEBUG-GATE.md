# 요구사항 정의서 (REQ) — #TASK-ES-372 운영 주소 `?debug=true` 로 테스터 B 무인증 입장

> **문서 ID**: REQ-TASK-ES-372-DEBUG-GATE
> **작성 일시**: 2026-10-05
> **작성자**: Claude Code 세션 (debug-gate 빌더)
> **기준 커밋**: origin/main 07d4eee (#686 병합 뒤)

## 지시 원문 (작업 지시서에서 옮김)

- 결함(PR #686 빌더 발견): 운영 주소에 `?debug=true` 를 붙이면 `initDevDebugButtons`(index.html, `isExplicitDebug`)가 테스터 B 직통 버튼을 보여 주고, 누르면 인증 없이 테스터 B uid 로 입장한다.
- 목표: 개발용 직통 입장은 로컬 개발 호스트(localhost, 127.0.0.1, [::1], *.localhost, *.test)에서만 동작하게 한다. 운영·미리보기 호스트에서는 쿼리 파라미터와 상관없이 버튼이 생기지 않고, 함수를 직접 불러도 입장하지 않는다. 운영 사용자에게 보이던 기능은 없으므로 기능 삭제가 아니다. 다른 개발 도구 버튼이 같은 조건을 쓰면 함께 막고 목록 보고.

## 1. [원칙 ①] 문제 파악

- 코드 확인(origin/main 07d4eee): `index.html initDevDebugButtons()` 의 `var isDev = forceDebug || (isLocal && isExplicitDebug) || isExplicitDebug;` — 마지막 `|| isExplicitDebug` 때문에 호스트와 상관없이 `?debug=true` 만으로 `#landTesterBWrap`·`#authTesterBWrap` 이 `display:block` 이 된다. 강제 인자 `window.initDevDebugButtons(true)` 도 호스트를 보지 않는다.
- `enterAsTesterB()`(전역 `window.enterAsTesterB`)는 호스트·세션 확인 없이 `loginWithDirectIdentifier('테스터_B', { userId: '00000000-0000-4000-a000-000000000002' })` 를 부르고, #TASK-ES-368 의 `resolveDirectLoginTarget` 는 `explicitUid` 가 있으면 세션 없이 허용(`reason: 'explicit-tester'`)한다.
- 실측(작업자, 2026-10-05, 이 PC Chrome 헤드리스 + 법정 정적 서버, 운영 흉내 호스트 `ourgoal-prod-sim.example` → 127.0.0.1 매핑, `/index.html?debug=true`): 기준 커밋에서 테스터 버튼 보임 2개, `initDevDebugButtons(true)` 2개, `enterAsTesterB()` 직접 호출 뒤 `state.profile.id` = 테스터 B uid. 결함 실재.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 쿼리 파라미터는 누구나 붙일 수 있다. 개발용 지름길을 여는 열쇠가 될 수 없다.
- **원인**: #TASK-ES-223 이 "로컬 + debug" 조건을 만들면서 `|| isExplicitDebug` 를 남겨 로컬 조건이 무력화됐다. 그리고 버튼만 숨겼을 뿐 입장 함수(`enterAsTesterB`)와 uid 결정 규칙(`explicit-tester` 갈래)에는 호스트 조건이 없었다.
- **중심**: 호스트 판정 한 곳 — `js/direct-login-guard.js isLocalDevHost(hostname)`.
- **핵심**: 버튼 표시·입장 함수·uid 결정 규칙 세 겹 모두 같은 호스트 판정을 거친다.

## 3. [원칙 ③] 해결 방식

| 겹 | 수정 전 | 수정 후 |
| :-- | :-- | :-- |
| 버튼 표시 `initDevDebugButtons` | `?debug=true` 또는 강제 인자면 어디서나 보임 | `isLocal && (forceDebug \|\| isExplicitDebug)` — 로컬 개발 호스트가 아니면 두 래퍼를 `remove()` |
| 입장 함수 `enterAsTesterB` | 무조건 테스터 B uid 로 입장 | 로컬 개발 호스트가 아니면 토스트 후 `false`, 입장 0회 |
| uid 규칙 `resolveDirectLoginTarget` | `explicitUid` 만 있으면 허용 | `explicitUid` + `devHost === true` 일 때만 허용. `loginWithDirectIdentifier` 가 `devHost: isLocalDevHost(location.hostname)` 를 넘긴다 |

- 허용 호스트: `localhost`, `127.0.0.1`, `[::1]`(브라우저 표기)·`::1`, `*.localhost`. 대소문자·끝 점 무시. `localhost.example.com`·`evillocalhost`·`127.0.0.1.nip.io` 는 거짓.
- `*.test` 는 넣지 않았다 [기본값] — 근거는 4절.

## 4. [원칙 ④] 재검토

- **`*.test` 제외**: 법정은 실행마다 `court-xxxxxxxx.test` 호스트로 앱을 연다(court/lib/site-host.js). `*.test` 를 허용하면 법정 화면이 개발 호스트로 판정돼 운영과 다른 경로를 보게 된다. 또 제품 코드에 `'.test'` 같은 글자를 넣으면 법정의 "검증 환경을 알아채는 코드" HARD 규칙(court/judge.js ENV_HARD)에 걸려 돌려보냄이다. 이 저장소에서 `*.test` 개발 호스트를 쓰는 설정은 찾지 못했다(검색: vercel.json·package.json·scripts). 그래서 지시 목록 중 `*.test` 만 빼고 진행한다.
- **같은 조건을 쓰는 다른 개발 도구 버튼**: `?debug=true` 를 읽는 곳은 `initDevDebugButtons` 한 곳뿐이고, 그 함수가 다루는 버튼은 `#landTesterBWrap`(안의 `#landTesterBBtn`)·`#authTesterBWrap`(안의 `#authTesterBBtn`) 두 개뿐이다. 호스트를 읽는 다른 두 곳은 버튼도 무인증 입장도 아니라서 손대지 않았다: `triggerFirstCheerResponse` 의 `isLocalDev`(로컬에서는 가상 응원을 건너뜀), 부트의 `isPreviewEnv`(포트 8888·localhost·`?preview` 면 게스트 샘플 프로필 `guest-preview-sanctuary` 로 시작 — 다른 사람 계정·서버 데이터를 열지 않는 게스트 둘러보기).
- 함수 수준 막기는 화면 밖 호출(콘솔·다른 코드)에서 테스터 uid 입장을 막는다. 테스터 B uid 의 서버 데이터 보호는 RLS 가 본체이며 이 PR 은 앱 쪽 지름길을 닫는 것이다.

## 5. [원칙 ⑤] 절차

1. `js/direct-login-guard.js`: `LOCAL_DEV_HOSTS`, `isLocalDevHost(hostname)` 추가·노출, `resolveDirectLoginTarget` 의 `explicit-tester` 갈래에 `o.devHost === true` 조건.
2. `index.html`: `enterAsTesterB` 첫 줄 호스트 막기(한 줄), `initDevDebugButtons` 의 `isLocal`·`isDev` 고침, `loginWithDirectIdentifier` 에 `devHost` 전달, `<script src="js/direct-login-guard.js?v=20261005-es372">`.
3. `tests/dev-host-gate.test.js` 5건 + `scripts/test-shipyard-modular.js` 연결.
4. `docs/architecture/modules.json` 역할 문구 갱신 — `node scripts/module-specs.js --write`.
5. claims·dev_log·TICKETS. 인라인 스크립트 +2줄은 `node scripts/module-guard.js --update --reason` 으로 기준선에 사유와 함께 남긴다.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- **반론 1**: 개발자가 운영 주소에서 테스터 B 로 2계정 상호작용을 시험하던 길이 없어지는 기능 삭제 아닌가? → 운영 화면에는 #TASK-ES-223 부터 이 버튼이 기본 제거 상태였고, 보이던 것은 결함 경로(`?debug=true`)뿐이다. 로컬 개발 호스트(`localhost`·`127.0.0.1`·`[::1]`·`*.localhost`)에서는 `?debug=true` 로 그대로 보이고 눌러서 들어간다(부품 시험 ③, 브라우저 실측 localhost 2개·입장). 지시서도 기능 삭제가 아니라고 정했다.
- **반론 2**: `location.hostname` 을 읽는 코드는 법정이 "접속 환경에 따라 갈리는 코드"로 표시해 확인 부족이 될 수 있지 않나? 우회해서 읽으면 되지 않나? → 이 작업의 요구 자체가 호스트에 따라 갈리는 것이라 그 표시는 정직한 결과다. 검사를 피하려고 변수 이름을 돌려 쓰지 않았다. 대신 운영 흉내 호스트 실측과 부품 시험(8개 차단 호스트·5개 허용 호스트)으로 갈래 양쪽을 쟀다.

## 7. [원칙 ⑦] 단계별 실행

- 위 1~5 를 이 PR 에서 실행. `NODE_PATH=C:/dev/ourgoal-app/node_modules npm test` 전 구간 통과 확인 뒤 커밋.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정

- **법정 화면 주장 불가**: 법정 시나리오의 `goto.path` 는 `/`·`/index.html` 만 허용하고 쿼리를 붙일 수 없다(court/lib/scenario.js, court/config.json — 동결). 그래서 "`?debug=true` 로 열어도 버튼 0개"는 법정이 화면에서 잴 수 없다. 대신:
  - 부품 시험 `tests/dev-host-gate.test.js`(npm test 경로): 작업 커밋 5/5, 기준 커밋 index.html(`--html`)에서 3/5(①②실패 — 운영 호스트 8곳 모두 버튼 2개·입장 1회).
  - 작업자 브라우저 실측(Chrome 헤드리스, 법정 lib/chrome.js·lib/static-server.js 를 읽기 전용으로 사용, `/index.html?debug=true`):

| 커밋 | 호스트 | 보이는 테스터 버튼 | `initDevDebugButtons(true)` | `enterAsTesterB()` 직접 호출 뒤 프로필 |
| :-- | :-- | :-: | :-: | :-- |
| 기준 07d4eee | ourgoal-prod-sim.example | 2 | 2 | 테스터 B uid |
| 기준 07d4eee | localhost | 2 | 2 | 테스터 B uid |
| 작업 | ourgoal-prod-sim.example | **0** | **0** | **null(반환 false)** |
| 작업 | localhost | 2 | 2 | 테스터 B uid |

- 실제 운영 주소(Vercel)·미리보기 주소에서의 확인은 배포 뒤에만 가능하다(확인 못 함).
