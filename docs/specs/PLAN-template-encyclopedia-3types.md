# PLAN-template-encyclopedia-3types: 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템 실행 계획서
# (헌법 버전: 2026.09.18-SUPREME-15-ARTICLES-VISUAL-INTEGRITY-ENHANCED 준수 정본)

> **문서 상태**: 실행 계획 승인 대기 (상민 대표님 지침 100% 반영)  
> **작성 일시**: 2026-09-19  
> **귀속 본질 축**: **E1 (체크인 루프)** & **E3 (동류 소통 및 팀 협업)**  
> **티켓 번호**: `#TASK-ES-189`  
> **관련 PR**: PR #325  
> **적용 범위**: `index.html`, `scripts/smoke-test.js`, `docs/specs/`  

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

### 1-1. 상민 대표님 지시 및 요구사항 요약
- 템플릿 백과사전 선택 시 상단에 **[개인목표 백과사전]**, **[루틴 백과사전]**, **[팀 목표 백과사전]** 3대 버튼을 배치한다.
- 각 버튼을 눌렀을 때 그에 맞는 템플릿 카탈로그가 나타나며, 각각 **[AI 추천 템플릿]**과 **[실사용자 템플릿]** 2원화 탭으로 나뉘어야 한다.
- 카드의 '담기' 클릭 시 각각 개인목표, 루틴, 팀 목표 원장에 1초 만에 이식(Transplant)되고, 해당 서브탭(`personal`, `routine`, `team`)으로 자동 라우팅되어 프리뷰로 확인할 수 있어야 한다.

### 1-2. 현재 코드베이스 상태 점검
- `index.html` 내 `renderTemplateEncyclopediaScreen()` 함수는 개인 목표(60선) 위주로만 단일 렌더링되고 있음.
- 루틴 템플릿 및 팀 목표 템플릿을 렌더링하고 각각의 원장(`profile.settings.routines`, `teamGoals`)에 주입하는 전용 핸들러가 부재함.
- `state.goalsSubTab`에 `'encyclopedia'`가 추가되어 있으나, 백과사전 내부 상태(`_subtabTplDomain = 'personal' | 'routine' | 'team'`, `_subtabTplType = 'ai' | 'real'`)가 정규화되지 않음.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

### 2-1. 본질 (Essence)
- 본 작업의 본질은 **"템플릿 백과사전을 아워골 3대 축(개인 목표·루틴·팀 목표) 전체를 아우르는 통합 템플릿 플랫폼으로 완성하고, 각 도메인별 원장 데이터로의 1초 직통 이식 파이프라인을 확립하는 것"**이다.

### 2-2. 원인 (Causes)
1. **단일 도메인 편향**: 기존 템플릿 백과사전이 개인 목표만을 상정하고 설계되어 루틴 및 팀 목표 구조체가 누락됨.
2. **도메인별 템플릿 데이터셋 부재**: 루틴(시간대, 반복 요일, 알림)과 팀 목표(정원, 챌린지 기간, 보증금/규칙) 특화 템플릿 모델이 정립되지 않음.
3. **이식 후 라우팅 단절**: 템플릿 복제 시 개인 목표 외의 루틴 및 팀 목표 원장으로 분기하여 상태를 갱신하고 화면을 전환하는 메커니즘이 없음.

### 2-3. 중심 (Core)
- **"3대 도메인 × 2대 출처 6중 매트릭스 렌더링 및 맞춤형 이식 핸들러 배선"**:
  - 도메인 3종: `personal` (개인목표), `routine` (루틴), `team` (팀 목표)
  - 출처 2종: `ai` (AI 추천 템플릿), `real` (실사용자 템플릿)
  - 각 조합별 템플릿 렌더링 및 클릭 시 고유 원장 주입 + 즉시 해당 서브탭 전환.

### 2-4. 핵심 (Anchor)
- **Zero Data Loss & Accurate Domain Routing**:
  - 개인 목표 이식: `state.profile.goals.unshift(newGoal)` ➔ `state.goalsSubTab = 'personal'` ➔ `renderGoalsScreen()`
  - 루틴 이식: `state.profile.settings.routines.unshift(newRoutine)` ➔ `state.goalsSubTab = 'routine'` ➔ `renderGoalsScreen()`
  - 팀 목표 이식: `state.teamGoals.unshift(newTeamGoal)` ➔ `state.goalsSubTab = 'team'` ➔ `renderGoalsScreen()`
  - 모든 이식 동작 후 `saveProfile()`, `renderAll()` 호출로 4대 뷰 동시 최신화 및 서버 원장 영속화.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective & Efficient Execution)

### 3-1. 아키텍처 및 UI 설계
1. **도메인 선택 세그먼트 (1단 탭)**:
   - 3개 버튼: `🎯 개인목표 백과사전` | `⏰ 루틴 백과사전` | `👥 팀 목표 백과사전`
   - 클릭 시 `window.switchTemplateEncyclopediaDomain(domain)` 실행.
2. **출처 선택 세그먼트 (2단 탭)**:
   - 2개 버튼: `🤖 AI 추천 템플릿` | `👥 실사용자 템플릿`
   - 클릭 시 `window.switchTemplateEncyclopediaSource(source)` 실행.
3. **데이터셋 정의**:
   - `ENCYCLOPEDIA_ROUTINE_TEMPLATES_AI`: 모닝 루틴, 미라클 리딩, 퇴근 후 런닝 등 엄선된 6대 AI 추천 루틴.
   - `ENCYCLOPEDIA_ROUTINE_TEMPLATES_REAL`: 실제 파워 유저들이 공유한 인기 루틴 4종.
   - `ENCYCLOPEDIA_TEAM_TEMPLATES_AI`: 알고리즘 100일 챌린지, 바디프로필 크루 등 6대 AI 추천 팀 목표.
   - `ENCYCLOPEDIA_TEAM_TEMPLATES_REAL`: 인기 스터디/운동 크루 실사용자 팀 템플릿 4종.
   - 기존 60선 개인목표 AI 템플릿 + 실사용자 개인목표 템플릿 4종.
4. **1초 이식(Transplant) 라우터**:
   - `window.transplantEncyclopediaItem(domain, templateId)` 단일 엔트리포인트 구성.
   - 데이터 복제 후 로컬스토리지 백업 및 `saveProfile()`, 토스트 피드백 표시, 해당 서브탭으로 이동.

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)

### 4-1. 엣지 케이스 점검
1. **루틴 배열 미초기화 케이스**:
   - 유저 프로필에 `state.profile.settings.routines`가 없는 경우 빈 배열로 방어 초기화.
2. **팀 목표 구조체 무결성**:
   - `state.teamGoals` 배열 존재 여부 확인 후 불변 주입.
3. **모바일 375px 뷰포트 터치 타겟**:
   - 상단 도메인 3대 버튼 및 2대 출처 탭의 높이를 최소 44px 이상으로 확보하고, 가로 스크롤 또는 유연한 플렉스 래핑 적용으로 텍스트 짤림 방지.

---

## 5. [원칙 ⑤] 계획대로 실행 (Step-by-Step Execution)

- **Step 1**: `index.html` 내 전역 상태 변수 `window._encyclopediaDomain = 'personal'`, `window._encyclopediaSource = 'ai'` 선언.
- **Step 2**: 템플릿 데이터셋(`ENCYCLOPEDIA_ROUTINE_TEMPLATES_AI/REAL`, `ENCYCLOPEDIA_TEAM_TEMPLATES_AI/REAL`, `ENCYCLOPEDIA_PERSONAL_TEMPLATES_REAL`) 추가.
- **Step 3**: `renderTemplateEncyclopediaScreen()` 리팩토링 및 3대 도메인 탭 / 2대 출처 탭 / 리치 카드 렌더러 구현.
- **Step 4**: 이식 라우터 `window.transplantEncyclopediaItem(domain, id)` 구현 및 4대 뷰 연동.
- **Step 5**: `scripts/smoke-test.js`에 검증 테스트 케이스 작성 및 `verify-integrity-gate.js` 정적 분석 통과.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification Matrix)

- [ ] `node scripts/verify-integrity-gate.js` ALL PASS (5대 게이트 및 용어 헌법 100% 무결성)
- [ ] `npm test` (스모크 테스트 328+개 ALL PASS)
- [ ] Chrome CDP 실측 캡처:
  - 개인목표 백과사전 (AI / 실사용자)
  - 루틴 백과사전 (AI / 실사용자)
  - 팀 목표 백과사전 (AI / 실사용자)
  - 1초 이식 클릭 시 해당 서브탭으로 즉시 이동 및 데이터 적립 확인.

---

## 7. [원칙 ⑦] 결과 정리 · 평가 (Review & Retrospective)

- 도메인별 템플릿 탐색 효율성 극대화 및 목표/루틴/팀 3대 온보딩 퍼널 완성도 평가.
- 데드 클릭 없는 전수 바인딩 확인.

---

## 8. [원칙 ⑧] 본질 준수 여부 점검 (Essence Compliance Audit)

- E1(체크인 루프) 및 E3(팀 소통)의 본질에 부합하는가?
- 상민 대표님의 "개인목표, 팀 목표, 루틴 백과사전 버튼을 두고, AI추천/실사용자 나뉘고, 각각에 이식될 수 있어야 함" 지시가 100% 충족되었는가?
- 유저 데이터 무손실 원칙이 철저히 지켜졌는가?
