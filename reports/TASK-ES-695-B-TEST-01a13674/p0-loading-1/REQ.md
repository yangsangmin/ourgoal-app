# PR982 P0 시험 의존성 로드

① 파악

exact9cfb8574e3acb62f259b9991df5ef2f84bb506ca에서 CI38514502201의 local-keep-p0 22/26와 네 undefined.request TypeError를 인수한다. 원raw SHA940e133457d4dfde8d05cb7c63a057c85296d9cd7bbb4db55bf685a0cc6191bc는 원위치에서 hash/closed enum으로만읽고 전문은출력·복제하지않는다. WORK-REFERENCE기준979를 인수하며 이번은 기성실제제품의 reader복구 표준수정이다.

② 본질·원인·중심·핵심

본질은 원P0 현재실제제품 맞물림 조건의 실행이다. 원인은 tests/local-keep-p0.test.js boot가 실제 profile-load를 require하지만 actual capabilities/device-save provider를 로드하지 않는것이다. 중심은 boot의 require/cache reset이다. 핵심은 동일 global.window/global.localStorage/OurgoalAppScope.scope에서 원registry 및 pending provider를 연결하고 원26case/fixture/단언/기대값을 그대로유지하는것이다.

③ 해결방식

cache목록에 실제 capabilities.js/device-save.js를 포함하고 global/appScope/store를 설정한뒤 registry→device-save 순서로로드한다. 원 record-ledger/account-isolation/local-keep/home-cockpit/profile-load functions는 수정하지않는다. capstub/mockproduct/expectedweakening/retire0이다.

④ 재검토

새측정은맞물림4 scopedL1이며원직접22를반복하지않는다. 원source직접부품section은바이트불변이다. source읽기상 direct-login-guard.makeBrowser183도 함수추출 lexical 미로드문제이나 별도ACK전수정/실행0, record-ledger-sync222는문자열단언이라동일runtime대상이아니다. 제품/원69/legacyHTML/구조규범/Court/TICKETS/공용쓰기0이다.

⑤ 절차

CIhash/metadata→source/직전3commit/claims→REQ/PLAN→boot로드최소변경→원case/단언/섹션byte검사→선언+맞물림4 원하네스선택실행1회→source/normalhookfreeze→ownPID/clean/root인계이다. 실 auth/API/DB/browser/SQL/firstmetric/trial/원격0이다.

⑥ 절차 재검증

반론1 pending만가짜등록하면 충분하다. 원provider는 account/store/source queue 계약이므로 actualdevice-save를 읽어야한다. 반론2 전체26을돌리지않으면원직접부품을안재는것이다. 이번변경은boot만이며직접22source는불변임을hash로증명하고새맞물림4를먼저실행한다. 새전체실행이필요해지면사유와정확횟수를별도로기록한다. 지금은원기대값을맞춤변경하지않는다.

⑦ 단계별 실행

선정하네스는원선언섹션과맞물림섹션을바이트그대로선택해Node Module로컴파일한다. originalfilename을유지해 require가같은actual제품을읽으며검사본문/fixtures는그대로다. 실제SDK/DB/계정왕복이나사진보존E2E가아니다. 수치/SHA는선정script출력만쓴다.

⑧ 막히는 지점 예상

전boot의capregistry/상태가cache로남으면새source와store가섞일수있으므로두provider도원cache reset목록에넣는다. root제품후속/공식Court진행/원68BA반려1/sync cancel판정아님을보존한다. root common TASK-CC-CELL-UNWIRE-RUN-309dca5d leaf연결등록은root단독/pending이며이보고로동기화완료나새사진검증권위를만들지않는다.

root후속ACK: tests/direct-login-guard.test.js::makeBrowser의 두profile 함수 추출 및 actual4IIFE/live ctx/원--html rawheader선택도같은reader교정에포함한다. 원ensure/load header가rawHTML에하나라도있으면 원8함수추출, 없으면actual4IIFE와나머지6함수추출이다. 원계정Ledger는이미있어서추가stub/provider0이다. case⑥317/320 호출source는확인했으나그원실제실패관측은null로보존한다. 새로운선정은원case⑥만1회이고원다른5/전체6반복0이다. P0의registry/provider누락과direct의lexical추출누락을별도원인으로기록하며record-ledger-sync는변경0이다. 원다른8원칙의검증/반론/보존기준을이같은source선택교정에도동일하게적용한다.
