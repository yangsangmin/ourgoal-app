# 엔지니어링 작업계획서 (PLAN) — DM창 타 유저 클릭 시 키보드 자동 팝업 방지 및 텍스트창 터치 시 오픈으로 변경

> **문서 ID**: PLAN-TASK-ES-279-DM-KEYBOARD-AUTOFOCUS-FIX  
> **요구사항 연계**: [REQ-TASK-ES-279-DM-KEYBOARD-AUTOFOCUS-FIX](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-279-DM-KEYBOARD-AUTOFOCUS-FIX.md)  
> **티켓 연계**: #TASK-ES-279  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: DM 대화방 입장 시 키보드 자동 팝업 방지, 텍스트창 터치 시 오픈 메커니즘 보증, 4위 1체 직통 핸들러 배선 및 4대 뷰 동시 전파 완결.
- **영향 받는 파일 목록 전수**:
  - `js/team-invite-comm.js`: `handle소통_Item28Action` 직통 핸들러 구현 및 대화창 포커스 제어.
  - `index.html`: 소통 탭 내 `#og-task-28-container` 마크업 마운트.
  - `ui.css`: 모바일 375px 44px 터치 규격 및 고대비 반응형 스타일.
  - `tests/dm-keyboard-autofocus-fix.test.js`: 신규 단위 테스트 스위트.
  - `scripts/smoke-test.js`: #TASK-ES-279 스모크 단언문 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 모바일 뷰포트 시야 확보를 위한 입력창 포커스 이벤트 격리 및 사용자 제어권 보장.
- **[원인] (Technical Causes)**: 대화방 렌더링 시 포커스 제어 명시성 부재 및 검증 가능한 직통 액션 부재.
- **[중심 배선] (Core Wire & State)**:
  - `state.dmActiveId`: 활성 대화방 ID 동기화.
  - `og_task-28_cache`: 로컬 스토리지 캐시 영속화.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 4대 뷰 동시 전파(`dispatchFullViewPropagation`), 12ms 햅틱, 디바운스 버튼 잠금.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[UI 액션 터치] -> [12ms 햅틱 & 디바운스] -> [캐시 원자적 갱신] -> [4대 뷰 동시 전파] -> [토스트 피드백]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/team-invite-comm.js` | 직통 핸들러 및 포커스 억제 로직 | +80줄 | 0줄 | +80줄 | 모듈화 |
| `index.html` | 마크업 배선 | +15줄 | 0줄 | +15줄 | 외과수술적 |
| `ui.css` | 반응형 스타일 | +70줄 | 0줄 | +70줄 | CSS 토큰 준수 |
| `tests/dm-keyboard-autofocus-fix.test.js` | 단위 테스트 | +110줄 | 0줄 | +110줄 | 테스트 신설 |
| `scripts/smoke-test.js` | 스모크 단언문 | +20줄 | 0줄 | +20줄 | 회귀 방지 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#og-task-28-container`, `#og-task-28-action-btn`
2. **이벤트 리스너 (Listener)**: 클릭/터치 이벤트 바인딩
3. **비즈니스 로직 (Logic)**: `handle소통_Item28Action` 실제 상태 저장 및 뷰 동기화
4. **피드백 & 예외처리 (Feedback)**: 12ms 햅틱, 토스트 피드백, 4대 뷰 동시 전파

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 DM 메시지 송수신 및 Web Push 로직을 100% 무손실 보존했는가?
- [x] 전체 파일 덮어쓰기 없이 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 대화 스레드 및 프로필 데이터가 불변 보존되는가?
- [x] 375px 모바일 뷰포트에서 가로 넘침(0px) 및 터치 영역 44px을 만족하는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `js/team-invite-comm.js`에 `handle소통_Item28Action` 구현 및 `window` 노출.
2. **Step 2**: `index.html` 소통 탭 내 `#og-task-28-container` 마크업 마운트.
3. **Step 3**: `ui.css`에 고대비 반응형 스타일 및 44px 터치 타겟 추가.
4. **Step 4**: `tests/dm-keyboard-autofocus-fix.test.js` 작성 및 로컬 실행 통과.
5. **Step 5**: `scripts/smoke-test.js`에 #TASK-ES-279 단언문 추가 및 397개 스모크 통과 확인.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: `#og-task-28-action-btn` 클릭 시 에러 0건 및 정상 토스트 송출.
- **시나리오 B (Zero Data Loss)**: DM 대화 스레드 및 로컬 캐시 불변 딥이퀄 검증.
- **시나리오 C (Zero UX Regression)**: 게스트 및 로그인 사용자 전 환경에서 키보드 비자동 팝업 확인.
- **시나리오 D (Full State Propagation)**: 4대 뷰 렌더러 함수 동시 호출 무결성 확인.
- **시나리오 E (자동화 게이트 통과)**: 38개 헌법 게이트 및 스모크 테스트 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] `js/team-invite-comm.js` 핸들러 구현 완료
- [ ] `index.html` 마크업 배선 완료
- [ ] `ui.css` 스타일 정의 완료
- [ ] 단위 테스트 `tests/dm-keyboard-autofocus-fix.test.js` PASS
- [ ] `scripts/smoke-test.js` PASS (397개 통과)
- [ ] `scripts/verify-integrity-gate.js` PASS (38/38)

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 모바일 가상 키보드 팝업 시점 제어 시 브라우저별 차이.
- **사전 방어 및 우회 로직**: `autofocus` 속성을 배제하고 사용자 직접 터치 이벤트 리스너를 통해서만 포커스 허용.
- **롤백 계획 (Rollback Strategy)**: 변경 파일 외과수술적 롤백 및 캐시 원복.
- **재검증 트리거**: 모바일 환경에서 자동 팝업 발생 시 Step 1 이벤트 바인딩 재검토.
