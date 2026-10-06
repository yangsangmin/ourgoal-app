# 공통 분열 증거 코어

작업자 증거 검사다. Court 판정·명령 실제 실행의 진실성·제품 안전을 대신하지 않는다. 공개 출력은 코드·필드 경로만 남기며 DOM/스토리지/오류 본문은 출력하지 않는다. 원시는 별도 비공개 scratch에 둔다.

```text
node docs/design/harness/shared-proof/cli.js --request <request.json> --evidence-root <비공개증거폴더> --base1-root <기준입력사본> --base2-root <기준입력사본> --after-root <작업입력사본>
```

모든 경로·역할을 명시한다. stdout JSON의 exitCode와 실제 종료코드는 같다. schema/input/dynamic/baseline/work/sensitivity 전체가 true이고 오류0일 때만0이다. 독립 감도가 없으면 다른 비교가 같아도 비0이다.

request schema `shared-proof-request/1`은 adapter `{path,sha256}`, 정확 순서 runs `[base1,base2,after]`를 요구한다. run마다 `{role,path,sha256,binding:{sourceCommit,manifestSha256,harnessSha256,harnessPath,adapterPath}}`를 둔다. 원시·adapter·감도 파일은 evidence-root 안의 상대경로만 허용한다. 입력 파일도 각 입력 root 안에 물리적으로 존재해야 한다. realpath 검사로 탈출·symlink 외부참조를 막는다.

run schema `shared-proof-run/1`: runId/sourceCommit/manifestSha256/harnessSha256/adapterSha256/completed/error/startedAt/endedAt/inputFilesBefore/inputFilesAfter/steps. manifest SHA는 JSON.stringify(inputFilesBefore)의 SHA256이며 배열 순서도 보존한다. 각 `{path,sha256}` 입력을 실제 root에서 다시 읽는다. adapter·harness는 manifest에 포함한다. before/after 정확 일치와 base1/base2 동일 제품 입력을 요구한다.

각 step은 id/fullDom/fullDomSha256/featureDom/localStorage/sessionStorage/toasts/consoleErrors/pageerrors/postconditions/functionEntries를 가진다. storage는 키와 원래 값·타입을 보존한다. 함수 진입 정수 횟수는 내부 range coverage와 구별한다. click 단계는 실제 mouse·target·success·isTargetOrDescendant·inViewport·nonZero를 기록한다. 이는 collector 계약값 교차검사이며 실제 마우스 실행의 독립 증명은 아니다.

전체 DOM은 현재 정확한 원문 대조다. 공백·script·style·날짜·ID를 일괄 지우지 않는다. 원문 차이는 구조가 같더라도 보수적으로 차이로 기록한다. 파서 기반 동적 script 위치 분리와 일대일 provenance 매핑은 현재 미지원이다. dynamicContracts가 하나라도 있으면 DYNAMIC_PROVENANCE_UNMEASURED로 거부한다. 불완전한 동적 계약을 받아 거짓 동등성을 내는 것보다 수집 보완을 요구한다.

task582/task585 adapter는 기존 단계 목록 발견 사본이고 collectionReady=false다. 실제 UI 후조건·함수별 단계 배정·click 대상·생성 provenance는 각 작업 수집 담당자가 확정해야 한다. 기존 raw를 새 스키마인 것처럼 변환해 완료하지 않는다. legacy-inspect.js는 내용을 복사하지 않고 실제 누락 필드/단계 이름/SHA만 보고한다.

독립 감도 schema `shared-proof-sensitivity/1`: independent=true,coreSha256,adapterSha256,inputShas(3원시SHA),cases(정확 adapter.negativeCases). 각 case는 id/changedExistingValues/exitCode/rejectionGate/mutatedRawPath/mutatedRawSha256/resultPath/resultSha256를 요구하며 실제 변이 원시·결과 SHA와 gate를 대조한다. 원시 결과 기록 역시 독립 실행 담당자의 증거이며 암호학적 실행 인증이 아니다. mutation-audit.js 및 negative-case 선택·실제 변이는 독립 담당자 소유다.

CLI 결과 expectedInputShas는 request의 선언 SHA, actualReadInputShas는 실제 읽은 원시 바이트 SHA다. raw-sha 카나리는 expected를 원본으로 유지하고 actual만 변형되므로 둘을 구분한다. 감도 연결은 actualReadInputShas의 변이 원시 SHA를 대조한다.

감도 케이스의 반려 gate는 common.js의 negativeCaseGates에 고정되어 있다. 감도 자료 부재 자체의 비0 종료는 DOM 변조 감도가 아니다. 기본 15케이스는 반드시 제출하며, 날짜·seed·ID·기기 등 추가 동적 케이스는 해당 실제 경로와 독립 변이 자료가 없으면 미측정이다. mutation-audit.js는 기본 케이스 실행기를 독립 담당자가 작성했다. 알려지지 않은 케이스를 임의 완료하지 않고 비0 종료한다.

단위 자료는 이 새 도구 계약만 측정한다. 가짜 제품 E2E나 실계정 증거로 쓰지 않는다. 효과 개선은 측정 전 null이다.
