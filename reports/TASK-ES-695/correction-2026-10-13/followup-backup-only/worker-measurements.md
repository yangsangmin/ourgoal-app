# 유일 백업 부가 칸 손실 보완 — 작업자 측정(판정 아님)

## 과정

기존 독립 확인의 새 명백한 오류를 수정했다. 공급된 direct-backup-only.cjs/JSON은 읽기만 해서 원본을 보관하고, c5d95027과 수정 제품 사본에서 같은 도구를 실행했다. 기존 원시 자료와 주장은 덮지 않았다. 이전 직접 호출 입력은 화면에도 사진·피드백이 이미 있어 유일 백업을 읽어야 하는 경우를 놓쳤다.

## 본질

정상 백업 쓰기도 같은 계정·id의 기기 부가 칸을 로컬 쓰기 사본에만 되붙인다. 화면 배열·서버 payload는 바꾸지 않는다. 입력에 명시된 null/undefined/빈글·다른 사진/피드백은 덮지 않고 빠지는 옛 기기 값을 보관한다. 본문이 다르면 옛 피드백·구조는 되붙이지 않고 본문과 함께 보관한다. 본문 차이의 사진·에너지·집중 처리는 계약 조건③과 기존 시험대로 유지한다. 다른 주인·휴지통·kept-only 자료는 정상 저장에서 자동 되붙이지 않는다.

## 결과

독립 입력 전후: [{"which":"syncServerRecords","beforePhoto":null,"beforeFeedback":null,"afterPhoto":"unique-photo","afterFeedback":"visible-feedback","afterEnergy":60,"afterFocus":40,"serverSame":true,"screenStateSame":true,"renderSame":true,"backupOnly":true},{"which":"migrateGuestDataToUser","beforePhoto":null,"beforeFeedback":null,"afterPhoto":"unique-photo","afterFeedback":"visible-feedback","afterEnergy":60,"afterFocus":40,"serverSame":true,"screenStateSame":true,"renderSame":true,"backupOnly":true}]

기존 부품 시험: {"total":26,"passed":26,"failed":0,"exitCode":0}. 이전 반례: {"rows":[{"name":"countercases.cjs","exitCode":0,"error":null},{"name":"comparative.cjs","exitCode":0,"error":null},{"name":"prior-sequence","exitCode":0,"error":null}],"originalCountercasesRetained":true,"sequence":{"total":20,"assertionsNotHeld":0,"boundary":{"position":"another writer inside the final setItem after the last read","result":{"kind":"records","ok":true,"stage":"written","reattached":0,"keptAdded":0,"prevWritten":true,"backupWritten":true,"held":0},"concurrentRemains":false,"scope":"synchronous injection; CAS absent; not actual browser interleaving"}},"scope":"prior probes copied without editing; product snapshot; no operating requests"}. 새 변형 단언: {"total":15,"assertionsNotHeld":0}.

Chrome에서도 두 정상 호출을 각각 새 브라우저에서 재현했다. before는 백업의 두 고유 값이 없고 after는 사진·피드백·에너지·집중이 백업에 남았다. 화면 객체에는 사진·피드백을 자동 삽입하지 않는다. 실제 앱/Chrome 직접 호출이지만 세션·응답은 가짜이며 실제 운영/E2E가 아니다. browser/*/results.json을 읽는다.

## 한계·앞 실패 보존

조건④ 전체 완료·실운영 사용 가능·효과 확인은 미확인이다. 미측정: real accounts and operating server, actual deletion UX, native device, service worker, all two-tab interleavings, all save routes and all payload fields. 마지막 read→set 탭 경계는 앞 차수처럼 남는다. 명시적 비움·휴지통 단언은 저장 함수 입력을 주입한 것이고 실제 삭제 화면 여정을 본 것은 아니다. 숨긴 보관을 화면 복원이나 서버 전송과 같은 뜻으로 쓰지 않는다.

처음 이번 차수 구현에서는 보관 확인 실패를 false로 반환해 이전 순서 시험의 예외 단언 두 개가 깨졌다(prior-sequence.initial-failed.json). 기존 정상 저장 쓰기 실패의 예외 계약을 유지하도록 최초 보관 실패는 예외를 내고, 뒤 저장은 기존 blocked 규칙대로 원본을 유지하게 고쳤다. 원래 시험은 바꾸지 않았고 새 변형 시험은 이 예외 계약과 실제 원본/다음 저장 보존을 함께 검사한다.

이번 보관이 추가 공간을 쓴다. 여유가 없으면 원래 백업 교체를 멈춘다. 기존 화면의 저장 실패 표시·서버 실패 처리·다른 저장 경로 전체는 P0로 해결한 것이 아니다.
