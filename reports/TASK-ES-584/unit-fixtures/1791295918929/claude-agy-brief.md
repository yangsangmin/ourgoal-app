# TASK-ES-584 학습 연결 브리프

전체 정본 읽기: C:\Users\HP\.codex\worktrees\shared-learning-tools-584\ourgoal-app\reports\TASK-ES-584\unit-fixtures\1791295918929\source\WORK-REFERENCE.md
이 브리프는 전체 읽기를 대체하지 않는다. 명령 실행 없음. 작업자 측정·판정 분리.

## core
# 공통 연결 계약

이 문서는 기존 정본으로 가는 도구 안내이며 새 규범이 아니다. WORK-REFERENCE 전체를 직접 읽는다. bootstrap 영수증은 파일을 읽은 해시이며 사람이 이해했다는 증명이 아니다.

기존 승인선·5단 추론·8원칙·판정 분리·데이터 보존을 유지한다. 도구 ID는 권한을 주지 않는다. 각 participant의 role/worktree/owns/allowedActions를 작업 책임자가 명시한다. 역할 미정·권한 미정이면 명령 실행을 추론하지 않는다.

경험칙은 ID·원문 versionHash·scope·briefSection·checkerId·disposition을 연결한다. 적용했다는 기록에는 실제 브리프 링크와 확인 방법이 있어야 한다. manual-with-evidence는 자동으로 규칙 준수를 증명하지 않는다. CI·측정 파일·exitCode는 작업자 측정이다. Court URL은 별도 필드다.

최근 보완점은 task별 learning-event의 lessonCandidates에서 읽는다. 개선안은 pending이며 원장이나 규칙으로 자동 승격하지 않는다. 원본·과거 기록·출처·확인 횟수는 보존한다. 비밀값·대화 전문을 수집하지 않는다.

## adapter-claude
# Claude 연결
기존 Claude 지시·정본을 읽고 명시된 역할을 수행한다. 공동 작업자는 별도 worktree와 파일 소유권을 받는다. 다른 도구의 보고는 측정 입력·원시·SHA와 함께 검토한다. PR·병합 권한은 participant 계약과 기존 승인선에서 확인한다.

## adapter-antigravity
# Antigravity 연결
C:/dev/agy-collab/README.md와 TEMPLATE.md 및 최근 보완점을 읽는다. 기존 TEMPLATE 금지문은 보존한다. 작업마다 명시된 allowedActions를 확인한다. 자동으로 push·PR·Court 권한을 부여하지 않는다. 실제 수치와 원시 증거를 제출한다.

## participants
```json
[
  {
    "tool": "claude",
    "role": "coordinator",
    "worktree": "C:\\Users\\HP\\.codex\\worktrees\\shared-learning-tools-584\\ourgoal-app",
    "owns": [
      "docs/design/harness/shared-learning/**"
    ],
    "allowedActions": [
      "read",
      "unit-check"
    ]
  },
  {
    "tool": "antigravity",
    "role": "worker",
    "worktree": "C:\\Users\\HP\\.codex\\worktrees\\shared-learning-tools-584\\ourgoal-app",
    "owns": [
      "docs/design/harness/shared-learning/**"
    ],
    "allowedActions": [
      "read",
      "unit-check"
    ]
  }
]
```
## lesson-L001
전체 정본과 측정 증거를 연결하라.
전체 파일을 읽고 SHA를 기록.
출처: [841]
## recent-TASK-ES-584
[{"id":"proposal-evidence-linkage","proposal":"전체 읽기와 실제 적용/증거를 분리 연결하는 유형. 원장 자동승격 없음.","sourceTask":"TASK-ES-584"}]
## recent-TASK-ES-584
[{"id":"proposal-evidence-linkage","proposal":"전체 읽기와 실제 적용/증거를 분리 연결하는 유형. 원장 자동승격 없음.","sourceTask":"TASK-ES-584"}]
