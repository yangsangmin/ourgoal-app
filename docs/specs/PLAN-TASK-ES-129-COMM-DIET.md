# 엔지니어링 작업계획서 (PLAN) — 소통 탭 7단계 피로층 다이어트 및 최신 피드 1초 직통 노출

> **문서 ID**: PLAN-TASK-ES-129-COMM-DIET  
> **요구사항 연계**: [REQ-TASK-ES-129-COMM-DIET](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-129-COMM-DIET.md)  
> **티켓 연계**: #TASK-ES-129  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 소통 탭 진입 시 발생하는 7단계 400px 이상의 피로층(거대 원카드, 2중 3버튼 허브, 2중 서브탭 그리드, 중복 필터)을 슬림화하여 최신 피드가 1초 직통으로 눈앞에 노출되도록 IA를 대폭 다이어트함.
- **영향 받는 파일 목록 전수**:
  - `ui.css`: `#commHubGrid` 중복 버튼 은폐, `.toss-community-hero-card` 콤팩트 인라인화, `.reaction-floating-bar` 마진 축소, `.comm-subtabs-grid` 슬림 탭바 정돈.
  - `index.html`: `#commHubGrid` 인라인 방어 속성 및 소통 탭 헤더 배치 정돈.
  - `reports/TASK-ES-129/`: 법정 심사 시나리오 및 클레임 등록.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 소통 탭 진입 시 사용자가 메뉴 탐색에 허비하는 시간과 스크롤 피로도를 제거하고, 동료들의 실시간 실천 피드를 1초 만에 마주하게 하는 정보 구조 다이어트.
- **[원인] (Technical Causes)**: `#commHubGrid`(3개 버튼)와 `comm-subtabs-grid`(6개 버튼)의 2중 적재 및 `commHeroCard`의 과도한 세로 패딩(120px)으로 인한 상단 뷰포트 잠식.
- **[중심 배선] (Core Wire & State)**:
  - `state.commSubTab`: 소통 탭 서브탭(`feed`, `group`, `companion`, `dm`, `manito`, `share`) 단일 상태 바인딩.
  - `#commBody`: 서브탭 및 피드 렌더링 컨테이너 배선.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 헌법 게이트 검증(`.comm-subtabs-grid`, `.comm-subtabs-grid .comm-subtab`) CSS 문자열을 온전히 보존하여 기존 테스트 100% ALL PASS 보증.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[소통 탭 진입] -> [슬림 헤더 & 콤팩트 1줄 현황] -> [단일 서브탭 바(피드/팀/동반자/DM/마니또/공유)] -> [최신 피드 1초 직통 노출]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | commHubGrid 은폐 및 Hero 카드 슬림화 | +35줄 | -10줄 | +25줄 | CSS 토큰 준수 |
| `index.html` | 헤더 마크업 정돈 및 style 속성 보완 | +5줄 | -5줄 | 0줄 | 외과수술적 diff |
| `reports/TASK-ES-129/*` | 법정 검증 리포트 및 시나리오 | +80줄 | 0줄 | +80줄 | 법정 문서 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `comm-subtabs-grid` 6대 서브탭 버튼 및 `aria-selected` 속성.
2. **이벤트 리스너 (Listener)**: 각 서브탭 버튼의 클릭 이벤트 및 12ms 햅틱 배선.
3. **비즈니스 로직 (Logic)**: `state.commSubTab` 변경 및 `renderCommScreen()` / `renderCommFeed()` 연계 호출.
4. **피드백 & 예외처리 (Feedback)**: 피드 로딩 상태 인디케이터 및 엠프티 스테이트 피드백.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (데이터 모델 & 원격 스키마)**: 피드 포스트 및 동반자/팀 데이터 바인딩 확인.
2. **Step 2 (비즈니스 로직 & 핸들러)**: `renderCommScreen` 내 서브탭 배선 보존 확인.
3. **Step 3 (UI 컴포넌트 마크업 & 스타일)**:
   - `ui.css`: `#commHubGrid` 숨김 처리 (`display: none !important`).
   - `ui.css`: `.toss-community-hero-card` 슬림 인라인 바 스타일링 (높이 120px -> 52px).
   - `ui.css`: `.reaction-floating-bar` 마진 및 패딩 콤팩트화.
4. **Step 4 (4위 1체 이벤트 배선)**: 6대 서브탭 클릭 및 피드 인터랙션(응원/게시) 확인.
5. **Step 5 (4대 뷰 실시간 동시 전파)**: 소통 탭 전환 및 피드 갱신 무결성 확인.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: 6대 서브탭 칩 및 게시하기/응원 버튼 전수 클릭 시 에러 0건 확인.
- **시나리오 B (Zero Data Loss)**: 소통 데이터(피드/팀/동반자/DM) 보존 및 무손실 확인.
- **시나리오 C (Zero UX Regression)**: 타 탭(홈/목표/캘린더/기록/설정)에 영향 없음 확인.
- **시나리오 D (Full State Propagation)**: 피드 필터/서브탭 전환 시 하위 뷰 즉각 렌더링 확인.
- **시나리오 E (자동화 게이트 통과)**: `npm test` (스모크 440개 + 게이트 38개) 100% ALL PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~5 순차적 구현 설계.
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS 확인.
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS 확인.
- [ ] 스모크 테스트 전수 검증: `npm test` PASS 확인.
- [ ] [4단계: 로컬 메인 병합 상태 및 5A 프리뷰 배포] 완결 후 상민님께 실서버 배포 여부 보고.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: `#commHubGrid` 숨김 시 인라인 onclick 의존 테스트 오류 가능성 점검.
- **사전 방어 및 우회 로직**: 요소를 DOM에서 삭제하지 않고 CSS로 안전하게 은폐하여 방어.
- **롤백 계획 (Rollback Strategy)**: 변경 파일(`index.html`, `ui.css`) `git checkout`으로 즉시 복구.
- **재검증 트리거**: 뷰포트 내 피드 상단 위치가 240px를 초과할 경우 원칙 2, 3으로 돌아가 여백 재조정.
