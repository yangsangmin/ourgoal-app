# REQ-goal-template-subtab-isolation: 목표 탭 템플릿 백과사전 단일 서브탭 분리 및 중복 버튼 제거 요구사항 정의서
# (헌법 버전: 2026.09.18-SUPREME-15-ARTICLES-VISUAL-INTEGRITY-ENHANCED 준수 정본)

> **문서 상태**: 기획 정의 완료 (상민 대표님 지침 100% 반영)  
> **작성 일시**: 2026-09-19  
> **귀속 본질 축**: **E1 (체크인 루프)** & **FIX (UI/UX 정보 구조 및 동선 정상화)**  
> **티켓 번호**: `#TASK-ES-187`  
> **적용 범위**: `index.html`, `js/sanctuary-v3-engine.js`, `ui.css`, `ui.js`, `docs/specs/`  

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

### 1-1. 상민 대표님 지시 원문
> "아워골 목표탭에서, 상단에 내 목표와 함께 내 목표에 바로 담기, 템플릿 백과사전이 같이 보이는게 의미가 있나?"  
> "아니지 템플릿 백과사전 하나로 충분하지 않나?"  
> "1번으로 하는데 지금 내 목표에 바로담기를 없애고, 템플릿 백과사전이 지금 목표탭에 2개나 노출되어 있는데 그걸 모두 없애고 서브탭으로 독립 분리한다는 거지?" ➔ "진행"

### 1-2. 기저 3층위 심층 분석
1. **1층 (표면적 현상: Information Overlap & Redundant CTA)**:
   - 목표 탭 상단의 마운틴 트레일 카드(`mountain-trail-card`) 하단에 `[⚡ 내 목표에 바로 담기 (1초 자동 이식)]` 버튼과 `[📖 템플릿백과사전]` 버튼이 고정 노출되어 있음.
   - 바로 아래 개인 목표 헤더(`goal-head-row`) 우측에 `[📖 템플릿백과사전]` 버튼이 또 노출되어 총 2곳에 중복 존재함.
   - 내 목표를 보고 있는 와중에 '담기' 버튼을 누르면 난데없이 하드코딩된 `'10km 하프마라톤 4주 완주 🏃'` 루틴이 복제되어 사용자에게 혼란과 버그 체감을 유발함.
2. **2층 (구조적 결합: Misplaced Sub-Action & Context Clash)**:
   - '실천(Execution) 공간'인 개인 목표 상세 뷰와 '탐색/영감(Discovery) 공간'인 템플릿 백과사전이 한 화면 안에서 위계 없이 뒤섞여 있음.
   - `내 목표에 바로 담기`는 템플릿 백과사전 안에서 특정 템플릿을 선택했을 때 누르는 하위 실행 액션(Sub-Action)임에도, 겉 화면 최상단에 엉뚱하게 돌출 노출됨.
3. **3층 (시스템 괴리: Mobile Viewport & Screen Hierarchy Fragmentation)**:
   - 모바일 뷰포트(375~430px)에서 스크롤을 내리지 않고 내 마일스톤과 할 일을 확인해야 하는 황금 영역을 불필요한 액션 버튼 2개가 가로막고 있음.
   - 서브탭 네비게이션(`goalsSubtabs`)이 이미 존재함에도 템플릿 백과사전을 좁은 팝업 모달로만 호출하도록 방치하여 온전한 템플릿 탐색 경험을 제공하지 못함.

### 1-3. 대상 사용자 페르소나 및 발생 상황
- **기존 목표 실천자(페르소나 1)**:
  - 이미 내 목표(예: "토익 900점", "체지방 5kg 감량")를 세우고 매일 체크인하러 들어온 유저.
  - 마운틴 트레일 카드 하단의 '내 목표에 바로 담기'를 보고 "내 목표를 어디에 담는다는 거지?"라며 기능의 정체를 혼동함.
- **새로운 루틴을 찾는 탐색자(페르소나 2)**:
  - 어떤 목표를 세울지 막막하여 검증된 루틴을 편하게 둘러보고 싶은 유저.
  - 화면 이곳저곳에 흩어진 버튼 대신 상단 서브탭에서 `[📖 템플릿 백과사전]`을 시원한 전체 화면 탭으로 탐색하고 마음에 드는 것을 1초 만에 담고자 함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

### 2-1. 본질 (Essence)
- 본 작업의 본질은 **"목표 탭의 정보 위계(IA) 정상화 및 실천과 탐색 공간의 명확한 분리"**이다.
- 화면 겉에서는 오직 **`[📖 템플릿 백과사전]` 독립 서브탭 1곳으로만 탐색 진입점을 일원화**하고, `내 목표에 바로 담기`는 템플릿 내부 선택 액션으로 완전 격리하여 내 목표 화면의 순수 실천 집중도를 100% 회복한다.

### 2-2. 원인 (Root Causes)
1. **과거 프로토타입 잔재 방치**: 마운틴 트레일 시연 당시 하드코딩된 마라톤 루틴 복제 버튼(`sTransplantBtn`)이 프로덕션 코드에 그대로 남아있었음.
2. **단일 진입점 원칙(Single Entrypoint) 부재**: 동일한 템플릿 백과사전 모달을 여는 버튼이 카드 안쪽과 헤더 우측 두 곳에 중복 난립함.
3. **서브탭 아키텍처 미활용**: `goalsSubtabs`에 `personal`, `routine`, `teamLinked`, `team`만 존재하고 가장 중요한 `templateEncyclopedia`가 독립 탭으로 승격되지 못해 좁은 팝업 모달에 갇혀 있었음.

### 2-3. 중심 (Core Bottleneck)
- **"상단 서브탭(`goalsSubtabs`) 내 템플릿 백과사전 뷰(`templateEncyclopediaView`) 완결 배선"**:
  - 서브탭 클릭 시 모달이 아닌 깔끔한 인앱 탭 화면으로 60종 템플릿 카탈로그가 렌더링되고,
  - 템플릿 카드 내부의 `[⚡ 내 목표에 바로 담기]` 클릭 시 데이터가 손실 없이 `state.profile.goals`에 즉시 적립된 후 개인 목표 탭으로 부드럽게 전환되어야 함.

### 2-4. 핵심 (Critical Anchor)
- **Zero Dead-Click & Zero Data Loss**:
  - 기존 60종 템플릿 데이터(`goal-templates-data.js`), 템플릿 복제 로직(`cloneTemplate`), 4대 뷰 동시 전파(`renderHome`, `renderGoalsScreen`, `renderStatsScreen`, `renderCalendar`)의 무결성을 100% 보존해야 함.
  - 기존 `btnGoalTemplateEncyclopedia` ID 참조 코드나 외부 링크 호출이 런타임 에러를 일으키지 않도록 하위 호환성을 완벽히 보장해야 함.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

### 3-1. 하지 말 것 vs 할 것
- **하지 말 것**:
  - 마운틴 트레일 카드 내에 어설픈 버튼을 남겨두는 행위.
  - 템플릿 복제 로직(`cloneTemplate`)을 임의 변경하여 유저의 기존 목표를 덮어쓰거나 파괴하는 행위.
  - CSS 은폐(`display:none`) 꼼수로 껍데기만 가리는 행위.
- **할 것**:
  - `js/sanctuary-v3-engine.js`의 `mountain-actions` 블록(`sTransplantBtn`, `sTmplMarketBtn`) 완전 제거.
  - `index.html` 목표 헤더(`goal-head-row`)의 `btnGoalTemplateEncyclopedia` 버튼 마크업 제거 및 기능 서브탭 이관.
  - `goalsSubtabs`에 `['templateEncyclopedia', '📖 템플릿 백과사전']` 5번째 서브탭 정식 추가.
  - `templateEncyclopediaView` 컨테이너를 신설하여 60종 템플릿 탐색, 카테고리 필터링, 검색, 그리고 각 템플릿 카드 내 `[⚡ 내 목표에 바로 담기]` 완전 4위 1체 배선.
  - 담기 완료 시 즉시 `state.goalsSubTab = 'personal'`로 전환하여 추가된 내 목표를 보여주는 직관적 피드백 제공.

### 3-2. 스토리지 원장화 3대 명세 (헌법 제2조 제4항)
1. **1호 (원격 DB 스키마 명세)**:
   - 템플릿 담기 실행 시 Supabase `profiles.goals` JSONB 배열에 신규 목표 객체가 `unshift`되어 기존과 동일한 스키마로 저장됨. 신규 DDL 변경 불필요.
2. **2호 (스마트 스토리지 분기 설계)**:
   - 로컬 `state.profile.goals`와 `localStorage` 캐시에 즉각 동기화되며, 서버 우선(Server-First) 동기화 파이프라인(`saveProfile()`)을 통해 원장에 영속화.
3. **3호 (4대 뷰 전파 배선도)**:
   - 템플릿 복제 후 `saveProfile()` 호출 및 `renderGoalsScreen()`, `renderHome()`, `renderRecordsScreen()`, `renderCalendar()` 동시 호출로 전 화면 동기화.

### 3-3. 전수 인터랙션 (Zero-Dead-Click) 명세표
| 요소 ID / 셀렉터 | 이벤트 | 트리거 동작 | 피드백 및 결과 |
| :--- | :---: | :--- | :--- |
| `[data-gsub="templateEncyclopedia"]` | click | `state.goalsSubTab = 'templateEncyclopedia'` 및 `renderGoalsScreen()` 호출 | 템플릿 백과사전 전용 서브탭 화면 활성화 |
| `.btn-transplant[data-tmpl]` | click | `cloneTemplate(tmplId, true)` 실행 | `state.profile.goals` 적립, 토스트 안내, 개인 목표 탭 자동 이동 |
| `.cat-pill[data-tcat]` | click | 선택 카테고리 필터링 | 템플릿 목록 즉시 필터 렌더링 |
| `#tplSearchInput` | input | 키워드 실시간 필터링 | 제목/설명 일치 템플릿 동적 갱신 |

### 3-4. 시각적 IA 및 시맨틱 통합 배선도 (헌법 제2조 제6항)
```
[목표 탭: screen-goals]
  └─ [서브탭: goalsSubtabs]
       ├─ [개인 목표] ➔ sanctuaryGoalsView (등반 로드맵) + personalGoalsView (마일스톤 목록)
       │    └─ * 버튼 제거됨: sTransplantBtn (삭제), sTmplMarketBtn (삭제), btnGoalTemplateEncyclopedia (삭제)
       │    └─ * 결과: 순수 등반 로드맵과 오늘 할 일 체크에 100% 집중된 클린 뷰
       ├─ [루틴] ➔ routineGoalsView
       ├─ [팀 연계] ➔ teamLinkedGoalsView
       ├─ [팀 목표] ➔ teamGoalsView
       └─ [📖 템플릿 백과사전] ➔ templateEncyclopediaView (신설)
            ├─ 검색창 & 카테고리 필터 칩 (운동, 독서, 커리어, 어학 등)
            └─ 60종 템플릿 카드 그리드
                 └─ 각 카드 내 [⚡ 내 목표에 바로 담기 (1초 이식)] CTA
```

- **모바일 반응형 뷰포트 여백 예산**:
  - 서브탭 5개: 가로 스크롤(`overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch;`)로 모바일(375px, 430px)에서 깨짐 없이 부드럽게 스와이프 탐색.
  - 서브탭 터치 타겟 최소 높이 44px 준수.

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)

### 4-1. 맹점 및 허점 비판적 분석
1. **서브탭 개수 증가에 따른 텍스트 잘림 위험**:
   - 서브탭이 4개에서 5개로 늘어나 375px 모바일 화면에서 줄바꿈이 발생할 수 있음.
   - **보완책**: `goalsSubtabs` 컨테이너에 `display: flex; overflow-x: auto; flex-wrap: nowrap;` 및 스크롤바 숨김 스타일을 적용하여 가로 스크롤로 매끄럽게 흐르도록 보장.
2. **외부/기존 코드에서 `btnGoalTemplateEncyclopedia` 호출 시 널 참조 위험**:
   - `index.html`이나 가이드 모달 등 다른 곳에서 `document.getElementById('btnGoalTemplateEncyclopedia')`를 조회할 가능성 존재.
   - **보완책**: 해당 버튼을 숨김 더미로 유지하거나, 글로벌 헬퍼 `window.openTemplateEncyclopedia = function() { state.goalsSubTab = 'templateEncyclopedia'; renderGoalsScreen(); }`를 배선하여 100% 하위 호환성 유지.
3. **템플릿 담기 후 유저 피드백 체감**:
   - 템플릿 백과사전 탭에서 '내 목표에 바로 담기'를 눌렀을 때 탭이 그대로 멈춰 있으면 담겼는지 체감하기 어려움.
   - **보완책**: 담기 성공 즉시 햅틱 진동 + 축하 토스트 + `state.goalsSubTab = 'personal'` 자동 전환으로 "내 목표에 꽂혔다!"는 직관적 감동 부여.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)

1. **Step 1: 마운틴 트레일 카드 내 중복 액션 제거**:
   - `js/sanctuary-v3-engine.js`의 `renderSanctuaryGoals()`에서 `mountain-actions` HTML 생성 블록 제거.
2. **Step 2: 개인 목표 헤더 마크업 정돈 및 하위 호환 가드 배선**:
   - `index.html` 내 `goal-head-row`에서 `btnGoalTemplateEncyclopedia` 버튼 제거 (또는 숨김 호환 처리).
   - `window.openTemplateEncyclopedia` 글로벌 함수 정의.
3. **Step 3: 목표 서브탭 목록에 `templateEncyclopedia` 등록**:
   - `index.html` 내 `renderGoalsScreen()`의 서브탭 배열에 `['templateEncyclopedia', '📖 템플릿 백과사전']` 추가.
4. **Step 4: 템플릿 백과사전 전용 뷰 렌더러 구현**:
   - `templateEncyclopediaView` DOM 컨테이너 신설 및 렌더링 함수(`renderTemplateEncyclopediaScreen`) 구현.
   - 60종 템플릿 데이터 바인딩, 카테고리 칩, 실시간 검색, `⚡ 내 목표에 바로 담기` 버튼 4위 1체 배선.
5. **Step 5: 6대 무결성 검증 및 CDP 실측**:
   - `npm test` 및 `verify-integrity-gate.js` 실행.
   - Chrome CDP를 통해 375px 및 430px 모바일 실측 스크린샷 캡처 및 5대 시각 감사 실시.
6. **Step 6: 로컬 main 병합 (4단계) 및 Vercel 프리뷰 배포 (5A)**.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

### 6-1. 단일 실패점(SPOF) 및 가설 검증
- **검증 1**: `sanctuary-v3-engine.js`에서 `sTransplantBtn`을 제거하면 다른 테스트나 스크립트에서 에러가 발생하는가?
  - ➔ 정적 검색 결과 smoke-test 등에서 해당 ID를 필수로 요구하지 않음을 확인.
- **검증 2**: 템플릿 백과사전 서브탭 전환 시 `sanctuaryGoalsView`는 어떻게 처리해야 하는가?
  - ➔ `state.goalsSubTab === 'templateEncyclopedia'`일 때는 `sanctuaryGoalsView`를 숨겨 템플릿 탐색에 온전히 몰입하도록 제어해야 함.
- **재검증 도출 수정사항**:
  - `renderGoalsScreen()` 내의 `sv.style.display` 가드 로직에 `templateEncyclopedia` 서브탭일 때 `none`으로 숨기는 분기 처리 명시적 추가.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)

1. **기능 기준**:
   - 마운틴 트레일 카드 내 `내 목표에 바로 담기` 및 `템플릿백과사전` 버튼 0건 (완전 제거).
   - 개인 목표 헤더 우측 중복 버튼 0건 (완전 제거).
   - 서브탭 `[📖 템플릿 백과사전]` 클릭 시 전용 카탈로그 뷰 100% 정상 렌더링.
   - 템플릿 카드에서 `[⚡ 내 목표에 바로 담기]` 클릭 시 1초 만에 `state.profile.goals` 적립 및 개인 목표 탭으로 자동 이동.
2. **기술 기준**:
   - 브라우저 콘솔 에러 0건.
   - `npm test` 263개 이상 테스트 전수 통과 (0 failure).
   - `node scripts/verify-integrity-gate.js` PASS.
   - 375×812 및 430×932 뷰포트 시각 감사 5개 항목 전수 PASS (글자 짤림 0, 터치타겟 44px 이상).

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)

1. **블로커 시나리오 1: 템플릿 데이터(`OURGOAL_60_TEMPLATES` / `CREATOR_TEMPLATES`) 미로드 시 빈 화면**:
   - ➔ 대응: 전역 템플릿 레지스트리 가드 배선, 로드 지연 시 자동 폴백 데이터 제공.
2. **블로커 시나리오 2: 게이트키퍼 스크립트 정적 구문 검사 실패**:
   - ➔ 재검증 트리거: 게이트키퍼 실패 시 원칙 ③의 AST 필수 구문(`saveProfile`, 4대 뷰 동시 호출) 배선 위치로 되돌아가 린터 요건 점검.
3. **롤백 계획**:
   - 문제 발생 시 `feat/goal-template-subtab-es187` 브랜치를 안전 롤백하고 기존 `main` 상태로 즉시 복구.
