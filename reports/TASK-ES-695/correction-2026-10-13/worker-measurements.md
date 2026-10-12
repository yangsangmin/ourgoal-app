# P0 보완 작업자 측정(법정 판정 아님)

과정 → 본질 → 결과 순으로 읽는다. 수치는 finalize.cjs가 원시 JSON·명령 결과에서 뽑았다. 첫 측정과 기존 measurement.json은 그대로 보존한다.

## 과정

고정 PR 머리의 독립 반례를 글자 그대로 before/after 사본에서 실행했다(independent-manifest.json). 종료·읽기 실패·다음 저장은 sequence-probe.json, 두 함수 직접 호출은 direct-calls.json과 browser/before·after/direct-results.json에 있다. 첫 추가 순서 실패와 목표 fixture 누락은 별도 원시 파일로 보존했다.

## 본질

기기 고유 자료를 다른 탭의 옛 값 복구로 지우지 않는다. 사본 고유 자료를 먼저 보관하고, 현재 원문을 보관한 뒤 복원하며 둘째 쓰기 실패를 성공으로 표시하지 않는다. 본문 차이·깨진 원문 보관 실패는 다음 저장의 백업 교체도 멈춘다. 서버 요청·화면 상태·렌더 순서는 고정 VM 직접 호출 대조에서 같았다.

## 결과

| 독립 반례 | 첫 구현 | 보완 뒤 |
|---|---|---|
| unique previous records | {"uniquePreviousStillAnywhere":false} | {"uniquePreviousStillAnywhere":true} |
| unique previous goals | {"uniquePreviousStillAnywhere":false} | {"uniquePreviousStillAnywhere":true} |
| broken previous overwritten | {"brokenRawRetained":false} | {"brokenRawRetained":true} |
| kept transient read errors lose old kept | {"oldKeptRetained":false} | {"oldKeptRetained":true} |
| failed kept text-diff followed by save | {"feedbackAfterNextSave":false} | {"feedbackAfterNextSave":true} |
| rollback drops sole current after interrupted swap | {"uniqueCurrentRetained":false} | {"uniqueCurrentRetained":true} |
| quota release destroys sole previous record | {"uniquePreviousRetained":false} | {"uniquePreviousRetained":true} |
| stale two-tab plan overwrites concurrent append | {"concurrentNewRetained":false} | {"concurrentNewRetained":true} |

원래 부품 시험: {"total":26,"passed":26,"failed":0,"exitCode":0}. 추가 순서 단언: {"count":20,"assertionsNotHeld":0,"source":"sequence-probe.json","initialFailureSource":"sequence-probe.initial-failed.json"}. 직접 호출 비교: [{"which":"syncServerRecords","failing":false,"serverSame":true,"stateSame":true,"renderSame":true,"beforeEditedFeedbackRetained":false,"afterEditedFeedbackRetained":false},{"which":"syncServerRecords","failing":true,"serverSame":true,"stateSame":true,"renderSame":true,"beforeEditedFeedbackRetained":false,"afterEditedFeedbackRetained":true},{"which":"migrateGuestDataToUser","failing":false,"serverSame":true,"stateSame":true,"renderSame":true,"beforeEditedFeedbackRetained":false,"afterEditedFeedbackRetained":false},{"which":"migrateGuestDataToUser","failing":true,"serverSame":true,"stateSame":true,"renderSame":true,"beforeEditedFeedbackRetained":false,"afterEditedFeedbackRetained":true}].

브라우저 정상 저장·다시 열기·용량 부족은 summary.json의 browserReopen/browserGoals/browserQuota를 읽는다. 실제 앱과 Chrome을 썼지만 세션·응답은 가짜이고 바깥망은 차단했다. 직접 함수 호출을 실클릭 E2E로 부르지 않는다. 기존 정상 UI 도구의 실제 마우스·직접 호출 섞임은 원시 도구에 그대로 드러난다.

## 남는 경계와 미측정

{"baseCommit":"db82811639c703f95c2349f2045dd443b7cec01f","path":"actual syncServerRecords at original main with concurrent setItem hook","baseRetainsConcurrent":false,"correctedRetainsConcurrent":false,"note":"same missing CAS boundary; not a new safety guarantee; B single-writer design is separate","correctionInjection":{"position":"another writer inside the final setItem after the last read","result":{"kind":"records","ok":true,"stage":"written","reattached":0,"keptAdded":0,"prevWritten":true,"backupWritten":true,"held":0},"concurrentRemains":false,"scope":"synchronous injection; CAS absent; not actual browser interleaving"}}

마지막 read→setItem 사이 경합은 원래 main과 보완 뒤 모두 자료를 남기지 못했다. 새 회귀 수정과 전체 두 탭 저장 안전은 다르다. 한 탭 작성자의 직렬화는 B 범위다. P0 조건 전체 충족·저장 안전 완료로 일반화하지 않는다.

미측정: operating server, real accounts, native device, actual abrupt browser termination, physical partial storage write, all browser tabs race interleavings, service worker and installation. 계획 완료는 커밋·연계 검사 뒤에만 기록한다. 사용자 실제 사용 가능·장기 효과 확인은 미확인이다. 운영 서버 요청은 이 재현의 구조상 0이다. 새 독립 검토·법정 판정은 root가 고정 머리로 받는다.

기기 용량 재현의 원문 전체 동일은 false이다. 첫 구현 raw-after/07-p0-quota-after.json도 false였다: 보관 실패 직후의 commit은 원래 백업을 유지하지만 부팅 뒤 기존 saveProfile이 화면 자료+held 누락id를 쓰므로 서버 칸·배열 순서가 달라질 수 있다. 고유 미전송 기록 보존과 원문 전체 동일을 같은 뜻으로 쓰지 않는다.

복원 전에 현재 자료를 restore-current로 글자째 보관하므로 성공 복원도 보관 공간을 더 쓴다. 같은 원문은 중복하지 않지만 삭제 정책은 없다. 공간이 없으면 복원을 멈춘다. 설정·전체 프로필의 기타 쓰기에 대한 실제 공간 영향은 미측정이다.
