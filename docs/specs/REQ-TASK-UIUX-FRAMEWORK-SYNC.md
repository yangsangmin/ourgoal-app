# 요구사항 정의서 (REQ) — [UI/UX 틀 개편 완결 대장 등재] 아워골 UI/UX 프레임워크 8대 실행 단계(전수 64대 과업) 전원 머지 공식 등재

> **문서 ID**: REQ-TASK-UIUX-FRAMEWORK-SYNC  
> **티켓 연계**: #TASK-UIUX-FRAMEWORK-SYNC  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity (Advanced Agentic Pair-Programmer)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "진행. 세션 작업 지침과 계획서에 따라 스모크/무결성 테스트를 완료하고, PR을 생성하여 GitHub 법정 심사를 청구하라. 멈추지 마라."
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 아워골 UI/UX 프레임워크 8대 단계(Phase 0~Phase 7, 총 64대 과업)가 PR #612, #614, #616, #618, #619, #620, #621, #622를 거쳐 GitHub origin/main에 100% success 판정으로 병합 완료되었으나, 본질 승인 티켓 대장(`docs/rules/TICKETS.md`)에 Phase 7의 머지 완료 상태 및 64대 과업 완결 공식 등재가 미반영된 상태임.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 티켓 상태가 여전히 '진행 중'으로 남아 있으면 후속 세션이나 감사 도구가 작업을 미완결로 오판할 소지 존재.
  - **2층 (구조/프로세스 부재)**: 대단원 프로젝트 완결 시 대장 공식 동기화 파이프라인 정례화 필요.
  - **3층 (시스템/유저 체감 괴리)**: 실제 제품은 8대 단계가 완벽히 적용되었으나 기록 대장의 시차가 발생.
- **사용자 상황 및 페르소나**: 개발 총괄 상민님 및 모든 감사 에이전트가 단일 대장을 통해 64대 과업의 전원 종결을 1초 만에 확인해야 함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `INFRA/RULES` (본질 승인 티켓 대장 무결성 및 완결 원장 동기화)
- **[본질] (Essence)**: 아워골 UI/UX 프레임워크 64대 과업 완결에 대한 공식적이고 불가역적인 기록 정본 확립.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. Phase 7 PR #622 머지 완료 시점과 티켓 대장 갱신의 시간차.
  2. 64대 과업 완결에 대한 종합 대장 정합성 보증 절차 필요.
  3. Zero Dead-Click 942개 버튼 및 모듈러 수밀 격벽 무결성 정합 유지 필요.
- **[중심] (Core Bottleneck & Anchor)**: `docs/rules/TICKETS.md`의 정확한 머지 상태 및 완결 등재.
- **[핵심] (Critical Safety & Termination)**: 기존 코드와 버튼 100% 무손실 및 린터 전수 통과.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자와 관리자가 티켓 대장과 관제센터를 조회했을 때, UI/UX 프레임워크 개편 전 단계가 '완료'로 완벽 동기화되어 흔들림 없는 신뢰감을 얻게 된다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인, 홈, 목표, 기록, 캘린더, 소통, 설정 6대 탭 기능 일체 불파괴 및 보존.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**: 불필요한 제품 코드 수정 금지, 기존 헌법 규범 훼손 금지.
- **해야 할 것 (Action)**: `docs/rules/TICKETS.md`에 Phase 7 머지 완료(#622) 및 64대 과업 완결 상태를 기록하고 무결성 테스트 5종 전수 검증.
- **왜 이 방식이어야만 하는가 (Why this approach)**: 단일 진실 원칙(Single Source of Truth)에 입각하여 문서와 실제 저장소 상태를 일치시킴.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: DB 스키마 변경 없음.
- **2호 (스마트 스토리지 분기 설계)**: 로컬/원격 스토리지 변경 없음.
- **3호 (4대 뷰 전파 배선도)**: 대장 등재 작업이므로 뷰 전파는 기존 배선 100% 유지.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
- 기존 정적 버튼 942개 전원 핸들러 100% 배선 유지.

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 유저 데이터, 아바타, 목표, 기록 100% 무손실 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: 문서 변경 커밋이므로 불필요한 린트 경고나 승인선 트리거를 유발하지 않도록 규범 준수.
- **기존 기능과의 충돌 가능성 검토**: 충돌 없음.
- **엣지 케이스 (Edge Cases)**: None.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
1. `docs/rules/TICKETS.md` 수정 완료.
2. `reports/TASK-UIUX-FRAMEWORK-SYNC/claims.json` 작성.
3. 로컬 5대 테스트 전수 검증.
4. GitHub PR 생성 및 법정 심사 청구.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: 없음.
- **가정의 타당성 검증**: PR #622 머지 완료 커밋(`3722b7b`) 확인 완료.
- **재검증 결과 도출된 절차 수정/보완사항**: 정확한 커밋 해시와 PR 번호 명기.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- `verify-integrity-gate.js` PASS
- `verify-all-clicks.js` PASS (942개 버튼 100%)
- `test-shipyard-modular.js` PASS (800줄 이하)
- `smoke-test.js` PASS (440개 통과)
- `tri-sync.js check` PASS (100%)
- GitHub court 검사 success 판정.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**: 없음.
- **재검증 트리거**: court 검사 결과 확인 후 이상 시 즉각 조치.
