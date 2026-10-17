# [REQ-TASK-ES-CONST-LIFECYCLE1-4022560a] 헌법 `<lifecycle>` 1호(추가) 1줄 보완 단독 초안 PR

- **작업 ID**: `TASK-ES-CONST-LIFECYCLE1-4022560a`
- **공통 task_id**: `TASK-CC-ECOSYSTEM-4022560a`
- **기준 작업참고**: `기준 PR #975` (`3a02bec793ec8e99d58ce7dccaa0703671d2c8c8`, 경험칙 131개, L044·L107·L108 헌법 개정 초안 패킷 절차)
- **원격 기준 커밋(`origin/main`)**: `582eed2a16935c59a905eb77c46aed4f8e29ea43`
- **새 커널 버전 초안**: `v2026.10.17-LIFECYCLE-REPLACE` (상민님의 명시적 `"헌법 개정 승인"` 및 본 초안 PR의 원격 `main` 병합 전까지 효력 없음 · `efficacy=false`)
- **제품 코드 변경**: `0줄` (제품 파일·지시함·시험지·법정/게이트 코드 일체 변경 없음)

## 상민님 지시 원문 및 항목별 대응 (헌법 제2조 제2항)

> 원문:
> "1. 결심 범위가 부풀려져 있습니다. 1~5단계(인계, 재검증, 화면 융합, 버그 수리 PR, 신기능 분리)는 승인선 다섯 가지 어디에도 걸리지 않습니다. 전역 지침상 묻지 말고 해야 하는 일입니다. 실제로 결심이 필요한 것은 헌법 한 줄뿐입니다. 그런데 헌법은 동결 파일이라 제품 코드와 한 PR에 섞을 수 없습니다. 그러니 문안을 별도 PR로 올리게 하고, 그 문장을 보신 뒤에 "헌법 개정 승인"을 주시는 게 맞습니다."
> "진행. 추가로 지난 6개 조건에 더해: 7) S-02 ... DIR-006 인계 목록에 넣어라. 8) DIR-006 담당 세션 ... 확인하라. 9) G-01 융합 전에 성소 화면과 옛 화면의 기능을 표로 대조하라 ... 10) wave2 브랜치는 병합 보류만 하고 지우지 마라."

- **원문 대응**:
  - 본 단독 초안 PR은 위 지시 중 **조건 6("헌법은 동결 파일이라 제품 코드와 한 PR에 섞을 수 없으므로 문안을 별도 PR로 올려 상민님이 그 문장을 직접 보신 뒤에 `헌법 개정 승인`을 결정하실 수 있게 하라")**만 전담한다.
  - 조건 1~5 및 7~10(인계문 작성, `G-01` 기능 대조표, `origin/main` 135건 재검증, 비저장 P0 수리 PR)은 별도 워크트리(`C:\dev\wt\ourgoal-p0-clean-4022560a`)에서 분리 수행하며 본 PR에 제품 코드를 1줄도 섞지 않는다.

## 5단 추론 블록 (이해 - 분류 - 예측 - 반론 - 선택)

1. **이해**: `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md` 319행 `<lifecycle>` 1호(`추가`)의 *"기존 세포 코드는 고치지 않는다"* 문구가, 기존 화면과 같은 자리를 대신하는 새 화면을 만들 때에도 옛 화면 위에 덧대어 2중 렌더링(`G-01`)을 유발하는 오해 소지가 있었다. 이를 막기 위해 `<lifecycle>` 1호 끝에 단 한 문장(**`같은 자리를 대신하는 새 화면은 덧대지 말고 융합 절차로 대체한다.`**)을 보완하는 단독 초안 PR을 올린다.
2. **분류**: **표준 (L044·L107·L108 헌법 개정 초안 패킷)** — 커널 정본(`01_OURGOAL_SUPREME_CONSTITUTION_FULL.md`) + 법령 전문 머리(`docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`) + 버전 대장 새 행(`docs/rules/CONSTITUTION_VERSIONS.md`) + 직전 커널 아카이브(`docs/rules/archive/AGENTS_KERNEL_v2026.10.14-DIR006-SAVE.md`)를 한 묶음으로 맞추고 `node court/appendix.js --check 01_OURGOAL_SUPREME_CONSTITUTION_FULL.md` 정합성을 검증한다.
3. **예측**: 먼저 준비 문서로 Draft PR을 열어 실제 PR 번호를 확보한 뒤 버전 대장 마지막 행에 그 실제 PR 번호를 기입해야 `node court/appendix.js --check`의 `PR #숫자` 검사를 통과한다. 또한 `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md`는 금고(`court/vault.json` 동결) 파일이므로 법정 판정은 `"확인 부족(금고 변경)"`이 나오며, 상민님의 명시적 `"헌법 개정 승인"` 전에는 절대 병합하지 않는다.
4. **반론**:
   - *반론 1*: 포인터 파일(`AGENTS.md`, `CLAUDE.md`)도 함께 고쳐야 하는가?
     → *격파*: `v2026.10.10-CORE` 개정(PR #879) 이후 커널 정본은 `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md` 하나이며, `AGENTS.md`와 `CLAUDE.md`는 포인터로서 개정 때 바뀌지 않는다(`court/appendix.js:118-147`).
   - *반론 2*: 제품 수리 PR과 한 PR에 넣으면 안 되는가?
     → *격파*: 금고(동결) 파일과 제품 코드를 한 PR에 섞으면 위임 병합이 불가능해지고 심사가 뒤섞인다. 제품 코드 0줄의 단독 초안 PR로 분리해야 상민님이 문안 한 줄만 명확히 보고 결심하실 수 있다.
5. **선택**: 제품 코드 변경 0줄로 `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md` 319행 `<lifecycle>` 1호에 한 문장만 추가하고, 버전 정합 묶음(`v2026.10.17-LIFECYCLE-REPLACE`)을 맞춰 단독 초안 PR로 상정한다.

---

## 1. [원칙 ①] 문제 정확히 파악

현행 헌법 커널 정본(`01_OURGOAL_SUPREME_CONSTITUTION_FULL.md:319`)의 `<lifecycle>` 1호는 다음과 같다:
- **변경 전(As-Is)**:
  `1. 추가 [결정: 작업 세션] — 새 기능은 새 세포로: \`node scripts/new-module.js 탭 이름 [--provides 영역.동작] [--contributes 자리]\` → 신고서 → 자리에 기여 → 신호에 반응. 기존 세포 코드는 고치지 않는다.`
- 바로 아래 321행(3호 `융합`)에 *"같은 일을 하는 세포가 여럿이면 하나로 합쳐 능력으로 제공하고 나머지는 그 능력을 요청한다"*가 있음에도, 작업 세션이 새 화면(예: 성소 V3 화면)을 만들 때 1호의 *"기존 세포 코드는 고치지 않는다"*만 기계적으로 적용하여 옛 화면 위에 새 화면을 덧대어 그리는 2중 렌더링(`G-01`)이 발생했다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 세포 생명주기 규칙(`<lifecycle>`)에서 '새 기능 추가(1호)'와 '기존 화면 대체·통합(3호 융합)'의 경계를 오해 없이 명확히 하는 것.
- **원인**: 1호 `추가` 조항 끝에 "기존 세포 코드는 고치지 않는다"만 적혀 있어, 같은 자리를 대신하는 새 화면까지 기존 화면을 둔 채 덧대게 만드는 유인이 있었음.
- **중심**: `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md` 319행 `<lifecycle>` 1호 문장 끝에 단 한 문장을 보완하되, 기존 1~15조 및 승인선·판정 분리·금고 규칙은 단 한 글자도 훼손하지 않는 최소 개정.
- **핵심**: 제품 코드 0줄인 단독 초안 PR로 정확한 문안 diff를 상민님께 제시하고, 상민님의 명시적 `"헌법 개정 승인"` 전에는 병합하지 않는 것.

## 3. [원칙 ③] 해결방식

`01_OURGOAL_SUPREME_CONSTITUTION_FULL.md:319` (`<lifecycle>` 1호) 끝에 아래 한 문장만 추가한다:
- **추가할 문장(Exact Wording)**:
  > `같은 자리를 대신하는 새 화면은 덧대지 말고 융합 절차로 대체한다.`
- **변경 후(To-Be, 319행 전문)**:
  > `1. 추가 [결정: 작업 세션] — 새 기능은 새 세포로: \`node scripts/new-module.js 탭 이름 [--provides 영역.동작] [--contributes 자리]\` → 신고서 → 자리에 기여 → 신호에 반응. 기존 세포 코드는 고치지 않는다. 같은 자리를 대신하는 새 화면은 덧대지 말고 융합 절차로 대체한다.`

## 4. [원칙 ④] 재검토

- 기존 조문 삭제: `0건`
- 승인선·판정 분리·금고·시험지 완화: `0건`
- 제품 코드(`index.html`, `js/**`, `ui.css`, `api/**`) 변경: `0줄`
- 헌법 제14조 제3항에 따른 버전 정합 대상:
  1. `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md`: 첫 줄·5행·12행 버전 코드를 `v2026.10.17-LIFECYCLE-REPLACE`로 갱신하고 319행에 한 문장 추가.
  2. `docs/rules/archive/AGENTS_KERNEL_v2026.10.14-DIR006-SAVE.md`: 직전 커널(`origin/main` `582eed2a`의 `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md`) 원문을 바이트 그대로 보존.
  3. `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`: 머리의 `현행 커널 버전`을 `v2026.10.17-LIFECYCLE-REPLACE`로 맞추고 `직전 커널 버전`에 `v2026.10.14-DIR006-SAVE` 이력을 보존(전문 본문 조문 변경 0).
  4. `docs/rules/CONSTITUTION_VERSIONS.md`: 마지막 행에 `v2026.10.17-LIFECYCLE-REPLACE` 초안 행(본 Draft PR 번호 및 `상민님 헌법 개정 승인 대기 · 원격 main 병합 전 효력 없음` 명시)을 추가.

## 5. [원칙 ⑤] 절차

1. 본 `REQ` 및 `.claude/plan-TASK-ES-CONST-LIFECYCLE1-4022560a.md`, `reports/TASK-ES-CONST-LIFECYCLE1-4022560a/claims.json`을 먼저 커밋·푸시하여 GitHub 초안 PR 번호를 발급받는다.
2. 직전 커널 원문을 `docs/rules/archive/AGENTS_KERNEL_v2026.10.14-DIR006-SAVE.md`로 복사 보존한다.
3. `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md`, `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`, `docs/rules/CONSTITUTION_VERSIONS.md`(발급받은 실제 PR 번호 기재)를 갱신한다.
4. `node court/appendix.js --versions` 및 `node court/appendix.js --check 01_OURGOAL_SUPREME_CONSTITUTION_FULL.md`를 실행하여 `ok: true`를 실측 확인한다.
5. 커밋·푸시 후 PR 본문을 5대 고정 블록으로 갱신하고, 상민님께 문안 diff를 보고하여 `"헌법 개정 승인"` 결심을 여쭌다.

## 6. [원칙 ⑥] 절차 재검증·반론 격파

- **재검증 1**: `AGENTS.md`와 `CLAUDE.md`를 수정하지 않아도 `node court/appendix.js --versions`를 통과하는가? → `court/appendix.js:141-147` 확인 결과, 포인터 파일은 `<system_kernel`이 없고 `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md` 경로를 포함하면 통과하며 개정 시 바뀌지 않는 것이 규칙이다.
- **재검증 2**: 승인 전에 버전 대장에 행을 추가할 때 승인을 사칭하지 않는가? → 버전 대장 행에 **"초안 PR #번호 상정 · 상민님 명시적 「헌법 개정 승인」 대기 중 · 원격 main 병합 전 효력 없음(efficacy=false)"**이라고 정직하게 명시한다.

## 7. [원칙 ⑦] 단계별 실행

- Worktree: `C:\dev\wt\ourgoal-const-lifecycle1-4022560a` (`docs/2026-10-17-const-lifecycle-addition-4022560a`)
- 수정 파일:
  - `01_OURGOAL_SUPREME_CONSTITUTION_FULL.md`
  - `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`
  - `docs/rules/CONSTITUTION_VERSIONS.md`
  - `docs/rules/archive/AGENTS_KERNEL_v2026.10.14-DIR006-SAVE.md`
  - `docs/specs/REQ-TASK-ES-CONST-LIFECYCLE1-4022560a.md`
  - `.claude/plan-TASK-ES-CONST-LIFECYCLE1-4022560a.md`
  - `reports/TASK-ES-CONST-LIFECYCLE1-4022560a/claims.json`

## 8. [원칙 ⑧] 막히는 지점 예상·성과 측정

- **막힐 지점**: 로컬 git commit 시 `.githooks/pre-commit`이나 게이트가 금고 파일(`01_OURGOAL_SUPREME_CONSTITUTION_FULL.md`) 수정을 경고/차단할 수 있음 → 실제 커밋 명령으로 확인하고, 정합성 도구(`node court/appendix.js --check 01_OURGOAL_SUPREME_CONSTITUTION_FULL.md`) 출력값을 그대로 기록한다.
- **성과 측정**:
  - `node court/appendix.js --versions` → `ok: true`
  - `node court/appendix.js --check 01_OURGOAL_SUPREME_CONSTITUTION_FULL.md` → `ok: true`
  - 제품 코드 변경 파일 수: `0`
