# DIR006 B — 구현 소스 인계

계획 항목과 사용 가능·효과 확인은 별개다. 구현/선택검증은 아래 원자료와 source-packet.json의 실제 파일 SHA에 한정한다. 실제 계정·운영·두기기·serverCAS·사용·효과·공식 Court는 아직 null이다. 본 문서 작성 당시 source commit 전이며 정확 commit/PR은 후속 closure에 기록한다.

설정의 `#resyncAccountDataBtn`은 전에는 강제 전체 읽기/전송 뒤 완료를 알렸다. 지금은 같은 A core의 pending만 재시도하고, 읽기/현재 세대와 보관 사실을 구분해 알린다. 게스트는 실제 isGuest 판별로 로그인 없는 원격 읽기를 건너뛰고 기기 자료를 유지한 뒤 잠금을 푼다. 전체 렌더의 records auto-save에 들어가지 않도록 기존 설정 화면만 다시 그린다. 실제 source는 js/tabs/settings/account-actions.js::bindResyncAccountDataButton이다. root의 앞선 js/settings 경로 오류는 기록상 보존하고 새 잘못된 파일은 만들지 않았다.

users/goals 명시 create/update는 `saveProfile({deviceFirst:true,kind,targetId})`로 같은 pending key/schema1에 종류별 bucket을 더한다. 원 records entries/versions/confirmed/metadata·ID 및 이전 queue raw는 보존한다. 원 무인자 legacy remote-await는 그대로라 C 다른 caller의 전량 전송/입력/XP는 미완이다. 부분 schema fallback은 원 payload를 유지하며 누락칸을 confirmed로 올리거나 자동 반복하지 않는다. B 삭제/되살림은 typed 실패로 범위를 좁히고 기존 legacy 기능은 삭제하지 않았다.

`storage.device.pending`은 기존 strict reader가 owner/kind/세대/자료를 검증하고 raw exact-byte lease와 복사만 제공한다. 주인 core/device-save 및 소비자 core/profile-load 한 곳씩 신고했다. await 뒤와 P0 쓰기 전에 원 q가 바뀌면 대입 전에 hold한다. pending이 있는 종류의 기기 백업/본문은 nonempty 옛 읽기로 바꾸지 않으며 읽기에서 pending을 제거하지 않는다. nonpending은 원 P0 함수로 표시·보관한다. 기존 LocalKeep 함수 전부의 before/after bytes는 pending-load-component 결과의 함수별 SHA로 대조했다. 다른 탭 backup 쓰기 원자성이나 서버 CAS를 새로 증명한 것은 아니다.

empty/error/foreign/throw 읽기는 없음으로 확정하지 않는다. 원 kept 키에 존재미확정으로 보관하며 자동 전체 upsert를 하지 않는다. 전환전 OfflineSyncManager queue는 원 소유 증거가 있는 것만 보관하고 raw를 지우거나 새 pending으로 승격/flush하지 않는다. 보관 quota 실패도 원 backup/queue를 유지한다. P0 함수 본문·원 P0/A claims·기준선·Court/규범/원시험은 바꾸지 않았다.

원 첫 component/load raw와 화면 조작 실패를 삭제하지 않았다. browser-manual의 앞 실패에는 축하/피드백 창과 접힌 외부 summary를 아직 통과하지 않은 조작, 외부 차단 guest read의 관측창 내 미해제 잠금이 각각 남아 있다. 그 최초 raw의 제품/도구 조작 범위는 해당 source SHA에 한정한다. 후속 최종 실제 guest CDP mouse/keyboard는 보이는 입구·축하 닫기·피드백 닫기·설정·일반/고급 summary·수동 버튼을 따라 backup/pending SHA 불변과 미확정 안내·unlock을 측정했다. 개인 로그인/E2E가 아니다. 별도 scenario-check는 제출한 한 시나리오의 로컬 작업자 탐침이며 법정 판정이 아니다.

재사용: `node reports/TASK-ES-695-B-01a13674/implementation-1/{changed-boundary,load-boundary,manual-boundary,pending-load-boundary,browser-manual,scenario-check}.cjs`는 각각 독립 선택검증이다. 이미 원 first/after 파일이 있고 출력은 새 시간별 wx 파일이다. 같은 검사를 일괄 반복하지 않고 변경/결함에 필요한 helper만 선택한다. 합성 반환행과 실제 private FS 부품은 원격 DB fixture나 실제 계정 E2E로 표현하지 않는다.

REQ/PLAN의 8원칙을 각각 유지한다. 13칸 연결: 작업=retained695/leafB/common309d; 원문=DIR006/확정 계약/원087~090; 본질=무손실·정직한 상태; 끝모습=typed 확인과 실제 버튼 안내; 품질=readback/원q·세대; 불변=P0/A/raw/권위; 제외=원예산/외부/서버 확대; 범위=6제품+신고서; 등급=복합FIX; 담당=contracts/독립root배정; 증거=source-packet/원raw; 상태=소스 인계·심사 전; 결과=실제 사용/효과 미확인.

다음은 정상 commit/push·draft PR·공식 심사와 root의 별도 독립 검토다. 병합은 root가 담당한다. root 중앙 task link/원장/Notion/TICKETS는 직접 쓰지 않고 자기 owner1 local pending 기록만 작성했다. 구체 승인된 운영 시험 없이 serverCAS·두기기·C caller·삭제/되살림을 완료로 표시하지 않는다.
