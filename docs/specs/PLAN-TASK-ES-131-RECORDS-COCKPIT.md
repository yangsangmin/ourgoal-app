# 엔지니어링 작업계획서 (PLAN) — [기록탭] 스톱워치·히트맵·타임라인 3중 분산 해소 및 단일 콕핏 아키텍처(통계/히트맵 vs 타이머 vs 타임라인 3모드 클린 스위처)

> **문서 ID**: PLAN-TASK-ES-131-RECORDS-COCKPIT  
> **요구사항 연계**: [REQ-TASK-ES-131-RECORDS-COCKPIT](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-131-RECORDS-COCKPIT.md)  
> **티켓 연계**: #TASK-ES-131 ([131])  
> **작성 일시**: 2026-10-02  
> **작성자**: antigravity-session-75840bfe  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  1. 기록 탭 상단 모드 스위처를 3대 모드([📈 히트맵·통계 | ⏱️ 몰입 타이머 | 📝 실천 타임라인])로 명쾌하게 단일화.
  2. 선택된 단일 모드만 화면에 시원하게 렌더링되도록 뷰포트 완전 격리 (히트맵 뷰에서 중복 스톱워치 카드, 타임라인/달력 토글 등 중복 침범 차단).
  3. 기간 필터 칩(`.s-seg-pill`) 높이 40px 이상, 폰트 13px 이상으로 정규화하여 31개 터치 타깃 미달 및 57개 미세폰트 원천 해소.
  4. 기능 안내 카드 `#og-task-24-container` 완전 은폐.
- **영향 받는 파일 목록 전수**:
  - `js/sanctuary-v3-engine.js`: 기록 탭 상단 모드 스위처 및 히트맵 푸터 중복 스톱워치 버튼 정돈.
  - `ui.css`: `#quickStopwatchBar`, `#recCalFuseSwitcher`, `#og-task-24-container` 은폐 및 `.s-seg-pill` 40px+/13px+ 스타일 배선.
  - `docs/rules/TICKETS.md`: 티켓 상태 관리.
  - `dev_log.md`: 작업 로그 기록.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 뷰포트 단일 격리를 통한 3모드 클린 스위처 아키텍처.
- **[원인] (Technical Causes)**: 상단 네비게이션과 하단 정적 HTML 위젯 간의 상호 배타성 부재로 인한 3중 기능 적재.
- **[중심 배선] (Core Wire & State)**:
  - `OurgoalSanctuaryV3.activeRecMode`: `'heatmap' | 'timer' | 'feed'` 3모드 상태 제어.
  - `setRecordsSegment`: `'stats' | 'feed' | 'archive'` 클래식 세그먼트와 원자적 동기화 유지.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 기존 스모크 테스트 DOM ID 및 함수 서명 100% 보존.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[기록 탭 모드 선택] -> [setRecMode('heatmap'|'timer'|'feed')] -> [단일 모드 렌더링] -> [격리된 클린 뷰포트 표출]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/sanctuary-v3-engine.js` | 3모드 스위처 및 히트맵 카드 푸터 스톱워치 버튼 정돈 | +15줄 | -10줄 | +5줄 | 비즈니스 로직 |
| `ui.css` | 중복 위젯 은폐 및 40px+/13px+ 필터 칩 토큰 배선 | +30줄 | 0줄 | +30줄 | 스타일링 |
| `dev_log.md` | 작업 단계 및 실측 기록 | +25줄 | 0줄 | +25줄 | 문서 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `s-rec-mode-btn` 3모드 버튼 시맨틱 태그 및 헌법 ID 보존.
2. **이벤트 리스너 (Listener)**: `onclick="window.OurgoalSanctuaryV3.setRecMode('...')"` 명확한 바인딩.
3. **비즈니스 로직 (Logic)**: 실제 히트맵 렌더러, 뽀모도로 타이머, 타임라인 피드 렌더러 연결.
4. **피드백 & 예외처리 (Feedback)**: 모드 전환 시 햅틱 피드백 및 토스트 안내.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`ui.css`)**:
   - `#quickStopwatchBar`, `#recCalFuseSwitcher`, `#og-task-24-container`에 `display: none !important;` 선언.
   - `.s-segment-pills .s-seg-pill` 및 `.s-seg-pill`에 `min-height: 40px !important; font-size: 13px !important;` 배선.
   - `.s-heatmap-card` 내부의 중복 스톱워치 콕핏 버튼 은폐 스타일 배선.
2. **Step 2 (`js/sanctuary-v3-engine.js`)**:
   - `renderSanctuaryRecords()` 내 `modeNav`를 3대 모드(`heatmap`: 📈 히트맵·통계, `timer`: ⏱️ 몰입 타이머, `feed`: 📝 실천 타임라인)로 단일화.
   - 히트맵 카드 내 중복 `스톱워치 콕핏` 버튼 정리.
3. **Step 3 (테스트 검증)**:
   - `npm test` 스모크 440개 및 무결성 게이트 38개 전수 실행.
4. **Step 4 (CDP 실측 및 스크린샷)**:
   - Headless Chrome CDP로 390px 뷰포트에서 필터 칩 높이, 폰트 크기, 중복 위젯 은폐 상태 실측 및 스크린샷 캡처.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 3모드 스위처 및 필터 칩 클릭 시 핸들러 정상 호출 및 콘솔 에러 0건.
- **시나리오 B (Zero Data Loss)**: 유저 기록 데이터 100% 무손실 보존.
- **시나리오 C (Zero UX Regression)**: 히트맵 뷰, 타이머 뷰, 피드 뷰가 서로 침범하지 않고 깔끔하게 렌더링.
- **시나리오 D (Full State Propagation)**: 타이머 기록 시 4대 뷰 동시 전파 확인.
- **시나리오 E (자동화 게이트 통과)**: `npm test` 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] `ui.css` 및 `js/sanctuary-v3-engine.js` 외과수술적 편집
- [ ] `npm test` 통과 (0개 실패)
- [ ] Headless Chrome CDP 실측 스크립트 작성 및 스크린샷 캡처
- [ ] 법정 claims.json 및 시나리오 작성
- [ ] PR 생성 및 GitHub Court 법정 심사 청구

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 스모크 테스트 중 `s-rec-mode-btn` 관련 기존 텍스트 매칭이 존재할 가능성 -> **대책**: 스모크 테스트 내 단언문 사전 검색 확인.
- **롤백 계획 (Rollback Strategy)**: 문제 발생 시 `git reset --hard HEAD`로 즉각 원복 가능.
- **재검증 트리거**: CDP 실측에서 터치 타깃 < 40px 확인 시 CSS 셀렉터 우선순위 재보강.
