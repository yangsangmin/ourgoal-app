# 화면 실측 도구 (docs/design/harness)

## 6개 탭 공통 실측 도구 — `tab-check.js` (TASK-ES-349 · 노션 CORE-01)

`node docs/design/harness/tab-check.js <APP_DIR> <outDir> [home|goals|records|calendar|comm|settings|all|쉼표목록] [--summary <요약.json>] [--deadclick rep|all|off]`
로 탭 하나 또는 전체를 잰다. 로컬 정적 서버에 `APP_DIR`(워크트리 경로)을 띄우고, 헤드리스 Chrome 에서 `shots-lib.js` 의 `newPage`(게스트 프로필 시드·Supabase 목·외부 호출 차단)로 열어 탭 × 테마 4종(`focus-sanctuary`·`black`·`white`·`urban-city`) × 375×667·375×812 × 탭의 주요 상태(`tab-states.js` — 서브탭·시트를 실제 클릭으로 열고, 열렸는지 DOM 으로 다시 확인해 `entered` 에 적는다)를 장마다 새 브라우저 컨텍스트에서 찍는다. 장마다 문서 높이/화면 높이와 무스크롤 여부, 44px 미만 조작 요소 목록, 콘솔 오류, 숨은 조작 요소와 숨긴 이유, `!important` 로 강제된 `display:none` 요소 수를 재고, `--deadclick rep`(기본)이면 탭×상태마다 대표 장(첫 테마, 375×667)에서 보이는 조작 요소를 하나씩 눌러 DOM 변화·네트워크 시도·토스트·화면 전환·포커스·창 호출이 하나도 없으면 Dead-Click 후보로 적는다(`tab-deadclick.js`; 외부 링크·새 창·삭제·초기화·로그아웃·게시·공유·결제·외부 인증·파일 첨부는 누르지 않고 사유를 적는다, 반응이 있었으면 새 컨텍스트에서 그 상태로 다시 들어가 복귀). PNG 와 탭별 전체 결과 `<tab>-check.json` 은 `outDir`(저장소 밖 권장)에, 작은 요약은 `--summary` 경로에 쓴다. 탭을 따로따로 돌렸으면 `node tab-check.js --merge <요약.json> <dir>/home-check.json …` 으로 묶고, 같은 커밋에서 두 번 잰 결과는 `node tab-compare.js <a.json> <b.json> [--out diff.json]` 으로 비교한다. 예전 명령 `node home-check.js <APP_DIR> <outDir> [tab] [--summary …]` 은 같은 도구로 넘어가는 호환 래퍼로 그대로 돈다.

한계: 목 Supabase·게스트 시드 화면만 잰다(로그인 사용자 화면·실서버 아님). 헤드리스 Chrome 은 가상 키보드를 띄우지 않는다. 접힌 묶음(`details`) 안 요소는 펼치기 전에는 Dead-Click 대상에 넣지 않는다. 같은 모양 요소는 종류마다 2개, 상태마다 60번까지만 누른다(나머지 수는 `sampledOut`·`cappedOut` 에 적는다). 반응 판정은 "무엇이든 바뀌었는가"까지이며, 바뀐 것이 사용자에게 의미 있는 피드백인지는 사람이 본다.

## 그 밖의 도구

- `shots.js` / `shots-lib.js` — 디자인 촬영(390×844) 과 공용 페이지 준비 함수
- `audit.js` — 탭별 합계 지표
- `gcal-isolation-check.js` — 구글 캘린더 토큰 격리 점검
- `real-account-check.js` — 테스트 계정 2개로 레벨 5 시나리오 재생(TASK-ES-355 · CORE-02). 표 `real-account-scenarios.md`, 준비·실행 `real-account-README.md`. 계정 환경 변수가 없으면 접속 없이 '계정 없음 — 재생 안 함'
- `eval-*.js` — 페르소나 평가
