# PLAN-goal-template-subtab-isolation: 목표 탭 템플릿 백과사전 단일 서브탭 분리 및 중복 버튼 제거 엔지니어링 작업계획서
# (헌법 버전: 2026.09.18-SUPREME-15-ARTICLES-VISUAL-INTEGRITY-ENHANCED 준수 정본)

> **문서 상태**: 엔지니어링 계획 수립 완료 (자율 무중단 집행 개시)  
> **세션 ID**: `a63b03bc`  
> **티켓 번호**: `#TASK-ES-187`  
> **귀속 본질 축**: **E1 (체크인 루프)** & **FIX (정보구조 정상화)**  
> **마감 상한선**: **[4단계: 로컬 메인 병합 및 5A 프리뷰 배포]** (헌법 제9조 제3항 준수)  

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)

### 1-1. REQ 핵심 요약
- 목표 탭 상단 마운틴 트레일 카드 내 불필요한 `[⚡ 내 목표에 바로 담기]` 및 `[📖 템플릿백과사전]` 버튼 제거.
- 개인 목표 헤더 우측의 `[📖 템플릿백과사전]` 버튼 제거 및 상단 서브탭(`goalsSubtabs`)의 5번째 독립 서브탭(`templateEncyclopedia`)으로 승격.
- 템플릿 탐색(카테고리 필터, 검색, 60종 템플릿)과 1초 이식 CTA(`cloneTemplate`)를 전용 서브탭 화면으로 완결 배선.

### 1-2. 영향받는 파일 전수 목록
1. `js/sanctuary-v3-engine.js`: 마운틴 트레일 하단 액션 버튼(`mountain-actions`) HTML 및 이벤트 정리.
2. `index.html`:
   - 목표 서브탭에 `templateEncyclopedia` 추가.
   - `screen-goals` 내 `templateEncyclopediaView` 컨테이너 신설.
   - 목표 헤더의 중복 템플릿 버튼 정리 및 하위 호환성 전역 함수 배선.
   - 템플릿 백과사전 렌더링 함수 `renderTemplateEncyclopediaScreen()` 구현.
3. `ui.css`: 템플릿 백과사전 서브탭 뷰 전용 그리드 및 카드 스타일 보강 (기존 CSS 변수 100% 계승).
4. `docs/specs/REQ-goal-template-subtab-isolation.md`: 기획 정본.
5. `docs/specs/PLAN-goal-template-subtab-isolation.md`: 본 실행 계획 정본.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

### 2-1. 본질 (Essence)
- 본 엔지니어링 작업의 본질은 "화면 상단에 중복 난립하던 템플릿 호출부를 1곳으로 단일화하고, 실천 화면(개인 목표)과 탐색 화면(템플릿 백과사전)의 DOM 위계를 배타적으로 분리하여 사용자 인지 부하를 0으로 만드는 것"이다.

### 2-2. 원인 (Root Causes)
1. `sanctuary-v3-engine.js`와 `index.html` 간의 컴포넌트 결합 및 중복 버튼 렌더링.
2. 템플릿 이식 버튼의 잘못된 위치 선정(목표 상세 뷰 내부가 아닌 메인 등반 카드에 직접 노출).
3. 서브탭 라우터의 미비로 인한 모달 의존성 심화.

### 2-3. 중심 (Core Bottleneck)
- **전역 상태(`state`) 및 뷰 가시성 상호 배타적 제어**:
  - `state.goalsSubTab`: 기존 (`'personal'` | `'routine'` | `'teamLinked'` | `'team'`) 에 `'templateEncyclopedia'` 값 추가.
  - `templateEncyclopedia` 활성화 시 상단 마운틴 트레일 및 개인 목표 컨테이너를 완벽히 숨기고 카탈로그 전용 뷰 렌더링.

### 2-4. 핵심 (Critical Anchor)
- **Zero Dead-Click & Zero Data Loss**:
  - 템플릿 담기(`cloneTemplate`) 시 신규 목표가 정상 `unshift` 적립되고, `saveProfile()`을 통해 원장 영속화. 기존 목표 데이터 단 1바이트도 손실 없이 보존.

### 2-5. 종단간 데이터 흐름 다이어그램
```
[유저 클릭: 서브탭 '📖 템플릿 백과사전']
   │
   ▼
[state.goalsSubTab = 'templateEncyclopedia']
   │
   ▼
[renderGoalsScreen() 분기]
   ├─ sanctuaryGoalsView.style.display = 'none' (마운틴 트레일 숨김)
   ├─ personalGoalsView.style.display = 'none' (개인 목표 숨김)
   └─ templateEncyclopediaView.style.display = '' (템플릿 백과사전 활성화)
   │
   ▼
[renderTemplateEncyclopediaScreen()]
   ├─ 카테고리 필터 칩 (전체, 운동, 공부/독서, 커리어, 루틴 등)
   ├─ 실시간 키워드 검색창
   └─ 60종 템플릿 카드 그리드
        └─ [⚡ 내 목표에 바로 담기] 버튼
             │
             ▼ (클릭 시)
        [cloneTemplate(tmplId, true)]
             ├─ state.profile.goals.unshift(newGoal)
             ├─ state.activeGoalId = newGoal.id
             ├─ state.goalsSubTab = 'personal' (개인목표 자동 복귀)
             ├─ saveProfile() (원격 Supabase + 로컬 캐시)
             ├─ toast("⚡ [목표명] 루틴이 내 목표에 1초 만에 담겼습니다! 🎉")
             └─ 4대 뷰 동시 전파: renderGoalsScreen(), renderHome(), renderRecordsScreen(), renderCalendar()
```

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

### 3-1. 파일별 예상 Diff Budget
| 파일명 | 변경 내용 | 예상 추가 줄 | 예상 삭제 줄 |
| :--- | :--- | :---: | :---: |
| `js/sanctuary-v3-engine.js` | 마운틴 트레일 하단 `mountain-actions` HTML 제거 | +2 | -12 |
| `index.html` | 서브탭 추가, 컨테이너 신설, 렌더러 함수 배선, 헤더 정리 | +90 | -15 |
| `ui.css` | 템플릿 백과사전 서브탭 뷰 전용 레이아웃 스타일 | +40 | -0 |

### 3-2. 4위 1체 배선 명세 (헌법 제3조 제2항)
1. **마크업(Markup)**:
   - `<div class="comm-subtab" data-gsub="templateEncyclopedia">📖 템플릿 백과사전</div>`
   - `<div id="templateEncyclopediaView" style="display:none;"></div>`
2. **이벤트 리스너(Listener)**:
   - 서브탭 클릭 시 `renderGoalsScreen()` 호출.
   - 검색창 `input`, 카테고리 칩 `click`, 담기 버튼 `click` 완전 바인딩.
3. **비즈니스 로직(Handler & Logic)**:
   - `renderTemplateEncyclopediaScreen()`, `cloneTemplate(tmplId, true)`, 필터링 필터 함수.
4. **사용자 피드백 및 예외 처리(Feedback & Error Handling)**:
   - 햅틱 진동, 토스트 팝업, 개인 목표 탭 전환 및 신규 목표 포커스 하이라이트.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Integrity Assurance)

### 4-1. 기존 기능 불파괴 검증
- **개인 목표 기능 보존**: 기존 목표 목록, 마일스톤 완료 체크, 할일(Task) 체크, D-day 계산 등 기존 100% 정상 작동.
- **루틴 및 팀 목표 서브탭 보존**: `routine`, `teamLinked`, `team` 서브탭 전환 및 렌더링에 영향 0.
- **유저 자산 무손실**: `state.profile.goals`는 불파괴 비파괴 합집합 보존을 준수하여 기존 목표를 단 1바이트도 손상시키지 않음.
- **하위 호환 보증**: 과거 `btnGoalTemplateEncyclopedia` ID를 조회하던 코드가 존재할 경우를 대비하여 해당 요소를 숨김(fallback) 처리하거나 전역 함수를 유지하여 크래시 차단.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **Step 1 (UI 다이어트: 마운틴 트레일 정돈)**:
   - `js/sanctuary-v3-engine.js` 내 `renderSanctuaryGoals()`에서 `mountain-actions` 마크업 블록 제거.
2. **Step 2 (서브탭 확장 및 DOM 컨테이너 신설)**:
   - `index.html`의 `goalsSubtabs` 배열에 `['templateEncyclopedia', '📖 템플릿 백과사전']` 추가.
   - `personalGoalsView` 하단에 `<div id="templateEncyclopediaView" style="display:none;"></div>` 배치.
   - `personalGoalsView` 헤더의 `btnGoalTemplateEncyclopedia` 제거.
3. **Step 3 (서브탭 라우팅 및 가시성 제어)**:
   - `renderGoalsScreen()`에서 `state.goalsSubTab === 'templateEncyclopedia'`일 때 `sanctuaryGoalsView`와 `personalGoalsView`를 숨기고 `templateEncyclopediaView` 표시.
4. **Step 4 (템플릿 백과사전 화면 렌더러 구현)**:
   - `renderTemplateEncyclopediaScreen()` 구현: 상단 안내 헤더, 카테고리 필터 칩, 검색창, 템플릿 카드 그리드.
   - 각 카드 내 `[⚡ 내 목표에 바로 담기]` 클릭 시 `cloneTemplate(id)` ➔ `state.goalsSubTab = 'personal'` ➔ `renderAll()` 완결 배선.
5. **Step 5 (CSS 스타일링)**:
   - `ui.css`에 반응형 템플릿 그리드 및 카테고리 칩 스타일 추가.
6. **Step 6 (로컬 검증 및 6대 무결성 테스트)**:
   - `npm test` 및 `verify-integrity-gate.js` 무결성 확인.
   - 모바일 CDP 실측 캡처.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Verification Scenarios)

1. **[시나리오 A] Zero Dead-Click**:
   - 서브탭 5개(개인, 루틴, 팀연계, 팀, 템플릿)를 순차 클릭 시 JS 콘솔 에러 0건 확인.
   - 템플릿 카드의 '내 목표에 바로 담기' 클릭 시 정상 동작 확인.
2. **[시나리오 B] Zero Data Loss**:
   - 템플릿 이식 전후 `state.profile.goals.length` 대조 및 기존 목표 데이터 100% 무손실 검증.
3. **[시나리오 C] Zero UX Regression**:
   - 홈 탭, 캘린더 탭, 기록 탭, 통계 탭 전환 및 체크인 정상 작동 확인.
4. **[시나리오 D] Full State Propagation**:
   - 템플릿을 담은 후 홈 화면과 캘린더 화면에 신규 목표/일정이 즉각 동시 반영되는지 확인.
5. **[시나리오 E] Gatekeeper PASS**:
   - `scripts/verify-integrity-gate.js` 100% 통과 (0 failure).

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Execution Checklist)

- [ ] **1단계 (기획·설계)**: REQ 및 PLAN 문서 작성 및 정적 규격 통과
- [ ] **2단계 (내부 시뮬레이션)**: 브랜치 `feat/goal-template-subtab-es187`에서 코드 수정 및 단위/게이트 테스트 통과
- [ ] **3단계 (로컬 수동 확인)**: 로컬 포트에서 Chrome CDP 실측 캡처 및 5대 시각 감사(글자짤림, 대칭성, 뷰공존, 기능가시성, 터치타겟) 수행
- [ ] **4단계 (로컬 메인 병합 & 5A 프리뷰)**: 로컬 main에 병합 후 Vercel 프리뷰 배포 자동 실행 및 URL 확보 (세션 마감선)
- *(5단계 프로덕션 배포 및 6단계 실운영 확인은 상민님 명시적 배포 승인 시에만 진행)*

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Blockers & Rollback)

1. **잠재 오류**: 서브탭 전환 시 다른 서브탭(루틴 등) 컨테이너가 겹쳐 보일 위험.
   - ➔ 대응: `renderGoalsScreen()` 진입 시 모든 서브뷰(`sv`, `pv`, `rv`, `tv`, `tlv`, `tev`)의 `display` 상태를 엄격하게 상호 배타적으로 제어.
2. **롤백 계획**:
   - `git checkout main && git branch -D feat/goal-template-subtab-es187`로 무손실 즉각 원복 가능.
