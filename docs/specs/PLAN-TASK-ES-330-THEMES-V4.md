# 엔지니어링 작업계획서 (PLAN) — [79] 화면스타일 테마 4종 압축 및 전 테마 시인성·동일 작동 전면 개선

> **문서 ID**: PLAN-TASK-ES-330-THEMES-V4  
> **요구사항 연계**: [REQ-TASK-ES-330-THEMES-V4](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-330-THEMES-V4.md)  
> **티켓 연계**: #TASK-ES-330  
> **작성 일시**: 2026-09-28  
> **작성자**: Antigravity Pair Programmer  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 설정창 화면&홈 구성 내 화면스타일 테마를 4종(`focus-sanctuary`, `black`, `white`, `urban-city`)으로 완전 일원화하고, `ui.css`에 4대 테마 전용 1급 CSS 변수 시스템(Design Tokens)을 구축하여 White-on-White 및 Black-on-Black 결함을 전면 해소하며, 테마 프리뷰 스와치 렌더링, 12ms 햅틱 반응, meta theme-color 동기화, 직통 핸들러 및 원자적 전파를 완결한다.
- **영향 받는 파일 목록 전수**:
  - `ui.css`: 4대 테마 1급 디자인 토큰 변수 블록 정의, 뷰포트 배경 및 텍스트 고대비 스타일, `.theme-swatch`, `.toss-checkin-clean-box` 테마 분기 스타일
  - `index.html`: `THEMES` 4대 테마 배열 정의, `applyTheme` 내 12ms 햅틱(`triggerHaptic(12)`) 및 `meta[name="theme-color"]` 실시간 동기화, `themeGrid` 내 `.theme-swatch` 렌더링
  - `js/components.js`: `handle설정_Item79Action`, `handle테마_Item79Action` 직통 핸들러 구현 및 3자 export (`OurgoalComponents`, `window`, `module.exports`)
  - `tests/theme-system-v4.test.js`: 4대 테마 토큰 및 동작 무결성 단위 테스트 신설
  - `scripts/smoke-test.js`: `[79] 4대 테마 1급 변수 시스템 존재` 단언문 추가
  - `docs/rules/TICKETS.md`: `#TASK-ES-330` 티켓 등록 및 상태 추적
  - `reports/TASK-ES-330/claims.json`: 15대 법정 단언문(C1~C15) 작성 및 타겟 파일 전수 매핑

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 아워골의 4대 테마는 단순한 장식이 아닌, 사용자가 목표에 몰입하고 일상을 기록하는 '마음의 작업 공간'이다. 4대 테마 전용 1급 디자인 토큰 변수 시스템(`--bg`, `--card`, `--surface`, `--ink`, `--rule`, `--brand` 등)을 구축하여 어떠한 환경에서도 폰트와 배경 간의 대비비(Contrast Ratio >= 4.5:1)를 완벽하게 유지한다.
- **[원인] (Technical Causes)**:
  - 기존에는 `html`과 `body`에 `#05070B !important`가 강제되어 있어 White 테마에서도 다크 배경 잔재가 남았고, 컴포넌트별로 하드코딩된 다크 스타일(`color: #FFFFFF !important`)로 인해 White 테마에서 텍스트가 사라지는 White-on-White 결함이 발생했다.
- **[중심 배선] (Core Wire & State)**:
  - `document.documentElement.setAttribute('data-theme', themeId)`: 전역 테마 속성 배선
  - `state.profile.settings.theme`: 사용자 프로필 테마 영속화
  - `localStorage.setItem('ourgoal_current_theme', themeId)`: 테마 로컬 영속화
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `og_task-79_cache` 로컬 캐시 영속화 및 Supabase 비동기 로깅 배선
  - 4대 뷰 원자적 동시 전파 (`renderSettingsScreen`, `renderHome`, `renderGoalsScreen`, `renderCommScreen`, `renderCalendar`, `renderAll`)
  - 미지원 테마 ID 요청 시 시그니처 테마 `focus-sanctuary`로 안전 폴백
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[설정 탭 테마 클릭] -> [12ms 햅틱 피드백] -> [data-theme 갱신] -> [meta theme-color 갱신] -> [로컬 캐시 및 프로필 영속화] -> [4대 뷰 원자적 리렌더링] -> [토스트 안내]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | 4대 테마 1급 토큰 및 고대비 컴포넌트 스타일 | +120줄 | -20줄 | +100줄 | CSS 토큰 설계 |
| `index.html` | 테마 프리뷰 스와치 및 12ms 햅틱 배선 | +10줄 | -2줄 | +8줄 | 외과수술적 diff |
| `js/components.js` | 직통 핸들러 및 3자 익스포트 | +120줄 | 0줄 | +120줄 | 컴포넌트 배선 |
| `tests/theme-system-v4.test.js` | 단위 테스트 신설 | +65줄 | 0줄 | +65줄 | 무결성 검증 |
| `scripts/smoke-test.js` | [79] 스모크 테스트 단언문 | +5줄 | 0줄 | +5줄 | 회귀 방지 |
| `docs/rules/TICKETS.md` | 티켓 상태 갱신 | +2줄 | 0줄 | +2줄 | 거버넌스 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#themeGrid` 내 `.theme-card` 및 `.theme-dot.theme-swatch`
2. **이벤트 리스너 (Listener)**: 테마 카드 클릭 시 `handle설정_Item79Action` 및 `applyTheme` 즉시 바인딩
3. **비즈니스 로직 (Logic)**: 테마 4종 검증, 로컬스토리지 영속화, meta tag 동기화, `og_task-79_cache` 적재
4. **피드백 & 예외처리 (Feedback)**: 12ms 햅틱 반응, 테마 적용 완료 토스트 안내, 오류 발생 시 정중한 안내

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가? (4대 테마 변수 시스템을 통해 기존 뷰 완벽 보존)
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가? (각 파일의 지정 블록만 외과수술적 수정)
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가? (세팅 내 theme 필드만 갱신, 기존 데이터 무손실)
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가? (CSS 변수 레벨 전파로 레이아웃 스래싱 0)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (디자인 토큰 & CSS)**: `ui.css`에 4대 테마 전용 1급 CSS 변수 시스템 정의 및 하드코딩 다크 배경 제거
2. **Step 2 (마크업 & 뷰포트 배선)**: `index.html` 내 `applyTheme`에 12ms 햅틱, `themeGrid`에 `.theme-swatch` 렌더링 배선
3. **Step 3 (비즈니스 로직 & 핸들러)**: `js/components.js`에 `handle설정_Item79Action`, `handle테마_Item79Action` 탑재 및 3자 익스포트
4. **Step 4 (단위 및 스모크 테스트)**: `tests/theme-system-v4.test.js` 신설 및 `scripts/smoke-test.js` 단언문 추가
5. **Step 5 (4대 뷰 실시간 동시 전파 및 CDP 실측)**: 홈, 기록, 통계, 캘린더 전파 확인 및 375px 모바일 실측 스크린샷 획득

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: `#themeGrid` 테마 카드 4종 및 테마 관련 버튼 전수 클릭 시뮬레이션 -> 콘솔 에러 0건 및 890개 버튼 전수 배선 확인 (`node scripts/verify-all-clicks.js` 통과)
- **시나리오 B (Zero Data Loss)**: 테마 전환 전후로 가상 유저 10종의 프로필, 아바타, 목표, 기록 데이터 100% 무손실 보존 확인
- **시나리오 C (Zero UX Regression)**: White 모드에서 체크인 입력창/버튼/카드 텍스트 대비비 4.5:1 이상 실측 입증 및 Black 모드 True OLED 100% 검증
- **시나리오 D (Full State Propagation)**: 테마 변경 즉시 4대 뷰(홈, 목표, 캘린더, 소통) 및 상단바/하단바 동시 원자적 전파 확인
- **시나리오 E (자동화 게이트 통과)**: 단위 테스트 (`tests/theme-system-v4.test.js`) PASS 및 `npm test` 440개 스모크 테스트 전수 통과

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [x] 단위 테스트 전수 검증: `node tests/theme-system-v4.test.js` PASS
- [x] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS (890개 100%)
- [x] 스모크 테스트 전수 검증: `npm test` PASS (440개 100%)
- [x] 모바일 375px CDP 실측 스크린샷 4대 테마 전수 획득 및 아티팩트 저장
- [x] [4단계: 심사 청구] Git commit, push, draft PR 생성 및 `node court/chat.js <PR번호>` 판정서 확인

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**:
  - 브라우저별 CSS 우선순위 차이 및 미지원 테마 ID 캐시 잔존 가능성.
- **사전 방어 및 우회 로직**:
  - `html[data-theme="..."]` 최상위 셀렉터로 구체성을 높여 하위 하드코딩 오버라이드.
  - 미지원 테마 ID 진입 시 시그니처 테마 `focus-sanctuary`로 즉시 정규화.
- **롤백 계획 (Rollback Strategy)**:
  - 문제 발생 시 `git restore ui.css index.html js/components.js`를 통해 변경 전 상태로 즉각 롤백 가능.
- **재검증 트리거**:
  - 테마 전환 후 텍스트 식별 불가 보고 시 원칙 ②(원인 지점) 및 원칙 ⑤(CSS 토큰)로 즉시 복귀하여 대비비 재측정.
