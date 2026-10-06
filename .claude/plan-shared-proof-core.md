목표: 분열 증거의 필수 관측·입력·전후·기준 재현을 공통 CLI로 빠짐없이 연결한다.

공통 taskId: OURGOAL-AGY-SPLIT-RUN-20261006. 부모 정본: C:/dev/ourgoal-app/.task-links/01a10f06-agy-run.json. 부모 원격 상태는 root만 sync한다. 하위 구현 담당 Codex shared_learning_tools_584, 로컬 연결 .task-links/shared-proof-core.json(원격 동기화는 root 인계).

- [x] 설계·PR843 작업참고·기존 감사 확인 · 예상 10분 · 원인과 경계 식별
- [x] 독립 8원칙 REQ와 실행 계약 구현 · 예상 30분 · 누락시 gate false와 비0 종료(코어 단위 원시21조건 기록)
- [x] 실제 기존 raw 읽기·최소 코어 단위 자료 CLI 측정 · 예상 15분 · 누락/변조 원시 종료코드 보존(legacy6파일·단위21조건·npm종료0)
- [ ] 정상 훅 commit 및 root 인계 · 예상 10분 · commit SHA와 독립 검토 가능한 파일 제공

막힘 예상: 기존 raw의 수집 필드 부재는 미측정으로 넘긴다. 번호는 root 예약 확인 후 연결한다. push·PR·Court는 root가 담당한다. 동적 치환은 provenance 없이 허용하지 않는다.

측정 출처: reports/shared-proof-core/measurement.json, legacy-582-missing.json, legacy-585-missing.json, npm-test-result.json. 독립 감도·실제582/585 UI 동등성은 아직 미측정이며 작업자 단위 검사가 대체하지 않는다.
