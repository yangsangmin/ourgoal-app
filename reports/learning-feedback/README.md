# 작업자 측정 범위

`check.js`는 새 학습 도구 계약을 실제 CLI subprocess로 실행한다. fixture 봉투·상태·수치는 이 도구의 입력 연결 검사만을 위한 것이며 제품 E2E·실계정·업무 효과·실제 개선 완료의 근거가 아니다. 제품 판정과 실제 후속 효과는 null이다. 초기 허용 root 누락 실패와 수정 뒤 성공의 원시 출력은 `raw`에 분리 보존한다.

`check-result.json`은 스크립트 산출이다. 실패→collect→bootstrap, 같은 원인 반복 권고, 개선 최신3건과 새건 없는 유지, 실행기 변경, 후속 고유5건의 증거 연결 및 누락 before/delta null을 관측한다. `legacy-check-output.json`은 별도 `legacy-sandbox` 사본에서 실행한 기존33건 결과이며 기존 TASK584 보고서에는 쓰지 않았다. 상세 실행 입력/출력은 해당 사본 reports에 남는다.

수집·재조회는 정본 lessons·헌법·승인선·Court·제품·기존 시험 기대값을 변경하지 않는다. 수집자 기록의 사실성은 독립 확인 대상이다. 설치 runtime 갱신·PR·Court·병합은 root 담당이다.

독립 검토 e404fb03의 세 반례는 `fix-check-output.json`과 새 raw 실행에 복제했다. 정상 fixture는 원시에 특정 failureId/causeId를 기록하고, 존재하지 않는 원인/검사/효과 출처는 CLI exit2를 관측했다. 원인이 미확인인 비0 관측은 pending으로 수집되며 confirmed 집계는 늘지 않는다. `legacy-fix-cli-raw`는 보강 뒤 기존33건 새 실행 원문이다. 기존 npm 시험은 e404fb03의 관측을 유지한다(제품·기존 시험 입력 변경0); 이번 영향 범위의 도구 계약만 재실행했다.

`measurement-summary.json`은 6fda69d6의 옛 claims.json 측정 요약을 byte 그대로 이름만 바꿔 보존한 파일이다. `claims.json`은 기존 Court 공식 task/requirements/claims 형식으로 별도 생성했다. static jsonPath는 실제 측정 기록의 존재·값만 주장하며 새 CLI 동작 전체나 제품 E2E가 Court에서 실행됐다고 주장하지 않는다.

`preflight-feedback.js`는 옛 측정 요약에 공식 validateClaims를 실제 실행하여 오류·exit1을 수집하고, 수정 제출 파일의 형식 검사 exit0을 실행한다. 실제 실패와 보완의 두 이벤트를 명시 registry.sharedStoreRoot에 pending 수집하고 다음 bootstrap 연결을 확인했다. `submit-feedback-result.json`과 `submit-feedback` 원문이 그 근거다. 이 형식 검사에서만 상태 verified이며 PR·Court·게시 완료가 아니다. 정본 lessons SHA는 전후 동일, 효과는 null이다.
