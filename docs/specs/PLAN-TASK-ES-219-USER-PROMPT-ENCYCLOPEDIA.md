# 작업 계획서 (PLAN) — 데이터분석 프롬프트 백과사전 실사용 유저 등록 및 도움돼요 상호작용

> **문서 ID**: PLAN-TASK-ES-219-USER-PROMPT-ENCYCLOPEDIA  
> **티켓 연계**: #TASK-ES-219  
> **작성 일시**: 2026-09-23  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **과제 목표**:
  - 목표 탭의 '데이터분석 프롬프트 백과사전'에 정적 하드코딩 8종을 넘어, 사용자가 직접 자신만의 프롬프트를 등록하고 공유하며 '도움돼요(추천)'로 상호작용할 수 있는 신뢰 기반 집단지성 피드를 구축한다.
- **수행 역할 (Persona)**:
  - 소셜 인터랙션 아키텍트 겸 풀스택 엔지니어 (레딧/프로덕트헌트 커뮤니티 투표 시스템 수준의 견고한 상호작용과 영속성 구축).
- **해결 범위**:
  - `index.html`: `renderPromptEncyclopediaHtml`, `wirePromptEncyclopediaEvents`, `openAddUserPromptModal` 신설 및 배선.
  - `ui.css`: 유저 프롬프트 카드 및 추천 버튼 스타일 보강.
  - `scripts/smoke-test.js`: 유저 프롬프트 등록 및 도움돼요 토글 무결성 검증 케이스 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E1 (데이터 분석 역량 강화) & E3 (유저 간 지식 기여 및 추천 루프)
- **[본질] (Essence)**:
  - 사용자가 스스로 검증한 프롬프트를 자발적으로 기여하고, 동료들의 실시간 추천 피드백을 통해 효능감을 획득하는 참여형 커뮤니티 가치의 완성.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. 하드코딩된 프리셋 목록만 렌더링되고 동적 사용자 데이터(`userPrompts`)를 주입받는 통로가 없음.
  2. 프롬프트 등록 폼을 제공하는 바텀시트 모달 컴포넌트 부재.
  3. 추천 상태(`likedPromptIds`)를 추적하고 카운트를 반영하는 상호작용 핸들러 미배선.
- **[중심] (Core Bottleneck & Anchor)**:
  - 프롬프트 서랍 상단 `[➕ 나만의 프롬프트 올리기]` 버튼 ➔ `openAddUserPromptModal` ➔ `state.profile.userPrompts` 영구 저장 ➔ `[👍 도움돼요]` 1인 1표 토글로 이어지는 4위 1체 데이터-인터랙션 파이프라인.
- **[핵심] (Critical Safety & Termination)**:
  - 중복 추천 방지 및 본인 글에 대한 삭제 권한 보장, 비정상적 빈 입력 차단 및 100% Zero-Dead-Click 유지.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **아키텍처 설계**:
  - `state.profile.userPrompts`: `[{ id, title, category, desc, prompt, authorName, authorAvatar, createdAt, likes }]` 배열 구조.
  - `state.profile.likedPromptIds`: 유저가 추천한 프롬프트 ID 목록 (`['up_123', 'preset_real_0']`).
  - `localStorage` 백업: `ourgoal_user_prompts`와 `ourgoal_liked_prompt_ids`를 통한 브라우저 세션 보존.
  - 1인 1표 토글 알고리즘: 클릭 시 `likedPromptIds` 포함 여부 확인 ➔ 토글 후 카운트 증감 ➔ 프로필 저장 및 12ms 햅틱 호출.

---

## 4. [원칙 ④] 실행 계획 수립 및 헌법 무결성 (Implementation Planning)
- **파일별 상세 변경 내역**:
  1. `index.html`:
     - `renderPromptEncyclopediaHtml(context)`: 상단 [➕ 나만의 프롬프트 올리기] 버튼, 유저 프롬프트 목록 렌더링, 엠티 스테이트 안내 배선.
     - `wirePromptEncyclopediaEvents(root)`: 등록 버튼, 도움돼요 버튼, 복사 버튼, 삭제 버튼 이벤트 바인딩.
     - `openAddUserPromptModal()`: 바텀시트 등록 모달 구현.
  2. `ui.css`:
     - `.user-prompt-card`, `.btn-like-prompt`, `.btn-like-prompt.liked` 등 토스형 모던 스타일링 추가.
  3. `scripts/smoke-test.js`:
     - TASK-ES-219 단위 테스트 4종 배선 (모달 진입, 등록 유효성, 도움돼요 토글, 복사 연동).
  4. `reports/TASK-ES-219/claims.json`:
     - 법정 5대 청구서 (C1~C5) 작성.

---

## 5. [원칙 ⑤] 실행 및 점진적 배선 (Execution & Incremental Wiring)
- **Step 1**: `index.html` 내 프롬프트 백과사전 유저 데이터 모델 및 렌더링 함수 확장.
- **Step 2**: 프롬프트 등록 바텀시트 모달(`openAddUserPromptModal`) 구현 및 입력 유효성 검사.
- **Step 3**: 도움돼요(`btn-like-prompt`) 및 복사(`btn-copy-prompt`) 이벤트 리스너 배선.
- **Step 4**: CSS 스타일 보강 및 375px 모바일 반응형 조형 검수.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedural Re-Verification)
- `node scripts/verify-integrity-gate.js` (38/38 통과 검증).
- `npm test` (336개 이상 테스트 전체 패스).
- `node scripts/verify-all-clicks.js` (데드클릭 0건 검증).
- `node scripts/essence-gate.js --check-commit HEAD` 적격성 검증.

---

## 7. [원칙 ⑦] 피드백 및 체감 가설 검증 (Feedback & User Experience Validation)
- 모바일 화면에서 프롬프트 등록 후 목록 최상단에 즉각 반영되는지 확인.
- 추천 버튼 클릭 시 12ms 햅틱과 함께 숫자가 실시간 +1 / -1 토글되는지 검증.
- 복사 버튼 클릭 시 클립보드 복사 토스트가 명확히 뜨는지 확인.

---

## 8. [원칙 ⑧] 지식화 및 노션 SSOT 동기화 (Knowledge Base & SSOT Sync)
- 노션 생각 메모장 DB (`3dc598db-9096-81ef-8ee0-cf8c1c126795`) 89번 상태 `완료`로 변경.
- `docs/rules/TICKETS.md` 티켓 완료 처리.
