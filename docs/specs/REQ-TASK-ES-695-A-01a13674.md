# DIR006 K18-A 기기 확인 뒤 실제 기록 흐름

실행 TASK-ES-695-A-01a13674 · retained TASK-ES-695/TASK-OG-PRODUCT-PART-01a1310c · common TASK-CC-CELL-UNWIRE-RUN-309dca5d(root 중앙 단독).

배정 원문: 「A의자료+변경목록 기기write/readback→기기확인직후input/lock/보존부분photo정리→XP/축하/기존AI후속→remote비동기status·per-type결과/timeout미확정 계약을 실제보이는흐름으로구현, 기존같은API callers호환/기기실패 입력잔류/본문만저장때photo잔류/현재계정세대/late응답안전·stablewindow-recordId·doubleclick 포함.」 「원 구현된P0 재구현/원시험전체반복0」 「사진/AI/energy/focus개인서버확장·일정서버보존·새AI비용·기능삭제·외부publish/SQL3/첫지표/원한건/liveDB쓰기budget0.」

이해: 무손실을사용자의저장행동으로확인하고표시한다. 분류: 탐색/복합구현; WORK-REFERENCE PR977·DIR006/P0/기존8원칙/세포골격을기준으로원래API에연결한다. 예측: P0실패를삼키거나기기성공과원격확정/XP확정을혼동할위험. 반론: 빠른후속이원격안전을보장하지않고, local단언이실제사용행동을대체하지않는다. 선택: A경계의component·actualChrome행동을재고B/C전체서버보장은미확인으로분리한다.

선정source는fresh origin/main e140db658f5b735f8b2d99fa45f541d16871994e(PR978 실제병합). 원083/084/087/088/091/094, 저장계약2·5·7절, DIR006 A, eg17 tickets가근거다. 제품/운영/use/effect는착수당시null. 실제모델과제품SHA/직전commit/P0/시안/원raw는reports의인수측정으로고정한다.

## 인수 계약 13칸
| 칸 | 값 |
|---|---|
| 1 식별 | 위 실행/retained/common ID 유지 |
| 2 원요구 | 위배정원문·SAVE-SYNC-CONTRACT·DIR006 A·원083/084/087/088/091/094 |
| 3 목적 | 작성자료를잃지않고기기보존확인후빠른후속·정직한원격상태 |
| 4 책임 | /root/contracts A단독writer·root독립검토/제품병합·추가소환0 |
| 5 source | e140 freshmain·PR978approved exception·기존695 P0·시안정본·eg17 인수 |
| 6 대상 | home-cockpit.saveProfile/LocalKeep.setBackupFromSave/checkin-capture/pro-record-save/같은저장helper·#captureSyncStatus/#captureSyncAction/#a11yLiveAnnouncer |
| 7 불변 | P0보존·원격권위·5승인선·같은계정/id/세대·원raw/시험/claims/판정불변 |
| 8 선행 | source/소유권/CAS확인·시안확정범위·기존server권한/예산읽기인수 |
| 9 단계 | 계약→경계설계→배선→당해반례/Chrome→신고/guard→commit/PR/Court |
| 10 완료 | 기기실패input유지·부분본문photo유지·확인후잠금/XP·stableID/doubleclick·late/account/status를사용행동과자료되읽기로확인 |
| 11 검토 | source기계대조/의미있는changed-boundary검증/실제Chrome·root독립검토·Court판정분리 |
| 12 미완 | B/C serverCAS/두기기/actual운영복원·liveDBwrite/SQL예산0·제품merge전운영/use/effect미확인 |
| 13 다음 | root독립검토뒤제품병합;별도허용된운영읽기/복원증거와B/C후속분리 |

## 1. [원칙 ①] 문제 정확히 파악
기존saveProfile/P0/readback/caller와원계약을끝까지읽고원실패/현재소스/실제로변경할배선을분리한다. A목표는기기보존후입력/잠금·XP·상태를현재기록행동에서확인하는것이다.
## 2. [원칙 ②] 본질·원인·중심·핵심
본질=자료무손실과정직한feedback. 원인=원격대기와기기보존/후속결합·catch/undefined결과. 중심=saveProfile과두기록caller의동일계정·stableID·변경세대. 핵심=P0보존을재사용하고정확per-type결과와현재세대상태를노출하는것이다.
## 3. [원칙 ③] 해결방식
유형별기기자료/변경목록write+readback, 보존부분만입력정리, 후속한번·원격비동기timeout미확정을연결한다. 기존API호출은반환값추가로호환하고새helper는같은저장책임/신고서에한정한다.
## 4. [원칙 ④] 재검토
quota/손상/partial/blocked/account전환/late응답/중복submit을반대증거로검토한다. 메모리성공을기기확인으로, HTTP응답을원격확정으로, fixture를실계정E2E로표시하지않는다.
## 5. [원칙 ⑤] 절차
source/owner인수→현배선/불변선고정→기초반례→최소helper/기존API→두caller/시안→필요검증→신고/guard→일반commit/PR/Court→root인계.
## 6. [원칙 ⑥] 절차 재검증·반론 격파
localStorage쓰기성공만으로input삭제하면목록/사진복구보장이없다. 두되읽기와partial반례를구분한다. late응답무시가server옛요청을취소하진않으므로A의계정/현재세대표시만확정하고BC보장미확인을남긴다.
## 7. [원칙 ⑦] 단계별 실행
root지정파일/같은저장책임module만단독쓰기한다. 원P0/원시험전체재실행·기대값수정0, root공용/규범/Court/gate/Notion쓰기0. 새cell신고·생성/가드는실행기계로맞추고baseline손수수정0.
## 8. [원칙 ⑧] 막히는 지점 예상·성과 측정
source이동/owner불명부분만hold하고다른범위진행한다. 계정/세대/사진보존과window ID경계가기초실패후달라진실제행동을재며못잰운영/E2E/use/effect는null. 중단은read/test까지즉시멈춘다.
# A 구현 경계와 인수 조건

`saveProfile({deviceFirst:true, recordId, operation, focus:true})`는 자료와 `ourgoal_save_pending_<uid>`를 되읽은 결과를 즉시 반환한다. 결과는 account/recordId/changeId/generation/localRevision, 여섯 state와 reason, photoStored, users/goals/records 각각 device·remote, whenSettled다. 무인자 호출은 기존 원격 대기 순서를 보존하고 새 반환값에는 legacy-unconfirmed/device:null을 적는다. 기존 열한 경로의 전환 완료를 주장하지 않는다.

새 `js/core/device-save.js`는 기존 능력 등록부에 storage.device.save/retry/message/status/focused를 제공한다. 목록 주인은 data.save.pending 하나이며 data.records의 기존 주인은 그대로다. 기존 LocalKeep와 RecordLedger의 DTO·컬럼 fallback을 경계에서 공급받는다. 자료 쓰기 실패 false/throw, 손상·source 변경은 실패다. 실제 quota 예외가 있었고 해당 백업이 불변인 경우에만 대상 새 사진을 제외한 사본을 재검증한다. 옛 사진/피드백 사본과 P0 판단은 바꾸지 않는다.

목록은 account/kind/target/operation/changeId/generation/payload/knownServerState:null/createdAt/attempts/lastFailure를 저장한다. confirmed payload와 대상별 세대도 남겨 local-only 피드백·사진을 같은 원격 쓰기로 중복 발송하지 않는다. navigator.locks가 없는 환경은 저장 성공으로 승격하지 않는다(지원 미확인); 같은 계정의 자료/목록 쓰기와 보내기는 각각 브라우저 잠금으로 직렬화한다. 실제 여러 탭/폰·서버 CAS는 별도 미확인이다.

목록에 없는 과거 기록은 이 A 경로가 자동 발송하지 않는다. 자료만 남은 중단은 기존 P0 보관 규칙을 따르며, 목록만 남은 중단은 목록 DTO의 본문만 백업에 복구하고 사진 없음 표식을 붙인다. 원격은 현재 로그인 uid와 요청 uid가 같을 때 기존 checkins DTO 대상만 보낸다. 실제 returned row가 1행이고 id/user_id/보낸 칸의 자료형과 시점이 같을 때만 해당 changeId/세대를 확인한다. 컬럼 fallback으로 칸이 빠졌으면 원문 payload는 버리지 않고 미확정으로 남긴다. HTTP 성공·0행·취소·제한 시간은 확인이 아니다.

timeoutMs/retryMs/maxAttempts는 기기 설정 saveSync에서 읽고 코드에 상한을 둔다. 게스트는 local/guest-not-sent이며 원격 0이다. 로그인 상태 변경·온라인 복귀·열어 둔 기기의 상한 있는 heartbeat·다음 저장/사용자 재시도는 새 목록만 확인한다. 거절과 상한 도달 항목은 자동 재발송을 멈추며 기기 자료는 남긴다. B/C의 운영 서버 조건부 쓰기·삭제/복원·전체 caller 전환·정리 정책·여러기기 XP 원장은 별도 작업이다.

홈은 #captureSyncStatus/#captureSyncAction와 #a11yLiveAnnouncer에 속성·글만 쓴다. 기기 확인 실패 때 입력/사진과 draft ID를 남기고 XP/AI/창 닫기 0이다. 확인 직후 잠금을 풀고 보존된 부분만 비우며 사진 누락이면 미리보기·파일과 같은 ID/XP 표식을 남긴다. AI는 원profile/recordId/본문 객체를 확인한 뒤 해당 기록에만 붙이고 현재 focus가 다른 기록이면 현재 UI를 바꾸지 않는다. XP 기기 선반영은 서버 원장 확정이 아니다.

검증은 reports/TASK-ES-695-A-01a13674의 source-intake/component-result/chrome-result와 필수 검사 raw다. 실제 Chrome은 정식 제품 페이지의 실제 게스트 생성과 DOM/Storage, 국소 quota·AI 실패/지연 반례다. fake auth·mock user 배열·실서버 E2E 표기 0, 외부 통신 완료/DB 쓰기/AI 요청 0이다. 운영·대표 사용·효과·서버 XP·Court는 각각 별도로 측정한다.
