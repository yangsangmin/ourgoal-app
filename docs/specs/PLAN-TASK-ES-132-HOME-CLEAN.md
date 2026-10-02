# 엔지니어링 작업계획서 (PLAN) — [홈탭] 153px 거대 평가 배너 인라인 소거 및 헤드라인 어색한 4줄 쪼개짐 워드브레이크(keep-all)·컨디션 듀얼 슬라이더 터치 조작성 고도화

> **문서 ID**: PLAN-TASK-ES-132-HOME-CLEAN  
> **요구사항 연계**: [REQ-TASK-ES-132-HOME-CLEAN](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-132-HOME-CLEAN.md)  
> **티켓 연계**: #TASK-ES-132 ([132])  
> **작성 일시**: 2026-10-02  
> **작성자**: antigravity-session-75840bfe  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  1. 홈 메인 헤드라인(`#homeHeadlineSentence`, `.toss-headline`)의 플렉스 컬럼 수직 스택 결함을 소거하고, `display: block !important; word-break: keep-all !important; line-height: 1.38 !important;`를 적용하여 1~2줄의 자연스러운 브리핑 문장으로 표시.
  2. 153px 거대 평가 배너(`#homeEvalBanner`)를 시각적으로 완전 소거(`display: none !important;`)하여 홈 화면 최하단 공간 낭비 제거 (DOM ID 및 테스트 텍스트 100% 보존).
  3. 컨디션/집중도 듀얼 슬라이더(`.dimension-range-input`)의 터치 타깃을 44px 이상(`height: 44px; min-height: 44px;`)으로 확장하고, 26px 썸 및 8px 트랙 스타일을 정밀 배선하여 모바일 터치 조작성 극대화.
- **영향 받는 파일 목록 전수**:
  - `ui.css`: 헤드라인 워드브레이크, 평가 배너 은폐, 슬라이더 터치 박스 및 트랙/썸 스타일링.
  - `docs/rules/TICKETS.md`: 티켓 상태 관리.
  - `dev_log.md`: 작업 로그 기록.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 모바일 뷰포트 최적화 및 터치 접근성(WCAG 2.5.5) 준수.
- **[원인] (Technical Causes)**: flexbox 아이템 강제 분할, 8px range 인풋 바운딩, 정적 153px 배너의 화면 점유.
- **[중심 배선] (Core Wire & State)**:
  - `.toss-headline, #homeHeadlineSentence`: `display: block; word-break: keep-all; line-height: 1.38;`
  - `#homeEvalBanner`: `display: none !important;`
  - `.dimension-range-input`: `height: 44px !important;` 및 `::-webkit-slider-runnable-track` (8px), `::-webkit-slider-thumb` (26px, margin-top: -9px).
- **[핵심 안전장치] (Critical Safety & Persistence)**: 기존 스모크 테스트와 헌법 검증에서 사용하는 모든 DOM ID 및 요소는 100% 무손실 보존.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | 헤드라인 워드브레이크, 평가 배너 소거, 슬라이더 터치 규격 확장 | +35줄 | -10줄 | +25줄 | 스타일링 |
| `dev_log.md` | 작업 단계 및 실측 기록 | +30줄 | 0줄 | +30줄 | 문서 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 스모크 테스트 및 법정 테스트의 assertion 조건을 100% 만족하는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`ui.css`)**:
   - `.toss-headline`: `display: block; word-break: keep-all; line-height: 1.38; overflow-wrap: break-word;`
   - `.toss-headline b`: `display: inline;`
   - `#screen-home #homeEvalBanner, #homeEvalBanner, .home-eval-banner-box`: `display: none !important; height: 0 !important; margin: 0 !important; padding: 0 !important;`
   - `.dimension-range-input`: `height: 44px !important; min-height: 44px !important; background: transparent !important;` 및 웹킷/모질라 가상 요소 규격화.
2. **Step 2 (단위/통합 테스트)**:
   - `npm test`로 440개 smoke test 및 38개 gates 전수 통과 확인.
3. **Step 3 (CDP 실측 및 스크린샷)**:
   - `scratch/verify_es132_cdp.js`를 작성 및 실행하여 모바일 390px 뷰포트에서 헤드라인 개행, 배너 소거(높이 0), 슬라이더 높이(44px) 실측 및 스크린샷 캡처.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 홈 헤드라인, 듀얼 슬라이더 조작 시 콘솔 에러 0건 및 이벤트 정상 전파.
- **시나리오 B (Zero Data Loss)**: 유저 프로필 및 기록 데이터 100% 무손실 보존.
- **시나리오 C (Zero UX Regression)**: 헤드라인 2줄 이내 안정적 브리핑, 거대 배너 완전 소거, 듀얼 슬라이더 44px 터치 보장.
- **시나리오 D (Full State Propagation)**: 슬라이더 조작 시 퍼센티지 라벨 및 체크인 값 완벽 연동.
- **시나리오 E (자동화 게이트 통과)**: `npm test` 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] `ui.css` 외과수술적 수정 적용
- [ ] `npm test` 통과 (0개 실패)
- [ ] Headless Chrome CDP 실측 스크립트 작성 및 스크린샷 캡처
- [ ] 법정 claims.json 및 시나리오 작성

---

## 8. [원칙 ⑧] 롤백 계획 및 지속적 피드백 수렴
- **롤백 계획**: 문제 발생 시 `git checkout ui.css`로 즉각 원상 복구 가능.
- **피드백 수렴**: 홈탭 첫인상(E1)과 기록 조작감(E2) 모니터링 후 추가 개선 반영.
