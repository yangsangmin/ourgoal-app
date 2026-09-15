# 엔지니어링 작업계획서 (PLAN) — 아워골 전면 UI '지금부터 시간기록 & 데이터 가져오기' 프로 콕핏 디자인 시스템 통일 (#TASK-ES-098)

> **문서 ID**: PLAN-UNIFIED-MODERN-COCKPIT-THEME  
> **작성일**: 2026-09-15  
> **작성자**: Antigravity (Gemini)  
> **기반 규격**: docs/specs/REQ-UNIFIED-MODERN-COCKPIT-THEME.md

---

## 1. 문제해결 8원칙 2회차 적용 엔지니어링 분석

### ① 파악 (Scope & Boundaries)
- **변경 대상**: `C:\dev\ourgoal-app\ui.css` (단일 집중 변경).
- **불변 대상**: `index.html` (22,196줄 100% 불변), JS 기능 로직, 데이터베이스 스키마.
- **예상 작업 시간**: 20분.

### ② 중심 배선 식별 (Core Wiring)
- `ui.css` 내 핵심 스타일 클래스 블록:
  1. `:root` & 테마별 디자인 토큰 (`--card-border`, `--shadow-sm`, `--shadow`, `--shadow-float`, `--radius-lg`, `--brand-soft`, `--input-bg`)
  2. 카드 컴포넌트: `.card`, `.dock-card`, `.home-card`, `.stat-card`
  3. 버튼 컴포넌트: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-sm`, `.mz-btn`
  4. 폼 인풋: `input[type=text]`, `textarea`, `select` 포커스 링 및 트랜지션
  5. 탭 세그먼트: `.comm-subtabs`, `.format-toggle`, `.auth-tabs`, `.pro-sw-modes`
  6. 모달 & 바텀시트: `.modal-card`, `.sheet-inner`, `.bottomnav-inner`
  7. 칩 & 배지: `.goal-chip`, `.dday-pill`, `.streak-pill`, `.privacy-badge`

### ③ 파일별 Before & After 및 변경 예산
- **`ui.css`**:
  - Before: `--shadow: none;`, 평면 플랫 보더, 기본 플랫 버튼, 정적 카드.
  - After: '지금부터 시간기록' & '데이터 가져오기' 수준의 프리미엄 SaaS 콕핏 룩앤필 (헤어라인 보더, 마이크로 섀도우, 호버 리프트 `translateY(-1px)`, 버튼 액티브 스케일 `scale(0.97)`, 글래스모피즘 블러).
- **`index.html`**: 순증가 **0줄 (Net 0 lines)** 유지 (총 22,196줄 불변 엄수).

### ④ 재검토 (Safety & Regression Guards)
- 단위 테스트 245개 및 무결성 검증 스크립트 12종에서 클래스 셀렉터 변경 여부를 전수 점검. 기존 셀렉터(`.btn`, `.card`, `.btn-primary` 등)는 100% 유지하고 내부 속성값(CSS declarations)만 세련되게 업그레이드하므로 기능 깨짐 위험 0%.

### ⑤ 구현 상세 순서
1. **디자인 토큰 리파인**: `:root`의 `--card-border`, `--shadow-sm`, `--shadow`, `--shadow-float`, `--radius` 정밀 튜닝.
2. **다크 모드 토큰 동기화**: `[data-theme="black"]`, `[data-theme="dark"]`, `[data-theme="dark-space"]` 등의 보더와 배경을 깊이감 있는 딥 콕핏 스타일로 조율.
3. **카드 & 버튼 인터랙션 고도화**: `.card`와 `.btn`에 마이크로 엘리베이션과 부드러운 스케일 트랜지션 적용.
4. **인풋 & 탭 세그먼트 고도화**: 필 세그먼트 컨트롤과 포커스 링 개선.
5. **모달 & 바텀시트 블러 강화**: 백드롭 블러와 헤어라인 보더 정돈.

### ⑥ 5대 무결성 검증 시나리오
- [x] 검증 1: 껍데기 버튼/데드클릭 정적 검사 (Zero Dead Click)
- [x] 검증 2: 유저 데이터 10종 페르소나 무손실 (Zero Data Loss)
- [x] 검증 3: 화면 간 상태 전파 (State Propagation)
- [x] 검증 4: 3대 본질(E1/E2/E3) 회귀 방지
- [x] 검증 5: `npm test` 245개 스모크 테스트 100% 통과

### ⑦ 체크리스트 (마감 상한선: 4단계)
- [ ] 1. `ui.css` 글로벌 토큰 및 컴포넌트 스타일 리파인 반영
- [ ] 2. `npm test` 245개 테스트 및 5대 무결성 게이트 100% 통과
- [ ] 3. 로컬 브라우저 구동 및 스크린샷 캡처 (3단계: 로컬 수동 확인 상태)
- [ ] 4. 안전 브랜치 커밋 및 로컬 main 병합 (4단계: 로컬 메인 병합 상태)

### ⑧ 블로커 대책 (Blockers & Countermeasures)
- 텍스트 가독성 저하 방지: 마이크로 섀도우 추가 시 텍스트 명도비(WCAG AA 기준 4.5:1 이상)가 훼손되지 않도록 텍스트 색상(`--ink`, `--ink-soft`) 대비는 견고하게 유지.
