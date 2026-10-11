# REQ — TASK-ES-654 헌법 개정 초안 v2026.10.11-ARGUMENTS 「세포 분열 arguments 조항」 (금고만 담은 PR · 위임 병합 대상 아님)

- 유형: 표준(헌법 개정 — 작업참고 L044, 선례 PR #881) · 제품 코드 변경 0 · 생성기 변경 0 · 시험 변경 0 · 승인선 ⑤
- 작업참고 기준 PR #921(경험칙 104) · 기준 커밋 origin/main `529e4370` · 직전 커널 `v2026.10.11-ALIGNED`(blob `40d415cc`)
- 지시함 근거(origin/main `docs/directives/ACTIVE.md` 결심 대기 표, 글자 그대로): 「saveGoogleToken 의 arguments — 헌법 CELL_SPLIT 5호(옮긴 함수의 최상위 this·arguments 0) 해석 또는 선행 수정(DIR-004 묶음 5) | 규범 변경(헌법) | 헌법 개정 절차로 따로 여쭘(초안 PR → 「헌법 개정 승인」)」

## 상민님 지시 원문 (오케스트레이터 세션이 옮겨 준 글자 그대로 · 조문 2.2)

이 PR 을 만든 빌더 세션은 아래 대화를 **직접 보지 못했다.** 커맨드센터 오케스트레이터 세션(309dca5d)이 옮겨 준 글자를 그대로 싣는다. 대화 원문은 그 세션에 있고, 이 인용은 참고이며 승인 근거가 아니다(버전 대장 4대 원칙 4 — 근거는 이 PR 의 병합 기록이다).

- 오케스트레이터가 상민님께 올린 「상민님 손이 꼭 필요한 곳」 표의 3번 줄: 「함수 이전 후반 / 『헌법 개정 승인』 + 병합 1번 / `saveGoogleToken` 은 헌법 조항(옮긴 함수에 `arguments` 0)에 걸려, 조항을 고치는 초안을 올려야 합니다.」
- 그 줄에 대한 상민님 답 원문(2026-10-11, 커맨드센터 세션 309dca5d 채팅): **「3. 함수 이전 사전 승인, 헌법 개정 승인 및 병합 사전 승인」**
- 그 답의 전체 문장: 「1. 887 병합완료 2. 철거 2차 사전 승인, 금고 변경 승인 3. 함수 이전 사전 승인, 헌법 개정 승인 및 병합 사전 승인 4. 완료기록 병합 사전 승인」
- 그 뒤 오케스트레이터가 상민님께 보고한 한도: 「"옮긴 함수에 `arguments` 0" 조항만. `this` 금지는 그대로 둡니다.」

| 원문 | 이 REQ 의 항목 | 비고 |
|---|---|---|
| 「헌법 개정 승인」(표 3번 줄 「조항을 고치는 초안」) | R1 — CELL_SPLIT 5호의 `arguments` 부분 한 곳 개정 | 한도 보고 「"옮긴 함수에 `arguments` 0" 조항만」 |
| 한도 보고 「`this` 금지는 그대로 둡니다」 | R2 — `this` 0 유지 · 허용의 한계를 조문에 명시 · 다른 조항·포인터·전문 본문 0 변경 | — |
| 「헌법 개정 승인」에 헌법 조문 14.3 이 요구하는 한 묶음 | R3 — 버전 표기 · 직전 커널 archive · 법령 전문 머리 · 버전 대장 새 행 | 조문 14.3 · 작업참고 L044 |
| 「함수 이전 사전 승인」 | 이 PR 에 없음 — 범위 밖 | 실제 이전(생성기 유형 K 처리·`saveGoogleToken` 이동)은 함수 이전 담당의 별도 PR. 이 PR 은 금고만 담는다(금고와 제품을 한 PR 에 담으면 법정이 돌려보낸다) |
| 「병합 사전 승인」 | 이 PR 에 없음 — 빌더는 병합하지 않는다 | 병합은 오케스트레이터 세션이 판정 확인 뒤 한다(PR 본문에 적음) |

## 0. 범위 — 하는 것과 하지 않는 것

**하는 것**: 커널 정본 `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md` 의 `<cell_split_protocol id="CELL_SPLIT">` 5호 한 문장, 그리고 그 개정의 부수 기재(정본 1행 제목·5행 「버전」 줄·12행 `system_kernel id` · `docs/rules/archive/AGENTS_KERNEL_v2026.10.11-ALIGNED.md` · `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` 머리 「현행 커널 버전」 · `docs/rules/CONSTITUTION_VERSIONS.md` 새 행 · `docs/rules/TICKETS.md` 한 줄).

**하지 않는 것**: `this` 금지 완화 · CELL_SPLIT 1~4호·6~7호 · CELL_SPLIT_PROOF · 조문 3.8 요약(이 문장에는 `this`·`arguments` 가 없다 — 모순 없음, 변경 0) · 포인터 `CLAUDE.md`·`AGENTS.md`·`GEMINI.md` · 법령 전문 본문(대응 조문 없음) · `court/**` · 생성기 `docs/design/harness/module-split/gen-inline-hard.js` · `scripts/inline-hard-types.js` · `index.html`·`js/**`·`tests/**`.

### 바뀌는 문장 전·후

| 파일 | 자리 | 전 | 후 |
|---|---|---|---|
| 커널 정본 | CELL_SPLIT 5호(332행) | 5. 전역 이름을 새로 늘리지 않는다. 옮긴 함수의 최상위 `this`·`arguments` 는 0 이어야 한다. | 5. 전역 이름을 새로 늘리지 않는다. 옮긴 함수의 최상위 `this` 는 0 이어야 한다. 최상위 `arguments` 도 0 이어야 하되, 함수 선언(`function 이름(…) { … }` 꼴)을 선언째로 글자 그대로 옮길 때 그 함수 본문에서 쓰는 `arguments` 는 그 함수 자신의 호출 인자를 가리켜 옮겨도 뜻이 같으므로 허용한다. 이 허용은 거기까지다 — 감싸기로 옮기는 로드 중 문, 생성기가 새로 만든 감싸기 함수의 최상위, 화살표 함수 안의 `arguments`(바깥 함수의 것을 가리킨다)처럼 옮기면 뜻이 달라질 수 있는 꼴은 그대로 0 이어야 한다. |
| 커널 정본 | 1행·5행·12행(버전 표기) | `v2026.10.11-ALIGNED` · 「법령 전문 통합 개정 — …」 · `…-v2026.10.11-aligned` | `v2026.10.11-ARGUMENTS` · 「세포 분열 `arguments` 조항 개정 — CELL_SPLIT 5호 한 곳: …」 · `…-v2026.10.11-arguments` |
| 법령 전문 | 본문(제1~15조·별표) | (CELL_SPLIT 5호에 대응하는 조문 없음) | 변경 0 |
| 법령 전문 | 머리 11~13행 | 현행 `v2026.10.11-ALIGNED` · 직전 `v2026.10.10-CORE` | 현행 `v2026.10.11-ARGUMENTS`(새 줄) · 직전 `v2026.10.11-ALIGNED` · 그 전 `v2026.10.10-CORE`(두 줄은 꼬리표만 바뀌고 나머지 글자 그대로) |

## 1. [원칙 ①] 파악 — 측정

- 현행 조문: 커널 332행 「옮긴 함수의 최상위 `this`·`arguments` 는 0 이어야 한다.」 커널에서 `arguments` 가 나오는 곳은 이 한 줄뿐이었다(`git grep -n arguments` — 포인터 3종 0 · 법령 전문 0 · 버전 대장 0).
- 걸리는 함수: `index.html` 2958행 `function saveGoogleToken(tokenObj){` 의 첫 문 `var optEmail = arguments[1];`(선택적 둘째 인자). `reports/TASK-ES-654/k-functions.json`(도구 `reports/TASK-ES-654/tools/measure-k.cjs`) — 인라인 스크립트의 함수 선언 18개 가운데 본문 최상위에서 `this`·`arguments` 를 쓰는 것은 `saveGoogleToken` 하나, `this` 0 · `arguments` 1 · 화살표 함수 안의 `arguments` 0.
- 생성기는 이 함수에서 멈춘다: `docs/design/harness/module-split/gen-inline-hard.js` 957행 `fail('최상위 this/arguments(유형 K) — 옮기지 않는다: ' + n)`. 판별 함수 `topThisArgs`(919행)는 `this` 와 `arguments` 를 구분하지 않고 한 수로 센다. 유형 설명 `scripts/inline-hard-types.js` 25행: 「K 최상위 this/arguments — … (객체 경유 호출이면 값이 달라진다)」.
- 헌법 글자를 붙잡는 기계: `court/appendix.js`(커널 첫 줄 버전 · `system_kernel id` · 법령 머리 「현행 커널 버전」 · 대장 마지막 행 · 별표 2·3 마커) · `scripts/verify-integrity-gate.js`·`scripts/smoke-test.js`(법령 전문 조문 문구) · `court/selftest/unit.js`(appendix 호출). 옛 5호 문장이나 `CELL_SPLIT` 5호를 글자로 붙잡는 검사는 0(`git grep -F` — scripts·tests·court·.githooks·.github). `court/report.js` 의 `CELL_SPLIT` 은 판정 이름 「동작 보존 확인(CELL_SPLIT 분열 한정)」뿐이다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- 본질: 5호가 지키려는 것은 「옮겨도 뜻이 같다」(1호 동작 0 변경)이다. 낱말 금지가 목적이 아니다.
- 원인: `this` 와 `arguments` 는 성질이 다른데 한 문장에 묶여 있었다. `this` 는 부르는 방식(객체를 거쳐 부르는가)에 따라 값이 달라져, 세포로 옮겨 키트 속성으로 부르게 되면 뜻이 바뀐다. `arguments` 는 그 함수가 받은 실제 인자 목록이라 부르는 방식과 무관하다 — 함수 선언을 통째로 옮기면 여전히 그 함수 자신의 호출 인자다.
- 중심: 뜻이 달라지는 경우는 「감쌀 때」다. 로드 중 문을 새 함수로 감싸면 그 문 안의 `arguments` 는 원래 바깥 함수(인라인 IIFE)가 아니라 새 감싸기 함수의 인자를 가리킨다. 화살표 함수의 `arguments` 도 자기 것이 아니라 바깥 함수의 것이다.
- 핵심: 금지를 「뜻이 달라질 수 있는 꼴」에만 남기고, 뜻이 그대로인 한 가지 꼴(함수 선언을 선언째로 옮길 때 그 본문의 `arguments`)만 연다. `this` 는 그대로 0.

## 3. [원칙 ③] 해결방식

| 대상 | 변경 |
|---|---|
| 커널 CELL_SPLIT 5호 | 위 표의 「후」 문장 한 줄(332행). 허용 한 가지 + 한계 세 가지(감싸기로 옮기는 로드 중 문 · 새로 만든 감싸기 함수의 최상위 · 화살표 함수 안)를 같은 호에 적는다 |
| 커널 버전 표기 | 1행 제목 · 5행 「버전」 줄(효력 문장은 글자 그대로 둠) · 12행 `system_kernel id` |
| archive | `docs/rules/archive/AGENTS_KERNEL_v2026.10.11-ALIGNED.md` = origin/main 커널 원시 blob 글자 그대로(선례 이름 규칙) |
| 법령 전문 머리 | 「현행 커널 버전」 새 줄 · 옛 현행→직전 · 옛 직전→그 전(꼬리표만). 본문·「법령 전문 판」 줄은 그대로(커널 조문 14.5 — 전문 본문을 고치지 않았으므로 전문 판을 올리지 않는다) |
| 버전 대장 | `v2026.10.11-ARGUMENTS` 행(승인 근거 칸: PR 번호는 생성 뒤 기입, 병합 기록은 병합 뒤 기입, 상민님 말씀은 참고로 표시) |
| 티켓 | `docs/rules/TICKETS.md` 끝에 한 줄 |

적용은 멱등 스크립트 `reports/TASK-ES-654/tools/apply-amendment.cjs` 로만 했다(손으로 고친 금고 글자 0). 단계마다 「바꾼 뒤 글자」가 이미 있는지를 먼저 보고, 바꾸기 전 글자가 정확히 한 번 있지 않으면 아무 파일도 쓰지 않고 멈춘다.

## 4. [원칙 ④] 재검토

- 「`arguments` 를 풀면 `this` 처럼 호출 방식에 따라 값이 달라진다」 → 아니다. `arguments` 는 호출 수신자와 무관하다. 유형 K 설명의 「객체 경유 호출이면 값이 달라진다」는 `this` 에만 해당한다. `this` 금지는 한 글자도 풀지 않았다.
- 「엄격 모드가 다르면 `arguments` 의 뜻이 달라진다(매개변수와의 연결·`callee`)」 → 사실이다. 측정: 인라인 IIFE 는 `"use strict"`(index.html 2255행), 세포 파일도 `'use strict'`(예: `js/core/gcal-sync.js`·`js/tabs/settings/user-session-realtime.js` 각 1곳)라 지금은 같다. 다른 경우가 생기면 새 조문의 「옮기면 뜻이 달라질 수 있는 꼴은 그대로 0」과 1호(동작 0 변경)·CELL_SPLIT_PROOF 가 그대로 막는다 — 이 개정은 1호와 증명 하한을 면제하지 않는다.
- 「옮기는 함수 선언 안의 화살표 함수가 쓰는 `arguments` 는 뜻이 같은데 왜 허용에서 뺐나」 → 승인 범위를 좁게 읽었다. 걸리는 실제 사례가 0(측정 argumentsInArrow 0)이고, 화살표 함수는 「자기 것이 아닌 `arguments`」라는 점에서 감싸기와 같은 갈래라 한계 쪽에 두었다. 넓히려면 다시 헌법 개정이다.
- 「조문 3.8 요약·법령 전문도 고쳐야 모순이 없다」 → 3.8 은 「동작 0 변경·생성기 글자 그대로 이동·시험지 선행·index.html 순증가 0·이중 처리기 금지」만 열거하고 `this`·`arguments` 를 말하지 않는다. 법령 전문에는 대응 조문이 없다(측정 0). 고칠 글자가 없다.

## 5. [원칙 ⑤] 절차

1. 새 작업 폴더·번호 선점(브랜치 push) 2. 정본·대장·전문·appendix·작업참고·선례 #881 정독 3. 기준 측정(`appendix --versions`·`--check` · `npm test`) 4. 적용 스크립트 작성 → `--dry` → 실행 → 재실행(멱등) 5. archive blob 대조 · 변경 줄 대조 6. REQ·claims 7. 무결성 게이트 → `npm test` 전경 8. 커밋(훅 통과) → push → PR 9. `--pr <번호>` 로 대장 행·법령 머리에 번호 기입 → `appendix --check` → 커밋·push 10. 법정 판정 확인 → 오케스트레이터 보고(병합하지 않는다).

## 6. [원칙 ⑥] 절차 재검증 — 반론

- 반론 1 「조항만 고치고 생성기를 안 고치면 아무것도 안 풀린다」 → 맞다, 그리고 그것이 이 PR 의 올바른 범위다. 금고(헌법)와 제품·생성기를 한 PR 에 담으면 법정이 돌려보낸다(court/README 5절). 조항이 병합된 뒤 생성기가 허용할 꼴은 새 5호의 한계 안이어야 한다 — 함수 선언의 본문 직접 사용만, 감싸기(`wrapSafe`)·변수 선언 값(화살표·함수 표현식)의 검사는 그대로. 그 PR 은 함수 이전 담당 몫이며 CELL_SPLIT_PROOF 를 그대로 진다.
- 반론 2 「작업 세션이 옮겨 적은 인용으로 헌법을 고친다」 → 인용은 근거가 아니다. 이 PR 은 초안이고, 효력은 상민님의 「헌법 개정 승인」 뒤 원격 main 에 병합된 때 생긴다(조문 14.3). 금고 PR 은 위임 병합 대상이 아니다(MERGE_GATE 3). 빌더가 대화를 직접 보지 못했다는 사실을 REQ 머리·대장 행·PR 본문에 적었다. 상민님이 하지 않은 말은 승인으로 적지 않았다.
- 반론 3 「첫 커밋은 `appendix --check` 가 어긋난다」 → 대장 승인 근거 칸의 PR 번호는 PR 이 생겨야 알 수 있다. 선례 #881 과 같이 PR 생성 직후 번호 기입 커밋을 올려 0 으로 만든다.
- 순서 재검증: archive 는 정본을 고치기 **전** origin/main blob 에서 읽는다(고친 뒤 작업 폴더에서 읽으면 새 글자가 보관된다) — 스크립트가 첫 줄 버전이 `v2026.10.11-ALIGNED` 인지 확인하고 아니면 멈춘다.

## 7. [원칙 ⑦] 단계별 실행 — 측정(작업자 주장 · 판정 아님)

- 적용 1회차: 8단계 모두 applied · 쓴 파일 5(`reports/TASK-ES-654/raw/apply-run1.json`). 2회차: 8단계 모두 already · 쓴 파일 0(`apply-run2.json`).
- 커널 601줄 → 601줄, 바뀐 줄 4(1·5·12·332행 — `git diff --numstat` 4/4). 법령 전문 +3 −2(머리 11~13행뿐, `git diff -U0` 덩어리 1개 `@@ -11,2 +11,3 @@`). 대장 +1 · 티켓 +1. 포인터 `AGENTS.md`·`CLAUDE.md`·`GEMINI.md` 차이 0.
- archive blob = origin/main 커널 blob(`git hash-object` 40d415cc… = `git rev-parse origin/main:01_OURGOAL_SUPREME_CONSTITUTION_FULL.md`).
- `node court/appendix.js --versions`: problems 0(커널·법령 머리·대장 마지막 행 모두 `v2026.10.11-ARGUMENTS`). `--check`·`court/selftest/run.js --unit-only`·무결성 게이트·`npm test` 결과와 PR 번호 기입 뒤 값은 PR 본문 블록 3 에 적는다(이 문서를 쓴 뒤에 잰 값이라 여기에 미리 적지 않는다).
- 기준(origin/main 529e4370, 고치기 전) `npm test`: 종료 코드 0 · ✓ 줄 487 · 무결성 38/38.

## 8. [원칙 ⑧] 막히는 지점 예상·성과 측정

- 금고 파일 쓰기 권한: 정본·`docs/rules/**` 쓰기는 적용 스크립트(node) 1회로 통과했다 — 거부 없음(측정: `apply-run1.json` written 5). 포인터는 쓰지 않았다.
- 법정 판정은 「확인 부족 — 상민님 결심 필요」가 정상이다(금고만 담은 PR). 빌더는 병합하지 않는다.
- 병합 뒤 해야 할 일(L044): ① 대장 행·법령 머리에 병합 커밋·병합자·시각을 기입하는 후속 PR(금고 — 선례 #882) ② 홈 사본 동기화 ③ 경험칙·작업참고 갱신 ④ 금고 밖 문서의 낡은 설명 정리 — `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md`(97행·2-9절)·`INLINE-STAGE3-DESIGN.md`(222행)·`CELL-REGISTRY-DESIGN.md`(287행)·지시함 결심 대기 표의 해당 줄은 아직 「헌법 CELL_SPLIT 5 때문에 원본에 둔다」고 적혀 있다(이 PR 은 금고만 담아 건드리지 않았다. 지시함은 상민님 병합).
- 성과: 이 개정의 사용 가능 여부는 `saveGoogleToken` 이 생성기로 글자 그대로 옮겨지고 법정이 「동작 보존 확인」을 내는 것으로 잰다 — 이 PR 시점에는 미확인이다. 효과(같은 조항 때문에 멈춘 이전 0건)도 미측정이다.
