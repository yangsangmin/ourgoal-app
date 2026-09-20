# 엔지니어링 작업계획서 (PLAN) — [#TASK-ES-192] 아워골 전수 데드클릭 12건 완전 소탕 및 인터랙션 무결성 확립

> **문서 ID**: PLAN-TASK-ES-192-ZERO-DEAD-CLICK-MASS-RESTORATION  
> **요구사항 연계**: [REQ-TASK-ES-192-ZERO-DEAD-CLICK-MASS-RESTORATION](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-192-ZERO-DEAD-CLICK-MASS-RESTORATION.md)  
> **티켓 연계**: #TASK-ES-192  
> **작성 일시**: 2026-09-20  
> **작성자**: Antigravity (세션 11fcefcf)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 전수 정밀 감사를 통해 식별된 12건의 데드클릭, 거짓말 버튼, 무효 링크, 마크업 누락 유령 버튼 전수 소탕 및 런타임 무결성 보증.
- **영향 받는 파일 목록 전수**:
  - `index.html`:
    - #1 동반자 초대 탭 칩 버튼 ID 신설 및 상호 탭 전환 바인딩
    - #2 스마트워치 데이터 매핑 [선택] 버튼에 개별 리스너 직통 결속
    - #3 템플릿 아코디언 토글 버튼 웹 접근성 및 리스너 결속
    - #4 구글 로그인 동적 로더 주입 및 구조 모달 연동
    - #5/#6 소통 카드 피드 공유 및 외부 SNS 공유 인앱 실질 실행 로직 탑재
    - #7 가짜 페이월을 공식 "완전 무료화 헌법 선언" 모달로 승화
    - #9/#10/#11 잇템, 캘린더, 첨부자료 데이터 결손 시 무반응 데드 링크 방어 로직 결속
    - #12 목표 상세 관리 화면 보관함 버튼(`#goalArchiveBtn`) 마크업 복원
  - `js/sanctuary-v3-engine.js`:
    - #8 성소 캘린더 모드 일정 추가 버튼 핸들러 안전 배선
  - `scripts/verify-integrity-gate.js`:
    - [검증 16/16] 12건 데드클릭 소탕 정적 방화벽 게이트 추가
  - `scripts/smoke-test.js`:
    - #TASK-ES-192 회귀 방지 자동화 테스트 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별
- **[본질] (Engineering Essence)**:
  - 사용자가 앱 내 모든 버튼과 링크를 클릭했을 때 침묵하거나 가짜 토스트를 띄우지 않고, 즉각적이고 정직한 실질적 반응(Functional Response)을 제공해야 함 (헌법 제7조 제1항 Zero Dead-Click).
- **[원인] (Technical Causes)**:
  - 마크업에 이벤트 리스너 미결속, 모듈 부재 시 무성의한 '준비 중' 토스트 방치, 데이터 필드 결손 시 빈 href 전락, JS에 기능은 있으나 HTML 마크업에 버튼 ID 누락.
- **[중심 배선] (Core Wire & State)**:
  - 12개 인터랙티브 컴포넌트에 1:1 직통 이벤트 핸들러 및 데이터 안전 검증문 결속.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 유효하지 않은 데이터/URL에 대해 `toast` 또는 `disabled` 방어막 제공, 모듈 미로드 시에도 인앱 기본 배열(`FEED_POSTS_CACHE`) 및 Web API를 통한 100% 무중단 폴백 보장.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- `index.html`: +120줄 / -30줄 (11개 결함 외과수술적 복원)
- `js/sanctuary-v3-engine.js`: +10줄 / -5줄 (성소 일정 추가 모달 안전 결속)
- `scripts/verify-integrity-gate.js`: +25줄 (정적 방화벽 확장)
- `scripts/smoke-test.js`: +25줄 (스모크 테스트 확장)

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Do No Harm)
- 기존 스타일 변수 및 토큰 100% 계승.
- 비파괴 합집합 원칙(제15조 제2항) 엄수.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Execution Plan)
1. **[Step 1]**: 순수 데드클릭 3건 해결 (#1, #2, #3)
2. **[Step 2]**: 유령 버튼 1건 해결 (#12 `#goalArchiveBtn` 복원)
3. **[Step 3]**: 거짓말 버튼 5건 해결 (#4, #5, #6, #7, #8)
4. **[Step 4]**: 데이터 결손 데드 링크 3건 방어 (#9, #10, #11)
5. **[Step 5]**: 방화벽 게이트 및 스모크 테스트 배선, 전수 재감사

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Verification Scenarios)
- **시나리오 A (Zero Dead-Click)**: 정적/동적 버튼 및 링크 전수 클릭 시 런타임 무반응 0건
- **시나리오 B (Zero Empty Promise)**: "준비 중", "지원 예정" 거짓말 토스트 0건
- **시나리오 C (Zero Regression)**: 기존 330개 단위 테스트 100% 통과
- **시나리오 D (Full State Propagation)**: 피드 공유 시 4대 뷰 동시 반영
- **시나리오 E (Gatekeeper Verification)**: 31개 무결성 게이트 ALL PASS

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Milestone & Gate Checklist)
- [x] 1단계: 기획·설계 상태 (REQ/PLAN 수립 완료)
- [x] 2단계: 내부 시뮬레이션 상태 (코드 구현 완료)
- [ ] 3단계: 로컬 수동 확인 상태 (전수 재감사 0건 입증 및 모바일 375px CDP 실측)
- [ ] 4단계: 로컬 메인 병합 상태
- [ ] 5단계: Vercel 프리뷰 배포

---

## 8. [원칙 ⑧] 본질 검증 프로토콜 (Live Acceptance Protocol)
- 전수 재감사 스크립트 실행 결과를 표로 작성하여 상민님께 실측 보고한다.
