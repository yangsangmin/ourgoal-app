# 요구사항 정의서 (REQ) — 아이폰 iOS Safari 및 안드로이드 홈화면 추가 3초 가이드 고도화 & 게스트 모드 진입 시 마찰 제로화

> **문서 ID**: REQ-TASK-ES-138-PWA-GUEST-FRICTIONLESS  
> **티켓 연계**: #TASK-ES-138  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity Core Engine  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "병합하고 관련 모든 티켓 중단없이 집행해", 노션 생각 메모장 [138]번 (정체 [104], #TASK-ES-249 결합)
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 모바일 웹 브라우저(iOS Safari / Android Chrome)로 진입한 유저가 홈 화면에 PWA 바로가기 아이콘을 추가하는 방법을 알지 못해 재방문율이 급감함.
  2. 기존 설정 탭의 PWA 가이드 버튼(`#btnPwaInstallGuide`)이 38px로 44px 모바일 터치 규격에 미달하며, 모달 진입 시 유저 OS(iOS vs Android)를 자동 감지하지 않고 무조건 iOS 탭만 띄워 안드로이드 유저의 조작 마찰이 발생함.
  3. 랜딩 화면에서 게스트 모드로 둘러보기(`로그인 없이 둘러보기`) 시 12ms 햅틱 및 직관적 환영 피드백이 부족하고, 브라우저가 독립 PWA 모드가 아닐 때 홈화면 바로가기 추가 3초 팁으로의 연결고리가 미흡함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: PWA 가이드 모달 내 OS 자동 분기 누락 및 38px 터치 타깃 미달.
  - **2층 (구조/프로세스 부재)**: 비-PWA 브라우저 환경 감지(`display-mode: standalone`) 및 게스트 모드 진입 경로에서의 부드러운 온보딩 어포던스 공백.
  - **3층 (시스템/유저 체감 괴리)**: 유저는 앱스토어 다운로드 없이 웹앱을 앱처럼 바탕화면에 두고 쓰고 싶으나 그 방법을 안내받지 못하고 이탈함.
- **사용자 상황 및 페르소나**: 사파리나 크롬으로 처음 접속하여 로그인 없이 서비스를 먼저 둘러보려는 모바일 신규 방문자 및 홈화면에 아이콘을 등록하려는 스마트폰 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: INFRA/UX
- **[본질] (Essence)**: 앱스토어 설치 없이도 모바일 OS(iOS/Android) 특성에 맞춘 3초 카드뉴스로 스마트폰 홈화면에 앱 아이콘을 바로 등록하게 유도하고, 회원가입 장벽 없이 0초 만에 게스트 모드로 완전한 가치 탐색을 경험하게 만드는 마찰 제로 온보딩 파이프라인.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 기기 UserAgent에 따른 iOS/Android 플랫폼 자동 감지 탭 스위칭 부재.
  2. **원인 2**: 설정 화면의 PWA 설치 안내 버튼이 38px 소형 높이로 엄지 터치 시 오발생 가능성이 높았던 점.
  3. **원인 3**: 비-PWA 환경에서 게스트 모드 진입 시 가벼운 PWA 바로가기 팁 어포던스 및 햅틱 체감 부재.
- **[중심] (Core Bottleneck & Anchor)**: `openPwaInstallGuideModal` 내 OS 플랫폼 자동 감지(`switchPwaOsTab(isIos ? 'ios' : 'android')`), `.pwa-guide-action-btn` 44px 모바일 터치 토큰화, 게스트 모드 진입 0초 전환 및 무손실 로컬 보존 강화.
- **[핵심] (Critical Safety & Termination)**: 기존 게스트 프로필 로컬 보존(`ourgoal_guest_profile`), PWA 스탠드얼론 모드 판별, 44px 터치 타깃 엄수.
- **체감 가설 (User Experience Hypothesis)**:
  > *"아이폰이나 갤럭시 폰으로 처음 접속한 유저는 '로그인 없이 둘러보기'를 누르는 순간 12ms 기분 좋은 진동과 함께 즉시 전체 앱 공간으로 진입하며, 내 폰 기종에 맞춘 '홈화면 추가 3초 카드뉴스'를 보고 3초 만에 홈화면에 아이콘을 띄워 진짜 네이티브 앱처럼 사용한다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인(세션, 게스트, 소셜)에 미치는 영향: 게스트 모드 진입 완결성 극대화, 기존 소셜 로그인 파이프라인 100% 무손실 유지.
  - 홈 화면 및 스트릭에 미치는 영향: 게스트 상태에서도 당일 체크인 및 스트릭 계산 완벽 지원.
  - 기록/통계/캘린더 탭에 미치는 영향: 모든 탭 100% 정상 탐색 가능.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**: 네이티브 앱스토어로 유도하는 복잡한 설치 파일 다운로드 강제 금지, 게스트 유저에게 무리한 회원가입 팝업 강요 금지.
- **해야 할 것 (Action)**: 모달 오픈 시 브라우저 플랫폼(iOS/Android) 자동 감지, 44px `.pwa-guide-action-btn` 적용, 3단계 카드뉴스 단계별 가독성 강화.
- **왜 이 방식이어야만 하는가 (Why this approach)**: 사용자의 운영체제에 맞는 맞춤 화면을 즉시 띄워주는 것이 홈화면 추가 전환율을 극대화하는 표준 PWA UX이기 때문.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 게스트 상태는 로컬 스토리지 `ourgoal_guest_profile`에 무손실 저장 후 회원가입 시 Supabase `profiles` 테이블로 일원화 전송.
- **2호 (스마트 스토리지 분기 설계)**: PWA 가이드 확인 플래그 `localStorage.getItem('ourgoal_pwa_guide_viewed')` 영속화.
- **3호 (4대 뷰 전파 배선도)**: 게스트 진입 시 `renderAll()`, `renderHome()`, `renderRecordsScreen()` 원자적 호출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#btnLandingPreviewDirect` | 랜딩 화면 | 클릭/터치 | 게스트 모드 즉시 활성화 후 앱 셸 오픈 | 12ms 햅틱 및 환영 토스트 |
| `#btnPwaInstallGuide` | 설정 탭 | 클릭/터치 | OS 자동 감지 후 3초 PWA 카드뉴스 모달 오픈 | 12ms 햅틱 |
| `#btnPwaOsIos` | PWA 가이드 모달 | 클릭/터치 | Apple iOS 3단계 카드뉴스 노출 | 12ms 햅틱 및 탭 활성화 |
| `#btnPwaOsAndroid` | PWA 가이드 모달 | 클릭/터치 | Android Chrome 3단계 카드뉴스 노출 | 12ms 햅틱 및 탭 활성화 |
| `#btnConfirmPwaInstall` | PWA 가이드 모달 | 클릭/터치 | 모달 닫기 및 홈화면 안내 토스트 발송 | 로컬 플래그 저장 |
| `#btnClosePwaGuide` | PWA 가이드 모달 | 클릭/터치 | 바텀시트 모달 즉시 닫기 | 부드러운 트랜지션 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **게스트 프로필 보존**: `ourgoal_guest_profile` 키를 통해 새로고침 후에도 게스트 상태 및 기록 100% 유지.
- **PWA 안내 플래그 보존**: `ourgoal_pwa_guide_viewed` 영속 메모리 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: 데스크톱 브라우저에서 접근 시 iOS/Android 모바일 가이드가 불필요할 수 있음 -> 데스크톱 환경에서는 일반 Chrome/Edge 설치 팁으로 유연하게 폴백.
- **기존 기능과의 충돌 가능성 검토**: 이미 PWA standalone 모드로 접속 중인 유저는 불필요한 설치 가이드에 노출되지 않도록 최적화.
- **엣지 케이스 (Edge Cases)**:
  - iOS Chrome 브라우저: 사파리가 아닌 크롬으로 연 경우 사파리로 열기 안내 문구 보강.
  - 뒤로가기 누름: 안드로이드 하드웨어 백 버튼 시 모달 정상 닫힘.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. `ui.css`에 `.pwa-guide-action-btn`, `.btn-pwa-os-tab` 44px 모바일 터치 토큰 및 manipulation 액션 강화.
  2. `index.html` 내 `openPwaInstallGuideModal` 함수에서 `navigator.userAgent` 분석하여 iOS/Android 탭 자동 스위칭 로직 배선.
  3. 설정 탭의 `#btnPwaInstallGuide`에 `.pwa-guide-action-btn` 적용하여 44px 최소 터치 높이 보장.
  4. 랜딩 화면의 `#btnLandingPreviewDirect` 터치 인터랙션 햅틱 및 게스트 입장 0초 전환 최적화.
  5. 390px 모바일 뷰포트에서 CDP 계측 및 스크린샷 획득.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: `navigator.userAgent` 파싱 실패 시 기본 'ios' 탭으로 안전하게 폴백.
- **가정의 타당성 검증**: 3단계 카드뉴스가 390px 뷰포트에서 가로 스크롤 넘침 없이 한눈에 들어오는지 검증.
- **재검증 결과 도출된 절차 수정/보완사항**: PWA 안내 모달의 닫기 버튼(`#btnClosePwaGuide`) 역시 44px 터치 영역을 확보하여 오동작 방지.

---

## 7. [원칙 ⑦] 구현 착수 (Execution Checklist)
- [ ] `ui.css` 44px `.pwa-guide-action-btn` 스타일 추가
- [ ] `index.html` PWA 가이드 버튼 클래스 적용 및 OS 자동 감지 로직 탑재
- [ ] `index.html` 게스트 모드 진입 인터랙션 고도화
- [ ] `npm test` 38개 integrity gate 전수 통과 확인
- [ ] CDP 실측 스크립트 작성 및 390px 뷰포트 검증

---

## 8. [원칙 ⑧] 회고 및 지표 측정 (Review & Metric Sign-off)
- **목표 지표**:
  - PWA 설치 안내 버튼 터치 높이 >= 44px 달성
  - OS 탭 버튼 터치 높이 >= 44px 달성
  - 확인 버튼 터치 높이 >= 44px 달성
  - 모바일 390px 뷰포트 가로 스크롤 넘침 0px (scrollWidth == 390)
