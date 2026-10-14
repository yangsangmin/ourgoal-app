# 최초 reader 독립 source 의견 — 불변

exact `eb232b3b4f96c2d56a17d929fc9f2b6961830737`. 원작성 handover_review과 분리한 읽기 의견이며 제품·시험·원claims·원raw를 수정하지 않았다. 실제 전체 CI/Court/실동작·보존·사용·효과의 판정은 null이다. 최종 새 static claims는 아직 정확 source 전달 전이므로 별도 후속 의견을 작성한다.

`reader-static.json`은 작성자 runner를 실행하지 않은 별도 source 비교 결과다. `p0.onlyCacheAndRequireWhitelistDelta`, `direct.onlyRawReadAndIIFEBranchWhitelistDelta`는 정확 허용 문자열 변경만 역으로 제외하면 원 전체 파일과 byte 대응함을 대조한다. 이 방법으로 원 단언/조건/fixture를 그 변경 밖에서 유지했음을 확인하며 단언줄 수는 동적 실행 횟수가 아니다. `assertionLinesExact`, `fixtureSuffixExact`, `protectedPinMismatches`, `historicalSourceSealPinMismatches`와 원 CI의 raw/metadata hash는 각 JSON 필드로 인수한다.

P0 `tests/local-keep-p0.test.js:247–251`은 실제 provider 파일도 cache에서 제거하고, `global.window/global.localStorage/OurgoalAppScope`를 새 store/scope에 설정한 뒤 capabilities→device-save→원Ledger/isolation/LocalKeep→home/profile-load를 읽는다. `capabilities.js`는 로드 때 새 registry를 만들어 global에 노출한다. device-save는 그 registry에 storage.device.pending 등 기존 능력을 제공한다. 이름뿐인 stub이 아니라 기존 source 파일을 읽는 배선이다. 실제 component 상태/데이터 보존의 새 실행 증명은 아니다.

direct `tests/direct-login-guard.test.js:148–196`은 매 makeBrowser에 새 storage/state/window/ctx를 만든다. actual IIFE들은 같은 `vm.createContext(ctx)` 안에서 읽고 `win.OurgoalAppScope.scope=ctx`를 전달한다. `profile-load.js:15–21`의 lexical generation/read helper와 ctx의 현재 state를 같은 closure 안에서 사용하는 경로다. 기존 Ledger/guard/isolation와 fixture는 유지한다.

raw HTML에 ensureUserRow/loadProfile header가 모두 없을 때만 actual IIFE를 읽고 나머지 원함수들을 추출한다. 하나라도 있으면 기존 header 목록을 유지한다(`direct.legacyBranchTruthTable`). 이는 **raw header 문자열 기준의 기존 선택 계약**이며, comment에만 있는 header·대체 문법·부분 혼합 HTML 전체의 의미적 호환을 증명하지 않는다. 원합본 helper는 raw HTML을 앞에 보존하고 이전 세포를 뒤에 붙인다. 기존 legacy CLI 계약을 새 것으로 교체하지 않았다.

원 `0cf68ce...` source와 `aafecdb...` closure, root intake, sourceSeal과 원 selected 결과를 읽기로 인수했다. 기존 P0/direct/계정 suite와 selected component를 재실행하지 않았고 새로운 L1도 실행하지 않았다. `inheritedSelectedOnly`는 원작성자 한정 component 자료이며 실계정/실DB/UI/E2E나 새 독립 실행으로 이름 붙이지 않는다. 공식65E957E7의 exact9cf unclaimed 시험·첫 CI 실패와 초기 direct 실제실패 관측 null은 보존한다.

reader source 비교에서 새로운 제품 결함을 지정하지 않는다. 다음은 root가 전달하는 exact static claim/통합source에서 C1–3 불변, 주장 kind/domain/check/touches와 문장의 정적 한계를 별도 비교하는 것이다. 본 최초 의견은 그 검토로 덮지 않는다.
