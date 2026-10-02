# 엔지니어링 작업계획서 (PLAN) — #TASK-UIUX-PHASE3-HOME-COCKPIT

> **문서 ID**: PLAN-TASK-UIUX-PHASE3-HOME-COCKPIT  
> **요구사항 연계**: [REQ-TASK-UIUX-PHASE3-HOME-COCKPIT](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-UIUX-PHASE3-HOME-COCKPIT.md)  
> **티켓 연계**: #TASK-UIUX-PHASE3-HOME-COCKPIT  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: UI/UX 마스터 로드맵 Phase 3 홈 1초 조망 ↔ 무저항 체크인 콕핏 8대 과업 완결.
  1. `#UIUX-25` [HOME-1SEC] 무스크롤 1초 원스크린 조망 콕핏 레이아웃 재편 (Glance & Expand)
  2. `#UIUX-26` [NO-PRESUMPTION] [공준 1: 무예단 원칙] 오늘의 3초 체크인 입력창 임의 채우기 소거 (깨끗한 빈칸 대기)
  3. `#UIUX-27` [DYNAMIC-HINT] [생각메모장 88번] 목표 커닝페이퍼 칩 선택 시 placeholder 동적 힌트화
  4. `#UIUX-28` [DIMENSION-SLIDER] [공준 3: 차원 엄격 분리] 신체 컨디션과 정신 몰입도 독립 2줄 슬라이더
  5. `#UIUX-29` [TACTILE-REWARD] [공준 5: 촉각적 손맛] 실천 저장 즉시 0.5초 축하 연출 & +10 EXP 피드백
  6. `#UIUX-30` [HEATMAP-SCALE] 홈 히트맵 14px 스케일업 & 4주 콤팩트 뷰
  7. `#UIUX-31` [QUEST-CARDS] 당일 퀘스트 체크박스 44px 대형화 & 취소선 사운드/모션
  8. `#UIUX-32` [DATE-NAV] 어제/오늘/내일 1초 전환 날짜 네비게이터 칩
- **영향 받는 파일 목록 전수**:
  - `ui.css`: 1초 콕핏 그리드, 14px 히트맵 셀, 44px 퀘스트 터치타깃, 2줄 슬라이더, 날짜 네비게이터 칩 스타일
  - `js/tabs/home/sub-heatmap.js`: 4주(28일) 히트맵 렌더러 및 14px 셀 스케일업
  - `js/tabs/home/sub-quest.js`: 44px 퀘스트 체크박스 및 취소선 모션
  - `js/tabs/home/sub-today.js`: 무예단 빈칸 유지, 동적 힌트, 신체·정신 2줄 슬라이더, 0.5초 축하 연출
  - `js/tabs/home/index.js`: 홈 메가블록 오케스트레이션 및 날짜 네비게이터 연동
  - `index.html`: 마크업 및 기존 렌더러 호환성 보장
  - `reports/TASK-UIUX-PHASE3-HOME-COCKPIT/claims.json`: 법정 심사 청구서

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 모바일 사용자가 홈 진입 1초 만에 상태를 조망하고, 3초 만에 무저항으로 실천을 기록하며 12ms 촉각 손맛과 즉각적 도파민 보상을 받는 콕핏 엔진 구축.
- **[원인] (Technical Causes)**: 기존 단일 컬럼의 긴 나열, 입력창 값 덮어쓰기로 인한 지움 마찰, 신체·정신 차원 혼재, 14일 좁쌀 히트맵의 시인성 한계.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.records`: 체크인 시 `energy`, `focus` 메타데이터 영구 보존.
  - `window.OurgoalEvents`: `checkin:created`, `view:sync` 이벤트를 통한 수밀 격벽 상태 전파.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 897개 버튼 Zero Dead-Click 100% 보존.
  - 기존 `WHITELIST` 위젯 컨테이너 ID 100% 보존.
  - 조선소 24개 모듈러 파일 800줄 이하 엄수.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[날짜 네비게이터 칩 / 1초 콕핏 조망] -> [커닝페이퍼 칩 탭 ➔ 동적 힌트 설정] -> [깨끗한 빈칸 타이핑 + 신체·정신 슬라이더 조절] -> [기록 완료 버튼 터치] -> [12ms 햅틱 + 0.5초 축하 연출 + 10 EXP 적립] -> [Supabase/LocalStorage 영속화] -> [4대 뷰 동시 전파]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | 콕핏 레이아웃, 히트맵 14px, 44px 체크박스, 슬라이더 스타일 | +90줄 | 0줄 | +90줄 | 디자인 토큰 기반 |
| `js/tabs/home/sub-heatmap.js` | 4주 콤팩트 뷰 & 14px 스케일업 렌더링 | +45줄 | -5줄 | +40줄 | 서브블록 고도화 |
| `js/tabs/home/sub-quest.js` | 44px 대형 체크박스 및 취소선 모션 | +40줄 | -5줄 | +35줄 | 서브블록 고도화 |
| `js/tabs/home/sub-today.js` | 무예단 빈칸, 2줄 슬라이더, 0.5초 축하 연출 | +65줄 | -5줄 | +60줄 | 서브블록 고도화 |
| `js/tabs/home/index.js` | 날짜 네비게이터 및 메가블록 조율 | +30줄 | 0줄 | +30줄 | 메가블록 허브 |
| `index.html` | 콕핏 날짜 칩 및 슬라이더 컨테이너 보완 | +20줄 | 0줄 | +20줄 | 외과수술적 연계 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#homeDateNav`, `#sliderEnergy`, `#sliderFocus`, `.quest-checkbox-44` 등 고유 ID/클래스 부여.
2. **이벤트 리스너 (Listener)**: 슬라이더 `input` 이벤트, 날짜 칩 `click` 이벤트, 저장 버튼 햅틱 결속.
3. **비즈니스 로직 (Logic)**: `energy`/`focus` 기록 객체 보존, 4주 히트맵 계산 로직, 날짜 필터링.
4. **피드백 & 예외처리 (Feedback)**: 12ms 진동, +10 EXP 팝업, 0.5초 펄스 애니메이션, 400ms 중복 클릭 가드.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가? (위젯 ID 및 클래스 100% 보존)
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (스타일 컴포넌트 선언)**: `ui.css`에 1초 콕핏 레이아웃, 14px 히트맵 그리드, 44px 퀘스트 체크박스, 2줄 슬라이더, 날짜 네비게이터 CSS 추가.
2. **Step 2 (히트맵 서브블록 고도화)**: `js/tabs/home/sub-heatmap.js`에 4주(28일) 콤팩트 히트맵 및 14px 셀 렌더링 구현.
3. **Step 3 (퀘스트 서브블록 고도화)**: `js/tabs/home/sub-quest.js`에 44px 체크박스 어포던스 및 취소선 사운드/햅틱 결속.
4. **Step 4 (체크인 서브블록 고도화)**: `js/tabs/home/sub-today.js`에 [공준 1: 무예단 빈칸], [생각메모장 88번 동적 힌트], [공준 3: 신체·정신 2줄 슬라이더], [공준 5: 0.5초 축하 연출] 구현.
5. **Step 5 (메가블록 및 도크 통합)**: `js/tabs/home/index.js` 및 `index.html`에 날짜 네비게이터 연동 및 1초 조망 콕핏 통합.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 신규 날짜 네비게이터 칩 및 슬라이더 조작 시 콘솔 에러 0건 및 897개 버튼 전수 배선 확인 (`verify-all-clicks.js` PASS).
- **시나리오 B (Zero Data Loss)**: 체크인 저장 시 기존 레코드 필드 손실 없이 `energy`, `focus` 추가 보존 확인.
- **시나리오 C (Zero UX Regression)**: 게스트/소셜 로그인 세션 유지, 3대 본질(E1/E2/E3) 루프 무손실 검증.
- **시나리오 D (Full State Propagation)**: 체크인 시 히트맵, 레벨 배지, 퀘스트 달성도 즉각 동시 반영 확인.
- **시나리오 E (자동화 게이트 통과)**: `npm test` 440개 스모크 및 `verify-integrity-gate.js` 38개 게이트 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] 조선소 모듈러 무결성 검증: `node scripts/test-shipyard-modular.js` PASS
- [ ] GitHub 법정 심사 청구 (PR 생성 및 court.yml 통과 검증)

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 모바일 375px 화면폭에서 28일 히트맵 도트가 겹치거나 가로 오버플로우가 발생하는 현상.
- **사전 방어 및 우회 로직**: 요일(7열) × 주차(4행) 콤팩트 그리드로 설계하여 가로폭을 320px 이내로 안전하게 유지.
- **롤백 계획 (Rollback Strategy)**: 문제 발생 시 `git checkout main`으로 즉시 복귀 가능한 외과수술적 독립 브랜치 운용.
- **재검증 트리거**: 자동화 테스트 실패 시 원칙 ④의 비판적 검토 단계로 회귀하여 렌더러 파라미터 재검증.
