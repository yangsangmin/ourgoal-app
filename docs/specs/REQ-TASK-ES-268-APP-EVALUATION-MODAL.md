# 요구사항 정의서 (REQ) — 홈탭 최하단 <아워골 평가해주기> 고정배너 및 90% 팝업 평가폼

> **문서 ID**: REQ-TASK-ES-268-APP-EVALUATION-MODAL  
> **티켓 연계**: #TASK-ES-268 (노션 생각 메모장 [13]번, Page ID: `3dc598db-9096-8186-bff7-ffc1986ebe52`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **귀속 축**: E1 / UX / INFRA (무공해 유저 피드백 루프 및 자가치유 인프라)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > *"테스트 기간에 홈탭 최하단 고정배너로 <아워골 평가해주기> 버튼 생성(나만의 홈 구성에서 바꿀수 없음). 이 버튼을 누르면 팝업창으로 평가폼(양식)이 생성됨(화면의 90%크기로 큰 팝업)*  
  > *팝업창 내용은 종합점수평가 → 100점만점에 몇점 입력가능칸, 장점 → 장점입력칸, 단점 → 단점입력칸, 추가 및 개선요청 → 입력칸, 대표에게 하고싶은 말 → 입력칸(’진짜 맘대로 써주셔도 됩니다. 신고안합니다’ 회색 안내문구를 입력칸안에 표시하고 작성을 시작하면 사라지게)"*
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 홈 탭 최하단 배너 버튼 문구가 `<아워골 평가해주기>` 지시 원문과 일치하지 않고 다소 작은 폰트로 되어 있어 어포던스가 약함.
  2. 나만의 홈 구성 설정 변경 시 실수로 가려지거나 왜곡되지 않도록 완전한 고정 배너로 확정 보호해야 함.
  3. 사용자가 입력한 평가 데이터가 Supabase `app_evaluations` 원장에 실시간 적재되고, 실패 시 로컬 스토리지에 안전 백업되는 종단간(End-to-End) 영속성 파이프라인이 100% 무결하게 보증되어야 함.
  4. 모달 크기가 화면의 정확한 90% (`width: 90vw; height: 90vh;`)로 대형 팝업이어야 하며, 375px 모바일 뷰포트에서 내부 스크롤이 부드럽게 동작해야 함.
- **표면 아래 기저 층위 분석**:
  - **1층 (원격 원장 적재 공백 방어)**: 단순 클라이언트 상태 저장에 그치지 않고 Supabase `app_evaluations` 테이블에 직접 1행 적재를 보장하는 인프라 파이프라인 완결.
  - **2층 (UI 문구 및 크기 정합성)**: 대표에게 하고 싶은 말 입력칸의 플레이스홀더(`진짜 맘대로 써주셔도 됩니다. 신고안합니다`)와 회색 안내 스타일링, 버튼 텍스트의 지시 원문 100% 일치.
  - **3층 (375px 모바일 경험 완결)**: 90% 모달 내에서 키보드가 올라오더라도 내용이 잘리지 않는 안정적 스크롤 영역(`overflow-y: auto; -webkit-overflow-scrolling: touch;`).

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E1 / UX / INFRA
- **[본질] (Essence)**:
  - 실제 사용자의 목소리와 솔직한 개선 의견을 아무런 제약 없이 실시간으로 수집하여, 서비스의 결함을 스스로 치유하고 대표와 개발진이 유저의 체감 고통을 즉각 해결할 수 있도록 하는 최우선 피드백 파이프라인.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 홈 최하단 배너의 버튼 문구 및 어포던스가 지시 원문 `<아워골 평가해주기>`로 강력하게 부각되지 않았음.
  2. **원인 2**: Supabase 직접 저장 파이프라인(`sb.from('app_evaluations').insert(...)`)이 부분적으로 생략되어 원격 영속성이 불완전할 위험이 있었음.
  3. **원인 3**: 90% 대형 모달의 높이 규격이 일부 뷰포트에서 88vh 등으로 미세하게 불일치했음.
- **[중심] (Core Bottleneck & Anchor)**:
  - 홈 탭 최하단에 나만의 홈 구성 토글과 독립된 `<아워골 평가해주기>` 고정 배너 확립.
  - 화면 90% 크기(`width: 90vw; height: 90vh;`)의 대형 모달과 5대 입력 폼(종합점수 100점, 장점, 단점, 개선요청, 대표에게 하고싶은말 플레이스홀더) 완비.
  - Supabase `app_evaluations` + 로컬 `profile.settings.appEvaluations` 2중 영속화.
- **[핵심] (Critical Safety & Termination)**:
  - 375px 모바일 뷰포트에서 가로 스크롤/넘침 0건, 44px 터치 타겟 보증.
  - 제출 시 로딩 상태 표시, 중복 클릭 방지, 제출 성공 시 12ms 햅틱 및 감사 토스트.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 홈 탭을 둘러보다가 최하단에서 눈에 띄는 <아워골 평가해주기> 배너를 발견하고 탭했을 때, 시원한 90% 대형 팝업이 뜨며 편안하게 자신의 솔직한 평가를 남기고 즉각 감사 피드백을 받는다."*

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 나만의 홈 구성(위젯 토글) 목록에 평가 배너를 넣어 유저가 실수로 숨길 수 있게 만드는 행위 금지 (나만의 홈 구성에서 바꿀 수 없음).
  - 평가 제출 시 입력값을 유실시키거나 에러로 인해 모달이 멈추는 행위 금지.
  - 불필요한 서드파티 폼 라이브러리를 추가하여 번들을 무겁게 만드는 행위 금지.
- **해야 할 것 (Action)**:
  1. `index.html`:
     - 홈탭 최하단 고정 배너(#homeEvalBanner) 버튼 텍스트를 지시 원문 그대로 `<아워골 평가해주기>`로 정돈하고 어포던스 강화.
     - 화면 90% 대형 모달(#appEvaluationModal) 규격 확정:
       - 1. 종합점수평가: 100점 만점 숫자 입력 (`#evalScoreInput`, 0~100)
       - 2. 장점: 장점 입력칸 (`#evalProsInput`)
       - 3. 단점: 단점 입력칸 (`#evalConsInput`)
       - 4. 추가 및 개선요청: 입력칸 (`#evalImprovementsInput`)
       - 5. 대표에게 하고 싶은 말: 입력칸 (`#evalCeoMsgInput`, `placeholder="진짜 맘대로 써주셔도 됩니다. 신고안합니다"`)
     - 제출 핸들러: `sb.from('app_evaluations').insert(...)` 직접 연동 + 서버 API 호출 + 로컬 스토리지 안전 보관 3중화.
  2. `ui.css`:
     - `.eval-modal-sheet` 크기를 `width: 90vw; height: 90vh; max-height: 90vh;`로 확정하고 모바일 375px 최적화.
     - 플레이스홀더 회색 안내 스타일 보증.
  3. 테스트 및 검증:
     - `tests/app-evaluation-modal.test.js` 신설.
     - `scripts/smoke-test.js` 단언 추가.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: `app_evaluations` (테이블: `id`, `user_id`, `user_name`, `score`, `pros`, `cons`, `improvements`, `ceo_msg`, `created_at`)
- **2호 (스마트 스토리지 분기 설계)**: Supabase 직접 적재 ➔ 서버 `/api/inquiry` 적재 ➔ 로컬 `profile.settings.appEvaluations` 백업.
- **3호 (4대 뷰 전파 배선도)**: 평가 제출 후 토스트 표출 및 모달 닫기, 홈 탭 유지.

### 3-2. 전수 인터랙션 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#btnOpenEvalModal` | 홈 최하단 고정 배너 | 클릭 / 탭 | 90% 크기 대형 모달(#appEvaluationModal) 오픈 | 12ms 햅틱 |
| `#btnAppEvalClose` | 모달 우측 상단 | 클릭 / 탭 | 모달 닫기 | - |
| `#appEvaluationModal` (배경) | 모달 백드롭 | 바깥 배경 클릭 | 모달 닫기 | 내부 시트 클릭 시 닫힘 방지 |
| `#evalScoreInput` | 모달 1번 필드 | 숫자 입력 | 0~100 사이 종합 점수 입력 | 100 초과 또는 음수 입력 시 토스트 안내 |
| `#evalCeoMsgInput` | 모달 5번 필드 | 텍스트 입력 | 대표에게 하고싶은 말 입력 | 포커스 및 작성 시 플레이스홀더 자동 숨김 |
| `#btnSubmitAppEval` | 모달 최하단 | 클릭 / 탭 | 데이터 검증 후 Supabase/서버/로컬 적재, 감사 토스트 및 모달 닫기 | 필수 항목 전무 시 '최소 하나 이상 입력' 안내 |

---

## 4. [원칙 ④] 스티브 잡스 디테일 및 UX 무결성 (Steve Jobs Details & UX Integrity)
- **90% 팝업의 시원한 개방감**: 작은 바텀시트가 아닌 화면의 90%를 채우는 쾌적한 팝업으로 유저가 긴 글도 답답함 없이 편안하게 작성할 수 있는 작성 환경 제공.
- **‘신고안합니다’ 플레이스홀더**: 딱딱한 설문조사가 아닌 상민님의 인간적이고 유쾌한 지시 원문 그대로를 노출하여 유저의 심리적 장벽을 완전히 허물고 솔직한 피드백 유도.

---

## 5. [원칙 ⑤] 리스크 검토 및 회귀 방지 (Risk Analysis & Regression Prevention)
- **리스크**: 오프라인 또는 Supabase 통신 일시 장애 시 피드백 유실 위험.
- **대응**: 클라이언트 `profile.settings.appEvaluations`에 즉시 Optimistic 보관하고, 통신 실패 시에도 '네트워크 상태를 확인해주세요. 평가는 안전하게 보관되었습니다' 토스트와 함께 안전하게 처리.

---

## 6. [원칙 ⑥] 완료 조건 정의 및 절차 재검증 (Definition of Done & Re-verification)
1. 홈 탭 최하단에 나만의 홈 구성에서 숨겨지지 않는 `<아워골 평가해주기>` 고정 배너가 존재하는가?
2. 버튼 탭 시 화면의 90% 크기 대형 팝업(#appEvaluationModal)이 정상 오픈되는가?
3. 5대 입력 폼(종합점수 100점, 장점, 단점, 추가개선, 대표에게 하고싶은말 플레이스홀더)이 완비되어 있는가?
4. 평가 제출 시 Supabase `app_evaluations` 및 로컬 백업 파이프라인이 정상 작동하는가?
5. 단위 테스트 `tests/app-evaluation-modal.test.js` 100% 통과.
6. 스모크 테스트 `scripts/smoke-test.js` 및 헌법 게이트 38개 ALL PASS.
7. GitHub Court 판정 및 PR squash 머지 완료.

---

## 7. [원칙 ⑦] 구현 파일 범위 및 회귀 방지 (Target Files & Safety)
- `index.html`: 배너 버튼 텍스트 정돈, 90% 모달 폼 어포던스 및 Supabase 적재 로직 강화.
- `ui.css`: `.eval-modal-sheet` 90vw / 90vh 규격 확정 및 375px 반응형 스타일링.
- `tests/app-evaluation-modal.test.js`: 신규 단위 테스트.
- `scripts/smoke-test.js`: `#TASK-ES-268` 단언 추가.
- `reports/TASK-ES-268/claims.json`: 법정 청구서.
