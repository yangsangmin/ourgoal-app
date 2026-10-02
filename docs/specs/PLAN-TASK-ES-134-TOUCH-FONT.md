# 엔지니어링 작업계획서 (PLAN) — [전체/공통] 전 탭 44px 미달 터치 타깃 및 12px 미만 극소 폰트 일괄 44px/13px 규격화 (모바일 조작 피로도 제로화)

> **문서 ID**: PLAN-TASK-ES-134-TOUCH-FONT  
> **요구사항 연계**: [REQ-TASK-ES-134-TOUCH-FONT](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-134-TOUCH-FONT.md)  
> **티켓 연계**: #TASK-ES-134 ([134])  
> **작성 일시**: 2026-10-02  
> **작성자**: antigravity-session-75840bfe  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  1. 전 탭 공통 인터랙티브 컨트롤(.btn, .chip, .navbtn, .s-seg-pill, .subtab, .mode-chip, .time-chip, .filter-chip 등)에 min-height: 44px 규격 일괄 적용.
  2. 12px 미만 극소 폰트(.faint, .meta, .sub-text, 뱃지 등)를 최소 12.5px~13px로 일괄 스케일업 및 line-height 1.4 표준화.
  3. 모바일 터치 딜레이 제거(touch-action: manipulation) 및 가로 스크롤 누수(docScrollWidth <= 390px) 원천 차단.
- **영향 받는 파일 목록 전수**:
  - `ui.css`: 전역 터치 타깃 44px 유틸리티 및 폰트 하한선 12.5px 표준화 스타일 배선.
  - `docs/rules/TICKETS.md`: 티켓 상태 관리.
  - `dev_log.md`: 작업 로그 기록.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 전역 CSS 레벨에서 WCAG AAA 및 모바일 OS 표준 44px 터치 타깃과 12.5px 가독성 폰트를 견고히 탑재.
- **[원인] (Technical Causes)**: 개별 컴포넌트별로 하드코딩된 초소형 height/font-size가 전역 디자인 토큰보다 우선 적용되었던 파편화.
- **[중심 배선] (Core Wire & State)**:
  - `ui.css` 내 공통 컴포넌트 클래스에 `min-height: 44px !important;` 및 `touch-action: manipulation;` 명시.
  - 초소형 폰트 선택자군에 `font-size: 12.5px !important; line-height: 1.4 !important;` 명시.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 440개 스모크 테스트와 38개 헌법 게이트가 요구하는 모든 DOM 구조 및 스타일 규칙을 100% 무손실 보존.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | 전역 터치 타깃 44px 규격화 & 12.5px 폰트 표준화 스타일 배선 | +35줄 | 0줄 | +35줄 | 스타일링 |
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
   - `/* [#TASK-ES-134] 전 탭 44px 터치 타깃 & 12.5px 가독 폰트 규격화 */` 블록 신설.
   - 버튼, 서브탭, 칩, 세그먼트 필터, 모드 칩, 시간 칩에 `min-height: 44px`, `touch-action: manipulation` 적용.
   - 메타, 설명, 뱃지, 태그에 `font-size: 12.5px`, `line-height: 1.4` 적용.
2. **Step 2 (단위/무결성 테스트 검증)**:
   - `npm test` 실행하여 440개 스모크 및 38개 게이트 100% 통과 확인.
3. **Step 3 (Headless Chrome CDP 실측 검증)**:
   - `scratch/verify_es134_cdp.js` 작성 및 실행.
   - 각 탭별 버튼 높이 실측(>= 44px), 폰트 크기(>= 12px), 뷰포트 너비(390px) 확인.
   - 스크린샷 캡처 및 아티팩트 디렉토리 복제.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 전 탭 주요 버튼 및 칩 클릭 시 콘솔 에러 0건 및 12ms 햅틱 반응 확인.
- **시나리오 B (Zero Data Loss)**: 유저 세팅, 목표, 기록, 루틴 데이터 100% 무손실 보존.
- **시나리오 C (Zero UX Regression)**: 모바일 390px 뷰포트에서 가로 스크롤 누수 없이 모든 요소가 안정적으로 레이아웃 안착.
- **시나리오 D (Full State Propagation)**: 서브탭 및 필터 칩 전환 시 관련 리스트 및 뷰가 원자적으로 동시 갱신.
- **시나리오 E (자동화 게이트 통과)**: `npm test` 440개 단위테스트 + 38개 무결성 게이트 100% 통과.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] `ui.css` 전역 터치 타깃 44px & 12.5px 폰트 규격화 스타일 배선
- [ ] `npm test` 통과 (0개 실패)
- [ ] Headless Chrome CDP 실측 스크립트 작성 및 스크린샷 캡처
- [ ] 법정 claims.json 및 시나리오 작성

---

## 8. [원칙 ⑧] 롤백 계획 및 지속적 피드백 수렴
- **롤백 기준**: 터치 타깃 확장으로 인해 기존 레이아웃이 깨지거나 가로 오버플로우가 발생하는 경우 직전 커밋으로 롤백.
- **피드백 수렴**: 실제 터치 조작 반응성과 시인성을 CDP 캡처로 상민님께 보고하고 추가 튜닝 요청 수렴.
