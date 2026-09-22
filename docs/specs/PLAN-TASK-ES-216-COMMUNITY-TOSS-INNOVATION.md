# 엔지니어링 작업계획서 (PLAN) — 소통 탭(screen-comm) 토스(Toss)식 UI/UX 전면 혁신

> **문서 ID**: PLAN-TASK-ES-216-COMMUNITY-TOSS-INNOVATION  
> **요구사항 연계**: [REQ-TASK-ES-216-COMMUNITY-TOSS-INNOVATION](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-216-COMMUNITY-TOSS-INNOVATION.md)  
> **티켓 연계**: #TASK-ES-216  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity (Toss Head of UI/UX Pair)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  소통 탭(`screen-comm`) 내 상단 사족 배너와 숨김 요소를 정돈하고, "동류 소통 요약 원카드(`.toss-community-hero-card`)" 중심의 1화면 1목적 구조와 서브탭 전환 및 피드 인터랙션 시 12ms 미세 햅틱 피드백을 도입하여 엄지 영역 중심의 직관적 토스식 모바일 경험을 확립한다.
- **영향 받는 파일 목록 전수**:
  - `docs/rules/TICKETS.md`: #TASK-ES-216 티켓 상태 갱신 (완료)
  - `docs/specs/REQ-TASK-ES-216-COMMUNITY-TOSS-INNOVATION.md`: 요구사항 정의서 (기작성)
  - `docs/specs/PLAN-TASK-ES-216-COMMUNITY-TOSS-INNOVATION.md`: 본 엔지니어링 작업계획서
  - `reports/TASK-ES-216/claims.json`: GitHub 법정 검증 청구서
  - `ui.css`: 토스 소통 전용 스타일 컴포넌트 (`.toss-community-hero-card`, `.toss-comm-card`, 모바일 375px 여백 및 42~44px 터치 타깃 튜닝)
  - `index.html`: `#screen-comm` 내부 조형 고도화, 헤로 카드 슬롯 및 12ms 미세 햅틱(`triggerHapticFeedback(12)`) 연동, 38대 헌법 DOM ID 100% 보존
  - `scripts/verify-integrity-gate.js`: 회귀 및 8원칙 린터 정적 검증

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 소통 탭의 기술적 본질은 함께 뛰는 동류들의 온기와 활력을 단일 원카드로 명확하게 브리핑하고, 1터치로 글 작성 및 응원을 트리거하며, 12ms 햅틱과 함께 4대 뷰(홈/기록/통계/캘린더)로 상태를 동기화하는 **"동류 발견 및 상호 소통 엔진(E3 Axis)"**이다.
- **[원인] (Technical Causes)**:
  - 동류 상태를 종합 브리핑하는 앵커 원카드의 부재, 서브탭 전환 및 인터랙션 시 햅틱 피드백 누락이 사용성을 저해하는 기저 원인이다.
- **[중심 배선] (Core Wire & State)**:
  - `commHeadlineSentence`: 문장형 헤드라인에 동류 소통 상태 실시간 바인딩
  - `[data-sub]`: 서브탭 전환 시 `triggerHapticFeedback(12)` -> `state.commSubTab` 변경 및 리렌더링
  - `btnCommPostFeed`: 새 글 작성 모달 트리거 시 12ms 햅틱 배선
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 779개 정적 버튼 dead-click 린터 및 38대 헌법 방화벽 셀렉터(`#commHeadlineSentence`, `#sanctuaryCommView`, `#btnCommPostFeed`, `#commBody`, `#commSubBody`, `.comm-subtabs-grid` 등) 100% 불변 보존.
  - 18번 헌법 게이트: 소통 탭 6종 서브탭 3×2 그리드 조형 정적 방화벽 100% 준수.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[소통 탭 진입 / 서브탭 전환] -> [triggerHapticFeedback(12)] -> [toss-community-hero-card 동류 상태 렌더링] -> [3×2 서브탭 및 피드 카드 표출]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | 토스 소통 요약 원카드 및 피드 카드 스타일링 | +65줄 | 0줄 | +65줄 | CSS 토큰 준수 |
| `index.html` | 헤더 원카드 조형 정돈 및 12ms 햅틱 배선 | +35줄 | -5줄 | +30줄 | 외과수술적 diff |
| `docs/specs/PLAN-TASK-ES-216-COMMUNITY-TOSS-INNOVATION.md` | 정본 엔지니어링 작업계획서 | +130줄 | 0줄 | +130줄 | 정본 스펙 |
| `reports/TASK-ES-216/claims.json` | 법정 검증 청구서 | +90줄 | 0줄 | +90줄 | 검증 명세 |
| `docs/rules/TICKETS.md` | 티켓 상태 갱신 | +2줄 | -1줄 | +1줄 | 규칙 관리 |

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**:
  - Supabase 테이블 DDL 변경 0건 (100% 하위 호환 보장).
- **2호 (스마트 스토리지 분기 설계)**:
  - 소통 피드 및 동반자 데이터는 기존 3계층(Supabase DB / IndexedDB / localStorage 메타) 캐시 파이프라인 유지.
- **3호 (비정상 종료 자가 치유)**:
  - 글 작성 중 앱 종료 시 기존 임시 보관 메커니즘 100% 보존.

---

## 4. [원칙 ④] 4단계 전개 시나리오 및 예외 방어 (Rollout Phases & Defensive Design)

- **Phase 1: 디자인 토큰 및 CSS 조형 (ui.css)**
  - `.toss-community-hero-card`, `.toss-comm-card` 클래스 정의.
  - 패딩 16px, 보더 래디우스 16px, 은은한 배경 그라데이션 및 44px 터치 영역 규격 배선.
- **Phase 2: HTML 마크업 및 DOM 무결성 보존 (index.html)**
  - `#screen-comm` 상단에 `.toss-community-hero-card` 슬롯 조형 배치.
  - 기존 헌법 필수 DOM 요소 완벽 유지.
- **Phase 3: 12ms 햅틱 및 서브탭 전환 연동**
  - 서브탭 버튼(`[data-sub]`) 및 게시 버튼에 `triggerHapticFeedback(12)` 배선.
- **Phase 4: 무결성 검증, PR 발행 및 머지**
  - 38/38 무결성 게이트, 335/335 스모크 테스트, 779/779 Dead-Click ALL PASS 확인.
  - PR #385 발행 -> CI 통과 -> main 머지 완료.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

- **구체적 실행 시퀀스**:
  1. **[단계 1 - 계획 및 티켓 동기화]**: `docs/rules/TICKETS.md` 상태 갱신.
  2. **[단계 2 - 법정 검증 청구서 수립]**: `reports/TASK-ES-216/claims.json` 작성 (소통 탭 5대 법정 청구 항목).
  3. **[단계 3 - CSS 토스 소통 토큰 배선]**: `ui.css`에 `.toss-community-hero-card`, `.toss-comm-card` 등 모던 스타일 추가.
  4. **[단계 4 - 렌더러 리팩토링 및 햅틱 배선]**: `index.html` 내 `#screen-comm` 상단에 동류 소통 요약 원카드 레이아웃 및 12ms 햅틱(`triggerHapticFeedback(12)`) 연동.
  5. **[단계 5 - 기계적 무결성 전수 검증]**: 335개 테스트, 38개 헌법 게이트, 779개 정적 버튼 dead-click 전수 통과 확인.
  6. **[단계 6 - PR 생성 및 CI 통과 후 배포]**: PR 생성 및 자동 머지 완료.
- **화면 간 상호연동 전파 규격**:
  - 피드 작성/응원 시 `dispatchFullViewPropagation()` 호출 -> 소통 화면 즉시 갱신 및 홈/목표/기록/통계 동기화.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

> *(주의: 본 원칙은 절차 정리(⑤)와 단계별 실행(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 타 원칙과 합치는 것은 위헌입니다)*

- **단일 실패점 (SPOF) 점검**:
  - 서브탭 전환 시 외부 연동 모듈 미로딩 상태에서도 UI 반응성 100% 유지(안전 폴백).
- **가정의 타당성 검증**:
  - 피드/팀/동반자/DM/마니또/공유 6개 서브탭 모두에서 헤로 카드와 콘텐츠가 깨짐 없이 동작하는지 크로스 체크.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - 18번 헌법 게이트(소통 탭 서브탭 6종 라벨 및 3×2 그리드 조형 정적 방화벽) 셀렉터 무결성 100% 보존.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

1. 모든 인터랙티브 버튼 클릭 시 콘솔 에러 0건 (Zero Error).
2. 유저 데이터 무손실 검증(10종 페르소나 딥이퀄) 100% PASS.
3. `npm test` 스모크 335개 및 38개 무결성 게이트 전수 ALL PASS (0 failure).
4. `verify-all-clicks.js` 779개 정적 버튼 Zero Dead-Click 100% 통과.
5. 모바일 375px 뷰포트에서 동류 소통 요약 원카드 시인성 확보.

---

## 8. [원칙 ⑧] 본질적 변화 요약 및 유저 가치 (Value & Paradigm Shift)

- 소통 탭 진입 시 사용자는 즉각적인 동류 소통 요약 원카드를 마주하고, 1터치로 간편하게 글을 공유하거나 서브탭을 넘나들며 경쾌한 12ms 햅틱 피드백을 통해 함께 달리는 커뮤니티의 연대감을 생생하게 체감하게 된다.
