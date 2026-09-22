# 요구사항 정의서 (REQ) — 소통탭 상단 6대 서브탭 버튼 가로너비 균등 비율 및 글자 크기·패딩 반응형 최적화

> **문서 ID**: REQ-TASK-ES-247-COMM-SUBTABS-GRID-RESPONSIVE  
> **티켓 연계**: #TASK-ES-247  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문**:
  > *"90번 완료처리하고, 89번부터. 번호대로 계속 하나씩 간다"*  
  > ➔ 노션 '💡 아워골 생각 메모장 (명령대기 & 아이디어 DB)' 117번 항목:  
  > **"소통탭의 6대 버튼 가로너비에 맞게 알맞은 비율 및 글자크기 조정."** 착수.
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 소통 탭 상단의 6대 서브탭 버튼(.comm-subtabs-clean)이 모바일 기종(360px~430px)에 따라 좌우 패딩과 글자 크기 불균형으로 인해 시각적 쏠림이 발생할 여지가 있음.
  2. 좁은 모바일 화면(360px~375px)에서 버튼 내부 글자가 넘치거나 줄바꿈되지 않도록 방지하는 텍스트 줄바꿈 방지 및 말줄임표 처리가 더욱 정밀하게 보강되어야 함.
  3. 활성 상태 버튼과 비활성 버튼의 시인성 명암 대비를 강화하여 사용자가 현재 머무르고 있는 서브탭을 즉각 인지할 수 있어야 함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**:
    - 3열 2행(repeat(3, 1fr)) 반응형 패딩(0 6px, 0 4px) 및 min-height(38px) 미세 튜닝 부재.
  - **2층 (구조/프로세스 부재)**:
    - 360px, 375px, 480px 다단계 모바일 반응형 미디어 쿼리 튜닝 누락.
  - **3층 (시스템/유저 체감 괴리)**:
    - 사용자는 한 손으로 엄지 조작 시 6개 버튼이 정갈한 그리드로 정돈되어 탭 전환이 쾌적하길 원함.
- **사용자 상황 및 페르소나**:
  - iPhone SE, Galaxy 등 다양한 디바이스에서 소통 탭에 접속하여 피드, 마니또, 팀피드 간을 신속하게 전환하는 모바일 유저.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 축 (Essence Axis)**: UI/UX & E3 (소통 탭 6대 서브탭 3×2 균등 분할 및 모바일 반응형 타이포그래피 정돈)
- **[본질] (Essence)**:
  - 이 기능의 본질은 **"소통 탭 6대 서브탭 버튼의 가로너비를 3열 균등 비율(repeat(3, 1fr))로 완벽 분배하고, 360px~430px 전 구간에서 글자 잘림 없는 폰트 크기(13px~11.5px)와 대칭 패딩을 제공하는 고정밀 반응형 서브탭 그리드 엔진"**이다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (버튼 내부 여백 및 폰트 미세 조정 필요)**:
     - 좁은 뷰포트에서 아이콘과 라벨이 자연스럽게 중앙 정렬되도록 대칭 패딩(0 6px / 0 4px) 정비 필요.
  2. **원인 2 (반응형 폰트 계층 체계화 필요)**:
     - 480px, 375px 단계별 폰트 스케일링 체계 강화 필요.
  3. **원인 3 (활성 상태 명암 대비 극대화)**:
     - 선택된 서브탭의 테두리와 배경색을 고대비로 정돈하여 활성 탭 식별성 제고.
- **[중심] (Core Bottleneck & Anchor)**:
  - `ui.css` 내 `.comm-subtabs-clean.comm-subtabs-grid`에 `grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 4px;`, `min-height: 38px;`, `font-size: 0.8125rem;`, `white-space: nowrap;`, `text-overflow: ellipsis;` 반응형 규칙 완결.
- **[핵심] (Critical Safety & Termination)**:
  - 기존 6대 서브탭(feed, team, hall, dm, manito, share) 키값 및 헌법 게이트 단언문 100% 보존.
  - Zero Dead-Click 100% ALL PASS.
  - `npm test` 336개 이상 전체 통과.
- **체감 가설 (User Experience Hypothesis)**:
  > *"소통 탭 상단 6대 버튼이 정교한 3열 블록으로 단정하게 안착하여, 글자 깨짐 없이 한 손 터치로 원하는 서브탭에 1초 만에 이동한다."*
- **기존 전체 기능 영향도 분석**:
  - 서브탭 CSS 반응형 규칙 튜닝 외 비즈니스 로직 변경 0건.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말아야 할 것 (Avoid)**:
  - 기존 헌법 단언 대상인 `subtabsList`의 key 또는 label 구조를 훼손하지 않는다.
  - `sticky` 네비게이션 동작을 방해하지 않는다.
- **해야 할 것 (Action)**:
  - `ui.css`에 `.comm-subtabs-clean.comm-subtabs-grid` 3열 균등 그리드 규칙 선언.
  - 480px 및 375px 미디어 쿼리를 통해 모바일 해상도별 정밀 패딩 및 폰트 튜닝.
  - 활성 상태(.active)에 1.5px 테두리와 소프트 배경색 적용.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 변경 없음.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 상태 영향 없음.
- **3호 (4대 뷰 전파 배선도)**: 기존 서브탭 렌더링 유지.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `.comm-subtab` (6종) | 소통 탭 상단 | 클릭 | `state.commSubTab` 전환 및 서브화면 렌더링 | 12ms 햅틱 + 활성 스타일 전환 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 유저 데이터 변경 0건.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)

- **비판적 자기 검토 및 약점/한계 인정**:
  - 360px 극소형 단말기에서도 텍스트가 잘리지 않도록 폰트 크기(0.72rem) 및 대칭 패딩(0 3px) 완비.
- **엣지 케이스 (Edge Cases)**:
  - DM 읽지 않은 메시지 뱃지(`#dmSubtabBadge`) 노출 시에도 너비 초과 없이 조화로운 렌더링.
  - 4대 테마 전수 대비율 4.5:1 이상 검증.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

- **구체적 실행 시퀀스**:
  1. [단계 1]: `ui.css` 내 `.comm-subtabs-clean.comm-subtabs-grid` 및 버튼 튜닝 스타일 추가.
  2. [단계 2]: 480px 및 375px 반응형 미디어 쿼리 정의.
  3. [단계 3]: `scripts/smoke-test.js`에 #TASK-ES-247 무결성 단언문 추가.
  4. [단계 4]: `npm test` 실행 및 38개 헌법 게이트, Zero Dead-Click 100% PASS 확인.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - 순수 CSS 스타일 튜닝으로 스크립트 장애 위험 0%.
- **가정의 타당성 검증**:
  - 3열 균등 분배(repeat(3, 1fr))로 360px~430px 전 모바일 기기에서 6대 버튼이 대칭 균형을 이룸.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- `grid-template-columns: repeat(3, 1fr)` 및 13px/12px 반응형 폰트 확립.
- `npm test` 336개 이상 전체 PASS (0 failure).
- 헌법 무결성 5대 게이트 38개 전수 ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 연계 티켓: #TASK-ES-247 (본질축: UI/UX & E3)
- 노션 DB 117번 항목과 완벽히 1:1 일치.
