# 목표
PR982의 고정 제품을 바꾸지 않고 계정전환 시험의 실제 IIFE 로드를 복구해 원단언·검사수·기대값을 그대로 검증한다.

- [x] 원CI/source/계약 인수 · 예상 2분 · exact0e785/Bproducte38c·CI38509224519 loadGeneration first6·직전3commit/claims/원지침과 actual6.1high를 기록한다.
- [x] 시험 로드 최소 보정 · 예상 3분 · 단독 tests/account-switch-isolation.test.js makeBrowser에서 actual capabilities/device-save/profile-load/local-keep IIFE를 lexical 의존성과 함께 로드한다. 추가helper는 source/근거 선보고, 제품·단언·fixture대체0이다.
- [x] 해당시험 1회·불변 확인 · 예상 2분 · 원 시나리오/검사수/단언/기대값 unchanged를 source로 대조하고 해당시험1회만 실행한다. 새 실패면 원인을 정확 보존, whole중복0이다.
- [x] 정상hookcommit/source봉인·closure · 예상 1분 · 원CI/초기실패·REQ/dual8/13칸·공통task leaf·PID0/clean을root에인계하며 원격push/PR/main0이다.

① 파악: source 추출 함수는 loadProfile 내부 lexical loadGeneration/local helpers를 잃는다. 원CI six load failures와 정확dep source를 먼저 대조한다.

② 본질·원인·중심·핵심: 본질은 기존 계정격리시험이 현재 실제제품을 재는 것이다. 원인은 함수본문추출이 IIFE state/helper를 제외한 계약 단절 후보다. 중심은 makeBrowser/actual profile-load IIFE다. 핵심은 원제품 함수와 초기화/능력 의존성을 그대로 로드하고 단언·기대값·fixture흉내를 바꾸지 않는 것이다.

③ 해결방식: 기존시험 component 환경에 원 capabilities/device-save/profile-load/local-keep bytes와 실제 init/exports를 연결한다. 누락변수 하나를 임의주입해 증상만없애지 않는다.

④ 재검토: 제품·원source·Court/gate/ACTIVE/TICKETS/root0수정, 검사수/원단언/retire0변경이다. 기존가짜브라우저/DB는부품만이고 E2E·실서버 권위가 아니다.

⑤ 절차: CIhash/publicenum 인수→source/최근3commit/claims→실제IIFE dependency계약→시험로드보정→해당시험1회→불변SHA/source봉인/hookcommit→root인계이다.

⑥ 절차 재검증: 반론1 loadGeneration=0 하나를 넣으면 빨리해결된다. 대응은 다른 lexical helper·typed save contract를 놓치므로 실제IIFE를 로드하는 것이다. 반론2 actual module이 시험 기대값과다르면 단언을 바꾸자. 대응은 원기대값을 보존하고 다른실패는 제품/시험환경 원인을 source별로 나눠보고하는 것이다.

⑦ 단계별 실행: 원검사·assertion/body hashes와 raw exit/result를 기록한다. 시나리오 mock은 기존component만이고 newfixtures/실SDK/auth/API0, originalCI errors와 sourcefailures를 덮지 않는다.

⑧ 막히는 지점 예상: capability init에서 추가browser시설을요구하거나 원 helper의 함수추출이 다른 IIFE 의존도 잃을 수 있다. 확인된동일원인로드helper만source선보고하며 코드 기대값·제품대체로풀지 않는다. 타시험실패는구체원인과미확인으로root에보존한다.

실측: SOURCE-PRESERVATION.json은 원제품/loader 10 pins byte동일, 단언22/시나리오6 및 suffix SHA동일을 기록했다. SELECTED-RESULT.json의 단일 실행은 exit0·6/6·loadGeneration오류0이다. 실제CI/Court/사용/효과는 미확인이다. 마지막 항목은 정상 hook commit과 clean/PID 종료 뒤 별도 closure로 측정한다.

종결 측정: COMMIT-CLOSE.json은 source commit의 SOURCE-SEAL 전체 되읽기 일치와 own child46860 잔류0을 기록한다. 최종 clean/HEAD는 closure commit 뒤 git status/rev-parse stdout에서 확인하며, 사용/효과/CI/Court를 완료로 승격하지 않는다.
