# OURGOAL-AGY-SPLIT-RUN-20261006 학습 연결 브리프

전체 정본 읽기: C:\dev\agent-knowledge\WORK-REFERENCE.md
이 브리프는 전체 읽기를 대체하지 않는다. 명령 실행 없음. 작업자 측정·판정 분리.

## core
# 공통 연결 계약

이 문서는 기존 정본으로 가는 도구 안내이며 새 규범이 아니다. WORK-REFERENCE 전체를 직접 읽는다. bootstrap 영수증은 파일을 읽은 해시이며 사람이 이해했다는 증명이 아니다.

기존 승인선·5단 추론·8원칙·판정 분리·데이터 보존을 유지한다. 도구 ID는 권한을 주지 않는다. 각 participant의 role/worktree/owns/allowedActions를 작업 책임자가 명시한다. 역할 미정·권한 미정이면 명령 실행을 추론하지 않는다.

경험칙은 ID·원문 versionHash·scope·briefSection·checkerId·disposition을 연결한다. 적용했다는 기록에는 실제 브리프 링크와 확인 방법이 있어야 한다. manual-with-evidence는 자동으로 규칙 준수를 증명하지 않는다. CI·측정 파일·exitCode는 작업자 측정이다. Court URL은 별도 필드다.

최근 보완점은 task별 learning-event의 lessonCandidates에서 읽는다. 개선안은 pending이며 원장이나 규칙으로 자동 승격하지 않는다. 원본·과거 기록·출처·확인 횟수는 보존한다. 비밀값·대화 전문을 수집하지 않는다.

배정자는 착수 전에 자기 현재 제품 입력의 필수 확인항목 계약을 먼저 확정한다. 각 항목은 실제 명령·API·args, 입력 파일 SHA, 기준/작업 scope, 원시 기록과 비교기 참조 경로를 둔다. 보고서의 글자만 맞추지 말고 실제 실행 명령·원시·참조 파일 존재를 대조한다. 전체 npm 결과와 개별 시험 결과는 별개이며, 옛 TASK 수치나 예전 main 상태를 현재 완료로 복사하지 않는다. 미측정이면 null/이유를 남기고 완료 표시하지 않는다. tri-sync 등 지시 밖 명령이나 추가 데이터 정리를 도구명·역할 이름을 이유로 추론하지 않는다.

TASK582의 현재 입력/옛 상태·옛 수치·실제 API/참조 불일치 보고는 독립 검토 대상이다. 이 도구의 효과 성공 사례로 삼지 않는다. 필수 계약 자체의 진실성·완전성은 배정자와 독립 검토가 확인하며 CLI 무결성 검사나 작업자 자가측정이 제품 판정을 대신하지 않는다.

## adapter-codex
# Codex 연결
WORK-REFERENCE 전체를 읽고 기존 세션 진입 지침을 따른다. 커밋과 같은 셸의 NODE_PATH 및 정상 훅을 유지한다. 실제 설치되지 않은 훅을 자동 강제라고 표현하지 않는다. 자기 측정과 독립 Court 판정을 분리한다.

현재 제품 입력 기준 배정자의 필수항목 계약과 실제 실행 명령·API·원시·참조 존재를 대조한다. 미측정은 null/이유이며 완료 표시하지 않는다. tri-sync 등 지시 밖 명령은 역할이나 도구명에서 추론하지 않는다.

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


<!-- TASK-ES-584 shared-learning-entry -->
공통 작업학습 도구 안내: C:/dev/agent-knowledge/shared-learning.js (출처 병합 66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9)를 어느 작업 폴더에서든 사용할 수 있다. 사용법: C:/dev/agent-knowledge/shared-learning-runtime/66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9/docs/agents/shared-learning/README.md
기존 WORK-REFERENCE 전체 읽기를 유지한다. 명시한 참여자의 역할·담당 파일·허용 행위로 bootstrap 브리프를 만든다. node C:/dev/agent-knowledge/shared-learning.js bootstrap --repo-root <실제전용작업폴더> --participants <참여계약.json> --task-id <TASK> --task-kind <유형> --out <작업폴더/학습진입.json> --brief <작업폴더/학습지침.md>
작업별 원시/게시 증거와 실제 제품 입력을 validate한 뒤 collect로 C:/dev/agent-learning-events 공유 저장소에 보완 후보를 남긴다. 다음 bootstrap에서 최근 보완 후보를 읽는다. 실행하지 않은 것은 미측정, 작업자 측정과 독립 법정 판정을 구분한다. 도구명으로 권한을 넓히지 않으며 원장/규칙 자동 승격은 없다.
<!-- /TASK-ES-584 shared-learning-entry -->

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


<!-- TASK-ES-584 shared-learning-entry -->
공통 작업학습 도구 안내: C:/dev/agent-knowledge/shared-learning.js (출처 병합 66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9)를 어느 작업 폴더에서든 사용할 수 있다. 사용법: C:/dev/agent-knowledge/shared-learning-runtime/66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9/docs/agents/shared-learning/README.md
기존 WORK-REFERENCE 전체 읽기를 유지한다. 명시한 참여자의 역할·담당 파일·허용 행위로 bootstrap 브리프를 만든다. node C:/dev/agent-knowledge/shared-learning.js bootstrap --repo-root <실제전용작업폴더> --participants <참여계약.json> --task-id <TASK> --task-kind <유형> --out <작업폴더/학습진입.json> --brief <작업폴더/학습지침.md>
작업별 원시/게시 증거와 실제 제품 입력을 validate한 뒤 collect로 C:/dev/agent-learning-events 공유 저장소에 보완 후보를 남긴다. 다음 bootstrap에서 최근 보완 후보를 읽는다. 실행하지 않은 것은 미측정, 작업자 측정과 독립 법정 판정을 구분한다. 도구명으로 권한을 넓히지 않으며 원장/규칙 자동 승격은 없다.
<!-- /TASK-ES-584 shared-learning-entry -->

## participants
```json
[
  {
    "tool": "codex",
    "role": "worker",
    "worktree": "C:\\Users\\HP\\.codex\\worktrees\\learning-feedback\\ourgoal-app",
    "owns": [
      "docs/design/harness/shared-learning/**",
      "reports/learning-feedback/**"
    ],
    "allowedActions": [
      "read",
      "measure",
      "collect-proposal"
    ]
  }
]
```
## lesson-L001
화면 파일(index.html·js 화면 세포)의 동작 주장은 처음부터 게스트 화면 시나리오로 내고, 글자 확인(codeContains) 주장은 문서·설정·신고서에만 써라.
reports/TASK-ES-xxx/scenarios/ 에 세포마다 하나씩 게스트 시나리오를 둔다. push 전에 로컬 법정 실행기로 기준(origin/main)에서 실패·작업에서 통과(고치기) 또는 양쪽 통과(옮기기)를 확인한다. scenario 경로는 claims.json 디렉터리 기준 상대경로(scenarios/name.json)로 쓴다. push 전에 path.resolve(dirname(claimsFile), scenario)로 실제 파일 존재를 검사한다. #835는 파일이 제출되어도 저장소 기준 경로를 적으면 시험 미제출로 처리되는 것을 확인했다.
출처: [745,747,835]
## lesson-L002
main 이 움직이면 값이 바뀌는 전체 수치(인라인 전체 줄 수·세포 수·기준선 현재값·main 커밋 해시)를 주장에 쓰지 마라.
옮긴 묶음 자체의 성질(토큰 동일·새 파일 줄 수·원래 구간 사라짐)만 주장한다. 전체 수치가 꼭 필요하면 이 PR 이 소유한 reports/TASK-ES-xxx/snapshot-*.json 을 가리키게 한다(#762 C17·C28·C29).
출처: [749,750,754,755,762,814]
## lesson-L003
같은 PR 에서 이미 「안 됨」을 받은 주장은 철회하거나 종류를 바꾸지 말고, 막혔으면 경위를 댓글로 남기고 PR 을 닫은 뒤 같은 코드로 새 PR 을 연다(A안 선례).
gh pr close <번호> --comment "경위·대체 PR" → 새 브랜치·다음 빈 TASK 번호로 같은 코드 → 주장을 처음부터 올바른 종류로.
출처: [745,747,750,755]
## lesson-L004
「주장 없음 → 확인 못 함」이 뜨면, 코드를 바꾼 항목은 시나리오 주장을 붙이고, 보고만 한 항목은 지시 항목(requirements)에서 내려 outOfScopeReports 로 옮겨라.
claims.json requirements 에는 이 PR 이 실제로 바꾼 것만. 판정받은 주장은 지우지 말고 철회 표시. 바꾸기 전 로컬 법정으로 재심 결과 확인.
출처: [767]
## lesson-L005
옮기기(분열) PR 의 「확인 부족 — 고칠 게 없었음」은 정상 판정으로 받아들이고 병합 기준에 넣어라.
판정 부족 목록이 「고칠 게 없었음」과 실계정·실기기 한계뿐이면 병합. 다른 사유(주장 없는 제품 파일, 잴 수 있는데 안 잼)가 섞이면 병합하지 않고 고친다.
출처: [764,772,773,775,781,785,786,788,840]
## lesson-L006
법정 도구 한계 사유(needs-login·needs-real-device 등)는 정말로 법정이 잴 수 없는 것에만 쓰고, 게스트 화면으로 잴 수 있는 것을 한계로 돌리지 마라.
elementFromPoint·게스트 시나리오로 닿는지 먼저 실측하고, 닿지 않는 근거(로그인 필요·실기기 필요)를 cannotBecause 에 적는다.
출처: [767,783,833]
## lesson-L007
법정 판정 「심사 못 함 — 부팅 탐침 도구 오류(Chrome 디버그 포트)」는 코드 문제가 아니니 main 을 합쳐 다시 push 해서 재심을 받아라.
git merge origin/main → push. 같은 고장이 두 번 나면 오케스트레이터에 보고.
출처: [786]
## lesson-L008
시험 검사의 기대값을 바꾸는 PR 은 상민님의 정확한 문구 「금고 변경 승인」이 있어야 병합된다는 것을 미리 알리고 결심을 받아라.
기대값 변경이 필요하면 결심 요청에 「승인 문구는 『금고 변경 승인』이어야 함」을 같이 적는다. claims retire 에 승인 원문 인용.
출처: [791]
## lesson-L009
분열 PR 에서는 생성 지도 3종(docs/architecture/module-baseline.json·cell-map.json·inline-script-map.json·INLINE-SCRIPT-MAP.md)을 커밋하지 말고 main 판 그대로 두어라. 병합 3~5건마다 일괄 갱신 PR 을 따로 낸다.
일괄 갱신: node scripts/module-guard.js --update(사유 없이, 낮아진 값만) → node scripts/cell-map-export.js → node scripts/inline-script-map.js --write → --check·module-guard·npm test → 한 커밋(#761·#787).
출처: [761,787,832,838,843]
## lesson-L010
병합 하나가 나머지 열린 분열 PR 을 CONFLICTING 으로 만드는 것은 정상이다 — index.html 충돌은 손으로 풀지 말고 main 판 index.html 을 입력으로 생성기를 다시 돌려 해결하라.
git -c core.attributesFile=C:/dev/ourgoal-app/.git/info/attributes merge origin/main → 충돌 시 git show origin/main:index.html > 입력 → 생성기 설정 그대로 재실행 → verify-inline-*.js ok → 시나리오 재실행 → push.
출처: [759,760,762,773,775,782,785,788,827,824,829,830]
## lesson-L011
dev_log.md·docs/rules/TICKETS.md 는 끝줄 추가끼리 충돌하므로 합집합 합치기로 처리하라.
git -c core.attributesFile=C:/dev/ourgoal-app/.git/info/attributes merge origin/main (그 attributes 파일이 두 파일을 union 병합으로 지정).
출처: [758,769,779]
## lesson-L012
TASK-ES 번호는 쓰기 직전에 gh pr list --state all 과 git ls-remote 로 비었는지 확인하고, 브랜치를 먼저 push 해 번호를 선점하라.
gh pr list --state all --limit 80 · git ls-remote origin | grep task-es-<번호> 가 비면 즉시 빈 브랜치 push. 충돌 시 나중에 쓴 쪽이 바꾼다.
출처: [760,765,767,777,778,779,"#828"]
## lesson-L013
병합은 판정 줄·부족 사유·단언 삭제 여부를 사람처럼 확인하는 단계로 남기고, 자동 병합 스크립트로 넘기지 마라.
판정 감시는 백그라운드 루프로 하되, 병합은 gh pr diff 로 tests/ 의 삭제 줄에 assert 가 없는지·금고 경로 변경이 없는지 본 뒤 직접 gh pr merge.
출처: [768,769,780]
## lesson-L014
여러 PR 이 동시에 판정 대기 중이면 계속 밀려 충돌하는 PR 을 먼저 병합한다고 약속하고 지켜라(직렬화).
충돌 재합침을 지시할 때 「재판정 나오면 1순위」를 함께 알리고, 그 사이 다른 PR 병합을 보류.
출처: [775,785]
## lesson-L015
분열(옮기기) PR 은 고치기가 아니다 — 동작 0 변경, 버그도 그대로 옮기고, 바꿀 수 있는 글자는 생성기가 붙이는 이름 접두(L. 등)뿐이다.
docs/design/harness/module-split/gen-inline-*.js 생성기로만 옮기고 verify-inline-*.js 로 토큰 동일·누수 0·남은 글자 동일을 확인. 발견 결함은 REQ 와 보고에 적는다.
출처: [744,762,767,777]
## lesson-L016
어려운 인라인 묶음은 표준 이음매로 옮겨라: 재대입 상태는 선언을 원래 자리에 두고 L.getter/setter, window 노출·인라인 onclick 이름은 노출 줄을 원래 자리, 로드 중 문은 본문만 세포 함수로 하고 원래 자리에 부르는 한 줄.
docs/architecture/INLINE-HARD-SPLIT-DESIGN.md 2절·4-1 빌더 절차, gen-inline-hard.js 설정(take.names·keepRest·afterTag·headerPick). 묶음은 번호가 아니라 제목으로 찾는다(번호는 병합마다 밀림).
출처: [762,834]
## lesson-L017
CSS 은폐(display:none !important)가 든 코드 묶음은 그대로 새 파일로 옮기면 법정이 「CSS 은폐 줄 새로 추가」로 돌려보내니, 숨김을 먼저 정리(삭제는 승인선 ③)한 뒤 옮겨라.
묶음에 !important 숨김이 있으면 건너뛰고 결함 목록·결심 후보로 올린다.
출처: [785]
## lesson-L018
옮길 묶음이 로드 중에 아직 옮겨지지 않은 인라인 함수를 부르면 세포 로드가 깨지니, 그 초기값은 원래 자리에 남겨라.
court/probes/module-load.js 로 기준 사본·작업 양쪽을 로컬 실행해 회귀 0 확인. 생성기에 로드 중 호출 검사를 둔다.
출처: [760]
## lesson-L019
새 세포는 기존 탭 키트(OurgoalCalendarKit 등)에 함수를 달고, 새 window 전역을 만들지 마라.
var K = global.OurgoalXxxKit = global.OurgoalXxxKit || {}; 형식. 덮어쓰는 키트(유형 M)는 afterTag 로 그 파일 태그 뒤에 넣는다.
출처: [765,762]
## lesson-L020
이름 접두(L.)를 붙일 때 문자열·주석 안 글자는 절대 건드리지 마라.
스코프 분석 생성기만 쓰고 정규식 치환으로 접두를 붙이지 않는다. 검수는 문자열 포함 토큰 대조 + 기준·작업 화면 시나리오.
출처: [765]
## lesson-L021
원본 index.html 만 읽어 이전 뒤 깨지는 시험지는 옮기기 전에 시험지 선행 PR 로 읽는 범위만 넓혀라 — 단언·기대값·검사 수는 0 변경.
const html = require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(...)) 처럼 읽는 줄만 바꾼다. 병합 전 gh pr diff 로 tests/ 삭제 줄에 assert 가 없는지 확인. 실측 도구 scripts/inline-hard-test-probe.js 가 놓치는 시험지가 있으니 옮긴 뒤 tests 전부 종료 코드를 기준과 비교한다(#780 발견).
출처: [751,753,757,758,768,769,770,771,779,780]
## lesson-L022
시험이 낡은 가짜 객체(픽스처) 때문에 실패하면 단언은 그대로 두고 픽스처 이름만 고쳐도 된다 — 단 기대값은 건드리지 마라.
court/README 규칙(검사를 약하게 하는 변경 금지)과 대조해, 검사를 강하게 하거나 그대로인 변경만 한다.
출처: [777]
## lesson-L023
기준선(module-baseline.json)은 손으로 고치지 말고 module-guard --update 로만 바꾸며, 측정기가 오탐하면 기준선을 올리지 말고 측정기를 고쳐라.
오탐 사례와 진짜 사례를 함께 고정하는 시험을 추가하고(기존 단언 0 변경), 현재 main 의 지표가 그대로인지 확인.
출처: [792,794]
## lesson-L024
main 의 생성 지도가 낡아 cell-map-publish 가 게시를 거부하면 버리는 worktree 에서 origin/main 으로 재생성한 값으로 게시하고, 다음 일괄 갱신 PR 로 저장본을 맞춰라.
git worktree add --detach <tmp> origin/main → 생성기 3종 → cell-map-publish --root <tmp> → --verify-notion → worktree 제거.
출처: [761,787]
## lesson-L025
닫힌 <details> 안의 단추가 「가려짐·죽은 클릭」으로 잡히면 결함으로 단정하지 말고, 바깥 details 를 펼친 뒤 elementFromPoint·진짜 마우스로 다시 눌러 확인하라.
court/lib/scenario.js 클릭 도구로 기준 커밋에서 375·1280 두 폭, 바깥 details 펼친 뒤 클릭.
출처: [767]
## lesson-L026
조작 DOM 비교는 기준 대 기준도 함께 돌려 본질 변동(타이밍·난수·실행마다 다른 저장값)을 걸러낸 뒤 기준 대 작업 차이를 판단하라.
Math.random 씨앗 고정, 실행마다 다른 키는 비교에서 빼고 그 사실을 REQ 에 기록. tab-check 는 기준 2회·후 1회.
출처: [764,772,773,775,836,837]
## lesson-L027
숨김 규칙에 갇혀 보이는 진입로가 없는 살아 있는 기능을 찾으면 숨김을 좁혀 보이게 복원하고, 새 숨김은 hidden-entry-guard 가 막게 하라.
scripts/hidden-entry-guard.js(npm test 안) + 느린 브라우저판 docs/design/harness/hidden-entry-sweep.js. 복원한 항목은 --update 로 허용 목록을 줄인다. 새 !important 숨김 0.
출처: [763,766]
## lesson-L028
동기화 큐·저장 경로는 실패를 삼키고 비우지 마라 — 성공한 항목만 지우고 실패는 남겨 재시도하며 사용자에게 알려라.
실패 재현 시나리오(오프라인 체크인 → 온라인 → 서버 실패)와 노드 시험(기준 실패·작업 통과)으로 입증.
출처: [783]
## lesson-L029
화면에서 바뀌는 사용자 데이터(마일스톤 체크 등)는 메모리만 바꾸지 말고 saveProfile 등 서버 원장 저장까지 연결하라.
게스트는 새로 고침 뒤 유지 시나리오, 로그인 서버 저장은 실계정 하네스로.
출처: [767]
## lesson-L030
값이 없을 때 그럴듯한 숫자를 넣는 대체값(|| 3, || 25, 하드코딩 Lv.1)은 허상지표다 — 실제 값이 없으면 숫자를 그리지 마라.
실제 계산 함수(computeStreakDays·levelProgress)를 쓰고 0·없음이면 그 줄/칸을 생략. 시험이 대체값을 정답으로 고정하면 결심(L008).
출처: [767,777,791]
## lesson-L031
코드에 박힌 가짜 사람·가짜 인원·전송 없는 성공 토스트를 발견하면 고치지 말고 결심 후보로 올려라(삭제는 승인선 ③).
결심 요청에 코드에서 읽은 실제 동작(문구·호출부·저장 칸)을 그대로 적고 권장안 하나와 선택지별 장단점.
출처: [767,777]
## lesson-L032
기능 삭제 결심을 올리기 전에 그 기능이 실제로 무엇을 하는지 코드로 확인하라 — 동작하는 기능이면 삭제 대신 진입로 연결·문구 정정으로 풀 수 있다.
grep 으로 정의·호출부 전수 확인 → 동작 여부 → 삭제가 정말 필요할 때만 [결심 필요].
출처: [767]
## lesson-L033
돈(구독·광고·크레딧·결제) 근처 묶음은 옮기기조차 하지 말고 건너뛰어 보고하라.
묶음 제목·이름에 subscription·paywall·ad·credit 이 있으면 손대지 않고 보고.
출처: [764,774]
## lesson-L034
안티그래비티에는 결과를 기계로 검사할 수 있는 반복 실행(스크립트 재생성·결정론 재실행·시험)을 맡기고, 판단이 필요한 코드 이동은 맡기지 마라.
C:\dev\agy-collab\TEMPLATE.md 로 지시서를 쓰고, 노션 「안티그래비티 작업 기록」 최근 5건 보완점을 반영.
출처: [765,787]
## lesson-L035
안티그래비티 지시서에는 git config 변경 금지·tests 수정 금지·본 체크아웃 실행 금지·임시 파일 저장소 밖·지시 밖 명령 금지·npm test 전경 실행을 반드시 넣어라.
TEMPLATE.md 의 Hard rules 를 지우지 않는다. 검수 첫 줄: git -C C:/dev/ourgoal-app config user.name 확인.
출처: [765,787]
## lesson-L036
안티그래비티는 「안전한 방법이 없으면 멈추고 보고하라」를 잘 지키니, 지시서에 멈춤 조건을 구체적으로 적어라.
「X 가 필요하면 STOP and report」 형식으로 조건을 나열.
출처: [767]
## lesson-L037
안티그래비티에 묶음을 맡기기 직전에 origin/main 에 그 묶음이 아직 있는지와 다른 빌더 배정과 겹치지 않는지 Claude 가 확인하라.
설계 문서 배정 칸에 「안티그래비티 몫」을 먼저 적고, inline-script-map 에서 제목으로 존재 확인.
출처: [756]
## lesson-L038
상민님 보고는 쉬운 한국어로 「한 것 / 측정으로 검증한 것 / 다음에 열리는 것」, 결심이 필요하면 [결심 필요] + 권장안 하나 + 승인 시 하는 일·그 다음 + 선택지별 장단점·예상 결과로 써라.
수치는 스크립트 산출(module-metrics 등)만 인용하고 출처 커밋을 붙인다. 질문으로 끝내지 않는다.
출처: []
## lesson-L039
병합한 세션은 같은 턴에 세포지도(웹·노션)와 허브 최상단 갱신 시각을 갱신하고, 노션 제목 줄은 {toggle="true"} 를 유지하라.
cell-map-publish --root . → 웹 db 원자 갱신·되읽기 deepStrictEqual → 노션 줄 단위 편집 → --verify-notion 「세포 펼침 N/N·영역 제목 16/16」 → jsDelivr 퍼지.
출처: [761,787]
## lesson-L040
빌더·에이전트에게 일을 줄 때 작업계획서 경로를 그 작업 트리 안(.claude/plan-작업번호.md)으로 지정하고, 커밋 훅이 쓰는 NODE_PATH 를 git commit 과 같은 셸에 export 하게 하라.
export NODE_PATH=C:/dev/ourgoal-app/node_modules; git commit ...
출처: [761]
## lesson-L041
git 훅을 건너뛰지 마라(--no-verify 금지) — 이름 바꾸기만 든 커밋이어도 예외 없음
훅이 막으면 원인(대개 NODE_PATH 미설정·티켓 태그 누락)을 고친 뒤 다시 커밋. NODE_PATH=C:/dev/ourgoal-app/node_modules 를 git commit 과 같은 셸에서 export
출처: [779]
## lesson-L042
화면에 안 보이는 기능은 옮기지도 고치지도 말고 「CSS 숨김에 갇힌 기능」 목록에 올려 결심으로 넘겨라
elementFromPoint·크기 0 으로 실측 → 숨긴 규칙 위치(파일:행) 기록 → 결함 목록·숨김 게이트 기준선과 대조 → 상민님 결심 표에 「실제로 하는 일」을 코드에서 읽어 적기
출처: [796]
## lesson-L043
작업 유형을 표준·이탈·탐색으로 분류하고, 이탈하면 사유 네 가지를, 새 유형이면 깊은 추론과 자체 검증 설계를 기록으로 남겨라
추론 블록 「분류」에 판정(가/나/다)과 근거. 이탈: ①어느 규칙 ②왜(사실) ③대신 무엇 ④검증 동급 이상 — REQ·보고에. 새 유형: 가까운 유형 차용·8원칙 전부·반론 2개·실패 예측·검증 설계 → 끝나면 lessons.json 에 유형 추가. 불변층은 예외 없음
출처: [800]
## lesson-L044
헌법 개정은 세 사본 동일(cmp)·버전 표기·이전 커널 archive 보관·상민님 직접 병합까지가 한 묶음이다 — 병합 뒤 홈 사본(C:/Users/HP/AGENTS.md)과 버전 대장 행을 같은 턴에 맞춘다
PR 전: cmp AGENTS.md CLAUDE.md 01_…FULL.md 동일 확인, docs/rules/archive 에 이전 커널 원문. PR 후: cp 로 홈 사본 동기화·cmp 확인, CONSTITUTION_VERSIONS.md 행 추가 PR(금고라 다시 상민님 병합)
출처: [800]
## lesson-L045
로그인 뒤 경로 묶음은 --guest --count 로 도달을 먼저 재고, 로그인 뒤 동작 지시 항목에는 needs-login 주장 하나만 건다. 실계정 결과 파일은 별도 기록 항목(config)으로 분리한다
docs/architecture/INLINE-STAGE3-DESIGN.md 3-1(도달 실측)·3-2(기준1→작업→기준2 읽기 전용 비교, 쓰기 차단)·3-4(두 주장 배치). 보고에서 「글자만 확인」을 로그인 뒤 화면 확인으로 적지 않는다
출처: [802]
## lesson-L046
js/core 기관 키트(_uiKit 등)를 쓰는 세포는 자리 표지를 HO(기관)로 — 가져오기 줄이 키트 변수 선언보다 앞(H1~H4)에 들어가면 IIFE 머리에서 TypeError 로 앱 전체가 안 뜨는데 verify·node 시험은 통과한다
설정 slot 을 HO 기관 으로 쓰거나 생성 뒤 index.html 에서 가져오기 줄 위치 > 키트 변수 선언 위치를 확인. 법정 모듈 로드 탐침·게스트 시나리오(앱 부팅 포함)를 반드시 돌린다 — 토큰 대조만으로 부족(L0xx 안티그래비티 교훈과 같은 꼴)
출처: []
## lesson-L047
옮긴 코드가 대입하는 이름(assignedL)마다 index.html 의 「마지막」 get X() 노출 줄에 set X(v) 가 있는지 확인하라 — 뒤쪽 P0 이음매 블록의 getter-only 노출이 생성기가 단 setter 를 덮어 부팅 때 「Cannot set property X … only a getter」 가 난다
생성 뒤 이름마다 마지막 노출 줄 검사(검사기 ⑨ 추가 예정). 안 되면 그 대입 함수는 원래 자리에 둔다. 부팅 포함 게스트 시나리오·법정 모듈 로드 탐침 필수(L046 과 같은 꼴)
출처: []
## lesson-L048
검사를 강화하는 금고 단독 PR(「X 가 없다」 단언)은 그 X 를 지우는 본 PR 이 병합된 뒤에만 병합한다 — 순서가 바뀌면 main 의 npm test 가 깨져 모든 빌더의 측정이 오염된다. 자동 병합 훑기에서 금고·게이트 PR 은 제외하고 손으로 순서를 정한다
pass 스크립트 제목 필터에 금고·무결성 게이트 추가. 짝 PR(본 변경 → 게이트 강화)은 번호를 적어 두고 본 PR 병합 직후 연달아 병합. 깨진 창이 생기면 전 빌더에 「main 게이트 1건 실패는 알려진 상태」 공지
출처: [818,813]
## lesson-L049
index.html 을 바꾸는 PR 이 3개 이상 동시에 열리면 오케스트레이터가 병합 줄을 정해 한 번에 하나만 재생성·push 하게 한다 — 전원이 동시에 재합치면 병합 하나마다 전원이 다시 충돌해 10분씩 낭비된다
줄: 결심 PR → 가장 오래 기다린 PR 순. 선두만 push, 나머지는 측정 자료만 준비. 병합 즉시 다음 빌더에 알림. dev_log·TICKETS 만 충돌하는 PR 은 오케스트레이터가 합집합으로 바로 합침
출처: [814,815,819]
## lesson-L050
법정(court) 실행은 끝났는데 PR 에 판정 댓글이 안 붙으면 court-publish 워크플로(workflow_run)가 GitHub 대기열에서 취소·정체된 것이다 — 판정 정본은 court 실행의 artifact court-verdict/verdict.json(verdict·verdictId·head) 이므로 gh run download 로 받아 그 값으로 줄을 진행하고, PR 댓글에 실행 번호·artifact 출처를 적는다
gh run list --workflow court-publish 로 상태 확인 → gh run rerun 1회 → 그래도 queued 면 gh run download <court 실행> 으로 verdict.json 을 읽는다(head 가 PR 머리와 같은지 확인). 작업자 로컬 측정은 근거가 아니다 — artifact 만 근거
출처: [828]
## lesson-L051
reports 아래 측정 보고 파일의 값 적재 주장은 등록된 config 분야로 쓰고, 제품 동작 주장은 별도 실제 화면 시나리오로 검증하라.
court/grade-floors.json의 등록 분야를 읽는다. reports-only jsonPath 주장은 config, 제품 파일은 해당 분야의 실제 시나리오. 보고값이 적혀 있음은 법정이 실제 UI·실계정 결과를 재측정했다는 뜻이 아니다. 분류를 교정할 때 주장 철회·종류·기대값 변경 없이 원문을 유지한다.
출처: [829,831,839]
## lesson-L052
REQ의 표준 8원칙 서식을 먼저 기존 무결성 게이트로 검사한 뒤 전체 npm 검증을 실행하라.
REQ에 독립된 ## N. [원칙 ①]~[원칙 ⑧] 헤더, 원칙②의 본질·원인·중심·핵심, 원칙⑥ 재검증과 반론을 적는다. node scripts/verify-integrity-gate.js를 먼저 실행하고 문서 오류를 고친 뒤 npm test를 실행한다. 금고 검사 코드·기대값은 변경하지 않는다.
출처: [830,832,835]
## lesson-L053
UI 비교의 실행마다 다른 ID는 일대일 대응·키 개수·연결을 보존하고, 해시 차이는 실제 제품 계산식으로 입증하라.
기준2회·작업1회 원시 보존. 정규화 ID bijection·키 개수·연결 불변식을 확인한다. 실제 제품 AST에서 계산식을 읽어 남은 해시 차이를 검증한다. page.evaluate 버튼.click·함수 직접호출·상태주입으로 실제 UI를 대체하지 않는다. 못 잰 것은 측정불가.
출처: [837]
## lesson-L054
검증 수치를 원시 기록에서 자동 추출하고 제출 전에 증거 목록·입력 해시·필수 측정·참조 경로를 기계 검사하라.
C:/dev/agy-collab/TEMPLATE.md의 반복 누락 예방 항목을 지시서마다 유지한다. evidence-manifest.json에 측정/미측정/차단, 입력 커밋·SHA256·명령·종료코드·원시/게시 경로를 남기고 제출자료 검사기로 누락·파일 부재·파싱 실패·입력 불일치를 차단한다. 전체DOM/저장값/토스트/console 내용과 실제 click을 비교하고 npm과 개별 시험 결과를 구분한다. 원시 실패/성공을 보존한다. 검사기 도입의 효과는 TASK581부터 별도 측정하며 법정 판정을 대체하지 않는다.
출처: [838,839,840,841,842,844]
## recent-OURGOAL-AGY-SPLIT-RUN-20261006
[{"id":"submit-format-preflight","proposal":"제출 전에 공식 claims schema와 REQ 형식을 검사하고 측정 요약 파일을 공식 claims와 구분한다."}]
## recent-OURGOAL-AGY-SPLIT-RUN-20261006
[{"id":"submit-format-preflight","proposal":"제출 전에 공식 claims schema와 REQ 형식을 검사하고 측정 요약 파일을 공식 claims와 구분한다."}]
## recent-TASK-ES-584-INSTALLED-1
[{"proposal":"고정 런타임은 실제 작업폴더를 명시해 새 도구 세션에서 사용한다."}]
## recent-TASK-ES-584-INSTALLED-0
[{"proposal":"현재 제품 입력·실제 명령·원시·참조 경로를 대조하고 미측정은 완료라고 하지 않는다."}]
## recent-TASK-ES-584
[{"id":"proposal-evidence-linkage","proposal":"전체 읽기와 실제 적용/증거를 분리 연결하는 유형. 원장 자동승격 없음.","sourceTask":"TASK-ES-584"}]
## feedback-pending
{"failureGroups":[{"taskKind":"submission-preflight","causeId":"submission-schema-not-checked","uniqueConfirmedAtCollection":1,"currentlyMeasured":1,"observations":[{"failureId":"claims-format-required-fields","taskId":"OURGOAL-AGY-SPLIT-RUN-20261006","eventId":"learning-feedback-claims-failure-1791309564627","eventSha256":"7ce087c7ff8f7db7741b19f2e80666b039d60fa48093db13cb63dda340afe6f2","evidenceSha256":"84dea42e8cdd464f46af2ca9d9dd3b658f977c525aceb1e4525cae7f23934027","observedAt":"2026-10-06T17:59:24.831Z","summary":"측정 요약을 공식 claims로 제출해 필수 task/requirements/claims 형식이 누락됐다.","confirmation":"confirmed","evidenceValidity":"current-hash-checked","confirmedAtCollection":true,"currentlyMeasured":true}],"recommendation":null}],"recent3":[{"improvementId":"claims-format-repair","problem":"공식 claims 필수 구조 누락","action":"측정 요약 원문을 별도 파일로 보존하고 공식 claims schema를 검사한 제출 파일을 생성한다.","status":"verified","statusBasis":"collected worker record; not Court verdict","evidenceValidity":"current-hash-checked","effect":{"disposition":"pending-unmeasured","requiredMatchingTasks":5,"observedMatchingTasks":0,"samples":[],"repeatDefects":null,"evidenceMismatches":null,"repeatDefectsTargetMet":null,"evidenceMismatchTargetMet":null,"metrics":{"interventionMinutes":{"before":null,"after":null,"delta":null,"beforeSource":null,"afterSources":[]},"qualityDefects":{"before":null,"after":null,"delta":null,"beforeSource":null,"afterSources":[]},"repeatDefects":{"before":null,"after":null,"delta":null,"beforeSource":null,"afterSources":[]},"evidenceMismatches":{"before":null,"after":null,"delta":null,"beforeSource":null,"afterSources":[]},"tokens":{"before":null,"after":null,"delta":null,"beforeSource":null,"afterSources":[]},"progressUnits":{"before":null,"after":null,"delta":null,"beforeSource":null,"afterSources":[]}},"modelProgress":null,"tokenSavings":null,"improvementConclusion":null,"productVerdict":null},"evidenceRefs":["6c6f8e79b7bafe9f5822d19b92ccdbc5acf8e781feec49bee535d873f6db4c47"],"measuredAt":"2026-10-06T17:59:25.030Z","taskId":"OURGOAL-AGY-SPLIT-RUN-20261006","eventId":"learning-feedback-claims-fixed-1791309564627","eventSha256":"07a88629294bed443a4c67245436425b2c40097dc254593725eca8881a02a45e","failureRef":{"eventId":"learning-feedback-claims-failure-1791309564627","eventSha256":"7ce087c7ff8f7db7741b19f2e80666b039d60fa48093db13cb63dda340afe6f2","failureId":"claims-format-required-fields","taskId":"OURGOAL-AGY-SPLIT-RUN-20261006"}}],"promotionPolicy":{"automatic":false,"commonObservedThreshold":3,"adapterObservedThreshold":2,"conflictDisposition":"proposal-only"}}
