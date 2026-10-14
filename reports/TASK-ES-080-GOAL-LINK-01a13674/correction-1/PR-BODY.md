### 🚀 [MODE_4A] 5대 고정 블록 표준 구현 보고서
* **PR 번호**: root의 정상 초안 PR 생성 시 기입
* **Task ID**: TASK-ES-080-GOAL-LINK-01a13674 / common TASK-CC-CELL-UNWIRE-RUN-309dca5d

#### [블록 1] 개요
- **작업 내용**: 홈의 실천메모가 기기에 보관 확인된 뒤 기존 축하·AI 피드백을 닫으면, 명확한 목표 관련성이 있을 때만 닫기/목표탭 이동을 제안한다. 제목·마일스톤·분류·숫자단위·최근 기록의 내부 규칙이며 신규 AI 호출/자동 귀속은 없다.

#### [블록 2] REQ / PLAN 및 구체적 식별자
- **구체적 식별자**: #captureSave/#recordGoalLinkSuggestion/#recordGoalLinkTarget/#recordGoalLinkClose/#recordGoalLinkGo, bindCaptureSave/rank/offer/modalState/closeCheckinFeedbackSheet, js/tabs/goals/record-link.js와 SOURCE-CANDIDATE.json의 변경파일.
- **PLAN 체크리스트**: 원요구·구현·선정관측·source/claims 인계까지 측정. [4단계: 심사 청구]는 root가 독립 검토 뒤 진행하며 현재 정식심사 실행0이다.

#### [블록 3] 핵심 변경사항
- **수정 파일 목록**: 초기 제품 dfb6cac74fb336cab496e113f356875fb2da25fc 및 교정1 b881a3e6311a009c8ad9ef1fd94541976cdf08c8와 SOURCE-CANDIDATE.json. generic modal은 소유자 열린/닫힌 token 신호만 추가하고 first celebration의 실제종료와 feedback닫힘 뒤를 결합한다. 기존 저장/P0/AI 요청/서버DTO/goal-update/SW/기준선은 byte불변이다.
- **소블록 자가분열 준수**: SOURCE-CANDIDATE.json.files[].lines와 npm test/module guard의 출력 참조. 새 record-link는 목표탭의 작은 세포이며 기존800상한·새window전역0.
- **세포 영향**: goals/record-link; core/modal-open·modal-helper; records/checkin-capture·checkin-feedback·first-checkin-tutorial. modules hand provides/requires 및 공식 module-specs --write만, baseline --update/hand수정0.

#### [블록 4] Claims (주장)
- 기록 완료: reports/TASK-ES-080-GOAL-LINK-01a13674/claims.json 및 scenarios 세 파일; JSON/schema 검증은 CLAIMS-VALIDATION.json, package 필수검사는 REQUIRED-CHECKS.json, 원선정반례/PC는 FIRST-WORKER-OBSERVATIONS.json.
- **주장 항목**: C080 게스트 기기보관/기존팝업후명시이동; C081 동률목표보류; C082 같은세션의닫기억제; C_REGISTER/C_SELECTED_TEST 설정·시험파일존재만. 주입VM은 source부품층이며 실제 guest/계정/E2E가 아니다. pc-1의 최초 제목뒤표시와 현재head의 제목앞표시·title-staleguard 차이/EOL층을 보존한다. 현재 실제계정·원격확정·여러기기/CAS·운영·전체사용·효과 미확인. 기존 원시험 기대/단언/법정/금고 변경0, 이전 승인을 이번시험교정권한으로 재사용0.

#### [블록 5] 독립 법정 판정서 (GitHub Court Verdict)
미청구/null. 작업자 측정과 독립 검토는 공식 법정 판정을 대체하지 않는다. root가 독립자료를 결합하고 정상 push/초안 PR/심사를 조율한다.


교정1: 기존 AI fallback 토스트가 질문을덮는독립지적을인수했다. 토스트본문/onclick/2200ms·CSS원바이트를보존하고 core/toast-renderer의실제show/computedopacity readcap과기존목표pending tick를연결한다. 추가observer/event/timer0, faded class제거만으로끝이라고보지않는다. 최초hook438/1/둥근모서리하네스실패/직전observer후보actual자료는원형보존했다. 최종read-only source b881에서새actualguest flow는독립자의 INDEPENDENT-CURRENT-REFERENCE와PNG로확인했으며공식Court를대체하지않는다. 기존requirements/claims IDs/kind/statement/세시나리오expected불변·C080 toastowner touches추가만, 원사용기준은저장확인→축하/기존AI/토스트실제끝→전체질문·목표·버튼읽기→명시이동이다. 픽셀판독과Playwright visible/요소존재의한계를구분한다. 최종필수검사와원toast함수byte보존은correction-1/FINAL-SOURCE-CHECKS.json, root용exact전달은correction-1/HANDOFF.md를참조한다.
