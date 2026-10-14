# 개요
DIR006 C2는 기존 목표 나만 보기 undo의 무인자 저장을 typed goals update에 연결한다. 단독 제품 범위 js/core/confetti.js::showUndoPrivacyToast다. base7ce400ad0c883d522a76b18556aedc269356d011이며 C1 source19ec/closure7ce와 QA b06b93f3db7a132603f8919e719670561e0623e5는 불변 보존한다.

# REQ/PLAN
## 1. [원칙 ①] 파악
QA FIRST.json의 measured만 읽었다. 동일 ID 생성/재열기/새로고침 true지만 undoStoredPrivate/reloadPrivate false다. 거대 DOM 전문은 읽거나 복제하지 않는다. 실제 제품 caller는 new-goal-modal.js의 manual theme 생성 후 L.showUndoPrivacyToast(newGoal.id,message(...)) 한 곳이며 export/등록·설명 참조와 구분한다. 원 UI 여정/C1 선정9를 재실행하지 않는다.

## 2. [원칙 ②] 본질·원인·중심·핵심
본질: 사용자가 고른 공개 범위를 기기에 남기고 실제 상태를 알린다. 원인: 기존 callback은 target.visibility만 바꾸고 무인자 saveProfile 뒤 고정 성공을 알리므로 sb=null에서 기기 저장까지 못 간다. 중심: #toast/#btnUndoThemePrivacy·캡처한 profile/account/goal과 실제 core/home-cockpit→device-save의 typed goals 결과다. 핵심: 원 ID/DTO·코어를 보존하면서 device true와 현재 generation/changeId/localRevision을 성공 후속에 연결한다.

## 3. [원칙 ③] 해결방식
showUndoPrivacyToast가 만들어진 때 profile/account·같은 goal 객체·소유 문서/토스트·첫 label/undo 단추를 캡처한다. 클릭은 중복 잠금 뒤 같은 target.visibility를 private로 바꾸고 L.saveProfile({deviceFirst:true,kind:'goals',targetId:goalId,operation:'update'})를 소비한다. local generation/상태는 core가 발급하며 임의 ID/세대/원격 권위를 만들지 않는다. 저장 결과는 올바른 account/kind/target/types.goals.device/state와 현재 storage.device.status를 대조한다.

실패/미지원은 private 선택·기존 목표/ID를 보존하고 자기 토스트의 label에 진실한 재시도 안내를 넣는다. 단추를 다시 풀고 재시도도 같은 target이다. 기기 확인 뒤 공용 message로 local/confirmed/reauth/rejected를 분리해 말하고 기존 view propagation 후속을 보존한다. 신규 목표/자동 privacy 롤백/기존 상태·default 메시지·다른 confetti 변경0이다.

## 4. [원칙 ④] 재검토
생성 완료 후 이미 모달이 닫힌 caller이므로 active 모달을 요구하면 정상 undo가 막힌다. 닫힌 모달 대신 소유 document와 현재 toast/label/button/show·profile/account/goal 객체·visibility와 현재 typed 세대로 귀속한다. 토스트 교체/닫힘/다른 목표 변경·늦은 계정이면 새 UI를 덮거나 성공을 띄우지 않는다. 원 source의 core in-place identity 한계는 재구현/확정 결함으로 올리지 않는다.

## 5. [원칙 ⑤] 절차
exact source·직전3commit·원claims/QA measured·동일 WORKREFERENCE982→계획/REQ→함수 한 곳 교정→최소 source 부품→claims·원 보호·normalhook→seal/closure/clean→root 독립 확인이다. 실계정/API/auth/backend/SQL/한건/AI/Notion0이며 새 실제 UI 재실행은 여기서 배정되지 않았다.

## 6. [원칙 ⑥] 절차 재검증
반론1 private 메모리 변경과 HTTP 상태만으로 기기 보존을 말할 수 있는가? 아니다. 원 typed 저장의 device true 및 exact 결과/현재 세대가 필요하고 source 부품은 실제 로그인/E2E가 아니다. 반론2 L.toast로 실패를 알리면 기존 undo 단추가 사라져 재시도가 막힐 수 있다. 같은 소유 toast의 label만 바꾸고 단추/onclick을 유지한다. 새 toast이면 아무것도 덮지 않는다. callback이 중복되거나 늦어져도 캡처 객체/현재 세대 검사가 필요하다.

## 7. [원칙 ⑦] 단계별 실행
제품 writer는 confetti 함수 내부뿐이다. 기존 new-goal-modal/SAVE-SYNC-CONTRACT/코어·schema·modules/rootplan/TICKETS/공용 연계는 쓰지 않는다. 나만 보기 선택은 기존 기능이며 개인정보 확대/정책 변경/추가 데이터/게시/삭제가 아니다. common309d는 root 단독 sync, retained695와 새 leaf는 localpending으로 기록한다.

## 8. [원칙 ⑧] 막히는 지점 예상
기기 실패와 provider 미지원은 선택을 남기고 재시도하며 거절/재인증/local/confirmed를 섞지 않는다. source가 바뀌면 기존 QA/첫 실패를 고쳐 성공으로 만들지 않는다. actual UI/서버 권위/use/effect/Court는 null이며 root 별개 담당의 후속이다. WORKREFERENCE982 전체를 읽은 C1 시점과 현재 SHA 동일임을 확인했다. actual6.1-sol/high 자기 turn_context/이유는 INTAKE로 고정한다.

# 핵심 변경사항
R1 typed goals update/실제 기기 확인 뒤 상태 안내. R2 실패 재시도·private 선택/ID 보존. R3 중복 잠금·계정/목표/토스트/typed 세대 currentness. R4 기존 C1/default/statusMessage/다른 confetti/코어·원시험 보존.

# Claims
source 부품과 실제 UI/원격 결과는 분리한다. guest PC로 가능한 동작을 needs-login으로 숨기지 않으며 새 시나리오는 준비만 한다.

# 법정 판정서
이번 C2 공식 Court/실제 UI 검증은 null이다. 기존 QA 실패·원 공식 판정/원예산은 그대로 보존한다.
