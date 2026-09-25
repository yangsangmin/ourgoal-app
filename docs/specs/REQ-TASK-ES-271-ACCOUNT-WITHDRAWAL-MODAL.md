# 요구사항 정의서 (REQ) — 계정 탈퇴 시 법적책임·데이터 분실 사전 안내 팝업 구현 및 4위 1체 배선 완결

> **문서 ID**: REQ-TASK-ES-271-ACCOUNT-WITHDRAWAL-MODAL  
> **티켓 연계**: #TASK-ES-271 (노션 생각 메모장 [16]번, Page ID: `3dd598db-9096-80ea-a94d-e2305f182a73`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > *"사용자가 계정을 탈퇴할 때 안내되어야 하는 문구 모두 확인해서(법적책임, 데이터 분실 등등) 계정탈퇴 누르면 팝업창 띄워서 탈퇴전에 안내해야함"*
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 설정 탭 내 [회원 탈퇴] 버튼(`#withdrawBtn`) 클릭 시 팝업 안내가 기본 틀만 잡혀 있어, 실제 사용자가 계정을 삭제할 때 겪게 되는 데이터 영구 소각 위험(목표·실천기록·아바타 인벤토리·소통 내역)과 관계 법령(개인정보보호법, 전자상거래법, 통신비밀보호법)에 따른 분리 보관 및 법적 책임 고지가 정밀하게 체감되지 못함.
  - 375px 모바일 뷰포트에서 내용이 길어져 스크롤이 답답하거나 닫기/취소 인터랙션이 직관적이지 못할 위험 존재.
  - 게스트 및 비로그인 상태 등 엣지케이스 방어와 탈퇴 신청 즉시 안전한 세션 정리 및 30일 유예 기간 안내의 일관성 보장 필요.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 탈퇴 전 법적 책임 및 데이터 분실 4대 영역의 구체적 명시 부족.
  - **2층 (구조/프로세스 부재)**: 단순 텍스트 팝업을 넘어 4위 1체(마크업-리스너-로직-피드백) 배선과 전역 상태 초기화의 종단간 도달성 강화 필요.
  - **3층 (시스템/유저 체감 괴리)**: 탈퇴 시 내 데이터가 어떻게 되는지, 실수로 눌렀을 때 복구할 방법은 있는지에 대한 불안감 해소 부족.
- **사용자 상황 및 페르소나**:
  - 서비스 이용을 중단하고자 설정 탭의 [회원 탈퇴]를 클릭하는 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: FIX/INFRA/UX (계정 보안 및 법적/데이터 분실 고지 완비)
- **[본질] (Essence)**:
  - 사용자가 소중히 쌓아온 자산(목표, 기록, 아바타, 커뮤니티)의 소멸 위험과 법령에 따른 의무 보존 사항을 투명하게 안내하여 우발적 탈퇴를 방지하고, 30일 안전 유예망을 제공하는 법적·신뢰 기반의 회원 탈퇴 인터페이스.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 탈퇴 시 소멸되는 4대 자산 영역(목표/기록/아바타/소통)에 대한 세부 명시 부족.
  2. **원인 2**: 전자상거래법(5년/3년), 통신비밀보호법(3개월), 개인정보보호법에 따른 법적 책임 및 보존 고지의 법률적 정합화 필요.
  3. **원인 3**: 375px 소형 모바일 화면에서 장문 고지사항의 스크롤 및 체크박스-버튼 활성화 인터랙션의 최적화 필요.
- **[중심] (Core Bottleneck & Anchor)**:
  - `openWithdrawModal()` 팝업창 내 3대 핵심 고지 블록(데이터 분실, 30일 유예 안전망, 법적 보존 고지)과 `#withdrawAgreeCheck` 동의 연동.
- **[핵심] (Critical Safety & Termination)**:
  - 필수 동의 없이는 탈퇴 신청 불가(방어선), 탈퇴 신청 시 `pendingDeletionAt` 안전 유예 마킹, Supabase 세션 정리 및 로그인 화면 전환.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 설정에서 '회원 탈퇴'를 클릭했을 때, 깔끔하게 정리된 팝업창에서 소실될 데이터와 30일 복구 가능 기간, 법적 보존 사항을 명확히 인지하고 신중하게 결정할 수 있다."*
- **기존 전체 기능 영향도 분석**:
  - 로그인/계정: 30일 유예 상태 시 재로그인을 통한 원클릭 복구 연동 유지.
  - 홈/목표/기록 탭: 탈퇴 신청 시 전역 상태 초기화 및 로그인 화면 전환.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 즉각 하드 삭제(Hard Delete)로 유저 데이터를 즉시 영구 파괴하는 행위 금지 (30일 유예 보장).
  - 동의 체크박스 없이 원클릭으로 탈퇴가 진행되는 위험한 UX 금지.
- **해야 할 것 (Action)**:
  - 설정 탭의 [회원 탈퇴] 버튼(`#withdrawBtn`) 클릭 시 전용 모달(`#withdrawModal`) 호출.
  - 데이터 분실 4대 영역(목표·기록·아바타·소통) 및 법적 책임 3대 법령 정밀 명시.
  - 30일 안전 유예 및 원클릭 복구 안내 강조.
  - 동의 체크박스(`#withdrawAgreeCheck`) 체크 시에만 탈퇴 버튼(`#withdrawConfirmBtn`) 활성화.
  - 375px 모바일 뷰포트 스크롤 및 44px 최소 터치 영역 보장.
- **왜 이 방식이어야만 하는가 (Why this approach)**:
  - 상민님 지시 원문 그대로 "안내되어야 하는 문구 모두 확인해서(법적책임, 데이터 분실 등등) 계정탈퇴 누르면 팝업창 띄워서 탈퇴전에 안내"하는 원칙을 100% 만족함.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase `profiles.settings.pendingDeletionAt`, `profiles.settings.deletedAt` 및 `auth.users` 메타데이터 연동.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 세션 클리어 및 탈퇴 유예 플래그 저장.
- **3호 (4대 뷰 전파 배선도)**: 탈퇴 완료 시 `appShell` 비활성화 및 `authScreen` 노출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#withdrawBtn` | 설정 탭 최하단 | 클릭/터치 | `openWithdrawModal()` 팝업창 오픈 | 게스트 유저일 경우 토스트 안내 |
| `#withdrawCloseBtn` | 탈퇴 팝업 상단 | 클릭/터치 | 모달 닫기 (탈퇴 취소) | 계정 상태 100% 유지 |
| `#withdrawCancelBtn` | 탈퇴 팝업 하단 | 클릭/터치 | 모달 닫기 (탈퇴 취소) | 계정 상태 100% 유지 |
| `#withdrawAgreeCheck` | 탈퇴 팝업 하단 | 체크/해제 | `#withdrawConfirmBtn` disabled 토글 | 미체크 시 버튼 비활성화 유지 |
| `#withdrawConfirmBtn` | 탈퇴 팝업 하단 | 클릭/터치 | `submitWithdrawAccount()` 실행 | 탈퇴 처리 중 텍스트 및 토스트 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 30일 유예 기간 동안 계정 데이터를 즉시 파기하지 않고 `pendingDeletionAt` 플래그로 비활성화 보관하여 재로그인 시 100% 무손실 복구 지원.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - 장문 고지사항이 모바일 화면에서 잘리지 않도록 `max-height: 85vh; overflow-y: auto;` 및 부드러운 터치 스크롤을 적용함.
- **기존 기능과의 충돌 가능성 검토**:
  - 하위 호환 래퍼 `withdrawAccount()`를 보존하여 기존 스모크 테스트와 100% 호환.
- **엣지 케이스 (Edge Cases)**:
  - 게스트 유저(`guest_user`): 회원 탈퇴 대신 "데이터 초기화"를 이용하도록 친절한 안내 토스트 제공.
  - 네트워크 단절: 오프라인 시 로컬 상태에 탈퇴 플래그를 저장하고 에러 토스트 피드백 제공.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. `index.html` 5160행: `openWithdrawModal()` 마크업 내 데이터 분실 4대 영역, 법적 책임 3대 법령, 30일 유예 복구 상세 고지 보강.
  2. `ui.css`: `.withdraw-modal-container`, `.withdraw-box` 375px 모바일 반응형 및 고대비 토큰 최적화.
  3. `tests/account-withdrawal-modal.test.js`: 신규 단위 테스트 작성.
  4. `scripts/smoke-test.js`: `#TASK-ES-271` 무결성 단언 추가.
  5. 법정 청구서 `reports/TASK-ES-271/claims.json` 작성.
  6. Git 커밋, 푸시, PR 생성 및 GitHub Court 심사 통과 후 머지.
- **화면 간 상호연동 전파 규격**:
  - 탈퇴 완료 시 앱 쉘 비활성화 및 로그인 화면(`authScreen`) 전환.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**:
  - Supabase Auth API 호출 실패 시에도 로컬 프로필의 유예 플래그가 우선 기록되어 세션 탈취나 데이터 오염 방지.
- **가정의 타당성 검증**:
  - 30일 유예 계정의 로그인 시 복구 로직(`checkPendingDeletionRestore`)이 정상 작동하는지 전수 확인.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - 팝업창 내 닫기(X) 버튼과 취소(계정 유지) 버튼 2중 안전 장치 제공.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 설정 탭의 [회원 탈퇴] 버튼 클릭 시 안내 팝업창이 즉시 열림.
- 팝업창 내 데이터 분실 4대 영역, 법적 책임 3대 법령, 30일 유예 안내가 완비됨.
- 체크박스 미체크 시 탈퇴 버튼이 비활성화되고, 체크 시 활성화됨.
- 단위 테스트 `tests/account-withdrawal-modal.test.js` ALL PASS.
- 스모크 테스트 389개 ALL PASS 및 헌법 게이트 38개 ALL PASS.
- GitHub Court `success` 판정 획득.

---

## 8. [원칙 ⑧] 즉시/단계별 적용 (Rollout & Verification)
- C1: `index.html` 내 `openWithdrawModal`에 데이터 분실 4대 영역 및 법적 책임 3대 법령 사전 고지 마크업이 구현되어 있다.
- C2: `index.html` 내 `withdrawModal`에 필수 동의 체크박스(#withdrawAgreeCheck)와 탈퇴 신청 버튼(#withdrawConfirmBtn) 인터랙션이 배선되어 있다.
- C3: `index.html` 내 `submitWithdrawAccount`에 30일 탈퇴 유예 안전망(pendingDeletionAt) 및 세션 정리 로직이 구현되어 있다.
- C4: `ui.css` 내에 `.withdraw-modal-container` 및 `.withdraw-box` 375px 모바일 반응형 스타일이 구현되어 있다.
- C5: `index.html` 내에 회원 탈퇴 취소 및 닫기(#withdrawCancelBtn, #withdrawCloseBtn) 이벤트 배선이 존재한다.
