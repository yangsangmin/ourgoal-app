# 요구사항 정의서 (REQ) — 소통탭 게시하기 버튼 먹통 오류 수정 및 정상 동작 복구

> **문서 ID**: REQ-TASK-ES-281-COMM-POST-FEED-BUTTON-FIX  
> **티켓 연계**: #TASK-ES-281  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "소통탭 게시하기 버튼 작동 안함"
- **현재 발생하는 문제 및 한계 (표면적 현상)**: 소통 탭 헤더 우측의 `게시하기` 버튼(`#btnCommPostFeed`)을 클릭해도 모달이 열리지 않거나 무반응으로 멈추는 먹통(Dead Click) 현상이 발생하여, 유저가 피드 글과 인증 사진을 공유하지 못함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: `index.html` 인라인 핸들러에서 `openShareToFeedModal` 함수 준비 상태에 따라 간헐적 미호출 및 에러 억락(Silent Failure) 발생 가능.
  - **2층 (구조/프로세스 부재)**: 버튼 클릭 시 즉각적인 인터랙션 피드백(햅틱, 로딩/디바운스, 시각적 상태 전이)과 안전 폴백 직통 핸들러 부재.
  - **3층 (시스템/유저 체감 괴리)**: 피드 공유는 동류 소통의 핵심 엔트리포인트인데 버튼이 작동하지 않아 유저 효능감과 커뮤니티 신뢰도가 급격히 저하됨.
- **사용자 상황 및 페르소나**: 소통 탭에서 오늘의 실천과 인증을 동료들과 빠르게 나누고자 하는 모바일 375px 실사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E3 (동류 소통 및 피드 참여) / FIX / UX
- **[본질] (Essence)**: 소통 탭 게시하기 진입점의 100% 무결한 모달 오픈 및 안전 인터랙션 복구.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 스크립트 실행 순서에 따른 `window.openShareToFeedModal` 미정의 상태의 방어 코드 및 폴백 부재.
  2. **원인 2**: 사용자 터치 시 즉각적인 12ms 햅틱 및 디바운스 락 결여로 인한 무반응 오인.
  3. **원인 3**: 4위 1체(마크업-리스너-로직-피드백) 직통 아키텍처 미탑재.
- **[중심] (Core Bottleneck & Anchor)**: `handle소통_Item30Action` 직통 핸들러 배선, `#btnCommPostFeed` 직통 바인딩, `openShareToFeedModal` 호출 보장 및 폴백 시트 기동.
- **[핵심] (Critical Safety & Termination)**: 기존 피드 목록, 댓글, 응원 인터랙션 데이터의 100% 불파괴 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 소통 탭의 '게시하기' 버튼을 터치하면 12ms 햅틱 피드백과 함께 즉각 피드 작성 모달이 열려, 어떤 상황에서도 끊김 없이 소통을 이어갈 수 있다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인(세션, 게스트, 소셜)에 미치는 영향: 영향 없음 (세션 유지).
  - 홈 화면 및 스트릭에 미치는 영향: 영향 없음 (데이터 불변 보존).
  - 기록/통계/캘린더 탭에 미치는 영향: 4대 뷰 동시 전파로 상태 일관성 보장.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**: 기존 피드 렌더링 엔진 전체 재작성, 필수 DOM 구조 파괴, 불필요한 서드파티 라이브러리 도입.
- **해야 할 것 (Action)**:
  1. `js/team-invite-comm.js`에 `handle소통_Item30Action` 직통 핸들러 구현 및 `window` 전역 노출.
  2. `index.html` 소통 탭 내 `#btnCommPostFeed`의 인라인 onclick 및 리스너 보강.
  3. 소통 화면 내 4위 1체 `#og-task-30-container` 및 `#og-task-30-action-btn` 마크업 마운트.
  4. 12ms 햅틱 피드백, `og_task-30_cache` 로컬 캐시 원자적 저장, 4대 뷰 동시 전파.
  5. 모바일 375px 44px 이상 터치 규격 및 가로 넘침(0px) 방어 CSS 탑재.
- **왜 이 방식이어야만 하는가 (Why this approach)**: 상민님 지시를 100% 충족하면서 기존 헌법 38대 게이트 및 스모크 테스트와 완벽히 공존하는 최적의 해법.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase `feed_posts` 및 `user_interactions` 호환 보존.
- **2호 (스마트 스토리지 분기 설계)**: `og_task-30_cache` 로컬 캐시 원자적 갱신.
- **3호 (4대 뷰 전파 배선도)**: 액션 발동 시 `renderHome`, `renderRecordsScreen`, `renderCalendar`, `renderGoalsScreen` 원자적 동시 호출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `btnCommPostFeed` | 소통 탭 헤더 우측 | 클릭/터치 | `handle소통_Item30Action` 호출, 피드 공유 모달 오픈 | 12ms 햅틱 + 모달 표출 + 미준비 시 안전 폴백 |
| `og-task-30-action-btn` | 소통 탭 허브 내 | 클릭/터치 | `handle소통_Item30Action` 호출, 피드 작성 모달 연동 | 12ms 햅틱 + 상태 토스트 + 4대 뷰 동시 전파 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **피드 게시글 보존**: 기존 피드 목록 및 댓글 데이터 100% 보존.
- **아바타 보존**: 기존 아바타 데이터 100% 보존.
- **목표 데이터 보존**: 기존 목표 리스트 및 마일스톤 불변 보존.
- **기록 데이터 보존**: 과거 일정 및 첨부자료 100% 무손실 유지.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: `openShareToFeedModal`이 비동기로 로드되거나 모달 DOM이 지연 마운트될 때를 대비해, 재시도 폴백 및 시트 직접 오픈 로직을 병행 구축.
- **기존 기능과의 충돌 가능성 검토**: 기존 `#btnCommPostFeed`의 onclick 속성과 리스너 충돌 방지 및 안전 체이닝 적용.
- **엣지 케이스 (Edge Cases)**:
  - 모달 엘리먼트(`modalSheet`) 미존재 시: 에러 없이 콘솔 경고 후 토스트 안내.
  - 고속 연타 터치 시: 300ms 디바운스 락으로 중복 모달 오픈 방지.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. `js/team-invite-comm.js`에 `handle소통_Item30Action` 구현 및 전역 노출.
  2. `index.html` 소통 탭에 `#og-task-30-container` 마크업 마운트 및 `#btnCommPostFeed` 바인딩 보강.
  3. `ui.css`에 44px 터치 타겟 반응형 스타일 추가.
  4. `tests/comm-post-feed-button-fix.test.js` 단위 테스트 작성 및 통과 확인.
  5. `scripts/smoke-test.js`에 #TASK-ES-281 단언문 추가.
- **화면 간 상호연동 전파 규격**:
  - 변경 발생 지점: `handle소통_Item30Action` 호출 시.
  - 연계 갱신 화면: `renderHome`, `renderRecordsScreen`, `renderCalendar`, `renderGoalsScreen`.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: DOM 요소 누락 시에도 안전 가드(`try...catch`)로 감싸 앱 크래시 방지.
- **가정의 타당성 검증**: 모달 오픈 함수가 존재하지 않는 극단적 상황에서도 토스트와 햅틱으로 유저에게 상황을 전달.
- **재검증 결과 도출된 절차 수정/보완사항**: 게시하기 버튼 클릭 시 시각적 활성 상태 즉각 표시 및 12ms 햅틱 기본 적용.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 모든 인터랙티브 버튼 클릭 시 콘솔 에러 0건.
- `#btnCommPostFeed` 터치 시 100% 피드 모달 오픈 또는 안전 폴백 작동.
- 스모크 테스트 399개 이상 전수 통과.
- 헌법 게이트 38개 항목 100% ALL PASS.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: `openShareToFeedModal` 내부에서 종속 DOM 누락으로 예외 발생.
- **대책**: 내부 호출을 try...catch로 감싸고, 실패 시 대체 모달 오픈 로직 실행.
