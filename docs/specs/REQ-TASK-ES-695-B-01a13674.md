# DIR006 B — 자료 종류별 확인과 존재 미확정 보관

retained TASK-ES-695 / leaf TASK-ES-695-B-01a13674 / common TASK-CC-CELL-UNWIRE-RUN-309dca5d. 본질 E2/FIX: 기기 자료를 잃지 않고 저장/복원 상태를 사실대로 알린다. 시작 source는 fresh origin/main d326db5e6c7c50255e198d44204241f0c68fc0e8(PR980 실제 병합). 규범 예외는 PR978의 대표 「헌법 개정 승인」 및 실제 main 병합으로 효력발생했다. 원 A의 최신 공식06C54A5D 확인부족은 사진첨부·로그인 도구한계이며 이번 B의 판정이 아니다. WORK-REFERENCE979/L132/L133을 인수했다. 모델actual/requested/reason·sourceSHA/직전3commit/신고서는 reports/TASK-ES-695-B-01a13674/implementation-1/source-intake.json 정본이다.

## 1. [원칙 ①] 파악
js/core/device-save.js는 records의 자료+목록 되읽기·잠금·changeId/generation·원 profile object·returnedRow·retry/status/message를 제공한다. 같은 주인 core/device-save/data.save.pending에서 users/goals 명시 변경을 추가한다. js/core/profile-load.js의 빈 goals/checkins 조회 뒤 전량upsert와 js/core/virtual-user-helpers.js OfflineSyncManager.syncOnline의 oldqueue 복원→무인자save→무확인flush가 B2 대상이다.

사용자 trigger는 설정의 `#resyncAccountDataBtn`이다. 기존 `js/tabs/settings/account-actions.js::bindResyncAccountDataButton`은 `syncServerRecords(true)`→`loadProfile`→전체 profile 대입→무인자 `saveProfile`→`renderAll`→완료 안내였다. `renderAll`의 records 렌더도 legacy 저장을 부를 수 있다. 교정은 같은 버튼으로 기존 DIR006 pending만 typed retry→현재 profile/본문 세대 확인→기존 load 읽기→현재 pending의 기기 본문 및 휴지통 보존·비pending은 원P0 표시→설정 화면 갱신→실제 읽기·확인 상태 안내다. 게스트는 기존 isGuest 판별로 로그인 없는 서버 읽기를 건너뛰고 보관 상태를 알린다. 버튼의 기능과 자료를 삭제하지 않고 기기 보관분을 서버 확인분으로 승격하지 않는다. root의 이전 잘못된 `js/settings/account-actions.js` 경로는 지시 오류이며 실제 파일만 고친다.

## 2. [원칙 ②] 본질·원인·중심·핵심
본질은 자료 보존과 원계정·종류·변경 세대 귀속이다. 원인은 빈 서버 응답을 부재로 읽고 oldqueue를 새 변경으로 취급하는 것과 typed kinds 부족이다. 중심은 A의 기존 pending key와 LocalKeep의 kept키/P0 API다. 핵심은 확인된 해당 세대만 제거하고 전환전 자료는 존재미확정 보관하는 것이다. 원본 key/metadata/records payload/ID는 초기화하지 않는다.

## 3. [원칙 ③] 해결 방식
- B1: `saveProfile({deviceFirst:true,kind:'users'|'goals',targetId})`를 같은 core save로 보낸다. 무인자 의미는 legacy remote-await를 유지하고 C caller의 전량/창닫기/XP 전환은 별도 미완이다. same-account payload owner·kind/target bucket·changeId/generation과 반환 1행을 확인한다. 기존 q.entries/versions/confirmed records는 그대로며 users/goals만 q.kindData의 종류별 같은 구조를 더한다. 이전 schema1 bytes는 읽기만으로 바꾸지 않고 다음 확인 쓰기가 추가 구획을 보존한다. schemaunknown/손상은 실패/보류다.
- 자료형 비교: users는 id===account, goals/records는 id/user_id가 모두 같아야 한다. 시각은 같은 시점·JSON은 키순서와 서버 기본값을 구분하며 실제 보낸 모든 칸을 확인한다. users fallback의 누락칸은 원 payload를 버리거나 confirmed로 올리지 않는다.
- B2: 빈/오류 결과의 backup은 같은 account/id의 기존 보관키에 존재미확정으로 남기며 서버 자동upsert하지 않는다. 화면의 기존 local 자료는 유지하되 원격확인 상태로 표시하지 않고 기존 toast/status를 이용해 보관 사실을 안내한다. LocalKeep 보관-only는 원 commit/previous/restore 경로를 고치지 않는다. 실패하면 원 backup·queue bytes는 그대로다.
- legacy queue는 원 계정/원문 증거가 없는 것을 신규pending으로 변환하지 않는다. 원 queue는 보존하고 소유가 확인된 기존record만 kept-key로 보관한다. unknown/foreign owner 항목은 원queue에 두고 성공/동기화 토스트·flush하지 않는다. 새 B pending은 자체 kind/target/세대로 retry하며 oldqueue와 섞지 않는다.
- 수동 동기화는 전체 legacy 전송/전체 렌더를 부르지 않는다. pending 손상은 빈 성공 목록이 아닌 typed 실패다. 미확정 읽기·기기 보관분과 실제 이번 요청에서 확인된 변경을 서로 다른 안내로 표시한다. 대기 중 본문/계정 객체가 바뀌면 원 응답으로 현재 자료/피드백을 바꾸지 않는다. users/goals 명시 create/update는 B1 지원이며 delete/restore 및 다른 C caller 전환은 이번 구현의 미완이다.
- `storage.device.pending`의 주인은 기존 core/device-save 하나다. 기존 strict read로 owner·schema·kind·payload·버전/변경 세대를 검사하고 독립 복사와 원 raw를 메모리 안에서만 돌려준다. 소비자 core/profile-load는 매 await 뒤와 P0 쓰기 앞에서 원 raw 전체의 exact-byte equality를 확인한다(지문 충돌에 기대지 않으며 보고서 SHA는 별도 증거). 원 q가 바뀌거나 손상이 있으면 자동 대입·백업 교체 전에 실패/미확정으로 남긴다. pending이 있는 종류는 백업을 원격 읽기값으로 교체하지 않고 기존 기기 같은 id 본문을 표시하며 nonpending 원격 행은 읽기/P0 변환으로 표시한다. pending 제거/확인은 이 읽기에서 하지 않는다. P0 함수 원문은 바꾸지 않는다. 비교와 쓰기 사이의 다른 탭 경합에 대해 새 원자성/CAS 보장을 주장하지 않는다.

## 4. [원칙 ④] 재검토
반론1: 현재 서버가 빈 경우 기기자료를 전송하면 자가치유다. 삭제·권한·쪽나눔·동시변경·계정 변경을 구분하지 못하므로 부재를 확정하지 않는다. 반론2: 같은 id/같은 내용이면 이전답으로 새 항목을 지워도 된다. 해당 changeId/generation과 원 profile identity가 일치하는 영수증만 인정한다. client 확인은 serverCAS/두 기기 작성시각 권위가 아니며 미확정은 null이다.

## 5. [원칙 ⑤] 절차
원packet(a0155/e341/99f3)·fresh980·규범/원운영조사 인수→REQ/PLAN→B1→B2→changed 경계의 local 부품·가능한 guest UI→공식 module-specs/guard→ordinaryhooks→draftPR/claims/Court→root 독립검토/통합이다. 이미 소진한 SQL3/첫 지표/한건 시험을 반복하지 않으며 actual DB/auth/외부·새fixture 쓰기0이다. local 합성 부품은 실제 계정/E2E로 표현하지 않는다.

## 6. [원칙 ⑥] 절차 재검증
최강 반례는 records와 goals 같은 targetID·같은 원본문의 다른 세대, old q의 metadata/confirmed 보존, 손상kind bucket·foreign payload·0/2 returned rows·잘못된type·timestamp 변환·timeout/late 응답·계정 profile 교체·기기 quota·readback 부분성공·legacy row owner없음/foreign·archive quota다. source compatibility/원bytes/임의 source reset0을 각각 측정한다. 새 종류가 기존 records에 확인됨으로 찍히거나 A capture 상태를 바꾸지 않아야 한다.

## 7. [원칙 ⑦] 단계별 실행 및 원요구
제품 단독6파일: js/core/device-save.js, js/core/home-cockpit.js, js/core/profile-load.js, js/core/virtual-user-helpers.js, js/core/local-keep.js, js/tabs/settings/account-actions.js(수동 동기화 처리기만). 새 엔진/원B 밖 storekind/모듈/recordID 재생성·A caller 재구현·일정/settings/사진/AI 서버 보존 확대0. root가 추가 확정한 pending 읽기 능력만 신고서 hand provides/capabilities(주인1)·requires(소비자1)에 더하고 dependsOn은 공식 module-specs로 갱신한다. 기준선·슬롯·kind 변경0.

원087 로그인 지속은 구현 기능과 실제 지속 사용을 분리(66 마14), 원088 저장/복원은 가1·마14이며 이번 typed보관은 그 일부, 원089 같은 메모리 계정 raw/detail/cache는 직접127 기준이며 실제 사용확인null, 원090 작성/수정 순서는 마11·바16과 연결하지만 serverCAS/두기기 미확인이다. 바15 원한건 budget은 소진이며 이 구현에 재발급하지 않는다. 원66 완료를 이번 구현만으로 선언하지 않는다.

## 8. [원칙 ⑧] 막힐 지점 예상
서버 schema/fallback/기존운영정의는 원조사/영수증을 인수하고 새 SQL·API로 확인하지 않는다. users trash/누락칸·기기세대/잠금미지원·late 계정·같은kind,target 콜러 충돌·800줄/신고서 갱신을 예상한다. 해당 경계만 보류하며 가능한 B항목은 계속한다. C caller의 실제입력/창/XP·부재자료 수동복원·serverCAS/두기기/운영use/effect는 별도 null이다.

## 기존 13칸 정합
작업번호·대표원문(이번은 root 위임)·본질·끝모습(typed 결과/보관 안내·실제 수동 버튼)·품질(자료+목록 되읽기/해당세대 확인)·불변(원자료/P0/A/권위)·하지않음(외부/새원예산)·닿는곳(6파일+공식 신고서 산출)·등급(저장복합FIX)·사람과눈(contracts/root별도독립)·증거(implementation-1)·상태(현재구현/후속PR)·결과(사용/효과 별도)를 유지한다. 새 규범/승인선을 만들지 않는다.
