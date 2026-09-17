# 엔지니어링 작업계획서 (PLAN) — 동반자 새로고침 증발 결함 및 1:1 DM 실시간 수신 파이프라인 무결성 확보 (#TASK-ES-144)

> **문서 ID**: PLAN-COMPANION-PERSIST-AND-REAL-DM-ES144  
> **요구사항 연계**: [REQ-COMPANION-PERSIST-AND-REAL-DM-ES144](file:///C:/dev/ourgoal-app/docs/specs/REQ-COMPANION-PERSIST-AND-REAL-DM-ES144.md)  
> **티켓 연계**: #TASK-ES-144  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **규범 준수**: [아워골 최고 헌법(AGENTS.md)](file:///C:/Users/HP/AGENTS.md) 준수  

---

## 1. [원칙 ①] 파악: 엔지니어링 아키텍처 및 변경 범위

### 1) REQ 핵심 요약
- **목적**: 동반자 추가 후 새로고침(F5) 시 등록한 동반자가 증발하는 결함 및 1:1 DM 수신 시 상대방에게 실시간 알림/레드닷 뱃지/목록 프리뷰가 도달하지 않는 결함을 원천 해결.
- **핵심 요구사항**:
  - loadProfile() 및 saveProfile()에 companions 복원/영속화 배선.
  - 앱 부팅(enterApp()) 시 OurgoalTeamInviteComm.initIncomingDmListener(myId) 상시 가동.
  - loadIncomingDmRooms() 내 기존 동반자 수신 메시지 누락 버그(if(!isMyComp)) 완치 및 대화 목록 실시간 최신 메시지 프리뷰 연동.

### 2) 영향 받는 파일 목록
- index.html: loadProfile(), saveProfile(), enterApp() 내 동반자/DM 리스너 배선
- js/team-invite-comm.js: loadIncomingDmRooms(), enderCommDM(), initIncomingDmListener() 개선
- docs/rules/TICKETS.md: #TASK-ES-144 티켓 등록

---

## 2. [원칙 ②] 본질 · 중심 배선 파악 (Architecture & Wiring)

### 1) 전역 상태(state) 영향 분석
- state.profile.companions:
  - loadProfile() 시 ourgoal_companions_backup_<uid>로부터 즉시 복원되어 F5 새로고침 후에도 등록 동반자 100% 보존.
  - saveProfile() 시 로컬 백업 및 서버리스 원장 동시 갱신.
- state.dmActiveId:
  - 대화방 진입 시 해당 사용자와의 메시지 읽음 처리 및 뱃지 소등.

### 2) 데이터 흐름 다이어그램
`mermaid
sequenceDiagram
    participant U as 사용자/상대방
    participant App as index.html (enterApp)
    participant Comm as js/team-invite-comm.js
    participant SB as Supabase Realtime/DB
    participant LS as LocalStorage

    Note over App,Comm: 1. 앱 진입 (enterApp)
    App->>Comm: initIncomingDmListener(myId)
    Comm->>SB: subscribe('incoming_dm_global_' + myId)
    App->>Comm: loadIncomingDmRooms(myId)
    Comm->>SB: select('team_ping_replies').eq('receiver_id', myId)
    SB-->>Comm: 최신 메시지 리스트 반환
    Comm->>App: updateDmUnreadBadge(true) -> 레드닷 점등

    Note over U,Comm: 2. 신규 DM 실시간 수신
    U->>SB: insert('team_ping_replies')
    SB-->>Comm: Realtime postgres_changes INSERT
    Comm->>App: showToast('새 메시지: ...') & 레드닷 즉시 점등
    Comm->>Comm: 대화 목록 최신 메시지 프리뷰 즉각 갱신
`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 한도 준수 여부 |
| :--- | :--- | :---: | :---: | :---: | :---: |
| index.html | loadProfile/saveProfile 동반자 복원 및 enterApp 리스너 연결 | +35줄 | -5줄 | +30줄 | 준수 (헌법 제5조 제3항) |
| js/team-invite-comm.js | loadIncomingDmRooms 동반자 수신 누락 수정 및 목록 프리뷰 개선 | +45줄 | -10줄 | +35줄 | 준수 |
| docs/rules/TICKETS.md | #TASK-ES-144 승인 티켓 등록 | +5줄 | 0줄 | +5줄 | 문서 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 Supabase 스키마(DDL)를 임의 변경하지 않고 기존 	eam_ping_replies 테이블 구조 100% 활용.
- [x] 콜드스타트 가상 AI 봇 3인([🤖 AI 동반자]) 투명 노출 기능 유지.
- [x] 기존 아바타 서랍, 목표, 기록 등 유저 자산에 대한 사이드 이펙트 0건 보장.

---

## 5. [원칙 ⑤] 구현 절차 정리 (Step-by-Step Implementation Sequence)
1. **Step 1 (동반자 영속성 배선)**:
   - index.html loadProfile()에 ourgoal_companions_backup_<uid> 복원 및 반환 객체 companions 주입.
   - index.html saveProfile()에 state.profile.companions 로컬 백업 저장 배선.
2. **Step 2 (실시간 DM 수신 리스너 배선)**:
   - index.html enterApp()에서 사용자 프로필 로드 완료 직후 OurgoalTeamInviteComm.initIncomingDmListener(state.profile.id) 가동.
   - 앱 부팅 직후 미확인 DM 수신 여부를 검사하여 하단 소통 탭 레드닷 뱃지 초기화.
3. **Step 3 (DM 목록 수신 메시지 프리뷰 및 필터 버그 완치)**:
   - js/team-invite-comm.js loadIncomingDmRooms()에서 기존 동반자 수신 메시지 드롭 버그 제거 및 최신 메시지 매핑.
   - enderCommDM()에서 대화방 진입 전에도 실제 최신 메시지 내용과 시간이 카드에 노출되도록 렌더러 수정.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (동반자 F5 새로고침 영속성)**:
  - 사용자 A가 회원 검색을 통해 사용자 B를 동반자로 추가 ➔ F5 새로고침 ➔ 사용자 B가 동반자 목록에 그대로 유지되는지 검증.
- **시나리오 B (독립 세션 간 실시간 DM 수신)**:
  - 브라우저 1(상민님 계정)에서 브라우저 2(상대방 계정)로 DM 발송 ➔ 브라우저 2 화면에 실시간 토스트 알림 및 하단 소통 탭 레드닷 즉시 점등 검증.
- **시나리오 C (DM 목록 최신 프리뷰)**:
  - 브라우저 2에서 소통 탭 진입 시 대화 상대 목록에 상민님이 보낸 최신 메시지가 미리보기로 정상 표시되는지 검증.
- **시나리오 D (자동화 회귀 게이트)**:
  - 
pm test 260개 이상 전수 통과 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트
- [ ] [1단계: 기획·설계 상태] REQ 및 PLAN 문서 작성 완결 (현재 단계)
- [ ] [2단계: 내부 시뮬레이션 상태] 코드 작성 및 로컬 단위/무결성 테스트 통과
- [ ] [3단계: 로컬 수동 확인 상태] 브라우저 환경에서 새로고침 및 실시간 송수신 실측
- [ ] [4단계: 로컬 메인 병합 상태] 로컬 main 브랜치 병합 및 5A 프리뷰 배포 실행

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **예상 병목**: Supabase Realtime 채널 생성 시 이미 구독 중인 채널과의 충돌 가능성.
- **대책**: initIncomingDmListener 진입 시 기존 _incomingDmChannel을 안전하게 unsubscribe() 후 재생성.
- **롤백 계획**: 문제 발생 시 git checkout을 통해 직전 커밋으로 1분 내 완전 무손실 롤백.
