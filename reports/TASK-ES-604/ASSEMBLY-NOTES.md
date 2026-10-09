# TASK-ES-604 독립 보강 자료

원래 native worker의 여섯 산출물과 claims/원시는 그대로 보존한다. worker의 세포 의미 대조 기여와 별도로 root가 공식 exporter의 `--stdout` 경로를 실행하고 독립 audit의 실제 기준 전후 바이트를 대조했다. 이 추가 자료는 그 역사적 실행을 공개 가능한 필드로 묶은 보강이며 법정 판정이 아니다.

## 출처와 실제 측정

- 원 worker 종료코드: 0. 실제 model/effort: null/null.
- 독립 기준 전후 보호파일: 5139; 원 기준과 전후 rows SHA가 같다. 승인된 TASK605 tracking 두 키 변경을 별도 config closure로 대조했다.
- 일곱 대상 대조: 7; 전체 semantic 세포: 351; mismatch: 0. 이 숫자는 독립 actual review와 measurement에서 프로그램으로 추출했다.
- 공식 exporter 종료코드: 0; audit before/after: 0/0. 원 raw와 root replay raw는 같은 SHA `9ece5c57dabb1f6856ab33760372d30389ab87c8576f94904e31245b2bef1896`이며 기존 `raw/generator.stdout.json`을 함께 가리킨다. 두 실행의 출처는 별도로 보존한다.

## 원래 주장과 보강 범위

C34–C38의 원script 보존 상수 0/true는 실제 보존 측정으로 채택하지 않는다. 원 claims의 값은 원문으로 남기며 이 보강이 원script의 출처라고 재해석하지 않는다. 원script는 별도 출력 인자 없이 기존 증거 세 파일을 덮으므로 재실행하지 않는다. 실제 독립 보강은 원 baseline과 역사적 before/after에서 관측한 최종 바이트 동일성만 다룬다. 순간 쓰기 부재와 모든 untracked 파일 보존은 측정하지 못했다.

## 역사적 맥락과 현재 차이

역사적 worktree HEAD는 `c8b8ddfb666a39bbae75b50da7f3b290e0701869`, 저장 구조지도 근거는 `76ac598ec35231a93619138dce98fec87fd8c509`, WORK-REFERENCE SHA는 `713eeb92abc8e307dbcaa494f399b42a2e72fb44faa41b8c8b9fce4907dd1bee`이다. 현재 준비 시 origin/main은 `b6872be229473e3208ff202b07a157d375a9727a`이고 WORK-REFERENCE SHA는 `b0fcfd7b494dcad14f02da86e1173d7c8840cb2325d597597698fbbd80e13d42`로 다르다. 원 exact audit는 옛 canonical SHA를 필수 검사하므로 현재 맥락을 거절해야 한다. 이번 준비에서는 그 실행을 호출하거나 guard를 우회하지 않았다.

## 코드와 비공개 경계

`assembly-independent-audit.source.txt`는 당시 실제 audit의 private 경로/실행 binding을 기호화한 읽기용 projection이다. 원 실행코드 SHA와 projection SHA는 별개다. projection은 실행되지 않았고 portable 재현기가 아니다. 실제 exact 원code/envelope/검증코드/영수증은 로컬 정본에 바이트 그대로 보존된다. 다른 체크아웃이나 PC의 재현에는 새 context binding 및 독립 검토가 필요하다.

private snapshot·prompt·instruction·신원·auth·config 내용·전체 입력파일은 공개 자료에 넣지 않았다. 입력은 alias와 SHA만 연결한다. 원 공개 지도 raw는 편집하지 않았다. 제품 E2E, 실제 model/effort, Court, 웹/노션 반영, portable 설치 및 장기 효과는 이 보강으로 확인되지 않았다.

## 자료 연결

- `assembly-source-context.json`: 원6/19입력/기준선/config closure/실행 source SHA와 현재 준비 관측
- `assembly-independent-audit.source.txt` + `assembly-replay-envelope.json`: 읽기용 source projection과 역사적 실행 조건/한계
- `assembly-independent-measurement.json`: 역사적 실제 전후 측정 및 C34–C38 한정
- `assembly-run-receipts.json`: 공식 exporter/audit 명령 source·종료코드·시각·byte SHA

공개 field projection 및 자료 준비 검사는 작업자 기록이며 최종 결과의 정본은 별도 Court 판정서다.
