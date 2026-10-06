# 기존 공통학습 피드백 연결 보완

기준 PR #844·890442ea. 공통 taskId OURGOAL-AGY-SPLIT-RUN-20261006. 작업자 측정·Court 판정 아님.

## 1. [원칙 ①] 문제 파악
collect는 실패측정도 보존하고 bootstrap은 최근5후보를 읽지만 실패원인·개선단계·영향범위·후속실측·최근3건을 연결하는 구조가 없다. 기존 docs/design/harness/shared-learning/validate.js·collect.js·bootstrap.js·cli.js를 확장한다.
## 2. [원칙 ②] 본질·원인·중심·핵심
본질은 작업중 발견을 다음 판단에 연결하는 것, 원인은 lessonCandidates와effectFollowup이 증거참조만으로 묶이지 않은 것, 중심은 append-only learning-event, 핵심은 실패/개선/효과를 같은불변자료에서 읽기전용산출하는 배선이다.
## 3. [원칙 ③] 해결 방식
event.feedback 선택필드로 failures/improvements/metrics/followupOf/review를 둔다. confirmed failure는 실제 측정증거와원시 finding/비0종료로 연결한다. report recent3와bootstrap feedback view는 기존store만읽는다. DOM 대상은없음(도구); 함수validateFeedback,feedbackView,reviewEvidence를구현한다.
## 4. [원칙 ④] 재검토
새원장·원장자동승격·헌법·승인선·Court·제품·기존시험변경0. 도구이름으로권한추론0. 실패확인과상태는원시봉투교차검사이며실행의진실성이나제품판정을증명하지않는다. 반복시담당/방법재검토권고만낸다.
## 5. [원칙 ⑤] 절차
기존기능근거→REQ gate→선택feedback검사→실패즉시collect→다음bootstrap→같은cause고유증거집계→최근3개선view→영향SHA와재검토→후속표본SHA연결→기존33검증/새CLI검증→정상commit→root PR/Court.
## 6. [원칙 ⑥] 절차 재검증·반론
반론1: 수집횟수는실패횟수다. 반박: task/cause/원시SHA/입력/범위를고유키로중복제거한다. 반론2: 제품불변이면옛증거를재사용하면된다. 반박: 실행기와비교기 의존SHA까지필수이며 누락은미측정·변경은재실행권고다. 권고는검증생략승인이아니다.
## 7. [원칙 ⑦] 단계별 실행
feedback-validate.js는선택필드참조를검사,feedback-view.js는반복·최근3·다음5건효과를산출,review.js는사전명시의존과현재파일SHA를대조한다. 기존collect/CAS/store를재사용한다. reportCLI는새JSON출력과읽기영수증만생성하고store쓰기0이다.
## 8. [원칙 ⑧] 막힘 예상·성과 측정
정본stale/CAS·증거부재·입력변경·확인되지않은실패·효과표본부재를반려/미측정한다. recent3은새건없으면동일3건을유지,새고유개선이면오래된건을제외한다. 후속유형5고유task/반복결함0/증거불일치0은기존계약이며충돌2/3자동규범결정0. 모델진행량·토큰절감·효과는실제전후표본없으면null.

독립 검토 e404fb03 반례 보강: confirmed는 원시 confirmedFailures의 failureId/causeId와 정확히 연결하며 비0 종료만은 unconfirmed 관측이다. validateEvent는 evidence/requiredChecks의 registry 등록과 registry readReceipt SHA를 요구한다. 기존 effectFollowup 숫자는 samples 항목의 evidenceSha256·metric을 현재 measured/exit0 원시 result.metrics와 연결하고 산술평균이 숫자와 같아야 한다. 출처 없는 옛 숫자는 null 또는 반려이며 원장·설치 runtime는 변경하지 않는다.

제출 전 형식 보완: measurements-only 요약을 공식 claims.json으로 오인한 원인이 normal pre-push에서 검출됐다. 기존 요약은 measurement-summary.json으로 원문 보존하고 prepare-claims.js가 공식 task/requirements/claims와 static jsonPath를 생성한다. preflight-feedback.js의 실제 validateClaims 실패/수정 측정을 기존 pending→다음 bootstrap에 연결하며 규범·제품·Court 검사 코드는 수정하지 않는다. quick 예비검사는 독립 GitHub 판정으로 대체하지 않는다.
