# 목표: 첫 독립검토의 손상 attempts 재전송과 pending users 기본 생성 두 경계만 교정한다.

source d831b3a9(제품 frozen0e785 동일), branch fix/dir006-b-correction-01a13674. 기존 common309d/retained695/Bleaf는 root 중앙 연결이며 이 교정은 중앙/tasklinks/TICKETS를 쓰지 않는다. 모델 actual gpt-6.1-sol/high, turn_context 2026-10-14T04:18:04.465Z. 선택 이유는 기존 작성자의 두 좁은 제품 경계 교정이며 독립 재확인은 ops가 맡는다.

- [x] 원 firstpacket·작성 metadata 계약·범위 인수 · 예상4분 · source-seal.json에 원 raw491cb8/독립문서 SHA·actualmodel 및 생성/ACK 계약 핀
- [x] attempts integrity 및 users pending bootstrap guard·C2/C3 reason만 교정 · 예상5분 · source-seal의 3변경 SHA, 정규화/operation/lastFailure 새규칙0
- [x] 두 선택 반례 및 필요한 정상 호환 대비 · 예상5분 · selected-after-1791951971796.json의 선택6조건·원 raw/첫 탐침 실패 보존, actualauth/HTTP/DB/guest0
- [ ] 정상 hook commit·source seal·ownPID closure/root 인계 · 예상6분 · exact commit/clean/추가쓰기0, push/PR/remote0·원 Court반려1 유지

## 1. [원칙 ①] 파악
첫 독립 source0e785는 attempts 문자열을 받아 자동 상한을 넘겼고, own users pending/backup 없음/GETempty에서 기본 upsert를 했다. 원 raw와 먼저 작성된 의견/CI/Court를 교정 결과로 덮지 않는다.
## 2. [원칙 ②] 본질·원인·중심·핵심
본질은 보존된 변경의 재시도 권위를 사실대로 제한하는 것이다. 원인은 retry 제어 metadata의 검증 누락과 pending overlay보다 먼저 호출된 bootstrap이며 중심은 read 및 ensureUserRow다. 핵심은 손상을 hold하고 이미 있는 보존 intent를 신규가입 기본값으로 대체하지 않는 것이다.
## 3. [원칙 ③] 해결방식
accepted entry 생성이 attempts0, 응답 처리 +=1이므로 safe integer>=0만 읽는다. 기존 optional confirmed/미래 metadata는 그대로 보존한다. validated users pending을 ensureUserRow 앞 분기에 전달하고 원 pending없는 신규 생성은 유지한다.
## 4. [원칙 ④] 재검토
operation/lastFailure 전체 규칙을 새로 만들어 범위를 넓히지 않는다. 유효 counter·records schema1와 원 metadata, pending없는 가입 기능을 대비하여 오류를 막되 기존 기능을 삭제하지 않음을 확인한다.
## 5. [원칙 ⑤] 절차
원인/원계약 인수→REQ→두 제품 경계·reason2필드→선택 부품/정상 대비→정상 commit/봉인→root/ops 인계다. 시험지 writer hnd의 커밋을 임의 인수하거나 기존 시험을 편집하지 않는다.
## 6. [원칙 ⑥] 절차 재검증
반론1 counter 없는 오래된 항목도 정상화하자: 생성 계약에 근거가 없는 값은 임의0으로 만들지 않고 원bytes를 hold한다. 반론2 users guard가 신규가입을 없앤다: valid pending이 있을 때만 좁게 적용하고 없는 기본 생성은 그대로 비교한다.
## 7. [원칙 ⑦] 단계별 실행
단독쓰기 device-save read/retry metadata, profile-load ensure/load pendingusers guard, 원 B claims C2/C3 reason만이다. 기존 C1/시나리오·원 raw/first·P0/Court/guard·modules hand·운영·중앙은 변경하지 않는다.
## 8. [원칙 ⑧] 막힐 지점 예상
legacy optional과 새 손상을 섞는 오류·missing backup·empty/오류/owner·late q·hnd 파일 충돌을 예상한다. 원두조건만 진단하고 실제 auth/HTTP/DB/guest·원스위트는 실행하지 않는다. 미측정 운영·사용·효과는 null, 후속심사/통합은 root다.
