# REQ-template-encyclopedia-3types: 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템 요구사항 정의서
# (헌법 버전: 2026.09.18-SUPREME-15-ARTICLES-VISUAL-INTEGRITY-ENHANCED 준수 정본)

> **문서 상태**: 기획 정의 완료 (상민 대표님 지침 100% 반영)  
> **작성 일시**: 2026-09-19  
> **귀속 본질 축**: **E1 (체크인 루프)** & **E3 (동류 소통 및 팀 협업)**  
> **티켓 번호**: `#TASK-ES-189`  
> **적용 범위**: `index.html`, `js/`, `docs/specs/`, `scripts/smoke-test.js`  

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

### 1-1. 상민 대표님 지시 원문
> "템플릿 백과사전 잘 분리했는데, 템플릿 백과사전을 누르면 개인목표 백과사전과 팀 목표 백과사전, 루틴 백과사전 버튼을 다시 두고, 그 버튼들을 눌렀을 때 그에 맞는 템플릿들이(각각 ai추천 템플릿과 실사용자 템플릿으로 나뉘어야 함) 보여지고 그것을 각각 개인목표, 루틴, 팀 목표에 이식할 수 있어야 함" ➔ "진행하고 프리뷰로 확인할 수 있게 해"

### 1-2. 기저 3층위 심층 분석
1. **1층 (표면적 현상: Single-Domain Limitation)**:
   - 현재 템플릿 백과사전은 '개인 목표' 템플릿만 다루고 있어, 사용자가 루틴(반복 습관)이나 팀 목표(함께 실천하는 챌린지) 템플릿을 탐색하고 이식할 수 있는 창구가 전무함.
2. **2층 (구조적 결합: Disconnected Loop Synergies)**:
   - 아워골의 3대 목표 축은 [개인 목표], [루틴], [팀 목표]로 완벽히 분리되어 있으나, 템플릿 백과사전이 이를 통합 수용하지 못해 각 영역의 온보딩/템플릿 복제 파이프라인이 단절됨.
3. **3층 (시스템 괴리: 2x3 Matrix Information Architecture Absence)**:
   - [목표 대상 3종 (개인/루틴/팀)] × [출처 2종 (AI 추천/실사용자)]의 체계적인 매트릭스 IA 및 도메인별 자동 분기 이식(Transplant Router) 시스템이 부재함.

### 1-3. 대상 사용자 페르소나 및 발생 상황
- **개인 목표 실천자**: 혼자서 4~12주 동안 완수할 검증된 마일스톤형 목표를 찾는 유저.
- **반복 루틴 도전자**: 매일 아침 미라클 모닝, 뽀모도로 집중 등 시간대별 실천 습관을 세우고 싶은 유저.
- **팀 모임장 및 크루원**: 스터디나 러닝 크루원들을 모아 함께 달릴 팀 챌린지 템플릿이 필요한 유저.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

### 2-1. 본질 (Essence)
- 본 작업의 본질은 **"템플릿 백과사전을 아워골 3대 축(개인 목표·루틴·팀 목표) 전체를 아우르는 통합 템플릿 플랫폼으로 완성하고, 각 도메인별 원장 데이터로의 1초 직통 이식 파이프라인을 확립하는 것"**이다.

### 2-2. 원인 (Root Causes)
1. 템플릿 백과사전 렌더러가 개인 목표 위주로만 하드코딩되어 있었음.
2. 루틴과 팀 목표에 특화된 AI 추천 및 실유저 템플릿 데이터셋이 백과사전 UI에 연결되지 못함.
3. 이식(Transplant) 실행 시 해당 대상 서브탭(`personal`, `routine`, `team`)과 원장(`profile.goals`, `settings.routines`, `teamGoals`)으로 자동 라우팅되는 로직이 부재함.

### 2-3. 중심 (Core Bottleneck)
- **"3대 도메인(개인/루틴/팀) × 2대 출처(AI/실사용자) 6중 매트릭스 렌더링 및 맞춤형 이식 핸들러 배선"**:
  - 도메인 선택에 따라 적절한 템플릿 카드들이 즉시 필터 렌더링되고,
  - '담기' 클릭 시 해당 도메인의 올바른 스키마로 데이터가 주입된 후 해당 서브탭으로 화면이 부드럽게 자동 전환되어야 함.

### 2-4. 핵심 (Critical Anchor)
- **Zero Data Loss & Accurate Domain Routing**:
  - 개인목표 담기 ➔ `state.profile.goals` 적립 ➔ `personal` 탭 전환
  - 루틴 담기 ➔ `state.profile.settings.routines` 적립 ➔ `routine` 탭 전환
  - 팀목표 담기 ➔ `state.teamGoals` 적립 ➔ `team` 탭 전환
  - 기존 유저 데이터 100% 보존 및 `saveProfile()` 서버 원장 영속화.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

### 3-1. 하지 말 것 vs 할 것
- **하지 말 것**:
  - 3개 백과사전을 모달 팝업으로 난잡하게 띄우는 행위.
  - 도메인별 데이터 구조를 무시하고 억지로 단일 배열에 쑤셔 넣는 행위.
- **할 것**:
  - 템플릿 백과사전 상단에 **[ 🎯 개인목표 백과사전 ] [ ⏰ 루틴 백과사전 ] [ 👥 팀 목표 백과사전 ]** 3대 버튼 세그먼트 탑재.
  - 하단에 **[ 🤖 AI 추천 템플릿 ] [ 👥 실사용자 템플릿 ]** 2대 출처 전환 탭 탑재.
  - 도메인별 최적화된 템플릿 카드(마일스톤/시간대/팀원규칙) 및 1초 이식 CTA 완결 배선.

### 3-2. 스토리지 원장화 3대 명세 (헌법 제2조 제4항)
1. **1호 (원격 DB 스키마 명세)**:
   - 개인목표: `profiles.goals` JSONB
   - 루틴: `profiles.settings.routines` JSONB
   - 팀목표: `team_goals` 테이블 및 `profiles.team_goals` 호환 배열.
2. **2호 (스마트 스토리지 분기 설계)**:
   - 이식 즉시 `state` 및 `localStorage` 동기화, `saveProfile()`로 원장 영속화.
3. **3호 (4대 뷰 전파 배선도)**:
   - 이식 후 `saveProfile()` ➔ `renderGoalsScreen()`, `renderHome()`, `renderRecordsScreen()`, `renderCalendar()` 동시 호출.

### 3-3. 전수 인터랙션 (Zero-Dead-Click) 명세표
| 요소 ID / 셀렉터 | 이벤트 | 트리거 동작 | 피드백 및 결과 |
| :--- | :---: | :--- | :--- |
| `[data-encycl-domain]` | click | 3대 도메인(개인/루틴/팀) 선택 | 해당 도메인 카탈로그 즉시 렌더링 |
| `[data-encycl-source]` | click | 2대 출처(AI/실사용자) 선택 | AI 60선 vs 실사용자 공유 템플릿 전환 |
| `.btn-transplant-domain` | click | 맞춤형 이식 함수 호출 | 원장 적립, 토스트 안내, 해당 서브탭 자동 이동 |

### 3-4. 시각적 IA 및 시맨틱 통합 배선도 (헌법 제2조 제6항)
```
[📖 템플릿 백과사전]
  ├─ [1단 도메인 탭] [🎯 개인목표]  [⏰ 루틴]  [👥 팀 목표]
  ├─ [2단 출처 탭]   [🤖 AI 추천 템플릿]  [👥 실사용자 템플릿]
  ├─ [3단 필터/검색] 카테고리 칩 + 키워드 검색창
  └─ [4단 카드 목록] 도메인별 리치 템플릿 카드
       └─ [⚡ 내 목표/루틴/팀에 바로 담기 (1초 맞춤 이식)]
```

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)

### 4-1. 맹점 및 허점 비판적 분석
1. **루틴 및 팀목표 중복 등록 방지**:
   - 동일한 루틴 템플릿을 연달아 담았을 때 ID 충돌 방지 ➔ `Date.now()` 기반 고유 ID 생성 필수.
2. **팀 목표 이식 시 미로그인 게스트 처리**:
   - 게스트 상태에서 팀 목표 템플릿을 담을 때 로컬 `state.teamGoals`에 정상 적립되어 체험 가능하도록 안전 배선.
3. **모바일 반응형 터치 영역**:
   - 1단 3개 버튼과 2단 2개 버튼이 375px 모바일 뷰포트에서 답답하지 않도록 균등 분할 및 패딩 최적화.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)

1. **Step 1: 템플릿 데이터셋 구축**:
   - 개인목표 템플릿 (AI 60선 + 실유저 4종)
   - 루틴 템플릿 (AI 추천 6종 + 실유저 4종)
   - 팀목표 템플릿 (AI 추천 6종 + 실유저 4종)
2. **Step 2: 이식 파이프라인 함수 구현**:
   - `transplantPersonalGoal(tmplId)`
   - `transplantRoutine(tmplId)`
   - `transplantTeamGoal(tmplId)`
3. **Step 3: `renderTemplateEncyclopediaScreen()` UI 전면 개편**:
   - 1단 도메인 세그먼트 + 2단 출처 세그먼트 + 검색창 + 카드 렌더링.
4. **Step 4: 무결성 테스트 및 자동화 검증**:
   - `scripts/smoke-test.js`에 `#TASK-ES-189` 검증 추가, `npm test` ALL PASS.
5. **Step 5: CDP 실측 스크린샷 캡처 및 시각 감사**.
6. **Step 6: 로컬 main 병합 (4단계) 및 Vercel 프리뷰 배포 (5A)**.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

### 6-1. 단일 실패점(SPOF) 및 가설 검증
- **검증 1**: 루틴 이식 시 `state.profile.settings.routines`가 undefined일 경우 ➔ 안전 가드(`state.profile.settings.routines = state.profile.settings.routines || []`) 필수 배선.
- **검증 2**: 팀 목표 이식 시 팀 목표 서브탭(`team`) 렌더러와의 연동 ➔ `state.goalsSubTab = 'team'` 후 `renderGoalsScreen()` 호출 시 즉시 렌더링 확인.
- **재검증 도출 수정사항**:
  - 이식 후 해당 서브탭 전환 시 알맞은 렌더러(`renderGoalsScreen()`)와 전역 뷰 갱신(`renderAll()`)을 함께 호출하도록 시퀀스 확정.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)

1. **기능 기준**:
   - 템플릿 백과사전 내 [개인목표], [루틴], [팀목표] 3대 버튼 상호 전환 100% 정상.
   - 각 도메인별 [AI 추천], [실사용자] 2대 탭 전환 100% 정상.
   - 개인목표 담기 ➔ 개인목표 서브탭 자동 이동 & 마운틴 트레일에 즉각 표출.
   - 루틴 담기 ➔ 루틴 서브탭 자동 이동 & 루틴 목록에 즉각 표출.
   - 팀목표 담기 ➔ 팀목표 서브탭 자동 이동 & 팀 카드에 즉각 표출.
2. **기술 기준**:
   - `npm test` 327개 이상 ALL PASS.
   - `verify-integrity-gate.js` 22개 게이트 ALL PASS.
   - 375×812 실측 캡처 완료.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)

1. **블로커 시나리오**: 팀 목표 데이터 스키마 불일치로 인한 렌더링 에러.
   - ➔ 대응: 기존 `CREATOR_TEMPLATES` 및 `teamGoals` 스키마 100% 호환 구조로 생성.
2. **롤백 계획**:
   - `git checkout main && git branch -D feat/template-encyclopedia-3types-es189`로 즉각 원복.
