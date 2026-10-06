# 차기 묶음 분열 계획 (Batch Next Plan) - 예비 검토안

> [!IMPORTANT]
> **설계 소유권 및 착수 제한 공지 (Ownership & Non-execution Policy)**:
> 1. **정본 설계 소유권**: 차기 분열 계획의 정본 설계 및 아키텍처 확정은 TASK-579 조사담당 세션이 전담합니다.
> 2. **미확인 후보 명시**: 아래 기술된 후보군(아바타 레벨 배지 UI, 구글 OAuth 키트, 퀵 체크인 빌더 및 수치 추정)은 사전 기술성 검토를 위한 **미확인 후보(Unverified Candidates)**입니다.
> 3. **실행 절대 금지**: 상민님의 명시적 승인 및 주관 세션의 최종 확정 지시가 전달되기 전까지 다음 제품의 분열 착수 및 코드 수정을 엄격히 금지합니다.

---

## 1. 개요 및 묶음 원칙 (검토 기준)
- **목표**: 동일 기준 커밋(`b87cf99e` 이후 최신 `origin/main`)에서 여러 단일책임 원문을 하나의 PR 후보로 묶어 분열함으로써 기준2회·작업1회 탭 촬영(136장) 및 전체 테스트 스위트(115개) 실행 비용 절감 방안을 검토한다.
- **불변 원칙**:
  - 세포별 파일 800줄 이하 엄수 (헌법 제3조 제9항)
  - 원래 코드 손수정 0 · 접두(`L.`, `_kit`) 외 변경 0 · 기능 동작 변경 0 · 시험 단언/기대값 변경 0
  - 기존 생성기 `gen-inline-hard.js` 및 검증기 `verify-inline-hard.js` 규격 준수
  - 제품 코드와 관련 없는 독립 증명은 동일 입력 해시 하에서 재사용 허용

## 2. 차기 묶음 예비 후보군 (미확인 후보 — 실행 보류)
기준: `index.html` 잔여 66개 인라인 함수 중 독립성이 높고 키트 이음매가 명확한 3개 책임 예비 선별:

1. **[미확인 후보 1] 아바타 레벨 배지 (`avatar/level-badge`)**
   - 대상 함수: `hasUserCustomizedAvatar` (3504줄), `levelBadgeHtml` (3514줄), `renderLevelBadge` (3564줄)
   - 대상 파일: `js/avatar/level-badge.js`
   - 예상 이동 줄 수: ~95줄
   - 키트: `OurgoalAvatar` (`js/avatar/index.js` 뒤 삽입)
   - 실제 UI 조작 경로: 홈 화면 진입 시 상단 레벨 배지 렌더링 (`#userLevelBadge`)
   - 상태: *TASK-579 조사담당 검토 대기 (미확인)*

2. **[미확인 후보 2] 구글 OAuth 클라이언트 헬퍼 (`core/google-auth-client`)**
   - 대상 함수: `sha256Hex` (3736줄), `parseJwtPayload` (3756줄), `handleGoogleUserSuccess` (3770줄), `getGoogleTokenClient` (3849줄), `startGoogleLogin` (3888줄), `initGoogleOneTap` (3940줄), `startOAuthLogin` (3975줄)
   - 대상 파일: `js/core/google-auth-client.js`
   - 예상 이동 줄 수: ~260줄
   - 키트: `OurgoalAccountIsolation` (`js/core/supabase-auth.js` 뒤 삽입)
   - 실제 UI 조작 경로: 설정 탭 로그인/연동 모달 (`#googleLoginBtn`)
   - 상태: *TASK-579 조사담당 검토 대기 (미확인)*

3. **[미확인 후보 3] 빠른 기록 캡처 및 생성 (`records/quick-checkin-builder`)**
   - 대상 함수: `buildCheckinRecord` (4382줄), `saveQuickCheckin` (4402줄)
   - 대상 파일: `js/tabs/records/quick-checkin.js`
   - 예상 이동 줄 수: ~120줄
   - 키트: `OurgoalRecordsKit` (`js/tabs/records/checkin-capture.js` 뒤 삽입)
   - 실제 UI 조작 경로: 홈 탭 오늘 미션 빠른 체크인 칩 클릭
   - 상태: *TASK-579 조사담당 검토 대기 (미확인)*

## 3. 검증 전략 분리 (검토안)
### 3.1 공통 검증 (묶음 전체 1회)
- 6대 탭 전체 격리 촬영 (`tab-isolated` 136장) 기준 2회 / 작업 1회
- 전체 단위 테스트 및 회귀 스위트 (`test-compare-inline-p2.js` 115개 파일) 전후 비교
- `npm test` (스모크 440 + 무결성 게이트 38 + 전수 클릭 918 + 쉽야드 모듈 180)

### 3.2 세포별 개별 검증
- 세포별 `verify-inline-hard.js`: 토큰 보존, 잔여 일치, 누수 0, 800줄 이하
- 세포별 `court/probes/module-load.js` (`loadOne` 격리 실행)
- 세포별 CDP 프로파일러 실제 호출 및 분기 측정 (각 세포의 실제 기능 트리거 1회 이상)

## 4. 예상 장애 및 제외 대상 (별도 추적)
- **944줄 거대 함수 및 복합 상태 공유 함수**:
  - `renderCalendarScreen` 또는 `renderRecordsScreen` 내부의 대규모 DOM 직조 함수는 단일 800줄 상한을 초과할 위험이 있으므로 이번 묶음에서 제외하고 별도 서브블록 분할 선행.
  - 새 구조 설계나 데이터 스키마 변경이 필요한 항목은 단일 원문 분열 묶음에 포함하지 않음.
