# 요구사항 정의서 (REQ) — 설정 탭 1:1 고객 문의 링크 무반응 결함 수술 및 4위1체 리스너·글로벌 스코프 배선

> **문서 ID**: REQ-INAPP-INQUIRY-LINK-FIX-ES178  
> **티켓 연계**: #TASK-ES-178  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity AI Engine (Session 6248f4d3)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "설정탭의 1대1 문의 / 오류제보 링크는 작동을 안하는데? 다른세션 작업중이니까 방해안되는 선 까지만 진행해"
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 아워골 앱 내 [설정] 탭의 최하단 푸터에 위치한 "문의 1:1 문의 / 오류 제보"(`footInquiryLink`) 링크를 사용자가 터치하거나 클릭하여도 모달이 열리지 않고 무반응 상태로 방치됨.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: `footInquiryLink` 태그에 inline HTML 속성인 `onclick="openCustomerInquiryModal();return false;"`가 선언되어 있으나, `openCustomerInquiryModal` 함수는 `index.html` 스크립트 내부 지역 스코프에 갇혀 있고 `window` 전역 객체에 노출되지 않아 브라우저 런타임에서 `Uncaught ReferenceError: openCustomerInquiryModal is not defined`가 발생함.
  - **2층 (구조/프로세스 부재)**: 설정 화면 내 접이식 `<details>` 블록 안에 있던 `feedbackInquiryBtn`에는 `addEventListener`가 배선되어 있었으나, 최하단 푸터의 `footInquiryLink`는 이벤트 리스너 등록 목록에서 누락된 채 불완전한 인라인 핸들러에만 의존하고 있었음.
  - **3층 (시스템/유저 체감 괴리 및 다중 세션 안전성)**: 유저가 서비스 사용 중 버그를 겪거나 건의사항을 전송하려 할 때 핵심 접수 창구가 작동하지 않아 신뢰도가 급격히 하락함. 또한 다른 세션이 현재 프로덕션/피처 작업을 진행 중이므로, 원격 메인 병합이나 다른 세션의 브랜치를 교란하지 않고 독립된 브랜치와 로컬 검증 수준에서 무충돌로 안전하게 완결해야 함.
- **사용자 상황 및 페르소나**:
  - 설정 탭을 둘러보며 오류를 제보하거나 고객 문의를 접수하려는 모든 일반 유저 및 게스트.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `FIX` (고객 소통 창구 무결성 복구)
- **[본질] (Essence)**: 유저 대면 최전선인 설정 탭 푸터의 1:1 문의 링크가 어떠한 상황에서도 0.01초 만에 1:1 고객 문의 인앱 모달을 안정적으로 호출하도록 4위 1체 배선을 완결하고, 다른 작업 세션의 흐름을 100% 보호하는 것.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: `openCustomerInquiryModal` 함수가 전역 객체(`window`)에 바인딩되지 않아 인라인 `onclick` 평가 시 ReferenceError 발생.
  2. **원인 2**: `index.html` 내 이벤트 리스너 등록 루프에 `footInquiryLink`가 누락되어 순수 JS 이벤트 바인딩이 누락됨.
  3. **원인 3**: 인터랙티브 요소 전수 검증 시 `footInquiryLink`에 대한 실제 클릭 및 모달 노출 검증 단언문 부재.
- **[중심] (Core Bottleneck & Anchor)**: `footInquiryLink`의 인라인 `onclick`을 제거하고 `['feedbackInquiryBtn', 'footInquiryLink']` 통합 `addEventListener`를 배선하며, `window.openCustomerInquiryModal = openCustomerInquiryModal;`을 명시적으로 전역 노출하여 이중 안전망을 구축하는 것.
- **[핵심] (Critical Safety & Termination)**: 다른 세션의 작업을 방해하지 않기 위해 전용 격리 브랜치(`fix/2026-09-18-settings-inquiry-link-es178`)에서 작업하고, 로컬 5대 무결성 검증 및 CDP 실클릭 스크린샷 증빙을 완료한 후 PR 생성 및 [결심 필요] 단계로 안전하게 멈추는 것.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 설정 탭 최하단의 '1:1 문의 / 오류 제보'를 누르는 순간, 지체 없이 우아한 1:1 고객 문의 모달 시트가 부드럽게 올라와 신속하고 신뢰감 높은 피드백 접수 경험을 체감한다."*
- **기존 전체 기능 영향도 분석**:
  - 목표, 캘린더, 피드, 통계, 아바타 등 기존 기능에 부작용(Side Effect) 0건.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 다른 세션이 작업 중인 파일이나 브랜치를 침범하거나 원격 main에 임의 병합하는 행위 엄금 (상민님의 '방해 안 되는 선까지만 진행' 특명 엄수).
  - 외부 mailto 링크로 변경하는 행위 엄금 (헌법 제14조 제1항 인앱 완결 원칙 준수).
- **해야 할 것 (Action)**:
  - `index.html`: `footInquiryLink` 인라인 onclick 제거 및 표준 리스너 바인딩.
  - `index.html`: `window.openCustomerInquiryModal` 및 `window.showLegalModal` 전역 스코프 안전 배선.
  - `scripts/smoke-test.js`: `footInquiryLink` 이벤트 바인딩 및 전역 노출 단언문 추가.
  - CDP 로컬 브라우저에서 `footInquiryLink` 실제 클릭 테스트 및 증빙 스크린샷 캡처.
- **왜 이 방식이어야만 하는가 (Why this approach)**:
  - 인라인 핸들러 제거와 `addEventListener` 바인딩, 그리고 `window` 전역 노출의 '3중 안전망'을 구축해야 브라우저 보안 정책이나 스코프 제약과 무관하게 100% 영구 불파괴가 보장되기 때문임.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 기존 `inquiries` 테이블 및 `/api/inquiry` 엔드포인트 100% 재사용 (신규 DB 마이그레이션 불요).
- **2호 (스마트 스토리지 분기 설계)**: 로컬/원격 미디어 스토리지 변경 없음.
- **3호 (4대 뷰 전파 배선도)**: 1:1 고객 문의는 사용자 문의 접수 모달 인터랙션으로 뷰 렌더러 파괴 없음.

### 3-2. 전수 인터랙션(Zero-Dead-Click) 명세표
| 대상 UI 요소 | 위치 | 트리거 | 동작 및 비즈니스 로직 | 기대 결과 |
| :--- | :--- | :--- | :--- | :--- |
| `footInquiryLink` | 설정 탭 푸터 | click / touch | `openCustomerInquiryModal()` 호출 | 1:1 고객 문의 모달 시트 즉시 노출 |
| `feedbackInquiryBtn` | 설정 탭 고객지원 블록 | click / touch | `openCustomerInquiryModal()` 호출 | 1:1 고객 문의 모달 시트 즉시 노출 |
| `inquiryCancel` | 1:1 문의 모달 | click / touch | `closeModal()` 호출 | 모달 정상 닫힘 |

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)
- **비판적 재검토**:
  - `footInquiryLink`는 `<a>` 태그이므로 클릭 시 URL 해시 `#`가 추가되거나 페이지 상단으로 스크롤 점프가 발생할 위험이 있음.
  - **보완책**: 리스너 콜백에서 `e.preventDefault()`를 철저히 호출하고, 마크업에서도 `href="javascript:void(0)"` 또는 `role="button"`을 명시하여 시맨틱 접근성을 완비함.
- **엣지 케이스 검토**:
  - 비로그인 게스트 모드에서 문의 접수 시: `state.profile`에서 guest ID 및 '익명 유저'로 정상 폴백 처리됨을 확인.
  - 네트워크 단절 시: 문의 접수 버튼 비활성화 해제 및 친절한 실패 토스트 피드백 유지.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)
- **순차적 구현 시퀀스**:
  1. [Step 1]: 격리 브랜치 `fix/2026-09-18-settings-inquiry-link-es178` 전환 확인.
  2. [Step 2]: `index.html` 952번 라인 `footInquiryLink` 마크업 정리.
  3. [Step 3]: `index.html` 3720번 라인 리스너 배열에 `footInquiryLink` 추가.
  4. [Step 4]: `index.html` 내 `window.openCustomerInquiryModal = openCustomerInquiryModal;` 전역 노출 배선.
  5. [Step 5]: `scripts/smoke-test.js`에 검증 단언문 추가.
  6. [Step 6]: `npm test` 및 무결성 게이트 검증.
  7. [Step 7]: 로컬 CDP 실제 클릭 브라우저 테스트 및 증빙 스크린샷 캡처.
  8. [Step 8]: 로컬 커밋 및 PR 생성, 상민님께 보고 및 대기.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점(SPOF) 분석 및 절차 수정사항**:
  - 만약 `openCustomerInquiryModal` 함수가 선언되기 전에 `footInquiryLink` 이벤트가 바인딩되면 호이스팅은 되지만, `window` 바인딩 시점이 늦어질 수 있음.
  - **절차 수정사항**: `window.openCustomerInquiryModal = openCustomerInquiryModal;`은 함수 정의 직후 및 스크립트 초기화 블록 양쪽에 안전하게 배치하여 초기 로드 시점부터 상시 접근 가능하도록 보장함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
- **물리적 통과 기준**:
  1. `npm test` (스모크 테스트 313개 이상) 100% 통과 (0 failure).
  2. `node scripts/verify-integrity-gate.js` 11개 검증 전수 ALL PASS.
  3. 로컬 브라우저에서 `footInquiryLink` 클릭 시 콘솔 에러 0건 및 1:1 고객 문의 모달 DOM 등장 확인.
  4. 실제 작동 증빙 스크린샷 1장 이상 확보.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**:
  - 다른 세션의 동시 파일 수정 충돌 가능성.
  - **대응책**: 격리 브랜치 유지 및 최소한의 외과수술적 diff (5줄 이내) 적용.
- **재검증 트리거**:
  - 클릭 시 모달이 뜨지 않을 경우: 원칙 ②의 원인 분석 및 원칙 ⑤의 리스너 등록 타이밍으로 회귀하여 DOM 로드 시점 재검증.
