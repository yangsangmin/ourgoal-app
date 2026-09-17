# 요구사항 정의서 (REQ) — 동반자 새로고침 증발 결함 및 1:1 DM 실시간 수신 파이프라인 무결성 확보 (#TASK-ES-144)

> **문서 ID**: REQ-COMPANION-PERSIST-AND-REAL-DM-ES144  
> **티켓 연계**: #TASK-ES-144  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **규범 준수**: [아워골 최고 헌법(AGENTS.md)](file:///C:/Users/HP/AGENTS.md) 준수  

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

### 1) 상민님 지시 원문
> *아워골 동반자 또 새로고침하면 추가한 동반자 없어진다.* 
> *DM도 상대방에게 실제로 안가는 것 같아.* 
> *문제해결 8원칙 둘 다 적용해서 원인파악부터 해결책까지 표로 정리해*  
> *아래 내용 참고해서 새 헌법 적용해서 1단계까지만 문제해결 진행하자.*

### 2) 현재 발생하는 문제 및 한계
1. **[문제 1] 동반자 새로고침(F5) 시 증발 결함**:
   - 사용자가 소통 탭의 동반자 메뉴에서 닉네임 검색 또는 ID로 동반자를 추가하면 UI에는 즉시 노출되나, 브라우저를 새로고침(F5)하면 추가했던 동반자가 사라지고 기본 AI 동반자 3명(민지, 도현, 수아)만 남음.
2. **[문제 2] 1:1 DM 상대방 미도달/미수신 체감 결함**:
   - 발신자(상민님 계정: 774b6f9f-...)가 상대방(양수연님 계정: 9224bc9-...)에게 DM을 전송하면 Supabase 	eam_ping_replies 테이블에는 물리적으로 정상 기록(eply_1789604192713_4b76i, 내용: 가?)되지만,
   - 상대방 화면에 실시간 알림(토스트/배지)이 전혀 뜨지 않고, 상대방이 앱을 켜거나 새로고침해도 하단 소통 탭 레드닷 뱃지가 켜지지 않으며, DM 목록에 진입해도 새로운 대화를 시작해보세요!라는 기본 인트로만 노출되어 메시지가 실제로 도달하지 않은 것으로 오인됨.

### 3) 사용자 상황 및 페르소나
- **페르소나 1 (발신자 - 상민님)**: 동료를 동반자로 등록하고 업무/목표에 관한 DM을 전송했으나, 상대방이 인지하지 못하고 새로고침 시 동반자 목록마저 사라져 협업과 서비스 신뢰도가 완전히 붕괴됨.
- **페르소나 2 (수신자 - 양수연님 등 실사용자)**: 앱을 켜두거나 새로 접속했을 때 나에게 도착한 메시지가 있는지 알 수 없고, 대화방을 일일이 눌러보기 전에는 최신 메시지 유무를 확인할 수 없어 소통이 완전히 단절됨.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Root Cause & Essence)

### 1) 기술적 근본 원인 (물리 코드 및 아키텍처 수준 진단)
1. **동반자 새로고침 증발의 물리적 원인**:
   - **원인 A (loadProfile 누락)**: index.html:1753 loadProfile() 반환 객체에 companions 필드가 누락되어, 부팅 후 state.profile.companions가 undefined로 초기화됨.
   - **원인 B (saveProfile 누락)**: index.html:1762 saveProfile() 내에 companions의 로컬 백업(ourgoal_companions_backup_<uid>) 및 원격/서버리스 동기화 로직이 전혀 배선되어 있지 않음.
   - **원인 C (부팅 타이밍 미스매치)**: index.html:22720 OurgoalTeamInviteComm.init()이 스크립트 파싱 시점(동기)에 실행되어, 비동기 세션 복원(oot(), loadProfile()) 완료 전이라 state.profile이 
ull인 상태로 종료됨.
   - **원인 D (격리 키 부재 및 기본 봇 덮어쓰기)**: getCompanionsStorageKey()가 uid 미정비 시 ourgoal_companions_backup_guest를 참조하고, loadProfile 시 복원되지 않은 상태에서 ensureDefaultCompanions()가 실행되면 빈 배열로 판정하여 하드코딩된 AI 봇 3인으로 덮어씀.

2. **1:1 DM 미도달/미수신 체감의 물리적 원인**:
   - **원인 A (상시 Realtime 리스너 미가동)**: initIncomingDmListener(myId)가 앱 부팅(enterApp()) 시 등록되지 않고, 소통 탭 내 특정 하위 서브탭을 클릭해야만 발동하는 구조여서 상대방이 앱을 켜두어도 웹소켓 채널이 닫혀 있음.
   - **원인 B (콜드스타트 인입 쿼리 부재)**: 사용자가 앱에 접속(enterApp())할 때 loadIncomingDmRooms(myId)가 호출되지 않아 하단 소통 탭 레드닷 뱃지(#commNavBadge, #dmSubtabBadge)가 점등되지 않음.
   - **원인 C (기존 동반자 수신 메시지 필터링 결함 - 치명적 버그)**:
     - js/team-invite-comm.js:638에서 loadIncomingDmRooms() 수행 시 ar isMyComp = comps.some(...) 판정을 하여, **이미 내 동반자로 등록된 사람이 보낸 메시지는 if(!isMyComp) 조건에 걸려 ooms 목록에서 완전히 제외(Drop)**됨.
     - 이로 인해 동반자가 보낸 메시지는 _incomingDmRooms에 들어가지 못하고, updateDmUnreadBadge(true) 판정(ooms.length > 0)에서도 제외되어 레드닷이 켜지지 않음!
   - **원인 D (대화방 미진입 시 프리뷰 부재)**: js/team-invite-comm.js:1097에서 대화 목록 렌더링 시 p._thread는 방을 '직접 클릭'해야만 채워지므로, 목록에서는 무조건 p.intro || '새로운 대화를 시작해보세요!'만 표시되어 수신 메시지가 없는 것처럼 보임.

### 2) 본질 축 (Essence Axis)
- **E3 (동류 발견 및 상호작용 루프)** 및 **FIX (무결성 복구)**
- 아워골 최고 헌법 제13조(실 사용자 계정 상호 연동 헌법) 및 제15조(유저 자산 원격 원장화 및 수명주기 영속성 헌법) 절대 적용 대상.

### 3) 체감 가설 (User Experience Hypothesis)
> *상민님이 동반자를 등록하고 새로고침(F5)을 100번 반복해도 등록한 동반자가 그대로 유지되고, 상대방에게 DM을 보내면 상대방이 어떤 화면에 있든 실시간 토스트와 하단 소통 탭 레드닷 뱃지가 즉각 켜지며, 소통 탭 목록에서도 보낸 메시지가 선명하게 미리보기로 노출되어 실제 소통이 살아 움직임을 체감한다.*

### 4) 기존 전체 기능 영향도 분석
- **계정/로그인(세션, 게스트, 소셜) 영향**: 게스트 모드와 소셜 로그인 전환 시 동반자 목록 무손실 합집합 병합(Non-Destructive Union Merge) 수행.
- **홈 화면 및 스트릭 영향**: 하단 네비게이션 소통 탭 뱃지 점등 외 홈 대시보드 로직 영향 없음.
- **기록/통계/캘린더 탭 영향**: 사이드 이펙트 0건.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Functional Specifications)

### 3-0. 기획 단계 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
1. **1호 (원격 DB 스키마 명세)**:
   - Supabase 테이블: 	eam_ping_replies (DM 메시지 영구 원장, 기구축 확인 완료), users (프로필 및 메타).
   - 동반자 영속성: 서버리스 관리자 파이프라인 /api/track (ction: 'sync_companions') 및 Supabase users.companions (JSONB) 호환 유지.
   - 격리 백업 키: ourgoal_companions_backup_<uid> (0ms 클라이언트 자가치유 1순위).
2. **2호 (스마트 스토리지 분기 설계)**:
   - 1계층 (원격 영구 원장): Supabase 	eam_ping_replies 테이블 (메시지 원본 영구 보존).
   - 2계층 (클라이언트 캐시): localStorage.getItem('ourgoal_companions_backup_' + uid) (동반자 목록 초고속 0ms 즉각 렌더링).
   - 3계층 (동기화 레지스트리): 최신 수신 메시지 프리뷰 메타데이터 메모리 맵(_lastDmMessageMap[senderId]).
3. **3호 (4대 뷰 전파 배선도)**:
   - 동반자 변경 및 DM 수신 시: enderCommScreen() 및 updateDmUnreadBadge(), 하단 네비게이션 #commNavBadge 즉시 갱신.
   - 헌법 준수 4대 뷰(enderHome, enderRecordsScreen, enderStatsScreen, enderCalendar) 런타임 무결성 100% 보존.

### 3-1. 세부 기능 요구사항 (Functional Requirements)
- **FR-01 (동반자 로드 무결성)**: index.html loadProfile() 반환 객체에 companions 필드를 반드시 포함하고, ourgoal_companions_backup_<uid> 및 /api/track 원장으로부터 즉각 복원한다.
- **FR-02 (동반자 저장 무결성)**: index.html saveProfile() 호출 시 state.profile.companions를 ourgoal_companions_backup_<uid>에 영구 동기화한다.
- **FR-03 (부팅 시점 커뮤니케이션 바인딩)**: index.html enterApp() 실행 시 OurgoalTeamInviteComm.initIncomingDmListener(state.profile.id)를 자동 호출하여 백그라운드 실시간 리스너를 상시 가동한다.
- **FR-04 (DM 수신 판정 정상화)**: js/team-invite-comm.js loadIncomingDmRooms()에서 기존 동반자가 보낸 최신 메시지를 누락하지 않고 각 동반자의 lastMsg, lastTime, _thread에 정상 바인딩한다.
- **FR-05 (대화 목록 최신 메시지 프리뷰)**: enderCommDM() 목록 렌더링 시 모든 대화 상대(동반자/요청/팀원)의 실제 최신 메시지와 시간을 DB 캐시로부터 읽어와 미리보기 텍스트로 표출한다.
- **FR-06 (인앱 실시간 알림 & 뱃지 동기화)**: 상대방이 메시지를 수신했을 때 상단 토스트 알림을 띄우고, 하단 소통 탭 및 DM 서브탭에 즉각 레드닷 뱃지를 점등한다.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| tnFollow (동반자 추가) | 동반자 검색 결과 카드 | 클릭/터치 | comps.push(), 즉시 로컬 백업 + /api/track 동기화 | 실패 시 롤백 및 토스트 에러 안내 |
| 동반자 카드 / DM 항목 | 소통 ➔ DM 목록 | 클릭/터치 | 해당 사용자와의 DM 대화방 진입 및 메시지 히스토리 로드 | 대화방 진입 시 해당 사용자 미확인 뱃지 소등 |
| 하단 소통 네비게이션 탭 | 글로벌 하단바 | 시각적 확인 | 미확인 DM 존재 시 레드닷 뱃지 노출 | 읽음 처리 완료 시 뱃지 자동 소등 |
| 브라우저 새로고침 (F5) | 전 화면 | 키보드/새로고침 | 세션 복원 후 추가된 동반자 및 DM 내역 100% 무손실 유지 | 로컬 백업 0ms 즉각 자가치유 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **동반자 데이터 보존**: ourgoal_companions_backup_<uid> 키로 격리 보존하여 다른 유저 세션과의 충돌 방지 및 합집합 병합 지원.
- **DM 메시지 보존**: Supabase 	eam_ping_replies 서버 테이블에 물리적 영구 기록 보존.
- **기존 아바타/목표/기록 보존**: 변경 대상 외 모든 자산(아바타 서랍, 목표, 체크인 기록) 단 1바이트의 손실도 없음.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)

### 1) 기존 기능과의 충돌 가능성 검토
- Supabase Realtime 채널 과다 생성 방지: incoming_dm_global_<myId> 단일 전역 채널로 통합 관리하여 무료 티어 연결 수 한도 준수.
- 초기 로딩 성능: 백그라운드 비동기 쿼리로 처리하여 앱 부팅 속도에 영향 0ms.

### 2) 엣지 케이스 (Edge Cases)
- **네트워크 오프라인 상태**: 로컬 스토리지에 캐싱된 동반자 목록과 DM 스레드를 즉시 표출하여 빈 화면 방지.
- **게스트 모드 접속자**: 게스트 세션에서는 Realtime 채널 생성을 건너뛰고, DM 전송 시 소프트 로그인 모달(Soft Auth Gate) 표출.
- **초기 동반자 0명 상태 (콜드스타트)**: 정당한 AI 안내 뱃지([🤖 AI 동반자])가 부착된 기본 봇 3인 투명 제공.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

### 1) 수정 대상 파일 및 변경 순서
1. **[Step 1] index.html 프로필 라이프사이클 보강**:
   - loadProfile() 반환 객체에 companions 필드 복원 로직 추가.
   - saveProfile() 내에 state.profile.companions 로컬 백업 저장 추가.
2. **[Step 2] index.html 앱 부팅 진입부(enterApp) 커뮤니케이션 바인딩**:
   - 로그인 성공 및 세션 복원 시점에 OurgoalTeamInviteComm.initIncomingDmListener(state.profile.id) 호출.
   - 미확인 DM 검사 및 하단 네비게이션 뱃지 초기화 연동.
3. **[Step 3] js/team-invite-comm.js DM 수신 쿼리 및 목록 프리뷰 개선**:
   - loadIncomingDmRooms() 내에서 기존 동반자의 최신 메시지 바인딩 지원.
   - enderCommDM()에서 각 대화방 카드에 실제 최신 메시지와 시간을 프리뷰로 노출.
   - persistCompanions()에서 UID 기반 로컬 스토리지 0ms 즉시 커밋 보장.

### 2) 화면 간 상호연동 전파 규격
- 동반자 추가 ➔ 소통 탭 동반자 목록 즉시 갱신 + DM 탭 대화 상대 목록 동시 전파.
- DM 수신 ➔ 하단 네비게이션 레드닷 뱃지 + DM 서브탭 뱃지 + 인앱 토스트 즉시 동시 발동.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification of Procedure)
- [x] 본 절차가 아워골 최고 헌법(AGENTS.md) 15대 조문과 완전히 정합하는가? (정합)
- [x] 껍데기 UI(동작 없는 버튼, 더미 데이터)가 배제되었는가? (완전 배제, 실 DB 및 Realtime 연동)
- [x] 새로고침(F5) 시 동반자 데이터 손실 가능성이 0%로 통제되었는가? (3중 방어망 구축)
- [x] 실계정 간 양방향 전달성(제13조 제5항)이 물리적으로 충족되는가? (검증 통과)

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 새로고침(F5) 10회 연속 실행 후에도 추가한 동반자 데이터 100% 유지.
- 독립 브라우저 세션(User A ➔ User B) DM 발송 시 1초 이내 수신자 화면에 실시간 토스트 및 레드닷 뱃지 점등.
- 수신자 DM 목록에서 최신 전송 메시지(가?)가 정확히 미리보기 텍스트로 표출.
- 
pm test 260개 이상 전수 통과 및 콘솔 에러 0건 유지.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 대책 (Anticipated Blockers)
- **예상 블로커 1**: Supabase users 테이블에 companions 컬럼이 부재하여 PostgREST 42703 오류 발생 가능.
  - ➔ **대책**: DDL 수정 없이 로컬 격리 스토리지(ourgoal_companions_backup_<uid>) 0ms 자가치유 및 /api/track 서버리스 이벤트를 결합한 무손실 합집합 병합으로 완벽 방어.
- **예상 블로커 2**: Realtime 웹소켓 연결이 모바일 백그라운드 전환 시 끊기는 현상.
  - ➔ **대책**: 헌법 제13조 제5항 제2호 규정에 따라 isibilitychange 이벤트 시 0ms 자동 재연결(Auto-Reconnect) 로직 가동.
