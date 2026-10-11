# REQ — 미분화 덩어리 함수 이전: `saveGoogleToken`(구글 캘린더 토큰 저장)

- Task ID: **TASK-ES-659** (L012: `gh pr list --state all` · `git ls-remote origin` · `docs/rules/TICKETS.md` 에서 659 가 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-659-save-google-token` 을 먼저 push 해 선점했다. 646·650·658 은 다른 작업 몫이다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main): **DIR-003**(줄을 지우는 PR 마다 기준선에 inlineScriptLines 기록) · **DIR-004**(함수 이전 — 기존 CELL_SPLIT, 함수 본문의 글자는 고치지 않는다).
- **근거 조문(헌법 v2026.10.11-ARGUMENTS · PR #925 — origin/main 정본 `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md` 에서 읽은 글자 그대로)** — CELL_SPLIT 5호:
  > 5. 전역 이름을 새로 늘리지 않는다. 옮긴 함수의 최상위 `this` 는 0 이어야 한다. 최상위 `arguments` 도 0 이어야 하되, 함수 선언(`function 이름(…) { … }` 꼴)을 선언째로 글자 그대로 옮길 때 그 함수 본문에서 쓰는 `arguments` 는 그 함수 자신의 호출 인자를 가리켜 옮겨도 뜻이 같으므로 허용한다. 이 허용은 거기까지다 — 감싸기로 옮기는 로드 중 문, 생성기가 새로 만든 감싸기 함수의 최상위, 화살표 함수 안의 `arguments`(바깥 함수의 것을 가리킨다)처럼 옮기면 뜻이 달라질 수 있는 꼴은 그대로 0 이어야 한다.
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「어려운 인라인 묶음 함수 이전」**(`docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` 2-2절 함수 이전 · 2-9절 「함수 선언 자신의 arguments」) + 법정 「동작 보존 확인」 경로. 직전 선례 #923. 선행 PR **#929**(TASK-ES-657, 생성기·검사기를 개정 조문에 맞춤)가 병합된 뒤의 본 이전이다. 작업참고 **기준 PR #905**(eab4365b).
- 이 작업 세션은 빌더(서브에이전트)다. 병합은 하지 않는다(오케스트레이터 몫).
- 기준 main: 8c076e17(#929 병합 뒤).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

- **R1** `saveGoogleToken` 을 생성기로 세포 `js/core/gcal-token-save.js` 에 글자 그대로 옮긴다. 게스트 화면의 동작을 보존한다(손 편집 0).
- **R2** 옮긴 함수가 쓰는 `arguments` 는 개정 조문이 허용한 꼴(함수 선언 자신의 것)뿐이고, 인자 수를 바꿔 직접 부른 결과가 이전 전과 같다.
- **R3** 구글 캘린더 연동 뒤 동작(구글 동의로 받은 토큰이 로그인한 계정의 키에 저장되고 다시 열었을 때 복원됨)이 이전 전과 같다.
- **R4** 증명 하한(헌법 CELL_SPLIT_PROOF): 토큰 동일·누수 0 · 단독 로드 회귀 0 · 통로·window 이름 값 지문이 옮긴 함수 말고 같음 · npm test 수 동일 · tests·금고·생성기 변경 0.
- **R5** 기준선(`docs/architecture/module-baseline.json`)에 줄어든 inlineScriptLines 를 기록한다(DIR-003).

범위 밖(건드리지 않음): 노출 줄 `window.saveGoogleToken = saveGoogleToken;`(생성기 규칙대로 원래 자리) · 통로의 기존 getter `get saveGoogleToken(){…}` · 부르는 쪽 `js/auth-social.js` · `js/core/gcal-sync.js` · `js/tabs/settings/session-entry.js`(모두 `L.saveGoogleToken(…)`) · `googleTokenClient` 상태 선언 · `openProTemplateRecordModal` · 생성기가 다시 단 통로 getter 의 철거(철거 담당 몫).

### 구체 식별자

- 파일: `index.html`(인라인 IIFE) → 새 세포 `js/core/gcal-token-save.js`(키트 `OurgoalUiHelpers`, 태그는 `js/core/ui-helpers.js` 태그 바로 뒤 같은 줄)
- 함수: `saveGoogleToken(tokenObj)` — 둘째 인자를 `var optEmail = arguments[1];` 로 읽는다 · 통로로 읽는 이름: `gcalCurrentUid` · `state` · `purgeLegacySharedGcalKeys`
- 생성기 `docs/design/harness/module-split/gen-inline-hard.js`(변경 0) · 검사기 `verify-inline-hard.js`(변경 0) · 설정 `reports/TASK-ES-659/proof.json`(자리 표지 `HO`, 구획 「전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템」에서 이름으로 고름, keepRest)
- 이전 전 index.html(8c076e17) 줄: 2947~2973(앞 표지 주석 두 줄 포함 27줄) (출처 `reports/TASK-ES-659/gen-inline-hard-meta.json` `plan`)

### 세포 파일을 따로 둔 까닭 (기존 `js/core/gcal-token.js` 와의 책임 구분)

| 세포 | 책임 | 성격 |
|---|---|---|
| `js/core/gcal-token.js` | 계정 격리 도우미 — 키 이름(`gcalEventsKey`) · 지금 계정(`gcalCurrentUid`) · 주인 확인(`ensureGcalOwner`) · 예전 공용 키 정리(`purgeLegacySharedGcalKeys`) · 설정 불러오기 | 저장하지 않는다(읽기·정리) |
| `js/core/gcal-sync.js` | 연결 창 · 토큰 받기(`requestGoogleToken`) · 복원(`restoreGoogleToken`) · 일정 가져오기·보내기 | 구글과 주고받는다 |
| **`js/core/gcal-token-save.js`(새로)** | 받은 토큰을 지금 계정의 키에 **저장** 한 가지 | 저장소에 쓴다 |

- 생성기는 세포 파일을 새로 만든다(이미 있는 세포 파일에 끼워 넣는 길이 없다 — 손 편집 0 을 지키려면 새 파일이다). 그래서 「어느 기존 파일에 넣을까」가 아니라 「새 파일의 책임을 무엇으로 이름 붙일까」의 문제다.
- 이름은 함수 이름을 따라 `-save` 로 했다(`-store` 는 저장소 추상화로 읽힐 수 있다). 키트는 두 이웃 세포와 같은 `OurgoalUiHelpers` 다(새 window 전역 0).

## 1. [원칙 ①] 문제를 정확히 파악한다

IIFE 최상위에 남은 함수 선언 가운데 하나다. 이 함수는 둘째 인자(이메일)를 이름 붙인 매개변수가 아니라 `arguments[1]` 로 읽는다. 옛 조문에서는 옮길 수 없었고(생성기 「유형 K」 정지), 헌법 개정(#925)과 생성기·검사기 맞춤(#929) 뒤에 옮길 수 있게 됐다. 부르는 곳은 세 세포이고 모두 구글 연동·로그인 뒤 경로다 — 게스트 화면 조작으로는 불리지 않는다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 함수 선언을 선언째로 글자 그대로 세포로 옮긴다. `arguments` 는 그 함수 자신의 호출 인자를 가리키므로 옮겨도 뜻이 같다.
- **원인**: 조문과 도구가 `arguments` 를 한 가지로 막고 있었다. 지금은 조문·도구가 이 꼴만 허용한다.
- **중심**: 생성기 한 번 실행(설정 `reports/TASK-ES-659/proof.json`, 세포 1개 · 함수 이름 1개).
- **핵심**: 게스트 시나리오가 이 함수를 부르지 않으므로, 「둘째 인자가 그대로 읽힌다」를 화면 밖에서 직접 재야 한다 — 인자 수를 바꿔 함수를 직접 부르고 저장 결과를 기준과 맞대는 실측(`save-token-probe.json`)이 증명의 급소다.

## 3. [원칙 ③] 해결 방식

- 표준 이음매: 함수는 옮기고(2-2), 인라인 이름은 통로 `L.<이름>` 로 읽는다. 새 세포 파일 하나, 기존 키트 `OurgoalUiHelpers` 에 함수를 단다.
- index.html 은 IIFE 머리에서 `var saveGoogleToken = _uiKit.saveGoogleToken;` 로 같은 이름을 가져온다. 기존 통로 getter 와 `window.saveGoogleToken = saveGoogleToken;` 줄은 그대로다 — 부르는 세포의 `L.saveGoogleToken(…)` 와 window 이름이 같은 함수 값에 닿는다.
- `arguments` 글자에는 접두가 붙지 않는다(스코프 이름이 아니다). 등록 블록을 손으로 넣지 않았고 `gen-cell-provide.js` 를 돌리지 않았다(L068).

## 4. [원칙 ④] 재검토 (반례·부작용)

- **`arguments` 가 허용 범위 안인가(`arguments-check.json` — 생성기·검사기와 따로 셈)** → 세포의 `arguments` 는 1곳, 가장 가까운 함수 부모가 옮긴 함수 선언 자신이다. 화살표 함수 0 · 화살표 안 `arguments` 0 · 그 함수 층 `this` 0 · 안쪽 보통 함수 0. 기준 index.html 의 같은 함수에서 센 값과 같고 `arguments` 줄의 글자가 같다. 생성기 메타·검사기 보고의 `ownArguments` 수(1)와 같다. 검사기 `thisArgs` 는 [].
- **둘째 인자가 그대로 읽히는가(`save-token-probe.json` — 브라우저 직접 호출)** → 기준·작업 트리를 각각 게스트로 띄워 가짜 토큰 객체로 다섯 경우를 불렀다: A 토큰 없음(아무것도 쓰지 않음) · B 인자 둘·통로로 호출(둘째 인자가 저장값의 email, 예전 공용 키 4개 삭제, 주인이 다르던 일정 캐시 버림) · C 인자 하나(email 빈 글자 · 만료 기본값 · 캐시 유지) · D 인자 하나 + 설정의 연동 이메일(그 계정 키에 설정 이메일로 저장) · E 인자 셋·window 로 호출(둘째 인자가 설정 이메일보다 먼저). 다섯 경우의 결과가 기준과 작업에서 같고, 기대값 여덟이 모두 맞았다. 끝에 넣은 키·바꾼 state 를 되돌렸다.
- **엄격 모드에서 `arguments` 의 뜻이 달라지지 않는가** → 기준 인라인 IIFE 도 `"use strict"` 이고 세포도 `'use strict'` 다. 엄격 모드에서 달라지는 것은 매개변수와 `arguments` 의 별칭 연결뿐인데, 이 함수는 `tokenObj` 에도 `arguments` 에도 대입하지 않는다.
- **통로로 부를 때 `this` 가 바뀌는 위험** → 세포는 `L.gcalCurrentUid()` · `L.purgeLegacySharedGcalKeys()` 로 부른다. 두 함수 모두 `this` 를 쓰지 않는다(세포 `js/core/gcal-token.js` 본문). 옮긴 함수 자신도 `this` 0.
- **생성기가 새로 단 통로 getter 2개** → `gcalCurrentUid` · `purgeLegacySharedGcalKeys`. 둘 다 기준에서 이미 통로에 있고 등록 기관이 내주던 이름이다(통로에 처음 생기는 이름 0). getter 를 단 줄보다 값이 정해지는 줄이 앞이다(`expose-window.json`). 상태 기관 이름 56개와 겹치는 이름 0(`accessor-probe.json`).
- **이름 지문** → 통로 431개 중 달라진 것은 `saveGoogleToken` 하나(종류·이름·인자 수 같고 함수 글자 해시만 — 본문에 `L.` 접두) · 그 밖 0 · 사라진 이름 0 · 새 이름 0. window 17개 중 달라진 것도 같은 이름 하나뿐이다.
- **바뀐 글자** → 옮긴 27줄을 기준과 줄 단위로 맞대면 바이트 동일 20줄 · `L.` 접두만 다른 줄 7줄 · 그 밖 0줄, 접두 9개 = 생성기 바꿔 쓰기 9개(`prefix-only-check.json`).
- **글자를 찾는 시험** → `tests/gcal-login-reconnect-fix.test.js` 는 `window.saveGoogleToken = saveGoogleToken;` 글자를 index.html 에서 찾는다 — 그 줄은 원래 자리에 남았다. `scripts/smoke-test.js` 는 `function saveGoogleToken(tokenObj)` 글자와 함수 본문을 index.html + 세포 합본(접두를 뗀 것)에서 찾아 돌린다. 둘 다 기준과 같은 결과다(시험 파일 변경 0).
- **함께 옮겨진 주석** → 함수 선언 바로 앞의 표지 주석 두 줄(#TASK-ES-575 · #TASK-ES-482 이전 표지)이 생성기 규칙(앞 주석 포함)으로 세포에 함께 갔다. 실행되는 글자가 아니다. 사실대로 적는다.
- **단독 로드(L018)** → 세포 파일은 함수 정의만 한다. 새 파일 단독 로드 ok, 기준 대비 회귀 [].

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · `npm ci --ignore-scripts` · 기준 작업 폴더(분리 HEAD).
2. 생성기 실행 → 검사기 ok → `module-specs --write` · `cell-desc-add.js` · `module-guard --update`(낮아진 값만).
3. `arguments` 독립 집계(`arguments-check.cjs`) · 직접 호출 실측(`save-token-probe.cjs`) · 줄 단위 비교(`prefix-only-check.cjs`).
4. 측정: 모듈 로드 · 이름 지문 · 통로 접근자 · 시나리오(기준 2회·작업 1회) · npm test(기준·작업 전경) · tests 전부 종료 코드.
5. 서류 → `verify-integrity-gate.js` → `npm test` → 커밋 → 로컬 `recomputeSplit` · 로컬 법정 전체 실행 → origin/main 합치기 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「게스트 시나리오가 이 함수를 한 번도 부르지 않는데 동작 보존을 말할 수 있나」** → 화면으로 말하는 것은 게스트 동작(시동과 여섯 탭)이 그대로라는 것뿐이다. 함수 본문의 동일성은 생성기 재실행 바이트 대조(proof)·토큰 동일·줄 단위 비교로, `arguments` 의 뜻은 직접 호출 실측으로 말한다. 진짜 구글 연동 뒤의 동작(R3)은 법정이 로그인도 구글 동의도 할 수 없어 잴 수 없다 — 그 지시 항목에는 「확인 못 함」 주장 하나만 걸었다(L045).
- **반론 2 「직접 호출 실측은 가짜 토큰·임시 프로필로 부른 것이지 진짜 연동이 아니다」** → 맞다. 실측이 보이는 것은 「같은 입력에 같은 저장 결과가 나온다」까지다. 진짜 토큰이 이 함수에 들어오는 길(연동 버튼 → 구글 동의 창 → 토큰 수신 → 호출)과 그 뒤의 복원은 재지 못했다. 그 차이를 한계로 적는다. 또 이 실측은 작업자 PC 측정이라 법정이 다시 돌린 것이 아니다.
- **반론 3 「도구를 풀어 놓고 그 도구로 옮긴 것을 그 도구로 검사했다」** → 그래서 `arguments` 는 생성기·검사기와 따로 센 값(`arguments-check.json`)으로도 걸었고, 뜻은 도구가 아니라 실행 결과(`save-token-probe.json`)로 걸었다. 도구의 변경 자체는 선행 PR #929 에서 따로 판정받았다.
- **재검증**: 선행 PR 의 모의 이전(`reports/TASK-ES-657/mock-tests.json`)에서 본 것과 이번 실제 실행이 같다(옮김 1 · 새 getter 2 · `ownArguments` 1곳 · 노출 줄 원래 자리). 줄 번호만 다르다(그 사이 #927 상태 이전으로 index.html 이 줄었다).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-659/` 아래, 작업자 측정이다.

| 산출물 | 무엇을 쟀나 |
|---|---|
| `proof.json` · `gen-inline-hard-meta.json` · `verify-inline-hard.json` | 생성기 설정 · 생성기 메타(`ownArguments`) · 검사기 보고 |
| `arguments-check.json` | 옮긴 함수의 arguments·this 를 도구와 따로 센 값, 기준과의 대조 |
| `save-token-probe.json` | 인자 수를 바꾼 직접 호출 다섯 경우의 저장 결과(기준 대 작업) |
| `prefix-only-check.json` | 옮긴 구간 줄 단위 비교(접두 말고 다른 줄) |
| `module-load.json` | 모듈 단독 로드 기준 대비 회귀 |
| `cell-registry-compare.base.json` · `cell-registry-compare.json` · `name-fingerprints.json` | 통로·window 이름 값 지문 |
| `accessor-probe.json` · `expose-window.json` | 세포가 읽는 통로 이름 · 새 getter 와 상태 기관 겹침 · getter 줄과 값 줄의 순서 |
| `scenario-local.json` · `scenarios/s1-guest-boot-six-tabs.json` | 게스트 시동·여섯 탭 시나리오(기준 2회·작업 1회) |
| `npm-test-compare.json` · `tests-all-compare.json` · `raw/` | npm test 비교 · 시험 파일 하나씩 종료 코드 비교 |
| `measurement.json` | 줄 수·지표·기준선·바뀐 파일 분류 |
| `court-local.json` | 로컬 법정 전체 실행 요약과 로컬 `recomputeSplit` 결과(커밋 뒤) |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 구역 이전(650)·944줄 정리(646)가 먼저 병합되면 index.html 이 충돌한다 → 손으로 풀지 않고 main 판 index.html 로 같은 설정을 다시 돌려 재측정한다(L010).
- **측정불가**: 진짜 구글 연동 뒤의 토큰 저장·복원(R3) — 법정·작업자 PC 모두 구글 동의 창을 열 수 없다. 「확인 못 함」으로 적는다.
- **성과 측정**: 인라인 스크립트 줄 수 2331 → 2311(−20) · index.html 함수 선언 수 18 → 17 · index.html 4600 → 4580줄 · 새 세포 52줄(출처 `measurement.json`). 기준선 64번째 기록.
- **다음에 열리는 것**: 이 PR 뒤 IIFE 최상위 함수 선언은 `openProTemplateRecordModal` 하나만 남는다(944줄 — 다른 작업 #TASK-ES-646 몫. 작업 트리의 인라인 스크립트를 파싱해 센 값).
- **PLAN 체크리스트**: [4단계: 심사 청구]까지만 기록한다(`.claude/plan-TASK-ES-659.md`).
