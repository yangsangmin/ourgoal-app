# 요구사항 정의서 (REQ) — 피드 게시 모달 내 '미리보기' 버튼 추가 및 피드 렌더링 사전 확인 기능 구현

> **문서 ID**: REQ-TASK-ES-301-FEED-POST-PREVIEW-MODAL  
> **티켓 연계**: #TASK-ES-301  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "게시하기 버튼 누르면 현재는 취소/피드에 게시하기로 통제할 수 있는데, 취소 / 미리보기 / 피드에 게시하기로 변경하고 미리보기 누르면 실제 피드에 어떻게 노출되는지 사전에 확인 가능하게 해…" (노션 생각 메모장 DB [51]번)
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 사용자가 피드 글을 작성할 때 내용과 이미지가 실제 피드 화면에서 어떻게 조형되고 줄바꿈되는지 사전에 확인할 수 없어 게시 후 수정/삭제를 반복해야 하는 번거로움 발생.
- **표면 아래 기저 층위 분석**:
  - **1층 (사전 검증 부재)**: 게시 전 피드 카드의 시각적 렌더링 프리뷰 인터페이스 누락.
  - **2층 (인터랙션 단절)**: 모달 하단 버튼 액션이 '취소'와 '게시'로만 양분되어 있어 '작성 중 확인' 루프가 단절됨.
  - **3층 (사용자 체감)**: 동류들과 소통하는 아워골 피드(E3)에서 자신의 게시글 완성도를 사전에 안심하고 점검할 수 있는 직관적 UX 필요.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E3 (동류 발견 및 소통) / UX
- **[본질] (Essence)**: 피드 게시 전 실제 카드 형태의 무손실 실시간 프리뷰를 통해 완벽한 게시 경험 제공.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 피드 게시 모달 내 3버튼 체계('취소' / '미리보기' / '피드에 게시하기')의 동적 렌더링 배선 미흡.
  2. **원인 2**: 텍스트 및 사진 입력값을 실시간 반영하는 독립된 프리뷰 슬롯(`#sharePreviewSlot`) 연동 부재.
  3. **원인 3**: 4위 1체(마크업-리스너-로직-피드백) 직통 제어 허브 미비.
- **[중심] (Core Bottleneck & Anchor)**: 피드 모달 내 `#sharePreviewBtn` 클릭 시 모달 내 `#sharePreviewSlot`에 실시간 피드 카드를 렌더링하고 토글하는 직통 파이프라인.
- **[핵심] (Critical Safety & Termination)**: 기존 피드 게시, 사진 업로드, 댓글 및 좋아요 기능 100% 무손실 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"피드 게시 모달에서 '미리보기'를 누르면 즉시 하단에 실제 피드 카드와 똑같은 모습이 펼쳐져 글과 사진 배치를 한눈에 확인하고 안심하고 게시할 수 있다."*

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**: 기존 피드 렌더링 엔진 분리, 불필요한 서버 통신 추가.
- **해야 할 것 (Action)**:
  1. `index.html` 내 피드 모달에 `#sharePreviewBtn` 및 `#sharePreviewSlot` 마크업 확립.
  2. 미리보기 버튼 클릭 시 실시간 입력 텍스트와 선택된 사진/프로필을 기반으로 피드 카드 마크업을 동적 생성하여 표출하는 인터랙션 완성.
  3. 홈 화면에 `#og-task-51-container` 및 `#og-task-51-action-btn` 마운트.
  4. `js/components.js`에 `handle소통_Item51Action`, `openFeedPostPreviewModal`, `toggleFeedPostPreview` 4위 1체 배선 (12ms 햅틱, `og_task-51_cache` 원자적 캐싱, 4대 뷰 동시 전파).
  5. `ui.css`에 44px 터치 규격 및 375px 모바일 반응형 스타일 반영.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase `user_interactions` 내 `task-51` 메타데이터 연동.
- **2호 (스마트 스토리지 분기 설계)**: `og_task-51_cache` 로컬 캐시 원자적 갱신.
- **3호 (4대 뷰 전파 배선도)**: 액션 발동 시 `renderHome`, `renderCommScreen`, `renderCalendar`, `renderGoalsScreen`, `renderRecordsScreen` 동시 호출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#sharePreviewBtn` | 피드 게시 모달 | 클릭/터치 | 작성 중인 텍스트/사진 기반 실시간 피드 프리뷰 토글 | 12ms 햅틱 + 토스트 '미리보기를 갱신했어요' |
| `#og-task-51-action-btn` | 홈 화면 피드 프리뷰 허브 | 클릭/터치 | 피드 사전 확인 기능 상태 동기화 및 뷰 전파 | 12ms 햅틱 + 토스트 알림 |

---

## 4. [원칙 ④] 구현 즉시 완료 (Immediate Completion Plan)
- **코드 수정 범위**:
  - `index.html`: `#og-task-51-container`, 피드 게시 모달 내 `#sharePreviewBtn` 및 `#sharePreviewSlot` 배선
  - `js/components.js`: `handle소통_Item51Action`, `openFeedPostPreviewModal`, `toggleFeedPostPreview`
  - `ui.css`: `#og-task-51-container`, `#og-task-51-action-btn`, `#sharePreviewSlot`
  - `tests/feed-post-preview-modal.test.js`: 단위 및 통합 검증
  - `scripts/smoke-test.js`: 스모크 단언문 추가
- **완료 정의 (DoD)**:
  1. 피드 게시 모달 내 '취소 / 미리보기 / 피드에 게시하기' 3버튼 체계 완결.
  2. 미리보기 버튼 클릭 시 실시간 피드 카드 렌더링 및 토글 정상 동작.
  3. 모든 버튼 dead-click 0건, 44px 터치 규격 만족, 375px 모바일 핏.
  4. smoke-test 및 court 검사 ALL PASS 달성.
