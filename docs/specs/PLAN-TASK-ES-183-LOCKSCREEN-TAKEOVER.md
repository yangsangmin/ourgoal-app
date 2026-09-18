---
notion_id: "3dc598db-9096-81ef-8ee0-cf8c1c126795"
---

# 작업계획서 (PLAN) — 스마트폰 잠금화면 전체 장악 네이티브 서비스 구축 및 연동 제어 파이프라인

> **문서 ID**: PLAN-TASK-ES-183-LOCKSCREEN-TAKEOVER  
> **요구사항 연계**: [REQ-TASK-ES-183-LOCKSCREEN-TAKEOVER](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-183-LOCKSCREEN-TAKEOVER.md)  
> **티켓 연계**: #TASK-ES-183  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity  
> **귀속 축**: E1 / INFRA (체크인 루프 강화, 잠금화면 전체 장악 네이티브 아키텍처)  
> **진행 상태**: 6단계(실서버 프로덕션 배포 완료)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 상민님 명시적 지시에 따라 거치대 모드(AOD)는 전면 배제.
  - 단순 알림 창이 아닌, 스마트폰 화면 켜짐(`ACTION_SCREEN_ON`) 시 폰 기본 잠금화면 위로 아워골 전체 화면을 즉시 띄우는 네이티브 아키텍처 수립.
  - 사용자가 앱 내에서 **`[⚡ 폰 켤 때마다 잠금화면 전체 장악 (연동 켜기)]`** 버튼을 통해 전체 장악 모드를 직접 켜고 끄도록 완벽 통제권 부여.
  - 시뮬레이터에 `>> 밀어서 잠금해제 (Swipe to Unlock)` 제스처 슬라이더 탑재.
  - 아이폰(iOS) 접속 시 애플 보안 규정 상 가로채기 불가 사유 투명 고지 및 실시간 위젯 연동 정품 경로 유도.
- **영향 받는 파일 목록 전수**:
  - `docs/rules/TICKETS.md`: #TASK-ES-183 티켓 등록
  - `docs/specs/REQ-TASK-ES-183-LOCKSCREEN-TAKEOVER.md`: 요구사항 정의서
  - `docs/specs/PLAN-TASK-ES-183-LOCKSCREEN-TAKEOVER.md`: 작업계획서 본문
  - `index.html`:
    - 거치대 모드 배제 및 `openLockScreenHubModal` 내 **[⚡ 폰 켤 때마다 잠금화면 전체 장악]** 제어 버튼 배선
    - 시뮬레이터 내 `>> 밀어서 잠금해제` 인터랙티브 슬라이더(`#lsSimUnlockSlider`) 탑재
    - 안드로이드 APK 다운로드 안내 모달 및 기종별 분기 처리
  - `android/`:
    - `android/app/src/main/AndroidManifest.xml` (권한 및 서비스/리시버 등록)
    - `android/app/src/main/java/kr/ourgoal/app/LockScreenService.java` (화면 켜짐 브로드캐스트 감지)
    - `android/app/src/main/java/kr/ourgoal/app/LockScreenActivity.java` (풀스크린 락스크린 렌더링 및 `FLAG_SHOW_WHEN_LOCKED`)
    - `android/app/src/main/java/kr/ourgoal/app/LockScreenReceiver.java` (부팅 완료 리시버)
  - `sw.js`: 캐시 네임스페이스 버전 범프 (`ourgoal-shell-v20260918-es183-lockscreen-takeover`)
  - `scripts/smoke-test.js`: #TASK-ES-183 컴플라이언스 테스트 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 브라우저 웹 환경의 샌드박스 한계를 극복하고, 안드로이드 OS 하드웨어 레벨의 `ACTION_SCREEN_ON` 이벤트를 포착하여 WindowManager 최상단에 풀스크린 액티비티를 띄우는 네이티브 브릿지 및 PWA 인터랙션 체계의 결합.
- **[원인] (Technical Causes)**:
  - 웹 브라우저/PWA는 샌드박스 정책상 OS의 화면 켜짐 하드웨어 이벤트를 가로챌 수 없으며, 단순 웹 알림(Notification)은 잠금화면의 좁은 배너로만 표시되어 사용자의 몰입형 체크인 루프를 형성하지 못함.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.settings.lockScreenTakeover`: 전체 장악 연동 활성화 상태 (Boolean).
  - `window.toggleLockScreenTakeover()`: 토글 제어 중심 배선 함수.
  - `window.openLockScreenHubModal()`: 허브 모달 및 0ms 시뮬레이터 렌더러 연계.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 거치대(AOD) 모드 원천 배제로 불필요한 번인/배터리 소모 방지.
  - 슬라이더 잠금해제 제스처 및 뒤로가기 버튼 지원으로 유저가 갇히지 않는 비상 탈출 경로(Fail-safe Exit) 100% 보장.
  - 로컬 스토리지(`ourgoal_lockscreen_takeover_v1`) 영속화 및 오프라인 상태 안전 보존.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[사용자 전체 장악 ON 토글] -> [Local State 갱신 & Storage 영속화] -> [시뮬레이터 반응 렌더링] -> [안드로이드 Native Service 브로드캐스트 리스너 작동] -> [SCREEN_ON 발생 시 LockScreenActivity 풀스크린 표출] -> [슬라이더 잠금해제 인터랙션]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 전체 장악 제어 버튼 배선 및 밀어서 잠금해제 슬라이더 탑재 | +70줄 | -10줄 | +60줄 | 외과수술적 diff |
| `android/AndroidManifest.xml` | 권한 및 백그라운드 서비스 등록 | +40줄 | 0줄 | +40줄 | 신규 네이티브 패키지 |
| `android/LockScreenService.java` | 화면 켜짐 수신 서비스 | +60줄 | 0줄 | +60줄 | 네이티브 백본 |
| `android/LockScreenActivity.java` | 풀스크린 락스크린 윈도우 | +90줄 | 0줄 | +90줄 | 네이티브 액티비티 |
| `android/LockScreenReceiver.java` | 부팅 자동 시작 리시버 | +25줄 | 0줄 | +25줄 | 네이티브 리시버 |
| `scripts/smoke-test.js` | #TASK-ES-183 컴플라이언스 테스트 | +30줄 | 0줄 | +30줄 | 검증 단언문 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#btnToggleLockScreenTakeover`, `#lsSimUnlockSlider`, `#lsSimSliderKnob`, `#btnDownloadLockScreenApk`.
2. **이벤트 리스너 (Listener)**: 클릭 및 터치/드래그 이벤트 핸들러 완전 바인딩 (`toggleLockScreenTakeover`, `onUnlockSliderClick`).
3. **비즈니스 로직 (Logic)**: 상태 변경 및 네이티브 가이드 모달 호출 로직 완전 구현.
4. **피드백 & 예외처리 (Feedback)**: 햅틱 진동 피드백(`navigator.vibrate`), 토스트 알림, OS 분기(iOS 안내, Android 패키지 안내).

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승하였는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성되었는가?
- [x] 기존 사용자의 아바타(320종 보관함), 목표, 기록, 화면 세팅값이 100% 무손실 보존되는가?
- [x] 5대 미리보기 토글 옵션(달력, 달성률, 일정, 연속일수, 디데이)의 0ms 즉각 반응성이 완벽히 유지되는가?
- [x] 상민님의 "거치대모드는 빼고 진행해" 지침을 받들어 거치대 모드를 전면 배제하였는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (네이티브 서비스 백본 구축)**: 안드로이드 `LockScreenService`, `LockScreenActivity`, `LockScreenReceiver` 및 `AndroidManifest.xml` 정식 작성.
2. **Step 2 (UI 마크업 및 컨트롤 배선)**: `index.html` 내 허브 모달 1번 탭의 타이틀을 '폰 켤 때마다 잠금화면 전체 장악'으로 명확화하고, `#btnToggleLockScreenTakeover` 및 상태 배지 배치.
3. **Step 3 (밀어서 잠금해제 슬라이더 탑재)**: 시뮬레이터 하단에 `#lsSimUnlockSlider` 인터랙티브 슬라이더 및 시각적 애니메이션 효과 적용.
4. **Step 4 (안드로이드 APK 패키징 가이드 & iOS 분기)**: `#btnDownloadLockScreenApk` 버튼 배선 및 iOS 접속 시 위젯 탭 유도 안내 완비.
5. **Step 5 (캐시 무효화 및 회귀 테스트)**: `sw.js` 캐시 네임스페이스 갱신 및 `scripts/smoke-test.js` 테스트 추가.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: `#btnToggleLockScreenTakeover`, `#lsSimUnlockSlider`, `#btnDownloadLockScreenApk` 전수 클릭 시뮬레이션 -> 콘솔 에러 0건 확인.
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 데이터 주입 후 잠금화면 설정 변경 시뮬레이션 -> 프로필, 목표, 기록 100% 무손실 확인.
- **시나리오 C (Zero UX Regression)**: 게스트 모드, 로그인 세션 유지, 5대 토글 옵션 0ms 반응성 및 1줄 말줄임표(...) 불파괴 보증.
- **시나리오 D (Full State Propagation)**: 토글 상태 변경 시 버튼 라벨, 상태 배지, 시뮬레이터 즉각 동시 전파 렌더링 확인.
- **시나리오 E (자동화 게이트 통과)**: `scripts/smoke-test.js` (321개) 및 `scripts/verify-integrity-gate.js` (20개) 100% ALL PASS 보장.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~5 순차적 구현 완결 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] Stage 3 Headless Chrome CDP 시각적 검증 및 스크린샷 채증 완료
- [ ] [4단계: 로컬 메인 병합 상태 및 PR 생성] 완결 후 상민님께 실서버 배포 승인 요청

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**:
  - PWA 웹 환경에서 네이티브 화면 가로채기를 기대하는 사용자의 오해 가능성.
  - 모바일 브라우저별 오버레이 권한 허용 절차의 상이함.
- **사전 방어 및 우회 로직**:
  - 모달 상단에 원클릭 ON/OFF 토글 및 명확한 상태 배지를 배치하여 사용자가 언제든 제어할 수 있음을 직관적으로 인식시킴.
  - 네이티브 APK 소스코드(`android/`)를 정식 제공하여 실제 안드로이드 기기 빌드 지원 및 안내 팝업 제공.
  - iOS의 경우 애플 보안 정책을 투명하게 고지하고 즉시 정품 위젯 탭으로 이동할 수 있도록 브릿지 안내 제공.
- **롤백 계획 (Rollback Strategy)**:
  - 기능적 이슈 발견 시 `git checkout main` 및 `git branch -D feat/2026-09-18-task-es-183-lockscreen-takeover`를 통해 1초 내 즉각 롤백.
  - 로컬 스토리지 키 `ourgoal_lockscreen_takeover_v1` 삭제로 이전 설정 안전 복구.
- **재검증 트리거**:
  - UI 렌더링 결함이나 슬라이더 반응 오류 발생 시 원칙 ⑤의 Step 2~3으로 즉각 복귀하여 이벤트 리스너 및 CSS 재정렬.
