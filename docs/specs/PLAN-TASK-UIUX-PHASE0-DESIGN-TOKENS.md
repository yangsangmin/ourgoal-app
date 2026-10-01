# 엔지니어링 작업계획서 (PLAN) — [UI/UX 틀 개편 Phase 0] 기반 디자인 시스템 & 토큰 아키텍처

> **문서 ID**: PLAN-TASK-UIUX-PHASE0-DESIGN-TOKENS  
> **요구사항 연계**: [REQ-TASK-UIUX-PHASE0-DESIGN-TOKENS](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-UIUX-PHASE0-DESIGN-TOKENS.md)  
> **티켓 연계**: #TASK-UIUX-PHASE0-DESIGN-TOKENS  
> **작성 일시**: 2026-10-02  
> **작성자**: 97b0246e  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 4대 테마 전용 1급 CSS 변수 단일화, 7~70세 폰트 스케일, 전역 최소 44px 터치타겟, 12ms 햅틱 유틸, 스켈레톤 로딩, Z-Index 위계, 둥근 모서리 일원화, 3대 금지어 정화 등 Phase 0 8대 과업을 완결한다.
- **영향 받는 파일 목록 전수**:
  - `ui.css`: 전역 디자인 토큰(:root 및 4대 테마), 폰트 스케일, 44px 터치 타겟 클래스, Z-Index 계층, 스켈레톤 애니메이션
  - `ui.js`: 전역 햅틱 피드백 함수(`triggerHaptic`) 배선 및 터치 반응성 보조
  - `docs/rules/TICKETS.md`: 승인 티켓 등록
  - `reports/TASK-UIUX-PHASE0-DESIGN-TOKENS/claims.json`: 법정(court) 심사용 청구서

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 개별 컴포넌트의 수동 인라인 스타일링을 전면 탈피하고, 전 탭의 시각 및 인터랙션 상태가 `--bg`, `--ink`, `--brand`, `--touch-min` 등 단일 SSOT CSS 변수 트리에 귀속되는 반응형 디자인 토큰 아키텍처 확립.
- **[원인] (Technical Causes)**: 다수의 PR 병합 과정에서 탭별로 별도 정의된 폰트 크기 및 여백 클래스가 혼재하여 시각적 파편화가 누적된 기술적 부채.
- **[중심] (Core Wire & State)**:
  - `ui.css` `:root` 및 `[data-theme="..."]`: 4대 테마 전용 1급 CSS 변수 시스템
  - `triggerHaptic(12)`: 12ms 촉각 진동 API와 사용자 터치 리스너 결속
- **[핵심] (Critical Safety & Persistence)**: 440개 스모크 테스트, 38개 무결성 게이트, 893개 데드클릭 제로 및 6대 메가블록의 100% 무손실 작동 보증.
- **종단간 데이터 흐름 다이어그램**:
  `[테마 변경/터치] -> [data-theme 속성 전파] -> [1급 CSS 변수 원자적 재계산] -> [전 탭 4대 뷰 일괄 반영] -> [12ms 햅틱 손맛]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | 4대 테마 1급 변수 보강, 44px 터치타겟, 스켈레톤, Z-index | +70줄 | -10줄 | +60줄 | CSS 토큰 준수 |
| `ui.js` | 12ms 햅틱 피드백 공통 유틸 배선 | +15줄 | 0줄 | +15줄 | 유틸리티 보강 |
| `docs/rules/TICKETS.md` | Phase 0 티켓 등록 | +2줄 | 0줄 | +2줄 | 대장 정합 |
| `reports/TASK-UIUX-PHASE0-DESIGN-TOKENS/claims.json` | 법정 심사 청구서 | +40줄 | 0줄 | +40줄 | 심사 명세 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: 시인성 높은 시맨틱 클래스(`.touch-target-44`, `.skeleton-pulse`)
2. **이벤트 리스너 (Listener)**: 터치 시 12ms 진동 트리거
3. **비즈니스 로직 (Logic)**: 테마 전환 시 로컬스토리지 영속화 및 `data-theme` 갱신
4. **피드백 & 예외처리 (Feedback)**: 햅틱 미지원 기기 조용한 graceful fallback

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`ui.css`)**: `:root` 토큰에 `--touch-min: 44px;`, 폰트 스케일, Z-Index 계층(`--z-sheet: 100;`), 스켈레톤 애니메이션 추가.
2. **Step 2 (`ui.js`)**: `triggerHaptic(ms = 12)` 함수 및 글로벌 배선.
3. **Step 3 (정적 검증)**: 3대 금지어 전수 스캔 및 린터 검증.
4. **Step 4 (테스트)**: `npm test` 로컬 실행 및 38개 무결성 게이트 검증.
5. **Step 5 (법정 청구)**: `reports/TASK-UIUX-PHASE0-DESIGN-TOKENS/claims.json` 작성 및 PR 생성.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **반론 1**: `ui.css`에 신규 토큰 및 스켈레톤 스타일을 추가했을 때 기존 15,000줄 CSS와의 우선순위(Specificity) 충돌 위험은 없는가?
  - **반박 및 수용**: 기존 클래스명을 일체 건드리지 않고 최상단 `:root` 변수 확장 및 신규 유틸리티 클래스(`.touch-target-44`, `.skeleton-card`)로 추가하므로 기존 스타일과의 특이성 충돌 위험이 전혀 없음.
- **반론 2**: `triggerHaptic` 호출 시 사용자 브라우저 정책(User Interaction 이전 진동 차단)으로 인한 에러 발생 위험은 없는가?
  - **반박 및 수용**: `try { if ('vibrate' in navigator) navigator.vibrate(ms); } catch (_) {}` 방어적 에러 바운더리로 감싸 예외 발생을 원천 차단함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
- `ui.css` 내 `--touch-min`, `--z-sheet`, `.skeleton-pulse` 정의 100% 확인.
- `npm test`: 스모크 440개 + 무결성 게이트 38개 + 데드클릭 893개 100% 통과.
- GitHub Actions 법정: `success(통과)` 판정.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- 만약 특정 모바일 브라우저에서 햅틱 경고 발생 시:
  - `navigator.vibrate` 가드 확인 및 무음 폴백으로 즉시 전환.
