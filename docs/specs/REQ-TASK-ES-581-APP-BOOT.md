# TASK-ES-581 전체 화면 렌더·앱 부팅 원문 분열

작업참고 기준 PR #838 (37f41857ced08770a05b79565563326e0b851541). 기준 origin/main 37f41857ced08770a05b79565563326e0b851541.
최종 검토 기준: 작업참고 PR #840, origin/main b87cf99e3910c1dda25dd33579477d94ef597f82. 최초 측정은 보존하며 최신 main 대비 원문·로드·화면·시험을 다시 대조했다. 결과와 원시 기록 경로는 evidence-manifest.json 및 root-review.json에 구분한다.
표준 분열(L001·L002·L005·L006·L015·L016·L019·L021·L009).

## 1. [원칙 ①] 문제 정확히 파악
index.html의 인라인 미분화 스크립트에 남아 있는 핵심 렌더러 `renderAll`(7824~7835줄, 12줄)과 앱 부팅 즉시실행문 `(async function boot(){...})()`(7854~8079줄, 226줄 단일 최상위 AST ExpressionStatement)을 각각 독립 책임 세포로 분열해야 한다.
- `renderAll()`: 홈·목표·일정·기록·소통·설정 6대 화면 및 탑바를 한 번에 다시 그리는 통합 렌더러.
- `boot()`: Supabase Auth 리스너 등록, PKCE 세션 복원, 게스트/로그인 세션 초기화 및 진입 화면 전환을 관장하는 진입점.
- 두 함수는 런타임에서 상호 결합되어 앱 부팅 시 `boot()` 내부에서 `renderAll()`이 호출되거나 게스트 진입/화면 전환 시마다 실행된다.
- 8082줄의 `OurgoalCredits.init` 및 8085줄의 `OurgoalReactions.init`는 별도 그룹이므로 이번 분열 범위에 포함하지 않고 원본에 남긴다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- 본질: 앱 기동 및 전 화면 렌더 총괄 책임을 각각 독립적인 세포(`js/core/all-view-render.js`, `js/core/app-boot.js`)로 격리하되 동작과 실행 순서를 100% 동일하게 보존하는 것.
- 원인: 대규모 인라인 스크립트 중 진입점과 통합 렌더러가 단일 파일에 밀집되어 유지보수성과 모듈 독립성이 저해되어 있었음.
- 중심: `OurgoalUiHelpers`(`_uiKit`) 키트 통째 대입 보존, `window.renderAll` 및 전역 노출 유지, 비동기 호출 타이밍 무손실 유지.
- 핵심: AST 수준에서 토큰 동일성(동일 토큰 수, 0 잔여 차이), 누수 0, 최상위 this/arguments 0, 800줄 이하를 엄수하고, 실제 브라우저 게스트 부팅/렌더 호출 입증과 로그인 24개 분기 미측정의 정확한 분리 명시.

## 3. [원칙 ③] 해결방식
`docs/design/harness/module-split/inline-boot581.json` 설정과 기존 `gen-inline-hard.js` 스코프 분석 생성기만을 사용하여 기계적으로 분열한다.
- `renderAll` -> `js/core/all-view-render.js` (함수 선언 그대로 이전)
- `boot` -> `js/core/app-boot.js` (wrap `runAppBoot`로 래핑하여 세포로 이전, 원래 자리 7854줄에 `runAppBoot()` 호출문 남김)
- 슬롯: `HO`
- 키트: `OurgoalUiHelpers`, 키트 변수: `_uiKit`
- `afterTag`: `<script src="js/core/ui-helpers.js"></script>`

## 4. [원칙 ④] 재검토
- `verify-inline-hard.js`를 통해 토큰 동일(접두 제외), 덩어리 줄 동일, 잔여 동일, 누수 0, setter 누락 0, this/arguments 0, 800줄 이하 검증.
- `js/core/all-view-render.js`: 약 37줄 (800줄 이하 완비).
- `js/core/app-boot.js`: 약 253줄 (800줄 이하 완비).
- 원래 버그나 누락된 window 노출도 인위적으로 고치지 않고 100% 그대로 보존한다.
- `OurgoalCredits.init`(8082줄)은 `Boot` 구획 주석 바깥에 존재하므로 분열 대상에서 제외되어 원본에 잔류한다.

## 5. [원칙 ⑤] 절차
1. 원본 기준사본 보존 (git archive SHA: 37f41857ced08770a05b79565563326e0b851541).
2. `inline-boot581.json` 설정 준비 및 `gen-inline-hard.js` 실행으로 두 세포 파일 생성 및 `index.html` 수정.
3. `verify-inline-hard.js` 실행하여 토큰/스코프/누수 정밀 무결성 검증.
4. `scripts/module-specs.js --write` 실행하여 `modules.json` 코드칸 갱신 및 `cell-descriptions.json` 설명 등록.
5. 단독 로드 탐침(`court/probes/module-load.js`)으로 원본 및 신규 세포 회귀 0 측정.
6. 실제 브라우저 게스트 UI 하네스 2+1 실행 및 CDP 계측 (`#btnLandingPreviewDirect` 진입, 인사닫기, 탭전환 등).
7. 단계별 수집 DOM, `savedGuestProfile` 키/leaf, 스토리지, 콘솔/에러 동일성 비교.
8. 표준 `tab-check` 2+1 비교.
9. npm test 및 115개 전체 개별 시험 전후 비교.
10. `claims.json`, `proof.json` 작성 및 정상 커밋.

## 6. [원칙 ⑥] 절차 재검증
- 반론 1: `boot` 함수 내부에 24개의 Supabase 세션 복원 및 인증 비동기 분기가 있으므로 게스트 모드 테스트만으로는 불완전하다.
  - 격파: `gen-inline-hard.js`는 AST 파서 기반으로 1961개 토큰을 1:1 완벽하게 세포 파일로 이전한다. 게스트 환경에서 브라우저 부팅과 렌더러가 정상 실행됨을 CDP 실제 호출 계측으로 입증하고, 로그인 분기는 "미측정"으로 투명하게 분리 보고함으로써 측정의 정직성을 확립한다.
- 반론 2: `OurgoalUiHelpers`에 두 새 세포를 연달아 붙이면 키트 객체 덮어쓰기나 순서 충돌이 발생할 수 있다.
  - 격파: 두 세포 모두 `<script src="js/core/ui-helpers.js"></script>` 뒤에 안전하게 삽입되며, `OurgoalUiHelpers` 객체에 각각 `renderAll`과 `runAppBoot` 속성을 추가/할당하는 패턴이므로 상호 간섭이 발생하지 않는다. `verify-inline-hard`와 `module-load`로 이를 사전에 기계적으로 검증한다.

## 7. [원칙 ⑦] 단계별 실행
- 1단계: 인계 및 기준 동기화, archive 보존, task-link 갱신, REQ 작성 및 무결성 게이트 검사.
- 2단계: `inline-boot581.json` 설정 기반 `gen-inline-hard.js` 실행 및 신고서 갱신.
- 3단계: `verify-inline-hard.js`, `module-load.js` 정적/로드 검증.
- 4단계: 실제 UI 게스트 하네스 2+1, CDP 호출수/분기 계측, DOM/스토리지 불변성 검증, 탭 하네스 비교, 전체 시험 비교.
- 5단계: 결과 리포트 및 claims 작성, 정상 훅 커밋.

## 8. [원칙 ⑧] 막히는 지점 예상
- 게스트 단독 실행 시 Supabase 인증 및 PKCE 분기 24개는 count 0으로 측정된다. 이를 억지로 실행시키려고 가짜 계정이나 네트워크 조작을 하지 않고, "게스트 실행 입증 / 로그인 분기 미측정"으로 명확히 구분 기록한다.
- 외부 API 호출 실패에 대한 안전 처리: Supabase 웹소켓 미연결 등 기존 로컬 환경 콘솔 에러는 기준과 작업에서 동일하게 관찰되며 새 에러가 0개임을 검증한다.
- 동적 시간/타임스탬프(`dateKey`, `nowISO`)는 정상 변동 요인이므로 제한 정규화 규칙을 명시하고 원시 데이터를 함께 보존한다.
