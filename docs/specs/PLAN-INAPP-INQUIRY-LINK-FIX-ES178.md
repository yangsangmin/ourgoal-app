# 엔지니어링 작업계획서 (PLAN) — 설정 탭 1:1 고객 문의 링크 무반응 결함 수술 및 4위1체 리스너·글로벌 스코프 배선

> **문서 ID**: PLAN-INAPP-INQUIRY-LINK-FIX-ES178  
> **티켓 연계**: #TASK-ES-178  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity AI Engine (Session 6248f4d3)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)
- **REQ 핵심 요약**: 설정 탭 푸터의 `footInquiryLink`가 `openCustomerInquiryModal`의 비전역 스코프로 인해 무반응하던 결함을 해결하고, 4위 1체 리스너 등록 및 `window` 전역 노출을 완결함.
- **영향받는 파일 전수 목록**:
  1. `index.html`: 푸터 마크업 및 이벤트 리스너 배열, window 전역 노출.
  2. `scripts/smoke-test.js`: `footInquiryLink` 리스너 및 전역 바인딩 단언문.
  3. `docs/specs/REQ-INAPP-INQUIRY-LINK-FIX-ES178.md`: 8원칙 요구사항 정의서.
  4. `docs/specs/PLAN-INAPP-INQUIRY-LINK-FIX-ES178.md`: 8원칙 작업계획서.
  5. `.Codex/작업계획서/6248f4d3.md`: 세션 작업계획서.
  6. `docs/rules/TICKETS.md`: 티켓 현황 갱신.

---

## 2. [원칙 ②] 본질 · 중심 배선(Wire) 식별 (Essence & Core Wiring)
- **[본질] (Essence)**: 단순 링크 태그라도 완전한 이벤트 리스너와 전역 접근성을 갖추어 언제 어디서든 안정적으로 모달을 열 수 있도록 보장하는 것.
- **[원인] (Root Causes)**: 인라인 `onclick`의 전역 스코프 의존성과 리스너 등록 누락.
- **[중심] (Core Wiring)**:
  `[사용자 footInquiryLink 클릭] -> [addEventListener(preventDefault)] -> [openCustomerInquiryModal()] -> [openModal() DOM Sheet 마운트] -> [/api/inquiry 접수]`
- **[핵심] (Anchor)**: 다른 세션의 원격 main 배포를 교란하지 않도록 격리 브랜치와 로컬 검증에서 안전하게 대기하는 것.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **파일별 변경 예산**:
  - `index.html`: +4줄 / -2줄 (외과수술적 최소 변경)
  - `scripts/smoke-test.js`: +12줄 / -0줄
- **4위 1체 배선 명세**:
  - 마크업: `id="footInquiryLink"`
  - 리스너: `document.getElementById('footInquiryLink').addEventListener('click', ...)`
  - 비즈니스 로직: `openCustomerInquiryModal()` 및 `window.openCustomerInquiryModal`
  - 피드백: 모달 시트 오픈 및 토스트

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Review & Non-Destruction)
- 기존 설정 탭 기능(회원 탈퇴, 로그아웃, 데이터 초기화, 가이드 허브)에 일체 영향 없음.
- 기존 `feedbackInquiryBtn` 클릭 시 동작도 100% 동일하게 유지.
- 10종 페르소나 데이터 무손실 보존.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `index.html` 952번 라인의 인라인 `onclick` 제거 및 시맨틱 보강:
   `<div>문의 <a href="javascript:void(0)" id="footInquiryLink">1:1 문의 / 오류 제보</a></div>`
2. **Step 2**: `index.html` 3720번 라인 리스너 배열 수정:
   `['feedbackInquiryBtn', 'footInquiryLink'].forEach(function(id){ ... })`
3. **Step 3**: `openCustomerInquiryModal` 및 `showLegalModal` 함수 정의 후 `window` 노출:
   `window.openCustomerInquiryModal = openCustomerInquiryModal;`
4. **Step 4**: `scripts/smoke-test.js` 단언문 추가.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Verification Scenarios)
- **전수 클릭 검증 (Zero Dead-Click)**: 로컬 브라우저에서 `footInquiryLink`를 실제 클릭하여 모달 시트가 정상 열리는지 검증.
- **절차 수정사항**: 단일 스코프 누락 방지를 위해 `window.openCustomerInquiryModal` 바인딩을 이중 배치.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Execution Checklist)
- [x] 1단계: REQ 및 PLAN 수립, Codex 작업계획서 작성
- [ ] 2단계: `index.html` 외과수술적 수정 및 `smoke-test.js` 단언문 추가
- [ ] 3단계: 로컬 테스트 (`npm test` 및 `verify-integrity-gate.js` ALL PASS)
- [ ] 4단계: CDP 헤드리스 브라우저 실클릭 스크린샷 증빙 캡처
- [ ] 5단계: 격리 브랜치 푸시 및 GitHub PR 생성 (상민님께 보고 후 대기)

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Blockers & Rollback)
- **잠재 오류**: 다른 세션과의 파일 충돌 발생 시.
- **롤백 절차**: `git checkout index.html`로 즉각 단일 파일 롤백 가능.
