# REQ — #TASK-ES-691 지시함 「결심 대기」 표에 미분화 덩어리 해체 뒤 남은 것을 올린다

- Task ID: **TASK-ES-691** · 분류: INFRA(문서) · 제품 코드(index.html · js/** · 생성기 · tests · court) 변경 0.
- 작업 유형(SNOWBALL 분류): **(가) 표준** — 지시함 「결심 대기」 표 변경 PR. 선례 PR #887 · #888(그 표에 줄을 더하고 뺀 PR — 상민님 병합).
- **상민님이 병합하실 PR 이다.** 지시함 변경이라 AI 는 병합할 수 없다(헌법 MODE_4B 병합 기준 5 · 조항 9.3 · CODEOWNERS).
- 선행: 완료 기록 PR(#TASK-ES-690) 뒤에 병합한다 — 이 PR 은 그 위에 쌓았다(같은 표를 건드린다).
- 이 문서를 쓴 작업자는 빌더(서브에이전트)다. 상민님과의 채팅을 직접 보지 못했다.

## 왜 완료 기록 PR 과 갈랐나

지휘 세션은 완료 기록 PR(#TASK-ES-690)을 상민님의 2026-10-11 「완료기록 병합 사전 승인」으로 세션이 병합할 수 있다고 본다. 그 사전 승인의 글자는 「완료기록 병합」이다. 새 결심 대기 줄은 끝난 일의 기록이 아니라 상민님이 아직 보지 않은 새 항목이다. 지시함은 병합된 글자가 곧 「상민님이 승인한 내용」이 되므로(지시함 머리말), 상민님이 보지 않은 새 줄을 사전 승인으로 넣는 것은 그 범위를 넘는다고 보았다. 그래서 이 줄들만 따로 떼어 상민님 병합용으로 둔다.

## 0. 요구 (지시 항목)

| ID | 지시 | 완료 기준 |
|---|---|---|
| R1 | 새로 남는 것 여섯 줄을 「결심 대기」 표에 올린다 — 법정 재실행 대조의 새 폴더 결함 · 채점 기준 게이트가 금고 밖 도우미에 기댐 · `renderTeamGoalsScreen` 큰 함수 · 옛 단위 시험 T7 · 실계정으로만 확인할 수 있는 것 · 그대로 둔 기존 결함 후보 | `docs/directives/ACTIVE.md` 의 표에 여섯 줄이 성격 · 상태 칸과 함께 있다. 칸 머리말(「AI 는 이 칸을 스스로 진행하지 않는다」)과 앞선 줄은 그대로다 |
| R2 | 줄마다 근거 위치를 붙인다 | `reports/TASK-ES-691/remaining.md`(파일 · 행 · 앞선 문서의 절) · `not-confirmed.md`(법정이 「확인 못 함」으로 남긴 항목 — 대장에서 스크립트로 뽑음) |

- 이 PR 이 하지 않는 것: 고치기 · 금고 변경 · 실계정 확인. 표의 줄은 상민님 결심을 기다리는 목록일 뿐이다.

### 구체 식별자

- 고친 파일: `docs/directives/ACTIVE.md`(「결심 대기」 표) · `docs/rules/TICKETS.md`
- 새 파일: 이 문서 · `reports/TASK-ES-691/claims.json` · `remaining.md` · `not-confirmed.md` · `not-confirmed.json` · `text/decision-rows.md` · `tools/not-confirmed.cjs` · `tools/render-rows.cjs`
- 문서가 가리키는 식별자(변경 0, 읽기만): `court/lib/preserve-source.js` `recomputeSplit` · `scripts/verify-integrity-gate.js` 19 · 23 · 30행 · `tests/helpers/inline-bundle.js` · `wiring-exposed.js` · `moved-code.js` · `js/tabs/goals/team-goals-screen.js` `renderTeamGoalsScreen` · `docs/design/harness/module-split/unwire-check-b1.js` T7 · `js/tabs/records/table-analytics-engine.js` 249행 · `js/tabs/records/pro-record-save.js` `executeSave` · `js/tabs/records/pro-record-stopwatch.js` 233행 · `#quickRoutineRow`
- DOM: 이 PR 은 화면을 바꾸지 않는다(해당 없음).

## 1. [원칙 ①] 문제를 정확히 파악한다

- 덩어리 해체는 끝났지만, 하는 동안 「이 지시의 범위 밖」이라 손대지 않은 것들이 여러 PR 의 REQ 에 흩어져 있다. 모아 두지 않으면 잊힌다.
- 이 가운데 금고 변경 · 기존 기능 고치기 · 실계정 확인은 AI 가 스스로 정할 수 없다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 상민님이 결정하실 것을 한 표에서 보시게 한다.
- **원인**: 옮기기 PR 은 고치지 않는 것이 규칙이라, 발견한 결함은 적기만 하고 넘어갔다.
- **중심**: 줄마다 근거 위치. 근거 없는 줄은 올리지 않는다.
- **핵심**: 「잰 것」과 「코드를 읽은 것」을 가른다 — 화면으로 재현한 결함과 코드만 읽은 후보를 같은 무게로 적지 않는다.

## 3. [원칙 ③] 해결 방식

- 표의 줄은 짧게, 근거는 `remaining.md` 에 둔다.
- 법정이 「확인 못 함」으로 남긴 항목은 완료 기록 PR 의 대장(`reports/TASK-ES-690/pr-ledger.json`)에서 스크립트로 뽑는다.

## 4. [원칙 ④] 재검토

- **이 줄들이 지시처럼 읽히지 않는가** → 「결심 대기」 칸 머리말이 「AI 는 이 칸을 스스로 진행하지 않는다」고 적는다. 줄의 「상태」 칸은 모두 「여쭘 대기」다. 권장을 적은 줄(큰 함수 나누기)도 「세션 권장」이라고 밝혔다.
- **근거를 다시 봤는가** → 행 번호는 작업 폴더의 파일에서 다시 읽어 맞췄다(게이트 19 · 23 · 30행, 분석 엔진 249행, 스톱워치 233행, 공용 창 49행, 저장 함수 26~185행, 큰 함수 21~791행). 화면 재현은 다시 하지 않았다 — 각 REQ 의 작업자 측정을 가리켰다.

## 5. [원칙 ⑤] 절차

1. 근거 위치를 모은다 → `remaining.md`.
2. 대장에서 「확인 못 함」 항목을 뽑는다 → `not-confirmed.md`.
3. 표에 줄을 넣는다 → 주장 파일을 만든다.

## 6. [원칙 ⑥] 절차 재검증

- 주장 파일의 문장이 지금 파일에 글자 그대로 있다(`render-rows.cjs` 가 스스로 확인).

## 7. [원칙 ⑦] 단계별 실행 결과

<!--SUMMARY_LINE-->「결심 대기」 표에 여섯 줄을 올렸다. 근거는 `reports/TASK-ES-691/remaining.md` · `not-confirmed.md` 에 있다.<!--/SUMMARY_LINE-->

- **못 잰 것**: 결함 후보 4 · 5(저장 함수의 try 없음 · focusin 수신기 누적)는 코드만 읽었다. 화면에서 무엇이 달라지는지는 재지 않았다.

## 8. [원칙 ⑧] 막힐 지점 예상

- 완료 기록 PR 이 먼저 병합돼야 한다(같은 표) → 그 뒤에 main 을 합쳐 올린다.
- 마지막 정리 적용 PR 뒤에 대장이 다시 만들어지면 「확인 못 함」 항목 수가 바뀔 수 있다 → `not-confirmed.cjs` · `render-rows.cjs` 를 다시 돌린다.
