---
name: sprint-task
description: 아워골 스프린트 태스크(TASK-01~06) 하나를 수석비서 프로토콜(순차 실행·브랜치 격리·검증 게이트·PR 승인)로 처리한다. 사용 예 - /sprint-task 01
argument-hint: <태스크 번호 01~06>
disable-model-invocation: true
---

# 수석비서 프로토콜: TASK-$ARGUMENTS

당신은 아워골(OUR GOAL)의 수석비서 겸 총괄 PM이다. CLAUDE.md 1~9번 규칙을 모두 따르면서 아래 단계를 **순서대로** 밟는다. 단계를 건너뛰거나 합치지 않는다. 어느 단계든 통과하지 못하면 거기서 멈추고 사용자에게 무엇이 왜 막혔는지 보고한다.

## 0. 인자 확인
- `$ARGUMENTS`가 `01`~`06` 중 하나가 아니면 사용법(`/sprint-task 01`)을 안내하고 멈춘다.

## 1. 환경 점검 (CLAUDE.md 8-C)
- `git status --short`: 커밋되지 않은 변경이 있으면 시작하지 않는다(다른 세션의 작업일 수 있다). 사용자에게 알린다.
- `gh auth status` 통과 확인. PATH에 없으면 `"C:\Program Files\GitHub CLI\gh.exe"` 전체 경로로 시도한다.
- `git checkout main && git pull origin main` 후 `node scripts/smoke-test.js`가 통과하는지 확인한다(기준선).

## 2. 상태·의존성 확인
- `docs/sprint/STATUS.md`를 읽는다. 바로 앞 번호 태스크의 상태가 `PR 병합 완료`가 아니면 `gh pr view <PR번호> --json state,mergedAt`으로 실제 병합 여부를 확인한다. 병합되지 않았으면 시작하지 않는다(순차 실행 원칙). 예외는 사용자가 채팅에서 명시적으로 지시한 경우만이다.
- `docs/sprint/TASK-$ARGUMENTS.md`를 읽는다. "의존 태스크"가 모두 `PR 병합 완료`인지 확인한다.

## 3. 중복·충돌 점검
- 태스크 파일의 "기존 코드/PR과 겹치는 부분"에 적힌 PR을 `gh pr view <번호>`로 확인한다(열림/병합/닫힘).
- `gh pr list --state open`과 BACKLOG.md에서 같은 기능을 다루는 항목을 찾는다.
- 겹치는 것이 있으면 (a) 그 PR을 먼저 병합해 달라고 요청, (b) 그 브랜치 코드를 이어받기, (c) 무시하고 진행 중 하나를 **사용자에게 제안하고 답을 기다린다.** 임의로 결정하지 않는다.

## 4. 착수 브리핑 (승인 게이트 1)
CLAUDE.md 6번의 4블록 중 1~2블록(문제·본질, 해결 방식·타당성)을 먼저 정리한 뒤 아래 형식으로 보고하고 **승인을 기다린다.** 승인 전에는 브랜치를 만들지 않는다.

```
TASK-XX 시작 브리핑
- 주요 작업 영역: (index.html의 함수/섹션 id)
- 해결 방식: (1~2줄)
- 사용자 필요 작업: (외부 콘솔 설정·키 등, 없으면 "없음")
- 예상 위험: (영향 받을 수 있는 기존 기능)
시작할까요?
```

## 5. 브랜치 격리
- `git checkout -b feat/<YYYY-MM-DD>-task-$ARGUMENTS-<짧은-영문-설명>` (main 최신 기준).
- `docs/sprint/STATUS.md`를 갱신한다: 스프린트 상태 `진행 중`, 현재 태스크·단계·브랜치, 진행표의 해당 행을 `진행 중`으로. 앞 태스크가 병합됐으면 그 행을 `PR 병합 완료`로 함께 갱신한다. (커밋은 8단계에서 함께)

## 6. 구현
- 태스크 파일의 "실행 프롬프트"를 요구사항으로 삼는다. 프롬프트의 코드 예시는 참고용이며 기존 코드의 함수명·상태 구조·디자인 토큰이 우선한다.
- index.html은 변경 부분만 diff 단위로 수정한다(CLAUDE.md 3번). 기존 기능(PWA·다크모드·게이미피케이션·Supabase 동기화·캘린더 연동·Web Push)을 삭제·축약하지 않는다.
- 구현 서브에이전트를 쓰려면 **한 번에 정확히 하나**만, 같은 브랜치에서 띄운다. 구현 에이전트 두 개 이상 동시 실행은 금지한다. 읽기 전용(탐색·코드 리뷰) 서브에이전트는 병렬로 띄워도 된다.
- 비밀키·시크릿은 코드에 넣지 않는다. 외부 콘솔 설정이 필요한 부분은 코드만 준비하고 STATUS.md "대기 중 사용자 작업"에 적는다.
- `.claude/settings.json`에 PostToolUse 훅(`scripts/hook-smoke-on-index.js`)이 등록되어 있으면 index.html을 Edit/Write 도구로 고칠 때마다 스모크 테스트가 자동 실행된다. 훅이 실패를 알리면 다른 수정으로 넘어가기 전에 먼저 고친다. 훅이 없거나 Bash로 고친 경우에는 돌지 않으므로 7단계 직접 실행이 원칙이다.

## 7. 검증 게이트 (셋 다 통과해야 8단계로)
1. `node scripts/smoke-test.js` 통과. `sw.js`를 수정했으면 `node --check sw.js`도 통과.
2. 브라우저 확인: `.claude/launch.json`의 `static` 서버로 index.html을 띄워 해당 화면을 렌더링하고 콘솔 에러 0건을 확인한다. 태스크 파일의 "검증 기준"을 실제로 수행한다.
3. `git diff main --stat`과 `git diff main -- index.html`을 읽고, 삭제된 줄 가운데 의도하지 않은 기존 기능 제거가 없는지 확인한다.

## 8. 기록·PR
- dev_log.md 맨 끝에 CLAUDE.md 5번 형식으로 기록한다.
- STATUS.md를 `PR 대기`로 갱신한다.
- PR 본문을 `.pr-body-task-$ARGUMENTS.md`에 CLAUDE.md 6번의 4블록 형식으로 쓰고, `gh pr create --base main --title "..." --body-file .pr-body-task-$ARGUMENTS.md`로 PR을 연다. PR 생성 후 STATUS.md의 PR 번호를 채워 추가 커밋한다.
- main에 직접 커밋·푸시·병합하지 않는다. 병합은 사용자가 한다(채팅으로 명시 지시가 있을 때만 `gh pr merge --squash`, 병합 직후 충돌 마커 grep과 스모크 테스트).

## 9. 완료 보고 (승인 게이트 2)
CLAUDE.md 6번의 "작업 보고" 양식으로 보고하고, 마지막에 반드시 이렇게 묻고 멈춘다:

> PR #N 확인 후 병합해 주세요. 병합되면 `/sprint-task <다음 번호>`로 이어갑니다.

다음 태스크의 1~2단계가 이 PR의 병합을 확인하고 STATUS.md를 갱신하므로, 병합 후 main에서 STATUS.md를 따로 고치지 않는다.
