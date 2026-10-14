# PR982 계정격리 시험 로드 보정

① 파악

CI38509224519의 account-switch-isolation six 시나리오가 loadGeneration is not defined로 실패했다. private rawSHA0b673be5/publicmetadata5d00e671을 인수했고 원 전문/URL key를 출력·복제하지 않는다. exactPRhead0e785/Bproducte38c를 고정했다. 직전3commit e38c/f331/8d4d 및 Bclaims/원REQ를 읽었다. WORK-REFERENCE979의 실제 source/persistence와 부품시험 구분을 인수한다.

② 본질·원인·중심·핵심

본질은 계정격리의 원검사가 실제 현재함수 계약을 실행하는 것이다. 원인은 makeBrowser175~179의 함수본문추출이 js/core/profile-load.js17~23의 lexical loadGeneration/readForLoad/ownRows 및 storage.device.pending 의존을 제외한 것이다. 중심은 makeBrowser의 VM 로드입구다. 핵심은 actual capabilities/device-save/local-keep/profile-load IIFE와 live scope ctx를 연결하고 원product/단언/검사수/기대값을 보존하는 것이다.

③ 해결방식

추가helper 없이 같은 tests/account-switch-isolation.test.js에 실제 raw4모듈을 VM으로 로드한다. window.OurgoalAppScope.scope에 기존 ctx를 결박하고 실제 OurgoalUiHelpers의 ensureUserRow/loadProfile export를 사용한다. 나머지4함수는 원extract 그대로이며 legacy mockQuery/ServerDb·6시나리오·저장/로그아웃/게스트 전이 논리를 바꾸지 않는다. loadGeneration 임의주입·제품 함수의 mock 대체·retire0이다.

④ 재검토

actual device-save는 pending 능력을 제공하고 profile-load의 원IIFE가 그 능력을 소비한다. local-keep은 원 기기 보관을 쓰는 주인 코드다. 네IIFE 로드는 browser/auth/SDK/실DB/E2E가 아니라 기존메모리 component 시험환경이다. 제품·Court/gate/ACTIVE/TICKETS/root·원Bclaims/원성적표/CI실패 변경0이다.

⑤ 절차

exact0e785 격리LF/longpaths 생성→자기plan/REQ·CIhash/최근이력/claims→actual4IIFE 계약읽기→makeBrowser보정→원suffix/단언/시나리오SHA 비교→해당6시험1회→raw/source봉인/normalhookcommit→root인계이다. 별도PR/push/main0, 전체중복시험0이다.

⑥ 절차 재검증

강한 반론1: 잘라온 함수에 loadGeneration만 정의하면 충분하다. 대응: readForLoad/ownRows 및 actual pending ability/local-keep 계약을 다시 잃으므로 실제IIFE를 사용한다. 강한 반론2: freshusers upsert.select 등 새계약이 다른mock실패를 만들면 기대값을 바꾸자. 대응: 원mock/시나리오/단언은 보존하고 대상시험1회의 다른실패를 정확 source 원인으로 분리해 root에 보고한다. 실제제품을 대체하는fixture를 만들지 않는다.

⑦ 단계별 실행

제품핀·scope·추출 잃은 lexical 계약과 실제vm로드를 intake에 결박한다. 시험 전후 모든 assert줄·makeBrowser이후helper/전체시나리오 suffix byte/SHA 및 check call count를 비교한다. 결과는 원 해당시험 raw/script출력으로만 주장하며 actualCI통과·Court·실계정사용·효과는 null이다.

⑧ 막히는 지점 예상

다른 함수의 lexical state도 바뀌었다면 확인된 동일원인 로드에만 범위를 제한하고 추가파일은 source선보고한다. 기타실패·필요제품교정은 scope 밖으로 보존한다. 지금 원0e785를 새B후속source로 바꾸지 않고 기존SQL3/첫지표/한건/사진/미디어·원격/API예산0을 유지한다. central common309d/root 단독이며 시험leaf TASK-ES-695-B-TEST-01a13674는 로컬기록/중앙등록미확인이다.
