기록 저장에서 원격 응답이 기기 백업보다 앞서고 홈 입력/사진·XP 및 전문 창 닫기가 저장 확인 전에 진행되던 흐름을 고쳤습니다. 두 기록 caller만 자료+미확정 변경 목록을 기기에 쓰고 되읽은 뒤 입력/잠금을 풀며, 원격 결과는 별도 상태로 알립니다. 기기 실패는 입력 유지, 사진 partial은 미리보기와 같은 기록 ID 유지, 늦은 AI/응답은 원 계정·기록·세대에 귀속합니다.

선행 규범 PR #978은 e140db658f5b735f8b2d99fa45f541d16871994e로 실제 main 병합됐습니다. 이번 PR의 규범/ACTIVE/Court/gate/기준선·P0 원보고/기대값 수정은 0입니다. retained #TASK-ES-695, common TASK-CC-CELL-UNWIRE-RUN-309dca5d(root 중앙), 실행 leaf TASK-ES-695-A-01a13674입니다. REQ/PLAN 및 작업자 증거: docs/specs/REQ-TASK-ES-695-A-01a13674.md, docs/specs/PLAN-TASK-ES-695-A-01a13674.md, reports/TASK-ES-695-A-01a13674/HANDOFF.md.

검증: 새 changed-boundary component 18개, 실제 Chrome/155.0.8059.40의 게스트 제품 DOM/Storage에서 중복 제출·재실행·입력 잔류·사진 partial/같은 ID 재시도·전문 모달·늦은 AI 귀속. 공식 module-specs/module-guard·문법·diff 검사 종료코드를 raw와 함께 보존했습니다. local Chrome의 scoped quota/AI fault 증거이며 실계정 E2E가 아닙니다. DB 쓰기/외부 요청 완료/AI 비용 증가 0입니다.

범위: home-cockpit/device-save/checkin-capture/pro-record-save/index의 저장 상태·loader/modules 신고서. 무인자 saveProfile의 기존 await 의미는 유지하고 확인되지 않은 결과를 legacy-unconfirmed/device:null로 돌려줍니다. 전체 caller 전환·server CAS/삭제·여러탭/기기·XP 서버원장·운영/use/effect는 미완/null이며 저장 안전 전체 완료나 자체 통과를 주장하지 않습니다. 현행 과거 전량 전송 경로는 B/C 별도이며 이번 A 옵션은 새 목록 대상만 전송합니다. 제품 병합은 root 독립 검토 뒤 root 담당입니다.
