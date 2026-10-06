# 작업자 측정 범위

`check.js`는 새 학습 도구 계약을 실제 CLI subprocess로 실행한다. fixture 봉투·상태·수치는 이 도구의 입력 연결 검사만을 위한 것이며 제품 E2E·실계정·업무 효과·실제 개선 완료의 근거가 아니다. 제품 판정과 실제 후속 효과는 null이다. 초기 허용 root 누락 실패와 수정 뒤 성공의 원시 출력은 `raw`에 분리 보존한다.

`check-result.json`은 스크립트 산출이다. 실패→collect→bootstrap, 같은 원인 반복 권고, 개선 최신3건과 새건 없는 유지, 실행기 변경, 후속 고유5건의 증거 연결 및 누락 before/delta null을 관측한다. `legacy-check-output.json`은 별도 `legacy-sandbox` 사본에서 실행한 기존33건 결과이며 기존 TASK584 보고서에는 쓰지 않았다. 상세 실행 입력/출력은 해당 사본 reports에 남는다.

수집·재조회는 정본 lessons·헌법·승인선·Court·제품·기존 시험 기대값을 변경하지 않는다. 수집자 기록의 사실성은 독립 확인 대상이다. 설치 runtime 갱신·PR·Court·병합은 root 담당이다.
