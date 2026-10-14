# K18 B round1 요구

원source d831b3a9/제품0e785, first independent raw491cb8f7ec9d3e21b3fc12f1f61901584dbfbb564d4368bc1a00a1e6f9140305와 Court68BA002F/누적1을 보존한다. 13칸 연결은 기존 B REQ를 유지하며 이번 닿는 곳/품질만 아래 좁은 경계로 한정한다.

## 1. [원칙 ①] 파악
PENDING-ATTEMPTS-01은 valid goals entry의 attempts='invalid'만 바꾼 독립 L1 반례다. PENDING-USER-BOOTSTRAP-02는 valid own users pending·profile backup 없음·GETempty에서 기본 upsert/newSignup true가 생긴 별개 반례다.
## 2. [원칙 ②] 본질·원인·중심·핵심
본질은 원 intent 보존과 부당한 반복/기본 덮어쓰기 금지다. 원인은 read가 counter를 검사하지 않는 것과 bootstrap에 pending 존재를 전달하지 않은 것이며 중심/핵심은 두 boundary에서 쓰기 전에 근거를 확인하는 것이다.
## 3. [원칙 ③] 해결방식
device-save 생성/ACK 계약의 attempts0 및 정수 증분에 맞춰 손상값을 integrity hold한다. 보정하거나 지우지 않는다. profile-load가 이미 strict reader로 검증한 users entry만 ensureUserRow의 기본 생성 앞 guard로 전달한다.
## 4. [원칙 ④] 재검토
A records schema1·confirmed optional·관련없는 미래 metadata는 bytes를 유지한다. counter missing은 원 생성 계약에 없어 보류하고 operation/lastFailure는 이번 두 반례에 필요하지 않아 새 규범을 만들지 않는다. pending없는 실제 신규 가입 기능을 없애지 않는다.
## 5. [원칙 ⑤] 절차
계약/source·REQ/PLAN·원독립 raw 핀→최소 제품 수정→원두조건과 정상 대비 부품→reason2필드 정합→ordinary source commit/봉인→root 독립/시험지 인수다. 새 remote/PR/main/DB/SQL/AI 예산0.
## 6. [원칙 ⑥] 절차 재검증
counter hold 결과의 q/backup/body SHA와 send0을 확인한다. pendingusers의 q/표시 intent·readState와 upsert0/isNewfalse를 확인하며 같은 loader의 pending없는 생성은 유지한다. 원 Court claim ID/kind/강도·C1 시나리오는 그대로다.
## 7. [원칙 ⑦] 단계별 실행
제품은 js/core/device-save.js의 read/retry metadata 및 js/core/profile-load.js의 ensureUserRow/loadProfile pendingusers 분기다. claims C2/C3 reason은 tool-cannot-measure로만 교정한다. PC 반례를 로그인 도구 한계에 숨기지 않고 실제 운영 증거와 구분한다.
## 8. [원칙 ⑧] 막힐 지점 예상
손상 counter를 valid legacy로 오인·guard가 신규가입을 막음·pending source 변화·계정 owner·기기 quota를 예상한다. 전체 원스위트/guest/실auth/운영은 이번 배정 밖이고 root 후속 교정·심사와 원미확인을 유지한다.
