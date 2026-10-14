# --html 읽기 범위의 한정 인계

`tests/account-switch-isolation.test.js:14-20`의 `--html`은 `HTML_PATH`만 바꾼다. `tests/helpers/inline-bundle.js`는 자기 `ROOT`의 tab/core 세포를 그 HTML 뒤에 붙이며, Ledger와 account-isolation도 시험의 `ROOT`에서 읽는다. 따라서 기존 옵션도 다른 HTML의 독립된 전체 제품·의존성을 읽는 계약은 아니었다.

기존 `extractFunction`은 합본에서 첫 함수 선언을 택한다. 입력 HTML 자체에 `ensureUserRow` 또는 `loadProfile` 선언이 있으면 그 두 함수는 입력 HTML의 것을 택했고, 없으면 ROOT에서 붙인 세포의 것을 택했다. 이번 보정은 두 함수를 항상 ROOT의 actual profile-load IIFE에서 가져온다. **별도 HTML에 그 두 함수의 다른 인라인 구현이 들어 있는 경우 그 구현을 더 이상 관측하지 않는 범위 차이가 있다.** 이는 기존 옵션이 원래부터 ROOT도 읽었다는 사실만으로 없어지지 않는다. 이 옵션을 과거 두 함수 구현의 비교 시험이라고 주장하면 안 된다.

현재 고정 `0e785`의 index.html에는 두 함수의 인라인 선언이 없고 profile-load.js 로드만 있다. 이 작업의 원 여섯 시나리오는 기본 HTML_PATH로 단 한 번 실행했다. 그 경로에서는 기존에도 ROOT의 profile-load 함수가 관측 대상이었고, 새 로드는 그 함수가 속한 실제 IIFE·lexical 의존성과 능력 제공자를 함께 실행한다. 나머지 네 함수의 원 extract/첫 선언 선택 및 HTML_PATH 처리, inline-bundle/Ledger/account-isolation bytes는 변하지 않았다.

다른 `--html` 입력을 실행하거나 입력 함수의 동등성을 재측정하지 않았다. 해당 옵션의 두 함수 관측 범위 차이는 root에 알려진 제한이며, 다른 제품 버전 비교 가능성은 null이다. 추가 수정·원 여섯 시험 재실행·제품 보정·원격 실행은 0이다. SOURCE-SEAL의 source commit 및 기존 COMMIT-CLOSE는 원형으로 보존하며 이 문서를 별도 closure 보충으로 연결한다.
