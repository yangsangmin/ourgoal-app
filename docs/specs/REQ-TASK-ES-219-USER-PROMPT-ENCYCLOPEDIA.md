# 요구사항 정의서 (REQ) — 데이터분석 프롬프트 백과사전 실사용 유저 등록 및 도움돼요 상호작용

> **문서 ID**: REQ-TASK-ES-219-USER-PROMPT-ENCYCLOPEDIA  
> **티켓 연계**: #TASK-ES-219  
> **작성 일시**: 2026-09-23  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "90번 완료처리하고, 89번부터. 번호대로 계속 하나씩 간다." (노션 89번: "데이터분석 프롬프트 백과사전 실사용 프롬프트 유저 등록·피드 게시 및 '도움돼요' 상호작용 구축")
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 현재 목표 탭의 `renderPromptEncyclopediaHtml`에는 플랫폼 관리자가 하드코딩해둔 8종(실사용 4종 + 맞춤 4종) 정적 프롬프트만 나열되어 있음.
  - 사용자가 자신만의 유용한 데이터분석 프롬프트를 등록하여 공유할 수 있는 UI 및 입력 창구가 존재하지 않음.
  - 동료 사용자들의 프롬프트에 대해 "도움돼요(추천)"를 누르거나 호응을 표현할 수 있는 상호작용 기능이 전무함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 나만의 프롬프트 올리기 버튼(`btnAddUserPrompt`), 등록 모달(`openAddUserPromptModal`), 추천 토글 버튼(`btn-like-prompt`)이 배선되어 있지 않음.
  - **2층 (구조/프로세스 부재)**: 유저 생성 프롬프트 목록(`state.profile.userPrompts`) 및 유저 추천 목록(`state.profile.likedPromptIds`)의 저장 원장과 실시간 동기화 파이프라인 부재.
  - **3층 (시스템/유저 체감 괴리)**: 집단지성 커뮤니티의 효능감 없이 일방적인 정적 카탈로그로만 머물러 프롬프트 백과사전의 실효성과 재방문 가치가 급감함.
- **사용자 상황 및 페르소나**:
  - 생성형 AI(ChatGPT, Claude, Gemini)를 활용해 목표 데이터를 분석하는 노하우를 가진 사용자. 나만의 팁을 등록해 동료들의 응원을 받고, 동료들의 검증된 프롬프트를 1클릭 복사해 활용하고자 함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E1 (목표 데이터 분석 루프) & E3 (동류 집단지성 상호작용)
- **[본질] (Essence)**:
  - 폐쇄적이고 정적인 텍스트 카탈로그를 유저가 직접 생산하고 평가하며 검증하는 살아 숨쉬는 집단지성 소셜 프롬프트 생태계로 전환하는 것.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. `renderPromptEncyclopediaHtml` 내부에 고정 하드코딩 배열만 존재하고 동적 유저 데이터 슬롯이 없음.
  2. 프롬프트 등록 폼(제목, 카테고리, 설명, 프롬프트 본문)을 호출하는 모달 UI 및 상태 저장 로직 부재.
  3. 1인 1회 추천 토글 및 클립보드 복사 피드백을 처리하는 이벤트 리스너 미배선.
- **[중심] (Core Bottleneck & Anchor)**:
  - 프롬프트 백과사전 상단에 `[➕ 나만의 프롬프트 올리기]` 진입점을 마련하고, 등록 모달과 유저 프롬프트 렌더링, `[👍 도움돼요 (N)]` 1인 1표 토글을 `state.profile` 영구 원장에 직결하는 4위 1체 배선.
- **[핵심] (Critical Safety & Termination)**:
  - 1인 1회 중복 추천 방지(ID 세트 검사)와 본인 작성 프롬프트 삭제 권한 보장, 빈 제목/본문 방어 유효성 검사 완비.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 목표 탭에서 프롬프트 백과사전을 열었을 때, [➕ 나만의 프롬프트 올리기]를 눌러 10초 만에 팁을 공유하고, 동료들의 프롬프트에 [👍 도움돼요]를 누르며 실시간 추천 숫자가 올라가는 것을 보며 진정한 동반 성장의 연대감을 느낀다."*
- **기존 전체 기능 영향도 분석**:
  - 기존 8종 프리셋: 100% 보존되며 동일하게 복사 및 도움돼요 상호작용 지원.
  - 전역 상태 무결성: `state.profile.userPrompts` 및 `state.profile.likedPromptIds` 배열 안전 초기화로 기존 데이터 손실 0건 보장.
  - 성능 영향: 가벼운 인메모리 배열 조작으로 60fps 렌더링 유지.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 기존 8종 데이터분석 프롬프트 프리셋을 파괴하거나 은폐하지 말 것.
  - 외부 백엔드 지연 시 렌더링이 블로킹되지 않도록 순수 클라이언트 로컬 원장(`state.profile` + `localStorage`) 즉각 반응형으로 구축할 것.
- **해야 할 것 (Action)**:
  - 프롬프트 백과사전 헤더에 [➕ 나만의 프롬프트 올리기] 버튼 신설.
  - 유저 프롬프트 등록 모달 구현 (`openAddUserPromptModal`).
  - 유저 등록 글 0건일 때 깔끔한 엠티 스테이트 공지 노출.
  - 등록 카드마다 [👍 도움돼요 (N)], [📋 복사하기] 100% 실동작 배선 (12ms 햅틱 포함).
  - 본인 등록 글에는 [🗑️ 삭제] 버튼 제공.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: profiles 테이블 jsonb 필드(`data`) 내 `userPrompts`, `likedPromptIds` 동기화.
- **2호 (스마트 스토리지 분기 설계)**: `state.profile` 갱신 및 `localStorage.setItem('ourgoal_shared_prompts')` 로컬 캐싱 삼중 백업.
- **3호 (4대 뷰 전파 배선도)**: 프롬프트 등록/추천/삭제 시 `saveProfile()` 및 `renderGoalsScreen()` 즉시 재렌더링.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#btnAddUserPrompt` | 프롬프트 서랍 상단 | 탭(클릭) | `openAddUserPromptModal()` 바텀시트 모달 표시 | 12ms 햅틱 제공 |
| `#btnEmptyAddPrompt` | 유저 프롬프트 빈 안내 | 탭(클릭) | `openAddUserPromptModal()` 바텀시트 모달 표시 | 12ms 햅틱 제공 |
| `#btnSubmitUserPrompt` | 등록 모달 내부 | 탭(클릭) | 입력값 검증 후 `userPrompts`에 추가 및 저장 | 제목/내용 누락 시 토스트 경고 |
| `#btnCloseUserPromptModal` | 등록 모달 내부 | 탭(클릭) | 모달 닫기 | 입력 중단 시 안전 닫기 |
| `.btn-like-prompt` | 프롬프트 카드 하단 | 탭(클릭) | 1인 1회 추천 토글, 좋아요 수 증감 반영 | 12ms 햅틱 + 토스트 안내 |
| `.btn-copy-prompt` | 프롬프트 카드 우상단 | 탭(클릭) | 클립보드 복사 및 완료 토스트 | 12ms 햅틱 + 복사 완료 토스트 |
| `.btn-del-prompt` | 본인 프롬프트 카드 | 탭(클릭) | 작성자 본인 확인 후 확인창 거쳐 삭제 | 12ms 햅틱 + 삭제 완료 토스트 |

---

## 4. [원칙 ④] 실행 계획 수립 및 헌법 무결성 (Implementation Planning)
- **4대 변경 컴포넌트**:
  1. `index.html`: `renderPromptEncyclopediaHtml` 유저 프롬프트 목록 렌더링, 엠티 스테이트, 모달 마크업 및 이벤트 리스너 배선.
  2. `ui.css`: 유저 프롬프트 카드, 카테고리 뱃지, 추천 버튼 활성 상태 스타일링.
  3. `scripts/smoke-test.js`: 유저 프롬프트 등록 및 추천 토글 검증 테스트 추가.
  4. `reports/TASK-ES-219/claims.json`: 법정 5대 청구서 완비.

---

## 5. [원칙 ⑤] 실행 및 점진적 배선 (Execution & Incremental Wiring)
- 1단계: 유저 프롬프트 데이터 스키마 및 상태 초기화 (`userPrompts`, `likedPromptIds`).
- 2단계: 프롬프트 백과사전 상단 버튼 및 유저 프롬프트 피드 목록 렌더링.
- 3단계: 나만의 프롬프트 등록 모달 및 유효성 검사 로직 구현.
- 4단계: 1인 1회 도움돼요 추천 토글 및 클립보드 복사 인터랙션 배선.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedural Re-Verification)
- `node scripts/verify-integrity-gate.js` 38대 게이트 전수 통과 확인.
- `npm test` 336개 이상 테스트 전수 ALL PASS 확인.
- `node scripts/verify-all-clicks.js` 데드클릭 0건 확인.
- 8원칙 린터 기계적 무결성 100% 통과 확인.

---

## 7. [원칙 ⑦] 피드백 및 체감 가설 검증 (Feedback & User Experience Validation)
- 모바일 375px 뷰포트에서 프롬프트 백과사전 등록 모달 및 피드 카드 레이아웃 검증.
- 추천 토글 시 실시간 숫자 증감 및 활성 테두리/컬러 피드백 체감 검증.
- 복사 버튼 탭 시 클립보드 정상 복사 및 토스트 가독성 검증.

---

## 8. [원칙 ⑧] 지식화 및 노션 SSOT 동기화 (Knowledge Base & SSOT Sync)
- `docs/rules/TICKETS.md` 티켓 상태 동기화 (#TASK-ES-219).
- 노션 생각 메모장 DB (`3dc598db-9096-81ef-8ee0-cf8c1c126795`) 89번 완료 상태 업데이트.
- 구현 상세 및 스펙 영구 지식베이스 자산화.
