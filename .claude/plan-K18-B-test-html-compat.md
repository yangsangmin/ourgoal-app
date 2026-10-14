# 목표
기존 --html의 두 인라인 함수 선택 의미와 기본 모듈형 HTML의 실제 IIFE 로드를 함께 보존한다.

- [x] exact 원 source/범위 인수 · 예상 1분 · e16de9fb·원9e49/6of6/raw/22단언/CLI 제한을 변경 없이 대조한다.
- [x] source 선택 최소교정 · 예상 2분 · 원 raw HTML에 두 header 중 하나라도 있으면 기존 names6/extract를 유지하고 없으면 원 four IIFE/four extract를 유지한다.
- [x] L1 선택 조건 1검증 · 예상 2분 · 양쪽/한쪽 raw header의 원 첫선언 선택·default false와 원 IIFE 블록 동일성·22단언/suffix 불변을 측정한다. 원6 재시험0이다.
- [ ] 정상 hook/source 봉인 및 종료 · 예상 1분 · 정확 HEAD/SHA·원자료 불변·자기 PID 종료·clean을 root에 인계한다. 제품/원격0이다.

① 파악: 첫 loader 교정은 default modular source의 lexical 의존성을 복구했으나 --html에 있던 과거 인라인 두 함수를 항상 ROOT source로 바꾸었다. CLI-SOURCE-SCOPE.md의 원 제한을 먼저 보존한다.

② 본질·원인·중심·핵심: 본질은 같은 원 시험의 source 선택 의미 보존이다. 원인은 raw HTML의 원 함수 선언 여부와 무관하게 actual ROOT IIFE만 로드한 것이다. 중심은 makeBrowser와 원 HTML 읽기 입구다. 핵심은 원 header substring/첫 선언 추출은 유지하고, 인라인 두 함수가 없는 default에서만 실제 IIFE 의존성을 복구하는 것이다.

③ 해결방식: raw HTML을 합본 전 보존하고 두 header 중 하나라도 포함하면 기존 여섯 함수 extract로 돌아간다. 한쪽만 있는 혼합도 원 합본/첫선언 의미를 바꾸지 않는다. 둘 다 없는 경우 기존 네 IIFE·네 함수 경로를 그대로 쓴다.

④ 재검토: AST 정규화·함수 기대값·시험 fixture·제품·helper 원본·원성적표·root/공통metadata는 변경하지 않는다. 합성 HTML/메모리 VM은 선택 경계의 부품 검증이며 실제 UI/DB/E2E가 아니다.

⑤ 절차: 원 source pin→자기 REQ/PLAN→raw header 분기→실제 makeBrowser 선택 L1→원 단언/suffix/source 비교→정상 hook commit→closure/PID/clean 인계이다.

⑥ 절차 재검증: 반론1 두 함수가 모두 있을 때만 legacy를 택하면 충분하다. 대응은 하나만 있는 원 선택도 유지해야 하므로 OR 분기이다. 반론2 legacy에 필요한 lexical state도 임의 보충하면 더 정상적이다. 대응은 기존 입력 의미와 실패까지 보존하는 것이 범위이며 새로운 정규화는 하지 않는다. 기본 경로의 검증은 분기 false 및 기존 IIFE 블록 동일성으로 하고 같은 원6을 반복하지 않는다.

⑦ 단계별 실행: 원 시험 prefix의 실제 makeBrowser만 별도 L1 VM에서 불러 source 선택 결과를 관측한다. 기존 main 여섯 시나리오는 호출하지 않는다. 수치와 SHA는 새 스크립트가 산출한다.

⑧ 막히는 지점 예상: 합본은 여전히 ROOT 세포/iso/Ledger를 읽는다. --html을 독립된 전체 제품 비교로 승격하지 않는다. 하나만 있는 경우 원 함수 추출의 lexical 한계가 남으면 이를 그대로 보존하며 제품/fixture로 보완하지 않는다.

SOURCE-PROOF.json/L1-FIRST-RESULT.json이 원단언22·원case6·suffix·보존pins 23개 및 legacy 선택 3조건 일치를 측정했다. default guardfalse이며 actualIIFE 블록은 indent 제외 동일하다. 원 여섯 시나리오는 반복하지 않았다. 최종 hook/source/PID/clean은 closure로 기록한다.
