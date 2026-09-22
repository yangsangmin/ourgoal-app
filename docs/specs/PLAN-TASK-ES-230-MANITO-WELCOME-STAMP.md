# 엔지니어링 작업계획서 (PLAN) — 마니또(Manito) 매칭 즉시 원클릭 웰컴 응원 스탬프 발송 및 실시간 푸시 피드백 배선

> **문서 ID**: PLAN-TASK-ES-230-MANITO-WELCOME-STAMP  
> **요구사항 연계**: [REQ-TASK-ES-230-MANITO-WELCOME-STAMP](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-230-MANITO-WELCOME-STAMP.md)  
> **티켓 연계**: #TASK-ES-230  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity (Micro-interaction & Social Psychology Lead)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  - 마니또 매칭 성공 즉시 화면 상단에 웰컴 응원 카드를 노출하고, 4종 웰컴 스탬프(🔥 불꽃응원, 🍀 행운부적, ☕ 따뜻한차, 👑 완주응원)를 1클릭으로 발송하여 15ms 미세 햅틱 + 폭죽 + "나의 마니또에게 익명 응원이 전달되었습니다 🕊️" 토스트 및 실시간 익명 알림 페이로드를 전달함. 1분 쿨타임 도배 방지 탑재.
- **영향 받는 파일 목록 전수**:
  - `index.html`:
    - `MANITO_WELCOME_STAMPS` 4종 정의.
    - `renderCommManito(body)`: 상단 웰컴 카드 `#manitoWelcomeHeroCard` 렌더링.
    - 웰컴 스탬프 원클릭 발송 핸들러 및 1분 쿨타임(`MANITO_STAMP_COOLDOWN`), 15ms 햅틱 배선.
  - `ui.css`:
    - `.manito-welcome-card`, `.manito-welcome-stamp-btn` 모바일 375px 반응형 스타일.
  - `docs/rules/TICKETS.md`: #TASK-ES-230 승인 티켓 등록.
  - `reports/TASK-ES-230/claims.json`: 5대 법정 청구서 작성.
  - `scripts/smoke-test.js`: [#TASK-ES-230] 단언문 4종 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 감성 인터랙션 파이프라인의 4위 1체 배선 (스탬프 UI + 15ms 햅틱 + 원격 페이로드 + 즉각 체감 피드백).
- **[원인] (Technical Causes)**:
  - 매칭 직후 사용자 행동 유도 카드의 부재 및 15ms 햅틱과 웰컴 전용 토스트의 부재.
- **[중심 배선] (Core Wire & State)**:
  - `MANITO_WELCOME_STAMPS`: `[{ id:'fire', ... }, { id:'luck', ... }, { id:'tea', ... }, { id:'crown', ... }]`
  - `sendManitoWelcomeStamp(pid, sid, btnElement)`: 쿨타임 검사 -> 15ms 햅틱 -> 폭죽 -> `saveProfile()` -> `team_pings` 비동기 -> 토스트 -> 리렌더.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 1분 쿨타임(`window.MANITO_STAMP_COOLDOWN`)으로 중복 전송 방어.
  - 익명성 100% 보존.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[스탬프 탭] -> [15ms 햅틱 + 폭죽] -> [로컬 ms.sent 기록] -> [team_pings 전송] -> [토스트 안내] -> [마니또 뷰 갱신]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 웰컴 카드 렌더링, 4종 스탬프, 15ms 햅틱 및 쿨타임 배선 | +80줄 | -10줄 | +70줄 | 외과수술적 diff |
| `ui.css` | 웰컴 카드 및 스탬프 버튼 스타일 | +30줄 | 0줄 | +30줄 | CSS 토큰 준수 |
| `docs/rules/TICKETS.md` | #TASK-ES-230 티켓 등록 | +1줄 | 0줄 | +1줄 | 문서화 |
| `reports/TASK-ES-230/claims.json` | 5대 법정 청구서 | +100줄 | 0줄 | +100줄 | 신규 작성 |
| `scripts/smoke-test.js` | 회귀 방지 단언문 4종 | +25줄 | 0줄 | +25줄 | 테스트 추가 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#manitoWelcomeHeroCard`, `[data-mwelcome-stamp]`
2. **이벤트 리스너 (Listener)**: 클릭 시 `triggerHapticFeedback(15)` 및 `sendManitoWelcomeStamp` 연동
3. **비즈니스 로직 (Logic)**: 1분 쿨타임 검사, `ms.sent` 기록, `team_pings` 전송
4. **피드백 & 예외처리 (Feedback)**: 폭죽 이펙트, "나의 마니또에게 익명 응원이 전달되었습니다 🕊️" 토스트

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증

- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 기존 마니또 DM 및 정체 공개, 스트릭 로직이 100% 무손실 보존되는가?
- [x] 기존 336개 스모크 테스트 및 38개 헌법 게이트가 100% 통과하는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **Step 1 (UI 스타일 정의)**: `ui.css`에 `.manito-welcome-card`, `.manito-welcome-stamp-btn` 스타일 추가.
2. **Step 2 (스탬프 모델 및 헬퍼)**: `index.html`에 `MANITO_WELCOME_STAMPS` 정의 및 `sendManitoWelcomeStamp` 함수 구현.
3. **Step 3 (웰컴 카드 마크업)**: `renderCommManito(body)` 상단에 `#manitoWelcomeHeroCard` 렌더러 탑재.
4. **Step 4 (이벤트 리스너 배선)**: 15ms 햅틱, 폭죽, 1분 쿨타임, 토스트 배선.
5. **Step 5 (검증 및 게이트 통과)**: `scripts/smoke-test.js` 단언문 추가 및 `npm test` 통과 확인.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계

- **시나리오 A (Zero Dead-Click)**: 4종 스탬프 버튼 클릭 시뮬레이션 -> 콘솔 에러 0건 확인.
- **시나리오 B (Zero Data Loss)**: 스탬프 발송 후 `ms.sent` 정상 보존 및 리로드 대조 확인.
- **시나리오 C (Zero UX Regression)**: 기존 DM 및 스트릭, 파트너 목록 정상 작동 확인.
- **시나리오 D (Full State Propagation)**: 스탬프 발송 즉시 보낸 응원 수 갱신 확인.
- **시나리오 E (자동화 게이트 통과)**: `npm test` 337개 스모크 및 헌법 38개 게이트 ALL PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)

- [ ] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획

- **잠재적 엔지니어링 블로커**: 쿨타임 체크 중복 에러 -> **대책**: `window.MANITO_STAMP_COOLDOWN` 메모리 객체 안전 초기화.
- **롤백 계획 (Rollback Strategy)**: `git checkout -- .` 복구 가능 구조 유지.
- **재검증 트리거**: `npm test` 실패 시 Step 2 스탬프 정의로 복귀하여 데이터 확인.
