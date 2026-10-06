# 공통 작업학습 연결 사용법

첫 진입은 기존 `C:/dev/agent-knowledge/WORK-REFERENCE.md` 전체 읽기다. 없으면 저장소 `docs/agents/WORK-REFERENCE.md`를 읽고 fallback·최신성 차이를 기록한다. registry는 발견 안내이고 lessons.json을 대체하지 않는다. 아래 CLI는 명령을 실행하거나 권한을 부여하지 않는다.

현재 세션·새 세션·공동 조합에 같은 명령을 쓴다. `participants.json`은 각 참여자의 tool, role, worktree, owns 배열, allowedActions 배열을 책임자가 명시한 입력이다. Claude/Antigravity/Codex/알 수 없는 도구 모두 같은 계약이다. 알 수 없는 이름은 generic adapter를 연결한다.

```powershell
node docs/design/harness/shared-learning/cli.js bootstrap --source-root C:/dev/agent-knowledge --repo-root <전용트리> --participants <participants.json> --task-id <TASK> --task-kind <유형> --tool codex --out <bootstrap.json> --brief <brief.md>
node docs/design/harness/shared-learning/cli.js validate --source-root C:/dev/agent-knowledge --repo-root <전용트리> --read-roots <허용읽기root배열.json> --event <learning-event.json> --out <검사결과.json>
node docs/design/harness/shared-learning/cli.js collect --source-root C:/dev/agent-knowledge --repo-root <전용트리> --read-roots <허용읽기root배열.json> --event <learning-event.json> --expected-source-hash <읽은lessons.json의실제SHA256>
node docs/design/harness/shared-learning/check.js
```

bootstrap은 전체 공통 core+참여 도구 adapter+모든 경험칙 연결+최근 이벤트 5건 보완점을 생성한다. 전체 원문은 직접 읽어야 한다. 영수증은 파일 해시 기록이며 이해를 증명하지 않는다. 헤더 경험칙 수, 실제 배열 수, 기준 PR, ID별 내용 hash 차이를 표시한다. 로컬 원천을 읽을 수 없으면 fallback을 표시하며 최신이라고 선언하지 않는다.

`reports/<TASK>/learning-event.json`에는 eventId/taskId/taskKind, participants, readReceipt, appliedLessons, evidence, outcome, lessonCandidates, effectFollowup, requiredChecks, inputProductSha, briefPath를 둔다. 영수증은 sourcePath/sha256/basePr이며 전체 WORK-REFERENCE와 lessons 원장이 필수다. 적용 기록은 id/versionHash/scope/briefSection/checkerId/disposition이고 applied이면 evidenceRefs도 필요하다. checkerId=manual-with-evidence는 기계적 규칙 준수 판정이 아니다.

evidence는 checkerId/command/args/inputProductSha/inputFiles[{path,sha256}]/rawPath/rawSha256/publishedPath/publishedSha256/redaction{mode,transforms}/exitCode/measuredAt/scope/sourceTask/status를 둔다. 입력 제품 SHA는 정렬한 inputFiles 배열의 canonical JSON SHA256이다. 원시 JSON은 command/args/inputProductSha/exitCode/measuredAt/scope/sourceTask/result 실행 봉투를 갖는다. 원시를 가공하지 않고 게시 마스킹은 별도 사본·별도 hash·변환 내역으로 기록한다. 임의 문자열 로그는 실행 봉투 안 result로 보존한다. 모든 증거·입력 경로는 물리 realpath로 전용 트리 안인지 검사하며 읽기 원천은 명시한 read-roots 안으로 제한한다.

scope는 work-after/shared-baseline/tool-unit이다. 다른 TASK 증거는 sharedBaseline=true, originalScope=shared-baseline, 원래 sourceTask 및 동일한 실제 입력 hash인 경우만 허용된다. 다른 작업 after를 자기 after로 바꾸지 않는다. measured 단어만으로 성공이 되지 않는다. 필수 검사마다 exitCode 0 측정 또는 outcome.unmeasured에 checkerId/reason이 있어야 한다. 미측정은 exitCode/measuredAt=null과 reason을 기록한다. outcome은 courtUrl(없으면 null)/measurementOnly=true/unmeasured/regressions를 분리한다.

collect는 registry.sharedStoreRoot로 명시된 공유 이벤트 저장소(기본 C:/dev/agent-learning-events) 또는 전용 트리 안 pending root를 사용한다. 임의 외부 root는 막고 물리 경로·symlink를 검사한다. 원장을 수정하지 않고 task별 불변 이벤트를 쓴다. exclusive lock+expectedSourceHash CAS이며 동일 eventId/동일내용은 idempotent, 다른 내용은 충돌이다. 확인 키는 고유 sourceTask/제품입력/원시hash/scope다. 수집 횟수를 확인 횟수로 삼지 않는다. 제안·pending만 수집하고 기존 공통3회/adapter2회 승격 차이는 제안으로 남긴다.

권장 공동운영은 collect의 `--store-root`와 bootstrap의 `--events-root`를 생략하여 동일한 registry.sharedStoreRoot를 사용하는 것이다. bootstrap은 같은 공유 store의 `<TASK>/<eventId>.json`을 읽어 최근 이벤트 5건의 보완점을 다음 브리프에 연결한다. 공유 store 연결 장애 때만 collect에 `--store-root <전용트리/reports/learning-pending>`을 지정해 로컬 pending을 보존하고, 해당 트리의 다음 bootstrap에 `--events-root`를 같은 경로로 준다. 외부 동기화 완료라고 표시하지 않는다. 복구 뒤 동일 eventId/원시hash/expectedSourceHash로 공유store에 수집하고 idempotent를 확인한다. source-root 생략은 세 명령 모두 canonical→repository fallback 순서이며 선택 이유와 fallback 상태를 결과에 표시한다. fallback 원천은 읽기 전용이고 정본 최신성은 미확인 pending으로 구분한다. 서로 다른 worktree 두 곳에서 공유 store로 수집한 두 보완점을 각각 다음 브리프에서 확인하는 실제 CLI 검사를 포함한다.

효과 후속은 같은 유형 다음 5건의 반복 결함 0·증거 불일치 0을 재고, 개입시간·품질 전후 표본 출처가 없으면 null이다. 아직 도구 효과를 향상이라고 선언하지 않는다. CLI 검사는 제출 무결성만 확인하며 제품 안전·법정 판정을 대체하지 않는다. 이 검사 fixture는 신규 도구 단위 검사용이고 제품 E2E가 아니다.

롤아웃은 `rollout-proposal.json`을 root가 검토한다. 실제 전세션 진입문구·원장 사본·노션 연결 변경은 이 PR에서 실행하지 않는다.

이 도구는 작업자가 쓴 event의 진실성이나 명령이 실제 실행됐다는 사실을 독립적으로 증명하지 않는다. 원시 실행 봉투와 입력 파일 SHA, 읽기 영수증, 적용 링크의 일치만 확인한다. 잘못된 입력 선언도 모두 일관되게 꾸민 경우 별도 독립 검토가 필요하다. 사전 계약의 실제 파일과 원시 입력 교차검사 및 독립 Court를 함께 사용한다. TASK581→582 after 오사용 canary는 불변 Git 게시 바이트 및 당시 manifest 입력 hash에 대한 자료 무결성 차단 측정이다.
