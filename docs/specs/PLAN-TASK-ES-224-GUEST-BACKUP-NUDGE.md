# 엔지니어링 작업계획서 (PLAN) — 게스트(둘러보기) 3회 기록 시 안전 백업 넛지 및 1클릭 카카오 계정 무손실 병합

> **문서 ID**: PLAN-TASK-ES-224-GUEST-BACKUP-NUDGE  
> **요구사항 연계**: [REQ-TASK-ES-224-GUEST-BACKUP-NUDGE](REQ-TASK-ES-224-GUEST-BACKUP-NUDGE.md)  
> **티켓 연계**: #TASK-ES-224  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity 온보딩 리텐션 & 무손실 마이그레이션 아키텍트  
> **규범 준수**: OURGOAL_ABSOLUTE_INTEGRITY_RULES 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 게스트 모드(`isGuest` 또는 `state.profile.id.indexOf("guest") === 0`)에서 누적 체크인/기록이 3회 이상에 도달했을 때, 카카오 1클릭 안전 백업 넛지 바텀시트를 호출하고, 전환 시 단 1바이트의 유실도 없는 100% 무손실 비파괴 합집합(Union Merge) 데이터 통합을 보장함.
- **영향 받는 파일 목록 전수**:
  - `docs/rules/TICKETS.md`: #TASK-ES-224 티켓 등록 및 상태 관리
  - `docs/specs/REQ-TASK-ES-224-GUEST-BACKUP-NUDGE.md`: 요구사항 정의서
  - `docs/specs/PLAN-TASK-ES-224-GUEST-BACKUP-NUDGE.md`: 작업계획서
  - `reports/TASK-ES-224/claims.json`: 법정 5대 검증 청구서
  - `index.html`:
    - `checkGuestBackupNudge()`: 게스트 3회 달성 감지 트리거 함수 구현
    - `openGuestBackupNudgeModal()`: 375px 모바일 최적화 백업 넛지 바텀시트 마크업 및 핸들러 배선
    - `#btnGuestBackupKakao`, `#btnGuestBackupLater` 2대 버튼 12ms 햅틱 및 카카오 연동 배선
    - `saveQuickCheckin` 및 체크인 완료 지점에 400ms 지연 호출 배선
    - 게스트 프로필 최신 스냅샷 저장 및 `restoreSessionAndEnter` 무손실 병합 연동 강화
  - `scripts/smoke-test.js`: TASK-ES-224 스모크 테스트 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 게스트 사용자의 의미 있는 3회 실천 행동에 즉각 반응하여 안전한 카카오 영구 보관으로 1초 만에 무손실 마이그레이션하는 리텐션 훅 파이프라인.
- **[원인] (Technical Causes)**:
  - 기존에는 게스트 여부 및 누적 기록 수(3회)를 감지하는 적시 트리거와 안내 바텀시트가 부재하여, 게스트 상태로 머물다 브라우저 초기화 시 유실될 위험이 상존함.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.records`: 누적 기록 수 파악 (`length >= 3`)
  - `state.profile.id` / `state.user`: 게스트 모드 판별
  - `localStorage.getItem("ourgoal_guest_profile")`: 전환 직전 완벽 스냅샷 저장
  - `sessionStorage.getItem("ourgoal_guest_backup_nudged")`: 세션 내 중복 방지 플래그
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 카카오 OAuth 진입 직전 현재 게스트 `state.profile`을 즉시 직렬화하여 영속화하고, `restoreSessionAndEnter`에서 `sb.from("goals").upsert`, `sb.from("checkins").upsert`로 신규 UID에 무손실 비파괴 합집합(Union Merge) 보장.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[게스트 3회 체크인 완료] -> [checkGuestBackupNudge() 트리거] -> [openGuestBackupNudgeModal() 바텀시트 표출] -> [btnGuestBackupKakao 클릭 (12ms 햅틱)] -> [게스트 프로필 스냅샷 저장] -> [startOAuthLogin("kakao")] -> [복귀 후 restoreSessionAndEnter()] -> [무손실 비파괴 합집합 병합 & 4대 뷰 동시 전파]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `docs/rules/TICKETS.md` | #TASK-ES-224 등록 | +1줄 | 0줄 | +1줄 | 규범 문서 |
| `index.html` | 백업 넛지 모달, 트리거 및 마이그레이션 보강 | +90줄 | 0줄 | +90줄 | 외과수술적 추가 |
| `scripts/smoke-test.js` | 회귀 방지 검증 단언문 추가 | +20줄 | 0줄 | +20줄 | 테스트 보강 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**:
   - 바텀시트 내 `#btnGuestBackupKakao`, `#btnGuestBackupLater` 고유 ID 부여 및 375px 반응형 스타일링.
2. **이벤트 리스너 (Listener)**:
   - 각 버튼에 명시적 click 이벤트 리스너 배선.
3. **비즈니스 로직 (Logic)**:
   - `triggerHapticFeedback(12)` 미세 햅틱 진동.
   - 게스트 프로필 스냅샷 영속화 후 `startOAuthLogin("kakao")` 안전 개시.
4. **피드백 & 예외처리 (Feedback)**:
   - 백업 닫기 시 안내 토스트 표출, 로그인 복귀 시 환영 축하 토스트 표출.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 로그인 사용자의 세션 및 데이터에 영향을 주지 않도록 `isGuest` 게이트키퍼를 배치했는가?
- [x] 비파괴 합집합 원칙을 준수하여 게스트 데이터와 계정 데이터 병합 시 기존 데이터 유실이 0%인가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `docs/rules/TICKETS.md`에 #TASK-ES-224 등록.
2. **Step 2**: `reports/TASK-ES-224/claims.json` C1~C5 검증 청구서 작성.
3. **Step 3**: `index.html`에 `openGuestBackupNudgeModal()` 및 `checkGuestBackupNudge()` 구현.
4. **Step 4**: `saveQuickCheckin` 끝부분에 `checkGuestBackupNudge()` 연동 (체크인 완료 피드백 후 400ms 후 실행).
5. **Step 5**: `scripts/smoke-test.js`에 검증 단언문 추가.
6. **Step 6**: `npm test` 및 무결성 게이트 검증.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: `#btnGuestBackupKakao` 및 `#btnGuestBackupLater` 클릭 시 콘솔 에러 0건 및 12ms 햅틱 작동 검증.
- **시나리오 B (Zero Data Loss)**: 게스트 상태에서 작성된 3건의 실천 기록이 카카오 연동 후 신규 계정에 비파괴 합집합(Union Merge)으로 100% 보존됨을 검증.
- **시나리오 C (Zero UX Regression)**: 일반 로그인 사용자가 체크인할 때 백업 넛지가 노출되지 않음을 검증.
- **시나리오 D (Full State Propagation)**: 계정 마이그레이션 완료 후 `dispatchFullViewPropagation()`을 통해 4대 뷰가 즉시 갱신됨을 확인.
- **시나리오 E (자동화 게이트 통과)**: `scripts/smoke-test.js` 및 `verify-integrity-gate.js` 100% ALL PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] PR 생성 및 Notion [94] 상태 완료 업데이트

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 카카오 OAuth 시작 실패 시(앱 미인가 환경 등) 모달이 닫히며 멈추는 현상 -> **대책**: `startOAuthLogin` 내부에 이미 닉네임/이메일 폴백 모달이 내장되어 있어 안전하게 연결됨.
- **롤백 계획 (Rollback Strategy)**: `git checkout -- index.html`로 변경사항 즉시 원복 가능.
- **재검증 트리거**: 게스트 3회 체크인 후 넛지 모달이 뜨지 않을 경우 조건문(`isGuest`, `records.length >= 3`) 재검증.
