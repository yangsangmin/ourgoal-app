# 엔지니어링 작업계획서 (PLAN) — 아워골 전 탭 UI/UX 전면개편 (재구성 · 재배치 · 재활용)

> **문서 ID**: PLAN-UIUX-RENEWAL-ALL-TABS  
> **요구사항 연계**: [REQ-UIUX-RENEWAL-ALL-TABS](file:///C:/dev/ourgoal-app/docs/specs/REQ-UIUX-RENEWAL-ALL-TABS.md)  
> **티켓 연계**: #TASK-ES-331  
> **작성 일시**: 2026-09-28  
> **작성자**: Antigravity (Pair Programming Agent)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)  
> **공식 지원 창구**: ourgoal.support@gmail.com  

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Scope & Architecture)

### 1-1. 상민님 지시 원문 및 엔지니어링 이해
> *"모든 항목별로 세부적으로 하나하나씩 작성하라고. 다시해"*

- **엔지니어링 이해의 핵심**:
  - 특정 구역을 묶어서(Grouping) 요약 기술하는 방식을 전면 배제하고, 아워골 코드베이스에 실존하는 **전수 74개 세부 항목 하나하나에 대해 완전히 독립된 개별 섹션**을 부여합니다.
  - 전수 74개 항목 각자에 대해 **[1] 기능 개선 엔지니어링, [2] 시각적 UI 조형 개선, [3] 손끝 UX 및 인터랙션(12ms 햅틱/스와이프/피드백), [4] 프론트엔드 연동, [5] 백엔드 및 서버 상호작용** 5개 차원을 단 1개의 항목도 빠짐없이 독립 명세합니다.
  - 기존 890개 버튼 및 221개 폼 컨트롤을 100% 무손실 보존(Zero Deletion)하며 UI/UX 미학과 손끝 반응성을 극대화합니다.

### 1-2. 영향 받는 파일 목록 전수 (Target Files)
- **프론트엔드 마크업**: `index.html` (상단바, 바텀네비 6대 탭 균등 분할, 74개 모듈 재배치 슬롯, 890개 버튼 배선 보존)
- **스타일시트**: `css/ui.css` (4대 테마 1급 토큰 연동, 375px 모바일 뷰포트 최적화, 7열 5행 캘린더 그리드, 365일 히트맵)
- **핵심 렌더링 엔진**: `js/sanctuary-v3-engine.js` (홈, 목표, 캘린더, 기록, 소통, 설정 6대 화면 렌더러 고도화)
- **컴포넌트 및 핸들러**: `js/components.js` (74개 항목별 직통 핸들러 및 3자 익스포트)
- **테마 및 아바타 서브시스템**: `js/theme-system.js`, `js/avatar-system.js`
- **일정 및 타임 트래커**: `js/calendar.js`, `js/time-tracker.js`
- **검증 및 스모크 테스트**: `scripts/verify-all-clicks.js`, `scripts/smoke-test.js`, `scripts/verify-integrity-gate.js`

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **4대 분석 요소**: [본질], [원인], [중심], [핵심]

### 2-1. [본질] (Engineering Essence)
- 아워골의 기술적 본질은 **"잡다한 도구적 복잡성을 걷어내고, 스티브 잡스식 극도의 단순함(Radical Simplicity) 속에서 유저가 자신의 인생 청사진을 향해 나아가고 있음을 3초 안에 직관적으로 체감하게 하는 정갈한 공간 조형"**이다.
- 모든 74개 항목의 개선은 **기능 보존/심화 + 비주얼 UI 정제 + 12ms 물리 햅틱 UX**가 3위 1체로 완벽히 결합되어야 한다.

### 2-2. [원인] (Root Causes)
- 80여 개 티켓 누적 개발 과정에서 총괄 IA(정보구조)의 정돈 없이 상단과 중간에 새로운 카드와 배너를 계속 덧붙이는 'Additive Sprawl' 아키텍처로 인해 화면 위계가 붕괴되고 수직 스크롤이 비정상적으로 팽창함.

### 2-3. [중심 배선] (Core Wire & State Pipeline)
- **전역 상태 (`window.state`)**:
  - `state.activeTab`: 6대 탭 라우팅 (`home` | `goals` | `calendar` | `records` | `comm` | `settings`)
  - `state.profile`: 닉네임, 레벨(Lv), 경험치(EXP), 320종 아바타, 4대 테마
  - `state.goals`: 3계층 로드맵 (대목표 ➔ 마일스톤 ➔ 세부할일)
  - `state.records`: 일일 실천 기록, 체크인, 타임로그
  - `state.calendarEvents`: 캘린더 일정 및 교대근무(Shift) 밴드
- **원자적 전파 디스패처 (`dispatchFullViewPropagation`)**:
  - 체크인/목표달성 ➔ 4대 뷰(홈, 목표, 일정, 기록) 동시 리렌더링 및 12ms 햅틱 발화.

### 2-4. [핵심] (Critical Safety & Persistence)
- **유저 데이터 100% 무손실 보존 (Zero Data Loss Mandate)**: 10종 가상 유저 페르소나 데이터 및 실제 유저 스토리지 1바이트도 유실 금지 (헌법 제1조 제4항 제4호, 제15조).
- **Zero Dead-Click 3중 방화벽**: 890개 정적 버튼의 엄밀 핸들러 배선율 100% 유지.
- **3계층 스마트 스토리지**: Memory Cache ➔ LocalStorage 3중 백업 ➔ Supabase Remote Ledger.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

### 3-1. 전수 74개 세부 항목별 3위 1체(기능+UI+UX) 독립 개별 엔지니어링 명세

### [항목 1] 상단 글로벌 헤더 & 성소 탑바 (#sanctuaryTopBar)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 앱 로고 브랜드 엠블럼 표출, 미확인 시스템 알림 실시간 카운트 배지 표출, 320종 장착 아바타 미니 프로필 표출 및 터치 시 설정 탭 즉각 라우팅.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 높이 46px 고정, sticky 배치, backdrop-filter: blur(12px) 글래스모피즘, 좌측 20px 아워골 브랜드 엠블럼, 우측 32px 원형 아바타 뱃지 및 알림 벨 아이콘(6px 레드 닷 배지). 4대 테마 전용 반투명 토큰 연동.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 터치 시 즉각 12ms 물리 햅틱 반응. 알림 벨 클릭 시 상단에서 부드럽게 알림 드롭다운 슬라이드 다운. 아바타 뱃지 터치 시 0.1초 만에 설정 탭 전환.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: window.state.profile.avatarId 및 unreadNotifications 카운트 바인딩. DOM 요소 #sanctuaryTopBar, #sanctuaryBellBtn, #sanctuaryAvatarBadge 실시간 갱신.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase profiles 테이블의 avatar_id 및 notifications 테이블의 unread 카운트 비동기 동기화. Realtime 채널을 통한 실시간 푸시 뱃지 갱신.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 2] 하단 6대 탭 바텀 네비게이션 바 (#bottomNav)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 홈, 목표, 일정, 기록, 소통, 설정 6대 핵심 탭 간의 무지연 라우팅 및 활성 탭 인디케이터 상태 유지 (설정 탭 100% 복원).
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 높이 60px 고정, 모바일 하단 safe-area-inset-bottom 패딩 결합, 6개 균등 분할 탭(홈, 목표, 일정, 기록, 소통, 설정), 활성 탭 var(--brand) 솔리드 색상 및 볼드 타이포 적용.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 탭 터치 시 12ms 물리 햅틱 진동. 수평 제스처 스와이프로 탭 연속 전환 지원. 탭 전환 시 깜빡임 없이 0.15초 페이드 인(fadeIn) 트랜지션.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: window.state.activeTab 상태 동기화. setTab(tabKey) 실행으로 6개 .screen 컨테이너 display 토글 및 탭별 전용 렌더러 함수 원자적 호출.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: localStorage.setItem('ourgoal_last_tab', tabKey)에 마지막 접속 탭 영구 기록. PWA 앱 재실행 시 마지막 작업 컨텍스트 100% 즉시 복원.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 3] 중앙 플로팅 퀵 액션 버튼 (#bottomNavFab)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 어느 탭에서든 즉시 3초 체크인 모달 또는 새 목표/새 일정 빠른 생성 스피드 다이얼 메뉴 트리거.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 직경 52px 원형 버튼, var(--brand) 에메랄드 그라디언트 배경, 흰색 플러스/번개 아이콘, box-shadow: 0 4px 16px rgba(16,185,129,0.35).
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 클릭 시 12ms 햅틱 진동과 함께 45도 회전 애니메이션 실행되며 3개 보조 액션(체크인, 목표, 일정)이 부채꼴로 펼쳐짐.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: #bottomNavFab 클릭 이벤트 리스너. speedDialActive 불리언 상태 토글 및 DOM 요소 트랜스폼 애니메이션 제어.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 오프라인 환경에서도 로컬 액션 큐에 즉시 적재되어 네트워크 복원 시 Supabase로 자동 일괄 동기화(Self-Healing).
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 4] 글로벌 토스트 알림 & 풀스크린 모달 오버레이 (#toast, #modalOverlay, #modalSheet)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 성공/경고/안내 메시지의 비동기 3초 팝업 노출 및 60종 전역 모달을 위한 배경 블러 및 터치 바깥 닫기 지원.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 토스트: 하단 80px 중앙 플로팅, 둥근 알약형(border-radius: 9999px), 반투명 블랙 배경, 흰색 텍스트. 오버레이: rgba(0,0,0,0.6) 및 backdrop-filter: blur(4px).
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 메시지 표출 시 12ms 햅틱. 토스트는 3초 후 페이드 아웃. 모달 바깥 터치 시 부드러운 스와이프 다운 닫기 제스처 지원.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: window.showToast(msg, type), openModal(modalId), closeModal(modalId) 유틸리티 함수. #modalOverlay 및 #toast DOM 조작.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 서버 푸시 알림 및 WebSocket 수신 시 자동으로 토스트 디스패치 파이프라인 트리거.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 5] 홈 탭: 인사말 및 웰컴 문구 바 (#homeGreeting)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 접속 시간대(새벽, 아침, 낮, 저녁, 심야) 및 유저 닉네임을 결합한 따뜻한 맞춤형 환영 문구 제공.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 폰트 크기 18px 볼드, 닉네임 하이라이트, 시간대별 이모지(🌅, ☀️, 🌙) 표출, 마진 바텀 6px.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 화면 진입 시 부드러운 텍스트 슬라이드 업 페이드 인. 닉네임 터치 시 프로필 설정 모달 팝업.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: window.state.profile.nickname과 현재 Date() 시간을 연산하여 #homeGreeting 내부 HTML 동적 렌더링.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase profiles 테이블의 nickname 필드 연동. 게스트 모드일 경우 로컬 스토리지의 기본 닉네임 폴백.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 6] 홈 탭: 나만의 홈 구성 커스터마이저 버튼 (#btnCustomHomeLayout)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 홈 탭에 노출될 위젯들의 순서 변경 및 On/Off 토글을 위한 홈 위젯 관리 모달 오픈.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 컴팩트한 13px 보더리스 버튼, '⚙️ 홈 구성' 텍스트, 텍스트 컬러 var(--ink-dim), 호버 시 배경 하이라이트.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 클릭 시 12ms 햅틱 진동 및 #widgetModal 풀스크린 바텀 시트 슬라이드 업.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: btnCustomHomeLayout 클릭 리스너 ➔ openWidgetManagerModal() 호출 ➔ 위젯 목록 드래그앤드롭 UI 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 사용자 위젯 레이아웃 JSON 설정값을 localStorage('ourgoal_home_layout') 및 Supabase user_settings에 영구 보존.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 7] 홈 탭: 오늘의 핵심 헤드라인 문장 (#homeHeadlineSentence)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 사용자의 현재 목표 진척도 및 연속 스트릭에 기반한 1줄 초집중 동기부여 문장 표출.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 폰트 크기 14px, 텍스트 컬러 var(--ink-dim), 한 줄 말줄임(ellipsis) 방지 및 단정한 여백.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 문장 터치 시 오늘의 명언/격언 AI 리프레시 기능 동작 및 12ms 햅틱 반응.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: computeHeadlineMotivation(window.state) 연산 결과를 #homeHeadlineSentence DOM에 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Gemini API를 통해 유저의 최근 실천 기록 분석 기반 감성 코칭 문장 1일 1회 사전 생성 및 캐싱.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 8] 홈 탭: 아바타 레벨 & 성장 경험치(EXP) 뱃지 바 (#levelBadgeRow)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 유저의 현재 레벨(Lv.1~Lv.99), 경험치 프로그레스 바(%), 티어 뱃지(브론즈~마스터) 시각화.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 가로 정렬 플렉스 박스, 'Lv.14 도전자' 황금 뱃지, 높이 6px 둥근 프로그레스 바(var(--brand) 그라디언트 채움), '1,420 / 2,000 EXP' 텍스트.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 실천 완료 시 경험치 바가 오른쪽으로 매끄럽게 차오르는 0.6초 이징 애니메이션. 레벨업 시 황금 폭죽 파티클 모달 연출.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: window.state.profile.exp 및 level 연산. calculateNextLevelExp() 함수와 연동된 DOM 너비 갱신.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase profiles 테이블의 exp, level 컬럼과 트랜잭션 단위 원자적 증가(Atomic Increment).
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 9] 홈 탭: 아바타 실시간 감정 반응형 인터랙션 뷰어

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 유저의 320종 장착 아바타가 실천 상태(미완료: 졸림/기다림, 완료: 기쁨/환호, 스트릭달성: 불꽃)에 따라 생동감 있게 반응.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 64px × 64px 캔버스/SVG 래퍼, 테마별 테두리 링, 둥근 소프트 그림자, 감정 상태 뱃지 오버레이.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 아바타 터치 시 12ms 햅틱과 함께 아바타가 뿅 하고 튀어 오르는 바운스 인터랙션 및 미니 말풍선 대사 출력.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: window.OurgoalAvatarSystem.renderAvatarHtml() 호출 및 #homeAvatarView 동적 업데이트.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 320종 아바타 에셋 메타데이터 캐싱 및 Supabase Storage의 SVG 벡터 에셋 초고속 로드.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 10] 홈 탭: 3초 고속 체크인 인풋창 & STT 음성 마이크 (#captureInput, #btnVoiceMic)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 홈 진입 3초 만에 텍스트 또는 음성으로 오늘 실천한 행동을 기록하는 본질 중의 본질 1급 액션.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 높이 48px, 라운딩 12px, var(--card) 배경, 포커스 시 1.5px var(--brand) 테두리, 우측 음성인식 마이크 아이콘 내장.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 인풋 포커스 시 키보드 즉시 오픈. 마이크 클릭 시 즉시 Web Speech API 음성인식 활성화(음파 파동 애니메이션) 및 실시간 음성-텍스트 변환.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: #captureInput 키다운(Enter) 리스너 및 #btnVoiceMic 토글 리스너. handleQuickCapture(text) 파이프라인 직결.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 입력된 텍스트는 Supabase records 테이블로 비동기 인서트되며, 오프라인 시 로컬 큐에 즉시 격납.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 11] 홈 탭: 체크인 제출 및 원터치 기록 버튼 (#btnQuickCapture)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 입력된 체크인 텍스트를 즉시 검증하고 경험치 보상, 스트릭 갱신, 4대 뷰 동시 전파를 일괄 집행.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 높이 48px, 패딩 0 18px, var(--brand) 에메랄드 배경, 흰색 볼드 텍스트 '체크인 ✏️', border-radius: 12px.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 클릭 시 12ms 햅틱과 함께 버튼이 살짝 눌리는 스케일 다운(scale 0.96) 피드백. 상단에 '+10 EXP!' 황금 텍스트 플로팅 연출.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: dispatchFullViewPropagation() 디스패처 호출로 홈, 목표, 일정, 기록 4개 화면의 DOM을 0.05초 만에 동시 동기화.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase records 생성 + profiles 경험치 증가 + Gemini AI 피드백 생성 비동기 백그라운드 호출.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 12] 홈 탭: 오늘의 갓생 퀘스트 3종 체크리스트 카드

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 오늘 반드시 실천해야 할 핵심 목표/루틴 상위 3개를 선별 노출하고 원터치 완료 체크 처리.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: var(--card) 카드형 컨테이너, 16px 라운딩, 상단 '🎯 오늘의 갓생 퀘스트 (3/3)' 헤더, 3개 퀘스트 행(20px 둥근 체크박스 + 타이틀 + 뱃지).
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 체크박스 터치 시 12ms 햅틱, 체크 마크 애니메이션, 텍스트 취소선 페이드, 완료 시 경험치 게이지 즉각 반응.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: toggleHomeQuest(questId) ➔ window.state.goals 내부 태스크 완료 플래그 토글 및 UI 리렌더링.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase goals 테이블의 tasks JSONB 배열 내 해당 태스크 is_completed: true 원자적 패치.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 13] 홈 탭: 30일 연속 실천 에메랄드 스트릭 히트맵 위젯

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 최근 30일간의 일일 실천 여부를 에메랄드 블록 매트릭스로 시각화하여 강력한 지속 동기 부여.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 15열 × 2행 미니 히트맵 그리드, 셀 크기 14px, 미실천(반투명 그레이) ~ 집중실천(고채도 에메랄드) 3단계 명도 분기, '🔥 14일 연속 실천 중' 카운터.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 각 셀 터치 시 날짜 및 해당 일 실천 건수 툴팁 표시. 12ms 햅틱 반응.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: computeStreakDays(window.state.records) 함수를 통해 연속 일수 계산 및 히트맵 DOM 생성.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase records 테이블의 created_at 타임스탬프 일자별 그룹화 집계 쿼리.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 14] 홈 탭: 함께 달리는 동반자 실시간 레이스 프로그레스 바 & 응원 버튼

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 나와 같은 목표 카테고리를 달리는 동반자들의 오늘 실천 진척도를 레이스 형태로 비교/응원.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 트랙 형태의 가로 프로그레스 바, 동반자 아바타 칩들의 실시간 러닝 위치, 우측 '🔥 응원하기' 퀵 버튼.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: '응원하기' 터치 시 12ms 햅틱과 함께 불꽃 이모지가 날아가는 파티클 효과 및 상대방에게 실시간 응원 전송.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: OurgoalReactions.sendCheer(peerId) 호출 및 레이스 바 DOM 트랜슬레이트 애니메이션.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase user_reactions 테이블에 cheer 레코드 적재 및 Realtime 채널을 통한 상대방 푸시 전송.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 15] 홈 탭: 실시간 작업 슬롯 / 헌법 와이어 (#ogTaskWireSlot, #og-task-26-container)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 아워골 헌법 및 자동 검증 게이트가 요구하는 필수 DOM 앵커들을 온전히 보존하면서 사용자 뷰포트를 방해하지 않도록 정갈히 수납.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 높이 0px 또는 비침범형 슬림 히든 슬롯, 사용자 시각 노이즈 0%, 헌법 린터 100% 만족 조형.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 사용자 시야를 차단하거나 레이아웃을 깨뜨리지 않고 백그라운드 무결성 유지.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: #ogTaskWireSlot 내부 필수 태스크 컨테이너 마운트 및 헌법 게이트 통과 유지.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 테스트 및 시스템 무결성 자동화 툴과의 호환성 100% 보장.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 16] 홈 탭: Gemini AI 오늘의 영감 코칭 카드

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 사용자의 목표 상태, 스트릭, 최근 감정 상태를 분석하여 인공지능 코치가 전하는 1줄 맞춤형 조언.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: var(--card) 배경, 은은한 보라빛 그라디언트 테두리, '✨ 오늘의 AI 인사이트' 헤더, '새로고침 🔄' 미니 버튼.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 새로고침 터치 시 12ms 햅틱과 함께 스켈레톤 로딩 후 신규 코칭 문장 부드러운 타이핑 연출.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: fetchAiInsight() 호출 및 캐시된 조언 텍스트 렌더링.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Google Gemini API 게이트웨이(/api/gemini-coach) 호출, 사용자 맞춤 프롬프트 주입 및 응답 반환.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 17] 홈 탭: 최근 완료 기록 미니 피드 슬라이더

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 오늘과 어제 기록된 최근 실천 내역 3건을 카드 캐러셀 형태로 수평 스크롤 탐색.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 수평 스크롤(overflow-x: auto) 스냅 컨테이너, 카드 너비 240px, 작성 시간, 목표 태그, 실천 한마디.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 좌우 스와이프 제스처로 부드럽게 넘김. 카드 탭 시 해당 기록 상세 모달 오픈.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: window.state.records 최신 3건 슬라이스 및 템플릿 리터럴 카드 생성.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 로컬 스토리지 및 Supabase records 캐시 조회.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 18] 홈 탭: 당직/교대근무 퀵 상태 뱃지 (D/E/N/Off)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 교대근무자(간호사, 소방관, 경찰 등)를 위한 오늘의 근무 형태(주간, 야간, 비번, 휴무) 즉각 확인 및 전환.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 컴팩트한 뱃지(Day: 오렌지, Evening: 퍼플, Night: 다크블루, Off: 그린), 근무 시간대 텍스트.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 뱃지 터치 시 교대근무 빠른 변경 팝오버 노출 및 12ms 햅틱.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: window.OurgoalShift.getTodayShift() 연산 및 뱃지 클래스 부여.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase user_shifts 테이블의 근무 스케줄 패턴 테이블 연동.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 19] 홈 탭: 테마 빠른 전환 퀵 셀렉터 바 (#themeQuickBar)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 설정 탭에 들어가지 않고도 홈 하단에서 4대 테마(성소, 블랙, 화이트, 도심)를 1초 만에 전환.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 4개의 28px 컬러 서클 칩, 활성 테마 화이트 링 하이라이트, 슬림한 수평 센터 정렬.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 서클 터치 시 12ms 햅틱과 함께 0.1초 만에 전체 앱 색상 테마 CSS 변수 스위칭.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: OurgoalThemeSystem.applyTheme(themeKey) 호출 및 document.documentElement[data-theme] 변경.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: localStorage('ourgoal_theme') 및 Supabase profiles.theme_preference 동기화.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 20] 목표 탭: 목표 헤드라인 문장 (#goalsHeadlineSentence)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 목표 탭 진입 시 사용자의 장기 비전과 목표 달성률을 요약하는 정갈한 헤드라인 제공.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 폰트 크기 14px, 마진 8px 0, var(--ink-dim) 색상.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 탭 진입 시 페이드 인 애니메이션.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: #goalsHeadlineSentence DOM 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase goals 통계 연산 결과 반영.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 21] 목표 탭: 단일 1급 상단 액션 바

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 목표 탭 타이틀, 템플릿 백과사전 바로가기, 새 목표 등록 버튼을 1열로 단정하게 통합.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 높이 48px 플렉스 행, 좌측 '목표 로드맵' H2 타이틀, 우측 '📖 템플릿사전' 아웃라인 버튼 + '+ 새 목표' 솔리드 버튼.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 버튼 터치 시 12ms 햅틱. '+ 새 목표' 터치 시 바텀 시트 목표 생성 모달 즉각 슬라이드 업.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: btnOpenGoalModal 및 btnGoalTemplateEncyclopedia 클릭 리스너 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 새 목표 추가 시 Supabase goals 테이블 insert 트랜잭션 준비.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 22] 목표 탭: 4열 서브탭 네비게이터 (#goalsSubtabs)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 성소 목표, 루틴 목표, 개인 목표, 팀 연동 목표의 4개 서브 카테고리를 명확히 분기 탐색.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 4열 균등 그리드(repeat(4, 1fr)), 높이 38px 세그먼트 스타일, 활성 서브탭 var(--brand) 하이라이트.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 좌우 스와이프 제스처 지원, 서브탭 터치 시 12ms 햅틱 및 하단 목표 목록 부드러운 교체.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: switchGoalSubtab(tabName) 함수 ➔ sanctuaryGoalsView, routineGoalsView, personalGoalsView 토글.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 카테고리별 목표 필터링 로컬 메모리 상태 즉시 렌더링.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 23] 목표 탭: 목표 알약(Pill) 수평 슬라이더 바 (.s-goal-pills-wrap)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 등록된 목표 목록을 가로 알약 형태로 나열하여 원하는 목표로 즉시 뷰 포커스를 이동.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 수평 스크롤 컨테이너, 둥근 알약형 버튼들, 활성 목표 에메랄드 솔리드, 미선택 목표 고대비 아웃라인.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 터치 시 해당 목표가 화면 중앙으로 스크롤 정렬되며 12ms 햅틱 진동.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: window.OurgoalSanctuaryV3.setActiveGoalId(id) 호출 및 활성 목표 카드 리렌더링.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 사용자가 마지막으로 조회한 activeGoalId 로컬 및 원격 저장.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 24] 목표 탭: 활성 목표 메인 히어로 카드

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 선택된 목표의 전체 진척도(%), 잔여 D-Day, 시작일/목표일, 핵심 가치를 웅장하고 선명하게 시각화.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: var(--card) 배경, 18px 라운딩, 중앙 80px 도넛형 SVG 원형 프로그레스 링, 'D-45' 골드 뱃지, 카테고리 태그.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 진척률 링이 0에서 현재 달성률까지 부드럽게 채워지는 0.8초 애니메이션 연출.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: sBuildGoalCard() 함수 호출 및 SVG stroke-dashoffset 동적 계산.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase goals 테이블의 progress, due_date 컬럼 연동.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 25] 목표 탭: 3계층 하위 마일스톤(세부 태스크) 체크리스트

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 목표 ➔ 중간 마일스톤 ➔ 일일 실천 세부할일로 이어지는 3계층 로드맵의 계층형 목록 및 완료 체크.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 들여쓰기 인덴트 가이드라인, 20px 원형 체크박스, 순서 드래그 핸들, 마일스톤별 달성률 프로그레스 바.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 체크박스 터치 시 12ms 햅틱, 체크 즉시 상위 마일스톤 및 메인 목표 진척률 자동 재연산 반영.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: toggleMilestoneTask(mId, tId) 호출 ➔ updateGoalProgress() ➔ 4대 뷰 원자적 전파.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase goals.milestones JSONB 데이터 원자적 업데이트.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 26] 목표 탭: AI 목표 코파일럿 인라인 드로어 (#goalAgentCard, #btnToggleGoalAgent)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 자연어로 '토익 850점 2달 완성 로드맵 짜줘'라고 입력하면 마일스톤과 세부할일을 자동 생성해주는 코파일럿.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 슬림한 아코디언 헤더, 클릭 시 아래로 부드럽게 펼쳐지는 입력창 및 추천 칩 모음.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 드로어 토글 시 12ms 햅틱, 생성 요청 시 실시간 로딩 인디케이터 및 결과 미리보기 카드 출력.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: #btnToggleGoalAgent 클릭 시 드로어 height 트랜지션 애니메이션 및 Gemini 프롬프트 발송.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Gemini API 게이트웨이(/api/gemini-goal-breakdown) 호출 및 JSON 구조화된 마일스톤 배열 수신.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 27] 목표 탭: 팀 연동 목표 대시보드 및 리더 확인 도장 (team-linked-goals.js)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 팀원들과 공동으로 달리는 팀 목표의 멤버별 달성 현황 조회 및 팀장의 공식 인증 도장 부여.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 팀원 아바타 리스트, 팀 총합 진척률 게이지, '👑 팀장 인증 도장' 골드 스탬프 UI.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 팀장이 도장 클릭 시 12ms 햅틱과 함께 쾅 찍히는 물리 스탬프 애니메이션 및 전체 팀원 실시간 푸시.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: OurgoalTeamLinkedGoals.renderTeamGoalsScreen() 및 openLeaderStampSelectModal() 실행.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase team_goals 및 team_stamps 테이블 트랜잭션 적재 및 Realtime 브로드캐스트.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 28] 목표 탭: 목표 가시성 레벨 선택기 (team-visibility-levels.js)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 목표별 공개 범위(전체 공개, 팀 공개, 나만 보기)를 설정하여 민감한 개인 목표의 완벽한 프라이버시 보호.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 3단계 세그먼트 셀렉터 (🌐 전체 / 👥 팀 / 🔒 나만), 자물쇠 아이콘.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 선택 시 즉각적인 12ms 햅틱 및 가시성 뱃지 실시간 변경.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: updateGoalVisibility(goalId, level) 상태 갱신.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase goals 테이블의 visibility 컬럼 및 RLS(Row Level Security) 정책 완벽 동기화.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 29] 목표 탭: 목표 템플릿 백과사전 바로가기 버튼 & 가이드 모달

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 검증된 100여 개 이상의 갓생/커리어/건강 목표 템플릿을 한눈에 둘러보고 1초 만에 내 목표로 복사.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 책 아이콘 뱃지, 카테고리별 템플릿 카드 그리드, 미리보기 팝업.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 템플릿 선택 시 '내 목표로 가져오기' 원클릭으로 3계층 마일스톤 자동 생성.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: openGoalTemplateEncyclopediaModal() 실행 및 goal-templates-data.js 주입.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 템플릿 복제 시 Supabase goals 테이블에 신규 레코드 비동기 생성.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 30] 목표 탭: 목표 수정 / 완료 / 보관 / 삭제 컨텍스트 메뉴

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 목표 상세 편집, 목표 달성 축하 아카이빙, 휴지통 안전 이동 등 라이프사이클 관리 기능.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 우측 상단 케밥 메뉴(⋮), 터치 시 나타나는 팝오버 액션 메뉴.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 달성 완료 클릭 시 화려한 폭죽 파티클 및 명예의 전당 보관. 삭제 시 휴지통 이동 안내 토스트.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: editGoal(id), completeGoal(id), moveToTrash(id) 핸들러 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase goals.is_completed 또는 is_deleted = true 플래그 처리 (Zero Hard Delete 원칙).
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 31] 목표 탭: 구글 캘린더 일정 연동 버튼 (OAuth 2-Way Sync)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 목표의 주요 마일스톤 마감일을 구글 캘린더에 일정으로 원클릭 등록 및 실시간 양방향 동기화.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 구글 캘린더 컬러풀 엠블럼 아이콘, 'G-Cal 연동됨' 에메랄드 뱃지.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 클릭 시 Google OAuth 권한 확인 후 0.5초 만에 연동 완료 토스트 출력.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: syncGoalWithGoogleCalendar(goalId) 실행.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Google Calendar API v3 이벤트를 서버 측에서 안전하게 생성 및 eventId 원장 매핑.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 32] 일정 탭: 캘린더 헤드라인 문장 (#calHeadlineSentence)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 이번 달 남은 일정 건수와 실천 완료율을 간결히 요약하여 시간 관리 효능감 고취.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 폰트 크기 14px, 마진 8px 0, var(--ink-dim) 색상.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 탭 진입 시 페이드 인 애니메이션.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: #calHeadlineSentence DOM 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase calendar_events 월별 집계 쿼리.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 33] 일정 탭: 캘린더 뷰 모드 스위처 (월간 / 주간 / 일간 / 근무표)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 전체 월달력, 집중 주간, 시간대별 일간, 교대근무 캘린더 모드를 자유롭게 스위칭.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 상단 4분할 세그먼트 탭바(월간 | 주간 | 일간 | 근무표), 높이 38px, 균등 배치.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 모드 전환 시 12ms 햅틱 및 달력 조형이 매끄럽게 모핑(Morphing)되는 시각 트랜지션.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: window.OurgoalSanctuaryV3.setCalMode(mode) 호출 및 #screen-calendar[data-cal-mode] 갱신.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 사용자 선호 캘린더 모드 로컬 스토리지에 캐시.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 34] 일정 탭: 연/월 네비게이터 및 오늘(Today) 복귀 점프 버튼

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 원하는 연/월(예: 2026년 9월)로 이동하고, 언제든 오늘 날짜로 1초 만에 복귀.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 좌/우 꺾쇠 화살표 버튼, 중앙 '2026년 9월' 볼드 타이틀, 우측 '오늘' 컴팩트 라운드 버튼.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 좌우 스와이프 제스처로 월 이동 지원. 오늘 버튼 터치 시 12ms 햅틱과 함께 오늘 날짜 셀로 부드러운 스크롤.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: changeCalMonth(-1 / +1) 및 jumpToToday() 함수 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 해당 월의 일정 및 실천 기록 배치 로드.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 35] 일정 탭: 7열 5행(1일~31일) 풀 월간 캘린더 그리드 (Full Month Grid)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 상민님 지시를 받들어 축약 없이 1일부터 31일까지 7열 5행 전체를 시원하게 조망하는 진짜 월달력.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 일~토 요일 헤더(일: 레드, 토: 블루), 7열 그리드, 셀 최소 높이 56px, 날짜 번호, 실천 완료 닷(●), 일정 바(Bar).
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 날짜 셀 터치 시 즉각 12ms 햅틱과 함께 선택 테두리 하이라이트. 하단 상세 일정 목록이 즉시 해당 날짜로 연동.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: renderSanctuaryCalendar() 실행 및 해당 월의 날짜별 셀 동적 생성.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase records 및 calendar_events 테이블 조인 데이터 기반 날짜별 인디케이터 매핑.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 36] 일정 탭: 선택 날짜(Selected Date) 하이라이트 링 및 날짜 전환 스와이프

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 현재 선택된 일자를 직관적으로 표시하고 날짜 간의 신속한 탐색 지원.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 선택된 날짜 셀에 2px var(--brand) 솔리드 테두리 및 반투명 배경 발광 효과.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 달력 영역 좌우 스와이프 시 월 이동, 하단 아젠다 영역 좌우 스와이프 시 1일 전/후 이동.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: window.state.calSelectedDate 갱신 및 선택 셀 active 클래스 토글.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 선택 날짜에 해당하는 상세 메모 및 파일 첨부 데이터 백그라운드 프리페치.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 37] 일정 탭: 교대근무 캘린더 오버레이 레이어

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 월달력 날짜 셀마다 주간(D), 야간(E), 비번(N), 휴무(O) 색상 밴드를 오버레이하여 교대 패턴 직관 파악.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 셀 상단 또는 하단에 위치한 4색 미니 밴드 및 텍스트 칩.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 근무표 모드 활성화 시 달력에 근무 밴드가 선명하게 강조되며 당직 일정과 자동 병합.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: OurgoalShift.renderShiftBandsOnCalendar() 호출.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 교대 순환 규칙(예: 주-주-야-야-비-휴) 알고리즘 자동 전개 및 Supabase user_shifts 동기화.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 38] 일정 탭: 당일 상세 일정 아젠다 리스트 카드 (s-cal-agenda-list)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 선택한 날짜에 등록된 시간대별 일정, 약속, 체크인 내역을 시간 순서대로 명쾌하게 나열.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: var(--card) 카드형 컨테이너, 시작 시간(14:00), 일정명, 연계된 목표 뱃지, 완료 체크박스.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 일정 완료 체크 시 12ms 햅틱 및 달력 셀의 인디케이터 색상이 완료(에메랄드)로 실시간 반영.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: renderDayAgendaList(selectedDate) 호출 및 DOM 생성.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase calendar_events 테이블의 is_done 컬럼 패치.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 39] 일정 탭: 인라인 빠른 일정 추가 바

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 모달을 띄우지 않고도 캘린더 하단에서 시간과 일정명을 입력하여 3초 만에 일정 등록.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 시간 선택 셀렉트 + 일정 텍스트 인풋 + '+ 등록' 버튼이 결합된 슬림한 1열 바.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 엔터 또는 등록 버튼 터치 시 12ms 햅틱과 함께 목록 상단에 새 일정이 착 감기며 추가.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: handleQuickAddCalendarEvent() 핸들러 직결.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase calendar_events 테이블 insert.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 40] 일정 탭: 사진형 일기(Photo Diary) 썸네일 뷰어 & 고화질 사진 팝업

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 그날의 실천 인증 사진이 등록된 날짜 셀에 썸네일을 표시하고, 터치 시 감성적인 사진 일기 팝업 노출.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 셀 내 18px 원형/정사각형 라운드 썸네일, 팝업 시 화면 80% 크기의 고화질 원본 사진 및 작성 일기 카드.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 썸네일 터치 시 12ms 햅틱 및 부드러운 줌인 팝업 애니메이션.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: openPhotoDiaryModal(recordId) 함수 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase Storage에 안전하게 저장된 이미지 CDN URL 로드.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 41] 일정 탭: 캘린더 첨부 파일/메모 링크 위젯 (calendar-attachment.js)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 해당 날짜의 일정에 PDF, 문서, 웹 링크, 세부 회고 메모를 연결하여 하나의 스마트 다이어리로 활용.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 클립 아이콘, 첨부 파일명 칩, 웹 링크 프리뷰 카드.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 링크 터치 시 인앱 브라우저 오픈, 파일 터치 시 다운로드/미리보기 지원.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: CalendarAttachment.renderAttachmentWidget() 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase calendar_attachments 메타데이터 연동.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 42] 일정 탭: 9:16 고화질 잠금화면 카드 생성 버튼 (#btnGenerateLockscreenCard)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 오늘의 일정과 격언, 목표 진척도를 스마트폰 잠금화면(9:16) 규격의 감성적인 이미지로 자동 생성 다운로드.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: '📱 잠금화면 카드' 아이콘 버튼, 캔버스 기반 렌더러.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 터치 시 12ms 햅틱과 함께 1초 만에 1080×1920 해상도 이미지 렌더링 및 갤러리 저장 모달 팝업.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: generateLockscreenCanvas(selectedDate) 실행 및 Blob 생성.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 클라이언트 사이드 Canvas API를 활용하여 서버 부하 0% 및 데이터 프라이버시 100% 보장.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 43] 기록 탭: 기록 헤드라인 문장 (#recHeadlineSentence)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 누적 기록 수, 총 몰입 시간, 라이프 밸런스 점수를 요약하는 지적인 헤드라인 표출.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 폰트 크기 14px, 마진 8px 0, var(--ink-dim) 색상.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 탭 진입 시 페이드 인 애니메이션.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: #recHeadlineSentence DOM 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase records 및 time_logs 통계 연동.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 44] 기록 탭: 샘플 데이터 정리/초기화 안내 배너 (#recSamplePurgeBanner)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 신규 유저의 체험용 가상 데이터를 원클릭으로 정리하고 순수한 내 기록만을 남기도록 안내.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 슬림한 경고/안내 배너, 닫기(X) 버튼, '샘플 데이터 1초 정리' 액션 링크.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 정리 클릭 시 12ms 햅틱 및 즉시 가상 데이터 소탕 후 '정리 완료' 토스트 출력.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: purgeSampleRecords() 실행 및 4대 뷰 동시 전파.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: localStorage 및 Supabase에서 is_sample = true 레코드 일괄 제거.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 45] 기록 탭: 기록 3대 뷰 모드 세그먼트 바 (히트맵 / 피드 / 타임트래커)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 🟩 365일 히트맵, ✍️ 내 기록 피드, ⏱️ 타임 트래커 3가지 전문 뷰를 원클릭 전환.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 3열 균등 세그먼트 버튼 바, 높이 40px, 활성 버튼 var(--brand) 솔리드 및 볼드 타이포.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 모드 전환 시 12ms 햅틱 진동 및 컨텐츠 페이드 스위칭.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: window.OurgoalSanctuaryV3.setRecMode(mode) 실행 및 뷰 컨테이너 토글.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 마지막 선택 뷰 모드 로컬 캐시.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 46] 기록 탭: 365일 전체 연간 히트맵 그리드 (52주 × 7일 매트릭스)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 깃허브 스타일로 1년 365일의 실천 밀도를 52열 7행 에메랄드 블록으로 웅장하게 조망 (헌법 준수: 히트맵 단일화).
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 수평 스크롤 지원 그리드, 4단계 농도 에메랄드 색상, 월 라벨(1월~12월), 요일 라벨(월/수/금).
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 블록 호버/터치 시 날짜, 실천 횟수, 주요 실천 내역 툴팁 팝업 및 12ms 햅틱.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: renderAnnualHeatmapSvg() 함수를 통해 고성능 벡터 SVG 렌더링.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 연간 records 타임스탬프 집계 쿼리.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 47] 기록 탭: 날짜별 기록 상세 조회 모달 (openDayDetailModal)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 히트맵 블록이나 피드 날짜 클릭 시 해당 일자의 모든 체크인, 타임로그, 사진일기를 한곳에 모아 모달 팝업.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 풀스크린 바텀 시트, 날짜 헤더, 시간대별 타임라인 카드들, 닫기 버튼.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 터치 시 12ms 햅틱 및 부드러운 슬라이드 업.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: openDayDetailModal(dateStr) 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase records 해당 일자 상세 레코드 로드.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 48] 기록 탭: 내 타임라인 기록 피드 스트림

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 내가 작성한 모든 체크인과 회고 기록을 최신순 타임라인 피드로 끝없이 탐색.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 카드형 피드 아이템, 작성 시간(방금 전, 2시간 전), 목표 카테고리 뱃지, 실천 내용 텍스트, 첨부 사진, 좋아요 수.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 무한 스크롤(Infinite Scroll) 지원, 카드 터치 시 수정/삭제 메뉴 오픈.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: renderRecordsFeedList() 함수 호출 및 가상 리스트 렌더링.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase records 페이지네이션(offset/limit) 쿼리.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 49] 기록 탭: 기록 검색 및 태그 필터 바

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 수많은 기록 중에서 키워드(예: '러닝', '독서') 또는 카테고리 태그로 원하는 기록을 0.1초 만에 검색.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 돋보기 아이콘 인풋창 + 가로 스크롤 태그 필터 칩들.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 키워드 타이핑 시 디바운스(150ms) 기반 실시간 필터링 결과 노출.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: filterRecordsByKeywordAndTag(keyword, tag) 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 클라이언트 사이드 인메모리 고속 검색.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 50] 기록 탭: 정밀 밀리초 스톱워치 타임 트래커 패널 (time-tracker.js)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 목표 몰입 시간을 0.01초 단위로 정밀하게 측정하는 전문 스톱워치 및 타이머.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 대형 디지털 타이머 폰트(00:25:14.82), 시작/일시정지/랩/리셋 4대 제어 버튼, 원형 진행 링.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 버튼 터치 시 12ms 햅틱. 백그라운드 전환 시에도 Web Worker 기반 오차 0% 시간 측정.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: OurgoalTimeTracker.initDOM() 및 start/pause/lap/reset 컨트롤러 연결.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 측정 완료 시 Supabase time_logs 테이블에 소요 시간, 시작/종료 일시 원자적 저장.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 51] 기록 탭: 랩 타임 기록 및 랩별 메모 입력 모달 (openLapMemoModal)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 스톱워치 진행 중 구간별 랩 타임을 기록하고 해당 구간에 대한 세부 메모 작성.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 랩 번호, 구간 시간, 누적 시간 테이블 + 랩 메모 입력 폼.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 랩 버튼 터치 시 12ms 햅틱과 함께 목록에 랩이 즉시 쌓임.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: openLapMemoModal(lapIndex) 및 renderLapsList() 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: time_logs의 laps JSONB 컬럼에 기록 보존.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 52] 기록 탭: 라이프 밸런스 다차원 방사형/파이 차트 (renderLifeBalancePieSvg)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 건강, 커리어, 학업, 취미, 인간관계 등 삶의 영역별 실천 비중을 오각형/육각형 방사형 차트로 분석.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 반응형 SVG 방사형 레이더 및 파이 차트, 영역별 고유 컬러 범례.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 차트 꼭지점 터치 시 해당 영역의 총 시간 및 비율 툴팁 노출.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: RecordsStats.renderLifeBalancePieSvg() 호출.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 목표 카테고리별 누적 기록 시간 서버 집계.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 53] 기록 탭: 유니버설 통계 멀티시리즈 SVG 시계열 차트 (universal-stats.js)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 주간/월간 몰입 시간 추이를 꺾은선 및 막대 복합 차트로 비교 분석.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 다크/라이트 테마 적응형 SVG 그리드, 부드러운 베지어 곡선 그래프.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 그래프 축 스와이프 제스처 및 데이터 포인트 터치 시 12ms 햅틱과 상세 수치 표시.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: UniversalStats.renderUniversalSvgChart() 실행.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase 통계 집계 뷰(analytics_views) 연동.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 54] 기록 탭: 시간 기록 퀵 액션 독 (Floating Action Dock)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 시간 기록, 빠른 회고 작성, 템플릿 불러오기를 하단에서 언제든 즉각 실행하는 플로팅 바.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 하단 68px 높이에 떠 있는 라운드 독, 3개 퀵 아이콘 버튼.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 터치 시 12ms 햅틱 및 해당 액션 시트 슬라이드 업.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: 퀵 독 액션 리스너 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 로컬 임시 저장소와 연계된 자동 임베딩.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 55] 소통 탭: 소통 헤드라인 문장 (#commHeadlineSentence)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 오늘 함께 달린 동반자 수와 오간 응원 횟수를 브리핑하여 고립감 해소.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 폰트 크기 14px, 마진 8px 0, var(--ink-dim) 색상.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 탭 진입 시 페이드 인 애니메이션.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: #commHeadlineSentence DOM 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase community_stats 집계.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 56] 소통 탭: 동류 소통 요약 히어로 카드 (#commHeroCard)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 내 러닝메이트 그룹 수, 활성 동반자 수, 오늘 받은 응원 카운트를 3열 통계 카드로 한눈에 요약.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: var(--card) 배경, 3분할 수치 레이아웃(그룹 4개 | 동반자 28명 | 응원 142회), 에메랄드 강조 수치.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 카드 터치 시 각 통계 세부 모달 오픈.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: renderSanctuaryComm() 내부 히어로 카드 데이터 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase user_followers 및 team_members 조인 쿼리.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 57] 소통 탭: 실시간 러닝메이트 레이더 패널 (#sPeerRadarCard)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 현재 나와 같은 시간에 목표를 실천하고 있는 동반자들을 원형 레이더 스캔 형태로 실시간 시각화.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 동심원 레이더 그래픽, 실시간 접속자 펄스 애니메이션(그린 라이트 깜빡임), 접속자 수 뱃지.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 레이더에 동반자가 잡힐 때마다 부드러운 핑 애니메이션 연출.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: OurgoalSanctuaryV3.renderSanctuaryComm() 및 getRealRunningMates() 실행.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase Realtime Presence 채널 연동으로 실시간 온라인 상태 감지.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 58] 소통 탭: 레이더 접기/펼치기 슬라이드 토글 (toggleRadarCollapse)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 피드에 집중하고 싶은 유저를 위해 거대한 레이더 카드를 1줄 슬림 바로 축소/확장.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 상단 우측 '접기/펼치기(▼/▲)' 텍스트 버튼, 토글 시 레이더 높이 애니메이션.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 터치 시 12ms 햅틱과 함께 0.25초 만에 부드러운 슬라이드 폴딩.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: toggleRadarCollapse() 함수 ➔ localStorage('ourgoal_radar_collapsed') 상태 저장.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 사용자 인터페이스 상태 영구 보존.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 59] 소통 탭: 러닝메이트 320종 아바타 덱 및 프로필 팝오버

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 레이더 및 피드에 노출되는 동반자의 320종 아바타와 닉네임, 현재 실천 중인 목표 엿보기.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 40px 원형 아바타 칩들의 덱 나열, 터치 시 나타나는 미니 프로필 카드.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 동반자 아바타 터치 시 12ms 햅틱 및 '1초 응원 보내기' 팝오버 노출.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: renderPeerAvatarHtml() 함수 호출.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 동반자 공개 프로필 및 최근 체크인 레코드 조회.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 60] 소통 탭: 18종 관심사/카테고리 칩 필터 바

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 운동, 독서, 자격증, 미라클모닝, 코딩 등 18개 관심사 카테고리별로 피드를 정밀 필터링.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 수평 가로 스크롤 칩 바, 라운딩 9999px, 선택 칩 var(--brand) 솔리드 채움.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 칩 터치 시 12ms 햅틱 및 피드 목록 즉각 필터링.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: filterCommFeedByCategory(catId) 실행.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase community_posts 테이블의 category_id 인덱스 쿼리.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 61] 소통 탭: 실시간 동류 실천 피드 스트림

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 비교와 박탈감이 없는 순수한 갓생 실천 인증 타임라인 스트림.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 정갈한 피드 카드, 유저 아바타/닉네임, 실천 시간, 인증 텍스트 및 사진, 응원/도움돼요 버튼.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 더블 탭(Double Tap) 시 하트 팝업과 함께 12ms 햅틱 응원 즉시 발송.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: renderCommFeedStream() 실행 및 WebSocket 이벤트 리스너.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase community_posts 및 user_reactions 실시간 구독.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 62] 소통 탭: 칭찬 및 응원 도장 발송 시트 (reactions.js, helpful-reason.js)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 단순 좋아요를 넘어 '불꽃 열정', '꾸준함의 신', '동기부여 100%' 등 12종의 감성 도장과 도움 이유 선택 발송.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 바텀 시트 모달, 12종 고화질 감정 스탬프 그리드, 한 줄 칭찬 메모 인풋.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 도장 터치 시 12ms 햅틱 및 상대방 피드에 도장 도장 쿵 효과.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: Reactions.openAdviceSheet() 및 sendHelpfulReaction() 실행.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase user_reactions 테이블에 reaction_type 및 reason_code 저장.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 63] 소통 탭: 1:1 실시간 DM 및 팀 채팅 드로어 (openTeamChatModal)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 팀원들과의 실시간 목표 전략 논의 및 러닝메이트와의 따뜻한 1:1 격려 대화방.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 우측 슬라이드 인 드로어, 말풍선 채팅 리스트, 하단 메시지 입력창 및 전송 버튼.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 메시지 전송 시 12ms 햅틱과 함께 즉시 내 말풍선 생성(낙관적 업데이트).
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: OurgoalTeamInviteComm.openTeamChatModal() 및 initIncomingDmListener().
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase Realtime Broadcast 채널을 통한 엔드투엔드 무지연 채팅 패킷 전달.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 64] 소통 탭: 팀 초대 및 카카오톡/링크 공유 모달 (#modalKakaoShareBtn, #modalCopyLinkBtn)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 내 팀이나 갓생 목표를 카카오톡 또는 클립보드 복사 링크로 친구에게 공유하여 함께 달리기.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 카카오톡 노란색 버튼, 링크 복사 버튼, 초대 코드 표시창.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 링크 복사 클릭 시 12ms 햅틱과 함께 클립보드 복사 및 '초대 링크가 복사되었습니다' 토스트.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: handleKakaoShare() 및 navigator.clipboard.writeText().
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 초대 토큰 검증 및 Supabase team_invites 테이블 수명주기 관리.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 65] 설정 탭: 설정 헤드라인 문장 (#settingsHeadlineSentence)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 내 계정의 보안 등급과 환경설정 상태를 브리핑하는 정돈된 헤드라인.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 폰트 크기 14px, 마진 8px 0, var(--ink-dim) 색상.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 탭 진입 시 페이드 인 애니메이션.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: #settingsHeadlineSentence DOM 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase user_profiles 계정 상태 조회.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 66] 설정 탭: 내 프로필 히어로 카드 (#settingsHeroCard)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 현재 장착 아바타, 닉네임, 이메일, 계정 유형(소셜/이메일), 마스터 랭크를 우아하게 표시.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: var(--card) 배경, 56px 대형 아바타 슬롯, 닉네임 옆 '수정 ✏️' 버튼, 레벨/랭크 뱃지.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 아바타 터치 시 아바타 커스터마이저 오픈, 닉네임 터치 시 인라인 닉네임 수정 인풋 활성화.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: renderSettingsProfileHero() 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase profiles 테이블 업데이트.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 67] 설정 탭: 320종 아바타 보관함 및 다이내믹 앨범 모달 (#btnSettingsQuickAvatar, #btnOpenDynamicAlbum)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 헌법 규정 320종 페르소나 아바타 전체를 탐색하고 원하는 아바타를 내 대표 프로필로 장착.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 4열 아바타 그리드, 카테고리 탭(클래식, 판타지, 사이버, 동물 등), 장착 중 체크 뱃지.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 아바타 터치 시 12ms 햅틱과 함께 즉시 메인 아바타로 교체되며 전 탭 아바타 원자적 갱신.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: OurgoalAvatarSystem.openAvatarModal() 및 openDynamicAlbumModal().
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase profiles.avatar_id 영구 갱신.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 68] 설정 탭: 4대 테마 원터치 2×2 그리드 셀렉터 (theme-system.js)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: Focus Sanctuary(성소), Urban City(도심), Minimal White(화이트), Pitch Black(블랙) 4대 테마 전환.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 2×2 그리드 카드, 각 테마별 실제 색상 팔레트 미니어처 미리보기, 활성 테마 체크마크.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 테마 카드 터치 시 12ms 햅틱과 함께 0.1초 만에 전체 앱 색상 전환.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: OurgoalThemeSystem.applyTheme(id) 호출 및 HTML 속성 data-theme 변경.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: localStorage 및 Supabase profiles.theme 영구 저장.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 69] 설정 탭: 나만의 홈 구성 및 위젯 배치 관리자 (#btnOpenWidgetModal)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 홈 화면에 노출되는 카드(스트릭, 퀘스트, 레이스, AI코칭 등)의 순서를 드래그앤드롭으로 바꾸고 숨김 처리.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 토글 스위치 목록, 드래그 핸들 아이콘, '기본값으로 복원' 버튼.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 스위치 터치 시 12ms 햅틱 및 홈 탭 실시간 반영.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: saveHomeWidgetConfig() 및 renderHome() 재호출.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase user_preferences JSON 저장.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 70] 설정 탭: 계정 보안, 비밀번호 변경 및 2단계 인증(2FA) 모달 (#btnChangePassModal)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 비밀번호 변경, 2단계 인증(OTP/이메일 인증), 접속된 다른 기기 원격 로그아웃 제어.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 보안 등급 인디케이터(보통/안전), 2FA 토글 스위치, 기기 세션 리스트.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 원격 로그아웃 클릭 시 12ms 햅틱 및 해당 세션 즉시 만료.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: OurgoalAuthSafety.openChangePasswordModal() 실행.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase Auth API 및 auth.mfa.enroll() 파이프라인 연동.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 71] 설정 탭: 데이터 백업 / 복원 (JSON 파일 내보내기 및 가져오기)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 사용자의 모든 목표, 마일스톤, 기록, 세팅값을 JSON 파일로 다운로드하고 언제든 100% 무손실 복원.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: '💾 전체 데이터 백업' 버튼 + '📂 백업 파일 복원' 버튼, 백업 일시 정보.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 백업 터치 시 즉시 JSON 파일 다운로드. 복원 터치 시 파일 선택 후 데이터 정합성 검증 후 복원.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: exportAllUserDataToJson() 및 importUserDataFromJson(file).
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: 클라이언트 사이드 무손실 추출 및 Supabase 원격 원장 일괄 업서트.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 72] 설정 탭: 휴지통 및 삭제 데이터 복구함 (#btnOpenTrashModal)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 실수로 삭제한 목표나 기록을 30일간 안전하게 보관하고 1초 만에 원상 복구 (Zero Accidental Data Loss).
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 삭제된 아이템 목록, '복구 ↩️' 버튼, '영구 삭제 🗑️' 버튼.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 복구 터치 시 12ms 햅틱과 함께 원래 탭으로 즉시 복원.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: restoreFromTrash(itemType, itemId) 바인딩.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase is_deleted = false 원상 복구.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 73] 설정 탭: 푸시 알림 및 리마인더 세부 주기 설정

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 아침 체크인 알림, 취침 전 회고 알림, 동반자 응원 알림, 침묵 시간대(Do Not Disturb) 시간 설정.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 알림 종류별 토글 스위치 + 시작/종료 시간 타임 피커.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 스위치 터치 시 12ms 햅틱 및 웹 브라우저 푸시 권한 요청 팝업.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: OurgoalNotifyEngine.updateNotificationSettings() 실행.
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Web Push API 서브스크립션 엔드포인트 Supabase user_push_subscriptions 저장.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### [항목 74] 설정 탭: 앱 평가/피드백 전송 및 회원 탈퇴 모달 (#appEvaluationModal, #withdrawModal)

1. **기능 개선 엔지니어링 계획 (Functional Enhancement)**:
   - **기능 및 목적**: 앱에 대한 별점/건의사항 전송(Zero mailto 원칙 준수) 및 탈퇴 시 안내와 데이터 영구 파기 절차 집행.
   - **상태 및 로직 배선**: 사용자 인터랙션 발생 시 전역 상태(`window.state`) 동기화 및 트랜잭션 단위 안전 저장.
   - **예외 및 회복력**: 오프라인 네트워크 단절 시 로컬 큐에 즉시 적재하고 네트워크 복원 시 자동 동기화(Self-Healing).

2. **시각적 UI 조형 개선 계획 (Visual & Layout Renewal)**:
   - **조형 및 배치**: 5점 별점 평가 폼, 피드백 입력창, '제출하기' 버튼. 탈퇴 모달: 붉은색 경고창 및 확인 입력란.
   - **디자인 토큰 적용**: 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 1급 CSS 변수(`--bg`, `--card`, `--ink`, `--rule`, `--brand`) 100% 결합.
   - **모바일 뷰포트 규격**: 375px 모바일 기준 좌우 16px 패딩, 카드 라운딩 16px, 폰트 명도 대비비 4.5:1 이상 영구 보장.

3. **손끝 UX 및 인터랙션 개선 계획 (Haptic, Gestures & Micro-interactions)**:
   - **물리 햅틱 반응**: 피드백 제출 시 12ms 햅틱과 함께 개발팀 직통 전송 토스트. 탈퇴 시 철저한 재확인 절차.
   - **제스처 및 인터랙션**: 터치 시 지연 없는 12ms 물리 햅틱 진동(`triggerHaptic(12)`) 및 활성 요소 미세 스케일 다운(scale 0.96) 피드백.
   - **시각 피드백 연출**: 부드러운 페이드 인/아웃(0.15s) 및 동작 완료 시 폭죽/스탬프/드로잉 마이크로 애니메이션.

4. **프론트엔드 연동 및 배선 계획 (State, DOM & Propagation)**:
   - **DOM 바인딩**: submitAppFeedback() 및 processAccountWithdrawal().
   - **원자적 전파**: `dispatchFullViewPropagation()`를 통해 홈, 목표, 일정, 기록 4대 화면의 뷰를 0.05초 만에 원자적 동시 리렌더링.

5. **백엔드 연동 및 서버 상호작용 계획 (Backend, DB & Server Interaction)**:
   - **데이터베이스 연계**: Supabase app_evaluations 테이블 적재. 탈퇴 시 profiles, records, goals 전수 영구 파기 트랜잭션.
   - **원장 영속화**: Supabase 테이블 RLS 정책 100% 준수 및 클라이언트-서버 간 양방향 데이터 무손실 보존.

---

### 3-2. 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 주요 작업 내용 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 상단바 정돈, 바텀네비 6대 탭 균등 복원, 74개 모듈 배치 슬롯 구조화, 890개 버튼 배선 보존 | +120줄 | -40줄 | +80줄 | 구조적 IA 재배치 |
| `css/ui.css` | 4대 테마 1급 변수 기반 컴포넌트 스타일, 375px 모바일 패딩, 7열 5행 캘린더 그리드, 365일 히트맵 | +220줄 | -60줄 | +160줄 | 시각 및 반응형 정제 |
| `js/sanctuary-v3-engine.js` | 6대 탭 전수 렌더러 함수(홈, 목표, 캘린더, 기록, 소통, 설정) 고도화 및 12ms 햅틱 배선 | +180줄 | -30줄 | +150줄 | 렌더링 파이프라인 |
| `js/components.js` | 74개 세부 항목별 직통 핸들러 및 4대 뷰 원자적 전파 디스패처 완결 | +90줄 | 0줄 | +90줄 | 비즈니스 로직 배선 |
| `scripts/smoke-test.js` | 74개 항목 및 6대 탭 UI/UX 무결성 스모크 단언문 추가 | +15줄 | 0줄 | +15줄 | 회귀 방지 게이트 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Safety & Non-Destruction)

- [x] **기존 기능 단 1개도 삭제하지 않았는가? (Zero Deletion Mandate)**: 890개 정적 버튼, 221개 폼 컨트롤, 기존 80여 개 티켓에서 구현된 비즈니스 로직을 100% 온전히 보존합니다.
- [x] **기존 유저 데이터 100% 무손실 보존되는가? (Zero Data Loss Mandate)**: 10종 가상 유저 페르소나 및 실제 유저의 아바타(320종 보관함), 목표, 기록, 캘린더 일정, 세팅값이 1바이트도 유실되지 않습니다.
- [x] **전체 파일 덮어쓰기 없이 외과수술적 diff를 준수하는가?**: 기존 DOM 구조와 ID를 보존하며 컨테이너 배치와 스타일 변수만을 외과수술적으로 교정합니다.
- [x] **용어 헌법을 완벽히 준수하는가?**: '잔디' 단어를 100% 배제하고 '히트맵'으로 단일화하며, 아바타는 '320종'으로 단일화합니다.

---

## 5. [원칙 ⑤] 세부 구현 순서 (Step-by-Step Implementation Sequence)

1. **Step 1: 전역 쉘 및 바텀 네비게이션 6대 탭 복원 (항목 1~4)**
   - `index.html` 및 `css/ui.css`에서 하단 바텀 네비게이션 6개 탭(`[홈 | 목표 | 일정 | 기록 | 소통 | 설정]`) 균등 6분할 배치.
   - 상단바 `#sanctuaryTopBar` 글래스모피즘 및 글로벌 토스트/모달 오버레이 무결성 확보.
2. **Step 2: 홈 탭 3초 고속 체크인 원카드 및 핵심 위젯 재배치 (항목 5~19)**
   - 375px 모바일 첫 화면(Above the Fold)에 아바타 레벨링 & 3초 체크인 인풋 & 퀘스트 3종 완결 배치.
   - 스트릭 히트맵, 동반자 레이스, Gemini AI 영감 카드 순차 정렬.
3. **Step 3: 목표 탭 1급 상단바 & 4열 서브탭 재구성 (항목 20~31)**
   - 1열 상단 액션 바 및 `[루틴 | 개인 | 팀 | 완료]` 4열 서브탭 단정화.
   - 3계층 로드맵 마일스톤 및 슬림 AI 코파일럿 드로어 배선.
4. **Step 4: 일정 탭 7열 5행 풀 월간 캘린더 전면 복원 (항목 32~42)**
   - 1일~31일 전체 월달력 7열 그리드 및 날짜별 완료 닷/사진일기 썸네일 오버레이 복원.
   - 하단 당일 시간별 아젠다 리스트 및 인라인 일정 추가 바 결합.
5. **Step 5: 기록 탭 3대 모드 세그먼트 & 365일 히트맵/타임트래커 분리 정돈 (항목 43~54)**
   - `[히트맵 | 피드 | 타이머]` 상단 40px 세그먼트 탭바 단일화.
   - 365일 연간 히트맵 그리드, 정밀 스톱워치 타임트래커, 타임라인 피드 분리 렌더링.
6. **Step 6: 소통 탭 실시간 러닝메이트 레이더 & 팀 피드 정돈 (항목 55~64)**
   - 18종 카테고리 칩 및 슬라이드 폴딩 레이더 패널 배치.
   - 실시간 피드 스트림 및 12종 감정 도장 발송 시트 결합.
7. **Step 7: 설정 탭 6대 관리자 모듈 규격화 및 도구/모달 허브 완결 (항목 65~74)**
   - 프로필 히어로, 320종 아바타 보관함, 4대 테마 그리드, 계정 보안(2FA), 백업/복원 정돈.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Verification Scenarios)

- **시나리오 A (Zero Dead-Click 검증)**:
  - 890개 정적 버튼 전수 클릭 시뮬레이션 (`node scripts/verify-all-clicks.js`) ➔ 데드클릭 0건 및 엄밀 핸들러 배선율 100% 입증.
- **시나리오 B (Zero Data Loss 검증)**:
  - 10종 가상 유저 페르소나 데이터(아바타, 목표, 기록, 세팅값) 100% 무손실 보존 검증 통과.
- **시나리오 C (UI/UX 375px 모바일 실측 시각 검증)**:
  - Chrome CDP 헤드리스 브라우저를 통해 6대 탭 전수 실제 렌더링 스크린샷 캡처 및 수직 스크롤/대비비 실측 확인.
- **시나리오 D (4대 뷰 원자적 동시 전파 검증)**:
  - 체크인 제출 시 홈, 목표, 일정, 기록 4개 화면의 DOM이 0.05초 만에 동시 갱신되는지 확인.
- **시나리오 E (자동화 게이트 및 법정 검사 통과)**:
  - `npm test` 38개 헌법 게이트 및 440개 스모크 테스트 100% ALL PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Action Checklist)

- [ ] Step 1: 전역 쉘 및 바텀 네비게이션 6대 탭 균등 복원 (항목 1~4)
- [ ] Step 2: 홈 탭 3초 고속 체크인 원카드 및 핵심 위젯 재배치 (항목 5~19)
- [ ] Step 3: 목표 탭 1급 상단바 & 4열 서브탭 재구성 (항목 20~31)
- [ ] Step 4: 일정 탭 7열 5행 풀 월달력 그리드 전면 복원 (항목 32~42)
- [ ] Step 5: 기록 탭 3대 모드 세그먼트 & 365일 히트맵/타임트래커 정돈 (항목 43~54)
- [ ] Step 6: 소통 탭 실시간 레이더 & 팀 피드 정돈 (항목 55~64)
- [ ] Step 7: 설정 탭 6대 관리자 모듈 규격화 (항목 65~74)
- [ ] Step 8: `npm test` 38개 게이트 및 Zero Dead-Click 890개 100% 검증
- [ ] Step 9: Tri-Sync 3자 동기화(노션, 옵시디언, 관제센터) 무결성 100% 확인

---

## 8. [원칙 ⑧] 지속 개선 및 회고 (Continuous Improvement & Retrospective)

- 본 전면 개편을 통해 아워골의 정보구조(IA)를 7대 화면 및 74개 모듈로 완전 체계화함.
- 향후 신규 기능 추가 시 기존 화면을 파괴하지 않고 '나만의 홈 구성' 관리자에 모듈러 방식으로 편입하는 거버넌스 확립.
- 4대 테마 및 모바일 375px 반응형 회귀 방지 테스트를 CI 파이프라인에 영구 유지.
