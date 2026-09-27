# [요구사항 정의서] #TASK-ES-325: [74] 프로필 편집 관심 카테고리(Interests) 선택 및 저장 작동 안함 오류 수정 및 아워골 본질 강화

- **작성일**: 2026-09-27
- **담당자**: 양상민 님 & Gemini / Antigravity
- **상태**: 구현 중
- **우선순위**: 높음 (P1)
- **노션 생각 메모장 번호**: [74]번 (Page ID: `3df598db-9096-81ba-9c3c-e501f042bbe0`)
- **타겟 브랜치**: `feat/2026-09-27-task-es-325-profile-edit-interests-fix`
- **상민님 원문 지시**:
  > *"74번 과제 문제점의 본질과 그것을 해결할 구체적인 방안과 해결 후 모습은? 기존 문제를 단순히 해결하는 것도 중요하지만, 문제를 해결하면서 더욱 개선하고 보완해야 아워골의 본질을 살리는 관심카테고리의 역할을 올바르게 정립하고, 활용될 수 있어. 이를 위한 구체적인 방안과 해결 후의 모습, ui와 사용자경험이 같이 개선되는 구체적인 해결방안과 해결 후의 모습이 필요해."*
  > *"진행"*

---

## 1. 문제 정확히 파악 (Problem Identification)
1. **표면적 증상**:
   - 모바일 바텀시트 모달에서 관심 카테고리 칩을 누르면 칩이 제대로 선택되지 않거나, 모달 화면이 최상단으로 강제 튕겨 올라가는 현상 발생.
   - 기존 관심사를 모두 해제하고 저장해도, 프로필을 다시 열거나 세션을 복원하면 과거의 관심사가 계속 되살아남.
2. **기저 층위 분석**:
   - **1층 (DOM 파괴 & 터치 단절)**: `paintInterests()`가 칩 하나를 누를 때마다 `#pvInterests`의 모든 HTML(35개 버튼)을 `innerHTML`로 전면 파괴하고 재생성하여, 브라우저가 포커스를 잃고 스크롤을 `scrollTop = 0`으로 리셋하며 터치 이벤트를 씹음.
   - **2층 (CSS 규격 미달 & 배치 실종)**: `.cat-sub`의 높이가 34px로 헌법 제7조 제8항(모바일 최소 44px)에 미달하고, `.cat-sub-grid`는 CSS에 아예 정의되어 있지 않아 버튼들이 비좁게 뭉쳐 오터치를 유발함.
   - **3층 (데이터 로직 Falsy 결함)**: `loadProfile()`과 `saveProfile()`에서 `urow.interests.length`를 검사하여 `0`이면 데이터가 없는 것으로 잘못 취급해 로컬 캐시에서 옛 데이터를 강제로 부활시킴.
   - **4층 (아워골 본질 단절)**: 관심 카테고리가 단순 텍스트 나열에 그쳐, 사용자의 목표/루틴 설정, 팀 챌린지 탐색, AI 맞춤 코칭으로 이어지는 '성장의 나침반' 역할을 전혀 하지 못함.

---

## 2. 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **[가목] 본질 (Essence)**:
  - 아워골에서 관심 카테고리는 단순 프로필 데코레이션이 아닌, **"사용자의 성장을 설계하고, 동료와 연결하며, 앱 전체 경험을 초개인화하는 핵심 나침반"**이다.
  - 무공해 성장 쉼터로서 유저의 시간과 에너지를 낭비하지 않는 쾌적한 44px 인터랙션과 신뢰할 수 있는 데이터 영속성을 제공해야 한다.
- **[나목] 원인 (Root Causes)**:
  1. `paintInterests` 내부의 `innerHTML` 반복 재작성으로 인한 모바일 스크롤 튕김 및 레이아웃 쓰레싱.
  2. `.cat-sub` 34px 미달 및 `.cat-sub-grid` 스타일 정의 누락.
  3. `Array.isArray` 대신 `.length`로 판단하여 0개 해제를 거부하는 캐시 부활 버그.
  4. 상단 요약 트레이, 대분류 점프 앵커, 목표 기반 스마트 연동 부재로 인한 UX 탐색 피로.
- **[다목] 중심 (Core Bottleneck)**:
  - `index.html` 7888행 `paintInterests`의 이벤트 위임 및 인-플레이스 클래스 토글 구조로의 전면 리팩토링.
- **[라목] 핵심 (Critical Anchor)**:
  - 0개 해제 포함 완벽한 영속성 보장, 헌법 준수 44px 터치타겟, Zero Data Loss 즉각 동기화, `handle프로필_Item74Action` 배선.

---

## 3. 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말 것**:
  - 칩 클릭 시 `innerHTML` 전체를 파괴하는 행위 금지.
  - 기존 스타일이나 컬러 팔레트를 파괴하는 과도한 레이아웃 변경 금지.
- **할 것**:
  - `classList.toggle('active')` 기반 인-플레이스 토글 및 단일 이벤트 위임.
  - `ui.css`에 `.cat-sub-grid`, `.cat-sub`(44px), 상단 요약 트레이(`.pv-selected-tray`) 정식 정의.
  - `Array.isArray(urow.interests)` 검사로 0개 빈 배열 영속화 허용.
  - 상단 요약 트레이, 대분류 퀵 앵커 탭, 내 목표 기반 1초 퀵 가져오기 구현.
  - `handle프로필_Item74Action` 4위 1체 배선 (12ms 햅틱, 로컬 캐시, Supabase upsert, 4대 뷰 전파).

---

## 4. 1~3 재검토 · 보완 (Critical Review & Edge Cases)
- **엣지 케이스 1: 관심사를 8개 이상 선택하려는 경우**:
  - 토스트 안내(`관심 카테고리는 8개까지 고를 수 있어요`)와 함께 8개 초과 선택을 우아하게 차단.
- **엣지 케이스 2: 기존 등록된 관심사를 모두 지우고(0개) 저장하는 경우**:
  - `urow.interests = []`가 정상적으로 Supabase 및 로컬 캐시에 저장되며, 캐시 좀비가 되살아나지 않음.
- **엣지 케이스 3: 사용자가 등록해 둔 목표가 0개인 경우**:
  - "목표 기반 1초 가져오기" 배너가 깨지지 않고 자연스럽게 숨겨짐.

---

## 5. 해결 절차 정리 (Implementation Procedure)
1. `ui.css`: `.cat-sub-grid`, `.cat-sub` 44px, 요약 트레이, 대분류 퀵 탭 스타일 추가.
2. `index.html`: `paintInterests` 인-플레이스 토글 리팩토링, 상단 요약 트레이, 대분류 탭, 목표 연동 배너 추가.
3. `index.html`: `loadProfile()`, `saveProfile()` 내 `Array.isArray` 정밀 검증 적용.
4. `js/components.js`: `handle프로필_Item74Action` 직통 핸들러 구현.
5. `tests/profile-interests-fix.test.js` 단위 테스트 작성 및 통과.
6. `scripts/smoke-test.js` 스모크 테스트 433+ 전수 통과 확인.
7. 모바일 375px 실측 CDP 검증 및 스크린샷 캡처.
8. `reports/TASK-ES-325/claims.json` 작성 및 GitHub 초안 PR 제출.

---

## 6. 절차 재검증 (Procedure Verification & Anti-SPOF)
- 인-플레이스 토글 시 `b.classList.toggle('active')`와 `draft.interests` 배열의 정합성이 100% 일치하는지 검증.
- 상단 요약 트레이의 `×`를 눌렀을 때 아래 리스트의 해당 칩의 `.active` 클래스도 즉시 제거되는지 양방향 연동 확인.
- Node 24 환경에서 `global.navigator` 쓰기 금지 규칙 준수 (`winMock` 패턴 적용).

---

## 7. 단계별 실행 기준 (Success Metrics & Criteria)
1. 375px 모바일 뷰포트에서 하단 칩 탭 시 스크롤 위치 이동 0px (완전 고정).
2. 칩 높이 최소 44px 준수.
3. 관심사 0개 저장 시 새로고침 후에도 0개 유지 (캐시 부활 0건).
4. 단위 테스트 100% 통과 및 스모크 테스트 0 실패.
5. GitHub Court 검사 합격 (`success` 통과).

---

## 8. 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **막힘 1**: `paintInterests` 초기 렌더링 시 기존 `draft.interests`의 중복 키 처리.
  - **대응**: `seen` 맵을 두어 중복 방지.
- **막힘 2**: 상단 요약 트레이와 하단 칩 목록 간의 상태 불일치.
  - **대응**: 칩 탭 및 뱃지 삭제 모두 `updateSelectedTray()` 단일 함수를 통과하도록 정규화.
