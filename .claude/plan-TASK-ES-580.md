# TASK-ES-580 작업계획서: PR837 시험 증거 불일치 원시 기록 대조 및 정합성 규명

- 작업 브랜치: `codex/task-es-580-proof-reconciliation` (기준: `37f41857`)
- 작업 트리: `C:/Users/HP/.codex/worktrees/agy-proof-580/ourgoal-app`
- 허용 저장소 변경: `.claude/plan-TASK-ES-580.md` 1개 파일만 허용
- 조사 스크립트 및 산출물 보존 경로: `C:/dev/wt/agy-scratch/TASK-ES-580/` (UTF-8)
- 작업 유형: [탐색 · 새 유형] (작업참고 v2026.10.06 기준 PR #838, 원시 기록 사후 정합성 대조 및 무결성 감사)

---

## 5단 추론 블록 (Reasoning Block)

1. **이해 (Understand)**:
   - 대상: 이미 병합된 PR #837(head `7d720298`, base `c34a0568`)의 보고서 `reports/TASK-ES-576/test-final.json`과 `reports/TASK-ES-576/proof.json` 간 수치·내용 불일치.
   - 핵심 문제: `test-final.json`은 npmExit 1/1, smokeTitles false(178->179), outputDiffAfterNormalize 3개, task "TASK-ES-432" 기록 vs `proof.json`은 npmExit 0/0, titlesSame true, outputDiff 0, task "TASK-ES-576" 기록.
   - 목적: 제품 회귀라 단정하지 않고, 원시 기록(`transcript.jsonl`, `tasks/*.log`, `scratch/`, worktree 원본)을 전수 추적하여 어떤 기록이 어떤 시점/커밋/실행을 가리키는지 규명하고, `reconciliation.json` 및 최종 보고를 도출함.

2. **분류 (Classify)**:
   - [탐색 · 새 유형]: 사후 증거 불일치 분석 및 원시 로그 출처 대조.
   - 불변층 준수: 승인선 5대 항목 준수, 판정 분리(자가 채점/통과 선언 금지), 상태는 측정, 데이터 무손실, 금고/테스트/기대값 무수정, 원시 기록 읽기 전용 보존.

3. **예측 (Predict)**:
   - `test-final.json`이 이전 단계(예: 임시 분열 상태 또는 다른 세션의 스크립트 재사용 시점)에서 실행된 산출물일 가능성.
   - `proof.json`의 npmExit 0/0과 titlesSame true가 실제 어떤 실행(예: `task-977.log` 등)을 바탕으로 작성되었는지, 또는 과장/누락이 있는지.
   - `.git` 없는 `base` archive 환경 차이로 인한 모듈/테스트 실패와 실제 제품 회귀가 혼재될 위험.

4. **반론 (Counter-arguments) & 격파**:
   - *반론 1: test-final.json에 npmExit 1이 찍혔으니 PR837은 제품 회귀를 발생시킨 것이 분명하다.*
     -> 격파: 아워골 모듈 스플릿 및 게이트 환경에서 git archive나 특정 환경 변수(`NODE_PATH`) 누락, 또는 기준선 자체의 알려진 실패(28개 실패 목록 등)로 인해 기준/작업 모두 exit 1이 나는 경우가 존재한다. `test-final.json` 자체에서도 `passFailSame: true`로 기록되어 있으므로 베이스라인의 기저 실패와 새 회귀를 정확히 분리 측정해야 한다.
   - *반론 2: proof.json의 npm 0 / outputDiff 0을 검증된 사실로 간주하고 test-final.json을 오기록으로 치부하면 된다.*
     -> 격파: 원시 로그(`task-977.log` 및 `transcript.jsonl`)에서 실제 실행된 명령, 입력 커밋, 실제 종료 코드, 실제 출력 diff를 물리적으로 대조하지 않고 문서를 정당화하는 것은 가짜 채점(GUARD_01, GUARD_05)이다. 물리적 sha256과 실행 출력을 확인하기 전까지는 확정할 수 없다.

5. **선택 (Select)**:
   - 1단계: Git 이력 및 대상 커밋(`c34a0568`..`7d720298`)과 보고서 커밋 시점 확인.
   - 2단계: AGY 원시 로그(`transcript.jsonl`, `task-*.log`) 전수 대조 및 메타데이터 표 작성.
   - 3단계: `outputDiffAfterNormalize` 3개 및 실패 27(28)개 파일의 실질 차이/경로/해시 분류.
   - 4단계: 기준(`c34a0568`)과 작업(`7d720298`)의 필요 범위 검증 실행(저장소 밖 사본) 및 환경 영향 분리.
   - 5단계: `reconciliation.json` 작성 및 1500자 이내 최종 분석 보고 제출.

---

## 작업 체크리스트

- [x] [0단계: 준비] 작업참고(PR #838), AGENTS.md, ACTIVE.md 정독 및 5단 추론 블록 수립
- [x] [1단계: Git 이력] PR #837 커밋 이력 및 보고서 생성 시점 추적
- [x] [2단계: 원시 로그] `transcript.jsonl` 및 `tasks/*.log` 메타데이터 대조표 작성 (`C:/dev/wt/agy-scratch/TASK-ES-580/raw-log-table.json`)
- [x] [3단계: 차이 분석] outputDiff 3개 원인 분석 및 실패 목록(27/28개) 정합성 확인
- [x] [4단계: 환경 대조] `c34a0568` 대 `7d720298` 시험 및 스모크 원시 증거 검증
- [x] [4단계: 심사 청구/정합성 보고] `reconciliation.json` 작성 및 최종 1500자 보고서 도출
