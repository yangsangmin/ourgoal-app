# 작업계획서 (PLAN) — 아이폰 iOS Safari 및 안드로이드 홈화면 추가 3초 가이드 고도화 & 게스트 모드 진입 시 마찰 제로화

> **문서 ID**: PLAN-TASK-ES-138-PWA-GUEST-FRICTIONLESS  
> **티켓 연계**: #TASK-ES-138  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity Core Engine  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정의 및 대상 식별 (Definition & Target)
- **대상 과제**: #TASK-ES-138 ([온보딩/PWA] 아이폰 iOS Safari 및 안드로이드 홈화면 추가 3초 가이드 고도화 & 게스트 모드 진입 시 마찰 제로화)
- **해결 대상 파일**:
  1. `ui.css`: `.pwa-guide-action-btn`, `.btn-pwa-os-tab` 44px 모바일 터치 토큰 및 터치 조작 최적화.
  2. `index.html`: 설정 탭 `#btnPwaInstallGuide` 클래스 부여, `openPwaInstallGuideModal` 내 UserAgent 기반 iOS/Android 자동 분기, 랜딩 화면 `#btnLandingPreviewDirect` 햅틱 및 마찰 제로화.
  3. `docs/rules/TICKETS.md`: 티켓 상태 대장 동기화.
  4. `reports/TASK-ES-138/`: claims.json, scenarios, pr-body.md, TASK-ES-138.md 생성.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 기준 수립 (Standards & Core Mechanics)
- **[본질] (Essence)**: 앱스토어 다운로드라는 높은 마찰 없이도 유저 기기(iOS/Android)에 최적화된 3초 카드뉴스를 통해 스마트폰 바탕화면에 앱 아이콘을 바로 등록하게 만들고, 게스트 모드 0초 진입을 통해 즉각적인 실천 가치를 체감시키는 무마찰 온보딩.
- **[원인] (Root Causes)**:
  1. 기기 UserAgent 분석 부재로 안드로이드 사용자에게도 iOS 탭이 기본 노출되는 인지 부조화.
  2. 설정 화면 PWA 안내 버튼이 38px로 모바일 44px 최소 터치 타깃에 미달했던 점.
  3. 게스트 진입 버튼 클릭 시 햅틱 피드백 부재 및 비-PWA 브라우저 환경에서의 어포던스 부족.
- **[중심 배선] (Core Bottleneck & Connection)**: `openPwaInstallGuideModal` 내 OS 플랫폼 자동 감지 (`/Android/i.test(navigator.userAgent)` 판별), `.pwa-guide-action-btn` 44px 터치 높이 보장, `#btnLandingPreviewDirect` 12ms 햅틱 및 즉각 앱 셸 전환.
- **[핵심 안전장치] (Critical Safety & Boundary)**:
  - 기기 감지 오류 시 기본 'ios' 탭 안전 폴백.
  - 기존 세션 및 게스트 프로필 로컬 캐시(`ourgoal_guest_profile`) 무손실 보존.
  - 모바일 390px 뷰포트 가로 스크롤 넘침(scrollWidth > 390) 0px 방어.

---

## 3. [원칙 ③] 아키텍처 및 세부 설계 (Architecture & Detail)

### 3-1. 스토리지 원장화 3대 명세 (Storage & Ledger Specification)
- **1호 (원격 DB 스키마 명세)**: 게스트 상태는 로컬 스토리지에 유지되며, 소셜 로그인 전환 시 Supabase `profiles` 테이블로 안전 이관.
- **2호 (스마트 스토리지 분기 설계)**: PWA 가이드 확인 플래그 `ourgoal_pwa_guide_viewed` 로컬 영속화.
- **3호 (4대 뷰 전파 배선도)**: 게스트 입장 시 `enterApp()` -> `renderAll()`, `renderHome()`, `renderRecordsScreen()` 원자적 호출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click UI/UX Matrix)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#btnLandingPreviewDirect` | 랜딩 화면 | 클릭/터치 | 게스트 프로필 생성 후 앱 셸 즉시 진입 | 12ms 햅틱 피드백 |
| `#btnPwaInstallGuide` | 설정 탭 | 클릭/터치 | 기기 OS 자동 감지 후 3초 PWA 카드뉴스 모달 오픈 | 12ms 햅틱 |
| `#btnPwaOsIos` | PWA 가이드 모달 | 클릭/터치 | iOS Safari 3단계 카드뉴스 전환 | 12ms 햅틱 |
| `#btnPwaOsAndroid` | PWA 가이드 모달 | 클릭/터치 | Android Chrome 3단계 카드뉴스 전환 | 12ms 햅틱 |
| `#btnConfirmPwaInstall` | PWA 가이드 모달 | 클릭/터치 | 모달 닫기 및 로컬 플래그 저장 | 12ms 햅틱 및 안내 토스트 |
| `#btnClosePwaGuide` | PWA 가이드 모달 | 클릭/터치 | 모달 닫기 | 부드러운 닫힘 애니메이션 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Ledger)
- **프로필 보존**: 게스트 모드에서 생성한 체크인/목표/스트릭 데이터 100% 보존.
- **PWA 안내 상태 보존**: 확인 상태 로컬 메모리 보존.

---

## 4. [원칙 ④] 구현 작업 분할 및 안전망 (Task Division & Fallback)
- **Task 1: 디자인 토큰 및 CSS 확장 (`ui.css`)**:
  - `.pwa-guide-action-btn`: min-height 44px, touch-action manipulation, font-weight 700.
  - `.btn-pwa-os-tab`: min-height 44px, touch-action manipulation.
- **Task 2: OS 감지 및 인터랙션 배선 (`index.html`)**:
  - `openPwaInstallGuideModal()`: `navigator.userAgent` 분석하여 iOS/Android 탭 자동 스위칭.
  - `#btnPwaInstallGuide`에 `.pwa-guide-action-btn` 적용.
  - `#btnLandingPreviewDirect` 클릭 시 12ms 햅틱 트리거.
- **Task 3: 회귀 방화벽 및 스모크 테스트**:
  - `npm test` 38개 무결성 게이트 및 948개 데드클릭 0건 검증.

---

## 5. [원칙 ⑤] 단계별 테스트 및 검증 시나리오 (Verification & Scenarios)
1. **단위/정적 테스트**:
   - `npm test`: 440개 스모크 테스트 및 38개 무결성 게이트 통과.
2. **CDP 모바일 390px 실측**:
   - `scratch/verify_es138_cdp.js`:
     - 랜딩 화면 `#btnLandingPreviewDirect` 클릭 및 게스트 모드 입장.
     - 설정 탭 이동 후 `#btnPwaInstallGuide` 너비/높이 실측 (min-height >= 44px).
     - `#btnPwaInstallGuide` 클릭 시 모달 오픈 및 OS 감지 확인.
     - `#btnPwaOsIos`, `#btnPwaOsAndroid` 44px 터치 높이 실측.
     - `#btnConfirmPwaInstall` 44px 터치 높이 실측.
     - 뷰포트 너비 390px 가로 스크롤 0px 확인.
     - `step3_es138_pwa_guest_verified.png` 캡처 저장.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 및 단일 실패점(SPOF) 방어
- **단일 실패점 방어**: `navigator` 객체나 `userAgent`가 비정상적인 환경에서도 기본 'ios' 탭으로 폴백하여 에러 크래시 원천 차단.
- **롤백 대책**: 문제 발생 시 `git revert`로 즉각 복구 가능하도록 원자적 커밋 구성.

---

## 7. [원칙 ⑦] 작업 소요 자원 및 위험도 평가 (Resources & Risk)
- **작업 소요 시간**: 약 15분.
- **위험도**: 낮음 (기존 세션 및 PWA 구조 100% 보존).
- **영향 범위**: 랜딩 둘러보기 버튼 및 설정 탭 PWA 안내 모달.

---

## 8. [원칙 ⑧] 실행 일정 및 체크리스트 (Schedule & Checklist)
- [ ] `ui.css` 44px 스타일 토큰 배선
- [ ] `index.html` OS 감지 및 PWA 버튼 클래스 적용
- [ ] `npm test` 검증
- [ ] CDP 실측 및 스크린샷 획득
- [ ] `dev_log.md` 및 `reports/TASK-ES-138/` 작성
- [ ] Git commit & push
- [ ] GitHub PR 생성 및 Court 검사 청구
- [ ] 법정 판정 확인 후 squash merge
- [ ] Tri-Sync 100% 동기화
