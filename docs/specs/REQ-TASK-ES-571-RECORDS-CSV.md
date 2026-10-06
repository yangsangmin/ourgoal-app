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
