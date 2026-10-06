# TASK-FALLBACK 학습 연결 브리프

전체 정본 읽기: C:\Users\HP\.codex\worktrees\shared-learning-tools-584\ourgoal-app\reports\TASK-ES-584\unit-fixtures\1791295624748\session-a\fallback\WORK-REFERENCE.md
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

## playbook-README.md
# Claude × 안티그래비티 동반작업

2026-10-05 상민님 지시: 안티그래비티에게 시킨 것·한 것·못한 것·잘한 것·보완점을 모두 쌓아,
Claude 가 안티그래비티와 함께 일할 때 매번 더 효과적으로 시키게 한다.

## 정본 위치
- 노션 (사람이 보는 정본): 아워골 프로젝트 컨트롤타워 허브 → 「Claude × 안티그래비티 동반작업 (기록·플레이북)」
  - 페이지: https://app.notion.com/p/3f0598db90968182b4d4d09e39e72dcb (플레이북·운영 규칙)
  - 기록 DB: 「안티그래비티 작업 기록」 data source `collection://c2e053cf-c0cc-476a-ae7d-1ff62bb1583e`
- 이 폴더 (로컬 정본): `agy.js`(조종 도구), `briefs/`(보낸 지시서 원본, 날짜_제목.md), `ledger.jsonl`(보낼 때마다 자동 한 줄), `TEMPLATE.md`(지시서 틀)

## 한 번의 동반작업 = 다섯 단계
1. **읽기**: 노션 플레이북 + 기록 DB 최근 5건의 「다음 지시서 보완점」을 읽는다.
2. **쓰기**: `TEMPLATE.md` 를 복사해 지시서를 쓴다(금지문은 지우지 않는다). 기계적으로 검사 가능한 일인지 먼저 따진다 — 판단이 필요한 코드 이동은 맡기지 않는다.
3. **보내기**: `node agy.js send <지시서.md> <짧은제목> [flash|pro]` → 대화 ID 출력, `briefs/` 에 원본 사본, `ledger.jsonl` 에 한 줄.
   그리고 노션 기록 DB 에 행을 만든다(작업명·날짜·유형·지시 요약·지시서 경로·대화 ID).
4. **기다리기·검수**: `node agy.js wait <대화ID> [초]` / `node agy.js tail <대화ID>`.
   검수 체크리스트: git config user.name/email 그대로 · 바뀐 파일이 지시 범위 안 · 코드 이동이면 기준·작업 양쪽 게스트 화면 시나리오 · 판정은 법정만.
5. **기록**: 노션 행에 결과·결함 수·Claude 검수(분)·잘한 점·못한 점·다음 지시서 보완점·PR 을 채운다(측정값만, 못 쟀으면 비움).
   같은 보완점이 두 번 나오면 플레이북에 규칙으로 올리고 `TEMPLATE.md` 금지문에도 넣은 뒤 「플레이북 반영」 체크.

## 실행 전제
- 안티그래비티 앱이 켜져 있어야 한다(꺼져 있으면 [손 필요]: 상민님께 앱 켜기만 부탁).
- 환경 변수는 agy.js 가 실행 중인 language_server 명령줄에서 읽어 자식 프로세스에만 넣는다(출력·저장 금지).

## playbook-TEMPLATE.md
FIRST read C:\dev\agent-knowledge\WORK-REFERENCE.md in full and follow it (shared lessons for Claude/Antigravity/Codex — regenerated after every merged PR).

<목표 한 줄 — 무엇을, 왜>

Work ONLY inside a NEW git worktree <C:\dev\wt\agy-XXX>. Use absolute paths for every file and command (you have no workspace attached).

## Hard rules (do not remove — each one comes from a real past incident, see Notion 「안티그래비티 작업 기록」)
- Do NOT run commands in C:\dev\ourgoal-app or any other C:\dev\wt\* folder except your own worktree.
- Do NOT change git config (user.name / user.email) anywhere.
- Do NOT edit tests/**, court/**, AGENTS.md, CLAUDE.md, .github/workflows/**, scripts/essence-gate.js, scripts/verify-integrity-gate.js, package.json scripts, vercel.json. Never run court/* scripts.
- Do NOT push, open PRs, or run git stash. Commit only. Claude writes the PR and paperwork.
- Do NOT run any command that is not needed for this task (no extra checks in other repos).
- Scratch files only in C:\dev\wt\agy-scratch\ (outside the repo); delete them when done.
- Allowed changed files: <list every file by name>. If `git status --short` shows anything else, STOP and report the list. Never edit files by hand unless this brief says so.
- Run `npm test` in the foreground (not background) and wait for it to finish. Do NOT end your turn while waiting — keep going until the final reply is written.
- If there is no safe, existing mechanism for something, STOP and report — do not invent one.
- Set NODE_PATH=C:\dev\ourgoal-app\node_modules for every node and git command (the commit hook needs it).

## Setup
1. `git -C C:\dev\ourgoal-app fetch origin`
2. `git -C C:\dev\ourgoal-app worktree add <C:\dev\wt\agy-XXX> -b <branch> origin/main`

## Task
<단계별 명령. 판단이 필요한 부분은 넣지 않는다.>

## Checks (all required)
<결정론 재실행 · --check · module-guard · npm test 수치 등 기계로 확인 가능한 것>

## Commit (one commit)
[INFRA] #TASK-ES-AGY-<NAME> <type>: <한글 요약>

Co-Authored-By: Antigravity

Do not skip git hooks; if a hook fails, stop and report its exact output.

## Final reply
- commit hash
- changed files with +/- counts (`git show --stat`)
- every check result with exact numbers
- anything unsure or skipped, and why

## 반복 누락 예방·묶음 분열 (PR838·839·840 실측 보완)
- 배정 전 동반작업 DB 최근5건의 다음 지시서 보완점을 읽고 적용한 항목을 지시서에 적는다. 두 번 반복된 문제는 플레이북과 이 틀에 함께 반영한다.
- 수치는 원시 로그에서 자동 추출한다. 입력 커밋·SHA256·명령·종료코드·원시/게시 경로를 evidence-manifest.json에 적고, 참조 파일·필수 측정·비교 입력을 제출자료 검사기로 확인한다. 누락·파싱 실패·입력 불일치를 성공으로 처리하지 않는다.
- 전체 DOM·저장값·토스트·콘솔 내용을 비교한다. 길이/개수만 비교하거나 실제 click 포함관계를 true로 고정하지 않는다. npm 성공과 개별 시험 전체 결과를 구분한다.
- 원시 실패·최종 성공 로그는 보존한다. 위의 scratch 삭제는 증거로 등록되지 않은 일회성 파일에만 적용한다. 원시의 비밀값은 게시 사본에서 마스킹하고 출처와 해시를 구분한다.
- 오케스트레이터가 설계를 확정한 여러 책임 세포를 한 PR로 묶는다. 동일 입력의 공통 전체 검증은 기준2회·작업1회 공유하고 세포별 토큰·단독 로드·실제 조작 증명은 각각 유지한다. 입력 변경 시 영향받은 검증만 재실행한다.
- 판정은 독립 법정만 한다. 제출자료 검사 결과는 작업자 측정이며 판정이 아니다. 미측정·기존 결함·새 회귀를 별도로 보고한다.
- 실계정 검사는 실행 전 하네스 소스의 생성·수정·삭제·전송·cleanup 경로를 확인한다. 검증된 읽기전용 명령이 없으면 미측정 보고한다. real-account-check.js 전체 live 실행을 가용성 검사로 실행하지 않는다. 추가 데이터 정리·복구를 임의로 실행하지 않는다.

## participants
```json
[
  {
    "tool": "claude",
    "role": "worker",
    "worktree": "C:\\Users\\HP\\.codex\\worktrees\\shared-learning-tools-584\\ourgoal-app\\reports\\TASK-ES-584\\unit-fixtures\\1791295624748\\session-a",
    "owns": [
      "product-input.txt"
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
## recent-TASK-SESSION-1
[{"proposal":"shared-improvement-1"}]
## recent-TASK-SESSION-0
[{"proposal":"shared-improvement-0"}]
