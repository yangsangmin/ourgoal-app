# 요구사항 정의서 (REQ) — 동작 보존 분열 전용 법정 판정 경로 (REQ-COURT-PRESERVATION)

> **문서 ID**: REQ-COURT-PRESERVATION  
> **공통 TASK_ID**: `OURGOAL-AGY-SPLIT-RUN-20261006`  
> **티켓 연계**: #TASK-ES-582, #TASK-ES-585 (PR #845 심사 정합성)  
> **작성 일시**: 2026-10-07  
> **작성자**: Antigravity flash (구현 및 실측 담당) / Codex (독립 검토 및 심사 담당)  
> **최고결정권자 승인**: 동작 보존 분열에 한정한 금고 변경 승인 · 헌법 개정 승인 (2026-10-06 / 2026-10-07 KST 상민님 직접 승인, Codex 대화 `01a10f06-5882-7641-a481-d829be6a3447`)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > "목표: 동작 보존 분열 전용 법정 판정 경로를 구현해 대기 중인 PR845와 TASK582를 정직하게 심사할 수 있게 한다. 실제 Antigravity flash가 구현·측정을 담당하고 Codex는 핵심 독립 검토·PR·최종 법정을 담당한다. 사용자 직접 승인: 동작 보존 분열에 한정한 금고 변경 승인·헌법 개정 승인. 승인 범위를 확대하지 않는다. 기존 fix/new 기준과 승인선은 그대로 보호한다. 작업전용 경로 C:/Users/HP/.codex/worktrees/court-preservation/ourgoal-app."
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - PR #845 (TASK-ES-585, `09fbd1e1d4c30ec48cc25b0d9699f8db18c079d0`) 법정 심사(F9AB1A43, Run 37511241785)에서 C1 주장은 base와 head 모두 실제 사용자 게스트 화면 시나리오를 통과하고, achieved L3, floor L3를 충족하였음.
  - 그러나 현행 `court/claims.js`는 `CHANGES = ['fix', 'new']`만 허용하고, `B.passed`일 때 무조건 선행 반환(early return)하여 outcome을 `NOTHING_TO_FIX`(고칠 게 없었음)으로 판정함.
  - `court/judge.js`에서 `NOTHING_TO_FIX`는 `OK_BUCKETS`에 포함되지 않아 `lacking`으로 분류되고, 최종 판정이 '확인 부족'(`meetsFloor: false`)으로 강등됨.
  - 헌법 `MERGE_GATE`는 '고칠 게 없었음'을 병합 허용 사유로 인정하지 않음 (반면 비공식 경험칙 `WORK-REFERENCE.md` L005는 'NOTHING_TO_FIX 병합 가능'으로 규정하여 헌법과 정면 충돌함).
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 세포 분열(파일 쪼개기/이전)은 버그까지 그대로 옮기는 동작 0 변경(behavior preservation) 작업임에도, 현행 법정은 기준 커밋 실패 -> 작업 커밋 성공(`fix`/`new`)의 차등 개선 모델만을 지원하여 정상 분열 작업을 판정할 경로가 완전히 단절됨.
  - **2층 (구조/프로세스 부재)**: 헌법 제7조 제10항 제9호와 `MERGE_GATE`에 '동작 보존'에 대한 보증 정의와 병합 요건이 부재하여, 비공식 경험칙(L005)의 편법 병합이 시도되거나 합격한 분열 작업이 영구 정체됨.
  - **3층 (시스템/유저 체감 괴리)**: 실제로 게스트 화면 동작이 완벽히 보존되었음에도 '확인 부족'으로 표시되어 작업자가 억지로 불필요한 기능 수정을 하거나 '가짜 통과'를 조작하려는 유혹에 노출됨.
- **사용자 상황 및 페르소나**: 대규모 모놀리스 `index.html`을 안전하게 세포 분열하는 개발자 및 이를 심사하는 GitHub 법정.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `INFRA` (법정 심사 체계 및 헌법 무결성 확장)
- **[본질] (Essence)**:
  - 세포 분열(Module Split) 작업의 본질은 기능 변경이나 버그 수정이 아니라, **"기준 커밋의 동작이 작업 커밋에서도 결함 없이 온전히 보존(Preserved)되었는가"**를 기계적으로 증명하고 보증하는 것이다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (단일 실패->성공 모델 가정)**: `court/claims.js`가 `fix`와 `new`만을 상정하고 `B.passed === true`인 경우를 즉시 `NOTHING_TO_FIX`로 조기 종료함.
  2. **원인 2 (보존 검증 엔진 및 증거 체계 부재)**: 단순 양쪽 통과(passed)만으로는 부팅 회귀, 토큰 누수, 스토리지 오염을 걸러낼 수 없는데, 이를 독립 검증하는 `CELL_SPLIT_PROOF` 연동 법정 검증 엔진이 부재했음.
  3. **원인 3 (헌법과 경험칙의 규범 충돌)**: 비공식 문서 L005는 편법 병합을 허용하려 했으나, 헌법 불변층 `MERGE_GATE`는 이를 거부하여 명시적 헌법 개정 없이는 심사가 불가능한 교착 상태에 빠짐.
- **[중심] (Core Bottleneck & Anchor)**:
  - `court/claims.js`에 `change: 'preserve'` 및 `OUTCOME.PRESERVED`('보존됨') 결과를 신설하고, 기준 2회 / 작업 1회 3회 실행과 행동 증명(`provesBehavior`), 실효 하한(`meetsFloor`), 토큰열 일치·원문 잔여 일치·단계별 DOM/스토리지 동등성·뮤테이터 민감도를 기계적으로 판정하는 독립 검증 엔진(`court/lib/preserve.js`)을 법정에 직결하는 것.
- **[핵심] (Critical Safety & Termination)**:
  - 기존 `fix` 및 `new` 판정의 4 truth 조합(기준실패/작업성공, 기준실패/작업실패, 기준성공/작업성공, 기준성공/작업실패)과 공허/증상단계/시간부족/도구오류/철회 판정은 **100% 동일하게 불변 보존**되어야 함.
  - 기준실패, 작업실패, 시간부족, 도구오류, 불안정, 증거누락, 입력 SHA 불일치, 실제 DOM/저장/오류 변조는 절대 `보존됨`으로 승격하지 않고 `확인 부족` 또는 `돌려보냄`을 유지해야 함.
  - 상민님 승인 범위를 엄수하여 헌법 커널 3사본과 법령에 보존 전용 보증 및 병합 요건을 좁게 추가함.
- **체감 가설 (User Experience Hypothesis)**:
  > *"PR #845와 TASK-ES-582를 심사할 때, 법정이 '확인 부족'이나 편법 우회가 아니라 '동작 보존 확인 (보존됨)'이라는 정직하고 엄밀한 판정을 내리고, GitHub 법정 고정 댓글에 명확한 보존 보증서가 기록된다."*
- **기존 전체 기능 영향도 분석**:
  - 제품 코드 (`index.html`, `js/**`): 영향도 0 (제품 코드 변경 0건).
  - 기존 테스트 (`tests/**`): 영향도 0 (단언/기대값 변경 0건).
  - 기존 `fix`/`new` 법정 심사: 영향도 0 (기존 38개 자가시험 100% PASS 유지).

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - `NOTHING_TO_FIX`를 전역 통과로 바꾸거나 L005 병합 예외를 비공식 적용하는 행위 금지.
  - 작업자의 boolean(`ok: true`), 요약문("ALL PASS"), 임의 JSON 성공 주장을 무검증 신뢰하는 행위 금지.
  - 582, 585 특정 세포/함수명을 법정에 하드코딩하는 특혜 로직 금지.
  - 제품 코드(`index.html`, `js/**`)나 기존 테스트(`tests/**`)를 임의 수정하는 행위 금지.
- **해야 할 것 (Action)**:
  - 4대 요구사항 식별자(`REQ-CP-01` ~ `REQ-CP-04`)를 명확히 정의하고 법정 및 헌법에 구현.
  - 독립 검증 엔진 `court/lib/preserve.js`를 통해 AST 토큰열 일치, 원문 잔여 토큰 일치, 접두 누수 0, 개별 모듈 로드/부팅 회귀 0, 단계별 DOM/스토리지/콘솔/토스트 동등성, 뮤테이터 민감도를 기계 검증.
- **왜 이 방식이어야만 하는가 (Why this approach)**:
  - 최고결정권자 상민님의 직접 승인에 부합하며, 기존 판정 체계를 훼손하지 않고 동작 보존 분열만을 정직하게 심사할 수 있는 유일한 헌법적 경로이기 때문.

### 3-1. 요구사항 식별자 배선 (REQ Specifications)
- **REQ-CP-01: 주장 스키마 및 판정 결과 신설 (court/claims.js)**
  - `CHANGES` 목록에 `'preserve'` 추가 (`['fix', 'new', 'preserve']`).
  - `claimErrors`: `change: 'preserve'` 시 시나리오 필수, `symptom` 불요.
  - `OUTCOME.PRESERVED = '보존됨'` 신설.
  - `rollup`: `live.some(j => j.outcome === OUTCOME.PRESERVED && j.meetsFloor)` 충족 시 bucket을 `'동작 보존 확인'`으로 집계.
- **REQ-CP-02: preserve 전용 독립 법정 심사 로직 (court/claims.js, court/lib/preserve.js)**
  - 작업 커밋 1회(`H`), 기준 커밋 2회(`B`, `B2`) 실행.
  - `H.passed && B.passed && B2.passed === true` 및 `H.provesBehavior && B.provesBehavior && B2.provesBehavior === true`.
  - 기준 안정성: `B.passed === B2.passed && B.failedStep === B2.failedStep`.
  - 실효 하한: `grade.meets(H.grade, ef.floor) && grade.meets(B.grade, ef.floor)`.
  - 정밀 분열 증거 검증 (`verifyCellSplitProof`):
    - 토큰열 일치(AST Token sequence string equality): 원본 함수 대비 분열 모듈 토큰 일치.
    - 원문 잔여 토큰 일치: 분열 후 모놀리스의 잔여 구조 보존.
    - 접두 누수 0 (`leaksIIFEName.length === 0`), 최상위 `this`/`arguments` 0.
    - 부팅 및 개별 로드 회귀 0 (`court/probes/boot.js`, `court/probes/module-load.js`).
    - 계약별 뮤테이터 민감도 감지: 변조 주입 시 반드시 실패 감지 확인.
- **REQ-CP-03: 법정 총괄 판정 및 고정 댓글 연계 (court/judge.js, court/chat.js, court/report.js)**
  - `court/judge.js`: `OK_BUCKETS`에 `'동작 보존 확인'` 추가, `REHEARD_OK`에 `OUT.PRESERVED` 추가.
  - 헤드라인 및 할 일: 보존 판정 시 '기준 커밋의 동작을 그대로 보존(양쪽 통과·행동 증명·동등성 확인)' 진실 표기.
  - `court/chat.js`: `BUCKET_PRESERVED = '동작 보존 확인'` 추가, `cleared()` 갱신.
  - `court/report.js`: `distributionLine` 및 `claimBlock`에 보존 보증 문구 반영.
- **REQ-CP-04: 헌법 커널 3사본 및 법령 전문 정합성 개정**
  - 커널 `v2026.10.06-SNOWBALL`을 `docs/rules/archive/AGENTS_KERNEL_v2026.10.06-SNOWBALL.md`로 비파괴 아카이브.
  - 커널 3사본 (`AGENTS.md`, `CLAUDE.md`, `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md`): `v2026.10.07-PRESERVATION`, 제7조 제10항 제9호 보존 보증 추가, `MERGE_GATE` 보존 요건 명시. 3사본 100% 동일.
  - 법령 전문 `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`: 제7조 제10항 제5호 및 제9호 개정.
  - 버전 대장 `docs/rules/CONSTITUTION_VERSIONS.md`: 새 버전 및 승인 근거 행 추가.
  - `node court/appendix.js --check` 종료 코드 0 검증.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - 만약 기준 커밋 2회 실행 중 1회라도 flaky하게 실패하면 분열 작업이 억울하게 탈락할 수 있음 -> 이는 거짓 통과를 막기 위한 불가피한 법정 원칙이며, 안정적인 시나리오 작성을 유도하므로 유지함.
  - `CELL_SPLIT_PROOF` 검증이 작업자의 임의 증거 파일에 의존할 위험 -> 법정이 증거 파일의 형식, SHA, 실제 모듈 파일의 물리적 존재 및 AST 파싱을 직접 수행하여 위조를 원천 차단함.
- **기존 기능과의 충돌 가능성 검토**:
  - 기존 `fix` 및 `new`에 대한 판정 로직은 조건 분기(`claim.change === 'preserve'`)로 완벽히 격리되므로 기존 판정에 미치는 영향 0.
- **엣지 케이스 (Edge Cases)**:
  - **시나리오 공허 (`isHollow === true`)**: 즉시 탈락 (`HOLLOW_SCENARIO`).
  - **작업 커밋 실패 (`!H.passed`)**: 즉시 탈락 (`TASK_FAILED`).
  - **기준 커밋 실패 (`!B.passed` 또는 `!B2.passed`)**: 즉시 탈락 (`BASE_FAILED`).
  - **행동 미증명 (`!provesBehavior`)**: 즉시 탈락 (`NO_TEST`).
  - **하한 미달 (`!meetsFloor`)**: 즉시 탈락 (`FLOOR_NOT_MET`).
  - **분열 증거 결함/누락/변조**: 즉시 탈락 (`SPLIT_PROOF_INVALID`).

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. **1단계 (선행 검증 설계)**: 구버전 fix/new 4 truth 회귀 테스트 및 신규 preserve 4 truth 단위 테스트 작성 (`court/selftest/unit-preserve.js`).
  2. **2단계 (법정 코어 구현)**: `court/claims.js`, `court/judge.js`, `court/chat.js`, `court/report.js` 완성.
  3. **3단계 (단위 검증 통과)**: `node court/selftest/run.js --unit-only` 실행하여 100% 통과 확인.
  4. **4단계 (헌법 및 법령 개정)**: 이전 커널 아카이브 -> 커널 3사본 100% 동기화 -> 법령 전문 및 버전 대장 갱신 -> `appendix.js --check` 통과.
  5. **5단계 (전체 자가시험 및 게이트 통과)**: `node scripts/verify-integrity-gate.js` 및 `node court/selftest/run.js` 전체 통과.
  6. **6단계 (증거 산출 및 학습 정리)**: 상태 보고서, 증거 매니페스트, 최종 보고서 작성 및 git 커밋 준비.
- **상태 전파 및 원장 갱신 규격**:
  - `court/claims.js` 판정 결과 -> `court/judge.js` 총괄 버킷 -> `court/report.js` 보고서 -> `court/chat.js` 고정 댓글로 단방향 완전 전파.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**:
  - 법정 실행 중 브라우저 타임아웃이나 도구 오류 발생 시 판정이 비정상 종료될 위험 -> 법정의 기존 예외 포획 및 격리 체계(`toolError`, `timeout`)를 preserve 분기에도 동일하게 적용하여 안전하게 `확인 부족`으로 수렴하도록 보장.
- **가정의 타당성 검증 (반례 및 실측 검증)**:
  - *반례 1*: 작업자가 토큰 수는 맞췄으나 내부 로직을 빈 함수(`function() {}`)로 비운 경우 -> 뮤테이터 민감도 검증 및 실제 사용자 게스트 화면 시나리오 실행에서 즉시 발각되어 탈락함.
  - *반례 2*: 기준 커밋이 네트워크 불안정 등으로 한 번은 성공하고 한 번은 실패하는 경우 -> 기준 2회 실행 안정성 검사(`B1 === B2`)에서 즉시 발각되어 탈락함.
  - *반례 3*: `CELL_SPLIT_PROOF`의 canaries 수가 다른 모듈 분열의 경우 -> 하드코딩된 특정 수치에 의존하지 않고 계약 명세(`claimsDir` 내 증거 파일의 계약 구조 및 AST 토큰열/변조 검증)를 동적으로 파싱하여 범용 검증을 수행함.
- **재검증 결과 도출된 절차 보완사항**:
  - 단위 테스트(`unit-preserve.js`)에 정상 보존 케이스뿐만 아니라 반례 6종(기준실패, 작업실패, 기준불안정, 공허시나리오, 증거누락, 토큰변조)을 모두 포함하여 역방향 방화벽을 물리적으로 입증함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- **메트릭 1**: `node scripts/verify-integrity-gate.js` 100% PASS (0 failure).
- **메트릭 2**: `node court/selftest/run.js --unit-only` 신규 및 기존 단위 테스트 100% PASS.
- **메트릭 3**: `node court/appendix.js --check docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` 종료 코드 0.
- **메트릭 4**: `node court/selftest/run.js` 38개 기존 픽스처 + 신규 픽스처 100% PASS.
- **메트릭 5**: 제품 코드(`index.html`, `js/**`) 및 기존 테스트 단언 diff 0건.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: 헌법 커널 3사본 간 1글자 불일치 발생 시 `appendix.js` 또는 무결성 게이트 탈락 -> **대책**: 하나의 원본을 작성 후 `fs.copyFileSync`로 완전 복제하여 바이트 일치 보장.
- **예상 블로커 2**: `court/selftest/run.js` 전체 실행 시간 과다로 인한 작업 지연 -> **대책**: 먼저 `--unit-only`로 빠른 피드백 루프를 돌리고, 최종 단계에서 전체 자가시험 실행.
- **재검증 트리거**:
  - `verify-integrity-gate.js` 실패 시 -> REQ 및 헌법 조문 서식 즉시 재검토.
  - `court/selftest/run.js`에서 기존 fix/new 테스트 실패 발생 시 -> `court/claims.js`의 preserve 분기 격리성 즉시 재검증.
