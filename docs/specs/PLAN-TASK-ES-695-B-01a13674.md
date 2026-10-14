# 목표: DIR006 B의 users/goals 변경과 빈 서버 결과·legacy queue를 확인 세대 및 존재 미확정 보관으로 연결한다.

기준 origin/main d326db5e6c7c50255e198d44204241f0c68fc0e8(fresh fetch), PR980 실제 merge와 원06C54A5D 확인부족은 별개다. WORK-REFERENCE 기준979/L132/L133, 규범 예외 PR978 승인·실제 병합 인수. 단독 writer contracts, 독립 검토 root 후속 배정. 공통309d는 root 중앙 담당, 자기 작업연계는 로컬 owner1로 작성하며 root 중앙 갱신을 중복하지 않는다.

- [x] 원전/현 source/모델/세포·3commit·claims·범위 확정 · 예상10분 · implementation-1/source-intake.json에 source SHA/owner/DTO/직전3commit 실측
- [x] B1 users/goals typed pending을 기존 A core로 확장 · 예상25분 · component 원first 및 manual-component에 kind/target/세대/반환행·quota·무인자 분리 근거
- [x] B2 load/oldqueue·실제 수동 동기화 존재미확정 보관·확인 세대만 처리 · 예상20분 · load-component/manual-component/pending-load-component 및 실제guest browser raw에 전량 전송0/원bytes·미확정 안내 근거
- [x] changed boundary local 검증·필수 generator/hooks·source봉인 · 예상20분 · source e38c6592 및 정상 push·원first 보존, CI첫실패와 독립결함은 별도 미완
- [x] draft PR/claims/심사 청구 및 인계 · 예상10분 · draft982/exact0e785 첫 Court68BA002F 돌려보냄 인수, 통과·병합·사용·효과 표시0

## 1. [원칙 ①] 파악
device-save records 주인 core를 읽고 home-cockpit saveProfile users/goals legacy DTO, profile-load server빈 응답, virtual-user OfflineSyncManager 순서를 인수한다. 원087~090 사용확인과 구현을 분리한다.
## 2. [원칙 ②] 본질·원인·중심·핵심
본질은 자료 보존과 원계정/작성 순서다. 원인은 legacy 전량전송/확인전 queueflush이며 중심은 기존 pending 세대 및 per-kind 반환행이다. 핵심은 새변경 증거만 보내고 전환전 자료는 보관하는 것이다.
## 3. [원칙 ③] 해결방식
A save/retry/status/message/lock·기기 readback을 재사용한다. 종류/target 키·typed payload·확인 세대만 제거하며 기존 store kind와 DTO·recordID를 유지한다. 사용자가 읽는 안내는 실제 device/remote 결과를 구분한다.
## 4. [원칙 ④] 재검토
빈 서버 결과를 없음으로 확정할 수 없으며 전환전 queue를 새변경으로 자동승격하지 않는다. client generation과 returnedRow는 server CAS/두기기 권위가 아니다. 미확정은 null/보관으로 남긴다.
## 5. [원칙 ⑤] 절차
fresh origin/scope·REQ/PLAN→B1→B2→필요local검증→공식generator/ordinaryhooks→draftPR/claims/Court→root 독립검토다. liveDB/auth/외부쓰기/새fixture/SQL3원예산 재사용0.
## 6. [원칙 ⑥] 절차 재검증
반론1 빈데올려도된다: 읽기범위/권한/삭제/동시변경의 불확정을 보존한다. 반론2 오래된같은본문답은새확인이다: 원changeId/세대/kind/target/account 결박을 검증해 이전답으로 새항목을 지우지 않는다.
## 7. [원칙 ⑦] 단계별 실행
기존 A 재구현0·recordID재생성0·새syncengine/원B 밖 storekind0. users/goals/load/legacy 및 실제 js/tabs/settings/account-actions.js의 bindResyncAccountDataButton까지 6파일을 단독 작성한다. 수동 버튼은 typed pending retry와 읽기 상태 안내이며 C 다른 caller의 입력/창/XP 여정은 다음ticket로 남긴다. 원 기능/P0 보관/원photo/AI/settings 서버범위를 바꾸지 않는다.
## 8. [원칙 ⑧] 막힐 지점 예상
kind collision·중단복구·local quota·계정교체·자료형/0행/timeout·late 세대·잠금미지원·owner충돌·800줄을 예상한다. 정확범위만hold하고 독립항목은 계속한다. 운영/두기기/CAS/계정전환사용/effect는null.

추가 확정된 B2 품질: storage.device.pending 읽기능력으로 원 q strict owner/schema/세대와 raw exact-byte lease를 확인한다. pending 대상의 기기 백업/본문은 원격 옛 읽기로 바꾸지 않고, nonpending은 기존 P0 표시를 유지한다. LocalKeep 원함수 byte 대조는 pending-load-component 정본이다. 실제guest 첫 화면조작/대기실패 raw는 보존하며 수정한 조작/최종 source를 별도로 기록한다. 다른 탭 backup 원자성·serverCAS/두기기·실계정 사용은 null이다.

## 현재 검토 결과와 다음 담당
계획의 위 완료 표시는 작성/선택측정/심사청구 행동에 한정하며 제품 확인 완료가 아니다. 최초 공식68BA002F는 C2/C3 reason이 tool-cannot-measure가 아니라 needs-live-server여서 기존 cannotBecause를 채택하지 않아 돌려보냈다. CI account-switch 시험은 closure loadGeneration을 로드하지 못했고 시험지 writer handover_review가 원단언 그대로 별도 교정 중이다. ops는 frozen0e785에서 attempts invalid 재시도 상한과 users pending-only/default bootstrap의 두 L1 반례를 확인했고 운영결함으로 승격하지 않았다. root가 원 sealed firstpacket을 인수한 뒤 좁은 round1을 재배정한다. 이 시점 제품/시험/claims 추가쓰기0, 독립검토 원source0e785 유지, 병합0. 미완 문제를 완료로 해석하지 않는다.
