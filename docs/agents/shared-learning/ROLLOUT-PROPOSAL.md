# 실행 순서 및 롤백 제안 — 아직 미실행

실행 담당은 root 하나다. PR842 최종 head의 독립 법정 판정과 root 검토 뒤 아래 순서로 진행한다. 정본 원장·기존 경험칙 확인 횟수·승격 정책은 바꾸지 않는다. 권한/역할/헌법/금고 변경은 이 계획에 없다. 공통3회/adapter2회 충돌 해결은 별도 제안으로 남긴다.

1. `rollout-proposal.json`의 모든 expectedSourceHash를 실제 파일 SHA256와 대조한다. 노션 두 페이지의 전체 Markdown을 먼저 읽고 SHA256와 갱신시각을 기록한다. 해시가 다르면 변경 전 snapshot을 새로 읽고 검토하여 expectedHash를 갱신한다. 이전 파일·노션 전문은 공개 Git이 아닌 `C:/dev/agent-learning-backups/<실행ID>/`에 byte 그대로 보존한다. 실행 기록에 원래hash와 백업hash가 같음을 기록한다. 본 변경은 노션 대화 전문·비밀값을 새로 모으지 않는다.
2. `localChanges` 네 파일은 기존 바이트를 접두로 그대로 보존하며 `appendText`만 utf8로 추가한다. 실행 직전 다시hash를 검사하고 동일 안내 표식이 있으면 idempotent로 끝낸다. 기존 금지문·전체읽기 문구·승인선 문구를 삭제하거나 수정하지 않는다. `localChanges[].executable`은 바로 실행 가능한 Node builtin 명령이다. proposal 자체는 자동 실행하지 않는다.
3. 기존 생성기를 사용한다: `node C:/dev/agent-knowledge/gen-reference.js --pr <실제병합PR> --commit <실제병합커밋>`. 실행 전 `WORK-REFERENCE.md`와 `reference-meta.json`도 같은 백업에 보존한다. 새 결과는 전체참고+얇은연결을 포함하며 `lessons.json`의 전후 bytehash는 동일해야 한다.
4. origin/main 새 전용 트리에서 사본 갱신 PR을 만든다. `docs/agents/lessons.json`의 구43개 원문은 `docs/agents/history/<기준PR>-lessons.json`으로 byte 보존한다. 로컬54개 원장·새 WORK-REFERENCE·reference-meta를 그대로 사본으로 둔다. 기존 ID가 새 원장에 모두 있는지, 각 새 ID/versionHash/출처/확인횟수가 로컬과 일치하는지, 실제 배열count와 헤더/meta가 같은지 스크립트로 검사한다. `docs/agents/README.md`에는 새 shared-learning/README.md의 상대링크만 추가한다. 새 권위·새 규칙을 선언하지 않는다. 정상훅·별도 PR·법정 뒤에 root가 병합한다.
5. 노션 공통참고 페이지와 Claude×AGY 플레이북 페이지의 원문을 재읽고 최초hash와 비교한다. 다른 편집이 없을 때 기존 Markdown 뒤에 `notionChanges[].appendText`만 추가한다. 현재 Notion Markdown API GET `/v1/pages/<page>/markdown`, PATCH의 `{type:"replace_content",replace_content:{new_str:<원래전체Markdown+추가문>}}`를 기존 연결로 사용한다. 서버의 원자적 CAS를 지원한다고 주장하지 않는다. 담당편집이 겹치면 pending으로 두고 재읽는다. 뒤에서 다시읽어 원래전체문구가 보존되고 새표식/링크/공유store가 정확한지 대조한다. 경험칙 DB·동반작업 DB의 기존행과 과거기록은 수정하지 않는다.
6. 새 Claude/Codex/AGY/generic 지시의 첫 줄은 여전히 WORK-REFERENCE 전체읽기다. 생성된 참고와 기존 TEMPLATE의 얇은링크로 발견한다. bootstrap/validate/collect 권장명령은 공유store 옵션을 생략한다. 새 작업 event를 수집한 뒤 두 독립 트리의 다음 bootstrap.recentEventIds 및 brief에서 해당 보완점이 나오는지 읽어 확인한다. 활성 세션의 자동 재주입·설치하지 않은 훅의 강제는 주장하지 않는다.
7. 실행 시각/각원천 전후hash/원장 전후같음/노션되읽기/사본PR/다음브리프 확인을 task-link와 프로젝트 정본에 연결한다. 장애인 단계는 pending이고 다른 단계 완료와 구분한다. 효과는 다음 같은유형5건에서만 재며 개입·품질 전후표본이 없으면 null이다.

롤백은 역순이며 기존 기록을 지우지 않는다. 노션은 현재 전체문서를 읽어 우리 표식 블록만 `update_content`로 제거하고 다른사람편집을 보존한다. 표식내용이 바뀌었으면 자동삭제하지 않고 pending으로 보고한다. 사본 동기화 PR은 별도 revert PR+법정으로 되돌린다. localChanges 네 파일과 생성물은 현재hash가 이번postHash와 같은 경우에만 byte백업을 복원한다. 현재hash가 다르면 원문 전체복원 대신 이번추가 표식만 제거하는 제안을 root가 검토한다. 공유 이벤트·원시증거·과거원장·백업은 그대로 남기고 기존도구 안내만 복귀한다. 되읽어 원래hash와 같은지 검증한다.
