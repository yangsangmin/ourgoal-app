# --html 선택 관측 회귀 보정

① 파악

원 source9e49·finale16와 CLI-SOURCE-SCOPE.md SHA9755f88367b3b5e28a338be2d0d3a54e0a68959163edf402b1dcde02cdd64349를 인수했다. 기존 index/함수 합본의 첫 선언 선택을 ROOT actualIIFE로 고정한 한정 회귀를 교정한다. 원CI 실패와 첫6/6 부품 성적표는 그대로 둔다.

② 본질·원인·중심·핵심

본질은 원 --html 입력 관측 의미 보존이다. 원인은 makeBrowser가 입력 HTML의 ensureUserRow/loadProfile 선언을 고려하지 않은 것이다. 중심은 raw HTML→합본→makeBrowser 선택이다. 핵심은 기존 header substring OR와 extractFunction 첫 선언을 유지하고 default 모듈형 HTML에는 현재 lexical 계약 복구를 유지하는 것이다.

③ 해결방식

합본 전 rawHtml을 보관한다. `async function ensureUserRow(` 또는 `async function loadProfile(` 중 하나라도 rawHtml에 있으면 기존 names6를 extract한다. 둘 다 없으면 현재 네 IIFE를 live ctx에 로드하고 실제 exports와 나머지 네 extract를 쓴다. 두 함수 중 하나만 있는 경우도 원 합본의 source 선택을 그대로 보존한다.

④ 재검토

제품0·22원단언/6원시나리오/기대값0변경·inline-bundle/iso/Ledger/--html parse0변경이다. 해당 테스트 source 선택 외 책임은 자기 plan와 html-compat-1 보고뿐이다. 새 component mock은 source 선택 부품만이며 실제 계정/네트워크/DB/양성 UI를 대체하지 않는다.

⑤ 절차

exacte16 격리→dual8→raw guard/기존 load 블록 보호→legacy source 선택 L1 한 번→suffix/assertions/원자료 hashes→normal hook commit/source seal→own PID 종료·clean 인계이다. root만 최종 제품+시험 통합과 독립검토를 담당한다.

⑥ 절차 재검증

반론1 양쪽 header가 모두 있을 때만 원경로를 쓰면 한쪽 입력의 혼합 선택이 사라진다. 따라서 OR를 사용한다. 반론2 legacy 함수를 actualIIFE로 보충하면 그쪽 오류도 고칠 수 있다. 현재 목적은 관측 회귀를 없애는 것이므로 원 추출 의미와 lexical 한계를 보존한다. default는 guardfalse·원 actualIIFE 블록 동일성으로 확인하고 원 여섯 시나리오는 반복하지 않는다.

⑦ 단계별 실행

makeBrowser의 실제 함수를 메모리 VM에서 선택 조건만 호출하여 양쪽/각 한쪽 인라인 source가 원대로 택해지는지 측정한다. source 비교는 정확 e16 및 original0e와 원22 assert·suffix를 대조한다. 실제 auth/API/browser/DB/Court/사용/효과는 null이다.

⑧ 막히는 지점 예상

--html의 다른 의존성이 ROOT에서 읽히는 원계약은 유지한다. 다른 HTML에서 함수 전체가 독립 실행 가능한지, 실사용/E2E 등은 이 검증으로 확인되지 않는다. 별도제품교정/원Court claims/중앙 leaf 쓰기는 root 책임이다. 공통 TASK-CC-CELL-UNWIRE-RUN-309dca5d 연결은 인수하되 등록완료로 승격하지 않는다.
