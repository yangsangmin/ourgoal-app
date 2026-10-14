# 개요
DIR-006 C1은 목표 만들기 두 경로의 저장 결과·입력 유지·잠금·창 ID를 기존 typed goals API에 연결한다. 실행 task TASK-ES-695-C-GOAL-01a13674 / retained TASK-ES-695 / common TASK-CC-CELL-UNWIRE-RUN-309dca5d(root 단독 sync, leaf 등록 localpending). base origin/main 87b7fbd0f8530fabe76413757d577da746406471, A PR980 d326 / B PR982 실제 merge 뒤다. WORK-REFERENCE 기준 PR979·SHA1eaa60c7d11472510c16b30fe1dfc9c3677ce513f9dfb2b54e26b2314b143d73는 앞 작업에서 끝까지 읽은 동일 bytes를 다시 확인했다.

# REQ/PLAN
## ① 파악
showNewGoalReviewStep의 ngApplyBtn과 showNewGoalManualForm의 mSave는 클릭마다 새 ID/목표를 만들고 trackGoalCreated→무인자 saveProfile→closeModal/성공 안내를 수행한다. 원11은 대표 저장 여정이며 이번 소비자는 그 중 목표 하나의 두 mode다. 역사 intake source3ffe는 원계약 인수용이며 actual87 제품 근거와 섞지 않는다.

## ② 본질·원인·중심·핵심
본질: 사용자가 작성한 목표가 확인 없이 사라지거나 중복되는 것을 막는다. 원인: 호출 결과·기기 확인·계정/창 귀속을 소비하지 않는 화면 배선이다. 중심: goals/new-goal-modal 세포의 두 단추/입력과 core/home-cockpit::saveProfile→core/device-save::save 결과다. 핵심: 코어·DTO·returned-row 판별을 다시 만들지 않고 단일 목표 ID와 현재 draft에 결과를 결박한다.

## ③ 해결방식
new-goal-modal 내부 bindGoalSave는 창 mount에서 profile/account/goalId/createdAt을 한 번 캡처한다. 중복 클릭을 막고 실제 입력·변경 세대·단추 identity·modalOverlay active·modalSheet identity를 확인한다. 기존 목표 객체는 같은 창 재시도 때 같은 ID로 교체하여 중복 push하지 않는다. 기기 실패 시 원입력과 창·같은 ID를 유지한다. typed saveProfile({deviceFirst:true,kind:'goals',targetId,operation:'create' 또는 실제 기기 확인 뒤 'update'}) 결과의 account/kind/target/types.goals.device 및 현재 storage.device.status localRevision/generation/changeId를 대조한다. 보존 실패·legacy/오귀속 결과는 성공 후속으로 사용하지 않는다.

| 사용 과정 | 그대로 보존할 자리 | 확인 기준 |
|---|---|---|
| 템플릿 검토 → 제목/마일스톤 편집 → 적용 | ngTitle/ngMsList/ngBackBtn/ngApplyBtn | ID는 창별 하나, 실패 입력·창 유지, 기기 확인 뒤 기존 view propagation/성소 렌더 |
| 직접 설정 → 종류/분류/마감/공개 범위 → 만들기 | mGoalTitle/mTopic/mGoalDue/mGoalVis/mCancel/mSave | 같은 typed goals API, 원 DTO/공개 범위 유지, theme undo 기능과 공용 상태 안내 동시 보존 |
| 저장 동안 다시 클릭/입력 편집/뒤로/계정 전환 | 기존 탈출/입력 동작 유지 | 중복 요청0, 옛 응답은 새 창·계정·세대의 입력을 닫거나 성공 안내하지 않음 |

목표 창의 기존 마크업·모바일 배치/슬롯/인풋 규격은 변경하지 않는다. 저장 상태만 기존 공용 도우미를 소비한다. 새 상단뷰·필드·추천/컨디션/커닝 삭제·온보딩 변경0.

## ④ 재검토
기기 확인 후에도 원격 반영은 confirmed와 local/sending/reauth/rejected를 구분한다. 저장 실패 목표 draft는 같은 ID로 메모리에 남아 재시도하며 저장 확인 전 activeGoalId/생성 telemetry/렌더 후속은 발생하지 않는다. 계정·창이 바뀌면 옛 목표 자료를 새 계정에 옮기지 않는다. server CAS·두 기기·기존 privacy undo 저장 경로·사용/효과는 별도다.

## ⑤ 절차
원kernel/statute/DIR006/회의03·module 계약/직전3commit/latest claims→현재 API source/hash→두 submit helper 연결→선정 실제 source VM 부품 측정→claims·source pin/정상 hook→closure/ownPID/clean→root 별개 독립 검토·CI/Court. 기존 원6/P0/whole CI 반복0, 실계정/API/auth/SQL/AI/Notion/게시/새 양성 fixture0.

## ⑥ 절차 재검증
반론1 반환 state가 local이면 기기 보존을 믿어도 되는가? 상태 라벨만 보지 않고 원 typed 결과의 device true·정확 account/kind/target·현재 상태 localRevision/generation/changeId를 대조한다. 실제 되읽기는 코어가 수행하며 부품과 원격 실측을 분리한다. 반론2 같은 sheet DOM을 새 창이 재사용하면 identity가 같아도 닫힐 수 있는가? 단추 객체·active overlay·창별 프로필/ID·변경 세대 및 실제 input snapshot을 함께 확인한다. 입력 변경은 저장된 초안과 현재 입력을 분리하여 새 입력을 지우지 않는다.

## ⑦ 단계별 실행
제품 단독 new-goal-modal.js. 공용 message/status 소비 신고와 modules 생성물은 root 소유여서 여기서는 수정0. 기존 theme undo 안내와 새 저장 상태의 공존은 정확 confetti optional 인자 필요성을 root에 먼저 전달했으며 추가 승인 전 쓰기0. 시험은 자기 report의 실제 제품 IIFE/코어 제공자와 합성 DOM/저장소/응답을 사용하는 부품 수준이며 로그인·브라우저·실서버 E2E가 아니다.

## ⑧ 막히는 지점 예상
창/계정/source가 바뀌거나 결과가 unknown이면 후속 hold. 입력 유지와 알려진 실패만 안내한다. 기존 privacy undo callback의 무인자 저장, 서버 권위/실사용·효과는 이번 생성 결과로 완료하지 않는다. 원68BA 반려1/65E9 coverage 미완·CI 최초 실패·703/all-tool-only/private positive UI 원자료 불변. 981 승인·chip/condition/cunning 삭제는 별개이고 여기 삭제0.

# 핵심 변경사항
R1 두 mode typed goals 소비 및 stable ID/중복 잠금. R2 기기 확인 전 닫기/성공0 및 실패 입력 유지. R3 현재 profile/account/draft/창/typed 세대에만 후속 귀속. R4 기존 DTO/UI/코어/시험 원형 유지.

root가 추가 연결을 승인하여 js/core/confetti.js::showUndoPrivacyToast(goalId, statusMessage)만 단독 제품 책임에 포함했다. 기존 버튼/onclick/기본 인자 없는 의미/다른 confetti는 그대로 두고 statusMessage만 기존 core/ui-helpers::escapeHtml을 거쳐 표시한다. theme 생성 결과는 공개 범위 설정과 기기/원격 상태를 함께 말하며 privacy undo의 무인자 저장 후속은 이번 생성 범위 밖이다.

게스트 입구는 index.html의 btnLandingPreviewDirect/landGuestBtn→nav goals→goals/render::chipAdd→promptNewGoal→ngManualBtn→mSave이며 로그인 gate 없는 원천을 읽었다. 실제 PC 도달은 아직 null이다. manual-guest-goal.json은 같은 상태/undo를 재는 닫힌 어휘 시나리오 준비이며 이번 author가 실행하지 않았다. 원격·Auth·DB0의 단일 guest PC 실행은 root 후속 담당 배정으로 확인한다. 화면 제품에 codeContains/config로 동작을 낮춰 주장하거나 전체를 needs-login으로 숨기지 않는다(L001/L006).

device-save::isCurrent의 in-place profile.id 변경은 object/id 비교 source 한계다. 이번 helper는 캡처 account로 UI 후속을 거절했지만 코어 자료/queue 귀속 전체에 대한 별도 반례·공식 판정은 null이며 확정 새결함으로 쓰지 않는다.

착수 PR979를 보존한 뒤 새 WORK-REFERENCE PR982 전체를 다시 읽었다. L134의 원 pending users/형 검사와 L135의 실제 제공자/스코프 로더·원시험 보존을 현재 source에서 대조했고 범위를 확대하지 않았다.

# Claims
작성자 주장과 선정 부품 raw만 낸다. 실제 로그인/서버 권위·사용 가능·효과는 null이다.

# 법정 판정서
이번 C source의 법정 판정은 null. 원 판정/첫 실패를 별도 보존하며 최종 판정은 Court다.
