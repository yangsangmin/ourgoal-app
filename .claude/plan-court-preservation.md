# [작업계획서] 동작 보존 분열 전용 법정 판정 경로 구현 (Court Preservation Route)

- **공통 TASK_ID**: `OURGOAL-AGY-SPLIT-RUN-20261006`
- **전용 작업트리**: `C:/Users/HP/.codex/worktrees/court-preservation/ourgoal-app` (origin/main 기준 생성)
- **작업 계획서 정본**: `.claude/plan-court-preservation.md` (root 계획서/원장/task-link 원격 수정 0)
- **역할 분담**: Antigravity flash(구현 및 실측) · Codex(독립 검토, PR 개설, 최종 법정 심사)
- **사용자 직접 승인 범위**: 동작 보존 분열에 한정한 금고 변경 승인 · 헌법 개정 승인 (승인선 5대 영역 외 임의 확대 0, 기존 fix/new 기준 및 승인선 엄격 보호)
- **기준 PR / Head**: PR #846 (`c052e0fea4573f64f0b914d7219d2a6fdb5c4d7c`)
- **수정 허용 파일**:
  - `court/claims.js`, `court/judge.js`, `court/chat.js`, `court/report.js`, `court/lib/preserve.js` 및 법정 내부 모듈
  - `AGENTS.md`, `CLAUDE.md`, `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md` (커널 3사본 일치)
  - `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`
  - `docs/rules/CONSTITUTION_VERSIONS.md`
  - `docs/rules/archive/AGENTS_KERNEL_v2026.10.06-SNOWBALL.md`
  - `docs/specs/REQ-COURT-PRESERVATION.md`
  - `reports/court-preservation/**`
  - `.claude/plan-court-preservation.md`
  - `dev_log.md` (말미 추가)
  - `index.html` / `js/**` 제품 변경 0, 기존 `tests/**` 단언/기대값 변경 0, git config 변경 0, package scripts/workflows/hooks 변경 0.

---

## 1. 착수 전 5단 추론 (MODE_0)

1. **이해 (Understand)**
   - **무엇을**: 독립 법정(Court)에 `change: preserve` 및 결과 `보존됨`(PRESERVED) 전용 판정 경로를 신설하고, 헌법 커널과 법령 전문에 보존 전용 보증 및 병합 요건을 정합하게 추가한다.
   - **왜**: PR845와 TASK-ES-582 등 파일 분열(세포 분열/이전) 작업은 기존 동작 0 변경이 본질이므로 기준 커밋(base)과 작업 커밋(head)에서 동일 시나리오가 모두 통과함. 그러나 현행 법정은 base 통과 시 `NOTHING_TO_FIX`(고칠 게 없었음) 및 `meetsFloor=false`로 처리하여 '확인 부족'을 내리고, 위임 병합(`MERGE_GATE`)도 이를 허용하지 않아 정직한 심사가 불가능했음.
   - **완료 기준**:
     - 기존 fix/new의 4 truth 조합(base-fail/head-pass, base-pass/head-pass, base-fail/head-fail, base-pass/head-fail) 및 증상단계, 공허시나리오, 시간부족, 도구오류, 철회 재심사 판정이 100% 동일함.
     - preserve 주장이 유효·비공허 시나리오, 기준 2회 / 작업 1회 실행, 양쪽 행동 증명(`provesBehavior`), 실효 하한(L3 이상), CELL_SPLIT_PROOF 검증(토큰 동일, 원문 잔여 동일, 접두 누수 0, 모듈 로드/부팅 회귀 0, 시험 회귀 0, 단계별 DOM/스토리지/콘솔/토스트 동등성)을 법정이 독립 검증하여 충족 시 `보존됨` 및 `'동작 보존 확인'` 버킷으로 승격 판정.
     - 기준 실패/작업 실패/시간 부족/도구 오류/증거 누락/변조 시 절대 `보존됨`으로 승격되지 않고 확인부족/돌려보냄 유지.
     - 헌법 3사본 100% 일치, 이전 원문 아카이브 보존, 버전 대장 승인 출처 기재, `node court/appendix.js --check` 통과.
     - 제품 코드 변경 0.

2. **분류 (Classify)**
   - **유형**: 탐색 / 새 유형 (다) — `preserve` (동작 보존 분열 전용 법정 경로).
   - **가까운 유형**: `behavior new/fix` (기존 동작 시험) 및 `CELL_SPLIT_PROOF` (분열 증명 하한).
   - **안 맞는 점**: `fix`는 기준 실패 필수, `new`는 기준 미존재/실패 필수. `preserve`는 기준과 작업 모두 정상 통과 및 동등성이 필수이며, 단순 양쪽 passed만으로는 전앱 보존을 증명하지 못하므로 CELL_SPLIT_PROOF 결합 검증이 요구됨.

3. **예측 (Predict)**
   - **병목 1**: NOTHING_TO_FIX를 일괄 통과로 바꾸면 기존 fix/new의 결함 미수정/공허 주장이 통과되는 치명적 회귀 발생 -> `change: preserve` 전용 분기로 엄격 격리.
   - **병목 2**: 작업자가 제출한 임의의 JSON/boolean 성공 선언만 믿으면 가짜 증명 위험 -> 법정이 실제 시나리오를 직접 3회(기준2/작업1) 실행하고, underlying proof 데이터(토큰 카운트, 단계별 DOM 매치, 민감도 감지)를 직접 검증.
   - **병목 3**: 헌법 3사본 불일치 또는 버전 대장 형식 오류 -> `court/appendix.js --check` 기계적 검증 선행.

4. **반론 (Counter-arguments)**
   - **반론 1**: "WORK-REFERENCE L005처럼 NOTHING_TO_FIX일 때 병합 예외를 두면 헌법이나 법정 코드를 건드릴 필요 없지 않은가?"
     - **격파**: L005는 헌법 `MERGE_GATE` 및 법령 제7조 제10항과 충돌함. 법정이 '고칠 게 없었음'이라고 불충분 판정을 내린 것을 규범 외적으로 병합하는 것은 위헌이며 신뢰성을 훼손함. 상민님의 명시적 승인 하에 법정과 헌법에 정식 `preserve` 경로를 마련하는 것이 유일하게 정직한 해결책임.
   - **반론 2**: "분열 작업의 모든 DOM/스토리지/AST 전체를 법정 단일 프로세스에서 매번 처음부터 다시 렌더링·비교하면 타임아웃 예산을 초과하지 않는가?"
     - **격파**: 법정은 화면 시나리오를 실제 브라우저에서 기준 2회·작업 1회 직접 실행하여 양쪽 동작 및 행동 증명을 독립 측정하고, 정밀 분열 증거는 작업자가 제출한 원시 증거(`proof.json`, `ui-compare.json`, `verify-inline-hard.json` 등)의 세부 원시 배열·카운트·민감도 탐지 실재를 법정 내부 검증기(`court/lib/preserve.js`)가 기계 검증하되, 작업자의 단순 boolean/요약문("ALL PASS")은 배제함.

5. **선택 (Select)**
   - 1. REQ 명세(`docs/specs/REQ-COURT-PRESERVATION.md`)에 8원칙과 구체 식별자 배선.
   - 2. `shared-learning.js bootstrap` 브리프 생성 및 학습 연동.
   - 3. 검증 선행 설계: 구버전 fix/new 4조합 회귀 방지 및 신규 preserve 4조합/예외 케이스 테스트 스위트 작성.
   - 4. Court 금고 모듈 구현: `court/claims.js`, `court/judge.js`, `court/chat.js`, `court/report.js`, `court/lib/preserve.js`.
   - 5. 헌법 정합성 개정: 아카이브 생성, 커널 3사본 및 법령 전문 개정, 버전 대장 갱신.
   - 6. 전경 테스트 및 자가시험 전수 통과 확인 (`appendix.js`, `selftest/**`).
   - 7. 증거 매니페스트 및 `final.json`, `dev_log.md` 작성 후 Codex에 PR 청구 인계.

---

## 2. 문제해결 8원칙 배선 (REQ-COURT-PRESERVATION)

- **① 문제 파악**: PR845 C1 claim(`change: new`)이 base/head 모두 통과했으나 `NOTHING_TO_FIX`로 반환되어 `meetsFloor: false` 및 '확인 부족' 발생. 분열의 동작 0 보존을 표현하고 판정할 법정 경로 부재.
- **② 본질/원인 구분**: 증상은 `meetsFloor: false`이나, 본질은 법정 규범(claims schema, judge rollup, 헌법 커널 제7조 제10항)이 "실패 -> 성공" 단일 보증 모델에 묶여 있어 동작 보존 분열을 정직하게 수용하지 못함.
- **③ 해결 후보**:
  - A안: NOTHING_TO_FIX를 통과로 간주 (기각: fix/new의 미수정 허위 통과 회귀).
  - B안: `change: preserve` 및 `보존됨` 신설 + 3회 실행(기준2/작업1) + CELL_SPLIT_PROOF 독립 검증 + 헌법/법령 정합 개정 (채택: 유일한 정직한 해법).
- **④ 재검토**: 기존 fix/new 시험에 영향 0인지, 위조된 boolean 통과를 차단하는지, 타임아웃 예산 내인지 검증.
- **⑤ 절차 기록**: 계획서 및 REQ 문서에 5단계 상세 실행 절차 수록.
- **⑥ 절차 재검증**: 사전 반론 격파 및 실패 지점(기준 흔들림, 증거 누락, 변조 등)에 대한 방어책 수립.
- **⑦ 단계별 실행**: 1단계부터 5단계까지 측정 기반 순차 집행.
- **⑧ 막힐 지점 예측 및 성과 측정**: 이전 커널 아카이브 누락 방지, 3사본 1글자 일치, `node court/appendix.js --check` 종료 코드 0 측정.

---

## 3. 세부 실행 계획 및 체크리스트

### [1단계: 사전 분석 및 REQ / 학습 연동]
- [x] WORK-REFERENCE, 지시함, PRESERVATION-COURT-DECISION.md, preservation-court-review.md 정독 완료.
- [x] `docs/specs/REQ-COURT-PRESERVATION.md` 작성 (8원칙, 구체 식별자 배선 완료, 38/38 게이트 통과).
- [x] `reports/court-preservation/participants.json` 생성.
- [x] `node C:/dev/agent-knowledge/shared-learning.js bootstrap` 실행 및 브리프 생성.

### [2단계: 검증 테스트 선행 설계]
- [x] 구버전 fix/new 4조합 회귀 방지 단위 테스트 설계 (`court/selftest/unit-preserve.js`).
- [x] 신규 preserve 4조합 (양쪽통과+증명충족, 작업실패, 기준실패, 양쪽실패) 및 변이/누락/공허/도구오류 단위 테스트 설계 (`court/selftest/unit-preserve.js`).
- [x] `court/selftest/unit.js`에 `unit-preserve.js` 등록 완료.

### [3단계: Court 금고 및 판정기 구현]
- [x] `court/claims.js`:
  - `CHANGES`에 `'preserve'` 추가.
  - `OUTCOME.PRESERVED = '보존됨'` 추가.
  - `judgeClaim`에 `claim.change === 'preserve'` 분기 구현 (기준2회/작업1회, 양쪽 provesBehavior, meetsFloor, CELL_SPLIT_PROOF 검증, runner 주입 지원).
  - `rollup`에 `'동작 보존 확인'` 버킷 추가.
- [x] `court/lib/preserve.js` 신설 (독립 CELL_SPLIT_PROOF 검증 엔진: 토큰 동일, 원문 잔여 동일, 접두누수0, 단계별 DOM/스토리지/콘솔/토스트 일치, 민감도 감지 검증).
- [x] `court/judge.js`:
  - `REHEARD_OK`에 `OUT.PRESERVED` 추가.
  - `OK_BUCKETS`에 `'동작 보존 확인'` 추가.
  - 헤드라인/보증 문구에 보존 전용 및 혼합 문구 추가.
- [x] `court/report.js`:
  - `distributionLine`에 `'동작 보존 확인'` 순서 추가.
  - `claimBlock`에 보존 전용 보증 문구 분기 추가 (`SCOPE_PRESERVE_NOTICE`).
- [x] `court/chat.js`:
  - `BUCKET_PRESERVED = '동작 보존 확인'` 추가 및 `cleared` 함수에 반영.
  - 모듈 export에 `BUCKET_PRESERVED` 추가.

### [4단계: 헌법 커널 3사본 및 법령 전문 정합성 개정]
- [x] 이전 커널 아카이브 복사: `docs/rules/archive/AGENTS_KERNEL_v2026.10.06-SNOWBALL.md`.
- [ ] 커널 3사본 동일 개정 (`AGENTS.md`, `CLAUDE.md`, `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md`):
  - 버전 표기: `v2026.10.07-PRESERVATION`
  - 제7조 제10항 제9호 대응 보증 범위에 preserve 보증 추가.
  - `MERGE_GATE`에 preserve 보존 완료 병합 요건 명시.
- [ ] 법령 전문 `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` 개정:
  - 제7조 제10항 제9호 및 제5호에 preserve 보존 판정 기준 추가.
- [ ] 버전 대장 `docs/rules/CONSTITUTION_VERSIONS.md`에 새 버전 행 및 승인 출처 추가.
- [ ] `node court/appendix.js --check` 실행하여 무결성 100% 검증.

### [5단계: 실측 검증, 증거 매니페스트, dev_log 및 보고]
- [ ] `unit-preserve.js` 픽스처 mock shape 보완 및 `node court/selftest/run.js --unit-only` 40/40 전원 통과.
- [ ] `node court/selftest/run.js` 전체 자가시험 전경 실행.
- [ ] 회귀 방지 및 신규 preserve 테스트 전수 통과 실측.
- [ ] `reports/court-preservation/evidence-manifest.json` 및 `final.json` 작성.
- [ ] `dev_log.md` 말미에 작업 이력 추가.
- [ ] `node C:/dev/agent-knowledge/shared-learning.js validate` 및 `collect` 실행.
- [ ] Codex가 PR 개설 및 최종 심사할 수 있도록 상태 정돈.

---

## 6. 모델 인계 체크포인트 (Model Handoff Checkpoint)
- **인계 시점**: 2026-10-07T04:39:00+09:00
- **인계자**: Antigravity Flash (편집 종료 및 체크포인트 보존 완료)
- **인수자**: Gemini 3.1 Pro High
- **현재 상태 요약**:
  1. `docs/specs/REQ-COURT-PRESERVATION.md`: 작성 및 게이트 38/38 전수 통과 완료.
  2. Court 판정기 코어 구현 완료 (`claims.js`, `judge.js`, `chat.js`, `report.js`, `lib/preserve.js`).
  3. `court/selftest/unit-preserve.js` 작성 및 `unit.js` 연동 완료.
  4. 단위 시험 측정: `node court/selftest/run.js --unit-only` 실행 결과 35/40 기대대로 통과 (기존 35개 단위 시험 무결, 신규 `unit-preserve.js` 5개 시험에서 mock 픽스처 인자 shape 불일치 확인).
  5. 차기 담당(Gemini 3.1 Pro High) 첫 행동: `unit-preserve.js` mock 픽스처 형상 일치화 -> 40/40 통과 -> 헌법 3사본 및 버전대장 정합성 갱신.
