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
# 작업 중 실패·최근 개선·재검토 연결

기존 `collect`는 작업 종료 전에도 이벤트를 수집한다. 실패 원인을 다음 세션에 전달하려면 기존 이벤트에 선택 필드 `feedback`을 추가한다. 새 원장이나 승격 정책을 만들지 않는다. 아래 명령은 이 확장이 병합·설치된 CLI에 적용된다. 고정 진입점의 설치 버전은 root가 별도로 갱신한다.

```powershell
node C:/dev/agent-knowledge/shared-learning.js collect --repo-root <실제작업tree> --event <이벤트JSON> --expected-source-hash <읽은lessonsSHA>
node C:/dev/agent-knowledge/shared-learning.js report --repo-root <실제작업tree> --task-kind <작업유형>
```

`feedback.schema`는 `learning-feedback/1`, `phase`는 `in-progress/completed/followup`, `executionRoot`는 실제 작업 tree다. `failures/improvements/metrics`는 배열이다. 실패에는 `failureId/causeId/summary/observedAt/confirmation/evidenceSha256/checkerId/scope`를 기록한다. `confirmation=confirmed`는 비0 종료 또는 원시 `result.confirmedFailures`의 같은 failureId/causeId에 연결해야 한다. 필수 검사의 실패를 수집할 수 있다는 뜻이며 검사 성공이나 작업 완료라는 뜻은 아니다. 새 bootstrap의 `feedback-pending`에는 수집된 실패와 최근 개선이 나타난다. 같은 원인의 고유 task·입력·원시·범위 증거가 반복되면 담당/방법 재검토를 권고할 뿐 자동 재배정·권한 확대·규범 승격은 하지 않는다. 기존 공통3/adapter2 충돌은 그대로 제안 상태다.

개선에는 `improvementId/problem/action/status/measuredAt/failureRef/evidenceRefs`를 둔다. `failureRef`는 수집된 `{taskId,eventId,eventSha256,failureId}`다. 상태는 `instructed/implemented/verified/applied`로 구분하며, 검증·적용 상태는 비0 아닌 원시 결과의 `improvementStatuses[improvementId]`와 일치해야 한다. 이는 작업자의 기록 근거 대조이며 독립 판정이 아니다. `report.recent3`는 같은 개선의 최신 기록을 하나로 합쳐 최근 3건을 읽기 전용 산출한다. 새 고유 건이 없으면 기존 3건이 유지되고 새 건이 생기면 오래된 건이 빠진다. 증거가 사라지거나 변경되면 기존 상태와 `evidenceValidity=unmeasured-or-changed`를 함께 보여 준다.

증거 재검토는 `report --review-ref <참조JSON>`으로 요청한다. 참조는 `{taskId,eventId,eventSha256}`다. 수집 전 명시한 증거 `reuseContract`의 `declaredBeforeRun/declaredAt/dependencies/executors`와 원시 봉투의 동일 계약, 현재 파일 SHA를 대조한다. 각 파일 항목은 `{path,sha256}`다. 실행기에는 실제 검사·비교기를 포함해야 한다. work-after는 전체 제품 입력 SHA도 대조한다. 계약 부재는 미측정, 변경은 재측정 권고, 동일은 `reuse-candidate`이며 검증 생략 승인이나 다른 head의 after 복사 허용이 아니다.

후속 이벤트의 `feedback.followupOf`는 원래 수집 이벤트의 정확한 task/event/SHA를 가리킨다. 같은 유형의 다음 고유 5개 작업을 연결하며 같은 작업의 후속 보완은 최신 이벤트로 읽는다. `metrics` 항목은 `{name,value,evidenceSha256}`, 원시 `result.metrics[name]`과 같은 값이어야 한다. 이름은 interventionMinutes/qualityDefects/repeatDefects/evidenceMismatches/tokens/progressUnits다. 원래 before 출처나 5개 after 출처가 없으면 해당 값·delta는 null이다. 반복 결함·증거 불일치 0은 실측 표본이 모두 있을 때만 표시한다. 모델 진행량·토큰 절감·개선 성공 결론은 이 도구가 산출하지 않는다.

다른 tree의 원시 근거를 다시 읽으려면 명시적 `--read-roots <허용root배열JSON>`에 그 tree를 포함한다. 읽기 허용이 없으면 수집 기록은 발견하지만 현재 측정은 미측정이다. 원시와 수집 SHA·봉투 대조는 입력 자체가 진실하거나 명령이 실제 실행됐다는 증명이 아니다. 독립 검토와 Court를 대체하지 않는다. 수집 잠금 중 보고는 `FEEDBACK_STORE_WRITING_RETRY`로 재시도를 요구하며 부분 기록을 확정 상태로 읽지 않는다.
