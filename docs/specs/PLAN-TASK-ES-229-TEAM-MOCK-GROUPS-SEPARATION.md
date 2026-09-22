# 엔지니어링 작업계획서 (PLAN) — 팀 목표 화면 내 가상 샘플 그룹(`MOCK_GROUPS`) 분리 및 [💡 활용 예시] 배지·새 팀 만들기 전면화

> **문서 ID**: PLAN-TASK-ES-229-TEAM-MOCK-GROUPS-SEPARATION  
> **요구사항 연계**: [REQ-TASK-ES-229-TEAM-MOCK-GROUPS-SEPARATION](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-229-TEAM-MOCK-GROUPS-SEPARATION.md)  
> **티켓 연계**: #TASK-ES-229  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity (B2C/C2C Team Collaboration Product Lead)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  - 팀 공간(소통 탭 모임 및 목표 탭 팀목표)에서 하드코딩된 `MOCK_GROUPS`를 [💡 이런 팀을 만들 수 있어요 (활용 예시)] 배지로 분리하고, 화면 최상단에 누구나 1초 만에 팀을 개설할 수 있는 [🔥 우리만의 팀 만들기] 대형 히어로 카드를 전진 배치하며, 실 사용자 팀을 최상단에 우선 렌더링함.
- **영향 받는 파일 목록 전수**:
  - `index.html`:
    - `isMockGroup(g)` 헬퍼 함수 구현 및 `MOCK_GROUPS` 기본 항목에 `isMock: true` 속성 부여.
    - `renderTeamCreateHeroCardHtml(context)`: 최상단 대형 히어로 카드 렌더러 구현.
    - `renderCommGroups(body)`: 실 팀 우선 렌더링, 예시 그룹 아코디언 분리, 배지 및 템플릿 복제 개설 이벤트 배선.
    - `renderTeamGoalsScreen()`: 상단 개설 히어로 카드 탑재, 실 팀 목표 우선 노출 및 예시 팀 분리.
    - `getTeamGoalTemplatePreset(target)`: 다양한 입력 타입(템플릿 키, 그룹 객체, gid) 유연 처리 지원.
  - `ui.css`:
    - `.team-hero-card`, `.mock-group-badge` 등 모바일 375px 최적화 스타일 추가.
  - `docs/rules/TICKETS.md`: #TASK-ES-229 승인 티켓 상태 등록.
  - `reports/TASK-ES-229/claims.json`: 5대 법정 청구서 작성.
  - `scripts/smoke-test.js`: [#TASK-ES-229] 검증 단언문 5종 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 가상 팀 데이터와 실 사용자 팀 데이터의 엄격한 분리 및 온보딩 직통 CTA 배선.
- **[원인] (Technical Causes)**:
  - `MOCK_GROUPS` 내에 가상 데이터와 사용자 데이터가 단일 배열로 무차별 렌더링되던 구조적 결함.
- **[중심 배선] (Core Wire & State)**:
  - `isMockGroup(g)`: `g.isMock === true || (!isCustomGroup && /^(g-workshop|g-travel|g-marathon-pair|g-marathon-small|g\d+)$/.test(g.id))`
  - `promptNewGroup(body, preset)`: 예시 팀 카드에서 즉각 템플릿을 승계하여 새 팀을 개설하는 비즈니스 파이프라인.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `state.profile.settings.customGroups` 로컬 영속화 + Supabase `team_pings` 원격 영속화 2중 안전망 유지.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[예시 카드 또는 히어로 카드 클릭] -> [12ms 햅틱] -> [promptNewGroup 모달] -> [팀 생성 완료] -> [customGroups 영속화] -> [renderCommGroups / renderTeamGoalsScreen 최상단 반영]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | `isMockGroup`, 히어로 카드, 분리 렌더링, 이벤트 배선 | +100줄 | -20줄 | +80줄 | 외과수술적 diff |
| `ui.css` | 히어로 카드 및 예시 배지 스타일 | +25줄 | 0줄 | +25줄 | CSS 토큰 준수 |
| `docs/rules/TICKETS.md` | #TASK-ES-229 티켓 등록 | +1줄 | 0줄 | +1줄 | 문서화 |
| `reports/TASK-ES-229/claims.json` | 5대 법정 청구서 | +100줄 | 0줄 | +100줄 | 신규 작성 |
| `scripts/smoke-test.js` | 회귀 방지 단언문 5종 | +25줄 | 0줄 | +25줄 | 테스트 추가 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#btnHeroCreateTeamComm`, `#btnHeroCreateTeamGoals`, `[data-tplgroup-create]`, `[data-toggle-mock-section]`
2. **이벤트 리스너 (Listener)**: 클릭 시 `triggerHapticFeedback(12)` 및 `promptNewGroup` 연동
3. **비즈니스 로직 (Logic)**: `isMockGroup` 분기, 실데이터 최상단 소팅, `promptNewGroup` 모달 호출
4. **피드백 & 예외처리 (Feedback)**: 토스트 피드백, 12ms 햅틱, 유효성 실패 시 안내

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증

- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 기존 335개 스모크 테스트 및 38개 헌법 게이트가 100% 통과하는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **Step 1 (UI 스타일 정의)**: `ui.css`에 `.team-hero-card`, `.mock-group-badge` 스타일 추가.
2. **Step 2 (판별기 및 템플릿 헬퍼)**: `index.html`에 `isMockGroup` 함수 및 `MOCK_GROUPS` 항목 `isMock: true` 배선.
3. **Step 3 (히어로 카드 & 분리 렌더러)**: `renderCommGroups` 및 `renderTeamGoalsScreen` 최상단 히어로 카드 및 실/예시 분리 배치.
4. **Step 4 (이벤트 리스너 배선)**: 12ms 햅틱, `promptNewGroup` 호출, 아코디언 토글 배선.
5. **Step 5 (검증 및 게이트 통과)**: `scripts/smoke-test.js` 단언문 추가 및 `npm test` 100% 통과 확인.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계

- **시나리오 A (Zero Dead-Click)**: 신규 버튼 및 아코디언 클릭 시뮬레이션 -> 콘솔 에러 0건 확인.
- **시나리오 B (Zero Data Loss)**: 새 팀 생성 후 로컬 저장소 및 렌더링 대조 -> 100% 무손실 보존 확인.
- **시나리오 C (Zero UX Regression)**: 기존 체험 모드 및 실 팀 관리 기능 100% 정상 작동 확인.
- **시나리오 D (Full State Propagation)**: 새 팀 개설 즉시 소통 탭 및 목표 탭 최상단 반영 확인.
- **시나리오 E (자동화 게이트 통과)**: `npm test` 336개 스모크 및 헌법 38개 게이트 ALL PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)

- [ ] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] [4단계: 로컬 메인 병합 상태 및 5A 프리뷰 배포] 완결 후 상민님께 실서버 배포 여부 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획

- **잠재적 엔지니어링 블로커**: `MOCK_GROUPS` 내 워크숍/단체여행 ID 변경 시 기존 테스트 파손 위험.
  - **사전 방어**: ID 및 기존 데이터 필드를 100% 보존하고 `isMock: true` 플래그만 추가.
- **롤백 계획 (Rollback Strategy)**: 문제 발생 시 `git checkout -- .`으로 즉시 복구 가능하도록 커밋 분리.
- **재검증 트리거**: `npm test` 실패 시 Step 2 판별 로직으로 복귀하여 원본 데이터 보존 상태 재점검.
