# 엔지니어링 작업계획서 (PLAN) — 음성 마이크(STT) 클릭 시 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 배선

> **문서 ID**: PLAN-TASK-ES-227-STT-PERMISSION-MODAL  
> **요구사항 연계**: [REQ-TASK-ES-227-STT-PERMISSION-MODAL](REQ-TASK-ES-227-STT-PERMISSION-MODAL.md)  
> **티켓 연계**: #TASK-ES-227  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity 웹 하드웨어 API & 음성 인터페이스 스페셜리스트  
> **규범 준수**: OURGOAL_ABSOLUTE_INTEGRITY_RULES 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 마이크 권한 차단 상태에서 마이크 버튼 클릭 시 침묵 먹통(Dead-Click) 현상을 박멸하고, iOS Safari 및 Android Chrome 브라우저별 3컷 일러스트 허용 가이드 모달과 1터치 재시도/텍스트 폴백을 제공.
- **영향 받는 파일 목록 전수**:
  - `docs/rules/TICKETS.md`: #TASK-ES-227 등록
  - `docs/specs/REQ-TASK-ES-227-STT-PERMISSION-MODAL.md`: 요구사항 정의서
  - `docs/specs/PLAN-TASK-ES-227-STT-PERMISSION-MODAL.md`: 작업계획서
  - `reports/TASK-ES-227/claims.json`: 법정 5대 검증 청구서
  - `index.html`:
    - `openMicPermissionGuideModal(context)` 모달 생성 및 3컷 일러스트 렌더링
    - iOS/Android 탭 스위처(`#btnTabIosSafari`, `#btnTabAndroidChrome`) 및 플랫폼 자동 감지
    - 재시도(`#btnRetryMicPermission`), 텍스트 폴백(`#btnFallbackToText`), 닫기(`#btnCloseMicGuide`) 배선
    - `setupVoiceCheckin`의 권한 에러 핸들러 및 `openVoiceTableModal` 에러 핸들러에 직결
  - `scripts/smoke-test.js`: TASK-ES-227 검증 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 브라우저 보안 제약 속에서도 사용자에게 침묵 결함(Silent Failure)을 주지 않고, iOS Safari와 Android Chrome 환경에 최적화된 3컷 시각 가이드와 1터치 재시도/텍스트 폴백을 제공하여 음성 체크인 루프를 무저항으로 완주시키는 하드웨어 안전 인터페이스.
- **[원인] (Technical Causes)**:
  - `SpeechRecognition`의 `onerror` 핸들러에서 권한 거부 시 단순 토스트만 띄우고 브라우저 설정 안내 모달이 부재했음.
- **[중심 배선] (Core Wire & State)**:
  - `openMicPermissionGuideModal(context)`: 3컷 시각 가이드 모달 디스패처
  - `#btnTabIosSafari` & `#btnTabAndroidChrome`: 플랫폼 탭 스위처
  - `#btnRetryMicPermission` & `#btnFallbackToText`: 1터치 복구 파이프라인
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `captureInput` 작성 내용 무손실 유지, 12~15ms 미세 햅틱, 미지원 브라우저 텍스트 포커스 안전 폴백.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[micBtn 클릭] -> [SpeechRecognition 에러 or 권한 denied] -> [openMicPermissionGuideModal] -> [플랫폼 자동 감지 & 3컷 가이드] -> [재시도 or 텍스트 입력 폴백] -> [체크인 완주]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `docs/rules/TICKETS.md` | #TASK-ES-227 등록 | +1줄 | 0줄 | +1줄 | 규범 문서 |
| `index.html` | 마이크 권한 모달 및 에러 핸들러 배선 | +115줄 | -3줄 | +112줄 | 기능 추가 |
| `scripts/smoke-test.js` | 회귀 방지 검증 단언문 | +24줄 | 0줄 | +24줄 | 테스트 보강 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**:
   - `#micPermissionGuideModal`, `#btnTabIosSafari`, `#btnTabAndroidChrome`, `#btnRetryMicPermission`, `#btnFallbackToText`, `#btnCloseMicGuide`
2. **이벤트 리스너 (Listener)**:
   - 탭 스위처 클릭, 재시도 클릭, 텍스트 전환 클릭 바인딩
3. **비즈니스 로직 (Logic)**:
   - 플랫폼 판별(`isIos`), 마이크 권한 재요청(`getUserMedia`), `captureInput.focus()`
4. **피드백 & 예외처리 (Feedback)**:
   - 12~15ms 햅틱, 단계별 시각 일러스트, 닫기 애니메이션

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 정상 음성 권한을 가진 유저의 체크인 프로세스를 손상시키지 않는가?
- [x] 전체 파일 덮어쓰기 없이 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 375px 모바일 반응형과 44px 이상 터치 타깃을 충족했는가?
- [x] 콘솔 에러 0건 및 침묵 결함 0건을 보증하는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `docs/rules/TICKETS.md`에 #TASK-ES-227 등록.
2. **Step 2**: `reports/TASK-ES-227/claims.json` C1~C5 작성.
3. **Step 3**: `openMicPermissionGuideModal` 함수 구현.
4. **Step 4**: `setupVoiceCheckin` 및 `openVoiceTableModal` 권한 에러 연동.
5. **Step 5**: `scripts/smoke-test.js` 단언문 추가.
6. **Step 6**: `npm test` 및 무결성 게이트 검증.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: `#btnTabIosSafari`, `#btnTabAndroidChrome`, `#btnRetryMicPermission`, `#btnFallbackToText`, `#btnCloseMicGuide` 클릭 시 콘솔 에러 0건 확인.
- **시나리오 B (Zero Data Loss)**: 모달 진입/종료 후 `#captureInput` 텍스트 100% 보존 확인.
- **시나리오 C (Zero UX Regression)**: 정상 환경 음성 인식 및 음성 표 입력 온전성 확인.
- **시나리오 D (Cross-Platform Flexibility)**: iOS/Android 탭 전환 시 안내 카드 정확 스위칭 확인.
- **시나리오 E (자동화 게이트 통과)**: `npm test` 및 `verify-integrity-gate.js` 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~6 순차적 완결
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] PR 생성 및 Notion [97] 완료 갱신

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: `navigator.permissions` 미지원 환경에서 크래시 발생 가능 -> **대책**: `try-catch` 래핑 및 `onerror` 중심 2중 안전 트리거 설계.
- **롤백 계획 (Rollback Strategy)**: `git checkout -- index.html` 즉시 원복.
- **재검증 트리거**: 권한 거부 시 모달 미노출 발생 시 즉시 원칙 ⑤로 회귀.
