# TASK-ES-571 기록 CSV 내보내기 책임 분열
작업참고 기준 PR #824. 최초 main 0a2e424d, 최종 기준은 TASK569 병합 뒤 측정한다.
## ① 파악
index.html exportRecordsCsv(최초6192~6225), #btnExportRecordsCsv onclick, ui.css .export-card display:flex를 확인한다. 원래 window.exportRecordsCsv 노출 줄은 유지한다.
## ② 본질·원인·중심·핵심
기록 전체 파일 내보내기라는 단일 책임을 js/tabs/records/csv-export.js로 옮긴다. Blob URL 미해제 등 기존 동작도 유지하며 수정하지 않는다.
## ③ 해결방식
gen-inline-hard.js와 inline-csv571.json의 PHASE5 이름 선택·keepRest를 사용한다. OurgoalRecordsKit 및 _recordsKit, HO getter를 사용한다. 새 전역0·손이동0.
## ④ 재검토
tests 직접 함수 의존과 smoke FN_NAMES에 exportRecordsCsv가 없는지 검색한다. 생성기 토큰동일·restSame·누수0 및 seam 순서를 측정한다.
## ⑤ 절차
기준 원본 실제 버튼 호출 계측 → 빈 목록 toast → 홈 #captureInput/#captureSave로 실제 기록 생성 → 기록 CSV 버튼 실제 다운로드 파일 저장. 파일 BOM·헤더·한글·따옴표 escaping·toast를 기록한다. 운영 원격 writes는 차단한다. 준비 후 569 병합을 기다려 최신 main 기준으로 다시 생성한다.
## ⑥ 절차 재검증
반론1: 파일이 작아 분열할 필요가 약하다. 답: 줄 수가 아닌 독립 책임 기준으로 분열한다.
반론2: Blob를 가로채면 다운로드가 증명되지 않는다. 답: Browser.setDownloadBehavior로 실제 Chrome 파일을 저장하고 읽는다. UI가 만든 기록을 사용하며 상태 배열을 가짜 데이터로 바꾸지 않는다.
## ⑦ 단계별 실행
신고서·설명·claims·티켓·dev_log 함께 작성한다. 최종 전체시험은 Git baseline과 작업 양쪽 npm exit0·기존 종료코드 동일. tab 기준2/후1 및 게스트 조작차이0, standalone load 회귀0 측정 뒤 커밋한다. 기존 생성지도4개는 main 판을 보존한다.
## ⑧ 막히는 지점 예상
첫 기록 축하 모달이 버튼을 가리면 실제 닫기 버튼으로 닫는다. 계측은 원본 복사본에만 적용한다. 실패·미측정은 null로 보고하고 시나리오를 날조하지 않는다.

## 준비 측정(최종 증명 아님)
{"source":"reports/TASK-ES-571/csv-reach-success.json","calls":2,"emptyDownloadCount":0,"downloadBytes":200,"bom":true,"quoted":true,"pageerrors":[],"rowsWrittenRemote":0}
초기 실패 보고서는 삭제하지 않고 보존한다. 첫 기록 완료·AI 안내의 실제 닫기 버튼 순서를 넣은 뒤 성공했다. 보고 static 주장은 적재값 확인(config)이며 제품 proof의 독립 법정 판정으로 표현하지 않는다.

## 최신 main 최종 기준·시험 실측
최종 source e56210428d1a30e21631cd102b4bb8db65d60333. 토큰 입력은 git archive origin/main 사본, 시험 기준은 같은 커밋 detached Git worktree다.
{"source":"reports/TASK-ES-571/test-compare.json","baseNpmExit":0,"workNpmExit":0,"baseNpm":{"smoke":[440,0],"integrity":[38,38,0],"buttons":[918,918],"shipyardModularFiles":175,"moduleGuard":[6165,82,261,0,0]},"workNpm":{"smoke":[440,0],"integrity":[38,38,0],"buttons":[918,918],"shipyardModularFiles":176,"moduleGuard":[6133,81,261,0,0]},"files":115,"exitDiff":[],"outputDiff":[],"smokeTitleCount":[484,484]}
실행115개는 113시험지와 2helper다. 전체 비교 도구 자체 exit1은 의도된 인라인·함수·세포파일 수 감소/추가 및 그 수를 설명하는 출력 제목 차이이며 시험 종료 차이는0이다. 기대값·단언·시험수·폐기 변경0. 이 차이를 숨기거나 기대값을 바꾸지 않는다.

## 최종 화면·파일·출처 측정
{"source":"reports/TASK-ES-571/provenance-final.json","shots":[24,24,24],"independentPorts":true,"independentProfiles":true,"independentDebugPorts":true,"sourceHashesSame":true,"standardSourceDiff":"","baseCompared":408,"baseDifferent":0,"afterCompared":408,"afterDifferent":0,"csv":{"tool":"csv-compare571.js","inputs":["reports/TASK-ES-571/csv-base1.json","reports/TASK-ES-571/csv-base2.json","reports/TASK-ES-571/csv-after.json"],"normalization":"Only UUID and ISO timestamp values read from each actual saved record; equality of shared timestamp fields is preserved. Original JSON/file bytes retained. Transport blocked-request counts are metadata, not product values.","substitutions":[[{"raw":"5d71c650-81ae-4ef0-ad5f-da2088389ace","replacement":"<record-0-id>"},{"raw":"2026-10-06T04:10:53.490Z","replacement":"<record-0-startAt>"}],[{"raw":"d9e7908d-8a2b-4fa8-82e5-39ed60bc3ccc","replacement":"<record-0-id>"},{"raw":"2026-10-06T04:10:53.391Z","replacement":"<record-0-startAt>"}],[{"raw":"b2274e24-d4cb-4e5f-8fee-9f89f73fa6ea","replacement":"<record-0-id>"},{"raw":"2026-10-06T04:10:53.490Z","replacement":"<record-0-startAt>"}]],"normalizedCsvSha256":["8d7e7887b29c6a942b0d2e64e09004405c0b5a6ce728f3f2d79c362d47cb2e0c","8d7e7887b29c6a942b0d2e64e09004405c0b5a6ce728f3f2d79c362d47cb2e0c","8d7e7887b29c6a942b0d2e64e09004405c0b5a6ce728f3f2d79c362d47cb2e0c"],"base1VsBase2":{"comparedValues":165,"differingValues":0,"diffs":[]},"base1VsAfter":{"comparedValues":165,"differingValues":0,"diffs":[]},"base2VsAfter":{"comparedValues":165,"differingValues":0,"diffs":[]}}}
표준 tab-check 원문2구문만각1회 port0와 address실포트로 치환했고 MEASURE_FN·테마4·폭2·상태3·Chrome옵션·검사·기대값은 보존했다. 어댑터가 별도 module exports.main을 원래 인자로 실행하며 라이브러리 observer는 launch인자를 바꾸지 않고 실포트·profile·PID만 기록한다. 원본 표준3파일 diff0.

### PR #831 측정 도구 메타데이터 보강
법정 C5B91D8D의 C12·C33·C34는 주석 제거 후 설명 문자열이 없었다. 세 도구에 실제 실행 메타데이터(작업 ID·측정 방식·포트 배정 방식·원본 보존 정책)를 기록하고, 비교 도구는 입력 파일 덮어쓰기도 막는다. 기존 주장 ID·종류·검사·기대값·문장은 그대로다. 제품 및 시험지 변경은 없다.
`metadata-fix-validation.json`은 주석 제거 뒤 세 검사 문자열의 존재, 원본 입력 해시, 기존 CSV 비교 결과 동일함을 기록한다. `metadata-csv-boundary.json`과 `metadata-tab-boundary.json.adapter.json`은 경계 실행만 했으며 새 화면 측정으로 주장하지 않는다. 실제 CSV 다운로드·DOM 비교·탭 비교·전체 시험의 기존 증거를 보존했다. 전체 촬영과 시험은 반복하지 않았다.
