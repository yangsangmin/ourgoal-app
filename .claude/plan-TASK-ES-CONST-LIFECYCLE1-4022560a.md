# [PLAN-TASK-ES-CONST-LIFECYCLE1-4022560a] 헌법 `<lifecycle>` 1호(추가) 1줄 보완 단독 초안 PR 실행계획서

- **작업 ID**: `TASK-ES-CONST-LIFECYCLE1-4022560a`
- **공통 task_id**: `TASK-CC-ECOSYSTEM-4022560a`
- **본질(목표 한 줄)**: 제품 코드 변경 0줄로 `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md` 319행 `<lifecycle>` 1호 끝에 *"같은 자리를 대신하는 새 화면은 덧대지 말고 융합 절차로 대체한다."* 한 줄을 보완하는 단독 초안 PR을 상정하고 `court/appendix.js --check` 정합성을 검증한다.

## 2차 8원칙 (PLAN)

### 1. [원칙 ①] 문제 정확히 파악
`<lifecycle>` 1호(`추가`)의 "기존 세포 코드는 고치지 않는다" 문구가 기존 화면을 대체해야 할 때에도 덧대기를 유발할 수 있어, 같은 자리를 대신하는 새 화면은 융합 절차(3호)로 대체한다는 한 문장을 명시해야 한다. 헌법은 동결 파일이므로 제품 코드와 섞지 않고 단독 초안 PR로 분리한다.

### 2. [원칙 ②] 본질·원인·중심·핵심
- **본질**: `<lifecycle>` 1호와 3호(융합)의 경계 명확화.
- **원인**: 1호 문구만 읽고 화면을 덧대는 오해 발생.
- **중심**: `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md:319` 1줄 추가 및 버전 정합 패킷(`v2026.10.17-LIFECYCLE-REPLACE`) 구성.
- **핵심**: 제품 코드 0줄 유지, 상민님 `"헌법 개정 승인"` 전 병합 절대 금지.

### 3. [원칙 ③] 해결방식
1차 커밋으로 Draft PR 번호를 생성한 뒤, 직전 커널(`v2026.10.14-DIR006-SAVE`) 아카이브 + 커널 정본 1줄 추가 + 법령 전문 머리 갱신 + 버전 대장 새 행 추가를 수행하고 `node court/appendix.js --check 01_OURGOAL_SUPREME_CONSTITUTION_FULL.md`를 통과시킨다.

### 4. [원칙 ④] 재검토
포인터(`AGENTS.md`, `CLAUDE.md`)와 제품 코드, 시험지, 지시함은 건드리지 않는다.

### 5. [원칙 ⑤] 절차
1. `REQ`/`PLAN`/`claims.json` 작성 및 초안 PR 오픈
2. `docs/rules/archive/AGENTS_KERNEL_v2026.10.14-DIR006-SAVE.md` 보존
3. 커널·법령 전문 머리·버전 대장 갱신 및 `appendix.js --check` 검증
4. 푸시 및 문안 diff 보고

### 6. [원칙 ⑥] 절차 재검증·반론 격파
- *반론*: 버전 코드를 안 바꾸고 319행만 고치면 안 되는가?
- *격파*: 헌법 제14조 제3항 및 버전 관리 4대 불변 원칙(비파괴 아카이브 원칙, 단일 위계 동기화 원칙)에 따라 커널 조문 변경 시 직전 커널 아카이브와 버전 갱신 묶음을 함께 담아야 이력이 추적된다.

### 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제1항: 4단계 심사 청구까지만 기록)
- [x] **[1단계: 요구사항 정의]** `docs/specs/REQ-TASK-ES-CONST-LIFECYCLE1-4022560a.md` 작성 완료 · 예상 3분 · 완료 기준: 지시 원문 및 8원칙 완비
- [x] **[2단계: 실행계획 수립]** `.claude/plan-TASK-ES-CONST-LIFECYCLE1-4022560a.md` 작성 완료 · 예상 3분 · 완료 기준: 2차 8원칙 및 체크리스트 완비
- [ ] **[3단계: 규범 초안 작성 및 정합 검증]** 직전 커널 아카이브 + `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md:319` 1줄 보완 + `node court/appendix.js --check` 실행 · 예상 5분 · 완료 기준: `ok: true` 및 제품 코드 diff 0줄 확인
- [ ] **[4단계: 심사 청구 (초안 PR)]** GitHub 단독 Draft PR 생성 및 상민님 결심 대기 보고 · 예상 5분 · 완료 기준: Draft PR URL 및 문안 diff 제시 완료

### 8. [원칙 ⑧] 막히는 지점 예상·성과 측정
- `node court/appendix.js --check 01_OURGOAL_SUPREME_CONSTITUTION_FULL.md`가 `{"ok": true, "mismatches": []}`를 반환하는지로 측정한다.
