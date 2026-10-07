# 세포 자기 등록 기관 설계 — 미분화 덩어리의 배선 철거 (#TASK-ES-594 · B0)

- 상태: **설계(제품 코드 변경 없음)**. 이 문서는 작업 세션의 설계 서류다. 효력·근거가 아니며, 결과 판정은 GitHub 법정만 낸다.
- 선행 설계: [INLINE-HARD-SPLIT-DESIGN.md](INLINE-HARD-SPLIT-DESIGN.md)(#762) · [INLINE-STAGE3-DESIGN.md](INLINE-STAGE3-DESIGN.md)(#802) · [../specs/MODULE-SPLIT-PROTOCOL.md](../specs/MODULE-SPLIT-PROTOCOL.md)
- 측정 기준: `origin/main` 11c8e9d(#861 병합 뒤). 아래 수는 모두 측정값이다. 측정 방법은 7절에 적었다.

## 1. 왜 새 방식이 필요한가

`index.html` 인라인 IIFE(미분화 덩어리) 4,147줄을 줄 종류별로 나눴다. 그 결과 생성기로 **옮길 수 있는 함수 본문은 1,398줄(34%)뿐**이다. 나머지는 이미 옮긴 함수를 다시 이어 붙이는 **배선**이다.

| 종류 | 줄 | 지금 하는 일 |
|---|--:|---|
| 가져오기 `var x = _kit.x` (키트 17종) | 527 | 세포가 window 에 단 키트에서 이름을 IIFE 스코프로 끌어온다 |
| `OurgoalAppScope.expose('index.html', {get …})` (48회, getter 446 · setter 30) | 542 | 끌어온 이름과 IIFE 상태를 다시 `L.` 통로로 다른 세포에 내준다 |
| window 노출 (이름 199개) | 320 | 끌어온 이름을 다시 window 에 단다(마크업의 `on*="…"` 처리기·바깥 파일용) |
| 상태·상수 변수 82개 (그중 다시 대입되는 것 32) | 228 | 여러 세포가 `L.` 로 읽고 쓰는 공용 상태 |
| 로드 중 호출 · if 블록 | 352 | `bind*()` 같은 부팅 배선(원래 자리·순서 유지) |

배선은 **세포 → index.html(가져오기) → 세포(통로·window)** 로 한 바퀴 돈다. 이 줄들은 옮길 원문이 아니다. 그래서 「옮기기(CELL_SPLIT)」로는 줄지 않는다.

## 2. 방식 — 새 기관을 추가하고, 대조하고, 옛 배선을 철거한다

1. **새 기관 추가 (동작 변화 0)**
   - 각 세포가 자기 이름을 등록 기관에 **스스로** 등록한다.
   - 대조 모드에서 등록 기관은 값을 덮어쓰지 않고 기록만 한다.
2. **대조**
   - 부팅이 끝난 뒤 탐침이 옛 경로가 만든 값과 새 경로가 등록한 값을 이름마다 `===` 로 전수 비교한다.
   - 비교 범위는 `OurgoalAppScope.scope` 의 모든 이름과 window 노출 199개다.
   - 로드 중 호출은 호출 순서 기록을 나란히 비교한다.
3. **철거**
   - 불일치 0인 구역(키트 단위)부터 옛 가져오기·getter·window 줄을 지운다.
   - 지우는 일은 손으로 하지 않는다. 생성기의 「배선 철거 모드」(5절)로만 한다.

이 방식은 CELL_SPLIT(옮기기)을 바꾸지 않는다. PR 종류가 둘 늘 뿐이다: **새 기관 추가 PR**과 **배선 철거 PR**. 증명 하한은 4절에 적었다.

## 3. 구성 요소

### 3.1 등록 기관 `js/core/cell-registry.js` (가칭)

```js
OurgoalCellRegistry.provide(owner, { name: value, … }, { window: ['name', …] })
OurgoalCellRegistry.mode            // 'compare'(대조) | 'own'(소유) — 이름 단위
OurgoalCellRegistry.report()        // 대조 결과: { mismatches:[{name, owner, kind}], missing:[…], extra:[…] }
```

- **compare 모드**: 등록 값만 보관한다. `OurgoalAppScope` 와 window 는 건드리지 않는다. 이중 등록·이중 처리기는 0이다.
- **own 모드**: 철거된 구역의 이름에 대해서만 `OurgoalAppScope.expose(owner, …)` 와 window 대입을 등록 기관이 직접 한다.
  - 함수 값은 getter 로 감싸지 않고 값으로 둔다.
  - 다시 대입되는 상태만 getter/setter 로 둔다.
- 로드 순서: 바깥 스크립트 102개는 모두 IIFE 앞에서 로드된다(측정). 예외는 `defer` 인 `/ui.js` 와 구글 GSI(`async defer`) 둘이다. 이 두 파일의 이름은 B1 에서 따로 측정해 own 모드 대상에서 뺀다.

### 3.2 대조 탐침 `court` 밖, `scripts/probes/cell-registry-compare.js` (가칭)

- 브라우저에서 게스트로 진입해 부팅을 끝낸 뒤 `OurgoalCellRegistry.report()` 를 받아 JSON 으로 쓴다.
- 이름마다 `oldValue === newValue` 를 본다. 함수는 참조가 같아야 하고, 상태는 getter 가 같은 값을 돌려줘야 한다.
- **로그인 경로와 무관하다.** 배선은 부팅 때 전부 놓이므로 게스트 상태에서 이름 전수 비교가 가능하다. 로그인 뒤 *동작*은 별도 주장(`unverified` `needs-login`, L045)으로 분리한다.

### 3.3 상태 기관 `js/core/app-state.js` (가칭, B9)

- 상태 변수 82개의 소유를 옮긴다.
- 다시 대입되는 32개는 get/set 을 짝으로 둔다. 이것으로 L047(앞 자리의 setter 를 뒤 노출의 getter-only 가 덮는 문제)이 풀린다.
- IIFE 안 코드가 남아 있는 동안에는 IIFE 쪽 변수가 상태 기관의 get/set 을 거치도록 하는 연결이 필요하다. 상세는 B9 착수 전에 이 문서를 개정해 적는다.

### 3.4 부팅 기관 (B10)

- 로드 중 호출 191개와 if 블록 161개를 **같은 순서**로 부른다.
- 대조 모드에서는 호출을 기록만 하고, 옛 자리 호출과 순서 배열이 같은지 비교한다.

## 4. PR 종류별 증명 하한

| PR 종류 | 주장 | 필요한 증거 | 목표 판정 |
|---|---|---|---|
| 새 기관 추가 (B1·B2, 대조 모드) | `behavior` · `change: preserve` | 게스트 부팅·주요 탭 시나리오(행동이 만든 변화 단언 포함), module-load 탐침 새 회귀 0, npm test 수 동일·폐기 0, 대조 결과 파일(첫 측정의 불일치 목록을 그대로 보고) | 동작 보존 확인 또는 통과 |
| 배선 철거 (B3~B10) | `behavior` · `change: preserve` + `proof`(생성기 철거 모드 설정) | 철거 대상 키트의 대조 불일치 0, 법정의 생성기 재실행 바이트 대조, 시나리오·module-load·npm test 동일 | **동작 보존 확인** (결심 ⑤ 전제) |
| 함수 이전 (A 트랙) | 기존 CELL_SPLIT 그대로 | CELL_SPLIT_PROOF | 동작 보존 확인 |

공통으로 지킬 것:
- 작업번호는 PR 마다 새로 쓴다(L012).
- 검사 폐기 0, index.html 순증가 0, 새 전역은 등록 기관 이름 하나뿐.
- 합치면 바뀌는 값은 주장에 쓰지 않는다(L002).
- 충돌은 main 판으로 생성기를 다시 돌려 푼다(L010).

## 5. 생성기 「배선 철거 모드」 사양 — **결심 필요 ⑤**

법정의 「동작 보존 확인」(`court/lib/preserve-source.js` `recomputeSplit`)은 **기준 커밋의** `docs/design/harness/module-split/gen-inline-hard.js` 를 PR 의 설정으로 다시 돌린다. 그 결과가 PR 의 `index.html` 및 세포 파일과 바이트 단위로 같아야 한다. 손으로 지운 철거 PR 은 이 대조를 통과할 수 없다.

**제안**: `gen-inline-hard.js` 에 설정 `"mode": "unwire"` 를 더한다.

```json
{ "task": "TASK-ES-6xx", "slot": "HO", "mode": "unwire",
  "cells": [{ "file": "js/core/cell-registry.js" }],
  "unwire": { "kitVar": "_settingsKit",
              "imports": true, "exposeGetters": true, "windowAssign": true,
              "names": ["…등록 기관 대조에서 불일치 0 인 이름만…"] } }
```

- 지우는 대상은 세 가지뿐이다: 지정한 키트의 가져오기 줄, `expose` 객체의 해당 getter/setter 속성, 해당 window 대입 줄.
- 그 밖의 글자는 바꾸지 않는다.
- `names` 에 없는 이름은 지우지 않는다.
- 이 모드는 함수 본문을 옮기거나 고치지 않는다.

**왜 결심이 필요한가**
- 생성기는 금고(`court/`) 밖에 있다.
- 하지만 법정이 이 생성기를 다시 돌리므로, 모드를 더하면 「동작 보존 확인」이 받아 주는 변경의 범위가 넓어진다.
- 그래서 생성기 변경 PR(B1)은 사양을 공개하고 상민님 확인을 받은 뒤 병합한다.

**대안** (결심이 「불허」일 때): 철거 PR 의 목표 판정은 「확인 부족」이 된다. 대조 결과를 증거로 붙이고 상민님 병합 결정으로 진행한다. MERGE_GATE 해석은 그때 상민님이 판단한다.

## 6. 순서와 범위

| 순서 | ID | 내용 |
|--:|---|---|
| 1 | **B0** | 이 문서 |
| 2 | B1 | 등록 기관(compare 모드) + 대조 탐침 + 생성기 철거 모드(⑤ 승인 시). 첫 대조 결과를 측정해 보고 |
| 3 | B2 | 세포마다 `provide()` 등록 줄 추가(키트별). 불일치 0 달성 |
| 4~9 | B3~B8 | 키트별 철거: `_settingsKit`(109) → `_goalsKit`(108) → `_uiKit`(101) → `_recordsKit`(94) → `_commKit`(58) → `_calendarKit`(19)·기타(38) |
| 10 | B9 | 상태 기관 (3.3) |
| 11 | B10 | 부팅 기관 (3.4) |

- 함수 이전(A 트랙)과 템플릿 마켓(C 트랙)은 이 문서 범위 밖이다. 다만 A 트랙이 새로 만드는 세포는 B1 병합 뒤 `provide()` 등록을 함께 넣는다.
- 한 번에 1 PR 만 연다. PR 마다 법정 판정 → 상민님 승인 → 병합 → 다음 PR 순서로 간다.

## 7. 측정 방법 (재현)

- IIFE 경계: `<script>` 다음 줄이 `(function(){` 인 블록, `</script>` 까지(`index.html` 2253~6401행).
- 줄 종류: `@babel/parser` 로 IIFE 최상위 문을 분류했다.
  - 함수 선언 / `var x = a.b`(가져오기) / 그 밖의 `var`(상태) / `OurgoalAppScope.expose(…)`(통로) / `window.x = …`(노출) / 호출문(로드 중 호출) / `if` 블록 / 주석 / 빈 줄
- 지도 생성기 `scripts/inline-script-map.js` 는 경계를 다르게 잡아 4,122줄로 센다.
- 바깥 스크립트 순서: `index.html` 의 `<script src>` 102개가 전부 IIFE 앞에 있다. `defer`/`async` 는 47행 `/ui.js`, 2146행 구글 GSI 둘이다.
- `OurgoalAppScope.expose` 는 같은 이름을 나중에 노출하면 속성을 다시 정의한다(`js/core/app-scope.js`, `Object.defineProperty`). L047 의 원인이다.

## 8. 상민님 결심이 필요한 것

| # | 항목 | 이 문서의 권장 |
|---|---|---|
| ⑤ | 생성기에 「배선 철거 모드」를 더해 법정이 철거 PR 을 다시 돌려 대조하게 함 | 허용. 5절 사양대로, 지우는 대상 세 종류로 제한 |
| ③ | 기존 계획의 「IIFE 머리 기관화」를 이 B 트랙으로 대체 | 대체 |
