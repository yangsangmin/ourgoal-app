# TASK-ES-584 학습 연결 브리프

전체 정본 읽기: C:\Users\HP\.codex\worktrees\shared-learning-tools-584\ourgoal-app\reports\TASK-ES-584\unit-fixtures\1791295439446\source\WORK-REFERENCE.md
이 브리프는 전체 읽기를 대체하지 않는다. 명령 실행 없음. 작업자 측정·판정 분리.

## core
# 공통 연결 계약

이 문서는 기존 정본으로 가는 도구 안내이며 새 규범이 아니다. WORK-REFERENCE 전체를 직접 읽는다. bootstrap 영수증은 파일을 읽은 해시이며 사람이 이해했다는 증명이 아니다.

기존 승인선·5단 추론·8원칙·판정 분리·데이터 보존을 유지한다. 도구 ID는 권한을 주지 않는다. 각 participant의 role/worktree/owns/allowedActions를 작업 책임자가 명시한다. 역할 미정·권한 미정이면 명령 실행을 추론하지 않는다.

경험칙은 ID·원문 versionHash·scope·briefSection·checkerId·disposition을 연결한다. 적용했다는 기록에는 실제 브리프 링크와 확인 방법이 있어야 한다. manual-with-evidence는 자동으로 규칙 준수를 증명하지 않는다. CI·측정 파일·exitCode는 작업자 측정이다. Court URL은 별도 필드다.

최근 보완점은 task별 learning-event의 lessonCandidates에서 읽는다. 개선안은 pending이며 원장이나 규칙으로 자동 승격하지 않는다. 원본·과거 기록·출처·확인 횟수는 보존한다. 비밀값·대화 전문을 수집하지 않는다.

## adapter-codex
# Codex 연결
WORK-REFERENCE 전체를 읽고 기존 세션 진입 지침을 따른다. 커밋과 같은 셸의 NODE_PATH 및 정상 훅을 유지한다. 실제 설치되지 않은 훅을 자동 강제라고 표현하지 않는다. 자기 측정과 독립 Court 판정을 분리한다.

## adapter-generic
# 알 수 없는 도구 연결
도구명이 알 수 없으면 generic으로 안내한다. 역할·worktree·파일 소유권·allowedActions를 명시한다. 도구 ID로 권한을 추론하지 않는다. 기존 정본과 전체 참고를 읽고 동일한 증거 계약을 사용한다.

## participants
```json
[
  {
    "tool": "codex",
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
    "tool": "unknown-new-tool",
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
